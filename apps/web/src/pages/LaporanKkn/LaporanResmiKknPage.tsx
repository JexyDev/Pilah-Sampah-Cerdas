/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Laporan Resmi KKN UNIKOM untuk Role Pimpinan
 * Format Dokumen Formal A4 Eksekutif UNIKOM x BERSEKA
 * 100% Real-time Data dari Database PostgreSQL
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Printer,
  Download,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  Building2,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  Award,
  Layers,
  MapPin,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  Filter,
  SlidersHorizontal,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";
import api from "../../services/api";
import showToast from "../../utils/showToast";

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
      lppm: string;
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

export const LaporanResmiKknPage: React.FC = () => {
  const [data, setData] = useState<LaporanSummaryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [downloadingXlsx, setDownloadingXlsx] = useState<boolean>(false);
  const [downloadingCsv, setDownloadingCsv] = useState<boolean>(false);

  // Filter States
  const [selectedKelurahan, setSelectedKelurahan] = useState<string>("Semua Kelurahan");
  const [selectedRw, setSelectedRw] = useState<string>("");
  const [selectedKelompok, setSelectedKelompok] = useState<string>("");

  // Print Orientation State: landscape by default (optimal for 9-column matrix)
  const [printOrientation, setPrintOrientation] = useState<"landscape" | "portrait">("landscape");

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
  }, [selectedKelurahan, selectedRw, selectedKelompok]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = async () => {
    try {
      setDownloadingXlsx(true);
      const params = new URLSearchParams();
      if (selectedKelurahan && selectedKelurahan !== "Semua Kelurahan") {
        params.append("kelurahan", selectedKelurahan);
      }
      if (selectedRw) params.append("rw", selectedRw);
      if (selectedKelompok) params.append("kelompok", selectedKelompok);

      const response = await api.get(`/laporan/kkn/export?${params.toString()}`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Laporan_Resmi_KKN_UNIKOM_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast.success("Spreadsheet Excel laporan resmi KKN berhasil diunduh");
    } catch (err) {
      console.error("Export Excel error:", err);
      showToast.error("Gagal mengunduh file spreadsheet Excel laporan");
    } finally {
      setDownloadingXlsx(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      setDownloadingCsv(true);
      const params = new URLSearchParams();
      if (selectedKelurahan && selectedKelurahan !== "Semua Kelurahan") {
        params.append("kelurahan", selectedKelurahan);
      }
      if (selectedRw) params.append("rw", selectedRw);
      if (selectedKelompok) params.append("kelompok", selectedKelompok);

      const response = await api.get(`/laporan/kkn/export-csv?${params.toString()}`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Matriks_Kinerja_KKN_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast.success("File CSV matriks kinerja KKN berhasil diunduh");
    } catch (err) {
      console.error("Export CSV error:", err);
      showToast.error("Gagal mengunduh file CSV");
    } finally {
      setDownloadingCsv(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-800 dark:text-slate-100 pb-16">
      {/* Dynamic Print Orientation Style Injection */}
      <style>{`
        @media print {
          @page {
            size: A4 ${printOrientation};
            margin: 10mm 10mm 10mm 10mm;
          }
          body {
            background: #ffffff !important;
            color: #0f172a !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Sembunyikan elemen navigasi dan tombol web */
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
          /* Wadah Dokumen Kertas Formal */
          .document-paper {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            background: transparent !important;
          }
          /* Hindari perpotongan halaman pada tabel dan pengesahan */
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
      <div className="no-print sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Akses Khusus: Pimpinan • Super User • Developer</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <span>Laporan Resmi KKN UNIKOM</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                Dokumen Eksekutif Formal
              </span>
            </h1>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Toggle Orientasi Cetak */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setPrintOrientation("landscape")}
                className={`px-2.5 py-1.5 rounded-md transition-all ${
                  printOrientation === "landscape"
                    ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
                title="Format Landscape (Optimal untuk Tabel 9 Kolom)"
              >
                A4 Landscape
              </button>
              <button
                type="button"
                onClick={() => setPrintOrientation("portrait")}
                className={`px-2.5 py-1.5 rounded-md transition-all ${
                  printOrientation === "portrait"
                    ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
                title="Format Portrait (Standar Vertikal)"
              >
                A4 Portrait
              </button>
            </div>

            {/* Tombol Cetak PDF */}
            <button
              type="button"
              onClick={handlePrint}
              disabled={loading || !data}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-sm hover:shadow transition-all disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>

            {/* Tombol Ekspor Excel */}
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={downloadingXlsx || loading || !data}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs shadow-sm hover:shadow transition-all disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{downloadingXlsx ? "Mengunduh..." : "Ekspor Excel"}</span>
            </button>

            {/* Tombol Ekspor CSV */}
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={downloadingCsv || loading || !data}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs shadow-sm hover:shadow transition-all disabled:opacity-50"
              title="Unduh Data Mentah CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>

            {/* Refresh */}
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

        {/* Dynamic Filter Bar (No-Print) */}
        <div className="max-w-7xl mx-auto mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Wilayah:</span>
          </div>

          {/* Kelurahan Dropdown */}
          <select
            value={selectedKelurahan}
            onChange={(e) => setSelectedKelurahan(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-2.5 py-1.5 font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="Semua Kelurahan">Seluruh Kelurahan (Coblong)</option>
            <option value="Cipaganti">Kel. Cipaganti</option>
            <option value="Dago">Kel. Dago</option>
            <option value="Lebakgede">Kel. Lebak Gede</option>
            <option value="Lebak Siliwangi">Kel. Lebak Siliwangi</option>
            <option value="Sadang Serang">Kel. Sadang Serang</option>
            <option value="Sekeloa">Kel. Sekeloa</option>
          </select>

          {/* Filter RW */}
          <input
            type="text"
            placeholder="Cari RW (contoh: 01)"
            value={selectedRw}
            onChange={(e) => setSelectedRw(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-2.5 py-1.5 font-medium text-slate-700 dark:text-slate-200 w-32 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />

          {/* Filter Kelompok */}
          <input
            type="text"
            placeholder="Cari Nama Kelompok..."
            value={selectedKelompok}
            onChange={(e) => setSelectedKelompok(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-2.5 py-1.5 font-medium text-slate-700 dark:text-slate-200 w-44 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />

          {(selectedKelurahan !== "Semua Kelurahan" || selectedRw || selectedKelompok) && (
            <button
              type="button"
              onClick={() => {
                setSelectedKelurahan("Semua Kelurahan");
                setSelectedRw("");
                setSelectedKelompok("");
              }}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
            >
              Reset Filter
            </button>
          )}

          <div className="ml-auto text-xs text-slate-400 dark:text-slate-500 font-medium">
            Status Data: <span className="font-bold text-emerald-600">100% Real PostgreSQL</span>
          </div>
        </div>
      </div>

      {/* MAIN DOCUMENT WRAPPER (FORMAL A4 PAPER CONTAINER) */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 mt-6">
        {loading && !data ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center shadow-sm border border-slate-200 dark:border-slate-800">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-3" />
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">
              Menyiapkan Data Laporan Resmi KKN...
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Mengumpulkan data mahasiswa, kehadiran, program kerja, dan nilai dari database.
            </p>
          </div>
        ) : !data ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center shadow-sm border border-slate-200 dark:border-slate-800">
            <p className="text-sm font-semibold text-rose-600">Data laporan tidak dapat dimuat.</p>
          </div>
        ) : (
          <div
            ref={documentRef}
            className="document-paper bg-white text-slate-900 shadow-xl rounded-2xl sm:p-10 p-6 border border-slate-200/80 transition-all font-sans"
          >
            {/* 1. KOP SURAT RESMI UNIKOM x BERSEKA */}
            <div className="pb-5 border-b-[4px] border-double border-slate-950 mb-6">
              <div className="flex items-center justify-between gap-4">
                {/* Logo BERSEKA (Kiri) */}
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

                {/* Teks Lembaga & Instansi (Tengah) */}
                <div className="text-center flex-1 px-2">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700">
                    UNIVERSITAS KOMPUTER INDONESIA (UNIKOM)
                  </h3>
                  <h2 className="text-sm sm:text-lg font-black uppercase tracking-tight text-slate-950 mt-0.5">
                    LEMBAGA PENELITIAN DAN PENGABDIAN KEPADA MASYARAKAT (LPPM)
                  </h2>
                  <h4 className="text-xs sm:text-sm font-bold text-emerald-800 uppercase mt-0.5 tracking-wide">
                    TASK FORCE KKN TEMATIK PENGELOLAAN SAMPAH MANDIRI "BERSEKA"
                  </h4>
                  <p className="text-[10px] sm:text-xs text-slate-600 mt-1 leading-snug">
                    Jl. Dipati Ukur No. 112-116, Lebak Gede, Coblong, Kota Bandung, Jawa Barat 40132
                    <br />
                    Laman Resmi:{" "}
                    <span className="font-semibold text-slate-800">https://berseka.id</span> • Pos-el:{" "}
                    <span className="font-semibold text-slate-800">lppm@email.unikom.ac.id</span>
                  </p>
                </div>

                {/* Logo UNIKOM (Kanan) */}
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
              </div>
            </div>

            {/* 2. JUDUL DOKUMEN & KOTAK METADATA RESMI */}
            <div className="text-center mb-6">
              <h2 className="text-base sm:text-xl font-black uppercase tracking-tight text-slate-950 underline decoration-slate-900 decoration-2 underline-offset-4">
                {data.header.judulLaporan}
              </h2>
              <p className="text-xs sm:text-sm font-bold text-slate-700 uppercase mt-1">
                {data.header.subjudul}
              </p>

              {/* Metadata Grid */}
              <div className="mt-4 bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-left">
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Nomor Dokumen:
                  </span>
                  <span className="font-bold text-slate-900">{data.header.nomorDokumen}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Periode Kegiatan:
                  </span>
                  <span className="font-bold text-slate-900">{data.header.periode}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Wilayah Evaluasi:
                  </span>
                  <span className="font-bold text-slate-900">{data.header.wilayahCakupan}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Tanggal Pengesahan:
                  </span>
                  <span className="font-bold text-slate-900">{data.header.tanggalCetakFormatted}</span>
                </div>
              </div>
            </div>

            {/* 3. BAGIAN I: RINGKASAN EKSEKUTIF (5 PILAR UTAMA KPI) */}
            <div className="mb-8 avoid-break">
              <div className="flex items-center gap-2 mb-3 pb-1 border-b border-slate-200">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  I
                </span>
                <h3 className="font-black text-sm sm:text-base text-slate-900 uppercase tracking-wide">
                  Ringkasan Eksekutif & Indikator Kinerja Utama (KPI)
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {/* 1. Mahasiswa */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-emerald-700 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Mahasiswa Aktif
                    </span>
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-slate-900">
                      {data.ringkasanEksekutif.totalMahasiswaAktif}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Tersebar di {data.ringkasanEksekutif.totalKelompok} Kelompok
                    </div>
                  </div>
                </div>

                {/* 2. Kelompok */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-blue-700 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Kelompok Tersebar
                    </span>
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-slate-900">
                      {data.ringkasanEksekutif.totalKelompok}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Didampingi {data.ringkasanEksekutif.totalDpl} DPL
                    </div>
                  </div>
                </div>

                {/* 3. Kepatuhan Presensi */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-amber-700 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Rerata Kehadiran
                    </span>
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-slate-900">
                      {data.ringkasanEksekutif.kepatuhanPresensiPercent}%
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Kepatuhan Presensi Lapangan
                    </div>
                  </div>
                </div>

                {/* 4. Realisasi Proker */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-purple-700 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Realisasi Proker
                    </span>
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-slate-900">
                      {data.ringkasanEksekutif.persentaseProkerSelesai}%
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {data.ringkasanEksekutif.totalProkerSelesai} dari {data.ringkasanEksekutif.totalProkerDisetujui} Proker
                    </div>
                  </div>
                </div>

                {/* 5. Jam Kontribusi */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between col-span-2 sm:col-span-1">
                  <div className="flex items-center justify-between text-rose-700 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Jam Kontribusi
                    </span>
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-slate-900">
                      {data.ringkasanEksekutif.totalJamKontribusi.toLocaleString("id-ID")}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Rata-rata {data.ringkasanEksekutif.rataRataJamPerMahasiswa} Jam / Mhs
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. BAGIAN II: GRAFIK & ANALISIS PERFORMA (AVOID BREAK PADA PRINT) */}
            <div className="mb-8 avoid-break">
              <div className="flex items-center gap-2 mb-3 pb-1 border-b border-slate-200">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  II
                </span>
                <h3 className="font-black text-sm sm:text-base text-slate-900 uppercase tracking-wide">
                  Visualisasi Performa Program Kerja & Sebaran Wilayah
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Grafik 1: Kategori Program Kerja */}
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 text-center">
                    Capaian Proker per Kategori
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
                        <Bar dataKey="total" name="Total Proker" fill="#94a3b8" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="selesai" name="Selesai" fill="#10b981" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Grafik 2: Sebaran Mahasiswa per Kelurahan */}
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 text-center">
                    Sebaran Mahasiswa per Kelurahan
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

                {/* Grafik 3: Distribusi Nilai Mahasiswa */}
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 col-span-1 md:col-span-2 lg:col-span-1">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 text-center">
                    Distribusi Grade Nilai Evaluasi
                  </h4>
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={data.grafikPerforma.distribusiNilaiEvaluasi}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="grade" tick={{ fontSize: 10, fill: "#475569" }} />
                        <YAxis tick={{ fontSize: 10, fill: "#475569" }} />
                        <RechartsTooltip contentStyle={{ fontSize: 11 }} />
                        <Bar dataKey="count" name="Jumlah Mahasiswa" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. BAGIAN III: MATRIKS KINERJA PER KELOMPOK KKN (TABEL RESMI 9 KOLOM) */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3 pb-1 border-b border-slate-200">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  III
                </span>
                <h3 className="font-black text-sm sm:text-base text-slate-900 uppercase tracking-wide">
                  Matriks Kinerja per Kelompok KKN (35 Kelompok Coblong)
                </h3>
              </div>

              <div className="overflow-x-auto border border-slate-300 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-800 text-white font-bold text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 px-2 border-r border-slate-700 text-center w-8">No</th>
                      <th className="py-2.5 px-3 border-r border-slate-700 min-w-[130px]">Kelompok & Ketua</th>
                      <th className="py-2.5 px-3 border-r border-slate-700 min-w-[130px]">Dosen Pembimbing (DPL)</th>
                      <th className="py-2.5 px-3 border-r border-slate-700 min-w-[110px]">Wilayah (Kel / RW)</th>
                      <th className="py-2.5 px-3 border-r border-slate-700 min-w-[130px]">Posko KKN</th>
                      <th className="py-2.5 px-2 border-r border-slate-700 text-center w-14">Mhs</th>
                      <th className="py-2.5 px-2 border-r border-slate-700 text-center w-20">Kehadiran</th>
                      <th className="py-2.5 px-2 border-r border-slate-700 text-center w-24">Proker Selesai</th>
                      <th className="py-2.5 px-3 text-center min-w-[140px]">Skor Evaluasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                    {data.matriksKelompok.map((m, idx) => {
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
                            <div className="text-[10px] text-slate-500">
                              Ketua: {m.ketua?.name || "-"}
                            </div>
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200">
                            <div className="font-bold text-slate-900">{m.dpl?.name || "-"}</div>
                            <div className="text-[10px] text-slate-500">
                              {m.dpl?.nip ? `NIP. ${m.dpl.nip}` : "NIP: -"}
                            </div>
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200">
                            <div className="font-bold text-slate-900">{m.kelurahan}</div>
                            <div className="text-[10px] text-slate-500">{m.cakupanRwFormatted}</div>
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200">
                            <div className="font-semibold text-slate-800">{m.posko?.nama || "-"}</div>
                            <div className="text-[10px] text-slate-500 truncate max-w-[140px]">
                              {m.posko?.alamat || "-"}
                            </div>
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
                            <div className="text-slate-900">
                              {m.prokerSelesaiCount}/{m.prokerTotalCount}
                            </div>
                            <div className="text-[10px] text-emerald-700 font-extrabold">
                              {m.prokerSelesaiPercent}%
                            </div>
                          </td>
                          <td className="py-2 px-3 text-center">
                            {m.rataRataSkorEvaluasi !== null ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <span className="font-black text-slate-900 text-xs">
                                  {m.rataRataSkorEvaluasi.toFixed(2)}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-900 font-black text-[10px]">
                                  {m.kategoriNilai}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  ({m.jumlahMhsDinilai}/{m.totalMahasiswa})
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">
                                Belum Dinilai
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {/* Footer Ringkasan Matriks */}
                  <tfoot>
                    <tr className="bg-slate-200/90 font-black text-slate-900 text-[11px] border-t-2 border-slate-400">
                      <td colSpan={5} className="py-2.5 px-3 text-right uppercase tracking-wider">
                        Rata-rata / Total Wilayah Coblong:
                      </td>
                      <td className="py-2.5 px-2 text-center text-xs">
                        {data.ringkasanEksekutif.totalMahasiswaAktif}
                      </td>
                      <td className="py-2.5 px-2 text-center text-xs text-emerald-800">
                        {data.ringkasanEksekutif.kepatuhanPresensiPercent}%
                      </td>
                      <td className="py-2.5 px-2 text-center text-xs text-purple-800">
                        {data.ringkasanEksekutif.totalProkerSelesai}/{data.ringkasanEksekutif.totalProkerDisetujui} ({data.ringkasanEksekutif.persentaseProkerSelesai}%)
                      </td>
                      <td className="py-2.5 px-3 text-center text-xs text-slate-700">
                        Evaluasi Resmi Terlampir
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* 6. BAGIAN IV: LEMBAR PENGESAHAN RESMI (3 KOLOM TANDA TANGAN) */}
            <div className="avoid-break mt-10 pt-4 border-t-2 border-slate-300">
              <div className="flex justify-end mb-4 text-xs font-semibold text-slate-700">
                <span>{data.lembarPengesahan.tempat}, {data.lembarPengesahan.tanggal}</span>
              </div>

              <div className="grid grid-cols-3 gap-6 text-center text-xs">
                {data.lembarPengesahan.pejabat.map((p, idx) => (
                  <div key={idx} className="flex flex-col justify-between h-44">
                    <div>
                      <span className="block font-medium text-slate-600">{p.peran}</span>
                      <span className="block font-black text-slate-900 uppercase text-[11px] tracking-wide mt-0.5">
                        {p.jabatan}
                      </span>
                      <span className="block text-[10px] text-slate-500">{p.instansi}</span>
                    </div>

                    <div className="mt-auto">
                      <div className="h-14 flex items-center justify-center">
                        {/* Ruang Cap Dinas & Tanda Tangan */}
                        <span className="text-[10px] text-slate-300 italic">
                          [Tanda Tangan & Cap Dinas]
                        </span>
                      </div>
                      <div className="border-b border-slate-900 mx-auto max-w-[200px] mb-1"></div>
                      <span className="block font-black text-slate-900 text-xs">
                        {p.nama}
                      </span>
                      <span className="block text-[10px] text-slate-600 font-medium">
                        {p.nip}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LaporanResmiKknPage;
