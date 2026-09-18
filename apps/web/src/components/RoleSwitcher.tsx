/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * RoleSwitcher: Komponen UI untuk beralih peran akun (Multi-Role Switcher - Opsi A)
 */

import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  RefreshCw, 
  Check, 
  ChevronDown, 
  Award,
  GraduationCap,
  Loader2
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import showToast from "../utils/showToast";

export const RoleSwitcher: React.FC = () => {
  const { user, switchRole } = useAuthStore();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  const currentRole = (user.peran || (user as any).role || "").toUpperCase();
  const availableRoles = (user.availableRoles || [currentRole]).map((r: string) => r.toUpperCase());

  // Validasi: Fitur switcher ini EKSKLUSIF hanya untuk akun Pimpinan yang memiliki peran DPL
  const isPimpinan = ["PIMPINAN", "PEMIMPIN"].includes(currentRole);
  const isDpl = ["DPL", "DOSEN_PEMBIMBING"].includes(currentRole);
  const hasPimpinanRole = availableRoles.some((r: string) => ["PIMPINAN", "PEMIMPIN"].includes(r));
  const hasDplRole = availableRoles.some((r: string) => ["DPL", "DOSEN_PEMBIMBING"].includes(r));

  // Jika akun bukan peran ganda Pimpinan & DPL, jangan tampilkan switcher
  if (!(hasPimpinanRole && hasDplRole)) {
    return null;
  }

  const kelompokName =
    user.dplKelompok?.[0]?.name ||
    (user as any).kelompokName ||
    "Kelompok 1 Dago";

  const handleToggleRole = async (target: string) => {
    if (isSwitching) return;
    setIsSwitching(true);
    try {
      const ok = await switchRole(target);
      if (ok) {
        setIsOpen(false);
        if (target === "DPL") {
          showToast.success(`Beralih ke peran DPL (${kelompokName})`);
          navigate("/pelaksanaan/kelompok");
        } else {
          showToast.success("Beralih ke peran Pimpinan Eksekutif");
          navigate("/dasbor?tab=kkn");
        }
      } else {
        showToast.error("Gagal beralih peran");
      }
    } catch (err: any) {
      showToast.error(err?.message || "Terjadi kesalahan saat beralih peran");
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSwitching}
        title="Ganti Peran: Pimpinan / DPL"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all text-xs font-bold cursor-pointer shadow-2xs group ${
          isPimpinan
            ? "border-amber-200/80 dark:border-amber-800/80 bg-amber-50/80 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 hover:bg-amber-100/80"
            : "border-blue-200/80 dark:border-blue-800/80 bg-blue-50/80 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 hover:bg-blue-100/80"
        }`}
      >
        {isSwitching ? (
          <Loader2 size={13} className="animate-spin text-current" />
        ) : (
          <RefreshCw size={13} className="group-hover:rotate-180 transition-transform duration-500 text-current" />
        )}
        <span className="hidden sm:inline text-[11px] font-extrabold tracking-tight">
          Peran:
        </span>
        <span className="text-[11px] font-black max-w-[130px] truncate">
          {isPimpinan ? "Pimpinan Eksekutif" : `DPL (${kelompokName})`}
        </span>
        <ChevronDown size={12} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-black text-slate-400 uppercase tracking-wider">
                Ganti Peran Aktif
              </span>
              <span className="text-[9.5px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                2 Peran
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Beralih antara Dasbor Pimpinan dan Kelompok Bimbingan DPL secara instan.
            </p>
          </div>

          <div className="py-1">
            {/* Opsi 1: Pimpinan Eksekutif */}
            <button
              onClick={() => handleToggleRole("PEMIMPIN")}
              disabled={isSwitching || isPimpinan}
              className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between gap-2.5 transition-all text-xs cursor-pointer ${
                isPimpinan
                  ? "bg-amber-50/80 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-extrabold"
                  : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-amber-50 dark:bg-amber-950/50 text-amber-600">
                  <Award size={15} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="truncate font-bold">Pimpinan / Eksekutif</span>
                  <span className="text-[10px] text-slate-400 truncate">Monitoring KKN Eksekutif</span>
                </div>
              </div>
              {isPimpinan && (
                <span className="flex items-center gap-1 text-[10px] font-black text-amber-600 bg-amber-100/70 dark:bg-amber-900/80 px-2 py-0.5 rounded-full shrink-0">
                  <Check size={10} strokeWidth={3} />
                  Aktif
                </span>
              )}
            </button>

            {/* Opsi 2: DPL Bimbingan */}
            <button
              onClick={() => handleToggleRole("DPL")}
              disabled={isSwitching || isDpl}
              className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between gap-2.5 transition-all text-xs cursor-pointer ${
                isDpl
                  ? "bg-blue-50/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-extrabold"
                  : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-blue-50 dark:bg-blue-950/50 text-blue-600">
                  <GraduationCap size={15} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="truncate font-bold">DPL (Dosen Pembimbing)</span>
                  <span className="text-[10px] text-slate-400 truncate">{kelompokName}</span>
                </div>
              </div>
              {isDpl && (
                <span className="flex items-center gap-1 text-[10px] font-black text-blue-600 bg-blue-100/70 dark:bg-blue-900/80 px-2 py-0.5 rounded-full shrink-0">
                  <Check size={10} strokeWidth={3} />
                  Aktif
                </span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleSwitcher;
