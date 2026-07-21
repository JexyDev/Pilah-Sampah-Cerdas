/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { cronService } from "./cronService.js";
import { binService } from "./binService.js";
import { aiService } from "./aiService.js";

const mockCount = vi.fn();
const mockFindMany = vi.fn();
const mockUpdate = vi.fn();
const mockCreate = vi.fn();
const mockFindUnique = vi.fn();
const mockFindFirst = vi.fn();
const mockQueryRaw = vi.fn();

vi.mock("@prisma/client", () => {
  const mPrisma = {
    wasteLog: {
      count: (...args: any[]) => mockCount(...args),
      findUnique: (...args: any[]) => mockFindUnique(...args),
      update: (...args: any[]) => mockUpdate(...args),
      findMany: (...args: any[]) => mockFindMany(...args),
      findFirst: (...args: any[]) => mockFindFirst(...args),
    },
    petugasResidu: {
      findMany: (...args: any[]) => mockFindMany(...args),
      update: (...args: any[]) => mockUpdate(...args),
    },
    auditTrail: {
      create: (...args: any[]) => mockCreate(...args),
    },
    dispatchTask: {
      findFirst: (...args: any[]) => mockFindFirst(...args),
      create: (...args: any[]) => mockCreate(...args),
      update: (...args: any[]) => mockUpdate(...args),
      findMany: (...args: any[]) => mockFindMany(...args),
    },
    user: {
      findUnique: (...args: any[]) => mockFindUnique(...args),
      update: (...args: any[]) => mockUpdate(...args),
    },
    systemConfig: {
      findUnique: (...args: any[]) => mockFindUnique(...args),
    },
    pointHistory: {
      findFirst: (...args: any[]) => mockFindFirst(...args),
      create: (...args: any[]) => mockCreate(...args),
    },
    $transaction: vi.fn().mockImplementation(async (cb) => {
      return cb(mPrisma);
    }),
    $queryRaw: (...args: any[]) => mockQueryRaw(...args),
  };

  return {
    PrismaClient: class {
      wasteLog = mPrisma.wasteLog;
      petugasResidu = mPrisma.petugasResidu;
      auditTrail = mPrisma.auditTrail;
      dispatchTask = mPrisma.dispatchTask;
      user = mPrisma.user;
      systemConfig = mPrisma.systemConfig;
      pointHistory = mPrisma.pointHistory;
      $transaction = mPrisma.$transaction;
      $queryRaw = mPrisma.$queryRaw;
    },
  };
});

vi.mock("./configService.js", () => {
  return {
    configService: {
      getConfig: vi.fn().mockImplementation(async (key: string) => {
        if (key.includes("start")) {
          return key.includes("morning") ? "06:00" : "16:00";
        }
        if (key.includes("end")) {
          return key.includes("morning") ? "08:00" : "18:00";
        }
        if (key === "late_report_kpi_penalty_percent") {
          return "15";
        }
        if (key === "ai_confidence_threshold") {
          return "90";
        }
        return "2";
      }),
    },
  };
});

describe("Batch 2 Core Features", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("cronService - KPI penalty", () => {
    it("should deduct KPI score if petugas has not submitted any reports in the shift window", async () => {
      mockFindMany.mockResolvedValue([
        { id: "p-1", userId: "u-1", nama: "Petugas 1", kpiScore: 100 },
      ]);
      mockCount.mockResolvedValue(0);

      await cronService.evaluateShiftPenalty("morning");

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "p-1" },
          data: { kpiScore: 85 },
        })
      );
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: "SYSTEM_KPI_PENALTY" }),
        })
      );
    });
  });

  describe("binService - claimDispatchTask", () => {
    it("should claim a pending dispatch task", async () => {
      mockQueryRaw.mockResolvedValue([{ id: "task-1", status: "PENDING" }]);
      mockUpdate.mockResolvedValue({ id: "task-1", status: "CLAIMED" });

      const res = await binService.claimDispatchTask("task-1", "petugas-1");

      expect(res.status).toBe("CLAIMED");
      expect(mockUpdate).toHaveBeenCalled();
    });

    it("should throw error if task is already claimed", async () => {
      mockQueryRaw.mockResolvedValue([{ id: "task-1", status: "CLAIMED" }]);

      await expect(
        binService.claimDispatchTask("task-1", "petugas-2")
      ).rejects.toThrow("DISPATCH_TASK_ALREADY_CLAIMED");
    });
  });

  describe("aiService - discrepancy check", () => {
    it("should set discrepancyStatus to PENDING_REVIEW if classification mismatches and confidence > 90%", async () => {
      mockFindUnique.mockResolvedValue({
        id: "log-1",
        aiClassification: "ORGANIC",
        aiConfidence: 95,
      });

      mockUpdate.mockImplementation(async (args: any) => args.data);

      const res = await aiService.submitPetugasReport(
        "log-1",
        "petugas-1",
        2.5,
        "NON_ORGANIC",
        "GPS"
      );

      expect(res.discrepancyStatus).toBe("PENDING_REVIEW");
    });
  });
});
