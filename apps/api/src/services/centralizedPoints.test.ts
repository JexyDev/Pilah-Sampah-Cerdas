import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "../lib/prisma.js";
import {
  calculateValidIndividualPoints,
  calculateValidIndividualPointsForUsers,
  PointService,
} from "./pointService.js";

vi.mock("../lib/prisma.js", () => ({
  prisma: {
    pointHistory: {
      aggregate: vi.fn(),
      groupBy: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    studentKkn: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    bin: {
      count: vi.fn(),
    },
    programKerjaKkn: {
      findMany: vi.fn(),
    },
  },
}));

describe("Centralized Anti-Leak Individual Points Architecture (SSOT)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("calculateValidIndividualPoints", () => {
    it("should query prisma.pointHistory.aggregate with KKN_PROKER, REDUKSI_TONASE, and BONUS_LOGIN_PERTAMA exclusion filters for Mahasiswa KKN", async () => {
      vi.mocked(prisma.pointHistory.aggregate).mockResolvedValue({
        _sum: { points: 10 },
      } as any);

      const points = await calculateValidIndividualPoints("user-habik-1", "MAHASISWA_KKN");

      expect(points).toBe(10);
      expect(prisma.pointHistory.aggregate).toHaveBeenCalledWith({
        where: {
          userId: "user-habik-1",
          kategori: {
            notIn: [
              "KKN_PROKER",
              "REDUKSI_TONASE",
              "BONUS_LOGIN_PERTAMA",
              "POIN_KKN_FINAL",
            ],
          },
          NOT: {
            description: { contains: "[ProkerID:" },
          },
        },
        _sum: { points: true },
      });
    });

    it("should keep REDUKSI_TONASE intact for WARGA users while still excluding KKN_PROKER", async () => {
      vi.mocked(prisma.pointHistory.aggregate).mockResolvedValue({
        _sum: { points: 150 },
      } as any);

      const points = await calculateValidIndividualPoints("user-warga-1", "WARGA");

      expect(points).toBe(150);
      expect(prisma.pointHistory.aggregate).toHaveBeenCalledWith({
        where: {
          userId: "user-warga-1",
          kategori: { notIn: ["KKN_PROKER"] },
          NOT: {
            description: { contains: "[ProkerID:" },
          },
        },
        _sum: { points: true },
      });
    });

    it("should return 0 when user has no point records or aggregate returns null", async () => {
      vi.mocked(prisma.pointHistory.aggregate).mockResolvedValue({
        _sum: { points: null },
      } as any);

      const points = await calculateValidIndividualPoints("user-empty");
      expect(points).toBe(0);
    });

    it("should never return negative points even if penalties exceed earnings", async () => {
      vi.mocked(prisma.pointHistory.aggregate).mockResolvedValue({
        _sum: { points: -15 },
      } as any);

      const points = await calculateValidIndividualPoints("user-penalty-heavy");
      expect(points).toBe(0);
    });
  });

  describe("calculateValidIndividualPointsForUsers (Batch)", () => {
    it("should return an empty map if userIds array is empty", async () => {
      const resultMap = await calculateValidIndividualPointsForUsers([]);
      expect(resultMap.size).toBe(0);
      expect(prisma.pointHistory.groupBy).not.toHaveBeenCalled();
    });

    it("should batch-query points for all requested users with KKN_PROKER, REDUKSI_TONASE, and BONUS_LOGIN_PERTAMA exclusion filters", async () => {
      vi.mocked(prisma.pointHistory.groupBy).mockResolvedValue([
        { userId: "mhs-1", _sum: { points: 10 } } as any,
        { userId: "mhs-2", _sum: { points: 45 } } as any,
      ]);

      const resultMap = await calculateValidIndividualPointsForUsers(["mhs-1", "mhs-2", "mhs-3"]);

      expect(prisma.pointHistory.groupBy).toHaveBeenCalledWith({
        by: ["userId"],
        where: {
          userId: { in: ["mhs-1", "mhs-2", "mhs-3"] },
          kategori: {
            notIn: [
              "KKN_PROKER",
              "REDUKSI_TONASE",
              "BONUS_LOGIN_PERTAMA",
              "POIN_KKN_FINAL",
            ],
          },
          NOT: {
            description: { contains: "[ProkerID:" },
          },
        },
        _sum: { points: true },
      });

      expect(resultMap.get("mhs-1")).toBe(10);
      expect(resultMap.get("mhs-2")).toBe(45);
      // mhs-3 had no records, defaults cleanly to 0
      expect(resultMap.get("mhs-3")).toBe(0);
    });
  });

  describe("PointService.getLedger", () => {
    const pointService = new PointService();

    it("should fetch history and calculate points with student exclusions for MAHASISWA_KKN", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user-mhs",
        role: { name: "MAHASISWA_KKN" },
        studentProfile: { id: "profile-1" },
      } as any);

      vi.mocked(prisma.pointHistory.findMany).mockResolvedValue([
        {
          id: "ph-1",
          userId: "user-mhs",
          points: 4,
          kategori: "KKN_PRESENSI_HADIR",
          description: "Presensi Masuk",
        },
      ] as any);

      vi.mocked(prisma.pointHistory.aggregate).mockResolvedValue({
        _sum: { points: 4 },
      } as any);

      const ledger = await pointService.getLedger("user-mhs");

      expect(ledger.totalPoints).toBe(4);
      expect(ledger.history).toHaveLength(1);
      expect(prisma.pointHistory.findMany).toHaveBeenCalledWith({
        where: {
          userId: "user-mhs",
          kategori: { notIn: ["KKN_PROKER", "REDUKSI_TONASE", "BONUS_LOGIN_PERTAMA"] },
          NOT: { description: { contains: "[ProkerID:" } },
        },
        orderBy: { createdAt: "desc" },
      });
    });

    it("should allow REDUKSI_TONASE and BONUS_LOGIN_PERTAMA in history for WARGA", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user-warga",
        role: { name: "WARGA" },
        studentProfile: null,
      } as any);

      vi.mocked(prisma.pointHistory.findMany).mockResolvedValue([
        {
          id: "ph-2",
          userId: "user-warga",
          points: 50,
          kategori: "REDUKSI_TONASE",
          description: "Setoran Sampah",
        },
      ] as any);

      vi.mocked(prisma.pointHistory.aggregate).mockResolvedValue({
        _sum: { points: 50 },
      } as any);

      const ledger = await pointService.getLedger("user-warga");

      expect(ledger.totalPoints).toBe(50);
      expect(ledger.history).toHaveLength(1);
      expect(prisma.pointHistory.findMany).toHaveBeenCalledWith({
        where: {
          userId: "user-warga",
          kategori: { notIn: ["KKN_PROKER"] },
          NOT: { description: { contains: "[ProkerID:" } },
        },
        orderBy: { createdAt: "desc" },
      });
    });
  });
});
