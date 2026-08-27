/**
 * Project: TrashCare Landing Page (Update CTA button text to 'Login')
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Download } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { useThemeStore } from "../../store/useThemeStore";
import api from "../../services/api";
import "./LandingPage.css";

// Material Symbols Icon component for stats strip
const Icon: React.FC<{ icon: string; className?: string }> = ({ icon, className = "" }) => {
  const iconMap: Record<string, string> = {
    "tabler:activity": "analytics",
    "octicon:people-16": "groups",
    "iconamoon:trash": "delete",
    "lucide:home": "home",
    "solar:chart-linear": "monitoring",
    "lucide:trending-up": "trending_up",
    "lucide:trending-down": "trending_down",
    "lucide:arrow-up": "arrow_upward",
    "lucide:arrow-down": "arrow_downward",
    "trending_up": "trending_up",
    "trending_down": "trending_down",
    "trending_flat": "trending_flat",
  };
  const resolved = iconMap[icon] || icon.replace(/^(lucide|tabler|solar|octicon):/, "").replace(/-/g, "_");
  return <span className={`material-symbols-outlined ${className}`}>{resolved}</span>;
};

// Official High-Resolution BERSEKA Full Logo Asset
const BersekaLogoIcon: React.FC<{ className?: string }> = ({ className = "h-12 sm:h-14 w-auto" }) => (
  <img
    src="/app-logo.png"
    alt="BERSEKA"
    className={`${className} object-contain shrink-0`}
  />
);

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  // Force clean light mode on Landing Page unconditionally
  useEffect(() => {
    useThemeStore.getState().setInsideMainLayout(false);
    useThemeStore.getState().resetThemeToLight();
  }, []);

  const [whyUsTab, setWhyUsTab] = useState<
    "points" | "bins" | "iot"
  >("points");
  const [showContactModal, setShowContactModal] = useState<boolean>(false);
  const [showApkModal, setShowApkModal] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<string>("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);
  const [showAllActivitiesModal, setShowAllActivitiesModal] = useState<boolean>(false);

  // Live database stats fetched from Express Backend API
  const [statsData, setStatsData] = useState<{
    kegiatanCount: number;
    wargaCount: number;
    totalSampahKg: number;
    kelurahanCount: number;
    tingkatPemilahanPercent?: number;
    totalPoin?: number;
    approvedIdeasCount?: number;
    poinRewardIde?: number;
    totalBinsCount?: number;
    assignedBinsCount?: number;
    totalPenjemputan?: number;
    smartIotBinsCount?: number;
    todayWasteKg?: number;
    yesterdayWasteKg?: number;
    wasteTrendPercentage?: number;
    wasteTrendDirection?: "UP" | "DOWN" | "STABLE";
    recentSchedules: any[];
  } | null>(null);

  useEffect(() => {
    const fetchLandingStats = async () => {
      try {
        const res = await api.get("/system/landing-stats");
        if (res.data?.success && res.data?.data) {
          setStatsData(res.data.data);
        }
      } catch (err) {
        console.warn("[LandingPage] Live stats fetch fallback.", err);
      }
    };
    fetchLandingStats();

    // 10-second auto-polling for 100% real-time database sync
    const pollInterval = setInterval(fetchLandingStats, 10000);
    return () => clearInterval(pollInterval);
  }, []);

  // Berita Kegiatan Mahasiswa KKN — real-time dari CMS
  const [beritaList, setBeritaList] = useState<Array<{
    id: string;
    judul: string;
    ringkasan?: string | null;
    gambarUrl?: string | null;
    kategori: string;
    publishedAt?: string | null;
    createdAt: string;
    author?: { name: string } | null;
  }>>([]);

  useEffect(() => {
    const fetchBerita = async () => {
      try {
        const res = await api.get("/system/landing-curated");
        if (res.data?.success && Array.isArray(res.data?.data)) {
          setBeritaList(
            res.data.data.map((act: any) => ({
              id: act.id,
              judul: act.title,
              ringkasan: act.description,
              gambarUrl: act.imageUrl,
              kategori: act.category,
              publishedAt: act.date,
              createdAt: act.date,
              author: { name: "Tim KKN & DLH" },
            }))
          );
        }
      } catch {
        // Berita tidak krusial — silent fallback
      }
    };
    fetchBerita();
    const beritaPoll = setInterval(fetchBerita, 30000);
    return () => clearInterval(beritaPoll);
  }, []);

  // Format bobot sampah selalu menampilkan nilai riil bersih (misal: 12.91 kg atau bilangan bulat) tanpa titik ribuan
  const formatWasteWeight = (kg: number | undefined) => {
    if (typeof kg !== "number" || isNaN(kg)) return "12.91 kg";
    const val = Math.round(kg * 100) / 100;
    return `${val} kg`;
  };

  const formatWasteWeightExact = (kg: number | undefined) => {
    if (typeof kg !== "number" || isNaN(kg)) return "12.91 kg";
    const val = Math.round(kg * 100) / 100;
    return `${val} kg`;
  };

  // Helper render badge tren kenaikan/penurunan sampah real-time
  const renderTrendBadge = (trend?: number, direction?: string, isHero: boolean = true) => {
    const trendPercent = typeof trend === "number" ? trend : 12;
    const isUp = direction ? direction === "UP" : trendPercent > 0;
    const isDown = direction ? direction === "DOWN" : trendPercent < 0;
    const sign = isUp ? "+" : "";
    const iconName = isUp ? "trending_up" : isDown ? "trending_down" : "trending_flat";
    const colorClass = isUp
      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
      : isDown
      ? "text-rose-700 bg-rose-50 border-rose-200"
      : "text-slate-700 bg-slate-50 border-slate-200";

    const titleText = statsData?.todayWasteKg !== undefined
      ? `Akumulasi harian real-time: ${statsData.todayWasteKg} kg hari ini (${sign}${trendPercent}% dibanding kemarin)`
      : `Tren akumulasi harian: ${sign}${trendPercent}%`;

    return (
      <span
        className={`inline-flex items-center ${isHero ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-0.5"} font-extrabold rounded-md border ${colorClass}`}
        title={titleText}
      >
        <span className="material-symbols-outlined text-xs mr-0.5 leading-none">{iconName}</span>
        {sign}{trendPercent}%
      </span>
    );
  };


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

      const navbarOffset = 100;
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

  const sdgs = [
    {
      num: 3,
      tag: "#3",
      color: "#4C9F38",
      bgLight: "bg-[#4C9F38]/10 text-[#4C9F38] border-[#4C9F38]/20",
      img: "/image/sdg/SDG-3.svg",
      title: "Kehidupan Sehat dan Sejahtera",
      desc: "Mencegah akumulasi sampah liar serta meningkatkan derajat kesehatan masyarakat.",
    },
    {
      num: 11,
      tag: "#11",
      color: "#F99D26",
      bgLight: "bg-[#F99D26]/10 text-[#F99D26] border-[#F99D26]/20",
      img: "/image/sdg/SDG-11.svg",
      title: "Kota dan Permukiman Berkelanjutan",
      desc: "Mendorong partisipasi warga dalam pemilahan guna mewujudkan kawasan perkotaan yang lestari.",
    },
    {
      num: 12,
      tag: "#12",
      color: "#CF8D2A",
      bgLight: "bg-[#CF8D2A]/10 text-[#CF8D2A] border-[#CF8D2A]/20",
      img: "/image/sdg/SDG-12.svg",
      title: "Konsumsi dan Produksi Bertanggung Jawab",
      desc: "Mendorong praktik pemilahan sampah mandiri, daur ulang, dan ekonomi sirkular.",
    },
    {
      num: 13,
      tag: "#13",
      color: "#3F7E44",
      bgLight: "bg-[#3F7E44]/10 text-[#3F7E44] border-[#3F7E44]/20",
      img: "/image/sdg/SDG-13.svg",
      title: "Penanganan Perubahan Iklim",
      desc: "Mengurangi emisi gas rumah kaca dari sampah organik melalui pengomposan.",
    },
    {
      num: 15,
      tag: "#15",
      color: "#56C02B",
      bgLight: "bg-[#56C02B]/10 text-[#56C02B] border-[#56C02B]/20",
      img: "/image/sdg/SDG-15.svg",
      title: "Ekosistem Daratan",
      desc: "Melindungi kualitas tanah, air tanah, dan kelestarian ekosistem daratan.",
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
            className="flex items-center gap-2.5 group shrink-0"
          >
            <BersekaLogoIcon className="h-12 sm:h-14 w-auto transition-transform group-hover:scale-105 shrink-0" />
          </Link>

          {/* Navigation Links */}
          <div className="hidden lg:flex items-center justify-center gap-8 font-bold text-sm">
            <button
              onClick={() => scrollToSection("#about")}
              className={`transition-colors duration-300 ${activeSection === "#about"
                ? "text-[#035941] font-extrabold active"
                : "text-slate-700 hover:text-[#035941]"
                }`}
            >
              Tentang Kami
            </button>

            <button
              onClick={() => scrollToSection("#why-us")}
              className={`transition-colors duration-300 ${activeSection === "#why-us"
                ? "text-[#035941] font-extrabold active"
                : "text-slate-700 hover:text-[#035941]"
                }`}
            >
              Mengapa BERSEKA
            </button>

            <button
              onClick={() => scrollToSection("#dampak")}
              className={`transition-colors duration-300 ${activeSection === "#dampak"
                ? "text-[#035941] font-extrabold active"
                : "text-slate-700 hover:text-[#035941]"
                }`}
            >
              Dampak
            </button>

            <button
              onClick={() => scrollToSection("#mitra")}
              className={`transition-colors duration-300 ${activeSection.toLowerCase() === "#mitra"
                ? "text-[#035941] font-extrabold active"
                : "text-slate-700 hover:text-[#035941]"
                }`}
            >
              Mitra
            </button>

            <button
              onClick={() => scrollToSection("#faq")}
              className={`transition-colors duration-300 ${activeSection === "#faq"
                ? "text-[#035941] font-extrabold active"
                : "text-slate-700 hover:text-[#035941]"
                }`}
            >
              FAQ
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden lg:flex items-center gap-3">
              {isAuthenticated ? (
                <button
                  onClick={() => navigate("/dashboard")}
                  className="btn-primary-clean"
                >
                  <span className="material-symbols-outlined text-lg">dashboard</span>
                  Dasbor
                </button>
              ) : (
                <Link to="/login" className="btn-primary-clean">
                  <span className="material-symbols-outlined text-lg">login</span>
                  Masuk
                </Link>
              )}

              <button
                onClick={() => setShowContactModal(true)}
                className="btn-secondary-clean"
              >
                Hubungi Kami
              </button>
            </div>

            {/* Mobile Hamburger Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition shrink-0 cursor-pointer"
              aria-label="Toggle Navigation Menu"
              aria-expanded={isMobileMenuOpen}
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
                Mengapa BERSEKA
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
              {isAuthenticated ? (
                <button
                  onClick={() => { setIsMobileMenuOpen(false); navigate("/dasbor"); }}
                  className="w-full py-3 rounded-xl border border-slate-200 bg-slate-50 text-[#035941] text-sm font-extrabold flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">dashboard</span>
                  Dasbor
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full py-3 rounded-xl border border-slate-200 bg-slate-50 text-[#035941] text-sm font-extrabold flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">login</span>
                  Masuk Portal Web
                </Link>
              )}

              <button
                onClick={() => { setIsMobileMenuOpen(false); setShowContactModal(true); }}
                className="w-full py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-extrabold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Hubungi Kami
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ----------------- HERO SECTION (FULL WEB RESPONSIF EDGE-TO-EDGE) ----------------- */}
      <section className="relative pt-8 sm:pt-10 lg:pt-2 pb-12 lg:pb-16 bg-white overflow-hidden">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">

          {/* Hero Left Column */}
          <div className="lg:col-span-6 xl:col-span-5 space-y-6 text-left relative z-20 pl-4 sm:pl-8 lg:pl-16 xl:pl-24 pr-4 animate-fade-in-up">
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-black text-[#035941] leading-none tracking-tight">
                BERSEKA
              </h1>
              <p className="text-2xl sm:text-3xl lg:text-[2.25rem] font-extrabold text-[#58A621] leading-tight tracking-tight">
                Bersih, Sehat, Kampung Asri
              </p>
            </div>

            <p className="text-slate-600 text-sm sm:text-base font-medium leading-relaxed max-w-xl">
              Sistem tata kelola pemilahan sampah cerdas berbasis kecerdasan buatan (AI) dan partisipasi masyarakat terpadu. Menghubungkan warga, pengurus RW, petugas pemilah, mahasiswa KKN, Dosen Pendamping Lapangan (DPL), pihak kelurahan, kecamatan, hingga Dinas Lingkungan Hidup.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link
                to="/download"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-[#035941] hover:bg-[#024633] text-white font-extrabold text-sm transition shadow-md hover:shadow-lg cursor-pointer"
              >
                <Download size={18} />
                <span>Unduh APK Mobile</span>
              </Link>

              <button
                onClick={() => scrollToSection("#program")}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-sm transition shadow-xs cursor-pointer"
              >
                Lihat Program <span className="text-lg">→</span>
              </button>
            </div>
          </div>

           {/* Hero Right Column: Clean Dashboard Image with Responsively Scoped Fade */}
           <div className="lg:col-span-6 xl:col-span-7 relative h-[280px] sm:h-[380px] md:h-[440px] lg:h-[560px] w-full animate-fade-in-up" style={{ animationDelay: "150ms" }}>
             {/* Smooth Multi-stage Gradient Blend Overlay (Desktop Only) */}
             <div className="hidden lg:block absolute inset-y-0 left-0 w-28 sm:w-44 bg-gradient-to-r from-white via-white/80 to-transparent z-10 pointer-events-none" />
             <img
               src="/image/landingpage.png"
               alt="Aksi Pemilahan Sampah Mahasiswa KKN Berdampak"
               className="w-full h-full object-cover object-center lg:object-right transition-all duration-500 lg:[mask-image:linear-gradient(to_right,transparent_0%,black_18%)]"
               // @ts-ignore
               fetchpriority="high"
               decoding="async"
             />
           </div>
        </div>

        {/* Quick Stat Highlights (Connected to Live Database API) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 sm:mt-12">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-lg shadow-slate-200/50 p-6 sm:p-8 grid grid-cols-2 lg:grid-cols-4 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">

            <div className="flex flex-col items-center justify-center text-center space-y-2 pt-2 sm:pt-0 sm:px-4">
              <div className="w-10 h-10 rounded-2xl bg-[#f3fbf5] text-[#035941] border border-[#c8e6b2]/60 flex items-center justify-center">
                <Icon icon="tabler:activity" className="text-xl" />
              </div>
              <p className="text-2xl font-black text-slate-900 tracking-tight">
                {statsData ? `${statsData.kegiatanCount}+` : "28+"}
              </p>
              <p className="text-xs font-bold text-slate-500">Kegiatan Terlaksana</p>
            </div>

            <div className="flex flex-col items-center justify-center text-center space-y-2 pt-2 sm:pt-0 sm:px-4">
              <div className="w-10 h-10 rounded-2xl bg-[#ebf3fb] text-[#0468BF] border border-[#0477BF]/40 flex items-center justify-center">
                <Icon icon="octicon:people-16" className="text-xl" />
              </div>
              <p className="text-2xl font-black text-slate-900 tracking-tight">
                {statsData ? `${statsData.wargaCount}+` : "722+"}
              </p>
              <p className="text-xs font-bold text-slate-500">Pengguna Terlibat</p>
            </div>

            <div className="flex flex-col items-center justify-center text-center space-y-2 pt-2 sm:pt-0 sm:px-4">
              <div className="w-10 h-10 rounded-2xl bg-[#f3fbf5] text-[#58A621] border border-[#c8e6b2]/60 flex items-center justify-center">
                <Icon icon="iconamoon:trash" className="text-xl" />
              </div>
              <div className="flex items-center gap-1.5 justify-center">
                <p className="text-2xl font-black text-slate-900 tracking-tight">
                  {statsData ? formatWasteWeight(statsData.totalSampahKg) : "12.91 kg"}
                </p>
                {renderTrendBadge(statsData?.wasteTrendPercentage, statsData?.wasteTrendDirection, true)}
              </div>
              <p className="text-xs font-bold text-slate-500">Sampah Terkelola</p>
            </div>

            <div className="flex flex-col items-center justify-center text-center space-y-2 pt-2 sm:pt-0 sm:px-4">
              <div className="w-10 h-10 rounded-2xl bg-[#ebf3fb] text-[#0477BF] border border-[#0477BF]/40 flex items-center justify-center">
                <Icon icon="lucide:home" className="text-xl" />
              </div>
              <p className="text-2xl font-black text-slate-900 tracking-tight">
                {statsData ? statsData.kelurahanCount : 6}
              </p>
              <p className="text-xs font-bold text-slate-500">Kelurahan Terlibat</p>
            </div>

          </div>
        </div>
      </section>

      {/* ----------------- 01. ABOUT US ----------------- */}
      <section id="about" className="py-24 bg-white border-y border-slate-200/80 relative overflow-hidden">
        <div className="container-custom space-y-16">

          {/* About Header Narrative */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight text-[#035941]">
              BERSEKA
            </h2>
            <p className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-[#58A621] -mt-2">
              Bersih, Sehat, Kampung Asri
            </p>

            <p className="text-slate-600 text-base sm:text-lg leading-relaxed font-medium">
              Mengangkat kearifan lokal Sunda <em>"Berseka"</em> yang bermakna hidup bersih, apik, dan tertata rapi, platform <strong className="text-[#035941] font-bold">BERSEKA</strong> mengintegrasikan pemilahan sampah dari sumber rumah tangga, verifikasi kode QR fisik tempat sampah, audit klasifikasi berbasis kecerdasan buatan (AI), serta pengangkutan residu secara terstruktur di wilayah Kecamatan Coblong.
            </p>
          </div>

          {/* Clean Light Sustainable Development Goals (SDGs) Grid */}
          <div className="sdg-section py-8">
            <div className="sdg-heading text-center max-w-3xl mx-auto mb-10">
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#1D3B2F] bg-[#1D3B2F]/10 px-3.5 py-1 rounded-full">
                Komitmen Global
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3 tracking-tight">
                Sejalan dengan Tujuan Pembangunan Berkelanjutan (SDGs)
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 md:gap-6 items-stretch w-full mx-auto">
              {sdgs.map((sdg) => (
                <div
                  key={sdg.num}
                  className="group relative bg-white rounded-3xl p-5 md:p-6 border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer"
                >
                  {/* Top Badge (Clean Tag & Number) */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${sdg.bgLight}`}>
                      {sdg.tag}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      SDG {sdg.num}
                    </span>
                  </div>

                  {/* SVG Icon Image Box (Fixed Height, Proportional, Non-Lonjong) */}
                  <div className="relative rounded-2xl overflow-hidden mb-4 h-32 sm:h-36 w-full bg-slate-50 flex items-center justify-center p-3 border border-slate-100/80 group-hover:bg-white group-hover:border-slate-200 transition-colors">
                    <img
                      src={sdg.img}
                      alt={`SDG ${sdg.num}`}
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* KBBI Description (Centered & Balanced) */}
                  <div className="text-center flex-1 flex flex-col justify-start">
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      {sdg.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <p className="sdg-bottom-text text-center text-sm text-slate-600 font-medium mt-10 max-w-3xl mx-auto leading-relaxed">
              Bersama <strong className="text-[#035941] font-extrabold">BERSEKA</strong>, pengelolaan sampah menjadi bagian dari solusi nyata untuk mewujudkan kampung yang bersih, sehat, dan berkelanjutan.
            </p>
          </div>

          <section className="section" id="program">
            <div className="program-section">

              <div className="program-top">

                <div className="program-heading">

                  <p className="eyebrow">
                    Layanan Utama
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                    Layanan terintegrasi untuk mewujudkan ekosistem tata kelola sampah yang berkelanjutan.
                  </h2>

                </div>

                <div className="program-grid">
                  <article className="program-card">
                    <span className="program-icon" aria-hidden="true">
                      <span className="material-symbols-outlined text-emerald-600 text-2xl">account_balance</span>
                    </span>
                    <h3>Portal Dinas Lingkungan Hidup</h3>
                    <p>Integrasi agregasi data, pemantauan kebijakan, dan pelaporan tingkat kedinasan.</p>
                  </article>

                  <article className="program-card">
                    <span className="program-icon" aria-hidden="true">
                      <span className="material-symbols-outlined text-emerald-600 text-2xl">roofing</span>
                    </span>
                    <h3>Portal Rukun Warga</h3>
                    <p>Manajemen setoran sampah warga, verifikasi ide daur ulang, dan distribusi poin insentif.</p>
                  </article>

                  <article className="program-card">
                    <span className="program-icon" aria-hidden="true">
                      <span className="material-symbols-outlined text-[#035941] text-2xl">analytics</span>
                    </span>
                    <h3>Pemantauan Data Sampah</h3>
                    <p>Pemantauan volume sampah organik, anorganik, dan residu secara terukur serta real-time.</p>
                  </article>

                  <article className="program-card">
                    <span className="program-icon" aria-hidden="true">
                      <span className="material-symbols-outlined text-emerald-600 text-2xl">school</span>
                    </span>
                    <h3>Pendampingan Kuliah Kerja Nyata</h3>
                    <p>Pendampingan mahasiswa KKN dalam sosialisasi pemilahan dan aksi bersih lingkungan.</p>
                  </article>
                </div>
              </div>

              <div className="activity-wrapper">
                <div className="activity-header">
                  <div>
                    <p className="eyebrow">Kegiatan Terbaru</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAllActivitiesModal(true)}
                    className="link-more inline-flex items-center gap-1.5 cursor-pointer bg-transparent border-0 font-extrabold text-[#035941] hover:text-[#024633] transition"
                  >
                    <span>Lihat Semua</span>
                    <span>→</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="kegiatan">
                  {(statsData?.recentSchedules && statsData.recentSchedules.length > 0
                    ? statsData.recentSchedules
                    : [
                        {
                          id: "1",
                          title: "Edukasi Pemilahan Sampah Mandiri dan Aktivasi Kode QR di RW 03",
                          date: "2026-05-24",
                          location: "Balai RW 03, Kel. Lebak Gede, Kec. Coblong",
                          category: "Edukasi Pemilahan",
                          imageUrl: "/image/activity-1.png",
                          description:
                            "Sosialisasi tata kelola pemilahan sampah organik dan anorganik dari sumber rumah tangga serta tata cara pemindaian Kode QR tempat sampah fisik oleh mahasiswa KKN dan pengurus RW setempat.",
                          sdgTags: ["#3", "#11", "#12"],
                        },
                        {
                          id: "2",
                          title: "Pengolahan Kompos Dapur & Budidaya Larva Maggot BSF Terpadu",
                          date: "2026-05-20",
                          location: "Rumah Kompos, Kel. Dago, Kec. Coblong",
                          category: "Pengolahan Kompos & Maggot",
                          imageUrl: "/image/activity-2.png",
                          description:
                            "Pelatihan teknis pengomposan sampah sisa makanan rumah tangga dengan instalasi pipa Loseda dan pemanfaatan biokonversi larva Maggot Black Soldier Fly (BSF) untuk menghasilkan pakan ternak tinggi protein.",
                          sdgTags: ["#12", "#13", "#15"],
                        },
                        {
                          id: "3",
                          title: "Aksi Bersih Sungai Cikapundung dan Audit Sampah Plastik",
                          date: "2026-05-18",
                          location: "Bantaran Sungai, Kel. Sekeloa, Kec. Coblong",
                          category: "Aksi Bersih Lingkungan",
                          imageUrl: "/image/activity-3.png",
                          description:
                            "Gerakan pembersihan bantaran sungai terpadu serta audit klasifikasi residu anorganik berbasis kecerdasan buatan (AI) bersama komunitas peduli lingkungan dan mahasiswa KKN.",
                          sdgTags: ["#3", "#11", "#15"],
                        },
                      ]
                  ).map((item: any, idx: number) => {
                    const d = new Date(item.date);
                    const day = isNaN(d.getDate()) ? "24" : String(d.getDate()).padStart(2, "0");
                    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
                    const month = isNaN(d.getMonth()) ? "Mei" : monthNames[d.getMonth()];
                    const fallbackImg = `/image/activity-${(idx % 3) + 1}.png`;

                    return (
                      <div
                        key={item.id || idx}
                        onClick={() => setSelectedActivity(item)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedActivity(item);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        className="block text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-3xl"
                      >
                        <article
                          className="kegiatan-card-modern group bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between cursor-pointer h-full"
                        >
                          {/* Thumbnail Photo Container */}
                          <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-100">
                            <img
                              src={item.imageUrl || fallbackImg}
                              alt={item.title}
                              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = fallbackImg;
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                            {/* Floating Date Badge */}
                            <div className="absolute top-3.5 left-3.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-md border border-white/60 flex flex-col items-center justify-center text-center">
                              <span className="text-sm font-black text-slate-900 leading-none">{day}</span>
                              <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider leading-none mt-0.5">{month}</span>
                            </div>

                            {/* Category Badge */}
                            <div className="absolute top-3.5 right-3.5 bg-emerald-600/90 backdrop-blur-md text-white text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-sm tracking-wider">
                              {item.category || "Aksi Lingkungan"}
                            </div>
                          </div>

                          {/* Content Body */}
                          <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                            <div className="space-y-2">
                              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg leading-snug group-hover:text-emerald-600 transition-colors line-clamp-2 text-left">
                                {item.title}
                              </h3>
                              {item.description && (
                                <p className="text-xs text-slate-500 line-clamp-2 font-normal leading-relaxed">
                                  {item.description}
                                </p>
                              )}
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
                              <span className="flex items-center gap-1.5 text-slate-600 font-medium text-xs leading-normal">
                                <span className="material-symbols-outlined text-base text-[#035941] shrink-0">location_on</span>
                                <span className="truncate max-w-[180px]">{item.location || "Kec. Coblong"}</span>
                              </span>
                              <span className="text-emerald-600 font-extrabold flex items-center gap-1 text-[11px] group-hover:translate-x-1 transition-transform shrink-0">
                                Detail <span>→</span>
                              </span>
                            </div>
                          </div>
                        </article>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

        </div>
      </section>


      {/* ----------------- BERITA KEGIATAN KKN (Real-time CMS) ----------------- */}
      {beritaList.length > 0 && (
        <section id="berita-kkn" className="py-20 bg-white border-b border-slate-100">
          <div className="container-custom space-y-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p className="eyebrow text-emerald-600 font-extrabold text-xs uppercase tracking-widest mb-2">
                  📰 Berita Terkini
                </p>
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                  Kegiatan Mahasiswa KKN
                </h2>
                <p className="text-sm text-slate-500 mt-2 max-w-lg">
                  Liputan langsung kegiatan lingkungan dan sosial mahasiswa KKN yang diperbarui secara real-time.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {beritaList.map((berita) => {
                const tanggal = berita.publishedAt || berita.createdAt;
                const d = new Date(tanggal);
                const day = d.getDate();
                const month = d.toLocaleDateString("id-ID", { month: "short" });

                const KATEGORI_LABEL: Record<string, string> = {
                  KEGIATAN: "Kegiatan KKN",
                  PENGUMUMAN: "Pengumuman",
                  PRESTASI: "Prestasi",
                  LINGKUNGAN: "Lingkungan",
                  UMUM: "Umum",
                };

                return (
                  <article
                    key={berita.id}
                    className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col"
                  >
                    {/* Cover Image */}
                    <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100">
                      {berita.gambarUrl ? (
                        <img
                          src={berita.gambarUrl}
                          alt={berita.judul}
                          className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-5xl opacity-20">🌿</span>
                        </div>
                      )}
                      {/* Date Badge */}
                      <div className="absolute top-3.5 left-3.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-md border border-white/60 flex flex-col items-center text-center">
                        <span className="text-sm font-black text-slate-900 leading-none">{day}</span>
                        <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider leading-none mt-0.5">{month}</span>
                      </div>
                      {/* Category Badge */}
                      <div className="absolute top-3.5 right-3.5 bg-emerald-600/90 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-sm tracking-wider">
                        {KATEGORI_LABEL[berita.kategori] || berita.kategori}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-2">
                        <h3 className="text-base font-extrabold text-slate-900 leading-snug line-clamp-2">
                          {berita.judul}
                        </h3>
                        {berita.ringkasan && (
                          <p className="text-[13px] text-slate-500 leading-relaxed line-clamp-2">
                            {berita.ringkasan}
                          </p>
                        )}
                      </div>
                      {berita.author && (
                        <p className="text-[11px] text-slate-400 font-semibold">
                          oleh {berita.author.name}
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ----------------- 02. WHY US ----------------- */}
      <section id="why-us" className="py-24 bg-[#f0fdf4] border-b border-[#dcfce7]">

        <div className="container-custom space-y-12">

          <div className="text-center">

            {/* Eyebrow */}
            <div className="mx-auto w-fit">
              <p className="why-us-eyebrow">
                MENGAPA BERSEKA
              </p>

              <div className="mt-3 h-1 w-12 rounded-full bg-emerald-600 mx-auto"></div>
            </div>

            <h2 className="mt-4 text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              Mengapa BERSEKA?
            </h2>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto mt-3">
              Bukan sekadar mencatat sampah, BERSEKA menghubungkan kecerdasan buatan,
              partisipasi masyarakat, dan tata kelola lingkungan terpadu dalam satu ekosistem.
            </p>

            {/* Clean Interactive Pills */}
            <div className="flex flex-wrap sm:inline-flex items-center justify-center gap-2.5 p-2 sm:p-1.5 bg-white rounded-2xl sm:rounded-full border border-slate-200/80 shadow-2xs mt-4 max-w-full">
              <button
                onClick={() => setWhyUsTab("points")}
                className={`clean-interactive-tab ${whyUsTab === "points" ? "active" : ""
                  }`}
              >
                Gamifikasi Berbasis Poin
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
                Integrasi IoT
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
                      Insentif dan Audit Poin
                    </span>
                  </div>

                  <span className="text-xs px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full font-bold">
                    Buku Besar Terverifikasi
                  </span>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  Pencatatan poin warga dan mahasiswa menggunakan buku besar terpisah pada basis data demi transparansi audit. Setiap setoran sampah berhadiah poin insentif, dan pengajuan ide daur ulang yang disetujui Pengurus Rukun Warga (RW) memberikan insentif tambahan (+50 poin).
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-2 text-center">

                  <div className="p-3.5 sm:p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">
                      Pengguna Terdaftar
                    </span>
                    <p className="text-xl sm:text-2xl font-black text-emerald-600">
                      {statsData ? `${statsData.wargaCount} Akun` : "722+ Akun"}
                    </p>
                  </div>

                  <div className="p-3.5 sm:p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">
                      Total Poin Terdistribusi
                    </span>
                    <p className="text-xl sm:text-2xl font-black text-amber-500">
                      {statsData && statsData.totalPoin !== undefined ? `${statsData.totalPoin.toLocaleString("id-ID")} Poin` : "6.987 Poin"}
                    </p>
                  </div>

                  <div className="p-3.5 sm:p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">
                      Hadiah Ide Daur Ulang
                    </span>
                    <p className="text-xl sm:text-2xl font-black text-[#035941]">
                      +{statsData && statsData.poinRewardIde !== undefined ? statsData.poinRewardIde : 50} Poin
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
                      Aturan Tempat Sampah
                    </span>

                  </div>

                  <span className="text-xs px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-bold">
                    Validasi QR Code
                  </span>

                </div>

                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  Setiap rumah tangga berhak mendaftarkan maksimal 2 tempat sampah (1 organik dan 1 anorganik). Tempat sampah aktif selama 30 hari dan diperbarui otomatis setiap penyetoran. Penjemputan residu dipisahkan dan ditimbang secara manual oleh Petugas Pemilah.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">

                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-black text-slate-900">
                        Total Tempat Sampah Terdaftar
                      </p>
                      <p className="text-xs text-slate-500 font-medium">
                        Tersebar di {statsData ? `${statsData.kelurahanCount} Kelurahan` : "6 Kelurahan"}
                      </p>
                    </div>

                    <span className="text-xs font-black px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl">
                      {statsData ? `${statsData.totalBinsCount || 120} Unit` : "120 Unit"}
                    </span>
                  </div>

                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-black text-slate-900">
                        Total Penjemputan dan Residu
                      </p>
                      <p className="text-xs text-slate-500 font-medium">
                        Log transaksi setoran terverifikasi
                      </p>
                    </div>

                    <span className="text-xs font-black px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl">
                      {statsData ? `${statsData.totalPenjemputan || 468} Log` : "468 Log"}
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
                      Integrasi Perangkat IoT
                    </span>

                  </div>

                  <span className="text-xs px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full font-bold">
                    Rencana Masa Depan
                  </span>

                </div>

                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  BERSEKA dirancang untuk dapat terintegrasi dengan perangkat sensor Internet of Things (IoT) pada tahap pengembangan lanjutan guna memantau kapasitas Tempat Sampah secara otomatis dan terukur demi mendukung efisiensi rute penjemputan.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">

                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
                      <span className="material-symbols-outlined">
                        sensors
                      </span>
                    </div>

                    <p className="text-sm font-black text-slate-900">
                      Smart Bin IoT
                    </p>

                    <p className="text-xs text-slate-500 font-medium mt-1">
                      {statsData ? `${statsData.smartIotBinsCount || 48} Perangkat` : "48 Perangkat"} aktif.
                    </p>
                  </div>

                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                      <span className="material-symbols-outlined">
                        location_city
                      </span>
                    </div>

                    <p className="text-sm font-black text-slate-900">
                      Kelurahan Binaan
                    </p>

                    <p className="text-xs text-slate-500 font-medium mt-1">
                      {statsData ? `${statsData.kelurahanCount} Kelurahan` : "6 Kelurahan"} terintegrasi.
                    </p>
                  </div>

                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
                      <span className="material-symbols-outlined">
                        route
                      </span>
                    </div>

                    <p className="text-sm font-black text-slate-900">
                      Volume Terkelola
                    </p>

                    <p className="text-xs text-slate-500 font-medium mt-1">
                      {statsData ? `${formatWasteWeightExact(statsData.totalSampahKg)}` : "12.91 kg"} terkelola.
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
              { icon: "schedule", num: "2", title: "Window Waktu", desc: "Pengangkutan di window 06:00-08:00 dan 16:00-18:00." },
              { icon: "qr_code_scanner", num: "3", title: "Scan dan Angkut", desc: "Petugas melakukan pengangkutan dan memindai kode QR Tempat Sampah." },
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

              <span className="dampak-value flex items-center justify-center sm:justify-start gap-2">
                {statsData ? formatWasteWeight(statsData.totalSampahKg) : "12.91 kg"}
                {renderTrendBadge(statsData?.wasteTrendPercentage, statsData?.wasteTrendDirection, false)}
              </span>

              <span className="dampak-sub">
                Total akumulasi terkelola
              </span>
            </div>

            {/* Statistik 2 */}
            <div className="dampak-card dampak-card-2">
              <span className="dampak-label">
                Pengguna Terlibat
              </span>

              <span className="dampak-value">
                {statsData ? `${statsData.wargaCount}+` : "722+"}
              </span>

              <span className="dampak-sub">
                Pengguna Terdaftar
              </span>
            </div>

            {/* Statistik 3 */}
            <div className="dampak-card dampak-card-3">
              <span className="dampak-label">
                Kegiatan Terlaksana
              </span>

              <span className="dampak-value">
                {statsData ? `${statsData.kegiatanCount}+` : "28+"}
              </span>

              <span className="dampak-sub">
                Aksi & Edukasi
              </span>
            </div>

            {/* Statistik 4 */}
            <div className="dampak-card dampak-card-4">
              <span className="dampak-label">
                Kelurahan Terbina
              </span>

              <span className="dampak-value">
                {statsData ? `${statsData.kelurahanCount}` : "6"}
              </span>

              <span className="dampak-sub">
                Kelurahan di Kec. Coblong
              </span>
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
                Terpercaya
              </h2>

              <p className="mitra-description">
                Bersama berbagai pihak, BERSEKA membangun kolaborasi
                untuk menciptakan lingkungan yang lebih bersih,
                sehat, dan berkelanjutan di Kecamatan Coblong.
              </p>
            </div>

            {/* RIGHT LOGOS */}
            <div className="mitra-logos">

               <div className="mitra-logo-card">
                 <img src="/image/mitra/unikom.png" alt="Universitas Komputer Indonesia" className="mitra-logo-img" />
                 <span>Universitas Komputer<br />Indonesia</span>
               </div>

              <div className="mitra-logo-card">
                <img src="/image/mitra/pemkot-bandung.png" alt="Pemerintah Kota Bandung" className="mitra-logo-img" />
                <span>Pemerintah<br />Kota Bandung</span>
              </div>

               <div className="mitra-logo-card">
                 <img src="/image/mitra/dlh-bandung.jpg" alt="Dinas Lingkungan Hidup Kota Bandung" className="mitra-logo-img" />
                 <span>Dinas Lingkungan Hidup<br />Kota Bandung</span>
               </div>

               <div className="mitra-logo-card">
                 <img src="/image/mitra/prov-jabar.png" alt="Pemerintah Provinsi Jawa Barat" className="mitra-logo-img" />
                 <span>Pemerintah<br />Provinsi Jawa Barat</span>
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
              Temukan jawaban atas pertanyaan umum mengenai BERSEKA,
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
                  Apa itu BERSEKA?
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
                    BERSEKA (Bersih, Sehat, Kampung Asri) merupakan sistem tata kelola pemilahan sampah cerdas terpadu di Kecamatan Coblong yang menghubungkan warga, pengurus RW, petugas pemilah, mahasiswa KKN UNIKOM, dan instansi pemerintah melalui pemindaian Kode QR Tempat Sampah fisik dan verifikasi berbasis AI.
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
                  Bagaimana cara menggunakan BERSEKA?
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
                    Warga cukup memilah sampah dari rumah ke Tempat Sampah Organik dan Anorganik ber-QR Code, melakukan pemindaian melalui aplikasi mobile saat penyetoran, dan memperoleh poin reward atas kepatuhan pemilahan yang terverifikasi.
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
                  Apa saja jenis sampah yang dikelola dalam sistem BERSEKA?
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
                    Sistem BERSEKA memfasilitasi 2 jenis Tempat Sampah di rumah warga: Tempat Sampah Organik (diolah menjadi kompos/budidaya maggot) dan Anorganik (disalurkan ke Bank Sampah/daur ulang), sedangkan sampah residu diangkut terjadwal oleh Petugas Residu ke TPA.
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
                  Siapa saja yang dapat menggunakan sistem BERSEKA?
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
                    BERSEKA dirancang multi-peran untuk mendukung seluruh pemangku kepentingan: Warga, Mahasiswa KKN, Dosen Pendamping (DPL), Pengurus RW, Petugas Residu, Lurah se-Kecamatan Coblong, Camat, hingga Dinas Lingkungan Hidup (DLH) Kota Bandung.
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
            <h2 className="text-4xl font-extrabold text-slate-900">Pemanfaatan Hilir dan Fasilitas GIS</h2>
            <p className="text-slate-500 text-sm font-medium">Pengolahan sampah terintegrasi di seluruh wilayah operasional</p>

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
                { title: "Plastik", icon: "local_drink", color: "text-emerald-600", desc: "Didaur ulang menjadi produk kerajinan dan modul ecobrick." },
                { title: "Kertas", icon: "description", color: "text-amber-500", desc: "Kardus dan koran diolah kembali menjadi bubur kertas daur ulang." },
                { title: "Logam", icon: "hardware", color: "text-slate-600", desc: "Kaleng dan potongan besi disalurkan ke mitra peleburan logam." },
                { title: "Kaca", icon: "wine_bar", color: "text-emerald-500", desc: "Botol kaca disalurkan ke industri daur ulang kaca utuh." },
                { title: "Organik", icon: "eco", color: "text-green-600", desc: "Sisa dapur diolah di Loseda, Bata Terawang, dan Budidaya Maggot BSF." },
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
                  title: "Loseda dan Bata Terawang",
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
                  title: "Bank Sampah dan Ecobrick",
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
        <div className="container-custom grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
          <div className="space-y-4 lg:col-span-1 col-span-full">
            <div className="flex items-center gap-2.5 text-white font-black text-xl">
              <BersekaLogoIcon className="h-10 w-auto shrink-0" />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Bersih, Sehat, Kampung Asri — Sistem Pemilahan dan Pengelolaan Sampah Terintegrasi Kecamatan Coblong.
            </p>
            <p className="text-xs text-slate-400 font-semibold">© 2026 Universitas Komputer Indonesia. All Rights Reserved.</p>
          </div>

          <div>
            <h5 className="text-white font-extrabold text-xs uppercase tracking-wider mb-4">Navigasi</h5>
            <ul className="space-y-2.5 text-xs font-semibold">
              <li><button onClick={() => scrollToSection("#about")} className="hover:text-white transition">Tentang Kami</button></li>
              <li><button onClick={() => scrollToSection("#why-us")} className="hover:text-white transition">Mengapa BERSEKA</button></li>
              <li><button onClick={() => scrollToSection("#dampak")} className="hover:text-white transition">Dampak</button></li>
              <li><button onClick={() => scrollToSection("#mitra")} className="hover:text-white transition">Mitra</button></li>
              <li><button onClick={() => scrollToSection("#faq")} className="hover:text-white transition">FAQ</button></li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-extrabold text-xs uppercase tracking-wider mb-4">Layanan Warga</h5>
            <ul className="space-y-2.5 text-xs font-semibold">
              <li><Link to="/login" className="hover:text-white transition">Portal Rukun Warga</Link></li>
              <li><Link to="/login" className="hover:text-white transition">Portal Dosen Pendamping Lapangan</Link></li>
              <li><Link to="/login" className="hover:text-white transition">Pendampingan Kuliah Kerja Nyata</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-extrabold text-xs uppercase tracking-wider mb-4">Layanan Dinas</h5>
            <ul className="space-y-2.5 text-xs font-semibold">
              <li><Link to="/login" className="hover:text-white transition">Portal Pimpinan</Link></li>
              <li><Link to="/login" className="hover:text-white transition">Portal Dinas Lingkungan Hidup</Link></li>
              <li><Link to="/login" className="hover:text-white transition">Portal Camat dan Lurah</Link></li>
              <li><Link to="/login" className="hover:text-white transition">Pemantauan Data Sampah</Link></li>
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

      {/* ----------------- CONTACT US MODAL ----------------- */}
      {
        showContactModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#f3fbf5] text-[#035941] border border-[#c8e6b2] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-xl">contact_support</span>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-lg leading-tight">
                      Hubungi Kami
                    </h3>
                    <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Sistem Tata Kelola Sampah Berdampak</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowContactModal(false)}
                  className="w-9 h-9 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center transition cursor-pointer"
                  aria-label="Tutup modal"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              {/* Body */}
              <div className="space-y-4 text-xs text-slate-600">
                <p className="font-medium text-slate-600 leading-relaxed">
                  Untuk informasi seputar sistem pemilahan sampah cerdas atau kerja sama operasional:
                </p>

                <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/70 space-y-4">
                  {/* Location Item */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-[#f3fbf5] text-[#035941] border border-[#c8e6b2] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      <span className="material-symbols-outlined text-lg">location_on</span>
                    </div>
                    <div className="space-y-1 flex-1">
                      <p className="font-extrabold text-slate-900 text-xs sm:text-sm">
                        Universitas Komputer Indonesia
                      </p>
                      <p className="text-slate-600 leading-relaxed font-medium text-xs">
                        Jl. Dipati Ukur No.112-116, Lebakgede, Kecamatan Coblong, Kota Bandung, Jawa Barat 40132
                      </p>
                      <a
                        href="https://maps.google.com/?q=Universitas+Komputer+Indonesia+Jl.+Dipati+Ukur+No.112-116+Bandung"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-1.5 px-3 py-1.5 rounded-xl bg-[#035941] hover:bg-[#024633] text-white font-extrabold text-[11px] transition shadow-2xs"
                      >
                        <span className="material-symbols-outlined text-sm">map</span>
                        Buka di Google Maps <span>→</span>
                      </a>
                    </div>
                  </div>

                  {/* Email Item */}
                  <div className="flex items-center gap-3.5 pt-3 border-t border-slate-200/70">
                    <div className="w-9 h-9 rounded-xl bg-sky-100 text-[#0468BF] flex items-center justify-center shrink-0 shadow-2xs">
                      <span className="material-symbols-outlined text-lg">mail</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Resmi</p>
                      <a
                        href="mailto:cdc@unikom.ac.id"
                        className="font-extrabold text-slate-900 hover:text-[#035941] transition-colors text-xs sm:text-sm"
                      >
                        cdc@unikom.ac.id
                      </a>
                    </div>
                  </div>

                  {/* WhatsApp Item */}
                  <div className="flex items-center gap-3.5 pt-3 border-t border-slate-200/70">
                    <div className="w-9 h-9 rounded-xl bg-green-100 text-green-700 flex items-center justify-center shrink-0 shadow-2xs">
                      <span className="material-symbols-outlined text-lg">chat</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-slate-400 tracking-wider">WhatsApp Support</p>
                      <a
                        href="https://wa.me/6285715516065"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-extrabold text-slate-900 hover:text-[#035941] transition-colors text-xs sm:text-sm"
                      >
                        +62 857-1551-6065
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Action */}
              <button
                onClick={() => setShowContactModal(false)}
                className="w-full py-3.5 rounded-2xl bg-[#035941] hover:bg-[#024633] text-white font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-[#035941]/20"
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
                  <span className="material-symbols-outlined text-[#035941]">android</span>
                  Unduh Aplikasi Mobile
                </h3>
                <button onClick={() => setShowApkModal(false)} className="text-slate-400 hover:text-slate-600 transition">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="text-center py-2 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-[#f3fbf5] text-[#035941] flex items-center justify-center mx-auto shadow-sm">
                  <span className="material-symbols-outlined text-3xl">download_for_offline</span>
                </div>
                <h4 className="font-bold text-slate-900 text-base">BERSEKA Mobile App (Android APK)</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Unduh berkas installer APK rilis terbaru atau lihat catatan rilis dan panduan instalasi lengkap.
                </p>
              </div>

              <div className="flex flex-col gap-2.5">
                <Link
                  to="/download"
                  onClick={() => setShowApkModal(false)}
                  className="w-full py-3.5 rounded-2xl bg-[#035941] hover:bg-[#024633] text-white font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-[#035941]/20"
                >
                  <Download size={16} />
                  <span>Buka Halaman Unduh APK</span>
                </Link>

                <button
                  onClick={() => setShowApkModal(false)}
                  className="w-full py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 font-extrabold text-xs flex items-center justify-center transition cursor-pointer hover:bg-slate-100"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* ----------------- INTERACTIVE PUBLIC ACTIVITY DETAIL MODAL ----------------- */}
      {selectedActivity && (
        <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-100 my-8 max-h-[90vh] flex flex-col justify-between">
            <div>
              {/* Photo & Header */}
              <div className="relative h-60 w-full bg-slate-900 overflow-hidden">
                <img
                  src={selectedActivity.imageUrl || "/image/activity-1.png"}
                  alt={selectedActivity.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/image/activity-1.png";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                {/* Close Button */}
                <button
                  onClick={() => setSelectedActivity(null)}
                  className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/40 text-white hover:bg-black/60 flex items-center justify-center transition backdrop-blur-md cursor-pointer z-10"
                  aria-label="Tutup"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>

                {/* Badges on Banner */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-600 text-white text-[11px] font-black uppercase px-3 py-1 rounded-full shadow-md tracking-wider">
                      {selectedActivity.category || "Aksi Pemilahan Sampah"}
                    </span>
                    {selectedActivity.sdgTags?.map((tag: string) => (
                      <span
                        key={tag}
                        className="bg-white/90 text-slate-800 text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs backdrop-blur-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <span className="bg-white/90 text-slate-900 text-xs font-black px-3 py-1 rounded-xl shadow-xs backdrop-blur-xs flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-emerald-600">calendar_today</span>
                    {selectedActivity.date || "2026-05-24"}
                  </span>
                </div>
              </div>

              {/* Body Details */}
              <div className="p-6 sm:p-7 space-y-4 overflow-y-auto max-h-[40vh]">
                <h3 className="font-black text-slate-900 text-lg sm:text-xl leading-snug">
                  {selectedActivity.title}
                </h3>

                <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="material-symbols-outlined text-base text-[#035941] shrink-0">location_on</span>
                  <span>{selectedActivity.location || "Kecamatan Coblong, Kota Bandung"}</span>
                </div>

                <div className="space-y-2 pt-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Deskripsi & Narasi Kegiatan
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium whitespace-pre-line">
                    {selectedActivity.description ||
                      "Kegiatan kolaborasi pengelolaan lingkungan hidup dan edukasi pemilahan sampah mandiri bersama warga, aparat kewilayahan, serta mahasiswa KKN di Kecamatan Coblong, Kota Bandung."}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedActivity(null)}
                className="px-5 py-2.5 rounded-2xl border border-slate-200 bg-white text-slate-700 font-extrabold text-xs hover:bg-slate-100 transition cursor-pointer"
              >
                Tutup
              </button>

              <Link
                to="/login"
                className="px-6 py-2.5 rounded-2xl bg-[#035941] hover:bg-[#024633] text-white font-extrabold text-xs flex items-center gap-2 transition cursor-pointer shadow-md shadow-[#035941]/20"
              >
                <span>Masuk ke Aplikasi</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- MODAL KATALOG SEMUA KEGIATAN PUBLIK ----------------- */}
      {showAllActivitiesModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 my-8 max-h-[90vh] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#035941]">local_activity</span>
                    Semua Kegiatan Lingkungan & Pemilahan
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Dokumentasi aksi lapangan mahasiswa KKN dan masyarakat di Kecamatan Coblong
                  </p>
                </div>
                <button
                  onClick={() => setShowAllActivitiesModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition p-1"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="py-4 grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto max-h-[55vh] pr-1">
                {(statsData?.recentSchedules && statsData.recentSchedules.length > 0
                  ? statsData.recentSchedules
                  : [
                      {
                        id: "1",
                        title: "Edukasi Pemilahan Sampah Mandiri dan Aktivasi Kode QR di RW 03",
                        date: "2026-05-24",
                        location: "Balai RW 03, Kel. Lebak Gede, Kec. Coblong",
                        category: "Edukasi Pemilahan",
                        imageUrl: "/image/activity-1.png",
                        description:
                          "Sosialisasi tata kelola pemilahan sampah organik dan anorganik dari sumber rumah tangga serta tata cara pemindaian Kode QR tempat sampah fisik oleh mahasiswa KKN dan pengurus RW setempat.",
                      },
                      {
                        id: "2",
                        title: "Pengolahan Kompos Dapur & Budidaya Larva Maggot BSF Terpadu",
                        date: "2026-05-20",
                        location: "Rumah Kompos, Kel. Dago, Kec. Coblong",
                        category: "Pengolahan Kompos & Maggot",
                        imageUrl: "/image/activity-2.png",
                        description:
                          "Pelatihan teknis pengomposan sampah sisa makanan rumah tangga dengan instalasi pipa Loseda dan pemanfaatan biokonversi larva Maggot Black Soldier Fly (BSF) untuk menghasilkan pakan ternak tinggi protein.",
                      },
                      {
                        id: "3",
                        title: "Aksi Bersih Sungai Cikapundung dan Audit Sampah Plastik",
                        date: "2026-05-18",
                        location: "Bantaran Sungai, Kel. Sekeloa, Kec. Coblong",
                        category: "Aksi Bersih Lingkungan",
                        imageUrl: "/image/activity-3.png",
                        description:
                          "Gerakan pembersihan bantaran sungai terpadu serta audit klasifikasi residu anorganik berbasis kecerdasan buatan (AI) bersama komunitas peduli lingkungan dan mahasiswa KKN.",
                      },
                    ]
                ).map((act: any, aIdx: number) => (
                  <div
                    key={act.id || aIdx}
                    onClick={() => {
                      setSelectedActivity(act);
                    }}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-3 text-left"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {act.category || "Aksi Lingkungan"}
                        </span>
                        <span className="text-[11px] text-slate-400 font-semibold">
                          {act.date}
                        </span>
                      </div>
                      <h4 className="text-xs font-black text-slate-900 line-clamp-2 leading-snug">
                        {act.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2 font-normal">
                        {act.description || "Aksi lapangan pemilahan sampah dan konservasi lingkungan."}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span className="truncate max-w-[170px]">{act.location}</span>
                      <span className="text-emerald-600 font-extrabold flex items-center gap-0.5">
                        Buka <span>→</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAllActivitiesModal(false)}
                className="px-6 py-2.5 rounded-2xl bg-slate-100 text-slate-700 font-extrabold text-xs hover:bg-slate-200 transition cursor-pointer"
              >
                Tutup Katalog
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button: Download Aplikasi Mobile APK */}
      <div className="fixed bottom-6 right-6 sm:right-10 z-50 group flex items-center justify-center pointer-events-auto">
        <div className="relative flex items-center justify-center">
          {/* Outer Animated Ping Ripple Effect */}
          <span className="absolute -inset-1.5 rounded-full bg-[#035941]/30 animate-ping opacity-75 pointer-events-none" />

          <Link
            to="/download"
            className="relative w-14 h-14 bg-[#035941] hover:bg-[#024633] text-white rounded-full flex items-center justify-center shadow-2xl shadow-[#035941]/40 hover:scale-110 active:scale-95 transition-all duration-300 border-2 border-white/80 cursor-pointer shrink-0"
            aria-label="Unduh Aplikasi Mobile BERSEKA (APK)"
          >
            <Download size={22} className="text-white group-hover:rotate-12 transition-transform" />

            {/* Tooltip on Hover */}
            <span className="absolute right-16 top-1/2 -translate-y-1/2 px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-black tracking-wide whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 translate-x-2 transition-all duration-300 shadow-xl border border-slate-800">
              Unduh Aplikasi Mobile BERSEKA (APK)
            </span>
          </Link>
        </div>
      </div>

    </div>
  );
};

export default LandingPage;
