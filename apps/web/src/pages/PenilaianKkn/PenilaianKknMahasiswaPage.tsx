/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Modul Penilaian KKN Mahasiswa (Komposisi Mitra/MPL 70% + DPL 30%)
 * Sesuai Acuan UI Resmi PT Makerindo & Standar Penilaian Coblong
 * - Pemisahan Kolom Mandiri (NIM, Nama, Prodi, Kelompok, Nilai)n
 * - Perhitungan Matematis Otomatis & Presisi
 * - Modal Dialog Interaktif Modern dengan Tab Navigasi Role-focused
 * - Single Save Button (Non-redundant) dengan Modal Konfirmasi Interaktif
 * - Portofolio Aktivitas KKN Mahasiswa
 * - Cetak Lembar Nilai Resmi PDF
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Printer,
  Save,
  Users,
  GraduationCap,
  ClipboardList,
  Award,
  Search,
  Filter,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  MapPin,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/useAuthStore";
import {
  penilaianKknApiService,
  type StudentInfo,
} from "../../services/penilaianKknApiService";
import { Pagination } from "../../components/common/Pagination";

interface StudentRekapItem {
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
}

export const PenilaianKknMahasiswaPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const userRole = String(user?.role || user?.peran || "").toUpperCase();

  const isDpl = ["DPL", "DOSEN_PEMBIMBING"].includes(userRole);
  const isMitra = ["ADMIN_DLH", "DLH", "LURAH", "KELURAHAN", "RW", "MITRA", "MPL", "MITRA_LAPANGAN"].includes(userRole);
  const isSuper = ["SUPER_USER", "DEVELOPER", "PANITIA_TASKFORCE", "CAMAT", "PEMIMPIN"].includes(userRole);

  const canEditMitra = isMitra || isSuper;
  const canEditDpl = isDpl || isSuper;

  const [loading, setLoading] = useState<boolean>(true);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [studentsRekap, setStudentsRekap] = useState<StudentRekapItem[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterKelompok, setFilterKelompok] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Modal Dialog states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"DPL" | "MPL" | "RINGKASAN">("DPL");

  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);

  // Pure State for Scores
  const [scores, setScores] = useState<{
    // Mitra 70%
    skorMitraKehadiran: number;
    skorMitraWargaBinaan: number;
    skorMitraProker: number;
    skorMitraKomunikasi: number;
    skorMitraTanggungJawab: number;
    skorMitraBuktiKegiatan: number;
    skorMitraDampak: number;
    skorMitraInisiatif: number;
    // DPL 30%
    skorDplPerencanaan: number;
    skorDplKontribusi: number;
    skorDplLogbook: number;
    skorDplAnalisis: number;
    skorDplOutput: number;
    skorDplLaporanAkhir: number;
    // Metadata & Catatan
    namaMitraPenilai: string;
    catatanDpl: string;
    catatanMitra: string;
  }>({
    skorMitraKehadiran: 0,
    skorMitraWargaBinaan: 0,
    skorMitraProker: 0,
    skorMitraKomunikasi: 0,
    skorMitraTanggungJawab: 0,
    skorMitraBuktiKegiatan: 0,
    skorMitraDampak: 0,
    skorMitraInisiatif: 0,
    skorDplPerencanaan: 0,
    skorDplKontribusi: 0,
    skorDplLogbook: 0,
    skorDplAnalisis: 0,
    skorDplOutput: 0,
    skorDplLaporanAkhir: 0,
    namaMitraPenilai: "",
    catatanDpl: "",
    catatanMitra: "",
  });

  // Load Rekap Mahasiswa
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const list = await penilaianKknApiService.getRekapPenilaian();
      const formatted: StudentRekapItem[] = (Array.isArray(list) ? list : []).map((s: any) => ({
        studentId: s.studentId || s.id,
        nama: s.nama || s.name,
        nim: s.nim || "-",
        jenjangPendidikan: s.jenjangPendidikan || "S1",
        jurusan: s.jurusan || s.programStudi || "-",
        fakultas: s.fakultas || "-",
        kelompok: s.kelompok || "Kelompok KKN",
        kelurahan: s.kelurahan || "-",
        rw: s.rw || "-",
        dplNama: s.dplNama || "-",
        subtotalMitra: Number(s.subtotalMitra) || 0,
        subtotalDpl: Number(s.subtotalDpl) || 0,
        nilaiAkhir: Number(s.nilaiAkhir) || 0,
        kategori: s.kategori || "Belum Dinilai",
      }));
      setStudentsRekap(formatted);
    } catch (err) {
      console.error("Gagal memuat daftar mahasiswa:", err);
      toast.error("Gagal memuat rekapitulasi nilai mahasiswa");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Fetch Detail Mahasiswa Terpilih
  const loadAssessment = useCallback(async (studentId: string) => {
    if (!studentId) return;
    setLoadingDetail(true);
    try {
      const data = await penilaianKknApiService.getStudentPenilaian(studentId);
      setStudentInfo(data.student);
      const a = data.assessment;
      setScores({
        skorMitraKehadiran: Number(a.skorMitraKehadiran) || 0,
        skorMitraWargaBinaan: Number(a.skorMitraWargaBinaan) || 0,
        skorMitraProker: Number(a.skorMitraProker) || 0,
        skorMitraKomunikasi: Number(a.skorMitraKomunikasi) || 0,
        skorMitraTanggungJawab: Number(a.skorMitraTanggungJawab) || 0,
        skorMitraBuktiKegiatan: Number(a.skorMitraBuktiKegiatan) || 0,
        skorMitraDampak: Number(a.skorMitraDampak) || 0,
        skorMitraInisiatif: Number(a.skorMitraInisiatif) || 0,
        skorDplPerencanaan: Number(a.skorDplPerencanaan) || 0,
        skorDplKontribusi: Number(a.skorDplKontribusi) || 0,
        skorDplLogbook: Number(a.skorDplLogbook) || 0,
        skorDplAnalisis: Number(a.skorDplAnalisis) || 0,
        skorDplOutput: Number(a.skorDplOutput) || 0,
        skorDplLaporanAkhir: Number(a.skorDplLaporanAkhir) || 0,
        namaMitraPenilai: a.namaMitraPenilai || data.student.namaMitraPenilai || "",
        catatanDpl: a.catatanDpl || "",
        catatanMitra: a.catatanMitra || "",
      });
    } catch (err: any) {
      console.error("Gagal memuat detail nilai mahasiswa:", err);
      toast.error("Gagal memuat data detail penilaian");
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  // Open assessment modal with auto-focused tab according to role
  const handleOpenAssessmentModal = (studentId: string) => {
    setSelectedStudentId(studentId);
    if (isMitra && !isSuper) {
      setActiveTab("MPL");
    } else {
      setActiveTab("DPL");
    }
    loadAssessment(studentId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsConfirmOpen(false);
  };

  // Kalkulasi Aspek: (Skor / 4) * Bobot
  const calcAspect = (skor: number, bobot: number) => {
    const safe = Math.max(0, Math.min(4, Number(skor) || 0));
    return Number(((safe / 4) * bobot).toFixed(2));
  };

  // Subtotal Mitra (Max 70)
  const nilaiAspekMitra = useMemo(() => ({
    kehadiran: calcAspect(scores.skorMitraKehadiran, 10),
    wargaBinaan: calcAspect(scores.skorMitraWargaBinaan, 10),
    proker: calcAspect(scores.skorMitraProker, 10),
    komunikasi: calcAspect(scores.skorMitraKomunikasi, 8),
    tanggungJawab: calcAspect(scores.skorMitraTanggungJawab, 8),
    buktiKegiatan: calcAspect(scores.skorMitraBuktiKegiatan, 7),
    dampak: calcAspect(scores.skorMitraDampak, 10),
    inisiatif: calcAspect(scores.skorMitraInisiatif, 7),
  }), [scores]);

  const subtotalMitra = Number(
    Object.values(nilaiAspekMitra)
      .reduce((a, b) => a + b, 0)
      .toFixed(2)
  );

  // Subtotal DPL (Max 30)
  const nilaiAspekDpl = useMemo(() => ({
    perencanaan: calcAspect(scores.skorDplPerencanaan, 5),
    kontribusi: calcAspect(scores.skorDplKontribusi, 5),
    logbook: calcAspect(scores.skorDplLogbook, 5),
    analisis: calcAspect(scores.skorDplAnalisis, 5),
    output: calcAspect(scores.skorDplOutput, 5),
    laporanAkhir: calcAspect(scores.skorDplLaporanAkhir, 5),
  }), [scores]);

  const subtotalDpl = Number(
    Object.values(nilaiAspekDpl)
      .reduce((a, b) => a + b, 0)
      .toFixed(2)
  );

  // Nilai Akhir Kumulatif (Max 100)
  const nilaiAkhir = Number((subtotalMitra + subtotalDpl).toFixed(2));

  // Kategori Skala Standar
  const getCategory = (score: number) => {
    if (score >= 85) return { label: "Sangat Baik", letter: "A", color: "bg-emerald-100 text-emerald-800 border-emerald-300" };
    if (score >= 75) return { label: "Baik", letter: "B", color: "bg-teal-100 text-teal-800 border-teal-300" };
    if (score >= 65) return { label: "Cukup", letter: "C", color: "bg-amber-100 text-amber-800 border-amber-300" };
    if (score >= 55) return { label: "Kurang", letter: "D", color: "bg-orange-100 text-orange-800 border-orange-300" };
    if (score > 0) return { label: "Sangat Kurang", letter: "E", color: "bg-rose-100 text-rose-800 border-rose-300" };
    return { label: "Belum Dinilai", letter: "-", color: "bg-slate-100 text-slate-600 border-slate-300" };
  };

  const currentCategory = getCategory(nilaiAkhir);

  const handleScoreChange = (field: keyof typeof scores, value: number) => {
    setScores((prev) => ({ ...prev, [field]: value }));
  };

  // Simpan Penilaian yang Dikonfirmasi
  const handleConfirmSaveScore = async () => {
    if (!selectedStudentId) return;
    setSaving(true);
    try {
      await penilaianKknApiService.savePenilaian({
        studentId: selectedStudentId,
        ...scores,
      });
      toast.success("Penilaian mahasiswa berhasil disimpan ke database!");
      setIsConfirmOpen(false);
      setIsModalOpen(false);
      // Refresh rekap data
      await fetchStudents();
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan penilaian");
    } finally {
      setSaving(false);
    }
  };

  // Filter kelompok options
  const uniqueKelompokList = useMemo(() => {
    const list = studentsRekap.map((s) => s.kelompok).filter(Boolean);
    return Array.from(new Set(list));
  }, [studentsRekap]);

  const filteredStudents = useMemo(() => {
    return studentsRekap.filter((s) => {
      const matchSearch =
        s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nim.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.jurusan || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.kelompok.toLowerCase().includes(searchQuery.toLowerCase());
      const matchKelompok = filterKelompok === "ALL" || s.kelompok === filterKelompok;
      return matchSearch && matchKelompok;
    });
  }, [studentsRekap, searchQuery, filterKelompok]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / itemsPerPage));
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(start, start + itemsPerPage);
  }, [filteredStudents, currentPage, itemsPerPage]);

  const isGradeComplete = subtotalDpl > 0 && subtotalMitra > 0;

  // Cetak PDF Berita Acara & Lembar Nilai
  const handlePrintPdf = () => {
    if (!isGradeComplete) {
      toast.error("Cetak PDF lembar penilaian resmi hanya dapat dilakukan setelah nilai lengkap dari kedua pihak (DPL 30% dan MPL 70%).");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Gagal membuka jendela cetak. Mohon izinkan popup browser.");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Lembar Penilaian KKN - ${studentInfo?.nama || "Mahasiswa"}</title>
        <style>
          @page { size: A4 portrait; margin: 12mm 15mm; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; font-size: 9pt; line-height: 1.35; padding: 0; margin: 0; }
          .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 12px; }
          .header h2 { margin: 0; font-size: 14pt; font-weight: 800; text-transform: uppercase; color: #0f172a; }
          .header p { margin: 2px 0 0 0; font-size: 9pt; color: #475569; font-weight: 600; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; background: #f8fafc; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 6px; margin-bottom: 12px; font-size: 8.5pt; }
          .meta-item { display: flex; justify-content: space-between; }
          .meta-label { color: #64748b; font-weight: 600; }
          .meta-value { font-weight: 700; color: #0f172a; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 8pt; }
          th, td { border: 1px solid #cbd5e1; padding: 4px 6px; text-align: left; }
          th { background: #f1f5f9; font-weight: 800; text-transform: uppercase; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .subtotal-row { background: #f8fafc; font-weight: 800; }
          .final-box { border: 2px solid #059669; background: #ecfdf5; border-radius: 6px; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
          .final-score { font-size: 16pt; font-weight: 900; color: #065f46; }
          .sig-section { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 18px; page-break-inside: avoid; }
          .sig-box { text-align: center; }
          .sig-space { height: 50px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>LEMBAR PENILAIAN AKHIR KKN MAHASISWA</h2>
          <p>Program KKN Tematik - Penilaian Akademik & Portofolio Lapangan Mahasiswa</p>
        </div>

        <div class="meta-grid">
          <div class="meta-item"><span class="meta-label">Nama Mahasiswa:</span><span class="meta-value">${studentInfo?.nama || "-"}</span></div>
          <div class="meta-item"><span class="meta-label">NIM:</span><span class="meta-value">${studentInfo?.nim || "-"}</span></div>
          <div class="meta-item"><span class="meta-label">Program Studi:</span><span class="meta-value">${studentInfo?.programStudi || "-"}</span></div>
          <div class="meta-item"><span class="meta-label">Kelompok:</span><span class="meta-value">${studentInfo?.kelompok || "-"}</span></div>
          <div class="meta-item"><span class="meta-label">Wilayah Tugas:</span><span class="meta-value">${studentInfo?.rw || "-"}, Kel. ${studentInfo?.kelurahan || "-"}</span></div>
          <div class="meta-item"><span class="meta-label">Dosen Pendamping (DPL):</span><span class="meta-value">${studentInfo?.dplNama || "-"}</span></div>
          <div class="meta-item"><span class="meta-label">Mitra Pendamping (MPL):</span><span class="meta-value">${studentInfo?.namaMitraPenilai || scores.namaMitraPenilai || "Mitra Pendamping Lapangan"}</span></div>
        </div>

        <!-- Tabel DPL (30%) -->
        <h4 style="margin: 6px 0 3px 0; font-size: 9pt; color: #0f172a; text-transform: uppercase;">A. Penilaian Dosen Pendamping Lapangan (Bobot 30%)</h4>
        <table>
          <thead>
            <tr>
              <th width="5%" class="text-center">No</th>
              <th width="55%">Aspek Penilaian</th>
              <th width="15%" class="text-center">Bobot</th>
              <th width="10%" class="text-center">Skor (0-4)</th>
              <th width="15%" class="text-right">Nilai</th>
            </tr>
          </thead>
          <tbody>
            <tr><td class="text-center">1</td><td>Perencanaan & Pemahaman Program</td><td class="text-center">5%</td><td class="text-center">${scores.skorDplPerencanaan}</td><td class="text-right">${nilaiAspekDpl.perencanaan.toFixed(2)}</td></tr>
            <tr><td class="text-center">2</td><td>Kontribusi Individu</td><td class="text-center">5%</td><td class="text-center">${scores.skorDplKontribusi}</td><td class="text-right">${nilaiAspekDpl.kontribusi.toFixed(2)}</td></tr>
            <tr><td class="text-center">3</td><td>Logbook & Dokumentasi Akademik</td><td class="text-center">5%</td><td class="text-center">${scores.skorDplLogbook}</td><td class="text-right">${nilaiAspekDpl.logbook.toFixed(2)}</td></tr>
            <tr><td class="text-center">4</td><td>Analisis Masalah & Solusi</td><td class="text-center">5%</td><td class="text-center">${scores.skorDplAnalisis}</td><td class="text-right">${nilaiAspekDpl.analisis.toFixed(2)}</td></tr>
            <tr><td class="text-center">5</td><td>Output, Outcome, & Dampak</td><td class="text-center">5%</td><td class="text-center">${scores.skorDplOutput}</td><td class="text-right">${nilaiAspekDpl.output.toFixed(2)}</td></tr>
            <tr><td class="text-center">6</td><td>Laporan Akhir, Evaluasi, & Refleksi</td><td class="text-center">5%</td><td class="text-center">${scores.skorDplLaporanAkhir}</td><td class="text-right">${nilaiAspekDpl.laporanAkhir.toFixed(2)}</td></tr>
            <tr class="subtotal-row"><td colspan="4" style="text-align: right;">SUBTOTAL DPL (30%):</td><td class="text-right">${subtotalDpl.toFixed(2)}</td></tr>
          </tbody>
        </table>

        <!-- Tabel MPL (70%) -->
        <h4 style="margin: 6px 0 3px 0; font-size: 9pt; color: #0f172a; text-transform: uppercase;">B. Penilaian Mitra Pendamping Lapangan (Bobot 70%)</h4>
        <table>
          <thead>
            <tr>
              <th width="5%" class="text-center">No</th>
              <th width="40%">Aspek Penilaian</th>
              <th width="15%" class="text-center">Bobot</th>
              <th width="15%" class="text-center">Skor (0-4)</th>
              <th width="25%" class="text-right">Nilai</th>
            </tr>
          </thead>
          <tbody>
            <tr><td class="text-center">1</td><td>Kehadiran dan Kedisiplinan</td><td class="text-center">10%</td><td class="text-center">${scores.skorMitraKehadiran}</td><td class="text-right">${nilaiAspekMitra.kehadiran.toFixed(2)}</td></tr>
            <tr><td class="text-center">2</td><td>Warga Binaan</td><td class="text-center">10%</td><td class="text-center">${scores.skorMitraWargaBinaan}</td><td class="text-right">${nilaiAspekMitra.wargaBinaan.toFixed(2)}</td></tr>
            <tr><td class="text-center">3</td><td>Keterlibatan Program Kerja</td><td class="text-center">10%</td><td class="text-center">${scores.skorMitraProker}</td><td class="text-right">${nilaiAspekMitra.proker.toFixed(2)}</td></tr>
            <tr><td class="text-center">4</td><td>Komunikasi & Etika</td><td class="text-center">8%</td><td class="text-center">${scores.skorMitraKomunikasi}</td><td class="text-right">${nilaiAspekMitra.komunikasi.toFixed(2)}</td></tr>
            <tr><td class="text-center">5</td><td>Tanggung Jawab & Kerja Sama</td><td class="text-center">8%</td><td class="text-center">${scores.skorMitraTanggungJawab}</td><td class="text-right">${nilaiAspekMitra.tanggungJawab.toFixed(2)}</td></tr>
            <tr><td class="text-center">6</td><td>Bukti Kegiatan</td><td class="text-center">7%</td><td class="text-center">${scores.skorMitraBuktiKegiatan}</td><td class="text-right">${nilaiAspekMitra.buktiKegiatan.toFixed(2)}</td></tr>
            <tr><td class="text-center">7</td><td>Dampak kepada Masyarakat</td><td class="text-center">10%</td><td class="text-center">${scores.skorMitraDampak}</td><td class="text-right">${nilaiAspekMitra.dampak.toFixed(2)}</td></tr>
            <tr><td class="text-center">8</td><td>Inisiatif & Problem Solving</td><td class="text-center">7%</td><td class="text-center">${scores.skorMitraInisiatif}</td><td class="text-right">${nilaiAspekMitra.inisiatif.toFixed(2)}</td></tr>
            <tr class="subtotal-row"><td colspan="4" style="text-align: right;">SUBTOTAL MPL (70%):</td><td class="text-right">${subtotalMitra.toFixed(2)}</td></tr>
          </tbody>
        </table>

        <!-- Rekap Nilai Akhir -->
        <div class="final-box">
          <div>
            <div style="font-size: 8pt; font-weight: 700; text-transform: uppercase; color: #047857;">NILAI AKHIR KUMULATIF</div>
            <div style="font-size: 8pt; color: #334155;">Subtotal DPL (${subtotalDpl.toFixed(2)}) + Subtotal MPL (${subtotalMitra.toFixed(2)})</div>
          </div>
          <div style="text-align: right;">
            <span class="final-score">${nilaiAkhir.toFixed(2)}</span>
            <span style="font-weight: 800; font-size: 9pt; background: #059669; color: white; padding: 2px 8px; border-radius: 4px; margin-left: 6px;">${currentCategory.label} (${currentCategory.letter})</span>
          </div>
        </div>

        <div class="sig-section">
          <div class="sig-box">
            <p>Dosen Pendamping Lapangan (DPL),</p>
            <div class="sig-space"></div>
            <p style="text-decoration: underline; font-weight: bold; margin: 0;">${studentInfo?.dplNama || "Dosen Pendamping Lapangan"}</p>
            <p style="font-size: 7.5pt; color: #64748b; margin: 0;">NIP. ${studentInfo?.dplNip || "-"}</p>
          </div>
          <div class="sig-box">
            <p>Mitra Pendamping Lapangan (MPL),</p>
            <div class="sig-space"></div>
            <p style="text-decoration: underline; font-weight: bold; margin: 0;">${studentInfo?.namaMitraPenilai || scores.namaMitraPenilai || "Mitra Pendamping Lapangan"}</p>
            <p style="font-size: 7.5pt; color: #64748b; margin: 0;">Mitra Pendamping Lapangan</p>
          </div>
        </div>

        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950 p-4 md:p-6 space-y-6 text-slate-800 dark:text-slate-100">
      {/* Header Utama */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 rounded-xl">
              <Award size={22} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Penilaian Mahasiswa (Individu)
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">
                Evaluasi performa lapangan (Mitra) dan capaian akademik (DPL) mahasiswa dengan kalkulasi otomatis.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Ringkasan Nilai Angkatan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 flex items-center justify-center font-black shrink-0">
            <Users size={16} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Total Mahasiswa</span>
            <span className="text-lg font-black text-slate-900 dark:text-slate-100">{studentsRekap.length} Orang</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center justify-center font-black shrink-0">
            <GraduationCap size={16} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Rerata Nilai DPL</span>
            <span className="text-lg font-black text-amber-700 dark:text-amber-400">
              {studentsRekap.length > 0
                ? (studentsRekap.reduce((acc, s) => acc + (s.subtotalDpl || 0), 0) / studentsRekap.length).toFixed(1)
                : "0"}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-black shrink-0">
            <ClipboardList size={16} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Rerata Nilai Mitra</span>
            <span className="text-lg font-black text-emerald-700 dark:text-emerald-400">
              {studentsRekap.length > 0
                ? (studentsRekap.reduce((acc, s) => acc + (s.subtotalMitra || 0), 0) / studentsRekap.length).toFixed(1)
                : "0"}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 flex items-center justify-center font-black shrink-0">
            <Award size={16} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Rerata Nilai Akumulasi</span>
            <span className="text-lg font-black text-blue-700 dark:text-blue-400">
              {studentsRekap.length > 0
                ? (studentsRekap.reduce((acc, s) => acc + (s.nilaiAkhir || 0), 0) / studentsRekap.length).toFixed(1)
                : "0"}
            </span>
          </div>
        </div>
      </div>

      {/* TABEL REKAPITULASI MAHASISWA DENGAN KOLOM MANDIRI */}
      <div id="tabel-mahasiswa-section" className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
              Daftar Mahasiswa
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih mahasiswa untuk membuka formulir penilaian aspek dan portofolio KKN. Kolom NIM, Program Studi, Kelompok, dan Nilai dipisah secara mandiri.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Filter Kelompok */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <Filter size={14} className="text-slate-400" />
              <select
                value={filterKelompok}
                onChange={(e) => {
                  setFilterKelompok(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent font-semibold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
              >
                <option value="ALL">Semua Kelompok</option>
                {uniqueKelompokList.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs w-56">
              <Search size={14} className="text-slate-400" />
              <input
                type="text"
                placeholder="Cari NIM, Nama, Prodi..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent outline-none w-full"
              />
            </div>
          </div>
        </div>

        {/* Tabel Mahasiswa dengan Kolom Terpisah */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={28} className="animate-spin text-emerald-600" />
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
            Tidak ditemukan data mahasiswa yang sesuai.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/90 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-extrabold uppercase text-[10.5px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3 px-3 text-center w-10">No</th>
                  <th className="py-3 px-3">NIM</th>
                  <th className="py-3 px-3">Nama Mahasiswa</th>
                  <th className="py-3 px-3">Program Studi</th>
                  <th className="py-3 px-3">Kelompok</th>
                  <th className="py-3 px-3 text-center">Nilai</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                {paginatedStudents.map((st, idx) => {
                  const hasDpl = st.subtotalDpl > 0;
                  const hasMitra = st.subtotalMitra > 0;
                  const isFull = hasDpl && hasMitra;
                  const hasScore = st.nilaiAkhir > 0 || hasDpl || hasMitra;

                  return (
                    <tr
                      key={st.studentId}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3 px-3 text-center font-bold text-slate-400">
                        {(currentPage - 1) * itemsPerPage + idx + 1}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-800 dark:text-slate-100">{st.nim}</td>
                      <td className="py-3 px-3 font-extrabold text-slate-900 dark:text-slate-100">{st.nama}</td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{st.jurusan || "-"}</td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{st.kelompok}</td>
                      <td className="py-3 px-3 text-center font-mono font-black text-slate-800 dark:text-slate-100">
                        {st.nilaiAkhir > 0 ? st.nilaiAkhir.toFixed(1) : "-"}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {isFull ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300">
                            <CheckCircle2 size={11} />
                            <span>Lengkap</span>
                          </span>
                        ) : hasDpl || hasMitra ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300">
                            <span>Sedang Dinilai</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500">
                            <span>Belum Dinilai</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenAssessmentModal(st.studentId)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer shadow-2xs bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60"
                        >
                          <Award size={13} />
                          <span>{hasScore ? "Lanjutkan" : "Beri Nilai"}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="pt-2">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(p) => setCurrentPage(p)}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* POP-UP MODAL PENILAIAN MODERN & INTERAKTIF */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            {/* Header Modal: Identitas Mahasiswa */}
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg shadow-md shrink-0">
                  {studentInfo?.nama ? studentInfo.nama.charAt(0).toUpperCase() : "M"}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300">
                      {studentInfo?.kelompok || "Kelompok KKN"}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <MapPin size={11} />
                      {studentInfo?.rw ? `${studentInfo.rw}, ` : ""}{studentInfo?.kelurahan ? `Kel. ${studentInfo.kelurahan}` : "Wilayah Coblong"}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 mt-1 flex items-center gap-2">
                    <span>{studentInfo?.nama || "Memuat Mahasiswa..."}</span>
                    <span className="font-mono text-sm text-slate-500 font-normal">({studentInfo?.nim || "-"})</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {studentInfo?.programStudi || "-"} ({studentInfo?.fakultas || "-"}) &bull; DPL: <strong>{studentInfo?.dplNama || "-"}</strong>
                  </p>
                </div>
              </div>

              {/* Close Button & Role Badge */}
              <div className="flex items-center gap-2 self-end md:self-auto">
                {isDpl && !isSuper && (
                  <span className="px-3 py-1 rounded-xl text-xs font-black bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1.5">
                    <GraduationCap size={14} className="text-amber-600" />
                    <span>Mode DPL</span>
                  </span>
                )}
                {isMitra && !isSuper && (
                  <span className="px-3 py-1 rounded-xl text-xs font-black bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                    <ClipboardList size={14} className="text-emerald-600" />
                    <span>Mode Mitra (MPL)</span>
                  </span>
                )}
                {isSuper && (
                  <span className="px-3 py-1 rounded-xl text-xs font-black bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1.5">
                    <Award size={14} className="text-blue-600" />
                    <span>Mode Super User</span>
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  title="Tutup Formulir"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Sticky Real-time Calculation Ribbon */}
            <div className="bg-slate-100/90 dark:bg-slate-800/80 px-5 sm:px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Subtotal DPL</span>
                  <span className="text-base sm:text-lg font-black text-amber-700 dark:text-amber-400">
                    {subtotalDpl.toFixed(2)}
                  </span>
                </div>
                <span className="text-slate-300 text-lg font-light">+</span>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Subtotal Mitra (MPL)</span>
                  <span className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-400">
                    {subtotalMitra.toFixed(2)}
                  </span>
                </div>
                <span className="text-slate-300 text-lg font-light">=</span>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Akumulasi Nilai</span>
                  <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                    {nilaiAkhir.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-3 py-1.5 rounded-xl text-xs font-black border ${isGradeComplete ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300" : "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300"}`}>
                  Status: {isGradeComplete ? "Penilaian Lengkap" : "Menunggu Lengkap"}
                </span>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-5 sm:px-6 bg-white dark:bg-slate-900 gap-2 shrink-0">
              {(canEditDpl || isSuper) && (
                <button
                  type="button"
                  onClick={() => setActiveTab("DPL")}
                  className={`py-3 px-4 text-xs font-extrabold flex items-center gap-2 border-b-2 transition cursor-pointer ${
                    activeTab === "DPL"
                      ? "border-amber-500 text-amber-700 dark:text-amber-400 bg-amber-50/40 dark:bg-amber-950/20"
                      : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <GraduationCap size={16} />
                  <span>Akademik DPL</span>
                  <span className="px-1.5 py-0.2 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-[10px] font-black">
                    {subtotalDpl.toFixed(1)}
                  </span>
                </button>
              )}

              {(canEditMitra || isSuper) && (
                <button
                  type="button"
                  onClick={() => setActiveTab("MPL")}
                  className={`py-3 px-4 text-xs font-extrabold flex items-center gap-2 border-b-2 transition cursor-pointer ${
                    activeTab === "MPL"
                      ? "border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20"
                      : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <ClipboardList size={16} />
                  <span>Lapangan Mitra (MPL)</span>
                  <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-black">
                    {subtotalMitra.toFixed(1)}
                  </span>
                </button>
              )}

              {isSuper && (
                <button
                  type="button"
                  onClick={() => setActiveTab("RINGKASAN")}
                  className={`py-3 px-4 text-xs font-extrabold flex items-center gap-2 border-b-2 transition cursor-pointer ${
                    activeTab === "RINGKASAN"
                      ? "border-blue-600 text-blue-700 dark:text-blue-400 bg-blue-50/40 dark:bg-blue-950/20"
                      : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <BookOpen size={16} />
                  <span>Ringkasan Komprehensif</span>
                </button>
              )}
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
              {loadingDetail ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
                  <Loader2 size={32} className="animate-spin text-emerald-600" />
                  <span className="text-xs font-medium">Memuat data aspek penilaian mahasiswa...</span>
                </div>
              ) : (
                <>
                  {/* TAB 1: ASPEK DPL */}
                  {activeTab === "DPL" && (
                    <div className="space-y-5">
                      <div className="bg-amber-50/60 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-black text-amber-950 dark:text-amber-200">
                            Lembar Penilaian Akademik Dosen Pendamping Lapangan (DPL)
                          </h3>
                          <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                            Evaluasi 6 aspek capaian akademik dan refleksi mahasiswa. Skala skor 0 sampai 4.
                          </p>
                        </div>
                        {!canEditDpl && (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            Mode Lihat Saja
                          </span>
                        )}
                      </div>

                      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-extrabold uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                              <th className="py-3 px-3 text-center w-8">No</th>
                              <th className="py-3 px-3">Aspek Akademik DPL</th>
                              <th className="py-3 px-2 text-center w-14">Bobot</th>
                              <th className="py-3 px-3 text-center w-48">Pilih Skor (0 – 4)</th>
                              <th className="py-3 px-3 text-right w-20">Nilai</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                            {[
                              { no: 1, key: "skorDplPerencanaan" as const, label: "Perencanaan & Pemahaman Program", val: nilaiAspekDpl.perencanaan },
                              { no: 2, key: "skorDplKontribusi" as const, label: "Kontribusi Individu", val: nilaiAspekDpl.kontribusi },
                              { no: 3, key: "skorDplLogbook" as const, label: "Logbook & Dokumentasi Akademik", val: nilaiAspekDpl.logbook },
                              { no: 4, key: "skorDplAnalisis" as const, label: "Analisis Masalah & Solusi", val: nilaiAspekDpl.analisis },
                              { no: 5, key: "skorDplOutput" as const, label: "Output, Outcome, & Dampak", val: nilaiAspekDpl.output },
                              { no: 6, key: "skorDplLaporanAkhir" as const, label: "Laporan Akhir, Evaluasi & Refleksi", val: nilaiAspekDpl.laporanAkhir },
                            ].map((item) => (
                              <tr key={item.key} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                                <td className="py-3 px-3 text-center font-bold text-slate-400">{item.no}</td>
                                <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100">{item.label}</td>
                                <td className="py-3 px-2 text-center font-bold text-slate-700 dark:text-slate-300">5%</td>
                                <td className="py-3 px-3 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    {[0, 1, 2, 3, 4].map((num) => (
                                      <button
                                        key={num}
                                        type="button"
                                        disabled={!canEditDpl}
                                        onClick={() => handleScoreChange(item.key, num)}
                                        className={`w-7 h-7 rounded-lg text-xs font-black transition flex items-center justify-center ${
                                          scores[item.key] === num
                                            ? "bg-amber-500 text-white shadow-xs scale-105"
                                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                                        } ${canEditDpl ? "cursor-pointer" : "cursor-not-allowed opacity-75"}`}
                                      >
                                        {num}
                                      </button>
                                    ))}
                                  </div>
                                </td>
                                <td className="py-3 px-3 text-right font-black text-slate-900 dark:text-slate-100">
                                  {item.val.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Catatan DPL */}
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                          Catatan Evaluasi Akademik Dosen Pendamping Lapangan (DPL):
                        </label>
                        <textarea
                          rows={3}
                          value={scores.catatanDpl}
                          onChange={(e) => setScores((prev) => ({ ...prev, catatanDpl: e.target.value }))}
                          placeholder="Tuliskan catatan evaluasi akademik, bimbingan, atau saran perbaikan untuk mahasiswa..."
                          disabled={!canEditDpl}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-amber-500 disabled:bg-slate-100 dark:disabled:bg-slate-800"
                        />
                      </div>
                    </div>
                  )}

                  {/* TAB 2: ASPEK MITRA / MPL */}
                  {activeTab === "MPL" && (
                    <div className="space-y-5">
                      <div className="bg-emerald-50/60 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/40 flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-black text-emerald-950 dark:text-emerald-200">
                            Lembar Penilaian Lapangan Mitra Pendamping Lapangan (MPL / Mitra)
                          </h3>
                          <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 mt-0.5">
                            Evaluasi 8 aspek kedisiplinan dan kontribusi lapangan mahasiswa. Skala skor 0 sampai 4.
                          </p>
                        </div>
                        {!canEditMitra && (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            Mode Lihat Saja
                          </span>
                        )}
                      </div>

                      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-extrabold uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                              <th className="py-3 px-3 text-center w-8">No</th>
                              <th className="py-3 px-3">Aspek Lapangan (MPL)</th>
                              <th className="py-3 px-2 text-center w-14">Bobot</th>
                              <th className="py-3 px-3 text-center w-48">Pilih Skor (0 – 4)</th>
                              <th className="py-3 px-3 text-right w-20">Nilai</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                            {[
                              { no: 1, key: "skorMitraKehadiran" as const, label: "Kehadiran dan Kedisiplinan", bobot: "10%", val: nilaiAspekMitra.kehadiran },
                              { no: 2, key: "skorMitraWargaBinaan" as const, label: "Pembinaan Rumah Tangga / Warga Binaan", bobot: "10%", val: nilaiAspekMitra.wargaBinaan },
                              { no: 3, key: "skorMitraProker" as const, label: "Keterlibatan Program Kerja Kelompok & Lapangan", bobot: "10%", val: nilaiAspekMitra.proker },
                              { no: 4, key: "skorMitraKomunikasi" as const, label: "Komunikasi, Sopan Santun, & Etika Sosial", bobot: "8%", val: nilaiAspekMitra.komunikasi },
                              { no: 5, key: "skorMitraTanggungJawab" as const, label: "Tanggung Jawab & Kerja Sama Tim", bobot: "8%", val: nilaiAspekMitra.tanggungJawab },
                              { no: 6, key: "skorMitraBuktiKegiatan" as const, label: "Kesesuaian Bukti Kegiatan Lapangan", bobot: "7%", val: nilaiAspekMitra.buktiKegiatan },
                              { no: 7, key: "skorMitraDampak" as const, label: "Dampak Nyata kepada Masyarakat & Wilayah", bobot: "10%", val: nilaiAspekMitra.dampak },
                              { no: 8, key: "skorMitraInisiatif" as const, label: "Inisiatif Mandiri & Problem Solving", bobot: "7%", val: nilaiAspekMitra.inisiatif },
                            ].map((item) => (
                              <tr key={item.key} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                                <td className="py-3 px-3 text-center font-bold text-slate-400">{item.no}</td>
                                <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100">{item.label}</td>
                                <td className="py-3 px-2 text-center font-bold text-slate-700 dark:text-slate-300">{item.bobot}</td>
                                <td className="py-3 px-3 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    {[0, 1, 2, 3, 4].map((num) => (
                                      <button
                                        key={num}
                                        type="button"
                                        disabled={!canEditMitra}
                                        onClick={() => handleScoreChange(item.key, num)}
                                        className={`w-7 h-7 rounded-lg text-xs font-black transition flex items-center justify-center ${
                                          scores[item.key] === num
                                            ? "bg-emerald-600 text-white shadow-xs scale-105"
                                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                                        } ${canEditMitra ? "cursor-pointer" : "cursor-not-allowed opacity-75"}`}
                                      >
                                        {num}
                                      </button>
                                    ))}
                                  </div>
                                </td>
                                <td className="py-3 px-3 text-right font-black text-slate-900 dark:text-slate-100">
                                  {item.val.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Catatan MPL */}
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                          Catatan Evaluasi Mitra Pendamping Lapangan (MPL / Mitra):
                        </label>
                        <textarea
                          rows={3}
                          value={scores.catatanMitra}
                          onChange={(e) => setScores((prev) => ({ ...prev, catatanMitra: e.target.value }))}
                          placeholder="Tuliskan catatan etika, inisiatif, kedisiplinan, dan kinerja lapangan mahasiswa..."
                          disabled={!canEditMitra}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 disabled:bg-slate-100 dark:disabled:bg-slate-800"
                        />
                      </div>
                    </div>
                  )}

                  {/* TAB 3: RINGKASAN KOMPREHENSIF (Super User) */}
                  {activeTab === "RINGKASAN" && isSuper && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* DPL Summary Card */}
                      <div className="p-4 rounded-2xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/30 dark:bg-amber-950/20 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-amber-900 dark:text-amber-300 uppercase flex items-center gap-1.5">
                            <GraduationCap size={15} />
                            <span>Porsi Akademik DPL</span>
                          </h4>
                          <span className="text-base font-black text-amber-700 dark:text-amber-400">
                            {subtotalDpl.toFixed(2)}
                          </span>
                        </div>
                        <ul className="text-xs divide-y divide-amber-100 dark:divide-amber-900/40 text-slate-700 dark:text-slate-300">
                          <li className="py-1.5 flex justify-between"><span>Perencanaan:</span><span className="font-bold">{nilaiAspekDpl.perencanaan.toFixed(2)}</span></li>
                          <li className="py-1.5 flex justify-between"><span>Kontribusi:</span><span className="font-bold">{nilaiAspekDpl.kontribusi.toFixed(2)}</span></li>
                          <li className="py-1.5 flex justify-between"><span>Logbook:</span><span className="font-bold">{nilaiAspekDpl.logbook.toFixed(2)}</span></li>
                          <li className="py-1.5 flex justify-between"><span>Analisis Solusi:</span><span className="font-bold">{nilaiAspekDpl.analisis.toFixed(2)}</span></li>
                          <li className="py-1.5 flex justify-between"><span>Output & Dampak:</span><span className="font-bold">{nilaiAspekDpl.output.toFixed(2)}</span></li>
                          <li className="py-1.5 flex justify-between"><span>Laporan Akhir:</span><span className="font-bold">{nilaiAspekDpl.laporanAkhir.toFixed(2)}</span></li>
                        </ul>
                      </div>

                      {/* MPL Summary Card */}
                      <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-emerald-900 dark:text-emerald-300 uppercase flex items-center gap-1.5">
                            <ClipboardList size={15} />
                            <span>Porsi Lapangan MPL</span>
                          </h4>
                          <span className="text-base font-black text-emerald-700 dark:text-emerald-400">
                            {subtotalMitra.toFixed(2)}
                          </span>
                        </div>
                        <ul className="text-xs divide-y divide-emerald-100 dark:divide-emerald-900/40 text-slate-700 dark:text-slate-300">
                          <li className="py-1.5 flex justify-between"><span>Kehadiran:</span><span className="font-bold">{nilaiAspekMitra.kehadiran.toFixed(2)}</span></li>
                          <li className="py-1.5 flex justify-between"><span>Warga Binaan:</span><span className="font-bold">{nilaiAspekMitra.wargaBinaan.toFixed(2)}</span></li>
                          <li className="py-1.5 flex justify-between"><span>Program Kerja:</span><span className="font-bold">{nilaiAspekMitra.proker.toFixed(2)}</span></li>
                          <li className="py-1.5 flex justify-between"><span>Komunikasi & Etika:</span><span className="font-bold">{nilaiAspekMitra.komunikasi.toFixed(2)}</span></li>
                          <li className="py-1.5 flex justify-between"><span>Tanggung Jawab:</span><span className="font-bold">{nilaiAspekMitra.tanggungJawab.toFixed(2)}</span></li>
                          <li className="py-1.5 flex justify-between"><span>Bukti Kegiatan:</span><span className="font-bold">{nilaiAspekMitra.buktiKegiatan.toFixed(2)}</span></li>
                          <li className="py-1.5 flex justify-between"><span>Dampak Warga:</span><span className="font-bold">{nilaiAspekMitra.dampak.toFixed(2)}</span></li>
                          <li className="py-1.5 flex justify-between"><span>Inisiatif:</span><span className="font-bold">{nilaiAspekMitra.inisiatif.toFixed(2)}</span></li>
                        </ul>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ================================================================= */}
            {/* SINGLE NON-REDUNDANT FOOTER ACTION BUTTONS */}
            {/* ================================================================= */}
            <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={handlePrintPdf}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition border ${
                    isGradeComplete
                      ? "bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer"
                      : "bg-slate-100 dark:bg-slate-800/40 text-slate-400 border-slate-200 dark:border-slate-800 cursor-not-allowed"
                  }`}
                  title={isGradeComplete ? "Cetak Dokumen Resmi PDF" : "Cetak PDF baru aktif setelah nilai lengkap dari kedua pihak"}
                >
                  <Printer size={14} className={isGradeComplete ? "text-slate-600 dark:text-slate-300" : "text-slate-400"} />
                  <span>Cetak PDF</span>
                  {!isGradeComplete && (
                    <span className="text-[9.5px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold ml-1">
                      Belum Lengkap
                    </span>
                  )}
                </button>
              </div>

              {/* SINGLE SAVE BUTTON IN POPUP */}
              {(canEditDpl || canEditMitra || isSuper) && (
                <button
                  type="button"
                  onClick={() => setIsConfirmOpen(true)}
                  disabled={saving || !selectedStudentId || loadingDetail}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs font-black transition shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  <span>Simpan Penilaian</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL KONFIRMASI INTERAKTIF */}
      {/* ========================================================================= */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 text-slate-800 dark:text-slate-100 space-y-4 animate-in zoom-in-95 duration-150"
            role="alertdialog"
            aria-modal="true"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                <AlertCircle size={22} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                  Konfirmasi Simpan Penilaian
                </h3>
                <p className="text-xs text-slate-500">
                  Pastikan seluruh skor aspek yang Anda masukkan sudah sesuai.
                </p>
              </div>
            </div>

            {/* Rekap Nilai yang Akan Disimpan */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 font-bold">Mahasiswa:</span>
                <span className="font-black text-slate-900 dark:text-slate-100">{studentInfo?.nama} ({studentInfo?.nim})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Subtotal DPL:</span>
                <span className="font-bold text-amber-700 dark:text-amber-400">{subtotalDpl.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Subtotal MPL:</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">{subtotalMitra.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="font-black text-slate-800 dark:text-slate-200">Nilai Akhir Kumulatif:</span>
                <span className="font-black text-base text-slate-900 dark:text-slate-100">
                  {nilaiAkhir.toFixed(2)} <span className="text-xs text-emerald-600 font-bold">({currentCategory.letter})</span>
                </span>
              </div>
            </div>

            <p className="text-[11.5px] text-slate-500 leading-relaxed">
              Data penilaian akan langsung disimpan ke database dan memperbarui rekapitulasi nilai KKN mahasiswa.
            </p>

            {/* Action Buttons Konfirmasi */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                disabled={saving}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Periksa Kembali
              </button>
              <button
                type="button"
                onClick={handleConfirmSaveScore}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition shadow-sm cursor-pointer disabled:opacity-50"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                <span>Ya, Simpan Penilaian</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PenilaianKknMahasiswaPage;
