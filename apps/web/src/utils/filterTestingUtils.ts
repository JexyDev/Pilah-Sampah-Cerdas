/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 *
 * Modul Terpusat Frontend: Anti-Testing & Dummy Data Filter
 * Digunakan untuk perlindungan berlapis (defense-in-depth) pada tampilan
 * Leaderboard, DPL Portal, MPL Portal, Penilaian KKN, dan Dashboard Eksekutif.
 *
 * Dilengkapi dengan Kontrol Pengembang (Developer Settings):
 * - KETAT: Hanya peran DEVELOPER yang memiliki hak istimewa untuk mengatur toggle
 *   "Sembunyikan Akun Pengujian" (mode debug).
 * - Seluruh peran lain (termasuk SUPER_USER, PIMPINAN, DPL, dll.) SELALU menyembunyikan
 *   akun pengujian agar data yang disajikan 100% data riil operasional tanpa anomali dummy.
 */

export const HIDE_TEST_ACCOUNTS_KEY = "berseka_hide_test_accounts";

/**
 * Mendapatkan role pengguna aktif dari storage lokal secara aman
 */
export function getCurrentUserRole(): string | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("psc_user") ?? sessionStorage.getItem("psc_user");
    if (!raw) return null;
    const user = JSON.parse(raw);
    return (user.peran || user.role || null) as string | null;
  } catch {
    return null;
  }
}

/**
 * Memeriksa apakah pengguna yang sedang aktif memiliki peran DEVELOPER
 * (SUPER_USER, PIMPINAN, ADMIN_DLH, dll. akan bernilai false)
 */
export function isCurrentUserDeveloper(): boolean {
  const role = getCurrentUserRole();
  return String(role || "").toUpperCase() === "DEVELOPER";
}

/**
 * Memeriksa status konfigurasi: Apakah akun pengujian harus disembunyikan?
 * ATURAN KETAT:
 * 1. Untuk SEMUA peran selain DEVELOPER (termasuk SUPER_USER, PIMPINAN, DPL, dll.),
 *    fungsi ini SELALU mengembalikan `true` (akun pengujian WAJIB disembunyikan).
 * 2. Hanya peran DEVELOPER yang memiliki hak istimewa untuk mematikan toggle (debug mode).
 *    Jika DEVELOPER menyetel `berseka_hide_test_accounts = "false"`, fungsi mengembalikan `false`.
 * 3. Nilai default untuk DEVELOPER tetap `true` (bersih 100% data operasional).
 */
export function shouldHideTestAccounts(): boolean {
  if (typeof window === "undefined") return true;
  if (!isCurrentUserDeveloper()) {
    return true; // Non-developer SELALU disembunyikan
  }
  const val = localStorage.getItem(HIDE_TEST_ACCOUNTS_KEY);
  if (val === "false") {
    return false; // DEVELOPER sengaja mematikan toggle untuk inspeksi/debug
  }
  return true; // Default ON
}

/**
 * Mengubah status toggle sembunyikan akun pengujian
 * Hanya dapat dipanggil dan disimpan oleh peran DEVELOPER
 */
export function setHideTestAccountsSetting(hide: boolean): boolean {
  if (typeof window === "undefined") return false;
  if (!isCurrentUserDeveloper()) {
    console.warn("[filterTestingUtils] Akses ditolak: Hanya peran DEVELOPER yang dapat mengubah setelan ini.");
    return false;
  }
  localStorage.setItem(HIDE_TEST_ACCOUNTS_KEY, hide ? "true" : "false");
  return true;
}

const TEST_KEYWORDS = [
  "test",
  "dummy",
  "testing",
  "percobaan",
  "sample",
  "tester",
  "dpl test",
  "kelompok test",
];

const TEST_PHONES = [
  "+628111111111",
  "+628111111112",
  "+628111111113",
  "+628111111114",
  "+628111111115",
  "+628111111116",
  "+628111111117",
  "+628111111118",
  "+62812001001",
  "+62812345678900",
  "+6281234567890",
  "+628123456789",
  "+62812345678",
  "+628999999999",
  "0812345678900",
  "081234567890",
  "08123456789",
  "08999999999",
];

const TEST_NIMS = [
  "111222333",
  "12345678",
  "123456789",
  "999999999",
  "000000000",
];

/**
 * Memeriksa apakah sebuah string mengandung kata kunci uji coba/dummy
 */
export function isTestOrDummyString(str?: string | null): boolean {
  if (!str) return false;
  const lower = String(str).toLowerCase().trim();
  return TEST_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Memeriksa apakah data User (DPL, Mahasiswa, Warga, Petugas) merupakan akun uji coba/dummy
 */
export function isTestUser(
  user?: {
    id?: string | null;
    name?: string | null;
    email?: string | null;
    nip?: string | null;
    phone?: string | null;
    isTestAccount?: boolean | null;
    [key: string]: any;
  } | null,
  respectToggle = true
): boolean {
  if (respectToggle && !shouldHideTestAccounts()) return false;
  if (!user) return false;
  if (typeof user === "string") return isTestOrDummyString(user);
  if (user.isTestAccount) return true;
  if (user.phone) {
    const cleanP = user.phone.replace(/[\s-]/g, "");
    if (TEST_PHONES.some((tp) => cleanP === tp || cleanP.includes("12345678900"))) return true;
  }
  if (isTestOrDummyString(user.name)) return true;
  if (isTestOrDummyString(user.email)) return true;
  if (isTestOrDummyString(user.nip)) return true;
  return false;
}

/**
 * Memeriksa apakah data DPL (Dosen Pembimbing Lapangan) merupakan akun uji coba/dummy
 */
export function isTestDpl(
  dpl?: {
    id?: string | null;
    name?: string | null;
    nama?: string | null;
    dplName?: string | null;
    dplNama?: string | null;
    email?: string | null;
    nip?: string | null;
    phone?: string | null;
    isTestAccount?: boolean | null;
    [key: string]: any;
  } | null,
  respectToggle = true
): boolean {
  if (respectToggle && !shouldHideTestAccounts()) return false;
  if (!dpl) return false;
  if (typeof dpl === "string") return isTestOrDummyString(dpl);
  if (dpl.isTestAccount) return true;
  if (isTestUser(dpl, false)) return true;
  if (isTestOrDummyString(dpl.nama || dpl.name || dpl.dplNama || dpl.dplName)) return true;
  return false;
}

/**
 * Memeriksa apakah data Kelompok KKN merupakan kelompok uji coba/dummy
 */
export function isTestKelompok(
  kelompok?: {
    id?: string | null;
    name?: string | null;
    nama?: string | null;
    namaKelompok?: string | null;
    kelompokName?: string | null;
    kelurahan?: string | null;
    dplNamaMentah?: string | null;
    dplName?: string | null;
    dplNama?: string | null;
    dpl?: any;
    [key: string]: any;
  } | null,
  respectToggle = true
): boolean {
  if (respectToggle && !shouldHideTestAccounts()) return false;
  if (!kelompok) return false;
  if (typeof kelompok === "string") return isTestOrDummyString(kelompok);
  if (isTestOrDummyString(kelompok.name)) return true;
  if (isTestOrDummyString(kelompok.nama)) return true;
  if (isTestOrDummyString(kelompok.namaKelompok)) return true;
  if (isTestOrDummyString(kelompok.kelompokName)) return true;
  if (isTestOrDummyString(kelompok.kelurahan)) return true;
  if (isTestOrDummyString(kelompok.dplNamaMentah)) return true;
  if (isTestOrDummyString(kelompok.dplName)) return true;
  if (isTestOrDummyString(kelompok.dplNama)) return true;
  if (kelompok.dpl && isTestUser(kelompok.dpl, false)) return true;
  return false;
}

/**
 * Memeriksa apakah data Mahasiswa KKN merupakan mahasiswa uji coba/dummy
 */
export function isTestStudent(
  student?: {
    id?: string | null;
    nim?: string | null;
    name?: string | null;
    studentName?: string | null;
    nama?: string | null;
    namaMahasiswa?: string | null;
    noWa?: string | null;
    phone?: string | null;
    user?: any;
    kelompok?: any;
    kelompokName?: string | null;
    [key: string]: any;
  } | null,
  respectToggle = true
): boolean {
  if (respectToggle && !shouldHideTestAccounts()) return false;
  if (!student) return false;
  if (typeof student === "string") return isTestOrDummyString(student);
  if (student.nim) {
    const cleanNim = String(student.nim).trim();
    if (TEST_NIMS.includes(cleanNim)) return true;
  }
  if (student.user?.isTestAccount) return true;
  if (isTestOrDummyString(student.nim)) return true;
  if (isTestOrDummyString(student.name)) return true;
  if (isTestOrDummyString(student.studentName)) return true;
  if (isTestOrDummyString(student.nama)) return true;
  if (isTestOrDummyString(student.namaMahasiswa)) return true;
  if (isTestOrDummyString(student.kelompokName)) return true;
  if (student.phone) {
    const cleanP = String(student.phone).replace(/[\s-]/g, "");
    if (TEST_PHONES.some((tp) => cleanP === tp || cleanP.includes("12345678900"))) return true;
  }
  if (student.noWa) {
    const cleanW = String(student.noWa).replace(/[\s-]/g, "");
    if (TEST_PHONES.some((tp) => cleanW === tp || cleanW.includes("12345678900"))) return true;
  }
  if (student.user && isTestUser(student.user, false)) return true;
  if (student.kelompok && isTestKelompok(student.kelompok, false)) return true;
  return false;
}

/**
 * Memeriksa apakah data Posko KKN merupakan posko uji coba/dummy
 */
export function isTestPosko(
  posko?: {
    id?: string | null;
    nama?: string | null;
    name?: string | null;
    kelompokId?: string | null;
    kelompok?: any;
    kelompokName?: string | null;
    namaKelompok?: string | null;
    dplName?: string | null;
    [key: string]: any;
  } | null,
  respectToggle = true
): boolean {
  if (respectToggle && !shouldHideTestAccounts()) return false;
  if (!posko) return false;
  if (typeof posko === "string") return isTestOrDummyString(posko);
  if (isTestOrDummyString(posko.nama || posko.name)) return true;
  if (isTestOrDummyString(posko.kelompokName)) return true;
  if (isTestOrDummyString(posko.namaKelompok)) return true;
  if (isTestOrDummyString(posko.dplName)) return true;
  if (posko.kelompok && isTestKelompok(posko.kelompok, false)) return true;
  if (isTestKelompok(posko as any, false)) return true;
  return false;
}

/**
 * Memeriksa apakah data Program Kerja merupakan proker uji coba/dummy
 */
export function isTestProker(
  proker?: {
    id?: string | null;
    nama?: string | null;
    namaProker?: string | null;
    judul?: string | null;
    deskripsi?: string | null;
    kelompokName?: string | null;
    namaKelompok?: string | null;
    dplNama?: string | null;
    dplName?: string | null;
    kelompok?: any;
    student?: any;
    mahasiswa?: any;
    [key: string]: any;
  } | null,
  respectToggle = true
): boolean {
  if (respectToggle && !shouldHideTestAccounts()) return false;
  if (!proker) return false;
  if (typeof proker === "string") return isTestOrDummyString(proker);
  if (isTestOrDummyString(proker.nama)) return true;
  if (isTestOrDummyString(proker.namaProker)) return true;
  if (isTestOrDummyString(proker.judul)) return true;
  if (isTestOrDummyString(proker.deskripsi)) return true;
  if (isTestOrDummyString(proker.kelompokName)) return true;
  if (isTestOrDummyString(proker.namaKelompok)) return true;
  if (isTestOrDummyString(proker.dplNama)) return true;
  if (isTestOrDummyString(proker.dplName)) return true;
  if (proker.kelompok && isTestKelompok(proker.kelompok, false)) return true;
  if (proker.student && isTestStudent(proker.student, false)) return true;
  if (proker.mahasiswa && isTestStudent(proker.mahasiswa, false)) return true;
  if (isTestKelompok(proker as any, false)) return true;
  return false;
}

// ─── Pemeriksa Akurat Tanpa Menghiraukan Toggle (Untuk Label/Badge Debug di UI) ──
export const isActuallyTestUser = (user?: any) => isTestUser(user, false);
export const isActuallyTestDpl = (dpl?: any) => isTestDpl(dpl, false);
export const isActuallyTestKelompok = (kelompok?: any) => isTestKelompok(kelompok, false);
export const isActuallyTestStudent = (student?: any) => isTestStudent(student, false);
export const isActuallyTestPosko = (posko?: any) => isTestPosko(posko, false);
export const isActuallyTestProker = (proker?: any) => isTestProker(proker, false);

// ─── Filter Array Terpusat ──────────────────────────────────────────────────
export function filterNonTestUsers<T>(list: T[]): T[] {
  if (!shouldHideTestAccounts()) return list;
  return list.filter((u) => !isTestUser(u as any, false));
}

export function filterNonTestDpl<T>(list: T[]): T[] {
  if (!shouldHideTestAccounts()) return list;
  return list.filter((d) => !isTestDpl(d as any, false));
}

export function filterNonTestKelompok<T>(list: T[]): T[] {
  if (!shouldHideTestAccounts()) return list;
  return list.filter((k) => !isTestKelompok(k as any, false));
}

export function filterNonTestStudents<T>(list: T[]): T[] {
  if (!shouldHideTestAccounts()) return list;
  return list.filter((s) => !isTestStudent(s as any, false));
}

export function filterNonTestPosko<T>(list: T[]): T[] {
  if (!shouldHideTestAccounts()) return list;
  return list.filter((p) => !isTestPosko(p as any, false));
}

export function filterNonTestProker<T>(list: T[]): T[] {
  if (!shouldHideTestAccounts()) return list;
  return list.filter((p) => !isTestProker(p as any, false));
}
