/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  FileSpreadsheet,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Search,
  Download,
  Loader2,
  X,
  XCircle,
  Coins,
  Clock,
  Calendar,
  RotateCcw,
  Check,
  AlertCircle,
  ListFilter,
  Users,
  GraduationCap,
  Phone,
  Eye,
  Building2,
  Play,
} from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import api from "../../services/api";
import { useAuthStore } from "../../store/useAuthStore";
import { dplService, type ProgramKerjaItem } from "../../services/dplService";
import { ConfirmModal } from "../../components/common/ConfirmModal";
import { Pagination } from "../../components/common/Pagination";
import { EmptyTableState } from "../../components/common/EmptyTableState";
import { sortKelompokList } from "../../utils/sortUtils";

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
  const isDeveloper = userRole === "DEVELOPER" || userRole === "SUPER_USER";
  const isManagement = ["SUPER_USER", "PANITIA_TASKFORCE", "DEVELOPER", "ADMIN_DLH"].includes(userRole);
  const isStudent = ["MAHASISWA_KKN", "MAHASISWA", "STUDENT"].includes(userRole);
  const isKetua = Boolean((user as any)?.isKetua || (user as any)?.studentProfile?.isKetua || (user as any)?.isLeader);
  const canModifyProker = isManagement || isDpl || (isStudent && isKetua);

  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [prokerList, setProkerList] = useState<ProgramKerjaItem[]>([]);
  const [kelompokList, setKelompokList] = useState<any[]>([]);

  // 5 Filter States (Termasuk Status Usulan & Status Pelaksanaan)
  const [selectedKelompokId, setSelectedKelompokId] = useState<string>(
    searchParams.get("kelompokId") || searchParams.get("groupId") || "ALL"
  );
  const [categoryFilter, setCategoryFilter] = useState<string>(
    searchParams.get("kategori") || searchParams.get("category") || "ALL"
  );
  const [sourceFilter, setSourceFilter] = useState<string>("ALL");
  const [statusUsulanFilter, setStatusUsulanFilter] = useState<string>(
    searchParams.get("statusUsulan") || "ALL"
  );
  const [statusPelaksanaanFilter, setStatusPelaksanaanFilter] = useState<string>(
    searchParams.get("statusPelaksanaan") || "ALL"
  );
  const [searchQuery, setSearchQuery] = useState<string>(
    searchParams.get("search") || searchParams.get("q") || ""
  );
  const [startDateFilter, setStartDateFilter] = useState<string>("");
  const [endDateFilter, setEndDateFilter] = useState<string>("");

  useEffect(() => {
    const q = searchParams.get("search") || searchParams.get("q");
    if (q !== null && q !== undefined) {
      setSearchQuery(q);
    }
    const kId = searchParams.get("kelompokId") || searchParams.get("groupId");
    if (kId) {
      setSelectedKelompokId(kId);
    }
    const su = searchParams.get("statusUsulan");
    if (su) {
      setStatusUsulanFilter(su);
    }
    const sp = searchParams.get("statusPelaksanaan");
    if (sp) {
      setStatusPelaksanaanFilter(sp);
    }
    const cat = searchParams.get("kategori") || searchParams.get("category");
    if (cat) {
      setCategoryFilter(cat);
    }
  }, [searchParams]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Modal State for Add / Edit
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    kelompokId: string;
    nomor: number;
    judul: string;
    deskripsi: string;
    kategori: string;
    sumber: string;
    waktuPelaksanaan: string;
    linkGoogleDrive: string;
    kebutuhanBiaya: number;
    status: ProgramKerjaItem["status"];
    statusUsulan: "BELUM_DISETUJUI" | "DISETUJUI" | "DITOLAK";
    statusPelaksanaan: "BELUM_MULAI" | "SEDANG_BERJALAN" | "SELESAI";
    catatanDpl: string;
  }>({
    kelompokId: "",
    nomor: 1,
    judul: "",
    deskripsi: "",
    kategori: "Pemilahan",
    sumber: "Mahasiswa",
    waktuPelaksanaan: "",
    linkGoogleDrive: "",
    kebutuhanBiaya: 0,
    status: "BELUM_DISETUJUI",
    statusUsulan: "BELUM_DISETUJUI",
    statusPelaksanaan: "BELUM_MULAI",
    catatanDpl: "",
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

  // Modal Reject Proker with Notes
  const [rejectModal, setRejectModal] = useState<{
    isOpen: boolean;
    id: string;
    deskripsi: string;
    catatanDpl: string;
    isSubmitting: boolean;
  }>({
    isOpen: false,
    id: "",
    deskripsi: "",
    catatanDpl: "",
    isSubmitting: false,
  });

  // Modal Roster Mahasiswa Kelompok (Khusus Developer / Super User)
  const [rosterModal, setRosterModal] = useState<{
    isOpen: boolean;
    kelompokName: string;
    kelurahan?: string;
    cakupanRw?: any;
    dplName?: string;
    mahasiswa: Array<{
      id: string;
      nama: string;
      nim: string;
      prodi?: string;
      isKetua?: boolean;
      phone?: string;
    }>;
    search: string;
  }>({
    isOpen: false,
    kelompokName: "",
    kelurahan: "",
    cakupanRw: [],
    dplName: "",
    mahasiswa: [],
    search: "",
  });

  // Modal Detail Lengkap Program Kerja KKN
  const [detailModal, setDetailModal] = useState<{
    isOpen: boolean;
    proker: ProgramKerjaItem | null;
  }>({
    isOpen: false,
    proker: null,
  });

  // Date Pickers
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");

  const getTodayDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getTomorrowDateString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const day = String(tomorrow.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatIndonesianTimestamp = (dateStr?: string | Date | null) => {
    if (!dateStr) return { date: "-", time: "-", full: "-" };
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { date: "-", time: "-", full: "-" };

    const dateFormatted = d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const timeFormatted = d.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    return {
      date: dateFormatted,
      time: `${timeFormatted} WIB`,
      full: `${dateFormatted}, ${timeFormatted} WIB`,
    };
  };

  const formatWaktuPelaksanaanDisplay = (rawStr?: string | null) => {
    if (!rawStr || !rawStr.trim() || rawStr === "-") return "-";
    const trimmed = rawStr.trim();
    
    const parts = trimmed.split(/\s+(?:-|s\/d|sampai)\s+/i);
    if (parts.length === 2) {
      const d1 = new Date(parts[0]);
      const d2 = new Date(parts[1]);
      if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
        const f1 = d1.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
        const f2 = d2.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
        return f1 === f2 ? f1 : `${f1} - ${f2}`;
      }
    }

    const singleDate = new Date(trimmed);
    if (!isNaN(singleDate.getTime()) && /^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      return singleDate.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }

    return trimmed;
  };

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
    const today = getTodayDateString();
    const tomorrow = getTomorrowDateString();

    // Validasi H+1: Rencana kegiatan baru minimal besok (tidak boleh hari ini atau masa lampau)
    if (formMode === "add" && start && start <= today) {
      toast.error("Waktu pelaksanaan rencana kegiatan baru minimal H+1 (mulai esok hari)");
      start = tomorrow;
    }

    // Validasi tanggal selesai tidak boleh mendahului tanggal mulai
    if (end && start && end < start) {
      toast.error("Tanggal selesai tidak boleh sebelum tanggal mulai");
      end = start;
    }

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
      // 1. Fetch Kelompok strictly scoped for DPL vs Management
      let groups: any[] = [];
      if (isDpl) {
        // DPL strictly gets only their own assigned groups
        const dplGroups = await dplService.getGroupSummary();
        if (Array.isArray(dplGroups) && dplGroups.length > 0) {
          groups = dplGroups.map((g: any) => ({
            id: g.id,
            name: g.name || g.namaKelompok,
            kelurahan: g.kelurahan,
            cakupanRw: g.cakupanRw,
          }));
        } else {
          // Fallback if DPL getGroupSummary returned empty:
          try {
            const kelRes = await api.get("/kelompok?limit=0");
            const list =
              kelRes.data?.groups ||
              kelRes.data?.data ||
              (Array.isArray(kelRes.data) ? kelRes.data : []);
            if (Array.isArray(list) && list.length > 0) {
              groups = list.map((g: any) => ({
                id: g.id,
                name: g.name,
                kelurahan: g.kelurahan,
                cakupanRw: g.cakupanRw,
              }));
            }
          } catch (e) {
            console.error("Gagal memuat fallback kelompok:", e);
          }
        }
      } else {
        // Management / Super User gets all groups
        try {
          const kelRes = await api.get("/kelompok?limit=0");
          const list =
            kelRes.data?.groups ||
            kelRes.data?.data ||
            (Array.isArray(kelRes.data) ? kelRes.data : []);
          if (Array.isArray(list) && list.length > 0) {
            groups = list.map((g: any) => ({
              id: g.id,
              name: g.name,
              kelurahan: g.kelurahan,
              cakupanRw: g.cakupanRw,
            }));
          }
        } catch (e) {
          console.error("Gagal memuat daftar kelompok master:", e);
        }
      }

      const sortedGroups = sortKelompokList(groups, (g: any) => g.name || "");
      setKelompokList(sortedGroups);

      // Auto set default selected group for DPL if only 1 group assigned
      let activeGroupId: string | undefined = undefined;
      if (isDpl && groups.length === 1) {
        setSelectedKelompokId(groups[0].id);
        activeGroupId = groups[0].id;
      } else if (selectedKelompokId !== "ALL") {
        activeGroupId = selectedKelompokId;
      }

      // 2. Fetch Program Kerja list
      const prokers = await dplService.getProgramKerja(activeGroupId, {
        kategori: categoryFilter !== "ALL" ? categoryFilter : undefined,
        statusUsulan: statusUsulanFilter !== "ALL" ? statusUsulanFilter : undefined,
        statusPelaksanaan: statusPelaksanaanFilter !== "ALL" ? statusPelaksanaanFilter : undefined,
        search: searchQuery.trim() ? searchQuery : undefined,
      });

      setProkerList(prokers);
    } catch (err: any) {
      console.error("Gagal memuat program kerja:", err);
      toast.error("Gagal memuat data program kerja");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedKelompokId, categoryFilter, sourceFilter, statusUsulanFilter, statusPelaksanaanFilter]);

  const handleOpenAddModal = () => {
    setFormMode("add");
    setEditingId(null);
    const tomorrow = getTomorrowDateString();
    setFormStartDate(tomorrow);
    setFormEndDate(tomorrow);
    const initialRange = formatIndonesianDateRange(tomorrow, tomorrow);

    let defaultKelompokId = "";
    if (selectedKelompokId && selectedKelompokId !== "ALL") {
      defaultKelompokId = selectedKelompokId;
    } else if (kelompokList.length > 0) {
      defaultKelompokId = kelompokList[0].id;
    }

    setFormData({
      kelompokId: defaultKelompokId,
      nomor: prokerList.length + 1,
      judul: "",
      deskripsi: "",
      kategori: "Pemilahan",
      sumber: isDpl ? "DPL" : "Mahasiswa",
      waktuPelaksanaan: initialRange,
      linkGoogleDrive: "",
      kebutuhanBiaya: 0,
      status: "BELUM_DISETUJUI",
      statusUsulan: "BELUM_DISETUJUI",
      statusPelaksanaan: "BELUM_MULAI",
      catatanDpl: "",
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (item: ProgramKerjaItem) => {
    setFormMode("edit");
    setEditingId(item.id);
    setFormStartDate("");
    setFormEndDate("");

    const normU = normalizeStatusUsulan(item.statusUsulan, item.status);
    const normP = normalizeStatusPelaksanaan(item.statusPelaksanaan, item.status);

    setFormData({
      kelompokId: item.kelompokId || (kelompokList.length > 0 ? kelompokList[0].id : ""),
      nomor: item.nomor || 1,
      judul: item.judul || "",
      deskripsi: item.deskripsi,
      kategori: item.kategori || "Pemilahan",
      sumber: item.sumber || "Mahasiswa",
      waktuPelaksanaan: item.waktuPelaksanaan || "",
      linkGoogleDrive: item.linkGoogleDrive || "",
      kebutuhanBiaya: Number(item.kebutuhanBiaya) || 0,
      status: item.status || "BELUM_DISETUJUI",
      statusUsulan: normU,
      statusPelaksanaan: normP,
      catatanDpl: item.catatanDpl || "",
    });
    setIsFormModalOpen(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveKelompokId =
      formData.kelompokId ||
      (selectedKelompokId !== "ALL" ? selectedKelompokId : "") ||
      (kelompokList.length > 0 ? kelompokList[0].id : "");

    if (!effectiveKelompokId || !formData.deskripsi.trim()) {
      toast.error("Kelompok dan deskripsi kegiatan wajib diisi");
      return;
    }

    const today = getTodayDateString();
    if (formMode === "add" && formStartDate && formStartDate <= today) {
      toast.error("Tanggal rencana kegiatan baru minimal H+1 (mulai esok hari)");
      return;
    }

    if (formStartDate && formEndDate && formEndDate < formStartDate) {
      toast.error("Tanggal selesai tidak boleh lebih awal dari tanggal mulai");
      return;
    }
      setIsSubmitting(true);
      try {
        if (formMode === "add") {
          await dplService.createProgramKerja({
            kelompokId: effectiveKelompokId,
            nomor: Number(formData.nomor),
            judul: formData.judul.trim(),
            deskripsi: formData.deskripsi.trim(),
            kategori: formData.kategori,
            sumber: formData.sumber,
            waktuPelaksanaan: formData.waktuPelaksanaan,
            linkGoogleDrive: formData.linkGoogleDrive,
            kebutuhanBiaya: Number(formData.kebutuhanBiaya) || 0,
            statusUsulan: formData.statusUsulan,
            statusPelaksanaan: formData.statusPelaksanaan,
          });
          toast.success("Rencana program kerja berhasil ditambahkan");
        } else if (editingId) {
          await dplService.updateProgramKerja(editingId, {
            nomor: Number(formData.nomor),
            judul: formData.judul.trim(),
            deskripsi: formData.deskripsi.trim(),
            kategori: formData.kategori,
            sumber: formData.sumber,
            waktuPelaksanaan: formData.waktuPelaksanaan,
            linkGoogleDrive: formData.linkGoogleDrive,
            kebutuhanBiaya: Number(formData.kebutuhanBiaya) || 0,
            status: formData.status,
            statusUsulan: formData.statusUsulan,
            statusPelaksanaan: formData.statusPelaksanaan,
            catatanDpl: formData.catatanDpl,
          });
          toast.success("Rencana program kerja berhasil diperbarui");
        }

        fetchData();
        setIsFormModalOpen(false);
      } catch (err: any) {
        toast.error(err.message || "Terjadi kesalahan saat menyimpan");
      } finally {
        setIsSubmitting(false);
      }
    };

  // Quick Action: Approve (ACC) Proker
  const handleApproveProker = async (proker: ProgramKerjaItem) => {
    try {
      await dplService.decideProgramKerja(proker.id, "DITERIMA");
      toast.success(`Program kerja #${proker.nomor} berhasil disetujui (ACC)`);
      fetchData();
    } catch (err: any) {
      console.error("Gagal menyetujui program kerja:", err);
      toast.error(err.response?.data?.message || "Gagal menyetujui program kerja");
    }
  };

  // Quick Action: Mulai Pelaksanaan Proker (BELUM_MULAI -> SEDANG_BERJALAN)
  const handleStartProker = async (proker: ProgramKerjaItem) => {
    try {
      await dplService.decideProgramKerja(
        proker.id,
        "SEDANG_BERJALAN",
        undefined,
        undefined,
        "SEDANG_BERJALAN"
      );
      toast.success(`Program kerja #${proker.nomor} berhasil diaktifkan: Sedang Berjalan`);
      fetchData();
    } catch (err: any) {
      console.error("Gagal memulai program kerja:", err);
      toast.error(err.response?.data?.message || "Gagal memulai program kerja");
    }
  };

  // Quick Action: Reject Modal Submit
  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModal.id) return;
    if (!rejectModal.catatanDpl.trim()) {
      toast.error("Alasan penolakan / catatan revisi wajib diisi");
      return;
    }

    setRejectModal((prev) => ({ ...prev, isSubmitting: true }));
    try {
      await dplService.decideProgramKerja(
        rejectModal.id,
        "DITOLAK",
        rejectModal.catatanDpl.trim()
      );
      toast.success("Program kerja berhasil ditolak dengan catatan evaluasi");
      setRejectModal({
        isOpen: false,
        id: "",
        deskripsi: "",
        catatanDpl: "",
        isSubmitting: false,
      });
      fetchData();
    } catch (err: any) {
      console.error("Gagal menolak program kerja:", err);
      toast.error(err.response?.data?.message || "Gagal menolak program kerja");
      setRejectModal((prev) => ({ ...prev, isSubmitting: false }));
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

  // Normalizer Status Usulan (Menunggu Persetujuan, Disetujui, Ditolak, Kadaluarsa)
  const normalizeStatusUsulan = (statusUsulan?: string, legacyStatus?: string): "BELUM_DISETUJUI" | "DISETUJUI" | "DITOLAK" | "KADALUARSA" => {
    let u = String(statusUsulan || "").toUpperCase();
    const leg = String(legacyStatus || "").toUpperCase();
    if (!u) {
      if (leg === "DITERIMA" || leg === "DISETUJUI" || leg === "SEDANG_BERJALAN" || leg === "SELESAI") u = "DISETUJUI";
      else if (leg === "DITOLAK" || leg === "TIDAK_DISETUJUI") u = "DITOLAK";
      else u = "BELUM_DISETUJUI";
    }
    if (u === "DISETUJUI" || u === "DITERIMA") return "DISETUJUI";
    if (u === "KADALUARSA_OTOMATIS" || u === "KADALUARSA") return "KADALUARSA";
    if (u === "DITOLAK" || u === "TIDAK_DISETUJUI") return "DITOLAK";
    return "BELUM_DISETUJUI";
  };

  // Normalizer Status Pelaksanaan (Belum Mulai, Sedang Berjalan, Selesai)
  const normalizeStatusPelaksanaan = (statusPelaksanaan?: string, legacyStatus?: string): "BELUM_MULAI" | "SEDANG_BERJALAN" | "SELESAI" => {
    let p = statusPelaksanaan;
    const leg = String(legacyStatus || "").toUpperCase();
    if (!p) {
      if (leg === "SELESAI") p = "SELESAI";
      else if (leg === "SEDANG_BERJALAN" || leg === "SEDANG_DILAKSANAKAN" || leg === "BERJALAN") p = "SEDANG_BERJALAN";
      else p = "BELUM_MULAI";
    }
    if (p === "SELESAI") return "SELESAI";
    if (p === "SEDANG_BERJALAN" || p === "SEDANG_DILAKSANAKAN" || p === "BERJALAN") return "SEDANG_BERJALAN";
    return "BELUM_MULAI";
  };

  // Filtered proker data
  const filteredProkers = useMemo(() => {
    return prokerList.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (item.deskripsi || "").toLowerCase().includes(q) ||
        (item.judul || "").toLowerCase().includes(q) ||
        (item.kelompokName || "").toLowerCase().includes(q) ||
        (item.kelurahan || "").toLowerCase().includes(q) ||
        (item.penginput?.nama || "").toLowerCase().includes(q) ||
        (item.penginput?.nim || "").toLowerCase().includes(q) ||
        (item.dplName || "").toLowerCase().includes(q) ||
        (item.mahasiswaList || []).some(
          (m) => (m.nama || "").toLowerCase().includes(q) || (m.nim || "").toLowerCase().includes(q)
        );

      const matchesCategory =
        categoryFilter === "ALL" ||
        (item.kategori || "Pemilahan").toLowerCase() === categoryFilter.toLowerCase();

      const matchesSource =
        sourceFilter === "ALL" ||
        (item.sumber || "Mahasiswa").toLowerCase() === sourceFilter.toLowerCase();

      const normU = normalizeStatusUsulan(item.statusUsulan, item.status);
      const matchesUsulan = statusUsulanFilter === "ALL" || normU === statusUsulanFilter;

      const normP = normalizeStatusPelaksanaan(item.statusPelaksanaan, item.status);
      const matchesPelaksanaan = statusPelaksanaanFilter === "ALL" || normP === statusPelaksanaanFilter;

      let matchesDate = true;
      if (startDateFilter && item.createdAt) {
        const startTs = new Date(`${startDateFilter}T00:00:00`).getTime();
        if (new Date(item.createdAt).getTime() < startTs) matchesDate = false;
      }
      if (endDateFilter && item.createdAt) {
        const endTs = new Date(`${endDateFilter}T23:59:59`).getTime();
        if (new Date(item.createdAt).getTime() > endTs) matchesDate = false;
      }

      return matchesSearch && matchesCategory && matchesSource && matchesUsulan && matchesPelaksanaan && matchesDate;
    });
  }, [prokerList, searchQuery, categoryFilter, sourceFilter, statusUsulanFilter, statusPelaksanaanFilter, startDateFilter, endDateFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedKelompokId, categoryFilter, sourceFilter, statusUsulanFilter, statusPelaksanaanFilter, startDateFilter, endDateFilter]);

  const totalPages = Math.ceil(filteredProkers.length / itemsPerPage) || 1;
  const paginatedProkers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProkers.slice(start, start + itemsPerPage);
  }, [filteredProkers, currentPage, itemsPerPage]);

  // Metric KPI Computations
  const totalCount = prokerList.length;
  const pendingCount = prokerList.filter((p) => normalizeStatusUsulan(p.statusUsulan, p.status) === "BELUM_DISETUJUI").length;
  const pendingPct = totalCount > 0 ? ((pendingCount / totalCount) * 100).toFixed(2).replace(".", ",") : "0,00";

  const disetujuiCount = prokerList.filter((p) => normalizeStatusUsulan(p.statusUsulan, p.status) === "DISETUJUI").length;
  const disetujuiPct = totalCount > 0 ? ((disetujuiCount / totalCount) * 100).toFixed(2).replace(".", ",") : "0,00";

  const sedangBerjalanCount = prokerList.filter((p) => normalizeStatusPelaksanaan(p.statusPelaksanaan, p.status) === "SEDANG_BERJALAN").length;
  const selesaiCount = prokerList.filter((p) => normalizeStatusPelaksanaan(p.statusPelaksanaan, p.status) === "SELESAI").length;

  const totalBiaya = prokerList.reduce((acc, p) => acc + (Number(p.kebutuhanBiaya) || 0), 0);

  const handleExportXlsx = () => {
    if (!startDateFilter || !endDateFilter) {
      toast.error("Pilih tanggal awal dan tanggal akhir terlebih dahulu sebelum mengekspor.");
      return;
    }

    if (filteredProkers.length === 0) {
      toast.error("Tidak ada data program kerja pada rentang tanggal yang dipilih.");
      return;
    }

    const headers = [
      "No",
      "Waktu Dibuat",
      "Kelompok",
      "Kelurahan",
      "RW",
      "DPL Pembimbing",
      "Pengisi Data",
      "NIM",
      "Kategori",
      "Sumber",
      "Judul Program",
      "Deskripsi Kegiatan",
      "Waktu Pelaksanaan",
      "Estimasi Biaya (Rp)",
      "Status Usulan",
      "Status Pelaksanaan",
      "Catatan DPL",
      "Bukti Google Drive",
    ];

    const rows = filteredProkers.map((p, idx) => {
      const rwText = Array.isArray(p.cakupanRw) ? p.cakupanRw.join(", ") : "-";
      return [
        p.nomor || idx + 1,
        formatIndonesianTimestamp(p.createdAt).full,
        p.kelompokName || "-",
        p.kelurahan || "-",
        rwText,
        p.dplName || "-",
        p.penginput?.nama || (p.sumber === "DPL" ? "DPL" : "Mahasiswa"),
        p.penginput?.nim || "-",
        p.kategori || "Pemilahan",
        p.sumber || "Mahasiswa",
        p.judul || "-",
        p.deskripsi || "-",
        p.waktuPelaksanaan || "-",
        Number(p.kebutuhanBiaya || 0),
        normalizeStatusUsulan(p.statusUsulan, p.status),
        normalizeStatusPelaksanaan(p.statusPelaksanaan, p.status),
        p.catatanDpl || "-",
        p.linkGoogleDrive || "-",
      ];
    });

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws["!cols"] = [
      { wch: 6 },
      { wch: 22 },
      { wch: 18 },
      { wch: 16 },
      { wch: 10 },
      { wch: 22 },
      { wch: 22 },
      { wch: 15 },
      { wch: 18 },
      { wch: 12 },
      { wch: 25 },
      { wch: 40 },
      { wch: 20 },
      { wch: 18 },
      { wch: 20 },
      { wch: 20 },
      { wch: 25 },
      { wch: 25 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Program_Kerja");
    XLSX.writeFile(wb, `Program_Kerja_KKN_${startDateFilter}_sd_${endDateFilter}.xlsx`);
    toast.success(`Data program kerja (${filteredProkers.length} baris) berhasil diekspor ke XLSX!`);
  };

  const renderKategoriBadge = (kat?: string) => {
    const k = (kat || "Pemilahan").toLowerCase();
    if (k.includes("pemilahan")) {
      return (
        <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 rounded-full font-bold text-[11px]">
          Pemilahan
        </span>
      );
    }
    if (k.includes("pengangkutan")) {
      return (
        <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50 rounded-full font-bold text-[11px]">
          Pengangkutan
        </span>
      );
    }
    if (k.includes("pengolahan")) {
      return (
        <span className="px-2.5 py-1 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50 rounded-full font-bold text-[11px]">
          Pengolahan
        </span>
      );
    }
    if (k.includes("pemanfaatan") || k === "fisik") {
      return (
        <span className="px-2.5 py-1 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/50 rounded-full font-bold text-[11px]">
          Pemanfaatan
        </span>
      );
    }
    if (k.includes("edukasi") || k.includes("sosialisasi") || k === "non-fisik") {
      return (
        <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 rounded-full font-bold text-[11px]">
          Edukasi & Sosialisasi
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-full font-bold text-[11px]">
        {kat || "Lainnya"}
      </span>
    );
  };

  const renderSumberBadge = (sumber?: string) => {
    const s = (sumber || "Mahasiswa").toLowerCase();
    if (s.includes("dpl")) {
      return (
        <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 rounded-lg font-bold text-[11px]">
          DPL
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50 rounded-lg font-bold text-[11px]">
        Mahasiswa
      </span>
    );
  };

  const renderStatusUsulanBadge = (statusUsulan?: string, legacyStatus?: string, catatanDpl?: string | null) => {
    const st = normalizeStatusUsulan(statusUsulan, legacyStatus);
    switch (st) {
      case "BELUM_DISETUJUI":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 rounded-full font-bold text-[11px] shadow-2xs">
            <Clock size={12} className="shrink-0 text-amber-600 dark:text-amber-400" />
            <span>Menunggu</span>
          </span>
        );
      case "DISETUJUI":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 rounded-full font-bold text-[11px] shadow-2xs">
            <CheckCircle2 size={12} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>Disetujui</span>
          </span>
        );
      case "DITOLAK":
        return (
          <div className="flex flex-col items-center gap-1" title={catatanDpl || "Ditolak DPL"}>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 rounded-full font-bold text-[11px] shadow-2xs">
              <XCircle size={12} className="shrink-0 text-rose-600 dark:text-rose-400" />
              <span>Ditolak</span>
            </span>
            {catatanDpl && (
              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold max-w-[150px] truncate" title={catatanDpl}>
                {catatanDpl}
              </span>
            )}
          </div>
        );
      case "KADALUARSA":
        return (
          <div className="flex flex-col items-center gap-1" title={catatanDpl || "Dibatalkan otomatis oleh sistem (H+5)"}>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-full font-bold text-[11px] shadow-2xs">
              <Clock size={12} className="shrink-0 text-slate-500" />
              <span>Kadaluarsa (H+5)</span>
            </span>
            {catatanDpl && (
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold max-w-[150px] truncate" title={catatanDpl}>
                {catatanDpl}
              </span>
            )}
          </div>
        );
    }
  };

  const renderStatusPelaksanaanBadge = (statusPelaksanaan?: string, legacyStatus?: string) => {
    const pl = normalizeStatusPelaksanaan(statusPelaksanaan, legacyStatus);
    switch (pl) {
      case "SELESAI":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/40">
            Selesai
          </span>
        );
      case "SEDANG_BERJALAN":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/40">
            Sedang Berlangsung
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/60">
            Belum Mulai
          </span>
        );
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-800 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Program Kerja KKN
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Menampilkan status usulan (persetujuan DPL) dan status pelaksanaan program kerja mahasiswa KKN.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-3.5 py-2 rounded-xl text-xs font-bold shadow-2xs">
            <Coins size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span>Estimasi Biaya: Rp {totalBiaya.toLocaleString("id-ID")}</span>
          </div>
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

      {/* 4 Stat Cards Metrik Utama Program Kerja */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Total Program Kerja */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">Total Program Kerja</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
              <FileSpreadsheet size={17} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">{totalCount}</h3>
            <span className="text-[11px] text-slate-400 font-medium">Semua usulan kegiatan KKN</span>
          </div>
        </div>

        {/* Card 2: Menunggu Persetujuan */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-700 dark:text-amber-400 font-bold">Menunggu Persetujuan</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200/60 dark:border-amber-800/40">
              <Clock size={17} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400">{pendingCount}</h3>
            <span className="text-[11px] text-amber-700/80 dark:text-amber-400/80 font-medium">{pendingPct}% dari total</span>
          </div>
        </div>

        {/* Card 3: Disetujui */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold">Disetujui (ACC DPL)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/60 dark:border-emerald-800/40">
              <CheckCircle2 size={17} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{disetujuiCount}</h3>
            <span className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 font-medium">{disetujuiPct}% dari total</span>
          </div>
        </div>

        {/* Card 4: Pelaksanaan */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-blue-200/80 dark:border-blue-900/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-blue-700 dark:text-blue-400 font-bold">Pelaksanaan</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200/60 dark:border-blue-800/40">
              <ListFilter size={17} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <div>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{sedangBerjalanCount}</span>
              <span className="text-[10px] text-slate-500 ml-1 font-semibold">Sedang Berlangsung</span>
            </div>
            <span className="text-slate-300">•</span>
            <div>
              <span className="text-lg font-black text-blue-600 dark:text-blue-400">{selesaiCount}</span>
              <span className="text-[10px] text-slate-500 ml-1 font-semibold">Selesai</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar Filter */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 flex-1 max-w-5xl">
            {/* Filter 1: Kelompok */}
            <div>
              <span className="text-[10.5px] font-bold text-slate-500 block mb-1">Kelompok</span>
              {isDpl && kelompokList.length <= 1 ? (
                <div className="w-full px-3 py-2 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-1.5 shadow-2xs">
                  <span className="truncate">{kelompokList[0]?.name || "Kelompok Binaan Anda"}</span>
                  <span className="text-[9.5px] uppercase font-black bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded shrink-0">
                    Binaan
                  </span>
                </div>
              ) : (
                <select
                  value={selectedKelompokId}
                  onChange={(e) => setSelectedKelompokId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none focus:border-emerald-500 focus:bg-white transition cursor-pointer"
                >
                  {isManagement && <option value="ALL">Semua Kelompok</option>}
                  {kelompokList.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.name}
                    </option>
                  ))}
                </select>
              )}
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

            {/* Filter 4: Status Usulan */}
            <div>
              <span className="text-[10.5px] font-bold text-slate-500 block mb-1">Status Usulan</span>
              <select
                value={statusUsulanFilter}
                onChange={(e) => setStatusUsulanFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none focus:border-emerald-500 focus:bg-white transition cursor-pointer"
              >
                <option value="ALL">Semua Usulan</option>
                <option value="BELUM_DISETUJUI">Menunggu Persetujuan</option>
                <option value="DISETUJUI">Disetujui</option>
                <option value="DITOLAK">Ditolak</option>
                <option value="KADALUARSA">Kadaluarsa (H+5)</option>
              </select>
            </div>

            {/* Filter 5: Status Pelaksanaan */}
            <div>
              <span className="text-[10.5px] font-bold text-slate-500 block mb-1">Status Pelaksanaan</span>
              <select
                value={statusPelaksanaanFilter}
                onChange={(e) => setStatusPelaksanaanFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none focus:border-emerald-500 focus:bg-white transition cursor-pointer"
              >
                <option value="ALL">Semua Pelaksanaan</option>
                <option value="BELUM_MULAI">Belum Mulai</option>
                <option value="SEDANG_BERJALAN">Sedang Berlangsung</option>
                <option value="SELESAI">Selesai</option>
              </select>
            </div>
          </div>

          {/* Filter 6: Cari Program Kerja */}
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

        {/* Sub Filter Row: Date Range & Ekspor XLSX */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 font-semibold flex items-center gap-1 text-[11px]">
              <Calendar size={13} className="text-emerald-600" /> Filter Tanggal Dibuat:
            </span>
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
            />
            <span className="text-slate-400 text-xs">s/d</span>
            <input
              type="date"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
            />
            {(startDateFilter || endDateFilter) && (
              <button
                type="button"
                onClick={() => {
                  setStartDateFilter("");
                  setEndDateFilter("");
                }}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 ml-1 cursor-pointer"
              >
                <RotateCcw size={11} /> Reset
              </button>
            )}

            {/* 1 Tombol Standar Ekspor XLSX */}
            <button
              type="button"
              onClick={handleExportXlsx}
              disabled={!startDateFilter || !endDateFilter}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700/60 cursor-pointer ml-1"
              title={(!startDateFilter || !endDateFilter) ? "Pilih tanggal awal dan tanggal akhir terlebih dahulu untuk mengekspor" : "Ekspor data program kerja ke XLSX"}
            >
              <FileSpreadsheet size={13} />
              <span>Ekspor XLSX</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="animate-spin text-emerald-600" size={32} />
            <span className="text-xs font-semibold">Memuat rencana program kerja...</span>
          </div>
        ) : filteredProkers.length === 0 ? (
          <EmptyTableState
            entityName="Program Kerja KKN"
            isSearch={!!(searchQuery || (selectedKelompokId !== "ALL" && !isDpl) || categoryFilter !== "ALL" || sourceFilter !== "ALL" || statusUsulanFilter !== "ALL" || statusPelaksanaanFilter !== "ALL")}
            searchQuery={searchQuery}
            onResetSearch={() => {
              setSearchQuery("");
              if (isManagement) setSelectedKelompokId("ALL");
              setCategoryFilter("ALL");
              setSourceFilter("ALL");
              setStatusUsulanFilter("ALL");
              setStatusPelaksanaanFilter("ALL");
            }}
          />
        ) : (
          <>
            {/* Desktop Table View (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 dark:bg-slate-800/90 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider font-bold">
                    <th className="py-3.5 px-3 w-12 text-center">No</th>
                    <th className="py-3.5 px-3 w-36 text-center">Waktu Dibuat</th>
                    {isDeveloper && <th className="py-3.5 px-3 min-w-[170px] text-left">Kelompok & Wilayah</th>}
                    {isDeveloper && <th className="py-3.5 px-3 min-w-[190px] text-left">Pengisi Data / Mahasiswa</th>}
                    <th className="py-3.5 px-3 w-28 text-center">Kategori</th>
                    <th className="py-3.5 px-3 w-24 text-center">Sumber</th>
                    <th className="py-3.5 px-4 min-w-[200px]">Judul Program</th>
                    <th className="py-3.5 px-4 min-w-[240px] max-w-xs">Deskripsi Kegiatan</th>
                    <th className="py-3.5 px-3 w-40">Waktu Pelaksanaan</th>
                    <th className="py-3.5 px-3 w-32 font-bold">Biaya</th>
                    <th className="py-3.5 px-3 w-36 text-center">Status Usulan</th>
                    <th className="py-3.5 px-3 w-36 text-center">Status Pelaksanaan</th>
                    <th className="py-3.5 px-3 w-28 text-center">Bukti</th>
                    {canModifyProker && <th className="py-3.5 px-4 w-48 text-center">Aksi / Tindakan</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {paginatedProkers.map((p, idx) => {
                    const driveUrl = p.linkGoogleDrive || "https://drive.google.com";
                    const normalizedU = normalizeStatusUsulan(p.statusUsulan, p.status);
                    const normalizedP = normalizeStatusPelaksanaan(p.statusPelaksanaan, p.status);
                    const timestampInfo = formatIndonesianTimestamp(p.createdAt);

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 dark:bg-slate-800/80 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3.5 px-3 text-center font-bold text-slate-400">
                          {(currentPage - 1) * itemsPerPage + idx + 1}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <div className="inline-flex flex-col items-center justify-center">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1">
                              <Calendar size={11} className="text-slate-400 shrink-0" />
                              {timestampInfo.date}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                              <Clock size={10} className="text-slate-400 shrink-0" />
                              {timestampInfo.time}
                            </span>
                          </div>
                        </td>
                        {isDeveloper && (
                          <td className="py-3.5 px-3">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                                {p.kelompokName || "Kelompok KKN"}
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                {p.kelurahan ? `Kel. ${p.kelurahan}` : "-"}
                                {p.cakupanRw && Array.isArray(p.cakupanRw) && p.cakupanRw.length > 0
                                  ? ` • RW ${p.cakupanRw.join(", ")}`
                                  : ""}
                              </span>
                              {p.dplName && (
                                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1 mt-0.5">
                                  <GraduationCap size={11} className="shrink-0 text-indigo-500" />
                                  <span>DPL: {p.dplName}</span>
                                </span>
                              )}
                            </div>
                          </td>
                        )}
                        {isDeveloper && (
                          <td className="py-3.5 px-3">
                            <div className="flex flex-col gap-1">
                              {p.penginput ? (
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                                      {p.penginput.nama}
                                    </span>
                                    {p.penginput.isKetua && (
                                      <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded text-[9px] font-bold">
                                        Ketua Kelompok
                                      </span>
                                    )}
                                    {p.penginput.role === "DPL" && (
                                      <span className="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 rounded text-[9px] font-bold">
                                        DPL
                                      </span>
                                    )}
                                  </div>
                                  {p.penginput.nim && (
                                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                      NIM: {p.penginput.nim} {p.penginput.prodi ? `• ${p.penginput.prodi}` : ""}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-slate-500 font-medium">
                                  {p.sumber === "DPL" ? "DPL" : "Mahasiswa"}
                                </span>
                              )}

                              {p.mahasiswaList && p.mahasiswaList.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setRosterModal({
                                      isOpen: true,
                                      kelompokName: p.kelompokName,
                                      kelurahan: p.kelurahan,
                                      cakupanRw: p.cakupanRw,
                                      dplName: p.dplName,
                                      mahasiswa: p.mahasiswaList || [],
                                      search: "",
                                    })
                                  }
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/50 text-[10px] font-semibold transition-all cursor-pointer w-fit mt-0.5 active:scale-95 shadow-2xs"
                                  title="Buka daftar lengkap mahasiswa dalam kelompok ini"
                                >
                                  <Users size={11} />
                                  <span>{p.mahasiswaList.length} Mahasiswa Kelompok</span>
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                        <td className="py-3.5 px-3 text-center">
                          {renderKategoriBadge(p.kategori)}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          {renderSumberBadge(p.sumber)}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="text-slate-900 dark:text-slate-100 font-bold line-clamp-2" title={p.judul || "-"}>
                            {p.judul || "-"}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <p className="text-slate-900 dark:text-slate-100 leading-relaxed font-normal line-clamp-3" title={p.deskripsi}>
                            {p.deskripsi}
                          </p>
                        </td>
                        <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400 font-medium">
                          {formatWaktuPelaksanaanDisplay(p.waktuPelaksanaan)}
                        </td>
                        <td className="py-3.5 px-3 font-bold text-slate-900 dark:text-slate-100">
                          Rp {Number(p.kebutuhanBiaya || 0).toLocaleString("id-ID")}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          {renderStatusUsulanBadge(p.statusUsulan, p.status, p.catatanDpl)}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          {renderStatusPelaksanaanBadge(p.statusPelaksanaan, p.status)}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <a
                            href={driveUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-all font-bold text-xs shadow-2xs cursor-pointer active:scale-95"
                            title="Buka Folder Bukti Google Drive"
                          >
                            <GoogleDriveIcon />
                            <span>Bukti</span>
                          </a>
                        </td>
                        {canModifyProker && (
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-2 flex-wrap">
                              {/* Quick Details Inspection */}
                              <button
                                onClick={() => setDetailModal({ isOpen: true, proker: p })}
                                title="Lihat Detail Program Kerja & Pengusul"
                                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                              >
                                <Eye size={13} />
                              </button>

                              {/* Decision Actions when Menunggu Persetujuan */}
                              {normalizedU === "BELUM_DISETUJUI" && (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleApproveProker(p)}
                                    title="Setujui (ACC) Program Kerja"
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-95"
                                  >
                                    <Check size={13} strokeWidth={3} />
                                    <span>Setujui</span>
                                  </button>
                                  <button
                                    onClick={() =>
                                      setRejectModal({
                                        isOpen: true,
                                        id: p.id,
                                        deskripsi: p.deskripsi,
                                        catatanDpl: "",
                                        isSubmitting: false,
                                      })
                                    }
                                    title="Tolak Program Kerja dengan Catatan"
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 font-bold text-xs transition-all cursor-pointer active:scale-95"
                                  >
                                    <X size={13} strokeWidth={3} />
                                    <span>Tolak</span>
                                  </button>
                                </div>
                              )}

                              {/* Decision Action when Ditolak or Kadaluarsa -> quick re-approve */}
                              {(normalizedU === "DITOLAK" || normalizedU === "KADALUARSA") && (
                                <button
                                  onClick={() => handleApproveProker(p)}
                                  title="Ubah Keputusan jadi Disetujui (ACC Ulang)"
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-xs transition-all cursor-pointer active:scale-95"
                                >
                                  <Check size={13} strokeWidth={3} />
                                  <span>Setujui</span>
                                </button>
                              )}

                              {/* Decision Action when Disetujui -> option to start execution or reject */}
                              {normalizedU === "DISETUJUI" && (
                                <div className="flex items-center gap-1">
                                  {normalizedP === "BELUM_MULAI" && (
                                    <button
                                      onClick={() => handleStartProker(p)}
                                      title="Mulai Pelaksanaan Program Kerja (Ubah status jadi Sedang Berjalan)"
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all cursor-pointer shadow-2xs active:scale-95"
                                    >
                                      <Play size={12} fill="currentColor" />
                                      <span>Mulai</span>
                                    </button>
                                  )}
                                  {normalizedP !== "SELESAI" && (
                                    <button
                                      onClick={() =>
                                        setRejectModal({
                                          isOpen: true,
                                          id: p.id,
                                          deskripsi: p.deskripsi,
                                          catatanDpl: p.catatanDpl || "",
                                          isSubmitting: false,
                                        })
                                      }
                                      title="Tolak / Minta Revisi"
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-600 dark:text-slate-400 hover:text-rose-600 border border-slate-200 dark:border-slate-700 font-bold text-xs transition-all cursor-pointer active:scale-95"
                                    >
                                      <X size={13} />
                                      <span>Tolak</span>
                                    </button>
                                  )}
                                </div>
                              )}
                              {/* Standard Edit & Delete */}
                              <div className="flex items-center gap-1 ml-1 pl-1 border-l border-slate-200 dark:border-slate-800">
                                <button
                                  onClick={() => handleOpenEditModal(p)}
                                  title="Edit Detail Program Kerja"
                                  className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
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
                                  className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (< md) */}
            <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedProkers.map((p, idx) => {
                const driveUrl = p.linkGoogleDrive || "https://drive.google.com";
                const normalizedU = normalizeStatusUsulan(p.statusUsulan, p.status);
                const normalizedP = normalizeStatusPelaksanaan(p.statusPelaksanaan, p.status);
                const timestampInfo = formatIndonesianTimestamp(p.createdAt);
                const rowNumber = (currentPage - 1) * itemsPerPage + idx + 1;

                return (
                  <div
                    key={p.id}
                    className="p-4 space-y-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    {/* Top Row: No, Badges, Timestamp */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
                          #{rowNumber}
                        </span>
                        {renderKategoriBadge(p.kategori)}
                        {renderSumberBadge(p.sumber)}
                      </div>
                      <div className="flex flex-col items-end text-[10px] text-slate-400 dark:text-slate-500 font-medium shrink-0">
                        <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                          <Calendar size={10} className="text-slate-400" />
                          {timestampInfo.date}
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <Clock size={9} className="text-slate-400" />
                          {timestampInfo.time}
                        </span>
                      </div>
                    </div>

                    {/* Developer Info: Kelompok & Penginput */}
                    {isDeveloper && (
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800/80 text-xs space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 truncate">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                            {p.kelompokName || "Kelompok KKN"}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 shrink-0">
                            {p.kelurahan ? `Kel. ${p.kelurahan}` : "-"}
                          </span>
                        </div>
                        {p.dplName && (
                          <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
                            <GraduationCap size={11} className="shrink-0" />
                            <span>DPL: {p.dplName}</span>
                          </div>
                        )}
                        {p.penginput && (
                          <div className="text-[11px] text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between">
                            <span>Pengusul: <strong className="text-slate-800 dark:text-slate-200">{p.penginput.nama}</strong></span>
                            {p.penginput.nim && <span className="font-mono text-[10px] text-slate-400">({p.penginput.nim})</span>}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Judul & Deskripsi */}
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug">
                        {p.judul || "-"}
                      </h4>
                      <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed line-clamp-3" title={p.deskripsi}>
                        {p.deskripsi}
                      </p>
                    </div>

                    {/* Info Grid: Waktu & Biaya */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-medium">Waktu Pelaksanaan</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs mt-0.5 block truncate" title={p.waktuPelaksanaan || "-"}>
                          {formatWaktuPelaksanaanDisplay(p.waktuPelaksanaan)}
                        </span>
                      </div>
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-medium">Estimasi Biaya</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-xs mt-0.5 block">
                          Rp {Number(p.kebutuhanBiaya || 0).toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>

                    {/* Status Badges & Bukti */}
                    <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        {renderStatusUsulanBadge(p.statusUsulan, p.status, p.catatanDpl)}
                        {renderStatusPelaksanaanBadge(p.statusPelaksanaan, p.status)}
                      </div>
                      <a
                        href={driveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                      >
                        <GoogleDriveIcon />
                        <span>Bukti</span>
                      </a>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                      <button
                        onClick={() => setDetailModal({ isOpen: true, proker: p })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs transition-colors cursor-pointer"
                      >
                        <Eye size={13} />
                        <span>Detail</span>
                      </button>

                      {canModifyProker && (
                        <div className="flex items-center gap-1.5 ml-auto flex-wrap">
                          {normalizedU === "BELUM_DISETUJUI" && (
                            <>
                              <button
                                onClick={() => handleApproveProker(p)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-all active:scale-95 cursor-pointer"
                              >
                                <Check size={13} strokeWidth={3} />
                                <span>Setujui</span>
                              </button>
                              <button
                                onClick={() =>
                                  setRejectModal({
                                    isOpen: true,
                                    id: p.id,
                                    deskripsi: p.deskripsi,
                                    catatanDpl: "",
                                    isSubmitting: false,
                                  })
                                }
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 font-bold text-xs transition-all active:scale-95 cursor-pointer"
                              >
                                <X size={13} strokeWidth={3} />
                                <span>Tolak</span>
                              </button>
                            </>
                          )}

                          {/* Decision Action when Ditolak or Kadaluarsa -> quick re-approve */}
                          {(normalizedU === "DITOLAK" || normalizedU === "KADALUARSA") && (
                            <button
                              onClick={() => handleApproveProker(p)}
                              title="Ubah Keputusan jadi Disetujui (ACC Ulang)"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-xs transition-all cursor-pointer active:scale-95"
                            >
                              <Check size={13} strokeWidth={3} />
                              <span>Setujui</span>
                            </button>
                          )}

                          {/* Decision Action when Disetujui -> option to start execution or reject */}
                          {normalizedU === "DISETUJUI" && (
                            <div className="flex items-center gap-1">
                              {normalizedP === "BELUM_MULAI" && (
                                <button
                                  onClick={() => handleStartProker(p)}
                                  title="Mulai Pelaksanaan Program Kerja (Ubah status jadi Sedang Berjalan)"
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all cursor-pointer shadow-2xs active:scale-95"
                                >
                                  <Play size={12} fill="currentColor" />
                                  <span>Mulai</span>
                                </button>
                              )}
                              {normalizedP !== "SELESAI" && (
                                <button
                                  onClick={() =>
                                    setRejectModal({
                                      isOpen: true,
                                      id: p.id,
                                      deskripsi: p.deskripsi,
                                      catatanDpl: p.catatanDpl || "",
                                      isSubmitting: false,
                                    })
                                  }
                                  title="Tolak / Minta Revisi"
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-600 dark:text-slate-400 hover:text-rose-600 border border-slate-200 dark:border-slate-700 font-bold text-xs transition-all cursor-pointer active:scale-95"
                                >
                                  <X size={13} />
                                  <span>Tolak</span>
                                </button>
                              )}
                            </div>
                          )}

                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            title="Edit"
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
                            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in" onClick={() => setIsFormModalOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileSpreadsheet size={18} className="text-emerald-600" />
                {formMode === "add" ? "Tambah Program Kerja KKN" : "Edit Program Kerja KKN"}
              </h3>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kelompok KKN Binaan <span className="text-rose-500">*</span>
                </label>
                {isDpl && kelompokList.length <= 1 ? (
                  <div className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 font-bold flex items-center justify-between">
                    <span>{kelompokList[0]?.name || "Kelompok Binaan"} ({kelompokList[0]?.kelurahan ? `Kel. ${kelompokList[0]?.kelurahan}` : "Wilayah Binaan"})</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/50">
                      Otomatis
                    </span>
                  </div>
                ) : (
                  <select
                    value={formData.kelompokId}
                    onChange={(e) => setFormData({ ...formData, kelompokId: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Pilih Kelompok...</option>
                    {kelompokList.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.name} ({k.kelurahan ? `Kel. ${k.kelurahan}` : "Wilayah Dampingan"})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kategori Program
                  </label>
                  <select
                    value={formData.kategori}
                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-emerald-500 cursor-pointer"
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
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="Mahasiswa">Mahasiswa</option>
                    <option value="DPL">DPL</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Judul Program <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Sosialisasi Maggot BSF"
                  value={formData.judul}
                  onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none mb-3"
                />
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
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none"
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
                      min={formMode === "add" ? getTomorrowDateString() : undefined}
                      value={formStartDate}
                      onChange={(e) => handleDateChange(e.target.value, formEndDate)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block mb-0.5">Tanggal Selesai</span>
                    <input
                      type="date"
                      min={formStartDate || (formMode === "add" ? getTomorrowDateString() : undefined)}
                      value={formEndDate}
                      onChange={(e) => handleDateChange(formStartDate, e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    />
                  </div>
                </div>
                <p className="text-[10.5px] text-amber-600 dark:text-amber-400 font-medium mb-1.5">
                  *Rencana kegiatan baru wajib H+1 (mulai esok hari, tidak dapat memilih hari ini atau masa lampau).
                </p>
                <input
                  type="text"
                  placeholder="Contoh: 19 – 20 Agustus 2026"
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
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 font-semibold"
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
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Status Usulan
                      </label>
                      <select
                        value={formData.statusUsulan}
                        onChange={(e) => setFormData({ ...formData, statusUsulan: e.target.value as any })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                      >
                        <option value="BELUM_DISETUJUI">Menunggu Persetujuan</option>
                        <option value="DISETUJUI">Disetujui</option>
                        <option value="DITOLAK">Ditolak</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Status Pelaksanaan
                      </label>
                      <select
                        value={formData.statusPelaksanaan}
                        onChange={(e) => setFormData({ ...formData, statusPelaksanaan: e.target.value as any })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                      >
                        <option value="BELUM_MULAI">Belum Mulai</option>
                        <option value="SEDANG_BERJALAN">Sedang Berlangsung</option>
                        <option value="SELESAI">Selesai</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Catatan DPL (Opsional / Evaluasi)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Masukkan catatan evaluasi atau alasan penolakan..."
                      value={formData.catatanDpl}
                      onChange={(e) => setFormData({ ...formData, catatanDpl: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                  Simpan Program Kerja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Rejection Note for DPL */}
      {rejectModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in" onClick={() => setRejectModal({ isOpen: false, id: "", deskripsi: "", catatanDpl: "", isSubmitting: false })}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle size={18} />
                Tolak Program Kerja KKN
              </h3>
              <button
                onClick={() => setRejectModal({ isOpen: false, id: "", deskripsi: "", catatanDpl: "", isSubmitting: false })}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Anda akan menolak rencana kegiatan: <span className="font-bold text-slate-800 dark:text-slate-200">"{rejectModal.deskripsi}"</span>. Silakan berikan catatan revisi atau alasan penolakan bagi mahasiswa.
            </p>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan Evaluasi / Alasan Penolakan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Contoh: Rencana biaya melebihi alokasi, harap sesuaikan dengan rincian kebutuhan lapangan."
                  value={rejectModal.catatanDpl}
                  onChange={(e) => setRejectModal({ ...rejectModal, catatanDpl: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setRejectModal({ isOpen: false, id: "", deskripsi: "", catatanDpl: "", isSubmitting: false })}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={rejectModal.isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {rejectModal.isSubmitting && <Loader2 size={14} className="animate-spin" />}
                  Konfirmasi Tolak
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Roster Mahasiswa Kelompok (Khusus Developer / Super User) */}
      {rosterModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in" onClick={() => setRosterModal({ isOpen: false, proker: null, search: "" })}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-2xl shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4 max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                    <Users size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                      Daftar Mahasiswa KKN
                    </h3>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 font-bold">
                      {rosterModal.kelompokName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 pt-1 flex-wrap">
                  {rosterModal.kelurahan && (
                    <span className="flex items-center gap-1">
                      <Building2 size={12} className="text-slate-400" />
                      Kel. {rosterModal.kelurahan}
                    </span>
                  )}
                  {rosterModal.cakupanRw && Array.isArray(rosterModal.cakupanRw) && rosterModal.cakupanRw.length > 0 && (
                    <span>• RW {rosterModal.cakupanRw.join(", ")}</span>
                  )}
                  {rosterModal.dplName && (
                    <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold">
                      <GraduationCap size={12} />
                      DPL: {rosterModal.dplName}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() =>
                  setRosterModal({
                    isOpen: false,
                    kelompokName: "",
                    kelurahan: "",
                    cakupanRw: [],
                    dplName: "",
                    mahasiswa: [],
                    search: "",
                  })
                }
                className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search & Filter */}
            <div className="flex items-center justify-between gap-3 shrink-0">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Cari nama atau NIM mahasiswa..."
                  value={rosterModal.search}
                  onChange={(e) => setRosterModal({ ...rosterModal, search: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-emerald-500 focus:bg-white"
                />
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
              <span className="text-xs font-bold text-slate-500 shrink-0 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl">
                {rosterModal.mahasiswa.length} Mahasiswa
              </span>
            </div>

            {/* Student List Grid */}
            <div className="overflow-y-auto pr-1 space-y-2 flex-1">
              {rosterModal.mahasiswa.filter((m) => {
                const q = rosterModal.search.toLowerCase().trim();
                return !q || m.nama.toLowerCase().includes(q) || m.nim.includes(q) || (m.prodi || "").toLowerCase().includes(q);
              }).length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Tidak ada mahasiswa yang sesuai dengan pencarian.
                </div>
              ) : (
                rosterModal.mahasiswa
                  .filter((m) => {
                    const q = rosterModal.search.toLowerCase().trim();
                    return !q || m.nama.toLowerCase().includes(q) || m.nim.includes(q) || (m.prodi || "").toLowerCase().includes(q);
                  })
                  .map((m, idx) => (
                    <div
                      key={m.id || idx}
                      className="p-3 bg-slate-50/80 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-700/60 rounded-2xl flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          m.isKetua
                            ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700"
                            : "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300"
                        }`}>
                          {m.nama.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                              {m.nama}
                            </span>
                            {m.isKetua && (
                              <span className="px-1.5 py-0.5 bg-amber-500 text-white rounded-md text-[9px] font-extrabold uppercase tracking-wider">
                                Ketua
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            NIM: {m.nim} {m.prodi ? `• ${m.prodi}` : ""}
                          </p>
                        </div>
                      </div>

                      {m.phone && m.phone !== "-" && (
                        <a
                          href={`https://wa.me/${m.phone.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold shadow-2xs transition-colors shrink-0"
                          title="Hubungi via WhatsApp"
                        >
                          <Phone size={11} />
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </div>
                  ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() =>
                  setRosterModal({
                    isOpen: false,
                    kelompokName: "",
                    kelurahan: "",
                    cakupanRw: [],
                    dplName: "",
                    mahasiswa: [],
                    search: "",
                  })
                }
                className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail Lengkap Program Kerja KKN */}
      {detailModal.isOpen && detailModal.proker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in" onClick={() => setDetailModal({ isOpen: false, proker: null })}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-2xl shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-[10px] uppercase">
                  Program Kerja #{detailModal.proker.nomor}
                </span>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mt-1">
                  {detailModal.proker.judul || "Detail Program Kerja KKN"}
                </h3>
              </div>
              <button
                onClick={() => setDetailModal({ isOpen: false, proker: null })}
                className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Badges Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Kategori</span>
                <div>{renderKategoriBadge(detailModal.proker.kategori)}</div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Sumber</span>
                <div>{renderSumberBadge(detailModal.proker.sumber)}</div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Status Usulan</span>
                <div>{renderStatusUsulanBadge(detailModal.proker.statusUsulan, detailModal.proker.status, detailModal.proker.catatanDpl)}</div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Pelaksanaan</span>
                <div>{renderStatusPelaksanaanBadge(detailModal.proker.statusPelaksanaan, detailModal.proker.status)}</div>
              </div>
            </div>

            {/* Kelompok & Pengisi Data Overview */}
            <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200/70 dark:border-emerald-900/40 space-y-2">
              <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 size={13} />
                Informasi Kelompok & Pengusul
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Nama Kelompok:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {detailModal.proker.kelompokName}
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {detailModal.proker.kelurahan ? `Kelurahan ${detailModal.proker.kelurahan}` : ""}
                    {detailModal.proker.cakupanRw && Array.isArray(detailModal.proker.cakupanRw) && detailModal.proker.cakupanRw.length > 0
                      ? ` • RW ${detailModal.proker.cakupanRw.join(", ")}`
                      : ""}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Dosen Pembimbing (DPL):</span>
                  <span className="font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1">
                    <GraduationCap size={13} />
                    {detailModal.proker.dplName || "-"}
                  </span>
                  {detailModal.proker.penginput && (
                    <div className="mt-1 pt-1 border-t border-emerald-200/40 dark:border-emerald-800/40">
                      <span className="text-slate-500 dark:text-slate-400 text-[10px] block">Pengisi Data Proker:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {detailModal.proker.penginput.nama} {detailModal.proker.penginput.nim ? `(${detailModal.proker.penginput.nim})` : ""}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Deskripsi Kegiatan */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Deskripsi Kegiatan
              </label>
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                {detailModal.proker.deskripsi}
              </div>
            </div>

            {/* Waktu & Biaya & Bukti */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold block mb-1 flex items-center gap-1">
                  <Calendar size={11} /> Waktu Pelaksanaan
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {formatWaktuPelaksanaanDisplay(detailModal.proker.waktuPelaksanaan)}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold block mb-1 flex items-center gap-1">
                  <Coins size={11} /> Estimasi Biaya
                </span>
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  Rp {Number(detailModal.proker.kebutuhanBiaya || 0).toLocaleString("id-ID")}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between">
                <span className="text-[10px] text-slate-400 font-bold block mb-1">
                  Dokumen Bukti
                </span>
                <a
                  href={detailModal.proker.linkGoogleDrive || "https://drive.google.com"}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-2xs transition-colors"
                >
                  <GoogleDriveIcon />
                  <span>Buka Google Drive</span>
                </a>
              </div>
            </div>

            {/* Catatan DPL if exists */}
            {detailModal.proker.catatanDpl && (
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 rounded-2xl text-xs">
                <span className="font-bold text-amber-900 dark:text-amber-300 block mb-0.5 flex items-center gap-1">
                  <AlertCircle size={13} />
                  Catatan / Evaluasi DPL
                </span>
                <p className="text-amber-800 dark:text-amber-200">
                  {detailModal.proker.catatanDpl}
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Dibuat pada: {formatIndonesianTimestamp(detailModal.proker.createdAt).full}
              </span>
              <button
                type="button"
                onClick={() => setDetailModal({ isOpen: false, proker: null })}
                className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
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
