/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo.
 */

import React, { useEffect, useState, useCallback, useMemo } from "react";
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
  Calendar,
  Sparkles,
  Activity,
  Target,
  BarChart3,
  ListFilter,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/useAuthStore";
import { EmptyTableState } from "../../components/common/EmptyTableState";
import { wsClient } from "../../utils/websocket";
import {
  formatPersonName,
  formatKelompokName,
  formatWilayahName,
  formatProdiName,
  formatStatusName,
  toTitleCase,
} from "../../utils/textFormatter";
import { sortNatural, sortKelompokList, sortStudentsRoster } from "../../utils/sortUtils";

export interface LaporanItem {
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

export interface StudentAggregate {
  studentId: string;
  namaMahasiswa: string;
  nim: string;
  jurusan: string;
  isKetua: boolean;
  fotoProfil: string | null;
  kelompok: {
    id: string;
    name: string;
    kelurahan: string;
    dplName: string;
  } | null;
  totalSessions: number;
  totalMinutes: number;
  totalHours: number;
  totalFormatted: string;
  avgMinutesPerDay: number;
  avgFormatted: string;
  hadirMemenuhi: number;
  hadirKurang: number;
  berlangsung: number;
  terjeda: number;
  izinSakit: number;
}

export interface LaporanSummary {
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

  // Tab View Mode: Rekap Mahasiswa (Total Akumulasi) vs Log Presensi Detail
  const [activeTab, setActiveTab] = useState<"REKAP_MAHASISWA" | "LOG_DETAIL">("REKAP_MAHASISWA");

  // Data states
  const [items, setItems] = useState<LaporanItem[]>([]);
  const [studentAggregates, setStudentAggregates] = useState<StudentAggregate[]>([]);
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
  const [datePreset, setDatePreset] = useState<"ALL" | "TODAY" | "7DAYS" | "30DAYS">("7DAYS");
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

  // Compute period target hours dynamically
  const periodTargetHours = useMemo(() => {
    if (datePreset === "TODAY") return 4;
    if (datePreset === "7DAYS") return 20; // 5 hari kerja x 4 jam
    if (datePreset === "30DAYS") return 80; // 20 hari kerja x 4 jam
    if (datePreset === "ALL" && !startDate && !endDate) return 200; // Total seluruh semester KKN

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1);
      // Asumsi rata-rata 5 hari kerja per 7 hari kalender
      const estimatedWorkDays = Math.max(1, Math.round((diffDays / 7) * 5));
      return estimatedWorkDays * 4;
    }
    return 200;
  }, [datePreset, startDate, endDate]);

  const periodLabel = useMemo(() => {
    if (datePreset === "TODAY") return "Hari Ini";
    if (datePreset === "7DAYS") return "Seminggu Ini (7 Hari)";
    if (datePreset === "30DAYS") return "30 Hari Terakhir";
    if (datePreset === "ALL" && !startDate && !endDate) return "Seluruh Periode KKN";
    if (startDate && endDate) return `${startDate} s.d. ${endDate}`;
    return "Periode Terpilih";
  }, [datePreset, startDate, endDate]);

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

  // Set default initial date range to 7 days on mount
  useEffect(() => {
    const nowWib = new Date(Date.now() + 7 * 60 * 60 * 1000);
    const todayStr = nowWib.toISOString().slice(0, 10);
    const past7 = new Date(nowWib.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    setStartDate(past7);
    setEndDate(todayStr);
  }, []);

  // Fetch groups for filter
  const fetchGroups = useCallback(async () => {
    try {
      const res = await api.get("/kelompok");
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      const sortedList = sortKelompokList(list, (g: any) => g.name || "");
      if (isDpl && user?.id) {
        // Strict scope to DPL's assigned groups
        const dplGroups = sortedList.filter((g: any) => 
          g.dplId === user.id || 
          g.dpl?.id === user.id || 
          g.dpl?.userId === user.id || 
          (user.email && g.dpl?.email === user.email)
        );
        setGroups(dplGroups.length > 0 ? dplGroups : sortedList);
      } else {
        setGroups(sortedList);
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
        setStudentAggregates(data.studentAggregates || []);
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
        type === "STUDENT_ATTENDANCE_UPDATE" ||
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
    setDatePreset("7DAYS");
    const nowWib = new Date(Date.now() + 7 * 60 * 60 * 1000);
    const todayStr = nowWib.toISOString().slice(0, 10);
    const past7 = new Date(nowWib.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    setStartDate(past7);
    setEndDate(todayStr);
    setSearchQuery("");
    setPage(1);
    if (!isDpl && typeof window !== "undefined") {
      try {
        localStorage.setItem("berseka_dev_selected_kelompok", "");
      } catch {}
    }
  };

  // Filtered student aggregates based on search query with natural roster sorting
  const filteredStudentAggregates = useMemo(() => {
    let list = studentAggregates;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.namaMahasiswa.toLowerCase().includes(q) ||
          s.nim.toLowerCase().includes(q) ||
          s.jurusan.toLowerCase().includes(q) ||
          (s.kelompok?.name && s.kelompok.name.toLowerCase().includes(q)) ||
          (s.kelompok?.kelurahan && s.kelompok.kelurahan.toLowerCase().includes(q))
      );
    }
    return sortStudentsRoster(list, {
      getKelompok: (s) => s.kelompok?.name,
      getIsKetua: (s) => s.isKetua,
      getName: (s) => s.namaMahasiswa,
      getNim: (s) => s.nim,
    });
  }, [studentAggregates, searchQuery]);

  // Quick Action: View detailed log for specific student
  const handleViewStudentDetails = (studentName: string) => {
    setSearchQuery(studentName);
    setActiveTab("LOG_DETAIL");
    setPage(1);
    toast.success(`Menampilkan log presensi harian untuk: ${studentName}`);
  };

  const handleExportCSV = () => {
    if (activeTab === "REKAP_MAHASISWA") {
      if (filteredStudentAggregates.length === 0) {
        toast.error("Tidak ada data rekapitulasi untuk diekspor.");
        return;
      }

      const headers = [
        "No",
        "NIM",
        "Nama Mahasiswa",
        "Jabatan",
        "Jurusan",
        "Kelompok",
        "Kelurahan",
        "DPL",
        "Total Sesi Presensi",
        "Total Menit Aktual",
        "Total Jam Aktual",
        `Target Jam (${periodLabel})`,
        "Capaian (%)",
        "Rata-rata Menit / Hari",
        "Rata-rata Jam / Hari",
        "Hadir Memenuhi",
        "Hadir Kurang Jam",
        "Izin / Sakit",
      ];

      const rows = filteredStudentAggregates.map((s, idx) => {
        const percent = Number(((s.totalHours / (periodTargetHours || 1)) * 100).toFixed(1));
        return [
          idx + 1,
          `"${s.nim}"`,
          `"${s.namaMahasiswa}"`,
          `"${s.isKetua ? "Ketua Kelompok" : "Anggota"}"`,
          `"${s.jurusan}"`,
          `"${s.kelompok?.name ?? "-"}"`,
          `"${s.kelompok?.kelurahan ?? "-"}"`,
          `"${s.kelompok?.dplName ?? "-"}"`,
          s.totalSessions,
          s.totalMinutes,
          s.totalHours,
          periodTargetHours,
          `"${percent}%"`,
          s.avgMinutesPerDay,
          `"${s.avgFormatted}"`,
          s.hadirMemenuhi,
          s.hadirKurang,
          s.izinSakit,
        ];
      });

      const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Rekap_Akumulasi_Mahasiswa_KKN_${periodLabel.replace(/[\s\(\)\.]+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Berhasil mengunduh rekapitulasi akumulasi CSV.");
    } else {
      if (items.length === 0) {
        toast.error("Tidak ada data log sesi untuk diekspor.");
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
        "Durasi Aktual di Zona (Menit)",
        "Durasi Formatted",
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
        `"${it.durasiFormatted}"`,
        `"${it.statusDisplay}"`,
        `"${(it.deskripsiKegiatan || "-").replace(/"/g, '""')}"`,
        `"${it.fotoUrl || "-"}"`,
      ]);

      const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Log_Detail_Presensi_KKN_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Berhasil mengunduh log detail presensi CSV.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Header & Page Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/60 rounded-2xl text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
              <FileCheck2 size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  Laporan &amp; Akumulasi Presensi KKN
                </h1>
                {isDeveloper && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 shadow-2xs">
                    Developer Mode
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Pantau akumulasi jam kerja mingguan/total mahasiswa, target pemenuhan jam kerja, dan log presensi harian secara akurat.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons & Live Indicator */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {isDeveloper && (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-xs font-black text-emerald-800 dark:text-emerald-300 shadow-2xs"
              title={wsStatus === "CONNECTED" ? "Terhubung ke Live Stream Telemetri Presensi" : "Mencoba menghubungkan..."}
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
              <span>{wsStatus === "CONNECTED" ? "Live Telemetry Active" : "Connecting..."}</span>
              {lastLiveUpdate && (
                <span className="text-[10px] text-emerald-600 font-mono">
                  ({lastLiveUpdate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })})
                </span>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => fetchLaporan()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 transition shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
            title="Muat Ulang Data"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-emerald-600" : "text-slate-600"} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Ringkasan */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {/* Total Mahasiswa Terdata */}
        <div className="bg-white dark:bg-slate-800/90 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Mahasiswa</span>
            <Users size={15} className="text-blue-500" />
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1.5">
            {studentAggregates.length}
          </p>
          <span className="text-[10px] text-slate-400 font-medium">Dalam Filter Aktif</span>
        </div>

        {/* Total Sesi Presensi */}
        <div className="bg-white dark:bg-slate-800/90 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Sesi Lapangan</span>
            <FileText size={15} className="text-indigo-500" />
          </div>
          <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1.5">
            {summary.totalPresensi}
          </p>
          <span className="text-[10px] text-slate-400 font-medium">Sesi Kehadiran</span>
        </div>

        {/* Total Jam Kumulatif Terverifikasi */}
        <div className="bg-white dark:bg-slate-800/90 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Jam Kumulatif</span>
            <Clock size={15} className="text-purple-500" />
          </div>
          <p className="text-xl font-black text-purple-600 dark:text-purple-400 mt-1.5">
            {summary.totalJamKumulatif} <span className="text-xs font-bold text-slate-500">Jam</span>
          </p>
          <span className="text-[10px] text-slate-400 font-medium">Durasi Terverifikasi</span>
        </div>

        {/* Sesi Memenuhi Target */}
        <div className="bg-white dark:bg-slate-800/90 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Sesi Memenuhi</span>
            <CheckCircle2 size={15} className="text-emerald-500" />
          </div>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1.5">
            {summary.hadirMemenuhi}
          </p>
          <span className="text-[10px] text-slate-400 font-medium">
            {summary.totalPresensi > 0
              ? `${Math.round((summary.hadirMemenuhi / summary.totalPresensi) * 100)}% dari Total`
              : "0%"}
          </span>
        </div>

        {/* Sesi Kurang Jam */}
        <div className="bg-white dark:bg-slate-800/90 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Kurang Jam</span>
            <AlertTriangle size={15} className="text-amber-500" />
          </div>
          <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1.5">
            {summary.hadirKurang}
          </p>
          <span className="text-[10px] text-slate-400 font-medium">Kurang dari Target</span>
        </div>

        {/* Sesi Sedang Lapangan / Terjeda */}
        <div className="bg-white dark:bg-slate-800/90 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Live Lapangan</span>
            <Activity size={15} className="text-emerald-500 animate-pulse" />
          </div>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1.5">
            {summary.berlangsung + summary.terjeda}
          </p>
          <span className="text-[10px] text-slate-400 font-medium">
            {summary.berlangsung} Aktif • {summary.terjeda} Terjeda
          </span>
        </div>
      </div>

      {/* Filter Panel & Preset Bar */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 mb-6 shadow-2xs space-y-3.5">
        {/* Quick Date Presets Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <Calendar size={13} className="text-emerald-600" />
              <span>Periode Cepat:</span>
            </span>

            <button
              type="button"
              onClick={() => handleDatePreset("7DAYS")}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                datePreset === "7DAYS"
                  ? "bg-emerald-600 text-white shadow-2xs font-extrabold"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              <Sparkles size={12} className={datePreset === "7DAYS" ? "text-amber-300" : "text-slate-400"} />
              <span>Seminggu Ini (7 Hari)</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${datePreset === "7DAYS" ? "bg-emerald-700 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"}`}>
                Target 20 Jam
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleDatePreset("TODAY")}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                datePreset === "TODAY"
                  ? "bg-emerald-600 text-white shadow-2xs font-extrabold"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              <span>Hari Ini (Live)</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${datePreset === "TODAY" ? "bg-emerald-700 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"}`}>
                Target 4 Jam
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleDatePreset("30DAYS")}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                datePreset === "30DAYS"
                  ? "bg-emerald-600 text-white shadow-2xs font-extrabold"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              <span>30 Hari Terakhir</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${datePreset === "30DAYS" ? "bg-emerald-700 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"}`}>
                Target 80 Jam
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleDatePreset("ALL")}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                datePreset === "ALL" && !startDate && !endDate
                  ? "bg-emerald-600 text-white shadow-2xs font-extrabold"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              <span>Semua Waktu</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${datePreset === "ALL" && !startDate && !endDate ? "bg-emerald-700 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"}`}>
                Target 200 Jam
              </span>
            </button>
          </div>

          {/* Info Banner Target Periode */}
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-emerald-50/80 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200/80 dark:border-emerald-800/80">
            <Target size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span>Target Kumulatif Periode ({periodLabel}):</span>
            <span className="font-black text-emerald-800 dark:text-emerald-300">{periodTargetHours} Jam</span>
          </div>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
          {/* Search */}
          <div className="lg:col-span-4">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              Pencarian Mahasiswa / NIM
            </label>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari Nama Mahasiswa, NIM, Jurusan..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full h-10 pl-9 pr-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 focus:bg-white focus:border-emerald-500 outline-none transition font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
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
          <div className="lg:col-span-3 flex items-center gap-2">
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
              title="Reset Filter ke Default (7 Hari Terakhir)"
              className="h-10 px-3.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition shrink-0 cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Card with Dual-Tab Switcher */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden mb-6">
        {/* Table Toolbar & View Switcher */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3.5 bg-slate-50/70 dark:bg-slate-800/50">
          {/* Dual Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-200/70 dark:bg-slate-900/80 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab("REKAP_MAHASISWA")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                activeTab === "REKAP_MAHASISWA"
                  ? "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <BarChart3 size={14} />
              <span>Rekapitulasi Akumulasi Mahasiswa</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                activeTab === "REKAP_MAHASISWA" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-slate-300 dark:bg-slate-800 text-slate-600"
              }`}>
                {filteredStudentAggregates.length} Mahasiswa
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("LOG_DETAIL")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                activeTab === "LOG_DETAIL"
                  ? "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <ListFilter size={14} />
              <span>Log Presensi Detail</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                activeTab === "LOG_DETAIL" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-slate-300 dark:bg-slate-800 text-slate-600"
              }`}>
                {totalCount} Sesi
              </span>
            </button>
          </div>

          {/* Export & Print Action Buttons */}
          <div className="flex items-center gap-2 self-end md:self-auto">
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
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-black rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition cursor-pointer active:scale-95"
              title={activeTab === "REKAP_MAHASISWA" ? "Ekspor Rekap Akumulasi Mahasiswa ke CSV" : "Ekspor Log Detail ke CSV"}
            >
              <Download size={14} />
              <span>Ekspor CSV {activeTab === "REKAP_MAHASISWA" ? "Rekapitulasi" : "Log Detail"}</span>
            </button>
          </div>
        </div>

        {/* TAB 1: REKAPITULASI AKUMULASI MAHASISWA */}
        {activeTab === "REKAP_MAHASISWA" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 w-12 text-center text-emerald-700">#</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Mahasiswa &amp; NIM</th>
                  <th className="py-3.5 px-4 min-w-[150px]">Kelompok &amp; DPL</th>
                  <th className="py-3.5 px-4 text-center">Total Hari/Sesi</th>
                  <th className="py-3.5 px-4 text-center min-w-[130px]">Total Akumulasi Aktual</th>
                  <th className="py-3.5 px-4 text-center min-w-[170px]">
                    Target &amp; Capaian ({periodLabel})
                  </th>
                  <th className="py-3.5 px-4 text-center">Rata-rata / Hari</th>
                  <th className="py-3.5 px-4 text-center">Status Akumulasi</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-14 text-center text-slate-400">
                      <RefreshCw size={24} className="animate-spin text-emerald-600 mx-auto mb-2" />
                      <span className="font-semibold">Menghitung dan memuat data akumulasi mahasiswa...</span>
                    </td>
                  </tr>
                ) : filteredStudentAggregates.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12">
                      <EmptyTableState
                        title="Tidak Ada Data Akumulasi Mahasiswa"
                        description="Tidak ditemukan riwayat kehadiran mahasiswa untuk filter yang dipilih."
                      />
                    </td>
                  </tr>
                ) : (
                  filteredStudentAggregates.map((student, idx) => {
                    const percentCapaian = Number(((student.totalHours / (periodTargetHours || 1)) * 100).toFixed(1));
                    const isTargetMet = student.totalHours >= periodTargetHours;
                    const remainingHours = Math.max(0, Math.round((periodTargetHours - student.totalHours) * 10) / 10);

                    return (
                      <tr
                        key={student.studentId}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        {/* No */}
                        <td className="py-3.5 px-4 text-center text-slate-400 font-bold">
                          {idx + 1}
                        </td>

                        {/* Mahasiswa & NIM */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            {student.fotoProfil ? (
                              <img
                                src={student.fotoProfil}
                                alt={student.namaMahasiswa}
                                className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-black flex items-center justify-center text-xs shrink-0 border border-emerald-200 dark:border-emerald-800">
                                {student.namaMahasiswa.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 dark:text-white text-xs">
                                  {student.namaMahasiswa}
                                </span>
                                {student.isKetua && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-100 text-amber-800 dark:bg-amber-955 dark:text-amber-300 border border-amber-300">
                                    Ketua
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 font-mono">
                                NIM: {student.nim} • {student.jurusan}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Kelompok & DPL */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {student.kelompok?.name ?? "Tanpa Kelompok"}
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Kel. {student.kelompok?.kelurahan ?? "-"} • DPL: {student.kelompok?.dplName ?? "-"}
                          </p>
                        </td>

                        {/* Total Hari/Sesi */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="font-black text-slate-800 dark:text-slate-100 text-sm">
                            {student.totalSessions}
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">Hari Hadir</span>
                        </td>

                        {/* Total Akumulasi Aktual */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="font-mono font-black text-emerald-700 dark:text-emerald-400 text-sm">
                            {student.totalFormatted}
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">
                            ({student.totalHours} Jam Total)
                          </span>
                        </td>

                        {/* Target & Capaian Periode */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-800 dark:text-slate-100">
                              <span>{student.totalHours} Jam</span>
                              <span className="text-slate-400">/</span>
                              <span className="text-emerald-700 dark:text-emerald-400">{periodTargetHours} Jam</span>
                            </div>
                            {/* Progress bar */}
                            <div className="w-full max-w-[140px] bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  isTargetMet ? "bg-emerald-600" : percentCapaian >= 70 ? "bg-emerald-500" : "bg-amber-500"
                                }`}
                                style={{ width: `${Math.min(100, percentCapaian)}%` }}
                              />
                            </div>
                            <span className={`text-[10px] font-black ${isTargetMet ? "text-emerald-700 dark:text-emerald-400" : "text-slate-500"}`}>
                              {percentCapaian}% {isTargetMet ? "🌟 Tercapai" : `(Kurang ${remainingHours} Jam)`}
                            </span>
                          </div>
                        </td>

                        {/* Rata-rata / Hari */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            {student.avgFormatted}
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">per sesi hadir</span>
                        </td>

                        {/* Status Akumulasi */}
                        <td className="py-3.5 px-4 text-center">
                          {isTargetMet ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700 shadow-2xs">
                              <CheckCircle2 size={12} className="text-emerald-600" />
                              <span>Target Tercapai</span>
                            </span>
                          ) : percentCapaian >= 70 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700">
                              <TrendingUp size={12} className="text-blue-600" />
                              <span>On Track</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700">
                              <AlertTriangle size={12} className="text-amber-600" />
                              <span>Perlu Peningkatan</span>
                            </span>
                          )}
                        </td>

                        {/* Aksi */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleViewStudentDetails(student.namaMahasiswa)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs active:scale-95"
                            title="Lihat riwayat log kehadiran harian mahasiswa ini"
                          >
                            <span>Lihat Log</span>
                            <ArrowRight size={12} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: LOG PRESENSI DETAIL SESI */}
        {activeTab === "LOG_DETAIL" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 w-12 text-center text-emerald-700">#</th>
                  <th className="py-3.5 px-4 min-w-[190px]">Mahasiswa &amp; NIM</th>
                  <th className="py-3.5 px-4 min-w-[150px]">Kelompok &amp; DPL</th>
                  <th className="py-3.5 px-4">Tanggal &amp; Waktu</th>
                  <th className="py-3.5 px-4 text-center">Durasi Aktual di Zona</th>
                  <th className="py-3.5 px-4 text-center">Status Kehadiran</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Deskripsi Kegiatan</th>
                  <th className="py-3.5 px-4 text-center">Foto Bukti</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <RefreshCw size={24} className="animate-spin text-emerald-600 mx-auto mb-2" />
                      <span>Memuat data log presensi detail...</span>
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12">
                      <EmptyTableState
                        title="Tidak Ada Log Sesi Presensi"
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
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-955/80 dark:text-amber-300 border border-amber-300">
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
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                            )}
                          </p>
                        </td>

                        {/* Durasi Aktual di Zona */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1">
                            <span>{item.durasiFormatted}</span>
                            {isBerlangsung && (
                              <span className="text-[10px] text-emerald-600 font-bold animate-pulse">(Live)</span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {item.durasiMenit} Menit di Zona
                          </span>
                        </td>

                        {/* Status Kehadiran */}
                        <td className="py-3.5 px-4 text-center">
                          {isMemenuhi ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700">
                              <CheckCircle2 size={12} className="text-emerald-600" />
                              <span>{item.statusDisplay}</span>
                            </span>
                          ) : isTerjeda ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                              <PauseCircle size={12} className="text-slate-500" />
                              <span>Terjeda</span>
                            </span>
                          ) : isBerlangsung ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
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
                                  className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline mt-0.5 inline-block cursor-pointer"
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
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 dark:text-emerald-300 rounded-lg text-xs font-bold transition border border-emerald-200 dark:border-emerald-800 cursor-pointer"
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

            {/* Pagination Bar for Log Detail */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="text-slate-500">
                Menampilkan <span className="font-bold text-slate-800 dark:text-slate-200">{items.length}</span> dari{" "}
                <span className="font-bold text-slate-800 dark:text-slate-200">{totalCount}</span> sesi presensi
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loading}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 hover:bg-slate-50 transition cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="px-3 py-1 font-bold text-slate-700 dark:text-slate-300">
                  Halaman {page} dari {totalPages || 1}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || loading}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 hover:bg-slate-50 transition cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
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
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
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
                className="px-4 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition cursor-pointer"
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
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
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
                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition cursor-pointer"
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
