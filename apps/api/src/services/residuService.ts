/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { PrismaClient } from "@prisma/client";
import { configService } from "./configService.js";
import { notificationIntegrationService } from "./notificationIntegrationService.js";

const prisma = new PrismaClient();

export class ResiduService {
  async recordViolation(
    petugasUserId: string,
    data: {
      binQrCode: string;
      type: string;
      severity: string;
      evidencePhotoUrl: string;
      notes?: string;
    }
  ) {
    if (!data.evidencePhotoUrl && !data.binQrCode) {
      throw new Error("FOTO_BUKTI_DAN_QR_WAJIB");
    }

    const bin = await prisma.bin.findUnique({
      where: { qrCode: data.binQrCode },
      include: {
        binOwnerships: {
          include: {
            user: true,
          },
        },
        user: true,
      },
    });

    if (!bin) {
      throw new Error("BIN_NOT_FOUND");
    }

    const ownerOwnership = bin.binOwnerships.find((o) => o.type === "UTAMA");
    const citizen = ownerOwnership?.user || bin.user;
    if (!citizen) {
      throw new Error("CITIZEN_NOT_FOUND_FOR_BIN");
    }

    // Retrieve penalty multiplier
    const basePenaltyStr = await configService.getConfig("residu_penalty_multiplier");
    const basePenalty = basePenaltyStr ? Math.abs(parseInt(basePenaltyStr, 10)) : 50;

    let multiplier = 1;
    if (data.severity === "MEDIUM" || data.severity === "SEDANG") multiplier = 2;
    if (data.severity === "SEVERE" || data.severity === "TINGGI") multiplier = 3;
    const pointsToDeduct = basePenalty * multiplier;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Violation record
      const violation = await tx.violation.create({
        data: {
          userId: citizen.id,
          binId: bin.id,
          petugasUserId,
          type: data.type,
          severity: data.severity,
          evidencePhotoUrl: data.evidencePhotoUrl || "/uploads/default-violation.jpg",
          notes: data.notes || null,
          pointsDeducted: pointsToDeduct,
        },
      });

      // 2. Deduct Citizen Points (Insert negative PointHistory)
      await tx.pointHistory.create({
        data: {
          userId: citizen.id,
          points: -pointsToDeduct,
          description: `Penalti pelanggaran residu tercampur (${data.severity}): ${data.type}`,
          kategori: "REDUKSI_TONASE",
        },
      });

      // 3. Create In-App Notification for Citizen
      await tx.notification.create({
        data: {
          userId: citizen.id,
          title: "Peringatan Pemilahan Sampah",
          message: `Ditemukan ketidakpatuhan pemilahan sampah (${data.type}) dengan tingkat keparahan ${data.severity}. Poin Anda dipotong ${pointsToDeduct}. Harap pilah sampah dengan benar demi kelestarian lingkungan.`,
        },
      });

      return violation;
    });

    // 4. Send WhatsApp warning (Mock)
    if (citizen.phone) {
      await notificationIntegrationService.sendWhatsApp(
        citizen.phone,
        `Halo ${citizen.name}, petugas residu mendeteksi residu tercampur di tempat sampah Anda (${data.type}). Mohon pastikan memilah sampah organik dan anorganik dengan benar. Poin Anda berkurang -${pointsToDeduct}.`
      );
    }

    return {
      id: result.id,
      violationId: result.id,
      status: "DIPROSES",
      severity: result.severity,
      type: result.type,
      pointsDeducted: result.pointsDeducted,
      createdAt: result.createdAt,
    };
  }

  async getDashboardSummary(petugasUserId: string, _period: string = "hari") {
    const user = await prisma.user.findUnique({
      where: { id: petugasUserId },
      include: {
        rw: {
          include: {
            kelurahan: true,
          },
        },
        petugasProfile: true,
      },
    });

    if (!user) {
      throw new Error("PETUGAS_NOT_FOUND");
    }

    let petugas = user.petugasProfile;
    if (!petugas) {
      petugas = await prisma.petugasResidu.create({
        data: {
          userId: petugasUserId,
          nama: user.name,
          noWa: user.phone || "-",
          whitelistStatus: "APPROVED",
          assignedZone: "Semua Zona",
        },
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Today's setoran manual
    const todayLogs = await prisma.setoranManual.findMany({
      where: {
        petugasResiduId: petugasUserId,
        createdAt: { gte: today },
      },
    });

    // Monthly setoran manual
    const monthlyLogs = await prisma.setoranManual.findMany({
      where: {
        petugasResiduId: petugasUserId,
        createdAt: { gte: startOfMonth },
      },
    });

    const todayWeightKg = todayLogs.reduce((sum, item) => sum + Number(item.berat), 0);
    const monthlyWeightKg = monthlyLogs.reduce((sum, item) => sum + Number(item.berat), 0);
    const todayEntries = todayLogs.length;

    // Aggregate petugas points
    const pointsSum = await prisma.pointHistory.aggregate({
      where: { userId: petugasUserId },
      _sum: { points: true },
    });

    const pointRateConfig = await configService.getConfig("point_rate_per_kg");
    const pointRatePerKg = pointRateConfig ? parseInt(pointRateConfig, 10) : 2;

    const rtRwStr = user.rw?.name || petugas.assignedZone || "01/02";
    const kelurahanStr = user.rw?.kelurahan?.name || "Bojongsoang";
    const petugasIdStr = `PTR-${petugas.id.slice(0, 6).toUpperCase()}`;

    const totalViolationsToday = await prisma.violation.count({
      where: {
        petugasUserId,
        createdAt: { gte: today },
      },
    });

    const recentViolations = await prisma.violation.findMany({
      where: { petugasUserId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        user: true,
        bin: true,
      },
    });

    const totalJadwalCount = await prisma.bin.count();
    const totalJadwal = totalJadwalCount > 0 ? totalJadwalCount : 12;

    const zoneLabel =
      petugas.assignedZone || (rtRwStr ? `${rtRwStr}, Kel. ${kelurahanStr}` : "Kecamatan Coblong");

    return {
      // Mobile Flutter model exact keys
      petugasId: petugasIdStr,
      name: user.name,
      assignedZone: zoneLabel,
      totalJadwal,
      sudahDiambil: todayEntries,
      pelanggaranCount: totalViolationsToday,
      totalWeightKg: Number(todayWeightKg.toFixed(1)),
      ketepatanWaktuScore: Number(petugas.kpiScore) || 95,
      akurasiScore: 90,

      // Additional & legacy metadata for compatibility
      rw: rtRwStr,
      kelurahan: kelurahanStr,
      todayWeightKg: Number(todayWeightKg.toFixed(1)),
      monthlyWeightKg: Number(monthlyWeightKg.toFixed(1)),
      todayEntries,
      totalPoints: pointsSum._sum.points || 0,
      pointRatePerKg,
      kpiScore: Number(petugas.kpiScore),
      totalViolationsToday,
      tugasSelesaiHariIni: todayEntries,
      recentViolations: recentViolations.map((v) => ({
        id: v.id,
        wargaName: v.user.name,
        binCode: v.bin?.qrCode || "N/A",
        type: v.type,
        severity: v.severity,
        pointsDeducted: v.pointsDeducted,
        createdAt: v.createdAt,
      })),
    };
  }

  async getRiwayat(petugasUserId: string, _range?: string, type?: string) {
    const logs: any[] = [];

    // 1. Fetch Violations (Pelanggaran)
    if (!type || type === "SEMUA" || type === "PELANGGARAN") {
      const violations = await prisma.violation.findMany({
        where: { petugasUserId },
        include: {
          user: true,
          bin: true,
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      });

      logs.push(
        ...violations.map((v) => ({
          id: v.id,
          logId: v.id,
          title: "Pelanggaran Timbangan",
          classification: v.type,
          kategori: v.type,
          binId: v.binId || "N/A",
          binCode: v.bin?.qrCode || "N/A",
          wargaName: v.user?.name || "Warga",
          weightKg: 0,
          actualWeightKg: 0,
          points: 0, // Pelanggaran tidak dapat poin
          latitude: null,
          longitude: null,
          status: "TERKIRIM",
          timestamp: v.createdAt.toISOString(),
          createdAt: v.createdAt.toISOString(),
        }))
      );
    }

    // 2. Fetch Setoran Otomatis (Tempat Sampah Pintar)
    if (!type || type === "SEMUA" || type === "SETORAN") {
      const setoranOtomatis = await prisma.setoranOtomatis.findMany({
        where: {
          bin: {
            rw: {
              petugasResiduId: petugasUserId,
            },
          },
        },
        include: {
          bin: true,
          warga: true,
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      });

      logs.push(
        ...setoranOtomatis.map((s) => {
          let lat: number | null = null,
            long: number | null = null;
          if (s.lokasiGps) {
            const parts = s.lokasiGps.split(",");
            if (parts.length === 2) {
              const pLat = parseFloat(parts[0].trim());
              const pLong = parseFloat(parts[1].trim());
              if (!isNaN(pLat)) lat = pLat;
              if (!isNaN(pLong)) long = pLong;
            }
          }
          return {
            id: s.id,
            logId: s.id,
            title: "Setoran Timbangan",
            classification: s.hasilKlasifikasiAi || "Residu",
            kategori: s.hasilKlasifikasiAi || "Residu",
            binId: s.qrTempatSampahId,
            binCode: s.bin?.qrCode || "N/A",
            wargaName: s.warga?.name || "Warga",
            weightKg: Number(s.berat),
            actualWeightKg: Number(s.berat),
            points: s.poin ? Number(s.poin) : 0, // Ambil dari DB
            latitude: lat,
            longitude: long,
            status: "TERKIRIM",
            timestamp: s.createdAt.toISOString(),
            createdAt: s.createdAt.toISOString(),
          };
        })
      );

      // 3. Fetch Setoran Manual (Input Petugas Residu Hilir)
      const setoranManual = await prisma.setoranManual.findMany({
        where: { petugasResiduId: petugasUserId },
        include: { rw: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      });

      logs.push(
        ...setoranManual.map((s) => {
          let lat: number | null = null,
            long: number | null = null;
          if (s.lokasiGps) {
            const parts = s.lokasiGps.split(",");
            if (parts.length === 2) {
              const pLat = parseFloat(parts[0].trim());
              const pLong = parseFloat(parts[1].trim());
              if (!isNaN(pLat)) lat = pLat;
              if (!isNaN(pLong)) long = pLong;
            }
          }
          return {
            id: s.id,
            logId: s.id,
            title: "Setoran Manual Residu",
            classification: s.kategori || "Residu",
            kategori: s.kategori || "Residu",
            binId: "GLOBAL_BIN",
            binCode: "Bin Global RT/RW",
            wargaName: "Global",
            weightKg: Number(s.berat),
            actualWeightKg: Number(s.berat),
            points: Number(s.berat) * 2 + (s.fotoResiduUrl ? 10 : 0), // Berat * 2 + bonus foto 10
            fotoResiduUrl: s.fotoResiduUrl,
            imagePhotoUrl: s.fotoResiduUrl,
            latitude: lat,
            longitude: long,
            status: "TERKIRIM",
            timestamp: s.createdAt.toISOString(),
            createdAt: s.createdAt.toISOString(),
          };
        })
      );
    }

    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return logs;
  }

  async getAnalytics() {
    // 1. Trend: 7 Days Setoran Manual
    const today = new Date();
    const trend = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const startOfDay = new Date(d.setHours(0, 0, 0, 0));
      const endOfDay = new Date(d.setHours(23, 59, 59, 999));

      const sum = await prisma.setoranManual.aggregate({
        where: { createdAt: { gte: startOfDay, lte: endOfDay } },
        _sum: { berat: true },
      });

      trend.push({
        date: dayNames[startOfDay.getDay()],
        weightKg: Number(sum._sum.berat || 0),
      });
    }

    // 2. Zones Compliance
    const allRw = await prisma.rw.findMany({
      include: { kelurahan: true },
      take: 5,
    });

    const zones = await Promise.all(
      allRw.map(async (rw) => {
        const violationsCount = await prisma.violation.count({
          where: { bin: { rwId: rw.id } },
        });

        // Mock compliance score calculation based on violations
        const complianceScore = Math.max(0, 100 - violationsCount * 5);

        return {
          id: rw.id,
          region: `${rw.name} ${rw.kelurahan?.name ? rw.kelurahan.name : ""}`,
          complianceScore,
          violationsCount,
        };
      })
    );

    return {
      trend,
      zones,
    };
  }

  async submitLog(
    petugasUserId: string,
    data: {
      actualWeightKg: number | string;
      classification?: string;
      imagePhotoUrl?: string;
      rw?: string;
      kelurahan?: string;
      notes?: string;
      logId?: string;
      binId?: string;
      latitude?: number | string;
      longitude?: number | string;
    }
  ) {
    const weightKg = Number(data.actualWeightKg) || 0;
    if (weightKg <= 0 || weightKg > 500) {
      throw new Error("Timbangan tidak valid. Harap masukkan angka antara 0.1 kg hingga 500 kg.");
    }
    const user = await prisma.user.findUnique({
      where: { id: petugasUserId },
      include: { rw: true, petugasProfile: true },
    });

    if (!user) throw new Error("PETUGAS_NOT_FOUND");

    let targetRwId = user.rwId;

    if (!targetRwId) {
      const assignedRw = await prisma.rw.findFirst({
        where: { petugasResiduId: petugasUserId },
      });
      if (assignedRw) {
        targetRwId = assignedRw.id;
      }
    }

    if (!targetRwId && data.rw) {
      const foundRw = await prisma.rw.findFirst({
        where: { name: { contains: data.rw } },
      });
      if (foundRw) targetRwId = foundRw.id;
    }

    if (!targetRwId) {
      const firstRw = await prisma.rw.findFirst();
      if (firstRw) {
        targetRwId = firstRw.id;
      } else {
        throw new Error("NO_RW_AREA_ASSIGNED");
      }
    }

    const lokasiGps =
      data.latitude && data.longitude ? `${data.latitude}, ${data.longitude}` : null;

    const pointRateConfig = await configService.getConfig("point_rate_per_kg");
    const pointRatePerKg = pointRateConfig ? parseInt(pointRateConfig, 10) : 2;
    const pointsEarned = Math.round(weightKg * pointRatePerKg) + (data.imagePhotoUrl ? 10 : 0);

    const setoran = await prisma.setoranManual.create({
      data: {
        petugasResiduId: petugasUserId,
        diinputOleh: user.name,
        rwId: targetRwId,
        fotoResiduUrl: data.imagePhotoUrl || "/uploads/default-residu.jpg",
        berat: weightKg,
        unit: "Kg",
        kategori: data.classification || "Residu",
        lokasiGps: lokasiGps,
      },
    });

    if (pointsEarned > 0) {
      await prisma.pointHistory.create({
        data: {
          userId: petugasUserId,
          points: pointsEarned,
          description: `Setoran timbangan residu global: ${weightKg} kg`,
          kategori: "SUBMIT_RESIDU",
        },
      });
    }

    const globalSum = await prisma.setoranManual.aggregate({
      _sum: { berat: true },
    });
    const globalBinTotalKg = Number(globalSum._sum.berat || 0);

    const latNum = data.latitude ? parseFloat(String(data.latitude)) : null;
    const longNum = data.longitude ? parseFloat(String(data.longitude)) : null;

    return {
      logId: setoran.id,
      id: setoran.id,
      userId: petugasUserId,
      petugasUserId: petugasUserId,
      berat: weightKg,
      weightKg: Number(weightKg.toFixed(1)),
      classification: data.classification || "Residu",
      kategori: data.classification || "Residu",
      lokasiGps: lokasiGps,
      latitude: latNum,
      longitude: longNum,
      pointsEarned,
      points: pointsEarned,
      globalBinTotalKg: Number(globalBinTotalKg.toFixed(1)),
      kpiScore: (user.petugasProfile?.kpiScore
        ? Number(user.petugasProfile.kpiScore)
        : 100
      ).toFixed(2),
      isPunctual: true,
      discrepancyStatus: "NONE",
      status: "TERKIRIM",
      timestamp: setoran.createdAt.toISOString(),
    };
  }

  async getPengajuanResetBin() {
    return prisma.binResetRequest.findMany({
      where: { status: "PENDING" },
      include: {
        bin: { include: { category: true, rw: true } },
        user: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async acceptPengajuanResetBin(id: string, petugasUserId: string) {
    return prisma.$transaction(async (tx) => {
      const request = await tx.binResetRequest.findUnique({
        where: { id },
      });

      if (!request) {
        throw new Error("PENGAJUAN_NOT_FOUND");
      }

      if (request.status !== "PENDING") {
        throw new Error("PERMINTAAN_SUDAH_DIAMBIL");
      }

      const updated = await tx.binResetRequest.update({
        where: { id },
        data: {
          status: "IN_PROGRESS",
          reviewedById: petugasUserId,
        },
      });

      return updated;
    });
  }
}

export const residuService = new ResiduService();
