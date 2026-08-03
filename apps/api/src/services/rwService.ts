import { PrismaClient } from "@prisma/client";
import { notificationIntegrationService as notificationService } from "./notificationIntegrationService.js";

const prisma = new PrismaClient();

/**
 * Helper to retrieve all RtRwArea IDs under the same RW number and Kelurahan.
 */
async function getRwAreaIds(rtRwId: number): Promise<number[]> {
  const area = await prisma.rtRwArea.findUnique({ where: { id: rtRwId } });
  if (!area) return [rtRwId];

  const rwPart =
    area.name
      .split("/")
      .map((s) => s.trim())
      .find((s) => s.startsWith("RW")) || area.name;

  const matchingAreas = await prisma.rtRwArea.findMany({
    where: {
      kelurahanId: area.kelurahanId,
      name: { contains: rwPart },
    },
    select: { id: true },
  });

  return matchingAreas.length > 0 ? matchingAreas.map((a) => a.id) : [rtRwId];
}

export const rwService = {
  getDashboard: async (rtRwId: number) => {
    const areaIds = await getRwAreaIds(rtRwId);
    const bins = await prisma.bin.findMany({
      where: { rtRwId: { in: areaIds } },
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
    const areaIds = await getRwAreaIds(rtRwId);
    return prisma.bin.findMany({
      where: {
        rtRwId: { in: areaIds },
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
    const areaIds = await getRwAreaIds(rtRwId);
    return prisma.$transaction(async (tx) => {
      const bin = await tx.bin.findUnique({
        where: { id: binId },
        include: { user: true, qrBatch: { include: { assignedPic: true } } },
      });

      if (!bin || bin.status !== "PENDING_APPROVAL") {
        throw new Error("Bin tidak ditemukan atau status bukan PENDING_APPROVAL");
      }

      if (!bin.rtRwId || !areaIds.includes(bin.rtRwId)) {
        throw new Error("Bin ini tidak berada di wilayah RW Anda");
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
    const areaIds = await getRwAreaIds(rtRwId);
    const binCheck = await prisma.bin.findUnique({ where: { id: binId } });
    if (!binCheck || !binCheck.rtRwId || !areaIds.includes(binCheck.rtRwId)) {
      throw new Error("Bin tidak ditemukan atau tidak berada di wilayah RW Anda");
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

  getPendingPetugas: async (rtRwId: number) => {
    const areaIds = await getRwAreaIds(rtRwId);
    return prisma.petugasResidu.findMany({
      where: {
        OR: [{ whitelistStatus: "PENDING" }, { user: { status: "Pending" } }],
        user: { rtRwId: { in: areaIds } },
      },
      include: { user: true },
    });
  },

  verifyPetugas: async (petugasId: string, action: "APPROVED" | "REJECTED", rtRwId: number) => {
    const areaIds = await getRwAreaIds(rtRwId);
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
      throw new Error("Petugas tidak ditemukan");
    }
    if (!petugasCheck.user?.rtRwId || !areaIds.includes(petugasCheck.user.rtRwId)) {
      throw new Error("Petugas tidak terdaftar di wilayah RW Anda");
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
    } else if (action === "REJECTED") {
      await prisma.user.update({
        where: { id: petugas.userId },
        data: { status: "Inaktif" },
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
    const areaIds = await getRwAreaIds(rtRwId);
    return prisma.bin.findMany({
      where: { rtRwId: { in: areaIds }, status: "INACTIVE" },
      include: { user: true, category: true },
    });
  },

  markBinBroken: async (binId: string, userId: string, rtRwId: number) => {
    const areaIds = await getRwAreaIds(rtRwId);
    const binCheck = await prisma.bin.findUnique({ where: { id: binId } });
    if (!binCheck || !binCheck.rtRwId || !areaIds.includes(binCheck.rtRwId)) {
      throw new Error("Bin tidak ditemukan atau tidak berada di wilayah RW Anda");
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
    const areaIds = await getRwAreaIds(rtRwId);
    return prisma.ideDaurUlang.findMany({
      where: {
        statusApproval: "PENDING",
        user: { rtRwId: { in: areaIds } },
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
    const areaIds = await getRwAreaIds(rtRwId);
    return prisma.$transaction(async (tx) => {
      const ideCheck = await tx.ideDaurUlang.findUnique({
        where: { id: ideId },
        include: { user: true },
      });

      if (!ideCheck || !ideCheck.user.rtRwId || !areaIds.includes(ideCheck.user.rtRwId)) {
        throw new Error("Ide tidak ditemukan atau milik warga di luar wilayah RW Anda");
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
    const areaIds = await getRwAreaIds(rtRwId);
    return prisma.facility.findMany({
      where: { rtRwId: { in: areaIds }, statusApproval: "PENDING" },
    });
  },

  verifyFacility: async (facilityId: string, action: "APPROVED" | "REJECTED", rtRwId: number) => {
    const areaIds = await getRwAreaIds(rtRwId);
    const facilityCheck = await prisma.facility.findUnique({ where: { id: facilityId } });
    if (!facilityCheck || !facilityCheck.rtRwId || !areaIds.includes(facilityCheck.rtRwId)) {
      throw new Error("Fasilitas tidak ditemukan atau tidak berada di wilayah RW Anda");
    }

    return prisma.facility.update({
      where: { id: facilityId },
      data: { statusApproval: action },
    });
  },

  getFacilities: async (rtRwId: number) => {
    const areaIds = await getRwAreaIds(rtRwId);
    return prisma.facility.findMany({
      where: { rtRwId: { in: areaIds }, statusApproval: "APPROVED" },
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
    const areaIds = await getRwAreaIds(rtRwId);
    const facilityCheck = await prisma.facility.findUnique({ where: { id: facilityId } });
    if (!facilityCheck || !facilityCheck.rtRwId || !areaIds.includes(facilityCheck.rtRwId)) {
      throw new Error("Fasilitas tidak ditemukan atau tidak berada di wilayah RW Anda");
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
