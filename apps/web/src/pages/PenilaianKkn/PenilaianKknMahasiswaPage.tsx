/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Halaman Penilaian Individu Mahasiswa KKN (6 Aspek Akademik DPL)
 * Desain Master-Detail 2-Panel Side-by-Side Berseka Clean
 * - Paginasi: 10 Rekord per halaman
 * - Mode Lihat & Edit Nilai (khusus data yang sudah dinilai)
 * 100% Real Database PostgreSQL Integration via Prisma
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  User,
  Loader2,
  GraduationCap,
  Edit3,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  penilaianKknApiService,
  type StudentRekapItem,
} from "../../services/penilaianKknApiService";

// 6 Aspek Akademik DPL (Total Bobot 100%)
const ASPEK_DPL_CONFIG = [
  {
    key: "skorDplPerencanaan" as const,
    no: 1,
    title: "Perencanaan & Pemahaman Program",
    bobot: 20,
  },
  {
    key: "skorDplKontribusi" as const,
    no: 2,
    title: "Kontribusi Individu",
    bobot: 20,
  },
  {
    key: "skorDplLogbook" as const,
    no: 3,
    title: "Logbook & Dokumentasi Akademik",
    bobot: 20,
  },
  {
    key: "skorDplAnalisis" as const,
    no: 4,
    title: "Analisis Masalah & Solusi",
    bobot: 15,
  },
  {
    key: "skorDplOutput" as const,
    no: 5,
    title: "Output, Outcome, & Dampak",
    bobot: 15,
  },
  {
    key: "skorDplLaporanAkhir" as const,
    no: 6,
    title: "Laporan Akhir, Esai Lap. & Refleksi",
    bobot: 10,
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

export const PenilaianKknMahasiswaPage: React.FC = () => {
  const formRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [students, setStudents] = useState<StudentRekapItem[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  // Filters & Pagination (10 per halaman)
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterKelompok, setFilterKelompok] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Form State
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

      // Default select first student if available and none selected
      if (list.length > 0 && !selectedStudentId) {
        selectStudent(list[0]);
      }
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

  // Handler Select Student
  const selectStudent = (student: StudentRekapItem, forceEdit?: boolean) => {
    setSelectedStudentId(student.studentId);
    setIsEditMode(
      forceEdit !== undefined
        ? forceEdit
        : student.statusDpl !== "SUDAH_DINILAI"
    );
    setFormScores({
      skorDplPerencanaan: student.skorDplPerencanaan || "",
      skorDplKontribusi: student.skorDplKontribusi || "",
      skorDplLogbook: student.skorDplLogbook || "",
      skorDplAnalisis: student.skorDplAnalisis || "",
      skorDplOutput: student.skorDplOutput || "",
      skorDplLaporanAkhir: student.skorDplLaporanAkhir || "",
      catatanDpl: student.catatanDpl || "",
    });
  };

  const handleActionClick = (student: StudentRekapItem) => {
    const shouldEdit = student.statusDpl !== "SUDAH_DINILAI";
    selectStudent(student, shouldEdit);
    if (window.innerWidth < 1024) {
      formRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Selected Student Object
  const selectedStudent = useMemo(() => {
    return students.find((s) => s.studentId === selectedStudentId) || null;
  }, [students, selectedStudentId]);

  // Unique Kelompok options
  const uniqueKelompokList = useMemo(() => {
    const setK = new Set<string>();
    students.forEach((s) => {
      if (s.kelompok && s.kelompok !== "-") setK.add(s.kelompok);
    });
    return Array.from(setK);
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
        (s.programStudi && s.programStudi.toLowerCase().includes(q));

      const matchesKelompok =
        filterKelompok === "ALL" || s.kelompok === filterKelompok;

      let matchesStatus = true;
      if (filterStatus !== "ALL") {
        matchesStatus = s.statusDpl === filterStatus;
      }

      return matchesSearch && matchesKelompok && matchesStatus;
    });
  }, [students, searchQuery, filterKelompok, filterStatus]);

  // Pagination (10 per halaman)
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / itemsPerPage));
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(start, start + itemsPerPage);
  }, [filteredStudents, currentPage, itemsPerPage]);

  // Calculate live score in right form
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

    const score1 = Number(((s1 * 20) / 100).toFixed(1));
    const score2 = Number(((s2 * 20) / 100).toFixed(1));
    const score3 = Number(((s3 * 20) / 100).toFixed(1));
    const score4 = Number(((s4 * 15) / 100).toFixed(1));
    const score5 = Number(((s5 * 15) / 100).toFixed(1));
    const score6 = Number(((s6 * 10) / 100).toFixed(1));

    const total = Number((score1 + score2 + score3 + score4 + score5 + score6).toFixed(1));
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
    if (!isEditMode) return;
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

  // Reset / Batal
  const handleBatal = () => {
    if (selectedStudent) {
      selectStudent(
        selectedStudent,
        selectedStudent.statusDpl !== "SUDAH_DINILAI"
      );
      toast("Nilai dikembalikan ke data sebelumnya", { icon: "↩️" });
    }
  };

  // Save Penilaian to Database
  const handleSave = async () => {
    if (!selectedStudent) {
      toast.error("Pilih mahasiswa terlebih dahulu");
      return;
    }

    setSaving(true);
    try {
      const parseNum = (v: number | string) => (v === "" ? 0 : Number(v));

      const payload = {
        studentId: selectedStudent.studentId,
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

      // Update state locally
      setStudents((prev) =>
        prev.map((s) => {
          if (s.studentId === selectedStudent.studentId) {
            return {
              ...s,
              ...payload,
              subtotalDpl: computedScores.total,
              nilaiAkhir: computedScores.total,
              kategori: computedScores.predikat,
              statusDpl: newStatusDpl,
            };
          }
          return s;
        })
      );

      // Set to view mode after saving if fully graded
      if (newStatusDpl === "SUDAH_DINILAI") {
        setIsEditMode(false);
      }

      toast.success("Penilaian berhasil disimpan ke database!");
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error(err.response?.data?.message || err.message || "Gagal menyimpan penilaian");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#f8fafc] dark:bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-6 text-slate-800 dark:text-slate-100">
      {/* Header Halaman */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Penilaian Individu Mahasiswa
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Berikan nilai secara objektif berdasarkan kinerja individu mahasiswa KKN
        </p>
      </div>

      {/* Main 2-Panel Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* PANEL KIRI: Tabel Daftar Mahasiswa (lg:col-span-7) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 space-y-4">
          {/* Search & Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            {/* Search Input */}
            <div className="sm:col-span-6 relative">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Cari NIM atau nama mahasiswa..."
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#009966]/20 focus:border-[#009966] transition"
              />
            </div>

            {/* Filter Kelompok */}
            <div className="sm:col-span-3">
              <select
                value={filterKelompok}
                onChange={(e) => {
                  setFilterKelompok(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#009966]/20 focus:border-[#009966] transition cursor-pointer"
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
            <div className="sm:col-span-3">
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#009966]/20 focus:border-[#009966] transition cursor-pointer"
              >
                <option value="ALL">Semua Status</option>
                <option value="BELUM_DINILAI">Belum Dinilai</option>
                <option value="SEDANG_DINILAI">Sedang Dinilai</option>
                <option value="SUDAH_DINILAI">Sudah Dinilai</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-3 w-10 text-center">No.</th>
                  <th className="py-3 px-3">NIM</th>
                  <th className="py-3 px-3">Nama Mahasiswa</th>
                  <th className="py-3 px-3">Prodi</th>
                  <th className="py-3 px-3">Kelompok</th>
                  <th className="py-3 px-3 text-center">Nilai</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-[#009966]" />
                        <span>Memuat data mahasiswa...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      Tidak ada data mahasiswa yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  paginatedStudents.map((s, idx) => {
                    const rowNumber = (currentPage - 1) * itemsPerPage + idx + 1;
                    const isSelected = s.studentId === selectedStudentId;

                    return (
                      <tr
                        key={s.studentId}
                        onClick={() => selectStudent(s)}
                        className={`group cursor-pointer transition ${
                          isSelected
                            ? "bg-emerald-50/40 dark:bg-emerald-950/20"
                            : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                        }`}
                      >
                        {/* No. dengan active indicator border */}
                        <td
                          className={`py-3.5 px-3 text-center font-medium text-slate-500 relative ${
                            isSelected ? "font-bold text-[#009966]" : ""
                          }`}
                        >
                          {isSelected && (
                            <span className="absolute left-0 top-0 bottom-0 w-1 bg-[#009966] rounded-r-sm" />
                          )}
                          {rowNumber}
                        </td>

                        {/* NIM */}
                        <td className="py-3.5 px-3 font-normal text-slate-700 dark:text-slate-300">
                          {s.nim || "-"}
                        </td>

                        {/* Nama Mahasiswa */}
                        <td className="py-3.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                          {s.nama}
                        </td>

                        {/* Prodi */}
                        <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {s.jurusan || s.programStudi || "S1 Teknik"}
                        </td>

                        {/* Kelompok */}
                        <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {s.kelompok || "Kelompok 1"}
                        </td>

                        {/* Nilai */}
                        <td className="py-3.5 px-3 text-center font-bold text-slate-800 dark:text-slate-200">
                          {s.subtotalDpl > 0 ? s.subtotalDpl.toFixed(0) : "—"}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          {s.statusDpl === "SUDAH_DINILAI" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Sudah Dinilai
                            </span>
                          ) : s.statusDpl === "SEDANG_DINILAI" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
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
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          {s.statusDpl === "SEDANG_DINILAI" ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleActionClick(s);
                              }}
                              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#009966] hover:bg-[#008055] text-white shadow-2xs transition cursor-pointer"
                            >
                              Lanjutkan
                            </button>
                          ) : s.statusDpl === "SUDAH_DINILAI" ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleActionClick(s);
                              }}
                              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-[#009966] text-[#009966] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition cursor-pointer"
                            >
                              Lihat Nilai
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleActionClick(s);
                              }}
                              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-[#009966] text-[#009966] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition cursor-pointer"
                            >
                              Beri Nilai
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer (10 Rekord per halaman) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            <div>
              Menampilkan{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {filteredStudents.length === 0
                  ? 0
                  : (currentPage - 1) * itemsPerPage + 1}
                -
                {Math.min(currentPage * itemsPerPage, filteredStudents.length)}
              </span>{" "}
              dari{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {filteredStudents.length}
              </span>{" "}
              mahasiswa
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer disabled:cursor-not-allowed"
              >
                &lt;
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => {
                if (
                  totalPages > 5 &&
                  pg !== 1 &&
                  pg !== totalPages &&
                  Math.abs(pg - currentPage) > 1
                ) {
                  if (pg === 2 || pg === totalPages - 1) {
                    return (
                      <span key={pg} className="px-1 text-slate-400">
                        ...
                      </span>
                    );
                  }
                  return null;
                }

                const isActive = pg === currentPage;
                return (
                  <button
                    key={pg}
                    type="button"
                    onClick={() => setCurrentPage(pg)}
                    className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold transition cursor-pointer ${
                      isActive
                        ? "bg-[#009966] text-white"
                        : "border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    {pg}
                  </button>
                );
              })}

              <button
                type="button"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer disabled:cursor-not-allowed"
              >
                &gt;
              </button>
            </div>
          </div>
        </div>

        {/* PANEL KANAN: Form Penilaian Individu (lg:col-span-5) */}
        <div
          ref={formRef}
          className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 space-y-4"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Form Penilaian Individu
            </h2>
            {selectedStudent && selectedStudent.statusDpl === "SUDAH_DINILAI" && (
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                  isEditMode
                    ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60"
                    : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                }`}
              >
                {isEditMode ? "Mode Edit" : "Mode Lihat"}
              </span>
            )}
          </div>

          {selectedStudent ? (
            <>
              {/* Selected Student Banner Card */}
              <div className="bg-slate-50/80 dark:bg-slate-800/40 rounded-xl p-3.5 border border-slate-100 dark:border-slate-700/60 flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-[#009966] flex items-center justify-center shrink-0">
                  <User size={22} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                    {selectedStudent.nama}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    NIM {selectedStudent.nim || "-"} •{" "}
                    {selectedStudent.jurusan || selectedStudent.programStudi || "S1"} •{" "}
                    {selectedStudent.kelompok || "Kelompok KKN"}
                  </p>
                </div>
              </div>

              {/* Subheading Aspek */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Aspek Akademik DPL
                </h4>
              </div>

              {/* Rubric Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                      <th className="py-2.5 px-2 w-8 text-center">No.</th>
                      <th className="py-2.5 px-2">Aspek Penilaian</th>
                      <th className="py-2.5 px-2 text-center w-14">Bobot</th>
                      <th className="py-2.5 px-2 text-center w-28">Nilai</th>
                      <th className="py-2.5 px-2 text-right w-14">Skor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {ASPEK_DPL_CONFIG.map((aspek, idx) => {
                      const val = formScores[aspek.key];
                      const computedSkor = computedScores.scores[idx];

                      return (
                        <tr key={aspek.key} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                          <td className="py-2 px-2 text-center font-medium text-slate-400">
                            {aspek.no}
                          </td>
                          <td className="py-2 px-2 font-medium text-slate-700 dark:text-slate-300">
                            {aspek.title}
                          </td>
                          <td className="py-2 px-2 text-center text-slate-500 font-semibold">
                            {aspek.bobot}%
                          </td>
                          <td className="py-2 px-2 text-center">
                            <div
                              className={`inline-flex items-center gap-1 border rounded-lg px-2 py-1 transition ${
                                isEditMode
                                  ? "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-2xs focus-within:ring-2 focus-within:ring-[#009966]/20 focus-within:border-[#009966]"
                                  : "bg-slate-100/70 dark:bg-slate-800/50 border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                              }`}
                            >
                              <input
                                type="number"
                                min={0}
                                max={100}
                                disabled={!isEditMode}
                                value={val}
                                onChange={(e) =>
                                  handleScoreChange(aspek.key, e.target.value)
                                }
                                placeholder="0"
                                className="w-10 text-center text-xs font-bold text-slate-900 dark:text-slate-100 bg-transparent focus:outline-none disabled:cursor-not-allowed"
                              />
                              <span className="text-[10px] text-slate-400">0-100</span>
                            </div>
                          </td>
                          <td className="py-2 px-2 text-right font-bold text-slate-800 dark:text-slate-200">
                            {computedSkor.toFixed(1)}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Total Bobot Row */}
                    <tr className="bg-slate-50/50 dark:bg-slate-800/40 font-bold border-t border-slate-200 dark:border-slate-700">
                      <td colSpan={2} className="py-2.5 px-2 text-slate-600 dark:text-slate-300">
                        Total Bobot
                      </td>
                      <td className="py-2.5 px-2 text-center text-slate-800 dark:text-slate-100">
                        100%
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Summary Cards: Nilai Akhir & Predikat */}
              <div className="grid grid-cols-2 gap-3 bg-emerald-50/30 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-3">
                <div className="text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Nilai Akhir
                  </span>
                  <span className="text-2xl font-black text-[#009966] dark:text-emerald-400 mt-0.5 block">
                    {computedScores.total.toFixed(1)}
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Predikat
                  </span>
                  <span className="text-base sm:text-lg font-black text-[#009966] dark:text-emerald-400 mt-1 block">
                    {computedScores.predikat}
                  </span>
                </div>
              </div>

              {/* Catatan DPL */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Catatan DPL
                </label>
                <textarea
                  rows={3}
                  disabled={!isEditMode}
                  value={formScores.catatanDpl}
                  onChange={(e) =>
                    setFormScores((prev) => ({
                      ...prev,
                      catatanDpl: e.target.value,
                    }))
                  }
                  placeholder="Tuliskan catatan atau umpan balik untuk mahasiswa..."
                  className={`w-full border rounded-xl p-3 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none transition resize-none ${
                    isEditMode
                      ? "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-[#009966]/20 focus:border-[#009966]"
                      : "bg-slate-100/60 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-800 cursor-not-allowed"
                  }`}
                />
              </div>

              {/* Action Buttons: Edit / Batal / Simpan Nilai */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                {!isEditMode && selectedStudent.statusDpl === "SUDAH_DINILAI" ? (
                  <button
                    type="button"
                    onClick={() => setIsEditMode(true)}
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#009966] hover:bg-[#008055] text-white shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 size={14} />
                    <span>Edit Nilai</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleBatal}
                      className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={handleSave}
                      className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#009966] hover:bg-[#008055] text-white shadow-sm transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
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
                            {selectedStudent.statusDpl === "SUDAH_DINILAI"
                              ? "Simpan Perubahan"
                              : "Simpan Nilai"}
                          </span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <GraduationCap size={36} className="mx-auto text-slate-300" />
              <p className="text-xs">
                Pilih salah satu mahasiswa di daftar sebelah kiri untuk memulai penilaian.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PenilaianKknMahasiswaPage;
