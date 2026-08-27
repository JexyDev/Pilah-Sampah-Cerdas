import { Queue } from 'bullmq';

const getRedisConfig = () => {
  return {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    maxRetriesPerRequest: null,
  };
};

const connection = getRedisConfig();

let auditQueue: Queue | null = null;

try {
  auditQueue = new Queue('audit-log-queue', { connection });
} catch (err: any) {
  console.warn(`[Audit Queue Init Warning] Failed to initialize audit queue: ${err.message}`);
}

export { auditQueue };
