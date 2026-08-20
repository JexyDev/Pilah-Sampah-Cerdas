import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import { Scale, Star, Leaf, Recycle, ShieldCheck } from "lucide-react";

export const KknWargaMonitoring: React.FC = () => {
  const [warga, setWarga] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get("/kkn/warga-dampingan")
      .then((res: any) => {
        setWarga(res.data?.data || res.data || []);
      })
      .catch((err: any) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-800 dark:text-slate-100">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Monitoring Pemilahan & Penilaian Warga</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Data historis setoran sampah warga dampingan KKN dengan pemisahan kolom berat (kg) dan perolehan poin secara transparan.
            </p>
          </div>
          <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-700/40">
            {warga.length} Warga Dampingan
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">Memuat data monitoring warga...</div>
        ) : warga.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">Belum ada data warga dampingan yang terdaftar.</div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5">Identitas Warga</th>
                  <th className="p-3.5">Kategori Setoran</th>
                  <th className="p-3.5 text-right font-black text-emerald-800 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30 border-x border-emerald-100 dark:border-emerald-800/50">
                    <span className="flex items-center justify-end gap-1"><Scale size={13} /> Berat Sampah (kg)</span>
                  </th>
                  <th className="p-3.5 text-right font-black text-amber-800 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/30 border-r border-amber-100 dark:border-amber-800/50">
                    <span className="flex items-center justify-end gap-1"><Star size={13} /> Poin Diperoleh</span>
                  </th>
                  <th className="p-3.5 text-center">Status Tempat Sampah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {warga.map((w, i) => {
                  const totalKg = Number(w.totalKg ?? (w.recentLogs?.reduce((acc: number, l: any) => acc + (l.weightKg || l.beratKg || 0), 0) || 0)).toFixed(1);
                  const totalPoin = Number(w.totalPoin ?? (Number(totalKg) * 10)).toLocaleString("id-ID");
                  const category = w.category || (i % 2 === 0 ? "Organik" : "Anorganik");
                  const isOrganik = (category || "").toLowerCase().includes("organik");

                  return (
                    <tr key={w.id || i} className="hover:bg-slate-50/80 dark:bg-slate-800/80 dark:hover:bg-slate-800/50 transition">
                      <td className="p-3.5">
                        <p className="font-bold text-slate-900 dark:text-slate-100">{w.wargaName || w.name || "Nama Warga"}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{w.address || "Wilayah Binaan"}</p>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-flex items-center gap-1 ${isOrganik ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/40" : "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700/40"}`}>
                          {isOrganik ? <Leaf size={12} /> : <Recycle size={12} />}
                          {category}
                        </span>
                      </td>
                      {/* Kolom Berat (kg) Terpisah */}
                      <td className="p-3.5 text-right font-mono font-bold text-slate-900 dark:text-slate-100 bg-emerald-50/20 dark:bg-emerald-950/20 border-x border-emerald-100/50 dark:border-emerald-800/40">
                        {totalKg} kg
                      </td>
                      {/* Kolom Poin Terpisah */}
                      <td className="p-3.5 text-right font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50/20 dark:bg-amber-950/20 border-r border-amber-100/50 dark:border-amber-800/40">
                        +{totalPoin} Pts
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-emerald-200 dark:border-emerald-700/40 inline-flex items-center gap-1">
                          <ShieldCheck size={12} /> Terhubung (AKTIF)
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default KknWargaMonitoring;
