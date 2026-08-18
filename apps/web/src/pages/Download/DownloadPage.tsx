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
} from "lucide-react";
import ImageTigaRoleMobile from "../../assets/images/image_tiga_role_mobile.webp";
import { useThemeStore } from "../../store/useThemeStore";
import api from "../../services/api";

// Official High-Resolution TrashCare Icon Asset (Matches Landing Page & Login Page 1:1)
const TrashCareLogoIcon: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <img
    src="/image/trashcare-icon.png"
    alt="TrashCare Icon"
    className={`${className} object-contain shrink-0`}
  />
);

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

interface LandingStats {
  wargaCount: number;
  totalSampahKg: number;
  kelurahanCount: number;
  totalPenjemputan: number;
  totalPoin: number;
}

const DownloadPage: React.FC = () => {
  // Force clean light mode on Download Page unconditionally
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark");
    root.setAttribute("data-theme", "light");
    root.style.colorScheme = "light";

    return () => {
      // Restore user preference when navigating away
      const currentTheme = useThemeStore.getState().theme;
      if (currentTheme === "dark") {
        root.classList.add("dark");
        root.setAttribute("data-theme", "dark");
        root.style.colorScheme = "dark";
      } else {
        root.classList.remove("dark");
        root.setAttribute("data-theme", "light");
        root.style.colorScheme = "light";
      }
    };
  }, []);

  const [release, setRelease] = useState<ReleaseInfo>({
    version: "1.0.6",
    buildNumber: 106,
    releaseNotes: "Fitur Real-Time Polling 10-Detik & Visual Overhaul",
    apkUrl: "/api/v1/system/download-apk",
    fileSizeBytes: 26004512,
    formattedSize: "24.8 MB",
    publishedAt: new Date().toISOString(),
    publisher: "Developer",
    minAndroidVersion: "Android 7.0 (Nougat)+",
  });

  const [stats, setStats] = useState<LandingStats>({
    wargaCount: 85,
    totalSampahKg: 4056,
    kelurahanCount: 6,
    totalPenjemputan: 468,
    totalPoin: 6987,
  });

  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>("");

  // Fetch real-time release info & landing stats from Backend API
  const fetchRealTimeData = async () => {
    try {
      const [relRes, statsRes] = await Promise.all([
        api.get("/system/latest-release").catch(() => null),
        api.get("/system/landing-stats").catch(() => null),
      ]);

      if (relRes?.data?.success && relRes.data.data) {
        setRelease(relRes.data.data);
      }

      if (statsRes?.data?.success && statsRes.data.data) {
        setStats(statsRes.data.data);
      }

      setLastUpdatedTime(new Date().toLocaleTimeString("id-ID"));
    } catch (err) {
      console.error("Gagal mengambil data rilis real-time:", err);
    }
  };

  useEffect(() => {
    // Reset scroll position to top (y = 0) instantly when DownloadPage mounts
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    fetchRealTimeData();
    // Auto-polling every 10 seconds for real-time synchronization with publish_release.py script
    const interval = setInterval(fetchRealTimeData, 10000);
    return () => clearInterval(interval);
  }, []);

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
    <div className="min-h-screen flex flex-col justify-between bg-white text-slate-900 font-sans relative overflow-x-hidden selection:bg-emerald-500 selection:text-white">

      {/* Main Content Wrapper - Clean White Section Scoping */}
      <main className="flex-1 flex flex-col bg-white relative">

        {/* Navigation Header - Matches Landing Page Navbar Glassmorphism */}
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 shadow-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5 group shrink-0">
              <TrashCareLogoIcon className="w-10 h-10 sm:w-11 sm:h-11 transition-transform group-hover:scale-105 shrink-0" />
              <span className="text-2xl font-black tracking-tight leading-none text-left relative -top-[1px]">
                <span className="text-[#0073E6]">Trash</span>
                <span className="text-[#59B828]">Care</span>
              </span>
            </Link>

            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="hidden sm:inline-flex items-center gap-1.5 px-4 h-9.5 rounded-xl text-slate-700 dark:text-slate-300 hover:text-emerald-700 hover:bg-slate-100 text-xs font-bold transition"
              >
                <ArrowLeft size={15} />
                <span>Beranda</span>
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-4 h-9.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition shadow-md shadow-emerald-600/20"
              >
                <span>Portal Web</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section - Clean Light Slate & Emerald Ambient Gradient */}
        <section className="relative bg-gradient-to-b from-slate-50 via-white to-emerald-50/20 pt-12 pb-20 px-4 sm:px-8 border-b border-slate-200/60 w-full overflow-hidden">
          
          {/* Ambient Decorative Blurs */}
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-400/10 blur-[100px] pointer-events-none" />
          <div className="absolute top-[40%] right-[-10%] w-[450px] h-[450px] rounded-full bg-teal-400/10 blur-[100px] pointer-events-none" />

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">

            {/* Left Column: Hero Copy & Real-Time Actions */}
            <div className="lg:col-span-7 space-y-6 text-left">
              
              {/* Real-time Status Badge */}
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-extrabold shadow-xs">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
                </span>
                <span>Terintegrasi Real-Time API Backend TrashCare</span>
                <span className="text-slate-300">•</span>
                <span className="text-emerald-700 font-bold">v{release.version}</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-slate-900 dark:text-slate-100">
                Pilah Sampah Lebih Mudah <br />
                <span className="text-emerald-700">
                  Dalam Genggaman.
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-medium leading-relaxed max-w-2xl">
                Platform layanan mobile terintegrasi bagi <strong className="text-emerald-700 font-bold">Warga</strong>, <strong className="text-emerald-700 font-bold">Mahasiswa Kuliah Kerja Nyata (KKN) Berdampak</strong>, dan <strong className="text-emerald-700 font-bold">Petugas Residu</strong> di Kecamatan Coblong.
              </p>

              {/* Primary Download CTA Button & Real-time Metadata */}
              <div className="pt-2 space-y-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    onClick={handleDownloadApk}
                    className="px-8 h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 shadow-xl shadow-emerald-600/25 hover:scale-[1.02] active:scale-[0.98] cursor-pointer group"
                  >
                    <Download size={22} className="group-hover:translate-y-0.5 transition-transform" />
                    <span>Unduh Berkas APK (v{release.version})</span>
                  </button>
                </div>

                {/* Release Metadata Pills */}
                <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400 font-medium pt-1 flex-wrap">
                  <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                    <ShieldCheck size={16} />
                    Versi {release.version} (Build {release.buildNumber})
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                    <Smartphone size={16} className="text-sky-600" />
                    {release.minAndroidVersion || "Android 7.0+"}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  <span className="flex items-center gap-1.5 text-slate-900 dark:text-slate-100 font-bold">
                    <HardDrive size={16} className="text-emerald-700 shrink-0" />
                    {release.formattedSize}
                  </span>
                </div>

                {/* Real-time Release Notes Alert Box */}
                <div className="bg-white dark:bg-slate-900 border border-emerald-200/90 rounded-2xl p-5 shadow-sm space-y-3 text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                        <Sparkles size={14} />
                      </div>
                      <span className="text-xs font-black text-emerald-800 uppercase tracking-wider">
                        Catatan Rilis Terbitan {release.publisher ? release.publisher.replace(/Super User/gi, "Developer").replace(/\s*\(.*?\)/g, "").trim() : "Developer"}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1.5">
                      <Clock size={13} className="text-slate-400" />
                      {formatPublishedDate(release.publishedAt)}
                    </span>
                  </div>

                  <p className="text-sm text-slate-800 dark:text-slate-100 font-bold leading-relaxed">
                    "{release.releaseNotes}"
                  </p>

                  {lastUpdatedTime && (
                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 font-medium">
                      <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                        <RefreshCcw size={12} className="animate-spin" /> Live Sinkronisasi Backend API
                      </span>
                      <span>Tersinkronisasi otomatis pada pkl {lastUpdatedTime}</span>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Right Column: Hero Showcase Card */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/90 rounded-3xl p-6 shadow-md relative overflow-hidden group space-y-5">
                <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/20 transition-all" />

                <div className="relative z-10 space-y-4 text-left">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-700 flex items-center gap-2">
                      <Smartphone size={16} /> Akses Layanan Mobile
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold border border-emerald-200">
                      Rilis Stabil
                    </span>
                  </div>

                  {/* Mobile Roles Illustration Image */}
                  <div className="w-full bg-slate-50/80 rounded-2xl p-4 border border-slate-200/60 flex items-center justify-center">
                    <img
                      src={ImageTigaRoleMobile}
                      alt="Ilustrasi Warga, Mahasiswa KKN, dan Petugas Residu"
                      className="w-full h-auto max-h-56 object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>

                  <div className="space-y-3 pt-1 text-left">
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-bold leading-relaxed">
                      Satu aplikasi mobile untuk seluruh partisipan pengelolaan sampah di tingkat RW.
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-[11px]">
                      <div className="bg-emerald-50/80 p-2.5 rounded-xl text-center font-extrabold text-emerald-800 border border-emerald-200/60">
                        🏡 Warga
                      </div>
                      <div className="bg-teal-50/80 p-2.5 rounded-xl text-center font-extrabold text-teal-800 border border-teal-200/60">
                        🎓 Mahasiswa
                      </div>
                      <div className="bg-sky-50/80 p-2.5 rounded-xl text-center font-extrabold text-sky-800 border border-sky-200/60">
                        🚚 Petugas Residu
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Section 2: Real-Time System Statistics Strip - Pure White */}
        <section className="py-12 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-black text-emerald-600">{stats.wargaCount}</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Warga Terdaftar</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-black text-teal-600">{stats.kelurahanCount}</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kelurahan Terintegrasi</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-black text-sky-600">{stats.totalSampahKg.toLocaleString("id-ID")} Kg</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sampah Terdata</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-black text-amber-600">{stats.totalPenjemputan}</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Log Transaksi Residu</p>
            </div>
          </div>
        </section>

        {/* Section 3: 3 Mobile Roles Features Showcase - Subtle Slate Tint */}
        <section id="layanan-mobile" className="py-20 px-4 sm:px-8 bg-slate-50/60 border-b border-slate-200/60 w-full">
          <div className="max-w-7xl mx-auto space-y-12 text-center">

            <div className="space-y-3 max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Layanan Khusus 3 Peran Pengguna Mobile
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                Dirancang khusus untuk mendukung partisipasi aktif masyarakat dan kelancaran operasional pengangkutan sampah di lapangan.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">

              {/* Role Card 1: Warga */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all duration-300 hover:-translate-y-1 group">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center shrink-0">
                  <Users size={24} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 transition-colors">
                    Warga
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                    Pengajuan ide daur ulang kreatif, pencatatan setoran sampah harian, dan akumulasi penukaran insentif poin warga.
                  </p>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 font-semibold pt-3 border-t border-slate-100 dark:border-slate-800">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>Setor sampah via pemindaian QR Code Tempat Sampah</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>Kumpulkan Poin Insentif Warga Terintegrasi</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>Apresiasi +50 Poin untuk Pengajuan Ide Daur Ulang</span>
                  </li>
                </ul>
              </div>

              {/* Role Card 2: Mahasiswa KKN */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs hover:shadow-md hover:border-teal-300 transition-all duration-300 hover:-translate-y-1 group">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 border border-teal-200/60 flex items-center justify-center shrink-0">
                  <GraduationCap size={24} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 group-hover:text-teal-600 transition-colors">
                    Mahasiswa
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                    Pendampingan pemilahan sampah warga, verifikasi data lapangan, dan pencatatan presensi kegiatan posko KKN.
                  </p>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 font-semibold pt-3 border-t border-slate-100 dark:border-slate-800">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-teal-600 shrink-0" />
                    <span>Pendampingan pemetaan &amp; registrasi warga RW</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-teal-600 shrink-0" />
                    <span>Validasi transaksi setoran sampah di lapangan</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-teal-600 shrink-0" />
                    <span>Pencatatan presensi &amp; log kegiatan KKN Berdampak</span>
                  </li>
                </ul>
              </div>

              {/* Role Card 3: Petugas Residu */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs hover:shadow-md hover:border-sky-300 transition-all duration-300 hover:-translate-y-1 group">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 border border-sky-200/60 flex items-center justify-center shrink-0">
                  <Truck size={24} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 group-hover:text-sky-600 transition-colors">
                    Petugas Residu
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                    Manajemen jadwal penjemputan residu bulanan, pencatatan beban timbangan sampah, dan verifikasi lokasi warga.
                  </p>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 font-semibold pt-3 border-t border-slate-100 dark:border-slate-800">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-sky-600 shrink-0" />
                    <span>Jadwal pengangkutan residu bulanan terstruktur</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-sky-600 shrink-0" />
                    <span>Pencatatan beban timbangan &amp; log penjemputan</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-sky-600 shrink-0" />
                    <span>Verifikasi lokasi &amp; QR Tempat Sampah Warga</span>
                  </li>
                </ul>
              </div>

            </div>

          </div>
        </section>

        {/* Section 4: 4-Step APK Installation Guide Section - Pure White */}
        <section id="panduan-apk" className="py-20 px-4 sm:px-8 bg-white dark:bg-slate-900 w-full">
          <div className="max-w-7xl mx-auto space-y-12 text-center">

            <div className="space-y-3 max-w-xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Panduan Pemasangan Berkas APK (Android)
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                4 langkah praktis untuk menginstal aplikasi TrashCare di smartphone Android Anda secara aman.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">

              {/* Step 1 */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 rounded-2xl p-6 space-y-4 shadow-xs relative hover:border-emerald-300 transition-all">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center border border-emerald-200">
                  1
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <DownloadCloud size={17} className="text-emerald-600" />
                    Unduh Berkas Installer APK
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                    Tekan tombol unduh APK di atas untuk mengunduh berkas resmi <strong className="text-slate-900 dark:text-slate-100">TrashCare.apk</strong>.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 rounded-2xl p-6 space-y-4 shadow-xs relative hover:border-emerald-300 transition-all">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center border border-emerald-200">
                  2
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Settings size={17} className="text-emerald-600" />
                    Akses Pengaturan Perangkat
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                    Buka menu <strong className="text-slate-900 dark:text-slate-100">Pengaturan ➔ Keamanan &amp; Privasi</strong> pada smartphone Anda.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 rounded-2xl p-6 space-y-4 shadow-xs relative hover:border-emerald-300 transition-all">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center border border-emerald-200">
                  3
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <ShieldCheck size={17} className="text-emerald-600" />
                    Aktifkan Izin Sumber Lain
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                    Aktifkan opsi <strong className="text-slate-900 dark:text-slate-100">Izinkan Pemasangan Aplikasi dari Sumber Tidak Dikenal</strong>.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 rounded-2xl p-6 space-y-4 shadow-xs relative hover:border-emerald-300 transition-all">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center border border-emerald-200">
                  4
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <FileCheck size={17} className="text-emerald-600" />
                    Pasang &amp; Jalankan Aplikasi
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                    Ketuk berkas <strong className="text-slate-900 dark:text-slate-100">TrashCare.apk</strong>, ikuti petunjuk pemasangan hingga selesai.
                  </p>
                </div>
              </div>

            </div>

            {/* Bottom CTA Banner */}
            <div className="pt-8 pb-4">
              <div className="bg-emerald-800 text-white rounded-2xl p-8 sm:p-10 max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-left shadow-sm border border-emerald-700/50">
                <div className="space-y-1">
                  <h3 className="text-xl font-extrabold text-white">Siap Berpartisipasi dalam Pilah Sampah Cerdas?</h3>
                  <p className="text-xs text-emerald-100 font-medium">Unduh aplikasinya sekarang dan kumpulkan poin insentif Anda!</p>
                </div>
                <button
                  onClick={handleDownloadApk}
                  className="px-6 h-12 bg-white dark:bg-slate-900 hover:bg-slate-100 text-emerald-800 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shrink-0 transition-all shadow-xs cursor-pointer"
                >
                  <Download size={16} />
                  <span>Unduh APK Sekarang (v{release.version})</span>
                </button>
              </div>
            </div>

          </div>
        </section>

      </main>

      {/* ----------------- FOOTER (100% Identical to Landing Page) ----------------- */}
      <footer className="w-full bg-slate-900 text-slate-400 py-16 text-sm border-t border-slate-800 text-left relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-1 md:grid-cols-4 gap-10">
          
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 text-white font-black text-xl">
              <TrashCareLogoIcon className="w-8 h-8 shrink-0" />
              <span className="text-xl font-black tracking-tight leading-normal text-left">
                <span className="text-[#0073E6]">Trash</span>
                <span className="text-[#59B828]">Care</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Sistem Pemilahan dan Pengelolaan Sampah Terintegrasi.
            </p>
            <p className="text-xs text-slate-400 font-semibold">© 2026 Universitas Komputer Indonesia • Sampah Terdata, Lingkungan Tertata</p>
          </div>

          <div>
            <h5 className="text-white font-extrabold text-xs uppercase tracking-wider mb-4">Navigasi</h5>
            <ul className="space-y-2.5 text-xs font-semibold">
              <li><Link to="/" className="hover:text-white transition">Beranda Utama</Link></li>
              <li><Link to="/login" className="hover:text-white transition">Masuk Portal Web</Link></li>
              <li><a href="#layanan-mobile" className="hover:text-white transition">Layanan Mobile</a></li>
              <li><a href="#panduan-apk" className="hover:text-white transition">Panduan Pemasangan APK</a></li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-extrabold text-xs uppercase tracking-wider mb-4">Layanan</h5>
            <ul className="space-y-2.5 text-xs font-semibold">
              <li><Link to="/login" className="hover:text-white transition">Portal Pimpinan</Link></li>
              <li><Link to="/login" className="hover:text-white transition">Portal Dinas Lingkungan Hidup</Link></li>
              <li><Link to="/login" className="hover:text-white transition">Portal Camat</Link></li>
              <li><Link to="/login" className="hover:text-white transition">Portal Lurah</Link></li>
              <li><Link to="/login" className="hover:text-white transition">Portal Rukun Warga</Link></li>
              <li><Link to="/login" className="hover:text-white transition">Portal Dosen Pendamping Lapangan</Link></li>
              <li><Link to="/login" className="hover:text-white transition">Monitoring Data Sampah</Link></li>
              <li><Link to="/login" className="hover:text-white transition">Pendampingan Kuliah Kerja Nyata</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-extrabold text-xs uppercase tracking-wider mb-4">Informasi</h5>
            <ul className="space-y-3 text-xs font-semibold">
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-base text-emerald-400 shrink-0 mt-0.5">location_on</span>
                <span className="text-slate-300 leading-relaxed font-medium">
                  Jl. Dipati Ukur No.112-116, Lebakgede, Kec. Coblong, Kota Bandung 40132
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-base text-sky-400 shrink-0">mail</span>
                <a href="mailto:cdc@unikom.ac.id" className="hover:text-white transition">cdc@unikom.ac.id</a>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-base text-green-400 shrink-0">chat</span>
                <a href="https://wa.me/6285715516065" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">+62 857-1551-6065</a>
              </li>
            </ul>
          </div>

        </div>
      </footer>

    </div>
  );
};

export default DownloadPage;
