import { X, Star, Banknote, Recycle, AlertCircle, Eye, LineChart, BarChart, Leaf, TrendingUp, TrendingDown, Wallet, Zap, MapPin, AlertTriangle, Truck, Pencil, Trash2, Calendar, ChevronLeft, ChevronRight, GraduationCap, Search, CheckCircle2, Sparkles, RotateCcw, Award, RefreshCcw, RefreshCw, Settings, Save, Loader2, Building2, History, Home, Bell, Megaphone, Archive, Send, Users, ShoppingBag } from "lucide-react";

/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Main Multi-Role Executive Command Center
 * Design Theme: Professional light theme, consistent with Sidebar/Header/LeaderboardWidget
 * - 100% Real-Time Backend Data Integration
 * - Strict Standard Rukun Warga (RW) Terminology
 */

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { RwDashboard } from "../RwPortal/RwDashboard";
import api from "../../services/api";
import showToast from "../../utils/showToast";
import { useAuthStore } from "../../store/useAuthStore";
import { getProfilePhotoUrl, handleAvatarError } from "../../utils/photoUtils";
import { IconRenderer } from "../../components/common/IconRenderer";
import KknDashboard from "../KknDashboard/KknDashboard";
import ResiduDashboard from "../ResiduDashboard/ResiduDashboard";
import DplDashboardPage from "../dpl/DplDashboardPage";
import TaskforceDashboardPage from "../taskforce/TaskforceDashboardPage";
import DashboardEksekutifKkn from "./DashboardEksekutifKkn";
const GisEksekutifPage = React.lazy(() => import("../GisEksekutif/GisEksekutifPage"));
import TempatSampahAktifPage from "../SuperUser/TempatSampahAktifPage";
import { getPortalLoadingText } from "../../utils/portalLoading";
import LeaderboardWidget from "../../components/LeaderboardWidget";
import { CustomSelect, type SelectOption } from "../../components/common/CustomSelect";
import { ConfirmModal } from "../../components/common/ConfirmModal";
import { canAccessSidebarRoute } from "../../utils/sidebarAccess";
import { WasteTrendChart } from "../../components/dashboard/WasteTrendChart";
import { ComplianceWidget } from "../../components/dashboard/ComplianceWidget";
import type { ComplianceMetricsResult } from "../../services/complianceService";
import { WasteImpactSummaryTable } from "../../components/dashboard/WasteImpactSummaryTable";
import { WasteImpactTrendChart } from "../../components/dashboard/WasteImpactTrendChart";
import { BaselineSection } from "../../components/dashboard/BaselineSection";
import type { WasteImpactItem, WasteSourceType } from "../../utils/wasteCalculations";
import { isStagingEnv } from "../../utils/envUtils";

export interface KelurahanBaselineData {
  id: string;
  kelurahan: string;
  hasBaseline?: boolean; // true bila kelurahan memiliki data survei baseline di database
  baselineRate?: number | null; // Persentase pemilahan survei baseline pra-intervensi
  baselineKg?: number | null; // Berat sampah terpilah survei baseline (Organik + Anorganik) (kg/hari)
  baselineCompliance?: number | null; // Persentase kepatuhan pemilahan baseline (%)
  actualCompliance?: number | null; // Persentase kepatuhan pemilahan aktual (%)
  endlineRate: number; // Persentase kepatuhan pemilahan real-time
  totalKg?: number; // Total akumulasi berat sampah terdata aktual (kg)
  wargaKg?: number; // Berat pemilahan warga via aplikasi (WARGA_APP)
  petugasKg?: number; // Berat penimbangan manual petugas (PETUGAS_LAPANGAN)
  sourceType?: WasteSourceType;
  status: "Terverifikasi Real" | "Belum Terverifikasi";
  hasEndline?: boolean; // true bila berasal dari survei endline resmi
  setoranDinilai?: number; // jumlah pemilahan yang dapat dinilai (bobot agregasi)
  setoranPatuh?: number; // jumlah pemilahan yang sesuai kategori tempat sampah
  isFallbackBaselineRate?: boolean;
  isFallbackBaselineKg?: boolean;
  isFallback?: boolean;
}

/**
 * Data Baseline Survei Resmi KKN Juli 2026 (Kecamatan Coblong).
 * Memuat persentase kepatuhan pemilahan dan timbulan berat sampah awal (kg/hari) per kelurahan.
 */
export const SURVEY_BASELINE_RATES: Record<string, number> = {
  cipaganti: 13.67,
  dago: 10.0,
  lebakgede: 21.6,
  lebaksiliwangi: 15.0,
  sadangserang: 24.8,
  sekeloa: 17.8,
};

export const SURVEY_BASELINE_KG: Record<string, number> = {
  cipaganti: 96.0,
  dago: 122.0,
  lebakgede: 100.0,
  lebaksiliwangi: 96.5,
  sadangserang: 835.0,
  sekeloa: 421.0,
};

export const KELURAHAN_BASELINE_DATA: KelurahanBaselineData[] = [
  { id: "kel-cipaganti", kelurahan: "Cipaganti", baselineRate: 13.67, baselineKg: 96.0, endlineRate: 0, totalKg: 0, status: "Terverifikasi Real" },
  { id: "kel-dago", kelurahan: "Dago", baselineRate: 10.0, baselineKg: 122.0, endlineRate: 0, totalKg: 0, status: "Terverifikasi Real" },
  { id: "kel-lebakgede", kelurahan: "Lebak Gede", baselineRate: 21.6, baselineKg: 100.0, endlineRate: 0, totalKg: 0, status: "Terverifikasi Real" },
  { id: "kel-lebaksiliwangi", kelurahan: "Lebak Siliwangi", baselineRate: 15.0, baselineKg: 96.5, endlineRate: 0, totalKg: 0, status: "Terverifikasi Real" },
  { id: "kel-sadangserang", kelurahan: "Sadang Serang", baselineRate: 24.8, baselineKg: 835.0, endlineRate: 0, totalKg: 0, status: "Terverifikasi Real" },
  { id: "kel-sekeloa", kelurahan: "Sekeloa", baselineRate: 17.8, baselineKg: 421.0, endlineRate: 0, totalKg: 0, status: "Terverifikasi Real" },
];

const DEFAULT_WILAYAH_OPTIONS: SelectOption[] = [
  { value: "Semua Wilayah", label: "Seluruh Wilayah", sublabel: "Cakupan Seluruh Wilayah" },
  { value: "Kel. Dago", label: "Kel. Dago", sublabel: "Kelurahan Dago" },
  { value: "Kel. Sadang Serang", label: "Kel. Sadang Serang", sublabel: "Kelurahan Sadang Serang" },
  { value: "Kel. Sekeloa", label: "Kel. Sekeloa", sublabel: "Kelurahan Sekeloa" },
  { value: "Kel. Lebak Gede", label: "Kel. Lebak Gede", sublabel: "Kelurahan Lebak Gede" },
  { value: "Kel. Lebak Siliwangi", label: "Kel. Lebak Siliwangi", sublabel: "Kelurahan Lebak Siliwangi" },
  { value: "Kel. Cipaganti", label: "Kel. Cipaganti", sublabel: "Kelurahan Cipaganti" },
];

const PERIODE_OPTIONS: SelectOption[] = [
  { value: "semua", label: "Semua Waktu", sublabel: "Akumulasi Keseluruhan" },
  { value: "harian", label: "Hari Ini", sublabel: "24 Jam Terakhir" },
  { value: "mingguan", label: "Minggu Ini", sublabel: "7 Hari Terakhir" },
  { value: "bulanan", label: "Bulan Ini", sublabel: "30 Hari Terakhir" },
  { value: "tahunan", label: "Tahun Ini", sublabel: "Tahun Berjalan" },
  { value: "custom", label: "Rentang Tanggal", sublabel: "Pilih Tanggal Mulai s/d Akhir" },
];

// ========== Compliance Modal Component ==========
interface ComplianceModalProps {
  locations: any[];
  onClose: () => void;
  organikRate?: number;
  anorganikRate?: number;
}

const ComplianceModal: React.FC<ComplianceModalProps> = ({
  locations,
  onClose,
  organikRate,
  anorganikRate,
}) => {
  const [search, setSearch] = useState("");
  const [kelurahanFilter, setKelurahanFilter] = useState("SEMUA");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("HIGHEST");

  const uniqueKelurahan = Array.from(
    new Set(locations.map((loc) => loc.kelurahan || "Lainnya").filter(Boolean))
  ).sort();

  const totalRW = locations.length;
  const avgPatuh =
    totalRW > 0
      ? (locations.reduce((acc, curr) => acc + Number(curr.partisipasi ?? curr.patuh ?? 0), 0) / totalRW).toFixed(2)
      : "0.00";
  const highPatuhCount = locations.filter(
    (loc) => (loc.titikCount || 0) > 0 && Number(loc.partisipasi ?? loc.patuh ?? 0) >= 85
  ).length;
  const medPatuhCount = locations.filter(
    (loc) =>
      (loc.titikCount || 0) > 0 &&
      Number(loc.partisipasi ?? loc.patuh ?? 0) >= 60 &&
      Number(loc.partisipasi ?? loc.patuh ?? 0) < 85
  ).length;
  const lowPatuhCount = locations.filter(
    (loc) => (loc.titikCount || 0) > 0 && Number(loc.partisipasi ?? loc.patuh ?? 0) < 60
  ).length;
  const noUnitCount = locations.filter((loc) => (loc.titikCount || 0) === 0).length;

  const filteredLocations = locations
    .filter((loc) => {
      const query = search.toLowerCase();
      const matchSearch =
        !search ||
        (loc.rw || "").toLowerCase().includes(query) ||
        (loc.kelurahan || "").toLowerCase().includes(query);

      const matchKel =
        kelurahanFilter === "SEMUA" ||
        (loc.kelurahan || "").toLowerCase() === kelurahanFilter.toLowerCase();

      const hasUnit = (loc.titikCount || 0) > 0;
      const patuh = Number(loc.partisipasi ?? loc.patuh ?? 0);
      let matchStatus = true;
      if (statusFilter === "NO_UNIT") matchStatus = !hasUnit;
      else if (statusFilter === "HIGH") matchStatus = hasUnit && patuh >= 85;
      else if (statusFilter === "MED") matchStatus = hasUnit && patuh >= 60 && patuh < 85;
      else if (statusFilter === "LOW") matchStatus = hasUnit && patuh < 60;

      return matchSearch && matchKel && matchStatus;
    })
    .sort((a, b) => {
      const hasUnitA = (a.titikCount || 0) > 0;
      const hasUnitB = (b.titikCount || 0) > 0;
      const patuhA = Number(a.partisipasi ?? a.patuh ?? 0);
      const patuhB = Number(b.partisipasi ?? b.patuh ?? 0);

      if (sortBy === "HIGHEST") {
        if (hasUnitA !== hasUnitB) return hasUnitA ? -1 : 1;
        return patuhB - patuhA;
      }
      if (sortBy === "LOWEST") {
        if (hasUnitA !== hasUnitB) return hasUnitA ? -1 : 1;
        return patuhA - patuhB;
      }
      if (sortBy === "RW_ASC") return (a.rw || "").localeCompare(b.rw || "");
      if (sortBy === "KELURAHAN") return (a.kelurahan || "").localeCompare(b.kelurahan || "");
      return 0;
    });

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh] text-slate-800 dark:text-slate-100">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
              <LineChart size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Indeks Kepatuhan Pemilahan
                </h3>
                <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                  Wilayah Operasional
                </span>
                <div className="relative group inline-block">
                  <span
                    className="w-4 h-4 rounded-full bg-slate-100 hover:bg-emerald-100 dark:bg-slate-800 text-slate-500 hover:text-emerald-600 dark:text-slate-400 inline-flex items-center justify-center cursor-pointer text-[10px] font-bold"
                    title="Kepatuhan adalah ketepatan pemilahan jenis sampah organik dan anorganik sesuai kategorinya. Ketidakpatuhan terjadi jika sampah tidak dipilah sesuai dengan kategorinya."
                  >
                    i
                  </span>
                  <div className="absolute left-0 top-6 z-50 hidden group-hover:block w-72 p-3 bg-slate-900 text-white text-[11px] rounded-xl shadow-xl border border-slate-700 leading-relaxed pointer-events-none">
                    Kepatuhan adalah ketepatan pemilahan jenis sampah organik dan anorganik sesuai kategorinya. Ketidakpatuhan terjadi jika sampah tidak dipilah sesuai dengan kategorinya.
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
                Persentase keaktifan rumah tangga dan akurasi pemilahan sampah terdata per Rukun Warga (RW)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Tutup dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Banner Edukasi & Sub-Analisis */}
        <div className="px-5 py-3 bg-emerald-50/50 dark:bg-emerald-950/20 border-b border-emerald-200/50 dark:border-emerald-800/30 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
            <span className="font-extrabold text-emerald-700 dark:text-emerald-400">Definisi:</span>
            <span>Akurasi pemilahan sampah: Sampah Organik ke Wadah Organik, Anorganik ke Wadah Anorganik.</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-bold">
            <span className="text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-850 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
              Akurasi Pemilahan Organik: {organikRate != null ? `${Number(organikRate).toFixed(1)}% Sesuai` : "Memuat..."}
            </span>
            <span className="text-amber-700 dark:text-amber-300 bg-white dark:bg-slate-850 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800">
              Akurasi Pemilahan Anorganik: {anorganikRate != null ? `${Number(anorganikRate).toFixed(1)}% Sesuai` : "Memuat..."}
            </span>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rerata Partisipasi</span>
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5 block">{avgPatuh}%</span>
          </div>
          <div className="bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Tinggi (≥85%)</span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">{highPatuhCount} RW</span>
          </div>
          <div className="bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80">
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Sedang (60-84%)</span>
            <span className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-0.5 block">{medPatuhCount} RW</span>
          </div>
          <div className="bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80">
            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">Perlu Perhatian (&lt;60%)</span>
            <span className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-0.5 block">{lowPatuhCount} RW</span>
            {noUnitCount > 0 && (
              <span className="text-[10px] text-slate-400 block mt-0.5">{noUnitCount} RW belum ada unit</span>
            )}
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama Rukun Warga (RW) atau Kelurahan..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 pl-10 pr-8 h-10 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Dropdown Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={kelurahanFilter}
                onChange={(e) => setKelurahanFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-200 px-3 h-10 rounded-xl outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="SEMUA">Semua Kelurahan</option>
                {uniqueKelurahan.map((kel) => (
                  <option key={kel} value={kel}>{kel}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-200 px-3 h-10 rounded-xl outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="ALL">Semua Partisipasi</option>
                <option value="HIGH">Tinggi (≥85%)</option>
                <option value="MED">Sedang (60-84%)</option>
                <option value="LOW">Perlu Perhatian (&lt;60%)</option>
                <option value="NO_UNIT">Belum Ada Unit</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-200 px-3 h-10 rounded-xl outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="HIGHEST">Partisipasi Tertinggi</option>
                <option value="LOWEST">Partisipasi Terendah</option>
                <option value="RW_ASC">Urutkan RW</option>
                <option value="KELURAHAN">Urutkan Kelurahan</option>
              </select>
            </div>
          </div>
        </div>

        {/* Modal List Body */}
        <div className="p-6 space-y-3 overflow-y-auto flex-1 bg-slate-50 dark:bg-slate-950">
          {filteredLocations.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-300 dark:border-slate-700">
                <Search size={28} />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-700 dark:text-slate-200">Data RW Tidak Ditemukan</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                  Tidak ada data wilayah yang sesuai dengan filter atau kata kunci pencarian Anda.
                </p>
              </div>
              <button
                onClick={() => { setSearch(""); setKelurahanFilter("SEMUA"); setStatusFilter("ALL"); }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 mt-2"
              >
                <RotateCcw size={14} /> Reset Filter
              </button>
            </div>
          ) : (
            filteredLocations.map((loc) => {
              const hasUnit = (loc.titikCount || 0) > 0;
              const patuh = Number(loc.partisipasi ?? loc.patuh ?? 0);
              const isHigh = patuh >= 85;
              const isMed = patuh >= 60 && patuh < 85;

              return (
                <div
                  key={loc.id || `${loc.rw}-${loc.kelurahan}`}
                  className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/40 transition-all space-y-3 group"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-sm text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                          {loc.rw}
                        </h4>
                        <span className="text-[10px] font-extrabold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-200 dark:border-cyan-700/40">
                          {loc.kelurahan}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-slate-400 font-medium mt-1 flex items-center gap-2">
                        <span>{loc.titikCount || 0} Titik Pemilahan</span>
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      {!hasUnit ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          Belum Ada Unit
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                            isHigh
                              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                              : isMed
                              ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                              : "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-500/20"
                          }`}
                        >
                          {isHigh ? (
                            <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                          ) : isMed ? (
                            <Sparkles size={13} className="text-amber-600 dark:text-amber-400" />
                          ) : (
                            <AlertTriangle size={13} className="text-rose-600 dark:text-rose-400" />
                          )}
                          {patuh}% Partisipasi
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          !hasUnit
                            ? "bg-slate-300 dark:bg-slate-700"
                            : isHigh
                            ? "bg-emerald-500"
                            : isMed
                            ? "bg-amber-500"
                            : "bg-rose-500"
                        }`}
                        style={{ width: `${!hasUnit ? 0 : Math.max(patuh, 4)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <span>Menampilkan <strong className="text-slate-900 dark:text-slate-100">{filteredLocations.length}</strong> dari <strong className="text-slate-900 dark:text-slate-100">{locations.length}</strong> Rukun Warga (RW)</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

// ========== Warga Dashboard Component ==========
const WargaDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Summary State
  const [poin, setPoin] = useState(0);
  const [saldo, setSaldo] = useState(0);
  const [organik, setOrganik] = useState(0);
  const [anorganik, setAnorganik] = useState(0);
  const [quotaRemaining, setQuotaRemaining] = useState(50);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);

  // Detail Lists
  const [myBins, setMyBins] = useState<any[]>([]);
  const [isLoadingBins, setIsLoadingBins] = useState(true);

  const [pointHistory, setPointHistory] = useState<any[]>([]);
  const [isLoadingPoints, setIsLoadingPoints] = useState(false);

  const [wasteLogs, setWasteLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  // Modals visibility
  const [showPoinModal, setShowPoinModal] = useState(false);
  const [showSaldoModal, setShowSaldoModal] = useState(false);
  const [showSetoranModal, setShowSetoranModal] = useState(false);

  // Conversion Form State
  const [tukarPoinAmount, setTukarPoinAmount] = useState("500");
  const [ewalletType, setEwalletType] = useState("DANA");
  const [ewalletPhone, setEwalletPhone] = useState("");
  const [isConverting, setIsConverting] = useState(false);

  // Waste logs filter state
  const [filterWasteType, setFilterWasteType] = useState("ALL");

  const [showEditCapModal, setShowEditCapModal] = useState(false);
  const [editCapBinId, setEditCapBinId] = useState("");
  const [editCapMode, setEditCapMode] = useState("DEFAULT");
  const [editCapValue, setEditCapValue] = useState("25");
  const [editCapPhoto, setEditCapPhoto] = useState<File | null>(null);
  const [isUpdatingCap, setIsUpdatingCap] = useState(false);

  const handleUpdateCapacity = async (e: React.FormEvent) => {
    e.preventDefault();

    let capacityValue = 25;
    let evidencePhotoUrl = "";

    if (editCapMode === "MANUAL") {
      if (!editCapPhoto) {
        showToast.error("Wajib mengunggah foto bukti jika mengubah kapasitas manual!");
        return;
      }
      capacityValue = Number(editCapValue);
    }

    setIsUpdatingCap(true);
    try {
      if (editCapMode === "MANUAL" && editCapPhoto) {
        const formData = new FormData();
        formData.append("image", editCapPhoto);
        const uploadRes = await api.post("/waste/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        evidencePhotoUrl = uploadRes.data?.data?.imageUrl || "";
      }

      await api.put(`/bins/${editCapBinId}/capacity`, {
        maxCapacityLiter: capacityValue,
        evidencePhotoUrl,
      });

      showToast.success("Pengajuan perubahan kapasitas berhasil dikirim! Menunggu validasi.");
      setShowEditCapModal(false);
      setEditCapPhoto(null);
      fetchMyBins();
    } catch (err: any) {
      showToast.error(err.response?.data?.message || "Gagal mengubah kapasitas tempat sampah");
    } finally {
      setIsUpdatingCap(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    fetchMyBins();
    fetchNotifications();
    fetchWasteLogs();
    fetchPoints();
  }, []);

  const fetchSummary = async () => {
    try {
      setIsLoadingSummary(true);
      const res = await api.get("/dashboard/summary");
      if (res.data?.success && res.data.data) {
        const d = res.data.data;
        setPoin(d.poin || 0);
        setSaldo(d.saldo || 0);
        setOrganik(d.organik || 0);
        setAnorganik(d.anorganik || 0);
        setQuotaRemaining(d.quotaRemaining !== undefined ? d.quotaRemaining : 50);
      }
    } catch (err) {
      console.error("Gagal memuat summary dashboard", err);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const fetchMyBins = async () => {
    try {
      setIsLoadingBins(true);
      const res = await api.get("/bins/my-bins");
      if (res.data?.success) {
        setMyBins(res.data.data);
      }
    } catch (err) {
      console.error("Gagal memuat kapasitas tempat sampah", err);
    } finally {
      setIsLoadingBins(false);
    }
  };

  const fetchPoints = async () => {
    try {
      setIsLoadingPoints(true);
      const res = await api.get("/points/me");
      if (res.data?.success) {
        setPointHistory(res.data.data.history || []);
      }
    } catch (err) {
      console.error("Gagal memuat riwayat poin", err);
    } finally {
      setIsLoadingPoints(false);
    }
  };

  const fetchWasteLogs = async () => {
    try {
      setIsLoadingLogs(true);
      const res = await api.get("/transactions/my-deposits");
      if (res.data?.success) {
        setWasteLogs(res.data.data || []);
      }
    } catch (err) {
      console.error("Gagal memuat riwayat setoran", err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      setIsLoadingNotifications(true);
      const res = await api.get("/notifications");
      if (res.data?.status === "success") {
        setNotifications(res.data.data || []);
      }
    } catch (err) {
      console.error("Gagal memuat notifikasi", err);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueBinId, setIssueBinId] = useState("");
  const [issueType, setIssueType] = useState<"EMPTY_REQUEST" | "BROKEN_REPORT">("EMPTY_REQUEST");
  const [issueNotes, setIssueNotes] = useState("");
  const [issuePhoto, setIssuePhoto] = useState<File | null>(null);
  const [issuePhotoPreview, setIssuePhotoPreview] = useState<string | null>(null);
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);

  const handleOpenIssueModal = (binId: string, type: "EMPTY_REQUEST" | "BROKEN_REPORT") => {
    setIssueBinId(binId);
    setIssueType(type);
    setIssueNotes(type === "EMPTY_REQUEST" ? "Minta pengosongan tempat sampah" : "Tempat Sampah Rusak/QR Sobek");
    setIssuePhoto(null);
    setIssuePhotoPreview(null);
    setShowIssueModal(true);
  };

  const handleIssuePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIssuePhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setIssuePhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (issueType === "EMPTY_REQUEST" && !issuePhoto) {
      showToast.error("Wajib mengunggah foto bukti tempat sampah penuh!");
      return;
    }

    setIsSubmittingIssue(true);
    try {
      let uploadedPhotoUrl = "";
      if (issuePhoto) {
        const formData = new FormData();
        formData.append("image", issuePhoto);
        const uploadRes = await api.post("/waste/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        uploadedPhotoUrl = uploadRes.data?.data?.imageUrl || "";
      }

      const payload = {
        issueType,
        notes: issueNotes,
        photoUrl: uploadedPhotoUrl,
        evidencePhotoUrl: uploadedPhotoUrl,
        binId: issueBinId,
      };

      let res;
      if (issueType === "EMPTY_REQUEST") {
        res = await api.post(`/bins/reset-request`, payload);
      } else {
        res = await api.post(`/bins/${issueBinId}/report-issue`, payload);
      }

      if (res.data?.success) {
        showToast.success(res.data.data?.message || "Laporan berhasil dikirim!");
        setShowIssueModal(false);
        fetchMyBins();
      }
    } catch (err: any) {
      showToast.error(err.response?.data?.message || "Gagal mengirimkan laporan");
    } finally {
      setIsSubmittingIssue(false);
    }
  };

  const handleTukarPoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const pointsToRedeem = parseInt(tukarPoinAmount);
    if (!ewalletPhone.trim()) {
      showToast.error("Masukkan nomor HP E-Wallet!");
      return;
    }
    if (poin < pointsToRedeem) {
      showToast.error("Poin Anda tidak mencukupi!");
      return;
    }

    try {
      setIsConverting(true);
      const res = await api.post("/points/convert", {
        points: pointsToRedeem,
        ewalletType,
        phone: ewalletPhone,
      });

      if (res.data?.success) {
        showToast.success(
          `Berhasil mencairkan Rp ${(pointsToRedeem * 100).toLocaleString("id-ID")} ke ${ewalletType}!`
        );
        setEwalletPhone("");
        setShowSaldoModal(false);
        fetchSummary();
        fetchPoints();
        fetchNotifications();
      }
    } catch (err: any) {
      showToast.error(err.response?.data?.message || "Gagal melakukan penukaran poin");
    } finally {
      setIsConverting(false);
    }
  };

  const totalPointsEarned = pointHistory
    .filter((p) => p.points > 0)
    .reduce((sum, p) => sum + p.points, 0);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const pointsEarnedToday = pointHistory
    .filter((p) => p.points > 0 && new Date(p.createdAt) >= startOfToday)
    .reduce((sum, p) => sum + p.points, 0);

  const filteredLogs = wasteLogs.filter((log) => {
    if (filterWasteType === "ALL") return true;
    return log.jenis === filterWasteType;
  });

  return (
    <div className="space-y-6 pb-12 text-slate-800 dark:text-slate-100">
      {/* Cards KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoadingSummary ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex flex-col gap-3 animate-pulse"
            >
              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
              <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded w-3/4"></div>
              <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/2"></div>
            </div>
          ))
        ) : (
          <>
            {/* Card Poin */}
            <div
              onClick={() => setShowPoinModal(true)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-t-4 border-t-yellow-500 p-6 rounded-2xl shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all group"
            >
              <div className="w-10 h-10 bg-yellow-500 text-white rounded-xl flex items-center justify-center shadow-sm">
                <Star size={20} />
              </div>
              <div className="mt-3">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Poin Saya</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{poin.toLocaleString("id-ID")} Pts</h3>
                <p className="text-[11px] text-emerald-600 font-bold mt-2 flex items-center gap-1">
                  <TrendingUp size={13} /> +{pointsEarnedToday} Poin hari ini
                </p>
              </div>
            </div>

            {/* Card Saldo */}
            <div
              onClick={() => setShowSaldoModal(true)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-t-4 border-t-emerald-500 p-6 rounded-2xl shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all group"
            >
              <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-sm">
                <Banknote size={20} />
              </div>
              <div className="mt-3">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Saldo Rupiah</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">Rp {saldo.toLocaleString("id-ID")}</h3>
                <p className="text-[11px] text-cyan-600 font-bold mt-2 flex items-center gap-1">
                  <Wallet size={13} /> Cairkan Poin ke E-Wallet Anda
                </p>
              </div>
            </div>

            {/* Card Organik */}
            <div
              onClick={() => setShowSetoranModal(true)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-t-4 border-t-cyan-500 p-6 rounded-2xl shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all group"
            >
              <div className="w-10 h-10 bg-cyan-600 text-white rounded-xl flex items-center justify-center shadow-sm">
                <Leaf size={20} />
              </div>
              <div className="mt-3">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Organik Terpilah</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{organik} kg</h3>
                <p className="text-[11px] text-slate-500 font-medium mt-2">Masuk Pengolahan Loseda</p>
              </div>
            </div>

            {/* Card Anorganik */}
            <div
              onClick={() => setShowSetoranModal(true)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-t-4 border-t-blue-500 p-6 rounded-2xl shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all group"
            >
              <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-sm">
                <Recycle size={20} />
              </div>
              <div className="mt-3">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Anorganik Terpilah</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{anorganik} kg</h3>
                <p className="text-[11px] text-slate-500 font-medium mt-2">Daur Ulang Bank Sampah</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Left Column */}
        <div className="xl:col-span-8 space-y-4">
          {/* CTA Banner */}
          <div className="bg-emerald-50 rounded-3xl p-6 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
            <div className="space-y-2 z-10">
              <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5">
                <Zap size={13} className="text-emerald-600" /> Kuota AI Hari Ini: {quotaRemaining} / 50 Request
              </span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Setorkan Sampah, Dapatkan Poin Instan!</h3>
              <p className="text-xs text-slate-500 max-w-lg leading-relaxed">
                Foto jenis sampah Anda dan biarkan AI mengenali kategori secara presisi untuk langsung ditukar poin.
              </p>
            </div>
            <button
              onClick={() => navigate("/penyetoran-sampah")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-3.5 rounded-2xl text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer z-10 shrink-0"
            >
              Mulai Setor Sampah
            </button>
          </div>

          {/* Profile Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row gap-6 items-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center font-bold text-xl overflow-hidden border border-emerald-500/30 shrink-0 bg-emerald-500/10">
              <img
                src={getProfilePhotoUrl(user?.fotoProfil, user?.name)}
                alt="Avatar"
                className="w-full h-full object-cover"
                onError={(e) => handleAvatarError(e, user?.name)}
              />
            </div>
            <div className="flex-1 text-center sm:text-left space-y-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h4 className="font-extrabold text-[18px] text-slate-900 dark:text-slate-100">{user?.name}</h4>
                <span className="inline-block px-2 py-0.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 text-[10px] font-bold rounded-full uppercase tracking-wider w-fit mx-auto sm:mx-0">
                  WARGA PSC
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-1 font-medium">
                <Home size={16} />
                {user?.address || "Alamat Belum Dikonfigurasi"}
              </p>
              <p className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-1 font-medium">
                <MapPin size={16} />
                Wilayah Tugas: <strong className="text-emerald-600">{user?.wilayah || "-"}</strong>
              </p>
            </div>
            <button
              onClick={() => navigate("/profil")}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-[11px] font-bold rounded-xl uppercase tracking-wider flex items-center gap-1 cursor-pointer"
            >
              <Pencil size={16} />
              Edit Profil
            </button>
          </div>

          {/* Notifications Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h5 className="font-bold text-[15px] text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Bell className="text-emerald-600" size={18} />
                Notifikasi Terbaru
              </h5>
            </div>

            {isLoadingNotifications ? (
              <div className="animate-pulse space-y-3">
                <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
                <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">
                <Megaphone className="text-slate-700 dark:text-slate-300 block mb-1 mx-auto" size={32} />
                Belum ada notifikasi baru untuk Anda.
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.slice(0, 4).map((notif) => (
                  <div
                    key={notif.id}
                    className="flex gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/30 transition-colors"
                  >
                    <div
                      className={`w-8 h-8 rounded-full ${notif.iconBg || "bg-emerald-500/10"} ${notif.iconColor || "text-emerald-600"} flex items-center justify-center shrink-0`}
                    >
                      <IconRenderer name={notif.icon} size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold text-slate-900 dark:text-slate-100 truncate">{notif.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{notif.desc}</p>
                      <span className="text-[9px] text-slate-500 font-bold block mt-1">{notif.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="xl:col-span-4 space-y-4">
          {/* Bin Capacity */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h5 className="font-bold text-[15px] text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Trash2 className="text-emerald-600" size={18} />
                Tempat Sampah Rukun Warga (RW) Saya
              </h5>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                {user?.wilayah || "Umum"}
              </span>
            </div>

            {isLoadingBins ? (
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
                <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
              </div>
            ) : myBins.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">
                <AlertTriangle className="text-slate-700 dark:text-slate-300 block mb-1 mx-auto" size={32} />
                Tidak ada tempat sampah terdaftar di Rukun Warga (RW) Anda.
              </div>
            ) : (
              <div className="space-y-4">
                {myBins.map((bin) => (
                  <div
                    key={bin.id}
                    className="space-y-1.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60"
                  >
                    <div className="flex justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      <span className="flex items-center gap-1">
                        {bin.category === "ORGANIC" ? (
                          <Leaf size={14} className="text-emerald-600" />
                        ) : (
                          <Recycle size={14} className="text-blue-600" />
                        )}
                        Tempat Sampah {bin.category === "ORGANIC" ? "Organik" : "Anorganik"} ({bin.qrCode})
                      </span>
                      {bin.realStatus === "ACTIVE_BOUND" && (
                        <span className={bin.kapasitas > 80 ? "text-rose-600" : "text-slate-400"}>
                          {bin.kapasitas}% Terisi
                        </span>
                      )}
                    </div>
                    {bin.realStatus === "PENDING_APPROVAL" ? (
                      <div className="mt-2 p-2 bg-amber-500/10 rounded-xl border border-amber-500/30 text-center">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-amber-600 uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                          Menunggu Persetujuan
                        </span>
                      </div>
                    ) : bin.realStatus === "BROKEN" ? (
                      <div className="mt-2 p-2 bg-rose-500/10 rounded-xl border border-rose-500/30 text-center">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-rose-600 uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                          Tempat Sampah Rusak / QR Sobek
                        </span>
                      </div>
                    ) : bin.realStatus === "TIDAK_AKTIF" ? (
                      <div className="mt-2 p-2 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 text-center">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                          TIDAK AKTIF (&gt;30 Hari)
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${bin.kapasitas >= 80 ? "bg-rose-500" : bin.kapasitas >= 50 ? "bg-amber-500" : "bg-emerald-400"}`}
                            style={{ width: `${bin.kapasitas}%` }}
                          ></div>
                        </div>
                        <p className="text-[9px] text-slate-500 text-right font-semibold">
                          {bin.currentVolumeLiter} L / {bin.maxCapacityLiter} L Kapasitas
                        </p>

                        <div className="mt-3 flex gap-2 justify-end flex-wrap">
                          <button
                            onClick={() => {
                              setEditCapBinId(bin.id);
                              setShowEditCapModal(true);
                            }}
                            className="px-2.5 py-1 text-[10px] bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg hover:bg-slate-200 transition-all cursor-pointer uppercase tracking-wider flex items-center gap-0.5"
                          >
                            <Settings size={12} />
                            Ubah Kapasitas
                          </button>
                          <button
                            onClick={() => handleOpenIssueModal(bin.id, "EMPTY_REQUEST")}
                            className="px-2.5 py-1 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all cursor-pointer uppercase tracking-wider flex items-center gap-0.5"
                          >
                            <Truck size={12} />
                            Panggil Petugas
                          </button>
                          <button
                            onClick={() => handleOpenIssueModal(bin.id, "BROKEN_REPORT")}
                            className="px-2.5 py-1 text-[10px] border border-rose-500/40 text-rose-600 font-bold rounded-lg hover:bg-rose-500/10 transition-all cursor-pointer uppercase tracking-wider flex items-center gap-0.5"
                          >
                            <AlertTriangle size={12} />
                            Lapor Rusak
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h5 className="font-bold text-[15px] text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <History className="text-emerald-600" size={18} />
                Pemilahan Terakhir
              </h5>
              <button
                onClick={() => setShowSetoranModal(true)}
                className="text-emerald-600 hover:text-emerald-300 text-[11px] font-bold uppercase tracking-wider cursor-pointer"
              >
                Lihat Semua
              </button>
            </div>

            {isLoadingLogs ? (
              <div className="animate-pulse space-y-3">
                <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
                <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
              </div>
            ) : wasteLogs.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">
                <Archive className="text-slate-700 dark:text-slate-300 block mb-1 mx-auto" size={32} />
                Belum ada riwayat pemilahan sampah.
              </div>
            ) : (
              <div className="space-y-3">
                {wasteLogs.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:border-emerald-500/30 transition-all"
                  >
                    <div>
                      <p className="text-[9px] text-slate-500 font-bold">
                        {new Date(item.waktu).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-[12px] font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                        {item.jenis === "ORGANIC" ? "🌱 Organik" : "♻️ Anorganik"}{" "}
                        <span className="font-extrabold">{item.berat}</span>{" "}
                        <span className="font-normal text-[10px]">kg</span>
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {item.lokasi} • {item.volume}
                      </p>
                    </div>
                    <span className="text-[12px] font-extrabold text-emerald-600">+{item.poin} Pts</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Leaderboard Full Width Section */}
      <div className="w-full">
        <LeaderboardWidget mode="sampah" />
      </div>

      {/* ================= MODALS ================= */}

      {/* ISSUE REPORT MODAL */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-emerald-500/30 text-slate-800 dark:text-slate-100">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/60">
              <h3 className="font-extrabold text-[18px] text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <AlertTriangle className="text-emerald-600" size={20} />
                {issueType === "EMPTY_REQUEST" ? "Lapor Tempat Sampah Penuh" : "Lapor Tempat Sampah Rusak"}
              </h3>
              <button
                onClick={() => setShowIssueModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-400 flex items-center justify-center transition-colors cursor-pointer border border-slate-300 dark:border-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmitIssue} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Catatan (Opsional)</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-700 dark:text-slate-300 focus:border-emerald-500 focus:outline-none"
                    value={issueNotes}
                    onChange={(e) => setIssueNotes(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Foto Bukti {issueType === "EMPTY_REQUEST" ? "(Wajib)" : "(Opsional)"}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleIssuePhotoChange}
                    className="text-xs text-slate-600 dark:text-slate-400"
                    required={issueType === "EMPTY_REQUEST"}
                  />
                  {issuePhotoPreview && (
                    <img src={issuePhotoPreview} alt="Preview" className="w-full max-h-48 object-contain rounded-xl border border-slate-300 dark:border-slate-700 mt-2" />
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingIssue || (issueType === "EMPTY_REQUEST" && !issuePhoto)}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 flex justify-center items-center gap-2 cursor-pointer"
                  >
                    {isSubmittingIssue ? <RefreshCcw className="animate-spin" size={16} /> : <Send size={16} />}
                    Kirim Laporan
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* EDIT CAPACITY MODAL */}
      {showEditCapModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-emerald-500/30 text-slate-800 dark:text-slate-100">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/60">
              <h3 className="font-extrabold text-[18px] text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Settings className="text-emerald-600" size={20} />
                Ubah Kapasitas Tempat Sampah
              </h3>
              <button
                onClick={() => setShowEditCapModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-400 flex items-center justify-center transition-colors cursor-pointer border border-slate-300 dark:border-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleUpdateCapacity} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Opsi Kapasitas</label>
                  <select
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-700 dark:text-slate-300 focus:border-emerald-500 focus:outline-none"
                    value={editCapMode}
                    onChange={(e) => setEditCapMode(e.target.value)}
                  >
                    <option value="DEFAULT">Default Standar Pemerintah (25 Liter)</option>
                    <option value="MANUAL">Input Manual (Wajib Foto Bukti)</option>
                    <option value="AI" disabled>Estimasi AI (Segera Hadir)</option>
                  </select>
                </div>

                {editCapMode === "MANUAL" && (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">
                        Kapasitas Tempat Sampah Baru (Liter)
                      </label>
                      <input
                        type="number"
                        placeholder="Contoh: 50"
                        className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-700 dark:text-slate-300 focus:border-emerald-500 focus:outline-none"
                        value={editCapValue}
                        onChange={(e) => setEditCapValue(e.target.value)}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">
                        Upload Foto Bukti Tempat Sampah
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setEditCapPhoto(e.target.files?.[0] || null)}
                        className="w-full text-xs text-slate-600 dark:text-slate-400"
                        required
                      />
                    </div>
                  </>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isUpdatingCap}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 flex justify-center items-center gap-2 cursor-pointer"
                  >
                    {isUpdatingCap ? <RefreshCcw className="animate-spin" size={16} /> : <Save size={16} />}
                    {isUpdatingCap ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* POIN MODAL */}
      {showPoinModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-emerald-500/30 text-slate-800 dark:text-slate-100">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/60">
              <h3 className="font-extrabold text-[18px] text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Star className="text-yellow-600" size={20} />
                Riwayat & Detail Poin
              </h3>
              <button
                onClick={() => setShowPoinModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-400 flex items-center justify-center transition-colors cursor-pointer border border-slate-300 dark:border-slate-700"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Total Poin Diperoleh</p>
                  <p className="text-xl font-bold text-emerald-600 mt-1">+{totalPointsEarned} Pts</p>
                </div>
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Target Rank Selanjutnya</p>
                  <p className="text-xl font-bold text-amber-600 mt-1">Silver Rank</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Progres Tingkat</span>
                  <span>{poin} / 1000 Poin</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (poin / 1000) * 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Breakdown Aktivitas Poin
                </h4>
                {isLoadingPoints ? (
                  <p className="text-xs text-center py-4 text-slate-400">Memuat data...</p>
                ) : pointHistory.length === 0 ? (
                  <p className="text-xs text-center py-4 text-slate-500">Belum ada transaksi poin.</p>
                ) : (
                  <div className="divide-y divide-slate-200 dark:divide-slate-800 max-h-[250px] overflow-y-auto">
                    {pointHistory.map((historyItem) => (
                      <div key={historyItem.id} className="py-3 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-slate-700 dark:text-slate-300">{historyItem.description}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {new Date(historyItem.createdAt).toLocaleString("id-ID")}
                          </p>
                        </div>
                        <span
                          className={`font-extrabold text-sm ${historyItem.points > 0 ? "text-emerald-600" : "text-rose-600"}`}
                        >
                          {historyItem.points > 0 ? `+${historyItem.points}` : historyItem.points}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowPoinModal(false)}
                className="px-5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors border border-slate-300 dark:border-slate-700 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SALDO MODAL */}
      {showSaldoModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-emerald-500/30 text-slate-800 dark:text-slate-100">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/60">
              <h3 className="font-extrabold text-[18px] text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Banknote className="text-emerald-600" size={20} />
                Cairkan Saldo E-Wallet
              </h3>
              <button
                onClick={() => setShowSaldoModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-400 flex items-center justify-center transition-colors cursor-pointer border border-slate-300 dark:border-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 text-center">
                <p className="text-[11px] text-emerald-600 font-extrabold uppercase tracking-wider">
                  Sisa Saldo Dapat Dicairkan
                </p>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">Rp {saldo.toLocaleString("id-ID")}</p>
                <p className="text-[10px] text-emerald-600/80 mt-1">
                  Dihitung otomatis: Poin ({poin}) x Rp 100
                </p>
              </div>

              <form onSubmit={handleTukarPoin} className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Form Penukaran Saldo
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Poin Ditukar</label>
                    <select
                      className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-700 dark:text-slate-300 focus:border-emerald-500 focus:outline-none"
                      value={tukarPoinAmount}
                      onChange={(e) => setTukarPoinAmount(e.target.value)}
                    >
                      <option value="500">500 Poin (Rp 50.000)</option>
                      <option value="1000">1000 Poin (Rp 100.000)</option>
                      <option value="2000">2000 Poin (Rp 200.000)</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Metode E-Wallet</label>
                    <select
                      className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-700 dark:text-slate-300 focus:border-emerald-500 focus:outline-none"
                      value={ewalletType}
                      onChange={(e) => setEwalletType(e.target.value)}
                    >
                      <option value="DANA">DANA</option>
                      <option value="OVO">OVO</option>
                      <option value="GOPAY">GoPay</option>
                      <option value="SHOPEEPAY">ShopeePay</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Nomor HP Terdaftar</label>
                  <input
                    type="tel"
                    placeholder="contoh: 08123456789"
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-700 dark:text-slate-300 focus:border-emerald-500 focus:outline-none"
                    value={ewalletPhone}
                    onChange={(e) => setEwalletPhone(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isConverting || poin < parseInt(tukarPoinAmount)}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isConverting ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <Building2 size={16} />
                      <span>Konversi Sekarang</span>
                    </>
                  )}
                </button>
              </form>

              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Riwayat Pencairan Terakhir
                </h4>
                <div className="divide-y divide-slate-200 dark:divide-slate-800 max-h-[180px] overflow-y-auto">
                  {pointHistory.filter((p) => p.points < 0).length === 0 ? (
                    <p className="text-xs text-slate-500 py-3 text-center">
                      Belum ada riwayat pencairan saldo.
                    </p>
                  ) : (
                    pointHistory
                      .filter((p) => p.points < 0)
                      .map((historyItem) => (
                        <div key={historyItem.id} className="py-2.5 flex justify-between items-center text-xs">
                          <div>
                            <p className="font-bold text-slate-700 dark:text-slate-300">
                              {historyItem.description.replace("Konversi ", "")}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {new Date(historyItem.createdAt).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                          <span className="font-bold text-rose-600">
                            -Rp {Math.abs(historyItem.points * 100).toLocaleString("id-ID")}
                          </span>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowSaldoModal(false)}
                className="px-5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors border border-slate-300 dark:border-slate-700 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SETORAN MODAL */}
      {showSetoranModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-emerald-500/30 text-slate-800 dark:text-slate-100">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/60">
              <h3 className="font-extrabold text-[18px] text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Recycle className="text-emerald-600" size={20} />
                Semua Riwayat Pemilahan Sampah
              </h3>
              <button
                onClick={() => setShowSetoranModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-400 flex items-center justify-center transition-colors cursor-pointer border border-slate-300 dark:border-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              <div className="flex gap-2">
                {["ALL", "ORGANIC", "ANORGANIK"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterWasteType(type)}
                    className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer border ${
                      filterWasteType === type
                        ? "bg-emerald-600 text-white border-emerald-500"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {type === "ALL" ? "Semua" : type === "ORGANIC" ? "Organik" : "Anorganik"}
                  </button>
                ))}
              </div>

              {isLoadingLogs ? (
                <p className="text-xs text-center py-6 text-slate-400">Memuat...</p>
              ) : filteredLogs.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">Tidak ada data pemilahan.</p>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-800/60">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 border-b border-slate-200 dark:border-slate-800">
                          <th className="p-3 font-bold">Tanggal</th>
                          <th className="p-3 font-bold">Kategori</th>
                          <th className="p-3 font-bold">Berat (kg)</th>
                          <th className="p-3 font-bold">Estimasi Vol</th>
                          <th className="p-3 font-bold">Poin</th>
                          <th className="p-3 font-bold">Titik Tempat Sampah</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {filteredLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                            <td className="p-3 font-medium text-slate-600 dark:text-slate-400">
                              {new Date(log.waktu).toLocaleString("id-ID", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                                  log.jenis === "ORGANIC"
                                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                    : "bg-blue-500/10 text-blue-600 border-blue-500/30"
                                }`}
                              >
                                {log.jenis === "ORGANIC" ? "Organik" : "Anorganik"}
                              </span>
                            </td>
                            <td className="p-3 font-bold text-slate-700 dark:text-slate-300">{log.berat}</td>
                            <td className="p-3 font-medium text-slate-400">{log.volume}</td>
                            <td className="p-3 font-extrabold text-emerald-600">+{log.poin} Pts</td>
                            <td className="p-3 font-mono font-bold text-slate-600 dark:text-slate-400">
                              {log.lokasi.replace("Tempat Sampah: ", "")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowSetoranModal(false)}
                className="px-5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors border border-slate-300 dark:border-slate-700 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ========== KPI Card Component ==========
type KpiColor = "blue" | "emerald" | "indigo" | "amber" | "yellow" | "cyan";

const KPI_COLOR_STYLES: Record<KpiColor, { icon: string; border: string }> = {
  blue: { icon: "bg-blue-600", border: "border-t-blue-500" },
  emerald: { icon: "bg-emerald-600", border: "border-t-emerald-500" },
  indigo: { icon: "bg-indigo-600", border: "border-t-indigo-500" },
  amber: { icon: "bg-amber-500", border: "border-t-amber-500" },
  yellow: { icon: "bg-yellow-500", border: "border-t-yellow-500" },
  cyan: { icon: "bg-cyan-600", border: "border-t-cyan-500" },
};

interface KpiCardProps {
  iconName: string;
  color: KpiColor;
  label: string;
  value: string | number;
  trend?: string | number;
  trendLabel?: string;
  trendUp?: boolean;
  linkTo?: string;
  onClick?: () => void;
}

const renderKpiIcon = (name: string) => {
  switch (name) {
    case "group":
    case "users":
      return <Users size={22} />;
    case "delete":
    case "trash":
      return <Trash2 size={22} />;
    case "location_on":
    case "map-pin":
      return <MapPin size={22} />;
    case "shopping_bag":
    case "shopping-bag":
      return <ShoppingBag size={22} />;
    case "stars":
    case "award":
      return <Award size={22} />;
    case "graduation-cap":
    case "school":
      return <GraduationCap size={22} />;
    default:
      return <IconRenderer name={name} size={22} />;
  }
};

const KpiCard: React.FC<KpiCardProps> = ({
  iconName,
  color,
  label,
  value,
  trend,
  trendLabel,
  trendUp,
  linkTo,
  onClick,
}) => {
  const { user, can } = useAuthStore();
  const styles = KPI_COLOR_STYLES[color];

  // Pastikan linkTo hanya aktif jika rute tersebut dapat diakses pada menu sidebar pengguna saat ini
  const isAccessible = linkTo ? canAccessSidebarRoute(linkTo, user, can) : false;
  const effectiveLinkTo = isAccessible ? linkTo : undefined;
  const isClickable = Boolean(effectiveLinkTo || onClick);

  const content = (
    <div
      onClick={!effectiveLinkTo ? onClick : undefined}
      className={`bg-white dark:bg-slate-900 shadow-xs rounded-2xl p-5 border border-slate-200 dark:border-slate-800 border-t-4 ${styles.border} flex flex-col justify-between h-full transition-all duration-300 group ${
        isClickable
          ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5"
          : "cursor-default"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-11 h-11 ${styles.icon} text-white rounded-xl flex items-center justify-center shrink-0 shadow-xs`}
        >
          {renderKpiIcon(iconName)}
        </div>
        <div className="flex-1 min-w-0">
          <p 
            title={label}
            className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider leading-snug line-clamp-2 min-h-[2.4em] flex items-center"
          >
            {label}
          </p>
          <h4 className="text-[22px] sm:text-[24px] font-black text-slate-900 dark:text-slate-100 tracking-tight mt-0.5 leading-none">
            {value !== undefined ? value : "-"}
          </h4>
        </div>
      </div>
      {trend || trendLabel ? (
        <div className="flex items-center gap-1.5 mt-3 border-t border-slate-100 dark:border-slate-800 pt-2.5">
          {trendUp !== undefined && (
            trendUp ? (
              <TrendingUp size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <TrendingDown size={14} className="text-rose-600 dark:text-rose-400 shrink-0" />
            )
          )}
          <span
            className={`text-[10.5px] font-bold ${trendUp === true ? "text-emerald-600 dark:text-emerald-400" : trendUp === false ? "text-rose-600 dark:text-rose-400" : "text-slate-500 dark:text-slate-400"}`}
          >
            {trend && trendLabel ? `${trend} • ${trendLabel}` : trend || trendLabel}
          </span>
        </div>
      ) : (
        <div className="mt-3 border-t border-transparent pt-2.5 min-h-[26px] hidden sm:block" aria-hidden="true" />
      )}
    </div>
  );

  if (effectiveLinkTo) {
    return (
      <Link to={effectiveLinkTo} onClick={onClick} className="block h-full">
        {content}
      </Link>
    );
  }
  return content;
};

// ========== Main Executive Dashboard ==========
const Dashboard: React.FC = () => {
  const { user, can, updateWilayah } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const isPimpinan =
    user?.peran === "PIMPINAN" ||
    user?.peran === "PEMIMPIN" ||
    user?.peran === "PANITIA_TASKFORCE" ||
    user?.peran === "TASK_FORCE" ||
    (user as any)?.role === "PIMPINAN" ||
    (user as any)?.role === "PEMIMPIN";
  const isSuperOrDev = user?.peran === "SUPER_USER" || user?.peran === "DEVELOPER";
  const userPeran = (user?.peran || (user as any)?.role || "").toUpperCase();
  const isMpl =
    userPeran === "MPL" ||
    userPeran === "MITRA_PEMBIMBING_LAPANGAN" ||
    userPeran === "MITRA_PENDAMPING_LAPANGAN" ||
    userPeran === "MITRA";
  const isStaging = isStagingEnv();
  const canAccessKknSub = isPimpinan || isSuperOrDev || isStaging;
  const canAccessGisSub =
    isStaging &&
    (isSuperOrDev ||
      isPimpinan ||
      userPeran === "ADMIN" ||
      userPeran === "SUPER_ADMIN" ||
      userPeran === "ADMIN_DLH" ||
      userPeran === "CAMAT" ||
      userPeran === "LURAH" ||
      userPeran === "RW");
  const canAccessTabs = canAccessKknSub || canAccessGisSub;

  const tabParam = searchParams.get("tab");
  const isKknTab = tabParam === "kkn";
  const isGisTab = tabParam === "gis";
  const activeSubTab = isKknTab
    ? "kkn"
    : isGisTab && canAccessGisSub
    ? "gis"
    : tabParam === "tata-kelola-sampah" || tabParam === "sampah"
    ? "tata-kelola-sampah"
    : isPimpinan
    ? "kkn"
    : "tata-kelola-sampah";

  const viewParam = searchParams.get("view");
  const activeWasteView = viewParam === "gis" ? "gis" : viewParam === "bins" ? "bins" : "ringkasan";

  const [stats, setStats] = useState<any>(null);
  const [recentBins, setRecentBins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [timeFilter, setTimeFilter] = useState("semua");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedWasteSource, setSelectedWasteSource] = useState<WasteSourceType>("ALL");

  // Wilayah selection state (Default: Kecamatan Coblong)
  const isLurahRole = (user?.role || user?.peran || "").toUpperCase() === "LURAH";
  const userKelurahan = user?.kelurahan || (user?.address?.includes("Cipaganti") || user?.name?.includes("Cipaganti") ? "Cipaganti" : "");
  
  const [selectedWilayah, setSelectedWilayah] = useState<string>(() => {
    if (isLurahRole) {
      return userKelurahan ? (userKelurahan.startsWith("Kel.") ? userKelurahan : `Kel. ${userKelurahan}`) : "Kel. Cipaganti";
    }
    if (
      user?.wilayah &&
      user.wilayah !== "PT Makerindo" &&
      user.wilayah !== "Sistem Pusat" &&
      user.wilayah !== "Sistem Terpusat" &&
      user.wilayah !== "Wilayah Operasional" &&
      user.wilayah !== "Dinas Lingkungan Hidup"
    ) {
      return user.wilayah;
    }
    return "Semua Wilayah";
  });

  const [wilayahOptions, setWilayahOptions] = useState<SelectOption[]>(DEFAULT_WILAYAH_OPTIONS);

  // Fetch real list of Kelurahan from backend API
  useEffect(() => {
    const fetchRealKelurahan = async () => {
      try {
        const res = await api.get("/areas/kelurahan");
        const list = res.data?.data || (Array.isArray(res.data) ? res.data : []);
        if (Array.isArray(list) && list.length > 0) {
          const dynamicOptions: SelectOption[] = [
            {
              value: "Semua Wilayah",
              label: "Seluruh Wilayah",
              sublabel: "Cakupan Seluruh Wilayah",
            },
            ...list.map((k: any) => {
              const name = k.name || k.nama || "";
              const formattedName = name.startsWith("Kel.") ? name : `Kel. ${name}`;
              return {
                value: formattedName,
                label: formattedName,
                sublabel: `Kelurahan ${name.replace(/^Kel\.\s*/i, "")}`,
              };
            }),
          ];
          setWilayahOptions(dynamicOptions);
        }
      } catch (_e) {
        // Fallback to default options
      }
    };
    fetchRealKelurahan();
  }, []);

  const handleRegionChange = (newWilayah: string) => {
    setSelectedWilayah(newWilayah);
    if (updateWilayah) {
      updateWilayah(newWilayah);
    }
    showToast.success(`Wilayah aktif diubah ke ${newWilayah}`);
  };

  const [trendData, setTrendData] = useState<any[]>([]);
  const [weeks, setWeeks] = useState(8);
  const [locations, setLocations] = useState<any[]>([]);
  const [showComplianceModal, setShowComplianceModal] = useState(false);
  const [complianceWidgetMetrics, setComplianceWidgetMetrics] = useState<ComplianceMetricsResult | null>(null);
  const handleComplianceMetricsLoaded = useCallback((m: ComplianceMetricsResult) => {
    setComplianceWidgetMetrics(m);
  }, []);
  const handleOpenComplianceDetail = useCallback((m: ComplianceMetricsResult | null) => {
    if (m) setComplianceWidgetMetrics(m);
    setShowComplianceModal(true);
  }, []);
  const [showCompositionDetail, setShowCompositionDetail] = useState(false);
  const [selectedBinForDetail, setSelectedBinForDetail] = useState<any | null>(null);
  const [deleteBinConfirm, setDeleteBinConfirm] = useState<any | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(new Date());

  const formattedLastUpdated = useMemo(() => {
    const d = lastUpdated || new Date();
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    return `${day} ${month} ${year} • ${hours}.${mins} WIB`;
  }, [lastUpdated]);

  const handleConfirmDeleteBin = async () => {
    if (!deleteBinConfirm) return;
    try {
      await api.delete(`/bins/${deleteBinConfirm.id || deleteBinConfirm.kode}`);
      showToast.success("Tempat sampah berhasil dihapus");
      setRecentBins((prev) =>
        prev.filter((b) => b.id !== deleteBinConfirm.id && b.kode !== deleteBinConfirm.kode)
      );
    } catch (err: any) {
      showToast.error(err.response?.data?.message || "Gagal menghapus tempat sampah");
    } finally {
      setDeleteBinConfirm(null);
    }
  };

  const effectiveWilayah = isLurahRole
    ? (userKelurahan ? (userKelurahan.startsWith("Kel.") ? userKelurahan : `Kel. ${userKelurahan}`) : "Kel. Cipaganti")
    : (selectedWilayah || "Semua Wilayah");

  const fetchStats = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);
      setError("");
      const kpiParams: Record<string, any> = { wilayah: effectiveWilayah };
      if (timeFilter === "custom" && startDate && endDate) {
        kpiParams.startDate = startDate;
        kpiParams.endDate = endDate;
      } else {
        kpiParams.period = timeFilter;
      }

      const response = await api.get("/dashboard/kpi", {
        params: kpiParams,
      });
      const kpi = response.data?.data ?? response.data;
      if (!kpi) throw new Error("KPI kosong");

      const organikKg = Number(kpi.komposisiSampah?.organikKg ?? 0);
      const anorganikKg = Number(kpi.komposisiSampah?.anorganikKg ?? 0);
      const residuKg = Number(kpi.komposisiSampah?.residuKg ?? 0);
      const totalBerat = organikKg + anorganikKg + residuKg;
      const pctOrganik = totalBerat > 0 ? Math.round((organikKg / totalBerat) * 100) : 0;
      const pctAnorganik = totalBerat > 0 ? Math.round((anorganikKg / totalBerat) * 100) : 0;
      const pctResidu = totalBerat > 0 ? 100 - pctOrganik - pctAnorganik : 0;

      const periodTrendLabel =
        timeFilter === "custom" && startDate && endDate
          ? `${startDate} s/d ${endDate}`
          : timeFilter === "semua"
          ? "Total Keseluruhan"
          : `Periode ${timeFilter}`;

      const totalPenggunaSampahVal = Number(kpi.totalPenggunaSampah ?? kpi.penggunaSampah?.total ?? 0);
      const totalPartisipanKknVal = Number(kpi.totalPartisipanKkn ?? kpi.partisipanKkn?.total ?? 0);

      const wargaCount = Number(kpi.penggunaSampah?.warga ?? 0);
      const petugasCount = Number(kpi.penggunaSampah?.petugas ?? 0);
      const rwCount = Number(kpi.penggunaSampah?.rw ?? kpi.penggunaSampah?.aparatur ?? 0);

      const mhsCount = Number(kpi.partisipanKkn?.mahasiswa ?? 0);
      const dplCount = Number(kpi.partisipanKkn?.dpl ?? 0);

      const sampahTrendLabel = rwCount > 0
        ? `${wargaCount} Warga • ${petugasCount} Petugas • ${rwCount} RW`
        : `${wargaCount} Warga • ${petugasCount} Petugas`;

      const kknTrendLabel = dplCount > 0
        ? `${mhsCount} Mahasiswa • ${dplCount} DPL`
        : `${mhsCount} Mahasiswa`;

      setStats({
        penggunaSampah: {
          value: totalPenggunaSampahVal.toLocaleString("id-ID"),
          trend: "Terdaftar",
          trendLabel: sampahTrendLabel,
          trendUp: true,
        },
        partisipanKkn: {
          value: totalPartisipanKknVal.toLocaleString("id-ID"),
          trend: "Terdaftar KKN",
          trendLabel: kknTrendLabel,
          trendUp: true,
        },
        totalPengguna: {
          value: (kpi.totalUsers ?? 0).toLocaleString("id-ID"),
          trend: "Terdaftar",
          trendLabel: periodTrendLabel,
          trendUp: true,
        },
        tempatSampahAktif: {
          value: (kpi.tempatSampahAktif ?? 0).toLocaleString("id-ID"),
          trend: "Teraktivasi Warga",
          trendLabel: "Terdaftar Aktif",
          trendUp: true,
        },
        lokasiTerdaftar: {
          value: (kpi.lokasiTerdaftar ?? 0).toLocaleString("id-ID"),
          trend: "Wilayah Terjangkau",
          trendLabel: "Rukun Warga (RW)",
          trendUp: true,
        },
        setoranHariIni: {
          value: `${Number(kpi.setoranHariIniKg ?? 0).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg`,
          trend: "Tonase Sampah",
          trendLabel: periodTrendLabel,
          trendUp: true,
        },
        totalPoin: {
          value:
            (kpi.totalPoin ?? 0) > 1000
              ? `${((kpi.totalPoin ?? 0) / 1000).toFixed(2)}K`
              : Number(kpi.totalPoin ?? 0).toLocaleString("id-ID"),
          trend: "Akumulasi Poin",
          trendLabel: "Peringkat Warga",
          trendUp: true,
        },
        jadwalMingguIni: { 
          value: kpi.jadwalSelesai ?? 0, 
          trend: `${kpi.jadwalTotal ?? 0}`, 
          trendLabel: timeFilter === "semua" ? "Total keseluruhan" : `Periode ${timeFilter}`, 
          trendUp: true 
        },
        komposisiSampah: {
          organik: { berat: `${organikKg.toFixed(2)} kg`, persentase: `${pctOrganik}%` },
          anorganik: { berat: `${anorganikKg.toFixed(2)} kg`, persentase: `${pctAnorganik}%` },
          residu: { berat: `${residuKg.toFixed(2)} kg`, persentase: `${pctResidu}%` },
          pctOrganik,
          pctAnorganik,
          pctResidu,
          organikKg,
          anorganikKg,
          residuKg,
        },
        activeSessions: kpi.activeSessions ?? null,
        kepatuhanPemilahan: kpi.kepatuhanPemilahan ?? {
          rate: 0,
          compliantCount: 0,
          nonCompliantCount: 0,
          totalCount: 0,
          unverifiedCount: 0,
          organikRate: 0,
          anorganikRate: 0,
          organikSetoranDinilai: 0,
          anorganikSetoranDinilai: 0,
          organikBinTotal: 0,
          anorganikBinTotal: 0,
        },
        baselineComparison: kpi.baselineComparison ?? null,
      });

      const [binsSettled, trendSettled, locSettled] =
        await Promise.allSettled([
          api.get("/bins"),
          api.get("/dashboard/trend", { params: { weeks, wilayah: effectiveWilayah } }),
          api.get("/bins/locations"),
        ]);

      const isDistrictScope =
        !effectiveWilayah ||
        effectiveWilayah === "Semua Wilayah" ||
        effectiveWilayah === "Kecamatan Coblong" ||
        effectiveWilayah.toLowerCase().includes("kecamatan") ||
        effectiveWilayah === "Sistem Pusat" ||
        effectiveWilayah === "PT Makerindo";

      if (binsSettled.status === "fulfilled") {
        let binsData = binsSettled.value.data?.data ?? binsSettled.value.data ?? [];
        if (!isDistrictScope) {
          const cleanWil = effectiveWilayah.replace(/^Kel\.\s*/i, "").trim().toLowerCase();
          binsData = binsData.filter((b: any) => {
            const binKelName = (
              b.kelurahanName ||
              b.kelurahan?.name ||
              b.rtRw?.kelurahan?.name ||
              (typeof b.rtRw === "string" ? b.rtRw : b.rtRw?.name || "") ||
              b.lokasi ||
              ""
            ).toLowerCase();
            return binKelName.includes(cleanWil);
          });
        }
        const realBins = Array.isArray(binsData) ? binsData.filter((b: any) => !(b.qrCode || b.kode || b.id || "").toUpperCase().includes("TEST")) : [];
        setRecentBins(realBins.slice(0, 5));
      } else {
        setRecentBins([]);
      }

      if (trendSettled.status === "fulfilled" && trendSettled.value.data?.success) {
        setTrendData(trendSettled.value.data.data);
      }

      if (locSettled.status === "fulfilled" && locSettled.value.data?.success) {
        setLocations(locSettled.value.data.data);
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error("Dashboard KPI error", err);
      setError("Gagal memuat data dashboard dari server.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Role non-operasional dialihkan / tidak memuat stats sampah
    // PIMPINAN / PEMIMPIN / PANITIA_TASKFORCE / DEVELOPER / SUPER_USER memuat fetchStats() agar data rekapitulasi kelurahan konsisten
    if (
      user?.peran === "WARGA" ||
      user?.peran === "MAHASISWA_KKN" ||
      user?.peran === "PETUGAS_RESIDU" ||
      user?.peran === "RW" ||
      user?.peran === "DPL" ||
      user?.peran === "DOSEN_PEMBIMBING" ||
      isMpl
    ) {
      setLoading(false);
      return;
    }

    // Jika tab aktif KKN atau GIS, hentikan fetching stats sampah (modul KKN dan GIS punya loader independen)
    if (activeSubTab === "kkn" || activeSubTab === "gis") {
      setLoading(false);
      return;
    }

    fetchStats(false);
    const interval = setInterval(() => fetchStats(true), 30_000);
    return () => clearInterval(interval);
  }, [user, weeks, timeFilter, startDate, endDate, selectedWilayah, activeSubTab]);

  // ── Semua derived calculations HARUS di sini (sebelum early returns) ──
  // Ini mencegah pelanggaran Rules of Hooks saat ada early return kondisional
  const kelurahanBaselineList: KelurahanBaselineData[] =
    stats?.baselineComparison && Array.isArray(stats.baselineComparison) && stats.baselineComparison.length > 0
      ? stats.baselineComparison
      : (loading ? KELURAHAN_BASELINE_DATA : []);

  const wasteImpactItems: WasteImpactItem[] = useMemo(() => {
    return kelurahanBaselineList.map((item) => {
      const normKey = (item.kelurahan || "").toLowerCase().replace(/^(kel\.|kelurahan)\s*/i, "").replace(/\s+/g, "");
      const fbRate = SURVEY_BASELINE_RATES[normKey] ?? null;
      const fbKg = SURVEY_BASELINE_KG[normKey] ?? null;

      const rawBaselineComp =
        item.baselineCompliance !== undefined && item.baselineCompliance !== null && item.baselineCompliance > 0
          ? item.baselineCompliance
          : (item.baselineRate !== undefined && item.baselineRate !== null && item.baselineRate > 0
              ? item.baselineRate
              : fbRate);

      const rawBaselineKg =
        item.baselineKg !== undefined && item.baselineKg !== null && item.baselineKg > 0
          ? item.baselineKg
          : fbKg;

      return {
        ...item,
        baselineKg: rawBaselineKg,
        hasBaseline: (rawBaselineKg !== null && rawBaselineKg > 0) || (rawBaselineComp !== null && rawBaselineComp > 0),
        actualKg: Number(item.totalKg || 0),
        wargaKg: Number(item.wargaKg || 0),
        petugasKg: Number(item.petugasKg || 0),
        baselineCompliance: rawBaselineComp,
        actualCompliance:
          item.actualCompliance !== undefined && item.actualCompliance !== null
            ? item.actualCompliance
            : (item.endlineRate ?? null),
        partisipasiWarga: (item as any).partisipasiWarga ?? null,
        akurasiPilah: (item as any).akurasiPilah ?? null,
        wargaAktif: (item as any).wargaAktif ?? null,
        totalWarga: (item as any).totalWarga ?? null,
      };
    });
  }, [kelurahanBaselineList]);

  const renderTabSwitcher = () => {
    if (!canAccessTabs) return null;

    return (
      <div className="bg-slate-100/90 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex items-center gap-1.5 w-fit max-w-full overflow-x-auto shadow-2xs">
        {canAccessKknSub && (
          <button
            type="button"
            onClick={() => setSearchParams({ tab: "kkn" })}
            className={`flex items-center gap-2 px-4 h-10 rounded-xl text-xs font-bold transition-all duration-200 shrink-0 cursor-pointer ${
              activeSubTab === "kkn"
                ? "bg-white dark:bg-slate-900 text-[#009966] dark:text-emerald-400 shadow-xs border border-slate-200/80 dark:border-slate-700 font-black"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/60 dark:hover:bg-slate-700/60"
            }`}
          >
            <GraduationCap size={15} className={activeSubTab === "kkn" ? "text-[#009966] dark:text-emerald-400" : "text-slate-400"} />
            <span>Kuliah Kerja Nyata</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => setSearchParams({ tab: "tata-kelola-sampah" })}
          className={`flex items-center gap-2 px-4 h-10 rounded-xl text-xs font-bold transition-all duration-200 shrink-0 cursor-pointer ${
            activeSubTab === "tata-kelola-sampah"
              ? "bg-white dark:bg-slate-900 text-[#009966] dark:text-emerald-400 shadow-xs border border-slate-200/80 dark:border-slate-700 font-black"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/60 dark:hover:bg-slate-700/60"
          }`}
        >
          <Recycle size={15} className={activeSubTab === "tata-kelola-sampah" ? "text-[#009966] dark:text-emerald-400" : "text-slate-400"} />
          <span>Tata Kelola Sampah</span>
        </button>
        {canAccessGisSub && (
          <button
            type="button"
            onClick={() => setSearchParams({ tab: "gis" })}
            className={`flex items-center gap-2 px-4 h-10 rounded-xl text-xs font-bold transition-all duration-200 shrink-0 cursor-pointer ${
              activeSubTab === "gis"
                ? "bg-white dark:bg-slate-900 text-[#009966] dark:text-emerald-400 shadow-xs border border-slate-200/80 dark:border-slate-700 font-black"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/60 dark:hover:bg-slate-700/60"
            }`}
          >
            <MapPin size={15} className={activeSubTab === "gis" ? "text-[#009966] dark:text-emerald-400" : "text-slate-400"} />
            <span>GIS Eksekutif Tata Kelola Sampah</span>
          </button>
        )}
      </div>
    );
  };

  if (user?.peran === "WARGA") return <WargaDashboard />;
  if (user?.peran === "RW") return <RwDashboard />;
  if (user?.peran === "MAHASISWA_KKN") return <KknDashboard />;
  if (user?.peran === "PETUGAS_RESIDU") return <ResiduDashboard />;
  if (
    user?.peran === "DPL" ||
    user?.peran === "DOSEN_PEMBIMBING" ||
    (user?.peran as string) === "DOSEN_PENDAMPING" ||
    isMpl
  ) {
    return <DplDashboardPage />;
  }

  // Khusus Pimpinan / Taskforce (atau Super User/Dev) jika sub-dashboard KKN aktif
  if (canAccessKknSub && activeSubTab === "kkn") {
    return (
      <div className="w-full space-y-6 font-sans">
        {renderTabSwitcher()}
        <DashboardEksekutifKkn />
      </div>
    );
  }

  // Khusus tab GIS Eksekutif Tata Kelola Sampah
  if (canAccessGisSub && activeSubTab === "gis") {
    return (
      <div className="w-full space-y-6 pb-12 font-sans text-slate-800 relative">
        {renderTabSwitcher()}
        <React.Suspense fallback={<div className="p-8 text-center text-slate-500 font-semibold text-xs">Memuat peta GIS Eksekutif...</div>}>
          <GisEksekutifPage />
        </React.Suspense>
      </div>
    );
  }

  // Khusus View Bins pada Tab Tata Kelola Sampah (/dasbor?tab=tata-kelola-sampah&view=bins)
  if (activeSubTab === "tata-kelola-sampah" && activeWasteView === "bins") {
    return (
      <div className="w-full space-y-6 pb-12 font-sans text-slate-800 dark:text-slate-100 relative">
        {renderTabSwitcher()}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setSearchParams({ tab: "tata-kelola-sampah" });
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <ChevronLeft size={14} />
            <span>Kembali ke Ringkasan Tata Kelola Sampah</span>
          </button>
        </div>
        <TempatSampahAktifPage />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <span
            className="material-symbols-outlined text-emerald-600 text-[48px] animate-spin"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            autorenew
          </span>
          <p className="text-slate-400 font-medium text-xs tracking-wider uppercase">
            {getPortalLoadingText(user?.peran)}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="bg-rose-50 text-rose-700 p-6 rounded-2xl border border-rose-200 flex flex-col items-center gap-2">
          <AlertCircle size={32} />
          <p className="font-medium text-xs">{error}</p>
        </div>
      </div>
    );
  }

  // Flag penonaktifan tampilan Kepatuhan Real sementara
  const HIDE_KEPATUHAN_REAL = false;

  const validBaselines = kelurahanBaselineList.filter(
    (k) => k.hasBaseline && k.baselineRate !== null && k.baselineRate !== undefined
  );
  const avgBaseline =
    validBaselines.length > 0
      ? +(validBaselines.reduce((acc, curr) => acc + (curr.baselineRate || 0), 0) / validBaselines.length).toFixed(1)
      : 0;

  const validEndlines = kelurahanBaselineList.filter((k) => k.endlineRate > 0);

  // Rata-rata BERBOBOT terhadap jumlah pemilahan yang dinilai
  const totalDinilai = validEndlines.reduce((acc, curr) => acc + (curr.setoranDinilai || 0), 0);
  const totalPatuh = validEndlines.reduce((acc, curr) => acc + (curr.setoranPatuh || 0), 0);

  const avgEndline =
    totalDinilai > 0
      ? +((totalPatuh / totalDinilai) * 100).toFixed(1)
      : validEndlines.length > 0
      ? +(validEndlines.reduce((acc, curr) => acc + (curr.endlineRate || 0), 0) / validEndlines.length).toFixed(1)
      : 0;

  const validActiveBaselines = validEndlines.filter(
    (k) => k.hasBaseline && k.baselineRate !== null && k.baselineRate !== undefined
  );
  const avgBaselineActive =
    validActiveBaselines.length > 0
      ? +(validActiveBaselines.reduce((acc, curr) => acc + (curr.baselineRate || 0), 0) / validActiveBaselines.length).toFixed(1)
      : avgBaseline;

  const deltaBaseline = +(avgEndline - avgBaselineActive).toFixed(1);

  const totalCoblongVolumeKg = kelurahanBaselineList.reduce(
    (acc, curr) => acc + (Number(curr.totalKg) || 0),
    0
  );

  const parseKgValue = (val: any, fallback: number): number => {
    if (typeof val === "number" && !isNaN(val)) return val;
    if (typeof val === "string") {
      const match = val.match(/[\d.]+/);
      if (match) {
        const num = parseFloat(match[0]);
        if (!isNaN(num)) return num;
      }
    }
    return fallback;
  };

  void KpiCard;

  const rawOrg = parseKgValue(stats?.komposisiSampah?.organikKg, 0);
  const rawAnorg = parseKgValue(stats?.komposisiSampah?.anorganikKg, 0);

  return (
    <div className="w-full space-y-6 pb-12 text-slate-800 dark:text-slate-100 font-sans relative">
      {renderTabSwitcher()}

      {/* 1. Header Bar (Clean Multi-Tier Executive UI - Konsisten dengan Analisis Sistem) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
        {/* Top Tier: Title & Live Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#e5f7ed] dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 flex items-center justify-center shrink-0 border border-[#009966]/15 dark:border-emerald-700/30 shadow-2xs">
              <Recycle size={24} />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                Tata Kelola Sampah
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Dasbor pusat komando pemantauan pemilahan sampah cerdas, sektor kebersihan, dan pengelolaan residu wilayah percontohan Rukun Warga (RW).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center flex-wrap">
            <div className="flex items-center gap-2 px-3.5 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 font-semibold shadow-2xs shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
              <span>Terakhir diperbarui: {formattedLastUpdated}</span>
              {refreshing && (
                <RefreshCw size={13} className="animate-spin text-emerald-600 ml-1" />
              )}
            </div>
            <button
              type="button"
              onClick={() => fetchStats(false)}
              disabled={refreshing || loading}
              className="inline-flex items-center justify-center gap-2 px-4 h-10 bg-[#009966] hover:bg-[#008055] active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 select-none"
            >
              <RefreshCw size={15} className={refreshing || loading ? "animate-spin" : ""} />
              <span>Perbarui Data</span>
            </button>
          </div>
        </div>

        {/* Bottom Tier: Filter Controls & Action Button */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <CustomSelect
              value={
                isLurahRole
                  ? `Kel. ${userKelurahan.replace(/^Kel\.\s*/i, "") || "Cipaganti"}`
                  : selectedWilayah
              }
              onChange={(val) => {
                if (!isLurahRole) {
                  handleRegionChange(val);
                }
              }}
              options={
                isLurahRole
                  ? [
                      {
                        value: `Kel. ${userKelurahan.replace(/^Kel\.\s*/i, "") || "Cipaganti"}`,
                        label: `Kel. ${userKelurahan.replace(/^Kel\.\s*/i, "") || "Cipaganti"} (Terkunci - Wilayah Tugas)`,
                        sublabel: "Wilayah Administratif Tugas Lurah",
                      },
                    ]
                  : wilayahOptions
              }
              icon={<MapPin size={15} className="text-[#009966] flex-shrink-0" />}
              label="Wilayah:"
              variant="emerald"
              disabled={isLurahRole}
            />

            <CustomSelect
              value={timeFilter}
              onChange={(val) => {
                setTimeFilter(val);
                if (val !== "custom") {
                  setStartDate("");
                  setEndDate("");
                }
              }}
              options={PERIODE_OPTIONS}
              icon={<Calendar size={15} className="text-sky-600 flex-shrink-0" />}
              label="Periode:"
              variant="slate"
            />

            {timeFilter === "custom" && (
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3.5 h-10 rounded-xl border border-slate-200/90 dark:border-slate-700 shadow-2xs">
                <Calendar size={15} className="text-sky-600 shrink-0" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
                  title="Tanggal Mulai"
                />
                <span className="text-slate-400 text-xs font-bold">s/d</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
                  title="Tanggal Selesai"
                />
                {(startDate || endDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setStartDate("");
                      setEndDate("");
                    }}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-400 hover:text-slate-600 transition cursor-pointer"
                    title="Hapus Tanggal"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowComplianceModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 h-10 bg-[#009966] hover:bg-[#008055] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 ml-auto sm:ml-0 select-none"
          >
            <LineChart size={15} />
            <span>Indeks Kepatuhan</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Section (6 Cards for BERSEKA Domain) */}
      <div className="px-1 text-[10.5px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
        Ringkasan Operasional Pemilahan Sampah & Program KKN
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5 sm:gap-4 relative z-10">
        <KpiCard
          iconName="users"
          color="blue"
          label="Warga Pengelola Sampah"
          value={stats?.penggunaSampah?.value}
          trend={stats?.penggunaSampah?.trend}
          trendLabel={stats?.penggunaSampah?.trendLabel}
          trendUp={stats?.penggunaSampah?.trendUp}
          linkTo={undefined}
        />
        <KpiCard
          iconName="graduation-cap"
          color="indigo"
          label="Partisipan Mahasiswa KKN"
          value={stats?.partisipanKkn?.value}
          trend={stats?.partisipanKkn?.trend}
          trendLabel={stats?.partisipanKkn?.trendLabel}
          trendUp={stats?.partisipanKkn?.trendUp}
          linkTo={undefined}
        />
        <KpiCard
          iconName="delete"
          color="emerald"
          label="Tempat Sampah Teraktivasi"
          value={stats?.tempatSampahAktif?.value}
          trend={stats?.tempatSampahAktif?.trend}
          trendLabel={stats?.tempatSampahAktif?.trendLabel}
          trendUp={stats?.tempatSampahAktif?.trendUp}
          linkTo={undefined}
        />
        <KpiCard
          iconName="location_on"
          color="cyan"
          label="Rukun Warga Terdaftar"
          value={stats?.lokasiTerdaftar?.value}
          trend={stats?.lokasiTerdaftar?.trend}
          trendLabel={stats?.lokasiTerdaftar?.trendLabel}
          trendUp={stats?.lokasiTerdaftar?.trendUp}
          linkTo={undefined}
        />
        <KpiCard
          iconName="shopping_bag"
          color="amber"
          label={
            timeFilter === "custom" && startDate && endDate ? "Tonase Sampah Periode Ini" :
            timeFilter === "harian" ? "Tonase Sampah Hari Ini" :
            timeFilter === "mingguan" ? "Tonase Sampah Minggu Ini" :
            timeFilter === "bulanan" ? "Tonase Sampah Bulan Ini" :
            timeFilter === "tahunan" ? "Tonase Sampah Tahun Ini" :
            "Tonase Sampah Terpilah"
          }
          value={stats?.setoranHariIni?.value}
          trend={stats?.setoranHariIni?.trend}
          trendLabel={stats?.setoranHariIni?.trendLabel}
          trendUp={stats?.setoranHariIni?.trendUp}
          linkTo={undefined}
        />
        <KpiCard
          iconName="stars"
          color="yellow"
          label="Akumulasi Poin Reward"
          value={stats?.totalPoin?.value}
          trend={stats?.totalPoin?.trend}
          trendLabel={stats?.totalPoin?.trendLabel}
          trendUp={stats?.totalPoin?.trendUp}
          linkTo={undefined}
        />
      </div>

      {/* Evaluasi Kepatuhan Pemilahan & Kamus Definisi UI */}
      <ComplianceWidget
        wilayah={effectiveWilayah}
        onOpenDetail={handleOpenComplianceDetail}
        onMetricsLoaded={handleComplianceMetricsLoaded}
      />

      {/* 3. Charts & Komposisi Grid (2 Columns, 6 cols each) */}
      <div className="px-1 pt-2 text-[10.5px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
        Analisis Tren Pemilahan dan Komposisi Sampah
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        {/* Left Column (8 cols): Trend Pemilahan Chart Lebih Luas */}
        <WasteTrendChart
          className="lg:col-span-8"
          wilayah={effectiveWilayah}
          initialData={trendData}
          rawOrg={rawOrg}
          rawAnorg={rawAnorg}
        />

        {/* Right Column (4 cols): Komposisi Sampah Card Kompak & Fokus Nilai */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 shadow-xs rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between relative overflow-hidden">
          <div className="flex justify-between items-start mb-2 gap-2">
            <div>
              <h4 className="font-bold text-[18px] text-slate-900 dark:text-slate-100">Komposisi Sampah</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1 leading-snug">
                Akumulasi hasil pencatatan terhitung sejak pekan pertama Agustus 2026 hingga saat ini.
              </p>
            </div>
            <span className="text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700/40 px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0">
              Massa (kg)
            </span>
          </div>

          {(() => {
            const totalKg = rawOrg + rawAnorg;
            const pctOrg = totalKg > 0 ? Math.round((rawOrg / totalKg) * 100) : 0;
            const pctAnorg = totalKg > 0 ? 100 - pctOrg : 0;

            const c = 2 * Math.PI * 40;
            const valOrg = (pctOrg / 100) * c;
            const valAnorg = (pctAnorg / 100) * c;

            let dominantLabel = "Organik";
            let dominantPct = pctOrg;
            let dominantColor = "text-emerald-600 dark:text-emerald-400";

            if (pctAnorg > pctOrg) {
              dominantLabel = "Anorganik";
              dominantPct = pctAnorg;
              dominantColor = "text-amber-600 dark:text-amber-400";
            }

            return (
              <div className="flex-1 flex flex-col md:flex-row lg:flex-col items-center justify-between gap-4 md:gap-8 lg:gap-4 my-2">
                {/* Donut Chart Ringkas & Proporsional */}
                <div className="flex flex-col items-center justify-center shrink-0">
                  <div className="w-28 h-28 relative flex items-center justify-center my-1 group">
                    <svg className="w-28 h-28 transform -rotate-90">
                      <circle cx="56" cy="56" r="40" fill="transparent" stroke="#f1f5f9" className="dark:stroke-slate-800" strokeWidth="10" />
                      {pctOrg > 0 && (
                        <circle
                          cx="56"
                          cy="56"
                          r="40"
                          fill="transparent"
                          stroke="#34d399"
                          strokeWidth="10"
                          strokeDasharray={`${valOrg} ${c}`}
                          strokeDashoffset={0}
                          className="transition-all duration-500 hover:stroke-[12]"
                        />
                      )}
                      {pctAnorg > 0 && (
                        <circle
                          cx="56"
                          cy="56"
                          r="40"
                          fill="transparent"
                          stroke="#fbbf24"
                          strokeWidth="10"
                          strokeDasharray={`${valAnorg} ${c}`}
                          strokeDashoffset={-valOrg}
                          className="transition-all duration-500 hover:stroke-[12]"
                        />
                      )}
                    </svg>
                    <div className="absolute text-center flex flex-col items-center justify-center pointer-events-none">
                      <span className={`block text-xl font-black leading-none ${dominantColor}`}>
                        {dominantPct}%
                      </span>
                      <span className="text-[9px] text-slate-400 uppercase font-extrabold tracking-wider mt-0.5 block">
                        {dominantLabel}
                      </span>
                    </div>
                  </div>

                  {/* Angka Total Akumulasi Terpilah */}
                  <div className="text-center mt-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Total Sampah Terpilah
                    </span>
                    <span className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono">
                      {totalKg.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg
                    </span>
                  </div>
                </div>

                {/* Penekanan Informasi pada Angka & Nilai Komposisi (Legend Ringkas tanpa Redundansi Bar) */}
                <div className="w-full space-y-2.5 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex-1">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1.5 font-extrabold text-slate-700 dark:text-slate-200">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#34d399] shadow-[0_0_8px_#34d399] inline-block"></span>
                      Organik
                    </div>
                    <div className="font-mono font-bold text-slate-800 dark:text-slate-100">
                      {rawOrg.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg{" "}
                      <span className="text-emerald-600 dark:text-emerald-400 font-extrabold ml-1">({pctOrg}%)</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60">
                    <div className="flex items-center gap-1.5 font-extrabold text-slate-700 dark:text-slate-200">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#fbbf24] shadow-[0_0_8px_#fbbf24] inline-block"></span>
                      Anorganik
                    </div>
                    <div className="font-mono font-bold text-slate-800 dark:text-slate-100">
                      {rawAnorg.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg{" "}
                      <span className="text-amber-600 dark:text-amber-400 font-extrabold ml-1">({pctAnorg}%)</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* 3.6 Seksi Baseline Data Hasil Survei Pemilahan Sampah (Statis & Terisolasi) */}
      <BaselineSection />

      {/* 3.7 Seksi Evaluasi Komparatif Dampak Sampah: Tabel Rekapitulasi (Atas) & Visualisasi Tren (Bawah) */}
      <div className="space-y-6 relative z-10">
        <WasteImpactSummaryTable
          data={wasteImpactItems}
          loading={loading || refreshing}
          onSourceChange={(src) => setSelectedWasteSource(src)}
        />
        <WasteImpactTrendChart
          data={wasteImpactItems}
          selectedSource={selectedWasteSource}
          loading={loading || refreshing}
          onRefresh={() => fetchStats(false)}
          lastUpdated={formattedLastUpdated}
        />
      </div>

      {/* === Monitoring Leaderboard Section === */}
      <div className="w-full relative z-10">
        <LeaderboardWidget mode="sampah" />
      </div>

      {/* === Central Operational Lists & Activity === */}
      <div className="px-1 pt-2 text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
        Data Operasional Tempat Sampah
      </div>
      <div className="w-full relative z-10">
        {/* Data Tempat Sampah Terbaru */}
        <div className="w-full bg-white dark:bg-slate-900 shadow-xs rounded-2xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Trash2 size={18} />
              </div>
              <div>
                <h4 className="font-extrabold text-[16px] text-slate-900 dark:text-slate-100 tracking-tight">
                  Data Tempat Sampah Terbaru
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  Pemantauan kapasitas waktu nyata dan status aktivasi QR tempat sampah
                </p>
              </div>
            </div>
            <Link
              to="/dasbor?tab=tata-kelola-sampah&view=bins"
              onClick={() => {
                setSearchParams({ tab: "tata-kelola-sampah", view: "bins" });
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 px-3.5 py-2 rounded-xl border border-emerald-500/20"
            >
              Lihat Tempat Sampah Teraktivasi <ChevronRight size={14} />
            </Link>
          </div>

          <div className="overflow-x-auto min-h-[260px] rounded-xl border border-slate-200/80 dark:border-slate-800">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60">
                  <th className="py-3 px-4">ID &amp; Jenis Tempat Sampah</th>
                  <th className="py-3 px-4">Wilayah &amp; Pemilik</th>
                  <th className="py-3 px-4 min-w-[140px]">Kapasitas Terisi</th>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800 text-xs">
                {recentBins.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-500 dark:text-slate-400 font-medium">
                      Belum ada data tempat sampah terdaftar.
                    </td>
                  </tr>
                ) : (
                  recentBins.map((bin, i) => {
                    const maxCapacityLiter = Number(bin.maxCapacityLiter);
                    const currentVolumeLiter = Number(bin.currentVolumeLiter) || 0;
                    const cap = Math.min(100, Math.round(
                      bin.kapasitas != null
                        ? bin.kapasitas
                        : maxCapacityLiter > 0
                        ? (currentVolumeLiter / maxCapacityLiter) * 100
                        : 0
                    ));
                    const categoryStr = String(bin.category?.name || bin.categoryId || "UMUM").toUpperCase();
                    const isOrganik = categoryStr.includes("ORGANIK") && !categoryStr.includes("ANORGANIK") && !categoryStr.includes("NON");
                    const isAnorganik = categoryStr.includes("ANORGANIK") || categoryStr.includes("NON");

                    const isHighCap = cap >= 90;

                    return (
                      <tr
                        key={bin.id || bin.kode || i}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="flex flex-col">
                              <span className="font-mono font-black text-slate-900 dark:text-slate-100 text-[13px] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                {bin.qrCode || bin.kode || (bin.id ? bin.id.substring(0, 8) : "BIN")}
                              </span>
                              <div className="flex items-center gap-1 mt-1">
                                {isOrganik ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-700/40">
                                    <Leaf size={11} /> Organik
                                  </span>
                                ) : isAnorganik ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-700/40">
                                    <Recycle size={11} /> Anorganik
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                    {bin.category?.name || bin.categoryId || "Umum"}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-col min-w-[150px]">
                            <span className="font-bold text-slate-800 dark:text-slate-200 text-[12.5px]">
                              {(() => {
                                const kelName = typeof bin.kelurahan === "string" ? bin.kelurahan : bin.kelurahan?.name || bin.rtRw?.kelurahan?.name || "Wilayah Dampingan";
                                const rwRaw = typeof bin.rw === "string" ? bin.rw : bin.rw?.name || (typeof bin.rtRw === "string" ? bin.rtRw : bin.rtRw?.name);
                                const rwText = rwRaw && rwRaw !== "-" && rwRaw !== "Belum Terikat" && !rwRaw.startsWith("ID RT/RW:")
                                  ? (rwRaw.toLowerCase().includes("rw") ? rwRaw : `RW ${rwRaw}`)
                                  : "";
                                return rwText ? `${kelName} • ${rwText}` : kelName;
                              })()}
                            </span>
                            <span className="text-[11px] font-medium mt-0.5">
                              {(() => {
                                const isKomunal = (bin.tipeKepemilikan || "").toUpperCase() === "KOMUNAL_RW";
                                const ownerName = bin.wargaName || bin.user?.name;
                                if (isKomunal) {
                                  return (
                                    <span className="text-purple-600 dark:text-purple-400 font-semibold">
                                      Komunal RW (Fasilitas Umum)
                                    </span>
                                  );
                                }
                                if (ownerName) {
                                  return (
                                    <span className="text-emerald-700 dark:text-emerald-400 font-medium truncate max-w-[200px]" title={`Warga Mandiri: ${ownerName}`}>
                                      Warga Mandiri ({ownerName})
                                    </span>
                                  );
                                }
                                return (
                                  <span className="text-slate-400 dark:text-slate-500 italic">
                                    Warga Mandiri (Belum Terikat)
                                  </span>
                                );
                              })()}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between items-center text-[10.5px]">
                              <span className={isHighCap ? "text-rose-600 dark:text-rose-400 font-black" : "text-emerald-700 dark:text-emerald-400 font-extrabold"}>
                                {isHighCap ? `${cap}% (Penuh)` : `${cap}% (Aman)`}
                              </span>
                              <span className="font-mono text-slate-500 dark:text-slate-400 text-[10.5px]">
                                {currentVolumeLiter} / {maxCapacityLiter} Liter
                              </span>
                            </div>
                            <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/70 dark:border-slate-700">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isHighCap ? "bg-rose-500 animate-pulse" : "bg-emerald-500"
                                }`}
                                style={{ width: `${cap}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {(() => {
                            const rawDate = bin.updatedAt || bin.createdAt || bin.verifiedAt;
                            if (!rawDate) {
                              return <span className="text-slate-400 dark:text-slate-500 italic text-[11px]">-</span>;
                            }
                            try {
                              const d = new Date(rawDate);
                              if (isNaN(d.getTime())) {
                                return (
                                  <span className="text-slate-600 dark:text-slate-400 text-[11px] font-medium">
                                    {bin.verifiedAt || bin.lastUpdate || "-"}
                                  </span>
                                );
                              }
                              const months = [
                                "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
                                "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
                              ];
                              const dateFormatted = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
                              const timeFormatted = `${String(d.getHours()).padStart(2, "0")}.${String(d.getMinutes()).padStart(2, "0")} WIB`;
                              return (
                                <div className="flex flex-col min-w-[105px]">
                                  <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 text-[12px]">
                                    <Calendar size={12} className="text-slate-400 shrink-0" />
                                    <span>{dateFormatted}</span>
                                  </div>
                                  <span className="text-[10.5px] text-slate-400 dark:text-slate-500 pl-4 font-mono">
                                    {timeFormatted}
                                  </span>
                                </div>
                              );
                            } catch {
                              return <span className="text-slate-400 text-[11px]">-</span>;
                            }
                          })()}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex justify-end items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedBinForDetail(bin)}
                              className="w-8 h-8 inline-flex items-center justify-center text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-xl transition-all cursor-pointer"
                              title="Rincian Tempat Sampah"
                            >
                              <Eye size={15} />
                            </button>
                            {isSuperOrDev && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => navigate(`/monitoring-pengelolaan/tempat-sampah?edit=${bin.id || bin.kode}`)}
                                  className="w-8 h-8 inline-flex items-center justify-center text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/60 rounded-xl transition-all cursor-pointer"
                                  title="Ubah Tempat Sampah"
                                >
                                  <Pencil size={15} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteBinConfirm(bin)}
                                  className="w-8 h-8 inline-flex items-center justify-center text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-xl transition-all cursor-pointer"
                                  title="Hapus Tempat Sampah"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Compliance List Modal */}
      {showComplianceModal && (
        <ComplianceModal
          locations={locations}
          onClose={() => setShowComplianceModal(false)}
          organikRate={
            complianceWidgetMetrics?.wadahOrganik?.kesesuaianPersen ??
            stats?.kepatuhanPemilahan?.organikRate
          }
          anorganikRate={
            complianceWidgetMetrics?.wadahAnorganik?.kesesuaianPersen ??
            stats?.kepatuhanPemilahan?.anorganikRate
          }
        />
      )}



      {/* Detail Bin Modal */}
      {selectedBinForDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150 text-slate-800 dark:text-slate-100">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Rincian Tempat Sampah Cerdas</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Kode identifikasi dan data pemantauan waktu nyata</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBinForDetail(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Tutup dialog"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 sm:p-6 space-y-5">
              <div className="flex justify-center">
                <div className="p-4 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center gap-2">
                  <img
                    className="w-40 h-40"
                    alt="QR Code"
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(selectedBinForDetail.qrCode || selectedBinForDetail.kode)}`}
                  />
                  <span className="text-sm font-mono font-bold text-slate-900 dark:text-slate-100 tracking-wider">
                    {selectedBinForDetail.qrCode || selectedBinForDetail.kode}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-800 text-sm">
                  <span className="text-slate-400">Kategori Sampah</span>
                  <span
                    className={`font-bold uppercase ${(selectedBinForDetail.category?.name || selectedBinForDetail.categoryId || "")
                        .toUpperCase()
                        .includes("ORGANIK")
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-cyan-600 dark:text-cyan-400"
                      }`}
                  >
                    {selectedBinForDetail.category?.name || selectedBinForDetail.categoryId}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-800 text-sm">
                  <span className="text-slate-400">Wilayah (Rukun Warga)</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {(() => {
                      const rwVal = typeof selectedBinForDetail.rw === "string"
                        ? selectedBinForDetail.rw
                        : selectedBinForDetail.rw?.name || (typeof selectedBinForDetail.rtRw === "string" ? selectedBinForDetail.rtRw : selectedBinForDetail.rtRw?.name);
                      return rwVal && rwVal !== "-" ? rwVal : "-";
                    })()}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-800 text-sm">
                  <span className="text-slate-400">Tipe Kepemilikan</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {(selectedBinForDetail.tipeKepemilikan || "").toUpperCase() === "KOMUNAL_RW"
                      ? "Komunal RW (Fasilitas Umum)"
                      : "Rumah Tangga (Warga Mandiri)"}
                  </span>
                </div>
                {(selectedBinForDetail.wargaName || selectedBinForDetail.user?.name) && (
                  <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-800 text-sm">
                    <span className="text-slate-400">Pemilik (Warga)</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {selectedBinForDetail.wargaName || selectedBinForDetail.user?.name}
                    </span>
                  </div>
                )}
                {(() => {
                  const maxCapacityLiter = Number(selectedBinForDetail.maxCapacityLiter);
                  const hasCapacityData =
                    selectedBinForDetail.kapasitas != null || maxCapacityLiter > 0;
                  if (!hasCapacityData) return null;
                  const capPct = Math.min(
                    100,
                    Math.round(
                      selectedBinForDetail.kapasitas != null
                        ? selectedBinForDetail.kapasitas
                        : (Number(selectedBinForDetail.currentVolumeLiter) / maxCapacityLiter) * 100
                    )
                  );
                  return (
                    <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-800 text-sm">
                      <span className="text-slate-400">Status Kapasitas</span>
                      <span className={`font-bold ${capPct >= 90 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                        {capPct}% {capPct >= 90 ? "Penuh" : "Tersedia"}
                        {maxCapacityLiter > 0 && (
                          <span className="text-slate-400 font-medium">
                            {" "}({Number(selectedBinForDetail.currentVolumeLiter) || 0}L / {maxCapacityLiter}L)
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })()}
                {(() => {
                  const rawDate = selectedBinForDetail.updatedAt || selectedBinForDetail.createdAt || selectedBinForDetail.verifiedAt;
                  if (!rawDate) return null;
                  let displayTime = selectedBinForDetail.verifiedAt || selectedBinForDetail.lastUpdate || "-";
                  try {
                    const d = new Date(rawDate);
                    if (!isNaN(d.getTime())) {
                      const months = [
                        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
                        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
                      ];
                      displayTime = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} • ${String(d.getHours()).padStart(2, "0")}.${String(d.getMinutes()).padStart(2, "0")} WIB`;
                    }
                  } catch {
                    // fallback
                  }
                  return (
                    <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-800 text-sm">
                      <span className="text-slate-400">Waktu Aktivasi / Pembaruan</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {displayTime}
                      </span>
                    </div>
                  );
                })()}
                <div className="flex justify-between items-center py-2 text-sm">
                  <span className="text-slate-400">Poin Pemilahan</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {selectedBinForDetail.category?.pointsPerKg || 100} Poin / kg
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedBinForDetail(null)}
                className="w-full py-2.5 bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 transition cursor-pointer"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteBinConfirm}
        onClose={() => setDeleteBinConfirm(null)}
        onConfirm={handleConfirmDeleteBin}
        title="Hapus Tempat Sampah"
        message={`Apakah Anda yakin ingin menghapus tempat sampah ${deleteBinConfirm?.qrCode || deleteBinConfirm?.kode || ""}?`}
        confirmText="Ya, Hapus"
        type="danger"
      />
    </div>
  );
};

export default Dashboard;
