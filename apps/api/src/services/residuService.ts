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
        rtRw: {
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

    const rtRwStr = user.rtRw?.name || petugas.assignedZone || "01/02";
    const kelurahanStr = user.rtRw?.kelurahan?.name || "Bojongsoang";
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
      petugas.assignedZone ||
      (rtRwStr ? `${rtRwStr}, Kel. ${kelurahanStr}` : "Kecamatan Coblong");

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
      rtRw: rtRwStr,
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

  async getRiwayat(petugasUserId: string) {
    const logs = await prisma.setoranManual.findMany({
      where: { petugasResiduId: petugasUserId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        rw: true,
      },
    });

    return logs.map((log) => ({
      id: log.id,
      logId: log.id,
      diinputOleh: log.diinputOleh,
      berat: Number(log.berat),
      actualWeightKg: Number(log.berat),
      unit: log.unit,
      kategori: log.kategori,
      classification: log.kategori,
      fotoResiduUrl: log.fotoResiduUrl,
      imagePhotoUrl: log.fotoResiduUrl,
      rwName: log.rw?.name || "RW Area",
      createdAt: log.createdAt.toISOString(),
      timestamp: log.createdAt.toISOString(),
    }));
  }

  async getAnalytics() {
    const trend = [
      { date: "Mon", weightKg: 120 },
      { date: "Tue", weightKg: 140 },
      { date: "Wed", weightKg: 90 },
      { date: "Thu", weightKg: 150 },
      { date: "Fri", weightKg: 180 },
      { date: "Sat", weightKg: 110 },
      { date: "Sun", weightKg: 95 },
    ];

    const zones = [
      { id: 1, region: "RW 06 Dago", complianceScore: 85, violationsCount: 2 },
      { id: 2, region: "RW 02 Cigadung", complianceScore: 60, violationsCount: 8 },
      { id: 3, region: "RW 01 Coblong", complianceScore: 45, violationsCount: 14 },
    ];

    return {
      trend,
      zones,
    };
  }

  async submitLog(
    petugasUserId: string,
    data: {
      actualWeightKg: number;
      classification?: string;
      imagePhotoUrl?: string;
      rtRw?: string;
      kelurahan?: string;
      notes?: string;
      logId?: string; // fallback if updating existing log
    }
  ) {
    const user = await prisma.user.findUnique({
      where: { id: petugasUserId },
      include: { rtRw: true },
    });

    if (!user) throw new Error("PETUGAS_NOT_FOUND");

    let targetRwId = user.rtRwId;

    if (!targetRwId && data.rtRw) {
      const foundRw = await prisma.rtRwArea.findFirst({
        where: { name: { contains: data.rtRw } },
      });
      if (foundRw) targetRwId = foundRw.id;
    }

    if (!targetRwId) {
      const firstRw = await prisma.rtRwArea.findFirst();
      targetRwId = firstRw?.id || 1;
    }

    const weightKg = Number(data.actualWeightKg) || 0;
    const pointRateConfig = await configService.getConfig("point_rate_per_kg");
    const pointRatePerKg = pointRateConfig ? parseInt(pointRateConfig, 10) : 2;
    const pointsEarned = Math.round(weightKg * pointRatePerKg);

    const setoran = await prisma.setoranManual.create({
      data: {
        petugasResiduId: petugasUserId,
        diinputOleh: user.name,
        rwId: targetRwId,
        fotoResiduUrl: data.imagePhotoUrl || "/uploads/default-residu.jpg",
        berat: weightKg,
        unit: "Kg",
        kategori: data.classification || "residu",
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

    return {
      logId: setoran.id,
      weightKg: Number(weightKg.toFixed(1)),
      pointsEarned,
      globalBinTotalKg: Number(globalBinTotalKg.toFixed(1)),
      timestamp: setoran.createdAt.toISOString(),
    };
  }
}

export const residuService = new ResiduService();
