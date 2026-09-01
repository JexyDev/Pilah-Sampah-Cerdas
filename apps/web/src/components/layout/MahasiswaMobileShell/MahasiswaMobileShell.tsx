/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Mobile-First Shell Component for Mahasiswa KKN (Optimized for iOS Safari & Mobile Viewports)
 */

import React, { useState } from "react";
import {
  Home,
  MapPin,
  ClipboardList,
  Target,
  User,
  Bell,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  PlusCircle,
} from "lucide-react";
import { useAuthStore } from "../../../store/useAuthStore";
import showToast from "../../../utils/showToast";
import { useNavigate } from "react-router-dom";

interface MahasiswaMobileShellProps {
  activeTab?: "beranda" | "presensi" | "logbook" | "proker" | "profil";
  onTabChange?: (tab: "beranda" | "presensi" | "logbook" | "proker" | "profil") => void;
  children: (activeTab: "beranda" | "presensi" | "logbook" | "proker" | "profil") => React.ReactNode;
}

export const MahasiswaMobileShell: React.FC<MahasiswaMobileShellProps> = ({
  activeTab: controlledTab,
  onTabChange,
  children,
}) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [internalTab, setInternalTab] = useState<"beranda" | "presensi" | "logbook" | "proker" | "profil">("beranda");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const currentTab = controlledTab || internalTab;

  const handleSelectTab = (tab: "beranda" | "presensi" | "logbook" | "proker" | "profil") => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalTab(tab);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLogout = () => {
    logout();
    showToast.success("Berhasil keluar dari akun");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col font-sans text-slate-800 dark:text-slate-100 antialiased selection:bg-emerald-500 selection:text-white">
      {/* 1. Mobile Top App Bar (iOS Status-Bar Safe) */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-2xs pt-[env(safe-area-inset-top,0px)]">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between gap-3">
          {/* Left: App Logo & Role Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#035941] to-emerald-600 flex items-center justify-center shadow-xs shrink-0">
              <img src="/app-logo.png" alt="BERSEKA" className="w-5 h-5 object-contain" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm tracking-tight text-slate-900 dark:text-white truncate">
                  BERSEKA
                </span>
                <span className="px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[9px] font-black rounded-md uppercase tracking-wider">
                  KKN
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                {user?.wilayah || "Area KKN Coblong"}
              </p>
            </div>
          </div>

          {/* Right: Quick Profile Initials & Logout */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleSelectTab("profil")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                currentTab === "profil"
                  ? "bg-emerald-500 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-emerald-700/20 flex items-center justify-center font-bold text-[10px] uppercase">
                {user?.avatar || (user?.name ? user.name[0] : "M")}
              </div>
              <span className="text-xs font-bold max-w-[80px] truncate">
                {user?.name?.split(" ")[0] || "Akun"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Scrollable Content View (Max Mobile Width 480px for optimal reading) */}
      <main className="flex-1 max-w-md w-full mx-auto pb-[calc(env(safe-area-inset-bottom,0px)+75px)] px-3.5 pt-3.5 space-y-4">
        {children(currentTab)}
      </main>

      {/* 3. Ergonomic Bottom Navigation Bar (iOS Home-Indicator Safe) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom,0px)]">
        <div className="max-w-md mx-auto px-2 h-15 flex items-center justify-around">
          {/* Tab 1: Beranda */}
          <button
            onClick={() => handleSelectTab("beranda")}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 cursor-pointer ${
              currentTab === "beranda"
                ? "text-emerald-700 dark:text-emerald-400 font-bold scale-105"
                : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-medium"
            }`}
          >
            <Home size={20} className={currentTab === "beranda" ? "stroke-[2.5]" : "stroke-[1.8]"} />
            <span className="text-[10px] mt-0.5 tracking-tight">Beranda</span>
          </button>

          {/* Tab 2: Presensi GPS */}
          <button
            onClick={() => handleSelectTab("presensi")}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 cursor-pointer ${
              currentTab === "presensi"
                ? "text-emerald-700 dark:text-emerald-400 font-bold scale-105"
                : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-medium"
            }`}
          >
            <MapPin size={20} className={currentTab === "presensi" ? "stroke-[2.5]" : "stroke-[1.8]"} />
            <span className="text-[10px] mt-0.5 tracking-tight">Presensi</span>
          </button>

          {/* Tab 3: Logbook (Center High-Impact Action) */}
          <button
            onClick={() => handleSelectTab("logbook")}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 cursor-pointer ${
              currentTab === "logbook"
                ? "text-emerald-700 dark:text-emerald-400 font-bold scale-105"
                : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-medium"
            }`}
          >
            <ClipboardList size={20} className={currentTab === "logbook" ? "stroke-[2.5]" : "stroke-[1.8]"} />
            <span className="text-[10px] mt-0.5 tracking-tight">Logbook</span>
          </button>

          {/* Tab 4: Proker */}
          <button
            onClick={() => handleSelectTab("proker")}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 cursor-pointer ${
              currentTab === "proker"
                ? "text-emerald-700 dark:text-emerald-400 font-bold scale-105"
                : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-medium"
            }`}
          >
            <Target size={20} className={currentTab === "proker" ? "stroke-[2.5]" : "stroke-[1.8]"} />
            <span className="text-[10px] mt-0.5 tracking-tight">Proker</span>
          </button>

          {/* Tab 5: Profil */}
          <button
            onClick={() => handleSelectTab("profil")}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 cursor-pointer ${
              currentTab === "profil"
                ? "text-emerald-700 dark:text-emerald-400 font-bold scale-105"
                : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-medium"
            }`}
          >
            <User size={20} className={currentTab === "profil" ? "stroke-[2.5]" : "stroke-[1.8]"} />
            <span className="text-[10px] mt-0.5 tracking-tight">Profil</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
