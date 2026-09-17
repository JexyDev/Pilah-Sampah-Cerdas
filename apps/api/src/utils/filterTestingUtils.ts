/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 *
 * Modul Terpusat: Anti-Testing & Dummy Data Governance Filter
 * Digunakan untuk menyembunyikan akun/kelompok uji coba dari tampilan operasional
 * (Leaderboard, DPL Portal, MPL Portal, Penilaian KKN, dan Dashboard Eksekutif).
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
  if (process.env.HIDE_TEST_DATA !== "true") {
    return false;
  }
  if (!str) return false;
  const lower = String(str).toLowerCase().trim();
  return TEST_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Memeriksa apakah data User (DPL, Mahasiswa, Warga, Petugas) merupakan akun uji coba/dummy
 */
export function isTestUser(
  user?:
    | {
        id?: string | null;
        name?: string | null;
        email?: string | null;
        nip?: string | null;
        phone?: string | null;
      }
    | string
    | null
): boolean {
  if (!user) return false;
  if (typeof user === "string") return isTestOrDummyString(user);
  if (isTestOrDummyString(user.name)) return true;
  if (isTestOrDummyString(user.email)) return true;
  if (isTestOrDummyString(user.nip)) return true;
  return false;
}

/**
 * Memeriksa apakah data Kelompok KKN merupakan kelompok uji coba/dummy
 */
export function isTestKelompok(
  kelompok?:
    | {
        id?: string | null;
        name?: string | null;
        kelurahan?: string | null;
        dplNamaMentah?: string | null;
        dpl?: any;
      }
    | string
    | null
): boolean {
  if (!kelompok) return false;
  if (typeof kelompok === "string") return isTestOrDummyString(kelompok);
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
  student?:
    | {
        id?: string | null;
        nim?: string | null;
        name?: string | null;
        user?: any;
        kelompok?: any;
      }
    | string
    | null
): boolean {
  if (!student) return false;
  if (typeof student === "string") return isTestOrDummyString(student);
  if (isTestOrDummyString(student.nim)) return true;
  if (isTestOrDummyString(student.name)) return true;
  if (student.user && isTestUser(student.user)) return true;
  if (student.kelompok && isTestKelompok(student.kelompok)) return true;
  return false;
}

/**
 * Helper array filter untuk User
 */
export function filterNonTestUsers<T extends { name?: string | null; email?: string | null; nip?: string | null }>(
  list: T[]
): T[] {
  return list.filter((u) => !isTestUser(u));
}

/**
 * Helper array filter untuk Kelompok
 */
export function filterNonTestKelompok<T extends { name?: string | null; kelurahan?: string | null; dpl?: any; dplNamaMentah?: string | null }>(
  list: T[]
): T[] {
  return list.filter((k) => !isTestKelompok(k));
}

/**
 * Helper array filter untuk Mahasiswa KKN
 */
export function filterNonTestStudents<T extends { nim?: string | null; name?: string | null; user?: any; kelompok?: any }>(
  list: T[]
): T[] {
  return list.filter((s) => !isTestStudent(s));
}
