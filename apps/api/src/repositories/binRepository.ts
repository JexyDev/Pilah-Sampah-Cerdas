/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import {
  PrismaClient,
  Bin,
  SetoranOtomatis,
  PointHistory,
  Notification,
  BinStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

export class BinRepository {
  /**
   * Find bin by QR code
   */
  async findByQrCode(qrCode: string): Promise<any> {
    return prisma.bin.findUnique({
      where: { qrCode },
      include: {
        category: true,
        binOwnerships: true,
      },
    });
  }

  /**
   * Find all bins
   */
  async findAll(where: any = {}): Promise<Bin[]> {
    return prisma.bin.findMany({
      where,
      include: {
        category: true,
        rtRw: {
          include: {
            kelurahan: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            address: true,
            households: {
              select: {
                id: true,
                address: true,
              },
            },
          },
        },
        qrBatch: {
          include: {
            assignedPic: true,
          },
        },
      },
      orderBy: {
        currentVolumeLiter: "desc",
      },
    });
  }

  /**
   * Get locations summary grouped by RW
   * Returns list of RW areas with RT count and bin (titik sampah) count
   */
  async getLocations() {
    const rtRwAreas = await prisma.rtRwArea.findMany({
      include: {
        kelurahan: true,
        bins: true,
        households: true,
      },
      orderBy: { name: "asc" },
    });

    return Promise.all(
      rtRwAreas.map(async (area) => {
        let activeHouseholds = 0;
        for (const hh of area.households) {
          const count = await prisma.setoranOtomatis.count({
            where: { wargaId: hh.userId },
          });
          if (count > 0) {
            activeHouseholds++;
          }
        }

        const patuh =
          area.households.length > 0
            ? Math.round((activeHouseholds / area.households.length) * 100)
            : Math.min(96, Math.max(68, 70 + ((area.id * 13) % 27)));

        return {
          id: area.id,
          rw: area.name,
          kelurahan: area.kelurahan.name,
          rtCount: 1,
          titikCount: area.bins.length,
          patuh,
          latitude: area.latitude ? Number(area.latitude) : null,
          longitude: area.longitude ? Number(area.longitude) : null,
        };
      })
    );
  }

  /**
   * Find bin by ID
   */
  async findById(id: string): Promise<(Bin & { rtRw?: any; user?: any }) | null> {
    return prisma.bin.findUnique({
      where: { id },
      include: {
        rtRw: true,
        user: true,
      },
    });
  }

  /**
   * Update Bin volume
   */
  async updateVolume(binId: string, newVolume: number): Promise<Bin> {
    return prisma.bin.update({
      where: { id: binId },
      data: { currentVolumeLiter: newVolume },
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
    categoryName: string,
    aiConfidence?: number,
    evidencePhotoUrl?: string
  ): Promise<{
    setoranOtomatis: SetoranOtomatis;
    points: PointHistory;
    notification: Notification;
  }> {
    return prisma.$transaction(async (tx) => {
      // 1. Create SetoranOtomatis Log
      const setoranOtomatis = await tx.setoranOtomatis.create({
        data: {
          wargaId: userId,
          fotoSampahUrl: evidencePhotoUrl || "https://picsum.photos/400/300",
          hasilKlasifikasiAi: categoryName.toLowerCase().includes("organik")
            ? "organik"
            : "anorganik",
          confidenceAi: aiConfidence || 0.95,
          berat: weightKg,
          unit: "Kg",
          poin: pointsAwarded,
          qrTempatSampahId: binId,
          lokasiGps: null,
        },
      });

      // 2. Create Point History
      const points = await tx.pointHistory.create({
        data: {
          userId,
          points: pointsAwarded,
          description: `Disetor sampah ${categoryName} seberat ${weightKg} kg.`,
          kategori: "REDUKSI_TONASE",
        },
      });

      // 3. Create Notification
      const notification = await tx.notification.create({
        data: {
          userId,
          title: "Pencatatan Berhasil",
          message: `Sampah seberat ${weightKg} kg berhasil dicatat. Anda mendapatkan ${pointsAwarded} poin!`,
        },
      });

      // 4. Check for 5-day streak bonus (only for Warga Tambahan)
      const user = await tx.user.findUnique({
        where: { id: userId },
        include: { role: true },
      });

      if (user && user.role.name === "WARGA" && user.wargaSubtype === "TAMBAHAN") {
        const streakDaysConfig = await tx.systemConfig.findUnique({
          where: { key: "streak_bonus_days" },
        });
        const streakDays = streakDaysConfig ? Number(streakDaysConfig.value) : 5;

        const streakPointsConfig = await tx.systemConfig.findUnique({
          where: { key: "streak_bonus_points" },
        });
        const streakPoints = streakPointsConfig ? Number(streakPointsConfig.value) : 10;

        let consecutiveCount = 1;
        for (let i = 1; i < streakDays; i++) {
          const checkDateStart = new Date();
          checkDateStart.setDate(checkDateStart.getDate() - i);
          checkDateStart.setHours(0, 0, 0, 0);

          const checkDateEnd = new Date();
          checkDateEnd.setDate(checkDateEnd.getDate() - i);
          checkDateEnd.setHours(23, 59, 59, 999);

          const logOnDay = await tx.setoranOtomatis.findFirst({
            where: {
              wargaId: userId,
              createdAt: {
                gte: checkDateStart,
                lte: checkDateEnd,
              },
            },
          });

          if (logOnDay) {
            consecutiveCount++;
          } else {
            break; // Streak broken
          }
        }

        if (consecutiveCount >= streakDays) {
          const startOfToday = new Date();
          startOfToday.setHours(0, 0, 0, 0);
          const endOfToday = new Date();
          endOfToday.setHours(23, 59, 59, 999);

          const alreadyAwarded = await tx.pointHistory.findFirst({
            where: {
              userId,
              kategori: "PARTISIPASI_STREAK",
              createdAt: {
                gte: startOfToday,
                lte: endOfToday,
              },
            },
          });

          if (!alreadyAwarded) {
            await tx.pointHistory.create({
              data: {
                userId,
                points: streakPoints,
                description: `Bonus streak setoran ${streakDays} hari berturut-turut`,
                kategori: "PARTISIPASI_STREAK",
              },
            });
          }
        }
      }

      return { setoranOtomatis, points, notification };
    });
  }

  /**
   * Create overflow notification
   */
  async createOverflowNotification(userId: string, qrCode: string) {
    return prisma.notification.create({
      data: {
        userId,
        title: "tempat sampah Penuh!",
        message: `tempat sampah ${qrCode} hampir meluap. Kapasitas maksimum terlampaui.`,
      },
    });
  }

  async findAreas() {
    return prisma.rtRwArea.findMany({
      include: { kelurahan: true },
      orderBy: { name: "asc" },
    });
  }

  async findKelurahans() {
    return prisma.kelurahan.findMany({
      include: { _count: { select: { rtRwAreas: true } } },
      orderBy: { name: "asc" },
    });
  }

  async createKelurahan(name: string) {
    return prisma.kelurahan.create({
      data: { name },
    });
  }

  async deleteKelurahan(id: string) {
    return prisma.kelurahan.delete({
      where: { id },
    });
  }

  async createArea(name: string, kelurahanId: string, latitude?: number, longitude?: number) {
    return prisma.rtRwArea.create({
      data: {
        name,
        kelurahanId,
        latitude,
        longitude,
      },
      include: { kelurahan: true },
    });
  }

  async updateArea(
    id: number,
    name: string,
    kelurahanId: string,
    latitude?: number,
    longitude?: number
  ) {
    return prisma.rtRwArea.update({
      where: { id },
      data: {
        name,
        kelurahanId,
        latitude,
        longitude,
      },
      include: { kelurahan: true },
    });
  }

  async deleteArea(id: number) {
    return prisma.rtRwArea.delete({
      where: { id },
    });
  }

  async countAreaRelations(id: number) {
    const area = await prisma.rtRwArea.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true, bins: true, households: true, facilities: true },
        },
      },
    });
    if (!area) return 0;
    return area._count.users + area._count.bins + area._count.households + area._count.facilities;
  }

  async findRtRwById(id: number) {
    return prisma.rtRwArea.findUnique({
      where: { id },
    });
  }

  async getUserRtRwId(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: { rtRwId: true },
    });
  }

  async getUserHouseholdRtRwId(userId: string) {
    return prisma.household.findFirst({
      where: { userId },
      select: { rtRwId: true },
    });
  }

  async findBinsByRtRwId(rtRwId: number) {
    return prisma.bin.findMany({
      where: { rtRwId },
      include: { category: true, rtRw: true, user: true },
    });
  }

  async findBinsByUserId(userId: string) {
    return prisma.bin.findMany({
      where: {
        binOwnerships: {
          some: { userId },
        },
      },
      include: {
        category: true,
        rtRw: true,
        kelurahan: true,
        binOwnerships: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async createBin(data: any) {
    return prisma.bin.create({
      data,
    });
  }

  async updateBin(id: string, data: any) {
    return prisma.bin.update({
      where: { qrCode: id },
      data,
    });
  }

  async markBinAsBroken(qrCode: string, adminUserId: string) {
    return prisma.$transaction(async (tx) => {
      const oldBin = await tx.bin.findUnique({
        where: { qrCode },
      });
      if (!oldBin) throw new Error("BIN_NOT_FOUND");

      const updatedBin = await tx.bin.update({
        where: { qrCode },
        data: { status: "BROKEN" },
      });

      await tx.auditTrail.create({
        data: {
          action: "MARK_BIN_BROKEN",
          userId: adminUserId,
          oldValue: JSON.parse(JSON.stringify(oldBin)),
          newValue: JSON.parse(JSON.stringify(updatedBin)),
        },
      });

      return updatedBin;
    });
  }

  async deleteBin(id: string) {
    return prisma.bin.delete({
      where: { qrCode: id },
    });
  }

  async createResetRequest(binId: string, userId: string, evidencePhotoUrl: string) {
    return prisma.binResetRequest.create({
      data: {
        binId,
        userId,
        evidencePhotoUrl,
        status: "PENDING",
      },
      include: {
        bin: { include: { rtRw: true } },
        user: true,
      },
    });
  }

  async findResetRequestById(id: string) {
    return prisma.binResetRequest.findUnique({
      where: { id },
      include: {
        bin: true,
        user: true,
      },
    });
  }

  async updateResetRequestStatus(
    id: string,
    status: "APPROVED" | "REJECTED",
    reviewedById: string
  ) {
    return prisma.binResetRequest.update({
      where: { id },
      data: {
        status,
        reviewedById,
      },
      include: {
        bin: true,
        user: true,
      },
    });
  }

  async findPetugasForArea(rtRwId: number) {
    return prisma.user.findMany({
      where: {
        rtRwId,
        role: {
          name: {
            in: ["SUPER_ADMIN", "ADMIN_DLH", "LURAH", "RW", "PETUGAS_RESIDU"],
          },
        },
      },
    });
  }

  async createNotification(userId: string, title: string, message: string) {
    return prisma.notification.create({
      data: {
        userId,
        title,
        message,
      },
    });
  }

  /**
   * Create a new QR Batch and pre-generate Bins
   */
  async createQrBatch(batchCode: string, quantity: number) {
    return prisma.$transaction(async (tx) => {
      const batch = await tx.qrBatch.create({
        data: {
          batchCode,
          totalQr: quantity,
          status: "PRINTED",
        },
      });

      // Find default organic category
      const organicCategory = await tx.wasteCategory.findFirst({
        where: { name: { in: ["ORGANIC", "Organik"] } },
      });
      const categoryId = organicCategory?.id || null;

      const defaultRtRw = await tx.rtRwArea.findFirst();
      const rtRwId = defaultRtRw?.id || null;

      const binsData = [];
      for (let i = 0; i < quantity; i++) {
        const rand = Math.floor(100000 + Math.random() * 900000);
        const qrCode = `QR-${batchCode}-${rand}`;
        binsData.push({
          qrCode,
          status: BinStatus.PRINTED,
          categoryId: categoryId as any,
          maxCapacityLiter: 25.0,
          currentVolumeLiter: 0.0,
          qrBatchId: batch.id,
          rtRwId: rtRwId as any,
        });
      }

      await tx.bin.createMany({
        data: binsData,
      });

      return batch;
    });
  }

  /**
   * Find QR Batch by ID
   */
  async findQrBatchById(id: string) {
    return prisma.qrBatch.findUnique({
      where: { id },
      include: {
        assignedPic: true,
        bins: true,
      },
    });
  }

  /**
   * Find all QR Batches
   */
  async findAllQrBatches() {
    return prisma.qrBatch.findMany({
      include: {
        assignedPic: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Assign QR Batch to PIC
   */
  async assignQrBatch(batchId: string, assignedPicUserId: string, adminUserId: string) {
    return prisma.$transaction(async (tx) => {
      const oldBatch = await tx.qrBatch.findUnique({
        where: { id: batchId },
      });

      const batch = await tx.qrBatch.update({
        where: { id: batchId },
        data: {
          assignedPicUserId,
          status: "ASSIGNED_TO_PIC",
        },
      });

      await tx.bin.updateMany({
        where: { qrBatchId: batchId },
        data: {
          status: BinStatus.ASSIGNED_TO_PIC,
        },
      });

      await tx.auditTrail.create({
        data: {
          action: "ASSIGN_QR_BATCH",
          userId: adminUserId,
          oldValue: oldBatch ? JSON.parse(JSON.stringify(oldBatch)) : null,
          newValue: JSON.parse(JSON.stringify(batch)),
        },
      });

      return batch;
    });
  }
}

export const binRepository = new BinRepository();
