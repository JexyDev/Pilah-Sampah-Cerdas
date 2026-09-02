/**
 * Project: TrashCare Login Page (Modern Clean 2-Column Split Layout & HD Vector Logo)
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */

import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Lock,
  EyeOff,
  Eye,
  AlertTriangle,
  RefreshCcw,
  Phone,
  LogIn,
  Download,
} from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { useThemeStore } from "../../store/useThemeStore";
import showToast from "../../utils/showToast";

// Official High-Resolution BERSEKA Full Logo Asset
const BersekaLogoIcon: React.FC<{ className?: string }> = ({ className = "h-10 sm:h-11 w-auto" }) => (
  <img
    src="/app-logo.png"
    alt="BERSEKA"
    className={`${className} object-contain shrink-0`}
  />
);

// Hanya menerima format nomor telepon Indonesia: 08xxx, 628xxx, +628xxx, 8xxx
// Minimal 9 digit, maksimal 14 digit.
const PHONE_REGEX = /^\+628[0-9]\d{6,11}$/;

function normalizePhone(val: string): string {
  let t = val.trim();
  if (t.includes(".")) return t; // Return DPL NIP as is
  t = t.replace(/[\s\-().]/g, "");
  if (t.startsWith("08")) return "+62" + t.slice(1);
  if (t.startsWith("8")) return "+62" + t;
  if (t.startsWith("628") && !t.startsWith("+")) return "+" + t;
  return t;
}

function isPhoneValid(val: string): boolean {
  const t = val.trim();
  // If it's a DPL NIP (contains dot or starts with 4127)
  if (t.startsWith("4127") || t.includes(".")) {
    return true;
  }
  // Allow NIM
  if (/^\d{6,12}$/.test(t)) {
    return true;
  }
  return PHONE_REGEX.test(normalizePhone(val));
}

// ─── Main Login Component ─────────────────────────────────────────────────────
const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading: isStoreLoading } = useAuthStore();

  // Login State
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // UX State
  const [isLocalLoading, setIsLocalLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Validation States
  const [identifierError, setIdentifierError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Force light mode on login page unconditionally
  useEffect(() => {
    useThemeStore.getState().setInsideMainLayout(false);
    useThemeStore.getState().resetThemeToLight();
  }, []);

  const handleIdentifierBlur = () => {
    const normalized = normalizePhone(identifier);
    if (normalized !== identifier && normalized) setIdentifier(normalized);
    if (!normalized) {
      setIdentifierError("Nomor HP wajib diisi");
    } else if (!isPhoneValid(normalized)) {
      setIdentifierError("Format nomor HP tidak valid (Contoh: 08123456789 atau +628123456789)");
    } else {
      setIdentifierError("");
    }
  };

  const handlePasswordBlur = () => {
    const trimmed = password.trim();
    if (!trimmed) { setPasswordError("Kata sandi wajib diisi"); return; }
    if (trimmed.length < 6) { setPasswordError("Kata sandi salah. Silakan coba lagi."); return; }
    setPasswordError("");
  };

  const isFormInvalid = !identifier.trim() || !password.trim() || !!identifierError || !!passwordError;
  const isBtnDisabled = isStoreLoading || isLocalLoading || isFormInvalid;

  const triggerToast = (message: string, type: "error" | "warning" | "server" | "network" = "error") => {
    if (type === "warning") {
      showToast.warning(message);
    } else {
      showToast.error(message);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isStoreLoading || isLocalLoading) return;

    const idVal = normalizePhone(identifier);
    if (idVal !== identifier) setIdentifier(idVal);
    const passVal = password.trim();
    let hasError = false;

    if (!idVal) {
      setIdentifierError("Nomor HP wajib diisi");
      hasError = true;
    } else if (!isPhoneValid(idVal)) {
      setIdentifierError("Format nomor HP tidak valid (Contoh: 08123456789 atau +628123456789)");
      hasError = true;
    }

    if (!passVal) { 
      setPasswordError("Kata sandi wajib diisi"); 
      hasError = true; 
    } else if (passVal.length < 6) {
      setPasswordError("Kata sandi salah. Silakan coba lagi."); 
      hasError = true; 
    } else { 
      setPasswordError(""); 
    }

    if (hasError) return;

    setIsLocalLoading(true);
    const success = await login(idVal, passVal, rememberMe);
    setIsLocalLoading(false);

    if (success) {
      const user = useAuthStore.getState().user;
      const roleLabelMap: Record<string, string> = {
        DEVELOPER: "Developer",
        SUPER_USER: "Admin",
        ADMIN_DLH: "Admin DLH",
        CAMAT: "Camat",
        LURAH: "Lurah",
        RW: "Pengurus RW",
        RT: "Pengurus RT",
        DPL: "Dosen Pendamping Lapangan (DPL)",
        PEMIMPIN: "Pimpinan",
        PANITIA_TASKFORCE: "Task Force",
        MAHASISWA_KKN: "Mahasiswa KKN",
      };
      const displayRole = user?.peran ? (roleLabelMap[user.peran] || user.peran) : "Pengguna";
      const displayName = user?.name || displayRole;
      
      showToast.success(`Selamat datang kembali, ${displayName}!`);
      navigate("/dasbor");
    } else {
      const storeErr = useAuthStore.getState().error;
      if (storeErr === "USER_NOT_FOUND") {
        setIdentifierError("Nomor HP tidak terdaftar di sistem");
      } else if (storeErr === "WRONG_PASSWORD") {
        setPasswordError("Kata sandi salah. Silakan coba lagi.");
        setPassword("");
        setTimeout(() => passwordInputRef.current?.focus(), 50);
      } else if (storeErr === "ROLE_NOT_ALLOWED_ON_WEB") {
        triggerToast("Akses Web khusus Pengelola, Dosen Pendamping Lapangan (DPL), dan Mahasiswa KKN. Warga dan Petugas Pemilah hanya dapat menggunakan aplikasi seluler.", "warning");
        setIdentifierError("Akses Web ditutup untuk peran ini (Gunakan Aplikasi Seluler)");
      } else if (storeErr === "USER_INACTIVE") {
        triggerToast("Akun Anda belum aktif atau telah dinonaktifkan.", "warning");
      } else if (storeErr === "USER_PENDING_APPROVAL") {
        triggerToast("Akun Anda belum disetujui oleh pengurus RW setempat.", "warning");
        setIdentifierError("Akun belum disetujui RW setempat");
      } else if (storeErr === "SERVICE_UNAVAILABLE") {
        triggerToast("Server sedang bermasalah, silakan coba lagi nanti", "server");
      } else if (storeErr === "TOO_MANY_ATTEMPTS") {
        triggerToast("Terlalu banyak percobaan, silakan coba lagi dalam 1 menit", "warning");
      } else if (storeErr === "NETWORK_ERROR") {
        triggerToast("Tidak dapat terhubung ke server, periksa koneksi internet Anda", "network");
      } else {
        triggerToast("Gagal masuk ke sistem. Silakan coba lagi.", "error");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-slate-50 to-teal-100 p-4 sm:p-8 relative overflow-hidden font-sans">

      {/* Background Decorative Blur Spheres */}
      <div className="absolute top-[-10%] left-[-10%] w-[450px] h-[450px] rounded-full bg-emerald-300/30 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[450px] h-[450px] rounded-full bg-sky-300/30 blur-3xl pointer-events-none"></div>

      {/* Main Split Container Card */}
      <div className="w-full max-w-[1120px] bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden grid grid-cols-1 md:grid-cols-12 z-10 transition-all duration-500 animate-fade-in-up">

        {/* Left Side: Rich Eco Feature Panel (Desktop Eco-Monitoring Showcase) */}
        <div className="hidden md:flex md:col-span-6 bg-gradient-to-br from-[#035941] via-[#024633] to-[#013325] text-white p-8 sm:p-10 flex-col justify-between relative overflow-hidden">
          {/* Background Decorative Animated Element */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-[#58A621]/20 rounded-full blur-3xl pointer-events-none animate-float" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#0468BF]/15 rounded-full blur-3xl pointer-events-none animate-float" style={{ animationDelay: "2s" }} />

          <div className="relative z-10 space-y-6 my-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-extrabold tracking-wide shadow-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-[#58A621] animate-pulse shrink-0"></span>
              <span>Web Monitoring BERSEKA</span>
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl sm:text-4xl font-black leading-tight tracking-tight text-white">
                Bersih, Sehat,<br />Kampung Asri.
              </h2>
              <p className="text-xs text-emerald-100/90 leading-relaxed font-medium">
                Sistem pemantauan dan tata kelola sampah terpadu BERSEKA (Bersih, Sehat, Kampung Asri) dalam kerangka kegiatan KKN Berdampak Universitas Komputer Indonesia dan Pemerintah Kecamatan Coblong.
              </p>
            </div>

            {/* Feature Highlights Showcase List */}
            <div className="pt-4 space-y-3 border-t border-white/15">
              <div className="flex items-start gap-3 text-xs text-emerald-100/90">
                <div className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center shrink-0 text-emerald-300 mt-0.5">
                  <span className="material-symbols-outlined text-sm">analytics</span>
                </div>
                <div>
                  <p className="font-extrabold text-white text-xs">Pemantauan Real-Time</p>
                  <p className="text-[11px] text-emerald-200/80 font-medium">Pemantauan volume sampah organik &amp; anorganik.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs text-emerald-100/90">
                <div className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center shrink-0 text-emerald-300 mt-0.5">
                  <span className="material-symbols-outlined text-sm">stars</span>
                </div>
                <div>
                  <p className="font-extrabold text-white text-xs">Transparansi Audit Poin</p>
                  <p className="text-[11px] text-emerald-200/80 font-medium">Buku besar poin terpisah bagi insentif warga.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs text-emerald-100/90">
                <div className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center shrink-0 text-emerald-300 mt-0.5">
                  <span className="material-symbols-outlined text-sm">handshake</span>
                </div>
                <div>
                  <p className="font-extrabold text-white text-xs">Sinergi Berkelanjutan</p>
                  <p className="text-[11px] text-emerald-200/80 font-medium">Kolaborasi pemerintah daerah, kampus &amp; warga.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 relative z-10 text-[11px] text-emerald-200/80 font-medium">
            © 2026 Universitas Komputer Indonesia. All Rights Reserved.
          </div>
        </div>

        {/* Right Side: Clean Modern Login Form */}
        <div className="col-span-12 md:col-span-6 p-5 sm:p-8 md:p-10 flex flex-col justify-between bg-white space-y-6">

          <div className="space-y-5">

            {/* Header Brand Block */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <Link to="/" className="flex items-center gap-2 group">
                <BersekaLogoIcon className="h-10 sm:h-11 w-auto transition-transform group-hover:scale-105 shrink-0" />
              </Link>

              <Link to="/" className="text-xs font-extrabold text-[#035941] hover:text-[#024633] transition">
                Kembali ke Beranda →
              </Link>
            </div>

            <div className="space-y-2 text-left pt-1">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Masuk ke Akun</h1>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Silakan masukkan nomor HP terdaftar dan kata sandi akun Anda.
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-left">

              {/* Phone Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                  Nomor Telepon
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    id="login-phone"
                    autoFocus
                    className={`w-full pl-10 pr-4 h-12 bg-white text-slate-900 placeholder:text-slate-400 border ${identifierError ? "border-rose-500 focus:ring-rose-500" : "border-slate-200 focus:border-[#035941] focus:ring-2 focus:ring-[#035941]/20"} rounded-xl text-sm font-semibold outline-none transition-all shadow-2xs`}
                    placeholder="08123456789 atau +6281234567890"
                    type="text"
                    value={identifier}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^\d+]/g, "");
                      setIdentifier(val);
                      if (val.trim()) setIdentifierError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.ctrlKey || e.metaKey) return;
                      const allowed = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Enter", "Home", "End"];
                      if (!/^[0-9+]$/.test(e.key) && !allowed.includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onBlur={handleIdentifierBlur}
                    disabled={isStoreLoading || isLocalLoading}
                  />
                </div>

                {identifierError && (
                  <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1 pt-0.5">
                    <AlertTriangle size={11} />
                    {identifierError}
                  </p>
                )}
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                  Kata Sandi
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    id="login-password"
                    ref={passwordInputRef}
                    className={`w-full pl-10 pr-11 h-12 bg-white text-slate-900 placeholder:text-slate-400 border ${passwordError ? "border-rose-500 focus:ring-rose-500" : "border-slate-200 focus:border-[#035941] focus:ring-2 focus:ring-[#035941]/20"} rounded-xl text-sm font-semibold outline-none transition-all shadow-2xs`}
                    placeholder="Masukkan kata sandi akun"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (e.target.value.trim()) setPasswordError(""); }}
                    onBlur={handlePasswordBlur}
                    disabled={isStoreLoading || isLocalLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-slate-200/60 transition cursor-pointer"
                    disabled={isStoreLoading || isLocalLoading}
                    title={showPassword ? "Sembunyikan Kata Sandi" : "Tampilkan Kata Sandi"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {passwordError && (
                  <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1 pt-0.5">
                    <AlertTriangle size={11} />
                    {passwordError}
                  </p>
                )}
              </div>

              {/* Row: Ingat Saya */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={rememberMe}
                    onClick={() => setRememberMe(!rememberMe)}
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${
                      rememberMe
                        ? "bg-[#035941] border-[#035941] text-white shadow-xs"
                        : "bg-white border-slate-300 hover:border-[#035941]"
                    }`}
                  >
                    {rememberMe && (
                      <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                        <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                  <label
                    className="text-xs text-slate-600 font-bold select-none cursor-pointer flex items-center gap-1"
                    onClick={() => setRememberMe(!rememberMe)}
                  >
                    <span>Ingat Saya</span>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                id="login-submit-btn"
                disabled={isBtnDisabled}
                className="w-full h-12 bg-[#035941] hover:bg-[#024633] text-white text-sm font-extrabold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-[#035941]/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 mt-4 cursor-pointer"
              >
                {isLocalLoading || isStoreLoading ? (
                  <><RefreshCcw className="animate-spin" size={16} /><span>Memproses...</span></>
                ) : (
                  <><LogIn size={18} /><span>Masuk</span></>
                )}
              </button>

              {/* Demo / Seeder Quick-Fill Helper */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span>Akun Bawaan Seeder:</span>
                  <span className="text-emerald-700 font-extrabold font-mono text-[10px]">Pass: password123</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIdentifier("08111111111");
                      setPassword("password123");
                      setIdentifierError("");
                      setPasswordError("");
                    }}
                    className="p-2 text-left rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer"
                  >
                    <div className="text-[11px] font-black text-[#005841]">👑 Super Admin</div>
                    <div className="text-[10px] text-slate-600 font-semibold font-mono">08111111111</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIdentifier("081200000010");
                      setPassword("password123");
                      setIdentifierError("");
                      setPasswordError("");
                    }}
                    className="p-2 text-left rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 transition cursor-pointer"
                  >
                    <div className="text-[11px] font-black text-[#0468bf]">🎓 DPL UNIKOM</div>
                    <div className="text-[10px] text-slate-600 font-semibold font-mono">081200000010</div>
                  </button>
                </div>
              </div>
            </form>
          </div>

        </div>

      </div>

      {/* Floating Action Button: Download Aplikasi Seluler APK */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-10 z-50 group flex items-center justify-center pointer-events-auto">
        <div className="relative flex items-center justify-center">
          {/* Outer Animated Ping Ripple Effect */}
          <span className="absolute -inset-1.5 rounded-full bg-[#035941]/30 animate-ping opacity-75 pointer-events-none" />
          
          <Link
            to="/download"
            className="relative w-12 h-12 sm:w-14 sm:h-14 bg-[#035941] hover:bg-[#024633] text-white rounded-full flex items-center justify-center shadow-2xl shadow-[#035941]/40 hover:scale-110 active:scale-95 transition-all duration-300 border-2 border-white/80 cursor-pointer shrink-0"
            aria-label="Unduh Aplikasi Seluler BERSEKA (APK)"
          >
            <Download size={20} className="sm:w-[22px] sm:h-[22px] text-white group-hover:rotate-12 transition-transform" />
            
            {/* Tooltip on Hover */}
            <span className="absolute right-16 top-1/2 -translate-y-1/2 px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-black tracking-wide whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 translate-x-2 transition-all duration-300 shadow-xl border border-slate-800 hidden sm:block">
              Unduh Aplikasi Seluler BERSEKA (APK)
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
