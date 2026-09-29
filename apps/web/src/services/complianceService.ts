/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Frontend Service: Modul Evaluasi Kepatuhan Pemilahan Sampah
 * Mendukung evaluasi biner simetris di sisi klien dan pengambilan data agregat dari API backend.
 */

import api from "./api";

export type WasteCategory = "ORGANIK" | "ANORGANIK";

export type ComplianceSystemStatus =
  | "Patuh & Sesuai"
  | "Tidak Patuh / Tidak Sesuai"
  | "Tidak Dapat Dinilai";

export interface ComplianceEvaluationResult {
  wasteCategory: WasteCategory | "TIDAK_DIKENAL";
  binCategory: WasteCategory | "TIDAK_DIKENAL";
  isCompliant: boolean;
  systemStatus: ComplianceSystemStatus;
  keterangan: string;
  isContaminated: boolean;
  dampakKontaminasi?: string;
}

export interface BinCategoryMetrics {
  kategoriWadah: WasteCategory;
  totalAktivitas: number;
  aktivitasSesuai: number;
  aktivitasKontaminasi: number;
  kesesuaianPersen: number;
  kontaminasiPersen: number;
  totalBeratKg: number;
  beratSesuaiKg: number;
  beratKontaminasiKg: number;
}

export interface ComplianceMetricsResult {
  indeksKepatuhan: number;
  indeksKetidakpatuhan: number;
  kepatuhanBobotPersen: number;
  predikat: "Sangat Baik" | "Cukup" | "Perlu Peningkatan";
  ringkasanEksekutif: string;

  totalAktivitas: number;
  totalDinilai: number;
  totalPatuh: number;
  totalTidakPatuh: number;
  totalTakTerverifikasi: number;

  totalBeratKg: number;
  totalBeratPatuhKg: number;
  totalBeratKontaminasiKg: number;

  wadahOrganik: BinCategoryMetrics;
  wadahAnorganik: BinCategoryMetrics;

  kamusDefinisi: {
    kepatuhan: string;
    ketidakpatuhan: string;
    edukasiTooltip: string;
    dampakKetidakpatuhan: string;
    kebijakanWaktu: string;
    perlakuanAnomali: string;
  };
}

export interface ComplianceFilterParams {
  kelurahan?: string;
  rwId?: number;
  startDate?: string;
  endDate?: string;
  userId?: string;
}

/**
 * Normalisasi kategori sampah ke format kanonikal biner: 'ORGANIK' | 'ANORGANIK'
 */
export function normalizeCategory(category?: string | null): WasteCategory | null {
  if (!category) return null;
  const raw = String(category).toLowerCase().trim();
  if (!raw) return null;

  if (
    raw.includes("anorganik") ||
    raw.includes("non-organik") ||
    raw.includes("non organik") ||
    raw.includes("non_organic") ||
    raw.includes("anorg") ||
    raw.includes("inorganic") ||
    raw.includes("anorganic")
  ) {
    return "ANORGANIK";
  }

  if (raw.includes("organik") || raw.includes("organic")) {
    return "ORGANIK";
  }

  return null;
}

/**
 * Evaluasi biner murni kepatuhan pemilahan
 */
export function evaluateCompliance(
  waste: WasteCategory | string | null | undefined,
  bin: WasteCategory | string | null | undefined
): boolean {
  const normWaste = normalizeCategory(waste);
  const normBin = normalizeCategory(bin);

  if (!normWaste || !normBin) return false;
  return normWaste === normBin;
}

/**
 * Evaluasi detail biner beserta keterangan narasi dan dampak kontaminasi
 */
export function evaluateSortingDetail(
  waste?: string | null,
  bin?: string | null
): ComplianceEvaluationResult {
  const normWaste = normalizeCategory(waste);
  const normBin = normalizeCategory(bin);

  if (!normWaste || !normBin) {
    return {
      wasteCategory: normWaste || "TIDAK_DIKENAL",
      binCategory: normBin || "TIDAK_DIKENAL",
      isCompliant: false,
      systemStatus: "Tidak Dapat Dinilai",
      keterangan: "Kategori sampah atau wadah tidak dapat diverifikasi secara valid.",
      isContaminated: false,
    };
  }

  const isCompliant = normWaste === normBin;

  if (isCompliant) {
    return {
      wasteCategory: normWaste,
      binCategory: normBin,
      isCompliant: true,
      systemStatus: "Patuh & Sesuai",
      keterangan: "Pemilahan berhasil, tidak ada kontaminasi.",
      isContaminated: false,
    };
  }

  if (normWaste === "ORGANIK" && normBin === "ANORGANIK") {
    return {
      wasteCategory: normWaste,
      binCategory: normBin,
      isCompliant: false,
      systemStatus: "Tidak Patuh / Tidak Sesuai",
      keterangan: "Kontaminasi pemilahan: sampah organik dimasukkan ke wadah anorganik.",
      isContaminated: true,
      dampakKontaminasi:
        "Sampah basah organik membusuk dan mengotori wadah anorganik, menurunkan harga jual daur ulang dan merusak material kertas/plastik kering.",
    };
  }

  return {
    wasteCategory: normWaste,
    binCategory: normBin,
    isCompliant: false,
    systemStatus: "Tidak Patuh / Tidak Sesuai",
    keterangan: "Kontaminasi pemilahan: sampah anorganik dimasukkan ke wadah organik.",
    isContaminated: true,
    dampakKontaminasi:
      "Plastik dan sampah anorganik mencemari bahan baku pupuk kompos, merusak proses fermentasi mikroba dan menurunkan kemurnian kompos.",
  };
}

/**
 * Agregasi metrik kepatuhan dari daftar log mentah (dukungan fallback client-side)
 */
export function calculateComplianceMetrics(
  logs: Array<{
    wasteCategory?: string | null;
    binCategory?: string | null;
    weightKg?: number | string | null;
    createdAt?: Date | string | null;
  }>
): ComplianceMetricsResult {
  let totalAktivitas = 0;
  let totalDinilai = 0;
  let totalPatuh = 0;
  let totalTidakPatuh = 0;
  let totalTakTerverifikasi = 0;

  let totalBeratKg = 0;
  let totalBeratPatuhKg = 0;
  let totalBeratKontaminasiKg = 0;

  let orgBinTotal = 0;
  let orgBinBenar = 0;
  let orgBinKontaminasi = 0;
  let orgBinTotalKg = 0;
  let orgBinBenarKg = 0;
  let orgBinKontaminasiKg = 0;

  let anorgBinTotal = 0;
  let anorgBinBenar = 0;
  let anorgBinKontaminasi = 0;
  let anorgBinTotalKg = 0;
  let anorgBinBenarKg = 0;
  let anorgBinKontaminasiKg = 0;

  logs.forEach((log) => {
    totalAktivitas++;
    const weight = Math.max(0, Number(log.weightKg || 0));
    totalBeratKg += weight;

    const normWaste = normalizeCategory(log.wasteCategory);
    const normBin = normalizeCategory(log.binCategory);

    if (!normWaste || !normBin) {
      totalTakTerverifikasi++;
      return;
    }

    totalDinilai++;
    const isCompliant = normWaste === normBin;

    if (isCompliant) {
      totalPatuh++;
      totalBeratPatuhKg += weight;
    } else {
      totalTidakPatuh++;
      totalBeratKontaminasiKg += weight;
    }

    if (normBin === "ORGANIK") {
      orgBinTotal++;
      orgBinTotalKg += weight;
      if (isCompliant) {
        orgBinBenar++;
        orgBinBenarKg += weight;
      } else {
        orgBinKontaminasi++;
        orgBinKontaminasiKg += weight;
      }
    } else if (normBin === "ANORGANIK") {
      anorgBinTotal++;
      anorgBinTotalKg += weight;
      if (isCompliant) {
        anorgBinBenar++;
        anorgBinBenarKg += weight;
      } else {
        anorgBinKontaminasi++;
        anorgBinKontaminasiKg += weight;
      }
    }
  });

  const indeksKepatuhan =
    totalDinilai > 0 ? parseFloat(((totalPatuh / totalDinilai) * 100).toFixed(2)) : 0;
  const indeksKetidakpatuhan =
    totalDinilai > 0 ? parseFloat(((totalTidakPatuh / totalDinilai) * 100).toFixed(2)) : 0;
  const kepatuhanBobotPersen =
    totalBeratKg > 0 ? parseFloat(((totalBeratPatuhKg / totalBeratKg) * 100).toFixed(2)) : 0;

  const orgKesesuaianPersen =
    orgBinTotal > 0 ? parseFloat(((orgBinBenar / orgBinTotal) * 100).toFixed(2)) : 0;
  const orgKontaminasiPersen =
    orgBinTotal > 0 ? parseFloat(((orgBinKontaminasi / orgBinTotal) * 100).toFixed(2)) : 0;

  const anorgKesesuaianPersen =
    anorgBinTotal > 0 ? parseFloat(((anorgBinBenar / anorgBinTotal) * 100).toFixed(2)) : 0;
  const anorgKontaminasiPersen =
    anorgBinTotal > 0 ? parseFloat(((anorgBinKontaminasi / anorgBinTotal) * 100).toFixed(2)) : 0;

  let predikat: "Sangat Baik" | "Cukup" | "Perlu Peningkatan" = "Perlu Peningkatan";
  let ringkasanEksekutif =
    "Tingkat kepatuhan pemilahan memerlukan penguatan edukasi warga di posko dan penempelan stiker panduan.";

  if (indeksKepatuhan >= 80) {
    predikat = "Sangat Baik";
    ringkasanEksekutif =
      "Warga telah memilah sampah secara tepat dengan kontaminasi wadah sangat rendah (standar hijau DLH tercapai).";
  } else if (indeksKepatuhan >= 60) {
    predikat = "Cukup";
    ringkasanEksekutif =
      "Kepatuhan pemilahan cukup baik, namun masih terdapat kontaminasi silang antar wadah yang perlu disosialisasikan.";
  }

  return {
    indeksKepatuhan,
    indeksKetidakpatuhan,
    kepatuhanBobotPersen,
    predikat,
    ringkasanEksekutif,

    totalAktivitas,
    totalDinilai,
    totalPatuh,
    totalTidakPatuh,
    totalTakTerverifikasi,

    totalBeratKg: parseFloat(totalBeratKg.toFixed(2)),
    totalBeratPatuhKg: parseFloat(totalBeratPatuhKg.toFixed(2)),
    totalBeratKontaminasiKg: parseFloat(totalBeratKontaminasiKg.toFixed(2)),

    wadahOrganik: {
      kategoriWadah: "ORGANIK",
      totalAktivitas: orgBinTotal,
      aktivitasSesuai: orgBinBenar,
      aktivitasKontaminasi: orgBinKontaminasi,
      kesesuaianPersen: orgKesesuaianPersen,
      kontaminasiPersen: orgKontaminasiPersen,
      totalBeratKg: parseFloat(orgBinTotalKg.toFixed(2)),
      beratSesuaiKg: parseFloat(orgBinBenarKg.toFixed(2)),
      beratKontaminasiKg: parseFloat(orgBinKontaminasiKg.toFixed(2)),
    },

    wadahAnorganik: {
      kategoriWadah: "ANORGANIK",
      totalAktivitas: anorgBinTotal,
      aktivitasSesuai: anorgBinBenar,
      aktivitasKontaminasi: anorgBinKontaminasi,
      kesesuaianPersen: anorgKesesuaianPersen,
      kontaminasiPersen: anorgKontaminasiPersen,
      totalBeratKg: parseFloat(anorgBinTotalKg.toFixed(2)),
      beratSesuaiKg: parseFloat(anorgBinBenarKg.toFixed(2)),
      beratKontaminasiKg: parseFloat(anorgBinKontaminasiKg.toFixed(2)),
    },

    kamusDefinisi: {
      kepatuhan:
        "Rasio ketepatan pembuangan sampah pada wadah yang sesuai dibagi total aktivitas pemilahan terdata.",
      ketidakpatuhan:
        "Kejadian penempatan jenis sampah yang tidak cocok dengan kategori tempat sampah.",
      edukasiTooltip:
        "Kepatuhan adalah kesesuaian penempatan jenis sampah pada wadah yang semestinya. Ketidakpatuhan terjadi jika sampah dibuang pada wadah yang tidak cocok.",
      dampakKetidakpatuhan:
        "Kontaminasi sampah organik pada wadah anorganik merusak material daur ulang, sedangkan kontaminasi anorganik pada wadah organik mencemari proses pembentukan pupuk kompos.",
      kebijakanWaktu:
        "Warga berhak memilah dan melapor kapan saja tanpa dibatasi batas waktu harian ketat (no system rejection).",
      perlakuanAnomali:
        "Sampah tidak patuh tetap dicatat volumenya dalam neraca massa limbah, namun dipisahkan sebagai data kontaminasi wadah.",
    },
  };
}

/**
 * Fetch compliance metrics directly from API endpoint
 */
export async function fetchComplianceMetrics(
  params?: ComplianceFilterParams
): Promise<ComplianceMetricsResult> {
  const response = await api.get("/dashboard/compliance/metrics", { params });
  if (response.data && response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data?.message || "Gagal memuat data metrik kepatuhan.");
}

export const complianceService = {
  normalizeCategory,
  evaluateCompliance,
  evaluateSortingDetail,
  calculateComplianceMetrics,
  fetchComplianceMetrics,
};

export default complianceService;
