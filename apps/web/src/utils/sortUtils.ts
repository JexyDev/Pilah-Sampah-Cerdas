/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Utility: Natural & Standardized Sorting Functions
 * Supports:
 * - Natural numerical sorting for Kelompok KKN (Kelompok 1, 2, ..., 10, 11)
 * - Numerical sorting for Rukun Warga (RW 01, RW 02, ..., RW 21)
 * - Indonesian alphabetical string comparison (A-Z, Z-A)
 * - Multi-criteria student roster sorting (Kelompok -> Ketua First -> Nama A-Z)
 * - Chronological date/time sorting (Newest first / Oldest first)
 * - Numeric score / points sorting (Highest first / Lowest first)
 */

/**
 * Natural comparison between two strings.
 * Handles numbers inside strings correctly (e.g. "Kelompok 2" comes before "Kelompok 10").
 */
export const sortNatural = (a?: string | null, b?: string | null): number => {
  const strA = (a || "").trim();
  const strB = (b || "").trim();
  return strA.localeCompare(strB, "id", { numeric: true, sensitivity: "base" });
};

/**
 * Extracts a numeric value from a group/kelompok string.
 * Example: "Kelompok 05 Sadang Serang" -> 5
 */
export const extractGroupNumber = (groupName?: string | null): number => {
  if (!groupName) return 9999;
  const match = groupName.match(/\d+/);
  return match ? parseInt(match[0], 10) : 9999;
};

/**
 * Extracts a numeric value from an RW string.
 * Example: "RW 07" -> 7
 */
export const extractRwNumber = (rwName?: string | null): number => {
  if (!rwName) return 9999;
  const match = rwName.match(/\d+/);
  return match ? parseInt(match[0], 10) : 9999;
};

/**
 * Sorts an array of items by Kelompok naturally.
 */
export const sortKelompokList = <T>(
  items: T[],
  getKelompokName: (item: T) => string | undefined | null
): T[] => {
  return [...items].sort((a, b) => {
    const nameA = getKelompokName(a) || "";
    const nameB = getKelompokName(b) || "";
    const numA = extractGroupNumber(nameA);
    const numB = extractGroupNumber(nameB);

    if (numA !== numB) {
      return numA - numB;
    }
    return sortNatural(nameA, nameB);
  });
};

/**
 * Sorts an array of items by RW numerically (RW 01, RW 02, ..., RW 21).
 */
export const sortRwList = <T>(
  items: T[],
  getRwName: (item: T) => string | undefined | null
): T[] => {
  return [...items].sort((a, b) => {
    const rwA = getRwName(a) || "";
    const rwB = getRwName(b) || "";
    const numA = extractRwNumber(rwA);
    const numB = extractRwNumber(rwB);

    if (numA !== numB) {
      return numA - numB;
    }
    return sortNatural(rwA, rwB);
  });
};

/**
 * Sorts an array of items alphabetically (A-Z or Z-A).
 */
export const sortAlphabeticalList = <T>(
  items: T[],
  getString: (item: T) => string | undefined | null,
  order: "asc" | "desc" = "asc"
): T[] => {
  return [...items].sort((a, b) => {
    const valA = getString(a) || "";
    const valB = getString(b) || "";
    const res = valA.localeCompare(valB, "id", { sensitivity: "base", numeric: true });
    return order === "asc" ? res : -res;
  });
};

/**
 * Multi-criteria student roster sorting:
 * 1. Kelompok (Natural sort: Kelompok 1, 2, ..., 32)
 * 2. Jabatan (Ketua first, then Anggota)
 * 3. Nama (Alphabetical A-Z)
 */
export const sortStudentsRoster = <T>(
  items: T[],
  options: {
    getKelompok?: (item: T) => string | undefined | null;
    getIsKetua?: (item: T) => boolean | undefined | null;
    getName: (item: T) => string | undefined | null;
    getNim?: (item: T) => string | undefined | null;
  }
): T[] => {
  return [...items].sort((a, b) => {
    // 1. Kelompok
    if (options.getKelompok) {
      const kelA = options.getKelompok(a) || "";
      const kelB = options.getKelompok(b) || "";
      if (kelA !== kelB) {
        const numA = extractGroupNumber(kelA);
        const numB = extractGroupNumber(kelB);
        if (numA !== numB) return numA - numB;
        const comp = sortNatural(kelA, kelB);
        if (comp !== 0) return comp;
      }
    }

    // 2. Ketua first
    if (options.getIsKetua) {
      const isKetuaA = Boolean(options.getIsKetua(a));
      const isKetuaB = Boolean(options.getIsKetua(b));
      if (isKetuaA !== isKetuaB) {
        return isKetuaA ? -1 : 1;
      }
    }

    // 3. Nama Mahasiswa A-Z
    const nameA = options.getName(a) || "";
    const nameB = options.getName(b) || "";
    const nameComp = nameA.localeCompare(nameB, "id", { sensitivity: "base" });
    if (nameComp !== 0) return nameComp;

    // 4. NIM fallback
    if (options.getNim) {
      const nimA = options.getNim(a) || "";
      const nimB = options.getNim(b) || "";
      return nimA.localeCompare(nimB, undefined, { numeric: true });
    }

    return 0;
  });
};

/**
 * Sorts an array of items chronologically (newest first by default).
 */
export const sortChronologicalList = <T>(
  items: T[],
  getDate: (item: T) => string | number | Date | null | undefined,
  order: "desc" | "asc" = "desc"
): T[] => {
  return [...items].sort((a, b) => {
    const rawA = getDate(a);
    const rawB = getDate(b);
    const timeA = rawA ? new Date(rawA).getTime() : 0;
    const timeB = rawB ? new Date(rawB).getTime() : 0;
    const validA = isNaN(timeA) ? 0 : timeA;
    const validB = isNaN(timeB) ? 0 : timeB;

    return order === "desc" ? validB - validA : validA - validB;
  });
};

/**
 * Sorts an array of items numerically (highest first by default).
 */
export const sortNumericList = <T>(
  items: T[],
  getNumber: (item: T) => number | null | undefined,
  order: "desc" | "asc" = "desc"
): T[] => {
  return [...items].sort((a, b) => {
    const numA = Number(getNumber(a) || 0);
    const numB = Number(getNumber(b) || 0);
    return order === "desc" ? numB - numA : numA - numB;
  });
};
