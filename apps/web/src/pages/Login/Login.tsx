import { Server, WifiOff, Lock, EyeOff, Eye, AlertCircle, AlertTriangle, X, CheckCircle2, RefreshCcw, Info, Phone, LogIn } from "lucide-react";
/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */

import React, { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/useAuthStore";

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

  // Real-time Validation handlers
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
        <div className={`${t.visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-2 scale-95"} transform transition-all duration-300 max-w-sm w-full bg-white shadow-xl rounded-xl pointer-events-auto flex border border-outline-variant/30 p-4 gap-3 items-center`}>
          <div className="flex-shrink-0 flex items-center">
            {type === "error" && <AlertCircle className="text-red-500" size={24} />}
            {type === "warning" && <AlertTriangle className="text-amber-500" size={24} />}
            {type === "server" && <Server className="text-red-500 animate-pulse" size={24} />}
            {type === "network" && <WifiOff className="text-red-500 animate-pulse" size={24} />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-800 leading-normal">{message}</p>
            {retryAction && (
              <button type="button" onClick={() => { toast.dismiss(t.id); retryAction(); }} className="mt-2 text-[10px] text-primary hover:text-primary-dark font-bold underline cursor-pointer">Coba Lagi</button>
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
        setTimeout(() => navigate("/"), 1500);
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
          showToast("Akun Anda belum disetujui oleh pengurus RW setempat. Silakan hubungi pengurus RW.", "warning");
          setIdentifierError("Akun belum disetujui RW setempat");
        } else if (storeErr === "SERVICE_UNAVAILABLE") {
          showToast("Server sedang bermasalah, silakan coba lagi dalam beberapa saat", "server", handleSubmit);
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-6 relative overflow-hidden">
      {showSuccessOverlay && (
        <div className="fixed inset-0 bg-gradient-to-br from-green-600 to-emerald-800 flex flex-col items-center justify-center z-50 transition-all duration-500 animate-in fade-in">
          <div className="flex flex-col items-center gap-6 text-center text-white px-6">
            <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center animate-bounce shadow-lg border border-white/30">
              <CheckCircle2 className="text-white" size={64} />
            </div>
            <div>
              <h2 className="text-[28px] font-bold tracking-tight mb-2">Login Berhasil!</h2>
              <p className="text-sm text-green-100 max-w-sm mx-auto leading-relaxed">
                Menghubungkan sesi Anda dengan aman. Mempersiapkan dashboard analisis sampah...
              </p>
            </div>
            <div className="flex items-center gap-2 mt-4 text-xs font-semibold text-green-200">
              <RefreshCcw className="animate-spin text-lg" />
              <span>Memuat Halaman...</span>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-xl border border-outline-variant/30 overflow-hidden flex flex-col p-8 gap-6 z-10 transition-all duration-300">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="relative group flex items-center justify-center p-3 rounded-2xl bg-gradient-to-b from-emerald-50/50 to-white/80 border border-emerald-100/50 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.02]">
            <img
              src="/logo.png"
              alt="TrashCare Logo"
              className="h-24 w-auto object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">TrashCare</h1>
            <p className="text-[12px] text-on-surface-variant max-w-xs leading-relaxed font-medium mt-0.5">
              Sistem Pemilahan & Pengelolaan Sampah Cerdas
            </p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-[11px] text-slate-700 leading-relaxed shadow-sm">
          <div className="flex items-center justify-between mb-3 border-b border-slate-200/60 pb-2">
            <p className="font-bold flex items-center gap-1.5 text-slate-800">
              <Info className="text-primary" size={16} />
              Pilih Akun Demo 
            </p>
            <span className="bg-slate-200/70 text-slate-700 font-mono px-1.5 py-0.5 rounded text-[9px]">
              pass: password123
            </span>
          </div>
          <div className="flex flex-col gap-1.5 max-h-[180px] overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
            {[
              { phone: "08111111111", label: "Super Admin", bg: "bg-red-50 text-red-700 border-red-200" },
              { phone: "08111111112", label: "Admin DLH", bg: "bg-blue-50 text-blue-700 border-blue-200" },
              { phone: "08111111113", label: "Camat Coblong", bg: "bg-indigo-50 text-indigo-700 border-indigo-200" },
              { phone: "08111111114", label: "Lurah Dago", bg: "bg-cyan-50 text-cyan-700 border-cyan-200" },
              { phone: "08111111115", label: "RW 06 Dago", bg: "bg-purple-50 text-purple-700 border-purple-200" },
              { phone: "08111111116", label: "RT 01 Dago", bg: "bg-amber-50 text-amber-700 border-amber-200" },
              { phone: "08111111117", label: "Petugas Residu", bg: "bg-orange-50 text-orange-700 border-orange-200" },
              { phone: "08111111118", label: "Mahasiswa KKN", bg: "bg-teal-50 text-teal-700 border-teal-200" },
              { phone: "0812001001", label: "Warga", bg: "bg-green-50 text-green-700 border-green-200" },
            ].map((acc) => (
              <button
                key={acc.phone}
                type="button"
                onClick={() => {
                  setIdentifier(acc.phone);
                  setPassword("password123");
                  setIdentifierError("");
                  setPasswordError("");
                  toast.success(`Mengisi kredensial ${acc.label}`, { id: "autofill-toast", duration: 1500 });
                }}
                className="w-full flex items-center justify-between p-2 rounded-lg border border-slate-200/60 bg-white hover:bg-slate-50 transition-all cursor-pointer text-left"
              >
                <span className={`px-2 py-0.5 text-[9px] font-bold rounded border ${acc.bg}`}>{acc.label}</span>
                <span className="text-[10px] font-mono text-slate-500">{acc.phone}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              Nomor HP
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={20} />
              <input
                className={`w-full pl-10 pr-4 h-11 bg-surface-container-low border ${identifierError ? "border-red-500 focus:ring-red-500" : "border-outline-variant/50 focus:border-primary"} rounded-lg text-sm focus:ring-1 outline-none`}
                placeholder="08..."
                type="text"
                value={identifier}
                onChange={(e) => { setIdentifier(e.target.value); if(e.target.value.trim()) setIdentifierError(""); }}
                onBlur={handleIdentifierBlur}
                disabled={isStoreLoading || isLocalLoading}
              />
            </div>
            {identifierError && <p className="text-[10px] text-red-500 font-bold mt-1 flex items-center gap-0.5"><AlertTriangle size={12}/>{identifierError}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Kata Sandi</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={20} />
              <input
                ref={passwordInputRef}
                className={`w-full pl-10 pr-10 h-11 bg-surface-container-low border ${passwordError ? "border-red-500 focus:ring-red-500" : "border-outline-variant/50 focus:border-primary"} rounded-lg text-sm focus:ring-1 outline-none`}
                placeholder="Masukkan kata sandi..."
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); if(e.target.value.trim()) setPasswordError(""); }}
                onBlur={handlePasswordBlur}
                disabled={isStoreLoading || isLocalLoading}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary" disabled={isStoreLoading || isLocalLoading}>
                {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
              </button>
            </div>
            {passwordError && <p className="text-[10px] text-red-500 font-bold mt-1 flex items-center gap-0.5"><AlertTriangle size={12}/>{passwordError}</p>}
          </div>

          <button
            type="submit"
            disabled={isBtnDisabled}
            className="w-full h-11 bg-primary text-white text-sm font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-primary/95 transition-all shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 mt-2"
          >
            {isLocalLoading || isStoreLoading ? (
              <><RefreshCcw className="animate-spin" size={14} /><span>Memproses...</span></>
            ) : (
              <><LogIn size={18} /><span>Masuk Sistem</span></>
            )}
          </button>
        </form>

        <div className="text-center text-[11px] text-on-surface-variant mt-2 border-t border-outline-variant/30 pt-4">
          <p className="mb-2">Mahasiswa KKN? <Link to="/register-mahasiswa" className="text-primary font-bold hover:underline">Daftar di sini</Link></p>
          <p>© 2026 TrashCare. Kecamatan Coblong, Kota Bandung.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
