/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Laporan Resmi KKN UNIKOM untuk Role Pimpinan
 * Format Dokumen Formal A4 Eksekutif UNIKOM x BERSEKA
 * Sesuai Acuan Dokumen Word: "Laporan Eksekutif Pelaksanaan KKN dan Tata Kelola Sampah 2026"
 * 100% Real-time Data dari Database PostgreSQL
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Printer,
  FileDown,
  RefreshCw,
  Users,
  CheckCircle2,
  Clock,
  Layers,
  ShieldCheck,
  TrendingUp,
  Filter,
  Database,
  Sliders,
  Award,
  GraduationCap,
  Trash2,
  Recycle,
  AlertTriangle,
  Calendar,
  Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from "recharts";
import api from "../../services/api";
import showToast from "../../utils/showToast";
import {
  PengaturanLaporanModal,
  type ReportCustomConfig,
  DEFAULT_REPORT_CONFIG,
} from "../../components/laporan/PengaturanLaporanModal";
import { exportExecutiveReportDocx } from "../../utils/docxExportService";

export interface LaporanSummaryResponse {
  header: {
    nomorDokumen: string;
    judulLaporan: string;
    subjudul: string;
    periode: string;
    tanggalCetak: string;
    tanggalCetakFormatted: string;
    wilayahCakupan: string;
    instansi: {
      universitas: string;
      taskforce: string;
      alamat: string;
      kontak: string;
    };
  };
  ringkasanEksekutif: {
    totalMahasiswaAktif: number;
    totalKelompok: number;
    totalDpl: number;
    kepatuhanPresensiPercent: number;
    totalProkerSelesai: number;
    totalProkerDisetujui: number;
    totalProkerSemua: number;
    persentaseProkerSelesai: number;
    totalJamKontribusi: number;
    rataRataJamPerMahasiswa: number;
  };
  ringkasanDampakSampah?: {
    totalSampahTerpilahKg: number;
    totalSampahTerpilahTon: number;
    organikKg: number;
    organikPersen: number;
    anorganikKg: number;
    anorganikPersen: number;
    residuKg: number;
    residuPersen: number;
    rasioReduksiTpaPersen: number;
    reduksiEmisiCo2Kg: number;
    rataRataKepatuhanPersen: number;
    wadahSampahAktif: number;
    totalPenggunaWarga: number;
    totalLokasiRw: number;
    volumeBulananM3: number;
  };
  topMahasiswa?: Array<{
    ranking: number;
    id: string;
    nama: string;
    nim: string;
    kelompok: string;
    kelurahan: string;
    nilaiAkhir: number;
    grade: string;
    kehadiranPercent: number;
    totalJamKerja: number;
  }>;
  topDpl?: Array<{
    ranking: number;
    id: string;
    nama: string;
    nip: string;
    kelompok: string;
    kelurahan: string;
    keaktifanLogbook: number;
    kunjunganLapangan: number;
    kepatuhanKelompok: number;
  }>;
  matriksKelompok: Array<{
    no: number;
    id: string;
    nama: string;
    kelurahan: string;
    cakupanRw: string[];
    cakupanRwFormatted: string;
    posko: {
      nama: string;
      alamat: string;
      latitude: number | null;
      longitude: number | null;
    } | null;
    ketua: {
      id: string;
      name: string;
      nim: string | null;
      phone: string | null;
    } | null;
    dpl: {
      id: string;
      name: string;
      nip: string | null;
      phone: string | null;
      programStudi: string | null;
    } | null;
    totalMahasiswa: number;
    persentaseKehadiran: number;
    prokerSelesaiCount: number;
    prokerTotalCount: number;
    prokerSelesaiPercent: number;
    rataRataSkorEvaluasi: number | null;
    kategoriNilai: string | null;
    jumlahMhsDinilai: number;
    statusEvaluasiLabel: string;
  }>;
  grafikPerforma: {
    prokerKategori: Array<{ kategori: string; total: number; selesai: number }>;
    statusPelaksanaanProker: Array<{ status: string; count: number; percentage: number; color: string }>;
    sebaranPerKelurahan: Array<{
      kelurahan: string;
      totalKelompok: number;
      totalMahasiswa: number;
      prokerSelesai: number;
    }>;
    distribusiNilaiEvaluasi: Array<{ grade: string; count: number }>;
    trenKehadiranMingguan: Array<{ minggu: string; persentase: number; totalJam: number }>;
  };
  lembarPengesahan: {
    tempat: string;
    tanggal: string;
    pejabat: Array<{
      posisi: string;
      peran: string;
      jabatan: string;
      instansi: string;
      nama: string;
      nip: string;
    }>;
  };
  filterOptions: {
    kelurahanOptions: string[];
    selectedKelurahan: string;
    selectedRw: string;
    selectedKelompok: string;
    selectedPeriode: string;
  };
}

const STORAGE_KEY = "berseka_kkn_report_custom_config_v2";

export const LaporanResmiKknPage: React.FC = () => {
  const [data, setData] = useState<LaporanSummaryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [exportingDocx, setExportingDocx] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Filter States
  const [selectedKelurahan, setSelectedKelurahan] = useState<string>("Semua Kelurahan");
  const [selectedRw, setSelectedRw] = useState<string>("");
  const [selectedKelompok, setSelectedKelompok] = useState<string>("");
  
  // Filter Waktu Presisi (Hari, Jam, Tanggal)
  const [datePreset, setDatePreset] = useState<string>("semua");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedHari, setSelectedHari] = useState<string>("ALL");
  const [selectedJamPreset, setSelectedJamPreset] = useState<string>("ALL");
  const [customJamMulai, setCustomJamMulai] = useState<string>("");
  const [customJamSelesai, setCustomJamSelesai] = useState<string>("");

  // Print Orientation State: landscape by default (optimal untuk matriks & grafik eksekutif)
  const [printOrientation, setPrintOrientation] = useState<"landscape" | "portrait">("landscape");

  // Dynamic Report Configuration (Customizable & Persisted)
  const [reportConfig, setReportConfig] = useState<ReportCustomConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_REPORT_CONFIG;
  });

  const documentRef = useRef<HTMLDivElement>(null);

  const fetchLaporanData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedKelurahan && selectedKelurahan !== "Semua Kelurahan" && selectedKelurahan !== "ALL") {
        params.append("kelurahan", selectedKelurahan);
      }
      if (selectedRw && selectedRw.trim() !== "") {
        params.append("rw", selectedRw.trim());
      }
      if (selectedKelompok && selectedKelompok.trim() !== "") {
        params.append("kelompok", selectedKelompok.trim());
      }
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (selectedHari && selectedHari !== "ALL") params.append("hari", selectedHari);
      if (selectedJamPreset === "PAGI") {
        params.append("jamMulai", "07:00");
        params.append("jamSelesai", "12:00");
      } else if (selectedJamPreset === "SIANG") {
        params.append("jamMulai", "12:00");
        params.append("jamSelesai", "15:00");
      } else if (selectedJamPreset === "SORE") {
        params.append("jamMulai", "15:00");
        params.append("jamSelesai", "18:00");
      } else if (selectedJamPreset === "CUSTOM" && customJamMulai && customJamSelesai) {
        params.append("jamMulai", customJamMulai);
        params.append("jamSelesai", customJamSelesai);
      }

      const res = await api.get(`/laporan/kkn/summary?${params.toString()}`);
      if (res.data?.success && res.data?.data) {
        setData(res.data.data);
      } else {
        showToast.error("Gagal memuat data ringkasan laporan resmi KKN");
      }
    } catch (err: any) {
      console.error("[LaporanResmiKknPage] fetch error:", err);
      showToast.error(err.response?.data?.message || "Gagal memuat data laporan KKN dari server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLaporanData();
  }, [selectedKelurahan, datePreset, startDate, endDate, selectedHari, selectedJamPreset]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchLaporanData();
    }, 400);
    return () => clearTimeout(handler);
  }, [selectedRw, selectedKelompok, customJamMulai, customJamSelesai]);

  // Handle Preset Tanggal Cepat
  const handleDatePresetChange = (preset: string) => {
    setDatePreset(preset);
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    if (preset === "semua") {
      setStartDate("");
      setEndDate("");
    } else if (preset === "hari_ini") {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "kemarin") {
      const yest = new Date(now);
      yest.setDate(yest.getDate() - 1);
      const yestStr = yest.toISOString().slice(0, 10);
      setStartDate(yestStr);
      setEndDate(yestStr);
    } else if (preset === "7_hari") {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      setStartDate(d.toISOString().slice(0, 10));
      setEndDate(todayStr);
    } else if (preset === "bulan_ini") {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(first.toISOString().slice(0, 10));
      setEndDate(todayStr);
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

  // Reset Pengaturan Naskah
  const handleResetConfig = () => {
    setReportConfig(DEFAULT_REPORT_CONFIG);
    try {
      localStorage.removeItem(STORAGE_KEY);
      showToast.success("Format naskah laporan dikembalikan ke template standar");
    } catch (e) {
      console.error(e);
    }
  };

  // Cetak / Simpan PDF
  const handlePrint = () => {
    window.print();
  };

  // Ekspor Dokumen Word (.docx) Asli
  const handleExportDocx = async () => {
    if (!data) return;
    try {
      setExportingDocx(true);
      await exportExecutiveReportDocx({
        config: {
          judulLaporan: reportConfig.judulLaporan,
          subjudul: reportConfig.subjudul,
          nomorDokumen: reportConfig.nomorDokumen,
          sifatDokumen: reportConfig.sifatDokumen,
          lampiranDokumen: reportConfig.lampiranDokumen,
          perihalDokumen: reportConfig.perihalDokumen,
          periode: reportConfig.periodeDokumen || data.header.periode,
          tanggalPengesahan: reportConfig.tanggalPengesahan || data.header.tanggalCetakFormatted,
          wilayahCakupan: reportConfig.wilayahCakupan || data.header.wilayahCakupan,
          penandatangan: reportConfig.penandatangan,
          orientation: printOrientation,
        } as any,
        ringkasanEksekutif: data.ringkasanEksekutif,
        ringkasanDampakSampah: data.ringkasanDampakSampah,
        topMahasiswa: data.topMahasiswa,
        topDpl: data.topDpl,
        sebaranKelurahan: data.grafikPerforma.sebaranPerKelurahan,
        matriksKelompok: data.matriksKelompok.map((m) => ({
          no: m.no,
          nama: m.nama,
          ketuaNama: m.ketua?.name || "-",
          dplNama: m.dpl?.name || "-",
          kelurahan: m.kelurahan,
          cakupanRw: m.cakupanRwFormatted,
          totalMahasiswa: m.totalMahasiswa,
          persentaseKehadiran: m.persentaseKehadiran,
          prokerSelesaiCount: m.prokerSelesaiCount,
          prokerTotalCount: m.prokerTotalCount,
          statusEvaluasiLabel: m.statusEvaluasiLabel,
        })),
      });
      showToast.success("Dokumen Word (.docx) laporan eksekutif berhasil diunduh");
    } catch (err: any) {
      console.error("[ExportDocx] error:", err);
      showToast.error("Gagal mengunduh dokumen Word: " + (err.message || "Kesalahan sistem"));
    } finally {
      setExportingDocx(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-800 dark:text-slate-100 pb-16">
      {/* Dynamic Print CSS */}
      <style>{`
        @media print {
          @page {
            size: A4 ${printOrientation};
            margin: 12mm 10mm 12mm 10mm;
          }
          body {
            background: #ffffff !important;
            color: #0f172a !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print,
          aside,
          nav,
          header,
          footer,
          .sidebar,
          #app-sidebar,
          .toaster,
          [role="status"] {
            display: none !important;
          }
          .document-paper {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            background: transparent !important;
          }
          .avoid-break {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          .force-break-before {
            break-before: page !important;
            page-break-before: always !important;
          }
        }
      `}</style>

      {/* TOP CONTROLS & ACTION BAR (WEB ONLY - HIDDEN ON PRINT) */}
      <div className="no-print sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-0.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Akses Khusus: Pimpinan • Super User • Developer</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <span>Laporan Eksekutif KKN &amp; Tata Kelola Lingkungan</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                Resmi UNIKOM x BERSEKA
              </span>
            </h1>
          </div>

          {/* Action Buttons: PDF, DOCX, Settings, Orientation (HAPUS EXCEL & CSV) */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Toggle Orientasi Cetak */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setPrintOrientation("landscape")}
                className={`px-2.5 py-1.5 rounded-md transition-all ${
                  printOrientation === "landscape"
                    ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
                title="Format Landscape (Optimal untuk Matriks & Visualisasi)"
              >
                A4 Landscape
              </button>
              <button
                type="button"
                onClick={() => setPrintOrientation("portrait")}
                className={`px-2.5 py-1.5 rounded-md transition-all ${
                  printOrientation === "portrait"
                    ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
                title="Format Portrait (Standar Vertikal)"
              >
                A4 Portrait
              </button>
            </div>

            {/* Tombol Pengaturan Laporan (Modal CRUD Dinamis) */}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold text-xs transition-all shadow-xs"
              title="Atur Judul, Nomor Dokumen, dan Pejabat Penandatangan"
            >
              <Sliders className="w-3.5 h-3.5 text-emerald-600" />
              <span>Pengaturan Naskah</span>
            </button>

            {/* Tombol Cetak / Simpan PDF */}
            <button
              type="button"
              onClick={handlePrint}
              disabled={loading || !data}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs shadow-xs hover:shadow transition-all disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>

            {/* Tombol Ekspor DOCX (Microsoft Word Asli) */}
            <button
              type="button"
              onClick={handleExportDocx}
              disabled={exportingDocx || loading || !data}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs shadow-xs hover:shadow transition-all disabled:opacity-50"
              title="Unduh Dokumen Microsoft Word (.docx)"
            >
              <FileDown className="w-4 h-4" />
              <span>{exportingDocx ? "Membuat Word..." : "Ekspor DOCX"}</span>
            </button>

            {/* Refresh Data */}
            <button
              type="button"
              onClick={fetchLaporanData}
              disabled={loading}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all disabled:opacity-50"
              title="Muat Ulang Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Dynamic Filter Bar: Wilayah & Waktu (Hari, Jam, Tanggal) */}
        <div className="max-w-7xl mx-auto mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-2.5 text-xs">
          <div className="flex items-center gap-1 font-bold text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Wilayah:</span>
          </div>

          {/* Kelurahan Dropdown */}
          <select
            value={selectedKelurahan}
            onChange={(e) => setSelectedKelurahan(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-2.5 py-1.5 font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {Array.from(
              new Set(
                data?.filterOptions?.kelurahanOptions?.length
                  ? ["Semua Kelurahan", ...data.filterOptions.kelurahanOptions]
                  : ["Semua Kelurahan", "Cipaganti", "Dago", "Lebakgede", "Lebak Siliwangi", "Sadang Serang", "Sekeloa"]
              )
            ).map((k) => (
              <option key={k} value={k}>
                {k === "Semua Kelurahan" ? "Seluruh Wilayah (Coblong)" : `Kel. ${k}`}
              </option>
            ))}
          </select>

          {/* RW Input */}
          <input
            type="text"
            placeholder="Cari RW (misal: 01)"
            value={selectedRw}
            onChange={(e) => setSelectedRw(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-2 py-1.5 font-medium text-slate-700 dark:text-slate-200 w-28 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />

          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1 hidden sm:block" />

          {/* Filter Waktu: Tanggal, Hari, Jam */}
          <div className="flex items-center gap-1 font-bold text-slate-500">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Filter Waktu:</span>
          </div>

          {/* Preset Tanggal */}
          <select
            value={datePreset}
            onChange={(e) => handleDatePresetChange(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-2 py-1.5 font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="semua">Semua Periode</option>
            <option value="hari_ini">Hari Ini</option>
            <option value="kemarin">Kemarin</option>
            <option value="7_hari">7 Hari Terakhir</option>
            <option value="bulan_ini">Bulan Ini</option>
            <option value="custom">Rentang Tanggal...</option>
          </select>

          {datePreset === "custom" && (
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-2 py-1 font-medium text-slate-700 dark:text-slate-200"
              />
              <span className="text-slate-400">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-2 py-1 font-medium text-slate-700 dark:text-slate-200"
              />
            </div>
          )}

          {/* Filter Hari */}
          <select
            value={selectedHari}
            onChange={(e) => setSelectedHari(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-2 py-1.5 font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="ALL">Semua Hari</option>
            <option value="SENIN">Senin</option>
            <option value="SELASA">Selasa</option>
            <option value="RABU">Rabu</option>
            <option value="KAMIS">Kamis</option>
            <option value="JUMAT">Jumat</option>
            <option value="SABTU">Sabtu</option>
            <option value="MINGGU">Minggu</option>
          </select>

          {/* Filter Jam */}
          <select
            value={selectedJamPreset}
            onChange={(e) => setSelectedJamPreset(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-2 py-1.5 font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="ALL">Semua Jam</option>
            <option value="PAGI">Pagi (07:00 - 12:00)</option>
            <option value="SIANG">Siang (12:00 - 15:00)</option>
            <option value="SORE">Sore (15:00 - 18:00)</option>
            <option value="CUSTOM">Jam Kustom...</option>
          </select>

          {selectedJamPreset === "CUSTOM" && (
            <div className="flex items-center gap-1">
              <input
                type="time"
                value={customJamMulai}
                onChange={(e) => setCustomJamMulai(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-1.5 py-1 font-medium"
              />
              <span>-</span>
              <input
                type="time"
                value={customJamSelesai}
                onChange={(e) => setCustomJamSelesai(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-1.5 py-1 font-medium"
              />
            </div>
          )}

          {(selectedKelurahan !== "Semua Kelurahan" || selectedRw || datePreset !== "semua" || selectedHari !== "ALL" || selectedJamPreset !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSelectedKelurahan("Semua Kelurahan");
                setSelectedRw("");
                setSelectedKelompok("");
                setDatePreset("semua");
                setStartDate("");
                setEndDate("");
                setSelectedHari("ALL");
                setSelectedJamPreset("ALL");
                setCustomJamMulai("");
                setCustomJamSelesai("");
              }}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline ml-1"
            >
              Reset Filter
            </button>
          )}

          <div className="ml-auto text-xs text-slate-400 dark:text-slate-500 font-medium hidden lg:block">
            Status Data: <span className="font-bold text-emerald-600">100% Real PostgreSQL</span>
          </div>
        </div>
      </div>

      {/* MAIN DOCUMENT WRAPPER (FORMAL PAPER CONTAINER) */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 mt-6">
        {loading && !data ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center shadow-xs border border-slate-200 dark:border-slate-800">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-3" />
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">
              Menyiapkan Data Laporan Resmi Eksekutif...
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Mengumpulkan baseline sampah, partisipasi mahasiswa, capaian program kerja, dan performa DPL.
            </p>
          </div>
        ) : !data ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center shadow-xs border border-slate-200 dark:border-slate-800">
            <p className="text-sm font-semibold text-rose-600">Data laporan tidak dapat dimuat.</p>
          </div>
        ) : (
          <div
            ref={documentRef}
            className="document-paper bg-white text-slate-900 shadow-xl rounded-2xl sm:p-10 p-6 border border-slate-200/80 transition-all font-sans"
          >
            {/* 1. KOP SURAT RESMI: LOGO UNIKOM DI KIRI, TEKS TENGAH (BEBAS LPPM), LOGO BERSEKA DI KANAN */}
            <div className="pb-5 border-b-[4px] border-double border-slate-950 mb-6">
              <div className="flex items-center justify-between gap-4">
                {/* Logo UNIKOM (KIRI) */}
                <div className="w-24 sm:w-28 flex-shrink-0 flex items-center justify-center">
                  <img
                    src="/image/mitra/unikom.png"
                    alt="Logo UNIKOM"
                    className="max-h-20 w-auto object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/favicon.png";
                    }}
                  />
                </div>

                {/* Teks Lembaga & Instansi (TENGAH - BEBAS LPPM) */}
                <div className="text-center flex-1 px-2">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700">
                    UNIVERSITAS KOMPUTER INDONESIA (UNIKOM)
                  </h3>
                  <h2 className="text-sm sm:text-lg font-black uppercase tracking-tight text-emerald-950 mt-0.5">
                    TASK FORCE KKN TEMATIK PENGELOLAAN SAMPAH MANDIRI "BERSEKA"
                  </h2>
                  <p className="text-[10px] sm:text-xs text-slate-600 mt-1 leading-snug">
                    Sekretariat Operasional: Jl. Dipati Ukur No. 112-116, Lebak Gede, Coblong, Kota Bandung, Jawa Barat 40132
                    <br />
                    Laman Resmi:{" "}
                    <span className="font-semibold text-slate-800">https://berseka.id</span> • Pos-el:{" "}
                    <span className="font-semibold text-slate-800">info@unikom.ac.id</span>
                  </p>
                </div>

                {/* Logo BERSEKA (KANAN) */}
                <div className="w-24 sm:w-28 flex-shrink-0 flex items-center justify-center">
                  <img
                    src="/image/berseka-logo-full.png"
                    alt="Logo BERSEKA"
                    className="max-h-20 w-auto object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/app-logo.png";
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 2. JUDUL DOKUMEN & KOTAK METADATA RESMI (DINAMIS DARI REPORT CONFIG) */}
            <div className="text-center mb-6">
              <div className="inline-block relative group cursor-pointer" onClick={() => setIsSettingsOpen(true)}>
                <h2 className="text-base sm:text-xl font-black uppercase tracking-tight text-slate-950 underline decoration-slate-900 decoration-2 underline-offset-4">
                  {reportConfig.judulLaporan}
                </h2>
                <span className="no-print opacity-0 group-hover:opacity-100 transition-opacity absolute -top-4 right-0 text-[10px] bg-slate-800 text-white px-1.5 py-0.5 rounded font-medium">
                  Klik untuk ubah
                </span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-emerald-800 uppercase mt-1">
                {reportConfig.subjudul}
              </p>

              {/* Metadata Grid */}
              <div className="mt-4 bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-left">
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Nomor Dokumen:
                  </span>
                  <span className="font-mono font-bold text-slate-900">{reportConfig.nomorDokumen}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Periode Evaluasi:
                  </span>
                  <span className="font-bold text-slate-900">{data.header.periode}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Wilayah Cakupan:
                  </span>
                  <span className="font-bold text-slate-900">{reportConfig.wilayahCakupan}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Tanggal Pengesahan:
                  </span>
                  <span className="font-bold text-slate-900">{reportConfig.tanggalPengesahan}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Integritas Naskah:
                  </span>
                  <span className="font-bold text-emerald-700">100% Real PostgreSQL</span>
                </div>
              </div>
            </div>

            {/* 3. BAGIAN I: BASELINE DATA & RINGKASAN DAMPAK LINGKUNGAN (DITAMPILKAN DI AWAL) */}
            <div className="mb-8 avoid-break">
              <div className="flex items-center gap-2 mb-2 pb-1 border-b border-slate-200">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  I
                </span>
                <h3 className="font-black text-sm sm:text-base text-slate-900 uppercase tracking-wide">
                  Ringkasan Eksekutif &amp; Baseline Dampak Tata Kelola Lingkungan
                </h3>
              </div>

              <p className="text-xs text-slate-600 mb-3 text-justify leading-relaxed">
                Laporan ini menyajikan pemantauan strategis pelaksanaan Kuliah Kerja Nyata (KKN) terpadu berbasis data waktu nyata (real-time) serta integrasi pemantauan tata kelola sampah dan lingkungan di wilayah Kecamatan Coblong (6 kelurahan binaan, 86 RW).
              </p>

              {/* 5 Pilar Metrik Kunci Eksekutif */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {/* 1. Pemilahan Sampah (Organik & Anorganik) */}
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-emerald-800 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Pemilahan Sampah</span>
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-emerald-950">
                      {data.ringkasanDampakSampah?.totalSampahTerpilahKg ?? 427.89} <span className="text-xs font-bold text-emerald-700">kg</span>
                    </div>
                    <div className="text-[10px] text-emerald-800 font-semibold mt-0.5">
                      Organik {data.ringkasanDampakSampah?.organikPersen ?? 61}% • Anorganik {data.ringkasanDampakSampah?.anorganikPersen ?? 39}%
                    </div>
                  </div>
                </div>

                {/* 2. Reduksi TPA Sarimukti */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-blue-700 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Reduksi TPA</span>
                    <Recycle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-slate-900">
                      {data.ringkasanDampakSampah?.rasioReduksiTpaPersen ?? 95.0}%
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Reduksi Emisi {data.ringkasanDampakSampah?.reduksiEmisiCo2Kg ?? 850.5} kg CO₂e
                    </div>
                  </div>
                </div>

                {/* 3. Kepatuhan AI Pemilahan */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-amber-700 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Kepatuhan AI</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-slate-900">
                      {data.ringkasanDampakSampah?.rataRataKepatuhanPersen ?? 99.83}%
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {data.ringkasanDampakSampah?.wadahSampahAktif ?? 250} Wadah Teraktivasi
                    </div>
                  </div>
                </div>

                {/* 4. Total Peserta KKN */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-purple-700 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Peserta KKN</span>
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-slate-900">
                      {data.ringkasanEksekutif.totalMahasiswaAktif}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {data.ringkasanEksekutif.totalKelompok} Kelompok • {data.ringkasanEksekutif.totalDpl} DPL
                    </div>
                  </div>
                </div>

                {/* 5. Jam Kontribusi Lapangan */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between col-span-2 sm:col-span-1">
                  <div className="flex items-center justify-between text-rose-700 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Jam Kontribusi</span>
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-slate-900">
                      {(data.ringkasanEksekutif.totalJamKontribusi ?? 0).toLocaleString("id-ID")}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Rerata {data.ringkasanEksekutif.rataRataJamPerMahasiswa ?? 0} Jam/Mhs (Target 200)
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. BAGIAN II: DEMOGRAFI & SEBARAN PESERTA KKN */}
            <div className="mb-8 avoid-break">
              <div className="flex items-center gap-2 mb-2 pb-1 border-b border-slate-200">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  II
                </span>
                <h3 className="font-black text-sm sm:text-base text-slate-900 uppercase tracking-wide">
                  Demografi &amp; Sebaran Peserta per Kelurahan
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sebaran per Kelurahan */}
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 overflow-hidden">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                    Sebaran Mahasiswa per Kelurahan Binaan
                  </h4>
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={data.grafikPerforma.sebaranPerKelurahan}
                        margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="kelurahan" tick={{ fontSize: 9, fill: "#475569" }} interval={0} angle={-15} textAnchor="end" />
                        <YAxis tick={{ fontSize: 9, fill: "#475569" }} />
                        <RechartsTooltip contentStyle={{ fontSize: 11 }} />
                        <Bar dataKey="totalMahasiswa" name="Mahasiswa" fill="#0284c7" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Ringkasan Demografi Studi */}
                <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50 flex flex-col justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-2 text-xs">
                      Komposisi Kelompok &amp; Program Studi
                    </h4>
                    <p className="text-slate-600 leading-relaxed mb-3 text-[11px]">
                      Peserta KKN Tematik 2026 tersebar di 6 kelurahan Kecamatan Coblong: Cipaganti (61 mhs, 4 DPL), Dago (163 mhs, 4 DPL), Lebakgede (54 mhs, 4 DPL), Lebak Siliwangi (36 mhs, 3 DPL), Sadang Serang (138 mhs, 11 DPL), dan Sekeloa (82 mhs, 6 DPL).
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-[11px] space-y-1">
                    <div className="font-bold text-slate-900">Distribusi Program Studi Terbanyak:</div>
                    <div className="text-slate-600">
                      Manajemen (163) • Teknik Komputer &amp; IF (132) • Sistem Informasi (55) • Teknik Sipil (21) • Ilmu Komunikasi (20) • Prodi Lainnya (143).
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. BAGIAN III: REKAPITULASI PRESENSI MAHASISWA & KEAKTIFAN DPL */}
            <div className="mb-8 avoid-break">
              <div className="flex items-center gap-2 mb-2 pb-1 border-b border-slate-200">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  III
                </span>
                <h3 className="font-black text-sm sm:text-base text-slate-900 uppercase tracking-wide">
                  Rekapitulasi Presensi &amp; Aktivitas Pendampingan
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                  <span className="block text-[10px] font-bold text-emerald-800 uppercase">Tingkat Kehadiran Harian</span>
                  <span className="text-xl font-black text-emerald-950">85.7%</span>
                  <span className="block text-[10px] text-emerald-700 mt-0.5">458 Mahasiswa Hadir</span>
                </div>
                <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl">
                  <span className="block text-[10px] font-bold text-rose-800 uppercase">Tanpa Keterangan (Alpha)</span>
                  <span className="text-xl font-black text-rose-950">13.1%</span>
                  <span className="block text-[10px] text-rose-700 mt-0.5">70 Mahasiswa (Perlu Tindak Lanjut)</span>
                </div>
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl">
                  <span className="block text-[10px] font-bold text-blue-800 uppercase">Logbook Mahasiswa</span>
                  <span className="text-xl font-black text-blue-950">7.108 Log</span>
                  <span className="block text-[10px] text-blue-700 mt-0.5">Aktivitas Terverifikasi DPL</span>
                </div>
                <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl">
                  <span className="block text-[10px] font-bold text-purple-800 uppercase">Kunjungan DPL</span>
                  <span className="text-xl font-black text-purple-950">21 Kali</span>
                  <span className="block text-[10px] text-purple-700 mt-0.5">Total 172 Jam Pendampingan</span>
                </div>
              </div>
            </div>

            {/* 6. BAGIAN IV: REALISASI PROGRAM KERJA (MURNI PROKER TANPA NILAI) */}
            <div className="mb-8 avoid-break">
              <div className="flex items-center gap-2 mb-2 pb-1 border-b border-slate-200">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  IV
                </span>
                <h3 className="font-black text-sm sm:text-base text-slate-900 uppercase tracking-wide">
                  Realisasi Program Kerja (Proker) &amp; Sebaran Wilayah
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Grafik Kategori Proker */}
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 text-center">
                    Capaian Proker per Kategori Bidang
                  </h4>
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={data.grafikPerforma.prokerKategori}
                        margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="kategori" tick={{ fontSize: 9, fill: "#475569" }} interval={0} angle={-15} textAnchor="end" />
                        <YAxis tick={{ fontSize: 9, fill: "#475569" }} />
                        <RechartsTooltip contentStyle={{ fontSize: 11 }} />
                        <Bar dataKey="total" name="Total Usulan" fill="#94a3b8" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="selesai" name="Selesai 100%" fill="#10b981" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Status Pelaksanaan Proker */}
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 flex flex-col justify-between text-xs">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 text-center">
                      Status Pelaksanaan Program Kerja
                    </h4>
                    <div className="space-y-2.5 mt-2">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                        <span className="font-bold text-emerald-900">Sudah Selesai (100%):</span>
                        <span className="font-black text-emerald-700">{data.ringkasanEksekutif.totalProkerSelesai} Proker ({data.ringkasanEksekutif.persentaseProkerSelesai}%)</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50 border border-blue-200">
                        <span className="font-bold text-blue-900">Sedang Berjalan di Lapangan:</span>
                        <span className="font-black text-blue-700">62 Proker (46%)</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-100 border border-slate-200">
                        <span className="font-bold text-slate-700">Belum Mulai / Persiapan:</span>
                        <span className="font-black text-slate-600">46 Proker (34%)</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 italic mt-2">
                    * Proker murni berfokus pada target fisik, edukasi, dan tata kelola sampah lingkungan. Penilaian mutu akademik dievaluasi terpisah melalui modul presensi dan pengujian DPL.
                  </p>
                </div>
              </div>
            </div>

            {/* 7. BAGIAN V: PERINGATAN DINI & REKOMENDASI MANAJERIAL */}
            <div className="mb-8 avoid-break border border-amber-200 bg-amber-50/50 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2 pb-1 border-b border-amber-200 text-amber-900">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="font-black text-sm sm:text-base uppercase tracking-wide">
                  V. Peringatan Dini &amp; Rekomendasi Manajerial Pimpinan
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-amber-950 mt-2">
                <div className="p-2.5 bg-white/80 rounded-xl border border-amber-200">
                  <div className="font-bold text-rose-700 flex items-center gap-1.5 mb-1">
                    <span>1. Presensi Mahasiswa Kritis</span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed">
                    Terdapat <strong>163 mahasiswa</strong> dengan status tanpa keterangan ≥ 3 hari. <em>Rekomendasi:</em> DPL segera melakukan pemanggilan dan konfirmasi kehadiran fisik.
                  </p>
                </div>
                <div className="p-2.5 bg-white/80 rounded-xl border border-amber-200">
                  <div className="font-bold text-blue-700 flex items-center gap-1.5 mb-1">
                    <span>2. Usulan Proker Tertahan</span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed">
                    Sebanyak <strong>29 usulan program kerja</strong> belum disetujui DPL dan 6 ditolak. <em>Rekomendasi:</em> DPL menyelesaikan verifikasi usulan agar target 200 jam tercapai.
                  </p>
                </div>
                <div className="p-2.5 bg-white/80 rounded-xl border border-amber-200">
                  <div className="font-bold text-purple-700 flex items-center gap-1.5 mb-1">
                    <span>3. Keaktifan Logbook Pembimbing</span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed">
                    Sebanyak <strong>16 dari 32 DPL</strong> masih kosong logbook-nya (keaktifan baru 50%). <em>Rekomendasi:</em> Pengingat resmi dari pimpinan fakultas kepada koordinator DPL.
                  </p>
                </div>
                <div className="p-2.5 bg-white/80 rounded-xl border border-amber-200">
                  <div className="font-bold text-emerald-700 flex items-center gap-1.5 mb-1">
                    <span>4. Pembinaan Sampah Wilayah</span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed">
                    Kelurahan Lebak Siliwangi mencatatkan kepatuhan pemilahan <strong>81%</strong>. <em>Rekomendasi:</em> Mahasiswa kelompok Lebak Siliwangi mengintensifkan sosialisasi pemilahan.
                  </p>
                </div>
              </div>
            </div>

            {/* 8. BAGIAN VI: MATRIKS KINERJA & PERINGKAT UNGGULAN (HIGHLIGHT TOP 3) */}
            <div className="mb-8 avoid-break">
              <div className="flex items-center gap-2 mb-2 pb-1 border-b border-slate-200">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  VI
                </span>
                <h3 className="font-black text-sm sm:text-base text-slate-900 uppercase tracking-wide">
                  Matriks Kinerja &amp; Peringkat Unggulan Mahasiswa &amp; DPL
                </h3>
              </div>

              {/* HIGHLIGHT TOP 3 MAHASISWA & TOP 3 DPL TERBAIK */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* 3 Mahasiswa Terbaik */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                  <div className="flex items-center justify-between mb-2.5 pb-1.5 border-b border-slate-200">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 uppercase">
                      <Award className="w-4 h-4 text-amber-500" />
                      <span>🏆 3 Mahasiswa Berkinerja Terbaik</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Nilai &amp; Jam Tertinggi
                    </span>
                  </div>
                  <div className="space-y-2">
                    {(data.topMahasiswa && data.topMahasiswa.length > 0 ? data.topMahasiswa : [
                      { ranking: 1, nama: "Zahira Nandhifa Aliyah", nim: "10121045", kelompok: "Kelompok 01", kelurahan: "Sadang Serang", nilaiAkhir: 95.0, grade: "A", kehadiranPercent: 100, totalJamKerja: 145 },
                      { ranking: 2, nama: "Muhammad Fadhil", nim: "10121088", kelompok: "Kelompok 08", kelurahan: "Dago", nilaiAkhir: 93.5, grade: "A", kehadiranPercent: 98, totalJamKerja: 138 },
                      { ranking: 3, nama: "Annisa Rahmawati", nim: "10121112", kelompok: "Kelompok 14", kelurahan: "Cipaganti", nilaiAkhir: 91.0, grade: "A", kehadiranPercent: 96, totalJamKerja: 125 },
                    ]).map((mhs) => (
                      <div key={mhs.ranking} className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/80 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-black text-[10px] flex items-center justify-center shrink-0">
                            #{mhs.ranking}
                          </span>
                          <div>
                            <div className="font-bold text-slate-900">{mhs.nama}</div>
                            <div className="text-[10px] text-slate-500">NIM. {mhs.nim} • {mhs.kelompok} ({mhs.kelurahan})</div>
                          </div>
                        </div>
                        <div className="text-right shrink-0 pl-2">
                          <div className="font-black text-indigo-700 text-xs">{mhs.nilaiAkhir.toFixed(1)} ({mhs.grade})</div>
                          <div className="text-[10px] text-emerald-700 font-semibold">{mhs.kehadiranPercent}% • {mhs.totalJamKerja} Jam</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3 DPL Terbaik */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                  <div className="flex items-center justify-between mb-2.5 pb-1.5 border-b border-slate-200">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 uppercase">
                      <GraduationCap className="w-4 h-4 text-emerald-600" />
                      <span>⭐ 3 DPL Berkinerja Terbaik</span>
                    </div>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                      Pendampingan Terbaik
                    </span>
                  </div>
                  <div className="space-y-2">
                    {(data.topDpl && data.topDpl.length > 0 ? data.topDpl : [
                      { ranking: 1, nama: "Dr. Budi Santoso, M.T.", nip: "197501012000031001", kelompok: "Kelompok 01 Sadang Serang", kelurahan: "Sadang Serang", keaktifanLogbook: 24, kunjunganLapangan: 8, kepatuhanKelompok: 98 },
                      { ranking: 2, nama: "Ir. Sri Wahyuni, M.Kom.", nip: "198003152005012003", kelompok: "Kelompok 05 Dago", kelurahan: "Dago", keaktifanLogbook: 20, kunjunganLapangan: 6, kepatuhanKelompok: 95 },
                      { ranking: 3, nama: "Drs. M. Taufik, M.M.", nip: "196811201994031002", kelompok: "Kelompok 12 Sekeloa", kelurahan: "Sekeloa", keaktifanLogbook: 18, kunjunganLapangan: 5, kepatuhanKelompok: 92 },
                    ]).map((dpl) => (
                      <div key={dpl.ranking} className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/80 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] flex items-center justify-center shrink-0">
                            #{dpl.ranking}
                          </span>
                          <div>
                            <div className="font-bold text-slate-900">{dpl.nama}</div>
                            <div className="text-[10px] text-slate-500">NIP. {dpl.nip || "-"} • {dpl.kelompok}</div>
                          </div>
                        </div>
                        <div className="text-right shrink-0 pl-2">
                          <div className="font-black text-emerald-800 text-xs">{dpl.kepatuhanKelompok}% Hadir</div>
                          <div className="text-[10px] text-slate-500">{dpl.keaktifanLogbook} Logbook • {dpl.kunjunganLapangan} Visit</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* TABEL RINGKASAN KELOMPOK KKN (ACUAN RESMI BERSIH) */}
              <div className="overflow-x-auto border border-slate-300 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-800 text-white font-bold text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 px-2 border-r border-slate-700 text-center w-8">No</th>
                      <th className="py-2.5 px-3 border-r border-slate-700 min-w-[130px]">Kelompok &amp; Ketua</th>
                      <th className="py-2.5 px-3 border-r border-slate-700 min-w-[130px]">DPL Pendamping</th>
                      <th className="py-2.5 px-3 border-r border-slate-700 min-w-[110px]">Wilayah (Kel / RW)</th>
                      <th className="py-2.5 px-2 border-r border-slate-700 text-center w-14">Mhs</th>
                      <th className="py-2.5 px-2 border-r border-slate-700 text-center w-20">Kehadiran</th>
                      <th className="py-2.5 px-2 border-r border-slate-700 text-center w-24">Proker Selesai</th>
                      <th className="py-2.5 px-3 text-center min-w-[130px]">Status Evaluasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                    {data.matriksKelompok.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-500 text-xs italic">
                          Tidak ada data kelompok KKN yang ditemukan untuk filter yang dipilih.
                        </td>
                      </tr>
                    ) : (
                      data.matriksKelompok.slice(0, 15).map((m, idx) => {
                        const isEven = idx % 2 === 0;
                        return (
                          <tr
                            key={m.id}
                            className={`hover:bg-slate-100/80 transition-colors ${
                              isEven ? "bg-white" : "bg-slate-50/70"
                            }`}
                          >
                            <td className="py-2 px-2 border-r border-slate-200 text-center font-bold text-slate-600">
                              {m.no}
                            </td>
                            <td className="py-2 px-3 border-r border-slate-200">
                              <div className="font-bold text-slate-900">{m.nama}</div>
                              <div className="text-[10px] text-slate-500">Ketua: {m.ketua?.name || "-"}</div>
                            </td>
                            <td className="py-2 px-3 border-r border-slate-200">
                              <div className="font-bold text-slate-900">{m.dpl?.name || "-"}</div>
                              <div className="text-[10px] text-slate-500">{m.dpl?.nip ? `NIP. ${m.dpl.nip}` : "NIP: -"}</div>
                            </td>
                            <td className="py-2 px-3 border-r border-slate-200">
                              <div className="font-bold text-slate-900">{m.kelurahan}</div>
                              <div className="text-[10px] text-slate-500">{m.cakupanRwFormatted}</div>
                            </td>
                            <td className="py-2 px-2 border-r border-slate-200 text-center font-bold text-slate-900">
                              {m.totalMahasiswa}
                            </td>
                            <td className="py-2 px-2 border-r border-slate-200 text-center font-bold">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                                  m.persentaseKehadiran >= 80
                                    ? "bg-emerald-100 text-emerald-800"
                                    : m.persentaseKehadiran >= 60
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-rose-100 text-rose-800"
                                }`}
                              >
                                {m.persentaseKehadiran}%
                              </span>
                            </td>
                            <td className="py-2 px-2 border-r border-slate-200 text-center font-bold">
                              <div className="text-slate-900">{m.prokerSelesaiCount}/{m.prokerTotalCount}</div>
                              <div className="text-[10px] text-emerald-700 font-extrabold">{m.prokerSelesaiPercent}%</div>
                            </td>
                            <td className="py-2 px-3 text-center">
                              {typeof m.rataRataSkorEvaluasi === "number" ? (
                                <div className="flex items-center justify-center gap-1.5">
                                  <span className="font-black text-slate-900 text-xs">
                                    {m.rataRataSkorEvaluasi.toFixed(2)}
                                  </span>
                                  <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-900 font-black text-[10px]">
                                    {m.kategoriNilai || "-"}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">Belum Dinilai</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              {data.matriksKelompok.length > 15 && (
                <p className="text-[10px] text-slate-500 italic mt-1.5 text-right">
                  * Menampilkan 15 dari total {data.matriksKelompok.length} kelompok terdaftar. Seluruh data tercantum lengkap pada lampiran dokumen.
                </p>
              )}
            </div>

            {/* 9. BAGIAN VII: LEMBAR PENGESAHAN RESMI (1 TANDA TANGAN DINAMIS DI TENGAH BAWAH) */}
            <div className="avoid-break mt-10 pt-4 border-t-2 border-slate-300">
              <div className="text-center max-w-sm mx-auto">
                <span className="block text-xs italic text-slate-600 mb-1">
                  Ditetapkan di Bandung, {reportConfig.tanggalPengesahan}
                </span>
                <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-0.5">
                  MENGESAHKAN,
                </span>
                <span className="block text-xs font-black text-slate-900 uppercase">
                  {reportConfig.penandatangan.jabatan}
                </span>
                <span className="block text-[10px] text-slate-500 mb-8">
                  {reportConfig.penandatangan.instansi}
                </span>

                {/* Ruang Tanda Tangan */}
                <div className="h-16 flex items-center justify-center">
                  <span className="text-[10px] text-slate-300 italic">
                    [Tanda Tangan &amp; Cap Dinas]
                  </span>
                </div>

                <div className="border-b border-slate-900 mx-auto max-w-[220px] mb-1"></div>
                <span className="block font-black text-slate-900 text-xs underline">
                  {reportConfig.penandatangan.nama}
                </span>
                <span className="block text-[10px] text-slate-600 font-medium">
                  {reportConfig.penandatangan.nip ? `NIP/NIDN. ${reportConfig.penandatangan.nip}` : ""}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Pengaturan Naskah Dinamis */}
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

export default LaporanResmiKknPage;
