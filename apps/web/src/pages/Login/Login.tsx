/**
 * Project: BERSEKA.ID
 * Page: Halaman Masuk / Login
 * Acuan Desain: apps/web/public/image/loginpage/berseka-login.html
 * 
 * Fitur:
 * - Layout 1 Layar Penuh (100dvh / min-height 540px) Desktop
 * - Brand Colors Resmi BERSEKA: Teal (#04999C / #0B7478) & Sun Yellow (#FFD166)
 * - Auto-format spasi nomor ponsel (0812 3456 7890) untuk seluruh role (termasuk DPL)
 * - Salam dinamis berdasarkan waktu pengguna (Pagi/Siang/Sore/Malam)
 * - Deteksi pintar peramban Safari di perangkat Apple iPhone
 * - Floating Action Button (FAB) unduh APK seluler untuk Petugas & Warga
 * - Proteksi keamanan autentikasi & integrasi Zustand useAuthStore
 */

import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Smartphone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowUpRight,
  Download,
  AlertCircle,
} from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { useThemeStore } from "../../store/useThemeStore";
import { useAppBrandingStore } from "../../store/useAppBrandingStore";
import showToast from "../../utils/showToast";
import LoginKknHero from "./components/LoginKknHero";
import ForgotPasswordModal from "./components/ForgotPasswordModal";
import api from "../../services/api";

const STORE_KEY = "berseka:lastPhone";

// Utility formatting dan normalisasi nomor ponsel serta NIP DPL & NIM
function extractDigits(val: string): string {
  return (val || "").replace(/\D/g, "");
}

// Deteksi apakah input merupakan NIP DPL (awalan 4127 atau mengandung titik) atau NIM / Username
function isDplNipOrNim(val: string): boolean {
  const t = (val || "").trim();
  return t.startsWith("4127") || t.includes(".") || /[a-zA-Z@]/.test(t);
}

function normalizeToIndoPhone(val: string): string {
  let d = extractDigits(val);
  if (d.startsWith("62")) d = "0" + d.slice(2);
  else if (d.startsWith("8")) d = "0" + d;
  return d;
}

function formatPhoneDisplay(val: string): string {
  if (isDplNipOrNim(val)) {
    return val;
  }
  const d = normalizeToIndoPhone(val).slice(0, 14);
  return d.replace(/^(\d{4})(\d{0,4})(\d{0,6}).*/, (_, a, b, c) =>
    [a, b, c].filter(Boolean).join(" ")
  );
}

function toPayloadIdentifier(val: string): string {
  const t = (val || "").trim();
  if (isDplNipOrNim(t)) return t;
  const norm = normalizeToIndoPhone(t);
  if (norm.startsWith("08")) return "+62" + norm.slice(1);
  return norm;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading: isStoreLoading } = useAuthStore();
  const { branding } = useAppBrandingStore();

  // Form State
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // UX State
  const [isLocalLoading, setIsLocalLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isShaking, setIsShaking] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Deteksi Safari di Apple iPhone
  const [safariStatus, setSafariStatus] = useState<"ok" | "warn" | "default">("default");

  // Dynamic Mobile & Web App Release Version State
  const [appVersion, setAppVersion] = useState<string>(() => {
    try {
      return localStorage.getItem("berseka_app_version") || "";
    } catch {
      return "";
    }
  });

  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Ambil nomor tersimpan di localStorage (jika sebelumnya centang Ingat Saya)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORE_KEY);
      if (saved) {
        setPhone(formatPhoneDisplay(saved));
        setRememberMe(true);
      }
    } catch (_e) {}
  }, []);

  // Salam waktu dinamis (Pagi/Siang/Sore/Malam)
  const [greeting, setGreeting] = useState("Selamat datang kembali.");
  useEffect(() => {
    const h = new Date().getHours();
    const salam =
      h < 11
        ? "Selamat pagi"
        : h < 15
        ? "Selamat siang"
        : h < 18
        ? "Selamat sore"
        : "Selamat malam";
    setGreeting(`${salam}. Silakan masuk untuk mengakses sistem BERSEKA.`);
  }, []);

  // Deteksi User-Agent Safari iPhone
  useEffect(() => {
    const ua = navigator.userAgent;
    const isIPhone = /iPhone/.test(ua);
    const isSafari =
      /Safari/.test(ua) &&
      !/CriOS|FxiOS|EdgiOS|OPiOS|GSA|Instagram|FBAN|FBAV|Line\//.test(ua);

    if (isIPhone && isSafari) {
      setSafariStatus("ok");
    } else if (isIPhone) {
      setSafariStatus("warn");
    } else {
      setSafariStatus("default");
    }
  }, []);

  // Sinkronisasi rilis sistem
  useEffect(() => {
    let isMounted = true;
    async function fetchLatestRelease() {
      try {
        const res = await api.get("/system/latest-release");
        const data = res.data?.data || res.data;
        const ver = data?.latestVersion || data?.version;
        if (isMounted && ver) {
          setAppVersion(ver);
          try {
            localStorage.setItem("berseka_app_version", ver);
          } catch {}
        }
      } catch (_err) {}
    }
    fetchLatestRelease();
    return () => {
      isMounted = false;
    };
  }, []);

  // Force Light Theme di Halaman Login
  useEffect(() => {
    useThemeStore.getState().setInsideMainLayout(false);
    useThemeStore.getState().resetThemeToLight();
  }, []);

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const validate = (): boolean => {
    let isValid = true;
    const clean = phone.trim();

    if (!clean) {
      setPhoneError("Nomor ponsel wajib diisi.");
      isValid = false;
    } else if (isDplNipOrNim(clean)) {
      if (clean.length < 4) {
        setPhoneError("Nomor ponsel atau identitas akun terlalu pendek.");
        isValid = false;
      } else {
        setPhoneError("");
      }
    } else {
      const digits = extractDigits(phone);
      const normalized = normalizeToIndoPhone(phone);
      if (!/^08\d{6,12}$/.test(normalized) && !/^\d{6,14}$/.test(digits)) {
        setPhoneError("Format nomor ponsel belum sesuai (contoh: 0812 3456 7890).");
        isValid = false;
      } else {
        setPhoneError("");
      }
    }

    if (!password.trim()) {
      setPasswordError("Kata sandi wajib diisi.");
      isValid = false;
    } else if (password.trim().length < 6) {
      setPasswordError("Kata sandi minimal 6 karakter.");
      isValid = false;
    } else {
      setPasswordError("");
    }

    return isValid;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isStoreLoading || isLocalLoading) return;

    setErrorMessage("");

    if (!validate()) {
      triggerShake();
      return;
    }

    const payloadPhone = toPayloadIdentifier(phone);
    setIsLocalLoading(true);

    const success = await login(payloadPhone, password.trim(), rememberMe);
    setIsLocalLoading(false);

    if (success) {
      try {
        if (rememberMe) {
          localStorage.setItem(STORE_KEY, payloadPhone);
        } else {
          localStorage.removeItem(STORE_KEY);
        }
      } catch (_e) {}

      const user = useAuthStore.getState().user;
      const roleLabelMap: Record<string, string> = {
        DEVELOPER: "Developer",
        SUPER_USER: "Admin",
        ADMIN_DLH: "Admin DLH",
        CAMAT: "Camat",
        LURAH: "Lurah",
        RW: "Pengurus RW",
        RT: "Pengurus RT",
        DPL: "Dosen Pembimbing Lapangan (DPL)",
        MPL: "Mitra Pembimbing Lapangan (MPL)",
        PEMIMPIN: "Pimpinan",
        PIMPINAN: "Pimpinan",
        PANITIA_TASKFORCE: "Task Force",
        MAHASISWA_KKN: "Mahasiswa KKN",
      };
      const displayRole = user?.peran ? roleLabelMap[user.peran] || user.peran : "Pengguna";
      const displayName = user?.name || displayRole;

      showToast.success(`Selamat datang kembali, ${displayName}!`);
      navigate("/dasbor");
    } else {
      triggerShake();
      const storeErr = useAuthStore.getState().error;
      let msg = "Gagal masuk ke sistem. Periksa nomor ponsel dan kata sandi Anda.";

      if (storeErr === "USER_NOT_FOUND") {
        msg = "Nomor ponsel tidak terdaftar di sistem BERSEKA.";
        setPhoneError(msg);
      } else if (storeErr === "WRONG_PASSWORD") {
        msg = "Kata sandi salah. Silakan coba lagi.";
        setPasswordError(msg);
        setPassword("");
        setTimeout(() => passwordInputRef.current?.focus(), 50);
      } else if (storeErr === "MAHASISWA_MUST_USE_IOS_SAFARI") {
        msg = "Mahasiswa KKN wajib menggunakan peramban Safari di perangkat Apple iPhone.";
      } else if (storeErr === "ROLE_NOT_ALLOWED_ON_WEB") {
        msg = "Akses web khusus DPL dan pengelola. Warga dan petugas pemilah silakan gunakan aplikasi seluler (APK).";
      } else if (storeErr === "USER_INACTIVE") {
        msg = "Akun Anda belum aktif atau telah dinonaktifkan oleh administrator.";
      } else if (storeErr === "USER_PENDING_APPROVAL") {
        msg = "Akun Anda masih menunggu verifikasi dan persetujuan pengurus RW.";
      } else if (storeErr === "SERVICE_UNAVAILABLE") {
        msg = "Layanan sedang dalam pemeliharaan. Silakan coba beberapa saat lagi.";
      } else if (storeErr === "TOO_MANY_ATTEMPTS") {
        msg = "Terlalu banyak percobaan masuk yang gagal. Silakan coba lagi dalam 1 menit.";
      } else if (storeErr === "NETWORK_ERROR") {
        msg = "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.";
      }

      setErrorMessage(msg);
    }
  };

  const isLoading = isStoreLoading || isLocalLoading;
  const helpdeskUrl = branding.helpdeskUrl || "https://wa.me/6285715516065";

  return (
    <div className="min-h-screen lg:h-screen lg:min-h-[540px] bg-[#F5F7F8] text-[#0E1B33] flex flex-col font-sans select-none overflow-x-hidden">
      {/* Container Utama 2 Kolom (56fr Panel Kiri : 44fr Panel Kanan di Desktop) */}
      <div className="w-full flex-1 flex flex-col lg:grid lg:grid-cols-[56fr_44fr]">
        
        {/* Panel Kiri: Hero Visual KKN Tematik BERSEKA */}
        <LoginKknHero className="w-full order-1 lg:order-1 h-auto lg:h-full shrink-0" />

        {/* Panel Kanan: Sisi Form Login */}
        <main className="w-full order-2 lg:order-2 h-auto lg:h-full flex flex-col justify-between p-4 sm:p-6 lg:p-10 xl:p-14 overflow-y-auto relative bg-[#F5F7F8] -mt-8 sm:-mt-10 lg:mt-0 z-20">
          
          {/* Header Bar Desktop: Link Kembali ke Beranda */}
          <div className="hidden lg:flex justify-end items-center">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0B7478] hover:text-[#075A5D] transition-colors group"
            >
              <span>Kembali ke beranda</span>
              <ArrowUpRight size={15} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>

          {/* Card Form Login */}
          <div
            className={`w-full max-w-[500px] mx-auto my-auto bg-white p-5 sm:p-8 xl:p-10 rounded-[20px] sm:rounded-[24px] border border-slate-100/80 shadow-[0_40px_80px_-40px_rgba(14,27,51,0.22),0_2px_8px_rgba(14,27,51,0.04)] transition-all ${
              isShaking ? "animate-shake" : ""
            }`}
          >
            <h1 className="text-2xl sm:text-3xl xl:text-[32px] font-extrabold tracking-tight text-[#0E1B33] leading-tight m-0">
              Selamat datang kembali
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-[#5D6B78] leading-relaxed">
              {greeting}
            </p>

            {/* Alert Error Box */}
            {errorMessage && (
              <div
                role="alert"
                className="mt-4 p-3 rounded-xl bg-[#FDECEF] border border-[#F9CAD2] text-[#8E2235] text-xs sm:text-sm flex items-start gap-2.5 animate-fadeIn"
              >
                <AlertCircle size={18} className="shrink-0 mt-0.5 text-[#C8374B]" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="mt-5 sm:mt-6 space-y-4">
              
              {/* Field 1: Nomor Ponsel */}
              <div>
                <label htmlFor="phone" className="block text-xs sm:text-sm font-bold text-[#0E1B33] mb-1.5">
                  Nomor ponsel
                </label>
                <div
                  className={`flex items-center h-12 sm:h-13 px-3.5 rounded-xl border bg-white transition-all ${
                    phoneError
                      ? "border-[#C8374B] ring-4 ring-[#C8374B]/10"
                      : "border-[#DCE3E8] focus-within:border-[#0B7478] focus-within:ring-4 focus-within:ring-[#0B7478]/12"
                  }`}
                >
                  <Smartphone size={19} className="text-[#7C8A96] shrink-0 pointer-events-none" />
                  <input
                    id="phone"
                    name="phone"
                    type="text"
                    inputMode={isDplNipOrNim(phone) ? "text" : "tel"}
                    autoComplete="tel"
                    placeholder="Contoh: 0812 3456 7890"
                    maxLength={32}
                    value={phone}
                    onChange={(e) => {
                      const formatted = formatPhoneDisplay(e.target.value);
                      setPhone(formatted);
                      if (formatted.trim()) setPhoneError("");
                      setErrorMessage("");
                    }}
                    disabled={isLoading}
                    style={{ outline: "none", boxShadow: "none" }} className="w-full h-full pl-3 pr-2 text-sm sm:text-base font-medium text-[#0E1B33] placeholder-[#9AA6B2] bg-transparent outline-none border-0 !outline-none focus:!outline-none focus-visible:!outline-none focus:ring-0 focus-visible:ring-0"
                  />
                </div>
                {phoneError && (
                  <p className="mt-1.5 text-xs font-semibold text-[#C8374B] flex items-center gap-1.5">
                    <AlertCircle size={13} className="shrink-0" />
                    <span>{phoneError}</span>
                  </p>
                )}
              </div>

              {/* Field 2: Kata Sandi */}
              <div>
                <label htmlFor="password" className="block text-xs sm:text-sm font-bold text-[#0E1B33] mb-1.5">
                  Kata sandi
                </label>
                <div
                  className={`flex items-center h-12 sm:h-13 px-3.5 rounded-xl border bg-white transition-all ${
                    passwordError
                      ? "border-[#C8374B] ring-4 ring-[#C8374B]/10"
                      : "border-[#DCE3E8] focus-within:border-[#0B7478] focus-within:ring-4 focus-within:ring-[#0B7478]/12"
                  }`}
                >
                  <Lock size={19} className="text-[#7C8A96] shrink-0 pointer-events-none" />
                  <input
                    id="password"
                    name="password"
                    ref={passwordInputRef}
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Masukkan kata sandi"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (e.target.value.trim()) setPasswordError("");
                      setErrorMessage("");
                    }}
                    disabled={isLoading}
                    style={{ outline: "none", boxShadow: "none" }} className="w-full h-full pl-3 pr-2 text-sm sm:text-base font-medium text-[#0E1B33] placeholder-[#9AA6B2] bg-transparent outline-none border-0 !outline-none focus:!outline-none focus-visible:!outline-none focus:ring-0 focus-visible:ring-0"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1.5 text-[#6A7884] hover:text-[#0E1B33] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
                    aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  >
                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
                {passwordError && (
                  <p className="mt-1.5 text-xs font-semibold text-[#C8374B] flex items-center gap-1.5">
                    <AlertCircle size={13} className="shrink-0" />
                    <span>{passwordError}</span>
                  </p>
                )}
              </div>

              {/* Row: Ingat Saya & Lupa Kata Sandi */}
              <div className="flex items-center justify-between pt-1">
                <label className="inline-flex items-center gap-2.5 cursor-pointer select-none text-[13.5px] sm:text-[14px] font-medium text-[#2A3A4A] py-1">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4.5 h-4.5 rounded-[5px] border-[1.5px] border-[#9AA6B2] text-[#0B7478] focus:ring-[#0B7478] focus:ring-offset-0 cursor-pointer accent-[#0B7478]"
                  />
                  <span>Ingat saya</span>
                </label>

                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="font-bold text-xs sm:text-sm text-[#0B7478] hover:text-[#075A5D] hover:underline cursor-pointer transition-colors"
                >
                  Lupa kata sandi?
                </button>
              </div>

              {/* Tombol Masuk */}
              <button
                type="submit"
                id="submitBtn"
                disabled={isLoading}
                className="w-full h-12 sm:h-13 flex items-center justify-center gap-2 bg-[#0B7478] hover:bg-[#075A5D] active:scale-[0.99] text-white font-bold text-sm sm:text-base rounded-xl shadow-[0_14px_28px_-14px_rgba(8,94,98,0.8)] transition-all cursor-pointer disabled:opacity-75 disabled:cursor-wait group"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-hidden="true" />
                    <span>Memproses…</span>
                  </>
                ) : (
                  <>
                    <span>Masuk</span>
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            {/* Footer Card: Badge Deteksi Safari & Bantuan */}
            <div className="mt-5 flex flex-col items-center gap-2.5 text-center">
              <div
                role="note"
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium leading-snug transition-colors ${
                  safariStatus === "ok"
                    ? "bg-[#E6F7EE] text-[#1B6B41]"
                    : safariStatus === "warn"
                    ? "bg-[#FFF4DC] text-[#6E4A00]"
                    : "bg-[#EAF4FD] text-[#2C4A66]"
                }`}
              >
                <Smartphone size={13} className="shrink-0" />
                <span>
                  {safariStatus === "ok"
                    ? "Perangkat siap untuk presensi dan logbook."
                    : safariStatus === "warn"
                    ? "Gunakan peramban Safari di iPhone untuk presensi dan logbook."
                    : "Presensi dan logbook mahasiswa via peramban Safari di iPhone."}
                </span>
              </div>

              <p className="text-xs text-[#5D6B78] m-0">
                Butuh bantuan?{" "}
                <a
                  href={`${helpdeskUrl}?text=Halo%20tim%20BERSEKA%2C%20saya%20butuh%20bantuan%20login`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-[#0B7478] hover:text-[#075A5D] hover:underline"
                >
                  Hubungi Layanan Bantuan
                </a>
              </p>
            </div>
          </div>

          {/* Footer Page: Hak Cipta & Info Versi */}
          <footer className="text-center text-xs text-[#6A7884] py-3 mt-4">
            <p className="m-0 font-medium">{branding.copyrightText || "© 2026 BERSEKA.ID"}</p>
            {appVersion && (
              <p className="m-0 text-[11px] text-[#9AA6B2] font-semibold mt-0.5">
                Versi {appVersion}
              </p>
            )}
          </footer>
        </main>
      </div>

      {/* Floating Action Button: Unduh Aplikasi Seluler APK (Tetap Dipertahankan) */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-8 z-50 group flex items-center justify-center pointer-events-auto">
        <div className="relative flex items-center justify-center">
          <span className="absolute -inset-1.5 rounded-full bg-[#0B7478]/25 animate-ping opacity-75 pointer-events-none" />
          <Link
            to="/download"
            className="relative w-12 h-12 sm:w-14 sm:h-14 bg-[#0B7478] hover:bg-[#075A5D] text-white rounded-full flex items-center justify-center shadow-2xl shadow-[#0B7478]/40 hover:scale-110 active:scale-95 transition-all duration-300 border-2 border-white/90 cursor-pointer shrink-0"
            aria-label="Unduh Aplikasi Seluler BERSEKA (APK)"
          >
            <Download size={20} className="sm:w-[22px] sm:h-[22px] text-white group-hover:rotate-12 transition-transform" />
            <span className="absolute right-16 top-1/2 -translate-y-1/2 px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-black tracking-wide whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 translate-x-2 transition-all duration-300 shadow-xl border border-slate-800 hidden sm:block">
              Unduh Aplikasi Seluler BERSEKA (APK)
            </span>
          </Link>
        </div>
      </div>

      {/* Modal Lupa Kata Sandi */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        onSuccessReset={(resetPhone) => {
          setPhone(formatPhoneDisplay(resetPhone));
          setShowForgotPassword(false);
          setTimeout(() => {
            passwordInputRef.current?.focus();
          }, 200);
        }}
      />
    </div>
  );
};

export default Login;
