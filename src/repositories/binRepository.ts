import { PrismaClient, Bin, WasteLog, PointHistory, Notification } from "@prisma/client";

const prisma = new PrismaClient();

export class BinRepository {
  /**
   * Find bin by QR code
   */
  async findByQrCode(qrCode: string): Promise<(Bin & { category: { name: string, pointsPerKg: number } }) | null> {
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
  async findAll(): Promise<Bin[]> {
    return prisma.bin.findMany({
      include: {
        category: true,
      }
    });
  }

  /**
   * Find bin by ID
   */
  async findById(id: string): Promise<(Bin & { rtRw?: any }) | null> {
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
  async updateVolume(binId: string, newVolume: number): Promise<Bin> {
    return prisma.bin.update({
      where: { id: binId },
      data: { currentVolumeLiter: newVolume }
    });
  }

  /**
   * Log waste deposit and point transaction transactionally
   */
  async recordScanTransaction(
    householdId: string,
    binId: string,
    categoryId: string,
    weightKg: number,
    volumeLiter: number,
    requestId: string,
    userId: string,
    pointsAwarded: number,
    categoryName: string
  ): Promise<{ wasteLog: WasteLog, points: PointHistory, notification: Notification }> {
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
  async createOverflowNotification(userId: string, qrCode: string) {
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
