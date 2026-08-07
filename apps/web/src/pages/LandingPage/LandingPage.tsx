/**
 * Project: TrashCare Landing Page (Update CTA button text to 'Register / Login')
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { downloadPanduanPdf } from "../../utils/downloadPanduanPdf";
import "./LandingPage.css";

// Exact Vector SVG Icon matching the user's uploaded logo image (Bin + Recycling Arrow + Green Leaf)
const TrashCareLogoIcon: React.FC<{ className?: string }> = ({ className = "w-11 h-11" }) => (
  <svg viewBox="-6 -8 112 116" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Blue Recycling Arrow (Top & Left) */}
    <path
      d="M 25 54 A 31 31 0 1 1 76 34"
      fill="none"
      stroke="#0284c7"
      strokeWidth="7.5"
      strokeLinecap="round"
    />
    <polygon points="76,20 88,36 68,36" fill="#0284c7" />

    {/* Green Recycling Arrow (Bottom & Right) */}
    <path
      d="M 76 46 A 31 31 0 0 1 25 64"
      fill="none"
      stroke="#16a34a"
      strokeWidth="7.5"
      strokeLinecap="round"
    />

    {/* Trash Can Body (Blue) */}
    <rect x="36" y="27" width="28" height="6" rx="2" fill="#0284c7" />
    <path d="M43 27 C43 23 57 23 57 27 Z" fill="#0284c7" />
    <path d="M38 35 L41 68 C41 71 44 73 48 73 L52 73 L48 55 C48 45 58 40 62 35 Z" fill="#0284c7" />

    {/* Green Leaf Overlay (Bottom Right of Bin) */}
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

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const [whyUsTab, setWhyUsTab] = useState<"points" | "bins" | "iot">("points");
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(0);
  const [showContactModal, setShowContactModal] = useState<boolean>(false);
  const [showApkModal, setShowApkModal] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<string>("");

  // Interactive User Guide & Flow state
  const [guideRoleTab, setGuideRoleTab] = useState<"warga" | "kkn" | "rw" | "petugas" | "dlh" | "dpl" | "superUser">("warga");
  const [activeFlowStep, setActiveFlowStep] = useState<number>(1);

  const scrollToSection = (id: string) => {
    const element = document.querySelector(id);
    if (element) {
      window.history.pushState(null, "", id);
      setActiveSection(id);
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.history.pushState(null, "", "/");
    setActiveSection("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // IntersectionObserver to sync URL hash & active menu state on scroll
  useEffect(() => {
    const sections = ["#about", "#why-us", "#faq", "#guide"];

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;

      if (window.scrollY < 200) {
        if (window.location.hash !== "") {
          window.history.replaceState(null, "", window.location.pathname);
          setActiveSection("");
        }
        return;
      }

      for (const sectionId of sections) {
        const el = document.querySelector(sectionId);
        if (el) {
          const top = (el as HTMLElement).offsetTop;
          const height = (el as HTMLElement).offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            if (window.location.hash !== sectionId) {
              window.history.replaceState(null, "", sectionId);
              setActiveSection(sectionId);
            }
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handlePreviewClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate("/login");
  };

  return (
    <div className="landing-page min-h-screen relative selection:bg-emerald-500 selection:text-white">

      {/* ----------------- CENTERED MODERN NAVBAR ----------------- */}
      <nav className="landing-nav py-4">
        <div className="container-custom flex items-center justify-between relative">

          {/* Logo Branding (Left - Icon Shifted Down 4px & Expanded ViewBox No Top Clipping) */}
          <Link
            to="/"
            onClick={handleLogoClick}
            className="flex items-center gap-2.5 group shrink-0"
          >
            <TrashCareLogoIcon className="w-11 h-11 translate-y-[4px] transition-transform group-hover:scale-105 shrink-0" />

            <div className="flex flex-col text-left justify-center">
              <span className="text-2xl font-black tracking-tight leading-none">
                <span className="text-sky-600">Trash</span>
                <span className="text-emerald-600">Care</span>
              </span>
              <span className="text-[10px] font-extrabold text-slate-500 tracking-wider uppercase mt-1 leading-none">
                Pilah Sampah Cerdas
              </span>
            </div>
          </Link>

          {/* Navigation Links (ABSOLUTE PERFECT CENTER BETWEEN LEFT & RIGHT) */}
          <div className="hidden lg:flex items-center justify-center absolute left-1/2 -translate-x-1/2">
            <div className="nav-links-centered">
              <button
                onClick={() => scrollToSection("#about")}
                className={activeSection === "#about" ? "active text-emerald-600 font-extrabold" : ""}
              >
                Tentang Kami
              </button>
              <button
                onClick={() => scrollToSection("#why-us")}
                className={activeSection === "#why-us" ? "active text-emerald-600 font-extrabold" : ""}
              >
                Mengapa Aplikasi Ini
              </button>
              <button
                onClick={() => scrollToSection("#faq")}
                className={activeSection === "#faq" ? "active text-emerald-600 font-extrabold" : ""}
              >
                FAQ
              </button>
              <button
                onClick={() => scrollToSection("#guide")}
                className={activeSection === "#guide" ? "active text-emerald-600 font-extrabold" : ""}
              >
                Buku Panduan
              </button>
            </div>
          </div>

          {/* Action Buttons (Right Side - Updated to 'Register / Login') */}
          <div className="flex items-center gap-3 shrink-0">
            {isAuthenticated ? (
              <button
                onClick={() => navigate("/dashboard")}
                className="btn-primary-clean"
              >
                <span className="material-symbols-outlined text-lg">dashboard</span>
                Ke Dashboard
              </button>
            ) : (
              <Link to="/login" className="btn-primary-clean">
                Daftar / Masuk
              </Link>
            )}

            <button
              onClick={() => setShowContactModal(true)}
              className="btn-secondary-clean hidden sm:inline-flex"
            >
              Hubungi Kami
            </button>
          </div>
        </div>
      </nav>

      {/* ----------------- HERO SECTION ----------------- */}
      <section className="relative pt-12 pb-24 bg-gradient-to-b from-emerald-50/60 via-slate-50/40 to-white overflow-hidden">
        <div className="container-custom grid grid-cols-1 xl:grid-cols-12 gap-10 items-center">

          {/* Hero Left Column: Real Project Copy (xl:col-span-5) */}
          <div className="xl:col-span-5 space-y-7 text-left relative z-10">

            {/* Single Clean High-Impact Badge */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100/90 border border-emerald-300 text-emerald-950 text-xs font-extrabold shadow-2xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                Sistem Pemilahan Sampah Cerdas Berbasis Wilayah
              </div>
            </div>

            {/* Large Spacious Headline */}
            <h1 className="hero-title-main">
              Sampah <span className="text-blue-hero">Terdata</span>,<br />
              Lingkungan <span className="text-green-hero">Tertata</span>
            </h1>

            <p className="text-slate-600 text-base leading-relaxed font-medium">
              Sistem tata kelola sampah terintegrasi dengan kegiatan KKN Berdampak yang menghubungkan warga, petugas residu, mahasiswa, dosen pendamping lapangan (DPL), pimpinan perguruan tinggi, RW, kelurahan, kecamatan, dan Dinas Lingkungan Hidup.
            </p>

            {/* Quick Stat Highlights */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/80 shadow-xs">
              <div>
                <p className="text-xl font-black text-emerald-700">850+</p>
                <p className="text-[10px] text-slate-500 font-bold">Warga Terdaftar</p>
              </div>
              <div>
                <p className="text-xl font-black text-emerald-700">1.850 Kg</p>
                <p className="text-[10px] text-slate-500 font-bold">Total Setoran</p>
              </div>
              <div>
                <p className="text-xl font-black text-emerald-700">100%</p>
                <p className="text-[10px] text-slate-500 font-bold">Verifikasi RW</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                onClick={() => scrollToSection("#why-us")}
                className="btn-primary-clean px-8 py-3.5 text-base cursor-pointer"
              >
                Pelajari Fitur Utama
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </button>

              <button onClick={() => scrollToSection("#guide")} className="btn-secondary-clean px-8 py-3.5 text-base cursor-pointer">
                Buku Panduan Operasional
              </button>
            </div>
          </div>

          {/* Hero Right Column: REAL WEB APP DASHBOARD CARD */}
          <div className="xl:col-span-7 text-left cursor-pointer" onClick={handlePreviewClick}>
            <div className="widescreen-dashboard-card">

              {/* Browser Window Header Bar */}
              <div className="browser-top-bar">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-400"></span>
                  <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                  <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
                  <span className="text-[11px] font-bold text-slate-400 ml-2 hidden sm:inline">Aplikasi Web Pemantauan TrashCare</span>
                </div>
                <div className="px-4 py-0.5 bg-white border border-slate-200 rounded-full text-[10px] text-slate-500 font-semibold flex items-center gap-1.5 shadow-2xs">
                  <span className="material-symbols-outlined text-xs text-emerald-600">lock</span>
                  <span>https://trashcare.id/dashboard</span>
                </div>
                <div className="text-[10px] font-extrabold text-emerald-600 hidden sm:block">PRATINJAU LANGSUNG</div>
              </div>

              {/* Main Dashboard Layout */}
              <div className="p-4 sm:p-6 space-y-4 bg-white">

                {/* Header Greeting Bar */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-black text-slate-900 text-xs sm:text-base flex items-center gap-1.5">
                      Selamat Datang Kembali, Petugas Monitoring
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      Kelola data, pantau aktivitas, dan wujudkan lingkungan yang lebih bersih.
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-xs">
                      <span className="material-symbols-outlined text-base">notifications</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-xs">
                      <span className="material-symbols-outlined text-base">grid_view</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-xs">
                      <span className="material-symbols-outlined text-base">dark_mode</span>
                    </div>
                    <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs font-bold text-slate-800 leading-none">Petugas Monitoring</p>
                        <p className="text-[9px] text-slate-400 font-semibold uppercase">PETUGAS</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shadow-2xs">
                        PM
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sidebar + Main Content Grid */}
                <div className="grid grid-cols-12 gap-4">

                  {/* Left Sidebar */}
                  <div className="col-span-12 sm:col-span-3 space-y-2.5 pr-3 border-r border-slate-100 hidden sm:block text-[10px]">

                    {/* TrashCare Vector Logo Box */}
                    <div className="py-2 px-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                      <TrashCareLogoIcon className="w-7 h-7 shrink-0" />
                      <div className="flex flex-col text-left leading-none">
                        <span className="text-sm font-black tracking-tight">
                          <span className="text-sky-600">Trash</span>
                          <span className="text-emerald-600">Care</span>
                        </span>
                        <span className="text-[8px] font-bold text-slate-400 mt-0.5">MONITORING</span>
                      </div>
                    </div>

                    <div className="space-y-0.5 pt-1">
                      <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider px-1">LAYANAN UTAMA</p>
                      <div className="real-sidebar-nav-item active">
                        <span className="material-symbols-outlined text-base">grid_view</span>
                        Dashboard
                      </div>
                      <div className="real-sidebar-nav-item">
                        <span className="material-symbols-outlined text-base">school</span>
                        Dashboard DPL
                      </div>
                      <div className="real-sidebar-nav-item">
                        <span className="material-symbols-outlined text-base">map</span>
                        Monitoring Wilayah
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider px-1">KEGIATAN KKN</p>
                      <div className="real-sidebar-nav-item">
                        <span className="material-symbols-outlined text-base">equalizer</span>
                        Ringkasan
                      </div>
                      <div className="real-sidebar-nav-item">
                        <span className="material-symbols-outlined text-base">group</span>
                        Kelompok KKN
                      </div>
                      <div className="real-sidebar-nav-item">
                        <span className="material-symbols-outlined text-base">folder_shared</span>
                        Portofolio Mahasiswa
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider px-1">TATA KELOLA</p>
                      <div className="real-sidebar-nav-item">
                        <span className="material-symbols-outlined text-base">checklist</span>
                        Monitoring Pemilahan
                      </div>
                      <div className="real-sidebar-nav-item">
                        <span className="material-symbols-outlined text-base">local_shipping</span>
                        Pengangkutan Sampah
                      </div>
                      <div className="real-sidebar-nav-item">
                        <span className="material-symbols-outlined text-base">recycling</span>
                        Pemanfaatan Sampah
                      </div>
                    </div>

                    <div className="p-2.5 bg-emerald-50/70 rounded-xl text-[10px] text-emerald-800 font-bold border border-emerald-100/80">
                      Bersama memilah sampah, bersama jaga bumi.
                    </div>
                  </div>

                  {/* Main Dashboard Content Area */}
                  <div className="col-span-12 sm:col-span-9 space-y-3.5">

                    {/* Filters Bar (Clean Single Horizontal Row) */}
                    <div className="flex items-center justify-between gap-2 text-[10px] sm:text-xs">
                      <div className="flex items-center gap-2 overflow-x-auto">
                        <div className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg font-bold flex items-center gap-1 shadow-2xs shrink-0 whitespace-nowrap">
                          <span className="material-symbols-outlined text-xs">location_on</span>
                          Wilayah: Semua RT/RW
                          <span className="material-symbols-outlined text-xs">expand_more</span>
                        </div>
                        <div className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg font-bold flex items-center gap-1 shadow-2xs shrink-0 whitespace-nowrap">
                          <span className="material-symbols-outlined text-xs">calendar_today</span>
                          Periode: Semua
                          <span className="material-symbols-outlined text-xs">expand_more</span>
                        </div>
                      </div>

                      <button className="px-2.5 py-1 bg-emerald-700 text-white font-bold rounded-lg text-[10px] sm:text-xs flex items-center gap-1 shadow-2xs hover:bg-emerald-800 transition shrink-0 whitespace-nowrap">
                        <span className="material-symbols-outlined text-xs">verified</span>
                        Indeks Kepatuhan RT/RW
                      </button>
                    </div>

                    {/* 6 Real Metric Cards Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">

                      <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 space-y-0.5">
                        <div className="flex items-center gap-1">
                          <div className="w-5 h-5 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center">
                            <span className="material-symbols-outlined text-xs">group</span>
                          </div>
                          <span className="text-[9px] text-slate-400 font-bold">Total Pengguna</span>
                        </div>
                        <p className="text-base font-black text-slate-900">850</p>
                        <p className="text-[9px] text-emerald-600 font-bold">+12 Warga</p>
                      </div>

                      <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 space-y-0.5">
                        <div className="flex items-center gap-1">
                          <div className="w-5 h-5 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center">
                            <span className="material-symbols-outlined text-xs">delete</span>
                          </div>
                          <span className="text-[9px] text-slate-400 font-bold">Tempat Sampah</span>
                        </div>
                        <p className="text-base font-black text-slate-900">210</p>
                        <span className="inline-block text-[8px] px-1 py-0.2 bg-rose-100 text-rose-700 font-bold rounded">5 Penuh</span>
                      </div>

                      <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 space-y-0.5">
                        <div className="flex items-center gap-1">
                          <div className="w-5 h-5 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center">
                            <span className="material-symbols-outlined text-xs">place</span>
                          </div>
                          <span className="text-[9px] text-slate-400 font-bold">Lokasi</span>
                        </div>
                        <p className="text-base font-black text-slate-900">90</p>
                        <p className="text-[9px] text-emerald-600 font-bold">+2 RW</p>
                      </div>

                      <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 space-y-0.5">
                        <div className="flex items-center gap-1">
                          <div className="w-5 h-5 rounded bg-amber-100 text-amber-600 flex items-center justify-center">
                            <span className="material-symbols-outlined text-xs">shopping_bag</span>
                          </div>
                          <span className="text-[9px] text-slate-400 font-bold">Total Setoran</span>
                        </div>
                        <p className="text-base font-black text-slate-900">1.850 Kg</p>
                        <p className="text-[9px] text-emerald-600 font-bold">↗ 15%</p>
                      </div>

                      <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 space-y-0.5">
                        <div className="flex items-center gap-1">
                          <div className="w-5 h-5 rounded bg-amber-100 text-amber-600 flex items-center justify-center">
                            <span className="material-symbols-outlined text-xs">stars</span>
                          </div>
                          <span className="text-[9px] text-slate-400 font-bold">Total Poin</span>
                        </div>
                        <p className="text-base font-black text-slate-900">35.000</p>
                        <p className="text-[9px] text-emerald-600 font-bold">↗ Poin</p>
                      </div>

                      <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 space-y-0.5">
                        <div className="flex items-center gap-1">
                          <div className="w-5 h-5 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center">
                            <span className="material-symbols-outlined text-xs">calendar_month</span>
                          </div>
                          <span className="text-[9px] text-slate-400 font-bold">Total Jadwal</span>
                        </div>
                        <p className="text-base font-black text-slate-900">4</p>
                        <p className="text-[9px] text-emerald-600 font-bold">2 Hari Ini</p>
                      </div>

                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">

                      {/* Line Chart with Clear X & Y Axes */}
                      <div className="sm:col-span-7 bg-slate-50/60 p-3 rounded-xl border border-slate-100 space-y-1.5">
                        <div className="flex items-center justify-between border-b border-slate-200/60 pb-1">
                          <h4 className="font-extrabold text-[11px] text-slate-900">Tren Setoran Sampah (Waktu Nyata)</h4>
                          <div className="flex items-center gap-2 text-[8px] font-extrabold">
                            <span className="flex items-center gap-1 text-emerald-700"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Organik</span>
                            <span className="flex items-center gap-1 text-amber-600"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Anorganik</span>
                            <span className="flex items-center gap-1 text-rose-600"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>Residu</span>
                          </div>
                        </div>

                        {/* Chart Area Container with Y-Axis & X-Axis */}
                        <div className="flex gap-1 pt-1">
                          {/* Y-Axis Labels (Volume Kg) */}
                          <div className="flex flex-col justify-between text-[8px] text-slate-400 font-extrabold pr-1 border-r border-slate-200/80 text-right select-none shrink-0 h-28">
                            <span>200 Kg</span>
                            <span>150 Kg</span>
                            <span>100 Kg</span>
                            <span>50 Kg</span>
                            <span>0 Kg</span>
                          </div>

                          {/* Canvas & Grid Lines */}
                          <div className="flex-1 flex flex-col justify-between h-28 relative">
                            <svg className="w-full h-full overflow-visible" viewBox="0 0 350 100" preserveAspectRatio="none">
                              {/* Horizontal Grid Lines */}
                              <line x1="0" y1="0" x2="350" y2="0" stroke="#cbd5e1" strokeWidth="0.8" strokeDasharray="3 3" />
                              <line x1="0" y1="25" x2="350" y2="25" stroke="#e2e8f0" strokeWidth="0.8" strokeDasharray="3 3" />
                              <line x1="0" y1="50" x2="350" y2="50" stroke="#e2e8f0" strokeWidth="0.8" strokeDasharray="3 3" />
                              <line x1="0" y1="75" x2="350" y2="75" stroke="#e2e8f0" strokeWidth="0.8" strokeDasharray="3 3" />
                              <line x1="0" y1="100" x2="350" y2="100" stroke="#cbd5e1" strokeWidth="1.2" />

                              {/* Data Lines */}
                              {/* Residu (Merah) */}
                              <path d="M0 80 Q 45 65, 90 75 T 180 45 T 270 65 L 320 15 L 350 25" fill="none" stroke="#f43f5e" strokeWidth="2.5" />
                              {/* Anorganik (Amber) */}
                              <path d="M0 90 Q 55 80, 110 85 T 225 70 L 350 55" fill="none" stroke="#f59e0b" strokeWidth="2" />
                              {/* Organik (Emerald) */}
                              <path d="M0 96 L 350 78" fill="none" stroke="#10b981" strokeWidth="1.8" />
                            </svg>

                            {/* X-Axis Labels (Minggu / Periode) */}
                            <div className="flex justify-between text-[8px] text-slate-500 font-extrabold pt-1 border-t border-slate-300">
                              <span>Mng 25</span>
                              <span>Mng 27</span>
                              <span>Mng 29</span>
                              <span>Mng 31</span>
                              <span>Mng 32</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Donut Chart */}
                      <div className="sm:col-span-5 bg-slate-50/60 p-3.5 rounded-xl border border-slate-100 space-y-2 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                            <h4 className="font-extrabold text-[11px] text-slate-900">Komposisi Sampah</h4>
                            <span className="text-[9px] text-emerald-700 font-bold">Volume</span>
                          </div>

                          <div className="py-2 flex items-center justify-center">
                            <div className="relative w-16 h-16 rounded-full border-4 border-rose-500 flex items-center justify-center text-center">
                              <div>
                                <p className="text-xs font-black text-rose-600 leading-none">85%</p>
                                <p className="text-[7px] font-bold text-slate-500 uppercase">RESIDU</p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1 text-[9px] font-bold">
                            <div className="flex justify-between">
                              <span className="text-emerald-600">Organik</span>
                              <span className="text-slate-800">270 Kg (2%)</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-amber-500">Anorganik</span>
                              <span className="text-slate-800">1.460 Kg (13%)</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-rose-500">Residu</span>
                              <span className="text-slate-800">10.380 Kg (85%)</span>
                            </div>
                          </div>
                        </div>

                        <button className="w-full py-1.5 bg-slate-900 text-white rounded-lg text-[9px] font-bold mt-1">
                          Detail Komposisi
                        </button>
                      </div>

                    </div>

                    {/* Detailed Data Table Preview */}
                    <div className="bg-slate-50/80 rounded-xl border border-slate-200/80 overflow-hidden space-y-0 shadow-2xs">
                      <div className="px-3 py-2 bg-slate-100/90 border-b border-slate-200/80 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          <h4 className="font-extrabold text-[11px] text-slate-900">Top Warga &amp; Wilayah Teraktif</h4>
                        </div>
                        <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">PERINGKAT LANGSUNG</span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-[9px]">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-extrabold uppercase tracking-wider text-[8px]">
                              <th className="py-1.5 px-3">PERINGKAT</th>
                              <th className="py-1.5 px-3">NAMA WARGA</th>
                              <th className="py-1.5 px-3">WILAYAH (RT/RW)</th>
                              <th className="py-1.5 px-3 text-right">TOTAL SETORAN</th>
                              <th className="py-1.5 px-3 text-center">KEPATUHAN</th>
                              <th className="py-1.5 px-3 text-right">TOTAL POIN</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-700">
                            <tr className="hover:bg-emerald-50/40 transition">
                              <td className="py-1.5 px-3 font-extrabold text-amber-500 flex items-center gap-1">
                                🥇 #1
                              </td>
                              <td className="py-1.5 px-3 font-bold text-slate-900">Bu Ratna</td>
                              <td className="py-1.5 px-3 text-slate-500">RT 01/RW 06, Kel. Dago</td>
                              <td className="py-1.5 px-3 text-right font-extrabold text-slate-900">120 Kg</td>
                              <td className="py-1.5 px-3 text-center">
                                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">98%</span>
                              </td>
                              <td className="py-1.5 px-3 text-right font-black text-emerald-600">5.000 Poin</td>
                            </tr>
                            <tr className="hover:bg-emerald-50/40 transition">
                              <td className="py-1.5 px-3 font-extrabold text-slate-400 flex items-center gap-1">
                                🥈 #2
                              </td>
                              <td className="py-1.5 px-3 font-bold text-slate-900">Bu Sri</td>
                              <td className="py-1.5 px-3 text-slate-500">RT 02/RW 02, Kel. Cigadung</td>
                              <td className="py-1.5 px-3 text-right font-extrabold text-slate-900">105 Kg</td>
                              <td className="py-1.5 px-3 text-center">
                                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">95%</span>
                              </td>
                              <td className="py-1.5 px-3 text-right font-black text-emerald-600">4.250 Poin</td>
                            </tr>
                            <tr className="hover:bg-emerald-50/40 transition">
                              <td className="py-1.5 px-3 font-extrabold text-amber-700 flex items-center gap-1">
                                🥉 #3
                              </td>
                              <td className="py-1.5 px-3 font-bold text-slate-900">Bu Rina</td>
                              <td className="py-1.5 px-3 text-slate-500">RT 01/RW 01, Kel. Coblong</td>
                              <td className="py-1.5 px-3 text-right font-extrabold text-slate-900">98 Kg</td>
                              <td className="py-1.5 px-3 text-center">
                                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">92%</span>
                              </td>
                              <td className="py-1.5 px-3 text-right font-black text-emerald-600">3.900 Poin</td>
                            </tr>
                            <tr className="hover:bg-emerald-50/40 transition">
                              <td className="py-1.5 px-3 font-bold text-slate-500">#4</td>
                              <td className="py-1.5 px-3 font-bold text-slate-900">Pak Asep</td>
                              <td className="py-1.5 px-3 text-slate-500">RT 03/RW 06, Kel. Dago</td>
                              <td className="py-1.5 px-3 text-right font-extrabold text-slate-900">85 Kg</td>
                              <td className="py-1.5 px-3 text-center">
                                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">88%</span>
                              </td>
                              <td className="py-1.5 px-3 text-right font-black text-emerald-600">3.400 Poin</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>

                </div>

              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ----------------- INSTANSI & PARTNER SECTION (FULL & PROMINENT) ----------------- */}
      <section className="py-20 bg-slate-50/70 border-y border-slate-200/80 w-full">
        <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-8 space-y-12 text-center">

          {/* Prominent Header Title & Subtitle */}
          <div className="space-y-3 max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Bersama Mitra, Menciptakan Dampak
            </h2>
            <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
              Kolaborasi bersama berbagai pihak untuk lingkungan yang lebih baik.
            </p>
          </div>

          {/* 7 Prominent Large White Partner Cards Grid (Full Spreading Width) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 lg:gap-5 w-full">

            {/* Card 1: UNIKOM */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-lg hover:border-emerald-500/50 transition duration-300 flex items-center gap-4 text-left">
              <img src="/logos/unikom.png" alt="UNIKOM" className="w-12 h-12 object-contain shrink-0" />
              <div className="flex flex-col">
                <span className="text-sm font-black text-sky-700 tracking-tight leading-tight">UNIKOM</span>
                <span className="text-xs text-slate-500 font-semibold mt-1 leading-snug">Universitas Komputer Indonesia</span>
              </div>
            </div>

            {/* Card 2: Pemerintah Kota Bandung */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-lg hover:border-emerald-500/50 transition duration-300 flex items-center gap-4 text-left">
              <img src="/logos/kota-bandung.png" alt="Pemerintah Kota Bandung" className="w-12 h-12 object-contain shrink-0" />
              <div className="flex flex-col">
                <span className="text-sm font-black text-slate-900 tracking-tight leading-tight">Pemerintah</span>
                <span className="text-xs text-slate-500 font-semibold mt-1 leading-snug">Kota Bandung</span>
              </div>
            </div>

            {/* Card 3: DLH Kota Bandung */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-lg hover:border-emerald-500/50 transition duration-300 flex items-center gap-4 text-left">
              <img src="/logos/dlh.png" alt="DLH Kota Bandung" className="w-12 h-12 object-contain shrink-0" />
              <div className="flex flex-col">
                <span className="text-sm font-black text-emerald-700 tracking-tight leading-tight">DLH</span>
                <span className="text-xs text-slate-500 font-semibold mt-1 leading-snug">Kota Bandung</span>
              </div>
            </div>

            {/* Card 4: Kecamatan Coblong */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-lg hover:border-emerald-500/50 transition duration-300 flex items-center gap-4 text-left">
              <img src="/logos/kecamatan-coblong.png" alt="Kecamatan Coblong" className="w-12 h-12 object-contain shrink-0" />
              <div className="flex flex-col">
                <span className="text-sm font-black text-slate-900 tracking-tight leading-tight">Kecamatan</span>
                <span className="text-xs text-slate-500 font-semibold mt-1 leading-snug">Coblong</span>
              </div>
            </div>

            {/* Card 5: Kelurahan Se-Kecamatan Coblong */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-lg hover:border-emerald-500/50 transition duration-300 flex items-center gap-4 text-left">
              <img src="/logos/kota-bandung.png" alt="Kelurahan Se-Kecamatan Coblong" className="w-12 h-12 object-contain shrink-0 opacity-90" />
              <div className="flex flex-col">
                <span className="text-sm font-black text-indigo-900 tracking-tight leading-tight">Kelurahan</span>
                <span className="text-xs text-slate-500 font-semibold mt-1 leading-snug">Se-Kecamatan Coblong</span>
              </div>
            </div>

            {/* Card 6: Bank Sampah Mitra */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-lg hover:border-emerald-500/50 transition duration-300 flex items-center gap-4 text-left">
              <svg className="w-12 h-12 shrink-0" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M25 8 A17 17 0 0 1 40 20" stroke="#16a34a" strokeWidth="4" strokeLinecap="round" fill="none" />
                <polygon points="40,14 44,22 34,22" fill="#16a34a" />
                <path d="M40 30 A17 17 0 0 1 10 30" stroke="#16a34a" strokeWidth="4" strokeLinecap="round" fill="none" />
                <polygon points="10,36 6,28 16,28" fill="#16a34a" />
                <path d="M10 20 A17 17 0 0 1 25 8" stroke="#16a34a" strokeWidth="4" strokeLinecap="round" fill="none" />
                <circle cx="25" cy="25" r="5" fill="#16a34a" />
              </svg>
              <div className="flex flex-col">
                <span className="text-sm font-black text-emerald-800 tracking-tight leading-tight">Bank Sampah</span>
                <span className="text-xs text-slate-500 font-semibold mt-1 leading-snug">Mitra</span>
              </div>
            </div>

            {/* Card 7: Komunitas Masyarakat */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-lg hover:border-emerald-500/50 transition duration-300 flex items-center gap-4 text-left">
              <svg className="w-12 h-12 shrink-0" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="25" cy="25" r="19" stroke="#334155" strokeWidth="2" fill="#f8fafc" />
                <circle cx="25" cy="18" r="4" fill="#1e293b" />
                <path d="M17 33 C17 27 21 24 25 24 C29 24 33 27 33 33" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                <circle cx="16" cy="20" r="3" fill="#64748b" />
                <path d="M10 33 C10 29 13 26 16 26" stroke="#64748b" strokeWidth="2" strokeLinecap="round" fill="none" />
                <circle cx="34" cy="20" r="3" fill="#64748b" />
                <path d="M40 33 C40 29 37 26 34 26" stroke="#64748b" strokeWidth="2" strokeLinecap="round" fill="none" />
              </svg>
              <div className="flex flex-col">
                <span className="text-sm font-black text-slate-900 tracking-tight leading-tight">Komunitas</span>
                <span className="text-xs text-slate-500 font-semibold mt-1 leading-snug">Masyarakat</span>
              </div>
            </div>

          </div>

        </div>
      </section>



      {/* ----------------- GLOBAL IMPACT TARGETS (SDGs SECTION WITH REAL OFFICIAL ICONS) ----------------- */}
      <section className="py-12 bg-white">
        <div className="container-custom">

          <div className="bg-emerald-50/40 rounded-3xl p-8 sm:p-10 border border-emerald-100/90 shadow-2xs space-y-8">

            {/* SDGs Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-emerald-100 pb-6">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
                  GLOBAL IMPACT TARGETS
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Pencapaian Tujuan Pembangunan Berkelanjutan (SDGs)
                </h3>
              </div>
              <p className="text-xs text-slate-500 font-medium max-w-md leading-relaxed">
                TrashCare mendukung indikator utama PBB dalam mewujudkan lingkungan perkotaan yang bersih, sehat, dan berkelanjutan.
              </p>
            </div>

            {/* 5 Real UN Official SDG Cards with Icons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">

              {/* SDG #3: Kehidupan Sehat & Sejahtera */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-emerald-500/40 transition flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">TARGET SDG</span>
                    <span className="text-lg font-black text-[#4C9F38]">#3</span>
                  </div>

                  <div className="pt-3 flex items-center gap-3">
                    {/* Official UN SDG 3 Real Icon Container */}
                    <div className="w-12 h-12 rounded-xl bg-[#4C9F38] text-white flex items-center justify-center shrink-0 shadow-sm">
                      <svg className="w-7 h-7 fill-none stroke-white stroke-[2.2]" viewBox="0 0 24 24">
                        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.684a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" fill="currentColor" fillOpacity="0.25" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M7 12h2.5l1.5-3.5 2.5 7 1.5-3.5H17" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <h4 className="font-extrabold text-xs text-slate-900 leading-snug">
                      Kehidupan Sehat &amp; Sejahtera
                    </h4>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  Mencegah penumpukan sampah liar penular penyakit.
                </p>
              </div>

              {/* SDG #11: Kota & Permukiman Berkelanjutan (Highlight Active Border) */}
              <div className="bg-emerald-50/50 p-5 rounded-2xl border-2 border-emerald-500 shadow-sm transition flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-800">TARGET SDG</span>
                    <span className="text-lg font-black text-[#FD9D24]">#11</span>
                  </div>

                  <div className="pt-3 flex items-center gap-3">
                    {/* Official UN SDG 11 Real Icon Container */}
                    <div className="w-12 h-12 rounded-xl bg-[#FD9D24] text-white flex items-center justify-center shrink-0 shadow-sm">
                      <svg className="w-7 h-7 fill-white" viewBox="0 0 24 24">
                        <path d="M15 11V5l-3-2-3 2v6H3v10h18V11h-6zm-4-6l1-.67L13 5v14h-2V5zm-4 8h2v2H7v-2zm0 4h2v2H7v-2zm10 0h-2v-2h2v2zm0-4h-2v-2h2v2z" />
                      </svg>
                    </div>
                    <h4 className="font-extrabold text-xs text-slate-900 leading-snug">
                      Kota &amp; Permukiman Berkelanjutan
                    </h4>
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                  Menata sistem kebersihan lingkungan pemukiman.
                </p>
              </div>

              {/* SDG #12: Konsumsi & Produksi Bertanggung Jawab */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-emerald-500/40 transition flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">TARGET SDG</span>
                    <span className="text-lg font-black text-[#BF8B2E]">#12</span>
                  </div>

                  <div className="pt-3 flex items-center gap-3">
                    {/* Official UN SDG 12 Real Icon Container */}
                    <div className="w-12 h-12 rounded-xl bg-[#BF8B2E] text-white flex items-center justify-center shrink-0 shadow-sm">
                      <svg className="w-7 h-7 fill-none stroke-white stroke-[2.2]" viewBox="0 0 24 24">
                        <path d="M7 16A4 4 0 017 8c2.5 0 4.5 4 5 4s2.5-4 5-4a4 4 0 010 8c-2.5 0-4.5-4-5-4s-2.5 4-5 4z" strokeLinecap="round" />
                        <path d="M15.5 13.5L17.5 16l-2 2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <h4 className="font-extrabold text-xs text-slate-900 leading-snug">
                      Konsumsi &amp; Produksi Bertanggung Jawab
                    </h4>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  Memaksimalkan daur ulang dan kompos limbah.
                </p>
              </div>

              {/* SDG #13: Penanganan Perubahan Iklim */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-emerald-500/40 transition flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">TARGET SDG</span>
                    <span className="text-lg font-black text-[#3F7E44]">#13</span>
                  </div>

                  <div className="pt-3 flex items-center gap-3">
                    {/* Official UN SDG 13 Real Icon Container */}
                    <div className="w-12 h-12 rounded-xl bg-[#3F7E44] text-white flex items-center justify-center shrink-0 shadow-sm">
                      <svg className="w-7 h-7 fill-none stroke-white stroke-2" viewBox="0 0 24 24">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3.5" fill="white" />
                      </svg>
                    </div>
                    <h4 className="font-extrabold text-xs text-slate-900 leading-snug">
                      Penanganan Perubahan Iklim
                    </h4>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  Reduksi emisi gas metana dari sampah organik.
                </p>
              </div>

              {/* SDG #15: Ekosistem Daratan */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-emerald-500/40 transition flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">TARGET SDG</span>
                    <span className="text-lg font-black text-[#56C02B]">#15</span>
                  </div>

                  <div className="pt-3 flex items-center gap-3">
                    {/* Official UN SDG 15 Real Icon Container */}
                    <div className="w-12 h-12 rounded-xl bg-[#56C02B] text-white flex items-center justify-center shrink-0 shadow-sm">
                      <svg className="w-7 h-7 fill-white" viewBox="0 0 24 24">
                        <path d="M12 2L4 15h5v5h6v-5h5L12 2zm0 3.8L16.2 13H13v5h-2v-5H7.8L12 5.8z" />
                      </svg>
                    </div>
                    <h4 className="font-extrabold text-xs text-slate-900 leading-snug">
                      Ekosistem Daratan
                    </h4>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  Menjaga kualitas tanah dan sumber air bersih.
                </p>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ----------------- 01. ABOUT US ----------------- */}
      <section id="about" className="py-24 bg-white border-y border-slate-200/80 relative overflow-hidden">
        <div className="container-custom space-y-16">

          {/* About Header Narrative */}
          <div className="max-w-4xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm text-emerald-600">nature_people</span>
              01. Tentang Kami &amp; Visi Ekosistem
            </div>

            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Ekosistem Pemilahan Sampah Cerdas <span className="text-emerald-600">Terintegrasi</span>
            </h2>

            <p className="text-slate-600 text-lg leading-relaxed font-medium">
              TrashCare merupakan platform tata kelola kebersihan modern yang mengolaborasikan masyarakat, mahasiswa KKN, pengurus RW, petugas residu, hingga Dinas Lingkungan Hidup. Sistem ini menghadirkan transparansi data real-time, validasi pemilahan berbasis QR Code &amp; AI, serta skema gamifikasi poin terverifikasi demi mendukung Kecamatan Coblong Bebas Sampah.
            </p>

            <div className="flex flex-wrap gap-2.5 pt-2">
              {["Auth WhatsApp OTP (+62)", "Tanpa NIK (Privasi Aman)", "Maks. 2 Tempat Sampah", "Window Penjemputan 06-08 & 16-18", "Verifikasi Timbangan Residu"].map((tag, idx) => (
                <span key={idx} className="px-4 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-extrabold rounded-xl">
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* 4 Real Project Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

            <div className="about-pillar-card space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">delete_sweep</span>
              </div>
              <h3 className="text-xl font-black text-slate-900">1. Digitalisasi Tempat Sampah</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Registrasi presisi maksimal 2 Tempat Sampah (Organik &amp; Anorganik) berlabel QR unik per rumah tangga. Residu dipisahkan dan ditimbang akurat di hilir oleh Petugas.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-black text-emerald-600">
                <span>Masa Aktif 30 Hari + Auto-Reset</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </div>
            </div>

            <div className="about-pillar-card space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">stars</span>
              </div>
              <h3 className="text-xl font-black text-slate-900">2. Gamifikasi &amp; Ledger Poin</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Sistem pencatatan poin terpisah (Ledger Isolation) untuk Warga, Mahasiswa, dan Petugas. Poin bertambah secara atomik setelah persetujuan dan verifikasi RW.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-black text-emerald-600">
                <span>Transparansi Audit Terjamin</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </div>
            </div>

            <div className="about-pillar-card space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">groups</span>
              </div>
              <h3 className="text-xl font-black text-slate-900">3. Kolaborasi KKN Berdampak</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Mahasiswa KKN mengunci titik geolokasi GPS saat registrasi Tempat Sampah, mengedukasi warga, dan mencatat histori penugasan serah terima wilayah.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-black text-emerald-600">
                <span>Histori Handover KKN</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </div>
            </div>

            <div className="about-pillar-card space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">compost</span>
              </div>
              <h3 className="text-xl font-black text-slate-900">4. Pemanfaatan Sampah Hilir</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Integrasi pemantauan hasil olahan sampah melalui Loseda (pipa kompos), Bata Terawang, Rumah Maggot BSF, Bank Sampah, hingga budidaya ternak.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-black text-emerald-600">
                <span>Monitoring Laporan Panen</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </div>
            </div>

          </div>


        </div>
      </section>

      {/* ----------------- 02. WHY US ----------------- */}
      <section id="why-us" className="py-24 bg-slate-50/70 border-b border-slate-200/80">
        <div className="container-custom space-y-12">

          <div className="max-w-3xl mx-auto text-center space-y-3">
            <span className="text-emerald-600 text-xs font-black uppercase tracking-widest">02. MENGAPA KAMI</span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">Mengapa Aplikasi Ini?</h2>
            <p className="text-slate-600 text-base sm:text-lg font-medium">
              Solusi tata kelola sampah rumah tangga terintegrasi untuk seluruh pemukiman dan wilayah.
            </p>

            {/* Clean Interactive Pills */}
            <div className="inline-flex items-center gap-2 p-1.5 bg-white rounded-full border border-slate-200/80 shadow-2xs mt-4">
              <button
                onClick={() => setWhyUsTab("points")}
                className={`clean-interactive-tab ${whyUsTab === "points" ? "active" : ""}`}
              >
                Gamifikasi Berbasis Poin
              </button>
              <button
                onClick={() => setWhyUsTab("bins")}
                className={`clean-interactive-tab ${whyUsTab === "bins" ? "active" : ""}`}
              >
                Manajemen Tempat Sampah
              </button>
              <button
                onClick={() => setWhyUsTab("iot")}
                className={`clean-interactive-tab ${whyUsTab === "iot" ? "active" : ""}`}
              >
                Terintegrasi IoT
              </button>
            </div>
          </div>

          <div className="max-w-3xl mx-auto">
            {whyUsTab === "points" ? (
              <div className="bg-white text-slate-900 p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-md space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <span className="material-symbols-outlined text-xl">stars</span>
                    </div>
                    <span className="font-extrabold text-lg text-slate-900">Sistem Ledger Berbasis Poin</span>
                  </div>
                  <span className="text-xs px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full font-bold">Insentif &amp; Audit</span>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  Pencatatan poin Warga dan Mahasiswa KKN menggunakan ledger terpisah di database demi transparansi audit. Setiap setoran sampah berhadiah poin insentif, dan pengajuan ide daur ulang yang disetujui RW memberikan reward tambahan (+50 poin).
                </p>

                <div className="grid grid-cols-3 gap-4 pt-2 text-center">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Skor Kepatuhan</span>
                    <p className="text-2xl font-black text-emerald-600">94.5%</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Poin</span>
                    <p className="text-2xl font-black text-amber-500">2.450 Poin</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Ide Daur Ulang</span>
                    <p className="text-2xl font-black text-emerald-600">+50 Poin</p>
                  </div>
                </div>
              </div>
            ) : whyUsTab === "bins" ? (
              <div className="bg-white text-slate-900 p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-md space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <span className="material-symbols-outlined text-xl">delete</span>
                    </div>
                    <span className="font-extrabold text-lg text-slate-900">Aturan Tempat Sampah Rumah Tangga</span>
                  </div>
                  <span className="text-xs px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-bold">Validasi Kode QR</span>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  Setiap rumah tangga berhak mendaftarkan maksimal 2 tempat sampah (1 Organik &amp; 1 Anorganik). Tempat sampah aktif selama 30 hari dan di-reset otomatis setiap setoran. Penjemputan residu dipisahkan dan ditimbang manual oleh Petugas Residu.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-black text-slate-900">Tempat Sampah Organik #01</p>
                      <p className="text-xs text-slate-500 font-medium">Aktif (20L Standar)</p>
                    </div>
                    <span className="text-xs font-black px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl">25% Terisi</span>
                  </div>
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-black text-slate-900">Tempat Sampah Anorganik #02</p>
                      <p className="text-xs text-slate-500 font-medium">Aktif (20L Standar)</p>
                    </div>
                    <span className="text-xs font-black px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl">50% Terisi</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white text-slate-900 p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-md space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                      <span className="material-symbols-outlined text-xl">sensors</span>
                    </div>
                    <span className="font-extrabold text-lg text-slate-900">Terintegrasi Dengan IoT &amp; Sensor Digital</span>
                  </div>
                  <span className="text-xs px-3 py-1 bg-sky-50 text-sky-800 border border-sky-200 rounded-full font-bold">IoT &amp; Tracking</span>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  Pengawasan pemilahan sampah dilengkapi dengan pemindaian QR Code digital, perekaman GPS lokasi tempat sampah saat registrasi, serta radar notifikasi penjemputan otomatis berbasis waktu nyata.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-left">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <span className="material-symbols-outlined text-emerald-600 text-xl">qr_code_scanner</span>
                    <p className="text-xs font-black text-slate-900">Scan QR Digital</p>
                    <p className="text-[11px] text-slate-500 font-medium">Verifikasi identitas tempat sampah instan.</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <span className="material-symbols-outlined text-sky-600 text-xl">location_on</span>
                    <p className="text-xs font-black text-slate-900">Koordinat Presisi GPS</p>
                    <p className="text-[11px] text-slate-500 font-medium">Tracking titik lokasi fisik tempat sampah warga.</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <span className="material-symbols-outlined text-rose-500 text-xl">notifications_active</span>
                    <p className="text-xs font-black text-slate-900">Radar Merah Otomatis</p>
                    <p className="text-[11px] text-slate-500 font-medium">Pengingat penjemputan berbasis window waktu.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* ----------------- 03. FAQ (PERTANYAAN UMUM) ----------------- */}
      <section id="faq" className="py-24 bg-white border-b border-slate-200/80">
        <div className="container-custom space-y-12">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-emerald-600 font-extrabold text-sm uppercase tracking-wider">03. FAQ - PERTANYAAN UMUM</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Pertanyaan Yang Sering Diajukan</h2>
            <p className="text-slate-500 text-sm font-medium">
              Informasi lengkap seputar operasional, sistem poin, dan pengelolaan tempat sampah TrashCare.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {[
              {
                q: "Bagaimana cara mendaftar akun Warga di aplikasi TrashCare?",
                a: "Tanpa NIK! Warga mendaftar menggunakan nomor HP WhatsApp (+62) untuk mendapatkan kode OTP instan. Pendaftaran dapat dilakukan mandiri atau dibantu oleh Mahasiswa KKN pendamping di lokasi."
              },
              {
                q: "Berapa jumlah tempat sampah yang dapat didaftarkan per rumah tangga?",
                a: "Setiap rumah tangga berhak mendaftarkan maksimal 2 Tempat Sampah (1 Organik dan 1 Anorganik). Sampah residu tidak dibuatkan tempat sampah di rumah, melainkan dipisahkan dan ditimbang di hilir."
              },
              {
                q: "Kapan jam operasional penjemputan sampah dilakukan oleh petugas?",
                a: "Penjemputan dilakukan secara disiplin pada 2 window waktu operasional harian: Pukul 06:00 - 08:00 WIB dan Pukul 16:00 - 18:00 WIB."
              },
              {
                q: "Bagaimana alur perhitungan dan pembagian poin insentif warga?",
                a: "Poin insentif dicatat dalam ledger terpisah database. Poin bertambah (+10 Warga & +10 Mahasiswa KKN) setelah pendaftaran/setoran disetujui Pengurus RW. Pengajuan ide daur ulang yang disetujui RW memberikan reward tambahan +50 poin."
              },
              {
                q: "Berapa lama masa aktif tempat sampah yang terdaftar?",
                a: "Tempat sampah aktif selama 30 hari dan di-reset otomatis setiap kali warga mengunggah foto setoran + disetujui pengangkutannya. Jika 30 hari tanpa aktivitas, tempat sampah menjadi tidak aktif dan membutuhkan aktivasi ulang via RW."
              }
            ].map((faq, idx) => (
              <div key={idx} className="bg-slate-50/80 rounded-2xl border border-slate-200/80 overflow-hidden transition-all">
                <button
                  onClick={() => setFaqOpenIndex(faqOpenIndex === idx ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between font-extrabold text-slate-900 text-sm cursor-pointer hover:bg-slate-100/60 transition"
                >
                  <span className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-black flex items-center justify-center">
                      Q{idx + 1}
                    </span>
                    {faq.q}
                  </span>
                  <span className="material-symbols-outlined text-slate-400">
                    {faqOpenIndex === idx ? "remove_circle_outline" : "add_circle_outline"}
                  </span>
                </button>
                {faqOpenIndex === idx && (
                  <div className="px-5 pb-5 pt-1 text-xs text-slate-600 leading-relaxed font-medium border-t border-slate-200/60 bg-white">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------- 04. BUKU PANDUAN & ALUR EKOSISTEM INTERAKTIF ----------------- */}
      <section id="guide" className="py-24 bg-slate-50/70 border-b border-slate-200/80">
        <div className="container-custom space-y-16">

          {/* Section Title Header */}
          <div className="max-w-3xl mx-auto text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100/90 text-emerald-950 text-xs font-black uppercase tracking-wider">
              <span className="material-symbols-outlined text-base text-emerald-700">menu_book</span>
              04. Buku Panduan &amp; Alur Operasional
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              Panduan Lengkap <span className="text-emerald-600">Alur &amp; Peran</span> Ekosistem
            </h2>
            <p className="text-slate-600 text-base sm:text-lg font-medium leading-relaxed">
              Memahami siklus tata kelola sampah terintegrasi dari hulu ke hilir serta fitur interaktif untuk tiap peran pengguna.
            </p>
          </div>

          {/* PART 1: GENERAL ECOSYSTEM FLOW STEPPER */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-md space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div>
                <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-widest">ALUR UMUM EKOSISTEM</span>
                <h3 className="text-2xl font-black text-slate-900 mt-1">6 Tahap Operasional Dari Hulu ke Hilir</h3>
              </div>
              <p className="text-xs text-slate-500 max-w-md font-medium">
                Klik salah satu langkah di bawah untuk melihat rincian aktivitas dan peran yang terlibat.
              </p>
            </div>

            {/* Stepper Navigation Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { step: 1, label: "1. Registrasi & QR", icon: "qr_code_2" },
                { step: 2, label: "2. Pemilahan Warga", icon: "delete_sweep" },
                { step: 3, label: "3. Window Penjemputan", icon: "schedule" },
                { step: 4, label: "4. Timbangan Residu", icon: "scale" },
                { step: 5, label: "5. Approval RW", icon: "verified" },
                { step: 6, label: "6. Monitoring & GIS", icon: "analytics" },
              ].map((item) => (
                <button
                  key={item.step}
                  onClick={() => setActiveFlowStep(item.step)}
                  className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between h-28 ${activeFlowStep === item.step
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-md scale-[1.02]"
                    : "bg-slate-50 text-slate-700 border-slate-200/80 hover:border-emerald-500 hover:bg-emerald-50/50"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`w-7 h-7 rounded-xl text-xs font-black flex items-center justify-center ${activeFlowStep === item.step ? "bg-white text-emerald-700" : "bg-emerald-100 text-emerald-800"
                        }`}
                    >
                      0{item.step}
                    </span>
                    <span className="material-symbols-outlined text-xl opacity-90">{item.icon}</span>
                  </div>
                  <p className="text-xs font-extrabold leading-tight">{item.label}</p>
                </button>
              ))}
            </div>

            {/* Stepper Detail Highlight Box */}
            <div className="p-6 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl space-y-4">
              {activeFlowStep === 1 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-emerald-900 font-black text-lg">
                    <span className="material-symbols-outlined text-2xl text-emerald-600">qr_code_2</span>
                    Tahap 1: Pendaftaran Warga &amp; Aktivasi QR Tempat Sampah
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    Mahasiswa KKN membawa Tempat Sampah berlabel QR Code (`PRINTED`). Saat pendaftaran warga pendampingan, sensor GPS gawai merekam koordinat lokasi fisik tempat sampah secara permanen. Akun Warga didaftarkan tanpa NIK menggunakan nomor WhatsApp (+62).
                  </p>
                  <div className="flex flex-wrap gap-2 text-[11px] font-extrabold">
                    <span className="px-2.5 py-1 bg-white text-emerald-800 rounded-lg border border-emerald-200">Peran: Warga &amp; Mahasiswa KKN</span>
                    <span className="px-2.5 py-1 bg-white text-emerald-800 rounded-lg border border-emerald-200">Status Tempat Sampah: PRINTED → DIPEGANG_MAHASISWA → PENDING_APPROVAL</span>
                  </div>
                </div>
              )}

              {activeFlowStep === 2 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-emerald-900 font-black text-lg">
                    <span className="material-symbols-outlined text-2xl text-emerald-600">delete_sweep</span>
                    Tahap 2: Pemilahan Mandiri 2 Tempat Sampah
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    Setiap rumah tangga berhak memiliki maksimal 2 tempat sampah (1 Organik dan 1 Anorganik). Warga memilah sampah dari rumah dan mengunggah foto setoran sampah bila tempat sampah penuh. Masa aktif tempat sampah adalah 30 hari dan di-reset otomatis setiap aktivitas setoran.
                  </p>
                  <div className="flex flex-wrap gap-2 text-[11px] font-extrabold">
                    <span className="px-2.5 py-1 bg-white text-emerald-800 rounded-lg border border-emerald-200">Peran: Warga Rumah Tangga</span>
                    <span className="px-2.5 py-1 bg-white text-emerald-800 rounded-lg border border-emerald-200">Aturan: Maks 2 Tempat Sampah (Organik &amp; Anorganik)</span>
                  </div>
                </div>
              )}

              {activeFlowStep === 3 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-emerald-900 font-black text-lg">
                    <span className="material-symbols-outlined text-2xl text-emerald-600">schedule</span>
                    Tahap 3: Operasional Penjemputan Sesuai Window Waktu
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    Penjemputan dilakukan oleh Petugas Residu secara disiplin pada dua window waktu operasional: **06:00 - 08:00 WIB** dan **16:00 - 18:00 WIB**. Jika petugas belum memproses penjemputan dalam window waktu, notifikasi eskalasi dikirimkan bertahap ke RW hingga Camat.
                  </p>
                  <div className="flex flex-wrap gap-2 text-[11px] font-extrabold">
                    <span className="px-2.5 py-1 bg-white text-emerald-800 rounded-lg border border-emerald-200">Peran: Petugas Residu</span>
                    <span className="px-2.5 py-1 bg-white text-emerald-800 rounded-lg border border-emerald-200">Jam Operasional: 06:00-08:00 &amp; 16:00-18:00 WIB</span>
                  </div>
                </div>
              )}

              {activeFlowStep === 4 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-emerald-900 font-black text-lg">
                    <span className="material-symbols-outlined text-2xl text-emerald-600">scale</span>
                    Tahap 4: Penimbangan Residu Fisik &amp; Scan QR Code
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    Petugas memindai QR Code Tempat Sampah menggunakan gawai dan memasukkan angka hasil timbangan fisik industri secara manual. Data timbangan dikorelasikan dengan hasil evaluasi AI confidence.
                  </p>
                  <div className="flex flex-wrap gap-2 text-[11px] font-extrabold">
                    <span className="px-2.5 py-1 bg-white text-emerald-800 rounded-lg border border-emerald-200">Peran: Petugas Residu</span>
                    <span className="px-2.5 py-1 bg-white text-emerald-800 rounded-lg border border-emerald-200">Input Data: Hasil Timbangan Fisik Manual</span>
                  </div>
                </div>
              )}

              {activeFlowStep === 5 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-emerald-900 font-black text-lg">
                    <span className="material-symbols-outlined text-2xl text-emerald-600">verified</span>
                    Tahap 5: Verifikasi Pengurus RW &amp; Pencatatan Ledger Poin
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    Pengurus RW memeriksa permohonan pendaftaran &amp; laporan setoran warga. Begitu RW menyetujui, poin insentif bertambah secara atomik (+10 poin Warga &amp; +10 poin Mahasiswa KKN) menggunakan skema ledger terpisah yang aman dari audit.
                  </p>
                  <div className="flex flex-wrap gap-2 text-[11px] font-extrabold">
                    <span className="px-2.5 py-1 bg-white text-emerald-800 rounded-lg border border-emerald-200">Peran: Pengurus RW &amp; RT</span>
                    <span className="px-2.5 py-1 bg-white text-emerald-800 rounded-lg border border-emerald-200">Insentif: +10 Poin Warga, +10 Poin KKN, +50 Ide Daur Ulang</span>
                  </div>
                </div>
              )}

              {activeFlowStep === 6 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-emerald-900 font-black text-lg">
                    <span className="material-symbols-outlined text-2xl text-emerald-600">analytics</span>
                    Tahap 6: Monitoring Visual Real-Time &amp; Pemanfaatan GIS Hilir
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    Dinas Lingkungan Hidup, Camat, dan Lurah memantau statistik timbulan sampah melalui Dashboard Monitoring Read-Only. Sampah terkelola didistribusikan ke fasilitas pemanfaatan wilayah seperti Loseda, Bata Terawang, Maggot BSF, dan Bank Sampah.
                  </p>
                  <div className="flex flex-wrap gap-2 text-[11px] font-extrabold">
                    <span className="px-2.5 py-1 bg-white text-emerald-800 rounded-lg border border-emerald-200">Peran: Admin DLH, Camat, Lurah, DPL</span>
                    <span className="px-2.5 py-1 bg-white text-emerald-800 rounded-lg border border-emerald-200">Akses: Dasbor Eksekutif Pemantauan &amp; Peta GIS</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* PART 2: INTERACTIVE ROLE-BASED HANDBOOK */}
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-widest">PANDUAN INTERAKTIF PER ROLE</span>
              <h3 className="text-2xl sm:text-4xl font-black text-slate-900">Pilih Peran Pengguna Untuk Detail Fitur</h3>
              <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-xl mx-auto">
                Setiap peran dalam aplikasi TrashCare memiliki tanggung jawab, metode autentikasi, dan alur kerja spesifik.
              </p>
            </div>

            {/* Interactive Role Tabs Selector */}
            <div className="flex items-center justify-center flex-wrap gap-2">
              {[
                { key: "warga", label: "Warga", icon: "home" },
                { key: "kkn", label: "Mahasiswa KKN", icon: "school" },
                { key: "rw", label: "Pengurus RW / RT", icon: "verified_user" },
                { key: "petugas", label: "Petugas Residu", icon: "local_shipping" },
                { key: "dlh", label: "Admin DLH / Camat / Lurah", icon: "monitoring" },
                { key: "dpl", label: "DPL KKN", icon: "supervisor_account" },
                { key: "superUser", label: "SUPER USER", icon: "admin_panel_settings" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setGuideRoleTab(tab.key as any)}
                  className={`px-4 py-2.5 rounded-full text-xs font-extrabold transition-all duration-200 flex items-center gap-2 border ${guideRoleTab === tab.key
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-md scale-[1.03]"
                    : "bg-white text-slate-700 border-slate-200 hover:border-emerald-500 hover:text-emerald-700 shadow-2xs"
                    }`}
                >
                  <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Active Role Content Card */}
            <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-lg space-y-8 transition-all">

              {/* Role Header Info */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-2xl">
                        {guideRoleTab === "warga" && "home"}
                        {guideRoleTab === "kkn" && "school"}
                        {guideRoleTab === "rw" && "verified_user"}
                        {guideRoleTab === "petugas" && "local_shipping"}
                        {guideRoleTab === "dlh" && "monitoring"}
                        {guideRoleTab === "dpl" && "supervisor_account"}
                        {guideRoleTab === "superUser" && "admin_panel_settings"}
                      </span>
                    </span>
                    <div>
                      <h4 className="text-2xl font-black text-slate-900">
                        {guideRoleTab === "warga" && "Panduan Peran: Warga / Rumah Tangga"}
                        {guideRoleTab === "kkn" && "Panduan Peran: Mahasiswa KKN"}
                        {guideRoleTab === "rw" && "Panduan Peran: Pengurus RW & RT"}
                        {guideRoleTab === "petugas" && "Panduan Peran: Petugas Residu Hilir"}
                        {guideRoleTab === "dlh" && "Panduan Peran: Admin DLH, Camat, & Lurah"}
                        {guideRoleTab === "dpl" && "Panduan Peran: Dosen Pembimbing Lapangan (DPL)"}
                        {guideRoleTab === "superUser" && "Panduan Peran: SUPER USERistrator"}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">Sistem Pemilahan Sampah Terpadu</p>
                    </div>
                  </div>
                </div>

                {/* Auth & Access Method Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1.5 bg-sky-50 text-sky-800 border border-sky-200 text-xs font-bold rounded-xl flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base">phonelink_lock</span>
                    {guideRoleTab === "warga" ? "WhatsApp OTP (+62) • Tanpa NIK" : "Email & Kredensial Password"}
                  </span>
                  <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base">security</span>
                    {guideRoleTab === "dlh" ? "Aksesibilitas: Pemantauan Sesuai Wilayah" : "Aksesibilitas: Operasional & Manajemen"}
                  </span>
                </div>
              </div>

              {/* Role Details Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Column: Rules & Key Features */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                    <h5 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                      <span className="material-symbols-outlined text-emerald-600 text-lg">checklist</span>
                      Tanggung Jawab Utama &amp; Batasan
                    </h5>
                    <ul className="space-y-2.5 text-xs text-slate-600 font-medium">
                      {guideRoleTab === "warga" && (
                        <>
                          <li className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-emerald-600 text-base shrink-0">check_circle</span>
                            <span>Mendaftarkan maksimal 2 Tempat Sampah (1 Organik &amp; 1 Anorganik).</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-emerald-600 text-base shrink-0">check_circle</span>
                            <span>Mengunggah bukti foto setoran sampah saat tempat sampah terisi penuh.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-emerald-600 text-base shrink-0">check_circle</span>
                            <span>Menjaga keaktifan tempat sampah (masa aktif 30 hari, otomatis ter-reset saat setoran disetujui).</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-emerald-600 text-base shrink-0">check_circle</span>
                            <span>Mengirimkan ide kreasi daur ulang untuk klaim reward +50 poin tambahan.</span>
                          </li>
                        </>
                      )}

                      {guideRoleTab === "kkn" && (
                        <>
                          <li className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-emerald-600 text-base shrink-0">check_circle</span>
                            <span>Memindai batch QR Tempat Sampah awal untuk mengubah status menjadi `DIPEGANG_MAHASISWA`.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-emerald-600 text-base shrink-0">check_circle</span>
                            <span>Merekam lokasi GPS fisik gawai saat membantu pendaftaran tempat sampah warga.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-emerald-600 text-base shrink-0">check_circle</span>
                            <span>Mendapatkan poin insentif pendampingan (+10 poin) saat registrasi disetujui RW.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-emerald-600 text-base shrink-0">check_circle</span>
                            <span>Mencatat riwayat serah terima (handover) wilayah dampingan antar kelompok KKN.</span>
                          </li>
                        </>
                      )}

                      {guideRoleTab === "rw" && (
                        <>
                          <li className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-emerald-600 text-base shrink-0">check_circle</span>
                            <span>Memeriksa dan menyetujui pengajuan registrasi tempat sampah (`PENDING_APPROVAL` → `ACTIVE_BOUND`).</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-emerald-600 text-base shrink-0">check_circle</span>
                            <span>Menandai Tempat Sampah Rusak (`BROKEN`) untuk penonaktifan permanen QR code.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-emerald-600 text-base shrink-0">check_circle</span>
                            <span>Memvalidasi setoran sampah harian dan menambahkan poin atomik ke ledger Warga.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-emerald-600 text-base shrink-0">check_circle</span>
                            <span>Menginput data fasilitas pengolahan wilayah (Loseda, Bata Terawang, BSF, Bank Sampah).</span>
                          </li>
                        </>
                      )}

                      {guideRoleTab === "petugas" && (
                        <>
                          <li className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-emerald-600 text-base shrink-0">check_circle</span>
                            <span>Menjalankan penjemputan di window jam 06:00-08:00 &amp; 16:00-18:00 WIB.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-emerald-600 text-base shrink-0">check_circle</span>
                            <span>Memindai kode QR Tempat Sampah di lokasi warga menggunakan aplikasi Web Monitoring.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-emerald-600 text-base shrink-0">check_circle</span>
                            <span>Menginput data hasil timbangan fisik industri secara manual.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-emerald-600 text-base shrink-0">check_circle</span>
                            <span>Meningkatkan nilai KPI Petugas berdasarkan ketepatan waktu lapor dan akurasi AI.</span>
                          </li>
                        </>
                      )}

                      {guideRoleTab === "dlh" && (
                        <>
                          <li className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-emerald-600 text-base shrink-0">check_circle</span>
                            <span>Memantau dashboard eksekutif visual secara Read-Only (Akses Tulis Ditolak 403).</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-emerald-600 text-base shrink-0">check_circle</span>
                            <span>Data scoping otomatis: Admin DLH (Kota), Camat (Kecamatan), Lurah (Kelurahan).</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-emerald-600 text-base shrink-0">check_circle</span>
                            <span>Admin DLH mengevaluasi klaim diskrepansi setoran sampah AI confidence (&gt;90%).</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-emerald-600 text-base shrink-0">check_circle</span>
                            <span>Mengevaluasi Skor Kepatuhan &amp; Keandalan wilayah berbasis statistik Median.</span>
                          </li>
                        </>
                      )}

                      {guideRoleTab === "dpl" && (
                        <>
                          <li className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-emerald-600 text-base shrink-0">check_circle</span>
                            <span>Memantau progres pendampingan dan sosialisasi kelompok mahasiswa KKN di lokasi.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-emerald-600 text-base shrink-0">check_circle</span>
                            <span>Memeriksa absensi kehadiran dan logbook kegiatan harian mahasiswa.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-emerald-600 text-base shrink-0">check_circle</span>
                            <span>Mengevaluasi laporan capaian aktivasi tempat sampah warga per wilayah dampingan.</span>
                          </li>
                        </>
                      )}

                      {guideRoleTab === "superUser" && (
                        <>
                          <li className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-emerald-600 text-base shrink-0">check_circle</span>
                            <span>Menggenerasi dan mencetak Master QR Code Tempat Sampah batch baru (`PRINTED`).</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-emerald-600 text-base shrink-0">check_circle</span>
                            <span>Mengatur parameter konfigurasi sistem `system_configs` dan batasan operasional.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-emerald-600 text-base shrink-0">check_circle</span>
                            <span>Memantau log audit trail transaksi poin ledger dan perubahan data master.</span>
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Right Column: Visual Interactive Workflow Steps */}
                <div className="lg:col-span-7 space-y-4">
                  <h5 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-600 text-lg">alt_route</span>
                    Langkah Kerja Operasional ({guideRoleTab.toUpperCase()})
                  </h5>

                  <div className="space-y-3">
                    {guideRoleTab === "warga" && [
                      { step: 1, title: "1. Login WhatsApp OTP", desc: "Masuk tanpa NIK dengan nomor HP WhatsApp (+62) untuk mendapatkan kode OTP instan." },
                      { step: 2, title: "2. Cek Tempat Sampah Aktif", desc: "Lihat status Tempat Sampah Organik & Anorganik yang telah disetujui RW (Masa aktif 30 hari)." },
                      { step: 3, title: "3. Unggah Foto & Setor Sampah", desc: "Ambil foto bukti tempat sampah penuh dan kirim permohonan pengangkutan." },
                      { step: 4, title: "4. Terima Poin & Ajukan Ide", desc: "Setelah disetujui RW, poin ledger otomatis bertambah. Tambah poin dengan mengajukan ide daur ulang." },
                    ].map((s) => (
                      <div key={s.step} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/70 flex items-start gap-3">
                        <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                          0{s.step}
                        </span>
                        <div>
                          <h6 className="font-extrabold text-slate-900 text-xs">{s.title}</h6>
                          <p className="text-[11px] text-slate-600 font-medium leading-relaxed mt-0.5">{s.desc}</p>
                        </div>
                      </div>
                    ))}

                    {guideRoleTab === "kkn" && [
                      { step: 1, title: "1. Ambil Batch QR Code Master", desc: "Menerima QR Code Tempat Sampah berstatus `PRINTED` dari SUPER USER." },
                      { step: 2, title: "2. Scan Awal QR Code", desc: "Memindai kode QR untuk mengubah status menjadi `DIPEGANG_MAHASISWA`." },
                      { step: 3, title: "3. Registrasi Warga & Record GPS", desc: "Mendatangi warga, merekam lokasi GPS gawai, dan mengaitkan QR ke Warga (`PENDING_APPROVAL`)." },
                      { step: 4, title: "4. Poin Pendampingan & Handover", desc: "Menerima +10 poin atomik saat RW setuju, serta mencatat riwayat serah terima KKN." },
                    ].map((s) => (
                      <div key={s.step} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/70 flex items-start gap-3">
                        <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                          0{s.step}
                        </span>
                        <div>
                          <h6 className="font-extrabold text-slate-900 text-xs">{s.title}</h6>
                          <p className="text-[11px] text-slate-600 font-medium leading-relaxed mt-0.5">{s.desc}</p>
                        </div>
                      </div>
                    ))}

                    {guideRoleTab === "rw" && [
                      { step: 1, title: "1. Buka Portal Approval RW", desc: "Memeriksa daftar pengajuan tempat sampah warga baru (`PENDING_APPROVAL`)." },
                      { step: 2, title: "2. Verifikasi & Approval", desc: "Klik Setuju (`ACTIVE_BOUND`) untuk mengaktifkan tempat sampah & memicu poin Warga + KKN." },
                      { step: 3, title: "3. Manajemen Tempat Sampah Rusak", desc: "Tandai tempat sampah fisik yang rusak sebagai `BROKEN` agar QR tidak dapat digunakan lagi." },
                      { step: 4, title: "4. Input Fasilitas Pengolahan GIS", desc: "Menginput lokasi & data panen berkala Loseda, Bata Terawang, BSF, dan Bank Sampah." },
                    ].map((s) => (
                      <div key={s.step} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/70 flex items-start gap-3">
                        <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                          0{s.step}
                        </span>
                        <div>
                          <h6 className="font-extrabold text-slate-900 text-xs">{s.title}</h6>
                          <p className="text-[11px] text-slate-600 font-medium leading-relaxed mt-0.5">{s.desc}</p>
                        </div>
                      </div>
                    ))}

                    {guideRoleTab === "petugas" && [
                      { step: 1, title: "1. Standby Window Jam Operasional", desc: "Mulai penjemputan pada window jam 06:00-08:00 WIB atau 16:00-18:00 WIB." },
                      { step: 2, title: "2. Scan QR Tempat Sampah Warga", desc: "Pindai kode QR fisik tempat sampah di lokasi penjemputan warga." },
                      { step: 3, title: "3. Input Timbangan Fisik Manual", desc: "Masukkan angka hasil penimbangan fisik industri secara akurat ke dalam sistem." },
                      { step: 4, title: "4. Konfirmasi Selesai & Pantau KPI", desc: "Kirim laporan penjemputan dan pantau skor ketepatan waktu lapor harian." },
                    ].map((s) => (
                      <div key={s.step} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/70 flex items-start gap-3">
                        <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                          0{s.step}
                        </span>
                        <div>
                          <h6 className="font-extrabold text-slate-900 text-xs">{s.title}</h6>
                          <p className="text-[11px] text-slate-600 font-medium leading-relaxed mt-0.5">{s.desc}</p>
                        </div>
                      </div>
                    ))}

                    {(guideRoleTab === "dlh" || guideRoleTab === "dpl" || guideRoleTab === "superUser") && [
                      { step: 1, title: "1. Login Portal Terotorisasi", desc: "Masuk ke sistem sesuai kewenangan role masing-masing." },
                      { step: 2, title: "2. Pantau Real-Time Dashboard", desc: "Melihat grafik timbulan residu, peta sebaran fasilitas, dan indikator statistik wilayah." },
                      { step: 3, title: "3. Evaluasi & Manajemen Data", desc: "Melakukan peninjauan diskrepansi AI, absensi KKN, atau master data QR Code." },
                      { step: 4, title: "4. Unduh Laporan Lanjutan", desc: "Mengekspor laporan rekapitulasi untuk evaluasi berkala kebersihan wilayah." },
                    ].map((s) => (
                      <div key={s.step} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/70 flex items-start gap-3">
                        <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                          0{s.step}
                        </span>
                        <div>
                          <h6 className="font-extrabold text-slate-900 text-xs">{s.title}</h6>
                          <p className="text-[11px] text-slate-600 font-medium leading-relaxed mt-0.5">{s.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>

              </div>

              {/* Bottom CTA to Download PDF & Full Panduan Page */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                  <span className="material-symbols-outlined text-emerald-600 text-base">picture_as_pdf</span>
                  <span>Unduh atau cetak dokumen resmi Buku Panduan Operasional TrashCare format PDF.</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={downloadPanduanPdf}
                    className="btn-primary-clean text-xs px-6 py-2.5 shadow-md cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">download</span>
                    Unduh Buku Panduan Lengkap (PDF)
                  </button>
                  <Link
                    to="/panduan"
                    className="btn-secondary-clean text-xs px-4 py-2.5"
                  >
                    <span className="material-symbols-outlined text-base">menu_book</span>
                    Modul Web
                  </Link>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ----------------- 05. WHAT WE DO (Hapus/Sembunyikan sementara sesuai notulensi) ----------------- */}
      {/* 
      <section id="what-we-do" className="py-24 bg-slate-50/50">
        <div className="container-custom space-y-12">
          <div className="text-center space-y-2">
            <span className="text-emerald-600 font-extrabold text-sm uppercase tracking-wider">05. DAUR ULANG &amp; GIS</span>
            <h2 className="text-4xl font-extrabold text-slate-900">Pemanfaatan Hilir &amp; Fasilitas GIS</h2>
            <p className="text-slate-500 text-sm font-medium">Pengolahan sampah terintegrasi di wilayah pemukiman</p>
          </div>
        </div>
      </section>
      */}

      {/* ----------------- FOOTER (FULL WIDTH EDGE-TO-EDGE) ----------------- */}
      <footer className="w-full bg-white border-t border-slate-200/80 pt-16 pb-12 relative overflow-hidden text-slate-700">

        {/* Leaf Watermark in Bottom Right of Full Footer */}
        <div className="absolute -bottom-10 -right-10 opacity-10 pointer-events-none">
          <svg className="w-96 h-96 fill-emerald-600" viewBox="0 0 100 100">
            <path d="M 50 10 C 20 40 10 70 50 90 C 90 70 80 40 50 10 Z" />
            <path d="M 50 10 L 50 90" stroke="#ffffff" strokeWidth="4" />
          </svg>
        </div>

        <div className="container-custom space-y-12 relative z-10">

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

            {/* Column 1: Brand & Socials (md:col-span-5) */}
            <div className="md:col-span-5 space-y-5">
              <div className="flex items-center gap-3">
                <TrashCareLogoIcon className="w-10 h-10 shrink-0" />
                <div>
                  <h4 className="text-xl font-extrabold text-slate-900 leading-none">
                    <span className="text-sky-600">Trash</span>
                    <span className="text-emerald-600">Care</span>
                  </h4>
                  <p className="text-[11px] font-bold text-slate-500 mt-1">
                    Tata Kelola Sampah Berkelanjutan
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed font-medium max-w-sm">
                Program kolaboratif mahasiswa dan masyarakat untuk memperkuat edukasi, pemilahan, pengolahan, serta pemantauan sampah secara terukur dan berkelanjutan.
              </p>

              {/* Green Social Icons */}
              <div className="flex items-center gap-2.5 pt-1">
                <a href="#instagram" aria-label="Instagram" className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 transition shadow-2xs">
                  <span className="material-symbols-outlined text-base">photo_camera</span>
                </a>
                <a href="#facebook" aria-label="Facebook" className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 transition shadow-2xs">
                  <span className="material-symbols-outlined text-base">public</span>
                </a>
                <a href="#youtube" aria-label="YouTube" className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 transition shadow-2xs">
                  <span className="material-symbols-outlined text-base">play_circle</span>
                </a>
                <a href="#whatsapp" aria-label="WhatsApp" className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 transition shadow-2xs">
                  <span className="material-symbols-outlined text-base">chat</span>
                </a>
              </div>
            </div>

            {/* Column 2: Menu (md:col-span-2) */}
            <div className="md:col-span-2 space-y-3">
              <h5 className="font-extrabold text-sm text-emerald-800">Menu</h5>
              <ul className="space-y-2 text-xs text-slate-600 font-medium">
                <li><button onClick={() => scrollToSection("#")} className="hover:text-emerald-700 transition">Beranda</button></li>
                <li><button onClick={() => scrollToSection("#about")} className="hover:text-emerald-700 transition">Tentang</button></li>
                <li><button onClick={() => scrollToSection("#why-us")} className="hover:text-emerald-700 transition">Program</button></li>
                <li><button onClick={() => scrollToSection("#guide")} className="hover:text-emerald-700 transition">Kegiatan</button></li>
                <li><button onClick={() => scrollToSection("#faq")} className="hover:text-emerald-700 transition">Dampak</button></li>
                <li><button onClick={() => setShowContactModal(true)} className="hover:text-emerald-700 transition">Kontak</button></li>
              </ul>
            </div>

            {/* Column 3: Informasi (md:col-span-2) */}
            <div className="md:col-span-2 space-y-3">
              <h5 className="font-extrabold text-sm text-emerald-800">Informasi</h5>
              <ul className="space-y-2 text-xs text-slate-600 font-medium">
                <li><button onClick={() => scrollToSection("#about")} className="hover:text-emerald-700 transition">Tentang KKN</button></li>
                <li><button onClick={() => scrollToSection("#why-us")} className="hover:text-emerald-700 transition">Lokasi &amp; Periode</button></li>
                <li><button onClick={() => scrollToSection("#guide")} className="hover:text-emerald-700 transition">Tim &amp; DPL</button></li>
                <li><button onClick={() => scrollToSection("#why-us")} className="hover:text-emerald-700 transition">Mitra</button></li>
                <li><Link to="/panduan" className="hover:text-emerald-700 transition">Panduan Penggunaan</Link></li>
                <li><button onClick={() => setShowContactModal(true)} className="hover:text-emerald-700 transition">Kebijakan Privasi</button></li>
              </ul>
            </div>

            {/* Column 4: Kontak (md:col-span-3) */}
            <div className="md:col-span-3 space-y-3">
              <h5 className="font-extrabold text-sm text-emerald-800">Kontak</h5>
              <ul className="space-y-2.5 text-xs text-slate-600 font-medium">
                <li className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-emerald-600 text-base shrink-0">location_on</span>
                  <span>Jl. Dipatiukur No.112-116 Bandung, Jawa Barat 40132</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-emerald-600 text-base shrink-0">mail</span>
                  <span>info@unikom.ac.id</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-emerald-600 text-base shrink-0">call</span>
                  <span>(022) 2504119</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-emerald-600 text-base shrink-0">chat</span>
                  <span>+62812-3456-7890</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom Divider & Copyright */}
          <div className="border-t border-slate-200/70 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
            <div>
              © 2026 UNIVERSITAS KOMPUTER INDONESIA ALL RIGHTS RESERVED.
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200 shadow-2xs">
              <span>v1.0.0</span>
            </span>
          </div>

        </div>
      </footer>

      {/* ----------------- CONTACT US MODAL ----------------- */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 space-y-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600">contact_support</span>
                Hubungi Kami
              </h3>
              <button onClick={() => setShowContactModal(false)} className="text-slate-400 hover:text-slate-600 transition">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p className="font-medium">
                Untuk informasi seputar sistem pemilahan sampah cerdas KKN Berdampak dan kerja sama operasional, silakan hubungi CDC UNIKOM:
              </p>
              <div className="p-4 bg-slate-50 rounded-2xl space-y-2 font-bold text-slate-800">
                <p>🏢 Tim KKN Berdampak UNIKOM</p>
                <p>📍 Jl. Dipati Ukur No. 112-116, Bandung, Jawa Barat 40132</p>
                <p>📧 Email: kknberdampak@unikom.ac.id</p>
                <p>🌐 Website: https://unikom.ac.id</p>
              </div>
            </div>

            <button
              onClick={() => setShowContactModal(false)}
              className="btn-primary-clean text-xs w-full py-3 justify-center"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* ----------------- APK DOWNLOAD MODAL ----------------- */}
      {showApkModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 space-y-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600">android</span>
                Unduh Aplikasi Mobile
              </h3>
              <button onClick={() => setShowApkModal(false)} className="text-slate-400 hover:text-slate-600 transition">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="text-center py-2 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <span className="material-symbols-outlined text-3xl">download_for_offline</span>
              </div>
              <h4 className="font-bold text-slate-900 text-base">Aplikasi Mobile TrashCare</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                File instalasi rilis APK Android sedang diproses. Tautan unduhan langsung akan segera aktif.
              </p>
            </div>

            <button
              onClick={() => setShowApkModal(false)}
              className="btn-primary-clean text-xs w-full py-3 justify-center"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default LandingPage;
