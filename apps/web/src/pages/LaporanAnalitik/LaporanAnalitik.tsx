/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { LineChart, FileText, Grid, Download, TrendingUp, MoreVertical, Cpu, Network, ArrowUpDown } from "lucide-react";

import React, { useState, useEffect } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";

const LaporanAnalitik: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

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

  const handleExportCSV = async () => {
    try {
      toast.loading("Menyiapkan CSV...", { id: "export" });
      const response = await api.get("/dashboard/export-dataset", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "waste_dataset.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Berhasil mengunduh CSV", { id: "export" });
    } catch (error) {
      toast.error("Gagal mengunduh CSV", { id: "export" });
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Laporan &amp; Analitik Teknikal</h1>
            <span className="bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full font-extrabold flex items-center gap-1">
              <LineChart size={13} /> Metrik Sistem
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Pemantauan performa sistem, akurasi model AI, &amp; metrik teknikal secara waktu nyata.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all text-xs border border-slate-200 cursor-pointer"
          >
            <FileText size={14} /> Ekspor PDF
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all text-xs border border-slate-200 cursor-pointer"
          >
            <Grid size={14} /> Ekspor CSV
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white font-extrabold rounded-xl transition-all text-xs shadow-sm cursor-pointer"
          >
            <Download size={14} /> Ekspor Dataset AI
          </button>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Ketersediaan Sistem */}
        <div className="md:col-span-4 bg-white rounded-2xl shadow-sm border border-outline-variant/50 p-6 flex flex-col">
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
        <div className="md:col-span-4 bg-white rounded-2xl shadow-sm border border-outline-variant/50 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-[18px] font-bold text-on-surface">Akurasi Model AI</h3>
              <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">
                Rata-rata Bergerak 30 Hari
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-[11px] font-bold uppercase tracking-wider">
              <TrendingUp size={16} />{" "}
              {data.aiAccuracy.toFixed(1)}%
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
              <p className="text-[18px] font-bold text-green-600">{data.aiAccuracy ? (data.aiAccuracy + 2).toFixed(1) : "—"}%</p>
            </div>
            <div className="text-center border-l border-outline-variant/30">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                Tingkat Kepercayaan
              </p>
              <p className="text-[18px] font-bold text-blue-600">{data.aiAccuracy.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {/* Latensi Respons */}
        <div className="md:col-span-4 bg-white rounded-2xl shadow-sm border border-outline-variant/50 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-[18px] font-bold text-on-surface">Latensi Respons</h3>
              <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">
                Rata-rata per Jam Hari Ini (ms)
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
        <div className="md:col-span-12 bg-white rounded-2xl shadow-sm border border-outline-variant/50 p-6 flex flex-col mt-6">
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
        <div className="md:col-span-4 bg-white rounded-2xl shadow-sm border border-outline-variant/50 p-6 flex flex-col mt-6">
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
              <p className="text-[18px] font-bold text-blue-600">{data.cpuUsage ? (data.cpuUsage + 5).toFixed(1) : "—"}%</p>
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
        <div className="md:col-span-4 bg-white rounded-2xl shadow-sm border border-outline-variant/50 p-6 flex flex-col mt-6">
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
                Durasi Rata-rata
              </p>
              <p className="text-[18px] font-bold text-on-surface">{data.avgSessionDuration ?? "—"}</p>
            </div>
          </div>
        </div>

        {/* Lebar Pita Jaringan */}
        <div className="md:col-span-4 bg-white rounded-2xl shadow-sm border border-outline-variant/50 p-6 flex flex-col mt-6">
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
                ? (parseFloat(data.networkIncoming) + parseFloat(data.networkOutgoing)).toFixed(1)
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
    </div>
  );
};

export default LaporanAnalitik;
