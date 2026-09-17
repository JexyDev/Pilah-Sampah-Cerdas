/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Unit Test: Normalisasi Formula Penilaian KKN & Pencegahan Nilai E Prematur
 */

import { describe, it, expect } from "vitest";
import {
  calculateGradeCategory,
  calculateAspectScore,
  calculateProgressiveAspectSubtotal,
  calculateCompositeScore,
} from "./penilaianKknService.js";

describe("Penilaian KKN - Normalisasi Formula & Anti Nilai E Prematur", () => {
  describe("calculateAspectScore", () => {
    it("should calculate exact score based on weight and clamp between 0-100", () => {
      expect(calculateAspectScore(90, 10)).toBe(9.0);
      expect(calculateAspectScore(100, 20)).toBe(20.0);
      expect(calculateAspectScore(85, 15)).toBe(12.75);
      expect(calculateAspectScore(-10, 20)).toBe(0.0);
      expect(calculateAspectScore(150, 20)).toBe(20.0);
    });
  });

  describe("calculateProgressiveAspectSubtotal", () => {
    it("should normalize subtotal to 100-basis when only Laporan Akhir (10% weight) is assessed", () => {
      const aspects = [
        { score: 0, weight: 20 },
        { score: 0, weight: 10 },
        { score: 0, weight: 20 },
        { score: 0, weight: 20 },
        { score: 0, weight: 20 },
        { score: 90, weight: 10 }, // Laporan Akhir = 90
      ];
      const result = calculateProgressiveAspectSubtotal(aspects);
      expect(result.rawSubtotal).toBe(9.0);
      expect(result.totalAssessedWeight).toBe(10);
      // Normalized: (9.0 / 10) * 100 = 90.00
      expect(result.normalizedSubtotal).toBe(90.0);
    });

    it("should normalize subtotal when Laporan Akhir (10%) and Logbook (20%) are assessed", () => {
      const aspects = [
        { score: 0, weight: 20 },
        { score: 0, weight: 10 },
        { score: 100, weight: 20 }, // Logbook = 100
        { score: 0, weight: 20 },
        { score: 0, weight: 20 },
        { score: 90, weight: 10 },  // Laporan Akhir = 90
      ];
      const result = calculateProgressiveAspectSubtotal(aspects);
      expect(result.rawSubtotal).toBe(29.0); // 20 + 9
      expect(result.totalAssessedWeight).toBe(30);
      // Normalized: (29.0 / 30) * 100 = 96.67
      expect(result.normalizedSubtotal).toBe(96.67);
    });

    it("should match rawSubtotal when all aspects (100% weight) are fully assessed", () => {
      const aspects = [
        { score: 85, weight: 20 }, // 17
        { score: 90, weight: 10 }, // 9
        { score: 100, weight: 20 }, // 20
        { score: 80, weight: 20 }, // 16
        { score: 85, weight: 20 }, // 17
        { score: 90, weight: 10 }, // 9
      ];
      const result = calculateProgressiveAspectSubtotal(aspects);
      expect(result.totalAssessedWeight).toBe(100);
      expect(result.rawSubtotal).toBe(88.0);
      expect(result.normalizedSubtotal).toBe(88.0);
    });
  });

  describe("calculateCompositeScore", () => {
    it("should calculate standard 50:50 composite score when both evaluators have assessed", () => {
      const subtotalMitra = 80;
      const subtotalDpl = 90;
      const composite = calculateCompositeScore(subtotalMitra, subtotalDpl, 50, 50);
      // (80 * 0.5) + (90 * 0.5) = 40 + 45 = 85.00
      expect(composite).toBe(85.0);
    });

    it("should normalize to 100% DPL basis when Mitra has not yet assessed (Single Evaluator Mode)", () => {
      const subtotalMitra = 0;
      const subtotalDpl = 85;
      const composite = calculateCompositeScore(subtotalMitra, subtotalDpl, 50, 50, true);
      // Instead of being cut down to 42.50 (Grade E), single evaluator is normalized to 85.00 (Grade A)
      expect(composite).toBe(85.0);
    });

    it("should normalize to 100% Mitra basis when DPL has not yet assessed (Single Evaluator Mode)", () => {
      const subtotalMitra = 92;
      const subtotalDpl = 0;
      const composite = calculateCompositeScore(subtotalMitra, subtotalDpl, 50, 50, true);
      expect(composite).toBe(92.0);
    });

    it("should fallback to raw partial contribution when normalizeSingleEvaluator is false", () => {
      const subtotalMitra = 0;
      const subtotalDpl = 80;
      const composite = calculateCompositeScore(subtotalMitra, subtotalDpl, 50, 50, false);
      expect(composite).toBe(40.0);
    });
  });

  describe("calculateGradeCategory", () => {
    it("should return correct standard letter grades for scores >= 50", () => {
      expect(calculateGradeCategory(95)).toBe("A");
      expect(calculateGradeCategory(80)).toBe("A");
      expect(calculateGradeCategory(79.9)).toBe("B");
      expect(calculateGradeCategory(70)).toBe("B");
      expect(calculateGradeCategory(65)).toBe("C");
      expect(calculateGradeCategory(50)).toBe("D");
    });

    it("should return 'Belum Lengkap' instead of premature 'E' when assessment is in-progress / draft", () => {
      // Mahasiswa dengan nilai sementara 9 atau 39 karena baru dinilai sebagian
      const incompleteOptions = { isFinalized: false, isComplete: false };
      expect(calculateGradeCategory(9.0, incompleteOptions)).toBe("Belum Lengkap");
      expect(calculateGradeCategory(39.0, incompleteOptions)).toBe("Belum Lengkap");
      expect(calculateGradeCategory(45.0, incompleteOptions)).toBe("Belum Lengkap");
    });

    it("should return official 'E' only when assessment is officially finalized and score is below 50", () => {
      const finalizedOptions = { isFinalized: true, isComplete: true };
      expect(calculateGradeCategory(45.0, finalizedOptions)).toBe("E");
      expect(calculateGradeCategory(9.0, finalizedOptions)).toBe("E");
    });

    it("should return 'Belum Dinilai' when score is 0", () => {
      expect(calculateGradeCategory(0)).toBe("Belum Dinilai");
    });
  });
});
