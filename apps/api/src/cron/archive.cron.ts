import { prisma } from "../lib/prisma.js";
import cron from 'node-cron';


// Run at 00:00 on the 1st of every month
export const archiveAuditLogsCron = cron.schedule('0 0 1 * *', async () => {
  console.log('[Cron] Starting Audit Log Archiving Process...');

  try {
    // 1. Find all logs older than 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const oldLogs = await prisma.auditTrail.findMany({
      where: {
        timestamp: {
          lt: ninetyDaysAgo,
        },
      },
    });

    if (oldLogs.length === 0) {
      console.log('[Cron] No audit logs to archive.');
      return;
    }

    // 2. Use a transaction to safely move data
    await prisma.$transaction(async (tx) => {
      // Insert into archive table
      await tx.auditTrailArchive.createMany({
        data: oldLogs.map((log) => ({
          id: log.id,
          action: log.action,
          userId: log.userId,
          roleName: log.roleName,
          featureCategory: log.featureCategory,
          endpoint: log.endpoint,
          ipAddress: log.ipAddress,
          timestamp: log.timestamp,
          oldValue: log.oldValue as any, // casting json for prisma createMany
          newValue: log.newValue as any,
          hash: log.hash,
          previousHash: log.previousHash,
          archivedAt: new Date(),
        })),
        skipDuplicates: true,
      });

      // Delete from main table
      const idsToDelete = oldLogs.map(l => l.id);
      await tx.auditTrail.deleteMany({
        where: {
          id: { in: idsToDelete },
        },
      });
    });

    console.log(`[Cron] Successfully archived ${oldLogs.length} audit logs.`);
  } catch (error) {
    console.error('[Cron] Failed to archive audit logs:', error);
  }
}, { timezone: 'Asia/Jakarta' });
