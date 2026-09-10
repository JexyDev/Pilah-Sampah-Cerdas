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
  Search,
  X,
  Crown,
  ChevronLeft,
  FileCheck,
  Award,
  Trophy,
  Filter,
  XCircle,
  AlertCircle,
  SlidersHorizontal,
  Phone,
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
import api from "../../services/api";
import showToast from "../../utils/showToast";
import { dplService, type GroupSummary, type StudentDetail } from "../../services/dplService";
import LeaderboardWidget from "../../components/LeaderboardWidget";

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
    ditolak?: { count: number; percentage: number };
    usulan?: {
      total: number;
      disetujui: { count: number; percentage: number };
      belumDisetujui: { count: number; percentage: number };
      ditolak: { count: number; percentage: number };
    };
    pelaksanaan?: {
      total: number;
      belum: { count: number; percentage: number };
      sedangBerjalan: { count: number; percentage: number };
      selesai: { count: number; percentage: number };
    };
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
    unit?: string;
    title: string;
    subtitle?: string;
    type: string;
    link: string;
    metadata?: {
      criticalStudentsCount?: number;
      totalAlpaLogs?: number;
      uniqueStudentsEverAlpa?: number;
    };
  }>;
  criticalAlpaStudents?: Array<{
    id: string;
    userId: string;
    name: string;
    nim: string;
    jurusan: string;
    kelompokId: string | null;
    kelompokName: string;
    kelurahan: string;
    dplName: string;
    dplPhone: string | null;
    phone: string | null;
    alpaCount: number;
  }>;
  resumeDpl?: {
    totalDpl: number;
    dplAktifCount: number;
    dplBelumAktifCount: number;
    persentaseKeaktifan: number;
    totalLogDpl: number;
    totalKunjunganLapangan: number;
    totalDurasiBimbinganJam: number;
    rerataBimbinganPerDpl: number;
    recentActivities: Array<{
      id: string;
      dplName: string;
      kelompokName: string;
      kategori: string;
      tanggal: string;
      durasiMenit?: number;
      tempat: string;
      waktuMulai?: string | null;
      waktuSelesai?: string | null;
    }>;
  };
  filterOptions: {
    periodeOptions: Array<{ value: string; label: string }>;
    kelurahanOptions: Array<{ value: string; label: string }>;
    kelompokOptions?: Array<{ value: string; label: string; kelurahan?: string }>;
    selectedKelurahan: string;
    selectedRw: string;
    selectedKelompok?: string;
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
  const [selectedKelompok, setSelectedKelompok] = useState("Semua Kelompok");

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

  // Modal Detail Mahasiswa Alpa Kritis (Peringatan Dini)
  const [showCriticalAlpaModal, setShowCriticalAlpaModal] = useState(false);
  const [criticalAlpaSearchQuery, setCriticalAlpaSearchQuery] = useState("");
  const [criticalAlpaFilterKelompok, setCriticalAlpaFilterKelompok] = useState("ALL");
  const [criticalAlpaPage, setCriticalAlpaPage] = useState(1);
  const CRITICAL_ALPA_PER_PAGE = 8;

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

  // Filter Kelompok dinamis: disaring berdasarkan kelurahan jika kelurahan dipilih
  const kelompokOptions = useMemo(() => {
    if (data?.filterOptions?.kelompokOptions && data.filterOptions.kelompokOptions.length > 0) {
      if (!isKelurahanSelected) {
        return data.filterOptions.kelompokOptions.map((k) => k.value);
      }
      const targetKel = selectedKelurahan.toLowerCase().replace(/\s+/g, "");
      const filtered = data.filterOptions.kelompokOptions.filter((k) => {
        if (!k.kelurahan) return true;
        const kName = k.kelurahan.toLowerCase().replace(/\s+/g, "");
        return kName.includes(targetKel) || targetKel.includes(kName);
      });
      const names = filtered.map((k) => k.value).filter((v) => v !== "Semua Kelompok");
      return ["Semua Kelompok", ...names];
    }
    if (groups && groups.length > 0) {
      let list = groups;
      if (isKelurahanSelected) {
        const targetKel = selectedKelurahan.toLowerCase().replace(/\s+/g, "");
        list = list.filter((g) => {
          const kName = (g.kelurahan || "").toLowerCase().replace(/\s+/g, "");
          return kName.includes(targetKel) || targetKel.includes(kName);
        });
      }
      const sorted = Array.from(new Set(list.map((g) => g.name).filter(Boolean))).sort();
      return ["Semua Kelompok", ...sorted];
    }
    return ["Semua Kelompok"];
  }, [data?.filterOptions?.kelompokOptions, groups, selectedKelurahan, isKelurahanSelected]);

  // Reset selectedKelompok jika kelurahan berganti dan kelompok lama tidak lagi valid
  useEffect(() => {
    if (selectedKelompok !== "Semua Kelompok" && !kelompokOptions.includes(selectedKelompok)) {
      setSelectedKelompok("Semua Kelompok");
    }
  }, [selectedKelurahan, kelompokOptions, selectedKelompok]);

  // Filtered Critical Alpa Students untuk Modal
  const filteredCriticalAlpaStudents = useMemo(() => {
    const list = data?.criticalAlpaStudents || [];
    return list.filter((st) => {
      const matchKelompok =
        criticalAlpaFilterKelompok === "ALL" ||
        st.kelompokName.toLowerCase() === criticalAlpaFilterKelompok.toLowerCase() ||
        st.kelompokId === criticalAlpaFilterKelompok;

      if (!matchKelompok) return false;

      if (!criticalAlpaSearchQuery.trim()) return true;
      const q = criticalAlpaSearchQuery.toLowerCase();
      return (
        st.name.toLowerCase().includes(q) ||
        st.nim.toLowerCase().includes(q) ||
        st.jurusan.toLowerCase().includes(q) ||
        st.kelompokName.toLowerCase().includes(q) ||
        st.kelurahan.toLowerCase().includes(q) ||
        st.dplName.toLowerCase().includes(q)
      );
    });
  }, [data?.criticalAlpaStudents, criticalAlpaFilterKelompok, criticalAlpaSearchQuery]);

  const totalCriticalAlpaPages = Math.ceil(filteredCriticalAlpaStudents.length / CRITICAL_ALPA_PER_PAGE) || 1;
  const paginatedCriticalAlpaStudents = useMemo(() => {
    const start = (criticalAlpaPage - 1) * CRITICAL_ALPA_PER_PAGE;
    return filteredCriticalAlpaStudents.slice(start, start + CRITICAL_ALPA_PER_PAGE);
  }, [filteredCriticalAlpaStudents, criticalAlpaPage]);

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
      if (selectedKelompok && selectedKelompok !== "Semua Kelompok" && selectedKelompok !== "ALL") {
        params.kelompok = selectedKelompok;
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

  // Search & Filter Kelompok KKN
  const [groupSearchQuery, setGroupSearchQuery] = useState("");
  const [attendanceFilter, setAttendanceFilter] = useState<"ALL" | "UNDER_60" | "GE_60">("ALL");
  const [prokerFilter, setProkerFilter] = useState<"ALL" | "UNDER_60" | "GE_60">("ALL");
  const [selectedDplFilter, setSelectedDplFilter] = useState<string>("ALL");

  // Leaderboard data & state
  const [leaderboardData, setLeaderboardData] = useState<{
    students: Array<{
      id: string;
      name: string;
      nim: string;
      kelompok: string;
      kelompokId?: string;
      totalHours: number;
      activeBins: number;
      dplScore: number;
      finalScore: number;
    }>;
    groups: Array<{
      id: string;
      name: string;
      dplName: string;
      avgScore: number;
      membersCount: number;
    }>;
    dpl: Array<{
      id: string;
      name: string;
      points: number;
      totalGroups: number;
      totalStudents: number;
    }>;
  } | null>(null);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [leaderboardTab, setLeaderboardTab] = useState<"students" | "groups">("students");

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoadingLeaderboard(true);
        const res = await api.get("/gamification/leaderboard-kkn");
        if (res.data?.success && res.data?.data) {
          setLeaderboardData(res.data.data);
        }
      } catch (err) {
        console.warn("Gagal memuat data leaderboard KKN:", err);
      } finally {
        setLoadingLeaderboard(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const dplFilterOptions = useMemo(() => {
    const dplSet = new Set<string>();
    groups.forEach((g) => {
      if (g.dpl?.name) dplSet.add(g.dpl.name.trim());
    });
    return Array.from(dplSet).sort();
  }, [groups]);

  // Filter kelompok berdasarkan pencarian, presensi, proker, DPL, dan wilayah
  const filteredGroups = useMemo(() => {
    if (!groups || groups.length === 0) return [];

    return groups.filter((g) => {
      // 1. Filter Kelurahan
      if (selectedKelurahan && selectedKelurahan !== "Semua Kelurahan" && selectedKelurahan !== "ALL") {
        const cleanKel = selectedKelurahan.toLowerCase().replace(/\s+/g, "");
        const gKel = (g.kelurahan || "").toLowerCase().replace(/\s+/g, "");
        if (!gKel.includes(cleanKel) && !cleanKel.includes(gKel)) return false;
      }

      // 2. Filter DPL
      if (selectedDplFilter && selectedDplFilter !== "ALL") {
        if ((g.dpl?.name || "").trim() !== selectedDplFilter.trim()) return false;
      }

      // 3. Filter Presensi (<60% atau >=60%)
      const attRate = Number(g.avgAttendanceRate) || 0;
      if (attendanceFilter === "UNDER_60" && attRate >= 60) return false;
      if (attendanceFilter === "GE_60" && attRate < 60) return false;

      // 4. Filter Proker (<60% atau >=60%)
      const totalProker = g.programKerja?.length || 0;
      const completedProker = g.programKerja?.filter(
        (p: any) => p.statusPelaksanaan === "SELESAI" || p.status === "SELESAI"
      ).length || 0;
      const prokerRate = totalProker > 0 ? (completedProker / totalProker) * 100 : 0;
      if (prokerFilter === "UNDER_60" && prokerRate >= 60) return false;
      if (prokerFilter === "GE_60" && prokerRate < 60) return false;

      // 5. Search Query
      if (groupSearchQuery.trim()) {
        const q = groupSearchQuery.toLowerCase().trim();
        const rwFormatted = Array.isArray(g.cakupanRw)
          ? g.cakupanRw.join(" ")
          : typeof g.cakupanRw === "string"
          ? g.cakupanRw
          : "";
        const matchBasic =
          (g.name || "").toLowerCase().includes(q) ||
          (g.kelurahan || "").toLowerCase().includes(q) ||
          (g.kecamatan || "").toLowerCase().includes(q) ||
          rwFormatted.toLowerCase().includes(q) ||
          (g.dpl?.name || "").toLowerCase().includes(q) ||
          (g.dpl?.nip || "").toLowerCase().includes(q) ||
          (g.ketua?.name || "").toLowerCase().includes(q) ||
          (g.ketua?.nim || "").toLowerCase().includes(q) ||
          (g.posko?.nama || "").toLowerCase().includes(q);

        if (matchBasic) return true;

        // Cek juga apakah ada mahasiswa di kelompok ini yang cocok dengan NIM atau nama
        const hasMatchingStudent = students.some(
          (s) =>
            (s.kelompokId === g.id || s.kelompokName === g.name) &&
            ((s.name || "").toLowerCase().includes(q) || (s.nim || "").toLowerCase().includes(q))
        );
        return hasMatchingStudent;
      }

      return true;
    });
  }, [groups, selectedKelurahan, selectedDplFilter, attendanceFilter, prokerFilter, groupSearchQuery, students]);

  // Statistik Dinamis dari Kelompok Terfilter
  const filteredSummaryStats = useMemo(() => {
    const totalGroups = filteredGroups.length;
    const totalStudents = filteredGroups.reduce((acc, g) => acc + (g.studentCount || 0), 0);
    const avgAttendance =
      totalGroups > 0
        ? Math.round(filteredGroups.reduce((acc, g) => acc + (g.avgAttendanceRate || 0), 0) / totalGroups)
        : 0;
    const countAttendanceUnder60 = filteredGroups.filter((g) => (g.avgAttendanceRate || 0) < 60).length;
    const countProkerUnder60 = filteredGroups.filter((g) => {
      const totalP = g.programKerja?.length || 0;
      if (totalP === 0) return true;
      const doneP = g.programKerja?.filter(
        (p: any) => p.statusPelaksanaan === "SELESAI" || p.status === "SELESAI"
      ).length || 0;
      return (doneP / totalP) * 100 < 60;
    }).length;

    return {
      totalGroups,
      totalStudents,
      avgAttendance,
      countAttendanceUnder60,
      countProkerUnder60,
    };
  }, [filteredGroups]);

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
  }, [selectedPeriode, selectedKelurahan, selectedRw, selectedKelompok]);

  // Periodic auto-refresh every 60 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      fetchData(true);
    }, 60000);
    return () => clearInterval(timer);
  }, [selectedPeriode, selectedKelurahan, selectedRw, selectedKelompok]);

  // Handle Export Excel
  const handleExport = async () => {
    try {
      setDownloading(true);
      const params: Record<string, string> = {};
      if (selectedPeriode) params.periode = selectedPeriode;
      if (selectedKelurahan && selectedKelurahan !== "Semua Kelurahan") params.kelurahan = selectedKelurahan;
      if (selectedRw && selectedRw !== "Semua RW") params.rw = selectedRw;
      if (selectedKelompok && selectedKelompok !== "Semua Kelompok") params.kelompok = selectedKelompok;

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
                    setSelectedKelompok("Semua Kelompok");
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

            {/* Kelompok Dropdown */}
            <div className="relative">
              <div className="flex items-center gap-2 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs">
                <Users size={14} className="text-purple-600 shrink-0" />
                <select
                  value={selectedKelompok}
                  onChange={(e) => setSelectedKelompok(e.target.value)}
                  aria-label="Filter Kelompok KKN"
                  className="bg-transparent outline-none cursor-pointer pr-2 text-xs font-bold text-slate-700 dark:text-slate-200 max-w-[170px] truncate"
                >
                  {kelompokOptions.map((kel) => (
                    <option key={kel} value={kel}>
                      {kel}
                    </option>
                  ))}
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
      {/* 2B. PERINGATAN DINI & PERHATIAN PIMPINAN (LANGSUNG DI BAWAH TOP 5 KPI)    */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/5 dark:from-amber-950/30 dark:via-rose-950/30 dark:to-slate-900 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <AlertTriangle size={17} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Peringatan Dini & Perhatian Pimpinan
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40">
                  Perlu Koordinasi
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Monitoring indikator kritis lapangan yang memerlukan tindak lanjut pembimbingan atau arahan pimpinan.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {(data?.perhatianPimpinan || []).map((alert, idx) => {
            const isDanger = alert.type === "danger";
            const isAlpa = alert.id === "alpa";
            const isRejected = alert.id === "rejected_proker" || alert.id === "proker_ditolak";
            const isUnder60 = alert.id === "low_attendance_group" || alert.id === "low_proker_group";

            const unitLabel = alert.unit || (
              isAlpa
                ? "Mahasiswa"
                : isRejected
                ? "Proker Ditolak"
                : alert.id === "proker_pending"
                ? "Proker"
                : isUnder60
                ? "Kelompok"
                : "Entitas"
            );

            return (
              <button
                key={alert.id || idx}
                type="button"
                onClick={() => {
                  if (alert.id === "alpa") {
                    setShowCriticalAlpaModal(true);
                    setCriticalAlpaSearchQuery("");
                    setCriticalAlpaFilterKelompok("ALL");
                    setCriticalAlpaPage(1);
                  } else if (alert.id === "low_attendance_group") {
                    setAttendanceFilter("UNDER_60");
                    const el = document.getElementById("section-kelompok-kkn");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  } else if (alert.id === "low_proker_group") {
                    setProkerFilter("UNDER_60");
                    const el = document.getElementById("section-kelompok-kkn");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  } else if (alert.link) {
                    navigate(alert.link);
                  }
                }}
                className={`p-3.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer group bg-white dark:bg-slate-900 hover:shadow-xs ${
                  isDanger || isRejected
                    ? "border-rose-200 dark:border-rose-900/50 hover:border-rose-400"
                    : isUnder60
                    ? "border-orange-200 dark:border-orange-900/50 hover:border-orange-400"
                    : "border-amber-200 dark:border-amber-900/50 hover:border-amber-400"
                }`}
                title={alert.subtitle || alert.title}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isDanger || isRejected
                        ? "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400"
                        : isUnder60
                        ? "bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400"
                        : "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
                    }`}
                  >
                    {isAlpa ? (
                      <Users size={16} />
                    ) : isDanger ? (
                      <AlertCircle size={16} />
                    ) : isRejected ? (
                      <XCircle size={16} />
                    ) : isUnder60 ? (
                      <TrendingUp size={16} />
                    ) : (
                      <FileCheck2 size={16} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-1.5">
                      <span
                        className={`text-lg font-black ${
                          isDanger || isRejected
                            ? "text-rose-600 dark:text-rose-400"
                            : isUnder60
                            ? "text-orange-600 dark:text-orange-400"
                            : "text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {alert.count}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                        {unitLabel}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-snug line-clamp-2">
                      {alert.title.replace(/^\d+\s*/, "")}
                    </p>
                  </div>
                </div>

                <ChevronRight
                  size={15}
                  className="text-slate-300 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-transform group-hover:translate-x-0.5 shrink-0 ml-1.5"
                />
              </button>
            );
          })}
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
                margin={{ top: 5, right: 30, left: 10, bottom: 25 }}
              >
                <XAxis
                  type="number"
                  domain={[0, (dataMax: number) => Math.max(150, Math.ceil(dataMax * 1.15))]}
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                  label={{ value: "Jumlah Mahasiswa (Orang)", position: "insideBottom", offset: -10, fontSize: 10, fill: "#94a3b8" }}
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
            Jumlah Mahasiswa (Sumbu X: Orang, Sumbu Y: Program Studi)
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
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 pt-2 text-[11px] font-bold max-h-24 overflow-y-auto">
            {(data?.distribusiSks?.breakdown || []).map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
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
                margin={{ top: 15, right: 10, left: -10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="wilayahNo"
                  tick={{ fontSize: 11, fontWeight: 700, fill: "#334155" }}
                  interval={0}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                  label={{ value: "Wilayah (1-6)", position: "insideBottom", offset: -5, fontSize: 10, fill: "#94a3b8" }}
                />
                <YAxis
                  domain={[0, "auto"]}
                  tick={{ fontSize: 9, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                  label={{ value: "Mahasiswa", angle: -90, position: "insideLeft", offset: 15, fontSize: 10, fill: "#94a3b8" }}
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
          <p className="text-center text-[10.5px] text-slate-400 font-medium mt-1">
            Sumbu X: Nomor Wilayah (1 - 6) • Sumbu Y: Jumlah Mahasiswa (Orang)
          </p>

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
                margin={{ top: 5, right: 20, left: 0, bottom: 25 }}
              >
                <XAxis
                  type="number"
                  domain={[0, 8]}
                  ticks={[0, 2, 4, 6, 8]}
                  tick={{ fontSize: 9.5, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                  label={{ value: "Jumlah DPL (Orang)", position: "insideBottom", offset: -10, fontSize: 10, fill: "#94a3b8" }}
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
            Jumlah DPL (Sumbu X: Orang, Sumbu Y: Kelurahan)
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. ROW 3 - OPERATIONS & PRESENCE                                           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Col 1: Status Program Kerja (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck2 size={16} className="text-amber-500" />
              <h2 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                Status Program Kerja
              </h2>
            </div>
            <span className="text-[11px] text-slate-400 font-extrabold">
              Total: {data?.statusProker?.usulan?.total ?? data?.statusProker?.total ?? 0} Proker
            </span>
          </div>

          {/* Dimensi 1: Status Usulan (Mandiri, Ditolak Terpisah & Jelas) */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Status Usulan Program Kerja:
            </p>
            <div className="grid grid-cols-4 gap-2">
              {/* Total Usulan */}
              <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300 mb-1">
                  <Calendar size={12} />
                  <span className="text-[9.5px] font-bold">Total</span>
                </div>
                <p className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
                  {data?.statusProker?.usulan?.total ?? data?.statusProker?.total ?? 0}
                </p>
              </div>

              {/* Usulan Disetujui */}
              <div className="bg-emerald-50/80 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
                <div className="flex items-center gap-1 text-[#009966] dark:text-emerald-400 mb-1">
                  <CheckCircle2 size={12} />
                  <span className="text-[9.5px] font-bold">Disetujui</span>
                </div>
                <p className="text-sm sm:text-base font-black text-[#009966] dark:text-emerald-400">
                  {data?.statusProker?.usulan?.disetujui?.count ?? data?.statusProker?.disetujui?.count ?? 0}
                </p>
                <p className="text-[9px] text-slate-400 font-medium">
                  {data?.statusProker?.usulan?.disetujui?.percentage ?? data?.statusProker?.disetujui?.percentage ?? 0}%
                </p>
              </div>

              {/* Usulan Belum Disetujui */}
              <div className="bg-amber-50/80 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800/40">
                <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 mb-1">
                  <Clock size={12} />
                  <span className="text-[9.5px] font-bold">Menunggu</span>
                </div>
                <p className="text-sm sm:text-base font-black text-amber-600 dark:text-amber-400">
                  {data?.statusProker?.usulan?.belumDisetujui?.count ?? data?.statusProker?.diusulkan?.count ?? 0}
                </p>
                <p className="text-[9px] text-slate-400 font-medium">
                  {data?.statusProker?.usulan?.belumDisetujui?.percentage ?? data?.statusProker?.diusulkan?.percentage ?? 0}%
                </p>
              </div>

              {/* Usulan DITOLAK (Mandiri Terpisah) */}
              <div className="bg-rose-50/80 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-200 dark:border-rose-800/40">
                <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400 mb-1">
                  <XCircle size={12} />
                  <span className="text-[9.5px] font-bold">Ditolak</span>
                </div>
                <p className="text-sm sm:text-base font-black text-rose-600 dark:text-rose-400">
                  {data?.statusProker?.usulan?.ditolak?.count ?? data?.statusProker?.ditolak?.count ?? 0}
                </p>
                <p className="text-[9px] text-slate-400 font-medium">
                  {data?.statusProker?.usulan?.ditolak?.percentage ?? data?.statusProker?.ditolak?.percentage ?? 0}%
                </p>
              </div>
            </div>
          </div>

          {/* Dimensi 2: Status Pelaksanaan Program Kerja (Donut / Pie Chart) */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Status Pelaksanaan:
              </p>
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                {data?.statusProker?.pelaksanaan?.total ?? data?.statusProker?.disetujui?.count ?? 0} Disetujui
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Mini Donut Chart for Pelaksanaan */}
              <div className="relative h-28 w-28 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={[
                        {
                          name: "Belum Mulai",
                          value: data?.statusProker?.pelaksanaan?.belum?.count ?? 0,
                          color: "#94a3b8",
                        },
                        {
                          name: "Sedang Berjalan",
                          value: data?.statusProker?.pelaksanaan?.sedangBerjalan?.count ?? data?.statusProker?.sedangDilaksanakan?.count ?? 0,
                          color: "#3b82f6",
                        },
                        {
                          name: "Selesai",
                          value: data?.statusProker?.pelaksanaan?.selesai?.count ?? data?.statusProker?.selesai?.count ?? 0,
                          color: "#10b981",
                        },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={28}
                      outerRadius={48}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      <Cell fill="#94a3b8" />
                      <Cell fill="#3b82f6" />
                      <Cell fill="#10b981" />
                    </Pie>
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0];
                          return (
                            <div className="bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded shadow">
                              <span>{d.name}: </span>
                              <span className="text-emerald-400 font-extrabold">{d.value} Proker</span>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                    {data?.statusProker?.pelaksanaan?.total ?? 0}
                  </span>
                  <span className="text-[8px] text-slate-400">Proker</span>
                </div>
              </div>

              {/* Status Pelaksanaan Legend & Breakdown */}
              <div className="flex-1 space-y-1.5 w-full">
                {/* Belum Mulai */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" />
                    <span className="text-slate-600 dark:text-slate-300 font-medium">Belum Mulai</span>
                  </div>
                  <span className="font-extrabold text-slate-700 dark:text-slate-200">
                    {data?.statusProker?.pelaksanaan?.belum?.count ?? 0} ({data?.statusProker?.pelaksanaan?.belum?.percentage ?? 0}%)
                  </span>
                </div>

                {/* Sedang Berjalan */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                    <span className="text-slate-600 dark:text-slate-300 font-medium">Sedang Berjalan</span>
                  </div>
                  <span className="font-extrabold text-blue-600 dark:text-blue-400">
                    {data?.statusProker?.pelaksanaan?.sedangBerjalan?.count ?? data?.statusProker?.sedangDilaksanakan?.count ?? 0} ({data?.statusProker?.pelaksanaan?.sedangBerjalan?.percentage ?? data?.statusProker?.sedangDilaksanakan?.percentage ?? 0}%)
                  </span>
                </div>

                {/* Sudah Selesai */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                    <span className="text-slate-600 dark:text-slate-300 font-medium">Sudah Selesai</span>
                  </div>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                    {data?.statusProker?.pelaksanaan?.selesai?.count ?? data?.statusProker?.selesai?.count ?? 0} ({data?.statusProker?.pelaksanaan?.selesai?.percentage ?? data?.statusProker?.selesai?.percentage ?? 0}%)
                  </span>
                </div>
              </div>
            </div>
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
                margin={{ top: 10, right: 10, left: -5, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 9.5, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                  label={{ value: "Pekan KKN", position: "insideBottom", offset: -5, fontSize: 9.5, fill: "#94a3b8" }}
                />
                <YAxis
                  domain={[0, 200]}
                  ticks={[0, 50, 100, 150, 200]}
                  tick={{ fontSize: 9, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                  label={{ value: "Jam Kerja", angle: -90, position: "insideLeft", offset: 15, fontSize: 9.5, fill: "#94a3b8" }}
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
                margin={{ top: 5, right: 10, left: -5, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 9, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                  label={{ value: "Tanggal", position: "insideBottom", offset: -5, fontSize: 9, fill: "#94a3b8" }}
                />
                <YAxis
                  domain={[0, "auto"]}
                  allowDecimals={false}
                  tick={{ fontSize: 9, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                  label={{ value: "Log", angle: -90, position: "insideLeft", offset: 15, fontSize: 9, fill: "#94a3b8" }}
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

        {/* Col 3: Resume Aktivitas DPL (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap size={16} className="text-[#009966] dark:text-emerald-400" />
              <h2 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                Resume Aktivitas DPL
              </h2>
            </div>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-[#009966] dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
              {data?.resumeDpl?.persentaseKeaktifan ?? 0}% Aktif
            </span>
          </div>

          {/* Keaktifan Summary Card */}
          <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>Keaktifan Pembimbingan</span>
              <span className="text-[#009966] dark:text-emerald-400">
                {data?.resumeDpl?.dplAktifCount ?? 0} / {data?.resumeDpl?.totalDpl ?? 0} DPL
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#009966] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, data?.resumeDpl?.persentaseKeaktifan ?? 0))}%` }}
              />
            </div>

            {/* Rincian DPL Sudah Buat Log vs Belum Buat Log */}
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/40 text-[10.5px]">
                <span className="font-bold text-emerald-800 dark:text-emerald-300">Sudah Buat Log</span>
                <span className="font-black text-emerald-700 dark:text-emerald-300">{data?.resumeDpl?.dplAktifCount ?? 0} DPL</span>
              </div>
              <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/40 text-[10.5px]">
                <span className="font-bold text-amber-800 dark:text-amber-300">Belum Buat Log</span>
                <span className="font-black text-amber-700 dark:text-amber-300">{data?.resumeDpl?.dplBelumAktifCount ?? 0} DPL</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <p className="text-[9px] text-slate-400 font-semibold">Log Bimbingan</p>
                <p className="text-xs font-black text-slate-900 dark:text-slate-100">
                  {data?.resumeDpl?.totalLogDpl ?? 0}
                </p>
              </div>
              <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <p className="text-[9px] text-slate-400 font-semibold">Kunjungan</p>
                <p className="text-xs font-black text-slate-900 dark:text-slate-100">
                  {data?.resumeDpl?.totalKunjunganLapangan ?? 0}
                </p>
              </div>
              <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <p className="text-[9px] text-slate-400 font-semibold">Total Jam</p>
                <p className="text-xs font-black text-slate-900 dark:text-slate-100">
                  {data?.resumeDpl?.totalDurasiBimbinganJam ?? 0} Jam
                </p>
              </div>
            </div>
          </div>

          {/* Aktivitas Terkini DPL Feed */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Aktivitas Pembimbingan Terbaru:
            </p>
            {(!data?.resumeDpl?.recentActivities || data.resumeDpl.recentActivities.length === 0) ? (
              <div className="p-3 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-850 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                Belum ada catatan log bimbingan DPL terverifikasi.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {data.resumeDpl.recentActivities.slice(0, 3).map((act) => (
                  <div
                    key={act.id}
                    className="p-2 rounded-lg bg-slate-50/70 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-extrabold text-slate-800 dark:text-slate-200 truncate">
                        {act.dplName}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {act.kelompokName} • {act.kategori}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block">
                        {(() => {
                          const m = act.durasiMenit;
                          if (m && m > 0) {
                            if (m % 60 === 0) return `${m / 60} Jam`;
                            if (m > 60) return `${Math.floor(m / 60)} Jam ${m % 60}m`;
                            return `${m} Menit`;
                          }
                          if (act.waktuMulai && act.waktuSelesai) {
                            return `${act.waktuMulai}–${act.waktuSelesai}`;
                          }
                          return "-";
                        })()}
                      </span>
                      <span className="text-[9px] text-slate-400 block">
                        {act.tanggal}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5B. PAPAN PERINGKAT (LEADERBOARD) MAHASISWA & KELOMPOK TERAKTIF           */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40">
              <Trophy size={18} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Papan Peringkat (Leaderboard) Keaktifan Lapangan
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                  Real-Time
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Evaluasi komposit jam kerja lapangan mahasiswa, pendataan tempat sampah, dan skor pembimbingan DPL.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-start sm:self-auto text-xs font-bold">
            <button
              type="button"
              onClick={() => setLeaderboardTab("students")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                leaderboardTab === "students"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <Users size={14} />
              <span>Top Mahasiswa</span>
            </button>
            <button
              type="button"
              onClick={() => setLeaderboardTab("groups")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                leaderboardTab === "groups"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <Award size={14} />
              <span>Top Kelompok</span>
            </button>
          </div>
        </div>

        {loadingLeaderboard ? (
          <div className="p-8 flex flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs text-slate-500">
            <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <span>Memuat data papan peringkat...</span>
          </div>
        ) : leaderboardTab === "students" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3 font-extrabold w-12 text-center">Peringkat</th>
                  <th className="py-2.5 px-3 font-extrabold">Mahasiswa & NIM</th>
                  <th className="py-2.5 px-3 font-extrabold">Kelompok KKN</th>
                  <th className="py-2.5 px-3 font-extrabold text-right">Jam Lapangan</th>
                  <th className="py-2.5 px-3 font-extrabold text-right">Tempat Sampah Aktif</th>
                  <th className="py-2.5 px-3 font-extrabold text-right">Nilai DPL</th>
                  <th className="py-2.5 px-3 font-extrabold text-right">Skor Akhir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(leaderboardData?.students || []).slice(0, 10).map((st, idx) => {
                  const rank = idx + 1;
                  const isTop3 = rank <= 3;
                  return (
                    <tr
                      key={st.id || idx}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-2.5 px-3 text-center">
                        {rank === 1 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 font-black text-xs shadow-xs border border-amber-300/60">
                            👑 1
                          </span>
                        ) : rank === 2 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 font-black text-xs shadow-xs">
                            🥈 2
                          </span>
                        ) : rank === 3 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-950/80 dark:text-orange-300 font-black text-xs shadow-xs">
                            🥉 3
                          </span>
                        ) : (
                          <span className="font-extrabold text-slate-400">#{rank}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <span>{st.name}</span>
                          {isTop3 && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800/40">
                              Teladan
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium">NIM: {st.nim}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 font-medium">
                        {st.kelompok}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-emerald-600 dark:text-emerald-400">
                        {st.totalHours} Jam
                      </td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-slate-700 dark:text-slate-300">
                        {st.activeBins} Titik
                      </td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-slate-700 dark:text-slate-300">
                        {st.dplScore}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-black text-xs border border-emerald-200 dark:border-emerald-700/40">
                          {st.finalScore} Poin
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3 font-extrabold w-12 text-center">Peringkat</th>
                  <th className="py-2.5 px-3 font-extrabold">Nama Kelompok</th>
                  <th className="py-2.5 px-3 font-extrabold">DPL Pengampu</th>
                  <th className="py-2.5 px-3 font-extrabold text-right">Jumlah Anggota</th>
                  <th className="py-2.5 px-3 font-extrabold text-right">Rata-Rata Skor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(leaderboardData?.groups || []).slice(0, 10).map((g, idx) => {
                  const rank = idx + 1;
                  return (
                    <tr
                      key={g.id || idx}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-2.5 px-3 text-center font-extrabold text-slate-500">
                        #{rank}
                      </td>
                      <td className="py-2.5 px-3 font-black text-slate-900 dark:text-slate-100">
                        {g.name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 font-semibold">
                        {g.dplName}
                      </td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-slate-700 dark:text-slate-300">
                        {g.membersCount} Mahasiswa
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-black text-xs border border-blue-200 dark:border-blue-700/40">
                          {g.avgScore} Poin
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5B.2 TOP 10 AKADEMIK & PENDAMPINGAN */}
      <div className="w-full">
        <LeaderboardWidget mode="kkn" />
      </div>

      {/* Row 4: Daftar Kelompok KKN & DPL Pengampu (Dengan Search & Multi-Filter Standar Eksekutif) */}
      <div id="section-kelompok-kkn" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Users size={18} className="text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                Daftar Kelompok KKN & DPL Pengampu
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Monitoring operasional kelompok KKN binaan, DPL pengampu, sebaran RW, tingkat presensi, dan progres program kerja.
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

        {/* Dynamic Summary Cards untuk Hasil Filter Kelompok */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kelompok Ditampilkan</p>
            <p className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5">
              {filteredSummaryStats.totalGroups} <span className="text-xs font-normal text-slate-400">/ {groups.length}</span>
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Mahasiswa Terdata</p>
            <p className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5">
              {filteredSummaryStats.totalStudents} <span className="text-xs font-normal text-slate-400">Orang</span>
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rerata Presensi Kelompok</p>
            <p className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {filteredSummaryStats.avgAttendance}%
            </p>
          </div>

          <div className={`p-3 rounded-xl border transition-colors ${
            filteredSummaryStats.countAttendanceUnder60 > 0
              ? "bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/40"
              : "bg-slate-50 dark:bg-slate-850 border-slate-200/80 dark:border-slate-800"
          }`}>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Presensi &lt; 60%</p>
            <p className={`text-base sm:text-lg font-black mt-0.5 ${
              filteredSummaryStats.countAttendanceUnder60 > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-700 dark:text-slate-300"
            }`}>
              {filteredSummaryStats.countAttendanceUnder60} <span className="text-xs font-normal text-slate-400">Kelompok</span>
            </p>
          </div>

          <div className={`p-3 rounded-xl border transition-colors ${
            filteredSummaryStats.countProkerUnder60 > 0
              ? "bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40"
              : "bg-slate-50 dark:bg-slate-850 border-slate-200/80 dark:border-slate-800"
          }`}>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Proker &lt; 60%</p>
            <p className={`text-base sm:text-lg font-black mt-0.5 ${
              filteredSummaryStats.countProkerUnder60 > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-700 dark:text-slate-300"
            }`}>
              {filteredSummaryStats.countProkerUnder60} <span className="text-xs font-normal text-slate-400">Kelompok</span>
            </p>
          </div>
        </div>

        {/* Search Bar & Multi-Filter Controls */}
        <div className="p-3.5 bg-slate-50/80 dark:bg-slate-850/80 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex flex-col lg:flex-row gap-2.5 items-stretch lg:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={groupSearchQuery}
                onChange={(e) => setGroupSearchQuery(e.target.value)}
                placeholder="Cari nama kelompok, DPL, ketua, NIM, posko, atau wilayah RW..."
                className="w-full pl-9 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-emerald-500 dark:focus:border-emerald-400 transition"
              />
              {groupSearchQuery && (
                <button
                  type="button"
                  onClick={() => setGroupSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Presensi (<60% & >=60%) */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200">
              <UserCheck size={14} className="text-emerald-600 shrink-0" />
              <select
                value={attendanceFilter}
                onChange={(e) => setAttendanceFilter(e.target.value as any)}
                aria-label="Filter Presensi"
                className="bg-transparent outline-none pr-1 cursor-pointer font-bold"
              >
                <option value="ALL">Semua Presensi</option>
                <option value="UNDER_60">&lt; 60% Presensi (Perlu Intervensi)</option>
                <option value="GE_60">≥ 60% Presensi (Sesuai Standar)</option>
              </select>
            </div>

            {/* Filter Capaian Proker (<60% & >=60%) */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200">
              <FileCheck2 size={14} className="text-blue-600 shrink-0" />
              <select
                value={prokerFilter}
                onChange={(e) => setProkerFilter(e.target.value as any)}
                aria-label="Filter Capaian Program Kerja"
                className="bg-transparent outline-none pr-1 cursor-pointer font-bold"
              >
                <option value="ALL">Semua Proker</option>
                <option value="UNDER_60">&lt; 60% Proker (Progres Rendah)</option>
                <option value="GE_60">≥ 60% Proker (Progres Baik)</option>
              </select>
            </div>

            {/* Filter DPL */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200">
              <GraduationCap size={14} className="text-purple-600 shrink-0" />
              <select
                value={selectedDplFilter}
                onChange={(e) => setSelectedDplFilter(e.target.value)}
                aria-label="Filter DPL Pengampu"
                className="bg-transparent outline-none pr-1 cursor-pointer font-bold max-w-[150px] truncate"
              >
                <option value="ALL">Semua DPL</option>
                {dplFilterOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Filter Button */}
            {(groupSearchQuery || attendanceFilter !== "ALL" || prokerFilter !== "ALL" || selectedDplFilter !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setGroupSearchQuery("");
                  setAttendanceFilter("ALL");
                  setProkerFilter("ALL");
                  setSelectedDplFilter("ALL");
                }}
                className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-rose-100 hover:text-rose-700 dark:hover:bg-rose-950 dark:hover:text-rose-300 text-slate-600 dark:text-slate-300 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <X size={13} />
                <span>Reset Filter</span>
              </button>
            )}
          </div>
        </div>

        {loadingGroups ? (
          <div className="p-8 flex flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-500">
            <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <span>Memuat data kelompok KKN...</span>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-xs">
            Belum ada kelompok KKN yang sesuai dengan parameter pencarian atau filter aktif.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredGroups.map((g) => {
              const rwFormatted = Array.isArray(g.cakupanRw)
                ? g.cakupanRw.join(", ")
                : typeof g.cakupanRw === "string"
                ? g.cakupanRw
                : "-";
              
              const totalP = g.programKerja?.length || 0;
              const doneP = g.programKerja?.filter(
                (p: any) => p.statusPelaksanaan === "SELESAI" || p.status === "SELESAI"
              ).length || 0;
              const prokerRate = totalP > 0 ? Math.round((doneP / totalP) * 100) : 0;
              const isLowAtt = (g.avgAttendanceRate || 0) < 60;
              const isLowProker = totalP > 0 && prokerRate < 60;

              return (
                <div
                  key={g.id}
                  className={`p-4 rounded-xl border transition space-y-3 flex flex-col justify-between ${
                    isLowAtt || isLowProker
                      ? "bg-amber-50/30 dark:bg-amber-950/10 border-amber-200 dark:border-amber-800/50 hover:border-amber-400"
                      : "bg-slate-50/70 dark:bg-slate-800/70 border-slate-200/80 dark:border-slate-700 hover:border-emerald-500/40"
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">{g.name}</h4>
                      <div className="flex items-center gap-1.5">
                        {isLowAtt && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40">
                            Presensi &lt;60%
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/40">
                          {g.studentCount || 0} Mahasiswa
                        </span>
                      </div>
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
                        <span className="text-slate-400 font-normal">Ketua:</span> {g.ketua.name} ({g.ketua.nim})
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

                  {/* Dual Metrics: Presensi & Proker */}
                  <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Rerata Presensi</span>
                      <strong className={`font-black text-xs px-2 py-0.5 rounded-md border inline-block mt-0.5 ${getAttendanceBadgeClass(g.avgAttendanceRate || 0).badge}`}>
                        {g.avgAttendanceRate || 0}%
                      </strong>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Progres Proker</span>
                      <span className={`font-black text-xs px-2 py-0.5 rounded-md border inline-block mt-0.5 ${
                        prokerRate >= 80
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : prokerRate >= 60
                          ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300"
                          : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300"
                      }`}>
                        {prokerRate}% ({doneP}/{totalP})
                      </span>
                    </div>
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

      {/* Modal Detail Mahasiswa Alpa Kritis (Peringatan Dini) */}
      {showCriticalAlpaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="flex justify-between items-start px-6 py-4 bg-gradient-to-r from-rose-900 via-slate-900 to-slate-900 text-white shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/30 text-[10.5px] font-extrabold uppercase tracking-wider">
                    Peringatan Dini Presensi Lapangan
                  </span>
                  <span className="text-slate-400 text-xs">•</span>
                  <span className="text-xs font-semibold text-slate-300">
                    Akumulasi Tanpa Keterangan ≥ 3 Hari
                  </span>
                </div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <AlertTriangle size={20} className="text-rose-400" />
                  <span>Daftar Mahasiswa Tanpa Keterangan Kritis</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCriticalAlpaModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body with Scroll */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
              {/* Context Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 p-3.5 rounded-2xl">
                  <p className="text-[10.5px] font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
                    Mahasiswa Tanpa Keterangan Kritis (≥ 3x)
                  </p>
                  <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
                    {data?.criticalAlpaStudents?.length || 0} <span className="text-xs font-semibold text-slate-500">Mahasiswa</span>
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Memerlukan pembimbingan & evaluasi DPL segera
                  </p>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-3.5 rounded-2xl">
                  <p className="text-[10.5px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                    Mahasiswa Pernah Tanpa Keterangan (≥ 1x)
                  </p>
                  <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
                    {data?.perhatianPimpinan?.find(a => a.id === "alpa")?.metadata?.uniqueStudentsEverAlpa ?? 0} <span className="text-xs font-semibold text-slate-500">Mahasiswa</span>
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Termasuk yang hanya tanpa keterangan 1-2 kali
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3.5 rounded-2xl">
                  <p className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Total Kejadian Log Tanpa Keterangan
                  </p>
                  <p className="text-xl font-black text-slate-800 dark:text-slate-100 mt-1">
                    {data?.perhatianPimpinan?.find(a => a.id === "alpa")?.metadata?.totalAlpaLogs ?? 0} <span className="text-xs font-semibold text-slate-500">Log Kasus</span>
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Akumulasi record presensi lapangan
                  </p>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={criticalAlpaSearchQuery}
                    onChange={(e) => {
                      setCriticalAlpaSearchQuery(e.target.value);
                      setCriticalAlpaPage(1);
                    }}
                    placeholder="Cari nama mahasiswa, NIM, prodi, kelompok, atau DPL..."
                    className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-rose-500 dark:focus:border-rose-400 transition"
                  />
                  {criticalAlpaSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setCriticalAlpaSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200">
                    <Filter size={13} className="text-slate-400 shrink-0" />
                    <select
                      value={criticalAlpaFilterKelompok}
                      onChange={(e) => {
                        setCriticalAlpaFilterKelompok(e.target.value);
                        setCriticalAlpaPage(1);
                      }}
                      className="bg-transparent outline-none cursor-pointer text-xs font-semibold max-w-[180px] truncate"
                    >
                      <option value="ALL">Semua Kelompok</option>
                      {Array.from(new Set((data?.criticalAlpaStudents || []).map((s) => s.kelompokName))).map((kName) => (
                        <option key={kName} value={kName}>
                          {kName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Table of Critical Alpa Students */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3.5 text-center w-12">No</th>
                        <th className="py-2.5 px-3.5">Mahasiswa</th>
                        <th className="py-2.5 px-3.5">Program Studi</th>
                        <th className="py-2.5 px-3.5">Kelompok & Wilayah</th>
                        <th className="py-2.5 px-3.5">DPL Pengampu</th>
                        <th className="py-2.5 px-3.5 text-center">Akumulasi Tanpa Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {paginatedCriticalAlpaStudents.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                            Tidak ditemukan mahasiswa tanpa keterangan kritis dengan parameter pencarian tersebut.
                          </td>
                        </tr>
                      ) : (
                        paginatedCriticalAlpaStudents.map((st, idx) => {
                          const rowNum = (criticalAlpaPage - 1) * CRITICAL_ALPA_PER_PAGE + idx + 1;
                          return (
                            <tr key={st.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                              <td className="py-2.5 px-3.5 text-center font-bold text-slate-400">
                                {rowNum}
                              </td>
                              <td className="py-2.5 px-3.5">
                                <p className="font-bold text-slate-900 dark:text-slate-100 leading-tight">
                                  {st.name}
                                </p>
                                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                  NIM: {st.nim}
                                </p>
                              </td>
                              <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-300 font-medium">
                                {st.jurusan}
                              </td>
                              <td className="py-2.5 px-3.5">
                                <p className="font-semibold text-slate-800 dark:text-slate-200">
                                  {st.kelompokName}
                                </p>
                                <p className="text-[11px] text-slate-400">
                                  Kel. {st.kelurahan}
                                </p>
                              </td>
                              <td className="py-2.5 px-3.5">
                                <p className="font-semibold text-slate-700 dark:text-slate-300">
                                  {st.dplName}
                                </p>
                                {st.dplPhone && (
                                  <a
                                    href={`https://wa.me/${st.dplPhone.replace(/\D/g, "")}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[10.5px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 mt-0.5"
                                  >
                                    <Phone size={10} />
                                    <span>{st.dplPhone}</span>
                                  </a>
                                )}
                              </td>
                              <td className="py-2.5 px-3.5 text-center">
                                <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                                  {st.alpaCount} Hari Tanpa Keterangan
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalCriticalAlpaPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500">
                    <span>
                      Menampilkan {Math.min((criticalAlpaPage - 1) * CRITICAL_ALPA_PER_PAGE + 1, filteredCriticalAlpaStudents.length)} -{" "}
                      {Math.min(criticalAlpaPage * CRITICAL_ALPA_PER_PAGE, filteredCriticalAlpaStudents.length)} dari{" "}
                      {filteredCriticalAlpaStudents.length} Mahasiswa
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={criticalAlpaPage === 1}
                        onClick={() => setCriticalAlpaPage((p) => Math.max(1, p - 1))}
                        className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <span className="font-bold text-slate-700 dark:text-slate-300 px-2">
                        {criticalAlpaPage} / {totalCriticalAlpaPages}
                      </span>
                      <button
                        type="button"
                        disabled={criticalAlpaPage === totalCriticalAlpaPages}
                        onClick={() => setCriticalAlpaPage((p) => Math.min(totalCriticalAlpaPages, p + 1))}
                        className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 shrink-0">
              <Link
                to="/monitoring-kegiatan/presensi?filter=alpa"
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>Buka Modul Monitoring Presensi Lapangan</span>
                <ChevronRight size={14} />
              </Link>
              <button
                type="button"
                onClick={() => setShowCriticalAlpaModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
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
