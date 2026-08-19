import React, { useState, useEffect } from "react";
import { Award, Scale, CheckCircle2, Trophy, Flame } from "lucide-react";
import api from "../services/api";

interface KelurahanMetrics {
  name: string;
  color: string;
  logo: string;
  tonaseKg: number;
  compliancePct: number;
  totalPoints: number;
}

const KEL_STYLE_MAP: Record<string, { color: string; logo: string }> = {
  sekeloa: { color: "bg-emerald-500", logo: "🌿" },
  cipaganti: { color: "bg-blue-500", logo: "♻️" },
  "sadang serang": { color: "bg-amber-500", logo: "🏡" },
  "lebak siliwangi": { color: "bg-purple-500", logo: "✨" },
  "lebak gede": { color: "bg-indigo-500", logo: "💧" },
  dago: { color: "bg-rose-500", logo: "🍃" },
};

export const BarChartRace: React.FC = () => {
  const [metricTab, setMetricTab] = useState<"TONASE" | "KEPATUHAN" | "POIN">("TONASE");
  const [kelurahanData, setKelurahanData] = useState<KelurahanMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKelurahanRealData = async () => {
      try {
        setLoading(true);
        const res = await api.get("/gamification/leaderboard");
        if (res.data?.success && res.data.data?.regions && Array.isArray(res.data.data.regions)) {
          const regions = res.data.data.regions;
          const mapped: KelurahanMetrics[] = regions.map((r: any) => {
            const rawName = r.kelurahanName || r.name || "Kelurahan";
            const cleanKey = rawName.toLowerCase().replace(/^kelurahan\s*/i, "").replace(/^kel\.\s*/i, "").trim();
            const style = KEL_STYLE_MAP[cleanKey] || { color: "bg-emerald-500", logo: "📍" };
            return {
              name: rawName.startsWith("Kel") ? rawName : `Kel. ${rawName}`,
              color: style.color,
              logo: style.logo,
              tonaseKg: parseFloat(Number(r.totalWeightKg || r.totalWeight || (r.totalPoints ? r.totalPoints * 0.1 : 0)).toFixed(1)),
              compliancePct: Math.min(100, Math.max(0, Math.round(Number(r.complianceRate ?? r.compliance ?? 0)))),
              totalPoints: Math.round(Number(r.totalPoints || 0)),
            };
          });
          setKelurahanData(mapped);
        }
      } catch (err) {
        console.error("Gagal memuat data real kelurahan untuk BarChartRace:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchKelurahanRealData();
  }, []);

  const getScore = (item: KelurahanMetrics) => {
    if (metricTab === "TONASE") return item.tonaseKg;
    if (metricTab === "KEPATUHAN") return item.compliancePct;
    return item.totalPoints;
  };

  const getUnit = () => {
    if (metricTab === "TONASE") return "Kg";
    if (metricTab === "KEPATUHAN") return "%";
    return "Poin";
  };

  const sortedData = [...kelurahanData].sort((a, b) => getScore(b) - getScore(a));
  const maxScore = Math.max(...sortedData.map((d) => getScore(d)), 1);

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
      {/* Header & Metric Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-700/40 shadow-2xs">
              <Award size={18} className="animate-pulse" />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-800 dark:text-slate-100 tracking-tight">
                Peringkat Kelurahan Teraktif
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                Peringkat real-time hasil akumulasi data dari seluruh Rukun Warga
              </p>
            </div>
          </div>
        </div>

        {/* Metric Selector Pills */}
        <div className="flex items-center bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700 self-stretch sm:self-auto justify-center">
          <button
            onClick={() => setMetricTab("TONASE")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              metricTab === "TONASE"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs border border-slate-200/60 dark:border-slate-700"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Scale size={13} className="text-emerald-600 dark:text-emerald-400" />
            Tonase (Kg)
          </button>

          <button
            onClick={() => setMetricTab("KEPATUHAN")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              metricTab === "KEPATUHAN"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs border border-slate-200/60 dark:border-slate-700"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <CheckCircle2 size={13} className="text-blue-600 dark:text-blue-400" />
            Kepatuhan (%)
          </button>

          <button
            onClick={() => setMetricTab("POIN")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              metricTab === "POIN"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs border border-slate-200/60 dark:border-slate-700"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Trophy size={13} className="text-amber-500 dark:text-amber-400" />
            Total Poin
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-slate-400 dark:text-slate-500 text-xs font-semibold">
          Memuat data real kelurahan...
        </div>
      ) : sortedData.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-slate-400 dark:text-slate-500 text-xs font-semibold">
          Tidak ada data kelurahan ditemukan.
        </div>
      ) : (
        <div className="relative min-h-60 w-full space-y-3">
          {sortedData.map((item, index) => {
            const score = getScore(item);
            const widthPct = maxScore > 0 ? (score / maxScore) * 85 : 5;
            const isRank1 = index === 0;

            return (
              <div
                key={item.name}
                className="w-full flex items-center transition-all duration-700 ease-out group"
                style={{ height: "42px" }}
              >
                {/* Kelurahan Label */}
                <div className="w-40 text-xs font-extrabold text-slate-800 dark:text-slate-200 truncate pr-2 flex items-center gap-2">
                  <span className="w-5 text-center font-black text-slate-400 dark:text-slate-500 text-[11px]">
                    #{index + 1}
                  </span>
                  <span className="text-base">{item.logo}</span>
                  <span className="truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {item.name}
                  </span>
                  {isRank1 && (
                    <span className="text-amber-500 flex items-center gap-0.5 text-[10px] font-black uppercase bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-md border border-amber-200 dark:border-amber-700/40">
                      <Flame size={11} className="fill-amber-500" /> TOP
                    </span>
                  )}
                </div>

                {/* Animated Progress Bar */}
                <div className="flex-1 bg-slate-50 dark:bg-slate-800 h-8 rounded-full overflow-hidden relative border border-slate-100 dark:border-slate-700 shadow-2xs">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all duration-700 ease-out flex items-center justify-end px-3 shadow-inner`}
                    style={{ width: `${Math.max(widthPct, 10)}%` }}
                  >
                    <span className="text-[11px] font-black text-white drop-shadow-sm font-mono">
                      {score} {getUnit()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
