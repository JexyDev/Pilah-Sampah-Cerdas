import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  User,
  Truck,
  Home,
  Building2,
  GraduationCap,
  Users,
  Award,
  ChevronRight,
  Star,
} from "lucide-react";
import api from "../services/api";
import { useAuthStore } from "../store/useAuthStore";

interface LeaderboardItem {
  rank: number;
  name: string;
  subtitle?: string;
  points: number;
}

interface ColumnCardProps {
  title: string;
  icon: React.ReactNode;
  iconBg: string;
  barColor: string;
  items: LeaderboardItem[];
  maxPoints: number;
  unitLabel?: string;
  linkTo?: string;
}

const ColumnCard: React.FC<ColumnCardProps> = ({
  title,
  icon,
  iconBg,
  barColor,
  items,
  maxPoints,
  unitLabel = "Poin",
  linkTo = "/peringkat",
}) => {
  const displayItems = items.slice(0, 10);
  const positivePoints = displayItems.map((i) => i.points).filter((p) => p > 0);
  const topScore = maxPoints > 0 ? maxPoints : (positivePoints[0] || 100);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 font-bold text-[11px] flex items-center justify-center shadow-2xs border border-amber-200 shrink-0">
          🥇
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-[11px] flex items-center justify-center shadow-2xs border border-slate-200 dark:border-slate-800 shrink-0">
          🥈
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="w-6 h-6 rounded-full bg-amber-50 text-amber-900 font-bold text-[11px] flex items-center justify-center shadow-2xs border border-amber-200 shrink-0">
          🥉
        </span>
      );
    }
    return (
      <span className="w-6 text-center font-bold text-slate-400 shrink-0 text-xs group-hover:text-emerald-600">
        {rank}
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md p-5 flex flex-col justify-between transition-all duration-200 h-full relative">
      {/* Header */}
      <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`p-2 rounded-xl ${iconBg} text-white shadow-xs shrink-0 flex items-center justify-center`}>
            {icon}
          </div>
          <div>
            <h5 className="font-extrabold text-[14px] text-slate-800 dark:text-slate-100 tracking-tight truncate" title={title}>
              {title}
            </h5>
            <p className="text-[10px] text-slate-400 dark:text-slate-400 font-medium leading-none mt-0.5">
              Skala Acuan: Top 1 = <span className="font-bold text-slate-600 dark:text-slate-300">{topScore.toLocaleString("id-ID")} {unitLabel}</span>
            </p>
          </div>
        </div>
        <Link
          to={linkTo}
          className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
          title="Lihat Detail"
        >
          <ChevronRight size={18} />
        </Link>
      </div>

      {/* Item List */}
      <div className="my-3 flex-1 flex flex-col justify-start space-y-2 min-h-[240px]">
        {displayItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 italic text-xs py-8">
            Belum ada data poin terverifikasi.
          </div>
        ) : (
          displayItems.map((item, idx) => {
            const rawPct = topScore > 0 && item.points > 0 ? Math.round((item.points / topScore) * 100) : 0;
            const barPct = item.points > 0 ? Math.min(100, Math.max(8, rawPct)) : 0;
            const isHovered = hoveredIndex === idx;

            return (
              <div
                key={`${item.rank}-${item.name}`}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`flex items-center gap-1.5 text-xs group px-2 py-1.5 rounded-xl transition-all duration-150 border min-w-0 ${
                  isHovered
                    ? "bg-slate-50 dark:bg-slate-800/80 border-slate-300/80 dark:border-slate-700 shadow-xs scale-[1.01]"
                    : "bg-white dark:bg-slate-900 border-transparent"
                }`}
              >
                {/* Rank Icon / Medal */}
                {getRankBadge(item.rank)}

                {/* Name & Subtitle */}
                <div className="flex-1 min-w-0 pr-1">
                  <p className="font-extrabold text-slate-800 dark:text-slate-200 text-[12px] sm:text-[13px] leading-snug group-hover:text-emerald-700 dark:group-hover:text-emerald-400 truncate" title={item.name}>
                    {item.name}
                  </p>
                  {item.subtitle && (
                    <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-400 leading-tight font-medium truncate">
                      {item.subtitle}
                    </p>
                  )}
                </div>

                {/* Interactive Progress Bar & Percentage Ratio */}
                <div className="w-16 sm:w-24 shrink-0 flex flex-col items-end gap-0.5">
                  <div className="flex justify-between items-center w-full text-[9px] text-slate-500 dark:text-slate-400 font-bold">
                    <span className="text-slate-400 font-normal hidden sm:inline">Rasio</span>
                    <span className="text-slate-700 dark:text-slate-300">{rawPct}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative border border-slate-200/50 dark:border-slate-700">
                    <div
                      className="h-full rounded-full transition-all duration-500 opacity-90 group-hover:opacity-100 shadow-xs"
                      style={{ width: `${barPct}%`, backgroundColor: barColor }}
                    />
                  </div>
                </div>

                {/* Points */}
                <div className="w-14 sm:w-16 text-right shrink-0">
                  <span className={`font-extrabold text-[11px] sm:text-[13px] font-mono block leading-none truncate ${item.points < 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-800 dark:text-slate-100"}`}>
                    {item.points.toLocaleString("id-ID")}
                  </span>
                  <span className="text-[8px] sm:text-[9px] text-slate-400 dark:text-slate-400 font-bold block mt-0.5 uppercase">
                    {unitLabel}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Card Footer */}
      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] shrink-0">
        <span className="text-slate-400 font-medium flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Akumulasi Terverifikasi Real-time
        </span>
        <Link
          to={linkTo}
          className="font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors flex items-center gap-0.5"
        >
          Detail Lengkap <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
};


export const LeaderboardWidget: React.FC = () => {
  // Real DB state (starts empty, filled from API)
  const [wargaList, setWargaList] = useState<LeaderboardItem[]>([]);
  const [petugasList, setPetugasList] = useState<LeaderboardItem[]>([]);
  const [rwList, setRwList] = useState<LeaderboardItem[]>([]);
  const [kelurahanList, setKelurahanList] = useState<LeaderboardItem[]>([]);
  const [mahasiswaList, setMahasiswaList] = useState<LeaderboardItem[]>([]);
  const [kelompokList, setKelompokList] = useState<LeaderboardItem[]>([]);
  const [dplList, setDplList] = useState<LeaderboardItem[]>([]);

  useEffect(() => {
    fetchLiveLeaderboards();
  }, []);

  const fetchLiveLeaderboards = async () => {
    try {
      const res = await api.get("/gamification/leaderboard");
      if (res.data?.success && res.data.data) {
        const d = res.data.data;
        if (d.citizens) {
          const apiWarga = d.citizens.map((c: any, i: number) => ({
            rank: i + 1,
            name: c.name,
            subtitle: c.wilayah && c.wilayah !== "N/A" ? c.wilayah : "Wilayah Binaan",
            points: Number(c.totalPoints || 0),
          }));
          setWargaList(apiWarga);
        }
        if (d.pengangkut) {
          const apiPetugas = d.pengangkut.map((p: any, i: number) => ({
            rank: i + 1,
            name: p.name,
            subtitle: p.wilayah || "Wilayah Operasional",
            points: Number(p.totalPoints || 0),
          }));
          setPetugasList(apiPetugas);
        }
        const rawRw = d.rw || d.rtRw;
        if (rawRw && Array.isArray(rawRw)) {
          const apiRw = rawRw.map((r: any, i: number) => {
            const rawName = r.rtRwName || r.name || `${r.rwId || i + 1}`;
            const cleanRw = rawName.toLowerCase().startsWith("rw") ? rawName : `RW ${rawName}`;
            const rawKel = r.kelurahanName || "Wilayah Kerja";
            const cleanKel = rawKel.toLowerCase().startsWith("kel") ? rawKel : `Kel. ${rawKel}`;
            return {
              rank: i + 1,
              name: cleanRw,
              subtitle: cleanKel,
              points: Number(r.totalPoints || 0),
            };
          });
          setRwList(apiRw);
        }
        if (d.regions) {
          const apiKel = d.regions.map((k: any, i: number) => {
            const rawKel = k.kelurahanName || `${i + 1}`;
            const cleanKel = rawKel.toLowerCase().startsWith("kelurahan") ? rawKel : `Kelurahan ${rawKel}`;
            return {
              rank: i + 1,
              name: cleanKel,
              subtitle: k.kecamatanName || "Wilayah Operasional",
              points: Number(k.totalPoints || 0),
            };
          });
          setKelurahanList(apiKel);
        }
      }

      const resKkn = await api.get("/gamification/leaderboard-kkn");
      if (resKkn.data?.success && resKkn.data.data) {
        const d = resKkn.data.data;
        if (d.students) {
          const apiMhs = d.students.map((s: any, i: number) => {
            const rawK = s.kelompok;
            const cleanK =
              rawK && rawK !== "Tanpa Kelompok" && rawK !== "N/A"
                ? rawK.trim().toLowerCase().startsWith("kelompok")
                  ? rawK.trim()
                  : `Kelompok ${rawK.trim()}`
                : "Mahasiswa KKN";
            return {
              rank: i + 1,
              name: s.name,
              subtitle: cleanK,
              points: Number(s.finalScore || 0),
            };
          });
          setMahasiswaList(apiMhs);
        }
        if (d.groups) {
          const apiGrp = d.groups.map((g: any, i: number) => {
            const rawG = g.name || `Kelompok ${i + 1}`;
            const cleanG = rawG.trim().toLowerCase().startsWith("kelompok")
              ? rawG.trim()
              : `Kelompok ${rawG.trim()}`;
            return {
              rank: i + 1,
              name: cleanG,
              subtitle: g.dplName || "Tim Dampingan KKN",
              points: Number(g.avgScore || 0),
            };
          });
          setKelompokList(apiGrp);
        }
        if (d.dpl) {
          const apiDpl = d.dpl.map((dp: any, i: number) => ({
            rank: i + 1,
            name: dp.name,
            subtitle: `DPL (${dp.totalGroups || 0} Kelompok)`,
            points: Number(dp.points || 0),
          }));
          setDplList(apiDpl);
        }
      }
    } catch (e) {
      console.warn("Error fetching live leaderboard from API:", e);
    }
  };

  const { user } = useAuthStore();
  const isLurah = (user?.role || user?.peran || "").toUpperCase() === "LURAH";
  const userKelurahan = user?.kelurahan || (user?.address?.includes("Cipaganti") || user?.name?.includes("Cipaganti") ? "Cipaganti" : "");

  // Official 6 Kelurahan of Kecamatan Coblong
  const COBLONG_6_KELURAHAN = [
    "Cipaganti",
    "Dago",
    "Lebak Gede",
    "Lebak Siliwangi",
    "Sadang Serang",
    "Sekeloa",
  ];

  // RW items for Lurah's kelurahan
  const lurahRwItems = useMemo(() => {
    if (!isLurah || !userKelurahan) return [];
    return rwList.filter((r) =>
      (r.subtitle || "").toLowerCase().includes(userKelurahan.toLowerCase()) ||
      (r.name || "").toLowerCase().includes(userKelurahan.toLowerCase())
    );
  }, [isLurah, userKelurahan, rwList]);

  // Citizens filtered for Lurah
  const displayedWargaList = useMemo(() => {
    if (isLurah && userKelurahan) {
      const filtered = wargaList.filter((w) =>
        (w.subtitle || "").toLowerCase().includes(userKelurahan.toLowerCase())
      );
      return filtered.length > 0 ? filtered.map((w, i) => ({ ...w, rank: i + 1 })) : wargaList;
    }
    return wargaList;
  }, [isLurah, userKelurahan, wargaList]);

  // Map real database kelurahan data or RW data for charts
  const activeChartData = useMemo(() => {
    if (isLurah && lurahRwItems.length > 0) {
      return lurahRwItems.slice(0, 10).map((r) => ({
        name: r.name,
        points: r.points || 0,
      }));
    }
    return COBLONG_6_KELURAHAN.map((kelName) => {
      const match = kelurahanList.find((k) =>
        k.name.toLowerCase().includes(kelName.toLowerCase())
      );
      return {
        name: kelName,
        points: match ? Number(match.points || 0) : 0,
      };
    });
  }, [isLurah, lurahRwItems, kelurahanList]);

  const maxVolumeKg = useMemo(() => {
    const vals = activeChartData.map((k) => k.points);
    const max = Math.max(...vals, 0);
    return max > 0 ? max : 10;
  }, [activeChartData]);

  const chartColCount = Math.max(1, activeChartData.length);

  return (
    <div className="space-y-6 w-full">

      {/* ----------------- TOP SECTION: 2 BAR CHARTS ----------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Chart 1: Kepatuhan Pemilahan */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-xl">bar_chart</span>
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 leading-snug">
                  {isLurah
                    ? `Grafik Kepatuhan Pemilahan per Rukun Warga (Kel. ${userKelurahan || "Cipaganti"})`
                    : "Grafik Kepatuhan Pemilahan per Kelurahan"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {isLurah
                    ? "Performa kepatuhan pemilahan tiap RW di wilayah kelurahan"
                    : "Persentase kepatuhan dalam pemilahan sampah real-time"}
                </p>
              </div>
            </div>

            <div className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-700/30 text-emerald-800 dark:text-emerald-300 text-xs font-black flex items-center gap-1">
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">Status</span>
              <span className="text-emerald-700 dark:text-emerald-300">Terverifikasi Real</span>
            </div>
          </div>

          {/* Bar Chart Area */}
          <div className="pt-4 flex gap-2 items-end">
            <div className="flex flex-col justify-between text-[9px] text-slate-400 dark:text-slate-500 font-extrabold pr-1.5 border-r border-slate-200 dark:border-slate-800 h-40 text-right select-none shrink-0 pb-5">
              <span>100%</span>
              <span>80%</span>
              <span>60%</span>
              <span>40%</span>
              <span>20%</span>
              <span>0%</span>
            </div>

            <div
              className="flex-1 grid gap-2 items-end h-40 border-b border-slate-200 dark:border-slate-800 pb-1 relative"
              style={{ gridTemplateColumns: `repeat(${chartColCount}, minmax(0, 1fr))` }}
            >
              {activeChartData.map((d, idx) => {
                const valPct = d.points > 0 ? Math.min(100, Math.round(d.points)) : 0;
                return (
                  <div key={idx} className="flex flex-col items-center gap-1 group h-full justify-end">
                    <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition truncate w-full text-center">
                      {valPct}%
                    </span>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-lg overflow-hidden h-[80%] flex items-end">
                      <div
                        className="w-full bg-gradient-to-t from-emerald-700 to-emerald-500 rounded-t-lg transition-all duration-500 shadow-2xs"
                        style={{ height: `${valPct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className="grid gap-2 pl-9 text-center"
            style={{ gridTemplateColumns: `repeat(${chartColCount}, minmax(0, 1fr))` }}
          >
            {activeChartData.map((item, idx) => (
              <span key={idx} className="text-[9px] sm:text-[10px] font-extrabold text-slate-600 dark:text-slate-400 truncate" title={item.name}>
                {item.name}
              </span>
            ))}
          </div>
        </div>

        {/* Chart 2: Volume Sampah */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-xl">delete</span>
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 leading-snug">
                  {isLurah
                    ? `Grafik Volume Sampah per Rukun Warga (Kel. ${userKelurahan || "Cipaganti"})`
                    : "Grafik Volume Sampah per Kelurahan"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {isLurah
                    ? "Total volume sampah terkumpul per RW binaan (Kg)"
                    : "Total volume sampah terkumpul real (Kg)"}
                </p>
              </div>
            </div>

            <div className="px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-700/30 text-sky-800 dark:text-sky-300 text-xs font-black flex items-center gap-1">
              <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold uppercase">Total</span>
              <span className="text-sky-700 dark:text-sky-300">
                {activeChartData.reduce((acc, k) => acc + (k.points || 0), 0).toFixed(2)} Kg
              </span>
            </div>
          </div>

          {/* Bar Chart Area */}
          <div className="pt-4 flex gap-2 items-end">
            <div className="flex flex-col justify-between text-[9px] text-slate-400 dark:text-slate-500 font-extrabold pr-1.5 border-r border-slate-200 dark:border-slate-800 h-40 text-right select-none shrink-0 pb-5">
              <span>{maxVolumeKg.toFixed(0)} Kg</span>
              <span>{(maxVolumeKg * 0.8).toFixed(0)}</span>
              <span>{(maxVolumeKg * 0.6).toFixed(0)}</span>
              <span>{(maxVolumeKg * 0.4).toFixed(0)}</span>
              <span>{(maxVolumeKg * 0.2).toFixed(0)}</span>
              <span>0</span>
            </div>

            <div
              className="flex-1 grid gap-2 items-end h-40 border-b border-slate-200 dark:border-slate-800 pb-1 relative"
              style={{ gridTemplateColumns: `repeat(${chartColCount}, minmax(0, 1fr))` }}
            >
              {activeChartData.map((d, idx) => {
                const heightPct = d.points > 0 ? Math.min(100, Math.round((d.points / maxVolumeKg) * 100)) : 0;
                return (
                  <div key={idx} className="flex flex-col items-center gap-1 group h-full justify-end">
                    <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition truncate w-full text-center">
                      {(d.points || 0).toFixed(2)} Kg
                    </span>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-lg overflow-hidden h-[80%] flex items-end">
                      <div
                        className="w-full bg-gradient-to-t from-sky-700 to-sky-500 rounded-t-lg transition-all duration-500 shadow-2xs"
                        style={{ height: `${heightPct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className="grid gap-2 pl-9 text-center"
            style={{ gridTemplateColumns: `repeat(${chartColCount}, minmax(0, 1fr))` }}
          >
            {activeChartData.map((item, idx) => (
              <span key={idx} className="text-[9px] sm:text-[10px] font-extrabold text-slate-600 dark:text-slate-400 truncate" title={item.name}>
                {item.name}
              </span>
            ))}
          </div>
        </div>

      </div>

      {/* Top 10 Warga & Wilayah */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-emerald-600 text-white shadow-xs">
            <Star size={16} className="fill-current" />
          </div>
          <div>
            <h3 className="font-extrabold text-[15px] text-slate-800 dark:text-slate-100 tracking-tight leading-tight">
              {isLurah
                ? `Top 10 Warga & Wilayah (Kel. ${userKelurahan || "Cipaganti"})`
                : "Top 10 Warga & Wilayah"}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-none mt-0.5">
              Ranking dan performa warga serta wilayah berdasarkan perolehan poin.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-stretch min-w-0">
          {/* 1. Top 10 Warga */}
          <ColumnCard
            title={isLurah ? `Top Warga Kel. ${userKelurahan || "Cipaganti"}` : "Top 10 Warga"}
            icon={<User size={14} />}
            iconBg="bg-emerald-600"
            barColor="#10b981"
            items={displayedWargaList}
            maxPoints={displayedWargaList[0]?.points || 0}
            linkTo="/peringkat?system=system1&tab=citizens"
          />

          {/* 2. Top 10 Petugas Residu */}
          <ColumnCard
            title="Top 10 Petugas Pemilah"
            icon={<Truck size={14} />}
            iconBg="bg-rose-500"
            barColor="#ef4444"
            items={petugasList}
            maxPoints={petugasList[0]?.points || 0}
            linkTo="/peringkat?system=system1&tab=pengangkut"
          />

          {/* 3. Top 10 RW */}
          <ColumnCard
            title="Top 10 RW"
            icon={<Home size={14} />}
            iconBg="bg-emerald-600"
            barColor="#10b981"
            items={rwList}
            maxPoints={rwList[0]?.points || 0}
            linkTo="/peringkat?system=system1&tab=rtrw"
          />

          {/* 4. Top 10 Kelurahan */}
          <ColumnCard
            title="Top 10 Kelurahan"
            icon={<Building2 size={14} />}
            iconBg="bg-blue-600"
            barColor="#3b82f6"
            items={kelurahanList}
            maxPoints={kelurahanList[0]?.points || 0}
            linkTo="/peringkat?system=system1&tab=kelurahan"
          />
        </div>
      </div>

      {/* Top 10 Akademik & Pendampingan */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-emerald-700 text-white shadow-xs">
            <GraduationCap size={16} />
          </div>
          <div>
            <h3 className="font-extrabold text-[15px] text-slate-800 dark:text-slate-100 tracking-tight leading-tight">
              Top 10 Akademik &amp; Pendampingan
            </h3>
            <p className="text-[11px] text-slate-500 leading-none mt-0.5">
              Ranking dan performa peserta dari ekosistem pendampingan mahasiswa.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch min-w-0">
          {/* 1. Top 10 Mahasiswa */}
          <ColumnCard
            title="Top 10 Mahasiswa"
            icon={<GraduationCap size={14} />}
            iconBg="bg-emerald-600"
            barColor="#10b981"
            items={mahasiswaList}
            maxPoints={mahasiswaList[0]?.points || 0}
            linkTo="/peringkat?system=system2&tab=students"
          />

          {/* 2. Top 10 Kelompok Mahasiswa */}
          <ColumnCard
            title="Top 10 Kelompok Mahasiswa"
            icon={<Users size={14} />}
            iconBg="bg-emerald-600"
            barColor="#10b981"
            items={kelompokList}
            maxPoints={kelompokList[0]?.points || 0}
            linkTo="/peringkat?system=system2&tab=groups"
          />

          {/* 3. Top 10 Dosen Pendamping Lapangan (DPL) */}
          <ColumnCard
            title="Top 10 Dosen Pendamping Lapangan (DPL)"
            icon={<Award size={14} />}
            iconBg="bg-teal-600"
            barColor="#10b981"
            items={dplList}
            maxPoints={dplList[0]?.points || 0}
            linkTo="/peringkat?system=system2&tab=students"
          />
        </div>
      </div>
    </div>
  );
};

export default LeaderboardWidget;
