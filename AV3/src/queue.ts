import { Queue } from 'bullmq';
import IORedis from 'ioredis';

export const reportQueueName = 'greencode-analytics-reports';

let connection: IORedis | undefined;
let queue: Queue | undefined;

function getConnection(): IORedis {
  if (!connection) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) throw new Error('REDIS_URL nao configurada.');
    connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });
  }
  return connection;
}

export function getReportQueue(): Queue {
  if (!queue) {
    queue = new Queue(reportQueueName, { connection: getConnection() });
  }
  return queue;
}
