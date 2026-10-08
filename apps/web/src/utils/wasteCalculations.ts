/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Module: wasteCalculations
 * Deskripsi: Modul utilitas matematis & analitik kalkulasi delta dampak persampahan:
 * - Penurunan Berat Sampah: Delta Berat (kg) & Delta Berat (%)
 * - Perubahan Kepatuhan Pemilahan: Delta Kepatuhan (% / PP)
 * - Agregasi Terbobot (Weighted Aggregation) vs Rata-rata Aritmetika
 * - Pemisahan Sumber Data (WARGA_APP vs PETUGAS_LAPANGAN)
 */

export type WasteSourceType = "ALL" | "WARGA_APP" | "PETUGAS_LAPANGAN";
export type WastePeriodMode = "DAILY" | "MONTHLY";

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
  periodMode?: WastePeriodMode;
  hasBaseline?: boolean;
  hasEndline?: boolean;
  status?: string;
  setoranDinilai?: number;
  setoranPatuh?: number;
  partisipasiWarga?: number | null;
  akurasiPilah?: number | null;
  wargaAktif?: number | null;
  totalWarga?: number | null;
  rawAccumulatedKg?: number | null; // Total akumulasi kotor sebelum dinormalisasi per hari
  dailyAverageKg?: number | null;   // Rata-rata per hari (kg/hari) dari standar 30 hari
  monthlyActualKg?: number | null;  // Total/proyeksi per bulan (kg/bulan = data harian * 30)
  monthlyBaselineKg?: number | null; // Baseline per bulan (kg/bulan = baseline harian * 30)
}

export interface WasteImpactAggregation {
  totalBaselineKg: number;
  totalActualKg: number;
  totalDeltaKg: number | null;
  weightedDeltaPct: number | null;
  simpleAvgDeltaPct: number | null;
  avgBaselineCompliance: number;
  avgActualCompliance: number | null;
  deltaCompliance: number | null;
  totalWargaKg: number;
  totalPetugasKg: number;
  totalAccumulatedKg?: number;
  kelurahanCount: number;
  periodMode?: WastePeriodMode;
}

/**
 * Standar Siklus Hari Pelaporan: 30 hari kalender.
 * Rekapitulasi rata-rata harian ditarik berkala setiap tanggal 7 setiap bulannya.
 */
export const STANDARD_CYCLE_DAYS = 30;

/**
 * Menghitung rata-rata berat sampah per hari dari total akumulasi periode.
 * Standar ISO: kg/hari = Total Akumulasi (kg) / 30 hari.
 */
export function calculateDailyAverageKg(
  accumulatedKg: number | null | undefined,
  days: number = STANDARD_CYCLE_DAYS
): number {
  if (accumulatedKg === null || accumulatedKg === undefined || isNaN(accumulatedKg) || days <= 0) {
    return 0;
  }
  return Number((accumulatedKg / days).toFixed(2));
}

/**
 * Menghitung berat sampah per bulan (asumsi 30 hari) dari rata-rata/baseline harian.
 * Standar: kg/bulan = kg/hari * 30 hari.
 */
export function calculateMonthlyKg(
  dailyKg: number | null | undefined,
  days: number = STANDARD_CYCLE_DAYS
): number | null {
  if (dailyKg === null || dailyKg === undefined || isNaN(dailyKg)) {
    return null;
  }
  return Number((dailyKg * days).toFixed(2));
}

/**
 * 1. Menghitung Penurunan Berat Sampah dalam Satuan Berat (kg)
 * Rumus: Delta_berat (kg) = Berat_Baseline - Berat_Aktual
 * Catatan:
 * - Nilai positif menandakan berat timbulan sampah berkurang / tereduksi.
 * - Nilai negatif menandakan terjadi peningkatan / lonjakan timbulan sampah.
 */
export function calculateWeightDeltaKg(
  baselineKg: number | null | undefined,
  actualKg: number | null | undefined
): number | null {
  if (baselineKg === null || baselineKg === undefined) return null;
  if (actualKg === null || actualKg === undefined || actualKg <= 0) return null;
  return Number((baselineKg - actualKg).toFixed(2));
}
export const calculateBeratDeltaKg = calculateWeightDeltaKg;
export const calculateVolumeDeltaKg = calculateWeightDeltaKg;

/**
 * 2. Menghitung Penurunan Berat Sampah dalam Satuan Persentase (%)
 * Rumus: Delta_berat (%) = ((Berat_Baseline - Berat_Aktual) / Berat_Baseline) * 100%
 * Catatan Proteksi & Edge Cases:
 * - Jika Berat_Baseline <= 0 atau data aktual belum ada (<= 0), return null agar tidak terjadi klaim penurunan 100% palsu saat data kosong.
 * - Jika Berat_Aktual > Berat_Baseline, menghasilkan persentase negatif tanpa merusak format.
 * - Studi kasus Lebakgede: Baseline = 250 kg, Aktual = 37 kg ->
 *   (250 - 37) / 250 * 100% = 213 / 250 * 100% = 85.20%.
 */
export function calculateWeightDeltaPct(
  baselineKg: number | null | undefined,
  actualKg: number | null | undefined
): number | null {
  if (baselineKg === null || baselineKg === undefined || baselineKg <= 0) {
    return null;
  }
  if (actualKg === null || actualKg === undefined || actualKg <= 0) {
    return null;
  }
  const delta = ((baselineKg - actualKg) / baselineKg) * 100;
  return Number(delta.toFixed(2));
}
export const calculateBeratDeltaPct = calculateWeightDeltaPct;
export const calculateVolumeDeltaPct = calculateWeightDeltaPct;

/**
 * 3. Menghitung Kenaikan / Perubahan Kepatuhan Pemilahan
 * Rumus: Delta_kepatuhan = Kepatuhan_Aktual - Kepatuhan_Baseline
 * Disajikan dalam persentase (%) atau Percentage Point (PP).
 * Jika actualRate belum terdata (null / <= 0), return null agar tidak menghasilkan penurunan minus palsu.
 */
export function calculateComplianceDelta(
  baselineRate: number | null | undefined,
  actualRate: number | null | undefined
): number | null {
  if (
    baselineRate === null ||
    baselineRate === undefined ||
    actualRate === null ||
    actualRate === undefined ||
    actualRate <= 0
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
  options: { showPlusSign?: boolean; fallback?: string; unit?: string } = {}
): string {
  const { showPlusSign = true, fallback = "—", unit = "kg" } = options;
  if (val === null || val === undefined || isNaN(val)) return fallback;

  const formatted = Math.abs(val).toLocaleString("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  });

  if (val > 0) {
    return showPlusSign ? `+${formatted} ${unit}` : `${formatted} ${unit}`;
  } else if (val < 0) {
    return `-${formatted} ${unit}`;
  }
  return `0,0 ${unit}`;
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
  const { unit = "pp", showPlusSign = true, fallback = "—", fractionDigits } = options;
  if (val === null || val === undefined || isNaN(val)) return fallback;

  const minDigits = fractionDigits !== undefined ? fractionDigits : 1;
  const maxDigits = fractionDigits !== undefined ? fractionDigits : 1;

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
  return `0,0${suffix}`;
}

/**
 * 7. Agregasi Dampak Persampahan Lintas Kelurahan (Tingkat Kecamatan)
 * Menggunakan prinsip Agregasi Terbobot (Weighted Aggregation):
 * - Total Delta Berat (kg) = Total Baseline - Total Aktual
 * - Weighted Delta Berat (%) = ((Total Baseline - Total Aktual) / Total Baseline) * 100%
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

  let totalAccumulatedKg = 0;

  items.forEach((item) => {
    if (item.baselineKg && item.baselineKg > 0) {
      totalBaselineKg += item.baselineKg;
    }
    const actKg = Number(item.actualKg || 0);
    totalActualKg += actKg;

    if (item.rawAccumulatedKg !== undefined && item.rawAccumulatedKg !== null) {
      totalAccumulatedKg += Number(item.rawAccumulatedKg);
    }

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

    if (item.actualCompliance !== null && item.actualCompliance !== undefined && item.actualCompliance > 0) {
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

  const totalDeltaKg =
    totalActualKg > 0 ? Number((totalBaselineKg - totalActualKg).toFixed(2)) : null;
  const weightedDeltaPct =
    totalActualKg > 0 && totalBaselineKg > 0
      ? Number((((totalBaselineKg - totalActualKg) / totalBaselineKg) * 100).toFixed(2))
      : null;
  const simpleAvgDeltaPct =
    countDeltaPct > 0 ? Number((sumDeltaPct / countDeltaPct).toFixed(2)) : null;

  const avgBaselineCompliance =
    countBaselineCompliance > 0
      ? Number((sumBaselineCompliance / countBaselineCompliance).toFixed(1))
      : 0;

  // Gunakan rata-rata indeks komposit kepatuhan kelurahan jika ada data riil
  const avgActualCompliance =
    countActualCompliance > 0
      ? Number((sumActualCompliance / countActualCompliance).toFixed(1))
      : null;

  const deltaCompliance =
    avgActualCompliance !== null
      ? Number((avgActualCompliance - avgBaselineCompliance).toFixed(1))
      : null;

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
    totalAccumulatedKg: Number(totalAccumulatedKg.toFixed(2)),
    kelurahanCount: items.length,
  };
}

/**
 * 8. Struktur & Helper Rentang Tanggal Filter Dasbor
 */
export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  label: string;
}

/**
 * Menghasilkan rentang tanggal untuk 1 hari tertentu (YYYY-MM-DD).
 */
export function getDateRangeForDay(dateStr: string): DateRange {
  const parts = dateStr.split("-");
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const date = new Date(year, month, day);

  const formatted = date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return {
    startDate: dateStr,
    endDate: dateStr,
    label: formatted,
  };
}

/**
 * Menghasilkan rentang tanggal untuk 1 bulan kalender (YYYY-MM).
 */
export function getDateRangeForMonth(year: number, monthIndex: number): DateRange {
  const pad = (n: number) => String(n).padStart(2, "0");
  const startDate = `${year}-${pad(monthIndex)}-01`;
  const lastDay = new Date(year, monthIndex, 0).getDate();
  const endDate = `${year}-${pad(monthIndex)}-${pad(lastDay)}`;

  const monthName = new Date(year, monthIndex - 1, 1).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });

  return {
    startDate,
    endDate,
    label: monthName,
  };
}

/**
 * Menghitung rentang tanggal periode pembanding sebelumnya (H-1 atau Bulan Sebelumnya).
 */
export function getPreviousPeriodRange(
  mode: WastePeriodMode,
  currentStartDate: string
): DateRange {
  const parts = currentStartDate.split("-");
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  if (mode === "DAILY") {
    const cur = new Date(year, month, day);
    cur.setDate(cur.getDate() - 1);
    const pad = (n: number) => String(n).padStart(2, "0");
    const prevDateStr = `${cur.getFullYear()}-${pad(cur.getMonth() + 1)}-${pad(cur.getDate())}`;
    return getDateRangeForDay(prevDateStr);
  } else {
    let prevYear = year;
    let prevMonth = month; // month is 0-11, so previous month is month
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear -= 1;
    }
    return getDateRangeForMonth(prevYear, prevMonth);
  }
}

