/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Modul Penilaian KKN Mahasiswa (Komposisi Mitra/PL 70% + DPL 30%)
 * Sesuai Acuan UI Resmi PT Makerindo (Gambar Penilaian KKN Mahasiswa)
 * - 100% Real-time Database Integration
 * - Perhitungan Matematis Otomatis & Presisi
 * - Cetak Lembar Nilai Resmi PDF dengan Tanda Tangan DPL & Mitra
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Printer,
  Save,
  CheckCircle2,
  User,
  Users,
  GraduationCap,
  MapPin,
  Calendar,
  UserCheck,
  CreditCard,
  ClipboardList,
  Calculator,
  MessageSquare,
  Sparkles,
  Lock,
  ChevronDown,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/useAuthStore";
import {
  penilaianKknApiService,
  type StudentInfo,
  type RequirementsInfo,
} from "../../services/penilaianKknApiService";

interface StudentOption {
  id: string;
  name: string;
  nim: string;
  kelompokName: string;
}

export const PenilaianKknMahasiswaPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const userRole = String(user?.role || user?.peran || "").toUpperCase();

  const isDpl = ["DPL", "DOSEN_PEMBIMBING"].includes(userRole);
  const isMitra = ["ADMIN_DLH", "DLH", "LURAH", "KELURAHAN", "RW", "MITRA"].includes(userRole);
  const isSuper = ["SUPER_USER", "DEVELOPER", "PANITIA_TASKFORCE", "CAMAT", "PEMIMPIN"].includes(userRole);

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [studentsList, setStudentsList] = useState<StudentOption[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [requirements, setRequirements] = useState<RequirementsInfo>({
    attendanceRate: 0,
    isAttendanceValid: false,
    wargaBinaanCount: 0,
    isWargaValid: false,
    prokerCount: 0,
    isProkerValid: false,
    isEvidenceValid: false,
  });

  // Pure Zero Initial State - 100% Real API data driven (Anti-Dummy)
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
    isFinalized: boolean;
    status: "DRAFT" | "TERSIMPAN" | "FINAL";
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
    isFinalized: false,
    status: "DRAFT",
  });

  const canEditMitra = !scores.isFinalized && (isMitra || isSuper);
  const canEditDpl = !scores.isFinalized && (isDpl || isSuper);

  // Fetch Daftar Mahasiswa Binaan dari API Real (Role-Scoped)
  useEffect(() => {
    const loadStudents = async () => {
      try {
        const list = await penilaianKknApiService.getRekapPenilaian();
        const formatted: StudentOption[] = (Array.isArray(list) ? list : []).map((s: any) => ({
          id: s.studentId || s.id,
          name: s.nama || s.name,
          nim: s.nim || "-",
          kelompokName: s.kelompok || "Kelompok KKN",
        }));
        setStudentsList(formatted);
        if (formatted.length > 0) {
          setSelectedStudentId(formatted[0].id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Gagal memuat daftar mahasiswa:", err);
        setLoading(false);
      }
    };
    loadStudents();
  }, []);

  // Fetch Data Penilaian Mahasiswa Terpilih dari Database
  const loadAssessment = useCallback(async () => {
    if (!selectedStudentId) return;
    setLoading(true);
    try {
      const data = await penilaianKknApiService.getStudentPenilaian(selectedStudentId);
      setStudentInfo(data.student);
      setRequirements(data.requirements);
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
        isFinalized: Boolean(a.isFinalized),
        status: a.status || "DRAFT",
      });
    } catch (err: any) {
      toast.error("Gagal memuat data penilaian mahasiswa: " + (err.message || "Error"));
    } finally {
      setLoading(false);
    }
  }, [selectedStudentId]);

  useEffect(() => {
    loadAssessment();
  }, [loadAssessment]);

  // Kalkulasi Matematis Aspek: (Skor / 4) * Bobot
  const calcAspect = (skor: number, bobot: number) => {
    const safe = Math.max(0, Math.min(4, Number(skor) || 0));
    return Number(((safe / 4) * bobot).toFixed(2));
  };

  // Subtotal Mitra (Max 70)
  const nilaiAspekMitra = {
    kehadiran: calcAspect(scores.skorMitraKehadiran, 10),
    wargaBinaan: calcAspect(scores.skorMitraWargaBinaan, 10),
    proker: calcAspect(scores.skorMitraProker, 10),
    komunikasi: calcAspect(scores.skorMitraKomunikasi, 8),
    tanggungJawab: calcAspect(scores.skorMitraTanggungJawab, 8),
    buktiKegiatan: calcAspect(scores.skorMitraBuktiKegiatan, 7),
    dampak: calcAspect(scores.skorMitraDampak, 10),
    inisiatif: calcAspect(scores.skorMitraInisiatif, 7),
  };

  const subtotalMitra = Number(
    Object.values(nilaiAspekMitra)
      .reduce((a, b) => a + b, 0)
      .toFixed(2)
  );

  // Subtotal DPL (Max 30)
  const nilaiAspekDpl = {
    perencanaan: calcAspect(scores.skorDplPerencanaan, 5),
    kontribusi: calcAspect(scores.skorDplKontribusi, 5),
    logbook: calcAspect(scores.skorDplLogbook, 5),
    analisis: calcAspect(scores.skorDplAnalisis, 5),
    output: calcAspect(scores.skorDplOutput, 5),
    laporanAkhir: calcAspect(scores.skorDplLaporanAkhir, 5),
  };

  const subtotalDpl = Number(
    Object.values(nilaiAspekDpl)
      .reduce((a, b) => a + b, 0)
      .toFixed(2)
  );

  // Nilai Akhir Kumulatif (Max 100)
  const nilaiAkhir = Number((subtotalMitra + subtotalDpl).toFixed(2));

  // Kategori Skala Standar
  const getCategory = (score: number) => {
    if (score >= 85) return { label: "Sangat Baik", color: "bg-emerald-100 text-emerald-800 border-emerald-300" };
    if (score >= 75) return { label: "Baik", color: "bg-teal-100 text-teal-800 border-teal-300" };
    if (score >= 65) return { label: "Cukup", color: "bg-amber-100 text-amber-800 border-amber-300" };
    if (score >= 55) return { label: "Kurang", color: "bg-orange-100 text-orange-800 border-orange-300" };
    if (score > 0) return { label: "Sangat Kurang", color: "bg-rose-100 text-rose-800 border-rose-300" };
    return { label: "Belum Dinilai", color: "bg-slate-100 text-slate-600 border-slate-300" };
  };

  const currentCategory = getCategory(nilaiAkhir);

  // Handle Score Change
  const handleScoreChange = (field: keyof typeof scores, value: number) => {
    if (scores.isFinalized && !["SUPER_USER", "DEVELOPER"].includes(userRole)) {
      toast.error("Penilaian telah difinalisasi dan dikunci resmi.");
      return;
    }
    setScores((prev) => ({ ...prev, [field]: value }));
  };

  // Simpan Penilaian
  const handleSaveDraft = async () => {
    if (!selectedStudentId) return;
    setSaving(true);
    try {
      await penilaianKknApiService.savePenilaian({
        studentId: selectedStudentId,
        ...scores,
      });
      toast.success("Penilaian mahasiswa berhasil disimpan ke database!");
      setScores((prev) => ({ ...prev, status: "TERSIMPAN" }));
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan penilaian");
    } finally {
      setSaving(false);
    }
  };

  // Finalisasi Penilaian
  const handleFinalize = async () => {
    if (!selectedStudentId) return;
    const confirm = window.confirm(
      "Apakah Anda yakin ingin memfinalisasi penilaian ini? Penilaian akan dikunci dan siap dicetak resmi."
    );
    if (!confirm) return;

    setSaving(true);
    try {
      await penilaianKknApiService.finalizePenilaian({
        studentId: selectedStudentId,
        ...scores,
      });
      toast.success("Penilaian berhasil difinalisasi dan dikunci resmi!");
      setScores((prev) => ({ ...prev, isFinalized: true, status: "FINAL" }));
    } catch (err: any) {
      toast.error(err.message || "Gagal memfinalisasi penilaian");
    } finally {
      setSaving(false);
    }
  };

  // Cetak PDF Berita Acara & Lembar Nilai
  const handlePrintPdf = () => {
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
          <div class="meta-item"><span class="meta-label">Program Studi:</span><span class="meta-value">${studentInfo?.programStudi || "-"}</span></div>
          <div class="meta-item"><span class="meta-label">Kelompok:</span><span class="meta-value">${studentInfo?.kelompok || "-"}</span></div>
          <div class="meta-item"><span class="meta-label">Wilayah Tugas:</span><span class="meta-value">${studentInfo?.rw || "-"}, Kel. ${studentInfo?.kelurahan || "-"}</span></div>
          <div class="meta-item"><span class="meta-label">Periode KKN:</span><span class="meta-value">${studentInfo?.periodeKkn || "03 - 31 Agustus 2026"}</span></div>
          <div class="meta-item"><span class="meta-label">Mitra / Pembimbing Lapangan:</span><span class="meta-value">${studentInfo?.namaMitraPenilai || scores.namaMitraPenilai || "Mitra Lapangan"}</span></div>
          <div class="meta-item"><span class="meta-label">Dosen Pembimbing Lapangan:</span><span class="meta-value">${studentInfo?.dplNama || "-"}</span></div>
        </div>

        <!-- Tabel Mitra (70%) -->
        <h4 style="margin: 6px 0 3px 0; font-size: 9pt; color: #0f172a; text-transform: uppercase;">A. Penilaian Mitra / Lapangan (Bobot 70%)</h4>
        <table>
          <thead>
            <tr>
              <th width="5%" class="text-center">No</th>
              <th width="35%">Aspek Penilaian</th>
              <th width="30%">Indikator Acuan</th>
              <th width="10%" class="text-center">Bobot</th>
              <th width="10%" class="text-center">Skor (0-4)</th>
              <th width="10%" class="text-right">Nilai</th>
            </tr>
          </thead>
          <tbody>
            <tr><td class="text-center">1</td><td>Kehadiran dan Kedisiplinan</td><td>&ge; 80% kewajiban jam</td><td class="text-center">10%</td><td class="text-center">${scores.skorMitraKehadiran}</td><td class="text-right">${nilaiAspekMitra.kehadiran.toFixed(2)}</td></tr>
            <tr><td class="text-center">2</td><td>Warga Binaan</td><td>minimal 6 rumah / warga aktif</td><td class="text-center">10%</td><td class="text-center">${scores.skorMitraWargaBinaan}</td><td class="text-right">${nilaiAspekMitra.wargaBinaan.toFixed(2)}</td></tr>
            <tr><td class="text-center">3</td><td>Keterlibatan Program Kerja</td><td>minimal 1 program aktif</td><td class="text-center">10%</td><td class="text-center">${scores.skorMitraProker}</td><td class="text-right">${nilaiAspekMitra.proker.toFixed(2)}</td></tr>
            <tr><td class="text-center">4</td><td>Komunikasi & Etika</td><td>baik dengan warga / mitra</td><td class="text-center">8%</td><td class="text-center">${scores.skorMitraKomunikasi}</td><td class="text-right">${nilaiAspekMitra.komunikasi.toFixed(2)}</td></tr>
            <tr><td class="text-center">5</td><td>Tanggung Jawab & Kerja Sama</td><td>aktif dan bertanggung jawab</td><td class="text-center">8%</td><td class="text-center">${scores.skorMitraTanggungJawab}</td><td class="text-right">${nilaiAspekMitra.tanggungJawab.toFixed(2)}</td></tr>
            <tr><td class="text-center">6</td><td>Bukti Kegiatan</td><td>valid dan terverifikasi</td><td class="text-center">7%</td><td class="text-center">${scores.skorMitraBuktiKegiatan}</td><td class="text-right">${nilaiAspekMitra.buktiKegiatan.toFixed(2)}</td></tr>
            <tr><td class="text-center">7</td><td>Dampak kepada Masyarakat</td><td>ada perubahan / manfaat</td><td class="text-center">10%</td><td class="text-center">${scores.skorMitraDampak}</td><td class="text-right">${nilaiAspekMitra.dampak.toFixed(2)}</td></tr>
            <tr><td class="text-center">8</td><td>Inisiatif & Problem Solving</td><td>aktif memberikan solusi</td><td class="text-center">7%</td><td class="text-center">${scores.skorMitraInisiatif}</td><td class="text-right">${nilaiAspekMitra.inisiatif.toFixed(2)}</td></tr>
            <tr class="subtotal-row"><td colspan="5" style="text-align: right;">SUBTOTAL MITRA (70%):</td><td class="text-right">${subtotalMitra.toFixed(2)} / 70.00</td></tr>
          </tbody>
        </table>

        <!-- Tabel DPL (30%) -->
        <h4 style="margin: 6px 0 3px 0; font-size: 9pt; color: #0f172a; text-transform: uppercase;">B. Penilaian Dosen Pembimbing Lapangan (Bobot 30%)</h4>
        <table>
          <thead>
            <tr>
              <th width="5%" class="text-center">No</th>
              <th width="65%">Aspek Penilaian</th>
              <th width="10%" class="text-center">Bobot</th>
              <th width="10%" class="text-center">Skor (0-4)</th>
              <th width="10%" class="text-right">Nilai</th>
            </tr>
          </thead>
          <tbody>
            <tr><td class="text-center">1</td><td>Perencanaan & Pemahaman Program</td><td class="text-center">5%</td><td class="text-center">${scores.skorDplPerencanaan}</td><td class="text-right">${nilaiAspekDpl.perencanaan.toFixed(2)}</td></tr>
            <tr><td class="text-center">2</td><td>Kontribusi Individu</td><td class="text-center">5%</td><td class="text-center">${scores.skorDplKontribusi}</td><td class="text-right">${nilaiAspekDpl.kontribusi.toFixed(2)}</td></tr>
            <tr><td class="text-center">3</td><td>Logbook & Dokumentasi Akademik</td><td class="text-center">5%</td><td class="text-center">${scores.skorDplLogbook}</td><td class="text-right">${nilaiAspekDpl.logbook.toFixed(2)}</td></tr>
            <tr><td class="text-center">4</td><td>Analisis Masalah & Solusi</td><td class="text-center">5%</td><td class="text-center">${scores.skorDplAnalisis}</td><td class="text-right">${nilaiAspekDpl.analisis.toFixed(2)}</td></tr>
            <tr><td class="text-center">5</td><td>Output, Outcome, & Dampak</td><td class="text-center">5%</td><td class="text-center">${scores.skorDplOutput}</td><td class="text-right">${nilaiAspekDpl.output.toFixed(2)}</td></tr>
            <tr><td class="text-center">6</td><td>Laporan Akhir, Evaluasi, & Refleksi</td><td class="text-center">5%</td><td class="text-center">${scores.skorDplLaporanAkhir}</td><td class="text-right">${nilaiAspekDpl.laporanAkhir.toFixed(2)}</td></tr>
            <tr class="subtotal-row"><td colspan="4" style="text-align: right;">SUBTOTAL DPL (30%):</td><td class="text-right">${subtotalDpl.toFixed(2)} / 30.00</td></tr>
          </tbody>
        </table>

        <!-- Rekap Nilai Akhir -->
        <div class="final-box">
          <div>
            <div style="font-size: 8pt; font-weight: 700; text-transform: uppercase; color: #047857;">NILAI AKHIR KUMULATIF</div>
            <div style="font-size: 8pt; color: #334155;">Subtotal Mitra (${subtotalMitra.toFixed(2)}) + Subtotal DPL (${subtotalDpl.toFixed(2)})</div>
          </div>
          <div style="text-align: right;">
            <span class="final-score">${nilaiAkhir.toFixed(2)}</span>
            <span style="font-weight: 800; font-size: 9pt; background: #059669; color: white; padding: 2px 8px; border-radius: 4px; margin-left: 6px;">${currentCategory.label}</span>
          </div>
        </div>

        ${scores.catatanDpl ? `
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px 10px; border-radius: 6px; font-size: 8pt; margin-bottom: 10px;">
          <strong>Catatan DPL:</strong><br>
          <em>${scores.catatanDpl}</em>
        </div>` : ""}

        ${scores.catatanMitra ? `
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px 10px; border-radius: 6px; font-size: 8pt; margin-bottom: 10px;">
          <strong>Catatan Mitra:</strong><br>
          <em>${scores.catatanMitra}</em>
        </div>` : ""}

        <div class="sig-section">
          <div class="sig-box">
            <p>Mitra / Pembimbing Lapangan,</p>
            <div class="sig-space"></div>
            <p style="text-decoration: underline; font-weight: bold; margin: 0;">${studentInfo?.namaMitraPenilai || scores.namaMitraPenilai || "Mitra Lapangan"}</p>
            <p style="font-size: 7.5pt; color: #64748b; margin: 0;">Ketua RW / Mitra Lapangan</p>
          </div>
          <div class="sig-box">
            <p>Dosen Pembimbing Lapangan,</p>
            <div class="sig-space"></div>
            <p style="text-decoration: underline; font-weight: bold; margin: 0;">${studentInfo?.dplNama || "Dosen Pembimbing Lapangan"}</p>
            <p style="font-size: 7.5pt; color: #64748b; margin: 0;">NIP. ${studentInfo?.dplNip || "-"}</p>
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
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 p-4 md:p-6 space-y-6 text-slate-800">
      {/* Header Utama */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Penilaian KKN Mahasiswa
            </h1>
            {scores.isFinalized ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                <Lock size={12} /> FINAL RESMI
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300">
                <Sparkles size={12} /> MODE DRAFT
              </span>
            )}
          </div>
          <p className="text-slate-500 text-xs md:text-sm mt-1">
            DPL & Mitra Lapangan dapat menilai kinerja mahasiswa berdasarkan performa di lapangan, evaluasi akademik, bukti kegiatan, dan rekap nilai akhir.
          </p>
        </div>

        {/* 3 Tombol Aksi Header */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handlePrintPdf}
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition border border-slate-300 shadow-2xs cursor-pointer active:scale-95"
            title="Cetak Dokumen Resmi PDF"
          >
            <Printer size={15} className="text-slate-600" />
            <span>Cetak PDF</span>
          </button>

          {(canEditDpl || canEditMitra) && (
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saving || (scores.isFinalized && !["SUPER_USER", "DEVELOPER"].includes(userRole))}
              className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold transition border border-slate-300 shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
              title="Simpan Skor Sebagai Draft"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              <span>
                {isDpl ? "Simpan Penilaian DPL" : isMitra ? "Simpan Penilaian Mitra" : "Simpan Penilaian"}
              </span>
            </button>
          )}

          {(isDpl || isSuper) && (
            <button
              type="button"
              onClick={handleFinalize}
              disabled={saving || (scores.isFinalized && !["SUPER_USER", "DEVELOPER"].includes(userRole))}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
              title="Kunci & Finalisasi Nilai Resmi"
            >
              <CheckCircle2 size={15} />
              <span>Finalisasi Penilaian</span>
            </button>
          )}
        </div>
      </div>

      {/* Row 1: 4 Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Komposisi Penilaian (Donut Chart) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Komposisi Penilaian</h3>
          <div className="flex items-center gap-4 mt-3">
            {/* SVG Donut Chart */}
            <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
              <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-amber-400"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-500"
                  strokeDasharray="70, 100"
                  strokeWidth="4"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute font-black text-xs text-slate-900">70%</span>
            </div>

            {/* Legend */}
            <div className="space-y-1.5 text-xs font-bold">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-slate-600 text-[11px]">Mitra / Lapangan</span>
                </div>
                <span className="text-slate-900 font-extrabold text-[11px]">70%</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                  <span className="text-slate-600 text-[11px]">DPL</span>
                </div>
                <span className="text-slate-900 font-extrabold text-[11px]">30%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Persyaratan Minimum (Real Database Validation) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Persyaratan Minimum</h3>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <CheckCircle2 size={15} className={requirements.isAttendanceValid ? "text-emerald-600" : "text-amber-500"} />
              <span className="text-[11px]">Kehadiran &ge; 80% ({requirements.attendanceRate}%)</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <CheckCircle2 size={15} className={requirements.isWargaValid ? "text-emerald-600" : "text-amber-500"} />
              <span className="text-[11px]">Warga Binaan &ge; 6 ({requirements.wargaBinaanCount})</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <CheckCircle2 size={15} className={requirements.isProkerValid ? "text-emerald-600" : "text-amber-500"} />
              <span className="text-[11px]">Program Kerja &ge; 1 ({requirements.prokerCount})</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <CheckCircle2 size={15} className={requirements.isEvidenceValid ? "text-emerald-600" : "text-slate-400"} />
              <span className="text-[11px]">Evidence Valid</span>
            </div>
          </div>
        </div>

        {/* Card 3: Skala Penilaian */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Skala Penilaian</h3>
          <div className="flex items-center justify-between gap-1 mt-2 text-center">
            <div>
              <span className="w-6 h-6 mx-auto rounded-full bg-rose-100 text-rose-700 text-xs font-black flex items-center justify-center">
                0
              </span>
              <span className="text-[9.5px] font-medium text-slate-500 block mt-1">Tidak Ada</span>
            </div>
            <div>
              <span className="w-6 h-6 mx-auto rounded-full bg-orange-100 text-orange-700 text-xs font-black flex items-center justify-center">
                1
              </span>
              <span className="text-[9.5px] font-medium text-slate-500 block mt-1">Kurang</span>
            </div>
            <div>
              <span className="w-6 h-6 mx-auto rounded-full bg-amber-100 text-amber-700 text-xs font-black flex items-center justify-center">
                2
              </span>
              <span className="text-[9.5px] font-medium text-slate-500 block mt-1">Cukup</span>
            </div>
            <div>
              <span className="w-6 h-6 mx-auto rounded-full bg-teal-100 text-teal-700 text-xs font-black flex items-center justify-center">
                3
              </span>
              <span className="text-[9.5px] font-medium text-slate-500 block mt-1">Baik</span>
            </div>
            <div>
              <span className="w-6 h-6 mx-auto rounded-full bg-emerald-100 text-emerald-800 text-xs font-black flex items-center justify-center">
                4
              </span>
              <span className="text-[9.5px] font-medium text-slate-500 block mt-1">Sgt Baik</span>
            </div>
          </div>
        </div>

        {/* Card 4: Nilai Akhir */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Nilai Akhir</h3>
          <div className="flex items-center justify-between mt-2">
            <h2 className="text-3xl md:text-4xl font-black text-emerald-700 tracking-tight">
              {nilaiAkhir.toFixed(2).replace(".", ",")}
            </h2>
            <span className={`px-3 py-1 rounded-xl text-xs font-black border ${currentCategory.color}`}>
              {currentCategory.label}
            </span>
          </div>
          <p className="text-[10.5px] text-slate-400 font-medium mt-1">
            Kategori berdasarkan skala penilaian resmi
          </p>
        </div>
      </div>

      {/* Row 2: Identitas Mahasiswa Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <h2 className="text-sm font-black text-slate-900 flex items-center gap-2 uppercase tracking-wide">
            <User size={16} className="text-emerald-600" />
            <span>Identitas Mahasiswa</span>
          </h2>

          {/* Student Picker Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500 shrink-0">Pilih Mahasiswa:</label>
            <div className="relative min-w-[260px]">
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                disabled={studentsList.length === 0}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-1.5 text-xs font-bold text-slate-800 appearance-none focus:outline-none focus:border-emerald-500 cursor-pointer disabled:opacity-50"
              >
                {studentsList.length === 0 ? (
                  <option value="">Tidak ada mahasiswa terdaftar</option>
                ) : (
                  studentsList.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.nim}) - {st.kelompokName}
                    </option>
                  ))
                )}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* 8 Grid Metadata Identitas */}
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 size={24} className="animate-spin text-emerald-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="flex items-start gap-2.5">
              <User size={16} className="text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 text-[11px] block font-medium">Nama Mahasiswa</span>
                <span className="font-extrabold text-slate-900">{studentInfo?.nama || "-"}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CreditCard size={16} className="text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 text-[11px] block font-medium">NIM</span>
                <span className="font-extrabold text-slate-900">{studentInfo?.nim || "-"}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <GraduationCap size={16} className="text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 text-[11px] block font-medium">Program Studi</span>
                <span className="font-extrabold text-slate-900">{studentInfo?.programStudi || "-"}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Users size={16} className="text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 text-[11px] block font-medium">Kelompok</span>
                <span className="font-extrabold text-slate-900">{studentInfo?.kelompok || "-"}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 text-[11px] block font-medium">RW / Kelurahan</span>
                <span className="font-extrabold text-slate-900">{studentInfo?.rw || "-"} / Kel. {studentInfo?.kelurahan || "-"}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <UserCheck size={16} className="text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 text-[11px] block font-medium">Nama Mitra Penilai</span>
                <span className="font-extrabold text-slate-900">
                  {studentInfo?.namaMitraPenilai || scores.namaMitraPenilai || "-"}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <User size={16} className="text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 text-[11px] block font-medium">Dosen Pembimbing Lapangan</span>
                <span className="font-extrabold text-slate-900">{studentInfo?.dplNama || "-"}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Calendar size={16} className="text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 text-[11px] block font-medium">Periode KKN</span>
                <span className="font-extrabold text-slate-900">{studentInfo?.periodeKkn || "03 - 31 Agustus 2026"}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Row 3: 2 Side-by-Side Tables (Mitra 70% & DPL 30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TABEL KIRI: Form Penilaian Mitra / Lapangan (70%) */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <ClipboardList size={18} className="text-emerald-600" />
              <span>Form Penilaian Mitra / Lapangan</span>
            </h2>
            <div className="flex items-center gap-2">
              {!canEditMitra && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                  Read-Only
                </span>
              )}
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                Bobot: 70%
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <th className="py-3 px-3 text-center w-8">No</th>
                  <th className="py-3 px-3">Aspek</th>
                  <th className="py-3 px-3">Indikator Singkat</th>
                  <th className="py-3 px-2 text-center w-14">Bobot</th>
                  <th className="py-3 px-3 text-center">Skor (0–4)</th>
                  <th className="py-3 px-3 text-right w-20">Nilai Aspek</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {/* Baris 1: Kehadiran */}
                <tr className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-3 text-center font-bold text-slate-400">1</td>
                  <td className="py-3 px-3 font-bold text-slate-900">Kehadiran dan Kedisiplinan</td>
                  <td className="py-3 px-3 text-slate-500 text-[11px]">&ge; 80% kewajiban jam</td>
                  <td className="py-3 px-2 text-center font-bold text-slate-700">10%</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center justify-center gap-1.5">
                      {[0, 1, 2, 3, 4].map((num) => (
                        <button
                          key={num}
                          type="button"
                          disabled={!canEditMitra}
                          onClick={() => handleScoreChange("skorMitraKehadiran", num)}
                          className={`w-6 h-6 rounded-full text-xs font-black transition flex items-center justify-center ${
                            scores.skorMitraKehadiran === num
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:hover:bg-slate-100"
                          } ${canEditMitra ? "cursor-pointer active:scale-95" : "cursor-not-allowed opacity-75"}`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-black text-slate-900">
                    {nilaiAspekMitra.kehadiran.toFixed(2).replace(".", ",")}
                  </td>
                </tr>

                {/* Baris 2: Warga Binaan */}
                <tr className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-3 text-center font-bold text-slate-400">2</td>
                  <td className="py-3 px-3 font-bold text-slate-900">Warga Binaan</td>
                  <td className="py-3 px-3 text-slate-500 text-[11px]">minimal 6 rumah / warga aktif</td>
                  <td className="py-3 px-2 text-center font-bold text-slate-700">10%</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center justify-center gap-1.5">
                      {[0, 1, 2, 3, 4].map((num) => (
                        <button
                          key={num}
                          type="button"
                          disabled={!canEditMitra}
                          onClick={() => handleScoreChange("skorMitraWargaBinaan", num)}
                          className={`w-6 h-6 rounded-full text-xs font-black transition flex items-center justify-center ${
                            scores.skorMitraWargaBinaan === num
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:hover:bg-slate-100"
                          } ${canEditMitra ? "cursor-pointer active:scale-95" : "cursor-not-allowed opacity-75"}`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-black text-slate-900">
                    {nilaiAspekMitra.wargaBinaan.toFixed(2).replace(".", ",")}
                  </td>
                </tr>

                {/* Baris 3: Keterlibatan Program Kerja */}
                <tr className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-3 text-center font-bold text-slate-400">3</td>
                  <td className="py-3 px-3 font-bold text-slate-900">Keterlibatan Program Kerja</td>
                  <td className="py-3 px-3 text-slate-500 text-[11px]">minimal 1 program aktif</td>
                  <td className="py-3 px-2 text-center font-bold text-slate-700">10%</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center justify-center gap-1.5">
                      {[0, 1, 2, 3, 4].map((num) => (
                        <button
                          key={num}
                          type="button"
                          disabled={!canEditMitra}
                          onClick={() => handleScoreChange("skorMitraProker", num)}
                          className={`w-6 h-6 rounded-full text-xs font-black transition flex items-center justify-center ${
                            scores.skorMitraProker === num
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:hover:bg-slate-100"
                          } ${canEditMitra ? "cursor-pointer active:scale-95" : "cursor-not-allowed opacity-75"}`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-black text-slate-900">
                    {nilaiAspekMitra.proker.toFixed(2).replace(".", ",")}
                  </td>
                </tr>

                {/* Baris 4: Komunikasi & Etika */}
                <tr className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-3 text-center font-bold text-slate-400">4</td>
                  <td className="py-3 px-3 font-bold text-slate-900">Komunikasi & Etika</td>
                  <td className="py-3 px-3 text-slate-500 text-[11px]">baik dengan warga / mitra</td>
                  <td className="py-3 px-2 text-center font-bold text-slate-700">8%</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center justify-center gap-1.5">
                      {[0, 1, 2, 3, 4].map((num) => (
                        <button
                          key={num}
                          type="button"
                          disabled={!canEditMitra}
                          onClick={() => handleScoreChange("skorMitraKomunikasi", num)}
                          className={`w-6 h-6 rounded-full text-xs font-black transition flex items-center justify-center ${
                            scores.skorMitraKomunikasi === num
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:hover:bg-slate-100"
                          } ${canEditMitra ? "cursor-pointer active:scale-95" : "cursor-not-allowed opacity-75"}`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-black text-slate-900">
                    {nilaiAspekMitra.komunikasi.toFixed(2).replace(".", ",")}
                  </td>
                </tr>

                {/* Baris 5: Tanggung Jawab & Kerja Sama */}
                <tr className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-3 text-center font-bold text-slate-400">5</td>
                  <td className="py-3 px-3 font-bold text-slate-900">Tanggung Jawab & Kerja Sama</td>
                  <td className="py-3 px-3 text-slate-500 text-[11px]">aktif dan bertanggung jawab</td>
                  <td className="py-3 px-2 text-center font-bold text-slate-700">8%</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center justify-center gap-1.5">
                      {[0, 1, 2, 3, 4].map((num) => (
                        <button
                          key={num}
                          type="button"
                          disabled={!canEditMitra}
                          onClick={() => handleScoreChange("skorMitraTanggungJawab", num)}
                          className={`w-6 h-6 rounded-full text-xs font-black transition flex items-center justify-center ${
                            scores.skorMitraTanggungJawab === num
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:hover:bg-slate-100"
                          } ${canEditMitra ? "cursor-pointer active:scale-95" : "cursor-not-allowed opacity-75"}`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-black text-slate-900">
                    {nilaiAspekMitra.tanggungJawab.toFixed(2).replace(".", ",")}
                  </td>
                </tr>

                {/* Baris 6: Bukti Kegiatan */}
                <tr className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-3 text-center font-bold text-slate-400">6</td>
                  <td className="py-3 px-3 font-bold text-slate-900">Bukti Kegiatan</td>
                  <td className="py-3 px-3 text-slate-500 text-[11px]">valid dan terverifikasi</td>
                  <td className="py-3 px-2 text-center font-bold text-slate-700">7%</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center justify-center gap-1.5">
                      {[0, 1, 2, 3, 4].map((num) => (
                        <button
                          key={num}
                          type="button"
                          disabled={!canEditMitra}
                          onClick={() => handleScoreChange("skorMitraBuktiKegiatan", num)}
                          className={`w-6 h-6 rounded-full text-xs font-black transition flex items-center justify-center ${
                            scores.skorMitraBuktiKegiatan === num
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:hover:bg-slate-100"
                          } ${canEditMitra ? "cursor-pointer active:scale-95" : "cursor-not-allowed opacity-75"}`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-black text-slate-900">
                    {nilaiAspekMitra.buktiKegiatan.toFixed(2).replace(".", ",")}
                  </td>
                </tr>

                {/* Baris 7: Dampak kepada Masyarakat */}
                <tr className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-3 text-center font-bold text-slate-400">7</td>
                  <td className="py-3 px-3 font-bold text-slate-900">Dampak kepada Masyarakat</td>
                  <td className="py-3 px-3 text-slate-500 text-[11px]">ada perubahan / manfaat</td>
                  <td className="py-3 px-2 text-center font-bold text-slate-700">10%</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center justify-center gap-1.5">
                      {[0, 1, 2, 3, 4].map((num) => (
                        <button
                          key={num}
                          type="button"
                          disabled={!canEditMitra}
                          onClick={() => handleScoreChange("skorMitraDampak", num)}
                          className={`w-6 h-6 rounded-full text-xs font-black transition flex items-center justify-center ${
                            scores.skorMitraDampak === num
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:hover:bg-slate-100"
                          } ${canEditMitra ? "cursor-pointer active:scale-95" : "cursor-not-allowed opacity-75"}`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-black text-slate-900">
                    {nilaiAspekMitra.dampak.toFixed(2).replace(".", ",")}
                  </td>
                </tr>

                {/* Baris 8: Inisiatif & Problem Solving */}
                <tr className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-3 text-center font-bold text-slate-400">8</td>
                  <td className="py-3 px-3 font-bold text-slate-900">Inisiatif & Problem Solving</td>
                  <td className="py-3 px-3 text-slate-500 text-[11px]">aktif memberikan solusi</td>
                  <td className="py-3 px-2 text-center font-bold text-slate-700">7%</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center justify-center gap-1.5">
                      {[0, 1, 2, 3, 4].map((num) => (
                        <button
                          key={num}
                          type="button"
                          disabled={!canEditMitra}
                          onClick={() => handleScoreChange("skorMitraInisiatif", num)}
                          className={`w-6 h-6 rounded-full text-xs font-black transition flex items-center justify-center ${
                            scores.skorMitraInisiatif === num
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:hover:bg-slate-100"
                          } ${canEditMitra ? "cursor-pointer active:scale-95" : "cursor-not-allowed opacity-75"}`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-black text-slate-900">
                    {nilaiAspekMitra.inisiatif.toFixed(2).replace(".", ",")}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Subtotal Mitra Footer */}
          <div className="p-4 bg-slate-50/90 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="font-extrabold text-slate-600 uppercase">Subtotal Mitra (70%):</span>
            <span className="text-base font-black text-emerald-700">
              {subtotalMitra.toFixed(2).replace(".", ",")} / 70
            </span>
          </div>
        </div>

        {/* TABEL KANAN: Form Penilaian DPL (30%) */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <GraduationCap size={18} className="text-amber-600" />
              <span>Form Penilaian DPL</span>
            </h2>
            <div className="flex items-center gap-2">
              {!canEditDpl && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                  Read-Only
                </span>
              )}
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                Bobot: 30%
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <th className="py-3 px-3 text-center w-8">No</th>
                  <th className="py-3 px-3">Aspek</th>
                  <th className="py-3 px-2 text-center w-14">Bobot</th>
                  <th className="py-3 px-3 text-center">Skor (0–4)</th>
                  <th className="py-3 px-3 text-right w-20">Nilai Aspek</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {/* Baris 1: Perencanaan */}
                <tr className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-3 text-center font-bold text-slate-400">1</td>
                  <td className="py-3 px-3 font-bold text-slate-900">Perencanaan & Pemahaman Program</td>
                  <td className="py-3 px-2 text-center font-bold text-slate-700">5%</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center justify-center gap-1.5">
                      {[0, 1, 2, 3, 4].map((num) => (
                        <button
                          key={num}
                          type="button"
                          disabled={!canEditDpl}
                          onClick={() => handleScoreChange("skorDplPerencanaan", num)}
                          className={`w-6 h-6 rounded-full text-xs font-black transition flex items-center justify-center ${
                            scores.skorDplPerencanaan === num
                              ? "bg-amber-500 text-white shadow-xs"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:hover:bg-slate-100"
                          } ${canEditDpl ? "cursor-pointer active:scale-95" : "cursor-not-allowed opacity-75"}`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-black text-slate-900">
                    {nilaiAspekDpl.perencanaan.toFixed(2).replace(".", ",")}
                  </td>
                </tr>

                {/* Baris 2: Kontribusi Individu */}
                <tr className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-3 text-center font-bold text-slate-400">2</td>
                  <td className="py-3 px-3 font-bold text-slate-900">Kontribusi Individu</td>
                  <td className="py-3 px-2 text-center font-bold text-slate-700">5%</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center justify-center gap-1.5">
                      {[0, 1, 2, 3, 4].map((num) => (
                        <button
                          key={num}
                          type="button"
                          disabled={!canEditDpl}
                          onClick={() => handleScoreChange("skorDplKontribusi", num)}
                          className={`w-6 h-6 rounded-full text-xs font-black transition flex items-center justify-center ${
                            scores.skorDplKontribusi === num
                              ? "bg-amber-500 text-white shadow-xs"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:hover:bg-slate-100"
                          } ${canEditDpl ? "cursor-pointer active:scale-95" : "cursor-not-allowed opacity-75"}`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-black text-slate-900">
                    {nilaiAspekDpl.kontribusi.toFixed(2).replace(".", ",")}
                  </td>
                </tr>

                {/* Baris 3: Logbook */}
                <tr className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-3 text-center font-bold text-slate-400">3</td>
                  <td className="py-3 px-3 font-bold text-slate-900">Logbook & Dokumentasi Akademik</td>
                  <td className="py-3 px-2 text-center font-bold text-slate-700">5%</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center justify-center gap-1.5">
                      {[0, 1, 2, 3, 4].map((num) => (
                        <button
                          key={num}
                          type="button"
                          disabled={!canEditDpl}
                          onClick={() => handleScoreChange("skorDplLogbook", num)}
                          className={`w-6 h-6 rounded-full text-xs font-black transition flex items-center justify-center ${
                            scores.skorDplLogbook === num
                              ? "bg-amber-500 text-white shadow-xs"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:hover:bg-slate-100"
                          } ${canEditDpl ? "cursor-pointer active:scale-95" : "cursor-not-allowed opacity-75"}`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-black text-slate-900">
                    {nilaiAspekDpl.logbook.toFixed(2).replace(".", ",")}
                  </td>
                </tr>

                {/* Baris 4: Analisis Masalah & Solusi */}
                <tr className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-3 text-center font-bold text-slate-400">4</td>
                  <td className="py-3 px-3 font-bold text-slate-900">Analisis Masalah & Solusi</td>
                  <td className="py-3 px-2 text-center font-bold text-slate-700">5%</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center justify-center gap-1.5">
                      {[0, 1, 2, 3, 4].map((num) => (
                        <button
                          key={num}
                          type="button"
                          disabled={!canEditDpl}
                          onClick={() => handleScoreChange("skorDplAnalisis", num)}
                          className={`w-6 h-6 rounded-full text-xs font-black transition flex items-center justify-center ${
                            scores.skorDplAnalisis === num
                              ? "bg-amber-500 text-white shadow-xs"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:hover:bg-slate-100"
                          } ${canEditDpl ? "cursor-pointer active:scale-95" : "cursor-not-allowed opacity-75"}`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-black text-slate-900">
                    {nilaiAspekDpl.analisis.toFixed(2).replace(".", ",")}
                  </td>
                </tr>

                {/* Baris 5: Output, Outcome, & Dampak */}
                <tr className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-3 text-center font-bold text-slate-400">5</td>
                  <td className="py-3 px-3 font-bold text-slate-900">Output, Outcome, & Dampak</td>
                  <td className="py-3 px-2 text-center font-bold text-slate-700">5%</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center justify-center gap-1.5">
                      {[0, 1, 2, 3, 4].map((num) => (
                        <button
                          key={num}
                          type="button"
                          disabled={!canEditDpl}
                          onClick={() => handleScoreChange("skorDplOutput", num)}
                          className={`w-6 h-6 rounded-full text-xs font-black transition flex items-center justify-center ${
                            scores.skorDplOutput === num
                              ? "bg-amber-500 text-white shadow-xs"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:hover:bg-slate-100"
                          } ${canEditDpl ? "cursor-pointer active:scale-95" : "cursor-not-allowed opacity-75"}`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-black text-slate-900">
                    {nilaiAspekDpl.output.toFixed(2).replace(".", ",")}
                  </td>
                </tr>

                {/* Baris 6: Laporan Akhir */}
                <tr className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-3 text-center font-bold text-slate-400">6</td>
                  <td className="py-3 px-3 font-bold text-slate-900">Laporan Akhir, Evaluasi, & Refleksi</td>
                  <td className="py-3 px-2 text-center font-bold text-slate-700">5%</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center justify-center gap-1.5">
                      {[0, 1, 2, 3, 4].map((num) => (
                        <button
                          key={num}
                          type="button"
                          disabled={!canEditDpl}
                          onClick={() => handleScoreChange("skorDplLaporanAkhir", num)}
                          className={`w-6 h-6 rounded-full text-xs font-black transition flex items-center justify-center ${
                            scores.skorDplLaporanAkhir === num
                              ? "bg-amber-500 text-white shadow-xs"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:hover:bg-slate-100"
                          } ${canEditDpl ? "cursor-pointer active:scale-95" : "cursor-not-allowed opacity-75"}`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-black text-slate-900">
                    {nilaiAspekDpl.laporanAkhir.toFixed(2).replace(".", ",")}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Subtotal DPL Footer */}
          <div className="p-4 bg-slate-50/90 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="font-extrabold text-slate-600 uppercase">Subtotal DPL (30%):</span>
            <span className="text-base font-black text-amber-700">
              {subtotalDpl.toFixed(2).replace(".", ",")} / 30
            </span>
          </div>
        </div>
      </div>

      {/* Row 4: 4 Bottom Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Rumus Perhitungan */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Calculator size={15} className="text-emerald-600" />
            <span>Rumus Perhitungan</span>
          </h3>
          <div className="space-y-2 mt-3 text-xs">
            <div className="flex items-start gap-2 text-slate-700">
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
              <span className="font-semibold text-[11px]">Nilai Aspek = (Skor / 4) &times; Bobot</span>
            </div>
            <div className="flex items-start gap-2 text-slate-700">
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
              <span className="font-semibold text-[11px]">Komposisi akhir: Mitra 70% + DPL 30%</span>
            </div>
            <div className="flex items-start gap-2 text-slate-700">
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
              <span className="font-semibold text-[11px]">Nilai Akhir = Subtotal Mitra + Subtotal DPL</span>
            </div>
          </div>
        </div>

        {/* Card 2: Rekapitulasi Nilai (4 Mini Badges) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Rekapitulasi Nilai</h3>
          <div className="grid grid-cols-2 gap-2 mt-2 text-center">
            <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200/60">
              <span className="text-[10px] font-bold text-slate-400 block">Subtotal Mitra</span>
              <span className="text-base font-black text-emerald-700">{subtotalMitra.toFixed(2).replace(".", ",")}</span>
              <span className="text-[9px] text-slate-400 block">dari 70 (70%)</span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200/60">
              <span className="text-[10px] font-bold text-slate-400 block">Subtotal DPL</span>
              <span className="text-base font-black text-amber-600">{subtotalDpl.toFixed(2).replace(".", ",")}</span>
              <span className="text-[9px] text-slate-400 block">dari 30 (30%)</span>
            </div>

            <div className="bg-emerald-50/70 p-2.5 rounded-2xl border border-emerald-200/70">
              <span className="text-[10px] font-bold text-emerald-800 block">Nilai Akhir</span>
              <span className="text-base font-black text-emerald-800">{nilaiAkhir.toFixed(2).replace(".", ",")}</span>
              <span className="text-[9px] text-emerald-600 block">dari 100 (100%)</span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200/60 flex flex-col justify-center items-center">
              <span className="text-[10px] font-bold text-slate-400 block">Kategori</span>
              <span className={`px-2 py-0.5 rounded-lg text-xs font-black border mt-0.5 ${currentCategory.color}`}>
                {currentCategory.label}
              </span>
              <span className="text-[9px] text-slate-400 block mt-0.5">Skala Standar</span>
            </div>
          </div>
        </div>

        {/* Card 3: Kategori Penilaian */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Kategori Penilaian</h3>
          <div className="space-y-1.5 mt-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="font-semibold text-slate-600 text-[11px]">&ge; 85 &ndash; 100</span>
              </div>
              <span className="font-extrabold text-slate-900 text-[11px]">Sangat Baik</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
                <span className="font-semibold text-slate-600 text-[11px]">75 &ndash; 84,99</span>
              </div>
              <span className="font-extrabold text-slate-900 text-[11px]">Baik</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <span className="font-semibold text-slate-600 text-[11px]">65 &ndash; 74,99</span>
              </div>
              <span className="font-extrabold text-slate-900 text-[11px]">Cukup</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span>
                <span className="font-semibold text-slate-600 text-[11px]">55 &ndash; 64,99</span>
              </div>
              <span className="font-extrabold text-slate-900 text-[11px]">Kurang</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span className="font-semibold text-slate-600 text-[11px]">&lt; 55</span>
              </div>
              <span className="font-extrabold text-slate-900 text-[11px]">Sangat Kurang</span>
            </div>
          </div>
        </div>

        {/* Card 4: Catatan Evaluator */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquare size={15} className="text-emerald-600" />
            <span>Catatan Evaluator</span>
          </h3>

          <div className="space-y-2 flex-1">
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Catatan DPL:</label>
              <textarea
                rows={2}
                value={scores.catatanDpl}
                onChange={(e) => setScores((prev) => ({ ...prev, catatanDpl: e.target.value }))}
                placeholder="Catatan dari Dosen Pembimbing Lapangan..."
                disabled={!canEditDpl}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-700 font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition resize-none disabled:bg-slate-100 disabled:opacity-75"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Catatan Mitra / Lapangan:</label>
              <textarea
                rows={2}
                value={scores.catatanMitra}
                onChange={(e) => setScores((prev) => ({ ...prev, catatanMitra: e.target.value }))}
                placeholder="Catatan dari Mitra / Kelurahan / RW..."
                disabled={!canEditMitra}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-700 font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition resize-none disabled:bg-slate-100 disabled:opacity-75"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PenilaianKknMahasiswaPage;
