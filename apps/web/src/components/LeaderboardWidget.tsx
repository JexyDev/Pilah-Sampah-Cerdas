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
  totalKg?: number;
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
        <span className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400 font-black text-xs flex items-center justify-center border border-amber-500/30 ring-1 ring-amber-400/20 shrink-0 shadow-2xs">
          1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="w-6 h-6 rounded-lg bg-slate-200/90 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 font-black text-xs flex items-center justify-center border border-slate-300 dark:border-slate-600 shrink-0 shadow-2xs">
          2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="w-6 h-6 rounded-lg bg-amber-800/15 dark:bg-amber-700/20 text-amber-800 dark:text-amber-300 font-black text-xs flex items-center justify-center border border-amber-700/30 shrink-0 shadow-2xs">
          3
        </span>
      );
    }
    return (
      <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 font-bold text-[11px] flex items-center justify-center border border-slate-200/60 dark:border-slate-800 shrink-0 group-hover:border-slate-300">
        {rank}
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md p-5 flex flex-col justify-between transition-all duration-200 h-full relative group/card">
      {/* Header */}
      <div className="flex justify-between items-center pb-3.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`p-2 rounded-xl ${iconBg} text-white shadow-xs shrink-0 flex items-center justify-center`}>
            {icon}
          </div>
          <div className="min-w-0">
            <h5 className="font-extrabold text-[14px] text-slate-900 dark:text-slate-100 tracking-tight truncate" title={title}>
              {title}
            </h5>
            <p className="text-[10.5px] text-slate-400 dark:text-slate-400 font-medium leading-none mt-1 truncate">
              Top 1: <span className="font-bold text-slate-600 dark:text-slate-300">{topScore.toLocaleString("id-ID")} {unitLabel}</span>
            </p>
          </div>
        </div>
        <Link
          to={linkTo}
          className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors p-1.5 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 shrink-0"
          title="Lihat Detail Peringkat"
        >
          <ChevronRight size={17} />
        </Link>
      </div>

      {/* Item List */}
      <div className="my-3 flex-1 flex flex-col justify-start space-y-1 min-h-[250px]">
        {displayItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 italic text-xs py-10 space-y-1">
            <span>Belum ada data peringkat.</span>
          </div>
        ) : (
          displayItems.map((item, idx) => {
            const rawPct = topScore > 0 && item.points > 0 ? Math.round((item.points / topScore) * 100) : 0;
            const barPct = item.points > 0 ? Math.min(100, Math.max(8, rawPct)) : 0;
            const isHovered = hoveredIndex === idx;

            return (
              <Link
                key={`${item.rank}-${item.name}`}
                to={`${linkTo}&search=${encodeURIComponent(item.name)}`}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`flex items-center gap-2.5 text-xs group px-2.5 py-2 rounded-xl transition-all duration-150 border min-w-0 ${
                  isHovered
                    ? "bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 shadow-2xs"
                    : "bg-white dark:bg-slate-900 border-transparent hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                }`}
                title={`Lihat detail peringkat untuk ${item.name}`}
              >
                {/* Rank Badge */}
                {getRankBadge(item.rank)}

                {/* Name & Subtitle */}
                <div className="flex-1 min-w-0 pr-1">
                  <p className="font-extrabold text-slate-800 dark:text-slate-100 text-[12.5px] leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate" title={item.name}>
                    {item.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {item.subtitle && (
                      <p className="text-[10px] text-slate-400 dark:text-slate-400 leading-tight font-medium truncate" title={item.subtitle}>
                        {item.subtitle}
                      </p>
                    )}
                    {item.totalKg != null && item.totalKg > 0 && (
                      <span className="inline-flex items-center px-1.5 py-0.2 rounded-md bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-[9.5px] font-bold border border-sky-200 dark:border-sky-800/40">
                        {item.totalKg.toFixed(1)} Kg
                      </span>
                    )}
                  </div>
                </div>

                {/* Compact Point & Ratio Display */}
                <div className="shrink-0 flex flex-col items-end text-right pl-1">
                  <div className="flex items-baseline gap-1">
                    <span className={`font-black text-[12.5px] font-mono leading-none ${item.points < 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-slate-100"}`}>
                      {item.points.toLocaleString("id-ID")}
                    </span>
                    <span className="text-[8.5px] font-bold text-slate-400 uppercase">
                      {unitLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="w-12 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/60 dark:border-slate-700">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${barPct}%`, backgroundColor: barColor }}
                      />
                    </div>
                    <span className="text-[8.5px] font-bold text-slate-400 w-5 text-right font-mono">{rawPct}%</span>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* Card Footer */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] shrink-0">
        <span className="text-slate-400 font-medium flex items-center gap-1.5 text-[10.5px]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Terverifikasi Real-time
        </span>
        <Link
          to={linkTo}
          className="font-extrabold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors flex items-center gap-1 text-[11px]"
        >
          Lihat Peringkat <ChevronRight size={13} />
        </Link>
      </div>
    </div>
  );
};


export interface LeaderboardWidgetProps {
  mode?: "all" | "sampah" | "kkn";
}

export const LeaderboardWidget: React.FC<LeaderboardWidgetProps> = ({ mode = "all" }) => {
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
              totalKg: Number(r.totalKg || 0),
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
              totalKg: Number(k.totalKg || 0),
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
        totalKg: r.totalKg || 0,
      }));
    }
    return COBLONG_6_KELURAHAN.map((kelName) => {
      const match = kelurahanList.find((k) =>
        k.name.toLowerCase().includes(kelName.toLowerCase())
      );
      return {
        name: kelName,
        points: match ? Number(match.points || 0) : 0,
        totalKg: match ? Number(match.totalKg || 0) : 0,
      };
    });
  }, [isLurah, lurahRwItems, kelurahanList]);

  const maxVolumeKg = useMemo(() => {
    const vals = activeChartData.map((k) => k.totalKg);
    const max = Math.max(...vals, 0);
    return max > 0 ? max : 10;
  }, [activeChartData]);

  const chartColCount = Math.max(1, activeChartData.length);

  return (
    <div className="space-y-6 w-full">
      {mode !== "kkn" && (
        <>
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
        </>
      )}

      {/* Top 10 Akademik & Pendampingan */}
      {mode !== "sampah" && (
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
              linkTo="/peringkat?system=system2&tab=dpl"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaderboardWidget;
