import { Queue } from 'bullmq';

const getRedisConfig = () => {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    try {
      const parsed = new URL(redisUrl);
      return { host: parsed.hostname, port: parseInt(parsed.port || '6379', 10) };
    } catch {
      // fallback
    }
  }
  return {
    host: process.env.REDIS_HOST || (process.env.NODE_ENV === 'production' ? 'redis' : '127.0.0.1'),
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
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
