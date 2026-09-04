import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Search,
  Download,
  Printer,
  FileSpreadsheet,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  PauseCircle,
  Users,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Image as ImageIcon,
  ExternalLink,
  X,
  FileCheck2,
  Calendar,
  Sparkles,
  Activity,
  Target,
  BarChart3,
  ListFilter,
  ArrowRight,
  TrendingUp,
  Pencil,
  Trash2,
  Save,
  SlidersHorizontal,
  MapPin,
  Info,
  ShieldCheck,
  Eye,
  User as UserIcon,
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { useAuthStore } from "../../store/useAuthStore";
import { dplService, type ConfigTargets } from "../../services/dplService";
import { EmptyTableState } from "../../components/common/EmptyTableState";
import { ConfirmModal } from "../../components/common/ConfirmModal";
import { wsClient } from "../../utils/websocket";
import {
  formatPersonName,
  formatKelompokName,
  formatWilayahName,
  formatProdiName,
} from "../../utils/textFormatter";
import { sortKelompokList, sortStudentsRoster } from "../../utils/sortUtils";

export interface LaporanItem {
  id: string;
  studentId: string;
  namaMahasiswa: string;
  nim: string;
  jurusan: string;
  fotoProfil: string | null;
  isKetua: boolean;
  kelompok: {
    id: string;
    name: string;
    kelurahan: string;
    dplName: string;
  } | null;
  scheduleId: string;
  namaKegiatan: string;
  tanggal: string;
  jamMasuk: string;
  jamPulang: string;
  durasiMenit: number;
  durasiFormatted: string;
  durasiAktualMenit?: number;
  durasiAktualFormatted?: string;
  targetMinMenit?: number;
  rasioKehadiran?: number;
  status: string;
  statusDisplay: string;
  isMemenuhiDurasi: boolean;
  deskripsiKegiatan: string | null;
  fotoUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  method: string;
  jedaLogs?: any[];
}

export interface StudentAggregate {
  studentId: string;
  namaMahasiswa: string;
  nim: string;
  jurusan: string;
  isKetua: boolean;
  fotoProfil: string | null;
  kelompok: {
    id: string;
    name: string;
    kelurahan: string;
    dplName: string;
  } | null;
  totalSessions: number;
  totalMinutes: number;
  totalHours: number;
  totalFormatted: string;
  avgMinutesPerDay: number;
  avgFormatted: string;
  hadirMemenuhi: number;
  hadirKurang: number;
  berlangsung: number;
  terjeda: number;
  izinSakit: number;
}

export interface LaporanSummary {
  totalPresensi: number;
  totalMahasiswa?: number;
  hadirMemenuhi: number;
  hadirKurang: number;
  berlangsung: number;
  terjeda: number;
  izinSakit: number;
  totalJamKumulatif: number;
  totalMenitKumulatif: number;
  avgJamPerMahasiswa?: number;
}

export const LaporanPresensiPage: React.FC = () => {
  const { user } = useAuthStore();
  const rawRole = user?.role;
  const roleName = String(typeof rawRole === "object" ? (rawRole as any)?.name : rawRole || "").toUpperCase();
  const isDpl = roleName === "DPL" || roleName === "DOSEN_PEMBIMBING";
  const isDeveloper = roleName === "DEVELOPER" || roleName === "SUPER_USER";

  // Tab View Mode: Rekap Mahasiswa (Total Akumulasi) vs Log Presensi Detail
  const [activeTab, setActiveTab] = useState<"REKAP_MAHASISWA" | "LOG_DETAIL">("REKAP_MAHASISWA");

  // Data states
  const [items, setItems] = useState<LaporanItem[]>([]);
  const [studentAggregates, setStudentAggregates] = useState<StudentAggregate[]>([]);
  const [summary, setSummary] = useState<LaporanSummary>({
    totalPresensi: 0,
    totalMahasiswa: 0,
    hadirMemenuhi: 0,
    hadirKurang: 0,
    berlangsung: 0,
    terjeda: 0,
    izinSakit: 0,
    totalJamKumulatif: 0,
    totalMenitKumulatif: 0,
    avgJamPerMahasiswa: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [groups, setGroups] = useState<any[]>([]);

  // Filter states
  const [selectedKelompok, setSelectedKelompok] = useState<string>(() => {
    if (typeof window !== "undefined" && !isDpl) {
      try {
        const saved = localStorage.getItem("berseka_dev_selected_kelompok");
        if (saved) return saved;
      } catch {}
    }
    return "ALL";
  });
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedKelurahan, setSelectedKelurahan] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [datePreset, setDatePreset] = useState<"ALL" | "TODAY" | "7DAYS" | "30DAYS">("TODAY");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(20);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Debounce search input to avoid lag and spamming API on every keystroke
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Real-time WebSocket Telemetry states
  const [wsStatus, setWsStatus] = useState<"CONNECTED" | "CONNECTING" | "DISCONNECTED">("DISCONNECTED");
  const [lastLiveUpdate, setLastLiveUpdate] = useState<Date | null>(null);

  // Modals
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; title: string; desc?: string | null } | null>(null);
  const [previewDesc, setPreviewDesc] = useState<{ student: string; desc: string; time: string } | null>(null);

  // Student Detailed Log Modal State
  const [selectedStudentForLog, setSelectedStudentForLog] = useState<StudentAggregate | null>(null);
  const [studentLogItems, setStudentLogItems] = useState<LaporanItem[]>([]);
  const [isLoadingStudentLogs, setIsLoadingStudentLogs] = useState<boolean>(false);

  const handleOpenStudentLogModal = async (student: StudentAggregate) => {
    setSelectedStudentForLog(student);
    setIsLoadingStudentLogs(true);
    try {
      // Fetch all presence records for this student across all time
      const params: any = {
        search: student.namaMahasiswa,
        limit: 100,
        page: 1,
      };
      if (selectedKelompok && selectedKelompok !== "ALL") {
        params.kelompokId = selectedKelompok;
      }
      const res = await api.get("/laporan-rekap", { params });
      if (res.data?.success && res.data?.data) {
        const list = (res.data.data.items || []).filter(
          (it: LaporanItem) =>
            it.studentId === student.studentId ||
            it.nim === student.nim ||
            it.namaMahasiswa.toLowerCase().includes(student.namaMahasiswa.toLowerCase())
        );
        setStudentLogItems(list);
      }
    } catch (err: any) {
      console.error("Gagal memuat log presensi mahasiswa:", err);
      toast.error("Gagal memuat log presensi detail mahasiswa.");
    } finally {
      setIsLoadingStudentLogs(false);
    }
  };

  const handleJumpToLogDetailTab = (studentName: string) => {
    setSelectedStudentForLog(null);
    setSearchQuery(studentName);
    setDatePreset("ALL");
    setStartDate("");
    setEndDate("");
    setActiveTab("LOG_DETAIL");
    setPage(1);
    toast.success(`Menampilkan log presensi harian untuk: ${studentName}`);
  };

  // Presensi CRUD & Manipulation Modals
  const [editItem, setEditItem] = useState<LaporanItem | null>(null);
  const [editForm, setEditForm] = useState<{
    tanggal: string;
    jamMasuk: string;
    jamPulang: string;
    durasiMenit: number;
    status: string;
    deskripsiKegiatan: string;
  }>({
    tanggal: "",
    jamMasuk: "",
    jamPulang: "",
    durasiMenit: 240,
    status: "HADIR_MEMENUHI",
    deskripsiKegiatan: "",
  });
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);
  const [deleteItem, setDeleteItem] = useState<LaporanItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [forceCheckoutTarget, setForceCheckoutTarget] = useState<LaporanItem | null>(null);
  const [isForcingCheckout, setIsForcingCheckout] = useState<boolean>(false);

  const handleOpenEdit = (item: LaporanItem) => {
    setEditItem(item);
    const itemMins = item.durasiMenit !== undefined ? item.durasiMenit : 240;
    const defaultStat = item.status || (itemMins >= 240 ? "HADIR_MEMENUHI" : "HADIR_TIDAK_MEMENUHI");
    setEditForm({
      tanggal: item.tanggal !== "-" ? item.tanggal : new Date().toISOString().slice(0, 10),
      jamMasuk: item.jamMasuk !== "-" ? item.jamMasuk : "08:00",
      jamPulang: item.jamPulang !== "-" ? item.jamPulang : "12:00",
      durasiMenit: itemMins,
      status: defaultStat,
      deskripsiKegiatan: item.deskripsiKegiatan || "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editItem) return;
    try {
      setIsSavingEdit(true);
      const startDateTime = `${editForm.tanggal}T${editForm.jamMasuk}:00+07:00`;
      const endDateTime = editForm.jamPulang && editForm.jamPulang !== "-" ? `${editForm.tanggal}T${editForm.jamPulang}:00+07:00` : undefined;
      const targetMins = editItem.targetMinMenit || 240;
      const finalStatus =
        editForm.status === "HADIR_MEMENUHI" && Number(editForm.durasiMenit) < targetMins
          ? "HADIR_TIDAK_MEMENUHI"
          : editForm.status;

      await api.put(`/kkn-attendance/${editItem.id}`, {
        attendedAt: new Date(startDateTime).toISOString(),
        checkOutAt: endDateTime ? new Date(endDateTime).toISOString() : null,
        actualInZoneMinutes: Number(editForm.durasiMenit),
        status: finalStatus,
        deskripsiKegiatan: editForm.deskripsiKegiatan,
        clearJedaLogs: true,
      });

      toast.success("Presensi dan durasi jam pulang berhasil diperbarui!");
      setEditItem(null);
      fetchLaporan();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Gagal menyimpan perubahan presensi");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handlePromptForceCheckout = (item: LaporanItem) => {
    setForceCheckoutTarget(item);
  };

  const handleConfirmForceCheckout = async () => {
    if (!forceCheckoutTarget) return;
    try {
      setIsForcingCheckout(true);
      await api.post(`/kkn-attendance/${forceCheckoutTarget.id}/force-checkout`, {
        status: "HADIR_MEMENUHI",
        actualInZoneMinutes: Math.max(240, forceCheckoutTarget.durasiMenit || 240),
        alasan: "Force check-out sesi lapangan oleh Admin/DPL",
      });
      toast.success(`Sesi presensi ${forceCheckoutTarget.namaMahasiswa} berhasil diselesaikan!`);
      setForceCheckoutTarget(null);
      fetchLaporan();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Gagal force check-out");
    } finally {
      setIsForcingCheckout(false);
    }
  };

  const handleDeletePresensi = async () => {
    if (!deleteItem) return;
    try {
      setIsDeleting(true);
      await api.delete(`/kkn-attendance/${deleteItem.id}`);
      toast.success("Data presensi berhasil dihapus");
      setDeleteItem(null);
      fetchLaporan();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Gagal menghapus presensi");
    } finally {
      setIsDeleting(false);
    }
  };

  const [configTargets, setConfigTargets] = useState<ConfigTargets>({
    targetTotalKegiatan: 2000,
    targetTotalJam: 200,
    targetHarianJam: 4,
    targetHarianKegiatan: 5,
    attendanceMinDurationHours: 4,
    attendanceMinDurationMinutes: 0,
    attendanceMinDurationSeconds: 0,
  });

  const fetchConfigTargets = async () => {
    try {
      const data = await dplService.getConfigTargets();
      if (data) {
        setConfigTargets(data);
      }
    } catch (_err) {
      // Keep existing defaults
    }
  };

  useEffect(() => {
    fetchConfigTargets();
  }, []);

  // Compute period target hours dynamically from Rule Engine / Config Targets
  const periodTargetHours = useMemo(() => {
    const minHarian = Number(configTargets.attendanceMinDurationHours || configTargets.targetHarianJam) || 4;
    const minTotal = Number(configTargets.targetTotalJam) || 200;

    if (datePreset === "TODAY") return minHarian;
    if (datePreset === "7DAYS") return 5 * minHarian; // 5 hari kerja x minHarian
    if (datePreset === "30DAYS") return 20 * minHarian; // 20 hari kerja x minHarian
    if (datePreset === "ALL" && !startDate && !endDate) return minTotal; // Total seluruh semester KKN

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1);
      // Asumsi rerata 5 hari kerja per 7 hari kalender
      const estimatedWorkDays = Math.max(1, Math.round((diffDays / 7) * 5));
      return estimatedWorkDays * minHarian;
    }
    return minTotal;
  }, [datePreset, startDate, endDate, configTargets]);

  const periodLabel = useMemo(() => {
    if (datePreset === "TODAY") return "Hari Ini";
    if (datePreset === "7DAYS") return "Seminggu Ini (7 Hari)";
    if (datePreset === "30DAYS") return "30 Hari Terakhir";
    if (datePreset === "ALL" && !startDate && !endDate) return "Seluruh Periode KKN";
    if (startDate && endDate) return `${startDate} s.d. ${endDate}`;
    return "Periode Terpilih";
  }, [datePreset, startDate, endDate]);

  // Rerata jam per mahasiswa per hari dalam periode aktif
  const rerataJamPerMhsPerHari = useMemo(() => {
    const totalStudents = studentAggregates.length || summary.totalMahasiswa || 0;
    if (!totalStudents || !summary.totalJamKumulatif) return "0";

    let days = 1;
    if (datePreset === "TODAY") {
      days = 1;
    } else if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      days = Math.max(1, Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1);
    } else if (datePreset === "7DAYS") {
      days = 7;
    } else if (datePreset === "30DAYS") {
      days = 30;
    } else {
      // Untuk filter ALL (seluruh periode KKN), estimasikan hari aktif dari total sesi presensi
      days = summary.totalPresensi > 0 ? Math.max(1, Math.ceil(summary.totalPresensi / totalStudents)) : 1;
    }

    const val = summary.totalJamKumulatif / (totalStudents * days);
    return val > 0 ? val.toFixed(1) : "0";
  }, [datePreset, startDate, endDate, studentAggregates.length, summary.totalMahasiswa, summary.totalJamKumulatif, summary.totalPresensi]);

  // Quick select kelompok with localStorage persistence for developer
  const handleSelectKelompok = (id: string) => {
    setSelectedKelompok(id);
    setPage(1);
    if (!isDpl && typeof window !== "undefined") {
      try {
        localStorage.setItem("berseka_dev_selected_kelompok", id === "ALL" ? "" : id);
      } catch {}
    }
  };

  // Quick date preset handler
  const handleDatePreset = (preset: "ALL" | "TODAY" | "7DAYS" | "30DAYS") => {
    setDatePreset(preset);
    setPage(1);
    const nowWib = new Date(Date.now() + 7 * 60 * 60 * 1000);
    const todayStr = nowWib.toISOString().slice(0, 10);

    if (preset === "ALL") {
      setStartDate("");
      setEndDate("");
    } else if (preset === "TODAY") {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "7DAYS") {
      const past7 = new Date(nowWib.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      setStartDate(past7);
      setEndDate(todayStr);
    } else if (preset === "30DAYS") {
      const past30 = new Date(nowWib.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      setStartDate(past30);
      setEndDate(todayStr);
    }
  };

  // Set default initial date range to TODAY on mount
  useEffect(() => {
    const nowWib = new Date(Date.now() + 7 * 60 * 60 * 1000);
    const todayStr = nowWib.toISOString().slice(0, 10);
    setStartDate(todayStr);
    setEndDate(todayStr);
    setDatePreset("TODAY");
  }, []);

  // Fetch groups for filter
  const fetchGroups = useCallback(async () => {
    try {
      const res = await api.get("/kelompok");
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      const sortedList = sortKelompokList(list, (g: any) => g.name || "");
      if (isDpl && user?.id) {
        // Strict scope to DPL's assigned groups
        const dplGroups = sortedList.filter((g: any) => 
          g.dplId === user.id || 
          g.dpl?.id === user.id || 
          g.dpl?.userId === user.id || 
          (user.email && g.dpl?.email === user.email)
        );
        setGroups(dplGroups.length > 0 ? dplGroups : sortedList);
      } else {
        setGroups(sortedList);
      }
    } catch (_err) {
      // silent fallback
    }
  }, [isDpl, user]);

  // Fetch report data
  const fetchLaporan = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params: any = {
        page,
        limit,
      };

      if (selectedKelompok && selectedKelompok !== "ALL") {
        params.kelompokId = selectedKelompok;
      }
      if (selectedStatus && selectedStatus !== "ALL") {
        params.status = selectedStatus;
      }
      if (startDate) {
        params.startDate = startDate;
      }
      if (endDate) {
        params.endDate = endDate;
      }
      if (debouncedSearchQuery.trim()) {
        params.search = debouncedSearchQuery.trim();
      }

      const res = await api.get("/laporan-rekap", { params });
      if (res.data?.success && res.data?.data) {
        const data = res.data.data;
        setItems(data.items || []);
        setStudentAggregates(data.studentAggregates || []);
        if (data.summary) {
          setSummary(data.summary);
        }
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
          setTotalCount(data.pagination.total || 0);
        }
      }
    } catch (error: any) {
      console.error("Gagal mengambil laporan presensi:", error);
      if (!silent) {
        toast.error(error.response?.data?.message || "Gagal memuat data laporan presensi.");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [page, limit, selectedKelompok, selectedStatus, startDate, endDate, debouncedSearchQuery]);

  const fetchLaporanRef = useRef(fetchLaporan);
  useEffect(() => {
    fetchLaporanRef.current = fetchLaporan;
  }, [fetchLaporan]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    fetchLaporan();
  }, [fetchLaporan]);

  // WebSocket Live Telemetry & Real-Time Auto Refresh untuk Developer dan DPL
  useEffect(() => {
    if (!isDeveloper && !isDpl) return;

    const unsubStatus = wsClient.onStatusChange((status) => {
      setWsStatus(status);
    });

    let debounceTimer: any = null;
    const unsubMsg = wsClient.onMessage((msg) => {
      const type = msg.type;
      if (
        type === "STUDENT_ATTENDANCE" ||
        type === "STUDENT_ATTENDANCE_UPDATE" ||
        type === "STUDENT_CHECKOUT" ||
        type === "STUDENT_PAUSE" ||
        type === "STUDENT_RESUME" ||
        type === "STUDENT_LOGOUT"
      ) {
        setLastLiveUpdate(new Date());
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          fetchLaporanRef.current(true);
        }, 1000);
      }
    });

    return () => {
      unsubStatus();
      unsubMsg();
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [isDeveloper, isDpl]);

  // Periodic background refresh every 30s when there are active sessions
  useEffect(() => {
    if (!isDeveloper) return;
    const interval = setInterval(() => {
      if (summary.berlangsung > 0 || summary.terjeda > 0) {
        fetchLaporanRef.current(true);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [isDeveloper, summary.berlangsung, summary.terjeda]);

  const handleResetFilter = () => {
    setSelectedKelompok("ALL");
    setSelectedStatus("ALL");
    setSelectedKelurahan("ALL");
    setDatePreset("TODAY");
    const nowWib = new Date(Date.now() + 7 * 60 * 60 * 1000);
    const todayStr = nowWib.toISOString().slice(0, 10);
    setStartDate(todayStr);
    setEndDate(todayStr);
    setSearchQuery("");
    setPage(1);
    if (!isDpl && typeof window !== "undefined") {
      try {
        localStorage.setItem("berseka_dev_selected_kelompok", "");
      } catch {}
    }
  };

  // Filtered student aggregates based on search query with natural roster sorting
  const filteredStudentAggregates = useMemo(() => {
    let list = studentAggregates;
    // Filter berdasarkan kelurahan
    if (selectedKelurahan !== "ALL") {
      list = list.filter(
        (s) =>
          s.kelompok?.kelurahan &&
          s.kelompok.kelurahan.toLowerCase() === selectedKelurahan.toLowerCase()
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.namaMahasiswa.toLowerCase().includes(q) ||
          s.nim.toLowerCase().includes(q) ||
          s.jurusan.toLowerCase().includes(q) ||
          (s.kelompok?.name && s.kelompok.name.toLowerCase().includes(q)) ||
          (s.kelompok?.kelurahan && s.kelompok.kelurahan.toLowerCase().includes(q))
      );
    }
    return sortStudentsRoster(list, {
      getKelompok: (s) => s.kelompok?.name,
      getIsKetua: (s) => s.isKetua,
      getName: (s) => s.namaMahasiswa,
      getNim: (s) => s.nim,
    });
  }, [studentAggregates, searchQuery, selectedKelurahan]);

  // Quick Action: View detailed log for specific student
  const handleViewStudentDetails = (studentName: string) => {
    setSearchQuery(studentName);
    setActiveTab("LOG_DETAIL");
    setPage(1);
    toast.success(`Menampilkan log presensi harian untuk: ${studentName}`);
  };

  // Daftar kelurahan unik dari groups untuk filter dropdown
  const kelurahanOptions = useMemo(() => {
    const set = new Set<string>();
    groups.forEach((g: any) => {
      if (g.kelurahan) set.add(g.kelurahan);
    });
    return Array.from(set).sort();
  }, [groups]);

  // Gating status: Ekspor hanya aktif jika tanggal awal DAN tanggal akhir telah diisi
  const isExportDisabled = !startDate || !endDate;

  const handleExportExcel = () => {
    // Validasi: filter tanggal wajib diisi sebelum ekspor
    if (!startDate || !endDate) {
      toast.error("Pilih tanggal awal dan tanggal akhir terlebih dahulu sebelum mengekspor.");
      return;
    }

    if (activeTab === "REKAP_MAHASISWA") {
      if (filteredStudentAggregates.length === 0) {
        toast.error("Tidak ada data rekapitulasi untuk diekspor.");
        return;
      }

      const headers = [
        "No",
        "NIM",
        "Nama Mahasiswa",
        "Jabatan",
        "Jurusan / Program Studi",
        "Kelompok KKN",
        "Kelurahan",
        "Dosen Pendamping Lapangan (DPL)",
        "Total Hari/Sesi Hadir",
        "Total Menit Aktual (DA)",
        "Total Jam Aktual",
        `Target Jam Periode (${periodLabel})`,
        "Rasio Capaian (%)",
        "Rerata Menit / Hari",
        "Rerata Jam / Hari",
        "Sesi Memenuhi Target (>= 4 Jam)",
        "Sesi Kurang Jam (< 4 Jam)",
        "Izin / Sakit",
        "Status Akumulasi",
      ];

      const rows = filteredStudentAggregates.map((s, idx) => {
        const percent = Math.min(100, Math.max(0, Number(((s.totalHours / (periodTargetHours || 1)) * 100).toFixed(1))));
        const statusAkhir = s.totalHours >= periodTargetHours ? "TARGET TERCAPAI" : percent >= 70 ? "ON TRACK" : "PERLU PENINGKATAN";
        return [
          idx + 1,
          s.nim,
          s.namaMahasiswa,
          s.isKetua ? "Ketua Kelompok" : "Anggota",
          s.jurusan,
          s.kelompok?.name ?? "-",
          s.kelompok?.kelurahan ?? "-",
          s.kelompok?.dplName ?? "-",
          s.totalSessions,
          s.totalMinutes,
          s.totalHours,
          periodTargetHours,
          `${percent}%`,
          s.avgMinutesPerDay,
          s.avgFormatted,
          s.hadirMemenuhi,
          s.hadirKurang,
          s.izinSakit,
          statusAkhir,
        ];
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      ws["!cols"] = [
        { wch: 5 },
        { wch: 16 },
        { wch: 28 },
        { wch: 16 },
        { wch: 24 },
        { wch: 22 },
        { wch: 18 },
        { wch: 26 },
        { wch: 14 },
        { wch: 16 },
        { wch: 14 },
        { wch: 16 },
        { wch: 14 },
        { wch: 16 },
        { wch: 16 },
        { wch: 16 },
        { wch: 14 },
        { wch: 12 },
        { wch: 18 },
      ];
      XLSX.utils.book_append_sheet(wb, ws, "Rekap Akumulasi");
      const filename = `Rekap_Akumulasi_Mahasiswa_KKN_${periodLabel.replace(/[\s\(\)\.]+/g, "_")}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, filename);
      toast.success("Berhasil mengunduh rekapitulasi akumulasi Excel (.xlsx).");
    } else {
      if (items.length === 0) {
        toast.error("Tidak ada data log sesi presensi untuk diekspor.");
        return;
      }

      const headers = [
        "No",
        "Tanggal",
        "NIM",
        "Nama Mahasiswa",
        "Jurusan / Prodi",
        "Kelompok KKN",
        "Kelurahan",
        "DPL",
        "Jam Masuk (JM)",
        "Jam Pulang (JP)",
        "Durasi Jeda (Menit)",
        "Durasi Aktual Bersih (JP - JM / Menit)",
        "Durasi Formatted",
        "Target Minimal Harian (Menit)",
        "Rasio Kehadiran (%)",
        "Status Keterpenuhan (Target 4 Jam)",
        "Status Kehadiran",
        "Deskripsi Kegiatan",
        "Foto Dokumentasi URL",
      ];

      const rows = items.map((it, idx) => {
        const actualMins = it.durasiAktualMenit ?? it.durasiMenit ?? 0;
        const targetMin = it.targetMinMenit ?? 240;
        const jedaMins = it.durasiJedaMenit ?? 0;
        const rasio = Math.min(100, Math.max(0, it.rasioKehadiran ?? Number(((actualMins / targetMin) * 100).toFixed(1))));
        const keterpenuhan = it.isMemenuhiDurasi ? "MEMENUHI (>= 4 Jam)" : "KURANG DARI TARGET (< 4 Jam)";

        return [
          (page - 1) * limit + idx + 1,
          it.tanggal,
          it.nim,
          it.namaMahasiswa,
          it.jurusan,
          it.kelompok?.name ?? "-",
          it.kelompok?.kelurahan ?? "-",
          it.kelompok?.dplName ?? "-",
          it.jamMasuk,
          it.jamPulang === "-" ? "Sedang Lapangan" : it.jamPulang,
          jedaMins,
          actualMins,
          it.durasiFormatted,
          targetMin,
          `${rasio}%`,
          keterpenuhan,
          it.statusDisplay,
          it.deskripsiKegiatan || "-",
          it.fotoUrl || "-",
        ];
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      ws["!cols"] = [
        { wch: 5 },
        { wch: 12 },
        { wch: 16 },
        { wch: 28 },
        { wch: 24 },
        { wch: 22 },
        { wch: 18 },
        { wch: 26 },
        { wch: 14 },
        { wch: 14 },
        { wch: 22 },
        { wch: 18 },
        { wch: 18 },
        { wch: 16 },
        { wch: 24 },
        { wch: 20 },
        { wch: 40 },
        { wch: 35 },
      ];
      XLSX.utils.book_append_sheet(wb, ws, "Log Detail Presensi");
      const filename = `Log_Detail_Presensi_KKN_${startDate || "HariIni"}_sd_${endDate || "HariIni"}.xlsx`;
      XLSX.writeFile(wb, filename);
      toast.success("Berhasil mengunduh log detail presensi Excel (.xlsx).");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Header & Page Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/60 rounded-2xl text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
              <FileCheck2 size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  Laporan &amp; Akumulasi Presensi KKN
                </h1>
                {isDeveloper && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 shadow-2xs">
                    Developer Mode
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Pantau akumulasi jam kerja mingguan/total mahasiswa, target pemenuhan jam kerja, dan log presensi harian secara akurat.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons & Live Indicator */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <Link
            to="/monitoring-kegiatan/presensi"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition shadow-2xs cursor-pointer active:scale-95"
            title="Kembali ke menu Monitoring & Peta Presensi Mahasiswa"
          >
            <ChevronLeft size={15} className="text-slate-500" />
            <span>Kembali ke Menu Presensi</span>
          </Link>

          {isDeveloper && (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-xs font-black text-emerald-800 dark:text-emerald-300 shadow-2xs"
              title={wsStatus === "CONNECTED" ? "Terhubung ke Live Stream Telemetri Presensi" : "Mencoba menghubungkan..."}
            >
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    wsStatus === "CONNECTED" ? "bg-emerald-400" : "bg-amber-400"
                  }`}
                ></span>
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    wsStatus === "CONNECTED" ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                ></span>
              </span>
              <span>{wsStatus === "CONNECTED" ? "Live Telemetry Active" : "Connecting..."}</span>
              {lastLiveUpdate && (
                <span className="text-[10px] text-emerald-600 font-mono">
                  ({lastLiveUpdate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })})
                </span>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => fetchLaporan()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 transition shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
            title="Muat Ulang Data"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-emerald-600" : "text-slate-600"} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Ringkasan */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {/* Total Mahasiswa Terdata */}
        <div className="bg-white dark:bg-slate-800/90 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Mahasiswa</span>
            <Users size={15} className="text-blue-500" />
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1.5">
            {studentAggregates.length}
          </p>
          <span className="text-[10px] text-slate-400 font-medium">Dalam Filter Aktif</span>
        </div>

        {/* Total Sesi Presensi */}
        <div className="bg-white dark:bg-slate-800/90 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Sesi Lapangan</span>
            <FileText size={15} className="text-indigo-500" />
          </div>
          <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1.5">
            {summary.totalPresensi}
          </p>
          <span className="text-[10px] text-slate-400 font-medium">Sesi Kehadiran Terdata</span>
        </div>

        {/* Total Jam Kolektif & Rerata per Mahasiswa / Hari */}
        <div className="bg-white dark:bg-slate-800/90 p-3.5 rounded-2xl border border-purple-200/80 dark:border-purple-900/50 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Jam Kolektif</span>
            <Clock size={15} className="text-purple-500" />
          </div>
          <p className="text-xl font-black text-purple-600 dark:text-purple-400 mt-1.5">
            {summary.totalJamKumulatif} <span className="text-xs font-bold text-slate-500">Jam</span>
          </p>
          <span
            className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold truncate block"
            title={`Rerata: ${rerataJamPerMhsPerHari} Jam/mahasiswa/hari`}
          >
            Rerata: {rerataJamPerMhsPerHari} Jam/mahasiswa/hari
          </span>
        </div>

        {/* Sesi Memenuhi Target */}
        <div className="bg-white dark:bg-slate-800/90 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Sesi Memenuhi</span>
            <CheckCircle2 size={15} className="text-emerald-500" />
          </div>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1.5">
            {summary.hadirMemenuhi} <span className="text-xs font-bold text-slate-400">Sesi</span>
          </p>
          <span className="text-[10px] text-slate-400 font-medium">
            {summary.totalPresensi > 0
              ? `${Math.round((summary.hadirMemenuhi / summary.totalPresensi) * 100)}% dari Total Sesi`
              : "0%"}
          </span>
        </div>

        {/* Sesi Durasi Kurang (Sebelumnya ambigu 'Kurang Jam: 11') */}
        <div className="bg-white dark:bg-slate-800/90 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Sesi Durasi Kurang</span>
            <AlertTriangle size={15} className="text-amber-500" />
          </div>
          <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1.5">
            {summary.hadirKurang} <span className="text-xs font-bold text-slate-400">Sesi</span>
          </p>
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
            {summary.totalPresensi > 0
              ? `${Math.round((summary.hadirKurang / summary.totalPresensi) * 100)}% di Bawah Target`
              : "0%"}
          </span>
        </div>

        {/* Sesi Sedang Lapangan / Terjeda */}
        <div className="bg-white dark:bg-slate-800/90 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Live Lapangan</span>
            <Activity size={15} className="text-emerald-500 animate-pulse" />
          </div>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1.5">
            {summary.berlangsung + summary.terjeda} <span className="text-xs font-bold text-slate-400">Sesi</span>
          </p>
          <span className="text-[10px] text-slate-400 font-medium">
            {summary.berlangsung} Aktif • {summary.terjeda} Terjeda
          </span>
        </div>
      </div>

      {/* Filter Panel & Preset Bar */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 mb-6 shadow-2xs space-y-3.5">
        {/* Quick Date Presets Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <Calendar size={13} className="text-emerald-600" />
              <span>Periode Cepat:</span>
            </span>

            <button
              type="button"
              onClick={() => handleDatePreset("7DAYS")}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                datePreset === "7DAYS"
                  ? "bg-emerald-600 text-white shadow-2xs font-extrabold"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              <Sparkles size={12} className={datePreset === "7DAYS" ? "text-amber-300" : "text-slate-400"} />
              <span>Seminggu Ini (7 Hari)</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${datePreset === "7DAYS" ? "bg-emerald-700 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"}`}>
                Target {5 * (Number(configTargets.attendanceMinDurationHours || configTargets.targetHarianJam) || 4)} Jam
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleDatePreset("TODAY")}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                datePreset === "TODAY"
                  ? "bg-emerald-600 text-white shadow-2xs font-extrabold"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              <span>Hari Ini (Live)</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${datePreset === "TODAY" ? "bg-emerald-700 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"}`}>
                Target {Number(configTargets.attendanceMinDurationHours || configTargets.targetHarianJam) || 4} Jam
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleDatePreset("30DAYS")}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                datePreset === "30DAYS"
                  ? "bg-emerald-600 text-white shadow-2xs font-extrabold"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              <span>30 Hari Terakhir</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${datePreset === "30DAYS" ? "bg-emerald-700 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"}`}>
                Target {20 * (Number(configTargets.attendanceMinDurationHours || configTargets.targetHarianJam) || 4)} Jam
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleDatePreset("ALL")}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                datePreset === "ALL" && !startDate && !endDate
                  ? "bg-emerald-600 text-white shadow-2xs font-extrabold"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              <span>Semua Waktu</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${datePreset === "ALL" && !startDate && !endDate ? "bg-emerald-700 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"}`}>
                Target {Number(configTargets.targetTotalJam) || 200} Jam
              </span>
            </button>
          </div>

          {/* Info Banner Target Periode */}
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-emerald-50/80 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200/80 dark:border-emerald-800/80">
            <Target size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span>Target Kumulatif Periode ({periodLabel}):</span>
            <span className="font-black text-emerald-800 dark:text-emerald-300">{periodTargetHours} Jam</span>
          </div>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
          {/* 1. Search (3 cols) */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-3">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              Pencarian Mahasiswa / NIM
            </label>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari Nama, NIM, Jurusan..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full h-10 pl-9 pr-8 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 focus:bg-white focus:border-emerald-500 outline-none transition font-medium shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* 2. Kelompok KKN (2 cols) */}
          <div className="col-span-1 sm:col-span-1 lg:col-span-2">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 truncate">
              Kelompok KKN {isDpl && <span className="text-emerald-600 font-semibold">(Binaan)</span>}
            </label>
            <select
              value={selectedKelompok}
              onChange={(e) => handleSelectKelompok(e.target.value)}
              className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 focus:bg-white focus:border-emerald-500 outline-none transition font-medium shadow-2xs cursor-pointer truncate"
            >
              <option value="ALL">🌟 Semua Kelompok ({groups.length} Posko)</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} - Kel. {g.kelurahan ?? "-"}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Filter Kelurahan (2 cols) */}
          <div className="col-span-1 sm:col-span-1 lg:col-span-2">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1">
              <MapPin size={11} className="text-emerald-600" />
              Kelurahan
              {selectedKelurahan !== "ALL" && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  Aktif
                </span>
              )}
            </label>
            <select
              value={selectedKelurahan}
              onChange={(e) => {
                setSelectedKelurahan(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 focus:bg-white focus:border-emerald-500 outline-none transition font-medium shadow-2xs cursor-pointer truncate"
            >
              <option value="ALL">📍 Semua Kelurahan</option>
              {kelurahanOptions.map((kel) => (
                <option key={kel} value={kel}>
                  Kel. {kel}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Dari Tanggal (2 cols) */}
          <div className="col-span-1 sm:col-span-1 lg:col-span-2">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              Dari Tanggal
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDatePreset("ALL");
                setPage(1);
              }}
              className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 focus:bg-white focus:border-emerald-500 outline-none transition font-medium shadow-2xs cursor-pointer"
            />
          </div>

          {/* 5. Sampai Tanggal (1 col) */}
          <div className="col-span-1 sm:col-span-1 lg:col-span-1">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              Sampai
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDatePreset("ALL");
                setPage(1);
              }}
              className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 focus:bg-white focus:border-emerald-500 outline-none transition font-medium shadow-2xs cursor-pointer"
            />
          </div>

          {/* 6. Actions: Reset & Ekspor (2 cols) */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-2 flex items-end gap-2">
            <button
              type="button"
              onClick={handleResetFilter}
              title="Reset Filter ke Default"
              className="h-10 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition shrink-0 cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-2xs"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={!startDate || !endDate}
              className="h-10 px-3.5 flex-1 text-xs font-bold rounded-xl border transition shadow-2xs flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700/60 cursor-pointer active:scale-95 whitespace-nowrap"
              title={(!startDate || !endDate) ? "Pilih rentang tanggal terlebih dahulu untuk mengekspor" : "Ekspor data ke format Excel XLSX"}
            >
              <FileSpreadsheet size={14} />
              <span>Ekspor XLSX</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Card with Dual-Tab Switcher */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden mb-6">
        {/* Table Toolbar & View Switcher */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3.5 bg-slate-50/70 dark:bg-slate-800/50">
          {/* Dual Tabs */}
          <div className="w-full md:w-auto overflow-x-auto scrollbar-none -mx-1 px-1">
            <div className="inline-flex items-center gap-1.5 bg-slate-200/70 dark:bg-slate-900/80 p-1 rounded-xl min-w-max">
              <button
                type="button"
                onClick={() => setActiveTab("REKAP_MAHASISWA")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer whitespace-nowrap ${
                  activeTab === "REKAP_MAHASISWA"
                    ? "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <BarChart3 size={14} className="shrink-0" />
                <span>Rekapitulasi Akumulasi Mahasiswa</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold shrink-0 ${
                  activeTab === "REKAP_MAHASISWA" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-slate-300 dark:bg-slate-800 text-slate-600"
                }`}>
                  {filteredStudentAggregates.length} Mahasiswa
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("LOG_DETAIL")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer whitespace-nowrap ${
                  activeTab === "LOG_DETAIL"
                    ? "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <ListFilter size={14} className="shrink-0" />
                <span>Log Presensi Detail</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold shrink-0 ${
                  activeTab === "LOG_DETAIL" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-slate-300 dark:bg-slate-800 text-slate-600"
                }`}>
                  {totalCount} Sesi
                </span>
              </button>
            </div>
          </div>

          {/* Print Action Button */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-2xs cursor-pointer"
            >
              <Printer size={14} />
              <span>Cetak</span>
            </button>
          </div>
        </div>

        {/* TAB 1: REKAPITULASI AKUMULASI MAHASISWA */}
        {activeTab === "REKAP_MAHASISWA" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 w-12 text-center text-emerald-700">#</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Mahasiswa &amp; NIM</th>
                  <th className="py-3.5 px-4 min-w-[150px]">Kelompok &amp; DPL</th>
                  <th className="py-3.5 px-4 text-center">Total Hari/Sesi</th>
                  <th className="py-3.5 px-4 text-center min-w-[130px]">Total Akumulasi Aktual (DA)</th>
                  <th className="py-3.5 px-4 text-center min-w-[170px]">
                    Target &amp; Capaian ({periodLabel})
                  </th>
                  <th className="py-3.5 px-4 text-center">Rerata / Hari</th>
                  <th className="py-3.5 px-4 text-center">Status Akumulasi</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-14 text-center text-slate-400">
                      <RefreshCw size={24} className="animate-spin text-emerald-600 mx-auto mb-2" />
                      <span className="font-semibold">Menghitung dan memuat data akumulasi mahasiswa...</span>
                    </td>
                  </tr>
                ) : filteredStudentAggregates.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12">
                      <EmptyTableState
                        title="Tidak Ada Data Akumulasi Mahasiswa"
                        description="Tidak ditemukan riwayat kehadiran mahasiswa untuk filter yang dipilih."
                      />
                    </td>
                  </tr>
                ) : (
                  filteredStudentAggregates.map((student, idx) => {
                    const percentCapaian = Math.min(100, Math.max(0, Number(((student.totalHours / (periodTargetHours || 1)) * 100).toFixed(1))));
                    const isTargetMet = student.totalHours >= periodTargetHours;
                    const remainingHours = Math.max(0, Math.round((periodTargetHours - student.totalHours) * 10) / 10);

                    return (
                      <tr
                        key={student.studentId}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        {/* No */}
                        <td className="py-3.5 px-4 text-center text-slate-400 font-bold">
                          {idx + 1}
                        </td>

                        {/* Mahasiswa & NIM */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            {student.fotoProfil ? (
                              <img
                                src={student.fotoProfil}
                                alt={student.namaMahasiswa}
                                className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-black flex items-center justify-center text-xs shrink-0 border border-emerald-200 dark:border-emerald-800">
                                {student.namaMahasiswa.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 dark:text-white text-xs">
                                  {formatPersonName(student.namaMahasiswa)}
                                </span>
                                {student.isKetua && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-100 text-amber-800 dark:bg-amber-955 dark:text-amber-300 border border-amber-300">
                                    Ketua
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 font-mono">
                                NIM: {student.nim} • {formatProdiName(student.jurusan)}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Kelompok & DPL */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {student.kelompok?.name ? formatKelompokName(student.kelompok.name) : "Tanpa Kelompok"}
                          </div>
                          <p className="text-[11px] text-slate-400">
                            {student.kelompok?.kelurahan ? formatWilayahName(`Kel. ${student.kelompok.kelurahan}`) : "-"} • DPL: {formatPersonName(student.kelompok?.dplName)}
                          </p>
                        </td>

                        {/* Total Hari/Sesi */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="font-black text-slate-800 dark:text-slate-100 text-sm">
                            {student.totalSessions}
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">Hari Hadir</span>
                        </td>

                        {/* Total Akumulasi Aktual */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="font-mono font-black text-emerald-700 dark:text-emerald-400 text-sm">
                            {student.totalFormatted}
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">
                            ({student.totalHours} Jam Total)
                          </span>
                        </td>

                        {/* Target & Capaian Periode */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-800 dark:text-slate-100">
                              <span>{student.totalHours} Jam</span>
                              <span className="text-slate-400">/</span>
                              <span className="text-emerald-700 dark:text-emerald-400">{periodTargetHours} Jam</span>
                            </div>
                            {/* Progress bar */}
                            <div className="w-full max-w-[140px] bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  isTargetMet ? "bg-emerald-600" : percentCapaian >= 70 ? "bg-emerald-500" : "bg-amber-500"
                                }`}
                                style={{ width: `${Math.min(100, percentCapaian)}%` }}
                              />
                            </div>
                            <span className={`text-[10px] font-black ${isTargetMet ? "text-emerald-700 dark:text-emerald-400" : "text-slate-500"}`}>
                              {percentCapaian}% {isTargetMet ? "🌟 Tercapai" : `(Kurang ${remainingHours} Jam)`}
                            </span>
                          </div>
                        </td>

                        {/* Rerata / Hari */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            {student.avgFormatted}
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">per sesi hadir</span>
                        </td>

                        {/* Status Akumulasi */}
                        <td className="py-3.5 px-4 text-center">
                          {isTargetMet ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700 shadow-2xs">
                              <CheckCircle2 size={12} className="text-emerald-600" />
                              <span>Target Tercapai</span>
                            </span>
                          ) : percentCapaian >= 70 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700">
                              <TrendingUp size={12} className="text-blue-600" />
                              <span>On Track</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-955 dark:text-amber-300 dark:border-amber-700">
                              <AlertTriangle size={12} className="text-amber-600" />
                              <span>Perlu Peningkatan</span>
                            </span>
                          )}
                        </td>

                        {/* Aksi */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleOpenStudentLogModal(student)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs active:scale-95"
                            title="Lihat riwayat log kehadiran harian dan bukti jejak mahasiswa ini"
                          >
                            <span>Lihat Log</span>
                            <ArrowRight size={12} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: LOG PRESENSI DETAIL SESI */}
        {activeTab === "LOG_DETAIL" && (
          <div>
            {searchQuery && (
              <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-3 bg-emerald-50/90 dark:bg-emerald-950/50 border-b border-emerald-100 dark:border-emerald-900/60 text-xs text-emerald-900 dark:text-emerald-200">
                <div className="flex items-center gap-2">
                  <ListFilter size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>
                    Menampilkan riwayat log sesi presensi untuk: <strong className="text-emerald-950 dark:text-white underline decoration-emerald-400 font-extrabold">{searchQuery}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setPage(1);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/80 dark:hover:bg-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-bold transition cursor-pointer shadow-2xs active:scale-95"
                  >
                    ✕ Tampilkan Semua Mahasiswa
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setActiveTab("REKAP_MAHASISWA");
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer shadow-2xs active:scale-95 flex items-center gap-1"
                  >
                    <ChevronLeft size={13} />
                    <span>Kembali ke Rekapitulasi Mahasiswa</span>
                  </button>
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 w-12 text-center text-emerald-700">#</th>
                  <th className="py-3.5 px-4 min-w-[190px]">Mahasiswa &amp; NIM</th>
                  <th className="py-3.5 px-4 min-w-[150px]">Kelompok &amp; DPL</th>
                  <th className="py-3.5 px-4">Tanggal</th>
                  <th className="py-3.5 px-4 text-center">Jam Masuk (JM)</th>
                  <th className="py-3.5 px-4 text-center">Jam Pulang (JP)</th>
                  <th className="py-3.5 px-3 text-center min-w-[110px] bg-amber-50/60 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300" title="Durasi Jeda (DJ) — waktu istirahat atau jeda di luar zona">
                    Durasi Jeda (DJ)
                  </th>
                  <th className="py-3.5 px-4 text-center min-w-[130px]" title="Durasi Bersih = (JP − JM) − DJ">
                    Durasi Bersih (DA)
                  </th>
                  <th className="py-3.5 px-4 text-center">Rasio Kehadiran (%)</th>
                  <th className="py-3.5 px-4 text-center min-w-[150px]">Status Keterpenuhan</th>
                  <th className="py-3.5 px-4 min-w-[180px]">Deskripsi Kegiatan</th>
                  <th className="py-3.5 px-4 text-center">Foto Bukti</th>
                  <th className="py-3.5 px-4 text-center min-w-[100px]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={13} className="py-12 text-center text-slate-400">
                      <RefreshCw size={24} className="animate-spin text-emerald-600 mx-auto mb-2" />
                      <span>Memuat data log presensi detail...</span>
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="py-12">
                      <EmptyTableState
                        title="Tidak Ada Log Sesi Presensi"
                        description="Tidak ditemukan riwayat kehadiran dengan filter yang dipilih."
                      />
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => {
                    const isMemenuhi = item.isMemenuhiDurasi;
                    const isTerjeda = item.status === "TERJEDA";
                    const isBerlangsung = item.status === "BERLANGSUNG";
                    const isIzinSakit = item.status.includes("IZIN") || item.status.includes("SAKIT");
                    const actualMins = item.durasiAktualMenit ?? item.durasiMenit ?? 0;
                    const targetMin = item.targetMinMenit ?? 240;
                    const rasio = Math.min(100, Math.max(0, item.rasioKehadiran ?? Number(((actualMins / targetMin) * 100).toFixed(1))));
                    const jedaMins = item.durasiJedaMenit ?? 0;

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        {/* No */}
                        <td className="py-3.5 px-4 text-center text-slate-400 font-semibold">
                          {(page - 1) * limit + idx + 1}
                        </td>

                        {/* Mahasiswa & NIM */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            {item.fotoProfil ? (
                              <img
                                src={item.fotoProfil}
                                alt={item.namaMahasiswa}
                                className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center text-xs shrink-0">
                                {item.namaMahasiswa.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 dark:text-white">
                                  {item.namaMahasiswa}
                                </span>
                                {item.isKetua && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-955/80 dark:text-amber-300 border border-amber-300">
                                    Ketua
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 font-mono">
                                NIM: {item.nim} • {item.jurusan}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Kelompok & DPL */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {item.kelompok?.name ?? "Tanpa Kelompok"}
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Kel. {item.kelompok?.kelurahan ?? "-"} • DPL: {item.kelompok?.dplName ?? "-"}
                          </p>
                        </td>

                        {/* Tanggal */}
                        <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                          {item.tanggal}
                        </td>

                        {/* Jam Masuk (JM) */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono font-bold text-xs border border-emerald-200 dark:border-emerald-800">
                            {item.jamMasuk} WIB
                          </span>
                        </td>

                        {/* Jam Pulang (JP) */}
                        <td className="py-3.5 px-4 text-center">
                          {item.jamPulang === "-" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 font-bold text-xs animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <span>Aktif</span>
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold text-xs border border-slate-200 dark:border-slate-700">
                              {item.jamPulang} WIB
                            </span>
                          )}
                        </td>

                        {/* Durasi Jeda (DJ) */}
                        <td className="py-3.5 px-3 text-center bg-amber-50/30 dark:bg-amber-950/10">
                          <div className={`font-mono font-bold text-xs ${jedaMins > 0 ? "text-amber-700 dark:text-amber-400" : "text-slate-400"}`}>
                            {item.durasiJedaFormatted || `${jedaMins} Menit`}
                          </div>
                          {jedaMins > 0 && (
                            <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80 font-mono">
                              ({jedaMins} mnt)
                            </span>
                          )}
                        </td>

                        {/* Durasi Bersih (JP - JM) */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="font-mono font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1">
                            <span>{item.durasiFormatted}</span>
                            {isBerlangsung && (
                              <span className="text-[10px] text-emerald-600 font-bold animate-pulse">(Live)</span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium font-mono">
                            {item.durasiMenit} Menit Bersih
                          </span>
                        </td>

                        {/* Rasio Kehadiran (%) */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="font-mono font-bold text-slate-800 dark:text-slate-100 text-xs">
                            {rasio}%
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium font-mono">
                            DA/TM ({actualMins}/{targetMin}m)
                          </span>
                        </td>

                        {/* Status Keterpenuhan */}
                        <td className="py-3.5 px-4 text-center">
                          {isMemenuhi ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700 shadow-2xs">
                              <CheckCircle2 size={12} className="text-emerald-600" />
                              <span>Memenuhi (&ge; 4 Jam)</span>
                            </span>
                          ) : isBerlangsung ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                              <span>Sedang Lapangan</span>
                            </span>
                          ) : isTerjeda ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                              <PauseCircle size={12} className="text-slate-500" />
                              <span>Terjeda</span>
                            </span>
                          ) : isIzinSakit ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700">
                              <FileText size={12} className="text-blue-600" />
                              <span>{item.statusDisplay}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700">
                              <AlertTriangle size={12} className="text-amber-600" />
                              <span>Kurang Jam (&lt; 4 Jam)</span>
                            </span>
                          )}
                        </td>

                        {/* Deskripsi Kegiatan & Catatan Jeda */}
                        <td className="py-3.5 px-4">
                          {item.deskripsiKegiatan ? (
                            <div className="max-w-xs">
                              <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2">
                                {item.deskripsiKegiatan}
                              </p>
                              {item.deskripsiKegiatan.length > 80 && (
                                <button
                                  onClick={() =>
                                    setPreviewDesc({
                                      student: item.namaMahasiswa,
                                      desc: item.deskripsiKegiatan!,
                                      time: `${item.tanggal} (${item.jamMasuk} - ${item.jamPulang})`,
                                    })
                                  }
                                  className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline mt-0.5 inline-block cursor-pointer"
                                >
                                  Baca Selengkapnya...
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Tidak ada catatan</span>
                          )}

                          {item.jedaLogs && item.jedaLogs.length > 0 && (
                            <div className="mt-1.5 p-1.5 rounded-lg bg-amber-50 dark:bg-amber-955/60 border border-amber-200 dark:border-amber-800/80 text-[10px] text-amber-900 dark:text-amber-200 flex items-start gap-1 max-w-xs">
                              <PauseCircle size={12} className="text-amber-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold">Jeda: </span>
                                <span>{item.jedaLogs[item.jedaLogs.length - 1]?.alasan || "Sesi Dijeda"}</span>
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Foto Bukti */}
                        <td className="py-3.5 px-4 text-center">
                          {item.fotoUrl ? (
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewPhoto({
                                  url: item.fotoUrl!,
                                  title: `Foto Dokumentasi - ${item.namaMahasiswa}`,
                                  desc: item.deskripsiKegiatan,
                                })
                              }
                              className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:hover:bg-emerald-900 dark:text-emerald-300 rounded-lg text-xs font-semibold transition border border-emerald-200 dark:border-emerald-800 cursor-pointer shadow-2xs"
                            >
                              <ImageIcon size={12} />
                              <span>Lihat</span>
                            </button>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </td>

                        {/* Aksi */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                const st = studentAggregates.find((s) => s.studentId === item.studentId || s.nim === item.nim) || {
                                  studentId: item.studentId,
                                  namaMahasiswa: item.namaMahasiswa,
                                  nim: item.nim,
                                  jurusan: item.jurusan,
                                  fotoProfil: item.fotoProfil,
                                  isKetua: item.isKetua,
                                  kelompok: item.kelompok,
                                  totalSessions: 1,
                                  totalMinutes: item.durasiMenit,
                                  totalHours: Math.round((item.durasiMenit / 60) * 10) / 10,
                                  totalFormatted: item.durasiFormatted,
                                  avgMinutesPerDay: item.durasiMenit,
                                  avgFormatted: item.durasiFormatted,
                                  hadirMemenuhi: item.isMemenuhiDurasi ? 1 : 0,
                                  hadirKurang: !item.isMemenuhiDurasi ? 1 : 0,
                                  berlangsung: item.status === "BERLANGSUNG" ? 1 : 0,
                                  terjeda: item.status === "TERJEDA" ? 1 : 0,
                                  izinSakit: item.status.includes("IZIN") || item.status.includes("SAKIT") ? 1 : 0,
                                };
                                handleOpenStudentLogModal(st);
                              }}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 dark:text-emerald-300 rounded-lg transition border border-emerald-200 dark:border-emerald-800 cursor-pointer shadow-2xs"
                              title="Lihat Log Lengkap & Bukti Jejak Mahasiswa"
                            >
                              <Eye size={13} />
                            </button>
                            {isBerlangsung && (
                              <button
                                type="button"
                                onClick={() => handlePromptForceCheckout(item)}
                                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 dark:text-emerald-300 rounded-lg transition border border-emerald-200 dark:border-emerald-800 cursor-pointer"
                                title="Selesaikan Sesi Lapangan (Force Check-Out)"
                              >
                                <CheckCircle2 size={13} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-lg transition border border-slate-200 dark:border-slate-700 cursor-pointer"
                              title="Edit Jam Masuk / Jam Pulang / Durasi Presensi"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteItem(item)}
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/60 dark:hover:bg-red-900 dark:text-red-300 rounded-lg transition border border-red-200 dark:border-red-800 cursor-pointer"
                              title="Hapus Data Presensi"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar for Log Detail */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="text-slate-500">
                Menampilkan <span className="font-bold text-slate-800 dark:text-slate-200">{items.length}</span> dari{" "}
                <span className="font-bold text-slate-800 dark:text-slate-200">{totalCount}</span> sesi presensi
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loading}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 hover:bg-slate-50 transition cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="px-3 py-1 font-bold text-slate-700 dark:text-slate-300">
                  Halaman {page} dari {totalPages || 1}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || loading}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 hover:bg-slate-50 transition cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Preview Foto */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPreviewPhoto(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                {previewPhoto.title}
              </h3>
              <button
                onClick={() => setPreviewPhoto(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 flex flex-col items-center bg-slate-950">
              <img
                src={previewPhoto.url}
                alt="Dokumentasi"
                className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-md"
              />
              {previewPhoto.desc && (
                <div className="mt-3 p-3 bg-slate-900 text-slate-200 text-xs rounded-xl w-full border border-slate-800">
                  <span className="font-bold text-emerald-400 block mb-1">Deskripsi Kegiatan:</span>
                  <p>{previewPhoto.desc}</p>
                </div>
              )}
            </div>
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-900/80">
              <a
                href={previewPhoto.url}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition cursor-pointer"
              >
                <ExternalLink size={13} />
                <span>Buka Gambar Asli</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail Deskripsi */}
      {previewDesc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPreviewDesc(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Laporan Kegiatan: {previewDesc.student}
                </h3>
                <span className="text-[11px] text-slate-400">{previewDesc.time}</span>
              </div>
              <button
                onClick={() => setPreviewDesc(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 whitespace-pre-wrap max-h-60 overflow-y-auto">
              {previewDesc.desc}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setPreviewDesc(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit / Manipulasi Presensi */}
      {editItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEditItem(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-950/60 rounded-xl text-blue-700 dark:text-blue-400">
                  <SlidersHorizontal size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Edit &amp; Manipulasi Presensi
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {editItem.namaMahasiswa} ({editItem.nim})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tanggal Presensi
                </label>
                <input
                  type="date"
                  value={editForm.tanggal}
                  onChange={(e) => setEditForm((f) => ({ ...f, tanggal: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Jam Masuk (Mulai)
                  </label>
                  <input
                    type="time"
                    value={editForm.jamMasuk}
                    onChange={(e) => setEditForm((f) => ({ ...f, jamMasuk: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Jam Pulang (Selesai)
                  </label>
                  <input
                    type="time"
                    value={editForm.jamPulang}
                    onChange={(e) => setEditForm((f) => ({ ...f, jamPulang: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Durasi (Menit)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={600}
                    value={editForm.durasiMenit}
                    onChange={(e) => setEditForm((f) => ({ ...f, durasiMenit: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    {Math.floor(editForm.durasiMenit / 60)} jam {editForm.durasiMenit % 60} menit
                  </span>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status Kehadiran
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="HADIR_MEMENUHI">HADIR_MEMENUHI (Hadir &amp; Memenuhi)</option>
                    <option value="HADIR_TIDAK_MEMENUHI">HADIR_TIDAK_MEMENUHI (Kurang Jam)</option>
                    <option value="BERLANGSUNG">BERLANGSUNG (Sedang di Lapangan)</option>
                    <option value="TERJEDA">TERJEDA</option>
                    <option value="IZIN">IZIN (Disetujui)</option>
                    <option value="SAKIT">SAKIT (Disetujui)</option>
                    <option value="ALPA">ALPA (Tanpa Keterangan)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Deskripsi / Catatan Kegiatan
                </label>
                <textarea
                  rows={3}
                  value={editForm.deskripsiKegiatan}
                  onChange={(e) => setEditForm((f) => ({ ...f, deskripsiKegiatan: e.target.value }))}
                  placeholder="Deskripsi aktivitas kegiatan presensi..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditItem(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
              >
                {isSavingEdit ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail Log & Jejak Kehadiran Mahasiswa */}
      {selectedStudentForLog && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150" onClick={() => setSelectedStudentForLog(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/60">
              <div className="flex items-center gap-3">
                {selectedStudentForLog.fotoProfil ? (
                  <img
                    src={selectedStudentForLog.fotoProfil}
                    alt={selectedStudentForLog.namaMahasiswa}
                    className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500 shrink-0 shadow-2xs"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-black flex items-center justify-center text-sm shrink-0 border border-emerald-300 dark:border-emerald-700 shadow-2xs">
                    {selectedStudentForLog.namaMahasiswa.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base text-slate-900 dark:text-white">
                      {formatPersonName(selectedStudentForLog.namaMahasiswa)}
                    </h3>
                    {selectedStudentForLog.isKetua && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-955 dark:text-amber-300 border border-amber-300 shadow-2xs">
                        Ketua Kelompok
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    NIM: {selectedStudentForLog.nim} • {formatProdiName(selectedStudentForLog.jurusan)}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {selectedStudentForLog.kelompok?.name ? formatKelompokName(selectedStudentForLog.kelompok.name) : "Tanpa Kelompok"} • DPL: {formatPersonName(selectedStudentForLog.kelompok?.dplName)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentForLog(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Tutup"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
              {/* Summary Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-800 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hari Hadir</span>
                  <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                    {selectedStudentForLog.totalSessions} <span className="text-xs font-semibold text-slate-400">Sesi</span>
                  </p>
                </div>
                <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/40 rounded-xl border border-emerald-200/80 dark:border-emerald-800/80 text-center">
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">Akumulasi Aktual</span>
                  <p className="text-lg font-black text-emerald-700 dark:text-emerald-300 mt-0.5">
                    {selectedStudentForLog.totalFormatted}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-800 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rata-rata / Hari</span>
                  <p className="text-lg font-black text-slate-800 dark:text-slate-200 mt-0.5">
                    {selectedStudentForLog.avgFormatted}
                  </p>
                </div>
                <div className="p-3 bg-purple-50/80 dark:bg-purple-950/40 rounded-xl border border-purple-200/80 dark:border-purple-800/80 text-center">
                  <span className="text-[10px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider block">Target &amp; Status</span>
                  <p className="text-sm font-black text-purple-700 dark:text-purple-300 mt-1">
                    {selectedStudentForLog.totalHours >= periodTargetHours ? "🌟 Tercapai" : `Kurang ${(periodTargetHours - selectedStudentForLog.totalHours).toFixed(1)} Jam`}
                  </p>
                </div>
              </div>

              {/* Header Sesi List */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <FileText size={15} className="text-emerald-600" />
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                    Riwayat Sesi Kehadiran &amp; Bukti Lapangan
                  </h4>
                </div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                  {studentLogItems.length} Sesi Terdata
                </span>
              </div>

              {/* Sessions List */}
              {isLoadingStudentLogs ? (
                <div className="py-12 text-center text-slate-400">
                  <RefreshCw size={24} className="animate-spin text-emerald-600 mx-auto mb-2" />
                  <span className="text-xs font-semibold">Memuat riwayat log dan bukti kehadiran...</span>
                </div>
              ) : studentLogItems.length === 0 ? (
                <div className="py-10 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                  <Info size={28} className="text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Belum Ada Riwayat Sesi Presensi</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Mahasiswa ini belum memiliki catatan kehadiran pada sistem.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {studentLogItems.map((item, idx) => {
                    const isMemenuhi = item.isMemenuhiDurasi;
                    const isTerjeda = item.status === "TERJEDA";
                    const isBerlangsung = item.status === "BERLANGSUNG";
                    const isIzinSakit = item.status.includes("IZIN") || item.status.includes("SAKIT");

                    return (
                      <div
                        key={item.id || idx}
                        className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-750 shadow-2xs space-y-3"
                      >
                        {/* Top Row: Date, Schedule, Status */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/60 rounded-lg text-emerald-700 dark:text-emerald-400">
                              <Calendar size={14} />
                            </div>
                            <div>
                              <span className="font-black text-xs text-slate-900 dark:text-white">
                                {item.tanggal}
                              </span>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                {item.namaKegiatan}
                              </p>
                            </div>
                          </div>

                          <div>
                            {isMemenuhi ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700 shadow-2xs">
                                <CheckCircle2 size={12} className="text-emerald-600" />
                                <span>Hadir &amp; Memenuhi (&ge; 4 Jam)</span>
                              </span>
                            ) : isBerlangsung ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700 animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                <span>Sedang di Lapangan</span>
                              </span>
                            ) : isTerjeda ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                                <PauseCircle size={12} className="text-slate-500" />
                                <span>Terjeda</span>
                              </span>
                            ) : isIzinSakit ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700">
                                <FileText size={12} className="text-blue-600" />
                                <span>{item.statusDisplay}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700">
                                <AlertTriangle size={12} className="text-amber-600" />
                                <span>Kurang Jam (&lt; 4 Jam)</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Times & Duration Strip */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block">Jam Masuk (JM)</span>
                            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                              {item.jamMasuk !== "-" ? `${item.jamMasuk} WIB` : "-"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block">Jam Pulang (JP)</span>
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                              {item.jamPulang !== "-" ? `${item.jamPulang} WIB` : isBerlangsung ? "Sedang Aktif" : "-"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block">Durasi Jeda (DJ)</span>
                            <span className={`font-mono font-bold ${item.durasiJedaMenit && item.durasiJedaMenit > 0 ? "text-amber-700 dark:text-amber-300" : "text-slate-400"}`}>
                              {item.durasiJedaFormatted || `${item.durasiJedaMenit || 0} Menit`}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block">Durasi Bersih (DA)</span>
                            <span className="font-mono font-black text-slate-900 dark:text-white">
                              {item.durasiFormatted} ({item.durasiMenit}m)
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block">Rasio Sesi</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                              {Math.min(100, Math.max(0, item.rasioKehadiran ?? 0))}% ({item.durasiMenit}/{item.targetMinMenit || 240}m)
                            </span>
                          </div>
                        </div>

                        {/* Evidence & Activity Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {/* Deskripsi Kegiatan */}
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                              Deskripsi Kegiatan Lapangan:
                            </span>
                            {item.deskripsiKegiatan ? (
                              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap max-h-28 overflow-y-auto">
                                {item.deskripsiKegiatan}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 text-xs italic">
                                <Info size={13} />
                                <span>Belum ada catatan deskripsi kegiatan</span>
                              </div>
                            )}
                          </div>

                          {/* Foto Bukti */}
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                              Foto Dokumentasi Lapangan:
                            </span>
                            {item.fotoUrl ? (
                              <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                                <img
                                  src={item.fotoUrl}
                                  alt="Dokumentasi"
                                  className="w-14 h-14 rounded-lg object-cover border border-slate-200 dark:border-slate-600 shrink-0 cursor-pointer hover:opacity-90 transition"
                                  onClick={() =>
                                    setPreviewPhoto({
                                      url: item.fotoUrl!,
                                      title: `Foto Presensi: ${item.namaMahasiswa} - ${item.tanggal}`,
                                      desc: item.deskripsiKegiatan,
                                    })
                                  }
                                />
                                <div>
                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                    Foto Bukti Terlampir
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPreviewPhoto({
                                        url: item.fotoUrl!,
                                        title: `Foto Presensi: ${item.namaMahasiswa} - ${item.tanggal}`,
                                        desc: item.deskripsiKegiatan,
                                      })
                                    }
                                    className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline mt-0.5 inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <Eye size={11} />
                                    <span>Perbesar Foto</span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 p-2.5 rounded-xl bg-rose-50/80 dark:bg-rose-955/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-semibold">
                                <AlertTriangle size={13} className="shrink-0 text-rose-600" />
                                <span>⚠️ Tanpa Foto Bukti Dokumentasi Lapangan</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Catatan Jeda / Anomali (Jeda Logs) */}
                        {item.jedaLogs && item.jedaLogs.length > 0 && (
                          <div className="p-3 rounded-xl bg-amber-50/90 dark:bg-amber-955/60 border border-amber-300 dark:border-amber-700 text-xs text-amber-950 dark:text-amber-200 space-y-1.5">
                            <div className="flex items-center gap-1.5 font-black text-amber-800 dark:text-amber-300">
                              <PauseCircle size={14} className="text-amber-600" />
                              <span>Catatan &amp; Riwayat Jeda Mahasiswa ({item.jedaLogs.length} Kali Dijeda):</span>
                            </div>
                            <div className="space-y-1 pl-4 border-l-2 border-amber-300 dark:border-amber-600">
                              {item.jedaLogs.map((j: any, jIdx: number) => (
                                <div key={jIdx} className="text-[11px]">
                                  <span className="font-bold text-amber-900 dark:text-amber-100">
                                    • Alasan: &ldquo;{j.alasan || "Tanpa alasan"}&rdquo;
                                  </span>
                                  {j.durasiSebelumJedaMenit !== undefined && (
                                    <span className="text-amber-700 dark:text-amber-300 ml-1">
                                      (Durasi sebelum jeda: {j.durasiSebelumJedaMenit} Menit)
                                    </span>
                                  )}
                                  {j.waktuJeda && (
                                    <span className="text-slate-500 dark:text-slate-400 ml-1 text-[10px]">
                                      [{new Date(j.waktuJeda).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB]
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* GPS Location Row */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <MapPin size={13} className="text-emerald-600" />
                            <span>
                              GPS Check-in:{" "}
                              {item.latitude && item.longitude ? (
                                <strong className="font-mono text-slate-800 dark:text-slate-200">
                                  {item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}
                                </strong>
                              ) : (
                                <span className="italic text-slate-400">Tidak ada data GPS</span>
                              )}
                            </span>
                            {item.latitude && item.longitude && (
                              <a
                                href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline ml-1 inline-flex items-center gap-0.5"
                              >
                                <ExternalLink size={10} />
                                <span>Peta</span>
                              </a>
                            )}
                          </div>

                          {/* Quick Edit Presensi */}
                          <div className="flex items-center gap-1">
                            {isBerlangsung && (
                              <button
                                type="button"
                                onClick={() => handlePromptForceCheckout(item)}
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-lg text-xs font-bold transition border border-emerald-200 dark:border-emerald-800 cursor-pointer flex items-center gap-1"
                              >
                                <CheckCircle2 size={12} />
                                <span>Force Checkout</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(item)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition border border-slate-200 dark:border-slate-700 cursor-pointer flex items-center gap-1"
                            >
                              <Pencil size={12} />
                              <span>Koreksi</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteItem(item)}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 rounded-lg text-xs font-bold transition border border-rose-200 dark:border-rose-800 cursor-pointer flex items-center gap-1"
                            >
                              <Trash2 size={12} />
                              <span>Hapus</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
              <button
                type="button"
                onClick={() => handleJumpToLogDetailTab(selectedStudentForLog.namaMahasiswa)}
                className="px-3.5 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <ListFilter size={13} />
                <span>Buka di Tab Log Presensi Detail</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedStudentForLog(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer shadow-2xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Presensi */}
      {deleteItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setDeleteItem(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-rose-100 dark:bg-rose-950/60 rounded-2xl text-rose-600 dark:text-rose-400">
                <Trash2 size={22} />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Hapus Data Presensi?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tindakan ini permanen dan tidak dapat dibatalkan.
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 mb-4">
              Presensi milik <span className="font-bold text-slate-900 dark:text-white">{deleteItem.namaMahasiswa}</span> pada tanggal{" "}
              <span className="font-bold text-slate-900 dark:text-white">{deleteItem.tanggal}</span> ({deleteItem.jamMasuk} - {deleteItem.jamPulang}) akan dihapus dari sistem.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteItem(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeletePresensi}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                <span>Ya, Hapus Presensi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern BERSEKA Confirmation Modal for Force Check-Out */}
      <ConfirmModal
        isOpen={Boolean(forceCheckoutTarget)}
        onClose={() => setForceCheckoutTarget(null)}
        onConfirm={handleConfirmForceCheckout}
        isLoading={isForcingCheckout}
        title="Selesaikan Sesi Presensi Lapangan"
        message={`Selesaikan sesi presensi lapangan untuk mahasiswa ${
          forceCheckoutTarget?.namaMahasiswa || ""
        }? Jam pulang dan durasi akan otomatis diselesaikan dan disetujui.`}
        confirmText="Ya, Selesaikan Sesi"
        cancelText="Batal"
        type="info"
      />
    </div>
  );
};

export default LaporanPresensiPage;

