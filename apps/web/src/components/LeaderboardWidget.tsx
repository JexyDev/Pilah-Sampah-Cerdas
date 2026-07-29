import React, { useEffect, useState } from "react";
import api from "../utils/api";
import { Trophy, Loader2, Medal } from "lucide-react";

const LeaderboardWidget: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/gamification/leaderboard");
      if (res.data?.success && res.data.data?.citizens) {
        setLeaderboard(res.data.data.citizens);
      }
    } catch (error) {
      console.error("Gagal memuat leaderboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white/95 backdrop-blur-sm p-6 rounded-xl border border-outline-variant/30 shadow-sm flex flex-col justify-center items-center min-h-[300px]">
        <Loader2 className="animate-spin text-primary mb-2" size={32} />
        <p className="text-xs text-on-surface-variant font-medium">Memuat klasemen poin...</p>
      </div>
    );
  }

  return (
    <div className="bg-white/95 backdrop-blur-sm p-6 rounded-xl border border-outline-variant/30 shadow-sm flex flex-col gap-4 h-full">
      <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
        <h5 className="font-bold text-[15px] text-on-surface flex items-center gap-1.5">
          <Trophy className="text-yellow-500" />
          Papan Peringkat Warga
        </h5>
        <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
          Top 10
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[320px] custom-scrollbar">
        {leaderboard.length === 0 ? (
          <div className="text-center py-6 text-on-surface-variant/75 text-xs">
            Belum ada perolehan poin.
          </div>
        ) : (
          leaderboard.slice(0, 10).map((user, index) => (
            <div
              key={user.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-outline-variant/20 bg-surface-container-lowest hover:bg-surface-container-low transition-colors"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ${
                  index === 0
                    ? "bg-yellow-100 text-yellow-600 border border-yellow-200"
                    : index === 1
                      ? "bg-slate-200 text-slate-600 border border-slate-300"
                      : index === 2
                        ? "bg-amber-100 text-amber-700 border border-amber-200"
                        : "bg-primary/10 text-primary border border-primary/20"
                }`}
              >
                {index < 3 ? <Medal size={16} /> : index + 1}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-on-surface truncate">
                  {user.name}
                </p>
                <p className="text-[10px] text-on-surface-variant truncate">
                  {user.wilayah || "-"}
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[13px] font-extrabold text-primary block">
                  {user.totalPoints?.toLocaleString("id-ID") || 0}
                </span>
                <span className="text-[9px] text-on-surface-variant font-medium uppercase tracking-wider">
                  Poin
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LeaderboardWidget;
