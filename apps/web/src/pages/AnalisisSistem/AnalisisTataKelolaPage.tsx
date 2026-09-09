/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Analisis Sistem Tata Kelola Sampah: 4 Pilar Strategis
 * Standar Bahasa: EYD V, KBBI, Bebas Singkatan, Ampersand Diganti "dan".
 * SOP: Bebas dari kata 'tong', wajib 'Tempat Sampah'.
 */

import React, { useEffect, useState } from "react";
import {
  Users,
  CheckCircle2,
  Trash2,
  Clock,
  Recycle,
  DollarSign,
  Leaf,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Building2,
} from "lucide-react";
import api from "../../services/api";
import showToast from "../../utils/showToast";
import { FormulaTooltip } from "../../components/common/FormulaTooltip";
import { AiConsoleChat } from "../../components/common/AiConsoleChat";

interface WasteAnalysisData {
  pilar1: {
    totalWarga: number;
    activeResidentCount: number;
    activeResidentRatio: number;
    sortingComplianceIndex: number;
  };
  pilar2: {
    totalFasilitas: number;
    kritisitasTempatSampah: {
      total: number;
      normal: number;
      waspada: number;
      kritis: number;
    };
    avgPickupLatencyMinutes: number;
  };
  pilar3: {
    totalSampahMasukKg: number;
    totalSampahTerolahKg: number;
    organikKg?: number;
    anorganikKg?: number;
    wasteUtilizationRate: number;
    productionHistory: Array<{
      tanggal: string;
      materialMasukKg: number;
      outputKg: number;
    }>;
  };
  pilar4: {
    totalNilaiEkonomiRupiah: number;
    reduksiEmisiCo2Kg: number;
    organikKg: number;
    anorganikKg: number;
    indeksKomunitas: number;
  };
}

export const AnalisisTataKelolaPage: React.FC = () => {
  const [data, setData] = useState<WasteAnalysisData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/analisis-sistem/tata-kelola");
      if (res.data?.data) {
        setData(res.data.data);
      }
    } catch {
      showToast.error("Gagal memuat analitik tata kelola sampah");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* 1. Bar Tajuk Halaman (Standar Eksekutif EYD & KBBI) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#e5f7ed] dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 flex items-center justify-center shrink-0 border border-[#009966]/15 dark:border-emerald-700/30 shadow-2xs">
            <Recycle size={24} />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
              Analisis Sistem Tata Kelola Sampah
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Pemantauan sirkularitas empat pilar: partisipasi warga, infrastruktur tempat sampah cerdas, neraca pengolahan, serta dampak reduksi emisi karbon.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
          <button
            onClick={fetchData}
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
          <p className="text-xs font-bold text-slate-500">Mengkalkulasi metrik empat pilar tata kelola...</p>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* PILAR 1: Partisipasi Warga dan Kepatuhan Pemilahan */}
          <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#e5f7ed] dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 flex items-center justify-center text-xs font-black shadow-2xs">
                  1
                </span>
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-slate-100">Pilar Partisipasi Warga dan Kepatuhan Pemilahan</h2>
                  <p className="text-xs text-slate-500 font-medium">Aktivitas penyetoran mandiri dan indeks akurasi deteksi kecerdasan buatan</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Partisipasi Warga Aktif</span>
                    <FormulaTooltip
                      title="Rasio Partisipasi Warga"
                      formula="(Warga Aktif Setor Sampah 30 Hari / Total Warga Terdaftar) × 100%"
                      description="Tingkat keaktifan warga dalam program pilah sampah rumah tangga."
                    />
                  </div>
                  <Users className="text-[#009966]" size={18} />
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">
                  {data.pilar1.activeResidentRatio}%
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mt-3">
                  <div
                    className="bg-[#009966] h-full rounded-full transition-all duration-500"
                    style={{ width: `${data.pilar1.activeResidentRatio}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500 mt-2 block">
                  {data.pilar1.activeResidentCount} dari {data.pilar1.totalWarga} warga aktif dalam 30 hari
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Indeks Kepatuhan Pilah</span>
                    <FormulaTooltip
                      title="Indeks Kepatuhan Pemilahan"
                      formula="Indeks = (Setoran Valid Terklasifikasi / Total Verifikasi AI) × 100%"
                      description="Akurasi pemilahan sampah organik dan anorganik yang terverifikasi model kecerdasan buatan."
                      isoStandard="ISO 14001 (Sistem Manajemen Lingkungan)"
                    />
                  </div>
                  <CheckCircle2 className="text-[#009966]" size={18} />
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">
                  {data.pilar1.sortingComplianceIndex}%
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mt-3">
                  <div
                    className="bg-[#009966] h-full rounded-full transition-all duration-500"
                    style={{ width: `${data.pilar1.sortingComplianceIndex}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500 mt-2 block">Tingkat akurasi klasifikasi material sampah</span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Validasi Integritas</span>
                    <ShieldCheck className="text-blue-500" size={18} />
                  </div>
                  <div className="text-xl font-black text-slate-900 dark:text-slate-100 mt-2">
                    Tervalidasi Digital
                  </div>
                </div>
                <span className="text-xs text-slate-500 mt-2 block">Pencatatan setoran terlindungi rekam jejak audit dan kode QR</span>
              </div>
            </div>
          </section>

          {/* PILAR 2: Fasilitas dan Infrastruktur Tempat Sampah */}
          <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#e5f7ed] dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 flex items-center justify-center text-xs font-black shadow-2xs">
                  2
                </span>
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-slate-100">Pilar Fasilitas dan Infrastruktur Tempat Sampah</h2>
                  <p className="text-xs text-slate-500 font-medium">Pemantauan kondisi tempat sampah cerdas dan persebaran TPS3R serta Bank Sampah</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Fasilitas Aktif</span>
                  <Building2 className="text-[#009966]" size={18} />
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">
                  {data.pilar2.totalFasilitas}
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mt-3">
                  <div className="bg-[#009966] h-full rounded-full w-full" />
                </div>
                <span className="text-xs text-slate-500 mt-2 block">Unit TPS3R, Bank Sampah, dan Budidaya Maggot</span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Latensi Pengangkutan</span>
                    <FormulaTooltip
                      title="Latensi Pengangkutan Sampah"
                      formula="Avg(Waktu Angkut - Waktu Kritis) dalam Menit"
                      description="Kecepatan armada petugas merespons status kritis tempat sampah di wilayah."
                      isoStandard="ISO 9001 (Kinerja Layanan)"
                    />
                  </div>
                  <Clock className="text-amber-500" size={18} />
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2 flex items-baseline gap-1.5">
                  <span>{data.pilar2.avgPickupLatencyMinutes}</span>
                  <span className="text-sm font-bold text-slate-500 dark:text-slate-400">menit</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mt-3">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      data.pilar2.avgPickupLatencyMinutes <= 15
                        ? "bg-[#009966] w-full"
                        : data.pilar2.avgPickupLatencyMinutes <= 60
                        ? "bg-amber-500 w-2/3"
                        : "bg-rose-500 w-1/3"
                    }`}
                  />
                </div>
                <span className="text-xs text-slate-500 mt-2 block">Waktu respons evakuasi unit tempat sampah penuh</span>
              </div>

              {/* Status Tempat Sampah Visual Compact */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        Kritisitas Tempat Sampah
                      </span>
                      <FormulaTooltip
                        title="Status Kritis Sensor Tempat Sampah"
                        formula="Kritis: Kapasitas ≥ 80% | Waspada: 50%-79% | Normal: < 50%"
                        description="Klasifikasi berbasis telemetri sensor ultrasonik atau laporan petugas lapangan."
                      />
                    </div>
                    <Trash2 className="text-[#009966]" size={18} />
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2 flex items-baseline gap-1.5">
                    <span>{data.pilar2.kritisitasTempatSampah.total}</span>
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">unit terpasang</span>
                  </div>

                  {/* Segmented Micro Bar */}
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden flex mt-3">
                    <div
                      style={{
                        width: `${(data.pilar2.kritisitasTempatSampah.normal / (data.pilar2.kritisitasTempatSampah.total || 1)) * 100}%`,
                      }}
                      className="bg-[#009966] h-full"
                      title={`Normal: ${data.pilar2.kritisitasTempatSampah.normal}`}
                    />
                    <div
                      style={{
                        width: `${(data.pilar2.kritisitasTempatSampah.waspada / (data.pilar2.kritisitasTempatSampah.total || 1)) * 100}%`,
                      }}
                      className="bg-amber-500 h-full"
                      title={`Waspada: ${data.pilar2.kritisitasTempatSampah.waspada}`}
                    />
                    <div
                      style={{
                        width: `${(data.pilar2.kritisitasTempatSampah.kritis / (data.pilar2.kritisitasTempatSampah.total || 1)) * 100}%`,
                      }}
                      className="bg-rose-500 h-full"
                      title={`Kritis: ${data.pilar2.kritisitasTempatSampah.kritis}`}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-bold pt-2 mt-2 border-t border-slate-200/60 dark:border-slate-800">
                  <span className="text-[#009966]">{data.pilar2.kritisitasTempatSampah.normal} Normal</span>
                  <span className="text-amber-600">{data.pilar2.kritisitasTempatSampah.waspada} Waspada</span>
                  <span className="text-rose-600">{data.pilar2.kritisitasTempatSampah.kritis} Kritis</span>
                </div>
              </div>
            </div>
          </section>

          {/* PILAR 3: Neraca Pengolahan dan Pemanfaatan */}
          <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#e5f7ed] dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 flex items-center justify-center text-xs font-black shadow-2xs">
                  3
                </span>
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-slate-100">Pilar Neraca Pengolahan dan Pemanfaatan Sampah</h2>
                  <p className="text-xs text-slate-500 font-medium">Volume material sampah terkumpul dan efektivitas konversi non-TPA</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Sampah Terkumpul</span>
                    <FormulaTooltip
                      title="Total Sampah Terkumpul"
                      formula="SUM(setoran_sampah.berat_kg) + Log Penimbangan Tempat Sampah"
                      description="Volume agregat material sampah masuk dalam ekosistem Berseka."
                    />
                  </div>
                  <Recycle className="text-amber-500" size={18} />
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2 flex items-baseline gap-1.5">
                  <span>{data.pilar3.totalSampahMasukKg.toLocaleString("id-ID")}</span>
                  <span className="text-sm font-bold text-slate-500 dark:text-slate-400">kg</span>
                </div>
                <div className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                  <span className="text-[#009966] font-bold">Organik: {(data.pilar3.organikKg ?? data.pilar4.organikKg).toLocaleString("id-ID")} kg</span>
                  <span>•</span>
                  <span className="text-blue-500 font-bold">Anorganik: {(data.pilar3.anorganikKg ?? data.pilar4.anorganikKg).toLocaleString("id-ID")} kg</span>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">Dari setoran manual dan tempat sampah cerdas</span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Sampah Terolah Mandiri</span>
                    <FormulaTooltip
                      title="Sampah Terolah Mandiri"
                      formula="SUM(output_produksi.berat_kg) [Kompos + Maggot + RDF]"
                      description="Total produk sirkular turunan yang tidak dibuang ke Tempat Pemrosesan Akhir (TPA)."
                    />
                  </div>
                  <CheckCircle2 className="text-[#009966]" size={18} />
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2 flex items-baseline gap-1.5">
                  <span>{data.pilar3.totalSampahTerolahKg.toLocaleString("id-ID")}</span>
                  <span className="text-sm font-bold text-slate-500 dark:text-slate-400">kg</span>
                </div>
                <span className="text-xs text-slate-500 mt-1 block">Hasil olahan kompos, maggot, dan bahan bakar turunan sampah (RDF)</span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center">
                  <span className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Tingkat Konversi Sirkular</span>
                  <FormulaTooltip
                    title="Tingkat Konversi Sirkular"
                    formula="(Total Sampah Terolah / Total Sampah Masuk) × 100%"
                    description="Rasio efektivitas pengalihan sampah dari timbulan akhir (zero waste to landfill)."
                  />
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">
                  {data.pilar3.wasteUtilizationRate}%
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mt-3">
                  <div
                    className="bg-[#009966] h-full rounded-full transition-all duration-500"
                    style={{ width: `${data.pilar3.wasteUtilizationRate}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500 mt-2 block">Capaian pengalihan sampah dari TPA Sarimukti</span>
              </div>
            </div>
          </section>

          {/* PILAR 4: Dampak Ekonomi, Lingkungan, dan Sosial (Triple Bottom Line) */}
          <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#e5f7ed] dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 flex items-center justify-center text-xs font-black shadow-2xs">
                  4
                </span>
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-slate-100">Pilar Dampak Ekonomi, Lingkungan, dan Sosial</h2>
                  <p className="text-xs text-slate-500 font-medium">Kalkulasi nilai monetisasi bank sampah, reduksi metana gas rumah kaca, dan modal sosial</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pt-1">
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Nilai Ekonomi Sirkular</span>
                    <FormulaTooltip
                      title="Nilai Ekonomi Sirkular"
                      formula="SUM(saldo_tabungan_warga) + SUM(pendapatan_produk_daur_ulang)"
                      description="Monetisasi langsung yang dinikmati masyarakat dan unit usaha bank sampah."
                    />
                  </div>
                  <DollarSign className="text-[#009966]" size={18} />
                </div>
                <div className="text-2xl font-black text-[#009966] dark:text-emerald-400 mt-2">
                  Rp {data.pilar4.totalNilaiEkonomiRupiah.toLocaleString("id-ID")}
                </div>
                <span className="text-xs text-slate-500 mt-2 block">Saldo tabungan bank sampah warga dan hasil olahan daur ulang</span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Reduksi Emisi Karbon (CO₂e)</span>
                    <FormulaTooltip
                      title="Reduksi Emisi Metana CO₂e (Panduan IPCC)"
                      formula="Reduksi (kg CO₂e) = Sampah Organik (kg) × 0.6093 kg CO₂e/kg"
                      description="Estimasi gas rumah kaca terhindar dari pembusukan anaerobik di TPA berdasarkan faktor emisi KLHK dan IPCC."
                      isoStandard="ISO 14064 (Gas Rumah Kaca)"
                    />
                  </div>
                  <Leaf className="text-[#009966]" size={18} />
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2 flex items-baseline gap-1.5">
                  <span>{data.pilar4.reduksiEmisiCo2Kg.toLocaleString("id-ID")}</span>
                  <span className="text-sm font-bold text-slate-500 dark:text-slate-400">kg CO₂e</span>
                </div>
                <span className="text-xs text-slate-500 mt-2 block">
                  Emisi gas metana terhindar dari {data.pilar4.organikKg.toLocaleString("id-ID")} kg sampah organik terolah
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Indeks Resiliensi Komunitas</span>
                    <FormulaTooltip
                      title="Indeks Resiliensi Komunitas"
                      formula="Min(100, 50 + (Pengurus RW/RT Aktif × 2) + (Mahasiswa Kuliah Kerja Nyata × 0.5))"
                      description="Metrik kekuatan modal sosial dan jejaring kerja sama gotong royong pengelolaan sampah wilayah."
                    />
                  </div>
                  <Users className="text-blue-500" size={18} />
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">
                  {data.pilar4.indeksKomunitas} / 100
                </div>
                <span className="text-xs text-slate-500 mt-2 block">
                  Kolaborasi aktif pengurus Rukun Warga, Rukun Tetangga, relawan, dan mahasiswa Kuliah Kerja Nyata
                </span>
              </div>
            </div>
          </section>

          {/* Konsol Cerdas Analisis AI (Hugging Face) */}
          <AiConsoleChat contextType="tata-kelola" />
        </div>
      ) : null}
    </div>
  );
};

export default AnalisisTataKelolaPage;
