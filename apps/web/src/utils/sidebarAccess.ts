/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Helper untuk menentukan apakah suatu rute tujuan dapat diakses dan
 * tampil pada menu sidebar pengguna saat ini (terutama role PIMPINAN).
 */

import type { User, UserRole } from "../store/useAuthStore";

export function normalizeUserRole(rawRole?: string): UserRole {
  const r = String(rawRole || "").toUpperCase();
  if (["PEMIMPIN", "PIMPINAN"].includes(r)) return "PIMPINAN";
  if (["MPL", "MITRA_PEMBIMBING_LAPANGAN", "MITRA_PENDAMPING_LAPANGAN", "MITRA"].includes(r)) return "MPL";
  if (["DPL", "DOSEN_PEMBIMBING", "DOSEN_PENDAMPING", "DOSEN_PENDAMPING_LAPANGAN"].includes(r)) return "DPL";
  if (["TASKFORCE", "TASK_FORCE", "PANITIA_TASKFORCE"].includes(r)) return "PANITIA_TASKFORCE";
  return (r || "WARGA") as UserRole;
}

/**
 * Menentukan apakah suatu target URL dapat diakses pada menu sidebar pengguna saat ini.
 * Jika rute tidak ada di menu sidebar pengguna (misal Wilayah RW atau Operasional untuk PIMPINAN),
 * fungsi ini mengembalikan `false` sehingga kartu atau link terkait dapat dibuat statis.
 */
export function canAccessSidebarRoute(
  targetUrl: string | undefined | null,
  user: User | null,
  can?: (resource: string, action?: any) => boolean
): boolean {
  if (!targetUrl || !user) return false;

  const role = normalizeUserRole(user.peran || user.role);

  // DEVELOPER dan SUPER_USER selalu memiliki akses penuh ke seluruh rute sidebar
  if (role === "DEVELOPER" || role === "SUPER_USER") {
    return true;
  }

  // Bersihkan target URL dari query parameter dan hash untuk pencocokan path dasar
  const cleanPath = targetUrl.split("?")[0].split("#")[0].trim().toLowerCase();

  // Helper can view resource
  const canView = (resource: string): boolean => {
    if (typeof can === "function") {
      return can(resource, "canView");
    }
    return false;
  };

  // 1. Rute Wilayah (Provinsi, Kota, Kecamatan, Kelurahan, RW)
  const isWilayahRoute =
    cleanPath.startsWith("/wilayah/") ||
    cleanPath === "/wilayah" ||
    cleanPath.startsWith("/master-data/rukun-warga") ||
    cleanPath.startsWith("/master-rw") ||
    cleanPath.startsWith("/master-data/kelurahan") ||
    cleanPath.startsWith("/master-data/kecamatan") ||
    cleanPath.startsWith("/master-data/kota-kabupaten") ||
    cleanPath.startsWith("/master-data/provinsi");

  if (isWilayahRoute) {
    // Pada Sidebar.tsx: if (isPimpinan) return [];
    // Wilayah hanya terbuka untuk DEVELOPER, SUPER_USER, ADMIN_DLH, atau permission master_data_wilayah
    if (role === "PIMPINAN") return false;
    return role === "ADMIN_DLH" || canView("master_data_wilayah");
  }

  // 2. Rute Operasional Pemilahan & Rekapitulasi
  // (/monitoring-pemilahan/rekapitulasi-setoran, /monitoring-pemilahan/penyetoran-sampah, /monitoring-pemilahan/pengangkutan-sampah)
  const isRekapitulasiRoute =
    cleanPath === "/monitoring-pemilahan/rekapitulasi-setoran" ||
    cleanPath === "/rekapitulasi-setoran" ||
    cleanPath === "/rekap-setoran" ||
    cleanPath === "/pemantauan-rekapitulasi";

  if (isRekapitulasiRoute) {
    // Di Sidebar.tsx: Grup Operasional TIDAK mengizinkan PIMPINAN
    // (hanya DEVELOPER, SUPER_USER, ADMIN_DLH, CAMAT, LURAH, RW, PETUGAS_RESIDU, WARGA, MAHASISWA_KKN, PANITIA_TASKFORCE)
    if (role === "PIMPINAN") return false;
    const allowedGroup: UserRole[] = [
      "ADMIN_DLH",
      "CAMAT",
      "LURAH",
      "RW",
      "PETUGAS_RESIDU",
      "PANITIA_TASKFORCE",
    ];
    return allowedGroup.includes(role) || canView("laporan_analitik");
  }

  const isOperasionalWasteRoute =
    cleanPath === "/monitoring-pemilahan/penyetoran-sampah" ||
    cleanPath === "/penyetoran-sampah" ||
    cleanPath === "/setor-sampah" ||
    cleanPath === "/setor" ||
    cleanPath === "/monitoring-pemilahan/pengangkutan-sampah" ||
    cleanPath === "/pengangkutan-residu" ||
    cleanPath === "/residu" ||
    cleanPath === "/manajemen-pengangkutan";

  if (isOperasionalWasteRoute) {
    if (role === "PIMPINAN") return false;
    const allowed: UserRole[] = [
      "ADMIN_DLH",
      "CAMAT",
      "LURAH",
      "RW",
      "PETUGAS_RESIDU",
      "WARGA",
      "PANITIA_TASKFORCE",
      "MAHASISWA_KKN",
    ];
    return allowed.includes(role);
  }

  // 3. Rute Point & Peringkat (/peringkat, /monitoring-pemilahan/peringkat-warga)
  const isPeringkatRoute =
    cleanPath === "/monitoring-pemilahan/peringkat-warga" ||
    cleanPath === "/monitoring-pemilahan/papan-peringkat" ||
    cleanPath === "/peringkat" ||
    cleanPath === "/leaderboard" ||
    cleanPath === "/poin-warga";

  if (isPeringkatRoute) {
    // Di Sidebar.tsx: Grup Point & Peringkat TIDAK mengizinkan PIMPINAN
    if (role === "PIMPINAN") return false;
    const allowed: UserRole[] = [
      "ADMIN_DLH",
      "CAMAT",
      "LURAH",
      "RW",
      "PETUGAS_RESIDU",
      "MAHASISWA_KKN",
      "PANITIA_TASKFORCE",
      "WARGA",
    ];
    return allowed.includes(role) || canView("poin_warga");
  }

  // 4. Rute Tempat Sampah (/monitoring-pengelolaan/tempat-sampah)
  const isTempatSampahRoute =
    cleanPath === "/monitoring-pengelolaan/tempat-sampah" ||
    cleanPath === "/master-data/manajemen-tempat-sampah" ||
    cleanPath === "/manajemen-tempat-sampah" ||
    cleanPath === "/tempat-sampah-teraktivasi";

  if (isTempatSampahRoute) {
    // Di Sidebar.tsx: resource "manajemen_tempat_sampah".
    // PIMPINAN tidak memiliki permission manajemen_tempat_sampah secara default
    if (role === "PIMPINAN") {
      return canView("manajemen_tempat_sampah");
    }
    const allowed: UserRole[] = [
      "ADMIN_DLH",
      "CAMAT",
      "LURAH",
      "RW",
      "PETUGAS_RESIDU",
      "PANITIA_TASKFORCE",
      "MPL",
      "MAHASISWA_KKN",
    ];
    return allowed.includes(role) || canView("manajemen_tempat_sampah");
  }

  // 5. Rute Master Data Pengguna
  const isPenggunaRoute =
    cleanPath.startsWith("/pengguna") ||
    cleanPath.startsWith("/master-data-pengguna") ||
    cleanPath.startsWith("/manajemen-pengguna") ||
    cleanPath.startsWith("/users") ||
    cleanPath.startsWith("/admin/users");

  if (isPenggunaRoute) {
    if (role === "PIMPINAN") return false;
    return (
      role === "ADMIN_DLH" ||
      role === "CAMAT" ||
      role === "LURAH" ||
      role === "PANITIA_TASKFORCE" ||
      role === "TASK_FORCE" ||
      role === "RW" ||
      canView("manajemen_pengguna")
    );
  }

  // 5.1. Rute Peraturan & Master Rule Engine
  const isPeraturanRoute =
    cleanPath === "/peraturan" ||
    cleanPath === "/master-rule-engine" ||
    cleanPath === "/master-data/rule-engine" ||
    cleanPath === "/dataset/peraturan";

  if (isPeraturanRoute) {
    if (role === "PIMPINAN") return false;
    return (
      role === "ADMIN_DLH" ||
      role === "SUPER_USER" ||
      role === "DEVELOPER"
    );
  }

  // 6. Rute Fasilitas Pengelolaan Sampah
  const isFasilitasRoute =
    cleanPath === "/monitoring-pengelolaan/fasilitas" ||
    cleanPath === "/fasilitas" ||
    cleanPath === "/pengelolaan-sampah" ||
    cleanPath === "/fasilitas-dan-posko";

  if (isFasilitasRoute) {
    if (role === "PIMPINAN") {
      return canView("pemanfaatan");
    }
    return true;
  }

  // 7. Rute Dasbor & Analisis Sistem & BERSEKA AI & Monitoring Wilayah & Manajemen IoT (Terbuka untuk PIMPINAN)
  if (
    cleanPath === "/dasbor" ||
    cleanPath === "/berseka-ai" ||
    cleanPath === "/analisis-sistem/tata-kelola-sampah" ||
    cleanPath === "/analisis-sistem/kkn" ||
    cleanPath === "/monitoring-wilayah" ||
    cleanPath === "/manajemen-iot" ||
    cleanPath === "/iot"
  ) {
    return true;
  }

  // 8. Rute Pelaksanaan, Monitoring, Penilaian, Logbook, Hasil Survei, dan Laporan Resmi KKN (Terbuka untuk PIMPINAN)
  const isKknExecutiveAllowed =
    cleanPath.startsWith("/pelaksanaan/") ||
    cleanPath.startsWith("/monitoring-kegiatan/") ||
    cleanPath.startsWith("/penilaian/") ||
    cleanPath.startsWith("/log-aktivitas/") ||
    cleanPath.startsWith("/hasil-survei/") ||
    cleanPath.startsWith("/laporan/") ||
    cleanPath === "/laporan/kkn" ||
    cleanPath === "/laporan-pimpinan/kkn";

  if (isKknExecutiveAllowed) {
    return true;
  }

  // Default fallback
  return false;
}
