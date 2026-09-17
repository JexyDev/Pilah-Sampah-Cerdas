/**
 * Utilitas Kalkulasi Metrik & Progres Program Kerja KKN
 * Single Source of Truth untuk seluruh modul dashboard & monitoring KKN.
 * 
 * ATURAN BISNIS RESMI (Arahan CEO PT Makerindo):
 * 1. Progres proker dihitung dari: (proker yang sedang berjalan / total proker disetujui) * 100%.
 * 2. Pembilang (active): Proker yang aktif berprogres (sedang berjalan + tuntas selesai).
 * 3. Penyebut (approved): Total proker yang disetujui (statusUsulan === 'DISETUJUI' / bukan ditolak).
 * 4. Status pelaksanaan bersifat mutually exclusive (SELESAI, SEDANG_BERJALAN, BELUM_MULAI).
 *    Satu proker dilarang keras terhitung ganda (double-counted) ke dua status sekaligus.
 * 5. Nilai persentase wajib dibatasi dalam rentang [0, 100] (clamped guardrail).
 */

export type ProkerExecutionStatus = "SELESAI" | "SEDANG_BERJALAN" | "BELUM_MULAI";

export interface ProkerMetrics {
  total: number;
  approved: number;
  completed: number;
  ongoing: number;
  notStarted: number;
  active: number;
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
 * Sesuai arahan CEO: (proker yang sedang berjalan / total proker disetujui) * 100%
 */
export function calculateProkerMetrics(programKerja?: any[] | null): ProkerMetrics {
  const prokers = Array.isArray(programKerja) ? programKerja : [];
  const total = prokers.length;

  if (total === 0) {
    return {
      total: 0,
      approved: 0,
      completed: 0,
      ongoing: 0,
      notStarted: 0,
      active: 0,
      rate: 0,
      ratioLabel: "0/0",
      tooltip: "Belum ada program kerja",
      isLowProker: false,
    };
  }

  // 1. Filter proker non-ditolak
  const nonRejected = prokers.filter((p: any) => {
    const u = String(p?.statusUsulan || "").toUpperCase().trim();
    const s = String(p?.status || "").toUpperCase().trim();
    return u !== "DITOLAK" && s !== "DITOLAK";
  });

  // 2. Filter proker yang disetujui (DISETUJUI / DITERIMA / sedang aktif berjalan)
  const approvedList = nonRejected.filter((p: any) => {
    const u = String(p?.statusUsulan || "").toUpperCase().trim();
    const s = String(p?.status || "").toUpperCase().trim();
    const pl = String(p?.statusPelaksanaan || "").toUpperCase().trim();
    return (
      u === "DISETUJUI" ||
      s === "DISETUJUI" ||
      s === "DITERIMA" ||
      pl === "SEDANG_BERJALAN" ||
      pl === "SELESAI"
    );
  });

  // Jika tidak ada flag DISETUJUI eksplisit, fallback ke seluruh proker non-ditolak
  const targetList = approvedList.length > 0 ? approvedList : nonRejected;
  const approved = targetList.length;

  if (approved === 0) {
    return {
      total,
      approved: 0,
      completed: 0,
      ongoing: 0,
      notStarted: 0,
      active: 0,
      rate: 0,
      ratioLabel: "0/0",
      tooltip: "Belum ada program kerja disetujui",
      isLowProker: false,
    };
  }

  let completed = 0;
  let ongoing = 0;
  let notStarted = 0;

  for (const p of targetList) {
    const status = normalizeProkerExecutionStatus(p?.statusPelaksanaan, p?.status);
    if (status === "SELESAI") {
      completed++;
    } else if (status === "SEDANG_BERJALAN") {
      ongoing++;
    } else {
      notStarted++;
    }
  }

  // Pembilang: Proker aktif (sedang berjalan + selesai)
  const active = completed + ongoing;

  // Persentase riil progres proker: (active / approved) * 100 dengan guardrail clamp [0, 100]
  const rawRate = (active / approved) * 100;
  const rate = Math.min(100, Math.max(0, Math.round(rawRate)));

  return {
    total,
    approved,
    completed,
    ongoing,
    notStarted,
    active,
    rate,
    ratioLabel: `${active}/${approved}`,
    tooltip: `${active} dari ${approved} Proker Disetujui (${ongoing} Sedang Berjalan, ${completed} Selesai)`,
    isLowProker: rate < 60,
  };
}
