/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
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

  async registerWarga(
    kknUserId: string,
    data: {
      qrCodeOrganic: string;
      qrCodeInorganic: string;
      name: string;
      email: string;
      phone: string;
      address: string;
      nik?: string;
      rtRwId: number;
      latitude?: number;
      longitude?: number;
      maxCapacityLiter?: number;
    }
  ) {
    // GPS now comes from claimQr, but we can accept it if re-sent
    const student = await prisma.studentKkn.findUnique({
      where: { userId: kknUserId },
    });
    if (!student) {
      throw new Error("STUDENT_NOT_FOUND");
    }
    if (student.whitelistStatus !== "APPROVED") {
      throw new Error("KKN_STUDENT_NOT_APPROVED");
    }
    // Check KKN registration threshold/limit
    const totalRegistered = await prisma.bin.count({
      where: {
        status: "ACTIVE_BOUND",
        qrBatch: {
          assignedPicUserId: kknUserId,
        },
      },
    });

    const maxLimitStr = await configService.getConfig("kkn_max_assignment_per_student");
    const maxLimit = maxLimitStr ? parseInt(maxLimitStr, 10) : 100;

    if (totalRegistered >= maxLimit) {
      throw new Error("KKN_ASSIGNMENT_LIMIT_EXCEEDED");
    }

    // Validate Organic Bin
    const binOrg = await prisma.bin.findUnique({
      where: { qrCode: data.qrCodeOrganic },
      include: { qrBatch: true },
    });
    if (!binOrg) throw new Error("ORGANIC_BIN_NOT_FOUND");
    if (binOrg.status !== "ASSIGNED_TO_PIC") throw new Error("ORGANIC_BIN_MUST_BE_CLAIMED_FIRST");
    if (binOrg.qrBatch?.assignedPicUserId !== kknUserId) throw new Error("ORGANIC_BIN_BATCH_PIC_MISMATCH");

    // Validate Inorganic Bin
    const binIno = await prisma.bin.findUnique({
      where: { qrCode: data.qrCodeInorganic },
      include: { qrBatch: true },
    });
    if (!binIno) throw new Error("INORGANIC_BIN_NOT_FOUND");
    if (binIno.status !== "ASSIGNED_TO_PIC") throw new Error("INORGANIC_BIN_MUST_BE_CLAIMED_FIRST");
    if (binIno.qrBatch?.assignedPicUserId !== kknUserId) throw new Error("INORGANIC_BIN_BATCH_PIC_MISMATCH");

    // Check if NIK already used
    if (data.nik) {
      const existingUser = await prisma.user.findUnique({ where: { nik: data.nik } });
      if (existingUser) {
        throw new Error("NIK_ALREADY_USED");
      }
    }

    // Check if email already used
    const existingEmail = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingEmail) {
      throw new Error("EMAIL_ALREADY_USED");
    }

    const roleWarga = await prisma.role.findFirst({ where: { name: "WARGA" } });
    if (!roleWarga) {
      throw new Error("ROLE_WARGA_NOT_FOUND");
    }

    const hashedPassword = await hashPassword("password123");

    // Perform inside transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Citizen User
      const newWarga = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
          nik: data.nik || null,
          roleId: roleWarga.id,
          rtRwId: data.rtRwId,
          phone: data.phone,
          address: data.address,
          wargaSubtype: "UTAMA",
        },
      });

      // 2. Create Household for coordinate mapping
      const newHousehold = await tx.household.create({
        data: {
          userId: newWarga.id,
          address: data.address,
          rtRwId: data.rtRwId,
          latitude: data.latitude ?? -6.88923,
          longitude: data.longitude ?? 107.6105,
        },
      });

      // 3. Bind the bins to citizen
      await tx.bin.updateMany({
        where: { id: { in: [binOrg.id, binIno.id] } },
        data: {
          status: "PENDING_APPROVAL",
          userId: newWarga.id,
          rtRwId: data.rtRwId,
          maxCapacityLiter: data.maxCapacityLiter || 25.0, // default 25kg
          latitude: data.latitude ?? binOrg.latitude,
          longitude: data.longitude ?? binOrg.longitude,
        },
      });

      // 4. Create Bin Ownerships
      await tx.binOwnership.createMany({
        data: [
          { binId: binOrg.id, userId: newWarga.id, type: "UTAMA" },
          { binId: binIno.id, userId: newWarga.id, type: "UTAMA" },
        ],
      });

      // 5. Audit log activation request with Mahasiswa GPS location
      await tx.auditTrail.create({
        data: {
          action: "REQUEST_ACTIVATE_BIN",
          userId: kknUserId,
          oldValue: { qrCodes: [binOrg.qrCode, binIno.qrCode] } as any,
          newValue: { 
            qrCodes: [binOrg.qrCode, binIno.qrCode], 
            status: "PENDING_APPROVAL", 
            ownerUserId: newWarga.id,
            kknLocation: { latitude: data.latitude, longitude: data.longitude }
          } as any,
        },
      });

      return { newWarga, newHousehold };
    });

    return result;
  }

  async getRegisteredWarga(kknUserId: string, filters: { rtRwId?: number; search?: string }) {
    // We get warga whose bins belong to batches assigned to this KKN PIC
    const bins = await prisma.bin.findMany({
      where: {
        status: "ACTIVE_BOUND",
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

  async claimQr(kknUserId: string, qrCode: string, latitude: number, longitude: number) {
    const bin = await prisma.bin.findUnique({
      where: { qrCode },
      include: { qrBatch: true }
    });
    if (!bin) throw new Error("BIN_NOT_FOUND");
    if (bin.status !== "PRINTED") throw new Error("BIN_NOT_AVAILABLE");
    
    // Assign bin to pic if it has qr batch
    const updatedBin = await prisma.$transaction(async (tx) => {
      // Create new batch if needed or use existing
      let batchId = bin.qrBatchId;
      if (!batchId) {
        const batch = await tx.qrBatch.create({
          data: {
            batchCode: `BATCH-${Date.now()}`,
            assignedPicUserId: kknUserId,
            status: "DISTRIBUTED",
            totalQr: 1
          }
        });
        batchId = batch.id;
      } else if (bin.qrBatch?.assignedPicUserId !== kknUserId) {
         // Reassign if no pic
         await tx.qrBatch.update({
           where: { id: batchId },
           data: { assignedPicUserId: kknUserId }
         });
      }

      return tx.bin.update({
        where: { id: bin.id },
        data: {
          status: "ASSIGNED_TO_PIC",
          latitude,
          longitude,
          qrBatchId: batchId
        }
      });
    });

    return updatedBin;
  }

  async handover(fromKknUserId: string, toKknUserId: string, rtRwId: number, notes?: string) {
    return prisma.$transaction(async (tx) => {
      const batches = await tx.qrBatch.findMany({
        where: { assignedPicUserId: fromKknUserId }
      });
      
      for (const batch of batches) {
        await tx.qrBatch.update({
          where: { id: batch.id },
          data: { assignedPicUserId: toKknUserId }
        });
      }

      const handover = await tx.kknHandoverHistory.create({
        data: {
          fromUserId: fromKknUserId,
          toUserId: toKknUserId,
          rtRwId,
          notes
        }
      });

      return handover;
    });
  }

  async bantuInputFasilitas(kknUserId: string, data: { userId: string, rtRwId: number, nama: string, jenis: any, longitude: number, latitude: number }) {
    const facility = await prisma.facility.create({
      data: {
        nama: data.nama,
        jenis: data.jenis,
        pic: data.userId, // Warga's name or ID
        latitude: data.latitude,
        longitude: data.longitude,
        rtRwId: data.rtRwId,
        statusApproval: "PENDING",
      }
    });
    
    await prisma.pointHistory.create({
      data: {
        userId: kknUserId,
        points: 5,
        description: `Bantu warga input fasilitas GIS: ${data.nama}`,
        kategori: "PARTISIPASI_STREAK"
      }
    });

    return facility;
  }
}

export const kknService = new KknService();
