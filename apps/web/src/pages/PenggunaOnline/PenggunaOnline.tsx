/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo.
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Globe,
  Power,
  Clock,
  Monitor,
  Smartphone,
  Search,
  Loader2,
  AlertTriangle,
  ShieldAlert,
  X,
  History,
  Volume2,
  VolumeX,
  Zap,
  Radio,
  Filter,
  UserCheck,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuthStore } from "../../store/useAuthStore";
import api from "../../services/api";

interface OnlineUser {
  id: string;
  name: string;
  phone: string;
  role: string;
  device: "Website (Desktop)" | "Mobile App (Android)" | "Mobile App (iOS)";
  identifier: string;
  loginTime: string;
  tokenExpiresAt: string;
}

interface TerminatedLog {
  id: string;
  userName: string;
  userRole: string;
  reason: string;
  timestamp: string;
}

const POLL_MS = 30_000;

export const PenggunaOnline: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const isPrivilegedUser =
    currentUser?.peran === "SUPER_USER" ||
    currentUser?.peran === "DEVELOPER" ||
    currentUser?.peran === "ADMIN_DLH";

  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deviceFilter, setDeviceFilter] = useState<string>("ALL");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [targetUser, setTargetUser] = useState<OnlineUser | null>(null);
  const [shutdownReason, setShutdownReason] = useState("🚨 Sesi Inaktif / Idle Timeout (>30 mnt)");
  const [customNote, setCustomNote] = useState("");
  const [isTerminating, setIsTerminating] = useState(false);
  const [shakeModal, setShakeModal] = useState(false);
  const [shutdownLogs, setShutdownLogs] = useState<TerminatedLog[]>([]);

  const fetchOnlineUsers = useCallback(async () => {
    try {
      const res = await api.get("/auth/online-users");
      if (res.data?.success && Array.isArray(res.data.data)) {
        setOnlineUsers(res.data.data);
        setLastRefresh(new Date());
      }
    } catch (err) {
      console.error("Gagal mengambil data pengguna online:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOnlineUsers();
    const interval = setInterval(fetchOnlineUsers, POLL_MS);
    return () => clearInterval(interval);
  }, [fetchOnlineUsers]);

  const playSirenSound = (type: "open" | "shutdown") => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      if (type === "open") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      }
    } catch {
      /* audio context blocked */
    }
  };

  const handleOpenShutdownModal = (user: OnlineUser) => {
    setTargetUser(user);
    setShutdownReason("🚨 Sesi Inaktif / Idle Timeout (>30 mnt)");
    setCustomNote("");
    setShakeModal(true);
    playSirenSound("open");
    if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
    setTimeout(() => setShakeModal(false), 500);
  };

  const handleConfirmShutdown = async () => {
    if (!targetUser) return;
    setIsTerminating(true);
    playSirenSound("shutdown");
    if (navigator.vibrate) navigator.vibrate([150, 50, 150, 50, 200]);
    try {
      await api.delete(`/auth/online-users/${targetUser.id}`);
      setOnlineUsers((prev) => prev.filter((u) => u.id !== targetUser.id));
      const now = new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setShutdownLogs((prev) => [
        {
          id: `LOG-${Date.now()}`,
          userName: targetUser.name,
          userRole: targetUser.role,
          reason: customNote ? `${shutdownReason} (${customNote})` : shutdownReason,
          timestamp: `${now} WIB`,
        },
        ...prev,
      ]);
      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? "animate-bounce" : "opacity-0"
            } max-w-md w-full bg-slate-900 text-white shadow-2xl rounded-2xl p-4 border-2 border-rose-500 flex items-start gap-3 relative overflow-hidden`}
          >
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-lg animate-pulse">
              <Zap size={22} />
            </div>
            <div className="flex-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800">
                SHUTDOWN BERHASIL
              </span>
              <h4 className="font-extrabold text-sm text-white mt-1">
                Sesi {targetUser.name} Diputus Paksa!
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Token dihapus dari database. Pengguna diminta login ulang.
              </p>
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ),
        { duration: 4500 }
      );
    } catch {
      toast.error("Gagal menghapus sesi. Coba lagi.");
    } finally {
      setIsTerminating(false);
      setTargetUser(null);
    }
  };

  const filteredUsers = useMemo(() => {
    return onlineUsers.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.phone.includes(searchQuery) ||
        u.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.identifier.toLowerCase().includes(searchQuery.toLowerCase());
      const isMob = u.device.toLowerCase().includes("mobile");
      const matchDev =
        deviceFilter === "ALL" ||
        (deviceFilter === "DESKTOP" && !isMob) ||
        (deviceFilter === "MOBILE" && isMob);
      const matchRole =
        roleFilter === "ALL" || u.role.toUpperCase() === roleFilter.toUpperCase();
      return matchSearch && matchDev && matchRole;
    });
  }, [onlineUsers, searchQuery, deviceFilter, roleFilter]);

  const totalDesktop = useMemo(
    () => onlineUsers.filter((u) => !u.device.toLowerCase().includes("mobile")).length,
    [onlineUsers]
  );
  const totalMobile = useMemo(
    () => onlineUsers.filter((u) => u.device.toLowerCase().includes("mobile")).length,
    [onlineUsers]
  );
  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage) || 1;
  const paginatedUsers = useMemo(
    () =>
      filteredUsers.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
      ),
    [filteredUsers, currentPage, rowsPerPage]
  );

  const getRoleBadgeStyle = (role: string) => {
    const r = role.toLowerCase();
    if (r.includes("developer"))
      return "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200/90 dark:border-rose-800 font-bold";
    if (r.includes("super"))
      return "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200/90 dark:border-purple-800 font-bold";
    if (r.includes("lurah") || r.includes("camat") || r.includes("admin"))
      return "bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200/90 dark:border-sky-800 font-bold";
    if (r.includes("dpl") || r.includes("mahasiswa"))
      return "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200/90 dark:border-indigo-800 font-bold";
    if (r.includes("petugas") || r.includes("residu"))
      return "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200/90 dark:border-amber-800 font-bold";
    if (r.includes("rw") || r.includes("rt"))
      return "bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200/90 dark:border-teal-800 font-bold";
    return "bg-emerald-50 dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 border-emerald-200/90 dark:border-emerald-800 font-bold";
  };

  const fmtTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  const uniqueRoles = useMemo(() => {
    const rolesSet = new Set(onlineUsers.map((u) => u.role));
    return Array.from(rolesSet);
  }, [onlineUsers]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#e5f7ed] dark:bg-emerald-950/50 text-[#009966] dark:text-emerald-400 flex items-center justify-center border border-[#009966]/20 dark:border-emerald-800/60 shadow-2xs shrink-0">
            <Radio size={24} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Monitoring Pengguna Online
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <span className="w-2 h-2 rounded-full bg-[#009966] animate-ping" />
                LIVE SESSIONS
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Pengguna dengan sesi token aktif real-time di sistem
              {lastRefresh && (
                <span className="ml-2 text-slate-400 dark:text-slate-500 font-mono">
                  (Terakhir synced: {lastRefresh.toLocaleTimeString("id-ID")} WIB)
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              soundEnabled
                ? "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
            title="Toggle Audio Alert Siren"
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span className="hidden sm:inline">
              {soundEnabled ? "Audio Siren ON" : "Muted"}
            </span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Active Sessions */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              TOTAL SESI AKTIF
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-[#009966] dark:text-emerald-400">
                {onlineUsers.length}
              </span>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Pengguna</span>
            </div>
            <span className="text-[11px] text-[#009966] dark:text-emerald-400 font-medium block">
              • Token refresh aktif &lt; 7 hari
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#e5f7ed] dark:bg-emerald-950/50 text-[#009966] dark:text-emerald-400 flex items-center justify-center border border-[#009966]/20 dark:border-emerald-800/60 shrink-0">
            <Radio size={22} className="animate-pulse" />
          </div>
        </div>

        {/* Website (Desktop) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              WEBSITE (DESKTOP)
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-sky-600 dark:text-sky-400">
                {totalDesktop}
              </span>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Pengguna</span>
            </div>
            <span className="text-[11px] text-sky-600 dark:text-sky-400 font-medium block">
              • Browser Web Dashboard
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-200 dark:border-sky-800 shrink-0">
            <Monitor size={22} />
          </div>
        </div>

        {/* Mobile App */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              APLIKASI MOBILE
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {totalMobile}
              </span>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Perangkat</span>
            </div>
            <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium block">
              • Android / iOS Mobile App
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800 shrink-0">
            <Smartphone size={22} />
          </div>
        </div>

        {/* Shutdown Log KPI */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              LOG SESSION SHUTDOWN
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
                {shutdownLogs.length}
              </span>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Sesi</span>
            </div>
            <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium block">
              • Sesi Di-Terminate Paksa
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-800 shrink-0">
            <ShieldAlert size={22} />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Table Header Filter Toolbar */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-50/50 via-white to-white dark:from-slate-800/40 dark:via-slate-900 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 flex items-center justify-center border border-emerald-200/60 dark:border-emerald-800/60 shrink-0">
              <UserCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                  Daftar Pengguna Online
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#009966] animate-ping" />
                  {filteredUsers.length} TERHUBUNG
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                {isPrivilegedUser
                  ? "Klik tombol Shutdown untuk menghentikan sesi dan menghapus token dari server."
                  : "Daftar seluruh akun pengguna yang sedang memiliki sesi aktif di platform."}
              </p>
            </div>
          </div>

          {/* Filters & Search Input Single-Row Container */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
            {/* Search Input */}
            <div className="relative w-full sm:w-56 md:w-64">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
              />
              <input
                type="text"
                placeholder="Cari nama, HP, role..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#009966] focus:bg-white dark:focus:bg-slate-800 transition-all"
              />
            </div>

            {/* Role Filter Dropdown */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
              <Filter size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="dark:bg-slate-800">Semua Peran (Roles)</option>
                {uniqueRoles.map((r) => (
                  <option key={r} value={r} className="dark:bg-slate-800">
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Device Filter Pills */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
              {(["ALL", "DESKTOP", "MOBILE"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    setDeviceFilter(f);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                    deviceFilter === f
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  {f === "DESKTOP" && <Monitor size={12} />}
                  {f === "MOBILE" && <Smartphone size={12} />}
                  {f === "ALL" ? "Semua" : f === "DESKTOP" ? "Desktop" : "Mobile"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse table-auto">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/80 text-[10px] font-black uppercase text-slate-400 dark:text-slate-400 tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-3.5 px-4 text-center w-12">NO</th>
                <th className="py-3.5 px-4">NAMA LENGKAP</th>
                <th className="py-3.5 px-4">NOMOR HP</th>
                <th className="py-3.5 px-4">IDENTIFIER / ID</th>
                <th className="py-3.5 px-4">PERANGKAT (DEVICE)</th>
                <th className="py-3.5 px-4">PERAN / ROLE</th>
                <th className="py-3.5 px-4">WAKTU LOGIN</th>
                {isPrivilegedUser && (
                  <th className="py-3.5 px-4 text-center w-28">AKSI SHUTDOWN</th>
                )}
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td
                    colSpan={isPrivilegedUser ? 8 : 7}
                    className="py-14 text-center text-slate-400 dark:text-slate-500 font-medium"
                  >
                    <Loader2
                      size={26}
                      className="mx-auto mb-2 animate-spin text-[#009966] dark:text-emerald-400"
                    />
                    <span className="text-xs">Memuat data pengguna online...</span>
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={isPrivilegedUser ? 8 : 7}
                    className="py-14 text-center text-slate-400 dark:text-slate-500 font-medium"
                  >
                    <Globe size={34} className="mx-auto mb-2 opacity-30 text-slate-400 dark:text-slate-600" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      {searchQuery || deviceFilter !== "ALL" || roleFilter !== "ALL"
                        ? "Tidak ada sesi pengguna yang cocok dengan kriteria filter."
                        : "Belum ada pengguna yang sedang login saat ini."}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((userItem, idx) => {
                  const isMob = userItem.device.toLowerCase().includes("mobile");
                  return (
                    <tr
                      key={userItem.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group align-middle"
                    >
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400 dark:text-slate-500">
                        {(currentPage - 1) * rowsPerPage + idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8.5 h-8.5 rounded-xl bg-[#e5f7ed] dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 font-black text-xs flex items-center justify-center border border-emerald-200 dark:border-emerald-800 shrink-0">
                            {userItem.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-[#009966] dark:group-hover:text-emerald-400 transition-colors block text-xs">
                              {userItem.name}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                              ID: {userItem.id.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400 font-medium">
                        {userItem.phone || "-"}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {userItem.identifier}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {isMob ? (
                            <Smartphone size={12} className="text-indigo-500 dark:text-indigo-400 shrink-0" />
                          ) : (
                            <Monitor size={12} className="text-sky-500 dark:text-sky-400 shrink-0" />
                          )}
                          {userItem.device}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-md text-[9.5px] font-black uppercase tracking-wider border ${getRoleBadgeStyle(
                            userItem.role
                          )}`}
                        >
                          {userItem.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 font-medium text-xs">
                          <Clock size={12} className="text-slate-400 dark:text-slate-500 shrink-0" />
                          {fmtTime(userItem.loginTime)}
                        </span>
                      </td>
                      {isPrivilegedUser && (
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleOpenShutdownModal(userItem)}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white transition-all inline-flex items-center justify-center gap-1 font-extrabold text-[10px] cursor-pointer border border-rose-200 dark:border-rose-800 hover:shadow-xs active:scale-95"
                            title="Paksa Logout Pengguna Ini"
                          >
                            <Power size={12} className="shrink-0 animate-pulse" />
                            <span>Shutdown</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/50">
          <div>
            Menampilkan{" "}
            <span className="text-slate-900 dark:text-slate-100 font-bold">
              {paginatedUsers.length > 0
                ? (currentPage - 1) * rowsPerPage + 1
                : 0}
            </span>
            –
            <span className="text-slate-900 dark:text-slate-100 font-bold">
              {Math.min(currentPage * rowsPerPage, filteredUsers.length)}
            </span>{" "}
            dari <span className="text-slate-900 dark:text-slate-100 font-bold">{filteredUsers.length}</span> sesi aktif
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span>Tampilkan:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-bold focus:outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg font-extrabold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                &lt;
              </button>
              <span className="px-3 py-1 bg-[#009966] text-white rounded-lg font-black font-mono">
                {currentPage}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg font-extrabold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                &gt;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Terminal-style Audit Logs */}
      {shutdownLogs.length > 0 && (
        <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <History size={18} className="text-rose-400" />
              <h3 className="font-extrabold text-sm text-white">
                Riwayat Sesi Diputus (Audit Log)
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-950/80 border border-rose-800 px-2.5 py-0.5 rounded-full">
              {shutdownLogs.length} EVENT
            </span>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {shutdownLogs.map((log) => (
              <div
                key={log.id}
                className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80 flex items-center justify-between text-xs gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold shrink-0 border border-rose-500/30">
                    <Power size={15} />
                  </div>
                  <div>
                    <span className="font-extrabold text-white block">
                      {log.userName}{" "}
                      <span className="text-[10px] font-normal text-slate-400">
                        ({log.userRole})
                      </span>
                    </span>
                    <span className="text-[11px] text-rose-300 font-medium">
                      Alasan: {log.reason}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-400 shrink-0">
                  {log.timestamp}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shutdown Confirmation Modal */}
      {targetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className={`w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden relative ${
              shakeModal ? "animate-bounce" : ""
            }`}
          >
            <div className="bg-gradient-to-r from-rose-600 to-red-600 p-5 flex items-center justify-between relative overflow-hidden">
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-11 h-11 rounded-2xl bg-white text-rose-600 flex items-center justify-center font-black shadow-lg animate-pulse">
                  <ShieldAlert size={26} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base text-white tracking-tight uppercase">
                      SHUTDOWN SESI PAKSA
                    </h3>
                    <span className="bg-white/20 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded border border-white/30">
                      ADMIN ACTION
                    </span>
                  </div>
                  <p className="text-xs text-rose-100 font-medium">
                    Token Refresh dihapus dari server database
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTargetUser(null)}
                className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors cursor-pointer relative z-10"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/70 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider block">
                  TARGET PENGGUNA:
                </span>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-red-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                      {targetUser.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">{targetUser.name}</h4>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
                        <span>{targetUser.phone}</span>
                        <span>•</span>
                        <span className="text-rose-600 dark:text-rose-400 font-bold">{targetUser.identifier}</span>
                      </div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                    {targetUser.role}
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
                  ALASAN SHUTDOWN:
                </label>
                <select
                  value={shutdownReason}
                  onChange={(e) => setShutdownReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:bg-white dark:focus:bg-slate-800 transition-colors cursor-pointer"
                >
                  <option value="🚨 Sesi Inaktif / Idle Timeout (>30 mnt)" className="dark:bg-slate-800">
                    🚨 Sesi Inaktif / Idle Timeout (&gt;30 mnt)
                  </option>
                  <option value="🛡️ Indikasi Pelanggaran Keamanan / Multi-login" className="dark:bg-slate-800">
                    🛡️ Indikasi Pelanggaran Keamanan / Multi-login
                  </option>
                  <option value="⚙️ Pemeliharaan Akun Administrator" className="dark:bg-slate-800">
                    ⚙️ Pemeliharaan Akun Administrator
                  </option>
                  <option value="🔒 Paksa Reset Kredensial Pengguna" className="dark:bg-slate-800">
                    🔒 Paksa Reset Kredensial Pengguna
                  </option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
                  CATATAN TAMBAHAN (OPSIONAL):
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Sesi ditinggalkan di perangkat umum..."
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:bg-white dark:focus:bg-slate-800 transition-colors"
                />
              </div>
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300">
                <AlertTriangle size={18} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong className="text-rose-900 dark:text-rose-200">Peringatan:</strong> Seluruh Refresh Token
                  pengguna akan dihapus dari database. Pengguna diminta login ulang.
                </p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <button
                onClick={() => setTargetUser(null)}
                disabled={isTerminating}
                className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmShutdown}
                disabled={isTerminating}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {isTerminating ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>MENGHAPUS SESI...</span>
                  </>
                ) : (
                  <>
                    <Power size={15} />
                    <span>TERMINATE SEKARANG</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PenggunaOnline;
