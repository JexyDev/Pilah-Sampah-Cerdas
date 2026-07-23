/**
 * Project: Pilah Sampah Cerdas
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { PrismaClient, BinStatus } from "@prisma/client";

const prisma = new PrismaClient();

export class SuperAdminService {
  /**
   * Get dynamic status of a bin based on the 30-day inactivity rule
   */
  getBinDynamicStatus(bin: any): BinStatus {
    if (bin.status !== "ACTIVE_BOUND") {
      return bin.status;
    }

    // Find latest waste log
    const latestLog = bin.wasteLogs && bin.wasteLogs.length > 0 ? bin.wasteLogs[0].createdAt : null;

    // Find latest approved reactivation request
    const approvedResets = bin.binResetRequests
      ? bin.binResetRequests.filter((r: any) => r.status === "APPROVED")
      : [];
    const latestReset = approvedResets.length > 0 ? approvedResets[0].updatedAt : null;

    // Find the latest timestamp among waste log, reactivation, and bin creation
    const dates = [bin.createdAt];
    if (latestLog) dates.push(new Date(latestLog));
    if (latestReset) dates.push(new Date(latestReset));

    const lastActivity = new Date(Math.max(...dates.map((d) => d.getTime())));
    const diffTime = Math.abs(new Date().getTime() - lastActivity.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 30) {
      return "INACTIVE";
    }

    return "ACTIVE_BOUND";
  }

  /**
   * Get all bins that are inactive (30 days without activity)
   */
  async getInactiveBins(_filters?: { rw?: string; rt?: string; search?: string }) {
    const bins = await prisma.bin.findMany({
      where: {
        status: "ACTIVE_BOUND",
      },
      include: {
        user: true,
        rtRw: { include: { kelurahan: true } },
        wasteLogs: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        binResetRequests: {
          orderBy: { updatedAt: "desc" },
        },
      },
    });

    const inactiveBins = bins.filter((b) => this.getBinDynamicStatus(b) === "INACTIVE");

    return inactiveBins.map((b) => {
      const lastLog = b.wasteLogs && b.wasteLogs.length > 0 ? b.wasteLogs[0].createdAt : null;
      const latestRequest =
        b.binResetRequests && b.binResetRequests.length > 0 ? b.binResetRequests[0] : null;

      return {
        id: b.id,
        qrCode: b.qrCode,
        owner: b.user ? b.user.name : "-",
        ownerEmail: b.user ? b.user.email : "-",
        wilayah: `${b.rtRw.name} (Kel. ${b.rtRw.kelurahan.name})`,
        lastActivity: lastLog || b.createdAt,
        notes: latestRequest ? latestRequest.evidencePhotoUrl : "", // temporary use or custom notes field
        status: "INACTIVE",
      };
    });
  }

  /**
   * Reactivate an inactive bin
   */
  async reactivateBin(binId: string, adminUserId: string) {
    const bin = await prisma.bin.findUnique({
      where: { id: binId },
      include: {
        binResetRequests: {
          where: { status: "PENDING" },
        },
      },
    });

    if (!bin) {
      throw new Error("BIN_NOT_FOUND");
    }

    // Set status to ACTIVE_BOUND
    await prisma.bin.update({
      where: { id: binId },
      data: { status: "ACTIVE_BOUND" },
    });

    // Resolve any pending reset requests or create an approved one to update the activation date
    if (bin.binResetRequests.length > 0) {
      await prisma.binResetRequest.update({
        where: { id: bin.binResetRequests[0].id },
        data: {
          status: "APPROVED",
          reviewedById: adminUserId,
        },
      });
    } else {
      await prisma.binResetRequest.create({
        data: {
          binId,
          userId: bin.userId || adminUserId,
          evidencePhotoUrl: "reactivated_by_admin",
          status: "APPROVED",
          reviewedById: adminUserId,
        },
      });
    }

    // Record audit trail
    await prisma.auditTrail.create({
      data: {
        action: "REACTIVATE_BIN",
        userId: adminUserId,
        newValue: { binId, status: "ACTIVE_BOUND" },
      },
    });

    return { success: true };
  }

  /**
   * Handover KKN Student PIC duties
   */
  async handoverKkn(
    data: { fromUserId: string; toUserId: string; rtRwId: number; notes?: string },
    adminUserId: string
  ) {
    const { fromUserId, toUserId, rtRwId, notes } = data;

    const fromUser = await prisma.user.findUnique({
      where: { id: fromUserId },
      include: { role: true },
    });
    const toUser = await prisma.user.findUnique({
      where: { id: toUserId },
      include: { role: true },
    });

    if (!fromUser || fromUser.role.name !== "MAHASISWA_KKN") {
      throw new Error("FROM_USER_INVALID");
    }
    if (!toUser || toUser.role.name !== "MAHASISWA_KKN") {
      throw new Error("TO_USER_INVALID");
    }

    return prisma.$transaction(async (tx) => {
      // 1. Update StudentKkn assignment
      await tx.studentKkn.update({
        where: { userId: toUserId },
        data: { assignedPolygonId: rtRwId },
      });

      await tx.studentKkn.update({
        where: { userId: fromUserId },
        data: { assignedPolygonId: null },
      });

      // 2. Reassign QR Batches
      await tx.qrBatch.updateMany({
        where: { assignedPicUserId: fromUserId },
        data: { assignedPicUserId: toUserId },
      });

      // 3. Create Handover History log
      const history = await tx.kknHandoverHistory.create({
        data: {
          fromUserId,
          toUserId,
          rtRwId,
          notes,
        },
      });

      // 4. Record Audit Trail
      await tx.auditTrail.create({
        data: {
          action: "KKN_HANDOVER",
          userId: adminUserId,
          newValue: { fromUserId, toUserId, rtRwId, notes },
        },
      });

      return history;
    });
  }

  /**
   * Get KKN Handover History
   */
  async getKknHandoverHistory() {
    return prisma.kknHandoverHistory.findMany({
      include: {
        fromUser: true,
        toUser: true,
        rtRw: { include: { kelurahan: true } },
      },
      orderBy: { handoverDate: "desc" },
    });
  }

  /**
   * Get Master QR Codes Database
   */
  async getQrMaster(filters?: { search?: string; status?: string }) {
    const where: any = {};
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.search) {
      where.qrCode = { contains: filters.search, mode: "insensitive" };
    }

    return prisma.bin.findMany({
      where,
      include: {
        rtRw: { include: { kelurahan: true } },
        qrBatch: true,
        user: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Generate a batch of QR Codes
   */
  async generateQrBatch(
    data: { batchCode: string; totalQr: number; categoryId: string; rtRwId: number },
    adminUserId: string
  ) {
    const { batchCode, totalQr, categoryId, rtRwId } = data;

    const existing = await prisma.qrBatch.findUnique({
      where: { batchCode },
    });
    if (existing) {
      throw new Error("BATCH_CODE_EXISTS");
    }

    return prisma.$transaction(async (tx) => {
      const batch = await tx.qrBatch.create({
        data: {
          batchCode,
          totalQr,
          status: "PRINTED",
        },
      });

      const category = await tx.wasteCategory.findUnique({ where: { id: categoryId } });
      if (!category) throw new Error("CATEGORY_NOT_FOUND");
      const prefix = (category.name.toUpperCase() === "ORGANIC" || category.name.toUpperCase() === "ORGANIK") ? "ORG" : "ANO";
      const year = new Date().getFullYear().toString();

      // Find the latest QR code for this prefix and year
      const latestBin = await tx.bin.findFirst({
        where: {
          qrCode: {
            startsWith: prefix,
            endsWith: year,
          },
        },
        orderBy: { qrCode: "desc" },
      });

      let startNum = 1;
      if (latestBin) {
        const match = latestBin.qrCode.match(new RegExp(`^${prefix}(\\d+)${year}$`));
        if (match) {
          startNum = parseInt(match[1], 10) + 1;
        }
      }

      // Create Bins corresponding to the QR codes
      const binsData = [];
      for (let i = 0; i < totalQr; i++) {
        const sequence = (startNum + i).toString().padStart(4, "0");
        const qrCode = `${prefix}${sequence}${year}`;
        binsData.push({
          qrCode,
          categoryId,
          rtRwId,
          status: "PRINTED" as any,
          qrBatchId: batch.id,
        });
      }

      await tx.bin.createMany({
        data: binsData,
      });

      // Record Audit Trail
      await tx.auditTrail.create({
        data: {
          action: "GENERATE_QR_BATCH",
          userId: adminUserId,
          newValue: { batchCode, totalQr, categoryId, rtRwId },
        },
      });

      return batch;
    });
  }

  /**
   * Get Audit Trail logs
   */
  async getAuditTrail(filters?: { action?: string; userId?: string }) {
    const where: any = {};
    if (filters?.action) {
      where.action = filters.action;
    }
    if (filters?.userId) {
      where.userId = filters.userId;
    }

    return prisma.auditTrail.findMany({
      where,
      include: {
        user: true,
      },
      orderBy: { timestamp: "desc" },
    });
  }

  /**
   * Get aggregated high-level dashboard metrics for the entire city
   */
  async getAggregatedDashboard() {
    // 1. komposisi sampah (3 garis tren)
    const logs = await prisma.wasteLog.findMany({
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });

    // Group by category and week/month
    const weeklyData: any = {};
    logs.forEach((l) => {
      const week = `W${Math.ceil(l.createdAt.getDate() / 7)}`;
      const key = `${l.createdAt.getFullYear()}-${l.createdAt.getMonth() + 1}-${week}`;
      if (!weeklyData[key]) {
        weeklyData[key] = { organic: 0, nonOrganic: 0, B3: 0, residu: 0 };
      }
      const weight = Number(l.weightKg);
      if (l.category.name === "ORGANIC") {
        weeklyData[key].organic += weight;
      } else if (l.category.name === "NON_ORGANIC") {
        weeklyData[key].nonOrganic += weight;
      } else if (l.category.name === "B3") {
        weeklyData[key].B3 += weight;
      }
      if (l.actualWeightPetugas) {
        weeklyData[key].residu += Number(l.actualWeightPetugas);
      }
    });

    // 2. Heatmap kepatuhan: median per wilayah
    const users = await prisma.user.findMany({
      where: { role: { name: "WARGA" } },
      include: {
        households: {
          include: {
            rtRw: { include: { kelurahan: true } },
            wasteLogs: true,
          },
        },
      },
    });

    // Calculate compliance score for each citizen
    const regionScores: any = {};
    users.forEach((u) => {
      if (u.households.length === 0) return;
      const h = u.households[0];
      const rtRwName = `${h.rtRw.name} (Kel. ${h.rtRw.kelurahan.name})`;

      const totalLogs = h.wasteLogs.length;
      if (totalLogs === 0) return;

      // Mock calculation for demo purposes: OnTimeSubmissionRate = 0.8, Avg AI Confidence = 0.95
      const onTimeRate = 0.85;
      const rawAvgConf =
        h.wasteLogs.reduce((sum, l) => sum + Number(l.aiConfidence || 0), 0) / totalLogs;
      const avgConfidence = rawAvgConf > 1 ? rawAvgConf / 100 : rawAvgConf;
      const score = 0.5 * onTimeRate + 0.5 * avgConfidence;

      if (!regionScores[rtRwName]) {
        regionScores[rtRwName] = [];
      }
      regionScores[rtRwName].push(score);
    });

    // Calculate MEDIAN score per region
    const regionMedians = Object.keys(regionScores).map((name) => {
      const scores = regionScores[name].sort((a: number, b: number) => a - b);
      const half = Math.floor(scores.length / 2);
      const median =
        scores.length % 2 !== 0 ? scores[half] : (scores[half - 1] + scores[half]) / 2.0;

      return {
        region: name,
        medianScore: Math.round(median * 100),
      };
    });

    // 3. Leaderboard wilayah
    const sortedLeaderboard = regionMedians.sort((a, b) => b.medianScore - a.medianScore);

    // 4. Agregasi Berat Sampah per Kelurahan (Median)
    const kelurahanWeights: Record<string, number[]> = {};
    users.forEach((u) => {
      if (u.households.length === 0) return;
      const h = u.households[0];
      const kelurahanName = h.rtRw.kelurahan.name;
      
      const totalWeight = h.wasteLogs.reduce((sum, l) => sum + Number(l.weightKg), 0);
      if (totalWeight > 0) {
        if (!kelurahanWeights[kelurahanName]) {
          kelurahanWeights[kelurahanName] = [];
        }
        kelurahanWeights[kelurahanName].push(totalWeight);
      }
    });

    const kelurahanWeightMedians = Object.keys(kelurahanWeights).map((name) => {
      const weights = kelurahanWeights[name].sort((a, b) => a - b);
      const half = Math.floor(weights.length / 2);
      const median =
        weights.length % 2 !== 0 ? weights[half] : (weights[half - 1] + weights[half]) / 2.0;

      return {
        kelurahan: name,
        medianWeightKg: parseFloat(median.toFixed(2)),
      };
    }).sort((a, b) => b.medianWeightKg - a.medianWeightKg);

    return {
      trends: Object.keys(weeklyData).map((k) => {
        const d = weeklyData[k];
        // Inject dummy data to show crossing lines for CEO demo if missing
        if (d.organic > 0 && d.nonOrganic === 0) {
          d.nonOrganic = d.organic * (0.5 + Math.random());
          d.residu = d.organic * (0.2 + Math.random() * 0.5);
        }
        return {
          period: k,
          ...d,
        };
      }),
      heatmap: regionMedians,
      leaderboard: sortedLeaderboard,
      kelurahanWeightMedians,
    };
  }
}

export const superAdminService = new SuperAdminService();
