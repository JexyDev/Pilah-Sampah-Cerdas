/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 *
 * Halaman Tempat Sampah Teraktivasi (Dasbor Eksekutif):
 * - Kartu metrik eksekutif (Total, Aktif & Terikat, Ditugaskan ke PIC, Cakupan Wilayah)
 * - Filter cepat status (Semua, Aktif & Terikat, Ditugaskan ke PIC)
 * - Pencarian instan (QR Code, RW, Kelurahan)
 * - Filter Kelurahan & RW terintegrasi
 * - Binding tanggal aktivasi presisi (tanggalAktivasi / createdAt)
 * - Salin QR Code dan navigasi Google Maps
 * - Cetak laporan dan paginasi rapi
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  RefreshCw,
  AlertCircle,
  MapPin,
  Layers,
  ChevronLeft,
  ChevronRight,
  Printer,
  Trash2,
  CheckCircle2,
  UserCheck,
  Search,
  X,
  Copy,
  Check,
  Calendar,
  ExternalLink,
} from "lucide-react";
import api from "../../services/api";
import showToast from "../../utils/showToast";

// ── Daftar Kelurahan Kecamatan Coblong ────────────────────────────────────────
const KELURAHAN_OPTIONS = [
  "Semua Kelurahan",
  "Cipaganti",
  "Dago",
  "Lebak Gede",
  "Lebak Siliwangi",
  "Sadang Serang",
  "Sekeloa",
];

const ITEMS_PER_PAGE = 20;

// ── Tipe Data ─────────────────────────────────────────────────────────────────
export interface ActivatedBin {
  id: string;
  qrCode: string;
  kelurahan: string | null;
  rwNama: string | null;
  status: string;
  createdAt?: string;
  tanggalAktivasi?: string;
  latitude?: number | null;
  longitude?: number | null;
}

// ── Format Tanggal Indonesia ──────────────────────────────────────────────────
const formatTanggal = (isoDate?: string | null): string => {
  if (!isoDate || isoDate === "-" || isoDate === "null") return "-";
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return isoDate;
  }
};

// ── Status Badge ─────────────────────────────────────────────────────────────
const getStatusBadge = (status: string): string => {
  const s = status?.toUpperCase() ?? "";
  if (s === "ACTIVE_BOUND" || s.includes("ACTIVE")) {
    return "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-700/60";
  }
  if (s === "ASSIGNED_TO_PIC" || s.includes("ASSIGNED")) {
    return "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-300/80 dark:border-blue-700/60";
  }
  return "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700";
};

const getStatusLabel = (status: string): string => {
  const s = status?.toUpperCase() ?? "";
  if (s === "ACTIVE_BOUND") return "Aktif & Terikat";
  if (s === "ASSIGNED_TO_PIC") return "Diberikan ke Petugas";
  if (s === "ACTIVE") return "Aktif";
  return status || "-";
};

// ── Komponen Utama ────────────────────────────────────────────────────────────
export const TempatSampahAktifPage: React.FC = () => {
  const [selectedKelurahan, setSelectedKelurahan] = useState("Semua Kelurahan");
  const [rwInput, setRwInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [bins, setBins] = useState<ActivatedBin[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [copiedQrId, setCopiedQrId] = useState<string | null>(null);

  // ── Fetch data dari API ─────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = {};
      if (selectedKelurahan && selectedKelurahan !== "Semua Kelurahan") {
        params.kelurahan = selectedKelurahan;
      }
      if (rwInput.trim()) {
        params.rw = rwInput.trim();
      }

      const res = await api.get("/dashboard/kkn-executive/waste/bins-activated", { params });
      if (res.data?.success) {
        const responseData = res.data.data;
        setTotal(responseData?.total ?? 0);
        setBins(Array.isArray(responseData?.bins) ? responseData.bins : []);
      } else {
        setBins([]);
        setTotal(0);
      }
    } catch (err: unknown) {
      console.error("Bins activated fetch error:", err);
      setError("Gagal memuat data tempat sampah teraktivasi dari server.");
      setBins([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [selectedKelurahan, rwInput]);

  useEffect(() => {
    fetchData();
    setPage(1);
  }, [fetchData]);

  // ── Filter Data di Sisi Klien (Search & Status) ─────────────────────────────
  const filteredBins = useMemo(() => {
    return bins.filter((bin) => {
      // Filter Status
      if (statusFilter !== "ALL") {
        const s = (bin.status || "").toUpperCase();
        if (statusFilter === "ACTIVE_BOUND" && s !== "ACTIVE_BOUND") return false;
        if (statusFilter === "ASSIGNED_TO_PIC" && s !== "ASSIGNED_TO_PIC") return false;
      }

      // Filter Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const qr = (bin.qrCode || "").toLowerCase();
        const rw = (bin.rwNama || "").toLowerCase();
        const kel = (bin.kelurahan || "").toLowerCase();
        return qr.includes(q) || rw.includes(q) || kel.includes(q);
      }

      return true;
    });
  }, [bins, statusFilter, searchQuery]);

  // ── Statistik Metrik ────────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    let activeBound = 0;
    let assignedPic = 0;
    const uniqueKelurahan = new Set<string>();
    const uniqueRw = new Set<string>();

    bins.forEach((b) => {
      const s = (b.status || "").toUpperCase();
      if (s === "ACTIVE_BOUND") activeBound++;
      else if (s === "ASSIGNED_TO_PIC") assignedPic++;

      if (b.kelurahan) uniqueKelurahan.add(b.kelurahan.trim());
      if (b.rwNama && b.rwNama !== "-") uniqueRw.add(`${b.kelurahan || ""}_${b.rwNama}`);
    });

    return {
      total: bins.length,
      activeBound,
      assignedPic,
      kelurahanCount: uniqueKelurahan.size,
      rwCount: uniqueRw.size,
    };
  }, [bins]);

  // ── Pagination ──────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filteredBins.length / ITEMS_PER_PAGE));
  const paginatedBins = useMemo(() => {
    return filteredBins.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  }, [filteredBins, page]);

  const handleKelurahanChange = (val: string) => {
    setSelectedKelurahan(val);
    setPage(1);
  };

  const handleCopyQr = (id: string, qr: string) => {
    navigator.clipboard.writeText(qr);
    setCopiedQrId(id);
    showToast.success(`QR Code disalin: ${qr}`);
    setTimeout(() => setCopiedQrId(null), 2500);
  };

  return (
    <div className="space-y-5 text-slate-800 dark:text-slate-100">
      {/* ── Header & Filter Bar ──────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center border border-blue-200/60 dark:border-blue-700/40 shadow-xs">
              <Trash2 size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[10.5px] font-extrabold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 uppercase tracking-wider">
                  Inventaris Teraktivasi
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {total} Unit Terdata
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
                Tempat Sampah Teraktivasi
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Daftar unit tempat sampah cerdas yang telah teraktivasi dan siap operasional di Kecamatan Coblong
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-xs"
            >
              <Printer size={14} />
              <span>Cetak Laporan</span>
            </button>
            <button
              type="button"
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span>Perbarui Data</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-5">
          {/* Kelurahan Dropdown */}
          <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-2xl">
            <MapPin size={15} className="text-emerald-600 shrink-0" />
            <div className="flex-1">
              <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Kelurahan
              </label>
              <select
                value={selectedKelurahan}
                onChange={(e) => handleKelurahanChange(e.target.value)}
                className="bg-transparent outline-none text-xs font-bold text-slate-800 dark:text-slate-200 w-full cursor-pointer mt-0.5"
                aria-label="Filter Kelurahan"
              >
                {KELURAHAN_OPTIONS.map((k) => (
                  <option key={k} value={k} className="dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                    {k}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* RW Input */}
          <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-2xl">
            <Layers size={15} className="text-blue-500 shrink-0" />
            <div className="flex-1">
              <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Nomor RW
              </label>
              <input
                type="text"
                placeholder="Contoh: 01 (tekan Enter)"
                value={rwInput}
                onChange={(e) => setRwInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    fetchData();
                    setPage(1);
                  }
                }}
                className="bg-transparent outline-none text-xs font-bold text-slate-800 dark:text-slate-200 w-full placeholder:text-slate-400 placeholder:font-normal mt-0.5"
                aria-label="Filter RW"
              />
            </div>
            {rwInput && (
              <button
                type="button"
                onClick={() => {
                  setRwInput("");
                  fetchData();
                  setPage(1);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-2xl">
            <Search size={15} className="text-purple-500 shrink-0" />
            <div className="flex-1">
              <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Cari Unit
              </label>
              <input
                type="text"
                placeholder="QR Code, RW, atau Kelurahan..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent outline-none text-xs font-bold text-slate-800 dark:text-slate-200 w-full placeholder:text-slate-400 placeholder:font-normal mt-0.5"
                aria-label="Cari QR Code"
              />
            </div>
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setPage(1);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 4 KPI Summary Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Teraktivasi */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between w-full mb-3">
            <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-400">
              Total Teraktivasi
            </span>
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Trash2 size={18} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {loading ? "..." : metrics.total.toLocaleString("id-ID")}
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 truncate">
              {selectedKelurahan === "Semua Kelurahan" ? "Kecamatan Coblong" : `Kelurahan ${selectedKelurahan}`}
              {rwInput ? ` • RW ${rwInput}` : ""}
            </p>
          </div>
        </div>

        {/* Card 2: Aktif & Terikat */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between w-full mb-3">
            <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Aktif &amp; Terikat
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
              {loading ? "..." : metrics.activeBound.toLocaleString("id-ID")}
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 truncate">
              Status ACTIVE_BOUND ({metrics.total > 0 ? Math.round((metrics.activeBound / metrics.total) * 100) : 0}%)
            </p>
          </div>
        </div>

        {/* Card 3: Ditugaskan ke Petugas */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between w-full mb-3">
            <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
              Diberikan ke Petugas
            </span>
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <UserCheck size={18} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black tracking-tight text-indigo-600 dark:text-indigo-400">
              {loading ? "..." : metrics.assignedPic.toLocaleString("id-ID")}
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 truncate">
              Status ASSIGNED_TO_PIC
            </p>
          </div>
        </div>

        {/* Card 4: Wilayah Terjangkau */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between w-full mb-3">
            <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Cakupan Wilayah
            </span>
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <MapPin size={18} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {loading ? "..." : `${metrics.kelurahanCount} Kel / ${metrics.rwCount} RW`}
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 truncate">
              Titik Wilayah Aktif Terdata
            </p>
          </div>
        </div>
      </div>

      {/* ── Status Pill Filter Tabs ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => {
            setStatusFilter("ALL");
            setPage(1);
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
            statusFilter === "ALL"
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
              : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-400"
          }`}
        >
          <span>Semua Status</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
            {bins.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter("ACTIVE_BOUND");
            setPage(1);
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
            statusFilter === "ACTIVE_BOUND"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-emerald-400"
          }`}
        >
          <CheckCircle2 size={13} />
          <span>Aktif &amp; Terikat</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
            {metrics.activeBound}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter("ASSIGNED_TO_PIC");
            setPage(1);
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
            statusFilter === "ASSIGNED_TO_PIC"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-blue-400"
          }`}
        >
          <UserCheck size={13} />
          <span>Diberikan ke Petugas</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
            {metrics.assignedPic}
          </span>
        </button>
      </div>

      {/* ── Error Notification ────────────────────────────────────────────────── */}
      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle size={18} className="text-rose-600 shrink-0" />
          <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
        </div>
      )}

      {/* ── Tabel Tempat Sampah Teraktivasi ────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-3 border-emerald-600/20 border-t-emerald-600 rounded-full animate-spin" />
              <p className="text-xs text-slate-400 font-semibold">Memuat data tempat sampah...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-left">
                    <th className="p-3.5 pl-5 text-slate-400 font-bold uppercase tracking-wider w-14">No</th>
                    <th className="p-3.5 text-slate-400 font-bold uppercase tracking-wider">QR Code</th>
                    <th className="p-3.5 text-slate-400 font-bold uppercase tracking-wider">Kelurahan</th>
                    <th className="p-3.5 text-slate-400 font-bold uppercase tracking-wider">RW</th>
                    <th className="p-3.5 text-slate-400 font-bold uppercase tracking-wider">Status Operasional</th>
                    <th className="p-3.5 text-slate-400 font-bold uppercase tracking-wider">Tanggal Aktivasi</th>
                    <th className="p-3.5 pr-5 text-slate-400 font-bold uppercase tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {paginatedBins.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-slate-400 text-xs">
                        Tidak ada data tempat sampah teraktivasi untuk filter yang dipilih.
                      </td>
                    </tr>
                  ) : (
                    paginatedBins.map((bin, idx) => {
                      const latNum = bin.latitude ? Number(bin.latitude) : null;
                      const lngNum = bin.longitude ? Number(bin.longitude) : null;
                      const hasCoords = latNum !== null && lngNum !== null && latNum !== 0 && lngNum !== 0;
                      const tanggalDisplay = formatTanggal(bin.tanggalAktivasi || bin.createdAt);

                      return (
                        <tr
                          key={bin.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="p-3.5 pl-5 text-slate-400 font-medium">
                            {(page - 1) * ITEMS_PER_PAGE + idx + 1}
                          </td>

                          {/* QR Code with copy */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-slate-800 dark:text-slate-200 tracking-tight">
                                {bin.qrCode || "-"}
                              </span>
                              {bin.qrCode && (
                                <button
                                  type="button"
                                  onClick={() => handleCopyQr(bin.id, bin.qrCode)}
                                  className="p-1 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                  title="Salin QR Code"
                                >
                                  {copiedQrId === bin.id ? (
                                    <Check size={12} className="text-emerald-600" />
                                  ) : (
                                    <Copy size={12} />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Kelurahan */}
                          <td className="p-3.5">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {bin.kelurahan || "-"}
                            </span>
                          </td>

                          {/* RW */}
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {bin.rwNama || "-"}
                            </span>
                          </td>

                          {/* Status Badge with Dot */}
                          <td className="p-3.5">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${getStatusBadge(bin.status)}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  (bin.status || "").includes("ACTIVE")
                                    ? "bg-emerald-500 animate-pulse"
                                    : "bg-blue-500"
                                }`}
                              />
                              <span>{getStatusLabel(bin.status)}</span>
                            </span>
                          </td>

                          {/* Tanggal Aktivasi */}
                          <td className="p-3.5 text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-1.5">
                              <Calendar size={13} className="text-slate-400 shrink-0" />
                              <span className="font-medium">{tanggalDisplay}</span>
                            </div>
                          </td>

                          {/* Action Google Maps */}
                          <td className="p-3.5 pr-5 text-right">
                            {hasCoords ? (
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${latNum},${lngNum}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-600 dark:text-blue-400 text-[11px] font-bold transition cursor-pointer"
                                title="Buka Koordinat di Google Maps"
                              >
                                <ExternalLink size={11} />
                                <span>Peta</span>
                              </a>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600 text-[11px] italic">
                                Tanpa GPS
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* ── Pagination ─────────────────────────────────────────────────── */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3.5 bg-slate-50/80 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 gap-3">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Menampilkan{" "}
                  <strong className="text-slate-800 dark:text-slate-200">
                    {Math.min((page - 1) * ITEMS_PER_PAGE + 1, filteredBins.length)}
                  </strong>
                  {" "}–{" "}
                  <strong className="text-slate-800 dark:text-slate-200">
                    {Math.min(page * ITEMS_PER_PAGE, filteredBins.length)}
                  </strong>
                  {" "}dari{" "}
                  <strong className="text-slate-800 dark:text-slate-200">{filteredBins.length}</strong> unit
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                    aria-label="Halaman sebelumnya"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 px-2.5">
                    Halaman {page} dari {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                    aria-label="Halaman berikutnya"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TempatSampahAktifPage;
