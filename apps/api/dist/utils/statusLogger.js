import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export async function logStatusHistory(entityType, entityId, oldStatus, newStatus, changedByUserId, reason) {
    if (oldStatus === newStatus)
        return;
    try {
        await prisma.auditTrail.create({
            data: {
                action: `CHANGE_STATUS_${entityType}`,
                userId: changedByUserId,
                oldValue: { status: oldStatus },
                newValue: { status: newStatus, reason },
            },
        });
    }
    catch (error) {
        console.error("Failed to log status history:", error);
    }
}
