import React from "react";
import {
  KKN_DISTRIBUTION_DATA,
  KKN_DISTRIBUTION_TOTALS,
} from "../../constants/kknInfographicsData";
import type { KelurahanDistribution } from "../../constants/kknInfographicsData";

export const KknLocationPlacementSection: React.FC = () => {
  const maxMhs = Math.max(...KKN_DISTRIBUTION_DATA.map((d: KelurahanDistribution) => d.mhsCount));

  return (
    <section className="py-16 md:py-24 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-12">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#1D3B2F] dark:text-emerald-400 bg-[#1D3B2F]/10 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-[#1D3B2F]/20 dark:border-emerald-700/40">
            Penempatan Lokasi
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-slate-100 mt-3 tracking-tight">
            Sebaran 560 Mahasiswa ke 6 Kelurahan
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-2xl">
            Distribusi peserta KKN Tematik Kecamatan Coblong berdasarkan hasil pemetaan wilayah dan kebutuhan pendampingan masyarakat.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Horizontal Bar Chart (Terurut Ascending 38 -> 163) */}
          <div className="lg:col-span-7 bg-slate-50/70 dark:bg-slate-800/60 p-6 md:p-8 rounded-3xl border border-slate-200/70 dark:border-slate-700 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 text-center uppercase tracking-wider mb-6">
              Sebaran Mahasiswa per Kelurahan
            </h3>

            <div className="space-y-4">
              {KKN_DISTRIBUTION_DATA.map((item: KelurahanDistribution) => {
                const widthPct = Math.round((item.mhsCount / maxMhs) * 100);
                return (
                  <div key={item.id} className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>{item.name}</span>
                      <span className="text-slate-900 dark:text-slate-100">{item.mhsCount} Mahasiswa</span>
                    </div>
                    <div className="h-9 w-full bg-slate-200/80 dark:bg-slate-700 rounded-xl overflow-hidden p-1 flex items-center">
                      <div
                        className="h-full bg-[#1D3B2F] dark:bg-emerald-600 rounded-lg transition-all duration-700 ease-out flex items-center justify-end px-3"
                        style={{ width: `${widthPct}%` }}
                      >
                        <span className="text-xs font-extrabold text-white">
                          {item.mhsCount}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Rekapitulasi Data (Dago 10 Klp/10 DPL, Total 38 Klp/38 DPL) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-50/70 dark:bg-slate-800/60 rounded-3xl border border-slate-200/70 dark:border-slate-700 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#1D3B2F] dark:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Kelurahan</th>
                    <th className="py-3.5 px-3 text-center">Mhs</th>
                    <th className="py-3.5 px-3 text-center">Klp</th>
                    <th className="py-3.5 px-3 text-center">DPL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 dark:divide-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200">
                  {KKN_DISTRIBUTION_DATA.map((item: KelurahanDistribution, idx: number) => (
                    <tr
                      key={item.id}
                      className={idx % 2 === 1 ? "bg-slate-100/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-700/50" : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-700/50"}
                    >
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">{item.name}</td>
                      <td className="py-3 px-3 text-center font-bold">{item.mhsCount}</td>
                      <td className="py-3 px-3 text-center font-bold text-[#1D3B2F] dark:text-emerald-400">{item.klpCount}</td>
                      <td className="py-3 px-3 text-center font-bold text-[#1D3B2F] dark:text-emerald-400">{item.dplCount}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-200/70 dark:bg-slate-750 text-xs font-extrabold text-slate-900 dark:text-slate-100 border-t-2 border-slate-300 dark:border-slate-600">
                    <td className="py-3.5 px-4 uppercase tracking-wider">TOTAL</td>
                    <td className="py-3.5 px-3 text-center">{KKN_DISTRIBUTION_TOTALS.totalMhs}</td>
                    <td className="py-3.5 px-3 text-center text-[#1D3B2F] dark:text-emerald-400">{KKN_DISTRIBUTION_TOTALS.totalKlp}</td>
                    <td className="py-3.5 px-3 text-center text-[#1D3B2F] dark:text-emerald-400">{KKN_DISTRIBUTION_TOTALS.totalDpl}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 italic leading-relaxed px-1">
              * Setiap kelompok terdiri dari 13–18 mahasiswa lintas program studi, didampingi 1 DPL (Dosen Pendamping Lapangan).
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default KknLocationPlacementSection;
