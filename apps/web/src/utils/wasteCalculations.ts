/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Module: wasteCalculations
 * Deskripsi: Modul utilitas matematis & analitik kalkulasi delta dampak persampahan:
 * - Penurunan Volume Sampah: Delta Volume (kg) & Delta Volume (%)
 * - Perubahan Kepatuhan Pemilahan: Delta Kepatuhan (% / PP)
 * - Agregasi Terbobot (Weighted Aggregation) vs Rata-rata Aritmetika
 * - Pemisahan Sumber Data (WARGA_APP vs PETUGAS_LAPANGAN)
 */

export type WasteSourceType = "ALL" | "WARGA_APP" | "PETUGAS_LAPANGAN";

export interface WasteImpactItem {
  id: string;
  kelurahan: string;
  baselineKg?: number | null;
  actualKg?: number | null;
  baselineCompliance?: number | null; // dalam skala 0 - 100 (%)
  actualCompliance?: number | null;   // dalam skala 0 - 100 (%)
  wargaKg?: number | null;            // bersumber dari WARGA_APP
  petugasKg?: number | null;          // bersumber dari PETUGAS_LAPANGAN
  sourceType?: WasteSourceType;
  hasBaseline?: boolean;
  hasEndline?: boolean;
  status?: string;
  setoranDinilai?: number;
  setoranPatuh?: number;
  partisipasiWarga?: number | null;
  akurasiPilah?: number | null;
  wargaAktif?: number | null;
  totalWarga?: number | null;
}

export interface WasteImpactAggregation {
  totalBaselineKg: number;
  totalActualKg: number;
  totalDeltaKg: number;
  weightedDeltaPct: number | null;
  simpleAvgDeltaPct: number | null;
  avgBaselineCompliance: number;
  avgActualCompliance: number;
  deltaCompliance: number;
  totalWargaKg: number;
  totalPetugasKg: number;
  kelurahanCount: number;
}

/**
 * 1. Menghitung Penurunan Volume Sampah dalam Satuan Berat (kg)
 * Rumus: Delta_volume (kg) = Volume_Baseline - Volume_Aktual
 * Catatan:
 * - Nilai positif menandakan volume timbulan sampah berkurang / tereduksi.
 * - Nilai negatif menandakan terjadi peningkatan / lonjakan timbulan sampah.
 */
export function calculateVolumeDeltaKg(
  baselineKg: number | null | undefined,
  actualKg: number | null | undefined
): number | null {
  if (baselineKg === null || baselineKg === undefined) return null;
  const actual = actualKg ?? 0;
  return Number((baselineKg - actual).toFixed(2));
}

/**
 * 2. Menghitung Penurunan Volume Sampah dalam Satuan Persentase (%)
 * Rumus: Delta_volume (%) = ((Volume_Baseline - Volume_Aktual) / Volume_Baseline) * 100%
 * Catatan Proteksi & Edge Cases:
 * - Jika Volume_Baseline <= 0, mengembalikan null untuk menghindari Division by Zero (div/0).
 * - Jika Volume_Aktual > Volume_Baseline, menghasilkan persentase negatif tanpa merusak format.
 * - Studi kasus Lebakgede: Baseline = 250 kg, Aktual = 37 kg ->
 *   (250 - 37) / 250 * 100% = 213 / 250 * 100% = 85.20%.
 */
export function calculateVolumeDeltaPct(
  baselineKg: number | null | undefined,
  actualKg: number | null | undefined
): number | null {
  if (baselineKg === null || baselineKg === undefined || baselineKg <= 0) {
    return null;
  }
  const actual = actualKg ?? 0;
  const delta = ((baselineKg - actual) / baselineKg) * 100;
  return Number(delta.toFixed(2));
}

/**
 * 3. Menghitung Kenaikan / Perubahan Kepatuhan Pemilahan
 * Rumus: Delta_kepatuhan = Kepatuhan_Aktual - Kepatuhan_Baseline
 * Disajikan dalam persentase (%) atau Percentage Point (PP).
 */
export function calculateComplianceDelta(
  baselineRate: number | null | undefined,
  actualRate: number | null | undefined
): number | null {
  if (
    baselineRate === null ||
    baselineRate === undefined ||
    actualRate === null ||
    actualRate === undefined
  ) {
    return null;
  }
  return Number((actualRate - baselineRate).toFixed(2));
}

/**
 * 4. Format Nilai Delta Berat (kg)
 * Format angka Bahasa Indonesia (koma untuk desimal, titik untuk ribuan)
 */
export function formatDeltaKg(
  val: number | null | undefined,
  options: { showPlusSign?: boolean; fallback?: string } = {}
): string {
  const { showPlusSign = true, fallback = "—" } = options;
  if (val === null || val === undefined || isNaN(val)) return fallback;

  const formatted = Math.abs(val).toLocaleString("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  });

  if (val > 0) {
    return showPlusSign ? `+${formatted} kg` : `${formatted} kg`;
  } else if (val < 0) {
    return `-${formatted} kg`;
  }
  return `0,0 kg`;
}

/**
 * 5. Format Nilai Delta Persentase (%)
 */
export function formatDeltaPct(
  val: number | null | undefined,
  options: { showPlusSign?: boolean; fallback?: string } = {}
): string {
  const { showPlusSign = true, fallback = "—" } = options;
  if (val === null || val === undefined || isNaN(val)) return fallback;

  const formatted = Math.abs(val).toLocaleString("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  if (val > 0) {
    return showPlusSign ? `+${formatted}%` : `${formatted}%`;
  } else if (val < 0) {
    return `-${formatted}%`;
  }
  return `0,0%`;
}

/**
 * 6. Format Delta Kepatuhan Pemilahan (% atau PP)
 */
export function formatComplianceDelta(
  val: number | null | undefined,
  options: { unit?: "%" | "pp"; showPlusSign?: boolean; fallback?: string; fractionDigits?: number } = {}
): string {
  const { unit = "%", showPlusSign = true, fallback = "—", fractionDigits } = options;
  if (val === null || val === undefined || isNaN(val)) return fallback;

  const minDigits = fractionDigits !== undefined ? fractionDigits : 1;
  const maxDigits = fractionDigits !== undefined ? fractionDigits : 2;

  const formatted = Math.abs(val).toLocaleString("id-ID", {
    minimumFractionDigits: minDigits,
    maximumFractionDigits: maxDigits,
  });

  const suffix = unit === "pp" ? " pp" : "%";

  if (val > 0) {
    return showPlusSign ? `+${formatted}${suffix}` : `${formatted}${suffix}`;
  } else if (val < 0) {
    return `-${formatted}${suffix}`;
  }
  return `0,00${suffix}`;
}

/**
 * 7. Agregasi Dampak Persampahan Lintas Kelurahan (Tingkat Kecamatan)
 * Menggunakan prinsip Agregasi Terbobot (Weighted Aggregation):
 * - Total Delta Volume (kg) = Total Baseline - Total Aktual
 * - Weighted Delta Volume (%) = ((Total Baseline - Total Aktual) / Total Baseline) * 100%
 * Ini mencegah bias / paradoks rata-rata kelurahan bervolume kecil mendistorsi angka kecamatan.
 */
export function aggregateKelurahanImpact(items: WasteImpactItem[]): WasteImpactAggregation {
  let totalBaselineKg = 0;
  let totalActualKg = 0;
  let totalWargaKg = 0;
  let totalPetugasKg = 0;
  let sumBaselineCompliance = 0;
  let countBaselineCompliance = 0;
  let sumActualCompliance = 0;
  let countActualCompliance = 0;
  let sumDeltaPct = 0;
  let countDeltaPct = 0;

  // Weighted compliance components
  let totalSetoranDinilai = 0;
  let totalSetoranPatuh = 0;

  items.forEach((item) => {
    if (item.baselineKg && item.baselineKg > 0) {
      totalBaselineKg += item.baselineKg;
    }
    const actKg = Number(item.actualKg || 0);
    totalActualKg += actKg;

    if (item.wargaKg !== undefined && item.wargaKg !== null) {
      totalWargaKg += Number(item.wargaKg);
    } else {
      totalWargaKg += actKg;
    }

    if (item.petugasKg !== undefined && item.petugasKg !== null) {
      totalPetugasKg += Number(item.petugasKg);
    }

    if (item.baselineCompliance !== null && item.baselineCompliance !== undefined) {
      sumBaselineCompliance += item.baselineCompliance;
      countBaselineCompliance++;
    }

    if (item.actualCompliance !== null && item.actualCompliance !== undefined) {
      sumActualCompliance += item.actualCompliance;
      countActualCompliance++;
    }

    if (item.setoranDinilai && item.setoranPatuh !== undefined) {
      totalSetoranDinilai += item.setoranDinilai;
      totalSetoranPatuh += item.setoranPatuh;
    }

    const dPct = calculateVolumeDeltaPct(item.baselineKg, item.actualKg);
    if (dPct !== null) {
      sumDeltaPct += dPct;
      countDeltaPct++;
    }
  });

  const totalDeltaKg = Number((totalBaselineKg - totalActualKg).toFixed(2));
  const weightedDeltaPct =
    totalBaselineKg > 0
      ? Number((((totalBaselineKg - totalActualKg) / totalBaselineKg) * 100).toFixed(2))
      : null;
  const simpleAvgDeltaPct =
    countDeltaPct > 0 ? Number((sumDeltaPct / countDeltaPct).toFixed(2)) : null;

  const avgBaselineCompliance =
    countBaselineCompliance > 0
      ? Number((sumBaselineCompliance / countBaselineCompliance).toFixed(1))
      : 0;

  // Prefer weighted actual compliance if available, otherwise simple average
  const avgActualCompliance =
    totalSetoranDinilai > 0
      ? Number(((totalSetoranPatuh / totalSetoranDinilai) * 100).toFixed(1))
      : countActualCompliance > 0
      ? Number((sumActualCompliance / countActualCompliance).toFixed(1))
      : 0;

  const deltaCompliance = Number((avgActualCompliance - avgBaselineCompliance).toFixed(1));

  return {
    totalBaselineKg: Number(totalBaselineKg.toFixed(2)),
    totalActualKg: Number(totalActualKg.toFixed(2)),
    totalDeltaKg,
    weightedDeltaPct,
    simpleAvgDeltaPct,
    avgBaselineCompliance,
    avgActualCompliance,
    deltaCompliance,
    totalWargaKg: Number(totalWargaKg.toFixed(2)),
    totalPetugasKg: Number(totalPetugasKg.toFixed(2)),
    kelurahanCount: items.length,
  };
}
