/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { kknService } from "./kknService.js";
import { residuService } from "./residuService.js";
import { authService } from "./authService.js";

const prisma = new PrismaClient();

describe("Portals A & B Service Integration Tests", () => {
  let kknUser: any;
  let petugasUser: any;
  let rtRwArea: any;
  let qrBatch: any;
  let testBin: any;
  let citizenUser: any;

  beforeAll(async () => {
    // Clear conflicting data to prevent KKN limit issues
    await prisma.refreshToken.deleteMany({});
    await prisma.pointHistory.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.violation.deleteMany({});
    await prisma.setoranOtomatis.deleteMany({});
    await prisma.setoranManual.deleteMany({});
    await prisma.bin.deleteMany({});
    await prisma.household.deleteMany({});
    await prisma.user.deleteMany({ where: { role: { name: "WARGA" } } });

    // Get seeded KKN student and Petugas
    kknUser = await prisma.user.findFirst({
      where: { role: { name: "MAHASISWA_KKN" } },
      include: { studentProfile: true },
    });

    petugasUser = await prisma.user.findFirst({
      where: { role: { name: "PETUGAS_RESIDU" } },
      include: { petugasProfile: true },
    });

    rtRwArea = await prisma.rtRwArea.findFirst();

    const timestamp = Date.now();
    // Create a QR batch assigned to KKN PIC
    qrBatch = await prisma.qrBatch.create({
      data: {
        batchCode: `BATCH-TEST-${timestamp}`,
        status: "ASSIGNED_TO_PIC",
        assignedPicUserId: kknUser.id,
        totalQr: 5,
      },
    });

    // Create a category
    const category = await prisma.wasteCategory.findFirst();

    // Create test bins assigned to this batch
    testBin = await prisma.bin.create({
      data: {
        qrCode: `ORG-TEST-${timestamp}`,
        categoryId: category!.id,
        maxCapacityLiter: 25.0,
        rtRwId: rtRwArea.id,
        status: "PRINTED",
        qrBatchId: qrBatch.id,
      },
    });

    // Create second bin for Inorganic
    const catIno = await prisma.wasteCategory.findFirst({ where: { name: "Anorganik" } });
    await prisma.bin.create({
      data: {
        qrCode: `ANO-TEST-${timestamp}`,
        categoryId: catIno!.id,
        maxCapacityLiter: 25.0,
        rtRwId: rtRwArea.id,
        status: "PRINTED",
        qrBatchId: qrBatch.id,
      },
    });
  });

  describe("Portal A — KKN Service", () => {
    it("should fetch dashboard stats correctly", async () => {
      const stats = await kknService.getDashboardStats(kknUser.id);
      expect(stats).toHaveProperty("nim");
      expect(stats).toHaveProperty("totalRegisteredBins");
      expect(stats.totalRegisteredBins).toBeTypeOf("number");
    });

    it("should register citizen, bind bin, and reward points", async () => {
      const citizenEmail = `wargatest-${Date.now()}@psc.id`;
      const result = await authService.registerWarga(
        {
          name: "Warga Test KKN",
          email: citizenEmail,
          phone: "+62812" + Math.floor(10000000 + Math.random() * 90000000).toString(),
          nik: Math.floor(1000000000000000 + Math.random() * 9000000000000000).toString(),
          password: "password123",
          rtRwId: rtRwArea.id,
          address: "Jl. Dago Giri No. 12",
        },
        {
          address: "Jl. Dago Giri No. 12",
          rtRwId: rtRwArea.id,
          latitude: -6.88923,
          longitude: 107.6105,
        },
        testBin.qrCode,
        "UTAMA"
      );

      citizenUser = result.user;

      expect(result).toHaveProperty("user");
      expect(result.user.email).toBe(citizenEmail);

      // Verify bin is now active
      const updatedBin = await prisma.bin.findUnique({
        where: { id: testBin.id },
      });
      expect(updatedBin!.status).toBe("ACTIVE_BOUND");
      expect(updatedBin!.userId).toBe(result.user.id);

      // Verify points recorded (+10 points for activation)
      const wargaPoints = await prisma.pointHistory.findFirst({
        where: { userId: result.user.id },
      });
      expect(wargaPoints!.points).toBe(10);
    });
  });

  describe("Portal B — Petugas Residu Service", () => {
    it("should record violation, deduct points, and send warning notification", async () => {
      const citizenId = citizenUser.id;

      // Get initial points
      const initialPointsAggregate = await prisma.pointHistory.aggregate({
        where: { userId: citizenId },
        _sum: { points: true },
      });
      const initialPoints = initialPointsAggregate._sum.points || 0;

      // Record violation
      const violation = await residuService.recordViolation(petugasUser.id, {
        binQrCode: testBin.qrCode,
        type: "RESIDU_MIXED_ORGANIC",
        severity: "MEDIUM",
        evidencePhotoUrl: "/uploads/violation_test.jpg",
        notes: "Ditemukan plastik tercampur dalam tong organik",
      });

      expect(violation).toHaveProperty("id");
      expect(violation.severity).toBe("MEDIUM");

      // Verify points deducted
      const updatedPointsAggregate = await prisma.pointHistory.aggregate({
        where: { userId: citizenId },
        _sum: { points: true },
      });
      const updatedPoints = updatedPointsAggregate._sum.points || 0;

      // MEDIUM severity should deduct basePenalty * 2
      const basePenaltyStr = await prisma.systemConfig.findUnique({
        where: { key: "residu_penalty_multiplier" },
      });
      const basePenalty = basePenaltyStr ? Math.abs(parseInt(basePenaltyStr.value, 10)) : 50;

      console.log(
        `[TEST PORTAL LOG] initialPoints=${initialPoints}, updatedPoints=${updatedPoints}, basePenaltyStr=${basePenaltyStr?.value}, parsedBasePenalty=${basePenalty}`
      );

      expect(updatedPoints).toBe(initialPoints - basePenalty * 2);

      // Verify notification created
      const notif = await prisma.notification.findFirst({
        where: { userId: citizenId },
        orderBy: { createdAt: "desc" },
      });
      expect(notif!.title).toContain("Peringatan Pemilahan");
    });
  });
});
