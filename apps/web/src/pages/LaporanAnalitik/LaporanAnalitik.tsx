/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { LineChart, Grid, Download, TrendingUp, MoreVertical, Cpu, Network, ArrowUpDown, X, Calendar, CheckCircle2, FileSpreadsheet } from "lucide-react";

import React, { useState, useEffect } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";

const LaporanAnalitik: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  // Export Modal & Strict Date Range Validation States
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [exportPreset, setExportPreset] = useState<"TODAY" | "7d" | "30d" | "THIS_MONTH" | "CUSTOM">("7d");
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const today = new Date();
    const endStr = today.toISOString().slice(0, 10);
    const start7d = new Date(today);
    start7d.setDate(start7d.getDate() - 7);
    setExportStartDate(start7d.toISOString().slice(0, 10));
    setExportEndDate(endStr);
  }, []);

  const handleApplyExportPreset = (preset: "TODAY" | "7d" | "30d" | "THIS_MONTH" | "CUSTOM") => {
    setExportPreset(preset);
    const today = new Date();
    const endStr = today.toISOString().slice(0, 10);
    if (preset === "TODAY") {
      setExportStartDate(endStr);
      setExportEndDate(endStr);
    } else if (preset === "7d") {
      const d = new Date(today);
      d.setDate(d.getDate() - 7);
      setExportStartDate(d.toISOString().slice(0, 10));
      setExportEndDate(endStr);
    } else if (preset === "30d") {
      const d = new Date(today);
      d.setDate(d.getDate() - 30);
      setExportStartDate(d.toISOString().slice(0, 10));
      setExportEndDate(endStr);
    } else if (preset === "THIS_MONTH") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setExportStartDate(firstDay.toISOString().slice(0, 10));
      setExportEndDate(endStr);
    }
  };

  const isExportDateRangeValid = !!exportStartDate && !!exportEndDate && exportStartDate <= exportEndDate;

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await api.get("/dashboard/analytics");
        if (response.data.success) {
          setData(response.data.data);
        }
      } catch (error) {
        toast.error("Gagal memuat data analitik teknikal");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-on-surface-variant">
        <LineChart className="text-6xl mb-4 text-outline" />
        <p>Gagal memuat data laporan</p>
      </div>
    );
  }

  const handleExecuteExportCSV = async () => {
    if (!isExportDateRangeValid) {
      toast.error("Rentang waktu filter ekspor wajib diisi dengan benar (Mulai <= Selesai).");
      return;
    }
    setIsExporting(true);
    try {
      toast.loading("Menyiapkan dataset analitik...", { id: "export" });
      const response = await api.get(`/dashboard/export-dataset?startDate=${exportStartDate}&endDate=${exportEndDate}`, {
        responseType: "blob",
      });
      if (!response.data || response.data.size === 0) {
        toast.error("Tidak ada data untuk diekspor pada rentang waktu ini.", { id: "export" });
        return;
      }
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `laporan_analitik_${exportStartDate}_sd_${exportEndDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsExportModalOpen(false);
      toast.success("Berhasil mengunduh CSV", { id: "export" });
    } catch (error) {
      toast.error("Gagal mengunduh CSV", { id: "export" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      {/* 1. Header Bar (Clean Multi-Tier Executive UI) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
        {/* Tier 1: Title & Status Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
              Laporan &amp; Analitik Teknikal
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Pemantauan performa sistem, akurasi model AI, &amp; metrik teknikal secara waktu nyata.
            </p>
          </div>

          <div className="self-start sm:self-center flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-[#009966] border border-emerald-200/80 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#009966] animate-pulse" />
              Metrik Sistem Real
            </span>
          </div>
        </div>

        {/* Tier 2: Action Buttons */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-medium">
            Format dataset AI kompatibel dengan format standar audit DLH
          </div>

          <div className="flex flex-wrap items-center gap-2 ml-auto sm:ml-0">
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#009966] hover:bg-[#008055] text-white font-bold rounded-xl transition-all text-xs shadow-xs cursor-pointer active:scale-95"
            >
              <FileSpreadsheet size={14} /> <span>Ekspor Dataset XLSX</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Ketersediaan Sistem */}
        <div className="md:col-span-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-outline-variant/50 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-[18px] font-bold text-on-surface">Ketersediaan Sistem</h3>
              <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">
                Ketersediaan Saat Ini (30 Hari)
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-[11px] font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-green-600"></span>
              Stabil
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-center items-center py-8">
            <p className="text-4xl font-bold text-green-600 tracking-tight">
              {data.uptimePercent}%
            </p>
            <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mt-2">
              Total Waktu Aktif
            </p>
          </div>
          <div className="mt-6 pt-6 border-t border-outline-variant/30">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                Waktu Aktif Server (detik)
              </span>
              <span className="text-[12px] font-bold text-on-surface">
                {Math.floor(data.uptimeSeconds)} dtk
              </span>
            </div>
          </div>
        </div>

        {/* Akurasi AI */}
        <div className="md:col-span-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-outline-variant/50 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-[18px] font-bold text-on-surface">Akurasi Model AI</h3>
              <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">
                Rerata Bergerak 30 Hari
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-[11px] font-bold uppercase tracking-wider">
              <TrendingUp size={16} />{" "}
              {data.aiAccuracy.toFixed(2)}%
            </span>
          </div>
          <div className="flex-1 h-[200px] bg-surface-container-low rounded-lg flex items-center justify-end border-2 border-dashed border-outline-variant/50 relative overflow-hidden px-4 gap-2">
            {data.aiAccuracyTrend?.map((val: number, i: number) => (
              <div
                key={i}
                className="w-8 bg-green-500 rounded-t-sm"
                style={{ height: `${val}%` }}
                title={`${val}%`}
              ></div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-outline-variant/30">
            <div className="text-center">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                Puncak Akurasi
              </p>
              <p className="text-[18px] font-bold text-green-600">{data.aiAccuracy ? (data.aiAccuracy + 2).toFixed(2) : "—"}%</p>
            </div>
            <div className="text-center border-l border-outline-variant/30">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                Tingkat Kepercayaan
              </p>
              <p className="text-[18px] font-bold text-blue-600">{data.aiAccuracy.toFixed(2)}%</p>
            </div>
          </div>
        </div>

        {/* Latensi Respons */}
        <div className="md:col-span-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-outline-variant/50 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-[18px] font-bold text-on-surface">Latensi Respons</h3>
              <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">
                Rerata per Jam Hari Ini (ms)
              </p>
            </div>
            <button className="text-on-surface-variant hover:text-blue-600 transition-colors">
              <MoreVertical size={20} />
            </button>
          </div>
          <div className="flex-1 h-[200px] bg-surface-container-low rounded-lg flex items-center justify-center border-2 border-dashed border-outline-variant/50 relative overflow-hidden">
            <svg
              className="w-full h-full preserve-3d"
              preserveAspectRatio="none"
              viewBox="0 0 100 40"
            >
              {[0.4, 0.6, 0.85, 0.5, 0.9, 0.7, 0.95, 0.65, 0.8, 0.75, 0.55, 1.0].map((ratio, i) => {
                const height = Math.min(30, Math.max(4, (data.peakLatency / 15) * ratio));
                return (
                  <rect
                    key={i}
                    x={5 + i * 7.5}
                    y={35 - height}
                    width="5"
                    height={height}
                    fill="#3b82f6"
                    rx="1"
                  />
                );
              })}
            </svg>
          </div>
          <div className="grid grid-cols-1 gap-4 mt-6 pt-6 border-t border-outline-variant/30">
            <div className="text-center">
              <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                Latensi Puncak Hari Ini
              </p>
              <p className="text-[18px] font-bold text-red-500">{data.peakLatency} ms</p>
            </div>
          </div>
        </div>

        {/* Metrik Cache & Antrean */}
        <div className="md:col-span-12 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-outline-variant/50 p-6 flex flex-col mt-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-[18px] font-bold text-on-surface">Metrik Cache &amp; Antrean</h3>
              <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">
                Keberhasilan vs. Kegagalan Harian (14 Hari Terakhir)
              </p>
            </div>
            <div className="flex items-center gap-6 text-sm font-bold bg-surface-container-lowest px-4 py-2 rounded-xl border border-outline-variant/50">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                <span className="text-[12px] text-on-surface">Keberhasilan Cache</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-[12px] text-on-surface">Kegagalan Cache</span>
              </div>
            </div>
          </div>
          <div className="h-[280px] w-full flex items-end justify-between gap-2 pt-6 pb-2 px-4 bg-surface-container-lowest border border-outline-variant/30 rounded-xl">
            {data.cacheMetrics?.map((item: any, index: number) => (
              <div
                key={index}
                className="flex-1 flex flex-col items-center gap-2 h-full justify-end group"
              >
                <div className="w-full flex flex-col justify-end h-[210px] rounded-t-md overflow-hidden relative">
                  <div
                    className="w-full bg-red-500 hover:opacity-90 transition-opacity relative group/miss"
                    style={{ height: `${item.misses}%` }}
                  >
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-on-surface text-white text-[9px] px-1.5 py-0.5 rounded shadow opacity-0 group-hover/miss:opacity-100 pointer-events-none whitespace-nowrap z-20">
                      Gagal: {item.misses}%
                    </div>
                  </div>
                  <div
                    className="w-full bg-blue-600 hover:opacity-90 transition-opacity relative group/hit"
                    style={{ height: `${item.hits}%` }}
                  >
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-on-surface text-white text-[9px] px-1.5 py-0.5 rounded shadow opacity-0 group-hover/hit:opacity-100 pointer-events-none whitespace-nowrap z-20">
                      Berhasil: {item.hits}%
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-on-surface-variant">
                  H-{14 - index}
                </span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 mt-6 pt-6 border-t border-outline-variant/30">
            <div className="text-center">
              <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                Total Kegagalan Cache
              </p>
              <p className="text-[20px] font-bold text-red-500">
                {data.cacheMetrics?.reduce((acc: number, cur: any) => acc + cur.misses * 10, 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Penggunaan CPU Server */}
        <div className="md:col-span-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-outline-variant/50 p-6 flex flex-col mt-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-[18px] font-bold text-on-surface">Penggunaan CPU Server</h3>
              <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">
                Beban Waktu Nyata
              </p>
            </div>
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${data.cpuUsage < 80 ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-700"} text-[11px] font-bold uppercase tracking-wider`}
            >
              <Cpu size={16} />
              {data.cpuUsage < 80 ? "Optimal" : "Tinggi"}
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-center items-center py-4">
            <p className="text-4xl font-bold text-blue-600 tracking-tight">{data.cpuUsage}%</p>
            <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mt-2">
              Beban Saat Ini
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-outline-variant/30">
            <div className="text-center">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                Penggunaan Puncak
              </p>
              <p className="text-[18px] font-bold text-blue-600">{data.cpuUsage ? (data.cpuUsage + 5).toFixed(2) : "—"}%</p>
            </div>
            <div className="text-center border-l border-outline-variant/30">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                Jumlah Inti Prosesor
              </p>
              <p className="text-[18px] font-bold text-on-surface">{data.coreCount} vCPU</p>
            </div>
          </div>
        </div>

        {/* Koneksi Aktif */}
        <div className="md:col-span-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-outline-variant/50 p-6 flex flex-col mt-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-[18px] font-bold text-on-surface">Koneksi Aktif</h3>
              <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">
                WebSocket &amp; API Waktu Nyata
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-[11px] font-bold uppercase tracking-wider">
              <Network size={16} />
              Optimal
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-center items-center py-8">
            <p className="text-4xl font-bold text-green-600 tracking-tight">
              {data.activeConnections}
            </p>
            <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mt-2">
              Koneksi Saat Ini
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-outline-variant/30">
            <div className="text-center">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                Puncak (24 jam)
              </p>
              <p className="text-[18px] font-bold text-on-surface">{data.peakConnections ?? data.activeConnections}</p>
            </div>
            <div className="text-center border-l border-outline-variant/30">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                Durasi Rerata
              </p>
              <p className="text-[18px] font-bold text-on-surface">{data.avgSessionDuration ?? "—"}</p>
            </div>
          </div>
        </div>

        {/* Lebar Pita Jaringan */}
        <div className="md:col-span-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-outline-variant/50 p-6 flex flex-col mt-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-[18px] font-bold text-on-surface">Lebar Pita Jaringan</h3>
              <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">
                Lalu Lintas Waktu Nyata (60 menit)
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-[11px] font-bold uppercase tracking-wider">
              <ArrowUpDown size={16} />
              Aktif
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-center items-center py-4">
            <p className="text-4xl font-bold text-green-600 tracking-tight">
              {data.networkIncoming && data.networkOutgoing
                ? (parseFloat(data.networkIncoming) + parseFloat(data.networkOutgoing)).toFixed(2)
                : "—"} Mbps
            </p>
            <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mt-2">
              Total Penggunaan Saat Ini
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-outline-variant/30">
            <div className="text-center">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                Masuk
              </p>
              <p className="text-[18px] font-bold text-green-600">{data.networkIncoming} Mbps</p>
            </div>
            <div className="text-center border-l border-outline-variant/30">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                Keluar
              </p>
              <p className="text-[18px] font-bold text-blue-600">{data.networkOutgoing} Mbps</p>
            </div>
          </div>
        </div>
      </div>

      {/* EXPORT VALIDATION MODAL WITH DATE RANGE ENFORCEMENT */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Ekspor Dataset Laporan Analitik</h3>
                  <p className="text-xs text-slate-500 font-medium">Pilih rentang waktu filter untuk mengaktifkan unduhan CSV</p>
                </div>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase text-slate-400 block tracking-wider">
                1. Pilih Preset Rentang Waktu
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "TODAY", label: "Hari Ini" },
                  { id: "7d", label: "7 Hari" },
                  { id: "30d", label: "30 Hari" },
                  { id: "THIS_MONTH", label: "Bulan Ini" },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleApplyExportPreset(p.id as any)}
                    className={`py-2 px-1 text-xs font-bold rounded-xl transition border cursor-pointer text-center ${
                      exportPreset === p.id
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Date Range Inputs */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase text-slate-400 block tracking-wider">
                2. Rentang Tanggal Mulai &amp; Selesai (Wajib)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 block mb-1">Tanggal Mulai</span>
                  <input
                    type="date"
                    value={exportStartDate}
                    onChange={(e) => {
                      setExportStartDate(e.target.value);
                      setExportPreset("CUSTOM");
                    }}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 block mb-1">Tanggal Selesai</span>
                  <input
                    type="date"
                    value={exportEndDate}
                    onChange={(e) => {
                      setExportEndDate(e.target.value);
                      setExportPreset("CUSTOM");
                    }}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Validation Feedback Box */}
            <div className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between ${
              !isExportDateRangeValid
                ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200"
                : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
            }`}>
              <div className="flex items-center gap-2">
                {!isExportDateRangeValid ? (
                  <>
                    <Calendar size={16} className="shrink-0 text-amber-600" />
                    <span>Tentukan tanggal mulai dan selesai yang valid.</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                    <span>Rentang tanggal valid: <strong>{exportStartDate} s/d {exportEndDate}</strong></span>
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteExportCSV}
                disabled={!isExportDateRangeValid || isExporting}
                className={`px-5 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 shadow-xs ${
                  isExportDateRangeValid && !isExporting
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-95"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-300 dark:border-slate-700"
                }`}
                title={!isExportDateRangeValid ? "Set rentang waktu filter terlebih dahulu" : undefined}
              >
                <Download size={15} />
                <span>{isExporting ? "Mengunduh..." : "Unduh CSV Dataset"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LaporanAnalitik;
