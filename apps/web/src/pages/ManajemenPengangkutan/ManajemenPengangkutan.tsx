/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */

import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import { useAuthStore } from "../../store/useAuthStore";
import toast from "react-hot-toast";
import { Pagination } from "../../components/common/Pagination";
import { 
  Loader2, 
  Pencil, 
  Trash2, 
  Plus, 
  Truck, 
  UserCheck, 
  Calendar, 
  CheckCircle,
  ShieldAlert,
  ImageOff,
  Search,
  X
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

  // Form States
  const [selectedBinId, setSelectedBinId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<DispatchTask["status"]>("PENDING");
  const [selectedPetugasId, setSelectedPetugasId] = useState("");

  const isReadOnly = user?.peran === "ADMIN_DLH" || user?.peran === "CAMAT" || user?.peran === "LURAH";
  const isPetugas = user?.peran === "PETUGAS_RESIDU";

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (statusFilter) query.append("status", statusFilter);
      if (rwFilter) query.append("rtRwId", rwFilter);

      const res = await api.get(`/pengangkutan?${query.toString()}`);
      if (res.data && res.data.success) {
        setTasks(res.data.data);
      }
    } catch (err: any) {
      toast.error("Gagal memuat tugas pengangkutan");
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      setLoadingRequests(true);
      const res = await api.get(`/bins/reset-requests`);
      if (res.data && res.data.success) {
        setRequests(res.data.data);
      }
    } catch (err: any) {
      toast.error("Gagal memuat pengajuan pengosongan");
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleUpdateRequestStatus = async (id: string, status: "ON_PROGRESS" | "REJECTED") => {
    if (isReadOnly) {
      toast.error("Akses Ditolak: Peran Anda hanya memiliki akses Read-Only");
      return;
    }
    try {
      await api.put(`/bins/reset-request/${id}/review`, { status });
      toast.success(status === "ON_PROGRESS" ? "Petugas ditugaskan!" : "Pengajuan ditolak.");
      fetchRequests();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal mengubah status pengajuan");
    }
  };

  const handleApproveRequest = async (id: string) => {
    if (isReadOnly) {
      toast.error("Akses Ditolak: Peran Anda hanya memiliki akses Read-Only");
      return;
    }
    try {
      await api.put(`/bins/reset/${id}/approve`);
      toast.success("Pengosongan selesai! Kapasitas tong kembali ke 0%.");
      fetchRequests();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menyelesaikan pengosongan");
    }
  };

  const fetchFiltersAndData = async () => {
    try {
      // 1. Fetch RW Areas
      const areaRes = await api.get("/areas/rt-rw");
      if (areaRes.data && areaRes.data.success) {
        setAreas(areaRes.data.data);
      }

      const binsRes = await api.get("/bins");
      if (binsRes.data && binsRes.data.success) {
        setBins(binsRes.data.data);
      }

      // 3. Fetch Petugas for dropdown
      const usersRes = await api.get("/users");
      if (usersRes.data && usersRes.data.success) {
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
      toast.error("Akses Ditolak: Peran Anda hanya memiliki akses Read-Only");
      return;
    }

    try {
      if (editingTask) {
        // Update task
        await api.put(`/pengangkutan/${editingTask.id}`, {
          status: selectedStatus,
          claimedByUserId: selectedPetugasId || null,
        });
        toast.success("Tugas pengangkutan berhasil diperbarui");
      } else {
        // Create task
        await api.post("/pengangkutan", {
          binId: selectedBinId,
          status: selectedStatus,
          claimedByUserId: selectedPetugasId || null,
        });
        toast.success("Tugas pengangkutan berhasil dibuat");
      }
      setIsModalOpen(false);
      fetchTasks();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menyimpan tugas");
    }
  };

  const handleDelete = async (id: string) => {
    if (isReadOnly) {
      toast.error("Akses Ditolak: Peran Anda hanya memiliki akses Read-Only");
      return;
    }

    if (!window.confirm("Apakah Anda yakin ingin membatalkan/menghapus tugas pengangkutan ini?")) return;

    try {
      await api.delete(`/pengangkutan/${id}`);
      toast.success("Tugas pengangkutan berhasil dihapus");
      fetchTasks();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menghapus tugas");
    }
  };

  const handleClaim = async (id: string) => {
    try {
      await api.post(`/bins/dispatch/${id}/claim`);
      toast.success("Tugas pengangkutan berhasil Anda klaim");
      fetchTasks();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal mengklaim tugas");
    }
  };

  const getStatusBadge = (status: DispatchTask["status"]) => {
    const configs = {
      PENDING: { bg: "bg-amber-50 text-amber-700 border-amber-100", label: "Pending" },
      CLAIMED: { bg: "bg-blue-50 text-blue-700 border-blue-100", label: "Diklaim" },
      COMPLETED: { bg: "bg-emerald-50 text-emerald-700 border-emerald-100", label: "Selesai" },
      ESCALATED: { bg: "bg-rose-50 text-rose-700 border-rose-100", label: "Eskalasi" }
    };
    const c = configs[status] || configs.PENDING;
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${c.bg}`}>
        {c.label}
      </span>
    );
  };

  const getRequestStatusBadge = (status: BinResetRequest["status"]) => {
    const configs = {
      PENDING: { bg: "bg-amber-50 text-amber-700 border-amber-100", label: "Pending" },
      ON_PROGRESS: { bg: "bg-blue-50 text-blue-700 border-blue-100", label: "Dalam Perjalanan" },
      COMPLETED: { bg: "bg-emerald-50 text-emerald-700 border-emerald-100", label: "Selesai" },
      APPROVED: { bg: "bg-emerald-50 text-emerald-700 border-emerald-100", label: "Disetujui" },
      REJECTED: { bg: "bg-rose-50 text-rose-700 border-rose-100", label: "Ditolak" }
    };
    const c = configs[status] || { bg: "bg-gray-50 text-gray-700 border-gray-100", label: status };
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${c.bg}`}>
        {c.label}
      </span>
    );
  };

  // Pending Requests count for notification badge
  const pendingRequestsCount = requests.filter((r) => r.status === "PENDING").length;

  // Filter Tasks by Search Query
  const filteredTasks = tasks.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const idMatch = t.id.toLowerCase().includes(q);
    const qrMatch = t.bin.qrCode.toLowerCase().includes(q);
    const rwMatch = (t.bin.rtRw?.name || "").toLowerCase().includes(q);
    const officerMatch = (t.claimedByUser?.name || "").toLowerCase().includes(q);
    return idMatch || qrMatch || rwMatch || officerMatch;
  });

  // Paginate Tasks
  const totalTaskPages = Math.ceil(filteredTasks.length / itemsPerPage) || 1;
  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Filter Requests by Search Query
  const filteredRequests = requests.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const userMatch = r.user.name.toLowerCase().includes(q) || r.user.email.toLowerCase().includes(q);
    const qrMatch = r.bin.qrCode.toLowerCase().includes(q);
    const areaMatch = (r.bin.rtRw?.name || "").toLowerCase().includes(q);
    const statusMatch = r.status.toLowerCase().includes(q);
    return userMatch || qrMatch || areaMatch || statusMatch;
  });

  // Paginate Requests
  const totalRequestPages = Math.ceil(filteredRequests.length / itemsPerPage) || 1;
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Pengangkutan Sampah</h1>
            <span className="bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full font-extrabold flex items-center gap-1">
              <Truck size={13} /> Operasional Hilir
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manajemen dan pemantauan penugasan pengangkutan sampah dari gawai warga ke pemrosesan hilir.
          </p>
        </div>

        {activeTab === "tasks" && !isReadOnly && !isPetugas && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white font-extrabold rounded-xl transition-all text-xs shadow-sm cursor-pointer"
          >
            <Plus size={15} /> Catat Tugas Baru
          </button>
        )}
      </div>

      {/* Tabs with Badge */}
      <div className="flex gap-6 border-b border-gray-100 pb-px">
        <button
          onClick={() => {
            setActiveTab("tasks");
            setCurrentPage(1);
          }}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "tasks" ? "border-primary text-primary" : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          Tugas Pengangkutan
        </button>
        <button
          onClick={() => {
            setActiveTab("requests");
            setCurrentPage(1);
          }}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "requests" ? "border-primary text-primary font-bold" : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          <span>Permintaan Pengosongan Warga</span>
          {pendingRequestsCount > 0 && (
            <span className="px-2 py-0.5 text-[11px] font-extrabold bg-rose-500 text-white rounded-full shadow-xs animate-pulse">
              {pendingRequestsCount}
            </span>
          )}
        </button>
      </div>

      {activeTab === "tasks" ? (
        <>
          {/* Filter & Search Bar Section */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <Truck size={14} />
                <span>Filter Status & Wilayah:</span>
              </div>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-xl border border-gray-200 px-3.5 py-2 text-sm bg-gray-50 focus:bg-white focus:outline-primary transition-colors min-w-[150px]"
              >
                <option value="">Semua Status</option>
                <option value="PENDING">Pending</option>
                <option value="CLAIMED">Diklaim</option>
                <option value="COMPLETED">Selesai</option>
                <option value="ESCALATED">Eskalasi</option>
              </select>

              {!(user?.peran === "RW" || user?.peran === "RT") && (
                <select
                  value={rwFilter}
                  onChange={(e) => {
                    setRwFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="rounded-xl border border-gray-200 px-3.5 py-2 text-sm bg-gray-50 focus:bg-white focus:outline-primary transition-colors min-w-[200px]"
                >
                  <option value="">Semua RW</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (Kel. {a.kelurahan?.name})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[260px] flex-1 max-w-md">
              <input
                type="text"
                placeholder="Cari ID Tugas, Kode QR, RW, atau Petugas..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl border border-gray-200 pl-9 pr-8 py-2 text-sm bg-gray-50 focus:bg-white focus:outline-primary transition-colors"
              />
              <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setCurrentPage(1);
                  }}
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Table Section */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800">Daftar Penugasan Pengangkutan</h2>
              <span className="text-xs font-semibold text-gray-400">
                Total: {filteredTasks.length} penugasan
              </span>
            </div>

            {loading ? (
              <div className="text-center py-12 text-gray-400 flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-xs">Memuat tugas...</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-16 text-gray-400 border border-dashed border-gray-200 rounded-xl">
                <Truck className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-medium">
                  {searchQuery ? "Tidak ada tugas yang sesuai pencarian." : "Belum ada tugas pengangkutan sampah."}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100 text-sm text-left">
                    <thead className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-3.5">ID Tugas</th>
                        <th className="px-6 py-3.5">Tempat Sampah</th>
                        <th className="px-6 py-3.5">Wilayah RW</th>
                        <th className="px-6 py-3.5">Petugas Penjemput</th>
                        <th className="px-6 py-3.5 text-center">Status</th>
                        <th className="px-6 py-3.5">Tanggal Tugas</th>
                        <th className="px-6 py-3.5 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paginatedTasks.map((task) => (
                        <tr key={task.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-gray-700 align-middle">
                            {task.id.slice(0, 8).toUpperCase()}
                          </td>
                          <td className="px-6 py-4 align-middle">
                            <div className="font-bold text-gray-800">{task.bin.qrCode}</div>
                            <div className="text-[10px] text-gray-400 font-mono">ID: {task.binId}</div>
                          </td>
                          <td className="px-6 py-4 text-gray-600 align-middle">
                            {task.bin.rtRw?.name || "-"} (Kel. {task.bin.rtRw?.kelurahan?.name || "-"})
                          </td>
                          <td className="px-6 py-4 align-middle font-medium text-gray-700">
                            {task.claimedByUser ? (
                              <div className="flex items-center gap-1.5">
                                <UserCheck className="w-4 h-4 text-primary" />
                                <span>{task.claimedByUser.name}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 font-bold italic">Belum Diklaim</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center align-middle">
                            {getStatusBadge(task.status)}
                          </td>
                          <td className="px-6 py-4 text-gray-500 align-middle whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <Calendar size={13} />
                              <span>
                                {new Date(task.createdAt).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center align-middle whitespace-nowrap">
                            <div className="inline-flex gap-2 justify-center">
                              {isPetugas && task.status === "PENDING" && (
                                <button
                                  onClick={() => handleClaim(task.id)}
                                  className="bg-primary hover:bg-primary/95 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer flex items-center gap-1"
                                >
                                  <CheckCircle size={13} />
                                  Klaim
                                </button>
                              )}

                              {!isReadOnly && !isPetugas && (
                                <>
                                  <button
                                    onClick={() => openEditModal(task)}
                                    className="p-2 bg-slate-100 hover:bg-primary/20 text-primary rounded-lg transition-colors cursor-pointer"
                                    title="Edit"
                                  >
                                    <Pencil size={15} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(task.id)}
                                    className="p-2 bg-slate-100 hover:bg-error/20 text-error rounded-lg transition-colors cursor-pointer"
                                    title="Hapus/Batalkan"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </>
                              )}

                              {isReadOnly && (
                                <span className="text-xs text-gray-400">-</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {filteredTasks.length > 0 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalTaskPages}
                    totalItems={filteredTasks.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={setItemsPerPage}
                  />
                )}
              </>
            )}
          </div>
        </>
      ) : (
        /* Requests Section */
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Daftar Pengajuan Pengosongan Tong Warga</h2>
              <p className="text-xs text-gray-400 mt-0.5">Permintaan pengosongan yang dikirim langsung dari gawai warga.</p>
            </div>

            {/* Search Input for Requests */}
            <div className="relative min-w-[240px] max-w-xs">
              <input
                type="text"
                placeholder="Cari Warga, Kode QR, atau Status..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl border border-gray-200 pl-9 pr-8 py-2 text-sm bg-gray-50 focus:bg-white focus:outline-primary transition-colors"
              />
              <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setCurrentPage(1);
                  }}
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {loadingRequests ? (
            <div className="text-center py-12 text-gray-400 flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-xs">Memuat pengajuan...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-16 text-gray-400 border border-dashed border-gray-200 rounded-xl">
              <Truck className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-medium">
                {searchQuery ? "Tidak ada pengajuan yang sesuai pencarian." : "Belum ada pengajuan pengosongan tong dari warga."}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100 text-sm text-left">
                  <thead className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5">Nama Warga</th>
                      <th className="px-6 py-3.5">Alamat / RT / RW</th>
                      <th className="px-6 py-3.5">Tanggal Request</th>
                      <th className="px-6 py-3.5 text-center">Status</th>
                      <th className="px-6 py-3.5 text-center">Foto Bukti</th>
                      <th className="px-6 py-3.5 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 align-middle">
                          <div className="font-bold text-gray-800">{req.user.name}</div>
                          <div className="text-[10px] text-gray-400">{req.user.email}</div>
                        </td>
                        <td className="px-6 py-4 align-middle text-gray-600">
                          {req.bin.rtRw?.name || "Wilayah Umum"} {req.bin.rtRw?.kelurahan?.name ? `(Kel. ${req.bin.rtRw.kelurahan.name})` : ""}
                        </td>
                        <td className="px-6 py-4 align-middle text-gray-500 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Calendar size={13} />
                            <span>
                              {new Date(req.createdAt).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center align-middle">
                          {getRequestStatusBadge(req.status)}
                        </td>
                        <td className="px-6 py-4 text-center align-middle">
                          <button
                            onClick={() => setEvidenceModalUrl(req.evidencePhotoUrl)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            Lihat Foto
                          </button>
                        </td>
                        <td className="px-6 py-4 text-center align-middle whitespace-nowrap">
                          <div className="inline-flex gap-2 justify-center items-center">
                            <button
                              onClick={() => setSelectedRequestForReview(req)}
                              className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                            >
                              <ShieldAlert size={14} />
                              {req.status === "PENDING" ? "Tinjau Pengajuan" : "Lihat Detail"}
                            </button>

                            {req.status === "PENDING" && (
                              <>
                                <button
                                  onClick={() => handleUpdateRequestStatus(req.id, "ON_PROGRESS")}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                                >
                                  Tugaskan
                                </button>
                                <button
                                  onClick={() => handleUpdateRequestStatus(req.id, "REJECTED")}
                                  className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                >
                                  Tolak
                                </button>
                              </>
                            )}

                            {req.status === "ON_PROGRESS" && (
                              <button
                                onClick={() => handleApproveRequest(req.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
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

              {/* Requests Pagination Controls */}
              {filteredRequests.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalRequestPages}
                  totalItems={filteredRequests.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={setItemsPerPage}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800">
                {editingTask ? "Edit Tugas Pengangkutan" : "Catat Tugas Baru"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {!editingTask ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Pilih Tempat Sampah</label>
                  <select
                    value={selectedBinId}
                    onChange={(e) => setSelectedBinId(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-primary transition-colors"
                    required
                  >
                    <option value="">Pilih Tempat Sampah Aktif</option>
                    {bins.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.kode} ({b.rtRw || "Wilayah"})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Tempat Sampah (Terkunci)</label>
                  <input
                    type="text"
                    value={editingTask.bin.qrCode}
                    disabled
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Status Pengangkutan</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as DispatchTask["status"])}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-primary transition-colors"
                  required
                >
                  <option value="PENDING">Pending</option>
                  <option value="CLAIMED">Diklaim</option>
                  <option value="COMPLETED">Selesai</option>
                  <option value="ESCALATED">Eskalasi</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Petugas Penjemput (Klaim)</label>
                <select
                  value={selectedPetugasId}
                  onChange={(e) => setSelectedPetugasId(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-primary transition-colors"
                >
                  <option value="">Belum Diklaim / Kosong</option>
                  {petugasList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700 bg-gray-50 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary hover:bg-primary/95 text-white rounded-xl text-sm font-bold shadow-md shadow-primary/10 cursor-pointer"
                >
                  {editingTask ? "Simpan Perubahan" : "Buat Tugas"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Evidence Modal */}
      {evidenceModalUrl && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Foto Bukti Tong Penuh</h3>
              <button
                onClick={() => setEvidenceModalUrl(null)}
                className="text-gray-400 hover:text-gray-600 font-bold cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>
            <div className="p-6 flex justify-center bg-gray-50">
              <img
                src={evidenceModalUrl}
                alt="Foto Bukti"
                className="max-h-[400px] w-auto rounded-xl object-contain border border-gray-200 shadow-sm"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (!target.src.startsWith("http")) {
                    target.src = api.defaults.baseURL + target.src;
                  }
                }}
              />
            </div>
            <div className="p-5 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setEvidenceModalUrl(null)}
                className="bg-primary hover:bg-primary/95 text-white px-5 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Review Request Detailed Modal */}
      {selectedRequestForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-800 text-lg">Detail Notifikasi</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-blue-100 text-blue-700">
                  Tampilan Petugas
                </span>
              </div>
              <button
                onClick={() => setSelectedRequestForReview(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[75vh]">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-11 h-11 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 shadow-sm">
                  <Trash2 size={22} />
                </div>
                <div>
                  <h4 className="text-[16px] font-bold text-gray-800 leading-tight mb-1">
                    Pengajuan Pengosongan Baru
                  </h4>
                  <p className="text-xs text-gray-500 font-medium">
                    {new Date(selectedRequestForReview.createdAt).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    lalu
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                Warga ({selectedRequestForReview.user.name}) mengajukan pengosongan tong{" "}
                {selectedRequestForReview.bin.qrCode} di{" "}
                {selectedRequestForReview.bin.rtRw?.name || "RT 01 / RW 04"}.
              </p>

              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex gap-3 mb-4">
                <ShieldAlert className="text-orange-500 shrink-0 mt-0.5" size={20} />
                <div className="text-xs text-orange-800">
                  <p className="font-bold mb-0.5">Tindakan Review Diperlukan</p>
                  <p className="leading-relaxed">
                    Warga telah mengajukan pengosongan tempat sampah. Tinjau pengajuan ini dan tentukan tindakan Anda.
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden mb-5">
                <div className="p-3.5 border-b border-gray-200 bg-white">
                  <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">
                    DETAIL PENGAJUAN
                  </p>
                  <p className="text-xs text-gray-800 font-medium leading-relaxed">
                    Warga ({selectedRequestForReview.user.name}) mengajukan pengosongan tong{" "}
                    {selectedRequestForReview.bin.qrCode} di{" "}
                    {selectedRequestForReview.bin.rtRw?.name || "RT 01 / RW 04"}.
                  </p>
                </div>
                <div className="p-3.5 bg-gray-50 flex flex-col gap-2">
                  <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">
                    FOTO BUKTI DARI WARGA
                  </p>
                  {selectedRequestForReview.evidencePhotoUrl ? (
                    <img
                      src={
                        selectedRequestForReview.evidencePhotoUrl.startsWith("/uploads")
                          ? `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1").replace("/api/v1", "")}${selectedRequestForReview.evidencePhotoUrl}`
                          : selectedRequestForReview.evidencePhotoUrl
                      }
                      alt="Bukti tong penuh"
                      className="w-full h-44 object-cover rounded-lg border border-gray-200"
                    />
                  ) : (
                    <div className="w-full h-36 bg-gray-100 rounded-lg border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 gap-1.5">
                      <ImageOff size={28} />
                      <p className="text-xs text-gray-400">Foto bukti belum diunggah oleh warga</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    handleUpdateRequestStatus(selectedRequestForReview.id, "REJECTED");
                    setSelectedRequestForReview(null);
                  }}
                  className="flex-1 py-3 rounded-xl text-xs font-bold border border-rose-200 text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                >
                  ✕ Tolak Pengajuan
                </button>
                <button
                  onClick={() => {
                    handleApproveRequest(selectedRequestForReview.id);
                    setSelectedRequestForReview(null);
                  }}
                  className="flex-1 py-3 rounded-xl text-xs font-bold bg-green-600 hover:bg-green-700 text-white transition-all shadow-sm cursor-pointer"
                >
                  ✓ Setujui & Reset Tong
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManajemenPengangkutan;
