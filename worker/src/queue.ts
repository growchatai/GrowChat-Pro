import { Queue, Worker, Job } from 'bullmq'
import { Redis } from 'ioredis'
import { logger } from './logger'

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

export const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
})

// Queue for immediate message sending
export const messageQueue = new Queue('send-message', {
    connection: redis,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 500,
    },
})

// Queue for delayed messages (wait nodes in flows)
export const delayedQueue = new Queue('delayed-message', {
    connection: redis,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 500,
    },
})

// Rate limiter: track API calls per Instagram account
export async function checkRateLimit(
    igAccountId: string
): Promise<boolean> {
    const key = `rate_limit:${igAccountId}:${Math.floor(Date.now() / 3600000)}`
    const count = await redis.incr(key)
    if (count === 1) {
        await redis.expire(key, 3600) // 1 hour window
    }
    // Instagram allows ~200 messages per hour per account
    return count <= 190
}

// Idempotency: prevent processing same webhook twice
export async function isAlreadyProcessed(
    webhookId: string
): Promise<boolean> {
    const key = `processed:${webhookId}`
    const result = await redis.set(key, '1', 'EX', 86400, 'NX')
    return result === null // null means key existed (already processed)
}
