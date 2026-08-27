/**
 * Project: BERSEKA (Bersih, Sehat, Kampung Asri)
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Halaman Rekapitulasi & Nilai Akhir KKN Mahasiswa
 * Dilengkapi:
 * - Fluid Responsive Layout (Mobile, Tablet, Desktop)
 * - Custom High-Contrast Table Scrollbar
 * - Smart Windowing Pagination
 * - Toolbar Pencarian, Filter Kelompok & Status Lengkap
 * - KPI Ringkasan Metrik Nilai
 * - Ekspor Rekap Nilai ke Excel
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Info,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  Users,
  Award,
  Clock,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { dplService, type RekapNilaiStudent, type RekapNilaiResponse } from "../../services/dplService";
import { useAuthStore } from "../../store/useAuthStore";

// Fallback demo data jika offline
const DEFAULT_STUDENTS: RekapNilaiStudent[] = [
  {
    id: "st-1",
    userId: "u-1",
    nim: "211124805",
    name: "Anugrah Rizky Agustian",
    jurusan: "Teknik Informatika",
    fakultas: "Fakultas Teknik dan Ilmu Komputer",
    kelompokId: "kel-1",
    kelompokName: "Kelompok 1 Sadang Serang",
    kelurahan: "Sadang Serang",
    isKetua: true,
    kehadiran: 92,
    poinDampingan: 85,
    individuDpl: 88,
    individuMpl: 90,
    individuGabungan: 89.0,
    prokerDpl: 86,
    prokerMpl: 92,
    prokerGabungan: 89.0,
    kelompokDpl: 90,
    kelompokMpl: 88,
    kelompokGabungan: 89.0,
    nilaiAkhir: 89.2,
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
    kelompokName: "Kelompok 1 Sadang Serang",
    kelurahan: "Sadang Serang",
    isKetua: false,
    kehadiran: 88,
    poinDampingan: 82,
    individuDpl: 85,
    individuMpl: 87,
    individuGabungan: 86.0,
    prokerDpl: 88,
    prokerMpl: 90,
    prokerGabungan: 89.0,
    kelompokDpl: 86,
    kelompokMpl: 89,
    kelompokGabungan: 87.5,
    nilaiAkhir: 86.8,
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
    kelompokName: "Kelompok 1 Sadang Serang",
    kelurahan: "Sadang Serang",
    isKetua: false,
    kehadiran: 95,
    poinDampingan: 90,
    individuDpl: 92,
    individuMpl: 94,
    individuGabungan: 93.0,
    prokerDpl: 90,
    prokerMpl: 93,
    prokerGabungan: 91.5,
    kelompokDpl: 91,
    kelompokMpl: 92,
    kelompokGabungan: 91.5,
    nilaiAkhir: 92.5,
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
    kelompokName: "Kelompok 1 Sadang Serang",
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
    kelompokName: "Kelompok 1 Sadang Serang",
    kelurahan: "Sadang Serang",
    isKetua: false,
    kehadiran: 90,
    poinDampingan: 88,
    individuDpl: 89,
    individuMpl: 91,
    individuGabungan: 90.0,
    prokerDpl: 88,
    prokerMpl: 90,
    prokerGabungan: 89.0,
    kelompokDpl: 90,
    kelompokMpl: 92,
    kelompokGabungan: 91.0,
    nilaiAkhir: 89.7,
    predikat: "A",
    status: "Lengkap",
  },
];

export const RekapNilaiKknPage: React.FC = () => {
  const { user } = useAuthStore();
  const userRole = String(user?.peran || (user as any)?.role || "").toUpperCase();
  const isPimpinan = ["PEMIMPIN", "PIMPINAN", "CAMAT", "LURAH", "KEPALA_DESA", "REKTOR"].includes(userRole);

  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<RekapNilaiStudent[]>(DEFAULT_STUDENTS);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterKelompok, setFilterKelompok] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("NIM_ASC");

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res: RekapNilaiResponse = await dplService.getRekapNilaiAkhir();

      if (res && res.students && res.students.length > 0) {
        const formatted = res.students.map((s) => {
          const dplIndiv = s.individuDpl !== undefined && s.individuDpl !== null ? s.individuDpl : (s.skorIndividu ?? null);
          const mplIndiv = s.individuMpl !== undefined && s.individuMpl !== null ? s.individuMpl : null;
          const indivGab =
            dplIndiv !== null && mplIndiv !== null
              ? Math.round(((50 * dplIndiv + 50 * mplIndiv) / 100) * 10) / 10
              : null;

          const dplProk = s.prokerDpl !== undefined && s.prokerDpl !== null ? s.prokerDpl : (s.skorProkerKelompok ?? null);
          const mplProk = s.prokerMpl !== undefined && s.prokerMpl !== null ? s.prokerMpl : null;
          const prokGab =
            dplProk !== null && mplProk !== null
              ? Math.round(((50 * dplProk + 50 * mplProk) / 100) * 10) / 10
              : null;

          const dplKel = s.kelompokDpl !== undefined && s.kelompokDpl !== null ? s.kelompokDpl : null;
          const mplKel = s.kelompokMpl !== undefined && s.kelompokMpl !== null ? s.kelompokMpl : null;
          const kelGab =
            dplKel !== null && mplKel !== null
              ? Math.round(((50 * dplKel + 50 * mplKel) / 100) * 10) / 10
              : null;

          const keh = s.kehadiran ?? s.tingkatKehadiran ?? 0;
          const poin = s.poinDampingan ?? 0;

          let nAkhir: number | null = null;
          let pred: string | null = null;
          let stat = s.status || "Menunggu Penilaian";

          if (dplIndiv !== null && mplIndiv !== null && indivGab !== null && prokGab !== null && kelGab !== null) {
            const rawScore =
              0.25 * keh + 0.15 * poin + 0.2 * indivGab + 0.2 * prokGab + 0.2 * kelGab;
            nAkhir = Math.round(rawScore * 10) / 10;
            pred =
              nAkhir >= 80
                ? "A"
                : nAkhir >= 70
                ? "B"
                : nAkhir >= 60
                ? "C"
                : nAkhir >= 50
                ? "D"
                : "E";
            stat = "Lengkap";
          } else {
            nAkhir = null;
            pred = null;
            if (dplIndiv === null && mplIndiv === null) {
              stat = "Menunggu DPL & MPL";
            } else if (dplIndiv === null) {
              stat = "Menunggu DPL";
            } else {
              stat = "Menunggu MPL";
            }
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
      // Fallback to default demo data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Unique list of groups for filter dropdown
  const kelompokOptions = useMemo(() => {
    const setGroups = new Set<string>();
    students.forEach((s) => {
      if (s.kelompokName) setGroups.add(s.kelompokName);
    });
    return Array.from(setGroups).sort();
  }, [students]);

  // Helper for sorting by score
  const getStudentScore = (s: RekapNilaiStudent): number => {
    if (typeof s.nilaiAkhir === "number" && !isNaN(s.nilaiAkhir)) {
      return s.nilaiAkhir;
    }
    const keh = s.kehadiran ?? s.tingkatKehadiran ?? 0;
    const poin = s.poinDampingan ?? 0;
    const indiv = s.individuGabungan ?? s.individuDpl ?? s.individuMpl ?? 0;
    const proker = s.prokerGabungan ?? s.prokerDpl ?? s.prokerMpl ?? 0;
    const kelompok = s.kelompokGabungan ?? s.kelompokDpl ?? s.kelompokMpl ?? 0;
    return 0.25 * keh + 0.15 * poin + 0.2 * indiv + 0.2 * proker + 0.2 * kelompok;
  };

  // Filtered & Sorted Students
  const filteredStudents = useMemo(() => {
    return students
      .filter((s) => {
        // Search by NIM or Name
        if (searchTerm.trim() !== "") {
          const q = searchTerm.toLowerCase().trim();
          const matchNim = s.nim.toLowerCase().includes(q);
          const matchName = s.name.toLowerCase().includes(q);
          if (!matchNim && !matchName) return false;
        }

        // Filter by Kelompok
        if (filterKelompok !== "ALL" && s.kelompokName !== filterKelompok) {
          return false;
        }

        // Filter by Status
        if (filterStatus !== "ALL" && s.status !== filterStatus) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "NIM_ASC") return a.nim.localeCompare(b.nim, undefined, { numeric: true });
        if (sortBy === "NIM_DESC") return b.nim.localeCompare(a.nim, undefined, { numeric: true });
        if (sortBy === "NAME_ASC") return a.name.localeCompare(b.name);
        if (sortBy === "NAME_DESC") return b.name.localeCompare(a.name);
        if (sortBy === "SCORE_DESC") {
          const diff = getStudentScore(b) - getStudentScore(a);
          return diff !== 0 ? diff : a.name.localeCompare(b.name);
        }
        if (sortBy === "SCORE_ASC") {
          const diff = getStudentScore(a) - getStudentScore(b);
          return diff !== 0 ? diff : a.name.localeCompare(b.name);
        }
        return 0;
      });
  }, [students, searchTerm, filterKelompok, filterStatus, sortBy]);

  // KPI calculations
  const kpiStats = useMemo(() => {
    const total = filteredStudents.length;
    const lengkap = filteredStudents.filter((s) => s.status === "Lengkap").length;
    const menungguMpl = filteredStudents.filter((s) => s.status === "Menunggu MPL").length;
    const menungguDpl = filteredStudents.filter((s) => s.status === "Menunggu DPL").length;

    const completedScores = filteredStudents
      .map((s) => s.nilaiAkhir)
      .filter((v): v is number => typeof v === "number");

    const avgScore =
      completedScores.length > 0
        ? (completedScores.reduce((acc, c) => acc + c, 0) / completedScores.length).toFixed(1)
        : "—";

    return { total, lengkap, menungguMpl, menungguDpl, avgScore };
  }, [filteredStudents]);

  // Smart Pagination bounds & windowing
  const totalFilteredCount = filteredStudents.length;
  const totalPages = Math.max(1, Math.ceil(totalFilteredCount / itemsPerPage));

  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(start, start + itemsPerPage);
  }, [filteredStudents, currentPage, itemsPerPage]);

  // Smart Pagination Items (e.g. 1 2 3 ... 57)
  const paginationPages = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }
    if (currentPage >= totalPages - 3) {
      return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
  }, [currentPage, totalPages]);

  const handleResetFilters = () => {
    setSearchTerm("");
    setFilterKelompok("ALL");
    setFilterStatus("ALL");
    setSortBy("NIM_ASC");
    setCurrentPage(1);
  };

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
        s.individuGabungan !== null && s.individuGabungan !== undefined
          ? s.individuGabungan.toFixed(1)
          : "—",
        s.prokerDpl ?? "—",
        s.prokerMpl ?? "—",
        s.prokerGabungan !== null && s.prokerGabungan !== undefined
          ? s.prokerGabungan.toFixed(1)
          : "—",
        s.kelompokDpl ?? "—",
        s.kelompokMpl ?? "—",
        s.kelompokGabungan !== null && s.kelompokGabungan !== undefined
          ? s.kelompokGabungan.toFixed(1)
          : "—",
        s.nilaiAkhir !== null && s.nilaiAkhir !== undefined ? s.nilaiAkhir.toFixed(1) : "—",
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
      XLSX.writeFile(
        wb,
        `Rekap_Nilai_Akhir_BERSEKA_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      toast.success("Berhasil mengekspor Rekap & Nilai Akhir ke Excel!");
    } catch {
      toast.error("Gagal mengekspor data ke Excel");
    }
  };

  const isFiltered =
    searchTerm !== "" || filterKelompok !== "ALL" || filterStatus !== "ALL" || sortBy !== "NIM_ASC";

  return (
    <div className="w-full max-w-full min-h-screen bg-[#f8fafc] dark:bg-slate-950 p-3 sm:p-5 lg:p-6 space-y-5 text-slate-800 dark:text-slate-100 overflow-x-hidden min-w-0">
      {/* Custom CSS untuk High-Contrast Scrollbar */}
      <style>{`
        .table-slidebar-container::-webkit-scrollbar {
          height: 10px;
        }
        .table-slidebar-container::-webkit-scrollbar-track {
          background: #e2e8f0;
          border-radius: 6px;
        }
        .table-slidebar-container::-webkit-scrollbar-thumb {
          background: #009966;
          border-radius: 6px;
        }
        .table-slidebar-container::-webkit-scrollbar-thumb:hover {
          background: #008055;
        }
        .dark .table-slidebar-container::-webkit-scrollbar-track {
          background: #1e293b;
        }
        .dark .table-slidebar-container::-webkit-scrollbar-thumb {
          background: #10b981;
        }
      `}</style>

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 w-full min-w-0">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0f172a] dark:text-slate-100 tracking-tight">
              Rekap & Nilai Akhir
            </h1>
            {isPimpinan && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300">
                Mode Pemimpin: View-Only
              </span>
            )}
          </div>
          <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
            Rekapitulasi nilai berdasarkan data otomatis serta penilaian DPL dan MPL
          </p>
        </div>

        <div className="flex items-center gap-3 self-stretch sm:self-auto justify-end">
          {/* Button Ekspor Excel */}
          <button
            onClick={handleExportExcel}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/40 text-slate-800 dark:text-slate-200 border border-[#009966] rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer w-full sm:w-auto hover:shadow-sm"
          >
            <div className="w-4 h-4 rounded border border-[#009966] flex items-center justify-center text-[10px] text-[#009966] font-black">
              X
            </div>
            <span>Ekspor Excel ({filteredStudents.length})</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards - Fully Fluid Responsive */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full min-w-0">
        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#1d4ed8] flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">Total Mahasiswa</p>
            <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100">{kpiStats.total}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-[#009966] flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">Nilai Lengkap</p>
            <p className="text-lg sm:text-xl font-black text-[#009966] dark:text-emerald-400">{kpiStats.lengkap}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-[#b45309] flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">Menunggu Penilaian</p>
            <p className="text-lg sm:text-xl font-black text-[#b45309] dark:text-amber-400">
              {kpiStats.menungguMpl + kpiStats.menungguDpl}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center shrink-0">
            <Award size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">Rata-rata Nilai</p>
            <p className="text-lg sm:text-xl font-black text-indigo-600 dark:text-indigo-400">{kpiStats.avgScore}</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar - Fluid Wrap */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-3.5 sm:p-4 shadow-2xs space-y-3 w-full min-w-0">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 w-full min-w-0">
          {/* Search Box */}
          <div className="relative flex-1 min-w-0">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Cari berdasarkan NIM atau nama mahasiswa..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#009966]/30 focus:border-[#009966] transition-all"
            />
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Kelompok */}
            <div className="flex-1 sm:flex-initial min-w-[130px]">
              <select
                value={filterKelompok}
                onChange={(e) => {
                  setFilterKelompok(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-700 dark:text-slate-200 font-medium focus:outline-hidden focus:ring-2 focus:ring-[#009966]/30 cursor-pointer"
              >
                <option value="ALL">Semua Kelompok ({kelompokOptions.length})</option>
                {kelompokOptions.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Status */}
            <div className="flex-1 sm:flex-initial min-w-[110px]">
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-700 dark:text-slate-200 font-medium focus:outline-hidden focus:ring-2 focus:ring-[#009966]/30 cursor-pointer"
              >
                <option value="ALL">Semua Status</option>
                <option value="Lengkap">Lengkap</option>
                <option value="Menunggu MPL">Menunggu MPL</option>
                <option value="Menunggu DPL">Menunggu DPL</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex-1 sm:flex-initial min-w-[120px]">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-700 dark:text-slate-200 font-medium focus:outline-hidden focus:ring-2 focus:ring-[#009966]/30 cursor-pointer"
              >
                <option value="NIM_ASC">NIM (Terkecil)</option>
                <option value="NIM_DESC">NIM (Terbesar)</option>
                <option value="NAME_ASC">Nama (A - Z)</option>
                <option value="NAME_DESC">Nama (Z - A)</option>
                <option value="SCORE_DESC">Nilai Tertinggi</option>
                <option value="SCORE_ASC">Nilai Terendah</option>
              </select>
            </div>

            {/* Per Page */}
            <div className="w-20">
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-700 dark:text-slate-200 font-medium focus:outline-hidden focus:ring-2 focus:ring-[#009966]/30 cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            {/* Reset Button */}
            {isFiltered && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                title="Reset semua filter"
              >
                <RotateCcw size={14} />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Legend & Info Bar - Responsive Wrap */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 text-xs w-full min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          {/* Badge 1: Otomatis dari Sistem */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/60 px-3 py-1.5 rounded-xl text-slate-700 dark:text-slate-300 font-medium shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#1d4ed8] shrink-0" />
            <span>
              <strong className="text-[#1d4ed8] font-bold">Otomatis dari Sistem:</strong> Kehadiran 25% • Poin Dampingan 15%
            </span>
          </div>

          {/* Badge 2: Penilaian DPL & MPL */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 px-3 py-1.5 rounded-xl text-slate-700 dark:text-slate-300 font-medium shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#009966] shrink-0" />
            <span>
              <strong className="text-[#009966] font-bold">Penilaian DPL & MPL:</strong> Nilai Individu 20% • Program Kerja 20% • Nilai Kelompok 20%
            </span>
          </div>
        </div>

        {/* Badge 3: Info Komposisi */}
        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-slate-600 dark:text-slate-400 font-medium shadow-2xs">
          <Info size={13} className="text-slate-500 shrink-0" />
          <span>
            Komposisi: DPL 50% • MPL 50%
          </span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden flex flex-col w-full min-w-0">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="animate-spin text-[#009966]" size={36} />
            <span className="text-xs font-semibold">Memuat rekapitulasi nilai...</span>
          </div>
        ) : paginatedStudents.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-2">
            <Users size={36} className="mx-auto text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Tidak ada data mahasiswa yang cocok dengan filter
            </p>
            <button
              onClick={handleResetFilters}
              className="text-xs text-[#009966] dark:text-emerald-400 font-bold hover:underline cursor-pointer"
            >
              Reset filter pencarian
            </button>
          </div>
        ) : (
          /* Smooth Horizontal Scroll Table Container */
          <div
            className="overflow-x-auto w-full table-slidebar-container select-text"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <table className="w-full min-w-[1200px] text-center text-[11.5px] border-collapse">
              {/* Table Head Multi-Tier */}
              <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900/90 shadow-2xs border-b border-slate-200 dark:border-slate-800">
                <tr className="bg-slate-50/80 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-800">
                  <th
                    rowSpan={2}
                    className="py-3 px-3 w-12 border-r border-slate-200 dark:border-slate-800"
                  >
                    No.
                  </th>
                  <th
                    rowSpan={2}
                    className="py-3 px-3 w-28 border-r border-slate-200 dark:border-slate-800 text-left"
                  >
                    NIM
                  </th>
                  <th
                    rowSpan={2}
                    className="py-3 px-4 min-w-[180px] border-r border-slate-200 dark:border-slate-800 text-left"
                  >
                    Nama Mahasiswa
                  </th>
                  <th
                    rowSpan={2}
                    className="py-3 px-4 min-w-[160px] border-r border-slate-200 dark:border-slate-800 text-left"
                  >
                    Kelompok
                  </th>

                  {/* Colspan 2: Otomatis dari Sistem */}
                  <th
                    colSpan={2}
                    className="py-2 px-3 bg-[#f0f7ff] dark:bg-blue-950/50 text-[#1e40af] dark:text-blue-300 border-r border-slate-200 dark:border-slate-800 font-bold text-[11.5px]"
                  >
                    Otomatis dari Sistem
                  </th>

                  {/* Colspan 3: Nilai Individu */}
                  <th
                    colSpan={3}
                    className="py-2 px-3 bg-[#f0fdf4] dark:bg-emerald-950/50 text-[#065f46] dark:text-emerald-300 border-r border-slate-200 dark:border-slate-800 font-bold text-[11.5px]"
                  >
                    Nilai Individu (20%)
                  </th>

                  {/* Colspan 3: Program Kerja */}
                  <th
                    colSpan={3}
                    className="py-2 px-3 bg-[#f0fdf4] dark:bg-emerald-950/50 text-[#065f46] dark:text-emerald-300 border-r border-slate-200 dark:border-slate-800 font-bold text-[11.5px]"
                  >
                    Program Kerja (20%)
                  </th>

                  {/* Colspan 3: Nilai Kelompok */}
                  <th
                    colSpan={3}
                    className="py-2 px-3 bg-[#f0fdf4] dark:bg-emerald-950/50 text-[#065f46] dark:text-emerald-300 border-r border-slate-200 dark:border-slate-800 font-bold text-[11.5px]"
                  >
                    Nilai Kelompok (20%)
                  </th>

                  <th
                    rowSpan={2}
                    className="py-3 px-3 w-16 border-r border-slate-200 dark:border-slate-800 font-extrabold text-[#0f172a] dark:text-slate-100"
                  >
                    Nilai<br />Akhir
                  </th>
                  <th
                    rowSpan={2}
                    className="py-3 px-3 w-14 border-r border-slate-200 dark:border-slate-800 font-bold"
                  >
                    Predikat
                  </th>
                  <th rowSpan={2} className="py-3 px-4 w-28 font-bold">
                    Status
                  </th>
                </tr>

                {/* Sub-header row */}
                <tr className="bg-slate-50/80 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800 text-[10.5px]">
                  {/* Otomatis */}
                  <th className="py-2 px-2 bg-[#f0f7ff]/70 dark:bg-blue-950/20 text-[#1e40af] dark:text-blue-300 border-r border-slate-200 dark:border-slate-800 font-medium">
                    Kehadiran<br />(25%)
                  </th>
                  <th className="py-2 px-2 bg-[#f0f7ff]/70 dark:bg-blue-950/20 text-[#1e40af] dark:text-blue-300 border-r border-slate-200 dark:border-slate-800 font-medium">
                    Poin Dampingan<br />(15%)
                  </th>

                  {/* Individu */}
                  <th className="py-2 px-2 bg-[#f0fdf4]/70 dark:bg-emerald-950/20 text-[#065f46] dark:text-emerald-300 border-r border-slate-200 dark:border-slate-800 font-medium">
                    DPL
                  </th>
                  <th className="py-2 px-2 bg-[#f0fdf4]/70 dark:bg-emerald-950/20 text-[#065f46] dark:text-emerald-300 border-r border-slate-200 dark:border-slate-800 font-medium">
                    MPL
                  </th>
                  <th className="py-2 px-2 bg-[#f0fdf4]/70 dark:bg-emerald-950/20 text-[#065f46] dark:text-emerald-300 border-r border-slate-200 dark:border-slate-800 font-bold">
                    Gabungan
                  </th>

                  {/* Proker */}
                  <th className="py-2 px-2 bg-[#f0fdf4]/70 dark:bg-emerald-950/20 text-[#065f46] dark:text-emerald-300 border-r border-slate-200 dark:border-slate-800 font-medium">
                    DPL
                  </th>
                  <th className="py-2 px-2 bg-[#f0fdf4]/70 dark:bg-emerald-950/20 text-[#065f46] dark:text-emerald-300 border-r border-slate-200 dark:border-slate-800 font-medium">
                    MPL
                  </th>
                  <th className="py-2 px-2 bg-[#f0fdf4]/70 dark:bg-emerald-950/20 text-[#065f46] dark:text-emerald-300 border-r border-slate-200 dark:border-slate-800 font-bold">
                    Gabungan
                  </th>

                  {/* Kelompok */}
                  <th className="py-2 px-2 bg-[#f0fdf4]/70 dark:bg-emerald-950/20 text-[#065f46] dark:text-emerald-300 border-r border-slate-200 dark:border-slate-800 font-medium">
                    DPL
                  </th>
                  <th className="py-2 px-2 bg-[#f0fdf4]/70 dark:bg-emerald-950/20 text-[#065f46] dark:text-emerald-300 border-r border-slate-200 dark:border-slate-800 font-medium">
                    MPL
                  </th>
                  <th className="py-2 px-2 bg-[#f0fdf4]/70 dark:bg-emerald-950/20 text-[#065f46] dark:text-emerald-300 border-r border-slate-200 dark:border-slate-800 font-bold">
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
                      className="hover:bg-slate-50/90 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      {/* No */}
                      <td className="py-3 px-3 border-r border-slate-100 dark:border-slate-800 text-slate-500 font-medium">
                        {(currentPage - 1) * itemsPerPage + idx + 1}
                      </td>

                      {/* NIM */}
                      <td className="py-3 px-3 border-r border-slate-100 dark:border-slate-800 font-medium text-slate-800 dark:text-slate-200 text-left font-mono">
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
                        {st.individuDpl !== null && st.individuDpl !== undefined
                          ? st.individuDpl
                          : "—"}
                      </td>
                      <td className="py-3 px-2 border-r border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                        {st.individuMpl !== null && st.individuMpl !== undefined
                          ? st.individuMpl
                          : "—"}
                      </td>
                      <td className="py-3 px-2 border-r border-slate-100 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100">
                        {st.individuGabungan !== null && st.individuGabungan !== undefined
                          ? st.individuGabungan.toFixed(1)
                          : "—"}
                      </td>

                      {/* Program Kerja */}
                      <td className="py-3 px-2 border-r border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                        {st.prokerDpl !== null && st.prokerDpl !== undefined
                          ? st.prokerDpl
                          : "—"}
                      </td>
                      <td className="py-3 px-2 border-r border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                        {st.prokerMpl !== null && st.prokerMpl !== undefined
                          ? st.prokerMpl
                          : "—"}
                      </td>
                      <td className="py-3 px-2 border-r border-slate-100 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100">
                        {st.prokerGabungan !== null && st.prokerGabungan !== undefined
                          ? st.prokerGabungan.toFixed(1)
                          : "—"}
                      </td>

                      {/* Nilai Kelompok */}
                      <td className="py-3 px-2 border-r border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                        {st.kelompokDpl !== null && st.kelompokDpl !== undefined
                          ? st.kelompokDpl
                          : "—"}
                      </td>
                      <td className="py-3 px-2 border-r border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                        {st.kelompokMpl !== null && st.kelompokMpl !== undefined
                          ? st.kelompokMpl
                          : "—"}
                      </td>
                      <td className="py-3 px-2 border-r border-slate-100 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100">
                        {st.kelompokGabungan !== null && st.kelompokGabungan !== undefined
                          ? st.kelompokGabungan.toFixed(1)
                          : "—"}
                      </td>

                      {/* Nilai Akhir */}
                      <td className="py-3 px-2 border-r border-slate-100 dark:border-slate-800 font-black text-slate-900 dark:text-slate-100 text-[12px]">
                        {st.nilaiAkhir !== null && st.nilaiAkhir !== undefined
                          ? st.nilaiAkhir.toFixed(1)
                          : "—"}
                      </td>

                      {/* Predikat */}
                      <td className="py-3 px-2 border-r border-slate-100 dark:border-slate-800 font-bold text-[#009966] dark:text-emerald-400">
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
                            {st.status || "Menunggu DPL"}
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

        {/* Smart Pagination Controls Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 font-medium px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="text-center sm:text-left">
            Menampilkan {(currentPage - 1) * itemsPerPage + 1}–
            {Math.min(currentPage * itemsPerPage, totalFilteredCount)} dari {totalFilteredCount} mahasiswa
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {/* Tombol Previous */}
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              title="Halaman sebelumnya"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Smart Pagination Page Buttons */}
            {paginationPages.map((pageNum, idx) => {
              if (pageNum === "...") {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="w-8 h-8 flex items-center justify-center text-slate-400 font-bold"
                  >
                    ...
                  </span>
                );
              }

              const pageNumber = Number(pageNum);
              return (
                <button
                  key={`page-${pageNumber}`}
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center transition-all cursor-pointer ${
                    currentPage === pageNumber
                      ? "bg-[#009966] text-white shadow-2xs"
                      : "border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}

            {/* Tombol Next */}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              title="Halaman berikutnya"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Dasar Perhitungan Nilai Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-6 shadow-2xs space-y-4 w-full min-w-0">
        <h2 className="text-base sm:text-[17px] font-extrabold text-[#0f172a] dark:text-slate-100 tracking-tight">
          Dasar Perhitungan Nilai
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
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
              Bobot penilai menggunakan DPL 50% dan MPL 50% dengan total bobot penilai 100%.
            </p>
            <div className="p-2 bg-[#f0fdf4] dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/80 rounded-lg text-center font-bold text-[11px] text-[#00704a] dark:text-emerald-300">
              Nilai Gabungan = ((50 × Nilai DPL) + (50 × Nilai MPL)) ÷ 100
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
