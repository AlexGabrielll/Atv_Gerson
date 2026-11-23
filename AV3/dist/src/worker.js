"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const service_1 = require("./analytics/service");
const db_1 = require("./db");
const queue_1 = require("./queue");
async function main() {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl)
        throw new Error('REDIS_URL nao configurada.');
    const connection = new ioredis_1.default(redisUrl, { maxRetriesPerRequest: null });
    const worker = new bullmq_1.Worker(queue_1.reportQueueName, async (job) => {
        const result = await (0, service_1.generateReport)(job.data.organizationId, job.data.type);
        await db_1.prisma.analyticsReport.update({
            where: { id: job.data.reportId },
            data: {
                status: 'COMPLETED',
                resultJson: JSON.stringify(result),
                completedAt: new Date(),
                errorMessage: null
            }
        });
        return result;
    }, { connection });
    worker.on('failed', async (job, error) => {
        if (!job)
            return;
        const failedPermanently = job.attemptsMade >= Number(job.opts.attempts ?? 1);
        if (failedPermanently) {
            await db_1.prisma.analyticsReport.update({
                where: { id: job.data.reportId },
                data: { status: 'FAILED', errorMessage: error.message, completedAt: new Date() }
            });
        }
    });
    const shutdown = async () => {
        await worker.close();
        await connection.quit();
        await db_1.prisma.$disconnect();
    };
    process.on('SIGINT', () => void shutdown());
    process.on('SIGTERM', () => void shutdown());
}
void main();
