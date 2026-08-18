/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/useAuthStore";
import LeaderboardWidget from "../../components/LeaderboardWidget";
import {
  Users,
  Trash2,
  ShieldCheck,
  MapPin,
  Award,
  Search,
  Calendar,
  PhoneCall,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  ChevronUp,
  Layers,
  Activity,
  CheckCircle2,
  Filter,
  BarChart3,
  TrendingUp,
  Sparkles,
  Eye,
  AlertTriangle,
  Check,
  XCircle,
} from "lucide-react";
import {
  MapContainer,
  Marker,
  Popup,
  Polygon,
  useMap,
} from "react-leaflet";
import { ThemeTileLayer } from "../../components/common/ThemeTileLayer";
import L from "leaflet";
import {
  CoblongGeo,
  KELURAHAN_GEODATA,
} from "../../constants/coblongGeoData";
import api from "../../services/api";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

// Custom Leaflet Map Controller for Smooth FlyTo
const MapFlyToController: React.FC<{
  center: [number, number];
  zoom: number;
}> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 150);
    const t2 = setTimeout(() => map.invalidateSize(), 400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [map]);

  useEffect(() => {
    if (center && !isNaN(center[0]) && !isNaN(center[1]) && center[0] < 0 && center[1] > 0) {
      map.flyTo(center, zoom, { duration: 1.0 });
    }
  }, [center, zoom, map]);
  return null;
};

// Custom Warga Marker Pin Generator (Real Data Based)
const createWargaMarkerIcon = (compliance: number) => {
  let color = "#10b981"; // Emerald (High)
  if (compliance < 60) color = "#ef4444"; // Rose (Low)
  else if (compliance < 80) color = "#f59e0b"; // Amber (Medium)

  return L.divIcon({
    className: "custom-warga-pin",
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer;">
        <div style="background: ${color}; border: 2px solid white; width: 24px; height: 24px; border-radius: 50%; box-shadow: 0 3px 10px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: white;">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </div>
        <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 5px solid ${color}; margin-top: -1px;"></div>
      </div>
    `,
    iconSize: [24, 29],
    iconAnchor: [12, 29],
  });
};

const KknDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [wargaList, setWargaList] = useState<any[]>([]);
  const [rtRwAreas, setRtRwAreas] = useState<any[]>([]);

  // Loading & UI States
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWarga, setSelectedWarga] = useState<any | null>(null);

  // Filters & Pagination State
  const [filterRtRw, setFilterRtRw] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [filterCompliance, setFilterCompliance] = useState("ALL"); // ALL, HIGH (>=80), LOW (<80)
  const [wargaPage, setWargaPage] = useState(1);
  const [wargaRowsPerPage, setWargaRowsPerPage] = useState(10);

  // Map States
  const [showPolygons, setShowPolygons] = useState(true);
  const [showWargaPins, setShowWargaPins] = useState(true);
  const [selectedKelurahan, setSelectedKelurahan] = useState<string>("ALL");
  const [mapCenter, setMapCenter] = useState<[number, number]>(CoblongGeo.CENTER);
  const [mapZoom, setMapZoom] = useState<number>(CoblongGeo.DEFAULT_ZOOM);
  const [isLegendOpen, setIsLegendOpen] = useState<boolean>(true);

  const isSuperOrAdmin =
    user?.peran === "SUPER_USER" ||
    user?.peran === "DEVELOPER" ||
    user?.peran === "ADMIN_DLH" ||
    user?.peran === "DPL" ||
    user?.peran === "DOSEN_PEMBIMBING" ||
    user?.peran === "PEMIMPIN" ||
    user?.peran === "PANITIA_TASKFORCE";

  const [escalatedLeaves, setEscalatedLeaves] = useState<any[]>([]);
  const [isProcessingLeave, setIsProcessingLeave] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const results = await Promise.allSettled([
        api.get("/kkn/dashboard"),
        api.get("/kkn/warga"),
        api.get("/bins/locations"),
        api.get("/dpl/alerts"),
      ]);

      if (results[0].status === "fulfilled") setStats(results[0].value.data?.data);
      if (results[1].status === "fulfilled") setWargaList(results[1].value.data?.data || []);
      if (results[2].status === "fulfilled") setRtRwAreas(results[2].value.data?.data || []);
      if (results[3].status === "fulfilled") {
        const alertData = results[3].value.data?.data;
        setEscalatedLeaves(alertData?.pendingApprovals || []);
      }

      results.forEach((r, i) => {
        if (r.status === "rejected") console.warn(`KKN fetch[${i}] failed:`, r.reason?.message);
      });
    } catch (err: any) {
      console.error("Gagal memuat data portal KKN:", err);
      toast.error(err.response?.data?.message || "Gagal memuat data portal KKN");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecideLeave = async (requestId: string, status: "APPROVED" | "REJECTED") => {
    try {
      setIsProcessingLeave(requestId);
      const res = await api.post(`/dpl/approvals/${requestId}/decide`, {
        status,
        rejectionReason: status === "APPROVED" ? "Disetujui oleh Satgas Taskforce KKN" : "Ditolak oleh Satgas Taskforce KKN",
      });
      if (res.data?.success) {
        toast.success(`Pengajuan izin mahasiswa berhasil di-${status === "APPROVED" ? "setujui" : "tolak"}`);
        setEscalatedLeaves((prev) => prev.filter((item) => item.id !== requestId));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal memproses izin mahasiswa");
    } finally {
      setIsProcessingLeave(null);
    }
  };

  const handleFilterSubmit = async () => {
    try {
      const res = await api.get("/kkn/warga", {
        params: {
          rtRw: filterRtRw ? parseInt(filterRtRw, 10) : undefined,
          search: filterSearch || undefined,
        },
      });
      setWargaList(res.data?.data || []);
      setWargaPage(1);
    } catch (err) {
      console.error(err);
      toast.error("Gagal menyaring data");
    }
  };

  const handleWargaClick = async (wargaId: string) => {
    const localWarga = wargaList.find((w) => (w.wargaId || w.id) === wargaId);
    try {
      const res = await api.get(`/kkn/warga/${wargaId}`);
      if (res.data?.data) {
        setSelectedWarga(res.data.data);
        return;
      }
    } catch (err: any) {
      console.warn("[KKN Dashboard] API detail warga fallback to local item:", err?.message);
    }
    if (localWarga) {
      setSelectedWarga(localWarga);
    } else {
      toast.error("Gagal memuat detail warga");
    }
  };

  // Filtered Warga List
  const filteredWargaList = useMemo(() => {
    return wargaList.filter((w) => {
      if (filterCompliance === "HIGH" && (w.complianceScore || 0) < 80) return false;
      if (filterCompliance === "LOW" && (w.complianceScore || 0) >= 80) return false;
      if (filterSearch) {
        const query = filterSearch.toLowerCase();
        const matchName = (w.name || "").toLowerCase().includes(query);
        const matchAddress = (w.address || "").toLowerCase().includes(query);
        const matchBin = (w.binCode || "").toLowerCase().includes(query);
        if (!matchName && !matchAddress && !matchBin) return false;
      }
      if (filterRtRw) {
        const rwStr = String(filterRtRw);
        const matchRw =
          String(w.rwId || "").includes(rwStr) ||
          (w.rtRw || "").toLowerCase().includes(rwStr.toLowerCase()) ||
          (w.rw || "").toLowerCase().includes(rwStr.toLowerCase());
        if (!matchRw) return false;
      }
      return true;
    });
  }, [wargaList, filterCompliance, filterSearch, filterRtRw]);

  // Only plot real Warga Pins with valid non-zero GPS coordinates
  const wargaWithLocation = useMemo(() => {
    return wargaList.filter((w) => {
      const lat = Number(w.latitude || w.lat);
      const lng = Number(w.longitude || w.lng);
      return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
    });
  }, [wargaList]);

  // Paginated Warga Items
  const totalPages = Math.ceil(filteredWargaList.length / wargaRowsPerPage) || 1;
  const paginatedWarga = useMemo(() => {
    const start = (wargaPage - 1) * wargaRowsPerPage;
    return filteredWargaList.slice(start, start + wargaRowsPerPage);
  }, [filteredWargaList, wargaPage, wargaRowsPerPage]);

  // Real Kelurahan compliance calculator for map polygons
  const getKelurahanComplianceScore = (kelName: string): number | null => {
    const matches = wargaList.filter((w) =>
      (w.address || w.rtRw || w.rw || "").toLowerCase().includes(kelName.toLowerCase())
    );
    if (matches.length === 0) return null; // No warga registered in this kelurahan yet -> Return null so it's not yellow!

    const validScores = matches
      .map((curr) => Number(curr.complianceScore))
      .filter((score) => !isNaN(score) && score > 0);

    if (validScores.length === 0) return null;
    const sum = validScores.reduce((acc, curr) => acc + curr, 0);
    return Math.round(sum / validScores.length);
  };

  const getComplianceColor = (score: number | null) => {
    // If null or no data -> Neutral Slate/Gray (Transparent/Subtle)
    if (score === null || score === undefined) {
      return { stroke: "#94a3b8", fill: "#94a3b8", fillOpacity: 0.06, text: "#64748b" };
    }
    // High: >= 80% (Emerald)
    if (score >= 80) {
      return { stroke: "#10b981", fill: "#10b981", fillOpacity: 0.22, text: "#047857" };
    }
    // Medium: 60 - 79% (Amber)
    if (score >= 60) {
      return { stroke: "#f59e0b", fill: "#f59e0b", fillOpacity: 0.22, text: "#b45309" };
    }
    // Low: < 60% (Rose/Red)
    return { stroke: "#ef4444", fill: "#ef4444", fillOpacity: 0.25, text: "#b91c1c" };
  };

  const handleSelectKelurahanOnMap = (kelKey: string, centroid: [number, number]) => {
    setSelectedKelurahan(kelKey);
    setMapCenter(centroid);
    setMapZoom(16);
    toast.success(`Fokus wilayah: Kelurahan ${KELURAHAN_GEODATA[kelKey]?.name || kelKey}`);
  };

  const handleResetMapFocus = () => {
    setSelectedKelurahan("ALL");
    setMapCenter(CoblongGeo.CENTER);
    setMapZoom(CoblongGeo.DEFAULT_ZOOM);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <Loader2 className="animate-spin text-emerald-600 w-12 h-12" />
        <p className="text-slate-600 font-bold text-sm">Memuat Portal & Dashboard KKN...</p>
      </div>
    );
  }

  const { studentKkn, stats: kStats } = stats || {};

  // Process Real Trend Data for Charts
  const regTrendMap: { [key: string]: number } = {};
  wargaList.forEach((w) => {
    try {
      if (w.registeredAt) {
        const dateStr = new Date(w.registeredAt).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
        });
        regTrendMap[dateStr] = (regTrendMap[dateStr] || 0) + 1;
      }
    } catch (_) {}
  });

  const registrationTrendData =
    Object.keys(regTrendMap).length > 0
      ? Object.keys(regTrendMap)
          .map((date) => ({
            tanggal: date,
            warga: regTrendMap[date],
          }))
          .slice(-7)
      : [];

  const complianceData =
    wargaList.length > 0
      ? wargaList
          .filter((w) => w.complianceScore !== undefined && w.complianceScore !== null)
          .map((w) => ({
            nama: (w.name || "Warga").split(" ")[0],
            skor: Number(w.complianceScore) || 0,
          }))
          .slice(0, 10)
      : [];

  return (
    <div className="space-y-8 pb-16 w-full max-w-[1600px] mx-auto px-2 sm:px-4">
      {/* ---------------- 1. HEADER SECTION (2-Tier Clean UI) ---------------- */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
        {/* Tier 1: Title & Status Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              {isSuperOrAdmin ? "Monitoring Aktivitas Mahasiswa KKN" : `Portal KKN: ${studentKkn?.nama || "Mahasiswa"}`}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {isSuperOrAdmin
                ? `Akses ${user?.peran || "SUPER_USER"} • Memantau seluruh progres aktivasi tempat sampah dan kepatuhan 6 kelurahan di Kecamatan Coblong`
                : "Pusat pencatatan pendampingan warga, aktivasi tempat sampah, dan logbook KKN"}
            </p>
          </div>

          <div className="self-start sm:self-center flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-700/40 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#009966] animate-pulse" />
              {isSuperOrAdmin ? "Super Admin Live" : "Mahasiswa Aktif"}
            </span>
          </div>
        </div>

        {/* Tier 2: Metadata & Wilayah */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300 font-medium">
          <div className="flex flex-wrap items-center gap-3">
            {!isSuperOrAdmin && (
              <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
                NIM: {studentKkn?.nim || "-"} • Jurusan: {studentKkn?.jurusan || "-"}
              </span>
            )}
            <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700">
              <MapPin size={13} className="text-[#009966]" />
              Wilayah: {studentKkn?.assignedArea || "Kecamatan Coblong"}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Status Program:</span>
            <span className="font-bold text-[#009966] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-700/40 text-[11px]">
              {studentKkn?.whitelistStatus || "APPROVED"}
            </span>
          </div>
        </div>
      </div>

      {/* ---------------- 2. TOP KPI STATS ---------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1 */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider">
              Progres Pendampingan
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="my-3">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
              {kStats?.totalRegistered || wargaList.length || 0}{" "}
              <span className="text-base font-bold text-slate-500 dark:text-slate-400">Bins</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Target: {kStats?.maxLimit || 100} Bins (Sisa Kuota: {kStats?.remainingQuota ?? 100})
            </p>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
            <div
              className="bg-emerald-600 dark:bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, kStats?.progressPct || 0))}%` }}
            ></div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider">
              Status Program
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="my-3">
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-black ${
                studentKkn?.whitelistStatus === "APPROVED"
                  ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700/40"
                  : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700/40"
              }`}
            >
              Whitelist: {studentKkn?.whitelistStatus || "APPROVED"}
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-2 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              Selesai:{" "}
              <strong className="text-slate-700 dark:text-slate-300">
                {studentKkn?.endDate
                  ? new Date(studentKkn.endDate).toLocaleDateString("id-ID")
                  : "30 Hari Kedepan"}
              </strong>
            </p>
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
            <CheckCircle2 size={13} /> Terverifikasi Sistem KKN
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider">
              Poin Kontribusi
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="my-3">
            <h3 className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 font-mono">
              +{(kStats?.contributionPoints || 0).toLocaleString("id-ID")}{" "}
              <span className="text-base font-bold text-amber-500">Pts</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Akumulasi setoran &amp; aktivasi valid
            </p>
          </div>
          <div className="text-[10px] text-slate-400 font-semibold">
            Tercatat di Ledger Gamifikasi
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider">
              Wilayah Tugas
            </span>
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
              <MapPin className="w-5 h-5" />
            </div>
          </div>
          <div className="my-3">
            <h4 className="font-extrabold text-base text-slate-800 dark:text-slate-200 leading-tight">
              {studentKkn?.assignedArea || "Kecamatan Coblong"}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
              {isSuperOrAdmin ? "Cakupan: 6 Kelurahan (60+ RW)" : "Status: Pemimpin KKN"}
            </p>
          </div>
          <div className="text-[10px] text-teal-700 dark:text-teal-400 font-bold flex items-center gap-1">
            <Activity size={13} /> Monitoring Aktif Real-time
          </div>
        </div>
      </div>

      {/* ---------------- 2.5. PANEL ESKALASI IZIN MAHASISWA (TASKFORCE & SUPER ADMIN) ---------------- */}
      {isSuperOrAdmin && escalatedLeaves.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-amber-950/10 p-6 rounded-3xl border border-amber-300/80 dark:border-amber-800/50 shadow-xs space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/60 dark:border-amber-800/40 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500 text-white shadow-xs">
                <AlertTriangle size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-base text-slate-900 dark:text-slate-100 tracking-tight">
                    Eskalasi Izin &amp; Cuti Mahasiswa KKN
                  </h3>
                  <span className="px-2.5 py-0.5 bg-amber-500 text-white rounded-full text-[10px] font-black animate-pulse">
                    {escalatedLeaves.length} Butuh Persetujuan
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  Permohonan izin mahasiswa KKN yang dieskalasi atau belum diproses DPL untuk diputuskan langsung oleh Satgas Taskforce / Super Admin.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {escalatedLeaves.map((leave) => {
              const isEscalated = leave.status === "ESCALATED";
              const isSakit = (leave.type || "").toUpperCase().includes("SAKIT");
              return (
                <div
                  key={leave.id}
                  className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-amber-200/90 dark:border-amber-800/50 shadow-2xs flex flex-col justify-between space-y-3 hover:shadow-md transition"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                          isSakit
                            ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-700/40"
                            : "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-700/40"
                        }`}
                      >
                        {leave.type || "IZIN"}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {leave.startDate ? new Date(leave.startDate).toLocaleDateString("id-ID") : "-"}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 leading-tight">
                      {leave.student?.name || leave.studentName || "Mahasiswa KKN"}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      NIM: {leave.student?.studentProfile?.nim || "-"} • Kelompok: {leave.student?.studentProfile?.kelompok?.name || "KKN Coblong"}
                    </p>
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700 italic">
                      "{leave.reason || "Tidak ada keterangan tambahan"}"
                    </p>
                    {isEscalated && leave.rejectionReason && (
                      <p className="text-[10px] text-amber-800 dark:text-amber-300 font-bold bg-amber-50 dark:bg-amber-950/60 p-2 rounded-lg border border-amber-200 dark:border-amber-700/40">
                        ⚠️ Catatan Eskalasi: {leave.rejectionReason}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      disabled={isProcessingLeave === leave.id}
                      onClick={() => handleDecideLeave(leave.id, "REJECTED")}
                      className="flex-1 py-1.5 px-3 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-400 rounded-xl font-bold text-xs transition border border-rose-200 dark:border-rose-700/40 flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <XCircle size={13} />
                      Tolak
                    </button>
                    <button
                      type="button"
                      disabled={isProcessingLeave === leave.id}
                      onClick={() => handleDecideLeave(leave.id, "APPROVED")}
                      className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs transition shadow-2xs flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <Check size={13} />
                      Setujui
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------- 3. ANALITIK & GRAFIK PENDAMPINGAN ---------------- */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="font-extrabold text-lg sm:text-xl text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <BarChart3 className="text-emerald-600 dark:text-emerald-400 w-5 h-5" />
              Grafik Analitik Pendampingan KKN
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Visualisasi tren pendaftaran warga dampingan dan skor kepatuhan pemilahan sampah
            </p>
          </div>
          <span className="text-[11px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
            Sumber Data: Real Database
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Chart 1: Registration Trend */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-600 dark:text-emerald-400" /> Tren Registrasi Warga (7 Tanggal Terakhir)
            </h4>
            <div className="h-64 w-full bg-slate-50/50 dark:bg-slate-800/40 p-2 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-center">
              {registrationTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={registrationTrendData}>
                    <defs>
                      <linearGradient id="colorWargaKkn" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="tanggal" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderRadius: "12px",
                        color: "#fff",
                        border: "1px solid #334155",
                        fontSize: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="warga"
                      name="Jumlah Warga"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorWargaKkn)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-4 text-slate-400 text-xs">
                  <BarChart3 className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="font-bold text-slate-600 dark:text-slate-400">Belum Ada Data Registrasi</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Grafik tren akan terisi otomatis seiring bertambahnya warga dampingan.</p>
                </div>
              )}
            </div>
          </div>

          {/* Chart 2: Compliance Score */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Sparkles size={16} className="text-sky-600 dark:text-sky-400" /> Skor Kepatuhan per Warga Dampingan (Top 10)
            </h4>
            <div className="h-64 w-full bg-slate-50/50 dark:bg-slate-800/40 p-2 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-center">
              {complianceData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={complianceData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="nama" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderRadius: "12px",
                        color: "#fff",
                        border: "1px solid #334155",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="skor" name="Skor Kepatuhan" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-4 text-slate-400 text-xs">
                  <Sparkles className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="font-bold text-slate-600 dark:text-slate-400">Belum Ada Data Kepatuhan</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Skor kepatuhan akan muncul setelah ada evaluasi setoran pemilahan sampah.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- 4. DAFTAR WARGA DAMPINGAN (PAGINATED) ---------------- */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-lg sm:text-xl text-slate-900 dark:text-slate-100">
                Daftar Warga Dampingan
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-black border border-emerald-200 dark:border-emerald-700/40">
                {filteredWargaList.length} Warga
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Total {wargaList.length} warga terdaftar dalam pemantauan KKN Kecamatan Coblong
            </p>
          </div>

          {/* Interactive Filter Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama, alamat, bin..."
                value={filterSearch}
                onChange={(e) => {
                  setFilterSearch(e.target.value);
                  setWargaPage(1);
                }}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-9 pr-3 py-2 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-52 transition-all font-medium text-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Rukun Warga Filter */}
            <select
              value={filterRtRw}
              onChange={(e) => {
                setFilterRtRw(e.target.value);
                setWargaPage(1);
              }}
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="">Semua Rukun Warga</option>
              {rtRwAreas.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.rw || loc.name}
                </option>
              ))}
            </select>

            {/* Compliance Filter */}
            <select
              value={filterCompliance}
              onChange={(e) => {
                setFilterCompliance(e.target.value);
                setWargaPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer font-bold text-slate-700 dark:text-slate-300"
            >
              <option value="ALL">Semua Skor</option>
              <option value="HIGH">Tinggi (≥ 80 pts)</option>
              <option value="LOW">Rendah (&lt; 80 pts)</option>
            </select>

            {/* Rows Per Page */}
            <select
              value={wargaRowsPerPage}
              onChange={(e) => {
                setWargaRowsPerPage(Number(e.target.value));
                setWargaPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer font-bold text-slate-700 dark:text-slate-300"
              title="Baris per halaman"
            >
              <option value={5}>5 baris</option>
              <option value={10}>10 baris</option>
              <option value={20}>20 baris</option>
              <option value={50}>50 baris</option>
            </select>

            <button
              onClick={handleFilterSubmit}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5 text-xs font-bold"
              title="Terapkan Filter"
            >
              <Filter size={14} /> Filter
            </button>
          </div>
        </div>

        {/* Warga Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 uppercase text-[11px] font-extrabold tracking-wider">
                <th className="p-3.5">Nama &amp; Alamat</th>
                <th className="p-3.5">ID Tempat Sampah</th>
                <th className="p-3.5">Terdaftar</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Skor Kepatuhan</th>
                <th className="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedWarga.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 font-medium italic">
                    Tidak ada data warga dampingan yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                paginatedWarga.map((w) => {
                  const formattedDate =
                    w.registeredAt && !isNaN(new Date(w.registeredAt).getTime())
                      ? new Date(w.registeredAt).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "Baru Terdaftar";

                  const score = Number(w.complianceScore) || 0;

                  return (
                    <tr key={w.wargaId || w.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-3.5">
                        <div className="font-extrabold text-slate-900 dark:text-slate-100">{w.name || w.wargaName}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {w.rtRw || w.rw ? `${w.rtRw || w.rw} • ` : ""}
                          {w.address || "Coblong, Bandung"}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200/80 dark:border-emerald-700/40 text-[11px]">
                          {w.binCode || w.binId || "TS-AUTO"}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-300 font-medium">{formattedDate}</td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700/40">
                          Aktif
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                            score >= 80
                              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700/40"
                              : score > 0
                              ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700/40"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {score} pts
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleWargaClick(w.wargaId || w.id)}
                          className="bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 dark:hover:text-white px-3 py-1.5 rounded-xl font-bold transition-all text-[11px] cursor-pointer shadow-2xs inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        >
                          <Eye size={13} /> Detail
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Robust Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 pt-4 text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium">
            Menampilkan{" "}
            <strong className="text-slate-900 dark:text-slate-100">
              {filteredWargaList.length === 0 ? 0 : (wargaPage - 1) * wargaRowsPerPage + 1}
            </strong>{" "}
            -{" "}
            <strong className="text-slate-900 dark:text-slate-100">
              {Math.min(filteredWargaList.length, wargaPage * wargaRowsPerPage)}
            </strong>{" "}
            dari <strong className="text-slate-900 dark:text-slate-100">{filteredWargaList.length}</strong> Warga
          </span>

          <div className="flex items-center gap-1.5">
            {/* First Page */}
            <button
              disabled={wargaPage === 1}
              onClick={() => setWargaPage(1)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
              title="Halaman Pertama"
            >
              <ChevronsLeft size={16} />
            </button>

            {/* Prev Page */}
            <button
              disabled={wargaPage === 1}
              onClick={() => setWargaPage((p) => Math.max(1, p - 1))}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Page Number Buttons */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum = i + 1;
              if (totalPages > 5) {
                if (wargaPage > 3) {
                  pageNum = wargaPage - 3 + i;
                  if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                }
              }
              return (
                <button
                  key={`page-${pageNum}`}
                  onClick={() => setWargaPage(pageNum)}
                  className={`w-8 h-8 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    wargaPage === pageNum
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            {/* Next Page */}
            <button
              disabled={wargaPage >= totalPages}
              onClick={() => setWargaPage((p) => Math.min(totalPages, p + 1))}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
              title="Halaman Berikutnya"
            >
              <ChevronRight size={16} />
            </button>

            {/* Last Page */}
            <button
              disabled={wargaPage >= totalPages}
              onClick={() => setWargaPage(totalPages)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
              title="Halaman Terakhir"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ---------------- 5. PETA SEBARAN DAMPINGAN (LEAFLET GIS ASLI) ---------------- */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="font-extrabold text-lg sm:text-xl text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <MapPin className="text-emerald-600 dark:text-emerald-400 w-5 h-5" />
              Peta Sebaran Dampingan (Leaflet GIS Real-time)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Pemetaan interaktif poligon 6 kelurahan dan sebaran titik tempat sampah warga di Kecamatan Coblong
            </p>
          </div>

          {/* Map Layer Controls & Quick Focus */}
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showPolygons}
                onChange={(e) => setShowPolygons(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
              />
              <Layers size={14} className="text-slate-500 dark:text-slate-400" />
              Poligon Wilayah
            </label>

            <label className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showWargaPins}
                onChange={(e) => setShowWargaPins(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
              />
              <Trash2 size={14} className="text-slate-500 dark:text-slate-400" />
              Titik Warga / Bins ({wargaWithLocation.length})
            </label>

            {selectedKelurahan !== "ALL" && (
              <button
                onClick={handleResetMapFocus}
                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                Reset Fokus Peta
              </button>
            )}
          </div>
        </div>

        {/* Leaflet Interactive Map Container */}
        <div className="w-full h-[450px] sm:h-[500px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 relative shadow-inner">
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            scrollWheelZoom={true}
            className="w-full h-full z-0"
          >
            <MapFlyToController center={mapCenter} zoom={mapZoom} />
            <ThemeTileLayer />

            {/* 1. KELURAHAN BOUNDARY POLYGONS */}
            {showPolygons &&
              Object.entries(KELURAHAN_GEODATA).map(([key, kel]) => {
                const score = getKelurahanComplianceScore(kel.name);
                const colors = getComplianceColor(score);
                const isSelected = selectedKelurahan === key;

                return (
                  <Polygon
                    key={`kkn-poly-${key}`}
                    positions={kel.bounds}
                    pathOptions={{
                      color: isSelected ? "#0f172a" : colors.stroke,
                      fillColor: colors.fill,
                      fillOpacity: isSelected ? 0.35 : colors.fillOpacity,
                      weight: isSelected ? 3.5 : 2,
                    }}
                    eventHandlers={{
                      click: () => handleSelectKelurahanOnMap(key, kel.centroid),
                    }}
                  >
                    <Popup className="custom-popup">
                      <div className="p-2 space-y-1">
                        <h4 className="font-extrabold text-sm text-slate-900 border-b pb-1">
                          Kelurahan {kel.name}
                        </h4>
                        <p className="text-xs text-slate-600">
                          Skor Kepatuhan Rata-rata:{" "}
                          <strong className="text-emerald-600 font-bold">{score}%</strong>
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Target Dampingan KKN: 15 RW Terdaftar
                        </p>
                        <button
                          onClick={() => handleSelectKelurahanOnMap(key, kel.centroid)}
                          className="mt-1 w-full bg-emerald-600 text-white text-[11px] font-bold py-1 rounded-lg"
                        >
                          Fokuskan Wilayah
                        </button>
                      </div>
                    </Popup>
                  </Polygon>
                );
              })}

            {/* 2. REAL REGISTERED WARGA PINS */}
            {showWargaPins &&
              wargaWithLocation.map((warga) => {
                const lat = Number(warga.latitude || CoblongGeo.CENTER[0]);
                const lng = Number(warga.longitude || CoblongGeo.CENTER[1]);
                const compliance = Number(warga.complianceScore || 85);

                return (
                  <Marker
                    key={`warga-pin-${warga.wargaId || warga.id}`}
                    position={[lat, lng]}
                    icon={createWargaMarkerIcon(compliance)}
                    eventHandlers={{
                      click: () => handleWargaClick(warga.wargaId || warga.id),
                    }}
                  >
                    <Popup className="custom-popup">
                      <div className="p-2 space-y-1 text-xs">
                        <div className="flex items-center justify-between gap-2 border-b pb-1">
                          <strong className="text-slate-900">{warga.name || warga.wargaName}</strong>
                          <span className="font-mono text-[10px] text-emerald-600 font-bold">
                            {warga.binCode || "TS"}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px]">{warga.address || "Coblong"}</p>
                        <div className="flex justify-between items-center pt-1 text-[11px]">
                          <span className="text-slate-400">Kepatuhan:</span>
                          <span className="font-bold text-emerald-600">{compliance} Pts</span>
                        </div>
                        <button
                          onClick={() => handleWargaClick(warga.wargaId || warga.id)}
                          className="mt-1.5 w-full bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold py-1 rounded-lg transition"
                        >
                          Buka Detail
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
          </MapContainer>

          {/* Map Legend Overlay (High Z-Index & Isolate to prevent flickering on zoom in/out) */}
          <div
            className="absolute bottom-4 right-4 flex flex-col gap-2 max-w-xs font-sans text-xs pointer-events-auto select-none"
            style={{ zIndex: 500, isolation: "isolate" }}
          >
            {!isLegendOpen ? (
              <button
                type="button"
                onClick={() => setIsLegendOpen(true)}
                className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xl rounded-2xl px-3.5 py-2 border border-slate-200/90 dark:border-slate-800 flex items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-100 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-[#009966] transition-all cursor-pointer group"
                title="Tampilkan Legenda Peta"
              >
                <Layers className="w-4 h-4 text-[#009966] group-hover:scale-110 transition-transform" />
                <span>Legenda Dashboard KKN</span>
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              </button>
            ) : (
              <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xl max-w-[260px]">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5 mb-2">
                  <span className="font-black text-[11px] uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Legenda Dashboard KKN
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsLegendOpen(false)}
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Sembunyikan Legenda"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Status Kepatuhan Dampingan Warga */}
                <div className="space-y-1 mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                    Skor Kepatuhan Dampingan
                  </span>
                  <div className="grid grid-cols-2 gap-1 text-[10.5px]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white"></span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">Tinggi (≥80%)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-white"></span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">Sedang (60-79%)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-white"></span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">Rendah (&lt;60%)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-300 border border-white"></span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">Belum Ada Data</span>
                    </div>
                  </div>
                </div>

                {/* Batas 6 Kelurahan Coblong */}
                <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                  Polygon 6 Kelurahan
                </span>
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10.5px]">
                  {Object.values(KELURAHAN_GEODATA).map((kg) => (
                    <div key={kg.id} className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-xs shrink-0 border border-black/10"
                        style={{ backgroundColor: kg.color }}
                      ></span>
                      <span className="font-bold text-slate-700 dark:text-slate-300 truncate">{kg.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ---------------- 6. BOTTOM SECTION: LEADERBOARD & GRAFIK WILAYAH / AKADEMIK ---------------- */}
      <div className="w-full pt-4">
        <div className="border-t border-slate-200/80 dark:border-slate-800 pt-8 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Peringkat &amp; Evaluasi Wilayah / Akademik KKN
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            Grafik kepatuhan &amp; volume sampah per kelurahan serta leaderboard Top 10 untuk warga, petugas, RW, kelurahan, dan mahasiswa KKN.
          </p>
        </div>

        {/* Full-width Leaderboard & Chart Widget */}
        <LeaderboardWidget />
      </div>

      {/* ---------------- 7. DETAIL WARGA DRAWER ---------------- */}
      {selectedWarga && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex justify-end z-[9999] animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md h-full shadow-2xl p-6 flex flex-col justify-between border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-250 text-slate-800 dark:text-slate-100">
            <div
              className="space-y-6 overflow-y-auto flex-1 pr-1"
              style={{ scrollbarWidth: "thin" }}
            >
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Users className="text-emerald-600 dark:text-emerald-400 w-5 h-5" /> Detail Warga Dampingan
                </h3>
                <button
                  onClick={() => setSelectedWarga(null)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Profile Details */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider">
                    Nama Warga
                  </h4>
                  <p className="font-black text-slate-900 dark:text-slate-100 text-base mt-0.5">
                    {selectedWarga.name || selectedWarga.wargaName}
                  </p>
                </div>
                <div>
                  <h4 className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider">
                    Kontak &amp; Alamat
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold mt-0.5">
                    {selectedWarga.phone || "-"} • {selectedWarga.email || "-"}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">
                    {selectedWarga.rtRw || selectedWarga.rw} • {selectedWarga.address}
                  </p>
                </div>

                {selectedWarga.bin && (
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-700">
                    <h4 className="text-xs text-slate-800 dark:text-slate-200 font-extrabold flex items-center gap-1.5">
                      <Trash2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ID Tempat Sampah:{" "}
                      <span className="font-mono text-emerald-700 dark:text-emerald-400 font-black">
                        {selectedWarga.bin.qrCode}
                      </span>
                    </h4>
                    <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-slate-600 dark:text-slate-300">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Kategori</p>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{selectedWarga.bin.category}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Kapasitas</p>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{selectedWarga.bin.capacity}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Deposit History */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-sm border-b border-slate-100 dark:border-slate-800 pb-2 text-slate-800 dark:text-slate-200">
                  Riwayat Setoran Sampah
                </h4>
                <div className="space-y-2">
                  {selectedWarga.recentLogs && selectedWarga.recentLogs.length > 0 ? (
                    selectedWarga.recentLogs.map((log: any) => (
                      <div
                        key={log.id}
                        className="flex justify-between items-center p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-xs"
                      >
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200">{log.category}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(log.createdAt).toLocaleString("id-ID")}
                          </p>
                        </div>
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                          {log.weightKg} kg
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-4 italic">
                      Belum ada riwayat setoran sampah.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-6">
              <a
                href={`https://wa.me/${selectedWarga.phone?.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 hover:scale-[1.01] transition-all cursor-pointer text-xs"
              >
                <PhoneCall className="w-4 h-4" />
                Hubungi Warga via WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KknDashboard;
