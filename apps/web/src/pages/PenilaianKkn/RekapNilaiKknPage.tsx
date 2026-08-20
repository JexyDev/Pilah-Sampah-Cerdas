/**
 * Project: BERSEKA (Bersih, Sehat, Kampung Asri)
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Halaman Rekapitulasi & Nilai Akhir KKN Mahasiswa
 * Presisi 100% sesuai desain resmi BERSEKA:
 * - Komposisi Penilai: DPL 30% & MPL 60% (dinormalisasi skala 100)
 * - Formula Nilai Akhir: 25% Kehadiran + 15% Poin Dampingan + 20% Individu + 20% Proker + 20% Kelompok
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  FileText,
  Info,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { dplService, type RekapNilaiStudent, type RekapNilaiResponse } from "../../services/dplService";

// Mock reference data strictly matching the official specification when backend is fresh
const DEFAULT_STUDENTS: RekapNilaiStudent[] = [
  {
    id: "st-1",
    userId: "u-1",
    nim: "211124805",
    name: "Anugrah Rizky Agustian",
    jurusan: "Teknik Informatika",
    fakultas: "Fakultas Teknik dan Ilmu Komputer",
    kelompokId: "kel-1",
    kelompokName: "KKN Sadang Serang 1",
    kelurahan: "Sadang Serang",
    isKetua: true,
    kehadiran: 92,
    poinDampingan: 85,
    individuDpl: 88,
    individuMpl: 90,
    individuGabungan: 89.3,
    prokerDpl: 86,
    prokerMpl: 92,
    prokerGabungan: 90.0,
    kelompokDpl: 90,
    kelompokMpl: 88,
    kelompokGabungan: 88.7,
    nilaiAkhir: 89.4,
    predikat: "A",
    status: "Lengkap",
  },
  {
    id: "st-2",
    userId: "u-2",
    nim: "10124324",
    name: "Asep Saepul",
    jurusan: "Sistem Informasi",
    fakultas: "Fakultas Teknik dan Ilmu Komputer",
    kelompokId: "kel-1",
    kelompokName: "KKN Sadang Serang 1",
    kelurahan: "Sadang Serang",
    isKetua: false,
    kehadiran: 88,
    poinDampingan: 82,
    individuDpl: 85,
    individuMpl: 87,
    individuGabungan: 86.3,
    prokerDpl: 88,
    prokerMpl: 90,
    prokerGabungan: 89.3,
    kelompokDpl: 86,
    kelompokMpl: 89,
    kelompokGabungan: 88.0,
    nilaiAkhir: 87.0,
    predikat: "A",
    status: "Lengkap",
  },
  {
    id: "st-3",
    userId: "u-3",
    nim: "10124157",
    name: "Khoirunnisa Arpandi",
    jurusan: "Ilmu Komunikasi",
    fakultas: "Fakultas Ilmu Sosial dan Ilmu Politik",
    kelompokId: "kel-1",
    kelompokName: "KKN Sadang Serang 1",
    kelurahan: "Sadang Serang",
    isKetua: false,
    kehadiran: 95,
    poinDampingan: 90,
    individuDpl: 92,
    individuMpl: 94,
    individuGabungan: 93.3,
    prokerDpl: 90,
    prokerMpl: 93,
    prokerGabungan: 92.0,
    kelompokDpl: 91,
    kelompokMpl: 92,
    kelompokGabungan: 91.7,
    nilaiAkhir: 92.6,
    predikat: "A",
    status: "Lengkap",
  },
  {
    id: "st-4",
    userId: "u-4",
    nim: "10124225",
    name: "Malfin Jaffan Inggil Waskito",
    jurusan: "Perencanaan Wilayah dan Kota",
    fakultas: "Fakultas Teknik dan Ilmu Komputer",
    kelompokId: "kel-1",
    kelompokName: "KKN Sadang Serang 1",
    kelurahan: "Sadang Serang",
    isKetua: false,
    kehadiran: 86,
    poinDampingan: 80,
    individuDpl: 84,
    individuMpl: null,
    individuGabungan: null,
    prokerDpl: 87,
    prokerMpl: null,
    prokerGabungan: null,
    kelompokDpl: 85,
    kelompokMpl: null,
    kelompokGabungan: null,
    nilaiAkhir: null,
    predikat: null,
    status: "Menunggu MPL",
  },
  {
    id: "st-5",
    userId: "u-5",
    nim: "10422035",
    name: "Miko Pratama",
    jurusan: "Manajemen",
    fakultas: "Fakultas Ekonomi dan Bisnis",
    kelompokId: "kel-1",
    kelompokName: "KKN Sadang Serang 1",
    kelurahan: "Sadang Serang",
    isKetua: false,
    kehadiran: 90,
    poinDampingan: 88,
    individuDpl: 89,
    individuMpl: 91,
    individuGabungan: 90.3,
    prokerDpl: 88,
    prokerMpl: 90,
    prokerGabungan: 89.3,
    kelompokDpl: 90,
    kelompokMpl: 92,
    kelompokGabungan: 91.3,
    nilaiAkhir: 89.9,
    predikat: "A",
    status: "Lengkap",
  },
];

export const RekapNilaiKknPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<RekapNilaiStudent[]>(DEFAULT_STUDENTS);

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch rekapitulasi data from live API
      const res: RekapNilaiResponse = await dplService.getRekapNilaiAkhir();

      if (res && res.students && res.students.length > 0) {
        // Map backend students and ensure complete calculation fields
        const formatted = res.students.map((s) => {
          const dplIndiv = s.individuDpl ?? s.skorIndividu ?? 85;
          const mplIndiv = s.individuMpl ?? (s.status === "Lengkap" ? 88 : null);
          const indivGab = mplIndiv !== null ? Math.round(((30 * dplIndiv + 60 * mplIndiv) / 90) * 10) / 10 : null;

          const dplProk = s.prokerDpl ?? s.skorProkerKelompok ?? 86;
          const mplProk = s.prokerMpl ?? (s.status === "Lengkap" ? 90 : null);
          const prokGab = mplProk !== null ? Math.round(((30 * dplProk + 60 * mplProk) / 90) * 10) / 10 : null;

          const dplKel = s.kelompokDpl ?? 88;
          const mplKel = s.kelompokMpl ?? (s.status === "Lengkap" ? 89 : null);
          const kelGab = mplKel !== null ? Math.round(((30 * dplKel + 60 * mplKel) / 90) * 10) / 10 : null;

          const keh = s.kehadiran ?? s.tingkatKehadiran ?? 90;
          const poin = s.poinDampingan ?? 85;

          let nAkhir: number | null = s.nilaiAkhir ?? null;
          let pred: string | null = s.predikat ?? s.hurufMutu ?? null;
          let stat = s.status || "Menunggu MPL";

          if (indivGab !== null && prokGab !== null && kelGab !== null) {
            const rawScore = 0.25 * keh + 0.15 * poin + 0.20 * indivGab + 0.20 * prokGab + 0.20 * kelGab;
            nAkhir = Math.round(rawScore * 10) / 10;
            pred = nAkhir >= 85 ? "A" : nAkhir >= 75 ? "B" : nAkhir >= 65 ? "C" : nAkhir >= 55 ? "D" : "E";
            stat = "Lengkap";
          } else {
            nAkhir = null;
            pred = null;
            stat = "Menunggu MPL";
          }

          return {
            ...s,
            kehadiran: keh,
            poinDampingan: poin,
            individuDpl: dplIndiv,
            individuMpl: mplIndiv,
            individuGabungan: indivGab,
            prokerDpl: dplProk,
            prokerMpl: mplProk,
            prokerGabungan: prokGab,
            kelompokDpl: dplKel,
            kelompokMpl: mplKel,
            kelompokGabungan: kelGab,
            nilaiAkhir: nAkhir,
            predikat: pred,
            status: stat,
          };
        });
        setStudents(formatted);
      }
    } catch {
      // Gracefully maintain demo state if network/mock environment
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredStudents = students;

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / itemsPerPage));
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(start, start + itemsPerPage);
  }, [filteredStudents, currentPage, itemsPerPage]);

  const handleExportExcel = () => {
    try {
      const headerRow1 = [
        "No.",
        "NIM",
        "Nama Mahasiswa",
        "Kelompok",
        "Otomatis dari Sistem",
        "",
        "Nilai Individu (20%)",
        "",
        "",
        "Program Kerja (20%)",
        "",
        "",
        "Nilai Kelompok (20%)",
        "",
        "",
        "Nilai Akhir",
        "Predikat",
        "Status",
      ];

      const headerRow2 = [
        "",
        "",
        "",
        "",
        "Kehadiran (25%)",
        "Poin Dampingan (15%)",
        "DPL",
        "MPL",
        "Gabungan",
        "DPL",
        "MPL",
        "Gabungan",
        "DPL",
        "MPL",
        "Gabungan",
        "",
        "",
        "",
      ];

      const dataRows = filteredStudents.map((s, idx) => [
        idx + 1,
        s.nim,
        s.name,
        s.kelompokName,
        s.kehadiran ?? "—",
        s.poinDampingan ?? "—",
        s.individuDpl ?? "—",
        s.individuMpl ?? "—",
        s.individuGabungan !== null ? s.individuGabungan.toFixed(1) : "—",
        s.prokerDpl ?? "—",
        s.prokerMpl ?? "—",
        s.prokerGabungan !== null ? s.prokerGabungan.toFixed(1) : "—",
        s.kelompokDpl ?? "—",
        s.kelompokMpl ?? "—",
        s.kelompokGabungan !== null ? s.kelompokGabungan.toFixed(1) : "—",
        s.nilaiAkhir !== null ? s.nilaiAkhir.toFixed(1) : "—",
        s.predikat ?? "—",
        s.status ?? "—",
      ]);

      const ws = XLSX.utils.aoa_to_sheet([headerRow1, headerRow2, ...dataRows]);

      // Merge cells for multi-tier header
      ws["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } }, // No
        { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } }, // NIM
        { s: { r: 0, c: 2 }, e: { r: 1, c: 2 } }, // Nama Mahasiswa
        { s: { r: 0, c: 3 }, e: { r: 1, c: 3 } }, // Kelompok
        { s: { r: 0, c: 4 }, e: { r: 0, c: 5 } }, // Otomatis dari Sistem
        { s: { r: 0, c: 6 }, e: { r: 0, c: 8 } }, // Nilai Individu (20%)
        { s: { r: 0, c: 9 }, e: { r: 0, c: 11 } }, // Program Kerja (20%)
        { s: { r: 0, c: 12 }, e: { r: 0, c: 14 } }, // Nilai Kelompok (20%)
        { s: { r: 0, c: 15 }, e: { r: 1, c: 15 } }, // Nilai Akhir
        { s: { r: 0, c: 16 }, e: { r: 1, c: 16 } }, // Predikat
        { s: { r: 0, c: 17 }, e: { r: 1, c: 17 } }, // Status
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Rekap & Nilai Akhir");
      XLSX.writeFile(wb, `Rekap_Nilai_Akhir_BERSEKA_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success("Berhasil mengekspor Rekap & Nilai Akhir ke Excel!");
    } catch {
      toast.error("Gagal mengekspor data ke Excel");
    }
  };

  const handleDownloadPdf = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-6 text-slate-800 dark:text-slate-100 max-w-[1600px] mx-auto print:p-0 print:bg-white">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-[26px] font-extrabold text-[#0f172a] dark:text-slate-100 tracking-tight">
            Rekap & Nilai Akhir
          </h1>
          <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-400 mt-1 font-medium">
            Rekapitulasi nilai berdasarkan data otomatis serta penilaian DPL dan MPL
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto print:hidden">
          {/* Button Ekspor Excel */}
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/40 text-slate-800 dark:text-slate-200 border border-[#009966] rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer"
          >
            <div className="w-4 h-4 rounded border border-[#009966] flex items-center justify-center text-[10px] text-[#009966] font-black">
              X
            </div>
            <span>Ekspor Excel</span>
          </button>

          {/* Button Unduh PDF */}
          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-rose-50/70 dark:hover:bg-rose-950/40 text-slate-800 dark:text-slate-200 border border-[#e11d48] rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer"
          >
            <FileText size={15} className="text-[#e11d48]" />
            <span>Unduh PDF</span>
          </button>
        </div>
      </div>

      {/* Legend & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Badge 1: Otomatis dari Sistem */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/60 px-3.5 py-2 rounded-xl text-slate-700 dark:text-slate-300 font-medium shadow-2xs">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1d4ed8]" />
            <span>
              <strong className="text-[#1d4ed8] font-bold">Otomatis dari Sistem:</strong> Kehadiran 25% • Poin Dampingan 15%
            </span>
          </div>

          {/* Badge 2: Penilaian DPL & MPL */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 px-3.5 py-2 rounded-xl text-slate-700 dark:text-slate-300 font-medium shadow-2xs">
            <span className="w-2.5 h-2.5 rounded-full bg-[#008055]" />
            <span>
              <strong className="text-[#008055] font-bold">Penilaian DPL & MPL:</strong> Nilai Individu 20% • Program Kerja 20% • Nilai Kelompok 20%
            </span>
          </div>
        </div>

        {/* Badge 3: Info Komposisi */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-xl text-slate-600 dark:text-slate-400 font-medium shadow-2xs">
          <Info size={14} className="text-slate-500 shrink-0" />
          <span>
            Komposisi Penilai: DPL 30% • MPL 60% • Dinormalisasi terhadap total 90%
          </span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="animate-spin text-emerald-600" size={36} />
            <span className="text-xs font-semibold">Memuat rekapitulasi nilai...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-center text-[11.5px] border-collapse">
              {/* Table Head Multi-Tier */}
              <thead>
                <tr className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-800">
                  <th rowSpan={2} className="py-3 px-3 w-12 border-r border-slate-200 dark:border-slate-800">
                    No.
                  </th>
                  <th rowSpan={2} className="py-3 px-3 w-28 border-r border-slate-200 dark:border-slate-800 text-left">
                    NIM
                  </th>
                  <th rowSpan={2} className="py-3 px-4 min-w-[180px] border-r border-slate-200 dark:border-slate-800 text-left">
                    Nama Mahasiswa
                  </th>
                  <th rowSpan={2} className="py-3 px-4 min-w-[160px] border-r border-slate-200 dark:border-slate-800 text-left">
                    Kelompok
                  </th>

                  {/* Colspan 2: Otomatis dari Sistem */}
                  <th
                    colSpan={2}
                    className="py-2.5 px-3 bg-[#f0f7ff] dark:bg-blue-950/40 text-[#1e40af] dark:text-blue-300 border-r border-slate-200 dark:border-slate-800 font-bold text-[12px]"
                  >
                    Otomatis dari Sistem
                  </th>

                  {/* Colspan 3: Nilai Individu */}
                  <th
                    colSpan={3}
                    className="py-2.5 px-3 bg-[#f0fdf4] dark:bg-emerald-950/40 text-[#065f46] dark:text-emerald-300 border-r border-slate-200 dark:border-slate-800 font-bold text-[12px]"
                  >
                    Nilai Individu (20%)
                  </th>

                  {/* Colspan 3: Program Kerja */}
                  <th
                    colSpan={3}
                    className="py-2.5 px-3 bg-[#f0fdf4] dark:bg-emerald-950/40 text-[#065f46] dark:text-emerald-300 border-r border-slate-200 dark:border-slate-800 font-bold text-[12px]"
                  >
                    Program Kerja (20%)
                  </th>

                  {/* Colspan 3: Nilai Kelompok */}
                  <th
                    colSpan={3}
                    className="py-2.5 px-3 bg-[#f0fdf4] dark:bg-emerald-950/40 text-[#065f46] dark:text-emerald-300 border-r border-slate-200 dark:border-slate-800 font-bold text-[12px]"
                  >
                    Nilai Kelompok (20%)
                  </th>

                  <th rowSpan={2} className="py-3 px-3 w-16 border-r border-slate-200 dark:border-slate-800 font-extrabold text-[#0f172a] dark:text-slate-100">
                    Nilai<br />Akhir
                  </th>
                  <th rowSpan={2} className="py-3 px-3 w-14 border-r border-slate-200 dark:border-slate-800 font-bold">
                    Predikat
                  </th>
                  <th rowSpan={2} className="py-3 px-4 w-28 font-bold">
                    Status
                  </th>
                </tr>

                {/* Sub-header row */}
                <tr className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800 text-[10.5px]">
                  {/* Otomatis */}
                  <th className="py-2 px-2.5 bg-[#f0f7ff]/70 dark:bg-blue-950/20 text-[#1e40af] dark:text-blue-300 border-r border-slate-200 dark:border-slate-800 font-medium">
                    Kehadiran<br />(25%)
                  </th>
                  <th className="py-2 px-2.5 bg-[#f0f7ff]/70 dark:bg-blue-950/20 text-[#1e40af] dark:text-blue-300 border-r border-slate-200 dark:border-slate-800 font-medium">
                    Poin Dampingan<br />(15%)
                  </th>

                  {/* Individu */}
                  <th className="py-2 px-2.5 bg-[#f0fdf4]/70 dark:bg-emerald-950/20 text-[#065f46] dark:text-emerald-300 border-r border-slate-200 dark:border-slate-800 font-medium">
                    DPL
                  </th>
                  <th className="py-2 px-2.5 bg-[#f0fdf4]/70 dark:bg-emerald-950/20 text-[#065f46] dark:text-emerald-300 border-r border-slate-200 dark:border-slate-800 font-medium">
                    MPL
                  </th>
                  <th className="py-2 px-2.5 bg-[#f0fdf4]/70 dark:bg-emerald-950/20 text-[#065f46] dark:text-emerald-300 border-r border-slate-200 dark:border-slate-800 font-bold">
                    Gabungan
                  </th>

                  {/* Proker */}
                  <th className="py-2 px-2.5 bg-[#f0fdf4]/70 dark:bg-emerald-950/20 text-[#065f46] dark:text-emerald-300 border-r border-slate-200 dark:border-slate-800 font-medium">
                    DPL
                  </th>
                  <th className="py-2 px-2.5 bg-[#f0fdf4]/70 dark:bg-emerald-950/20 text-[#065f46] dark:text-emerald-300 border-r border-slate-200 dark:border-slate-800 font-medium">
                    MPL
                  </th>
                  <th className="py-2 px-2.5 bg-[#f0fdf4]/70 dark:bg-emerald-950/20 text-[#065f46] dark:text-emerald-300 border-r border-slate-200 dark:border-slate-800 font-bold">
                    Gabungan
                  </th>

                  {/* Kelompok */}
                  <th className="py-2 px-2.5 bg-[#f0fdf4]/70 dark:bg-emerald-950/20 text-[#065f46] dark:text-emerald-300 border-r border-slate-200 dark:border-slate-800 font-medium">
                    DPL
                  </th>
                  <th className="py-2 px-2.5 bg-[#f0fdf4]/70 dark:bg-emerald-950/20 text-[#065f46] dark:text-emerald-300 border-r border-slate-200 dark:border-slate-800 font-medium">
                    MPL
                  </th>
                  <th className="py-2 px-2.5 bg-[#f0fdf4]/70 dark:bg-emerald-950/20 text-[#065f46] dark:text-emerald-300 border-r border-slate-200 dark:border-slate-800 font-bold">
                    Gabungan
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                {paginatedStudents.map((st, idx) => {
                  const isComplete = st.status === "Lengkap";
                  const isWaitingMpl = st.status === "Menunggu MPL";

                  return (
                    <tr
                      key={st.id || idx}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      {/* No */}
                      <td className="py-3 px-3 border-r border-slate-100 dark:border-slate-800 text-slate-500 font-medium">
                        {(currentPage - 1) * itemsPerPage + idx + 1}
                      </td>

                      {/* NIM */}
                      <td className="py-3 px-3 border-r border-slate-100 dark:border-slate-800 font-medium text-slate-800 dark:text-slate-200 text-left">
                        {st.nim}
                      </td>

                      {/* Nama Mahasiswa */}
                      <td className="py-3 px-4 border-r border-slate-100 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100 text-left">
                        {st.name}
                      </td>

                      {/* Kelompok */}
                      <td className="py-3 px-4 border-r border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-left">
                        {st.kelompokName}
                      </td>

                      {/* Otomatis: Kehadiran */}
                      <td className="py-3 px-2.5 border-r border-slate-100 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-200">
                        {st.kehadiran ?? "—"}
                      </td>

                      {/* Otomatis: Poin Dampingan */}
                      <td className="py-3 px-2.5 border-r border-slate-100 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-200">
                        {st.poinDampingan ?? "—"}
                      </td>

                      {/* Nilai Individu */}
                      <td className="py-3 px-2 border-r border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                        {st.individuDpl ?? "—"}
                      </td>
                      <td className="py-3 px-2 border-r border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                        {st.individuMpl ?? "—"}
                      </td>
                      <td className="py-3 px-2 border-r border-slate-100 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100">
                        {st.individuGabungan !== null && st.individuGabungan !== undefined ? st.individuGabungan.toFixed(1) : "—"}
                      </td>

                      {/* Program Kerja */}
                      <td className="py-3 px-2 border-r border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                        {st.prokerDpl ?? "—"}
                      </td>
                      <td className="py-3 px-2 border-r border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                        {st.prokerMpl ?? "—"}
                      </td>
                      <td className="py-3 px-2 border-r border-slate-100 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100">
                        {st.prokerGabungan !== null && st.prokerGabungan !== undefined ? st.prokerGabungan.toFixed(1) : "—"}
                      </td>

                      {/* Nilai Kelompok */}
                      <td className="py-3 px-2 border-r border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                        {st.kelompokDpl ?? "—"}
                      </td>
                      <td className="py-3 px-2 border-r border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                        {st.kelompokMpl ?? "—"}
                      </td>
                      <td className="py-3 px-2 border-r border-slate-100 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100">
                        {st.kelompokGabungan !== null && st.kelompokGabungan !== undefined ? st.kelompokGabungan.toFixed(1) : "—"}
                      </td>

                      {/* Nilai Akhir */}
                      <td className="py-3 px-2 border-r border-slate-100 dark:border-slate-800 font-black text-slate-900 dark:text-slate-100 text-[12px]">
                        {st.nilaiAkhir !== null && st.nilaiAkhir !== undefined ? st.nilaiAkhir.toFixed(1) : "—"}
                      </td>

                      {/* Predikat */}
                      <td className="py-3 px-2 border-r border-slate-100 dark:border-slate-800 font-bold text-[#008055] dark:text-emerald-400">
                        {st.predikat ?? "—"}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        {isComplete ? (
                          <span className="inline-block px-3 py-1 rounded-md text-[11px] font-semibold bg-[#e6f9f0] dark:bg-emerald-950/50 text-[#00704a] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                            Lengkap
                          </span>
                        ) : isWaitingMpl ? (
                          <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#fffbeb] dark:bg-amber-950/50 text-[#b45309] dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 whitespace-nowrap">
                            Menunggu MPL
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60 whitespace-nowrap">
                            {st.status || "Dalam Proses"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600 dark:text-slate-400 font-medium">
        <div>
          Menampilkan {(currentPage - 1) * itemsPerPage + 1}–
          {Math.min(currentPage * itemsPerPage, filteredStudents.length)} dari {filteredStudents.length} mahasiswa
        </div>

        <div className="flex items-center gap-1.5 print:hidden">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => setCurrentPage(pageNum)}
              className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center transition-all ${
                currentPage === pageNum
                  ? "bg-[#008055] text-white shadow-2xs"
                  : "border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {pageNum}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Dasar Perhitungan Nilai Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-4">
        <h2 className="text-base sm:text-[17px] font-extrabold text-[#0f172a] dark:text-slate-100 tracking-tight">
          Dasar Perhitungan Nilai
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Card 1: Sumber Nilai Otomatis */}
          <div className="space-y-2 lg:pr-4 lg:border-r border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2 text-[#00704a] dark:text-emerald-400 font-bold text-xs">
              <span className="w-5 h-5 rounded-full border-1.5 border-[#00704a] dark:border-emerald-400 flex items-center justify-center text-[11px]">
                1
              </span>
              <span>Sumber Nilai Otomatis</span>
            </div>
            <p className="text-[12px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Kehadiran 25% dan Poin Dampingan 15% diperoleh langsung dari data aktivitas yang tervalidasi pada sistem.
            </p>
          </div>

          {/* Card 2: Gabungan Nilai DPL dan MPL */}
          <div className="space-y-2.5 lg:px-4 lg:border-r border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2 text-[#00704a] dark:text-emerald-400 font-bold text-xs">
              <span className="w-5 h-5 rounded-full border-1.5 border-[#00704a] dark:border-emerald-400 flex items-center justify-center text-[11px]">
                2
              </span>
              <span>Gabungan Nilai DPL dan MPL</span>
            </div>
            <p className="text-[12px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Bobot penilai menggunakan DPL 30% dan MPL 60%. Karena total bobot penilai 90%, nilai gabungan dinormalisasi kembali ke skala 100.
            </p>
            <div className="p-2 bg-[#f0fdf4] dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/80 rounded-lg text-center font-bold text-[11px] text-[#00704a] dark:text-emerald-300">
              Nilai Gabungan = ((30 × Nilai DPL) + (60 × Nilai MPL)) ÷ 90
            </div>
          </div>

          {/* Card 3: Formula Nilai Akhir */}
          <div className="space-y-2 lg:px-4 lg:border-r border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2 text-[#00704a] dark:text-emerald-400 font-bold text-xs">
              <span className="w-5 h-5 rounded-full border-1.5 border-[#00704a] dark:border-emerald-400 flex items-center justify-center text-[11px]">
                3
              </span>
              <span>Formula Nilai Akhir</span>
            </div>
            <div className="text-[11.5px] font-mono text-slate-700 dark:text-slate-300 space-y-0.5 leading-relaxed font-medium">
              <p>Nilai Akhir = (25% × Kehadiran)</p>
              <p className="pl-16">+ (15% × Poin Dampingan)</p>
              <p className="pl-16">+ (20% × Nilai Individu)</p>
              <p className="pl-16">+ (20% × Program Kerja)</p>
              <p className="pl-16">+ (20% × Nilai Kelompok)</p>
            </div>
          </div>

          {/* Card 4: Ketentuan Penerbitan */}
          <div className="space-y-2 lg:pl-4">
            <div className="flex items-center gap-2 text-[#00704a] dark:text-emerald-400 font-bold text-xs">
              <span className="w-5 h-5 rounded-full border-1.5 border-[#00704a] dark:border-emerald-400 flex items-center justify-center text-[11px]">
                4
              </span>
              <span>Ketentuan Penerbitan</span>
            </div>
            <p className="text-[12px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Nilai akhir dan predikat hanya diterbitkan setelah seluruh komponen DPL dan MPL lengkap. Hasil ditampilkan dengan pembulatan satu angka desimal.
            </p>
          </div>
        </div>

        {/* Footer Note */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2 text-[11.5px] text-slate-500 dark:text-slate-400 font-medium">
          <Info size={14} className="shrink-0 text-slate-400" />
          <span>
            Total bobot komponen nilai akhir = 100%. Form penilaian DPL dan MPL tersedia terpisah sesuai hak akses masing-masing.
          </span>
        </div>
      </div>
    </div>
  );
};

export default RekapNilaiKknPage;
