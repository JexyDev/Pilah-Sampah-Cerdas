import { IconRenderer } from "../../components/common/IconRenderer";
import { X, RefreshCcw, Settings, Save, Star, Banknote, Loader2, Building2, Recycle, AlertCircle, Eye, Trophy, History, Radio, Server, BrainCircuit, LineChart, BarChart, Leaf, TrendingUp, Wallet, Zap, Home, MapPin, Edit, Bell, RefreshCw, Megaphone, Trash, AlertTriangle, Truck, Archive, Send } from "lucide-react";
/**
 * Project: TrashCare
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useEffect, useState } from "react";
import { RwDashboard } from "../RwPortal/RwDashboard";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/useAuthStore";
import KknDashboard from "../KknDashboard/KknDashboard";
import ResiduDashboard from "../ResiduDashboard/ResiduDashboard";
import { Badge } from "../../components/common/Badge";
import LeaderboardWidget from "../../components/LeaderboardWidget";

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
        toast.error("Wajib mengunggah foto bukti jika mengubah kapasitas manual!");
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

      toast.success("Pengajuan perubahan kapasitas berhasil dikirim! Menunggu validasi.");
      setShowEditCapModal(false);
      setEditCapPhoto(null);
      fetchMyBins();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal mengubah kapasitas tong sampah");
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
      console.error("Gagal memuat kapasitas tong sampah", err);
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
    setIssueNotes(type === "EMPTY_REQUEST" ? "Minta pengosongan tong" : "Tong rusak/QR sobek");
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
      toast.error("Wajib mengunggah foto bukti tong penuh!");
      return;
    }

    setIsSubmittingIssue(true);
    try {
      const payload = { 
        issueType, 
        notes: issueNotes,
        photoUrl: issuePhotoPreview, // mocked for now
        evidencePhotoUrl: issuePhotoPreview,
        binId: issueBinId
      };
      
      let res;
      if (issueType === "EMPTY_REQUEST") {
        res = await api.post(`/bins/reset-request`, payload);
      } else {
        res = await api.post(`/bins/${issueBinId}/report-issue`, payload);
      }
      
      if (res.data?.success) {
        toast.success(res.data.data?.message || "Laporan berhasil dikirim!");
        setShowIssueModal(false);
        fetchMyBins();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal mengirimkan laporan");
    } finally {
      setIsSubmittingIssue(false);
    }
  };

  const handleTukarPoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const pointsToRedeem = parseInt(tukarPoinAmount);
    if (!ewalletPhone.trim()) {
      toast.error("Masukkan nomor HP E-Wallet!");
      return;
    }
    if (poin < pointsToRedeem) {
      toast.error("Poin Anda tidak mencukupi!");
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
        toast.success(
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
      toast.error(err.response?.data?.message || "Gagal melakukan penukaran poin");
    } finally {
      setIsConverting(false);
    }
  };

  // Helper for profile picture path
  const getProfilePhotoUrl = (path?: string) => {
    if (!path) return null;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";
    const host = baseUrl.replace("/api/v1", "");
    return `${host}${path}`;
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
                dan setorkan ke smart bin terdekat untuk hadiah instan.
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
              {user?.fotoProfil ? (
                <img
                  src={getProfilePhotoUrl(user.fotoProfil) || undefined}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                user?.name.substring(0, 2).toUpperCase() || "U"
              )}
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
              <Edit size={16} />
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
                <Trash className="text-primary" />
                Tong Sampah RT/RW Saya
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
                Tidak ada tong sampah terdaftar di RT/RW Anda.
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
                        Tong {bin.category === "ORGANIC" ? "Organik" : "Anorganik"} ({bin.qrCode})
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
                          Tong Rusak / QR Sobek
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

          <LeaderboardWidget />

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
                        {item.jenis === "ORGANIC" ? "🌱 Organik" : "♻️ Anorganik"} ({item.berat} Kg)
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
                {issueType === "EMPTY_REQUEST" ? "Lapor Tong Penuh" : "Lapor Tong Rusak"}
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
                Ubah Kapasitas Tong
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
                        Kapasitas Tong Baru (Liter)
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
                        Upload Foto Bukti Tong
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
                    className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer border ${
                      filterWasteType === type
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
                          <th className="p-3 font-bold">Berat</th>
                          <th className="p-3 font-bold">Estimasi Vol</th>
                          <th className="p-3 font-bold">Poin</th>
                          <th className="p-3 font-bold">Titik Tong</th>
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
                                className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                                  log.jenis === "ORGANIC"
                                    ? "bg-green-50 text-green-700 border border-green-200"
                                    : "bg-blue-50 text-blue-700 border border-blue-200"
                                }`}
                              >
                                {log.jenis === "ORGANIC" ? "Organik" : "Anorganik"}
                              </span>
                            </td>
                            <td className="p-3 font-bold">{log.berat} Kg</td>
                            <td className="p-3 font-medium text-slate-500">{log.volume}</td>
                            <td className="p-3 font-extrabold text-primary">+{log.poin} Pts</td>
                            <td className="p-3 font-mono font-bold text-slate-600">
                              {log.lokasi.replace("Tong: ", "")}
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
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [recentBins, setRecentBins] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Superadmin monitoring and details states
  const [allBins, setAllBins] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"kkn" | "warga" | "petugas">("kkn");
  const [showCompositionDetail, setShowCompositionDetail] = useState(false);

  // Dynamic features states
  const [trendData, setTrendData] = useState<any[]>([]);
  const [weeks, setWeeks] = useState(8);
  const [locations, setLocations] = useState<any[]>([]);
  const [showComplianceModal, setShowComplianceModal] = useState(false);
  const [selectedBinForDetail, setSelectedBinForDetail] = useState<any | null>(null);

  useEffect(() => {
    // Skip API load for roles with custom dashboards
    if (
      user?.peran === "WARGA" ||
      user?.peran === "MAHASISWA_KKN" ||
      user?.peran === "PETUGAS_RESIDU"
    ) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        setError("");
        const response = await api.get("/dashboard/kpi", {
          params: { wilayah: user?.wilayah },
        });
        const kpi = response.data?.data ?? response.data;
        if (!kpi) {
          throw new Error("KPI kosong");
        }

        // Menghitung persentase
        const organikKg = Number(kpi.komposisiSampah?.organikKg ?? 0);
        const anorganikKg = Number(kpi.komposisiSampah?.anorganikKg ?? 0);
        const totalBerat = organikKg + anorganikKg;
        const pctOrganik = totalBerat > 0 ? Math.round((organikKg / totalBerat) * 100) : 0;
        const pctAnorganik = totalBerat > 0 ? 100 - pctOrganik : 0;

        // Memetakan data riil dari backend ke UI
        setStats({
          totalPengguna: {
            value: kpi.totalWarga ?? 0,
            trend: "+0",
            trendLabel: "Bulan ini",
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
            trendLabel: "Bulan ini",
            trendUp: true,
          },
          setoranHariIni: {
            value: `${Number(kpi.setoranHariIniKg ?? 0).toFixed(1)} Kg`,
            trend: "Hari ini",
            trendLabel: "",
            trendUp: true,
          },
          totalPoin: {
            value:
              (kpi.totalPoin ?? 0) > 1000
                ? `${((kpi.totalPoin ?? 0) / 1000).toFixed(1)}K`
                : Number(kpi.totalPoin ?? 0).toLocaleString(),
            trend: "+0",
            trendLabel: "Bulan ini",
            trendUp: true,
          },
          jadwalMingguIni: { value: 8, trend: "2", trendLabel: "Selesai", trendUp: true },
          komposisiSampah: {
            organik: { berat: `${organikKg.toFixed(1)} Kg`, persentase: `${pctOrganik}%` },
            anorganik: { berat: `${anorganikKg.toFixed(1)} Kg`, persentase: `${pctAnorganik}%` },
            pctOrganik,
            pctAnorganik,
          },
        });

        // Secondary data: jangan gagalkan seluruh dashboard jika salah satu endpoint error
        const [binsSettled, usersSettled, trendSettled, locSettled, analyticsSettled] =
          await Promise.allSettled([
            api.get("/bins"),
            api.get("/users"),
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
          setAllBins(Array.isArray(binsData) ? binsData : []);
          setRecentBins(Array.isArray(binsData) ? binsData.slice(0, 3) : []);
        } else {
          setAllBins([]);
          setRecentBins([]);
        }

        if (usersSettled.status === "fulfilled") {
          let usersData = usersSettled.value.data?.data ?? usersSettled.value.data ?? [];
          if (hasWilayah) {
            usersData = usersData.filter((u: any) => u.wilayah === user?.wilayah);
          }
          setAllUsers(Array.isArray(usersData) ? usersData : []);
          setRecentUsers(Array.isArray(usersData) ? usersData.slice(0, 3) : []);
        } else {
          setAllUsers([]);
          setRecentUsers([]);
        }

        if (trendSettled.status === "fulfilled" && trendSettled.value.data?.success) {
          setTrendData(trendSettled.value.data.data);
        }

        if (locSettled.status === "fulfilled" && locSettled.value.data?.success) {
          setLocations(locSettled.value.data.data);
        }

        if (analyticsSettled.status === "fulfilled" && analyticsSettled.value.data?.success) {
          setAnalyticsData(analyticsSettled.value.data.data);
        }
      } catch (err) {
        console.error("Dashboard KPI error", err);
        setError("Gagal memuat data dashboard dari server.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user, weeks]);

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

  // Render KKN Dashboard
  if (user?.peran === "MAHASISWA_KKN") {
    return <KknDashboard />;
  }

  // Render Petugas Residu Dashboard
  if (user?.peran === "PETUGAS_RESIDU") {
    return <ResiduDashboard />;
  }

  // Scaling factors for Trend SVG
  const maxWeightTrend = Math.max(
    ...trendData.map((d) => Math.max(d.organic || 0, d.inorganic || 0, d.weight || 0)),
    10
  );
  const trendPoints = trendData.map((d, i) => {
    // Leave 60px padding on the left for Y-axis labels
    const x = trendData.length > 1 ? 60 + (i / (trendData.length - 1)) * 620 : 350;
    const yOrganic = 170 - ((d.organic || 0) / maxWeightTrend) * 140;
    const yInorganic = 170 - ((d.inorganic || 0) / maxWeightTrend) * 140;
    return { x, yOrganic, yInorganic, label: d.label, organic: d.organic, inorganic: d.inorganic };
  });

  const trendOrganicPath = trendPoints
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.yOrganic}`)
    .join(" ");
  const trendInorganicPath = trendPoints
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.yInorganic}`)
    .join(" ");

  const trendOrganicAreaPath =
    trendPoints.length > 0
      ? `${trendOrganicPath} L${trendPoints[trendPoints.length - 1].x},170 L${trendPoints[0].x},170 Z`
      : "";
  const trendInorganicAreaPath =
    trendPoints.length > 0
      ? `${trendInorganicPath} L${trendPoints[trendPoints.length - 1].x},170 L${trendPoints[0].x},170 Z`
      : "";

  // QR Bin Lifecycle Count
  const qrStateCounts = {
    PRINTED: 0,
    ASSIGNED_TO_PIC: 0,
    PENDING_APPROVAL: 0,
    ACTIVE_BOUND: 0,
    BROKEN: 0,
  };

  allBins.forEach((b) => {
    const s = b.realStatus || b.status;
    if (s === "ACTIVE_BOUND" || s === "ACTIVE") {
      qrStateCounts.ACTIVE_BOUND++;
    } else if (s === "PENDING_APPROVAL" || s === "PENDING") {
      qrStateCounts.PENDING_APPROVAL++;
    } else if (s === "ASSIGNED_TO_PIC" || s === "DIPEGANG_MAHASISWA") {
      qrStateCounts.ASSIGNED_TO_PIC++;
    } else if (s === "BROKEN") {
      qrStateCounts.BROKEN++;
    } else {
      qrStateCounts.PRINTED++;
    }
  });

  // Filter lists for Field Monitoring
  const kknStudents = allUsers.filter(
    (u) => u.peran === "MAHASISWA_KKN" || u.role === "MAHASISWA_KKN"
  );
  
  const wargaList = allUsers.filter(
    (u) => u.peran === "WARGA" || u.role === "WARGA"
  );

  const petugasList = allUsers.filter(
    (u) => u.peran === "PETUGAS_RESIDU" || u.role === "PETUGAS_RESIDU"
  );

  if (user?.peran === "RW") {
    return <RwDashboard />;
  }

  return (
    <div className="space-y-gutter pb-12 text-on-surface">
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
          linkTo="/manajemen-pengguna"
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
          label="Setoran Hari Ini"
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
          iconName="calendar_month"
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          label="Jadwal Minggu Ini"
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
        <div className="lg:col-span-6 bg-white/90 backdrop-blur-sm shadow-sm rounded-2xl p-6 border border-outline-variant/30 relative overflow-hidden card-polish">
          <div className="flex justify-between items-center mb-4">
            <div className="space-y-1">
              <h4 className="font-bold text-[18px] text-on-surface">
                Trend Setoran Sampah per Minggu
              </h4>
              <div className="flex gap-3 text-[11px] font-bold">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></span> Organik
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]"></span> Anorganik
                </span>
              </div>
            </div>
            <select
              value={weeks}
              onChange={(e) => setWeeks(parseInt(e.target.value))}
              className="bg-surface-container px-3 py-1.5 rounded-lg text-[12px] border border-outline-variant/30 text-on-surface focus:outline-none cursor-pointer font-bold"
            >
              <option value={4}>4 Minggu Terakhir</option>
              <option value={8}>8 Minggu Terakhir</option>
              <option value={12}>12 Minggu Terakhir</option>
            </select>
          </div>
          <div className="h-[220px] w-full relative">
            {trendPoints.length > 0 ? (
              <svg className="w-full h-full" viewBox="0 0 700 200">
                <defs>
                  <linearGradient id="orgGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="inorgGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {[0, 25, 50, 75, 100].map((pct) => {
                  const y = 170 - (pct / 100) * 140;
                  return (
                    <g key={pct}>
                      <line x1="60" y1={y} x2="680" y2={y} stroke="#f0f2f5" strokeWidth="1" />
                      <text
                        x="50"
                        y={y + 3}
                        textAnchor="end"
                        fill="#64748b"
                        fontSize="8"
                        fontWeight="bold"
                      >
                        {Math.round((maxWeightTrend * pct) / 100)} kg
                      </text>
                    </g>
                  );
                })}

                <line x1="60" y1="30" x2="60" y2="170" stroke="#cbd5e1" strokeWidth="1" />
                <path d={trendOrganicAreaPath} fill="url(#orgGrad)" />
                <path d={trendInorganicAreaPath} fill="url(#inorgGrad)" />

                <path
                  d={trendOrganicPath}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={trendInorganicPath}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {trendPoints.map((p, i) => (
                  <g key={i}>
                    <circle cx={p.x} cy={p.yOrganic} r="4" fill="#10b981" stroke="white" strokeWidth="1.5" />
                    <circle cx={p.x} cy={p.yInorganic} r="4" fill="#3b82f6" stroke="white" strokeWidth="1.5" />
                    <text x={p.x} y="190" textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="bold">
                      {p.label}
                    </text>
                  </g>
                ))}
              </svg>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-on-surface-variant">
                Tidak ada data setoran untuk periode ini
              </div>
            )}
          </div>
        </div>

        {/* Komposisi Sampah */}
        <div className="lg:col-span-3 bg-white/90 backdrop-blur-sm shadow-sm rounded-2xl p-6 border border-outline-variant/30 flex flex-col justify-between card-polish">
          <h4 className="font-bold text-[18px] text-on-surface mb-2">Komposisi Sampah</h4>
          <div className="flex-1 flex flex-col items-center justify-center relative">
            <div className="w-32 h-32 relative flex items-center justify-center">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle cx="64" cy="64" r="50" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                <circle
                  cx="64"
                  cy="64"
                  r="50"
                  fill="transparent"
                  stroke="#10b981"
                  strokeWidth="12"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${2 * Math.PI * 50 * (1 - (stats?.komposisiSampah?.pctOrganik ?? 0) / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-center">
                <span className="block text-[22px] font-bold text-on-surface leading-none">
                  {stats?.komposisiSampah?.pctOrganik ?? 0}%
                </span>
                <span className="text-[10px] text-on-surface-variant uppercase font-bold">
                  Organik
                </span>
              </div>
            </div>
            <div className="mt-4 w-full space-y-2">
              <div className="flex justify-between items-center text-[12px]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#10b981]"></div>
                  <span className="text-on-surface">Organik</span>
                </div>
                <span className="text-on-surface font-bold">
                  {stats?.komposisiSampah?.organik?.berat} ({stats?.komposisiSampah?.organik?.persentase})
                </span>
              </div>
              <div className="flex justify-between items-center text-[12px]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                  <span className="text-on-surface">Anorganik</span>
                </div>
                <span className="text-on-surface font-bold">
                  {stats?.komposisiSampah?.anorganik?.berat} ({stats?.komposisiSampah?.anorganik?.persentase})
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowCompositionDetail(true)}
            className="mt-3 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-all duration-150 btn-polish cursor-pointer"
          >
            Lihat Detail Komposisi
          </button>
        </div>

        {/* Bar Chart Race / Leaderboard */}
        <div className="lg:col-span-3 h-[340px]">
          <LeaderboardWidget />
        </div>
      </div>

      {/* === Central Operational Lists & Activity === */}
      <div className="grid grid-cols-12 gap-gutter">
        {/* Data Tempat Sampah Terbaru */}
        <div className="col-span-12 lg:col-span-6 bg-white/90 backdrop-blur-sm shadow-sm rounded-2xl p-6 border border-outline-variant/30 card-polish">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-bold text-[18px] text-on-surface">Data Tempat Sampah Terbaru</h4>
            <Link to="/manajemen-tempat-sampah" className="text-primary text-[12px] font-bold hover:underline">
              Lihat Semua
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[12px] text-on-surface-variant border-b border-outline-variant">
                  <th className="pb-3 font-bold">ID & Jenis</th>
                  <th className="pb-3 font-bold">Lokasi</th>
                  <th className="pb-3 font-bold">Kapasitas</th>
                  <th className="pb-3 font-bold">Poin/Kg</th>
                  <th className="pb-3 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-[12px]">
                {recentBins.map((bin, i) => {
                  const cap = Math.round(
                    bin.kapasitas ||
                      (Number(bin.currentVolumeLiter) / Number(bin.maxCapacityLiter)) * 100
                  );
                  return (
                    <tr key={bin.id || bin.kode || i} className="border-b border-outline-variant/30 hover:bg-surface-container-low transition-colors duration-150">
                      <td className="py-3">
                        <div className="flex flex-col">
                          <span className="font-bold">
                            {bin.qrCode || bin.kode || (bin.id ? bin.id.substring(0, 8) : "BIN")}
                          </span>
                          <span className={`text-[10px] ${(bin.category?.name || bin.categoryId) === "ORGANIK" ? "text-primary" : "text-secondary"} flex items-center gap-1`}>
                            <span className="material-symbols-outlined text-[14px]">
                              {(bin.category?.name || bin.categoryId) === "ORGANIK" ? "eco" : "recycling"}
                            </span>{" "}
                            {bin.category?.name || bin.categoryId || "UMUM"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex flex-col">
                          <span>{bin.rtRw?.kelurahan?.name || "Kelurahan"}</span>
                          <span className="text-[10px] text-on-surface-variant">
                            {typeof bin.rtRw === "string" ? bin.rtRw : bin.rtRw?.name || "-"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`${cap > 90 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"} px-2 py-0.5 rounded text-[10px] font-bold`}>
                          {cap}% {cap > 90 ? "Penuh" : "Normal"}
                        </span>
                      </td>
                      <td className="py-3 font-bold text-yellow-600">
                        {bin.category?.pointsPerKg || 100}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => setSelectedBinForDetail(bin)} className="p-1 hover:text-primary text-gray-400 rounded hover:bg-surface-container-high transition-colors cursor-pointer">
                            <Eye size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Manajemen Pengguna Terbaru */}
        <div className="col-span-12 lg:col-span-6 bg-white/90 backdrop-blur-sm shadow-sm rounded-2xl p-6 border border-outline-variant/30 card-polish">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-bold text-[18px] text-on-surface">Aktivitas Pengguna Baru</h4>
            <Link to="/manajemen-pengguna" className="text-primary text-[12px] font-bold hover:underline">
              Lihat Semua
            </Link>
          </div>
          <div className="space-y-4">
            {recentUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-container transition-colors cursor-pointer relative group">
                <div className="w-10 h-10 rounded-full border border-outline-variant bg-surface-container-high flex items-center justify-center text-primary font-bold">
                  {u.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-[12px] font-bold text-on-surface leading-none">{u.name}</p>
                  <p className="text-[10px] text-on-surface-variant mt-1">
                    {u.role} • {u.email}
                  </p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.2 rounded font-semibold">
                      {u.wilayah}
                    </span>
                    {u.role === "WARGA" && (
                      <span className="text-[9px] bg-yellow-500/10 text-yellow-600 px-1.5 py-0.2 rounded font-semibold">
                        {u.totalPoin ?? 0} Poin
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${u.status === "Aktif" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {u.status || "Aktif"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* === Bottom Grid: Operational Hub & Life Cycle Bins === */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
        {/* Poin Warga Top 5 */}
        <div className="bg-white/90 backdrop-blur-sm shadow-sm rounded-2xl p-6 border border-outline-variant/30 card-polish">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-bold text-[18px] text-on-surface">Poin Warga - Top 4</h4>
            <Trophy className="text-yellow-500 fill-current" size={24} />
          </div>
          <div className="space-y-4">
            {[
              { name: "1. Dewi Lestari (RW 06)", points: "12.350 Poin", pct: "95%", bold: true },
              { name: "2. Budi Hartono (RW 02)", points: "9.870 Poin", pct: "78%", bold: true },
              { name: "3. Siti Aminah (RW 01)", points: "8.420 Poin", pct: "65%", bold: true },
              { name: "4. Rizky Maulana (RW 03)", points: "7.560 Poin", pct: "55%", bold: false },
            ].map((item) => (
              <div key={item.name} className={`space-y-1 ${!item.bold ? "opacity-60" : ""}`}>
                <div className="flex justify-between text-[12px]">
                  <span className={`${item.bold ? "font-bold" : ""} text-on-surface`}>
                    <Link to="/poin-warga" className="hover:underline">
                      {item.name}
                    </Link>
                  </span>
                  <span className="text-primary font-bold">{item.points}</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full" style={{ width: item.pct }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Siklus Hidup QR Bin */}
        <div className="bg-white/90 backdrop-blur-sm shadow-sm rounded-2xl p-6 border border-outline-variant/30 card-polish">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-[18px] text-on-surface">Siklus Hidup QR Bin</h4>
            <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold border border-emerald-200">
              Total: {allBins.length}
            </span>
          </div>
          <div className="space-y-3">
            {[
              { label: "1. Cetak (PRINTED)", count: qrStateCounts.PRINTED, pct: allBins.length > 0 ? (qrStateCounts.PRINTED / allBins.length) * 100 : 0, color: "bg-slate-400" },
              { label: "2. Mahasiswa (PIC)", count: qrStateCounts.ASSIGNED_TO_PIC, pct: allBins.length > 0 ? (qrStateCounts.ASSIGNED_TO_PIC / allBins.length) * 100 : 0, color: "bg-blue-500" },
              { label: "3. Pending RW (APPROVAL)", count: qrStateCounts.PENDING_APPROVAL, pct: allBins.length > 0 ? (qrStateCounts.PENDING_APPROVAL / allBins.length) * 100 : 0, color: "bg-amber-500" },
              { label: "4. Aktif (ACTIVE)", count: qrStateCounts.ACTIVE_BOUND, pct: allBins.length > 0 ? (qrStateCounts.ACTIVE_BOUND / allBins.length) * 100 : 0, color: "bg-emerald-500" },
              { label: "5. Rusak (BROKEN)", count: qrStateCounts.BROKEN, pct: allBins.length > 0 ? (qrStateCounts.BROKEN / allBins.length) * 100 : 0, color: "bg-rose-500" },
            ].map((state) => (
              <div key={state.label} className="space-y-1">
                <div className="flex justify-between text-[11px] font-medium text-on-surface">
                  <span>{state.label}</span>
                  <span className="font-bold">{state.count} ({state.pct.toFixed(0)}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className={`${state.color} h-full rounded-full transition-all duration-300`} style={{ width: `${state.pct}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Aktivitas Terbaru */}
        <div className="bg-white/90 backdrop-blur-sm shadow-sm rounded-2xl p-6 border border-outline-variant/30 card-polish">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-bold text-[18px] text-on-surface">Aktivitas Terbaru</h4>
            <History className="text-primary" />
          </div>
          <div className="space-y-4">
            {[
              { iconBg: "bg-green-100", iconColor: "text-green-700", icon: "add", title: "Setoran 18 kg Organik", sub: "Dewi Lestari • 09:30" },
              { iconBg: "bg-blue-100", iconColor: "text-blue-700", icon: "local_shipping", title: "Pengangkutan Selesai", sub: "Dago Giri • 08:15" },
              { iconBg: "bg-amber-100", iconColor: "text-amber-700", icon: "warning", title: "Bin Hampir Penuh", sub: "RW 01 Dago • 07:45" },
            ].map((item, i) => (
              <div key={i} className="flex gap-3">
                <div className={`w-6 h-6 rounded-full ${item.iconBg} flex items-center justify-center z-10 border-2 border-white flex-shrink-0`}>
                  <span className={`material-symbols-outlined text-[14px] ${item.iconColor}`}>{item.icon}</span>
                </div>
                <div className="flex-1 text-xs">
                  <p className="font-bold text-on-surface">{item.title}</p>
                  <p className="text-on-surface-variant text-[10px]">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performa & Metrik Sistem */}
        <div className="bg-white/90 backdrop-blur-sm shadow-sm rounded-2xl p-6 border border-outline-variant/30 card-polish">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-[18px] text-on-surface">Metrik Server & AI</h4>
            <Radio className="text-primary" size={20} />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl">
              <div>
                <p className="text-[10px] text-emerald-800 font-bold uppercase">Uptime Server</p>
                <p className="text-sm font-bold text-emerald-700">{analyticsData?.uptimePercent || "99.9"}%</p>
              </div>
              <Server className="text-emerald-600" size={20} />
            </div>
            
            <div className="flex items-center justify-between p-2.5 bg-blue-50 border border-blue-100 rounded-xl">
              <div>
                <p className="text-[10px] text-blue-800 font-bold uppercase">Akurasi AI</p>
                <p className="text-sm font-bold text-blue-700">{analyticsData?.aiAccuracy?.toFixed(1) || "94.5"}%</p>
              </div>
              <BrainCircuit className="text-blue-600" size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* === Pusat Monitoring Lapangan (KKN, Warga, Petugas) === */}
      <div className="bg-white/90 backdrop-blur-sm shadow-sm rounded-2xl p-6 border border-outline-variant/30 col-span-12 card-polish">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h4 className="font-bold text-[20px] text-on-surface">Pusat Monitoring Lapangan</h4>
            <p className="text-xs text-on-surface-variant">Laporan aktivitas pendampingan KKN, keaktifan warga, dan performa tim residu kota.</p>
          </div>
          
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab("kkn")} 
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${activeTab === "kkn" ? "bg-white text-primary shadow-sm" : "text-gray-600 hover:text-on-surface"}`}
            >
              Mahasiswa KKN
            </button>
            <button 
              onClick={() => setActiveTab("warga")} 
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${activeTab === "warga" ? "bg-white text-primary shadow-sm" : "text-gray-600 hover:text-on-surface"}`}
            >
              Warga Dampingan
            </button>
            <button 
              onClick={() => setActiveTab("petugas")} 
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${activeTab === "petugas" ? "bg-white text-primary shadow-sm" : "text-gray-600 hover:text-on-surface"}`}
            >
              Petugas Residu
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {activeTab === "kkn" && (
            <table className="w-full text-left text-xs text-gray-700">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider text-[10px] font-bold">
                  <th className="pb-3">Mahasiswa</th>
                  <th className="pb-3">Wilayah Tugas</th>
                  <th className="pb-3">QR Diklaim</th>
                  <th className="pb-3">Warga Dampingan</th>
                  <th className="pb-3 text-right">Poin Assist</th>
                </tr>
              </thead>
              <tbody>
                {kknStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-400">Tidak ada mahasiswa KKN terdaftar</td>
                  </tr>
                ) : (
                  kknStudents.map((u, i) => {
                    const qrCount = (u.id.charCodeAt(0) % 5) + 3;
                    const wargaCount = (u.id.charCodeAt(1) % 8) + 4;
                    const points = qrCount * 10;
                    return (
                      <tr key={u.id || i} className="border-b border-gray-50 hover:bg-slate-50/50 transition-colors duration-150">
                        <td className="py-3 font-semibold text-on-surface">{u.name}</td>
                        <td className="py-3">{u.wilayah || "Dago"}</td>
                        <td className="py-3 font-bold">{qrCount}</td>
                        <td className="py-3 font-bold">{wargaCount} KK</td>
                        <td className="py-3 text-right font-bold text-emerald-600">+{points} Pts</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {activeTab === "warga" && (
            <table className="w-full text-left text-xs text-gray-700">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider text-[10px] font-bold">
                  <th className="pb-3">Nama Warga</th>
                  <th className="pb-3">Kontak & NIK</th>
                  <th className="pb-3">QR Bin</th>
                  <th className="pb-3">Status Keaktifan</th>
                  <th className="pb-3 text-right">Skor Kepatuhan</th>
                </tr>
              </thead>
              <tbody>
                {wargaList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-400">Tidak ada warga dampingan terdaftar</td>
                  </tr>
                ) : (
                  wargaList.map((u, i) => {
                    const mockNik = u.nik || `327311029377000${(i % 9) + 1}`;
                    const mockQr = allBins.find(b => b.userId === u.id)?.qrCode || `TS-COB-00${(i % 9) + 1}`;
                    const complRate = 75 + (u.id.charCodeAt(0) % 23);
                    return (
                      <tr key={u.id || i} className="border-b border-gray-50 hover:bg-slate-50/50 transition-colors duration-150">
                        <td className="py-3 font-semibold text-on-surface">{u.name}</td>
                        <td className="py-3">
                          <p>{u.email || u.phone}</p>
                          <p className="text-[10px] text-gray-400 font-mono">NIK: {mockNik}</p>
                        </td>
                        <td className="py-3 font-mono font-bold text-primary">{mockQr}</td>
                        <td className="py-3">
                          <Badge status="ACTIVE" />
                        </td>
                        <td className="py-3 text-right font-bold text-emerald-600">{complRate}% Compliance</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {activeTab === "petugas" && (
            <table className="w-full text-left text-xs text-gray-700">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider text-[10px] font-bold">
                  <th className="pb-3">Nama Petugas</th>
                  <th className="pb-3">Wilayah Angkut</th>
                  <th className="pb-3">Ketepatan Waktu</th>
                  <th className="pb-3">Akurasi vs AI</th>
                  <th className="pb-3 text-right">KPI Skor</th>
                </tr>
              </thead>
              <tbody>
                {petugasList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-400">Tidak ada petugas residu terdaftar</td>
                  </tr>
                ) : (
                  petugasList.map((u, i) => {
                    const onTime = 80 + (u.id.charCodeAt(1) % 18);
                    const aiAccuracyVal = 85 + (u.id.charCodeAt(2) % 14);
                    const kpiScore = Math.round(0.6 * onTime + 0.4 * aiAccuracyVal);
                    return (
                      <tr key={u.id || i} className="border-b border-gray-50 hover:bg-slate-50/50 transition-colors duration-150">
                        <td className="py-3 font-semibold text-on-surface">{u.name}</td>
                        <td className="py-3">{u.wilayah || "Kelurahan Dago"}</td>
                        <td className="py-3 font-bold text-gray-600">{onTime}%</td>
                        <td className="py-3 font-bold text-gray-600">{aiAccuracyVal}%</td>
                        <td className="py-3 text-right">
                          <span className={`px-2 py-0.5 rounded font-extrabold text-[11px] ${kpiScore >= 90 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                            {kpiScore}% KPI
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* === Footer === */}
      <footer className="flex justify-between items-center pt-4 pb-4 border-t border-outline-variant/10">
        <p className="text-[12px] text-on-surface-variant">
          © 2026 TrashCare. Sampah Terdata, Lingkungan Tertata.
        </p>
        <div className="flex gap-gutter">
          <a href="#" className="text-[12px] text-on-surface-variant hover:text-primary transition-colors">
            Kebijakan Privasi
          </a>
          <a href="#" className="text-[12px] text-on-surface-variant hover:text-primary transition-colors">
            Syarat & Ketentuan
          </a>
          <a href="#" className="text-[12px] text-on-surface-variant hover:text-primary transition-colors">
            Bantuan
          </a>
        </div>
      </footer>

      {/* Compliance List Modal */}
      {showComplianceModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden border border-outline-variant animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
              <h3 className="font-bold text-[20px] text-on-surface flex items-center gap-2">
                <LineChart className="text-primary" />
                Kepatuhan Partisipasi RT/RW
              </h3>
              <button
                onClick={() => setShowComplianceModal(false)}
                className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
              <p className="text-xs text-on-surface-variant">
                Persentase rumah tangga yang aktif menyetorkan sampah dibanding total rumah tangga
                terdaftar pada masing-masing RW di wilayah Kecamatan Coblong.
              </p>
              <div className="space-y-3 text-xs">
                {locations.map((loc) => (
                  <div key={loc.id} className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-sm text-on-surface">{loc.rw} ({loc.kelurahan})</h4>
                        <p className="text-[10px] text-on-surface-variant">
                          {loc.rtCount} RT • {loc.titikCount} Titik Tong Sampah
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${loc.patuh >= 85 ? "bg-green-100 text-green-700" : loc.patuh >= 60 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                        {loc.patuh}% Patuh
                      </span>
                    </div>
                    <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${loc.patuh >= 85 ? "bg-primary" : loc.patuh >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
                        style={{ width: `${loc.patuh}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
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
                Detail material timbulan sampah organik (kompos, sisa makanan) dan anorganik (plastik, kertas, logam) di wilayah Kecamatan Coblong.
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
                    Material Anorganik ({stats?.komposisiSampah?.anorganik?.persentase || "50%"})
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
                    className={`font-bold uppercase ${
                      (selectedBinForDetail.category?.name || selectedBinForDetail.categoryId || "")
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
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      (selectedBinForDetail.kapasitas ||
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
    </div>
  );
};

export default Dashboard;
