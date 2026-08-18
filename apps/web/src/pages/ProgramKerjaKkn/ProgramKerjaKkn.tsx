/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  FileSpreadsheet,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  CheckCheck,
  Search,
  Download,
  Loader2,
  X,
  XCircle,
  PlayCircle,
  Coins,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { useAuthStore } from "../../store/useAuthStore";
import { dplService, type ProgramKerjaItem } from "../../services/dplService";
import { ConfirmModal } from "../../components/common/ConfirmModal";
import { Pagination } from "../../components/common/Pagination";
import { EmptyTableState } from "../../components/common/EmptyTableState";

// Google Drive Official Logo Icon Component
const GoogleDriveIcon = () => (
  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 87.3 78" fill="none">
    <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da" />
    <path d="M43.65 25 29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47" />
    <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.85 10.1z" fill="#ea4335" />
    <path d="M43.65 25 57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.4-4.5 1.2z" fill="#00832d" />
    <path d="M59.8 53H87.3c0-1.55-.4-3.1-1.2-4.5l-19.9-34.5c-.8-1.4-1.95-2.5-3.3-3.3z" fill="#2684fc" />
    <path d="m73.55 76.8-13.75-23.8H27.5l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.4 4.5-1.2z" fill="#ffba00" />
  </svg>
);

export const ProgramKerjaKkn: React.FC = () => {
  const { user } = useAuthStore();
  const userRole = String(user?.peran || "").toUpperCase();
  const isDpl = ["DPL", "DOSEN_PEMBIMBING"].includes(userRole);
  const isManagement = ["SUPER_USER", "PANITIA_TASKFORCE", "DEVELOPER"].includes(userRole);
  const canModifyProker = isManagement || isDpl;

  const [loading, setLoading] = useState(true);
  const [prokerList, setProkerList] = useState<ProgramKerjaItem[]>([]);
  const [kelompokList, setKelompokList] = useState<any[]>([]);

  // 5 Filter States
  const [selectedKelompokId, setSelectedKelompokId] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [sourceFilter, setSourceFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Modal State for Add / Edit
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    kelompokId: "",
    nomor: 1,
    deskripsi: "",
    kategori: "Pemilahan",
    sumber: "Mahasiswa",
    waktuPelaksanaan: "",
    linkGoogleDrive: "",
    kebutuhanBiaya: 0,
    status: "BELUM_DISETUJUI" as "BELUM_DISETUJUI" | "DITERIMA" | "DITOLAK" | "SEDANG_BERJALAN" | "SELESAI",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Delete
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    id: string;
    deskripsi: string;
  }>({
    isOpen: false,
    id: "",
    deskripsi: "",
  });

  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");

  const formatIndonesianDateRange = (startStr: string, endStr: string) => {
    if (!startStr) return "";
    const startDate = new Date(startStr);
    if (isNaN(startDate.getTime())) return startStr;

    if (!endStr || startStr === endStr) {
      return startDate.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }

    const endDate = new Date(endStr);
    if (isNaN(endDate.getTime())) return startStr;

    const startDay = startDate.getDate();
    const endFormatted = endDate.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    return `${startDay} – ${endFormatted}`;
  };

  const handleDateChange = (start: string, end: string) => {
    setFormStartDate(start);
    setFormEndDate(end);
    if (start) {
      const formatted = formatIndonesianDateRange(start, end);
      setFormData((prev) => ({ ...prev, waktuPelaksanaan: formatted }));
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch kelompok list with robust multi-endpoint fallback
      let groups: any[] = [];
      try {
        const kelRes = await api.get("/kelompok");
        const list =
          kelRes.data?.data ||
          kelRes.data?.groups ||
          (Array.isArray(kelRes.data) ? kelRes.data : []);
        if (Array.isArray(list) && list.length > 0) {
          groups = list;
        }
      } catch (_e) {
        // Fallback below
      }

      if (groups.length === 0) {
        try {
          const dplGroups = await dplService.getGroupSummary();
          if (Array.isArray(dplGroups) && dplGroups.length > 0) {
            groups = dplGroups.map((g: any) => ({
              id: g.id,
              name: g.name || g.namaKelompok,
              kelurahan: g.kelurahan,
              cakupanRw: g.cakupanRw,
            }));
          }
        } catch (_e) {
          // Fallback below
        }
      }

      if (groups.length === 0) {
        // Fallback default list if DB still initializing
        groups = [
          { id: "kel-1", name: "Kelompok 1 - Dago", kelurahan: "Dago" },
          { id: "kel-2", name: "Kelompok 2 - Lebakgede", kelurahan: "Lebakgede" },
          { id: "kel-3", name: "Kelompok 3 - Lebaksiliwangi", kelurahan: "Lebaksiliwangi" },
          { id: "kel-4", name: "Kelompok 4 - Sadangserang", kelurahan: "Sadangserang" },
          { id: "kel-5", name: "Kelompok 5 - Sekeloa", kelurahan: "Sekeloa" },
          { id: "kel-6", name: "Kelompok 6 - Cipaganti", kelurahan: "Cipaganti" },
        ];
      }

      setKelompokList(groups);

      // Fetch proker list
      const data = await dplService.getProgramKerja(
        selectedKelompokId !== "ALL" ? selectedKelompokId : undefined
      );
      setProkerList(data);
    } catch (err: any) {
      console.error("Gagal memuat program kerja:", err);
      toast.error("Gagal memuat data program kerja KKN");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedKelompokId]);

  const handleOpenAddModal = () => {
    setFormMode("add");
    setEditingId(null);
    setFormStartDate("");
    setFormEndDate("");
    setFormData({
      kelompokId: kelompokList[0]?.id || "",
      nomor: prokerList.length + 1,
      deskripsi: "",
      kategori: "Pemilahan",
      sumber: "Mahasiswa",
      waktuPelaksanaan: "",
      linkGoogleDrive: "",
      kebutuhanBiaya: 0,
      status: "BELUM_DISETUJUI",
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (item: ProgramKerjaItem) => {
    setFormMode("edit");
    setEditingId(item.id);
    setFormStartDate("");
    setFormEndDate("");
    setFormData({
      kelompokId: item.kelompokId,
      nomor: item.nomor,
      deskripsi: item.deskripsi,
      kategori: item.kategori || "Pemilahan",
      sumber: item.sumber || "Mahasiswa",
      waktuPelaksanaan: item.waktuPelaksanaan || "",
      linkGoogleDrive: item.linkGoogleDrive || "",
      kebutuhanBiaya: item.kebutuhanBiaya,
      status: item.status,
    });
    setIsFormModalOpen(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kelompokId || !formData.deskripsi.trim()) {
      toast.error("Kelompok dan deskripsi kegiatan wajib diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      if (formMode === "add") {
        await dplService.createProgramKerja({
          kelompokId: formData.kelompokId,
          nomor: Number(formData.nomor),
          deskripsi: formData.deskripsi,
          kategori: formData.kategori,
          sumber: formData.sumber,
          waktuPelaksanaan: formData.waktuPelaksanaan,
          linkGoogleDrive: formData.linkGoogleDrive,
          kebutuhanBiaya: Number(formData.kebutuhanBiaya),
        });
        toast.success("Rencana program kerja berhasil ditambahkan");
      } else if (editingId) {
        await dplService.updateProgramKerja(editingId, {
          nomor: Number(formData.nomor),
          deskripsi: formData.deskripsi,
          kategori: formData.kategori,
          sumber: formData.sumber,
          waktuPelaksanaan: formData.waktuPelaksanaan,
          linkGoogleDrive: formData.linkGoogleDrive,
          kebutuhanBiaya: Number(formData.kebutuhanBiaya),
          status: formData.status,
        });
        toast.success("Program kerja berhasil diperbarui");
      }
      setIsFormModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error("Gagal menyimpan program kerja:", err);
      toast.error(err.response?.data?.message || "Gagal menyimpan program kerja");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProker = async () => {
    if (!deleteModal.id) return;
    try {
      await dplService.deleteProgramKerja(deleteModal.id);
      toast.success("Program kerja berhasil dihapus");
      setDeleteModal({ isOpen: false, id: "", deskripsi: "" });
      fetchData();
    } catch (err: any) {
      console.error("Gagal menghapus proker:", err);
      toast.error("Gagal menghapus program kerja");
    }
  };

  // Filtered proker data
  const filteredProkers = useMemo(() => {
    return prokerList.filter((item) => {
      const matchesSearch =
        item.deskripsi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.kelompokName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.kelurahan.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        categoryFilter === "ALL" ||
        (item.kategori || "Pemilahan").toLowerCase() === categoryFilter.toLowerCase();

      const matchesSource =
        sourceFilter === "ALL" ||
        (item.sumber || "Mahasiswa").toLowerCase() === sourceFilter.toLowerCase();

      let matchesStatus = true;
      const st: any = item.status || "";
      if (statusFilter === "BELUM_DISETUJUI") {
        matchesStatus = st === "BELUM_DISETUJUI" || st === "PENDING" || !item.status;
      } else if (statusFilter === "DISETUJUI") {
        matchesStatus = st === "DITERIMA" || st === "DISETUJUI";
      } else if (statusFilter === "TIDAK_DISETUJUI") {
        matchesStatus = st === "DITOLAK" || st === "TIDAK_DISETUJUI";
      } else if (statusFilter === "SEDANG_BERJALAN") {
        matchesStatus = st === "SEDANG_BERJALAN" || st === "SEDANG_DILAKSANAKAN";
      } else if (statusFilter === "SELESAI") {
        matchesStatus = st === "SELESAI" || st === "SELESAI_DILAKSANAKAN";
      }

      return matchesSearch && matchesCategory && matchesSource && matchesStatus;
    });
  }, [prokerList, searchQuery, categoryFilter, sourceFilter, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedKelompokId, categoryFilter, sourceFilter, statusFilter]);

  const totalPages = Math.ceil(filteredProkers.length / itemsPerPage) || 1;
  const paginatedProkers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProkers.slice(start, start + itemsPerPage);
  }, [filteredProkers, currentPage, itemsPerPage]);

  // Metric KPI Computations Sesuai Standar PT Makerindo
  const totalCount = prokerList.length;
  const disetujuiCount = prokerList.filter(
    (p) => (p.status as string) === "DITERIMA" || (p.status as string) === "DISETUJUI"
  ).length;
  const disetujuiPct = totalCount > 0 ? ((disetujuiCount / totalCount) * 100).toFixed(1).replace(".", ",") : "0";

  const tidakDisetujuiCount = prokerList.filter(
    (p) => (p.status as string) === "DITOLAK" || (p.status as string) === "TIDAK_DISETUJUI"
  ).length;
  const tidakDisetujuiPct = totalCount > 0 ? ((tidakDisetujuiCount / totalCount) * 100).toFixed(1).replace(".", ",") : "0";

  const sedangDilaksanakanCount = prokerList.filter(
    (p) => (p.status as string) === "SEDANG_BERJALAN" || (p.status as string) === "SEDANG_DILAKSANAKAN"
  ).length;
  const sedangDilaksanakanPct = totalCount > 0 ? ((sedangDilaksanakanCount / totalCount) * 100).toFixed(1).replace(".", ",") : "0";

  const selesaiDilaksanakanCount = prokerList.filter(
    (p) => (p.status as string) === "SELESAI" || (p.status as string) === "SELESAI_DILAKSANAKAN"
  ).length;
  const selesaiDilaksanakanPct = totalCount > 0 ? ((selesaiDilaksanakanCount / totalCount) * 100).toFixed(1).replace(".", ",") : "0";

  const totalBiaya = prokerList.reduce((acc, p) => acc + (Number(p.kebutuhanBiaya) || 0), 0);
  void totalBiaya;

  const handleExportCsv = () => {
    if (filteredProkers.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }
    const headers = [
      "No",
      "Kategori",
      "Sumber",
      "Deskripsi",
      "Waktu Pelaksanaan",
      "Biaya (Rp)",
      "Status",
      "Bukti Google Drive",
    ];
    const rows = filteredProkers.map((p, idx) => [
      p.nomor || idx + 1,
      `"${p.kategori || "Pemilahan"}"`,
      `"${p.sumber || "Mahasiswa"}"`,
      `"${p.deskripsi.replace(/"/g, '""')}"`,
      `"${p.waktuPelaksanaan || "-"}"`,
      p.kebutuhanBiaya,
      `"${p.status}"`,
      `"${p.linkGoogleDrive || "-"}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Program_Kerja_KKN_Coblong_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Data program kerja berhasil diekspor ke CSV!");
  };

  // Helper Badge Renderers
  const renderKategoriBadge = (kat?: string) => {
    const k = (kat || "Pemilahan").toLowerCase();
    if (k.includes("pemilahan")) {
      return (
        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-[11px]">
          Pemilahan
        </span>
      );
    }
    if (k.includes("pengangkutan")) {
      return (
        <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-bold text-[11px]">
          Pengangkutan
        </span>
      );
    }
    if (k.includes("pengolahan")) {
      return (
        <span className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full font-bold text-[11px]">
          Pengolahan
        </span>
      );
    }
    if (k.includes("pemanfaatan")) {
      return (
        <span className="px-3 py-1 bg-teal-50 text-teal-700 border border-teal-200 rounded-full font-bold text-[11px]">
          Pemanfaatan
        </span>
      );
    }
    if (k.includes("edukasi") || k.includes("sosialisasi")) {
      return (
        <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-bold text-[11px]">
          Edukasi & Sosialisasi
        </span>
      );
    }
    return (
      <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-full font-bold text-[11px]">
        {kat || "Lainnya"}
      </span>
    );
  };

  const renderSumberBadge = (sumber?: string) => {
    const s = (sumber || "Mahasiswa").toLowerCase();
    if (s.includes("dpl")) {
      return (
        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold text-[11px]">
          DPL
        </span>
      );
    }
    return (
      <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg font-bold text-[11px]">
        Mahasiswa
      </span>
    );
  };

  const renderStatusPelaksanaanBadge = (status: string) => {
    const s = (status || "").toUpperCase();
    if (s === "SELESAI" || s === "SELESAI_DILAKSANAKAN") {
      return (
        <span className="px-3.5 py-1 bg-teal-50 text-teal-700 border border-teal-200 rounded-full font-bold text-[11px]">
          Selesai Dilaksanakan
        </span>
      );
    }
    if (s === "SEDANG_BERJALAN" || s === "SEDANG_DILAKSANAKAN") {
      return (
        <span className="px-3.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-bold text-[11px]">
          Sedang Dilaksanakan
        </span>
      );
    }
    if (s === "DITERIMA" || s === "DISETUJUI") {
      return (
        <span className="px-3.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-[11px]">
          Disetujui
        </span>
      );
    }
    if (s === "DITOLAK" || s === "TIDAK_DISETUJUI") {
      return (
        <span className="px-3.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full font-bold text-[11px]">
          Tidak Disetujui
        </span>
      );
    }
    return (
      <span className="px-3.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-bold text-[11px]">
        Belum Disetujui
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-800 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Program Kerja KKN</h1>
          <p className="text-slate-500 text-xs mt-1">
            Menampilkan rencana dan pelaksanaan program kerja mahasiswa KKN yang divalidasi oleh Dosen Pendamping Lapangan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-3.5 py-2 rounded-xl text-xs font-bold shadow-2xs">
            <Coins size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span>Estimasi Biaya: Rp {totalBiaya.toLocaleString("id-ID")}</span>
          </div>
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 px-4 py-2 rounded-xl font-bold text-xs shadow-2xs transition-all cursor-pointer"
          >
            <Download size={14} className="text-emerald-600" />
            Ekspor CSV
          </button>
          {canModifyProker && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <Plus size={15} />
              Tambah Rencana Kegiatan
            </button>
          )}
        </div>
      </div>

      {/* 5 Stat Cards Metrik Utama Program Kerja */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Program Kerja */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">Total Proker</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
              <FileSpreadsheet size={16} />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">{totalCount}</h3>
            <span className="text-[10px] text-slate-400 font-medium">Semua rencana kegiatan</span>
          </div>
        </div>

        {/* Card 2: Disetujui */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">Disetujui</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-800/40">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{disetujuiCount}</h3>
            <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-medium">{disetujuiPct}% dari total</span>
          </div>
        </div>

        {/* Card 3: Tidak Disetujui */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/30 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-rose-700 dark:text-rose-400 font-bold">Tidak Disetujui</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-800/40">
              <XCircle size={16} />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400">{tidakDisetujuiCount}</h3>
            <span className="text-[10px] text-rose-600/80 dark:text-rose-400/80 font-medium">{tidakDisetujuiPct}% dari total</span>
          </div>
        </div>

        {/* Card 4: Sedang Dilaksanakan */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-blue-700 dark:text-blue-400 font-bold">Sedang Dilaksanakan</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-800/40">
              <PlayCircle size={16} />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-black text-blue-600 dark:text-blue-400">{sedangDilaksanakanCount}</h3>
            <span className="text-[10px] text-blue-600/80 dark:text-blue-400/80 font-medium">{sedangDilaksanakanPct}% dari total</span>
          </div>
        </div>

        {/* Card 5: Selesai Dilaksanakan */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-teal-100 dark:border-teal-900/30 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-teal-700 dark:text-teal-400 font-bold">Selesai Dilaksanakan</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 border border-teal-100 dark:border-teal-800/40">
              <CheckCheck size={16} />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-black text-teal-600 dark:text-teal-400">{selesaiDilaksanakanCount}</h3>
            <span className="text-[10px] text-teal-600/80 dark:text-teal-400/80 font-medium">{selesaiDilaksanakanPct}% dari total</span>
          </div>
        </div>
      </div>

      {/* Toolbar Filter 5 Parameter Sesuai Gambar 4 */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 flex-1 max-w-4xl">
          {/* Filter 1: Kelompok */}
          <div>
            <span className="text-[10.5px] font-bold text-slate-500 block mb-1">Kelompok</span>
            <select
              value={selectedKelompokId}
              onChange={(e) => setSelectedKelompokId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none focus:border-emerald-500 focus:bg-white transition cursor-pointer"
            >
              <option value="ALL">Semua Kelompok</option>
              {kelompokList.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter 2: Kategori */}
          <div>
            <span className="text-[10.5px] font-bold text-slate-500 block mb-1">Kategori</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none focus:border-emerald-500 focus:bg-white transition cursor-pointer"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="Pemilahan">Pemilahan</option>
              <option value="Pengangkutan">Pengangkutan</option>
              <option value="Pengolahan">Pengolahan</option>
              <option value="Pemanfaatan">Pemanfaatan</option>
              <option value="Edukasi & Sosialisasi">Edukasi & Sosialisasi</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          {/* Filter 3: Sumber */}
          <div>
            <span className="text-[10.5px] font-bold text-slate-500 block mb-1">Sumber</span>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none focus:border-emerald-500 focus:bg-white transition cursor-pointer"
            >
              <option value="ALL">Semua Sumber</option>
              <option value="Mahasiswa">Mahasiswa</option>
              <option value="DPL">DPL</option>
            </select>
          </div>

          {/* Filter 4: Status */}
          <div>
            <span className="text-[10.5px] font-bold text-slate-500 block mb-1">Status</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none focus:border-emerald-500 focus:bg-white transition cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="BELUM_DISETUJUI">Belum Disetujui</option>
              <option value="DISETUJUI">Disetujui</option>
              <option value="TIDAK_DISETUJUI">Tidak Disetujui</option>
              <option value="SEDANG_BERJALAN">Sedang Dilaksanakan</option>
              <option value="SELESAI">Selesai Dilaksanakan</option>
            </select>
          </div>
        </div>

        {/* Filter 5: Cari Program Kerja */}
        <div className="w-full md:w-64">
          <span className="text-[10.5px] font-bold text-slate-500 block mb-1">Cari program kerja</span>
          <div className="relative">
            <input
              type="text"
              placeholder="Cari deskripsi kegiatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-emerald-500 focus:bg-white transition font-medium"
            />
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Main Table Sesuai Gambar 4 */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="animate-spin text-emerald-600" size={32} />
            <span className="text-xs font-semibold">Memuat rencana program kerja...</span>
          </div>
        ) : filteredProkers.length === 0 ? (
          <EmptyTableState
            entityName="Program Kerja KKN"
            isSearch={!!(searchQuery || selectedKelompokId !== "ALL" || categoryFilter !== "ALL" || sourceFilter !== "ALL" || statusFilter !== "ALL")}
            searchQuery={searchQuery}
            onResetSearch={() => {
              setSearchQuery("");
              setSelectedKelompokId("ALL");
              setCategoryFilter("ALL");
              setSourceFilter("ALL");
              setStatusFilter("ALL");
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-50/90 text-slate-500 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider font-bold">
                  <th className="py-3.5 px-4 w-12 text-center">No</th>
                  <th className="py-3.5 px-4 w-32 text-center">Kategori</th>
                  <th className="py-3.5 px-4 w-36 text-center">Sumber (DPL/Mahasiswa)</th>
                  <th className="py-3.5 px-4 min-w-[280px]">Deskripsi</th>
                  <th className="py-3.5 px-4 w-44">Waktu Pelaksanaan</th>
                  <th className="py-3.5 px-4 w-32 font-bold">Biaya</th>
                  <th className="py-3.5 px-4 w-32 text-center">Status Pelaksanaan</th>
                  <th className="py-3.5 px-4 w-36 text-center">Bukti Kegiatan</th>
                  {canModifyProker && <th className="py-3.5 px-4 w-20 text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {paginatedProkers.map((p, idx) => {
                  const driveUrl = p.linkGoogleDrive || "https://drive.google.com";

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                        {(currentPage - 1) * itemsPerPage + idx + 1}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {renderKategoriBadge(p.kategori)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {renderSumberBadge(p.sumber)}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="text-slate-900 dark:text-slate-100 leading-relaxed font-normal">{p.deskripsi}</p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-medium">
                        {p.waktuPelaksanaan || "-"}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                        Rp {Number(p.kebutuhanBiaya || 0).toLocaleString("id-ID")}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {renderStatusPelaksanaanBadge(p.status)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <a
                          href={driveUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 text-emerald-700 bg-white dark:bg-slate-900 hover:bg-emerald-50 transition-all font-bold text-xs shadow-2xs cursor-pointer active:scale-95"
                          title="Buka Folder Bukti Google Drive"
                        >
                          <GoogleDriveIcon />
                          <span>Lihat Bukti</span>
                        </a>
                      </td>
                      {canModifyProker && (
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(p)}
                              title="Edit Program Kerja"
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors cursor-pointer"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() =>
                                setDeleteModal({
                                  isOpen: true,
                                  id: p.id,
                                  deskripsi: p.deskripsi,
                                })
                              }
                              title="Hapus Program Kerja"
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {filteredProkers.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredProkers.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            itemsPerPageOptions={[10, 25, 50, 100]}
          />
        )}
      </div>

      {/* Modal Add / Edit Form */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileSpreadsheet size={18} className="text-emerald-600" />
                {formMode === "add" ? "Tambah Program Kerja KKN" : "Edit Program Kerja KKN"}
              </h3>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kelompok KKN Binaan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.kelompokId}
                  onChange={(e) => setFormData({ ...formData, kelompokId: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Pilih Kelompok...</option>
                  {kelompokList.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.name} ({k.kelurahan || "Coblong"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kategori Program
                  </label>
                  <select
                    value={formData.kategori}
                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Pemilahan">Pemilahan</option>
                    <option value="Pengangkutan">Pengangkutan</option>
                    <option value="Pengolahan">Pengolahan</option>
                    <option value="Pemanfaatan">Pemanfaatan</option>
                    <option value="Edukasi & Sosialisasi">Edukasi & Sosialisasi</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Sumber Pengusul
                  </label>
                  <select
                    value={formData.sumber}
                    onChange={(e) => setFormData({ ...formData, sumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Mahasiswa">Mahasiswa</option>
                    <option value="DPL">DPL</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Deskripsi Rencana Kegiatan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Contoh: Sosialisasi dan pelatihan pemilahan sampah rumah tangga di 3 RT."
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Waktu & Tanggal Pelaksanaan (Pilih Kalender)
                </label>
                <div className="grid grid-cols-2 gap-2 mb-1.5">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block mb-0.5">Tanggal Mulai</span>
                    <input
                      type="date"
                      value={formStartDate}
                      onChange={(e) => handleDateChange(e.target.value, formEndDate)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block mb-0.5">Tanggal Selesai</span>
                    <input
                      type="date"
                      value={formEndDate}
                      onChange={(e) => handleDateChange(formStartDate, e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Contoh: 03 – 05 Agustus 2026"
                  value={formData.waktuPelaksanaan}
                  onChange={(e) => setFormData({ ...formData, waktuPelaksanaan: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kebutuhan Biaya (Rp)
                </label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={formData.kebutuhanBiaya}
                  onChange={(e) => setFormData({ ...formData, kebutuhanBiaya: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tautan Bukti Google Drive (URL)
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/drive/folders/..."
                  value={formData.linkGoogleDrive}
                  onChange={(e) => setFormData({ ...formData, linkGoogleDrive: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {formMode === "edit" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status Pelaksanaan
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="BELUM_DISETUJUI">Belum Disetujui</option>
                    <option value="DISETUJUI">Disetujui</option>
                    <option value="SEDANG_BERJALAN">Sedang Dilaksanakan</option>
                    <option value="SELESAI">Selesai Dilaksanakan</option>
                    <option value="DITOLAK">Tidak Disetujui</option>
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                  Simpan Program Kerja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Hapus Program Kerja KKN"
        message={`Apakah Anda yakin ingin menghapus rencana program kerja "${deleteModal.deskripsi}"?`}
        confirmText="Hapus Proker"
        cancelText="Batal"
        type="danger"
        onConfirm={handleDeleteProker}
        onClose={() => setDeleteModal({ isOpen: false, id: "", deskripsi: "" })}
      />
    </div>
  );
};

export default ProgramKerjaKkn;
