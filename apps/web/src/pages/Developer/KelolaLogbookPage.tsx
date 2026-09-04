/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Halaman Khusus Role DEVELOPER:
 * MANAJEMEN & CRUD LOGBOOK MAHASISWA (MANUAL SUPPORT & OVERRIDE)
 */

import React, { useEffect, useState, useMemo } from "react";
import {
  BookOpen,
  Plus,
  Search,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Eye,
  Pencil,
  Trash2,
  X,
  Upload,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../utils/api";
import {
  logbookApiService,
  type LogbookMahasiswaItem,
} from "../../services/logbookService";
import { dplService, type GroupSummary } from "../../services/dplService";
import { resolveImageUrl } from "../../utils/imageUrl";
import { PageHeader } from "../../components/common/PageHeader";

interface StudentOption {
  userId: string;
  name: string;
  nim: string;
  kelompokId?: string;
  kelompokNama?: string;
  jurusan?: string;
  isKetua?: boolean;
}

export const KelolaLogbookPage: React.FC = () => {
  // State Utama Data
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [logbooks, setLogbooks] = useState<LogbookMahasiswaItem[]>([]);
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);

  // State Filter & Pencarian
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedTipe, setSelectedTipe] = useState("ALL");
  const [selectedPekan, setSelectedPekan] = useState<string>("ALL");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");

  // State Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // State Modal Create / Input Manual
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    penulisId: "",
    kelompokId: "",
    tanggalKegiatan: new Date().toISOString().split("T")[0],
    waktuMulai: "08:00",
    waktuSelesai: "11:00",
    tempat: "",
    deskripsi: "",
    tipeAktivitas: "KELOMPOK" as "KELOMPOK" | "INDIVIDU",
    pekanKe: 1,
    statusApproval: "DISETUJUI_DPL" as const,
    catatanDpl: "Diinput manual & diverifikasi oleh Developer Support.",
    fotoUrlManual: "",
  });
  const [createPhotoFile, setCreatePhotoFile] = useState<File | null>(null);
  const [createPhotoPreview, setCreatePhotoPreview] = useState<string | null>(null);
  const [studentSearchKeyword, setStudentSearchKeyword] = useState("");

  // State Modal Edit / Koreksi
  const [showEditModal, setShowEditModal] = useState(false);
  const [editItem, setEditItem] = useState<LogbookMahasiswaItem | null>(null);
  const [editForm, setEditForm] = useState({
    penulisId: "",
    kelompokId: "",
    tanggalKegiatan: "",
    waktuMulai: "",
    waktuSelesai: "",
    tempat: "",
    deskripsi: "",
    tipeAktivitas: "KELOMPOK" as "KELOMPOK" | "INDIVIDU",
    pekanKe: 1,
    statusApproval: "DISETUJUI_DPL" as any,
    catatanDpl: "",
    fotoBuktiUrl: "",
  });
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null);

  // State Modal Detail
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailItem, setDetailItem] = useState<LogbookMahasiswaItem | null>(null);

  // State Modal Double Verification Delete
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetItem, setDeleteTargetItem] = useState<LogbookMahasiswaItem | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");

  // State Modal Konfigurasi Toleransi
  const [showToleranceModal, setShowToleranceModal] = useState(false);
  const [currentToleranceDays, setCurrentToleranceDays] = useState<number>(90);
  const [newToleranceDays, setNewToleranceDays] = useState<number>(90);

  // Fetch Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [logbookRes, groupRes] = await Promise.all([
        logbookApiService.getMahasiswaLogbooks(),
        dplService.getGroupSummary(),
      ]);

      setLogbooks(Array.isArray(logbookRes) ? logbookRes : []);
      setGroups(Array.isArray(groupRes) ? groupRes : []);

      // Ambil daftar mahasiswa
      try {
        const studentRes = await api.get("/admin/mahasiswa?limit=1500");
        if (studentRes.data?.data && Array.isArray(studentRes.data.data)) {
          const mapped: StudentOption[] = studentRes.data.data.map((u: any) => ({
            userId: u.id,
            name: u.name || "Mahasiswa",
            nim: u.studentProfile?.nim || u.nim || "-",
            kelompokId: u.studentProfile?.kelompokId || u.studentProfile?.kelompok?.id,
            kelompokNama: u.studentProfile?.kelompok?.name || u.kelompokNama || "Belum Ada Kelompok",
            jurusan: u.studentProfile?.jurusan || "-",
            isKetua: Boolean(u.studentProfile?.isKetua),
          }));
          setStudents(mapped);
        }
      } catch (err) {
        console.warn("[KelolaLogbookPage] Gagal memuat daftar mahasiswa:", err);
      }

      // Ambil toleransi backdate
      try {
        const tolRes = await logbookApiService.getToleranceConfig();
        if (tolRes && typeof tolRes.toleranceDays === "number") {
          setCurrentToleranceDays(tolRes.toleranceDays);
          setNewToleranceDays(tolRes.toleranceDays);
        }
      } catch {
        // default 90
      }
    } catch (err: any) {
      console.error("[KelolaLogbookPage] Fetch error:", err);
      toast.error(err.message || "Gagal memuat data logbook");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter Data
  const filteredLogbooks = useMemo(() => {
    return logbooks.filter((item) => {
      if (selectedGroup !== "ALL" && item.kelompokId !== selectedGroup) return false;
      if (selectedStatus !== "ALL" && item.statusApproval !== selectedStatus) return false;
      if (selectedTipe !== "ALL" && item.tipeAktivitas !== selectedTipe) return false;
      if (selectedPekan !== "ALL" && String(item.pekanKe) !== selectedPekan) return false;
      if (startDateFilter && item.tanggalKegiatan < startDateFilter) return false;
      if (endDateFilter && item.tanggalKegiatan > endDateFilter) return false;
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const matchName = (item.penulisNama || "").toLowerCase().includes(q);
        const matchNim = (item.penulisNim || "").toLowerCase().includes(q);
        const matchKelompok = (item.kelompokNama || "").toLowerCase().includes(q);
        const matchTempat = (item.tempat || "").toLowerCase().includes(q);
        const matchDeskripsi = (item.deskripsi || "").toLowerCase().includes(q);
        if (!matchName && !matchNim && !matchKelompok && !matchTempat && !matchDeskripsi) {
          return false;
        }
      }
      return true;
    });
  }, [
    logbooks,
    selectedGroup,
    selectedStatus,
    selectedTipe,
    selectedPekan,
    startDateFilter,
    endDateFilter,
    searchQuery,
  ]);

  // Statistik Ringkasan
  const stats = useMemo(() => {
    const total = logbooks.length;
    const disetujui = logbooks.filter((l) => l.statusApproval === "DISETUJUI_DPL").length;
    const menungguDpl = logbooks.filter((l) => l.statusApproval === "MENUNGGU_VERIFIKASI_DPL").length;
    const revisi = logbooks.filter(
      (l) => l.statusApproval === "PERLU_REVISI_DPL" || l.statusApproval === "DITOLAK_KETUA"
    ).length;
    return { total, disetujui, menungguDpl, revisi };
  }, [logbooks]);

  // Pagination Slice
  const totalPages = Math.max(1, Math.ceil(filteredLogbooks.length / pageSize));
  const paginatedLogbooks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogbooks.slice(start, start + pageSize);
  }, [filteredLogbooks, currentPage, pageSize]);

  // Filter Mahasiswa untuk Dropdown Modal
  const filteredStudentsForCreate = useMemo(() => {
    if (!studentSearchKeyword.trim()) return students.slice(0, 50);
    const q = studentSearchKeyword.toLowerCase();
    return students
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.nim.toLowerCase().includes(q) ||
          (s.kelompokNama || "").toLowerCase().includes(q)
      )
      .slice(0, 50);
  }, [students, studentSearchKeyword]);

  const handleSelectStudentForCreate = (student: StudentOption) => {
    setCreateForm((prev) => ({
      ...prev,
      penulisId: student.userId,
      kelompokId: student.kelompokId || prev.kelompokId,
    }));
  };

  const handleCreatePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCreatePhotoFile(file);
      setCreatePhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleEditPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEditPhotoFile(file);
      setEditPhotoPreview(URL.createObjectURL(file));
    }
  };

  // Submit Create (Manual Input)
  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.penulisId) {
      toast.error("Pilih mahasiswa terlebih dahulu!");
      return;
    }
    if (!createForm.tempat.trim()) {
      toast.error("Tempat kegiatan wajib diisi!");
      return;
    }
    if (!createForm.deskripsi.trim()) {
      toast.error("Deskripsi kegiatan wajib diisi!");
      return;
    }
    if (!createPhotoFile && !createForm.fotoUrlManual) {
      toast.error("Lampirkan foto bukti kegiatan (unggah file atau masukkan URL foto)!");
      return;
    }

    setActionLoading(true);
    try {
      const formData = new FormData();
      formData.append("penulisId", createForm.penulisId);
      if (createForm.kelompokId) formData.append("kelompokId", createForm.kelompokId);
      formData.append("tanggalKegiatan", createForm.tanggalKegiatan);
      formData.append("waktuMulai", createForm.waktuMulai);
      formData.append("waktuSelesai", createForm.waktuSelesai);
      formData.append("tempat", createForm.tempat);
      formData.append("deskripsi", createForm.deskripsi);
      formData.append("tipeAktivitas", createForm.tipeAktivitas);
      formData.append("pekanKe", String(createForm.pekanKe));
      formData.append("statusApproval", createForm.statusApproval);
      formData.append("catatanDpl", createForm.catatanDpl);
      formData.append("platformOs", "DEVELOPER_OVERRIDE");

      if (createPhotoFile) {
        formData.append("foto", createPhotoFile);
      } else if (createForm.fotoUrlManual) {
        formData.append("fotoBuktiUrl", createForm.fotoUrlManual);
      }

      await logbookApiService.createMahasiswaLogbook(formData);
      toast.success("Logbook berhasil diinput manual dan disetujui!");
      setShowCreateModal(false);
      setCreateForm({
        penulisId: "",
        kelompokId: "",
        tanggalKegiatan: new Date().toISOString().split("T")[0],
        waktuMulai: "08:00",
        waktuSelesai: "11:00",
        tempat: "",
        deskripsi: "",
        tipeAktivitas: "KELOMPOK",
        pekanKe: 1,
        statusApproval: "DISETUJUI_DPL",
        catatanDpl: "Diinput manual & diverifikasi oleh Developer Support.",
        fotoUrlManual: "",
      });
      setCreatePhotoFile(null);
      setCreatePhotoPreview(null);
      setStudentSearchKeyword("");
      fetchData();
    } catch (err: any) {
      console.error("[KelolaLogbookPage] Submit create error:", err);
      toast.error(err.response?.data?.message || err.message || "Gagal menyimpan logbook");
    } finally {
      setActionLoading(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (item: LogbookMahasiswaItem) => {
    setEditItem(item);
    setEditForm({
      penulisId: item.penulisId,
      kelompokId: item.kelompokId,
      tanggalKegiatan: item.tanggalKegiatan || new Date().toISOString().split("T")[0],
      waktuMulai: item.waktuMulai || "08:00",
      waktuSelesai: item.waktuSelesai || "11:00",
      tempat: item.tempat || "",
      deskripsi: item.deskripsi || "",
      tipeAktivitas: item.tipeAktivitas || "KELOMPOK",
      pekanKe: item.pekanKe || 1,
      statusApproval: item.statusApproval || "DISETUJUI_DPL",
      catatanDpl: item.catatanDpl || "",
      fotoBuktiUrl: item.fotoBuktiUrl || "",
    });
    setEditPhotoFile(null);
    setEditPhotoPreview(item.fotoBuktiUrl ? resolveImageUrl(item.fotoBuktiUrl) : null);
    setShowEditModal(true);
  };

  // Submit Edit
  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    if (!editForm.tempat.trim()) {
      toast.error("Tempat kegiatan wajib diisi!");
      return;
    }
    if (!editForm.deskripsi.trim()) {
      toast.error("Deskripsi kegiatan wajib diisi!");
      return;
    }

    setActionLoading(true);
    try {
      const formData = new FormData();
      if (editForm.penulisId) formData.append("penulisId", editForm.penulisId);
      if (editForm.kelompokId) formData.append("kelompokId", editForm.kelompokId);
      formData.append("tanggalKegiatan", editForm.tanggalKegiatan);
      formData.append("waktuMulai", editForm.waktuMulai);
      formData.append("waktuSelesai", editForm.waktuSelesai);
      formData.append("tempat", editForm.tempat);
      formData.append("deskripsi", editForm.deskripsi);
      formData.append("tipeAktivitas", editForm.tipeAktivitas);
      formData.append("pekanKe", String(editForm.pekanKe));
      formData.append("statusApproval", editForm.statusApproval);
      if (editForm.catatanDpl) formData.append("catatanDpl", editForm.catatanDpl);

      if (editPhotoFile) {
        formData.append("foto", editPhotoFile);
      } else if (editForm.fotoBuktiUrl) {
        formData.append("fotoBuktiUrl", editForm.fotoBuktiUrl);
      }

      await logbookApiService.updateMahasiswaLogbook(editItem.id, formData);
      toast.success("Data logbook berhasil diperbarui!");
      setShowEditModal(false);
      setEditItem(null);
      fetchData();
    } catch (err: any) {
      console.error("[KelolaLogbookPage] Submit edit error:", err);
      toast.error(err.response?.data?.message || err.message || "Gagal memperbarui logbook");
    } finally {
      setActionLoading(false);
    }
  };

  // Quick Approve
  const handleQuickApprove = async (item: LogbookMahasiswaItem) => {
    try {
      await logbookApiService.verifikasiByDpl(item.id, "APPROVE", "Disetujui langsung oleh Developer");
      toast.success(`Logbook ${item.penulisNama} berhasil diverifikasi & disetujui!`);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Gagal memverifikasi logbook");
    }
  };

  // Open Delete Modal
  const handleOpenDelete = (item: LogbookMahasiswaItem) => {
    setDeleteTargetItem(item);
    setDeleteConfirmationText("");
    setShowDeleteModal(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deleteTargetItem) return;
    if (deleteConfirmationText.trim().toUpperCase() !== "HAPUS") {
      toast.error("Ketik kata 'HAPUS' dengan benar untuk mengonfirmasi!");
      return;
    }

    setActionLoading(true);
    try {
      await logbookApiService.deleteMahasiswaLogbook(deleteTargetItem.id);
      toast.success("Logbook aktivitas berhasil dihapus permanen.");
      setShowDeleteModal(false);
      setDeleteTargetItem(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Gagal menghapus logbook");
    } finally {
      setActionLoading(false);
    }
  };

  // Save Tolerance
  const handleSaveTolerance = async () => {
    if (newToleranceDays < 0) {
      toast.error("Toleransi hari tidak boleh negatif!");
      return;
    }
    setActionLoading(true);
    try {
      await logbookApiService.updateToleranceConfig(newToleranceDays);
      setCurrentToleranceDays(newToleranceDays);
      toast.success(`Toleransi backdate berhasil diatur menjadi ${newToleranceDays} hari (H-${newToleranceDays})!`);
      setShowToleranceModal(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Gagal mengubah toleransi");
    } finally {
      setActionLoading(false);
    }
  };

  // Helper Format Tanggal + Jam Menit — untuk kolom "Waktu Diinput" (createdAt)
  const formatDateTime = (dateStr: string): { date: string; time: string } => {
    if (!dateStr) return { date: "-", time: "" };
    try {
      const d = new Date(dateStr);
      const date = d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
      const time = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false });
      return { date, time };
    } catch {
      return { date: dateStr, time: "" };
    }
  };

  // Status Badge Helper
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "DISETUJUI_DPL":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 size={12} className="text-emerald-600" />
            Disetujui DPL
          </span>
        );
      case "MENUNGGU_VERIFIKASI_DPL":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Clock size={12} className="text-amber-600" />
            Menunggu DPL
          </span>
        );
      case "MENUNGGU_PERSETUJUAN_KETUA":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            <Clock size={12} className="text-sky-600" />
            Menunggu Ketua
          </span>
        );
      case "PERLU_REVISI_DPL":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <AlertTriangle size={12} className="text-rose-600" />
            Perlu Revisi
          </span>
        );
      case "DITOLAK_KETUA":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            <XCircle size={12} className="text-slate-500" />
            Ditolak Ketua
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header (Standard Clean BERSEKA Layout) */}
      <PageHeader
        icon={BookOpen}
        category="Developer Tools"
        scope="Logbook Mahasiswa Support"
        title="Manajemen Logbook Mahasiswa"
        description="Bantuan input manual & koreksi data logbook mahasiswa yang mengalami kendala sistem, batas toleransi, atau kendala lapangan."
        actions={
          <>
            <button
              onClick={() => setShowToleranceModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all shadow-2xs cursor-pointer"
            >
              <Sliders size={14} className="text-slate-500" />
              Toleransi: H-{currentToleranceDays} Hari
            </button>
            <button
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? "animate-spin text-[#035941]" : "text-slate-500"} />
              Muat Ulang
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#035941] hover:bg-[#02402e] text-white transition-all shadow-xs cursor-pointer active:scale-98"
            >
              <Plus size={15} />
              Input Logbook Manual
            </button>
          </>
        }
      />

      {/* 2. Stat Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
            <BookOpen size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Logbook</p>
            <p className="text-xl font-black text-slate-900 dark:text-slate-100 mt-0.5">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Disetujui DPL</p>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.disetujui}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Menunggu DPL</p>
            <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{stats.menungguDpl}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Perlu Revisi / Ditolak</p>
            <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5">{stats.revisi}</p>
          </div>
        </div>
      </div>

      {/* 3. Filter & Search Controls */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari nama mahasiswa, NIM, kelompok, tempat, atau deskripsi..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#035941]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            onClick={() => {
              setSelectedGroup("ALL");
              setSelectedStatus("ALL");
              setSelectedTipe("ALL");
              setSelectedPekan("ALL");
              setStartDateFilter("");
              setEndDateFilter("");
              setSearchQuery("");
              setCurrentPage(1);
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all shrink-0 cursor-pointer"
          >
            Reset Filter
          </button>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Kelompok KKN</label>
            <select
              value={selectedGroup}
              onChange={(e) => {
                setSelectedGroup(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">Semua Kelompok</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Status Persetujuan</label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">Semua Status</option>
              <option value="DISETUJUI_DPL">Disetujui DPL</option>
              <option value="MENUNGGU_VERIFIKASI_DPL">Menunggu DPL</option>
              <option value="MENUNGGU_PERSETUJUAN_KETUA">Menunggu Ketua</option>
              <option value="PERLU_REVISI_DPL">Perlu Revisi DPL</option>
              <option value="DITOLAK_KETUA">Ditolak Ketua</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Tipe Aktivitas</label>
            <select
              value={selectedTipe}
              onChange={(e) => {
                setSelectedTipe(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">Semua Tipe</option>
              <option value="KELOMPOK">Kelompok</option>
              <option value="INDIVIDU">Individu</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Pekan Ke-</label>
            <select
              value={selectedPekan}
              onChange={(e) => {
                setSelectedPekan(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">Semua Pekan</option>
              <option value="1">Pekan 1</option>
              <option value="2">Pekan 2</option>
              <option value="3">Pekan 3</option>
              <option value="4">Pekan 4</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Rentang Tanggal</label>
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={startDateFilter}
                onChange={(e) => {
                  setStartDateFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px]"
              />
              <span className="text-xs text-slate-400">-</span>
              <input
                type="date"
                value={endDateFilter}
                onChange={(e) => {
                  setEndDateFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Table Logbook */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Daftar Logbook Mahasiswa ({filteredLogbooks.length} Data)
          </span>
          <span className="text-xs text-slate-500">
            Halaman {currentPage} dari {totalPages}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold text-[11px]">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Mahasiswa & NIM</th>
                <th className="py-3 px-4">Kelompok & Wilayah</th>
                <th className="py-3 px-4">Tgl Kegiatan &amp; Tgl Diinput</th>
                <th className="py-3 px-4">Aktivitas & Tempat</th>
                <th className="py-3 px-4 text-center">Bukti Foto</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-500">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2 text-[#035941]" />
                    <p className="font-semibold text-xs">Memuat data logbook...</p>
                  </td>
                </tr>
              ) : paginatedLogbooks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <BookOpen size={36} className="mx-auto mb-2 opacity-30" />
                    <p className="font-bold text-xs text-slate-600 dark:text-slate-400">Tidak ada data logbook</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Silakan sesuaikan filter atau kata kunci pencarian.</p>
                  </td>
                </tr>
              ) : (
                paginatedLogbooks.map((item, idx) => {
                  const rowNum = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 text-center font-bold text-slate-400">
                        {rowNum}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            {item.penulisNama}
                            {item.isKetua && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                                KETUA
                              </span>
                            )}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            NIM: {item.penulisNim || "-"}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#035941] dark:text-emerald-400">
                            {item.kelompokNama}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Kel. {item.kelurahan || "-"}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-col space-y-0.5">
                          {/* Tanggal Kegiatan — diisi mahasiswa, bisa backdate */}
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {item.tanggalKegiatan}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {item.waktuMulai || "08:00"} - {item.waktuSelesai || "11:00"}
                          </span>
                          <span className="inline-block w-fit px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            Pekan {item.pekanKe}
                          </span>
                          {/* Divider */}
                          <div className="pt-1 border-t border-dashed border-slate-200 dark:border-slate-700 mt-0.5" />
                          {/* Waktu Diinput — createdAt, server timestamp */}
                          <div className="flex items-center gap-1 pt-0.5">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                            <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wide">
                              Diinput
                            </span>
                          </div>
                          <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                            {formatDateTime(item.createdAt).date}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {formatDateTime(item.createdAt).time} WIB
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <div className="space-y-0.5">
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {item.tipeAktivitas}
                          </span>
                          <p className="font-bold text-slate-700 dark:text-slate-300 truncate">
                            📍 {item.tempat}
                          </p>
                          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                            {item.deskripsi}
                          </p>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {item.fotoBuktiUrl ? (
                          <div
                            onClick={() => {
                              setDetailItem(item);
                              setShowDetailModal(true);
                            }}
                            className="relative group w-10 h-10 mx-auto rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer"
                          >
                            <img
                              src={resolveImageUrl(item.fotoBuktiUrl)}
                              alt="Foto"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              onError={(e) => {
                                (e.target as any).src = "https://via.placeholder.com/150?text=No+Foto";
                              }}
                            />
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">-</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {renderStatusBadge(item.statusApproval)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            title="Detail"
                            onClick={() => {
                              setDetailItem(item);
                              setShowDetailModal(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer"
                          >
                            <Eye size={14} />
                          </button>

                          {item.statusApproval !== "DISETUJUI_DPL" && (
                            <button
                              title="Setujui Instan"
                              onClick={() => handleQuickApprove(item)}
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/60 transition cursor-pointer"
                            >
                              <Check size={14} />
                            </button>
                          )}

                          <button
                            title="Edit Data"
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/60 transition cursor-pointer"
                          >
                            <Pencil size={14} />
                          </button>

                          <button
                            title="Hapus"
                            onClick={() => handleOpenDelete(item)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/60 transition cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div>
            Menampilkan {filteredLogbooks.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} -{" "}
            {Math.min(currentPage * pageSize, filteredLogbooks.length)} dari {filteredLogbooks.length} logbook
          </div>
          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold transition cursor-pointer"
            >
              <ChevronLeft size={13} className="inline mr-1" />
              Sebelumnya
            </button>
            <span className="px-2.5 py-1.5 font-bold text-slate-700 dark:text-slate-300">
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold transition cursor-pointer"
            >
              Berikutnya
              <ChevronRight size={13} className="inline ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL 1: INPUT LOGBOOK MANUAL (CREATE)
      ───────────────────────────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150 my-6">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Input Logbook Manual (Bantuan Mahasiswa)
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitCreate} className="p-6 space-y-3.5 max-h-[75vh] overflow-y-auto text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                <p className="font-medium leading-relaxed">
                  Logbook yang diinput melalui menu Developer ini akan otomatis berstatus <strong>Disetujui DPL</strong> dan bebas dari batasan toleransi tanggal.
                </p>
              </div>

              {/* Mahasiswa Selector */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  Mahasiswa Penulis <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ketik untuk filter nama atau NIM..."
                  value={studentSearchKeyword}
                  onChange={(e) => setStudentSearchKeyword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium mb-1.5 focus:ring-2 focus:ring-[#035941]"
                />
                <select
                  value={createForm.penulisId}
                  onChange={(e) => {
                    const st = students.find((s) => s.userId === e.target.value);
                    if (st) handleSelectStudentForCreate(st);
                    else setCreateForm((p) => ({ ...p, penulisId: e.target.value }));
                  }}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-[#035941]"
                >
                  <option value="">-- Pilih Mahasiswa ({filteredStudentsForCreate.length} data) --</option>
                  {filteredStudentsForCreate.map((s) => (
                    <option key={s.userId} value={s.userId}>
                      {s.name} ({s.nim}) — {s.kelompokNama}
                    </option>
                  ))}
                </select>
              </div>

              {/* Kelompok KKN */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  Kelompok KKN <span className="text-rose-500">*</span>
                </label>
                <select
                  value={createForm.kelompokId}
                  onChange={(e) => setCreateForm((p) => ({ ...p, kelompokId: e.target.value }))}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-[#035941]"
                >
                  <option value="">-- Pilih Kelompok --</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} (Kel. {g.kelurahan || "-"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tanggal & Pekan */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal Kegiatan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={createForm.tanggalKegiatan}
                    onChange={(e) => setCreateForm((p) => ({ ...p, tanggalKegiatan: e.target.value }))}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Pekan Ke- <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={createForm.pekanKe}
                    onChange={(e) => setCreateForm((p) => ({ ...p, pekanKe: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                  >
                    <option value={1}>Pekan 1</option>
                    <option value={2}>Pekan 2</option>
                    <option value={3}>Pekan 3</option>
                    <option value={4}>Pekan 4</option>
                  </select>
                </div>
              </div>

              {/* Jam & Tipe */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Jam Mulai</label>
                  <input
                    type="text"
                    placeholder="08:00"
                    value={createForm.waktuMulai}
                    onChange={(e) => setCreateForm((p) => ({ ...p, waktuMulai: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Jam Selesai</label>
                  <input
                    type="text"
                    placeholder="11:00"
                    value={createForm.waktuSelesai}
                    onChange={(e) => setCreateForm((p) => ({ ...p, waktuSelesai: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tipe</label>
                  <select
                    value={createForm.tipeAktivitas}
                    onChange={(e) => setCreateForm((p) => ({ ...p, tipeAktivitas: e.target.value as any }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                  >
                    <option value="KELOMPOK">Kelompok</option>
                    <option value="INDIVIDU">Individu</option>
                  </select>
                </div>
              </div>

              {/* Tempat */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  Tempat Kegiatan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Balai RW 03 / Posko KKN"
                  value={createForm.tempat}
                  onChange={(e) => setCreateForm((p) => ({ ...p, tempat: e.target.value }))}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                />
              </div>

              {/* Deskripsi */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  Deskripsi Kegiatan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Jelaskan detail aktivitas kegiatan yang dilakukan..."
                  value={createForm.deskripsi}
                  onChange={(e) => setCreateForm((p) => ({ ...p, deskripsi: e.target.value }))}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                />
              </div>

              {/* Foto Bukti */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  Foto Bukti Kegiatan <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <label className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 font-bold cursor-pointer inline-flex items-center gap-2">
                    <Upload size={14} className="text-slate-500" />
                    Pilih File Foto
                    <input type="file" accept="image/*" onChange={handleCreatePhotoChange} className="hidden" />
                  </label>
                  {createPhotoPreview ? (
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200">
                      <img src={createPhotoPreview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setCreatePhotoFile(null);
                          setCreatePhotoPreview(null);
                        }}
                        className="absolute top-0.5 right-0.5 p-0.5 bg-black/60 text-white rounded-full"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ) : (
                    <input
                      type="text"
                      placeholder="Atau tempel URL Foto (/uploads/...)"
                      value={createForm.fotoUrlManual}
                      onChange={(e) => setCreateForm((p) => ({ ...p, fotoUrlManual: e.target.value }))}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  )}
                </div>
              </div>

              {/* Status Persetujuan */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  Status Persetujuan
                </label>
                <select
                  value={createForm.statusApproval}
                  onChange={(e) => setCreateForm((p) => ({ ...p, statusApproval: e.target.value as any }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-emerald-700 dark:text-emerald-400"
                >
                  <option value="DISETUJUI_DPL">Disetujui DPL (Otomatis)</option>
                  <option value="MENUNGGU_VERIFIKASI_DPL">Menunggu Verifikasi DPL</option>
                  <option value="PERLU_REVISI_DPL">Perlu Revisi DPL</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#035941] hover:bg-[#02402e] text-white shadow-xs disabled:opacity-50"
                >
                  {actionLoading ? "Menyimpan..." : "Simpan Logbook"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 2: EDIT / KOREKSI LOGBOOK
      ───────────────────────────────────────────────────────────── */}
      {showEditModal && editItem && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150 my-6">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Edit Data Logbook
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit} className="p-6 space-y-3.5 max-h-[75vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal Kegiatan
                  </label>
                  <input
                    type="date"
                    value={editForm.tanggalKegiatan}
                    onChange={(e) => setEditForm((p) => ({ ...p, tanggalKegiatan: e.target.value }))}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Pekan Ke-
                  </label>
                  <select
                    value={editForm.pekanKe}
                    onChange={(e) => setEditForm((p) => ({ ...p, pekanKe: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                  >
                    <option value={1}>Pekan 1</option>
                    <option value={2}>Pekan 2</option>
                    <option value={3}>Pekan 3</option>
                    <option value={4}>Pekan 4</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Jam Mulai</label>
                  <input
                    type="text"
                    value={editForm.waktuMulai}
                    onChange={(e) => setEditForm((p) => ({ ...p, waktuMulai: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Jam Selesai</label>
                  <input
                    type="text"
                    value={editForm.waktuSelesai}
                    onChange={(e) => setEditForm((p) => ({ ...p, waktuSelesai: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tipe</label>
                  <select
                    value={editForm.tipeAktivitas}
                    onChange={(e) => setEditForm((p) => ({ ...p, tipeAktivitas: e.target.value as any }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                  >
                    <option value="KELOMPOK">Kelompok</option>
                    <option value="INDIVIDU">Individu</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  Tempat Kegiatan
                </label>
                <input
                  type="text"
                  value={editForm.tempat}
                  onChange={(e) => setEditForm((p) => ({ ...p, tempat: e.target.value }))}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  Deskripsi Kegiatan
                </label>
                <textarea
                  rows={3}
                  value={editForm.deskripsi}
                  onChange={(e) => setEditForm((p) => ({ ...p, deskripsi: e.target.value }))}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                />
              </div>

              {/* Status Persetujuan */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  Status Persetujuan
                </label>
                <select
                  value={editForm.statusApproval}
                  onChange={(e) => setEditForm((p) => ({ ...p, statusApproval: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                >
                  <option value="DISETUJUI_DPL">Disetujui DPL</option>
                  <option value="MENUNGGU_VERIFIKASI_DPL">Menunggu Verifikasi DPL</option>
                  <option value="MENUNGGU_PERSETUJUAN_KETUA">Menunggu Persetujuan Ketua</option>
                  <option value="PERLU_REVISI_DPL">Perlu Revisi DPL</option>
                  <option value="DITOLAK_KETUA">Ditolak Ketua</option>
                </select>
              </div>

              {/* Catatan DPL */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  Catatan Evaluasi / DPL
                </label>
                <input
                  type="text"
                  value={editForm.catatanDpl}
                  onChange={(e) => setEditForm((p) => ({ ...p, catatanDpl: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                />
              </div>

              {/* Foto Bukti Ganti */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  Ganti Foto Dokumentasi (Opsional)
                </label>
                <div className="flex items-center gap-3">
                  {editPhotoPreview && (
                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                      <img src={editPhotoPreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleEditPhotoChange} className="text-xs" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#035941] hover:bg-[#02402e] text-white shadow-xs"
                >
                  {actionLoading ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 3: DOUBLE VERIFICATION DELETE MODAL
      ───────────────────────────────────────────────────────────── */}
      {showDeleteModal && deleteTargetItem && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150 p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Konfirmasi Hapus Logbook
              </h3>
              <p className="text-xs text-slate-500">
                Data logbook akan dihapus secara permanen dari sistem.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-0.5">
              <p className="font-bold text-slate-800 dark:text-slate-200">
                {deleteTargetItem.penulisNama} ({deleteTargetItem.penulisNim || "-"})
              </p>
              <p className="text-slate-500">
                {deleteTargetItem.kelompokNama} • {deleteTargetItem.tanggalKegiatan}
              </p>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Ketik kata <span className="text-rose-600 font-black">HAPUS</span> untuk konfirmasi:
              </label>
              <input
                type="text"
                placeholder="HAPUS"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-800 text-xs font-bold text-center text-rose-600 uppercase tracking-widest focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2 rounded-xl font-bold text-xs border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={actionLoading || deleteConfirmationText.trim().toUpperCase() !== "HAPUS"}
                onClick={handleConfirmDelete}
                className="flex-1 py-2 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-xs disabled:opacity-40 cursor-pointer"
              >
                {actionLoading ? "Menghapus..." : "Hapus Permanen"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 4: DETAIL LOGBOOK
      ───────────────────────────────────────────────────────────── */}
      {showDetailModal && detailItem && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150 my-6">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Detail Logbook Mahasiswa
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-3.5 max-h-[75vh] overflow-y-auto text-xs">
              {detailItem.fotoBuktiUrl && (
                <div className="w-full h-56 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black flex items-center justify-center">
                  <img
                    src={resolveImageUrl(detailItem.fotoBuktiUrl)}
                    alt="Dokumentasi"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>{renderStatusBadge(detailItem.statusApproval)}</div>
                <span className="font-bold text-slate-500">Pekan ke-{detailItem.pekanKe}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase">Mahasiswa</p>
                  <p className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">{detailItem.penulisNama}</p>
                  <p className="text-slate-500 font-mono">NIM: {detailItem.penulisNim || "-"}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase">Kelompok KKN</p>
                  <p className="font-bold text-[#035941] dark:text-emerald-400 mt-0.5">{detailItem.kelompokNama}</p>
                  <p className="text-slate-500">Kel. {detailItem.kelurahan || "-"}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase">Tanggal Kegiatan</p>
                  <p className="font-bold text-slate-700 dark:text-slate-200 mt-0.5">{detailItem.tanggalKegiatan}</p>
                  <p className="text-slate-500">{detailItem.waktuMulai} - {detailItem.waktuSelesai}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase">Tempat</p>
                  <p className="font-bold text-slate-700 dark:text-slate-200 mt-0.5">{detailItem.tempat}</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-bold text-slate-500 uppercase">Deskripsi Kegiatan</p>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
                  {detailItem.deskripsi}
                </div>
              </div>

              {detailItem.catatanDpl && (
                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-slate-500 uppercase">Catatan Verifikasi DPL / Developer</p>
                  <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-medium">
                    {detailItem.catatanDpl}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-white hover:bg-slate-900"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 5: KONFIGURASI TOLERANSI BACKDATE
      ───────────────────────────────────────────────────────────── */}
      {showToleranceModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150 p-6 space-y-4 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                <Sliders size={18} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Toleransi Backdate
                </h3>
                <p className="text-[11px] text-slate-500">
                  Batas toleransi hari pengisian logbook (H-x).
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700 dark:text-slate-300">
                Pilih Preset Hari:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[30, 60, 90, 120].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setNewToleranceDays(days)}
                    className={`py-1.5 rounded-lg font-bold transition cursor-pointer ${
                      newToleranceDays === days
                        ? "bg-[#035941] text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                    }`}
                  >
                    H-{days}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-slate-700 dark:text-slate-300">
                Jumlah Hari Kustom:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={365}
                  value={newToleranceDays}
                  onChange={(e) => setNewToleranceDays(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-center text-slate-800 dark:text-slate-100"
                />
                <span className="font-bold text-slate-500">Hari</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowToleranceModal(false)}
                className="flex-1 py-2 rounded-xl font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleSaveTolerance}
                className="flex-1 py-2 rounded-xl font-bold bg-[#035941] hover:bg-[#02402e] text-white shadow-xs cursor-pointer"
              >
                {actionLoading ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KelolaLogbookPage;
