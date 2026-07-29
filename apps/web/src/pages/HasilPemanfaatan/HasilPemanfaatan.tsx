/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */

import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import toast from "react-hot-toast";
import { 
  Loader2, 
  Archive, 
  Sprout, 
  Calendar, 
  LineChart, 
  Layers,
  ArrowRightLeft
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
  const [activeTab, setActiveTab] = useState<"realtime" | "weekly" | "monthly">("realtime");

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

  // Summary statistics calculations
  const totalBahanBaku = items.reduce((acc, curr) => acc + Number(curr.volumeBahanBaku), 0);
  const totalHasil = items.reduce((acc, curr) => acc + Number(curr.hasil), 0);
  const conversionRate = totalBahanBaku > 0 ? ((totalHasil / totalBahanBaku) * 100).toFixed(1) : "0.0";
  const distinctPrograms = Array.from(new Set(items.map(item => item.program))).length;

  // Chart data calculations (by program)
  const programTotals = items.reduce((acc: any, curr) => {
    const prog = curr.program.replace("_", " ");
    acc[prog] = (acc[prog] || 0) + Number(curr.hasil);
    return acc;
  }, {});

  const maxVal = Math.max(...(Object.values(programTotals) as number[]), 1);

  // Grouping Helpers
  const getWeekNumber = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  const getWeeklyGroup = () => {
    const groups: any = {};
    items.forEach((item) => {
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
          count: 0
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
    items.forEach((item) => {
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
          count: 0
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
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Hasil Pemanfaatan Sampah</h1>
        <p className="text-sm text-gray-500 mt-1">
          Statistik sirkulasi bahan baku, konversi hasil panen, dan tata kelola pemanfaatan sampah di kelurahan.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Bahan Baku</p>
            <p className="text-xl font-black text-gray-800 mt-0.5">{totalBahanBaku.toFixed(1)} <span className="text-xs font-normal text-gray-500">Kg</span></p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
            <Sprout className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Hasil Panen</p>
            <p className="text-xl font-black text-gray-800 mt-0.5">{totalHasil.toFixed(1)} <span className="text-xs font-normal text-gray-500">Kg</span></p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
            <ArrowRightLeft className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Rasio Konversi</p>
            <p className="text-xl font-black text-gray-800 mt-0.5">{conversionRate}%</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
            <Archive className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Program Aktif</p>
            <p className="text-xl font-black text-gray-800 mt-0.5">{distinctPrograms} Kategori</p>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      {items.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-lg flex items-center gap-1.5">
              <LineChart className="text-primary w-5 h-5" />
              Produktivitas Hasil Sirkular Sampah
            </h3>
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Satuan Sumbu Y: Kilogram (Kg)</span>
          </div>

          <div className="relative flex h-64 pt-4">
            {/* Y-Axis Labels */}
            <div className="flex flex-col justify-between text-[10px] font-bold text-gray-400 w-12 pr-2.5 text-right select-none h-[180px]">
              <span>{maxVal.toFixed(0)}</span>
              <span>{(maxVal * 0.75).toFixed(0)}</span>
              <span>{(maxVal * 0.5).toFixed(0)}</span>
              <span>{(maxVal * 0.25).toFixed(0)}</span>
              <span>0</span>
            </div>

            {/* Chart Area */}
            <div className="relative flex-1 h-[180px] border-l border-b border-gray-200">
              {/* Grid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                <div className="w-full border-t border-dashed border-gray-100" />
                <div className="w-full border-t border-dashed border-gray-100" />
                <div className="w-full border-t border-dashed border-gray-100" />
                <div className="w-full border-t border-dashed border-gray-100" />
                <div className="w-full" />
              </div>

              {/* Bars Container */}
              <div className="absolute inset-0 flex justify-around items-end px-6">
                {Object.keys(programTotals).map((progName) => {
                  const val = programTotals[progName];
                  const heightPercent = (val / maxVal) * 100;
                  return (
                    <div key={progName} className="flex flex-col items-center group relative w-24">
                      {/* Tooltip on hover */}
                      <div className="absolute -top-10 scale-0 group-hover:scale-100 transition-all duration-150 bg-gray-800 text-white text-[10px] font-bold py-1.5 px-2.5 rounded-lg shadow-md whitespace-nowrap z-10">
                        {val.toFixed(1)} Kg
                      </div>

                      {/* Bar */}
                      <div
                        className="w-10 bg-gradient-to-t from-primary to-emerald-400 rounded-t-xl hover:opacity-95 transition-all duration-300 shadow-sm shadow-primary/10 cursor-pointer"
                        style={{ height: `${heightPercent}%`, minHeight: "4px" }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* X-Axis Labels */}
          <div className="flex pl-12">
            <div className="flex-1 flex justify-around">
              {Object.keys(programTotals).map((progName) => (
                <div key={progName} className="w-24 text-center text-xs font-bold text-gray-500 uppercase tracking-wider mt-1.5">
                  {progName}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filter and Tab Section */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex flex-wrap justify-between items-center gap-4 border-b border-gray-100 pb-4 mb-4">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
            <Calendar size={14} />
            <span>Pilihan Interval Laporan:</span>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
            <button
              onClick={() => setActiveTab("realtime")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
                activeTab === "realtime" ? "bg-white text-primary shadow-xs" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Realtime
            </button>
            <button
              onClick={() => setActiveTab("weekly")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
                activeTab === "weekly" ? "bg-white text-primary shadow-xs" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Mingguan
            </button>
            <button
              onClick={() => setActiveTab("monthly")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
                activeTab === "monthly" ? "bg-white text-primary shadow-xs" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Bulanan
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400 flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs">Memuat laporan...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-gray-400 border border-dashed border-gray-200 rounded-xl">
            <Archive className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-medium">Belum ada data pemanfaatan sampah.</p>
          </div>
        ) : activeTab === "realtime" ? (
          /* Realtime View */
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm text-left">
              <thead className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Program & Teknologi</th>
                  <th className="px-6 py-3.5">Bahan Baku</th>
                  <th className="px-6 py-3.5 text-center">Volume <span className="normal-case">(Kg)</span></th>
                  <th className="px-6 py-3.5 text-center">Hasil Pemanfaatan <span className="normal-case">(Kg)</span></th>
                  <th className="px-6 py-3.5">Wilayah RW</th>
                  <th className="px-6 py-3.5">Tanggal</th>
                  <th className="px-6 py-3.5 text-center">Bukti Foto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 align-middle">
                      <div className="font-bold text-gray-800">{item.program.replace("_", " ")}</div>
                      <div className="text-xs text-gray-500">{item.teknologi}</div>
                    </td>
                    <td className="px-6 py-4 align-middle">
                      <span className="text-gray-700 font-medium">{item.bahanBaku}</span>
                    </td>
                    <td className="px-6 py-4 text-center align-middle">
                      <span className="font-extrabold text-gray-900 text-base">{Number(item.volumeBahanBaku)}</span>
                    </td>
                    <td className="px-6 py-4 text-center align-middle">
                      <span className="font-extrabold text-gray-900 text-base">{Number(item.hasil)}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 align-middle">
                      {item.rw?.name || `RW ID ${item.rwId}`}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap align-middle">
                      {new Date(item.tanggalPencatatan).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-center align-middle">
                      {item.fotoDokumentasiUrl ? (
                        <a
                          href={item.fotoDokumentasiUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block hover:scale-105 transition-transform"
                        >
                          <img
                            src={item.fotoDokumentasiUrl}
                            alt="Bukti"
                            className="w-12 h-12 rounded-xl object-cover border border-gray-200 shadow-sm mx-auto"
                          />
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === "weekly" ? (
          /* Weekly View */
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm text-left">
              <thead className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Periode Laporan</th>
                  <th className="px-6 py-3.5">Program</th>
                  <th className="px-6 py-3.5 text-center">Total Bahan Baku <span className="normal-case">(Kg)</span></th>
                  <th className="px-6 py-3.5 text-center">Total Hasil Panen <span className="normal-case">(Kg)</span></th>
                  <th className="px-6 py-3.5">Wilayah RW</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {getWeeklyGroup().map((w, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-700 align-middle whitespace-nowrap">
                      {w.label}
                    </td>
                    <td className="px-6 py-4 align-middle">
                      <div className="font-bold text-gray-800">{w.program.replace("_", " ")}</div>
                      <div className="text-xs text-gray-500">{w.teknologi}</div>
                    </td>
                    <td className="px-6 py-4 text-center align-middle font-extrabold text-gray-900 text-base">
                      {w.volumeBahanBaku.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 text-center align-middle font-extrabold text-gray-900 text-base">
                      {w.hasil.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 text-gray-600 align-middle">
                      {w.rwName} (Kel. {w.kelName})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Monthly View */
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm text-left">
              <thead className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Bulan</th>
                  <th className="px-6 py-3.5">Program</th>
                  <th className="px-6 py-3.5 text-center">Total Bahan Baku <span className="normal-case">(Kg)</span></th>
                  <th className="px-6 py-3.5 text-center">Total Hasil Panen <span className="normal-case">(Kg)</span></th>
                  <th className="px-6 py-3.5">Wilayah RW</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {getMonthlyGroup().map((m, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-700 align-middle whitespace-nowrap">
                      {m.label}
                    </td>
                    <td className="px-6 py-4 align-middle">
                      <div className="font-bold text-gray-800">{m.program.replace("_", " ")}</div>
                      <div className="text-xs text-gray-500">{m.teknologi}</div>
                    </td>
                    <td className="px-6 py-4 text-center align-middle font-extrabold text-gray-900 text-base">
                      {m.volumeBahanBaku.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 text-center align-middle font-extrabold text-gray-900 text-base">
                      {m.hasil.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 text-gray-600 align-middle">
                      {m.rwName} (Kel. {m.kelName})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HasilPemanfaatan;
