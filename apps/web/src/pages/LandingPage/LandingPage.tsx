/**
 * Project: TrashCare Landing Page (Update CTA button text to 'Register / Login')
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import "./LandingPage.css";
import { Icon } from "@iconify/react";

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

  const [whyUsTab, setWhyUsTab] = useState<
    "points" | "bins" | "iot"
  >("points");
  const [showContactModal, setShowContactModal] = useState<boolean>(false);
  const [showApkModal, setShowApkModal] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<string>("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const scrollToSection = (id: string) => {
    setIsMobileMenuOpen(false);
    const targetId = id.startsWith("#") ? id : `#${id}`;
    const element =
      document.querySelector(targetId) ||
      document.querySelector(targetId.toLowerCase()) ||
      document.querySelector(targetId.toUpperCase()) ||
      document.querySelector("#mitra") ||
      document.querySelector("#Mitra");

    if (element) {
      window.history.pushState(null, "", targetId.toLowerCase());
      setActiveSection(targetId.toLowerCase());

      const navbarOffset = 80;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - navbarOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
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
    const sections = [
      "#about",
      "#why-us",
      "#program",
      "#dampak",
      "#mitra",
      "#faq"
    ];

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const scrollHeight = document.documentElement.scrollHeight;

      if (scrollY < 150) {
        window.history.replaceState(null, "", window.location.pathname);
        setActiveSection("");
        return;
      }

      // Check if user has scrolled near the bottom of the page (where #faq is located)
      const isAtBottom = windowHeight + scrollY >= scrollHeight - 120;
      if (isAtBottom) {
        if (window.location.hash !== "#faq") {
          window.history.replaceState(null, "", "#faq");
        }
        setActiveSection("#faq");
        return;
      }

      let currentSection = "";
      for (const sectionId of sections) {
        const el =
          document.querySelector(sectionId) ||
          document.querySelector("#Mitra") ||
          document.querySelector(sectionId.toLowerCase());

        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 250 && rect.bottom >= 150) {
            currentSection = sectionId.toLowerCase();
            break;
          }
        }
      }

      if (currentSection) {
        if (window.location.hash !== currentSection) {
          window.history.replaceState(null, "", currentSection);
        }
        setActiveSection(currentSection);
      }
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () =>
      window.removeEventListener("scroll", handleScroll);
  }, []);

  const handlePreviewClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate("/login");
  };

  const sdgs = [
    {
      num: 3,
      img: "/image/sdg/SDG-3.svg",
      title: "Kehidupan Sehat & Sejahtera",
      desc: "Mencegah penumpukan sampah liar dan meningkatkan kesehatan masyarakat.",
    },
    {
      num: 11,
      img: "/image/sdg/SDG-11.svg",
      title: "Kota & Permukiman Berkelanjutan",
      desc: "Mewujudkan lingkungan yang bersih dan tertata.",
    },
    {
      num: 12,
      img: "/image/sdg/SDG-12.svg",
      title: "Konsumsi & Produksi Bertanggung Jawab",
      desc: "Mendorong pemilahan, daur ulang, dan pengelolaan sampah.",
    },
    {
      num: 13,
      img: "/image/sdg/SDG-13.svg",
      title: "Penanganan Perubahan Iklim",
      desc: "Mengurangi emisi dari sampah organik melalui pengolahan.",
    },
    {
      num: 15,
      img: "/image/sdg/SDG-15.svg",
      title: "Menjaga Ekosistem Daratan",
      desc: "Melindungi tanah, sungai, dan lingkungan hidup.",
    },
  ];


  return (
    <div className="landing-page min-h-screen relative selection:bg-emerald-500 selection:text-white">

      {/* ----------------- CENTERED MODERN NAVBAR ----------------- */}
      <nav className="landing-nav py-4">
        <div className="container-custom flex items-center justify-between relative">

          {/* Logo Branding */}
          <Link
            to="/"
            onClick={handleLogoClick}
            className="flex items-center gap-2 group shrink-0"
          >
            <TrashCareLogoIcon className="w-9 h-9 sm:w-11 sm:h-11 translate-y-[2px] sm:translate-y-[4px] transition-transform group-hover:scale-105 shrink-0" />

            <div className="flex flex-col text-left justify-center">
              <span className="text-xl sm:text-2xl font-black tracking-tight leading-none">
                <span className="text-sky-600">Trash</span>
                <span className="text-emerald-600">Care</span>
              </span>
              <span className="text-[8px] sm:text-[10px] font-extrabold text-slate-500 tracking-wider uppercase mt-1 leading-none">
                Pilah Sampah Cerdas
              </span>
            </div>
          </Link>

          {/* Navigation Links (ABSOLUTE PERFECT CENTER BETWEEN LEFT & RIGHT) */}
          <div className="hidden lg:flex items-center justify-center absolute left-1/2 -translate-x-1/2">
            <div className="nav-links-centered">
              <button
                onClick={() => scrollToSection("#about")}
                className={`transition-colors duration-300 ${activeSection === "#about"
                  ? "text-emerald-600 font-extrabold active"
                  : "text-gray-700"
                  }`}
              >
                Tentang Kami
              </button>

              <button
                onClick={() => scrollToSection("#why-us")}
                className={`transition-colors duration-300 ${activeSection === "#why-us"
                  ? "text-emerald-600 font-extrabold active"
                  : "text-gray-700"
                  }`}
              >
                Mengapa Aplikasi Ini
              </button>

              <button
                onClick={() => scrollToSection("#dampak")}
                className={`transition-colors duration-300 ${activeSection === "#dampak"
                  ? "text-emerald-600 font-extrabold active"
                  : "text-gray-700"
                  }`}
              >
                Dampak
              </button>

              <button
                onClick={() => scrollToSection("#mitra")}
                className={`transition-colors duration-300 ${activeSection.toLowerCase() === "#mitra"
                  ? "text-emerald-600 font-extrabold active"
                  : "text-gray-700"
                  }`}
              >
                Mitra
              </button>

              <button
                onClick={() => scrollToSection("#faq")}
                className={`transition-colors duration-300 ${activeSection === "#faq"
                  ? "text-emerald-600 font-extrabold active"
                  : "text-gray-700"
                  }`}
              >
                FAQ
              </button>
            </div>

          </div>

          {/* Action Buttons (Right Side - Icon only on Mobile, Full text on Desktop) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {isAuthenticated ? (
              <button
                onClick={() => navigate("/dashboard")}
                className="btn-primary-clean flex items-center gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-extrabold"
                title="Ke Dashboard"
              >
                <span className="material-symbols-outlined text-xl sm:text-lg">dashboard</span>
                <span className="hidden sm:inline">Ke Dashboard</span>
              </button>
            ) : (
              <Link
                to="/login"
                className="btn-primary-clean flex items-center gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-extrabold"
                title="Register / Login"
              >
                <span className="material-symbols-outlined text-xl sm:text-lg">login</span>
                <span className="hidden sm:inline">Register / Login</span>
              </Link>
            )}

            <button
              onClick={() => setShowContactModal(true)}
              className="btn-secondary-clean hidden sm:inline-flex"
            >
              Contact Us
            </button>

            {/* Mobile Hamburger Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition shrink-0 cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              <span className="material-symbols-outlined text-2xl leading-none">
                {isMobileMenuOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white/95 backdrop-blur-xl border-b border-slate-200/80 px-6 py-5 space-y-4 animate-in slide-in-from-top duration-300 shadow-xl">
            <div className="flex flex-col space-y-3 font-bold text-slate-800 text-sm text-left">
              <button
                onClick={() => scrollToSection("#about")}
                className={`py-2 text-left transition ${activeSection === "#about" ? "text-emerald-600 font-extrabold" : "hover:text-emerald-600"}`}
              >
                Tentang Kami
              </button>
              <button
                onClick={() => scrollToSection("#why-us")}
                className={`py-2 text-left transition ${activeSection === "#why-us" ? "text-emerald-600 font-extrabold" : "hover:text-emerald-600"}`}
              >
                Mengapa Aplikasi Ini
              </button>
              <button
                onClick={() => scrollToSection("#dampak")}
                className={`py-2 text-left transition ${activeSection === "#dampak" ? "text-emerald-600 font-extrabold" : "hover:text-emerald-600"}`}
              >
                Dampak
              </button>
              <button
                onClick={() => scrollToSection("#mitra")}
                className={`py-2 text-left transition ${activeSection.toLowerCase() === "#mitra" ? "text-emerald-600 font-extrabold" : "hover:text-emerald-600"}`}
              >
                Mitra
              </button>
              <button
                onClick={() => scrollToSection("#faq")}
                className={`py-2 text-left transition ${activeSection === "#faq" ? "text-emerald-600 font-extrabold" : "hover:text-emerald-600"}`}
              >
                FAQ
              </button>
            </div>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
              <button
                onClick={() => { setIsMobileMenuOpen(false); setShowContactModal(true); }}
                className="w-full py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-extrabold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Contact Us
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ----------------- HERO SECTION ----------------- */}
      <section className="relative pt-12 pb-24 bg-gradient-to-b from-emerald-50/60 via-slate-50/40 to-white overflow-hidden">
        <div className="container-custom grid grid-cols-1 xl:grid-cols-12 gap-10 items-center">

          {/* Hero Left Column: Real Project Copy (xl:col-span-5) */}
          <div className="xl:col-span-5 space-y-7 text-left relative z-10">

            {/* Single Clean High-Impact Badge
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100/90 border border-emerald-300 text-emerald-950 text-xs font-extrabold shadow-2xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                Sistem Pemilahan Sampah Cerdas • Kecamatan Coblong
              </div>
            </div> */}

            {/* Large Spacious Headline */}
            <h1 className="hero-title-main">
              Sampah <span className="text-blue-hero">Terdata</span>,<br />
              Lingkungan <span className="text-green-hero">Tertata</span>
            </h1>

            <p className="text-slate-600 text-base leading-relaxed font-medium">
              Sistem tata kelola sampah terintegrasi dengan pendekatan kegiatan KKN berdampak yang menghubungkan warga, petugas residu, mahasiswa, dosen pendamping lapangan, pimpinan perguruan tinggi, RW, kelurahan, kecamatan, dan Dinas Lingkungan Hidup.
            </p>


            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                onClick={() => setShowApkModal(true)}
                className="btn-primary-clean px-8 py-3.5 text-base"
              >
                Lihat Program
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

              {/* Hero Right Column: REAL WEB APP DASHBOARD CARD */}
              <div className="w-full rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">

                {/* Browser Window Header */}
                <div className="browser-top-bar">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="w-3 h-3 rounded-full bg-rose-400" />
                    <span className="w-3 h-3 rounded-full bg-amber-400" />
                    <span className="w-3 h-3 rounded-full bg-emerald-400" />

                    <span className="text-[11px] font-bold text-slate-400 ml-2 hidden sm:inline">
                      TrashCare Web Monitoring App
                    </span>
                  </div>

                  <div className="px-4 py-0.5 bg-white border border-slate-200 rounded-full text-[10px] text-slate-500 font-semibold flex items-center gap-1.5 shadow-2xs whitespace-nowrap">
                    <span className="material-symbols-outlined text-xs text-emerald-600">
                      lock
                    </span>
                    https://trashcare.id/dashboard
                  </div>

                  <div className="text-[10px] font-extrabold text-emerald-600 hidden sm:block shrink-0">
                    LIVE PREVIEW
                  </div>
                </div>

                {/* Main Dashboard */}
                <div className="flex flex-col min-w-0">

                  {/* Header Greeting */}
                  <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-4 py-3">
                    <div className="min-w-0">
                      <h3 className="font-black text-slate-900 text-xs sm:text-base flex items-center gap-1.5 whitespace-nowrap">
                        Selamat Datang Kembali, Petugas Monitoring
                      </h3>

                      <p className="text-xs text-slate-400 font-medium truncate">
                        Kelola data, pantau aktivitas, dan wujudkan lingkungan yang lebih bersih.
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                        <span className="material-symbols-outlined text-base">
                          notifications
                        </span>
                      </div>

                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                        <span className="material-symbols-outlined text-base">
                          grid_view
                        </span>
                      </div>

                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                        <span className="material-symbols-outlined text-base">
                          dark_mode
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
                        <div className="text-right hidden sm:block">
                          <p className="text-xs font-bold text-slate-800 leading-none">
                            Petugas Monitoring
                          </p>
                          <p className="text-[9px] text-slate-400 font-semibold uppercase">
                            PETUGAS
                          </p>
                        </div>

                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                          PM
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sidebar + Main Content */}
                  <div className="grid grid-cols-12 min-w-0">

                    {/* ================= SIDEBAR ================= */}
                    <aside className="col-span-3 hidden sm:block space-y-2.5 p-3 pr-3 border-r border-slate-100 text-[10px]">

                      {/* Logo */}
                      <div className="py-2 px-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                        <TrashCareLogoIcon className="w-7 h-7 shrink-0" />

                        <div className="flex flex-col text-left leading-none">
                          <span className="text-sm font-black tracking-tight">
                            <span className="text-sky-600">Trash</span>
                            <span className="text-emerald-600">Care</span>
                          </span>
                        </div>
                      </div>

                      {/* Layanan Utama */}
                      <div className="space-y-0.5 pt-1">
                        <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider px-1">
                          LAYANAN UTAMA
                        </p>

                        <div className="real-sidebar-nav-item active">
                          <span className="material-symbols-outlined text-base">
                            grid_view
                          </span>
                          Dashboard
                        </div>

                        <div className="real-sidebar-nav-item">
                          <span className="material-symbols-outlined text-base">
                            school
                          </span>
                          Dashboard DPL
                        </div>

                        <div className="real-sidebar-nav-item">
                          <span className="material-symbols-outlined text-base">
                            map
                          </span>
                          Monitoring Wilayah
                        </div>
                      </div>

                      {/* Kegiatan KKN */}
                      <div className="space-y-0.5">
                        <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider px-1">
                          KEGIATAN KKN
                        </p>

                        <div className="real-sidebar-nav-item">
                          <span className="material-symbols-outlined text-base">
                            equalizer
                          </span>
                          Ringkasan
                        </div>

                        <div className="real-sidebar-nav-item">
                          <span className="material-symbols-outlined text-base">
                            group
                          </span>
                          Kelompok KKN
                        </div>

                        <div className="real-sidebar-nav-item">
                          <span className="material-symbols-outlined text-base">
                            folder_shared
                          </span>
                          Portofolio Mahasiswa
                        </div>
                      </div>

                      {/* Tata Kelola */}
                      <div className="space-y-0.5">
                        <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider px-1">
                          TATA KELOLA
                        </p>

                        <div className="real-sidebar-nav-item">
                          <span className="material-symbols-outlined text-base">
                            checklist
                          </span>
                          Monitoring Pemilahan
                        </div>

                        <div className="real-sidebar-nav-item">
                          <span className="material-symbols-outlined text-base">
                            local_shipping
                          </span>
                          Pengangkutan Sampah
                        </div>

                        <div className="real-sidebar-nav-item">
                          <span className="material-symbols-outlined text-base">
                            recycling
                          </span>
                          Pemanfaatan Sampah
                        </div>
                      </div>

                      {/* Quote */}
                      <div className="p-2.5 bg-emerald-50/70 rounded-xl text-[10px] text-emerald-800 font-bold border border-emerald-100/80">
                        Bersama memilah sampah, bersama jaga bumi.
                      </div>
                    </aside>

                    {/* ================= MAIN CONTENT ================= */}
                    <main className="col-span-12 sm:col-span-9 min-w-0 p-3 space-y-3.5">

                      {/* Filters */}
                      <div className="flex items-center justify-between gap-2 text-[10px] sm:text-xs">

                        <div className="flex items-center gap-2 overflow-x-auto min-w-0">
                          <div className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg font-bold flex items-center gap-1 shadow-2xs shrink-0 whitespace-nowrap">
                            <span className="material-symbols-outlined text-xs">
                              calendar_today
                            </span>

                            Periode: Semua

                            <span className="material-symbols-outlined text-xs">
                              expand_more
                            </span>
                          </div>
                        </div>

                        <button className="px-2.5 py-1 bg-emerald-700 text-white font-bold rounded-lg text-[10px] sm:text-xs flex items-center gap-1 shadow-2xs hover:bg-emerald-800 transition shrink-0 whitespace-nowrap">
                          <span className="material-symbols-outlined text-xs">
                            verified
                          </span>
                          Indeks Kepatuhan RT/RW
                        </button>
                      </div>

                      {/* ================= METRIC CARDS ================= */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">

                        {/* Total Pengguna */}
                        <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 space-y-0.5 min-w-0">
                          <div className="flex items-center gap-1 min-w-0">
                            <div className="w-5 h-5 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined text-xs">
                                group
                              </span>
                            </div>

                            <span className="text-[9px] text-slate-400 font-bold truncate">
                              Total Pengguna
                            </span>
                          </div>

                          <p className="text-base font-black text-slate-900">
                            850
                          </p>

                          <p className="text-[9px] text-emerald-600 font-bold">
                            +12 Warga
                          </p>
                        </div>

                        {/* Tempat Sampah */}
                        <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 space-y-0.5 min-w-0">
                          <div className="flex items-center gap-1">
                            <div className="w-5 h-5 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined text-xs">
                                delete
                              </span>
                            </div>

                            <span className="text-[9px] text-slate-400 font-bold truncate">
                              Tempat Sampah
                            </span>
                          </div>

                          <p className="text-base font-black text-slate-900">
                            210
                          </p>

                          <span className="inline-block text-[8px] px-1 py-0.5 bg-rose-100 text-rose-700 font-bold rounded">
                            5 Penuh
                          </span>
                        </div>

                        {/* Lokasi */}
                        <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 space-y-0.5 min-w-0">
                          <div className="flex items-center gap-1">
                            <div className="w-5 h-5 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined text-xs">
                                place
                              </span>
                            </div>

                            <span className="text-[9px] text-slate-400 font-bold truncate">
                              Lokasi
                            </span>
                          </div>

                          <p className="text-base font-black text-slate-900">
                            90
                          </p>

                          <p className="text-[9px] text-emerald-600 font-bold">
                            +2 RW
                          </p>
                        </div>

                        {/* Total Setoran */}
                        <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 space-y-0.5 min-w-0">
                          <div className="flex items-center gap-1">
                            <div className="w-5 h-5 rounded bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined text-xs">
                                shopping_bag
                              </span>
                            </div>

                            <span className="text-[9px] text-slate-400 font-bold truncate">
                              Total Setoran
                            </span>
                          </div>

                          <p className="text-base font-black text-slate-900">
                            1.850 Kg
                          </p>

                          <p className="text-[9px] text-emerald-600 font-bold">
                            ↗ 15%
                          </p>
                        </div>

                        {/* Total Poin */}
                        <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 space-y-0.5 min-w-0">
                          <div className="flex items-center gap-1">
                            <div className="w-5 h-5 rounded bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined text-xs">
                                stars
                              </span>
                            </div>

                            <span className="text-[9px] text-slate-400 font-bold truncate">
                              Total Poin
                            </span>
                          </div>

                          <p className="text-base font-black text-slate-900">
                            35.000
                          </p>

                          <p className="text-[9px] text-emerald-600 font-bold">
                            ↗ Poin
                          </p>
                        </div>

                        {/* Total Jadwal */}
                        <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 space-y-0.5 min-w-0">
                          <div className="flex items-center gap-1">
                            <div className="w-5 h-5 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined text-xs">
                                calendar_month
                              </span>
                            </div>

                            <span className="text-[9px] text-slate-400 font-bold truncate">
                              Total Jadwal
                            </span>
                          </div>

                          <p className="text-base font-black text-slate-900">
                            4
                          </p>

                          <p className="text-[9px] text-emerald-600 font-bold">
                            2 Hari Ini
                          </p>
                        </div>
                      </div>

                      {/* ================= CHARTS ================= */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">

                        {/* Line Chart */}
                        <div className="sm:col-span-7 bg-slate-50/60 p-3 rounded-xl border border-slate-100 space-y-1.5 min-w-0">

                          <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-1">
                            <h4 className="font-extrabold text-[11px] text-slate-900">
                              Trend Setoran Sampah (Real-time)
                            </h4>

                            <div className="flex items-center gap-2 text-[8px] font-extrabold shrink-0">
                              <span className="flex items-center gap-1 text-emerald-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Organik
                              </span>

                              <span className="flex items-center gap-1 text-amber-600">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                Anorganik
                              </span>

                              <span className="flex items-center gap-1 text-rose-600">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                Residu
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-1 pt-1">

                            {/* Y Axis */}
                            <div className="flex flex-col justify-between text-[8px] text-slate-400 font-extrabold pr-1 border-r border-slate-200/80 text-right select-none shrink-0 h-28">
                              <span>200 Kg</span>
                              <span>150 Kg</span>
                              <span>100 Kg</span>
                              <span>50 Kg</span>
                              <span>0 Kg</span>
                            </div>

                            {/* Chart */}
                            <div className="flex-1 flex flex-col justify-between h-28 relative min-w-0">

                              <svg
                                className="w-full h-full overflow-visible"
                                viewBox="0 0 350 100"
                                preserveAspectRatio="none"
                              >
                                <line
                                  x1="0"
                                  y1="0"
                                  x2="350"
                                  y2="0"
                                  stroke="#cbd5e1"
                                  strokeWidth="0.8"
                                  strokeDasharray="3 3"
                                />

                                <line
                                  x1="0"
                                  y1="25"
                                  x2="350"
                                  y2="25"
                                  stroke="#e2e8f0"
                                  strokeWidth="0.8"
                                  strokeDasharray="3 3"
                                />

                                <line
                                  x1="0"
                                  y1="50"
                                  x2="350"
                                  y2="50"
                                  stroke="#e2e8f0"
                                  strokeWidth="0.8"
                                  strokeDasharray="3 3"
                                />

                                <line
                                  x1="0"
                                  y1="75"
                                  x2="350"
                                  y2="75"
                                  stroke="#e2e8f0"
                                  strokeWidth="0.8"
                                  strokeDasharray="3 3"
                                />

                                <line
                                  x1="0"
                                  y1="100"
                                  x2="350"
                                  y2="100"
                                  stroke="#cbd5e1"
                                  strokeWidth="1.2"
                                />

                                {/* Residu */}
                                <path
                                  d="M0 80 Q 45 65, 90 75 T 180 45 T 270 65 L 320 15 L 350 25"
                                  fill="none"
                                  stroke="#f43f5e"
                                  strokeWidth="2.5"
                                />

                                {/* Anorganik */}
                                <path
                                  d="M0 90 Q 55 80, 110 85 T 225 70 L 350 55"
                                  fill="none"
                                  stroke="#f59e0b"
                                  strokeWidth="2"
                                />

                                {/* Organik */}
                                <path
                                  d="M0 96 L 350 78"
                                  fill="none"
                                  stroke="#10b981"
                                  strokeWidth="1.8"
                                />
                              </svg>

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
                        <div className="sm:col-span-5 bg-slate-50/60 p-3.5 rounded-xl border border-slate-100 space-y-2 flex flex-col justify-between min-w-0">

                          <div>
                            <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                              <h4 className="font-extrabold text-[11px] text-slate-900">
                                Komposisi Sampah
                              </h4>

                              <span className="text-[9px] text-emerald-700 font-bold">
                                Volume
                              </span>
                            </div>

                            <div className="py-2 flex items-center justify-center">
                              <div className="relative w-16 h-16 rounded-full border-4 border-rose-500 flex items-center justify-center text-center">
                                <div>
                                  <p className="text-xs font-black text-rose-600 leading-none">
                                    85%
                                  </p>
                                  <p className="text-[7px] font-bold text-slate-500 uppercase">
                                    RESIDU
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-1 text-[9px] font-bold">
                              <div className="flex justify-between gap-2">
                                <span className="text-emerald-600">Organik</span>
                                <span className="text-slate-800 whitespace-nowrap">
                                  270 Kg (2%)
                                </span>
                              </div>

                              <div className="flex justify-between gap-2">
                                <span className="text-amber-500">Anorganik</span>
                                <span className="text-slate-800 whitespace-nowrap">
                                  1.460 Kg (13%)
                                </span>
                              </div>

                              <div className="flex justify-between gap-2">
                                <span className="text-rose-500">Residu</span>
                                <span className="text-slate-800 whitespace-nowrap">
                                  10.380 Kg (85%)
                                </span>
                              </div>
                            </div>
                          </div>

                          <button className="w-full py-1.5 bg-slate-900 text-white rounded-lg text-[9px] font-bold mt-1">
                            Detail Komposisi
                          </button>
                        </div>
                      </div>

                      {/* ================= LIVE RANKING ================= */}
                      <div className="bg-slate-50/80 rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">

                        <div className="px-3 py-2 bg-slate-100/90 border-b border-slate-200/80 flex items-center justify-between">
                          <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                            LIVE RANKING
                          </span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-[9px] min-w-[620px]">

                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-extrabold uppercase tracking-wider text-[8px]">
                                <th className="py-1.5 px-3">PERINGKAT</th>
                                <th className="py-1.5 px-3">NAMA WARGA</th>
                                <th className="py-1.5 px-3">WILAYAH (RT/RW)</th>
                                <th className="py-1.5 px-3 text-right">
                                  TOTAL SETORAN
                                </th>
                                <th className="py-1.5 px-3 text-center">
                                  KEPATUHAN
                                </th>
                                <th className="py-1.5 px-3 text-right">
                                  TOTAL POIN
                                </th>
                              </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-700">

                              {/* #1 */}
                              <tr className="hover:bg-emerald-50/40 transition">
                                <td className="py-1.5 px-3 font-extrabold text-amber-500">
                                  🥇 #1
                                </td>

                                <td className="py-1.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                                  Andi Pratama
                                </td>

                                <td className="py-1.5 px-3 text-slate-500 whitespace-nowrap">
                                  RT 01/RW 06, Kel. Dago
                                </td>

                                <td className="py-1.5 px-3 text-right font-extrabold text-slate-900 whitespace-nowrap">
                                  120 Kg
                                </td>

                                <td className="py-1.5 px-3 text-center">
                                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">
                                    98%
                                  </span>
                                </td>

                                <td className="py-1.5 px-3 text-right font-black text-emerald-600 whitespace-nowrap">
                                  5.000 Poin
                                </td>
                              </tr>

                              {/* #2 */}
                              <tr className="hover:bg-emerald-50/40 transition">
                                <td className="py-1.5 px-3 font-extrabold text-slate-400">
                                  🥈 #2
                                </td>

                                <td className="py-1.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                                  Siti Rahmawati
                                </td>

                                <td className="py-1.5 px-3 text-slate-500 whitespace-nowrap">
                                  RT 02/RW 03, Kel. Sekeloa
                                </td>

                                <td className="py-1.5 px-3 text-right font-extrabold text-slate-900 whitespace-nowrap">
                                  105 Kg
                                </td>

                                <td className="py-1.5 px-3 text-center">
                                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">
                                    95%
                                  </span>
                                </td>

                                <td className="py-1.5 px-3 text-right font-black text-emerald-600 whitespace-nowrap">
                                  4.250 Poin
                                </td>
                              </tr>

                              {/* #3 */}
                              <tr className="hover:bg-emerald-50/40 transition">
                                <td className="py-1.5 px-3 font-extrabold text-amber-700">
                                  🥉 #3
                                </td>

                                <td className="py-1.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                                  Budi Santoso
                                </td>

                                <td className="py-1.5 px-3 text-slate-500 whitespace-nowrap">
                                  RT 04/RW 05, Kel. Sadang Serang
                                </td>

                                <td className="py-1.5 px-3 text-right font-extrabold text-slate-900 whitespace-nowrap">
                                  98 Kg
                                </td>

                                <td className="py-1.5 px-3 text-center">
                                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">
                                    92%
                                  </span>
                                </td>

                                <td className="py-1.5 px-3 text-right font-black text-emerald-600 whitespace-nowrap">
                                  3.900 Poin
                                </td>
                              </tr>

                              {/* #4 */}
                              <tr className="hover:bg-emerald-50/40 transition">
                                <td className="py-1.5 px-3 font-bold text-slate-500">
                                  #4
                                </td>

                                <td className="py-1.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                                  Rina Wijaya
                                </td>

                                <td className="py-1.5 px-3 text-slate-500 whitespace-nowrap">
                                  RT 03/RW 01, Kel. Lebak Gede
                                </td>

                                <td className="py-1.5 px-3 text-right font-extrabold text-slate-900 whitespace-nowrap">
                                  85 Kg
                                </td>

                                <td className="py-1.5 px-3 text-center">
                                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">
                                    88%
                                  </span>
                                </td>

                                <td className="py-1.5 px-3 text-right font-black text-emerald-600 whitespace-nowrap">
                                  3.400 Poin
                                </td>
                              </tr>

                            </tbody>
                          </table>
                        </div>
                      </div>

                    </main>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>


        {/* Quick Stat Highlights */}
        <div className="container mx-auto">
          <div className="stats-strip">

            <div className="stat-item">
              <span className="stat-icon">
                <Icon icon="tabler:activity" />
              </span>
              <span className="stat-value">25+</span>
              <span className="stat-label">Kegiatan Terlaksana</span>
            </div>

            <div className="stat-item">
              <span className="stat-icon">
                <Icon icon="octicon:people-16" />
              </span>
              <span className="stat-value">500+</span>
              <span className="stat-label">Warga Terlibat</span>
            </div>

            <div className="stat-item">
              <span className="stat-icon">
                <Icon icon="iconamoon:trash" />
              </span>
              <span className="stat-value">1.250+ kg</span>
              <span className="stat-label">Sampah Terkelola</span>
            </div>

            <div className="stat-item">
              <span className="stat-icon">
                <Icon icon="lucide:home" />
              </span>
              <span className="stat-value">6</span>
              <span className="stat-label">Kelurahan Terlibat</span>
            </div>

            <div className="stat-item">
              <span className="stat-icon">
                <Icon icon="solar:chart-linear" />
              </span>
              <span className="stat-value">85%</span>
              <span className="stat-label">Tingkat Pemilahan</span>
            </div>

          </div>
        </div>
      </section>

      {/* ----------------- 01. ABOUT US ----------------- */}
      <section id="about" className="py-24 bg-white border-y border-slate-200/80 relative overflow-hidden">
        <div className="container-custom space-y-16">

          {/* About Header Narrative */}
          <div className="max-w-4xl space-y-4">
            {/* <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm text-emerald-600">nature_people</span>
              01. About Us &amp; Ecosystem Vision
            </div> */}

            <h2 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
              <span className="text-[#0084DC]">Trash</span>
              <span className="text-[#009966]">Care</span>
            </h2>

            <p className="text-slate-600 text-lg leading-relaxed font-medium">
              Sistem tata kelola sampah terintegrasi dengan kegiatan KKN Berdampak yang menghubungkan warga, petugas residu, mahasiswa, dosen pendamping lapangan (DPL), pimpinan perguruan tinggi, RW, kelurahan, kecamatan, dan Dinas Lingkungan Hidup.
            </p>






          </div>



          {/* Clean Light Sustainable Development Goals (SDGs) Grid */}

          {/* ==========================================================
    SDG SECTION
========================================================== */}

          <div className="sdg-section">

            <div className="sdg-heading">

              <h2>
                Sejalan dengan Tujuan Pembangunan Berkelanjutan (SDGs)
              </h2>

            </div>

            <div className="sdg-grid">

              {sdgs.map((sdg) => (
                <div className="sdg-item" key={sdg.num}>

                  <img
                    src={sdg.img}
                    alt={`SDG ${sdg.num}`}
                    className="sdg-image"
                  />

                </div>
              ))}

            </div>

            <p className="sdg-bottom-text">
              Bersama TrashCare, pengelolaan sampah menjadi bagian dari
              solusi untuk lingkungan yang lebih bersih dan berkelanjutan.
            </p>

          </div>

          <section className="section" id="program">
            <div className="program-section">

              <div className="program-top">

                <div className="program-heading">

                  <p className="eyebrow">
                    Program Kami
                  </p>

                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                    Berbagai program untuk mewujudkan lingkungan bersih dan berkelanjutan.
                  </h2>

                </div>

                <div className="program-grid">
                  <article className="program-card">
                    <span className="program-icon" aria-hidden="true">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#009966" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" /></svg>
                    </span>
                    <h3>Pemilahan Sampah</h3>
                    <p>Edukasi dan praktik pemilahan dari sumbernya.</p>
                  </article>

                  <article className="program-card">
                    <span className="program-icon" aria-hidden="true">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#009966" stroke-width="2"><path d="M21 12a9 9 0 1 1-3.5-7.14M21 3v6h-6" /></svg>
                    </span>
                    <h3>Pengolahan Organik</h3>
                    <p>Mengolah sampah organik menjadi kompos atau produk bermanfaat.</p>
                  </article>

                  <article className="program-card">
                    <span className="program-icon" aria-hidden="true">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#009966" stroke-width="2"><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v3M8 13h8" /></svg>
                    </span>
                    <h3>Bank Sampah</h3>
                    <p>Mengelola sampah anorganik melalui sistem pencatatan dan penimbangan.</p>
                  </article>

                  <article className="program-card">
                    <span className="program-icon" aria-hidden="true">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#009966" stroke-width="2"><path d="M7 19l-4-4 4-4M17 5l4 4-4 4M14 4L10 20" /></svg>
                    </span>
                    <h3>Daur Ulang</h3>
                    <p>Mengubah sampah menjadi produk kreatif bernilai ekonomi.</p>
                  </article>

                  <article className="program-card">
                    <span className="program-icon" aria-hidden="true">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#009966" stroke-width="2"><path d="M12 22s8-4.5 8-11V5l-8-3-8 3v6c0 6.5 8 11 8 11z" /></svg>
                    </span>
                    <h3>Aksi Bersih Lingkungan</h3>
                    <p>Kegiatan bersih lingkungan bersama masyarakat.</p>
                  </article>
                </div>
              </div>

              <div className="activity-wrapper">
                <div className="activity-header">
                  <div>
                    <p className="eyebrow">Kegiatan Terbaru</p>
                  </div>
                  <a href="#kegiatan" className="link-more">Lihat Semua →</a>
                </div>

                <div className="activity-list" id="kegiatan">
                  <article className="kegiatan-card">
                    <div className="kegiatan-thumb" data-thumb="1">
                      <span className="date-badge"><strong>24</strong>Mei</span>
                    </div>
                    <div className="kegiatan-body">
                      <h3>Edukasi Pemilahan Sampah di RW 03</h3>
                      <p className="location">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                        Kel. Lebak Gede
                      </p>
                    </div>
                  </article>

                  <article className="kegiatan-card">
                    <div className="kegiatan-thumb" data-thumb="2">
                      <span className="date-badge"><strong>20</strong>Mei</span>
                    </div>
                    <div className="kegiatan-body">
                      <h3>Pengolahan Kompos Sampah Organik</h3>
                      <p className="location">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                        Kel. Dago
                      </p>
                    </div>
                  </article>

                  <article className="kegiatan-card">
                    <div className="kegiatan-thumb" data-thumb="3">
                      <span className="date-badge"><strong>18</strong>Mei</span>
                    </div>
                    <div className="kegiatan-body">
                      <h3>Aksi Bersih Sungai Cikapundung</h3>
                      <p className="location">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                        Kel. Cikawao
                      </p>
                    </div>
                  </article>
                </div>
              </div>
            </div>
          </section>



        </div>
      </section>

      {/* ----------------- 02. WHY US ----------------- */}
      <section id="why-us" className="py-24 bg-[#f0fdf4] border-b border-[#dcfce7]">
        <div className="container-custom space-y-12">

          <div className="text-center">

            {/* Eyebrow */}
            <div className="mx-auto w-fit">
              <p className="why-us-eyebrow">
                MENGAPA TRASHCARE
              </p>

              <div className="mt-3 h-1 w-12 rounded-full bg-emerald-600 mx-auto"></div>
            </div>

            <h2 className="mt-4 text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              Mengapa Aplikasi Ini?
            </h2>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto mt-3">
              Bukan sekadar mencatat sampah, TrashCare menghubungkan teknologi,
              partisipasi masyarakat, dan pengelolaan lingkungan dalam satu sistem.
            </p>

            {/* Clean Interactive Pills */}
            <div className="inline-flex items-center gap-2 p-1.5 bg-white rounded-full border border-slate-200/80 shadow-2xs mt-4">
              <button
                onClick={() => setWhyUsTab("points")}
                className={`clean-interactive-tab ${whyUsTab === "points" ? "active" : ""
                  }`}
              >
                Point-Based Gamification
              </button>

              <button
                onClick={() => setWhyUsTab("bins")}
                className={`clean-interactive-tab ${whyUsTab === "bins" ? "active" : ""
                  }`}
              >
                Manajemen Tempat Sampah
              </button>

              <button
                onClick={() => setWhyUsTab("iot")}
                className={`clean-interactive-tab ${whyUsTab === "iot" ? "active" : ""
                  }`}
              >
                Terintegrasi dengan IoT
              </button>
            </div>

          </div>

          <div className="max-w-3xl mx-auto">
            {whyUsTab === "points" ? (

              /* ================= POINT ================= */
              <div className="bg-white text-slate-900 p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-md space-y-6">

                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <span className="material-symbols-outlined text-xl">
                        stars
                      </span>
                    </div>

                    <span className="font-extrabold text-lg text-slate-900">
                      Point-Based Ledger System
                    </span>
                  </div>

                  <span className="text-xs px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full font-bold">
                    Reward &amp; Audit
                  </span>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  Pencatatan poin Warga dan Mahasiswa KKN menggunakan ledger
                  terpisah di database demi transparansi audit. Setiap setoran
                  sampah berhadiah poin insentif, dan pengajuan ide daur ulang
                  yang disetujui RW memberikan reward tambahan (+50 poin).
                </p>

                <div className="grid grid-cols-3 gap-4 pt-2 text-center">

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                      Level Warga
                    </span>
                    <p className="text-2xl font-black text-emerald-600">
                      Level 8
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                      Total Poin
                    </span>
                    <p className="text-2xl font-black text-amber-500">
                      2.450 Poin
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                      Ide Daur Ulang
                    </span>
                    <p className="text-2xl font-black text-emerald-600">
                      +50 Poin
                    </p>
                  </div>

                </div>

              </div>

            ) : whyUsTab === "bins" ? (

              /* ================= TEMPAT SAMPAH ================= */
              <div className="bg-white text-slate-900 p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-md space-y-6">

                <div className="flex items-center justify-between border-b border-slate-100 pb-4">

                  <div className="flex items-center gap-2.5">

                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <span className="material-symbols-outlined text-xl">
                        delete
                      </span>
                    </div>

                    <span className="font-extrabold text-lg text-slate-900">
                      Aturan Tempat Sampah (Bin)
                    </span>

                  </div>

                  <span className="text-xs px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-bold">
                    QR Validation
                  </span>

                </div>

                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  Setiap rumah tangga berhak mendaftarkan maksimal 2 tempat
                  sampah (1 Organik &amp; 1 Anorganik). Tempat sampah aktif
                  selama 30 hari dan di-reset otomatis setiap setoran.
                  Penjemputan residu dipisahkan dan ditimbang manual oleh
                  Petugas Residu.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">

                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-black text-slate-900">
                        Tempat Sampah Organik #01
                      </p>
                      <p className="text-xs text-slate-500 font-medium">
                        Aktif (20L Standar)
                      </p>
                    </div>

                    <span className="text-xs font-black px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl">
                      25% Terisi
                    </span>
                  </div>

                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-black text-slate-900">
                        Tempat Sampah Anorganik #02
                      </p>
                      <p className="text-xs text-slate-500 font-medium">
                        Aktif (20L Standar)
                      </p>
                    </div>

                    <span className="text-xs font-black px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl">
                      50% Terisi
                    </span>
                  </div>

                </div>

              </div>

            ) : (

              /* ================= IOT ================= */
              <div className="bg-white text-slate-900 p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-md space-y-6">

                <div className="flex items-center justify-between border-b border-slate-100 pb-4">

                  <div className="flex items-center gap-2.5">

                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                      <span className="material-symbols-outlined text-xl">
                        sensors
                      </span>
                    </div>

                    <span className="font-extrabold text-lg text-slate-900">
                      Sistem Terintegrasi dengan IoT
                    </span>

                  </div>

                  <span className="text-xs px-3 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-full font-bold">
                    IoT Monitoring
                  </span>

                </div>

                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  TrashCare dapat terintegrasi dengan perangkat Internet of
                  Things (IoT) untuk memantau kondisi tempat sampah secara
                  lebih cepat dan terukur. Data dari perangkat dapat digunakan
                  untuk membantu mengetahui tingkat kepenuhan tempat sampah
                  dan mendukung proses pengelolaan serta penjemputan sampah.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">

                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
                      <span className="material-symbols-outlined">
                        sensors
                      </span>
                    </div>

                    <p className="text-sm font-black text-slate-900">
                      Sensor IoT
                    </p>

                    <p className="text-xs text-slate-500 font-medium mt-1">
                      Membaca kondisi tempat sampah secara berkala.
                    </p>
                  </div>

                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                      <span className="material-symbols-outlined">
                        monitoring
                      </span>
                    </div>

                    <p className="text-sm font-black text-slate-900">
                      Monitoring Real-Time
                    </p>

                    <p className="text-xs text-slate-500 font-medium mt-1">
                      Informasi kondisi tempat sampah dapat dipantau melalui sistem.
                    </p>
                  </div>

                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
                      <span className="material-symbols-outlined">
                        route
                      </span>
                    </div>

                    <p className="text-sm font-black text-slate-900">
                      Efisiensi Penjemputan
                    </p>

                    <p className="text-xs text-slate-500 font-medium mt-1">
                      Data membantu petugas menentukan prioritas penjemputan.
                    </p>
                  </div>

                </div>

              </div>

            )}

          </div>

        </div>
      </section>

      {/* ----------------- 03. HOW IT WORKS -----------------
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
      </section> */}

      {/* ---------- Dampak Nyata ---------- */}
      <section className="py-24 bg-slate-50/70 border-b border-slate-200/80" id="dampak">
        <div className="container-custom">

          <div className="dampak-grid">

            {/* Intro */}
            <div className="dampak-intro">
              <p className="eyebrow">Dampak Nyata</p>

              <h2 className="section-title">
                Bersama, Kita Ciptakan Lingkungan yang Lebih Bersih
              </h2>

              <a href="#kegiatan" className="btn btn-primary-clean">
                Lihat Selengkapnya
                <span>→</span>
              </a>
            </div>



            {/* Statistik 1 */}
            <div className="dampak-card dampak-card-1">
              <span className="dampak-label">
                Volume Sampah Terkelola
              </span>

              <span className="dampak-value">
                1.250+ kg
              </span>

              <span className="dampak-sub">
                Total akumulasi
              </span>
            </div>

            {/* Statistik 2 */}
            <div className="dampak-card dampak-card-2">
              <span className="dampak-label">
                Warga Terlibat
              </span>

              <span className="dampak-value">
                500+
              </span>

              <span className="dampak-sub">
                Orang
              </span>
            </div>

            {/* Statistik 3 */}
            <div className="dampak-card dampak-card-3">
              <span className="dampak-label">
                Kegiatan Terlaksana
              </span>

              <span className="dampak-value">
                25+
              </span>

              <span className="dampak-sub">
                Kegiatan
              </span>
            </div>

            {/* Statistik 4 */}
            <div className="dampak-card dampak-card-4">
              <span className="dampak-label">
                Tingkat Pemilahan
              </span>

              <span className="dampak-value">
                85%
              </span>

              <span className="dampak-sub">
                Rata-rata
              </span>
            </div>

            {/* Chart */}
            <div className="dampak-chart">

              <div className="dampak-chart-header">
                <div>
                  <p className="eyebrow eyebrow-sm">
                    Capaian per Kelurahan
                  </p>

                  <h3>
                    Tingkat Pemilahan Sampah
                  </h3>
                </div>

                <span className="chart-unit">
                  Persentase
                </span>
              </div>

              <ul className="bar-list">

                <li>
                  <span className="bar-label">
                    Lebak Gede
                  </span>

                  <span className="bar-track">
                    <span
                      className="bar-fill"
                      style={{ width: "90%" }}
                    />
                  </span>

                  <span className="bar-val">
                    90%
                  </span>
                </li>

                <li>
                  <span className="bar-label">
                    Dago
                  </span>

                  <span className="bar-track">
                    <span
                      className="bar-fill"
                      style={{ width: "85%" }}
                    />
                  </span>

                  <span className="bar-val">
                    85%
                  </span>
                </li>

                <li>
                  <span className="bar-label">
                    Ciwaringin
                  </span>

                  <span className="bar-track">
                    <span
                      className="bar-fill"
                      style={{ width: "80%" }}
                    />
                  </span>

                  <span className="bar-val">
                    80%
                  </span>
                </li>

                <li>
                  <span className="bar-label">
                    Sekeloa
                  </span>

                  <span className="bar-track">
                    <span
                      className="bar-fill"
                      style={{ width: "75%" }}
                    />
                  </span>

                  <span className="bar-val">
                    75%
                  </span>
                </li>

                <li>
                  <span className="bar-label">
                    Cikawao
                  </span>

                  <span className="bar-track">
                    <span
                      className="bar-fill"
                      style={{ width: "70%" }}
                    />
                  </span>

                  <span className="bar-val">
                    70%
                  </span>
                </li>

                <li>
                  <span className="bar-label">
                    Sadang Serang
                  </span>

                  <span className="bar-track">
                    <span
                      className="bar-fill"
                      style={{ width: "65%" }}
                    />
                  </span>

                  <span className="bar-val">
                    65%
                  </span>
                </li>

              </ul>

              <div className="bar-axis">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ==========================================================
          MITRA / OUR CLIENTS
      ========================================================== */}
      <section className="section section-mitra" id="mitra">
        <div className="container-custom">

          <div className="mitra-layout">

            {/* LEFT CONTENT */}
            <div className="mitra-content">
              <p className="eyebrow">
                MITRA KAMI
              </p>

              <h2 className="mitra-title">
                Mitra
                <br />
                Terpecaya
              </h2>

              <p className="mitra-description">
                Bersama berbagai pihak, TrashCare membangun kolaborasi
                untuk menciptakan lingkungan yang lebih bersih,
                sehat, dan berkelanjutan.
              </p>
            </div>

            {/* RIGHT LOGOS */}
            <div className="mitra-logos">

              <div className="mitra-logo-card">
                <img src="/image/mitra/unikom.png" alt="UNIKOM" className="mitra-logo-img" />
                <span>UNIKOM</span>
              </div>

              <div className="mitra-logo-card">
                <img src="/image/mitra/pemkot-bandung.png" alt="Pemerintah Kota Bandung" className="mitra-logo-img" />
                <span>Pemerintah<br />Kota Bandung</span>
              </div>

              <div className="mitra-logo-card">
                <img src="/image/mitra/dlh-bandung.jpg" alt="DLH Kota Bandung" className="mitra-logo-img" />
                <span>DLH<br />Kota Bandung</span>
              </div>

              {/* <div className="mitra-logo-card">
                <div className="mitra-logo-placeholder">📍</div>
                <span>Kecamatan<br />Coblong</span>
              </div>

              <div className="mitra-logo-card">
                <div className="mitra-logo-placeholder">🏘️</div>
                <span>Kelurahan<br />Se-Kecamatan Coblong</span>
              </div> */}

              {/* <div className="mitra-logo-card">
                <div className="mitra-logo-placeholder">♻️</div>
                <span>Bank Sampah<br />Mitra</span>
              </div>

              <div className="mitra-logo-card">
                <div className="mitra-logo-placeholder">🤝</div>
                <span>Komunitas<br />Masyarakat</span>
              </div> */}

            </div>

          </div>
        </div>
      </section>

      {/* =========================================================
    FAQ SECTION
========================================================= */}

      <section id="faq" className="py-24 bg-white">
        <div className="container-custom">

          {/* Header */}
          <div className="faq-header text-center">

            <div className="why-us-eyebrow faq-eyebrow">
              FAQ
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              Pertanyaan yang Sering Ditanyakan
            </h2>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto mt-4">
              Temukan jawaban atas pertanyaan umum mengenai TrashCare,
              pengelolaan sampah, dan cara menggunakan platform kami.
            </p>

          </div>

          {/* FAQ List */}
          <div className="faq-list">

            {/* FAQ 1 */}
            <div className={`faq-item ${openFaq === 0 ? "active" : ""}`}>
              <button
                type="button"
                className="faq-question"
                onClick={() => setOpenFaq(openFaq === 0 ? null : 0)}
              >
                <span>
                  Apa itu TrashCare?
                </span>

                <span className="faq-icon">
                  <span className="material-symbols-outlined">
                    {openFaq === 0 ? "remove" : "add"}
                  </span>
                </span>
              </button>

              {openFaq === 0 && (
                <div className="faq-answer">
                  <p>
                    TrashCare merupakan platform pengelolaan sampah yang membantu
                    masyarakat dalam memilah, menyetorkan, dan memantau pengelolaan
                    sampah secara lebih terstruktur melalui teknologi digital.
                  </p>
                </div>
              )}
            </div>

            {/* FAQ 2 */}
            <div className={`faq-item ${openFaq === 1 ? "active" : ""}`}>
              <button
                type="button"
                className="faq-question"
                onClick={() => setOpenFaq(openFaq === 1 ? null : 1)}
              >
                <span>
                  Bagaimana cara menggunakan TrashCare?
                </span>

                <span className="faq-icon">
                  <span className="material-symbols-outlined">
                    {openFaq === 1 ? "remove" : "add"}
                  </span>
                </span>
              </button>

              {openFaq === 1 && (
                <div className="faq-answer">
                  <p>
                    Pengguna dapat mendaftar dan masuk ke dalam platform,
                    kemudian mengikuti proses pengelolaan sampah sesuai layanan
                    yang tersedia, mulai dari pemilahan hingga penyetoran sampah.
                  </p>
                </div>
              )}
            </div>



            {/* FAQ 4 */}
            <div className={`faq-item ${openFaq === 3 ? "active" : ""}`}>
              <button
                type="button"
                className="faq-question"
                onClick={() => setOpenFaq(openFaq === 3 ? null : 3)}
              >
                <span>
                  Apa saja jenis sampah yang dapat dikelola?
                </span>

                <span className="faq-icon">
                  <span className="material-symbols-outlined">
                    {openFaq === 3 ? "remove" : "add"}
                  </span>
                </span>
              </button>

              {openFaq === 3 && (
                <div className="faq-answer">
                  <p>
                    TrashCare mendukung pengelolaan beberapa kategori sampah,
                    seperti sampah organik, anorganik, dan residu sesuai dengan
                    sistem pemilahan yang diterapkan.
                  </p>
                </div>
              )}
            </div>



            {/* FAQ 6 */}
            <div className={`faq-item ${openFaq === 5 ? "active" : ""}`}>
              <button
                type="button"
                className="faq-question"
                onClick={() => setOpenFaq(openFaq === 5 ? null : 5)}
              >
                <span>
                  Siapa saja yang dapat menggunakan TrashCare?
                </span>

                <span className="faq-icon">
                  <span className="material-symbols-outlined">
                    {openFaq === 5 ? "remove" : "add"}
                  </span>
                </span>
              </button>

              {openFaq === 5 && (
                <div className="faq-answer">
                  <p>
                    TrashCare dirancang untuk mendukung masyarakat, petugas,
                    pengelola lingkungan, serta pihak lain yang terlibat dalam
                    proses pengelolaan sampah.
                  </p>
                </div>
              )}
            </div>

          </div>

          {/* Bottom CTA */}
          {/* <div className="faq-bottom">
            <p>
              Masih memiliki pertanyaan?
            </p>

            <button
              type="button"
              onClick={() => setShowContactModal(true)}
              className="btn-primary-clean"
            >
              Hubungi Kami
              <span className="material-symbols-outlined text-base">
                arrow_forward
              </span>
            </button>
          </div> */}

        </div>
      </section>



      {/* ----------------- 05. WHAT WE DO -----------------
      <section id="Mitra" className="py-24 bg-slate-50/50">
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
      </section> */}

      {/* ----------------- FOOTER ----------------- */}
      <footer className="bg-slate-900 text-slate-400 py-16 text-sm border-t border-slate-800">
        <div className="container-custom grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-white font-black text-xl">
              <TrashCareLogoIcon className="w-8 h-8" />
              <span className="text-[#0084DC] ">Trash<span className="text-emerald-400">Care</span></span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Sistem Pemilahan &amp; Pengelolaan Sampah Terintegrasi.
            </p>
            <p className="text-xs text-slate-500 font-semibold">© 2026 UNIKOM. All rights reserved.</p>
          </div>

          <div>
            <h5 className="text-white font-extrabold text-xs uppercase tracking-wider mb-4">Navigasi</h5>
            <ul className="space-y-2.5 text-xs font-semibold">
              <li><button onClick={() => scrollToSection("#about")} className="hover:text-white transition">Tentang Kami</button></li>
              <li><button onClick={() => scrollToSection("#why-us")} className="hover:text-white transition">Mengapa Aplikasi Ini</button></li>
              <li><button onClick={() => scrollToSection("#dampak")} className="hover:text-white transition">Dampak</button></li>
              <li><button onClick={() => scrollToSection("#Mitra")} className="hover:text-white transition">Mitra</button></li>
              <li><button onClick={() => scrollToSection("#faq")} className="hover:text-white transition">FAQ</button></li>
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

              <li className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-base text-slate-400">mail</span>
                <span>cdc@email.unikom.ac.id</span>
              </li>
            </ul>
          </div>
        </div>
      </footer>

      {/* ----------------- CONTACT US MODAL ----------------- */}
      {
        showContactModal && (
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
        )
      }

      {/* ----------------- APK DOWNLOAD MODAL ----------------- */}
      {
        showApkModal && (
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
        )
      }

    </div >
  );
};

export default LandingPage;
