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

  const [whyUsTab, setWhyUsTab] = useState<"points" | "bins">("points");
  const [whatTab, setWhatTab] = useState<"pemilahan" | "pemanfaatan">("pemilahan");
  const [showContactModal, setShowContactModal] = useState<boolean>(false);
  const [showApkModal, setShowApkModal] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<string>("");
  
  // Interactive User Guide & Flow state
  const [guideRoleTab, setGuideRoleTab] = useState<"warga" | "kkn" | "rw" | "petugas" | "dlh" | "dpl" | "superadmin">("warga");
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
    const sections = ["#about", "#why-us", "#how-it-works", "#guide", "#what-we-do"];
    
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
                onClick={() => scrollToSection("#how-it-works")}
                className={activeSection === "#how-it-works" ? "active text-emerald-600 font-extrabold" : ""}
              >
                Cara Kerja
              </button>
              <button
                onClick={() => scrollToSection("#guide")}
                className={activeSection === "#guide" ? "active text-emerald-600 font-extrabold" : ""}
              >
                Buku Panduan
              </button>
              <button
                onClick={() => scrollToSection("#what-we-do")}
                className={activeSection === "#what-we-do" ? "active text-emerald-600 font-extrabold" : ""}
              >
                Daur Ulang
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
                Register / Login
              </Link>
            )}

            <button
              onClick={() => setShowContactModal(true)}
              className="btn-secondary-clean hidden sm:inline-flex"
            >
              Contact Us
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
                Sistem Pemilahan Sampah Cerdas • Kecamatan Coblong
              </div>
            </div>
            
            {/* Large Spacious Headline */}
            <h1 className="hero-title-main">
              Sampah <span className="text-blue-hero">Tertata</span>,<br />
              Lingkungan <span className="text-green-hero">Terdata</span>
            </h1>

            <p className="text-slate-600 text-base leading-relaxed font-medium">
              Sistem tata kelola sampah terintegrasi dengan pendekatan kegiatan KKN berdampak yang menghubungkan warga, petugas residu, mahasiswa, dosen pendamping lapangan, pimpinan perguruan tinggi, RW, kelurahan, kecamatan, dan Dinas Lingkungan Hidup.
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
                onClick={() => setShowApkModal(true)}
                className="btn-primary-clean px-8 py-3.5 text-base"
              >
                Unduh Aplikasi Mobile
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </button>

              <button onClick={() => scrollToSection("#about")} className="btn-secondary-clean px-8 py-3.5 text-base">
                Pelajari Lebih Lanjut
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
                  <span className="text-[11px] font-bold text-slate-400 ml-2 hidden sm:inline">TrashCare Web Monitoring App</span>
                </div>
                <div className="px-4 py-0.5 bg-white border border-slate-200 rounded-full text-[10px] text-slate-500 font-semibold flex items-center gap-1.5 shadow-2xs">
                  <span className="material-symbols-outlined text-xs text-emerald-600">lock</span>
                  <span>https://trashcare.id/dashboard</span>
                </div>
                <div className="text-[10px] font-extrabold text-emerald-600 hidden sm:block">LIVE PREVIEW</div>
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
                        <span className="text-[8px] font-bold text-slate-400 mt-0.5">COBLONG</span>
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
                          Wilayah: Coblong
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
                          <h4 className="font-extrabold text-[11px] text-slate-900">Trend Setoran Sampah (Real-time)</h4>
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
                          <h4 className="font-extrabold text-[11px] text-slate-900">Top Warga &amp; Wilayah Teraktif • Kecamatan Coblong</h4>
                        </div>
                        <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">LIVE RANKING</span>
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
                              <td className="py-1.5 px-3 font-bold text-slate-900">Andi Pratama</td>
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
                              <td className="py-1.5 px-3 font-bold text-slate-900">Siti Rahmawati</td>
                              <td className="py-1.5 px-3 text-slate-500">RT 02/RW 03, Kel. Sekeloa</td>
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
                              <td className="py-1.5 px-3 font-bold text-slate-900">Budi Santoso</td>
                              <td className="py-1.5 px-3 text-slate-500">RT 04/RW 05, Kel. Sadang Serang</td>
                              <td className="py-1.5 px-3 text-right font-extrabold text-slate-900">98 Kg</td>
                              <td className="py-1.5 px-3 text-center">
                                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">92%</span>
                              </td>
                              <td className="py-1.5 px-3 text-right font-black text-emerald-600">3.900 Poin</td>
                            </tr>
                            <tr className="hover:bg-emerald-50/40 transition">
                              <td className="py-1.5 px-3 font-bold text-slate-500">#4</td>
                              <td className="py-1.5 px-3 font-bold text-slate-900">Rina Wijaya</td>
                              <td className="py-1.5 px-3 text-slate-500">RT 03/RW 01, Kel. Lebak Gede</td>
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

      {/* ----------------- 01. ABOUT US ----------------- */}
      <section id="about" className="py-24 bg-white border-y border-slate-200/80 relative overflow-hidden">
        <div className="container-custom space-y-16">
          
          {/* About Header Narrative */}
          <div className="max-w-4xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm text-emerald-600">nature_people</span>
              01. About Us &amp; Ecosystem Vision
            </div>

            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Sistem Pemilahan Sampah Cerdas <span className="text-emerald-600">Kecamatan Coblong</span>
            </h2>

            <p className="text-slate-600 text-lg leading-relaxed font-medium">
              TrashCare adalah platform tata kelola kebersihan terpadu yang menghubungkan masyarakat, mahasiswa KKN, pengurus RW, dan petugas residu di Kecamatan Coblong, Kota Bandung. Sistem mengedepankan transparansi pencatatan, pemilahan mandiri, dan gamifikasi poin tanpa penggunaan NIK.
            </p>

            <div className="flex flex-wrap gap-2.5 pt-2">
              {["Auth WhatsApp OTP (+62)", "Tanpa NIK", "Maks 2 Bin Mandiri", "Window Penjemputan 06-08 & 16-18", "Timbangan Fisik Residu"].map((tag, idx) => (
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
              <h3 className="text-xl font-black text-slate-900">1. Pemilahan 2 Tempat Sampah</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Setiap rumah tangga berhak mendaftarkan 1 Tempat Sampah Organik dan 1 Tempat Sampah Anorganik berlabel QR. Sampah residu dipisahkan dan ditimbang di hilir.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-black text-emerald-600">
                <span>Masa Aktif Bin 30 Hari</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </div>
            </div>

            <div className="about-pillar-card space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">stars</span>
              </div>
              <h3 className="text-xl font-black text-slate-900">2. Ledger Poin Atomik</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Pencatatan poin Warga &amp; Mahasiswa menggunakan skema ledger terpisah di database. Pengajuan setoran disetujui RW sebelum poin bertambah.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-black text-emerald-600">
                <span>Transparansi Audit</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </div>
            </div>

            <div className="about-pillar-card space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">groups</span>
              </div>
              <h3 className="text-xl font-black text-slate-900">3. Pendampingan KKN</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Mahasiswa KKN merekam koordinat GPS lokasi tempat sampah saat pendaftaran warga dan membantu sosialisasi pemilahan sampah di wilayah.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-black text-emerald-600">
                <span>Serah Terima Wilayah KKN</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </div>
            </div>

            <div className="about-pillar-card space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">compost</span>
              </div>
              <h3 className="text-xl font-black text-slate-900">4. Pemanfaatan Hilir</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Fasilitas pemanfaatan meliputi Loseda (pipa kompos dapur), Bata Terawang, Rumah Maggot BSF, Bank Sampah, dan budidaya ternak.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-black text-emerald-600">
                <span>Monitoring Laporan Panen</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </div>
            </div>

          </div>

          {/* Clean Light Sustainable Development Goals (SDGs) Grid */}
          <div className="bg-gradient-to-br from-emerald-50/70 via-white to-slate-50 rounded-3xl p-8 sm:p-12 border border-emerald-100/90 space-y-8 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-100/80 pb-6">
              <div>
                <span className="text-emerald-700 text-xs font-black uppercase tracking-widest">GLOBAL IMPACT TARGETS</span>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                  Pencapaian Tujuan Pembangunan Berkelanjutan (SDGs)
                </h3>
              </div>
              <p className="text-xs text-slate-600 max-w-md font-medium">
                TrashCare mendukung indikator utama PBB dalam mewujudkan lingkungan Kecamatan Coblong yang bersih, sehat, dan berkelanjutan.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { num: "3", title: "Kehidupan Sehat & Sejahtera", desc: "Mencegah penumpukan sampah liar penular penyakit." },
                { num: "11", title: "Kota & Permukiman Berkelanjutan", desc: "Menata sistem kebersihan lingkungan Coblong." },
                { num: "12", title: "Konsumsi & Produksi Bertanggung Jawab", desc: "Memaksimalkan daur ulang dan kompos limbah." },
                { num: "13", title: "Penanganan Perubahan Iklim", desc: "Reduksi emisi gas metana dari sampah organik." },
                { num: "15", title: "Ekosistem Daratan", desc: "Menjaga kualitas tanah dan sumber air bersih." },
              ].map((sdg) => (
                <div key={sdg.num} className="clean-sdg-card space-y-3 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800">SDG TARGET</span>
                    <span className="text-2xl font-black text-emerald-600">#{sdg.num}</span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-sm leading-snug">{sdg.title}</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-medium">{sdg.desc}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ----------------- 02. WHY US ----------------- */}
      <section id="why-us" className="py-24 bg-slate-50/70 border-b border-slate-200/80">
        <div className="container-custom space-y-12">
          
          <div className="max-w-3xl mx-auto text-center space-y-3">
            <span className="text-emerald-600 text-xs font-black uppercase tracking-widest">02. WHY US</span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">Mengapa Aplikasi Ini?</h2>
            <p className="text-slate-600 text-base sm:text-lg font-medium">
              Solusi tata kelola sampah rumah tangga terintegrasi untuk Kecamatan Coblong, Kota Bandung.
            </p>

            {/* Clean Interactive Pills */}
            <div className="inline-flex items-center gap-2 p-1.5 bg-white rounded-full border border-slate-200/80 shadow-2xs mt-4">
              <button
                onClick={() => setWhyUsTab("points")}
                className={`clean-interactive-tab ${whyUsTab === "points" ? "active" : ""}`}
              >
                Point-Based Gamification
              </button>
              <button
                onClick={() => setWhyUsTab("bins")}
                className={`clean-interactive-tab ${whyUsTab === "bins" ? "active" : ""}`}
              >
                Manajemen Tempat Sampah
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
                    <span className="font-extrabold text-lg text-slate-900">Point-Based Ledger System</span>
                  </div>
                  <span className="text-xs px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full font-bold">Reward &amp; Audit</span>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  Pencatatan poin Warga dan Mahasiswa KKN menggunakan ledger terpisah di database demi transparansi audit. Setiap setoran sampah berhadiah poin insentif, dan pengajuan ide daur ulang yang disetujui RW memberikan reward tambahan (+50 poin).
                </p>

                <div className="grid grid-cols-3 gap-4 pt-2 text-center">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Level Warga</span>
                    <p className="text-2xl font-black text-emerald-600">Level 8</p>
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
            ) : (
              <div className="bg-white text-slate-900 p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-md space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <span className="material-symbols-outlined text-xl">delete</span>
                    </div>
                    <span className="font-extrabold text-lg text-slate-900">Aturan Tempat Sampah (Bin)</span>
                  </div>
                  <span className="text-xs px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-bold">QR Validation</span>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  Setiap rumah tangga berhak mendaftarkan maksimal 2 tempat sampah (1 Organik &amp; 1 Anorganik). Tempat sampah aktif selama 30 hari dan di-reset otomatis setiap setoran. Penjemputan residu dipisahkan dan ditimbang manual oleh Petugas Residu.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-black text-slate-900">Tong Organik #01</p>
                      <p className="text-xs text-slate-500 font-medium">Aktif (20L Standar)</p>
                    </div>
                    <span className="text-xs font-black px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl">25% Terisi</span>
                  </div>
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-black text-slate-900">Tong Anorganik #02</p>
                      <p className="text-xs text-slate-500 font-medium">Aktif (20L Standar)</p>
                    </div>
                    <span className="text-xs font-black px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl">50% Terisi</span>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* ----------------- 03. HOW IT WORKS ----------------- */}
      <section id="how-it-works" className="py-24 bg-white border-b border-slate-200/80">
        <div className="container-custom space-y-16">
          <div className="text-center space-y-2">
            <span className="text-emerald-600 font-extrabold text-sm uppercase tracking-wider">03. How</span>
            <h2 className="text-4xl font-extrabold text-slate-900">Bagaimana Cara Kerja Aplikasi</h2>
            <p className="text-slate-500 text-sm font-medium">Terintegrasi dan transparan dari hulu ke hilir</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {[
              { icon: "delete", num: "1", title: "Pilah Sampah", desc: "Pilah sampah mandiri sesuai kategori Organik dan Anorganik." },
              { icon: "schedule", num: "2", title: "Window Waktu", desc: "Pengangkutan di window 06:00-08:00 & 16:00-18:00." },
              { icon: "qr_code_scanner", num: "3", title: "Scan & Angkut", desc: "Petugas melakukan pengangkutan dan memindai kode QR Tempat Sampah." },
              { icon: "scale", num: "4", title: "Timbangan Fisik", desc: "Hasil timbangan diinput manual oleh Petugas Residu." },
              { icon: "account_balance_wallet", num: "5", title: "Poin Disetujui RW", desc: "Poin insentif warga bertambah atomik setelah diverifikasi RW." },
            ].map((step) => (
              <div key={step.num} className="waste-cat-card text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-slate-100">
                  <span className="material-symbols-outlined text-3xl">{step.icon}</span>
                </div>
                <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">Langkah {step.num}</span>
                <h3 className="font-extrabold text-slate-900 text-base mt-1 mb-1">{step.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
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
              Memahami siklus tata kelola sampah terintegrasi dari hulu ke hilir serta fitur interaktif untuk tiap peran pengguna di Kecamatan Coblong.
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
                  className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between h-28 ${
                    activeFlowStep === item.step
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-md scale-[1.02]"
                      : "bg-slate-50 text-slate-700 border-slate-200/80 hover:border-emerald-500 hover:bg-emerald-50/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`w-7 h-7 rounded-xl text-xs font-black flex items-center justify-center ${
                        activeFlowStep === item.step ? "bg-white text-emerald-700" : "bg-emerald-100 text-emerald-800"
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
                    <span className="px-2.5 py-1 bg-white text-emerald-800 rounded-lg border border-emerald-200">Status Bin: PRINTED → DIPEGANG_MAHASISWA → PENDING_APPROVAL</span>
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
                    <span className="px-2.5 py-1 bg-white text-emerald-800 rounded-lg border border-emerald-200">Input Data: Manual Physical Scale Reading</span>
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
                    <span className="px-2.5 py-1 bg-white text-emerald-800 rounded-lg border border-emerald-200">Reward: +10 Poin Warga, +10 Poin KKN, +50 Ide Daur Ulang</span>
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
                    <span className="px-2.5 py-1 bg-white text-emerald-800 rounded-lg border border-emerald-200">Akses: Read-Only Executive Dashboard &amp; Peta GIS</span>
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
                { key: "superadmin", label: "Super Admin", icon: "admin_panel_settings" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setGuideRoleTab(tab.key as any)}
                  className={`px-4 py-2.5 rounded-full text-xs font-extrabold transition-all duration-200 flex items-center gap-2 border ${
                    guideRoleTab === tab.key
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
                        {guideRoleTab === "superadmin" && "admin_panel_settings"}
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
                        {guideRoleTab === "superadmin" && "Panduan Peran: Super Administrator"}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">Kecamatan Coblong, Kota Bandung</p>
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
                    {guideRoleTab === "dlh" ? "Aksabilitas: Read-Only Scoped Guard" : "Aksabilitas: Operasional & Management"}
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

                      {guideRoleTab === "superadmin" && (
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
                      { step: 1, title: "1. Ambil Batch QR Code Master", desc: "Menerima QR Code Tempat Sampah berstatus `PRINTED` dari Super Admin." },
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

                    {(guideRoleTab === "dlh" || guideRoleTab === "dpl" || guideRoleTab === "superadmin") && [
                      { step: 1, title: "1. Login Portal Terotorisasi", desc: "Masuk ke sistem sesuai kewenangan role masing-masing." },
                      { step: 2, title: "2. Pantau Real-Time Dashboard", desc: "Melihat grafik timbulan residu, peta sebaran fasilitas, dan indikator statistik wilayah." },
                      { step: 3, title: "3. Evaluasi & Manajemen Data", desc: "Melakukan peninjauan diskrepansi AI, absensi KKN, atau master data QR Code." },
                      { step: 4, title: "4. Unduh Laporan Lanjutan", desc: "Mengekspor laporan rekapitulasi untuk evaluasi berkala kebersihan Kecamatan Coblong." },
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

      {/* ----------------- 05. WHAT WE DO ----------------- */}
      <section id="what-we-do" className="py-24 bg-slate-50/50">
        <div className="container-custom space-y-12">
          <div className="text-center space-y-2">
            <span className="text-emerald-600 font-extrabold text-sm uppercase tracking-wider">05. What</span>
            <h2 className="text-4xl font-extrabold text-slate-900">Pemanfaatan Hilir &amp; Fasilitas GIS</h2>
            <p className="text-slate-500 text-sm font-medium">Pengolahan sampah terintegrasi di wilayah Kecamatan Coblong</p>

            <div className="inline-flex p-1 bg-white border border-slate-200 rounded-full mt-4">
              <button
                onClick={() => setWhatTab("pemilahan")}
                className={`clean-interactive-tab ${whatTab === "pemilahan" ? "active" : ""}`}
              >
                Kategori Pemilahan
              </button>
              <button
                onClick={() => setWhatTab("pemanfaatan")}
                className={`clean-interactive-tab ${whatTab === "pemanfaatan" ? "active" : ""}`}
              >
                Fasilitas Pemanfaatan GIS
              </button>
            </div>
          </div>

          {whatTab === "pemilahan" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {[
                { title: "Plastik", icon: "local_drink", color: "text-emerald-600", desc: "Didaur ulang menjadi produk kerajinan & modul ecobrick." },
                { title: "Kertas", icon: "description", color: "text-amber-500", desc: "Kardus & koran diolah kembali menjadi bubur kertas daur ulang." },
                { title: "Logam", icon: "hardware", color: "text-slate-600", desc: "Kaleng & potongan besi disalurkan ke mitra peleburan logam." },
                { title: "Kaca", icon: "wine_bar", color: "text-emerald-500", desc: "Botol kaca disalurkan ke industri daur ulang kaca utuh." },
                { title: "Organik", icon: "eco", color: "text-green-600", desc: "Sisa dapur diolah di Loseda, Bata Terawang, & Budidaya Maggot BSF." },
              ].map((cat, idx) => (
                <div key={idx} className="waste-cat-card text-center space-y-3">
                  <div className={`w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto border border-slate-100 ${cat.color}`}>
                    <span className="material-symbols-outlined text-3xl">{cat.icon}</span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-base">{cat.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">{cat.desc}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: "Loseda & Bata Terawang",
                  type: "Kompos Dapur",
                  desc: "Pipa kompos Loseda dan lubang Bata Terawang untuk pengolahan sisa makanan organik tingkat rumah tangga.",
                  icon: "compost"
                },
                {
                  title: "Rumah Maggot BSF",
                  type: "Pakan Ternak",
                  desc: "Pengolahan cepat limbah organik menggunakan larva Black Soldier Fly (BSF) sebagai pakan lele/ayam.",
                  icon: "set_meal"
                },
                {
                  title: "Bank Sampah & Ecobrick",
                  type: "Anorganik",
                  desc: "Penyaluran material daur ulang dan modul ecobrick terdata melalui pemetaan fasilitas GIS.",
                  icon: "layers"
                },
              ].map((item, idx) => (
                <div key={idx} className="bg-white border border-slate-200/80 rounded-3xl p-8 space-y-4 hover:shadow-xl transition duration-300">
                  <div className="flex items-center justify-between">
                    <span className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                    </span>
                    <span className="text-xs font-extrabold px-3 py-1 bg-slate-100 text-slate-700 rounded-full">{item.type}</span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-lg">{item.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ----------------- FOOTER ----------------- */}
      <footer className="bg-slate-900 text-slate-400 py-16 text-sm border-t border-slate-800">
        <div className="container-custom grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-white font-black text-xl">
              <TrashCareLogoIcon className="w-8 h-8" />
              <span className="text-white">Trash<span className="text-emerald-400">Care</span></span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Sistem Pemilahan &amp; Pengelolaan Sampah Terintegrasi Kecamatan Coblong, Kota Bandung.
            </p>
            <p className="text-xs text-slate-500 font-semibold">© 2026 UNIKOM. All rights reserved.</p>
          </div>

          <div>
            <h5 className="text-white font-extrabold text-xs uppercase tracking-wider mb-4">Navigasi</h5>
            <ul className="space-y-2.5 text-xs font-semibold">
              <li><button onClick={() => scrollToSection("#about")} className="hover:text-white transition">Tentang Kami</button></li>
              <li><button onClick={() => scrollToSection("#why-us")} className="hover:text-white transition">Mengapa Aplikasi Ini</button></li>
              <li><button onClick={() => scrollToSection("#how-it-works")} className="hover:text-white transition">Cara Kerja</button></li>
              <li><button onClick={() => scrollToSection("#guide")} className="hover:text-white transition">Buku Panduan</button></li>
              <li><button onClick={() => scrollToSection("#what-we-do")} className="hover:text-white transition">Daur Ulang</button></li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-extrabold text-xs uppercase tracking-wider mb-4">Layanan</h5>
            <ul className="space-y-2.5 text-xs font-semibold">
              <li><Link to="/login" className="hover:text-white transition">Portal Dashboard</Link></li>
              <li><button onClick={() => scrollToSection("#how-it-works")} className="hover:text-white transition">Jadwal Pengangkutan</button></li>
              <li><button onClick={() => scrollToSection("#about")} className="hover:text-white transition">Pendampingan KKN</button></li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-extrabold text-xs uppercase tracking-wider mb-4">Kontak</h5>
            <ul className="space-y-2.5 text-xs font-semibold">
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-base text-slate-400">location_on</span>
                <span>Kecamatan Coblong, Kota Bandung, Jawa Barat</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-base text-slate-400">mail</span>
                <span>support@trashcare.id</span>
              </li>
            </ul>
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
                Hubungi Kami (Contact Us)
              </h3>
              <button onClick={() => setShowContactModal(false)} className="text-slate-400 hover:text-slate-600 transition">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p className="font-medium">
                Untuk informasi seputar sistem pemilahan sampah cerdas Kecamatan Coblong atau kerjasama operasional:
              </p>
              <div className="p-4 bg-slate-50 rounded-2xl space-y-2 font-bold text-slate-800">
                <p>📍 Kantor Kecamatan Coblong, Kota Bandung</p>
                <p>📧 Email: info@trashcare.id / makerindo@gmail.com</p>
                <p>📞 Whatsapp Support: +62 812-3456-7890</p>
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
              <h4 className="font-bold text-slate-900 text-base">TrashCare Mobile App</h4>
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
