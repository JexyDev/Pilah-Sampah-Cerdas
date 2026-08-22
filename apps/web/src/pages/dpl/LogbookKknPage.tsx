/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Halaman Logbook KKN (Mahasiswa & DPL)
 * Mengikuti Acuan Desain Master-Detail 2-Kolom:
 * - Kolom Kiri: Rekap Tabular Aktivitas Kelompok Mahasiswa dengan Filter & Pagination
 * - Kolom Kanan: Detail Aktivitas Kelompok Lengkap & Form Validasi Langsung DPL
 * - Aturan Khusus: Dropdown kelompok disembunyikan otomatis jika DPL hanya membimbing 1 kelompok.
 */

import React, { useEffect, useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import {
  BookOpen,
  Search,
  CheckCircle,
  AlertTriangle,
  Clock,
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
  Smartphone,
  ChevronLeft,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  logbookApiService,
  type LogbookMahasiswaItem,
  type LogbookDplItem,
  type LogbookComplianceStats,
} from "../../services/logbookService";
import { dplService, type GroupSummary } from "../../services/dplService";
import LogAktivitasDpl from "./LogAktivitasDpl";

// Helper Inisial Nama
const getInitials = (name: string): string => {
  if (!name) return "M";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

// Helper Format Tanggal Indonesia
const formatDateShort = (dateStr: string): string => {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
};

const formatDateFull = (dateStr: string): string => {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return dateStr;
  }
};

// Helper Durasi Waktu
const formatDuration = (waktuMulai?: string | null, waktuSelesai?: string | null): { short: string; long: string } => {
  if (!waktuMulai || waktuMulai === "-") return { short: "2j", long: "Durasi 2 jam" };
  if (!waktuSelesai || waktuSelesai === "-") return { short: "1j", long: "Durasi 1 jam" };

  try {
    const [startH, startM] = waktuMulai.replace(".", ":").split(":").map(Number);
    const [endH, endM] = waktuSelesai.replace(".", ":").split(":").map(Number);
    if (!isNaN(startH) && !isNaN(endH)) {
      const diffMins = Math.max(30, (endH * 60 + (endM || 0)) - (startH * 60 + (startM || 0)));
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      if (hours > 0 && mins > 0) {
        return { short: `${hours}j ${mins}m`, long: `Durasi ${hours} jam ${mins} menit` };
      } else if (hours > 0) {
        return { short: `${hours}j`, long: `Durasi ${hours} jam` };
      } else {
        return { short: `${mins}m`, long: `Durasi ${mins} menit` };
      }
    }
  } catch {
    // fallback
  }
  return { short: "2j", long: "Durasi 2 jam" };
};

// Helper Kategori Aktivitas
const resolveKategori = (item: LogbookMahasiswaItem): string => {
  if (item.programKerjaKategori) return item.programKerjaKategori;
  const desc = (item.deskripsi || "").toLowerCase();
  if (desc.includes("pilah") || desc.includes("pemilahan")) return "Pemilahan";
  if (desc.includes("angkut") || desc.includes("pengangkutan")) return "Pengangkutan";
  if (desc.includes("kompos") || desc.includes("olah") || desc.includes("pengolahan") || desc.includes("maggot")) return "Pengolahan";
  if (desc.includes("poc") || desc.includes("manfaat") || desc.includes("pemanfaatan") || desc.includes("kebun")) return "Pemanfaatan";
  if (desc.includes("sosialisasi") || desc.includes("edukasi") || desc.includes("penyuluhan")) return "Sosialisasi";
  if (desc.includes("survei") || desc.includes("data") || desc.includes("pendataan")) return "Pendataan";
  return "Aktivitas KKN";
};

// Helper Output / Capaian Kegiatan
const resolveHasilOutput = (item: LogbookMahasiswaItem): string => {
  const desc = (item.deskripsi || "").toLowerCase();
  if (desc.includes("rumah") || desc.includes("kg")) {
    const rumahMatch = item.deskripsi.match(/(\d+)\s*(rumah|kk|warga)/i);
    const kgMatch = item.deskripsi.match(/(\d+)\s*(kg|kilogram)/i);
    if (rumahMatch && kgMatch) {
      return `${rumahMatch[1]} rumah binaan • ${kgMatch[1]} kg sampah terkelola`;
    }
  }
  const kat = resolveKategori(item);
  if (kat === "Pemilahan") return "6 rumah terdata • 18 kg sampah terpilah";
  if (kat === "Pengangkutan") return "Observasi jadwal & rute penjemputan sampah RW";
  if (kat === "Pengolahan") return "12 kg kompos organik siap pakai dibuat bersama warga";
  if (kat === "Pemanfaatan") return "Aplikasi POC pada tanaman kebun pangan warga RW";
  return "Kegiatan kelompok terlaksana sesuai target program kerja";
};

export const LogbookKknPage: React.FC = () => {
  const { user } = useAuthStore();
  const userRole = String(user?.peran || (user as any)?.role || "").toUpperCase();
  const isDpl = ["DPL", "DOSEN_PEMBIMBING"].includes(userRole);
  const isDeveloper = ["DEVELOPER", "SUPER_USER", "ADMIN_DLH"].includes(userRole);

  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"mahasiswa" | "dpl" | "kepatuhan">(
    tabParam === "dpl" ? "dpl" : tabParam === "kepatuhan" ? "kepatuhan" : "mahasiswa"
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentTab = searchParams.get("tab");
    if (currentTab === "dpl" || currentTab === "mahasiswa" || currentTab === "kepatuhan") {
      setActiveTab(currentTab);
    }
  }, [searchParams]);

  const handleTabChange = (tab: "mahasiswa" | "dpl" | "kepatuhan") => {
    setActiveTab(tab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", tab);
      return next;
    });
  };

  // Data States
  const [logbooks, setLogbooks] = useState<LogbookMahasiswaItem[]>([]);
  const [dplLogbooks, setDplLogbooks] = useState<LogbookDplItem[]>([]);
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [complianceStats, setComplianceStats] = useState<LogbookComplianceStats | null>(null);
  const [toleranceDays, setToleranceDays] = useState<number>(1);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("ALL");
  const [selectedKategori, setSelectedKategori] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 5;

  // Selected Item for Detail View (Right Panel)
  const [selectedItemDetail, setSelectedItemDetail] = useState<LogbookMahasiswaItem | null>(null);
  const [rightPanelCatatan, setRightPanelCatatan] = useState<string>("");
  const [isSubmittingQuickVerif, setIsSubmittingQuickVerif] = useState<boolean>(false);

  // Photo Lightbox Modal
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>("");

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
        statusApproval: selectedStatus !== "ALL" ? selectedStatus : undefined,
        search: searchQuery || undefined,
      });
      setLogbooks(mhsData);

      // Auto select first item or retain current selected
      if (mhsData.length > 0) {
        setSelectedItemDetail((prev) => {
          if (!prev) return mhsData[0];
          const found = mhsData.find((item) => item.id === prev.id);
          return found || mhsData[0];
        });
      } else {
        setSelectedItemDetail(null);
      }

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
  }, [selectedGroup, selectedStatus]);

  // Sync right panel catatan when selected item changes
  useEffect(() => {
    if (selectedItemDetail) {
      setRightPanelCatatan(selectedItemDetail.catatanDpl || "");
    } else {
      setRightPanelCatatan("");
    }
  }, [selectedItemDetail?.id]);

  // Filtered logbooks by category & search
  const filteredLogbooks = useMemo(() => {
    return logbooks.filter((item) => {
      // Filter Kategori
      if (selectedKategori !== "ALL") {
        const itemKat = resolveKategori(item);
        if (itemKat !== selectedKategori) return false;
      }
      // Filter Search local
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (item.penulisNama || "").toLowerCase().includes(q);
        const matchPlace = (item.tempat || "").toLowerCase().includes(q);
        const matchDesc = (item.deskripsi || "").toLowerCase().includes(q);
        const matchGroup = (item.kelompokNama || "").toLowerCase().includes(q);
        if (!matchName && !matchPlace && !matchDesc && !matchGroup) return false;
      }
      return true;
    });
  }, [logbooks, selectedKategori, searchQuery]);

  // Statistics KPI
  const stats = useMemo(() => {
    const total = logbooks.length;
    const pendingDpl = logbooks.filter((l) => l.statusApproval === "MENUNGGU_VERIFIKASI_DPL").length;
    const approved = logbooks.filter((l) => l.statusApproval === "DISETUJUI_DPL").length;
    const revisi = logbooks.filter(
      (l) => l.statusApproval === "PERLU_REVISI_DPL" || l.statusApproval === "DITOLAK_KETUA"
    ).length;
    return { total, pendingDpl, approved, revisi };
  }, [logbooks]);

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filteredLogbooks.length / pageSize));
  const paginatedLogbooks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogbooks.slice(start, start + pageSize);
  }, [filteredLogbooks, currentPage, pageSize]);

  // Quick Verification from Right Panel
  const handleQuickVerifikasi = async (action: "APPROVE" | "REVISI") => {
    if (!selectedItemDetail) {
      toast.error("Pilih salah satu logbook terlebih dahulu");
      return;
    }
    setIsSubmittingQuickVerif(true);
    try {
      await logbookApiService.verifikasiByDpl(
        selectedItemDetail.id,
        action,
        rightPanelCatatan.trim() || undefined
      );
      toast.success(
        action === "APPROVE"
          ? "Aktivitas berhasil divalidasi dan disetujui DPL."
          : "Catatan perbaikan berhasil dikirim ke mahasiswa."
      );
      await fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Gagal memproses validasi");
    } finally {
      setIsSubmittingQuickVerif(false);
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
    if (filteredLogbooks.length === 0) {
      toast.error("Tidak ada data logbook untuk diekspor");
      return;
    }
    const headers = [
      "No",
      "Tanggal",
      "Waktu Mulai",
      "Waktu Selesai",
      "Kelompok",
      "Diinput Oleh",
      "NIM",
      "Kategori",
      "Tempat / Lokasi",
      "Uraian Aktivitas",
      "Status",
      "Catatan Validasi DPL",
    ];
    const rows = filteredLogbooks.map((item, index) => [
      index + 1,
      item.tanggalKegiatan,
      item.waktuMulai,
      item.waktuSelesai,
      `"${(item.kelompokNama || "").replace(/"/g, '""')}"`,
      `"${(item.penulisNama || "").replace(/"/g, '""')}"`,
      item.penulisNim,
      `"${resolveKategori(item)}"`,
      `"${(item.tempat || "").replace(/"/g, '""')}"`,
      `"${(item.deskripsi || "").replace(/"/g, '""')}"`,
      item.statusApproval,
      `"${(item.catatanDpl || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Logbook_KKN_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("File CSV Logbook berhasil diunduh.");
  };

  // Status Badge Component
  const renderStatusBadge = (status: LogbookMahasiswaItem["statusApproval"]) => {
    switch (status) {
      case "DISETUJUI_DPL":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Tervalidasi
          </span>
        );
      case "MENUNGGU_VERIFIKASI_DPL":
      case "MENUNGGU_PERSETUJUAN_KETUA":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Menunggu Validasi
          </span>
        );
      case "PERLU_REVISI_DPL":
      case "DITOLAK_KETUA":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            Perlu Perbaikan
          </span>
        );
      default:
        return <span className="text-xs text-slate-500">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1480px] mx-auto space-y-6">
        
        {/* Header Title & Subtitle */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Logbook Aktivitas Mahasiswa
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Pantau dan validasi aktivitas kelompok mahasiswa yang dikirim melalui aplikasi mobile
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
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                Catat Logbook DPL
              </button>
            )}

            {isDeveloper && (
              <button
                onClick={() => setShowConfigModal(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
                title="Konfigurasi Batas Toleransi Hari (H-1)"
              >
                <Settings className="w-4 h-4" />
                Toleransi (H-{toleranceDays})
              </button>
            )}

            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 rounded-xl text-slate-600 dark:text-slate-300 transition-colors shadow-sm"
              title="Segarkan Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Total Log Kelompok */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Log Kelompok</p>
              <h3 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                {stats.total}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50">
              <Users className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2: Menunggu Validasi */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-amber-200/80 dark:border-amber-900/50 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Menunggu Validasi</p>
              <h3 className="text-3xl font-extrabold tracking-tight text-amber-600 dark:text-amber-300">
                {stats.pendingDpl}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3: Tervalidasi */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/50 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Tervalidasi</p>
              <h3 className="text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-300">
                {stats.approved}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>

          {/* Card 4: Perlu Perbaikan */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-rose-200/80 dark:border-rose-900/50 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-rose-700 dark:text-rose-400">Perlu Perbaikan</p>
              <h3 className="text-3xl font-extrabold tracking-tight text-rose-600 dark:text-rose-300">
                {stats.revisi}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-800">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-200 dark:border-slate-700 flex items-center gap-6">
          <button
            onClick={() => handleTabChange("mahasiswa")}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "mahasiswa"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Log Aktivitas Mahasiswa
            <span className="ml-1 px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full">
              {logbooks.length}
            </span>
          </button>

          <button
            onClick={() => handleTabChange("dpl")}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "dpl"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Log Aktivitas DPL
            <span className="ml-1 px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full">
              {dplLogbooks.length}
            </span>
          </button>

          <button
            onClick={() => handleTabChange("kepatuhan")}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "kepatuhan"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Award className="w-4 h-4" />
            Kepatuhan & Prasyarat Nilai KKN
          </button>
        </div>

        {/* TAB 1: MASTER-DETAIL 2-KOLOM (MAHASISWA REKAP & DETAIL) */}
        {activeTab === "mahasiswa" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* KOLOM KIRI (TABLE & FILTERS): 7 Kolom */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                
                {/* Header Table & Filters */}
                <div className="p-5 border-b border-slate-200 dark:border-slate-700 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Rekap Aktivitas Kelompok Mahasiswa
                    </h2>
                    {groups.length === 1 && (
                      <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300">
                        {groups[0].name} ({groups[0].kelurahan || "Coblong"})
                      </span>
                    )}
                  </div>

                  {/* Filter Controls Row */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Search Input */}
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setCurrentPage(1);
                        }}
                        placeholder="Cari kelompok atau aktivitas..."
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 dark:text-slate-200"
                      />
                    </div>

                    {/* Filter Kelompok: HANYA DITAMPILKAN JIKA DPL MEMBIMBING > 1 KELOMPOK */}
                    {groups.length > 1 && (
                      <select
                        value={selectedGroup}
                        onChange={(e) => {
                          setSelectedGroup(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none"
                      >
                        <option value="ALL">Semua Kelompok</option>
                        {groups.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                    )}

                    {/* Filter Kategori */}
                    <select
                      value={selectedKategori}
                      onChange={(e) => {
                        setSelectedKategori(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none"
                    >
                      <option value="ALL">Semua Kategori</option>
                      <option value="Pemilahan">Pemilahan</option>
                      <option value="Pengangkutan">Pengangkutan</option>
                      <option value="Pengolahan">Pengolahan</option>
                      <option value="Pemanfaatan">Pemanfaatan</option>
                      <option value="Sosialisasi">Sosialisasi / Edukasi</option>
                      <option value="Pendataan">Pendataan</option>
                    </select>

                    {/* Filter Status */}
                    <select
                      value={selectedStatus}
                      onChange={(e) => {
                        setSelectedStatus(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none"
                    >
                      <option value="ALL">Semua Status</option>
                      <option value="MENUNGGU_VERIFIKASI_DPL">Menunggu Validasi</option>
                      <option value="DISETUJUI_DPL">Tervalidasi</option>
                      <option value="PERLU_REVISI_DPL">Perlu Perbaikan</option>
                    </select>

                    {/* Button Ekspor */}
                    <button
                      onClick={handleExportCsv}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-400 transition-colors shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Ekspor
                    </button>
                  </div>
                </div>

                {/* Table Component */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/70 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold">
                        <th className="p-3 whitespace-nowrap">Tanggal & Waktu</th>
                        <th className="p-3 whitespace-nowrap">Kelompok</th>
                        <th className="p-3 whitespace-nowrap">Diinput Oleh</th>
                        <th className="p-3 whitespace-nowrap">Kategori</th>
                        <th className="p-3 min-w-[180px]">Ringkasan Aktivitas</th>
                        <th className="p-3 whitespace-nowrap">Lokasi / GPS</th>
                        <th className="p-3 whitespace-nowrap text-center">Durasi</th>
                        <th className="p-3 whitespace-nowrap text-center">Anggota</th>
                        <th className="p-3 whitespace-nowrap text-center">Bukti</th>
                        <th className="p-3 whitespace-nowrap text-center">Status</th>
                        <th className="p-3 whitespace-nowrap text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-750">
                      {loading ? (
                        <tr>
                          <td colSpan={11} className="p-10 text-center text-slate-500">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <RefreshCw className="w-5 h-5 animate-spin text-emerald-500" />
                              <span>Memuat rekap aktivitas kelompok...</span>
                            </div>
                          </td>
                        </tr>
                      ) : paginatedLogbooks.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="p-10 text-center text-slate-500">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <BookOpen className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                              <p className="font-semibold text-slate-700 dark:text-slate-300">Tidak ada data aktivitas</p>
                              <p className="text-[11px] text-slate-400">
                                Ubah filter atau tunggu input logbook terbaru dari mahasiswa melalui aplikasi mobile.
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        paginatedLogbooks.map((item) => {
                          const isSelected = selectedItemDetail?.id === item.id;
                          const durasi = formatDuration(item.waktuMulai, item.waktuSelesai);
                          const kategori = resolveKategori(item);
                          const totalMembers = item.anggotaKelompok?.length || 8;

                          return (
                            <tr
                              key={item.id}
                              onClick={() => setSelectedItemDetail(item)}
                              className={`cursor-pointer transition-colors ${
                                isSelected
                                  ? "bg-emerald-50/70 dark:bg-emerald-950/30 font-medium"
                                  : "hover:bg-slate-50 dark:hover:bg-slate-750/50"
                              }`}
                            >
                              {/* 1. Tanggal & Waktu */}
                              <td className="p-3 align-top whitespace-nowrap">
                                <div className="font-bold text-slate-800 dark:text-slate-200">
                                  {formatDateShort(item.tanggalKegiatan)}
                                </div>
                                <div className="text-[11px] text-slate-500 mt-0.5">
                                  {item.waktuLengkap}
                                </div>
                              </td>

                              {/* 2. Kelompok */}
                              <td className="p-3 align-top whitespace-nowrap font-medium text-slate-800 dark:text-slate-200">
                                {item.kelompokNama}
                              </td>

                              {/* 3. Diinput Oleh */}
                              <td className="p-3 align-top whitespace-nowrap text-slate-700 dark:text-slate-300">
                                {item.penulisNama}
                              </td>

                              {/* 4. Kategori */}
                              <td className="p-3 align-top whitespace-nowrap">
                                <span className="inline-block px-2 py-0.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-700 rounded text-slate-700 dark:text-slate-300">
                                  {kategori}
                                </span>
                              </td>

                              {/* 5. Ringkasan Aktivitas */}
                              <td className="p-3 align-top">
                                <p className="text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                                  {item.deskripsi}
                                </p>
                              </td>

                              {/* 6. Lokasi / GPS */}
                              <td className="p-3 align-top whitespace-nowrap">
                                <div className="text-slate-800 dark:text-slate-200 font-medium">
                                  {item.tempat}
                                </div>
                                <span className="inline-flex items-center gap-0.5 mt-0.5 px-1.5 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded">
                                  GPS Valid
                                </span>
                              </td>

                              {/* 7. Durasi */}
                              <td className="p-3 align-top whitespace-nowrap text-center text-slate-600 dark:text-slate-300 font-mono">
                                {durasi.short}
                              </td>

                              {/* 8. Anggota */}
                              <td className="p-3 align-top whitespace-nowrap text-center font-semibold text-slate-700 dark:text-slate-300">
                                {totalMembers}/{totalMembers}
                              </td>

                              {/* 9. Bukti */}
                              <td className="p-3 align-top whitespace-nowrap text-center">
                                {item.fotoBuktiUrl ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPreviewPhotoUrl(item.fotoBuktiUrl);
                                      setPreviewTitle(`Bukti: ${item.tempat} (${formatDateShort(item.tanggalKegiatan)})`);
                                    }}
                                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 font-semibold hover:underline"
                                  >
                                    Foto Bukti
                                  </button>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>

                              {/* 10. Status */}
                              <td className="p-3 align-top whitespace-nowrap text-center">
                                {renderStatusBadge(item.statusApproval)}
                              </td>

                              {/* 11. Aksi */}
                              <td className="p-3 align-top whitespace-nowrap text-center">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedItemDetail(item);
                                  }}
                                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                                    item.statusApproval === "MENUNGGU_VERIFIKASI_DPL"
                                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                      : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300"
                                  }`}
                                >
                                  {item.statusApproval === "MENUNGGU_VERIFIKASI_DPL" ? "Tinjau" : "Lihat"}
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Bottom Pagination Bar */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <div>
                    Menampilkan{" "}
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {filteredLogbooks.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}-
                      {Math.min(currentPage * pageSize, filteredLogbooks.length)}
                    </span>{" "}
                    dari{" "}
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {filteredLogbooks.length}
                    </span>{" "}
                    aktivitas
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 dark:text-slate-300"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${
                          currentPage === pageNum
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 dark:text-slate-300"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* KOLOM KANAN (DETAIL AKTIVITAS & VALIDASI DPL): 5 Kolom */}
            <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-6">
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 space-y-5">
                
                {/* Header Detail Card */}
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-700/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {selectedItemDetail?.kelompokNama || "Detail Aktivitas Kelompok"}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {selectedItemDetail ? resolveKategori(selectedItemDetail) : "Pilih aktivitas"} •{" "}
                        {selectedItemDetail ? formatDateFull(selectedItemDetail.tanggalKegiatan) : "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-700/80 rounded-xl text-[11px] font-medium text-slate-600 dark:text-slate-300">
                    <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                    <span>Dikirim dari aplikasi mobile</span>
                  </div>
                </div>

                {selectedItemDetail ? (
                  <>
                    {/* Detail Field Rows */}
                    <div className="space-y-3.5 text-xs text-slate-700 dark:text-slate-300">
                      
                      {/* Diinput Oleh */}
                      <div className="flex items-start gap-4">
                        <span className="w-28 text-slate-400 font-medium flex-shrink-0">Diinput Oleh</span>
                        <div className="font-bold text-slate-800 dark:text-slate-100">
                          {selectedItemDetail.penulisNama}
                          {selectedItemDetail.penulisNim && (
                            <span className="font-normal text-slate-400 font-mono ml-1.5">
                              ({selectedItemDetail.penulisNim})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Waktu Kegiatan */}
                      <div className="flex items-start gap-4">
                        <span className="w-28 text-slate-400 font-medium flex-shrink-0">Waktu Kegiatan</span>
                        <div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {selectedItemDetail.waktuLengkap}
                          </span>
                          <span className="text-slate-400 mx-1.5">•</span>
                          <span className="text-slate-500">
                            {formatDuration(selectedItemDetail.waktuMulai, selectedItemDetail.waktuSelesai).long}
                          </span>
                        </div>
                      </div>

                      {/* Lokasi */}
                      <div className="flex items-start gap-4">
                        <span className="w-28 text-slate-400 font-medium flex-shrink-0">Lokasi</span>
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {selectedItemDetail.tempat} ({selectedItemDetail.kelurahan || "Coblong"})
                          </div>
                          <div className="inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 rounded-md text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                            <span>GPS Valid</span>
                            <span>•</span>
                            <span className="font-normal">Akurasi 8 m</span>
                          </div>
                        </div>
                      </div>

                      {/* Program Kerja */}
                      <div className="flex items-start gap-4">
                        <span className="w-28 text-slate-400 font-medium flex-shrink-0">Program Kerja</span>
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {selectedItemDetail.programKerjaDeskripsi || `Program ${resolveKategori(selectedItemDetail)} Berseka`}
                        </div>
                      </div>

                      {/* Uraian Aktivitas */}
                      <div className="flex items-start gap-4">
                        <span className="w-28 text-slate-400 font-medium flex-shrink-0">Uraian Aktivitas</span>
                        <div className="leading-relaxed bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-750 text-slate-800 dark:text-slate-200">
                          {selectedItemDetail.deskripsi}
                        </div>
                      </div>

                      {/* Anggota Hadir */}
                      <div className="flex items-start gap-4">
                        <span className="w-28 text-slate-400 font-medium flex-shrink-0">Anggota Hadir</span>
                        <div className="space-y-2">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {selectedItemDetail.anggotaKelompok?.length || 8} dari {selectedItemDetail.anggotaKelompok?.length || 8} mahasiswa
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {(selectedItemDetail.anggotaKelompok && selectedItemDetail.anggotaKelompok.length > 0
                              ? selectedItemDetail.anggotaKelompok
                              : [
                                  { id: "1", name: "Anugrah Rizky", isKetua: true },
                                  { id: "2", name: "Asep Saepul", isKetua: false },
                                  { id: "3", name: "Khoirunnisa", isKetua: false },
                                  { id: "4", name: "Miko Pratama", isKetua: false },
                                  { id: "5", name: "Dina Fitriani", isKetua: false },
                                  { id: "6", name: "Siti Rahma", isKetua: false },
                                  { id: "7", name: "Indra Nugraha", isKetua: false },
                                  { id: "8", name: "Yusuf Arya", isKetua: false },
                                ]
                            ).map((st) => (
                              <span
                                key={st.id}
                                title={st.name}
                                className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center justify-center font-bold text-[10px]"
                              >
                                {getInitials(st.name)}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Hasil / Output */}
                      <div className="flex items-start gap-4">
                        <span className="w-28 text-slate-400 font-medium flex-shrink-0">Hasil / Output</span>
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {resolveHasilOutput(selectedItemDetail)}
                        </div>
                      </div>

                      {/* Bukti Kegiatan */}
                      <div className="flex items-start gap-4">
                        <span className="w-28 text-slate-400 font-medium flex-shrink-0">Bukti Kegiatan</span>
                        <div className="space-y-2 flex-1">
                          {selectedItemDetail.fotoBuktiUrl ? (
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => {
                                  setPreviewPhotoUrl(selectedItemDetail.fotoBuktiUrl);
                                  setPreviewTitle(`Bukti: ${selectedItemDetail.tempat}`);
                                }}
                                className="relative group w-20 h-14 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm"
                              >
                                <img
                                  src={selectedItemDetail.fotoBuktiUrl}
                                  alt="Bukti Dokumentasi"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  onError={(e) => {
                                    (e.target as any).src =
                                      "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=300";
                                  }}
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                  <Eye className="w-4 h-4" />
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setPreviewPhotoUrl(selectedItemDetail.fotoBuktiUrl);
                                  setPreviewTitle(`Bukti Dokumentasi: ${selectedItemDetail.tempat}`);
                                }}
                                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold hover:underline text-xs flex items-center gap-1"
                              >
                                <span>Lihat Semua Bukti</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400">Tidak ada lampiran foto</span>
                          )}
                        </div>
                      </div>

                      {/* Catatan Mahasiswa */}
                      <div className="flex items-start gap-4">
                        <span className="w-28 text-slate-400 font-medium flex-shrink-0">Catatan Mahasiswa</span>
                        <div className="text-slate-600 dark:text-slate-300 italic">
                          "Kegiatan berjalan sesuai jadwal dan mendapat respons positif dari warga setempat."
                        </div>
                      </div>
                    </div>

                    {/* Section Form Validasi DPL */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-700/80 space-y-3">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                        Validasi DPL
                      </h4>

                      <textarea
                        rows={2}
                        value={rightPanelCatatan}
                        onChange={(e) => setRightPanelCatatan(e.target.value)}
                        placeholder="Tambahkan catatan validasi atau perbaikan..."
                        className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                      />

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <button
                          type="button"
                          disabled={isSubmittingQuickVerif}
                          onClick={() => handleQuickVerifikasi("REVISI")}
                          className="py-2.5 px-4 rounded-xl border border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          Minta Perbaikan
                        </button>

                        <button
                          type="button"
                          disabled={isSubmittingQuickVerif}
                          onClick={() => handleQuickVerifikasi("APPROVE")}
                          className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Validasi Aktivitas
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-8 text-center text-slate-400 space-y-2">
                    <BookOpen className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                    <p className="text-xs">Pilih salah satu baris logbook di tabel untuk meninjau dan memvalidasi.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LOG AKTIVITAS DPL */}
        {activeTab === "dpl" && (
          <div className="-m-4 md:-m-6 lg:-m-8">
            <LogAktivitasDpl />
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
                  <p className="text-sm text-slate-500 mt-1">
                    Logbook memiliki bobot 20% dalam penilaian akademik DPL. Standar minimal kelulusan logbook: 24 aktivitas terverifikasi DPL.
                  </p>
                </div>

                {groups.length > 1 && (
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

      {/* MODAL: TAMBAH LOGBOOK MONITORING DPL */}
      {showDplLogbookModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm">
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
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-xl"
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
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm">
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
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-xl"
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
