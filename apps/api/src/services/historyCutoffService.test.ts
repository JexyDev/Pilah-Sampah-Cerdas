import { describe, it, expect, vi, beforeEach } from "vitest";
import { historyCutoffService, HistoryScope } from "./historyCutoffService.js";
import { prisma } from "../lib/prisma.js";
import { pointService } from "./pointService.js";
import { pointRepository } from "../repositories/pointRepository.js";
import { transactionService } from "./transactionService.js";
import { kknService } from "./kknService.js";
import { residuService } from "./residuService.js";

describe("History Cutoff & Clear History Feature (Mobile Optimization)", () => {
  const mockUserId = "user-test-uuid-123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("historyCutoffService", () => {
    it("should set cutoff timestamp via upsert", async () => {
      const mockNow = new Date("2026-10-01T10:00:00Z");
      vi.spyOn(prisma.userHistoryCutoff, "upsert").mockResolvedValue({
        id: 1,
        userId: mockUserId,
        scope: HistoryScope.POINTS,
        clearedAt: mockNow,
        createdAt: mockNow,
        updatedAt: mockNow,
      } as any);

      const result = await historyCutoffService.setCutoff(mockUserId, HistoryScope.POINTS);
      expect(prisma.userHistoryCutoff.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_scope: { userId: mockUserId, scope: HistoryScope.POINTS } },
        })
      );
      expect(result).toBeInstanceOf(Date);
    });

    it("should return null if no cutoff exists", async () => {
      vi.spyOn(prisma.userHistoryCutoff, "findUnique").mockResolvedValue(null);
      const cutoff = await historyCutoffService.getCutoff(mockUserId, HistoryScope.POINTS);
      expect(cutoff).toBeNull();
    });

    it("should return the clearedAt date if cutoff exists", async () => {
      const mockDate = new Date("2026-10-01T10:00:00Z");
      vi.spyOn(prisma.userHistoryCutoff, "findUnique").mockResolvedValue({
        clearedAt: mockDate,
      } as any);

      const cutoff = await historyCutoffService.getCutoff(mockUserId, HistoryScope.POINTS);
      expect(cutoff).toEqual(mockDate);
    });
  });

  describe("Point History & Balance Safety (100% Saldo Intact)", () => {
    it("should clear history display and return intact totalPoints", async () => {
      vi.spyOn(prisma.userHistoryCutoff, "upsert").mockResolvedValue({} as any);
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue({
        role: { name: "WARGA" },
        studentProfile: null,
      } as any);
      vi.spyOn(prisma.pointHistory, "aggregate").mockResolvedValue({
        _sum: { points: 1500 },
      } as any);

      const result = await pointService.clearHistory(mockUserId);
      expect(result.totalPoints).toBe(1500);
      expect(result.history).toEqual([]);
    });

    it("should filter history by cutoff in getLedger while keeping balance intact", async () => {
      const cutoffDate = new Date("2026-10-01T10:00:00Z");
      vi.spyOn(prisma.userHistoryCutoff, "findUnique").mockResolvedValue({
        clearedAt: cutoffDate,
      } as any);

      vi.spyOn(prisma.user, "findUnique").mockResolvedValue({
        role: { name: "WARGA" },
        studentProfile: null,
      } as any);

      const mockHistory = [
        { id: 1, points: 50, createdAt: new Date("2026-10-01T11:00:00Z"), description: "Setor Sampah" },
      ];

      vi.spyOn(pointRepository, "getHistoryByUserId").mockResolvedValue(mockHistory as any);
      vi.spyOn(prisma.pointHistory, "aggregate").mockResolvedValue({
        _sum: { points: 2500 },
      } as any);

      const ledger = await pointService.getLedger(mockUserId);
      expect(ledger.totalPoints).toBe(2500);
      expect(ledger.history).toEqual(mockHistory);
      expect(pointRepository.getHistoryByUserId).toHaveBeenCalledWith(mockUserId, false, cutoffDate);
    });
  });

  describe("Waste Deposits Clear History (Warga)", () => {
    it("should set cutoff for WASTE_DEPOSITS and return empty array", async () => {
      vi.spyOn(prisma.userHistoryCutoff, "upsert").mockResolvedValue({} as any);
      const result = await transactionService.clearMyDeposits(mockUserId);
      expect(result).toEqual([]);
      expect(prisma.userHistoryCutoff.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_scope: { userId: mockUserId, scope: HistoryScope.WASTE_DEPOSITS } },
        })
      );
    });
  });

  describe("KKN Activity Log Clear History (Mahasiswa KKN)", () => {
    it("should set cutoff for KKN_ACTIVITIES and return empty array", async () => {
      vi.spyOn(prisma.userHistoryCutoff, "upsert").mockResolvedValue({} as any);
      const result = await kknService.clearActivityLog(mockUserId);
      expect(result).toEqual([]);
      expect(prisma.userHistoryCutoff.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_scope: { userId: mockUserId, scope: HistoryScope.KKN_ACTIVITIES } },
        })
      );
    });
  });

  describe("Petugas Residu Tasks & Weights Clear History", () => {
    it("should set cutoff for PETUGAS_TASKS and return empty array", async () => {
      vi.spyOn(prisma.userHistoryCutoff, "upsert").mockResolvedValue({} as any);
      const result = await residuService.clearRiwayat(mockUserId);
      expect(result).toEqual([]);
      expect(prisma.userHistoryCutoff.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_scope: { userId: mockUserId, scope: HistoryScope.PETUGAS_TASKS } },
        })
      );
    });
  });
});
