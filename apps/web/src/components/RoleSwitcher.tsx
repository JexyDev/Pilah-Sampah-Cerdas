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
  Shield, 
  GraduationCap, 
  Briefcase, 
  Users, 
  Building2, 
  Truck, 
  Award,
  Sparkles,
  Loader2
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import showToast from "../utils/showToast";

const ROLE_LABELS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  DEVELOPER: { label: "Developer", icon: Sparkles, color: "text-purple-600 bg-purple-50 dark:bg-purple-950/50" },
  SUPER_USER: { label: "Super Admin", icon: Shield, color: "text-red-600 bg-red-50 dark:bg-red-950/50" },
  ADMIN_DLH: { label: "Admin DLH", icon: Building2, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50" },
  PIMPINAN: { label: "Pimpinan / Eksekutif", icon: Award, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/50" },
  PEMIMPIN: { label: "Pimpinan / Eksekutif", icon: Award, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/50" },
  DPL: { label: "DPL (Dosen Pembimbing)", icon: GraduationCap, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/50" },
  DOSEN_PEMBIMBING: { label: "DPL (Dosen Pembimbing)", icon: GraduationCap, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/50" },
  MPL: { label: "MPL (Mitra Pembimbing)", icon: Briefcase, color: "text-teal-600 bg-teal-50 dark:bg-teal-950/50" },
  MITRA_PEMBIMBING_LAPANGAN: { label: "MPL (Mitra Pembimbing)", icon: Briefcase, color: "text-teal-600 bg-teal-50 dark:bg-teal-950/50" },
  PANITIA_TASKFORCE: { label: "Panitia Task Force", icon: Shield, color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50" },
  TASK_FORCE: { label: "Panitia Task Force", icon: Shield, color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50" },
  MAHASISWA_KKN: { label: "Mahasiswa KKN", icon: Users, color: "text-cyan-600 bg-cyan-50 dark:bg-cyan-950/50" },
  PETUGAS_RESIDU: { label: "Petugas Pemilah", icon: Truck, color: "text-orange-600 bg-orange-50 dark:bg-orange-950/50" },
  CAMAT: { label: "Camat Coblong", icon: Building2, color: "text-slate-600 bg-slate-50 dark:bg-slate-950/50" },
  LURAH: { label: "Lurah", icon: Building2, color: "text-slate-600 bg-slate-50 dark:bg-slate-950/50" },
  RW: { label: "Rukun Warga (RW)", icon: Users, color: "text-slate-600 bg-slate-50 dark:bg-slate-950/50" },
  WARGA: { label: "Warga Komunitas", icon: Users, color: "text-slate-600 bg-slate-50 dark:bg-slate-950/50" },
};

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
  const isMaster = currentRole === "DEVELOPER" || currentRole === "SUPER_USER";

  // Ambil daftar peran yang tersedia
  let availableRoles = user.availableRoles || [];
  if (availableRoles.length === 0) {
    availableRoles = [currentRole];
  }

  // Jika master developer / super user, izinkan switch ke semua peran operasional
  if (isMaster) {
    const standardRoles = [
      "DEVELOPER",
      "SUPER_USER",
      "PIMPINAN",
      "ADMIN_DLH",
      "DPL",
      "MPL",
      "PANITIA_TASKFORCE",
      "MAHASISWA_KKN",
      "PETUGAS_RESIDU",
      "RW",
      "LURAH",
      "CAMAT",
      "WARGA",
    ];
    availableRoles = Array.from(new Set([...availableRoles, ...standardRoles]));
  }

  // Hanya tampilkan switcher jika ada lebih dari 1 peran yang tersedia
  if (availableRoles.length <= 1) return null;

  const currentRoleMeta = ROLE_LABELS[currentRole] || {
    label: currentRole,
    icon: Shield,
    color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50",
  };

  const handleSelectRole = async (targetRole: string) => {
    if (targetRole === currentRole || isSwitching) return;
    setIsSwitching(true);
    try {
      const ok = await switchRole(targetRole);
      if (ok) {
        showToast.success(`Berhasil beralih ke peran ${ROLE_LABELS[targetRole]?.label || targetRole}`);
        setIsOpen(false);
        // Refresh navigasi ke dasbor role terkait
        if (targetRole === "MPL") {
          navigate("/dashboard-mpl");
        } else if (targetRole === "DPL") {
          navigate("/pelaksanaan/kelompok");
        } else {
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
        title="Ganti Peran Aktif Akun"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/80 bg-emerald-50/70 dark:bg-emerald-950/50 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/60 transition-all text-xs font-bold text-emerald-800 dark:text-emerald-300 cursor-pointer shadow-2xs group"
      >
        {isSwitching ? (
          <Loader2 size={13} className="animate-spin text-emerald-600" />
        ) : (
          <RefreshCw size={13} className="text-emerald-600 dark:text-emerald-400 group-hover:rotate-180 transition-transform duration-500" />
        )}
        <span className="hidden md:inline text-[11px] font-extrabold tracking-tight">
          Peran:
        </span>
        <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-300 max-w-[100px] truncate">
          {currentRoleMeta.label}
        </span>
        <ChevronDown size={12} className={`text-emerald-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-black text-slate-400 uppercase tracking-wider">
                Ganti Peran Aktif
              </span>
              <span className="text-[9.5px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                {availableRoles.length} Peran
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Pilih peran untuk mengubah hak akses & antarmuka secara langsung tanpa logout.
            </p>
          </div>

          <div className="py-1 max-h-64 overflow-y-auto scrollbar-thin">
            {availableRoles.map((roleName) => {
              const meta = ROLE_LABELS[roleName] || {
                label: roleName,
                icon: Shield,
                color: "text-slate-600 bg-slate-50",
              };
              const RoleIcon = meta.icon;
              const isActive = roleName === currentRole;

              return (
                <button
                  key={roleName}
                  onClick={() => handleSelectRole(roleName)}
                  disabled={isSwitching || isActive}
                  className={`w-full px-3.5 py-2 text-left flex items-center justify-between gap-2.5 transition-all text-xs cursor-pointer ${
                    isActive
                      ? "bg-emerald-50/80 dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 font-extrabold"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${meta.color}`}>
                      <RoleIcon size={13} />
                    </div>
                    <span className="truncate">{meta.label}</span>
                  </div>
                  {isActive && (
                    <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-100/70 dark:bg-emerald-900/80 px-2 py-0.5 rounded-full shrink-0">
                      <Check size={10} strokeWidth={3} />
                      Aktif
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleSwitcher;
