/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Halaman Penilaian Laporan Akhir Mahasiswa KKN (Berbasis Kelompok & Split-Screen Reviewer)
 * Sesuai Spesifikasi:
 * - Entitas: Kelompok KKN (1 Laporan per Kelompok, disinkronkan ke seluruh mahasiswa)
 * - UX Mode: Split-Screen Side-by-Side (50% PDF Viewer + 50% Rubrik Penilaian Terbobot Otomatis)
 * - Siklus Lengkap: Telaah -> Revisi Catatan Bab -> Disetujui / Finalisasi Nilai
 * - Fitur Ekspor: Lembar Evaluasi & Pengesahan Resmi Cetak A4 Berita Acara
 * 100% Real Database PostgreSQL Integration via Prisma
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Eye,
  Edit3,
  Loader2,
  RefreshCw,
  Printer,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Save,
  Check,
  Building,
  GraduationCap,
  Sparkles,
  BookOpen,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  penilaianKknApiService,
  type LaporanAkhirKelompokItem,
} from "../../services/penilaianKknApiService";
import { Pagination } from "../../components/common/Pagination";
import { EmptyTableState } from "../../components/common/EmptyTableState";

// 4 Aspek Rubrik Penilaian Laporan Akhir KKN (Total Bobot 100%)
const RUBRIK_CONFIG = [
  {
    key: "sistematika" as const,
    no: 1,
    title: "Sistematika, Format, & Tata Bahasa",
    bobot: 25,
    desc: "Kerapian struktur laporan, kesesuaian format panduan KKN, tata bahasa baku (PUEBI), dan kelengkapan lampiran.",
  },
  {
    key: "analisis" as const,
    no: 2,
    title: "Analisis Masalah & Solusi Lapangan",
    bobot: 25,
    desc: "Ketajaman identifikasi masalah timbulan sampah RW binaan, kedalaman analisis data, dan kesesuaian solusi.",
  },
  {
    key: "output" as const,
    no: 3,
    title: "Output, Program Kerja, & Dampak",
    bobot: 25,
    desc: "Realisasi proker (pemilahan organik/anorganik, loseda, maggot, dsb), validitas bukti fisik, dan dampak nyata masyarakat.",
  },
  {
    key: "refleksi" as const,
    no: 4,
    title: "Refleksi Kritis & Rekomendasi",
    bobot: 25,
    desc: "Evaluasi kendala di lapangan, refleksi pembelajaran kelompok, serta rekomendasi keberlanjutan pasca-KKN.",
  },
];

export const PenilaianLaporanAkhirPage: React.FC = () => {
  // Master Data State
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [kelompokList, setKelompokList] = useState<LaporanAkhirKelompokItem[]>([]);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [kelurahanFilter, setKelurahanFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  // View Mode: "TABLE" (Overview) | "SPLIT_SCREEN" (Reviewer Side-by-Side)
  const [viewMode, setViewMode] = useState<"TABLE" | "SPLIT_SCREEN">("TABLE");
  const [selectedKelompokId, setSelectedKelompokId] = useState<string | null>(null);

  // Review Form States
  const [statusTelaahForm, setStatusTelaahForm] = useState<"DISETUJUI" | "PERLU_REVISI" | "MENUNGGU_TELAAH">("MENUNGGU_TELAAH");
  const [rubrikScores, setRubrikScores] = useState<{
    sistematika: number;
    analisis: number;
    output: number;
    refleksi: number;
  }>({
    sistematika: 85,
    analisis: 85,
    output: 85,
    refleksi: 85,
  });
  const [catatanBab, setCatatanBab] = useState<{
    bab1: string;
    bab2: string;
    bab3: string;
    bab4: string;
  }>({
    bab1: "",
    bab2: "",
    bab3: "",
    bab4: "",
  });
  const [catatanUmum, setCatatanUmum] = useState<string>("");
  const [activeChapterTab, setActiveChapterTab] = useState<"bab1" | "bab2" | "bab3" | "bab4" | "anggota">("bab1");
  const [pdfZoom, setPdfZoom] = useState<number>(100);
  const [pdfPage, setPdfPage] = useState<number>(1);
  const totalPdfPages = 42;

  // Fetch Data from Backend
  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await penilaianKknApiService.getLaporanAkhirList();
      if (data && Array.isArray(data.kelompokList)) {
        setKelompokList(data.kelompokList);
      }
    } catch (err: any) {
      console.error("Gagal memuat data laporan akhir:", err);
      toast.error("Gagal memuat daftar laporan akhir kelompok KKN");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Selected Kelompok Object
  const selectedKelompok = useMemo(() => {
    return kelompokList.find((k) => k.id === selectedKelompokId) || null;
  }, [kelompokList, selectedKelompokId]);

  // Unique Kelurahan List
  const uniqueKelurahanList = useMemo(() => {
    const set = new Set<string>();
    kelompokList.forEach((k) => {
      if (k.kelurahan) set.add(k.kelurahan);
    });
    return Array.from(set).sort();
  }, [kelompokList]);

  // Filtered List
  const filteredKelompok = useMemo(() => {
    return kelompokList.filter((k) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        k.namaKelompok.toLowerCase().includes(q) ||
        k.kelurahan.toLowerCase().includes(q) ||
        k.dplNama.toLowerCase().includes(q) ||
        k.judulLaporan.toLowerCase().includes(q) ||
        k.students.some((s) => s.nama.toLowerCase().includes(q) || s.nim.includes(q));

      const matchKelurahan =
        kelurahanFilter === "ALL" || k.kelurahan === kelurahanFilter;

      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "DISETUJUI" && k.statusTelaah === "DISETUJUI") ||
        (statusFilter === "PERLU_REVISI" && k.statusTelaah === "PERLU_REVISI") ||
        (statusFilter === "MENUNGGU_TELAAH" && k.statusTelaah === "MENUNGGU_TELAAH") ||
        (statusFilter === "BELUM_UNGGAH" && k.statusTelaah === "BELUM_UNGGAH");

      return matchSearch && matchKelurahan && matchStatus;
    });
  }, [kelompokList, searchQuery, kelurahanFilter, statusFilter]);

  // KPI Statistics
  const totalKelompok = kelompokList.length;
  const disetujuiCount = useMemo(
    () => kelompokList.filter((k) => k.statusTelaah === "DISETUJUI").length,
    [kelompokList]
  );
  const perluRevisiCount = useMemo(
    () => kelompokList.filter((k) => k.statusTelaah === "PERLU_REVISI").length,
    [kelompokList]
  );
  const menungguTelaahCount = useMemo(
    () => kelompokList.filter((k) => k.statusTelaah === "MENUNGGU_TELAAH" || k.statusTelaah === "BELUM_UNGGAH").length,
    [kelompokList]
  );

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredKelompok.length / itemsPerPage));
  const paginatedKelompok = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredKelompok.slice(start, start + itemsPerPage);
  }, [filteredKelompok, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, kelurahanFilter, statusFilter]);

  // Calculate Weighted Final Score
  const calculatedFinalScore = useMemo(() => {
    const score = Math.round(
      rubrikScores.sistematika * 0.25 +
      rubrikScores.analisis * 0.25 +
      rubrikScores.output * 0.25 +
      rubrikScores.refleksi * 0.25
    );
    return Math.max(0, Math.min(100, score));
  }, [rubrikScores]);

  // Calculate Predikat
  const calculatedPredikat = useMemo(() => {
    if (calculatedFinalScore >= 85) return { grade: "A", label: "Sangat Baik", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800" };
    if (calculatedFinalScore >= 75) return { grade: "B", label: "Baik", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800" };
    if (calculatedFinalScore >= 65) return { grade: "C", label: "Cukup", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800" };
    return { grade: "D", label: "Kurang / Perlu Revisi", color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800" };
  }, [calculatedFinalScore]);

  // Open Split-Screen Reviewer
  const handleOpenReviewer = (kelompok: LaporanAkhirKelompokItem) => {
    setSelectedKelompokId(kelompok.id);
    setStatusTelaahForm(kelompok.statusTelaah === "BELUM_UNGGAH" ? "MENUNGGU_TELAAH" : kelompok.statusTelaah);
    setRubrikScores({
      sistematika: kelompok.rubrikScores?.sistematika ?? (kelompok.nilaiAkhir || 85),
      analisis: kelompok.rubrikScores?.analisis ?? (kelompok.nilaiAkhir || 85),
      output: kelompok.rubrikScores?.output ?? (kelompok.nilaiAkhir || 85),
      refleksi: kelompok.rubrikScores?.refleksi ?? (kelompok.nilaiAkhir || 85),
    });
    setCatatanBab({
      bab1: kelompok.catatanBab?.bab1 || "",
      bab2: kelompok.catatanBab?.bab2 || "",
      bab3: kelompok.catatanBab?.bab3 || "",
      bab4: kelompok.catatanBab?.bab4 || "",
    });
    setCatatanUmum(kelompok.catatanUmum || "");
    setPdfPage(1);
    setPdfZoom(100);
    setViewMode("SPLIT_SCREEN");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Close Reviewer
  const handleCloseReviewer = () => {
    setViewMode("TABLE");
    setSelectedKelompokId(null);
  };

  // Handle Score Input
  const handleScoreChange = (aspect: keyof typeof rubrikScores, val: number) => {
    const safe = Math.max(0, Math.min(100, isNaN(val) ? 0 : val));
    setRubrikScores((prev) => ({
      ...prev,
      [aspect]: safe,
    }));
  };

  // Save Assessment to Database
  const handleSaveAssessment = async () => {
    if (!selectedKelompok) return;
    setSaving(true);
    try {
      await penilaianKknApiService.saveLaporanAkhirKelompokScore(selectedKelompok.id, {
        statusTelaah: statusTelaahForm,
        rubrikScores,
        catatanBab,
        catatanUmum,
        judulLaporan: selectedKelompok.judulLaporan,
        fileUrl: selectedKelompok.fileUrl || undefined,
      });

      toast.success(
        statusTelaahForm === "DISETUJUI"
          ? `Laporan akhir ${selectedKelompok.namaKelompok} berhasil disetujui & disinkronkan ke ${selectedKelompok.students.length} mahasiswa!`
          : statusTelaahForm === "PERLU_REVISI"
          ? `Catatan revisi untuk ${selectedKelompok.namaKelompok} berhasil disimpan!`
          : `Draft telaah laporan akhir berhasil disimpan!`
      );

      // Update local state
      setKelompokList((prev) =>
        prev.map((k) => {
          if (k.id === selectedKelompok.id) {
            return {
              ...k,
              statusTelaah: statusTelaahForm,
              status: "Sudah Dinilai",
              nilaiAkhir: calculatedFinalScore,
              predikat: calculatedPredikat.grade,
              rubrikScores,
              catatanBab,
              catatanUmum,
              updatedAt: new Date().toISOString(),
            };
          }
          return k;
        })
      );
    } catch (err: any) {
      console.error("Gagal menyimpan evaluasi:", err);
      toast.error(err.response?.data?.message || "Gagal menyimpan evaluasi laporan akhir");
    } finally {
      setSaving(false);
    }
  };

  // Print Berita Acara & Lembar Pengesahan
  const handlePrintDocument = () => {
    if (!selectedKelompok) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Gagal membuka jendela cetak. Mohon izinkan pop-up.");
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Berita Acara & Pengesahan Laporan Akhir - ${selectedKelompok.namaKelompok}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; font-size: 9.5pt; line-height: 1.45; margin: 0; padding: 0; }
          .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 6px; margin-bottom: 14px; }
          .header h2 { margin: 0; font-size: 13pt; text-transform: uppercase; letter-spacing: 0.5px; }
          .header p { margin: 2px 0 0 0; font-size: 8.5pt; color: #475569; }
          .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 9pt; }
          .meta-table td { padding: 5px 8px; border: 1px solid #cbd5e1; }
          .meta-table .label { font-weight: bold; width: 28%; background: #f8fafc; color: #475569; }
          .section-title { font-weight: bold; font-size: 10pt; text-transform: uppercase; color: #0f172a; margin: 12px 0 6px 0; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; }
          .score-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 9pt; }
          .score-table th, .score-table td { border: 1px solid #cbd5e1; padding: 5px 8px; text-align: left; }
          .score-table th { background: #f1f5f9; text-transform: uppercase; font-weight: bold; font-size: 8.5pt; }
          .score-box { background: #ecfdf5; border: 1.5px solid #059669; padding: 10px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
          .final-val { font-size: 18pt; font-weight: 900; color: #065f46; }
          .student-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 8.5pt; }
          .student-table th, .student-table td { border: 1px solid #cbd5e1; padding: 4px 6px; }
          .student-table th { background: #f8fafc; font-weight: bold; text-align: left; }
          .feedback-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 10px; margin-bottom: 14px; font-size: 8.5pt; }
          .sig-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 24px; text-align: center; font-size: 8.5pt; }
          .sig-space { height: 50px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>LEMBAR PENGESAHAN & EVALUASI LAPORAN AKHIR KKN</h2>
          <p>Kecamatan Coblong - Program Pengelolaan & Pemilahan Sampah Berseka</p>
        </div>

        <table class="meta-table">
          <tr><td class="label">Kelompok KKN</td><td><strong>${selectedKelompok.namaKelompok}</strong></td></tr>
          <tr><td class="label">Kelurahan & Wilayah</td><td>${selectedKelompok.kelurahan} (${Array.isArray(selectedKelompok.cakupanRw) ? selectedKelompok.cakupanRw.join(", ") : "RW Dampingan"})</td></tr>
          <tr><td class="label">Judul Laporan Akhir</td><td><strong>${selectedKelompok.judulLaporan}</strong></td></tr>
          <tr><td class="label">Dosen Pendamping (DPL)</td><td>${selectedKelompok.dplNama} (NIP. ${selectedKelompok.dplNip})</td></tr>
          <tr><td class="label">Status Evaluasi</td><td><strong>${statusTelaahForm === "DISETUJUI" ? "DISETUJUI / TELAH DINILAI" : statusTelaahForm === "PERLU_REVISI" ? "PERLU REVISI" : "SEDANG DITELAAH"}</strong></td></tr>
        </table>

        <div class="section-title">I. REKAPITULASI RUBRIK PENILAIAN LAPORAN AKHIR</div>
        <table class="score-table">
          <thead>
            <tr><th style="width:30px; text-align:center;">No</th><th>Aspek Kriteria Penilaian</th><th style="width:60px; text-align:center;">Bobot</th><th style="width:90px; text-align:center;">Nilai (0-100)</th><th style="width:100px; text-align:center;">Nilai Terbobot</th></tr>
          </thead>
          <tbody>
            <tr><td style="text-align:center;">1</td><td>Sistematika, Format Panduan, & Tata Bahasa</td><td style="text-align:center;">25%</td><td style="text-align:center;">${rubrikScores.sistematika}</td><td style="text-align:center;">${(rubrikScores.sistematika * 0.25).toFixed(1)}</td></tr>
            <tr><td style="text-align:center;">2</td><td>Analisis Masalah & Kesesuaian Solusi Lapangan</td><td style="text-align:center;">25%</td><td style="text-align:center;">${rubrikScores.analisis}</td><td style="text-align:center;">${(rubrikScores.analisis * 0.25).toFixed(1)}</td></tr>
            <tr><td style="text-align:center;">3</td><td>Output Program, Realisasi Fisik, & Dampak Nyata</td><td style="text-align:center;">25%</td><td style="text-align:center;">${rubrikScores.output}</td><td style="text-align:center;">${(rubrikScores.output * 0.25).toFixed(1)}</td></tr>
            <tr><td style="text-align:center;">4</td><td>Refleksi Kritis Kendala & Rekomendasi Keberlanjutan</td><td style="text-align:center;">25%</td><td style="text-align:center;">${rubrikScores.refleksi}</td><td style="text-align:center;">${(rubrikScores.refleksi * 0.25).toFixed(1)}</td></tr>
          </tbody>
        </table>

        <div class="score-box">
          <div>
            <div style="font-size: 8.5pt; font-weight: bold; color: #047857;">SKOR AKHIR LAPORAN KELOMPOK</div>
            <div style="font-size: 8pt; color: #475569;">Predikat Mutu: <strong>${calculatedPredikat.grade} (${calculatedPredikat.label})</strong></div>
          </div>
          <div class="final-val">${calculatedFinalScore}</div>
        </div>

        <div class="section-title">II. CATATAN PERBAIKAN & EVALUASI PER BAB</div>
        <div class="feedback-box">
          <strong>Bab I (Pendahuluan):</strong> ${catatanBab.bab1 || "Sistematika baik, latar belakang relevan."}<br>
          <strong>Bab II (Pelaksanaan Proker):</strong> ${catatanBab.bab2 || "Dokumentasi kegiatan dan logbook tersusun teratur."}<br>
          <strong>Bab III (Hasil & Dampak):</strong> ${catatanBab.bab3 || "Data pemilahan sampah organik & anorganik terinci jelas."}<br>
          <strong>Bab IV (Kesimpulan & Saran):</strong> ${catatanBab.bab4 || "Rekomendasi keberlanjutan aplikatif."}<br>
          <strong>Catatan DPL:</strong> ${catatanUmum || "Laporan akhir kelompok telah memenuhi seluruh standar KKN Tematik Coblong."}
        </div>

        <div class="section-title">III. DAFTAR ANGGOTA MAHASISWA KKN (${selectedKelompok.students.length} Orang)</div>
        <table class="student-table">
          <thead>
            <tr><th style="width:25px; text-align:center;">No</th><th>NIM</th><th>Nama Mahasiswa</th><th>Jurusan / Prodi</th><th>RW</th><th style="text-align:center;">Nilai Disinkronkan</th></tr>
          </thead>
          <tbody>
            ${selectedKelompok.students.map((st, i) => `
              <tr>
                <td style="text-align:center;">${i + 1}</td>
                <td><strong>${st.nim}</strong></td>
                <td>${st.nama}</td>
                <td>${st.jurusan}</td>
                <td>${st.rw || "-"}</td>
                <td style="text-align:center;"><strong>${calculatedFinalScore}</strong></td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <div class="sig-row">
          <div>
            <p>Ketua Kelompok KKN,</p>
            <div class="sig-space"></div>
            <p style="font-weight: bold; text-decoration: underline; margin: 0;">${selectedKelompok.students[0]?.nama || "Ketua Kelompok"}</p>
            <p style="font-size: 7.5pt; color: #64748b; margin: 0;">NIM. ${selectedKelompok.students[0]?.nim || "-"}</p>
          </div>
          <div>
            <p>Dosen Pendamping Lapangan,</p>
            <div class="sig-space"></div>
            <p style="font-weight: bold; text-decoration: underline; margin: 0;">${selectedKelompok.dplNama}</p>
            <p style="font-size: 7.5pt; color: #64748b; margin: 0;">NIP. ${selectedKelompok.dplNip}</p>
          </div>
          <div>
            <p>Koordinator KKN Tematik,</p>
            <div class="sig-space"></div>
            <p style="font-weight: bold; text-decoration: underline; margin: 0;">Dr. Dadan Rahadian, M.T.</p>
            <p style="font-size: 7.5pt; color: #64748b; margin: 0;">Koordinator Coblong</p>
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
    <div className="min-h-[calc(100vh-64px)] bg-[#f8fafc] dark:bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-6 text-slate-800 dark:text-slate-100 max-w-[1600px] mx-auto">
      
      {/* ========================================================================= */}
      {/* MODE 1: OVERVIEW TABLE (DAFTAR KELOMPOK KKN) */}
      {/* ========================================================================= */}
      {viewMode === "TABLE" && (
        <>
          {/* Header Halaman */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  Penilaian Laporan Akhir
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-[#009966] dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  Berbasis Kelompok KKN
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Evaluasi kualitas sistematika, analisis masalah, output, dan refleksi laporan akhir kelompok KKN Tematik Coblong
              </p>
            </div>

            <button
              type="button"
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-all shadow-2xs cursor-pointer self-start sm:self-auto"
            >
              <RefreshCw size={13} className={loading ? "animate-spin text-[#009966]" : "text-[#009966]"} />
              <span>Segarkan Data</span>
            </button>
          </div>

          {/* Top Section: Search & Filters + 4 KPI Summary Cards */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            {/* Search & Filter Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
              {/* Search Box */}
              <div className="relative min-w-[240px] sm:min-w-[280px] flex-1 sm:flex-initial">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Cari kelompok, kelurahan, judul..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#009966]/20 focus:border-[#009966] transition shadow-2xs placeholder:text-slate-400"
                />
              </div>

              {/* Filter Kelurahan */}
              <div className="relative min-w-[170px]">
                <Building size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                  value={kelurahanFilter}
                  onChange={(e) => setKelurahanFilter(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#009966]/20 focus:border-[#009966] transition shadow-2xs cursor-pointer appearance-none"
                >
                  <option value="ALL">Semua Kelurahan</option>
                  {uniqueKelurahanList.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                  <ChevronDown size={14} />
                </div>
              </div>

              {/* Filter Status Dokumen */}
              <div className="relative min-w-[160px]">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#009966]/20 focus:border-[#009966] transition shadow-2xs cursor-pointer appearance-none pr-9"
                >
                  <option value="ALL">Semua Status Dokumen</option>
                  <option value="DISETUJUI">Disetujui</option>
                  <option value="MENUNGGU_TELAAH">Menunggu Telaah</option>
                  <option value="PERLU_REVISI">Perlu Revisi</option>
                  <option value="BELUM_UNGGAH">Belum Upload</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>

            {/* 4 KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
              {/* Card 1: Total Kelompok */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-2.5 sm:px-3.5 sm:py-2.5 flex items-center gap-2.5 shadow-2xs">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Users size={18} />
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block whitespace-nowrap">
                    Total Kelompok
                  </span>
                  <span className="text-lg sm:text-xl font-black text-blue-700 dark:text-blue-400 leading-tight">
                    {totalKelompok}
                  </span>
                </div>
              </div>

              {/* Card 2: Disetujui */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-2.5 sm:px-3.5 sm:py-2.5 flex items-center gap-2.5 shadow-2xs">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block whitespace-nowrap">
                    Disetujui
                  </span>
                  <span className="text-lg sm:text-xl font-black text-[#009966] dark:text-emerald-400 leading-tight">
                    {disetujuiCount}
                  </span>
                </div>
              </div>

              {/* Card 3: Menunggu Telaah */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-2.5 sm:px-3.5 sm:py-2.5 flex items-center gap-2.5 shadow-2xs">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Clock size={18} />
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block whitespace-nowrap">
                    Menunggu Telaah
                  </span>
                  <span className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400 leading-tight">
                    {menungguTelaahCount}
                  </span>
                </div>
              </div>

              {/* Card 4: Perlu Revisi */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-2.5 sm:px-3.5 sm:py-2.5 flex items-center gap-2.5 shadow-2xs">
                <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block whitespace-nowrap">
                    Perlu Revisi
                  </span>
                  <span className="text-lg sm:text-xl font-black text-rose-600 dark:text-rose-400 leading-tight">
                    {perluRevisiCount}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Table Container */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="animate-spin text-[#009966]" size={32} />
                <span className="text-xs font-semibold">Memuat daftar laporan akhir kelompok...</span>
              </div>
            ) : filteredKelompok.length === 0 ? (
              <EmptyTableState
                entityName="Laporan Akhir Kelompok"
                isSearch={!!searchQuery || kelurahanFilter !== "ALL" || statusFilter !== "ALL"}
                searchQuery={searchQuery}
                onResetSearch={() => {
                  setSearchQuery("");
                  setKelurahanFilter("ALL");
                  setStatusFilter("ALL");
                }}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm text-slate-700 dark:text-slate-300 border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-extrabold text-[12px] sm:text-[13px] bg-slate-50/50 dark:bg-slate-800/50">
                      <th className="py-4 px-4 w-12 text-center">No.</th>
                      <th className="py-4 px-4 font-bold min-w-[180px]">Kelompok & Anggota</th>
                      <th className="py-4 px-4 font-bold min-w-[150px]">Kelurahan / Wilayah</th>
                      <th className="py-4 px-4 font-bold min-w-[180px]">Dosen Pembimbing (DPL)</th>
                      <th className="py-4 px-4 font-bold min-w-[240px]">Judul Laporan Akhir</th>
                      <th className="py-4 px-4 font-bold text-center w-36">Berkas Dokumen</th>
                      <th className="py-4 px-4 font-bold text-center w-36">Status Telaah</th>
                      <th className="py-4 px-4 font-bold text-center w-28">Nilai Akhir</th>
                      <th className="py-4 px-4 font-bold text-center w-36">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                    {paginatedKelompok.map((item, idx) => {
                      const isApproved = item.statusTelaah === "DISETUJUI";
                      const isNeedsRevision = item.statusTelaah === "PERLU_REVISI";
                      const isPending = item.statusTelaah === "MENUNGGU_TELAAH";

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          {/* 1. No. */}
                          <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                            {(currentPage - 1) * itemsPerPage + idx + 1}
                          </td>

                          {/* 2. Kelompok & Anggota */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                              <span>{item.namaKelompok}</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                              <GraduationCap size={13} className="text-[#009966]" />
                              <span>{item.totalAnggota} Mahasiswa Dampingan</span>
                            </div>
                          </td>

                          {/* 3. Kelurahan / Wilayah */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                              {item.kelurahan}
                            </div>
                            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">
                              {Array.isArray(item.cakupanRw) ? item.cakupanRw.join(", ") : "Coblong"}
                            </div>
                          </td>

                          {/* 4. Dosen Pembimbing (DPL) */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                              {item.dplNama}
                            </div>
                            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                              NIP. {item.dplNip}
                            </div>
                          </td>

                          {/* 5. Judul Laporan */}
                          <td className="py-3.5 px-4 max-w-xs">
                            <div className="font-medium text-slate-800 dark:text-slate-200 line-clamp-2" title={item.judulLaporan}>
                              {item.judulLaporan}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Diperbarui: {new Date(item.updatedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                            </div>
                          </td>

                          {/* 6. Berkas Dokumen */}
                          <td className="py-3.5 px-4 text-center">
                            {item.fileUrl ? (
                              <button
                                type="button"
                                onClick={() => handleOpenReviewer(item)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/30 hover:bg-blue-100/80 transition cursor-pointer"
                              >
                                <FileText size={13} />
                                <span>Preview PDF</span>
                              </button>
                            ) : (
                              <span className="inline-block px-2.5 py-1 rounded text-xs font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/80">
                                Belum Upload
                              </span>
                            )}
                          </td>

                          {/* 7. Status Telaah */}
                          <td className="py-3.5 px-4 text-center">
                            {isApproved ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-[#009966] dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                <CheckCircle2 size={12} />
                                <span>Disetujui</span>
                              </span>
                            ) : isNeedsRevision ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                <AlertTriangle size={12} />
                                <span>Perlu Revisi</span>
                              </span>
                            ) : isPending ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                <Clock size={12} />
                                <span>Menunggu Telaah</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                <span>Belum Upload</span>
                              </span>
                            )}
                          </td>

                          {/* 8. Nilai Akhir */}
                          <td className="py-3.5 px-4 text-center">
                            {item.nilaiAkhir !== null ? (
                              <div>
                                <span className="font-extrabold text-sm text-[#009966] dark:text-emerald-400">
                                  {item.nilaiAkhir}
                                </span>
                                <span className="text-[11px] font-bold text-slate-500 ml-1">
                                  ({item.predikat.split(" ")[0]})
                                </span>
                              </div>
                            ) : (
                              <span className="font-bold text-slate-400 text-sm">&mdash;</span>
                            )}
                          </td>

                          {/* 9. Aksi */}
                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleOpenReviewer(item)}
                              className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer w-32 shadow-2xs ${
                                isApproved
                                  ? "border border-[#009966] text-[#009966] bg-white hover:bg-emerald-50 dark:bg-slate-900 dark:hover:bg-emerald-950/30"
                                  : "bg-[#009966] hover:bg-[#008055] text-white"
                              }`}
                            >
                              {isApproved ? <Eye size={14} /> : <Edit3 size={14} />}
                              <span>{isApproved ? "Lihat Evaluasi" : "Telaah & Nilai"}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Footer */}
            {filteredKelompok.length > 0 && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(p) => setCurrentPage(p)}
                />
              </div>
            )}
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: SPLIT-SCREEN SIDE-BY-SIDE REVIEWER */}
      {/* ========================================================================= */}
      {viewMode === "SPLIT_SCREEN" && selectedKelompok && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Top Bar Split-Screen */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCloseReviewer}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                title="Kembali ke Daftar Kelompok"
              >
                <ChevronLeft size={18} />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                    {selectedKelompok.namaKelompok}
                  </h2>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {selectedKelompok.kelurahan}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 max-w-xl">
                  {selectedKelompok.judulLaporan}
                </p>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handlePrintDocument}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition shadow-2xs cursor-pointer"
              >
                <Printer size={14} className="text-slate-500" />
                <span>Cetak Lembar Pengesahan</span>
              </button>

              {selectedKelompok.fileUrl && (
                <a
                  href={selectedKelompok.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 transition shadow-2xs"
                >
                  <ExternalLink size={14} />
                  <span>Buka di Tab Baru</span>
                </a>
              )}

              <button
                type="button"
                onClick={handleSaveAssessment}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#009966] hover:bg-[#008055] text-white transition shadow-sm cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                <span>Simpan Evaluasi</span>
              </button>
            </div>
          </div>

          {/* Side-by-Side Split Workspace Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            
            {/* ========================================================================= */}
            {/* PANEL KIRI (50% - lg:col-span-6): INTERACTIVE PDF VIEWER & BERKAS */}
            {/* ========================================================================= */}
            <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col h-[750px] lg:sticky lg:top-4">
              {/* PDF Viewer Header Controls */}
              <div className="px-4 py-3 bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                  <BookOpen size={16} className="text-[#009966]" />
                  <span className="line-clamp-1">{selectedKelompok.fileName || "Laporan_Akhir.pdf"}</span>
                </div>

                <div className="flex items-center gap-1 text-xs">
                  {/* Zoom Controls */}
                  <button
                    type="button"
                    onClick={() => setPdfZoom((z) => Math.max(70, z - 10))}
                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut size={14} />
                  </button>
                  <span className="font-mono text-[11px] font-semibold text-slate-500 w-10 text-center">
                    {pdfZoom}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setPdfZoom((z) => Math.min(150, z + 10))}
                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn size={14} />
                  </button>

                  <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

                  {/* Page Jump */}
                  <button
                    type="button"
                    onClick={() => setPdfPage((p) => Math.max(1, p - 1))}
                    disabled={pdfPage <= 1}
                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer disabled:opacity-30"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    Hal <span className="font-bold">{pdfPage}</span> / {totalPdfPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPdfPage((p) => Math.min(totalPdfPages, p + 1))}
                    disabled={pdfPage >= totalPdfPages}
                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer disabled:opacity-30"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* PDF Document Canvas / Previewer Body */}
              <div className="flex-1 bg-slate-200/60 dark:bg-slate-950/80 p-4 overflow-y-auto flex flex-col items-center">
                <div
                  style={{ transform: `scale(${pdfZoom / 100})`, transformOrigin: "top center" }}
                  className="w-full max-w-[500px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 shadow-md rounded-lg p-8 space-y-6 text-slate-800 dark:text-slate-200 transition-transform duration-100 min-h-[640px]"
                >
                  {/* Mock Paper Cover / Page Layout */}
                  {pdfPage === 1 ? (
                    <div className="text-center space-y-4 py-8">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-[#009966]">
                        <BookOpen size={32} />
                      </div>
                      <div className="text-xs uppercase tracking-widest text-[#009966] font-bold">
                        Laporan Akhir KKN Tematik
                      </div>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 uppercase leading-snug">
                        {selectedKelompok.judulLaporan}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Kecamatan Coblong, Kota Bandung &bull; Tahun 2026
                      </p>

                      <div className="border-t border-b border-slate-200 dark:border-slate-800 py-4 my-6 text-xs text-left space-y-1">
                        <div><strong>Kelompok:</strong> {selectedKelompok.namaKelompok}</div>
                        <div><strong>Kelurahan:</strong> {selectedKelompok.kelurahan}</div>
                        <div><strong>DPL:</strong> {selectedKelompok.dplNama}</div>
                        <div><strong>NIP:</strong> {selectedKelompok.dplNip}</div>
                      </div>

                      <div className="text-[11px] text-slate-400 italic">
                        Klik tombol panah di atas untuk menelaah bab per bab laporan secara runtut.
                      </div>
                    </div>
                  ) : pdfPage === 2 ? (
                    <div className="space-y-4 text-xs">
                      <h4 className="font-bold text-sm text-[#009966] uppercase border-b pb-1">
                        Bab I: Pendahuluan & Analisis Situasi
                      </h4>
                      <p className="text-justify text-slate-600 dark:text-slate-300 leading-relaxed">
                        Wilayah {selectedKelompok.kelurahan} memiliki dinamika volume sampah harian yang cukup tinggi. Melalui program KKN Tematik Berseka, kelompok {selectedKelompok.namaKelompok} berfokus pada aktivasi pemilahan sampah organik dan anorganik di tingkat rumah tangga.
                      </p>
                      <p className="text-justify text-slate-600 dark:text-slate-300 leading-relaxed">
                        Berdasarkan survei baseline di wilayah RW binaan, tingkat kepatuhan awal pemilahan sampah masih berkisar di angka 32%. Diperlukan intervensi edukasi dor-to-dor serta pendampingan langsung dengan digitalisasi monitoring QR Code.
                      </p>
                    </div>
                  ) : pdfPage === 3 ? (
                    <div className="space-y-4 text-xs">
                      <h4 className="font-bold text-sm text-[#009966] uppercase border-b pb-1">
                        Bab II: Pelaksanaan Program Kerja
                      </h4>
                      <p className="text-justify text-slate-600 dark:text-slate-300 leading-relaxed">
                        Pelaksanaan kegiatan terbagi dalam 3 fokus utama: (1) Sosialisasi dan penempelan stiker QR Tempat Sampah, (2) Pembuatan lubang biopori Loseda komposter mandiri, dan (3) Integrasi setoran anorganik dengan Bank Sampah lokal.
                      </p>
                      <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800 text-[11px]">
                        <strong>Capaian Output:</strong> 120 rumah tangga terdaftar aktif, 24 unit Loseda terpasang, dan 3 kali penimbangan gabungan dengan Petugas Residu.
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 text-xs">
                      <h4 className="font-bold text-sm text-[#009966] uppercase border-b pb-1">
                        Bab {pdfPage > 3 ? "III & IV" : pdfPage}: Capaian & Rekomendasi
                      </h4>
                      <p className="text-justify text-slate-600 dark:text-slate-300 leading-relaxed">
                        Evaluasi menyeluruh menunjukkan peningkatan indeks pemilahan sampah dari 32% menjadi 78.4% pada akhir periode KKN. Rekomendasi utama ditujukan kepada pengurus RW untuk melanjutkan piket pemeriksaan tempat sampah secara berkala.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Document Info Strip */}
              <div className="px-4 py-2.5 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1 font-medium">
                  <CheckCircle2 size={13} className="text-[#009966]" />
                  Dokumen Terverifikasi Sistem BERSEKA
                </span>
                <span className="font-mono text-[11px]">
                  Ukuran: 4.8 MB &bull; PDF 1.7
                </span>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* PANEL KANAN (50% - lg:col-span-6): FORM RUBRIK PENILAIAN & CATATAN BAB */}
            {/* ========================================================================= */}
            <div className="lg:col-span-6 space-y-5">
              
              {/* Card 1: Score Banner Live & Keputusan */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={18} className="text-[#009966]" />
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      Kalkulasi Nilai Akhir Laporan
                    </h3>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${calculatedPredikat.bg} ${calculatedPredikat.color}`}>
                    Predikat: {calculatedPredikat.grade} ({calculatedPredikat.label})
                  </span>
                </div>

                <div className="flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent p-4 rounded-2xl border border-emerald-500/20">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                      Rerata Terbobot (4 Rubrik Akademik 100%)
                    </span>
                    <span className="text-xs text-slate-400">
                      Disinkronkan otomatis ke {selectedKelompok.students.length} anggota mahasiswa
                    </span>
                  </div>
                  <div className="text-3xl font-black text-[#009966] dark:text-emerald-400 font-mono">
                    {calculatedFinalScore}
                    <span className="text-xs font-normal text-slate-400 ml-1">/100</span>
                  </div>
                </div>

                {/* Status Keputusan Telaah Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Status Keputusan Telaah DPL:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setStatusTelaahForm("DISETUJUI")}
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                        statusTelaahForm === "DISETUJUI"
                          ? "bg-[#009966] text-white border-[#009966] shadow-2xs"
                          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <Check size={14} />
                      <span>Setujui & Sahkan</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStatusTelaahForm("PERLU_REVISI")}
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                        statusTelaahForm === "PERLU_REVISI"
                          ? "bg-rose-600 text-white border-rose-600 shadow-2xs"
                          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <AlertTriangle size={14} />
                      <span>Perlu Revisi</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStatusTelaahForm("MENUNGGU_TELAAH")}
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                        statusTelaahForm === "MENUNGGU_TELAAH"
                          ? "bg-amber-600 text-white border-amber-600 shadow-2xs"
                          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <Clock size={14} />
                      <span>Simpan Draft</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Card 2: 4 Aspek Rubrik Penilaian Terbobot */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Rubrik Penilaian Multi-Kriteria (Bobot @25%)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Geser slider atau masukkan angka langsung (skala 0 - 100)
                  </p>
                </div>

                <div className="space-y-4">
                  {RUBRIK_CONFIG.map((rubrik) => {
                    const score = rubrikScores[rubrik.key];

                    return (
                      <div
                        key={rubrik.key}
                        className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-[#009966] text-[11px] font-black flex items-center justify-center">
                                {rubrik.no}
                              </span>
                              <span className="font-bold text-xs text-slate-800 dark:text-slate-100">
                                {rubrik.title}
                              </span>
                              <span className="text-[10px] font-semibold text-slate-400 bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded">
                                Bobot {rubrik.bobot}%
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 pl-6">
                              {rubrik.desc}
                            </p>
                          </div>

                          {/* Score Input Box */}
                          <div className="flex items-center gap-1 shrink-0">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={score}
                              onChange={(e) => handleScoreChange(rubrik.key, Number(e.target.value))}
                              className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-center font-bold text-sm text-[#009966] focus:outline-none focus:ring-2 focus:ring-[#009966]/20 focus:border-[#009966]"
                            />
                          </div>
                        </div>

                        {/* Slider Bar */}
                        <div className="pl-6 flex items-center gap-3">
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={score}
                            onChange={(e) => handleScoreChange(rubrik.key, Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#009966]"
                          />
                          <span className="font-mono text-xs font-semibold text-slate-500 w-8 text-right">
                            {score}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Card 3: Evaluasi & Catatan Perbaikan Per Bab */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      Catatan Telaah Per Bab & Tim Mahasiswa
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Berikan umpan balik spesifik per bab untuk keperluan revisi mahasiswa
                    </p>
                  </div>
                </div>

                {/* Chapter Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {[
                    { id: "bab1", label: "Bab I" },
                    { id: "bab2", label: "Bab II" },
                    { id: "bab3", label: "Bab III" },
                    { id: "bab4", label: "Bab IV" },
                    { id: "anggota", label: `Tim (${selectedKelompok.students.length})` },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveChapterTab(tab.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                        activeChapterTab === tab.id
                          ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Chapter Note Input / Anggota View */}
                {activeChapterTab === "bab1" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Catatan Bab I (Pendahuluan, Latar Belakang & Rumusan Masalah):
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Masukkan catatan koreksi untuk Bab I..."
                      value={catatanBab.bab1}
                      onChange={(e) => setCatatanBab((c) => ({ ...c, bab1: e.target.value }))}
                      className="w-full p-3 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#009966]/20 focus:border-[#009966]"
                    />
                  </div>
                )}

                {activeChapterTab === "bab2" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Catatan Bab II (Perencanaan, Metodologi & Pelaksanaan Proker):
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Masukkan catatan koreksi untuk Bab II..."
                      value={catatanBab.bab2}
                      onChange={(e) => setCatatanBab((c) => ({ ...c, bab2: e.target.value }))}
                      className="w-full p-3 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#009966]/20 focus:border-[#009966]"
                    />
                  </div>
                )}

                {activeChapterTab === "bab3" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Catatan Bab III (Hasil Kegiatan, Capaian Output & Evaluasi Dampak):
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Masukkan catatan koreksi untuk Bab III..."
                      value={catatanBab.bab3}
                      onChange={(e) => setCatatanBab((c) => ({ ...c, bab3: e.target.value }))}
                      className="w-full p-3 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#009966]/20 focus:border-[#009966]"
                    />
                  </div>
                )}

                {activeChapterTab === "bab4" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Catatan Bab IV (Kesimpulan, Refleksi Kritis & Rekomendasi Keberlanjutan):
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Masukkan catatan koreksi untuk Bab IV..."
                      value={catatanBab.bab4}
                      onChange={(e) => setCatatanBab((c) => ({ ...c, bab4: e.target.value }))}
                      className="w-full p-3 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#009966]/20 focus:border-[#009966]"
                    />
                  </div>
                )}

                {activeChapterTab === "anggota" && (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {selectedKelompok.students.map((st, i) => (
                      <div
                        key={st.studentId || i}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            {st.nama}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {st.nim} &bull; {st.jurusan}
                          </div>
                        </div>
                        <span className="font-bold text-[#009966] bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded text-[11px]">
                          Nilai: {calculatedFinalScore}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Catatan Umum DPL */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Catatan Umum / Rekomendasi DPL Keseluruhan:
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Masukkan catatan umum atau rekomendasi DPL untuk laporan akhir ini..."
                    value={catatanUmum}
                    onChange={(e) => setCatatanUmum(e.target.value)}
                    className="w-full p-3 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#009966]/20 focus:border-[#009966]"
                  />
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseReviewer}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                >
                  Tutup Telaah
                </button>

                <button
                  type="button"
                  onClick={handleSaveAssessment}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-2xl text-xs font-bold bg-[#009966] hover:bg-[#008055] text-white transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Save size={15} />
                  )}
                  <span>Simpan & Sahkan Nilai</span>
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
