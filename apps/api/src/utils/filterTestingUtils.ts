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
  if (!str) return false;
  const lower = String(str).toLowerCase().trim();
  return TEST_KEYWORDS.some((kw) => lower.includes(kw));
}

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
        isTestAccount?: boolean | null;
      }
    | string
    | null
): boolean {
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
 * Memeriksa apakah data Kelompok KKN merupakan kelompok uji coba/dummy
 */
export function isTestKelompok(
  kelompok?:
    | {
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
      }
    | string
    | null
): boolean {
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
        nama?: string | null;
        namaMahasiswa?: string | null;
        noWa?: string | null;
        phone?: string | null;
        user?: any;
        kelompok?: any;
      }
    | string
    | null
): boolean {
  if (!student) return false;
  if (typeof student === "string") return isTestOrDummyString(student);
  if (student.nim) {
    const cleanNim = String(student.nim).trim();
    if (TEST_NIMS.includes(cleanNim)) return true;
  }
  if (student.user?.isTestAccount) return true;
  if (isTestOrDummyString(student.nim)) return true;
  if (isTestOrDummyString(student.name)) return true;
  if (isTestOrDummyString(student.nama)) return true;
  if (isTestOrDummyString(student.namaMahasiswa)) return true;
  if (student.phone) {
    const cleanP = student.phone.replace(/[\s-]/g, "");
    if (TEST_PHONES.some((tp) => cleanP === tp || cleanP.includes("12345678900"))) return true;
  }
  if (student.noWa) {
    const cleanW = student.noWa.replace(/[\s-]/g, "");
    if (TEST_PHONES.some((tp) => cleanW === tp || cleanW.includes("12345678900"))) return true;
  }
  if (student.user && isTestUser(student.user)) return true;
  if (student.kelompok && isTestKelompok(student.kelompok)) return true;
  return false;
}

/**
 * Memeriksa apakah data Posko KKN merupakan posko uji coba/dummy
 */
export function isTestPosko(
  posko?:
    | {
        id?: string | null;
        nama?: string | null;
        name?: string | null;
        kelompokId?: string | null;
        kelompok?: any;
        kelompokName?: string | null;
        namaKelompok?: string | null;
        dplName?: string | null;
      }
    | string
    | null
): boolean {
  if (!posko) return false;
  if (typeof posko === "string") return isTestOrDummyString(posko);
  if (isTestOrDummyString(posko.nama || posko.name)) return true;
  if (isTestOrDummyString(posko.kelompokName)) return true;
  if (isTestOrDummyString(posko.namaKelompok)) return true;
  if (isTestOrDummyString(posko.dplName)) return true;
  if (posko.kelompok && isTestKelompok(posko.kelompok)) return true;
  if (isTestKelompok(posko as any)) return true;
  return false;
}

/**
 * Memeriksa apakah data Program Kerja merupakan proker uji coba/dummy
 */
export function isTestProker(
  proker?:
    | {
        id?: string | null;
        judul?: string | null;
        nama?: string | null;
        namaProker?: string | null;
        deskripsi?: string | null;
        kelompokName?: string | null;
        namaKelompok?: string | null;
        dplNama?: string | null;
        dplName?: string | null;
        kelompok?: any;
        student?: any;
        mahasiswa?: any;
        [key: string]: any;
      }
    | string
    | null
): boolean {
  if (!proker) return false;
  if (typeof proker === "string") return isTestOrDummyString(proker);
  if (isTestOrDummyString(proker.judul)) return true;
  if (isTestOrDummyString(proker.nama)) return true;
  if (isTestOrDummyString(proker.namaProker)) return true;
  if (isTestOrDummyString(proker.deskripsi)) return true;
  if (isTestOrDummyString(proker.kelompokName)) return true;
  if (isTestOrDummyString(proker.namaKelompok)) return true;
  if (isTestOrDummyString(proker.dplNama)) return true;
  if (isTestOrDummyString(proker.dplName)) return true;
  if (proker.kelompok && isTestKelompok(proker.kelompok)) return true;
  if (proker.student && isTestStudent(proker.student)) return true;
  if (proker.mahasiswa && isTestStudent(proker.mahasiswa)) return true;
  if (isTestKelompok(proker as any)) return true;
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

/**
 * Helper array filter untuk Posko KKN
 */
export function filterNonTestPosko<T>(list: T[]): T[] {
  return list.filter((p) => !isTestPosko(p as any));
}

/**
 * Helper array filter untuk Program Kerja
 */
export function filterNonTestProker<T>(list: T[]): T[] {
  return list.filter((p) => !isTestProker(p as any));
}

/**
 * Helper Prisma where clause untuk mengecualikan akun testing
 */
export function getNonTestUserWhere(includeTestAccounts?: boolean) {
  if (includeTestAccounts) return {};
  return { isTestAccount: false };
}

/**
 * Helper Prisma where clause untuk StudentKkn mengecualikan akun testing
 */
export function getNonTestStudentWhere(includeTestAccounts?: boolean) {
  if (includeTestAccounts) return {};
  return { user: { isTestAccount: false } };
}
