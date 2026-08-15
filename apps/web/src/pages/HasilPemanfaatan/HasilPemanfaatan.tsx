/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Component: Hasil Pemanfaatan & Ulasan Warga (Kritik, Saran & Evaluasi Daur Ulang)
 * - 100% End-to-End API Integration dengan Backend PostgreSQL (`/api/v1/pemanfaatan/feedback`)
 * - Fitur Lengkap: CRUD Kritik & Saran, Beri Tanggapan Resmi (Admin/RW/DLH), Filter Status & Kategori, Rating Bintang, Lightbox Foto, Pagination Standar TrashCare.
 */

import React, { useEffect, useState, useMemo } from "react";
import {
  MessageSquare,
  Sparkles,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Star,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  X,
  MessageCircle,
  Trash2,
  Building2,
} from "lucide-react";
import api from "../../services/api";
import showToast from "../../utils/showToast";
import { useAuthStore } from "../../store/useAuthStore";
import { Pagination } from "../../components/common/Pagination";
import { ConfirmModal } from "../../components/common/ConfirmModal";

interface FeedbackItem {
  id: string;
  userId: string;
  wargaNama: string;
  kategori: string;
  judul: string;
  isiKritikSaran: string;
  rating: number;
  status: "MENUNGGU" | "DALAM_PROSES" | "SELESAI" | "DITOLAK" | string;
  tanggapan?: string | null;
  ditanggapiOleh?: string | null;
  ditanggapiPada?: string | null;
  fotoBuktiUrl?: string | null;
  rwId?: number | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    phone: string;
  };
  rw?: {
    id: number;
    name: string;
    kelurahan?: {
      name: string;
    };
  } | null;
}

export const HasilPemanfaatan: React.FC = () => {
  const { user } = useAuthStore();
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [kategoriFilter, setKategoriFilter] = useState<string>("ALL");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRespondModal, setShowRespondModal] = useState(false);
  const [selectedItemForRespond, setSelectedItemForRespond] = useState<FeedbackItem | null>(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  // Form states - Add Feedback
  const [formJudul, setFormJudul] = useState("");
  const [formKategori, setFormKategori] = useState("Pengolahan Kompos");
  const [formIsi, setFormIsi] = useState("");
  const [formRating, setFormRating] = useState(5);
  const [formFotoUrl, setFormFotoUrl] = useState("");
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // Form states - Respond Feedback
  const [respondTanggapan, setRespondTanggapan] = useState("");
  const [respondStatus, setRespondStatus] = useState<string>("SELESAI");
  const [submittingRespond, setSubmittingRespond] = useState(false);
  const [deleteFeedbackId, setDeleteFeedbackId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchFeedbackList = async () => {
    try {
      setLoading(true);
      const res = await api.get("/pemanfaatan/feedback");
      if (res.data && res.data.success) {
        setItems(Array.isArray(res.data.data) ? res.data.data : []);
      } else if (Array.isArray(res.data)) {
        setItems(res.data);
      } else {
        setItems([]);
      }
    } catch (e: any) {
      console.warn("[HasilPemanfaatan] Gagal memuat feedback:", e?.message || e);
      setItems([]);
      showToast.error(e?.response?.data?.message || "Gagal memuat data kritik & saran pemanfaatan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbackList();
  }, []);

  // Filtered feedback calculation
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const rwName = item.rw?.name || (item.rwId ? `RW ${item.rwId}` : "");
      const kelName = item.rw?.kelurahan?.name || "";

      const matchesSearch =
        !q ||
        item.wargaNama.toLowerCase().includes(q) ||
        item.judul.toLowerCase().includes(q) ||
        item.isiKritikSaran.toLowerCase().includes(q) ||
        item.kategori.toLowerCase().includes(q) ||
        rwName.toLowerCase().includes(q) ||
        kelName.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "ALL" ? true : item.status === statusFilter;

      const matchesKategori =
        kategoriFilter === "ALL" ? true : item.kategori === kategoriFilter;

      return matchesSearch && matchesStatus && matchesKategori;
    });
  }, [items, searchQuery, statusFilter, kategoriFilter]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, kategoriFilter, itemsPerPage]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
  }, [filteredItems.length, itemsPerPage]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  // Metrics summary
  const totalCount = items.length;
  const pendingCount = items.filter((i) => i.status === "MENUNGGU").length;
  const inProgressCount = items.filter((i) => i.status === "DALAM_PROSES").length;
  const resolvedCount = items.filter((i) => i.status === "SELESAI").length;
  const avgRating = useMemo(() => {
    if (items.length === 0) return "5.0";
    const sum = items.reduce((acc, curr) => acc + (curr.rating || 5), 0);
    return (sum / items.length).toFixed(1);
  }, [items]);

  // Handlers - Submit New Feedback
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formJudul.trim() || !formIsi.trim()) {
      showToast.error("Judul dan isi kritik/saran wajib diisi");
      return;
    }

    try {
      setSubmittingAdd(true);
      const res = await api.post("/pemanfaatan/feedback", {
        judul: formJudul,
        kategori: formKategori,
        isiKritikSaran: formIsi,
        rating: formRating,
        fotoBuktiUrl: formFotoUrl || null,
      });

      if (res.data && res.data.success) {
        showToast.success("Kritik & saran berhasil disampaikan");
        setShowAddModal(false);
        setFormJudul("");
        setFormIsi("");
        setFormRating(5);
        setFormFotoUrl("");
        fetchFeedbackList();
      }
    } catch (e: any) {
      showToast.error(e.response?.data?.message || "Gagal mengirim kritik & saran");
    } finally {
      setSubmittingAdd(false);
    }
  };

  // Handlers - Respond Feedback
  const openRespondModal = (item: FeedbackItem) => {
    setSelectedItemForRespond(item);
    setRespondTanggapan(item.tanggapan || "");
    setRespondStatus(item.status === "MENUNGGU" ? "SELESAI" : item.status);
    setShowRespondModal(true);
  };

  const handleRespondSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForRespond) return;
    if (!respondTanggapan.trim()) {
      showToast.error("Tanggapan resmi tidak boleh kosong");
      return;
    }

    try {
      setSubmittingRespond(true);
      const res = await api.put(`/pemanfaatan/feedback/${selectedItemForRespond.id}/tanggapan`, {
        tanggapan: respondTanggapan,
        status: respondStatus,
      });

      if (res.data && res.data.success) {
        showToast.success("Tanggapan resmi berhasil disimpan");
        setShowRespondModal(false);
        setSelectedItemForRespond(null);
        setRespondTanggapan("");
        fetchFeedbackList();
      }
    } catch (e: any) {
      showToast.error(e.response?.data?.message || "Gagal menyimpan tanggapan");
    } finally {
      setSubmittingRespond(false);
    }
  };

  // Handlers - Delete Feedback
  const handleDelete = (id: string) => {
    setDeleteFeedbackId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteFeedbackId) return;
    try {
      setIsDeleting(true);
      const res = await api.delete(`/pemanfaatan/feedback/${deleteFeedbackId}`);
      if (res.data && res.data.success) {
        showToast.success("Kritik & saran berhasil dihapus");
        setDeleteFeedbackId(null);
        fetchFeedbackList();
      }
    } catch (e: any) {
      showToast.error(e.response?.data?.message || "Gagal menghapus kritik & saran");
    } finally {
      setIsDeleting(false);
    }
  };

  const isManagementRole = [
    "DEVELOPER",
    "SUPER_USER",
    "ADMIN_DLH",
    "PEMIMPIN",
    "RW",
    "PANITIA_TASKFORCE",
  ].includes(user?.peran || "");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SELESAI":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={13} /> Selesai Ditindaklanjuti
          </span>
        );
      case "DALAM_PROSES":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-sky-50 text-sky-700 border border-sky-200">
            <Clock size={13} /> Dalam Proses
          </span>
        );
      case "DITOLAK":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle size={13} /> Ditolak
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle size={13} /> Menunggu Tanggapan
          </span>
        );
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1 text-amber-400">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            className={star <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}
          />
        ))}
        <span className="text-xs font-black text-slate-700 ml-1">{rating}.0</span>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 text-slate-800 font-sans">
      {/* Executive Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-extrabold w-fit mb-2 border border-emerald-500/30">
            <Sparkles size={14} /> Suara Warga & Evaluasi Daur Ulang
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Hasil Pemanfaatan &amp; Ulasan Warga
          </h1>
          <p className="text-slate-400 text-xs md:text-sm mt-1 max-w-2xl font-medium">
            Pusat aspirasi, masukan, dan evaluasi hasil daur ulang serta pemanfaatan sampah di kelurahan secara transparan dan akuntabel.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="relative z-10 px-5 py-3 bg-[#009966] hover:bg-[#008855] text-white text-xs font-black rounded-2xl transition-all flex items-center gap-2 shadow-md hover:scale-105 active:scale-95 cursor-pointer shrink-0"
        >
          <Plus size={16} /> Sampaikan Kritik &amp; Saran
        </button>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        <div className="bg-white p-4.5 rounded-3xl border border-slate-200/90 shadow-2xs flex items-center gap-3.5">
          <div className="p-3 bg-slate-100 text-slate-700 rounded-2xl shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10.5px] text-slate-400 font-black uppercase tracking-wider">Total Aspirasi</p>
            <p className="text-lg font-black text-slate-900 mt-0.5">{totalCount}</p>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-3xl border border-slate-200/90 shadow-2xs flex items-center gap-3.5">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl shrink-0 border border-amber-100">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10.5px] text-slate-400 font-black uppercase tracking-wider">Menunggu</p>
            <p className="text-lg font-black text-amber-600 mt-0.5">{pendingCount}</p>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-3xl border border-slate-200/90 shadow-2xs flex items-center gap-3.5">
          <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl shrink-0 border border-sky-100">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10.5px] text-slate-400 font-black uppercase tracking-wider">Dalam Proses</p>
            <p className="text-lg font-black text-sky-600 mt-0.5">{inProgressCount}</p>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-3xl border border-slate-200/90 shadow-2xs flex items-center gap-3.5">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0 border border-emerald-100">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10.5px] text-slate-400 font-black uppercase tracking-wider">Ditindaklanjuti</p>
            <p className="text-lg font-black text-emerald-700 mt-0.5">{resolvedCount}</p>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-3xl border border-slate-200/90 shadow-2xs flex items-center gap-3.5 col-span-2 lg:col-span-1">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl shrink-0 border border-purple-100">
            <Star className="w-5 h-5 fill-purple-600" />
          </div>
          <div>
            <p className="text-[10.5px] text-slate-400 font-black uppercase tracking-wider">Kepuasan Warga</p>
            <p className="text-lg font-black text-purple-700 mt-0.5">{avgRating} <span className="text-xs font-semibold text-slate-400">/ 5.0</span></p>
          </div>
        </div>
      </div>

      {/* Interactive Controls & Filters Bar */}
      <div className="bg-white p-4.5 sm:p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
        {/* Top Controls Row */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari berdasarkan nama warga, judul, isi kritik, atau wilayah RW..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-2xl text-xs font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#009966] focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Kategori Dropdown Filter */}
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <select
                value={kategoriFilter}
                onChange={(e) => setKategoriFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 pl-9 pr-3 py-2.5 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:border-[#009966] transition-all cursor-pointer"
              >
                <option value="ALL">Semua Kategori</option>
                <option value="Pengolahan Kompos">Pengolahan Kompos</option>
                <option value="Bank Sampah">Bank Sampah</option>
                <option value="Rumah Maggot BSF">Rumah Maggot BSF</option>
                <option value="Pupuk Organik Cair (POC)">Pupuk Organik Cair (POC)</option>
                <option value="Kualitas Layanan & Fasilitas">Kualitas Layanan &amp; Fasilitas</option>
              </select>
            </div>

            <button
              onClick={fetchFeedbackList}
              title="Sinkronkan data dari database"
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Filter Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-t border-slate-100 pt-3">
          {[
            { id: "ALL", label: "Semua Status" },
            { id: "MENUNGGU", label: "Menunggu Tanggapan" },
            { id: "DALAM_PROSES", label: "Dalam Proses" },
            { id: "SELESAI", label: "Selesai Ditindaklanjuti" },
            { id: "DITOLAK", label: "Ditolak" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === tab.id
                  ? "bg-[#009966] text-white shadow-xs"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Feedback List Section */}
      {loading ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200/90 shadow-2xs text-center flex flex-col items-center justify-center gap-3">
          <RefreshCw size={28} className="animate-spin text-[#009966]" />
          <p className="text-xs font-bold text-slate-500">Memuat data kritik &amp; saran dari database...</p>
        </div>
      ) : paginatedItems.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200/90 shadow-2xs text-center flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#009966] flex items-center justify-center border border-emerald-100">
            <MessageSquare size={28} />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-800 text-sm">Tidak Ada Kritik &amp; Saran</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 font-medium">
              Belum ada entri kritik &amp; saran pemanfaatan sampah yang sesuai kriteria pencarian saat ini.
            </p>
          </div>
          <button
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("ALL");
              setKategoriFilter("ALL");
            }}
            className="mt-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
          >
            Reset Filter
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedItems.map((item) => (
            <div
              key={item.id}
              className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all space-y-4"
            >
              {/* Header: Citizen Info & Status Badge */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center border border-emerald-200 text-sm shrink-0">
                    {item.wargaNama ? item.wargaNama.charAt(0).toUpperCase() : "W"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-slate-900">{item.wargaNama}</h4>
                      <span className="text-[11px] font-bold text-slate-400">•</span>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                        {item.rw?.name ? `${item.rw.name} (${item.rw.kelurahan?.name || "Coblong"})` : item.rwId ? `RW ${item.rwId}` : "Warga Kelurahan"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                      {new Date(item.createdAt).toLocaleDateString("id-ID", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {getStatusBadge(item.status)}
                </div>
              </div>

              {/* Title, Category & Stars */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-black uppercase tracking-wider">
                      {item.kategori}
                    </span>
                  </div>
                  {renderStars(item.rating || 5)}
                </div>

                <h3 className="font-extrabold text-base text-slate-900 leading-snug">
                  {item.judul}
                </h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed whitespace-pre-line">
                  {item.isiKritikSaran}
                </p>

                {/* Evidence Photo thumbnail */}
                {item.fotoBuktiUrl && (
                  <div className="pt-2">
                    <button
                      onClick={() => setPreviewPhotoUrl(item.fotoBuktiUrl || null)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 cursor-pointer"
                    >
                      📷 Lihat Foto Lampiran Bukti
                    </button>
                  </div>
                )}
              </div>

              {/* Official Response Box */}
              {item.tanggapan ? (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                      <Building2 size={14} className="text-[#009966]" /> Tanggapan Resmi:{" "}
                      <span className="text-[#009966]">{item.ditanggapiOleh || "Pengelola TrashCare"}</span>
                    </span>
                    {item.ditanggapiPada && (
                      <span className="text-[11px] text-slate-400 font-medium">
                        {new Date(item.ditanggapiPada).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed italic pl-5 border-l-2 border-[#009966]">
                    "{item.tanggapan}"
                  </p>
                </div>
              ) : (
                <div className="bg-amber-50/60 p-3 rounded-2xl border border-amber-200/60 text-xs text-amber-800 font-medium flex items-center gap-2">
                  <AlertCircle size={15} className="text-amber-600 shrink-0" />
                  <span>Belum ada tanggapan resmi dari pengelola wilayah / DLH.</span>
                </div>
              )}

              {/* Management Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                {isManagementRole && (
                  <button
                    onClick={() => openRespondModal(item)}
                    className="px-3.5 py-1.5 bg-[#009966] hover:bg-[#008855] text-white text-xs font-extrabold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <MessageCircle size={14} /> Beri Tanggapan / Update Status
                  </button>
                )}

                {(isManagementRole || item.userId === user?.id) && (
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-extrabold rounded-xl transition flex items-center gap-1 cursor-pointer border border-rose-200"
                  >
                    <Trash2 size={14} /> Hapus
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Standardized TrashCare Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredItems.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            itemsPerPageOptions={[10, 25, 50, 100]}
          />
        </div>
      )}

      {/* Modal 1: Form Sampaikan Kritik & Saran Baru */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col p-6 space-y-4 border border-slate-200 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Plus size={18} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Sampaikan Kritik &amp; Saran</h3>
                  <p className="text-xs text-slate-500 font-medium">Suara Anda membangun lingkungan yang lebih bersih</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  Kategori Pemanfaatan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formKategori}
                  onChange={(e) => setFormKategori(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#009966] transition"
                >
                  <option value="Pengolahan Kompos">Pengolahan Kompos</option>
                  <option value="Bank Sampah">Bank Sampah</option>
                  <option value="Rumah Maggot BSF">Rumah Maggot BSF</option>
                  <option value="Pupuk Organik Cair (POC)">Pupuk Organik Cair (POC)</option>
                  <option value="Kualitas Layanan & Fasilitas">Kualitas Layanan &amp; Fasilitas</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  Judul Aspirasi / Topik <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Usulan Penambahan Komposter di RW 03"
                  value={formJudul}
                  onChange={(e) => setFormJudul(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#009966] transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  Rating Kepuasan Daur Ulang <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormRating(star)}
                      className="cursor-pointer transition-transform hover:scale-110"
                    >
                      <Star
                        size={22}
                        className={star <= formRating ? "fill-amber-400 text-amber-400" : "text-slate-300"}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-black text-slate-700 ml-2">{formRating}.0 Dari 5.0</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  Isi Kritik &amp; Saran <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Tuliskan masukan, kendala, atau saran konstruktif mengenai pemanfaatan sampah di lingkungan Anda..."
                  value={formIsi}
                  onChange={(e) => setFormIsi(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-[#009966] transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  URL Foto Lampiran Bukti (Opsional)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formFotoUrl}
                  onChange={(e) => setFormFotoUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-[#009966] transition"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingAdd}
                  className="px-5 py-2.5 bg-[#009966] hover:bg-[#008855] text-white text-xs font-black rounded-xl transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {submittingAdd ? "Mengirim..." : "Kirim Aspirasi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Form Beri Tanggapan Resmi (Admin / RW / DLH) */}
      {showRespondModal && selectedItemForRespond && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col p-6 space-y-4 border border-slate-200 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold">
                  <MessageCircle size={18} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Beri Tanggapan Resmi</h3>
                  <p className="text-xs text-slate-500 font-medium">Tanggapi aspirasi dari {selectedItemForRespond.wargaNama}</p>
                </div>
              </div>
              <button
                onClick={() => setShowRespondModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Aspirasi Summary */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">{selectedItemForRespond.kategori}</p>
              <h4 className="font-extrabold text-xs text-slate-900">{selectedItemForRespond.judul}</h4>
              <p className="text-xs text-slate-600 font-medium italic">"{selectedItemForRespond.isiKritikSaran}"</p>
            </div>

            <form onSubmit={handleRespondSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  Status Tindak Lanjut <span className="text-rose-500">*</span>
                </label>
                <select
                  value={respondStatus}
                  onChange={(e) => setRespondStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#009966] transition"
                >
                  <option value="DALAM_PROSES">Dalam Proses</option>
                  <option value="SELESAI">Selesai Ditindaklanjuti</option>
                  <option value="DITOLAK">Ditolak</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  Pesan Tanggapan Resmi <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Tuliskan jawaban resmi, langkah penanganan, atau tindak lanjut dari pengelola wilayah..."
                  value={respondTanggapan}
                  onChange={(e) => setRespondTanggapan(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-[#009966] transition"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRespondModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingRespond}
                  className="px-5 py-2.5 bg-[#009966] hover:bg-[#008855] text-white text-xs font-black rounded-xl transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {submittingRespond ? "Simpan..." : "Simpan Tanggapan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Photo Preview Modal */}
      {previewPhotoUrl && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in"
          onClick={() => setPreviewPhotoUrl(null)}
        >
          <div className="relative max-w-3xl w-full bg-white p-2 rounded-3xl shadow-2xl border border-slate-700 overflow-hidden">
            <button
              onClick={() => setPreviewPhotoUrl(null)}
              className="absolute top-4 right-4 bg-slate-900/80 text-white p-2 rounded-full hover:bg-slate-900 cursor-pointer"
            >
              <X size={18} />
            </button>
            <img
              src={previewPhotoUrl}
              alt="Bukti Lampiran Foto"
              className="w-full h-auto max-h-[80vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}

      {/* Confirmation Modal Delete Feedback */}
      <ConfirmModal
        isOpen={Boolean(deleteFeedbackId)}
        onClose={() => setDeleteFeedbackId(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Hapus Kritik & Saran"
        message="Apakah Anda yakin ingin menghapus kritik & saran warga ini? Data yang dihapus tidak dapat dipulihkan."
        confirmText="Ya, Hapus"
        type="danger"
      />
    </div>
  );
};

export default HasilPemanfaatan;
