import { Download, FileText, Trees, Recycle, Trash, Scale } from "lucide-react";
/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useEffect, useState } from "react";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip } from "recharts";
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
            <Download className="text-gray-500" size={20} />
            Export CSV
          </button>
          <button
            onClick={() => handleExport("PDF")}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg shadow-sm text-sm font-medium hover:bg-primary-dark transition"
          >
            <FileText className="text-white" size={20} />
            Export PDF
          </button>
        </div>
      </div>

      {/* Cards Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-green-50 rounded-xl text-green-600">
            <Trees size={32} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Organik</p>
            <h3 className="text-2xl font-bold text-gray-900">{totalOrganic.toFixed(1)} Kg</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-blue-50 rounded-xl text-blue-600">
            <Recycle size={32} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Anorganik</p>
            <h3 className="text-2xl font-bold text-gray-900">{totalNonOrganic.toFixed(1)} Kg</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-red-50 rounded-xl text-red-600">
            <Trash size={32} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Residu Hilir</p>
            <h3 className="text-2xl font-bold text-gray-900">{totalResidu.toFixed(1)} Kg</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-purple-50 rounded-xl text-purple-600">
            <Scale size={32} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Berat</p>
            <h3 className="text-2xl font-bold text-gray-900">{totalWeight.toFixed(1)} Kg</h3>
          </div>
        </div>
      </div>

      {/* Grid: Trends Chart and Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Trend Chart (Interactive SVG Line) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-fit">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Tren Pengumpulan Sampah</h3>
            <p className="text-xs text-gray-500">Kapasitas setoran mingguan (Organik vs Anorganik vs Residu)</p>
          </div>
          {/* Chart */}
          <div className="flex-1 w-full mt-6 h-64 min-h-[250px]">
            {trends.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-gray-400">
                Belum ada data transaksi masuk
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Line type="monotone" dataKey="organic" name="Organik (Kg)" stroke="#22c55e" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="nonOrganic" name="Anorganik (Kg)" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="residu" name="Residu (Kg)" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Region Leaderboard */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-full">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Leaderboard Wilayah</h3>
            <p className="text-xs text-gray-500">Skor kepatuhan median per kelurahan / RT / RW</p>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 mt-6 pr-1 max-h-[280px]">
            {leaderboard.length === 0 ? (
              <div className="text-center text-sm text-gray-400 py-12">Belum ada data wilayah</div>
            ) : (
              leaderboard.slice(0, 10).map((item, idx) => {
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
