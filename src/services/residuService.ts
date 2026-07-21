/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
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
    if (!data.evidencePhotoUrl) {
      throw new Error("FOTO_BUKTI_WAJIB");
    }

    const bin = await prisma.bin.findUnique({
      where: { qrCode: data.binQrCode },
      include: {
        binOwnerships: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!bin) {
      throw new Error("BIN_NOT_FOUND");
    }

    const ownerOwnership = bin.binOwnerships.find((o) => o.type === "UTAMA");
    const citizen = ownerOwnership?.user;
    if (!citizen) {
      throw new Error("CITIZEN_NOT_FOUND_FOR_BIN");
    }

    // Retrieve penalty multiplier
    const basePenaltyStr = await configService.getConfig("residu_penalty_multiplier");
    const basePenalty = basePenaltyStr ? Math.abs(parseInt(basePenaltyStr, 10)) : 50;

    let multiplier = 1;
    if (data.severity === "MEDIUM") multiplier = 2;
    if (data.severity === "SEVERE") multiplier = 3;
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
          evidencePhotoUrl: data.evidencePhotoUrl,
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
        `Halo ${citizen.name}, petugas residu mendeteksi residu tercampur di tong sampah Anda (${data.type}). Mohon pastikan memilah sampah organik dan anorganik dengan benar. Poin Anda berkurang -${pointsToDeduct}.`
      );
    }

    return result;
  }

  async getDashboardSummary(petugasUserId: string) {
    const petugas = await prisma.petugasResidu.findUnique({
      where: { userId: petugasUserId },
    });

    if (!petugas) {
      throw new Error("PETUGAS_NOT_FOUND");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalViolationsToday = await prisma.violation.count({
      where: {
        petugasUserId,
        createdAt: {
          gte: today,
        },
      },
    });

    // Recent violations recorded by this petugas
    const recentViolations = await prisma.violation.findMany({
      where: { petugasUserId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        user: true,
        bin: true,
      },
    });

    return {
      kpiScore: Number(petugas.kpiScore),
      assignedZone: petugas.assignedZone || "Semua Zona",
      totalViolationsToday,
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

  async getAnalytics() {
    // Volume aggregate over time (mocked representation of aggregate query)
    const trend = [
      { date: "Mon", weightKg: 120 },
      { date: "Tue", weightKg: 140 },
      { date: "Wed", weightKg: 90 },
      { date: "Thu", weightKg: 150 },
      { date: "Fri", weightKg: 180 },
      { date: "Sat", weightKg: 110 },
      { date: "Sun", weightKg: 95 },
    ];

    // Compliance heatmap zones
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
}

export const residuService = new ResiduService();
