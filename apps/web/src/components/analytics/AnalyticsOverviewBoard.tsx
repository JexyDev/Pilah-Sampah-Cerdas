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

import React from "react";

export const AnalyticsOverviewBoard: React.FC = () => {
  // Data Bar Chart 1: Kepatuhan Pemilahan per Kelurahan
  const kepatuhanData = [
    { name: "Kel. Sekeloa", val: 92 },
    { name: "Kel. Dago", val: 88 },
    { name: "Kel. Cibeunying", val: 84 },
    { name: "Kel. Cipedes", val: 79 },
    { name: "Kel. Lebakgede", val: 74 },
    { name: "Kel. Tamansari", val: 69 },
  ];

  // Data Bar Chart 2: Volume Sampah per Kelurahan (Ton)
  const volumeData = [
    { name: "Kel. Sekeloa", val: 3.4 },
    { name: "Kel. Dago", val: 3.1 },
    { name: "Kel. Cibeunying", val: 2.8 },
    { name: "Kel. Cipedes", val: 2.4 },
    { name: "Kel. Lebakgede", val: 2.1 },
    { name: "Kel. Tamansari", val: 1.8 },
  ];

  // Data Top 10 Warga
  const topWarga = [
    { rank: 1, name: "Dewi Lestari", sub: "RW 06, Kel. Sekeloa", score: "12.350", pct: 100 },
    { rank: 2, name: "Budi Hartono", sub: "RW 02, Kel. Dago", score: "9.870", pct: 80 },
    { rank: 3, name: "Siti Aminah", sub: "RW 01, Kel. Sekeloa", score: "8.420", pct: 68 },
    { rank: 4, name: "Rizky Maulana", sub: "RW 03, Kel. Cibeunying", score: "7.560", pct: 61 },
    { rank: 5, name: "Ahmad Fauzi", sub: "RW 02, Kel. Dago", score: "7.120", pct: 57 },
    { rank: 6, name: "Tuti Handayani", sub: "RW 04, Kel. Cibeunying", score: "6.780", pct: 54 },
    { rank: 7, name: "Rina Marlina", sub: "RW 01, Kel. Dago", score: "6.450", pct: 52 },
    { rank: 8, name: "Hendra Wijaya", sub: "RW 05, Kel. Cipedes", score: "6.230", pct: 50 },
    { rank: 9, name: "Yurniarti", sub: "RW 06, Kel. Sekeloa", score: "5.890", pct: 47 },
    { rank: 10, name: "Agus Setiawan", sub: "RW 03, Kel. Cibeunying", score: "5.430", pct: 44 },
  ];

  // Data Top 10 Petugas Residu
  const topPetugas = [
    { rank: 1, name: "Dedi Kurniawan", sub: "Kel. Sekeloa", score: "8.620", pct: 100 },
    { rank: 2, name: "Agus Salim", sub: "Kel. Dago", score: "7.540", pct: 87 },
    { rank: 3, name: "Iwan Setiawan", sub: "Kel. Cibeunying", score: "6.980", pct: 81 },
    { rank: 4, name: "Asep Saepudin", sub: "Kel. Cipedes", score: "6.450", pct: 74 },
    { rank: 5, name: "Tedi Hermawan", sub: "Kel. Cibeunying", score: "6.120", pct: 71 },
    { rank: 6, name: "Ujang Rohman", sub: "Kel. Dago", score: "5.780", pct: 67 },
    { rank: 7, name: "Rahmat Hidayat", sub: "Kel. Sekeloa", score: "5.430", pct: 63 },
    { rank: 8, name: "Deni Surya", sub: "Kel. Cipedes", score: "5.190", pct: 60 },
    { rank: 9, name: "Yayan Sopyan", sub: "Kel. Dago", score: "4.860", pct: 56 },
    { rank: 10, name: "Cecep Maulana", sub: "Kel. Sekeloa", score: "4.520", pct: 52 },
  ];

  // Data Top 10 RW
  const topRw = [
    { rank: 1, name: "RW 01", sub: "Kel. Sekeloa", score: "24.560", pct: 100 },
    { rank: 2, name: "RW 02", sub: "Kel. Dago", score: "21.870", pct: 89 },
    { rank: 3, name: "RW 06", sub: "Kel. Sekeloa", score: "19.420", pct: 79 },
    { rank: 4, name: "RW 03", sub: "Kel. Cibeunying", score: "18.230", pct: 74 },
    { rank: 5, name: "RW 04", sub: "Kel. Cibeunying", score: "16.870", pct: 68 },
    { rank: 6, name: "RW 05", sub: "Kel. Cipedes", score: "15.430", pct: 62 },
    { rank: 7, name: "RW 07", sub: "Kel. Cipedes", score: "13.980", pct: 56 },
    { rank: 8, name: "RW 08", sub: "Kel. Dago", score: "12.570", pct: 51 },
    { rank: 9, name: "RW 09", sub: "Kel. Sekeloa", score: "10.620", pct: 43 },
    { rank: 10, name: "RW 10", sub: "Kel. Cibeunying", score: "9.340", pct: 38 },
  ];

  // Data Top 10 Kelurahan
  const topKelurahan = [
    { rank: 1, name: "Kelurahan Sekeloa", score: "56.230", pct: 100 },
    { rank: 2, name: "Kelurahan Dago", score: "49.780", pct: 88 },
    { rank: 3, name: "Kelurahan Cibeunying", score: "45.120", pct: 80 },
    { rank: 4, name: "Kelurahan Cipedes", score: "37.860", pct: 67 },
    { rank: 5, name: "Kelurahan Lebakgede", score: "29.780", pct: 52 },
    { rank: 6, name: "Kelurahan Sukajadi", score: "33.540", pct: 59 },
    { rank: 7, name: "Kelurahan Pasirkaliki", score: "26.480", pct: 47 },
    { rank: 8, name: "Kelurahan Tamansari", score: "23.160", pct: 41 },
    { rank: 9, name: "Kelurahan Sukapura", score: "20.340", pct: 36 },
    { rank: 10, name: "Kelurahan Pasirlayung", score: "18.540", pct: 32 },
  ];

  // Data Top 10 Mahasiswa KKN
  const topMahasiswa = [
    { rank: 1, name: "Andi Firmansyah", sub: "RW 01 / RT 02 (Kel. Sekeloa)", score: "7.820", pct: 100 },
    { rank: 2, name: "Bella Saphira", sub: "RW 01 / RT 01 (Kel. Dago)", score: "7.120", pct: 91 },
    { rank: 3, name: "Ciko Jeriko", sub: "RW 02 / RT 01 (Kel. Sekeloa)", score: "6.880", pct: 88 },
    { rank: 4, name: "Dinda Aprilia", sub: "RW 03 / RT 02 (Kel. Cibeunying)", score: "6.230", pct: 79 },
    { rank: 5, name: "Fajar Ramadhan", sub: "RW 04 / RT 01 (Kel. Cibeunying)", score: "5.940", pct: 75 },
    { rank: 6, name: "Gina Nuraini", sub: "RW 06 / RT 02 (Kel. Sekeloa)", score: "5.780", pct: 73 },
    { rank: 7, name: "Muhammad Rayhan", sub: "RW 05 / RT 01 (Kel. Cipedes)", score: "5.640", pct: 72 },
    { rank: 8, name: "Nabila Zahran", sub: "RW 07 / RT 01 (Kel. Cipedes)", score: "5.210", pct: 66 },
    { rank: 9, name: "Rifki Ardiansyah", sub: "RW 08 / RT 01 (Kel. Dago)", score: "4.980", pct: 63 },
    { rank: 10, name: "Putri Melati", sub: "RW 09 / RT 02 (Kel. Sekeloa)", score: "4.750", pct: 60 },
  ];

  // Data Top 10 Kelompok KKN
  const topKelompok = [
    { rank: 1, name: "Kelompok A", sub: "Kel. Sekeloa", score: "29.680", pct: 100 },
    { rank: 2, name: "Kelompok B", sub: "Kel. Dago", score: "26.430", pct: 89 },
    { rank: 3, name: "Kelompok C", sub: "Kel. Cibeunying", score: "24.150", pct: 81 },
    { rank: 4, name: "Kelompok D", sub: "Kel. Cipedes", score: "21.760", pct: 73 },
    { rank: 5, name: "Kelompok E", sub: "Kel. Dago", score: "20.340", pct: 68 },
    { rank: 6, name: "Kelompok F", sub: "Kel. Sekeloa", score: "19.120", pct: 64 },
    { rank: 7, name: "Kelompok G", sub: "Kel. Cibeunying", score: "17.350", pct: 58 },
    { rank: 8, name: "Kelompok H", sub: "Kel. Cipedes", score: "15.820", pct: 53 },
    { rank: 9, name: "Kelompok I", sub: "Kel. Dago", score: "14.300", pct: 48 },
    { rank: 10, name: "Kelompok J", sub: "Kel. Sekeloa", score: "12.870", pct: 43 },
  ];

  // Data Top 10 DPL
  const topDpl = [
    { rank: 1, name: "Dr. Ir. Rudi Hermawan, M.T.", score: "9.420", pct: 100 },
    { rank: 2, name: "Dr. Siti Rahmawati, M.Si.", score: "8.730", pct: 92 },
    { rank: 3, name: "Prof. Dr. Andi Setiawan, M.Sc.", score: "7.980", pct: 84 },
    { rank: 4, name: "Dr. Nunik Kurniasih, S.T., M.T.", score: "7.120", pct: 75 },
    { rank: 5, name: "Dr. Dedi Supriadi, M.Pd.", score: "6.540", pct: 69 },
    { rank: 6, name: "Dr. Yulia Puspitasari, M.Kom.", score: "5.980", pct: 63 },
    { rank: 7, name: "Dr. Asep Hidayat, S.E., M.M.", score: "5.620", pct: 59 },
    { rank: 8, name: "Dr. Bambang Irawan, M.Sc.", score: "5.230", pct: 55 },
    { rank: 9, name: "Dr. Rina Marlina, S.T., M.T.", score: "4.890", pct: 51 },
    { rank: 10, name: "Dr. Hendra Wijaya, M.Pd.", score: "4.520", pct: 47 },
  ];

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
