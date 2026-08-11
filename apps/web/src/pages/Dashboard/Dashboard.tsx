import { X, RefreshCcw, Settings, Save, Star, Banknote, Loader2, Building2, Recycle, AlertCircle, Eye, History, LineChart, BarChart, Leaf, TrendingUp, Wallet, Zap, Home, MapPin, Bell, RefreshCw, Megaphone, AlertTriangle, Truck, Archive, Send, Pencil, Trash2, Calendar, ChevronRight, GraduationCap, Search, CheckCircle2, Sparkles, RotateCcw, UserCheck, Code2, ShieldCheck, Award, BookOpen } from "lucide-react";

/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { RwDashboard } from "../RwPortal/RwDashboard";
import api from "../../services/api";
import showToast from "../../utils/showToast";
import { useAuthStore } from "../../store/useAuthStore";
import { getProfilePhotoUrl, handleAvatarError } from "../../utils/photoUtils";
import KknDashboard from "../KknDashboard/KknDashboard";
import ResiduDashboard from "../ResiduDashboard/ResiduDashboard";
import DplDashboardPage from "../dpl/DplDashboardPage";
import LeaderboardWidget from "../../components/LeaderboardWidget";
import { CustomSelect, type SelectOption } from "../../components/common/CustomSelect";
import { IconRenderer } from "../../components/common/IconRenderer";
import { ConfirmModal } from "../../components/common/ConfirmModal";

const WILAYAH_OPTIONS: SelectOption[] = [
  { value: "Kecamatan Coblong", label: "Kecamatan Coblong (Semua)", sublabel: "Cakupan Seluruh Kecamatan" },
  { value: "Kel. Dago", label: "Kel. Dago", sublabel: "Kelurahan Dago" },
  { value: "Kel. Sadang Serang", label: "Kel. Sadang Serang", sublabel: "Kelurahan Sadang Serang" },
  { value: "Kel. Sekeloa", label: "Kel. Sekeloa", sublabel: "Kelurahan Sekeloa" },
  { value: "Kel. Lebak Gede", label: "Kel. Lebak Gede", sublabel: "Kelurahan Lebak Gede" },
  { value: "Kel. Lebak Siliwangi", label: "Kel. Lebak Siliwangi", sublabel: "Kelurahan Lebak Siliwangi" },
  { value: "Kel. Cipaganti", label: "Kel. Cipaganti", sublabel: "Kelurahan Cipaganti" },
  { value: "RT 04 / RW 06", label: "RT 04 / RW 06", sublabel: "Wilayah Dago RT 04" },
  { value: "RT 02 / RW 06", label: "RT 02 / RW 06", sublabel: "Wilayah Dago RT 02" },
  { value: "RT 01 / RW 05", label: "RT 01 / RW 05", sublabel: "Wilayah Dago RT 01" },
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
      ? (locations.reduce((acc, curr) => acc + Number(curr.patuh || 0), 0) / totalRW).toFixed(1)
      : "0";
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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all duration-200">
      <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden border border-slate-200/80 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white flex justify-between items-start shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-white/20 text-emerald-100 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-md">
                Kecamatan Coblong
              </span>
              <span className="bg-emerald-400/20 text-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Data Terkini Real-Time
              </span>
            </div>
            <h3 className="font-black text-2xl tracking-tight text-white flex items-center gap-2.5">
              <LineChart className="text-emerald-300" size={24} />
              Indeks Kepatuhan Pemilahan Sampah
            </h3>
            <p className="text-xs text-emerald-100/90 mt-1 font-medium max-w-xl">
              Persentase keaktifan rumah tangga dan tingkat kepatuhan pemilahan sampah terdata pada tiap RW di wilayah Kecamatan Coblong.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 border-b border-slate-100 shrink-0">
          <div className="bg-white p-3 rounded-2xl border border-slate-200/70 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rata-rata Kepatuhan</span>
            <span className="text-lg font-black text-slate-800 mt-0.5 block">{avgPatuh}%</span>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-emerald-200/70 shadow-2xs">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Patuh Tinggi (≥85%)</span>
            <span className="text-lg font-black text-emerald-700 mt-0.5 block">{highPatuhCount} RW</span>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-amber-200/70 shadow-2xs">
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Sedang (60-84%)</span>
            <span className="text-lg font-black text-amber-700 mt-0.5 block">{medPatuhCount} RW</span>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-rose-200/70 shadow-2xs">
            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">Perlu Perhatian (&lt;60%)</span>
            <span className="text-lg font-black text-rose-700 mt-0.5 block">{lowPatuhCount} RW</span>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 bg-white border-b border-slate-100 space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama RW atau Kelurahan..."
                className="w-full bg-slate-50 border border-slate-200 pl-10 pr-8 py-2 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
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
                className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 px-3 py-2 rounded-xl outline-none focus:border-emerald-600 cursor-pointer"
              >
                <option value="SEMUA">Semua Kelurahan</option>
                {uniqueKelurahan.map((kel) => (
                  <option key={kel} value={kel}>{kel}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 px-3 py-2 rounded-xl outline-none focus:border-emerald-600 cursor-pointer"
              >
                <option value="ALL">Semua Kepatuhan</option>
                <option value="HIGH">Tinggi (≥85%)</option>
                <option value="MED">Sedang (60-84%)</option>
                <option value="LOW">Perlu Perhatian (&lt;60%)</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 px-3 py-2 rounded-xl outline-none focus:border-emerald-600 cursor-pointer"
              >
                <option value="HIGHEST">Kepatuhan Tertinggi</option>
                <option value="LOWEST">Kepatuhan Terendah</option>
                <option value="RW_ASC">Urutkan RW</option>
                <option value="KELURAHAN">Urutkan Kelurahan</option>
              </select>
            </div>
          </div>

          {/* Quick Filter Badges */}
          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 overflow-x-auto pb-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider shrink-0">Filter Cepat:</span>
            <button
              onClick={() => { setStatusFilter("ALL"); setKelurahanFilter("SEMUA"); setSearch(""); }}
              className={`px-2.5 py-1 rounded-lg border transition cursor-pointer shrink-0 ${
                statusFilter === "ALL" && kelurahanFilter === "SEMUA" && !search
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700"
              }`}
            >
              Semua ({totalRW})
            </button>
            <button
              onClick={() => setStatusFilter("HIGH")}
              className={`px-2.5 py-1 rounded-lg border transition cursor-pointer shrink-0 ${
                statusFilter === "HIGH"
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100"
              }`}
            >
              Tinggi ({highPatuhCount})
            </button>
            <button
              onClick={() => setStatusFilter("MED")}
              className={`px-2.5 py-1 rounded-lg border transition cursor-pointer shrink-0 ${
                statusFilter === "MED"
                  ? "bg-amber-600 text-white border-amber-600"
                  : "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100"
              }`}
            >
              Sedang ({medPatuhCount})
            </button>
            <button
              onClick={() => setStatusFilter("LOW")}
              className={`px-2.5 py-1 rounded-lg border transition cursor-pointer shrink-0 ${
                statusFilter === "LOW"
                  ? "bg-rose-600 text-white border-rose-600"
                  : "bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100"
              }`}
            >
              Perlu Perhatian ({lowPatuhCount})
            </button>
          </div>
        </div>

        {/* Modal List Body */}
        <div className="p-6 space-y-3 overflow-y-auto flex-1 bg-slate-50/50">
          {filteredLocations.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <Search size={28} />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-800">Data RW Tidak Ditemukan</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
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
                  className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all space-y-3 group"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-sm text-slate-900 group-hover:text-emerald-700 transition">
                          {loc.rw}
                        </h4>
                        <span className="text-[10px] font-extrabold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          {loc.kelurahan}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium mt-1 flex items-center gap-2">
                        <span>{loc.rtCount || 0} RT</span>
                        <span>•</span>
                        <span>{loc.titikCount || 0} Titik Tempat Sampah</span>
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold shadow-2xs ${
                          isHigh
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : isMed
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {isHigh ? (
                          <CheckCircle2 size={13} className="text-emerald-600" />
                        ) : isMed ? (
                          <Sparkles size={13} className="text-amber-600" />
                        ) : (
                          <AlertTriangle size={13} className="text-rose-600" />
                        )}
                        {patuh}% Patuh
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 block mt-1">
                        {isHigh ? "Sangat Patuh" : isMed ? "Cukup Patuh" : "Perlu Perhatian"}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
                      <div
                        className={`h-full rounded-full transition-all duration-700 shadow-2xs ${
                          isHigh
                            ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                            : isMed
                            ? "bg-gradient-to-r from-amber-400 to-amber-500"
                            : "bg-gradient-to-r from-rose-500 to-red-500"
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
        <div className="p-4 border-t border-slate-100 bg-white flex justify-between items-center text-xs text-slate-500 shrink-0">
          <span>Menampilkan <strong className="text-slate-800">{filteredLocations.length}</strong> dari <strong className="text-slate-800">{locations.length}</strong> RW</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl transition cursor-pointer"
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
        binId: issueBinId
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
        // Refresh summary, points, and notifications
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

  // Point calculations
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
    <div className="space-y-gutter pb-12">
      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
        {isLoadingSummary ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-white/90 p-6 rounded-xl border border-outline-variant/30 flex flex-col gap-3 shadow-sm animate-pulse"
            >
              <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
              <div className="h-6 bg-slate-200 rounded w-3/4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            </div>
          ))
        ) : (
          <>
            {/* Card Poin */}
            <div
              onClick={() => setShowPoinModal(true)}
              className="bg-white/95 backdrop-blur-sm p-6 rounded-xl border border-outline-variant/30 flex flex-col items-start gap-3 shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.99] transition-all group"
            >
              <div className="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-lg flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
                <span
                  className="material-symbols-outlined text-[24px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  stars
                </span>
              </div>
              <div>
                <p className="text-label-sm text-on-surface-variant font-bold tracking-wide">
                  Poin Saya
                </p>
                <h3 className="text-[24px] font-extrabold text-on-surface leading-tight mt-1">
                  {poin.toLocaleString("id-ID")} Poin
                </h3>
                <p className="text-[10px] text-primary font-bold mt-2 flex items-center gap-0.5">
                  <TrendingUp size={12} />+
                  {pointsEarnedToday} Poin hari ini
                </p>
              </div>
            </div>

            {/* Card Saldo */}
            <div
              onClick={() => setShowSaldoModal(true)}
              className="bg-white/95 backdrop-blur-sm p-6 rounded-xl border border-outline-variant/30 flex flex-col items-start gap-3 shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.99] transition-all group"
            >
              <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <span
                  className="material-symbols-outlined text-[24px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  payments
                </span>
              </div>
              <div>
                <p className="text-label-sm text-on-surface-variant font-bold tracking-wide">
                  Saldo Rupiah
                </p>
                <h3 className="text-[24px] font-extrabold text-on-surface leading-tight mt-1">
                  Rp {saldo.toLocaleString("id-ID")}
                </h3>
                <p className="text-[10px] text-on-surface-variant font-medium mt-2 flex items-center gap-0.5">
                  <Wallet size={12} />
                  Cairkan Poin ke E-Wallet Anda
                </p>
              </div>
            </div>

            {/* Card Organik */}
            <div
              onClick={() => setShowSetoranModal(true)}
              className="bg-white/95 backdrop-blur-sm p-6 rounded-xl border border-outline-variant/30 flex flex-col items-start gap-3 shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.99] transition-all group"
            >
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                <span
                  className="material-symbols-outlined text-[24px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  eco
                </span>
              </div>
              <div>
                <p className="text-label-sm text-on-surface-variant font-bold tracking-wide">
                  Total Setoran Organik
                </p>
                <h3 className="text-[24px] font-extrabold text-on-surface leading-tight mt-1">
                  {organik} Kg
                </h3>
                <p className="text-[10px] text-emerald-700 font-bold mt-2">
                  Komposisi pemilahan aktif
                </p>
              </div>
            </div>

            {/* Card Anorganik */}
            <div
              onClick={() => setShowSetoranModal(true)}
              className="bg-white/95 backdrop-blur-sm p-6 rounded-xl border border-outline-variant/30 flex flex-col items-start gap-3 shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.99] transition-all group"
            >
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <span
                  className="material-symbols-outlined text-[24px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  local_drink
                </span>
              </div>
              <div>
                <p className="text-label-sm text-on-surface-variant font-bold tracking-wide">
                  Total Setoran Anorganik
                </p>
                <h3 className="text-[24px] font-extrabold text-on-surface leading-tight mt-1">
                  {anorganik} Kg
                </h3>
                <p className="text-[10px] text-blue-700 font-bold mt-2">
                  Penyumbang daur ulang aktif
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter">
        {/* Left Column (CTA, Profile, Notifications) */}
        <div className="xl:col-span-8 space-y-gutter">
          {/* CTA Banner */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center sm:text-left z-10">
              <h4 className="text-[22px] font-bold tracking-tight">
                Setorkan Sampah, Jaga Lingkungan!
              </h4>
              <p className="text-xs text-green-100 max-w-md leading-relaxed">
                Gunakan kamera ponsel Anda untuk memindai sampah menggunakan kecerdasan buatan (AI)
                dan setorkan ke tempat sampah terdekat untuk hadiah instan.
              </p>
              <div className="inline-flex items-center gap-1.5 bg-white/20 border border-white/30 rounded-full px-3 py-1 mt-2 text-[10px] font-bold uppercase tracking-wider">
                <Zap size={14} />
                Kuota AI Hari Ini: {quotaRemaining} / 50 Request
              </div>
            </div>
            <button
              onClick={() => navigate("/setor")}
              className="bg-white hover:bg-slate-50 text-emerald-800 font-extrabold px-6 py-3 rounded-xl text-xs uppercase tracking-wider shadow-md transition-all active:scale-95 whitespace-nowrap cursor-pointer z-10"
            >
              Mulai Setor Sekarang
            </button>
            <div className="absolute right-[-20px] bottom-[-40px] opacity-10 text-[180px] pointer-events-none select-none">
              eco
            </div>
          </div>

          {/* Profile Card */}
          <div className="bg-white/95 backdrop-blur-sm border border-outline-variant/40 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row gap-6 items-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center font-bold text-xl overflow-hidden border border-outline-variant/30 flex-shrink-0 bg-primary/10 text-primary">
              <img
                src={getProfilePhotoUrl(user?.fotoProfil, user?.name)}
                alt="Avatar"
                className="w-full h-full object-cover"
                onError={(e) => handleAvatarError(e, user?.name)}
              />
            </div>
            <div className="flex-1 text-center sm:text-left space-y-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h4 className="font-extrabold text-[18px] text-on-surface">{user?.name}</h4>
                <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase tracking-wider w-fit mx-auto sm:mx-0">
                  WARGA PSC
                </span>
              </div>
              <p className="text-xs text-on-surface-variant flex items-center justify-center sm:justify-start gap-1 font-medium">
                <Home className="text-on-surface-variant" size={16} />
                {user?.address || "Alamat Belum Dikonfigurasi"}
              </p>
              <p className="text-xs text-on-surface-variant flex items-center justify-center sm:justify-start gap-1 font-medium">
                <MapPin className="text-on-surface-variant" size={16} />
                Wilayah Tugas: <strong className="text-primary">{user?.wilayah || "-"}</strong>
              </p>
            </div>
            <button
              onClick={() => navigate("/pengaturan")}
              className="px-4 py-2 border border-outline-variant/50 text-on-surface-variant hover:text-on-surface hover:bg-slate-50 transition-colors text-[11px] font-bold rounded-lg uppercase tracking-wider flex items-center gap-1 cursor-pointer"
            >
              <Pencil size={16} />
              Edit Profil
            </button>
          </div>

          {/* Notifications Card */}
          <div className="bg-white/95 backdrop-blur-sm border border-outline-variant/40 rounded-xl p-6 shadow-sm flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
              <h5 className="font-bold text-[15px] text-on-surface flex items-center gap-1.5">
                <Bell className="text-primary" />
                Notifikasi Terbaru
              </h5>
              <button
                onClick={fetchNotifications}
                className="text-primary hover:underline text-[11px] font-bold uppercase tracking-wider flex items-center gap-0.5"
              >
                <RefreshCw size={14} />
                Refresh
              </button>
            </div>

            {isLoadingNotifications ? (
              <div className="animate-pulse space-y-3">
                <div className="h-10 bg-slate-100 rounded"></div>
                <div className="h-10 bg-slate-100 rounded"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-6 text-on-surface-variant/75 text-xs">
                <Megaphone className="text-slate-300 block mb-1" size={32} />
                Belum ada notifikasi baru untuk Anda.
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.slice(0, 4).map((notif) => (
                  <div
                    key={notif.id}
                    className="flex gap-3 p-3 rounded-lg bg-surface-container-low border border-outline-variant/20 hover:bg-surface-container transition-colors"
                  >
                    <div
                      className={`w-8 h-8 rounded-full ${notif.iconBg} ${notif.iconColor} flex items-center justify-center flex-shrink-0`}
                    >
                      <IconRenderer name={notif.icon} size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold text-on-surface truncate">
                        {notif.title}
                      </p>
                      <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">
                        {notif.desc}
                      </p>
                      <span className="text-[9px] text-slate-400 font-bold block mt-1">
                        {notif.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Bins Capacity, Recent Activity) */}
        <div className="xl:col-span-4 space-y-gutter">
          {/* Bin Capacity */}
          <div className="bg-white/95 backdrop-blur-sm p-6 rounded-xl border border-outline-variant/30 shadow-sm flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
              <h5 className="font-bold text-[15px] text-on-surface flex items-center gap-1.5">
                <Trash2 className="text-primary" />
                tempat sampah RT/RW Saya
              </h5>
              <div className="flex gap-2 items-center">
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  {user?.wilayah || "Umum"}
                </span>
              </div>
            </div>

            {isLoadingBins ? (
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-slate-100 rounded"></div>
                <div className="h-6 bg-slate-100 rounded"></div>
              </div>
            ) : myBins.length === 0 ? (
              <div className="text-center py-6 text-on-surface-variant/75 text-xs">
                <AlertTriangle className="text-slate-300 block mb-1" size={32} />
                Tidak ada tempat sampah terdaftar di RT/RW Anda.
              </div>
            ) : (
              <div className="space-y-4">
                {myBins.map((bin) => (
                  <div
                    key={bin.id}
                    className="space-y-1.5 p-3 rounded-lg border border-outline-variant/20 bg-surface-container-lowest"
                  >
                    <div className="flex justify-between text-[11px] font-bold text-on-surface">
                      <span className="flex items-center gap-1">
                        <span
                          className={`material-symbols-outlined text-[16px] ${bin.category === "ORGANIC" ? "text-primary" : "text-blue-500"}`}
                        >
                          {bin.category === "ORGANIC" ? "eco" : "recycling"}
                        </span>
                        Tempat Sampah {bin.category === "ORGANIC" ? "Organik" : "Anorganik"} ({bin.qrCode})
                      </span>
                      {bin.realStatus === "ACTIVE_BOUND" && (
                        <span
                          className={bin.kapasitas > 80 ? "text-red-600" : "text-on-surface-variant"}
                        >
                          {bin.kapasitas}% Terisi
                        </span>
                      )}
                    </div>
                    {bin.realStatus === "PENDING_APPROVAL" ? (
                      <div className="mt-2 p-2 bg-yellow-50 rounded-lg border border-yellow-200 text-center">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-yellow-700 uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-ping"></span>
                          Menunggu Persetujuan
                        </span>
                      </div>
                    ) : bin.realStatus === "BROKEN" ? (
                      <div className="mt-2 p-2 bg-red-50 rounded-lg border border-red-200 text-center">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-red-700 uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                          Tempat Sampah Rusak / QR Sobek
                        </span>
                      </div>
                    ) : bin.realStatus === "TIDAK_AKTIF" ? (
                      <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-slate-200 text-center">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                          TIDAK AKTIF (&gt;30 Hari)
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${bin.kapasitas >= 80 ? "bg-red-500" : bin.kapasitas >= 50 ? "bg-amber-500" : "bg-primary"}`}
                            style={{ width: `${bin.kapasitas}%` }}
                          ></div>
                        </div>
                        <p className="text-[9px] text-on-surface-variant/80 text-right font-semibold">
                          {bin.currentVolumeLiter} L / {bin.maxCapacityLiter} L Kapasitas
                        </p>

                        <div className="mt-3 flex gap-2 justify-end">
                          <button
                            onClick={() => {
                              setEditCapBinId(bin.id);
                              setShowEditCapModal(true);
                            }}
                            className="px-2.5 py-1 text-[10px] bg-white border border-outline-variant text-on-surface font-bold rounded hover:bg-slate-50 transition-all cursor-pointer uppercase tracking-wider flex items-center gap-0.5"
                          >
                            <Settings size={12} />
                            Ubah Kapasitas
                          </button>
                          <button
                            onClick={() => handleOpenIssueModal(bin.id, "EMPTY_REQUEST")}
                            className="px-2.5 py-1 text-[10px] bg-primary text-white font-bold rounded hover:bg-primary/95 transition-all cursor-pointer uppercase tracking-wider flex items-center gap-0.5"
                          >
                            <Truck size={12} />
                            Panggil Petugas
                          </button>
                          <button
                            onClick={() => handleOpenIssueModal(bin.id, "BROKEN_REPORT")}
                            className="px-2.5 py-1 text-[10px] border border-red-200 text-red-600 font-bold rounded hover:bg-red-50 transition-all cursor-pointer uppercase tracking-wider flex items-center gap-0.5"
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
          <div className="bg-white/95 backdrop-blur-sm p-6 rounded-xl border border-outline-variant/30 shadow-sm flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
              <h5 className="font-bold text-[15px] text-on-surface flex items-center gap-1.5">
                <History className="text-primary" />
                Setoran Terakhir
              </h5>
              <button
                onClick={() => setShowSetoranModal(true)}
                className="text-primary hover:underline text-[11px] font-bold uppercase tracking-wider"
              >
                Lihat Semua
              </button>
            </div>

            {isLoadingLogs ? (
              <div className="animate-pulse space-y-3">
                <div className="h-10 bg-slate-100 rounded"></div>
                <div className="h-10 bg-slate-100 rounded"></div>
              </div>
            ) : wasteLogs.length === 0 ? (
              <div className="text-center py-6 text-on-surface-variant/75 text-xs">
                <Archive className="text-slate-300 block mb-1" size={32} />
                Belum ada riwayat setoran sampah.
              </div>
            ) : (
              <div className="space-y-3">
                {wasteLogs.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-3 rounded-lg border border-outline-variant/30 bg-surface-container-low hover:bg-surface-container transition-all"
                  >
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold">
                        {new Date(item.waktu).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-[12px] font-bold text-on-surface mt-0.5">
                        {item.jenis === "ORGANIC" ? "🌱 Organik" : "♻️ Anorganik"} <span className="font-extrabold">{item.berat}</span> <span className="font-normal text-[10px]">Kg</span>
                      </p>
                      <p className="text-[10px] text-on-surface-variant mt-0.5">
                        {item.lokasi} • {item.volume}
                      </p>
                    </div>
                    <span className="text-[12px] font-extrabold text-primary">
                      +{item.poin} Pts
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Leaderboard Full Width Section */}
      <div className="mt-8">
        <LeaderboardWidget />
      </div>

      {/* ================= MODALS ================= */}

      {/* 5. ISSUE REPORT MODAL */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-outline-variant animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-slate-50">
              <h3 className="font-extrabold text-[18px] text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">
                  {issueType === "EMPTY_REQUEST" ? "delete" : "report"}
                </span>
                {issueType === "EMPTY_REQUEST" ? "Lapor Tempat Sampah Penuh" : "Lapor Tempat Sampah Rusak"}
              </h3>
              <button
                onClick={() => setShowIssueModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-on-surface-variant transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmitIssue} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase">
                    Catatan (Opsional)
                  </label>
                  <input
                    type="text"
                    className="w-full border border-outline-variant rounded-lg p-2.5 text-xs bg-white focus:border-primary focus:outline-none"
                    value={issueNotes}
                    onChange={(e) => setIssueNotes(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase">
                    Foto Bukti {issueType === "EMPTY_REQUEST" ? "(Wajib)" : "(Opsional)"}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleIssuePhotoChange}
                    className="text-xs"
                    required={issueType === "EMPTY_REQUEST"}
                  />
                  {issuePhotoPreview && (
                    <img src={issuePhotoPreview} alt="Preview" className="w-full max-h-48 object-contain rounded-lg border mt-2" />
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingIssue || (issueType === "EMPTY_REQUEST" && !issuePhoto)}
                    className="w-full py-3 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 flex justify-center items-center gap-2 shadow-md shadow-primary/20"
                  >
                    {isSubmittingIssue ? (
                      <RefreshCcw className="animate-spin" size={16} />
                    ) : (
                      <Send size={16} />
                    )}
                    Kirim Laporan
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 4. EDIT CAPACITY MODAL */}
      {showEditCapModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-outline-variant animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-slate-50">
              <h3 className="font-extrabold text-[18px] text-on-surface flex items-center gap-2">
                <Settings className="text-primary" />
                Ubah Kapasitas Tempat Sampah
              </h3>
              <button
                onClick={() => setShowEditCapModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-on-surface-variant transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleUpdateCapacity} className="space-y-4">

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase">
                    Opsi Kapasitas
                  </label>
                  <select
                    className="w-full border border-outline-variant rounded-lg p-2.5 text-xs bg-white focus:border-primary focus:outline-none"
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
                    <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase">
                        Kapasitas Tempat Sampah Baru (Liter)
                      </label>
                      <input
                        type="number"
                        placeholder="Contoh: 50"
                        className="w-full border border-outline-variant rounded-lg p-2.5 text-xs bg-white focus:border-primary focus:outline-none"
                        value={editCapValue}
                        onChange={(e) => setEditCapValue(e.target.value)}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase">
                        Upload Foto Bukti Tempat Sampah
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setEditCapPhoto(e.target.files?.[0] || null)}
                        className="w-full border border-outline-variant rounded-lg p-2 text-xs bg-white focus:border-primary focus:outline-none"
                        required
                      />
                    </div>
                  </>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isUpdatingCap}
                    className="w-full py-3 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 flex justify-center items-center gap-2 shadow-md shadow-primary/20"
                  >
                    {isUpdatingCap ? (
                      <RefreshCcw className="animate-spin" size={16} />
                    ) : (
                      <Save size={16} />
                    )}
                    {isUpdatingCap ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 1. POIN MODAL */}
      {showPoinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-outline-variant animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-slate-50">
              <h3 className="font-extrabold text-[18px] text-on-surface flex items-center gap-2">
                <Star className="text-yellow-500" />
                Riwayat & Detail Poin
              </h3>
              <button
                onClick={() => setShowPoinModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-on-surface-variant transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-low text-center">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">
                    Total Poin Diperoleh
                  </p>
                  <p className="text-xl font-bold text-primary mt-1">+{totalPointsEarned} Pts</p>
                </div>
                <div className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-low text-center">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">
                    Target Rank Selanjutnya
                  </p>
                  <p className="text-xl font-bold text-amber-700 mt-1">Silver Rank</p>
                </div>
              </div>

              {/* Progress Bar target */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-on-surface">
                  <span>Progres Tingkat</span>
                  <span>{poin} / 1000 Poin</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (poin / 1000) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Point Log List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Breakdown Aktivitas Poin
                </h4>
                {isLoadingPoints ? (
                  <p className="text-xs text-center py-4 text-on-surface-variant">Memuat data...</p>
                ) : pointHistory.length === 0 ? (
                  <p className="text-xs text-center py-4 text-on-surface-variant/80">
                    Belum ada transaksi poin.
                  </p>
                ) : (
                  <div className="divide-y divide-outline-variant/20 max-h-[250px] overflow-y-auto">
                    {pointHistory.map((historyItem) => (
                      <div
                        key={historyItem.id}
                        className="py-3 flex justify-between items-center text-xs"
                      >
                        <div>
                          <p className="font-bold text-on-surface">{historyItem.description}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(historyItem.createdAt).toLocaleString("id-ID")}
                          </p>
                        </div>
                        <span
                          className={`font-extrabold text-sm ${historyItem.points > 0 ? "text-primary" : "text-red-500"}`}
                        >
                          {historyItem.points > 0 ? `+${historyItem.points}` : historyItem.points}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-outline-variant flex justify-end">
              <button
                onClick={() => setShowPoinModal(false)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-xs font-bold text-on-surface-variant transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. SALDO MODAL */}
      {showSaldoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-outline-variant animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-slate-50">
              <h3 className="font-extrabold text-[18px] text-on-surface flex items-center gap-2">
                <Banknote className="text-green-600" />
                Cairkan Saldo E-Wallet
              </h3>
              <button
                onClick={() => setShowSaldoModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-on-surface-variant transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Balance Summary */}
              <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
                <p className="text-[11px] text-green-700 font-extrabold uppercase tracking-wider">
                  Sisa Saldo Dapat Dicairkan
                </p>
                <p className="text-3xl font-extrabold text-green-800 mt-1">
                  Rp {saldo.toLocaleString("id-ID")}
                </p>
                <p className="text-[10px] text-green-600/90 mt-1">
                  Dihitung otomatis: Poin ({poin}) x Rp 100
                </p>
              </div>

              {/* Conversion Form */}
              <form onSubmit={handleTukarPoin} className="space-y-4">
                <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Form Penukaran Saldo
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase">
                      Poin Ditukar
                    </label>
                    <select
                      className="w-full border border-outline-variant rounded-lg p-2.5 text-xs bg-white focus:border-primary focus:outline-none"
                      value={tukarPoinAmount}
                      onChange={(e) => setTukarPoinAmount(e.target.value)}
                    >
                      <option value="500">500 Poin (Rp 50.000)</option>
                      <option value="1000">1000 Poin (Rp 100.000)</option>
                      <option value="2000">2000 Poin (Rp 200.000)</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase">
                      Metode E-Wallet
                    </label>
                    <select
                      className="w-full border border-outline-variant rounded-lg p-2.5 text-xs bg-white focus:border-primary focus:outline-none"
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
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase">
                    Nomor HP Terdaftar
                  </label>
                  <input
                    type="tel"
                    placeholder="contoh: 08123456789"
                    className="w-full border border-outline-variant rounded-lg p-2.5 text-xs bg-white focus:border-primary focus:outline-none"
                    value={ewalletPhone}
                    onChange={(e) => setEwalletPhone(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isConverting || poin < parseInt(tukarPoinAmount)}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-green-600/10"
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

              {/* Conversion History */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Riwayat Pencairan Terakhir
                </h4>
                <div className="divide-y divide-outline-variant/20 max-h-[180px] overflow-y-auto">
                  {pointHistory.filter((p) => p.points < 0).length === 0 ? (
                    <p className="text-xs text-slate-400 py-3 text-center">
                      Belum ada riwayat pencairan saldo.
                    </p>
                  ) : (
                    pointHistory
                      .filter((p) => p.points < 0)
                      .map((historyItem) => (
                        <div
                          key={historyItem.id}
                          className="py-2.5 flex justify-between items-center text-xs"
                        >
                          <div>
                            <p className="font-bold text-on-surface">
                              {historyItem.description.replace("Konversi ", "")}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {new Date(historyItem.createdAt).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                          <span className="font-bold text-red-500">
                            -Rp {Math.abs(historyItem.points * 100).toLocaleString("id-ID")}
                          </span>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-outline-variant flex justify-end">
              <button
                onClick={() => setShowSaldoModal(false)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-xs font-bold text-on-surface-variant transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. SETORAN MODAL */}
      {showSetoranModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden border border-outline-variant animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-slate-50">
              <h3 className="font-extrabold text-[18px] text-on-surface flex items-center gap-2">
                <Recycle className="text-emerald-600" />
                Semua Riwayat Setoran Sampah
              </h3>
              <button
                onClick={() => setShowSetoranModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-on-surface-variant transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Category Filter */}
              <div className="flex gap-2">
                {["ALL", "ORGANIC", "NON_ORGANIC"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterWasteType(type)}
                    className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer border ${filterWasteType === type
                        ? "bg-primary text-white border-primary"
                        : "bg-white border-outline-variant hover:bg-slate-50 text-on-surface-variant"
                      }`}
                  >
                    {type === "ALL" ? "Semua" : type === "ORGANIC" ? "Organik" : "Anorganik"}
                  </button>
                ))}
              </div>

              {/* Transactions table/list */}
              {isLoadingLogs ? (
                <p className="text-xs text-center py-6">Memuat...</p>
              ) : filteredLogs.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">Tidak ada data setoran.</p>
              ) : (
                <div className="border border-outline-variant/30 rounded-xl overflow-hidden shadow-inner bg-slate-50">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-on-surface-variant border-b border-outline-variant/40">
                          <th className="p-3 font-bold">Tanggal</th>
                          <th className="p-3 font-bold">Kategori</th>
                          <th className="p-3 font-bold">Berat (Kg)</th>
                          <th className="p-3 font-bold">Estimasi Vol</th>
                          <th className="p-3 font-bold">Poin</th>
                          <th className="p-3 font-bold">Titik Tempat Sampah</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20 bg-white">
                        {filteredLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50">
                            <td className="p-3 font-medium">
                              {new Date(log.waktu).toLocaleString("id-ID", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${log.jenis === "ORGANIC"
                                    ? "bg-green-50 text-green-700 border border-green-200"
                                    : "bg-blue-50 text-blue-700 border border-blue-200"
                                  }`}
                              >
                                {log.jenis === "ORGANIC" ? "Organik" : "Anorganik"}
                              </span>
                            </td>
                            <td className="p-3 font-bold">{log.berat}</td>
                            <td className="p-3 font-medium text-slate-500">{log.volume}</td>
                            <td className="p-3 font-extrabold text-primary">+{log.poin} Pts</td>
                            <td className="p-3 font-mono font-bold text-slate-600">
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

            <div className="p-6 bg-slate-50 border-t border-outline-variant flex justify-end">
              <button
                onClick={() => setShowSetoranModal(false)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-xs font-bold text-on-surface-variant transition-colors cursor-pointer"
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
interface KpiCardProps {
  iconName: string;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string | number;
  trend?: string | number;
  trendLabel?: string;
  trendUp?: boolean;
  linkTo?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({
  iconName,
  iconBg,
  iconColor,
  label,
  value,
  trend,
  trendLabel,
  trendUp,
  linkTo,
}) => {
  const content = (
    <div
      className={`bg-white/95 backdrop-blur-sm shadow-sm rounded-xl p-4 border border-outline-variant/30 flex flex-col gap-3 h-full ${linkTo ? "cursor-pointer hover:bg-surface-container-low transition-all duration-150" : ""}`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 ${iconBg} ${iconColor} rounded-lg flex items-center justify-center`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            {iconName}
          </span>
        </div>
        <div className="flex-1">
          <p className="text-[12px] text-on-surface-variant font-bold">{label}</p>
          <h4 className="text-[20px] font-extrabold text-on-surface leading-tight">
            {value !== undefined ? value : "-"}
          </h4>
        </div>
      </div>
      {(trend || trendLabel) && (
        <div className="flex items-center gap-1.5 mt-1 border-t border-outline-variant/30 pt-2">
          {trendUp !== undefined && (
            <span
              className={`material-symbols-outlined text-[14px] ${trendUp ? "text-green-600" : "text-red-600"}`}
            >
              {trendUp ? "trending_up" : "trending_down"}
            </span>
          )}
          <span
            className={`text-[11px] font-bold ${trendUp === true ? "text-green-600" : trendUp === false ? "text-red-600" : "text-on-surface-variant"}`}
          >
            {trend} {trendLabel}
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

// ========== Main Dashboard ==========
const Dashboard: React.FC = () => {
  const { user, updateWilayah } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [recentBins, setRecentBins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // superUser monitoring and details
  const [showCompositionDetail, setShowCompositionDetail] = useState(false);
  const [timeFilter, setTimeFilter] = useState("semua"); // harian, mingguan, bulanan, tahunan, semua

  const handleRegionChange = (newWilayah: string) => {
    if (updateWilayah) {
      updateWilayah(newWilayah);
      showToast.success(`Wilayah aktif diubah ke ${newWilayah}`);
    }
  };


  // Dynamic features states
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
    // Skip API load for roles with custom dashboards
    if (
      user?.peran === "WARGA" ||
      user?.peran === "MAHASISWA_KKN" ||
      user?.peran === "PETUGAS_RESIDU" ||
      user?.peran === "RW" ||
      user?.peran === "RT" ||
      user?.peran === "DPL" ||
      user?.peran === "DOSEN_PEMBIMBING"
    ) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        setError("");
        const response = await api.get("/dashboard/kpi", {
          params: { wilayah: user?.wilayah, period: timeFilter },
        });
        const kpi = response.data?.data ?? response.data;
        if (!kpi) {
          throw new Error("KPI kosong");
        }

        // Menghitung persentase
        const organikKg = Number(kpi.komposisiSampah?.organikKg ?? 0);
        const anorganikKg = Number(kpi.komposisiSampah?.anorganikKg ?? 0);
        const residuKg = Number(kpi.komposisiSampah?.residuKg ?? 0);
        const totalBerat = organikKg + anorganikKg + residuKg;
        const pctOrganik = totalBerat > 0 ? Math.round((organikKg / totalBerat) * 100) : 0;
        const pctAnorganik = totalBerat > 0 ? Math.round((anorganikKg / totalBerat) * 100) : 0;
        const pctResidu = totalBerat > 0 ? 100 - pctOrganik - pctAnorganik : 0;

        // Memetakan data riil dari backend ke UI
        setStats({
          totalPengguna: {
            value: kpi.totalUsers ?? 0,
            trend: "+0",
            trendLabel: timeFilter === "semua" ? "Total keseluruhan" : `Periode ${timeFilter}`,
            trendUp: true,
          },
          tempatSampahAktif: {
            value: kpi.tempatSampahAktif ?? 0,
            trend: (kpi.alertTongPenuh ?? 0) > 0 ? `${kpi.alertTongPenuh} Penuh` : "Aman",
            trendLabel: "",
            trendUp: (kpi.alertTongPenuh ?? 0) === 0,
          },
          lokasiTerdaftar: {
            value: kpi.lokasiTerdaftar ?? 0,
            trend: "+0",
            trendLabel: timeFilter === "semua" ? "Total keseluruhan" : `Periode ${timeFilter}`,
            trendUp: true,
          },
          setoranHariIni: {
            value: `${Number(kpi.setoranHariIniKg ?? 0).toFixed(1)} Kg`,
            trend: timeFilter === "semua" ? "Total Keseluruhan" : `Periode ${timeFilter}`,
            trendLabel: "",
            trendUp: true,
          },
          totalPoin: {
            value:
              (kpi.totalPoin ?? 0) > 1000
                ? `${((kpi.totalPoin ?? 0) / 1000).toFixed(1)}K`
                : Number(kpi.totalPoin ?? 0).toLocaleString(),
            trend: "+0",
            trendLabel: timeFilter === "semua" ? "Total keseluruhan" : `Periode ${timeFilter}`,
            trendUp: true,
          },
          jadwalMingguIni: { 
            value: kpi.jadwalSelesai ?? 0, 
            trend: `${kpi.jadwalTotal ?? 0}`, 
            trendLabel: timeFilter === "semua" ? "Total keseluruhan" : `Periode ${timeFilter}`, 
            trendUp: true 
          },
          komposisiSampah: {
            organik: { berat: `${organikKg.toFixed(1)} Kg`, persentase: `${pctOrganik}%` },
            anorganik: { berat: `${anorganikKg.toFixed(1)} Kg`, persentase: `${pctAnorganik}%` },
            residu: { berat: `${residuKg.toFixed(1)} Kg`, persentase: `${pctResidu}%` },
            pctOrganik,
            pctAnorganik,
            pctResidu,
            organikKg,
            anorganikKg,
            residuKg,
          },
        });


        // Secondary data: jangan gagalkan seluruh dashboard jika salah satu endpoint error
        const [binsSettled, trendSettled, locSettled, analyticsSettled] =
          await Promise.allSettled([
            api.get("/bins"),
            api.get("/dashboard/trend", { params: { weeks, wilayah: user?.wilayah } }),
            api.get("/bins/locations"),
            api.get("/dashboard/analytics"),
          ]);

        const hasWilayah =
          user?.wilayah &&
          user?.wilayah !== "Kecamatan Coblong" &&
          user?.wilayah !== "Sistem Pusat" &&
          user?.peran !== "MAHASISWA_KKN";

        if (binsSettled.status === "fulfilled") {
          let binsData = binsSettled.value.data?.data ?? binsSettled.value.data ?? [];
          if (hasWilayah) {
            binsData = binsData.filter((b: any) => {
              const binRtRwName = typeof b.rtRw === "string" ? b.rtRw : b.rtRw?.name || "";
              return binRtRwName === user?.wilayah;
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

        if (analyticsSettled.status === "fulfilled") {
          // Do nothing, analytics is no longer used here
        }
      } catch (err) {
        console.error("Dashboard KPI error", err);
        setError("Gagal memuat data dashboard dari server.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user, weeks, timeFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <span
            className="material-symbols-outlined text-primary text-[48px] animate-spin"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            autorenew
          </span>
          <p className="text-on-surface-variant font-medium">Memuat data dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-200 flex flex-col items-center gap-2">
          <AlertCircle size={32} />
          <p className="font-medium">{error}</p>
        </div>
      </div>
    );
  }

  // Render WARGA Dashboard
  if (user?.peran === "WARGA") {
    return <WargaDashboard />;
  }

  // Render RW/RT Dashboard
  if (user?.peran === "RW" || user?.peran === "RT") {
    return <RwDashboard />;
  }

  // Render KKN Dashboard
  if (user?.peran === "MAHASISWA_KKN") {
    return <KknDashboard />;
  }

  // Render Petugas Residu Dashboard
  if (user?.peran === "PETUGAS_RESIDU") {
    return <ResiduDashboard />;
  }

  // Render DPL Dashboard
  if (user?.peran === "DPL" || user?.peran === "DOSEN_PEMBIMBING") {
    return <DplDashboardPage />;
  }

  // Scaling factors for Trend SVG
  const maxWeightTrend = Math.max(
    ...trendData.map((d) => Math.max(d.organic || 0, d.inorganic || 0, d.residu || 0, d.weight || 0)),
    10
  );
  const trendPoints = trendData.map((d, i) => {
    // Leave 60px padding on the left for Y-axis labels
    const x = trendData.length > 1 ? 60 + (i / (trendData.length - 1)) * 620 : 350;
    // Y-axis spans from Y=40 (top, maxWeight) to Y=280 (bottom, zero) -> height = 240px
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




  return (
    <div className="space-y-gutter pb-12 text-on-surface">
      {/* === Interactive Filter & Action Bar (Clean & Modern) === */}
      <div className="relative z-30 bg-white/90 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
        {/* Left & Center Controls: Wilayah Dropdown + Periode Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Dropdown Wilayah / Kecamatan */}
          <CustomSelect
            value={user?.wilayah || "Kecamatan Coblong"}
            onChange={(val) => handleRegionChange(val)}
            options={WILAYAH_OPTIONS}
            icon={<MapPin size={16} className="text-emerald-600 flex-shrink-0" />}
            label="Wilayah:"
            variant="emerald"
          />

          {/* Filter Periode Waktu */}
          <CustomSelect
            value={timeFilter}
            onChange={(val) => setTimeFilter(val)}
            options={PERIODE_OPTIONS}
            icon={<Calendar size={16} className="text-slate-500 flex-shrink-0" />}
            label="Periode:"
            variant="slate"
          />
        </div>

        {/* Right Control: Indeks Kepatuhan Pemilahan Sampah Button */}
        <div className="flex items-center justify-end">
          <button
            onClick={() => setShowComplianceModal(true)}
            className="w-full md:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer border border-emerald-500/30"
          >
            <LineChart size={16} />
            <span>Indeks Kepatuhan Pemilahan Sampah</span>
          </button>
        </div>
      </div>

      {/* === KPI Section (6 Cards) === */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-gutter">
        <KpiCard
          iconName="group"
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          label="Total Pengguna"
          value={stats?.totalPengguna?.value}
          trend={stats?.totalPengguna?.trend}
          trendLabel={stats?.totalPengguna?.trendLabel}
          trendUp={stats?.totalPengguna?.trendUp}
          linkTo="/master-pengguna"
        />
        <KpiCard
          iconName="delete"
          iconBg="bg-green-100"
          iconColor="text-green-600"
          label="Tempat Sampah Aktif"
          value={stats?.tempatSampahAktif?.value}
          trend={stats?.tempatSampahAktif?.trend}
          trendLabel={stats?.tempatSampahAktif?.trendLabel}
          trendUp={stats?.tempatSampahAktif?.trendUp}
          linkTo="/manajemen-tempat-sampah"
        />
        <KpiCard
          iconName="location_on"
          iconBg="bg-indigo-100"
          iconColor="text-indigo-600"
          label="Lokasi Terdaftar"
          value={stats?.lokasiTerdaftar?.value}
          trend={stats?.lokasiTerdaftar?.trend}
          trendLabel={stats?.lokasiTerdaftar?.trendLabel}
          trendUp={stats?.lokasiTerdaftar?.trendUp}
          linkTo="/manajemen-lokasi"
        />
        <KpiCard
          iconName="shopping_bag"
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
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
        />
        <KpiCard
          iconName="stars"
          iconBg="bg-yellow-100"
          iconColor="text-yellow-600"
          label="Total Poin"
          value={stats?.totalPoin?.value}
          trend={stats?.totalPoin?.trend}
          trendLabel={stats?.totalPoin?.trendLabel}
          trendUp={stats?.totalPoin?.trendUp}
          linkTo="/poin-warga"
        />
        <KpiCard
          iconName="event_available"
          iconBg="bg-teal-100"
          iconColor="text-teal-600"
          label={
            timeFilter === "harian" ? "Jadwal Hari Ini" :
            timeFilter === "mingguan" ? "Jadwal Minggu Ini" :
            timeFilter === "bulanan" ? "Jadwal Bulan Ini" :
            timeFilter === "tahunan" ? "Jadwal Tahun Ini" :
            "Total Jadwal"
          }
          value={stats?.jadwalMingguIni?.value}
          trend={stats?.jadwalMingguIni?.trend}
          trendLabel={stats?.jadwalMingguIni?.trendLabel}
          trendUp={stats?.jadwalMingguIni?.trendUp}
          linkTo="/jadwal-kegiatan"
        />
      </div>

      {/* === Charts & Interactive Map Grid === */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Trend Setoran Chart */}
        <div className="lg:col-span-6 bg-white/90 backdrop-blur-sm shadow-sm rounded-2xl p-6 border border-outline-variant/30 relative overflow-hidden card-polish flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <div className="space-y-1">
              <h4 className="font-bold text-[18px] text-on-surface">
                Trend Setoran Sampah (Real-time)
              </h4>
              <div className="flex gap-3 text-[11px] font-bold">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></span> Organik
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#eab308]"></span> Anorganik
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></span> Residu
                </span>
              </div>
            </div>
            <select
              value={weeks}
              onChange={(e) => setWeeks(parseInt(e.target.value))}
              className="bg-surface-container px-3 py-1.5 rounded-lg text-[12px] border border-outline-variant/40 text-on-surface focus:outline-none cursor-pointer font-bold shadow-2xs hover:border-primary/50 transition-all"
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
                  <linearGradient id="orgGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
                  </linearGradient>
                  <linearGradient id="inorgGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#eab308" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#eab308" stopOpacity="0.02" />
                  </linearGradient>
                  <linearGradient id="residuGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                {/* Y-Axis Label Title */}
                <text x="10" y="20" fill="#475569" fontSize="10" fontWeight="bold">
                  Berat (kg)
                </text>

                {[0, 25, 50, 75, 100].map((pct) => {
                  const y = 280 - (pct / 100) * 240;
                  return (
                    <g key={pct}>
                      <line x1="60" y1={y} x2="680" y2={y} stroke="#f0f2f5" strokeWidth="1" strokeDasharray={pct === 0 ? "none" : "3,3"} />
                      <text
                        x="52"
                        y={y + 3}
                        textAnchor="end"
                        fill="#64748b"
                        fontSize="9"
                        fontWeight="bold"
                      >
                        {Math.round((maxWeightTrend * pct) / 100)}
                      </text>
                    </g>
                  );
                })}

                <line x1="60" y1="40" x2="60" y2="280" stroke="#cbd5e1" strokeWidth="1.5" />
                <path d={trendOrganicAreaPath} fill="url(#orgGrad)" />
                <path d={trendInorganicAreaPath} fill="url(#inorgGrad)" />
                <path d={trendResiduAreaPath} fill="url(#residuGrad)" />

                <path
                  d={trendOrganicPath}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={trendInorganicPath}
                  fill="none"
                  stroke="#eab308"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={trendResiduPath}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {trendPoints.map((p, i) => (
                  <g key={i}>
                    {/* Dots & Labels */}
                    <circle cx={p.x} cy={p.yOrganic} r="4" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
                    <circle cx={p.x} cy={p.yInorganic} r="4" fill="#eab308" stroke="#ffffff" strokeWidth="2" />
                    <circle cx={p.x} cy={p.yResidu} r="4" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />

                    <text
                      x={p.x}
                      y="305"
                      textAnchor="middle"
                      fill="#64748b"
                      fontSize="10"
                      fontWeight="bold"
                    >
                      {p.label}
                    </text>
                  </g>
                ))}
              </svg>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 italic">
                Belum ada data trend untuk periode ini
              </div>
            )}
          </div>
        </div>

        {/* Komposisi Sampah Card (Clean & Modern Design System) */}
        <div className="lg:col-span-6 bg-white/90 backdrop-blur-sm shadow-sm rounded-2xl p-6 border border-outline-variant/30 flex flex-col justify-between relative overflow-hidden card-polish">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h4 className="font-bold text-[18px] text-on-surface">Komposisi Sampah</h4>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Akumulasi Real-time Hasil Pemilahan & Residu
              </p>
            </div>
            <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">
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

            const rawOrg = parseKgValue(stats?.komposisiSampah?.organikKg ?? stats?.komposisiSampah?.organik?.berat, 363.1);
            const rawAnorg = parseKgValue(stats?.komposisiSampah?.anorganikKg ?? stats?.komposisiSampah?.anorganik?.berat, 387.5);
            const rawResidu = parseKgValue(stats?.komposisiSampah?.residuKg ?? stats?.komposisiSampah?.residu?.berat, 3053.7);

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
            let dominantColor = "text-rose-600";

            if (pctOrg >= pctAnorg && pctOrg >= pctResidu) {
              dominantLabel = "Organik";
              dominantPct = pctOrg;
              dominantColor = "text-emerald-600";
            } else if (pctAnorg >= pctOrg && pctAnorg >= pctResidu) {
              dominantLabel = "Anorganik";
              dominantPct = pctAnorg;
              dominantColor = "text-amber-500";
            }

            return (
              <div className="flex-1 flex flex-col items-center justify-between my-1">
                {/* SVG Ring Chart */}
                <div className="w-40 h-40 relative flex items-center justify-center my-2 group cursor-pointer">
                  <svg className="w-40 h-40 transform -rotate-90">
                    <circle cx="80" cy="80" r="50" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                    {pctOrg > 0 && (
                      <circle
                        cx="80"
                        cy="80"
                        r="50"
                        fill="transparent"
                        stroke="#10b981"
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
                        stroke="#eab308"
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
                        stroke="#ef4444"
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
                    <span className="text-[10px] text-slate-500 uppercase font-extrabold tracking-wider mt-1 block">
                      {dominantLabel}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold block mt-0.5 font-mono">
                      {totalKg.toLocaleString("id-ID", { maximumFractionDigits: 1 })} Kg Total
                    </span>
                  </div>
                </div>

                {/* Progress Breakdown Bars for Each Category */}
                <div className="mt-3 w-full space-y-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/60">
                  {/* Organik Progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1.5 font-extrabold text-slate-700">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] inline-block"></span>
                        Organik
                      </div>
                      <div className="font-mono font-bold text-slate-800">
                        {rawOrg.toLocaleString("id-ID", { maximumFractionDigits: 1 })} Kg{" "}
                        <span className="text-emerald-600 font-extrabold ml-1">({pctOrg}%)</span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-slate-200/80 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#10b981] rounded-full transition-all duration-500"
                        style={{ width: `${pctOrg}%` }}
                      />
                    </div>
                  </div>

                  {/* Anorganik Progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1.5 font-extrabold text-slate-700">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#eab308] inline-block"></span>
                        Anorganik
                      </div>
                      <div className="font-mono font-bold text-slate-800">
                        {rawAnorg.toLocaleString("id-ID", { maximumFractionDigits: 1 })} Kg{" "}
                        <span className="text-amber-600 font-extrabold ml-1">({pctAnorg}%)</span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-slate-200/80 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#eab308] rounded-full transition-all duration-500"
                        style={{ width: `${pctAnorg}%` }}
                      />
                    </div>
                  </div>

                  {/* Residu Progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1.5 font-extrabold text-slate-700">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] inline-block"></span>
                        Residu
                      </div>
                      <div className="font-mono font-bold text-slate-800">
                        {rawResidu.toLocaleString("id-ID", { maximumFractionDigits: 1 })} Kg{" "}
                        <span className="text-rose-600 font-extrabold ml-1">({pctResidu}%)</span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-slate-200/80 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#ef4444] rounded-full transition-all duration-500"
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
            className="mt-3 w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all duration-150 btn-polish cursor-pointer"
          >
            Lihat Detail Komposisi
          </button>
        </div>
      </div>


      {/* === Monitoring Leaderboard Section (Grup 1 & Grup 2) === */}
      <div className="w-full">
        <LeaderboardWidget />
      </div>

      {/* === Central Operational Lists & Activity (Enterprise Interactive Design) === */}
      <div className="grid grid-cols-12 gap-gutter">
        {/* Data Tempat Sampah Terbaru */}
        <div className="col-span-12 lg:col-span-6 bg-white/90 backdrop-blur-sm shadow-sm rounded-2xl p-6 border border-slate-200/80 flex flex-col justify-between card-polish">
          <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
                <Trash2 size={16} />
              </div>
              <div>
                <h4 className="font-extrabold text-[16px] text-slate-800 tracking-tight">
                  Data Tempat Sampah Terbaru
                </h4>
                <p className="text-[11px] text-slate-400 font-medium leading-none mt-0.5">
                  Monitoring Kapasitas & Status QR Tempat Sampah Terdaftar
                </p>
              </div>
            </div>
            <Link
              to="/manajemen-tempat-sampah"
              className="text-xs font-extrabold text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100/80 px-3 py-1.5 rounded-xl border border-emerald-200/60"
            >
              Lihat Semua <ChevronRight size={14} />
            </Link>
          </div>

          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
                  <th className="py-2.5 px-2 rounded-l-lg">ID & Jenis</th>
                  <th className="py-2.5 px-2">Lokasi</th>
                  <th className="py-2.5 px-2">Kapasitas Tempat Sampah</th>
                  <th className="py-2.5 px-2 text-center">Poin/Kg</th>
                  <th className="py-2.5 px-2 text-right rounded-r-lg">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {recentBins.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                      Belum ada data tempat sampah terdaftar.
                    </td>
                  </tr>
                ) : (
                  recentBins.map((bin, i) => {
                    const cap = Math.min(100, Math.round(
                      bin.kapasitas ||
                      (Number(bin.currentVolumeLiter) / Number(bin.maxCapacityLiter)) * 100
                    ));
                    const categoryStr = String(bin.category?.name || bin.categoryId || "UMUM").toUpperCase();
                    const isOrganik = categoryStr.includes("ORGANIK") && !categoryStr.includes("ANORGANIK") && !categoryStr.includes("NON");
                    const isAnorganik = categoryStr.includes("ANORGANIK") || categoryStr.includes("NON");

                    const isHighCap = cap >= 90;

                    return (
                      <tr
                        key={bin.id || bin.kode || i}
                        className="hover:bg-slate-50/80 transition-all duration-150 group"
                      >
                        {/* ID & Category */}
                        <td className="py-3 px-2">
                          <div className="flex flex-col">
                            <span className="font-mono font-extrabold text-slate-800 text-[13px] group-hover:text-emerald-700 transition-colors">
                              {bin.qrCode || bin.kode || (bin.id ? bin.id.substring(0, 8) : "BIN")}
                            </span>
                            <div className="flex items-center gap-1 mt-0.5">
                              {isOrganik ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                  <Leaf size={11} /> Organik
                                </span>
                              ) : isAnorganik ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                  <Recycle size={11} /> Anorganik
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                                  {bin.category?.name || bin.categoryId || "Umum"}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Location */}
                        <td className="py-3 px-2">
                          <div className="flex flex-col min-w-[110px]">
                            <span className="font-bold text-slate-700 text-[12px]">
                              {bin.rtRw?.kelurahan?.name || "Coblong"}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {typeof bin.rtRw === "string" ? bin.rtRw : bin.rtRw?.name || "-"}
                            </span>
                          </div>
                        </td>

                        {/* Capacity Gauge */}
                        <td className="py-3 px-2 min-w-[120px]">
                          <div className="flex flex-col gap-1">
                            <div className="flex justify-between items-center text-[10px] font-bold">
                              <span className={isHighCap ? "text-rose-600 font-black" : "text-emerald-600 font-extrabold"}>
                                {cap}% {isHighCap ? "Penuh" : "Tersedia"}
                              </span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isHighCap ? "bg-rose-500 animate-pulse" : "bg-emerald-500"
                                }`}
                                style={{ width: `${cap}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Points per Kg */}
                        <td className="py-3 px-2 text-center">
                          <span className="font-extrabold text-amber-600 font-mono text-[13px] bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/50">
                            {bin.category?.pointsPerKg || 10}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-2 text-right">
                          <div className="flex justify-end items-center gap-1">
                            <button
                              onClick={() => setSelectedBinForDetail(bin)}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Detail Tempat Sampah"
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              onClick={() => navigate(`/manajemen-tempat-sampah?edit=${bin.id || bin.kode}`)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Tempat Sampah"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => setDeleteBinConfirm(bin)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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

        {/* Sesi Aktif Card */}
        <div className="col-span-12 lg:col-span-6 bg-white/90 backdrop-blur-sm shadow-sm rounded-2xl p-6 border border-slate-200/80 flex flex-col justify-between card-polish">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 shadow-2xs">
                  <UserCheck size={20} />
                </div>
                <div>
                  <h4 className="font-extrabold text-[17px] text-slate-800 tracking-tight">
                    Sesi Aktif
                  </h4>
                  <p className="text-xs text-slate-400 font-medium leading-none mt-1">
                    Pengguna yang sesinya masih terbuka
                  </p>
                </div>
              </div>
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                4
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3 text-slate-700 text-xs font-semibold">
                  <Code2 size={16} className="text-slate-500" />
                  <span>Admin / Task Force</span>
                </div>
                <span className="font-black text-slate-900 text-sm">1</span>
              </div>

              <div className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3 text-slate-400 text-xs font-medium">
                  <ShieldCheck size={16} />
                  <span>Operator (DLH / Camat / Lurah)</span>
                </div>
                <span className="font-bold text-slate-300 text-sm">1</span>
              </div>

              <div className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3 text-slate-400 text-xs font-medium">
                  <Award size={16} />
                  <span>Rukun Warga (RW)</span>
                </div>
                <span className="font-bold text-slate-300 text-sm">0</span>
              </div>

              <div className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3 text-slate-700 text-xs font-semibold">
                  <BookOpen size={16} className="text-emerald-600" />
                  <span>Dosen DPL</span>
                </div>
                <span className="font-black text-slate-900 text-sm">1</span>
              </div>

              <div className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3 text-slate-700 text-xs font-semibold">
                  <Truck size={16} className="text-rose-600" />
                  <span>Petugas Residu</span>
                </div>
                <span className="font-black text-slate-900 text-sm">1</span>
              </div>

              <div className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3 text-slate-400 text-xs font-medium">
                  <GraduationCap size={16} />
                  <span>Mahasiswa KKN</span>
                </div>
                <span className="font-bold text-slate-300 text-sm">0</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link
              to="/pengguna-online"
              className="w-full py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-700 hover:text-slate-900 transition-all flex items-center justify-center gap-2 shadow-2xs group cursor-pointer"
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden border border-outline-variant animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
              <h3 className="font-bold text-[20px] text-on-surface flex items-center gap-2">
                <BarChart className="text-primary" />
                Rincian Komposisi & Aliran Sampah
              </h3>
              <button
                onClick={() => setShowCompositionDetail(false)}
                className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto text-sm">
              <p className="text-xs text-on-surface-variant">
                Detail material timbulan sampah organik (kompos, sisa makanan), anorganik (plastik, kertas, logam), dan residu hilir (b3, popok, TPA) di wilayah Kecamatan Coblong.
              </p>

              <div className="space-y-3">
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <h4 className="font-bold text-emerald-800 text-[13px] uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Leaf size={16} />
                    Material Organik ({stats?.komposisiSampah?.organik?.persentase || "50%"})
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-gray-500 block">Sisa Makanan / Dapur</span>
                      <strong className="text-emerald-900 font-bold">65% (Estimasi)</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Dedaunan / Ranting</span>
                      <strong className="text-emerald-900 font-bold">35% (Estimasi)</strong>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <h4 className="font-bold text-blue-800 text-[13px] uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Recycle size={16} />
                    Material Anorganik ({stats?.komposisiSampah?.anorganik?.persentase || "35%"})
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500 block">Plastik PET</span>
                      <strong className="text-blue-900 font-bold">45%</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Kertas / Karton</span>
                      <strong className="text-blue-900 font-bold">30%</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Logam / Kaca</span>
                      <strong className="text-blue-900 font-bold">25%</strong>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
                  <h4 className="font-bold text-rose-800 text-[13px] uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Trash2 size={16} />
                    Material Residu Hilir ({stats?.komposisiSampah?.residu?.persentase || "15%"})
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500 block">Popok / Pembalut</span>
                      <strong className="text-rose-900 font-bold">40% (Timbangan Hilir)</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Residu B3 / Medis</span>
                      <strong className="text-rose-900 font-bold">35% (Timbangan Hilir)</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Non-Recyclable / TPA</span>
                      <strong className="text-rose-900 font-bold">25% (Timbangan Hilir)</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-2">
                <h5 className="font-bold text-gray-800 text-xs">Kontribusi Tonase Terbesar per RW</h5>
                {locations.slice(0, 3).map((loc) => (
                  <div key={loc.rw} className="flex justify-between text-xs text-gray-600">
                    <span>{loc.rw} ({loc.kelurahan})</span>
                    <span className="font-bold text-on-surface">{loc.titikCount * 12} Kg terpilah</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-outline-variant flex justify-end">
              <button
                onClick={() => setShowCompositionDetail(false)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-xs font-bold text-on-surface-variant transition-colors cursor-pointer"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Bin Modal */}
      {selectedBinForDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden border border-outline-variant animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
              <h3 className="font-bold text-[18px] text-on-surface">Detail Tempat Sampah Cerdas</h3>
              <button
                onClick={() => setSelectedBinForDetail(null)}
                className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-2xl border-2 border-outline-variant/60 shadow-inner flex flex-col items-center gap-2">
                  <img
                    className="w-40 h-40"
                    alt="QR Code"
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(selectedBinForDetail.qrCode || selectedBinForDetail.kode)}`}
                  />
                  <span className="text-[14px] font-mono font-bold text-primary tracking-widest">
                    {selectedBinForDetail.qrCode || selectedBinForDetail.kode}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-outline-variant/20 text-sm">
                  <span className="text-on-surface-variant">Kategori Sampah</span>
                  <span
                    className={`font-bold uppercase ${(selectedBinForDetail.category?.name || selectedBinForDetail.categoryId || "")
                        .toUpperCase()
                        .includes("ORGANIK")
                        ? "text-primary"
                        : "text-secondary"
                      }`}
                  >
                    {selectedBinForDetail.category?.name || selectedBinForDetail.categoryId}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-outline-variant/20 text-sm">
                  <span className="text-on-surface-variant">Wilayah (RT/RW)</span>
                  <span className="font-semibold text-on-surface">
                    {typeof selectedBinForDetail.rtRw === "string"
                      ? selectedBinForDetail.rtRw
                      : selectedBinForDetail.rtRw?.name || "-"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-outline-variant/20 text-sm">
                  <span className="text-on-surface-variant">Status Kapasitas</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${(selectedBinForDetail.kapasitas ||
                        (Number(selectedBinForDetail.currentVolumeLiter) /
                          Number(selectedBinForDetail.maxCapacityLiter)) *
                        100) > 90
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                      }`}
                  >
                    {selectedBinForDetail.currentVolumeLiter}L /{" "}
                    {selectedBinForDetail.maxCapacityLiter}L (
                    {Math.round(
                      selectedBinForDetail.kapasitas ||
                      (Number(selectedBinForDetail.currentVolumeLiter) /
                        Number(selectedBinForDetail.maxCapacityLiter)) *
                      100
                    )}
                    %)
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 text-sm">
                  <span className="text-on-surface-variant">Poin Setoran</span>
                  <span className="font-bold text-yellow-600">
                    {selectedBinForDetail.category?.pointsPerKg || 100} Poin / Kg
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedBinForDetail(null)}
                className="w-full py-3 bg-surface-container hover:bg-surface-container-high rounded-xl text-xs font-bold text-on-surface transition-colors cursor-pointer"
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
