/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
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
  referenceId?: string;
  referenceType?: string;
  oldValue: any;
  newValue: any;
}

export const AuditTrailList: React.FC = () => {
  const [logs, setLogs] = useState<AuditTrail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionFilter, setActionFilter] = useState<string>("");
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [startDateFilter, setStartDateFilter] = useState<string>("");
  const [endDateFilter, setEndDateFilter] = useState<string>("");
  const [selectedLog, setSelectedLog] = useState<AuditTrail | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get("/super-admin/audit-trail", {
        params: {
          action: actionFilter || undefined,
          search: searchFilter || undefined,
          startDate: startDateFilter || undefined,
          endDate: endDateFilter || undefined,
        },
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
  }, [actionFilter, startDateFilter, endDateFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const handleResetFilters = () => {
    setActionFilter("");
    setSearchFilter("");
    setStartDateFilter("");
    setEndDateFilter("");
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Aktivitas Pemilahan Sampah (Log Mentah)</h1>
          <p className="text-sm text-gray-500 mt-1">Jejak audit (immutable) seluruh perubahan data, aksi mutasi, dan transaksi penting dalam sistem.</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Field */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Cari User / Aksi</label>
            <input
              type="text"
              placeholder="Nama user, email, atau aksi..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary shadow-sm"
            />
          </div>

          {/* Action Type Dropdown */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Tipe Aksi</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary shadow-sm"
            >
              <option value="">Semua Aksi</option>
              <option value="REACTIVATE_BIN">Reaktivasi Bin</option>
              <option value="KKN_HANDOVER">Handover KKN</option>
              <option value="GENERATE_QR_BATCH">Generate QR Batch</option>
              <option value="APPROVE_ACTIVATION">Approve Bin</option>
              <option value="REJECT_ACTIVATION">Reject Bin</option>
              <option value="REPORT_BIN_BROKEN">Lapor Bin Rusak</option>
              <option value="UPDATE_BIN_CAPACITY">Update Kapasitas</option>
              <option value="APPROVE_RECYCLE_IDEA">Approve Ide Daur Ulang</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Dari Tanggal</label>
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary shadow-sm"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Sampai Tanggal</label>
            <input
              type="date"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary shadow-sm"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="flex-1 bg-primary text-white font-semibold py-2 px-3 rounded-lg text-sm hover:bg-primary-dark transition shadow-sm"
            >
              Terapkan
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 font-semibold py-2 px-3 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-slate-700 transition shadow-sm"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Logs Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
                <thead className="bg-gray-50 dark:bg-slate-800 text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Timestamp</th>
                    <th className="px-6 py-3">Aksi</th>
                    <th className="px-6 py-3">Referensi</th>
                    <th className="px-6 py-3">Pengguna</th>
                    <th className="px-6 py-3 text-right">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                        Tidak ada log audit ditemukan untuk filter ini
                      </td>
                    </tr>
                  ) : (
                    logs.map((l, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-800 transition cursor-pointer" onClick={() => setSelectedLog(l)}>
                        <td className="px-6 py-4 text-xs font-semibold text-gray-500">
                          {new Date(l.timestamp).toLocaleString("id-ID")}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary uppercase font-mono">
                            {l.action}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs font-semibold text-gray-700">{l.referenceType || "-"}</div>
                          <div className="text-[10px] text-gray-400 font-mono">{l.referenceId || "-"}</div>
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
          )}
        </div>

        {/* View JSON Detail Panel */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-between h-fit space-y-4">
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
                <pre className="p-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-100 dark:border-slate-800 text-[10px] font-mono text-gray-700 dark:text-slate-300 overflow-x-auto whitespace-pre-wrap max-h-48">
                  {JSON.stringify(selectedLog.newValue, null, 2)}
                </pre>
              </div>
              {selectedLog.oldValue && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Nilai Lama (Old Value)</span>
                  <pre className="p-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-100 dark:border-slate-800 text-[10px] font-mono text-gray-700 dark:text-slate-300 overflow-x-auto whitespace-pre-wrap max-h-48">
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
