/**
 * Project: TrashCare Login Page (Modern Clean 2-Column Split Layout & HD Vector Logo)
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */

import React, { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Server, WifiOff, Lock, EyeOff, Eye, AlertCircle, AlertTriangle, X, CheckCircle2, RefreshCcw, Phone, LogIn, ShieldCheck, Sparkles, Trash2, Award } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";

// Exact Vector SVG Icon matching the TrashCare logo
const TrashCareLogoIcon: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => (
  <svg viewBox="-6 -8 112 116" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M 25 54 A 31 31 0 1 1 76 34"
      fill="none"
      stroke="#0284c7"
      strokeWidth="7.5"
      strokeLinecap="round"
    />
    <polygon points="76,20 88,36 68,36" fill="#0284c7" />
    <path
      d="M 76 46 A 31 31 0 0 1 25 64"
      fill="none"
      stroke="#16a34a"
      strokeWidth="7.5"
      strokeLinecap="round"
    />
    <rect x="36" y="27" width="28" height="6" rx="2" fill="#0284c7" />
    <path d="M43 27 C43 23 57 23 57 27 Z" fill="#0284c7" />
    <path d="M38 35 L41 68 C41 71 44 73 48 73 L52 73 L48 55 C48 45 58 40 62 35 Z" fill="#0284c7" />
    <path
      d="M 46 68 C 46 47 70 41 70 41 C 70 41 74 61 58 68 C 50 71 46 68 46 68 Z"
      fill="#16a34a"
    />
    <path
      d="M 48 66 Q 58 56 68 43"
      fill="none"
      stroke="#ffffff"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
  </svg>
);

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading: isStoreLoading } = useAuthStore();

  // Login State
  const [identifier, setIdentifier] = useState(""); // Phone
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // UX State
  const [isLocalLoading, setIsLocalLoading] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

  // Validation States
  const [identifierError, setIdentifierError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Helper validation regex
  const isPhoneValid = (val: string) => /^(?:\+62|08)\d{8,15}$/.test(val);

  const handleIdentifierBlur = () => {
    const trimmed = identifier.trim();
    if (!trimmed) {
      setIdentifierError("Nomor HP wajib diisi");
    } else if (!isPhoneValid(trimmed)) {
      setIdentifierError("Format nomor HP tidak valid (harus diawali +62 atau 08)");
    } else {
      setIdentifierError("");
    }
  };

  const handlePasswordBlur = () => {
    const trimmed = password.trim();
    if (!trimmed) setPasswordError("Password wajib diisi");
    else if (trimmed.length < 6) setPasswordError("Password minimal 6 karakter");
    else setPasswordError("");
  };
  
  const isFormInvalid = !identifier.trim() || !password.trim() || !!identifierError || !!passwordError;
  const isBtnDisabled = isStoreLoading || isLocalLoading || showSuccessOverlay || isFormInvalid;

  const showToast = (message: string, type: "error" | "warning" | "server" | "network" = "error", retryAction?: () => void) => {
    toast.custom(
      (t) => (
        <div className={`${t.visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-2 scale-95"} transform transition-all duration-300 max-w-sm w-full bg-white shadow-xl rounded-xl pointer-events-auto flex border border-slate-200 p-4 gap-3 items-center`}>
          <div className="flex-shrink-0 flex items-center">
            {type === "error" && <AlertCircle className="text-red-500" size={24} />}
            {type === "warning" && <AlertTriangle className="text-amber-500" size={24} />}
            {type === "server" && <Server className="text-red-500 animate-pulse" size={24} />}
            {type === "network" && <WifiOff className="text-red-500 animate-pulse" size={24} />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-800 leading-normal">{message}</p>
            {retryAction && (
              <button type="button" onClick={() => { toast.dismiss(t.id); retryAction(); }} className="mt-2 text-[10px] text-emerald-600 hover:text-emerald-700 font-bold underline cursor-pointer">Coba Lagi</button>
            )}
          </div>
          <button type="button" onClick={() => toast.dismiss(t.id)} className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors w-6 h-6 rounded-full flex items-center justify-center hover:bg-slate-100 cursor-pointer">
            <X size={16} />
          </button>
        </div>
      ),
      { position: "top-right", duration: type === "server" || type === "network" ? 7000 : 4000 }
    );
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isStoreLoading || isLocalLoading || showSuccessOverlay) return;

    let idVal = identifier.trim();
    if (idVal.startsWith("0")) {
      idVal = "+62" + idVal.slice(1);
    }
    const passVal = password.trim();
    let hasError = false;
    
    if (!idVal) {
      setIdentifierError("Nomor HP wajib diisi");
      hasError = true;
    } else if (!isPhoneValid(idVal)) {
      setIdentifierError("Format nomor HP tidak valid (harus diawali +62 atau 08)");
      hasError = true;
    }
    
    if (!passVal) { setPasswordError("Password wajib diisi"); hasError = true; } 
    else if (passVal.length < 6) { setPasswordError("Password minimal 6 karakter"); hasError = true; }
    
    if (hasError) return;

    setIsLocalLoading(true);
    const startTime = Date.now();
    const success = await login(idVal, passVal);
    
    const elapsedTime = Date.now() - startTime;
    const minDelay = 1000;
    const remainingTime = Math.max(0, minDelay - elapsedTime);

    setTimeout(() => {
      setIsLocalLoading(false);
      if (success) {
        setShowSuccessOverlay(true);
        setTimeout(() => navigate("/dashboard"), 1500);
      } else {
        const storeErr = useAuthStore.getState().error;
        if (storeErr === "USER_NOT_FOUND") {
          setIdentifierError("Nomor HP tidak terdaftar");
        } else if (storeErr === "WRONG_PASSWORD") {
          setPasswordError("Password salah");
          setPassword(""); 
          setTimeout(() => passwordInputRef.current?.focus(), 50);
        } else if (storeErr === "USER_INACTIVE") {
          showToast("Akun Anda belum aktif atau telah dinonaktifkan.", "warning");
        } else if (storeErr === "USER_PENDING_APPROVAL") {
          showToast("Akun Anda belum disetujui oleh pengurus RW setempat.", "warning");
          setIdentifierError("Akun belum disetujui RW setempat");
        } else if (storeErr === "SERVICE_UNAVAILABLE") {
          showToast("Server sedang bermasalah, silakan coba lagi nanti", "server", handleSubmit);
        } else if (storeErr === "TOO_MANY_ATTEMPTS") {
          showToast("Terlalu banyak percobaan, silakan coba lagi dalam 1 menit", "warning");
        } else if (storeErr === "NETWORK_ERROR") {
          showToast("Tidak dapat terhubung ke server, periksa koneksi internet Anda", "network", handleSubmit);
        } else {
          showToast("Gagal masuk ke sistem. Silakan coba lagi.", "error");
        }
      }
    }, remainingTime);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-slate-50 to-teal-100 p-4 sm:p-8 relative overflow-hidden font-sans">
      
      {/* Background Decorative Blur Spheres */}
      <div className="absolute top-[-10%] left-[-10%] w-[450px] h-[450px] rounded-full bg-emerald-300/30 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[450px] h-[450px] rounded-full bg-sky-300/30 blur-3xl pointer-events-none"></div>

      {showSuccessOverlay && (
        <div className="fixed inset-0 bg-gradient-to-br from-emerald-600 to-teal-800 flex flex-col items-center justify-center z-50 transition-all duration-500 animate-in fade-in">
          <div className="flex flex-col items-center gap-6 text-center text-white px-6">
            <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center animate-bounce shadow-lg border border-white/30">
              <CheckCircle2 className="text-white" size={64} />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight mb-2">Login Berhasil!</h2>
              <p className="text-sm text-emerald-100 max-w-sm mx-auto leading-relaxed font-medium">
                Mempersiapkan dashboard pemilahan sampah...
              </p>
            </div>
            <div className="flex items-center gap-2 mt-4 text-xs font-bold text-emerald-200">
              <RefreshCcw className="animate-spin text-lg" />
              <span>Memuat Halaman...</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Split Container Card */}
      <div className="w-full max-w-[880px] bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden grid grid-cols-1 md:grid-cols-12 z-10 transition-all duration-300">
        
        {/* Left Side: Rich Eco Feature Panel (Desktop) */}
        <div className="hidden md:flex md:col-span-5 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white p-8 flex-col justify-between relative overflow-hidden">
          
          <div className="space-y-6 relative z-10">
            {/* Top Active Emerald Brand Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-emerald-200/30 text-white text-xs font-extrabold tracking-wide shadow-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-pulse shrink-0"></span>
              <span>Sistem Pemilahan Sampah Cerdas</span>
            </div>

            <div className="space-y-3 pt-2">
              <h2 className="text-3xl font-black leading-tight tracking-tight text-white">
                Sampah Tertata, Lingkungan Terdata.
              </h2>
              <p className="text-xs text-emerald-100/90 leading-relaxed font-medium">
                Platform monitoring terintegrasi untuk Warga, Mahasiswa KKN, RW, dan Petugas Residu.
              </p>
            </div>

            {/* 3 Key Feature Bullets */}
            <div className="space-y-3 pt-4 text-xs font-semibold">
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                <div className="w-8 h-8 rounded-lg bg-emerald-400/20 flex items-center justify-center shrink-0">
                  <ShieldCheck size={18} className="text-emerald-200" />
                </div>
                <span>Login Aman WhatsApp OTP (+62)</span>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                <div className="w-8 h-8 rounded-lg bg-emerald-400/20 flex items-center justify-center shrink-0">
                  <Trash2 size={18} className="text-emerald-200" />
                </div>
                <span>Maksimal 2 Bin Mandiri (Organik &amp; Anorganik)</span>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                <div className="w-8 h-8 rounded-lg bg-emerald-400/20 flex items-center justify-center shrink-0">
                  <Award size={18} className="text-amber-300" />
                </div>
                <span>Point-Based Ledger Gamification</span>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/15 relative z-10 text-[11px] text-emerald-200/80 font-medium">
            © 2026 UNIKOM. All rights reserved.
          </div>

        </div>

        {/* Right Side: Clean Modern Login Form */}
        <div className="col-span-12 md:col-span-7 p-8 sm:p-10 flex flex-col justify-between bg-white space-y-6">
          
          <div className="space-y-6">
            
            {/* Header Brand Block */}
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-2.5 group">
                <TrashCareLogoIcon className="w-10 h-10 transition-transform group-hover:scale-105" />
                <div className="flex flex-col text-left">
                  <span className="text-xl font-black tracking-tight leading-none">
                    <span className="text-sky-600">Trash</span>
                    <span className="text-emerald-600">Care</span>
                  </span>
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mt-0.5">
                    Pilah Sampah Cerdas
                  </span>
                </div>
              </Link>

              <Link to="/" className="text-xs font-extrabold text-emerald-600 hover:text-emerald-700 transition">
                Kembali ke Beranda →
              </Link>
            </div>

            <div className="space-y-1 text-left pt-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Selamat Datang</h1>
              <p className="text-xs text-slate-500 font-medium">
                Masukkan nomor telepon terdaftar dan kata sandi Anda.
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              
              {/* Phone Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                  Nomor HP
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    className={`w-full pl-10 pr-4 h-12 bg-slate-50 border ${identifierError ? "border-rose-500 focus:ring-rose-500" : "border-slate-200 focus:border-emerald-600"} rounded-xl text-sm font-medium focus:ring-1 outline-none transition-all`}
                    placeholder="08... atau +62..."
                    type="text"
                    value={identifier}
                    onChange={(e) => { setIdentifier(e.target.value); if(e.target.value.trim()) setIdentifierError(""); }}
                    onBlur={handleIdentifierBlur}
                    disabled={isStoreLoading || isLocalLoading}
                  />
                </div>
                {identifierError && <p className="text-[10px] text-rose-500 font-bold mt-1 flex items-center gap-1"><AlertTriangle size={12}/>{identifierError}</p>}
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">Kata Sandi</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    ref={passwordInputRef}
                    className={`w-full pl-10 pr-10 h-12 bg-slate-50 border ${passwordError ? "border-rose-500 focus:ring-rose-500" : "border-slate-200 focus:border-emerald-600"} rounded-xl text-sm font-medium focus:ring-1 outline-none transition-all`}
                    placeholder="Masukkan kata sandi..."
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if(e.target.value.trim()) setPasswordError(""); }}
                    onBlur={handlePasswordBlur}
                    disabled={isStoreLoading || isLocalLoading}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition" disabled={isStoreLoading || isLocalLoading}>
                    {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                  </button>
                </div>
                {passwordError && <p className="text-[10px] text-rose-500 font-bold mt-1 flex items-center gap-1"><AlertTriangle size={12}/>{passwordError}</p>}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isBtnDisabled}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-extrabold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 mt-4 cursor-pointer"
              >
                {isLocalLoading || isStoreLoading ? (
                  <><RefreshCcw className="animate-spin" size={16} /><span>Memproses...</span></>
                ) : (
                  <><LogIn size={18} /><span>Masuk Sistem</span></>
                )}
              </button>
            </form>

          </div>

          {/* Footer Area */}
          <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500 space-y-1">
            <p>
              Belum memiliki akun?{" "}
              <Link to="/register" className="text-emerald-600 font-extrabold hover:underline">
                Daftar Sekarang
              </Link>
            </p>
            <p className="font-medium text-[11px] text-slate-400">© 2026 UNIKOM. All rights reserved.</p>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Login;
