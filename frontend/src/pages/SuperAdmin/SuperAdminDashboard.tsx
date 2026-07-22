/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import toast from "react-hot-toast";

interface TrendData {
  period: string;
  organic: number;
  nonOrganic: number;
  residu: number;
}

interface HeatmapData {
  region: string;
  medianScore: number;
}

export const SuperAdminDashboard: React.FC = () => {
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapData[]>([]);
  const [leaderboard, setLeaderboard] = useState<HeatmapData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await api.get("/super-admin/dashboard");
        if (res.data.success) {
          setTrends(res.data.data.trends || []);
          setHeatmap(res.data.data.heatmap || []);
          setLeaderboard(res.data.data.leaderboard || []);
        }
      } catch (error) {
        console.error("Gagal memuat analitik dashboard:", error);
        toast.error("Gagal memuat analitik kota");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleExport = (type: "CSV" | "PDF") => {
    toast.success(`Mengekspor seluruh data analitik kota sebagai ${type}...`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Calculate stats
  const totalOrganic = trends.reduce((sum, t) => sum + t.organic, 0);
  const totalNonOrganic = trends.reduce((sum, t) => sum + t.nonOrganic, 0);
  const totalResidu = trends.reduce((sum, t) => sum + t.residu, 0);
  const totalWeight = totalOrganic + totalNonOrganic + totalResidu;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Portal Super Admin</h1>
          <p className="text-sm text-gray-500 mt-1">Sistem Pemantauan Nasional & Agregasi Kota</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport("CSV")}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            <span className="material-symbols-outlined text-gray-500 text-[20px]">download</span>
            Export CSV
          </button>
          <button
            onClick={() => handleExport("PDF")}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg shadow-sm text-sm font-medium hover:bg-primary-dark transition"
          >
            <span className="material-symbols-outlined text-white text-[20px]">picture_as_pdf</span>
            Export PDF
          </button>
        </div>
      </div>

      {/* Cards Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-green-50 rounded-xl text-green-600">
            <span className="material-symbols-outlined text-[32px]">forest</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Organik</p>
            <h3 className="text-2xl font-bold text-gray-900">{totalOrganic.toFixed(1)} Kg</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-blue-50 rounded-xl text-blue-600">
            <span className="material-symbols-outlined text-[32px]">recycling</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Anorganik</p>
            <h3 className="text-2xl font-bold text-gray-900">{totalNonOrganic.toFixed(1)} Kg</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-red-50 rounded-xl text-red-600">
            <span className="material-symbols-outlined text-[32px]">delete_sweep</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Residu Hilir</p>
            <h3 className="text-2xl font-bold text-gray-900">{totalResidu.toFixed(1)} Kg</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-purple-50 rounded-xl text-purple-600">
            <span className="material-symbols-outlined text-[32px]">scale</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Berat</p>
            <h3 className="text-2xl font-bold text-gray-900">{totalWeight.toFixed(1)} Kg</h3>
          </div>
        </div>
      </div>

      {/* Grid: Trends Chart and Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart (Interactive SVG Line) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Tren Pengumpulan Sampah</h3>
            <p className="text-xs text-gray-500">Kapasitas setoran mingguan (Organik vs Anorganik vs Residu)</p>
          </div>
          <div className="h-64 mt-6 flex items-end relative border-b border-l border-gray-200 p-2">
            {trends.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
                Belum ada data transaksi masuk
              </div>
            ) : (
              <div className="w-full h-full flex justify-around items-end">
                {trends.slice(-6).map((t, idx) => {
                  const maxVal = Math.max(1, ...trends.map(x => x.organic + x.nonOrganic + x.residu));
                  const orgHeight = (t.organic / maxVal) * 100;
                  const nonOrgHeight = (t.nonOrganic / maxVal) * 100;
                  const residuHeight = (t.residu / maxVal) * 100;

                  return (
                    <div key={idx} className="flex flex-col items-center gap-2 w-full max-w-[60px]">
                      <div className="w-full flex items-end gap-1 h-44">
                        <div
                          style={{ height: `${orgHeight}%` }}
                          className="w-4 bg-green-500 rounded-t-sm transition-all duration-500 hover:opacity-85"
                          title={`Organik: ${t.organic} Kg`}
                        ></div>
                        <div
                          style={{ height: `${nonOrgHeight}%` }}
                          className="w-4 bg-blue-500 rounded-t-sm transition-all duration-500 hover:opacity-85"
                          title={`Anorganik: ${t.nonOrganic} Kg`}
                        ></div>
                        <div
                          style={{ height: `${residuHeight}%` }}
                          className="w-4 bg-red-500 rounded-t-sm transition-all duration-500 hover:opacity-85"
                          title={`Residu: ${t.residu} Kg`}
                        ></div>
                      </div>
                      <span className="text-[10px] text-gray-500 whitespace-nowrap">{t.period}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex gap-4 justify-center mt-4 text-xs font-semibold">
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded-full"></span> Organik</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded-full"></span> Anorganik</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded-full"></span> Residu</span>
          </div>
        </div>

        {/* Region Leaderboard */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Leaderboard Wilayah</h3>
            <p className="text-xs text-gray-500">Skor kepatuhan median per kelurahan / RT / RW</p>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 mt-6 pr-1">
            {leaderboard.length === 0 ? (
              <div className="text-center text-sm text-gray-400 py-12">Belum ada data wilayah</div>
            ) : (
              leaderboard.map((item, idx) => {
                let badgeColor = "bg-gray-100 text-gray-600";
                if (idx === 0) badgeColor = "bg-yellow-100 text-yellow-800 font-bold";
                else if (idx === 1) badgeColor = "bg-slate-200 text-slate-800 font-semibold";
                else if (idx === 2) badgeColor = "bg-amber-100 text-amber-900";

                return (
                  <div key={idx} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-xl transition">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs ${badgeColor}`}>
                        {idx + 1}
                      </span>
                      <span className="text-sm font-medium text-gray-800">{item.region}</span>
                    </div>
                    <span className="text-sm font-bold text-primary">{item.medianScore}% Kepatuhan</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Heatmap / Region Overview List */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Heatmap Indeks Kepatuhan Wilayah</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {heatmap.map((item, idx) => {
            let colorClass = "bg-red-50 border-red-200 text-red-700";
            if (item.medianScore >= 80) colorClass = "bg-green-50 border-green-200 text-green-700";
            else if (item.medianScore >= 60) colorClass = "bg-yellow-50 border-yellow-200 text-yellow-700";

            return (
              <div key={idx} className={`p-4 rounded-xl border ${colorClass} flex flex-col justify-between gap-2 shadow-sm`}>
                <span className="text-sm font-bold">{item.region}</span>
                <div className="flex justify-between items-end">
                  <span className="text-xs">Skor Median Kepatuhan</span>
                  <span className="text-2xl font-extrabold">{item.medianScore}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
