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
      nim: student.nim,
      jurusan: student.jurusan,
      totalRegisteredBins: totalRegistered,
      contributionPoints,
      assignmentLimit: maxLimit,
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
            setoranOtomatis: { take: 5, orderBy: { createdAt: "desc" } }
          },
        },
      },
    });

    let list = bins.map((b) => {
      const u = b.user;
      if (!u) return null;

      const recentLogs = u.setoranOtomatis.map((log: any) => ({
        weightKg: Number(log.berat),
        category: log.hasilKlasifikasiAi === "organik" ? "Organik" : "Anorganik",
        isCorrect: true // Assuming AI overrides correctly for MVP or check logic if needed
      }));

      return {
        binId: b.qrCode,
        wargaName: u.name,
        address: u.address,
        isActivated: true,
        recentLogs,
        // for filters
        rtRwId: u.rtRwId,
        binCode: b.qrCode
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
        (item) => item.wargaName.toLowerCase().includes(s) || item.binCode.toLowerCase().includes(s)
      );
    }

    return result;
  }

  async getWargaDetail(kknUserId: string, wargaId: string) {
    const warga = (await prisma.user.findUnique({
      where: { id: wargaId },
      include: {
        rtRw: true,
        setoranOtomatis: {
          take: 5,
          orderBy: { createdAt: "desc" },
          include: { bin: true },
        },
        binOwnerships: {
          include: {
            bin: {
              include: { category: true },
            },
          },
        },
      },
    })) as any;

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
      warga.setoranOtomatis.map((log: any) => ({
        id: log.id,
        weightKg: Number(log.berat),
        volumeLiter: 0,
        category: log.hasilKlasifikasiAi === "organik" ? "Organik" : "Anorganik",
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

  async getWargaList(kknUserId: string, filters: { status?: string; kelurahan?: string; rtRwId?: number; search?: string }) {
    const where: any = { role: { name: "WARGA" } };
    
    if (filters.status === "UNACTIVATED") {
      where.binOwnerships = { none: {} };
    }
    if (filters.rtRwId) {
      where.rtRwId = filters.rtRwId;
    }
    if (filters.search) {
      where.name = { contains: filters.search, mode: "insensitive" };
    }

    const warga = await prisma.user.findMany({ where, select: { id: true, name: true, address: true } });
    return warga.map((w: any) => ({ id: w.id, wargaId: w.id, nama: w.name, alamat: w.address }));
  }

  async activateWargaBin(wargaId: string, binOrganikId: string, binAnorganikId: string, kknUserId: string) {
    return prisma.$transaction(async (tx) => {
      const bins = await tx.bin.findMany({
        where: { qrCode: { in: [binOrganikId, binAnorganikId] } }
      });
      
      if (bins.length !== 2) throw new Error("Satu atau kedua Bin tidak ditemukan");
      for (const bin of bins) {
        if (!["PRINTED", "BELUM_DIGUNAKAN", "PENDING_APPROVAL"].includes(bin.status)) {
          throw new Error(`Bin ${bin.qrCode} sudah terdaftar atau digunakan`);
        }
      }

      await tx.bin.updateMany({
        where: { qrCode: { in: [binOrganikId, binAnorganikId] } },
        data: { userId: wargaId, status: "ACTIVE_BOUND", registeredByStudentId: kknUserId }
      });
      
      for (const bin of bins) {
        await tx.binOwnership.create({
          data: { userId: wargaId, binId: bin.id, type: "UTAMA" }
        });
      }

      await tx.pointHistory.create({
        data: { userId: kknUserId, points: 25, description: "Aktivasi Bin Warga" }
      });
    });
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
