/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Halaman Log Aktivitas DPL
 * Desain pixel-perfect sesuai mockup Berseka dan terhubung langsung ke Real Database API.
 */

import React, { useEffect, useState, useMemo, useRef } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import {
  ClipboardCheck,
  Calendar,
  Clock,
  Hourglass,
  Search,
  Download,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
  AlertCircle,
  ChevronDown,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  dplActivityLogService,
  type DplActivityLogItem,
  type DplActivityStats,
} from "../../services/dplActivityLogService";
import { dplService, type GroupSummary, type ProgramKerjaItem } from "../../services/dplService";

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
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Filter & Pagination State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>("ALL");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const pageSize = 10;

  // Form State
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [formTanggal, setFormTanggal] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal Detail State
  const [selectedDetailLog, setSelectedDetailLog] = useState<DplActivityLogItem | null>(null);

  // Kalkulasi Durasi Dinamis Real-Time
  const calculatedDuration = useMemo(() => {
    if (!formWaktuMulai || !formWaktuSelesai) return { label: "2 jam", minutes: 120 };
    const parseM = (t: string) => {
      const p = t.replace(".", ":").split(":");
      return parseInt(p[0] || "0", 10) * 60 + parseInt(p[1] || "0", 10);
    };
    const s = parseM(formWaktuMulai);
    const e = parseM(formWaktuSelesai);
    const diff = e > s ? e - s : 120;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    if (h > 0 && m > 0) return { label: `${h} jam ${m} menit`, minutes: diff };
    if (h > 0) return { label: `${h} jam`, minutes: diff };
    return { label: `${m} menit`, minutes: diff };
  }, [formWaktuMulai, formWaktuSelesai]);

  // Fetch Summary Groups for dropdown
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await dplService.getGroupSummary();
        if (Array.isArray(res)) {
          setGroups(res);
          if (res.length > 0 && !formKelompokId) {
            setFormKelompokId(res[0].id);
          }
        }
      } catch (err) {
        console.error("Gagal memuat kelompok DPL:", err);
      }
    };
    fetchGroups();
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

  // Fetch Activity Logs
  const fetchActivityLogs = async () => {
    setLoading(true);
    try {
      const res = await dplActivityLogService.getActivityLogs({
        search: searchQuery,
        groupId: selectedGroupFilter !== "ALL" ? selectedGroupFilter : undefined,
        kategori: selectedCategoryFilter !== "ALL" ? selectedCategoryFilter : undefined,
        status: selectedStatusFilter !== "ALL" ? selectedStatusFilter : undefined,
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
  }, [searchQuery, selectedGroupFilter, selectedCategoryFilter, selectedStatusFilter, currentPage]);

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

  // Reset Form
  const resetForm = () => {
    setEditingLogId(null);
    setFormTanggal(new Date().toISOString().split("T")[0]);
    setFormWaktuMulai("09:00");
    setFormWaktuSelesai("11:00");
    setFormKategori("Kunjungan Lapangan");
    setFormLokasi("");
    setFormProkerId("");
    setFormDeskripsi("");
    setFormHasilTindakLanjut("");
    setFormSimpanLokasi(true);
    handleClearFile();
  };

  // Submit Handler (Draf vs Terkirim)
  const handleSubmit = async (status: "DRAF" | "TERKIRIM") => {
    if (!formKelompokId) {
      toast.error("Silakan pilih kelompok dampingan");
      return;
    }
    if (!formTanggal) {
      toast.error("Silakan tentukan tanggal kegiatan");
      return;
    }
    if (!formDeskripsi.trim()) {
      toast.error("Uraian aktivitas wajib diisi");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("kelompokId", formKelompokId);
      formData.append("tanggal", formTanggal);
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
        toast.success(status === "DRAF" ? "Draf berhasil diperbarui" : "Aktivitas berhasil dikirim!");
      } else {
        await dplActivityLogService.createActivityLog(formData);
        toast.success(status === "DRAF" ? "Draf aktivitas berhasil disimpan" : "Aktivitas berhasil dicatat & dikirim!");
      }

      resetForm();
      fetchActivityLogs();
    } catch (err: any) {
      console.error("Gagal menyimpan aktivitas:", err);
      toast.error(err.response?.data?.message || "Gagal menyimpan aktivitas DPL");
    } finally {
      setSubmitting(false);
    }
  };

  // Edit Click Handler
  const handleEditClick = (item: DplActivityLogItem) => {
    setEditingLogId(item.id);
    setFormTanggal(item.tanggal || new Date().toISOString().split("T")[0]);
    setFormWaktuMulai(item.waktuMulai?.replace(".", ":") || "09:00");
    setFormWaktuSelesai(item.waktuSelesai?.replace(".", ":") || "11:00");
    setFormKelompokId(item.kelompokId);
    setFormKategori(item.kategori || "Kunjungan Lapangan");
    setFormLokasi(item.lokasi || item.tempat || "");
    setFormProkerId(item.programKerjaId || "");
    setFormDeskripsi(item.deskripsi || "");
    setFormHasilTindakLanjut(item.hasilTindakLanjut || item.arahanEvaluasi || "");
    setFormSimpanLokasi(item.simpanLokasi ?? true);
    setSelectedFile(null);
    setFilePreview(item.fotoBuktiUrl || null);

    // Scroll to right form smoothly
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Export CSV Handler
  const handleExportCSV = () => {
    if (logs.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    const headers = [
      "Tanggal",
      "Waktu Mulai",
      "Waktu Selesai",
      "Kelompok Dampingan",
      "Kelurahan",
      "Kategori",
      "Ringkasan Aktivitas",
      "Lokasi",
      "Durasi",
      "Status",
    ];

    const rows = logs.map((l) => [
      `"${l.tanggalFormatted}"`,
      `"${l.waktuMulai}"`,
      `"${l.waktuSelesai}"`,
      `"${l.kelompokNama}"`,
      `"${l.kelurahan}"`,
      `"${l.kategori}"`,
      `"${l.deskripsi.replace(/"/g, '""')}"`,
      `"${l.lokasi.replace(/"/g, '""')}"`,
      `"${l.durasi}"`,
      `"${l.status}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Log_Aktivitas_DPL_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("File CSV berhasil diunduh");
  };

  const displayName = user?.name || "Dr. Agus Mulyana, M.T.";

  return (
    <div className="min-h-screen bg-slate-50/60 p-4 md:p-6 lg:p-8 space-y-6">
      {/* ─────────────────────────────────────────────
          1. HEADER ROW
          ───────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Log Aktivitas DPL</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Catat, dokumentasikan, dan pantau aktivitas pendampingan DPL melalui web
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* User Profile Pill */}
          <div className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-full py-1 pl-1 pr-3 shadow-xs">
            <div className="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
              {getInitials(displayName)}
            </div>
            <div className="text-left">
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

        {/* Card 3: Total Durasi */}
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
          3. MAIN 2-COLUMN LAYOUT
          ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── LEFT COLUMN: RIWAYAT AKTIVITAS DPL (7 Cols) ── */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Riwayat Aktivitas DPL</h2>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative flex-1 min-w-[160px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari aktivitas..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
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
                className="appearance-none bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-7 py-1.5 text-xs text-slate-700 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 cursor-pointer"
              >
                <option value="ALL">Semua Kelompok</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Filter Kategori */}
            <div className="relative">
              <select
                value={selectedCategoryFilter}
                onChange={(e) => {
                  setSelectedCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-7 py-1.5 text-xs text-slate-700 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 cursor-pointer"
              >
                <option value="ALL">Semua Kategori</option>
                <option value="Kunjungan Lapangan">Kunjungan Lapangan</option>
                <option value="Koordinasi">Koordinasi</option>
                <option value="Pendampingan">Pendampingan</option>
                <option value="Monitoring Lapangan">Monitoring Lapangan</option>
                <option value="Evaluasi Lapangan">Evaluasi Lapangan</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Filter Status */}
            <div className="relative">
              <select
                value={selectedStatusFilter}
                onChange={(e) => {
                  setSelectedStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-7 py-1.5 text-xs text-slate-700 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 cursor-pointer"
              >
                <option value="ALL">Semua Status</option>
                <option value="TERKIRIM">Terkirim</option>
                <option value="TERVERIFIKASI">Terverifikasi</option>
                <option value="DRAF">Draf</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Button Ekspor */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-700 text-emerald-800 hover:bg-emerald-50 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor</span>
            </button>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-xl border border-slate-200/80">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/90 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-3 whitespace-nowrap">Tanggal & Waktu</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Kelompok Dampingan</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Kategori</th>
                  <th className="py-2.5 px-3 min-w-[170px]">Ringkasan Aktivitas</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Lokasi</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Durasi</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Bukti</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Status</th>
                  <th className="py-2.5 px-3 text-center whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                        <span>Memuat riwayat aktivitas...</span>
                      </div>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <AlertCircle className="w-6 h-6 text-slate-300" />
                        <span className="font-medium text-slate-600">Belum ada aktivitas DPL</span>
                        <span className="text-[11px] text-slate-400">
                          Gunakan formulir di sisi kanan untuk menambahkan entri baru.
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  logs.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Tanggal & Waktu */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{item.tanggalFormatted}</div>
                        <div className="text-[11px] text-slate-400">{item.waktuLengkap}</div>
                      </td>

                      {/* Kelompok Dampingan */}
                      <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-800">
                        {item.kelompokNama}
                      </td>

                      {/* Kategori */}
                      <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                        {item.kategori}
                      </td>

                      {/* Ringkasan Aktivitas */}
                      <td className="py-3 px-3 text-slate-700 font-medium">
                        <p className="line-clamp-2 max-w-[200px]" title={item.deskripsi}>
                          {item.deskripsi}
                        </p>
                      </td>

                      {/* Lokasi */}
                      <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                        {item.lokasi}
                      </td>

                      {/* Durasi */}
                      <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-700">
                        {item.durasi}
                      </td>

                      {/* Bukti */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {item.fotoBuktiUrl ? (
                          <button
                            type="button"
                            onClick={() => setSelectedDetailLog(item)}
                            className="text-emerald-700 hover:text-emerald-800 hover:underline font-medium cursor-pointer"
                          >
                            {item.bukti}
                          </button>
                        ) : (
                          <span className="text-slate-400">{item.bukti}</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {item.status === "TERVERIFIKASI" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Terverifikasi
                          </span>
                        ) : item.status === "DRAF" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            Draf
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            Terkirim
                          </span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-3 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedDetailLog(item)}
                            className="px-2.5 py-1 rounded-md border border-blue-500 text-blue-600 hover:bg-blue-50 text-[11px] font-semibold transition-colors"
                          >
                            Lihat
                          </button>
                          {item.status === "DRAF" && (
                            <button
                              type="button"
                              onClick={() => handleEditClick(item)}
                              className="px-2.5 py-1 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100 text-[11px] font-semibold transition-colors"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer / Pagination */}
          <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
            <span>
              Menampilkan {logs.length} dari {totalItems} aktivitas
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                <button
                  key={pg}
                  type="button"
                  onClick={() => setCurrentPage(pg)}
                  className={`w-7 h-7 flex items-center justify-center rounded-md text-xs font-semibold transition-colors ${
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
                className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: TAMBAH AKTIVITAS DPL FORM (5 Cols) ── */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">
                {editingLogId ? "Edit Aktivitas DPL" : "Tambah Aktivitas DPL"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Lengkapi data aktivitas sebelum disimpan.</p>
            </div>
            {editingLogId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-rose-600 hover:underline font-medium flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Batal Edit
              </button>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit("TERKIRIM");
            }}
            className="space-y-3.5 text-xs text-slate-700"
          >
            {/* Tanggal Kegiatan */}
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Tanggal Kegiatan</label>
              <div className="relative">
                <input
                  type="date"
                  value={formTanggal}
                  onChange={(e) => setFormTanggal(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  required
                />
              </div>
            </div>

            {/* Waktu Mulai & Waktu Selesai */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Waktu Mulai</label>
                <input
                  type="time"
                  value={formWaktuMulai}
                  onChange={(e) => setFormWaktuMulai(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Waktu Selesai</label>
                <input
                  type="time"
                  value={formWaktuSelesai}
                  onChange={(e) => setFormWaktuSelesai(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  required
                />
              </div>
            </div>

            {/* Kelompok Dampingan */}
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Kelompok Dampingan</label>
              <div className="relative">
                <select
                  value={formKelompokId}
                  onChange={(e) => setFormKelompokId(e.target.value)}
                  className="w-full appearance-none px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 cursor-pointer"
                  required
                >
                  <option value="">Pilih kelompok</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} - {g.kelurahan}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Kategori Aktivitas */}
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Kategori Aktivitas</label>
              <div className="relative">
                <select
                  value={formKategori}
                  onChange={(e) => setFormKategori(e.target.value)}
                  className="w-full appearance-none px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 cursor-pointer"
                  required
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
              <label className="block font-semibold text-slate-700">Lokasi Kegiatan</label>
              <input
                type="text"
                placeholder="Masukkan lokasi kegiatan"
                value={formLokasi}
                onChange={(e) => setFormLokasi(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            {/* Program Kerja Terkait (Opsional) */}
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Program Kerja Terkait</label>
              <div className="relative">
                <select
                  value={formProkerId}
                  onChange={(e) => setFormProkerId(e.target.value)}
                  className="w-full appearance-none px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 cursor-pointer"
                >
                  <option value="">Pilih program kerja (opsional)</option>
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
              <label className="block font-semibold text-slate-700">Uraian Aktivitas</label>
              <textarea
                rows={3}
                placeholder="Jelaskan aktivitas yang dilakukan..."
                value={formDeskripsi}
                onChange={(e) => setFormDeskripsi(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 resize-none"
                required
              />
            </div>

            {/* Hasil dan Tindak Lanjut */}
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Hasil dan Tindak Lanjut</label>
              <textarea
                rows={3}
                placeholder="Tuliskan hasil, kendala, dan rencana tindak lanjut..."
                value={formHasilTindakLanjut}
                onChange={(e) => setFormHasilTindakLanjut(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 resize-none"
              />
            </div>

            {/* Unggah Bukti Kegiatan */}
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Unggah Bukti Kegiatan</label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,.pdf,.doc,.docx"
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-xl p-4 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-emerald-50/20"
              >
                {selectedFile ? (
                  <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2 truncate">
                      {filePreview ? (
                        <img src={filePreview} alt="Preview" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                      ) : (
                        <FileText className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      )}
                      <span className="truncate text-slate-800 font-medium">{selectedFile.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClearFile();
                      }}
                      className="text-slate-400 hover:text-rose-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-1 text-slate-500">
                    <UploadCloud className="w-6 h-6 text-slate-400" />
                    <span className="text-[11px] font-medium text-slate-600">
                      Foto, PDF, atau notula • Maks. 10 MB
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Durasi & Simpan Lokasi Option Row */}
            <div className="flex items-center justify-between pt-1">
              {/* Durasi Pill Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
                <Clock className="w-3.5 h-3.5" />
                <span>Durasi: {calculatedDuration.label}</span>
              </div>

              {/* Checkbox Simpan Lokasi */}
              <label className="inline-flex items-center gap-2 cursor-pointer select-none text-slate-600 font-medium text-xs">
                <input
                  type="checkbox"
                  checked={formSimpanLokasi}
                  onChange={(e) => setFormSimpanLokasi(e.target.checked)}
                  className="rounded text-emerald-700 focus:ring-emerald-600 w-3.5 h-3.5"
                />
                <span>Simpan lokasi kegiatan</span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSubmit("DRAF")}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs shadow-2xs transition-colors disabled:opacity-50"
              >
                Simpan Draf
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#0e5b3f] hover:bg-[#0b4832] text-white font-semibold text-xs shadow-sm transition-colors disabled:opacity-50"
              >
                {submitting ? "Menyimpan..." : "Kirim Aktivitas"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          4. MODAL DETAIL AKTIVITAS ("LIHAT")
          ───────────────────────────────────────────── */}
      {selectedDetailLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto text-xs text-slate-700">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-1">
                  {selectedDetailLog.kategori}
                </span>
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
                <span className="text-slate-400 block text-[11px]">Durasi</span>
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
              <p className="text-slate-600 whitespace-pre-wrap bg-slate-50 p-3 rounded-xl">
                {selectedDetailLog.deskripsi}
              </p>
            </div>

            {selectedDetailLog.hasilTindakLanjut && (
              <div className="space-y-1">
                <span className="font-semibold text-slate-700">Hasil dan Tindak Lanjut:</span>
                <p className="text-slate-600 whitespace-pre-wrap bg-slate-50 p-3 rounded-xl">
                  {selectedDetailLog.hasilTindakLanjut}
                </p>
              </div>
            )}

            {selectedDetailLog.fotoBuktiUrl && (
              <div className="space-y-1">
                <span className="font-semibold text-slate-700">Bukti Lampiran:</span>
                {selectedDetailLog.fotoBuktiUrl.match(/\.(jpeg|jpg|png|webp|gif)$/i) ? (
                  <img
                    src={selectedDetailLog.fotoBuktiUrl}
                    alt="Bukti Aktivitas"
                    className="w-full max-h-56 object-cover rounded-xl border border-slate-200"
                  />
                ) : (
                  <a
                    href={selectedDetailLog.fotoBuktiUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-emerald-700 font-semibold hover:underline bg-emerald-50 px-3 py-2 rounded-xl"
                  >
                    <FileText className="w-4 h-4" /> Buka Dokumen Bukti Lampiran
                  </a>
                )}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedDetailLog(null)}
                className="px-4 py-2 bg-slate-800 text-white font-semibold rounded-xl hover:bg-slate-900 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogAktivitasDpl;
