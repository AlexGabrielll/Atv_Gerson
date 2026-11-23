import 'dotenv/config';
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { generateReport } from './analytics/service';
import { prisma } from './db';
import { reportQueueName } from './queue';

async function main() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) throw new Error('REDIS_URL nao configurada.');

  const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });
  const worker = new Worker(
    reportQueueName,
    async (job) => {
      const result = await generateReport(job.data.organizationId, job.data.type);
      await prisma.analyticsReport.update({
        where: { id: job.data.reportId },
        data: {
          status: 'COMPLETED',
          resultJson: JSON.stringify(result),
          completedAt: new Date(),
          errorMessage: null
        }
      });
      return result;
    },
    { connection }
  );

  worker.on('failed', async (job, error) => {
    if (!job) return;
    const failedPermanently = job.attemptsMade >= Number(job.opts.attempts ?? 1);
    if (failedPermanently) {
      await prisma.analyticsReport.update({
        where: { id: job.data.reportId },
        data: { status: 'FAILED', errorMessage: error.message, completedAt: new Date() }
      });
    }
  });

  const shutdown = async () => {
    await worker.close();
    await connection.quit();
    await prisma.$disconnect();
  };
  process.on('SIGINT', () => void shutdown());
  process.on('SIGTERM', () => void shutdown());
}

void main();
