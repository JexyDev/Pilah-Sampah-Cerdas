import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export class BinRepository {
    /**
     * Find bin by QR code
     */
    async findByQrCode(qrCode) {
        return prisma.bin.findUnique({
            where: { qrCode },
            include: {
                category: true
            }
        });
    }
    /**
     * Find all bins
     */
    async findAll() {
        return prisma.bin.findMany({
            include: {
                category: true,
            }
        });
    }
    /**
     * Find bin by ID
     */
    async findById(id) {
        return prisma.bin.findUnique({
            where: { id },
            include: {
                rtRw: true
            }
        });
    }
    /**
     * Update Bin volume
     */
    async updateVolume(binId, newVolume) {
        return prisma.bin.update({
            where: { id: binId },
            data: { currentVolumeLiter: newVolume }
        });
    }
    /**
     * Log waste deposit and point transaction transactionally
     */
    async recordScanTransaction(householdId, binId, categoryId, weightKg, volumeLiter, requestId, userId, pointsAwarded, categoryName) {
        return prisma.$transaction(async (tx) => {
            // 1. Create Waste Log
            const wasteLog = await tx.wasteLog.create({
                data: {
                    householdId,
                    binId,
                    weightKg,
                    volumeLiter,
                    categoryId,
                    requestId
                }
            });
            // 2. Create Point History
            const points = await tx.pointHistory.create({
                data: {
                    userId,
                    points: pointsAwarded,
                    description: `Disetor sampah ${categoryName} seberat ${weightKg} kg.`
                }
            });
            // 3. Create Notification
            const notification = await tx.notification.create({
                data: {
                    userId,
                    title: "Pencatatan Berhasil",
                    message: `Sampah seberat ${weightKg} kg berhasil dicatat. Anda mendapatkan ${pointsAwarded} poin!`
                }
            });
            return { wasteLog, points, notification };
        });
    }
    /**
     * Create overflow notification
     */
    async createOverflowNotification(userId, qrCode) {
        return prisma.notification.create({
            data: {
                userId,
                title: "Tong Sampah Penuh!",
                message: `Tong sampah ${qrCode} hampir meluap. Kapasitas maksimum terlampaui.`
            }
        });
    }
}
export const binRepository = new BinRepository();
