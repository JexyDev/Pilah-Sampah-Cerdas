import { BarChart3, Search, Loader2, PlusCircle, MinusCircle, X, SearchX, Star, History } from "lucide-react";
/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { useAuthStore } from "../../store/useAuthStore";

const PoinWarga: React.FC = () => {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuthStore();
  const isAuthorizedToAdjust = ["SUPER_USER", "ADMIN_DLH", "RW"].includes(user?.peran || "");

  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustPointsVal, setAdjustPointsVal] = useState(50);
  const [adjustDesc, setAdjustDesc] = useState("Bonus Aktivitas Daur Ulang Mandiri");
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [userDetail, setUserDetail] = useState<any | null>(null);

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

  const handleAdjustPointsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsSubmittingAdjust(true);
    try {
      await api.post("/points/adjust", {
        userId: selectedUser.id,
        points: Number(adjustPointsVal),
        description: adjustDesc,
      });
      toast.success("Penyesuaian poin berhasil disimpan!");
      setIsAdjustModalOpen(false);
      handleViewDetail(selectedUser);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menyesuaikan poin");
    } finally {
      setIsSubmittingAdjust(false);
    }
  };

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
        medal: "🥇",
      };
    if (rank === 2)
      return {
        bg: "bg-gray-100 dark:bg-slate-800",
        color: "text-gray-600",
        border: "border-gray-200",
        medal: "🥈",
      };
    if (rank === 3)
      return {
        bg: "bg-orange-100",
        color: "text-orange-700",
        border: "border-orange-200",
        medal: "🥉",
      };
    return {
      bg: "bg-surface-container",
      color: "text-on-surface",
      border: "border-outline-variant/30",
      medal: "",
    };
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      {/* 1. Header Bar (Clean Multi-Tier Executive UI) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
        {/* Tier 1: Title & Status Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
              Gamifikasi &amp; Poin Warga
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Pantau perolehan poin gamifikasi, riwayat apresiasi, dan peringkat setoran warga.
            </p>
          </div>

          <div className="self-start sm:self-center flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Ledger Poin Aktif
            </span>
          </div>
        </div>

        {/* Tier 2: Stats & Information */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 font-medium">
          <div>
            Aturan: <strong className="text-slate-800 dark:text-slate-100">+10 Poin Registrasi Tempat Sampah • +50 Poin Ide Daur Ulang Disetujui</strong>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Total Terdata:</span>
            <span className="font-black text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200/60">
              {filteredLeaders.length} Warga
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Leaderboard Section */}
        <section
          className={`bg-white dark:bg-slate-900 rounded-2xl shadow-xs p-5 flex flex-col h-full border border-slate-200/80 dark:border-slate-800 ${selectedUser ? "xl:col-span-8" : "xl:col-span-12"}`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 pb-4 border-b border-outline-variant/30 gap-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="text-primary bg-green-50 dark:bg-emerald-950 p-1.5 rounded-lg" />
              <h3 className="text-[20px] font-bold text-on-surface">Leaderboard Warga</h3>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto">
              {/* POIN-02: Search bar fungsional */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={14} />
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
                    <X size={16} />
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
                    <div className="relative mb-2">
                      <img
                        src={l.fotoProfil || "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=256&h=256&q=80"}
                        alt={l.nama}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-sm"
                        onError={(e: any) => {
                          e.target.src = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=256&h=256&q=80";
                        }}
                      />
                      <span className="absolute -bottom-1 -right-1 text-base">{mc.medal}</span>
                    </div>
                    <p className="text-[13px] font-bold text-center truncate w-full">
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
                <Loader2 className="animate-spin text-primary" size={32} />
                <p>Memuat leaderboard...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-error font-medium">{error}</div>
            ) : filteredLeaders.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant flex flex-col items-center gap-2">
                <SearchX size={32} />
                <p className="text-[14px]">Tidak ada warga dengan nama "{searchQuery}"</p>
              </div>
            ) : (
              displayedLeaders.map((leader) => {
                const mc = medalColor(leader.rank);
                const isSelected = selectedUser?.id === leader.id;
                return (
                  <div
                    key={leader.rank}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border ${isSelected ? "border-primary bg-emerald-50/50 dark:bg-emerald-950/40" : mc.border + " bg-white dark:bg-slate-800/80 hover:bg-surface-container-lowest"} transition-colors gap-4 cursor-pointer`}
                    onClick={() => handleViewDetail(leader)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative shrink-0">
                        <img
                          src={leader.fotoProfil || "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=256&h=256&q=80"}
                          alt={leader.nama}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-800"
                          onError={(e: any) => {
                            e.target.src = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=256&h=256&q=80";
                          }}
                        />
                        {leader.rank <= 3 ? (
                          <span className="absolute -top-1 -right-1 text-xs">{mc.medal}</span>
                        ) : (
                          <span className="absolute -bottom-1 -right-1 text-[9px] font-bold bg-slate-800 text-white px-1 rounded-full">
                            #{leader.rank}
                          </span>
                        )}
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
              Tampilkan {filteredLeaders.length - 10} warga lainnya →
            </button>
          )}
        </section>

        {/* POIN-01: Detail Panel */}
        {selectedUser && (
          <section className="xl:col-span-4 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-outline-variant/50 flex flex-col overflow-hidden sticky top-4">
            <div className="p-4 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-low/30">
              <h3 className="text-[16px] font-bold text-on-surface">Detail Profil</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded hover:bg-surface-container-low"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 flex flex-col gap-4 overflow-y-auto max-h-[70vh]">
              {/* Header profil */}
              <div className="flex items-center gap-3">
                <img
                  src={selectedUser.fotoProfil || "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=256&h=256&q=80"}
                  alt={selectedUser.nama}
                  className="w-12 h-12 rounded-full object-cover border-2 border-primary/30 shadow-sm"
                  onError={(e: any) => {
                    e.target.src = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=256&h=256&q=80";
                  }}
                />
                <div>
                  <p className="font-bold text-on-surface text-[16px]">{selectedUser.nama}</p>
                  <p className="text-[12px] text-on-surface-variant">{selectedUser.rtRw}</p>
                  <p className="text-[11px] font-bold text-primary flex items-center gap-1">
                    Peringkat #{selectedUser.rank} {medalColor(selectedUser.rank).medal}
                  </p>
                </div>
              </div>

              {/* Total poin */}
              <div className="bg-green-50 rounded-xl p-4 flex items-center justify-between border border-green-100">
                <div className="flex items-center gap-3">
                  <Star className="text-primary" size={28} />
                  <div>
                    <p className="text-[28px] font-bold text-primary">
                      {(selectedUser.poin || 0).toLocaleString()}
                    </p>
                    <p className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wider">
                      Total Poin Terkumpul
                    </p>
                  </div>
                </div>
              </div>

              {isAuthorizedToAdjust && (
                <button
                  onClick={() => setIsAdjustModalOpen(true)}
                  className="w-full py-2.5 bg-primary hover:bg-primary/90 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                  <PlusCircle size={16} /> Beri / Penyesuaian Poin Manual
                </button>
              )}

              {/* Riwayat poin */}
              <div>
                <p className="text-[12px] font-bold text-on-surface-variant uppercase tracking-wider mb-3">
                  Riwayat Poin
                </p>
                {loadingDetail ? (
                  <div className="flex items-center justify-center p-6 gap-2 text-on-surface-variant">
                    <Loader2 className="animate-spin text-primary" />
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
                          {h.points >= 0 ? <PlusCircle className={`text-[18px] ${h.points >= 0 ? "text-green-500" : "text-red-500"}`} size={18}/> : <MinusCircle className={`text-[18px] ${h.points >= 0 ? "text-green-500" : "text-red-500"}`} size={18}/>}
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
                    <History size={28} />
                    <p className="text-[12px]">Belum ada riwayat poin</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
      {/* Modal Penyesuaian Poin Manual */}
      {isAdjustModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/60">
              <h3 className="text-[18px] font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Star className="text-amber-500" size={20} /> Penyesuaian Poin Warga
              </h3>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAdjustPointsSubmit} className="p-6 space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-600 dark:text-slate-400">Penerima Poin:</span>
                <span className="font-extrabold text-slate-900 dark:text-slate-100">{selectedUser.nama} ({selectedUser.rtRw})</span>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Jumlah Poin (Gunakan nilai negatif (-) untuk pengurangan)
                </label>
                <input
                  type="number"
                  required
                  value={adjustPointsVal}
                  onChange={(e) => setAdjustPointsVal(Number(e.target.value))}
                  placeholder="Contoh: 50 atau -20"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-sm font-black text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Keterangan / Alasan Penyesuaian
                </label>
                <textarea
                  required
                  rows={3}
                  value={adjustDesc}
                  onChange={(e) => setAdjustDesc(e.target.value)}
                  placeholder="Contoh: Bonus partisipasi acara kebersihan RW"
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdjust}
                  className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-extrabold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isSubmittingAdjust && <Loader2 className="animate-spin" size={16} />}
                  Simpan Poin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PoinWarga;
