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
    endlineSurveiKelurahan: {
      findMany: vi.fn(),
    },
    facilityProductionLog: {
      findMany: vi.fn(),
    },
    setoranOtomatis: {
      findMany: vi.fn(),
    },
    setoranManual: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "../lib/prisma.js";
import { gisEksekutifService } from "./gisEksekutifService.js";

describe("gisEksekutifService Real DB Operational Tests (Zero Baseline / 100% Real Transaksi)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.setoranOtomatis.findMany as any).mockResolvedValue([]);
    ((prisma as any).setoranManual.findMany as any).mockResolvedValue([]);
    (prisma.facilityProductionLog.findMany as any).mockResolvedValue([]);
  });

  it("should return synced volume between KPI volumeTotal and komposisiVolume totalM3 from real transactions", async () => {
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

    (prisma.setoranOtomatis.findMany as any).mockResolvedValue([
      {
        id: "so-1",
        status: "ACCEPTED",
        berat: 150,
        hasilKlasifikasiAi: "organik",
        kategoriAktual: "organik",
        createdAt: new Date("2026-09-10T10:00:00.000Z"),
        warga: { rw: { kelurahanId: "kel-1", kelurahan: { name: "Dago" } } },
        bin: null,
      },
      {
        id: "so-2",
        status: "ACCEPTED",
        berat: 200,
        hasilKlasifikasiAi: "anorganik",
        kategoriAktual: "anorganik",
        createdAt: new Date("2026-09-11T10:00:00.000Z"),
        warga: { rw: { kelurahanId: "kel-1", kelurahan: { name: "Dago" } } },
        bin: null,
      },
    ]);

    const result = await gisEksekutifService.getOverview();

    expect(result.success).toBe(true);
    // Verifikasi foto fasilitas ter-map dengan benar
    expect(result.titikFasilitas[0].foto).toBe("uploads/facilities/bank_dago.jpg");

    // Total volume dari komposisi riil: 150 kg org + 200 kg ano = 350 kg -> 0.35 m3
    const org = result.komposisiVolume.organik.volumeM3;
    const ano = result.komposisiVolume.anorganik.volumeM3;
    const res = result.komposisiVolume.residu.volumeM3;
    const expectedSum = Math.round((org + ano + res) * 100) / 100;

    expect(expectedSum).toBe(0.35);
    expect(result.komposisiVolume.totalM3).toBe(expectedSum);
    expect(result.kpi.volumeTotal).toBe(expectedSum);
    expect(result.kpi.kepatuhanSubtext).toBe("Sampel selama giat KKN");
    expect(result.kpi.kepatuhanPemilahan).toBe(100); // 2 dari 2 ACCEPTED = 100%
  });

  it("should normalize shorthand facility type 'maggot' to valid Prisma enum 'rumah_maggot'", async () => {
    (prisma.kelurahan.findMany as any).mockResolvedValue([]);
    (prisma.rw.findMany as any).mockResolvedValue([]);
    (prisma.facility.findMany as any).mockResolvedValue([]);

    await gisEksekutifService.getOverview({ jenisFasilitas: "maggot" });

    expect(prisma.facility.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          jenis: "rumah_maggot",
        }),
      })
    );
  });

  it("should provide period options from August to December 2026 and 5-month KKN trend array", async () => {
    (prisma.kelurahan.findMany as any).mockResolvedValue([]);
    (prisma.rw.findMany as any).mockResolvedValue([]);
    (prisma.facility.findMany as any).mockResolvedValue([]);

    const result = await gisEksekutifService.getOverview({ periode: "Agustus 2026" });

    expect(result.filterOptions.periodes).toEqual([
      "Agustus 2026",
      "September 2026",
      "Oktober 2026",
      "November 2026",
      "Desember 2026",
    ]);
    expect(result.trenBulanan).toHaveLength(5);
    expect(result.trenBulanan[0].bulan).toBe("Agu");
    expect(result.trenBulanan[1].bulan).toBe("Sep");
    expect(result.trenBulanan[2].bulan).toBe("Okt");
    expect(result.trenBulanan[3].bulan).toBe("Nov");
    expect(result.trenBulanan[4].bulan).toBe("Des");
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
    (prisma.setoranOtomatis.findMany as any).mockResolvedValue([
      {
        id: "so-dago",
        status: "ACCEPTED",
        berat: 350,
        hasilKlasifikasiAi: "organik",
        kategoriAktual: "organik",
        createdAt: new Date("2026-09-12T10:00:00.000Z"),
        warga: { rw: { kelurahanId: "kel-1", kelurahan: { name: "Dago" } } },
        bin: null,
      },
    ]);

    const result = await gisEksekutifService.getOverview({ kelurahan: "Dago" });

    expect(result.kpi.fasilitasTerdata).toBe(3);
    expect(result.kpi.fasilitasSubtext).toBe("Kelurahan Dago");
    expect(result.kpi.kepatuhanPemilahan).toBe(100);
    expect(result.kpi.volumeTotal).toBe(0.35); // 350 kg / 1000 = 0.35 m3
    expect(result.komposisiVolume.totalM3).toBe(0.35);
  });

  it("should return clean and honest empty state when database has no real transactions", async () => {
    (prisma.kelurahan.findMany as any).mockResolvedValue([]);
    (prisma.rw.findMany as any).mockResolvedValue([]);
    (prisma.facility.findMany as any).mockResolvedValue([]);
    (prisma.setoranOtomatis.findMany as any).mockResolvedValue([]);
    ((prisma as any).setoranManual.findMany as any).mockResolvedValue([]);

    const result = await gisEksekutifService.getOverview();

    expect(result.kpi.fasilitasTerdata).toBe(0);
    expect(result.kpi.volumeTotal).toBe(0);
    expect(result.kpi.kepatuhanPemilahan).toBeNull();
    expect(result.kpi.volumeGrowthPercent).toBeNull();
    expect(result.kpi.sensorCh4OnlineCount).toBe(0);
    expect(result.kpi.sensorCh4TotalCount).toBe(0);
    expect(result.kpi.sensorCh4ProgressPercent).toBe(0);

    expect(result.komposisiVolume.hasData).toBe(false);
    expect(result.komposisiVolume.totalM3).toBeNull();
    expect(result.komposisiVolume.organik.persen).toBe(0);

    expect(result.pemantauanCh4.status).toBe("Tahap Integrasi IoT");
    expect(result.pemantauanCh4.sensorOnline).toBe("0/0");
    expect(result.pemantauanCh4.progressPercent).toBe(0);
    expect(result.pemantauanCh4.placeholderStatus).toBe("Belum ada data");
  });

  it("should calculate dynamic volumeGrowthPercent when real transactions exist across months", async () => {
    (prisma.kelurahan.findMany as any).mockResolvedValue([]);
    (prisma.rw.findMany as any).mockResolvedValue([]);
    (prisma.facility.findMany as any).mockResolvedValue([]);
    (prisma.setoranOtomatis.findMany as any).mockResolvedValue([
      {
        id: "so-agu",
        status: "ACCEPTED",
        berat: 1000, // 1.0 m3
        hasilKlasifikasiAi: "organik",
        kategoriAktual: "organik",
        createdAt: new Date("2026-08-15T10:00:00.000Z"),
        warga: null,
        bin: null,
      },
      {
        id: "so-sep",
        status: "ACCEPTED",
        berat: 1200, // 1.2 m3
        hasilKlasifikasiAi: "organik",
        kategoriAktual: "organik",
        createdAt: new Date("2026-09-15T10:00:00.000Z"),
        warga: null,
        bin: null,
      },
    ]);

    const result = await gisEksekutifService.getOverview({ periode: "September 2026" });

    expect(result.meta.hasTrendData).toBe(true);
    expect(result.trenBulanan[0].volume).toBe(1.0); // Agu (idx 0)
    expect(result.trenBulanan[1].volume).toBe(1.2); // Sep (idx 1)
    // Pertumbuhan: ((1.2 - 1.0) / 1.0) * 100 = 20.0%
    expect(result.kpi.volumeGrowthPercent).toBe(20.0);
    expect(result.kpi.previousMonthName).toBe("Agu");
  });

  it("should change KPI metrics dynamically when user switches active month period", async () => {
    (prisma.kelurahan.findMany as any).mockResolvedValue([
      { id: "kel-1", name: "Dago", code: "327301", rws: [{ id: 1, name: "RW 01" }] },
    ]);
    (prisma.rw.findMany as any).mockResolvedValue([]);
    (prisma.facility.findMany as any).mockResolvedValue([]);
    (prisma.setoranOtomatis.findMany as any).mockResolvedValue([
      {
        id: "so-sep",
        status: "ACCEPTED",
        berat: 500, // 0.5 m3
        hasilKlasifikasiAi: "organik",
        kategoriAktual: "organik",
        createdAt: new Date("2026-09-15T10:00:00.000Z"),
        warga: { rw: { kelurahanId: "kel-1", kelurahan: { name: "Dago" } } },
        bin: null,
      },
    ]);

    // 1. Uji periode September 2026
    const resSep = await gisEksekutifService.getOverview({ periode: "September 2026" });
    expect(resSep.meta.periode).toBe("September 2026");
    expect(resSep.kpi.volumeTotal).toBe(0.5);
    expect(resSep.kpi.volumeGrowthPercent).toBeNull(); // Agu volume 0
    expect(resSep.kpi.previousMonthName).toBe("Agu");
    expect(resSep.kpi.kepatuhanPemilahan).toBe(100);

    // 2. Uji periode Agustus 2026
    const resAgu = await gisEksekutifService.getOverview({ periode: "Agustus 2026" });
    expect(resAgu.meta.periode).toBe("Agustus 2026");
    expect(resAgu.kpi.volumeTotal).toBe(0);
    expect(resAgu.kpi.volumeGrowthPercent).toBeNull();
    expect(resAgu.kpi.previousMonthName).toBeNull();
    expect(resAgu.kpi.kepatuhanPemilahan).toBeNull();
  });

  it("should keep all facility types in filterOptions.tipeFasilitas even when a specific facility filter is active", async () => {
    (prisma.kelurahan.findMany as any).mockResolvedValue([]);
    (prisma.rw.findMany as any).mockResolvedValue([]);
    (prisma.facility.findMany as any).mockResolvedValue([
      { id: "fac-1", nama: "POC RW 01", jenis: "poc", latitude: -6.88, longitude: 107.61 },
    ]);

    const res = await gisEksekutifService.getOverview({ jenisFasilitas: "poc" });
    expect(res.filterOptions.tipeFasilitas).toContain("Semua");
    expect(res.filterOptions.tipeFasilitas).toContain("poc");
    expect(res.filterOptions.tipeFasilitas.length).toBeGreaterThanOrEqual(4);
  });

  it("should return clean 0 / null state for future months (e.g., Oktober 2026) when no transactions exist", async () => {
    (prisma.kelurahan.findMany as any).mockResolvedValue([
      { id: "kel-1", name: "Dago", code: "327301", rws: [{ id: 1, name: "RW 01" }] },
      { id: "kel-2", name: "Sekeloa", code: "327302", rws: [{ id: 2, name: "RW 01" }] },
    ]);
    (prisma.rw.findMany as any).mockResolvedValue([]);
    (prisma.facility.findMany as any).mockResolvedValue([
      { id: "fac-1", nama: "TPS Dago", jenis: "tps", latitude: -6.88, longitude: 107.61, rw: { name: "RW 01", kelurahan: { name: "Dago" } } },
    ]);
    // Transaksi ada di September, TETAPI tidak boleh bocor ke Oktober 2026
    (prisma.setoranOtomatis.findMany as any).mockResolvedValue([
      {
        id: "so-sep",
        status: "ACCEPTED",
        berat: 500,
        hasilKlasifikasiAi: "organik",
        kategoriAktual: "organik",
        createdAt: new Date("2026-09-15T10:00:00.000Z"),
        warga: { rw: { kelurahanId: "kel-1", kelurahan: { name: "Dago" } } },
        bin: null,
      },
    ]);

    const resOkt = await gisEksekutifService.getOverview({ periode: "Oktober 2026" });

    expect(resOkt.meta.periode).toBe("Oktober 2026");
    expect(resOkt.meta.activeMonthIndex).toBe(9);
    // Data analitik Oktober harus 0 / null
    expect(resOkt.kpi.volumeTotal).toBe(0);
    expect(resOkt.kpi.volumeGrowthPercent).toBeNull();
    expect(resOkt.kpi.kepatuhanPemilahan).toBeNull();
    expect(resOkt.komposisiVolume.hasData).toBe(false);
    expect(resOkt.komposisiVolume.totalM3).toBeNull();

    // Tren bulanan bulan Oktober harus 0
    expect(resOkt.trenBulanan[2].volume).toBe(0);

    // Kepatuhan kelurahan dan poligon Oktober harus abu-abu tanpa data
    resOkt.kepatuhanPerKelurahan.forEach((kel) => {
      expect(kel.hasData).toBe(false);
      expect(kel.kepatuhan).toBeNull();
      expect(kel.volume).toBeNull();
      expect(kel.color).toBe("#9ca3af");
    });

    // Fasilitas fisik tetap terdata
    expect(resOkt.kpi.fasilitasTerdata).toBe(1);
  });
});
