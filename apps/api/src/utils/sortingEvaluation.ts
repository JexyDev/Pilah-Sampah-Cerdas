/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

export interface SortingStatusResult {
  ai_confidence: number;
  aiConfidence: number;
  discrepancy_status: string;
  discrepancyStatus: string;
  is_correct: boolean;
  isCorrect: boolean;
}

/**
 * Checks whether the AI classification matches the target bin category.
 */
export function checkClassificationMatch(
  hasilKlasifikasiAi?: string | null,
  binCategory?: { name?: string | null; type?: string | null } | null
): boolean {
  const aiType = (hasilKlasifikasiAi || "").toLowerCase().trim();
  const binType = (binCategory?.name || binCategory?.type || "").toLowerCase().trim();

  if (!binType || !aiType) {
    return true;
  }

  const isAiOrg =
    aiType.includes("organik") && !aiType.includes("anorganik") && !aiType.includes("non");
  const isAiAnorg = aiType.includes("anorganik") || aiType.includes("non");
  const isBinOrg =
    (binType.includes("organik") || binType.includes("organic")) &&
    !binType.includes("anorganik") &&
    !binType.includes("non");
  const isBinAnorg =
    binType.includes("anorganik") || binType.includes("non_organic") || binType.includes("non");

  if (isAiOrg && isBinAnorg) return false;
  if (isAiAnorg && isBinOrg) return false;
  if (isAiOrg && isBinOrg) return true;
  if (isAiAnorg && isBinAnorg) return true;

  return binType.includes(aiType) || aiType.includes(binType);
}

/**
 * Evaluates waste sorting status based on pure AI confidence score and discrepancy status.
 *
 * Rules:
 * 1. is_correct: false if ai_confidence < 0.50 (50%) OR discrepancy_status !== "NONE"
 * 2. is_correct: true if ai_confidence >= 0.50 (50%) AND discrepancy_status === "NONE"
 */
export function evaluateSortingStatus(
  rawConfidence?: any,
  discrepancyStatus?: string | null,
  hasilKlasifikasiAi?: string | null,
  binCategory?: { name?: string | null; type?: string | null } | null
): SortingStatusResult {
  // 1. Determine pure ai_confidence float (0..1 scale)
  let aiConfidence = 0.95;
  if (rawConfidence !== null && rawConfidence !== undefined) {
    const parsed = Number(rawConfidence);
    if (!isNaN(parsed)) {
      aiConfidence = parsed > 1 ? Number((parsed / 100).toFixed(2)) : Number(parsed.toFixed(2));
    }
  }

  // 2. Determine pure discrepancy_status
  let finalDiscrepancy = (discrepancyStatus || "").trim();
  if (!finalDiscrepancy) {
    const isMatch = checkClassificationMatch(hasilKlasifikasiAi, binCategory);
    finalDiscrepancy = isMatch ? "NONE" : "MISMATCH";
  }

  // 3. Determine is_correct
  // Syarat Pemilahan Salah (is_correct: false):
  // - Jika akurasi (confidence score) murni dari respons Model AI kurang dari 50% (< 0.50).
  // - ATAU Jika respons AI mendeteksi user salah memasukkan jenis sampah ke tong yang tidak sesuai (discrepancy_status bernilai selain "NONE").
  // Syarat Pemilahan Berhasil/Benar (is_correct: true):
  // - Jika akurasi murni dari Model AI lebih dari atau sama dengan 50% (>= 0.50) DAN tidak ada pelanggaran jenis tong sampah (discrepancy_status bernilai "NONE").
  const isConfidenceValid = aiConfidence >= 0.50;
  const isDiscrepancyNone = finalDiscrepancy.toUpperCase() === "NONE";
  const isCorrect = isConfidenceValid && isDiscrepancyNone;

  return {
    ai_confidence: aiConfidence,
    aiConfidence: aiConfidence,
    discrepancy_status: finalDiscrepancy,
    discrepancyStatus: finalDiscrepancy,
    is_correct: isCorrect,
    isCorrect: isCorrect,
  };
}
