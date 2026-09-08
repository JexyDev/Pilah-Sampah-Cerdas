/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Sub-Dashboard: Eksekutif KKN Pimpinan
 * 100% Real-Time Aggregation dari PostgreSQL Backend
 * Sesuai Acuan Visual Pimpinan (Rektor / Eksekutif)
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  MapPin,
  Users,
  User,
  GraduationCap,
  TrendingUp,
  Calendar,
  Layers,
  Download,
  FileText,
  FileCheck2,
  UserCheck,
  Activity,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  Clock,
  CheckCircle2,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { useNavigate, Link } from "react-router-dom";
import {
  Search,
  X,
  Crown,
  ChevronLeft,
  FileCheck,
} from "lucide-react";
import api from "../../services/api";
import showToast from "../../utils/showToast";
import { dplService, type GroupSummary, type StudentDetail } from "../../services/dplService";

interface KknExecutiveData {
  lastUpdated: string;
  summary: {
    totalWilayah: { kelurahanCount: number; rwCount: number; label: string };
    totalKelompok: { count: number; label: string };
    totalMahasiswa: { count: number; label: string };
    totalDpl: { count: number; label: string };
    rasioKehadiran: {
      percentage: number;
      totalHours: number;
      targetHours: number;
      remainingHours: number;
      label: string;
      sublabel: string;
    };
  };
  sebaranProdi: Array<{ name: string; count: number }>;
  distribusiSks: {
    totalMahasiswa: number;
    breakdown: Array<{
      sks: number;
      label: string;
      count: number;
      percentage: number;
      color: string;
    }>;
  };
  sebaranMahasiswaPerWilayah: Array<{ kelurahan: string; count: number }>;
  sebaranDplPerWilayah: Array<{ kelurahan: string; count: number }>;
  statusProker: {
    total: number;
    diusulkan: { count: number; percentage: number };
    disetujui: { count: number; percentage: number };
    sedangDilaksanakan: { count: number; percentage: number };
    selesai: { count: number; percentage: number };
  };
  presensiMahasiswa: {
    percentageHadir: number;
    breakdown: Array<{
      label: string;
      count: number;
      percentage: number;
      color: string;
    }>;
  };
  rasioKehadiranTrend: {
    currentAvgHours: number;
    targetHours: number;
    percentage: number;
    remainingHours: number;
    weeklyTrends: Array<{ week: string; avgHours: number; target: number }>;
  };
  aktivitasTerkini: {
    totalLogMahasiswa: number;
    totalLogDpl: number;
    chartData: Array<{ date: string; mahasiswa: number; dpl: number }>;
  };
  liniMasaTerkini: Array<{
    id: string;
    title: string;
    dateRange: string;
    status: string;
    badgeType: string;
  }>;
  perhatianPimpinan: Array<{
    id: string;
    count: number;
    title: string;
    type: string;
    link: string;
  }>;
  filterOptions: {
    periodeOptions: Array<{ value: string; label: string }>;
    kelurahanOptions: Array<{ value: string; label: string }>;
    selectedKelurahan: string;
    selectedRw: string;
    selectedPeriode: string;
  };
}

// Helper untuk pewarnaan angka kehadiran sesuai acuan:
// > 80 - 100 = Hijau
// 70 - 80 (atau 60 - 80) = Biru
// 50 - 70 = Kuning
// < 50 = Merah
const getAttendanceBadgeClass = (rate: number) => {
  const val = Number(rate) || 0;
  if (val > 80) {
    return {
      badge: "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200/80 dark:border-emerald-700/40",
      text: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-100 dark:border-emerald-800/40",
    };
  }
  if (val > 70) {
    return {
      badge: "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border-blue-200/80 dark:border-blue-700/40",
      text: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/60 border-blue-100 dark:border-blue-800/40",
    };
  }
  if (val >= 50) {
    return {
      badge: "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-200/80 dark:border-amber-700/40",
      text: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/60 border-amber-100 dark:border-amber-800/40",
    };
  }
  return {
    badge: "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border-rose-200/80 dark:border-rose-700/40",
    text: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/60 border-rose-100 dark:border-rose-800/40",
  };
};

export const DashboardEksekutifKkn: React.FC = () => {
  const navigate = useNavigate();

  // Filter states
  const [selectedPeriode, setSelectedPeriode] = useState("2026");
  const [selectedKelurahan, setSelectedKelurahan] = useState("Semua Kelurahan");
  const [selectedRw, setSelectedRw] = useState("Semua RW");

  // Data & loading states
  const [data, setData] = useState<KknExecutiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Master RW List dari API Area
  const [masterRwList, setMasterRwList] = useState<Array<{ id: number; name: string; kelurahanName: string }>>([]);

  // Kelompok KKN & Mahasiswa List untuk Section Daftar Kelompok & DPL Pengampu
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [students, setStudents] = useState<StudentDetail[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  // Modal Detail Anggota Kelompok
  const [selectedGroupForDetail, setSelectedGroupForDetail] = useState<GroupSummary | null>(null);
  const [groupStudentSearchQuery, setGroupStudentSearchQuery] = useState("");
  const [groupStudentPage, setGroupStudentPage] = useState(1);
  const MODAL_STUDENTS_PER_PAGE = 8;

  // Ambil data master RW dari /areas/rw
  useEffect(() => {
    const fetchMasterRw = async () => {
      try {
        const res = await api.get("/areas/rw");
        if (res.data?.success && Array.isArray(res.data?.data)) {
          const mapped = res.data.data.map((r: any) => ({
            id: r.id,
            name: r.name,
            kelurahanName: r.kelurahan?.name || "",
          }));
          setMasterRwList(mapped);
        }
      } catch (err) {
        console.error("Gagal memuat master RW:", err);
      }
    };
    fetchMasterRw();
  }, []);

  // Filter RW dinamis: Hanya tampilkan opsi RW jika kelurahan spesifik telah dipilih
  const isKelurahanSelected = Boolean(
    selectedKelurahan &&
    selectedKelurahan !== "Semua Kelurahan" &&
    selectedKelurahan !== "ALL"
  );

  const rwOptions = useMemo(() => {
    if (!isKelurahanSelected || !masterRwList || masterRwList.length === 0) {
      return ["Semua RW"];
    }

    const targetKel = selectedKelurahan.toLowerCase().replace(/\s+/g, "");
    const filtered = masterRwList.filter((r) => {
      const kName = (r.kelurahanName || "").toLowerCase().replace(/\s+/g, "");
      return kName.includes(targetKel) || targetKel.includes(kName);
    });

    // Ekstrak nomor RW, filter data dummy/test (seperti 99), dan standardisasi jadi "RW XX" yang seragam
    const rwMap = new Map<number, string>();
    filtered.forEach((r) => {
      const num = parseInt(r.name.replace(/\D/g, ""), 10);
      if (!isNaN(num) && num > 0 && num < 90) {
        // Abaikan nomor test / dummy seperti RW 99
        const standardLabel = `RW ${String(num).padStart(2, "0")}`;
        rwMap.set(num, standardLabel);
      }
    });

    const sortedRw = Array.from(rwMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([, label]) => label);

    return ["Semua RW", ...sortedRw];
  }, [masterRwList, selectedKelurahan, isKelurahanSelected]);

  // Reset selectedRw jika RW terpilih tidak valid untuk kelurahan baru, atau jika kembali ke "Semua Kelurahan"
  useEffect(() => {
    if (selectedKelurahan === "Semua Kelurahan" || selectedKelurahan === "ALL") {
      setSelectedRw("Semua RW");
    } else if (selectedRw !== "Semua RW" && !rwOptions.includes(selectedRw)) {
      setSelectedRw("Semua RW");
    }
  }, [selectedKelurahan, rwOptions, selectedRw]);

  const fetchData = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const params: Record<string, string> = {};
      if (selectedPeriode && selectedPeriode !== "ALL") params.periode = selectedPeriode;
      if (selectedKelurahan && selectedKelurahan !== "Semua Kelurahan" && selectedKelurahan !== "ALL") {
        params.kelurahan = selectedKelurahan;
      }
      if (selectedRw && selectedRw !== "Semua RW" && selectedRw !== "ALL") {
        params.rw = selectedRw;
      }

      const res = await api.get("/dashboard/kkn-executive", { params });
      if (res.data?.success && res.data?.data) {
        setData(res.data.data);
      }
    } catch (err: any) {
      console.error("Gagal memuat Dashboard Eksekutif KKN:", err);
      showToast.error(err.response?.data?.message || "Gagal memuat data Dashboard Eksekutif KKN");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Muat data kelompok binaan KKN & mahasiswa untuk kartu overview
  useEffect(() => {
    const fetchGroupsData = async () => {
      try {
        setLoadingGroups(true);
        const [groupsData, studentsData] = await Promise.all([
          dplService.getGroupSummary(),
          dplService.getStudents().catch(() => []),
        ]);
        setGroups(groupsData || []);
        if (studentsData && studentsData.length > 0) {
          setStudents(studentsData);
        }
      } catch (err) {
        console.warn("Gagal memuat ringkasan kelompok KKN:", err);
      } finally {
        setLoadingGroups(false);
      }
    };
    fetchGroupsData();
  }, []);

  // Filter kelompok berdasarkan filter kelurahan aktif jika dipilih
  const filteredGroups = useMemo(() => {
    if (!groups || groups.length === 0) return [];
    if (!selectedKelurahan || selectedKelurahan === "Semua Kelurahan" || selectedKelurahan === "ALL") {
      return groups;
    }
    const cleanKel = selectedKelurahan.toLowerCase().replace(/\s+/g, "");
    return groups.filter((g) => {
      const gKel = (g.kelurahan || "").toLowerCase().replace(/\s+/g, "");
      return gKel.includes(cleanKel) || cleanKel.includes(gKel);
    });
  }, [groups, selectedKelurahan]);

  // Filter mahasiswa untuk modal detail anggota kelompok
  const modalGroupStudents = useMemo(() => {
    if (!selectedGroupForDetail) return [];
    return students.filter(
      (s) =>
        s.kelompokId === selectedGroupForDetail.id ||
        s.kelompokName === selectedGroupForDetail.name ||
        (s.kelompokName || "").toLowerCase().trim() === (selectedGroupForDetail.name || "").toLowerCase().trim()
    );
  }, [selectedGroupForDetail, students]);

  const filteredModalGroupStudents = useMemo(() => {
    if (!groupStudentSearchQuery.trim()) return modalGroupStudents;
    const q = groupStudentSearchQuery.toLowerCase();
    return modalGroupStudents.filter(
      (s) =>
        (s?.name ?? "").toLowerCase().includes(q) ||
        (s?.nim ?? "").toLowerCase().includes(q) ||
        (s?.jurusan ?? "").toLowerCase().includes(q) ||
        (s?.fakultas ?? "").toLowerCase().includes(q) ||
        (s?.kelompokName ?? "").toLowerCase().includes(q)
    );
  }, [modalGroupStudents, groupStudentSearchQuery]);

  const totalModalStudentPages = Math.max(1, Math.ceil(filteredModalGroupStudents.length / MODAL_STUDENTS_PER_PAGE));
  const paginatedModalGroupStudents = useMemo(() => {
    const start = (groupStudentPage - 1) * MODAL_STUDENTS_PER_PAGE;
    return filteredModalGroupStudents.slice(start, start + MODAL_STUDENTS_PER_PAGE);
  }, [filteredModalGroupStudents, groupStudentPage]);

  useEffect(() => {
    fetchData();
  }, [selectedPeriode, selectedKelurahan, selectedRw]);

  // Periodic auto-refresh every 60 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      fetchData(true);
    }, 60000);
    return () => clearInterval(timer);
  }, [selectedPeriode, selectedKelurahan, selectedRw]);

  // Handle Export Excel
  const handleExport = async () => {
    try {
      setDownloading(true);
      const params: Record<string, string> = {};
      if (selectedPeriode) params.periode = selectedPeriode;
      if (selectedKelurahan && selectedKelurahan !== "Semua Kelurahan") params.kelurahan = selectedKelurahan;
      if (selectedRw && selectedRw !== "Semua RW") params.rw = selectedRw;

      const res = await api.get("/dashboard/kkn-executive/export", {
        params,
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Laporan_Eksekutif_KKN_${selectedPeriode}_${Date.now()}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast.success("Laporan Eksekutif KKN berhasil diunduh!");
    } catch (err: any) {
      console.error("Export error:", err);
      showToast.error("Gagal mengunduh laporan eksekutif KKN");
    } finally {
      setDownloading(false);
    }
  };

  // Format date WIB
  const formattedLastUpdated = useMemo(() => {
    if (!data?.lastUpdated) {
      return "8 September 2026 • 10.30 WIB";
    }
    const d = new Date(data.lastUpdated);
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
  }, [data?.lastUpdated]);

  // Sebaran Mahasiswa per Wilayah dengan Indeks Angka (1-6) agar label X-Axis tidak menumpuk
  const sebaranMahasiswaIndexedData = useMemo(() => {
    return (data?.sebaranMahasiswaPerWilayah || []).map((item, idx) => ({
      ...item,
      wilayahNo: String(idx + 1),
    }));
  }, [data?.sebaranMahasiswaPerWilayah]);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] w-full gap-3 py-16">
        <div className="w-10 h-10 border-3 border-emerald-600/20 border-t-emerald-600 rounded-full animate-spin" />
        <span className="text-xs font-bold text-slate-500 tracking-wide uppercase">
          Memuat Dashboard Eksekutif KKN...
        </span>
      </div>
    );
  }

  const summary = data?.summary || {
    totalWilayah: { kelurahanCount: 0, rwCount: 0, label: "0 Kelurahan • 0 RW" },
    totalKelompok: { count: 0, label: "0 Kelompok" },
    totalMahasiswa: { count: 0, label: "0 Orang" },
    totalDpl: { count: 0, label: "0 Dosen" },
    rasioKehadiran: {
      percentage: 0,
      totalHours: 0,
      targetHours: 200,
      remainingHours: 200,
      label: "0%",
      sublabel: "0 dari target 200 jam",
    },
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* ========================================================================= */}
      {/* 1. HEADER SECTION                                                         */}
      {/* ========================================================================= */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[26px] font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Dashboard Eksekutif KKN
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Ringkasan strategis pelaksanaan KKN secara real-time
          </p>
        </div>

        {/* Action & Filter Controls */}
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {/* Periode Dropdown */}
            <div className="relative">
              <div className="flex items-center gap-2 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs">
                <Calendar size={14} className="text-blue-500 shrink-0" />
                <select
                  value={selectedPeriode}
                  onChange={(e) => setSelectedPeriode(e.target.value)}
                  aria-label="Filter Periode KKN"
                  className="bg-transparent outline-none cursor-pointer pr-2 text-xs font-bold text-slate-700 dark:text-slate-200"
                >
                  <option value="2026">Periode KKN 2026</option>
                  <option value="ALL">Semua Periode</option>
                </select>
              </div>
            </div>

            {/* Kelurahan Dropdown */}
            <div className="relative">
              <div className="flex items-center gap-2 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs">
                <MapPin size={14} className="text-emerald-600 shrink-0" />
                <select
                  value={selectedKelurahan}
                  onChange={(e) => {
                    setSelectedKelurahan(e.target.value);
                    setSelectedRw("Semua RW");
                  }}
                  aria-label="Filter Kelurahan"
                  className="bg-transparent outline-none cursor-pointer pr-2 text-xs font-bold text-slate-700 dark:text-slate-200"
                >
                  <option value="Semua Kelurahan">Semua Kelurahan</option>
                  <option value="Cipaganti">Kel. Cipaganti</option>
                  <option value="Dago">Kel. Dago</option>
                  <option value="Lebakgede">Kel. Lebakgede</option>
                  <option value="Lebak Siliwangi">Kel. Lebak Siliwangi</option>
                  <option value="Sadang Serang">Kel. Sadang Serang</option>
                  <option value="Sekeloa">Kel. Sekeloa</option>
                </select>
              </div>
            </div>

            {/* RW Dropdown (Hanya aktif jika kelurahan spesifik dipilih) */}
            <div className="relative">
              <div
                className={`flex items-center gap-2 border px-3 py-2 rounded-xl text-xs font-semibold shadow-2xs transition-all ${
                  isKelurahanSelected
                    ? "bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                    : "bg-slate-100/80 dark:bg-slate-800/50 border-slate-200/60 dark:border-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                }`}
              >
                <Layers
                  size={14}
                  className={`shrink-0 ${isKelurahanSelected ? "text-blue-500" : "text-slate-400 dark:text-slate-600"}`}
                />
                <select
                  value={selectedRw}
                  onChange={(e) => setSelectedRw(e.target.value)}
                  disabled={!isKelurahanSelected}
                  aria-label="Filter Rukun Warga"
                  title={!isKelurahanSelected ? "Pilih kelurahan terlebih dahulu untuk memfilter RW" : "Pilih RW"}
                  className="bg-transparent outline-none pr-2 text-xs font-bold disabled:cursor-not-allowed"
                >
                  {!isKelurahanSelected ? (
                    <option value="Semua RW">Semua RW (Pilih Kelurahan Dulu)</option>
                  ) : (
                    rwOptions.map((rw) => (
                      <option key={rw} value={rw}>
                        {rw}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* Unduh Laporan Button */}
            <button
              onClick={handleExport}
              disabled={downloading}
              className="flex items-center gap-2 bg-[#009966] hover:bg-[#008055] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs hover:shadow transition cursor-pointer disabled:opacity-50"
            >
              <Download size={14} />
              <span>{downloading ? "Mengunduh..." : "Unduh Laporan"}</span>
            </button>
          </div>

          {/* Real-time Indicator */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
            <span>Terakhir diperbarui: {formattedLastUpdated}</span>
            {refreshing && (
              <RefreshCw size={11} className="animate-spin text-emerald-600 ml-1" />
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TOP 5 KPI / STAT CARDS                                                  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Card 1: Jumlah Wilayah */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-800/40">
            <MapPin size={20} className="text-[#009966] dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-[11.5px] font-semibold text-slate-400 dark:text-slate-400">
              Jumlah Wilayah
            </p>
            <p className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5 tracking-tight">
              {summary.totalWilayah.label}
            </p>
          </div>
        </div>

        {/* Card 2: Total Semua Kelompok Mahasiswa */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-800/40">
            <Users size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-[11.5px] font-semibold text-slate-400 dark:text-slate-400">
              Total Semua Kelompok
            </p>
            <p className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5 tracking-tight">
              {summary.totalKelompok.label}
            </p>
          </div>
        </div>

        {/* Card 3: Total Mahasiswa */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-800/40">
            <User size={20} className="text-[#009966] dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-[11.5px] font-semibold text-slate-400 dark:text-slate-400">
              Total Mahasiswa
            </p>
            <p className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5 tracking-tight">
              {summary.totalMahasiswa.label}
            </p>
          </div>
        </div>

        {/* Card 4: Total DPL */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-800/40">
            <GraduationCap size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-[11.5px] font-semibold text-slate-400 dark:text-slate-400">
              Total DPL
            </p>
            <p className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5 tracking-tight">
              {summary.totalDpl.label}
            </p>
          </div>
        </div>

        {/* Card 5: Rasio Kehadiran */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-800/40">
            <TrendingUp size={20} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-[11.5px] font-semibold text-slate-400 dark:text-slate-400">
              Rasio Kehadiran
            </p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {summary.rasioKehadiran.label}
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-400 font-normal">
                {summary.rasioKehadiran.sublabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. ROW 2 - 4 CHARTS                                                       */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Col 1: Sebaran Program Studi Mahasiswa (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap size={16} className="text-[#009966] dark:text-emerald-400" />
            <h2 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
              Sebaran Program Studi Mahasiswa
            </h2>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={data?.sebaranProdi || []}
                margin={{ top: 5, right: 30, left: 10, bottom: 20 }}
              >
                <XAxis
                  type="number"
                  domain={[0, 150]}
                  ticks={[0, 50, 100, 150]}
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "#475569" }}
                  width={125}
                  tickLine={false}
                  axisLine={false}
                />
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white text-[11px] font-bold py-1 px-2.5 rounded-lg shadow">
                          <span>{d.name}: </span>
                          <span className="text-emerald-400 font-extrabold">{d.count} Mahasiswa</span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="#009966"
                  radius={[0, 4, 4, 0]}
                  barSize={12}
                  label={{
                    position: "right",
                    fontSize: 10,
                    fontWeight: 700,
                    fill: "#334155",
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center text-[10.5px] text-slate-400 font-medium mt-1">
            Jumlah Mahasiswa
          </p>
        </div>

        {/* Col 2: Distribusi Beban SKS (Donut Chart) (3 cols) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={16} className="text-blue-600 dark:text-blue-400" />
            <h2 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
              Distribusi Beban SKS
            </h2>
          </div>

          <div className="relative h-44 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={data?.distribusiSks?.breakdown || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={46}
                  outerRadius={68}
                  paddingAngle={2}
                  dataKey="count"
                >
                  {(data?.distribusiSks?.breakdown || []).map((entry, idx) => (
                    <Cell key={`sks-cell-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white text-[11px] font-bold py-1 px-2.5 rounded-lg shadow">
                          <span>{d.label}: </span>
                          <span className="text-emerald-400 font-extrabold">
                            {d.count} Mahasiswa ({d.percentage}%)
                          </span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>

            {/* Inner Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                {data?.distribusiSks?.totalMahasiswa ?? 0}
              </span>
              <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                Mahasiswa
              </span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-3 pt-2 text-[11px] font-bold">
            {(data?.distribusiSks?.breakdown || []).map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-slate-700 dark:text-slate-300">
                  {item.label} {item.percentage}% ({item.count})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Col 3: Sebaran Mahasiswa per Wilayah (3 cols) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={16} className="text-blue-600 dark:text-blue-400" />
            <h2 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
              Sebaran Mahasiswa per Wilayah
            </h2>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sebaranMahasiswaIndexedData}
                margin={{ top: 15, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="wilayahNo"
                  tick={{ fontSize: 11, fontWeight: 700, fill: "#334155" }}
                  interval={0}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                />
                <YAxis
                  domain={[0, "auto"]}
                  tick={{ fontSize: 9, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                />
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white text-[11px] font-bold py-1 px-2.5 rounded-lg shadow">
                          <span>Wilayah {d.wilayahNo} ({d.kelurahan}): </span>
                          <span className="text-emerald-400 font-extrabold">{d.count} Mahasiswa</span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="#009966"
                  radius={[3, 3, 0, 0]}
                  barSize={18}
                  label={{
                    position: "top",
                    fontSize: 9.5,
                    fontWeight: 700,
                    fill: "#334155",
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Keterangan Nomor Wilayah (1 = Cipaganti, 2 = Dago, dst) */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Keterangan Wilayah:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-2 gap-y-1">
              {sebaranMahasiswaIndexedData.map((item) => (
                <div key={item.wilayahNo} className="flex items-center gap-1.5 text-[10.5px] leading-tight text-slate-600 dark:text-slate-300">
                  <span className="w-4 h-4 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 text-[#009966] font-extrabold text-[9px] flex items-center justify-center shrink-0">
                    {item.wilayahNo}
                  </span>
                  <span className="truncate font-semibold" title={item.kelurahan}>
                    {item.kelurahan}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Col 4: Sebaran DPL per Wilayah (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3">
            <Users size={16} className="text-blue-600 dark:text-blue-400" />
            <h2 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
              Sebaran DPL per Wilayah
            </h2>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={data?.sebaranDplPerWilayah || []}
                margin={{ top: 5, right: 20, left: 0, bottom: 20 }}
              >
                <XAxis
                  type="number"
                  domain={[0, 8]}
                  ticks={[0, 2, 4, 6, 8]}
                  tick={{ fontSize: 9.5, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                />
                <YAxis
                  type="category"
                  dataKey="kelurahan"
                  tick={{ fontSize: 9, fill: "#475569" }}
                  width={72}
                  tickLine={false}
                  axisLine={false}
                />
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white text-[11px] font-bold py-1 px-2.5 rounded-lg shadow">
                          <span>{d.kelurahan}: </span>
                          <span className="text-blue-400 font-extrabold">{d.count} DPL</span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="#3b82f6"
                  radius={[0, 3, 3, 0]}
                  barSize={11}
                  label={{
                    position: "right",
                    fontSize: 9.5,
                    fontWeight: 700,
                    fill: "#334155",
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center text-[10.5px] text-slate-400 font-medium mt-1">
            Jumlah DPL
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. ROW 3 - OPERATIONS & PRESENCE                                           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Col 1: Status Program Kerja (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center gap-2">
            <FileCheck2 size={16} className="text-amber-500" />
            <h2 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
              Status Program Kerja
            </h2>
          </div>

          {/* 4 Status Counters */}
          <div className="grid grid-cols-4 gap-2">
            {/* Diusulkan */}
            <div className="bg-[#ecfdf5] dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-800/40">
              <div className="flex items-center gap-1 text-[#009966] dark:text-emerald-400 mb-1">
                <Calendar size={13} />
                <span className="text-[10px] font-semibold">Diusulkan</span>
              </div>
              <p className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
                {data?.statusProker?.diusulkan?.count ?? 0}
              </p>
            </div>

            {/* Disetujui */}
            <div className="bg-[#f0fdf4] dark:bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-800/40">
              <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 mb-1">
                <CheckCircle2 size={13} />
                <span className="text-[10px] font-semibold">Disetujui</span>
              </div>
              <p className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
                {data?.statusProker?.disetujui?.count ?? 0}
              </p>
            </div>

            {/* Sedang Dilaksanakan */}
            <div className="bg-[#eff6ff] dark:bg-blue-950/40 p-2.5 rounded-xl border border-blue-100 dark:border-blue-800/40">
              <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 mb-1">
                <Clock size={13} />
                <span className="text-[10px] font-semibold">Berlangsung</span>
              </div>
              <p className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
                {data?.statusProker?.sedangDilaksanakan?.count ?? 0}
              </p>
            </div>

            {/* Selesai Dilaksanakan */}
            <div className="bg-[#f5f3ff] dark:bg-purple-950/40 p-2.5 rounded-xl border border-purple-100 dark:border-purple-800/40">
              <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400 mb-1">
                <FileCheck2 size={13} />
                <span className="text-[10px] font-semibold">Selesai</span>
              </div>
              <p className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
                {data?.statusProker?.selesai?.count ?? 0}
              </p>
            </div>
          </div>

          {/* Multi-segment Progress Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="w-full h-4 rounded-md overflow-hidden flex bg-slate-100 dark:bg-slate-800">
              <div
                style={{ width: `${data?.statusProker?.diusulkan?.percentage ?? 0}%` }}
                className="bg-[#2dd4bf] h-full transition-all duration-500"
                title={`Diusulkan: ${data?.statusProker?.diusulkan?.percentage ?? 0}%`}
              />
              <div
                style={{ width: `${data?.statusProker?.disetujui?.percentage ?? 0}%` }}
                className="bg-[#009966] h-full transition-all duration-500"
                title={`Disetujui: ${data?.statusProker?.disetujui?.percentage ?? 0}%`}
              />
              <div
                style={{ width: `${data?.statusProker?.sedangDilaksanakan?.percentage ?? 0}%` }}
                className="bg-[#3b82f6] h-full transition-all duration-500"
                title={`Sedang Dilaksanakan: ${data?.statusProker?.sedangDilaksanakan?.percentage ?? 0}%`}
              />
              <div
                style={{ width: `${data?.statusProker?.selesai?.percentage ?? 0}%` }}
                className="bg-[#a855f7] h-full transition-all duration-500"
                title={`Selesai: ${data?.statusProker?.selesai?.percentage ?? 0}%`}
              />
            </div>

            {/* Percentage labels under segments */}
            <div className="flex justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400 px-1">
              <span>{data?.statusProker?.diusulkan?.percentage ?? 0}%</span>
              <span>{data?.statusProker?.disetujui?.percentage ?? 0}%</span>
              <span>{data?.statusProker?.sedangDilaksanakan?.percentage ?? 0}%</span>
              <span>{data?.statusProker?.selesai?.percentage ?? 0}%</span>
            </div>
          </div>

          <div className="text-right text-[11px] text-slate-400 font-medium">
            Total Program Kerja: {data?.statusProker?.total ?? 0}
          </div>
        </div>

        {/* Col 2: Presensi Mahasiswa (3 cols) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <UserCheck size={16} className="text-blue-600 dark:text-blue-400" />
            <h2 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
              Presensi Mahasiswa
            </h2>
          </div>

          {/* Donut Chart Besar Simetris di Tengah Atas */}
          <div className="relative h-40 w-full flex items-center justify-center my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={data?.presensiMahasiswa?.breakdown || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={44}
                  outerRadius={64}
                  paddingAngle={3}
                  dataKey="count"
                >
                  {(data?.presensiMahasiswa?.breakdown || []).map((entry, idx) => (
                    <Cell key={`presensi-cell-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white text-[11px] font-bold py-1 px-2.5 rounded-lg shadow">
                          <span>{d.label}: </span>
                          <span className="text-emerald-400 font-extrabold">{d.count} ({d.percentage}%)</span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>

            {/* Inner Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-black text-slate-900 dark:text-slate-100 leading-none">
                {data?.presensiMahasiswa?.percentageHadir ?? 0}%
              </span>
              <span className="text-[10px] text-slate-400 font-semibold mt-1">
                Hadir
              </span>
            </div>
          </div>

          {/* Breakdown List di Bawah (Simetris & Terbaca Jelas) */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px]">
            {(data?.presensiMahasiswa?.breakdown || []).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-600 dark:text-slate-300 font-medium text-[10.5px] truncate">
                    {item.label}
                  </span>
                </div>
                <span className="font-bold text-slate-800 dark:text-slate-100 text-[10.5px] shrink-0">
                  {item.count} <span className="text-slate-400 font-normal">({item.percentage}%)</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Col 3: Rasio Kehadiran terhadap Target 200 Jam (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-blue-600 dark:text-blue-400" />
              <h2 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                Rasio Kehadiran terhadap Target 200 Jam
              </h2>
            </div>
            <div className="text-right">
              <span className="text-sm font-black text-[#009966] dark:text-emerald-400">
                {data?.rasioKehadiranTrend?.percentage ?? 0}%
              </span>
              <p className="text-[9.5px] text-slate-400">
                {data?.rasioKehadiranTrend?.remainingHours ?? 200} Jam tersisa
              </p>
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {data?.rasioKehadiranTrend?.currentAvgHours ?? 0} Jam / {data?.rasioKehadiranTrend?.targetHours || 200} Jam
            </span>
          </div>

          <div className="h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data?.rasioKehadiranTrend?.weeklyTrends || []}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 9.5, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                />
                <YAxis
                  domain={[0, 200]}
                  ticks={[0, 50, 100, 150, 200]}
                  tick={{ fontSize: 9, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                />
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white text-[11px] font-bold py-1 px-2.5 rounded-lg shadow">
                          <span>{d.week}: </span>
                          <span className="text-emerald-400 font-extrabold">{d.avgHours} Jam</span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {/* Dashed Target Line */}
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke="#cbd5e1"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
                {/* Actual Average Line */}
                <Line
                  type="monotone"
                  dataKey="avgHours"
                  stroke="#009966"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#009966" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 text-[10.5px] font-medium pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#009966]" />
              <span className="text-slate-600 dark:text-slate-400">Rata-rata jam per mahasiswa</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 border-b border-dashed border-slate-400 inline-block" />
              <span className="text-slate-400">Target 200 jam</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. ROW 4 - AKTIVITAS, LINI MASA & PERHATIAN PIMPINAN                       */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Col 1: Aktivitas Terkini (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-[#009966] dark:text-emerald-400" />
            <h2 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
              Aktivitas Terkini
            </h2>
          </div>

          {/* 2 Mini Stat Blocks */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center shrink-0">
                <Users size={16} className="text-[#009966]" />
              </div>
              <div>
                <p className="text-[9.5px] text-slate-400 font-semibold">Log Aktivitas Mahasiswa</p>
                <p className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
                  {(data?.aktivitasTerkini?.totalLogMahasiswa ?? 0).toLocaleString("id-ID")}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center shrink-0">
                <FileText size={16} className="text-blue-600" />
              </div>
              <div>
                <p className="text-[9.5px] text-slate-400 font-semibold">Log Aktivitas DPL</p>
                <p className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
                  {(data?.aktivitasTerkini?.totalLogDpl ?? 0).toLocaleString("id-ID")}
                </p>
              </div>
            </div>
          </div>

          {/* 7-day dual line chart */}
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data?.aktivitasTerkini?.chartData || []}
                margin={{ top: 5, right: 10, left: -25, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 9, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                />
                <YAxis
                  domain={[0, "auto"]}
                  allowDecimals={false}
                  tick={{ fontSize: 9, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                />
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white text-[11px] font-bold py-1 px-2.5 rounded-lg shadow space-y-0.5">
                          <p className="text-slate-400">{d.date}</p>
                          <p className="text-emerald-400">Mahasiswa: {d.mahasiswa}</p>
                          <p className="text-blue-400">DPL: {d.dpl}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="mahasiswa"
                  stroke="#009966"
                  strokeWidth={2}
                  dot={{ r: 2.5, fill: "#009966" }}
                />
                <Line
                  type="monotone"
                  dataKey="dpl"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 2.5, fill: "#3b82f6" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 text-[10.5px] font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#009966]" />
              <span className="text-slate-600 dark:text-slate-400">Mahasiswa</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <span className="text-slate-600 dark:text-slate-400">DPL</span>
            </div>
          </div>
        </div>

        {/* Col 2: Lini Masa Terkini (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-blue-600 dark:text-blue-400" />
            <h2 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
              Lini Masa Terkini
            </h2>
          </div>

          {/* Vertical Timeline List */}
          <div className="relative pl-5 space-y-3.5 border-l-2 border-slate-100 dark:border-slate-800 ml-2">
            {(data?.liniMasaTerkini || []).map((item, idx) => {
              const isActive = item.badgeType === "active";
              return (
                <div key={item.id || idx} className="relative flex items-center justify-between gap-2">
                  {/* Timeline node dot */}
                  <span
                    className={`absolute -left-[27px] top-1.5 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                      isActive
                        ? "border-[#009966] bg-emerald-100"
                        : "border-blue-400 bg-white dark:bg-slate-900"
                    }`}
                  >
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#009966]" />}
                  </span>

                  <div>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      {item.title}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {item.dateRange}
                    </p>
                  </div>

                  <div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        isActive
                          ? "bg-emerald-50 text-[#009966] border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800/40"
                          : "bg-slate-50 text-slate-400 border-slate-200 dark:bg-slate-850 dark:border-slate-700"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Col 3: Perhatian Pimpinan (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" />
            <h2 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
              Perhatian Pimpinan
            </h2>
          </div>

          <div className="space-y-2.5">
            {(data?.perhatianPimpinan || []).map((alert, idx) => {
              const isDanger = alert.type === "danger";
              const isUnder70 = alert.id === "low_attendance_group";

              return (
                <button
                  key={alert.id || idx}
                  onClick={() => {
                    if (alert.link) navigate(alert.link);
                  }}
                  className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer group ${
                    isDanger
                      ? "bg-rose-50/50 hover:bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/40"
                      : isUnder70
                      ? "bg-orange-50/50 hover:bg-orange-50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/40"
                      : "bg-amber-50/50 hover:bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/40"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isDanger
                          ? "bg-rose-100 text-rose-600 dark:bg-rose-900/60"
                          : isUnder70
                          ? "bg-orange-100 text-orange-600 dark:bg-orange-900/60"
                          : "bg-amber-100 text-amber-600 dark:bg-amber-900/60"
                      }`}
                    >
                      {isDanger ? (
                        <Users size={14} />
                      ) : isUnder70 ? (
                        <TrendingUp size={14} />
                      ) : (
                        <FileCheck2 size={14} />
                      )}
                    </div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      <strong
                        className={`font-black mr-1 ${
                          isDanger
                            ? "text-rose-600"
                            : isUnder70
                            ? "text-orange-600"
                            : "text-amber-600"
                        }`}
                      >
                        {alert.count}
                      </strong>
                      {alert.title.replace(/^\d+\s*/, "")}
                    </p>
                  </div>

                  <ChevronRight
                    size={14}
                    className="text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-transform group-hover:translate-x-0.5 shrink-0"
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 4: Daftar Kelompok KKN & DPL Pengampu (Clean Grid Cards Overview) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Users size={18} className="text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                Daftar Kelompok KKN & DPL Pengampu
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Monitoring kelompok KKN binaan beserta DPL pengampu, cakupan wilayah RW, dan progres aktivitas.
            </p>
          </div>
          <Link
            to="/pelaksanaan/kelompok"
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Kelola di Menu Kelompok</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {loadingGroups ? (
          <div className="p-8 flex flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-500">
            <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <span>Memuat data kelompok KKN...</span>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-xs">
            Belum ada kelompok KKN yang sesuai dengan filter wilayah yang dipilih.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredGroups.map((g) => {
              const rwFormatted = Array.isArray(g.cakupanRw)
                ? g.cakupanRw.join(", ")
                : typeof g.cakupanRw === "string"
                ? g.cakupanRw
                : "-";
              return (
                <div
                  key={g.id}
                  className="bg-slate-50/70 dark:bg-slate-800/70 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700 hover:border-emerald-500/40 transition space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">{g.name}</h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/40">
                        {g.studentCount || 0} Mahasiswa
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Kel. {g.kelurahan || "-"} {g.kecamatan ? `• Kec. ${g.kecamatan}` : ""} • RW {rwFormatted}
                    </p>
                    {g.dpl && (
                      <p className="text-[11px] text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-1 truncate" title={`DPL: ${g.dpl.name}${g.dpl.nip ? ` (${g.dpl.nip})` : ""}`}>
                        <span className="text-slate-400 font-normal">DPL:</span> {g.dpl.name} {g.dpl.nip ? `(${g.dpl.nip})` : ""}
                      </p>
                    )}
                    {g.ketua && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold flex items-center gap-1 truncate">
                        <span className="text-slate-400 font-normal">Ketua Kelompok:</span> {g.ketua.name} ({g.ketua.nim})
                      </p>
                    )}
                    {g.posko && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center justify-between" title={g.posko.alamat}>
                        <span><span className="font-semibold text-slate-600 dark:text-slate-300">Posko:</span> {g.posko.nama}</span>
                        {g.posko.latitude && g.posko.longitude && (
                          <a href={`https://www.google.com/maps?q=${g.posko.latitude},${g.posko.longitude}`} target="_blank" rel="noreferrer" className="text-[10px] flex items-center gap-1 text-blue-500 hover:underline">
                            <MapPin size={10} /> Lokasi
                          </a>
                        )}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Rerata Presensi Lapangan</span>
                    <strong className={`font-black text-sm px-2.5 py-0.5 rounded-lg border ${getAttendanceBadgeClass(g.avgAttendanceRate || 0).badge}`}>
                      {g.avgAttendanceRate || 0}%
                    </strong>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedGroupForDetail(g);
                        setGroupStudentSearchQuery("");
                        setGroupStudentPage(1);
                      }}
                      className="flex-1 py-2 px-3 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/60 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Users size={14} className="text-emerald-600 dark:text-emerald-400" />
                      <span>Detail Anggota ({g.studentCount || 0})</span>
                    </button>
                    <Link
                      to="/pelaksanaan/kelompok"
                      className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs transition flex items-center justify-center cursor-pointer"
                      title="Kelola Struktur & Logbook di Manajemen Ekosistem"
                    >
                      <ChevronRight size={15} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Detail Anggota Kelompok & Fasilitas */}
      {selectedGroupForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="flex justify-between items-start px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-900 text-white shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10.5px] font-extrabold uppercase tracking-wider">
                    Master Penempatan KKN
                  </span>
                  <span className="text-slate-400 text-xs">•</span>
                  <span className="text-xs font-semibold text-slate-300">
                    Kel. {selectedGroupForDetail.kelurahan || "-"} {selectedGroupForDetail.kecamatan ? `• Kec. ${selectedGroupForDetail.kecamatan}` : ""}
                  </span>
                </div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Users size={20} className="text-emerald-400" />
                  <span>{selectedGroupForDetail.name}</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedGroupForDetail(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body with Scroll */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
              {/* Ringkasan Profil & Wilayah Kelompok */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-xs">
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold text-[10.5px] uppercase block">Total Mahasiswa</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                      {modalGroupStudents.length || selectedGroupForDetail.studentCount || 0}
                    </span>
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Orang Terdaftar</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 font-bold text-[10.5px] uppercase block">Cakupan Wilayah RW</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">
                    RW {Array.isArray(selectedGroupForDetail.cakupanRw) ? selectedGroupForDetail.cakupanRw.join(", ") : selectedGroupForDetail.cakupanRw || "-"}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 font-bold text-[10.5px] uppercase block">Dosen Pendamping</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block truncate" title={selectedGroupForDetail.dpl?.name || "-"}>
                    {selectedGroupForDetail.dpl?.name || "-"}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 font-bold text-[10.5px] uppercase block">Ketua Kelompok</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block truncate" title={selectedGroupForDetail.ketua?.name || "-"}>
                    {selectedGroupForDetail.ketua?.name || "-"}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 font-bold text-[10.5px] uppercase block">Jam Presensi Total</span>
                  <span className="text-base font-black text-blue-600 dark:text-blue-400 block truncate">
                    {selectedGroupForDetail.actualHours ? `${selectedGroupForDetail.actualHours} Jam` : `${Math.round((selectedGroupForDetail.avgAttendanceRate || 0) * 2)} Jam`}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 font-bold text-[10.5px] uppercase block">Posko KKN</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block truncate" title={selectedGroupForDetail.posko?.nama || selectedGroupForDetail.posko?.alamat || "-"}>
                    {selectedGroupForDetail.posko?.nama || "-"}
                  </span>
                  {selectedGroupForDetail.posko?.latitude && selectedGroupForDetail.posko?.longitude && (
                    <a href={`https://www.google.com/maps?q=${selectedGroupForDetail.posko.latitude},${selectedGroupForDetail.posko.longitude}`} target="_blank" rel="noreferrer" className="text-[10px] flex items-center gap-1 text-blue-500 hover:underline">
                      <MapPin size={10} /> Buka Peta
                    </a>
                  )}
                </div>
              </div>

              {/* Posko Detail */}
              {selectedGroupForDetail.posko && (
                <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 bg-slate-50 dark:bg-slate-800/40 space-y-2 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Lokasi Posko KKN</span>
                      <span className="block font-extrabold text-slate-800 dark:text-slate-100 text-sm mt-0.5">{selectedGroupForDetail.posko.nama || "Posko Kelompok"}</span>
                      {selectedGroupForDetail.posko.alamat && <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{selectedGroupForDetail.posko.alamat}</span>}
                    </div>
                    {selectedGroupForDetail.posko.latitude && selectedGroupForDetail.posko.longitude && (
                      <a
                        href={`https://www.google.com/maps?q=${selectedGroupForDetail.posko.latitude},${selectedGroupForDetail.posko.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700/40 rounded-lg text-[10.5px] font-bold flex items-center gap-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition"
                      >
                        <MapPin size={11} /> Buka Google Maps
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Filter & Pencarian Mahasiswa dalam Kelompok */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>Daftar Anggota Mahasiswa</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/40">
                      Total {modalGroupStudents.length} Mahasiswa
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Gunakan fitur pencarian untuk menemukan mahasiswa berdasarkan nama, NIM, atau program studi.
                  </p>
                </div>

                <div className="relative w-full sm:w-72">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={groupStudentSearchQuery}
                    onChange={(e) => {
                      setGroupStudentSearchQuery(e.target.value);
                      setGroupStudentPage(1);
                    }}
                    placeholder="Cari nama / NIM / prodi..."
                    className="w-full pl-8.5 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  />
                  {groupStudentSearchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setGroupStudentSearchQuery("");
                        setGroupStudentPage(1);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Tabel Mahasiswa Kelompok */}
              {filteredModalGroupStudents.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-xs">
                  {groupStudentSearchQuery
                    ? `Tidak ada mahasiswa di kelompok ini yang cocok dengan kata kunci "${groupStudentSearchQuery}".`
                    : "Belum ada data detail mahasiswa yang terhubung ke kelompok ini."}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 font-extrabold uppercase text-[10.5px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                        <th className="py-3 px-3 text-center w-10">No</th>
                        <th className="py-3 px-3">NIM</th>
                        <th className="py-3 px-3">Nama Mahasiswa</th>
                        <th className="py-3 px-3">Program Studi</th>
                        <th className="py-3 px-3 text-center">Presensi Lapangan</th>
                        <th className="py-3 px-3 text-center">Jam Presensi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                      {paginatedModalGroupStudents.map((st, idx) => (
                        <tr key={st.id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition">
                          <td className="py-2.5 px-3 text-center font-bold text-slate-400">
                            {(groupStudentPage - 1) * MODAL_STUDENTS_PER_PAGE + idx + 1}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                            {st.nim || "-"}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 dark:text-slate-100">{st.name}</span>
                              {st.isKetua && (
                                <span className="bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 text-[9px] px-1.5 py-0.2 rounded font-extrabold border border-amber-200 dark:border-amber-700 flex items-center gap-0.5">
                                  <Crown size={9} />
                                  <span>Ketua Kelompok</span>
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                            {st.jurusan || "-"} {st.fakultas ? `(${st.fakultas})` : ""}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-md font-extrabold text-[11px] border ${getAttendanceBadgeClass(st.attendanceRate || 0).badge}`}>
                              {st.attendanceRate || 0}%
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-800 dark:text-slate-200">
                            {st.totalHours || 0} Jam {st.remainingMinutes ? `${st.remainingMinutes}m` : ""}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Modal Pagination Controls */}
              {totalModalStudentPages > 1 && (
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 px-4 py-2.5 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    Menampilkan {(groupStudentPage - 1) * MODAL_STUDENTS_PER_PAGE + 1} - {Math.min(groupStudentPage * MODAL_STUDENTS_PER_PAGE, filteredModalGroupStudents.length)} dari {filteredModalGroupStudents.length} Mahasiswa
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={groupStudentPage === 1}
                      onClick={() => setGroupStudentPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg disabled:opacity-50 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer flex items-center gap-1"
                    >
                      <ChevronLeft size={13} />
                      <span>Sebelumnya</span>
                    </button>
                    <span className="px-2 font-bold text-slate-700 dark:text-slate-300">
                      {groupStudentPage} / {totalModalStudentPages}
                    </span>
                    <button
                      type="button"
                      disabled={groupStudentPage === totalModalStudentPages}
                      onClick={() => setGroupStudentPage((p) => Math.min(totalModalStudentPages, p + 1))}
                      className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg disabled:opacity-50 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer flex items-center gap-1"
                    >
                      <span>Selanjutnya</span>
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-3 shrink-0">
              <Link
                to="/pelaksanaan/kelompok"
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>Buka di Menu Kelompok</span>
                <ChevronRight size={13} />
              </Link>
              <button
                type="button"
                onClick={() => setSelectedGroupForDetail(null)}
                className="px-5 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold text-xs rounded-xl transition cursor-pointer"
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

export default DashboardEksekutifKkn;
