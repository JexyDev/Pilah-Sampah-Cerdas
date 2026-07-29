/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */

import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import { useAuthStore } from "../../store/useAuthStore";
import toast from "react-hot-toast";
import { 
  Loader2, 
  Pencil, 
  Trash2, 
  Plus, 
  Truck, 
  UserCheck, 
  Calendar, 
  CheckCircle
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

export const ManajemenPengangkutan: React.FC = () => {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<DispatchTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [areas, setAreas] = useState<AreaItem[]>([]);
  const [bins, setBins] = useState<BinItem[]>([]);
  const [petugasList, setPetugasList] = useState<PetugasItem[]>([]);

  // Filter States
  const [statusFilter, setStatusFilter] = useState("");
  const [rwFilter, setRwFilter] = useState("");

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
        setPetugasList(usersRes.data.data.filter((u: any) => u.peran === "PETUGAS_RESIDU"));
      }
    } catch (e) {
      console.error("Gagal memuat data pembantu filter/modal", e);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [statusFilter, rwFilter]);

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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Pengangkutan Sampah</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manajemen dan pemantauan penugasan pengangkutan sampah dari gawai warga ke pemrosesan hilir.
          </p>
        </div>

        {!isReadOnly && !isPetugas && (
          <button
            onClick={openAddModal}
            className="bg-primary hover:bg-primary/95 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-primary/20 transition-all duration-200 flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} />
            Catat Tugas Baru
          </button>
        )}
      </div>

      {/* Filter Section */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
          <Truck size={14} />
          <span>Filter Status & Wilayah:</span>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
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
            onChange={(e) => setRwFilter(e.target.value)}
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

      {/* Table Section */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-800">Daftar Penugasan Pengangkutan</h2>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400 flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs">Memuat tugas...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-16 text-gray-400 border border-dashed border-gray-200 rounded-xl">
            <Truck className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-medium">Belum ada tugas pengangkutan sampah.</p>
          </div>
        ) : (
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
                {tasks.map((task) => (
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
        )}
      </div>

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
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Pilih Tempat Sampah (Bin)</label>
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
    </div>
  );
};

export default ManajemenPengangkutan;
