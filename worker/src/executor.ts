import { createClient } from '@supabase/supabase-js'
import { sendInstagramMessage, personalizeMessage } from './instagram'
import { messageQueue, delayedQueue, checkRateLimit } from './queue'
import { logger } from './logger'

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface ExecutionContext {
    flowId: string
    workspaceId: string
    subscriberId: string
    conversationId: string
    recipientIgId: string
    accessToken: string
    subscriber: {
        username?: string
        full_name?: string
    }
}

export async function executeNode(
    node: any,
    context: ExecutionContext,
    allNodes: any[],
    allEdges: any[]
): Promise<void> {
    logger.info(`Executing node: ${node.type}`, { nodeId: node.id })

    switch (node.type) {
        case 'textMessage': {
            const canSend = await checkRateLimit(context.workspaceId)
            if (!canSend) {
                logger.warn('Rate limit reached for account', {
                    workspaceId: context.workspaceId,
                })
                return
            }

            const personalizedText = personalizeMessage(
                node.data?.content || '',
                context.subscriber
            )

            const result = await sendInstagramMessage({
                recipientIgId: context.recipientIgId,
                accessToken: context.accessToken,
                messageType: 'text',
                content: personalizedText,
            })

            // Log the sent message to Supabase
            if (result.success) {
                await supabase.from('messages').insert({
                    conversation_id: context.conversationId,
                    workspace_id: context.workspaceId,
                    ig_message_id: result.messageId,
                    direction: 'outbound',
                    message_type: 'text',
                    content: personalizedText,
                    flow_id: context.flowId,
                    delivered_at: new Date().toISOString(),
                })

                // Update workspace message count
                await supabase.rpc('increment_messages_used', {
                    workspace_id_input: context.workspaceId,
                })
            }
            break
        }

        case 'imageMessage': {
            await sendInstagramMessage({
                recipientIgId: context.recipientIgId,
                accessToken: context.accessToken,
                messageType: 'image',
                mediaUrl: node.data?.mediaUrl,
            })
            break
        }

        case 'quickReplies': {
            const personalizedText = personalizeMessage(
                node.data?.content || 'Choose an option:',
                context.subscriber
            )

            await sendInstagramMessage({
                recipientIgId: context.recipientIgId,
                accessToken: context.accessToken,
                messageType: 'quick_replies',
                content: personalizedText,
                quickReplies: node.data?.buttons || [],
            })
            break
        }

        case 'delay': {
            // Add to delayed queue instead of executing now
            const delayMs = calculateDelay(
                node.data?.amount || 1,
                node.data?.unit || 'minutes'
            )

            // Find next nodes after this delay
            const nextNodes = getNextNodes(node.id, allNodes, allEdges)

            for (const nextNode of nextNodes) {
                await delayedQueue.add(
                    'delayed-execution',
                    {
                        node: nextNode,
                        context,
                        allNodes,
                        allEdges,
                    },
                    { delay: delayMs }
                )
            }
            return // Don't continue execution immediately
        }

        case 'addTag': {
            const tag = node.data?.tag
            if (tag) {
                await supabase.rpc('add_subscriber_tag', {
                    subscriber_id_input: context.subscriberId,
                    tag_input: tag,
                })
            }
            break
        }

        case 'condition': {
            // Evaluate condition and follow correct branch
            const conditionMet = await evaluateCondition(
                node.data,
                context
            )
            const branch = conditionMet ? 'yes' : 'no'

            // Get edges for the correct branch
            const branchEdges = allEdges.filter(
                (e: any) =>
                    e.source === node.id &&
                    e.sourceHandle === branch
            )

            for (const edge of branchEdges) {
                const nextNode = allNodes.find((n: any) => n.id === edge.target)
                if (nextNode) {
                    await executeNode(nextNode, context, allNodes, allEdges)
                }
            }
            return
        }

        default:
            logger.warn(`Unknown node type: ${node.type}`)
    }

    // Continue to next connected nodes
    const nextNodes = getNextNodes(node.id, allNodes, allEdges)
    for (const nextNode of nextNodes) {
        await executeNode(nextNode, context, allNodes, allEdges)
    }
}

function getNextNodes(
    nodeId: string,
    allNodes: any[],
    allEdges: any[]
): any[] {
    const outgoingEdges = allEdges.filter(
        (e: any) => e.source === nodeId && !e.sourceHandle
    )
    return outgoingEdges
        .map((e: any) => allNodes.find((n: any) => n.id === e.target))
        .filter(Boolean)
}

function calculateDelay(amount: number, unit: string): number {
    const multipliers: Record<string, number> = {
        seconds: 1000,
        minutes: 60 * 1000,
        hours: 60 * 60 * 1000,
        days: 24 * 60 * 60 * 1000,
    }
    return amount * (multipliers[unit] || 60000)
}

async function evaluateCondition(
    conditionData: any,
    context: ExecutionContext
): Promise<boolean> {
    const { type, value } = conditionData || {}
    if (type === 'has_tag') {
        const { data: subscriber } = await supabase
            .from('subscribers')
            .select('tags')
            .eq('id', context.subscriberId)
            .single()
        return subscriber?.tags?.includes(value) || false
    }
    return false
}
