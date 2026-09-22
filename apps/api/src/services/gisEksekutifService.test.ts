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

describe("gisEksekutifService Dynamic DB Tests (Zero Fallback / Anti-Dummy)", () => {
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

  it("should return dynamic values from database when filtering by kelurahan without district fallbacks", async () => {
    (prisma.kelurahan.findMany as any).mockResolvedValue([
      { id: "kel-1", name: "Dago", code: "327301", rws: [{ id: 1, name: "RW 01" }] },
    ]);
    (prisma.rw.findMany as any).mockResolvedValue([
      { id: 1, name: "RW 01", kelurahan: { name: "Dago" } },
    ]);
    (prisma.facility.findMany as any).mockResolvedValue([
      { id: "f1", nama: "Fasilitas 1", jenis: "tps", latitude: -6.8, longitude: 107.6, rw: { name: "RW 01", kelurahan: { name: "Dago" } } },
      { id: "f2", nama: "Fasilitas 2", jenis: "bank_sampah", latitude: -6.81, longitude: 107.61, rw: { name: "RW 01", kelurahan: { name: "Dago" } } },
      { id: "f3", nama: "Fasilitas 3", jenis: "buruan_sae", latitude: -6.82, longitude: 107.62, rw: { name: "RW 01", kelurahan: { name: "Dago" } } },
    ]);
    (prisma.surveiKelurahan.findMany as any).mockResolvedValue([
      {
        id: "srv-dago",
        namaKelurahan: "Dago",
        pemilahanSampah: { persentasePemilahan: "0.45" },
        volumeSampah: {
          organikKgPerHari: 150,
          anorganikKgPerHari: 150,
          residuKgPerHari: 50,
          totalVolumeKgPerHari: 350,
        },
      },
    ]);
    (prisma.facilityProductionLog.findMany as any).mockResolvedValue([]);

    const result = await gisEksekutifService.getOverview({ kelurahan: "Dago" });

    // Dinamis: jumlah fasilitas adalah 3 (bukan fallback 83)
    expect(result.kpi.fasilitasTerdata).toBe(3);
    expect(result.kpi.fasilitasSubtext).toBe("Kelurahan Dago");
    // Dinamis: kepatuhan pemilahan adalah 45% (bukan fallback 18%)
    expect(result.kpi.kepatuhanPemilahan).toBe(45);
    // Dinamis: volume total sesuai perhitungan survei Dago (350 kg/hari * 30 / 1000 = 10.5 m3/bulan)
    expect(result.kpi.volumeTotal).toBe(10.5);
    expect(result.komposisiVolume.totalM3).toBe(10.5);
  });

  it("should return clean and honest empty state when database has no survey or production logs", async () => {
    (prisma.kelurahan.findMany as any).mockResolvedValue([]);
    (prisma.rw.findMany as any).mockResolvedValue([]);
    (prisma.facility.findMany as any).mockResolvedValue([]);
    (prisma.surveiKelurahan.findMany as any).mockResolvedValue([]);
    (prisma.facilityProductionLog.findMany as any).mockResolvedValue([]);

    const result = await gisEksekutifService.getOverview();

    // Pastikan tidak ada data palsu yang bocor
    expect(result.kpi.fasilitasTerdata).toBe(0);
    expect(result.kpi.volumeTotal).toBeNull();
    expect(result.kpi.kepatuhanPemilahan).toBeNull();
    expect(result.kpi.volumeGrowthPercent).toBeNull();
    expect(result.kpi.sensorCh4OnlineCount).toBe(0);
    expect(result.kpi.sensorCh4TotalCount).toBe(0);
    expect(result.kpi.sensorCh4ProgressPercent).toBe(0);

    expect(result.komposisiVolume.hasData).toBe(false);
    expect(result.komposisiVolume.totalM3).toBe(0);
    expect(result.komposisiVolume.organik.persen).toBe(0);

    expect(result.pemantauanCh4.status).toBe("Tahap Integrasi IoT");
    expect(result.pemantauanCh4.sensorOnline).toBe("0/0");
    expect(result.pemantauanCh4.progressPercent).toBe(0);
    expect(result.pemantauanCh4.placeholderStatus).toBe("Belum ada data");
  });

  it("should calculate dynamic volumeGrowthPercent when real production logs exist", async () => {
    (prisma.kelurahan.findMany as any).mockResolvedValue([]);
    (prisma.rw.findMany as any).mockResolvedValue([]);
    (prisma.facility.findMany as any).mockResolvedValue([]);
    (prisma.surveiKelurahan.findMany as any).mockResolvedValue([]);
    // Bulan 7 = Agustus, Bulan 8 = September
    (prisma.facilityProductionLog.findMany as any).mockResolvedValue([
      { createdAt: "2026-08-15T10:00:00.000Z", outputKg: 1000 }, // 1000 / 400 = 2.5 m3
      { createdAt: "2026-09-15T10:00:00.000Z", outputKg: 1200 }, // 1200 / 400 = 3.0 m3
    ]);

    const result = await gisEksekutifService.getOverview();

    expect(result.meta.hasTrendData).toBe(true);
    expect(result.trenBulanan[7].volume).toBe(2.5);
    expect(result.trenBulanan[8].volume).toBe(3.0);
    // Pertumbuhan: ((3.0 - 2.5) / 2.5) * 100 = 20.0%
    expect(result.kpi.volumeGrowthPercent).toBe(20.0);
  });

  it("should change KPI metrics dynamically when user switches active month period", async () => {
    (prisma.kelurahan.findMany as any).mockResolvedValue([
      { id: "kel-1", name: "Dago", code: "327301", rws: [{ id: 1, name: "RW 01" }] },
    ]);
    (prisma.rw.findMany as any).mockResolvedValue([]);
    (prisma.facility.findMany as any).mockResolvedValue([]);
    (prisma.surveiKelurahan.findMany as any).mockResolvedValue([
      {
        id: "srv-coblong",
        namaKelurahan: "Dago",
        pemilahanSampah: { persentasePemilahan: "0.20" },
        volumeSampah: {
          organikKgPerHari: 32184,
          anorganikKgPerHari: 14751,
          residuKgPerHari: 6705,
          totalVolumeKgPerHari: 53640, // 53640 * 30 / 1000 = 1609.2 m3/bulan
        },
      },
    ]);
    (prisma.facilityProductionLog.findMany as any).mockResolvedValue([]);

    // 1. Uji periode September 2026
    const resSep = await gisEksekutifService.getOverview({ periode: "September 2026" });
    expect(resSep.meta.periode).toBe("September 2026");
    expect(resSep.kpi.volumeTotal).toBe(1609.2);
    expect(resSep.kpi.volumeGrowthPercent).toBe(4.8);
    expect(resSep.kpi.previousMonthName).toBe("Agu");
    expect(resSep.kpi.kepatuhanPemilahan).toBe(20);

    // 2. Uji periode Agustus 2026
    const resAgu = await gisEksekutifService.getOverview({ periode: "Agustus 2026" });
    expect(resAgu.meta.periode).toBe("Agustus 2026");
    expect(resAgu.kpi.volumeTotal).toBe(1536.0);
    expect(resAgu.kpi.volumeGrowthPercent).toBe(0.1);
    expect(resAgu.kpi.previousMonthName).toBe("Jul");
    expect(resAgu.kpi.kepatuhanPemilahan).toBe(19); // 20 - 1 offset
  });

  it("should keep all facility types in filterOptions.tipeFasilitas even when a specific facility filter is active", async () => {
    (prisma.kelurahan.findMany as any).mockResolvedValue([]);
    (prisma.rw.findMany as any).mockResolvedValue([]);
    (prisma.facility.findMany as any).mockResolvedValue([
      { id: "fac-1", nama: "POC RW 01", jenis: "poc", latitude: -6.88, longitude: 107.61 },
    ]);
    (prisma.surveiKelurahan.findMany as any).mockResolvedValue([]);
    (prisma.facilityProductionLog.findMany as any).mockResolvedValue([]);

    const res = await gisEksekutifService.getOverview({ jenisFasilitas: "poc" });
    // Tipe fasilitas harus tetap memuat opsi lengkap (tidak terpotong hanya POC)
    expect(res.filterOptions.tipeFasilitas).toContain("Semua");
    expect(res.filterOptions.tipeFasilitas).toContain("poc");
    expect(res.filterOptions.tipeFasilitas.length).toBeGreaterThanOrEqual(4);
  });
});
