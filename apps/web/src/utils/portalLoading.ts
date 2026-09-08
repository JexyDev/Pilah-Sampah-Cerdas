/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Centralized Role-Based Portal Text & Loading Mapping
 */

export const ROLE_DISPLAY_NAMES: Record<string, string> = {
  DEVELOPER: "Portal Developer",
  DEV: "Portal Developer",
  SUPER_USER: "Portal Super Admin",
  SUPER_ADMIN: "Portal Super Admin",
  SUPERUSER: "Portal Super Admin",
  ADMIN: "Portal Super Admin",
  SU: "Portal Super Admin",
  ADMIN_DLH: "Portal Admin DLH",
  DLH: "Portal Admin DLH",
  DLH_ADMIN: "Portal Admin DLH",
  PIMPINAN: "Portal Pimpinan & Eksekutif KKN",
  PEMIMPIN: "Portal Pimpinan & Eksekutif KKN",
  DPL: "Portal DPL",
  DOSEN_PEMBIMBING: "Portal DPL",
  DOSEN_PENDAMPING: "Portal DPL",
  DOSEN_PENDAMPING_LAPANGAN: "Portal DPL",
  PANITIA_TASKFORCE: "Portal Taskforce",
  TASK_FORCE: "Portal Taskforce",
  TASKFORCE: "Portal Taskforce",
  PANITIA: "Portal Taskforce",
  MAHASISWA_KKN: "Portal Mahasiswa",
  MAHASISWA: "Portal Mahasiswa",
  CAMAT: "Portal Camat",
  ADMIN_KECAMATAN: "Portal Camat",
  LURAH: "Portal Lurah",
  ADMIN_KELURAH: "Portal Lurah",
  RW: "Portal RW",
  WARGA: "Portal Warga",
  PETUGAS_RESIDU: "Portal Petugas Residu",
  PETUGAS: "Portal Petugas Residu",
  PEMILAH: "Portal Petugas Pemilah",
  MPL: "Portal Mitra Pendamping Lapangan",
};

/**
 * Returns a human-friendly portal title for a given user role
 */
export const getPortalDisplayName = (role?: string): string => {
  if (!role) return "Portal Sistem";
  const cleanRole = String(role).trim().toUpperCase();
  return ROLE_DISPLAY_NAMES[cleanRole] ?? `Portal ${role}`;
};

/**
 * Returns a role-appropriate loading message (e.g. "Memuat Portal Pimpinan...")
 */
export const getPortalLoadingText = (role?: string, customSuffix: string = "..."): string => {
  if (!role) return `Memuat halaman${customSuffix}`;
  const cleanRole = String(role).trim().toUpperCase();
  
  if (["PIMPINAN", "PEMIMPIN"].includes(cleanRole)) {
    return `Memuat Portal Pimpinan${customSuffix}`;
  }
  if (["SUPER_USER", "SUPER_ADMIN", "SUPERUSER", "ADMIN", "SU"].includes(cleanRole)) {
    return `Memuat Portal Super Admin${customSuffix}`;
  }
  if (["ADMIN_DLH", "DLH", "DLH_ADMIN"].includes(cleanRole)) {
    return `Memuat Portal Admin DLH${customSuffix}`;
  }
  if (["DEVELOPER", "DEV"].includes(cleanRole)) {
    return `Memuat Portal Developer${customSuffix}`;
  }
  if (["DPL", "DOSEN_PEMBIMBING", "DOSEN_PENDAMPING", "DOSEN_PENDAMPING_LAPANGAN"].includes(cleanRole)) {
    return `Memuat Portal DPL${customSuffix}`;
  }
  if (["PANITIA_TASKFORCE", "TASK_FORCE", "TASKFORCE", "PANITIA"].includes(cleanRole)) {
    return `Memuat Portal Taskforce${customSuffix}`;
  }
  if (["MAHASISWA_KKN", "MAHASISWA"].includes(cleanRole)) {
    return `Memuat Portal Mahasiswa${customSuffix}`;
  }
  if (["CAMAT", "ADMIN_KECAMATAN"].includes(cleanRole)) {
    return `Memuat Portal Camat${customSuffix}`;
  }
  if (["LURAH", "ADMIN_KELURAH"].includes(cleanRole)) {
    return `Memuat Portal Lurah${customSuffix}`;
  }
  if (cleanRole === "RW") {
    return `Memuat Portal RW${customSuffix}`;
  }
  if (cleanRole === "WARGA") {
    return `Memuat Portal Warga${customSuffix}`;
  }
  if (["PETUGAS_RESIDU", "PETUGAS", "PEMILAH"].includes(cleanRole)) {
    return `Memuat Portal Petugas${customSuffix}`;
  }
  if (cleanRole === "MPL") {
    return `Memuat Portal MPL${customSuffix}`;
  }

  const displayName = ROLE_DISPLAY_NAMES[cleanRole];
  if (displayName) {
    return `Memuat ${displayName}${customSuffix}`;
  }

  return `Memuat Portal ${role}${customSuffix}`;
};
