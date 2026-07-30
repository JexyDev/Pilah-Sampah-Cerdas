/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */

import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Loader2, Medal, TrendingUp, BarChart2, Users, Search, ArrowUpDown, MapPin, GraduationCap } from "lucide-react";
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
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-6 bg-red-50 text-red-600 rounded-xl">
        <p>Error: {error}</p>
        <button
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg font-bold"
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
      pageTitle = "Leaderboard Warga";
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
      pageTitle = "Leaderboard RT/RW";
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
      pageTitle = "Leaderboard Petugas Residu";
      pageSubtitle = "Metrik pengangkutan residu & pemilahan bersih oleh petugas";
      nameHeader = "Nama Petugas";
      subtitleHeader = "Wilayah RT/RW";
    }
  } else {
    // KKN Leaderboard (Sistem 2)
    if (s2Tab === "students") {
      currentData = kknStudents.map((s, i) => ({
        id: s.id,
        rank: i + 1,
        name: s.name,
        subtitle: `Kelompok: ${s.kelompok}`,
        extraInfo: `Tong Aktif: ${s.activeBins} | Jam Kerja: ${s.totalHours} jam`,
        points: s.finalScore,
      }));
      pageTitle = "Leaderboard Mahasiswa KKN (Individu)";
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
      pageTitle = "Leaderboard Kelompok KKN";
      pageSubtitle = "Rata-rata Skor Akhir dari seluruh anggota kelompok KKN";
      nameHeader = "Nama Kelompok";
      subtitleHeader = "Jumlah Anggota";
    }
  }

  // Search filter
  if (searchTerm) {
    const lowerSearch = searchTerm.toLowerCase();
    currentData = currentData.filter(
      (u) =>
        u.name.toLowerCase().includes(lowerSearch) ||
        u.subtitle.toLowerCase().includes(lowerSearch)
    );
  }

  // Sorting logic
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
    <div className="max-w-5xl mx-auto space-y-8 p-4">
      {/* System Selector */}
      <div className="flex justify-center bg-gray-100 p-1.5 rounded-2xl w-fit mx-auto border border-gray-200">
        <button
          onClick={() => {
            setSystem("system1");
            setSearchTerm("");
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
            system === "system1"
              ? "bg-white text-primary shadow-sm"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          <Users size={16} /> Sistem 1: Warga & Wilayah
        </button>
        <button
          onClick={() => {
            setSystem("system2");
            setSearchTerm("");
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
            system === "system2"
              ? "bg-white text-primary shadow-sm"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          <GraduationCap size={16} /> Sistem 2: KKN Cerdas
        </button>
      </div>

      {/* Tab Switcher depending on System */}
      <div className="flex justify-center border-b border-slate-200 overflow-x-auto pb-1">
        {system === "system1" ? (
          <>
            <button
              onClick={() => setS1Tab("citizens")}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-bold transition-all ${
                s1Tab === "citizens" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <Users size={16} /> Warga
            </button>
            <button
              onClick={() => setS1Tab("rtrw")}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-bold transition-all ${
                s1Tab === "rtrw" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <MapPin size={16} /> RT / RW
            </button>
            <button
              onClick={() => setS1Tab("pengangkut")}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-bold transition-all ${
                s1Tab === "pengangkut" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <TrendingUp size={16} /> Petugas Residu
            </button>
            <button
              onClick={() => setS1Tab("kelurahan")}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-bold transition-all ${
                s1Tab === "kelurahan" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <BarChart2 size={16} /> Persaingan Kelurahan
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setS2Tab("students")}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-bold transition-all ${
                s2Tab === "students" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <Users size={16} /> Individu Mahasiswa
            </button>
            <button
              onClick={() => setS2Tab("groups")}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-bold transition-all ${
                s2Tab === "groups" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <GraduationCap size={16} /> Kelompok KKN
            </button>
          </>
        )}
      </div>

      {system === "system1" && s1Tab === "kelurahan" ? (
        <BarChartRace />
      ) : (
        <>
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black text-slate-800">{pageTitle}</h2>
            <p className="text-slate-500 text-sm">{pageSubtitle}</p>
          </div>

          {/* Top 3 Card Visualizations */}
          {top3.length > 0 && (
            <div className="flex flex-col md:flex-row justify-center items-end gap-4 md:gap-6 pt-10">
              {top3.map((u) => {
                const isFirst = u.rank === 1;
                const isSecond = u.rank === 2;

                let heightClass = isFirst ? "h-64" : isSecond ? "h-56" : "h-48";
                let colorClass = isFirst ? "from-yellow-400 to-amber-500" : isSecond ? "from-slate-300 to-gray-400" : "from-orange-300 to-orange-500";
                let medalColor = isFirst ? "#FDE047" : isSecond ? "#E5E7EB" : "#FDBA74";

                return (
                  <div
                    key={u.id}
                    className={`w-full md:w-64 flex flex-col items-center justify-end relative order-${isFirst ? "2" : isSecond ? "1" : "3"}`}
                  >
                    <div className="absolute -top-12 z-10 flex flex-col items-center">
                      <Medal color={medalColor} size={48} className="drop-shadow-lg" />
                      <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded-full text-xs shadow-sm mt-[-10px]">
                        Peringkat {u.rank}
                      </span>
                    </div>
                    <div className={`w-full rounded-t-2xl bg-gradient-to-t ${colorClass} p-4 text-center shadow-lg flex flex-col justify-end ${heightClass}`}>
                      <h3 className="font-black text-white text-lg truncate drop-shadow-md">{u.name}</h3>
                      <p className="text-white/90 font-bold text-sm drop-shadow-sm">
                        {u.points.toFixed ? u.points.toFixed(1) : u.points} {system === "system2" ? "Skor" : "Pts"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Search Control */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Cari..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="text-sm text-slate-500 font-medium">
              Menampilkan <span className="font-bold text-slate-800">{currentData.length}</span> data
            </div>
          </div>

          {/* Table list */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="max-h-[400px] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200 relative">
                <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th
                      className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => toggleSort("rank")}
                    >
                      <div className="flex items-center gap-2">Peringkat <ArrowUpDown size={14} /></div>
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => toggleSort("name")}
                    >
                      <div className="flex items-center gap-2">{nameHeader} <ArrowUpDown size={14} /></div>
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => toggleSort("subtitle")}
                    >
                      <div className="flex items-center gap-2">{subtitleHeader} <ArrowUpDown size={14} /></div>
                    </th>
                    {extraInfoHeader && (
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                        {extraInfoHeader}
                      </th>
                    )}
                    {system === "system1" && s1Tab === "citizens" && (
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                    )}
                    <th
                      className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => toggleSort("points")}
                    >
                      <div className="flex items-center justify-end gap-2">
                        <ArrowUpDown size={14} /> {system === "system2" ? "Skor Akhir" : "Total Poin"}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rest.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        Tidak ada data yang sesuai dengan kriteria.
                      </td>
                    </tr>
                  ) : (
                    rest.map((u) => {
                      return (
                        <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-500 w-24">{u.rank}</td>
                          <td className="px-6 py-4 font-semibold text-slate-800">{u.name}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{u.subtitle || "-"}</td>
                          {extraInfoHeader && (
                            <td className="px-6 py-4 text-sm text-slate-600">{u.extraInfo || "-"}</td>
                          )}
                          {system === "system1" && s1Tab === "citizens" && (
                            <td className="px-6 py-4">
                              <Badge status="ACTIVE" />
                            </td>
                          )}
                          <td className="px-6 py-4 font-black text-green-600 text-right">
                            {u.points.toFixed ? u.points.toFixed(1) : u.points}
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
