/**
 * Test Suite for Mobile Sync Findings
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { residuService } from "./residuService.js";
import { kknService } from "./kknService.js";
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
        .mockResolvedValueOnce({ _sum: { points: 80 } } as any)  // Month
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
});
