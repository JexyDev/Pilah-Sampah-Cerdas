/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Unit Test: Pembatasan Hak Akses Role Pimpinan (View-Only) pada Modul Penilaian KKN
 */

import { describe, it, expect } from "vitest";
import { penilaianKknService } from "./penilaianKknService.js";
import { dplService } from "./dplService.js";

describe("Penilaian KKN - Pembatasan Hak Akses Role Pimpinan (View-Only)", () => {
  describe("penilaianKknService.saveLaporanAkhirKelompokScore", () => {
    it("should reject saving kelompok score with FORBIDDEN_ROLE for PEMIMPIN", async () => {
      await expect(
        penilaianKknService.saveLaporanAkhirKelompokScore(
          "kelompok-1",
          "user-pemimpin-1",
          "PEMIMPIN",
          {
            statusTelaah: "DISETUJUI",
            rubrikScores: { sistematika: 85, analisis: 85, output: 85, refleksi: 85 },
          }
        )
      ).rejects.toThrow("FORBIDDEN_ROLE");
    });

    it("should reject saving kelompok score with FORBIDDEN_ROLE for PIMPINAN", async () => {
      await expect(
        penilaianKknService.saveLaporanAkhirKelompokScore(
          "kelompok-1",
          "user-pimpinan-1",
          "PIMPINAN",
          {
            statusTelaah: "DISETUJUI",
            rubrikScores: { sistematika: 85, analisis: 85, output: 85, refleksi: 85 },
          }
        )
      ).rejects.toThrow("FORBIDDEN_ROLE");
    });
  });

  describe("penilaianKknService.saveLaporanAkhirScore", () => {
    it("should reject saving student score with FORBIDDEN_ROLE for PEMIMPIN", async () => {
      await expect(
        penilaianKknService.saveLaporanAkhirScore(
          "student-1",
          "user-pemimpin-1",
          "PEMIMPIN",
          88,
          "Catatan"
        )
      ).rejects.toThrow("FORBIDDEN_ROLE");
    });

    it("should reject saving student score with FORBIDDEN_ROLE for PIMPINAN", async () => {
      await expect(
        penilaianKknService.saveLaporanAkhirScore(
          "student-1",
          "user-pimpinan-1",
          "PIMPINAN",
          88,
          "Catatan"
        )
      ).rejects.toThrow("FORBIDDEN_ROLE");
    });
  });

  describe("dplService.assessProgramKerja", () => {
    it("should reject assessing program kerja with FORBIDDEN_ROLE for PEMIMPIN", async () => {
      await expect(
        dplService.assessProgramKerja(
          "user-pemimpin-1",
          "proker-1",
          90,
          "Catatan evaluasi",
          "PEMIMPIN"
        )
      ).rejects.toThrow("FORBIDDEN_ROLE");
    });

    it("should reject assessing program kerja with FORBIDDEN_ROLE for PIMPINAN", async () => {
      await expect(
        dplService.assessProgramKerja(
          "user-pimpinan-1",
          "proker-1",
          90,
          "Catatan evaluasi",
          "PIMPINAN"
        )
      ).rejects.toThrow("FORBIDDEN_ROLE");
    });

    it("should reject assessing program kerja with FORBIDDEN_ROLE for MPL", async () => {
      await expect(
        dplService.assessProgramKerja(
          "user-mpl-1",
          "proker-1",
          90,
          "Catatan evaluasi",
          "MPL"
        )
      ).rejects.toThrow("FORBIDDEN_ROLE");
    });
  });

  describe("MPL (Mitra Lapangan) specific role boundaries", () => {
    it("should reject saving laporan akhir kelompok for MPL", async () => {
      await expect(
        penilaianKknService.saveLaporanAkhirKelompokScore(
          "kelompok-1",
          "user-mpl-1",
          "MPL",
          {
            statusTelaah: "DISETUJUI",
            rubrikScores: { sistematika: 85, analisis: 85, output: 85, refleksi: 85 },
          }
        )
      ).rejects.toThrow("FORBIDDEN_ROLE");
    });

    it("should reject saving individual laporan akhir score for MPL", async () => {
      await expect(
        penilaianKknService.saveLaporanAkhirScore(
          "student-1",
          "user-mpl-1",
          "MPL",
          88,
          "Catatan"
        )
      ).rejects.toThrow("FORBIDDEN_ROLE");
    });

    it("should reject deciding proker proposal for MPL", async () => {
      await expect(
        dplService.decideProgramKerja(
          "user-mpl-1",
          "proker-1",
          "DISETUJUI",
          "Catatan",
          "MPL"
        )
      ).rejects.toThrow("FORBIDDEN_ROLE");
    });
  });

  describe("Dynamic Assessment Weight (Komposisi Bobot DPL & MPL)", () => {
    it("should calculate correct composite score with default 50% DPL + 50% MPL", () => {
      const score = penilaianKknService.calculateCompositeScore(80, 90, 50, 50);
      // (80 * 50/100) + (90 * 50/100) = 40 + 45 = 85
      expect(score).toBe(85);
    });

    it("should calculate correct composite score with custom dynamic weights (e.g. 60% DPL + 40% MPL)", () => {
      const score = penilaianKknService.calculateCompositeScore(80, 90, 40, 60);
      // (80 * 40/100) + (90 * 60/100) = 32 + 54 = 86
      expect(score).toBe(86);
    });

    it("should calculate correct composite score with 70% DPL + 30% MPL", () => {
      const score = penilaianKknService.calculateCompositeScore(75, 95, 30, 70);
      // (75 * 0.3) + (95 * 0.7) = 22.5 + 66.5 = 89
      expect(score).toBe(89);
    });
  });
});
