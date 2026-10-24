/**
 * Project: TrashCare Mobile APK Download Page (Real-Time Synchronized Light Theme)
 * Developed by: PT Makerindo & Universitas Komputer Indonesia
 * Copyright (c) 2026 TrashCare. All rights reserved.
 */

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Download,
  Smartphone,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Users,
  GraduationCap,
  Truck,
  ArrowLeft,
  FileCheck,
  Settings,
  DownloadCloud,
  RefreshCcw,
  Clock,
  HardDrive,
  MapPin,
  Mail,
  MessageCircle,
} from "lucide-react";
import ImageTigaRoleMobile from "../../assets/images/image_tiga_role_mobile.webp";
import { useThemeStore } from "../../store/useThemeStore";
import { useAuthStore } from "../../store/useAuthStore";
import api from "../../services/api";
import "../LandingPage/LandingPage.css";

interface ReleaseInfo {
  version: string;
  buildNumber: number;
  releaseNotes: string;
  apkUrl: string;
  fileSizeBytes: number;
  formattedSize: string;
  publishedAt: string;
  publisher: string;
  minAndroidVersion: string;
}

const DownloadPage: React.FC = () => {
  // Force clean light mode on Download Page unconditionally
  useEffect(() => {
    useThemeStore.getState().setInsideMainLayout(false);
    useThemeStore.getState().resetThemeToLight();
  }, []);

  const user = useAuthStore((s) => s.user);
  const isAuthenticated = Boolean(user && user.id);
  const userDisplayName = user?.namaLengkap || user?.name || user?.username || "";

  const [isScrolled, setIsScrolled] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isBantuanOpen, setIsBantuanOpen] = useState(false);
  const [showTopBtn, setShowTopBtn] = useState(false);

  const [release, setRelease] = useState<ReleaseInfo>({
    version: "1.0.6",
    buildNumber: 106,
    releaseNotes: "Fitur Real-Time Polling 10-Detik dan Visual Overhaul",
    apkUrl: "/api/v1/system/download-apk",
    fileSizeBytes: 26004512,
    formattedSize: "24.8 MB",
    publishedAt: new Date().toISOString(),
    publisher: "Developer",
    minAndroidVersion: "Android 7.0 (Nougat)+",
  });

  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>("");

  // Fetch real-time release info from Backend API
  const fetchRealTimeData = async () => {
    try {
      const relRes = await api.get("/system/latest-release").catch(() => null);

      if (relRes?.data?.success && relRes.data.data) {
        setRelease(relRes.data.data);
      }

      setLastUpdatedTime(new Date().toLocaleTimeString("id-ID"));
    } catch (err) {
      console.error("Gagal mengambil data rilis real-time:", err);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    fetchRealTimeData();
    const interval = setInterval(fetchRealTimeData, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 20);
      setShowTopBtn(scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDownloadApk = () => {
    window.location.href = release.apkUrl || "/api/v1/system/download-apk";
  };

  // Format date helper (PUEBI/KBBI standard)
  const formatPublishedDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Terbaru";
    }
  };

  return (
    <div className="landing-root min-h-screen flex flex-col justify-between selection:bg-[#0B7478]/15 selection:text-[#0B7478]">

      {/* Main Content Wrapper */}
      <main className="flex-1 flex flex-col bg-white relative">

        {/* Navigation Header - Khusus Download Page */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3 shadow-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link to="/" className="brand" aria-label="BERSEKA.ID — Beranda">
              <img
                src="/image/landingpage/berseka-icon-1.webp"
                alt="BERSEKA.ID"
                width="34"
                height="34"
                className="w-[32px] h-[32px] sm:w-[34px] sm:h-[34px] object-contain shrink-0"
              />
              <b>
                BERSEKA<i>.ID</i>
              </b>
            </Link>

            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 px-3 sm:px-4 h-9.5 rounded-xl text-slate-700 hover:text-[#0B7478] hover:bg-slate-100 text-xs font-bold transition border border-slate-200/80 sm:border-transparent"
              >
                <ArrowLeft size={15} />
                <span>Beranda</span>
              </Link>
              {isAuthenticated ? (
                <Link
                  to="/dasbor"
                  className="btn-leaf inline-flex items-center gap-2 px-4 h-9.5 rounded-xl bg-[#0B7478] hover:bg-[#075A5D] !text-white text-xs font-extrabold transition shadow-md shadow-[#0B7478]/20"
                  style={{ color: "#ffffff" }}
                >
                  <span className="!text-white" style={{ color: "#ffffff" }}>Dasbor</span>
                  <ArrowRight size={15} className="!text-white" style={{ color: "#ffffff" }} />
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="btn-leaf inline-flex items-center gap-2 px-4 h-9.5 rounded-xl bg-[#0B7478] hover:bg-[#075A5D] !text-white text-xs font-extrabold transition shadow-md shadow-[#0B7478]/20"
                  style={{ color: "#ffffff" }}
                >
                  <span className="!text-white" style={{ color: "#ffffff" }}>Masuk</span>
                  <ArrowRight size={15} className="!text-white" style={{ color: "#ffffff" }} />
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* Hero Section - Clean Light Slate & Teal Ambient Gradient */}
        <section className="relative bg-gradient-to-b from-[#F6F7F2] via-white to-white pt-12 pb-20 px-4 sm:px-8 border-b border-[rgba(22,34,27,0.08)] w-full overflow-hidden">

          {/* Ambient Decorative Blurs */}
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#0B7478]/10 blur-[100px] pointer-events-none" />
          <div className="absolute top-[40%] right-[-10%] w-[450px] h-[450px] rounded-full bg-[#D7F06A]/20 blur-[100px] pointer-events-none" />

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">

            {/* Left Column: Hero Copy & Real-Time Actions */}
            <div className="lg:col-span-7 space-y-6 text-left">

              {/* Real-time Status Badge */}
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#E6F7EE] border border-[#A8E5CC] text-[#0B7478] text-xs font-bold shadow-xs">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5BD08A] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#0B7478]"></span>
                </span>
                <span>Terintegrasi secara waktu nyata dengan API Backend BERSEKA</span>
                <span className="text-[#A8E5CC]">•</span>
                <span className="text-[#0B7478] font-extrabold">v{release.version}</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.12] text-[#16221B]">
                Pemilahan Sampah Lebih Mudah <br />
                <span className="text-[#0B7478]">
                  dalam Genggaman.
                </span>
              </h1>

              <p className="text-sm sm:text-base text-[#55685C] font-normal leading-relaxed max-w-2xl">
                Platform layanan seluler terintegrasi bagi <strong className="text-[#0B7478] font-bold">Warga</strong>, <strong className="text-[#0B7478] font-bold">Mahasiswa</strong>, dan <strong className="text-[#0B7478] font-bold">Petugas Pemilah</strong>.
              </p>

              {/* Primary Download CTA Button & Real-time Metadata */}
              <div className="pt-2 space-y-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    onClick={handleDownloadApk}
                    className="px-8 h-14 bg-[#0B7478] hover:bg-[#075A5D] !text-white font-bold text-base rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 shadow-xl shadow-[#0B7478]/25 hover:scale-[1.02] active:scale-[0.98] cursor-pointer group"
                    style={{ color: "#ffffff" }}
                  >
                    <Download size={22} className="group-hover:translate-y-0.5 transition-transform !text-white" style={{ color: "#ffffff" }} />
                    <span className="!text-white" style={{ color: "#ffffff" }}>Unduh Berkas APK (v{release.version})</span>
                  </button>
                </div>

                {/* Release Metadata Pills */}
                <div className="flex items-center gap-4 text-xs text-[#55685C] font-medium pt-1 flex-wrap">
                  <span className="flex items-center gap-1.5 text-[#0B7478] font-bold">
                    <ShieldCheck size={16} />
                    Versi {release.version} (Build {release.buildNumber})
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  <span className="flex items-center gap-1.5 text-[#55685C]">
                    <Smartphone size={16} className="text-[#0B7478]" />
                    {release.minAndroidVersion || "Android 7.0 atau yang lebih baru"}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  <span className="flex items-center gap-1.5 text-[#16221B] font-bold">
                    <HardDrive size={16} className="text-[#0B7478] shrink-0" />
                    {release.formattedSize}
                  </span>
                </div>

                {/* Real-time Release Notes Alert Box */}
                <div className="bg-white border border-[#DCE3E8] rounded-2xl p-5 shadow-sm space-y-3 text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#E6F7EE] text-[#0B7478] flex items-center justify-center font-bold shrink-0">
                        <Sparkles size={14} />
                      </div>
                      <span className="text-xs font-bold text-[#0B7478] uppercase tracking-wider">
                        Catatan Rilis oleh {release.publisher ? release.publisher.replace(/Super User/gi, "Developer").replace(/\s*\(.*?\)/g, "").trim() : "Developer"}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#7A8F82] font-semibold flex items-center gap-1.5">
                      <Clock size={13} className="text-[#7A8F82]" />
                      {formatPublishedDate(release.publishedAt)}
                    </span>
                  </div>

                  <p className="text-sm text-[#24352B] font-semibold leading-relaxed">
                    "{release.releaseNotes}"
                  </p>

                  {lastUpdatedTime && (
                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-[11px] text-[#7A8F82] font-medium">
                      <span className="flex items-center gap-1.5 text-[#0B7478] font-bold">
                        <RefreshCcw size={12} className="animate-spin" /> Live Sinkronisasi Backend API
                      </span>
                      <span>Tersinkronisasi otomatis pada pukul {lastUpdatedTime} WIB</span>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Right Column: Hero Showcase Card */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="w-full max-w-md bg-white border border-[#DCE3E8] rounded-3xl p-6 shadow-md relative overflow-hidden group space-y-5">
                <div className="absolute top-0 right-0 w-48 h-48 bg-[#0B7478]/10 rounded-full blur-2xl pointer-events-none group-hover:bg-[#0B7478]/15 transition-all" />

                <div className="relative z-10 space-y-4 text-left">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#0B7478] flex items-center gap-2">
                      <Smartphone size={16} /> Akses Layanan Seluler
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-[#E6F7EE] text-[#0B7478] text-[10px] font-bold border border-[#A8E5CC]">
                      Rilis Stabil
                    </span>
                  </div>

                  {/* Mobile Roles Illustration Image */}
                  <div className="w-full bg-[#F6F7F2] rounded-2xl p-4 border border-[rgba(22,34,27,0.06)] flex items-center justify-center">
                    <img
                      src={ImageTigaRoleMobile}
                      alt="Ilustrasi Warga, Mahasiswa, dan Petugas Pemilah"
                      className="w-full h-auto max-h-56 object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>

                  <div className="space-y-3 pt-1 text-left">
                    <p className="text-xs text-[#55685C] font-normal leading-relaxed">
                      Satu aplikasi seluler untuk seluruh pemangku kepentingan pengelolaan sampah di tingkat RW.
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-[11px]">
                      <div className="bg-[#E6F7EE] p-2.5 rounded-xl text-center font-bold text-[#0B7478] border border-[#A8E5CC]/60 flex items-center justify-center gap-1.5">
                        <Users size={13} />
                        <span>Warga</span>
                      </div>
                      <div className="bg-[#E6F7EE] p-2.5 rounded-xl text-center font-bold text-[#0B7478] border border-[#A8E5CC]/60 flex items-center justify-center gap-1.5">
                        <GraduationCap size={13} />
                        <span>Mahasiswa</span>
                      </div>
                      <div className="bg-[#E8F1F5] p-2.5 rounded-xl text-center font-bold text-[#1C5D88] border border-[#B9D7E8]/60 flex items-center justify-center gap-1.5">
                        <Truck size={13} />
                        <span>Petugas Pemilah</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Section 3: 3 Mobile Roles Features Showcase - Subtle Slate Tint */}
        <section id="layanan-mobile" className="py-20 px-4 sm:px-8 bg-[#F6F7F2] border-b border-[rgba(22,34,27,0.08)] w-full">
          <div className="max-w-7xl mx-auto space-y-12 text-center">

            <div className="space-y-3 max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#16221B] tracking-tight">
                Layanan Khusus Tiga Peran Pengguna Seluler
              </h2>
              <p className="text-xs sm:text-sm text-[#55685C] font-normal leading-relaxed">
                Dirancang khusus untuk mendukung partisipasi aktif masyarakat dan kelancaran operasional pengangkutan sampah di lapangan.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">

              {/* Role Card 1: Warga */}
              <div className="bg-white border border-[rgba(22,34,27,0.10)] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs hover:shadow-md hover:border-[#0B7478] transition-all duration-300 hover:-translate-y-1 group">
                <div className="w-12 h-12 rounded-2xl bg-[#E6F7EE] text-[#0B7478] border border-[#A8E5CC] flex items-center justify-center shrink-0">
                  <Users size={24} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-[#16221B] group-hover:text-[#0B7478] transition-colors">
                    Warga
                  </h3>
                  <p className="text-xs text-[#55685C] font-normal leading-relaxed">
                    Pengajuan ide daur ulang kreatif, pencatatan setoran sampah harian, dan akumulasi penukaran insentif poin warga.
                  </p>
                </div>
                <ul className="space-y-2.5 text-xs text-[#24352B] font-medium pt-3 border-t border-slate-100">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-[#0B7478] shrink-0" />
                    <span>Setoran sampah melalui pemindaian Kode QR Tempat Sampah</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-[#0B7478] shrink-0" />
                    <span>Kumpulkan Poin Insentif Warga Terintegrasi</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-[#0B7478] shrink-0" />
                    <span>Apresiasi +50 Poin untuk Pengajuan Ide Daur Ulang</span>
                  </li>
                </ul>
              </div>

              {/* Role Card 2: Mahasiswa KKN */}
              <div className="bg-white border border-[rgba(22,34,27,0.10)] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs hover:shadow-md hover:border-[#0B7478] transition-all duration-300 hover:-translate-y-1 group">
                <div className="w-12 h-12 rounded-2xl bg-[#E6F7EE] text-[#0B7478] border border-[#A8E5CC] flex items-center justify-center shrink-0">
                  <GraduationCap size={24} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-[#16221B] group-hover:text-[#0B7478] transition-colors">
                    Mahasiswa
                  </h3>
                  <p className="text-xs text-[#55685C] font-normal leading-relaxed">
                    Pembimbingan pemilahan sampah warga, verifikasi data lapangan, dan pencatatan presensi kegiatan posko KKN.
                  </p>
                </div>
                <ul className="space-y-2.5 text-xs text-[#24352B] font-medium pt-3 border-t border-slate-100">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-[#0B7478] shrink-0" />
                    <span>Pembimbingan pemetaan dan registrasi warga RW</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-[#0B7478] shrink-0" />
                    <span>Validasi transaksi setoran sampah di lapangan</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-[#0B7478] shrink-0" />
                    <span>Pencatatan presensi dan log kegiatan KKN Berdampak</span>
                  </li>
                </ul>
              </div>

              {/* Role Card 3: Petugas Pemilah */}
              <div className="bg-white border border-[rgba(22,34,27,0.10)] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs hover:shadow-md hover:border-[#0B7478] transition-all duration-300 hover:-translate-y-1 group">
                <div className="w-12 h-12 rounded-2xl bg-[#E8F1F5] text-[#1C5D88] border border-[#B9D7E8] flex items-center justify-center shrink-0">
                  <Truck size={24} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-[#16221B] group-hover:text-[#0B7478] transition-colors">
                    Petugas Pemilah
                  </h3>
                  <p className="text-xs text-[#55685C] font-normal leading-relaxed">
                    Manajemen jadwal penjemputan residu bulanan, pencatatan beban timbangan sampah, dan verifikasi lokasi warga.
                  </p>
                </div>
                <ul className="space-y-2.5 text-xs text-[#24352B] font-medium pt-3 border-t border-slate-100">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-[#0B7478] shrink-0" />
                    <span>Jadwal pengangkutan residu bulanan terstruktur</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-[#0B7478] shrink-0" />
                    <span>Pencatatan beban timbangan dan log penjemputan</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-[#0B7478] shrink-0" />
                    <span>Verifikasi lokasi dan Kode QR Tempat Sampah Warga</span>
                  </li>
                </ul>
              </div>

            </div>

          </div>
        </section>

        {/* Section 4: 4-Step APK Installation Guide Section - Pure White */}
        <section id="panduan-apk" className="py-20 px-4 sm:px-8 bg-white w-full">
          <div className="max-w-7xl mx-auto space-y-12 text-center">

            <div className="space-y-3 max-w-xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#16221B] tracking-tight">
                Panduan Pemasangan Berkas APK (Android)
              </h2>
              <p className="text-xs sm:text-sm text-[#55685C] font-normal leading-relaxed">
                Empat langkah praktis untuk memasang aplikasi BERSEKA di ponsel pintar Android Anda secara aman.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">

              {/* Step 1 */}
              <div className="bg-white border border-[rgba(22,34,27,0.10)] rounded-2xl p-6 space-y-4 shadow-xs relative hover:border-[#0B7478] transition-all">
                <div className="w-8 h-8 rounded-full bg-[#E6F7EE] text-[#0B7478] font-bold text-xs flex items-center justify-center border border-[#A8E5CC]">
                  1
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold text-[#16221B] flex items-center gap-2">
                    <DownloadCloud size={17} className="text-[#0B7478]" />
                    Unduh Berkas Installer APK
                  </h4>
                  <p className="text-xs text-[#55685C] leading-relaxed font-normal">
                    Tekan tombol unduh APK di atas untuk mengunduh berkas resmi <strong className="text-[#16221B] font-bold">BERSEKA.apk</strong>.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-white border border-[rgba(22,34,27,0.10)] rounded-2xl p-6 space-y-4 shadow-xs relative hover:border-[#0B7478] transition-all">
                <div className="w-8 h-8 rounded-full bg-[#E6F7EE] text-[#0B7478] font-bold text-xs flex items-center justify-center border border-[#A8E5CC]">
                  2
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold text-[#16221B] flex items-center gap-2">
                    <Settings size={17} className="text-[#0B7478]" />
                    Akses Pengaturan Perangkat
                  </h4>
                  <p className="text-xs text-[#55685C] leading-relaxed font-normal">
                    Buka menu <strong className="text-[#16221B] font-bold">Pengaturan ➔ Keamanan dan Privasi</strong> pada ponsel pintar Anda.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-white border border-[rgba(22,34,27,0.10)] rounded-2xl p-6 space-y-4 shadow-xs relative hover:border-[#0B7478] transition-all">
                <div className="w-8 h-8 rounded-full bg-[#E6F7EE] text-[#0B7478] font-bold text-xs flex items-center justify-center border border-[#A8E5CC]">
                  3
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold text-[#16221B] flex items-center gap-2">
                    <ShieldCheck size={17} className="text-[#0B7478]" />
                    Aktifkan Izin Sumber Lain
                  </h4>
                  <p className="text-xs text-[#55685C] leading-relaxed font-normal">
                    Aktifkan opsi <strong className="text-[#16221B] font-bold">Izinkan Pemasangan Aplikasi dari Sumber Tidak Dikenal</strong>.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="bg-white border border-[rgba(22,34,27,0.10)] rounded-2xl p-6 space-y-4 shadow-xs relative hover:border-[#0B7478] transition-all">
                <div className="w-8 h-8 rounded-full bg-[#E6F7EE] text-[#0B7478] font-bold text-xs flex items-center justify-center border border-[#A8E5CC]">
                  4
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold text-[#16221B] flex items-center gap-2">
                    <FileCheck size={17} className="text-[#0B7478]" />
                    Pasang dan Jalankan Aplikasi
                  </h4>
                  <p className="text-xs text-[#55685C] leading-relaxed font-normal">
                    Ketuk berkas <strong className="text-[#16221B] font-bold">BERSEKA.apk</strong>, ikuti petunjuk pemasangan hingga selesai.
                  </p>
                </div>
              </div>

            </div>

            {/* Bottom CTA Banner */}
            <div className="pt-8 pb-4">
              <div className="bg-gradient-to-r from-[#0B7478] to-[#075A5D] text-white rounded-3xl p-8 sm:p-10 max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-left shadow-lg border border-[#0B7478]">
                <div className="space-y-1">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white">Siap Mewujudkan Kampung BERSEKA?</h3>
                  <p className="text-xs sm:text-sm text-[#E3FAFA] font-normal">Unduh aplikasinya sekarang dan kumpulkan poin insentif Anda!</p>
                </div>
                <button
                  onClick={handleDownloadApk}
                  className="px-6 h-12 bg-white hover:bg-[#F6F7F2] text-[#0B7478] font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shrink-0 transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95"
                >
                  <Download size={16} />
                  <span>Unduh Aplikasi Mobile (v{release.version})</span>
                </button>
              </div>
            </div>

          </div>
        </section>

      </main>

      {/* ===================== FOOTER ===================== */}
      <footer className="ftr" id="unduh">
        <div className="wrap">
          <div className="ftr__g">
            <div className="ftr__brand">
              <Link className="brand" to="/">
                <img src="/image/landingpage/berseka-icon-26.webp" alt="" width="38" height="38" />
                <b>
                  BERSEKA<i>.ID</i>
                </b>
              </Link>
              <p>
                Platform KKN Tematik untuk pengelolaan sampah terpadu berbasis teknologi dan kolaborasi multipihak untuk mewujudkan kampung lebih bersih, sehat, dan asri.
              </p>
              <div className="soc">
                <a href="https://www.instagram.com/officialberseka.id" target="_blank" rel="noopener noreferrer" aria-label="Instagram BERSEKA">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <path d="M17.5 6.5h.01" />
                  </svg>
                </a>
                <a href="https://www.youtube.com/@adminberseka" target="_blank" rel="noopener noreferrer" aria-label="YouTube BERSEKA">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="2" y="5" width="20" height="14" rx="4" />
                    <path d="m10 9 5 3-5 3Z" />
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h4>Tautan Cepat</h4>
              <ul>
                <li>
                  <Link to="/#beranda">Beranda</Link>
                </li>
                <li>
                  <Link to="/#ekosistem">Ekosistem</Link>
                </li>
                <li>
                  <Link to="/#program">Program</Link>
                </li>
                <li>
                  <Link to="/#pasar">Pasar BERSEKA</Link>
                </li>
                <li>
                  <Link to="/#aisah">AISAh AI</Link>
                </li>
                <li>
                  <Link to="/#berita">Berita</Link>
                </li>
              </ul>
            </div>
            <div>
              <h4>Program</h4>
              <ul>
                <li>
                  <Link to="/#program">Kodifikasi QR</Link>
                </li>
                <li>
                  <Link to="/#program">Gas Metana TPS</Link>
                </li>
                <li>
                  <Link to="/#program">IoT Buruan SAE</Link>
                </li>
                <li>
                  <Link to="/#program">Komposter Pintar</Link>
                </li>
                <li>
                  <Link to="/#program">Timbangan Digital</Link>
                </li>
              </ul>
            </div>
            <div>
              <h4>Bantuan</h4>
              <ul>
                <li>
                  <Link to="/#faq">FAQ</Link>
                </li>
                <li>
                  <Link to="/#kalkulator">Kalkulator BERSEKA</Link>
                </li>
                <li>
                  <Link to="/download">Unduh Aplikasi</Link>
                </li>
              </ul>
            </div>
            <div>
              <h4>CDC UNIKOM</h4>
              <ul>
                <li className="ci">
                  <span className="i">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z" />
                    </svg>
                  </span>
                  <a href="https://wa.me/6285715516065">+62 857-1551-6065</a>
                </li>
                <li className="ci">
                  <span className="i">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="2" y="4" width="20" height="16" rx="3" />
                      <path d="m22 7-10 6L2 7" />
                    </svg>
                  </span>
                  <a href="mailto:cdc@unikom.ac.id">cdc@unikom.ac.id</a>
                </li>
                <li className="ci">
                  <span className="i">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </span>
                  <span>Jl. Dipati Ukur No. 112–116, Lebakgede, Kec. Coblong, Kota Bandung</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="ftr__b">
            <span>© 2026 Universitas Komputer Indonesia. Hak cipta dilindungi.</span>
            <span>Bersih · Sehat · Kampung Asri</span>
          </div>
        </div>
      </footer>

      {/* Back to Top */}
      <button
        className={`top ${showTopBtn ? "show" : ""}`}
        id="top"
        aria-label="Kembali ke atas"
        onClick={scrollToTop}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m18 15-6-6-6 6" />
        </svg>
      </button>

    </div>
  );
};

export default DownloadPage;
