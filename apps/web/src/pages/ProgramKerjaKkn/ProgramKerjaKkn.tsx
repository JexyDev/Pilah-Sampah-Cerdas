/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */

import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Download,
  Printer,
  Loader2,
  X,
  Building
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/useAuthStore";
import { dplService, type ProgramKerjaItem } from "../../services/dplService";
import api from "../../services/api";
import { ConfirmModal } from "../../components/common/ConfirmModal";

export const ProgramKerjaKkn: React.FC = () => {
  const { user } = useAuthStore();
  const userRole = String(user?.peran || "").toUpperCase();
  const isDpl = ["DPL", "DOSEN_PEMBIMBING"].includes(userRole);
  const isManagement = ["SUPER_USER", "PANITIA_TASKFORCE", "DEVELOPER"].includes(userRole);
  const canModifyProker = isManagement || isDpl;

  const [loading, setLoading] = useState(true);
  const [prokerList, setProkerList] = useState<ProgramKerjaItem[]>([]);
  const [kelompokList, setKelompokList] = useState<any[]>([]);
  const [selectedKelompokId, setSelectedKelompokId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modal State for Add / Edit
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    kelompokId: "",
    nomor: 1,
    deskripsi: "",
    kebutuhanBiaya: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Decision (DPL Accept / Reject)
  const [decisionModal, setDecisionModal] = useState<{
    isOpen: boolean;
    prokerId: string;
    action: "DITERIMA" | "DITOLAK";
    prokerDeskripsi: string;
    catatan: string;
  }>({
    isOpen: false,
    prokerId: "",
    action: "DITERIMA",
    prokerDeskripsi: "",
    catatan: "",
  });

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

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch kelompok list
      const kelRes = await api.get("/kelompok");
      if (kelRes.data?.success && Array.isArray(kelRes.data.data)) {
        setKelompokList(kelRes.data.data);
      }

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
    setFormData({
      kelompokId: kelompokList[0]?.id || "",
      nomor: prokerList.length + 1,
      deskripsi: "",
      kebutuhanBiaya: 0,
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (item: ProgramKerjaItem) => {
    setFormMode("edit");
    setEditingId(item.id);
    setFormData({
      kelompokId: item.kelompokId,
      nomor: item.nomor,
      deskripsi: item.deskripsi,
      kebutuhanBiaya: item.kebutuhanBiaya,
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
          kebutuhanBiaya: Number(formData.kebutuhanBiaya),
        });
        toast.success("Rencana program kerja berhasil ditambahkan");
      } else if (editingId) {
        await dplService.updateProgramKerja(editingId, {
          nomor: Number(formData.nomor),
          deskripsi: formData.deskripsi,
          kebutuhanBiaya: Number(formData.kebutuhanBiaya),
        });
        toast.success("Rencana program kerja berhasil diperbarui");
      }
      setIsFormModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menyimpan program kerja");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDecision = async () => {
    if (!decisionModal.prokerId) return;
    setIsSubmitting(true);
    try {
      await dplService.decideProgramKerja(
        decisionModal.prokerId,
        decisionModal.action,
        decisionModal.catatan
      );
      toast.success(
        `Program kerja berhasil ${decisionModal.action === "DITERIMA" ? "Diterima / Disepakati" : "Ditolak"}`
      );
      setDecisionModal({ isOpen: false, prokerId: "", action: "DITERIMA", prokerDeskripsi: "", catatan: "" });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal memproses keputusan");
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
      toast.error(err.response?.data?.message || "Gagal menghapus program kerja");
    }
  };

  // Filtered List
  const filteredProkers = prokerList.filter((item) => {
    const matchesSearch =
      item.deskripsi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.kelompokName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.kelurahan.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalBiaya = filteredProkers.reduce((acc, p) => acc + (p.kebutuhanBiaya || 0), 0);
  const totalDiterima = filteredProkers.filter((p) => p.status === "DITERIMA").length;
  const totalMenunggu = filteredProkers.filter((p) => p.status === "BELUM_DISETUJUI").length;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    if (filteredProkers.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }
    const headers = ["No", "Kelompok", "Kelurahan", "Deskripsi Rencana Kegiatan", "Kebutuhan Biaya (Rp)", "Status", "Catatan DPL"];
    const rows = filteredProkers.map((p, idx) => [
      p.nomor || idx + 1,
      `"${p.kelompokName}"`,
      `"${p.kelurahan}"`,
      `"${p.deskripsi.replace(/"/g, '""')}"`,
      p.kebutuhanBiaya,
      p.status,
      `"${(p.catatanDpl || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Program_Kerja_KKN_Coblong_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Data program kerja berhasil diekspor ke CSV!");
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-800">
      {/* Clean Flat Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Program Kerja KKN</h1>
          <p className="text-slate-500 text-sm mt-1">
            Rencana program kegiatan mahasiswa KKN di wilayah dampingan yang disepakati dan divalidasi oleh Dosen Pembimbing Lapangan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-xl font-bold text-xs shadow-2xs transition-all cursor-pointer"
          >
            <Download size={15} />
            Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-xl font-bold text-xs shadow-2xs transition-all cursor-pointer"
          >
            <Printer size={15} />
            Cetak
          </button>
          {canModifyProker && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold text-xs shadow-xs transition-all cursor-pointer"
            >
              <Plus size={16} />
              Tambah Rencana Kegiatan
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs text-slate-500 font-semibold">Total Rencana Proker</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{filteredProkers.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs text-emerald-600 font-semibold">Proker Disepakati / Diterima</span>
          <p className="text-2xl font-black text-emerald-700 mt-1">{totalDiterima}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs text-amber-600 font-semibold">Menunggu Review DPL</span>
          <p className="text-2xl font-black text-amber-700 mt-1">{totalMenunggu}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs text-slate-500 font-semibold">Total Kebutuhan Biaya</span>
          <p className="text-xl font-black text-slate-900 mt-1 truncate">
            Rp {totalBiaya.toLocaleString("id-ID")}
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Kelompok Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Kelompok:</span>
            <select
              value={selectedKelompokId}
              onChange={(e) => setSelectedKelompokId(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">Semua Kelompok Binaan</option>
              {kelompokList.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name} ({k.kelurahan || "Coblong"})
                </option>
              ))}
            </select>
          </div>

        {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="DITERIMA">Disetujui DPL</option>
              <option value="SEDANG_BERJALAN">Sedang Dikerjakan</option>
              <option value="SELESAI">Sudah Selesai</option>
              <option value="BELUM_DISETUJUI">Belum Disetujui</option>
              <option value="DITOLAK">Ditolak</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari rencana kegiatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="animate-spin text-emerald-600" size={32} />
            <span className="text-xs font-semibold">Memuat rencana kerja mahasiswa...</span>
          </div>
        ) : filteredProkers.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <FileSpreadsheet className="mx-auto text-slate-300" size={48} />
            <h3 className="text-sm font-bold text-slate-700">Belum Ada Program Kerja</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Rencana kerja mahasiswa KKN di kelompok ini belum diinput atau tidak cocok dengan filter pencarian.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead>
                <tr className="bg-slate-50/90 text-slate-500 border-b border-slate-200 text-[11px] uppercase tracking-wider font-bold">
                  <th className="py-3.5 px-4 w-12 text-center">No</th>
                  <th className="py-3.5 px-4 w-48">Kelompok & Wilayah</th>
                  <th className="py-3.5 px-4 min-w-[280px]">Deskripsi Rencana Kegiatan</th>
                  <th className="py-3.5 px-4 w-36 text-right">Kebutuhan Biaya</th>
                  <th className="py-3.5 px-4 w-36 text-center">Status</th>
                  <th className="py-3.5 px-4 w-44">Catatan DPL</th>
                  <th className="py-3.5 px-4 w-36 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredProkers.map((p, idx) => {
                  const isAccepted = p.status === "DITERIMA";
                  const isRejected = p.status === "DITOLAK";
                  const isPending = p.status === "BELUM_DISETUJUI";
                  const isProgress = p.status === "SEDANG_BERJALAN";
                  const isDone = p.status === "SELESAI";

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold text-slate-500">
                        {p.nomor || idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{p.kelompokName}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building size={12} className="text-slate-400" />
                          <span>Kel. {p.kelurahan}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="text-slate-900 leading-relaxed font-normal whitespace-pre-wrap">
                          {p.deskripsi}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        Rp {Number(p.kebutuhanBiaya || 0).toLocaleString("id-ID")}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isAccepted && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-[10.5px]">
                            <CheckCircle2 size={12} />
                            Disetujui
                          </span>
                        )}
                        {isProgress && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-bold text-[10.5px]">
                            <Clock size={12} />
                            Sedang Berjalan
                          </span>
                        )}
                        {isDone && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full font-bold text-[10.5px]">
                            <CheckCircle2 size={12} />
                            Selesai
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full font-bold text-[10.5px]">
                            <XCircle size={12} />
                            Ditolak
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-bold text-[10.5px]">
                            <Clock size={12} />
                            Belum Disetujui
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px] italic">
                        {p.catatanDpl || "-"}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isDpl && (
                            <>
                              <button
                                onClick={() =>
                                  setDecisionModal({
                                    isOpen: true,
                                    prokerId: p.id,
                                    action: "DITERIMA",
                                    prokerDeskripsi: p.deskripsi,
                                    catatan: p.catatanDpl || "",
                                  })
                                }
                                title="Terima Rencana Kerja"
                                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                              >
                                <CheckCircle2 size={15} />
                              </button>
                              <button
                                onClick={() =>
                                  setDecisionModal({
                                    isOpen: true,
                                    prokerId: p.id,
                                    action: "DITOLAK",
                                    prokerDeskripsi: p.deskripsi,
                                    catatan: p.catatanDpl || "",
                                  })
                                }
                                title="Tolak Rencana Kerja"
                                className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                              >
                                <XCircle size={15} />
                              </button>
                            </>
                          )}
                          {canModifyProker && (
                            <>
                              <button
                                onClick={() => handleOpenEditModal(p)}
                                title="Edit Rencana Kerja"
                                className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() =>
                                  setDeleteModal({
                                    isOpen: true,
                                    id: p.id,
                                    deskripsi: p.deskripsi,
                                  })
                                }
                                title="Hapus Rencana Kerja"
                                className="p-1.5 rounded-lg bg-slate-100 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>


      {/* Modal Add / Edit Form */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
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
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kelompok KKN Binaan
                </label>
                <select
                  value={formData.kelompokId}
                  onChange={(e) => setFormData({ ...formData, kelompokId: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500"
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor Urut
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.nomor}
                    onChange={(e) => setFormData({ ...formData, nomor: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kebutuhan Biaya (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={formData.kebutuhanBiaya}
                    onChange={(e) => setFormData({ ...formData, kebutuhanBiaya: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Deskripsi Rencana Kegiatan
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Jelaskan deskripsi target dan langkah program kerja yang akan dilaksanakan..."
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                  Simpan Rencana
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Decision DPL */}
      {decisionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                {decisionModal.action === "DITERIMA" ? (
                  <CheckCircle2 className="text-emerald-600" size={20} />
                ) : (
                  <XCircle className="text-rose-600" size={20} />
                )}
                {decisionModal.action === "DITERIMA"
                  ? "Persetujuan Rencana Kerja"
                  : "Penolakan Rencana Kerja"}
              </h3>
              <button
                onClick={() => setDecisionModal({ ...decisionModal, isOpen: false })}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Rencana Kerja</span>
              <p className="text-slate-800 font-medium">{decisionModal.prokerDeskripsi}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Catatan DPL {decisionModal.action === "DITOLAK" && <span className="text-rose-500">*</span>}
              </label>
              <textarea
                rows={3}
                placeholder={
                  decisionModal.action === "DITERIMA"
                    ? "Berikan arahan atau catatan persetujuan (opsional)..."
                    : "Berikan alasan penolakan dan saran perbaikan..."
                }
                value={decisionModal.catatan}
                onChange={(e) => setDecisionModal({ ...decisionModal, catatan: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDecisionModal({ ...decisionModal, isOpen: false })}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDecision}
                disabled={isSubmitting}
                className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 ${
                  decisionModal.action === "DITERIMA"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                Konfirmasi {decisionModal.action === "DITERIMA" ? "Terima" : "Tolak"}
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
