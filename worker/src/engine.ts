import { createClient } from '@supabase/supabase-js'
import { executeNode, ExecutionContext } from './executor'
import { isAlreadyProcessed } from './queue'
import { logger } from './logger'

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface IncomingMessage {
    senderId: string
    recipientId: string
    messageText?: string
    messageType: string
    timestamp: number
    webhookId: string
}

export async function processIncomingMessage(
    message: IncomingMessage,
    igAccountId: string
): Promise<void> {
    logger.info('Processing incoming message', {
        senderId: message.senderId,
        igAccountId,
    })

    // 1. Idempotency check - skip if already processed
    const alreadyProcessed = await isAlreadyProcessed(message.webhookId)
    if (alreadyProcessed) {
        logger.info('Message already processed, skipping', {
            webhookId: message.webhookId,
        })
        return
    }

    // 2. Get Instagram account and workspace
    const { data: igAccount } = await supabase
        .from('instagram_accounts')
        .select('*, workspaces(*)')
        .eq('ig_user_id', igAccountId)
        .eq('is_active', true)
        .single()

    if (!igAccount) {
        logger.warn('No active Instagram account found', { igAccountId })
        return
    }

    const workspace = igAccount.workspaces

    // 3. Check message limit for workspace plan
    if (
        workspace.messages_used_this_month >=
        workspace.monthly_message_limit
    ) {
        logger.warn('Workspace message limit reached', {
            workspaceId: workspace.id,
        })
        return
    }

    // 4. Get or create subscriber
    const subscriber = await getOrCreateSubscriber(
        message.senderId,
        igAccount.id,
        workspace.id
    )

    // 5. Get or create conversation
    const conversation = await getOrCreateConversation(
        subscriber.id,
        igAccount.id,
        workspace.id
    )

    // 6. Check if conversation is in human mode
    if (conversation.mode === 'human') {
        logger.info('Conversation in human mode, skipping automation', {
            conversationId: conversation.id,
        })
        // Still save the inbound message
        await saveInboundMessage(conversation.id, workspace.id, message)
        return
    }

    // 7. Save inbound message to Supabase
    await saveInboundMessage(conversation.id, workspace.id, message)

    // 8. Find matching active flows
    const matchingFlow = await findMatchingFlow(
        workspace.id,
        igAccount.id,
        message
    )

    if (!matchingFlow) {
        logger.info('No matching flow found for message', {
            messageText: message.messageText,
        })
        return
    }

    logger.info('Found matching flow', {
        flowId: matchingFlow.id,
        flowName: matchingFlow.name,
    })

    // 9. Execute the flow
    const context: ExecutionContext = {
        flowId: matchingFlow.id,
        workspaceId: workspace.id,
        subscriberId: subscriber.id,
        conversationId: conversation.id,
        recipientIgId: message.senderId,
        accessToken: igAccount.access_token,
        subscriber: {
            username: subscriber.username,
            full_name: subscriber.full_name,
        },
    }

    const nodes = matchingFlow.nodes || []
    const edges = matchingFlow.edges || []

    // Find the start/trigger node
    const startNode = nodes.find(
        (n: any) => n.type === 'trigger' || n.type === 'start'
    )

    if (!startNode) {
        logger.warn('No start node found in flow', { flowId: matchingFlow.id })
        return
    }

    // Get first action node connected to start
    const firstEdge = edges.find((e: any) => e.source === startNode.id)
    if (!firstEdge) return

    const firstNode = nodes.find((n: any) => n.id === firstEdge.target)
    if (!firstNode) return

    // Execute flow starting from first node
    await executeNode(firstNode, context, nodes, edges)

    // 10. Log automation execution
    await supabase.from('automation_logs').insert({
        workspace_id: workspace.id,
        flow_id: matchingFlow.id,
        subscriber_id: subscriber.id,
        conversation_id: conversation.id,
        trigger_type: matchingFlow.trigger_type,
        action_type: 'flow_executed',
        status: 'success',
        metadata: { message_text: message.messageText },
    })
}

async function findMatchingFlow(
    workspaceId: string,
    igAccountId: string,
    message: IncomingMessage
): Promise<any | null> {
    // Get all active flows for this account
    const { data: flows } = await supabase
        .from('flows')
        .select('*, keywords(*)')
        .eq('workspace_id', workspaceId)
        .eq('instagram_account_id', igAccountId)
        .eq('status', 'active')

    if (!flows || flows.length === 0) return null

    const messageText = (message.messageText || '').toLowerCase().trim()

    for (const flow of flows) {
        // Check trigger type
        if (flow.trigger_type === 'keyword_dm') {
            const keywords = flow.keywords || []
            for (const kw of keywords) {
                const keyword = kw.keyword.toLowerCase()
                const matchType = kw.match_type || 'exact'

                let matched = false
                if (matchType === 'exact') {
                    matched = messageText === keyword
                } else if (matchType === 'contains') {
                    matched = messageText.includes(keyword)
                } else if (matchType === 'starts_with') {
                    matched = messageText.startsWith(keyword)
                }

                if (matched) return flow
            }
        } else if (flow.trigger_type === 'first_dm') {
            // Check if this is subscriber's first message
            const { count } = await supabase
                .from('messages')
                .select('id', { count: 'exact' })
                .eq('conversation_id', message.senderId)
                .eq('direction', 'inbound')
            if ((count || 0) <= 1) return flow
        } else if (flow.trigger_type === 'story_mention') {
            if (message.messageType === 'story_mention') return flow
        } else if (flow.trigger_type === 'story_reply') {
            if (message.messageType === 'story_reply') return flow
        }
    }

    return null
}

async function getOrCreateSubscriber(
    igUserId: string,
    igAccountId: string,
    workspaceId: string
): Promise<any> {
    const { data: existing } = await supabase
        .from('subscribers')
        .select('*')
        .eq('ig_user_id', igUserId)
        .eq('workspace_id', workspaceId)
        .single()

    if (existing) {
        await supabase
            .from('subscribers')
            .update({ last_interaction_at: new Date().toISOString() })
            .eq('id', existing.id)
        return existing
    }

    const { data: newSubscriber } = await supabase
        .from('subscribers')
        .insert({
            workspace_id: workspaceId,
            instagram_account_id: igAccountId,
            ig_user_id: igUserId,
            username: igUserId,
            last_interaction_at: new Date().toISOString(),
        })
        .select()
        .single()

    return newSubscriber
}

async function getOrCreateConversation(
    subscriberId: string,
    igAccountId: string,
    workspaceId: string
): Promise<any> {
    const { data: existing } = await supabase
        .from('conversations')
        .select('*')
        .eq('subscriber_id', subscriberId)
        .eq('instagram_account_id', igAccountId)
        .single()

    if (existing) return existing

    const { data: newConversation } = await supabase
        .from('conversations')
        .insert({
            workspace_id: workspaceId,
            instagram_account_id: igAccountId,
            subscriber_id: subscriberId,
            status: 'open',
            mode: 'bot',
            last_message_at: new Date().toISOString(),
        })
        .select()
        .single()

    return newConversation
}

async function saveInboundMessage(
    conversationId: string,
    workspaceId: string,
    message: IncomingMessage
): Promise<void> {
    await supabase.from('messages').insert({
        conversation_id: conversationId,
        workspace_id: workspaceId,
        ig_message_id: message.webhookId,
        direction: 'inbound',
        message_type: message.messageType === 'text' ? 'text' : 'story_mention',
        content: message.messageText || '',
        created_at: new Date(message.timestamp).toISOString(),
    })

    await supabase
        .from('conversations')
        .update({
            last_message_at: new Date().toISOString(),
            last_message_preview: message.messageText?.slice(0, 100),
        })
        .eq('id', conversationId)
}
