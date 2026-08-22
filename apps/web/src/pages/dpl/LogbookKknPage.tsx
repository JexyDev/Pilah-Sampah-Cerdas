/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Halaman Logbook KKN (Mahasiswa & DPL)
 * Menampilkan log aktivitas tabular dengan kolom: Nomor, Waktu, Tempat, Deskripsi kegiatan, Bukti/Foto.
 * Mendukung approval 2-tingkat (Ketua Kelompok -> DPL), toleransi backdate H-1,
 * dan kalkulasi kepatuhan prasyarat nilai akhir KKN.
 */

import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import {
  BookOpen,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  MapPin,
  Eye,
  Plus,
  Settings,
  Users,
  Award,
  Download,
  RefreshCw,
  X,
  ChevronRight,
  ShieldCheck,
  Building2,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  logbookApiService,
  type LogbookMahasiswaItem,
  type LogbookDplItem,
  type LogbookComplianceStats,
} from "../../services/logbookService";
import { dplService, type GroupSummary } from "../../services/dplService";

export const LogbookKknPage: React.FC = () => {
  const { user } = useAuthStore();
  const userRole = String(user?.peran || (user as any)?.role || "").toUpperCase();
  const isDpl = ["DPL", "DOSEN_PEMBIMBING"].includes(userRole);
  const isDeveloper = ["DEVELOPER", "SUPER_USER", "ADMIN_DLH"].includes(userRole);

  const [activeTab, setActiveTab] = useState<"mahasiswa" | "dpl" | "kepatuhan">("mahasiswa");
  const [loading, setLoading] = useState(true);

  // Data States
  const [logbooks, setLogbooks] = useState<LogbookMahasiswaItem[]>([]);
  const [dplLogbooks, setDplLogbooks] = useState<LogbookDplItem[]>([]);
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [complianceStats, setComplianceStats] = useState<LogbookComplianceStats | null>(null);
  const [toleranceDays, setToleranceDays] = useState<number>(1);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("ALL");
  const [selectedPekan, setSelectedPekan] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedTipe, setSelectedTipe] = useState<string>("ALL");

  // Batch Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>("");
  
  // Verification Modal
  const [selectedItemForVerif, setSelectedItemForVerif] = useState<LogbookMahasiswaItem | null>(null);
  const [verifAction, setVerifAction] = useState<"APPROVE" | "REVISI">("APPROVE");
  const [verifCatatan, setVerifCatatan] = useState("");
  const [isSubmittingVerif, setIsSubmittingVerif] = useState(false);

  // Ketua Approval Modal
  const [selectedItemForKetua, setSelectedItemForKetua] = useState<LogbookMahasiswaItem | null>(null);
  const [ketuaAction, setKetuaAction] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [ketuaCatatan, setKetuaCatatan] = useState("");
  const [isSubmittingKetua, setIsSubmittingKetua] = useState(false);

  // Create DPL Logbook Modal
  const [showDplLogbookModal, setShowDplLogbookModal] = useState(false);
  const [dplForm, setDplForm] = useState({
    kelompokId: "",
    tanggal: new Date().toISOString().split("T")[0],
    pekanKe: 1,
    tempat: "",
    deskripsi: "",
    arahanEvaluasi: "",
  });
  const [dplPhotoFile, setDplPhotoFile] = useState<File | null>(null);
  const [isSubmittingDplLog, setIsSubmittingDplLog] = useState(false);

  // Config Toleransi Modal
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configInputDays, setConfigInputDays] = useState<number>(1);
  const [isSubmittingConfig, setIsSubmittingConfig] = useState(false);

  // Load Data
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Ambil daftar kelompok
      const groupData = await dplService.getGroupSummary().catch(() => []);
      setGroups(groupData);

      // 2. Ambil logbook mahasiswa
      const mhsData = await logbookApiService.getMahasiswaLogbooks({
        groupId: selectedGroup !== "ALL" ? selectedGroup : undefined,
        pekanKe: selectedPekan !== "ALL" ? parseInt(selectedPekan, 10) : undefined,
        statusApproval: selectedStatus !== "ALL" ? selectedStatus : undefined,
        tipeAktivitas: selectedTipe !== "ALL" ? selectedTipe : undefined,
        search: searchQuery || undefined,
      });
      setLogbooks(mhsData);

      // 3. Ambil logbook DPL
      const dplData = await logbookApiService.getDplLogbooks(
        selectedGroup !== "ALL" ? selectedGroup : undefined
      );
      setDplLogbooks(dplData);

      // 4. Ambil kepatuhan untuk kelompok terpilih
      const targetGroupId = selectedGroup !== "ALL" ? selectedGroup : groupData[0]?.id;
      if (targetGroupId) {
        const stats = await logbookApiService.getComplianceScore(targetGroupId).catch(() => null);
        setComplianceStats(stats);
      }

      // 5. Ambil toleransi config
      const conf = await logbookApiService.getToleranceConfig().catch(() => ({ toleranceDays: 1 }));
      setToleranceDays(conf.toleranceDays);
      setConfigInputDays(conf.toleranceDays);
    } catch (err: any) {
      console.error("Error loading logbook data:", err);
      toast.error("Gagal memuat data logbook: " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedGroup, selectedPekan, selectedStatus, selectedTipe]);

  // Statistik Ringkas
  const stats = useMemo(() => {
    const total = logbooks.length;
    const pendingKetua = logbooks.filter((l) => l.statusApproval === "MENUNGGU_PERSETUJUAN_KETUA").length;
    const pendingDpl = logbooks.filter((l) => l.statusApproval === "MENUNGGU_VERIFIKASI_DPL").length;
    const approved = logbooks.filter((l) => l.statusApproval === "DISETUJUI_DPL").length;
    const revisi = logbooks.filter((l) => l.statusApproval === "PERLU_REVISI_DPL" || l.statusApproval === "DITOLAK_KETUA").length;
    return { total, pendingKetua, pendingDpl, approved, revisi };
  }, [logbooks]);

  // Handle Checkbox Selection
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllPendingDpl = () => {
    const pendingIds = logbooks
      .filter((l) => l.statusApproval === "MENUNGGU_VERIFIKASI_DPL")
      .map((l) => l.id);
    if (selectedIds.length === pendingIds.length && pendingIds.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingIds);
    }
  };

  // Submit DPL Verification (Single)
  const handleSaveVerifikasi = async () => {
    if (!selectedItemForVerif) return;
    setIsSubmittingVerif(true);
    try {
      await logbookApiService.verifikasiByDpl(
        selectedItemForVerif.id,
        verifAction,
        verifCatatan
      );
      toast.success(
        verifAction === "APPROVE"
          ? "Logbook aktivitas berhasil disetujui DPL."
          : "Logbook ditandai perlu revisi."
      );
      setSelectedItemForVerif(null);
      setVerifCatatan("");
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Gagal memproses verifikasi");
    } finally {
      setIsSubmittingVerif(false);
    }
  };

  // Batch Approve by DPL
  const handleBatchApprove = async () => {
    if (selectedIds.length === 0) {
      toast.error("Pilih setidaknya 1 logbook untuk diverifikasi");
      return;
    }
    if (!window.confirm(`Setujui sekaligus ${selectedIds.length} logbook yang dipilih?`)) return;

    setLoading(true);
    try {
      await logbookApiService.batchVerifikasiByDpl(selectedIds, "APPROVE");
      toast.success(`Berhasil menyetujui ${selectedIds.length} logbook secara serentak.`);
      setSelectedIds([]);
      fetchData();
    } catch (err: any) {
      toast.error("Gagal memproses batch approval: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Submit Ketua Approval
  const handleSaveKetuaApproval = async () => {
    if (!selectedItemForKetua) return;
    setIsSubmittingKetua(true);
    try {
      await logbookApiService.approveByKetua(
        selectedItemForKetua.id,
        ketuaAction,
        ketuaCatatan
      );
      toast.success(
        ketuaAction === "APPROVE"
          ? "Logbook disetujui Ketua Kelompok dan diteruskan ke DPL."
          : "Logbook ditolak oleh Ketua Kelompok."
      );
      setSelectedItemForKetua(null);
      setKetuaCatatan("");
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Gagal memproses approval ketua");
    } finally {
      setIsSubmittingKetua(false);
    }
  };

  // Submit Create DPL Logbook
  const handleSaveDplLogbook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dplForm.kelompokId) {
      toast.error("Pilih kelompok KKN");
      return;
    }
    if (!dplForm.tempat.trim() || !dplForm.deskripsi.trim()) {
      toast.error("Tempat dan deskripsi monitoring wajib diisi");
      return;
    }

    setIsSubmittingDplLog(true);
    try {
      const formData = new FormData();
      formData.append("kelompokId", dplForm.kelompokId);
      formData.append("tanggal", dplForm.tanggal);
      formData.append("pekanKe", String(dplForm.pekanKe));
      formData.append("tempat", dplForm.tempat.trim());
      formData.append("deskripsi", dplForm.deskripsi.trim());
      if (dplForm.arahanEvaluasi.trim()) {
        formData.append("arahanEvaluasi", dplForm.arahanEvaluasi.trim());
      }
      if (dplPhotoFile) {
        formData.append("file", dplPhotoFile);
      }

      await logbookApiService.createDplLogbook(formData);
      toast.success("Logbook monitoring mingguan DPL berhasil dicatat!");
      setShowDplLogbookModal(false);
      setDplForm({
        kelompokId: groups[0]?.id || "",
        tanggal: new Date().toISOString().split("T")[0],
        pekanKe: 1,
        tempat: "",
        deskripsi: "",
        arahanEvaluasi: "",
      });
      setDplPhotoFile(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Gagal menyimpan logbook DPL");
    } finally {
      setIsSubmittingDplLog(false);
    }
  };

  // Submit Update Toleransi (Developer)
  const handleSaveToleranceConfig = async () => {
    if (configInputDays < 0) {
      toast.error("Batas toleransi minimal 0 hari");
      return;
    }
    setIsSubmittingConfig(true);
    try {
      await logbookApiService.updateToleranceConfig(configInputDays);
      toast.success(`Toleransi berhasil diubah menjadi ${configInputDays} hari sebelumnya (H-${configInputDays}).`);
      setToleranceDays(configInputDays);
      setShowConfigModal(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Gagal mengubah toleransi");
    } finally {
      setIsSubmittingConfig(false);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    if (logbooks.length === 0) {
      toast.error("Tidak ada data logbook untuk diekspor");
      return;
    }
    const headers = ["No", "Tanggal", "Waktu", "Tempat", "Deskripsi Kegiatan", "Penulis", "NIM", "Kelompok", "Pekan Ke", "Status Approval", "Catatan Evaluasi"];
    const rows = logbooks.map((item, index) => [
      index + 1,
      item.tanggalKegiatan,
      item.waktuLengkap,
      `"${item.tempat.replace(/"/g, '""')}"`,
      `"${item.deskripsi.replace(/"/g, '""')}"`,
      `"${item.penulisNama}"`,
      item.penulisNim,
      `"${item.kelompokNama}"`,
      `Pekan ${item.pekanKe}`,
      item.statusApproval,
      `"${(item.catatanDpl || item.catatanKetua || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Logbook_KKN_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("File CSV Logbook berhasil diunduh.");
  };

  // Status Badge Helper
  const renderStatusBadge = (status: LogbookMahasiswaItem["statusApproval"]) => {
    switch (status) {
      case "DISETUJUI_DPL":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Terverifikasi DPL
          </span>
        );
      case "MENUNGGU_VERIFIKASI_DPL":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 animate-pulse">
            <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Menunggu DPL
          </span>
        );
      case "MENUNGGU_PERSETUJUAN_KETUA":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            Menunggu Ketua
          </span>
        );
      case "PERLU_REVISI_DPL":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
            <AlertTriangle className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
            Perlu Revisi DPL
          </span>
        );
      case "DITOLAK_KETUA":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            Ditolak Ketua
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Header Banner */}
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <BookOpen className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Logbook Aktivitas KKN</h1>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-3xl">
              Pencatatan aktivitas harian berbasis tabular, mekanisme persetujuan bertingkat (Ketua Kelompok & DPL),
              validasi batas waktu (H-{toleranceDays}), dan pemenuhan prasyarat nilai akhir KKN (bobot 20%).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {isDpl && (
              <button
                onClick={() => {
                  setDplForm((prev) => ({
                    ...prev,
                    kelompokId: selectedGroup !== "ALL" ? selectedGroup : groups[0]?.id || "",
                  }));
                  setShowDplLogbookModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                Catat Logbook DPL
              </button>
            )}

            {isDeveloper && (
              <button
                onClick={() => setShowConfigModal(true)}
                className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-medium transition-colors"
                title="Konfigurasi Batas Toleransi Hari (H-1)"
              >
                <Settings className="w-4 h-4" />
                Toleransi (H-{toleranceDays})
              </button>
            )}

            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              Ekspor CSV
            </button>

            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl text-slate-600 dark:text-slate-300 transition-colors"
              title="Muat Ulang"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Ringkasan Status Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Disubmit</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-800 dark:text-slate-100">{stats.total}</h3>
              <p className="text-xs text-slate-400 mt-0.5">Semua aktivitas kelompok</p>
            </div>
            <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/50 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Menunggu DPL</p>
              <h3 className="text-2xl font-bold mt-1 text-blue-700 dark:text-blue-300">{stats.pendingDpl}</h3>
              <p className="text-xs text-blue-500/80 mt-0.5">Siap diverifikasi & dinilai</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/60 rounded-xl text-blue-600 dark:text-blue-400">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-amber-100 dark:border-amber-900/50 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Menunggu Ketua</p>
              <h3 className="text-2xl font-bold mt-1 text-amber-700 dark:text-amber-300">{stats.pendingKetua}</h3>
              <p className="text-xs text-amber-500/80 mt-0.5">Persetujuan awal internal</p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/60 rounded-xl text-amber-600 dark:text-amber-400">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Terverifikasi DPL</p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-700 dark:text-emerald-300">{stats.approved}</h3>
              <p className="text-xs text-emerald-600/80 mt-0.5">Sah untuk nilai akhir KKN</p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-200 dark:border-slate-700 flex items-center gap-4">
          <button
            onClick={() => setActiveTab("mahasiswa")}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "mahasiswa"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Logbook Mahasiswa (Tabular)
            <span className="ml-1 px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 rounded-full">
              {logbooks.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("dpl")}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "dpl"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Logbook Monitoring DPL (Mingguan)
            <span className="ml-1 px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 rounded-full">
              {dplLogbooks.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("kepatuhan")}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "kepatuhan"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Award className="w-4 h-4" />
            Kepatuhan & Prasyarat Nilai KKN
          </button>
        </div>

        {/* TAB 1: LOGBOOK TABULAR MAHASISWA */}
        {activeTab === "mahasiswa" && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5 flex-1">
                {/* Search */}
                <div className="relative min-w-[220px] flex-1 max-w-sm">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && fetchData()}
                    placeholder="Cari tempat, nama, kegiatan..."
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* Filter Kelompok */}
                {groups.length > 0 && (
                  <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="ALL">Semua Kelompok</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.kelurahan || "-"})
                      </option>
                    ))}
                  </select>
                )}

                {/* Filter Pekan */}
                <select
                  value={selectedPekan}
                  onChange={(e) => setSelectedPekan(e.target.value)}
                  className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none"
                >
                  <option value="ALL">Semua Pekan</option>
                  <option value="1">Pekan 1</option>
                  <option value="2">Pekan 2</option>
                  <option value="3">Pekan 3</option>
                  <option value="4">Pekan 4</option>
                </select>

                {/* Filter Status */}
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="MENUNGGU_VERIFIKASI_DPL">Menunggu DPL</option>
                  <option value="MENUNGGU_PERSETUJUAN_KETUA">Menunggu Ketua</option>
                  <option value="DISETUJUI_DPL">Terverifikasi DPL</option>
                  <option value="PERLU_REVISI_DPL">Perlu Revisi DPL</option>
                  <option value="DITOLAK_KETUA">Ditolak Ketua</option>
                </select>

                {/* Filter Tipe Aktivitas */}
                <select
                  value={selectedTipe}
                  onChange={(e) => setSelectedTipe(e.target.value)}
                  className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none"
                >
                  <option value="ALL">Semua Tipe</option>
                  <option value="KELOMPOK">Aktivitas Kelompok</option>
                  <option value="INDIVIDU">Aktivitas Individu</option>
                </select>
              </div>

              {/* Batch Actions for DPL */}
              {isDpl && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSelectAllPendingDpl}
                    className="text-xs px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl font-medium transition-colors"
                  >
                    Pilih Semua Menunggu DPL
                  </button>
                  {selectedIds.length > 0 && (
                    <button
                      onClick={handleBatchApprove}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Setujui Terpilih ({selectedIds.length})
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* TABULAR LOGBOOK TABLE */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider">
                      {isDpl && (
                        <th className="p-3.5 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={
                              selectedIds.length > 0 &&
                              selectedIds.length ===
                                logbooks.filter((l) => l.statusApproval === "MENUNGGU_VERIFIKASI_DPL").length
                            }
                            onChange={handleSelectAllPendingDpl}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                        </th>
                      )}
                      <th className="p-3.5 w-12 text-center">No</th>
                      <th className="p-3.5 min-w-[140px]">Waktu & Pekan</th>
                      <th className="p-3.5 min-w-[160px]">Tempat</th>
                      <th className="p-3.5 min-w-[280px]">Deskripsi Kegiatan</th>
                      <th className="p-3.5 w-24 text-center">Bukti / Foto</th>
                      <th className="p-3.5 min-w-[160px]">Penulis & Kelompok</th>
                      <th className="p-3.5 min-w-[140px] text-center">Status</th>
                      <th className="p-3.5 w-28 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {loading ? (
                      <tr>
                        <td colSpan={isDpl ? 9 : 8} className="p-8 text-center text-slate-500">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
                            <span>Memuat data logbook tabular...</span>
                          </div>
                        </td>
                      </tr>
                    ) : logbooks.length === 0 ? (
                      <tr>
                        <td colSpan={isDpl ? 9 : 8} className="p-12 text-center text-slate-500">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                            <p className="font-semibold text-slate-700 dark:text-slate-300">Belum ada catatan logbook</p>
                            <p className="text-xs text-slate-400">
                              Mahasiswa wajib mengisi logbook mulai pekan pertama melalui aplikasi mobile.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      logbooks.map((item, idx) => {
                        const isPendingDpl = item.statusApproval === "MENUNGGU_VERIFIKASI_DPL";
                        const isPendingKetua = item.statusApproval === "MENUNGGU_PERSETUJUAN_KETUA";

                        return (
                          <tr
                            key={item.id}
                            className={`hover:bg-slate-50/60 dark:hover:bg-slate-750/50 transition-colors ${
                              selectedIds.includes(item.id) ? "bg-emerald-50/50 dark:bg-emerald-950/20" : ""
                            }`}
                          >
                            {isDpl && (
                              <td className="p-3.5 text-center">
                                {isPendingDpl ? (
                                  <input
                                    type="checkbox"
                                    checked={selectedIds.includes(item.id)}
                                    onChange={() => handleToggleSelect(item.id)}
                                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                  />
                                ) : (
                                  <span className="text-slate-300 dark:text-slate-600">-</span>
                                )}
                              </td>
                            )}

                            {/* 1. Nomor */}
                            <td className="p-3.5 text-center font-mono text-xs text-slate-500">
                              {idx + 1}
                            </td>

                            {/* 2. Waktu */}
                            <td className="p-3.5 align-top">
                              <div className="font-semibold text-slate-800 dark:text-slate-200">
                                {new Date(item.tanggalKegiatan).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </div>
                              <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {item.waktuLengkap}
                              </div>
                              <span className="inline-block mt-1 px-1.5 py-0.5 text-[10px] font-bold bg-slate-100 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300">
                                Pekan {item.pekanKe}
                              </span>
                            </td>

                            {/* 3. Tempat */}
                            <td className="p-3.5 align-top">
                              <div className="font-medium text-slate-800 dark:text-slate-200 flex items-start gap-1">
                                <MapPin className="w-3.5 h-3.5 text-rose-500 mt-0.5 flex-shrink-0" />
                                <span>{item.tempat}</span>
                              </div>
                              {item.fasilitasNama && (
                                <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                                  <Building2 className="w-3 h-3" />
                                  <span>{item.fasilitasNama}</span>
                                </div>
                              )}
                            </td>

                            {/* 4. Deskripsi Kegiatan */}
                            <td className="p-3.5 align-top">
                              <p className="text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-3">
                                {item.deskripsi}
                              </p>
                              {item.programKerjaDeskripsi && (
                                <div className="mt-1.5 p-1.5 bg-slate-100 dark:bg-slate-700/60 rounded text-xs text-slate-600 dark:text-slate-300 border-l-2 border-emerald-500">
                                  <span className="font-semibold">Proker: </span>
                                  {item.programKerjaDeskripsi.slice(0, 60)}...
                                </div>
                              )}
                              {item.catatanDpl && (
                                <div className="mt-1.5 p-1.5 bg-blue-50 dark:bg-blue-950/40 rounded text-xs text-blue-700 dark:text-blue-300 border-l-2 border-blue-500">
                                  <span className="font-semibold">Evaluasi DPL: </span>
                                  {item.catatanDpl}
                                </div>
                              )}
                              {item.catatanKetua && item.statusApproval === "DITOLAK_KETUA" && (
                                <div className="mt-1.5 p-1.5 bg-rose-50 dark:bg-rose-950/40 rounded text-xs text-rose-700 dark:text-rose-300 border-l-2 border-rose-500">
                                  <span className="font-semibold">Catatan Ketua: </span>
                                  {item.catatanKetua}
                                </div>
                              )}
                            </td>

                            {/* 5. Bukti / Foto */}
                            <td className="p-3.5 text-center align-top">
                              {item.fotoBuktiUrl ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPreviewPhotoUrl(item.fotoBuktiUrl);
                                    setPreviewTitle(`Bukti Kegiatan: ${item.tempat} (${item.tanggalKegiatan})`);
                                  }}
                                  className="group relative inline-block rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:ring-2 hover:ring-emerald-500 transition-all"
                                >
                                  <img
                                    src={item.fotoBuktiUrl}
                                    alt="Bukti"
                                    className="w-16 h-16 object-cover"
                                    onError={(e) => {
                                      (e.target as any).src = "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=150";
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                    <Eye className="w-4 h-4" />
                                  </div>
                                </button>
                              ) : (
                                <span className="text-xs text-slate-400">Tidak ada</span>
                              )}
                            </td>

                            {/* 6. Penulis & Kelompok */}
                            <td className="p-3.5 align-top">
                              <div className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <span>{item.penulisNama}</span>
                                {item.isKetua && (
                                  <span className="px-1.5 py-0.2 text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 rounded">
                                    Ketua
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-400 font-mono">NIM: {item.penulisNim}</div>
                              <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                                {item.kelompokNama}
                              </div>
                            </td>

                            {/* 7. Status */}
                            <td className="p-3.5 text-center align-top">
                              {renderStatusBadge(item.statusApproval)}
                            </td>

                            {/* 8. Aksi */}
                            <td className="p-3.5 text-center align-top space-y-1">
                              {isDpl && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedItemForVerif(item);
                                    setVerifAction(isPendingDpl ? "APPROVE" : "REVISI");
                                    setVerifCatatan(item.catatanDpl || "");
                                  }}
                                  className="w-full px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  Verifikasi DPL
                                </button>
                              )}

                              {/* Tombol Approval Ketua jika relevan */}
                              {isPendingKetua && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedItemForKetua(item);
                                    setKetuaAction("APPROVE");
                                    setKetuaCatatan("");
                                  }}
                                  className="w-full px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
                                >
                                  <Users className="w-3 h-3" />
                                  Persetujuan Ketua
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setPreviewPhotoUrl(item.fotoBuktiUrl);
                                  setPreviewTitle(`Detail Kegiatan - ${item.tempat}`);
                                }}
                                className="w-full px-2.5 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition-colors"
                              >
                                Detail
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LOGBOOK MONITORING DPL (MINGGUAN) */}
        {activeTab === "dpl" && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100">Riwayat Monitoring Lapangan DPL</h3>
                <p className="text-xs text-slate-500">
                  Dosen Pembimbing Lapangan diwajibkan mencatat evaluasi monitoring minimal 1x setiap pekannya.
                </p>
              </div>
              {isDpl && (
                <button
                  onClick={() => setShowDplLogbookModal(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Logbook Monitoring
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dplLogbooks.length === 0 ? (
                <div className="col-span-full p-12 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-500">
                  <ShieldCheck className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="font-semibold text-slate-700 dark:text-slate-300">Belum ada catatan monitoring DPL</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Silakan klik tombol "Tambah Logbook Monitoring" untuk mencatat evaluasi mingguan.
                  </p>
                </div>
              ) : (
                dplLogbooks.map((log) => (
                  <div
                    key={log.id}
                    className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 text-xs font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-800">
                          Pekan {log.pekanKe}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {new Date(log.tanggal).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-rose-500" />
                        {log.tempat}
                      </h4>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        {log.kelompokNama} ({log.kelurahan})
                      </p>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl">
                        {log.deskripsi}
                      </p>

                      {log.arahanEvaluasi && (
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/50">
                          <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Arahan & Tindak Lanjut:</p>
                          <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">{log.arahanEvaluasi}</p>
                        </div>
                      )}
                    </div>

                    {log.fotoBuktiUrl && (
                      <button
                        onClick={() => {
                          setPreviewPhotoUrl(log.fotoBuktiUrl || "");
                          setPreviewTitle(`Monitoring DPL - Pekan ${log.pekanKe} (${log.kelompokNama})`);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Lihat Foto Dokumentasi
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: KEPATUHAN & PRASYARAT NILAI AKHIR */}
        {activeTab === "kepatuhan" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Award className="w-5 h-5 text-emerald-600" />
                    Kalkulasi Kepatuhan Logbook & Prasyarat Nilai KKN
                  </h3>
                  <p className="text-sm text-slate-500">
                    Logbook memiliki bobot 20% dalam penilaian akademik DPL. Standar minimal kelulusan logbook: 24 aktivitas terverifikasi DPL.
                  </p>
                </div>

                {groups.length > 0 && (
                  <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className="px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none font-medium"
                  >
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.kelurahan || "-"})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {complianceStats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="p-5 bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tingkat Kepatuhan</p>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                        {complianceStats.complianceRate}%
                      </span>
                      <span className="text-xs text-slate-400">({complianceStats.approvedCount} / {complianceStats.targetCount} aktivitas)</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full mt-3 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, complianceStats.complianceRate)}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-5 bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status Prasyarat Nilai</p>
                    <div className="mt-2">
                      {complianceStats.isTargetMet ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          <CheckCircle className="w-4 h-4" />
                          Prasyarat Terpenuhi (Lolos)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          <AlertTriangle className="w-4 h-4" />
                          Belum Mencapai Target (Kurang {complianceStats.targetCount - complianceStats.approvedCount})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      Nilai otomatis terintegrasi ke modul penilaian DPL.
                    </p>
                  </div>

                  <div className="p-5 bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Aksi Penilaian</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Kunjungi halaman Penilaian KKN untuk melihat rekapitulasi nilai akhir (Mitra 70% + DPL 30%).
                    </p>
                    <Link
                      to="/dpl"
                      className="inline-flex items-center gap-1.5 px-4 py-2 mt-3 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition-colors"
                    >
                      Buka Portal DPL
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}

              {/* Breakdown Per Pekan */}
              {complianceStats?.pekanBreakdown && (
                <div className="pt-4 space-y-3">
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                    Breakdown Aktivitas per Pekan
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map((pekan) => {
                      const data = complianceStats.pekanBreakdown[pekan] || { total: 0, approved: 0 };
                      return (
                        <div
                          key={pekan}
                          className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 text-center"
                        >
                          <p className="text-xs font-semibold text-slate-500">Pekan {pekan}</p>
                          <p className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1">
                            {data.approved} <span className="text-xs font-normal text-slate-400">/ {data.total}</span>
                          </p>
                          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                            {data.total > 0 ? `${Math.round((data.approved / data.total) * 100)}% approved` : "Belum ada log"}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL: PREVIEW FOTO LIGHTBOX */}
      {previewPhotoUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate pr-4">
                {previewTitle || "Foto Dokumentasi Bukti Kegiatan"}
              </h3>
              <button
                onClick={() => setPreviewPhotoUrl(null)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-slate-950 flex items-center justify-center max-h-[75vh] overflow-auto">
              <img
                src={previewPhotoUrl}
                alt="Preview Bukti"
                className="max-h-[70vh] w-auto object-contain rounded-lg shadow-lg"
              />
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900 text-center text-xs text-slate-500">
              Diambil langsung melalui kamera mobile mahasiswa sebagai bukti autentik kegiatan.
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VERIFIKASI DPL */}
      {selectedItemForVerif && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                Verifikasi Logbook oleh DPL
              </h3>
              <button
                onClick={() => setSelectedItemForVerif(null)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-1.5 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <p><span className="font-semibold">Penulis:</span> {selectedItemForVerif.penulisNama} ({selectedItemForVerif.penulisNim})</p>
              <p><span className="font-semibold">Kelompok:</span> {selectedItemForVerif.kelompokNama}</p>
              <p><span className="font-semibold">Waktu & Tempat:</span> {selectedItemForVerif.tanggalKegiatan} ({selectedItemForVerif.waktuLengkap}) @ {selectedItemForVerif.tempat}</p>
              <p><span className="font-semibold">Deskripsi:</span> {selectedItemForVerif.deskripsi}</p>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Keputusan Verifikasi DPL
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setVerifAction("APPROVE")}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    verifAction === "APPROVE"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                      : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600"
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  Setujui Logbook
                </button>
                <button
                  type="button"
                  onClick={() => setVerifAction("REVISI")}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    verifAction === "REVISI"
                      ? "border-orange-600 bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 ring-2 ring-orange-500/20"
                      : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600"
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  Minta Revisi
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Catatan Evaluasi / Arahan DPL (Opsional)
                </label>
                <textarea
                  rows={3}
                  value={verifCatatan}
                  onChange={(e) => setVerifCatatan(e.target.value)}
                  placeholder="Berikan feedback atau poin yang perlu disempurnakan..."
                  className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedItemForVerif(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSubmittingVerif}
                onClick={handleSaveVerifikasi}
                className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
              >
                {isSubmittingVerif && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Simpan Keputusan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PERSETUJUAN KETUA KELOMPOK */}
      {selectedItemForKetua && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-600" />
                Persetujuan Logbook oleh Ketua Kelompok
              </h3>
              <button
                onClick={() => setSelectedItemForKetua(null)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-1 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <p><span className="font-semibold">Anggota:</span> {selectedItemForKetua.penulisNama}</p>
              <p><span className="font-semibold">Aktivitas:</span> {selectedItemForKetua.deskripsi}</p>
              <p><span className="font-semibold">Tempat:</span> {selectedItemForKetua.tempat}</p>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setKetuaAction("APPROVE")}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    ketuaAction === "APPROVE"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                      : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  Setujui & Teruskan ke DPL
                </button>
                <button
                  type="button"
                  onClick={() => setKetuaAction("REJECT")}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    ketuaAction === "REJECT"
                      ? "border-rose-600 bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 ring-2 ring-rose-500/20"
                      : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  Tolak Logbook
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Catatan Ketua Kelompok
                </label>
                <textarea
                  rows={2}
                  value={ketuaCatatan}
                  onChange={(e) => setKetuaCatatan(e.target.value)}
                  placeholder="Catatan untuk anggota kelompok..."
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedItemForKetua(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSubmittingKetua}
                onClick={handleSaveKetuaApproval}
                className="px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-sm"
              >
                {isSubmittingKetua && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Konfirmasi Persetujuan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH LOGBOOK MONITORING DPL */}
      {showDplLogbookModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Catat Logbook Monitoring DPL
              </h3>
              <button
                onClick={() => setShowDplLogbookModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDplLogbook} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Kelompok KKN Bimbingan *
                </label>
                <select
                  required
                  value={dplForm.kelompokId}
                  onChange={(e) => setDplForm({ ...dplForm, kelompokId: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                >
                  <option value="">-- Pilih Kelompok --</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.kelurahan || "-"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Tanggal Monitoring *
                  </label>
                  <input
                    type="date"
                    required
                    value={dplForm.tanggal}
                    onChange={(e) => setDplForm({ ...dplForm, tanggal: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Pekan Ke- (1 s.d 4) *
                  </label>
                  <select
                    value={dplForm.pekanKe}
                    onChange={(e) => setDplForm({ ...dplForm, pekanKe: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                  >
                    <option value={1}>Pekan 1</option>
                    <option value={2}>Pekan 2</option>
                    <option value={3}>Pekan 3</option>
                    <option value={4}>Pekan 4</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Tempat Monitoring Lapangan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Posko KKN RW 05 / Rumah Maggot Kelurahan"
                  value={dplForm.tempat}
                  onChange={(e) => setDplForm({ ...dplForm, tempat: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Deskripsi Kegiatan Monitoring *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Aktivitas supervisi, kendala lapangan yang ditemukan, progres proker..."
                  value={dplForm.deskripsi}
                  onChange={(e) => setDplForm({ ...dplForm, deskripsi: e.target.value })}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Arahan / Tindak Lanjut untuk Mahasiswa (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Instruksi perbaikan atau target pekan berikutnya..."
                  value={dplForm.arahanEvaluasi}
                  onChange={(e) => setDplForm({ ...dplForm, arahanEvaluasi: e.target.value })}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Foto Bukti Supervisi (Opsional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setDplPhotoFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowDplLogbookModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDplLog}
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm flex items-center gap-1.5"
                >
                  {isSubmittingDplLog && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Simpan Logbook DPL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: KONFIGURASI TOLERANSI BACKDATE (DEVELOPER) */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Settings className="w-5 h-5 text-slate-600" />
                Konfigurasi Toleransi Pengisian (Developer)
              </h3>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Batas toleransi menentukan berapa hari sebelumnya (H-x) mahasiswa dapat menginput tanggal kegiatan logbook.
              Default: 1 hari sebelumnya (H-1).
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Batas Hari Toleransi (Hari)
              </label>
              <input
                type="number"
                min={0}
                max={30}
                value={configInputDays}
                onChange={(e) => setConfigInputDays(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Jika diisi 1: Mahasiswa hanya boleh mengisi untuk hari ini dan H-1.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSubmittingConfig}
                onClick={handleSaveToleranceConfig}
                className="px-4 py-2 text-xs font-bold bg-slate-900 dark:bg-slate-700 text-white rounded-xl"
              >
                {isSubmittingConfig && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Simpan Konfigurasi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
