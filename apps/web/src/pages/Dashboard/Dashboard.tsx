import { X, Star, Banknote, Recycle, AlertCircle, Eye, LineChart, BarChart, Leaf, TrendingUp, TrendingDown, Wallet, Zap, MapPin, AlertTriangle, Truck, Pencil, Trash2, Calendar, ChevronRight, GraduationCap, Search, CheckCircle2, Sparkles, RotateCcw, UserCheck, Code2, ShieldCheck, Award, BookOpen, RefreshCcw, Settings, Save, Loader2, Building2, History, Home, Bell, Megaphone, Archive, Send, Users, ShoppingBag } from "lucide-react";

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

import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import LeaderboardWidget from "../../components/LeaderboardWidget";
import { CustomSelect, type SelectOption } from "../../components/common/CustomSelect";
import { ConfirmModal } from "../../components/common/ConfirmModal";

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
];

// ========== Compliance Modal Component ==========
interface ComplianceModalProps {
  locations: any[];
  onClose: () => void;
}

const ComplianceModal: React.FC<ComplianceModalProps> = ({ locations, onClose }) => {
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
      ? (locations.reduce((acc, curr) => acc + Number(curr.patuh || 0), 0) / totalRW).toFixed(2)
      : "0.00";
  const highPatuhCount = locations.filter((loc) => Number(loc.patuh || 0) >= 85).length;
  const medPatuhCount = locations.filter(
    (loc) => Number(loc.patuh || 0) >= 60 && Number(loc.patuh || 0) < 85
  ).length;
  const lowPatuhCount = locations.filter((loc) => Number(loc.patuh || 0) < 60).length;

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

      const patuh = Number(loc.patuh || 0);
      let matchStatus = true;
      if (statusFilter === "HIGH") matchStatus = patuh >= 85;
      else if (statusFilter === "MED") matchStatus = patuh >= 60 && patuh < 85;
      else if (statusFilter === "LOW") matchStatus = patuh < 60;

      return matchSearch && matchKel && matchStatus;
    })
    .sort((a, b) => {
      const patuhA = Number(a.patuh || 0);
      const patuhB = Number(b.patuh || 0);
      if (sortBy === "HIGHEST") return patuhB - patuhA;
      if (sortBy === "LOWEST") return patuhA - patuhB;
      if (sortBy === "RW_ASC") return (a.rw || "").localeCompare(b.rw || "");
      if (sortBy === "KELURAHAN") return (a.kelurahan || "").localeCompare(b.kelurahan || "");
      return 0;
    });

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden border border-emerald-500/30 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh] text-slate-800 dark:text-slate-100">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-emerald-50/60 dark:bg-emerald-950/30 flex justify-between items-start shrink-0 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/40 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Wilayah Operasional
              </span>
              <span className="bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-700/40 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span> Stream Real-Time
              </span>
            </div>
            <h3 className="font-black text-2xl tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
              <LineChart className="text-cyan-600 dark:text-cyan-400" size={24} />
              Indeks Kepatuhan Pemilahan Sampah
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium max-w-xl">
              Persentase keaktifan rumah tangga dan tingkat kepatuhan pemilahan sampah terdata pada tiap Rukun Warga (RW) di wilayah operasional.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-slate-200 flex items-center justify-center border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shrink-0 z-10"
          >
            <X size={20} />
          </button>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rata-rata Kepatuhan</span>
            <span className="text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5 block">{avgPatuh}%</span>
          </div>
          <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-emerald-500/30">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Patuh Tinggi (≥85%)</span>
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">{highPatuhCount} RW</span>
          </div>
          <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-amber-500/30">
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Sedang (60-84%)</span>
            <span className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5 block">{medPatuhCount} RW</span>
          </div>
          <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-rose-500/30">
            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">Perlu Perhatian (&lt;60%)</span>
            <span className="text-lg font-black text-rose-600 dark:text-rose-400 mt-0.5 block">{lowPatuhCount} RW</span>
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
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 pl-10 pr-8 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
              {search && (
                <button
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
                className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-200 px-3 py-2 rounded-xl outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="SEMUA">Semua Kelurahan</option>
                {uniqueKelurahan.map((kel) => (
                  <option key={kel} value={kel}>{kel}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-200 px-3 py-2 rounded-xl outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="ALL">Semua Kepatuhan</option>
                <option value="HIGH">Tinggi (≥85%)</option>
                <option value="MED">Sedang (60-84%)</option>
                <option value="LOW">Perlu Perhatian (&lt;60%)</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-200 px-3 py-2 rounded-xl outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="HIGHEST">Kepatuhan Tertinggi</option>
                <option value="LOWEST">Kepatuhan Terendah</option>
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
              const patuh = Number(loc.patuh || 0);
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
                        <span>{loc.titikCount || 0} Titik Tempat Sampah</span>
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold shadow-2xs ${
                          isHigh
                            ? "bg-emerald-500/10 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                            : isMed
                            ? "bg-amber-500/10 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                            : "bg-rose-500/10 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.2)]"
                        }`}
                      >
                        {isHigh ? (
                          <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                        ) : isMed ? (
                          <Sparkles size={13} className="text-amber-600 dark:text-amber-400" />
                        ) : (
                          <AlertTriangle size={13} className="text-rose-600 dark:text-rose-400" />
                        )}
                        {patuh}% Patuh
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isHigh
                            ? "bg-emerald-600 dark:bg-emerald-500"
                            : isMed
                            ? "bg-amber-500"
                            : "bg-rose-500"
                        }`}
                        style={{ width: `${Math.max(patuh, 4)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center text-xs text-slate-400 shrink-0">
          <span>Menampilkan <strong className="text-slate-900 dark:text-slate-100">{filteredLocations.length}</strong> dari <strong className="text-slate-900 dark:text-slate-100">{locations.length}</strong> Rukun Warga (RW)</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold rounded-xl transition cursor-pointer border border-slate-300 dark:border-slate-700"
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
                <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{organik} Kg</h3>
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
                <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{anorganik} Kg</h3>
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
              onClick={() => navigate("/pengaturan")}
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
                Setoran Terakhir
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
                Belum ada riwayat setoran sampah.
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
                        <span className="font-normal text-[10px]">Kg</span>
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
        <LeaderboardWidget />
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
                Semua Riwayat Setoran Sampah
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
                {["ALL", "ORGANIC", "NON_ORGANIC"].map((type) => (
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
                <p className="text-xs text-slate-500 py-6 text-center">Tidak ada data setoran.</p>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-800/60">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 border-b border-slate-200 dark:border-slate-800">
                          <th className="p-3 font-bold">Tanggal</th>
                          <th className="p-3 font-bold">Kategori</th>
                          <th className="p-3 font-bold">Berat (Kg)</th>
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
}) => {
  const styles = KPI_COLOR_STYLES[color];
  const content = (
    <div
      className={`bg-white dark:bg-slate-900 shadow-xs rounded-2xl p-5 border border-slate-200 dark:border-slate-800 border-t-4 ${styles.border} flex flex-col justify-between h-full hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group ${linkTo ? "cursor-pointer" : ""}`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-11 h-11 ${styles.icon} text-white rounded-xl flex items-center justify-center shrink-0 shadow-xs`}
        >
          {renderKpiIcon(iconName)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider truncate">{label}</p>
          <h4 className="text-[24px] font-black text-slate-900 dark:text-slate-100 tracking-tight mt-0.5 leading-none">
            {value !== undefined ? value : "-"}
          </h4>
        </div>
      </div>
      {(trend || trendLabel) && (
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
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="block h-full">
        {content}
      </Link>
    );
  }
  return content;
};

// ========== Main Executive Dashboard ==========
const Dashboard: React.FC = () => {
  const { user, updateWilayah } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [recentBins, setRecentBins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [hoveredTrendIndex, setHoveredTrendIndex] = useState<number | null>(null);
  const [showCompositionDetail, setShowCompositionDetail] = useState(false);
  const [timeFilter, setTimeFilter] = useState("semua");

  // Wilayah selection state (Default: Kecamatan Coblong)
  const isLurahRole = (user?.role || user?.peran || "").toUpperCase() === "LURAH";
  const userKelurahan = user?.kelurahan || (user?.address?.includes("Cipaganti") || user?.name?.includes("Cipaganti") ? "Cipaganti" : "");
  
  const [selectedWilayah, setSelectedWilayah] = useState<string>(() => {
    if (isLurahRole) {
      return userKelurahan ? (userKelurahan.startsWith("Kel.") ? userKelurahan : `Kel. ${userKelurahan}`) : "Kel. Cipaganti";
    }
    if (user?.wilayah && user.wilayah !== "PT Makerindo" && user.wilayah !== "Sistem Pusat" && user.wilayah !== "Dinas Lingkungan Hidup") {
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
  const [selectedBinForDetail, setSelectedBinForDetail] = useState<any | null>(null);
  const [deleteBinConfirm, setDeleteBinConfirm] = useState<any | null>(null);

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

  useEffect(() => {
    if (
      user?.peran === "WARGA" ||
      user?.peran === "MAHASISWA_KKN" ||
      user?.peran === "PETUGAS_RESIDU" ||
      user?.peran === "RW" ||
      user?.peran === "DPL" ||
      user?.peran === "DOSEN_PEMBIMBING"
    ) {
      setLoading(false);
      return;
    }

    const effectiveWilayah = isLurahRole
      ? (userKelurahan ? (userKelurahan.startsWith("Kel.") ? userKelurahan : `Kel. ${userKelurahan}`) : "Kel. Cipaganti")
      : (selectedWilayah || "Semua Wilayah");

    const fetchStats = async () => {
      try {
        setError("");
        const response = await api.get("/dashboard/kpi", {
          params: { wilayah: effectiveWilayah, period: timeFilter },
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

        setStats({
          totalPengguna: {
            value: (kpi.totalUsers ?? 0).toLocaleString("id-ID"),
            trend: "Terdaftar",
            trendLabel: timeFilter === "semua" ? "Total Keseluruhan" : `Periode ${timeFilter}`,
            trendUp: true,
          },
          tempatSampahAktif: {
            value: (kpi.tempatSampahAktif ?? 0).toLocaleString("id-ID"),
            trend: (kpi.alertTempatSampahPenuh ?? 0) > 0 ? `${kpi.alertTempatSampahPenuh} Penuh` : "Kondisi Aman",
            trendLabel: "Status Operasional",
            trendUp: (kpi.alertTempatSampahPenuh ?? 0) === 0,
          },
          lokasiTerdaftar: {
            value: (kpi.lokasiTerdaftar ?? 0).toLocaleString("id-ID"),
            trend: "Wilayah Terjangkau",
            trendLabel: "Rukun Warga (RW)",
            trendUp: true,
          },
          setoranHariIni: {
            value: `${Number(kpi.setoranHariIniKg ?? 0).toFixed(2)} Kg`,
            trend: "Aktivitas Setoran",
            trendLabel: timeFilter === "semua" ? "Total Keseluruhan" : `Periode ${timeFilter}`,
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
            organik: { berat: `${organikKg.toFixed(2)} Kg`, persentase: `${pctOrganik}%` },
            anorganik: { berat: `${anorganikKg.toFixed(2)} Kg`, persentase: `${pctAnorganik}%` },
            residu: { berat: `${residuKg.toFixed(2)} Kg`, persentase: `${pctResidu}%` },
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
            organikRate: 0,
            anorganikRate: 0,
            organikBinTotal: 0,
            anorganikBinTotal: 0,
          },
        });

        const [binsSettled, trendSettled, locSettled] =
          await Promise.allSettled([
            api.get("/bins"),
            api.get("/dashboard/trend", { params: { weeks, wilayah: effectiveWilayah } }),
            api.get("/bins/locations"),
          ]);

        const isDistrictScope =
          !effectiveWilayah ||
          effectiveWilayah === "Kecamatan Coblong" ||
          effectiveWilayah === "Semua Wilayah" ||
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
      } catch (err) {
        console.error("Dashboard KPI error", err);
        setError("Gagal memuat data dashboard dari server.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user, weeks, timeFilter, selectedWilayah]);

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
          <p className="text-slate-400 font-medium text-xs tracking-wider uppercase">Memuat data cyber dashboard...</p>
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

  if (user?.peran === "WARGA") return <WargaDashboard />;
  if (user?.peran === "RW") return <RwDashboard />;
  if (user?.peran === "MAHASISWA_KKN") return <KknDashboard />;
  if (user?.peran === "PETUGAS_RESIDU") return <ResiduDashboard />;
  if (user?.peran === "DPL" || user?.peran === "DOSEN_PEMBIMBING") return <DplDashboardPage />;

  if (user?.peran === "PANITIA_TASKFORCE" || user?.peran === "PEMIMPIN") {
    return <TaskforceDashboardPage />;
  }

  // Scaling factors for Trend SVG
  const maxWeightTrend = Math.max(
    ...trendData.map((d) => Math.max(d.organic || 0, d.inorganic || 0, d.residu || 0, d.weight || 0)),
    10
  );
  const trendPoints = trendData.map((d, i) => {
    const x = trendData.length > 1 ? 60 + (i / (trendData.length - 1)) * 620 : 350;
    const yOrganic = 280 - ((d.organic || 0) / maxWeightTrend) * 240;
    const yInorganic = 280 - ((d.inorganic || 0) / maxWeightTrend) * 240;
    const yResidu = 280 - ((d.residu || 0) / maxWeightTrend) * 240;
    return { x, yOrganic, yInorganic, yResidu, label: d.label, organic: d.organic, inorganic: d.inorganic, residu: d.residu };
  });

  const trendOrganicPath = trendPoints
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.yOrganic}`)
    .join(" ");
  const trendInorganicPath = trendPoints
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.yInorganic}`)
    .join(" ");
  const trendResiduPath = trendPoints
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.yResidu}`)
    .join(" ");

  const trendOrganicAreaPath =
    trendPoints.length > 0
      ? `${trendOrganicPath} L${trendPoints[trendPoints.length - 1].x},280 L${trendPoints[0].x},280 Z`
      : "";
  const trendInorganicAreaPath =
    trendPoints.length > 0
      ? `${trendInorganicPath} L${trendPoints[trendPoints.length - 1].x},280 L${trendPoints[0].x},280 Z`
      : "";
  const trendResiduAreaPath =
    trendPoints.length > 0
      ? `${trendResiduPath} L${trendPoints[trendPoints.length - 1].x},280 L${trendPoints[0].x},280 Z`
      : "";

  void trendInorganicAreaPath;
  void trendResiduAreaPath;
  void KpiCard;

  return (
    <div className="space-y-6 pb-12 text-slate-800 dark:text-slate-100 font-sans relative">
      {/* 1. Header Bar (Clean Multi-Tier Executive UI) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
        {/* Top Tier: Title & Live Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Dasbor Monitoring BERSEKA
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Pusat komando pemantauan pemilahan sampah cerdas, sektor kebersihan &amp; residu Rukun Warga (RW)
            </p>
          </div>

          <div className="self-start sm:self-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-700/40 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#009966] animate-pulse" />
              Real-Time Monitoring
            </span>
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
              onChange={(val) => setTimeFilter(val)}
              options={PERIODE_OPTIONS}
              icon={<Calendar size={15} className="text-sky-600 flex-shrink-0" />}
              label="Periode:"
              variant="slate"
            />
          </div>

          <button
            onClick={() => setShowComplianceModal(true)}
            className="bg-[#009966] hover:bg-[#008055] text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95 ml-auto sm:ml-0"
          >
            <LineChart size={15} />
            <span>Indeks Kepatuhan</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Section (5 Cards for BERSEKA Domain) */}
      <div className="px-1 text-[10.5px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
        Ringkasan Operasional Pemilahan Sampah
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 relative z-10">
        <KpiCard
          iconName="group"
          color="blue"
          label="Total Pengguna"
          value={stats?.totalPengguna?.value}
          trend={stats?.totalPengguna?.trend}
          trendLabel={stats?.totalPengguna?.trendLabel}
          trendUp={stats?.totalPengguna?.trendUp}
          linkTo="/master-pengguna"
        />
        <KpiCard
          iconName="delete"
          color="emerald"
          label="Tempat Sampah Aktif"
          value={stats?.tempatSampahAktif?.value}
          trend={stats?.tempatSampahAktif?.trend}
          trendLabel={stats?.tempatSampahAktif?.trendLabel}
          trendUp={stats?.tempatSampahAktif?.trendUp}
          linkTo="/master-data/manajemen-tempat-sampah"
        />
        <KpiCard
          iconName="location_on"
          color="indigo"
          label="Lokasi Terdaftar (RW)"
          value={stats?.lokasiTerdaftar?.value}
          trend={stats?.lokasiTerdaftar?.trend}
          trendLabel={stats?.lokasiTerdaftar?.trendLabel}
          trendUp={stats?.lokasiTerdaftar?.trendUp}
          linkTo="/master-data/rukun-warga"
        />
        <KpiCard
          iconName="shopping_bag"
          color="amber"
          label={
            timeFilter === "harian" ? "Setoran Hari Ini" :
            timeFilter === "mingguan" ? "Setoran Minggu Ini" :
            timeFilter === "bulanan" ? "Setoran Bulan Ini" :
            timeFilter === "tahunan" ? "Setoran Tahun Ini" :
            "Total Setoran"
          }
          value={stats?.setoranHariIni?.value}
          trend={stats?.setoranHariIni?.trend}
          trendLabel={stats?.setoranHariIni?.trendLabel}
          trendUp={stats?.setoranHariIni?.trendUp}
          linkTo="/rekapitulasi-setoran"
        />
        <KpiCard
          iconName="stars"
          color="yellow"
          label="Total Poin"
          value={stats?.totalPoin?.value}
          trend={stats?.totalPoin?.trend}
          trendLabel={stats?.totalPoin?.trendLabel}
          trendUp={stats?.totalPoin?.trendUp}
          linkTo="/peringkat"
        />
      </div>

      {/* 3. Charts & Komposisi Grid (2 Columns, 6 cols each) */}
      <div className="px-1 pt-2 text-[10.5px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
        Analitik Tren Setoran &amp; Komposisi Sampah
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        {/* Left Column (6 cols): Trend Setoran Chart */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 shadow-xs rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 relative overflow-hidden flex flex-col justify-between space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="space-y-1">
              <h4 className="font-bold text-[18px] text-slate-900 dark:text-slate-100">
                Grafik Tren Setoran Sampah (Real-Time)
              </h4>
              <div className="flex gap-4 text-[11px] font-bold">
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#34d399] shadow-[0_0_8px_#34d399]"></span> Organik
                </span>
                <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#fbbf24] shadow-[0_0_8px_#fbbf24]"></span> Anorganik
                </span>
                <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#fb7185] shadow-[0_0_8px_#fb7185]"></span> Residu
                </span>
              </div>
            </div>
            <select
              value={weeks}
              onChange={(e) => setWeeks(parseInt(e.target.value))}
              className="bg-slate-50 dark:bg-slate-800 px-3.5 py-2 rounded-xl text-[12px] border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer font-bold shadow-2xs hover:border-emerald-500/50 transition-all"
            >
              <option value={1}>Hari Ini (24 Jam)</option>
              <option value={2}>7 Hari Terakhir</option>
              <option value={4}>4 Minggu Terakhir</option>
              <option value={8}>8 Minggu Terakhir</option>
              <option value={12}>12 Minggu Terakhir</option>
              <option value={24}>6 Bulan Terakhir</option>
              <option value={52}>1 Tahun Terakhir</option>
              <option value={100}>Semua Periode</option>
            </select>
          </div>

          <div className="h-[360px] w-full relative">
            {trendPoints.length > 0 ? (
              <svg className="w-full h-full" viewBox="0 0 700 320">
                <defs>
                  <linearGradient id="orgGradDark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#34d399" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="inorgGradDark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="residuGradDark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fb7185" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#fb7185" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                <text x="10" y="20" fill="#94a3b8" fontSize="10" fontWeight="bold">
                  Berat (kg)
                </text>

                {[0, 25, 50, 75, 100].map((pct) => {
                  const y = 280 - (pct / 100) * 240;
                  return (
                    <g key={pct}>
                      <line x1="60" y1={y} x2="680" y2={y} stroke="#334155" strokeWidth="1" strokeDasharray={pct === 0 ? "none" : "3,3"} opacity="0.6" />
                      <text
                        x="52"
                        y={y + 3}
                        textAnchor="end"
                        fill="#94a3b8"
                        fontSize="9"
                        fontWeight="bold"
                      >
                        {Math.round((maxWeightTrend * pct) / 100)}
                      </text>
                    </g>
                  );
                })}

                <line x1="60" y1="40" x2="60" y2="280" stroke="#475569" strokeWidth="1.5" />
                <path d={trendOrganicAreaPath} fill="url(#orgGradDark)" />
                <path d={trendInorganicAreaPath} fill="url(#inorgGradDark)" />
                <path d={trendResiduAreaPath} fill="url(#residuGradDark)" />

                <path d={trendOrganicPath} fill="none" stroke="#34d399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <path d={trendInorganicPath} fill="none" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <path d={trendResiduPath} fill="none" stroke="#fb7185" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                {trendPoints.map((p, i) => (
                  <g 
                    key={i}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredTrendIndex(i)}
                    onMouseLeave={() => setHoveredTrendIndex(null)}
                  >
                    <line x1={p.x} y1="40" x2={p.x} y2="280" stroke="#34d399" strokeWidth={hoveredTrendIndex === i ? "1.5" : "0"} strokeDasharray="2,2" opacity="0.6" />

                    <circle cx={p.x} cy={p.yOrganic} r={hoveredTrendIndex === i ? 6 : 4} fill="#34d399" stroke="#ffffff" strokeWidth="2" />
                    <circle cx={p.x} cy={p.yInorganic} r={hoveredTrendIndex === i ? 6 : 4} fill="#fbbf24" stroke="#ffffff" strokeWidth="2" />
                    <circle cx={p.x} cy={p.yResidu} r={hoveredTrendIndex === i ? 6 : 4} fill="#fb7185" stroke="#ffffff" strokeWidth="2" />

                    <text
                      x={p.x}
                      y="305"
                      textAnchor="middle"
                      fill={hoveredTrendIndex === i ? "#10b981" : "#94a3b8"}
                      fontSize="9.5"
                      fontWeight="bold"
                    >
                      {p.label ? p.label.toString().replace(/^Mng\s*/i, "Minggu ") : ""}
                    </text>
                  </g>
                ))}

                {/* Floating Hover Tooltip */}
                {hoveredTrendIndex !== null && trendPoints[hoveredTrendIndex] && (
                  <g transform={`translate(${Math.min(Math.max(trendPoints[hoveredTrendIndex].x - 75, 60), 530)}, ${Math.max(trendPoints[hoveredTrendIndex].yOrganic - 85, 25)})`}>
                    <rect width="150" height="72" rx="10" fill="#0f172a" stroke="#10b981" strokeWidth="1" opacity="0.95" />
                    <text x="75" y="18" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="black">
                      {trendPoints[hoveredTrendIndex].label}
                    </text>
                    <text x="12" y="35" fill="#34d399" fontSize="9.5" fontWeight="bold">
                      🌱 Organik: {trendPoints[hoveredTrendIndex].organic} kg
                    </text>
                    <text x="12" y="49" fill="#fbbf24" fontSize="9.5" fontWeight="bold">
                      ♻️ Anorganik: {trendPoints[hoveredTrendIndex].inorganic} kg
                    </text>
                    <text x="12" y="63" fill="#fb7185" fontSize="9.5" fontWeight="bold">
                      🗑️ Residu: {trendPoints[hoveredTrendIndex].residu} kg
                    </text>
                  </g>
                )}
              </svg>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-slate-500 italic">
                Belum ada data trend untuk periode ini
              </div>
            )}
          </div>
        </div>

        {/* Right Column (6 cols): Komposisi Sampah Card */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 shadow-xs rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between relative overflow-hidden">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h4 className="font-bold text-[18px] text-slate-900 dark:text-slate-100">Komposisi Sampah</h4>
              <p className="text-[11px] text-slate-400 dark:text-slate-400 font-medium mt-0.5">
                Akumulasi Real-time Hasil Pemilahan &amp; Residu
              </p>
            </div>
            <span className="text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700/40 px-3 py-1 rounded-full uppercase tracking-wider">
              Persentase Volume
            </span>
          </div>

          {(() => {
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

            const rawOrg = parseKgValue(stats?.komposisiSampah?.organikKg ?? stats?.komposisiSampah?.organik?.berat, 0);
            const rawAnorg = parseKgValue(stats?.komposisiSampah?.anorganikKg ?? stats?.komposisiSampah?.anorganik?.berat, 0);
            const rawResidu = parseKgValue(stats?.komposisiSampah?.residuKg ?? stats?.komposisiSampah?.residu?.berat, 0);

            const totalKg = rawOrg + rawAnorg + rawResidu;
            const pctOrg = totalKg > 0 ? Math.round((rawOrg / totalKg) * 100) : 0;
            const pctAnorg = totalKg > 0 ? Math.round((rawAnorg / totalKg) * 100) : 0;
            const pctResidu = totalKg > 0 ? Math.max(0, 100 - pctOrg - pctAnorg) : 0;

            const c = 2 * Math.PI * 50;
            const valOrg = (pctOrg / 100) * c;
            const valAnorg = (pctAnorg / 100) * c;
            const valResidu = (pctResidu / 100) * c;

            let dominantLabel = "Residu";
            let dominantPct = pctResidu;
            let dominantColor = "text-rose-600 dark:text-rose-400";

            if (pctOrg >= pctAnorg && pctOrg >= pctResidu) {
              dominantLabel = "Organik";
              dominantPct = pctOrg;
              dominantColor = "text-emerald-600 dark:text-emerald-400";
            } else if (pctAnorg >= pctOrg && pctAnorg >= pctResidu) {
              dominantLabel = "Anorganik";
              dominantPct = pctAnorg;
              dominantColor = "text-amber-600 dark:text-amber-400";
            }

            return (
              <div className="flex-1 flex flex-col items-center justify-between my-1">
                <div className="w-40 h-40 relative flex items-center justify-center my-2 group cursor-pointer">
                  <svg className="w-40 h-40 transform -rotate-90">
                    <circle cx="80" cy="80" r="50" fill="transparent" stroke="#f1f5f9" className="dark:stroke-slate-800" strokeWidth="12" />
                    {pctOrg > 0 && (
                      <circle
                        cx="80"
                        cy="80"
                        r="50"
                        fill="transparent"
                        stroke="#34d399"
                        strokeWidth="12"
                        strokeDasharray={`${valOrg} ${c}`}
                        strokeDashoffset={0}
                        className="transition-all duration-500 hover:stroke-[15]"
                      />
                    )}
                    {pctAnorg > 0 && (
                      <circle
                        cx="80"
                        cy="80"
                        r="50"
                        fill="transparent"
                        stroke="#fbbf24"
                        strokeWidth="12"
                        strokeDasharray={`${valAnorg} ${c}`}
                        strokeDashoffset={-valOrg}
                        className="transition-all duration-500 hover:stroke-[15]"
                      />
                    )}
                    {pctResidu > 0 && (
                      <circle
                        cx="80"
                        cy="80"
                        r="50"
                        fill="transparent"
                        stroke="#fb7185"
                        strokeWidth="12"
                        strokeDasharray={`${valResidu} ${c}`}
                        strokeDashoffset={-(valOrg + valAnorg)}
                        className="transition-all duration-500 hover:stroke-[15]"
                      />
                    )}
                  </svg>
                  <div className="absolute text-center flex flex-col items-center justify-center">
                    <span className={`block text-2xl font-black leading-none ${dominantColor}`}>
                      {dominantPct}%
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider mt-1 block">
                      {dominantLabel}
                    </span>
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold block mt-0.5 font-mono">
                      {totalKg.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Kg Total
                    </span>
                  </div>
                </div>

                <div className="mt-3 w-full space-y-3 bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1.5 font-extrabold text-slate-600 dark:text-slate-300">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#34d399] shadow-[0_0_8px_#34d399] inline-block"></span>
                        Organik
                      </div>
                      <div className="font-mono font-bold text-slate-700 dark:text-slate-200">
                        {rawOrg.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Kg{" "}
                        <span className="text-emerald-600 dark:text-emerald-400 font-extrabold ml-1">({pctOrg}%)</span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#34d399] rounded-full transition-all duration-500"
                        style={{ width: `${pctOrg}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1.5 font-extrabold text-slate-600 dark:text-slate-300">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#fbbf24] shadow-[0_0_8px_#fbbf24] inline-block"></span>
                        Anorganik
                      </div>
                      <div className="font-mono font-bold text-slate-700 dark:text-slate-200">
                        {rawAnorg.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Kg{" "}
                        <span className="text-amber-600 dark:text-amber-400 font-extrabold ml-1">({pctAnorg}%)</span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#fbbf24] rounded-full transition-all duration-500"
                        style={{ width: `${pctAnorg}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1.5 font-extrabold text-slate-600 dark:text-slate-300">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#fb7185] shadow-[0_0_8px_#fb7185] inline-block"></span>
                        Residu
                      </div>
                      <div className="font-mono font-bold text-slate-700 dark:text-slate-200">
                        {rawResidu.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Kg{" "}
                        <span className="text-rose-600 dark:text-rose-400 font-extrabold ml-1">({pctResidu}%)</span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#fb7185] rounded-full transition-all duration-500"
                        style={{ width: `${pctResidu}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          <button
            onClick={() => setShowCompositionDetail(true)}
            className="mt-3 w-full py-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-extrabold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs"
          >
            Lihat Detail Komposisi
          </button>
        </div>
      </div>

      {/* 3.5 Card Tingkat Kepatuhan Pemilahan Sampah (Verifikasi AI vs Kategori Tempat Sampah) */}
      <div className="px-1 pt-2 text-[10.5px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
        Verifikasi AI vs Kategori Tempat Sampah
      </div>
      <div className="bg-white dark:bg-slate-900 shadow-xs rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 relative overflow-hidden z-10 space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-700/40 shrink-0 font-bold">
              <span className="material-symbols-outlined text-2xl">verified</span>
            </div>
            <div>
              <h4 className="font-extrabold text-[18px] text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                Tingkat Kepatuhan Pemilahan Sampah
                <span className="text-[10px] font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/40 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Real-Time AI Match
                </span>
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Kesesuaian antara kategori tempat sampah (Organik/Anorganik/Residu) dengan hasil klasifikasi AI dari setoran warga.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1.5 rounded-xl text-xs font-black border flex items-center gap-1.5 ${
              (stats?.kepatuhanPemilahan?.totalCount ?? 0) === 0
                ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                : (stats?.kepatuhanPemilahan?.rate ?? 0) >= 80
                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700/40"
                : (stats?.kepatuhanPemilahan?.rate ?? 0) >= 60
                ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700/40"
                : "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-700/40"
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                (stats?.kepatuhanPemilahan?.totalCount ?? 0) === 0
                  ? "bg-slate-400"
                  : (stats?.kepatuhanPemilahan?.rate ?? 0) >= 80
                  ? "bg-emerald-500 animate-pulse"
                  : (stats?.kepatuhanPemilahan?.rate ?? 0) >= 60
                  ? "bg-amber-500"
                  : "bg-rose-500 animate-bounce"
              }`} />
              Status Kepatuhan: {
                (stats?.kepatuhanPemilahan?.totalCount ?? 0) === 0
                  ? "Belum Ada Setoran"
                  : (stats?.kepatuhanPemilahan?.rate ?? 0) >= 80
                  ? "Sangat Baik"
                  : (stats?.kepatuhanPemilahan?.rate ?? 0) >= 60
                  ? "Cukup Patuh"
                  : "Perlu Perhatian"
              }
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Gauge / Rating Circle (4 cols) */}
          <div className="md:col-span-4 bg-slate-50/70 dark:bg-slate-800/70 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-36 h-36 transform -rotate-90">
                <circle cx="72" cy="72" r="54" fill="transparent" stroke="#e2e8f0" className="dark:stroke-slate-700" strokeWidth="10" />
                <circle
                  cx="72"
                  cy="72"
                  r="54"
                  fill="transparent"
                  stroke={(stats?.kepatuhanPemilahan?.rate ?? 0) >= 80 ? "#10b981" : (stats?.kepatuhanPemilahan?.rate ?? 0) >= 60 ? "#f59e0b" : (stats?.kepatuhanPemilahan?.totalCount ?? 0) === 0 ? "#64748b" : "#ef4444"}
                  strokeWidth="10"
                  strokeDasharray={`${(((stats?.kepatuhanPemilahan?.rate ?? 0)) / 100) * (2 * Math.PI * 54)} ${2 * Math.PI * 54}`}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute text-center flex flex-col items-center">
                <span className="text-3xl font-black text-slate-800 dark:text-slate-100 leading-none">
                  {stats?.kepatuhanPemilahan?.rate ?? 0}%
                </span>
                <span className="text-[10px] text-slate-400 uppercase font-extrabold mt-1">
                  Skor Kepatuhan
                </span>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 w-full text-center pt-2 border-t border-slate-200/80 dark:border-slate-700/80">
              <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-emerald-100 dark:border-emerald-700/30 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Patuh (Sesuai)</span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                  {stats?.kepatuhanPemilahan?.compliantCount ?? 0} <span className="text-[10px] font-normal text-slate-400">setoran</span>
                </span>
              </div>
              <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-rose-100 dark:border-rose-700/30 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Salah Tempat Sampah</span>
                <span className="text-sm font-black text-rose-600 dark:text-rose-400">
                  {stats?.kepatuhanPemilahan?.nonCompliantCount ?? 0} <span className="text-[10px] font-normal text-slate-400">setoran</span>
                </span>
              </div>
            </div>
          </div>

          {/* Breakdown Per Kategori Tempat Sampah (4 cols) */}
          <div className="md:col-span-4 space-y-4">
            <h5 className="font-extrabold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-emerald-600 dark:text-emerald-400">pie_chart</span>
              Kesesuaian Per Kategori Tempat Sampah
            </h5>

            {/* Organik Bin */}
            <div className="bg-emerald-50/60 dark:bg-emerald-950/40 p-3.5 rounded-2xl border border-emerald-100 dark:border-emerald-700/30 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-extrabold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
                  Tempat Sampah Organik
                </span>
                <span className="font-black text-emerald-700 dark:text-emerald-400 font-mono">
                  {stats?.kepatuhanPemilahan?.organikRate ?? 0}% Sesuai
                </span>
              </div>
              <div className="h-2 w-full bg-emerald-200/50 dark:bg-emerald-900/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${stats?.kepatuhanPemilahan?.organikRate ?? 0}%` }}
                />
              </div>
              <p className="text-[10px] text-emerald-700/80 dark:text-emerald-300/80 font-medium leading-tight">
                Kesesuaian hasil AI terdeteksi Organik pada Tempat Sampah berkategori Organik ({stats?.kepatuhanPemilahan?.organikBinTotal ?? 0} Tempat Sampah terdata).
              </p>
            </div>

            {/* Anorganik Bin */}
            <div className="bg-amber-50/60 dark:bg-amber-950/40 p-3.5 rounded-2xl border border-amber-100 dark:border-amber-700/30 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-extrabold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs" />
                  Tempat Sampah Anorganik
                </span>
                <span className="font-black text-amber-700 dark:text-amber-400 font-mono">
                  {stats?.kepatuhanPemilahan?.anorganikRate ?? 0}% Sesuai
                </span>
              </div>
              <div className="h-2 w-full bg-amber-200/50 dark:bg-amber-900/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${stats?.kepatuhanPemilahan?.anorganikRate ?? 0}%` }}
                />
              </div>
              <p className="text-[10px] text-amber-700/80 dark:text-amber-300/80 font-medium leading-tight">
                Kesesuaian hasil AI terdeteksi Anorganik pada Tempat Sampah berkategori Anorganik ({stats?.kepatuhanPemilahan?.anorganikBinTotal ?? 0} Tempat Sampah terdata).
              </p>
            </div>
          </div>

          {/* Edukasi & Deteksi Kontaminasi (4 cols) */}
          <div className="md:col-span-4 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3 flex flex-col justify-between h-full">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-extrabold text-xs">
                <span className="material-symbols-outlined text-base text-amber-600 dark:text-amber-400">warning</span>
                Deteksi Kontaminasi &amp; Edukasi
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 font-normal leading-relaxed">
                Jika tempat sampah berkategori <strong className="text-emerald-700 dark:text-emerald-400 font-bold">Organik</strong> tetapi hasil deteksi AI setoran warga teridentifikasi didominasi <strong className="text-amber-700 dark:text-amber-400 font-bold">Anorganik/Residu</strong>, maka tingkat kepatuhan pada lokasi tersebut dianggap <strong className="text-rose-600 dark:text-rose-400 font-bold">Rendah (Tercampur)</strong>.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10.5px]">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Auto-Audit AI BERSEKA</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                Aktif
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* === Monitoring Leaderboard Section === */}
      <div className="w-full relative z-10">
        <LeaderboardWidget />
      </div>

      {/* === Central Operational Lists & Activity === */}
      <div className="px-1 pt-2 text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
        Data Operasional &amp; Sesi Pengguna
      </div>
      <div className="grid grid-cols-12 gap-6 relative z-10">
        {/* Data Tempat Sampah Terbaru */}
        <div className="col-span-12 lg:col-span-6 bg-white dark:bg-slate-900 shadow-sm rounded-3xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <Trash2 size={16} />
              </div>
              <div>
                <h4 className="font-extrabold text-[16px] text-slate-900 dark:text-slate-100 tracking-tight">
                  Data Tempat Sampah Terbaru
                </h4>
                <p className="text-[11px] text-slate-400 dark:text-slate-400 font-medium leading-none mt-0.5">
                  Monitoring Kapasitas &amp; Status QR Tempat Sampah Terdaftar
                </p>
              </div>
            </div>
            <Link
              to="/master-data/manajemen-tempat-sampah"
              className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors flex items-center gap-1 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-xl border border-emerald-500/30"
            >
              Lihat Semua <ChevronRight size={14} />
            </Link>
          </div>

          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[11px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
                  <th className="py-2.5 px-3 rounded-l-lg">ID &amp; Jenis</th>
                  <th className="py-2.5 px-3">Lokasi</th>
                  <th className="py-2.5 px-3">Kapasitas Tempat Sampah</th>
                  <th className="py-2.5 px-3 text-center">Nilai Tukar (Poin per Kg)</th>
                  <th className="py-2.5 px-3 text-right rounded-r-lg">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {recentBins.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 dark:text-slate-400 font-medium">
                      Belum ada data tempat sampah terdaftar.
                    </td>
                  </tr>
                ) : (
                  recentBins.map((bin, i) => {
                    const maxCapacityLiter = Number(bin.maxCapacityLiter);
                    const cap = Math.min(100, Math.round(
                      bin.kapasitas != null
                        ? bin.kapasitas
                        : maxCapacityLiter > 0
                        ? (Number(bin.currentVolumeLiter) / maxCapacityLiter) * 100
                        : 0
                    ));
                    const categoryStr = String(bin.category?.name || bin.categoryId || "UMUM").toUpperCase();
                    const isOrganik = categoryStr.includes("ORGANIK") && !categoryStr.includes("ANORGANIK") && !categoryStr.includes("NON");
                    const isAnorganik = categoryStr.includes("ANORGANIK") || categoryStr.includes("NON");

                    const isHighCap = cap >= 90;

                    return (
                      <tr
                        key={bin.id || bin.kode || i}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-150 group"
                      >
                        <td className="py-3 px-3">
                          <div className="flex flex-col">
                            <span className="font-mono font-extrabold text-slate-900 dark:text-slate-100 text-[13px] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              {bin.qrCode || bin.kode || (bin.id ? bin.id.substring(0, 8) : "BIN")}
                            </span>
                            <div className="flex items-center gap-1 mt-0.5">
                              {isOrganik ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/30">
                                  <Leaf size={11} /> Organik
                                </span>
                              ) : isAnorganik ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30">
                                  <Recycle size={11} /> Anorganik
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                  {bin.category?.name || bin.categoryId || "Umum"}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex flex-col min-w-[110px]">
                            <span className="font-bold text-slate-700 dark:text-slate-300 text-[12px]">
                              {bin.rtRw?.kelurahan?.name || bin.kelurahan || "Wilayah Dampingan"}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-400 font-medium">
                              {(() => {
                                const rwStr = typeof bin.rtRw === "string" ? bin.rtRw : bin.rtRw?.name;
                                if (!rwStr || rwStr === "-") return "RW -";
                                return rwStr.toLowerCase().includes("rw") ? rwStr : `RW ${rwStr}`;
                              })()}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-3 min-w-[120px]">
                          <div className="flex flex-col gap-1">
                            <div className="flex justify-between items-center text-[10px] font-bold">
                              <span className={isHighCap ? "text-rose-600 dark:text-rose-400 font-black" : "text-emerald-600 dark:text-emerald-400 font-extrabold"}>
                                {isHighCap ? `${cap}% Terisi (Penuh)` : `${cap}% Terisi (Aman)`}
                              </span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isHighCap ? "bg-rose-500 animate-pulse shadow-[0_0_8px_#f43f5e]" : "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                                }`}
                                style={{ width: `${cap}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className="font-extrabold text-amber-600 dark:text-amber-400 font-mono text-[13px] bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30">
                            {bin.category?.pointsPerKg || 10}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right">
                          <div className="flex justify-end items-center gap-1">
                            <button
                              onClick={() => setSelectedBinForDetail(bin)}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors cursor-pointer"
                              title="Detail Tempat Sampah"
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              onClick={() => navigate(`/master-data/manajemen-tempat-sampah?edit=${bin.id || bin.kode}`)}
                              className="p-1.5 text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors cursor-pointer"
                              title="Edit Tempat Sampah"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => setDeleteBinConfirm(bin)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Tempat Sampah"
                            >
                              <Trash2 size={15} />
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
        </div>

        {/* Sesi Pengguna Aktif Card */}
        <div className="col-span-12 lg:col-span-6 bg-white dark:bg-slate-900 shadow-sm rounded-3xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  <UserCheck size={20} />
                </div>
                <div>
                  <h4 className="font-extrabold text-[17px] text-slate-900 dark:text-slate-100 tracking-tight">
                    Sesi Pengguna Aktif
                  </h4>
                  <p className="text-xs text-slate-400 dark:text-slate-400 font-medium leading-none mt-1">
                    Status sesi pengguna terdaftar dengan token login aktif
                  </p>
                </div>
              </div>
              {stats?.activeSessions && (
                <span className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#34d399]"></span>
                  {stats.activeSessions.total ?? 0}
                </span>
              )}
            </div>

            {stats?.activeSessions ? (
              <div className="mt-4 space-y-2.5">
                <div className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300 text-xs font-semibold">
                    <Code2 size={16} className="text-slate-400" />
                    <span>Admin / Task Force / Dev</span>
                  </div>
                  <span className="font-black text-slate-700 dark:text-slate-200 text-sm bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md border border-slate-300 dark:border-slate-700">{stats.activeSessions.admin ?? 0}</span>
                </div>

                <div className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300 text-xs font-semibold">
                    <ShieldCheck size={16} className="text-cyan-600 dark:text-cyan-400" />
                    <span>Operator (DLH / Camat / Lurah)</span>
                  </div>
                  <span className="font-extrabold text-cyan-700 dark:text-cyan-300 text-xs bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-700/40 px-2.5 py-0.5 rounded-lg">{stats.activeSessions.operator ?? 0}</span>
                </div>

                <div className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300 text-xs font-semibold">
                    <Award size={16} className="text-amber-600 dark:text-amber-400" />
                    <span>Rukun Warga (RW)</span>
                  </div>
                  <span className="font-extrabold text-amber-700 dark:text-amber-300 text-xs bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-700/40 px-2.5 py-0.5 rounded-lg">{stats.activeSessions.rw ?? 0}</span>
                </div>

                <div className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300 text-xs font-semibold">
                    <BookOpen size={16} className="text-emerald-600 dark:text-emerald-400" />
                    <span>Dosen DPL</span>
                  </div>
                  <span className="font-extrabold text-emerald-700 dark:text-emerald-300 text-xs bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-700/40 px-2.5 py-0.5 rounded-lg">{stats.activeSessions.dpl ?? 0}</span>
                </div>

                <div className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300 text-xs font-semibold">
                    <Truck size={16} className="text-rose-600 dark:text-rose-400" />
                    <span>Petugas Residu</span>
                  </div>
                  <span className="font-extrabold text-rose-700 dark:text-rose-300 text-xs bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-700/40 px-2.5 py-0.5 rounded-lg">{stats.activeSessions.residu ?? 0}</span>
                </div>

                <div className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300 text-xs font-semibold">
                    <GraduationCap size={16} className="text-indigo-600 dark:text-indigo-400" />
                    <span>Mahasiswa KKN</span>
                  </div>
                  <span className="font-extrabold text-indigo-700 dark:text-indigo-300 text-xs bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-700/40 px-2.5 py-0.5 rounded-lg">{stats.activeSessions.kkn ?? 0}</span>
                </div>
              </div>
            ) : (
              <div className="mt-4 py-8 text-center text-xs text-slate-500 dark:text-slate-400 italic">
                Belum ada data sesi pengguna aktif.
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Link
              to="/pengguna-online"
              className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-extrabold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              Kelola Pengguna Online <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform text-slate-400" />
            </Link>
          </div>
        </div>
      </div>

      {/* Compliance List Modal */}
      {showComplianceModal && (
        <ComplianceModal
          locations={locations}
          onClose={() => setShowComplianceModal(false)}
        />
      )}

      {/* Composition Detail Modal */}
      {showCompositionDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-emerald-500/30 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150 text-slate-800 dark:text-slate-100">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-850">
              <h3 className="font-bold text-[20px] text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BarChart className="text-cyan-600 dark:text-cyan-400" />
                Rincian Komposisi &amp; Aliran Sampah
              </h3>
              <button
                onClick={() => setShowCompositionDetail(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer border border-slate-300 dark:border-slate-700"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto text-sm">
              <p className="text-xs text-slate-400">
                Detail material timbulan sampah organik, anorganik, dan residu hilir terdata real-time di wilayah operasional.
              </p>

              <div className="space-y-3">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-700/30">
                  <h4 className="font-extrabold text-emerald-700 dark:text-emerald-400 text-[13px] uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Leaf size={16} />
                    Material Organik ({stats?.komposisiSampah?.organik?.persentase || "0%"})
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 font-medium block">Total Berat Real</span>
                      <strong className="text-slate-900 dark:text-slate-100 font-bold font-mono">{Math.round(Number(stats?.komposisiSampah?.organikKg || 0)).toLocaleString("id-ID")} Kg</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 font-medium block">Metode Pengolahan</span>
                      <strong className="text-emerald-700 dark:text-emerald-400 font-extrabold">Loseda &amp; Maggot</strong>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-700/30">
                  <h4 className="font-extrabold text-amber-700 dark:text-amber-400 text-[13px] uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Recycle size={16} />
                    Material Anorganik ({stats?.komposisiSampah?.anorganik?.persentase || "0%"})
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 font-medium block">Total Berat Real</span>
                      <strong className="text-slate-900 dark:text-slate-100 font-bold font-mono">{Math.round(Number(stats?.komposisiSampah?.anorganikKg || 0)).toLocaleString("id-ID")} Kg</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 font-medium block">Metode Daur Ulang</span>
                      <strong className="text-amber-700 dark:text-amber-400 font-extrabold">Bank Sampah &amp; Poin</strong>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-700/30">
                  <h4 className="font-extrabold text-rose-700 dark:text-rose-400 text-[13px] uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Trash2 size={16} />
                    Material Residu Hilir ({stats?.komposisiSampah?.residu?.persentase || "0%"})
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 font-medium block">Total Berat Hilir</span>
                      <strong className="text-slate-900 dark:text-slate-100 font-bold font-mono">{Math.round(Number(stats?.komposisiSampah?.residuKg || 0)).toLocaleString("id-ID")} Kg</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 font-medium block">Tujuan Akhir</span>
                      <strong className="text-rose-700 dark:text-rose-400 font-extrabold">TPA Hilir Kota</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowCompositionDetail(false)}
                className="px-5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors border border-slate-300 dark:border-slate-700 cursor-pointer"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Bin Modal */}
      {selectedBinForDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-emerald-500/30 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150 text-slate-800 dark:text-slate-100">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-850">
              <h3 className="font-bold text-[18px] text-slate-900 dark:text-slate-100">Detail Tempat Sampah Cerdas</h3>
              <button
                onClick={() => setSelectedBinForDetail(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer border border-slate-300 dark:border-slate-700"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex justify-center">
                <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border-2 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.2)] flex flex-col items-center gap-2">
                  <img
                    className="w-40 h-40"
                    alt="QR Code"
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(selectedBinForDetail.qrCode || selectedBinForDetail.kode)}`}
                  />
                  <span className="text-[14px] font-mono font-bold text-slate-900 dark:text-slate-100 tracking-widest">
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
                    {typeof selectedBinForDetail.rtRw === "string"
                      ? selectedBinForDetail.rtRw
                      : selectedBinForDetail.rtRw?.name || "-"}
                  </span>
                </div>
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
                <div className="flex justify-between items-center py-2 text-sm">
                  <span className="text-slate-400">Poin Setoran</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {selectedBinForDetail.category?.pointsPerKg || 100} Poin / Kg
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedBinForDetail(null)}
                className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 transition-colors cursor-pointer"
              >
                Tutup Detail
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
