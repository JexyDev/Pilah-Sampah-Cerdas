/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Modul Penilaian KKN Mahasiswa (Komposisi Mitra/PL 70% + DPL 30%)
 * Sesuai Acuan UI Resmi PT Makerindo & Standar Penilaian Coblong
 * - 100% Real-time Database Integration
 * - Perhitungan Matematis Otomatis & Presisi
 * - Pemisahan Kolom Mandiri (NIM, Nama, Jenjang, Prodi)
 * - Form Penilaian Berdasarkan Role (DPL 30% / Mitra 70%)
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

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [studentsRekap, setStudentsRekap] = useState<StudentRekapItem[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterKelompok, setFilterKelompok] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

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

  const canEditMitra = isMitra || isSuper;
  const canEditDpl = isDpl || isSuper;

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
      if (formatted.length > 0 && !selectedStudentId) {
        setSelectedStudentId(formatted[0].studentId);
      }
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
  const loadAssessment = useCallback(async () => {
    if (!selectedStudentId) return;
    try {
      const data = await penilaianKknApiService.getStudentPenilaian(selectedStudentId);
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
    }
  }, [selectedStudentId]);

  useEffect(() => {
    loadAssessment();
  }, [loadAssessment]);

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

  // Simpan Penilaian (Fleksibel tanpa finalisasi kaku)
  const handleSaveScore = async () => {
    if (!selectedStudentId) return;
    setSaving(true);
    try {
      await penilaianKknApiService.savePenilaian({
        studentId: selectedStudentId,
        ...scores,
      });
      toast.success("Penilaian mahasiswa berhasil disimpan!");
      // Refresh rekap data
      fetchStudents();
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

  const handleSelectStudentForAssessment = (studentId: string) => {
    setSelectedStudentId(studentId);
    // Smooth scroll down to assessment form if on mobile/desktop
    const el = document.getElementById("form-penilaian-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const isGradeComplete = subtotalDpl > 0 && subtotalMitra > 0;

  // Cetak PDF Berita Acara & Lembar Nilai (Hanya jika nilai lengkap 100%)
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
          <p>Kecamatan Coblong - Universitas Komputer Indonesia & Pemerintah Kota Bandung</p>
        </div>

        <div class="meta-grid">
          <div class="meta-item"><span class="meta-label">Nama Mahasiswa:</span><span class="meta-value">${studentInfo?.nama || "-"}</span></div>
          <div class="meta-item"><span class="meta-label">NIM:</span><span class="meta-value">${studentInfo?.nim || "-"}</span></div>
          <div class="meta-item"><span class="meta-label">Jenjang:</span><span class="meta-value">${studentInfo?.jenjangPendidikan || "S1"}</span></div>
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
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950 dark:bg-slate-800/60 p-4 md:p-6 space-y-6 text-slate-800 dark:text-slate-100">
      {/* Header Utama */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <Award size={22} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Penilaian KKN Mahasiswa
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">
                Evaluasi performa lapangan (Mitra 70%) dan capaian akademik (DPL 30%) dengan kalkulasi otomatis.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Ringkasan Nilai Angkatan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-black shrink-0">
            <Users size={16} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Total Mahasiswa</span>
            <span className="text-lg font-black text-slate-900 dark:text-slate-100">{studentsRekap.length} Orang</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-black shrink-0">
            <GraduationCap size={16} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Rerata Nilai DPL (30%)</span>
            <span className="text-lg font-black text-amber-700">
              {studentsRekap.length > 0
                ? (studentsRekap.reduce((acc, s) => acc + (s.subtotalDpl || 0), 0) / studentsRekap.length).toFixed(1)
                : "0"}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-black shrink-0">
            <ClipboardList size={16} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Rerata Nilai Mitra (70%)</span>
            <span className="text-lg font-black text-emerald-700">
              {studentsRekap.length > 0
                ? (studentsRekap.reduce((acc, s) => acc + (s.subtotalMitra || 0), 0) / studentsRekap.length).toFixed(1)
                : "0"}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-black shrink-0">
            <Award size={16} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Rerata Nilai Akhir</span>
            <span className="text-lg font-black text-blue-700">
              {studentsRekap.length > 0
                ? (studentsRekap.reduce((acc, s) => acc + (s.nilaiAkhir || 0), 0) / studentsRekap.length).toFixed(1)
                : "0"}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 1: TABEL REKAPITULASI MAHASISWA DENGAN KOLOM MANDIRI */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
              Daftar Mahasiswa & Nilai Akhir
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih mahasiswa untuk membuka form penilaian aspek dan portofolio KKN. Kolom NIM, Jenjang, dan Program Studi dipisah secara mandiri.
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
                <tr className="bg-slate-50/90 text-slate-600 dark:text-slate-400 font-extrabold uppercase text-[10.5px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3 px-3 text-center w-10">No</th>
                  <th className="py-3 px-3">NIM</th>
                  <th className="py-3 px-3">Nama Mahasiswa</th>
                  <th className="py-3 px-3">Jenjang</th>
                  <th className="py-3 px-3">Program Studi</th>
                  <th className="py-3 px-3">Kelompok</th>
                  <th className="py-3 px-3 text-center">Nilai DPL (30%)</th>
                  <th className="py-3 px-3 text-center">Nilai MPL (70%)</th>
                  <th className="py-3 px-3 text-center">Nilai Akhir</th>
                  <th className="py-3 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                {paginatedStudents.map((st, idx) => {
                  const isSelected = st.studentId === selectedStudentId;
                  const grade = getCategory(st.nilaiAkhir);
                  return (
                    <tr
                      key={st.studentId}
                      className={`transition-colors ${
                        isSelected ? "bg-emerald-50/60 font-semibold" : "hover:bg-slate-50/80"
                      }`}
                    >
                      <td className="py-3 px-3 text-center font-bold text-slate-400">
                        {(currentPage - 1) * itemsPerPage + idx + 1}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-800 dark:text-slate-100">{st.nim}</td>
                      <td className="py-3 px-3 font-extrabold text-slate-900 dark:text-slate-100">{st.nama}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 text-[10.5px]">
                          {st.jenjangPendidikan || "S1"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{st.jurusan || "-"}</td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{st.kelompok}</td>
                      <td className="py-3 px-3 text-center font-black text-amber-700">
                        {st.subtotalDpl > 0 ? st.subtotalDpl.toFixed(2) : "-"}
                      </td>
                      <td className="py-3 px-3 text-center font-black text-emerald-700">
                        {st.subtotalMitra > 0 ? st.subtotalMitra.toFixed(2) : "-"}
                      </td>
                      <td className="py-3 px-3 text-center font-black text-slate-900 dark:text-slate-100">
                        {st.nilaiAkhir > 0 ? (
                          <span className="inline-flex items-center gap-1">
                            <span>{st.nilaiAkhir.toFixed(2)}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-black border ${grade.color}`}>
                              {grade.letter}
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">Belum Dinilai</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleSelectStudentForAssessment(st.studentId)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                            isSelected
                              ? "bg-emerald-600 text-white"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                          }`}
                        >
                          <Award size={13} />
                          <span>{isSelected ? "Sedang Dinilai" : "Beri Nilai"}</span>
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

      {/* SECTION 2: FORM PENILAIAN ASPEK & PORTOFOLIO AKTIVITAS */}
      {selectedStudentId && studentInfo && (
        <div id="form-penilaian-section" className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-6">
          {/* Header Mahasiswa yang Sedang Dinilai */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {studentInfo.kelompok}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {studentInfo.rw ? `${studentInfo.rw}, ` : ""}Kel. {studentInfo.kelurahan || "Coblong"}
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1.5 flex items-center gap-2">
                <span>{studentInfo.nama}</span>
                <span className="font-mono text-sm text-slate-500 font-normal">({studentInfo.nim})</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Jenjang {studentInfo.jenjangPendidikan || "S1"} &bull; {studentInfo.programStudi} ({studentInfo.fakultas || "-"}) &bull; DPL: <strong>{studentInfo.dplNama || "-"}</strong>
              </p>
            </div>

            {/* Header Form Penilaian Sesuai Role */}
            <div className="flex items-center gap-2">
              {isDpl && !isSuper && (
                <span className="px-3 py-1 rounded-xl text-xs font-black bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1.5 shadow-2xs">
                  <GraduationCap size={15} className="text-amber-600" />
                  <span>Lembar Penilaian Akademik DPL (30%)</span>
                </span>
              )}
              {isMitra && !isSuper && (
                <span className="px-3 py-1 rounded-xl text-xs font-black bg-emerald-50 text-emerald-900 border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
                  <ClipboardList size={15} className="text-emerald-600" />
                  <span>Lembar Penilaian Lapangan Mitra (70%)</span>
                </span>
              )}
              {isSuper && (
                <span className="px-3 py-1 rounded-xl text-xs font-black bg-blue-50 text-blue-900 border border-blue-200 flex items-center gap-1.5 shadow-2xs">
                  <Award size={15} className="text-blue-600" />
                  <span>Lembar Penilaian Komprehensif (DPL 30% + Mitra 70%)</span>
                </span>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {/* Summary Nilai Bar Sesuai Role */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-6 flex-wrap">
                {/* Mode Tampilan DPL */}
                {isDpl && !isSuper && (
                  <>
                    <div className="bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-amber-200 shadow-2xs">
                      <span className="text-[10px] font-bold text-amber-800 uppercase block">Subtotal DPL (Porsi Anda • 30%)</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-xl font-black text-amber-700">{subtotalDpl.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-slate-100/80 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Subtotal MPL (Porsi Lapangan • 70%)</span>
                      <span className="text-sm font-black text-slate-700 dark:text-slate-300 mt-0.5 block">
                        {subtotalMitra > 0 ? subtotalMitra.toFixed(2) : "Belum Dinilai"}
                      </span>
                    </div>
                  </>
                )}

                {/* Mode Tampilan Mitra / MPL */}
                {isMitra && !isSuper && (
                  <>
                    <div className="bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-emerald-200 shadow-2xs">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase block">Subtotal MPL (Porsi Anda • 70%)</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-xl font-black text-emerald-700">{subtotalMitra.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-slate-100/80 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Subtotal DPL (Akademik • 30%)</span>
                      <span className="text-sm font-black text-slate-700 dark:text-slate-300 mt-0.5 block">
                        {subtotalDpl > 0 ? subtotalDpl.toFixed(2) : "Belum Dinilai"}
                      </span>
                    </div>
                  </>
                )}

                {/* Mode Super User / Developer */}
                {isSuper && (
                  <>
                    <div>
                      <span className="text-[10.5px] font-bold text-slate-400 uppercase block">Subtotal DPL (30%)</span>
                      <span className="text-lg font-black text-amber-700">{subtotalDpl.toFixed(2)}</span>
                    </div>
                    <span className="text-slate-300 text-xl font-light">+</span>
                    <div>
                      <span className="text-[10.5px] font-bold text-slate-400 uppercase block">Subtotal MPL (70%)</span>
                      <span className="text-lg font-black text-emerald-700">{subtotalMitra.toFixed(2)}</span>
                    </div>
                    <span className="text-slate-300 text-xl font-light">=</span>
                  </>
                )}

                <div>
                  <span className="text-[10.5px] font-bold text-slate-400 uppercase block">Nilai Akhir Kumulatif</span>
                  <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{nilaiAkhir.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-3 py-1.5 rounded-xl text-xs font-black border ${currentCategory.color}`}>
                  {currentCategory.label} ({currentCategory.letter})
                </span>
                <button
                  type="button"
                  onClick={handleSaveScore}
                  disabled={saving || !selectedStudentId}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition shadow-xs cursor-pointer disabled:opacity-50"
                  title="Simpan Penilaian Mahasiswa"
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  <span>Simpan Penilaian</span>
                </button>
              </div>
            </div>

            {/* Tables Sesuai Role */}
            <div className={`grid grid-cols-1 ${isSuper ? "lg:grid-cols-2" : "grid-cols-1"} gap-6`}>
              {/* TABEL DPL (30%) — Tampil untuk DPL & Super User */}
              {(canEditDpl || isSuper) && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col justify-between shadow-2xs">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-amber-50/50 flex items-center justify-between">
                    <h3 className="text-sm font-black text-amber-950 flex items-center gap-2">
                      <GraduationCap size={17} className="text-amber-600" />
                      <span>Aspek Dosen Pendamping Lapangan (DPL) &bull; Bobot 30%</span>
                    </h3>
                    {!canEditDpl && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 text-slate-700 dark:text-slate-300">
                        View Only
                      </span>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-extrabold uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                          <th className="py-2.5 px-3 text-center w-8">No</th>
                          <th className="py-2.5 px-3">Aspek Akademik DPL</th>
                          <th className="py-2.5 px-2 text-center w-12">Bobot</th>
                          <th className="py-2.5 px-3 text-center">Skor (0–4)</th>
                          <th className="py-2.5 px-3 text-right w-16">Nilai</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                        {/* 1. Perencanaan */}
                        <tr className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3 text-center font-bold text-slate-400">1</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">Perencanaan & Pemahaman Program</td>
                          <td className="py-2.5 px-2 text-center font-bold text-slate-700 dark:text-slate-300">5%</td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {[0, 1, 2, 3, 4].map((num) => (
                                <button
                                  key={num}
                                  type="button"
                                  disabled={!canEditDpl}
                                  onClick={() => handleScoreChange("skorDplPerencanaan", num)}
                                  className={`w-6 h-6 rounded-md text-xs font-black transition flex items-center justify-center ${
                                    scores.skorDplPerencanaan === num
                                      ? "bg-amber-500 text-white shadow-xs"
                                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                  } ${canEditDpl ? "cursor-pointer" : "cursor-not-allowed opacity-75"}`}
                                >
                                  {num}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-slate-100">
                            {nilaiAspekDpl.perencanaan.toFixed(2)}
                          </td>
                        </tr>

                        {/* 2. Kontribusi */}
                        <tr className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3 text-center font-bold text-slate-400">2</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">Kontribusi Individu</td>
                          <td className="py-2.5 px-2 text-center font-bold text-slate-700 dark:text-slate-300">5%</td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {[0, 1, 2, 3, 4].map((num) => (
                                <button
                                  key={num}
                                  type="button"
                                  disabled={!canEditDpl}
                                  onClick={() => handleScoreChange("skorDplKontribusi", num)}
                                  className={`w-6 h-6 rounded-md text-xs font-black transition flex items-center justify-center ${
                                    scores.skorDplKontribusi === num
                                      ? "bg-amber-500 text-white shadow-xs"
                                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                  } ${canEditDpl ? "cursor-pointer" : "cursor-not-allowed opacity-75"}`}
                                >
                                  {num}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-slate-100">
                            {nilaiAspekDpl.kontribusi.toFixed(2)}
                          </td>
                        </tr>

                        {/* 3. Logbook */}
                        <tr className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3 text-center font-bold text-slate-400">3</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">Logbook & Dokumentasi Akademik</td>
                          <td className="py-2.5 px-2 text-center font-bold text-slate-700 dark:text-slate-300">5%</td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {[0, 1, 2, 3, 4].map((num) => (
                                <button
                                  key={num}
                                  type="button"
                                  disabled={!canEditDpl}
                                  onClick={() => handleScoreChange("skorDplLogbook", num)}
                                  className={`w-6 h-6 rounded-md text-xs font-black transition flex items-center justify-center ${
                                    scores.skorDplLogbook === num
                                      ? "bg-amber-500 text-white shadow-xs"
                                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                  } ${canEditDpl ? "cursor-pointer" : "cursor-not-allowed opacity-75"}`}
                                >
                                  {num}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-slate-100">
                            {nilaiAspekDpl.logbook.toFixed(2)}
                          </td>
                        </tr>

                        {/* 4. Analisis */}
                        <tr className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3 text-center font-bold text-slate-400">4</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">Analisis Masalah & Solusi</td>
                          <td className="py-2.5 px-2 text-center font-bold text-slate-700 dark:text-slate-300">5%</td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {[0, 1, 2, 3, 4].map((num) => (
                                <button
                                  key={num}
                                  type="button"
                                  disabled={!canEditDpl}
                                  onClick={() => handleScoreChange("skorDplAnalisis", num)}
                                  className={`w-6 h-6 rounded-md text-xs font-black transition flex items-center justify-center ${
                                    scores.skorDplAnalisis === num
                                      ? "bg-amber-500 text-white shadow-xs"
                                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                  } ${canEditDpl ? "cursor-pointer" : "cursor-not-allowed opacity-75"}`}
                                >
                                  {num}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-slate-100">
                            {nilaiAspekDpl.analisis.toFixed(2)}
                          </td>
                        </tr>

                        {/* 5. Output */}
                        <tr className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3 text-center font-bold text-slate-400">5</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">Output, Outcome, & Dampak</td>
                          <td className="py-2.5 px-2 text-center font-bold text-slate-700 dark:text-slate-300">5%</td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {[0, 1, 2, 3, 4].map((num) => (
                                <button
                                  key={num}
                                  type="button"
                                  disabled={!canEditDpl}
                                  onClick={() => handleScoreChange("skorDplOutput", num)}
                                  className={`w-6 h-6 rounded-md text-xs font-black transition flex items-center justify-center ${
                                    scores.skorDplOutput === num
                                      ? "bg-amber-500 text-white shadow-xs"
                                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                  } ${canEditDpl ? "cursor-pointer" : "cursor-not-allowed opacity-75"}`}
                                >
                                  {num}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-slate-100">
                            {nilaiAspekDpl.output.toFixed(2)}
                          </td>
                        </tr>

                        {/* 6. Laporan Akhir */}
                        <tr className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3 text-center font-bold text-slate-400">6</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">Laporan Akhir, Evaluasi & Refleksi</td>
                          <td className="py-2.5 px-2 text-center font-bold text-slate-700 dark:text-slate-300">5%</td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {[0, 1, 2, 3, 4].map((num) => (
                                <button
                                  key={num}
                                  type="button"
                                  disabled={!canEditDpl}
                                  onClick={() => handleScoreChange("skorDplLaporanAkhir", num)}
                                  className={`w-6 h-6 rounded-md text-xs font-black transition flex items-center justify-center ${
                                    scores.skorDplLaporanAkhir === num
                                      ? "bg-amber-500 text-white shadow-xs"
                                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                  } ${canEditDpl ? "cursor-pointer" : "cursor-not-allowed opacity-75"}`}
                                >
                                  {num}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-slate-100">
                            {nilaiAspekDpl.laporanAkhir.toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="p-3 bg-amber-50/70 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
                    <span className="font-extrabold text-amber-900">Subtotal DPL (30%):</span>
                    <span className="text-base font-black text-amber-700">{subtotalDpl.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* TABEL MPL (70%) — Tampil untuk Mitra & Super User */}
              {(canEditMitra || isSuper) && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col justify-between shadow-2xs">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-emerald-50/50 flex items-center justify-between">
                    <h3 className="text-sm font-black text-emerald-950 flex items-center gap-2">
                      <ClipboardList size={17} className="text-emerald-600" />
                      <span>Aspek Mitra Pendamping Lapangan (MPL) &bull; Bobot 70%</span>
                    </h3>
                    {!canEditMitra && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 text-slate-700 dark:text-slate-300">
                        View Only
                      </span>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-extrabold uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                          <th className="py-2.5 px-3 text-center w-8">No</th>
                          <th className="py-2.5 px-3">Aspek Lapangan (MPL)</th>
                          <th className="py-2.5 px-2 text-center w-12">Bobot</th>
                          <th className="py-2.5 px-3 text-center">Skor (0–4)</th>
                          <th className="py-2.5 px-3 text-right w-16">Nilai</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                        {/* 1. Kehadiran */}
                        <tr className="hover:bg-slate-50/60">
                          <td className="py-2 px-3 text-center font-bold text-slate-400">1</td>
                          <td className="py-2 px-3 font-bold text-slate-900 dark:text-slate-100">Kehadiran dan Kedisiplinan</td>
                          <td className="py-2 px-2 text-center font-bold text-slate-700 dark:text-slate-300">10%</td>
                          <td className="py-2 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {[0, 1, 2, 3, 4].map((num) => (
                                <button
                                  key={num}
                                  type="button"
                                  disabled={!canEditMitra}
                                  onClick={() => handleScoreChange("skorMitraKehadiran", num)}
                                  className={`w-6 h-6 rounded-md text-xs font-black transition flex items-center justify-center ${
                                    scores.skorMitraKehadiran === num
                                      ? "bg-emerald-600 text-white shadow-xs"
                                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                  } ${canEditMitra ? "cursor-pointer" : "cursor-not-allowed opacity-75"}`}
                                >
                                  {num}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-right font-black text-slate-900 dark:text-slate-100">
                            {nilaiAspekMitra.kehadiran.toFixed(2)}
                          </td>
                        </tr>

                        {/* 2. Warga Binaan */}
                        <tr className="hover:bg-slate-50/60">
                          <td className="py-2 px-3 text-center font-bold text-slate-400">2</td>
                          <td className="py-2 px-3 font-bold text-slate-900 dark:text-slate-100">Pembinaan Rumah Tangga / Warga Binaan</td>
                          <td className="py-2 px-2 text-center font-bold text-slate-700 dark:text-slate-300">10%</td>
                          <td className="py-2 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {[0, 1, 2, 3, 4].map((num) => (
                                <button
                                  key={num}
                                  type="button"
                                  disabled={!canEditMitra}
                                  onClick={() => handleScoreChange("skorMitraWargaBinaan", num)}
                                  className={`w-6 h-6 rounded-md text-xs font-black transition flex items-center justify-center ${
                                    scores.skorMitraWargaBinaan === num
                                      ? "bg-emerald-600 text-white shadow-xs"
                                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                  } ${canEditMitra ? "cursor-pointer" : "cursor-not-allowed opacity-75"}`}
                                >
                                  {num}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-right font-black text-slate-900 dark:text-slate-100">
                            {nilaiAspekMitra.wargaBinaan.toFixed(2)}
                          </td>
                        </tr>

                        {/* 3. Program Kerja */}
                        <tr className="hover:bg-slate-50/60">
                          <td className="py-2 px-3 text-center font-bold text-slate-400">3</td>
                          <td className="py-2 px-3 font-bold text-slate-900 dark:text-slate-100">Keterlibatan Program Kerja Kelompok & Lapangan</td>
                          <td className="py-2 px-2 text-center font-bold text-slate-700 dark:text-slate-300">10%</td>
                          <td className="py-2 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {[0, 1, 2, 3, 4].map((num) => (
                                <button
                                  key={num}
                                  type="button"
                                  disabled={!canEditMitra}
                                  onClick={() => handleScoreChange("skorMitraProker", num)}
                                  className={`w-6 h-6 rounded-md text-xs font-black transition flex items-center justify-center ${
                                    scores.skorMitraProker === num
                                      ? "bg-emerald-600 text-white shadow-xs"
                                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                  } ${canEditMitra ? "cursor-pointer" : "cursor-not-allowed opacity-75"}`}
                                >
                                  {num}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-right font-black text-slate-900 dark:text-slate-100">
                            {nilaiAspekMitra.proker.toFixed(2)}
                          </td>
                        </tr>

                        {/* 4. Komunikasi */}
                        <tr className="hover:bg-slate-50/60">
                          <td className="py-2 px-3 text-center font-bold text-slate-400">4</td>
                          <td className="py-2 px-3 font-bold text-slate-900 dark:text-slate-100">Komunikasi, Sopan Santun, & Etika Sosial</td>
                          <td className="py-2 px-2 text-center font-bold text-slate-700 dark:text-slate-300">8%</td>
                          <td className="py-2 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {[0, 1, 2, 3, 4].map((num) => (
                                <button
                                  key={num}
                                  type="button"
                                  disabled={!canEditMitra}
                                  onClick={() => handleScoreChange("skorMitraKomunikasi", num)}
                                  className={`w-6 h-6 rounded-md text-xs font-black transition flex items-center justify-center ${
                                    scores.skorMitraKomunikasi === num
                                      ? "bg-emerald-600 text-white shadow-xs"
                                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                  } ${canEditMitra ? "cursor-pointer" : "cursor-not-allowed opacity-75"}`}
                                >
                                  {num}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-right font-black text-slate-900 dark:text-slate-100">
                            {nilaiAspekMitra.komunikasi.toFixed(2)}
                          </td>
                        </tr>

                        {/* 5. Tanggung Jawab */}
                        <tr className="hover:bg-slate-50/60">
                          <td className="py-2 px-3 text-center font-bold text-slate-400">5</td>
                          <td className="py-2 px-3 font-bold text-slate-900 dark:text-slate-100">Tanggung Jawab & Kerja Sama Tim</td>
                          <td className="py-2 px-2 text-center font-bold text-slate-700 dark:text-slate-300">8%</td>
                          <td className="py-2 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {[0, 1, 2, 3, 4].map((num) => (
                                <button
                                  key={num}
                                  type="button"
                                  disabled={!canEditMitra}
                                  onClick={() => handleScoreChange("skorMitraTanggungJawab", num)}
                                  className={`w-6 h-6 rounded-md text-xs font-black transition flex items-center justify-center ${
                                    scores.skorMitraTanggungJawab === num
                                      ? "bg-emerald-600 text-white shadow-xs"
                                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                  } ${canEditMitra ? "cursor-pointer" : "cursor-not-allowed opacity-75"}`}
                                >
                                  {num}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-right font-black text-slate-900 dark:text-slate-100">
                            {nilaiAspekMitra.tanggungJawab.toFixed(2)}
                          </td>
                        </tr>

                        {/* 6. Bukti Kegiatan */}
                        <tr className="hover:bg-slate-50/60">
                          <td className="py-2 px-3 text-center font-bold text-slate-400">6</td>
                          <td className="py-2 px-3 font-bold text-slate-900 dark:text-slate-100">Kesesuaian Bukti Kegiatan Lapangan</td>
                          <td className="py-2 px-2 text-center font-bold text-slate-700 dark:text-slate-300">7%</td>
                          <td className="py-2 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {[0, 1, 2, 3, 4].map((num) => (
                                <button
                                  key={num}
                                  type="button"
                                  disabled={!canEditMitra}
                                  onClick={() => handleScoreChange("skorMitraBuktiKegiatan", num)}
                                  className={`w-6 h-6 rounded-md text-xs font-black transition flex items-center justify-center ${
                                    scores.skorMitraBuktiKegiatan === num
                                      ? "bg-emerald-600 text-white shadow-xs"
                                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                  } ${canEditMitra ? "cursor-pointer" : "cursor-not-allowed opacity-75"}`}
                                >
                                  {num}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-right font-black text-slate-900 dark:text-slate-100">
                            {nilaiAspekMitra.buktiKegiatan.toFixed(2)}
                          </td>
                        </tr>

                        {/* 7. Dampak */}
                        <tr className="hover:bg-slate-50/60">
                          <td className="py-2 px-3 text-center font-bold text-slate-400">7</td>
                          <td className="py-2 px-3 font-bold text-slate-900 dark:text-slate-100">Dampak Nyata kepada Masyarakat & Wilayah</td>
                          <td className="py-2 px-2 text-center font-bold text-slate-700 dark:text-slate-300">10%</td>
                          <td className="py-2 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {[0, 1, 2, 3, 4].map((num) => (
                                <button
                                  key={num}
                                  type="button"
                                  disabled={!canEditMitra}
                                  onClick={() => handleScoreChange("skorMitraDampak", num)}
                                  className={`w-6 h-6 rounded-md text-xs font-black transition flex items-center justify-center ${
                                    scores.skorMitraDampak === num
                                      ? "bg-emerald-600 text-white shadow-xs"
                                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                  } ${canEditMitra ? "cursor-pointer" : "cursor-not-allowed opacity-75"}`}
                                >
                                  {num}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-right font-black text-slate-900 dark:text-slate-100">
                            {nilaiAspekMitra.dampak.toFixed(2)}
                          </td>
                        </tr>

                        {/* 8. Inisiatif */}
                        <tr className="hover:bg-slate-50/60">
                          <td className="py-2 px-3 text-center font-bold text-slate-400">8</td>
                          <td className="py-2 px-3 font-bold text-slate-900 dark:text-slate-100">Inisiatif Mandiri & Problem Solving</td>
                          <td className="py-2 px-2 text-center font-bold text-slate-700 dark:text-slate-300">7%</td>
                          <td className="py-2 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {[0, 1, 2, 3, 4].map((num) => (
                                <button
                                  key={num}
                                  type="button"
                                  disabled={!canEditMitra}
                                  onClick={() => handleScoreChange("skorMitraInisiatif", num)}
                                  className={`w-6 h-6 rounded-md text-xs font-black transition flex items-center justify-center ${
                                    scores.skorMitraInisiatif === num
                                      ? "bg-emerald-600 text-white shadow-xs"
                                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                  } ${canEditMitra ? "cursor-pointer" : "cursor-not-allowed opacity-75"}`}
                                >
                                  {num}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-right font-black text-slate-900 dark:text-slate-100">
                            {nilaiAspekMitra.inisiatif.toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="p-3 bg-emerald-50/70 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
                    <span className="font-extrabold text-emerald-900">Subtotal MPL (70%):</span>
                    <span className="text-base font-black text-emerald-700">{subtotalMitra.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Catatan Evaluator Sesuai Role */}
            <div className={`grid grid-cols-1 ${isSuper ? "md:grid-cols-2" : "grid-cols-1"} gap-4`}>
              {(canEditDpl || isSuper) && (
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Catatan Evaluasi Dosen Pendamping Lapangan (DPL):</label>
                  <textarea
                    rows={3}
                    value={scores.catatanDpl}
                    onChange={(e) => setScores((prev) => ({ ...prev, catatanDpl: e.target.value }))}
                    placeholder="Tuliskan catatan akademik dan bimbingan untuk mahasiswa..."
                    disabled={!canEditDpl}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 disabled:bg-slate-100"
                  />
                </div>
              )}

              {(canEditMitra || isSuper) && (
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Catatan Evaluasi Mitra Pendamping Lapangan (MPL):</label>
                  <textarea
                    rows={3}
                    value={scores.catatanMitra}
                    onChange={(e) => setScores((prev) => ({ ...prev, catatanMitra: e.target.value }))}
                    placeholder="Tuliskan catatan etika, inisiatif, dan kinerja lapangan..."
                    disabled={!canEditMitra}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 disabled:bg-slate-100"
                  />
                </div>
              )}
            </div>

            {/* Action Footer Bawah Form */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
              <div className="text-xs text-emerald-900">
                <span className="font-extrabold block">Ringkasan Nilai Akhir:</span>
                <span className="text-slate-600 dark:text-slate-400">
                  DPL (30%): <strong>{subtotalDpl.toFixed(2)}</strong> | MPL (70%): <strong>{subtotalMitra.toFixed(2)}</strong> | Total: <strong>{nilaiAkhir.toFixed(2)}</strong> ({currentCategory.label} / {currentCategory.letter})
                </span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handlePrintPdf}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition border ${
                    isGradeComplete
                      ? "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs cursor-pointer"
                      : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                  }`}
                  title={isGradeComplete ? "Cetak Dokumen Resmi PDF" : "Cetak PDF baru aktif setelah nilai lengkap dari kedua pihak"}
                >
                  <Printer size={15} className={isGradeComplete ? "text-slate-500" : "text-slate-400"} />
                  <span>Cetak PDF</span>
                  {!isGradeComplete && (
                    <span className="text-[9.5px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold ml-1">
                      Belum Lengkap
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PenilaianKknMahasiswaPage;
