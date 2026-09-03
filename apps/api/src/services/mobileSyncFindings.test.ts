/**
 * Test Suite for Mobile Sync Findings
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { residuService } from "./residuService.js";
import { kknService, checkClassificationMatch } from "./kknService.js";
import { prisma } from "../lib/prisma.js";

vi.mock("../lib/prisma.js", () => {
  return {
    prisma: {
      user: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
      },
      bin: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
      },
      setoranOtomatis: {
        findMany: vi.fn(),
        aggregate: vi.fn(),
      },
      setoranManual: {
        findMany: vi.fn(),
        create: vi.fn(),
        aggregate: vi.fn(),
      },
      binResetRequest: {
        findMany: vi.fn(),
      },
      pointHistory: {
        aggregate: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
      },
      studentKkn: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      pemanfaatan: {
        create: vi.fn(),
      },
      notification: {
        create: vi.fn(),
      },
      rw: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      violation: {
        count: vi.fn(),
        findMany: vi.fn(),
      },
    },
  };
});

vi.mock("./configService.js", () => ({
  configService: {
    getConfig: vi.fn().mockResolvedValue("2"),
  },
}));

vi.mock("./websocketService.js", () => ({
  websocketService: {
    broadcastPetugasNotification: vi.fn(),
    broadcastBinCapacityAlert: vi.fn(),
    broadcastScheduleUpdate: vi.fn(),
    broadcastDeposit: vi.fn(),
  },
}));

describe("Mobile Findings Backend Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Temuan 3 & 5: getPendingLogs & getRiwayat Petugas", () => {
    it("should query real SetoranOtomatis and BinResetRequest in getPendingLogs", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "petugas-1",
        rwId: 1,
        petugasProfile: { id: "p-1" },
      } as any);

      vi.mocked(prisma.setoranOtomatis.findMany).mockResolvedValue([
        {
          id: "setoran-1",
          qrTempatSampahId: "bin-1",
          hasilKlasifikasiAi: "Organik",
          confidenceAi: 0.95,
          berat: 5.5,
          status: "MENUNGGU_VERIFIKASI",
          fotoSampahUrl: "/uploads/trash.jpg",
          lokasiGps: "-6.89, 107.61",
          createdAt: new Date("2026-08-19T10:00:00Z"),
          bin: {
            id: "bin-1",
            qrCode: "QR-001",
            status: "ACTIVE_BOUND",
            currentVolumeLiter: 20,
            maxCapacityLiter: 25,
            category: { name: "Organik" },
            rw: { name: "RW 01" },
          },
          warga: { id: "w-1", name: "Budi", address: "Jl. Dipatiukur" },
        },
      ] as any);

      vi.mocked(prisma.binResetRequest.findMany).mockResolvedValue([
        {
          id: "reset-1",
          binId: "bin-2",
          status: "PENDING",
          evidencePhotoUrl: "/uploads/full.jpg",
          createdAt: new Date("2026-08-19T09:00:00Z"),
          bin: {
            id: "bin-2",
            qrCode: "QR-002",
            status: "ACTIVE_BOUND",
            currentVolumeLiter: 25,
            maxCapacityLiter: 25,
            category: { name: "Anorganik" },
            rw: { name: "RW 01" },
          },
          user: { id: "w-2", name: "Siti", address: "Jl. Dago" },
        },
      ] as any);

      const logs = await residuService.getPendingLogs("petugas-1");
      expect(logs).toHaveLength(2);
      expect(logs[0].wargaName).toBe("Budi");
      expect(logs[1].wargaName).toBe("Siti");
      expect(logs[0].type).toBe("SETORAN_OTOMATIS");
      expect(logs[1].type).toBe("PENGAJUAN_RESET");
    });
  });

  describe("Temuan 7: getPetugasPoints", () => {
    it("should calculate points summary and return history", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "petugas-1",
        petugasProfile: { kpiScore: 98.5 },
      } as any);

      vi.mocked(prisma.pointHistory.aggregate)
        .mockResolvedValueOnce({ _sum: { points: 150 } } as any) // Total
        .mockResolvedValueOnce({ _sum: { points: 80 } } as any) // Month
        .mockResolvedValueOnce({ _sum: { points: 20 } } as any); // Today

      vi.mocked(prisma.pointHistory.findMany).mockResolvedValue([
        { id: "ph-1", points: 20, description: "Setoran residu" } as any,
      ]);

      const points = await residuService.getPetugasPoints("petugas-1");
      expect(points.totalPoints).toBe(150);
      expect(points.pointsThisMonth).toBe(80);
      expect(points.pointsToday).toBe(20);
      expect(points.kpiScore).toBe(98.5);
      expect(points.history).toHaveLength(1);
    });
  });

  describe("Temuan 1: createPemanfaatanSampah with fotoDokumentasiUrl", () => {
    it("should save uploaded photo URL into database record", async () => {
      vi.mocked(prisma.studentKkn.findUnique).mockResolvedValue({
        id: "student-1",
        userId: "kkn-1",
        user: { name: "Mahasiswa 1", rwId: 1 },
        kelompok: { dpl: { id: "dpl-1", name: "DPL" } },
      } as any);

      vi.mocked(prisma.rw.findFirst).mockResolvedValue({ id: 1, name: "RW 01" } as any);

      (vi.mocked(prisma.pemanfaatan.create) as any).mockImplementation(async ({ data }: any) => {
        return {
          id: "pem-1",
          ...data,
        };
      });

      vi.mocked(prisma.pointHistory.create).mockResolvedValue({ id: "p-1" } as any);
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);

      const result = await kknService.createPemanfaatanSampah("kkn-1", {
        jenisPemanfaatan: "Loseda Kompos",
        kategoriSampah: "Organik",
        jumlah: 15,
        satuan: "Kg",
        fotoDokumentasiUrl: "/uploads/my-photo.jpg",
      });

      expect(result.fotoDokumentasiUrl).toBe("/uploads/my-photo.jpg");
      expect(result.program).toBe("Loseda Kompos");
      expect(prisma.pemanfaatan.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            fotoDokumentasiUrl: "/uploads/my-photo.jpg",
          }),
        })
      );
    });
  });

  describe("getWargaDetail - Sync Statistik Mobile & Warga Dashboard", () => {
    it("should return totalKg, totalActivities, correctCount, incorrectCount, and recentLogs with discrepancyStatus", async () => {
      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce({
          id: "warga-1",
          name: "Warga Test",
          email: "warga@test.com",
          phone: "081234567890",
          address: "Jl. Ganesha",
          rw: { name: "01", kelurahan: { name: "Coblong" } },
          households: [{ address: "Jl. Ganesha", latitude: -6.89, longitude: 107.61 }],
          pointHistory: [],
          setoranOtomatis: [
            {
              id: "log-1",
              berat: 2.5,
              hasilKlasifikasiAi: "organik",
              createdAt: new Date("2026-08-31T10:00:00Z"),
              bin: { category: { name: "ORGANIC" } },
            },
            {
              id: "log-2",
              berat: 1.0,
              hasilKlasifikasiAi: "anorganik",
              createdAt: new Date("2026-08-31T09:00:00Z"),
              bin: { category: { name: "ORGANIC" } },
            },
          ],
          binOwnerships: [
            {
              bin: {
                id: "b-1",
                qrCode: "QR-ORG-01",
                category: { name: "ORGANIC" },
                currentVolumeLiter: 10,
                maxCapacityLiter: 25,
              },
            },
          ],
        } as any)
        .mockResolvedValueOnce({
          id: "kkn-1",
          role: { name: "MAHASISWA_KKN" },
        } as any);

      vi.mocked(prisma.setoranOtomatis.aggregate).mockResolvedValueOnce({
        _sum: { berat: 12.54, poin: 120 },
        _count: { id: 5 },
      } as any);

      vi.mocked(prisma.pointHistory.aggregate).mockResolvedValueOnce({
        _sum: { points: 120 },
      } as any);

      vi.mocked(prisma.setoranOtomatis.findMany).mockResolvedValueOnce([
        {
          hasilKlasifikasiAi: "organik",
          bin: { category: { name: "ORGANIC" } },
        },
        {
          hasilKlasifikasiAi: "organik",
          bin: { category: { name: "ORGANIC" } },
        },
        {
          hasilKlasifikasiAi: "anorganik",
          bin: { category: { name: "ORGANIC" } }, // Mismatch!
        },
        {
          hasilKlasifikasiAi: "anorganik",
          bin: { category: { name: "ANORGANIK" } },
        },
        {
          hasilKlasifikasiAi: "organik",
          bin: { category: { name: "ANORGANIK" } }, // Mismatch!
        },
      ] as any);

      const detail = await kknService.getWargaDetail("kkn-1", "warga-1");

      expect(detail.wargaId).toBe("warga-1");
      expect(detail.totalKg).toBe(12.5);
      expect(detail.totalActivities).toBe(5);
      expect(detail.correctCount).toBe(3);
      expect(detail.incorrectCount).toBe(2);
      expect(detail.totalPoin).toBe(120);

      expect(detail.recentLogs).toHaveLength(2);
      expect(detail.recentLogs[0].discrepancyStatus).toBe("NONE");
      expect(detail.recentLogs[0].is_correct).toBe(true);
      expect(detail.recentLogs[0].isCorrect).toBe(true);
      expect(detail.recentLogs[1].discrepancyStatus).toBe("MISMATCH");
      expect(detail.recentLogs[1].is_correct).toBe(false);
      expect(detail.recentLogs[1].isCorrect).toBe(false);
    });

    it("should handle new warga with 0 activities cleanly without NaN or null errors", async () => {
      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce({
          id: "warga-new",
          name: "Warga Baru",
          phone: "089999999999",
          households: [],
          binOwnerships: [],
          setoranOtomatis: [],
        } as any)
        .mockResolvedValueOnce({
          id: "kkn-1",
          role: { name: "MAHASISWA_KKN" },
        } as any);

      vi.mocked(prisma.setoranOtomatis.aggregate).mockResolvedValueOnce({
        _sum: { berat: null, poin: null },
        _count: { id: 0 },
      } as any);

      vi.mocked(prisma.pointHistory.aggregate).mockResolvedValueOnce({
        _sum: { points: null },
      } as any);

      vi.mocked(prisma.setoranOtomatis.findMany).mockResolvedValueOnce([]);

      const detail = await kknService.getWargaDetail("kkn-1", "warga-new");

      expect(detail.wargaId).toBe("warga-new");
      expect(detail.totalKg).toBe(0);
      expect(detail.totalActivities).toBe(0);
      expect(detail.correctCount).toBe(0);
      expect(detail.incorrectCount).toBe(0);
      expect(detail.totalPoin).toBe(0);
      expect(detail.recentLogs).toEqual([]);
    });

    describe("checkClassificationMatch logic verification", () => {
      it("should return true for matching organic classifications", () => {
        expect(checkClassificationMatch("organik", { name: "ORGANIC" })).toBe(true);
        expect(checkClassificationMatch("organik", { name: "ORGANIK" })).toBe(true);
        expect(checkClassificationMatch("organik", { type: "organik" })).toBe(true);
      });

      it("should return true for matching inorganic classifications", () => {
        expect(checkClassificationMatch("anorganik", { name: "ANORGANIK" })).toBe(true);
        expect(checkClassificationMatch("anorganik", { name: "NON_ORGANIC" })).toBe(true);
        expect(checkClassificationMatch("anorganik", { type: "anorganik" })).toBe(true);
      });

      it("should return false for mismatches between organic and inorganic", () => {
        expect(checkClassificationMatch("organik", { name: "ANORGANIK" })).toBe(false);
        expect(checkClassificationMatch("organik", { name: "NON_ORGANIC" })).toBe(false);
        expect(checkClassificationMatch("anorganik", { name: "ORGANIC" })).toBe(false);
        expect(checkClassificationMatch("anorganik", { name: "ORGANIK" })).toBe(false);
      });

      it("should return true when category or classification is empty/unspecified", () => {
        expect(checkClassificationMatch(null, { name: "ORGANIC" })).toBe(true);
        expect(checkClassificationMatch("organik", null)).toBe(true);
        expect(checkClassificationMatch(undefined, undefined)).toBe(true);
      });
    });

    it("should throw WARGA_NOT_FOUND when wargaId is not found", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
      await expect(kknService.getWargaDetail("kkn-1", "non-existent-warga")).rejects.toThrow(
        "WARGA_NOT_FOUND"
      );
    });
  });
});
