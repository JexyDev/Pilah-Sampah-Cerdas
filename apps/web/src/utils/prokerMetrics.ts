/**
 * Utilitas Kalkulasi Metrik & Progres Program Kerja KKN
 * Single Source of Truth untuk seluruh modul dashboard & monitoring KKN.
 * 
 * ATURAN BISNIS & QC:
 * 1. Status pelaksanaan bersifat mutually exclusive (SELESAI, SEDANG_BERJALAN, BELUM_MULAI).
 *    Satu proker dilarang keras terhitung ganda (double-counted) ke dua status sekaligus.
 * 2. Persentase progres dihitung dari rasio proker selesai: (completed / total) * 100.
 * 3. Nilai persentase wajib dibatasi dalam rentang [0, 100] (clamped guardrail).
 */

export type ProkerExecutionStatus = "SELESAI" | "SEDANG_BERJALAN" | "BELUM_MULAI";

export interface ProkerMetrics {
  total: number;
  completed: number;
  ongoing: number;
  notStarted: number;
  rate: number;
  ratioLabel: string;
  tooltip: string;
  isLowProker: boolean;
}

/**
 * Normalisasi status pelaksanaan proker yang mutually exclusive.
 * Memprioritaskan kolom baru statusPelaksanaan, dengan fallback aman ke kolom legacy status.
 */
export function normalizeProkerExecutionStatus(
  statusPelaksanaan?: string | null,
  legacyStatus?: string | null
): ProkerExecutionStatus {
  const p = String(statusPelaksanaan || "").toUpperCase().trim();
  const leg = String(legacyStatus || "").toUpperCase().trim();

  // 1. Periksa kolom baru statusPelaksanaan terlebih dahulu
  if (p === "SELESAI" || p === "SUDAH") {
    return "SELESAI";
  }
  if (
    p === "SEDANG_BERJALAN" ||
    p === "SEDANG_DILAKSANAKAN" ||
    p === "BERJALAN" ||
    p === "SEDANG" ||
    p === "BERLANGSUNG"
  ) {
    return "SEDANG_BERJALAN";
  }
  if (p === "BELUM_MULAI" || p === "BELUM_DIMULAI" || p === "BELUM") {
    return "BELUM_MULAI";
  }

  // 2. Fallback ke kolom legacy status jika statusPelaksanaan kosong / tidak dikenali
  if (leg === "SELESAI" || leg === "SUDAH") {
    return "SELESAI";
  }
  if (
    leg === "SEDANG_BERJALAN" ||
    leg === "SEDANG_DILAKSANAKAN" ||
    leg === "BERJALAN" ||
    leg === "SEDANG" ||
    leg === "BERLANGSUNG"
  ) {
    return "SEDANG_BERJALAN";
  }

  return "BELUM_MULAI";
}

/**
 * Hitung metrik progres program kerja dari list proker kelompok.
 */
export function calculateProkerMetrics(programKerja?: any[] | null): ProkerMetrics {
  const prokers = Array.isArray(programKerja) ? programKerja : [];
  const total = prokers.length;

  if (total === 0) {
    return {
      total: 0,
      completed: 0,
      ongoing: 0,
      notStarted: 0,
      rate: 0,
      ratioLabel: "0/0",
      tooltip: "Belum ada program kerja",
      isLowProker: false,
    };
  }

  let completed = 0;
  let ongoing = 0;
  let notStarted = 0;

  for (const p of prokers) {
    const status = normalizeProkerExecutionStatus(p?.statusPelaksanaan, p?.status);
    if (status === "SELESAI") {
      completed++;
    } else if (status === "SEDANG_BERJALAN") {
      ongoing++;
    } else {
      notStarted++;
    }
  }

  // Persentase riil penyelesaian proker: (completed / total) * 100 dengan guardrail clamp [0, 100]
  const rawRate = (completed / total) * 100;
  const rate = Math.min(100, Math.max(0, Math.round(rawRate)));

  return {
    total,
    completed,
    ongoing,
    notStarted,
    rate,
    ratioLabel: `${completed}/${total}`,
    tooltip: `${completed} Selesai, ${ongoing} Sedang Berjalan, dari total ${total} Proker`,
    isLowProker: rate < 60,
  };
}
