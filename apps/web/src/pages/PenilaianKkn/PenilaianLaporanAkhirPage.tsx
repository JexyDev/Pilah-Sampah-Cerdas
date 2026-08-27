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
  ExternalLink,
  AlertCircle,
  FileCheck,
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
  const [pdfTab, setPdfTab] = useState<"viewer" | "details">("viewer");

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
    if (!student.fileUrl && editMode && student.status !== "Sudah Dinilai") {
      toast.error("Laporan akhir belum diunggah oleh mahasiswa. Penilaian belum dapat dilakukan.");
      return;
    }
    setSelectedStudent(student);
    setIsEditMode(editMode || student.status === "Belum Dinilai");
    const currentScore = student.nilai ?? (student.rubrikScores ? Math.round((student.rubrikScores.sistematika + student.rubrikScores.analisis + (student.rubrikScores.dampak || student.rubrikScores.output || 85) + (student.rubrikScores.rekomendasi || student.rubrikScores.refleksi || 85)) / 4) : 85);
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

  // Clean Markdown/Asterisks from Title
  const getCleanTitle = (title?: string | null) => {
    if (!title) return "Laporan Akhir KKN Tematik Coblong";
    return title.replace(/\*\*/g, "").trim();
  };

  // Convert Google Drive or standard document URLs to Embeddable Preview URL
  const getEmbedUrl = (url?: string | null) => {
    if (!url) return null;
    const trimmed = url.trim();

    // Google Drive File ID
    const driveFileMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (driveFileMatch && driveFileMatch[1]) {
      return `https://drive.google.com/file/d/${driveFileMatch[1]}/preview`;
    }

    // Google Drive open?id=ID
    const driveIdMatch = trimmed.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
    if (driveIdMatch && driveIdMatch[1]) {
      return `https://drive.google.com/file/d/${driveIdMatch[1]}/preview`;
    }

    // Google Drive Folder URL
    const driveFolderMatch = trimmed.match(/drive\.google\.com\/drive\/folders\/([a-zA-Z0-9_-]+)/);
    if (driveFolderMatch && driveFolderMatch[1]) {
      return `https://drive.google.com/embeddedfolderview?id=${driveFolderMatch[1]}#grid`;
    }

    // Google Docs / Sheets / Slides
    const docsMatch = trimmed.match(/docs\.google\.com\/(document|presentation|spreadsheets)\/d\/([a-zA-Z0-9_-]+)/);
    if (docsMatch && docsMatch[1] && docsMatch[2]) {
      return `https://docs.google.com/${docsMatch[1]}/d/${docsMatch[2]}/preview`;
    }

    return trimmed;
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
          <tr><td class="label">Judul Laporan</td><td><strong>${getCleanTitle(selectedStudent.judulLaporan)}</strong></td></tr>
          <tr><td class="label">Dosen Pendamping (DPL)</td><td>${selectedStudent.dplNama || "Dosen Pendamping Lapangan"}</td></tr>
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
            <p>Dosen Pendamping Lapangan,</p>
            <div class="sig-space"></div>
            <p style="font-weight: bold; text-decoration: underline; margin: 0;">${selectedStudent.dplNama || "Dosen Pendamping Lapangan"}</p>
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

  // Print PDF Dokumen Lengkap Lembar Pengesahan Laporan Akhir
  const handlePrintLaporanDocument = (student: LaporanAkhirItem) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Gagal membuka jendela cetak. Mohon izinkan pop-up.");
      return;
    }

    const cleanTitle = getCleanTitle(student.judulLaporan);
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan Akhir KKN - ${student.nama}</title>
        <style>
          @page { size: A4 portrait; margin: 20mm; }
          body { font-family: 'Times New Roman', Times, serif; color: #111827; font-size: 12pt; line-height: 1.6; margin: 0; padding: 0; }
          .kop { text-align: center; border-bottom: 3px double #111827; padding-bottom: 12px; margin-bottom: 24px; }
          .kop h3 { margin: 0; font-size: 13pt; text-transform: uppercase; font-weight: normal; }
          .kop h2 { margin: 4px 0; font-size: 15pt; font-weight: bold; }
          .kop p { margin: 0; font-size: 10pt; color: #374151; }
          .doc-title { text-align: center; margin: 30px 0 20px 0; }
          .doc-title h1 { margin: 0; font-size: 15pt; font-weight: bold; text-transform: uppercase; }
          .doc-title p { margin: 8px 0 0 0; font-size: 11.5pt; font-style: italic; font-weight: bold; }
          .meta-box { margin: 24px auto; max-width: 100%; border: 1px solid #cbd5e1; border-collapse: collapse; width: 100%; }
          .meta-box td { padding: 8px 12px; font-size: 10.5pt; border: 1px solid #cbd5e1; }
          .meta-box td.label { width: 32%; font-weight: bold; background: #f8fafc; }
          .section-heading { font-weight: bold; font-size: 11.5pt; text-transform: uppercase; margin-top: 20px; margin-bottom: 8px; border-bottom: 1px solid #94a3b8; padding-bottom: 4px; }
          .content-text { text-align: justify; margin-bottom: 14px; text-indent: 30px; font-size: 11pt; }
          .signature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 50px; text-align: center; page-break-inside: avoid; }
          .sig-name { font-weight: bold; text-decoration: underline; margin-top: 60px; margin-bottom: 2px; }
          .sig-sub { font-size: 10pt; color: #4b5563; margin: 0; }
        </style>
      </head>
      <body>
        <div class="kop">
          <h3>Pemerintah Kota Bandung &bull; Lembaga Penelitian & Pengabdian Masyarakat</h3>
          <h2>KULIAH KERJA NYATA (KKN) TEMATIK BERSEKA</h2>
          <p>Wilayah Kecamatan Coblong - Sistem Pengelolaan Sampah Cerdas & Berkelanjutan</p>
        </div>

        <div class="doc-title">
          <h1>LEMBAR PENGESAHAN LAPORAN AKHIR KKN</h1>
          <p>"${cleanTitle}"</p>
        </div>

        <table class="meta-box">
          <tr><td class="label">Penyusun</td><td><strong>${student.nama}</strong> (NIM: ${student.nim})</td></tr>
          <tr><td class="label">Program Studi / Fakultas</td><td>${student.jurusan || "Teknik Informatika"} / ${student.fakultas || "Teknik & Ilmu Komputer"}</td></tr>
          <tr><td class="label">Kelompok Binaan</td><td>${student.kelompok}</td></tr>
          <tr><td class="label">Dosen Pendamping (DPL)</td><td>${student.dplNama || "Dosen Pendamping Lapangan"} (NIP: ${student.dplNip || "-"})</td></tr>
          <tr><td class="label">Status Evaluasi</td><td>${student.statusTelaah || student.status || "Terverifikasi Resmi"}</td></tr>
          <tr><td class="label">Tautan Dokumen Sumber</td><td>${student.fileUrl || "-"}</td></tr>
        </table>

        <div class="section-heading">I. Ruang Lingkup &amp; Latar Belakang Program</div>
        <p class="content-text">
          Program Kuliah Kerja Nyata (KKN) Tematik BERSEKA di wilayah ${student.kelompok} difokuskan pada optimalisasi pengelolaan dan pemilahan sampah organik dan anorganik berbasis partisipasi masyarakat di tingkat RW wilayah Kecamatan Coblong.
        </p>

        <div class="section-heading">II. Capaian &amp; Rekapitulasi Pelaksanaan</div>
        <p class="content-text">
          Seluruh rangkaian kegiatan pendampingan masyarakat, sosialisasi pemilahan sampah dari sumber rumah tangga, pendataan warga binaan, serta pencatatan timbulan residu telah dilaksanakan dan dilaporkan secara berkala sesuai ketentuan kurikulum KKN Tematik 2026.
        </p>

        <div class="section-heading">III. Evaluasi &amp; Catatan Dosen Pendamping</div>
        <p class="content-text">
          ${student.catatan || "Laporan akhir telah ditelaah dan memenuhi standar kelayakan laporan program KKN Tematik BERSEKA Kota Bandung."}
        </p>

        <div class="signature-grid">
          <div>
            <p class="sig-sub">Mahasiswa Penyusun,</p>
            <div class="sig-name">${student.nama}</div>
            <p class="sig-sub">NIM. ${student.nim}</p>
          </div>
          <div>
            <p class="sig-sub">Dosen Pendamping Lapangan,</p>
            <div class="sig-name">${student.dplNama || "Dosen Pendamping Lapangan"}</div>
            <p class="sig-sub">NIP. ${student.dplNip || "DPL KKN"}</p>
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
                          title={getCleanTitle(item.judulLaporan)}
                        >
                          {getCleanTitle(item.judulLaporan)}
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
                        ) : !item.fileUrl ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <AlertCircle size={12} />
                            <span>Belum Diunggah</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            <Clock size={12} />
                            <span>Menunggu Nilai</span>
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
                        ) : !item.fileUrl ? (
                          <button
                            type="button"
                            disabled
                            className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed w-28 border border-slate-200 dark:border-slate-700 opacity-80"
                            title="Laporan akhir belum diunggah oleh mahasiswa"
                          >
                            <AlertCircle size={13} />
                            <span>Belum Ada File</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenAssessment(item, true)}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#009966] hover:bg-[#008055] text-white transition cursor-pointer w-28 shadow-2xs active:scale-95"
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
                    {getCleanTitle(selectedStudent.judulLaporan) || "Belum ada judul laporan yang diajukan"}
                  </span>
                </div>

                <div className="pt-2.5 border-t border-slate-200/80 dark:border-slate-700 flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">Berkas Laporan:</span>
                  {selectedStudent.fileUrl ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAssessmentModalOpen(false);
                          setIsPdfModalOpen(true);
                        }}
                        className="font-semibold text-[#009966] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <FileText size={13} />
                        <span>Pratinjau PDF</span>
                      </button>
                      <a
                        href={selectedStudent.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-slate-400 hover:text-blue-600 transition"
                        title="Buka di Tab Baru"
                      >
                        <ExternalLink size={13} />
                      </a>
                    </div>
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

              {/* Catatan / Evaluasi Pendamping */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Catatan / Umpan Balik Dosen Pendamping (DPL)
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
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-5xl w-full max-h-[94vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            {/* Header Modal */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-base shadow-sm shrink-0">
                  <FileText size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 truncate">
                    Dokumen Laporan Akhir KKN
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {selectedStudent.nama} &bull; NIM: {selectedStudent.nim} &bull; {selectedStudent.kelompok}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {selectedStudent.fileUrl && (
                  <a
                    href={selectedStudent.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition cursor-pointer"
                    title="Buka Dokumen di Tab Baru"
                  >
                    <ExternalLink size={14} />
                    <span>Buka Berkas</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => handlePrintLaporanDocument(selectedStudent)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                  title="Cetak Lembar Resmi Laporan"
                >
                  <Printer size={14} />
                  <span className="hidden sm:inline">Cetak Dokumen</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPdfModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Subheader Tab Navigation */}
            <div className="px-5 py-2.5 bg-slate-100/60 dark:bg-slate-800/40 border-b border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPdfTab("viewer")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    pdfTab === "viewer"
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs border border-slate-200/80 dark:border-slate-700"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <FileText size={13} />
                  <span>Pratinjau Berkas Dokumen</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPdfTab("details")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    pdfTab === "details"
                      ? "bg-white dark:bg-slate-900 text-[#009966] dark:text-emerald-400 shadow-2xs border border-slate-200/80 dark:border-slate-700"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <FileCheck size={13} />
                  <span>Lembar Pengesahan &amp; Rincian</span>
                </button>
              </div>

              <div className="hidden md:flex items-center gap-2 text-slate-500 text-[11.5px]">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {selectedStudent.kelompok}
                </span>
                <span>&bull;</span>
                <span>DPL: {selectedStudent.dplNama || "DPL KKN"}</span>
              </div>
            </div>

            {/* Document Body / Viewer */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/50 dark:bg-slate-950/40">
              {pdfTab === "viewer" ? (
                selectedStudent.fileUrl ? (
                  <div className="flex flex-col h-full space-y-3">
                    {/* Top Link Banner */}
                    <div className="p-3 bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 font-medium min-w-0">
                        <ExternalLink size={15} className="text-blue-600 shrink-0" />
                        <span className="truncate">
                          Tautan Berkas Laporan:{" "}
                          <a
                            href={selectedStudent.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold underline hover:text-blue-700"
                          >
                            {selectedStudent.fileName || selectedStudent.fileUrl}
                          </a>
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={selectedStudent.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow-2xs text-[11.5px]"
                        >
                          <span>Buka Dokumen Penuh</span>
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>

                    {/* IFrame Viewer */}
                    <div className="flex-1 min-h-[520px] sm:min-h-[600px] w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs relative">
                      <iframe
                        src={getEmbedUrl(selectedStudent.fileUrl) || selectedStudent.fileUrl}
                        title={`Dokumen Laporan Akhir - ${selectedStudent.nama}`}
                        className="w-full h-full min-h-[520px] sm:min-h-[600px] border-0"
                        allow="autoplay"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="py-16 px-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4 max-w-lg mx-auto shadow-xs">
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                      <AlertCircle size={28} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        Berkas Dokumen Belum Diunggah
                      </h4>
                      <p className="text-xs text-slate-500">
                        Mahasiswa atau kelompok belum menyertakan tautan Google Drive / file PDF dokumen laporan akhir.
                      </p>
                    </div>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setPdfTab("details")}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition"
                      >
                        Lihat Rincian Laporan
                      </button>
                    </div>
                  </div>
                )
              ) : (
                /* Lembar Rincian & Pengesahan Resmi */
                <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs max-w-3xl mx-auto space-y-6 text-slate-800 dark:text-slate-200">
                  {/* Official Header */}
                  <div className="text-center pb-6 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#009966] block mb-1">
                      LEMBAR PENGESAHAN LAPORAN AKHIR KKN
                    </span>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100">
                      {getCleanTitle(selectedStudent.judulLaporan)}
                    </h2>
                    <p className="text-xs text-slate-500 mt-2">
                      Wilayah Dampingan: <strong>{selectedStudent.kelompok}</strong> &bull; Kecamatan Coblong &bull; Periode 2026
                    </p>
                  </div>

                  {/* Metadata Table Card */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                      <span className="text-slate-500 font-semibold block text-[11px]">Mahasiswa Penyusun</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-sm block">
                        {selectedStudent.nama}
                      </span>
                      <span className="font-mono text-slate-500 block">NIM: {selectedStudent.nim}</span>
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                      <span className="text-slate-500 font-semibold block text-[11px]">Program Studi &amp; Fakultas</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">
                        {selectedStudent.jurusan || "Teknik Informatika"}
                      </span>
                      <span className="text-slate-500 block">{selectedStudent.fakultas || "Teknik & Ilmu Komputer"}</span>
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                      <span className="text-slate-500 font-semibold block text-[11px]">Dosen Pendamping Lapangan</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">
                        {selectedStudent.dplNama || "Dosen Pendamping Lapangan"}
                      </span>
                      <span className="font-mono text-slate-500 block">NIP: {selectedStudent.dplNip || "-"}</span>
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                      <span className="text-slate-500 font-semibold block text-[11px]">Status &amp; Nilai Laporan</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#009966] text-sm">
                          {selectedStudent.status === "Sudah Dinilai"
                            ? `Nilai: ${selectedStudent.nilai ?? "-"}`
                            : "Belum Dinilai"}
                        </span>
                        {selectedStudent.predikat && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10.5px]">
                            {selectedStudent.predikat}
                          </span>
                        )}
                      </div>
                      <span className="text-slate-400 block text-[10.5px]">
                        Status Telaah: {selectedStudent.statusTelaah || "MENUNGGU_TELAAH"}
                      </span>
                    </div>
                  </div>

                  {/* Summary & Scope */}
                  <div className="space-y-2 text-xs">
                    <h4 className="font-black uppercase text-slate-900 dark:text-slate-100 tracking-wider">
                      Ringkasan Ruang Lingkup Laporan
                    </h4>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-justify">
                      Laporan akhir ini memuat dokumentasi menyeluruh implementasi sistem pemilahan sampah cerdas BERSEKA, pencatatan residu sampah, pembinaan warga di {selectedStudent.kelompok}, serta evaluasi capaian indikator keberlanjutan program KKN Tematik 2026.
                    </p>
                  </div>

                  {/* Tautan Berkas */}
                  {selectedStudent.fileUrl && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[11px]">Tautan Berkas Laporan:</span>
                        <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold truncate block max-w-md">
                          {selectedStudent.fileUrl}
                        </span>
                      </div>
                      <a
                        href={selectedStudent.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition flex items-center gap-1 shrink-0"
                      >
                        <span>Buka</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  )}

                  {/* Action Print */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handlePrintLaporanDocument(selectedStudent)}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Printer size={14} />
                      <span>Cetak Lembar Dokumen Resmi (PDF)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500 hidden sm:inline">
                Format: Dokumen Laporan KKN Resmi &bull; Status: {selectedStudent.statusTelaah || selectedStudent.status}
              </span>
              <div className="flex items-center gap-2 ml-auto">
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
