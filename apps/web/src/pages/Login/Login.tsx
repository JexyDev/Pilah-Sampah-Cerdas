/**
 * Project: TrashCare Login Page (BERSEKA.ID Modern Clean 2-Column Responsive Design)
 * Acuan Desain: docs/login-berseka.html & Mockup Resmi BERSEKA.ID
 * Copyright (c) 2026 Universitas Komputer Indonesia & Kecamatan Coblong.
 */

import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Download } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { useThemeStore } from "../../store/useThemeStore";
import showToast from "../../utils/showToast";

// Format nomor telepon Indonesia: 08xxx, 628xxx, +628xxx, 8xxx atau NIM / NIP DPL
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
    const raw = identifier.trim();
    if (!raw) {
      setIdentifierError("Nomor HP wajib diisi.");
      return;
    }
    const normalized = normalizePhone(raw);
    if (!isPhoneValid(normalized)) {
      setIdentifierError("Masukkan nomor HP yang diawali 08, berisi 10–13 angka.");
      return;
    }
    setIdentifierError("");
  };

  const handlePasswordBlur = () => {
    const trimmed = password.trim();
    if (!trimmed) {
      setPasswordError("Kata sandi wajib diisi.");
      return;
    }
    if (trimmed.length < 6) {
      setPasswordError("Kata sandi salah. Silakan coba lagi.");
      return;
    }
    setPasswordError("");
  };

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

    const rawId = identifier.trim();
    let hasError = false;

    if (!rawId) {
      setIdentifierError("Nomor HP wajib diisi.");
      hasError = true;
    } else {
      const normalized = normalizePhone(rawId);
      if (!isPhoneValid(normalized)) {
        setIdentifierError("Masukkan nomor HP yang diawali 08, berisi 10–13 angka.");
        hasError = true;
      }
    }

    const passVal = password.trim();
    if (!passVal) {
      setPasswordError("Kata sandi wajib diisi.");
      hasError = true;
    } else if (passVal.length < 6) {
      setPasswordError("Kata sandi salah. Silakan coba lagi.");
      hasError = true;
    }

    if (hasError) return;

    const idVal = normalizePhone(rawId);
    if (idVal !== identifier) setIdentifier(idVal);

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
        DPL: "Dosen Pembimbing Lapangan (DPL)",
        MPL: "Mitra Pembimbing Lapangan (MPL)",
        PEMIMPIN: "Pimpinan",
        PIMPINAN: "Pimpinan",
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
      } else if (storeErr === "MAHASISWA_MUST_USE_IOS_SAFARI") {
        triggerToast("Akses Mahasiswa KKN diwajibkan menggunakan perangkat Apple iPhone dengan peramban Safari.", "error");
        setIdentifierError("Khusus iPhone + Safari (Android & Desktop dilarang)");
      } else if (storeErr === "ROLE_NOT_ALLOWED_ON_WEB") {
        triggerToast("Akses Web khusus Pengelola dan Dosen Pembimbing Lapangan (DPL). Warga dan Petugas Pemilah hanya dapat menggunakan aplikasi seluler.", "warning");
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

  const isLoading = isStoreLoading || isLocalLoading;

  return (
    <div className="min-h-screen bg-[#f2f8fd] text-[#0f2142] flex items-center justify-center p-3 sm:p-6 md:p-10 relative overflow-x-hidden font-sans">
      {/* Background Soft Radial Blobs */}
      <div className="fixed w-[60vw] h-[60vw] -left-[25vw] -bottom-[30vw] rounded-full bg-[radial-gradient(closest-side,#dcefff_0%,rgba(220,239,255,0)_100%)] pointer-events-none z-0" />
      <div className="fixed w-[50vw] h-[50vw] -right-[20vw] -top-[25vw] rounded-full bg-[radial-gradient(closest-side,#dcefff_0%,rgba(220,239,255,0)_100%)] pointer-events-none z-0" />

      {/* Main Container Card (53% Left Hero / 47% Right Auth) */}
      <main className="relative z-10 w-full max-w-[1360px] bg-white rounded-[22px] overflow-hidden shadow-[0_30px_70px_-30px_rgba(31,73,125,0.25),0_2px_6px_rgba(31,73,125,0.05)] grid grid-cols-1 lg:grid-cols-[53fr_47fr] animate-fade-in-up">
        
        {/* ===== Panel Kiri: Hero Ilustrasi ===== */}
        <section aria-label="Tentang BERSEKA" className="relative flex flex-col justify-between overflow-hidden min-h-[420px] lg:min-h-[640px] bg-[#dceefc]">
          {/* Full Cover Background Image */}
          <picture className="absolute inset-0 w-full h-full">
            <source srcSet="/image/ilustrasi-kkn.webp" type="image/webp" />
            <img
              src="/image/ilustrasi-kkn.jpg"
              alt="Bersih, Sehat, Kampung Asri. Bersama membangun lingkungan yang lebih bersih melalui BERSEKA. KKN Berdampak UNIKOM - Kecamatan Coblong"
              className="w-full h-full object-cover object-center"
              loading="eager"
              decoding="async"
            />
          </picture>

          {/* Accessible Screen-Reader Description */}
          <div className="sr-only">
            <h2>Bersih, Sehat, Kampung Asri.</h2>
            <p>Bersama membangun lingkungan yang lebih bersih melalui BERSEKA.</p>
            <p>KKN Berdampak UNIKOM - Kecamatan Coblong</p>
          </div>
        </section>

        {/* ===== Panel Kanan: Form Login ===== */}
        <section className="flex flex-col p-6 sm:p-9 md:p-12 lg:p-14 bg-white text-left justify-between">
          
          {/* Header Bar: Logo & Link Beranda (Selaras dengan Landing Page) */}
          <div className="flex items-center justify-between gap-4">
            <Link to="/" aria-label="BERSEKA.ID beranda" className="inline-flex items-center text-[#0f2142] no-underline group">
              <picture>
                <source srcSet="/logos/berseka/berseka-logo-full.webp" type="image/webp" />
                <img
                  src="/logos/berseka/berseka-logo-full.png"
                  alt="BERSEKA.ID"
                  className="h-10 sm:h-11 w-auto max-w-[175px] object-contain transition-transform group-hover:scale-105"
                  width={160}
                  height={42}
                  loading="eager"
                  decoding="async"
                />
              </picture>
            </Link>

            <Link to="/" className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#16894f] hover:underline hover:underline-offset-4 transition-all">
              <span><span className="hidden sm:inline">Kembali ke </span>Beranda</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
                <path d="M7 17 17 7M8 7h9v9"/>
              </svg>
            </Link>
          </div>

          {/* Body: Form Login */}
          <div className="w-full max-w-[560px] mx-auto lg:mx-0 mt-6 sm:mt-8 md:mt-10">
            <h1 className="text-2xl sm:text-3xl md:text-[2.25rem] font-extrabold tracking-[-0.03em] leading-tight text-[#0f2142] m-0">
              Selamat datang kembali
            </h1>
            <p className="mt-2 text-sm sm:text-base text-[#7d8ea6]">
              Masuk untuk mengakses layanan BERSEKA.
            </p>

            <form onSubmit={handleSubmit} noValidate className="mt-6 sm:mt-8 space-y-5">
              
              {/* Field 1: Nomor HP */}
              <div>
                <label htmlFor="phone" className="block font-bold text-sm sm:text-[1.02rem] text-[#0f2142] mb-2">
                  Nomor HP
                </label>
                <div className="relative flex items-center">
                  <svg className="absolute left-4 sm:left-5 w-5 h-5 sm:w-6 sm:h-6 text-[#8796ab] pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/>
                  </svg>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="Contoh: 081234567890"
                    maxLength={15}
                    value={identifier}
                    onChange={(e) => {
                      let val = e.target.value.replace(/[^\d+]/g, '');
                      if (val.startsWith('+62')) val = '0' + val.slice(3);
                      val = val.replace(/\D/g, '');
                      setIdentifier(val);
                      if (val.trim()) setIdentifierError("");
                    }}
                    onBlur={handleIdentifierBlur}
                    disabled={isLoading}
                    className={`w-full h-12 sm:h-14 pl-12 sm:pl-16 pr-4 sm:pr-6 bg-white text-[#0f2142] placeholder-[#8a99ae] text-base font-medium rounded-[11px] border-[1.5px] outline-none transition-all shadow-[0_1px_2px_rgba(15,33,66,0.04)] ${
                      identifierError
                        ? "border-[#c93a3a] focus:ring-4 focus:ring-[#c93a3a]/15"
                        : "border-[#dfe6ee] focus:border-[#138861] focus:ring-4 focus:ring-[#138861]/15"
                    }`}
                  />
                </div>
                {identifierError && (
                  <p className="mt-2 text-xs sm:text-sm font-semibold text-[#c93a3a]">
                    {identifierError}
                  </p>
                )}
              </div>

              {/* Field 2: Kata Sandi */}
              <div>
                <label htmlFor="password" className="block font-bold text-sm sm:text-[1.02rem] text-[#0f2142] mb-2">
                  Kata sandi
                </label>
                <div className="relative flex items-center">
                  <svg className="absolute left-4 sm:left-5 w-5 h-5 sm:w-6 sm:h-6 text-[#8796ab] pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="4.5" y="10.5" width="15" height="11" rx="2.5"/>
                    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>
                  </svg>
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
                    }}
                    onBlur={handlePasswordBlur}
                    disabled={isLoading}
                    className={`w-full h-12 sm:h-14 pl-12 sm:pl-16 pr-12 sm:pr-14 bg-white text-[#0f2142] placeholder-[#8a99ae] text-base font-medium rounded-[11px] border-[1.5px] outline-none transition-all shadow-[0_1px_2px_rgba(15,33,66,0.04)] ${
                      passwordError
                        ? "border-[#c93a3a] focus:ring-4 focus:ring-[#c93a3a]/15"
                        : "border-[#dfe6ee] focus:border-[#138861] focus:ring-4 focus:ring-[#138861]/15"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 sm:right-4 w-9 h-9 flex items-center justify-center text-[#5d6f88] hover:bg-[#f1f5f9] rounded-lg transition-colors cursor-pointer"
                    aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-6 sm:h-6">
                        <path d="M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-2.6 3.6M6.6 6.6A17.4 17.4 0 0 0 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6"/>
                        <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-6 sm:h-6">
                        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
                {passwordError && (
                  <p className="mt-2 text-xs sm:text-sm font-semibold text-[#c93a3a]">
                    {passwordError}
                  </p>
                )}
              </div>

              {/* Checkbox: Ingat Saya */}
              <div className="pt-1">
                <label className="inline-flex items-center gap-3 cursor-pointer select-none font-semibold text-sm sm:text-base text-[#0f2142]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only"
                  />
                  <span className={`w-6 h-6 rounded-md border-[1.5px] flex items-center justify-center transition-all ${
                    rememberMe ? "bg-[#138861] border-[#138861]" : "border-[#dfe6ee] bg-white hover:border-[#138861]"
                  }`}>
                    {rememberMe && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-white">
                        <path d="m5 12.5 4.5 4.5L19 7.5"/>
                      </svg>
                    )}
                  </span>
                  <span>Ingat saya</span>
                </label>
              </div>

              {/* Tombol Submit */}
              <button
                type="submit"
                id="submitBtn"
                disabled={isLoading}
                className="w-full h-12 sm:h-14 flex items-center justify-center gap-3 font-bold text-base sm:text-lg text-white bg-[#138861] hover:bg-[#0e6e4e] rounded-[11px] border-0 cursor-pointer shadow-[0_10px_22px_-12px_rgba(19,136,97,0.75)] active:translate-y-px transition-all disabled:opacity-75 disabled:cursor-wait"
              >
                {isLoading ? (
                  <>
                    <span className="w-5 h-5 rounded-full border-3 border-white/40 border-t-white animate-spin" aria-hidden="true" />
                    <span>Memproses…</span>
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6" aria-hidden="true">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                      <path d="M10 17l5-5-5-5"/>
                      <path d="M15 12H3"/>
                    </svg>
                    <span>Masuk</span>
                  </>
                )}
              </button>
            </form>

            {/* Warning Notice Box: Khusus Mahasiswa KKN */}
            <aside role="note" className="flex gap-4 mt-6 p-4 sm:p-5 bg-[#fff8e9] border border-[#f6e4b8] rounded-xl text-left">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 text-[#e48d02] mt-0.5" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 11v6"/>
                <circle cx="12" cy="7.5" r=".6" fill="currentColor"/>
              </svg>
              <div className="space-y-1">
                <div className="flex items-center flex-wrap gap-2 sm:gap-4">
                  <strong className="text-sm sm:text-base font-bold text-[#0f2142]">Khusus Mahasiswa KKN</strong>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fde8b6] text-[#d07c00] text-xs font-semibold">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5" aria-hidden="true">
                      <path d="M16.4 12.7c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9 0 0-2.7-1-2.7-4.1ZM13.9 5c.7-.9 1.2-2 1-3.2-1 0-2.3.7-3 1.6-.7.8-1.2 2-1.1 3.1 1.2.1 2.3-.6 3.1-1.5Z"/>
                    </svg>
                    iPhone · Safari
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#2f4260] leading-relaxed m-0">
                  Presensi dan logbook hanya dapat diakses melalui <b className="text-[#0f2142] font-bold">Safari</b> di <b className="text-[#0f2142] font-bold">Apple iPhone</b>. Akses Android dan peramban lain dibatasi.
                </p>
              </div>
            </aside>
          </div>

          {/* Footer Card */}
          <footer className="mt-8 pt-4 w-full max-w-[560px] mx-auto lg:mx-0">
            <p className="m-0 pt-3 border-t border-[#e7ecf2] text-center text-xs sm:text-sm text-[#7d8ea6]">
              © 2026 Universitas Komputer Indonesia
            </p>
          </footer>
        </section>

      </main>

      {/* Floating Action Button: Download Aplikasi Seluler APK */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-8 z-50 group flex items-center justify-center pointer-events-auto">
        <div className="relative flex items-center justify-center">
          <span className="absolute -inset-1.5 rounded-full bg-[#138861]/30 animate-ping opacity-75 pointer-events-none" />
          <Link
            to="/download"
            className="relative w-12 h-12 sm:w-14 sm:h-14 bg-[#138861] hover:bg-[#0e6e4e] text-white rounded-full flex items-center justify-center shadow-2xl shadow-[#138861]/40 hover:scale-110 active:scale-95 transition-all duration-300 border-2 border-white/80 cursor-pointer shrink-0"
            aria-label="Unduh Aplikasi Seluler BERSEKA (APK)"
          >
            <Download size={20} className="sm:w-[22px] sm:h-[22px] text-white group-hover:rotate-12 transition-transform" />
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
