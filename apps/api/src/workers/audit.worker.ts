import { Worker, Job } from 'bullmq';
import { prisma } from '../lib/prisma.js';
import crypto from 'crypto';
import { websocketService } from '../services/websocketService.js';

const getRedisConfig = () => {
  return {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    maxRetriesPerRequest: null,
  };
};

const connection = getRedisConfig();

let auditWorker: Worker | null = null;

try {
  auditWorker = new Worker(
    'audit-log-queue',
    async (job: Job) => {
      const { action, userId, roleName, featureCategory, endpoint, ipAddress, oldValue, newValue } = job.data;

      // Process audit hash and creation in transaction with ReadCommitted isolation
      await prisma.$transaction(async (tx) => {
        // 1. Get the last audit log to get the previousHash (using index on timestamp)
        const lastLog = await tx.auditTrail.findFirst({
          orderBy: { timestamp: 'desc' },
          select: { hash: true },
        });

        const previousHash = lastLog?.hash || 'GENESIS_HASH';

        // 2. Calculate the new hash
        const payloadString = JSON.stringify({
          action,
          userId,
          roleName,
          featureCategory,
          endpoint,
          ipAddress,
          oldValue,
          newValue,
          previousHash
        });

        const hash = crypto.createHash('sha256').update(payloadString).digest('hex');

        // 3. Insert the new audit log
        const newLog = await tx.auditTrail.create({
          data: {
            action,
            userId,
            roleName,
            featureCategory,
            endpoint,
            ipAddress,
            oldValue,
            newValue,
            hash,
            previousHash,
          },
        });

        // 4. Broadcast the new log via WebSocket
        websocketService.broadcastAuditLog(newLog);
      }, {
        isolationLevel: 'ReadCommitted',
      });
    },
    { connection, concurrency: 1 }
  );

  auditWorker.on('completed', (_job) => {
    // Audit log job completed
  });

  auditWorker.on('error', (err) => {
    console.warn(`[Audit Worker Error] ${err.message}`);
  });

  auditWorker.on('failed', (job, err) => {
    console.error(`[Audit Worker] Job ${job?.id} has failed with ${err.message}`);
  });
} catch (err: any) {
  console.warn(`[Audit Worker Init Warning] Failed to initialize audit worker: ${err.message}`);
}

export { auditWorker };
