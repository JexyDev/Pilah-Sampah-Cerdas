/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Component: WasteImpactTrendChart (Grafik Komparasi Tren Capaian Dampak Sampah)
 * Diposisikan di bawah WasteImpactSummaryTable sesuai alur tata letak pembacaan logis pimpinan.
 */

import React, { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";
import { BarChart3, LineChart, TrendingUp, TrendingDown, Weight, Percent, RefreshCw } from "lucide-react";
import type { WasteImpactItem, WasteSourceType } from "../../utils/wasteCalculations";
import {
  calculateVolumeDeltaKg,
  calculateVolumeDeltaPct,
  calculateComplianceDelta,
} from "../../utils/wasteCalculations";

export interface WasteImpactTrendChartProps {
  data: WasteImpactItem[];
  selectedSource?: WasteSourceType;
  loading?: boolean;
  className?: string;
  onRefresh?: () => void;
  lastUpdated?: string;
}

export const WasteImpactTrendChart: React.FC<WasteImpactTrendChartProps> = ({
  data,
  selectedSource = "WARGA_APP",
  loading = false,
  className = "",
  onRefresh,
  lastUpdated,
}) => {
  const [activeMetric, setActiveMetric] = useState<"VOLUME" | "KEPATUHAN">("VOLUME");

  // Format data untuk BarChart Recharts
  const chartData = data.map((item) => {
    let actualKg = item.actualKg ?? 0;
    if (selectedSource === "WARGA_APP") {
      actualKg = item.wargaKg !== undefined && item.wargaKg !== null ? item.wargaKg : (item.actualKg ?? 0);
    } else if (selectedSource === "PETUGAS_LAPANGAN") {
      actualKg = item.petugasKg !== undefined && item.petugasKg !== null ? item.petugasKg : 0;
    } else {
      const w = item.wargaKg !== undefined && item.wargaKg !== null ? item.wargaKg : (item.actualKg ?? 0);
      const p = item.petugasKg !== undefined && item.petugasKg !== null ? item.petugasKg : 0;
      actualKg = Number((w + p).toFixed(2));
    }

    const baselineKg = item.baselineKg ?? 0;
    const deltaKg = calculateVolumeDeltaKg(item.baselineKg, actualKg);
    const deltaPct = calculateVolumeDeltaPct(item.baselineKg, actualKg);

    const baselineCompliance = item.baselineCompliance ?? 0;
    const actualCompliance = item.actualCompliance ?? 0;
    const deltaCompliance = calculateComplianceDelta(item.baselineCompliance, item.actualCompliance);

    return {
      kelurahan: item.kelurahan,
      baselineKg: Number(baselineKg.toFixed(1)),
      actualKg: Number(actualKg.toFixed(1)),
      deltaKg,
      deltaPct,
      baselineCompliance: Number(baselineCompliance.toFixed(1)),
      actualCompliance: Number(actualCompliance.toFixed(1)),
      deltaCompliance,
      partisipasiWarga: item.partisipasiWarga,
      akurasiPilah: item.akurasiPilah,
      wargaAktif: item.wargaAktif,
      totalWarga: item.totalWarga,
    };
  });

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-6 ${className}`}>
      {/* Header Grafik */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700/40">
              <LineChart size={18} />
            </span>
            <h4 className="font-extrabold text-[17px] text-slate-900 dark:text-slate-100 tracking-tight">
              Grafik Komparasi Tren Capaian (Baseline vs Aktual)
            </h4>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Visualisasi perbandingan terpadu 6 kelurahan untuk membaca tren reduksi timbulan sampah dan kenaikan kepatuhan warga (akumulasi partisipasi aktif &amp; ketepatan wadah).
          </p>
          {lastUpdated && (
            <div className="flex items-center gap-2 pt-0.5 text-[11px] text-slate-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Diperbarui: {lastUpdated}</span>
              {onRefresh && (
                <button
                  type="button"
                  onClick={onRefresh}
                  disabled={loading}
                  className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-bold cursor-pointer ml-1"
                >
                  <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
                  <span>Segarkan</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Toggle Metrik Visualisasi: Volume vs Kepatuhan */}
        <div className="flex items-center bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveMetric("VOLUME")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeMetric === "VOLUME"
                ? "bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs border border-slate-200/80 dark:border-slate-700 font-black"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Weight size={13} />
            <span>Volume Sampah (kg)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMetric("KEPATUHAN")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeMetric === "KEPATUHAN"
                ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs border border-slate-200/80 dark:border-slate-700 font-black"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Percent size={13} />
            <span>Kepatuhan (%)</span>
          </button>
        </div>
      </div>

      {/* Kanvas Grafik BarChart */}
      <div className="h-[340px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.6} />
            <XAxis
              dataKey="kelurahan"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#64748b", fontWeight: 700 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }}
              tickFormatter={(val) =>
                activeMetric === "VOLUME" ? `${val} kg` : `${val}%`
              }
            />
            <RechartsTooltip
              cursor={{ fill: "rgba(241, 245, 249, 0.6)" }}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-xl border border-slate-700 text-xs min-w-[200px] space-y-2">
                      <p className="font-extrabold text-emerald-400 border-b border-slate-800 pb-1">
                        Kel. {label}
                      </p>
                      {activeMetric === "VOLUME" ? (
                        <div className="space-y-1 font-medium">
                          <div className="flex justify-between text-slate-300">
                            <span>Baseline:</span>
                            <span className="font-bold text-white">{item.baselineKg} kg</span>
                          </div>
                          <div className="flex justify-between text-blue-300">
                            <span>Aktual ({selectedSource}):</span>
                            <span className="font-bold text-blue-400">{item.actualKg} kg</span>
                          </div>
                          <div className="flex justify-between border-t border-slate-800 pt-1">
                            <span className="text-slate-400">Penurunan (Δ):</span>
                            <span
                              className={`font-black ${
                                (item.deltaKg || 0) > 0 ? "text-emerald-400" : "text-rose-400"
                              }`}
                            >
                              {(item.deltaKg || 0) > 0 ? `+${item.deltaKg}` : item.deltaKg} kg ({item.deltaPct}%)
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1 font-medium">
                          <div className="flex justify-between text-slate-300">
                            <span>Baseline:</span>
                            <span className="font-bold text-white">{item.baselineCompliance}%</span>
                          </div>
                          <div className="flex justify-between text-emerald-300">
                            <span>Kepatuhan Komposit:</span>
                            <span className="font-bold text-emerald-400">{item.actualCompliance}%</span>
                          </div>
                          {item.partisipasiWarga !== undefined && item.partisipasiWarga !== null && (
                            <div className="pt-1 border-t border-slate-800 text-[10px] space-y-0.5 text-slate-400">
                              <div className="flex justify-between">
                                <span>• Partisipasi Warga:</span>
                                <span className="font-semibold text-slate-200">{item.partisipasiWarga}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span>• Ketepatan Wadah:</span>
                                <span className="font-semibold text-slate-200">{item.akurasiPilah ?? 100}%</span>
                              </div>
                              {item.wargaAktif !== undefined && item.totalWarga !== undefined && item.totalWarga > 0 && (
                                <div className="text-[9.5px] text-slate-500 italic text-right">
                                  ({item.wargaAktif} dari {item.totalWarga} warga aktif)
                                </div>
                              )}
                            </div>
                          )}
                          <div className="flex justify-between border-t border-slate-800 pt-1">
                            <span className="text-slate-400">Kenaikan (Δ):</span>
                            <span
                              className={`font-black ${
                                (item.deltaCompliance || 0) >= 0 ? "text-teal-400" : "text-rose-400"
                              }`}
                            >
                              {(item.deltaCompliance || 0) >= 0 ? `+${item.deltaCompliance}%` : `${item.deltaCompliance}%`}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              iconType="circle"
              wrapperStyle={{ fontSize: "11px", fontWeight: 700, paddingTop: "10px" }}
            />
            {activeMetric === "VOLUME" ? (
              <>
                <Bar
                  dataKey="baselineKg"
                  name="Volume Baseline (kg)"
                  fill="#94a3b8"
                  radius={[6, 6, 0, 0]}
                  barSize={24}
                />
                <Bar
                  dataKey="actualKg"
                  name={`Volume Aktual (${selectedSource === "WARGA_APP" ? "Warga" : selectedSource === "PETUGAS_LAPANGAN" ? "Petugas" : "Semua"}) (kg)`}
                  fill="#3b82f6"
                  radius={[6, 6, 0, 0]}
                  barSize={24}
                />
              </>
            ) : (
              <>
                <Bar
                  dataKey="baselineCompliance"
                  name="Kepatuhan Baseline (%)"
                  fill="#94a3b8"
                  radius={[6, 6, 0, 0]}
                  barSize={24}
                />
                <Bar
                  dataKey="actualCompliance"
                  name="Kepatuhan Aktual (%)"
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                  barSize={24}
                />
              </>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Ringkasan Grafik */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
          <span>Abu-abu = Kondisi Awal (Baseline Survei)</span>
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ml-2" />
          <span>Biru = Realisasi Volume Terpilah</span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ml-2" />
          <span>Hijau = Realisasi Kepatuhan Pemilahan</span>
        </div>
        <span className="italic text-[11px]">
          *Hierarki pembacaan: Evaluasi angka rekapitulasi pada tabel di atas, lalu telaah tren komparasi visual pada grafik ini.
        </span>
      </div>
    </div>
  );
};

export default WasteImpactTrendChart;
