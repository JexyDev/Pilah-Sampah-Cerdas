/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Component: Pengangkutan Residu (Operasional Hilir)
 * - Scope Wilayah: Rukun Warga (Terstandarisasi dengan Master Data & Hasil Klasifikasi)
 * - 100% End-to-End API Integration dengan Backend Express PostgreSQL (`/api/v1/pengangkutan`, `/api/v1/bins/reset-requests`)
 * - Mobile REST API Compatible (Standard Payload Contracts)
 * - Design Standar Industri: Executive Hero Banner, Squircle KPI Metrics, High-Contrast Filter Controls, Interactive Tables, & TrashCare Standardized Pagination.
 */

import React, { useEffect, useState, useMemo } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/useAuthStore";
import showToast from "../../utils/showToast";
import { Pagination } from "../../components/common/Pagination";
import { EmptyTableState } from "../../components/common/EmptyTableState";
import { ConfirmModal } from "../../components/common/ConfirmModal";
import PageHeader from "../../components/common/PageHeader";
import SegmentedTabs from "../../components/common/SegmentedTabs";
import { 
  Loader2, 
  Pencil, 
  Trash2, 
  Plus, 
  Truck, 
  UserCheck, 
  CheckCircle2,
  ShieldAlert,
  Search,
  X,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  RotateCcw,
} from "lucide-react";

interface DispatchTask {
  id: string;
  binId: string;
  status: "PENDING" | "CLAIMED" | "COMPLETED" | "ESCALATED";
  claimedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
  bin: {
    id: string;
    qrCode: string;
    rtRw?: {
      id: number;
      name: string;
      kelurahan?: {
        name: string;
      };
    } | null;
  };
  claimedByUser?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface AreaItem {
  id: number;
  name: string;
  kelurahan?: {
    name: string;
  };
}

interface BinItem {
  id: string;
  kode: string;
  rtRw: string;
  status: string;
}

interface PetugasItem {
  id: string;
  name: string;
  peran: string;
}

interface BinResetRequest {
  id: string;
  binId: string;
  userId: string;
  evidencePhotoUrl: string;
  status: "PENDING" | "ON_PROGRESS" | "APPROVED" | "COMPLETED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
  bin: {
    id: string;
    qrCode: string;
    rtRw?: {
      id: number;
      name: string;
      kelurahan?: {
        name: string;
      };
    } | null;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export const ManajemenPengangkutan: React.FC = () => {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<DispatchTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [areas, setAreas] = useState<AreaItem[]>([]);
  const [bins, setBins] = useState<BinItem[]>([]);
  const [petugasList, setPetugasList] = useState<PetugasItem[]>([]);

  // Tabs
  const [activeTab, setActiveTab] = useState<"tasks" | "requests">("tasks");

  // Requests States
  const [requests, setRequests] = useState<BinResetRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [evidenceModalUrl, setEvidenceModalUrl] = useState<string | null>(null);
  const [selectedRequestForReview, setSelectedRequestForReview] = useState<BinResetRequest | null>(null);

  // Filter & Search States
  const [statusFilter, setStatusFilter] = useState("");
  const [rwFilter, setRwFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<DispatchTask | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form States
  const [selectedBinId, setSelectedBinId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<DispatchTask["status"]>("PENDING");
  const [selectedPetugasId, setSelectedPetugasId] = useState("");

  const isReadOnly = user?.peran === "ADMIN_DLH" || user?.peran === "CAMAT" || user?.peran === "LURAH";
  const isPetugas = user?.peran === "PETUGAS_RESIDU";

  const fetchTasks = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const query = new URLSearchParams();
      if (statusFilter) query.append("status", statusFilter);
      if (rwFilter) query.append("rtRwId", rwFilter);

      const res = await api.get(`/pengangkutan?${query.toString()}`);
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        setTasks(res.data.data);
      } else {
        setTasks([]);
      }
    } catch (err: any) {
      console.error("Gagal memuat tugas pengangkutan:", err);
      showToast.error("Gagal memuat tugas pengangkutan residu");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async (silent = false) => {
    try {
      if (!silent) setLoadingRequests(true);
      const res = await api.get(`/bins/reset-requests`);
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        setRequests(res.data.data);
      } else {
        setRequests([]);
      }
    } catch (err: any) {
      console.error("Gagal memuat pengajuan pengosongan:", err);
      showToast.error("Gagal memuat permintaan pengosongan");
      setRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleUpdateRequestStatus = async (id: string, status: "ON_PROGRESS" | "REJECTED") => {
    if (isReadOnly) {
      showToast.error("Akses Ditolak: Peran Anda hanya memiliki akses Read-Only");
      return;
    }
    try {
      await api.put(`/bins/reset-request/${id}/review`, { status });
      showToast.success(status === "ON_PROGRESS" ? "Petugas penjemput berhasil ditugaskan!" : "Pengajuan pengosongan ditolak.");
      fetchRequests(true);
    } catch (err: any) {
      showToast.error(err.response?.data?.message || "Gagal mengubah status pengajuan");
    }
  };

  const handleApproveRequest = async (id: string) => {
    if (isReadOnly) {
      showToast.error("Akses Ditolak: Peran Anda hanya memiliki akses Read-Only");
      return;
    }
    try {
      await api.put(`/bins/reset/${id}/approve`);
      showToast.success("Pengosongan selesai! Kapasitas tempat sampah kembali ke 0%.");
      fetchRequests(true);
    } catch (err: any) {
      showToast.error(err.response?.data?.message || "Gagal menyelesaikan pengosongan");
    }
  };

  const fetchFiltersAndData = async () => {
    try {
      // 1. Fetch RW Areas
      const areaRes = await api.get("/areas/rt-rw").catch(() => null);
      if (areaRes?.data?.success && Array.isArray(areaRes.data.data)) {
        setAreas(areaRes.data.data);
      }

      // 2. Fetch Bins
      const binsRes = await api.get("/bins").catch(() => null);
      if (binsRes?.data?.success && Array.isArray(binsRes.data.data)) {
        setBins(binsRes.data.data);
      }

      // 3. Fetch Petugas for dropdown
      const usersRes = await api.get("/users").catch(() => null);
      if (usersRes?.data?.success && Array.isArray(usersRes.data.data)) {
        const officers = usersRes.data.data
          .filter((u: any) =>
            ["PETUGAS_RESIDU", "PENGANGKUT", "RW", "SUPER_USER"].includes(u.peran || u.roleName)
          )
          .map((u: any) => ({
            id: u.id,
            name: `${u.name} (${u.phone || u.email || (u.peran || u.roleName)})`,
            peran: u.peran || u.roleName || "PETUGAS_RESIDU",
          }));
        setPetugasList(officers);
      }
    } catch (e) {
      console.error("Gagal memuat data pembantu filter/modal", e);
    }
  };

  useEffect(() => {
    if (activeTab === "tasks") {
      fetchTasks();
    } else {
      fetchRequests();
    }
  }, [statusFilter, rwFilter, activeTab]);

  useEffect(() => {
    fetchFiltersAndData();
  }, []);

  const openAddModal = () => {
    setEditingTask(null);
    setSelectedBinId("");
    setSelectedStatus("PENDING");
    setSelectedPetugasId("");
    setIsModalOpen(true);
  };

  const openEditModal = (task: DispatchTask) => {
    setEditingTask(task);
    setSelectedBinId(task.binId);
    setSelectedStatus(task.status);
    setSelectedPetugasId(task.claimedByUserId || "");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      showToast.error("Akses Ditolak: Peran Anda hanya memiliki akses Read-Only");
      return;
    }

    try {
      if (editingTask) {
        // Update task
        await api.put(`/pengangkutan/${editingTask.id}`, {
          status: selectedStatus,
          claimedByUserId: selectedPetugasId || null,
        });
        showToast.success("Tugas pengangkutan residu berhasil diperbarui");
      } else {
        // Create task
        await api.post("/pengangkutan", {
          binId: selectedBinId,
          status: selectedStatus,
          claimedByUserId: selectedPetugasId || null,
        });
        showToast.success("Tugas pengangkutan residu berhasil dibuat");
      }
      setIsModalOpen(false);
      fetchTasks(true);
    } catch (err: any) {
      showToast.error(err.response?.data?.message || "Gagal menyimpan tugas");
    }
  };

  const handleDelete = (id: string) => {
    if (isReadOnly) {
      showToast.error("Akses Ditolak: Peran Anda hanya memiliki akses Read-Only");
      return;
    }
    setDeleteTaskId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTaskId) return;
    try {
      setIsDeleting(true);
      await api.delete(`/pengangkutan/${deleteTaskId}`);
      showToast.success("Tugas pengangkutan berhasil dihapus");
      setDeleteTaskId(null);
      fetchTasks(true);
    } catch (err: any) {
      showToast.error(err.response?.data?.message || "Gagal menghapus tugas");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClaim = async (id: string) => {
    try {
      await api.post(`/bins/dispatch/${id}/claim`);
      showToast.success("Tugas pengangkutan residu berhasil Anda klaim");
      fetchTasks(true);
    } catch (err: any) {
      showToast.error(err.response?.data?.message || "Gagal mengklaim tugas");
    }
  };

  // Helper Formatter Rukun Warga
  const formatRukunWarga = (rawRw?: string) => {
    if (!rawRw) return "RW 01";
    if (rawRw.includes("/")) {
      const parts = rawRw.split("/");
      const rwPart = parts.find((p) => p.toLowerCase().includes("rw")) || parts[parts.length - 1];
      return rwPart.trim();
    }
    return rawRw;
  };

  const getStatusBadge = (status: DispatchTask["status"]) => {
    const configs = {
      PENDING: { bg: "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700/50", label: "Pending", icon: Clock },
      CLAIMED: { bg: "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700/50", label: "Diklaim", icon: Truck },
      COMPLETED: { bg: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700/50", label: "Selesai", icon: CheckCircle2 },
      ESCALATED: { bg: "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-700/50", label: "Eskalasi", icon: AlertCircle }
    };
    const c = configs[status] || configs.PENDING;
    const IconComp = c.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black border ${c.bg}`}>
        <IconComp size={13} /> {c.label}
      </span>
    );
  };

  const getRequestStatusBadge = (status: BinResetRequest["status"]) => {
    const configs = {
      PENDING: { bg: "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700/50", label: "Pending", icon: Clock },
      ON_PROGRESS: { bg: "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700/50", label: "Dalam Proses", icon: Truck },
      COMPLETED: { bg: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700/50", label: "Selesai", icon: CheckCircle2 },
      APPROVED: { bg: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700/50", label: "Disetujui", icon: CheckCircle },
      REJECTED: { bg: "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-700/50", label: "Ditolak", icon: AlertCircle }
    };
    const c = configs[status] || { bg: "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700", label: status, icon: Clock };
    const IconComp = c.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black border ${c.bg}`}>
        <IconComp size={13} /> {c.label}
      </span>
    );
  };

  // Metric Calculation Stats
  const totalTasksCount = tasks.length;
  const pendingTasksCount = tasks.filter((t) => t.status === "PENDING").length;
  const claimedTasksCount = tasks.filter((t) => t.status === "CLAIMED").length;
  const completedTasksCount = tasks.filter((t) => t.status === "COMPLETED").length;
  const pendingRequestsCount = requests.filter((r) => r.status === "PENDING").length;

  // Filter Tasks by Search Query
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const idMatch = t.id.toLowerCase().includes(q);
      const qrMatch = t.bin.qrCode.toLowerCase().includes(q);
      const rwMatch = (t.bin.rtRw?.name || "").toLowerCase().includes(q);
      const officerMatch = (t.claimedByUser?.name || "").toLowerCase().includes(q);
      return idMatch || qrMatch || rwMatch || officerMatch;
    });
  }, [tasks, searchQuery]);

  // Paginate Tasks
  const totalTaskPages = Math.max(1, Math.ceil(filteredTasks.length / itemsPerPage));
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTasks.slice(start, start + itemsPerPage);
  }, [filteredTasks, currentPage, itemsPerPage]);

  // Filter Requests by Search Query
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const userMatch = r.user.name.toLowerCase().includes(q) || r.user.email.toLowerCase().includes(q);
      const qrMatch = r.bin.qrCode.toLowerCase().includes(q);
      const areaMatch = (r.bin.rtRw?.name || "").toLowerCase().includes(q);
      const statusMatch = r.status.toLowerCase().includes(q);
      return userMatch || qrMatch || areaMatch || statusMatch;
    });
  }, [requests, searchQuery]);

  // Paginate Requests
  const totalRequestPages = Math.max(1, Math.ceil(filteredRequests.length / itemsPerPage));
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRequests.slice(start, start + itemsPerPage);
  }, [filteredRequests, currentPage, itemsPerPage]);

  const resetFilters = () => {
    setStatusFilter("");
    setRwFilter("");
    setSearchQuery("");
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 text-slate-800 dark:text-slate-100 font-sans">
      {/* Clean Enterprise Page Header */}
      <PageHeader
        icon={Truck}
        category="Operasional Hilir & Pengangkutan Residu"
        scope={user?.wilayah || "Wilayah Operasional"}
        title="Pengumpulan & Pengangkutan"
        description="Manajemen dan pemantauan penugasan armada pengangkutan residu sampah terintegrasi dari Tempat Sampah warga ke pemrosesan hilir."
        actions={
          activeTab === "tasks" && !isReadOnly && !isPetugas ? (
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus size={15} /> <span>Catat Tugas Baru</span>
            </button>
          ) : undefined
        }
      />

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Total Tasks Card */}
        <div className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5 group hover:border-emerald-300 dark:hover:border-emerald-600 transition-all">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 rounded-xl shrink-0 border border-emerald-100 dark:border-emerald-800/40 group-hover:scale-105 transition-transform">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Total Penugasan</p>
            <p className="text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5">{totalTasksCount} <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tugas</span></p>
          </div>
        </div>

        {/* Pending Card */}
        <div className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5 group hover:border-amber-300 dark:hover:border-amber-600 transition-all">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl shrink-0 border border-amber-100 dark:border-amber-800/40 group-hover:scale-105 transition-transform">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Pending Penjemputan</p>
            <p className="text-lg font-black text-amber-700 dark:text-amber-400 mt-0.5">{pendingTasksCount} <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Antrean</span></p>
          </div>
        </div>

        {/* Claimed / On Progress Card */}
        <div className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5 group hover:border-blue-300 dark:hover:border-blue-600 transition-all">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl shrink-0 border border-blue-100 dark:border-blue-800/40 group-hover:scale-105 transition-transform">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Diklaim Petugas</p>
            <p className="text-lg font-black text-blue-700 dark:text-blue-400 mt-0.5">{claimedTasksCount} <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Proses</span></p>
          </div>
        </div>

        {/* Completed Card */}
        <div className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5 group hover:border-purple-300 dark:hover:border-purple-600 transition-all">
          <div className="p-3 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-xl shrink-0 border border-purple-100 dark:border-purple-800/40 group-hover:scale-105 transition-transform">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Pengangkutan Selesai</p>
            <p className="text-lg font-black text-purple-700 dark:text-purple-400 mt-0.5">{completedTasksCount} <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Selesai</span></p>
          </div>
        </div>
      </div>

      {/* Modern Segmented Navigation Tabs */}
      <SegmentedTabs
        tabs={[
          { key: "tasks", label: "Tugas Pengangkutan Residu", icon: Truck },
          {
            key: "requests",
            label: "Permintaan Pengosongan Sampah",
            icon: Clock,
            badge: pendingRequestsCount,
          },
        ]}
        activeTab={activeTab}
        onChange={(tab) => {
          setActiveTab(tab as "tasks" | "requests");
          setCurrentPage(1);
        }}
      />

      {activeTab === "tasks" ? (
        <>
          {/* Filter & Search Bar Section */}
          <div className="bg-white dark:bg-slate-900 p-4.5 sm:p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5">
            {/* Search Bar */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Cari ID tugas, QR tempat sampah, Rukun Warga, petugas..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-[#009966] focus:bg-white dark:focus:bg-slate-800 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filters Group */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-[#009966] transition cursor-pointer"
              >
                <option value="">Semua Status Pengangkutan</option>
                <option value="PENDING">Pending (Antrean)</option>
                <option value="CLAIMED">Diklaim Petugas</option>
                <option value="COMPLETED">Selesai</option>
                <option value="ESCALATED">Eskalasi</option>
              </select>

              {/* Rukun Warga Area Filter */}
              <select
                value={rwFilter}
                onChange={(e) => {
                  setRwFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-[#009966] transition cursor-pointer"
              >
                <option value="">Semua Rukun Warga</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} (Kel. {a.kelurahan?.name})
                  </option>
                ))}
              </select>

              {/* Reset Button */}
              {(statusFilter || rwFilter || searchQuery) && (
                <button
                  onClick={resetFilters}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw size={13} /> Reset
                </button>
              )}
            </div>
          </div>

          {/* Table Section */}
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                  <Truck size={18} className="text-[#009966]" /> Daftar Penugasan Pengangkutan Residu
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  Menampilkan {filteredTasks.length === 0 ? 0 : `${(currentPage - 1) * itemsPerPage + 1} - ${Math.min(currentPage * itemsPerPage, filteredTasks.length)}`} dari {filteredTasks.length} data penugasan
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                <Loader2 className="animate-spin text-[#009966]" size={28} />
                <p className="text-xs font-bold">Memuat tugas pengangkutan...</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <EmptyTableState
                entityName="Penugasan Pengangkutan"
                isSearch={!!(statusFilter || rwFilter || searchQuery)}
                searchQuery={searchQuery}
                onResetSearch={resetFilters}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="text-[10.5px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80">
                      <th className="py-3.5 px-4 rounded-l-2xl">ID Tugas</th>
                      <th className="py-3.5 px-4">Tempat Sampah</th>
                      <th className="py-3.5 px-4">Rukun Warga</th>
                      <th className="py-3.5 px-4">Petugas Penjemput</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4">Tanggal Penugasan</th>
                      <th className="py-3.5 px-4 text-center rounded-r-2xl">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                    {paginatedTasks.map((task) => (
                      <tr key={task.id} className="hover:bg-slate-50/90 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-black text-slate-900 dark:text-slate-100 tracking-tight">
                          {task.id.slice(0, 10).toUpperCase()}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-slate-100">{task.bin.qrCode}</div>
                          <div className="text-[10px] text-slate-400 font-mono">ID: {task.binId}</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-block bg-[#eef5ff] dark:bg-blue-950/60 text-[#2b6cb0] dark:text-blue-300 font-bold text-xs px-3 py-1 rounded-xl border border-[#c3dafe] dark:border-blue-700/50">
                            {formatRukunWarga(task.bin.rtRw?.name)}
                          </span>
                          {task.bin.rtRw?.kelurahan?.name && (
                            <span className="block text-[10px] text-slate-400 font-semibold mt-0.5">
                              Kel. {task.bin.rtRw.kelurahan.name}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                          {task.claimedByUser ? (
                            <div className="flex items-center gap-1.5">
                              <UserCheck size={14} className="text-[#009966] dark:text-emerald-400" />
                              <span>{task.claimedByUser.name}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 font-bold italic">Belum Diklaim</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {getStatusBadge(task.status)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap font-bold">
                          {new Date(task.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="inline-flex gap-1.5 justify-center items-center">
                            {isPetugas && task.status === "PENDING" && (
                              <button
                                onClick={() => handleClaim(task.id)}
                                className="bg-[#009966] hover:bg-[#008855] text-white px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 shadow-2xs"
                              >
                                <CheckCircle size={13} /> Klaim
                              </button>
                            )}

                            {!isReadOnly && !isPetugas && (
                              <>
                                <button
                                  onClick={() => openEditModal(task)}
                                  className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-xl transition cursor-pointer"
                                  title="Edit Tugas"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  onClick={() => handleDelete(task.id)}
                                  className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-xl transition cursor-pointer"
                                  title="Hapus/Batalkan"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}

                            {isReadOnly && <span className="text-xs text-slate-400">-</span>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TrashCare Standardized Pagination Controls */}
            {!loading && filteredTasks.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalTaskPages}
                totalItems={filteredTasks.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
                itemsPerPageOptions={[10, 25, 50, 100]}
              />
            )}
          </div>
        </>
      ) : (
        /* Requests Tab Section */
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 tracking-tight">
                Daftar Permintaan Pengosongan Tempat Sampah
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Permintaan pengosongan yang dikirim langsung dari gawai warga melalui aplikasi mobile
              </p>
            </div>

            {/* Search Input for Requests */}
            <div className="relative min-w-[240px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Cari warga, QR, Rukun Warga..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-[#009966] focus:bg-white dark:focus:bg-slate-800 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {loadingRequests ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <Loader2 className="animate-spin text-[#009966]" size={28} />
              <p className="text-xs font-bold">Memuat pengajuan pengosongan...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <EmptyTableState
              entityName="Pengajuan Pengosongan Tempat Sampah"
              isSearch={!!searchQuery}
              searchQuery={searchQuery}
              onResetSearch={() => setSearchQuery("")}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="text-[10.5px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80">
                    <th className="py-3.5 px-4 rounded-l-2xl">Nama Warga</th>
                    <th className="py-3.5 px-4">Rukun Warga</th>
                    <th className="py-3.5 px-4">Tanggal Pengajuan</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center">Foto Bukti</th>
                    <th className="py-3.5 px-4 text-center rounded-r-2xl">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                  {paginatedRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/90 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                        {req.user.name}
                        <span className="block text-[10px] text-slate-400 font-semibold">{req.user.email}</span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-block bg-[#eef5ff] dark:bg-blue-950/60 text-[#2b6cb0] dark:text-blue-300 font-bold text-xs px-3 py-1 rounded-xl border border-[#c3dafe] dark:border-blue-700/50">
                          {formatRukunWarga(req.bin.rtRw?.name)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-bold text-slate-700 dark:text-slate-300">
                        {new Date(req.createdAt).toLocaleString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {getRequestStatusBadge(req.status)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setEvidenceModalUrl(req.evidencePhotoUrl)}
                          className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye size={13} /> Lihat Foto
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex gap-2 justify-center items-center">
                          <button
                            onClick={() => setSelectedRequestForReview(req)}
                            className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 shadow-2xs"
                          >
                            <ShieldAlert size={13} /> {req.status === "PENDING" ? "Tinjau Pengajuan" : "Lihat Detail"}
                          </button>

                          {req.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => handleUpdateRequestStatus(req.id, "ON_PROGRESS")}
                                className="bg-[#009966] hover:bg-[#008855] text-white px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shadow-2xs"
                              >
                                Tugaskan
                              </button>
                              <button
                                onClick={() => handleUpdateRequestStatus(req.id, "REJECTED")}
                                className="bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-700/50 px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer"
                              >
                                Tolak
                              </button>
                            </>
                          )}

                          {req.status === "ON_PROGRESS" && (
                            <button
                              onClick={() => handleApproveRequest(req.id)}
                              className="bg-[#009966] hover:bg-[#008855] text-white px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shadow-2xs"
                            >
                              Tandai Selesai
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Standardized Pagination Controls */}
          {!loadingRequests && filteredRequests.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalRequestPages}
              totalItems={filteredRequests.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
              itemsPerPageOptions={[10, 25, 50, 100]}
            />
          )}
        </div>
      )}

      {/* Modal Dialog Form Tambah/Edit Tugas */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-900 dark:bg-slate-950 text-white">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Truck size={18} className="text-emerald-400" />
                {editingTask ? "Edit Tugas Pengangkutan" : "Catat Tugas Pengangkutan"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-bold text-slate-700 dark:text-slate-300">
              <div className="space-y-1.5">
                <label className="block text-slate-800 dark:text-slate-200 font-extrabold">Pilih Tempat Sampah *</label>
                <select
                  required
                  disabled={!!editingTask}
                  value={selectedBinId}
                  onChange={(e) => setSelectedBinId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-[#009966]"
                >
                  <option value="">-- Pilih Tempat Sampah --</option>
                  {bins.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.kode || b.id} ({formatRukunWarga(b.rtRw)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-800 dark:text-slate-200 font-extrabold">Status Pengangkutan *</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-[#009966]"
                >
                  <option value="PENDING">Pending (Antrean)</option>
                  <option value="CLAIMED">Diklaim Petugas</option>
                  <option value="COMPLETED">Selesai</option>
                  <option value="ESCALATED">Eskalasi</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-800 dark:text-slate-200 font-extrabold">Petugas Penjemput (Opsional)</label>
                <select
                  value={selectedPetugasId}
                  onChange={(e) => setSelectedPetugasId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-[#009966]"
                >
                  <option value="">-- Tanpa Petugas (Bisa diklaim via Mobile) --</option>
                  {petugasList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#009966] text-white rounded-xl font-black hover:bg-[#008855] transition cursor-pointer shadow-md"
                >
                  Simpan Tugas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Request Modal */}
      {selectedRequestForReview && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-900 dark:bg-slate-950 text-white">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <ShieldAlert size={18} className="text-amber-400" /> Detail Permintaan Pengosongan
              </h3>
              <button
                onClick={() => setSelectedRequestForReview(null)}
                className="text-slate-400 hover:text-white p-1 rounded-full transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700 dark:text-slate-300">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-400">Pengirim Warga</span>
                <p className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">{selectedRequestForReview.user.name}</p>
                <p className="text-slate-500 dark:text-slate-400 font-semibold">{selectedRequestForReview.user.email}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400">Rukun Warga</span>
                  <p className="font-extrabold text-slate-900 dark:text-slate-100">{formatRukunWarga(selectedRequestForReview.bin.rtRw?.name)}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400">Kode Tempat Sampah</span>
                  <p className="font-mono font-black text-[#009966] dark:text-emerald-400">{selectedRequestForReview.bin.qrCode}</p>
                </div>
              </div>

              {selectedRequestForReview.evidencePhotoUrl && (
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Foto Bukti Pengosongan</span>
                  <div
                    onClick={() => setEvidenceModalUrl(selectedRequestForReview.evidencePhotoUrl)}
                    className="w-full h-44 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 relative group cursor-pointer"
                  >
                    <img
                      src={selectedRequestForReview.evidencePhotoUrl}
                      alt="Foto Bukti"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 flex justify-end">
              <button
                onClick={() => setSelectedRequestForReview(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition cursor-pointer"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX PREVIEW FOTO BUKTI */}
      {evidenceModalUrl && (
        <div
          className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setEvidenceModalUrl(null)}
        >
          <div className="relative max-w-3xl w-full max-h-[90vh] flex items-center justify-center">
            <img
              src={evidenceModalUrl}
              alt="Bukti Pengosongan"
              className="max-w-full max-h-[85vh] rounded-3xl object-contain shadow-2xl border border-white/20"
            />
            <button
              onClick={() => setEvidenceModalUrl(null)}
              className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold flex items-center justify-center shadow-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal Delete Tugas Pengangkutan */}
      <ConfirmModal
        isOpen={Boolean(deleteTaskId)}
        onClose={() => setDeleteTaskId(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Hapus Tugas Pengangkutan"
        message="Apakah Anda yakin ingin membatalkan/menghapus tugas pengangkutan ini? Status antrean penjemputan akan disesuaikan."
        confirmText="Ya, Hapus Tugas"
        type="danger"
      />
    </div>
  );
};

export default ManajemenPengangkutan;
