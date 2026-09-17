/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 *
 * Developer Tool: Simulasi & Normalisasi Poin Mahasiswa KKN
 * Formula (Notulensi 17 September 2026):
 *   Komponen A (60%): (NilaiProkerStep + RataAnggota) / 2
 *   Komponen B (40%): avg(KomponenA semua kelompok) [GLOBAL]
 *   PoinAkhir = (KomponenA x 0.6) + (KomponenB x 0.4)
 */

import React, { useState } from "react";
import {
  Calculator,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Users,
  ClipboardList,
  Zap,
  Info,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/useAuthStore";

// --- Types ---

interface SimulasiMahasiswa {
  studentId: string;
  userId: string;
  nama: string;
  poinAkhir: number;
}

interface SimulasiKelompok {
  kelompokId: string;
  kelompokName: string;
  nilaiProkerStep: number;
  rataRataAssessmentAnggota: number;
  komponenA: number;
  komponenABobot: number;
  komponenBBobot: number;
  poinAkhir: number;
  mahasiswaList: SimulasiMahasiswa[];
}

interface SimulasiResult {
  totalKelompok: number;
  rataRataPoinKelompok: number;
  kelompokList: SimulasiKelompok[];
}

interface NormalisasiDetail {
  kelompokId: string;
  kelompokName: string;
  status: "ok" | "error";
  mahasiswaCount?: number;
  error?: string;
}

interface NormalisasiResult {
  berhasil: number;
  gagal: number;
  detail: NormalisasiDetail[];
}

// --- Badge Step Proker ---

const ProkerStepBadge: React.FC<{ nilai: number }> = ({ nilai }) => {
  if (nilai >= 100)
    return <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">Step 3 — Selesai</span>;
  if (nilai >= 60)
    return <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-[10px] font-bold">Step 2 — Berjalan</span>;
  return <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-[10px] font-bold">Step 1 — Belum Mulai</span>;
};

// --- Main Component ---

export const PoinMahasiswaKknPage: React.FC = () => {
  const authStore = useAuthStore() as any;
  const token: string = authStore.token ?? authStore.accessToken ?? "";

  const [simulasiData, setSimulasiData] = useState<SimulasiResult | null>(null);
  const [loadingSimulasi, setLoadingSimulasi] = useState(false);
  const [loadingNormalisasi, setLoadingNormalisasi] = useState(false);
  const [normalisasiResult, setNormalisasiResult] = useState<NormalisasiResult | null>(null);
  const [expandedKelompok, setExpandedKelompok] = useState<Set<string>>(new Set());
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const authHeaders: Record<string, string> = { Authorization: `Bearer ${token}` };

  const jalankanSimulasi = async () => {
    setLoadingSimulasi(true);
    setNormalisasiResult(null);
    try {
      const res = await fetch("/api/v1/points/kkn/simulasi", { headers: authHeaders });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Gagal memuat simulasi");
      setSimulasiData(json.data);
      toast.success("Simulasi formula berhasil dimuat");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoadingSimulasi(false);
    }
  };

  const jalankanNormalisasi = async () => {
    setLoadingNormalisasi(true);
    setShowConfirmModal(false);
    try {
      const res = await fetch("/api/v1/points/kkn/normalisasi-bulk", {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Gagal normalisasi");
      setNormalisasiResult(json.data);
      toast.success(`Normalisasi selesai: ${json.data.berhasil} kelompok berhasil`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoadingNormalisasi(false);
    }
  };

  const filteredKelompok = (simulasiData?.kelompokList ?? []).filter((k) =>
    k.kelompokName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleExpand = (id: string) => {
    setExpandedKelompok((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Calculator size={22} className="text-violet-500" />
            Simulasi &amp; Normalisasi Poin Mahasiswa KKN
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Developer Tool — Notulensi Rapat 17 September 2026
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={jalankanSimulasi}
            disabled={loadingSimulasi}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-semibold transition"
          >
            {loadingSimulasi ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            Jalankan Simulasi
          </button>
          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={!simulasiData || loadingNormalisasi}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-slate-700 dark:disabled:text-slate-400 text-white rounded-lg text-sm font-semibold transition"
          >
            {loadingNormalisasi ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
            Normalisasi ke PointHistory
          </button>
        </div>
      </div>

      {/* Formula Info */}
      <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 rounded-xl p-4 text-sm">
        <div className="flex items-start gap-2">
          <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
          <div className="space-y-1 text-blue-800 dark:text-blue-200">
            <p className="font-bold">Formula Poin KKN (Notulensi 17 Sep 2026)</p>
            <div className="font-mono text-[11px] bg-blue-100 dark:bg-blue-900/60 rounded-lg p-2 space-y-0.5">
              <p>NilaiProkerStep  = avg(step: SELESAI=100, BERJALAN=60, BELUM=25)</p>
              <p>RataAnggota      = avg(assessmentScore anggota kelompok)</p>
              <p>KomponenA        = (NilaiProkerStep + RataAnggota) / 2</p>
              <p>KomponenB        = avg(KomponenA semua kelompok) [GLOBAL]</p>
              <p className="font-bold text-blue-700 dark:text-blue-300">PoinAkhir = (KomponenA x 0.6) + (KomponenB x 0.4)</p>
            </div>
            <p className="text-[11px] text-blue-600 dark:text-blue-400">
              Semua anggota dalam satu kelompok mendapat PoinAkhir yang sama. Normalisasi menulis ke PointHistory dengan kategori{" "}
              <code className="font-mono bg-blue-200 dark:bg-blue-800 px-1 rounded">POIN_KKN_FINAL</code>.
            </p>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertTriangle size={20} />
              <h3 className="font-bold text-base">Konfirmasi Normalisasi</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Tindakan ini akan <strong>menulis</strong> poin akhir KKN ke{" "}
              <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">PointHistory</code>{" "}
              untuk <strong>{simulasiData?.totalKelompok} kelompok</strong>. Data lama{" "}
              <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">POIN_KKN_FINAL</code> akan dihapus dan diganti.
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              Pastikan hasil simulasi sudah divalidasi sebelum normalisasi.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowConfirmModal(false)} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
                Batal
              </button>
              <button onClick={jalankanNormalisasi} className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition">
                Ya, Normalisasi Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hasil Normalisasi */}
      {normalisasiResult && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
          <h2 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <CheckCircle2 size={17} className="text-emerald-500" />
            Hasil Normalisasi
          </h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-xl p-3 text-center">
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{normalisasiResult.berhasil}</div>
              <div className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">Kelompok Berhasil</div>
            </div>
            <div className="bg-rose-50 dark:bg-rose-900/30 rounded-xl p-3 text-center">
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{normalisasiResult.gagal}</div>
              <div className="text-xs text-rose-700 dark:text-rose-300 font-medium">Kelompok Gagal</div>
            </div>
          </div>
          {normalisasiResult.gagal > 0 && (
            <div className="space-y-1">
              {normalisasiResult.detail.filter((d) => d.status === "error").map((d) => (
                <div key={d.kelompokId} className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 rounded-lg px-3 py-1.5">
                  x {d.kelompokName}: {d.error}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Kartu Statistik Global */}
      {simulasiData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Kelompok", value: simulasiData.totalKelompok.toString(), icon: <ClipboardList size={11} />, color: "slate" },
            { label: "Komponen B Global", value: simulasiData.rataRataPoinKelompok.toFixed(1), icon: <Calculator size={11} />, color: "violet" },
            { label: "KomponenB x 0.4", value: (simulasiData.rataRataPoinKelompok * 0.4).toFixed(1), icon: <Zap size={11} />, color: "blue" },
            { label: "Total Mahasiswa", value: simulasiData.kelompokList.reduce((s, k) => s + k.mahasiswaList.length, 0).toString(), icon: <Users size={11} />, color: "emerald" },
          ].map((item) => (
            <div key={item.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
              <div className={`text-2xl font-black text-${item.color}-600 dark:text-${item.color}-400`}>{item.value}</div>
              <div className={`text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 mt-0.5`}>{item.icon}{item.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabel Simulasi */}
      {simulasiData && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
            <h2 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Detail Per Kelompok</h2>
            <input
              type="text"
              placeholder="Cari kelompok..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 w-44 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredKelompok.map((k) => {
              const isExpanded = expandedKelompok.has(k.kelompokId);
              return (
                <div key={k.kelompokId}>
                  <button type="button" onClick={() => toggleExpand(k.kelompokId)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition text-left">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex-1 truncate">{k.kelompokName}</span>
                    <div className="hidden md:flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span>Proker: <strong className="text-slate-700 dark:text-slate-200">{k.nilaiProkerStep.toFixed(0)}</strong></span>
                      <span>Asesmen: <strong className="text-slate-700 dark:text-slate-200">{k.rataRataAssessmentAnggota.toFixed(1)}</strong></span>
                      <span>A: <strong className="text-slate-700 dark:text-slate-200">{k.komponenA.toFixed(1)}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ProkerStepBadge nilai={k.nilaiProkerStep} />
                      <div className="text-right min-w-[60px]">
                        <span className="text-base font-black text-violet-600 dark:text-violet-400">{k.poinAkhir.toFixed(1)}</span>
                        <span className="text-[9px] block text-slate-400">poin akhir</span>
                      </div>
                      {isExpanded ? <ChevronUp size={14} className="text-slate-400 shrink-0" /> : <ChevronDown size={14} className="text-slate-400 shrink-0" />}
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs pt-2">
                        {[
                          { label: "NilaiProkerStep", value: k.nilaiProkerStep.toFixed(1) },
                          { label: "Rata Asesmen", value: k.rataRataAssessmentAnggota.toFixed(1) },
                          { label: "Komponen A", value: k.komponenA.toFixed(2) },
                          { label: "A x 0.6", value: k.komponenABobot.toFixed(2) },
                          { label: "B x 0.4", value: k.komponenBBobot.toFixed(2) },
                        ].map((item) => (
                          <div key={item.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-center">
                            <div className="font-black text-slate-700 dark:text-slate-200">{item.value}</div>
                            <div className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">{item.label}</div>
                          </div>
                        ))}
                      </div>
                      {k.mahasiswaList.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Anggota ({k.mahasiswaList.length} mahasiswa)</p>
                          <div className="space-y-1">
                            {k.mahasiswaList.map((m) => (
                              <div key={m.studentId} className="flex items-center justify-between text-xs px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg">
                                <span className="text-slate-700 dark:text-slate-200 truncate flex-1">{m.nama}</span>
                                <span className="font-bold text-violet-600 dark:text-violet-400 ml-2 shrink-0">{m.poinAkhir.toFixed(1)} poin</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {filteredKelompok.length === 0 && !loadingSimulasi && (
              <div className="py-12 text-center text-slate-400 dark:text-slate-600 text-sm">
                {simulasiData ? "Tidak ada kelompok yang cocok." : 'Klik "Jalankan Simulasi" untuk memuat data.'}
              </div>
            )}
          </div>
        </div>
      )}

      {!simulasiData && !loadingSimulasi && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-600 space-y-3">
          <Calculator size={48} className="opacity-30" />
          <p className="text-sm">Klik tombol <strong>Jalankan Simulasi</strong> untuk preview formula poin.</p>
        </div>
      )}

      {loadingSimulasi && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-600 space-y-3">
          <Loader2 size={36} className="animate-spin opacity-40" />
          <p className="text-sm">Menghitung formula poin untuk semua kelompok...</p>
        </div>
      )}
    </div>
  );
};

export default PoinMahasiswaKknPage;
