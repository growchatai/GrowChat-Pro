import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import { handleVerification, handleWebhook } from './webhook'
import { Worker } from 'bullmq'
import { redis } from './queue'
import { executeNode } from './executor'
import { logger } from './logger'

const app = express()
const PORT = process.env.WORKER_PORT || 3001

// Parse JSON body for webhook payloads
app.use(express.json())

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'growchat-worker',
    })
})

// Root route
app.get('/', (req, res) => {
    res.json({
        service: 'growchat-worker',
        version: '1.0.0',
        status: 'running',
    })
})

// Instagram webhook routes
app.get('/webhook/instagram', handleVerification)
app.post('/webhook/instagram', handleWebhook)

// Process delayed message jobs
const delayedWorker = new Worker(
    'delayed-message',
    async (job) => {
        const { node, context, allNodes, allEdges } = job.data
        logger.info('Processing delayed job', { jobId: job.id })
        await executeNode(node, context, allNodes, allEdges)
    },
    { connection: redis }
)

delayedWorker.on('completed', (job) => {
    logger.info('Delayed job completed', { jobId: job.id })
})

delayedWorker.on('failed', (job, err) => {
    logger.error('Delayed job failed', { jobId: job?.id, error: err.message })
})

app.listen(PORT, () => {
    logger.info(`GrowChat Worker running on port ${PORT}`)
    logger.info('Waiting for Instagram webhooks...')
})

export default app
