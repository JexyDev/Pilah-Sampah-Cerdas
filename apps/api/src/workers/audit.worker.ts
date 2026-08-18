import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { websocketService } from '../services/websocketService.js';

const prisma = new PrismaClient();

// Configuration for Redis connection
const connection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
};

let auditWorker: Worker | null = null;

try {
  auditWorker = new Worker(
    'audit-log-queue',
    async (job: Job) => {
      const { action, userId, roleName, featureCategory, endpoint, ipAddress, oldValue, newValue } = job.data;

      // Use a transaction to ensure we get the absolute latest hash and insert without race conditions
      await prisma.$transaction(async (tx) => {
        // 1. Get the last audit log to get the previousHash
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
        // Set isolation level to Serializable to strictly prevent race conditions during hash calculation
        isolationLevel: 'Serializable',
      });
    },
    { connection, concurrency: 1 } // concurrency: 1 ensures logs are processed strictly sequentially
  );

  auditWorker.on('completed', (_job) => {
    // Optional: Add debug logging if needed
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
