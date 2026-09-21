import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma
vi.mock("../lib/prisma.js", () => ({
  prisma: {
    kelurahan: {
      findMany: vi.fn(),
    },
    rw: {
      findMany: vi.fn(),
    },
    facility: {
      findMany: vi.fn(),
    },
    surveiKelurahan: {
      findMany: vi.fn(),
    },
    facilityProductionLog: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "../lib/prisma.js";
import { gisEksekutifService } from "./gisEksekutifService.js";

describe("gisEksekutifService E2E QC", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return synced volume between KPI volumeTotal and komposisiVolume totalM3", async () => {
    (prisma.kelurahan.findMany as any).mockResolvedValue([
      { id: "kel-1", name: "Dago", code: "327301", rws: [{ id: 1, name: "RW 01" }] },
      { id: "kel-2", name: "Sekeloa", code: "327302", rws: [{ id: 2, name: "RW 01" }] },
    ]);

    (prisma.rw.findMany as any).mockResolvedValue([
      { id: 1, name: "RW 01", kelurahan: { name: "Dago" } },
      { id: 2, name: "RW 01", kelurahan: { name: "Sekeloa" } },
    ]);

    (prisma.facility.findMany as any).mockResolvedValue([
      {
        id: "fac-1",
        nama: "Bank Sampah Dago Resik",
        jenis: "bank_sampah",
        latitude: -6.875,
        longitude: 107.615,
        pic: "Budi",
        foto: "uploads/facilities/bank_dago.jpg",
        kontak: "08123456789",
        kapasitas: 500,
        alamat: "Jl. Dago No. 10",
        statusApproval: "APPROVED",
        rw: { name: "RW 01", kelurahan: { name: "Dago" } },
      },
    ]);

    (prisma.surveiKelurahan.findMany as any).mockResolvedValue([
      {
        id: "srv-1",
        namaKelurahan: "Dago",
        pemilahanSampah: { persentasePemilahan: "0.45" },
        volumeSampah: {
          organikKgPerHari: 100,
          anorganikKgPerHari: 200,
          residuKgPerHari: 50,
          totalVolumeKgPerHari: 350,
        },
      },
    ]);

    (prisma.facilityProductionLog.findMany as any).mockResolvedValue([]);

    const result = await gisEksekutifService.getOverview();

    expect(result.success).toBe(true);
    // Verifikasi foto fasilitas ter-map dengan benar
    expect(result.titikFasilitas[0].foto).toBe("uploads/facilities/bank_dago.jpg");

    // Total volume dari komposisi
    const org = result.komposisiVolume.organik.volumeM3;
    const ano = result.komposisiVolume.anorganik.volumeM3;
    const res = result.komposisiVolume.residu.volumeM3;
    const expectedSum = Math.round((org + ano + res) * 10) / 10;

    // Verifikasi sinkronisasi 100%
    expect(result.komposisiVolume.totalM3).toBe(expectedSum);
    expect(result.kpi.volumeTotal).toBe(expectedSum);
  });

  it("should normalize shorthand facility type 'maggot' to valid Prisma enum 'rumah_maggot'", async () => {
    (prisma.kelurahan.findMany as any).mockResolvedValue([]);
    (prisma.rw.findMany as any).mockResolvedValue([]);
    (prisma.facility.findMany as any).mockResolvedValue([]);
    (prisma.surveiKelurahan.findMany as any).mockResolvedValue([]);
    (prisma.facilityProductionLog.findMany as any).mockResolvedValue([]);

    await gisEksekutifService.getOverview({ jenisFasilitas: "maggot" });

    expect(prisma.facility.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          jenis: "rumah_maggot",
        }),
      })
    );
  });

  it("should provide period options from August to December 2026 and 12-month trend array", async () => {
    (prisma.kelurahan.findMany as any).mockResolvedValue([]);
    (prisma.rw.findMany as any).mockResolvedValue([]);
    (prisma.facility.findMany as any).mockResolvedValue([]);
    (prisma.surveiKelurahan.findMany as any).mockResolvedValue([]);
    (prisma.facilityProductionLog.findMany as any).mockResolvedValue([]);

    const result = await gisEksekutifService.getOverview({ periode: "Agustus 2026" });

    expect(result.filterOptions.periodes).toEqual([
      "Agustus 2026",
      "September 2026",
      "Oktober 2026",
      "November 2026",
      "Desember 2026",
    ]);
    expect(result.trenBulanan).toHaveLength(12);
    expect(result.trenBulanan[0].bulan).toBe("Jan");
    expect(result.trenBulanan[7].bulan).toBe("Agu");
    expect(result.trenBulanan[8].bulan).toBe("Sep");
    expect(result.trenBulanan[11].bulan).toBe("Des");
  });
});

