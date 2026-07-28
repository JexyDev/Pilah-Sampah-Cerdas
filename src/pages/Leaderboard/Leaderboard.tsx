import React, { useEffect, useState } from "react";
import { Loader2, Medal, TrendingUp, TrendingDown, Minus, BarChart2, Users, Search, ArrowUpDown, MapPin, GraduationCap } from "lucide-react";
import { useLeaderboardStore } from "../../store/useLeaderboardStore";
import { Badge } from "../../components/common/Badge";
import { BarChartRace } from "../../components/BarChartRace";

type LeaderboardTab = "citizens" | "kelurahan" | "rtrw" | "mahasiswa" | "pengangkut";

interface GenericItem {
  id: string;
  rank: number;
  name: string;
  subtitle: string;
  extraInfo?: string;
  points: number;
}

const Leaderboard: React.FC = () => {
  const { users, rtRw, mahasiswa, pengangkut, isLoading, error, fetchLeaderboard } = useLeaderboardStore();
  const [activeTab, setActiveTab] = useState<LeaderboardTab>("citizens");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"rank" | "name" | "points" | "subtitle">("rank");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

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

  // --- Prepare Data based on Tab ---
  let currentData: GenericItem[] = [];
  let pageTitle = "";
  let pageSubtitle = "";
  let nameHeader = "";
  let subtitleHeader = "";
  let extraInfoHeader = "";

  if (activeTab === "citizens") {
    currentData = users.map((u, i) => ({
      id: u.id,
      rank: u.rank || i + 1,
      name: u.name,
      subtitle: u.wilayah || "-",
      points: u.points
    }));
    pageTitle = "Leaderboard Warga";
    pageSubtitle = "Peringkat warga dengan pengumpulan poin terbanyak bulan ini";
    nameHeader = "Nama Warga";
    subtitleHeader = "RT/RW";
  } else if (activeTab === "rtrw") {
    currentData = rtRw.map((r, i) => ({
      id: r.rtRwId,
      rank: i + 1,
      name: r.rtRwName,
      subtitle: r.kelurahanName,
      points: r.totalPoints
    }));
    pageTitle = "Leaderboard RT/RW";
    pageSubtitle = "Peringkat agregat akumulasi poin tertinggi berdasarkan wilayah RT/RW";
    nameHeader = "RT/RW";
    subtitleHeader = "Kelurahan";
  } else if (activeTab === "mahasiswa") {
    currentData = mahasiswa.map((m, i) => ({
      id: m.id,
      rank: i + 1,
      name: m.name,
      subtitle: m.universityName,
      extraInfo: m.wilayahDampingan,
      points: m.totalPoints
    }));
    pageTitle = "Leaderboard Mahasiswa KKN";
    pageSubtitle = "Performa mahasiswa KKN berdasarkan akumulasi poin dampingan & mandiri";
    nameHeader = "Nama Mahasiswa";
    subtitleHeader = "Asal Universitas";
    extraInfoHeader = "Wilayah Dampingan";
  } else if (activeTab === "pengangkut") {
    currentData = pengangkut.map((p, i) => ({
      id: p.id,
      rank: i + 1,
      name: p.name,
      subtitle: p.wilayah,
      points: p.totalPoints
    }));
    pageTitle = "Leaderboard Petugas Pengangkut";
    pageSubtitle = "Peringkat petugas berdasarkan total berat sampah yang diverifikasi (Kg)";
    nameHeader = "Nama Petugas";
    subtitleHeader = "Wilayah Tugas";
  }

  // Search
  if (searchTerm) {
    const lowerSearch = searchTerm.toLowerCase();
    currentData = currentData.filter((u) => 
      u.name.toLowerCase().includes(lowerSearch) || 
      u.subtitle.toLowerCase().includes(lowerSearch)
    );
  }

  // Sort
  currentData = currentData.sort((a, b) => {
    let comparison = 0;
    if (sortBy === "rank") comparison = a.rank - b.rank;
    else if (sortBy === "name") comparison = a.name.localeCompare(b.name);
    else if (sortBy === "points") comparison = a.points - b.points;
    else if (sortBy === "subtitle") comparison = a.subtitle.localeCompare(b.subtitle);

    return sortOrder === "asc" ? comparison : -comparison;
  });

  const toggleSort = (field: "rank" | "name" | "points" | "subtitle") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const top3 = currentData.slice(0, 3);
  const rest = currentData.slice(3);

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-4">
      {/* Tab Switcher */}
      <div className="flex justify-center border-b border-slate-200 overflow-x-auto custom-scrollbar pb-1">
        <button
          onClick={() => setActiveTab("citizens")}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-bold transition-all ${
            activeTab === "citizens" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Users size={16} /> Warga
        </button>
        <button
          onClick={() => setActiveTab("rtrw")}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-bold transition-all ${
            activeTab === "rtrw" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <MapPin size={16} /> RT/RW
        </button>
        <button
          onClick={() => setActiveTab("mahasiswa")}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-bold transition-all ${
            activeTab === "mahasiswa" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <GraduationCap size={16} /> Mahasiswa KKN
        </button>
        <button
          onClick={() => setActiveTab("pengangkut")}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-bold transition-all ${
            activeTab === "pengangkut" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <TrendingUp size={16} /> Pengangkut
        </button>
        <button
          onClick={() => setActiveTab("kelurahan")}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-bold transition-all ${
            activeTab === "kelurahan" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <BarChart2 size={16} /> Persaingan Kelurahan
        </button>
      </div>

      {activeTab === "kelurahan" ? (
        <BarChartRace />
      ) : (
        <>
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black text-slate-800">{pageTitle}</h2>
            <p className="text-slate-500 text-sm">{pageSubtitle}</p>
          </div>

          {/* Top 3 Ranking Cards */}
          <div className="flex flex-col md:flex-row justify-center items-end gap-4 md:gap-6 pt-10">
            {top3.map((u) => {
              const isFirst = u.rank === 1;
              const isSecond = u.rank === 2;
              
              let heightClass = isFirst ? "h-64" : (isSecond ? "h-56" : "h-48");
              let colorClass = isFirst ? "from-yellow-400 to-amber-500" : (isSecond ? "from-slate-300 to-gray-400" : "from-orange-300 to-orange-500");
              let medalColor = isFirst ? "#FDE047" : (isSecond ? "#E5E7EB" : "#FDBA74");
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

          {/* Filter & Sort Controls */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Cari nama atau wilayah..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="text-sm text-slate-500 font-medium">
              Menampilkan <span className="font-bold text-slate-800">{currentData.length}</span> data
            </div>
          </div>

          {/* Rest of Leaderboard Table with Scroll */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              <table className="min-w-full divide-y divide-gray-200 relative">
                <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th 
                      className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => toggleSort("rank")}
                    >
                      <div className="flex items-center gap-2">Peringkat <ArrowUpDown size={14} /></div>
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => toggleSort("name")}
                    >
                      <div className="flex items-center gap-2">{nameHeader} <ArrowUpDown size={14} /></div>
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => toggleSort("subtitle")}
                    >
                      <div className="flex items-center gap-2">{subtitleHeader} <ArrowUpDown size={14} /></div>
                    </th>
                    {extraInfoHeader && (
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                        {extraInfoHeader}
                      </th>
                    )}
                    {activeTab === "citizens" && (
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                    )}
                    <th 
                      className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => toggleSort("points")}
                    >
                      <div className="flex items-center justify-end gap-2"><ArrowUpDown size={14} /> Total Poin</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rest.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        Tidak ada data yang sesuai dengan pencarian Anda.
                      </td>
                    </tr>
                  ) : (
                    rest.map((u) => {
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
                          <td className="px-6 py-4 text-sm text-slate-600">{u.subtitle || "-"}</td>
                          {extraInfoHeader && (
                            <td className="px-6 py-4 text-sm text-slate-600">{u.extraInfo || "-"}</td>
                          )}
                          {activeTab === "citizens" && (
                            <td className="px-6 py-4">
                              <Badge status="ACTIVE" />
                            </td>
                          )}
                          <td className="px-6 py-4 font-black text-green-600 text-right">{u.points.toLocaleString()}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Leaderboard;
