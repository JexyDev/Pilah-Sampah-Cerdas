/**
 * Project: TrashCare Analytics & Leaderboard Overview Board
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Component matching exact visual layout of:
 * - 2 Bar Charts: Kepatuhan Pemilahan per Kelurahan & Volume Sampah per Kelurahan
 * - Grup 1: Top 10 Warga, Petugas Residu, RW, & Kelurahan
 * - Grup 2: Top 10 Mahasiswa KKN, Kelompok KKN, & DPL
 */

import React, { useState, useEffect } from "react";
import api from "../../services/api";

export const AnalyticsOverviewBoard: React.FC = () => {
  // Dynamic API states
  const [kepatuhanData, setKepatuhanData] = useState<{ name: string; val: number }[]>([]);
  const [volumeData, setVolumeData] = useState<{ name: string; val: number }[]>([]);
  const [topWarga, setTopWarga] = useState<any[]>([]);
  const [topPetugas, setTopPetugas] = useState<any[]>([]);
  const [topRw, setTopRw] = useState<any[]>([]);
  const [topKelurahan, setTopKelurahan] = useState<any[]>([]);
  const [topMahasiswa, setTopMahasiswa] = useState<any[]>([]);
  const [topKelompok, setTopKelompok] = useState<any[]>([]);
  const [topDpl, setTopDpl] = useState<any[]>([]);

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
                sub: "",
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

  return (
    <div className="w-full space-y-6 text-slate-800 font-sans">
      
      {/* ----------------- TOP SECTION: 2 BAR CHARTS ROW ----------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Chart 1: Kepatuhan Pemilahan per Kelurahan */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
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
                  Persentase kepatuhan dalam pemilahan sampah
                </p>
              </div>
            </div>

            <div className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black flex items-center gap-1">
              <span className="text-[10px] text-emerald-600 font-bold uppercase">Rata-rata</span>
              <span className="text-emerald-700">81%</span>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div className="pt-4 flex gap-2 items-end">
            {/* Y-Axis Labels */}
            <div className="flex flex-col justify-between text-[9px] text-slate-400 font-extrabold pr-1.5 border-r border-slate-200 h-44 text-right select-none shrink-0 pb-6">
              <span>100%</span>
              <span>80%</span>
              <span>60%</span>
              <span>40%</span>
              <span>20%</span>
              <span>0%</span>
            </div>

            {/* Bars Area */}
            <div className="flex-1 grid grid-cols-6 gap-2 items-end h-44 border-b border-slate-200 pb-1 relative">
              {kepatuhanData.map((d, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1 group h-full justify-end">
                  <span className="text-[10px] font-black text-slate-800 group-hover:text-emerald-600 transition">
                    {d.val}%
                  </span>
                  <div className="w-full bg-slate-100 rounded-t-lg overflow-hidden h-[80%] flex items-end">
                    <div
                      className="w-full bg-gradient-to-t from-emerald-700 to-emerald-500 rounded-t-lg transition-all duration-500 group-hover:from-emerald-600 group-hover:to-emerald-400 shadow-2xs"
                      style={{ height: `${d.val}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* X-Axis Labels */}
          <div className="grid grid-cols-6 gap-2 pl-9 text-center">
            {kepatuhanData.map((d, idx) => (
              <span key={idx} className="text-[9px] sm:text-[10px] font-extrabold text-slate-600 truncate">
                {d.name}
              </span>
            ))}
          </div>
        </div>

        {/* Chart 2: Volume Sampah per Kelurahan */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
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
                  Total volume sampah terkumpul (ton)
                </p>
              </div>
            </div>

            <div className="px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs font-black flex items-center gap-1">
              <span className="text-[10px] text-sky-600 font-bold uppercase">Total</span>
              <span className="text-sky-700">15.6 ton</span>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div className="pt-4 flex gap-2 items-end">
            {/* Y-Axis Labels */}
            <div className="flex flex-col justify-between text-[9px] text-slate-400 font-extrabold pr-1.5 border-r border-slate-200 h-44 text-right select-none shrink-0 pb-6">
              <span>5 ton</span>
              <span>4</span>
              <span>3</span>
              <span>2</span>
              <span>1</span>
              <span>0</span>
            </div>

            {/* Bars Area */}
            <div className="flex-1 grid grid-cols-6 gap-2 items-end h-44 border-b border-slate-200 pb-1 relative">
              {volumeData.map((d, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1 group h-full justify-end">
                  <span className="text-[10px] font-black text-slate-800 group-hover:text-sky-600 transition">
                    {d.val} ton
                  </span>
                  <div className="w-full bg-slate-100 rounded-t-lg overflow-hidden h-[80%] flex items-end">
                    <div
                      className="w-full bg-gradient-to-t from-sky-700 to-sky-500 rounded-t-lg transition-all duration-500 group-hover:from-sky-600 group-hover:to-sky-400 shadow-2xs"
                      style={{ height: `${(d.val / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* X-Axis Labels */}
          <div className="grid grid-cols-6 gap-2 pl-9 text-center">
            {volumeData.map((d, idx) => (
              <span key={idx} className="text-[9px] sm:text-[10px] font-extrabold text-slate-600 truncate">
                {d.name}
              </span>
            ))}
          </div>
        </div>

      </div>

      {/* ----------------- MIDDLE SECTION: GRUP 1 (TOP 10 WARGA & WILAYAH) ----------------- */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-5">
        
        {/* Section Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-xl">star</span>
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg leading-tight">
                Grup 1 — Top 10 Warga &amp; Wilayah
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Ranking dan performa warga serta wilayah berdasarkan perolehan poin.
              </p>
            </div>
          </div>
        </div>

        {/* 4 Columns Leaderboard Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 min-w-0">
          
          {/* Card 1: Top 10 Warga */}
          <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-200/70 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs">
                <span className="material-symbols-outlined text-emerald-600 text-lg">person</span>
                Top 10 Warga
              </div>
              <span className="material-symbols-outlined text-slate-400 text-sm">chevron_right</span>
            </div>

            <div className="space-y-2">
              {topWarga.map((item) => (
                <div key={item.rank} className="flex items-center justify-between text-[11px] font-medium gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className={`w-4 text-center font-extrabold text-[10px] ${item.rank <= 3 ? "text-amber-500 font-black" : "text-slate-400"}`}>
                      {item.rank}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate leading-tight">{item.name}</p>
                      <p className="text-[9px] text-slate-400 truncate">{item.sub}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden hidden sm:block">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${item.pct}%` }}></div>
                    </div>
                    <span className="font-extrabold text-slate-800 text-[10px] w-10 text-right">{item.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Top 10 Petugas Residu */}
          <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-200/70 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs">
                <span className="material-symbols-outlined text-rose-600 text-lg">delete</span>
                Top 10 Petugas Residu
              </div>
              <span className="material-symbols-outlined text-slate-400 text-sm">chevron_right</span>
            </div>

            <div className="space-y-2">
              {topPetugas.map((item) => (
                <div key={item.rank} className="flex items-center justify-between text-[11px] font-medium gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className={`w-4 text-center font-extrabold text-[10px] ${item.rank <= 3 ? "text-amber-500 font-black" : "text-slate-400"}`}>
                      {item.rank}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate leading-tight">{item.name}</p>
                      <p className="text-[9px] text-slate-400 truncate">{item.sub}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden hidden sm:block">
                      <div className="h-full bg-rose-500 rounded-full" style={{ width: `${item.pct}%` }}></div>
                    </div>
                    <span className="font-extrabold text-slate-800 text-[10px] w-10 text-right">{item.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Top 10 RW */}
          <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-200/70 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs">
                <span className="material-symbols-outlined text-emerald-600 text-lg">home</span>
                Top 10 RW
              </div>
              <span className="material-symbols-outlined text-slate-400 text-sm">chevron_right</span>
            </div>

            <div className="space-y-2">
              {topRw.map((item) => (
                <div key={item.rank} className="flex items-center justify-between text-[11px] font-medium gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="w-4 text-center font-extrabold text-[10px] text-slate-400">
                      {item.rank}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate leading-tight">{item.name}</p>
                      <p className="text-[9px] text-slate-400 truncate">{item.sub}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden hidden sm:block">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${item.pct}%` }}></div>
                    </div>
                    <span className="font-extrabold text-slate-800 text-[10px] w-10 text-right">{item.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 4: Top 10 Kelurahan */}
          <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-200/70 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs">
                <span className="material-symbols-outlined text-sky-600 text-lg">apartment</span>
                Top 10 Kelurahan
              </div>
              <span className="material-symbols-outlined text-slate-400 text-sm">chevron_right</span>
            </div>

            <div className="space-y-2">
              {topKelurahan.map((item) => (
                <div key={item.rank} className="flex items-center justify-between text-[11px] font-medium gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="w-4 text-center font-extrabold text-[10px] text-slate-400">
                      {item.rank}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate leading-tight">{item.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden hidden sm:block">
                      <div className="h-full bg-sky-500 rounded-full" style={{ width: `${item.pct}%` }}></div>
                    </div>
                    <span className="font-extrabold text-slate-800 text-[10px] w-10 text-right">{item.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* ----------------- BOTTOM SECTION: GRUP 2 (TOP 10 AKADEMIK & PENDAMPINGAN) ----------------- */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-5">
        
        {/* Section Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-xl">star</span>
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg leading-tight">
                Grup 2 — Top 10 Akademik &amp; Pendampingan
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Ranking dan performa peserta dari ekosistem pendampingan mahasiswa.
              </p>
            </div>
          </div>
        </div>

        {/* 3 Columns Leaderboard Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 min-w-0">
          
          {/* Card 1: Top 10 Mahasiswa */}
          <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-200/70 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs">
                <span className="material-symbols-outlined text-emerald-600 text-lg">school</span>
                Top 10 Mahasiswa
              </div>
              <span className="material-symbols-outlined text-slate-400 text-sm">chevron_right</span>
            </div>

            <div className="space-y-2">
              {topMahasiswa.map((item) => (
                <div key={item.rank} className="flex items-center justify-between text-[11px] font-medium gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className={`w-4 text-center font-extrabold text-[10px] ${item.rank <= 3 ? "text-amber-500 font-black" : "text-slate-400"}`}>
                      {item.rank}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate leading-tight">{item.name}</p>
                      <p className="text-[9px] text-slate-400 truncate">{item.sub}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden hidden sm:block">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${item.pct}%` }}></div>
                    </div>
                    <span className="font-extrabold text-slate-800 text-[10px] w-10 text-right">{item.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Top 10 Kelompok Mahasiswa */}
          <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-200/70 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs">
                <span className="material-symbols-outlined text-emerald-600 text-lg">groups</span>
                Top 10 Kelompok Mahasiswa
              </div>
              <span className="material-symbols-outlined text-slate-400 text-sm">chevron_right</span>
            </div>

            <div className="space-y-2">
              {topKelompok.map((item) => (
                <div key={item.rank} className="flex items-center justify-between text-[11px] font-medium gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className={`w-4 text-center font-extrabold text-[10px] ${item.rank <= 3 ? "text-amber-500 font-black" : "text-slate-400"}`}>
                      {item.rank}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate leading-tight">{item.name}</p>
                      <p className="text-[9px] text-slate-400 truncate">{item.sub}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden hidden sm:block">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${item.pct}%` }}></div>
                    </div>
                    <span className="font-extrabold text-slate-800 text-[10px] w-10 text-right">{item.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Top 10 DPL */}
          <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-200/70 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs">
                <span className="material-symbols-outlined text-emerald-600 text-lg">person</span>
                Top 10 Dosen Pendamping Lapangan (DPL)
              </div>
              <span className="material-symbols-outlined text-slate-400 text-sm">chevron_right</span>
            </div>

            <div className="space-y-2">
              {topDpl.map((item) => (
                <div key={item.rank} className="flex items-center justify-between text-[11px] font-medium gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="w-4 text-center font-extrabold text-[10px] text-slate-400">
                      {item.rank}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate leading-tight">{item.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden hidden sm:block">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${item.pct}%` }}></div>
                    </div>
                    <span className="font-extrabold text-slate-800 text-[10px] w-10 text-right">{item.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default AnalyticsOverviewBoard;
