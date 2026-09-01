/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Strict iOS Safari Validation Gate Component for Mahasiswa Mobile Web
 */

import React, { useState, useEffect } from "react";
import {
  Smartphone,
  Compass,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  RefreshCw,
  LogOut,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Code2,
} from "lucide-react";
import { checkIsIOSSafari, type DeviceValidationResult } from "../../utils/deviceValidation";
import { useAuthStore } from "../../store/useAuthStore";
import showToast from "../../utils/showToast";
import { useNavigate } from "react-router-dom";

interface IOSSafariGateProps {
  children: React.ReactNode;
}

export const IOSSafariGate: React.FC<IOSSafariGateProps> = ({ children }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const [validation, setValidation] = useState<DeviceValidationResult>(checkIsIOSSafari());
  const [copied, setCopied] = useState(false);
  const [devBypass, setDevBypass] = useState<boolean>(() => {
    return localStorage.getItem("BERSEKA_DEV_BYPASS_IOS_GATE") === "true";
  });

  // Re-verify on mount or orientation / visibility change
  useEffect(() => {
    const handleCheck = () => {
      setValidation(checkIsIOSSafari());
    };
    handleCheck();
    window.addEventListener("resize", handleCheck);
    return () => window.removeEventListener("resize", handleCheck);
  }, []);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      showToast.success("Tautan berhasil disalin! Buka di aplikasi Safari pada iPhone Anda.");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      showToast.info("Salin tautan manual dari address bar browser Anda.");
    }
  };

  const handleLogout = () => {
    logout();
    showToast.success("Berhasil keluar.");
    navigate("/login");
  };

  const toggleDevBypass = () => {
    const nextVal = !devBypass;
    setDevBypass(nextVal);
    if (nextVal) {
      localStorage.setItem("BERSEKA_DEV_BYPASS_IOS_GATE", "true");
      showToast.warning("Bypass Mode Pengembang Aktif: Validasi iOS Safari dilewati sementara.");
    } else {
      localStorage.removeItem("BERSEKA_DEV_BYPASS_IOS_GATE");
      showToast.info("Bypass dinonaktifkan.");
    }
  };

  const isDevOrAdmin =
    import.meta.env.DEV ||
    user?.peran === "SUPER_USER" ||
    user?.peran === "DEVELOPER" ||
    user?.peran === "ADMIN_DLH";

  // If valid OR developer bypass is active, render children
  if (validation.isValid || (isDevOrAdmin && devBypass)) {
    return (
      <>
        {isDevOrAdmin && devBypass && !validation.isValid && (
          <div className="bg-amber-500 text-slate-950 px-3 py-1 text-[11px] font-mono font-bold flex items-center justify-between z-50 sticky top-0 shadow-xs">
            <span className="flex items-center gap-1.5 truncate">
              ⚠️ <span>DEV BYPASS: Validasi iOS Safari Non-Aktif</span>
            </span>
            <button
              onClick={toggleDevBypass}
              className="underline cursor-pointer hover:text-white shrink-0 ml-2"
            >
              Aktifkan Gate
            </button>
          </div>
        )}
        {children}
      </>
    );
  }

  // Render strict blocking gate
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 font-sans selection:bg-rose-500 selection:text-white">
      {/* Background Ambience Effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-rose-600/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
      </div>

      {/* Top Header */}
      <div className="relative z-10 max-w-md mx-auto w-full flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <ShieldAlert size={18} />
          </div>
          <div>
            <p className="text-xs font-black text-white tracking-tight">BERSEKA KKN SECURITY</p>
            <p className="text-[10px] text-slate-400 font-mono">Safari iOS Strict Enforcer</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
        >
          <LogOut size={13} />
          <span>Keluar</span>
        </button>
      </div>

      {/* Center Main Card */}
      <div className="relative z-10 max-w-md mx-auto w-full my-auto py-6 space-y-5">
        {/* Big Warning Icon & Title */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-br from-rose-500/20 to-amber-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-950/50">
            <Smartphone size={32} className="animate-pulse" />
          </div>
          <h1 className="text-xl font-black text-white tracking-tight">
            Akses Khusus iPhone / iPad (Safari)
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
            Modul Mobile Web Mahasiswa KKN memerlukan lingkungan resmi{" "}
            <span className="text-white font-bold">Apple iOS & Safari WebKit</span> untuk verifikasi GPS Geofencing
            dan kamera presensi nyata.
          </p>
        </div>

        {/* Diagnostic Checklist Card */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-4 shadow-xl backdrop-blur-md space-y-3">
          <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
            Hasil Pengecekan Lingkungan Perangkat
          </p>

          <div className="space-y-2 text-xs">
            {/* Check 1: iOS Hardware */}
            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800/60">
              <div className="flex items-center gap-2.5 min-w-0">
                <Smartphone size={16} className={validation.isIOS ? "text-emerald-400" : "text-rose-400"} />
                <div className="min-w-0">
                  <p className="font-bold text-slate-200 truncate">Sistem Operasi Apple iOS</p>
                  <p className="text-[10px] text-slate-500 font-mono truncate">{validation.detectedOS}</p>
                </div>
              </div>
              {validation.isIOS ? (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 shrink-0">
                  <CheckCircle2 size={14} /> Sesuai
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-bold text-rose-400 shrink-0">
                  <XCircle size={14} /> Ditolak
                </span>
              )}
            </div>

            {/* Check 2: Genuine Safari Browser */}
            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800/60">
              <div className="flex items-center gap-2.5 min-w-0">
                <Compass size={16} className={validation.isSafari ? "text-emerald-400" : "text-rose-400"} />
                <div className="min-w-0">
                  <p className="font-bold text-slate-200 truncate">Peramban Apple Safari</p>
                  <p className="text-[10px] text-slate-500 font-mono truncate">{validation.detectedBrowser}</p>
                </div>
              </div>
              {validation.isSafari ? (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 shrink-0">
                  <CheckCircle2 size={14} /> Sesuai
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-bold text-rose-400 shrink-0">
                  <XCircle size={14} /> Ditolak
                </span>
              )}
            </div>
          </div>

          {/* Detailed Reason Explanation */}
          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            {validation.reason === "NOT_IOS" && (
              <p className="text-rose-300/90 leading-snug">
                ⛔ Anda mengakses portal dari perangkat desktop / Android. Buka tautan ini pada perangkat{" "}
                <span className="font-bold text-white">iPhone / iPad</span> Anda.
              </p>
            )}
            {validation.reason === "IN_APP_BROWSER" && (
              <p className="text-amber-300/90 leading-snug">
                ⚠️ Anda membuka tautan dari peramban dalam aplikasi (Instagram / Line / WA). Tekan tombol menu titik tiga (•••) lalu pilih <span className="font-bold text-white">"Buka di Safari"</span>.
              </p>
            )}
            {validation.reason === "NOT_SAFARI" && (
              <p className="text-rose-300/90 leading-snug">
                ⛔ Anda menggunakan peramban pihak ketiga (Chrome / Firefox / Edge). Gunakan peramban resmi bawaan Apple: <span className="font-bold text-white">Safari</span>.
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          <button
            onClick={handleCopyLink}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
          >
            {copied ? (
              <>
                <Check size={16} />
                <span>Tautan Disalin! Buka di Safari</span>
              </>
            ) : (
              <>
                <Copy size={16} />
                <span>Salin Tautan Portal KKN</span>
              </>
            )}
          </button>

          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw size={14} />
            <span>Cek Ulang Lingkungan Perangkat</span>
          </button>
        </div>

        {/* Developer Bypass Option (Dev / Admin Only) */}
        {isDevOrAdmin && (
          <div className="pt-2 border-t border-slate-800/80 text-center">
            <button
              onClick={toggleDevBypass}
              className="inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
            >
              <Code2 size={13} />
              <span>Bypass Validasi (Mode Pengembang / Admin)</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Footer Note */}
      <div className="relative z-10 max-w-md mx-auto w-full text-center pb-2">
        <p className="text-[10px] text-slate-400 font-mono">
          BERSEKA Intelligent Waste &amp; KKN Field Ecosystem © 2026 PT Makerindo
        </p>
      </div>
    </div>
  );
};

export default IOSSafariGate;
