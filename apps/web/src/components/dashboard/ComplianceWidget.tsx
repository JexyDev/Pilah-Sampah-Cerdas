/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Component: ComplianceWidget (Widget Indeks Kepatuhan Pemilahan)
 * Standarisasi Logika Evaluasi Kepatuhan & Kamus Definisi UI untuk Pimpinan Daerah & DLH
 * 
 * Fitur Utama:
 * 1. Logika Biner & Simetris: Kepatuhan = (Kategori Sampah == Kategori Tempat Sampah Berstiker QR)
 * 2. Popover & Tooltip Edukatif: Penjelasan bahasa manusia yang lugas tanpa jargon rumit
 * 3. Kamus Istilah Interaktif: Kamus definisi Kepatuhan, Ketidakpatuhan, dan Dampak Kontaminasi
 * 4. Sub-Analisis Tempat Sampah: Kesesuaian Tempat Sampah Organik (%) vs Kesesuaian Tempat Sampah Anorganik (%)
 * 5. Dual Perspektif: Tinjauan Frekuensi (Disiplin Warga) vs Tinjauan Bobot (Kemurnian Tonase)
 * 6. Keterbukaan Prinsip: Penghapusan time-lock (24/7 pelaporan) & pencatatan neraca massa utuh
 */

import React, { useState, useEffect } from "react";
import {
  Info,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Leaf,
  Recycle,
  HelpCircle,
  X,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Clock,
  Layers,
  Sparkles,
} from "lucide-react";
import {
  complianceService,
  type ComplianceMetricsResult,
} from "../../services/complianceService";

export interface ComplianceWidgetProps {
  metrics?: ComplianceMetricsResult | null;
  wilayah?: string;
  className?: string;
  onOpenDetail?: () => void;
}

export const ComplianceWidget: React.FC<ComplianceWidgetProps> = ({
  metrics: initialMetrics,
  wilayah,
  className = "",
  onOpenDetail,
}) => {
  const [metrics, setMetrics] = useState<ComplianceMetricsResult | null>(initialMetrics || null);
  const [loading, setLoading] = useState<boolean>(!initialMetrics);
  const [showDictionaryModal, setShowDictionaryModal] = useState<boolean>(false);
  const [showTooltip, setShowTooltip] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"frekuensi" | "bobot">("frekuensi");

  useEffect(() => {
    if (initialMetrics) {
      setMetrics(initialMetrics);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const kelurahanParam =
      wilayah && !wilayah.toLowerCase().includes("semua")
        ? wilayah.replace(/^Kel\.\s*/i, "").trim()
        : undefined;

    complianceService
      .fetchComplianceMetrics({ kelurahan: kelurahanParam })
      .then((data) => {
        if (isMounted) {
          setMetrics(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn("[ComplianceWidget] Gagal memuat dari API, menggunakan fallback baseline:", err);
        if (isMounted) {
          // Fallback baseline murni (anti-dummy)
          const fallback = complianceService.calculateComplianceMetrics([]);
          setMetrics(fallback);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [initialMetrics, wilayah]);

  const kepatuhanRate = metrics?.indeksKepatuhan ?? 0;
  const kepatuhanBobot = metrics?.kepatuhanBobotPersen ?? 0;
  const displayRate = activeTab === "frekuensi" ? kepatuhanRate : kepatuhanBobot;

  const orgKesesuaian = metrics?.wadahOrganik.kesesuaianPersen ?? 0;
  const anorgKesesuaian = metrics?.wadahAnorganik.kesesuaianPersen ?? 0;

  // Warna indikator sesuai standar QC (≥ 80% Hijau, 60-79% Kuning, < 60% Merah/Rose)
  const isGreen = displayRate >= 80;
  const isYellow = displayRate >= 60 && displayRate < 80;

  const statusBadgeColor = isGreen
    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300/80 dark:border-emerald-700/60"
    : isYellow
    ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300/80 dark:border-amber-700/60"
    : "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300/80 dark:border-rose-700/60";

  const statusPredikat = metrics?.predikat || (isGreen ? "Sangat Baik" : isYellow ? "Cukup" : "Perlu Peningkatan");

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between relative overflow-hidden transition-all ${className}`}
    >
      {/* Background Accent Subtle Glow */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Widget */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-emerald-600 dark:text-emerald-400 p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/40">
              <ShieldCheck size={18} />
            </span>
            <h4 className="font-extrabold text-[17px] text-slate-900 dark:text-slate-100 tracking-tight">
              Indeks Kepatuhan Pemilahan Warga
            </h4>
            <span className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-full">
              Akumulasi Sistem Warga
            </span>

            {/* Info Icon dengan Popover/Tooltip Edukatif */}
            <div className="relative inline-block">
              <button
                type="button"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={() => setShowDictionaryModal(true)}
                className="w-5 h-5 rounded-full bg-slate-100 hover:bg-emerald-100 dark:bg-slate-800 dark:hover:bg-emerald-900/60 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-300 inline-flex items-center justify-center transition-colors cursor-pointer"
                title="Klik untuk membuka Kamus Istilah Lengkap"
                aria-label="Kamus Definisi Kepatuhan"
              >
                <Info size={13} />
              </button>

              {/* Tooltip Hover Edukatif */}
              {showTooltip && (
                <div className="absolute left-6 top-0 z-30 w-72 p-3 bg-slate-900 dark:bg-slate-800 text-white text-[11px] rounded-2xl shadow-xl border border-slate-700 leading-relaxed pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                  <p className="font-semibold text-emerald-400 mb-1 flex items-center gap-1.5">
                    <Sparkles size={12} /> Definisi Akumulasi Sistem:
                  </p>
                  <p className="text-slate-200">
                    "Kepatuhan warga diukur dari perpaduan tingkat partisipasi aktif masyarakat dan ketepatan pemilahan sampah pada tempat sampah yang sesuai, bukan semata-mata klaim deteksi kamera AI."
                  </p>
                  <span className="block mt-2 text-[9.5px] text-slate-400 italic">
                    Klik ikon (i) untuk membaca kamus istilah &amp; matriks lengkap.
                  </span>
                </div>
              )}
            </div>
          </div>

          <p className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium mt-1">
            Evaluasi riil berbasis keaktifan partisipasi seluruh warga dan ketepatan pemilahan tempat sampah
          </p>
        </div>

        {/* Action & Toggle Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Toggle Mode: Frekuensi vs Bobot */}
          <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("frekuensi")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                activeTab === "frekuensi"
                  ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
              title="Kepatuhan berdasarkan frekuensi pembuangan tepat"
            >
              Frekuensi Scan
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("bobot")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === "bobot"
                  ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
              title="Kepatuhan berdasarkan proporsi massa sampah (kg)"
            >
              <Scale size={11} />
              Tonase (kg)
            </button>
          </div>

          {/* Tombol Kamus Istilah */}
          <button
            type="button"
            onClick={() => setShowDictionaryModal(true)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <BookOpen size={13} className="text-emerald-600 dark:text-emerald-400" />
            <span>Kamus Istilah</span>
          </button>
        </div>
      </div>

      {/* Main Score & Sub-Analysis Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch my-2">
        {/* Kolom Kiri (5 cols): Skor Utama Indeks Kepatuhan */}
        <div className="md:col-span-5 bg-gradient-to-br from-slate-50 to-slate-100/70 dark:from-slate-800/50 dark:to-slate-900/50 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {activeTab === "frekuensi" ? "Tingkat Kepatuhan (Akumulasi Warga)" : "Kemurnian Tonase (Massa)"}
              </span>
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${statusBadgeColor}`}>
                {statusPredikat}
              </span>
            </div>

            <div className="flex items-baseline gap-2 my-2">
              <span className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                {loading ? "..." : `${displayRate.toFixed(1)}%`}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {activeTab === "frekuensi"
                  ? (metrics?.partisipasiWarga && metrics.partisipasiWarga.totalWargaTerdaftar > 0
                      ? "Akumulasi partisipasi & ketepatan tempat sampah"
                      : "dari total setoran terverifikasi")
                  : "dari total massa sampah terdata"}
              </span>
            </div>
          </div>

          {/* Bar Progress Representasi Visual */}
          <div className="space-y-2 mt-3">
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden flex">
              <div
                className={`h-full transition-all duration-700 ${
                  isGreen ? "bg-emerald-500" : isYellow ? "bg-amber-500" : "bg-rose-500"
                }`}
                style={{ width: `${Math.min(100, Math.max(0, displayRate))}%` }}
                title={`Kepatuhan: ${displayRate}%`}
              />
              <div
                className="h-full bg-rose-400/40 dark:bg-rose-900/50 transition-all duration-700"
                style={{ width: `${Math.min(100, Math.max(0, 100 - displayRate))}%` }}
                title={`Ketidakpatuhan: ${(100 - displayRate).toFixed(1)}%`}
              />
            </div>

            {metrics?.partisipasiWarga && metrics.partisipasiWarga.totalWargaTerdaftar > 0 && activeTab === "frekuensi" ? (
              <div className="space-y-1.5 pt-2 border-t border-slate-200/80 dark:border-slate-700/80 text-[10.5px]">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/80 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Partisipasi Warga</span>
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                      {metrics.partisipasiWarga.partisipasiPersen}%
                    </span>
                    <span className="text-[9.5px] text-slate-400 block truncate" title={`${metrics.partisipasiWarga.wargaAktifMemilah} dari ${metrics.partisipasiWarga.totalWargaTerdaftar} warga aktif`}>
                      {metrics.partisipasiWarga.wargaAktifMemilah} dari {metrics.partisipasiWarga.totalWargaTerdaftar} warga aktif
                    </span>
                  </div>
                  <div className="bg-white/80 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Ketepatan Tempat Sampah</span>
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                      {metrics.akurasiPilahPersen ?? (metrics.wadahOrganik.kesesuaianPersen || 0)}%
                    </span>
                    <span className="text-[9.5px] text-slate-400 block truncate" title={`${metrics.totalPatuh} tepat, ${metrics.totalTidakPatuh} salah tempat sampah`}>
                      {metrics.totalPatuh} tepat, {metrics.totalTidakPatuh} salah
                    </span>
                  </div>
                </div>

                {/* Keterangan Formula Singkat & Profesional */}
                <div className="bg-slate-100/90 dark:bg-slate-800/90 rounded-xl px-2.5 py-1.5 border border-slate-200/70 dark:border-slate-700/60 text-[9.5px] text-slate-600 dark:text-slate-300 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    Formula Akumulasi (50 : 50):
                  </span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    ({metrics.partisipasiWarga.partisipasiPersen}% + {metrics.akurasiPilahPersen ?? (metrics.wadahOrganik.kesesuaianPersen || 0)}%) ÷ 2 = <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{displayRate.toFixed(1)}%</strong>
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center text-[10.5px] font-semibold text-slate-500 dark:text-slate-400 pt-0.5">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  Patuh: {metrics ? (activeTab === "frekuensi" ? `${metrics.totalPatuh} setoran` : `${metrics.totalBeratPatuhKg} kg`) : "0"}
                </span>
                <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                  <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                  Salah Tempat Sampah: {metrics ? (activeTab === "frekuensi" ? `${metrics.totalTidakPatuh} setoran` : `${metrics.totalBeratKontaminasiKg} kg`) : "0"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Kolom Kanan (7 cols): Sub-Analisis Kesesuaian Tempat Sampah Organik vs Anorganik */}
        <div className="md:col-span-7 flex flex-col justify-between gap-3">
          {/* Sub-Analisis 1: Tempat Sampah Organik */}
          <div className="bg-emerald-50/40 dark:bg-emerald-950/20 rounded-2xl p-4 border border-emerald-200/70 dark:border-emerald-800/40 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                  <Leaf size={14} />
                </span>
                <div>
                  <h5 className="font-extrabold text-xs text-emerald-950 dark:text-emerald-200">
                    Kesesuaian Tempat Sampah Organik
                  </h5>
                  <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400">
                    Sampah organik yang benar-benar masuk tempat sampah bertanda Organik
                  </p>
                </div>
              </div>
              <span className="text-base font-black text-emerald-700 dark:text-emerald-300">
                {orgKesesuaian.toFixed(1)}%
              </span>
            </div>

            <div className="w-full bg-emerald-200/60 dark:bg-emerald-900/60 rounded-full h-2 overflow-hidden flex my-1">
              <div
                className="h-full bg-emerald-600 transition-all duration-700"
                style={{ width: `${Math.min(100, Math.max(0, orgKesesuaian))}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-[10px] text-emerald-800 dark:text-emerald-300 font-medium">
              <span>
                {metrics ? `${metrics.wadahOrganik.aktivitasSesuai} dari ${metrics.wadahOrganik.totalAktivitas} setoran tepat` : "0 setoran"}
              </span>
              <span>
                Kontaminasi Anorganik: {metrics ? `${metrics.wadahOrganik.kontaminasiPersen.toFixed(1)}%` : "0%"}
              </span>
            </div>
          </div>

          {/* Sub-Analisis 2: Tempat Sampah Anorganik */}
          <div className="bg-amber-50/40 dark:bg-amber-950/20 rounded-2xl p-4 border border-amber-200/70 dark:border-amber-800/40 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                  <Recycle size={14} />
                </span>
                <div>
                  <h5 className="font-extrabold text-xs text-amber-950 dark:text-amber-200">
                    Kesesuaian Tempat Sampah Anorganik
                  </h5>
                  <p className="text-[10px] text-amber-700/80 dark:text-amber-400">
                    Sampah anorganik yang benar-benar masuk tempat sampah bertanda Anorganik
                  </p>
                </div>
              </div>
              <span className="text-base font-black text-amber-700 dark:text-amber-300">
                {anorgKesesuaian.toFixed(1)}%
              </span>
            </div>

            <div className="w-full bg-amber-200/60 dark:bg-amber-900/60 rounded-full h-2 overflow-hidden flex my-1">
              <div
                className="h-full bg-amber-500 transition-all duration-700"
                style={{ width: `${Math.min(100, Math.max(0, anorgKesesuaian))}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-[10px] text-amber-800 dark:text-amber-300 font-medium">
              <span>
                {metrics ? `${metrics.wadahAnorganik.aktivitasSesuai} dari ${metrics.wadahAnorganik.totalAktivitas} setoran tepat` : "0 setoran"}
              </span>
              <span>
                Kontaminasi Organik: {metrics ? `${metrics.wadahAnorganik.kontaminasiPersen.toFixed(1)}%` : "0%"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Penjelasan Sederhana Akumulasi Sistem (Bahasa Manusia & Transparan) */}
      <div className="mt-2.5 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-start gap-3 text-xs">
        <div className="p-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 shrink-0 mt-0.5">
          <Sparkles size={16} />
        </div>
        <div className="space-y-0.5 flex-1">
          <div className="font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-xs">
            <span>Penjelasan Sederhana Akumulasi Kepatuhan:</span>
            <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-300/50 dark:border-emerald-700/50 font-bold">
              Real Data Warga
            </span>
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
            {metrics?.penjelasanSistem ||
              "Skor kepatuhan akumulasi wilayah dihitung dari rata-rata seimbang (50% : 50%) antara keaktifan partisipasi warga yang rutin menyetor dan ketepatan pemilahan pada tempat sampah yang sesuai, merefleksikan kedisiplinan riil masyarakat tanpa bias kamera AI."}
          </p>
        </div>
      </div>

      {/* Ringkasan Naratif untuk Pimpinan Eksekutif */}
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
          <span className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0">
            <CheckCircle2 size={15} />
          </span>
          <p className="leading-snug">
            <strong className="font-bold text-slate-800 dark:text-slate-100">Catatan Pimpinan: </strong>
            {metrics?.ringkasanEksekutif || "Pemilahan warga berjalan aktif dan tercatat secara transparan."}
          </p>
        </div>

        {onOpenDetail && (
          <button
            type="button"
            onClick={onOpenDetail}
            className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-bold inline-flex items-center gap-1 hover:underline cursor-pointer shrink-0 ml-auto sm:ml-0"
          >
            <span>Rincian per RW</span>
            <ArrowRight size={13} />
          </button>
        )}
      </div>

      {/* MODAL KAMUS ISTILAH & DEFINISI RESMI */}
      {showDictionaryModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh] text-slate-800 dark:text-slate-100">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                    Kamus Istilah &amp; Logika Kepatuhan
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Standar Operasional Penilaian Pemilahan Sampah BERSEKA untuk Pimpinan DLH
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowDictionaryModal(false)}
                className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto text-xs leading-relaxed">
              {/* Definisi Pokok Side-by-Side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/40 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-extrabold text-sm">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span>Kepatuhan (Compliance)</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">
                    Rasio ketepatan pembuangan sampah pada tempat sampah yang sesuai dibagi total aktivitas pemilahan terdata. Mengukur persentase sampah yang dibuang ke tempat sampah berkategori identik.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-800/40 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-rose-800 dark:text-rose-300 font-extrabold text-sm">
                    <AlertTriangle size={16} className="text-rose-600" />
                    <span>Ketidakpatuhan (Kontaminasi)</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">
                    Kejadian penempatan jenis sampah yang tidak cocok dengan kategori tempat sampah (salah tempat sampah). Menyebabkan kontaminasi silang pada alur pengolahan.
                  </p>
                </div>
              </div>

              {/* Matriks Biner Sistem */}
              <div className="space-y-2">
                <h5 className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Layers size={14} className="text-emerald-600" />
                  Matriks Logika Biner &amp; Status Sistem
                </h5>
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-2 px-3">Sampah Terdeteksi</th>
                        <th className="py-2 px-3">Tempat Sampah (Stiker QR)</th>
                        <th className="py-2 px-3">Status Sistem</th>
                        <th className="py-2 px-3">Keterangan Teknis</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      <tr className="bg-emerald-50/30 dark:bg-emerald-950/20">
                        <td className="py-2 px-3 font-bold text-emerald-800 dark:text-emerald-300">Organik</td>
                        <td className="py-2 px-3 font-bold text-emerald-800 dark:text-emerald-300">Tempat Sampah Organik</td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                            Patuh &amp; Sesuai
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-300">Pemilahan berhasil, tidak ada kontaminasi.</td>
                      </tr>
                      <tr className="bg-emerald-50/30 dark:bg-emerald-950/20">
                        <td className="py-2 px-3 font-bold text-emerald-800 dark:text-emerald-300">Anorganik</td>
                        <td className="py-2 px-3 font-bold text-emerald-800 dark:text-emerald-300">Tempat Sampah Anorganik</td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                            Patuh &amp; Sesuai
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-300">Pemilahan berhasil, tidak ada kontaminasi.</td>
                      </tr>
                      <tr className="bg-rose-50/30 dark:bg-rose-950/20">
                        <td className="py-2 px-3 font-bold text-slate-800 dark:text-slate-200">Organik</td>
                        <td className="py-2 px-3 font-bold text-slate-800 dark:text-slate-200">Tempat Sampah Anorganik</td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300 text-[10px] font-bold">
                            Tidak Sesuai
                          </span>
                        </td>
                        <td className="py-2 px-3 text-rose-700 dark:text-rose-300">Kontaminasi basah, menurunkan nilai daur ulang.</td>
                      </tr>
                      <tr className="bg-rose-50/30 dark:bg-rose-950/20">
                        <td className="py-2 px-3 font-bold text-slate-800 dark:text-slate-200">Anorganik</td>
                        <td className="py-2 px-3 font-bold text-slate-800 dark:text-slate-200">Tempat Sampah Organik</td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300 text-[10px] font-bold">
                            Tidak Sesuai
                          </span>
                        </td>
                        <td className="py-2 px-3 text-rose-700 dark:text-rose-300">Kontaminasi plastik, merusak bahan baku kompos.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Dua Prinsip Kebijakan Sistem */}
              <div className="space-y-2">
                <h5 className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  Prinsip Tata Kelola Data &amp; Operasional Lapangan
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <strong className="text-slate-900 dark:text-slate-100 flex items-center gap-1.5 mb-1">
                      <Clock size={13} className="text-sky-600" />
                      Pelaporan 24/7 (Tanpa Batas Jam)
                    </strong>
                    <p className="text-slate-600 dark:text-slate-400">
                      Warga berhak memilah dan melapor kapan saja tanpa sistem penolakan waktu (no system rejection), memastikan partisipasi warga terekam tanpa hambatan jam operasional.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <strong className="text-slate-900 dark:text-slate-100 flex items-center gap-1.5 mb-1">
                      <Scale size={13} className="text-amber-600" />
                      Pencatatan Fisik Neraca Massa
                    </strong>
                    <p className="text-slate-600 dark:text-slate-400">
                      Jika terdeteksi "Tidak Patuh", berat sampah tetap dihitung ke dalam total timbulan tonase fisik, namun dipisahkan sebagai indeks kontaminasi tempat sampah (tidak dibatalkan sebagai anomali).
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowDictionaryModal(false)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Tutup Kamus Istilah
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceWidget;
