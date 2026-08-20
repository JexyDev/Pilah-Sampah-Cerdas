/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Halaman Penilaian Laporan Akhir Mahasiswa KKN
 * Sesuai Acuan UI Resmi:
 * - Search: "Cari mahasiswa..."
 * - Filter: "Semua Status" / "Sudah Dinilai" / "Belum Dinilai"
 * - 3 KPI Cards: Total Mahasiswa, Sudah Dinilai, Belum Dinilai
 * - Kolom: No, NIM, Nama Mahasiswa, Kelompok, Judul Laporan, File Laporan (Lihat PDF), Status, Nilai, Aksi
 * - Modal: Rincian Penilaian Laporan Akhir dengan Rubrik 4 Aspek (Sistematika, Analisis, Capaian, Refleksi)
 * - Cetak Lembar Nilai Resmi A4 & Simpan Database Real-time
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Users,
  CheckCircle2,
  Clock,
  FileText,
  Eye,
  Edit3,
  Loader2,
  X,
  Save,
  Printer,
  Award,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  penilaianKknApiService,
  type LaporanAkhirItem,
} from "../../services/penilaianKknApiService";
import { Pagination } from "../../components/common/Pagination";
import { EmptyTableState } from "../../components/common/EmptyTableState";

export const PenilaianLaporanAkhirPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [students, setStudents] = useState<LaporanAkhirItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Modal State
  const [selectedStudent, setSelectedStudent] = useState<LaporanAkhirItem | null>(null);
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState<boolean>(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  // Form State for Assessment
  const [scoreInput, setScoreInput] = useState<number>(100);
  const [aspectScores, setAspectScores] = useState<{
    sistematika: number;
    analisis: number;
    dampak: number;
    rekomendasi: number;
  }>({
    sistematika: 100,
    analisis: 100,
    dampak: 100,
    rekomendasi: 100,
  });
  const [catatanInput, setCatatanInput] = useState<string>("");

  // Load Data from Backend
  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await penilaianKknApiService.getLaporanAkhirList();
      if (data && Array.isArray(data.students)) {
        setStudents(data.students);
      } else if (Array.isArray(data)) {
        setStudents(data);
      } else if (data && typeof data === "object" && Array.isArray((data as any).kelompokList)) {
        // Flatten from kelompokList if students not directly provided
        const flat: LaporanAkhirItem[] = [];
        (data as any).kelompokList.forEach((k: any) => {
          if (Array.isArray(k.students)) {
            k.students.forEach((st: any) => {
              flat.push({
                studentId: st.studentId || st.id,
                nim: st.nim,
                nama: st.nama,
                jurusan: st.jurusan,
                fakultas: st.fakultas,
                kelompok: k.namaKelompok,
                kelompokId: k.id,
                dplNama: k.dplNama,
                dplNip: k.dplNip,
                judulLaporan: k.judulLaporan,
                fileUrl: k.fileUrl,
                fileName: k.fileName,
                status: k.status || "Belum Dinilai",
                statusTelaah: k.statusTelaah,
                nilai: k.nilaiAkhir,
                predikat: k.predikat,
                rubrikScores: k.rubrikScores,
                catatan: k.catatanUmum,
                submittedAt: k.submittedAt,
                updatedAt: k.updatedAt,
              });
            });
          }
        });
        setStudents(flat);
      }
    } catch (err: any) {
      console.error("Gagal memuat daftar laporan akhir:", err);
      toast.error("Gagal memuat data laporan akhir mahasiswa");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered Data
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        s.nama.toLowerCase().includes(q) ||
        s.nim.toLowerCase().includes(q) ||
        s.kelompok.toLowerCase().includes(q) ||
        (s.judulLaporan && s.judulLaporan.toLowerCase().includes(q));

      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "SUDAH" && s.status === "Sudah Dinilai") ||
        (statusFilter === "BELUM" && s.status === "Belum Dinilai");

      return matchSearch && matchStatus;
    });
  }, [students, searchQuery, statusFilter]);

  // Statistics Calculation
  const totalMahasiswa = students.length;
  const sudahDinilaiCount = useMemo(
    () => students.filter((s) => s.status === "Sudah Dinilai").length,
    [students]
  );
  const belumDinilaiCount = totalMahasiswa - sudahDinilaiCount;

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / itemsPerPage));
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(start, start + itemsPerPage);
  }, [filteredStudents, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Open Assessment Modal (Rincian Penilaian Laporan Akhir)
  const handleOpenAssessment = (student: LaporanAkhirItem, editMode: boolean = false) => {
    setSelectedStudent(student);
    setIsEditMode(editMode || student.status === "Belum Dinilai");
    const currentScore = student.nilai ?? (student.rubrikScores ? Math.round((student.rubrikScores.sistematika + student.rubrikScores.analisis + (student.rubrikScores.dampak || student.rubrikScores.output || 85) + (student.rubrikScores.rekomendasi || student.rubrikScores.refleksi || 85)) / 4) : 100);
    setScoreInput(currentScore);
    setAspectScores({
      sistematika: student.rubrikScores?.sistematika ?? currentScore,
      analisis: student.rubrikScores?.analisis ?? currentScore,
      dampak: student.rubrikScores?.dampak ?? student.rubrikScores?.output ?? currentScore,
      rekomendasi: student.rubrikScores?.rekomendasi ?? student.rubrikScores?.refleksi ?? currentScore,
    });
    setCatatanInput(student.catatan || "");
    setIsAssessmentModalOpen(true);
  };

  // Open PDF Viewer Modal
  const handleOpenPdf = (student: LaporanAkhirItem) => {
    setSelectedStudent(student);
    setIsPdfModalOpen(true);
  };

  // Handle Score Aspect Change
  const handleAspectChange = (aspect: keyof typeof aspectScores, val: number) => {
    const safeVal = Math.max(0, Math.min(100, isNaN(val) ? 0 : val));
    const nextScores = { ...aspectScores, [aspect]: safeVal };
    setAspectScores(nextScores);
    // Average 4 aspects (each 25%)
    const avg = Math.round(
      (nextScores.sistematika + nextScores.analisis + nextScores.dampak + nextScores.rekomendasi) / 4
    );
    setScoreInput(avg);
  };

  // Save Score Assessment
  const handleSaveScore = async () => {
    if (!selectedStudent) return;
    if (isNaN(scoreInput) || scoreInput < 0 || scoreInput > 100) {
      toast.error("Nilai harus berupa angka di rentang 0 - 100");
      return;
    }

    setSaving(true);
    try {
      await penilaianKknApiService.saveLaporanAkhirScore(
        selectedStudent.studentId,
        scoreInput,
        catatanInput
      );

      // Local optimistic update
      setStudents((prev) =>
        prev.map((s) =>
          s.studentId === selectedStudent.studentId
            ? {
                ...s,
                status: "Sudah Dinilai",
                nilai: scoreInput,
                rubrikScores: aspectScores,
                catatan: catatanInput,
              }
            : s
        )
      );

      toast.success(`Nilai laporan akhir untuk ${selectedStudent.nama} berhasil disimpan!`);
      setIsAssessmentModalOpen(false);
    } catch (err: any) {
      console.error("Gagal menyimpan nilai laporan:", err);
      toast.error(err.response?.data?.message || "Gagal menyimpan penilaian laporan");
    } finally {
      setSaving(false);
    }
  };

  // Print PDF Lembar Evaluasi
  const handlePrintEvaluation = () => {
    if (!selectedStudent) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Gagal membuka jendela cetak. Mohon izinkan pop-up.");
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Evaluasi Laporan Akhir - ${selectedStudent.nama}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; font-size: 10pt; line-height: 1.5; margin: 0; padding: 0; }
          .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 16px; }
          .header h2 { margin: 0; font-size: 14pt; text-transform: uppercase; }
          .header p { margin: 2px 0 0 0; font-size: 9pt; color: #475569; }
          .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
          .meta-table td { padding: 6px 8px; font-size: 9pt; border: 1px solid #cbd5e1; }
          .meta-table .label { font-weight: bold; width: 30%; background: #f8fafc; color: #475569; }
          .score-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 9pt; }
          .score-table th, .score-table td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
          .score-table th { background: #f1f5f9; text-transform: uppercase; font-weight: bold; }
          .score-box { background: #ecfdf5; border: 2px solid #059669; padding: 12px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
          .final-val { font-size: 20pt; font-weight: 900; color: #065f46; }
          .sig-row { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 30px; text-align: center; }
          .sig-space { height: 60px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>LEMBAR EVALUASI LAPORAN AKHIR KKN</h2>
          <p>Kecamatan Coblong - Program Pengelolaan & Pemilahan Sampah Terpadu</p>
        </div>
        <table class="meta-table">
          <tr><td class="label">Nama Mahasiswa</td><td><strong>${selectedStudent.nama}</strong></td></tr>
          <tr><td class="label">NIM</td><td>${selectedStudent.nim}</td></tr>
          <tr><td class="label">Kelompok KKN</td><td>${selectedStudent.kelompok}</td></tr>
          <tr><td class="label">Judul Laporan</td><td><strong>${selectedStudent.judulLaporan || "-"}</strong></td></tr>
          <tr><td class="label">Dosen Pembimbing (DPL)</td><td>${selectedStudent.dplNama || "Dosen Pendamping Lapangan"}</td></tr>
        </table>
        <table class="score-table">
          <thead>
            <tr><th>No</th><th>Rubrik Penilaian</th><th>Bobot</th><th>Nilai (0-100)</th></tr>
          </thead>
          <tbody>
            <tr><td>1</td><td>Format & Sistematika Penulisan</td><td>25%</td><td>${aspectScores.sistematika}</td></tr>
            <tr><td>2</td><td>Analisis Masalah & Kesesuaian Solusi</td><td>25%</td><td>${aspectScores.analisis}</td></tr>
            <tr><td>3</td><td>Capaian Program & Dampak Masyarakat</td><td>25%</td><td>${aspectScores.dampak}</td></tr>
            <tr><td>4</td><td>Refleksi Kritis & Rekomendasi</td><td>25%</td><td>${aspectScores.rekomendasi}</td></tr>
          </tbody>
        </table>
        <div class="score-box">
          <div>
            <div style="font-size: 9pt; font-weight: bold; color: #047857;">NILAI AKHIR LAPORAN</div>
            <div style="font-size: 8.5pt; color: #475569;">Akumulasi Rerata Komponen Rubrik (100%)</div>
          </div>
          <div class="final-val">${scoreInput}</div>
        </div>
        <div style="margin-bottom: 20px; font-size: 9pt; background: #f8fafc; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px;">
          <strong>Catatan / Umpan Balik DPL:</strong>
          <p style="margin: 4px 0 0 0; color: #334155;">${catatanInput || "Laporan akhir telah memenuhi seluruh standar kriteria KKN Tematik Coblong."}</p>
        </div>
        <div class="sig-row">
          <div>
            <p>Mahasiswa,</p>
            <div class="sig-space"></div>
            <p style="font-weight: bold; text-decoration: underline; margin: 0;">${selectedStudent.nama}</p>
            <p style="font-size: 8pt; color: #64748b; margin: 0;">NIM. ${selectedStudent.nim}</p>
          </div>
          <div>
            <p>Dosen Pembimbing Lapangan,</p>
            <div class="sig-space"></div>
            <p style="font-weight: bold; text-decoration: underline; margin: 0;">${selectedStudent.dplNama || "Dosen Pembimbing Lapangan"}</p>
            <p style="font-size: 8pt; color: #64748b; margin: 0;">DPL KKN Tematik</p>
          </div>
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="p-4 md:p-6 space-y-5 text-slate-800 dark:text-slate-100 max-w-[1400px] mx-auto min-h-screen">
      {/* Top Section: Header, Subtitle, Search/Filter & KPI Summary Cards */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Search & Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Box */}
          <div className="relative min-w-[260px] sm:min-w-[280px]">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Cari mahasiswa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#009966]/20 focus:border-[#009966] transition shadow-2xs placeholder:text-slate-400"
            />
          </div>

          {/* Filter Status Dropdown */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#009966]/20 focus:border-[#009966] transition shadow-2xs cursor-pointer appearance-none pr-9"
            >
              <option value="ALL">Semua Status</option>
              <option value="SUDAH">Sudah Dinilai</option>
              <option value="BELUM">Belum Dinilai</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Right: 3 KPI Cards matching exact reference UI */}
        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          {/* Card 1: Total Mahasiswa */}
          <div className="flex-1 sm:flex-initial min-w-[130px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-2.5 sm:px-3.5 sm:py-2.5 flex items-center gap-3 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Users size={20} />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block whitespace-nowrap">
                Total Mahasiswa
              </span>
              <span className="text-xl sm:text-2xl font-black text-blue-700 dark:text-blue-400 leading-tight">
                {totalMahasiswa}
              </span>
            </div>
          </div>

          {/* Card 2: Sudah Dinilai */}
          <div className="flex-1 sm:flex-initial min-w-[130px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-2.5 sm:px-3.5 sm:py-2.5 flex items-center gap-3 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block whitespace-nowrap">
                Sudah Dinilai
              </span>
              <span className="text-xl sm:text-2xl font-black text-[#009966] dark:text-emerald-400 leading-tight">
                {sudahDinilaiCount}
              </span>
            </div>
          </div>

          {/* Card 3: Belum Dinilai */}
          <div className="flex-1 sm:flex-initial min-w-[130px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-2.5 sm:px-3.5 sm:py-2.5 flex items-center gap-3 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block whitespace-nowrap">
                Belum Dinilai
              </span>
              <span className="text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-400 leading-tight">
                {belumDinilaiCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="animate-spin text-[#009966]" size={32} />
            <span className="text-xs font-semibold">Memuat daftar laporan akhir mahasiswa...</span>
          </div>
        ) : filteredStudents.length === 0 ? (
          <EmptyTableState
            entityName="Laporan Akhir Mahasiswa"
            isSearch={!!searchQuery || statusFilter !== "ALL"}
            searchQuery={searchQuery}
            onResetSearch={() => {
              setSearchQuery("");
              setStatusFilter("ALL");
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-700 dark:text-slate-300 border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-extrabold text-[12px] sm:text-[13px] bg-slate-50/50 dark:bg-slate-800/50">
                  <th className="py-4 px-4 w-12 text-center">No.</th>
                  <th className="py-4 px-4 font-bold min-w-[120px]">NIM</th>
                  <th className="py-4 px-4 font-bold min-w-[200px]">Nama Mahasiswa</th>
                  <th className="py-4 px-4 font-bold min-w-[160px]">Kelompok</th>
                  <th className="py-4 px-4 font-bold min-w-[220px]">Judul Laporan</th>
                  <th className="py-4 px-4 font-bold text-center w-36">File Laporan</th>
                  <th className="py-4 px-4 font-bold text-center w-36">Status</th>
                  <th className="py-4 px-4 font-bold text-center w-28">Nilai</th>
                  <th className="py-4 px-4 font-bold text-center w-32">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                {paginatedStudents.map((item, idx) => {
                  const isAssessed = item.status === "Sudah Dinilai";

                  return (
                    <tr
                      key={item.studentId || idx}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* 1. No */}
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                        {(currentPage - 1) * itemsPerPage + idx + 1}
                      </td>

                      {/* 2. NIM */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                        {item.nim}
                      </td>

                      {/* 3. Nama Mahasiswa */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {item.nama}
                        </div>
                        <div className="text-[11px] text-slate-400 font-normal">
                          {item.jurusan}
                        </div>
                      </td>

                      {/* 4. Kelompok */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {item.kelompok}
                        </span>
                      </td>

                      {/* 5. Judul Laporan */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <span
                          className={`line-clamp-2 ${
                            item.judulLaporan
                              ? "text-slate-800 dark:text-slate-200 font-medium"
                              : "text-slate-400 italic"
                          }`}
                          title={item.judulLaporan || "Belum ada judul laporan"}
                        >
                          {item.judulLaporan || "Belum ada judul laporan yang diajukan"}
                        </span>
                      </td>

                      {/* 6. File Laporan */}
                      <td className="py-3.5 px-4 text-center">
                        {item.fileUrl ? (
                          <button
                            type="button"
                            onClick={() => handleOpenPdf(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/30 hover:bg-blue-100/80 transition cursor-pointer"
                          >
                            <FileText size={13} />
                            <span>Lihat PDF</span>
                          </button>
                        ) : (
                          <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/80">
                            Belum Diunggah
                          </span>
                        )}
                      </td>

                      {/* 7. Status */}
                      <td className="py-3.5 px-4 text-center">
                        {isAssessed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-[#009966] dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 size={12} />
                            <span>Sudah Dinilai</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            <Clock size={12} />
                            <span>Belum Dinilai</span>
                          </span>
                        )}
                      </td>

                      {/* 8. Nilai */}
                      <td className="py-3.5 px-4 text-center">
                        {item.nilai !== null && item.nilai !== undefined ? (
                          <span className="font-extrabold text-sm text-[#009966] dark:text-emerald-400">
                            {item.nilai}
                          </span>
                        ) : (
                          <span className="font-bold text-slate-400 text-sm">&mdash;</span>
                        )}
                      </td>

                      {/* 9. Aksi */}
                      <td className="py-3.5 px-4 text-center">
                        {isAssessed ? (
                          <button
                            type="button"
                            onClick={() => handleOpenAssessment(item, false)}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-[#009966] text-[#009966] bg-white hover:bg-emerald-50 dark:bg-slate-900 dark:hover:bg-emerald-950/30 transition cursor-pointer w-28 shadow-2xs"
                          >
                            <Eye size={14} />
                            <span>Lihat Nilai</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenAssessment(item, true)}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#009966] hover:bg-[#008055] text-white transition cursor-pointer w-28 shadow-2xs"
                          >
                            <Edit3 size={14} />
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

        {/* Pagination Footer */}
        {filteredStudents.length > 0 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(p) => setCurrentPage(p)}
            />
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL PENILAIAN / RINCIAN PENILAIAN LAPORAN AKHIR (PERSIS SESUAI ACUAN UI) */}
      {/* ========================================================================= */}
      {isAssessmentModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            {/* Header Modal */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#009966] text-white flex items-center justify-center font-black text-base shadow-sm">
                  <Award size={20} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
                    {isEditMode ? "Formulir Penilaian Laporan Akhir" : "Rincian Penilaian Laporan Akhir"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Evaluasi akademik dan capaian laporan akhir KKN tematik
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAssessmentModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
              {/* Metadata Mahasiswa (Card Info) */}
              <div className="bg-slate-50/70 dark:bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">Nama Mahasiswa:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {selectedStudent.nama}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">NIM:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {selectedStudent.nim}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">Kelompok:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {selectedStudent.kelompok}
                  </span>
                </div>

                <div className="pt-2.5 border-t border-slate-200/80 dark:border-slate-700 flex flex-col gap-1">
                  <span className="text-slate-500 font-semibold">Judul Laporan:</span>
                  <span
                    className={
                      selectedStudent.judulLaporan
                        ? "font-medium text-slate-900 dark:text-slate-100"
                        : "italic text-slate-400"
                    }
                  >
                    {selectedStudent.judulLaporan || "Belum ada judul laporan yang diajukan"}
                  </span>
                </div>

                <div className="pt-2.5 border-t border-slate-200/80 dark:border-slate-700 flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">Berkas Laporan:</span>
                  {selectedStudent.fileUrl ? (
                    <a
                      href={selectedStudent.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-[#009966] hover:underline flex items-center gap-1"
                    >
                      <FileText size={13} />
                      <span>Lihat Berkas Laporan</span>
                    </a>
                  ) : (
                    <span className="font-medium text-amber-600 dark:text-amber-400">
                      Belum diunggah oleh mahasiswa
                    </span>
                  )}
                </div>
              </div>

              {/* Rubrik Penilaian Aspek */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    RUBRIK PENILAIAN ASPEK (BOBOT 100%)
                  </span>
                  <span className="text-xs sm:text-sm font-black text-[#009966] dark:text-emerald-400">
                    Skor Kumulatif: {scoreInput} / 100
                  </span>
                </div>

                {/* 1. Format & Sistematika Penulisan (25%) */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <span className="text-xs sm:text-sm font-bold block text-slate-900 dark:text-slate-100">
                      1. Format & Sistematika Penulisan (25%)
                    </span>
                    <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                      Kerapian tata tulis, struktur laporan, dan kaidah bahasa Indonesia baku
                    </span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    disabled={!isEditMode}
                    value={aspectScores.sistematika}
                    onChange={(e) => handleAspectChange("sistematika", Number(e.target.value))}
                    className="w-20 sm:w-24 px-2.5 py-2 text-center font-bold text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#009966] disabled:bg-slate-50/80 disabled:text-slate-900 dark:disabled:text-slate-100"
                  />
                </div>

                {/* 2. Analisis Masalah & Kesesuaian Solusi (25%) */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <span className="text-xs sm:text-sm font-bold block text-slate-900 dark:text-slate-100">
                      2. Analisis Masalah & Kesesuaian Solusi (25%)
                    </span>
                    <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                      Ketepatan identifikasi masalah sampah & pemilahan di wilayah dampingan
                    </span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    disabled={!isEditMode}
                    value={aspectScores.analisis}
                    onChange={(e) => handleAspectChange("analisis", Number(e.target.value))}
                    className="w-20 sm:w-24 px-2.5 py-2 text-center font-bold text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#009966] disabled:bg-slate-50/80 disabled:text-slate-900 dark:disabled:text-slate-100"
                  />
                </div>

                {/* 3. Capaian Program & Dampak Masyarakat (25%) */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <span className="text-xs sm:text-sm font-bold block text-slate-900 dark:text-slate-100">
                      3. Capaian Program & Dampak Masyarakat (25%)
                    </span>
                    <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                      Bukti hasil kegiatan lapangan, keterlibatan warga, & volume sampah terkelola
                    </span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    disabled={!isEditMode}
                    value={aspectScores.dampak}
                    onChange={(e) => handleAspectChange("dampak", Number(e.target.value))}
                    className="w-20 sm:w-24 px-2.5 py-2 text-center font-bold text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#009966] disabled:bg-slate-50/80 disabled:text-slate-900 dark:disabled:text-slate-100"
                  />
                </div>

                {/* 4. Refleksi Kritis & Rekomendasi (25%) */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <span className="text-xs sm:text-sm font-bold block text-slate-900 dark:text-slate-100">
                      4. Refleksi Kritis & Rekomendasi (25%)
                    </span>
                    <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                      Evaluasi diri, analisis hambatan, & rencana keberlanjutan program
                    </span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    disabled={!isEditMode}
                    value={aspectScores.rekomendasi}
                    onChange={(e) => handleAspectChange("rekomendasi", Number(e.target.value))}
                    className="w-20 sm:w-24 px-2.5 py-2 text-center font-bold text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#009966] disabled:bg-slate-50/80 disabled:text-slate-900 dark:disabled:text-slate-100"
                  />
                </div>
              </div>

              {/* Catatan / Evaluasi Pembimbing */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Catatan / Umpan Balik Dosen Pembimbing (DPL)
                </label>
                <textarea
                  rows={3}
                  disabled={!isEditMode}
                  placeholder="Berikan masukan atau catatan konstruktif untuk laporan mahasiswa..."
                  value={catatanInput}
                  onChange={(e) => setCatatanInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#009966]/20 focus:border-[#009966] resize-none placeholder:text-slate-400 disabled:bg-slate-50/80"
                />
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-3">
              <div>
                {!isEditMode && (
                  <button
                    type="button"
                    onClick={handlePrintEvaluation}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <Printer size={15} />
                    <span>Cetak Lembar Nilai</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                {!isEditMode ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsEditMode(true)}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Edit3 size={14} />
                      <span>Ubah Nilai</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAssessmentModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                    >
                      Tutup
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsEditMode(false)}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveScore}
                      disabled={saving}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#009966] hover:bg-[#008055] text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      <span>Simpan Penilaian</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL PREVIEW PDF LAPORAN AKHIR */}
      {/* ========================================================================= */}
      {isPdfModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            {/* Header Modal */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-base shadow-sm">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
                    Dokumen Laporan Akhir KKN
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedStudent.nama} &bull; NIM: {selectedStudent.nim} &bull; {selectedStudent.kelompok}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPdfModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Document Body / Viewer Simulation */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 bg-slate-100/50 dark:bg-slate-950/40">
              <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-2xl mx-auto space-y-6 text-slate-800 dark:text-slate-200">
                {/* Cover Title */}
                <div className="text-center pb-6 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#009966] block mb-1">
                    LAPORAN AKHIR KKN TEMATIK
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                    {selectedStudent.judulLaporan || `Laporan Akhir KKN Tematik Coblong - ${selectedStudent.kelompok}`}
                  </h2>
                  <p className="text-xs text-slate-500 mt-2">
                    Disusun oleh: <strong>{selectedStudent.nama}</strong> ({selectedStudent.nim})
                  </p>
                  <p className="text-xs text-slate-400">
                    Program Studi {selectedStudent.jurusan || "S1"} &bull; Kecamatan Coblong &bull; Periode 2026
                  </p>
                </div>

                {/* Ringkasan Eksekutif */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase text-slate-900 dark:text-slate-100 tracking-wider">
                    I. Ringkasan Eksekutif
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed text-justify">
                    Program KKN Tematik ini difokuskan pada penguatan pemilahan sampah organik dan anorganik di tingkat rumah tangga, implementasi digitalisasi pencatatan timbulan residu, serta edukasi komposting mandiri di Kecamatan Coblong. Selama periode kegiatan, tercatat partisipasi aktif warga dengan capaian tingkat kepatuhan pemilahan yang meningkat secara signifikan.
                  </p>
                </div>

                {/* Metodologi & Capaian */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase text-slate-900 dark:text-slate-100 tracking-wider">
                    II. Capaian Program & Hasil Kegiatan
                  </h4>
                  <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-300 space-y-1">
                    <li>Pemasangan dan aktivasi QR Code tempat sampah terintegrasi pada rumah tangga binaan.</li>
                    <li>Sosialisasi langsung metode pemilahan sampah organik untuk pakan maggot BSF dan kompos komunal.</li>
                    <li>Pencatatan data penimbangan berkala bersama petugas residu di TPS3R wilayah Coblong.</li>
                  </ul>
                </div>

                {/* Kesimpulan */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase text-slate-900 dark:text-slate-100 tracking-wider">
                    III. Kesimpulan & Rekomendasi
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed text-justify">
                    Digitalisasi pemilahan sampah terbukti meningkatkan kesadaran dan akuntabilitas pemilahan sampah warga. Disarankan agar kemitraan antara pengurus RW, warga, dan dinas terkait terus diperkuat pasca-KKN.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Format: Dokumen PDF Resmi &bull; Status: Terverifikasi
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleOpenAssessment(selectedStudent, selectedStudent.status === "Belum Dinilai");
                    setIsPdfModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#009966] hover:bg-[#008055] text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Award size={14} />
                  <span>{selectedStudent.status === "Sudah Dinilai" ? "Lihat Nilai" : "Beri Nilai Laporan"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPdfModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PenilaianLaporanAkhirPage;
