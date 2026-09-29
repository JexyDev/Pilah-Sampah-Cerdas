/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Halaman: Laporan Resmi Tata Kelola Sampah
 * Peruntukan: Khusus Role PIMPINAN, SUPER_USER, dan DEVELOPER
 * Standard Visual: Dokumen Kedinasan Resmi UNIKOM x Pemerintah Kota Bandung & BERSEKA (Bebas LPPM)
 * Format Ekspor: Dokumen Word (.docx) & Cetak/PDF (A4)
 * 100% Real-Time Aggregation dari PostgreSQL Database
 */

import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  FileText,
  Building2,
  Trash2,
  Recycle,
  Truck,
  Leaf,
  ShieldCheck,
  FileDown,
  Printer,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Calendar,
  MapPin,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Database,
  Sliders,
  Clock,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import api from "../../services/api";
import showToast from "../../utils/showToast";
import { CustomSelect, type SelectOption } from "../../components/common/CustomSelect";
import type { WasteReportData } from "./types";
import { OfficialDocumentA4View } from "./components/OfficialDocumentA4View";
import {
  PengaturanLaporanModal,
  type ReportCustomConfig,
  DEFAULT_WASTE_REPORT_CONFIG,
} from "../../components/laporan/PengaturanLaporanModal";
import { exportWasteReportDocx } from "../../utils/docxExportService";

const WILAYAH_OPTIONS: SelectOption[] = [
  { value: "ALL", label: "Kecamatan Coblong (Seluruh Wilayah)", sublabel: "Cakupan 6 Kelurahan Lengkap" },
  { value: "Cipaganti", label: "Kelurahan Cipaganti", sublabel: "Kecamatan Coblong" },
  { value: "Dago", label: "Kelurahan Dago", sublabel: "Kecamatan Coblong" },
  { value: "Lebak Gede", label: "Kelurahan Lebak Gede", sublabel: "Kecamatan Coblong" },
  { value: "Lebak Siliwangi", label: "Kelurahan Lebak Siliwangi", sublabel: "Kecamatan Coblong" },
  { value: "Sadang Serang", label: "Kelurahan Sadang Serang", sublabel: "Kecamatan Coblong" },
  { value: "Sekeloa", label: "Kelurahan Sekeloa", sublabel: "Kecamatan Coblong" },
];

const PERIODE_OPTIONS: SelectOption[] = [
  { value: "semua", label: "Semua Waktu", sublabel: "Akumulasi Keseluruhan Data" },
  { value: "harian", label: "Hari Ini", sublabel: "24 Jam Terakhir" },
  { value: "mingguan", label: "Minggu Ini", sublabel: "7 Hari Terakhir" },
  { value: "bulanan", label: "Bulan Ini", sublabel: "Bulan Berjalan" },
  { value: "tahunan", label: "Tahun Ini", sublabel: "Tahun Berjalan" },
  { value: "custom", label: "Rentang Tanggal Khusus", sublabel: "Pilih Tanggal Mulai s/d Akhir" },
];

const HARI_OPTIONS: SelectOption[] = [
  { value: "ALL", label: "Semua Hari (Senin - Minggu)", sublabel: "Operasional Penuh 7 Hari" },
  { value: "SENIN", label: "Hari Senin", sublabel: "Awal Pekan Operasional" },
  { value: "SELASA", label: "Hari Selasa", sublabel: "Hari Kerja Rutin" },
  { value: "RABU", label: "Hari Rabu", sublabel: "Pertengahan Pekan" },
  { value: "KAMIS", label: "Hari Kamis", sublabel: "Hari Kerja Rutin" },
  { value: "JUMAT", label: "Hari Jumat", sublabel: "Jumat Bersih & Sirkular" },
  { value: "SABTU", label: "Hari Sabtu", sublabel: "Kegiatan Swadaya Warga" },
  { value: "MINGGU", label: "Hari Minggu", sublabel: "Kerja Bakti Lingkungan" },
];

const JAM_OPTIONS: SelectOption[] = [
  { value: "ALL", label: "Semua Jam (24 Jam)", sublabel: "Akumulasi Ritase Penuh" },
  { value: "PAGI", label: "Sesi Pagi (07:00 - 12:00)", sublabel: "Pengangkutan Utama" },
  { value: "SIANG", label: "Sesi Siang (12:00 - 15:00)", sublabel: "Pemilahan & Biokonversi" },
  { value: "SORE", label: "Sesi Sore (15:00 - 18:00)", sublabel: "Penimbangan Bank Sampah" },
  { value: "CUSTOM", label: "Jam Kustom Khusus", sublabel: "Tentukan Jam Mulai & Selesai" },
];

const STORAGE_KEY = "berseka_waste_report_custom_config_v2";

export const LaporanTataKelolaSampahPage: React.FC = () => {
  const [data, setData] = useState<WasteReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [exportingDocx, setExportingDocx] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"dashboard" | "document">("dashboard");

  // Orientasi Cetak A4: Portrait atau Landscape
  const [printOrientation, setPrintOrientation] = useState<"portrait" | "landscape">("portrait");

  // Pengaturan Naskah Dokumen Dinamis (CRUD Lengkap)
  const [reportConfig, setReportConfig] = useState<ReportCustomConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_WASTE_REPORT_CONFIG;
  });

  // Filters
  const [selectedWilayah, setSelectedWilayah] = useState<string>("ALL");
  const [selectedPeriode, setSelectedPeriode] = useState<string>("semua");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedHari, setSelectedHari] = useState<string>("ALL");
  const [selectedJamPreset, setSelectedJamPreset] = useState<string>("ALL");
  const [customJamMulai, setCustomJamMulai] = useState<string>("");
  const [customJamSelesai, setCustomJamSelesai] = useState<string>("");

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const params: any = {
        wilayah: selectedWilayah,
        periode: selectedPeriode,
      };
      if (selectedPeriode === "custom" && startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }
      if (selectedHari && selectedHari !== "ALL") {
        params.hari = selectedHari;
      }
      if (selectedJamPreset === "PAGI") {
        params.jamMulai = "07:00";
        params.jamSelesai = "12:00";
      } else if (selectedJamPreset === "SIANG") {
        params.jamMulai = "12:00";
        params.jamSelesai = "15:00";
      } else if (selectedJamPreset === "SORE") {
        params.jamMulai = "15:00";
        params.jamSelesai = "18:00";
      } else if (selectedJamPreset === "CUSTOM" && customJamMulai && customJamSelesai) {
        params.jamMulai = customJamMulai;
        params.jamSelesai = customJamSelesai;
      }

      const res = await api.get("/dashboard/waste-executive-report", { params });
      if (res.data?.success && res.data?.data) {
        setData(res.data.data);
      } else {
        showToast.error("Format data laporan tidak valid");
      }
    } catch (err: any) {
      console.error("[LaporanTataKelola] Gagal memuat:", err);
      showToast.error("Gagal memuat data laporan resmi tata kelola sampah");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPeriode === "custom") {
      if (startDate && endDate) {
        fetchReportData();
      }
      return;
    }
    fetchReportData();
  }, [selectedWilayah, selectedPeriode, startDate, endDate, selectedHari, selectedJamPreset]);

  useEffect(() => {
    if (selectedJamPreset === "CUSTOM" && customJamMulai && customJamSelesai) {
      const handler = setTimeout(() => {
        fetchReportData();
      }, 500);
      return () => clearTimeout(handler);
    }
  }, [customJamMulai, customJamSelesai]);

  const handleApplyCustomDate = () => {
    if (selectedPeriode === "custom") {
      if (!startDate || !endDate) {
        showToast.error("Mohon lengkapi tanggal mulai dan tanggal akhir");
        return;
      }
      if (new Date(startDate) > new Date(endDate)) {
        showToast.error("Tanggal mulai tidak boleh lebih besar dari tanggal akhir");
        return;
      }
      fetchReportData();
    }
  };

  // Simpan Pengaturan Naskah Dinamis
  const handleSaveConfig = (newConfig: ReportCustomConfig) => {
    setReportConfig(newConfig);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
      showToast.success("Pengaturan naskah dokumen laporan berhasil disimpan");
    } catch (e) {
      console.error(e);
    }
  };

  // Reset Pengaturan Naskah ke Default
  const handleResetConfig = () => {
    setReportConfig(DEFAULT_WASTE_REPORT_CONFIG);
    try {
      localStorage.removeItem(STORAGE_KEY);
      showToast.success("Format naskah laporan dikembalikan ke template standar");
    } catch (e) {
      console.error(e);
    }
  };

  // Ekspor Dokumen Resmi Word (.docx) Asli
  const handleExportDocx = async () => {
    if (!data) return;
    try {
      setExportingDocx(true);
      await exportWasteReportDocx(data, {
        ...reportConfig,
        orientation: printOrientation,
      });
      showToast.success("Dokumen Word (.docx) naskah resmi tata kelola sampah berhasil diunduh");
    } catch (err: any) {
      console.error("[LaporanTataKelola] Gagal export DOCX:", err);
      showToast.error("Gagal mengunduh dokumen Word: " + (err.message || "Kesalahan sistem"));
    } finally {
      setExportingDocx(false);
    }
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-3 sm:p-6 lg:p-8 space-y-6 text-slate-800 dark:text-slate-100 print:p-0 print:m-0 print:bg-white print:text-black">
      <style>{`
        @page {
          size: A4 ${printOrientation};
          margin: 12mm 10mm 12mm 10mm;
        }
        @media print {
          /* 1. Sembunyikan elemen Web UI dashboard, header, filter, navigasi */
          .web-header,
          .web-filter-section,
          .web-dashboard-container,
          .web-view-switcher,
          button,
          nav,
          aside,
          .print-hide,
          .print\\:hidden {
            display: none !important;
          }

          /* 2. Tampilkan Naskah Dinas Resmi Kedinasan A4 */
          .official-document-section {
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            border: none !important;
          }

          body {
            background: #ffffff !important;
            color: #000000 !important;
            font-family: "Times New Roman", Times, serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .avoid-break {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .page-break-before {
            break-before: page !important;
            page-break-before: always !important;
          }

          table {
            border-collapse: collapse !important;
          }
        }
      `}</style>
      {/* ─────────────────────────────────────────────────────────────
          KOP DOKUMEN RESMI (OFFICIAL DOCUMENT LETTERHEAD - WEB VIEW)
      ───────────────────────────────────────────────────────────── */}
      <header className="web-header print:hidden bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-6 sm:p-8 relative overflow-hidden">
        {/* Subtle decorative accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-700 print:hidden" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-200/80 dark:border-slate-800 pb-6 print:border-b-2 print:border-slate-900 print:pb-4">
          <div className="flex items-center gap-5">
            {/* Logo Lambang Resmi */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0 shadow-xs print:border-slate-400">
              <Recycle className="w-10 h-10 text-emerald-700 dark:text-emerald-400 print:text-black" />
            </div>

            <div className="space-y-1">
              <span className="inline-block text-[11px] font-extrabold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/60 print:border-slate-400 print:text-black">
                Dokumen Resmi Eksekutif &bull; Role Pimpinan
              </span>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-tight print:text-xl print:text-black">
                {reportConfig.judulLaporan || "Laporan Evaluasi & Akuntabilitas Tata Kelola Sampah"}
              </h1>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                {reportConfig.subjudul || "Pemerintah Kota Bandung • Kecamatan Coblong • Platform Cerdas BERSEKA"}
              </p>
            </div>
          </div>

          <div className="text-left md:text-right space-y-1 text-xs text-slate-500 dark:text-slate-400 self-start md:self-auto bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 print:border-slate-300 print:bg-white print:p-2">
            <div>
              <span className="font-bold text-slate-700 dark:text-slate-300">No. Registrasi: </span>
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 print:text-black">
                {reportConfig.nomorDokumen || data?.metadata.nomorDokumen || "005/BERSEKA-DLH/EVAL/IX/2026"}
              </span>
            </div>
            <div>
              <span className="font-bold text-slate-700 dark:text-slate-300">Tanggal Terbit: </span>
              <span>
                {reportConfig.tanggalPengesahan || (data?.metadata.tanggalTerbit
                  ? new Date(data.metadata.tanggalTerbit).toLocaleDateString("id-ID", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }))}
              </span>
            </div>
            <div>
              <span className="font-bold text-slate-700 dark:text-slate-300">Klasifikasi: </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Laporan Resmi Pimpinan (Terverifikasi Real)
              </span>
            </div>
          </div>
        </div>

        {/* Bilah Metadata Dokumen */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
          <div>
            <span className="text-slate-400 dark:text-slate-500 font-semibold block uppercase text-[10px] tracking-wider">
              Wilayah Evaluasi
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 mt-0.5">
              <MapPin size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0 print:text-black" />
              {data?.metadata.wilayahCakupan || "Kecamatan Coblong"}
            </span>
          </div>

          <div>
            <span className="text-slate-400 dark:text-slate-500 font-semibold block uppercase text-[10px] tracking-wider">
              Periode Evaluasi
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 mt-0.5">
              <Calendar size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0 print:text-black" />
              <span className="capitalize">{data?.metadata.periodeEvaluasi || "Semua Waktu"}</span>
            </span>
          </div>

          <div>
            <span className="text-slate-400 dark:text-slate-500 font-semibold block uppercase text-[10px] tracking-wider">
              Otoritas Pengesah
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 mt-0.5">
              <ShieldCheck size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0 print:text-black" />
              Pimpinan &bull; DLH &bull; Camat
            </span>
          </div>

          <div>
            <span className="text-slate-400 dark:text-slate-500 font-semibold block uppercase text-[10px] tracking-wider">
              Status Integritas Data
            </span>
            <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 mt-0.5 print:text-black">
              <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0 print:text-black" />
              100% Real PostgreSQL
            </span>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          KOTAK INFORMASI SUMBER DATA (DATA PROVENANCE & VALIDITAS)
      ───────────────────────────────────────────────────────────── */}
      <div className="print:hidden bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/90 dark:border-emerald-800/70 rounded-2xl p-4 sm:p-4.5 flex flex-col sm:flex-row items-start sm:items-center gap-3.5 shadow-2xs">
        <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 shrink-0">
          <Database size={20} />
        </div>
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs sm:text-sm font-extrabold text-emerald-950 dark:text-emerald-100">
              Penjelasan Sumber &amp; Integritas Data Laporan
            </h4>
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-200/70 dark:bg-emerald-800/70 text-emerald-950 dark:text-emerald-100 border border-emerald-300 dark:border-emerald-700">
              Live Database PostgreSQL
            </span>
          </div>
          <p className="text-xs text-emerald-900/90 dark:text-emerald-200/90 leading-relaxed">
            Seluruh indikator kinerja, tonase sampah tereduksi, rasio pemilahan, dan matriks kepatuhan kewilayahan diambil langsung secara <em>real-time</em> dari basis data operasional BERSEKA. Data bersumber dari catatan penimbangan setoran warga di Bank Sampah, logbook harian pengolahan TPS/TPS3R, serta verifikasi tonase pengangkutan DLH Kota Bandung di 6 kelurahan Kecamatan Coblong.
          </p>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          BILAH FILTER & KONTROL AKSI (DISEMBUNYIKAN SAAT PRINT)
      ───────────────────────────────────────────────────────────── */}
      {/* ─────────────────────────────────────────────────────────────
          BILAH FILTER & KONTROL AKSI (100% RESPONSIVE)
      ───────────────────────────────────────────────────────────── */}
      <section className="web-filter-section bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 md:p-6 shadow-xs space-y-4 print:hidden">
        {/* Baris 1: Filter Cakupan Wilayah & Periode Waktu */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 flex-wrap">
          {/* Filter Wilayah */}
          <div className="w-full sm:w-72 sm:max-w-xs">
            <label className="block text-[11px] font-extrabold uppercase text-slate-400 dark:text-slate-500 mb-1.5 tracking-wider">
              Cakupan Wilayah
            </label>
            <CustomSelect
              options={WILAYAH_OPTIONS}
              value={selectedWilayah}
              onChange={(v) => setSelectedWilayah(v)}
            />
          </div>

          {/* Filter Periode */}
          <div className="w-full sm:w-60 sm:max-w-xs">
            <label className="block text-[11px] font-extrabold uppercase text-slate-400 dark:text-slate-500 mb-1.5 tracking-wider">
              Rentang Waktu
            </label>
            <CustomSelect
              options={PERIODE_OPTIONS}
              value={selectedPeriode}
              onChange={(v) => setSelectedPeriode(v)}
            />
          </div>

          {/* Custom Date Range */}
          {selectedPeriode === "custom" && (
            <div className="flex items-center gap-2 flex-wrap pb-0.5">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-xs text-slate-400 font-semibold">s/d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={handleApplyCustomDate}
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 cursor-pointer shadow-xs transition-all"
              >
                Terapkan
              </button>
            </div>
          )}
        </div>

        {/* Baris 2: Filter Waktu Presisi (Hari & Jam Operasional) */}
        <div className="border-t border-slate-100 dark:border-slate-800/60 pt-3 flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 flex-wrap">
          {/* Filter Hari */}
          <div className="w-full sm:w-60 sm:max-w-xs">
            <label className="block text-[11px] font-extrabold uppercase text-slate-400 dark:text-slate-500 mb-1.5 tracking-wider flex items-center gap-1.5">
              <Calendar size={13} className="text-emerald-600 dark:text-emerald-400" />
              Hari Operasional
            </label>
            <CustomSelect
              options={HARI_OPTIONS}
              value={selectedHari}
              onChange={(v) => setSelectedHari(v)}
            />
          </div>

          {/* Filter Jam */}
          <div className="w-full sm:w-60 sm:max-w-xs">
            <label className="block text-[11px] font-extrabold uppercase text-slate-400 dark:text-slate-500 mb-1.5 tracking-wider flex items-center gap-1.5">
              <Clock size={13} className="text-emerald-600 dark:text-emerald-400" />
              Sesi Jam Kerja
            </label>
            <CustomSelect
              options={JAM_OPTIONS}
              value={selectedJamPreset}
              onChange={(v) => setSelectedJamPreset(v)}
            />
          </div>

          {/* Custom Jam Input */}
          {selectedJamPreset === "CUSTOM" && (
            <div className="flex items-center gap-2 flex-wrap pb-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Mulai:</span>
                <input
                  type="time"
                  value={customJamMulai}
                  onChange={(e) => setCustomJamMulai(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <span className="text-xs text-slate-400 font-semibold">s/d</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Selesai:</span>
                <input
                  type="time"
                  value={customJamSelesai}
                  onChange={(e) => setCustomJamSelesai(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Baris 3: Pemisah & Bilah Aksi (View Switcher + Orientasi + Pengaturan + Export DOCX & Cetak PDF) */}
        <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3 flex-wrap">
          {/* Sisi Kiri: Switcher Tampilan & Orientasi A4 */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Switcher */}
            <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
              <button
                type="button"
                onClick={() => setViewMode("dashboard")}
                className={`inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "dashboard"
                    ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Tampilkan Dasbor Interaktif (Grafik & Widget)"
              >
                <LayoutDashboard size={14} />
                <span className="whitespace-nowrap">Dasbor Interaktif</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("document")}
                className={`inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "document"
                    ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Pratinjau Format Naskah Dokumen Resmi A4"
              >
                <FileText size={14} />
                <span className="whitespace-nowrap">Naskah Dokumen (A4)</span>
              </button>
            </div>

            {/* Orientasi Kertas A4 (Tegak / Mendatar) */}
            <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
              <button
                type="button"
                onClick={() => setPrintOrientation("portrait")}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  printOrientation === "portrait"
                    ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Format Tegak A4 (Portrait)"
              >
                Portrait
              </button>
              <button
                type="button"
                onClick={() => setPrintOrientation("landscape")}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  printOrientation === "landscape"
                    ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Format Mendatar A4 (Landscape)"
              >
                Landscape
              </button>
            </div>
          </div>

          {/* Sisi Kanan: Action Buttons (Perbarui, Pengaturan Naskah, Ekspor DOCX, Cetak PDF) */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap w-full lg:w-auto justify-start lg:justify-end">
            <button
              onClick={fetchReportData}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Muat ulang data terbaru dari database"
            >
              <RefreshCw size={14} className={loading ? "animate-spin text-emerald-600" : ""} />
              <span className="whitespace-nowrap">Perbarui</span>
            </button>

            {/* Tombol Pengaturan Naskah */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 font-bold text-xs transition-colors cursor-pointer"
              title="Ubah judul laporan, nomor dokumen, dan nama penandatangan secara dinamis"
            >
              <Sliders size={14} className="text-emerald-600 dark:text-emerald-400" />
              <span className="whitespace-nowrap">Pengaturan Naskah</span>
            </button>

            {/* Tombol Ekspor Word (.docx) */}
            <button
              onClick={handleExportDocx}
              disabled={exportingDocx || loading || !data}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
              title="Unduh seluruh naskah dalam format Microsoft Word (.docx) resmi"
            >
              <FileDown size={14} className={exportingDocx ? "animate-bounce" : ""} />
              <span className="whitespace-nowrap">{exportingDocx ? "Menyiapkan Word..." : "Ekspor DOCX"}</span>
            </button>

            {/* Tombol Cetak PDF */}
            <button
              onClick={handlePrintPdf}
              className="inline-flex items-center justify-center gap-2 px-4.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer"
              title="Cetak format naskah dokumen resmi A4 atau simpan ke PDF"
            >
              <Printer size={14} />
              <span className="whitespace-nowrap">Cetak / PDF (A4)</span>
            </button>
          </div>
        </div>
      </section>

      {/* Loading State */}
      {loading && !data && (
        <div className="py-24 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <div className="w-12 h-12 border-3 border-emerald-600/20 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
            Mengagregasi Laporan Resmi Tata Kelola Sampah...
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Menghitung neraca sirkularitas, tonase tereduksi dari TPA, dan audit komparasi 6 kelurahan...
          </p>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          BAGIAN 1: RINGKASAN EKSEKUTIF & KPI UTAMA
      ───────────────────────────────────────────────────────────── */}
      {data && (
        <>
          {/* ─────────────────────────────────────────────────────────────
              BAGIAN 1: DASBOR INTERAKTIF (KHUSUS TAMPILAN WEB)
          ───────────────────────────────────────────────────────────── */}
          <div
            className={`web-dashboard-container space-y-6 print:hidden ${
              viewMode === "dashboard" ? "block" : "hidden"
            }`}
          >
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Card 1: Infrastruktur */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Total Fasilitas
                </span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Building2 size={16} />
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {data.kpiSummary.infrastruktur.totalFasilitas}
                </span>
                <span className="text-xs font-semibold text-slate-500">Unit</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                <span>{data.kpiSummary.infrastruktur.tps3rCount} TPS3R</span>
                <span>&bull;</span>
                <span>{data.kpiSummary.infrastruktur.bankSampahCount} Bank Sampah</span>
              </div>
            </div>

            {/* Card 2: Tempat Sampah (Bin) Aktif */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Tempat Sampah Aktif (Bin)
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Trash2 size={16} />
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {data.kpiSummary.infrastruktur.wadahSampahAktif}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  / {data.kpiSummary.infrastruktur.wadahSampahTotal} Unit
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                <span className="text-emerald-600 font-bold">{data.kpiSummary.infrastruktur.wadahNormal} Normal</span>
                <span className="text-amber-600 font-bold">{data.kpiSummary.infrastruktur.wadahWaspada} Waspada</span>
                <span className="text-rose-600 font-bold">{data.kpiSummary.infrastruktur.wadahKritis} Kritis</span>
              </div>
            </div>

            {/* Card 3: Sampah Terpilah */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Sampah Terpilah
                </span>
                <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <Recycle size={16} />
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {data.kpiSummary.dampakDanReduksi.totalSampahTerpilahTon}
                </span>
                <span className="text-xs font-semibold text-slate-500">Ton</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800 truncate">
                Setara {(data.kpiSummary.dampakDanReduksi.totalSampahTerpilahKg ?? 0).toLocaleString("id-ID")} kg terkelola
              </p>
            </div>

            {/* Card 4: Tonase Tereduksi dari TPA */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2 bg-gradient-to-br from-emerald-500/5 to-teal-500/5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                  Tereduksi dari TPA
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Leaf size={16} />
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                  {data.kpiSummary.dampakDanReduksi.tonaseTereduksiDariTpaTon}
                </span>
                <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-300">
                  Ton ({data.kpiSummary.dampakDanReduksi.rasioReduksiTpaPersen}%)
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold pt-1 border-t border-emerald-100 dark:border-emerald-900/50">
                Residu TPA: {data.kpiSummary.dampakDanReduksi.residuKeTpaTon} Ton
              </p>
            </div>

            {/* Card 5: Kepatuhan Pemilahan Warga */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Rata-rata Kepatuhan
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <TrendingUp size={16} />
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {data.kpiSummary.dampakDanReduksi.rataRataKepatuhanPersen}%
                </span>
                <span className="text-xs font-semibold text-slate-500">Akurasi</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800 truncate">
                AI Confidence: {data.kpiSummary.dampakDanReduksi.rataRataAkurasiAiPersen}%
              </p>
            </div>

            {/* Card 6: Reduksi Emisi GRK */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Reduksi Emisi GRK
                </span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Sparkles size={16} />
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {(data.kpiSummary.dampakDanReduksi.reduksiEmisiCo2Kg ?? 0).toLocaleString("id-ID")}
                </span>
                <span className="text-xs font-semibold text-slate-500">kg CO₂e</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800 truncate">
                Formula DLH &bull; IPCC Tier 1
              </p>
            </div>
          </section>

          {/* ─────────────────────────────────────────────────────────────
              BAGIAN 2: ANALISIS DAMPAK & NERACA PENGOLAHAN (SIRKULARITAS)
          ───────────────────────────────────────────────────────────── */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Neraca Sampah & Diversi TPA */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
                    <Layers size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                      Neraca Sirkularitas Sampah
                    </h2>
                    <p className="text-xs text-slate-500">Rasio penanganan lokal vs residu ke TPA</p>
                  </div>
                </div>
              </div>

              {/* Progress bar komparasi */}
              <div className="space-y-3 pt-1">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-emerald-700 dark:text-emerald-400">
                      Tereduksi / Terolah di Sumber ({data.kpiSummary.dampakDanReduksi.rasioReduksiTpaPersen}%)
                    </span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {data.kpiSummary.dampakDanReduksi.tonaseTereduksiDariTpaTon} Ton
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(0, Math.min(data.kpiSummary.dampakDanReduksi.rasioReduksiTpaPersen, 100))}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-rose-600 dark:text-rose-400">
                      Residu Dibuang ke TPA ({data.kpiSummary.dampakDanReduksi.rasioPemilahan.residuPersen}%)
                    </span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {data.kpiSummary.dampakDanReduksi.residuKeTpaTon} Ton
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(0, Math.min(data.kpiSummary.dampakDanReduksi.rasioPemilahan.residuPersen, 100))}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Komposisi Timbulan */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-2.5 text-xs">
                <span className="font-extrabold uppercase tracking-wider text-slate-400 text-[10px]">
                  Rasio Pemilahan Kategori
                </span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/50 dark:border-slate-700">
                    <span className="text-[10px] font-bold text-emerald-600 block">ORGANIK</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      {data.kpiSummary.dampakDanReduksi.rasioPemilahan.organikPersen}%
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {(data.kpiSummary.dampakDanReduksi.rasioPemilahan.organikKg ?? 0).toLocaleString("id-ID")} kg
                    </span>
                  </div>

                  <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/50 dark:border-slate-700">
                    <span className="text-[10px] font-bold text-blue-600 block">ANORGANIK</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      {data.kpiSummary.dampakDanReduksi.rasioPemilahan.anorganikPersen}%
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {(data.kpiSummary.dampakDanReduksi.rasioPemilahan.anorganikKg ?? 0).toLocaleString("id-ID")} kg
                    </span>
                  </div>

                  <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/50 dark:border-slate-700">
                    <span className="text-[10px] font-bold text-rose-600 block">RESIDU</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      {data.kpiSummary.dampakDanReduksi.rasioPemilahan.residuPersen}%
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {(data.kpiSummary.dampakDanReduksi.rasioPemilahan.residuKg ?? 0).toLocaleString("id-ID")} kg
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Aktivitas Pengolahan Organik (Kompos & Maggot) */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600">
                    <Leaf size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                      Pengolahan Sampah Organik
                    </h2>
                    <p className="text-xs text-slate-500">Kapasitas penyerapan fasilitas biologis</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
                  <span className="text-[10px] font-extrabold uppercase text-amber-800 dark:text-amber-400 block">
                    Material Masuk
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-black text-slate-900 dark:text-white">
                      {(data.kpiSummary.operasional.materialOrganikMasukKg ?? 0).toLocaleString("id-ID")}
                    </span>
                    <span className="text-xs font-bold text-slate-500">kg</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Diserap ke reaktor kompos &amp; maggot
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
                  <span className="text-[10px] font-extrabold uppercase text-emerald-800 dark:text-emerald-400 block">
                    Output Terolah
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                      {(data.kpiSummary.operasional.outputProdukOrganikKg ?? 0).toLocaleString("id-ID")}
                    </span>
                    <span className="text-xs font-bold text-emerald-600">kg</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Produk bernilai ekonomi
                  </span>
                </div>
              </div>

              {/* Rincian Produk Organik */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Kompos Organik (Buruan Sae/Bata Terawang)</span>
                  <span className="font-black text-slate-900 dark:text-white">
                    {(data.kpiSummary.operasional.outputKomposKg ?? 0).toLocaleString("id-ID")} kg
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Larva Maggot BSF &amp; Kasgot</span>
                  <span className="font-black text-slate-900 dark:text-white">
                    {(data.kpiSummary.operasional.outputMaggotKg ?? 0).toLocaleString("id-ID")} kg
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Pupuk Organik Cair (POC)</span>
                  <span className="font-black text-slate-900 dark:text-white">
                    {(data.kpiSummary.operasional.outputPocLiter ?? 0).toLocaleString("id-ID")} Liter
                  </span>
                </div>
              </div>
            </div>

            {/* Kinerja Ritase Pengangkutan Sampah */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600">
                    <Truck size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                      Ritase Pengangkutan Sampah
                    </h2>
                    <p className="text-xs text-slate-500">Logistik penjemputan dari tempat sampah</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 text-center">
                <span className="text-[10px] font-extrabold uppercase text-blue-800 dark:text-blue-400">
                  Tingkat Keberhasilan Ritase
                </span>
                <div className="text-3xl font-black text-blue-700 dark:text-blue-400 mt-1">
                  {data.kpiSummary.operasional.tingkatKeberhasilanRitase}%
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {data.kpiSummary.operasional.ritaseSelesai} dari {data.kpiSummary.operasional.totalRitase} tugas penjemputan selesai
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 font-semibold">Tugas Penjemputan Selesai</span>
                  <span className="font-bold text-emerald-600">{data.kpiSummary.operasional.ritaseSelesai}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 font-semibold">Tugas Sedang Berjalan</span>
                  <span className="font-bold text-amber-600">{data.kpiSummary.operasional.ritaseDalamProses}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 font-semibold">Tugas Tertunda / Antrean</span>
                  <span className="font-bold text-slate-600">{data.kpiSummary.operasional.ritaseTertunda}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500 font-semibold">Total Log Pengangkutan Residu</span>
                  <span className="font-bold text-slate-900 dark:text-white">{data.kpiSummary.operasional.totalLogResidu} log</span>
                </div>
              </div>
            </div>
          </section>

          {/* ─────────────────────────────────────────────────────────────
              BAGIAN 3: TABEL AUDIT KOMPARASI PER KELURAHAN (BASELINE VS SAAT INI)
          ───────────────────────────────────────────────────────────── */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-xs font-black">
                    3
                  </span>
                  <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    Audit Komparasi Kinerja Pemilahan per Kelurahan
                  </h2>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Evaluasi pertumbuhan tingkat kepatuhan pemilahan dibandingkan target baseline awal pra-intervensi
                </p>
              </div>

              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
                6 Kelurahan &bull; Kecamatan Coblong
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-extrabold text-[10px]">
                    <th className="py-3.5 px-4">Kelurahan</th>
                    <th className="py-3.5 px-4 text-center">Baseline (%)</th>
                    <th className="py-3.5 px-4 text-center">Capaian Terkini (%)</th>
                    <th className="py-3.5 px-4 text-center">Pertumbuhan (&Delta;)</th>
                    <th className="py-3.5 px-4 text-right">Terpilah (kg)</th>
                    <th className="py-3.5 px-4 text-right">Residu (kg)</th>
                    <th className="py-3.5 px-4 text-center">TPS3R / Bank</th>
                    <th className="py-3.5 px-4 text-center">Bin Aktif</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center">Verifikasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.kelurahanAudit.map((k) => (
                    <tr
                      key={k.kelurahan}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                        {k.kelurahan}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-600 dark:text-slate-400">
                        {k.baselineRate}%
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono font-black text-slate-900 dark:text-white">
                          {k.currentComplianceRate}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-black font-mono text-[11px] ${
                            k.deltaPercent >= 0
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                          }`}
                        >
                          {k.deltaPercent >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                          {k.deltaPercent >= 0 ? `+${k.deltaPercent}%` : `${k.deltaPercent}%`}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {(k.totalTerpilahKg ?? 0).toLocaleString("id-ID")}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                        {(k.residuKg ?? 0).toLocaleString("id-ID")}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-slate-700 dark:text-slate-300">
                        {k.tps3rCount} / {k.bankSampahCount}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                        {k.activeBinsCount}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            k.complianceLevel === "TINGGI"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : k.complianceLevel === "SEDANG"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                          }`}
                        >
                          {k.complianceLevel}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center justify-center gap-1">
                          <CheckCircle2 size={12} />
                          {k.statusVerifikasi}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ─────────────────────────────────────────────────────────────
              BAGIAN 4: GRAFIK TREN BERKALA (TIME-SERIES MINGGUAN)
          ───────────────────────────────────────────────────────────── */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tren Timbulan Sampah */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                    Tren Timbulan &amp; Reduksi Sampah (8 Pekan)
                  </h2>
                  <p className="text-xs text-slate-500">Berat sampah organik, anorganik, dan residu (kg)</p>
                </div>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.trenBerkala}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="pekan" fontSize={11} />
                    <YAxis fontSize={11} />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="organikKg" name="Organik (kg)" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="anorganikKg" name="Anorganik (kg)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="residuKg" name="Residu ke TPA (kg)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tren Kepatuhan Pemilahan */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                    Tren Tingkat Kepatuhan Warga (8 Pekan)
                  </h2>
                  <p className="text-xs text-slate-500">Persentase kepatuhan pemilahan sesuai tempat sampah (%)</p>
                </div>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.trenBerkala}>
                    <defs>
                      <linearGradient id="gradKepatuhan" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="pekan" fontSize={11} />
                    <YAxis domain={[0, 100]} fontSize={11} unit="%" />
                    <RechartsTooltip />
                    <Area
                      type="monotone"
                      dataKey="kepatuhanPercent"
                      name="Kepatuhan (%)"
                      stroke="#059669"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#gradKepatuhan)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* ─────────────────────────────────────────────────────────────
              BAGIAN 5: LEMBAR PENGESAHAN DOKUMEN RESMI (SIGN-OFF SHEET)
          ───────────────────────────────────────────────────────────── */}
          <footer className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6 print:border-none print:shadow-none print:p-4 print:break-before-page">
            <div className="text-center space-y-1 border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Lembar Pengesahan Laporan Evaluasi Tata Kelola Sampah
              </h2>
              <p className="text-xs text-slate-500">
                Ditetapkan di Bandung pada tanggal{" "}
                {new Date(data.metadata.tanggalTerbit).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>

            {/* 3 Signatory Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center pt-2">
              {/* Signatory 1: Camat */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide block">
                  Mengetahui,
                </span>
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                  {data.signatories.camat.jabatan}
                </span>
                <span className="text-[11px] text-slate-500 block mb-16">
                  {data.signatories.camat.instansi}
                </span>

                <div className="pt-2 border-t border-slate-300 dark:border-slate-700 w-48 mx-auto">
                  <span className="font-extrabold text-xs text-slate-900 dark:text-white block underline">
                    {data.signatories.camat.nama}
                  </span>
                  <span className="text-[10px] text-slate-500 block">NIP. {data.signatories.camat.nip}</span>
                </div>
              </div>

              {/* Signatory 2: DLH */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide block">
                  Pemeriksa Teknis,
                </span>
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                  {data.signatories.dlh.jabatan}
                </span>
                <span className="text-[11px] text-slate-500 block mb-16">
                  {data.signatories.dlh.instansi}
                </span>

                <div className="pt-2 border-t border-slate-300 dark:border-slate-700 w-48 mx-auto">
                  <span className="font-extrabold text-xs text-slate-900 dark:text-white block underline">
                    {data.signatories.dlh.nama}
                  </span>
                  <span className="text-[10px] text-slate-500 block">NIP. {data.signatories.dlh.nip}</span>
                </div>
              </div>

              {/* Signatory 3: Pimpinan Eksekutif */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide block">
                  Pengesah Eksekutif,
                </span>
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                  {data.signatories.pimpinan.jabatan}
                </span>
                <span className="text-[11px] text-slate-500 block mb-16">
                  {data.signatories.pimpinan.instansi}
                </span>

                <div className="pt-2 border-t border-slate-300 dark:border-slate-700 w-48 mx-auto">
                  <span className="font-extrabold text-xs text-slate-900 dark:text-white block underline">
                    {data.signatories.pimpinan.nama}
                  </span>
                  <span className="text-[10px] text-slate-500 block">NIP. {data.signatories.pimpinan.nip}</span>
                </div>
              </div>
            </div>

            <div className="text-center text-[10px] text-slate-400 pt-4 border-t border-slate-100 dark:border-slate-800">
              Dokumen ini dihasilkan secara sah melalui modul pelaporan resmi BERSEKA &bull; Hak Cipta &copy; 2026 PT Makerindo
            </div>
          </footer>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            BAGIAN 2: NASKAH DOKUMEN RESMI KEDINASAN A4 (PRATINJAU & PRINT/PDF)
        ───────────────────────────────────────────────────────────── */}
        <div
          className={`official-document-section w-full overflow-x-auto print:overflow-visible pb-12 ${
            viewMode === "document" ? "block" : "hidden"
          } print:block`}
        >
          <OfficialDocumentA4View
            data={data}
            customConfig={reportConfig}
            orientation={printOrientation}
          />
        </div>
      </>
    )}

      {/* Modal Pengaturan Naskah Dokumen Laporan (CRUD Lengkap) */}
      <PengaturanLaporanModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={reportConfig}
        onSave={handleSaveConfig}
        onReset={handleResetConfig}
      />
    </div>
  );
};

export default LaporanTataKelolaSampahPage;
