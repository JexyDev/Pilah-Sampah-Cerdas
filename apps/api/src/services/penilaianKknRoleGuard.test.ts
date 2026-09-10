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
  });
});
