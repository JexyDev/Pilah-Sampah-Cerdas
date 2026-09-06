/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */

import React, { useEffect, useState, useMemo } from "react";
import api from "../../utils/api";
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

export const HasilPemanfaatan: React.FC = () => {
  const [items, setItems] = useState<PemanfaatanItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Search, Filters & Time Horizons
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProgramFilter, setSelectedProgramFilter] = useState("ALL");
  const [selectedRwFilter, setSelectedRwFilter] = useState("ALL");
  const [activeTab, setActiveTab] = useState<"realtime" | "weekly" | "monthly">("realtime");
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  // Chart View Mode: "SEPARATE" (2 distinct charts) vs "BOTH" (Combined dual bar)
  const [chartViewMode, setChartViewMode] = useState<"SEPARATE" | "BOTH">("SEPARATE");

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

  // Filtered Items Logic
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
          : item.program.toUpperCase().includes(selectedProgramFilter);

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

  // Program Breakdown Aggregation
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

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedProgramFilter("ALL");
    setSelectedRwFilter("ALL");
  };

  // Grouping Helpers for Weekly & Monthly
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
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-800">
      {/* Executive Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold w-fit mb-2 border border-emerald-500/30">
            <Sparkles size={14} /> Analitik Sirkular Sampah
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Hasil Pemanfaatan Sampah</h1>
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

        {/* View Mode Toggle Switch */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60 shrink-0">
          <button
            onClick={() => setChartViewMode("SEPARATE")}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              chartViewMode === "SEPARATE"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            📊 Dua Grafik Terpisah (Bahan Baku & Panen)
          </button>
          <button
            onClick={() => setChartViewMode("BOTH")}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              chartViewMode === "BOTH"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            📈 Grafik Perbandingan (Gabungan)
          </button>
        </div>
      </div>

      {Object.keys(programBreakdown).length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs text-center text-slate-400 text-xs font-semibold">
          Belum ada data grafik untuk kriteria filter ini.
        </div>
      ) : chartViewMode === "SEPARATE" ? (
        /* MODE 1: DUA GRAFIK TERPISAH (Bahan Baku & Hasil Panen) */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Volume Bahan Baku Input (Kg) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-slate-800 shadow-2xs"></span>
                <h4 className="font-extrabold text-sm text-slate-800">
                  Grafik 1: Volume Bahan Baku Input (Kg)
                </h4>
              </div>
              <span className="text-[11px] font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                Satuan Sumbu Y: Kilogram (Kg)
              </span>
            </div>

            <div className="relative flex h-64 pt-6">
              {/* Y-Axis Scale */}
              <div className="flex flex-col justify-between text-[11px] font-black text-slate-500 w-16 pr-3 text-right select-none h-[180px] relative">
                <span className="absolute -top-6 right-2 text-[9.5px] font-extrabold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 uppercase">
                  Kg
                </span>
                <span>{maxBahanBakuVal}</span>
                <span>{Math.round(maxBahanBakuVal * 0.75)}</span>
                <span>{Math.round(maxBahanBakuVal * 0.5)}</span>
                <span>{Math.round(maxBahanBakuVal * 0.25)}</span>
                <span>0</span>
              </div>

              {/* Bars Container */}
              <div className="relative flex-1 h-[180px] border-l-2 border-b-2 border-slate-300">
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  <div className="w-full border-t border-dashed border-slate-200" />
                  <div className="w-full border-t border-dashed border-slate-200" />
                  <div className="w-full border-t border-dashed border-slate-200" />
                  <div className="w-full border-t border-dashed border-slate-200" />
                  <div className="w-full" />
                </div>

                <div className="absolute inset-0 flex justify-around items-end px-4">
                  {Object.entries(programBreakdown).map(([progName, data]) => {
                    const heightInput = Math.min(100, Math.max(8, (data.bahanBaku / maxBahanBakuVal) * 100));

                    return (
                      <div key={progName} className="flex flex-col justify-end items-center relative w-24 h-full group">
                        {/* Data Value Badge */}
                        <span className="mb-1.5 bg-slate-900 text-white font-mono font-extrabold text-[11px] px-2 py-0.5 rounded-lg shadow-md border border-slate-700">
                          {data.bahanBaku.toFixed(1)}
                        </span>

                        <div
                          className="w-10 bg-slate-800 rounded-t-xl transition-all duration-300 hover:bg-slate-950 cursor-pointer shadow-md"
                          style={{ height: `${heightInput}%` }}
                          title={`${progName} Bahan Baku Input: ${data.bahanBaku} Kg`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* X-Axis Labels */}
            <div className="flex pl-16">
              <div className="flex-1 flex justify-around">
                {Object.keys(programBreakdown).map((progName) => (
                  <div key={progName} className="w-24 text-center text-xs font-black text-slate-800 uppercase tracking-wider mt-1">
                    {progName}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chart 2: Hasil Panen Pemanfaatan (Kg) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-emerald-500 shadow-2xs"></span>
                <h4 className="font-extrabold text-sm text-slate-800">
                  Grafik 2: Hasil Panen Pemanfaatan (Kg)
                </h4>
              </div>
              <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Satuan Sumbu Y: Kilogram (Kg)
              </span>
            </div>

            <div className="relative flex h-64 pt-6">
              {/* Y-Axis Scale */}
              <div className="flex flex-col justify-between text-[11px] font-black text-emerald-700 w-16 pr-3 text-right select-none h-[180px] relative">
                <span className="absolute -top-6 right-2 text-[9.5px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 uppercase">
                  Kg
                </span>
                <span>{maxHasilVal}</span>
                <span>{Math.round(maxHasilVal * 0.75)}</span>
                <span>{Math.round(maxHasilVal * 0.5)}</span>
                <span>{Math.round(maxHasilVal * 0.25)}</span>
                <span>0</span>
              </div>

              {/* Bars Container */}
              <div className="relative flex-1 h-[180px] border-l-2 border-b-2 border-emerald-300">
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  <div className="w-full border-t border-dashed border-emerald-100" />
                  <div className="w-full border-t border-dashed border-emerald-100" />
                  <div className="w-full border-t border-dashed border-emerald-100" />
                  <div className="w-full border-t border-dashed border-emerald-100" />
                  <div className="w-full" />
                </div>

                <div className="absolute inset-0 flex justify-around items-end px-4">
                  {Object.entries(programBreakdown).map(([progName, data]) => {
                    const heightOutput = Math.min(100, Math.max(8, (data.hasil / maxHasilVal) * 100));

                    return (
                      <div key={progName} className="flex flex-col justify-end items-center relative w-24 h-full group">
                        <span className="mb-1.5 bg-emerald-600 text-white font-mono font-extrabold text-[11px] px-2 py-0.5 rounded-lg shadow-md border border-emerald-500">
                          {data.hasil.toFixed(1)}
                        </span>

                        <div
                          className="w-10 bg-gradient-to-t from-emerald-600 via-emerald-500 to-teal-400 rounded-t-xl transition-all duration-300 hover:brightness-110 cursor-pointer shadow-md"
                          style={{ height: `${heightOutput}%` }}
                          title={`${progName} Hasil Panen: ${data.hasil} Kg`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* X-Axis Labels */}
            <div className="flex pl-16">
              <div className="flex-1 flex justify-around">
                {Object.keys(programBreakdown).map((progName) => (
                  <div key={progName} className="w-24 text-center text-xs font-black text-slate-800 uppercase tracking-wider mt-1">
                    {progName}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* MODE 2: COMBINED DUAL-BAR CHART */
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
                <BarChart3 className="text-emerald-600" size={18} />
                Grafik Perbandingan Sirkular Sampah (Input vs Hasil Panen)
              </h3>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80 text-[11px] font-extrabold shrink-0 shadow-2xs">
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80 font-black">
                Sumbu Y: Kilogram (Kg)
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
              <div className="flex flex-col justify-between text-[11px] font-black text-slate-500 w-16 pr-3 text-right select-none h-[210px] relative">
                <span className="absolute -top-6 right-2 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 uppercase tracking-tight">
                  Unit (Kg)
                </span>
                <span>{maxChartVal}</span>
                <span>{Math.round(maxChartVal * 0.75)}</span>
                <span>{Math.round(maxChartVal * 0.5)}</span>
                <span>{Math.round(maxChartVal * 0.25)}</span>
                <span>0</span>
              </div>

              <div className="relative flex-1 h-[210px] border-l-2 border-b-2 border-slate-300">
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  <div className="w-full border-t border-dashed border-slate-200" />
                  <div className="w-full border-t border-dashed border-slate-200" />
                  <div className="w-full border-t border-dashed border-slate-200" />
                  <div className="w-full border-t border-dashed border-slate-200" />
                  <div className="w-full" />
                </div>

                <div className="absolute inset-0 flex justify-around items-end px-6">
                  {Object.entries(programBreakdown).map(([progName, data]) => {
                    const heightInput = Math.min(100, Math.max(6, (data.bahanBaku / maxChartVal) * 100));
                    const heightOutput = Math.min(100, Math.max(6, (data.hasil / maxChartVal) * 100));
                    const effRatio = data.bahanBaku > 0 ? Math.round((data.hasil / data.bahanBaku) * 100) : 0;

                    return (
                      <div key={progName} className="flex flex-col justify-end items-center relative w-44 h-full group">
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
                            className="w-7 bg-slate-800 rounded-t-lg transition-all duration-300 hover:bg-slate-950 cursor-pointer shadow-md"
                            style={{ height: `${heightInput}%` }}
                            title={`Bahan Baku Input: ${data.bahanBaku} Kg`}
                          />
                          <div
                            className="w-7 bg-gradient-to-t from-emerald-600 via-emerald-500 to-teal-400 rounded-t-lg transition-all duration-300 hover:brightness-110 cursor-pointer shadow-md"
                            style={{ height: `${heightOutput}%` }}
                            title={`Hasil Panen: ${data.hasil} Kg`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex pl-16">
              <div className="flex-1 flex justify-around">
                {Object.keys(programBreakdown).map((progName) => (
                  <div key={progName} className="w-44 text-center text-xs font-black text-slate-800 uppercase tracking-wider mt-2">
                    {progName}
                  </div>
                ))}
              </div>
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
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
                    <th className="py-3 px-4 rounded-l-xl">Program & Teknologi</th>
                    <th className="py-3 px-4">Bahan Baku</th>
                    <th className="py-3 px-4 text-center">Volume (Kg)</th>
                    <th className="py-3 px-4 text-center">Hasil Pemanfaatan (Kg)</th>
                    <th className="py-3 px-4">Wilayah RW</th>
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4 text-center rounded-r-xl">Bukti Foto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-all group">
                      <td className="py-3.5 px-4 align-middle">
                        <div className="font-bold text-slate-800">{item.program.replace("_", " ")}</div>
                        <div className="text-[11px] text-slate-500 font-medium">{item.teknologi || "Pengolahan Mandiri"}</div>
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
                        {item.fotoDokumentasiUrl ? (
                          <button
                            onClick={() => setPreviewPhotoUrl(item.fotoDokumentasiUrl)}
                            className="inline-block hover:scale-105 transition-transform cursor-pointer"
                            title="Klik untuk memperbesar"
                          >
                            <img
                              src={item.fotoDokumentasiUrl}
                              alt="Bukti Dokumentasi"
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-2xs mx-auto"
                            />
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
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
                  <th className="py-3 px-4 text-center">Total Bahan Baku (Kg)</th>
                  <th className="py-3 px-4 text-center">Total Hasil Panen (Kg)</th>
                  <th className="py-3 px-4 rounded-r-xl">Wilayah RW</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {getWeeklyGroup().map((w, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-all">
                    <td className="py-3.5 px-4 font-bold text-slate-800 align-middle whitespace-nowrap">
                      {w.label}
                    </td>
                    <td className="py-3.5 px-4 align-middle">
                      <div className="font-bold text-slate-800">{w.program.replace("_", " ")}</div>
                      <div className="text-[11px] text-slate-500 font-medium">{w.teknologi}</div>
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
                ))}
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
                  <th className="py-3 px-4 text-center">Total Bahan Baku (Kg)</th>
                  <th className="py-3 px-4 text-center">Total Hasil Panen (Kg)</th>
                  <th className="py-3 px-4 rounded-r-xl">Wilayah RW</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {getMonthlyGroup().map((m, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-all">
                    <td className="py-3.5 px-4 font-bold text-slate-800 align-middle whitespace-nowrap">
                      {m.label}
                    </td>
                    <td className="py-3.5 px-4 align-middle">
                      <div className="font-bold text-slate-800">{m.program.replace("_", " ")}</div>
                      <div className="text-[11px] text-slate-500 font-medium">{m.teknologi}</div>
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
                ))}
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
