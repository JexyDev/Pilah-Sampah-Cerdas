import { describe, it, expect, vi, beforeEach } from "vitest";
import { PointRepository } from "./pointRepository.js";
import { prisma } from "../lib/prisma.js";

vi.mock("../lib/prisma.js", () => ({
  prisma: {
    pointHistory: {
      findMany: vi.fn(),
      aggregate: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
  },
}));

describe("PointRepository", () => {
  let repository: PointRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new PointRepository();
  });

  describe("getHistoryByUserId", () => {
    it("should exclude KKN_PROKER category and ProkerID descriptions to prevent leaks to individual UI for default/warga", async () => {
      const mockRows = [
        {
          id: "pt-1",
          userId: "user-123",
          points: 4,
          kategori: "KKN_PRESENSI_HADIR",
          description: "Poin kehadiran KKN",
        },
      ];

      vi.mocked(prisma.pointHistory.findMany).mockResolvedValue(mockRows as any);

      const result = await repository.getHistoryByUserId("user-123");

      expect(result).toEqual(mockRows);
      expect(prisma.pointHistory.findMany).toHaveBeenCalledWith({
        where: {
          userId: "user-123",
          kategori: { notIn: ["KKN_PROKER"] },
          NOT: { description: { contains: "[ProkerID:" } },
        },
        orderBy: { createdAt: "desc" },
      });
    });

    it("should exclude REDUKSI_TONASE and BONUS_LOGIN_PERTAMA along with KKN_PROKER when isStudent is true", async () => {
      const mockRows = [
        {
          id: "pt-2",
          userId: "student-1",
          points: 4,
          kategori: "KKN_PRESENSI_HADIR",
          description: "Poin kehadiran KKN",
        },
      ];

      vi.mocked(prisma.pointHistory.findMany).mockResolvedValue(mockRows as any);

      const result = await repository.getHistoryByUserId("student-1", true);

      expect(result).toEqual(mockRows);
      expect(prisma.pointHistory.findMany).toHaveBeenCalledWith({
        where: {
          userId: "student-1",
          kategori: { notIn: ["KKN_PROKER", "REDUKSI_TONASE", "BONUS_LOGIN_PERTAMA"] },
          NOT: { description: { contains: "[ProkerID:" } },
        },
        orderBy: { createdAt: "desc" },
      });
    });
  });

  describe("getTotalPoints", () => {
    it("should calculate sum of points excluding KKN_PROKER", async () => {
      vi.mocked(prisma.pointHistory.aggregate).mockResolvedValue({
        _sum: { points: 118 },
      } as any);

      const total = await repository.getTotalPoints("user-dafa");
      expect(total).toBe(118);
      expect(prisma.pointHistory.aggregate).toHaveBeenCalledWith({
        where: {
          userId: "user-dafa",
          kategori: { notIn: ["KKN_PROKER"] },
          NOT: { description: { contains: "[ProkerID:" } },
        },
        _sum: {
          points: true,
        },
      });
    });
  });
});
