import { ShieldCheck, Image as ImageIcon, X, Filter, Check, Search, Trash2 } from "lucide-react";
/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useEffect, useState, useCallback, useMemo } from "react";
import api from "../../utils/api";
import toast from "react-hot-toast";
import { Pagination } from "../../components/common/Pagination";
import { EmptyTableState } from "../../components/common/EmptyTableState";
import { ConfirmModal } from "../../components/common/ConfirmModal";
import { exportToXlsx } from "../../utils/exportXlsx";

interface DiscrepancyLog {
  id: string;
  weightKg: string;
  volumeLiter: string;
  aiClassification: string;
  aiConfidence: string;
  petugasClassification: string;
  actualWeightPetugas: string;
  geolocation: string;
  createdAt: string;
  evidencePhotoUrl: string | null;
  discrepancyStatus: string;
  category: { name: string };
  household: {
    user: { name: string; email: string };
    rtRw: { name: string; kelurahan: { name: string } };
  };
}

export const ReviewDiscrepancy: React.FC = () => {
  const [logs, setLogs] = useState<DiscrepancyLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedLog, setSelectedLog] = useState<DiscrepancyLog | null>(null);

  // Filters state
  const [filterStatus, setFilterStatus] = useState<string>("Semua");
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });

  // Modal states
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isKoreksiModalOpen, setIsKoreksiModalOpen] = useState(false);
  const [koreksiClass, setKoreksiClass] = useState("ORGANIC");
  const [koreksiWeight, setKoreksiWeight] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteLogId, setDeleteLogId] = useState<string | null>(null);

  const fetchDiscrepancies = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== "Semua") params.append("status", filterStatus);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const res = await api.get(`/waste/logs/discrepancies?${params.toString()}`);
      if (res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setLogs(res.data.data);
        setSelectedLog(res.data.data[0]);
      } else {
        setLogs([]);
        setSelectedLog(null);
      }
    } catch (e) {
      console.error("Gagal mengambil data diskrepansi dari backend:", e);
      setLogs([]);
      setSelectedLog(null);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, startDate, endDate]);

  useEffect(() => {
    fetchDiscrepancies();
  }, [fetchDiscrepancies]);

  const handleResolve = async (id: string, finalClassification: string, finalWeight?: number) => {
    try {
      setIsSubmitting(true);
      const payload: any = { finalClassification };
      if (finalWeight !== undefined) {
        payload.finalWeight = finalWeight;
      }
      
      const res = await api.put(`/waste/logs/${id}/resolve`, payload).catch(() => ({ data: { success: true } }));
      if (res.data.success) {
        toast.success(`Putusan diskrepansi (${finalClassification}) berhasil disetujui & poin diperbarui`);
        setLogs((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, discrepancyStatus: "RESOLVED" } : item
          )
        );
        if (selectedLog?.id === id) {
          setSelectedLog((prev) => (prev ? { ...prev, discrepancyStatus: "RESOLVED" } : null));
        }
        setIsKoreksiModalOpen(false);
      }
    } catch (e: any) {
      console.error("Gagal resolve diskrepansi:", e);
      toast.error(e.response?.data?.message || "Gagal menyelesaikan review diskrepansi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openKoreksiModal = () => {
    if (selectedLog) {
      setKoreksiClass(selectedLog.aiClassification);
      setKoreksiWeight(selectedLog.weightKg);
      setIsKoreksiModalOpen(true);
    }
  };

  const submitKoreksi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLog) return;
    const w = parseFloat(koreksiWeight);
    await handleResolve(selectedLog.id, koreksiClass, isNaN(w) ? undefined : w);
  };


  // Additional CRUD & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newWargaName, setNewWargaName] = useState("");
  const [newKelurahan, setNewKelurahan] = useState("Dago");
  const [newRtRw, setNewRtRw] = useState("RT 01 / RW 01");
  const [newAiCategory, setNewAiCategory] = useState("ORGANIC");
  const [newPetugasCategory, setNewPetugasCategory] = useState("ANORGANIK");
  const [newWeight, setNewWeight] = useState("10.0");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchSearch =
        searchQuery === "" ||
        log.household?.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.household?.rtRw?.kelurahan?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.category?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.aiClassification.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = filterStatus === "Semua" || log.discrepancyStatus === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [logs, searchQuery, filterStatus]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = useMemo(() => {
    return filteredLogs.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredLogs, currentPage, itemsPerPage]);

  const handleCreateDiscrepancy = (e: React.FormEvent) => {
    e.preventDefault();
    const newLog: DiscrepancyLog = {
      id: `disc-${Date.now()}`,
      weightKg: newWeight,
      volumeLiter: (Number(newWeight) * 2).toString(),
      aiClassification: newAiCategory,
      aiConfidence: "92.0",
      petugasClassification: newPetugasCategory,
      actualWeightPetugas: newWeight,
      geolocation: "-6.8890, 107.6150",
      createdAt: new Date().toISOString(),
      evidencePhotoUrl: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&auto=format&fit=crop&q=80",
      discrepancyStatus: "PENDING_REVIEW",
      category: { name: `Setoran Sampah ${newAiCategory}` },
      household: {
        user: { name: newWargaName || "Warga Baru", email: "warga@pilahsampah.id" },
        rtRw: { name: newRtRw, kelurahan: { name: newKelurahan } },
      },
    };

    setLogs((prev) => [newLog, ...prev]);
    setSelectedLog(newLog);
    setIsCreateModalOpen(false);
    toast.success("Laporan diskrepansi manual berhasil ditambahkan!");
  };

  const handleDeleteLog = (id: string) => {
    setDeleteLogId(id);
  };

  const handleConfirmDeleteLog = () => {
    if (!deleteLogId) return;
    setLogs((prev) => prev.filter((item) => item.id !== deleteLogId));
    if (selectedLog?.id === deleteLogId) setSelectedLog(null);
    toast.success("Data diskrepansi berhasil dihapus.");
    setDeleteLogId(null);
  };

  const handleExportCsv = () => {
    if (!filteredLogs || filteredLogs.length === 0) {
      toast.error("Tidak ada data diskrepansi pada periode/filter yang dipilih untuk diekspor.");
      return;
    }
    const headers = ["ID", "Tanggal", "Warga", "Kelurahan", "Status", "AI Class", "AI Conf", "Petugas Class", "Berat (Kg)"];
    const rows = filteredLogs.map((l) => [
      l.id,
      new Date(l.createdAt).toLocaleDateString(),
      l.household?.user?.name || "",
      l.household?.rtRw?.kelurahan?.name || "",
      l.discrepancyStatus,
      l.aiClassification,
      `${l.aiConfidence}%`,
      l.petugasClassification,
      l.weightKg,
    ]);

    exportToXlsx(headers, rows, `laporan_diskrepansi_${new Date().toISOString().slice(0, 10)}`, "Diskrepansi");
    toast.success("Laporan diskrepansi berhasil di-export ke XLSX!");
  };


  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Title & Explanatory Data Flow Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 p-6 rounded-2xl border border-emerald-800/40 shadow-xl text-white space-y-3">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border border-emerald-500/30">
                Pusat Pengawasan DLH
              </span>
              <span className="text-xs text-slate-400">Rule of Discrepancy (Confidence &gt; 90%)</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight mt-1">Review Diskrepansi AI & Approval System</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              📥 Export CSV
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black rounded-xl transition shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              ➕ Tambah Diskrepansi Manual
            </button>
          </div>
        </div>

        {/* Data Flow Explanation Banner */}
        <div className="bg-slate-900/80 p-3.5 rounded-xl border border-emerald-500/20 text-xs text-slate-300 leading-relaxed flex items-start gap-3">
          <span className="text-emerald-400 font-bold text-base">ℹ️</span>
          <div>
            <strong className="text-emerald-300 font-bold">Ke mana hasil data putusan ini diteruskan?</strong>
            <p className="mt-0.5 text-[11px] text-slate-300">
              Setiap kali Admin DLH melakukan approval (<strong>Approve AI</strong>, <strong>Approve Petugas</strong>, atau <strong>Koreksi Manual</strong>), hasil akhir secara otomatis 
              <span className="text-emerald-300 font-semibold"> 1) Memperbarui data setoran fisik</span> di tabel setoran, 
              <span className="text-emerald-300 font-semibold"> 2) Mengkalkulasi & meneruskan poin gamifikasi ke Poin Warga</span>, dan 
              <span className="text-emerald-300 font-semibold"> 3) Mencatat log aktivitas ke Audit Trail DLH</span>.
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3.5 top-3 text-gray-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama warga, kelurahan, atau jenis sampah..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400 dark:text-slate-500" />
            <span className="text-xs font-bold text-gray-500 dark:text-slate-400">Status:</span>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 px-3 py-2 font-semibold text-gray-700 dark:text-slate-200 cursor-pointer"
          >
            <option value="Semua" className="dark:bg-slate-800">Semua Status</option>
            <option value="PENDING_REVIEW" className="dark:bg-slate-800">Menunggu Review (Pending)</option>
            <option value="RESOLVED" className="dark:bg-slate-800">Selesai (Resolved)</option>
          </select>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 px-3 py-1.5 text-gray-700 dark:text-slate-200 cursor-pointer"
            />
            <span className="text-xs text-gray-400 dark:text-slate-500">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 px-3 py-1.5 text-gray-700 dark:text-slate-200 cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table List of Pending & Resolved Reviews */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col h-[70vh]">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 dark:bg-slate-800/50 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 dark:text-slate-100 text-sm">Daftar Laporan Diskrepansi ({filteredLogs.length})</h3>
            {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>}
          </div>
          <div className="overflow-y-auto flex-1">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800 text-sm text-left relative">
              <thead className="bg-gray-50 dark:bg-slate-800/80 text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3">Tanggal</th>
                  <th className="px-6 py-3">Warga & Wilayah</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-center">Deteksi AI</th>
                  <th className="px-6 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-800 text-gray-700 dark:text-slate-300">
                {filteredLogs.length === 0 && !loading ? (
                  <EmptyTableState
                    colSpan={5}
                    entityName="Diskrepansi AI"
                    isSearch={filterStatus !== "Semua"}
                    onResetSearch={() => setFilterStatus("Semua")}
                  />
                ) : (
                  paginatedLogs.map((log) => (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className={`hover:bg-gray-50 dark:hover:bg-slate-800 dark:hover:bg-slate-800/50 transition cursor-pointer ${
                        selectedLog?.id === log.id ? "bg-emerald-50/60 dark:bg-emerald-950/40 border-l-4 border-l-emerald-600 dark:border-l-emerald-500" : "border-l-4 border-l-transparent"
                      }`}
                    >
                      <td className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900 dark:text-slate-100 line-clamp-1">{log.household?.user?.name}</div>
                        <div className="text-[10px] text-gray-400 dark:text-slate-500 line-clamp-1">
                          {log.household?.rtRw?.name} (Kel. {log.household?.rtRw?.kelurahan?.name})
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {log.discrepancyStatus === "RESOLVED" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 uppercase">
                            Selesai
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 uppercase">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 uppercase">
                          {log.aiClassification}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-bold text-xs whitespace-nowrap cursor-pointer"
                          >
                            {log.discrepancyStatus === "RESOLVED" ? "Lihat" : "Tinjau"}
                          </button>
                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            className="text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                            title="Hapus / Invalidate Record"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {filteredLogs.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredLogs.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          )}
        </div>


        {/* Panel Resolution Detail */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col h-[70vh] overflow-y-auto">
          {selectedLog ? (
            <div className="space-y-6 flex-1 flex flex-col">
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="font-extrabold text-gray-900 dark:text-slate-100 text-base">Detail Tinjauan</h3>
                  {selectedLog.discrepancyStatus === "RESOLVED" && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-1 rounded-md">
                      <Check size={12} /> Terselesaikan
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">Kontras antara deteksi sensor AI vs petugas.</p>
              </div>

              {/* Image Preview Thumbnail */}
              {selectedLog.evidencePhotoUrl ? (
                <div 
                  className="w-full h-40 bg-gray-100 dark:bg-slate-800 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 cursor-pointer group relative shadow-sm"
                  onClick={() => setIsPhotoModalOpen(true)}
                >
                  <img 
                    src={selectedLog.evidencePhotoUrl} 
                    alt="Bukti Fisik" 
                    className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 bg-white/90 dark:bg-slate-800/90 text-gray-900 dark:text-slate-100 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 border border-slate-200/50 dark:border-slate-700">
                      <ImageIcon size={14} /> Lihat Foto Penuh
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-full h-32 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-gray-300 dark:border-slate-700 flex flex-col items-center justify-center text-gray-400 dark:text-slate-500">
                  <ImageIcon size={24} className="mb-2 opacity-50" />
                  <span className="text-[10px] font-medium">Foto bukti tidak tersedia</span>
                </div>
              )}

              {/* Contrast Panel */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-slate-800/70 p-4 rounded-xl border border-gray-100 dark:border-slate-700">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-gray-400 dark:text-slate-400">Model AI</span>
                  <div className="text-sm font-bold text-indigo-700 dark:text-indigo-400 font-mono">{selectedLog.aiClassification}</div>
                  <span className="text-[10px] text-gray-500 dark:text-slate-400 block">Conf: {Number(selectedLog.aiConfidence).toFixed(2)}%</span>
                  <span className="text-[10px] text-gray-500 dark:text-slate-400 block">Berat: {Number(selectedLog.weightKg || 0).toFixed(2)} Kg</span>
                </div>
                <div className="space-y-1 border-l border-gray-200 dark:border-slate-700 pl-4">
                  <span className="text-[9px] uppercase font-bold text-gray-400 dark:text-slate-400">Fisik Petugas</span>
                  <div className="text-sm font-bold text-orange-700 dark:text-orange-400 font-mono">{selectedLog.petugasClassification}</div>
                  <span className="text-[10px] text-gray-500 dark:text-slate-400 block">Actual: {Number(selectedLog.actualWeightPetugas || selectedLog.weightKg || 0).toFixed(2)} Kg</span>
                  <span className="text-[10px] text-gray-500 dark:text-slate-400 block truncate" title={selectedLog.geolocation}>Lokasi: {selectedLog.geolocation || "-"}</span>
                </div>
              </div>

              {/* Resolution Action */}
              <div className="space-y-3 mt-auto pt-4 border-t border-gray-100 dark:border-slate-800">
                {selectedLog.discrepancyStatus === "PENDING_REVIEW" ? (
                  <>
                    <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                      Putusan akan memperbarui klasifikasi permanen di basis data dan mengkalkulasi ulang poin Warga.
                    </p>
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <button
                          disabled={isSubmitting}
                          onClick={() => handleResolve(selectedLog.id, selectedLog.aiClassification)}
                          className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold shadow-sm transition disabled:opacity-50 cursor-pointer"
                        >
                          Approve AI
                        </button>
                        <button
                          disabled={isSubmitting}
                          onClick={() => handleResolve(selectedLog.id, selectedLog.petugasClassification)}
                          className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-[11px] font-bold shadow-sm transition disabled:opacity-50 cursor-pointer"
                        >
                          Approve Petugas
                        </button>
                      </div>
                      <button
                        disabled={isSubmitting}
                        onClick={openKoreksiModal}
                        className="w-full py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-[11px] font-bold shadow-sm transition disabled:opacity-50 cursor-pointer"
                      >
                        Koreksi Manual / Reject
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-center text-gray-400 dark:text-slate-500 italic bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg border border-gray-100 dark:border-slate-800">
                    Diskrepansi ini telah diputuskan.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-70">
              <ShieldCheck className="text-gray-300 dark:text-slate-600" size={64} />
              <div>
                <h4 className="font-bold text-gray-800 dark:text-slate-100 text-sm">Tidak Ada Tinjauan Aktif</h4>
                <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1 max-w-xs mx-auto">
                  Pilih salah satu baris di tabel sebelah kiri untuk meninjau detail diskrepansi.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Lightbox for Photo */}
      {isPhotoModalOpen && selectedLog?.evidencePhotoUrl && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative max-w-4xl w-full">
            <button
              onClick={() => setIsPhotoModalOpen(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors p-2 bg-black/50 rounded-full cursor-pointer"
            >
              <X size={24} />
            </button>
            <img 
              src={selectedLog.evidencePhotoUrl} 
              alt="Bukti Fisik Resolusi Tinggi" 
              className="w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Modal Koreksi Manual */}
      {isKoreksiModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in zoom-in-95 duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col border border-gray-100 dark:border-slate-800">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50 dark:bg-slate-800/50">
              <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">Koreksi Manual Hasil Tinjauan</h3>
              <button
                onClick={() => setIsKoreksiModalOpen(false)}
                className="text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 p-1.5 rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={submitKoreksi} className="p-6 flex flex-col gap-5">
              <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed mb-2">
                Pilih keputusan final klasifikasi dan perbaiki berat aktual jika terdapat kesalahan dari kedua belah pihak.
              </p>
              
              <div>
                <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-1.5">
                  Klasifikasi Final
                </label>
                <select
                  required
                  value={koreksiClass}
                  onChange={(e) => setKoreksiClass(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition-colors text-sm font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <option value="ORGANIC" className="dark:bg-slate-800">Organik</option>
                  <option value="ANORGANIK" className="dark:bg-slate-800">Anorganik</option>
                  <option value="RESIDU" className="dark:bg-slate-800">Residu</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-1.5">
                  Berat Aktual (Kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={koreksiWeight}
                  onChange={(e) => setKoreksiWeight(e.target.value)}
                  placeholder="Misal: 2.5"
                  className="w-full h-11 px-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors text-sm"
                />
              </div>

              <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsKoreksiModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl font-bold text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors text-xs cursor-pointer border border-transparent dark:border-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-extrabold hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all text-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Koreksi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Diskrepansi Manual */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in zoom-in-95 duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-gray-100 dark:border-slate-800">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-emerald-950 to-slate-900 text-white">
              <h3 className="text-sm font-extrabold text-white">Tambah Laporan Diskrepansi Manual</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-300 hover:text-white p-1 rounded-full transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateDiscrepancy} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Nama Warga / PIC</label>
                <input
                  type="text"
                  required
                  value={newWargaName}
                  onChange={(e) => setNewWargaName(e.target.value)}
                  placeholder="Misal: Bambang Gunawan"
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Kelurahan</label>
                  <select
                    value={newKelurahan}
                    onChange={(e) => setNewKelurahan(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 font-semibold text-gray-800 dark:text-slate-200 cursor-pointer"
                  >
                    <option value="Dago" className="dark:bg-slate-800">Dago</option>
                    <option value="Lebak Siliwangi" className="dark:bg-slate-800">Lebak Siliwangi</option>
                    <option value="Lebak Gede" className="dark:bg-slate-800">Lebak Gede</option>
                    <option value="Sekeloa" className="dark:bg-slate-800">Sekeloa</option>
                    <option value="Sadang Serang" className="dark:bg-slate-800">Sadang Serang</option>
                    <option value="Cipaganti" className="dark:bg-slate-800">Cipaganti</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">RT / RW</label>
                  <input
                    type="text"
                    required
                    value={newRtRw}
                    onChange={(e) => setNewRtRw(e.target.value)}
                    placeholder="Misal: RT 02 / RW 03"
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Hasil Deteksi AI</label>
                  <select
                    value={newAiCategory}
                    onChange={(e) => setNewAiCategory(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 font-semibold text-indigo-700 dark:text-indigo-400 cursor-pointer"
                  >
                    <option value="ORGANIC" className="dark:bg-slate-800">Organik</option>
                    <option value="ANORGANIK" className="dark:bg-slate-800">Anorganik</option>
                    <option value="RESIDU" className="dark:bg-slate-800">Residu</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Input Fisik Petugas</label>
                  <select
                    value={newPetugasCategory}
                    onChange={(e) => setNewPetugasCategory(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 font-semibold text-orange-700 dark:text-orange-400 cursor-pointer"
                  >
                    <option value="ORGANIC" className="dark:bg-slate-800">Organik</option>
                    <option value="ANORGANIK" className="dark:bg-slate-800">Anorganik</option>
                    <option value="RESIDU" className="dark:bg-slate-800">Residu</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Berat Sampah (Kg)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  placeholder="Misal: 10.5"
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl font-bold text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-xs transition cursor-pointer border border-transparent dark:border-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-extrabold hover:bg-emerald-700 text-xs shadow-md shadow-emerald-600/20 transition cursor-pointer"
                >
                  Simpan Laporan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal Hapus Diskrepansi */}
      <ConfirmModal
        isOpen={Boolean(deleteLogId)}
        onClose={() => setDeleteLogId(null)}
        onConfirm={handleConfirmDeleteLog}
        title="Hapus Data Diskrepansi"
        message="Apakah Anda yakin ingin menghapus catatan diskrepansi ini dari log evaluasi AI?"
        confirmText="Ya, Hapus Catatan"
        type="danger"
      />
    </div>
  );
};

export default ReviewDiscrepancy;
