/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Halaman Log Aktivitas DPL
 * Desain pixel-perfect sesuai mockup Berseka dan terhubung langsung ke Real Database API.
 * - Tabel Riwayat Full-Width 12 Kolom
 * - Form Catat / Edit Kegiatan DPL dikemas dalam Popup Modal Komprehensif
 * - Pekan 1-12 Terhubung Dinamis ke Linimasa Backend
 * - Standardisasi Satuan Durasi Waktu "Jam"
 */

import React, { useEffect, useState, useMemo, useRef } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import {
  ClipboardCheck,
  Calendar,
  Clock,
  Hourglass,
  Search,
  Plus,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
  AlertCircle,
  ChevronDown,
  Trash2,
  RefreshCw,
  Edit3,
  Eye,
  MapPin,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  dplActivityLogService,
  type DplActivityLogItem,
  type DplActivityStats,
  type DynamicWeekItem,
} from "../../services/dplActivityLogService";
import { dplService, type GroupSummary, type ProgramKerjaItem } from "../../services/dplService";
import { resolveImageUrl } from "../../utils/imageUrl";

// Helper Inisial Profil
const getInitials = (name: string): string => {
  if (!name) return "DPL";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

export const LogAktivitasDpl: React.FC = () => {
  const { user } = useAuthStore();

  // State Data
  const [logs, setLogs] = useState<DplActivityLogItem[]>([]);
  const [stats, setStats] = useState<DplActivityStats>({
    totalAktivitas: 0,
    bulanIni: 0,
    totalDurasi: "0 jam",
    totalDurasiJam: 0,
    belumDikirim: 0,
  });
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [prokers, setProkers] = useState<ProgramKerjaItem[]>([]);
  const [timelineWeeks, setTimelineWeeks] = useState<DynamicWeekItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Filter & Pagination State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>("ALL");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");
  const [selectedPekanFilter, setSelectedPekanFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const pageSize = 10;

  // Modal Form State (Catat / Edit Kegiatan DPL)
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [formTanggal, setFormTanggal] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [formPekanKe, setFormPekanKe] = useState<number>(1);
  const [formWaktuMulai, setFormWaktuMulai] = useState<string>("09:00");
  const [formWaktuSelesai, setFormWaktuSelesai] = useState<string>("11:00");
  const [formKelompokId, setFormKelompokId] = useState<string>("");
  const [formKategori, setFormKategori] = useState<string>("Kunjungan Lapangan");
  const [formLokasi, setFormLokasi] = useState<string>("");
  const [formProkerId, setFormProkerId] = useState<string>("");
  const [formDeskripsi, setFormDeskripsi] = useState<string>("");
  const [formHasilTindakLanjut, setFormHasilTindakLanjut] = useState<string>("");
  const [formSimpanLokasi, setFormSimpanLokasi] = useState<boolean>(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{
    kelompokId?: string;
    tanggal?: string;
    waktuMulai?: string;
    waktuSelesai?: string;
    deskripsi?: string;
  }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal Detail State
  const [selectedDetailLog, setSelectedDetailLog] = useState<DplActivityLogItem | null>(null);

  // Kalkulasi Durasi Dinamis Real-Time dengan Satuan "Jam"
  const calculatedDuration = useMemo(() => {
    if (!formWaktuMulai || !formWaktuSelesai) {
      return { isValid: false, label: "0 menit", minutes: 0, error: "Tentukan jam mulai dan selesai" };
    }
    const parseM = (t: string) => {
      const p = t.replace(".", ":").split(":");
      return parseInt(p[0] || "0", 10) * 60 + parseInt(p[1] || "0", 10);
    };
    const s = parseM(formWaktuMulai);
    const e = parseM(formWaktuSelesai);
    if (isNaN(s) || isNaN(e)) {
      return { isValid: false, label: "0 menit", minutes: 0, error: "Format jam tidak valid" };
    }
    if (e <= s) {
      return {
        isValid: false,
        label: "0 menit",
        minutes: 0,
        error: `Jam selesai (${formWaktuSelesai}) harus lebih lambat dari jam mulai (${formWaktuMulai})`,
      };
    }
    const diff = e - s;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    const label = h > 0 && m > 0 ? `${h} jam ${m} menit` : h > 0 ? `${h} jam` : `${m} menit`;
    return { isValid: true, label, minutes: diff, error: null };
  }, [formWaktuMulai, formWaktuSelesai]);

  // Fetch Summary Groups & Timeline Weeks on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [groupRes, weekRes] = await Promise.all([
          dplService.getGroupSummary(),
          dplActivityLogService.getTimelineWeeks(),
        ]);
        if (Array.isArray(groupRes)) {
          setGroups(groupRes);
          if (groupRes.length > 0 && !formKelompokId) {
            setFormKelompokId(groupRes[0].id);
          }
        }
        if (Array.isArray(weekRes) && weekRes.length > 0) {
          setTimelineWeeks(weekRes);
        }
      } catch (err) {
        console.error("Gagal memuat data inisial DPL:", err);
      }
    };
    fetchInitialData();
  }, []);

  // Fetch Program Kerja when formKelompokId changes
  useEffect(() => {
    if (!formKelompokId) {
      setProkers([]);
      return;
    }
    const fetchProkers = async () => {
      try {
        const res = await dplService.getProgramKerja(formKelompokId);
        if (Array.isArray(res)) {
          setProkers(res);
        }
      } catch (err) {
        console.error("Gagal memuat program kerja:", err);
      }
    };
    fetchProkers();
  }, [formKelompokId]);

  // Auto-detect matching pekan when formTanggal changes
  useEffect(() => {
    if (!formTanggal || timelineWeeks.length === 0) return;
    try {
      const parts = formTanggal.split("-").map((v) => parseInt(v, 10));
      if (parts.length === 3) {
        const [y, m, d] = parts;
        const targetUtc = Date.UTC(y, m - 1, d, 12, 0, 0); // midday UTC prevents timezone shift

        const matched = timelineWeeks.find((w) => {
          if (w.startDate && w.endDate) {
            const s = new Date(w.startDate).getTime();
            const e = new Date(w.endDate).getTime();
            return targetUtc >= s && targetUtc <= e;
          }
          return false;
        });

        if (matched && !editingLogId) {
          setFormPekanKe(matched.pekanKe);
        }
      }
    } catch {
      // fallback
    }
  }, [formTanggal, timelineWeeks, editingLogId]);

  // Fetch Activity Logs
  const fetchActivityLogs = async () => {
    setLoading(true);
    try {
      const res = await dplActivityLogService.getActivityLogs({
        search: searchQuery,
        groupId: selectedGroupFilter !== "ALL" ? selectedGroupFilter : undefined,
        kategori: selectedCategoryFilter !== "ALL" ? selectedCategoryFilter : undefined,
        status: selectedStatusFilter !== "ALL" ? selectedStatusFilter : undefined,
        pekanKe: selectedPekanFilter !== "ALL" ? parseInt(selectedPekanFilter, 10) : undefined,
        page: currentPage,
        limit: pageSize,
      });

      setLogs(res.items || []);
      setStats(
        res.stats || {
          totalAktivitas: 0,
          bulanIni: 0,
          totalDurasi: "0 jam",
          totalDurasiJam: 0,
          belumDikirim: 0,
        }
      );
      setTotalItems(res.pagination?.total || 0);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (err) {
      console.error("Gagal memuat data log aktivitas DPL:", err);
      toast.error("Gagal memuat riwayat aktivitas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivityLogs();
  }, [searchQuery, selectedGroupFilter, selectedCategoryFilter, selectedStatusFilter, selectedPekanFilter, currentPage]);

  // File Upload Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Ukuran file maksimal 10 MB");
        return;
      }
      setSelectedFile(file);
      if (file.type.startsWith("image/")) {
        setFilePreview(URL.createObjectURL(file));
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Reset & Open Create Form Modal
  const handleOpenCreateModal = () => {
    setEditingLogId(null);
    setFormTanggal(new Date().toISOString().split("T")[0]);
    setFormPekanKe(1);
    setFormWaktuMulai("09:00");
    setFormWaktuSelesai("11:00");
    setFormKelompokId(groups[0]?.id || "");
    setFormKategori("Kunjungan Lapangan");
    setFormLokasi("");
    setFormProkerId("");
    setFormDeskripsi("");
    setFormHasilTindakLanjut("");
    setFormSimpanLokasi(true);
    setFormErrors({});
    handleClearFile();
    setIsFormModalOpen(true);
  };

  // Open Edit Form Modal
  const handleEditClick = (item: DplActivityLogItem) => {
    setEditingLogId(item.id);
    setFormTanggal(item.tanggal || new Date().toISOString().split("T")[0]);
    setFormPekanKe(item.pekanKe || 1);
    setFormWaktuMulai(item.waktuMulai?.replace(".", ":") || "09:00");
    setFormWaktuSelesai(item.waktuSelesai?.replace(".", ":") || "11:00");
    setFormKelompokId(item.kelompokId);
    setFormKategori(item.kategori || "Kunjungan Lapangan");
    setFormLokasi(item.lokasi || item.tempat || "");
    setFormProkerId(item.programKerjaId || "");
    setFormDeskripsi(item.deskripsi || "");
    setFormHasilTindakLanjut(item.hasilTindakLanjut || item.arahanEvaluasi || "");
    setFormSimpanLokasi(item.simpanLokasi ?? true);
    setFormErrors({});
    setSelectedFile(null);
    setFilePreview(item.fotoBuktiUrl || null);
    setIsFormModalOpen(true);
  };

  // Client-Side Validation
  const validateForm = (): boolean => {
    const errors: typeof formErrors = {};
    if (!formKelompokId) {
      errors.kelompokId = "Silakan pilih kelompok dampingan KKN";
    }
    if (!formTanggal) {
      errors.tanggal = "Tanggal kegiatan wajib diisi";
    }
    if (!formWaktuMulai) {
      errors.waktuMulai = "Jam mulai wajib diisi";
    }
    if (!formWaktuSelesai) {
      errors.waktuSelesai = "Jam selesai wajib diisi";
    } else if (!calculatedDuration.isValid) {
      errors.waktuSelesai = calculatedDuration.error || "Waktu selesai harus lebih lambat dari waktu mulai";
    }
    if (!formDeskripsi.trim()) {
      errors.deskripsi = "Uraian aktivitas supervisi wajib diisi";
    } else if (formDeskripsi.trim().length < 5) {
      errors.deskripsi = "Uraian aktivitas terlalu singkat (minimal 5 karakter)";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Handler (Draf vs Terkirim)
  const handleSubmit = async (status: "DRAF" | "TERKIRIM") => {
    if (!validateForm()) {
      toast.error("Mohon lengkapi seluruh kolom bertanda bintang (*) dengan benar");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("kelompokId", formKelompokId);
      formData.append("tanggal", formTanggal);
      formData.append("pekanKe", String(formPekanKe));
      formData.append("waktuMulai", formWaktuMulai.replace(":", "."));
      formData.append("waktuSelesai", formWaktuSelesai.replace(":", "."));
      formData.append("kategori", formKategori);
      formData.append("lokasi", formLokasi.trim() || "RW Dampingan");
      formData.append("tempat", formLokasi.trim() || "RW Dampingan");
      if (formProkerId) formData.append("programKerjaId", formProkerId);
      formData.append("deskripsi", formDeskripsi.trim());
      if (formHasilTindakLanjut.trim()) {
        formData.append("hasilTindakLanjut", formHasilTindakLanjut.trim());
        formData.append("arahanEvaluasi", formHasilTindakLanjut.trim());
      }
      formData.append("simpanLokasi", String(formSimpanLokasi));
      formData.append("status", status);

      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      if (editingLogId) {
        await dplActivityLogService.updateActivityLog(editingLogId, formData);
        toast.success(status === "DRAF" ? "Draf berhasil diperbarui" : "Kegiatan DPL berhasil disimpan!");
      } else {
        await dplActivityLogService.createActivityLog(formData);
        toast.success(status === "DRAF" ? "Draf kegiatan berhasil disimpan" : "Kegiatan DPL berhasil disimpan!");
      }

      setIsFormModalOpen(false);
      fetchActivityLogs();
    } catch (err: any) {
      console.error("Gagal menyimpan kegiatan:", err);
      toast.error(err.response?.data?.message || err.message || "Gagal menyimpan kegiatan DPL");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Click Handler
  const handleDeleteLog = async (id: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus log aktivitas DPL ini?")) return;
    try {
      await dplActivityLogService.deleteActivityLog(id);
      toast.success("Kegiatan DPL berhasil dihapus");
      if (selectedDetailLog?.id === id) {
        setSelectedDetailLog(null);
      }
      fetchActivityLogs();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Gagal menghapus kegiatan");
    }
  };

  const displayName = user?.name || (user as any)?.nama || user?.email?.split("@")[0] || "Dosen Pendamping Lapangan";

  return (
    <div className="min-h-screen bg-slate-50/60 p-4 md:p-6 lg:p-8 space-y-6">
      {/* ─────────────────────────────────────────────
          1. HEADER ROW & UTAMA ACTION BUTTON
          ───────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            Log Aktivitas DPL
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Catat, dokumentasikan, dan pantau kegiatan pendampingan mingguan DPL secara terstruktur
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Action Button: Catat Kegiatan DPL */}
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Kegiatan DPL</span>
          </button>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-full py-1 pl-1 pr-3 shadow-xs">
            <div className="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
              {getInitials(displayName)}
            </div>
            <div className="text-left hidden sm:block">
              <span className="block text-xs font-semibold text-slate-800 leading-tight">
                {displayName}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          2. 4 TOP STAT SUMMARY CARDS
          ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Aktivitas */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Aktivitas</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{stats.totalAktivitas}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ClipboardCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Bulan Ini */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Bulan Ini</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{stats.bulanIni}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Total Durasi (Satuan Jam) */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Durasi</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{stats.totalDurasi}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Belum Dikirim */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Belum Dikirim</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{stats.belumDikirim}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Hourglass className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          3. FULL-WIDTH TABLE: RIWAYAT KEGIATAN DPL (12 Kolom)
          ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Riwayat Kegiatan DPL</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar seluruh aktivitas supervisi dan monitoring DPL di posko kelompok dampingan
            </p>
          </div>
          <div className="text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            Total {totalItems} Kegiatan Tercatat
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari ringkasan kegiatan, lokasi, atau kelompok..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          {/* Filter Kelompok */}
          <div className="relative">
            <select
              value={selectedGroupFilter}
              onChange={(e) => {
                setSelectedGroupFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-xs text-slate-700 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 cursor-pointer"
            >
              <option value="ALL">Semua Kelompok</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} - {g.kelurahan}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Filter Pekan (Dinamis 1-12) */}
          <div className="relative">
            <select
              value={selectedPekanFilter}
              onChange={(e) => {
                setSelectedPekanFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-xs text-slate-700 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 cursor-pointer"
            >
              <option value="ALL">Semua Pekan (1-12)</option>
              {timelineWeeks.map((w) => (
                <option key={w.pekanKe} value={w.pekanKe}>
                  Pekan {w.pekanKe} ({w.tanggalRange || w.tahapMinggu})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Filter Kategori */}
          <div className="relative">
            <select
              value={selectedCategoryFilter}
              onChange={(e) => {
                setSelectedCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-xs text-slate-700 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 cursor-pointer"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="Kunjungan Lapangan">Kunjungan Lapangan</option>
              <option value="Koordinasi">Koordinasi</option>
              <option value="Pendampingan">Pendampingan</option>
              <option value="Monitoring Lapangan">Monitoring Lapangan</option>
              <option value="Evaluasi Lapangan">Evaluasi Lapangan</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Filter Status */}
          <div className="relative">
            <select
              value={selectedStatusFilter}
              onChange={(e) => {
                setSelectedStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-xs text-slate-700 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="TERKIRIM">Terkirim</option>
              <option value="TERVERIFIKASI">Terverifikasi</option>
              <option value="DRAF">Draf</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Full-Width Table Container */}
        <div className="overflow-x-auto rounded-xl border border-slate-200/80">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-3 px-3.5 whitespace-nowrap">Tanggal & Waktu</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Kelompok Dampingan</th>
                <th className="py-3 px-3.5 whitespace-nowrap text-center">Pekan</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Kategori</th>
                <th className="py-3 px-3.5 min-w-[220px]">Ringkasan Aktivitas</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Lokasi Kegiatan</th>
                <th className="py-3 px-3.5 whitespace-nowrap text-center">Durasi (Jam)</th>
                <th className="py-3 px-3.5 whitespace-nowrap text-center">Bukti</th>
                <th className="py-3 px-3.5 whitespace-nowrap text-center">Status</th>
                <th className="py-3 px-3.5 text-center whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Memuat riwayat aktivitas DPL...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="w-7 h-7 text-slate-300" />
                      <span className="font-semibold text-slate-600 text-sm">Belum ada kegiatan DPL</span>
                      <span className="text-xs text-slate-400 max-w-sm">
                        Klik tombol "+ Catat Kegiatan DPL" di atas untuk menambahkan entri supervisi baru.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* 1. Tanggal & Waktu */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="font-bold text-slate-800">{item.tanggalFormatted}</div>
                      <div className="text-[11px] text-slate-400">{item.waktuLengkap}</div>
                    </td>

                    {/* 2. Kelompok Dampingan */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">{item.kelompokNama}</div>
                      <div className="text-[11px] text-slate-400">{item.kelurahan}</div>
                    </td>

                    {/* 3. Pekan */}
                    <td className="py-3 px-3.5 whitespace-nowrap text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        Pekan {item.pekanKe || 1}
                      </span>
                    </td>

                    {/* 4. Kategori */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-700">
                        {item.kategori}
                      </span>
                    </td>

                    {/* 5. Ringkasan Aktivitas */}
                    <td className="py-3 px-3.5 text-slate-700">
                      <p className="line-clamp-2 max-w-[280px] leading-relaxed" title={item.deskripsi}>
                        {item.deskripsi}
                      </p>
                    </td>

                    {/* 6. Lokasi */}
                    <td className="py-3 px-3.5 whitespace-nowrap text-slate-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span>{item.lokasi}</span>
                      </div>
                    </td>

                    {/* 7. Durasi (Jam) */}
                    <td className="py-3 px-3.5 whitespace-nowrap text-center font-medium text-slate-700">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                        <Clock className="w-3 h-3 text-indigo-500" />
                        {item.durasi}
                      </span>
                    </td>

                    {/* 8. Bukti */}
                    <td className="py-3 px-3.5 whitespace-nowrap text-center">
                      {item.fotoBuktiUrl ? (
                        <button
                          type="button"
                          onClick={() => setSelectedDetailLog(item)}
                          className="text-emerald-700 hover:text-emerald-800 hover:underline font-semibold cursor-pointer"
                        >
                          {item.bukti}
                        </button>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* 9. Status */}
                    <td className="py-3 px-3.5 whitespace-nowrap text-center">
                      {item.status === "TERVERIFIKASI" ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Terverifikasi
                        </span>
                      ) : item.status === "DRAF" ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          Draf
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          Terkirim
                        </span>
                      )}
                    </td>

                    {/* 10. Aksi */}
                    <td className="py-3 px-3.5 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedDetailLog(item)}
                          className="px-2.5 py-1.5 rounded-lg border border-blue-500 text-blue-600 hover:bg-blue-50 text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Lihat</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditClick(item)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteLog(item.id)}
                          className="p-1.5 rounded-lg border border-rose-300 text-rose-600 hover:bg-rose-50 text-[11px] font-semibold transition-colors cursor-pointer"
                          title="Hapus Kegiatan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Pagination */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 text-xs text-slate-500">
          <span>
            Menampilkan <span className="font-semibold text-slate-700">{logs.length}</span> dari{" "}
            <span className="font-semibold text-slate-700">{totalItems}</span> kegiatan
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                type="button"
                onClick={() => setCurrentPage(pg)}
                className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                  currentPage === pg
                    ? "bg-slate-800 text-white"
                    : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {pg}
              </button>
            ))}
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          4. POPUP MODAL: FORM CATAT / EDIT KEGIATAN DPL
          ───────────────────────────────────────────── */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto text-xs text-slate-700">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-emerald-600" />
                  {editingLogId ? "Edit Kegiatan Supervisi DPL" : "Catat Kegiatan Supervisi DPL"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lengkapi data dokumentasi kegiatan pendampingan sebelum disimpan ke database.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit("TERKIRIM");
              }}
              className="space-y-4 text-xs text-slate-700"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Kelompok Dampingan */}
                <div className="space-y-1 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="block font-semibold text-slate-700">
                      Kelompok Dampingan <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400">Pilih kelompok mahasiswa dampingan Anda</span>
                  </div>
                  <div className="relative">
                    <select
                      value={formKelompokId}
                      onChange={(e) => {
                        setFormKelompokId(e.target.value);
                        if (formErrors.kelompokId) {
                          setFormErrors((prev) => ({ ...prev, kelompokId: undefined }));
                        }
                      }}
                      className={`w-full appearance-none px-3 py-2.5 bg-slate-50 border rounded-xl text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 cursor-pointer transition-all ${
                        formErrors.kelompokId
                          ? "border-rose-400 focus:ring-rose-400 bg-rose-50/20"
                          : "border-slate-200 focus:ring-emerald-600"
                      }`}
                    >
                      <option value="">-- Pilih Kelompok KKN --</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name} - {g.kelurahan}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  {formErrors.kelompokId && (
                    <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{formErrors.kelompokId}</span>
                    </p>
                  )}
                </div>

                {/* Tanggal Kegiatan */}
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">
                    Tanggal Kegiatan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formTanggal}
                    onChange={(e) => {
                      setFormTanggal(e.target.value);
                      if (formErrors.tanggal) {
                        setFormErrors((prev) => ({ ...prev, tanggal: undefined }));
                      }
                    }}
                    className={`w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                      formErrors.tanggal
                        ? "border-rose-400 focus:ring-rose-400 bg-rose-50/20"
                        : "border-slate-200 focus:ring-emerald-600"
                    }`}
                  />
                  {formErrors.tanggal && (
                    <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{formErrors.tanggal}</span>
                    </p>
                  )}
                </div>

                {/* Pekan Ke- Dinamis (1 s.d 12) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block font-semibold text-slate-700">
                      Pekan Ke- (Linimasa Dinamis) <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      Auto-sinkron Tanggal
                    </span>
                  </div>
                  <div className="relative">
                    <select
                      value={formPekanKe}
                      onChange={(e) => setFormPekanKe(parseInt(e.target.value, 10))}
                      className="w-full appearance-none px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
                    >
                      {timelineWeeks.map((w) => (
                        <option key={w.pekanKe} value={w.pekanKe}>
                          Pekan {w.pekanKe} - {w.tanggalRange || w.tahapMinggu}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  {(() => {
                    const activeWeek = timelineWeeks.find((w) => w.pekanKe === formPekanKe);
                    return activeWeek?.kegiatanUtama ? (
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-1 font-normal">
                        <span className="font-semibold text-emerald-700">Agenda:</span> {activeWeek.kegiatanUtama}
                      </p>
                    ) : null;
                  })()}
                </div>

                {/* Waktu Mulai */}
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">
                    Waktu Mulai <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formWaktuMulai}
                    onChange={(e) => {
                      setFormWaktuMulai(e.target.value);
                      if (formErrors.waktuMulai || formErrors.waktuSelesai) {
                        setFormErrors((prev) => ({ ...prev, waktuMulai: undefined, waktuSelesai: undefined }));
                      }
                    }}
                    className={`w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                      formErrors.waktuMulai
                        ? "border-rose-400 focus:ring-rose-400 bg-rose-50/20"
                        : "border-slate-200 focus:ring-emerald-600"
                    }`}
                  />
                  {formErrors.waktuMulai && (
                    <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{formErrors.waktuMulai}</span>
                    </p>
                  )}
                </div>

                {/* Waktu Selesai */}
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">
                    Waktu Selesai <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formWaktuSelesai}
                    onChange={(e) => {
                      setFormWaktuSelesai(e.target.value);
                      if (formErrors.waktuSelesai) {
                        setFormErrors((prev) => ({ ...prev, waktuSelesai: undefined }));
                      }
                    }}
                    className={`w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                      formErrors.waktuSelesai || !calculatedDuration.isValid
                        ? "border-rose-400 focus:ring-rose-400 bg-rose-50/20"
                        : "border-slate-200 focus:ring-emerald-600"
                    }`}
                  />
                  {formErrors.waktuSelesai && (
                    <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{formErrors.waktuSelesai}</span>
                    </p>
                  )}
                </div>

                {/* Kalkulasi Durasi Dinamis Banner */}
                <div className="sm:col-span-2">
                  {calculatedDuration.isValid ? (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-800 text-xs">
                      <div className="flex items-center gap-2 font-medium">
                        <Clock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>
                          Kalkulasi Durasi: <strong className="font-bold text-emerald-900">{calculatedDuration.label}</strong>
                          <span className="text-emerald-700 text-[11px] ml-1.5 font-normal">({formWaktuMulai} s.d {formWaktuSelesai})</span>
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-200/70 text-emerald-900 text-[10px] font-bold">
                        Dinamis Otomatis
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                      <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      <span>{calculatedDuration.error || "Waktu selesai harus setelah waktu mulai"}</span>
                    </div>
                  )}
                </div>

                {/* Kategori Aktivitas */}
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">
                    Kategori Aktivitas <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formKategori}
                      onChange={(e) => setFormKategori(e.target.value)}
                      className="w-full appearance-none px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
                    >
                      <option value="Kunjungan Lapangan">Kunjungan Lapangan</option>
                      <option value="Koordinasi">Koordinasi</option>
                      <option value="Pendampingan">Pendampingan</option>
                      <option value="Monitoring Lapangan">Monitoring Lapangan</option>
                      <option value="Evaluasi Lapangan">Evaluasi Lapangan</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Lokasi Kegiatan */}
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">Lokasi / Tempat Kegiatan</label>
                  <input
                    type="text"
                    placeholder="Misal: Posko KKN RW 05 / Kantor Kelurahan"
                    value={formLokasi}
                    onChange={(e) => setFormLokasi(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              {/* Program Kerja Terkait (Opsional) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-slate-700">Program Kerja Terkait (Opsional)</label>
                  <span className="text-[11px] text-slate-400">Hubungkan dengan agenda proker kelompok</span>
                </div>
                <div className="relative">
                  <select
                    value={formProkerId}
                    onChange={(e) => setFormProkerId(e.target.value)}
                    className="w-full appearance-none px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
                  >
                    <option value="">-- Hubungkan dengan Program Kerja --</option>
                    {prokers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nomor ? `Proker #${p.nomor}: ` : ""}{p.deskripsi}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Uraian Aktivitas */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-slate-700">
                    Uraian Aktivitas Supervisi <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Minimal 5 karakter</span>
                </div>
                <textarea
                  rows={3}
                  placeholder="Jelaskan secara rinci agenda pendampingan, temuan di posko, atau observasi lapangan..."
                  value={formDeskripsi}
                  onChange={(e) => {
                    setFormDeskripsi(e.target.value);
                    if (formErrors.deskripsi) {
                      setFormErrors((prev) => ({ ...prev, deskripsi: undefined }));
                    }
                  }}
                  className={`w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all leading-relaxed ${
                    formErrors.deskripsi
                      ? "border-rose-400 focus:ring-rose-400 bg-rose-50/20"
                      : "border-slate-200 focus:ring-emerald-600"
                  }`}
                />
                {formErrors.deskripsi && (
                  <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{formErrors.deskripsi}</span>
                  </p>
                )}
              </div>

              {/* Hasil dan Tindak Lanjut / Arahan Evaluasi */}
              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Hasil, Kendala, & Arahan Evaluasi DPL</label>
                <textarea
                  rows={2}
                  placeholder="Tuliskan arahan perbaikan atau tindak lanjut yang harus dilakukan mahasiswa dampingan..."
                  value={formHasilTindakLanjut}
                  onChange={(e) => setFormHasilTindakLanjut(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 leading-relaxed"
                />
              </div>

              {/* Unggah Bukti Kegiatan */}
              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Unggah Bukti Kegiatan (Foto / Dokumen)</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,.pdf,.doc,.docx"
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-xl p-3.5 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-emerald-50/20"
                >
                  {selectedFile ? (
                    <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
                      <div className="flex items-center gap-2.5 truncate">
                        {filePreview ? (
                          <img src={filePreview} alt="Preview" className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-slate-100" />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-emerald-600" />
                          </div>
                        )}
                        <div className="text-left truncate">
                          <span className="block truncate text-slate-800 font-semibold text-xs">{selectedFile.name}</span>
                          <span className="block text-[10px] text-slate-400">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearFile();
                        }}
                        className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Hapus berkas"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1 text-slate-500 py-1">
                      <UploadCloud className="w-6 h-6 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-700">
                        Klik untuk unggah foto, PDF, atau notula
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Format: JPG, PNG, PDF, DOC • Ukuran Maks. 10 MB
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Checkbox Simpan Lokasi */}
              <div className="flex items-center justify-end pt-1">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none text-slate-600 font-medium text-xs">
                  <input
                    type="checkbox"
                    checked={formSimpanLokasi}
                    onChange={(e) => setFormSimpanLokasi(e.target.checked)}
                    className="rounded text-emerald-700 focus:ring-emerald-600 w-3.5 h-3.5"
                  />
                  <span>Simpan lokasi kegiatan sebagai default</span>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSubmit("DRAF")}
                  className="py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Simpan Draf
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingLogId ? "Simpan Perubahan" : "Kirim Aktivitas"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          5. POPUP MODAL: DETAIL AKTIVITAS ("LIHAT")
          ───────────────────────────────────────────── */}
      {selectedDetailLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto text-xs text-slate-700">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {selectedDetailLog.kategori}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    Pekan {selectedDetailLog.pekanKe || 1}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-800">{selectedDetailLog.kelompokNama}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailLog(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl">
              <div>
                <span className="text-slate-400 block text-[11px]">Tanggal & Waktu</span>
                <span className="font-semibold text-slate-800">
                  {selectedDetailLog.tanggalFormatted} ({selectedDetailLog.waktuLengkap})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Durasi (Satuan Jam)</span>
                <span className="font-semibold text-slate-800">{selectedDetailLog.durasi}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Lokasi</span>
                <span className="font-semibold text-slate-800">{selectedDetailLog.lokasi}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Status</span>
                <span className="font-semibold text-slate-800">{selectedDetailLog.status}</span>
              </div>
            </div>

            {selectedDetailLog.programKerjaDeskripsi && (
              <div className="space-y-1">
                <span className="font-semibold text-slate-700">Program Kerja Terkait:</span>
                <p className="text-slate-600 bg-emerald-50/50 border border-emerald-100 p-2.5 rounded-xl">
                  {selectedDetailLog.programKerjaDeskripsi}
                </p>
              </div>
            )}

            <div className="space-y-1">
              <span className="font-semibold text-slate-700">Uraian Aktivitas:</span>
              <p className="text-slate-600 whitespace-pre-wrap bg-slate-50 p-3 rounded-xl leading-relaxed">
                {selectedDetailLog.deskripsi}
              </p>
            </div>

            {selectedDetailLog.hasilTindakLanjut && (
              <div className="space-y-1">
                <span className="font-semibold text-slate-700">Hasil dan Tindak Lanjut:</span>
                <p className="text-slate-600 whitespace-pre-wrap bg-slate-50 p-3 rounded-xl leading-relaxed">
                  {selectedDetailLog.hasilTindakLanjut}
                </p>
              </div>
            )}

            {selectedDetailLog.fotoBuktiUrl && (
              <div className="space-y-1">
                <span className="font-semibold text-slate-700">Bukti Lampiran:</span>
                {selectedDetailLog.fotoBuktiUrl.match(/\.(jpeg|jpg|png|webp|gif)$/i) ? (
                  <img
                    src={resolveImageUrl(selectedDetailLog.fotoBuktiUrl)}
                    alt="Bukti Aktivitas"
                    className="w-full max-h-56 object-cover rounded-xl border border-slate-200"
                  />
                ) : (
                  <a
                    href={resolveImageUrl(selectedDetailLog.fotoBuktiUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-emerald-700 font-semibold hover:underline bg-emerald-50 px-3 py-2 rounded-xl"
                  >
                    <FileText className="w-4 h-4" /> Buka Dokumen Bukti Lampiran
                  </a>
                )}
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleDeleteLog(selectedDetailLog.id)}
                className="px-3 py-1.5 bg-rose-50 text-rose-700 font-semibold rounded-xl hover:bg-rose-100 border border-rose-200 transition-colors"
              >
                Hapus
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const logToEdit = selectedDetailLog;
                    setSelectedDetailLog(null);
                    handleEditClick(logToEdit);
                  }}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 border border-slate-200 transition-colors"
                >
                  Edit Aktivitas
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDetailLog(null)}
                  className="px-4 py-1.5 bg-slate-800 text-white font-semibold rounded-xl hover:bg-slate-900 transition-colors"
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

export default LogAktivitasDpl;
