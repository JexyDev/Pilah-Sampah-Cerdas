import React, { useEffect, useState } from "react";
import { Loader2, Medal, TrendingUp, TrendingDown, Minus, BarChart2, Users } from "lucide-react";
import { useLeaderboardStore } from "../../store/useLeaderboardStore";
import { Badge } from "../../components/common/Badge";
import { BarChartRace } from "../../components/BarChartRace";

const Leaderboard: React.FC = () => {
  const { users, isLoading, error, fetchLeaderboard } = useLeaderboardStore();
  const [activeTab, setActiveTab] = useState<"citizens" | "kelurahan">("citizens");

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  if (isLoading && users.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-green-600" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-6 bg-red-50 text-red-600 rounded-xl">
        <p>Error: {error}</p>
        <button className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg" onClick={fetchLeaderboard}>
          Coba Lagi
        </button>
      </div>
    );
  }

  // Ambil top 3 untuk ranking card
  const top3 = users.slice(0, 3);
  const rest = users.slice(3);

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-4">
      {/* Tab Switcher */}
      <div className="flex justify-center border-b border-slate-200">
        <button
          onClick={() => setActiveTab("citizens")}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-bold transition-all ${
            activeTab === "citizens"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Users size={16} />
          Leaderboard Warga
        </button>
        <button
          onClick={() => setActiveTab("kelurahan")}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-bold transition-all ${
            activeTab === "kelurahan"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <BarChart2 size={16} />
          Persaingan Kelurahan (Race)
        </button>
      </div>

      {activeTab === "kelurahan" ? (
        <BarChartRace />
      ) : (
        <>
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black text-slate-800">Leaderboard Warga</h2>
            <p className="text-slate-500 text-sm">Peringkat warga dengan pengumpulan poin terbanyak bulan ini</p>
          </div>

          {/* Top 3 Ranking Cards */}
          <div className="flex flex-col md:flex-row justify-center items-end gap-4 md:gap-6 pt-10">
            {top3.map((u) => {
              // Visuals based on rank
              const isFirst = u.rank === 1;
              const isSecond = u.rank === 2;
              
              let heightClass = isFirst ? "h-64" : (isSecond ? "h-56" : "h-48");
              let colorClass = isFirst ? "from-yellow-400 to-amber-500" : (isSecond ? "from-slate-300 to-gray-400" : "from-orange-300 to-orange-500");
              let medalColor = isFirst ? "#FDE047" : (isSecond ? "#E5E7EB" : "#FDBA74");

              // Simulasi indikator naik/turun
              const trendIcon = u.rank % 2 === 0 ? <TrendingUp className="text-emerald-500 w-4 h-4" /> : <Minus className="text-slate-400 w-4 h-4" />;

              return (
                <div key={u.id} className={`w-full md:w-64 flex flex-col items-center justify-end relative order-${isFirst ? '2' : (isSecond ? '1' : '3')}`}>
                  <div className="absolute -top-12 z-10 flex flex-col items-center">
                    <Medal color={medalColor} size={48} className="drop-shadow-lg" />
                    <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded-full text-xs shadow-sm mt-[-10px]">
                      Peringkat {u.rank}
                    </span>
                  </div>
                  <div className={`w-full rounded-t-2xl bg-gradient-to-t ${colorClass} p-4 text-center shadow-lg flex flex-col justify-end ${heightClass}`}>
                    <h3 className="font-black text-white text-lg truncate drop-shadow-md">{u.name}</h3>
                    <p className="text-white/90 font-bold text-sm drop-shadow-sm">{u.points.toLocaleString()} Pts</p>
                    <div className="mt-2 bg-white/20 rounded-full px-2 py-1 flex items-center justify-center gap-1 w-fit mx-auto backdrop-blur-sm">
                      {trendIcon}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rest of Leaderboard Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Peringkat</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Nama Warga</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase">Total Poin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rest.map((u) => {
                  const trendIcon = u.rank % 3 === 0 ? <TrendingUp className="text-emerald-500 w-4 h-4" /> : (u.rank % 3 === 1 ? <TrendingDown className="text-rose-500 w-4 h-4" /> : <Minus className="text-slate-400 w-4 h-4" />);
                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-500 w-6 text-center">{u.rank}</span>
                          {trendIcon}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{u.name}</td>
                      <td className="px-6 py-4">
                        <Badge status="ACTIVE" />
                      </td>
                      <td className="px-6 py-4 font-black text-green-600 text-right">{u.points.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default Leaderboard;
