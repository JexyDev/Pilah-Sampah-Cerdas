/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Halaman Penilaian Individu Mahasiswa KKN (6 Aspek Akademik DPL)
 * Desain Full Tabel dengan Form Penilaian Berbentuk Pop-up Modal Ringkas & Efisien
 * 100% Real Database PostgreSQL Integration via Prisma
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  User,
  Loader2,
  GraduationCap,
  Edit3,
  CheckCircle2,
  RefreshCw,
  Award,
  Users,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  penilaianKknApiService,
  type StudentRekapItem,
} from "../../services/penilaianKknApiService";
import { Pagination } from "../../components/common/Pagination";
import { EmptyTableState } from "../../components/common/EmptyTableState";

// 6 Aspek Akademik DPL (Total Bobot 100%)
const ASPEK_DPL_CONFIG = [
  {
    key: "skorDplPerencanaan" as const,
    no: 1,
    title: "Perencanaan & Pemahaman Program",
    bobot: 20,
    deskripsi: "Pemahaman konteks wilayah dan kesiapan rencana kerja",
  },
  {
    key: "skorDplKontribusi" as const,
    no: 2,
    title: "Kontribusi Individu",
    bobot: 10,
    deskripsi: "Keaktifan, dedikasi, dan kerja nyata dalam tim KKN",
  },
  {
    key: "skorDplLogbook" as const,
    no: 3,
    title: "Logbook & Dokumentasi Akademik",
    bobot: 20,
    deskripsi: "Kelengkapan, ketepatan waktu, dan validitas logbook harian",
  },
  {
    key: "skorDplAnalisis" as const,
    no: 4,
    title: "Analisis Masalah & Solusi",
    bobot: 20,
    deskripsi: "Kemampuan identifikasi persoalan sampah dan rumusan solusi",
  },
  {
    key: "skorDplOutput" as const,
    no: 5,
    title: "Output, Outcome, & Dampak",
    bobot: 20,
    deskripsi: "Realisasi target fisik/edukasi dan dampak bagi warga binaan",
  },
  {
    key: "skorDplLaporanAkhir" as const,
    no: 6,
    title: "Laporan Akhir, Esai Lap. & Refleksi",
    bobot: 10,
    deskripsi: "Kualitas penulisan laporan akhir, esai lapangan, dan refleksi diri",
  },
];

// Helper Predikat Nilai
const getPredikat = (score: number): string => {
  if (score >= 85) return "Sangat Baik";
  if (score >= 75) return "Baik";
  if (score >= 65) return "Cukup";
  if (score >= 55) return "Kurang";
  if (score > 0) return "Sangat Kurang";
  return "Belum Dinilai";
};

// Helper Predikat Badge Color
const getPredikatBadgeClass = (predikat: string): string => {
  switch (predikat) {
    case "Sangat Baik":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60";
    case "Baik":
      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/60";
    case "Cukup":
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60";
    case "Kurang":
    case "Sangat Kurang":
      return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700";
  }
};

export const PenilaianKknMahasiswaPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [students, setStudents] = useState<StudentRekapItem[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [activeStudent, setActiveStudent] = useState<StudentRekapItem | null>(null);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterKelompok, setFilterKelompok] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Form State inside Modal
  const [formScores, setFormScores] = useState<{
    skorDplPerencanaan: number | string;
    skorDplKontribusi: number | string;
    skorDplLogbook: number | string;
    skorDplAnalisis: number | string;
    skorDplOutput: number | string;
    skorDplLaporanAkhir: number | string;
    catatanDpl: string;
  }>({
    skorDplPerencanaan: "",
    skorDplKontribusi: "",
    skorDplLogbook: "",
    skorDplAnalisis: "",
    skorDplOutput: "",
    skorDplLaporanAkhir: "",
    catatanDpl: "",
  });

  // Fetch Student List from Database
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await penilaianKknApiService.getRekapPenilaian();
      const list: StudentRekapItem[] = Array.isArray(data) ? data : [];
      setStudents(list);
    } catch (err: any) {
      console.error("Error fetching students:", err);
      toast.error("Gagal memuat data mahasiswa dari server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Modal Open Handler (Direct Editable Form)
  const handleOpenModal = (student: StudentRekapItem) => {
    setActiveStudent(student);
    setFormScores({
      skorDplPerencanaan: student.skorDplPerencanaan || "",
      skorDplKontribusi: student.skorDplKontribusi || "",
      skorDplLogbook: student.skorDplLogbook || "",
      skorDplAnalisis: student.skorDplAnalisis || "",
      skorDplOutput: student.skorDplOutput || "",
      skorDplLaporanAkhir: student.skorDplLaporanAkhir || "",
      catatanDpl: student.catatanDpl || "",
    });
    setIsModalOpen(true);
  };

  // Cancel & Close Modal Directly without saving
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setActiveStudent(null);
  };

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isModalOpen) {
        handleCloseModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen]);

  // Unique Kelompok options
  const uniqueKelompokList = useMemo(() => {
    const setK = new Set<string>();
    students.forEach((s) => {
      if (s.kelompok && s.kelompok !== "-") setK.add(s.kelompok);
    });
    return Array.from(setK);
  }, [students]);

  // Statistics KPI Summary
  const stats = useMemo(() => {
    const total = students.length;
    const sudah = students.filter((s) => s.statusDpl === "SUDAH_DINILAI").length;
    const sedang = students.filter((s) => s.statusDpl === "SEDANG_DINILAI").length;
    const belum = students.filter((s) => s.statusDpl === "BELUM_DINILAI").length;
    const assessedStudents = students.filter((s) => s.subtotalDpl > 0);
    const avgScore =
      assessedStudents.length > 0
        ? assessedStudents.reduce((acc, curr) => acc + curr.subtotalDpl, 0) /
          assessedStudents.length
        : 0;

    return {
      total,
      sudah,
      sedang,
      belum,
      avgScore,
    };
  }, [students]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.nama.toLowerCase().includes(q) ||
        s.nim.toLowerCase().includes(q) ||
        (s.jurusan && s.jurusan.toLowerCase().includes(q)) ||
        (s.programStudi && s.programStudi.toLowerCase().includes(q)) ||
        (s.kelompok && s.kelompok.toLowerCase().includes(q));

      const matchesKelompok =
        filterKelompok === "ALL" || s.kelompok === filterKelompok;

      let matchesStatus = true;
      if (filterStatus !== "ALL") {
        matchesStatus = s.statusDpl === filterStatus;
      }

      return matchesSearch && matchesKelompok && matchesStatus;
    });
  }, [students, searchQuery, filterKelompok, filterStatus]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterKelompok, filterStatus]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / itemsPerPage));
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(start, start + itemsPerPage);
  }, [filteredStudents, currentPage, itemsPerPage]);

  // Calculate live score in Modal
  const computedScores = useMemo(() => {
    const parseNum = (v: number | string) => {
      const n = Number(v);
      return isNaN(n) ? 0 : Math.max(0, Math.min(100, n));
    };

    const s1 = parseNum(formScores.skorDplPerencanaan);
    const s2 = parseNum(formScores.skorDplKontribusi);
    const s3 = parseNum(formScores.skorDplLogbook);
    const s4 = parseNum(formScores.skorDplAnalisis);
    const s5 = parseNum(formScores.skorDplOutput);
    const s6 = parseNum(formScores.skorDplLaporanAkhir);

    const score1 = Number(((s1 * 20) / 100).toFixed(2));
    const score2 = Number(((s2 * 10) / 100).toFixed(2));
    const score3 = Number(((s3 * 20) / 100).toFixed(2));
    const score4 = Number(((s4 * 20) / 100).toFixed(2));
    const score5 = Number(((s5 * 20) / 100).toFixed(2));
    const score6 = Number(((s6 * 10) / 100).toFixed(2));

    const total = Number((score1 + score2 + score3 + score4 + score5 + score6).toFixed(2));
    const predikat = total > 0 ? getPredikat(total) : "Belum Dinilai";

    return {
      scores: [score1, score2, score3, score4, score5, score6],
      total,
      predikat,
    };
  }, [formScores]);

  // Handle Input Change for Scores
  const handleScoreChange = (
    key: keyof typeof formScores,
    val: string
  ) => {
    if (val === "") {
      setFormScores((prev) => ({ ...prev, [key]: "" }));
      return;
    }
    const num = parseInt(val, 10);
    if (!isNaN(num)) {
      const clamped = Math.max(0, Math.min(100, num));
      setFormScores((prev) => ({ ...prev, [key]: clamped }));
    }
  };

  // Save Penilaian to Database
  const handleSave = async () => {
    if (!activeStudent) {
      toast.error("Pilih mahasiswa terlebih dahulu");
      return;
    }

    setSaving(true);
    try {
      const parseNum = (v: number | string) => (v === "" ? 0 : Number(v));

      const payload = {
        studentId: activeStudent.studentId,
        skorDplPerencanaan: parseNum(formScores.skorDplPerencanaan),
        skorDplKontribusi: parseNum(formScores.skorDplKontribusi),
        skorDplLogbook: parseNum(formScores.skorDplLogbook),
        skorDplAnalisis: parseNum(formScores.skorDplAnalisis),
        skorDplOutput: parseNum(formScores.skorDplOutput),
        skorDplLaporanAkhir: parseNum(formScores.skorDplLaporanAkhir),
        catatanDpl: formScores.catatanDpl,
      };

      await penilaianKknApiService.savePenilaian(payload);

      // Determine updated status
      const hasAny = Object.values(payload).some(
        (v, i) => i < 6 && typeof v === "number" && v > 0
      );
      const hasAll =
        payload.skorDplPerencanaan > 0 &&
        payload.skorDplKontribusi > 0 &&
        payload.skorDplLogbook > 0 &&
        payload.skorDplAnalisis > 0 &&
        payload.skorDplOutput > 0 &&
        payload.skorDplLaporanAkhir > 0;

      const newStatusDpl = hasAll
        ? ("SUDAH_DINILAI" as const)
        : hasAny
        ? ("SEDANG_DINILAI" as const)
        : ("BELUM_DINILAI" as const);

      const updatedStudent: StudentRekapItem = {
        ...activeStudent,
        ...payload,
        subtotalDpl: computedScores.total,
        nilaiAkhir: computedScores.total,
        kategori: computedScores.predikat,
        statusDpl: newStatusDpl,
      };

      // Update state locally
      setStudents((prev) =>
        prev.map((s) => (s.studentId === activeStudent.studentId ? updatedStudent : s))
      );

      toast.success("Penilaian berhasil disimpan ke database!");
      handleCloseModal();
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error(err.response?.data?.message || err.message || "Gagal menyimpan penilaian");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#f8fafc] dark:bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-6 text-slate-800 dark:text-slate-100 max-w-[1600px] mx-auto">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
            <Award className="text-[#009966] w-6 h-6 shrink-0" />
            <span>Penilaian Individu Mahasiswa</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Evaluasi capaian 6 aspek akademik bimbingan Dosen Pendamping Lapangan (DPL) mahasiswa KKN
          </p>
        </div>

        <button
          type="button"
          onClick={fetchStudents}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-all shadow-2xs cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw size={13} className={loading ? "animate-spin text-[#009966]" : "text-[#009966]"} />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* Metric Cards KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block">Total Mahasiswa</span>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold block">Sudah Dinilai</span>
          <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats.sudah}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold block">Sedang Dinilai</span>
          <p className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{stats.sedang}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block">Belum Dinilai</span>
          <p className="text-xl sm:text-2xl font-black text-slate-700 dark:text-slate-300 mt-1">{stats.belum}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs col-span-2 sm:col-span-1">
          <span className="text-[11px] text-[#009966] dark:text-emerald-400 font-semibold block">Rerata Nilai DPL</span>
          <p className="text-xl sm:text-2xl font-black text-[#009966] dark:text-emerald-400 mt-1">
            {stats.avgScore > 0 ? stats.avgScore.toFixed(2) : "—"}
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3.5">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari NIM, nama, prodi, atau kelompok..."
            className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#009966]/20 focus:border-[#009966] transition"
          />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full sm:w-auto">
          {/* Filter Kelompok */}
          <div className="w-full sm:w-48">
            <select
              value={filterKelompok}
              onChange={(e) => setFilterKelompok(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#009966]/20 focus:border-[#009966] transition cursor-pointer"
            >
              <option value="ALL">Semua Kelompok</option>
              {uniqueKelompokList.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Status */}
          <div className="w-full sm:w-44">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#009966]/20 focus:border-[#009966] transition cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="BELUM_DINILAI">Belum Dinilai</option>
              <option value="SEDANG_DINILAI">Sedang Dinilai</option>
              <option value="SUDAH_DINILAI">Sudah Dinilai</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Full-Width Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="animate-spin text-[#009966]" size={32} />
            <span className="text-xs font-semibold">Memuat data penilaian mahasiswa...</span>
          </div>
        ) : filteredStudents.length === 0 ? (
          <EmptyTableState
            entityName="Mahasiswa"
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
                <tr className="bg-slate-50/90 dark:bg-slate-800/90 text-slate-500 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider font-bold">
                  <th className="py-3.5 px-4 w-12 text-center">No</th>
                  <th className="py-3.5 px-4 min-w-[130px]">NIM</th>
                  <th className="py-3.5 px-4 min-w-[220px]">Nama Mahasiswa</th>
                  <th className="py-3.5 px-4 min-w-[160px]">Program Studi</th>
                  <th className="py-3.5 px-4 min-w-[140px]">Kelompok</th>
                  <th className="py-3.5 px-4 text-center min-w-[110px]">Nilai DPL</th>
                  <th className="py-3.5 px-4 text-center min-w-[120px]">Predikat</th>
                  <th className="py-3.5 px-4 text-center min-w-[130px]">Status</th>
                  <th className="py-3.5 px-4 text-center min-w-[120px]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {paginatedStudents.map((s, idx) => {
                  const rowNumber = (currentPage - 1) * itemsPerPage + idx + 1;
                  const predikatText = s.kategori || (s.subtotalDpl > 0 ? getPredikat(s.subtotalDpl) : "Belum Dinilai");

                  return (
                    <tr
                      key={s.studentId}
                      className="hover:bg-slate-50/80 dark:bg-slate-800/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* No */}
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                        {rowNumber}
                      </td>

                      {/* NIM */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {s.nim || "-"}
                      </td>

                      {/* Nama Mahasiswa */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <span>{s.nama}</span>
                        </div>
                        {s.rw && (
                          <span className="text-[10.5px] text-slate-400 font-normal block mt-0.5">
                            Wilayah Binaan: RW {s.rw}
                          </span>
                        )}
                      </td>

                      {/* Program Studi */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        {s.jurusan || s.programStudi || "S1 Teknik"}
                      </td>

                      {/* Kelompok */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold">
                          <Users size={13} className="text-slate-400 shrink-0" />
                          <span>{s.kelompok || "Kelompok KKN"}</span>
                        </span>
                      </td>

                      {/* Nilai DPL */}
                      <td className="py-3.5 px-4 text-center font-black text-sm text-slate-900 dark:text-slate-100">
                        {s.subtotalDpl > 0 ? Number(s.subtotalDpl).toFixed(2) : "—"}
                      </td>

                      {/* Predikat */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${getPredikatBadgeClass(
                            predikatText
                          )}`}
                        >
                          {predikatText}
                        </span>
                      </td>

                      {/* Status Penilaian Badge */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {s.statusDpl === "SUDAH_DINILAI" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Sudah Dinilai
                          </span>
                        ) : s.statusDpl === "SEDANG_DINILAI" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Sedang Dinilai
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Belum Dinilai
                          </span>
                        )}
                      </td>

                      {/* Aksi Button */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {s.statusDpl === "SEDANG_DINILAI" ? (
                          <button
                            type="button"
                            onClick={() => handleOpenModal(s)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#009966] hover:bg-[#008055] text-white shadow-2xs transition cursor-pointer"
                          >
                            <Edit3 size={12} />
                            <span>Lanjutkan</span>
                          </button>
                        ) : s.statusDpl === "SUDAH_DINILAI" ? (
                          <button
                            type="button"
                            onClick={() => handleOpenModal(s)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border border-[#009966] text-[#009966] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition cursor-pointer"
                          >
                            <Edit3 size={12} />
                            <span>Ubah Nilai</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenModal(s)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#009966] hover:bg-[#008055] text-white shadow-2xs transition cursor-pointer"
                          >
                            <Award size={12} />
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

        {/* Pagination Controls */}
        {filteredStudents.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredStudents.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            itemsPerPageOptions={[10, 25, 50, 100]}
          />
        )}
      </div>

      {/* POP-UP MODAL: FORM PENILAIAN INDIVIDU */}
      {isModalOpen && activeStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden my-auto animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-[#009966] flex items-center justify-center shrink-0">
                  <GraduationCap size={20} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                    Form Penilaian Individu Mahasiswa
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    6 Aspek Akademik Dosen Pendamping Lapangan (DPL)
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="overflow-y-auto p-5 sm:p-6 space-y-5">
              {/* Student Detail Banner */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/70 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-[#009966]/10 border border-[#009966]/20 text-[#009966] flex items-center justify-center shrink-0">
                    <User size={24} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                      {activeStudent.nama}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      NIM: <strong className="text-slate-700 dark:text-slate-300 font-mono">{activeStudent.nim || "-"}</strong> •{" "}
                      {activeStudent.jurusan || activeStudent.programStudi || "S1 Teknik"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <div className="px-3 py-1.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {activeStudent.kelompok || "Kelompok KKN"}
                  </div>
                </div>
              </div>

              {/* Rubric Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Aspek Penilaian Akademik
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Rentang Nilai: <strong>0 – 100</strong>
                  </span>
                </div>

                <div className="border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/90 dark:bg-slate-800/90 text-slate-500 border-b border-slate-200 dark:border-slate-800 text-[10.5px] uppercase tracking-wider font-bold">
                        <th className="py-2.5 px-3 w-8 text-center">No</th>
                        <th className="py-2.5 px-3">Aspek Penilaian</th>
                        <th className="py-2.5 px-3 text-center w-16">Bobot</th>
                        <th className="py-2.5 px-3 text-center w-28">Nilai</th>
                        <th className="py-2.5 px-3 text-right w-20">Skor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                      {ASPEK_DPL_CONFIG.map((aspek, idx) => {
                        const val = formScores[aspek.key];
                        const computedSkor = computedScores.scores[idx];

                        return (
                          <tr
                            key={aspek.key}
                            className="hover:bg-slate-50/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/20"
                          >
                            <td className="py-2.5 px-3 text-center font-bold text-slate-400">
                              {aspek.no}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-800 dark:text-slate-200">
                                {aspek.title}
                              </div>
                              <div className="text-[10.5px] text-slate-400 mt-0.5">
                                {aspek.deskripsi}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-center text-slate-500 font-bold">
                              {aspek.bobot}%
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <div className="inline-flex items-center gap-1 border rounded-xl px-2 py-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-2xs focus-within:ring-2 focus-within:ring-[#009966]/20 focus-within:border-[#009966] transition">
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={val}
                                  onChange={(e) =>
                                    handleScoreChange(aspek.key, e.target.value)
                                  }
                                  placeholder="0"
                                  className="w-10 text-center text-xs font-black text-slate-900 dark:text-slate-100 bg-transparent focus:outline-none"
                                />
                                <span className="text-[10px] text-slate-400 font-medium">/ 100</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right font-black text-slate-800 dark:text-slate-200">
                              {computedSkor.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}

                      {/* Total Row */}
                      <tr className="bg-slate-50/70 dark:bg-slate-800/70 font-bold border-t border-slate-200 dark:border-slate-700">
                        <td colSpan={2} className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                          Total Bobot Penilaian
                        </td>
                        <td className="py-2.5 px-3 text-center text-[#009966] dark:text-emerald-400 font-black">
                          100%
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-500 font-semibold text-[11px]">
                          Akumulasi Nilai:
                        </td>
                        <td className="py-2.5 px-3 text-right text-base font-black text-[#009966] dark:text-emerald-400">
                          {computedScores.total.toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary Cards: Nilai Akhir & Predikat */}
              <div className="grid grid-cols-2 gap-3.5 bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-4">
                <div className="text-center">
                  <span className="text-[10.5px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block">
                    Nilai Akhir DPL
                  </span>
                  <span className="text-3xl font-black text-[#009966] dark:text-emerald-400 mt-0.5 block">
                    {computedScores.total.toFixed(2)}
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-[10.5px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block">
                    Predikat Capaian
                  </span>
                  <span className="text-lg sm:text-xl font-black text-[#009966] dark:text-emerald-400 mt-1 block">
                    {computedScores.predikat}
                  </span>
                </div>
              </div>

              {/* Catatan DPL */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FileText size={13} className="text-[#009966]" />
                  <span>Catatan Evaluasi / Umpan Balik DPL</span>
                </label>
                <textarea
                  rows={3}
                  value={formScores.catatanDpl}
                  onChange={(e) =>
                    setFormScores((prev) => ({
                      ...prev,
                      catatanDpl: e.target.value,
                    }))
                  }
                  placeholder="Tuliskan catatan apresiasi, evaluasi, atau rekomendasi perbaikan untuk mahasiswa..."
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-[#009966]/20 focus:border-[#009966] rounded-2xl p-3.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none transition resize-none"
                />
              </div>
            </div>

            {/* Modal Footer (Clean Action Bar) */}
            <div className="px-5 sm:px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={handleSave}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#009966] hover:bg-[#008055] text-white shadow-sm transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    <span>
                      {activeStudent.statusDpl === "SUDAH_DINILAI"
                        ? "Simpan Perubahan"
                        : "Simpan Nilai"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PenilaianKknMahasiswaPage;
