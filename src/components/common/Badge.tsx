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

  let bgClass = "bg-slate-100 text-slate-700 border-slate-200";
  let displayLabel = status;

  if (normStatus === "ACTIVE_BOUND" || normStatus === "ACTIVE") {
    bgClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
    displayLabel = normStatus === "ACTIVE_BOUND" ? "ACTIVE BOUND" : "ACTIVE";
  } else if (normStatus === "PENDING_APPROVAL" || normStatus === "PENDING") {
    bgClass = "bg-amber-50 text-amber-700 border-amber-200";
    displayLabel = normStatus === "PENDING_APPROVAL" ? "PENDING APPROVAL" : "PENDING";
  } else if (normStatus === "BROKEN") {
    bgClass = "bg-rose-50 text-rose-700 border-rose-200";
    displayLabel = "BROKEN";
  } else if (normStatus === "ASSIGNED_TO_PIC" || normStatus === "DIPEGANG_MAHASISWA") {
    bgClass = "bg-sky-50 text-sky-700 border-sky-200";
    displayLabel = normStatus === "ASSIGNED_TO_PIC" ? "ASSIGNED TO PIC" : "DIPEGANG MAHASISWA";
  } else if (normStatus === "PRINTED" || normStatus === "BELUM_DIGUNAKAN") {
    bgClass = "bg-gray-50 text-gray-700 border-gray-200";
    displayLabel = normStatus === "PRINTED" ? "PRINTED" : "BELUM DIGUNAKAN";
  } else if (normStatus === "INACTIVE" || normStatus === "TIDAK_AKTIF") {
    bgClass = "bg-slate-100 text-slate-700 border-slate-300";
    displayLabel = normStatus === "INACTIVE" ? "INACTIVE" : "TIDAK AKTIF";
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border transition-all duration-150 ${bgClass} ${className}`}
    >
      {displayLabel}
    </span>
  );
};
