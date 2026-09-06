import { ShieldCheck, Image as ImageIcon, X, Filter, Check } from "lucide-react";
/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useEffect, useState, useCallback } from "react";
import api from "../../utils/api";
import { resolveImageUrl } from "../../utils/imageUrl";
import toast from "react-hot-toast";

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

  const fetchDiscrepancies = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== "Semua") params.append("status", filterStatus);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const res = await api.get(`/waste/logs/discrepancies?${params.toString()}`);
      if (res.data.success) {
        setLogs(res.data.data);
      }
    } catch (e) {
      console.error("Gagal mengambil data diskrepansi:", e);
      toast.error("Gagal memuat daftar review diskrepansi");
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
      
      const res = await api.put(`/waste/logs/${id}/resolve`, payload);
      if (res.data.success) {
        toast.success(`Data disetujui, poin diteruskan ke rekap setoran warga`);
        setSelectedLog(null);
        setIsKoreksiModalOpen(false);
        fetchDiscrepancies();
      }
    } catch (e: any) {
      console.error("Gagal resolve diskrepansi:", e);
      toast.error(e.response?.data?.message || "Gagal menyelesaikan review diskrepansi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitKoreksi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLog) return;
    const weightNum = parseFloat(koreksiWeight);
    if (isNaN(weightNum) || weightNum <= 0) {
      toast.error("Berat harus berupa angka positif");
      return;
    }
    handleResolve(selectedLog.id, koreksiClass, weightNum);
  };

  const openKoreksiModal = () => {
    if (!selectedLog) return;
    setKoreksiClass(selectedLog.petugasClassification);
    setKoreksiWeight(selectedLog.actualWeightPetugas || selectedLog.weightKg);
    setIsKoreksiModalOpen(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Review Diskrepansi AI</h1>
          <p className="text-sm text-gray-500 mt-1">
            Daftar setoran warga dengan perbedaan klasifikasi antara AI & petugas.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <span className="text-xs font-bold text-gray-500">Filter:</span>
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs border-gray-300 rounded-lg focus:ring-primary focus:border-primary px-3 py-1.5"
          >
            <option value="Semua">Semua Status</option>
            <option value="PENDING_REVIEW">Menunggu Review</option>
            <option value="RESOLVED">Selesai (Resolved)</option>
          </select>
          
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs border-gray-300 rounded-lg focus:ring-primary focus:border-primary px-3 py-1.5"
            />
            <span className="text-xs text-gray-400">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs border-gray-300 rounded-lg focus:ring-primary focus:border-primary px-3 py-1.5"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table List of Pending Reviews */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col h-[70vh]">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 dark:bg-slate-800/50 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 text-sm">Daftar Laporan Diskrepansi</h3>
            {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>}
          </div>
          <div className="overflow-auto flex-1">
            <table className="min-w-full divide-y divide-gray-200 text-sm text-left relative">
              <thead className="bg-gray-50 dark:bg-slate-800 text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3">Tanggal</th>
                  <th className="px-6 py-3">Warga</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-center">Deteksi AI</th>
                  <th className="px-6 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-gray-700">
                {logs.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                      Tidak ada data diskrepansi sesuai filter.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className={`hover:bg-gray-50 dark:hover:bg-slate-800 transition cursor-pointer ${
                        selectedLog?.id === log.id ? "bg-primary/5 border-l-4 border-l-primary" : "border-l-4 border-l-transparent"
                      }`}
                    >
                      <td className="px-6 py-4 text-xs font-semibold text-gray-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900 line-clamp-1">{log.household?.user?.name}</div>
                        <div className="text-[10px] text-gray-400 line-clamp-1">
                          {log.household?.rtRw?.name} (Kel. {log.household?.rtRw?.kelurahan?.name})
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {log.discrepancyStatus === "RESOLVED" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-700 uppercase">
                            Selesai
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-50 text-yellow-700 uppercase">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 uppercase">
                          {log.aiClassification}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-primary hover:text-primary-dark font-bold text-xs whitespace-nowrap">
                          {log.discrepancyStatus === "RESOLVED" ? "Lihat" : "Tinjau"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel Resolution Detail */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col h-[70vh] overflow-y-auto">
          {selectedLog ? (
            <div className="space-y-6 flex-1 flex flex-col">
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="font-extrabold text-gray-900 text-base">Detail Tinjauan</h3>
                  {selectedLog.discrepancyStatus === "RESOLVED" && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
                      <Check size={12} /> Terselesaikan
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5">Kontras antara deteksi sensor AI vs petugas.</p>
              </div>

              {/* Image Preview Thumbnail */}
              {selectedLog.evidencePhotoUrl ? (
                <div 
                  className="w-full h-40 bg-gray-100 dark:bg-slate-800 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 cursor-pointer group relative shadow-sm"
                  onClick={() => setIsPhotoModalOpen(true)}
                >
                  <img 
                    src={resolveImageUrl(selectedLog.evidencePhotoUrl)} 
                    alt="Bukti Fisik" 
                    className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 bg-white/90 dark:bg-slate-800/90 text-gray-900 dark:text-slate-100 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
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
              <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-slate-850 p-4 rounded-xl border border-gray-100 dark:border-slate-800">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-gray-400">Model AI</span>
                  <div className="text-sm font-bold text-indigo-700 font-mono">{selectedLog.aiClassification}</div>
                  <span className="text-[10px] text-gray-500 block">Conf: {Number(selectedLog.aiConfidence).toFixed(2)}%</span>
                  <span className="text-[10px] text-gray-500 block">Berat: {Number(selectedLog.weightKg || 0).toFixed(2)} Kg</span>
                </div>
                <div className="space-y-1 border-l border-gray-200 pl-4">
                  <span className="text-[9px] uppercase font-bold text-gray-400">Fisik Petugas</span>
                  <div className="text-sm font-bold text-orange-700 font-mono">{selectedLog.petugasClassification}</div>
                  <span className="text-[10px] text-gray-500 block">Actual: {Number(selectedLog.actualWeightPetugas || selectedLog.weightKg || 0).toFixed(2)} Kg</span>
                  <span className="text-[10px] text-gray-500 block truncate" title={selectedLog.geolocation}>Lokasi: {selectedLog.geolocation || "-"}</span>
                </div>
              </div>

              {/* Resolution Action */}
              <div className="space-y-3 mt-auto pt-4 border-t border-gray-100">
                {selectedLog.discrepancyStatus === "PENDING_REVIEW" ? (
                  <>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Putusan akan memperbarui klasifikasi permanen di basis data dan mengkalkulasi ulang poin Warga.
                    </p>
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <button
                          disabled={isSubmitting}
                          onClick={() => handleResolve(selectedLog.id, selectedLog.aiClassification)}
                          className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold shadow-sm transition disabled:opacity-50"
                        >
                          Approve AI
                        </button>
                        <button
                          disabled={isSubmitting}
                          onClick={() => handleResolve(selectedLog.id, selectedLog.petugasClassification)}
                          className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-[11px] font-bold shadow-sm transition disabled:opacity-50"
                        >
                          Approve Petugas
                        </button>
                      </div>
                      <button
                        disabled={isSubmitting}
                        onClick={openKoreksiModal}
                        className="w-full py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-[11px] font-bold shadow-sm transition disabled:opacity-50"
                      >
                        Koreksi Manual / Reject
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-center text-gray-400 dark:text-slate-400 italic bg-gray-50 dark:bg-slate-850 p-3 rounded-lg border border-gray-100 dark:border-slate-800">
                    Diskrepansi ini telah diputuskan.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-70">
              <ShieldCheck className="text-gray-300" size={64} />
              <div>
                <h4 className="font-bold text-gray-800 text-sm">Tidak Ada Tinjauan Aktif</h4>
                <p className="text-[11px] text-gray-400 mt-1 max-w-xs mx-auto">
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
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors p-2 bg-black/50 rounded-full"
            >
              <X size={24} />
            </button>
            <img 
              src={resolveImageUrl(selectedLog.evidencePhotoUrl)} 
              alt="Bukti Fisik Resolusi Tinggi" 
              className="w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Modal Koreksi Manual */}
      {isKoreksiModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in zoom-in-95 duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
              <h3 className="text-lg font-bold text-gray-900">Koreksi Manual Hasil Tinjauan</h3>
              <button
                onClick={() => setIsKoreksiModalOpen(false)}
                className="text-gray-400 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 p-1.5 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={submitKoreksi} className="p-6 flex flex-col gap-5">
              <p className="text-xs text-gray-500 leading-relaxed mb-2">
                Pilih keputusan final klasifikasi dan perbaiki berat aktual jika terdapat kesalahan dari kedua belah pihak.
              </p>
              
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">
                  Klasifikasi Final
                </label>
                <select
                  required
                  value={koreksiClass}
                  onChange={(e) => setKoreksiClass(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:border-primary focus:ring-1 focus:ring-primary focus:bg-white dark:focus:bg-slate-700 text-slate-800 dark:text-slate-100 transition-colors text-sm font-semibold"
                >
                  <option value="ORGANIC">Organik</option>
                  <option value="NON_ORGANIC">Anorganik / Non-Organik</option>
                  <option value="B3">B3</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">
                  Berat Aktual (Kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={koreksiWeight}
                  onChange={(e) => setKoreksiWeight(e.target.value)}
                  placeholder="Misal: 2.5"
                  className="w-full h-11 px-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:border-primary focus:ring-1 focus:ring-primary focus:bg-white dark:focus:bg-slate-700 text-slate-800 dark:text-slate-100 transition-colors text-sm"
                />
              </div>

              <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsKoreksiModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl font-bold text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark shadow-sm shadow-primary/20 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Koreksi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

