/**
 * areaFilterUtils.ts
 * Utility terpusat untuk standarisasi hierarki filter wilayah & penugasan:
 * KELURAHAN ➔ RW ➔ KELOMPOK KKN
 */

import api from "./api";

export interface MasterKelurahanItem {
  id: string;
  name: string;
  kecamatanId?: number | null;
}

export interface MasterRwItem {
  id: number;
  name: string;
  kelurahanId?: string | null;
  kelurahanName?: string | null;
}

export interface KelompokItemLike {
  id: string;
  name: string;
  kelurahan?: string | null;
  cakupanRw?: any;
}

// In-memory cache for master data
let cachedMasterKelurahan: MasterKelurahanItem[] | null = null;
let cachedMasterRw: MasterRwItem[] | null = null;
let activeFetchPromise: Promise<{ kelurahans: MasterKelurahanItem[]; rws: MasterRwItem[] }> | null = null;

/**
 * Mengambil master Kelurahan dan Master RW langsung dari database via API.
 * Menggunakan in-memory caching agar efisien dan tidak membebani server saat navigasi antar tab/halaman.
 */
export const fetchMasterWilayah = async (forceRefresh = false): Promise<{
  kelurahans: MasterKelurahanItem[];
  rws: MasterRwItem[];
}> => {
  if (!forceRefresh && cachedMasterKelurahan && cachedMasterRw) {
    return { kelurahans: cachedMasterKelurahan, rws: cachedMasterRw };
  }

  if (activeFetchPromise && !forceRefresh) {
    return activeFetchPromise;
  }

  activeFetchPromise = (async () => {
    try {
      const [kelRes, rwRes] = await Promise.all([
        api.get("/areas/kelurahan").catch(() => ({ data: { data: [] } })),
        api.get("/areas/rw").catch(() => ({ data: { data: [] } })),
      ]);

      const rawKel = Array.isArray(kelRes.data)
        ? kelRes.data
        : kelRes.data?.data || [];
      const kelurahans: MasterKelurahanItem[] = rawKel.map((k: any) => ({
        id: String(k.id),
        name: String(k.name || "").trim(),
        kecamatanId: k.kecamatanId ?? null,
      }));

      const rawRw = Array.isArray(rwRes.data)
        ? rwRes.data
        : rwRes.data?.data || [];
      const rws: MasterRwItem[] = rawRw.map((r: any) => ({
        id: Number(r.id),
        name: String(r.name || "").trim(),
        kelurahanId: r.kelurahanId ? String(r.kelurahanId) : null,
        kelurahanName: r.kelurahan?.name ? String(r.kelurahan.name).trim() : null,
      }));

      cachedMasterKelurahan = kelurahans;
      cachedMasterRw = rws;
      return { kelurahans, rws };
    } catch (err) {
      console.error("[areaFilterUtils] Gagal mengambil master data wilayah:", err);
      return {
        kelurahans: cachedMasterKelurahan || [],
        rws: cachedMasterRw || [],
      };
    } finally {
      activeFetchPromise = null;
    }
  })();

  return activeFetchPromise;
};

/**
 * Format nomor RW menjadi "RW XX" seragam (2 digit padding).
 * Contoh: "1" -> "RW 01", "RW 2" -> "RW 02", "03" -> "RW 03"
 */
export const formatRwLabel = (rw: string | number | null | undefined): string => {
  if (rw === null || rw === undefined) return "-";
  const str = String(rw).trim();
  if (!str || str === "-") return "-";
  if (str === "ALL" || str === "Semua RW") return "Semua RW";

  const num = parseInt(str.replace(/\D/g, ""), 10);
  if (isNaN(num)) return str;
  return `RW ${String(num).padStart(2, "0")}`;
};

/**
 * Ekstrak nomor murni integer dari string/number RW.
 * Contoh: "RW 02" -> 2, "03" -> 3
 */
export const extractRwNumber = (rw: string | number | null | undefined): number | null => {
  if (rw === null || rw === undefined) return null;
  const num = parseInt(String(rw).replace(/\D/g, ""), 10);
  return isNaN(num) ? null : num;
};

/**
 * Standarisasi pembersihan nama kelurahan untuk pencocokan string toleran.
 */
export const cleanKelurahanName = (name: string | null | undefined): string => {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/^(kelurahan|kel\.)\s*/i, "")
    .replace(/\s+/g, "")
    .trim();
};

/**
 * Memeriksa apakah nama kelurahan cocok secara fleksibel.
 */
export const isKelurahanMatching = (
  sourceKelurahan: string | null | undefined,
  targetKelurahan: string | null | undefined
): boolean => {
  if (!targetKelurahan || targetKelurahan === "ALL" || targetKelurahan === "Semua Kelurahan" || targetKelurahan === "SEMUA") {
    return true;
  }
  if (!sourceKelurahan) return false;
  const cleanSource = cleanKelurahanName(sourceKelurahan);
  const cleanTarget = cleanKelurahanName(targetKelurahan);
  return cleanSource.includes(cleanTarget) || cleanTarget.includes(cleanSource);
};

/**
 * Memeriksa apakah data RW mahasiswa / posko / kelompok cocok dengan target RW yang dipilih.
 */
export const isRwMatching = (
  itemRw: string | number | null | undefined,
  targetRw: string | number | null | undefined
): boolean => {
  if (!targetRw || targetRw === "ALL" || targetRw === "Semua RW" || targetRw === "SEMUA") {
    return true;
  }
  const targetNum = extractRwNumber(targetRw);
  if (targetNum === null) return true;

  const itemNum = extractRwNumber(itemRw);
  return itemNum !== null && itemNum === targetNum;
};

/**
 * Memeriksa apakah suatu Kelompok KKN mencakup nomor RW tertentu (dari field cakupanRw).
 */
export const isKelompokCoveringRw = (
  kelompok: KelompokItemLike | null | undefined,
  targetRw: string | number | null | undefined
): boolean => {
  if (!targetRw || targetRw === "ALL" || targetRw === "Semua RW" || targetRw === "SEMUA") {
    return true;
  }
  if (!kelompok?.cakupanRw) return false;

  const targetNum = extractRwNumber(targetRw);
  if (targetNum === null) return true;

  let rws: any[] = [];
  if (Array.isArray(kelompok.cakupanRw)) {
    rws = kelompok.cakupanRw;
  } else if (typeof kelompok.cakupanRw === "string") {
    try {
      const parsed = JSON.parse(kelompok.cakupanRw);
      rws = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      rws = kelompok.cakupanRw.split(",");
    }
  }

  return rws.some((r) => {
    const num = extractRwNumber(r);
    return num !== null && num === targetNum;
  });
};

/**
 * Menghasilkan daftar RW unik terurut untuk suatu Kelurahan berdasarkan master RW database atau cakupan kelompok.
 */
export const getRwOptionsForKelurahan = (
  selectedKelurahan: string,
  masterRwList: MasterRwItem[] = [],
  groups: KelompokItemLike[] = []
): string[] => {
  const isKelSelected = Boolean(
    selectedKelurahan &&
    selectedKelurahan !== "ALL" &&
    selectedKelurahan !== "Semua Kelurahan" &&
    selectedKelurahan !== "SEMUA"
  );

  const rwMap = new Map<number, string>();

  // 1. Ambil dari masterRwList
  if (masterRwList && masterRwList.length > 0) {
    const filteredMaster = isKelSelected
      ? masterRwList.filter((r) => isKelurahanMatching(r.kelurahanName, selectedKelurahan))
      : masterRwList;

    filteredMaster.forEach((r) => {
      const num = extractRwNumber(r.name);
      if (num !== null && num > 0 && num < 90) {
        rwMap.set(num, formatRwLabel(num));
      }
    });
  }

  // 2. Fallback / Tambahan dari cakupanRw kelompok
  if (groups && groups.length > 0) {
    const filteredGroups = isKelSelected
      ? groups.filter((g) => isKelurahanMatching(g.kelurahan, selectedKelurahan))
      : groups;

    filteredGroups.forEach((g) => {
      if (g.cakupanRw) {
        let arr: any[] = [];
        if (Array.isArray(g.cakupanRw)) {
          arr = g.cakupanRw;
        } else if (typeof g.cakupanRw === "string") {
          try {
            const parsed = JSON.parse(g.cakupanRw);
            arr = Array.isArray(parsed) ? parsed : [parsed];
          } catch {
            arr = g.cakupanRw.split(",");
          }
        }
        arr.forEach((item) => {
          const num = extractRwNumber(item);
          if (num !== null && num > 0 && num < 90) {
            rwMap.set(num, formatRwLabel(num));
          }
        });
      }
    });
  }

  const sorted = Array.from(rwMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([, label]) => label);

  return sorted;
};

/**
 * Filter daftar kelompok berdasarkan Kelurahan dan RW yang dipilih.
 */
export const filterGroupsByArea = <T extends KelompokItemLike>(
  groups: T[],
  selectedKelurahan: string,
  selectedRw: string
): T[] => {
  let list = groups;
  if (selectedKelurahan && selectedKelurahan !== "ALL" && selectedKelurahan !== "Semua Kelurahan" && selectedKelurahan !== "SEMUA") {
    list = list.filter((g) => isKelurahanMatching(g.kelurahan, selectedKelurahan));
  }
  if (selectedRw && selectedRw !== "ALL" && selectedRw !== "Semua RW" && selectedRw !== "SEMUA") {
    list = list.filter((g) => isKelompokCoveringRw(g, selectedRw));
  }
  return list;
};
