/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Component: BaselineSection (Baseline Data Hasil Survei Pemilahan Sampah)
 * Standarisasi & Tata Kelola Data:
 * 1. Periode Survei Statis: Juli 2026 (6 Kelurahan Kecamatan Coblong).
 * 2. Isolasi Visual & State: Terpisah dari filter tanggal/periode global dan terhubung
 *    ke endpoint mandiri (GET /api/v1/waste/baseline).
 * 3. Indeks Kepatuhan Baseline:
 *    - Rata-rata kepatuhan baseline: 40% (hasil evaluasi rapat KKN)
 *    - Tingkat kepatuhan baseline acuan grafik: 17,8% (Kelurahan Sekeloa)
 *    - Akumulasi RW kepatuhan tinggi (>85%): 24 RW
 * 4. Dual Bar Chart Diskrit:
 *    - Chart 1: Baseline - Tingkat Kepatuhan (%) [0 - 100%] (Emerald Solid)
 *    - Chart 2: Baseline - Berat Sampah (kg/hari) [Skala kg mandiri] (Indigo/Biru Kontras)
 * 5. Metadata & Footnote Anti-Miskomunikasi untuk DLH & Pimpinan Daerah.
 * 6. Modal Verifikasi Dokumen Sumber & Berita Acara Survei Lapangan.
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart3,
  CheckCircle2,
  FileSpreadsheet,
  Info,
  Printer,
  RefreshCw,
  ShieldCheck,
  X,
  HelpCircle,
} from "lucide-react";
import api from "../../services/api";
import { exportToXlsx } from "../../utils/exportXlsx";
import toast from "react-hot-toast";

export interface BaselineKelurahanItem {
  id: string;
  kelurahan: string;
  kepatuhanBaseline: number | null;
  volumeBaselineKg: number | null;
  volumeOrganik?: number | null;
  volumeAnorganik?: number | null;
  volumeResidu?: number | null;
  jumlahRw?: number;
  rwKepatuhanTinggi?: number;
  catatan?: string | null;
  isEstimasi?: boolean;
}

export interface BaselineDataResponse {
  periode: string;
  wilayah: string;
  cakupanSampel: string;
  keterangan: string;
  catatanKaki: string;
  summary: {
    avgKepatuhanBaseline: number;
    avgKepatuhanGrafik: number;
    rwKepatuhanTinggi: number;
    totalKelurahan: number;
  };
  kelurahan: BaselineKelurahanItem[];
}

// Fallback data statis terverifikasi survei lapangan KKN Juli 2026 (Anti-Dummy & Zero Data Loss)
export const DEFAULT_BASELINE_DATA: BaselineDataResponse = {
  periode: "Juli 2026",
  wilayah: "Kecamatan Coblong",
  cakupanSampel: "6 Kelurahan (Coblong)",
  keterangan:
    "Data baseline dihimpun melalui survei sampel lapangan giat KKN pada Juli 2026 sebagai titik tolak evaluasi intervensi sistem pada tingkat RW dan Kelurahan.",
  catatanKaki:
    "Data baseline diambil selama kegiatan survei lapangan KKN (Juli 2026) berbasis sampel 6 kelurahan Kecamatan Coblong sebagai acuan awal evaluasi tingkat RW.",
  summary: {
    avgKepatuhanBaseline: 40.0,
    avgKepatuhanGrafik: 17.8,
    rwKepatuhanTinggi: 24,
    totalKelurahan: 6,
  },
  kelurahan: [
    {
      id: "kel-cipaganti",
      kelurahan: "Cipaganti",
      kepatuhanBaseline: 13.67,
      volumeBaselineKg: 1850.0,
      volumeOrganik: 200.0,
      volumeAnorganik: 80.0,
      volumeResidu: 40.0,
      jumlahRw: 7,
      rwKepatuhanTinggi: 2,
      isEstimasi: false,
      catatan: "Organik 200 kg/hari (unit maggot RT 07), Anorganik 80 kg/hari (Bank Sampah RW 02 & Kelurahan). Total timbulan percontohan 1.850 kg/hari.",
    },
    {
      id: "kel-dago",
      kelurahan: "Dago",
      kepatuhanBaseline: 10.0,
      volumeBaselineKg: 10983.0,
      volumeOrganik: 500.0,
      volumeAnorganik: 3294.9,
      volumeResidu: 7188.1,
      jumlahRw: 13,
      rwKepatuhanTinggi: 4,
      catatan: "Total potensi timbulan survei KKN 10.983 kg/hari (organik terpilah 500 kg/hari terdata di posko percontohan).",
    },
    {
      id: "kel-lebakgede",
      kelurahan: "Lebak Gede",
      kepatuhanBaseline: 21.6,
      volumeBaselineKg: 3003.5,
      volumeOrganik: 200.0,
      volumeAnorganik: 50.0,
      volumeResidu: 2753.5,
      jumlahRw: 13,
      rwKepatuhanTinggi: 3,
      catatan: "Total timbulan survei 3.003,5 kg/hari (organik 200 kg/hari, anorganik 50 kg/hari terpilah percontohan).",
    },
    {
      id: "kel-lebaksiliwangi",
      kelurahan: "Lebak Siliwangi",
      kepatuhanBaseline: 15.0,
      volumeBaselineKg: 2628.0,
      volumeOrganik: 1576.8,
      volumeAnorganik: 788.4,
      volumeResidu: 262.8,
      jumlahRw: 6,
      rwKepatuhanTinggi: 2,
      catatan: "Estimasi timbulan proporsional kependudukan BPS Coblong (4.172 jiwa x 0,63 kg/hari = 2.628 kg/hari).",
    },
    {
      id: "kel-sadangserang",
      kelurahan: "Sadang Serang",
      kepatuhanBaseline: 24.8,
      volumeBaselineKg: 9123.0,
      volumeOrganik: 4105.4,
      volumeAnorganik: 3193.1,
      volumeResidu: 1824.6,
      jumlahRw: 21,
      rwKepatuhanTinggi: 8,
      catatan: "Organik 4.105,4 kg, Anorganik 3.193,1 kg, Residu 1.824,6 kg. Total timbulan harian 9.123,04 kg.",
    },
    {
      id: "kel-sekeloa",
      kelurahan: "Sekeloa",
      kepatuhanBaseline: 17.8,
      volumeBaselineKg: 10803.8,
      volumeOrganik: 6482.27,
      volumeAnorganik: 3241.13,
      volumeResidu: 1080.38,
      jumlahRw: 16,
      rwKepatuhanTinggi: 5,
      catatan: "Organik 6.482,27 kg (60%), Anorganik 3.241,13 kg (30%), Residu 1.080,38 kg (10%). Total 10.803,78 kg/hari.",
    },
  ],
};

// Data Enumerator & Berita Acara untuk Verifikasi DLH
const ENUMERATOR_SURVEI = [
  { kelurahan: "Sadang Serang", tanggal: "1 Juli 2026", enumerator: "Ayu Kusumawati", kontak: "Koor Giat KKN RW", catatan: "Survei awal wilayah pemukiman padat" },
  { kelurahan: "Sekeloa", tanggal: "13 Juli 2026", enumerator: "Nugi", kontak: "Koor Giat KKN RW", catatan: "Survei berbasis posko GSG & aula kelurahan" },
  { kelurahan: "Dago", tanggal: "14 Juli 2026", enumerator: "Taufik", kontak: "Koor Giat KKN RW", catatan: "Survei pemilahan 13 RW kawasan komersil & hunian" },
  { kelurahan: "Lebak Gede", tanggal: "15 Juli 2026", enumerator: "Hardiansyah", kontak: "Koor Giat KKN RW", catatan: "Survei terpadu pemukiman mahasiswa & kos" },
  { kelurahan: "Lebak Siliwangi", tanggal: "15 Juli 2026", enumerator: "Setiadi", kontak: "Koor Giat KKN RW", catatan: "Survei area sekitar fasilitas publik & kampus" },
  { kelurahan: "Cipaganti", tanggal: "16 Juli 2026", enumerator: "Ilyas Faturahman", kontak: "Koor Giat KKN RW", catatan: "Survei percontohan pemilahan 7 RW & bank sampah unit" },
];

export interface BaselineSectionProps {
  className?: string;
}

export const BaselineSection: React.FC<BaselineSectionProps> = ({ className = "" }) => {
  const [data, setData] = useState<BaselineDataResponse>(DEFAULT_BASELINE_DATA);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hoveredRateIndex, setHoveredRateIndex] = useState<number | null>(null);
  const [hoveredVolumeIndex, setHoveredVolumeIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"dual" | "kepatuhan" | "volume">("dual");
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  // Helper posisi horizontal tooltip agar tidak pernah terpotong tepi layar/kartu
  const getTooltipAlignment = (idx: number) => {
    if (idx === 0) return "left-0 sm:-left-1";
    if (idx === 1) return "left-0 sm:left-1";
    if (idx === 4) return "right-0 sm:right-1";
    if (idx === 5) return "right-0 sm:-right-1";
    return "left-1/2 -translate-x-1/2";
  };

  // Helper posisi panah bawah (caret indicator) mengarah tepat ke kepala batang
  const getArrowAlignment = (idx: number) => {
    if (idx === 0) return "left-6";
    if (idx === 1) return "left-8";
    if (idx === 4) return "right-8";
    if (idx === 5) return "right-6";
    return "left-1/2 -translate-x-1/2";
  };

  // Kunci pemanggilan data: Mandiri, read-only, dan terisolasi dari filter waktu dinamis global
  const fetchBaseline = async (silent = false) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);

      const res = await api.get("/waste/baseline");
      if (res.data?.success && res.data?.data) {
        setData(res.data.data);
      }
    } catch {
      // Fallback ke data baku jika API belum aktif atau terjadi gangguan jaringan
      setData(DEFAULT_BASELINE_DATA);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBaseline();
  }, []);

  // Hitung batas skala berat sampah (kg) secara dinamis dari data
  const maxVolumeKg = useMemo(() => {
    const list = data?.kelurahan || [];
    const maxVal = Math.max(...list.map((k) => Number(k.volumeBaselineKg || 0)), 1000);
    return Math.ceil(maxVal / 2000) * 2000; // Pembulatan ke kelipatan 2000 kg terdekat
  }, [data]);

  const kelurahanList = data?.kelurahan || DEFAULT_BASELINE_DATA.kelurahan;
  const summary = data?.summary || DEFAULT_BASELINE_DATA.summary;
  const avgKepatuhan = summary?.avgKepatuhanBaseline ?? 40.0;

  // Handler Export Dokumen Sumber / Raw Data ke Format XLSX
  const handleExportRawData = () => {
    try {
      const headers = [
        "No",
        "Kelurahan",
        "Kecamatan",
        "Periode Survei",
        "Baseline - Tingkat Kepatuhan (%)",
        "Baseline - Berat Sampah (kg/hari)",
        "Berat Organik (kg/hari)",
        "Berat Anorganik (kg/hari)",
        "Berat Residu (kg/hari)",
        "Jumlah RW Terdaftar",
        "RW Kepatuhan Tinggi (>85%)",
        "Status Validasi Data",
        "Petugas Enumerator KKN",
        "Tanggal Survei",
        "Catatan Lapangan & Audit DLH",
      ];

      const rows = kelurahanList.map((item, idx) => {
        const enumInfo = ENUMERATOR_SURVEI.find(
          (e) => e.kelurahan.toLowerCase() === item.kelurahan.toLowerCase()
        );
        return [
          idx + 1,
          `Kel. ${item.kelurahan}`,
          data?.wilayah || "Kecamatan Coblong",
          data?.periode || "Juli 2026",
          item.kepatuhanBaseline != null ? item.kepatuhanBaseline : "Belum terdata",
          item.volumeBaselineKg != null && item.volumeBaselineKg > 0 ? item.volumeBaselineKg : 0,
          item.volumeOrganik != null ? item.volumeOrganik : 0,
          item.volumeAnorganik != null ? item.volumeAnorganik : 0,
          item.volumeResidu != null ? item.volumeResidu : 0,
          item.jumlahRw ?? 0,
          item.rwKepatuhanTinggi ?? 0,
          item.isEstimasi ? "Estimasi Awal Lapangan" : "Tervalidasi Berita Acara",
          enumInfo?.enumerator || "Tim Lapangan Gabungan KKN",
          enumInfo?.tanggal || "Juli 2026",
          item.catatan || "Sampel survei tervalidasi lapangan KKN Juli 2026.",
        ];
      });

      exportToXlsx(
        headers,
        rows,
        `BERSEKA_Baseline_Survei_Juli_2026_Coblong_${new Date().toISOString().slice(0, 10)}`,
        "Baseline Survei 2026"
      );
      toast.success("Dokumen sumber baseline survei (.xlsx) berhasil diunduh.");
    } catch {
      toast.error("Gagal mengunduh dokumen baseline excel.");
    }
  };

  // Handler Cetak Berita Acara / Ringkasan Verifikasi
  const handlePrintBeritaAcara = () => {
    window.print();
  };

  return (
    <div
      className={`bg-white dark:bg-slate-900 shadow-xs rounded-2xl p-6 border border-slate-200 dark:border-slate-800 relative z-10 space-y-6 ${className}`}
      id="baseline-survey-section"
    >
      {/* ── 1. Header Komponen & Label Statis ─────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700/40 shadow-2xs">
              <BarChart3 size={20} />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-[18px] text-slate-900 dark:text-slate-100 tracking-tight">
                  Baseline Data &amp; Hasil Survei Pemilahan Sampah
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Titik tolak evaluasi intervensi sistem pemilahan sampah cerdas berbasis survei sampel lapangan giat KKN pada 6 kelurahan Kecamatan Coblong.
              </p>
            </div>
          </div>
        </div>

        {/* Pojok Kanan Atas: Badge/Tag Statis & Tombol Dokumen Sumber */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-2.5 shrink-0">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>Periode Survei: <strong>Juli 2026</strong></span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span>Sampel: <strong>6 Kelurahan (Coblong)</strong></span>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              type="button"
              onClick={handleExportRawData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors shadow-2xs cursor-pointer"
              title="Unduh Berkas Data Mentah Excel Survei Baseline KKN Juli 2026"
            >
              <FileSpreadsheet size={13} />
              <span>Unduh Raw Data (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={() => setShowVerifyModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-bold hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors shadow-2xs cursor-pointer"
              title="Lihat Berita Acara & Lembar Verifikasi Data DLH"
            >
              <ShieldCheck size={13} />
              <span>Verifikasi Dokumen Sumber</span>
            </button>

            <button
              type="button"
              onClick={() => fetchBaseline(true)}
              disabled={refreshing || loading}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
              title="Perbarui Sinkronisasi Baseline"
            >
              <RefreshCw size={13} className={refreshing ? "animate-spin text-emerald-600" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. Kartu Mini Ringkasan KPI Eksekutif (3 Metrik Kunci) ───────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* KPI 1: Rata-rata Kepatuhan Baseline (40%) */}
        <div className="bg-emerald-50/70 dark:bg-emerald-950/40 p-3.5 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              <span>Indeks Baseline</span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-200/60 dark:bg-emerald-900 text-[9px]">KKN 2026</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-black text-emerald-900 dark:text-emerald-100">
                {summary.avgKepatuhanBaseline.toFixed(1).replace(".", ",")}%
              </span>
            </div>
          </div>
          <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-1 font-medium">
            Rata-rata kepatuhan baseline target
          </p>
        </div>

        {/* KPI 2: Acuan Grafik Kelurahan (17,8%) */}
        <div className="bg-slate-50 dark:bg-slate-800/70 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <span>Sampel Grafik</span>
              <span className="px-1.5 py-0.2 rounded bg-slate-200/60 dark:bg-slate-700 text-[9px]">Sekeloa</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-800 dark:text-slate-100">
                {summary.avgKepatuhanGrafik.toFixed(1).replace(".", ",")}%
              </span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Tingkat kepatuhan grafik kelurahan
          </p>
        </div>

        {/* KPI 3: RW Kepatuhan Tinggi (>85%) = 24 RW */}
        <div className="bg-amber-50/70 dark:bg-amber-950/40 p-3.5 rounded-2xl border border-amber-200/80 dark:border-amber-800/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[10px] font-extrabold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              <span>Kepatuhan &gt;85%</span>
              <span className="px-1.5 py-0.2 rounded bg-amber-200/60 dark:bg-amber-900 text-[9px]">&gt;85% RW</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-black text-amber-900 dark:text-amber-100">
                {summary.rwKepatuhanTinggi}
              </span>
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300">RW</span>
            </div>
          </div>
          <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 font-medium">
            Dari seluruh akumulasi RW target
          </p>
        </div>
      </div>

      {/* ── 3. Pengendali Tampilan Visualisasi (Tab Switcher) & Legenda Kontras ─ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        {/* Tab View Selector */}
        <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("dual")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === "dual"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-extrabold"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Dual Chart Berdampingan
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("kepatuhan")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === "kepatuhan"
                ? "bg-emerald-600 text-white shadow-2xs font-extrabold"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Baseline - Tingkat Kepatuhan (%)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("volume")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === "volume"
                ? "bg-indigo-600 text-white shadow-2xs font-extrabold"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Baseline - Berat Sampah (kg/hari)
          </button>
        </div>

        {/* Legenda Warna Kontras */}
        <div className="flex items-center gap-4 text-xs font-bold flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-emerald-600 dark:bg-emerald-500 shadow-2xs inline-block" />
            <span className="text-slate-700 dark:text-slate-300">
              Bar 1: Baseline - Tingkat Kepatuhan (%)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-indigo-600 dark:bg-indigo-500 shadow-2xs inline-block" />
            <span className="text-slate-700 dark:text-slate-300">
              Bar 2: Baseline - Berat Sampah (kg/hari)
            </span>
          </div>
        </div>
      </div>

      {/* ── 4. Area Visualisasi Diagram Batang Diskrit (Dual Chart) ──────────── */}
      <div className="space-y-4">
        {/* Kasus A: Dual Chart Berdampingan (Side-by-Side) */}
        {activeTab === "dual" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* ── Chart 1: Kepatuhan Pemilahan Baseline (%) ─────────────────── */}
            <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between relative overflow-visible z-20">
              <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                    Baseline - Tingkat Kepatuhan (%)
                  </h4>
                </div>
                <span className="text-[11px] font-extrabold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800">
                  Skala 0 – 100%
                </span>
              </div>

              {/* Kanvas Chart Kepatuhan */}
              <div className="w-full relative overflow-visible pt-2">
                <div className="min-w-[340px]">
                  <div className="flex gap-2 items-end">
                    {/* Sumbu Y (0% - 100%) */}
                    <div className="w-9 shrink-0 flex flex-col justify-between text-[10px] text-slate-400 font-extrabold pr-1 border-r border-slate-200 dark:border-slate-700 h-64 text-right pb-1 select-none">
                      <span>100%</span>
                      <span>75%</span>
                      <span>50%</span>
                      <span>25%</span>
                      <span>0%</span>
                    </div>

                    {/* Grid Bar 6 Kelurahan */}
                    <div className="flex-1 grid grid-cols-6 gap-2 sm:gap-3 items-end h-64 border-b border-slate-200 dark:border-slate-700 pb-1 relative">
                      {/* Gridlines Horizontal Dashed */}
                      <div className="absolute inset-x-0 top-0 border-t border-dashed border-slate-200/80 dark:border-slate-800 pointer-events-none" />
                      <div className="absolute inset-x-0 top-[25%] border-t border-dashed border-slate-200/80 dark:border-slate-800 pointer-events-none" />
                      <div className="absolute inset-x-0 top-[50%] border-t border-dashed border-slate-200/80 dark:border-slate-800 pointer-events-none" />
                      <div className="absolute inset-x-0 top-[75%] border-t border-dashed border-slate-200/80 dark:border-slate-800 pointer-events-none" />

                      {kelurahanList.map((item, idx) => {
                        const rate = item.kepatuhanBaseline != null ? item.kepatuhanBaseline : 0;
                        const heightPct = Math.min(100, Math.max(0, rate));
                        const isHovered = hoveredRateIndex === idx;
                        const isSyncHovered = hoveredVolumeIndex === idx;

                        return (
                          <div
                            key={`rate-${item.id}`}
                            className={`flex flex-col items-center justify-end h-full group relative cursor-pointer ${
                              isHovered ? "z-40" : isSyncHovered ? "z-20" : "z-10"
                            }`}
                            onMouseEnter={() => setHoveredRateIndex(idx)}
                            onMouseLeave={() => setHoveredRateIndex(null)}
                            onClick={() => setHoveredRateIndex(hoveredRateIndex === idx ? null : idx)}
                          >
                            {/* Background Track Highlight saat Kolom Aktif */}
                            {isHovered && (
                              <div className="absolute inset-y-0 inset-x-0.5 sm:inset-x-1 bg-emerald-500/[0.08] dark:bg-emerald-400/[0.12] rounded-xl pointer-events-none -z-1 border border-emerald-500/20" />
                            )}

                            {/* Popover Tooltip Detail - Ditampilkan di Posisi Aman Atas Tanpa Terpotong */}
                            {isHovered && (
                              <div
                                className={`absolute z-50 top-2 ${getTooltipAlignment(
                                  idx
                                )} bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md text-white rounded-2xl p-3 shadow-2xl shadow-emerald-950/40 border border-emerald-500/50 text-[11px] w-52 sm:w-56 pointer-events-none transition-all animate-in fade-in zoom-in-95 duration-150`}
                              >
                                {/* Header Pop Up */}
                                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
                                  <div className="flex items-center gap-1.5 font-extrabold text-emerald-400 text-xs truncate">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
                                    <span className="truncate">Kel. {item.kelurahan}</span>
                                  </div>
                                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 shrink-0">
                                    Juli 2026
                                  </span>
                                </div>

                                {/* Body Key-Values */}
                                <div className="space-y-1.5 text-slate-300">
                                  <div className="flex items-center justify-between bg-slate-800/70 rounded-xl px-2.5 py-1.5 border border-slate-700/60 shadow-2xs">
                                    <span className="text-slate-400 font-medium text-[10.5px]">Kepatuhan:</span>
                                    <span className="font-black text-emerald-400 text-xs sm:text-[13px] tracking-tight">
                                      {rate > 0 ? `${rate.toFixed(1)}%` : "—"}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between px-1 text-[10.5px]">
                                    <span className="text-slate-400">Total Wilayah:</span>
                                    <span className="font-semibold text-slate-200">
                                      {item.jumlahRw} RW
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between px-1 text-[10.5px]">
                                    <span className="text-slate-400">RW Patuh (&gt;85%):</span>
                                    <span className="font-extrabold text-amber-300">
                                      {item.rwKepatuhanTinggi || 0} RW
                                    </span>
                                  </div>

                                  {rate > 0 && (
                                    <div className="flex items-center justify-between px-1 text-[10px] text-slate-400 border-t border-slate-800/80 pt-1">
                                      <span>Vs Rata-rata Coblong:</span>
                                      <span
                                        className={`font-semibold ${
                                          rate >= avgKepatuhan ? "text-emerald-400" : "text-amber-400"
                                        }`}
                                      >
                                        {rate >= avgKepatuhan ? "+" : ""}
                                        {(rate - avgKepatuhan).toFixed(1)}%
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Catatan / Estimasi */}
                                {item.isEstimasi && (
                                  <div className="mt-2 pt-1 border-t border-slate-800 flex items-center gap-1 text-[9.5px] text-amber-300 italic">
                                    <Info size={10} className="shrink-0 text-amber-400" />
                                    <span className="truncate">Estimasi survei awal kondisi eksisting</span>
                                  </div>
                                )}

                                {/* Downward Pointer Caret Arrow */}
                                <div
                                  className={`absolute -bottom-1.5 ${getArrowAlignment(
                                    idx
                                  )} w-3 h-3 bg-slate-900 border-r border-b border-emerald-500/50 rotate-45 pointer-events-none`}
                                />
                              </div>
                            )}

                            {/* Label Angka Persentase di Atas Batang */}
                            <span
                              className={`text-xs sm:text-[13px] font-black mb-1.5 tracking-tight transition-transform ${
                                isHovered
                                  ? "text-emerald-500 scale-110 font-black"
                                  : "text-emerald-700 dark:text-emerald-400 group-hover:scale-105"
                              }`}
                            >
                              {rate > 0 ? `${rate.toFixed(1)}%` : "—"}
                            </span>

                            {/* Batang Grafik */}
                            <div
                              className={`w-full max-w-[42px] bg-emerald-100/50 dark:bg-emerald-950/30 rounded-t-xl overflow-hidden h-full flex items-end border-x border-t transition-all ${
                                isHovered
                                  ? "border-emerald-400 ring-2 ring-emerald-400/60 shadow-md shadow-emerald-500/20"
                                  : isSyncHovered
                                  ? "border-emerald-400/80 ring-1 ring-emerald-400/50"
                                  : "border-emerald-300/40 dark:border-emerald-800/50"
                              }`}
                            >
                              <div
                                className={`w-full bg-gradient-to-t from-emerald-700 via-emerald-600 to-emerald-500 rounded-t-xl transition-all duration-300 ${
                                  isHovered ? "brightness-115" : "group-hover:brightness-110"
                                }`}
                                style={{ height: `${heightPct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sumbu X: Nama Kelurahan */}
                  <div className="flex gap-2 pt-2 text-center">
                    <div className="w-9 shrink-0" />
                    <div className="flex-1 grid grid-cols-6 gap-2 sm:gap-3">
                      {kelurahanList.map((item, idx) => {
                        const isHovered = hoveredRateIndex === idx;
                        return (
                          <div
                            key={`name-rate-${item.id}`}
                            className={`flex flex-col items-center cursor-pointer transition-colors p-1 rounded-lg ${
                              isHovered ? "bg-emerald-50 dark:bg-emerald-950/50" : ""
                            }`}
                            onMouseEnter={() => setHoveredRateIndex(idx)}
                            onMouseLeave={() => setHoveredRateIndex(null)}
                          >
                            <span
                              className={`text-[11px] sm:text-xs font-bold truncate w-full transition-colors ${
                                isHovered
                                  ? "text-emerald-700 dark:text-emerald-300 font-extrabold"
                                  : "text-slate-700 dark:text-slate-300"
                              }`}
                              title={item.kelurahan}
                            >
                              {item.kelurahan}
                            </span>
                            <span className="text-[9px] text-slate-400 font-semibold">
                              {item.rwKepatuhanTinggi || 0} RW &gt;85%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Chart 2: Baseline - Berat Sampah (kg/hari) ─────────────────── */}
            <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between relative overflow-visible z-20">
              <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                    Baseline - Berat Sampah (kg/hari)
                  </h4>
                </div>
                <span className="text-[11px] font-extrabold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-300/60 dark:border-indigo-800">
                  Skala 0 – {maxVolumeKg.toLocaleString("id-ID")} kg/hari
                </span>
              </div>

              {/* Kanvas Chart Volume */}
              <div className="w-full relative overflow-visible pt-2">
                <div className="min-w-[340px]">
                  <div className="flex gap-2 items-end">
                    {/* Sumbu Y (kg) */}
                    <div className="w-12 shrink-0 flex flex-col justify-between text-[10px] text-slate-400 font-extrabold pr-1 border-r border-slate-200 dark:border-slate-700 h-64 text-right pb-1 select-none">
                      <span>{maxVolumeKg.toLocaleString("id-ID")}</span>
                      <span>{(maxVolumeKg * 0.75).toLocaleString("id-ID")}</span>
                      <span>{(maxVolumeKg * 0.5).toLocaleString("id-ID")}</span>
                      <span>{(maxVolumeKg * 0.25).toLocaleString("id-ID")}</span>
                      <span>0</span>
                    </div>

                    {/* Grid Bar 6 Kelurahan */}
                    <div className="flex-1 grid grid-cols-6 gap-2 sm:gap-3 items-end h-64 border-b border-slate-200 dark:border-slate-700 pb-1 relative">
                      {/* Gridlines Horizontal Dashed */}
                      <div className="absolute inset-x-0 top-0 border-t border-dashed border-slate-200/80 dark:border-slate-800 pointer-events-none" />
                      <div className="absolute inset-x-0 top-[25%] border-t border-dashed border-slate-200/80 dark:border-slate-800 pointer-events-none" />
                      <div className="absolute inset-x-0 top-[50%] border-t border-dashed border-slate-200/80 dark:border-slate-800 pointer-events-none" />
                      <div className="absolute inset-x-0 top-[75%] border-t border-dashed border-slate-200/80 dark:border-slate-800 pointer-events-none" />

                      {kelurahanList.map((item, idx) => {
                        const volKg = item.volumeBaselineKg != null ? item.volumeBaselineKg : 0;
                        const heightPct = Math.min(100, Math.max(0, (volKg / maxVolumeKg) * 100));
                        const isHovered = hoveredVolumeIndex === idx;
                        const isSyncHovered = hoveredRateIndex === idx;

                        return (
                          <div
                            key={`vol-${item.id}`}
                            className={`flex flex-col items-center justify-end h-full group relative cursor-pointer ${
                              isHovered ? "z-40" : isSyncHovered ? "z-20" : "z-10"
                            }`}
                            onMouseEnter={() => setHoveredVolumeIndex(idx)}
                            onMouseLeave={() => setHoveredVolumeIndex(null)}
                            onClick={() => setHoveredVolumeIndex(hoveredVolumeIndex === idx ? null : idx)}
                          >
                            {/* Background Track Highlight saat Kolom Aktif */}
                            {isHovered && (
                              <div className="absolute inset-y-0 inset-x-0.5 sm:inset-x-1 bg-indigo-500/[0.08] dark:bg-indigo-400/[0.12] rounded-xl pointer-events-none -z-1 border border-indigo-500/20" />
                            )}

                            {/* Popover Tooltip Detail - Ditampilkan di Posisi Aman Atas Tanpa Terpotong */}
                            {isHovered && (
                              <div
                                className={`absolute z-50 top-2 ${getTooltipAlignment(
                                  idx
                                )} bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md text-white rounded-2xl p-3 shadow-2xl shadow-indigo-950/40 border border-indigo-500/50 text-[11px] w-56 sm:w-60 pointer-events-none transition-all animate-in fade-in zoom-in-95 duration-150`}
                              >
                                {/* Header Pop Up */}
                                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
                                  <div className="flex items-center gap-1.5 font-extrabold text-indigo-400 text-xs truncate">
                                    <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0 animate-pulse" />
                                    <span className="truncate">Kel. {item.kelurahan}</span>
                                  </div>
                                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800/80 shrink-0">
                                    Baseline - Berat Sampah
                                  </span>
                                </div>

                                {/* Body Key-Values */}
                                <div className="space-y-1.5 text-slate-300">
                                  <div className="flex items-center justify-between bg-slate-800/70 rounded-xl px-2.5 py-1.5 border border-slate-700/60 shadow-2xs">
                                    <span className="text-slate-400 font-medium text-[10.5px]">Total Berat:</span>
                                    <span className="font-black text-indigo-300 text-xs sm:text-[13px] tracking-tight">
                                      {volKg > 0
                                        ? `${volKg.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg/hari`
                                        : "—"}
                                    </span>
                                  </div>

                                  {/* Komposisi Sampah Terpilah (Organik & Anorganik) */}
                                  <div className="grid grid-cols-2 gap-1.5 pt-0.5 text-center text-[10px]">
                                    <div className="bg-emerald-950/50 border border-emerald-800/50 rounded-lg p-1">
                                      <span className="text-slate-400 block text-[8.5px]">Organik</span>
                                      <span className="font-bold text-emerald-300 text-[10px]">
                                        {item.volumeOrganik != null ? `${item.volumeOrganik.toLocaleString("id-ID")} kg` : "—"}
                                      </span>
                                    </div>
                                    <div className="bg-amber-950/50 border border-amber-800/50 rounded-lg p-1">
                                      <span className="text-slate-400 block text-[8.5px]">Anorganik</span>
                                      <span className="font-bold text-amber-300 text-[10px]">
                                        {item.volumeAnorganik != null ? `${item.volumeAnorganik.toLocaleString("id-ID")} kg` : "—"}
                                      </span>
                                    </div>
                                  </div>

                                  {item.catatan && (
                                    <p className="mt-1.5 pt-1 border-t border-slate-800 text-[9.5px] text-slate-400 leading-snug line-clamp-2 italic">
                                      {item.catatan}
                                    </p>
                                  )}
                                </div>

                                {/* Downward Pointer Caret Arrow */}
                                <div
                                  className={`absolute -bottom-1.5 ${getArrowAlignment(
                                    idx
                                  )} w-3 h-3 bg-slate-900 border-r border-b border-indigo-500/50 rotate-45 pointer-events-none`}
                                />
                              </div>
                            )}

                            {/* Label Angka Volume di Atas Batang */}
                            <span
                              className={`text-[10px] sm:text-[11px] font-black mb-1.5 tracking-tight transition-transform ${
                                isHovered
                                  ? "text-indigo-500 scale-110 font-black"
                                  : "text-indigo-700 dark:text-indigo-400 group-hover:scale-105"
                              }`}
                            >
                              {volKg > 0 ? (volKg >= 1000 ? `${(volKg / 1000).toFixed(1)}k` : `${Math.round(volKg)}`) : "—"}
                            </span>

                            {/* Batang Grafik */}
                            <div
                              className={`w-full max-w-[42px] bg-indigo-100/50 dark:bg-indigo-950/30 rounded-t-xl overflow-hidden h-full flex items-end border-x border-t transition-all ${
                                isHovered
                                  ? "border-indigo-400 ring-2 ring-indigo-400/60 shadow-md shadow-indigo-500/20"
                                  : isSyncHovered
                                  ? "border-indigo-400/80 ring-1 ring-indigo-400/50"
                                  : "border-indigo-300/40 dark:border-indigo-800/50"
                              }`}
                            >
                              <div
                                className={`w-full bg-gradient-to-t from-indigo-700 via-indigo-600 to-indigo-500 rounded-t-xl transition-all duration-300 ${
                                  isHovered ? "brightness-115" : "group-hover:brightness-110"
                                }`}
                                style={{ height: `${heightPct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sumbu X: Nama Kelurahan */}
                  <div className="flex gap-2 pt-2 text-center">
                    <div className="w-12 shrink-0" />
                    <div className="flex-1 grid grid-cols-6 gap-2 sm:gap-3">
                      {kelurahanList.map((item, idx) => {
                        const volKg = item.volumeBaselineKg || 0;
                        const isHovered = hoveredVolumeIndex === idx;
                        return (
                          <div
                            key={`name-vol-${item.id}`}
                            className={`flex flex-col items-center cursor-pointer transition-colors p-1 rounded-lg ${
                              isHovered ? "bg-indigo-50 dark:bg-indigo-950/50" : ""
                            }`}
                            onMouseEnter={() => setHoveredVolumeIndex(idx)}
                            onMouseLeave={() => setHoveredVolumeIndex(null)}
                          >
                            <span
                              className={`text-[11px] sm:text-xs font-bold truncate w-full transition-colors ${
                                isHovered
                                  ? "text-indigo-700 dark:text-indigo-300 font-extrabold"
                                  : "text-slate-700 dark:text-slate-300"
                              }`}
                              title={item.kelurahan}
                            >
                              {item.kelurahan}
                            </span>
                            <span className="text-[9px] text-slate-400 font-semibold truncate w-full">
                              {volKg > 0 ? `${volKg.toLocaleString("id-ID", { maximumFractionDigits: 0 })} kg` : "—"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Kasus B: Single View (Kepatuhan Penuh) */}
        {activeTab === "kepatuhan" && (
          <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 relative overflow-visible z-20">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/60 dark:border-slate-700">
              <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                Grafik Batang Baseline - Tingkat Kepatuhan per Kelurahan (0 – 100%)
              </h4>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                Rata-rata: 40% | Acuan Grafik: 17,8%
              </span>
            </div>

            <div className="w-full relative overflow-visible pt-2">
              <div className="min-w-[620px]">
                <div className="flex gap-3 items-end">
                  <div className="w-12 shrink-0 flex flex-col justify-between text-[10px] text-slate-400 font-extrabold pr-2 border-r border-slate-200 dark:border-slate-700 h-64 text-right pb-1 select-none">
                    <span>100%</span>
                    <span>80%</span>
                    <span>60%</span>
                    <span>40%</span>
                    <span>20%</span>
                    <span>0%</span>
                  </div>

                  <div className="flex-1 grid grid-cols-6 gap-4 sm:gap-6 items-end h-64 border-b border-slate-200 dark:border-slate-700 pb-1 relative">
                    <div className="absolute inset-x-0 top-0 border-t border-dashed border-slate-200/80 dark:border-slate-800 pointer-events-none" />
                    <div className="absolute inset-x-0 top-[20%] border-t border-dashed border-slate-200/80 dark:border-slate-800 pointer-events-none" />
                    <div className="absolute inset-x-0 top-[40%] border-t border-dashed border-slate-200/80 dark:border-slate-800 pointer-events-none" />
                    <div className="absolute inset-x-0 top-[60%] border-t border-dashed border-slate-200/80 dark:border-slate-800 pointer-events-none" />
                    <div className="absolute inset-x-0 top-[80%] border-t border-dashed border-slate-200/80 dark:border-slate-800 pointer-events-none" />

                    {kelurahanList.map((item, idx) => {
                      const rate = item.kepatuhanBaseline || 0;
                      const isHovered = hoveredRateIndex === idx;

                      return (
                        <div
                          key={`tab-rate-${item.id}`}
                          className={`flex flex-col items-center justify-end h-full group relative cursor-pointer ${
                            isHovered ? "z-40" : "z-10"
                          }`}
                          onMouseEnter={() => setHoveredRateIndex(idx)}
                          onMouseLeave={() => setHoveredRateIndex(null)}
                          onClick={() => setHoveredRateIndex(hoveredRateIndex === idx ? null : idx)}
                        >
                          {/* Background Track Highlight */}
                          {isHovered && (
                            <div className="absolute inset-y-0 inset-x-1 sm:inset-x-2 bg-emerald-500/[0.08] dark:bg-emerald-400/[0.12] rounded-xl pointer-events-none -z-1 border border-emerald-500/20" />
                          )}

                          {/* Popover Tooltip Detail */}
                          {isHovered && (
                            <div
                              className={`absolute z-50 top-2 ${getTooltipAlignment(
                                idx
                              )} bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md text-white rounded-2xl p-3.5 shadow-2xl shadow-emerald-950/40 border border-emerald-500/50 text-[11px] w-56 sm:w-60 pointer-events-none transition-all animate-in fade-in zoom-in-95 duration-150`}
                            >
                              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
                                <div className="flex items-center gap-1.5 font-extrabold text-emerald-400 text-xs truncate">
                                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
                                  <span className="truncate">Kel. {item.kelurahan}</span>
                                </div>
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 shrink-0">
                                  Juli 2026
                                </span>
                              </div>

                              <div className="space-y-1.5 text-slate-300">
                                <div className="flex items-center justify-between bg-slate-800/70 rounded-xl px-2.5 py-1.5 border border-slate-700/60 shadow-2xs">
                                  <span className="text-slate-400 font-medium text-[10.5px]">Kepatuhan:</span>
                                  <span className="font-black text-emerald-400 text-xs sm:text-[13px] tracking-tight">
                                    {rate > 0 ? `${rate.toFixed(1)}%` : "—"}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between px-1 text-[10.5px]">
                                  <span className="text-slate-400">Total Wilayah:</span>
                                  <span className="font-semibold text-slate-200">
                                    {item.jumlahRw} RW
                                  </span>
                                </div>

                                <div className="flex items-center justify-between px-1 text-[10.5px]">
                                  <span className="text-slate-400">RW Patuh (&gt;85%):</span>
                                  <span className="font-extrabold text-amber-300">
                                    {item.rwKepatuhanTinggi || 0} RW
                                  </span>
                                </div>

                                {rate > 0 && (
                                  <div className="flex items-center justify-between px-1 text-[10px] text-slate-400 border-t border-slate-800/80 pt-1">
                                    <span>Vs Rata-rata Coblong:</span>
                                    <span
                                      className={`font-semibold ${
                                        rate >= avgKepatuhan ? "text-emerald-400" : "text-amber-400"
                                      }`}
                                    >
                                      {rate >= avgKepatuhan ? "+" : ""}
                                      {(rate - avgKepatuhan).toFixed(1)}%
                                    </span>
                                  </div>
                                )}
                              </div>

                              {item.isEstimasi && (
                                <div className="mt-2 pt-1 border-t border-slate-800 flex items-center gap-1 text-[9.5px] text-amber-300 italic">
                                  <Info size={10} className="shrink-0 text-amber-400" />
                                  <span className="truncate">Estimasi survei awal kondisi eksisting</span>
                                </div>
                              )}

                              <div
                                className={`absolute -bottom-1.5 ${getArrowAlignment(
                                  idx
                                )} w-3 h-3 bg-slate-900 border-r border-b border-emerald-500/50 rotate-45 pointer-events-none`}
                              />
                            </div>
                          )}

                          <span
                            className={`text-sm font-black mb-2 transition-transform ${
                              isHovered
                                ? "text-emerald-500 scale-110 font-black"
                                : "text-emerald-700 dark:text-emerald-400 group-hover:scale-105"
                            }`}
                          >
                            {rate > 0 ? `${rate.toFixed(1)}%` : "—"}
                          </span>
                          <div
                            className={`w-full max-w-[64px] bg-emerald-100/50 dark:bg-emerald-950/40 rounded-t-xl overflow-hidden h-full flex items-end border-x border-t transition-all ${
                              isHovered
                                ? "border-emerald-400 ring-2 ring-emerald-400/60 shadow-md shadow-emerald-500/20"
                                : "border-emerald-300/40 dark:border-emerald-800/50"
                            }`}
                          >
                            <div
                              className={`w-full bg-gradient-to-t from-emerald-700 to-emerald-500 rounded-t-xl transition-all duration-300 ${
                                isHovered ? "brightness-115" : "group-hover:brightness-110"
                              }`}
                              style={{ height: `${Math.min(100, Math.max(0, rate))}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3 pt-2 text-center">
                  <div className="w-12 shrink-0" />
                  <div className="flex-1 grid grid-cols-6 gap-4 sm:gap-6">
                    {kelurahanList.map((item, idx) => {
                      const isHovered = hoveredRateIndex === idx;
                      return (
                        <div
                          key={`name-only-rate-${item.id}`}
                          className={`cursor-pointer p-1 rounded-lg transition-colors ${
                            isHovered ? "bg-emerald-50 dark:bg-emerald-950/50" : ""
                          }`}
                          onMouseEnter={() => setHoveredRateIndex(idx)}
                          onMouseLeave={() => setHoveredRateIndex(null)}
                        >
                          <span
                            className={`text-xs font-black truncate block transition-colors ${
                              isHovered
                                ? "text-emerald-700 dark:text-emerald-300 font-extrabold"
                                : "text-slate-800 dark:text-slate-200"
                            }`}
                          >
                            {item.kelurahan}
                          </span>
                          <span className="text-[9px] text-slate-400 font-semibold block">
                            {item.rwKepatuhanTinggi || 0} RW &gt;85%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Kasus C: Single View (Berat Sampah Penuh) */}
        {activeTab === "volume" && (
          <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 relative overflow-visible z-20">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/60 dark:border-slate-700">
              <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-indigo-500" />
                Grafik Batang Baseline - Berat Sampah per Kelurahan (kg/hari)
              </h4>
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">
                Maksimal: {maxVolumeKg.toLocaleString("id-ID")} kg/hari
              </span>
            </div>

            <div className="w-full relative overflow-visible pt-2">
              <div className="min-w-[620px]">
                <div className="flex gap-3 items-end">
                  <div className="w-14 shrink-0 flex flex-col justify-between text-[10px] text-slate-400 font-extrabold pr-2 border-r border-slate-200 dark:border-slate-700 h-64 text-right pb-1 select-none">
                    <span>{maxVolumeKg}</span>
                    <span>{maxVolumeKg * 0.75}</span>
                    <span>{maxVolumeKg * 0.5}</span>
                    <span>{maxVolumeKg * 0.25}</span>
                    <span>0</span>
                  </div>

                  <div className="flex-1 grid grid-cols-6 gap-4 sm:gap-6 items-end h-64 border-b border-slate-200 dark:border-slate-700 pb-1 relative">
                    <div className="absolute inset-x-0 top-0 border-t border-dashed border-slate-200/80 dark:border-slate-800 pointer-events-none" />
                    <div className="absolute inset-x-0 top-[25%] border-t border-dashed border-slate-200/80 dark:border-slate-800 pointer-events-none" />
                    <div className="absolute inset-x-0 top-[50%] border-t border-dashed border-slate-200/80 dark:border-slate-800 pointer-events-none" />
                    <div className="absolute inset-x-0 top-[75%] border-t border-dashed border-slate-200/80 dark:border-slate-800 pointer-events-none" />

                    {kelurahanList.map((item, idx) => {
                      const volKg = item.volumeBaselineKg || 0;
                      const isHovered = hoveredVolumeIndex === idx;

                      return (
                        <div
                          key={`tab-vol-${item.id}`}
                          className={`flex flex-col items-center justify-end h-full group relative cursor-pointer ${
                            isHovered ? "z-40" : "z-10"
                          }`}
                          onMouseEnter={() => setHoveredVolumeIndex(idx)}
                          onMouseLeave={() => setHoveredVolumeIndex(null)}
                          onClick={() => setHoveredVolumeIndex(hoveredVolumeIndex === idx ? null : idx)}
                        >
                          {/* Background Track Highlight */}
                          {isHovered && (
                            <div className="absolute inset-y-0 inset-x-1 sm:inset-x-2 bg-indigo-500/[0.08] dark:bg-indigo-400/[0.12] rounded-xl pointer-events-none -z-1 border border-indigo-500/20" />
                          )}

                          {/* Popover Tooltip Detail */}
                          {isHovered && (
                            <div
                              className={`absolute z-50 top-2 ${getTooltipAlignment(
                                idx
                              )} bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md text-white rounded-2xl p-3.5 shadow-2xl shadow-indigo-950/40 border border-indigo-500/50 text-[11px] w-56 sm:w-60 pointer-events-none transition-all animate-in fade-in zoom-in-95 duration-150`}
                            >
                              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
                                <div className="flex items-center gap-1.5 font-extrabold text-indigo-400 text-xs truncate">
                                  <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0 animate-pulse" />
                                  <span className="truncate">Kel. {item.kelurahan}</span>
                                </div>
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800/80 shrink-0">
                                  Baseline - Berat Sampah
                                </span>
                              </div>

                              <div className="space-y-1.5 text-slate-300">
                                <div className="flex items-center justify-between bg-slate-800/70 rounded-xl px-2.5 py-1.5 border border-slate-700/60 shadow-2xs">
                                  <span className="text-slate-400 font-medium text-[10.5px]">Total Berat:</span>
                                  <span className="font-black text-indigo-300 text-xs sm:text-[13px] tracking-tight">
                                    {volKg > 0
                                      ? `${volKg.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg/hari`
                                      : "—"}
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 gap-1.5 pt-0.5 text-center text-[10px]">
                                  <div className="bg-emerald-950/50 border border-emerald-800/50 rounded-lg p-1">
                                    <span className="text-slate-400 block text-[8.5px]">Organik</span>
                                    <span className="font-bold text-emerald-300 text-[10px]">
                                      {item.volumeOrganik != null ? `${item.volumeOrganik.toLocaleString("id-ID")} kg` : "—"}
                                    </span>
                                  </div>
                                  <div className="bg-amber-950/50 border border-amber-800/50 rounded-lg p-1">
                                    <span className="text-slate-400 block text-[8.5px]">Anorganik</span>
                                    <span className="font-bold text-amber-300 text-[10px]">
                                      {item.volumeAnorganik != null ? `${item.volumeAnorganik.toLocaleString("id-ID")} kg` : "—"}
                                    </span>
                                  </div>

                                </div>

                                {item.catatan && (
                                  <p className="mt-1.5 pt-1 border-t border-slate-800 text-[9.5px] text-slate-400 leading-snug line-clamp-2 italic">
                                    {item.catatan}
                                  </p>
                                )}
                              </div>

                              <div
                                className={`absolute -bottom-1.5 ${getArrowAlignment(
                                  idx
                                )} w-3 h-3 bg-slate-900 border-r border-b border-indigo-500/50 rotate-45 pointer-events-none`}
                              />
                            </div>
                          )}

                          <span
                            className={`text-xs sm:text-sm font-black mb-2 transition-transform ${
                              isHovered
                                ? "text-indigo-500 scale-110 font-black"
                                : "text-indigo-700 dark:text-indigo-400 group-hover:scale-105"
                            }`}
                          >
                            {volKg > 0 ? `${volKg.toLocaleString("id-ID")} kg` : "—"}
                          </span>
                          <div
                            className={`w-full max-w-[64px] bg-indigo-100/50 dark:bg-indigo-950/40 rounded-t-xl overflow-hidden h-full flex items-end border-x border-t transition-all ${
                              isHovered
                                ? "border-indigo-400 ring-2 ring-indigo-400/60 shadow-md shadow-indigo-500/20"
                                : "border-indigo-300/40 dark:border-indigo-800/50"
                            }`}
                          >
                            <div
                              className={`w-full bg-gradient-to-t from-indigo-700 to-indigo-500 rounded-t-xl transition-all duration-300 ${
                                isHovered ? "brightness-115" : "group-hover:brightness-110"
                              }`}
                              style={{ height: `${Math.min(100, Math.max(0, (volKg / maxVolumeKg) * 100))}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3 pt-2 text-center">
                  <div className="w-14 shrink-0" />
                  <div className="flex-1 grid grid-cols-6 gap-4 sm:gap-6">
                    {kelurahanList.map((item, idx) => {
                      const volKg = item.volumeBaselineKg || 0;
                      const isHovered = hoveredVolumeIndex === idx;
                      return (
                        <div
                          key={`name-only-vol-${item.id}`}
                          className={`cursor-pointer p-1 rounded-lg transition-colors ${
                            isHovered ? "bg-indigo-50 dark:bg-indigo-950/50" : ""
                          }`}
                          onMouseEnter={() => setHoveredVolumeIndex(idx)}
                          onMouseLeave={() => setHoveredVolumeIndex(null)}
                        >
                          <span
                            className={`text-xs font-black truncate block transition-colors ${
                              isHovered
                                ? "text-indigo-700 dark:text-indigo-300 font-extrabold"
                                : "text-slate-800 dark:text-slate-200"
                            }`}
                          >
                            {item.kelurahan}
                          </span>
                          <span className="text-[9px] text-slate-400 font-semibold block">
                            {volKg > 0 ? `${volKg.toLocaleString("id-ID", { maximumFractionDigits: 0 })} kg` : "—"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 5. Tabel Rincian Data Survei Baseline Lapangan ───────────────────── */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="font-extrabold text-[15px] text-slate-900 dark:text-slate-100 tracking-tight">
              Tabel Rincian Data Survei Baseline Wilayah
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Rincian sampel empiris tingkat kepatuhan dan timbulan sampah per kelurahan di Kecamatan Coblong.
            </p>
          </div>
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 self-start sm:self-auto">
            Status: <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">Data Acuan Statis</span>
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 text-[11px] font-extrabold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-3 text-center w-10 border-r border-slate-200 dark:border-slate-800">No</th>
                <th className="py-3 px-4 font-bold border-r border-slate-200 dark:border-slate-800">Kelurahan</th>
                <th className="py-3 px-3 text-center border-r border-slate-200 dark:border-slate-800">Jumlah RW</th>
                <th className="py-3 px-3 text-center bg-amber-50/50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-r border-slate-200 dark:border-slate-800">
                  RW Kepatuhan &gt;85%
                </th>
                <th className="py-3 px-3 text-center bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-r border-slate-200 dark:border-slate-800">
                  Baseline - Tingkat Kepatuhan (%)
                </th>
                <th className="py-3 px-3 text-center bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-800 dark:text-indigo-300 border-r border-slate-200 dark:border-slate-800">
                  Baseline - Berat Sampah (kg/hari)
                </th>
                <th className="py-3 px-4 text-slate-500 dark:text-slate-400">Catatan Verifikasi Lapangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
              {kelurahanList.map((item, idx) => {
                const bRate = item.kepatuhanBaseline;
                const bVol = item.volumeBaselineKg;

                return (
                  <tr
                    key={`tbl-${item.id}`}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors text-xs"
                  >
                    <td className="py-3 px-3 text-center text-slate-400 font-medium border-r border-slate-200/60 dark:border-slate-800/60">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100 border-r border-slate-200/60 dark:border-slate-800/60">
                      Kel. {item.kelurahan}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-600 dark:text-slate-300 border-r border-slate-200/60 dark:border-slate-800/60">
                      {item.jumlahRw} RW
                    </td>
                    <td className="py-3 px-3 text-center font-extrabold text-amber-700 dark:text-amber-400 bg-amber-50/20 dark:bg-amber-950/10 border-r border-slate-200/60 dark:border-slate-800/60">
                      {item.rwKepatuhanTinggi || 0} RW
                    </td>
                    <td className="py-3 px-3 text-center font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50/20 dark:bg-emerald-950/10 border-r border-slate-200/60 dark:border-slate-800/60">
                      {bRate != null ? `${bRate.toFixed(2).replace(".", ",")}%` : "—"}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/10 border-r border-slate-200/60 dark:border-slate-800/60">
                      {bVol != null && bVol > 0
                        ? `${bVol.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`
                        : "—"}
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      {item.catatan || "Sampel survei tervalidasi lapangan KKN Juli 2026."}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 6. Footer Informatif & Catatan Kaki Wajib (Anti-Miskomunikasi DLH) ─── */}
      <div className="space-y-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-800 text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
        <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700">
          <Info size={16} className="text-[#009966] dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-slate-800 dark:text-slate-200">
              Catatan: Data baseline dihimpun melalui survei sampel lapangan giat KKN pada Juli 2026 sebagai titik tolak evaluasi intervensi sistem pada tingkat RW dan Kelurahan.
            </p>
            <p className="text-slate-500 dark:text-slate-400">
              Data baseline diambil selama kegiatan survei lapangan KKN (Juli 2026) berbasis sampel 6 kelurahan Kecamatan Coblong sebagai acuan awal evaluasi tingkat RW.
            </p>
            <p className="italic text-[10.5px] text-slate-400 dark:text-slate-500 pt-0.5">
              *Data baseline kelurahan Cipaganti terintegrasi berbasis rekapitulasi operasional sentra maggot RT 07 (organik 200 kg/hari) dan bank sampah RW 02 (anorganik 80 kg/hari) dengan kepatuhan 13,67%.
            </p>
          </div>
        </div>
      </div>

      {/* ── 7. Modal Verifikasi Dokumen Sumber (DLH / KKN) ────────────────────── */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                    Berita Acara &amp; Verifikasi Dokumen Sumber
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Audit Trail Baseline Survei Pemilahan Sampah Lapangan KKN Juli 2026
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVerifyModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Pernyataan Integritas Data */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/40 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
              <span className="font-extrabold flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                Pernyataan Keabsahan Data Lapangan
              </span>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Seluruh data survei baseline dalam modul ini bersumber dari Berita Acara Observasi Empiris Lapangan giat KKN Wilayah Kecamatan Coblong periode Juli 2026, ditandatangani oleh enumerator lapangan dan disupervisi oleh DPL (Dosen Pembimbing Lapangan).
              </p>
            </div>

            {/* Tabel Enumerator & Tanggal Pengambilan Sampel */}
            <div className="space-y-2">
              <span className="text-xs font-black uppercase text-slate-500 tracking-wider">
                Daftar Petugas Enumerator Lapangan per Kelurahan
              </span>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] font-bold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Kelurahan</th>
                      <th className="py-2.5 px-3">Tanggal Survei</th>
                      <th className="py-2.5 px-3">Enumerator KKN</th>
                      <th className="py-2.5 px-3">Catatan Observasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
                    {ENUMERATOR_SURVEI.map((e) => (
                      <tr key={`enum-${e.kelurahan}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-2 px-3 font-bold text-slate-800 dark:text-slate-200">{e.kelurahan}</td>
                        <td className="py-2 px-3 text-slate-500">{e.tanggal}</td>
                        <td className="py-2 px-3 font-semibold text-emerald-700 dark:text-emerald-400">{e.enumerator}</td>
                        <td className="py-2 px-3 text-slate-400">{e.catatan}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Jawaban Pertanyaan Kritis Audit */}
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <h5 className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <HelpCircle size={14} className="text-blue-500" />
                Klarifikasi Metodologi Audit (DLH / Pimpinan Daerah)
              </h5>
              <ul className="space-y-1.5 text-[11px] list-disc list-inside leading-relaxed text-slate-600 dark:text-slate-400">
                <li>
                  <strong>Satuan Berat Sampah:</strong> Dihitung berdasarkan estimasi berat timbulan harian (kg/hari) hasil pengukuran sampel tempat sampah percontohan pada bulan Juli 2026.
                </li>
                <li>
                  <strong>Indeks 24 RW &gt;85%:</strong> Dihitung murni berdasarkan persentase kepatuhan rumah tangga yang disurvei dalam RW terkait saat giat lapangan.
                </li>
                <li>
                  <strong>Perlindungan Data:</strong> Data baseline bersifat statis (read-only) dan tidak dapat dimanipulasi oleh filter tanggal transaksi realtime.
                </li>
              </ul>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleExportRawData}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <FileSpreadsheet size={14} />
                  <span>Unduh Raw Data (.xlsx)</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrintBeritaAcara}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Printer size={14} />
                  <span>Cetak Berita Acara</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowVerifyModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold transition-colors cursor-pointer shadow-xs ml-auto"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
