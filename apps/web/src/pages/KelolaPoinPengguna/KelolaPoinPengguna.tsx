/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Coins,
  Search,
  RefreshCw,
  Plus,
  Minus,
  Sliders,
  User,
  X,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit3,
  ShieldAlert,
  Sparkles,
  Layers,
  TrendingUp,
  TrendingDown,
  Activity,
  CheckSquare,
  Square,
  FileSpreadsheet,
  MapPin,
  GraduationCap,
  Target,
  History,
  RotateCcw,
} from "lucide-react";
import api from "../../services/api";
import showToast from "../../utils/showToast";

interface UserPointItem {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  fotoProfil: string | null;
  createdAt: string;
  role: string;
  roleId?: number;
  rw: string | null;
  rwId: number | null;
  kelurahan: string | null;
  kelurahanId: string | null;
  nim: string | null;
  jurusan: string | null;
  kelompok: string | null;
  totalPoints: number;
  transactionCount: number;
  lastTransactionAt: string | null;
}

interface StatsData {
  totalPointsInCirculation: number;
  totalPositivePoints: number;
  totalNegativePoints: number;
  totalTransactions: number;
  totalUsersCount: number;
  uniqueUsersWithPoints: number;
  averagePointsPerUser: number;
  last30DaysTransactions: number;
  last30DaysPoints: number;
  topUser: {
    id: string;
    name: string;
    role: string;
    points: number;
  } | null;
}

interface LedgerTransaction {
  id: string;
  userId: string;
  userName: string;
  userEmail: string | null;
  userPhone: string | null;
  userRole: string;
  points: number;
  description: string;
  kategori: string;
  redeemable: boolean;
  createdAt: string;
}

export const KelolaPoinPengguna: React.FC = () => {
  // Active Main Tab: 'users' (Direktori Saldo Pengguna) vs 'ledger' (Buku Besar Global)
  const [activeTab, setActiveTab] = useState<"users" | "ledger">("users");

  // Loading States
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingLedger, setLoadingLedger] = useState(false);

  // Data States
  const [users, setUsers] = useState<UserPointItem[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [ledgerFeed, setLedgerFeed] = useState<LedgerTransaction[]>([]);

  // Pagination for Users Tab
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Pagination for Global Ledger Tab
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerLimit, setLedgerLimit] = useState(15);
  const [ledgerTotalPages, setLedgerTotalPages] = useState(1);
  const [ledgerTotalRecords, setLedgerTotalRecords] = useState(0);

  // Filters State
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("ALL");
  const [pointRangePreset, setPointRangePreset] = useState("ALL");
  const [sortBy, setSortBy] = useState<"totalPoints" | "name" | "createdAt" | "lastTransactionAt">("totalPoints");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Ledger Specific Filters
  const [ledgerSearch, setLedgerSearch] = useState("");
  const [ledgerCategory, setLedgerCategory] = useState("ALL");
  const [ledgerType, setLedgerType] = useState<"all" | "positive" | "negative">("all");

  // Selection for Bulk Action
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Modals & Drawers State
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [setBalanceModalOpen, setSetBalanceModalOpen] = useState(false);
  const [bulkAdjustModalOpen, setBulkAdjustModalOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [editTxModalOpen, setEditTxModalOpen] = useState(false);
  const [voidTxModalOpen, setVoidTxModalOpen] = useState(false);

  // Target User / Transaction for Modals
  const [targetUser, setTargetUser] = useState<UserPointItem | null>(null);
  const [userDetailLedger, setUserDetailLedger] = useState<any | null>(null);
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);
  const [targetTransaction, setTargetTransaction] = useState<LedgerTransaction | null>(null);

  // Form States for Adjust Modal
  const [adjustType, setAdjustType] = useState<"add" | "deduct">("add");
  const [adjustAmount, setAdjustAmount] = useState<number>(50);
  const [adjustCategory, setAdjustCategory] = useState("MANUAL_ADJUSTMENT");
  const [adjustDescription, setAdjustDescription] = useState("");
  const [adjustSendNotification, setAdjustSendNotification] = useState(true);
  const [submittingAction, setSubmittingAction] = useState(false);

  // Form States for Set Exact Balance Modal
  const [targetBalanceValue, setTargetBalanceValue] = useState<number>(0);
  const [setBalanceReason, setSetBalanceReason] = useState("");

  // Form States for Edit & Void Transaction
  const [editTxDesc, setEditTxDesc] = useState("");
  const [editTxCat, setEditTxCat] = useState("");
  const [voidReason, setVoidReason] = useState("");

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch Stats
  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const res = await api.get("/points/admin/stats");
      if (res.data?.success) {
        setStats(res.data.data);
      }
    } catch (err: any) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch Users Point Directory
  const fetchUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      let minPoints: number | undefined = undefined;
      let maxPoints: number | undefined = undefined;

      if (pointRangePreset === "ZERO") {
        minPoints = 0;
        maxPoints = 0;
      } else if (pointRangePreset === "1-100") {
        minPoints = 1;
        maxPoints = 100;
      } else if (pointRangePreset === "101-500") {
        minPoints = 101;
        maxPoints = 500;
      } else if (pointRangePreset === "GT_500") {
        minPoints = 501;
      }

      const res = await api.get("/points/admin/users", {
        params: {
          page,
          limit,
          search: debouncedSearch,
          role: selectedRole,
          sortBy,
          sortOrder,
          minPoints,
          maxPoints,
        },
      });

      if (res.data?.success) {
        setUsers(res.data.data.users);
        setTotalPages(res.data.data.pagination.totalPages);
        setTotalRecords(res.data.data.pagination.total);
      }
    } catch (err: any) {
      showToast.error("Gagal memuat direktori poin pengguna");
    } finally {
      setLoadingUsers(false);
    }
  }, [page, limit, debouncedSearch, selectedRole, sortBy, sortOrder, pointRangePreset]);

  // Fetch Global Ledger Feed
  const fetchLedger = useCallback(async () => {
    try {
      setLoadingLedger(true);
      const res = await api.get("/points/admin/ledger", {
        params: {
          page: ledgerPage,
          limit: ledgerLimit,
          search: ledgerSearch,
          kategori: ledgerCategory,
          type: ledgerType,
        },
      });

      if (res.data?.success) {
        setLedgerFeed(res.data.data.transactions);
        setLedgerTotalPages(res.data.data.pagination.totalPages);
        setLedgerTotalRecords(res.data.data.pagination.total);
      }
    } catch (err: any) {
      showToast.error("Gagal memuat riwayat mutasi buku besar");
    } finally {
      setLoadingLedger(false);
    }
  }, [ledgerPage, ledgerLimit, ledgerSearch, ledgerCategory, ledgerType]);

  // Initial Load
  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    } else {
      fetchLedger();
    }
  }, [activeTab, fetchUsers, fetchLedger]);

  // Handle Quick Adjust Open
  const handleOpenAdjustModal = (item: UserPointItem, defaultType: "add" | "deduct" = "add") => {
    setTargetUser(item);
    setAdjustType(defaultType);
    setAdjustAmount(50);
    setAdjustCategory("MANUAL_ADJUSTMENT");
    setAdjustDescription(defaultType === "add" ? "Bonus penyesuaian poin oleh Developer" : "Koreksi pengurangan poin oleh Developer");
    setAdjustSendNotification(true);
    setAdjustModalOpen(true);
  };

  // Handle Set Exact Balance Open
  const handleOpenSetBalanceModal = (item: UserPointItem) => {
    setTargetUser(item);
    setTargetBalanceValue(item.totalPoints);
    setSetBalanceReason("Kalibrasi saldo poin manual oleh Developer");
    setSetBalanceModalOpen(true);
  };

  // Handle Detail Ledger Open
  const handleOpenDetailDrawer = async (item: UserPointItem) => {
    setTargetUser(item);
    setDetailDrawerOpen(true);
    setLoadingUserDetail(true);
    try {
      const res = await api.get(`/points/admin/user/${item.id}`);
      if (res.data?.success) {
        setUserDetailLedger(res.data.data);
      }
    } catch (err) {
      showToast.error("Gagal memuat detail buku besar user");
    } finally {
      setLoadingUserDetail(false);
    }
  };

  // Handle Submit Adjust
  const handleSubmitAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser) return;
    if (!adjustDescription.trim()) {
      showToast.error("Keterangan/alasan perubahan wajib diisi!");
      return;
    }
    if (adjustAmount <= 0) {
      showToast.error("Nominal poin harus lebih besar dari 0!");
      return;
    }

    const appliedPoints = adjustType === "add" ? Math.abs(adjustAmount) : -Math.abs(adjustAmount);

    setSubmittingAction(true);
    try {
      const res = await api.post("/points/admin/adjust", {
        userId: targetUser.id,
        points: appliedPoints,
        kategori: adjustCategory,
        description: adjustDescription.trim(),
        sendNotification: adjustSendNotification,
      });

      if (res.data?.success) {
        showToast.success(res.data.message || "Poin berhasil disesuaikan!");
        setAdjustModalOpen(false);
        fetchUsers();
        fetchStats();
        if (detailDrawerOpen && targetUser.id) {
          handleOpenDetailDrawer(targetUser);
        }
      }
    } catch (err: any) {
      showToast.error(err.response?.data?.message || "Gagal menyesuaikan poin");
    } finally {
      setSubmittingAction(false);
    }
  };

  // Handle Submit Set Balance
  const handleSubmitSetBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser) return;
    if (isNaN(Number(targetBalanceValue))) {
      showToast.error("Target saldo harus berupa angka valid!");
      return;
    }

    setSubmittingAction(true);
    try {
      const res = await api.post("/points/admin/set-balance", {
        userId: targetUser.id,
        targetBalance: Number(targetBalanceValue),
        description: setBalanceReason.trim(),
        sendNotification: true,
      });

      if (res.data?.success) {
        showToast.success(res.data.message || "Saldo berhasil dikalibrasi!");
        setSetBalanceModalOpen(false);
        fetchUsers();
        fetchStats();
      }
    } catch (err: any) {
      showToast.error(err.response?.data?.message || "Gagal mengkalibrasi saldo");
    } finally {
      setSubmittingAction(false);
    }
  };

  // Handle Submit Bulk Adjust
  const handleSubmitBulkAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserIds.length === 0) return;
    if (!adjustDescription.trim()) {
      showToast.error("Keterangan perubahan massal wajib diisi!");
      return;
    }

    const appliedPoints = adjustType === "add" ? Math.abs(adjustAmount) : -Math.abs(adjustAmount);

    setSubmittingAction(true);
    try {
      const res = await api.post("/points/admin/bulk-adjust", {
        userIds: selectedUserIds,
        points: appliedPoints,
        kategori: adjustCategory,
        description: adjustDescription.trim(),
        sendNotification: adjustSendNotification,
      });

      if (res.data?.success) {
        showToast.success(res.data.message || "Penyesuaian poin massal berhasil!");
        setBulkAdjustModalOpen(false);
        setSelectedUserIds([]);
        fetchUsers();
        fetchStats();
      }
    } catch (err: any) {
      showToast.error(err.response?.data?.message || "Gagal memproses penyesuaian massal");
    } finally {
      setSubmittingAction(false);
    }
  };

  // Handle Edit Transaction Submit
  const handleSubmitEditTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTransaction) return;

    setSubmittingAction(true);
    try {
      const res = await api.put(`/points/admin/transaction/${targetTransaction.id}`, {
        description: editTxDesc.trim(),
        kategori: editTxCat.trim(),
      });

      if (res.data?.success) {
        showToast.success("Transaksi berhasil diperbarui!");
        setEditTxModalOpen(false);
        if (activeTab === "ledger") fetchLedger();
        if (targetUser) handleOpenDetailDrawer(targetUser);
      }
    } catch (err: any) {
      showToast.error(err.response?.data?.message || "Gagal memperbarui transaksi");
    } finally {
      setSubmittingAction(false);
    }
  };

  // Handle Void Transaction Submit
  const handleSubmitVoidTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTransaction) return;
    if (!voidReason.trim()) {
      showToast.error("Alasan pembatalan transaksi wajib diisi!");
      return;
    }

    setSubmittingAction(true);
    try {
      const res = await api.delete(`/points/admin/transaction/${targetTransaction.id}`, {
        data: { reason: voidReason.trim() },
      });

      if (res.data?.success) {
        showToast.success("Transaksi berhasil dibatalkan (reversal tercatat)!");
        setVoidTxModalOpen(false);
        fetchStats();
        if (activeTab === "ledger") fetchLedger();
        if (targetUser) handleOpenDetailDrawer(targetUser);
      }
    } catch (err: any) {
      showToast.error(err.response?.data?.message || "Gagal membatalkan transaksi");
    } finally {
      setSubmittingAction(false);
    }
  };

  // Toggle Row Selection
  const toggleSelectUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Toggle Select All Visible
  const toggleSelectAll = () => {
    if (selectedUserIds.length === users.length && users.length > 0) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(users.map((u) => u.id));
    }
  };

  // Export Data to CSV
  const handleExportCSV = () => {
    if (users.length === 0) {
      showToast.error("Tidak ada data untuk diekspor");
      return;
    }

    const headers = ["ID", "Nama", "Email", "Telepon", "Peran", "Wilayah", "Total Poin", "Jumlah Transaksi", "Terakhir Aktif"];
    const rows = users.map((u) => [
      u.id,
      `"${u.name}"`,
      `"${u.email || ""}"`,
      `"${u.phone || ""}"`,
      u.role,
      `"${u.rw ? `${u.rw}, ${u.kelurahan || ""}` : u.kelompok || ""}"`,
      u.totalPoints,
      u.transactionCount,
      `"${u.lastTransactionAt ? new Date(u.lastTransactionAt).toLocaleString("id-ID") : "-"}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Data_Poin_Pengguna_Berseka_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast.success("Data poin berhasil diekspor ke CSV!");
  };

  // Helper Badge Color
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "WARGA":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800";
      case "MAHASISWA_KKN":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800";
      case "PETUGAS_RESIDU":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800";
      case "RW":
        return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800";
      case "DPL":
        return "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
    }
  };

  // Helper Level / Rank Tier
  const getPointTier = (points: number) => {
    if (points >= 1000) return { label: "Pahlawan Bumi 🌟", color: "text-amber-600 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300" };
    if (points >= 500) return { label: "Pejuang Hijau 🥇", color: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300" };
    if (points >= 200) return { label: "Warga Sadar 🥈", color: "text-blue-700 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-300" };
    if (points > 0) return { label: "Pemula Pilah 🌱", color: "text-teal-700 bg-teal-50 dark:bg-teal-950/60 dark:text-teal-300" };
    return { label: "Belum Ada Poin", color: "text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400" };
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      {/* 1. Header Section */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200/80 dark:border-emerald-700/60 flex items-center justify-center text-[#035941] dark:text-emerald-400 shadow-2xs">
                <Coins size={22} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                  Kelola Poin Pengguna
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800">
                    <ShieldAlert size={12} className="mr-1" />
                    Developer Only
                  </span>
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Kontrol buku besar, kalibrasi saldo, penyesuaian bonus/penalti massal, dan audit mutasi poin seluruh pengguna.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={() => {
                fetchStats();
                if (activeTab === "users") fetchUsers();
                else fetchLedger();
                showToast.success("Data berhasil disegarkan");
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center gap-2 shadow-2xs cursor-pointer"
            >
              <RefreshCw size={14} className={loadingUsers || loadingLedger ? "animate-spin" : ""} />
              Segarkan
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#035941] hover:bg-[#02402f] text-white transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <FileSpreadsheet size={14} />
              Ekspor CSV
            </button>
          </div>
        </div>
      </div>

      {/* 2. Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Poin Beredar */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Poin Beredar
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-[#035941] dark:text-emerald-400 flex items-center justify-center">
              <Coins size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {loadingStats ? "..." : (stats?.totalPointsInCirculation || 0).toLocaleString("id-ID")}
            </span>
            <span className="text-xs font-bold text-emerald-600">Poin Aktif</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Dari {loadingStats ? "..." : (stats?.uniqueUsersWithPoints || 0)} akun yang memiliki saldo
          </p>
        </div>

        {/* Card 2: Mutasi Inflow vs Outflow */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Arus Mutasi Poin
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Activity size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex items-center gap-1 text-emerald-600 font-bold text-sm">
              <TrendingUp size={14} />+{(stats?.totalPositivePoints || 0).toLocaleString("id-ID")}
            </div>
            <div className="flex items-center gap-1 text-rose-600 font-bold text-sm">
              <TrendingDown size={14} />-{(stats?.totalNegativePoints || 0).toLocaleString("id-ID")}
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Total {loadingStats ? "..." : (stats?.totalTransactions || 0).toLocaleString("id-ID")} transaksi tercatat
          </p>
        </div>

        {/* Card 3: Rata-rata per User */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Rata-rata Poin Akun
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Sliders size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {loadingStats ? "..." : (stats?.averagePointsPerUser || 0).toLocaleString("id-ID")}
            </span>
            <span className="text-xs font-bold text-slate-500">Poin / Pengguna</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Berdasarkan akun aktif bertransaksi
          </p>
        </div>

        {/* Card 4: Top Earner */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Poin Tertinggi Saat Ini
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Sparkles size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100 truncate max-w-[180px]">
              {loadingStats ? "..." : (stats?.topUser?.points || 0).toLocaleString("id-ID")}
            </span>
            <span className="text-xs font-bold text-amber-600">Poin</span>
          </div>
          <p className="text-[11px] text-slate-500 truncate mt-1">
            {stats?.topUser ? `${stats.topUser.name} (${stats.topUser.role})` : "Belum ada peraih poin"}
          </p>
        </div>
      </div>

      {/* 3. Main Dual-View Tab Controls */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "users"
              ? "bg-[#035941] text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <User size={15} />
          Direktori Saldo Pengguna
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white font-black">
            {totalRecords}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("ledger")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "ledger"
              ? "bg-[#035941] text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <History size={15} />
          Buku Besar Global (Live Feed)
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white font-black">
            {ledgerTotalRecords}
          </span>
        </button>
      </div>

      {/* 4. Tab 1: Direktori Pengguna */}
      {activeTab === "users" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search */}
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari Nama, Email, WA, NIM..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#035941]/20 focus:border-[#035941]"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Role Filter */}
              <div>
                <select
                  value={selectedRole}
                  onChange={(e) => {
                    setSelectedRole(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#035941]/20"
                >
                  <option value="ALL">Semua Peran (Role)</option>
                  <option value="WARGA">Warga</option>
                  <option value="MAHASISWA_KKN">Mahasiswa KKN</option>
                  <option value="PETUGAS_RESIDU">Petugas Pemilah/Residu</option>
                  <option value="RW">Rukun Warga (RW)</option>
                  <option value="DPL">DPL</option>
                  <option value="ADMIN_DLH">Admin DLH</option>
                  <option value="LURAH">Lurah</option>
                  <option value="CAMAT">Camat</option>
                </select>
              </div>

              {/* Saldo Range Filter */}
              <div>
                <select
                  value={pointRangePreset}
                  onChange={(e) => {
                    setPointRangePreset(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#035941]/20"
                >
                  <option value="ALL">Semua Rentang Saldo</option>
                  <option value="ZERO">Saldo Nol (0 Poin)</option>
                  <option value="1-100">1 - 100 Poin</option>
                  <option value="101-500">101 - 500 Poin</option>
                  <option value="GT_500">&gt; 500 Poin (Tinggi)</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [sb, so] = e.target.value.split("-") as [any, any];
                    setSortBy(sb);
                    setSortOrder(so);
                    setPage(1);
                  }}
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#035941]/20"
                >
                  <option value="totalPoints-desc">Poin Tertinggi (Terbanyak)</option>
                  <option value="totalPoints-asc">Poin Terendah (Sedikit)</option>
                  <option value="name-asc">Nama Pengguna (A - Z)</option>
                  <option value="name-desc">Nama Pengguna (Z - A)</option>
                  <option value="lastTransactionAt-desc">Mutasi Terakhir (Terbaru)</option>
                  <option value="createdAt-desc">Pendaftaran Akun Baru</option>
                </select>
              </div>
            </div>

            {/* Quick Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px]">
              <span className="text-slate-400 font-bold mr-1">Filter Cepat:</span>
              <button
                onClick={() => {
                  setSelectedRole("ALL");
                  setPointRangePreset("ALL");
                  setSearch("");
                }}
                className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  selectedRole === "ALL" && pointRangePreset === "ALL" && !search
                    ? "bg-[#035941] text-white border-[#035941]"
                    : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                }`}
              >
                Semua User
              </button>

              <button
                onClick={() => {
                  setSelectedRole("WARGA");
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  selectedRole === "WARGA"
                    ? "bg-emerald-700 text-white border-emerald-700"
                    : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                }`}
              >
                Khusus Warga
              </button>

              <button
                onClick={() => {
                  setSelectedRole("MAHASISWA_KKN");
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  selectedRole === "MAHASISWA_KKN"
                    ? "bg-blue-700 text-white border-blue-700"
                    : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                }`}
              >
                Mahasiswa KKN
              </button>

              <button
                onClick={() => {
                  setPointRangePreset("GT_500");
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  pointRangePreset === "GT_500"
                    ? "bg-amber-600 text-white border-amber-600"
                    : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                }`}
              >
                Poin &gt; 500
              </button>

              <button
                onClick={() => {
                  setPointRangePreset("ZERO");
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  pointRangePreset === "ZERO"
                    ? "bg-rose-700 text-white border-rose-700"
                    : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                }`}
              >
                Saldo Nol (0)
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-black tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5 w-10 text-center">
                      <button
                        onClick={toggleSelectAll}
                        className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      >
                        {selectedUserIds.length === users.length && users.length > 0 ? (
                          <CheckSquare size={16} className="text-[#035941]" />
                        ) : (
                          <Square size={16} />
                        )}
                      </button>
                    </th>
                    <th className="p-3.5">Pengguna</th>
                    <th className="p-3.5">Peran</th>
                    <th className="p-3.5">Wilayah / Afiliasi</th>
                    <th className="p-3.5 text-right">Saldo Poin</th>
                    <th className="p-3.5 text-center">Mutasi</th>
                    <th className="p-3.5">Terakhir Aktif</th>
                    <th className="p-3.5 text-center">Aksi Developer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loadingUsers ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="p-4 text-center"><div className="w-4 h-4 bg-slate-200 dark:bg-slate-800 rounded mx-auto" /></td>
                        <td className="p-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-32" /></td>
                        <td className="p-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16" /></td>
                        <td className="p-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24" /></td>
                        <td className="p-4 text-right"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16 ml-auto" /></td>
                        <td className="p-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-8 mx-auto" /></td>
                        <td className="p-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20" /></td>
                        <td className="p-4"><div className="h-7 bg-slate-200 dark:bg-slate-800 rounded w-24 mx-auto" /></td>
                      </tr>
                    ))
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-slate-500">
                        <div className="max-w-sm mx-auto space-y-2">
                          <Coins size={36} className="mx-auto text-slate-300 dark:text-slate-600" />
                          <p className="font-bold text-sm text-slate-700 dark:text-slate-300">Tidak ada data pengguna yang cocok</p>
                          <p className="text-xs text-slate-400">Coba ubah kata kunci pencarian atau reset filter di atas.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    users.map((item) => {
                      const tier = getPointTier(item.totalPoints);
                      const isChecked = selectedUserIds.includes(item.id);
                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                            isChecked ? "bg-emerald-50/40 dark:bg-emerald-950/20" : ""
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="p-3.5 text-center">
                            <button
                              onClick={() => toggleSelectUser(item.id)}
                              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                            >
                              {isChecked ? (
                                <CheckSquare size={16} className="text-[#035941]" />
                              ) : (
                                <Square size={16} />
                              )}
                            </button>
                          </td>

                          {/* Pengguna */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                                {item.fotoProfil ? (
                                  <img src={item.fotoProfil} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                  <User size={14} className="text-slate-400" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 dark:text-slate-100 truncate">{item.name}</p>
                                <p className="text-[10.5px] text-slate-500 truncate flex items-center gap-1.5">
                                  {item.phone && <span>{item.phone}</span>}
                                  {item.phone && item.email && <span>•</span>}
                                  {item.email && <span className="truncate">{item.email}</span>}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Peran */}
                          <td className="p-3.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-bold border ${getRoleBadge(item.role)}`}>
                              {item.role}
                            </span>
                          </td>

                          {/* Wilayah / Kelompok */}
                          <td className="p-3.5">
                            {item.rw ? (
                              <div className="space-y-0.5">
                                <p className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                  <MapPin size={11} className="text-[#035941]" />
                                  {item.rw}
                                </p>
                                {item.kelurahan && <p className="text-[10px] text-slate-400">{item.kelurahan}</p>}
                              </div>
                            ) : item.kelompok ? (
                              <div className="space-y-0.5">
                                <p className="font-medium text-blue-700 dark:text-blue-400 flex items-center gap-1">
                                  <GraduationCap size={11} />
                                  {item.kelompok}
                                </p>
                                {item.nim && <p className="text-[10px] text-slate-400">NIM: {item.nim}</p>}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">-</span>
                            )}
                          </td>

                          {/* Saldo Poin */}
                          <td className="p-3.5 text-right">
                            <div className="flex flex-col items-end gap-0.5">
                              <span className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">
                                {item.totalPoints.toLocaleString("id-ID")}
                              </span>
                              <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[9.5px] font-bold ${tier.color}`}>
                                {tier.label}
                              </span>
                            </div>
                          </td>

                          {/* Mutasi */}
                          <td className="p-3.5 text-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {item.transactionCount}x
                            </span>
                          </td>

                          {/* Terakhir Aktif */}
                          <td className="p-3.5 text-slate-600 dark:text-slate-400 text-[11px]">
                            {item.lastTransactionAt ? (
                              <div className="space-y-0.5">
                                <p>{new Date(item.lastTransactionAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</p>
                                <p className="text-[10px] text-slate-400">{new Date(item.lastTransactionAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</p>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Belum ada</span>
                            )}
                          </td>

                          {/* Aksi Developer */}
                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleOpenAdjustModal(item, "add")}
                                title="Tambah Poin (+)"
                                className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                              >
                                <Plus size={14} />
                              </button>

                              <button
                                onClick={() => handleOpenAdjustModal(item, "deduct")}
                                title="Kurangi Poin (-)"
                                className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                              >
                                <Minus size={14} />
                              </button>

                              <button
                                onClick={() => handleOpenSetBalanceModal(item)}
                                title="Set Saldo Pasti (Kalibrasi)"
                                className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                              >
                                <Target size={14} />
                              </button>

                              <button
                                onClick={() => handleOpenDetailDrawer(item)}
                                title="Lihat Riwayat Buku Besar Lengkap"
                                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                              >
                                <Eye size={14} />
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

            {/* Pagination Controls */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-500">
                <span>Baris per halaman:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span>
                  Menampilkan {users.length > 0 ? (page - 1) * limit + 1 : 0} -{" "}
                  {Math.min(page * limit, totalRecords)} dari {totalRecords} data
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loadingUsers}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1 text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <ChevronLeft size={14} />
                  Sebelumnya
                </button>

                <div className="flex items-center gap-1 px-2 font-bold text-slate-700 dark:text-slate-200">
                  Halaman {page} dari {totalPages || 1}
                </div>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || loadingUsers}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1 text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  Selanjutnya
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Tab 2: Buku Besar Global (Global Ledger Feed) */}
      {activeTab === "ledger" && (
        <div className="space-y-4">
          {/* Ledger Filter */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari keterangan mutasi atau nama..."
                value={ledgerSearch}
                onChange={(e) => {
                  setLedgerSearch(e.target.value);
                  setLedgerPage(1);
                }}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#035941]/20"
              />
            </div>

            <div>
              <select
                value={ledgerCategory}
                onChange={(e) => {
                  setLedgerCategory(e.target.value);
                  setLedgerPage(1);
                }}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
              >
                <option value="ALL">Semua Kategori Mutasi</option>
                <option value="REDUKSI_TONASE">Reduksi Tonase / Setoran</option>
                <option value="IDE_DAUR_ULANG">Ide Daur Ulang</option>
                <option value="MANUAL_ADJUSTMENT">Penyesuaian Manual Dev</option>
                <option value="SET_BALANCE">Kalibrasi Saldo</option>
                <option value="BULK_ADJUSTMENT">Penyesuaian Massal</option>
                <option value="REVERSAL">Reversal / Pembatalan</option>
              </select>
            </div>

            <div>
              <select
                value={ledgerType}
                onChange={(e) => {
                  setLedgerType(e.target.value as any);
                  setLedgerPage(1);
                }}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
              >
                <option value="all">Semua Tipe Mutasi</option>
                <option value="positive">Hanya Pemasukan (+ Poin)</option>
                <option value="negative">Hanya Pengeluaran / Potongan (- Poin)</option>
              </select>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-black tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5">Waktu Transaksi</th>
                    <th className="p-3.5">Pengguna</th>
                    <th className="p-3.5">Kategori</th>
                    <th className="p-3.5">Deskripsi / Keterangan</th>
                    <th className="p-3.5 text-right">Mutasi Poin</th>
                    <th className="p-3.5 text-center">Aksi Developer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loadingLedger ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="p-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24" /></td>
                        <td className="p-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-32" /></td>
                        <td className="p-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20" /></td>
                        <td className="p-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-48" /></td>
                        <td className="p-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16 ml-auto" /></td>
                        <td className="p-4"><div className="h-7 bg-slate-200 dark:bg-slate-800 rounded w-16 mx-auto" /></td>
                      </tr>
                    ))
                  ) : ledgerFeed.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-slate-500">
                        Tidak ada riwayat transaksi mutasi yang cocok.
                      </td>
                    </tr>
                  ) : (
                    ledgerFeed.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="p-3.5 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                          {new Date(tx.createdAt).toLocaleString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900 dark:text-slate-100">{tx.userName}</div>
                          <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[9.5px] font-bold border mt-0.5 ${getRoleBadge(tx.userRole)}`}>
                            {tx.userRole}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {tx.kategori}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-700 dark:text-slate-300 max-w-md">
                          {tx.description}
                        </td>
                        <td className="p-3.5 text-right font-black">
                          <span
                            className={`text-sm ${
                              tx.points >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {tx.points >= 0 ? `+${tx.points}` : tx.points}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setTargetTransaction(tx);
                                setEditTxDesc(tx.description);
                                setEditTxCat(tx.kategori);
                                setEditTxModalOpen(true);
                              }}
                              title="Edit Keterangan / Metadata"
                              className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 flex items-center justify-center cursor-pointer shadow-2xs"
                            >
                              <Edit3 size={13} />
                            </button>

                            <button
                              onClick={() => {
                                setTargetTransaction(tx);
                                setVoidReason("");
                                setVoidTxModalOpen(true);
                              }}
                              title="Batalkan / Void Transaksi (Reversal)"
                              className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 flex items-center justify-center cursor-pointer shadow-2xs"
                            >
                              <RotateCcw size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Ledger Pagination */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Menampilkan {(ledgerPage - 1) * ledgerLimit + 1} -{" "}
                {Math.min(ledgerPage * ledgerLimit, ledgerTotalRecords)} dari {ledgerTotalRecords} mutasi
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLedgerPage((p) => Math.max(1, p - 1))}
                  disabled={ledgerPage <= 1}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="font-bold">
                  {ledgerPage} / {ledgerTotalPages || 1}
                </span>
                <button
                  onClick={() => setLedgerPage((p) => Math.min(ledgerTotalPages, p + 1))}
                  disabled={ledgerPage >= ledgerTotalPages}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Floating Bulk Action Bar */}
      {selectedUserIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-900 text-xs font-black flex items-center justify-center">
              {selectedUserIds.length}
            </span>
            <span className="text-xs font-bold">Pengguna Terpilih</span>
          </div>

          <div className="h-4 w-px bg-slate-700" />

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setAdjustType("add");
                setAdjustAmount(50);
                setAdjustCategory("BULK_ADJUSTMENT");
                setAdjustDescription(`Bonus massal developer untuk ${selectedUserIds.length} pengguna`);
                setBulkAdjustModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus size={14} />
              Tambah Poin Massal
            </button>

            <button
              onClick={() => {
                setAdjustType("deduct");
                setAdjustAmount(50);
                setAdjustCategory("BULK_ADJUSTMENT");
                setAdjustDescription(`Pengurangan massal developer untuk ${selectedUserIds.length} pengguna`);
                setBulkAdjustModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Minus size={14} />
              Kurangi Poin Massal
            </button>

            <button
              onClick={() => setSelectedUserIds([])}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          MODAL 1: QUICK ADJUST POINTS (+ / -)
      ───────────────────────────────────────────── */}
      {adjustModalOpen && targetUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${adjustType === "add" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                  {adjustType === "add" ? <Plus size={18} /> : <Minus size={18} />}
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-slate-100 text-sm">
                    {adjustType === "add" ? "Tambah Poin Pengguna" : "Kurangi Poin Pengguna"}
                  </h3>
                  <p className="text-[11px] text-slate-500">Developer Point Adjustment</p>
                </div>
              </div>
              <button
                onClick={() => setAdjustModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            {/* Target User Info */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 text-xs">
                  {targetUser.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-100">{targetUser.name}</p>
                  <p className="text-[10px] text-slate-500">{targetUser.role} • {targetUser.rw || targetUser.kelompok || "Wilayah Belum Diset"}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Saldo Saat Ini</p>
                <p className="text-base font-black text-slate-900 dark:text-slate-100">{targetUser.totalPoints} Poin</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitAdjust} className="p-5 space-y-4">
              {/* Type Switcher */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                  Arah Penyesuaian
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType("add")}
                    className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      adjustType === "add"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <Plus size={14} /> Tambah (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType("deduct")}
                    className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      adjustType === "deduct"
                        ? "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <Minus size={14} /> Kurangi (-)
                  </button>
                </div>
              </div>

              {/* Nominal Input & Quick Presets */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                  Nominal Poin
                </label>
                <input
                  type="number"
                  min="1"
                  max="100000"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Number(e.target.value))}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm font-black bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#035941]/20"
                />

                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[10, 25, 50, 100, 250, 500].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAdjustAmount(preset)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border cursor-pointer ${
                        adjustAmount === preset
                          ? "bg-[#035941] text-white border-[#035941]"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {adjustType === "add" ? `+${preset}` : `-${preset}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Kategori */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                  Kategori Penyesuaian
                </label>
                <select
                  value={adjustCategory}
                  onChange={(e) => setAdjustCategory(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                >
                  <option value="MANUAL_ADJUSTMENT">Penyesuaian Manual Developer</option>
                  <option value="BONUS_EVENT">Bonus Event / Kegiatan Khusus</option>
                  <option value="REDUKSI_TONASE">Koreksi Timbangan Setoran</option>
                  <option value="IDE_DAUR_ULANG">Koreksi Ide Daur Ulang</option>
                  <option value="PENALTI_PELANGGARAN">Penalti Pelanggaran Ketentuan</option>
                </select>
              </div>

              {/* Alasan / Deskripsi */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                  Keterangan / Alasan (Wajib Audit Trail)
                </label>
                <textarea
                  rows={2}
                  value={adjustDescription}
                  onChange={(e) => setAdjustDescription(e.target.value)}
                  placeholder="Contoh: Bonus partisipasi simulasi pemilahan sampah organik..."
                  required
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#035941]/20"
                />
              </div>

              {/* Live Preview Calculation */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Perubahan Saldo</span>
                  <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
                    <span>{targetUser.totalPoints} Poin</span>
                    <span>→</span>
                    <span className={`font-black ${adjustType === "add" ? "text-emerald-600" : "text-rose-600"}`}>
                      {adjustType === "add"
                        ? targetUser.totalPoints + adjustAmount
                        : targetUser.totalPoints - adjustAmount}{" "}
                      Poin
                    </span>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={adjustSendNotification}
                    onChange={(e) => setAdjustSendNotification(e.target.checked)}
                    className="rounded text-[#035941]"
                  />
                  <span className="text-[11px] font-medium">Kirim Notifikasi FCM</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#035941] hover:bg-[#02402f] text-white transition-all flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {submittingAction ? "Menyimpan..." : "Simpan Penyesuaian"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          MODAL 2: SET EXACT BALANCE (KALIBRASI)
      ───────────────────────────────────────────── */}
      {setBalanceModalOpen && targetUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                  <Target size={18} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-slate-100 text-sm">Kalibrasi Saldo Pasti</h3>
                  <p className="text-[11px] text-slate-500">Set Exact Point Balance</p>
                </div>
              </div>
              <button
                onClick={() => setSetBalanceModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400"
              >
                <X size={16} />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
              <p className="font-bold text-slate-900 dark:text-slate-100">{targetUser.name}</p>
              <p className="text-slate-500">Saldo saat ini: <strong className="text-slate-900 dark:text-slate-100">{targetUser.totalPoints} Poin</strong></p>
            </div>

            <form onSubmit={handleSubmitSetBalance} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Target Saldo Baru yang Diinginkan
                </label>
                <input
                  type="number"
                  value={targetBalanceValue}
                  onChange={(e) => setTargetBalanceValue(Number(e.target.value))}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl text-base font-black bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
                <p className="text-[10.5px] text-slate-400 mt-1">
                  Selisih otomatis:{" "}
                  <strong className={targetBalanceValue - targetUser.totalPoints >= 0 ? "text-emerald-600" : "text-rose-600"}>
                    {targetBalanceValue - targetUser.totalPoints >= 0 ? `+${targetBalanceValue - targetUser.totalPoints}` : targetBalanceValue - targetUser.totalPoints} Poin
                  </strong>
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Catatan Kalibrasi
                </label>
                <input
                  type="text"
                  value={setBalanceReason}
                  onChange={(e) => setSetBalanceReason(e.target.value)}
                  placeholder="Alasan pengaturan ulang saldo..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSetBalanceModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-5 py-2 rounded-xl font-bold bg-[#035941] hover:bg-[#02402f] text-white transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {submittingAction ? "Menerapkan..." : "Terapkan Saldo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          MODAL 3: BULK ADJUST POINTS
      ───────────────────────────────────────────── */}
      {bulkAdjustModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                  <Layers size={18} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-slate-100 text-sm">
                    {adjustType === "add" ? "Tambah Poin Massal" : "Kurangi Poin Massal"}
                  </h3>
                  <p className="text-[11px] text-slate-500">Menerapkan perubahan ke {selectedUserIds.length} pengguna</p>
                </div>
              </div>
              <button onClick={() => setBulkAdjustModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitBulkAdjust} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Nominal per Pengguna</label>
                <input
                  type="number"
                  min="1"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Number(e.target.value))}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl font-black text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Keterangan / Alasan</label>
                <textarea
                  rows={2}
                  value={adjustDescription}
                  onChange={(e) => setAdjustDescription(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200/80 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-[11px]">
                Aksi ini akan mencatat mutasi <strong>{adjustType === "add" ? `+${adjustAmount}` : `-${adjustAmount}`} Poin</strong> ke {selectedUserIds.length} pengguna terpilih secara bersamaan.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setBulkAdjustModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-5 py-2.5 rounded-xl font-bold bg-[#035941] hover:bg-[#02402f] text-white transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {submittingAction ? "Memproses..." : "Terapkan ke Semua"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          DRAWER 4: FULL USER LEDGER DETAIL
      ───────────────────────────────────────────── */}
      {detailDrawerOpen && targetUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#035941] dark:text-emerald-400 flex items-center justify-center">
                  <History size={18} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-slate-100 text-sm">Buku Besar Pengguna</h3>
                  <p className="text-[11px] text-slate-500">Histori & Mutasi Poin Lengkap</p>
                </div>
              </div>
              <button
                onClick={() => setDetailDrawerOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400"
              >
                <X size={16} />
              </button>
            </div>

            {/* Profile Info Bar */}
            <div className="bg-slate-50 dark:bg-slate-800/80 p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center font-black text-base text-[#035941] dark:text-emerald-400">
                  {targetUser.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-black text-slate-900 dark:text-slate-100 text-sm">{targetUser.name}</h4>
                  <p className="text-xs text-slate-500">{targetUser.email || targetUser.phone || "Tidak ada kontak"}</p>
                  <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[9.5px] font-bold border mt-1 ${getRoleBadge(targetUser.role)}`}>
                    {targetUser.role} • {targetUser.rw || targetUser.kelompok || "Umum"}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Total Saldo Poin</span>
                <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{targetUser.totalPoints} Poin</p>
              </div>
            </div>

            {/* Ledger Transactions List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              <h5 className="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Daftar Riwayat Mutasi ({userDetailLedger?.totalTransactions || 0})
              </h5>

              {loadingUserDetail ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : userDetailLedger?.transactions?.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs italic">
                  Belum ada catatan mutasi transaksi poin untuk pengguna ini.
                </div>
              ) : (
                <div className="space-y-2">
                  {userDetailLedger?.transactions?.map((tx: any) => (
                    <div
                      key={tx.id}
                      className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:bg-slate-50 transition-colors flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-slate-400">
                            {new Date(tx.createdAt).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {tx.kategori}
                          </span>
                        </div>
                        <p className="text-slate-800 dark:text-slate-200 font-medium">{tx.description}</p>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`text-base font-black ${tx.points >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                          {tx.points >= 0 ? `+${tx.points}` : tx.points}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setTargetTransaction(tx);
                              setEditTxDesc(tx.description);
                              setEditTxCat(tx.kategori);
                              setEditTxModalOpen(true);
                            }}
                            title="Edit Transaksi"
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => {
                              setTargetTransaction(tx);
                              setVoidReason("");
                              setVoidTxModalOpen(true);
                            }}
                            title="Batalkan / Void"
                            className="p-1 text-rose-400 hover:text-rose-600"
                          >
                            <RotateCcw size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => handleOpenAdjustModal(targetUser, "add")}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Plus size={14} /> Tambah Poin
              </button>

              <button
                onClick={() => setDetailDrawerOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          MODAL 5: EDIT TRANSACTION METADATA
      ───────────────────────────────────────────── */}
      {editTxModalOpen && targetTransaction && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 dark:text-slate-100 text-sm">Edit Deskripsi Transaksi</h3>
              <button onClick={() => setEditTxModalOpen(false)} className="text-slate-400">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitEditTransaction} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Kategori</label>
                <input
                  type="text"
                  value={editTxCat}
                  onChange={(e) => setEditTxCat(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Deskripsi / Keterangan</label>
                <textarea
                  rows={3}
                  value={editTxDesc}
                  onChange={(e) => setEditTxDesc(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditTxModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-5 py-2 rounded-xl font-bold bg-[#035941] text-white shadow-sm"
                >
                  {submittingAction ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          MODAL 6: VOID / REVERSAL TRANSACTION
      ───────────────────────────────────────────── */}
      {voidTxModalOpen && targetTransaction && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-rose-200 dark:border-rose-900 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2.5 text-rose-600">
              <AlertTriangle size={22} />
              <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">Batalkan Transaksi (Reversal)</h3>
            </div>

            <div className="bg-rose-50 dark:bg-rose-950/40 p-3.5 rounded-xl border border-rose-200/80 text-rose-800 dark:text-rose-300 text-xs space-y-1">
              <p>Transaksi: <strong>{targetTransaction.description}</strong></p>
              <p>Nominal: <strong>{targetTransaction.points} Poin</strong></p>
              <p className="text-[11px] text-rose-600 mt-1">
                Sistem akan membuat mutasi balik sebesar <strong>{-targetTransaction.points} Poin</strong> untuk membatalkan transaksi ini di buku besar.
              </p>
            </div>

            <form onSubmit={handleSubmitVoidTransaction} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Alasan Pembatalan (Wajib Audit)
                </label>
                <textarea
                  rows={2}
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  placeholder="Contoh: Kesalahan input bobot setoran..."
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setVoidTxModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-5 py-2 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
                >
                  {submittingAction ? "Membatalkan..." : "Konfirmasi Reversal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KelolaPoinPengguna;
