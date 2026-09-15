/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 *
 * Modul Terpusat Frontend: Anti-Testing & Dummy Data Filter
 * Digunakan untuk perlindungan berlapis (defense-in-depth) pada tampilan
 * Leaderboard, DPL Portal, MPL Portal, Penilaian KKN, dan Dashboard Eksekutif.
 */

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
    [key: string]: any;
  } | null
): boolean {
  if (!user) return false;
  if (isTestOrDummyString(user.name)) return true;
  if (isTestOrDummyString(user.email)) return true;
  if (isTestOrDummyString(user.nip)) return true;
  return false;
}

/**
 * Memeriksa apakah data Kelompok KKN merupakan kelompok uji coba/dummy
 */
export function isTestKelompok(
  kelompok?: {
    id?: string | null;
    name?: string | null;
    kelurahan?: string | null;
    dplNamaMentah?: string | null;
    dpl?: any;
    [key: string]: any;
  } | null
): boolean {
  if (!kelompok) return false;
  if (isTestOrDummyString(kelompok.name)) return true;
  if (isTestOrDummyString(kelompok.kelurahan)) return true;
  if (isTestOrDummyString(kelompok.dplNamaMentah)) return true;
  if (kelompok.dpl && isTestUser(kelompok.dpl)) return true;
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
    user?: any;
    kelompok?: any;
    kelompokName?: string | null;
    [key: string]: any;
  } | null
): boolean {
  if (!student) return false;
  if (isTestOrDummyString(student.nim)) return true;
  if (isTestOrDummyString(student.name)) return true;
  if (isTestOrDummyString(student.studentName)) return true;
  if (isTestOrDummyString(student.nama)) return true;
  if (isTestOrDummyString(student.kelompokName)) return true;
  if (student.user && isTestUser(student.user)) return true;
  if (student.kelompok && isTestKelompok(student.kelompok)) return true;
  return false;
}

/**
 * Memeriksa apakah data Program Kerja merupakan proker uji coba/dummy
 */
export function isTestProker(
  proker?: {
    id?: string | null;
    nama?: string | null;
    judul?: string | null;
    kelompokName?: string | null;
    kelompok?: any;
    [key: string]: any;
  } | null
): boolean {
  if (!proker) return false;
  if (isTestOrDummyString(proker.nama)) return true;
  if (isTestOrDummyString(proker.judul)) return true;
  if (isTestOrDummyString(proker.kelompokName)) return true;
  if (proker.kelompok && isTestKelompok(proker.kelompok)) return true;
  return false;
}

export function filterNonTestUsers<T>(list: T[]): T[] {
  return list.filter((u) => !isTestUser(u));
}

export function filterNonTestKelompok<T>(list: T[]): T[] {
  return list.filter((k) => !isTestKelompok(k));
}

export function filterNonTestStudents<T>(list: T[]): T[] {
  return list.filter((s) => !isTestStudent(s));
}
