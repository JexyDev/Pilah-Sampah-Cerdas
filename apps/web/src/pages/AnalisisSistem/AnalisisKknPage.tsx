/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Analisis Sistem Kuliah Kerja Nyata: 5 Pilar Operasional
 * Standar Bahasa: EYD V, KBBI, Bebas Singkatan KKN (Kuliah Kerja Nyata), Ampersand Diganti "dan".
 */

import React, { useEffect, useState } from "react";
import {
  FileText,
  CheckCircle2,
  Clock,
  Users,
  AlertCircle,
  TrendingUp,
  MapPin,
  RefreshCw,
  Filter,
  Info,
} from "lucide-react";
import api from "../../services/api";
import showToast from "../../utils/showToast";
import { FormulaTooltip } from "../../components/common/FormulaTooltip";
import { AiConsoleChat } from "../../components/common/AiConsoleChat";

interface KknAnalysisData {
  pilar1: {
    totalLogbook: number;
    approvedLogbook: number;
    verificationRate: number;
    topKelompokLogbook: Array<{ kelompokId: string; namaKelompok: string; totalLogbook: number }>;
  };
  pilar2: {
    onTimeAttendanceRate: number;
    hadirCount: number;
    izinCount: number;
    sakitCount: number;
    geofenceComplianceRate: number;
    inZoneCount: number;
    outZoneCount: number;
  };
  pilar3: {
    totalProker: number;
    prokerCompletionRate: number;
    breakdown: {
      selesai: number;
      proses: number;
      belum: number;
    };
  };
  pilar4: {
    dplEvaluationRate: number;
    evaluatedStudents: number;
    totalStudents: number;
    gradeDistribution: Array<{ grade: string; count: number }>;
  };
  pilar5: {
    top5Kelompok: Array<{
      id: string;
      nama: string;
      kelurahan: string;
      latitude: number;
      longitude: number;
      totalMahasiswa: number;
      totalProker: number;
      prokerSelesai: number;
      skorKinerja: number;
    }>;
    sebaranPosko: Array<{
      id: string;
      nama: string;
      kelurahan: string;
      latitude: number;
      longitude: number;
      skorKinerja: number;
    }>;
  };
}

export const AnalisisKknPage: React.FC = () => {
  const [data, setData] = useState<KknAnalysisData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [kelompokList, setKelompokList] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedKelompokId, setSelectedKelompokId] = useState<string>("");

  const fetchKelompokOptions = async () => {
    try {
      const res = await api.get("/kelompok-kkn");
      if (res.data?.data) {
        setKelompokList(res.data.data);
      }
    } catch {
      // Endpoint fallback
    }
  };

  const fetchData = async (kelompokId?: string) => {
    try {
      setLoading(true);
      const url = kelompokId
        ? `/analisis-sistem/kkn?kelompokId=${kelompokId}`
        : "/analisis-sistem/kkn";
      const res = await api.get(url);
      if (res.data?.data) {
        setData(res.data.data);
      }
    } catch {
      showToast.error("Gagal memuat analitik sistem Kuliah Kerja Nyata");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKelompokOptions();
    fetchData();
  }, []);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedKelompokId(val);
    fetchData(val);
  };

  const getGradeBadgeStyle = (grade: string) => {
    switch (grade) {
      case "A":
        return {
          cardBg: "bg-[#e5f7ed] dark:bg-emerald-950/30 border-[#009966]/20 dark:border-emerald-800/60",
          text: "text-[#009966] dark:text-emerald-400",
          desc: "Nilai ≥ 85 (Sangat Memuaskan)",
        };
      case "B":
        return {
          cardBg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/60",
          text: "text-blue-600 dark:text-blue-400",
          desc: "Nilai 70 - 84 (Memuaskan)",
        };
      case "C":
        return {
          cardBg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60",
          text: "text-amber-600 dark:text-amber-400",
          desc: "Nilai 55 - 69 (Cukup)",
        };
      case "D":
      default:
        return {
          cardBg: "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60",
          text: "text-rose-600 dark:text-rose-400",
          desc: "Nilai < 55 (Kurang / Tidak Lulus)",
        };
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* 1. Bar Tajuk Halaman (Standar Eksekutif EYD & KBBI) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#e5f7ed] dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 flex items-center justify-center shrink-0 border border-[#009966]/15 dark:border-emerald-700/30 shadow-2xs">
            <Users size={24} />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
              Analisis Sistem Kuliah Kerja Nyata
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Pemantauan komprehensif lima pilar operasional: buku harian, presensi geofence, ketercapaian program kerja, evaluasi pembimbing lapangan, dan kinerja wilayah.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start md:self-center">
          {kelompokList.length > 0 && (
            <div className="relative min-w-[220px]">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <select
                value={selectedKelompokId}
                onChange={handleFilterChange}
                className="w-full pl-9 pr-8 py-2 text-xs font-bold rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-[#009966] outline-none cursor-pointer"
              >
                <option value="">Semua Kelompok Kuliah Kerja Nyata</option>
                {kelompokList.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => fetchData(selectedKelompokId)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#009966] hover:bg-[#008855] active:scale-95 text-white font-extrabold text-xs rounded-full shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Perbarui Data</span>
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="py-32 text-center">
          <div className="w-10 h-10 border-3 border-[#009966]/20 border-t-[#009966] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs font-bold text-slate-500">Mengkalkulasi metrik lima pilar...</p>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* PILAR 1: Buku Harian Kegiatan Mahasiswa */}
          <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#e5f7ed] dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 flex items-center justify-center text-xs font-black shadow-2xs">
                  1
                </span>
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-slate-100">Pilar Buku Harian dan Ritme Aktivitas</h2>
                  <p className="text-xs text-slate-500 font-medium">Intensitas pelaporan kegiatan harian mandiri dan rasio verifikasi dosen pembimbing lapangan</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Entri Buku Harian</span>
                    <FormulaTooltip
                      title="Total Buku Harian"
                      formula="COUNT(logbook_kkn.id)"
                      description="Akumulasi seluruh catatan aktivitas harian yang diunggah mahasiswa aktif."
                    />
                  </div>
                  <FileText className="text-[#009966]" size={18} />
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">
                  {data.pilar1.totalLogbook.toLocaleString("id-ID")}
                </div>
                <span className="text-xs text-slate-500 mt-1 block">Terkumpul dari mahasiswa aktif</span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Rasio Verifikasi Pembimbing</span>
                    <FormulaTooltip
                      title="Rasio Verifikasi Dosen Pembimbing Lapangan"
                      formula="(Buku Harian Disetujui / Total Buku Harian) × 100%"
                      description="Persentase buku harian kegiatan yang telah ditinjau dan divalidasi oleh Dosen Pembimbing Lapangan."
                      isoStandard="ISO 9001 (Penjaminan Mutu)"
                    />
                  </div>
                  <CheckCircle2 className="text-[#009966]" size={18} />
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">
                  {data.pilar1.verificationRate}%
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mt-3">
                  <div
                    className="bg-[#009966] h-full rounded-full transition-all duration-500"
                    style={{ width: `${data.pilar1.verificationRate}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500 mt-2 block">
                  {data.pilar1.approvedLogbook.toLocaleString("id-ID")} buku harian terverifikasi
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Kelompok Paling Produktif</span>
                  <TrendingUp className="text-amber-500" size={18} />
                </div>
                <div className="text-base font-black text-slate-900 dark:text-slate-100 mt-2 truncate">
                  {data.pilar1.topKelompokLogbook[0]?.namaKelompok || "Kelompok Belum Terdata"}
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold mt-2">
                  <span>{data.pilar1.topKelompokLogbook[0]?.totalLogbook || 0} entri kegiatan</span>
                </div>
              </div>
            </div>
          </section>

          {/* PILAR 2: Presensi dan Kepatuhan Radius Geofence */}
          <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#e5f7ed] dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 flex items-center justify-center text-xs font-black shadow-2xs">
                  2
                </span>
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-slate-100">Pilar Presensi dan Kepatuhan Geofence</h2>
                  <p className="text-xs text-slate-500 font-medium">Verifikasi kehadiran digital berdasarkan radius koordinat posko binaan</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Tingkat Hadir</span>
                    <FormulaTooltip
                      title="Tingkat Hadir"
                      formula="(Presensi Tervalidasi / Total Jadwal Kegiatan) × 100%"
                      description="Rasio kepatuhan absensi tepat waktu sesuai jadwal harian Kuliah Kerja Nyata."
                    />
                  </div>
                  <Clock className="text-[#009966]" size={18} />
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">
                  {data.pilar2.onTimeAttendanceRate}%
                </div>
                <span className="text-xs text-slate-500 mt-1 block">{data.pilar2.hadirCount.toLocaleString("id-ID")} presensi tervalidasi</span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Kepatuhan Geofence</span>
                    <FormulaTooltip
                      title="Kepatuhan Geofence (Haversine)"
                      formula="d = 2r × arcsin(√(sin²(Δlat/2) + cos(lat1)cos(lat2)sin²(Δlon/2))) ≤ R_posko"
                      description="Validasi presensi hanya sah jika jarak perangkat mahasiswa berada di dalam radius resmi posko."
                      isoStandard="ISO 19111 (Sistem Koordinat Spasial)"
                    />
                  </div>
                  <MapPin className="text-[#009966]" size={18} />
                </div>
                <div className="text-2xl font-black text-[#009966] dark:text-emerald-400 mt-2">
                  {data.pilar2.geofenceComplianceRate}%
                </div>
                <span className="text-xs text-slate-500 mt-1 block">{data.pilar2.inZoneCount.toLocaleString("id-ID")} tepat di dalam zona</span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Luar Radius Posko</span>
                  <AlertCircle className="text-rose-500" size={18} />
                </div>
                <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
                  {data.pilar2.outZoneCount}
                </div>
                <span className="text-xs text-slate-500 mt-1 block">Presensi ditolak sistem koordinat</span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Izin dan Sakit</span>
                  <Users className="text-blue-500" size={18} />
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">
                  {data.pilar2.izinCount + data.pilar2.sakitCount}
                </div>
                <span className="text-xs text-slate-500 mt-1 block">
                  {data.pilar2.izinCount} Izin • {data.pilar2.sakitCount} Sakit
                </span>
              </div>
            </div>
          </section>

          {/* PILAR 3: Realisasi dan Kemajuan Program Kerja */}
          <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#e5f7ed] dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 flex items-center justify-center text-xs font-black shadow-2xs">
                  3
                </span>
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-slate-100">Pilar Realisasi dan Kemajuan Program Kerja</h2>
                  <p className="text-xs text-slate-500 font-medium">Keberlanjutan eksekusi luaran program kerja kelompok di wilayah binaan</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pt-1">
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center">
                    <span className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Tingkat Ketuntasan</span>
                    <FormulaTooltip
                      title="Tingkat Ketuntasan Program Kerja"
                      formula="(Program Kerja Selesai / Total Program Kerja Terencana) × 100%"
                      description="Indeks penyelesaian target program kerja kelompok Kuliah Kerja Nyata di wilayah binaan."
                    />
                  </div>
                  <div className="text-3xl font-black text-slate-900 dark:text-slate-100 mt-2">
                    {data.pilar3.prokerCompletionRate}%
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden mt-3">
                    <div
                      className="bg-[#009966] h-full rounded-full transition-all duration-500"
                      style={{ width: `${data.pilar3.prokerCompletionRate}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    {data.pilar3.breakdown.selesai} selesai dari total {data.pilar3.totalProker} program kerja terencana
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-800 text-center">
                  <div>
                    <span className="text-[10px] font-extrabold text-[#009966] uppercase">Selesai</span>
                    <div className="text-lg font-black text-slate-900 dark:text-slate-100">{data.pilar3.breakdown.selesai}</div>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-amber-600 uppercase">Berjalan</span>
                    <div className="text-lg font-black text-slate-900 dark:text-slate-100">{data.pilar3.breakdown.proses}</div>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase">Belum</span>
                    <div className="text-lg font-black text-slate-900 dark:text-slate-100">{data.pilar3.breakdown.belum}</div>
                  </div>
                </div>
              </div>

              {/* Visualisasi Horizontal Bar Bersih */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 shadow-2xs lg:col-span-2 flex flex-col justify-between">
                <span className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-3">
                  Distribusi Proporsi Status Program Kerja
                </span>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="text-[#009966] dark:text-emerald-400">Selesai ({data.pilar3.breakdown.selesai})</span>
                      <span className="text-slate-400">
                        {data.pilar3.totalProker > 0 ? Math.round((data.pilar3.breakdown.selesai / data.pilar3.totalProker) * 100) : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#009966] h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${data.pilar3.totalProker > 0 ? (data.pilar3.breakdown.selesai / data.pilar3.totalProker) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="text-amber-600 dark:text-amber-400">Sedang Berjalan ({data.pilar3.breakdown.proses})</span>
                      <span className="text-slate-400">
                        {data.pilar3.totalProker > 0 ? Math.round((data.pilar3.breakdown.proses / data.pilar3.totalProker) * 100) : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${data.pilar3.totalProker > 0 ? (data.pilar3.breakdown.proses / data.pilar3.totalProker) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="text-slate-600 dark:text-slate-300">Belum Mulai atau Usulan ({data.pilar3.breakdown.belum})</span>
                      <span className="text-slate-400">
                        {data.pilar3.totalProker > 0 ? Math.round((data.pilar3.breakdown.belum / data.pilar3.totalProker) * 100) : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-slate-400 dark:bg-slate-500 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${data.pilar3.totalProker > 0 ? (data.pilar3.breakdown.belum / data.pilar3.totalProker) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center gap-1.5">
                  <Info size={14} className="text-slate-400" />
                  <span>Program kerja dievaluasi setiap pekan berdasarkan buku harian dan persetujuan dosen pembimbing lapangan.</span>
                </div>
              </div>
            </div>
          </section>

          {/* PILAR 4: Evaluasi Pembimbing Lapangan */}
          <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#e5f7ed] dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 flex items-center justify-center text-xs font-black shadow-2xs">
                  4
                </span>
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-slate-100">Pilar Evaluasi Kinerja dan Penilaian Pembimbing</h2>
                  <p className="text-xs text-slate-500 font-medium">Status kelulusan evaluasi akademik oleh Dosen Pembimbing Lapangan</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pt-1">
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center">
                    <span className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Capaian Evaluasi Pembimbing</span>
                    <FormulaTooltip
                      title="Capaian Evaluasi Pembimbing Lapangan"
                      formula="(Mahasiswa Dinilai Status Final / Total Mahasiswa) × 100%"
                      description="Progres penilaian akademik akhir mahasiswa oleh Dosen Pembimbing Lapangan."
                    />
                  </div>
                  <div className="text-3xl font-black text-slate-900 dark:text-slate-100 mt-2">
                    {data.pilar4.dplEvaluationRate}%
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mt-3">
                    <div
                      className="bg-[#009966] h-full rounded-full transition-all duration-500"
                      style={{ width: `${data.pilar4.dplEvaluationRate}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    {data.pilar4.evaluatedStudents} dari {data.pilar4.totalStudents} mahasiswa tuntas dievaluasi
                  </p>
                </div>

                {data.pilar4.evaluatedStudents === 0 && (
                  <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 flex items-center gap-2 text-xs font-medium">
                    <Info size={16} className="shrink-0 text-[#009966]" />
                    <span>Evaluasi dosen pembimbing lapangan masih dalam periode penilaian aktif.</span>
                  </div>
                )}
              </div>

              {/* Grid Grade dengan Tipografi Warna Semantik */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 shadow-2xs lg:col-span-2">
                <span className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-3">
                  Sebaran Nilai Akhir (Standar Mutu Akademik)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {data.pilar4.gradeDistribution.map((g) => {
                    const style = getGradeBadgeStyle(g.grade);
                    return (
                      <div
                        key={g.grade}
                        className={`p-4 rounded-2xl border text-center shadow-2xs transition-all ${style.cardBg}`}
                      >
                        <span className={`text-xs font-black uppercase tracking-wider ${style.text}`}>
                          Tingkat {g.grade}
                        </span>
                        <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{g.count}</div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">
                          {style.desc}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* PILAR 5: Kinerja Wilayah dan Posko Binaan Unggulan */}
          <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#e5f7ed] dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 flex items-center justify-center text-xs font-black shadow-2xs">
                  5
                </span>
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-slate-100">Pilar Kinerja Wilayah dan Posko Binaan Unggulan</h2>
                  <p className="text-xs text-slate-500 font-medium">Peringkat lima kelompok dengan performa buku harian, kehadiran, dan realisasi program kerja terbaik</p>
                </div>
              </div>
              <FormulaTooltip
                title="Skor Kinerja Posko Kuliah Kerja Nyata"
                formula="Skor = (Program Kerja Selesai / Total Program Kerja) × 40 + (Buku Harian / 300) × 30 + (Mahasiswa × 2)"
                description="Indeks agregasi performa kelompok binaan dengan bobot capaian terukur."
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <th className="pb-3.5 pl-2">Peringkat</th>
                    <th className="pb-3.5">Nama Kelompok</th>
                    <th className="pb-3.5">Kelurahan</th>
                    <th className="pb-3.5 text-center">Anggota</th>
                    <th className="pb-3.5 text-center">Program Kerja Tuntas</th>
                    <th className="pb-3.5 text-right pr-2">Skor Kinerja</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.pilar5.top5Kelompok.map((k, idx) => (
                    <tr key={k.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 pl-2">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-[#e5f7ed] text-[#009966] dark:bg-emerald-950 dark:text-emerald-300 text-xs font-black shadow-2xs">
                          #{idx + 1}
                        </span>
                      </td>
                      <td className="py-3.5 font-bold text-slate-900 dark:text-slate-100">{k.nama}</td>
                      <td className="py-3.5 text-slate-500 dark:text-slate-400">{k.kelurahan}</td>
                      <td className="py-3.5 text-center text-slate-600 dark:text-slate-300">{k.totalMahasiswa} Mahasiswa</td>
                      <td className="py-3.5 text-center text-slate-600 dark:text-slate-300">
                        {k.prokerSelesai} / {k.totalProker}
                      </td>
                      <td className="py-3.5 text-right pr-2 font-black text-[#009966] dark:text-emerald-400">
                        {k.skorKinerja} Poin
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Konsol Cerdas Analisis AI (Hugging Face) */}
          <AiConsoleChat contextType="kkn" kelompokId={selectedKelompokId || undefined} />
        </div>
      ) : null}
    </div>
  );
};

export default AnalisisKknPage;
