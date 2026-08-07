import React, { useEffect, useState } from "react";
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
  linkTo = "/leaderboard",
}) => {
  const displayItems = items.slice(0, 10);
  const topScore = maxPoints || displayItems[0]?.points || 100;
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-amber-950 font-black text-[11px] flex items-center justify-center shadow-xs border border-amber-200 shrink-0">
          🥇
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="w-6 h-6 rounded-full bg-gradient-to-tr from-slate-300 to-slate-100 text-slate-800 font-extrabold text-[11px] flex items-center justify-center shadow-xs border border-slate-300 shrink-0">
          🥈
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-700 to-amber-600 text-white font-extrabold text-[11px] flex items-center justify-center shadow-xs border border-amber-600 shrink-0">
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
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md p-5 flex flex-col justify-between transition-all duration-200 h-full relative">
      {/* Header */}
      <div className="flex justify-between items-center pb-3 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`p-2 rounded-xl ${iconBg} text-white shadow-xs shrink-0 flex items-center justify-center`}>
            {icon}
          </div>
          <div>
            <h5 className="font-extrabold text-[14px] text-slate-800 tracking-tight truncate" title={title}>
              {title}
            </h5>
            <p className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">
              Skala Acuan: Top 1 = <span className="font-bold text-slate-600">{topScore.toLocaleString("id-ID")} {unitLabel}</span>
            </p>
          </div>
        </div>
        <Link
          to={linkTo}
          className="text-slate-400 hover:text-emerald-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100 shrink-0"
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
            const rawPct = topScore > 0 ? Math.round((item.points / topScore) * 100) : 0;
            const barPct = Math.min(100, Math.max(8, rawPct));
            const isHovered = hoveredIndex === idx;

            return (
              <div
                key={`${item.rank}-${item.name}`}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`flex items-center gap-1.5 text-xs group px-2 py-1.5 rounded-xl transition-all duration-150 border min-w-0 ${
                  isHovered
                    ? "bg-slate-50 border-slate-300/80 shadow-xs scale-[1.01]"
                    : "bg-white border-transparent"
                }`}
              >
                {/* Rank Icon / Medal */}
                {getRankBadge(item.rank)}

                {/* Name & Subtitle */}
                <div className="flex-1 min-w-0 pr-1">
                  <p className="font-extrabold text-slate-800 text-[12px] sm:text-[13px] leading-snug group-hover:text-emerald-700 truncate" title={item.name}>
                    {item.name}
                  </p>
                  {item.subtitle && (
                    <p className="text-[10px] sm:text-[11px] text-slate-400 leading-tight font-medium truncate">
                      {item.subtitle}
                    </p>
                  )}
                </div>

                {/* Interactive Progress Bar & Percentage Ratio */}
                <div className="w-16 sm:w-24 shrink-0 flex flex-col items-end gap-0.5">
                  <div className="flex justify-between items-center w-full text-[9px] text-slate-500 font-bold">
                    <span className="text-slate-400 font-normal hidden sm:inline">Rasio</span>
                    <span className="text-slate-700">{rawPct}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden relative border border-slate-200/50">
                    <div
                      className="h-full rounded-full transition-all duration-500 opacity-90 group-hover:opacity-100 shadow-xs"
                      style={{ width: `${barPct}%`, backgroundColor: barColor }}
                    />
                  </div>
                </div>

                {/* Points */}
                <div className="w-14 sm:w-16 text-right shrink-0">
                  <span className="font-extrabold text-slate-800 text-[11px] sm:text-[13px] font-mono block leading-none truncate">
                    {item.points.toLocaleString("id-ID")}
                  </span>
                  <span className="text-[8px] sm:text-[9px] text-slate-400 font-bold block mt-0.5 uppercase">
                    {unitLabel}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Card Footer */}
      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] shrink-0">
        <span className="text-slate-400 font-medium flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Akumulasi Terverifikasi Real-time
        </span>
        <Link
          to={linkTo}
          className="font-bold text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-0.5"
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
            subtitle: c.wilayah && c.wilayah !== "N/A" ? c.wilayah : "Wilayah Coblong",
            points: Number(c.totalPoints || 0),
          }));
          setWargaList(apiWarga);
        }
        if (d.pengangkut) {
          const apiPetugas = d.pengangkut.map((p: any, i: number) => ({
            rank: i + 1,
            name: p.name,
            subtitle: p.wilayah || "Coblong",
            points: Number(p.totalPoints || 0),
          }));
          setPetugasList(apiPetugas);
        }
        if (d.rtRw) {
          const apiRw = d.rtRw.map((r: any, i: number) => ({
            rank: i + 1,
            name: r.rtRwName || `RW ${i + 1}`,
            subtitle: `Kel. ${r.kelurahanName || "Coblong"}`,
            points: Number(r.totalPoints || 0),
          }));
          setRwList(apiRw);
        }
        if (d.regions) {
          const apiKel = d.regions.map((k: any, i: number) => ({
            rank: i + 1,
            name: `Kelurahan ${k.kelurahanName}`,
            subtitle: "Kecamatan Coblong",
            points: Number(k.totalPoints || 0),
          }));
          setKelurahanList(apiKel);
        }
      }

      const resKkn = await api.get("/gamification/leaderboard-kkn");
      if (resKkn.data?.success && resKkn.data.data) {
        const d = resKkn.data.data;
        if (d.students) {
          const apiMhs = d.students.map((s: any, i: number) => ({
            rank: i + 1,
            name: s.name,
            subtitle: s.kelompok && s.kelompok !== "Tanpa Kelompok" ? `Kelompok ${s.kelompok}` : "Mahasiswa KKN",
            points: Number(s.finalScore || 0),
          }));
          setMahasiswaList(apiMhs);
        }
        if (d.groups) {
          const apiGrp = d.groups.map((g: any, i: number) => ({
            rank: i + 1,
            name: g.name,
            subtitle: "Tim Dampingan KKN",
            points: Number(g.avgScore || 0),
          }));
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

  return (
    <div className="space-y-6 w-full">

      {/* ----------------- TOP SECTION: 2 BAR CHARTS ----------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Chart 1: Kepatuhan Pemilahan per Kelurahan */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-xl">bar_chart</span>
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 leading-snug">
                  Grafik Kepatuhan Pemilahan per Kelurahan
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Persentase kepatuhan dalam pemilahan sampah real-time
                </p>
              </div>
            </div>

            <div className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black flex items-center gap-1">
              <span className="text-[10px] text-emerald-600 font-bold uppercase">Status</span>
              <span className="text-emerald-700">Terverifikasi</span>
            </div>
          </div>

          {/* Bar Chart Area */}
          <div className="pt-4 flex gap-2 items-end">
            <div className="flex flex-col justify-between text-[9px] text-slate-400 font-extrabold pr-1.5 border-r border-slate-200 h-40 text-right select-none shrink-0 pb-5">
              <span>100%</span>
              <span>80%</span>
              <span>60%</span>
              <span>40%</span>
              <span>20%</span>
              <span>0%</span>
            </div>

            <div className="flex-1 grid grid-cols-6 gap-2 items-end h-40 border-b border-slate-200 pb-1 relative">
              {(kelurahanList.length > 0 ? kelurahanList.slice(0, 6) : [
                { name: "Kel. Sekeloa", points: 0 },
                { name: "Kel. Dago", points: 0 },
                { name: "Kel. Sadang Serang", points: 0 },
                { name: "Kel. Sekeloa", points: 0 },
                { name: "Kel. Lebak Gede", points: 0 },
                { name: "Kel. Cipaganti", points: 0 },
              ]).map((d, idx) => {
                const valPct = d.points > 0 ? Math.min(100, Math.round(d.points * 5)) : 0;
                return (
                  <div key={idx} className="flex flex-col items-center gap-1 group h-full justify-end">
                    <span className="text-[10px] font-black text-slate-800 group-hover:text-emerald-600 transition">
                      {valPct}%
                    </span>
                    <div className="w-full bg-slate-100 rounded-t-lg overflow-hidden h-[80%] flex items-end">
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

          <div className="grid grid-cols-6 gap-2 pl-9 text-center">
            {(kelurahanList.length > 0 ? kelurahanList.slice(0, 6) : [
              { name: "Sekeloa" },
              { name: "Dago" },
              { name: "Sadang Serang" },
              { name: "Cibeunying" },
              { name: "Lebak Gede" },
              { name: "Cipaganti" },
            ]).map((item, idx) => (
              <span key={idx} className="text-[9px] sm:text-[10px] font-extrabold text-slate-600 truncate">
                {item.name.replace("Kelurahan ", "")}
              </span>
            ))}
          </div>
        </div>

        {/* Chart 2: Volume Sampah per Kelurahan */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-xl">delete</span>
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 leading-snug">
                  Grafik Volume Sampah per Kelurahan
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Total volume sampah terkumpul real (Kg)
                </p>
              </div>
            </div>

            <div className="px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs font-black flex items-center gap-1">
              <span className="text-[10px] text-sky-600 font-bold uppercase">Total</span>
              <span className="text-sky-700">
                {kelurahanList.reduce((acc, k) => acc + (k.points || 0), 0).toFixed(1)} Kg
              </span>
            </div>
          </div>

          {/* Bar Chart Area */}
          <div className="pt-4 flex gap-2 items-end">
            <div className="flex flex-col justify-between text-[9px] text-slate-400 font-extrabold pr-1.5 border-r border-slate-200 h-40 text-right select-none shrink-0 pb-5">
              <span>{Math.max(...kelurahanList.map((k) => k.points || 0), 10).toFixed(0)} Kg</span>
              <span>{(Math.max(...kelurahanList.map((k) => k.points || 0), 10) * 0.8).toFixed(0)}</span>
              <span>{(Math.max(...kelurahanList.map((k) => k.points || 0), 10) * 0.6).toFixed(0)}</span>
              <span>{(Math.max(...kelurahanList.map((k) => k.points || 0), 10) * 0.4).toFixed(0)}</span>
              <span>{(Math.max(...kelurahanList.map((k) => k.points || 0), 10) * 0.2).toFixed(0)}</span>
              <span>0</span>
            </div>

            <div className="flex-1 grid grid-cols-6 gap-2 items-end h-40 border-b border-slate-200 pb-1 relative">
              {(kelurahanList.length > 0 ? kelurahanList.slice(0, 6) : [
                { name: "Sekeloa", points: 0 },
                { name: "Dago", points: 0 },
                { name: "Sadang Serang", points: 0 },
                { name: "Cibeunying", points: 0 },
                { name: "Lebak Gede", points: 0 },
                { name: "Cipaganti", points: 0 },
              ]).map((d, idx) => {
                const maxVol = Math.max(...kelurahanList.map((k) => k.points || 0), 10);
                return (
                  <div key={idx} className="flex flex-col items-center gap-1 group h-full justify-end">
                    <span className="text-[10px] font-black text-slate-800 group-hover:text-sky-600 transition">
                      {(d.points || 0).toFixed(1)} Kg
                    </span>
                    <div className="w-full bg-slate-100 rounded-t-lg overflow-hidden h-[80%] flex items-end">
                      <div
                        className="w-full bg-gradient-to-t from-sky-700 to-sky-500 rounded-t-lg transition-all duration-500 shadow-2xs"
                        style={{ height: `${maxVol > 0 ? ((d.points || 0) / maxVol) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-6 gap-2 pl-9 text-center">
            {(kelurahanList.length > 0 ? kelurahanList.slice(0, 6) : [
              { name: "Sekeloa" },
              { name: "Dago" },
              { name: "Sadang Serang" },
              { name: "Cibeunying" },
              { name: "Lebak Gede" },
              { name: "Cipaganti" },
            ]).map((item, idx) => (
              <span key={idx} className="text-[9px] sm:text-[10px] font-extrabold text-slate-600 truncate">
                {item.name.replace("Kelurahan ", "")}
              </span>
            ))}
          </div>
        </div>

      </div>

      {/* GRUP 1 — Top 10 Warga & Wilayah */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-emerald-600 text-white shadow-xs">
            <Star size={16} className="fill-current" />
          </div>
          <div>
            <h3 className="font-extrabold text-[15px] text-slate-800 tracking-tight leading-tight">
              Grup 1 — Top 10 Warga &amp; Wilayah
            </h3>
            <p className="text-[11px] text-slate-500 leading-none mt-0.5">
              Ranking dan performa warga serta wilayah berdasarkan perolehan poin.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-stretch min-w-0">
          {/* 1. Top 10 Warga */}
          <ColumnCard
            title="Top 10 Warga"
            icon={<User size={14} />}
            iconBg="bg-emerald-600"
            barColor="#10b981"
            items={wargaList}
            maxPoints={wargaList[0]?.points || 0}
            linkTo="/leaderboard?system=system1&tab=citizens"
          />

          {/* 2. Top 10 Petugas Residu */}
          <ColumnCard
            title="Top 10 Petugas Residu"
            icon={<Truck size={14} />}
            iconBg="bg-rose-500"
            barColor="#ef4444"
            items={petugasList}
            maxPoints={petugasList[0]?.points || 0}
            linkTo="/leaderboard?system=system1&tab=pengangkut"
          />

          {/* 3. Top 10 RW */}
          <ColumnCard
            title="Top 10 RW"
            icon={<Home size={14} />}
            iconBg="bg-emerald-600"
            barColor="#10b981"
            items={rwList}
            maxPoints={rwList[0]?.points || 0}
            linkTo="/leaderboard?system=system1&tab=rtrw"
          />

          {/* 4. Top 10 Kelurahan */}
          <ColumnCard
            title="Top 10 Kelurahan"
            icon={<Building2 size={14} />}
            iconBg="bg-blue-600"
            barColor="#3b82f6"
            items={kelurahanList}
            maxPoints={kelurahanList[0]?.points || 0}
            linkTo="/leaderboard?system=system1&tab=kelurahan"
          />
        </div>
      </div>

      {/* GRUP 2 — Top 10 Akademik & Pendampingan */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-emerald-700 text-white shadow-xs">
            <GraduationCap size={16} />
          </div>
          <div>
            <h3 className="font-extrabold text-[15px] text-slate-800 tracking-tight leading-tight">
              Grup 2 — Top 10 Akademik &amp; Pendampingan
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
            linkTo="/leaderboard?system=system2&tab=students"
          />

          {/* 2. Top 10 Kelompok Mahasiswa */}
          <ColumnCard
            title="Top 10 Kelompok Mahasiswa"
            icon={<Users size={14} />}
            iconBg="bg-emerald-600"
            barColor="#10b981"
            items={kelompokList}
            maxPoints={kelompokList[0]?.points || 0}
            linkTo="/leaderboard?system=system2&tab=groups"
          />

          {/* 3. Top 10 Dosen Pendamping Lapangan (DPL) */}
          <ColumnCard
            title="Top 10 Dosen Pendamping Lapangan (DPL)"
            icon={<Award size={14} />}
            iconBg="bg-teal-600"
            barColor="#10b981"
            items={dplList}
            maxPoints={dplList[0]?.points || 0}
            linkTo="/leaderboard?system=system2&tab=students"
          />
        </div>
      </div>
    </div>
  );
};

export default LeaderboardWidget;
