import React from "react";
import { KELURAHAN_ISSUES_SOLUTIONS } from "../../constants/kknInfographicsData";
import type { KelurahanIssueSolution } from "../../constants/kknInfographicsData";

export const KelurahanGovernanceSection: React.FC = () => {
  return (
    <section className="py-16 md:py-24 bg-slate-50/50 border-b border-slate-200/80 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-12">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#1D3B2F] bg-[#1D3B2F]/10 px-3 py-1 rounded-full">
            Tata Kelola Sampah
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-3 tracking-tight">
            Masalah Sampah di Setiap Kelurahan
          </h2>
          <p className="text-sm text-slate-600 mt-2 max-w-2xl">
            Identifikasi isu pemilahan sampah spesifik di 6 kelurahan Kecamatan Coblong beserta strategi intervensi KKN Tematik.
          </p>
        </div>

        {/* Governance Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="bg-[#1D3B2F] text-white text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-6 w-1/5">Kelurahan</th>
                  <th className="py-4 px-6 w-2/5">Masalah Utama</th>
                  <th className="py-4 px-6 w-2/5">Arah Penyelesaian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {KELURAHAN_ISSUES_SOLUTIONS.map(
                  (item: KelurahanIssueSolution, idx: number) => (
                    <tr
                      key={item.id}
                      className={
                        idx % 2 === 1
                          ? "bg-slate-50/60 hover:bg-emerald-50/30 transition-colors"
                          : "bg-white hover:bg-emerald-50/30 transition-colors"
                      }
                    >
                      <td className="py-4 px-6 font-extrabold text-slate-900 text-sm">
                        {item.kelurahan}
                      </td>
                      <td className="py-4 px-6 text-slate-600 leading-relaxed">
                        {item.masalahUtama}
                      </td>
                      <td className="py-4 px-6 text-slate-800 font-semibold leading-relaxed">
                        {item.arahPenyelesaian}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};

export default KelurahanGovernanceSection;
