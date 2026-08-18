import { prisma } from "../lib/prisma.js";

export async function logStatusHistory(
  entityType: "USER" | "BIN" | "WASTE_LOG" | "DISPATCH_TASK" | "BIN_RESET",
  entityId: string,
  oldStatus: string,
  newStatus: string,
  changedByUserId: string,
  reason?: string
) {
  if (oldStatus === newStatus) return;

  try {
    await prisma.auditTrail.create({
      data: {
        action: `CHANGE_STATUS_${entityType}`,
        userId: changedByUserId,
        oldValue: { status: oldStatus },
        newValue: { status: newStatus, reason },
      },
    });
  } catch (error) {
    console.error("Failed to log status history:", error);
  }
}
