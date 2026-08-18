/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Component: Monitoring Real-Time Penyetoran Sampah
 * Clean, Simple, Enterprise-Grade Design with Live WebSocket Stream
 */

import { useState, useEffect, useMemo } from "react";
import { Pagination } from "../../components/common/Pagination";
import api from "../../services/api";
import showToast from "../../utils/showToast";
import { useAuthStore } from "../../store/useAuthStore";
import { wsClient } from "../../utils/websocket";

interface DepositLog {
  id: string;
  warga: string;
  phone?: string;
  rw?: string;
  rtRw?: string;
  kelurahan?: string;
  jenis: string;
  berat: number;
  poin: number;
  waktu: string;
  status: string;
  lokasi: string;
  confidence?: number | null;
  organikPercent?: number;
  anorganikPercent?: number;
  fotoUrl?: string | null;
  fotoProfil?: string | null;
  isManual?: boolean;
  catatanPenolakan?: string | null;
}

export default function SetorSampah() {
  const { user } = useAuthStore();
  const isLurah = (user?.role || user?.peran || "").toUpperCase() === "LURAH";
  const userKelurahan =
    user?.kelurahan ||
    (user?.address?.includes("Cipaganti") || user?.name?.includes("Cipaganti") ? "Cipaganti" : "Cipaganti");

  const [logs, setLogs] = useState<DepositLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [wsStatus, setWsStatus] = useState<"CONNECTED" | "CONNECTING" | "DISCONNECTED">("CONNECTING");
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);

  // Detail Modal & Preview Image
  const [selectedLog, setSelectedLog] = useState<DepositLog | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterKelurahan, setFilterKelurahan] = useState<string>(isLurah ? userKelurahan : "ALL");
  const [filterRw, setFilterRw] = useState<string>("ALL");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [filterPeriode, setFilterPeriode] = useState<string>("ALL");

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  useEffect(() => {
    if (isLurah && userKelurahan) {
      setFilterKelurahan(userKelurahan);
    }
  }, [isLurah, userKelurahan]);

  // Fetch Initial Data
  const fetchLogs = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await api.get("/transactions/deposits");
      if (res.data?.success && Array.isArray(res.data.data)) {
        setLogs(res.data.data);
      } else {
        setLogs([]);
      }
    } catch (err: any) {
      console.error("Gagal memuat data penyetoran:", err);
      showToast.error(err.response?.data?.message || "Gagal terhubung ke server");
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // WebSocket Live Subscription
  useEffect(() => {
    const unsubscribeStatus = wsClient.onStatusChange((status) => {
      setWsStatus(status);
    });

    const unsubscribeDeposit = wsClient.onDeposit((newDeposit: DepositLog) => {
      setLogs((prev) => {
        const exists = prev.some((d) => d.id === newDeposit.id);
        if (exists) return prev;
        return [newDeposit, ...prev];
      });

      setRecentlyAddedId(newDeposit.id);
      setTimeout(() => {
        setRecentlyAddedId(null);
      }, 4000);

      showToast.success(`Setoran baru: ${newDeposit.warga} (${newDeposit.berat} Kg ${newDeposit.jenis})`);
    });

    return () => {
      unsubscribeStatus();
      unsubscribeDeposit();
    };
  }, []);

  // Clean Warga Name
  const cleanWargaName = (rawName?: string) => {
    if (!rawName) return "Warga Coblong";
    return rawName.replace(/^Warga\s+Binaan\s+/i, "").replace(/^Warga\s+Binaan\s*-\s*/i, "").trim() || "Warga Coblong";
  };

  // Format Rukun Warga
  const formatRukunWarga = (rawRw?: string) => {
    if (!rawRw) return "RW 01";
    if (rawRw.includes("/")) {
      const parts = rawRw.split("/");
      const rwPart = parts.find((p) => p.toLowerCase().includes("rw")) || parts[parts.length - 1];
      return rwPart.trim();
    }
    return rawRw;
  };

  // Extract Real Photo URL
  const getRealPhotoUrl = (log: DepositLog): string | null => {
    if (!log.fotoUrl) return null;
    const url = log.fotoUrl.trim();
    if (url.length === 0 || url.includes("default-residu") || url.includes("unsplash.com") || url.includes("picsum.photos")) {
      return null;
    }
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:image/")) {
      return url;
    }
    return url.startsWith("/") ? url : `/${url}`;
  };

  const COBLONG_6_KELURAHAN = [
    "Cipaganti",
    "Dago",
    "Lebak Gede",
    "Lebak Siliwangi",
    "Sadang Serang",
    "Sekeloa",
  ];

  const kelurahanOptions = useMemo(() => {
    if (isLurah && userKelurahan) return [userKelurahan];
    return COBLONG_6_KELURAHAN;
  }, [isLurah, userKelurahan]);

  const rwOptions = useMemo(() => {
    const targetKel = isLurah ? userKelurahan : filterKelurahan;
    const set = new Set<string>();

    logs.forEach((log) => {
      if (targetKel === "ALL" || (log.kelurahan || "").toLowerCase().includes(targetKel.toLowerCase())) {
        const formatted = formatRukunWarga(log.rw || log.rtRw);
        if (formatted) set.add(formatted);
      }
    });

    if (set.size === 0 && targetKel !== "ALL") {
      const rwCount = targetKel.toLowerCase().includes("cipaganti") ? 18 : 13;
      for (let i = 1; i <= rwCount; i++) {
        set.add(`RW ${String(i).padStart(2, "0")}`);
      }
    }

    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [logs, isLurah, userKelurahan, filterKelurahan]);

  // Filtered dataset
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // 1. Search Query
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase().trim();
        const matchesWarga = cleanWargaName(log.warga).toLowerCase().includes(q);
        const matchesRw = formatRukunWarga(log.rw || log.rtRw).toLowerCase().includes(q);
        const matchesKel = (log.kelurahan || "").toLowerCase().includes(q);
        const matchesId = (log.id || "").toLowerCase().includes(q);
        const matchesPhone = (log.phone || "").toLowerCase().includes(q);
        if (!matchesWarga && !matchesRw && !matchesKel && !matchesId && !matchesPhone) return false;
      }

      // 2. Kelurahan
      const targetKel = isLurah ? userKelurahan : filterKelurahan;
      if (targetKel !== "ALL" && !(log.kelurahan || "").toLowerCase().includes(targetKel.toLowerCase())) {
        return false;
      }

      // 3. RW
      if (filterRw !== "ALL") {
        const rwFormatted = formatRukunWarga(log.rw || log.rtRw);
        if (rwFormatted.toLowerCase() !== filterRw.toLowerCase()) return false;
      }

      // 4. Category
      if (filterCategory !== "ALL") {
        const catUpper = (log.jenis || "").toUpperCase();
        if (filterCategory === "ORGANIC" && !catUpper.includes("ORGANIK")) return false;
        if (filterCategory === "NON_ORGANIC" && !catUpper.includes("ANORGANIK")) return false;
        if (filterCategory === "RESIDU" && !catUpper.includes("RESIDU")) return false;
      }

      // 5. Periode
      if (filterPeriode !== "ALL") {
        const depositDate = new Date(log.waktu);
        const limitDate = new Date();
        if (filterPeriode === "7d") limitDate.setDate(limitDate.getDate() - 7);
        else if (filterPeriode === "30d") limitDate.setDate(limitDate.getDate() - 30);
        else if (filterPeriode === "90d") limitDate.setDate(limitDate.getDate() - 90);
        if (depositDate < limitDate) return false;
      }

      return true;
    });
  }, [logs, searchQuery, filterKelurahan, filterRw, filterCategory, filterPeriode, isLurah, userKelurahan]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterKelurahan, filterRw, filterCategory, filterPeriode, itemsPerPage]);

  const totalItems = filteredLogs.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentLogs = filteredLogs.slice(startIndex, endIndex);

  // Aggregated KPI Stats
  const totalBerat = useMemo(() => {
    return filteredLogs.reduce((acc, curr) => acc + (Number(curr.berat) || 0), 0);
  }, [filteredLogs]);

  const totalPoin = useMemo(() => {
    return Math.round(filteredLogs.reduce((acc, curr) => acc + (Number(curr.poin) || 0), 0));
  }, [filteredLogs]);

  const akurasiAi = useMemo(() => {
    const aiLogs = filteredLogs.filter((l) => l.confidence !== null && l.confidence !== undefined);
    if (aiLogs.length === 0) return null;
    const sum = aiLogs.reduce((acc, curr) => acc + Number(curr.confidence), 0);
    return Math.round(sum / aiLogs.length);
  }, [filteredLogs]);

  const resetFilters = () => {
    setSearchQuery("");
    setFilterKelurahan(isLurah ? userKelurahan : "ALL");
    setFilterRw("ALL");
    setFilterCategory("ALL");
    setFilterPeriode("ALL");
  };

  const renderCategoryTag = (jenis?: string) => {
    const j = (jenis || "").toUpperCase();
    if (j.includes("ORGANIK")) {
      return (
        <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
          Organik
        </span>
      );
    }
    if (j.includes("ANORGANIK")) {
      return (
        <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
          Anorganik
        </span>
      );
    }
    return (
      <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
        Residu
      </span>
    );
  };

  const renderStatusTag = (status?: string) => {
    const s = (status || "").toUpperCase();
    if (s === "ACCEPTED" || s === "SELESAI") {
      return (
        <span className="inline-block px-2 py-0.5 text-[11px] font-medium rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
          Diterima
        </span>
      );
    }
    if (s === "REJECTED" || s === "DITOLAK") {
      return (
        <span className="inline-block px-2 py-0.5 text-[11px] font-medium rounded bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">
          Ditolak
        </span>
      );
    }
    return (
      <span className="inline-block px-2 py-0.5 text-[11px] font-medium rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
        Pending
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-800 dark:text-slate-100 font-sans">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">
              {isLurah ? `Kelurahan ${userKelurahan}` : "Kecamatan Coblong"}
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Monitoring Penyetoran
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Log Aktivitas Penyetoran Sampah
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pencatatan real-time transaksi setoran warga, inferensi AI, dan penimbangan residu lapangan.
          </p>
        </div>

        {/* Real-Time WebSocket Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                wsStatus === "CONNECTED"
                  ? "bg-emerald-500 animate-pulse"
                  : wsStatus === "CONNECTING"
                  ? "bg-amber-500"
                  : "bg-slate-400"
              }`}
            />
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {wsStatus === "CONNECTED"
                ? "Live Stream Terhubung"
                : wsStatus === "CONNECTING"
                ? "Menghubungkan..."
                : "Offline (Klik Refresh)"}
            </span>
          </div>

          <button
            onClick={() => fetchLogs(false)}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Weight */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Total Sampah Terpilah
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {totalBerat >= 1000
              ? (totalBerat / 1000).toLocaleString("id-ID", { maximumFractionDigits: 2 })
              : totalBerat.toLocaleString("id-ID", { maximumFractionDigits: 1 })}{" "}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
              {totalBerat >= 1000 ? "Ton" : "Kg"}
            </span>
          </div>
        </div>

        {/* Points Awarded */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Poin Diterbitkan
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {totalPoin.toLocaleString("id-ID")}{" "}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">Pts</span>
          </div>
        </div>

        {/* AI Model Accuracy */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Akurasi Model AI
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {akurasiAi !== null ? `${akurasiAi}%` : "—"}{" "}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
              {akurasiAi !== null ? "(Rata-rata)" : "(Tidak ada data AI)"}
            </span>
          </div>
        </div>

        {/* Total Transactions */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Total Transaksi
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {totalItems}{" "}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">Transaksi</span>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search */}
        <div className="flex-1 min-w-[260px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama warga/petugas, RW, kelurahan, no. telp, ID..."
            className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-slate-400"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Kelurahan */}
          <select
            value={filterKelurahan}
            disabled={isLurah}
            onChange={(e) => setFilterKelurahan(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 outline-none"
          >
            {!isLurah && <option value="ALL">Semua Kelurahan</option>}
            {kelurahanOptions.map((kel) => (
              <option key={kel} value={kel}>
                Kel. {kel} {isLurah ? "(Wilayah Tugas)" : ""}
              </option>
            ))}
          </select>

          {/* RW */}
          <select
            value={filterRw}
            onChange={(e) => setFilterRw(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 outline-none"
          >
            <option value="ALL">Semua Rukun Warga</option>
            {rwOptions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          {/* Category */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 outline-none"
          >
            <option value="ALL">Semua Kategori</option>
            <option value="ORGANIC">Organik</option>
            <option value="NON_ORGANIC">Anorganik</option>
            <option value="RESIDU">Residu</option>
          </select>

          {/* Periode */}
          <select
            value={filterPeriode}
            onChange={(e) => setFilterPeriode(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 outline-none"
          >
            <option value="ALL">Semua Periode</option>
            <option value="7d">7 Hari Terakhir</option>
            <option value="30d">30 Hari Terakhir</option>
            <option value="90d">90 Hari Terakhir</option>
          </select>

          {(searchQuery || filterKelurahan !== (isLurah ? userKelurahan : "ALL") || filterRw !== "ALL" || filterCategory !== "ALL" || filterPeriode !== "ALL") && (
            <button
              onClick={resetFilters}
              className="px-3 py-2 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800">
          <span>
            Menampilkan {totalItems === 0 ? 0 : `${startIndex + 1} - ${endIndex}`} dari {totalItems} transaksi
          </span>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-500">
            Memuat data penyetoran...
          </div>
        ) : currentLogs.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500">
            Tidak ada transaksi yang cocok dengan filter yang dipilih.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[11px] tracking-wide">
                  <th className="py-3 px-3">ID Transaksi</th>
                  <th className="py-3 px-3">Nama Penyetor</th>
                  <th className="py-3 px-3">Wilayah</th>
                  <th className="py-3 px-3">Kategori</th>
                  <th className="py-3 px-3 text-right">Berat (Kg)</th>
                  <th className="py-3 px-3 text-right">Poin</th>
                  <th className="py-3 px-3 text-center">Akurasi AI</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3">Waktu</th>
                  <th className="py-3 px-3 text-center">Foto Bukti</th>
                  <th className="py-3 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {currentLogs.map((log) => {
                  const realPhoto = getRealPhotoUrl(log);
                  const isHighlighted = log.id === recentlyAddedId;

                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer ${
                        isHighlighted ? "bg-emerald-50/80 dark:bg-emerald-950/40" : ""
                      }`}
                    >
                      {/* ID */}
                      <td className="py-3 px-3 font-mono font-medium text-slate-900 dark:text-slate-100">
                        {log.id.length > 12 ? `${log.id.substring(0, 8)}...` : log.id}
                      </td>

                      {/* Name & Phone */}
                      <td className="py-3 px-3 font-medium text-slate-900 dark:text-slate-100">
                        <div>{cleanWargaName(log.warga)}</div>
                        {log.phone && log.phone !== "-" && (
                          <div className="text-[10px] text-slate-400">{log.phone}</div>
                        )}
                      </td>

                      {/* Region */}
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {formatRukunWarga(log.rw || log.rtRw)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Kel. {log.kelurahan || "Coblong"}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3">{renderCategoryTag(log.jenis)}</td>

                      {/* Weight */}
                      <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900 dark:text-slate-100">
                        {log.berat}
                      </td>

                      {/* Points */}
                      <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900 dark:text-slate-100">
                        {log.poin > 0 ? `+${Math.round(log.poin)}` : "0"}
                      </td>

                      {/* AI Confidence */}
                      <td className="py-3 px-3 text-center">
                        {log.confidence !== null && log.confidence !== undefined ? (
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {log.confidence}%
                          </span>
                        ) : log.isManual ? (
                          <span className="text-[11px] text-slate-400">Penimbangan Fisik</span>
                        ) : (
                          <span className="text-[11px] text-slate-400">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">{renderStatusTag(log.status)}</td>

                      {/* Time */}
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap text-[11px]">
                        {new Date(log.waktu).toLocaleString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      {/* Photo Thumbnail */}
                      <td className="py-3 px-3 text-center">
                        {realPhoto ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewImageUrl(realPhoto);
                            }}
                            className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium"
                          >
                            Lihat Foto
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">Tanpa Foto</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="px-2.5 py-1 text-[11px] font-medium rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && filteredLogs.length > 0 && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredLogs.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
              itemsPerPageOptions={[10, 25, 50, 100]}
            />
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-lg w-full overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Detail Transaksi Penyetoran
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  ID: {selectedLog.id}
                </p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-semibold px-2 py-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Photo Preview if available */}
              {getRealPhotoUrl(selectedLog) && (
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                  <img
                    src={getRealPhotoUrl(selectedLog)!}
                    alt="Bukti Setoran Sampah"
                    className="w-full h-48 object-cover cursor-pointer"
                    onClick={() => setPreviewImageUrl(getRealPhotoUrl(selectedLog))}
                  />
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-500 text-[11px] text-center">
                    Klik foto untuk memperbesar
                  </div>
                </div>
              )}

              {/* Information Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Penyetor / Petugas</div>
                  <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                    {cleanWargaName(selectedLog.warga)}
                  </div>
                  {selectedLog.phone && selectedLog.phone !== "-" && (
                    <div className="text-[11px] text-slate-500 mt-0.5">{selectedLog.phone}</div>
                  )}
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Wilayah</div>
                  <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                    {formatRukunWarga(selectedLog.rw || selectedLog.rtRw)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Kel. {selectedLog.kelurahan || "Coblong"}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Kategori Sampah</div>
                  <div className="mt-1">{renderCategoryTag(selectedLog.jenis)}</div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Status Transaksi</div>
                  <div className="mt-1">{renderStatusTag(selectedLog.status)}</div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Berat Timbangan</div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5 font-mono">
                    {selectedLog.berat} Kg
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Poin Diterbitkan</div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5 font-mono">
                    +{Math.round(selectedLog.poin)} Pts
                  </div>
                </div>
              </div>

              {/* AI Inference / Telemetry Detail */}
              {selectedLog.confidence !== null && selectedLog.confidence !== undefined ? (
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-1.5">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Hasil Inferensi Model AI</div>
                  <div className="flex justify-between font-medium text-slate-800 dark:text-slate-200">
                    <span>Tingkat Keyakinan (Confidence):</span>
                    <span className="font-semibold">{selectedLog.confidence}%</span>
                  </div>
                  <div className="flex justify-between font-medium text-slate-800 dark:text-slate-200">
                    <span>Lokasi Wadah:</span>
                    <span>{selectedLog.lokasi}</span>
                  </div>
                </div>
              ) : selectedLog.isManual ? (
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-1">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Metode Pencatatan</div>
                  <div className="text-slate-700 dark:text-slate-300">
                    Penimbangan residu fisik manual di posko lapangan oleh Petugas Residu.
                  </div>
                </div>
              ) : null}

              {/* Rejection Note if any */}
              {selectedLog.catatanPenolakan && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-300">
                  <div className="font-semibold mb-0.5">Catatan Penolakan:</div>
                  <div>{selectedLog.catatanPenolakan}</div>
                </div>
              )}

              {/* Timestamp */}
              <div className="text-[11px] text-slate-400 text-right">
                Waktu Pencatatan: {new Date(selectedLog.waktu).toLocaleString("id-ID")}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-lg text-xs font-semibold transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {previewImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div className="max-w-2xl w-full">
            <img
              src={previewImageUrl}
              alt="Bukti Foto"
              className="w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
