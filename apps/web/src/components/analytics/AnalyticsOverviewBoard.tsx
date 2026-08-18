/**
 * Project: TrashCare Analytics & Leaderboard Overview Board
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Component: Rekapitulasi & Analitik Performa Wilayah
 * - 2 Recharts Bar Charts: Kepatuhan Pemilahan per Kelurahan & Volume Sampah per Kelurahan
 * - Tabel Terpisah ber-Pagination untuk setiap kategori (Warga, Petugas, Rukun Warga, Kelurahan, Mahasiswa, Kelompok, DPL)
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  TrendingUp,
  MapPin,
  Building2,
  GraduationCap,
  Award,
  Search,
  ArrowUpDown,
  FileText,
  BarChart3,
  Trash2,
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
import api from "../../services/api";
import { Pagination } from "../common/Pagination";

interface TableItem {
  rank: number;
  name: string;
  sub: string;
  score: string | number;
  pct?: number;
}

interface TableSectionProps {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  iconBgColor: string;
  iconTextColor: string;
  data: TableItem[];
  nameHeader?: string;
  subHeader?: string;
  scoreHeader?: string;
}

const TableSection: React.FC<TableSectionProps> = ({
  title,
  subtitle,
  icon: Icon,
  iconBgColor,
  iconTextColor,
  data,
  nameHeader = "Nama",
  subHeader = "Keterangan / Wilayah",
  scoreHeader = "Poin",
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<"rank" | "name" | "score">("rank");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  const filteredData = useMemo(() => {
    let result = [...data];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.sub.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      let comp = 0;
      if (sortBy === "rank") comp = a.rank - b.rank;
      else if (sortBy === "name") comp = a.name.localeCompare(b.name);
      else if (sortBy === "score") {
        const numA = typeof a.score === "number" ? a.score : parseFloat(String(a.score).replace(/[^0-9.-]+/g, "")) || 0;
        const numB = typeof b.score === "number" ? b.score : parseFloat(String(b.score).replace(/[^0-9.-]+/g, "")) || 0;
        comp = numA - numB;
      }
      return sortOrder === "asc" ? comp : -comp;
    });
    return result;
  }, [data, searchTerm, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    return filteredData.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredData, currentPage, itemsPerPage]);

  const toggleSort = (field: "rank" | "name" | "score") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between space-y-3">
      {/* Header & Search */}
      <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl ${iconBgColor} ${iconTextColor} flex items-center justify-center border shrink-0 font-bold`}>
            <Icon size={20} />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100 tracking-tight">
              {title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            type="text"
            placeholder="Cari..."
            className="w-full bg-slate-50/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 pl-10 pr-4 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-[#009966] transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-xs text-left">
          <thead className="bg-slate-50/80 dark:bg-slate-800/80 text-[10.5px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th
                className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors w-20"
                onClick={() => toggleSort("rank")}
              >
                <div className="flex items-center gap-1.5">Peringkat <ArrowUpDown size={12} /></div>
              </th>
              <th
                className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                onClick={() => toggleSort("name")}
              >
                <div className="flex items-center gap-1.5">{nameHeader} <ArrowUpDown size={12} /></div>
              </th>
              <th className="py-3.5 px-4">{subHeader}</th>
              <th
                className="py-3.5 px-4 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                onClick={() => toggleSort("score")}
              >
                <div className="flex items-center justify-end gap-1.5"><ArrowUpDown size={12} /> {scoreHeader}</div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-slate-400 dark:text-slate-500 font-bold">
                  Tidak ada data yang sesuai pencarian.
                </td>
              </tr>
            ) : (
              paginatedData.map((item) => (
                <tr key={item.rank} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3.5 px-4 font-black text-slate-700 dark:text-slate-300">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-[11px] font-black ${
                      item.rank === 1 ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700/40" :
                      item.rank === 2 ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700" :
                      item.rank === 3 ? "bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-700/40" :
                      "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                    }`}>
                      {item.rank}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-100">{item.name}</td>
                  <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-semibold">{item.sub || "-"}</td>
                  <td className="py-3.5 px-4 font-black text-[#009966] dark:text-emerald-400 text-right text-sm">
                    {item.score}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredData.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredData.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          itemsPerPageOptions={[10, 25, 50, 100]}
        />
      )}
    </div>
  );
};

export const AnalyticsOverviewBoard: React.FC = () => {
  // Dynamic API states
  const [kepatuhanData, setKepatuhanData] = useState<{ name: string; val: number }[]>([]);
  const [volumeData, setVolumeData] = useState<{ name: string; val: number }[]>([]);
  const [topWarga, setTopWarga] = useState<TableItem[]>([]);
  const [topPetugas, setTopPetugas] = useState<TableItem[]>([]);
  const [topRw, setTopRw] = useState<TableItem[]>([]);
  const [topKelurahan, setTopKelurahan] = useState<TableItem[]>([]);
  const [topMahasiswa, setTopMahasiswa] = useState<TableItem[]>([]);
  const [topKelompok, setTopKelompok] = useState<TableItem[]>([]);
  const [topDpl, setTopDpl] = useState<TableItem[]>([]);

  useEffect(() => {
    fetchLiveLeaderboards();
  }, []);

  const fetchLiveLeaderboards = async () => {
    try {
      const res = await api.get("/gamification/leaderboard");
      if (res.data?.success && res.data.data) {
        const d = res.data.data;
        if (d.citizens && d.citizens.length > 0) {
          const topVal = d.citizens[0].totalPoints || 1;
          setTopWarga(
            d.citizens.map((c: any, i: number) => {
              const val = c.totalPoints || 0;
              return {
                rank: i + 1,
                name: c.name,
                sub: c.wilayah && c.wilayah !== "N/A" ? c.wilayah : "-",
                score: val.toLocaleString("id-ID"),
                pct: topVal > 0 ? Math.round((val / topVal) * 100) : 0,
              };
            })
          );
        } else {
          setTopWarga([]);
        }

        if (d.pengangkut && d.pengangkut.length > 0) {
          const topVal = d.pengangkut[0].totalPoints || 1;
          setTopPetugas(
            d.pengangkut.map((p: any, i: number) => {
              const val = p.totalPoints || 0;
              return {
                rank: i + 1,
                name: p.name,
                sub: p.wilayah || "-",
                score: val.toLocaleString("id-ID"),
                pct: topVal > 0 ? Math.round((val / topVal) * 100) : 0,
              };
            })
          );
        } else {
          setTopPetugas([]);
        }

        if (d.rtRw && d.rtRw.length > 0) {
          const topVal = d.rtRw[0].totalPoints || 1;
          setTopRw(
            d.rtRw.map((r: any, i: number) => {
              const val = r.totalPoints || 0;
              return {
                rank: i + 1,
                name: r.rtRwName || `RW 0${i + 1}`,
                sub: `Kel. ${r.kelurahanName || "-"}`,
                score: val.toLocaleString("id-ID"),
                pct: topVal > 0 ? Math.round((val / topVal) * 100) : 0,
              };
            })
          );
        } else {
          setTopRw([]);
        }

        if (d.regions && d.regions.length > 0) {
          const topVal = d.regions[0].totalPoints || 1;
          setTopKelurahan(
            d.regions.map((k: any, i: number) => {
              const val = k.totalPoints || 0;
              return {
                rank: i + 1,
                name: `Kel. ${k.kelurahanName}`,
                sub: "-",
                score: val.toLocaleString("id-ID"),
                pct: topVal > 0 ? Math.round((val / topVal) * 100) : 0,
              };
            })
          );

          setVolumeData(
            d.regions.map((k: any) => ({
              name: `Kel. ${k.kelurahanName}`,
              val: parseFloat((Number(k.totalPoints || 0)).toFixed(1)),
            }))
          );

          setKepatuhanData(
            d.regions.map((k: any) => ({
              name: `Kel. ${k.kelurahanName}`,
              val: Math.min(100, Math.round((Number(k.totalPoints || 0)))),
            }))
          );
        } else {
          setTopKelurahan([]);
          setVolumeData([]);
          setKepatuhanData([]);
        }
      }

      const resKkn = await api.get("/gamification/leaderboard-kkn");
      if (resKkn.data?.success && resKkn.data.data) {
        const d = resKkn.data.data;
        if (d.students && d.students.length > 0) {
          const topVal = d.students[0].finalScore || 1;
          setTopMahasiswa(
            d.students.map((s: any, i: number) => {
              const val = s.finalScore || 0;
              return {
                rank: i + 1,
                name: s.name,
                sub: s.kelompok && s.kelompok !== "Tanpa Kelompok" ? `Kelompok ${s.kelompok}` : "-",
                score: val.toLocaleString("id-ID"),
                pct: topVal > 0 ? Math.round((val / topVal) * 100) : 0,
              };
            })
          );
        } else {
          setTopMahasiswa([]);
        }

        if (d.groups && d.groups.length > 0) {
          const topVal = d.groups[0].avgScore || 1;
          setTopKelompok(
            d.groups.map((g: any, i: number) => {
              const val = g.avgScore || 0;
              return {
                rank: i + 1,
                name: g.name,
                sub: "-",
                score: val.toLocaleString("id-ID"),
                pct: topVal > 0 ? Math.round((val / topVal) * 100) : 0,
              };
            })
          );
        } else {
          setTopKelompok([]);
        }

        if (d.dpl && d.dpl.length > 0) {
          const topVal = d.dpl[0].points || 1;
          setTopDpl(
            d.dpl.map((dp: any, i: number) => {
              const val = dp.points || 0;
              return {
                rank: i + 1,
                name: dp.name,
                sub: `DPL (${dp.totalGroups || 0} Kelompok)`,
                score: val.toLocaleString("id-ID"),
                pct: topVal > 0 ? Math.round((val / topVal) * 100) : 0,
              };
            })
          );
        } else {
          setTopDpl([]);
        }
      }
    } catch (e) {
      console.warn("Error fetching live leaderboard in AnalyticsOverviewBoard:", e);
    }
  };

  const avgCompliance =
    kepatuhanData.length > 0
      ? Math.round(kepatuhanData.reduce((acc, d) => acc + d.val, 0) / kepatuhanData.length)
      : 0;

  const totalVolumeKg = volumeData.reduce((acc, d) => acc + d.val, 0);
  const totalVolumeDisplay =
    totalVolumeKg >= 1000
      ? `${(totalVolumeKg / 1000).toFixed(1)} ton`
      : `${totalVolumeKg.toFixed(1)} kg`;

  const CustomComplianceTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-xl border border-slate-800 text-xs font-bold space-y-0.5">
          <p className="text-emerald-400 font-extrabold">{data.name}</p>
          <p className="text-[11px] text-slate-300">Kepatuhan Pemilahan: <strong className="text-white">{data.val}%</strong></p>
        </div>
      );
    }
    return null;
  };

  const CustomVolumeTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-xl border border-slate-800 text-xs font-bold space-y-0.5">
          <p className="text-sky-400 font-extrabold">{data.name}</p>
          <p className="text-[11px] text-slate-300">Volume Sampah: <strong className="text-white">{data.val} kg</strong></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full space-y-6 text-slate-800 dark:text-slate-100 font-sans">
      
      {/* ----------------- TOP SECTION: 2 RECHARTS BAR CHARTS ROW ----------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Chart 1: Kepatuhan Pemilahan per Kelurahan */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-700/40 shrink-0 font-bold">
                <BarChart3 size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 leading-snug">
                  Grafik Kepatuhan Pemilahan per Kelurahan
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Persentase kepatuhan dalam pemilahan sampah
                </p>
              </div>
            </div>

            <div className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-700/40 text-emerald-800 dark:text-emerald-300 text-xs font-black flex items-center gap-1">
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">Rata-rata</span>
              <span className="text-emerald-700 dark:text-emerald-300">{avgCompliance}%</span>
            </div>
          </div>

          {/* Recharts Bar Chart */}
          <div className="h-64 w-full pt-2">
            {kepatuhanData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs font-bold">
                Memuat data kepatuhan kelurahan...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kepatuhanData} margin={{ top: 15, right: 15, left: -15, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                    unit="%"
                  />
                  <Tooltip content={<CustomComplianceTooltip />} />
                  <Bar dataKey="val" fill="#009966" radius={[6, 6, 0, 0]} maxBarSize={36}>
                    {kepatuhanData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#009966" : "#10b981"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: Volume Sampah per Kelurahan */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-200 dark:border-sky-700/40 shrink-0 font-bold">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 leading-snug">
                  Grafik Volume Sampah per Kelurahan
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Total volume sampah terkumpul
                </p>
              </div>
            </div>

            <div className="px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-700/40 text-sky-800 dark:text-sky-300 text-xs font-black flex items-center gap-1">
              <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold uppercase">Total</span>
              <span className="text-sky-700 dark:text-sky-300">{totalVolumeDisplay}</span>
            </div>
          </div>

          {/* Recharts Bar Chart */}
          <div className="h-64 w-full pt-2">
            {volumeData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs font-bold">
                Memuat data volume sampah kelurahan...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeData} margin={{ top: 15, right: 15, left: -15, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis
                    tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomVolumeTooltip />} />
                  <Bar dataKey="val" fill="#0284c7" radius={[6, 6, 0, 0]} maxBarSize={36}>
                    {volumeData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#0284c7" : "#38bdf8"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* ----------------- CLEAN SEPARATE TABLES WITH STANDARDIZED PAGINATION ----------------- */}
      <div className="space-y-6">

        {/* 1. Tabel Peringkat Warga */}
        <TableSection
          title="Peringkat Warga"
          subtitle="Tabel pemeringkatan warga berdasarkan akumulasi poin pemilahan sampah"
          icon={Users}
          iconBgColor="bg-emerald-50 border-emerald-200"
          iconTextColor="text-[#009966]"
          data={topWarga}
          nameHeader="Nama Warga"
          subHeader="Wilayah"
          scoreHeader="Total Poin"
        />

        {/* 2. Tabel Peringkat Petugas Pemilah */}
        <TableSection
          title="Peringkat Petugas Pemilah"
          subtitle="Tabel peringkat petugas berdasarkan kinerja &amp; kecepatan pengangkutan"
          icon={TrendingUp}
          iconBgColor="bg-[#e5f7ed] border-[#009966]/20"
          iconTextColor="text-[#009966]"
          data={topPetugas}
          nameHeader="Nama Petugas"
          subHeader="Wilayah Penugasan"
          scoreHeader="Skor Komposit"
        />

        {/* 3. Tabel Peringkat Rukun Warga (RW) */}
        <TableSection
          title="Peringkat Rukun Warga"
          subtitle="Tabel akumulasi poin kebersihan &amp; kepatuhan tingkat Rukun Warga"
          icon={MapPin}
          iconBgColor="bg-amber-50 border-amber-200"
          iconTextColor="text-amber-600"
          data={topRw}
          nameHeader="Rukun Warga"
          subHeader="Kelurahan"
          scoreHeader="Total Poin"
        />

        {/* 4. Tabel Peringkat Kelurahan */}
        <TableSection
          title="Peringkat Kelurahan"
          subtitle="Tabel akumulasi poin kebersihan lingkungan tingkat Kelurahan"
          icon={Building2}
          iconBgColor="bg-sky-50 border-sky-200"
          iconTextColor="text-sky-600"
          data={topKelurahan}
          nameHeader="Kelurahan"
          subHeader="Kecamatan"
          scoreHeader="Total Poin"
        />

        {/* 5. Tabel Peringkat Mahasiswa KKN */}
        <TableSection
          title="Peringkat Mahasiswa KKN"
          subtitle="Tabel skor akhir individual seluruh mahasiswa pendamping KKN"
          icon={GraduationCap}
          iconBgColor="bg-purple-50 border-purple-200"
          iconTextColor="text-purple-600"
          data={topMahasiswa}
          nameHeader="Nama Mahasiswa"
          subHeader="Kelompok KKN"
          scoreHeader="Skor Akhir"
        />

        {/* 6. Tabel Peringkat Kelompok KKN */}
        <TableSection
          title="Peringkat Kelompok KKN"
          subtitle="Tabel rata-rata skor akhir kelompok kerja KKN"
          icon={Award}
          iconBgColor="bg-indigo-50 border-indigo-200"
          iconTextColor="text-indigo-600"
          data={topKelompok}
          nameHeader="Kelompok KKN"
          subHeader="Keterangan"
          scoreHeader="Rata-rata Skor"
        />

        {/* 7. Tabel Peringkat Dosen Pendamping Lapangan (DPL) */}
        <TableSection
          title="Peringkat Dosen Pendamping Lapangan (DPL)"
          subtitle="Tabel pencapaian &amp; skor rata-rata binaan DPL"
          icon={FileText}
          iconBgColor="bg-[#009966]/10 border-[#009966]/20"
          iconTextColor="text-[#009966]"
          data={topDpl}
          nameHeader="Nama DPL"
          subHeader="Kelompok Binaan"
          scoreHeader="Rata-rata Skor Binaan"
        />

      </div>

    </div>
  );
};

export default AnalyticsOverviewBoard;
