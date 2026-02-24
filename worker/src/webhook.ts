import { Request, Response } from 'express'
import crypto from 'crypto'
import { processIncomingMessage } from './engine'
import { logger } from './logger'

// Verify Instagram webhook signature
function verifySignature(
    payload: string,
    signature: string,
    appSecret: string
): boolean {
    const expectedSignature = crypto
        .createHmac('sha256', appSecret)
        .update(payload)
        .digest('hex')
    return `sha256=${expectedSignature}` === signature
}

// GET: Instagram webhook verification (one-time setup)
export function handleVerification(req: Request, res: Response): void {
    const mode = req.query['hub.mode']
    const token = req.query['hub.verify_token']
    const challenge = req.query['hub.challenge']

    const verifyToken = process.env.WEBHOOK_VERIFY_TOKEN || 'growchat_verify_2024'

    if (mode === 'subscribe' && token === verifyToken) {
        logger.info('Webhook verified successfully')
        res.status(200).send(challenge)
    } else {
        logger.error('Webhook verification failed')
        res.sendStatus(403)
    }
}

// POST: Incoming Instagram events
export async function handleWebhook(
    req: Request,
    res: Response
): Promise<void> {
    // Always respond 200 immediately
    // Instagram will retry if it doesn't get 200 quickly
    res.sendStatus(200)

    const signature = req.headers['x-hub-signature-256'] as string
    const rawBody = JSON.stringify(req.body)

    // Verify signature if app secret is configured
    if (process.env.INSTAGRAM_APP_SECRET) {
        if (!verifySignature(rawBody, signature, process.env.INSTAGRAM_APP_SECRET)) {
            logger.error('Invalid webhook signature')
            return
        }
    }

    const body = req.body

    if (body.object !== 'instagram') {
        logger.warn('Non-Instagram webhook received', { object: body.object })
        return
    }

    // Process each entry
    for (const entry of body.entry || []) {
        const igAccountId = entry.id

        for (const event of entry.messaging || []) {
            try {
                const senderId = event.sender?.id
                const message = event.message

                if (!senderId || !message) continue

                // Skip messages sent by the bot itself
                if (senderId === igAccountId) continue

                const incomingMessage = {
                    senderId,
                    recipientId: event.recipient?.id,
                    messageText: message.text,
                    messageType: message.attachments?.[0]?.type || 'text',
                    timestamp: event.timestamp,
                    webhookId: `${senderId}_${event.timestamp}`,
                }

                // Process async - don't await (already sent 200)
                processIncomingMessage(incomingMessage, igAccountId).catch(
                    (err) => logger.error('Error processing message', { error: err.message })
                )
            } catch (err: any) {
                logger.error('Error handling webhook event', { error: err.message })
            }
        }

        // Handle comment triggers
        for (const change of entry.changes || []) {
            if (change.field === 'comments') {
                logger.info('Comment event received', { change: change.value })
                // TODO: implement comment trigger in v1.1
            }
        }
    }
}
