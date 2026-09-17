/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 *
 * Halaman Tempat Sampah Teraktivasi:
 * - Tabel daftar tempat sampah yang sudah diaktivasi
 * - Filter Kelurahan & RW
 * - Pagination 20 item per halaman
 * - Kartu ringkasan total
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  AlertCircle,
  MapPin,
  Layers,
  ChevronLeft,
  ChevronRight,
  Printer,
  Trash2,
} from "lucide-react";
import api from "../../services/api";

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
interface ActivatedBin {
  id: string;
  qrCode: string;
  kelurahan: string;
  rwNama: string;
  status: string;
  createdAt: string;
  latitude?: number;
  longitude?: number;
}

// ── Format Tanggal Indonesia ──────────────────────────────────────────────────
const formatTanggal = (isoDate: string): string => {
  if (!isoDate) return "-";
  try {
    const d = new Date(isoDate);
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
    return "bg-emerald-100 text-emerald-700 border border-emerald-300";
  }
  if (s === "ASSIGNED_TO_PIC" || s.includes("ASSIGNED")) {
    return "bg-blue-100 text-blue-700 border border-blue-300";
  }
  return "bg-slate-100 text-slate-600 border border-slate-300";
};

const getStatusLabel = (status: string): string => {
  const s = status?.toUpperCase() ?? "";
  if (s === "ACTIVE_BOUND") return "Aktif & Terikat";
  if (s === "ASSIGNED_TO_PIC") return "Ditugaskan";
  if (s === "ACTIVE") return "Aktif";
  return status || "-";
};

// ── Komponen Utama ────────────────────────────────────────────────────────────
const TempatSampahAktifPage: React.FC = () => {
  const [selectedKelurahan, setSelectedKelurahan] = useState("Semua Kelurahan");
  const [rwInput, setRwInput] = useState("");
  const [bins, setBins] = useState<ActivatedBin[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

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

  // ── Pagination ──────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(bins.length / ITEMS_PER_PAGE));
  const paginatedBins = bins.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleKelurahanChange = (val: string) => {
    setSelectedKelurahan(val);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* ── Header & Filter ──────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center border border-blue-200/60 dark:border-blue-700/40">
              <Trash2 size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100">Tempat Sampah Teraktivasi</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Daftar tempat sampah yang telah diaktivasi oleh warga
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            >
              <Printer size={14} />
              <span>Cetak</span>
            </button>
            <button
              type="button"
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span>Perbarui</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl">
            <MapPin size={13} className="text-emerald-600 shrink-0" />
            <select
              value={selectedKelurahan}
              onChange={(e) => handleKelurahanChange(e.target.value)}
              className="bg-transparent outline-none text-xs font-semibold text-slate-700 dark:text-slate-200 w-full cursor-pointer"
              aria-label="Filter Kelurahan Tempat Sampah"
            >
              {KELURAHAN_OPTIONS.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl">
            <Layers size={13} className="text-blue-500 shrink-0" />
            <input
              type="text"
              placeholder="Nomor RW (opsional, tekan Enter)"
              value={rwInput}
              onChange={(e) => setRwInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  fetchData();
                  setPage(1);
                }
              }}
              className="bg-transparent outline-none text-xs font-semibold text-slate-700 dark:text-slate-200 w-full placeholder:text-slate-400"
              aria-label="Filter RW Tempat Sampah"
            />
          </div>
        </div>
      </div>

      {/* ── Kartu Ringkasan ───────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              Total Tempat Sampah Teraktivasi
            </p>
            <p className="text-3xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {loading ? (
                <span className="inline-block w-16 h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              ) : (
                total.toLocaleString("id-ID")
              )}
            </p>
            {!loading && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {selectedKelurahan === "Semua Kelurahan"
                  ? "Kecamatan Coblong"
                  : `Kelurahan ${selectedKelurahan}`}
                {rwInput ? ` • RW ${rwInput}` : ""}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Error State ───────────────────────────────────────────────────────── */}
      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle size={18} className="text-rose-600 shrink-0" />
          <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
        </div>
      )}

      {/* ── Tabel ─────────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="h-48 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-3 border-emerald-600/20 border-t-emerald-600 rounded-full animate-spin" />
              <p className="text-xs text-slate-400 font-semibold">Memuat data...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                    <th className="p-3 text-left text-slate-400 font-bold uppercase tracking-wide w-10">No</th>
                    <th className="p-3 text-left text-slate-400 font-bold uppercase tracking-wide">QR Code</th>
                    <th className="p-3 text-left text-slate-400 font-bold uppercase tracking-wide">Kelurahan</th>
                    <th className="p-3 text-left text-slate-400 font-bold uppercase tracking-wide">RW</th>
                    <th className="p-3 text-left text-slate-400 font-bold uppercase tracking-wide">Status</th>
                    <th className="p-3 text-left text-slate-400 font-bold uppercase tracking-wide">Tanggal Aktivasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedBins.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                        Tidak ada data tempat sampah teraktivasi untuk filter yang dipilih.
                      </td>
                    </tr>
                  ) : (
                    paginatedBins.map((bin, idx) => (
                      <tr
                        key={bin.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                      >
                        <td className="p-3 text-slate-500 font-medium">
                          {(page - 1) * ITEMS_PER_PAGE + idx + 1}
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                          {bin.qrCode || "-"}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">
                          {bin.kelurahan || "-"}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">
                          {bin.rwNama || "-"}
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadge(bin.status)}`}
                          >
                            {getStatusLabel(bin.status)}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">
                          {formatTanggal(bin.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Menampilkan{" "}
                  <strong className="text-slate-700 dark:text-slate-300">
                    {Math.min((page - 1) * ITEMS_PER_PAGE + 1, bins.length)}
                  </strong>
                  {" "}–{" "}
                  <strong className="text-slate-700 dark:text-slate-300">
                    {Math.min(page * ITEMS_PER_PAGE, bins.length)}
                  </strong>
                  {" "}dari{" "}
                  <strong className="text-slate-700 dark:text-slate-300">{bins.length}</strong> data
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                    aria-label="Halaman sebelumnya"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 px-2">
                    {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors"
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
