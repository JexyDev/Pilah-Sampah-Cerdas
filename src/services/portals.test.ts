/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { kknService } from "./kknService.js";
import { residuService } from "./residuService.js";

const prisma = new PrismaClient();

describe("Portals A & B Service Integration Tests", () => {
  let kknUser: any;
  let petugasUser: any;
  let rtRwArea: any;
  let qrBatch: any;
  let testBin: any;
  let citizenUser: any;

  beforeAll(async () => {
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

    // Create a QR batch assigned to KKN PIC
    qrBatch = await prisma.qrBatch.create({
      data: {
        batchCode: `BATCH-TEST-${Date.now()}`,
        status: "ASSIGNED_TO_PIC",
        assignedPicUserId: kknUser.id,
        totalQr: 5,
      },
    });

    // Create a category
    const category = await prisma.wasteCategory.findFirst();

    // Create a test bin assigned to this batch
    testBin = await prisma.bin.create({
      data: {
        qrCode: `TS-TEST-${Date.now()}`,
        categoryId: category!.id,
        maxCapacityLiter: 25.0,
        rtRwId: rtRwArea.id,
        status: "ASSIGNED_TO_PIC",
        qrBatchId: qrBatch.id,
      },
    });
  });

  describe("Portal A — KKN Service", () => {
    it("should fetch dashboard stats correctly", async () => {
      const stats = await kknService.getDashboardStats(kknUser.id);
      expect(stats).toHaveProperty("studentKkn");
      expect(stats).toHaveProperty("stats");
      expect(stats.stats.totalRegistered).toBeTypeOf("number");
    });

    it("should reject bin registration if batch PIC mismatch", async () => {
      // Create a bin with different PIC
      const diffBin = await prisma.bin.create({
        data: {
          qrCode: `TS-DIFF-${Date.now()}`,
          categoryId: testBin.categoryId,
          rtRwId: rtRwArea.id,
          status: "ASSIGNED_TO_PIC",
        },
      });

      await expect(
        kknService.registerWarga(kknUser.id, {
          name: "Warga Test Mismatch",
          email: `wargadiff-${Date.now()}@psc.id`,
          phone: "081234567",
          nik: Math.floor(1000000000000000 + Math.random() * 9000000000000000).toString(),
          address: "Jl. Dago Giri No. 12",
          rtRwId: rtRwArea.id,
          binQrCode: diffBin.qrCode,
          binCategoryId: testBin.categoryId,
        })
      ).rejects.toThrow("BIN_BATCH_PIC_MISMATCH");
    });

    it("should register citizen, bind bin, and reward points", async () => {
      const citizenEmail = `wargatest-${Date.now()}@psc.id`;
      const result = await kknService.registerWarga(kknUser.id, {
        name: "Warga Test KKN",
        email: citizenEmail,
        phone: "081234567",
        nik: Math.floor(1000000000000000 + Math.random() * 9000000000000000).toString(),
        address: "Jl. Dago Giri No. 12",
        rtRwId: rtRwArea.id,
        binQrCode: testBin.qrCode,
        binCategoryId: testBin.categoryId,
      });

      citizenUser = result.newWarga;

      expect(result).toHaveProperty("newWarga");
      expect(result.newWarga.email).toBe(citizenEmail);

      // Verify bin is now active
      const updatedBin = await prisma.bin.findUnique({
        where: { id: testBin.id },
      });
      expect(updatedBin!.status).toBe("ACTIVE_BOUND");
      expect(updatedBin!.userId).toBe(result.newWarga.id);

      // Verify points recorded
      const wargaPoints = await prisma.pointHistory.findFirst({
        where: { userId: result.newWarga.id },
      });
      expect(wargaPoints!.points).toBe(50);
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
