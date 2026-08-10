/**
 * Project: TrashCare Landing Page (Update CTA button text to 'Login')
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import "./LandingPage.css";

// Material Symbols Icon component for stats strip
const Icon: React.FC<{ icon: string; className?: string }> = ({ icon, className = "" }) => {
  const iconMap: Record<string, string> = {
    "tabler:activity": "analytics",
    "octicon:people-16": "groups",
    "iconamoon:trash": "delete",
    "lucide:home": "home",
    "solar:chart-linear": "monitoring",
  };
  return <span className={`material-symbols-outlined ${className}`}>{iconMap[icon] || "star"}</span>;
};

// Official High-Resolution TrashCare Icon Mark Asset (Matches user's reference image 1:1)
const TrashCareLogoIcon: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <img
    src="/image/trashcare-icon.png"
    alt="TrashCare Icon"
    className={`${className} object-contain shrink-0`}
  />
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
      desc: "Mendorong partisipasi warga Coblong dalam pemilahan guna mewujudkan kota yang lestari.",
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
            <TrashCareLogoIcon className="w-10 h-10 sm:w-11 sm:h-11 transition-transform group-hover:scale-105 shrink-0" />
            <span className="text-2xl sm:text-[1.75rem] font-black tracking-tight leading-normal text-left relative -top-[2px]">
              <span className="text-[#0073E6]">Trash</span>
              <span className="text-[#59B828]">Care</span>
            </span>
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

          {/* Action Buttons (Desktop only — on mobile everything lives in the drawer) */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Wrapper is required: .btn-primary-clean sets display:inline-flex and would
                override Tailwind's .hidden if applied directly to the buttons. */}
            <div className="hidden lg:flex items-center gap-3">
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
                  Login
                </Link>
              )}

              <button
                onClick={() => setShowContactModal(true)}
                className="btn-secondary-clean"
              >
                Contact Us
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
              {isAuthenticated ? (
                <button
                  onClick={() => { setIsMobileMenuOpen(false); navigate("/dashboard"); }}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-extrabold flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-emerald-600/20"
                >
                  <span className="material-symbols-outlined text-lg">dashboard</span>
                  Ke Dashboard
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-extrabold flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-emerald-600/20"
                >
                  <span className="material-symbols-outlined text-lg">login</span>
                  Login
                </Link>
              )}

              <button
                onClick={() => { setIsMobileMenuOpen(false); setShowContactModal(true); }}
                className="w-full py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-extrabold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Contact Us
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ----------------- HERO SECTION (FULL WEB RESPONSIF EDGE-TO-EDGE) ----------------- */}
      <section className="relative pt-8 sm:pt-10 lg:pt-2 pb-12 lg:pb-16 bg-white overflow-hidden">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">

          {/* Hero Left Column: Wording match user's screenshot 1:1 */}
          <div className="lg:col-span-6 xl:col-span-5 space-y-6 text-left relative z-20 pl-4 sm:pl-8 lg:pl-16 xl:pl-24 pr-4">
            <h1 className="text-3xl sm:text-4xl lg:text-[3rem] font-black text-slate-900 leading-[1.15] tracking-tight">
              Sampah <span className="text-[#0084DC]">Terdata</span>,<br />
              Lingkungan <span className="text-[#009966]">Tertata</span>
            </h1>

            <p className="text-slate-600 text-sm sm:text-base font-medium leading-relaxed max-w-xl">
              Sistem tata kelola sampah terintegrasi dengan pendekatan kegiatan KKN berdampak yang menghubungkan warga, petugas residu, mahasiswa, dosen pendamping lapangan, pimpinan perguruan tinggi, RW, kelurahan, kecamatan, dan Dinas Lingkungan Hidup.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                onClick={() => scrollToSection("#program")}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-[#009966] hover:bg-[#008055] text-white font-extrabold text-sm transition shadow-md cursor-pointer"
              >
                Lihat Program <span className="text-lg">→</span>
              </button>

              <button
                onClick={() => scrollToSection("#about")}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-900 font-extrabold text-sm transition shadow-xs cursor-pointer"
              >
                Pelajari Lebih Lanjut
              </button>
            </div>
          </div>

          {/* Hero Right Column: Clean Dashboard Image */}
           <div className="lg:col-span-6 xl:col-span-7 relative h-[300px] sm:h-[400px] md:h-[420px] lg:h-[540px] w-full">
             <img
               src="/image/dashboard.png"
               alt="Aksi Pemilahan Sampah Mahasiswa KKN Coblong"
               className="w-full h-full object-cover object-center lg:object-right rounded-3xl shadow-lg"
             />
           </div>
        </div>

        {/* Quick Stat Highlights (Clean White Card as shown in user screenshot) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 sm:mt-12">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-lg shadow-slate-200/50 p-6 sm:p-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">

            <div className="flex flex-col items-center justify-center text-center space-y-2 pt-2 sm:pt-0 sm:px-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center">
                <Icon icon="tabler:activity" className="text-xl" />
              </div>
              <p className="text-2xl font-black text-slate-900 tracking-tight">25+</p>
              <p className="text-xs font-bold text-slate-500">Kegiatan Terlaksana</p>
            </div>

            <div className="flex flex-col items-center justify-center text-center space-y-2 pt-2 sm:pt-0 sm:px-4">
              <div className="w-10 h-10 rounded-2xl bg-sky-100/80 text-sky-700 flex items-center justify-center">
                <Icon icon="octicon:people-16" className="text-xl" />
              </div>
              <p className="text-2xl font-black text-slate-900 tracking-tight">500+</p>
              <p className="text-xs font-bold text-slate-500">Warga Terlibat</p>
            </div>

            <div className="flex flex-col items-center justify-center text-center space-y-2 pt-2 sm:pt-0 sm:px-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center">
                <Icon icon="iconamoon:trash" className="text-xl" />
              </div>
              <p className="text-2xl font-black text-slate-900 tracking-tight">1.250+ kg</p>
              <p className="text-xs font-bold text-slate-500">Sampah Terkelola</p>
            </div>

            <div className="flex flex-col items-center justify-center text-center space-y-2 pt-2 sm:pt-0 sm:px-4">
              <div className="w-10 h-10 rounded-2xl bg-teal-100/80 text-teal-700 flex items-center justify-center">
                <Icon icon="lucide:home" className="text-xl" />
              </div>
              <p className="text-2xl font-black text-slate-900 tracking-tight">6</p>
              <p className="text-xs font-bold text-slate-500">Kelurahan Terlibat</p>
            </div>

            <div className="flex flex-col items-center justify-center text-center space-y-2 pt-2 sm:pt-0 sm:px-4 col-span-2 sm:col-span-1">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center">
                <Icon icon="solar:chart-linear" className="text-xl" />
              </div>
              <p className="text-2xl font-black text-slate-900 tracking-tight">35%</p>
              <p className="text-xs font-bold text-slate-500">Tingkat Pemilahan</p>
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
          <div className="sdg-section py-12">
            <div className="sdg-heading text-center max-w-3xl mx-auto mb-10">
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#1D3B2F] bg-[#1D3B2F]/10 px-3.5 py-1 rounded-full">
                Komitmen Global
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3 tracking-tight">
                Sejalan dengan Tujuan Pembangunan Berkelanjutan (SDGs)
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 md:gap-6 items-stretch max-w-7xl mx-auto px-4">
              {sdgs.map((sdg) => (
                <div
                  key={sdg.num}
                  className="group relative bg-white rounded-3xl p-5 md:p-6 border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer"
                >
                  {/* Top Badge (Single Clean Badge) */}
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

                  {/* KBBI Description Only (Title is inside SVG image) */}
                  <div className="text-left flex-1 flex flex-col justify-start">
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                      {sdg.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <p className="sdg-bottom-text text-center text-xs text-slate-500 font-medium mt-8">
              Bersama TrashCare, pengelolaan sampah menjadi bagian dari solusi untuk lingkungan yang lebih bersih dan berkelanjutan.
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
            <div className="flex flex-wrap sm:inline-flex items-center justify-center gap-2.5 p-2 sm:p-1.5 bg-white rounded-2xl sm:rounded-full border border-slate-200/80 shadow-2xs mt-4 max-w-full">
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
                      Reward dan Audit
                    </span>
                  </div>

                  <span className="text-xs px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full font-bold">
                    Reward dan Audit
                  </span>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  Pencatatan poin Warga dan Mahasiswa KKN menggunakan ledger
                  terpisah di database demi transparansi audit. Setiap setoran
                  sampah berhadiah poin insentif, dan pengajuan ide daur ulang
                  yang disetujui RW memberikan reward tambahan (+50 poin).
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-2 text-center">

                  <div className="p-3.5 sm:p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">
                      Level Warga
                    </span>
                    <p className="text-xl sm:text-2xl font-black text-emerald-600">
                      Level 8
                    </p>
                  </div>

                  <div className="p-3.5 sm:p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">
                      Total Poin
                    </span>
                    <p className="text-xl sm:text-2xl font-black text-amber-500">
                      2.450 Poin
                    </p>
                  </div>

                  <div className="p-3.5 sm:p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">
                      Ide Daur Ulang
                    </span>
                    <p className="text-xl sm:text-2xl font-black text-emerald-600">
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
                  sampah (1 Organik dan 1 Anorganik). Tempat sampah aktif
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
                35%
              </span>

              <span className="dampak-sub">
                Rata-rata
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
                Bersama berbagai pihak, TrashCare membangun kolaborasi
                untuk menciptakan lingkungan yang lebih bersih,
                sehat, dan berkelanjutan.
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
            <h2 className="text-4xl font-extrabold text-slate-900">Pemanfaatan Hilir dan Fasilitas GIS</h2>
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
        <div className="container-custom grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-white font-black text-xl">
              <TrashCareLogoIcon className="w-8 h-8" />
              <span className="text-[#0084DC] ">Trash<span className="text-emerald-400">Care</span></span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Sistem Pemilahan dan Pengelolaan Sampah Terintegrasi.
            </p>
            <p className="text-xs text-slate-500 font-semibold">© 2026 Universitas Komputer Indonesia. All rights reserved.</p>
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
              <li><Link to="/login" className="hover:text-white transition">Portal Dabsor</Link></li>
              <li><Link to="/login" className="hover:text-white transition">Monitoring</Link></li>
              <li><Link to="/login" className="hover:text-white transition">Pendampingan Kuliah Kerja Nyata</Link></li>
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

              <div className="space-y-4 text-xs text-slate-600">
                <p className="font-medium leading-relaxed">
                  Untuk informasi seputar sistem pemilahan sampah cerdas Kecamatan Coblong atau kerja sama operasional:
                </p>
                
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3.5">
                  {/* Location Item */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-base">location_on</span>
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-extrabold text-slate-900 text-xs">Kampus Dago UNIKOM</p>
                      <p className="text-slate-600 leading-relaxed font-medium">
                        Jl. Dipati Ukur No.99, Lebakgede, Kec. Coblong, Kota Bandung, Jawa Barat 40132
                      </p>
                    </div>
                  </div>

                  {/* Email Item */}
                  <div className="flex items-center gap-3 pt-1 border-t border-slate-200/60">
                    <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-base">mail</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Resmi</p>
                      <a href="mailto:cdc@unikom.ac.id" className="font-extrabold text-slate-800 hover:text-emerald-600 transition-colors">
                        cdc@unikom.ac.id
                      </a>
                    </div>
                  </div>

                  {/* WhatsApp Item */}
                  <div className="flex items-center gap-3 pt-1 border-t border-slate-200/60">
                    <div className="w-8 h-8 rounded-xl bg-green-100 text-green-700 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-base">chat</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">WhatsApp Support</p>
                      <a href="https://wa.me/6285715516065" target="_blank" rel="noopener noreferrer" className="font-extrabold text-slate-800 hover:text-emerald-600 transition-colors">
                        +62 857-1551-6065
                      </a>
                    </div>
                  </div>
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
