/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Component: WasteTrendChart (Grafik Tren Pemilahan Sampah)
 * Standarisasi UI/UX & Fisika SI:
 * - Eliminasi label "Waktu Nyata" / "Real-time" pada judul grafik tren
 * - Taat Asas SI: Seluruh penulisan satuan berat baku menggunakan 'kg' (k kecil, g kecil)
 * - Normalisasi 2 Data Series: Sampah Organik (Hijau #10b981) & Sampah Anorganik (Kuning/Amber #f59e0b)
 * - Series Residu dinonaktifkan/disembunyikan dari visualisasi aktif
 * - Hierarki Filter Waktu Fleksibel:
 *   1. "Hari Ini" & "24 Jam Terakhir" -> Agregasi per-jam (Hourly: 00:00, 04:00, 08:00, 12:00, 16:00, 20:00)
 *   2. "7 Hari Terakhir", "Minggu Ini", "4 Minggu Terakhir" -> Agregasi mingguan (W{week_number})
 *   3. "1 Tahun Penuh" / Filter Pilihan Tahun -> Agregasi bulanan (12 Bulan: Jan s/d Des)
 * - Penanganan Data Kosong: Nilai 0 kg eksplisit terplot pada dasar garis sumbu Y tanpa bias garis masa lalu
 * - Filter Pilihan Tahun: Dropdown Tahun (default 2026) tersinkronisasi via query parameter year=YYYY
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Calendar, Clock, Loader2, AlertCircle } from "lucide-react";
import api from "../../services/api";

export interface TrendDataItem {
  label: string;
  weight?: number;
  organic?: number;
  inorganic?: number;
  residu?: number;
  rawDate?: string;
  [key: string]: any;
}

export interface WasteTrendChartProps {
  wilayah?: string;
  initialData?: TrendDataItem[];
  rawOrg?: number;
  rawAnorg?: number;
  className?: string;
  onFilterChange?: (filters: { range: string; year: string; weeks: number }) => void;
}

export interface TimeRangeOption {
  value: string;
  label: string;
  weeksEquivalent: number;
  periodType: "hourly" | "daily" | "weekly" | "monthly";
}

export const TIME_RANGE_OPTIONS: TimeRangeOption[] = [
  { value: "today", label: "Hari Ini", weeksEquivalent: 1, periodType: "hourly" },
  { value: "24h", label: "24 Jam Terakhir", weeksEquivalent: 1, periodType: "hourly" },
  { value: "this_week", label: "Minggu Ini", weeksEquivalent: 1, periodType: "daily" },
  { value: "7d", label: "7 Hari Terakhir", weeksEquivalent: 2, periodType: "weekly" },
  { value: "4w", label: "4 Minggu Terakhir", weeksEquivalent: 4, periodType: "weekly" },
  { value: "8w", label: "8 Minggu Terakhir", weeksEquivalent: 8, periodType: "weekly" },
  { value: "12w", label: "12 Minggu Terakhir", weeksEquivalent: 12, periodType: "weekly" },
  { value: "year", label: "1 Tahun Penuh", weeksEquivalent: 52, periodType: "monthly" },
  { value: "all", label: "Semua Periode", weeksEquivalent: 100, periodType: "monthly" },
];

export interface YearOption {
  value: string;
  label: string;
}

export const YEAR_OPTIONS: YearOption[] = [
  { value: "2026", label: "Tahun 2026" },
];

const MONTH_NAMES_MAP: Record<string, string> = {
  Jan: "Januari",
  Feb: "Februari",
  Mar: "Maret",
  Apr: "April",
  Mei: "Mei",
  Jun: "Juni",
  Jul: "Juli",
  Agu: "Agustus",
  Sep: "September",
  Okt: "Oktober",
  Nov: "November",
  Des: "Desember",
};

const DAY_NAMES_MAP: Record<string, string> = {
  Sen: "Senin",
  Sel: "Selasa",
  Rab: "Rabu",
  Kam: "Kamis",
  Jum: "Jumat",
  Sab: "Sabtu",
  Min: "Minggu",
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  selectedYear?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, selectedYear }) => {
  if (active && payload && payload.length) {
    let displayLabel = label || "";

    if (label && MONTH_NAMES_MAP[label]) {
      displayLabel = `Bulan ${MONTH_NAMES_MAP[label]}${selectedYear ? ` ${selectedYear}` : ""}`;
    } else if (label && /^\d{2}:\d{2}$/.test(label)) {
      displayLabel = `Pukul ${label} WIB (Hari Ini)`;
    } else if (label && DAY_NAMES_MAP[label]) {
      const dateStr = payload[0]?.payload?.date ? ` (${payload[0].payload.date})` : "";
      displayLabel = `Hari ${DAY_NAMES_MAP[label]}${dateStr}`;
    } else if (label?.startsWith("W")) {
      displayLabel = `Minggu ke-${label.replace(/^W/i, "")}`;
    }

    return (
      <div className="bg-slate-900/95 dark:bg-slate-950/95 border border-slate-700/80 dark:border-slate-800 p-3.5 rounded-2xl shadow-xl backdrop-blur-md text-xs font-sans min-w-[190px] space-y-2 z-50">
        <p className="font-extrabold text-slate-200 text-center border-b border-slate-800 pb-1.5 tracking-tight">
          {displayLabel}
        </p>
        <div className="space-y-1.5">
          {payload.map((entry, index) => {
            const isOrg = entry.dataKey === "organic" || entry.name?.includes("Organik");
            const labelText = isOrg ? "🌱 Organik" : "♻️ Anorganik";
            const val = Number(entry.value || 0).toLocaleString("id-ID", {
              minimumFractionDigits: 1,
              maximumFractionDigits: 2,
            });

            return (
              <div
                key={`tooltip-${index}`}
                className="flex items-center justify-between gap-3 font-semibold text-[11.5px]"
              >
                <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: entry.color }}
                  />
                  {labelText}:
                </span>
                <span className="font-mono font-bold text-slate-100">
                  {val} kg
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

export const WasteTrendChart: React.FC<WasteTrendChartProps> = ({
  wilayah,
  initialData,
  rawOrg = 0,
  rawAnorg = 0,
  className = "",
  onFilterChange,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Inisialisasi daftar pilihan tahun dinamis dari database (default faktual 2026)
  const [yearOptions, setYearOptions] = useState<YearOption[]>(YEAR_OPTIONS);

  // Inisialisasi filter tahun dari URL search parameter (default: 2026)
  const urlYear = searchParams.get("year");
  const defaultYear = urlYear && yearOptions.some((y) => y.value === urlYear) ? urlYear : "2026";
  const [selectedYear, setSelectedYear] = useState<string>(defaultYear);

  // Inisialisasi filter rentang waktu (default: 7 Hari Terakhir / 7d)
  const [selectedRange, setSelectedRange] = useState<string>("7d");
  const [trendData, setTrendData] = useState<TrendDataItem[]>(initialData || []);
  const [loading, setLoading] = useState<boolean>(false);

  // Konfigurasi rentang waktu aktif
  const currentRangeConfig = useMemo(() => {
    return TIME_RANGE_OPTIONS.find((opt) => opt.value === selectedRange) || TIME_RANGE_OPTIONS[3];
  }, [selectedRange]);

  // Muat opsi tahun dinamis berdasarkan data aktual di database via relasi tabel setoran
  useEffect(() => {
    let isMounted = true;
    const fetchAvailableYears = async () => {
      try {
        const response = await api.get("/dashboard/years", {
          params: { wilayah },
        });
        if (
          isMounted &&
          response.data?.success &&
          Array.isArray(response.data?.data) &&
          response.data.data.length > 0
        ) {
          const dynamicOptions = response.data.data.map((y: number | string) => ({
            value: String(y),
            label: `Tahun ${y}`,
          }));
          setYearOptions(dynamicOptions);
        }
      } catch (err) {
        // Fallback hening ke opsi tahun yang ada (default 2026)
      }
    };

    fetchAvailableYears();
    return () => {
      isMounted = false;
    };
  }, [wilayah]);

  // Sinkronisasi tahun terpilih jika opsi tahun berubah dan tahun aktif tidak ada dalam opsi
  useEffect(() => {
    if (yearOptions.length > 0 && !yearOptions.some((y) => y.value === selectedYear)) {
      setSelectedYear(yearOptions[0].value);
    }
  }, [yearOptions, selectedYear]);

  // Fungsi fetch data tren pemilahan dari backend
  const fetchTrendData = useCallback(
    async (rangeVal: string, yearVal: string) => {
      const rangeOpt = TIME_RANGE_OPTIONS.find((opt) => opt.value === rangeVal) || TIME_RANGE_OPTIONS[3];
      setLoading(true);
      try {
        const response = await api.get("/dashboard/trend", {
          params: {
            weeks: rangeOpt.weeksEquivalent,
            year: yearVal,
            range: rangeVal,
            wilayah,
          },
        });

        if (response.data?.success && Array.isArray(response.data?.data)) {
          setTrendData(response.data.data);
          if (
            Array.isArray(response.data?.availableYears) &&
            response.data.availableYears.length > 0
          ) {
            const dynamicOptions = response.data.availableYears.map((y: number | string) => ({
              value: String(y),
              label: `Tahun ${y}`,
            }));
            setYearOptions(dynamicOptions);
          }
        } else if (Array.isArray(response.data)) {
          setTrendData(response.data);
        }
      } catch (err) {
        console.warn("[WasteTrendChart] Gagal memuat tren pemilahan:", err);
      } finally {
        setLoading(false);
      }
    },
    [wilayah]
  );

  // Sinkronisasi data saat mount atau saat dependencies filter berubah
  useEffect(() => {
    fetchTrendData(selectedRange, selectedYear);
  }, [fetchTrendData, selectedRange, selectedYear]);

  // Handler interaksi dropdown tahun
  const handleYearChange = (newYear: string) => {
    setSelectedYear(newYear);

    // Kirim / sinkronisasikan query parameter year=YYYY ke URL state
    setSearchParams(
      (prev) => {
        const updated = new URLSearchParams(prev);
        updated.set("year", newYear);
        return updated;
      },
      { replace: true }
    );

    onFilterChange?.({
      range: selectedRange,
      year: newYear,
      weeks: currentRangeConfig.weeksEquivalent,
    });
  };

  // Handler interaksi dropdown rentang waktu
  const handleRangeChange = (newRange: string) => {
    setSelectedRange(newRange);
    const rangeOpt = TIME_RANGE_OPTIONS.find((opt) => opt.value === newRange) || TIME_RANGE_OPTIONS[3];

    onFilterChange?.({
      range: newRange,
      year: selectedYear,
      weeks: rangeOpt.weeksEquivalent,
    });
  };

  // Normalisasi data chart:
  // - Batasi HANYA 2 series (Organik & Anorganik)
  // - Format sumbu X sesuai hierarki (Hourly / Weekly / Monthly)
  // - Sediakan baseline 0 kg eksplisit jika tidak ada aktivitas
  const normalizedChartData = useMemo(() => {
    // 1. Kasus Rentang Per Jam ("Hari Ini" / "24 Jam Terakhir")
    if (currentRangeConfig.periodType === "hourly") {
      const defaultHourlySlots = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"];

      if (!Array.isArray(trendData) || trendData.length === 0) {
        return defaultHourlySlots.map((slot) => ({
          rawLabel: slot,
          formattedLabel: slot,
          organic: 0,
          inorganic: 0,
        }));
      }

      return trendData.map((d, index) => {
        const formattedLabel = d.label || defaultHourlySlots[index % defaultHourlySlots.length];
        const organicVal = Math.max(0, Number(d.organic ?? d.organik ?? 0));
        const inorganicVal = Math.max(0, Number(d.inorganic ?? d.anorganik ?? 0));

        return {
          rawLabel: d.label,
          formattedLabel,
          organic: parseFloat(organicVal.toFixed(2)),
          inorganic: parseFloat(inorganicVal.toFixed(2)),
        };
      });
    }

    // 2. Kasus Rentang Tahunan ("1 Tahun Penuh" / Pilihan Tahun) -> 12 Bulan (Jan s/d Des)
    if (currentRangeConfig.periodType === "monthly") {
      const defaultMonths = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

      if (!Array.isArray(trendData) || trendData.length === 0) {
        return defaultMonths.map((m) => ({
          rawLabel: m,
          formattedLabel: m,
          organic: 0,
          inorganic: 0,
        }));
      }

      return trendData.map((d, index) => {
        const formattedLabel = d.label || defaultMonths[index % defaultMonths.length];
        const organicVal = Math.max(0, Number(d.organic ?? d.organik ?? 0));
        const inorganicVal = Math.max(0, Number(d.inorganic ?? d.anorganik ?? 0));

        return {
          rawLabel: d.label,
          formattedLabel,
          organic: parseFloat(organicVal.toFixed(2)),
          inorganic: parseFloat(inorganicVal.toFixed(2)),
        };
      });
    }

    // 2.5 Kasus Rentang Harian ("Minggu Ini") -> 7 Hari (Sen s/d Min)
    if (currentRangeConfig.periodType === "daily") {
      const defaultDays = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

      if (!Array.isArray(trendData) || trendData.length === 0) {
        return defaultDays.map((day) => ({
          rawLabel: day,
          formattedLabel: day,
          organic: 0,
          inorganic: 0,
        }));
      }

      return trendData.map((d, index) => {
        const formattedLabel = d.label || defaultDays[index % defaultDays.length];
        const organicVal = Math.max(0, Number(d.organic ?? d.organik ?? 0));
        const inorganicVal = Math.max(0, Number(d.inorganic ?? d.anorganik ?? 0));

        return {
          rawLabel: d.label,
          formattedLabel,
          date: d.date,
          organic: parseFloat(organicVal.toFixed(2)),
          inorganic: parseFloat(inorganicVal.toFixed(2)),
        };
      });
    }

    // 3. Kasus Rentang Mingguan & Harian Standar
    if (!Array.isArray(trendData) || trendData.length === 0) return [];

    return trendData.map((d, index) => {
      let formattedLabel = d.label || `Titik ${index + 1}`;

      if (typeof formattedLabel === "string") {
        if (/^Mng\s*\d+/i.test(formattedLabel)) {
          formattedLabel = formattedLabel.replace(/^Mng\s*/i, "W");
        } else if (/^Minggu\s*\d+/i.test(formattedLabel)) {
          formattedLabel = formattedLabel.replace(/^Minggu\s*/i, "W");
        } else if (/^\d{4}-\d{2}-\d{2}/.test(formattedLabel)) {
          const parts = formattedLabel.split("-");
          if (parts.length >= 3) {
            formattedLabel = `${parts[2]}/${parts[1]}`;
          }
        }
      }

      const organicVal = Math.max(0, Number(d.organic ?? d.organik ?? 0));
      const inorganicVal = Math.max(0, Number(d.inorganic ?? d.anorganik ?? 0));

      return {
        rawLabel: d.label,
        formattedLabel,
        organic: parseFloat(organicVal.toFixed(2)),
        inorganic: parseFloat(inorganicVal.toFixed(2)),
      };
    });
  }, [trendData, currentRangeConfig]);

  // Kalkulasi total terpilah (Organik + Anorganik) dalam satuan baku kg
  const totalTerpilahKg = useMemo(() => {
    if (normalizedChartData.length > 0) {
      return normalizedChartData.reduce((acc, curr) => acc + curr.organic + curr.inorganic, 0);
    }
    return (rawOrg || 0) + (rawAnorg || 0);
  }, [normalizedChartData, rawOrg, rawAnorg]);

  // Pengecekan apakah seluruh data bernilai 0 kg
  const isAllZeroActivity = useMemo(() => {
    return (
      normalizedChartData.length > 0 &&
      normalizedChartData.every((d) => d.organic === 0 && d.inorganic === 0)
    );
  }, [normalizedChartData]);

  // Kalkulasi data komposisi sampah terpilah (Sinkron 100% mengikuti filter aktif)
  const filteredOrg = useMemo(() => {
    if (normalizedChartData.length > 0) {
      return normalizedChartData.reduce((acc, curr) => acc + (curr.organic || 0), 0);
    }
    return rawOrg || 0;
  }, [normalizedChartData, rawOrg]);

  const filteredAnorg = useMemo(() => {
    if (normalizedChartData.length > 0) {
      return normalizedChartData.reduce((acc, curr) => acc + (curr.inorganic || 0), 0);
    }
    return rawAnorg || 0;
  }, [normalizedChartData, rawAnorg]);

  const totalCompositionKg = filteredOrg + filteredAnorg;
  const pctOrg = totalCompositionKg > 0 ? Math.round((filteredOrg / totalCompositionKg) * 100) : 0;
  const pctAnorg = totalCompositionKg > 0 ? 100 - pctOrg : 0;

  const donutCircumference = 2 * Math.PI * 40;
  const valOrg = (pctOrg / 100) * donutCircumference;
  const valAnorg = (pctAnorg / 100) * donutCircumference;

  let dominantLabel = "Organik";
  let dominantPct = pctOrg;
  let dominantColor = "text-emerald-600 dark:text-emerald-400";

  if (pctAnorg > pctOrg) {
    dominantLabel = "Anorganik";
    dominantPct = pctAnorg;
    dominantColor = "text-amber-600 dark:text-amber-400";
  }

  // Label unit sumbu X dinamis berdasarkan tipe rentang waktu aktif
  const xAxisUnitLabel = useMemo(() => {
    switch (currentRangeConfig.periodType) {
      case "hourly":
        return "(per jam)";
      case "daily":
        return "(per hari)";
      case "monthly":
        return "(per bulan)";
      case "weekly":
      default:
        return "(per minggu)";
    }
  }, [currentRangeConfig.periodType]);

  return (
    <div
      className={`bg-white dark:bg-slate-900 shadow-xs rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 relative overflow-hidden flex flex-col space-y-6 ${className}`}
    >
      {/* 1. Header Bar Gabungan: Judul & Terpilah di Kiri, Filter Tahun & Rentang di Kanan Atas */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h4 className="font-bold text-[18px] text-slate-900 dark:text-slate-100 tracking-tight">
              Tren Pemilahan & Komposisi Sampah
            </h4>
            <span className="text-[10.5px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
              Terpilah: {totalTerpilahKg.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Pemantauan tren berat sampah (kg) dan evaluasi capaian penurunan timbulan sampah sesuai target program KKN
          </p>
        </div>

        {/* Dropdown Selectors: Filter Tahun & Filter Rentang Waktu di Kanan Atas Card */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-center shrink-0">
          {/* Dropdown Selector: Filter Tahun */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200/90 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-2xs hover:border-emerald-500/50 transition-all">
            <Calendar size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold mr-0.5">
              Tahun
            </span>
            <select
              aria-label="Filter Tahun"
              value={selectedYear}
              onChange={(e) => handleYearChange(e.target.value)}
              className="bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer font-bold text-xs pr-1"
            >
              {yearOptions.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold"
                >
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown Selector: Rentang Waktu */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200/90 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-2xs hover:border-emerald-500/50 transition-all">
            <Clock size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold mr-0.5">
              Rentang
            </span>
            <select
              aria-label="Rentang Waktu"
              value={selectedRange}
              onChange={(e) => handleRangeChange(e.target.value)}
              className="bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer font-bold text-xs pr-1"
            >
              {TIME_RANGE_OPTIONS.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold"
                >
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Body Grid: 2 Kolom (Kiri: Grafik Tren Pemilahan & Kanan: Komposisi Sampah) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Kolom Kiri: Tren Pemilahan Sampah Chart (8 Kolom) */}
        <div className="lg:col-span-8 flex flex-col justify-between space-y-3">
          {/* Header Sub-seksi Grafik & Legenda Organik/Anorganik */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex gap-4 text-[11px] font-bold">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981]" />
                Organik
              </span>
              <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] shadow-[0_0_8px_#f59e0b]" />
                Anorganik
              </span>
            </div>
          </div>

          {/* Banner Informatif: Ketika data dalam rentang aktif adalah 0 kg */}
          {isAllZeroActivity && !loading && (
            <div className="flex items-center gap-2 px-3.5 py-2 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/40 rounded-xl text-[11px] font-bold text-amber-800 dark:text-amber-300 animate-in fade-in duration-200">
              <AlertCircle size={14} className="shrink-0 text-amber-600 dark:text-amber-400" />
              <span>
                Belum ada data setoran sampah pada rentang waktu ini (0 kg).
              </span>
            </div>
          )}

          {/* Area Grafik Tren Pemilahan Recharts */}
          <div className="h-[350px] w-full relative pt-1 flex flex-col justify-between">
            {/* Label Satuan Sumbu Y (Kiri): Cukup (kg) */}
            <div className="flex items-center justify-between px-2 pb-0.5">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 font-sans tracking-wide select-none">
                (kg)
              </span>
            </div>

            <div className="flex-1 w-full h-[300px]">
              {loading ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-xs text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-600 dark:text-emerald-400" />
                  <span className="font-semibold">Memuat tren pemilahan sampah...</span>
                </div>
              ) : normalizedChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={normalizedChartData}
                    margin={{ top: 10, right: 15, left: 0, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="wasteOrgGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="wasteInorgGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.25} vertical={false} />

                    {/* Sumbu X: Format Presisi dd/MM, HH:mm, atau W{week_number} */}
                    <XAxis
                      dataKey="formattedLabel"
                      tick={{ fill: "#94a3b8", fontSize: 10.5, fontWeight: "bold" }}
                      stroke="#475569"
                      tickLine={false}
                      dy={6}
                    />

                    {/* Sumbu Y: Taat Asas SI, domain selalu mulai dari 0, di kiri cukup (kg) */}
                    <YAxis
                      domain={[0, "auto"]}
                      tickFormatter={(val: number) => Math.round(val).toLocaleString("id-ID")}
                      tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: "bold" }}
                      stroke="#475569"
                      tickLine={false}
                      width={55}
                    />

                    {/* Formatter Tooltip Sesuai Standar Pelaporan */}
                    <Tooltip
                      content={<CustomTooltip selectedYear={selectedYear} />}
                      formatter={(value: any, name: any) => [
                        `${Number(value || 0).toLocaleString("id-ID")} kg`,
                        name === "organic" || name === "Sampah Organik" ? "Sampah Organik" : "Sampah Anorganik",
                      ]}
                    />

                    {/* Series 1: Sampah Organik (Hijau) */}
                    <Area
                      type="monotone"
                      dataKey="organic"
                      name="Sampah Organik"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#wasteOrgGrad)"
                      dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#ffffff" }}
                      activeDot={{ r: 6, fill: "#10b981", strokeWidth: 2, stroke: "#ffffff" }}
                    />

                    {/* Series 2: Sampah Anorganik (Kuning/Amber) */}
                    <Area
                      type="monotone"
                      dataKey="inorganic"
                      name="Sampah Anorganik"
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#wasteInorgGrad)"
                      dot={{ r: 4, fill: "#f59e0b", strokeWidth: 2, stroke: "#ffffff" }}
                      activeDot={{ r: 6, fill: "#f59e0b", strokeWidth: 2, stroke: "#ffffff" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-xs text-slate-500 italic bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center">
                  <p className="font-bold text-slate-600 dark:text-slate-400">
                    Belum ada aktivitas pemilahan tercatat (0 kg)
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Tidak ada berat sampah organik maupun anorganik pada periode tahun {selectedYear} ({currentRangeConfig.label}).
                  </p>
                </div>
              )}
            </div>

            {/* Label Satuan Sumbu X (Bawah): (per minggu) */}
            <div className="text-center text-[11px] font-bold text-slate-400 dark:text-slate-500 pt-2 tracking-wide select-none">
              {xAxisUnitLabel}
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Panel Komposisi Sampah (4 Kolom) - Mengikuti Filter Aktif */}
        <div className="lg:col-span-4 bg-slate-50/70 dark:bg-slate-800/40 shadow-2xs rounded-2xl p-5 border border-slate-200/70 dark:border-slate-700/60 flex flex-col justify-between h-full min-h-[440px] relative overflow-hidden">
          <div className="flex justify-between items-start mb-2 gap-2 shrink-0">
            <div>
              <h5 className="font-bold text-[17px] text-slate-900 dark:text-slate-100">Komposisi Sampah</h5>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 leading-tight">
                {selectedRange === "all"
                  ? "Akumulasi terpilah seluruh periode tercatat."
                  : `Proporsi terpilah periode ${currentRangeConfig.label.toLowerCase()} (${selectedYear}).`}
              </p>
            </div>
            <span className="text-[10.5px] font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700/40 px-2.5 py-1 rounded-full tracking-wider shrink-0">
              Massa (kg)
            </span>
          </div>

          <div className="flex-1 flex flex-col md:flex-row lg:flex-col items-center justify-center gap-5 my-auto py-2">
            {/* Donut Chart Ringkas & Proporsional */}
            <div className="flex flex-col items-center justify-center shrink-0">
              <div className="w-28 h-28 relative flex items-center justify-center my-1 group">
                <svg className="w-28 h-28 transform -rotate-90">
                  <circle cx="56" cy="56" r="40" fill="transparent" stroke="#e2e8f0" className="dark:stroke-slate-700/60" strokeWidth="10" />
                  {pctOrg > 0 && (
                    <circle
                      cx="56"
                      cy="56"
                      r="40"
                      fill="transparent"
                      stroke="#34d399"
                      strokeWidth="10"
                      strokeDasharray={`${valOrg} ${donutCircumference}`}
                      strokeDashoffset={0}
                      className="transition-all duration-500 hover:stroke-[12]"
                    />
                  )}
                  {pctAnorg > 0 && (
                    <circle
                      cx="56"
                      cy="56"
                      r="40"
                      fill="transparent"
                      stroke="#fbbf24"
                      strokeWidth="10"
                      strokeDasharray={`${valAnorg} ${donutCircumference}`}
                      strokeDashoffset={-valOrg}
                      className="transition-all duration-500 hover:stroke-[12]"
                    />
                  )}
                </svg>
                <div className="absolute text-center flex flex-col items-center justify-center pointer-events-none">
                  <span className={`block text-xl font-black leading-none ${dominantColor}`}>
                    {dominantPct}%
                  </span>
                  <span className="text-[9px] text-slate-400 uppercase font-extrabold tracking-wider mt-0.5 block">
                    {dominantLabel}
                  </span>
                </div>
              </div>

              {/* Angka Total Akumulasi Terpilah (Sinkron Mengikuti Filter Aktif) */}
              <div className="text-center mt-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Total Sampah Terpilah
                </span>
                <span className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono">
                  {totalCompositionKg.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg
                </span>
              </div>
            </div>

            {/* Penekanan Informasi pada Angka & Nilai Komposisi (Mengikuti Filter Aktif) */}
            <div className="w-full space-y-2.5 bg-white dark:bg-slate-900/90 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex-1">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5 font-extrabold text-slate-700 dark:text-slate-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#34d399] shadow-[0_0_8px_#34d399] inline-block"></span>
                  Organik
                </div>
                <div className="font-mono font-bold text-slate-800 dark:text-slate-100">
                  {filteredOrg.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg{" "}
                  <span className="text-emerald-600 dark:text-emerald-400 font-extrabold ml-1">({pctOrg}%)</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center gap-1.5 font-extrabold text-slate-700 dark:text-slate-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#fbbf24] shadow-[0_0_8px_#fbbf24] inline-block"></span>
                  Anorganik
                </div>
                <div className="font-mono font-bold text-slate-800 dark:text-slate-100">
                  {filteredAnorg.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg{" "}
                  <span className="text-amber-600 dark:text-amber-400 font-extrabold ml-1">({pctAnorg}%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WasteTrendChart;
