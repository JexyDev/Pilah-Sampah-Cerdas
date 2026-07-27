/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { PrismaClient } from "@prisma/client";
import { configService } from "./configService.js";
import { hashPassword } from "../utils/hashUtils.js";

const prisma = new PrismaClient();

export class KknService {
  async getDashboardStats(userId: string) {
    const student = await prisma.studentKkn.findUnique({
      where: { userId },
      include: { assignedPolygon: true },
    });

    if (!student) {
      throw new Error("STUDENT_NOT_FOUND");
    }

    // Total registered bins from batches assigned to this KKN PIC
    const totalRegistered = await prisma.bin.count({
      where: {
        status: "ACTIVE_BOUND",
        qrBatch: {
          assignedPicUserId: userId,
        },
      },
    });

    const maxLimitStr = await configService.getConfig("kkn_max_assignment_per_student");
    const maxLimit = maxLimitStr ? parseInt(maxLimitStr, 10) : 100;
    const remainingQuota = Math.max(0, maxLimit - totalRegistered);
    const progressPct =
      maxLimit > 0 ? parseFloat(((totalRegistered / maxLimit) * 100).toFixed(1)) : 0;

    // KKN Points Contribution
    const pointsSum = await prisma.pointHistory.aggregate({
      where: { userId },
      _sum: { points: true },
    });
    const contributionPoints = pointsSum._sum.points || 0;

    return {
      studentKkn: {
        nim: student.nim,
        jurusan: student.jurusan,
        fakultas: student.fakultas,
        whitelistStatus: student.whitelistStatus,
        startDate: student.startDate,
        endDate: student.endDate,
        assignedArea: student.assignedPolygon?.name || "Belum ditentukan",
      },
      stats: {
        totalRegistered,
        maxLimit,
        remainingQuota,
        progressPct,
        contributionPoints,
      },
    };
  }



  async getRegisteredWarga(kknUserId: string, filters: { rtRwId?: number; search?: string }) {
    // We get warga whose bins belong to batches assigned to this KKN PIC
    const bins = await prisma.bin.findMany({
      where: {
        status: {
          in: ["ACTIVE_BOUND", "PENDING_APPROVAL"],
        },
        qrBatch: {
          assignedPicUserId: kknUserId,
        },
      },
      include: {
        user: {
          include: {
            rtRw: true,
            pointHistory: true,
            wargaViolations: true,
          },
        },
      },
    });

    let list = bins.map((b) => {
      const u = b.user;
      if (!u) return null;

      // Calculate simple compliance score: base 100, deduct for violations
      const violationsCount = u.wargaViolations.length;
      const complianceScore = Math.max(0, 100 - violationsCount * 15);

      return {
        wargaId: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        address: u.address,
        rtRw: u.rtRw?.name || "Belum diset",
        rtRwId: u.rtRwId,
        binCode: b.qrCode,
        binStatus: b.status,
        complianceScore,
        registeredAt: b.updatedAt,
      };
    });

    // filter nulls
    let result = list.filter((item): item is NonNullable<typeof item> => item !== null);

    // apply filters
    if (filters.rtRwId) {
      result = result.filter((item) => item.rtRwId === filters.rtRwId);
    }
    if (filters.search) {
      const s = filters.search.toLowerCase();
      result = result.filter(
        (item) => item.name.toLowerCase().includes(s) || item.binCode.toLowerCase().includes(s)
      );
    }

    return result;
  }

  async getWargaDetail(kknUserId: string, wargaId: string) {
    const warga = await prisma.user.findUnique({
      where: { id: wargaId },
      include: {
        rtRw: true,
        households: {
          include: {
            wasteLogs: {
              take: 5,
              orderBy: { createdAt: "desc" },
              include: { category: true },
            },
          },
        },
        binOwnerships: {
          include: {
            bin: {
              include: { category: true },
            },
          },
        },
      },
    });

    if (!warga) {
      throw new Error("WARGA_NOT_FOUND");
    }

    // Verify data scoping (must belong to batches assigned to this KKN PIC)
    const binsRegisteredByPic = await prisma.bin.count({
      where: {
        userId: wargaId,
        qrBatch: {
          assignedPicUserId: kknUserId,
        },
      },
    });

    if (binsRegisteredByPic === 0) {
      throw new Error("UNAUTHORIZED_ACCESS_SCOPE");
    }

    const defaultBin = warga.binOwnerships[0]?.bin;
    const recentLogs =
      warga.households[0]?.wasteLogs.map((log) => ({
        id: log.id,
        weightKg: Number(log.weightKg),
        volumeLiter: Number(log.volumeLiter),
        category: log.category.name,
        createdAt: log.createdAt,
      })) || [];

    return {
      wargaId: warga.id,
      name: warga.name,
      email: warga.email,
      phone: warga.phone,
      address: warga.address,
      rtRw: warga.rtRw?.name || "Belum diset",
      bin: defaultBin
        ? {
            qrCode: defaultBin.qrCode,
            category: defaultBin.category?.name || "UMUM",
            capacity: `${defaultBin.currentVolumeLiter}L / ${defaultBin.maxCapacityLiter}L`,
          }
        : null,
      recentLogs,
    };
  }

  async getUnregisteredHouses(kknUserId: string) {
    // Get assigned RT/RW polygon for this KKN student
    const student = await prisma.studentKkn.findUnique({
      where: { userId: kknUserId },
      include: { assignedPolygon: true },
    });

    if (!student || !student.assignedPolygonId) {
      return [];
    }

    // Mock unregistered houses list for the checklist feature inside their assigned RT/RW
    return [
      { id: "house-1", address: "Dago Giri No. 12", status: "BELUM_TERDAFTAR" },
      { id: "house-2", address: "Dago Giri No. 14A", status: "BELUM_TERDAFTAR" },
      { id: "house-3", address: "Dago Giri No. 17", status: "BELUM_TERDAFTAR" },
      { id: "house-4", address: "Dago Giri No. 22", status: "BELUM_TERDAFTAR" },
    ];
  }

  async getActivityLog(kknUserId: string) {
    return prisma.auditTrail.findMany({
      where: {
        userId: kknUserId,
        action: "REQUEST_ACTIVATE_BIN",
      },
      orderBy: { timestamp: "desc" },
      take: 10,
    });
  }



  async handover(fromKknUserId: string, toKknUserId: string, rtRwId: number, notes?: string) {
    return prisma.$transaction(async (tx) => {
      const batches = await tx.qrBatch.findMany({
        where: { assignedPicUserId: fromKknUserId },
      });

      for (const batch of batches) {
        await tx.qrBatch.update({
          where: { id: batch.id },
          data: { assignedPicUserId: toKknUserId },
        });
      }

      const handover = await tx.kknHandoverHistory.create({
        data: {
          fromUserId: fromKknUserId,
          toUserId: toKknUserId,
          rtRwId,
          notes,
        },
      });

      return handover;
    });
  }

  async bantuInputFasilitas(
    kknUserId: string,
    data: {
      userId: string;
      rtRwId: number;
      nama: string;
      jenis: any;
      longitude: number;
      latitude: number;
      foto?: string;
    }
  ) {
    const facility = await prisma.facility.create({
      data: {
        nama: data.nama,
        jenis: data.jenis,
        pic: data.userId, // Warga's name or ID
        latitude: data.latitude,
        longitude: data.longitude,
        rtRwId: data.rtRwId,
        foto: data.foto,
        statusApproval: "PENDING",
      },
    });

    await prisma.pointHistory.create({
      data: {
        userId: kknUserId,
        points: 5,
        description: `Bantu warga input fasilitas GIS: ${data.nama}`,
        kategori: "PARTISIPASI_STREAK",
      },
    });

    return facility;
  }
}

export const kknService = new KknService();
