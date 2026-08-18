import React from "react";

export type BadgeStatus =
  | "ACTIVE_BOUND"
  | "ACTIVE"
  | "PENDING_APPROVAL"
  | "PENDING"
  | "BROKEN"
  | "ASSIGNED_TO_PIC"
  | "DIPEGANG_MAHASISWA"
  | "PRINTED"
  | "BELUM_DIGUNAKAN"
  | "INACTIVE"
  | "TIDAK_AKTIF"
  | string;

interface BadgeProps {
  status: BadgeStatus;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, className = "" }) => {
  const normStatus = status ? status.toUpperCase() : "";

  let bgClass = "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700";
  let displayLabel = status;

  if (normStatus === "ACTIVE_BOUND" || normStatus === "ACTIVE") {
    bgClass = "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700/40";
    displayLabel = normStatus === "ACTIVE_BOUND" ? "Aktif Terhubung" : "Aktif";
  } else if (normStatus === "PENDING_APPROVAL" || normStatus === "PENDING") {
    bgClass = "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-700/40";
    displayLabel = "Menunggu Persetujuan";
  } else if (normStatus === "BROKEN" || normStatus === "RUSAK") {
    bgClass = "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-700/40";
    displayLabel = "Rusak";
  } else if (normStatus === "ASSIGNED_TO_PIC" || normStatus === "DIPEGANG_MAHASISWA") {
    bgClass = "bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-700/40";
    displayLabel = "Dipegang Mahasiswa";
  } else if (normStatus === "PRINTED" || normStatus === "BELUM_DIGUNAKAN") {
    bgClass = "bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700";
    displayLabel = "Tercetak";
  } else if (normStatus === "INACTIVE" || normStatus === "TIDAK_AKTIF") {
    bgClass = "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700";
    displayLabel = "Tidak Aktif";
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border transition-all duration-150 ${bgClass} ${className}`}
    >
      {displayLabel}
    </span>
  );
};
