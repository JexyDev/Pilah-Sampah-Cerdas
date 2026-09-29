/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Modul Evaluasi Kepatuhan Pemilahan Sampah (Compliance & Kesesuaian Pemilahan)
 * 
 * Standarisasi Logika Kepatuhan (Compliance) vs Kesesuaian:
 * 1. Kepatuhan bernilai ekuivalen dengan kesesuaian biner:
 *    Kepatuhan = (Kategori Sampah Hasil Scan === Kategori Wadah Berstiker QR).
 * 2. Matriks Logika Biner:
 *    - Organik + Wadah Organik     => Patuh & Sesuai (isCompliant: true, tanpa kontaminasi)
 *    - Anorganik + Wadah Anorganik => Patuh & Sesuai (isCompliant: true, tanpa kontaminasi)
 *    - Organik + Wadah Anorganik   => Tidak Patuh / Tidak Sesuai (isCompliant: false, kontaminasi pemilahan)
 *    - Anorganik + Wadah Organik   => Tidak Patuh / Tidak Sesuai (isCompliant: false, kontaminasi pemilahan)
 * 3. Prinsip Pelaporan Fleksibel (No Time-Lock):
 *    Warga berhak memilah dan melapor kapan saja tanpa dibatasi jam harian ketat (24/7).
 * 4. Integritas Neraca Massa:
 *    Sampah tidak patuh tetap dicatat volumenya dalam tonase total fisik limbah,
 *    namun ditandai sebagai kontaminasi wadah agar transparansi data terjaga.
 */

import { prisma } from "../lib/prisma.js";

export type WasteCategory = "ORGANIK" | "ANORGANIK";

export interface WasteSortingLog {
  id?: string;
  wasteCategory: WasteCategory;
  binCategory: WasteCategory;
  isCompliant: boolean;
  weightKg?: number;
  volumeLiter?: number;
  confidenceAi?: number | null;
  discrepancyStatus?: string;
  createdAt?: Date | string;
  wargaId?: string;
  wargaName?: string;
  rwId?: number | null;
  rwName?: string | null;
  kelurahan?: string | null;
}

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

export interface CitizenParticipationMetrics {
  totalWargaTerdaftar: number;
  wargaAktifMemilah: number;
  partisipasiPersen: number;
}

export interface ComplianceMetricsResult {
  // Ringkasan Eksekutif Utama
  indeksKepatuhan: number; // 0 - 100 (%) hasil akumulasi sistem
  indeksKetidakpatuhan: number; // 0 - 100 (%)
  kepatuhanBobotPersen: number; // 0 - 100 (%) berdasarkan massa kg
  predikat: "Sangat Baik" | "Cukup Baik" | "Cukup" | "Perlu Peningkatan";
  ringkasanEksekutif: string;

  // Akumulasi Sistem Data Warga Riil (Anti-Bias Kamera AI)
  partisipasiWarga: CitizenParticipationMetrics;
  akurasiPilahPersen: number;
  kepatuhanAiRate: number;
  penjelasanSistem: string;

  // Frekuensi & Partisipasi
  totalAktivitas: number;
  totalDinilai: number;
  totalPatuh: number;
  totalTidakPatuh: number;
  totalTakTerverifikasi: number;

  // Massa / Berat (Kg)
  totalBeratKg: number;
  totalBeratPatuhKg: number;
  totalBeratKontaminasiKg: number;

  // Sub-Analisis per Wadah
  wadahOrganik: BinCategoryMetrics;
  wadahAnorganik: BinCategoryMetrics;

  // Kamus Istilah Edukatif untuk Pimpinan & UI
  kamusDefinisi: {
    kepatuhan: string;
    ketidakpatuhan: string;
    edukasiTooltip: string;
    dampakKetidakpatuhan: string;
    kebijakanWaktu: string;
    perlakuanAnomali: string;
  };
}

export interface ComplianceFilter {
  rwId?: number;
  kelurahan?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  userId?: string;
}

/**
 * Normalisasi nama atau label kategori sampah ke format kanonikal biner: 'ORGANIK' | 'ANORGANIK'.
 * Menangani seluruh varian teks (Indonesia, Inggris, huruf besar/kecil, hyphen, underscore).
 */
export function normalizeCategory(category?: string | null): WasteCategory | null {
  if (!category) return null;
  const raw = String(category).toLowerCase().trim();
  if (!raw) return null;

  // Urutan pemeriksaan: varian anorganik terlebih dahulu karena kata "anorganik" mengandung substring "organik"
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
 * Evaluasi biner murni kepatuhan pemilahan:
 * Kepatuhan bernilai benar (true) jika dan hanya jika kategori sampah sama dengan kategori wadah.
 * Logika ini simetris dan biner:
 * evaluateCompliance('ORGANIK', 'ORGANIK') => true
 * evaluateCompliance('ANORGANIK', 'ANORGANIK') => true
 * evaluateCompliance('ORGANIK', 'ANORGANIK') => false
 * evaluateCompliance('ANORGANIK', 'ORGANIK') => false
 */
export function evaluateCompliance(
  waste: WasteCategory | string | null | undefined,
  bin: WasteCategory | string | null | undefined
): boolean {
  const normWaste = normalizeCategory(waste);
  const normBin = normalizeCategory(bin);

  if (!normWaste || !normBin) {
    return false;
  }

  return normWaste === normBin;
}

/**
 * Detail evaluasi komprehensif termasuk status sistem, keterangan naratif,
 * dan dampak kontaminasi untuk komunikasi pimpinan DLH / pemerintah daerah.
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

  // Jika tidak patuh: identifikasi arah kontaminasi
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

  // normWaste === "ANORGANIK" && normBin === "ORGANIK"
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
 * Agregasi metrik kepatuhan dari sekumpulan data setoran pemilahan.
 * Bersifat murni (pure function) tanpa efek samping, mudah diuji unit test.
 */
export function calculateComplianceMetrics(
  logs: Array<{
    wasteCategory?: string | null;
    binCategory?: string | null;
    weightKg?: number | string | null;
    createdAt?: Date | string | null;
  }>,
  wargaStats?: {
    totalWargaTerdaftar?: number;
    wargaAktifMemilah?: number;
  }
): ComplianceMetricsResult {
  let totalAktivitas = 0;
  let totalDinilai = 0;
  let totalPatuh = 0;
  let totalTidakPatuh = 0;
  let totalTakTerverifikasi = 0;

  let totalBeratKg = 0;
  let totalBeratPatuhKg = 0;
  let totalBeratKontaminasiKg = 0;

  // Wadah Organik
  let orgBinTotal = 0;
  let orgBinBenar = 0;
  let orgBinKontaminasi = 0;
  let orgBinTotalKg = 0;
  let orgBinBenarKg = 0;
  let orgBinKontaminasiKg = 0;

  // Wadah Anorganik
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

  const akurasiPilahPersen =
    totalDinilai > 0 ? parseFloat(((totalPatuh / totalDinilai) * 100).toFixed(2)) : 0;
  const kepatuhanAiRate = akurasiPilahPersen;

  const totalWargaTerdaftar = Math.max(0, Number(wargaStats?.totalWargaTerdaftar || 0));
  const wargaAktifMemilah = Math.max(0, Number(wargaStats?.wargaAktifMemilah || 0));

  let partisipasiPersen = 0;
  let indeksKepatuhan = akurasiPilahPersen;

  // Jika tersedia data populasi warga, hitung indeks kepatuhan akumulasi sistem:
  // 50% Bobot Partisipasi Warga Aktif + 50% Bobot Akurasi Pemilahan Wadah
  if (totalWargaTerdaftar > 0) {
    partisipasiPersen = Math.min(
      100,
      parseFloat(((wargaAktifMemilah / totalWargaTerdaftar) * 100).toFixed(2))
    );
    indeksKepatuhan = parseFloat(
      ((partisipasiPersen * 0.5) + (akurasiPilahPersen * 0.5)).toFixed(2)
    );
  }

  const indeksKetidakpatuhan =
    totalDinilai > 0 || totalWargaTerdaftar > 0
      ? parseFloat((Math.max(0, 100 - indeksKepatuhan)).toFixed(2))
      : 0;

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

  let predikat: "Sangat Baik" | "Cukup Baik" | "Cukup" | "Perlu Peningkatan" = "Perlu Peningkatan";
  let ringkasanEksekutif = "Tingkat kepatuhan pemilahan memerlukan penguatan edukasi warga di posko dan penempelan stiker panduan.";

  if (indeksKepatuhan >= 80) {
    predikat = "Sangat Baik";
    ringkasanEksekutif = "Warga telah berpartisipasi aktif dan memilah sampah secara tepat dengan kontaminasi wadah sangat rendah (standar hijau DLH tercapai).";
  } else if (indeksKepatuhan >= 65) {
    predikat = "Cukup Baik";
    ringkasanEksekutif = "Kepatuhan pemilahan dan partisipasi warga cukup baik, sosialisasi dapat ditingkatkan agar seluruh warga konsisten memilah.";
  } else if (indeksKepatuhan >= 50) {
    predikat = "Cukup";
    ringkasanEksekutif = "Akurasi pemilahan sudah berjalan, namun keaktifan warga masih perlu didorong melalui posko dan pendampingan kader.";
  }

  const penjelasanSistem =
    totalWargaTerdaftar > 0
      ? `Skor kepatuhan diakumulasikan dari keaktifan partisipasi warga (${partisipasiPersen}%) dan akurasi pemilahan wadah (${akurasiPilahPersen}%), merefleksikan kedisiplinan riil masyarakat tanpa bias kamera AI.`
      : "Skor kepatuhan dihitung berdasarkan kesesuaian biner penempatan jenis sampah pada wadah yang semestinya.";

  return {
    indeksKepatuhan,
    indeksKetidakpatuhan,
    kepatuhanBobotPersen,
    predikat,
    ringkasanEksekutif,

    partisipasiWarga: {
      totalWargaTerdaftar,
      wargaAktifMemilah,
      partisipasiPersen,
    },
    akurasiPilahPersen,
    kepatuhanAiRate,
    penjelasanSistem,

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

export const complianceService = {
  /**
   * Helper pure logic
   */
  evaluateCompliance,
  normalizeCategory,
  evaluateSortingDetail,
  calculateComplianceMetrics,

  /**
   * Ambil data metrik kepatuhan dari basis data operasional dengan filter wilayah dan tanggal
   */
  async getComplianceMetrics(filter?: ComplianceFilter): Promise<ComplianceMetricsResult> {
    const whereClause: any = {};

    if (filter?.userId) {
      whereClause.wargaId = filter.userId;
    }

    if (filter?.rwId) {
      whereClause.bin = {
        rwId: filter.rwId,
      };
    } else if (filter?.kelurahan) {
      whereClause.bin = {
        rw: {
          kelurahan: {
            name: {
              equals: filter.kelurahan,
              mode: "insensitive",
            },
          },
        },
      };
    }

    if (filter?.startDate || filter?.endDate) {
      whereClause.createdAt = {};
      if (filter.startDate) {
        whereClause.createdAt.gte = new Date(filter.startDate);
      }
      if (filter.endDate) {
        whereClause.createdAt.lte = new Date(filter.endDate);
      }
    }

    const setoranLogs = await prisma.setoranOtomatis.findMany({
      where: whereClause,
      select: {
        id: true,
        berat: true,
        confidenceAi: true,
        hasilKlasifikasiAi: true,
        kategoriAktual: true,
        createdAt: true,
        wargaId: true,
        bin: {
          select: {
            category: {
              select: { name: true },
            },
            rw: {
              select: {
                id: true,
                name: true,
                kelurahan: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    });

    // 1. Hitung jumlah warga unik yang aktif menyetor sampah
    const distinctActiveWarga = new Set(
      setoranLogs.map((s) => s.wargaId).filter(Boolean)
    );
    const wargaAktifMemilah = distinctActiveWarga.size;

    // 2. Hitung total populasi warga/rumah tangga terdaftar di area ini
    const wargaWhere: any = { role: { name: "WARGA" }, isTestAccount: false };
    if (filter?.userId) {
      wargaWhere.id = filter.userId;
    } else if (filter?.rwId) {
      wargaWhere.rwId = filter.rwId;
    } else if (filter?.kelurahan) {
      wargaWhere.rw = {
        kelurahan: {
          name: { equals: filter.kelurahan, mode: "insensitive" },
        },
      };
    }

    let totalWargaTerdaftar = 0;
    try {
      if (typeof prisma?.user?.count === "function") {
        totalWargaTerdaftar = await prisma.user.count({ where: wargaWhere });
      }
      if (totalWargaTerdaftar === 0 && typeof prisma?.household?.count === "function") {
        const hhWhere: any = {};
        if (filter?.rwId) hhWhere.rwId = filter.rwId;
        else if (filter?.kelurahan) {
          hhWhere.rw = { kelurahan: { name: { equals: filter.kelurahan, mode: "insensitive" } } };
        }
        totalWargaTerdaftar = await prisma.household.count({ where: hhWhere });
      }
    } catch (err) {
      console.warn("[ComplianceService] Warning querying citizen count:", err);
    }

    // Jika di database belum ada data user warga formal namun sudah ada aktivitas setoran
    if (totalWargaTerdaftar < wargaAktifMemilah) {
      totalWargaTerdaftar = wargaAktifMemilah;
    }

    const mappedForCalculation = setoranLogs.map((log) => ({
      wasteCategory: log.kategoriAktual || log.hasilKlasifikasiAi || null,
      binCategory: log.bin?.category?.name || null,
      weightKg: Number(log.berat || 0),
      createdAt: log.createdAt,
    }));

    return calculateComplianceMetrics(mappedForCalculation, {
      totalWargaTerdaftar,
      wargaAktifMemilah,
    });
  },

  /**
   * Evaluasi transaksi tunggal (misal saat scan QR atau konfirmasi penimbangan)
   */
  evaluateTransaction(
    wasteInput: string | null | undefined,
    binInput: string | null | undefined
  ): ComplianceEvaluationResult {
    return evaluateSortingDetail(wasteInput, binInput);
  },
};
