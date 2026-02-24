import axios from 'axios'
import { logger } from './logger'

const IG_API_BASE = 'https://graph.instagram.com/v21.0'

export interface SendMessageParams {
    recipientIgId: string
    accessToken: string
    messageType: 'text' | 'image' | 'video' | 'quick_replies'
    content?: string
    mediaUrl?: string
    quickReplies?: Array<{ title: string; payload: string }>
}

export async function sendInstagramMessage(
    params: SendMessageParams
): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
        const { recipientIgId, accessToken, messageType, content, mediaUrl, quickReplies } = params

        let messagePayload: any = {
            recipient: { id: recipientIgId },
        }

        if (messageType === 'text') {
            messagePayload.message = { text: content }
        } else if (messageType === 'image' && mediaUrl) {
            messagePayload.message = {
                attachment: {
                    type: 'image',
                    payload: { url: mediaUrl, is_reusable: true },
                },
            }
        } else if (messageType === 'video' && mediaUrl) {
            messagePayload.message = {
                attachment: {
                    type: 'video',
                    payload: { url: mediaUrl, is_reusable: true },
                },
            }
        } else if (messageType === 'quick_replies' && quickReplies) {
            messagePayload.message = {
                text: content,
                quick_replies: quickReplies.map((qr) => ({
                    content_type: 'text',
                    title: qr.title,
                    payload: qr.payload,
                })),
            }
        }

        logger.info('Sending Instagram message', {
            recipientIgId,
            messageType,
        })

        const response = await axios.post(
            `${IG_API_BASE}/me/messages`,
            messagePayload,
            {
                params: { access_token: accessToken },
                headers: { 'Content-Type': 'application/json' },
            }
        )

        logger.info('Message sent successfully', {
            messageId: response.data.message_id,
        })

        return {
            success: true,
            messageId: response.data.message_id,
        }
    } catch (error: any) {
        const errorMessage = error.response?.data?.error?.message || error.message
        logger.error('Failed to send Instagram message', { error: errorMessage })
        return { success: false, error: errorMessage }
    }
}

export async function reactToMessage(
    mediaId: string,
    reaction: string,
    accessToken: string
): Promise<boolean> {
    try {
        await axios.post(
            `${IG_API_BASE}/me/messages`,
            {
                recipient: { id: mediaId },
                sender_action: 'react',
                payload: { reaction },
            },
            { params: { access_token: accessToken } }
        )
        return true
    } catch (error: any) {
        logger.error('Failed to react to message', { error: error.message })
        return false
    }
}

export function personalizeMessage(
    template: string,
    subscriber: { username?: string; full_name?: string }
): string {
    return template
        .replace(/{{username}}/g, subscriber.username || 'there')
        .replace(/{{first_name}}/g, subscriber.full_name?.split(' ')[0] || 'there')
        .replace(/{{full_name}}/g, subscriber.full_name || 'there')
}
