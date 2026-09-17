/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 *
 * Halaman Tempat Sampah Teraktivasi (Dasbor Eksekutif & Monitoring Lapangan):
 * - Kartu metrik eksekutif (Total, Aktif & Terikat, Ditugaskan ke PIC, Cakupan Wilayah)
 * - Filter cepat status (Semua, Aktif & Terikat, Ditugaskan ke PIC)
 * - Pencarian multi-kriteria instan (QR Code, Kategori, RW, Kelurahan, Pemilik)
 * - Filter Kelurahan & RW terintegrasi
 * - Tabel data super-lengkap, rapi, dan terurut (Sortable columns & quick sorter)
 * - Icon QR Code interaktif di setiap baris dengan preview modal resolusi tinggi
 * - Indikator Kategori Sampah (Organik vs Anorganik) dengan icon visual khas
 * - Opsi Paginasi Fleksibel (20, 50, 100, hingga Tampilkan Semua Data)
 * - Salin QR Code, Navigasi Google Maps, dan Cetak Poster Resmi BERSEKA
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  RefreshCw,
  AlertCircle,
  MapPin,
  Layers,
  ChevronLeft,
  ChevronRight,
  Printer,
  Trash2,
  CheckCircle2,
  UserCheck,
  Search,
  X,
  Copy,
  Check,
  Calendar,
  ExternalLink,
  QrCode,
  Leaf,
  Recycle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Compass,
  SlidersHorizontal,
} from "lucide-react";
import api from "../../services/api";
import showToast from "../../utils/showToast";
import { generatePosterHtml } from "../../utils/printQrStickers";

// ── Daftar Kelurahan Kecamatan Coblong ────────────────────────────────────────
const KELURAHAN_OPTIONS = [
  "Semua Kelurahan",
  "Cipaganti",
  "Dago",
  "Lebak Gede",
  "Lebak Siliwangi",
  "Sadang Serang",
  "Sekeloa",
];

// ── Tipe Data Tempat Sampah ───────────────────────────────────────────────────
export interface ActivatedBin {
  id: string;
  qrCode: string;
  kelurahan: string | null;
  rwNama: string | null;
  status: string;
  createdAt?: string;
  tanggalAktivasi?: string;
  latitude?: number | null;
  longitude?: number | null;
  kategoriNama?: string | null;
  pemilikNama?: string | null;
  pemilikPhone?: string | null;
  pendaftarNama?: string | null;
  kapasitasLiter?: number | null;
}

type SortField = "tanggal" | "qrCode" | "kelurahan" | "rw" | "status" | "kategori";
type SortOrder = "asc" | "desc";

// ── Helper Deteksi Kategori Wadah ─────────────────────────────────────────────
interface CategoryInfo {
  label: "ORGANIK" | "ANORGANIK" | "WADAH CERDAS";
  isOrganik: boolean;
  isAnorganik: boolean;
  bgClass: string;
  textClass: string;
  borderClass: string;
  badgeClass: string;
  icon: React.ReactNode;
}

const getBinCategoryInfo = (qrCode: string, kategoriNama?: string | null): CategoryInfo => {
  const qUpper = (qrCode || "").toUpperCase();
  const kUpper = (kategoriNama || "").toUpperCase();

  // 1. Deteksi Anorganik lebih dahulu (karena kata "ANORGANIK" mengandung substring "ORGANIK")
  const isAnorganik =
    qUpper.includes("-AGN-") ||
    kUpper.includes("ANORGANIK") ||
    kUpper.includes("ANORGANIC") ||
    kUpper.includes("NON_ORGANIC") ||
    kUpper.includes("NON-ORGANIK") ||
    kUpper.includes("NON ORGANIK") ||
    kUpper.includes("AGN");

  // 2. Deteksi Organik (hanya jika bukan Anorganik dan memenuhi kriteria Organik)
  const isOrganik =
    !isAnorganik &&
    (qUpper.includes("-OGN-") ||
      kUpper.includes("ORGANIK") ||
      kUpper.includes("ORGANIC") ||
      kUpper.includes("OGN"));

  if (isAnorganik) {
    return {
      label: "ANORGANIK",
      isOrganik: false,
      isAnorganik: true,
      bgClass: "bg-amber-50 dark:bg-amber-950/50",
      textClass: "text-amber-700 dark:text-amber-300",
      borderClass: "border-amber-200 dark:border-amber-800/60",
      badgeClass:
        "bg-amber-100/80 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border-amber-300/60 dark:border-amber-700/50",
      icon: <Recycle size={12} className="text-amber-600 dark:text-amber-400" />,
    };
  }

  if (isOrganik) {
    return {
      label: "ORGANIK",
      isOrganik: true,
      isAnorganik: false,
      bgClass: "bg-emerald-50 dark:bg-emerald-950/50",
      textClass: "text-emerald-700 dark:text-emerald-300",
      borderClass: "border-emerald-200 dark:border-emerald-800/60",
      badgeClass:
        "bg-emerald-100/80 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border-emerald-300/60 dark:border-emerald-700/50",
      icon: <Leaf size={12} className="text-emerald-600 dark:text-emerald-400" />,
    };
  }

  return {
    label: "WADAH CERDAS",
    isOrganik: false,
    isAnorganik: false,
    bgClass: "bg-blue-50 dark:bg-blue-950/50",
    textClass: "text-blue-700 dark:text-blue-300",
    borderClass: "border-blue-200 dark:border-blue-800/60",
    badgeClass:
      "bg-blue-100/80 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 border-blue-300/60 dark:border-blue-700/50",
    icon: <Trash2 size={12} className="text-blue-600 dark:text-blue-400" />,
  };
};

// ── Format Tanggal & Jam Indonesia ────────────────────────────────────────────
const formatTanggalLengkap = (isoDate?: string | null): { tanggal: string; jam: string } => {
  if (!isoDate || isoDate === "-" || isoDate === "null") {
    return { tanggal: "-", jam: "" };
  }
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return { tanggal: isoDate, jam: "" };

    const tanggal = d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const jam = d.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    }) + " WIB";

    return { tanggal, jam };
  } catch {
    return { tanggal: isoDate, jam: "" };
  }
};

// ── Status Badge ─────────────────────────────────────────────────────────────
const getStatusBadge = (status: string): string => {
  const s = status?.toUpperCase() ?? "";
  if (s === "ACTIVE_BOUND" || s.includes("ACTIVE")) {
    return "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-700/60";
  }
  if (s === "ASSIGNED_TO_PIC" || s.includes("ASSIGNED")) {
    return "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-300/80 dark:border-blue-700/60";
  }
  return "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700";
};

const getStatusLabel = (status: string): string => {
  const s = status?.toUpperCase() ?? "";
  if (s === "ACTIVE_BOUND") return "Aktif & Terikat";
  if (s === "ASSIGNED_TO_PIC") return "Dialokasikan ke Petugas";
  if (s === "ACTIVE") return "Aktif";
  return status || "-";
};

// ── Komponen Utama ────────────────────────────────────────────────────────────
export const TempatSampahAktifPage: React.FC = () => {
  const [selectedKelurahan, setSelectedKelurahan] = useState("Semua Kelurahan");
  const [rwInput, setRwInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [kategoriFilter, setKategoriFilter] = useState<string>("ALL");

  // Sorting
  const [sortField, setSortField] = useState<SortField>("tanggal");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Pagination & Page Size
  const [pageSize, setPageSize] = useState<number | "ALL">(20);
  const [page, setPage] = useState(1);

  // Data states
  const [bins, setBins] = useState<ActivatedBin[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedQrId, setCopiedQrId] = useState<string | null>(null);

  // Modal QR Code Visual Preview
  const [previewBin, setPreviewBin] = useState<ActivatedBin | null>(null);

  // ── Fetch Data dari Server ──────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = {};
      if (selectedKelurahan && selectedKelurahan !== "Semua Kelurahan") {
        params.kelurahan = selectedKelurahan;
      }
      if (rwInput.trim()) {
        params.rw = rwInput.trim();
      }

      const res = await api.get("/dashboard/kkn-executive/waste/bins-activated", { params });
      if (res.data?.success) {
        const responseData = res.data.data;
        setTotal(responseData?.total ?? 0);
        setBins(Array.isArray(responseData?.bins) ? responseData.bins : []);
      } else {
        setBins([]);
        setTotal(0);
      }
    } catch (err: unknown) {
      console.error("Bins activated fetch error:", err);
      setError("Gagal memuat data tempat sampah teraktivasi dari server.");
      setBins([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [selectedKelurahan, rwInput]);

  useEffect(() => {
    fetchData();
    setPage(1);
  }, [fetchData]);

  // ── Filter & Sorting di Sisi Klien ──────────────────────────────────────────
  const filteredAndSortedBins = useMemo(() => {
    let result = bins.filter((bin) => {
      // Filter Status
      if (statusFilter !== "ALL") {
        const s = (bin.status || "").toUpperCase();
        if (statusFilter === "ACTIVE_BOUND" && s !== "ACTIVE_BOUND") return false;
        if (statusFilter === "ASSIGNED_TO_PIC" && s !== "ASSIGNED_TO_PIC") return false;
      }

      // Filter Kategori (Organik vs Anorganik)
      if (kategoriFilter !== "ALL") {
        const catInfo = getBinCategoryInfo(bin.qrCode, bin.kategoriNama);
        if (kategoriFilter === "ORGANIK" && !catInfo.isOrganik) return false;
        if (kategoriFilter === "ANORGANIK" && !catInfo.isAnorganik) return false;
      }

      // Filter Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const qr = (bin.qrCode || "").toLowerCase();
        const rw = (bin.rwNama || "").toLowerCase();
        const kel = (bin.kelurahan || "").toLowerCase();
        const owner = (bin.pemilikNama || "").toLowerCase();
        const registrant = (bin.pendaftarNama || "").toLowerCase();
        const cat = (bin.kategoriNama || "").toLowerCase();
        const catLabel = getBinCategoryInfo(bin.qrCode, bin.kategoriNama).label.toLowerCase();
        return (
          qr.includes(q) ||
          rw.includes(q) ||
          kel.includes(q) ||
          owner.includes(q) ||
          registrant.includes(q) ||
          cat.includes(q) ||
          catLabel.includes(q)
        );
      }

      return true;
    });

    // Urutkan (Sorting)
    result = [...result].sort((a, b) => {
      let comparison = 0;

      if (sortField === "tanggal") {
        const dateA = new Date(a.tanggalAktivasi || a.createdAt || 0).getTime();
        const dateB = new Date(b.tanggalAktivasi || b.createdAt || 0).getTime();
        comparison = dateA - dateB;
      } else if (sortField === "qrCode") {
        comparison = (a.qrCode || "").localeCompare(b.qrCode || "");
      } else if (sortField === "kelurahan") {
        comparison = (a.kelurahan || "").localeCompare(b.kelurahan || "");
      } else if (sortField === "rw") {
        const numA = parseInt((a.rwNama || "").replace(/\D/g, ""), 10) || 0;
        const numB = parseInt((b.rwNama || "").replace(/\D/g, ""), 10) || 0;
        comparison = numA - numB;
      } else if (sortField === "status") {
        comparison = (a.status || "").localeCompare(b.status || "");
      } else if (sortField === "kategori") {
        const catA = getBinCategoryInfo(a.qrCode, a.kategoriNama).label;
        const catB = getBinCategoryInfo(b.qrCode, b.kategoriNama).label;
        comparison = catA.localeCompare(catB);
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [bins, statusFilter, kategoriFilter, searchQuery, sortField, sortOrder]);

  // ── Statistik Metrik Eksekutif ──────────────────────────────────────────────
  const metrics = useMemo(() => {
    let activeBound = 0;
    let assignedPic = 0;
    let organikCount = 0;
    let anorganikCount = 0;
    const uniqueKelurahan = new Set<string>();
    const uniqueRw = new Set<string>();

    bins.forEach((b) => {
      const s = (b.status || "").toUpperCase();
      if (s === "ACTIVE_BOUND") activeBound++;
      else if (s === "ASSIGNED_TO_PIC") assignedPic++;

      const catInfo = getBinCategoryInfo(b.qrCode, b.kategoriNama);
      if (catInfo.isOrganik) organikCount++;
      if (catInfo.isAnorganik) anorganikCount++;

      if (b.kelurahan) uniqueKelurahan.add(b.kelurahan.trim());
      if (b.rwNama && b.rwNama !== "-") uniqueRw.add(`${b.kelurahan || ""}_${b.rwNama}`);
    });

    return {
      total: bins.length,
      activeBound,
      assignedPic,
      organikCount,
      anorganikCount,
      kelurahanCount: uniqueKelurahan.size,
      rwCount: uniqueRw.size,
    };
  }, [bins]);

  // ── Pagination View ─────────────────────────────────────────────────────────
  const effectivePageSize = pageSize === "ALL" ? filteredAndSortedBins.length || 1 : pageSize;
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedBins.length / effectivePageSize));

  const paginatedBins = useMemo(() => {
    if (pageSize === "ALL") return filteredAndSortedBins;
    const startIndex = (page - 1) * effectivePageSize;
    return filteredAndSortedBins.slice(startIndex, startIndex + effectivePageSize);
  }, [filteredAndSortedBins, page, pageSize, effectivePageSize]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder(field === "tanggal" ? "desc" : "asc");
    }
    setPage(1);
  };

  const handleCopyQr = (id: string, qr: string) => {
    navigator.clipboard.writeText(qr);
    setCopiedQrId(id);
    showToast.success(`QR Code disalin: ${qr}`);
    setTimeout(() => setCopiedQrId(null), 2500);
  };

  const handlePrintPoster = (bin: ActivatedBin) => {
    const catInfo = getBinCategoryInfo(bin.qrCode, bin.kategoriNama);
    const stickerItem = {
      id: bin.id,
      qrCode: bin.qrCode,
      category: { name: catInfo.label },
      rtRw: {
        name: bin.rwNama || "RW -",
        kelurahan: { name: bin.kelurahan || "Coblong" },
      },
      status: bin.status,
    };

    const htmlContent = generatePosterHtml([stickerItem], `Poster QR - ${bin.qrCode}`);
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
    }
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      {/* ── Header & Filter Bar ──────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
              <QrCode size={28} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800/80 uppercase tracking-wider">
                  Inventaris Teraktivasi
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {total} Unit Terdata
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  {metrics.organikCount} Organik
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                  {metrics.anorganikCount} Anorganik
                </span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1.5 tracking-tight">
                Tempat Sampah Teraktivasi
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Daftar unit tempat sampah cerdas teraktivasi, terikat data warga/petugas, dan berkoordinat presisi di Kecamatan Coblong.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-xs"
            >
              <Printer size={15} />
              <span>Cetak Laporan</span>
            </button>
            <button
              type="button"
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              <span>Perbarui Data</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-5">
          {/* Kelurahan Dropdown */}
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-2xl shadow-xs">
            <MapPin size={16} className="text-emerald-600 shrink-0" />
            <div className="flex-1">
              <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Kelurahan
              </label>
              <select
                value={selectedKelurahan}
                onChange={(e) => {
                  setSelectedKelurahan(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent outline-none text-xs font-bold text-slate-800 dark:text-slate-200 w-full cursor-pointer mt-0.5"
                aria-label="Filter Kelurahan"
              >
                {KELURAHAN_OPTIONS.map((k) => (
                  <option key={k} value={k} className="dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                    {k}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* RW Input */}
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-2xl shadow-xs">
            <Layers size={16} className="text-blue-500 shrink-0" />
            <div className="flex-1">
              <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Nomor RW
              </label>
              <input
                type="text"
                placeholder="Contoh: 01 (tekan Enter)"
                value={rwInput}
                onChange={(e) => setRwInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    fetchData();
                    setPage(1);
                  }
                }}
                className="bg-transparent outline-none text-xs font-bold text-slate-800 dark:text-slate-200 w-full placeholder:text-slate-400 placeholder:font-normal mt-0.5"
                aria-label="Filter RW"
              />
            </div>
            {rwInput && (
              <button
                type="button"
                onClick={() => {
                  setRwInput("");
                  fetchData();
                  setPage(1);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                title="Hapus filter RW"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Search Bar Multi-Kriteria */}
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-2xl shadow-xs">
            <Search size={16} className="text-purple-500 shrink-0" />
            <div className="flex-1">
              <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Cari Unit &amp; QR
              </label>
              <input
                type="text"
                placeholder="Kode QR, RW, Pemilik, dll..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent outline-none text-xs font-bold text-slate-800 dark:text-slate-200 w-full placeholder:text-slate-400 placeholder:font-normal mt-0.5"
                aria-label="Cari QR Code"
              />
            </div>
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setPage(1);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                title="Hapus pencarian"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 4 KPI Summary Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Teraktivasi */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-blue-400/60 transition-colors">
          <div className="flex items-center justify-between w-full mb-3">
            <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-400">
              Total Teraktivasi
            </span>
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Trash2 size={18} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {loading ? "..." : metrics.total.toLocaleString("id-ID")}
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 truncate">
              {selectedKelurahan === "Semua Kelurahan" ? "Kecamatan Coblong" : `Kelurahan ${selectedKelurahan}`}
              {rwInput ? ` • RW ${rwInput}` : ""}
            </p>
          </div>
        </div>

        {/* Card 2: Aktif & Terikat */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-emerald-400/60 transition-colors">
          <div className="flex items-center justify-between w-full mb-3">
            <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Aktif &amp; Terikat
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
              {loading ? "..." : metrics.activeBound.toLocaleString("id-ID")}
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 truncate">
              Telah Terpasang di Warga
            </p>
          </div>
        </div>

        {/* Card 3: Dialokasikan ke Petugas */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-indigo-400/60 transition-colors">
          <div className="flex items-center justify-between w-full mb-3">
            <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
              Dialokasikan ke Petugas
            </span>
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <UserCheck size={18} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black tracking-tight text-indigo-600 dark:text-indigo-400">
              {loading ? "..." : metrics.assignedPic.toLocaleString("id-ID")}
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 truncate">
              Dalam Distribusi Petugas
            </p>
          </div>
        </div>

        {/* Card 4: Wilayah Terjangkau */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-amber-400/60 transition-colors">
          <div className="flex items-center justify-between w-full mb-3">
            <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Cakupan Wilayah
            </span>
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <MapPin size={18} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {loading ? "..." : `${metrics.kelurahanCount} Kel / ${metrics.rwCount} RW`}
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 truncate">
              Titik Wilayah Aktif Terdata
            </p>
          </div>
        </div>
      </div>

      {/* ── Toolbar: Filter Status, Kategori, Urutan, dan Ukuran Baris ───────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filter Status Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setStatusFilter("ALL");
              setPage(1);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              statusFilter === "ALL"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <span>Semua Status</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
              {bins.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setStatusFilter("ACTIVE_BOUND");
              setPage(1);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              statusFilter === "ACTIVE_BOUND"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <CheckCircle2 size={13} />
            <span>Aktif &amp; Terikat</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
              {metrics.activeBound}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setStatusFilter("ASSIGNED_TO_PIC");
              setPage(1);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              statusFilter === "ASSIGNED_TO_PIC"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <UserCheck size={13} />
            <span>Dialokasikan ke Petugas</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
              {metrics.assignedPic}
            </span>
          </button>

          {/* Separator */}
          <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

          {/* Filter Jenis Sampah */}
          <button
            type="button"
            onClick={() => {
              setKategoriFilter((prev) => (prev === "ORGANIK" ? "ALL" : "ORGANIK"));
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
              kategoriFilter === "ORGANIK"
                ? "bg-emerald-700 text-white shadow-xs"
                : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
            }`}
          >
            <Leaf size={12} />
            <span>Organik ({metrics.organikCount})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setKategoriFilter((prev) => (prev === "ANORGANIK" ? "ALL" : "ANORGANIK"));
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
              kategoriFilter === "ANORGANIK"
                ? "bg-amber-700 text-white shadow-xs"
                : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100"
            }`}
          >
            <Recycle size={12} />
            <span>Anorganik ({metrics.anorganikCount})</span>
          </button>
        </div>

        {/* Sorting & Page Size Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Urutan Cepat */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold">
            <SlidersHorizontal size={13} className="text-slate-400 shrink-0" />
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Urutkan:</span>
            <select
              value={`${sortField}-${sortOrder}`}
              onChange={(e) => {
                const [f, o] = e.target.value.split("-") as [SortField, SortOrder];
                setSortField(f);
                setSortOrder(o);
                setPage(1);
              }}
              className="bg-transparent outline-none font-bold text-slate-800 dark:text-slate-200 cursor-pointer text-xs"
              aria-label="Urutkan Data"
            >
              <option value="tanggal-desc" className="dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                Aktivasi Terbaru (Desc)
              </option>
              <option value="tanggal-asc" className="dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                Aktivasi Terlama (Asc)
              </option>
              <option value="qrCode-asc" className="dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                QR Code (A - Z)
              </option>
              <option value="qrCode-desc" className="dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                QR Code (Z - A)
              </option>
              <option value="kelurahan-asc" className="dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                Kelurahan (A - Z)
              </option>
              <option value="rw-asc" className="dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                Nomor RW (Terkecil)
              </option>
            </select>
          </div>

          {/* Opsi Jumlah Baris */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Baris:</span>
            <select
              value={String(pageSize)}
              onChange={(e) => {
                const val = e.target.value;
                setPageSize(val === "ALL" ? "ALL" : Number(val));
                setPage(1);
              }}
              className="bg-transparent outline-none font-bold text-slate-800 dark:text-slate-200 cursor-pointer text-xs"
              aria-label="Jumlah Baris"
            >
              <option value="20" className="dark:bg-slate-900 text-slate-800 dark:text-slate-200">20 / halaman</option>
              <option value="50" className="dark:bg-slate-900 text-slate-800 dark:text-slate-200">50 / halaman</option>
              <option value="100" className="dark:bg-slate-900 text-slate-800 dark:text-slate-200">100 / halaman</option>
              <option value="ALL" className="dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-extrabold text-emerald-600">
                Semua ({filteredAndSortedBins.length} Unit)
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Error Notification ────────────────────────────────────────────────── */}
      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle size={18} className="text-rose-600 shrink-0" />
          <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
        </div>
      )}

      {/* ── Tabel Tempat Sampah Teraktivasi ────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="h-72 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-3 border-emerald-600/20 border-t-emerald-600 rounded-full animate-spin" />
              <p className="text-xs text-slate-400 font-semibold">Memuat data tempat sampah...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-left select-none">
                    <th className="p-3.5 pl-5 text-slate-400 font-bold uppercase tracking-wider w-14">
                      No
                    </th>

                    {/* QR Code Column Header */}
                    <th
                      onClick={() => handleSort("qrCode")}
                      className="p-3.5 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider cursor-pointer hover:text-emerald-600 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <QrCode size={14} className="text-slate-400" />
                        <span>Identitas QR Code</span>
                        {sortField === "qrCode" ? (
                          sortOrder === "asc" ? <ArrowUp size={13} className="text-emerald-600" /> : <ArrowDown size={13} className="text-emerald-600" />
                        ) : (
                          <ArrowUpDown size={12} className="text-slate-300" />
                        )}
                      </div>
                    </th>

                    {/* Kategori Sampah */}
                    <th
                      onClick={() => handleSort("kategori")}
                      className="p-3.5 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider cursor-pointer hover:text-emerald-600 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Jenis Wadah</span>
                        {sortField === "kategori" ? (
                          sortOrder === "asc" ? <ArrowUp size={13} className="text-emerald-600" /> : <ArrowDown size={13} className="text-emerald-600" />
                        ) : (
                          <ArrowUpDown size={12} className="text-slate-300" />
                        )}
                      </div>
                    </th>

                    {/* Wilayah (Kelurahan & RW) */}
                    <th
                      onClick={() => handleSort("kelurahan")}
                      className="p-3.5 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider cursor-pointer hover:text-emerald-600 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <MapPin size={13} className="text-slate-400" />
                        <span>Wilayah (Kel / RW)</span>
                        {sortField === "kelurahan" ? (
                          sortOrder === "asc" ? <ArrowUp size={13} className="text-emerald-600" /> : <ArrowDown size={13} className="text-emerald-600" />
                        ) : (
                          <ArrowUpDown size={12} className="text-slate-300" />
                        )}
                      </div>
                    </th>

                    {/* Status Operasional */}
                    <th
                      onClick={() => handleSort("status")}
                      className="p-3.5 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider cursor-pointer hover:text-emerald-600 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Status Operasional</span>
                        {sortField === "status" ? (
                          sortOrder === "asc" ? <ArrowUp size={13} className="text-emerald-600" /> : <ArrowDown size={13} className="text-emerald-600" />
                        ) : (
                          <ArrowUpDown size={12} className="text-slate-300" />
                        )}
                      </div>
                    </th>

                    {/* Tanggal & Waktu Aktivasi */}
                    <th
                      onClick={() => handleSort("tanggal")}
                      className="p-3.5 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider cursor-pointer hover:text-emerald-600 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-slate-400" />
                        <span>Waktu Aktivasi</span>
                        {sortField === "tanggal" ? (
                          sortOrder === "asc" ? <ArrowUp size={13} className="text-emerald-600" /> : <ArrowDown size={13} className="text-emerald-600" />
                        ) : (
                          <ArrowUpDown size={12} className="text-slate-300" />
                        )}
                      </div>
                    </th>

                    {/* Titik Lokasi / Peta */}
                    <th className="p-3.5 pr-5 text-slate-400 font-bold uppercase tracking-wider text-right">
                      Peta
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {paginatedBins.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-16 text-center text-slate-400 text-xs">
                        <div className="flex flex-col items-center gap-2">
                          <QrCode size={32} className="text-slate-300 dark:text-slate-600 stroke-[1.5]" />
                          <p className="font-semibold text-slate-600 dark:text-slate-400">
                            Tidak ada data tempat sampah teraktivasi yang sesuai filter.
                          </p>
                          <p className="text-[11px] text-slate-400 max-w-sm">
                            Coba ubah kata kunci pencarian, filter status, atau pilih kelurahan lainnya.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedBins.map((bin, idx) => {
                      const latNum = bin.latitude ? Number(bin.latitude) : null;
                      const lngNum = bin.longitude ? Number(bin.longitude) : null;
                      const hasCoords = latNum !== null && lngNum !== null && latNum !== 0 && lngNum !== 0;
                      const { tanggal, jam } = formatTanggalLengkap(bin.tanggalAktivasi || bin.createdAt);
                      const catInfo = getBinCategoryInfo(bin.qrCode, bin.kategoriNama);
                      const rowNumber = pageSize === "ALL" ? idx + 1 : (page - 1) * (pageSize as number) + idx + 1;

                      return (
                        <tr
                          key={bin.id}
                          className="hover:bg-slate-50/90 dark:hover:bg-slate-800/50 transition-colors group"
                        >
                          {/* 1. Nomor Urut */}
                          <td className="p-3.5 pl-5 text-slate-400 font-mono font-semibold">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
                              #{rowNumber}
                            </span>
                          </td>

                          {/* 2. QR Code dengan Icon Visual Interaktif */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-3">
                              {/* Icon QR Interaktif (Klik untuk Preview) */}
                              <button
                                type="button"
                                onClick={() => setPreviewBin(bin)}
                                title="Klik untuk Pratinjau & Cetak Poster QR"
                                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-200 cursor-pointer shadow-xs group-hover:scale-105 ${
                                  catInfo.isOrganik
                                    ? "bg-emerald-50 dark:bg-emerald-950/70 border-emerald-300/80 dark:border-emerald-700/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
                                    : catInfo.isAnorganik
                                    ? "bg-amber-50 dark:bg-amber-950/70 border-amber-300/80 dark:border-amber-700/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100"
                                    : "bg-blue-50 dark:bg-blue-950/70 border-blue-300/80 dark:border-blue-700/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100"
                                }`}
                              >
                                <QrCode size={19} />
                              </button>

                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-black text-slate-900 dark:text-slate-100 text-xs md:text-[13px] tracking-tight">
                                    {bin.qrCode || "-"}
                                  </span>
                                  {bin.qrCode && (
                                    <button
                                      type="button"
                                      onClick={() => handleCopyQr(bin.id, bin.qrCode)}
                                      className="p-1 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                      title="Salin QR Code"
                                    >
                                      {copiedQrId === bin.id ? (
                                        <Check size={13} className="text-emerald-600" />
                                      ) : (
                                        <Copy size={13} />
                                      )}
                                    </button>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                                  <span>ID Unit: {bin.id.slice(0, 8)}...</span>
                                  {bin.pemilikNama && (
                                    <span className="text-slate-600 dark:text-slate-400">
                                      • Warga: {bin.pemilikNama}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 3. Jenis Wadah (Organik vs Anorganik) */}
                          <td className="p-3.5">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10.5px] font-extrabold border ${catInfo.badgeClass}`}
                            >
                              {catInfo.icon}
                              <span>{catInfo.label}</span>
                            </span>
                          </td>

                          {/* 4. Wilayah (Kelurahan & RW) */}
                          <td className="p-3.5">
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                  {bin.kelurahan || "Coblong"}
                                </span>
                              </div>
                              <div>
                                <span className="inline-block px-2 py-0.2 rounded-md text-[10.5px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                  {bin.rwNama && bin.rwNama !== "-" ? bin.rwNama : "RW -"}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* 5. Status Operasional */}
                          <td className="p-3.5">
                            <div className="flex flex-col gap-1">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold w-fit ${getStatusBadge(bin.status)}`}
                              >
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    (bin.status || "").includes("ACTIVE")
                                      ? "bg-emerald-500 animate-pulse ring-2 ring-emerald-500/20"
                                      : "bg-blue-500"
                                  }`}
                                />
                                <span>{getStatusLabel(bin.status)}</span>
                              </span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 pl-1">
                                {(bin.status || "").includes("ACTIVE")
                                  ? "Siap Operasi & Pemilahan"
                                  : "Dalam Distribusi Petugas"}
                              </span>
                            </div>
                          </td>

                          {/* 6. Tanggal & Jam Aktivasi */}
                          <td className="p-3.5">
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                                <Calendar size={12} className="text-slate-400 shrink-0" />
                                <span>{tanggal}</span>
                              </div>
                              {jam && (
                                <span className="text-[10.5px] text-slate-400 dark:text-slate-500 pl-4 font-mono">
                                  {jam}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 7. Navigasi Peta Google Maps */}
                          <td className="p-3.5 pr-5 text-right">
                            {hasCoords ? (
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${latNum},${lngNum}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-300 text-[11px] font-bold transition cursor-pointer border border-blue-200 dark:border-blue-800/60"
                                title={`Buka Titik Koordinat di Google Maps (${latNum}, ${lngNum})`}
                              >
                                <ExternalLink size={12} />
                                <span>Peta</span>
                              </a>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-600 text-[10.5px] italic px-2">
                                Tanpa GPS
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* ── Footer Paginasi & Keterangan ─────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3.5 bg-slate-50/90 dark:bg-slate-800/70 border-t border-slate-200 dark:border-slate-800 gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>
                  Menampilkan{" "}
                  <strong className="text-slate-800 dark:text-slate-200">
                    {filteredAndSortedBins.length === 0
                      ? 0
                      : pageSize === "ALL"
                      ? 1
                      : (page - 1) * (pageSize as number) + 1}
                  </strong>
                  {" "}–{" "}
                  <strong className="text-slate-800 dark:text-slate-200">
                    {pageSize === "ALL"
                      ? filteredAndSortedBins.length
                      : Math.min(page * (pageSize as number), filteredAndSortedBins.length)}
                  </strong>
                  {" "}dari{" "}
                  <strong className="text-slate-800 dark:text-slate-200">
                    {filteredAndSortedBins.length}
                  </strong>
                  {" "}unit terdata
                </span>
                {pageSize === "ALL" && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">
                    Semua Data Tampil Terurut
                  </span>
                )}
              </div>

              {pageSize !== "ALL" && totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                    aria-label="Halaman sebelumnya"
                  >
                    <ChevronLeft size={15} />
                  </button>

                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 px-2">
                    Halaman {page} dari {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                    aria-label="Halaman berikutnya"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Modal Pratinjau & Cetak Poster QR Code ────────────────────────────── */}
      {previewBin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            {(() => {
              const catInfo = getBinCategoryInfo(previewBin.qrCode, previewBin.kategoriNama);
              const { tanggal, jam } = formatTanggalLengkap(previewBin.tanggalAktivasi || previewBin.createdAt);
              const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&margin=1&data=${encodeURIComponent(
                previewBin.qrCode
              )}`;

              return (
                <>
                  <div
                    className={`p-6 border-b ${
                      catInfo.isOrganik
                        ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800"
                        : catInfo.isAnorganik
                        ? "bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800"
                        : "bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800"
                    } flex items-center justify-between`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          catInfo.isOrganik
                            ? "bg-emerald-600 text-white"
                            : catInfo.isAnorganik
                            ? "bg-amber-600 text-white"
                            : "bg-blue-600 text-white"
                        }`}
                      >
                        <QrCode size={20} />
                      </div>
                      <div>
                        <span
                          className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            catInfo.isOrganik
                              ? "bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200"
                              : catInfo.isAnorganik
                              ? "bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200"
                              : "bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-200"
                          }`}
                        >
                          Wadah {catInfo.label}
                        </span>
                        <h3 className="text-base font-black text-slate-900 dark:text-slate-100 mt-0.5 font-mono">
                          {previewBin.qrCode}
                        </h3>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPreviewBin(null)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-6 space-y-5">
                    {/* Visual QR Card */}
                    <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <div className="w-48 h-48 bg-white p-3 rounded-2xl shadow-md border border-slate-200 flex items-center justify-center">
                        <img
                          src={qrImageUrl}
                          alt={`QR Code ${previewBin.qrCode}`}
                          className="w-full h-full object-contain"
                          crossOrigin="anonymous"
                        />
                      </div>

                      <div className="mt-3 text-center">
                        <p className="text-xs font-mono font-black text-slate-800 dark:text-slate-200">
                          {previewBin.qrCode}
                        </p>
                        <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                          Pindai menggunakan Aplikasi Mobile BERSEKA
                        </p>
                      </div>
                    </div>

                    {/* Information Grid */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Kelurahan &amp; RW
                        </span>
                        <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                          {previewBin.kelurahan || "Coblong"} • {previewBin.rwNama || "RW -"}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Status Operasional
                        </span>
                        <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                          {getStatusLabel(previewBin.status)}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Waktu Teraktivasi
                        </span>
                        <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                          {tanggal} {jam && `• ${jam}`}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Koordinat GPS
                        </span>
                        <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 font-mono text-[11px] truncate">
                          {previewBin.latitude && previewBin.longitude
                            ? `${Number(previewBin.latitude).toFixed(5)}, ${Number(previewBin.longitude).toFixed(5)}`
                            : "Belum tercatat"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer Actions */}
                  <div className="p-5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => handleCopyQr(previewBin.id, previewBin.qrCode)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
                    >
                      <Copy size={13} />
                      <span>Salin Kode</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {previewBin.latitude && previewBin.longitude && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${previewBin.latitude},${previewBin.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-600 dark:text-blue-300 text-xs font-bold transition cursor-pointer border border-blue-200 dark:border-blue-800"
                        >
                          <Compass size={13} />
                          <span>Buka Peta</span>
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => handlePrintPoster(previewBin)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer shadow-xs"
                      >
                        <Printer size={13} />
                        <span>Cetak Poster</span>
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default TempatSampahAktifPage;
