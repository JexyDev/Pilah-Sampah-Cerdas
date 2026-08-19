/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Halaman Penilaian Individu Mahasiswa KKN (Role DPL)
 * Sesuai Acuan Desain Mockup Resmi (Two-Column Split Master-Detail Layout):
 * - Kolom Kiri: Tabel Mahasiswa Bimbingan dengan Filter 3-arah, highlight baris aktif, dan tombol aksi dinamis
 * - Kolom Kanan: Form Penilaian 6 Aspek Akademik DPL (Bobot 20%, 20%, 20%, 15%, 15%, 10%), live score calculation, & feedback
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  User,
  ChevronDown,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/useAuthStore";
import { penilaianKknApiService } from "../../services/penilaianKknApiService";

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

export const PenilaianKknMahasiswaPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const displayName = user?.name || "Dr. Agus Mulyana, M.T.";

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterKelompok, setFilterKelompok] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5;

  // Form State (6 Aspek DPL: 0-100)
  const [formScores, setFormScores] = useState<{
    skorDplPerencanaan: number | string;
    skorDplKontribusi: number | string;
    skorDplLogbook: number | string;
    skorDplAnalisis: number | string;
    skorDplOutput: number | string;
    skorDplLaporanAkhir: number | string;
  }>({
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

      // Auto-select first student if none selected or selected not in list
      if (list.length > 0) {
        setSelectedStudentId((prev) => {
          const exists = list.some((st) => st.studentId === prev);
          return exists ? prev : list[0].studentId;
        });
      }
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

  // Selected Student Object
  const selectedStudent = useMemo(() => {
    return students.find((s) => s.studentId === selectedStudentId) || students[0] || null;
  }, [students, selectedStudentId]);

  // When selected student changes, populate form values
  useEffect(() => {
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
    }
  }, [selectedStudent]);

  // Helper to calculate aspect score: (Nilai * Bobot) / 100
  const calcScore = (scoreVal: number | string, weight: number): number => {
    const num = Number(scoreVal) || 0;
    const safe = Math.max(0, Math.min(100, num));
    return Number(((safe * weight) / 100).toFixed(1));
  };

  // Calculated Individual Scores
  const skor1 = calcScore(formScores.skorDplPerencanaan, 20);
  const skor2 = calcScore(formScores.skorDplKontribusi, 20);
  const skor3 = calcScore(formScores.skorDplLogbook, 20);
  const skor4 = calcScore(formScores.skorDplAnalisis, 15);
  const skor5 = calcScore(formScores.skorDplOutput, 15);
  const skor6 = calcScore(formScores.skorDplLaporanAkhir, 10);

  // Nilai Akhir DPL (Sum of 6 calculated aspect scores)
  const calculatedFinalScore = useMemo(() => {
    const rawSum = skor1 + skor2 + skor3 + skor4 + skor5 + skor6;
    return Number(rawSum.toFixed(1));
  }, [skor1, skor2, skor3, skor4, skor5, skor6]);

  // Predikat Nilai
  const calculatedPredicate = useMemo(() => {
    if (calculatedFinalScore >= 85) return "Sangat Baik";
    if (calculatedFinalScore >= 75) return "Baik";
    if (calculatedFinalScore >= 65) return "Cukup";
    if (calculatedFinalScore >= 55) return "Kurang";
    if (calculatedFinalScore > 0) return "Sangat Kurang";
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
        matchStatus = s.statusDpl === "BELUM_DINILAI";
      } else if (filterStatus === "SUDAH_DINILAI") {
        matchStatus = s.statusDpl === "SUDAH_DINILAI";
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

  const handleScoreInputChange = (
    field: keyof typeof formScores,
    val: string
  ) => {
    if (val === "") {
      setFormScores((prev) => ({ ...prev, [field]: "" }));
      return;
    }
    const num = Number(val);
    if (isNaN(num)) return;
    const clamped = Math.max(0, Math.min(100, num));
    setFormScores((prev) => ({ ...prev, [field]: clamped }));
  };

  const handleSelectStudent = (student: StudentItem) => {
    setSelectedStudentId(student.studentId);
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
    } catch (err: any) {
      console.error("Gagal menyimpan nilai:", err);
      toast.error(err.response?.data?.message || "Gagal menyimpan penilaian mahasiswa");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-5 text-slate-800 dark:text-slate-100 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Penilaian Individu Mahasiswa
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Berikan nilai secara objektif berdasarkan kinerja individu mahasiswa KKN
          </p>
        </div>

        {/* User Profile Pill in Top Right */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-1.5 rounded-full shadow-2xs">
          <div className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
            <User size={15} />
          </div>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {displayName}
          </span>
          <ChevronDown size={14} className="text-slate-400" />
        </div>
      </div>

      {/* Main Two-Column Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ========================================================================= */}
        {/* KOLOM KIRI: DAFTAR MAHASISWA & FILTER */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 space-y-3.5">
          {/* Baris Filter & Search */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Cari NIM atau nama mahasiswa..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-8.5 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-[#009966] focus:ring-1 focus:ring-[#009966] transition shadow-2xs"
              />
            </div>

            {/* Dropdown Kelompok */}
            <div className="relative shrink-0">
              <select
                value={filterKelompok}
                onChange={(e) => {
                  setFilterKelompok(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-3 pr-8 py-2 text-xs text-slate-700 dark:text-slate-300 font-medium outline-none focus:border-[#009966] shadow-2xs cursor-pointer"
              >
                <option value="ALL">Semua Kelompok</option>
                {uniqueKelompokList.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>

            {/* Dropdown Status */}
            <div className="relative shrink-0">
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-3 pr-8 py-2 text-xs text-slate-700 dark:text-slate-300 font-medium outline-none focus:border-[#009966] shadow-2xs cursor-pointer"
              >
                <option value="ALL">Semua Status</option>
                <option value="SEDANG_DINILAI">Sedang Dinilai</option>
                <option value="BELUM_DINILAI">Belum Dinilai</option>
                <option value="SUDAH_DINILAI">Sudah Dinilai</option>
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>

          {/* Tabel Mahasiswa */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-400">
                <Loader2 size={24} className="animate-spin text-[#009966]" />
                <span className="text-xs font-medium">Memuat data mahasiswa...</span>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                Tidak ada data mahasiswa yang sesuai dengan filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-50/70 dark:bg-slate-800/60">
                      <th className="py-3 px-3 text-center w-10">No.</th>
                      <th className="py-3 px-3">NIM</th>
                      <th className="py-3 px-3">Nama Mahasiswa</th>
                      <th className="py-3 px-3">Prodi</th>
                      <th className="py-3 px-3">Kelompok</th>
                      <th className="py-3 px-3 text-center">Nilai</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-normal text-slate-700 dark:text-slate-300">
                    {paginatedStudents.map((st, idx) => {
                      const isSelected = st.studentId === selectedStudentId;
                      const hasScore = st.statusDpl === "SUDAH_DINILAI" || st.subtotalDpl > 0;
                      const isPending = st.statusDpl === "SEDANG_DINILAI";

                      return (
                        <tr
                          key={st.studentId}
                          onClick={() => handleSelectStudent(st)}
                          className={`transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-[#f0fdf4] dark:bg-emerald-950/20 border-l-[3px] border-[#009966]"
                              : "border-l-[3px] border-transparent hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                          }`}
                        >
                          <td className="py-3.5 px-3 text-center text-slate-600 dark:text-slate-400 font-medium">
                            {startIndex + idx + 1}
                          </td>
                          <td className="py-3.5 px-3 font-mono text-slate-700 dark:text-slate-300">
                            {st.nim}
                          </td>
                          <td className="py-3.5 px-3 font-bold text-slate-900 dark:text-slate-100">
                            {st.nama}
                          </td>
                          <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400">
                            {st.jurusan || "-"}
                          </td>
                          <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400 leading-snug">
                            <div>{st.kelompok}</div>
                            {st.kelurahan && st.kelurahan !== "-" && (
                              <div className="text-[10.5px] text-slate-400 dark:text-slate-500">
                                {st.kelurahan}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-3 text-center font-bold text-slate-900 dark:text-slate-100">
                            {hasScore ? (
                              st.subtotalDpl % 1 === 0 ? st.subtotalDpl : st.subtotalDpl.toFixed(1)
                            ) : (
                              <span className="text-slate-400 font-normal">—</span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            {isPending ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-semibold bg-[#fffbeb] text-[#d97706] border border-[#fef3c7] dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#d97706]"></span>
                                <span>Sedang Dinilai</span>
                              </span>
                            ) : hasScore ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-semibold bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0] dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#047857]"></span>
                                <span>Sudah Dinilai</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-semibold bg-[#f8fafc] text-[#64748b] border border-[#e2e8f0] dark:bg-slate-800/80 dark:text-slate-400 dark:border-slate-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#94a3b8]"></span>
                                <span>Belum Dinilai</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            {isPending ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectStudent(st);
                                }}
                                className="px-3 py-1 rounded-md text-xs font-semibold bg-[#009966] hover:bg-[#008055] text-white transition shadow-2xs cursor-pointer"
                              >
                                Lanjutkan
                              </button>
                            ) : hasScore ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectStudent(st);
                                }}
                                className="px-3 py-1 rounded-md text-xs font-semibold border border-[#009966] text-[#009966] bg-white hover:bg-emerald-50 dark:bg-slate-900 dark:hover:bg-emerald-950/30 transition cursor-pointer"
                              >
                                Lihat Nilai
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectStudent(st);
                                }}
                                className="px-3 py-1 rounded-md text-xs font-semibold border border-[#009966] text-[#009966] bg-white hover:bg-emerald-50 dark:bg-slate-900 dark:hover:bg-emerald-950/30 transition cursor-pointer"
                              >
                                Beri Nilai
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

            {/* Pagination Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
              <div>
                Menampilkan {filteredStudents.length > 0 ? startIndex + 1 : 0}–
                {endIndex} dari {filteredStudents.length} mahasiswa
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="w-7 h-7 rounded-md border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft size={14} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded-md text-xs font-semibold flex items-center justify-center transition cursor-pointer ${
                      currentPage === pageNum
                        ? "bg-[#009966] text-white"
                        : "border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="w-7 h-7 rounded-md border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* KOLOM KANAN: FORM PENILAIAN INDIVIDU */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs space-y-4">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
            Form Penilaian Individu
          </h2>

          {/* Kartu Profil Mahasiswa Terpilih */}
          <div className="bg-[#f0fdf4] dark:bg-emerald-950/30 border border-emerald-200/90 dark:border-emerald-800/60 rounded-xl p-3.5 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-white dark:bg-slate-900 border-2 border-[#009966] text-[#009966] dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-2xs">
              <User size={22} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                {selectedStudent?.nama || "Pilih Mahasiswa"}
              </h3>
              <p className="text-[11.5px] text-slate-600 dark:text-slate-400 mt-0.5">
                NIM {selectedStudent?.nim || "-"} &bull; {selectedStudent?.jurusan || "S1 Akuntansi"}
              </p>
              <p className="text-[11.5px] text-slate-600 dark:text-slate-400">
                {selectedStudent?.kelompok || "Kelompok KKN"}{" "}
                {selectedStudent?.kelurahan && selectedStudent.kelurahan !== "-" ? selectedStudent.kelurahan : ""}
              </p>
            </div>
          </div>

          {/* Tabel Aspek Akademik DPL */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Aspek Akademik DPL
            </h4>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    <th className="py-2.5 px-2.5 text-center w-8">No.</th>
                    <th className="py-2.5 px-2.5">Aspek Penilaian</th>
                    <th className="py-2.5 px-2.5 text-center w-14">Bobot</th>
                    <th className="py-2.5 px-2.5 text-center w-28">Nilai</th>
                    <th className="py-2.5 px-2.5 text-right w-14">Skor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                  {/* Aspek 1 */}
                  <tr>
                    <td className="py-2.5 px-2.5 text-center text-slate-500">1</td>
                    <td className="py-2.5 px-2.5 font-medium">Perencanaan & Pemahaman Program</td>
                    <td className="py-2.5 px-2.5 text-center text-slate-500 font-medium">20%</td>
                    <td className="py-2.5 px-2.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={formScores.skorDplPerencanaan}
                          onChange={(e) => handleScoreInputChange("skorDplPerencanaan", e.target.value)}
                          className="w-14 px-2 py-1 text-center font-bold text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-[#009966] focus:ring-1 focus:ring-[#009966]"
                        />
                        <span className="text-[10px] text-slate-400">0–100</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-semibold text-slate-800 dark:text-slate-200">
                      {skor1.toFixed(1)}
                    </td>
                  </tr>

                  {/* Aspek 2 */}
                  <tr>
                    <td className="py-2.5 px-2.5 text-center text-slate-500">2</td>
                    <td className="py-2.5 px-2.5 font-medium">Kontribusi Individu</td>
                    <td className="py-2.5 px-2.5 text-center text-slate-500 font-medium">20%</td>
                    <td className="py-2.5 px-2.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={formScores.skorDplKontribusi}
                          onChange={(e) => handleScoreInputChange("skorDplKontribusi", e.target.value)}
                          className="w-14 px-2 py-1 text-center font-bold text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-[#009966] focus:ring-1 focus:ring-[#009966]"
                        />
                        <span className="text-[10px] text-slate-400">0–100</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-semibold text-slate-800 dark:text-slate-200">
                      {skor2.toFixed(1)}
                    </td>
                  </tr>

                  {/* Aspek 3 */}
                  <tr>
                    <td className="py-2.5 px-2.5 text-center text-slate-500">3</td>
                    <td className="py-2.5 px-2.5 font-medium">Logbook & Dokumentasi Akademik</td>
                    <td className="py-2.5 px-2.5 text-center text-slate-500 font-medium">20%</td>
                    <td className="py-2.5 px-2.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={formScores.skorDplLogbook}
                          onChange={(e) => handleScoreInputChange("skorDplLogbook", e.target.value)}
                          className="w-14 px-2 py-1 text-center font-bold text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-[#009966] focus:ring-1 focus:ring-[#009966]"
                        />
                        <span className="text-[10px] text-slate-400">0–100</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-semibold text-slate-800 dark:text-slate-200">
                      {skor3.toFixed(1)}
                    </td>
                  </tr>

                  {/* Aspek 4 */}
                  <tr>
                    <td className="py-2.5 px-2.5 text-center text-slate-500">4</td>
                    <td className="py-2.5 px-2.5 font-medium">Analisis Masalah & Solusi</td>
                    <td className="py-2.5 px-2.5 text-center text-slate-500 font-medium">15%</td>
                    <td className="py-2.5 px-2.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={formScores.skorDplAnalisis}
                          onChange={(e) => handleScoreInputChange("skorDplAnalisis", e.target.value)}
                          className="w-14 px-2 py-1 text-center font-bold text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-[#009966] focus:ring-1 focus:ring-[#009966]"
                        />
                        <span className="text-[10px] text-slate-400">0–100</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-semibold text-slate-800 dark:text-slate-200">
                      {skor4.toFixed(1)}
                    </td>
                  </tr>

                  {/* Aspek 5 */}
                  <tr>
                    <td className="py-2.5 px-2.5 text-center text-slate-500">5</td>
                    <td className="py-2.5 px-2.5 font-medium">Output, Outcome, & Dampak</td>
                    <td className="py-2.5 px-2.5 text-center text-slate-500 font-medium">15%</td>
                    <td className="py-2.5 px-2.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={formScores.skorDplOutput}
                          onChange={(e) => handleScoreInputChange("skorDplOutput", e.target.value)}
                          className="w-14 px-2 py-1 text-center font-bold text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-[#009966] focus:ring-1 focus:ring-[#009966]"
                        />
                        <span className="text-[10px] text-slate-400">0–100</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-semibold text-slate-800 dark:text-slate-200">
                      {skor5.toFixed(1)}
                    </td>
                  </tr>

                  {/* Aspek 6 */}
                  <tr>
                    <td className="py-2.5 px-2.5 text-center text-slate-500">6</td>
                    <td className="py-2.5 px-2.5 font-medium">Laporan Akhir, Evaluasi & Refleksi</td>
                    <td className="py-2.5 px-2.5 text-center text-slate-500 font-medium">10%</td>
                    <td className="py-2.5 px-2.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={formScores.skorDplLaporanAkhir}
                          onChange={(e) => handleScoreInputChange("skorDplLaporanAkhir", e.target.value)}
                          className="w-14 px-2 py-1 text-center font-bold text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-[#009966] focus:ring-1 focus:ring-[#009966]"
                        />
                        <span className="text-[10px] text-slate-400">0–100</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-semibold text-slate-800 dark:text-slate-200">
                      {skor6.toFixed(1)}
                    </td>
                  </tr>

                  {/* Total Bobot Row */}
                  <tr className="bg-slate-50/70 dark:bg-slate-800/60 font-semibold border-t border-slate-200 dark:border-slate-800 text-[11.5px]">
                    <td colSpan={2} className="py-2.5 px-3 text-slate-800 dark:text-slate-200">
                      Total Bobot
                    </td>
                    <td className="py-2.5 px-2.5 text-center text-slate-800 dark:text-slate-200">
                      100%
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Nilai Akhir & Predikat Panel */}
          <div className="bg-[#f0fdf4] dark:bg-emerald-950/20 border border-emerald-200/90 dark:border-emerald-800/60 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium block">
                Nilai Akhir
              </span>
              <span className="text-3xl font-bold text-[#009966] dark:text-emerald-400 tracking-tight block mt-0.5">
                {calculatedFinalScore > 0 ? calculatedFinalScore.toFixed(1) : "0.0"}
              </span>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium block">
                Predikat:
              </span>
              <span className="text-base sm:text-lg font-bold text-[#009966] dark:text-emerald-400 block mt-0.5">
                {calculatedPredicate}
              </span>
            </div>
          </div>

          {/* Catatan DPL */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
              Catatan DPL
            </label>
            <textarea
              rows={3}
              value={catatanDpl}
              onChange={(e) => setCatatanDpl(e.target.value)}
              placeholder="Tuliskan catatan atau umpan balik untuk mahasiswa..."
              className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-[#009966] focus:ring-1 focus:ring-[#009966] resize-none placeholder-slate-400 shadow-2xs"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleResetForm}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={saving || !selectedStudent}
              onClick={handleSaveScore}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#009966] hover:bg-[#008055] transition shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving && <Loader2 size={13} className="animate-spin" />}
              <span>Simpan Nilai</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PenilaianKknMahasiswaPage;
