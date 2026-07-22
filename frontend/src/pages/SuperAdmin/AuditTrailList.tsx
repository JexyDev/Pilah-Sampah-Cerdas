/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import toast from "react-hot-toast";

interface AuditTrail {
  id: string;
  action: string;
  userId: string | null;
  user: { name: string; email: string; role: { name: string } } | null;
  timestamp: string;
  oldValue: any;
  newValue: any;
}

export const AuditTrailList: React.FC = () => {
  const [logs, setLogs] = useState<AuditTrail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionFilter, setActionFilter] = useState<string>("");
  const [selectedLog, setSelectedLog] = useState<AuditTrail | null>(null);

  const fetchLogs = async () => {
    try {
      const res = await api.get("/super-admin/audit-trail", {
        params: { action: actionFilter || undefined },
      });
      if (res.data.success) {
        setLogs(res.data.data);
      }
    } catch (error) {
      console.error("Gagal memuat log audit:", error);
      toast.error("Gagal memuat audit log");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Audit Trail Transaksi</h1>
          <p className="text-sm text-gray-500 mt-1">Jejak audit seluruh perubahan data, aksi mutasi, dan transaksi penting dalam sistem.</p>
        </div>
        <div className="flex gap-2">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary shadow-sm"
          >
            <option value="">Semua Aksi</option>
            <option value="REACTIVATE_BIN">Reaktivasi Bin</option>
            <option value="KKN_HANDOVER">Handover KKN</option>
            <option value="GENERATE_QR_BATCH">Generate QR Batch</option>
            <option value="APPROVE_ACTIVATION">Approve Bin</option>
            <option value="REJECT_ACTIVATION">Reject Bin</option>
            <option value="REPORT_BIN_BROKEN">Lapor Bin Rusak</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Logs Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
              <thead className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Timestamp</th>
                  <th className="px-6 py-3">Aksi</th>
                  <th className="px-6 py-3">Pengguna</th>
                  <th className="px-6 py-3 text-right">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                      Tidak ada log audit ditemukan
                    </td>
                  </tr>
                ) : (
                  logs.map((l, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition cursor-pointer" onClick={() => setSelectedLog(l)}>
                      <td className="px-6 py-4 text-xs font-semibold text-gray-500">
                        {new Date(l.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary uppercase font-mono">
                          {l.action}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{l.user ? l.user.name : "System"}</div>
                        <div className="text-xs text-gray-400">{l.user ? l.user.email : "-"}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-primary hover:underline font-bold text-xs">
                          Lihat JSON
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* View JSON Detail Panel */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-fit space-y-4">
          <div>
            <h3 className="font-bold text-gray-800 text-sm">Detail Payload Transaksi</h3>
            <p className="text-xs text-gray-500 mt-1">Perbandingan nilai lama dan nilai baru hasil mutasi.</p>
          </div>
          {selectedLog ? (
            <div className="space-y-4 flex-1">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Aksi</span>
                <p className="text-sm font-semibold text-primary font-mono">{selectedLog.action}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Nilai Baru (New Value)</span>
                <pre className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-[10px] font-mono text-gray-700 overflow-x-auto whitespace-pre-wrap max-h-48">
                  {JSON.stringify(selectedLog.newValue, null, 2)}
                </pre>
              </div>
              {selectedLog.oldValue && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Nilai Lama (Old Value)</span>
                  <pre className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-[10px] font-mono text-gray-700 overflow-x-auto whitespace-pre-wrap max-h-48">
                    {JSON.stringify(selectedLog.oldValue, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-xs text-gray-400 py-12">
              Pilih salah satu log di tabel untuk melihat detail muatan data
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
