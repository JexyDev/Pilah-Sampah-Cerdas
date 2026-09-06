/**
 * Test Suite for Sorting Evaluation Utility
 */
import { describe, it, expect } from "vitest";
import { evaluateSortingStatus, checkClassificationMatch } from "./sortingEvaluation.js";

describe("sortingEvaluation Utility", () => {
  describe("checkClassificationMatch", () => {
    it("should return true when types match", () => {
      expect(checkClassificationMatch("organik", { name: "ORGANIC" })).toBe(true);
      expect(checkClassificationMatch("organik", { name: "ORGANIK" })).toBe(true);
      expect(checkClassificationMatch("anorganik", { name: "ANORGANIK" })).toBe(true);
      expect(checkClassificationMatch("anorganik", { name: "NON_ORGANIC" })).toBe(true);
    });

    it("should return false when types mismatch", () => {
      expect(checkClassificationMatch("organik", { name: "ANORGANIK" })).toBe(false);
      expect(checkClassificationMatch("organik", { name: "NON_ORGANIC" })).toBe(false);
      expect(checkClassificationMatch("anorganik", { name: "ORGANIC" })).toBe(false);
      expect(checkClassificationMatch("anorganik", { name: "ORGANIK" })).toBe(false);
    });
  });

  describe("evaluateSortingStatus - is_correct Calculation Rules", () => {
    it("should return is_correct: true when confidence >= 0.50 and discrepancyStatus is NONE", () => {
      const result = evaluateSortingStatus(0.64, "NONE");
      expect(result.ai_confidence).toBe(0.64);
      expect(result.discrepancy_status).toBe("NONE");
      expect(result.is_correct).toBe(true);
      expect(result.isCorrect).toBe(true);
    });

    it("should return is_correct: true when confidence is exactly 0.50 and discrepancyStatus is NONE", () => {
      const result = evaluateSortingStatus(0.5, "NONE");
      expect(result.ai_confidence).toBe(0.5);
      expect(result.discrepancy_status).toBe("NONE");
      expect(result.is_correct).toBe(true);
    });

    it("should return is_correct: false when confidence < 0.50 even if discrepancyStatus is NONE", () => {
      const result = evaluateSortingStatus(0.49, "NONE");
      expect(result.ai_confidence).toBe(0.49);
      expect(result.discrepancy_status).toBe("NONE");
      expect(result.is_correct).toBe(false);
      expect(result.isCorrect).toBe(false);
    });

    it("should return is_correct: false when discrepancyStatus is not NONE even if confidence >= 0.50", () => {
      const result = evaluateSortingStatus(0.85, "MISMATCH");
      expect(result.ai_confidence).toBe(0.85);
      expect(result.discrepancy_status).toBe("MISMATCH");
      expect(result.is_correct).toBe(false);
      expect(result.isCorrect).toBe(false);
    });

    it("should return is_correct: false when both confidence < 0.50 and discrepancyStatus != NONE", () => {
      const result = evaluateSortingStatus(0.3, "MISMATCH");
      expect(result.ai_confidence).toBe(0.3);
      expect(result.discrepancy_status).toBe("MISMATCH");
      expect(result.is_correct).toBe(false);
    });

    it("should handle confidence in 0..100 scale correctly", () => {
      const result1 = evaluateSortingStatus(95, "NONE");
      expect(result1.ai_confidence).toBe(0.95);
      expect(result1.is_correct).toBe(true);

      const result2 = evaluateSortingStatus(45, "NONE");
      expect(result2.ai_confidence).toBe(0.45);
      expect(result2.is_correct).toBe(false);
    });

    it("should automatically infer discrepancy status from classification and bin category when omitted", () => {
      const resultMatch = evaluateSortingStatus(0.75, undefined, "organik", { name: "ORGANIC" });
      expect(resultMatch.discrepancy_status).toBe("NONE");
      expect(resultMatch.is_correct).toBe(true);

      const resultMismatch = evaluateSortingStatus(0.75, undefined, "anorganik", { name: "ORGANIC" });
      expect(resultMismatch.discrepancy_status).toBe("MISMATCH");
      expect(resultMismatch.is_correct).toBe(false);
    });
  });
});
