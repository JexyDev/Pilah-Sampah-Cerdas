/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */

import React, { useEffect, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import {
  Loader2,
  Medal,
  TrendingUp,
  BarChart2,
  Users,
  Search,
  ArrowUpDown,
  MapPin,
  GraduationCap,
  Trophy,
  RefreshCcw,
  Recycle,
  Activity,
  LayoutList,
  BarChart3,
  CheckCircle2,
  FileText,
  X,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from "recharts";
import { useLeaderboardStore } from "../../store/useLeaderboardStore";
import { useAuthStore } from "../../store/useAuthStore";
import { BarChartRace } from "../../components/BarChartRace";
import { AnalyticsOverviewBoard } from "../../components/analytics/AnalyticsOverviewBoard";
import { Pagination } from "../../components/common/Pagination";
import { EmptyTableState } from "../../components/common/EmptyTableState";

type SystemType = "system1" | "system2";
type System1Tab = "citizens" | "rtrw" | "pengangkut" | "kelurahan" | "overview";
type System2Tab = "students" | "groups";
type ViewMode = "GRID_TABLE" | "CHART_ONLY" | "BOTH";

interface GenericItem {
  id: string;
  rank: number;
  name: string;
  subtitle: string;
  extraInfo?: string;
  points: number;
}

const BAR_COLORS = [
  "#009966",
  "#10b981",
  "#059669",
  "#047857",
  "#3b82f6",
  "#2563eb",
  "#f59e0b",
  "#d97706",
  "#8b5cf6",
  "#6d28d9",
];

const Leaderboard: React.FC = () => {
  const {
    users,
    rtRw,
    pengangkut,
    kknStudents,
    kknGroups,
    isLoading,
    error,
    fetchLeaderboard,
    fetchLeaderboardKkn,
  } = useLeaderboardStore();

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const systemParam = searchParams.get("system") as SystemType;
  const tabParam = searchParams.get("tab");

  const [system, setSystem] = useState<SystemType>(() => {
    if (systemParam === "system1" || systemParam === "system2") return systemParam;
    return "system1";
  });
  const [s1Tab, setS1Tab] = useState<System1Tab>(() => {
    if (systemParam === "system1" && ["citizens", "rtrw", "pengangkut", "kelurahan", "overview"].includes(tabParam || "")) {
      return tabParam as System1Tab;
    }
    return "citizens";
  });
  const [s2Tab, setS2Tab] = useState<System2Tab>(() => {
    if (systemParam === "system2" && ["students", "groups"].includes(tabParam || "")) {
      return tabParam as System2Tab;
    }
    return "students";
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"rank" | "name" | "points" | "subtitle">("rank");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedItem, setSelectedItem] = useState<GenericItem | null>(null);
  const [viewDisplayMode, setViewDisplayMode] = useState<ViewMode>("BOTH");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const systemParam = searchParams.get("system") as SystemType;
    const tabParam = searchParams.get("tab");

    if (systemParam === "system1" || systemParam === "system2") {
      setSystem(systemParam);
      if (systemParam === "system1" && ["citizens", "rtrw", "pengangkut", "kelurahan", "overview"].includes(tabParam || "")) {
        setS1Tab(tabParam as System1Tab);
      } else if (systemParam === "system2" && ["students", "groups"].includes(tabParam || "")) {
        setS2Tab(tabParam as System2Tab);
      }
    }
  }, [location.search]);

  useEffect(() => {
    if (system === "system1") {
      fetchLeaderboard();
    } else {
      fetchLeaderboardKkn();
    }
  }, [system, fetchLeaderboard, fetchLeaderboardKkn]);

  // Reset pagination when tab/system/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [system, s1Tab, s2Tab, searchTerm]);

  const { user } = useAuthStore();
  const isLurah = (user?.role || user?.peran || "").toUpperCase() === "LURAH";
  const userKelurahan = user?.kelurahan || (user?.address?.includes("Cipaganti") || user?.name?.includes("Cipaganti") ? "Cipaganti" : "Cipaganti");

  // ALL HOOKS MUST RUN UNCONDITIONALLY BEFORE ANY COMPUTATION OR RETURN
  const currentData: GenericItem[] = useMemo(() => {
    let raw: GenericItem[] = [];
    if (system === "system1") {
      if (s1Tab === "citizens") {
        raw = users.map((u, i) => ({
          id: u.id,
          rank: u.rank || i + 1,
          name: u.name,
          subtitle: u.wilayah || "-",
          points: u.points,
        }));
        if (isLurah && userKelurahan) {
          const filtered = raw.filter((u) => (u.subtitle || "").toLowerCase().includes(userKelurahan.toLowerCase()));
          if (filtered.length > 0) raw = filtered.map((u, idx) => ({ ...u, rank: idx + 1 }));
        }
      } else if (s1Tab === "rtrw") {
        raw = rtRw.map((r, i) => ({
          id: r.rtRwId || i.toString(),
          rank: i + 1,
          name: r.rtRwName,
          subtitle: r.kelurahanName,
          points: r.totalPoints,
        }));
        if (isLurah && userKelurahan) {
          const filtered = raw.filter((r) => (r.subtitle || "").toLowerCase().includes(userKelurahan.toLowerCase()));
          if (filtered.length > 0) raw = filtered.map((r, idx) => ({ ...r, rank: idx + 1 }));
        }
      } else if (s1Tab === "pengangkut") {
        raw = pengangkut.map((p, i) => ({
          id: p.id,
          rank: i + 1,
          name: p.name,
          subtitle: p.wilayah,
          points: p.totalPoints,
        }));
      }
    } else {
      if (s2Tab === "students") {
        raw = kknStudents.map((s, i) => {
          const rawK = s.kelompok || "Mahasiswa KKN";
          const cleanK = rawK.trim().toLowerCase().startsWith("kelompok")
            ? rawK.trim()
            : `Kelompok ${rawK.trim()}`;
          return {
            id: s.id,
            rank: i + 1,
            name: s.name,
            subtitle: cleanK,
            extraInfo: `Tempat Sampah Aktif: ${s.activeBins} | Jam Kerja: ${s.totalHours} jam`,
            points: s.finalScore,
          };
        });
      } else if (s2Tab === "groups") {
        raw = kknGroups.map((g, i) => {
          const rawG = g.name || `Kelompok ${i + 1}`;
          const cleanG = rawG.trim().toLowerCase().startsWith("kelompok")
            ? rawG.trim()
            : `Kelompok ${rawG.trim()}`;
          return {
            id: g.id,
            rank: i + 1,
            name: cleanG,
            subtitle: g.dplName ? `${g.dplName} (${g.membersCount} anggota)` : `${g.membersCount} anggota`,
            points: g.avgScore,
          };
        });
      }
    }

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      raw = raw.filter(
        (u) =>
          u.name.toLowerCase().includes(lowerSearch) ||
          u.subtitle.toLowerCase().includes(lowerSearch)
      );
    }

    return raw.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "rank") comparison = a.rank - b.rank;
      else if (sortBy === "name") comparison = a.name.localeCompare(b.name);
      else if (sortBy === "points") comparison = a.points - b.points;
      else if (sortBy === "subtitle") comparison = a.subtitle.localeCompare(b.subtitle);

      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [system, s1Tab, s2Tab, users, rtRw, pengangkut, kknStudents, kknGroups, searchTerm, sortBy, sortOrder]);

  const totalPages = useMemo(() => {
    return Math.ceil(currentData.length / itemsPerPage);
  }, [currentData, itemsPerPage]);

  const paginatedData = useMemo(() => {
    return currentData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [currentData, currentPage, itemsPerPage]);

  const stats = useMemo(() => {
    const total = currentData.length;
    const totalPoints = currentData.reduce((acc, u) => acc + u.points, 0);
    const avgPoints = total > 0 ? Math.round(totalPoints / total) : 0;
    return { total, totalPoints, avgPoints };
  }, [currentData]);

  // Labels and Meta based on active tabs
  let pageTitle = "";
  let pageSubtitle = "";
  let nameHeader = "";
  let subtitleHeader = "";
  let extraInfoHeader = "";
  let pointsLabel = "Total Poin";

  if (system === "system1") {
    if (s1Tab === "citizens") {
      pageTitle = "Peringkat Warga";
      pageSubtitle = "Pemeringkatan warga berdasarkan tingkat kepatuhan pemilahan sampah organik dan anorganik";
      nameHeader = "Nama Warga";
      subtitleHeader = "Wilayah";
      pointsLabel = "Total Poin";
    } else if (s1Tab === "rtrw") {
      pageTitle = "Peringkat Rukun Warga";
      pageSubtitle = "Akumulasi poin kepatuhan pemilahan sampah tingkat rukun warga";
      nameHeader = "Rukun Warga";
      subtitleHeader = "Kelurahan";
      pointsLabel = "Total Poin";
    } else if (s1Tab === "pengangkut") {
      pageTitle = "Peringkat Petugas Pemilah";
      pageSubtitle = "Peringkat berdasarkan jumlah tugas selesai, kecepatan respons, dan tingkat keberhasilan";
      nameHeader = "Nama Petugas";
      subtitleHeader = "Wilayah";
      pointsLabel = "Skor Komposit";
    }
  } else {
    if (s2Tab === "students") {
      pageTitle = "Peringkat Mahasiswa KKN";
      pageSubtitle = "Skor akhir dihitung dari jam kerja (40%), tempat sampah aktif (30%), dan nilai DPL (30%)";
      nameHeader = "Nama Mahasiswa";
      subtitleHeader = "Kelompok KKN";
      extraInfoHeader = "Kinerja";
      pointsLabel = "Skor Akhir";
    } else if (s2Tab === "groups") {
      pageTitle = "Peringkat Kelompok KKN";
      pageSubtitle = "Rata-rata skor akhir seluruh anggota kelompok KKN";
      nameHeader = "Nama Kelompok";
      subtitleHeader = "Jumlah Anggota";
      pointsLabel = "Rata-rata Skor";
    }
  }

  const toggleSort = (field: "rank" | "name" | "points" | "subtitle") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const top3 = currentData.slice(0, 3);
  const top10ChartData = currentData.slice(0, 10).map((item) => ({
    name: item.name.length > 14 ? item.name.substring(0, 12) + "..." : item.name,
    fullName: item.name,
    points: Math.round(item.points),
    rank: item.rank,
    subtitle: item.subtitle,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs space-y-1">
          <p className="font-black text-amber-400">Peringkat #{data.rank}</p>
          <p className="font-bold text-sm">{data.fullName}</p>
          <p className="text-[11px] text-slate-300">{data.subtitle}</p>
          <div className="border-t border-slate-800 pt-1 mt-1 font-mono text-emerald-400 font-extrabold">
            {data.points.toLocaleString("id-ID")} {pointsLabel}
          </div>
        </div>
      );
    }
    return null;
  };

  // CONDITIONAL RENDERING FOR LOADING / ERROR (AFTER ALL HOOKS HAVE INITIALIZED)
  if (isLoading && users.length === 0 && kknStudents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="animate-spin text-[#009966]" size={36} />
        <p className="text-xs font-bold text-slate-500">Memuat data peringkat...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto my-12 text-center p-8 bg-rose-50 text-rose-700 rounded-2xl border border-rose-200 shadow-sm space-y-4">
        <p className="font-bold text-sm">Gagal memuat data peringkat: {error}</p>
        <button
          className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-extrabold text-xs shadow-sm cursor-pointer transition-all"
          onClick={() => (system === "system1" ? fetchLeaderboard() : fetchLeaderboardKkn())}
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto animate-fade-in">
      {/* 1. HEADER BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shrink-0 font-bold">
            <Trophy size={24} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              Peringkat Warga
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Pemeringkatan berdasarkan tingkat <strong className="text-slate-600">kepatuhan pemilahan sampah</strong> di wilayah Coblong.
            </p>
          </div>
        </div>

        <button
          onClick={() => (system === "system1" ? fetchLeaderboard() : fetchLeaderboardKkn())}
          disabled={isLoading}
          className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all cursor-pointer font-bold text-xs flex items-center gap-1.5 shadow-2xs"
          title="Muat Ulang Data"
        >
          <RefreshCcw size={15} className={isLoading ? "animate-spin text-[#009966]" : ""} />
          <span className="hidden sm:inline">Muat Ulang</span>
        </button>
      </div>

      {/* 2. SYSTEM TOGGLE + SUB-TABS */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        {/* System Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSystem("system1");
                setSearchTerm("");
              }}
              className={`px-4 py-2 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                system === "system1"
                  ? "bg-[#009966] text-white shadow-2xs"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60"
              }`}
            >
              <Users size={14} /> Warga dan Wilayah
            </button>
            <button
              onClick={() => {
                setSystem("system2");
                setSearchTerm("");
              }}
              className={`px-4 py-2 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                system === "system2"
                  ? "bg-[#009966] text-white shadow-2xs"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60"
              }`}
            >
              <GraduationCap size={14} /> Program KKN
            </button>
          </div>

          {/* View Mode Toggle (Visual Chart vs Table vs Both) */}
          {system === "system1" && !["kelurahan", "overview"].includes(s1Tab) && (
            <div className="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 self-start sm:self-auto">
              <button
                onClick={() => setViewDisplayMode("BOTH")}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewDisplayMode === "BOTH"
                    ? "bg-white text-slate-900 shadow-2xs border border-slate-200/60"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="Tampilkan Grafik & Tabel"
              >
                <BarChart3 size={13} className="text-[#009966]" />
                <span className="hidden md:inline">Grafik &amp; Tabel</span>
              </button>
              <button
                onClick={() => setViewDisplayMode("CHART_ONLY")}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewDisplayMode === "CHART_ONLY"
                    ? "bg-white text-slate-900 shadow-2xs border border-slate-200/60"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="Tampilkan Grafik Saja"
              >
                <BarChart3 size={13} className="text-amber-500" />
                <span className="hidden md:inline">Grafik</span>
              </button>
              <button
                onClick={() => setViewDisplayMode("GRID_TABLE")}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewDisplayMode === "GRID_TABLE"
                    ? "bg-white text-slate-900 shadow-2xs border border-slate-200/60"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="Tampilkan Tabel Saja"
              >
                <LayoutList size={13} className="text-blue-600" />
                <span className="hidden md:inline">Tabel</span>
              </button>
            </div>
          )}
        </div>

        {/* Sub-Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {system === "system1" ? (
            <>
              {[
                { id: "citizens" as System1Tab, label: "Warga", icon: Users },
                { id: "rtrw" as System1Tab, label: "Rukun Warga", icon: MapPin },
                { id: "pengangkut" as System1Tab, label: "Petugas Pemilah", icon: TrendingUp },
                { id: "kelurahan" as System1Tab, label: "Kelurahan", icon: BarChart2 },
                { id: "overview" as System1Tab, label: "Rekap Wilayah", icon: Activity },
              ].map((tab) => {
                const TabIcon = tab.icon;
                const active = s1Tab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setS1Tab(tab.id);
                      setSearchTerm("");
                    }}
                    className={`px-4 py-2 rounded-xl font-extrabold text-xs transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                      active
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                    }`}
                  >
                    <TabIcon size={14} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </>
          ) : (
            <>
              {[
                { id: "students" as System2Tab, label: "Mahasiswa", icon: Users },
                { id: "groups" as System2Tab, label: "Kelompok KKN", icon: GraduationCap },
              ].map((tab) => {
                const TabIcon = tab.icon;
                const active = s2Tab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setS2Tab(tab.id);
                      setSearchTerm("");
                    }}
                    className={`px-4 py-2 rounded-xl font-extrabold text-xs transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                      active
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                    }`}
                  >
                    <TabIcon size={14} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* 3. CONTENT AREA */}
      {system === "system1" && s1Tab === "overview" ? (
        <AnalyticsOverviewBoard />
      ) : system === "system1" && s1Tab === "kelurahan" ? (
        <BarChartRace />
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black border border-amber-200">
                <Trophy size={20} />
              </div>
              <div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Total Peserta</p>
                <p className="text-xl font-black text-slate-800">{stats.total} <span className="text-xs text-slate-400 font-bold">orang</span></p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#009966] flex items-center justify-center font-black border border-emerald-200">
                <Recycle size={20} />
              </div>
              <div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Rata-rata Poin</p>
                <p className="text-xl font-black text-slate-800">{stats.avgPoints.toLocaleString("id-ID")} <span className="text-xs text-slate-400 font-bold">poin</span></p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-black border border-sky-200">
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Akumulasi Poin</p>
                <p className="text-xl font-black text-slate-800">{Math.round(stats.totalPoints).toLocaleString("id-ID")} <span className="text-xs text-slate-400 font-bold">poin</span></p>
              </div>
            </div>
          </div>

          {/* Page Title */}
          <div className="text-center space-y-1 py-2">
            <h2 className="text-xl font-black text-slate-800">{pageTitle}</h2>
            <p className="text-slate-500 text-xs font-semibold">{pageSubtitle}</p>
          </div>

          {/* Top 3 Podium Cards */}
          {top3.length > 0 && (
            <div className="flex flex-col md:flex-row justify-center items-end gap-4 md:gap-6 pt-6 pb-2">
              {top3.map((u) => {
                const isFirst = u.rank === 1;
                const isSecond = u.rank === 2;

                const heightClass = isFirst ? "h-56" : isSecond ? "h-48" : "h-40";
                const colorClass = isFirst
                  ? "from-amber-400 to-amber-500"
                  : isSecond
                  ? "from-slate-300 to-slate-400"
                  : "from-amber-600 to-orange-500";
                const medalColor = isFirst ? "#FDE047" : isSecond ? "#E5E7EB" : "#FDBA74";

                return (
                  <div
                    key={u.id}
                    onClick={() => setSelectedItem(u)}
                    className={`w-full md:w-60 flex flex-col items-center justify-end relative cursor-pointer group transition-transform hover:-translate-y-1 order-${
                      isFirst ? "2" : isSecond ? "1" : "3"
                    }`}
                  >
                    <div className="absolute -top-10 z-10 flex flex-col items-center">
                      <Medal color={medalColor} size={40} className="drop-shadow-md group-hover:scale-110 transition" />
                      <span className="font-extrabold text-slate-800 bg-white px-2.5 py-0.5 rounded-full text-[11px] shadow-sm border border-slate-200 mt-[-8px]">
                        Peringkat {u.rank}
                      </span>
                    </div>
                    <div
                      className={`w-full rounded-2xl bg-gradient-to-t ${colorClass} p-4 text-center shadow-md flex flex-col justify-end ${heightClass} group-hover:shadow-xl transition`}
                    >
                      <h3 className="font-black text-white text-sm truncate drop-shadow-md">{u.name}</h3>
                      <p className="text-white/90 font-extrabold text-xs mt-1">
                        {Math.round(u.points).toLocaleString("id-ID")}{" "}
                        <span className="text-[10px] font-bold text-white/80">Poin</span>
                      </p>
                      <span className="text-[10px] text-white/90 font-extrabold mt-2 underline opacity-0 group-hover:opacity-100 transition">
                        Lihat Detail →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VISUAL RECHARTS BAR CHART PANEL (Bentuk Chart UI) */}
          {(viewDisplayMode === "BOTH" || viewDisplayMode === "CHART_ONLY") && top10ChartData.length > 0 && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#009966] flex items-center justify-center border border-emerald-200 shrink-0">
                    <BarChart3 size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-slate-800 tracking-tight">
                      Grafik Perbandingan Top 10 — {pageTitle}
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold">
                      Visualisasi batang distribusi perolehan {pointsLabel.toLowerCase()} peserta terbaik
                    </p>
                  </div>
                </div>
                <span className="text-[11px] bg-emerald-50 text-[#009966] px-3 py-1 rounded-full font-black border border-emerald-200">
                  Real-time DB
                </span>
              </div>

              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={top10ChartData} margin={{ top: 20, right: 20, left: 0, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "#64748b", fontSize: 11, fontWeight: 700 }}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis
                      tick={{ fill: "#64748b", fontSize: 11, fontWeight: 700 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="points" radius={[8, 8, 0, 0]} maxBarSize={48}>
                      {top10ChartData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* TABLE DISPLAY PANEL WITH STANDARDIZED PAGINATION */}
          {(viewDisplayMode === "BOTH" || viewDisplayMode === "GRID_TABLE") && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between">
              <div>
                {/* Search Toolbar */}
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    <input
                      type="text"
                      placeholder="Cari nama atau wilayah..."
                      className="w-full bg-slate-50/50 border border-slate-200 pl-10 pr-4 py-2 rounded-xl text-xs font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#009966] transition-all"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="text-xs text-slate-500 font-semibold">
                    Total <strong className="text-slate-800 font-black">{currentData.length}</strong> data peserta
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100 text-xs text-left">
                    <thead className="bg-slate-50/80 text-[10.5px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-200">
                      <tr>
                        <th
                          className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors w-20"
                          onClick={() => toggleSort("rank")}
                        >
                          <div className="flex items-center gap-1.5">Peringkat <ArrowUpDown size={13} /></div>
                        </th>
                        <th
                          className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                          onClick={() => toggleSort("name")}
                        >
                          <div className="flex items-center gap-1.5">{nameHeader} <ArrowUpDown size={13} /></div>
                        </th>
                        <th
                          className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                          onClick={() => toggleSort("subtitle")}
                        >
                          <div className="flex items-center gap-1.5">{subtitleHeader} <ArrowUpDown size={13} /></div>
                        </th>
                        {extraInfoHeader && (
                          <th className="py-3.5 px-4">{extraInfoHeader}</th>
                        )}
                        <th
                          className="py-3.5 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                          onClick={() => toggleSort("points")}
                        >
                          <div className="flex items-center justify-end gap-1.5">
                            <ArrowUpDown size={13} /> {pointsLabel}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {paginatedData.length === 0 ? (
                        <EmptyTableState
                          colSpan={extraInfoHeader ? 5 : 4}
                          entityName="Peringkat Leaderboard"
                          isSearch={!!searchTerm}
                          searchQuery={searchTerm}
                          onResetSearch={() => setSearchTerm("")}
                        />
                      ) : (
                        paginatedData.map((u) => {
                          const isSelected = selectedItem?.id === u.id;
                          return (
                            <tr
                              key={u.id}
                              onClick={() => setSelectedItem(u)}
                              className={`transition-colors cursor-pointer ${
                                isSelected ? "bg-amber-50/60 font-semibold" : "hover:bg-slate-50/80"
                              }`}
                            >
                              <td className="py-3.5 px-4 font-black text-slate-700">
                                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-[11px] font-black ${
                                  u.rank === 1 ? "bg-amber-100 text-amber-700 border border-amber-200" :
                                  u.rank === 2 ? "bg-slate-100 text-slate-600 border border-slate-200" :
                                  u.rank === 3 ? "bg-orange-100 text-orange-700 border border-orange-200" :
                                  "bg-slate-50 text-slate-500"
                                }`}>
                                  {u.rank}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 font-bold text-slate-800">{u.name}</td>
                              <td className="py-3.5 px-4 text-slate-600 font-semibold">{u.subtitle || "-"}</td>
                              {extraInfoHeader && (
                                <td className="py-3.5 px-4 text-slate-600 font-medium text-[11px]">{u.extraInfo || "-"}</td>
                              )}
                              <td className="py-3.5 px-4 font-black text-[#009966] text-right text-sm">
                                {Math.round(u.points).toLocaleString("id-ID")}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Standard TrashCare Pagination Bar */}
              {currentData.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={currentData.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={setItemsPerPage}
                  itemsPerPageOptions={[10, 25, 50, 100]}
                />
              )}
            </div>
          )}
        </>
      )}

      {/* MODAL DETAIL POP-UP (PREMIUM TRASHCARE UX & TYPOGRAPHY) */}
      {selectedItem && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in zoom-in-95 duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-slate-100">
            {/* Header Modal */}
            <div className="p-5 bg-gradient-to-r from-[#f0faf4] via-[#e5f7ed]/70 to-white border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#009966]/10 text-[#009966] flex items-center justify-center border border-[#009966]/20 font-bold shrink-0">
                  <Trophy size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800 tracking-tight leading-snug">
                    Detail Peringkat Peserta
                  </h3>
                  <p className="text-[11px] text-slate-500 font-semibold">
                    Informasi perolehan poin &amp; posisi peringkat
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
                title="Tutup"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs text-slate-700">
              {/* User Hero Banner */}
              <div className="flex items-center gap-3.5 p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 text-white flex items-center justify-center font-black text-lg shadow-2xs border border-white shrink-0">
                  #{selectedItem.rank}
                </div>
                <div className="min-w-0">
                  <h4 className="font-black text-slate-800 text-base truncate">{selectedItem.name}</h4>
                  <p className="text-xs text-slate-500 font-semibold truncate">{selectedItem.subtitle}</p>
                </div>
              </div>

              {/* Data Grid Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                  <span className="text-[10.5px] font-black text-slate-400 uppercase tracking-wider block">
                    Perolehan Poin
                  </span>
                  <span className="font-mono font-black text-[#009966] text-lg block">
                    {Math.round(selectedItem.points).toLocaleString("id-ID")}{" "}
                    <span className="text-xs font-bold text-slate-400">Poin</span>
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                  <span className="text-[10.5px] font-black text-slate-400 uppercase tracking-wider block">
                    Posisi Peringkat
                  </span>
                  <span className="font-extrabold text-slate-800 text-sm flex items-center gap-1 mt-1">
                    <CheckCircle2 size={15} className="text-[#009966]" /> Peringkat #{selectedItem.rank}
                  </span>
                </div>
              </div>

              {/* Extra Info (If Available) */}
              {selectedItem.extraInfo && (
                <div className="p-3.5 bg-sky-50/60 rounded-2xl border border-sky-200/80 space-y-1">
                  <span className="text-[10.5px] font-black text-sky-700 uppercase tracking-wider block flex items-center gap-1">
                    <FileText size={13} /> Metrik Kinerja Tambahan
                  </span>
                  <p className="text-xs font-bold text-slate-700 leading-relaxed">{selectedItem.extraInfo}</p>
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/80 flex justify-end">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-2xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
