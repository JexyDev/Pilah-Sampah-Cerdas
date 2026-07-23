import { ShieldCheck } from "lucide-react";
/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useEffect, useState } from "react";
import api from "../../utils/api";
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

  const fetchDiscrepancies = async () => {
    try {
      const res = await api.get("/waste/logs/discrepancies");
      if (res.data.success) {
        setLogs(res.data.data);
      }
    } catch (e) {
      console.error("Gagal mengambil data diskrepansi:", e);
      toast.error("Gagal memuat daftar review diskrepansi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscrepancies();
  }, []);

  const handleResolve = async (id: string, finalClassification: string) => {
    try {
      const res = await api.put(`/waste/logs/${id}/resolve`, {
        finalClassification,
      });
      if (res.data.success) {
        toast.success(`Discrepancy berhasil di-resolve: Menggunakan keputusan ${finalClassification}`);
        setSelectedLog(null);
        fetchDiscrepancies();
      }
    } catch (e) {
      console.error("Gagal resolve diskrepansi:", e);
      toast.error("Gagal menyelesaikan review diskrepansi");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Review Diskrepansi Klasifikasi AI</h1>
        <p className="text-sm text-gray-500 mt-1">
          Daftar setoran warga yang memiliki perbedaan klasifikasi mencolok antara deteksi AI (lebih dari 90%) dan verifikasi fisik petugas.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table List of Pending Reviews */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h3 className="font-bold text-gray-800 text-sm">Menunggu Keputusan Tinjauan</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
              <thead className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Tanggal</th>
                  <th className="px-6 py-3">Warga</th>
                  <th className="px-6 py-3 text-center">Deteksi AI</th>
                  <th className="px-6 py-3 text-center">Fisik Petugas</th>
                  <th className="px-6 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-gray-700">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                      Semua diskrepansi klasifikasi telah diselesaikan (0 pending).
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className={`hover:bg-gray-50 transition cursor-pointer ${
                        selectedLog?.id === log.id ? "bg-primary/5" : ""
                      }`}
                    >
                      <td className="px-6 py-4 text-xs font-semibold text-gray-500">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{log.household?.user?.name}</div>
                        <div className="text-[10px] text-gray-400">
                          {log.household?.rtRw?.name} (Kel. {log.household?.rtRw?.kelurahan?.name})
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 uppercase">
                          {log.aiClassification} ({Number(log.aiConfidence).toFixed(0)}%)
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-orange-50 text-orange-700 uppercase">
                          {log.petugasClassification}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-primary hover:text-primary-dark font-bold text-xs">
                          Tinjau
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
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-fit min-h-[400px]">
          {selectedLog ? (
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-extrabold text-gray-900 text-base">Detail Diskrepansi</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">Tinjau kontras deteksi sensor AI vs pengamatan mata petugas.</p>
              </div>

              {/* Contrast Panel */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-gray-400">Model AI</span>
                  <div className="text-sm font-bold text-indigo-700 font-mono">{selectedLog.aiClassification}</div>
                  <span className="text-[10px] text-gray-500 block">Confidence: {Number(selectedLog.aiConfidence).toFixed(1)}%</span>
                  <span className="text-[10px] text-gray-500 block">Berat: {selectedLog.weightKg} Kg</span>
                </div>
                <div className="space-y-1 border-l border-gray-200 pl-4">
                  <span className="text-[9px] uppercase font-bold text-gray-400">Petugas Fisik</span>
                  <div className="text-sm font-bold text-orange-700 font-mono">{selectedLog.petugasClassification}</div>
                  <span className="text-[10px] text-gray-500 block">Timbangan: {selectedLog.actualWeightPetugas} Kg</span>
                  <span className="text-[10px] text-gray-500 block">Lokasi: {selectedLog.geolocation}</span>
                </div>
              </div>

              {/* Resolution Action */}
              <div className="space-y-3">
                <p className="text-xs text-gray-500 leading-relaxed">
                  Putusan akhir akan memperbarui klasifikasi permanen di basis data dan melakukan kalkulasi ulang poin bonus bagi Warga.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleResolve(selectedLog.id, selectedLog.aiClassification)}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition"
                  >
                    Setujui Hasil AI
                  </button>
                  <button
                    onClick={() => handleResolve(selectedLog.id, selectedLog.petugasClassification)}
                    className="flex-1 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold shadow-sm transition"
                  >
                    Setujui Petugas
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <ShieldCheck className="text-gray-300" size={64} />
              <div>
                <h4 className="font-bold text-gray-800 text-sm">Tidak Ada Tinjauan Aktif</h4>
                <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                  Pilih salah satu baris di tabel sebelah kiri untuk meninjau detail diskrepansi setoran sampah.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
