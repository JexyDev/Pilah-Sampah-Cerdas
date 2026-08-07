/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */

import React, { useEffect, useState, useMemo } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import {
  Loader2,
  Archive,
  Sprout,
  Calendar,
  Layers,
  ArrowRightLeft,
  Search,
  X,
  RotateCcw,
  Sparkles,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Filter,
  TrendingUp,
} from "lucide-react";

interface PemanfaatanItem {
  id: string;
  rwId: number;
  nomorCaraPemanfaatan: string;
  program: string;
  teknologi: string;
  bahanBaku: string;
  volumeBahanBaku: number;
  unitBahanBaku: string;
  hasil: number;
  unitHasil: string;
  fotoDokumentasiUrl: string;
  tanggalPencatatan: string;
  rw?: {
    id: number;
    name: string;
    kelurahan?: {
      name: string;
    };
  } | null;
}

interface MonthlyTrendPoint {
  month: string;
  fullMonth: string;
  sampahMasuk: number;
  sampahDiolah: number;
  count: number;
  x: number;
  yMasuk: number;
  yDiolah: number;
}

export const HasilPemanfaatan: React.FC = () => {
  const [items, setItems] = useState<PemanfaatanItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Search, Filters & Time Horizons
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProgramFilter, setSelectedProgramFilter] = useState("ALL");
  const [selectedRwFilter, setSelectedRwFilter] = useState("ALL");
  const [activeTab, setActiveTab] = useState<"realtime" | "weekly" | "monthly">("realtime");
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  // Hover state for interactive bar chart tooltip
  const [hoveredChartItem, setHoveredChartItem] = useState<{ progName: string; bahanBaku: number; hasil: number; effRatio: number } | null>(null);

  // Hover state for interactive line chart tooltip (Image 2 style)
  const [hoveredLineIndex, setHoveredLineIndex] = useState<number | null>(null);

  // Chart View Mode: "SEPARATE" (2 distinct bar charts), "LINE_COMPARE" (2-line comparison chart), "BAR_COMPARE" (Combined bar chart)
  const [chartViewMode, setChartViewMode] = useState<"LINE_COMPARE" | "BAR_COMPARE" | "SEPARATE">("LINE_COMPARE");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await api.get("/pemanfaatan");
      if (res.data && res.data.success) {
        setItems(res.data.data);
      }
    } catch (e: any) {
      toast.error("Gagal memuat data pemanfaatan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Filtered Items Logic (Dynamic stat calculation depends on this)
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const rwName = item.rw?.name || `RW ${item.rwId}`;
      const kelName = item.rw?.kelurahan?.name || "";

      const matchesSearch =
        !q ||
        item.program.toLowerCase().includes(q) ||
        (item.teknologi && item.teknologi.toLowerCase().includes(q)) ||
        (item.bahanBaku && item.bahanBaku.toLowerCase().includes(q)) ||
        rwName.toLowerCase().includes(q) ||
        kelName.toLowerCase().includes(q);

      const matchesProgram =
        selectedProgramFilter === "ALL"
          ? true
          : item.program.toUpperCase().replace("_", "").includes(selectedProgramFilter.toUpperCase().replace("_", ""));

      const matchesRw =
        selectedRwFilter === "ALL" ? true : item.rwId.toString() === selectedRwFilter;

      return matchesSearch && matchesProgram && matchesRw;
    });
  }, [items, searchQuery, selectedProgramFilter, selectedRwFilter]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedProgramFilter, selectedRwFilter, itemsPerPage, activeTab]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
  }, [filteredItems.length, itemsPerPage]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  // Distinct RW List for filter
  const rwOptions = useMemo(() => {
    const map = new Map<number, string>();
    items.forEach((it) => {
      if (it.rwId) {
        map.set(
          it.rwId,
          it.rw?.name
            ? `${it.rw.name} (Kel. ${it.rw.kelurahan?.name || "Coblong"})`
            : `RW ID ${it.rwId}`
        );
      }
    });
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [items]);

  // Summary statistics calculations
  const totalBahanBaku = useMemo(() => {
    return filteredItems.reduce((acc, curr) => acc + Number(curr.volumeBahanBaku || 0), 0);
  }, [filteredItems]);

  const totalHasil = useMemo(() => {
    return filteredItems.reduce((acc, curr) => acc + Number(curr.hasil || 0), 0);
  }, [filteredItems]);

  const conversionRate = useMemo(() => {
    if (totalBahanBaku === 0) return "0.0";
    return Math.min(100, Math.round((totalHasil / totalBahanBaku) * 100)).toFixed(1);
  }, [totalBahanBaku, totalHasil]);

  const distinctPrograms = useMemo(() => {
    return new Set(filteredItems.map((item) => item.program)).size;
  }, [filteredItems]);

  // Program Breakdown Aggregation for Bar Charts
  const programBreakdown = useMemo(() => {
    const map: Record<string, { bahanBaku: number; hasil: number; count: number }> = {};
    filteredItems.forEach((item) => {
      let progLabel = item.program.replace("_", " ");
      const pUpper = item.program.toUpperCase();
      if (pUpper.includes("BANK")) progLabel = "Bank Sampah";
      else if (pUpper.includes("BURUAN")) progLabel = "Buruan Sae";
      else if (pUpper.includes("KOMPOS")) progLabel = "Kompos";
      else if (pUpper.includes("MAGGOT")) progLabel = "Rumah Maggot";
      else if (pUpper.includes("POC")) progLabel = "POC";

      if (!map[progLabel]) {
        map[progLabel] = { bahanBaku: 0, hasil: 0, count: 0 };
      }
      map[progLabel].bahanBaku += Number(item.volumeBahanBaku || 0);
      map[progLabel].hasil += Number(item.hasil || 0);
      map[progLabel].count += 1;
    });
    return map;
  }, [filteredItems]);

  const maxChartVal = useMemo(() => {
    let max = 10;
    Object.values(programBreakdown).forEach((d) => {
      if (d.bahanBaku > max) max = d.bahanBaku;
      if (d.hasil > max) max = d.hasil;
    });
    return Math.ceil(max * 1.1);
  }, [programBreakdown]);

  const maxBahanBakuVal = useMemo(() => {
    let max = 10;
    Object.values(programBreakdown).forEach((d) => {
      if (d.bahanBaku > max) max = d.bahanBaku;
    });
    return Math.ceil(max * 1.1);
  }, [programBreakdown]);

  const maxHasilVal = useMemo(() => {
    let max = 10;
    Object.values(programBreakdown).forEach((d) => {
      if (d.hasil > max) max = d.hasil;
    });
    return Math.ceil(max * 1.1);
  }, [programBreakdown]);

  // Monthly Trend Data Aggregation for Line Chart (Sampah Masuk vs Sampah Diolah)
  const monthlyTrendData = useMemo(() => {
    const monthLabels = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
    const monthlyMap: Record<number, { masuk: number; diolah: number; count: number }> = {};
    for (let i = 0; i < 12; i++) {
      monthlyMap[i] = { masuk: 0, diolah: 0, count: 0 };
    }

    filteredItems.forEach((item) => {
      const d = new Date(item.tanggalPencatatan);
      if (!isNaN(d.getTime())) {
        const monthIdx = d.getMonth();
        monthlyMap[monthIdx].masuk += Number(item.volumeBahanBaku || 0);
        monthlyMap[monthIdx].diolah += Number(item.hasil || 0);
        monthlyMap[monthIdx].count += 1;
      }
    });

    // Pick 6 primary display months (e.g. Jan to Jun or active months)
    const activeDisplayMonths = [0, 1, 2, 3, 4, 5];
    return activeDisplayMonths.map((idx) => {
      return {
        month: monthLabels[idx],
        fullMonth: `${monthLabels[idx]} 2026`,
        sampahMasuk: Math.round(monthlyMap[idx].masuk * 10) / 10,
        sampahDiolah: Math.round(monthlyMap[idx].diolah * 10) / 10,
        count: monthlyMap[idx].count,
      };
    });
  }, [filteredItems]);

  // Calculations for SVG Line Chart (Dimensions & Coordinates)
  const svgWidth = 800;
  const svgHeight = 240;
  const paddingLeft = 65;
  const paddingRight = 40;
  const paddingTop = 25;
  const paddingBottom = 40;

  const chartW = svgWidth - paddingLeft - paddingRight;
  const chartH = svgHeight - paddingTop - paddingBottom;

  const maxLineVal = useMemo(() => {
    let max = 50;
    monthlyTrendData.forEach((d) => {
      if (d.sampahMasuk > max) max = d.sampahMasuk;
      if (d.sampahDiolah > max) max = d.sampahDiolah;
    });
    return Math.ceil(max * 1.25);
  }, [monthlyTrendData]);

  const linePointsWithCoords: MonthlyTrendPoint[] = useMemo(() => {
    const count = monthlyTrendData.length;
    return monthlyTrendData.map((d, i) => {
      const x = paddingLeft + (i / (count - 1)) * chartW;
      const yMasuk = paddingTop + chartH - (d.sampahMasuk / maxLineVal) * chartH;
      const yDiolah = paddingTop + chartH - (d.sampahDiolah / maxLineVal) * chartH;
      return {
        ...d,
        x,
        yMasuk: isNaN(yMasuk) ? paddingTop + chartH : yMasuk,
        yDiolah: isNaN(yDiolah) ? paddingTop + chartH : yDiolah,
      };
    });
  }, [monthlyTrendData, maxLineVal, chartW, chartH]);

  // Generate Smooth Cubic Bezier Curves for SVG Line Chart
  const getSmoothSvgPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return "";
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const curr = pts[i];
      const next = pts[i + 1];
      const cp1x = curr.x + (next.x - curr.x) / 2;
      const cp1y = curr.y;
      const cp2x = curr.x + (next.x - curr.x) / 2;
      const cp2y = next.y;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
    }
    return d;
  };

  const pathSampahMasuk = useMemo(() => {
    return getSmoothSvgPath(linePointsWithCoords.map((p) => ({ x: p.x, y: p.yMasuk })));
  }, [linePointsWithCoords]);

  const pathSampahDiolah = useMemo(() => {
    return getSmoothSvgPath(linePointsWithCoords.map((p) => ({ x: p.x, y: p.yDiolah })));
  }, [linePointsWithCoords]);

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedProgramFilter("ALL");
    setSelectedRwFilter("ALL");
  };

  // Grouping Helpers for Weekly & Monthly Tables
  const getWeekNumber = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  };

  const getWeeklyGroup = () => {
    const groups: any = {};
    filteredItems.forEach((item) => {
      const d = new Date(item.tanggalPencatatan);
      const week = getWeekNumber(d);
      const year = d.getFullYear();
      const monthLabel = d.toLocaleDateString("id-ID", { month: "short" });
      const key = `Minggu ke-${week} (${monthLabel} ${year})`;
      const subKey = `${item.program}_${item.rwId}`;

      if (!groups[key]) groups[key] = {};
      if (!groups[key][subKey]) {
        groups[key][subKey] = {
          label: key,
          program: item.program,
          teknologi: item.teknologi,
          rwName: item.rw?.name || `RW ID ${item.rwId}`,
          kelName: item.rw?.kelurahan?.name || "",
          volumeBahanBaku: 0,
          hasil: 0,
          count: 0,
        };
      }
      groups[key][subKey].volumeBahanBaku += Number(item.volumeBahanBaku);
      groups[key][subKey].hasil += Number(item.hasil);
      groups[key][subKey].count += 1;
    });

    const list: any[] = [];
    Object.keys(groups).forEach((key) => {
      Object.keys(groups[key]).forEach((subKey) => {
        list.push(groups[key][subKey]);
      });
    });
    return list;
  };

  const getMonthlyGroup = () => {
    const groups: any = {};
    filteredItems.forEach((item) => {
      const d = new Date(item.tanggalPencatatan);
      const monthLabel = d.toLocaleDateString("id-ID", { month: "long" });
      const year = d.getFullYear();
      const key = `${monthLabel} ${year}`;
      const subKey = `${item.program}_${item.rwId}`;

      if (!groups[key]) groups[key] = {};
      if (!groups[key][subKey]) {
        groups[key][subKey] = {
          label: key,
          program: item.program,
          teknologi: item.teknologi,
          rwName: item.rw?.name || `RW ID ${item.rwId}`,
          kelName: item.rw?.kelurahan?.name || "",
          volumeBahanBaku: 0,
          hasil: 0,
          count: 0,
        };
      }
      groups[key][subKey].volumeBahanBaku += Number(item.volumeBahanBaku);
      groups[key][subKey].hasil += Number(item.hasil);
      groups[key][subKey].count += 1;
    });

    const list: any[] = [];
    Object.keys(groups).forEach((key) => {
      Object.keys(groups[key]).forEach((subKey) => {
        list.push(groups[key][subKey]);
      });
    });
    return list;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-800 font-sans">
      {/* Executive Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold w-fit mb-2 border border-emerald-500/30">
            <Sparkles size={14} /> Analitik Sirkular Sampah
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Hasil Pemanfaatan Sampah Menuju Sirkular Ekonomi</h1>
          <p className="text-slate-400 text-xs md:text-sm mt-1">
            Statistik sirkulasi bahan baku, konversi hasil panen, dan tata kelola pemanfaatan sampah di kelurahan.
          </p>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-slate-100 text-slate-700 rounded-xl shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Total Bahan Baku</p>
            <p className="text-lg font-extrabold text-slate-900 mt-0.5">
              {totalBahanBaku.toLocaleString("id-ID", { maximumFractionDigits: 1 })}{" "}
              <span className="text-xs font-bold text-slate-500">Kg</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0 border border-emerald-100">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Total Hasil Panen</p>
            <p className="text-lg font-extrabold text-emerald-700 mt-0.5">
              {totalHasil.toLocaleString("id-ID", { maximumFractionDigits: 1 })}{" "}
              <span className="text-xs font-bold text-slate-500">Kg</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0 border border-blue-100">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Rasio Konversi</p>
            <p className="text-lg font-extrabold text-blue-700 mt-0.5">{conversionRate}%</p>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl shrink-0 border border-purple-100">
            <Archive className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Program Aktif</p>
            <p className="text-lg font-extrabold text-purple-700 mt-0.5">{distinctPrograms} Kategori</p>
          </div>
        </div>
      </div>

      {/* Category Radio Button Selector Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Filter size={14} className="text-emerald-600" /> Filter Kategori Program (Radio Button):
          </span>
          {selectedProgramFilter !== "ALL" && (
            <button
              onClick={() => setSelectedProgramFilter("ALL")}
              className="text-[11px] font-bold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <X size={12} /> Reset Kategori
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          {[
            { id: "ALL", label: "Semua Kategori" },
            { id: "KOMPOS", label: "Kompos" },
            { id: "POC", label: "POC (Pupuk Organik Cair)" },
            { id: "BURUAN_SAE", label: "Buruan Sae" },
            { id: "BANK_SAMPAH", label: "Bank Sampah" },
          ].map((cat) => (
            <label
              key={cat.id}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-extrabold cursor-pointer transition-all ${
                selectedProgramFilter === cat.id
                  ? "bg-emerald-50 border-emerald-500 text-emerald-900 shadow-2xs ring-2 ring-emerald-500/20"
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <input
                type="radio"
                name="programCategoryRadio"
                value={cat.id}
                checked={selectedProgramFilter === cat.id}
                onChange={(e) => setSelectedProgramFilter(e.target.value)}
                className="w-3.5 h-3.5 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <span>{cat.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Chart View Toggle Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
            <BarChart3 size={18} />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-800 tracking-tight">
              Visualisasi Analitik Sirkular Sampah
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Statistik kuantitatif volume sampah diolah (Input) dan produk panen sirkular (Output) per kategori.
            </p>
          </div>
        </div>

        {/* View Mode Toggle Switches */}
        <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60 shrink-0 gap-1">
          <button
            onClick={() => setChartViewMode("SEPARATE")}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              chartViewMode === "SEPARATE"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            📊 Dua Grafik Terpisah
          </button>
          <button
            onClick={() => setChartViewMode("LINE_COMPARE")}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
              chartViewMode === "LINE_COMPARE"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <TrendingUp size={14} /> Grafik Perbandingan (Line Chart)
          </button>
          <button
            onClick={() => setChartViewMode("BAR_COMPARE")}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              chartViewMode === "BAR_COMPARE"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            📈 Perbandingan Bar (Kategori)
          </button>
        </div>
      </div>

      {Object.keys(programBreakdown).length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 shadow-xs text-center flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <Sprout size={28} />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-800 text-sm">Belum Ada Data Pemanfaatan Sampah</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 font-medium">
              Data grafik sirkular ekonomi terhubung langsung ke database real. Belum ada entri pemanfaatan yang sesuai kriteria filter saat ini.
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              fetchItems();
            }}
            className="mt-2 px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <RefreshCw size={14} /> Sinkronkan Database Real
          </button>
        </div>
      ) : chartViewMode === "LINE_COMPARE" ? (
        /* MODE: DUAL-LINE CHART COMPARISON (MATCHING IMAGE 2 REF IN TRASHCARE CLEAN LOOK) */
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2 tracking-tight">
                <TrendingUp className="text-emerald-600" size={20} />
                Perbandingan Sampah Masuk dan Sampah Diolah
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Sirkulasi trend volume sampah masuk (Bahan Baku) vs sampah diolah (Hasil Panen) per bulan.
              </p>
            </div>

            {/* Custom Control Badges / Top Legend */}
            <div className="flex flex-wrap items-center gap-3 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/80 text-[11px] font-extrabold shrink-0 shadow-2xs">
              <span className="text-slate-600 font-semibold bg-slate-200/70 px-2 py-0.5 rounded-md text-[10px]">
                Sumbu Y: Kilogram (Kg)
              </span>
              <div className="flex items-center gap-1.5 pl-1">
                <span className="w-3 h-3 rounded-full bg-indigo-600 inline-block shadow-2xs ring-2 ring-indigo-200"></span>
                <span className="text-indigo-900 font-bold">Sampah Masuk (Bahan Baku)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-2xs ring-2 ring-emerald-200"></span>
                <span className="text-emerald-800 font-bold">Sampah Diolah (Hasil Panen)</span>
              </div>
            </div>
          </div>

          {/* SVG Dual-Line Chart Container */}
          <div className="relative pt-4 pb-2">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto overflow-visible select-none"
              style={{ maxHeight: "320px" }}
            >
              <defs>
                {/* Line Gradients */}
                <linearGradient id="gradientMasuk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="gradientDiolah" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Dotted Grid Lines & Y-Axis Labels */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                const yVal = paddingTop + chartH * (1 - ratio);
                const labelVal = Math.round(maxLineVal * ratio);
                return (
                  <g key={idx}>
                    <line
                      x1={paddingLeft}
                      y1={yVal}
                      x2={svgWidth - paddingRight}
                      y2={yVal}
                      stroke="#e2e8f0"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                    <text
                      x={paddingLeft - 10}
                      y={yVal + 4}
                      textAnchor="end"
                      fill="#64748b"
                      fontSize="11"
                      fontWeight="800"
                      className="font-mono"
                    >
                      {labelVal}Kg
                    </text>
                  </g>
                );
              })}

              {/* Area Fills under lines */}
              {pathSampahMasuk && (
                <path
                  d={`${pathSampahMasuk} L ${linePointsWithCoords[linePointsWithCoords.length - 1].x} ${paddingTop + chartH} L ${linePointsWithCoords[0].x} ${paddingTop + chartH} Z`}
                  fill="url(#gradientMasuk)"
                />
              )}
              {pathSampahDiolah && (
                <path
                  d={`${pathSampahDiolah} L ${linePointsWithCoords[linePointsWithCoords.length - 1].x} ${paddingTop + chartH} L ${linePointsWithCoords[0].x} ${paddingTop + chartH} Z`}
                  fill="url(#gradientDiolah)"
                />
              )}

              {/* Line 1: Sampah Masuk (Indigo/Blue) */}
              <path
                d={pathSampahMasuk}
                fill="none"
                stroke="#4f46e5"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Line 2: Sampah Diolah (Emerald/Green) */}
              <path
                d={pathSampahDiolah}
                fill="none"
                stroke="#10b981"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Vertical Guideline & Dots for Hovered Column */}
              {linePointsWithCoords.map((pt, idx) => {
                const isHovered = hoveredLineIndex === idx;
                return (
                  <g
                    key={idx}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredLineIndex(idx)}
                    onMouseLeave={() => setHoveredLineIndex(null)}
                  >
                    {/* Hover vertical column capture region */}
                    <rect
                      x={pt.x - 30}
                      y={paddingTop}
                      width="60"
                      height={chartH}
                      fill="transparent"
                    />

                    {/* Vertical guideline on hover */}
                    {isHovered && (
                      <line
                        x1={pt.x}
                        y1={paddingTop}
                        x2={pt.x}
                        y2={paddingTop + chartH}
                        stroke="#94a3b8"
                        strokeDasharray="2 2"
                        strokeWidth="1.5"
                      />
                    )}

                    {/* Node Circle for Line 1 (Sampah Masuk) */}
                    <circle
                      cx={pt.x}
                      cy={pt.yMasuk}
                      r={isHovered ? "6" : "4.5"}
                      fill="#4f46e5"
                      stroke="#ffffff"
                      strokeWidth="2"
                      className="transition-all duration-150 shadow-md"
                    />

                    {/* Node Circle for Line 2 (Sampah Diolah) */}
                    <circle
                      cx={pt.x}
                      cy={pt.yDiolah}
                      r={isHovered ? "6" : "4.5"}
                      fill="#10b981"
                      stroke="#ffffff"
                      strokeWidth="2"
                      className="transition-all duration-150 shadow-md"
                    />

                    {/* X-Axis Month Label */}
                    <text
                      x={pt.x}
                      y={paddingTop + chartH + 24}
                      textAnchor="middle"
                      fill={isHovered ? "#0f172a" : "#64748b"}
                      fontSize="12"
                      fontWeight={isHovered ? "900" : "700"}
                    >
                      {pt.month}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Interactive Hover Tooltip Box (Styled exactly like Image 2 in TrashCare clean aesthetic) */}
            {hoveredLineIndex !== null && linePointsWithCoords[hoveredLineIndex] && (
              <div
                className="absolute z-20 pointer-events-none bg-slate-900/95 text-white p-3.5 rounded-2xl shadow-xl border border-slate-700 backdrop-blur-xs transition-all duration-150"
                style={{
                  left: `${(linePointsWithCoords[hoveredLineIndex].x / svgWidth) * 100}%`,
                  top: "15%",
                  transform: "translateX(-50%)",
                  minWidth: "160px",
                }}
              >
                <p className="text-xs font-black text-slate-200 border-b border-slate-700/80 pb-1.5 mb-2">
                  {linePointsWithCoords[hoveredLineIndex].fullMonth}
                </p>
                <div className="space-y-1.5 text-xs font-bold">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-indigo-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block"></span>
                      Sampah Masuk
                    </span>
                    <span className="font-mono text-white">
                      {linePointsWithCoords[hoveredLineIndex].sampahMasuk} Kg
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-emerald-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>
                      Sampah Diolah
                    </span>
                    <span className="font-mono text-emerald-400">
                      {linePointsWithCoords[hoveredLineIndex].sampahDiolah} Kg
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Legend matching Image 2 */}
          <div className="flex justify-center items-center gap-6 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800">
              <span className="w-3 h-3 rounded-full bg-indigo-600 inline-block shadow-xs"></span>
              <span>Sampah Masuk</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-xs"></span>
              <span>Sampah Diolah</span>
            </div>
          </div>
        </div>
      ) : chartViewMode === "SEPARATE" ? (
        /* MODE: DUA GRAFIK TERPISAH (Bahan Baku & Hasil Panen) */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Volume Bahan Baku Input (Kg) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 relative">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-slate-800 shadow-2xs"></span>
                <h4 className="font-extrabold text-sm text-slate-800">
                  Grafik 1: Volume Bahan Baku Input (Kg)
                </h4>
              </div>
              <span className="text-[11px] font-black text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                Sumbu Y (Ke Atas): Volume (Kg) ▲
              </span>
            </div>

            <div className="relative flex h-64 pt-6">
              {/* Y-Axis Label & Scale */}
              <div className="flex flex-col justify-between text-[11px] font-black text-slate-600 w-16 pr-3 text-right select-none h-[180px] relative border-r border-slate-200">
                <span className="absolute -top-6 right-2 text-[9.5px] font-extrabold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 uppercase">
                  Kg ▲
                </span>
                <span>{maxBahanBakuVal}</span>
                <span>{Math.round(maxBahanBakuVal * 0.75)}</span>
                <span>{Math.round(maxBahanBakuVal * 0.5)}</span>
                <span>{Math.round(maxBahanBakuVal * 0.25)}</span>
                <span>0</span>
              </div>

              {/* Bars Container */}
              <div className="relative flex-1 h-[180px]">
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  <div className="w-full border-t border-dashed border-slate-200" />
                  <div className="w-full border-t border-dashed border-slate-200" />
                  <div className="w-full border-t border-dashed border-slate-200" />
                  <div className="w-full border-t border-dashed border-slate-200" />
                  <div className="w-full border-b-2 border-slate-400" />
                </div>

                <div className="absolute inset-0 flex justify-around items-end px-4">
                  {Object.entries(programBreakdown).map(([progName, data]) => {
                    const heightInput = Math.min(100, Math.max(8, (data.bahanBaku / maxBahanBakuVal) * 100));
                    const effRatio = data.bahanBaku > 0 ? Math.round((data.hasil / data.bahanBaku) * 100) : 0;

                    return (
                      <div
                        key={progName}
                        onMouseEnter={() => setHoveredChartItem({ progName, bahanBaku: data.bahanBaku, hasil: data.hasil, effRatio })}
                        onMouseLeave={() => setHoveredChartItem(null)}
                        className="flex flex-col justify-end items-center relative w-24 h-full group"
                      >
                        {/* Data Value Badge */}
                        <span className="mb-1.5 bg-slate-900 text-white font-mono font-extrabold text-[11px] px-2 py-0.5 rounded-lg shadow-md border border-slate-700">
                          {data.bahanBaku.toFixed(1)} Kg
                        </span>

                        <div
                          className="w-10 bg-slate-800 rounded-t-xl transition-all duration-300 group-hover:bg-slate-950 group-hover:scale-105 cursor-pointer shadow-md"
                          style={{ height: `${heightInput}%` }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* X-Axis Label */}
            <div className="flex pl-16 pt-2 border-t border-slate-100">
              <div className="flex-1 flex justify-around">
                {Object.keys(programBreakdown).map((progName) => (
                  <div key={progName} className="w-24 text-center text-xs font-black text-slate-800 uppercase tracking-wider">
                    {progName}
                  </div>
                ))}
              </div>
            </div>
            <p className="text-center text-[10.5px] font-extrabold text-slate-500 tracking-wide uppercase pt-1">
              ◄ Sumbu X (Ke Bawah): Kategori Program / Rentang Hari & Minggu ►
            </p>
          </div>

          {/* Chart 2: Hasil Panen Pemanfaatan (Kg) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 relative">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-emerald-500 shadow-2xs"></span>
                <h4 className="font-extrabold text-sm text-slate-800">
                  Grafik 2: Hasil Panen Pemanfaatan (Kg)
                </h4>
              </div>
              <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                Sumbu Y (Ke Atas): Volume (Kg) ▲
              </span>
            </div>

            <div className="relative flex h-64 pt-6">
              {/* Y-Axis Scale */}
              <div className="flex flex-col justify-between text-[11px] font-black text-emerald-700 w-16 pr-3 text-right select-none h-[180px] relative border-r border-emerald-200">
                <span className="absolute -top-6 right-2 text-[9.5px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 uppercase">
                  Kg ▲
                </span>
                <span>{maxHasilVal}</span>
                <span>{Math.round(maxHasilVal * 0.75)}</span>
                <span>{Math.round(maxHasilVal * 0.5)}</span>
                <span>{Math.round(maxHasilVal * 0.25)}</span>
                <span>0</span>
              </div>

              {/* Bars Container */}
              <div className="relative flex-1 h-[180px]">
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  <div className="w-full border-t border-dashed border-emerald-100" />
                  <div className="w-full border-t border-dashed border-emerald-100" />
                  <div className="w-full border-t border-dashed border-emerald-100" />
                  <div className="w-full border-t border-dashed border-emerald-100" />
                  <div className="w-full border-b-2 border-emerald-400" />
                </div>

                <div className="absolute inset-0 flex justify-around items-end px-4">
                  {Object.entries(programBreakdown).map(([progName, data]) => {
                    const heightOutput = Math.min(100, Math.max(8, (data.hasil / maxHasilVal) * 100));
                    const effRatio = data.bahanBaku > 0 ? Math.round((data.hasil / data.bahanBaku) * 100) : 0;

                    return (
                      <div
                        key={progName}
                        onMouseEnter={() => setHoveredChartItem({ progName, bahanBaku: data.bahanBaku, hasil: data.hasil, effRatio })}
                        onMouseLeave={() => setHoveredChartItem(null)}
                        className="flex flex-col justify-end items-center relative w-24 h-full group"
                      >
                        <span className="mb-1.5 bg-emerald-600 text-white font-mono font-extrabold text-[11px] px-2 py-0.5 rounded-lg shadow-md border border-emerald-500">
                          {data.hasil.toFixed(1)} Kg
                        </span>

                        <div
                          className="w-10 bg-gradient-to-t from-emerald-600 via-emerald-500 to-teal-400 rounded-t-xl transition-all duration-300 group-hover:brightness-110 group-hover:scale-105 cursor-pointer shadow-md"
                          style={{ height: `${heightOutput}%` }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* X-Axis Label */}
            <div className="flex pl-16 pt-2 border-t border-slate-100">
              <div className="flex-1 flex justify-around">
                {Object.keys(programBreakdown).map((progName) => (
                  <div key={progName} className="w-24 text-center text-xs font-black text-slate-800 uppercase tracking-wider">
                    {progName}
                  </div>
                ))}
              </div>
            </div>
            <p className="text-center text-[10.5px] font-extrabold text-slate-500 tracking-wide uppercase pt-1">
              ◄ Sumbu X (Ke Bawah): Kategori Program / Rentang Hari & Minggu ►
            </p>
          </div>
        </div>
      ) : (
        /* MODE: COMBINED DUAL-BAR CHART (BAR_COMPARE) */
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6 relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
                <BarChart3 className="text-emerald-600" size={18} />
                Grafik Perbandingan Sirkular Sampah (Input vs Hasil Panen)
              </h3>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80 text-[11px] font-extrabold shrink-0 shadow-2xs">
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80 font-black">
                Sumbu Y (Ke Atas): Volume (Kg) ▲
              </span>
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                <span className="w-3 h-3 rounded-md bg-slate-800 inline-block shadow-2xs"></span>
                <span className="text-slate-800">Bahan Baku (Kg)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-emerald-500 inline-block shadow-2xs"></span>
                <span className="text-emerald-700">Hasil Panen (Kg)</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative flex h-72 pt-6">
              <div className="flex flex-col justify-between text-[11px] font-black text-slate-600 w-16 pr-3 text-right select-none h-[210px] relative border-r border-slate-200">
                <span className="absolute -top-6 right-2 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 uppercase tracking-tight">
                  Kg ▲
                </span>
                <span>{maxChartVal}</span>
                <span>{Math.round(maxChartVal * 0.75)}</span>
                <span>{Math.round(maxChartVal * 0.5)}</span>
                <span>{Math.round(maxChartVal * 0.25)}</span>
                <span>0</span>
              </div>

              <div className="relative flex-1 h-[210px]">
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  <div className="w-full border-t border-dashed border-slate-200" />
                  <div className="w-full border-t border-dashed border-slate-200" />
                  <div className="w-full border-t border-dashed border-slate-200" />
                  <div className="w-full border-t border-dashed border-slate-200" />
                  <div className="w-full border-b-2 border-slate-400" />
                </div>

                <div className="absolute inset-0 flex justify-around items-end px-6">
                  {Object.entries(programBreakdown).map(([progName, data]) => {
                    const heightInput = Math.min(100, Math.max(6, (data.bahanBaku / maxChartVal) * 100));
                    const heightOutput = Math.min(100, Math.max(6, (data.hasil / maxChartVal) * 100));
                    const effRatio = data.bahanBaku > 0 ? Math.round((data.hasil / data.bahanBaku) * 100) : 0;

                    return (
                      <div
                        key={progName}
                        onMouseEnter={() => setHoveredChartItem({ progName, bahanBaku: data.bahanBaku, hasil: data.hasil, effRatio })}
                        onMouseLeave={() => setHoveredChartItem(null)}
                        className="flex flex-col justify-end items-center relative w-44 h-full group cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5 mb-2 transition-transform duration-150 group-hover:scale-105">
                          <span className="bg-slate-900 text-white font-mono font-extrabold text-[11px] px-2 py-0.5 rounded-lg shadow-md border border-slate-700">
                            {data.bahanBaku.toFixed(1)}
                          </span>
                          <span className="bg-emerald-600 text-white font-mono font-extrabold text-[11px] px-2 py-0.5 rounded-lg shadow-md border border-emerald-500">
                            {data.hasil.toFixed(1)}
                          </span>
                          <span className="bg-amber-100 text-amber-900 font-extrabold text-[10px] px-1.5 py-0.5 rounded-lg border border-amber-300 shadow-2xs">
                            {effRatio}%
                          </span>
                        </div>

                        <div className="flex items-end gap-2.5 h-full w-full justify-center">
                          <div
                            className="w-7 bg-slate-800 rounded-t-lg transition-all duration-300 group-hover:bg-slate-950 shadow-md"
                            style={{ height: `${heightInput}%` }}
                          />
                          <div
                            className="w-7 bg-gradient-to-t from-emerald-600 via-emerald-500 to-teal-400 rounded-t-lg transition-all duration-300 group-hover:brightness-110 shadow-md"
                            style={{ height: `${heightOutput}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex pl-16 pt-2 border-t border-slate-100">
              <div className="flex-1 flex justify-around">
                {Object.keys(programBreakdown).map((progName) => (
                  <div key={progName} className="w-44 text-center text-xs font-black text-slate-800 uppercase tracking-wider">
                    {progName}
                  </div>
                ))}
              </div>
            </div>
            <p className="text-center text-[10.5px] font-extrabold text-slate-500 tracking-wide uppercase pt-1">
              ◄ Sumbu X (Ke Bawah): Kategori Program / Rentang Hari & Minggu ►
            </p>
          </div>
        </div>
      )}

      {/* Floating Hover Tooltip When Cursor Touches Bar Chart */}
      {hoveredChartItem && (
        <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl border border-slate-700 flex items-center justify-between gap-6 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black border border-emerald-500/30">
              <BarChart3 size={20} />
            </div>
            <div>
              <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-wider block">Hover Detail Grafik</span>
              <h4 className="text-sm font-extrabold text-white">{hoveredChartItem.progName}</h4>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold">
            <div className="bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
              <span className="text-[10px] text-slate-400 block font-normal">Bahan Baku Input</span>
              <span className="text-white font-mono">{hoveredChartItem.bahanBaku.toFixed(1)} Kg</span>
            </div>
            <div className="bg-emerald-950/80 px-3 py-1.5 rounded-xl border border-emerald-600/50">
              <span className="text-[10px] text-emerald-300 block font-normal">Hasil Panen Output</span>
              <span className="text-emerald-400 font-mono">{hoveredChartItem.hasil.toFixed(1)} Kg</span>
            </div>
            <div className="bg-amber-950/80 px-3 py-1.5 rounded-xl border border-amber-600/50">
              <span className="text-[10px] text-amber-300 block font-normal">Efisiensi Konversi</span>
              <span className="text-amber-400 font-mono">{hoveredChartItem.effRatio}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Search & Multi-Filter Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Cari program, teknologi, bahan baku, RW..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedProgramFilter}
            onChange={(e) => setSelectedProgramFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="ALL">Semua Program</option>
            <option value="BANK_SAMPAH">Bank Sampah</option>
            <option value="KOMPOS">Kompos</option>
            <option value="BURUAN_SAE">Buruan Sae</option>
            <option value="RUMAH_MAGGOT">Rumah Maggot</option>
            <option value="POC">Pupuk Organik Cair (POC)</option>
          </select>

          <select
            value={selectedRwFilter}
            onChange={(e) => setSelectedRwFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="ALL">Semua RW</option>
            {rwOptions.map((rw) => (
              <option key={rw.id} value={rw.id.toString()}>
                {rw.label}
              </option>
            ))}
          </select>

          {(searchQuery || selectedProgramFilter !== "ALL" || selectedRwFilter !== "ALL") && (
            <button
              onClick={resetFilters}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw size={13} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Reports Section with Interval Tabs */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 text-xs font-extrabold text-slate-500 uppercase tracking-wider">
            <Calendar size={14} className="text-emerald-600" />
            <span>Pilihan Interval Laporan:</span>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl gap-1 border border-slate-200/60">
            <button
              onClick={() => setActiveTab("realtime")}
              className={`px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === "realtime" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Realtime ⚡
            </button>
            <button
              onClick={() => setActiveTab("weekly")}
              className={`px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === "weekly" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Mingguan 📅
            </button>
            <button
              onClick={() => setActiveTab("monthly")}
              className={`px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === "monthly" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Bulanan 🗓️
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            <p className="text-xs font-semibold">Memuat laporan sirkular sampah...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16 text-slate-400 border border-dashed border-slate-200 rounded-2xl space-y-2">
            <Archive className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-600">Belum ada data pemanfaatan sampah untuk kriteria ini.</p>
          </div>
        ) : activeTab === "realtime" ? (
          /* Realtime View */
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
                    <th className="py-3 px-4 rounded-l-xl">Program</th>
                    <th className="py-3 px-4">Teknologi</th>
                    <th className="py-3 px-4">Bahan Baku</th>
                    <th className="py-3 px-4 text-center">Volume (Kg)</th>
                    <th className="py-3 px-4 text-center">Hasil Pemanfaatan (Kg)</th>
                    <th className="py-3 px-4">Wilayah RW</th>
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4 text-center rounded-r-xl">Bukti Foto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedItems.map((item) => {
                    const teknoFormatted = (item.teknologi || "Pengolahan Mandiri").replace(/permentasi/gi, "Fermentasi");
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-all group">
                        <td className="py-3.5 px-4 align-middle font-bold text-slate-800">
                          {item.program.replace("_", " ")}
                        </td>
                        <td className="py-3.5 px-4 align-middle font-semibold text-slate-700">
                          {teknoFormatted}
                        </td>
                        <td className="py-3.5 px-4 align-middle">
                          <span className="font-bold text-slate-700">{item.bahanBaku || "Organik"}</span>
                        </td>
                        <td className="py-3.5 px-4 text-center align-middle">
                          <span className="font-mono font-extrabold text-slate-900 text-sm">{Number(item.volumeBahanBaku)}</span>
                        </td>
                        <td className="py-3.5 px-4 text-center align-middle">
                          <span className="font-mono font-extrabold text-emerald-700 text-sm">{Number(item.hasil)}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium align-middle">
                          {item.rw?.name || `RW ${item.rwId}`}
                          {item.rw?.kelurahan?.name && (
                            <span className="block text-[10px] text-slate-400 font-normal">
                              Kel. {item.rw.kelurahan.name}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800 whitespace-nowrap align-middle">
                          {new Date(item.tanggalPencatatan).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-3.5 px-4 text-center align-middle">
                          {item.fotoDokumentasiUrl && item.fotoDokumentasiUrl.trim() !== "" ? (
                            <button
                              onClick={() => setPreviewPhotoUrl(item.fotoDokumentasiUrl)}
                              className="inline-block hover:scale-105 transition-transform cursor-pointer group/img"
                              title="Klik untuk memperbesar foto"
                            >
                              <img
                                src={item.fotoDokumentasiUrl}
                                alt="Bukti Dokumentasi"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.onerror = null;
                                  target.src = "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=300&auto=format&fit=crop&q=80";
                                }}
                                className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-2xs mx-auto group-hover/img:border-emerald-500"
                              />
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/80">
                              Tanpa Foto
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="text-xs text-slate-500 font-semibold">
                Menampilkan{" "}
                <span className="font-bold text-slate-800">
                  {filteredItems.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
                </span>{" "}
                -{" "}
                <span className="font-bold text-slate-800">
                  {Math.min(currentPage * itemsPerPage, filteredItems.length)}
                </span>{" "}
                dari <span className="font-bold text-slate-800">{filteredItems.length}</span> data
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 cursor-pointer focus:outline-none"
                >
                  <option value={5}>5 per halaman</option>
                  <option value={10}>10 per halaman</option>
                  <option value={20}>20 per halaman</option>
                  <option value={50}>50 per halaman</option>
                </select>

                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition cursor-pointer"
                  title="Halaman Sebelumnya"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-bold text-slate-800 px-1">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition cursor-pointer"
                  title="Halaman Selanjutnya"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        ) : activeTab === "weekly" ? (
          /* Weekly View */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
                  <th className="py-3 px-4 rounded-l-xl">Periode Laporan</th>
                  <th className="py-3 px-4">Program</th>
                  <th className="py-3 px-4">Teknologi</th>
                  <th className="py-3 px-4 text-center">Total Bahan Baku (Kg)</th>
                  <th className="py-3 px-4 text-center">Total Hasil Panen (Kg)</th>
                  <th className="py-3 px-4 rounded-r-xl">Wilayah RW</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {getWeeklyGroup().map((w, idx) => {
                  const teknoFormatted = (w.teknologi || "Pengolahan Mandiri").replace(/permentasi/gi, "Fermentasi");
                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-all">
                      <td className="py-3.5 px-4 font-bold text-slate-800 align-middle whitespace-nowrap">
                        {w.label}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800 align-middle">
                        {w.program.replace("_", " ")}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700 align-middle">
                        {teknoFormatted}
                      </td>
                      <td className="py-3.5 px-4 text-center align-middle font-mono font-extrabold text-slate-900 text-sm">
                        {w.volumeBahanBaku.toFixed(1)}
                      </td>
                      <td className="py-3.5 px-4 text-center align-middle font-mono font-extrabold text-emerald-700 text-sm">
                        {w.hasil.toFixed(1)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium align-middle">
                        {w.rwName} {w.kelName && `(Kel. ${w.kelName})`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Monthly View */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
                  <th className="py-3 px-4 rounded-l-xl">Bulan</th>
                  <th className="py-3 px-4">Program</th>
                  <th className="py-3 px-4">Teknologi</th>
                  <th className="py-3 px-4 text-center">Total Bahan Baku (Kg)</th>
                  <th className="py-3 px-4 text-center">Total Hasil Panen (Kg)</th>
                  <th className="py-3 px-4 rounded-r-xl">Wilayah RW</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {getMonthlyGroup().map((m, idx) => {
                  const teknoFormatted = (m.teknologi || "Pengolahan Mandiri").replace(/permentasi/gi, "Fermentasi");
                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-all">
                      <td className="py-3.5 px-4 font-bold text-slate-800 align-middle whitespace-nowrap">
                        {m.label}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800 align-middle">
                        {m.program.replace("_", " ")}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700 align-middle">
                        {teknoFormatted}
                      </td>
                      <td className="py-3.5 px-4 text-center align-middle font-mono font-extrabold text-slate-900 text-sm">
                        {m.volumeBahanBaku.toFixed(1)}
                      </td>
                      <td className="py-3.5 px-4 text-center align-middle font-mono font-extrabold text-emerald-700 text-sm">
                        {m.hasil.toFixed(1)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium align-middle">
                        {m.rwName} {m.kelName && `(Kel. ${m.kelName})`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Photo Preview Lightbox Modal */}
      {previewPhotoUrl && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewPhotoUrl(null)}
        >
          <div className="relative max-w-2xl w-full bg-slate-900 rounded-3xl p-3 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setPreviewPhotoUrl(null)}
              className="absolute top-4 right-4 bg-black/60 text-white p-2 rounded-full hover:bg-black transition cursor-pointer z-10"
            >
              <X size={18} />
            </button>
            <img
              src={previewPhotoUrl}
              alt="Bukti Pemanfaatan Sampah"
              className="w-full h-auto max-h-[80vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default HasilPemanfaatan;
