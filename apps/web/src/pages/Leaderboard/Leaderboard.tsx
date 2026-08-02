/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */

import React, { useEffect, useState } from "react";
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
} from "lucide-react";
import { useLeaderboardStore } from "../../store/useLeaderboardStore";
import { Badge } from "../../components/common/Badge";
import { BarChartRace } from "../../components/BarChartRace";

type SystemType = "system1" | "system2";
type System1Tab = "citizens" | "rtrw" | "pengangkut" | "kelurahan";
type System2Tab = "students" | "groups";

interface GenericItem {
  id: string;
  rank: number;
  name: string;
  subtitle: string;
  extraInfo?: string;
  points: number;
}

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
    if (systemParam === "system1" && ["citizens", "rtrw", "pengangkut", "kelurahan"].includes(tabParam || "")) {
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

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const systemParam = searchParams.get("system") as SystemType;
    const tabParam = searchParams.get("tab");

    if (systemParam === "system1" || systemParam === "system2") {
      setSystem(systemParam);
      if (systemParam === "system1" && ["citizens", "rtrw", "pengangkut", "kelurahan"].includes(tabParam || "")) {
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

  if (isLoading && users.length === 0 && kknStudents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="animate-spin text-primary" size={36} />
        <p className="text-xs font-bold text-slate-500">Memuat papan peringkat...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto my-12 text-center p-8 bg-rose-50 text-rose-700 rounded-2xl border border-rose-200 shadow-sm space-y-4">
        <p className="font-bold text-sm">Gagal memuat papan peringkat: {error}</p>
        <button
          className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-extrabold text-xs shadow-sm cursor-pointer transition-all"
          onClick={() => (system === "system1" ? fetchLeaderboard() : fetchLeaderboardKkn())}
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  let currentData: GenericItem[] = [];
  let pageTitle = "";
  let pageSubtitle = "";
  let nameHeader = "";
  let subtitleHeader = "";
  let extraInfoHeader = "";

  if (system === "system1") {
    if (s1Tab === "citizens") {
      currentData = users.map((u, i) => ({
        id: u.id,
        rank: u.rank || i + 1,
        name: u.name,
        subtitle: u.wilayah || "-",
        points: u.points,
      }));
      pageTitle = "Papan Peringkat Warga";
      pageSubtitle = "Peringkat warga berdasarkan kontribusi pemilahan sampah organik & anorganik";
      nameHeader = "Nama Warga";
      subtitleHeader = "Wilayah RT/RW";
    } else if (s1Tab === "rtrw") {
      currentData = rtRw.map((r, i) => ({
        id: r.rtRwId || i.toString(),
        rank: i + 1,
        name: r.rtRwName,
        subtitle: r.kelurahanName,
        points: r.totalPoints,
      }));
      pageTitle = "Papan Peringkat RT/RW";
      pageSubtitle = "Akumulasi poin kebersihan lingkungan tingkat rukun tetangga & warga";
      nameHeader = "Wilayah RT/RW";
      subtitleHeader = "Kelurahan";
    } else if (s1Tab === "pengangkut") {
      currentData = pengangkut.map((p, i) => ({
        id: p.id,
        rank: i + 1,
        name: p.name,
        subtitle: p.wilayah,
        points: p.totalPoints,
      }));
      pageTitle = "Papan Peringkat Petugas Residu";
      pageSubtitle = "Metrik pengangkutan residu & pemilahan bersih oleh petugas";
      nameHeader = "Nama Petugas";
      subtitleHeader = "Wilayah RT/RW";
    }
  } else {
    if (s2Tab === "students") {
      currentData = kknStudents.map((s, i) => ({
        id: s.id,
        rank: i + 1,
        name: s.name,
        subtitle: `Kelompok: ${s.kelompok}`,
        extraInfo: `Tong Aktif: ${s.activeBins} | Jam Kerja: ${s.totalHours} jam`,
        points: s.finalScore,
      }));
      pageTitle = "Papan Peringkat Mahasiswa KKN";
      pageSubtitle = "Skor Akhir = (Jam Kerja * 0.4) + (Tong Aktif * 0.3) + (Nilai DPL * 0.3)";
      nameHeader = "Nama Mahasiswa";
      subtitleHeader = "Kelompok KKN";
      extraInfoHeader = "Metrik Kinerja";
    } else if (s2Tab === "groups") {
      currentData = kknGroups.map((g, i) => ({
        id: g.id,
        rank: i + 1,
        name: g.name,
        subtitle: `Anggota: ${g.membersCount} orang`,
        points: g.avgScore,
      }));
      pageTitle = "Papan Peringkat Kelompok KKN";
      pageSubtitle = "Rata-rata Skor Akhir dari seluruh anggota kelompok KKN";
      nameHeader = "Nama Kelompok";
      subtitleHeader = "Jumlah Anggota";
    }
  }

  if (searchTerm) {
    const lowerSearch = searchTerm.toLowerCase();
    currentData = currentData.filter(
      (u) =>
        u.name.toLowerCase().includes(lowerSearch) ||
        u.subtitle.toLowerCase().includes(lowerSearch)
    );
  }

  currentData = currentData.sort((a, b) => {
    let comparison = 0;
    if (sortBy === "rank") comparison = a.rank - b.rank;
    else if (sortBy === "name") comparison = a.name.localeCompare(b.name);
    else if (sortBy === "points") comparison = a.points - b.points;
    else if (sortBy === "subtitle") comparison = a.subtitle.localeCompare(b.subtitle);

    return sortOrder === "asc" ? comparison : -comparison;
  });

  const toggleSort = (field: "rank" | "name" | "points" | "subtitle") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const top3 = currentData.slice(0, 3);
  const rest = currentData.slice(3);

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Papan Peringkat (Leaderboard)</h1>
            <span className="bg-amber-50 text-amber-600 border border-amber-200 text-xs px-2.5 py-1 rounded-full font-extrabold flex items-center gap-1">
              <Trophy size={13} /> Prestasi Lingkungan
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Penghargaan & pemeringkatan apresiasi atas kontribusi nyata pemilahan sampah di Coblong.
          </p>
        </div>

        {/* System Selector Toggle */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            onClick={() => {
              setSystem("system1");
              setSearchTerm("");
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              system === "system1" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Users size={14} /> Warga & Wilayah
          </button>
          <button
            onClick={() => {
              setSystem("system2");
              setSearchTerm("");
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              system === "system2" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <GraduationCap size={14} /> KKN Cerdas
          </button>
        </div>
      </div>

      {/* Tab Switcher depending on System */}
      <div className="flex justify-center border-b border-slate-200 overflow-x-auto pb-1 gap-2">
        {system === "system1" ? (
          <>
            <button
              onClick={() => setS1Tab("citizens")}
              className={`flex items-center gap-2 px-5 py-2.5 border-b-2 text-xs font-extrabold transition-all cursor-pointer ${
                s1Tab === "citizens" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <Users size={15} /> Warga
            </button>
            <button
              onClick={() => setS1Tab("rtrw")}
              className={`flex items-center gap-2 px-5 py-2.5 border-b-2 text-xs font-extrabold transition-all cursor-pointer ${
                s1Tab === "rtrw" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <MapPin size={15} /> RT / RW
            </button>
            <button
              onClick={() => setS1Tab("pengangkut")}
              className={`flex items-center gap-2 px-5 py-2.5 border-b-2 text-xs font-extrabold transition-all cursor-pointer ${
                s1Tab === "pengangkut" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <TrendingUp size={15} /> Petugas Residu
            </button>
            <button
              onClick={() => setS1Tab("kelurahan")}
              className={`flex items-center gap-2 px-5 py-2.5 border-b-2 text-xs font-extrabold transition-all cursor-pointer ${
                s1Tab === "kelurahan" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <BarChart2 size={15} /> Persaingan Kelurahan
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setS2Tab("students")}
              className={`flex items-center gap-2 px-5 py-2.5 border-b-2 text-xs font-extrabold transition-all cursor-pointer ${
                s2Tab === "students" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <Users size={15} /> Individu Mahasiswa
            </button>
            <button
              onClick={() => setS2Tab("groups")}
              className={`flex items-center gap-2 px-5 py-2.5 border-b-2 text-xs font-extrabold transition-all cursor-pointer ${
                s2Tab === "groups" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <GraduationCap size={15} /> Kelompok KKN
            </button>
          </>
        )}
      </div>

      {system === "system1" && s1Tab === "kelurahan" ? (
        <BarChartRace />
      ) : (
        <>
          <div className="text-center space-y-1 py-2">
            <h2 className="text-xl font-black text-slate-900">{pageTitle}</h2>
            <p className="text-slate-500 text-xs font-medium">{pageSubtitle}</p>
          </div>

          {/* Top 3 Podium Cards */}
          {top3.length > 0 && (
            <div className="flex flex-col md:flex-row justify-center items-end gap-4 md:gap-6 pt-6 pb-2">
              {top3.map((u) => {
                const isFirst = u.rank === 1;
                const isSecond = u.rank === 2;

                let heightClass = isFirst ? "h-56" : isSecond ? "h-48" : "h-40";
                let colorClass = isFirst
                  ? "from-amber-400 to-amber-500"
                  : isSecond
                  ? "from-slate-300 to-slate-400"
                  : "from-amber-600 to-orange-500";
                let medalColor = isFirst ? "#FDE047" : isSecond ? "#E5E7EB" : "#FDBA74";

                return (
                  <div
                    key={u.id}
                    className={`w-full md:w-60 flex flex-col items-center justify-end relative order-${
                      isFirst ? "2" : isSecond ? "1" : "3"
                    }`}
                  >
                    <div className="absolute -top-10 z-10 flex flex-col items-center">
                      <Medal color={medalColor} size={40} className="drop-shadow-md" />
                      <span className="font-extrabold text-slate-800 bg-white px-2.5 py-0.5 rounded-full text-[11px] shadow-sm border border-slate-200 mt-[-8px]">
                        Juara {u.rank}
                      </span>
                    </div>
                    <div
                      className={`w-full rounded-2xl bg-gradient-to-t ${colorClass} p-4 text-center shadow-md flex flex-col justify-end ${heightClass}`}
                    >
                      <h3 className="font-black text-white text-sm truncate drop-shadow-md">{u.name}</h3>
                      <p className="text-white/90 font-extrabold text-xs mt-1">
                        {Math.round(u.points).toLocaleString("id-ID")}{" "}
                        <span className="text-[10px] font-bold text-white/80">
                          {system === "system2" ? "Skor" : "Pts"}
                        </span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Search & Stats Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Cari peringkat..."
                className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="text-xs text-slate-500 font-bold">
              Menampilkan <span className="font-black text-slate-900">{currentData.length}</span> data
            </div>
          </div>

          {/* Table List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-200">
                    <th
                      className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors w-20"
                      onClick={() => toggleSort("rank")}
                    >
                      <div className="flex items-center gap-1.5">Rank <ArrowUpDown size={13} /></div>
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
                    {system === "system1" && s1Tab === "citizens" && (
                      <th className="py-3.5 px-4">Status</th>
                    )}
                    <th
                      className="py-3.5 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => toggleSort("points")}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <ArrowUpDown size={13} /> {system === "system2" ? "Skor Akhir" : "Total Poin"}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {rest.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        Tidak ada data peringkat yang sesuai dengan kriteria pencarian.
                      </td>
                    </tr>
                  ) : (
                    rest.map((u) => {
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-black text-slate-700">#{u.rank}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">{u.name}</td>
                          <td className="py-3.5 px-4 text-slate-600 font-semibold">{u.subtitle || "-"}</td>
                          {extraInfoHeader && (
                            <td className="py-3.5 px-4 text-slate-600 font-medium">{u.extraInfo || "-"}</td>
                          )}
                          {system === "system1" && s1Tab === "citizens" && (
                            <td className="py-3.5 px-4">
                              <Badge status="ACTIVE" />
                            </td>
                          )}
                          <td className="py-3.5 px-4 font-black text-emerald-600 text-right text-sm">
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
        </>
      )}
    </div>
  );
};

export default Leaderboard;
