/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo.
 */

import React, { useEffect, useState, useMemo } from "react";
import api from "../../utils/api";
import toast from "react-hot-toast";
import { Pagination } from "../../components/common/Pagination";
import {
  FileText,
  Search,
  RefreshCcw,
  Download,
  Shield,
  Trash2,
  QrCode,
  GraduationCap,
  Settings,
  Copy,
  Eye,
  Activity,
  CheckCircle2,
  Clock,
  UserCheck,
  Layers,
  Sparkles,
} from "lucide-react";
import { getProfilePhotoUrl, handleAvatarError } from "../../utils/photoUtils";

interface AuditTrail {
  id: string;
  action: string;
  userId: string | null;
  user: {
    name: string;
    email: string;
    phone?: string;
    fotoProfil?: string;
    role?: { name: string };
  } | null;
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
  const [categoryTab, setCategoryTab] = useState<string>("SEMUA");
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [startDateFilter, setStartDateFilter] = useState<string>("");
  const [endDateFilter, setEndDateFilter] = useState<string>("");
  const [selectedLog, setSelectedLog] = useState<AuditTrail | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isExporting, setIsExporting] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get("/super-user/audit-trail", {
        params: {
          action: actionFilter || undefined,
          search: searchFilter || undefined,
          startDate: startDateFilter || undefined,
          endDate: endDateFilter || undefined,
        },
      });
      if (res.data.success) {
        setLogs(res.data.data || []);
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error("Gagal memuat log audit aktivitas:", error);
      toast.error("Gagal memuat riwayat log aktivitas dari server");
      setLogs([]);
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
    setCategoryTab("SEMUA");
    setSearchFilter("");
    setStartDateFilter("");
    setEndDateFilter("");
    setCurrentPage(1);
    fetchLogs();
  };

  // Helper formatting for Action Names to KBBI / EYD Indonesian
  const getActionMeta = (action: string) => {
    const act = (action || "").toUpperCase();
    if (act.includes("REACTIVATE_BIN")) {
      return {
        label: "Reaktivasi Tempat Sampah",
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
        category: "TEMPAT_SAMPAH",
      };
    }
    if (act.includes("KKN_HANDOVER")) {
      return {
        label: "Serah Terima Tugas KKN",
        badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
        category: "KKN",
      };
    }
    if (act.includes("GENERATE_QR") || act.includes("QR")) {
      return {
        label: "Pembuatan Kode QR Massal",
        badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
        category: "QR_CODE",
      };
    }
    if (act.includes("APPROVE_ACTIVATION") || act.includes("APPROVE_BIN")) {
      return {
        label: "Persetujuan Tempat Sampah",
        badgeClass: "bg-teal-50 text-teal-700 border-teal-200",
        category: "TEMPAT_SAMPAH",
      };
    }
    if (act.includes("REJECT_ACTIVATION") || act.includes("REJECT_BIN")) {
      return {
        label: "Penolakan Aktivasi Tempat Sampah",
        badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
        category: "TEMPAT_SAMPAH",
      };
    }
    if (act.includes("REPORT_BIN_BROKEN") || act.includes("BROKEN")) {
      return {
        label: "Pelaporan Tempat Sampah Rusak",
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
        category: "TEMPAT_SAMPAH",
      };
    }
    if (act.includes("UPDATE_BIN")) {
      return {
        label: "Pembaruan Data Tempat Sampah",
        badgeClass: "bg-[#009966]/10 text-[#009966] border-[#009966]/30",
        category: "TEMPAT_SAMPAH",
      };
    }
    if (act.includes("CREATE_USER")) {
      return {
        label: "Penambahan Pengguna Baru",
        badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
        category: "MUTASI_USER",
      };
    }
    if (act.includes("UPDATE_USER")) {
      return {
        label: "Pembaruan Profil Pengguna",
        badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
        category: "MUTASI_USER",
      };
    }
    if (act.includes("DELETE_USER")) {
      return {
        label: "Penghapusan Akun Pengguna",
        badgeClass: "bg-rose-100 text-rose-800 border-rose-300",
        category: "MUTASI_USER",
      };
    }
    if (act.includes("SYSTEM") || act.includes("CONFIG") || act.includes("PENALTY")) {
      return {
        label: "Peristiwa Otomatis Sistem",
        badgeClass: "bg-slate-100 text-slate-700 border-slate-300",
        category: "SISTEM",
      };
    }
    return {
      label: action.replace(/_/g, " "),
      badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
      category: "LAINNYA",
    };
  };

  // Filter logs by Category Tab
  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      if (categoryTab === "SEMUA") return true;
      const meta = getActionMeta(l.action);
      return meta.category === categoryTab;
    });
  }, [logs, categoryTab]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = useMemo(() => {
    return filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  // High-level Metrics Stats
  const stats = useMemo(() => {
    const total = logs.length;
    const today = new Date().toISOString().slice(0, 10);
    const todayLogs = logs.filter(
      (l) => new Date(l.timestamp).toISOString().slice(0, 10) === today
    ).length;

    // Find most active user
    const userCountMap = new Map<string, number>();
    logs.forEach((l) => {
      const name = l.user?.name || "Otomatisasi Sistem";
      userCountMap.set(name, (userCountMap.get(name) || 0) + 1);
    });
    let topUser = "-";
    let maxUserCount = 0;
    userCountMap.forEach((count, name) => {
      if (count > maxUserCount) {
        maxUserCount = count;
        topUser = name;
      }
    });

    return {
      total,
      todayLogs,
      topUser,
      maxUserCount,
    };
  }, [logs]);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      toast.error("Tidak ada data log aktivitas untuk diekspor.");
      return;
    }
    try {
      setIsExporting(true);
      const headers = ["Waktu Kejadian", "Kode Aksi", "Nama Pengguna", "Peran", "Referensi ID", "Kategori"];
      const rows = filteredLogs.map((l) => [
        `"${new Date(l.timestamp).toLocaleString("id-ID")}"`,
        `"${l.action}"`,
        `"${l.user?.name || "Sistem Otomatis"}"`,
        `"${l.user?.role?.name || "-"}"`,
        `"${l.referenceId || "-"}"`,
        `"${getActionMeta(l.action).label}"`,
      ]);

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `TrashCare_Log_Aktivitas_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Laporan log aktivitas berhasil diekspor!");
    } catch {
      toast.error("Gagal mengekspor laporan");
    } finally {
      setIsExporting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Data berhasil disalin ke papan klip!");
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto animate-fade-in">
      {/* 1. HEADER BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#009966]/10 text-[#009966] flex items-center justify-center border border-[#009966]/20 shrink-0 font-bold">
            <Activity size={24} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              Log Aktivitas
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Riwayat pencatatan seluruh perubahan data, transaksi, dan konfigurasi sistem secara <strong className="text-slate-600">permanen</strong> dan <strong className="text-slate-600">tidak dapat diubah</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all cursor-pointer font-bold text-xs flex items-center gap-1.5 shadow-2xs"
            title="Muat Ulang Data"
          >
            <RefreshCcw size={15} className={loading ? "animate-spin text-[#009966]" : ""} />
            <span className="hidden sm:inline">Muat Ulang</span>
          </button>
          <button
            onClick={handleExportCSV}
            disabled={isExporting || logs.length === 0}
            className="px-4 py-2.5 rounded-xl bg-[#009966] hover:bg-[#008855] text-white transition-all cursor-pointer font-extrabold text-xs flex items-center gap-2 shadow-2xs"
          >
            <Download size={15} />
            <span>Ekspor Laporan (CSV)</span>
          </button>
        </div>
      </div>

      {/* 2. STATS METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#009966] flex items-center justify-center font-black border border-emerald-200">
            <Layers size={20} />
          </div>
          <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Total Log</p>
            <p className="text-xl font-black text-slate-800">{stats.total} <span className="text-xs text-slate-400 font-bold">Catatan</span></p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-black border border-sky-200">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Aktivitas Hari Ini</p>
            <p className="text-xl font-black text-slate-800">{stats.todayLogs} <span className="text-xs text-slate-400 font-bold">Perubahan</span></p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black border border-amber-200">
            <UserCheck size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Pengguna Teraktif</p>
            <p className="text-sm font-black text-slate-800 truncate">{stats.topUser}</p>
            <p className="text-[10.5px] text-slate-400 font-semibold">{stats.maxUserCount} aktivitas</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black border border-purple-200">
            <Shield size={20} />
          </div>
          <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Integritas Data</p>
            {stats.total > 0 ? (
              <>
                <p className="text-sm font-black text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 size={14} /> Terverifikasi
                </p>
                <p className="text-[10.5px] text-slate-400 font-semibold">{stats.total} catatan tersimpan</p>
              </>
            ) : (
              <>
                <p className="text-sm font-black text-slate-400 flex items-center gap-1">
                  <Shield size={14} /> Belum ada data
                </p>
                <p className="text-[10.5px] text-slate-400 font-semibold">Tidak ada catatan</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 3. CATEGORY TABS & FILTER TOOLBAR */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-100">
          {[
            { id: "SEMUA", label: "Semua Aktivitas", icon: Activity },
            { id: "TEMPAT_SAMPAH", label: "Tempat Sampah", icon: Trash2 },
            { id: "MUTASI_USER", label: "Pengelolaan Pengguna", icon: UserCheck },
            { id: "QR_CODE", label: "Kode QR", icon: QrCode },
            { id: "KKN", label: "Program KKN", icon: GraduationCap },
            { id: "SISTEM", label: "Otomatisasi Sistem", icon: Settings },
          ].map((tab) => {
            const TabIcon = tab.icon;
            const active = categoryTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setCategoryTab(tab.id);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                  active
                    ? "bg-[#009966] text-white shadow-2xs"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60"
                }`}
              >
                <TabIcon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Filter Toolbar Form */}
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-4 relative">
            <label className="block text-[10.5px] font-black text-slate-400 uppercase tracking-wider mb-1">
              Pencarian Kata Kunci
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Cari nama pengguna, email, atau aksi..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#009966] bg-slate-50/50"
              />
            </div>
          </div>

          {/* Action Type Dropdown */}
          <div className="lg:col-span-3">
            <label className="block text-[10.5px] font-black text-slate-400 uppercase tracking-wider mb-1">
              Jenis Aktivitas
            </label>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#009966] bg-white cursor-pointer shadow-2xs"
            >
              <option value="">Semua Jenis Aktivitas</option>
              <option value="REACTIVATE_BIN">Reaktivasi Tempat Sampah</option>
              <option value="KKN_HANDOVER">Serah Terima KKN</option>
              <option value="GENERATE_QR_BATCH">Pembuatan Kode QR Massal</option>
              <option value="APPROVE_ACTIVATION">Persetujuan Tempat Sampah</option>
              <option value="REJECT_ACTIVATION">Penolakan Aktivasi Tempat Sampah</option>
              <option value="REPORT_BIN_BROKEN">Pelaporan Tempat Sampah Rusak</option>
              <option value="UPDATE_BIN_CAPACITY">Pembaruan Kapasitas Tempat Sampah</option>
              <option value="APPROVE_RECYCLE_IDEA">Persetujuan Ide Daur Ulang</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="lg:col-span-2">
            <label className="block text-[10.5px] font-black text-slate-400 uppercase tracking-wider mb-1">
              Dari Tanggal
            </label>
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => {
                setStartDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#009966] bg-white cursor-pointer"
            />
          </div>

          {/* End Date */}
          <div className="lg:col-span-2">
            <label className="block text-[10.5px] font-black text-slate-400 uppercase tracking-wider mb-1">
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={endDateFilter}
              onChange={(e) => {
                setEndDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#009966] bg-white cursor-pointer"
            />
          </div>

          {/* Submit / Reset */}
          <div className="lg:col-span-1 flex items-end gap-1.5">
            <button
              type="button"
              onClick={handleResetFilters}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold rounded-xl text-xs transition-all cursor-pointer"
              title="Reset Filter"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* 4. MAIN DATA TABLE & PAYLOAD INSPECTOR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Table Container */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3 font-bold text-xs">
              <RefreshCcw className="animate-spin text-[#009966]" size={32} />
              <p>Memuat riwayat log aktivitas...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-xs text-left">
                  <thead className="bg-slate-50/80 text-[10.5px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-4">Waktu Kejadian</th>
                      <th className="py-3.5 px-4">Pelaku Aktivitas</th>
                      <th className="py-3.5 px-4">Jenis Aktivitas</th>
                      <th className="py-3.5 px-4">Referensi Target</th>
                      <th className="py-3.5 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {paginatedLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-16 text-center text-slate-400 font-bold">
                          Tidak ada catatan log aktivitas yang ditemukan sesuai kriteria penyaringan.
                        </td>
                      </tr>
                    ) : (
                      paginatedLogs.map((l) => {
                        const meta = getActionMeta(l.action);
                        const isSelected = selectedLog?.id === l.id;
                        const userName = l.user?.name || "Sistem Otomatis";
                        const userRole = l.user?.role?.name || "SYSTEM";
                        const formattedTime = new Date(l.timestamp).toLocaleString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        });

                        return (
                          <tr
                            key={l.id}
                            onClick={() => setSelectedLog(l)}
                            className={`transition-colors cursor-pointer ${
                              isSelected ? "bg-emerald-50/60 font-semibold" : "hover:bg-slate-50/80"
                            }`}
                          >
                            {/* Waktu Kejadian */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className="font-bold text-slate-800 block text-[11px]">
                                {formattedTime} WIB
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                ID: {l.id.slice(0, 8)}...
                              </span>
                            </td>

                            {/* Pelaku Aktivitas (User Avatar + Name + Role) */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-[#009966] text-white font-bold text-[10px] flex items-center justify-center shrink-0 overflow-hidden border border-white shadow-2xs">
                                  {l.user?.fotoProfil ? (
                                    <img
                                      src={getProfilePhotoUrl(l.user.fotoProfil, userName)}
                                      alt=""
                                      className="w-full h-full object-cover"
                                      onError={(e) => handleAvatarError(e, userName)}
                                    />
                                  ) : (
                                    <span>{userName ? userName.trim()[0].toUpperCase() : "S"}</span>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-800 text-xs truncate max-w-[130px]">
                                    {userName}
                                  </p>
                                  <span className="inline-block text-[9px] font-extrabold px-2 py-0.2 rounded-full uppercase bg-slate-100 text-slate-500 border border-slate-200">
                                    {userRole}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Jenis Aktivitas Badge (KBBI/EYD Label) */}
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-block px-2.5 py-1 rounded-full text-[10.5px] font-black uppercase border ${meta.badgeClass}`}
                              >
                                {meta.label}
                              </span>
                            </td>

                            {/* Referensi Target */}
                            <td className="py-3.5 px-4">
                              <span className="font-bold text-slate-700 block text-[11px]">
                                {l.referenceType || "Database"}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {l.referenceId || "-"}
                              </span>
                            </td>

                            {/* Detail Inspector Button */}
                            <td className="py-3.5 px-4 text-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedLog(l);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#009966] hover:text-white text-slate-600 transition-all font-extrabold text-[11px] cursor-pointer inline-flex items-center gap-1"
                              >
                                <Eye size={12} />
                                <span>Detail</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredLogs.length > 0 && (
                <div className="p-4 border-t border-slate-100">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredLogs.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={setItemsPerPage}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Payload Inspector Side Panel */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4 h-fit sticky top-6">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <FileText className="text-[#009966]" size={18} />
                <h3 className="font-black text-slate-800 text-sm">Detail Perubahan Data</h3>
              </div>
              {selectedLog && (
                <button
                  onClick={() => copyToClipboard(JSON.stringify(selectedLog.newValue || selectedLog, null, 2))}
                  className="text-xs font-extrabold text-[#009966] hover:underline flex items-center gap-1 cursor-pointer"
                  title="Salin JSON Payload"
                >
                  <Copy size={13} />
                  <span>Salin JSON</span>
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Perbandingan kondisi data sebelum dan sesudah perubahan dilakukan.
            </p>
          </div>

          {selectedLog ? (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                <div className="flex justify-between items-center text-[10.5px] font-black text-slate-400 uppercase tracking-wider">
                  <span>Jenis Aktivitas</span>
                  <span className="text-[#009966] font-mono">{selectedLog.action}</span>
                </div>
                <p className="text-xs font-black text-slate-800">
                  {getActionMeta(selectedLog.action).label}
                </p>
              </div>

              {/* Nilai Baru / New Value */}
              <div className="space-y-1.5">
                <span className="text-[10.5px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 size={13} className="text-emerald-500" /> Kondisi Sesudah
                </span>
                <pre className="p-3.5 bg-slate-900 text-emerald-400 rounded-2xl border border-slate-800 text-[10.5px] font-mono overflow-x-auto whitespace-pre-wrap max-h-56 scrollbar-thin shadow-inner leading-relaxed">
                  {JSON.stringify(selectedLog.newValue || {}, null, 2)}
                </pre>
              </div>

              {/* Nilai Lama / Old Value (If present) */}
              {selectedLog.oldValue && (
                <div className="space-y-1.5">
                  <span className="text-[10.5px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Clock size={13} className="text-amber-500" /> Kondisi Sebelum
                  </span>
                  <pre className="p-3.5 bg-slate-900 text-amber-300 rounded-2xl border border-slate-800 text-[10.5px] font-mono overflow-x-auto whitespace-pre-wrap max-h-48 scrollbar-thin shadow-inner leading-relaxed">
                    {JSON.stringify(selectedLog.oldValue, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-xs text-slate-400 font-semibold py-16 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 space-y-2">
              <Sparkles className="mx-auto text-slate-300" size={28} />
              <p>Pilih salah satu baris log pada tabel untuk melihat detail perubahan data.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
