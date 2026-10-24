/**
 * Project: BERSEKA.ID
 * Component: LoginKknHero
 * Acuan Desain: apps/web/public/image/loginpage/berseka-login.html
 * 
 * Panel visual kiri Halaman Login (KKN Tematik):
 * - Background Teal Resmi (#04999C) dengan aksen matahari kuning (#FFD166)
 * - Kurva SVG organik yang menyatu halus ke panel kanan (#F5F7F8)
 * - Padding kanan desktop disesuaikan (lg:pr-[130px] xl:pr-[170px]) agar tidak tertabrak kurva SVG
 * - Rounded bottom 28px di mobile agar transisi kartu form tumpang-tindih rapi
 * - Ilustrasi 3D vector mahasiswa KKN melayang (animate-float)
 * - Widget progres fase kegiatan KKN & catatan pengingat harian DPL
 */

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Calendar, ClipboardList } from "lucide-react";
import api from "../../../services/api";

export interface LoginKknHeroProps {
  className?: string;
}

export const LoginKknHero: React.FC<LoginKknHeroProps> = ({ className = "" }) => {
  const [activeStageTitle, setActiveStageTitle] = useState("Evaluasi dan laporan akhir");
  const [activeStageDate, setActiveStageDate] = useState("7–31 Oktober 2026");
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [phaseShortLabel, setPhaseShortLabel] = useState("berlangsung");
  const [phaseFullLabel, setPhaseFullLabel] = useState("Berlangsung");

  useEffect(() => {
    let isMounted = true;

    // 1. Hitung progres linimasa (Default rentang fase KKN 7-31 Okt 2026)
    const d0 = new Date("2026-10-07T00:00:00").getTime();
    const d1 = new Date("2026-10-31T23:59:59").getTime();
    const now = Date.now();
    const dayMs = 86400000;

    const pct = Math.max(0, Math.min(100, Math.round(((now - d0) / (d1 - d0)) * 100)));
    const daysLeft = Math.ceil((d1 - now) / dayMs);

    setPhaseProgress(pct);
    if (now < d0) {
      setPhaseShortLabel("segera dimulai");
      setPhaseFullLabel("Segera dimulai");
    } else if (now > d1) {
      setPhaseShortLabel("selesai");
      setPhaseFullLabel("Selesai");
    } else {
      setPhaseShortLabel(`${daysLeft} hari lagi`);
      setPhaseFullLabel(`Berlangsung • ${daysLeft} hari lagi`);
    }

    // 2. Fetch linimasa aktif jika API tersedia (non-blocking)
    async function fetchLinimasa() {
      try {
        const res = await api.get("/kkn/timeline");
        const list = res.data?.data || [];
        if (!Array.isArray(list) || list.length === 0) return;

        const current = list.find((item: any) => item.statusPelaksanaan === "SEDANG_BERJALAN");
        if (isMounted && current) {
          if (current.kegiatanUtama) setActiveStageTitle(current.kegiatanUtama);
          if (current.tanggal || current.tahapMinggu) {
            setActiveStageDate(current.tanggal || current.tahapMinggu);
          }
        }
      } catch (_err) {
        // Fallback default sudah terpasang
      }
    }

    fetchLinimasa();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section
      aria-label="Tentang KKN Tematik BERSEKA"
      className={`relative overflow-hidden bg-[#04999C] text-white flex flex-col justify-between p-6 sm:p-8 lg:py-10 lg:pl-10 lg:pr-[130px] xl:py-12 xl:pl-14 xl:pr-[170px] rounded-b-[28px] lg:rounded-none min-h-0 ${className}`}
    >
      {/* Dekorasi Matahari Kuning Aksen Pojok Kiri Atas */}
      <div
        className="absolute -left-[90px] -top-[100px] sm:-left-[130px] sm:-top-[150px] w-[180px] h-[180px] sm:w-[230px] sm:h-[230px] rounded-full bg-[#FFD166] pointer-events-none z-0"
        aria-hidden="true"
      />

      {/* Kurva Pembatas SVG Organik ke Panel Kanan (Hanya Tampil di Desktop lg+) */}
      <svg
        className="hidden lg:block absolute right-[-1px] top-0 w-[110px] xl:w-[150px] h-full pointer-events-none z-10"
        viewBox="0 0 160 900"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M160 0H112C60 130 20 250 34 420C48 590 150 680 128 900H160Z"
          fill="#F5F7F8"
        />
      </svg>

      {/* Navigasi Mobile: Kembali ke Beranda */}
      <Link
        to="/"
        className="lg:hidden absolute top-4 right-4 z-20 inline-flex items-center gap-1.5 text-xs font-semibold text-white/95 hover:text-white bg-black/20 hover:bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-md transition-colors"
      >
        <span>Beranda</span>
        <ArrowUpRight size={14} />
      </Link>

      {/* Header Identitas Brand BERSEKA */}
      <div className="relative z-10 select-none">
        <Link to="/" className="inline-flex flex-col text-white no-underline group">
          <span className="font-extrabold text-2xl sm:text-3xl xl:text-[34px] tracking-tight leading-none">
            BERSEKA.ID
          </span>
          <span className="text-xs sm:text-sm font-medium text-[#E3FAFA] mt-1">
            KKN Tematik • UNIKOM
          </span>
        </Link>

        {/* Copywriting & Slogan */}
        <div className="mt-4 sm:mt-6 max-w-[560px]">
          <h2 className="text-2xl sm:text-3xl xl:text-[40px] font-extrabold tracking-[-0.03em] leading-[1.08] text-white m-0">
            Bersama bergerak,<br />bersama berdampak.
          </h2>
          <p className="hidden sm:block mt-2 text-xs sm:text-sm xl:text-base text-[#F0FDFD] leading-relaxed max-w-[480px]">
            Kelola kegiatan KKN untuk lingkungan yang lebih bersih, sehat, dan berkelanjutan.
          </p>
        </div>
      </div>

      {/* Area Ilustrasi Vektor Melayang */}
      <div className="relative my-3 sm:my-5 flex-1 flex items-center justify-center min-h-[120px] max-h-[180px] sm:max-h-[240px] xl:max-h-[290px] select-none">
        {/* Halo Glow */}
        <div
          className="absolute w-40 sm:w-56 h-40 sm:h-56 rounded-full bg-white/10 blur-xl pointer-events-none"
          aria-hidden="true"
        />
        {/* Bayangan Tanah */}
        <div
          className="absolute bottom-1 w-[75%] max-w-[320px] h-3 sm:h-4 rounded-full bg-[#036E71]/55 blur-[2px] pointer-events-none"
          aria-hidden="true"
        />
        {/* Gambar WebP Hero Melayang */}
        <img
          src="/image/loginpage/berseka-login-hero.webp"
          alt="Tiga mahasiswa KKN berdiskusi di depan laptop di samping Tempat Sampah daur ulang"
          className="relative z-10 max-h-full w-auto object-contain drop-shadow-xl animate-float pointer-events-none"
          loading="eager"
        />
      </div>

      {/* Grid 2 Card Informasi & Linimasa Kegiatan (Tampil di sm & desktop agar mobile tidak terlalu panjang) */}
      <div className="relative z-10 hidden sm:grid grid-cols-2 gap-3 xl:gap-4 mt-2 max-w-[820px] select-none">
        {/* Card 1: Tahap Kegiatan */}
        <div className="flex items-start gap-3 p-3.5 sm:p-4 rounded-[18px] bg-[#03848A] border border-white/10 shadow-sm transition-transform hover:-translate-y-0.5">
          <div className="w-8 h-8 rounded-xl bg-white/15 text-white flex items-center justify-center shrink-0">
            <Calendar size={17} strokeWidth={2.2} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] xl:text-[11px] font-bold uppercase tracking-wider text-[#D2F3F3]">
              Tahap kegiatan
            </span>
            <h3 className="text-xs sm:text-sm font-bold text-white mt-0.5 leading-snug truncate">
              {activeStageTitle}
            </h3>
            <p className="text-[11px] text-[#E9FBFB] mt-0.5">{activeStageDate}</p>
            {/* Progress Bar */}
            <div className="w-full h-1.5 rounded-full bg-white/25 overflow-hidden mt-2">
              <div
                className="h-full rounded-full bg-[#FFD166] transition-all duration-1000"
                style={{ width: `${phaseProgress}%` }}
              />
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-semibold text-white">
              <span className="w-2 h-2 rounded-full bg-[#5BD08A] animate-pulse shrink-0" />
              <span>{phaseFullLabel}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Pengingat Penting */}
        <div className="flex items-start gap-3 p-3.5 sm:p-4 rounded-[18px] bg-[#03848A] border border-white/10 shadow-sm transition-transform hover:-translate-y-0.5">
          <div className="w-8 h-8 rounded-xl bg-white/15 text-white flex items-center justify-center shrink-0">
            <ClipboardList size={17} strokeWidth={2.2} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] xl:text-[11px] font-bold uppercase tracking-wider text-[#D2F3F3]">
              Pengingat penting
            </span>
            <h3 className="text-xs sm:text-sm font-bold text-white mt-0.5 leading-snug">
              Lengkapi catatan harian
            </h3>
            <p className="text-[11px] text-[#E9FBFB] mt-1 leading-relaxed">
              Unggah bukti kegiatan dan koordinasikan laporan dengan DPL.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LoginKknHero;
