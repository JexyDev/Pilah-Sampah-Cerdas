/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import api from "../../services/api";

const PoinWarga: React.FC = () => {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); // POIN-02
  const [showAll, setShowAll] = useState(false); // POIN-03
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userDetail, setUserDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    const fetchLeaders = async () => {
      try {
        const response = await api.get("/points/leaderboard");
        const raw = response.data.data;
        setLeaders(Array.isArray(raw) ? raw : []);
      } catch (err) {
        setError("Gagal memuat data dari server.");
        toast.error("Gagal memuat leaderboard");
      } finally {
        setLoading(false);
      }
    };
    fetchLeaders();
  }, []);

  // POIN-02: Search filter â€” filter by nama or rtRw
  const filteredLeaders = useMemo(() => {
    if (!searchQuery.trim()) return leaders;
    const q = searchQuery.toLowerCase();
    return leaders.filter(
      (l) => (l.nama || "").toLowerCase().includes(q) || (l.rtRw || "").toLowerCase().includes(q)
    );
  }, [leaders, searchQuery]);

  // POIN-03: Lihat Semua â€” show top 10 or all
  const displayedLeaders = showAll ? filteredLeaders : filteredLeaders.slice(0, 10);

  // POIN-01: Fetch detail profil & riwayat poin saat klik "Detail Profil"
  const handleViewDetail = async (leader: any) => {
    setSelectedUser(leader);
    setLoadingDetail(true);
    try {
      const response = await api.get(`/points/history/${leader.id}`);
      setUserDetail(response.data.data);
    } catch (err) {
      toast.error("Gagal memuat detail poin warga");
      setUserDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const medalColor = (rank: number) => {
    if (rank === 1)
      return {
        bg: "bg-yellow-100",
        color: "text-yellow-700",
        border: "border-yellow-200",
        medal: "ðŸ¥‡",
      };
    if (rank === 2)
      return {
        bg: "bg-gray-100",
        color: "text-gray-600",
        border: "border-gray-200",
        medal: "ðŸ¥ˆ",
      };
    if (rank === 3)
      return {
        bg: "bg-orange-100",
        color: "text-orange-700",
        border: "border-orange-200",
        medal: "ðŸ¥‰",
      };
    return {
      bg: "bg-surface-container",
      color: "text-on-surface",
      border: "border-outline-variant/30",
      medal: "",
    };
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h2 className="text-2xl font-bold text-on-surface">Poin Warga</h2>
          <p className="text-[14px] text-on-surface-variant mt-1">
            Pantau leaderboard dan peringkat setoran poin warga.
          </p>
        </div>
        <div className="text-[12px] text-on-surface-variant font-medium">
          {filteredLeaders.length} warga terdaftar
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Leaderboard Section */}
        <section
          className={`bg-white rounded-xl shadow-sm p-5 flex flex-col h-full border border-outline-variant/50 ${selectedUser ? "xl:col-span-8" : "xl:col-span-12"}`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 pb-4 border-b border-outline-variant/30 gap-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary bg-green-50 p-1.5 rounded-lg">
                leaderboard
              </span>
              <h3 className="text-[20px] font-bold text-on-surface">Leaderboard Warga</h3>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto">
              {/* POIN-02: Search bar fungsional */}
              <div className="relative w-full sm:w-64">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Cari Nama atau RT/RW..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-outline-variant/50 bg-surface-container-lowest text-[12px] focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                )}
              </div>
              {/* POIN-03: Lihat Semua fungsional */}
              <button
                onClick={() => setShowAll((v) => !v)}
                className="text-primary text-[12px] font-bold hover:underline whitespace-nowrap"
              >
                {showAll ? `Tampilkan Top 10` : `Lihat Semua (${filteredLeaders.length})`}
              </button>
            </div>
          </div>

          {/* Stats bar top 3 */}
          {!searchQuery && !loading && leaders.length >= 3 && (
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[leaders[1], leaders[0], leaders[2]].map((l, idx) => {
                if (!l) return null;
                const pos = idx === 0 ? 2 : idx === 1 ? 1 : 3;
                const mc = medalColor(pos);
                return (
                  <div
                    key={l.id}
                    className={`flex flex-col items-center p-3 rounded-xl border ${mc.border} ${mc.bg} ${pos === 1 ? "ring-2 ring-yellow-300 scale-105" : ""} transition-all`}
                  >
                    <span className="text-2xl mb-1">{mc.medal}</span>
                    <p className="text-[13px] font-bold text-center truncate w-full text-center">
                      {l.nama}
                    </p>
                    <p className="text-[10px] text-on-surface-variant">{l.rtRw}</p>
                    <p className={`text-xl font-bold mt-1 ${mc.color}`}>
                      {(l.poin || 0).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-on-surface-variant">poin</p>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex flex-col gap-2">
            {loading ? (
              <div className="p-8 text-center text-on-surface-variant flex flex-col items-center justify-center gap-3">
                <span className="material-symbols-outlined animate-spin text-primary text-[32px]">
                  autorenew
                </span>
                <p>Memuat leaderboard...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-error font-medium">{error}</div>
            ) : filteredLeaders.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-4xl">search_off</span>
                <p className="text-[14px]">Tidak ada warga dengan nama "{searchQuery}"</p>
              </div>
            ) : (
              displayedLeaders.map((leader) => {
                const mc = medalColor(leader.rank);
                const isSelected = selectedUser?.id === leader.id;
                return (
                  <div
                    key={leader.rank}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border ${isSelected ? "border-primary bg-green-50/50" : mc.border + " bg-white hover:bg-surface-container-lowest"} transition-colors gap-4 cursor-pointer`}
                    onClick={() => handleViewDetail(leader)}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-9 h-9 rounded-full ${mc.bg} ${mc.color} flex items-center justify-center font-bold text-sm border ${mc.border} shrink-0`}
                      >
                        {leader.rank <= 3 ? mc.medal : `#${leader.rank}`}
                      </div>
                      <div>
                        <p className="text-[14px] font-bold text-on-surface">{leader.nama}</p>
                        <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mt-0.5">
                          {leader.rtRw || "RT/RW"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 self-end sm:self-auto">
                      <div className="text-right">
                        <p
                          className={`text-xl font-bold ${leader.rank <= 3 ? "text-primary" : "text-on-surface"}`}
                        >
                          {(leader.poin || 0).toLocaleString()}
                        </p>
                        <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                          Poin
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetail(leader);
                        }}
                        className={`px-4 py-1.5 rounded-lg border ${isSelected ? "border-primary bg-primary text-white" : "border-outline-variant text-on-surface hover:bg-surface-container"} text-[11px] font-bold uppercase tracking-wider transition-colors`}
                      >
                        Detail Profil
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* POIN-03: Tampilkan info jumlah yang disembunyikan */}
          {!showAll && filteredLeaders.length > 10 && (
            <button
              onClick={() => setShowAll(true)}
              className="mt-4 w-full py-2 text-[12px] font-bold text-primary border border-primary/30 rounded-lg hover:bg-green-50 transition-colors"
            >
              Tampilkan {filteredLeaders.length - 10} warga lainnya â†’
            </button>
          )}
        </section>

        {/* POIN-01: Detail Panel */}
        {selectedUser && (
          <section className="xl:col-span-4 bg-white rounded-xl shadow-sm border border-outline-variant/50 flex flex-col overflow-hidden sticky top-4">
            <div className="p-4 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-low/30">
              <h3 className="text-[16px] font-bold text-on-surface">Detail Profil</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded hover:bg-surface-container-low"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-4 flex flex-col gap-4 overflow-y-auto max-h-[70vh]">
              {/* Header profil */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-full ${medalColor(selectedUser.rank).bg} ${medalColor(selectedUser.rank).color} flex items-center justify-center text-xl font-bold border ${medalColor(selectedUser.rank).border}`}
                >
                  {selectedUser.rank <= 3
                    ? medalColor(selectedUser.rank).medal
                    : selectedUser.nama?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-on-surface text-[16px]">{selectedUser.nama}</p>
                  <p className="text-[12px] text-on-surface-variant">{selectedUser.rtRw}</p>
                  <p className="text-[11px] font-bold text-primary">
                    Peringkat #{selectedUser.rank}
                  </p>
                </div>
              </div>

              {/* Total poin */}
              <div className="bg-green-50 rounded-xl p-4 flex items-center gap-3 border border-green-100">
                <span className="material-symbols-outlined text-primary text-[28px]">stars</span>
                <div>
                  <p className="text-[28px] font-bold text-primary">
                    {(selectedUser.poin || 0).toLocaleString()}
                  </p>
                  <p className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wider">
                    Total Poin Terkumpul
                  </p>
                </div>
              </div>

              {/* Riwayat poin */}
              <div>
                <p className="text-[12px] font-bold text-on-surface-variant uppercase tracking-wider mb-3">
                  Riwayat Poin
                </p>
                {loadingDetail ? (
                  <div className="flex items-center justify-center p-6 gap-2 text-on-surface-variant">
                    <span className="material-symbols-outlined animate-spin text-primary">
                      autorenew
                    </span>
                    <span className="text-[13px]">Memuat riwayat...</span>
                  </div>
                ) : userDetail?.history && userDetail.history.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {userDetail.history.slice(0, 15).map((h: any) => (
                      <div
                        key={h.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/20"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`material-symbols-outlined text-[18px] ${h.points >= 0 ? "text-green-500" : "text-red-500"}`}
                          >
                            {h.points >= 0 ? "add_circle" : "remove_circle"}
                          </span>
                          <div>
                            <p className="text-[12px] font-medium text-on-surface">
                              {h.description || "Setoran sampah"}
                            </p>
                            <p className="text-[10px] text-on-surface-variant">
                              {h.createdAt
                                ? new Date(h.createdAt).toLocaleDateString("id-ID", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "-"}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`text-[13px] font-bold ${h.points >= 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          {h.points >= 0 ? "+" : ""}
                          {h.points}
                        </span>
                      </div>
                    ))}
                    {userDetail.history.length > 15 && (
                      <p className="text-center text-[11px] text-on-surface-variant mt-1">
                        + {userDetail.history.length - 15} transaksi lainnya
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-on-surface-variant gap-2">
                    <span className="material-symbols-outlined text-3xl">history</span>
                    <p className="text-[12px]">Belum ada riwayat poin</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default PoinWarga;
