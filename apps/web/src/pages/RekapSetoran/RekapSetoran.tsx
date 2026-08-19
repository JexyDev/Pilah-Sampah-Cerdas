/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Component: Rekapitulasi Setoran Sampah (Laporan Audit & Transaksi Hilir)
 * - Scope Wilayah: Rukun Warga (Terstandarisasi dengan Master Data & Hasil Klasifikasi)
 * - Detail Modal & Visual Design: 100% Konsisten dengan MasterDatasetKlasifikasi (Hasil Klasifikasi AI)
 * - 100% End-to-End API Integration dengan Backend Express PostgreSQL (`/api/v1/transactions/deposits`)
 * - Mobile REST API Compatible (Standard Payload Contracts)
 */

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Scale,
  Sparkles,
  Loader2,
  Calendar,
  CheckCircle2,
  X,
  Receipt,
  RotateCcw,
  Bot,
  Phone,
  FileSpreadsheet,
  Eye,
  CheckCheck,
  Layers,
} from "lucide-react";
import { Pagination } from "../../components/common/Pagination";
import { EmptyTableState } from "../../components/common/EmptyTableState";
import api from "../../services/api";
import showToast from "../../utils/showToast";
import { getProfilePhotoUrl, handleAvatarError } from "../../utils/photoUtils";
import PageHeader from "../../components/common/PageHeader";

export default function RekapSetoran() {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Detail Modal & Image Lightbox State
  const [selectedDeposit, setSelectedDeposit] = useState<any | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Filters State
  const [filterKategori, setFilterKategori] = useState("ALL");
  const [filterRw, setFilterRw] = useState("");
  const [filterPeriode, setFilterPeriode] = useState("ALL");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchDeposits = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await api.get("/transactions/deposits");
      if (response.data?.success && Array.isArray(response.data.data)) {
        setDeposits(response.data.data);
      } else {
        setDeposits([]);
      }
    } catch (err: any) {
      console.error("Gagal memuat data setoran:", err);
      showToast.error("Gagal memuat rekapitulasi setoran");
      setDeposits([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, []);

  const filteredDeposits = useMemo(() => {
    return deposits.filter((d) => {
      // 1. Filter Kategori
      if (filterKategori !== "ALL") {
        const catUpper = (d.jenis || "").toUpperCase();
        if (filterKategori === "ORGANIC" && !catUpper.includes("ORGANIK") && !catUpper.includes("ORGANIC")) return false;
        if (filterKategori === "NON_ORGANIC" && !catUpper.includes("ANORGANIK") && !catUpper.includes("NON_ORGANIC") && !catUpper.includes("NON-ORGANIC")) return false;
        if (filterKategori === "RESIDU" && !catUpper.includes("RESIDU")) return false;
      }

      // 2. Filter Rukun Warga & Warga Search Query
      if (filterRw.trim() !== "") {
        const query = filterRw.toLowerCase().trim();
        const wargaNama = (d.warga || "").toLowerCase();
        const rwNama = (d.rw || d.rwName || "").toLowerCase();
        const kelNama = (d.kelurahan || "").toLowerCase();
        const phone = (d.phone || "").toLowerCase();

        if (
          !wargaNama.includes(query) &&
          !rwNama.includes(query) &&
          !kelNama.includes(query) &&
          !phone.includes(query)
        ) {
          return false;
        }
      }

      // 3. Filter Periode
      if (filterPeriode !== "ALL") {
        const depositDate = new Date(d.waktu);
        const limitDate = new Date();
        if (filterPeriode === "7d") {
          limitDate.setDate(limitDate.getDate() - 7);
        } else if (filterPeriode === "30d") {
          limitDate.setDate(limitDate.getDate() - 30);
        } else if (filterPeriode === "90d") {
          limitDate.setDate(limitDate.getDate() - 90);
        }
        if (depositDate < limitDate) return false;
      }

      return true;
    });
  }, [deposits, filterKategori, filterRw, filterPeriode]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterKategori, filterRw, filterPeriode, itemsPerPage]);

  // Pagination Calculation
  const totalItems = filteredDeposits.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentItems = filteredDeposits.slice(startIndex, endIndex);

  // Totals
  const totalWeight = useMemo(() => filteredDeposits.reduce((acc, curr) => acc + (Number(curr.berat) || 0), 0), [filteredDeposits]);
  const totalPoints = useMemo(() => Math.round(filteredDeposits.reduce((acc, curr) => acc + (Number(curr.poin) || 0), 0)), [filteredDeposits]);
  const averageConfidence = useMemo(() => {
    if (filteredDeposits.length === 0) return 0;
    const sum = filteredDeposits.reduce((acc, curr) => acc + (Number(curr.confidence) || 0), 0);
    return Math.round(sum / filteredDeposits.length);
  }, [filteredDeposits]);

  // Format Rukun Warga Label Helper
  const formatRukunWarga = (rawRw?: string) => {
    if (!rawRw) return "RW 01";
    if (rawRw.includes("/")) {
      const parts = rawRw.split("/");
      const rwPart = parts.find((p) => p.toLowerCase().includes("rw")) || parts[parts.length - 1];
      return rwPart.trim();
    }
    return rawRw;
  };

  const handleExportCSV = () => {
    if (!filteredDeposits || filteredDeposits.length === 0) {
      showToast.error("Tidak ada data setoran untuk diekspor pada periode/filter yang dipilih.");
      return;
    }

    const headers = ["ID", "Warga", "No. Telepon", "Rukun Warga", "Kelurahan", "Jenis Sampah", "Berat (Kg)", "Poin", "Waktu Setor", "Akurasi AI (%)", "Status"];
    const csvRows = [headers.join(",")];

    filteredDeposits.forEach((d) => {
      const row = [
        `"${d.id}"`,
        `"${d.warga || "-"}"`,
        `"${d.phone || "-"}"`,
        `"${formatRukunWarga(d.rw || d.rtRw)}"`,
        `"${d.kelurahan || "Coblong"}"`,
        `"${d.jenis || "Organik"}"`,
        d.berat || 0,
        Math.round(d.poin || 0),
        `"${new Date(d.waktu).toLocaleString("id-ID")}"`,
        `${d.confidence || 95}%`,
        `"${d.status || "Selesai"}"`,
      ];
      csvRows.push(row.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rekapitulasi-setoran-sampah-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    showToast.success(`Berhasil mengekspor ${filteredDeposits.length} data setoran!`);
  };

  const resetFilters = () => {
    setFilterRw("");
    setFilterKategori("ALL");
    setFilterPeriode("ALL");
  };

  const LeafIcon: React.FC<{ size?: number }> = ({ size = 12 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.4 19 2c1 2 2 4.1 2 9 0 5-4 9-10 9z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );

  const renderCategoryBadge = (cat?: string) => {
    const jenisUpper = (cat || "").toUpperCase();
    if (jenisUpper.includes("ORGANIK") || jenisUpper.includes("ORGANIC")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-emerald-100/90 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/50 shadow-2xs">
          <LeafIcon size={13} /> Organik
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-amber-100/90 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50 shadow-2xs">
        <Layers size={13} /> Anorganik
      </span>
    );
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 text-slate-800 dark:text-slate-100 font-sans">
      {/* Clean Enterprise Page Header */}
      <PageHeader
        icon={Receipt}
        category="Audit Transaksi Pemilahan"
        scope="Kecamatan Coblong"
        title="Pemantauan & Rekapitulasi"
        description="Laporan pemantauan dan rekapitulasi transaksi penyetoran sampah terpilah warga di tingkat Rukun Warga secara terpadu dan akuntabel."
        actions={
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <FileSpreadsheet size={15} /> <span>Ekspor Laporan CSV</span>
          </button>
        }
      />

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Total Weight Card */}
        <div className="bg-white dark:bg-slate-900 p-4.5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center gap-3.5 group hover:border-emerald-300 dark:hover:border-emerald-700/60 transition-all">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 rounded-2xl shrink-0 border border-emerald-100 dark:border-emerald-700/50 group-hover:scale-105 transition-transform">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider">Total Berat Sampah</p>
            <p className="text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5">
              {totalWeight >= 1000 ? (totalWeight / 1000).toFixed(1) : totalWeight.toLocaleString("id-ID", { maximumFractionDigits: 1 })}{" "}
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{totalWeight >= 1000 ? "Ton" : "Kg"}</span>
            </p>
          </div>
        </div>

        {/* Total Transactions Card */}
        <div className="bg-white dark:bg-slate-900 p-4.5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center gap-3.5 group hover:border-blue-300 dark:hover:border-blue-700/60 transition-all">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-2xl shrink-0 border border-blue-100 dark:border-blue-700/50 group-hover:scale-105 transition-transform">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider">Total Transaksi</p>
            <p className="text-lg font-black text-blue-700 dark:text-blue-400 mt-0.5">{totalItems} <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Setoran</span></p>
          </div>
        </div>

        {/* Gamification Points Card */}
        <div className="bg-white dark:bg-slate-900 p-4.5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center gap-3.5 group hover:border-amber-300 dark:hover:border-amber-700/60 transition-all">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-2xl shrink-0 border border-amber-100 dark:border-amber-700/50 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider">Poin Terdistribusi</p>
            <p className="text-lg font-black text-amber-700 dark:text-amber-400 mt-0.5">{totalPoints.toLocaleString("id-ID")} <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pts</span></p>
          </div>
        </div>

        {/* AI Confidence Card */}
        <div className="bg-white dark:bg-slate-900 p-4.5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center gap-3.5 group hover:border-purple-300 dark:hover:border-purple-700/60 transition-all">
          <div className="p-3 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-2xl shrink-0 border border-purple-100 dark:border-purple-700/50 group-hover:scale-105 transition-transform">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider">Akurasi Verifikasi AI</p>
            <p className="text-lg font-black text-purple-700 dark:text-purple-400 mt-0.5">{averageConfidence}% <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">(Presisi)</span></p>
          </div>
        </div>
      </div>

      {/* Filter & Search Controls Bar */}
      <div className="bg-white dark:bg-slate-900 p-4.5 sm:p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            value={filterRw}
            onChange={(e) => setFilterRw(e.target.value)}
            placeholder="Cari nama warga, Rukun Warga, kelurahan, no. telp..."
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-[#009966] focus:bg-white dark:focus:bg-slate-800 transition-all"
          />
          {filterRw && (
            <button
              onClick={() => setFilterRw("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Kategori Filter */}
          <select
            value={filterKategori}
            onChange={(e) => setFilterKategori(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-[#009966] transition cursor-pointer"
          >
            <option value="ALL">Semua Kategori Sampah</option>
            <option value="ORGANIC">Organik</option>
            <option value="NON_ORGANIC">Anorganik</option>
            <option value="RESIDU">Residu</option>
          </select>

          {/* Periode Filter */}
          <select
            value={filterPeriode}
            onChange={(e) => setFilterPeriode(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-[#009966] transition cursor-pointer"
          >
            <option value="ALL">Semua Periode</option>
            <option value="7d">7 Hari Terakhir</option>
            <option value="30d">30 Hari Terakhir</option>
            <option value="90d">90 Hari Terakhir</option>
          </select>

          {/* Reset Filters Button */}
          {(filterRw || filterKategori !== "ALL" || filterPeriode !== "ALL") && (
            <button
              onClick={resetFilters}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw size={13} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Data Table Card */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <Calendar size={18} className="text-[#009966] dark:text-emerald-400" /> Rincian Riwayat Setoran Audit
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Menampilkan {totalItems === 0 ? 0 : `${startIndex + 1} - ${endIndex}`} dari {totalItems} data setoran terverifikasi (Klik baris untuk detail)
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400 dark:text-slate-500">
            <Loader2 className="animate-spin text-[#009966] dark:text-emerald-400" size={28} />
            <p className="text-xs font-bold">Memuat data rekapitulasi setoran...</p>
          </div>
        ) : currentItems.length === 0 ? (
          <EmptyTableState
            entityName="Setoran Sampah"
            isSearch={!!(filterRw || filterKategori !== "ALL" || filterPeriode !== "ALL")}
            onResetSearch={resetFilters}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="text-[10.5px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80">
                  <th className="py-3.5 px-4 rounded-l-2xl">ID Transaksi</th>
                  <th className="py-3.5 px-4">Nama Warga</th>
                  <th className="py-3.5 px-4">Rukun Warga</th>
                  <th className="py-3.5 px-4">Kategori Sampah</th>
                  <th className="py-3.5 px-4 text-right">Berat Timbangan (Kg)</th>
                  <th className="py-3.5 px-4 text-center">Poin Terdistribusi</th>
                  <th className="py-3.5 px-4">Waktu Setor</th>
                  <th className="py-3.5 px-4 text-center rounded-r-2xl">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                {currentItems.map((item) => {
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedDeposit(item)}
                      className="hover:bg-slate-50/90 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                    >
                      {/* ID */}
                      <td className="py-3.5 px-4 font-mono font-black text-slate-900 dark:text-slate-100 tracking-tight group-hover:text-[#009966] dark:group-hover:text-emerald-400">
                        {item.id.length > 16 ? `${item.id.substring(0, 12)}...` : item.id}
                      </td>

                      {/* Warga */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100 align-middle">
                        {item.warga || "Warga Coblong"}
                        {item.phone && (
                          <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                            {item.phone}
                          </span>
                        )}
                      </td>

                      {/* Rukun Warga */}
                      <td className="py-3.5 px-4 whitespace-nowrap align-middle">
                        <span className="inline-block bg-[#eef5ff] dark:bg-blue-950/60 text-[#2b6cb0] dark:text-blue-300 font-bold text-xs px-3 py-1 rounded-xl border border-[#c3dafe] dark:border-blue-800/50">
                          {formatRukunWarga(item.rw || item.rtRw)}
                        </span>
                      </td>

                      {/* Kategori Sampah */}
                      <td className="py-3.5 px-4 align-middle">
                        {renderCategoryBadge(item.jenis)}
                      </td>

                      {/* Berat */}
                      <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 dark:text-slate-100 text-sm align-middle">
                        {item.berat}
                      </td>

                      {/* Poin */}
                      <td className="py-3.5 px-4 text-center font-mono font-black text-[#009966] dark:text-emerald-400 text-xs align-middle">
                        +{Math.round(item.poin || 0)} Pts
                      </td>

                      {/* Waktu */}
                      <td className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap align-middle">
                        {new Date(item.waktu).toLocaleString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      {/* Action Eye Inspection Button (Identik MasterDatasetKlasifikasi) */}
                      <td className="py-3.5 px-4 text-center align-middle">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDeposit(item);
                          }}
                          title="Inspeksi Detail Transaksi"
                          className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 mx-auto flex items-center justify-center transition-all cursor-pointer active:scale-95"
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* TrashCare Standardized Pagination */}
        {!loading && filteredDeposits.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredDeposits.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            itemsPerPageOptions={[10, 25, 50, 100]}
          />
        )}
      </div>

      {/* INSPECTION DETAIL MODAL (100% KONSISTEN DENGAN MASTER DATASET KLASIFIKASI AI) */}
      {selectedDeposit && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 max-w-xl w-full overflow-hidden">
            {/* Modal Header (Emerald Gradient Light - Identik MasterDatasetKlasifikasi) */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-50/80 to-white dark:from-slate-800/80 dark:to-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
                  <Eye size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    Inspeksi Detail Transaksi Setoran
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-400">
                    ID Transaksi: <span className="font-mono text-emerald-700 dark:text-emerald-400">{selectedDeposit.id}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDeposit(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Optional Photo Sampah Preview Box (Identik MasterDatasetKlasifikasi) */}
              {selectedDeposit.fotoUrl && (
                <div
                  onClick={() => setPreviewImageUrl(selectedDeposit.fotoUrl)}
                  className="w-full h-52 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 relative group shadow-2xs cursor-pointer"
                >
                  <img
                    src={selectedDeposit.fotoUrl}
                    alt="Foto Sampah"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                    <Eye size={20} />
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 p-2.5 rounded-xl bg-slate-900/80 backdrop-blur-md text-white flex justify-between items-center text-xs font-bold">
                    <span>Setor: {new Date(selectedDeposit.waktu).toLocaleString("id-ID")}</span>
                    <span className="font-mono text-emerald-300">{selectedDeposit.lokasi || "Tempat Sampah Terdaftar"}</span>
                  </div>
                </div>
              )}

              {/* Citizen Card Profile */}
              <div className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700">
                <div className="w-10 h-10 rounded-2xl bg-[#009966] text-white flex items-center justify-center font-black text-sm shrink-0 overflow-hidden shadow-2xs">
                  {selectedDeposit.fotoProfil ? (
                    <img
                      src={getProfilePhotoUrl(selectedDeposit.fotoProfil, selectedDeposit.warga)}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => handleAvatarError(e, selectedDeposit.warga)}
                    />
                  ) : (
                    <span>{selectedDeposit.warga?.[0]?.toUpperCase() || "W"}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-xs sm:text-sm truncate">{selectedDeposit.warga || "Warga Coblong"}</h4>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="inline-block bg-[#eef5ff] dark:bg-blue-950/60 text-[#2b6cb0] dark:text-blue-300 font-bold text-[11px] px-2.5 py-0.5 rounded-lg border border-[#c3dafe] dark:border-blue-800/50">
                      {formatRukunWarga(selectedDeposit.rw || selectedDeposit.rtRw)}
                    </span>
                    <span className="inline-block bg-[#e8f8f0] dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-300 font-bold text-[11px] px-2.5 py-0.5 rounded-lg border border-[#b8ebd0] dark:border-emerald-800/50">
                      Kel. {selectedDeposit.kelurahan || "Coblong"}
                    </span>
                    {selectedDeposit.phone && (
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                        <Phone size={11} className="text-[#009966] dark:text-emerald-400" /> {selectedDeposit.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* AI Confidence Composition Breakdown (Identik MasterDatasetKlasifikasi) */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-100">Hasil Inferensi &amp; Akurasi Verifikasi AI</span>
                  {renderCategoryBadge(selectedDeposit.jenis)}
                </div>

                {(() => {
                  const jenisUpper = (selectedDeposit.jenis || "").toUpperCase();
                  const isOrg = jenisUpper.includes("ORGANIK") || jenisUpper.includes("ORGANIC");
                  const conf = Number(selectedDeposit.confidence) || 0;
                  const org = selectedDeposit.organikPercent ?? (isOrg ? conf : 100 - conf);
                  const inorg = selectedDeposit.anorganikPercent ?? (100 - org);
                  return (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-black">
                        <span className="text-emerald-700 dark:text-emerald-400">🌱 Organik: {org}%</span>
                        <span className="text-amber-700 dark:text-amber-400">📦 Anorganik: {inorg}%</span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-700 flex overflow-hidden border border-slate-300/60 dark:border-slate-600 shadow-2xs">
                        <div
                          className="bg-emerald-500 h-full transition-all duration-300"
                          style={{ width: `${org}%` }}
                          title={`Organik: ${org}%`}
                        />
                        <div
                          className="bg-amber-500 h-full transition-all duration-300"
                          style={{ width: `${inorg}%` }}
                          title={`Anorganik: ${inorg}%`}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] font-bold text-slate-400 dark:text-slate-400 pt-1">
                        <span>Akurasi Confidence: {conf}%</span>
                        <span>Estimasi Berat: {selectedDeposit.berat} Kg</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Specifications Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400">Berat Timbangan</span>
                  <p className="font-mono font-black text-[#009966] dark:text-emerald-400 text-sm">{selectedDeposit.berat} Kg</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400">Poin Terdistribusi</span>
                  <p className="font-mono font-black text-amber-600 dark:text-amber-400 text-sm">+{Math.round(selectedDeposit.poin || 0)} Pts</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400">Status Audit</span>
                  <p className="font-extrabold text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-1">
                    <CheckCircle2 size={13} /> {selectedDeposit.status || "Selesai"}
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400">Waktu Pencatatan</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                    {new Date(selectedDeposit.waktu).toLocaleString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              {/* Verified Full-Stack Footer Box */}
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-700/50 text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
                <CheckCheck size={16} className="text-[#009966] dark:text-emerald-400 shrink-0" />
                <span>Terverifikasi real-time terintegrasi penuh: Aplikasi Mobile &rarr; Backend Express API &rarr; Database PostgreSQL.</span>
              </div>
            </div>

            {/* Modal Action Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 flex justify-end">
              <button
                onClick={() => setSelectedDeposit(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition cursor-pointer"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX PREVIEW MODAL */}
      {previewImageUrl && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div className="relative max-w-3xl w-full max-h-[90vh] flex items-center justify-center">
            <img
              src={previewImageUrl}
              alt="Preview Sampah"
              className="max-w-full max-h-[85vh] rounded-3xl object-contain shadow-2xl border border-white/20"
            />
            <button
              onClick={() => setPreviewImageUrl(null)}
              className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold flex items-center justify-center shadow-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
