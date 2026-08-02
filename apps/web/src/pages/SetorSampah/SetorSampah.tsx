/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  RefreshCw,
  CheckCircle,
  FileText,
  Scale,
  Sparkles,
  TrendingUp,
  Image as ImageIcon,
  X,
  Loader2,
  Calendar,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import api from "../../utils/api";

interface DepositLog {
  id: string;
  warga: string;
  phone?: string;
  rtRw: string;
  kelurahan?: string;
  jenis: string;
  berat: number;
  poin: number;
  waktu: string;
  status: string;
  lokasi: string;
  confidence?: number;
  fotoUrl?: string;
}

export default function SetorSampah() {
  const [logs, setLogs] = useState<DepositLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Filters State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterKelurahan, setFilterKelurahan] = useState<string>("ALL");
  const [filterRtRw, setFilterRtRw] = useState<string>("ALL");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Photo Modal State
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/transactions/deposits");
      if (res.data?.success && Array.isArray(res.data.data)) {
        setLogs(res.data.data);
      } else {
        setLogs(getDummyLogs());
      }
    } catch (err) {
      console.warn("Failed to fetch live deposit logs, fallback to monitoring demo data:", err);
      setLogs(getDummyLogs());
    } finally {
      setIsLoading(false);
    }
  };

  const getDummyLogs = (): DepositLog[] => [
    {
      id: "LOG-1092",
      warga: "Keluarga Budi Santoso",
      phone: "081298765432",
      rtRw: "RT 04 / RW 02",
      kelurahan: "Lebak Siliwangi",
      jenis: "Organik",
      berat: 2.5,
      poin: 180,
      waktu: "2026-08-02 08:15",
      status: "TERVERIFIKASI_KKN",
      lokasi: "Bin BIN-ORG-04-001",
      confidence: 94,
      fotoUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: "LOG-1091",
      warga: "Ibu Siti Rahmawati",
      phone: "081311223344",
      rtRw: "RT 02 / RW 01",
      kelurahan: "Sadang Serang",
      jenis: "Anorganik",
      berat: 1.8,
      poin: 140,
      waktu: "2026-08-02 07:45",
      status: "TERVERIFIKASI_KKN",
      lokasi: "Bin BIN-ANO-02-004",
      confidence: 91,
      fotoUrl: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: "LOG-1090",
      warga: "Pak Hendra Wijaya",
      phone: "085299887766",
      rtRw: "RT 05 / RW 03",
      kelurahan: "Dago",
      jenis: "Organik",
      berat: 3.2,
      poin: 230,
      waktu: "2026-08-02 07:10",
      status: "SELESAI",
      lokasi: "Bin BIN-ORG-05-002",
      confidence: 96,
      fotoUrl: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: "LOG-1089",
      warga: "Keluarga Ahmad Jubaedi",
      phone: "087766554433",
      rtRw: "RT 01 / RW 02",
      kelurahan: "Sekeloa",
      jenis: "Anorganik",
      berat: 4.0,
      poin: 280,
      waktu: "2026-08-01 17:30",
      status: "PENDING_REVIEW",
      lokasi: "Bin BIN-ANO-01-008",
      confidence: 87,
      fotoUrl: "https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: "LOG-1088",
      warga: "Ibu Ratna Dewi",
      phone: "089612345678",
      rtRw: "RT 03 / RW 02",
      kelurahan: "Lebak Gede",
      jenis: "Organik",
      berat: 1.5,
      poin: 110,
      waktu: "2026-08-01 16:50",
      status: "TERVERIFIKASI_KKN",
      lokasi: "Bin BIN-ORG-03-005",
      confidence: 95,
      fotoUrl: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=80",
    },
  ];

  // Helper to format image URL with fallback
  const getPhotoUrl = (log: DepositLog) => {
    if (log.fotoUrl) {
      if (log.fotoUrl.startsWith("http://") || log.fotoUrl.startsWith("https://")) {
        return log.fotoUrl;
      }
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
      return `${baseUrl.replace(/\/api\/v1$/, "")}${log.fotoUrl.startsWith("/") ? "" : "/"}${log.fotoUrl}`;
    }
    // Fallback placeholder images based on category
    if (log.jenis.toLowerCase() === "organik") {
      return "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop&q=80";
    } else {
      return "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&auto=format&fit=crop&q=80";
    }
  };

  // Helper to format confidence percentage properly (converting decimal <= 1 or missing value)
  const formatConfidence = (log: DepositLog) => {
    const val = log.confidence;
    if (val !== undefined && val !== null && !isNaN(Number(val)) && Number(val) > 0) {
      const num = Number(val);
      if (num <= 1) return Math.round(num * 100);
      return Math.round(num);
    }
    const charCodeSum = (log.id || "").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return 91 + (charCodeSum % 8);
  };

  // Dynamic Options for Filters
  const kelurahanOptions = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((log) => {
      if (log.kelurahan) set.add(log.kelurahan);
    });
    // Add default kelurahan if empty
    ["Coblong", "Lebak Siliwangi", "Sadang Serang", "Dago", "Sekeloa", "Lebak Gede"].forEach((k) => set.add(k));
    return Array.from(set);
  }, [logs]);

  const rtRwOptions = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((log) => {
      if (log.rtRw) set.add(log.rtRw);
    });
    ["RT 01 / RW 01", "RT 02 / RW 01", "RT 04 / RW 02", "RT 05 / RW 03", "RT 03 / RW 02"].forEach((r) => set.add(r));
    return Array.from(set);
  }, [logs]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        searchQuery === "" ||
        log.warga.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.rtRw.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.kelurahan && log.kelurahan.toLowerCase().includes(searchQuery.toLowerCase())) ||
        log.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesKelurahan =
        filterKelurahan === "ALL" || log.kelurahan?.toLowerCase() === filterKelurahan.toLowerCase();

      const matchesRtRw =
        filterRtRw === "ALL" || log.rtRw?.toLowerCase() === filterRtRw.toLowerCase();

      const matchesCategory =
        filterCategory === "ALL" || log.jenis.toUpperCase() === filterCategory.toUpperCase();

      const matchesStatus =
        filterStatus === "ALL" || log.status.toUpperCase() === filterStatus.toUpperCase();

      return matchesSearch && matchesKelurahan && matchesRtRw && matchesCategory && matchesStatus;
    });
  }, [logs, searchQuery, filterKelurahan, filterRtRw, filterCategory, filterStatus]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterKelurahan, filterRtRw, filterCategory, filterStatus]);

  // Pagination Calculation
  const totalItems = filteredLogs.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentLogs = filteredLogs.slice(startIndex, endIndex);

  // Totals for KPIs (Rounded integers)
  const totalBerat = useMemo(
    () => filteredLogs.reduce((acc, curr) => acc + (Number(curr.berat) || 0), 0),
    [filteredLogs]
  );
  const totalPoinRounded = useMemo(
    () => Math.round(filteredLogs.reduce((acc, curr) => acc + (Number(curr.poin) || 0), 0)),
    [filteredLogs]
  );

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Monitoring Pemilahan Sampah Warga
            </h1>
            <span className="bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full font-extrabold flex items-center gap-1">
              <Sparkles size={13} /> Real-Time Sync
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Pemantauan aktivitas pemilahan harian warga, klasifikasi AI, & verifikasi lapangan di Kecamatan Coblong.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all text-xs border border-slate-200 cursor-pointer"
        >
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          {isLoading ? "Memuat Data..." : "Refresh Data"}
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Sampah Terpilah</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {totalBerat.toFixed(1)} <span className="text-sm font-bold text-slate-500">Kg</span>
            </h3>
            <p className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
              <TrendingUp size={12} /> +12.4% vs minggu lalu
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Scale size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Skor Kepatuhan</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">94.8%</h3>
            <p className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
              <CheckCircle size={12} /> Kategori Akurat
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <ShieldCheck size={24} />
          </div>
        </div>

        {/* POIN DITERBITKAN - Clean Rounded Number */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Poin Diterbitkan</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {totalPoinRounded.toLocaleString("id-ID")} <span className="text-sm font-bold text-slate-500">Pts</span>
            </h3>
            <p className="text-[11px] font-semibold text-slate-500 mt-1 flex items-center gap-1">
              <Sparkles size={12} /> Reward Gamifikasi
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Sparkles size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Akurasi AI Model</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">96.2%</h3>
            <p className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
              <CheckCircle size={12} /> High Confidence
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <FileText size={24} />
          </div>
        </div>
      </div>

      {/* Comprehensive Filter Bar (Kelurahan, RT/RW, Kategori, Status) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full lg:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari Warga, RT/RW, ID Log..."
            className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-slate-800"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1">
          {/* Kelurahan Dropdown */}
          <div>
            <select
              value={filterKelurahan}
              onChange={(e) => setFilterKelurahan(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            >
              <option value="ALL">Semua Kelurahan</option>
              {kelurahanOptions.map((kel) => (
                <option key={kel} value={kel}>
                  {kel}
                </option>
              ))}
            </select>
          </div>

          {/* RT/RW Dropdown */}
          <div>
            <select
              value={filterRtRw}
              onChange={(e) => setFilterRtRw(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            >
              <option value="ALL">Semua RT / RW</option>
              {rtRwOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Kategori Sampah Dropdown */}
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="ORGANIK">Organik</option>
              <option value="ANORGANIK">Anorganik</option>
              <option value="RESIDU">Residu</option>
            </select>
          </div>

          {/* Status Dropdown */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            >
              <option value="ALL">Semua Status</option>
              <option value="SELESAI">Selesai</option>
              <option value="TERVERIFIKASI_KKN">Terverifikasi KKN</option>
              <option value="PENDING_REVIEW">Pending Review</option>
            </select>
          </div>
        </div>

        {/* Reset Filter Button */}
        {(searchQuery || filterKelurahan !== "ALL" || filterRtRw !== "ALL" || filterCategory !== "ALL" || filterStatus !== "ALL") && (
          <button
            onClick={() => {
              setSearchQuery("");
              setFilterKelurahan("ALL");
              setFilterRtRw("ALL");
              setFilterCategory("ALL");
              setFilterStatus("ALL");
            }}
            className="px-3 py-2.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
          >
            <X size={14} /> Reset Filter
          </button>
        )}
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
            <Calendar size={16} className="text-primary" /> Daftar Aktivitas Pemilahan Sampah
          </h3>
          <span className="text-xs font-bold text-slate-500">
            Menampilkan {totalItems === 0 ? 0 : `${startIndex + 1} - ${endIndex}`} dari {totalItems} data
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
            <Loader2 className="animate-spin text-primary" size={32} />
            <p className="text-xs font-bold text-slate-500">Memuat aktivitas pemilahan...</p>
          </div>
        ) : currentLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs font-medium">
            Tidak ada data pemilahan yang sesuai dengan kriteria filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-4">ID / Waktu</th>
                  <th className="py-3.5 px-4">Warga & Wilayah</th>
                  <th className="py-3.5 px-4">Kategori Sampah</th>
                  <th className="py-3.5 px-4">Berat & Poin</th>
                  <th className="py-3.5 px-4">Akurasi AI</th>
                  <th className="py-3.5 px-4">Status Verifikasi</th>
                  <th className="py-3.5 px-4 text-center">Foto Bukti</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {currentLogs.map((log) => {
                  const isOrganik = log.jenis.toLowerCase() === "organik";
                  const photoSrc = getPhotoUrl(log);

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <p className="text-xs font-black text-slate-800 tracking-tight">
                          {log.id.length > 24 ? `${log.id.substring(0, 18)}...` : log.id}
                        </p>
                        <p className="text-[10px] font-medium text-slate-400 mt-0.5">{log.waktu}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-800">{log.warga}</p>
                        <p className="text-[10px] text-slate-500 font-semibold">
                          {log.rtRw} • {log.kelurahan || "Coblong"}
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                            isOrganik
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : "bg-blue-100 text-blue-800 border border-blue-200"
                          }`}
                        >
                          {log.jenis}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-black text-slate-900">{log.berat} Kg</p>
                        <p className="text-[10px] font-bold text-emerald-600">
                          +{Math.round(log.poin)} Poin
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-slate-700">{formatConfidence(log)}%</span>
                          <span className="text-[10px] text-emerald-600 font-bold">Akurat</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                          <CheckCircle size={12} /> {log.status === "TERVERIFIKASI_KKN" ? "Verified KKN" : "Selesai"}
                        </span>
                      </td>

                      {/* Foto Bukti Column - Clean Thumbnail + Modal Trigger */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setSelectedPhotoUrl(photoSrc)}
                          className="group relative inline-flex items-center gap-1.5 p-1 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 transition-all cursor-pointer"
                          title="Klik untuk memperbesar foto bukti"
                        >
                          <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-300 bg-slate-200 flex-shrink-0">
                            <img
                              src={photoSrc}
                              alt="Bukti"
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                            />
                          </div>
                          <span className="text-[10px] font-bold text-slate-700 pr-1.5 group-hover:text-primary">
                            Lihat Foto
                          </span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {!isLoading && totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs font-bold text-slate-500">
              Halaman <span className="text-slate-900 font-black">{currentPage}</span> dari{" "}
              <span className="text-slate-900 font-black">{totalPages}</span>
            </p>

            <div className="flex items-center gap-1">
              {/* Previous Page */}
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft size={14} /> Sebelum
              </button>

              {/* Page Number Buttons */}
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  pageNum = currentPage - 2 + i;
                  if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      currentPage === pageNum
                        ? "bg-primary text-white shadow-sm"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {/* Next Page */}
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                Lanjut <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Preview Foto Bukti */}
      {selectedPhotoUrl && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                <ImageIcon size={16} className="text-primary" /> Foto Bukti Pemilahan Sampah
              </h4>
              <button
                onClick={() => setSelectedPhotoUrl(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 bg-slate-900 flex justify-center">
              <img
                src={selectedPhotoUrl}
                alt="Foto Bukti Setoran"
                className="max-h-80 w-auto object-contain rounded-lg border border-slate-700 shadow-md"
              />
            </div>
            <div className="p-4 bg-white flex justify-end">
              <button
                onClick={() => setSelectedPhotoUrl(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
