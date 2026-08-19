/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Halaman Penilaian Individu Mahasiswa KKN (Role DPL)
 * Menggunakan Layout Full-Width Table dengan Modal Form Penilaian Interaktif:
 * - Tampilan Utama: Ringkasan KPI Statistik, Filter Lengkap, & Tabel Mahasiswa Full-Width
 * - Modal Form: Form Penilaian 6 Aspek Akademik DPL dengan Fitur Klik-Klik Cepat (Hybrid Opsi A + Opsi B):
 *   1. Master Fill Template (Semua A, Semua B+, Semua B, Reset)
 *   2. Quick Grade Chips per Aspek ([A], [B+], [B], [C])
 *   3. Input Angka Presisi & Kalkulasi Skor Real-Time
 *   4. Catatan DPL dengan Template Feedback Cepat
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  User,
  ChevronDown,
  Loader2,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  RotateCcw,
  Save,
  X,
  MessageSquare,
  Edit3,
  Award,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/useAuthStore";
import { penilaianKknApiService } from "../../services/penilaianKknApiService";
import { Pagination } from "../../components/common/Pagination";
import { EmptyTableState } from "../../components/common/EmptyTableState";

interface StudentItem {
  studentId: string;
  nama: string;
  nim: string;
  jenjangPendidikan?: string;
  jurusan?: string;
  fakultas?: string;
  kelompok: string;
  kelurahan?: string;
  rw?: string;
  dplNama?: string;
  subtotalMitra: number;
  subtotalDpl: number;
  nilaiAkhir: number;
  kategori: string;
  status: string;
  statusDpl: "BELUM_DINILAI" | "SEDANG_DINILAI" | "SUDAH_DINILAI";
  skorDplPerencanaan: number;
  skorDplKontribusi: number;
  skorDplLogbook: number;
  skorDplAnalisis: number;
  skorDplOutput: number;
  skorDplLaporanAkhir: number;
  catatanDpl: string;
}

// 6 Aspek Standar Akademik DPL & Bobot
const ASPEK_CONFIG = [
  { key: "skorDplPerencanaan", no: 1, title: "Perencanaan & Pemahaman Program", bobot: 20 },
  { key: "skorDplKontribusi", no: 2, title: "Kontribusi Individu", bobot: 20 },
  { key: "skorDplLogbook", no: 3, title: "Logbook & Dokumentasi Akademik", bobot: 20 },
  { key: "skorDplAnalisis", no: 4, title: "Analisis Masalah & Solusi", bobot: 15 },
  { key: "skorDplOutput", no: 5, title: "Output, Outcome, & Dampak", bobot: 15 },
  { key: "skorDplLaporanAkhir", no: 6, title: "Laporan Akhir, Evaluasi & Refleksi", bobot: 10 },
] as const;

type AspekKey = (typeof ASPEK_CONFIG)[number]["key"];

// Quick-grade presets per aspect (Opsi A)
const GRADE_PRESETS = [
  { label: "A", value: 90, desc: "Sangat Baik (90)" },
  { label: "B+", value: 80, desc: "Baik Sekali (80)" },
  { label: "B", value: 75, desc: "Baik (75)" },
  { label: "C", value: 65, desc: "Cukup (65)" },
] as const;

// Quick feedback notes templates
const QUICK_FEEDBACK_OPTIONS = [
  "Kinerja sangat aktif, berinisiatif tinggi, dan kepemimpinan solid di lapangan.",
  "Logbook dan dokumentasi kegiatan tersusun sangat rapi dan konsisten.",
  "Analisis masalah lapangan tajam dengan eksekusi solusi pemilahan sampah yang berdampak.",
  "Partisipasi aktif dalam kelompok, perlu sedikit peningkatan ketepatan waktu unggah bukti.",
];

export const PenilaianKknMahasiswaPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const displayName = user?.name || "Dr. Agus Mulyana, M.T.";

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [students, setStudents] = useState<StudentItem[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentItem | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterKelompok, setFilterKelompok] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Form State (6 Aspek DPL: 0-100)
  const [formScores, setFormScores] = useState<Record<AspekKey, number | string>>({
    skorDplPerencanaan: "",
    skorDplKontribusi: "",
    skorDplLogbook: "",
    skorDplAnalisis: "",
    skorDplOutput: "",
    skorDplLaporanAkhir: "",
  });

  const [catatanDpl, setCatatanDpl] = useState<string>("");

  // Load Students Rekap Data
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await penilaianKknApiService.getRekapPenilaian();
      const list: StudentItem[] = (Array.isArray(data) ? data : []).map((s: any) => ({
        studentId: s.studentId || s.id,
        nama: s.nama || s.name,
        nim: s.nim || "-",
        jenjangPendidikan: s.jenjangPendidikan || "S1",
        jurusan: s.jurusan || s.programStudi || "S1 Teknik Informatika",
        fakultas: s.fakultas || "-",
        kelompok: s.kelompok || "Kelompok 1",
        kelurahan: s.kelurahan || "Sadang Serang",
        rw: s.rw || "-",
        dplNama: s.dplNama || displayName,
        subtotalMitra: Number(s.subtotalMitra) || 0,
        subtotalDpl: Number(s.subtotalDpl) || 0,
        nilaiAkhir: Number(s.nilaiAkhir) || 0,
        kategori: s.kategori || "Belum Dinilai",
        status: s.status || "BELUM_DINILAI",
        statusDpl: s.statusDpl || (Number(s.subtotalDpl) > 0 ? "SUDAH_DINILAI" : "BELUM_DINILAI"),
        skorDplPerencanaan: Number(s.skorDplPerencanaan) || 0,
        skorDplKontribusi: Number(s.skorDplKontribusi) || 0,
        skorDplLogbook: Number(s.skorDplLogbook) || 0,
        skorDplAnalisis: Number(s.skorDplAnalisis) || 0,
        skorDplOutput: Number(s.skorDplOutput) || 0,
        skorDplLaporanAkhir: Number(s.skorDplLaporanAkhir) || 0,
        catatanDpl: s.catatanDpl || "",
      }));

      setStudents(list);
    } catch (err) {
      console.error("Gagal memuat data mahasiswa:", err);
      toast.error("Gagal memuat daftar mahasiswa bimbingan");
    } finally {
      setLoading(false);
    }
  }, [displayName]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Statistics KPI Counters
  const stats = useMemo(() => {
    const total = students.length;
    const sudah = students.filter((s) => s.statusDpl === "SUDAH_DINILAI" || s.subtotalDpl > 0).length;
    const sedang = students.filter((s) => s.statusDpl === "SEDANG_DINILAI").length;
    const belum = total - sudah - sedang;
    return { total, sudah, sedang, belum };
  }, [students]);

  // Open Modal with Selected Student
  const handleOpenModal = (student: StudentItem) => {
    setSelectedStudent(student);
    setFormScores({
      skorDplPerencanaan: student.skorDplPerencanaan > 0 ? student.skorDplPerencanaan : "",
      skorDplKontribusi: student.skorDplKontribusi > 0 ? student.skorDplKontribusi : "",
      skorDplLogbook: student.skorDplLogbook > 0 ? student.skorDplLogbook : "",
      skorDplAnalisis: student.skorDplAnalisis > 0 ? student.skorDplAnalisis : "",
      skorDplOutput: student.skorDplOutput > 0 ? student.skorDplOutput : "",
      skorDplLaporanAkhir: student.skorDplLaporanAkhir > 0 ? student.skorDplLaporanAkhir : "",
    });
    setCatatanDpl(student.catatanDpl || "");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
  };

  // Helper to calculate aspect score: (Nilai * Bobot) / 100
  const calcScore = (scoreVal: number | string, weight: number): number => {
    const num = Number(scoreVal) || 0;
    const safe = Math.max(0, Math.min(100, num));
    return Number(((safe * weight) / 100).toFixed(1));
  };

  // Nilai Akhir DPL (Sum of 6 calculated aspect scores)
  const calculatedFinalScore = useMemo(() => {
    let total = 0;
    ASPEK_CONFIG.forEach((aspek) => {
      total += calcScore(formScores[aspek.key], aspek.bobot);
    });
    return Number(total.toFixed(1));
  }, [formScores]);

  // Predikat Nilai
  const calculatedPredicate = useMemo(() => {
    if (calculatedFinalScore >= 85) return "Sangat Baik (A)";
    if (calculatedFinalScore >= 75) return "Baik (B)";
    if (calculatedFinalScore >= 65) return "Cukup (C)";
    if (calculatedFinalScore >= 55) return "Kurang (D)";
    if (calculatedFinalScore > 0) return "Sangat Kurang (E)";
    return "-";
  }, [calculatedFinalScore]);

  // Filter Unique Groups
  const uniqueKelompokList = useMemo(() => {
    const list = students.map((s) => s.kelompok).filter(Boolean);
    return Array.from(new Set(list));
  }, [students]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        s.nama.toLowerCase().includes(q) ||
        s.nim.toLowerCase().includes(q) ||
        (s.jurusan || "").toLowerCase().includes(q) ||
        s.kelompok.toLowerCase().includes(q) ||
        (s.kelurahan || "").toLowerCase().includes(q);

      const matchKelompok = filterKelompok === "ALL" || s.kelompok === filterKelompok;

      let matchStatus = true;
      if (filterStatus === "SEDANG_DINILAI") {
        matchStatus = s.statusDpl === "SEDANG_DINILAI";
      } else if (filterStatus === "BELUM_DINILAI") {
        matchStatus = s.statusDpl === "BELUM_DINILAI" && s.subtotalDpl === 0;
      } else if (filterStatus === "SUDAH_DINILAI") {
        matchStatus = s.statusDpl === "SUDAH_DINILAI" || s.subtotalDpl > 0;
      }

      return matchSearch && matchKelompok && matchStatus;
    });
  }, [students, searchQuery, filterKelompok, filterStatus]);

  // Pagination Slice
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredStudents.length);
  const paginatedStudents = useMemo(() => {
    return filteredStudents.slice(startIndex, endIndex);
  }, [filteredStudents, startIndex, endIndex]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterKelompok, filterStatus]);

  // Handler: Set single aspect score
  const handleSetAspectScore = (field: AspekKey, val: number | string) => {
    if (val === "") {
      setFormScores((prev) => ({ ...prev, [field]: "" }));
      return;
    }
    const num = Number(val);
    if (isNaN(num)) return;
    const clamped = Math.max(0, Math.min(100, num));
    setFormScores((prev) => ({ ...prev, [field]: clamped }));
  };

  // Handler: Global Master Fill (Opsi B)
  const handleGlobalFill = (scoreValue: number) => {
    setFormScores({
      skorDplPerencanaan: scoreValue,
      skorDplKontribusi: scoreValue,
      skorDplLogbook: scoreValue,
      skorDplAnalisis: scoreValue,
      skorDplOutput: scoreValue,
      skorDplLaporanAkhir: scoreValue,
    });
    toast.success(`Seluruh aspek diisi nilai ${scoreValue}`);
  };

  const handleResetForm = () => {
    if (selectedStudent) {
      setFormScores({
        skorDplPerencanaan: selectedStudent.skorDplPerencanaan > 0 ? selectedStudent.skorDplPerencanaan : "",
        skorDplKontribusi: selectedStudent.skorDplKontribusi > 0 ? selectedStudent.skorDplKontribusi : "",
        skorDplLogbook: selectedStudent.skorDplLogbook > 0 ? selectedStudent.skorDplLogbook : "",
        skorDplAnalisis: selectedStudent.skorDplAnalisis > 0 ? selectedStudent.skorDplAnalisis : "",
        skorDplOutput: selectedStudent.skorDplOutput > 0 ? selectedStudent.skorDplOutput : "",
        skorDplLaporanAkhir: selectedStudent.skorDplLaporanAkhir > 0 ? selectedStudent.skorDplLaporanAkhir : "",
      });
      setCatatanDpl(selectedStudent.catatanDpl || "");
      toast.success("Formulir penilaian telah direset");
    }
  };

  const handleSaveScore = async () => {
    if (!selectedStudent) {
      toast.error("Silakan pilih mahasiswa terlebih dahulu");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        studentId: selectedStudent.studentId,
        skorDplPerencanaan: Number(formScores.skorDplPerencanaan) || 0,
        skorDplKontribusi: Number(formScores.skorDplKontribusi) || 0,
        skorDplLogbook: Number(formScores.skorDplLogbook) || 0,
        skorDplAnalisis: Number(formScores.skorDplAnalisis) || 0,
        skorDplOutput: Number(formScores.skorDplOutput) || 0,
        skorDplLaporanAkhir: Number(formScores.skorDplLaporanAkhir) || 0,
        catatanDpl,
      };

      await penilaianKknApiService.savePenilaian(payload);
      toast.success(`Nilai untuk ${selectedStudent.nama} berhasil disimpan!`);

      // Refresh list to update status and score in table
      await fetchStudents();
      handleCloseModal();
    } catch (err: any) {
      console.error("Gagal menyimpan nilai:", err);
      toast.error(err.response?.data?.message || "Gagal menyimpan penilaian mahasiswa");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 text-slate-800 dark:text-slate-100 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Penilaian Individu Mahasiswa
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Berikan nilai secara objektif berdasarkan kinerja individu mahasiswa KKN dampingan DPL.
          </p>
        </div>

        {/* User Profile Pill in Top Right */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-2xl shadow-2xs">
          <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
            <User size={16} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block leading-none">Dosen Pembimbing</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {displayName}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Total Mahasiswa</span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{stats.total}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-[#009966] dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Sudah Dinilai</span>
            <span className="text-xl font-extrabold text-[#009966] dark:text-emerald-400">{stats.sudah}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Sedang Dinilai</span>
            <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400">{stats.sedang}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertCircle size={20} />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Belum Dinilai</span>
            <span className="text-xl font-extrabold text-rose-600 dark:text-rose-400">{stats.belum}</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Cari NIM atau nama mahasiswa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9.5 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-[#009966] focus:ring-1 focus:ring-[#009966] transition"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap sm:flex-nowrap">
          {/* Dropdown Kelompok */}
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={filterKelompok}
              onChange={(e) => setFilterKelompok(e.target.value)}
              className="w-full appearance-none bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl pl-3.5 pr-9 py-2.5 text-xs text-slate-700 dark:text-slate-300 font-semibold outline-none focus:border-[#009966] cursor-pointer"
            >
              <option value="ALL">Semua Kelompok</option>
              {uniqueKelompokList.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>

          {/* Dropdown Status */}
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full appearance-none bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl pl-3.5 pr-9 py-2.5 text-xs text-slate-700 dark:text-slate-300 font-semibold outline-none focus:border-[#009966] cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="SEDANG_DINILAI">Sedang Dinilai</option>
              <option value="BELUM_DINILAI">Belum Dinilai</option>
              <option value="SUDAH_DINILAI">Sudah Dinilai</option>
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>
        </div>
      </div>

      {/* Full-Width Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <Loader2 size={32} className="animate-spin text-[#009966]" />
            <span className="text-xs font-semibold">Memuat daftar mahasiswa bimbingan...</span>
          </div>
        ) : filteredStudents.length === 0 ? (
          <EmptyTableState
            entityName="Mahasiswa Bimbingan KKN"
            isSearch={!!(searchQuery || filterKelompok !== "ALL" || filterStatus !== "ALL")}
            searchQuery={searchQuery}
            onResetSearch={() => {
              setSearchQuery("");
              setFilterKelompok("ALL");
              setFilterStatus("ALL");
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 bg-slate-50/80 dark:bg-slate-800/60 uppercase tracking-wider">
                  <th className="py-4 px-4 text-center w-12">No.</th>
                  <th className="py-4 px-4 w-32">NIM</th>
                  <th className="py-4 px-4 min-w-[200px]">Nama Mahasiswa</th>
                  <th className="py-4 px-4 w-48">Program Studi</th>
                  <th className="py-4 px-4 w-48">Kelompok & Wilayah</th>
                  <th className="py-4 px-4 text-center w-28">Nilai DPL</th>
                  <th className="py-4 px-4 text-center w-36">Status</th>
                  <th className="py-4 px-4 text-center w-32">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium text-slate-700 dark:text-slate-300">
                {paginatedStudents.map((st, idx) => {
                  const hasScore = st.statusDpl === "SUDAH_DINILAI" || st.subtotalDpl > 0;
                  const isPending = st.statusDpl === "SEDANG_DINILAI";

                  return (
                    <tr
                      key={st.studentId}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-4 px-4 text-center text-slate-500 font-bold">
                        {startIndex + idx + 1}
                      </td>
                      <td className="py-4 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {st.nim}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                          {st.nama}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-600 dark:text-slate-400">
                        {st.jurusan || "-"}
                      </td>
                      <td className="py-4 px-4 text-slate-600 dark:text-slate-400 leading-snug">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{st.kelompok}</div>
                        {st.kelurahan && st.kelurahan !== "-" && (
                          <div className="text-[11px] text-slate-400">Kel. {st.kelurahan}</div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                        {hasScore ? (
                          <span className="text-[#009966] dark:text-emerald-400">
                            {st.subtotalDpl % 1 === 0 ? st.subtotalDpl : st.subtotalDpl.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">—</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#fffbeb] text-[#d97706] border border-[#fef3c7] dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#d97706]"></span>
                            <span>Sedang Dinilai</span>
                          </span>
                        ) : hasScore ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0] dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#047857]"></span>
                            <span>Sudah Dinilai</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#f8fafc] text-[#64748b] border border-[#e2e8f0] dark:bg-slate-800/80 dark:text-slate-400 dark:border-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#94a3b8]"></span>
                            <span>Belum Dinilai</span>
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {isPending ? (
                          <button
                            type="button"
                            onClick={() => handleOpenModal(st)}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#009966] hover:bg-[#008055] text-white transition shadow-2xs cursor-pointer flex items-center gap-1.5 mx-auto"
                          >
                            <Edit3 size={13} />
                            <span>Lanjutkan</span>
                          </button>
                        ) : hasScore ? (
                          <button
                            type="button"
                            onClick={() => handleOpenModal(st)}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold border border-[#009966] text-[#009966] bg-white hover:bg-emerald-50 dark:bg-slate-900 dark:hover:bg-emerald-950/30 transition cursor-pointer flex items-center gap-1.5 mx-auto"
                          >
                            <Award size={13} />
                            <span>Lihat / Edit</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenModal(st)}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold border border-[#009966] text-[#009966] bg-white hover:bg-emerald-50 dark:bg-slate-900 dark:hover:bg-emerald-950/30 transition cursor-pointer flex items-center gap-1.5 mx-auto"
                          >
                            <Edit3 size={13} />
                            <span>Beri Nilai</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Standard Pagination Component */}
        {filteredStudents.length > 0 && (
          <div className="border-t border-slate-100 dark:border-slate-800">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredStudents.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
              itemsPerPageOptions={[10, 25, 50, 100]}
            />
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL DIALOG: FORM PENILAIAN INDIVIDU DENGAN QUICK-CLICK PRESETS */}
      {/* ========================================================================= */}
      {isModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col text-slate-800 dark:text-slate-100 overflow-hidden animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 bg-slate-50/50 dark:bg-slate-800/40">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100">
                  Form Penilaian Individu Mahasiswa
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Aspek Evaluasi Akademik Dosen Pendamping Lapangan (DPL)
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
              {/* Profil Mahasiswa Banner */}
              <div className="bg-[#f0fdf4] dark:bg-emerald-950/30 border border-emerald-200/90 dark:border-emerald-800/60 rounded-2xl p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 border-2 border-[#009966] text-[#009966] dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-2xs">
                  <User size={24} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 truncate">
                    {selectedStudent.nama}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    NIM {selectedStudent.nim} &bull; {selectedStudent.jurusan || "S1 Teknik"}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {selectedStudent.kelompok} {selectedStudent.kelurahan && selectedStudent.kelurahan !== "-" ? `• Kel. ${selectedStudent.kelurahan}` : ""}
                  </p>
                </div>
              </div>

              {/* OPSI B: Global Master Fill (1-Klik Isi Semua) */}
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-500" />
                    Isi Cepat Semua Aspek (1-Klik):
                  </span>
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                    title="Reset seluruh nilai ke data awal"
                  >
                    <RotateCcw size={12} />
                    Reset
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => handleGlobalFill(90)}
                    className="px-3 py-2 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-[#009966] dark:text-emerald-300 rounded-xl text-xs font-bold transition shadow-2xs flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>⭐ Semua A (90)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGlobalFill(80)}
                    className="px-3 py-2 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-300 rounded-xl text-xs font-bold transition shadow-2xs flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>👍 Semua B+ (80)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGlobalFill(75)}
                    className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition shadow-2xs flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>👌 Semua B (75)</span>
                  </button>
                </div>
              </div>

              {/* Tabel Aspek Akademik DPL dengan OPSI A (Preset Chips per Aspek) */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Aspek Akademik DPL (6 Aspek - Total 100%)
                </h4>

                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-3 text-center w-8">No.</th>
                        <th className="py-3 px-3">Aspek Penilaian</th>
                        <th className="py-3 px-3 text-center w-14">Bobot</th>
                        <th className="py-3 px-3 text-center min-w-[170px]">Preset Cepat & Nilai</th>
                        <th className="py-3 px-3 text-right w-16">Skor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                      {ASPEK_CONFIG.map((aspek) => {
                        const currentVal = formScores[aspek.key];
                        const numVal = Number(currentVal) || 0;
                        const aspectScore = calcScore(currentVal, aspek.bobot);

                        return (
                          <tr key={aspek.key} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="py-3 px-3 text-center text-slate-500 font-bold">
                              {aspek.no}
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                                {aspek.title}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center text-slate-500 font-bold">
                              {aspek.bobot}%
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center justify-center gap-2">
                                {/* OPSI A: Quick-Grade Chips ([A], [B+], [B], [C]) */}
                                <div className="flex items-center gap-1 shrink-0">
                                  {GRADE_PRESETS.map((preset) => {
                                    const isPresetActive = numVal === preset.value;
                                    return (
                                      <button
                                        key={preset.label}
                                        type="button"
                                        onClick={() => handleSetAspectScore(aspek.key, preset.value)}
                                        className={`px-2 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                          isPresetActive
                                            ? "bg-[#009966] text-white border-[#009966] shadow-2xs"
                                            : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#009966] hover:text-[#009966]"
                                        }`}
                                        title={preset.desc}
                                      >
                                        {preset.label}
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* Manual Number Fine-Tuning */}
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={currentVal}
                                  onChange={(e) => handleSetAspectScore(aspek.key, e.target.value)}
                                  placeholder="0"
                                  className="w-14 px-2 py-1 text-center font-extrabold text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-[#009966] focus:ring-1 focus:ring-[#009966]"
                                />
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right font-extrabold text-slate-900 dark:text-slate-100 text-xs">
                              {aspectScore.toFixed(1)}
                            </td>
                          </tr>
                        );
                      })}

                      {/* Total Bobot Row */}
                      <tr className="bg-slate-50 dark:bg-slate-800/60 font-bold border-t border-slate-200 dark:border-slate-800 text-xs">
                        <td colSpan={2} className="py-3 px-3 text-slate-800 dark:text-slate-200">
                          Total Bobot
                        </td>
                        <td className="py-3 px-3 text-center text-slate-800 dark:text-slate-200 font-extrabold">
                          100%
                        </td>
                        <td colSpan={2}></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Nilai Akhir & Predikat Panel */}
              <div className="bg-[#f0fdf4] dark:bg-emerald-950/20 border border-emerald-200/90 dark:border-emerald-800/60 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium block">
                    Nilai Akhir DPL
                  </span>
                  <span className="text-3xl font-extrabold text-[#009966] dark:text-emerald-400 tracking-tight block mt-0.5">
                    {calculatedFinalScore > 0 ? calculatedFinalScore.toFixed(1) : "0.0"}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium block">
                    Predikat:
                  </span>
                  <span className="text-lg font-extrabold text-[#009966] dark:text-emerald-400 block mt-0.5">
                    {calculatedPredicate}
                  </span>
                </div>
              </div>

              {/* Catatan DPL & Quick Feedback Templates */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    Catatan & Umpan Balik DPL
                  </label>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <MessageSquare size={12} />
                    Klik template di bawah untuk isi instan:
                  </span>
                </div>

                {/* Quick Feedback Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_FEEDBACK_OPTIONS.map((feedback, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCatatanDpl(feedback)}
                      className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 text-[11px] text-slate-600 dark:text-slate-300 rounded-lg text-left transition cursor-pointer"
                    >
                      + {feedback.length > 40 ? `${feedback.substring(0, 40)}...` : feedback}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={3}
                  value={catatanDpl}
                  onChange={(e) => setCatatanDpl(e.target.value)}
                  placeholder="Tuliskan catatan atau umpan balik untuk mahasiswa..."
                  className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-[#009966] focus:ring-1 focus:ring-[#009966] resize-none placeholder-slate-400 shadow-2xs"
                />
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveScore}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#009966] hover:bg-[#008055] transition shadow-2xs flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                <span>Simpan Nilai</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PenilaianKknMahasiswaPage;
