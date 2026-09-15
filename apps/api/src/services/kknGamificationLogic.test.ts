import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma
vi.mock("../lib/prisma.js", () => {
  return {
    prisma: {
      user: {
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn().mockResolvedValue(null),
      },
      kelompokKkn: {
        findUnique: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
      },
      programKerjaKkn: {
        findUnique: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
        update: vi.fn().mockResolvedValue({}),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        delete: vi.fn().mockResolvedValue({}),
      },
      studentKkn: {
        findUnique: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
      },
      pointHistory: {
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockResolvedValue({ id: "pt-1" }),
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
        aggregate: vi.fn().mockResolvedValue({ _sum: { points: 0 } }),
      },
      pemanfaatan: {
        create: vi.fn().mockResolvedValue({ id: "pem-1" }),
        findUnique: vi.fn().mockResolvedValue(null),
        update: vi.fn().mockResolvedValue({ id: "pem-1" }),
        delete: vi.fn().mockResolvedValue({ id: "pem-1" }),
      },
      notification: {
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      schedule: {
        findUnique: vi.fn(),
      },
      activityAttendance: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    },
  };
});

// Mock notificationIntegrationService
vi.mock("./notificationIntegrationService.js", () => ({
  notificationIntegrationService: {
    sendToUsers: vi.fn().mockResolvedValue(true),
  },
}));

// Mock configService
vi.mock("./configService.js", () => ({
  configService: {
    getConfig: vi.fn().mockResolvedValue(null),
    getRuleEngineConfigs: vi.fn().mockResolvedValue({
      attendanceOutOfZonePenaltyActive: true,
      attendanceOutOfZonePenaltyPoints: 10,
    }),
  },
}));

// Mock auditTrailService
vi.mock("./auditTrailService.js", () => ({
  auditTrailService: {
    recordPresensiPelanggaranZona: vi.fn().mockResolvedValue(true),
  },
}));

import { prisma } from "../lib/prisma.js";
import { syncProkerGamificationPoints, calculateGroupPoints } from "./dplService.js";
import { kknAttendanceService } from "./kknAttendanceService.js";
import { kknService } from "./kknService.js";

describe("KKN Gamification Logic & Fixes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. syncProkerGamificationPoints (3-Step Proker Points)", () => {
    it("should award +2 points on Step 1 (DISETUJUI) for all group members", async () => {
      vi.mocked(prisma.kelompokKkn.findUnique).mockResolvedValue({
        id: "kel-1",
        students: [{ userId: "user-1" }, { userId: "user-2" }],
      } as any);

      // No existing step 1 points
      vi.mocked(prisma.pointHistory.findFirst).mockResolvedValue(null);

      await syncProkerGamificationPoints(
        "proker-1",
        "kel-1",
        "DISETUJUI",
        "BELUM_MULAI",
        "Judul Proker"
      );

      expect(prisma.pointHistory.createMany).toHaveBeenCalledWith({
        data: [
          {
            userId: "user-1",
            points: 2,
            description: "Program Kerja Disetujui: Judul Proker [ProkerID:proker-1:DISETUJUI]",
            kategori: "KKN_PROKER",
          },
          {
            userId: "user-2",
            points: 2,
            description: "Program Kerja Disetujui: Judul Proker [ProkerID:proker-1:DISETUJUI]",
            kategori: "KKN_PROKER",
          },
        ],
      });
    });

    it("should award Step 2 (+2 points) when proker is SEDANG_BERJALAN", async () => {
      vi.mocked(prisma.kelompokKkn.findUnique).mockResolvedValue({
        id: "kel-1",
        students: [{ userId: "user-1" }],
      } as any);

      // Step 1 already exists, Step 2 does not exist
      vi.mocked(prisma.pointHistory.findFirst)
        .mockResolvedValueOnce({ id: "pt-1" } as any) // Step 1 check
        .mockResolvedValueOnce(null); // Step 2 check

      await syncProkerGamificationPoints(
        "proker-1",
        "kel-1",
        "DISETUJUI",
        "SEDANG_BERJALAN",
        "Judul Proker"
      );

      expect(prisma.pointHistory.createMany).toHaveBeenCalledWith({
        data: [
          {
            userId: "user-1",
            points: 2,
            description: "Program Kerja Berjalan: Judul Proker [ProkerID:proker-1:BERJALAN]",
            kategori: "KKN_PROKER",
          },
        ],
      });
    });

    it("should award Step 3 (+2 points) when proker is SELESAI", async () => {
      vi.mocked(prisma.kelompokKkn.findUnique).mockResolvedValue({
        id: "kel-1",
        students: [{ userId: "user-1" }],
      } as any);

      // Step 1 & 2 exist, Step 3 does not exist
      vi.mocked(prisma.pointHistory.findFirst)
        .mockResolvedValueOnce({ id: "pt-1" } as any) // Step 1
        .mockResolvedValueOnce({ id: "pt-2" } as any) // Step 2
        .mockResolvedValueOnce(null); // Step 3

      await syncProkerGamificationPoints(
        "proker-1",
        "kel-1",
        "DISETUJUI",
        "SELESAI",
        "Judul Proker"
      );

      expect(prisma.pointHistory.createMany).toHaveBeenCalledWith({
        data: [
          {
            userId: "user-1",
            points: 2,
            description: "Program Kerja Selesai: Judul Proker [ProkerID:proker-1:SELESAI]",
            kategori: "KKN_PROKER",
          },
        ],
      });
    });

    it("should be idempotent and not create duplicate points if already awarded", async () => {
      vi.mocked(prisma.kelompokKkn.findUnique).mockResolvedValue({
        id: "kel-1",
        students: [{ userId: "user-1" }],
      } as any);

      // All steps already exist
      vi.mocked(prisma.pointHistory.findFirst).mockResolvedValue({ id: "pt-existing" } as any);

      await syncProkerGamificationPoints(
        "proker-1",
        "kel-1",
        "DISETUJUI",
        "SELESAI",
        "Judul Proker"
      );

      expect(prisma.pointHistory.createMany).not.toHaveBeenCalled();
    });

    it("should delete points when proker is rejected (DITOLAK)", async () => {
      vi.mocked(prisma.kelompokKkn.findUnique).mockResolvedValue({
        id: "kel-1",
        students: [{ userId: "user-1" }],
      } as any);

      await syncProkerGamificationPoints(
        "proker-1",
        "kel-1",
        "DITOLAK",
        "BELUM_MULAI",
        "Judul Proker"
      );

      expect(prisma.pointHistory.deleteMany).toHaveBeenCalledWith({
        where: { description: { contains: "[ProkerID:proker-1" } },
      });
    });
  });

  describe("2. calculateGroupPoints (Pure Integer Group Score)", () => {
    it("should return pure integer group points without decimal fraction multipliers", async () => {
      // 1 approved proker (+2), 1 ongoing proker (+4), 1 finished proker (+6) = 12 total points
      const mockProkers = [
        { id: "p1", statusUsulan: "DISETUJUI", statusPelaksanaan: "BELUM_MULAI" },
        { id: "p2", statusUsulan: "DISETUJUI", statusPelaksanaan: "SEDANG_BERJALAN" },
        { id: "p3", statusUsulan: "DISETUJUI", statusPelaksanaan: "SELESAI" },
      ];

      vi.mocked(prisma.pointHistory.findMany).mockResolvedValue([]);

      const res = await calculateGroupPoints("kel-1", mockProkers, ["user-1"]);

      expect(res.poinProker).toBe(12);
      expect(res.totalGroupPoints).toBe(12);
      expect(Number.isInteger(res.totalGroupPoints)).toBe(true);
    });
  });

  describe("3. recordOutOfZoneViolation (No Balance Deduction)", () => {
    it("should record violation with points: 0 and not deduct student point balance", async () => {
      vi.mocked(prisma.schedule.findUnique).mockResolvedValue({
        id: "sch-1",
        title: "Kegiatan KKN",
        kelompok: { name: "Kelompok 1" },
      } as any);

      vi.mocked(prisma.studentKkn.findUnique).mockResolvedValue({
        id: "st-1",
        userId: "user-1",
        nim: "10120001",
        user: { name: "Budi" },
        kelompok: { name: "Kelompok 1" },
      } as any);

      const result = await kknAttendanceService.recordOutOfZoneViolation("user-1", {
        scheduleId: "sch-1",
        outOfZoneMinutes: 10,
      });

      expect(result.success).toBe(true);
      expect(result.pointsDeducted).toBe(0);

      expect(prisma.pointHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-1",
          points: 0,
          kategori: "PENALTY_OUT_OF_ZONE",
        }),
      });
    });
  });

  describe("4. createLogbookPemanfaatan & createPanenHasil (Non-Point Activities)", () => {
    it("createLogbookPemanfaatan should not create PointHistory records", async () => {
      vi.mocked(prisma.studentKkn.findUnique).mockResolvedValue({
        id: "st-1",
        userId: "user-1",
        kelompokId: "kel-1",
      } as any);

      vi.mocked(prisma.pemanfaatan.create).mockResolvedValue({
        id: "pem-1",
        rwId: 1,
      } as any);

      await kknService.createLogbookPemanfaatan("user-1", {
        teknologi: "Kompos",
        bahanBaku: "Sampah",
        beratInputKg: 20,
      });

      // No point history records created for pemanfaatan form
      expect(prisma.pointHistory.createMany).not.toHaveBeenCalled();
    });
  });
});
