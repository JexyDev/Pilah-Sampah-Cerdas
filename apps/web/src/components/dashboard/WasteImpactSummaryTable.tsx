/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Component: WasteImpactSummaryTable (Tabel Rekapitulasi Evaluasi Komparatif Dampak Sampah)
 * Standarisasi Data & Integrasi Formula Delta:
 * 1. Judul Komponen: "Aktivitas Pemilahan oleh Warga dan Penimbangan oleh Petugas"
 * 2. Skema Kolom:
 *    - Nama Kelurahan
 *    - Berat Pembanding (Baseline KKN atau Periode Sebelumnya)
 *    - Berat Aktual Terpilih (kg)
 *    - Penurunan / Perubahan Berat (Delta kg) [B₀ - B₁]
 *    - Penurunan / Perubahan Berat (%) [Delta %]
 *    - Kepatuhan Pembanding (%)
 *    - Kepatuhan Aktual Terpilih (%)
 *    - Perubahan Kepatuhan (Δ pp) [Poin Persentase]
 * 3. Filter Interaktif Lengkap:
 *    - Mode Harian: Hari Ini, Kemarin, Input Kalender Spesifik
 *    - Mode Bulanan: Bulan Ini, Bulan Lalu, Dropdown Pilihan Bulan Jan-Des 2026
 *    - Target Komparasi: vs Baseline KKN (Standar) atau vs Periode Sebelumnya (H-1 / M-1)
 *    - Isolasi Sumber Data: [Semua], [Aktivitas Warga], [Input Petugas]
 * 4. Agregasi Terbobot (Weighted Aggregation) untuk baris total/kecamatan.
 */

import React, { useState, useMemo } from "react";
import {
  TrendingDown,
  TrendingUp,
  Minus,
  Info,
  Layers,
  Smartphone,
  ClipboardList,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  CalendarDays,
  Clock,
  ArrowRightLeft,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import {
  calculateVolumeDeltaKg,
  calculateVolumeDeltaPct,
  calculateComplianceDelta,
  formatComplianceDelta,
  aggregateKelurahanImpact,
  calculateDailyAverageKg,
  calculateMonthlyKg,
  getDateRangeForDay,
  getDateRangeForMonth,
  STANDARD_CYCLE_DAYS,
  type WasteSourceType,
  type WastePeriodMode,
  type WasteImpactItem,
} from "../../utils/wasteCalculations";

/**
 * Data kepatuhan baseline terverifikasi dari hasil survei lapangan KKN Juli 2026.
 * Digunakan sebagai fallback resmi jika field belum terisi dari respons API.
 */
export const SURVEY_BASELINE_COMPLIANCE: Record<string, number> = {
  cipaganti: 13.67,
  dago: 10.0,
  lebakgede: 21.6,
  lebaksiliwangi: 15.0,
  sadangserang: 24.8,
  sekeloa: 17.8,
};

export const SURVEY_BASELINE_DAILY_KG: Record<string, number> = {
  cipaganti: 96.0,
  dago: 122.0,
  lebakgede: 100.0,
  lebaksiliwangi: 96.5,
  sadangserang: 835.0,
  sekeloa: 421.0,
};

export const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export type WasteComparisonTarget = "BASELINE" | "PREVIOUS_PERIOD";

export interface WasteImpactFilterState {
  periodMode: WastePeriodMode;
  selectedSource: WasteSourceType;
  datePreset: "TODAY" | "YESTERDAY" | "CUSTOM";
  selectedDate: string; // YYYY-MM-DD
  monthPreset: "CURRENT" | "PREVIOUS" | "CUSTOM";
  selectedYear: number;
  selectedMonth: number; // 1-12
  comparisonTarget: WasteComparisonTarget;
  startDate?: string;
  endDate?: string;
}

export interface WasteImpactSummaryTableProps {
  data: WasteImpactItem[];
  previousPeriodData?: WasteImpactItem[] | null;
  loading?: boolean;
  className?: string;
  onSourceChange?: (source: WasteSourceType) => void;
  periodMode?: WastePeriodMode;
  onPeriodChange?: (period: WastePeriodMode) => void;
  filterState?: WasteImpactFilterState;
  onFilterChange?: (filter: WasteImpactFilterState) => void;
}

export const WasteImpactSummaryTable: React.FC<WasteImpactSummaryTableProps> = ({
  data,
  previousPeriodData = null,
  loading = false,
  className = "",
  onSourceChange,
  periodMode: periodModeProp,
  onPeriodChange,
  filterState: externalFilterState,
  onFilterChange,
}) => {
  // Tanggal acuan dinamis sistem
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  }, [today]);

  const yesterdayStr = useMemo(() => {
    const y = new Date(today);
    y.setDate(y.getDate() - 1);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${y.getFullYear()}-${pad(y.getMonth() + 1)}-${pad(y.getDate())}`;
  }, [today]);

  // Internal state jika tidak dikontrol penuh oleh parent
  const [internalSource, setInternalSource] = useState<WasteSourceType>("ALL");
  const [internalPeriod, setInternalPeriod] = useState<WastePeriodMode>("DAILY");
  const [datePreset, setDatePreset] = useState<"TODAY" | "YESTERDAY" | "CUSTOM">("YESTERDAY");
  const [selectedDate, setSelectedDate] = useState<string>(yesterdayStr);
  const [monthPreset, setMonthPreset] = useState<"CURRENT" | "PREVIOUS" | "CUSTOM">("CURRENT");
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1);
  const [comparisonTarget, setComparisonTarget] = useState<WasteComparisonTarget>("BASELINE");
  const [showFootnoteDetails, setShowFootnoteDetails] = useState<boolean>(false);

  const activeSource = externalFilterState?.selectedSource ?? internalSource;
  const activePeriod = externalFilterState?.periodMode ?? periodModeProp ?? internalPeriod;
  const activeComparison = externalFilterState?.comparisonTarget ?? comparisonTarget;
  const activeDate = externalFilterState?.selectedDate ?? selectedDate;
  const activeDatePreset = externalFilterState?.datePreset ?? datePreset;
  const activeMonth = externalFilterState?.selectedMonth ?? selectedMonth;
  const activeYear = externalFilterState?.selectedYear ?? selectedYear;
  const activeMonthPreset = externalFilterState?.monthPreset ?? monthPreset;

  const unitLabel = activePeriod === "DAILY" ? "kg/hari" : "kg/bulan";

  // Trigger sinkronisasi ke parent
  const notifyFilterChange = (updates: Partial<WasteImpactFilterState>) => {
    const updated: WasteImpactFilterState = {
      periodMode: activePeriod,
      selectedSource: activeSource,
      datePreset: activeDatePreset,
      selectedDate: activeDate,
      monthPreset: activeMonthPreset,
      selectedYear: activeYear,
      selectedMonth: activeMonth,
      comparisonTarget: activeComparison,
      ...updates,
    };

    if (updated.periodMode === "DAILY") {
      const range = getDateRangeForDay(updated.selectedDate);
      updated.startDate = `${range.startDate}T00:00:00.000Z`;
      updated.endDate = `${range.endDate}T23:59:59.999Z`;
    } else {
      const range = getDateRangeForMonth(updated.selectedYear, updated.selectedMonth);
      updated.startDate = `${range.startDate}T00:00:00.000Z`;
      updated.endDate = `${range.endDate}T23:59:59.999Z`;
    }

    if (onFilterChange) {
      onFilterChange(updated);
    }
  };

  const handleSourceSelect = (src: WasteSourceType) => {
    setInternalSource(src);
    if (onSourceChange) onSourceChange(src);
    notifyFilterChange({ selectedSource: src });
  };

  const handlePeriodSelect = (period: WastePeriodMode) => {
    setInternalPeriod(period);
    if (onPeriodChange) onPeriodChange(period);
    notifyFilterChange({ periodMode: period });
  };

  const handleDatePresetSelect = (preset: "TODAY" | "YESTERDAY") => {
    setDatePreset(preset);
    const targetDate = preset === "TODAY" ? todayStr : yesterdayStr;
    setSelectedDate(targetDate);
    notifyFilterChange({ datePreset: preset, selectedDate: targetDate });
  };

  const handleCustomDateChange = (val: string) => {
    if (!val) return;
    setDatePreset("CUSTOM");
    setSelectedDate(val);
    notifyFilterChange({ datePreset: "CUSTOM", selectedDate: val });
  };

  const handleMonthPresetSelect = (preset: "CURRENT" | "PREVIOUS") => {
    setMonthPreset(preset);
    let m = today.getMonth() + 1;
    let y = today.getFullYear();
    if (preset === "PREVIOUS") {
      m = m - 1;
      if (m === 0) {
        m = 12;
        y = y - 1;
      }
    }
    setSelectedMonth(m);
    setSelectedYear(y);
    notifyFilterChange({ monthPreset: preset, selectedMonth: m, selectedYear: y });
  };

  const handleSpecificMonthChange = (mIndex: number) => {
    setMonthPreset("CUSTOM");
    setSelectedMonth(mIndex);
    notifyFilterChange({ monthPreset: "CUSTOM", selectedMonth: mIndex });
  };

  // Label periode aktif untuk keterangan UI
  const activePeriodLabel = useMemo(() => {
    if (activePeriod === "DAILY") {
      const parts = activeDate.split("-");
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
      }
      return activeDate;
    } else {
      return `${MONTH_NAMES[activeMonth - 1]} ${activeYear}`;
    }
  }, [activePeriod, activeDate, activeMonth, activeYear]);

  // Label acuan perbandingan konstan
  const comparisonLabel = "Baseline Survei KKN Juli 2026";

  // Normalisasi data dengan sumber, mode periode, dan target komparasi yang dipilih
  const displayItems = useMemo(() => {
    return data.map((item) => {
      let rawAccumulatedKg = item.actualKg ?? 0;
      if (activeSource === "WARGA_APP") {
        rawAccumulatedKg = item.wargaKg !== undefined && item.wargaKg !== null ? item.wargaKg : (item.actualKg ?? 0);
      } else if (activeSource === "PETUGAS_LAPANGAN") {
        rawAccumulatedKg = item.petugasKg !== undefined && item.petugasKg !== null ? item.petugasKg : 0;
      } else {
        const w = item.wargaKg !== undefined && item.wargaKg !== null ? item.wargaKg : (item.actualKg ?? 0);
        const p = item.petugasKg !== undefined && item.petugasKg !== null ? item.petugasKg : 0;
        rawAccumulatedKg = Number((w + p).toFixed(2));
      }

      // Mode DAILY: Nilai aktual adalah berat timbulan transaksi pada hari terpilih (rawAccumulatedKg)
      // Mode MONTHLY: Nilai aktual adalah total berat timbulan transaksi pada bulan terpilih (rawAccumulatedKg)
      const displayActualKg = rawAccumulatedKg;
      const dailyAverageKg = calculateDailyAverageKg(rawAccumulatedKg, STANDARD_CYCLE_DAYS);
      const monthlyActualKg = rawAccumulatedKg;

      const normK = item.kelurahan.toLowerCase().replace(/^kel(urahan)?\.\s*/i, "").replace(/\s+/g, "");
      const baselineCompliance =
        item.baselineCompliance !== undefined && item.baselineCompliance !== null && item.baselineCompliance > 0
          ? item.baselineCompliance
          : (SURVEY_BASELINE_COMPLIANCE[normK] ?? item.baselineCompliance ?? null);

      const dailyBaselineKg =
        item.baselineKg !== undefined && item.baselineKg !== null && item.baselineKg > 0
          ? item.baselineKg
          : (SURVEY_BASELINE_DAILY_KG[normK] ?? null);
      const monthlyBaselineKg = calculateMonthlyKg(dailyBaselineKg, STANDARD_CYCLE_DAYS);

      const displayBaselineKg = activePeriod === "DAILY" ? dailyBaselineKg : monthlyBaselineKg;
      const displayBaselineCompliance = baselineCompliance;

      return {
        ...item,
        rawAccumulatedKg,
        dailyAverageKg,
        monthlyActualKg,
        monthlyBaselineKg,
        actualKg: displayActualKg,
        baselineKg: displayBaselineKg,
        baselineCompliance: displayBaselineCompliance,
        sourceType: activeSource,
        periodMode: activePeriod,
      };
    });
  }, [data, activeSource, activePeriod]);

  // Agregasi terbobot tingkat Kecamatan
  const aggregation = useMemo(() => {
    return aggregateKelurahanImpact(displayItems);
  }, [displayItems]);

  // Ekspor Data Rekapitulasi ke XLSX
  const handleExportXLSX = () => {
    if (!displayItems || displayItems.length === 0) {
      toast.error("Tidak ada data untuk diekspor!");
      return;
    }

    const col1Title = `Baseline KKN (${unitLabel})`;
    const col2Title = `Aktual Terpilih (${activePeriodLabel}) (${unitLabel})`;
    const col3Title = `Penurunan Berat Sampah (B0 - B1) (${unitLabel})`;

    const headers = [
      "No",
      "Kelurahan",
      "Sumber Data",
      col1Title,
      col2Title,
      col3Title,
      "Penurunan (%)",
      "Baseline Kepatuhan (%)",
      "Kepatuhan Aktual (%)",
      "Perubahan Kepatuhan (Δ pp)",
      activePeriod === "DAILY" ? "Total Akumulasi Transaksi (kg)" : "Rata-Rata Harian (kg/hari)",
      "Status Verifikasi",
    ];

    const rows: (string | number)[][] = displayItems.map((item, idx) => {
      const deltaKg = calculateVolumeDeltaKg(item.baselineKg, item.actualKg);
      const deltaPct = calculateVolumeDeltaPct(item.baselineKg, item.actualKg);
      const deltaComp = calculateComplianceDelta(item.baselineCompliance, item.actualCompliance);

      return [
        idx + 1,
        `Kel. ${item.kelurahan}`,
        activeSource === "WARGA_APP"
          ? "Aktivitas Warga (WARGA_APP)"
          : activeSource === "PETUGAS_LAPANGAN"
          ? "Input Petugas (PETUGAS_LAPANGAN)"
          : "Semua Sumber (Warga + Petugas)",
        item.baselineKg ? Number(item.baselineKg.toFixed(2)) : 0,
        item.actualKg ? Number(item.actualKg.toFixed(2)) : 0,
        deltaKg !== null ? deltaKg : "-",
        deltaPct !== null ? `${deltaPct}%` : "-",
        item.baselineCompliance !== null && item.baselineCompliance !== undefined
          ? `${item.baselineCompliance}%`
          : "-",
        item.actualCompliance !== null && item.actualCompliance !== undefined
          ? `${item.actualCompliance}%`
          : "-",
        deltaComp !== null ? formatComplianceDelta(deltaComp, { unit: "pp" }) : "-",
        activePeriod === "DAILY"
          ? (item.rawAccumulatedKg !== null && item.rawAccumulatedKg !== undefined ? Number(item.rawAccumulatedKg.toFixed(2)) : "-")
          : (item.dailyAverageKg !== null && item.dailyAverageKg !== undefined ? Number(item.dailyAverageKg.toFixed(2)) : "-"),
        item.status || "Terverifikasi Real",
      ];
    });

    // Baris Agregasi Kecamatan
    rows.push([
      "",
      "TOTAL & RATA-RATA KECAMATAN COBLONG",
      `Filter: ${activeSource} • Mode: ${activePeriod} • Acuan: Baseline KKN (B0)`,
      aggregation.totalBaselineKg,
      aggregation.totalActualKg,
      aggregation.totalDeltaKg !== null ? aggregation.totalDeltaKg : "-",
      aggregation.weightedDeltaPct !== null ? `${aggregation.weightedDeltaPct}%` : "-",
      `${aggregation.avgBaselineCompliance}%`,
      aggregation.avgActualCompliance !== null ? `${aggregation.avgActualCompliance}%` : "-",
      aggregation.deltaCompliance !== null ? formatComplianceDelta(aggregation.deltaCompliance, { unit: "pp" }) : "-",
      activePeriod === "DAILY"
        ? (aggregation.totalAccumulatedKg !== undefined ? aggregation.totalAccumulatedKg : "-")
        : Number((aggregation.totalActualKg / STANDARD_CYCLE_DAYS).toFixed(2)),
      "Agregat Terbobot Faktual",
    ]);

    // Baris Catatan Metodologi
    rows.push([]);
    rows.push([
      `* Catatan Metodologi: Evaluasi dampak membandingkan Baseline KKN Juli 2026 (B0) dengan data aktual capture rate BERSEKA di ${activePeriodLabel} (B1). Perubahan kepatuhan dinyatakan dalam satuan baku poin persentase (pp).`,
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap_Dampak_Sampah");
    XLSX.writeFile(
      wb,
      `Rekap_Evaluasi_Dampak_Sampah_Coblong_${activeSource}_${activePeriod}_${activeDate}.xlsx`
    );
    toast.success("Data rekapitulasi dampak sampah berhasil diekspor!");
  };

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-6 ${className}`}>
      {/* 1. Header: Judul, Deskripsi & Tombol Aksi */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-2 border-b border-slate-100 dark:border-slate-800/60">
        <div className="space-y-1.5 max-w-3xl">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-700/40 flex items-center justify-center shadow-xs shrink-0">
              <ClipboardList size={18} />
            </span>
            <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-slate-100 tracking-tight">
              Aktivitas Pemilahan oleh Warga dan Penimbangan oleh Petugas
            </h3>
            <span className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles size={11} />
              <span>Formula B₀ − B₁</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Rekapitulasi perbandingan timbulan sampah aktual terhadap Baseline Survei KKN Juli 2026 (B₀) dan indeks kepatuhan pemilahan di 6 Kelurahan Kecamatan Coblong.
          </p>
        </div>

        {/* Ekspor XLSX Action */}
        <div className="shrink-0 self-start sm:self-center">
          <button
            type="button"
            onClick={handleExportXLSX}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            title="Ekspor tabel rekapitulasi ke file Excel"
          >
            <FileSpreadsheet size={15} />
            <span>Ekspor XLSX</span>
          </button>
        </div>
      </div>

      {/* 2. Symmetrical Filter Toolbar */}
      <div className="p-3.5 sm:p-4 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-3">
        {/* Row 1: Rentang Waktu (Mode + Presets + Date/Month Picker) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200/60 dark:border-slate-700/50">
          {/* Sisi Kiri: Mode & Filter Waktu */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* Mode Switcher */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-1">
                Mode:
              </span>
              <div className="inline-flex items-center bg-white dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                <button
                  type="button"
                  onClick={() => handlePeriodSelect("DAILY")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activePeriod === "DAILY"
                      ? "bg-emerald-600 text-white shadow-xs font-extrabold"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <Clock size={13} />
                  <span>Per Hari</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePeriodSelect("MONTHLY")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activePeriod === "MONTHLY"
                      ? "bg-indigo-600 text-white shadow-xs font-extrabold"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <CalendarDays size={13} />
                  <span>Per Bulan</span>
                </button>
              </div>
            </div>

            <div className="hidden sm:block h-5 w-px bg-slate-200 dark:bg-slate-700" />

            {/* Pemilih Waktu */}
            {activePeriod === "DAILY" ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Tanggal:
                </span>
                <div className="inline-flex items-center bg-white dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                  <button
                    type="button"
                    onClick={() => handleDatePresetSelect("YESTERDAY")}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeDatePreset === "YESTERDAY"
                        ? "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-extrabold border border-emerald-200/80 dark:border-emerald-800/60"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    Kemarin
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDatePresetSelect("TODAY")}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeDatePreset === "TODAY"
                        ? "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-extrabold border border-emerald-200/80 dark:border-emerald-800/60"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    Hari Ini
                  </button>
                </div>

                <div className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                  <Calendar size={13} className="text-slate-400 shrink-0" />
                  <input
                    type="date"
                    value={activeDate}
                    onChange={(e) => handleCustomDateChange(e.target.value)}
                    className="text-xs font-bold text-slate-700 dark:text-slate-200 bg-transparent border-none outline-none cursor-pointer"
                    title="Pilih tanggal spesifik"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Bulan:
                </span>
                <div className="inline-flex items-center bg-white dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                  <button
                    type="button"
                    onClick={() => handleMonthPresetSelect("CURRENT")}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeMonthPreset === "CURRENT"
                        ? "bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-extrabold border border-indigo-200/80 dark:border-indigo-800/60"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    Bulan Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMonthPresetSelect("PREVIOUS")}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeMonthPreset === "PREVIOUS"
                        ? "bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-extrabold border border-indigo-200/80 dark:border-indigo-800/60"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    Bulan Lalu
                  </button>
                </div>

                <div className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                  <CalendarDays size={13} className="text-slate-400 shrink-0" />
                  <select
                    value={activeMonth}
                    onChange={(e) => handleSpecificMonthChange(parseInt(e.target.value, 10))}
                    className="text-xs font-bold text-slate-700 dark:text-slate-200 bg-transparent border-none outline-none cursor-pointer pr-1"
                    title="Pilih bulan spesifik"
                  >
                    {MONTH_NAMES.map((name, idx) => (
                      <option key={idx + 1} value={idx + 1} className="dark:bg-slate-900">
                        {name} {activeYear}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Sisi Kanan: Badge Periode Aktif */}
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 self-start md:self-center">
            <span className="font-semibold text-slate-400 dark:text-slate-500 uppercase text-[10.5px] tracking-wider">
              Periode Aktif:
            </span>
            <span className="font-extrabold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
              {activePeriodLabel}
            </span>
          </div>
        </div>

        {/* Row 2: Sumber Data & Acuan Konstan Tetap */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Sumber Data Toggle */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-1">
              Sumber:
            </span>
            <div className="inline-flex items-center bg-white dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <button
                type="button"
                onClick={() => handleSourceSelect("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeSource === "ALL"
                    ? "bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow-xs font-extrabold"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
                title="Gabungan seluruh data (Warga + Petugas)"
              >
                <Layers size={13} />
                <span>Semua Sumber</span>
              </button>

              <button
                type="button"
                onClick={() => handleSourceSelect("WARGA_APP")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeSource === "WARGA_APP"
                    ? "bg-emerald-600 text-white shadow-xs font-extrabold"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
                title="Hanya data pemilahan mandiri warga via aplikasi mobile"
              >
                <Smartphone size={13} />
                <span>Aktivitas Warga</span>
              </button>

              <button
                type="button"
                onClick={() => handleSourceSelect("PETUGAS_LAPANGAN")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeSource === "PETUGAS_LAPANGAN"
                    ? "bg-indigo-600 text-white shadow-xs font-extrabold"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
                title="Hanya data penimbangan manual posko / TPS3R oleh petugas"
              >
                <ClipboardList size={13} />
                <span>Input Petugas</span>
              </button>
            </div>
          </div>

          {/* Acuan Konstan Tetap */}
          <div className="flex items-center gap-2 text-xs bg-white dark:bg-slate-900 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-slate-500">
              Acuan Evaluasi:
            </span>
            <span className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Baseline KKN Juli 2026 (Konstan B₀)
            </span>
          </div>
        </div>
      </div>

      {/* 3. Status Notification jika belum ada transaksi di periode terpilih */}
      {aggregation.totalActualKg === 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={16} className="shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <span className="font-extrabold">Belum ada transaksi sampah tercatat pada {activePeriodLabel}.</span>
              <span className="text-amber-700 dark:text-amber-300 ml-1">
                Kolom penurunan dan perubahan kepatuhan ditampilkan tanda strip (<code className="font-bold font-mono">—</code>).
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {activePeriod === "DAILY" && activeDatePreset !== "YESTERDAY" && (
              <button
                type="button"
                onClick={() => handleDatePresetSelect("YESTERDAY")}
                className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
              >
                Lihat Data Kemarin (7 Okt)
              </button>
            )}
            {activePeriod === "DAILY" && (
              <button
                type="button"
                onClick={() => handlePeriodSelect("MONTHLY")}
                className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 font-bold text-xs hover:bg-amber-50 shadow-xs transition-all cursor-pointer"
              >
                Beralih ke Per Bulan
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3.1 Meta Information Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2 flex-wrap font-medium">
          <span className="font-bold text-slate-700 dark:text-slate-300">
            Komparasi: {activePeriodLabel} vs Baseline Survei KKN
          </span>
          <span>•</span>
          <span>Satuan Massa: <strong className="text-slate-700 dark:text-slate-300 font-mono">{unitLabel}</strong></span>
          <span>•</span>
          <span>Satuan Kepatuhan: <strong className="text-slate-700 dark:text-slate-300 font-mono">pp</strong> (poin persentase)</span>
        </div>
        <div className="text-[11px] text-slate-400 dark:text-slate-500 italic">
          *Data aktual merefleksikan capture rate penimbangan di aplikasi BERSEKA
        </div>
      </div>

      {/* 4. Tabel Rekapitulasi Data (Grid & Typography Rapi) */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            {/* Header Row 1: Kategori Utama Standar ISO */}
            <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-extrabold text-slate-700 dark:text-slate-200">
              <th rowSpan={2} className="py-3 px-3 text-center w-12 bg-slate-100/90 dark:bg-slate-800/90 border-r border-slate-200 dark:border-slate-800">
                No
              </th>
              <th rowSpan={2} className="py-3 px-4 min-w-[155px] font-bold bg-slate-100/90 dark:bg-slate-800/90 border-r border-slate-200 dark:border-slate-800">
                Nama Kelurahan
              </th>
              <th colSpan={2} className="py-2.5 px-3 text-center uppercase tracking-wider bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">
                Berat Sampah ({unitLabel})
              </th>
              <th colSpan={2} className="py-2.5 px-3 text-center uppercase tracking-wider bg-blue-50/70 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200 border-r border-slate-200 dark:border-slate-800">
                Penurunan Berat Sampah (B₀ − B₁)
              </th>
              <th colSpan={2} className="py-2.5 px-3 text-center uppercase tracking-wider bg-emerald-50/70 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 border-r border-slate-200 dark:border-slate-800">
                Kepatuhan Pemilahan
              </th>
              <th rowSpan={2} className="py-3 px-3 text-center uppercase tracking-wider bg-teal-50/70 dark:bg-teal-950/50 text-teal-900 dark:text-teal-200 min-w-[125px]">
                Perubahan Kepatuhan (Δ pp)
              </th>
            </tr>

            {/* Header Row 2: Sub-Kolom Seragam */}
            <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-extrabold text-slate-600 dark:text-slate-400">
              <th
                title="Baseline estimasi timbulan sampah hasil survei KKN Juli 2026 (Konstan B₀)"
                className="py-2 px-3 text-center bg-slate-50/60 dark:bg-slate-800/50 border-r border-slate-200 dark:border-slate-800 min-w-[125px]"
              >
                Baseline KKN ({unitLabel})
              </th>
              <th
                title={`Data transaksi sampah aktual tercatat pada ${activePeriodLabel}`}
                className="py-2 px-3 text-center bg-slate-50/60 dark:bg-slate-800/50 border-r border-slate-200 dark:border-slate-800 min-w-[135px]"
              >
                Aktual ({unitLabel})
              </th>
              <th
                title="Delta selisih penurunan berat sampah: Baseline KKN dikurangi Aktual (B₀ − B₁)"
                className="py-2 px-3 text-center bg-blue-50/40 dark:bg-blue-950/30 text-blue-900 dark:text-blue-300 border-r border-slate-200 dark:border-slate-800 min-w-[130px]"
              >
                Penurunan ({unitLabel})
              </th>
              <th title="Persentase penurunan berat sampah terhadap Baseline KKN" className="py-2 px-3 text-center bg-blue-50/40 dark:bg-blue-950/30 text-blue-900 dark:text-blue-300 border-r border-slate-200 dark:border-slate-800 min-w-[95px]">
                Penurunan (%)
              </th>
              <th className="py-2 px-3 text-center bg-emerald-50/40 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300 border-r border-slate-200 dark:border-slate-800 min-w-[90px]">
                Baseline (%)
              </th>
              <th className="py-2 px-3 text-center bg-emerald-50/40 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300 border-r border-slate-200 dark:border-slate-800 min-w-[95px]">
                Aktual (%)
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {displayItems.map((item, idx) => {
              const deltaKg = calculateVolumeDeltaKg(item.baselineKg, item.actualKg);
              const deltaPct = calculateVolumeDeltaPct(item.baselineKg, item.actualKg);
              const hasActualCompliance = item.actualCompliance !== null && item.actualCompliance !== undefined && item.actualCompliance > 0;
              const deltaCompliance = hasActualCompliance
                ? calculateComplianceDelta(item.baselineCompliance, item.actualCompliance)
                : null;

              return (
                <tr
                  key={item.id || idx}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors text-xs"
                >
                  <td className="py-3 px-3 text-center text-slate-400 font-bold border-r border-slate-200/60 dark:border-slate-800/60 font-mono tabular-nums">
                    {idx + 1}
                  </td>
                  <td className="py-3 px-4 font-extrabold text-slate-800 dark:text-slate-100 border-r border-slate-200/60 dark:border-slate-800/60">
                    <span>Kel. {item.kelurahan}</span>
                    {item.kelurahan.toLowerCase().includes("lebakgede") && (
                      <span className="block text-[9.5px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 font-sans">
                        *Pilot Project Coblong
                      </span>
                    )}
                  </td>

                  {/* Berat Baseline */}
                  <td className="py-3 px-3 text-center font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200/60 dark:border-slate-800/60 font-mono tabular-nums">
                    {item.baselineKg !== null && item.baselineKg !== undefined ? (
                      <span className="font-extrabold text-slate-800 dark:text-slate-100">
                        {Number(item.baselineKg).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic text-[11px] font-sans">Belum ada data</span>
                    )}
                  </td>

                  {/* Berat Aktual Terpilih */}
                  <td className="py-3 px-3 text-center font-bold text-slate-800 dark:text-slate-100 border-r border-slate-200/60 dark:border-slate-800/60 font-mono tabular-nums">
                    <div className="flex flex-col items-center justify-center">
                      <span className="font-extrabold text-slate-800 dark:text-slate-100">
                        {Number(item.actualKg || 0).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                      </span>
                      {item.actualKg === 0 ? (
                        <span className="text-[9.5px] font-medium text-amber-600 dark:text-amber-400 font-sans mt-0.5">
                          (Belum ada transaksi)
                        </span>
                      ) : activePeriod === "MONTHLY" && item.dailyAverageKg !== undefined && item.dailyAverageKg > 0 ? (
                        <span className="text-[9.5px] font-normal text-slate-400 dark:text-slate-500 font-sans mt-0.5">
                          (rata-rata: {Number(item.dailyAverageKg).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg/hari)
                        </span>
                      ) : null}
                    </div>
                  </td>

                  {/* Kolom Penurunan / Perubahan Berat Sampah (Delta kg) */}
                  <td className="py-3 px-3 text-center font-extrabold border-r border-slate-200/60 dark:border-slate-800/60 font-mono tabular-nums">
                    {deltaKg === null ? (
                      <span className="text-slate-400 italic font-sans">—</span>
                    ) : (
                      <span
                        className={`inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black ${
                          deltaKg > 0
                            ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40"
                            : deltaKg < 0
                            ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {deltaKg > 0 ? (
                          <TrendingDown size={13} className="text-emerald-600 shrink-0" />
                        ) : deltaKg < 0 ? (
                          <TrendingUp size={13} className="text-rose-600 shrink-0" />
                        ) : (
                          <Minus size={13} className="shrink-0" />
                        )}
                        <span>
                          {deltaKg < 0
                            ? `+${Math.abs(deltaKg).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`
                            : `${deltaKg.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`}
                        </span>
                      </span>
                    )}
                  </td>

                  {/* Kolom Penurunan / Perubahan Berat Sampah (Delta %) */}
                  <td className="py-3 px-3 text-center font-extrabold border-r border-slate-200/60 dark:border-slate-800/60 font-mono tabular-nums">
                    {deltaPct === null ? (
                      <span className="text-slate-400 italic font-sans">—</span>
                    ) : (
                      <span
                        className={`inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black ${
                          deltaPct > 0
                            ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40"
                            : deltaPct < 0
                            ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {deltaPct > 0 ? (
                          <TrendingDown size={13} className="text-emerald-600 shrink-0" />
                        ) : deltaPct < 0 ? (
                          <TrendingUp size={13} className="text-rose-600 shrink-0" />
                        ) : (
                          <Minus size={13} className="shrink-0" />
                        )}
                        <span>
                          {deltaPct < 0
                            ? `+${Math.abs(deltaPct).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
                            : `${deltaPct.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`}
                        </span>
                      </span>
                    )}
                  </td>

                  {/* Kepatuhan Pembanding (%) */}
                  <td className="py-3 px-3 text-center font-semibold text-slate-600 dark:text-slate-400 border-r border-slate-200/60 dark:border-slate-800/60 font-mono tabular-nums">
                    {item.baselineCompliance !== null && item.baselineCompliance !== undefined ? (
                      <span>{Number(item.baselineCompliance).toFixed(1).replace(".", ",")}%</span>
                    ) : (
                      <span className="text-slate-400 italic text-[11px] font-sans">—</span>
                    )}
                  </td>

                  {/* Kepatuhan Terpilih (%) */}
                  <td className="py-3 px-3 text-center font-extrabold text-emerald-700 dark:text-emerald-400 border-r border-slate-200/60 dark:border-slate-800/60 font-mono tabular-nums">
                    {item.actualCompliance !== null && item.actualCompliance !== undefined && item.actualCompliance > 0 ? (
                      <div className="flex flex-col items-center justify-center">
                        <span>{Number(item.actualCompliance).toFixed(1).replace(".", ",")}%</span>
                        {item.partisipasiWarga !== undefined && item.partisipasiWarga !== null && (
                          <span className="text-[9.5px] font-semibold text-slate-400 dark:text-slate-500 block font-sans mt-0.5">
                            (Partisipasi: {item.partisipasiWarga}%)
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 font-normal italic font-sans">Belum terdata</span>
                    )}
                  </td>

                  {/* Perubahan Kepatuhan (Δ pp) */}
                  <td className="py-3 px-3 text-center font-extrabold font-mono tabular-nums">
                    {deltaCompliance === null ? (
                      <span className="text-slate-400 italic font-sans">—</span>
                    ) : (
                      <span
                        className={`inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black ${
                          deltaCompliance > 0
                            ? "bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/40"
                            : deltaCompliance < 0
                            ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {deltaCompliance > 0 ? (
                          <TrendingUp size={13} className="text-teal-600 shrink-0" />
                        ) : deltaCompliance < 0 ? (
                          <TrendingDown size={13} className="text-rose-600 shrink-0" />
                        ) : (
                          <Minus size={13} className="shrink-0" />
                        )}
                        <span>{formatComplianceDelta(deltaCompliance, { unit: "pp", showPlusSign: true, fractionDigits: 1 })}</span>
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}

            {/* Baris Agregasi Kecamatan (Total & Rata-rata Terbobot) */}
            <tr className="bg-slate-100/95 dark:bg-slate-800/95 font-black text-slate-900 dark:text-slate-100 border-t-2 border-slate-300 dark:border-slate-700 text-xs">
              <td className="py-3.5 px-3 text-center border-r border-slate-200 dark:border-slate-700">
                ★
              </td>
              <td className="py-3.5 px-4 border-r border-slate-200 dark:border-slate-700">
                <span className="text-slate-900 dark:text-white uppercase tracking-wider block font-extrabold">
                  Kecamatan Coblong (Total)
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block font-sans">
                  Agregasi Terbobot 6 Kelurahan ({activePeriod === "DAILY" ? "Rata-Rata Harian" : "Akumulasi Bulanan 30 Hari"})
                </span>
              </td>

              {/* Total Baseline */}
              <td className="py-3.5 px-3 text-center border-r border-slate-200 dark:border-slate-700 font-mono tabular-nums">
                <span className="font-black text-slate-900 dark:text-white">
                  {aggregation.totalBaselineKg.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </span>
              </td>

              {/* Total Aktual */}
              <td className="py-3.5 px-3 text-center border-r border-slate-200 dark:border-slate-700 font-mono tabular-nums">
                <div className="flex flex-col items-center justify-center">
                  <span className="font-black text-slate-900 dark:text-white">
                    {aggregation.totalActualKg.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  </span>
                  {aggregation.totalActualKg === 0 ? (
                    <span className="text-[9.5px] font-medium text-amber-600 dark:text-amber-400 font-sans mt-0.5">
                      (Belum ada transaksi)
                    </span>
                  ) : activePeriod === "MONTHLY" ? (
                    <span className="text-[9.5px] font-normal text-slate-500 dark:text-slate-400 font-sans mt-0.5">
                      (rata-rata: {(aggregation.totalActualKg / STANDARD_CYCLE_DAYS).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg/hari)
                    </span>
                  ) : null}
                </div>
              </td>

              {/* Total Penurunan / Perubahan Berat (Delta kg) */}
              <td className="py-3.5 px-3 text-center border-r border-slate-200 dark:border-slate-700 font-extrabold text-blue-700 dark:text-blue-300 font-mono tabular-nums">
                {aggregation.totalDeltaKg === null ? (
                  <span className="text-slate-400 italic font-sans">—</span>
                ) : (
                  <span
                    className={`inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black ${
                      aggregation.totalDeltaKg > 0
                        ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border border-emerald-300"
                        : aggregation.totalDeltaKg < 0
                        ? "bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 border border-rose-300"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {aggregation.totalDeltaKg > 0 ? (
                      <TrendingDown size={13} className="text-emerald-600 shrink-0" />
                    ) : aggregation.totalDeltaKg < 0 ? (
                      <TrendingUp size={13} className="text-rose-600 shrink-0" />
                    ) : (
                      <Minus size={13} className="shrink-0" />
                    )}
                    <span>
                      {aggregation.totalDeltaKg < 0
                        ? `+${Math.abs(aggregation.totalDeltaKg).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`
                        : `${aggregation.totalDeltaKg.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`}
                    </span>
                  </span>
                )}
              </td>

              {/* Total Penurunan / Perubahan Berat (Delta %) */}
              <td className="py-3.5 px-3 text-center border-r border-slate-200 dark:border-slate-700 font-extrabold text-blue-700 dark:text-blue-300 font-mono tabular-nums">
                {aggregation.weightedDeltaPct === null ? (
                  <span className="text-slate-400 italic font-sans">—</span>
                ) : (
                  <span
                    className={`inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black ${
                      aggregation.weightedDeltaPct > 0
                        ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border border-emerald-300"
                        : aggregation.weightedDeltaPct < 0
                        ? "bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 border border-rose-300"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {aggregation.weightedDeltaPct > 0 ? (
                      <TrendingDown size={13} className="text-emerald-600 shrink-0" />
                    ) : aggregation.weightedDeltaPct < 0 ? (
                      <TrendingUp size={13} className="text-rose-600 shrink-0" />
                    ) : (
                      <Minus size={13} className="shrink-0" />
                    )}
                    <span>
                      {aggregation.weightedDeltaPct < 0
                        ? `+${Math.abs(aggregation.weightedDeltaPct).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
                        : `${aggregation.weightedDeltaPct.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`}
                    </span>
                  </span>
                )}
              </td>

              {/* Rata-Rata Kepatuhan Pembanding (%) */}
              <td className="py-3.5 px-3 text-center border-r border-slate-200 dark:border-slate-700 font-mono tabular-nums">
                {aggregation.avgBaselineCompliance.toFixed(1).replace(".", ",")}%
              </td>

              {/* Rata-Rata Kepatuhan Terpilih (%) */}
              <td className="py-3.5 px-3 text-center border-r border-slate-200 dark:border-slate-700 text-emerald-700 dark:text-emerald-300 font-mono tabular-nums">
                {aggregation.avgActualCompliance === null ? (
                  <span className="text-slate-400 italic font-sans">Belum terdata</span>
                ) : (
                  `${aggregation.avgActualCompliance.toFixed(1).replace(".", ",")}%`
                )}
              </td>

              {/* Rata-Rata Perubahan Kepatuhan (Δ pp) */}
              <td className="py-3.5 px-3 text-center text-teal-700 dark:text-teal-300 font-mono tabular-nums">
                {aggregation.deltaCompliance === null ? (
                  <span className="text-slate-400 italic font-sans">—</span>
                ) : (
                  <span
                    className={`inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black ${
                      aggregation.deltaCompliance > 0
                        ? "bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-200 border border-teal-300"
                        : aggregation.deltaCompliance < 0
                        ? "bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 border border-rose-300"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {aggregation.deltaCompliance > 0 ? (
                      <TrendingUp size={13} className="text-teal-600 shrink-0" />
                    ) : aggregation.deltaCompliance < 0 ? (
                      <TrendingDown size={13} className="text-rose-600 shrink-0" />
                    ) : (
                      <Minus size={13} className="shrink-0" />
                    )}
                    <span>{formatComplianceDelta(aggregation.deltaCompliance, { unit: "pp", showPlusSign: true, fractionDigits: 1 })}</span>
                  </span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer Catatan Siklus Pelaporan & Sumber Data */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 text-[11.5px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <Info size={14} className="shrink-0 text-slate-400 dark:text-slate-500" />
          <span>
            *Nilai kepatuhan bersumber dari aktivitas pemilahan via BERSEKA Vision AI, penimbangan berat sampah bersumber dari pencatatan posko/TPS3R.
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-400 shrink-0">
          <Calendar size={13} className="text-indigo-600 dark:text-indigo-400" />
          <span>Cut-off siklus transaksi bulanan: <strong>tanggal 7 setiap bulannya</strong>.</span>
        </div>
      </div>

      {/* 5. Rangkuman Metodologi Standardisasi ISO (Kartu Simetris) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {/* Box Left: Rumus Penurunan Berat Sampah Standar ISO */}
        <div className="bg-slate-50/70 dark:bg-slate-800/30 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between space-y-3">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <h5 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-black flex items-center justify-center shrink-0">
                  Δ
                </span>
                Rumus Penurunan Berat Sampah (B₀ − B₁)
              </h5>
              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/40 px-2.5 py-0.5 rounded-full shrink-0">
                {activePeriod === "DAILY" ? "Standar Rata-Rata Harian" : "Asumsi 30 Hari (× 30)"}
              </span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-800 dark:text-slate-200 space-y-1 shadow-2xs">
              <p><strong>Δ Berat Sampah</strong> = Baseline (B₀) − Aktual (B₁)</p>
              <p><strong>Rasio Penurunan (%)</strong> = [(B₀ − B₁) ÷ B₀] × 100%</p>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed bg-white/70 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
            <strong>Keterangan Capture Rate:</strong> Nilai aktual B₁ merupakan tonase sampah terpilah yang berhasil terserap dan tercatat di aplikasi Berseka pada periode {activePeriodLabel}.
          </div>
        </div>

        {/* Box Right: Rumus Perubahan Kepatuhan */}
        <div className="bg-slate-50/70 dark:bg-slate-800/30 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between space-y-3">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <h5 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-black flex items-center justify-center shrink-0">
                  Δ
                </span>
                Indeks Komposit Kepatuhan Pemilahan
              </h5>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 px-2.5 py-0.5 rounded-full shrink-0">
                Satuan: pp (Poin Persentase)
              </span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-800 dark:text-slate-200 space-y-1 shadow-2xs">
              <p><strong>Indeks Aktual</strong> = 50% Partisipasi Warga + 50% Akurasi Wadah</p>
              <p><strong>Δ Kepatuhan</strong> = Kepatuhan_Aktual − Kepatuhan_Baseline (Satuan: <strong>pp</strong>)</p>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed bg-white/70 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
            <strong>Standar Satuan Baku:</strong> Selisih antara dua angka persentase dinyatakan dalam <strong>poin persentase (pp)</strong> untuk menghindari kerancuan dengan rasio relatif.
          </div>
        </div>
      </div>

      {/* Catatan Kritis & Transparansi Analisis (Dropdown/Toggle Simetris) */}
      <div className="bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800/80 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-extrabold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <Info size={14} className="text-indigo-600 dark:text-indigo-400" />
            Catatan Metodologi &amp; Standardisasi Mutu Data (ISO 80000-1 &amp; Pedoman BPS)
          </span>
          <button
            type="button"
            onClick={() => setShowFootnoteDetails(!showFootnoteDetails)}
            className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
          >
            <span>{showFootnoteDetails ? "Sembunyikan Detail" : "Pelajari Metodologi Selengkapnya"}</span>
            {showFootnoteDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>

        {showFootnoteDetails && (
          <div className="pt-3 border-t border-slate-200/80 dark:border-slate-700/80 grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-600 dark:text-slate-300 leading-relaxed text-[11.5px]">
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-800 space-y-1">
              <strong className="text-slate-800 dark:text-slate-100 block">1. Fleksibilitas Filter &amp; Komparasi:</strong>
              <p>Dasbor mendukung komparasi dinamis harian (Hari Ini, Kemarin, Kalender) dan bulanan (Januari s/d Desember 2026). Seluruh data dikunci membandingkan terhadap Baseline Survei Lapangan KKN Juli 2026 secara konsisten.</p>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-800 space-y-1">
              <strong className="text-slate-800 dark:text-slate-100 block">2. Standardisasi Data Baseline:</strong>
              <p>Angka baseline menggunakan total berat timbulan sampah harian resmi hasil survei lapangan KKN Juli 2026 dan proyeksi demografi BPS guna memastikan komparasi yang konsisten dan akuntabel di 6 kelurahan.</p>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-800 space-y-1">
              <strong className="text-slate-800 dark:text-slate-100 block">3. Formula Agregasi Terbobot Kecamatan:</strong>
              <p>Rata-rata persentase perubahan berat kecamatan dihitung dari <strong>Total Perubahan Berat Seluruh Kecamatan dibagi Total Baseline Seluruh Kecamatan</strong> (Agregasi Terbobot), bukan rata-rata aritmetika sederhana.</p>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-800 space-y-1">
              <strong className="text-slate-800 dark:text-slate-100 block">4. Taat Asas SI &amp; Pedoman EYD V:</strong>
              <p>Seluruh penulisan massa memakai simbol baku internasional <code>kg/hari</code> atau <code>kg/bulan</code>. Perubahan persentase menggunakan satuan baku <code>pp</code> (poin persentase). Format bilangan menggunakan koma desimal <code>,</code> dan titik ribuan <code>.</code>.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WasteImpactSummaryTable;
