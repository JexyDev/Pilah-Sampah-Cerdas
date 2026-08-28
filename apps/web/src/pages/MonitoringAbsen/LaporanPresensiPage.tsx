/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo.
 */

import React, { useEffect, useState, useCallback } from "react";
import {
  FileText,
  Search,
  Download,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Clock,
  PauseCircle,
  Users,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Image as ImageIcon,
  ExternalLink,
  X,
  FileCheck2,
  Zap,
  Calendar,
  Sparkles,
  Radio,
  Activity,
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/useAuthStore";
import { EmptyTableState } from "../../components/common/EmptyTableState";
import { wsClient } from "../../utils/websocket";

interface LaporanItem {
  id: string;
  studentId: string;
  namaMahasiswa: string;
  nim: string;
  jurusan: string;
  fotoProfil: string | null;
  isKetua: boolean;
  kelompok: {
    id: string;
    name: string;
    kelurahan: string;
    dplName: string;
  } | null;
  scheduleId: string;
  namaKegiatan: string;
  tanggal: string;
  jamMasuk: string;
  jamPulang: string;
  durasiMenit: number;
  durasiFormatted: string;
  status: string;
  statusDisplay: string;
  isMemenuhiDurasi: boolean;
  deskripsiKegiatan: string | null;
  fotoUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  method: string;
}

interface LaporanSummary {
  totalPresensi: number;
  hadirMemenuhi: number;
  hadirKurang: number;
  berlangsung: number;
  terjeda: number;
  izinSakit: number;
  totalJamKumulatif: number;
  totalMenitKumulatif: number;
}

export const LaporanPresensiPage: React.FC = () => {
  const { user } = useAuthStore();
  const rawRole = user?.role;
  const roleName = String(typeof rawRole === "object" ? (rawRole as any)?.name : rawRole || "").toUpperCase();
  const isDpl = roleName === "DPL" || roleName === "DOSEN_PEMBIMBING";
  const isDeveloper = roleName === "DEVELOPER" || roleName === "SUPER_USER";

  // Data states
  const [items, setItems] = useState<LaporanItem[]>([]);
  const [summary, setSummary] = useState<LaporanSummary>({
    totalPresensi: 0,
    hadirMemenuhi: 0,
    hadirKurang: 0,
    berlangsung: 0,
    terjeda: 0,
    izinSakit: 0,
    totalJamKumulatif: 0,
    totalMenitKumulatif: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [groups, setGroups] = useState<any[]>([]);

  // Filter states
  const [selectedKelompok, setSelectedKelompok] = useState<string>(() => {
    if (typeof window !== "undefined" && !isDpl) {
      try {
        const saved = localStorage.getItem("berseka_dev_selected_kelompok");
        if (saved) return saved;
      } catch {}
    }
    return "ALL";
  });
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [datePreset, setDatePreset] = useState<"ALL" | "TODAY" | "7DAYS" | "30DAYS">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(20);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Real-time WebSocket Telemetry states
  const [wsStatus, setWsStatus] = useState<"CONNECTED" | "CONNECTING" | "DISCONNECTED">("DISCONNECTED");
  const [lastLiveUpdate, setLastLiveUpdate] = useState<Date | null>(null);

  // Modals
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; title: string; desc?: string | null } | null>(null);
  const [previewDesc, setPreviewDesc] = useState<{ student: string; desc: string; time: string } | null>(null);

  // Quick select kelompok with localStorage persistence for developer
  const handleSelectKelompok = (id: string) => {
    setSelectedKelompok(id);
    setPage(1);
    if (!isDpl && typeof window !== "undefined") {
      try {
        localStorage.setItem("berseka_dev_selected_kelompok", id === "ALL" ? "" : id);
      } catch {}
    }
  };

  // Quick date preset handler
  const handleDatePreset = (preset: "ALL" | "TODAY" | "7DAYS" | "30DAYS") => {
    setDatePreset(preset);
    setPage(1);
    const nowWib = new Date(Date.now() + 7 * 60 * 60 * 1000);
    const todayStr = nowWib.toISOString().slice(0, 10);

    if (preset === "ALL") {
      setStartDate("");
      setEndDate("");
    } else if (preset === "TODAY") {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "7DAYS") {
      const past7 = new Date(nowWib.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      setStartDate(past7);
      setEndDate(todayStr);
    } else if (preset === "30DAYS") {
      const past30 = new Date(nowWib.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      setStartDate(past30);
      setEndDate(todayStr);
    }
  };

  // Fetch groups for filter
  const fetchGroups = useCallback(async () => {
    try {
      const res = await api.get("/kelompok");
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      if (isDpl && user?.id) {
        // Strict scope to DPL's assigned groups
        const dplGroups = list.filter((g: any) => 
          g.dplId === user.id || 
          g.dpl?.id === user.id || 
          g.dpl?.userId === user.id || 
          (user.email && g.dpl?.email === user.email)
        );
        setGroups(dplGroups.length > 0 ? dplGroups : list);
      } else {
        setGroups(list);
      }
    } catch (_err) {
      // silent fallback
    }
  }, [isDpl, user]);

  // Fetch report data
  const fetchLaporan = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params: any = {
        page,
        limit,
      };

      if (selectedKelompok && selectedKelompok !== "ALL") {
        params.kelompokId = selectedKelompok;
      }
      if (selectedStatus && selectedStatus !== "ALL") {
        params.status = selectedStatus;
      }
      if (startDate) {
        params.startDate = startDate;
      }
      if (endDate) {
        params.endDate = endDate;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const res = await api.get("/laporan-rekap", { params });
      if (res.data?.success && res.data?.data) {
        const data = res.data.data;
        setItems(data.items || []);
        if (data.summary) {
          setSummary(data.summary);
        }
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
          setTotalCount(data.pagination.total || 0);
        }
      }
    } catch (error: any) {
      console.error("Gagal mengambil laporan presensi:", error);
      if (!silent) {
        toast.error(error.response?.data?.message || "Gagal memuat data laporan presensi.");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [page, limit, selectedKelompok, selectedStatus, startDate, endDate, searchQuery]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    fetchLaporan();
  }, [fetchLaporan]);

  // WebSocket Live Telemetry & Real-Time Auto Refresh for Developer
  useEffect(() => {
    if (!isDeveloper) return;

    const unsubStatus = wsClient.onStatusChange((status) => {
      setWsStatus(status);
    });

    let debounceTimer: any = null;
    const unsubMsg = wsClient.onMessage((msg) => {
      const type = msg.type;
      if (
        type === "STUDENT_ATTENDANCE" ||
        type === "STUDENT_CHECKOUT" ||
        type === "STUDENT_PAUSE" ||
        type === "STUDENT_RESUME" ||
        type === "STUDENT_LOGOUT"
      ) {
        setLastLiveUpdate(new Date());
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          fetchLaporan(true);
        }, 1000);
      }
    });

    return () => {
      unsubStatus();
      unsubMsg();
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [isDeveloper, fetchLaporan]);

  // Periodic background refresh every 30s when there are active sessions
  useEffect(() => {
    if (!isDeveloper) return;
    const interval = setInterval(() => {
      if (summary.berlangsung > 0 || summary.terjeda > 0) {
        fetchLaporan(true);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [isDeveloper, summary.berlangsung, summary.terjeda, fetchLaporan]);

  const handleResetFilter = () => {
    setSelectedKelompok("ALL");
    setSelectedStatus("ALL");
    setStartDate("");
    setEndDate("");
    setDatePreset("ALL");
    setSearchQuery("");
    setPage(1);
    if (!isDpl && typeof window !== "undefined") {
      try {
        localStorage.setItem("berseka_dev_selected_kelompok", "");
      } catch {}
    }
  };

  const handleExportCSV = () => {
    if (items.length === 0) {
      toast.error("Tidak ada data untuk diekspor.");
      return;
    }

    const headers = [
      "No",
      "NIM",
      "Nama Mahasiswa",
      "Jurusan",
      "Kelompok",
      "Kelurahan",
      "DPL",
      "Tanggal",
      "Jam Masuk",
      "Jam Pulang",
      "Durasi (Menit)",
      "Status",
      "Deskripsi Kegiatan",
      "Foto Dokumentasi URL",
    ];

    const rows = items.map((it, idx) => [
      (page - 1) * limit + idx + 1,
      `"${it.nim}"`,
      `"${it.namaMahasiswa}"`,
      `"${it.jurusan}"`,
      `"${it.kelompok?.name ?? "-"}"`,
      `"${it.kelompok?.kelurahan ?? "-"}"`,
      `"${it.kelompok?.dplName ?? "-"}"`,
      `"${it.tanggal}"`,
      `"${it.jamMasuk}"`,
      `"${it.jamPulang}"`,
      it.durasiMenit,
      `"${it.statusDisplay}"`,
      `"${(it.deskripsiKegiatan || "-").replace(/"/g, '""')}"`,
      `"${it.fotoUrl || "-"}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Presensi_KKN_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Berhasil mengunduh laporan CSV.");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950/60 rounded-xl text-emerald-600 dark:text-emerald-400">
              <FileCheck2 size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Laporan & Rekapitulasi Presensi KKN
                </h1>
                {isDeveloper && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 shadow-2xs">
                    Developer Mode
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Rekap kehadiran lapangan, durasi aktual terverifikasi, foto bukti, dan deskripsi kegiatan mahasiswa.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons & Live WebSocket Indicator */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {isDeveloper && (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-xs font-black text-emerald-800 dark:text-emerald-300 shadow-2xs"
              title={wsStatus === "CONNECTED" ? "Terhubung ke Live Stream WebSocket" : "Mencoba menghubungkan..."}
            >
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    wsStatus === "CONNECTED" ? "bg-emerald-400" : "bg-amber-400"
                  }`}
                ></span>
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    wsStatus === "CONNECTED" ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                ></span>
              </span>
              <span>{wsStatus === "CONNECTED" ? "Live Sync Aktif" : "Menghubungkan..."}</span>
              {lastLiveUpdate && (
                <span className="text-[10px] text-slate-400 font-normal">
                  ({lastLiveUpdate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })})
                </span>
              )}
            </div>
          )}

          <button
            onClick={() => fetchLaporan()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-emerald-600" : ""} />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* Developer Quick Posko Switcher Bar */}
      {isDeveloper && (
        <div className="mb-6 p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Zap size={15} className="text-amber-500 fill-amber-500" />
              <span className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                Developer Quick Switcher Posko
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {groups.length} Posko Terdaftar
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              1-Klik untuk menyaring laporan langsung per posko KKN
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            <button
              type="button"
              onClick={() => handleSelectKelompok("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 cursor-pointer shadow-2xs ${
                selectedKelompok === "ALL"
                  ? "bg-emerald-600 text-white shadow-emerald-500/20 shadow-md ring-2 ring-emerald-500/30"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700"
              }`}
            >
              🌟 Semua Wilayah ({groups.length} Kelompok)
            </button>
            {groups.map((g) => {
              const isSel = selectedKelompok === g.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => handleSelectKelompok(g.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs ${
                    isSel
                      ? "bg-emerald-600 text-white shadow-emerald-500/20 shadow-md ring-2 ring-emerald-500/30"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700"
                  }`}
                >
                  {g.name}
                  {g.kelurahan && (
                    <span className={`ml-1 text-[10px] ${isSel ? "text-emerald-100" : "text-slate-400"}`}>
                      ({g.kelurahan})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* DPL Mode Active Banner */}
      {isDpl && (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 border border-emerald-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Users size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Mode Dosen Pembimbing Lapangan (DPL)</span>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  Strict Scoped
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Menampilkan data mahasiswa bimbingan KKN Anda secara terisolasi. Data kelompok lain tidak akan tampil.
              </p>
            </div>
          </div>
          <div className="hidden sm:flex text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
            {groups.length} Kelompok Binaan
          </div>
        </div>
      )}

      {/* Summary KPI Cards with 1-Click Interactive Filter */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {/* Total Catatan */}
        <div
          onClick={() => {
            setSelectedStatus("ALL");
            setPage(1);
          }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-sm ${
            selectedStatus === "ALL"
              ? "bg-blue-50/70 dark:bg-blue-950/40 border-blue-400 ring-2 ring-blue-500/40 shadow-md"
              : "bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-800 hover:border-blue-300"
          }`}
          title="Klik untuk melihat semua presensi"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Catatan</span>
            <Users size={15} className="text-blue-500" />
          </div>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1.5">{summary.totalPresensi}</p>
          <span className="text-[11px] text-slate-400">Sesi Presensi</span>
        </div>

        {/* Hadir Memenuhi */}
        <div
          onClick={() => {
            setSelectedStatus("HADIR_MEMENUHI");
            setPage(1);
          }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-sm ${
            selectedStatus === "HADIR_MEMENUHI"
              ? "bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-400 ring-2 ring-emerald-500/40 shadow-md"
              : "bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-800 hover:border-emerald-300"
          }`}
          title="Klik untuk memfilter: Hadir Memenuhi Jam"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Hadir Memenuhi</span>
            <CheckCircle2 size={15} className="text-emerald-500" />
          </div>
          <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1.5">
            {summary.hadirMemenuhi}
          </p>
          <span className="text-[11px] text-slate-400">Target Tercapai</span>
        </div>

        {/* Kurang Jam */}
        <div
          onClick={() => {
            setSelectedStatus("HADIR_TIDAK_MEMENUHI");
            setPage(1);
          }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-sm ${
            selectedStatus === "HADIR_TIDAK_MEMENUHI"
              ? "bg-amber-50/70 dark:bg-amber-950/40 border-amber-400 ring-2 ring-amber-500/40 shadow-md"
              : "bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-800 hover:border-amber-300"
          }`}
          title="Klik untuk memfilter: Hadir Kurang Jam"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Kurang Jam</span>
            <AlertTriangle size={15} className="text-amber-500" />
          </div>
          <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-1.5">{summary.hadirKurang}</p>
          <span className="text-[11px] text-slate-400">&lt; Minimal Jam</span>
        </div>

        {/* Sedang Lapangan */}
        <div
          onClick={() => {
            setSelectedStatus("BERLANGSUNG");
            setPage(1);
          }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-sm ${
            selectedStatus === "BERLANGSUNG"
              ? "bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-400 ring-2 ring-indigo-500/40 shadow-md"
              : "bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-800 hover:border-indigo-300"
          }`}
          title="Klik untuk memfilter: Mahasiswa Sedang Aktif di Lapangan"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span className="flex items-center gap-1">
              <span>Sedang Lapangan</span>
              {summary.berlangsung > 0 && (
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
              )}
            </span>
            <Clock size={15} className="text-indigo-500" />
          </div>
          <p className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1.5">{summary.berlangsung}</p>
          <span className="text-[11px] text-slate-400">Aktif Berlangsung</span>
        </div>

        {/* Terjeda */}
        <div
          onClick={() => {
            setSelectedStatus("TERJEDA");
            setPage(1);
          }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-sm ${
            selectedStatus === "TERJEDA"
              ? "bg-slate-100 dark:bg-slate-700/60 border-slate-400 ring-2 ring-slate-400/40 shadow-md"
              : "bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-800 hover:border-slate-400"
          }`}
          title="Klik untuk memfilter: Mahasiswa yang Sedang Diistirahatkan"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Terjeda</span>
            <PauseCircle size={15} className="text-slate-500" />
          </div>
          <p className="text-xl font-extrabold text-slate-700 dark:text-slate-300 mt-1.5">{summary.terjeda}</p>
          <span className="text-[11px] text-slate-400">Diistirahatkan</span>
        </div>

        {/* Total Jam Kumulatif */}
        <div className="bg-white dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Jam Kumulatif</span>
            <Clock size={15} className="text-purple-500" />
          </div>
          <p className="text-xl font-extrabold text-purple-600 dark:text-purple-400 mt-1.5">
            {summary.totalJamKumulatif} <span className="text-xs font-normal">Jam</span>
          </p>
          <span className="text-[11px] text-slate-400">Durasi Terverifikasi</span>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 mb-6 shadow-sm space-y-3">
        {/* Quick Date Presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Periode Cepat:
          </span>
          <button
            type="button"
            onClick={() => handleDatePreset("ALL")}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
              datePreset === "ALL" && !startDate && !endDate
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 font-extrabold"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            Semua Waktu
          </button>
          <button
            type="button"
            onClick={() => handleDatePreset("TODAY")}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
              datePreset === "TODAY"
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 font-extrabold"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Calendar size={12} className="text-emerald-600" />
            <span>Hari Ini (Live)</span>
          </button>
          <button
            type="button"
            onClick={() => handleDatePreset("7DAYS")}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
              datePreset === "7DAYS"
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 font-extrabold"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            7 Hari Terakhir
          </button>
          <button
            type="button"
            onClick={() => handleDatePreset("30DAYS")}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
              datePreset === "30DAYS"
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 font-extrabold"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            30 Hari Terakhir
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end pt-1 border-t border-slate-100 dark:border-slate-800">
          {/* Search */}
          <div className="lg:col-span-3">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              Pencarian Mahasiswa
            </label>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari Nama / NIM..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full h-10 pl-9 pr-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 focus:bg-white focus:border-emerald-500 outline-none transition"
              />
            </div>
          </div>

          {/* Kelompok */}
          <div className="lg:col-span-3">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              Kelompok KKN {isDpl && <span className="text-emerald-600 font-semibold">(Binaan Anda)</span>}
            </label>
            <select
              value={selectedKelompok}
              onChange={(e) => handleSelectKelompok(e.target.value)}
              className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 focus:bg-white focus:border-emerald-500 outline-none transition font-medium"
            >
              <option value="ALL">🌟 Semua Kelompok ({groups.length} Posko)</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} - Kel. {g.kelurahan ?? "-"}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              Status Presensi
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 focus:bg-white focus:border-emerald-500 outline-none transition font-medium"
            >
              <option value="ALL">Semua Status</option>
              <option value="HADIR_MEMENUHI">Hadir & Memenuhi</option>
              <option value="HADIR_TIDAK_MEMENUHI">Hadir & Kurang Jam</option>
              <option value="BERLANGSUNG">🟢 Sedang Lapangan (Live)</option>
              <option value="TERJEDA">⏸️ Terjeda (Istirahat)</option>
              <option value="IZIN_SAKIT">Izin / Sakit</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              Dari Tanggal
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDatePreset("ALL");
                setPage(1);
              }}
              className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 focus:bg-white focus:border-emerald-500 outline-none transition font-medium"
            />
          </div>

          {/* End Date & Reset */}
          <div className="lg:col-span-2 flex items-center gap-2">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                Sampai Tanggal
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset("ALL");
                  setPage(1);
                }}
                className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 focus:bg-white focus:border-emerald-500 outline-none transition font-medium"
              />
            </div>
            <button
              onClick={handleResetFilter}
              title="Reset Filter"
              className="h-10 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition shrink-0"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden mb-6">
        {/* Table Toolbar & Export Actions */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Daftar Presensi Terfilter
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/40">
              {totalCount} Data
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-2xs cursor-pointer"
            >
              <Printer size={14} />
              <span>Cetak</span>
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer"
              title={`Ekspor ${totalCount} data presensi terfilter ke format CSV`}
            >
              <Download size={14} />
              <span>Ekspor CSV</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Mahasiswa & NIM</th>
                <th className="py-3 px-4">Kelompok & DPL</th>
                <th className="py-3 px-4">Tanggal & Waktu</th>
                <th className="py-3 px-4">Durasi Lapangan</th>
                <th className="py-3 px-4">Status Kehadiran</th>
                <th className="py-3 px-4 min-w-[200px]">Deskripsi Kegiatan</th>
                <th className="py-3 px-4 text-center">Foto Bukti</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw size={24} className="animate-spin text-emerald-600 mx-auto mb-2" />
                    <span>Memuat data laporan presensi...</span>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12">
                    <EmptyTableState
                      title="Tidak Ada Data Presensi"
                      description="Tidak ditemukan riwayat kehadiran dengan filter yang dipilih."
                    />
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => {
                  const isMemenuhi = item.isMemenuhiDurasi;
                  const isTerjeda = item.status === "TERJEDA";
                  const isBerlangsung = item.status === "BERLANGSUNG";
                  const isIzinSakit = item.status.includes("IZIN") || item.status.includes("SAKIT");

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* No */}
                      <td className="py-3.5 px-4 text-center text-slate-400 font-semibold">
                        {(page - 1) * limit + idx + 1}
                      </td>

                      {/* Mahasiswa & NIM */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          {item.fotoProfil ? (
                            <img
                              src={item.fotoProfil}
                              alt={item.namaMahasiswa}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center text-xs shrink-0">
                              {item.namaMahasiswa.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {item.namaMahasiswa}
                              </span>
                              {item.isKetua && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300">
                                  Ketua
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 font-mono">
                              NIM: {item.nim} • {item.jurusan}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Kelompok & DPL */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {item.kelompok?.name ?? "Tanpa Kelompok"}
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Kel. {item.kelompok?.kelurahan ?? "-"} • DPL: {item.kelompok?.dplName ?? "-"}
                        </p>
                      </td>

                      {/* Tanggal & Waktu */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {item.tanggal}
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                          <span>{item.jamMasuk} – {item.jamPulang === "-" ? "Sekarang" : item.jamPulang} WIB</span>
                          {isBerlangsung && (
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></span>
                          )}
                        </p>
                      </td>

                      {/* Durasi Lapangan */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                          <span>{item.durasiFormatted}</span>
                          {isBerlangsung && (
                            <span className="text-[10px] text-indigo-500 font-bold animate-pulse">(Live)</span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {item.durasiMenit} Menit di Zona Posko
                        </span>
                      </td>

                      {/* Status Kehadiran */}
                      <td className="py-3.5 px-4">
                        {isMemenuhi ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700">
                            <CheckCircle2 size={12} className="text-emerald-600" />
                            <span>{item.statusDisplay}</span>
                          </span>
                        ) : isTerjeda ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                            <PauseCircle size={12} className="text-slate-500" />
                            <span>Terjeda (Istirahat)</span>
                          </span>
                        ) : isBerlangsung ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-indigo-50 text-indigo-700 border border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-700 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                            <span>Sedang Lapangan</span>
                          </span>
                        ) : isIzinSakit ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700">
                            <FileText size={12} className="text-blue-600" />
                            <span>{item.statusDisplay}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700">
                            <AlertTriangle size={12} className="text-amber-600" />
                            <span>{item.statusDisplay}</span>
                          </span>
                        )}
                      </td>

                      {/* Deskripsi Kegiatan */}
                      <td className="py-3.5 px-4">
                        {item.deskripsiKegiatan ? (
                          <div className="max-w-xs">
                            <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2">
                              {item.deskripsiKegiatan}
                            </p>
                            {item.deskripsiKegiatan.length > 80 && (
                              <button
                                onClick={() =>
                                  setPreviewDesc({
                                    student: item.namaMahasiswa,
                                    desc: item.deskripsiKegiatan!,
                                    time: `${item.tanggal} (${item.jamMasuk} - ${item.jamPulang})`,
                                  })
                                }
                                className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline mt-0.5 inline-block"
                              >
                                Baca Selengkapnya...
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">- Belum ada deskripsi -</span>
                        )}
                      </td>

                      {/* Foto Bukti */}
                      <td className="py-3.5 px-4 text-center">
                        {item.fotoUrl ? (
                          <button
                            onClick={() =>
                              setPreviewPhoto({
                                url: item.fotoUrl!,
                                title: `Dokumentasi: ${item.namaMahasiswa} (${item.tanggal})`,
                                desc: item.deskripsiKegiatan,
                              })
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 dark:text-emerald-300 rounded-lg text-xs font-bold transition border border-emerald-200 dark:border-emerald-800"
                          >
                            <ImageIcon size={13} />
                            <span>Lihat Foto</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs italic">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-500">
            Menampilkan <span className="font-bold text-slate-800 dark:text-slate-200">{items.length}</span> dari{" "}
            <span className="font-bold text-slate-800 dark:text-slate-200">{totalCount}</span> data laporan
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 hover:bg-slate-50 transition"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-3 py-1 font-bold text-slate-700 dark:text-slate-300">
              Halaman {page} dari {totalPages || 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 hover:bg-slate-50 transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Preview Foto */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                {previewPhoto.title}
              </h3>
              <button
                onClick={() => setPreviewPhoto(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 flex flex-col items-center bg-slate-950">
              <img
                src={previewPhoto.url}
                alt="Dokumentasi"
                className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-md"
              />
              {previewPhoto.desc && (
                <div className="mt-3 p-3 bg-slate-900 text-slate-200 text-xs rounded-xl w-full border border-slate-800">
                  <span className="font-bold text-emerald-400 block mb-1">Deskripsi Kegiatan:</span>
                  <p>{previewPhoto.desc}</p>
                </div>
              )}
            </div>
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-900/80">
              <a
                href={previewPhoto.url}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition"
              >
                <ExternalLink size={13} />
                <span>Buka Gambar Asli</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail Deskripsi */}
      {previewDesc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Laporan Kegiatan: {previewDesc.student}
                </h3>
                <span className="text-[11px] text-slate-400">{previewDesc.time}</span>
              </div>
              <button
                onClick={() => setPreviewDesc(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>
            <div className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 whitespace-pre-wrap max-h-60 overflow-y-auto">
              {previewDesc.desc}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setPreviewDesc(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LaporanPresensiPage;
