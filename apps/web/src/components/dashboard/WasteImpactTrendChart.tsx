/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Component: WasteImpactTrendChart (Grafik Komparasi Tren Capaian: Baseline vs Hasil Giat KKN)
 * Menampilkan 2 grafik komparasi berdampingan:
 * 1. Komparasi Baseline Berat Sampah vs Hasil Giat KKN (kg)
 * 2. Komparasi Baseline Kepatuhan vs Hasil Giat KKN (%)
 * Sesuai instruksi Direksi: "ada 2 grafik: komparasi = baseline kepatuhan vs hasil giat KKN & komparasi = baseline berat sampah vs hasil giat KKN"
 */

import React, { useState, useMemo } from "react";
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
import {
  BarChart3,
  LineChart,
  Weight,
  Percent,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Minus,
  CheckCircle2,
} from "lucide-react";
import type { WasteImpactItem, WasteSourceType, WastePeriodMode } from "../../utils/wasteCalculations";
import {
  calculateVolumeDeltaKg,
  calculateVolumeDeltaPct,
  calculateComplianceDelta,
  calculateDailyAverageKg,
  calculateMonthlyKg,
  STANDARD_CYCLE_DAYS,
  formatDeltaKg,
} from "../../utils/wasteCalculations";
import {
  SURVEY_BASELINE_COMPLIANCE,
  SURVEY_BASELINE_DAILY_KG,
} from "./WasteImpactSummaryTable";

export interface WasteImpactTrendChartProps {
  data: WasteImpactItem[];
  selectedSource?: WasteSourceType;
  periodMode?: WastePeriodMode;
  loading?: boolean;
  className?: string;
  onRefresh?: () => void;
  lastUpdated?: string;
}

export type ChartViewMode = "BOTH" | "VOLUME" | "KEPATUHAN";

export const WasteImpactTrendChart: React.FC<WasteImpactTrendChartProps> = ({
  data,
  selectedSource = "WARGA_APP",
  periodMode = "DAILY",
  loading = false,
  className = "",
  onRefresh,
  lastUpdated,
}) => {
  const [viewMode, setViewMode] = useState<ChartViewMode>("BOTH");

  // Satuan dinamis berdasarkan mode waktu aktif
  const unitLabel = periodMode === "DAILY" ? "kg/hari" : "kg/bulan";

  // Label sumber data
  const sourceLabel = useMemo(() => {
    if (selectedSource === "WARGA_APP") return "Aktivitas Warga";
    if (selectedSource === "PETUGAS_LAPANGAN") return "Input Petugas";
    return "Semua Sumber (Warga + Petugas)";
  }, [selectedSource]);

  // Format data untuk BarChart Recharts
  const chartData = useMemo(() => {
    return data.map((item) => {
      let rawAccumulatedKg = item.actualKg ?? 0;
      if (selectedSource === "WARGA_APP") {
        rawAccumulatedKg = item.wargaKg !== undefined && item.wargaKg !== null ? item.wargaKg : (item.actualKg ?? 0);
      } else if (selectedSource === "PETUGAS_LAPANGAN") {
        rawAccumulatedKg = item.petugasKg !== undefined && item.petugasKg !== null ? item.petugasKg : 0;
      } else {
        const w = item.wargaKg !== undefined && item.wargaKg !== null ? item.wargaKg : (item.actualKg ?? 0);
        const p = item.petugasKg !== undefined && item.petugasKg !== null ? item.petugasKg : 0;
        rawAccumulatedKg = Number((w + p).toFixed(2));
      }

      const normK = item.kelurahan.toLowerCase().replace(/^kel(urahan)?\.\s*/i, "").replace(/\s+/g, "");

      // Mode DAILY: Nilai aktual adalah berat timbulan transaksi harian pada hari terpilih (rawAccumulatedKg)
      // Mode MONTHLY: Nilai aktual adalah total berat timbulan transaksi akumulasi bulan terpilih (rawAccumulatedKg)
      const displayActualKg = rawAccumulatedKg;
      const dailyAverageKg = calculateDailyAverageKg(rawAccumulatedKg, STANDARD_CYCLE_DAYS);
      const monthlyActualKg = rawAccumulatedKg;

      const dailyBaselineKg =
        item.baselineKg !== undefined && item.baselineKg !== null && item.baselineKg > 0
          ? item.baselineKg
          : (SURVEY_BASELINE_DAILY_KG[normK] ?? 0);
      const monthlyBaselineKg = calculateMonthlyKg(dailyBaselineKg, STANDARD_CYCLE_DAYS) ?? 0;

      const displayBaselineKg = periodMode === "DAILY" ? dailyBaselineKg : monthlyBaselineKg;

      const deltaKg = calculateVolumeDeltaKg(displayBaselineKg, displayActualKg);
      const deltaPct = calculateVolumeDeltaPct(displayBaselineKg, displayActualKg);

      const baselineCompliance =
        item.baselineCompliance !== undefined && item.baselineCompliance !== null && item.baselineCompliance > 0
          ? item.baselineCompliance
          : (SURVEY_BASELINE_COMPLIANCE[normK] ?? 0);
      const actualCompliance = item.actualCompliance ?? 0;
      const deltaCompliance = calculateComplianceDelta(baselineCompliance, actualCompliance);

      return {
        kelurahan: item.kelurahan,
        baselineKg: Number(displayBaselineKg.toFixed(1)),
        actualKg: Number(displayActualKg.toFixed(1)),
        rawAccumulatedKg,
        dailyAverageKg,
        monthlyActualKg,
        monthlyBaselineKg,
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
  }, [data, selectedSource, periodMode]);

  // Ringkasan Cepat Metrik Berat Sampah
  const volumeSummary = useMemo(() => {
    const totalBaselineKg = chartData.reduce((acc, curr) => acc + (curr.baselineKg || 0), 0);
    const totalActualKg = chartData.reduce((acc, curr) => acc + (curr.actualKg || 0), 0);
    const totalDeltaKg =
      totalActualKg > 0 ? Number((totalBaselineKg - totalActualKg).toFixed(1)) : null;
    const totalDeltaPct =
      totalBaselineKg > 0 && totalDeltaKg !== null
        ? Number(((totalDeltaKg / totalBaselineKg) * 100).toFixed(1))
        : null;

    return {
      totalBaselineKg: Number(totalBaselineKg.toFixed(1)),
      totalActualKg: Number(totalActualKg.toFixed(1)),
      totalDeltaKg,
      totalDeltaPct,
    };
  }, [chartData]);

  // Ringkasan Cepat Metrik Kepatuhan
  const complianceSummary = useMemo(() => {
    const validBaseline = chartData.filter((c) => (c.baselineCompliance || 0) > 0);
    const avgBaseline =
      validBaseline.length > 0
        ? Number(
            (
              validBaseline.reduce((acc, curr) => acc + (curr.baselineCompliance || 0), 0) /
              validBaseline.length
            ).toFixed(1)
          )
        : 0;

    const validActual = chartData.filter((c) => (c.actualCompliance || 0) > 0);
    const avgActual =
      validActual.length > 0
        ? Number(
            (
              validActual.reduce((acc, curr) => acc + (curr.actualCompliance || 0), 0) /
              validActual.length
            ).toFixed(1)
          )
        : 0;

    const avgDelta = Number((avgActual - avgBaseline).toFixed(1));

    return {
      avgBaseline,
      avgActual,
      avgDelta,
    };
  }, [chartData]);

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-6 ${className}`}>
      {/* Header Utama Komparasi */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700/40">
              <LineChart size={18} />
            </span>
            <h4 className="font-extrabold text-[17px] text-slate-900 dark:text-slate-100 tracking-tight">
              Grafik Komparasi Capaian (Baseline vs Hasil Giat KKN)
            </h4>
            <span className="text-[10px] font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/40 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              2 Grafik Indikator
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-3xl">
            Visualisasi komparasi terpadu 6 kelurahan Kecamatan Coblong: <strong>Baseline Berat Sampah vs Hasil Giat KKN</strong> (reduksi timbulan) dan <strong>Baseline Kepatuhan vs Hasil Giat KKN</strong> (peningkatan kepatuhan pemilahan warga).
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

        {/* View Mode Switcher: 2 Grafik (Default) vs Pilihan Tunggal */}
        <div className="flex items-center bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 self-start lg:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setViewMode("BOTH")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === "BOTH"
                ? "bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-xs border border-slate-200/80 dark:border-slate-700 font-black"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <BarChart3 size={13} />
            <span>2 Grafik (Berdampingan)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("VOLUME")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === "VOLUME"
                ? "bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs border border-slate-200/80 dark:border-slate-700 font-black"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Weight size={13} />
            <span>Berat Sampah Saja</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("KEPATUHAN")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === "KEPATUHAN"
                ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs border border-slate-200/80 dark:border-slate-700 font-black"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Percent size={13} />
            <span>Kepatuhan Saja</span>
          </button>
        </div>
      </div>

      {/* Grid 2 Grafik (Berdampingan di Desktop) */}
      <div className={`grid gap-6 ${viewMode === "BOTH" ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1"}`}>
        {/* ========================================================
            GRAFIK 1: Komparasi Baseline Berat Sampah vs Hasil Giat KKN
           ======================================================== */}
        {(viewMode === "BOTH" || viewMode === "VOLUME") && (
          <div className="bg-slate-50/70 dark:bg-slate-950/40 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-4">
            {/* Header Grafik 1 */}
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400">
                    <Weight size={15} />
                  </span>
                  <h5 className="font-extrabold text-[15px] text-slate-900 dark:text-slate-100 tracking-tight">
                    Komparasi Berat Sampah: Baseline vs Aktual ({unitLabel})
                  </h5>
                </div>
                <p className="text-[11.5px] text-slate-500 dark:text-slate-400">
                  {periodMode === "DAILY"
                    ? "Perbandingan berat timbulan transaksi harian (kg/hari) terhadap baseline survei awal Juli 2026."
                    : "Perbandingan total berat timbulan transaksi bulanan (kg/bulan) terhadap baseline survei bulanan Juli 2026."}
                </p>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 shrink-0">
                Filter: {sourceLabel}
              </span>
            </div>

            {/* Kanvas BarChart Berat Sampah */}
            <div className="h-[320px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 15, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.6} />
                  <XAxis
                    dataKey="kelurahan"
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    tick={{ fontSize: 10, fill: "#64748b", fontWeight: 700 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    width={periodMode === "DAILY" ? 65 : 72}
                    tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }}
                    tickFormatter={(val) => `${val} ${periodMode === "DAILY" ? "kg/h" : "kg/b"}`}
                  />
                  <RechartsTooltip
                    cursor={{ fill: "rgba(241, 245, 249, 0.6)" }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload;
                        return (
                          <div className="bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-xl border border-slate-700 text-xs min-w-[230px] space-y-2">
                            <p className="font-extrabold text-blue-400 border-b border-slate-800 pb-1">
                              Kel. {label}
                            </p>
                            <div className="space-y-1.5 font-medium">
                              <div className="flex justify-between text-slate-300">
                                <span>Baseline ({unitLabel}):</span>
                                <span className="font-bold text-white font-mono">
                                  {Number(item.baselineKg).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} {unitLabel}
                                </span>
                              </div>
                              <div className="flex justify-between text-blue-300">
                                <span>Aktual ({unitLabel}):</span>
                                <div className="text-right">
                                  <span className="font-bold text-blue-400 font-mono">
                                    {Number(item.actualKg).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} {unitLabel}
                                  </span>
                                </div>
                              </div>
                              <div className="flex justify-between border-t border-slate-800 pt-1 text-[11px]">
                                <span className="text-slate-400">
                                  Penurunan Berat (Δ):
                                </span>
                                <span
                                  className={`font-black font-mono ${
                                    (item.deltaKg || 0) > 0
                                      ? "text-emerald-400"
                                      : (item.deltaKg || 0) < 0
                                      ? "text-rose-400"
                                      : "text-slate-400"
                                  }`}
                                >
                                  {(item.deltaKg || 0) > 0 ? `+${item.deltaKg}` : item.deltaKg} {unitLabel} ({item.deltaPct ?? 0}%)
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: "11px", fontWeight: 700, paddingTop: "12px" }}
                  />
                  <Bar
                    dataKey="baselineKg"
                    name={`Baseline (${unitLabel})`}
                    fill="#94a3b8"
                    radius={[6, 6, 0, 0]}
                    barSize={viewMode === "BOTH" ? 18 : 26}
                  />
                  <Bar
                    dataKey="actualKg"
                    name={`Aktual (${selectedSource === "WARGA_APP" ? "Warga" : selectedSource === "PETUGAS_LAPANGAN" ? "Petugas" : "Semua"}) (${unitLabel})`}
                    fill="#3b82f6"
                    radius={[6, 6, 0, 0]}
                    barSize={viewMode === "BOTH" ? 18 : 26}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center text-[10.5px] text-slate-400 font-medium -mt-2 mb-1">
              Sumbu X: 6 Kelurahan Binaan KKN • Sumbu Y: Berat Sampah ({unitLabel}) • Sumber: {sourceLabel}
            </p>

            {/* Mini Rekapitulasi Berat Sampah */}
            <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                <span className="block text-[10px] text-slate-400 font-bold uppercase">Total Baseline</span>
                <span className="font-black text-slate-700 dark:text-slate-200 font-mono">
                  {volumeSummary.totalBaselineKg.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} {unitLabel}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                <span className="block text-[10px] text-blue-500 font-bold uppercase">Aktual Terpilih</span>
                <span className="font-black text-blue-600 dark:text-blue-400 font-mono">
                  {volumeSummary.totalActualKg.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} {unitLabel}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                <span className="block text-[10px] text-emerald-500 font-bold uppercase">
                  Penurunan Berat (Δ)
                </span>
                <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {volumeSummary.totalDeltaKg !== null
                    ? `${formatDeltaKg(volumeSummary.totalDeltaKg, { showPlusSign: false, unit: unitLabel })} (${volumeSummary.totalDeltaPct}%)`
                    : "—"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            GRAFIK 2: Komparasi Baseline Kepatuhan vs Hasil Giat KKN
           ======================================================== */}
        {(viewMode === "BOTH" || viewMode === "KEPATUHAN") && (
          <div className="bg-slate-50/70 dark:bg-slate-950/40 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-4">
            {/* Header Grafik 2 */}
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400">
                    <Percent size={15} />
                  </span>
                  <h5 className="font-extrabold text-[15px] text-slate-900 dark:text-slate-100 tracking-tight">
                    Komparasi Kepatuhan: Baseline vs Hasil Giat KKN
                  </h5>
                </div>
                <p className="text-[11.5px] text-slate-500 dark:text-slate-400">
                  Tingkat kepatuhan pemilahan (%) warga sebelum intervensi vs hasil giat KKN.
                </p>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shrink-0 flex items-center gap-1">
                <CheckCircle2 size={11} /> Formula Komposit
              </span>
            </div>

            {/* Kanvas BarChart Kepatuhan */}
            <div className="h-[320px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 15, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.6} />
                  <XAxis
                    dataKey="kelurahan"
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    tick={{ fontSize: 10, fill: "#64748b", fontWeight: 700 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    width={45}
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <RechartsTooltip
                    cursor={{ fill: "rgba(241, 245, 249, 0.6)" }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload;
                        return (
                          <div className="bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-xl border border-slate-700 text-xs min-w-[210px] space-y-2">
                            <p className="font-extrabold text-emerald-400 border-b border-slate-800 pb-1">
                              Kel. {label}
                            </p>
                            <div className="space-y-1.5 font-medium">
                              <div className="flex justify-between text-slate-300">
                                <span>Baseline Kepatuhan:</span>
                                <span className="font-bold text-white">{item.baselineCompliance}%</span>
                              </div>
                              <div className="flex justify-between text-emerald-300">
                                <span>Hasil Giat KKN:</span>
                                <span className="font-bold text-emerald-400">{item.actualCompliance}%</span>
                              </div>
                              {item.partisipasiWarga !== undefined && item.partisipasiWarga !== null && (
                                <div className="pt-1 border-t border-slate-800 text-[10px] space-y-0.5 text-slate-400">
                                  <div className="flex justify-between">
                                    <span>• Partisipasi Warga:</span>
                                    <span className="font-semibold text-slate-200">{item.partisipasiWarga}%</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>• Ketepatan Tempat Sampah:</span>
                                    <span className="font-semibold text-slate-200">{item.akurasiPilah ?? 100}%</span>
                                  </div>
                                  {item.wargaAktif !== undefined && item.totalWarga !== undefined && item.totalWarga > 0 && (
                                    <div className="text-[9.5px] text-slate-500 italic text-right">
                                      ({item.wargaAktif} dari {item.totalWarga} warga aktif)
                                    </div>
                                  )}
                                </div>
                              )}
                              <div className="flex justify-between border-t border-slate-800 pt-1 text-[11px]">
                                <span className="text-slate-400">Peningkatan (Δ):</span>
                                <span
                                  className={`font-black ${
                                    (item.deltaCompliance || 0) >= 0 ? "text-teal-400" : "text-rose-400"
                                  }`}
                                >
                                  {(item.deltaCompliance || 0) >= 0
                                    ? `+${item.deltaCompliance} pp`
                                    : `${item.deltaCompliance} pp`}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: "11px", fontWeight: 700, paddingTop: "12px" }}
                  />
                  <Bar
                    dataKey="baselineCompliance"
                    name="Baseline Kepatuhan (%)"
                    fill="#94a3b8"
                    radius={[6, 6, 0, 0]}
                    barSize={viewMode === "BOTH" ? 18 : 26}
                  />
                  <Bar
                    dataKey="actualCompliance"
                    name="Hasil Giat KKN (%)"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                    barSize={viewMode === "BOTH" ? 18 : 26}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center text-[10.5px] text-slate-400 font-medium -mt-2 mb-1">
              Sumbu X: 6 Kelurahan Binaan KKN • Sumbu Y: Persentase Kepatuhan (%)
            </p>

            {/* Mini Rekapitulasi Kepatuhan */}
            <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                <span className="block text-[10px] text-slate-400 font-bold uppercase">Rerata Baseline</span>
                <span className="font-black text-slate-700 dark:text-slate-200">
                  {complianceSummary.avgBaseline}%
                </span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                <span className="block text-[10px] text-emerald-500 font-bold uppercase">Hasil Giat KKN</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">
                  {complianceSummary.avgActual}%
                </span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                <span className="block text-[10px] text-teal-500 font-bold uppercase">Peningkatan (Δ)</span>
                <span
                  className={`font-black ${
                    complianceSummary.avgDelta >= 0 ? "text-teal-600 dark:text-teal-400" : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {complianceSummary.avgDelta >= 0 ? `+${complianceSummary.avgDelta} pp` : `${complianceSummary.avgDelta} pp`}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Ringkasan Grafik Terpadu */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            <span className="font-semibold">Abu-abu = Baseline Survei (Kondisi Awal Juli 2026)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="font-semibold">
              Biru = Aktual ({unitLabel}) Terpilih ({selectedSource === "WARGA_APP" ? "Warga" : selectedSource === "PETUGAS_LAPANGAN" ? "Petugas" : "Warga + Petugas"})
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="font-semibold">Hijau = Realisasi Kepatuhan Pemilahan (Aktivitas Warga Vision AI)</span>
          </div>
        </div>
        <span className="italic text-[11px] text-slate-400">
          *Hierarki pembacaan: Evaluasi angka rekapitulasi pada tabel di atas, lalu telaah tren komparasi visual pada kedua grafik di atas.
        </span>
      </div>
    </div>
  );
};

export default WasteImpactTrendChart;
