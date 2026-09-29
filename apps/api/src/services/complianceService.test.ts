/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Unit Test: Modul Evaluasi Kepatuhan Pemilahan (ComplianceService)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  complianceService,
  evaluateCompliance,
  normalizeCategory,
  evaluateSortingDetail,
  calculateComplianceMetrics,
} from "./complianceService.js";

// Mock Prisma
vi.mock("../lib/prisma.js", () => {
  return {
    prisma: {
      setoranOtomatis: {
        findMany: vi.fn(),
      },
    },
  };
});

import { prisma } from "../lib/prisma.js";

describe("ComplianceService - Logika & Definisi Kepatuhan Pemilahan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Normalisasi Kategori Sampah (normalizeCategory)", () => {
    it("harus menormalisasi berbagai variasi penulisan Organik", () => {
      expect(normalizeCategory("ORGANIK")).toBe("ORGANIK");
      expect(normalizeCategory("organik")).toBe("ORGANIK");
      expect(normalizeCategory("Sampah Organik")).toBe("ORGANIK");
      expect(normalizeCategory("ORGANIC")).toBe("ORGANIK");
      expect(normalizeCategory("organic")).toBe("ORGANIK");
    });

    it("harus menormalisasi berbagai variasi penulisan Anorganik dan Non-Organik", () => {
      expect(normalizeCategory("ANORGANIK")).toBe("ANORGANIK");
      expect(normalizeCategory("anorganik")).toBe("ANORGANIK");
      expect(normalizeCategory("NON-ORGANIK")).toBe("ANORGANIK");
      expect(normalizeCategory("non organik")).toBe("ANORGANIK");
      expect(normalizeCategory("non_organic")).toBe("ANORGANIK");
      expect(normalizeCategory("inorganic")).toBe("ANORGANIK");
      expect(normalizeCategory("anorganic")).toBe("ANORGANIK");
      expect(normalizeCategory("Sampah Anorganik")).toBe("ANORGANIK");
    });

    it("harus mengembalikan null untuk input kosong atau tidak valid", () => {
      expect(normalizeCategory("")).toBeNull();
      expect(normalizeCategory("   ")).toBeNull();
      expect(normalizeCategory(null)).toBeNull();
      expect(normalizeCategory(undefined)).toBeNull();
      expect(normalizeCategory("B3_MEDIS")).toBeNull();
    });
  });

  describe("2. Logika Biner & Simetri Kepatuhan (evaluateCompliance)", () => {
    it("harus bernilai TRUE (Patuh & Sesuai) saat sampah Organik dibuang ke Wadah Organik", () => {
      expect(evaluateCompliance("ORGANIK", "ORGANIK")).toBe(true);
      expect(evaluateCompliance("organik", "Wadah Organik")).toBe(true);
    });

    it("harus bernilai TRUE (Patuh & Sesuai) saat sampah Anorganik dibuang ke Wadah Anorganik", () => {
      expect(evaluateCompliance("ANORGANIK", "ANORGANIK")).toBe(true);
      expect(evaluateCompliance("non-organik", "Wadah Anorganik")).toBe(true);
    });

    it("harus bernilai FALSE (Tidak Patuh / Tidak Sesuai) saat sampah Organik dibuang ke Wadah Anorganik", () => {
      expect(evaluateCompliance("ORGANIK", "ANORGANIK")).toBe(false);
      expect(evaluateCompliance("organik", "Wadah Anorganik")).toBe(false);
    });

    it("harus bernilai FALSE (Tidak Patuh / Tidak Sesuai) saat sampah Anorganik dibuang ke Wadah Organik", () => {
      expect(evaluateCompliance("ANORGANIK", "ORGANIK")).toBe(false);
      expect(evaluateCompliance("anorganik", "Wadah Organik")).toBe(false);
    });

    it("harus memenuhi sifat simetri biner: evaluateCompliance(A, B) === evaluateCompliance(B, A)", () => {
      const categories = ["ORGANIK", "ANORGANIK"];
      for (const catA of categories) {
        for (const catB of categories) {
          expect(evaluateCompliance(catA, catB)).toBe(evaluateCompliance(catB, catA));
        }
      }
    });

    it("harus mengembalikan false jika salah satu atau kedua kategori tidak valid", () => {
      expect(evaluateCompliance(null, "ORGANIK")).toBe(false);
      expect(evaluateCompliance("ORGANIK", null)).toBe(false);
      expect(evaluateCompliance(undefined, undefined)).toBe(false);
      expect(evaluateCompliance("Residu", "ORGANIK")).toBe(false);
    });
  });

  describe("3. Evaluasi Detail dan Dampak Kontaminasi (evaluateSortingDetail)", () => {
    it("harus memberikan keterangan 'Pemilahan berhasil' saat patuh", () => {
      const resOrg = evaluateSortingDetail("ORGANIK", "ORGANIK");
      expect(resOrg.isCompliant).toBe(true);
      expect(resOrg.systemStatus).toBe("Patuh & Sesuai");
      expect(resOrg.isContaminated).toBe(false);
      expect(resOrg.keterangan).toContain("Pemilahan berhasil");

      const resAnorg = evaluateSortingDetail("ANORGANIK", "ANORGANIK");
      expect(resAnorg.isCompliant).toBe(true);
      expect(resAnorg.systemStatus).toBe("Patuh & Sesuai");
      expect(resAnorg.isContaminated).toBe(false);
    });

    it("harus memberikan detail kontaminasi saat Organik dibuang ke Anorganik", () => {
      const res = evaluateSortingDetail("ORGANIK", "ANORGANIK");
      expect(res.isCompliant).toBe(false);
      expect(res.systemStatus).toBe("Tidak Patuh / Tidak Sesuai");
      expect(res.isContaminated).toBe(true);
      expect(res.dampakKontaminasi).toContain("daur ulang");
    });

    it("harus memberikan detail kontaminasi saat Anorganik dibuang ke Organik", () => {
      const res = evaluateSortingDetail("ANORGANIK", "ORGANIK");
      expect(res.isCompliant).toBe(false);
      expect(res.systemStatus).toBe("Tidak Patuh / Tidak Sesuai");
      expect(res.isContaminated).toBe(true);
      expect(res.dampakKontaminasi).toContain("kompos");
    });

    it("harus menandai 'Tidak Dapat Dinilai' jika label tidak dikenal", () => {
      const res = evaluateSortingDetail("UNKNOWN", "ORGANIK");
      expect(res.isCompliant).toBe(false);
      expect(res.systemStatus).toBe("Tidak Dapat Dinilai");
    });
  });

  describe("4. Agregasi Metrik Kepatuhan & Sub-Analisis (calculateComplianceMetrics)", () => {
    it("harus menangani array kosong secara aman tanpa NaN / division-by-zero", () => {
      const metrics = calculateComplianceMetrics([]);
      expect(metrics.totalAktivitas).toBe(0);
      expect(metrics.indeksKepatuhan).toBe(0);
      expect(metrics.indeksKetidakpatuhan).toBe(0);
      expect(metrics.wadahOrganik.kesesuaianPersen).toBe(0);
      expect(metrics.wadahAnorganik.kesesuaianPersen).toBe(0);
      expect(metrics.totalBeratKg).toBe(0);
    });

    it("harus menghitung metrik kepatuhan per frekuensi dan per bobot secara akurat", () => {
      const sampleLogs = [
        // Wadah Organik: 3 transaksi (2 benar, 1 kontaminasi)
        { wasteCategory: "ORGANIK", binCategory: "ORGANIK", weightKg: 2.0 },
        { wasteCategory: "ORGANIK", binCategory: "ORGANIK", weightKg: 3.0 },
        { wasteCategory: "ANORGANIK", binCategory: "ORGANIK", weightKg: 1.0 }, // salah wadah

        // Wadah Anorganik: 2 transaksi (2 benar)
        { wasteCategory: "ANORGANIK", binCategory: "ANORGANIK", weightKg: 1.5 },
        { wasteCategory: "ANORGANIK", binCategory: "ANORGANIK", weightKg: 2.5 },
      ];

      const metrics = calculateComplianceMetrics(sampleLogs);

      // Total dinilai: 5 transaksi, 4 patuh, 1 tidak patuh
      expect(metrics.totalAktivitas).toBe(5);
      expect(metrics.totalDinilai).toBe(5);
      expect(metrics.totalPatuh).toBe(4);
      expect(metrics.totalTidakPatuh).toBe(1);

      // Indeks Kepatuhan Frekuensi: (4 / 5) * 100 = 80.00%
      expect(metrics.indeksKepatuhan).toBe(80.0);
      expect(metrics.indeksKetidakpatuhan).toBe(20.0);

      // Sub-Analisis Wadah Organik: 3 transaksi, 2 benar (66.67%), 1 kontaminasi (33.33%)
      expect(metrics.wadahOrganik.totalAktivitas).toBe(3);
      expect(metrics.wadahOrganik.aktivitasSesuai).toBe(2);
      expect(metrics.wadahOrganik.aktivitasKontaminasi).toBe(1);
      expect(metrics.wadahOrganik.kesesuaianPersen).toBe(66.67);
      expect(metrics.wadahOrganik.kontaminasiPersen).toBe(33.33);
      expect(metrics.wadahOrganik.totalBeratKg).toBe(6.0);
      expect(metrics.wadahOrganik.beratSesuaiKg).toBe(5.0);
      expect(metrics.wadahOrganik.beratKontaminasiKg).toBe(1.0);

      // Sub-Analisis Wadah Anorganik: 2 transaksi, 2 benar (100.00%), 0 kontaminasi
      expect(metrics.wadahAnorganik.totalAktivitas).toBe(2);
      expect(metrics.wadahAnorganik.aktivitasSesuai).toBe(2);
      expect(metrics.wadahAnorganik.aktivitasKontaminasi).toBe(0);
      expect(metrics.wadahAnorganik.kesesuaianPersen).toBe(100.0);
      expect(metrics.wadahAnorganik.kontaminasiPersen).toBe(0.0);
      expect(metrics.wadahAnorganik.totalBeratKg).toBe(4.0);

      // Bobot Tonase: Total = 10 kg, Sesuai = 9 kg, Kontaminasi = 1 kg
      // Kepatuhan Bobot = (9 / 10) * 100 = 90.00%
      expect(metrics.totalBeratKg).toBe(10.0);
      expect(metrics.totalBeratPatuhKg).toBe(9.0);
      expect(metrics.totalBeratKontaminasiKg).toBe(1.0);
      expect(metrics.kepatuhanBobotPersen).toBe(90.0);

      // Predikat
      expect(metrics.predikat).toBe("Sangat Baik");
    });

    it("harus menyertakan kamus definisi istilah untuk pimpinan daerah", () => {
      const metrics = calculateComplianceMetrics([]);
      expect(metrics.kamusDefinisi.kepatuhan).toBeDefined();
      expect(metrics.kamusDefinisi.ketidakpatuhan).toBeDefined();
      expect(metrics.kamusDefinisi.edukasiTooltip).toContain("Kepatuhan adalah kesesuaian penempatan");
      expect(metrics.kamusDefinisi.kebijakanWaktu).toContain("tanpa dibatasi batas waktu harian ketat");
      expect(metrics.kamusDefinisi.perlakuanAnomali).toContain("tetap dicatat volumenya dalam neraca massa limbah");
    });
  });

  describe("5. Prinsip Pelaporan Fleksibel (No Time-Lock)", () => {
    it("harus mengevaluasi setoran pada jam berapa pun (24/7) secara setara tanpa diskriminasi waktu", () => {
      const midnightLog = {
        wasteCategory: "ORGANIK",
        binCategory: "ORGANIK",
        weightKg: 2.0,
        createdAt: "2026-09-29T01:30:00.000Z", // Jam 01:30 dini hari
      };
      const noonLog = {
        wasteCategory: "ORGANIK",
        binCategory: "ORGANIK",
        weightKg: 2.0,
        createdAt: "2026-09-29T12:00:00.000Z", // Jam 12:00 siang
      };
      const nightLog = {
        wasteCategory: "ORGANIK",
        binCategory: "ORGANIK",
        weightKg: 2.0,
        createdAt: "2026-09-29T23:45:00.000Z", // Jam 23:45 malam
      };

      const metrics = calculateComplianceMetrics([midnightLog, noonLog, nightLog]);
      expect(metrics.totalAktivitas).toBe(3);
      expect(metrics.totalPatuh).toBe(3);
      expect(metrics.indeksKepatuhan).toBe(100);
    });
  });

  describe("6. Integrasi Basis Data (getComplianceMetrics)", () => {
    it("harus memanggil Prisma findMany dengan filter wilayah dan menghitung metrik", async () => {
      const mockDbLogs = [
        {
          id: "log-1",
          berat: 3.5,
          confidenceAi: 0.95,
          hasilKlasifikasiAi: "organik",
          kategoriAktual: null,
          createdAt: new Date(),
          bin: {
            category: { name: "Tempat Sampah Organik" },
            rw: { id: 1, name: "RW 01", kelurahan: { name: "Cipaganti" } },
          },
        },
        {
          id: "log-2",
          berat: 1.5,
          confidenceAi: 0.92,
          hasilKlasifikasiAi: "anorganik",
          kategoriAktual: null,
          createdAt: new Date(),
          bin: {
            category: { name: "Tempat Sampah Organik" }, // Kontaminasi!
            rw: { id: 1, name: "RW 01", kelurahan: { name: "Cipaganti" } },
          },
        },
      ];

      (prisma.setoranOtomatis.findMany as any).mockResolvedValue(mockDbLogs);

      const result = await complianceService.getComplianceMetrics({
        kelurahan: "Cipaganti",
      });

      expect(prisma.setoranOtomatis.findMany).toHaveBeenCalled();
      expect(result.totalAktivitas).toBe(2);
      expect(result.totalPatuh).toBe(1);
      expect(result.totalTidakPatuh).toBe(1);
      expect(result.indeksKepatuhan).toBe(50.0);
      expect(result.wadahOrganik.kesesuaianPersen).toBe(50.0);
      expect(result.wadahOrganik.kontaminasiPersen).toBe(50.0);
    });
  });
});
