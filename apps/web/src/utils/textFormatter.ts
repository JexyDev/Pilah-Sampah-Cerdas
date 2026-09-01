/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Utility: Standardized Indonesian Text Formatter (KBBI / EYD V Title Case & Acronym Preservation)
 */

// Daftar kata hubung / partikel kecil yang tidak dikapitalisasi kecuali di awal kata/kalimat
const LOWERCASE_WORDS = new Set([
  "dan",
  "atau",
  "di",
  "ke",
  "dari",
  "pada",
  "untuk",
  "dengan",
  "oleh",
  "tentang",
  "yang",
  "bin",
  "binti",
  "van",
  "von",
  "de",
  "al-",
]);

// Daftar akronim dan gelar akademik yang harus dipertahankan kapitalisasinya secara presisi
const KNOWN_ACRONYMS: Record<string, string> = {
  nim: "NIM",
  nip: "NIP",
  nik: "NIK",
  dpl: "DPL",
  mpl: "MPL",
  kkn: "KKN",
  dlh: "DLH",
  rw: "RW",
  rt: "RT",
  tps: "TPS",
  poc: "POC",
  bsf: "BSF",
  ai: "AI",
  gps: "GPS",
  qr: "QR",
  csv: "CSV",
  pdf: "PDF",
  s1: "S1",
  s2: "S2",
  s3: "S3",
  d3: "D3",
  d4: "D4",
  it: "IT",
  tik: "TIK",
  lppm: "LPPM",
  rtrw: "RT/RW",
  "rt/rw": "RT/RW",
  b3: "B3",
  crud: "Kelola",
  vps: "VPS",
  cpu: "CPU",
  ram: "RAM",
  os: "OS",
  uid: "UID",
  id: "ID",
  wa: "WhatsApp",
};

// Daftar gelar akademik dengan titik
const DEGREE_TITLES: Record<string, string> = {
  "s.kom": "S.Kom",
  "s.kom.": "S.Kom.",
  "s.t": "S.T.",
  "s.t.": "S.T.",
  "m.t": "M.T.",
  "m.t.": "M.T.",
  "m.kom": "M.Kom",
  "m.kom.": "M.Kom.",
  "ph.d": "Ph.D",
  "ph.d.": "Ph.D.",
  "dr.": "Dr.",
  "dr": "Dr.",
  "ir.": "Ir.",
  "ir": "Ir.",
  "prof.": "Prof.",
  "prof": "Prof.",
  "s.pd": "S.Pd.",
  "s.pd.": "S.Pd.",
  "m.pd": "M.Pd.",
  "m.pd.": "M.Pd.",
  "s.e": "S.E.",
  "s.e.": "S.E.",
  "m.m": "M.M.",
  "m.m.": "M.M.",
  "s.si": "S.Si.",
  "s.si.": "S.Si.",
  "m.si": "M.Si.",
  "m.si.": "M.Si.",
  "s.sos": "S.Sos.",
  "s.sos.": "S.Sos.",
  "m.sos": "M.Sos.",
  "m.sos.": "M.Sos.",
  "s.h": "S.H.",
  "s.h.": "S.H.",
  "m.h": "M.H.",
  "m.h.": "M.H.",
  "s.ked": "S.Ked.",
  "s.ked.": "S.Ked.",
};

/**
 * Mengubah sembarang teks menjadi Title Case baku bahasa Indonesia.
 * Otomatis menangani akronim (NIM, DPL, KKN, RW, RT, dll.) dan kata hubung.
 */
export const toTitleCase = (text: string | undefined | null): string => {
  if (!text || typeof text !== "string") return "";
  const trimmed = text.trim();
  if (!trimmed) return "";

  // Jika berupa singkatan murni (contoh: "KKN", "DPL", "RW 01")
  const words = trimmed.split(/\s+/);
  const formattedWords = words.map((word, index) => {
    // Bersihkan tanda baca di sekeliling kata untuk cek kamus
    const match = word.match(/^([^a-zA-Z0-9]*)(.*?)([^a-zA-Z0-9]*)$/);
    if (!match) return word;

    const [, prefix, core, suffix] = match;
    const lowerCore = core.toLowerCase();

    // 1. Cek gelar akademik
    if (DEGREE_TITLES[lowerCore]) {
      return `${prefix}${DEGREE_TITLES[lowerCore]}${suffix}`;
    }

    // 2. Cek akronim umum
    if (KNOWN_ACRONYMS[lowerCore]) {
      return `${prefix}${KNOWN_ACRONYMS[lowerCore]}${suffix}`;
    }

    // 3. Cek kata hubung / partikel (jika bukan kata pertama)
    if (index > 0 && LOWERCASE_WORDS.has(lowerCore)) {
      return `${prefix}${lowerCore}${suffix}`;
    }

    // 4. Huruf kapital awal standar
    if (core.length === 0) return word;
    const capitalized = core.charAt(0).toUpperCase() + core.slice(1).toLowerCase();
    return `${prefix}${capitalized}${suffix}`;
  });

  return formattedWords.join(" ");
};

/**
 * Format nama orang (Mahasiswa, Warga, DPL, Pejabat) ke Title Case baku.
 * Mengatasi nama yang ALL CAPS, all lowercase, atau acak.
 */
export const formatPersonName = (name: string | undefined | null): string => {
  if (!name || typeof name !== "string") return "-";
  const trimmed = name.trim();
  if (!trimmed || trimmed === "-") return "-";

  // Tangani format gelar dengan koma (contoh: "ASEP SAEPUL, S.T., M.T.")
  if (trimmed.includes(",")) {
    const parts = trimmed.split(",");
    const namePart = toTitleCase(parts[0]);
    const degrees = parts.slice(1).map((deg) => toTitleCase(deg.trim())).join(", ");
    return degrees ? `${namePart}, ${degrees}` : namePart;
  }

  return toTitleCase(trimmed);
};

/**
 * Format nama kelompok KKN secara seragam.
 * Contoh: "kelompok 1 sadang serang" -> "Kelompok 1 Sadang Serang"
 * "KELOMPOK 02" -> "Kelompok 02"
 */
export const formatKelompokName = (name: string | undefined | null): string => {
  if (!name || typeof name !== "string") return "Kelompok KKN";
  const trimmed = name.trim();
  if (!trimmed || trimmed === "-") return "Kelompok KKN";

  // Pastikan kata Kelompok di awal
  let clean = trimmed;
  if (/^kkn\s*kelompok/i.test(clean)) {
    clean = clean.replace(/^kkn\s*kelompok/i, "Kelompok").trim();
  } else if (/^kelompok/i.test(clean)) {
    clean = clean.replace(/^kelompok\s*/i, "Kelompok ").trim();
  } else if (/^k\d+/i.test(clean)) {
    clean = clean.replace(/^k(\d+)/i, "Kelompok $1").trim();
  } else if (/^\d+$/.test(clean)) {
    clean = `Kelompok ${clean}`;
  }

  return toTitleCase(clean);
};

/**
 * Format nama wilayah (Provinsi, Kota/Kabupaten, Kecamatan, Kelurahan, RW, RT).
 * Contoh: "kel. cipaganti" -> "Kel. Cipaganti", "rw 1" -> "RW 01"
 */
export const formatWilayahName = (raw: string | undefined | null): string => {
  if (!raw || typeof raw !== "string") return "-";
  let trimmed = raw.trim();
  if (!trimmed || trimmed === "-") return "-";

  // Tangani format RW
  if (/^rw\s*\d+/i.test(trimmed)) {
    const num = trimmed.replace(/\D/g, "");
    return `RW ${num.padStart(2, "0")}`;
  }

  // Tangani format RT
  if (/^rt\s*\d+/i.test(trimmed)) {
    const num = trimmed.replace(/\D/g, "");
    return `RT ${num.padStart(2, "0")}`;
  }

  // Tangani format Kelurahan
  if (/^kel\.?\s*/i.test(trimmed)) {
    const cleanKel = trimmed.replace(/^kel\.?\s*/i, "").trim();
    return `Kel. ${toTitleCase(cleanKel)}`;
  }
  if (/^kelurahan\s*/i.test(trimmed)) {
    const cleanKel = trimmed.replace(/^kelurahan\s*/i, "").trim();
    return `Kelurahan ${toTitleCase(cleanKel)}`;
  }

  // Tangani format Kecamatan
  if (/^kec\.?\s*/i.test(trimmed)) {
    const cleanKec = trimmed.replace(/^kec\.?\s*/i, "").trim();
    return `Kec. ${toTitleCase(cleanKec)}`;
  }
  if (/^kecamatan\s*/i.test(trimmed)) {
    const cleanKec = trimmed.replace(/^kecamatan\s*/i, "").trim();
    return `Kecamatan ${toTitleCase(cleanKec)}`;
  }

  return toTitleCase(trimmed);
};

/**
 * Format nama program studi / jurusan.
 * Contoh: "teknik informatika" -> "Teknik Informatika", "s1 manajemen" -> "S1 Manajemen"
 */
export const formatProdiName = (prodi: string | undefined | null): string => {
  if (!prodi || typeof prodi !== "string") return "-";
  const trimmed = prodi.trim();
  if (!trimmed || trimmed === "-") return "-";

  // Periksa apakah diawali jenjang (S1 / S2 / D3 / D4)
  if (/^(s1|s2|s3|d3|d4)\s+/i.test(trimmed)) {
    const jenjang = trimmed.slice(0, 2).toUpperCase();
    const namaProdi = toTitleCase(trimmed.slice(2).trim());
    return `${jenjang} ${namaProdi}`;
  }

  return toTitleCase(trimmed);
};

/**
 * Format status menjadi Title Case baku bahasa Indonesia.
 */
export const formatStatusName = (status: string | undefined | null): string => {
  if (!status || typeof status !== "string") return "-";
  const upper = status.trim().toUpperCase();

  switch (upper) {
    case "ACTIVE":
    case "AKTIF":
    case "ACTIVE_BOUND":
      return "Aktif";
    case "INACTIVE":
    case "NONAKTIF":
    case "NON_AKTIF":
    case "NON-AKTIF":
    case "DISABLED":
      return "Nonaktif";
    case "PENDING":
    case "MENUNGGU":
    case "MENUNGGU_PERSETUJUAN":
      return "Menunggu Persetujuan";
    case "COMPLETED":
    case "SELESAI":
      return "Selesai";
    case "BROKEN":
    case "RUSAK":
      return "Rusak";
    case "ESCALATED":
    case "DIESKALASI":
      return "Eskalasi";
    case "APPROVED":
    case "DISETUJUI":
      return "Disetujui";
    case "REJECTED":
    case "DITOLAK":
      return "Ditolak";
    case "HADIR_MEMENUHI":
      return "Hadir Memenuhi";
    case "HADIR_TIDAK_MEMENUHI":
      return "Hadir Kurang Jam";
    case "BERLANGSUNG":
    case "DALAM_RADIUS":
      return "Sedang di Lokasi";
    case "TERJEDA":
      return "Sesi Terjeda";
    case "IZIN":
    case "IZIN_DISETUJUI":
      return "Izin";
    case "SAKIT":
    case "SAKIT_DISETUJUI":
      return "Sakit";
    case "IZIN_PENDING":
      return "Izin (Menunggu)";
    case "SAKIT_PENDING":
      return "Sakit (Menunggu)";
    case "ALPHA":
    case "ALPA":
    case "TANPA_KETERANGAN":
      return "Tanpa Keterangan";
    default:
      return toTitleCase(status.replace(/_/g, " "));
  }
};
