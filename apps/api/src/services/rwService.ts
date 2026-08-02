import { PrismaClient } from "@prisma/client";
import { notificationIntegrationService as notificationService } from "./notificationIntegrationService.js";

const prisma = new PrismaClient();

export const rwService = {
  getDashboard: async (rtRwId: number) => {
    const bins = await prisma.bin.findMany({
      where: { rtRwId },
      include: {
        category: true,
        user: { select: { name: true, address: true, phone: true } },
      },
    });

    const activeBins = bins.filter((b) => b.status === "ACTIVE_BOUND");
    const warningBins = activeBins.filter(
      (b) => Number(b.currentVolumeLiter) / Number(b.maxCapacityLiter) > 0.7
    );
    const fullBins = activeBins.filter(
      (b) => Number(b.currentVolumeLiter) / Number(b.maxCapacityLiter) >= 0.9
    );

    const totalKapasitas = activeBins.reduce((sum, b) => sum + Number(b.maxCapacityLiter), 0);
    const totalVolume = activeBins.reduce((sum, b) => sum + Number(b.currentVolumeLiter), 0);

    return {
      totalBins: bins.length,
      activeBins: activeBins.length,
      warningBins: warningBins.length,
      fullBins: fullBins.length,
      totalCapacityLiter: totalKapasitas,
      currentVolumeLiter: totalVolume,
      binsMap: bins.map((b) => ({
        id: b.id,
        qrCode: b.qrCode,
        latitude: b.latitude,
        longitude: b.longitude,
        status: b.status,
        category: b.category,
        capacity: Number(b.maxCapacityLiter),
        volume: Number(b.currentVolumeLiter),
        user: b.user,
      })),
    };
  },

  getPendingBins: async (rtRwId: number) => {
    return prisma.bin.findMany({
      where: {
        rtRwId,
        status: "PENDING_APPROVAL",
      },
      include: {
        category: true,
        user: true,
        qrBatch: {
          include: { assignedPic: true },
        },
      },
    });
  },

  approveBin: async (binId: string, rtRwId: number) => {
    return prisma.$transaction(async (tx) => {
      const bin = await tx.bin.findUnique({
        where: { id: binId },
        include: { user: true, qrBatch: { include: { assignedPic: true } } },
      });

      if (!bin || bin.status !== "PENDING_APPROVAL") {
        throw new Error("Bin not found or not in PENDING_APPROVAL status");
      }

      if (bin.rtRwId !== rtRwId) {
        throw new Error("Bin does not belong to your RW area");
      }

      const updatedBin = await tx.bin.update({
        where: { id: binId },
        data: { status: "ACTIVE_BOUND" },
      });

      // Bonus 10 poin ke warga
      if (bin.userId) {
        await tx.pointHistory.create({
          data: {
            userId: bin.userId,
            points: 10,
            description: "Aktivasi Bin disetujui RW",
            kategori: "PARTISIPASI_STREAK",
          },
        });
      }

      // Bonus 10 poin ke Mahasiswa KKN jika ada PIC
      if (bin.qrBatch?.assignedPicUserId) {
        await tx.pointHistory.create({
          data: {
            userId: bin.qrBatch.assignedPicUserId,
            points: 10,
            description: `Membantu aktivasi bin ${bin.qrCode}`,
            kategori: "PARTISIPASI_STREAK",
          },
        });
      }

      if (bin.user?.phone) {
        await notificationService.sendWhatsApp(
          bin.user.phone,
          `Pengajuan bin ${bin.qrCode} Anda telah disetujui oleh RW.`
        );
      }

      if (bin.qrBatch?.assignedPicUserId && bin.user) {
        const pic = await tx.user.findUnique({
          where: { id: bin.qrBatch.assignedPicUserId },
          select: { fcmToken: true },
        });
        if (pic?.fcmToken) {
          const { notificationIntegrationService } =
            await import("./notificationIntegrationService.js");
          await notificationIntegrationService
            .sendPushNotification(
              pic.fcmToken,
              "Poin Bertambah!",
              `Registrasi ${bin.user.name} berhasil diaktivasi, kamu dapat +10 poin`
            )
            .catch((e) => console.error("FCM Error in approveBin:", e));
        }
      }

      return updatedBin;
    });
  },

  rejectBin: async (binId: string, reason: string, rtRwId: number) => {
    const binCheck = await prisma.bin.findUnique({ where: { id: binId } });
    if (!binCheck || binCheck.rtRwId !== rtRwId) {
      throw new Error("Bin not found or does not belong to your RW area");
    }

    const bin = await prisma.bin.update({
      where: { id: binId },
      data: { status: "PRINTED", userId: null }, // Reset to PRINTED
      include: { user: true },
    });

    if (bin.user?.phone) {
      await notificationService.sendWhatsApp(
        bin.user.phone,
        `Pengajuan bin ${bin.qrCode} ditolak oleh RW. Alasan: ${reason}`
      );
    }
    return bin;
  },

  getPendingPetugas: async (_rtRwId: number) => {
    return prisma.petugasResidu.findMany({
      where: {
        OR: [{ whitelistStatus: "PENDING" }, { user: { status: "Pending" } }],
      },
      include: { user: true },
    });
  },

  verifyPetugas: async (petugasId: string, action: "APPROVED" | "REJECTED", _rtRwId: number) => {
    let petugasCheck = await prisma.petugasResidu.findUnique({
      where: { id: petugasId },
      include: { user: true },
    });
    if (!petugasCheck) {
      petugasCheck = await prisma.petugasResidu.findFirst({
        where: { userId: petugasId },
        include: { user: true },
      });
    }
    if (!petugasCheck) {
      throw new Error("Petugas not found");
    }

    const petugas = await prisma.petugasResidu.update({
      where: { id: petugasCheck.id },
      data: { whitelistStatus: action },
      include: { user: true },
    });

    if (action === "APPROVED") {
      await prisma.user.update({
        where: { id: petugas.userId },
        data: { status: "Aktif" },
      });
    }

    if (petugas.user?.phone && action === "APPROVED") {
      await notificationService
        .sendWhatsApp(
          petugas.user.phone,
          `Akun Petugas Residu Anda telah diverifikasi oleh RW dan kini AKTIF.`
        )
        .catch((e) => console.error("WhatsApp notification error:", e));
    }
    return petugas;
  },

  getInactiveBins: async (rtRwId: number) => {
    return prisma.bin.findMany({
      where: { rtRwId, status: "INACTIVE" },
      include: { user: true, category: true },
    });
  },

  markBinBroken: async (binId: string, userId: string, rtRwId: number) => {
    const binCheck = await prisma.bin.findUnique({ where: { id: binId } });
    if (!binCheck || binCheck.rtRwId !== rtRwId) {
      throw new Error("Bin not found or does not belong to your RW area");
    }

    const bin = await prisma.bin.update({
      where: { id: binId },
      data: { status: "BROKEN" },
    });

    await prisma.auditTrail.create({
      data: {
        action: "MARK_BIN_BROKEN",
        userId,
        newValue: { binId, status: "BROKEN" },
      },
    });

    return bin;
  },

  getPendingIde: async (rtRwId: number) => {
    // Ambil ide dari warga yang ada di RW tersebut
    return prisma.ideDaurUlang.findMany({
      where: {
        statusApproval: "PENDING",
        user: { rtRwId },
      },
      include: { user: true },
    });
  },

  verifyIde: async (
    ideId: string,
    action: "APPROVED" | "REJECTED",
    rwUserId: string,
    rtRwId: number
  ) => {
    return prisma.$transaction(async (tx) => {
      const ideCheck = await tx.ideDaurUlang.findUnique({
        where: { id: ideId },
        include: { user: true },
      });

      if (!ideCheck || ideCheck.user.rtRwId !== rtRwId) {
        throw new Error("Idea not found or does not belong to your RW area");
      }

      const ide = await tx.ideDaurUlang.update({
        where: { id: ideId },
        data: { statusApproval: action, approvedBy: rwUserId },
        include: { user: true },
      });

      if (action === "APPROVED") {
        await tx.pointHistory.create({
          data: {
            userId: ide.userId,
            points: 50,
            description: `Ide Daur Ulang '${ide.judul}' disetujui`,
            kategori: "IDE_DAUR_ULANG",
          },
        });

        await tx.socialFeed.create({
          data: {
            tipe: "RECYCLE_IDEA",
            deskripsi: `${ide.user.name} mengajukan ide daur ulang cemerlang: ${ide.judul}`,
            userId: ide.userId,
            entityId: ide.id,
          },
        });
      }

      return ide;
    });
  },

  getPendingFacilities: async (rtRwId: number) => {
    return prisma.facility.findMany({
      where: { rtRwId, statusApproval: "PENDING" },
    });
  },

  verifyFacility: async (facilityId: string, action: "APPROVED" | "REJECTED", rtRwId: number) => {
    const facilityCheck = await prisma.facility.findUnique({ where: { id: facilityId } });
    if (!facilityCheck || facilityCheck.rtRwId !== rtRwId) {
      throw new Error("Facility not found or does not belong to your RW area");
    }

    return prisma.facility.update({
      where: { id: facilityId },
      data: { statusApproval: action },
    });
  },

  getFacilities: async (rtRwId: number) => {
    return prisma.facility.findMany({
      where: { rtRwId, statusApproval: "APPROVED" },
      include: { productionLogs: true },
    });
  },

  inputFacilityProduction: async (
    facilityId: string,
    materialMasukKg: number,
    outputKg: number,
    jenisOutput: string,
    periode: string,
    rtRwId: number
  ) => {
    const facilityCheck = await prisma.facility.findUnique({ where: { id: facilityId } });
    if (!facilityCheck || facilityCheck.rtRwId !== rtRwId) {
      throw new Error("Facility not found or does not belong to your RW area");
    }

    return prisma.facilityProductionLog.create({
      data: {
        facilityId,
        materialMasukKg,
        outputKg,
        jenisOutput,
        periode,
      },
    });
  },
};
