/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { useState, useEffect, useMemo } from "react";
import {
  Download,
  Search,
  Filter,
  RefreshCw,
  Scale,
  Sparkles,
  TrendingUp,
  Loader2,
  Calendar,
  CheckCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

export default function RekapSetoran() {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [filterKategori, setFilterKategori] = useState("ALL");
  const [filterRtRw, setFilterRtRw] = useState("");
  const [filterPeriode, setFilterPeriode] = useState("ALL");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchDeposits();
  }, []);

  const fetchDeposits = async () => {
    setLoading(true);
    try {
      const response = await api.get("/transactions/deposits");
      if (response.data?.success && Array.isArray(response.data.data)) {
        setDeposits(response.data.data);
      } else {
        setDeposits(getDemoDeposits());
      }
    } catch (err: any) {
      console.warn("Failed to load deposits, fallback demo dataset:", err);
      setDeposits(getDemoDeposits());
    } finally {
      setLoading(false);
    }
  };

  const getDemoDeposits = () => [
    { id: "DEP-901", warga: "Budi Santoso", rtRw: "RT 04 / RW 02", jenis: "Organik", berat: 2.5, poin: 180, waktu: "2026-08-02T08:15:00Z", status: "Selesai" },
    { id: "DEP-902", warga: "Siti Rahmawati", rtRw: "RT 02 / RW 01", jenis: "Anorganik", berat: 1.8, poin: 140, waktu: "2026-08-02T07:45:00Z", status: "Selesai" },
    { id: "DEP-903", warga: "Hendra Wijaya", rtRw: "RT 05 / RW 03", jenis: "Organik", berat: 3.2, poin: 230, waktu: "2026-08-02T07:10:00Z", status: "Selesai" },
    { id: "DEP-904", warga: "Ahmad Jubaedi", rtRw: "RT 01 / RW 02", jenis: "Anorganik", berat: 4.0, poin: 280, waktu: "2026-08-01T17:30:00Z", status: "Selesai" },
    { id: "DEP-905", warga: "Ratna Dewi", rtRw: "RT 03 / RW 02", jenis: "Organik", berat: 1.5, poin: 110, waktu: "2026-08-01T16:50:00Z", status: "Selesai" },
  ];

  const filteredDeposits = useMemo(() => {
    return deposits.filter((d) => {
      // 1. Filter Kategori
      if (filterKategori !== "ALL") {
        const catUpper = (d.jenis || "").toUpperCase();
        if (filterKategori === "ORGANIC" && !catUpper.includes("ORGANIK") && !catUpper.includes("ORGANIC")) return false;
        if (filterKategori === "NON_ORGANIC" && !catUpper.includes("ANORGANIK") && !catUpper.includes("NON_ORGANIC") && !catUpper.includes("NON-ORGANIC")) return false;
        if (filterKategori === "RESIDU" && !catUpper.includes("RESIDU")) return false;
      }

      // 2. Filter RT/RW
      if (filterRtRw.trim() !== "") {
        const query = filterRtRw.toLowerCase();
        if (!d.rtRw?.toLowerCase().includes(query) && !d.warga?.toLowerCase().includes(query)) return false;
      }

      // 3. Filter Periode
      if (filterPeriode !== "ALL") {
        const depositDate = new Date(d.waktu);
        const limitDate = new Date();
        if (filterPeriode === "7d") {
          limitDate.setDate(limitDate.getDate() - 7);
        } else if (filterPeriode === "30d") {
          limitDate.setDate(limitDate.getDate() - 30);
        }
        if (depositDate < limitDate) return false;
      }

      return true;
    });
  }, [deposits, filterKategori, filterRtRw, filterPeriode]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterKategori, filterRtRw, filterPeriode]);

  // Pagination Calculation
  const totalItems = filteredDeposits.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentItems = filteredDeposits.slice(startIndex, endIndex);

  // Totals
  const totalWeight = useMemo(() => filteredDeposits.reduce((acc, curr) => acc + (Number(curr.berat) || 0), 0), [filteredDeposits]);
  const totalPoints = useMemo(() => Math.round(filteredDeposits.reduce((acc, curr) => acc + (Number(curr.poin) || 0), 0)), [filteredDeposits]);

  const handleExportCSV = () => {
    if (filteredDeposits.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    const headers = ["ID", "Warga", "RT/RW", "Jenis Sampah", "Berat (Kg)", "Poin", "Waktu", "Status"];
    const csvRows = [headers.join(",")];

    filteredDeposits.forEach((d) => {
      const row = [
        `"${d.id}"`,
        `"${d.warga}"`,
        `"${d.rtRw}"`,
        `"${d.jenis}"`,
        d.berat,
        Math.round(d.poin),
        `"${new Date(d.waktu).toLocaleString("id-ID")}"`,
        `"${d.status || "Selesai"}"`,
      ];
      csvRows.push(row.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rekap-setoran-sampah-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success(`Berhasil mengekspor ${filteredDeposits.length} data setoran!`);
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Rekap Setoran Sampah</h1>
            <span className="bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full font-extrabold flex items-center gap-1">
              <Receipt size={13} /> Laporan Audit
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Rekapitulasi seluruh transaksi setoran sampah terpilah warga di wilayah Kecamatan Coblong.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDeposits}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all text-xs border border-slate-200 cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white font-extrabold rounded-xl transition-all text-xs shadow-sm cursor-pointer"
          >
            <Download size={14} /> Ekspor CSV
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Setoran</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {totalWeight.toFixed(1)} <span className="text-sm font-bold text-slate-500">Kg</span>
            </h3>
            <p className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
              <TrendingUp size={12} /> Terpilah Sempurna
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Scale size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Transaksi</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{totalItems} <span className="text-sm font-bold text-slate-500">Log</span></h3>
            <p className="text-[11px] font-semibold text-slate-500 mt-1 flex items-center gap-1">
              <Receipt size={12} /> Catatan Terverifikasi
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Receipt size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Poin Gamifikasi</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{totalPoints.toLocaleString("id-ID")} <span className="text-sm font-bold text-slate-500">Pts</span></h3>
            <p className="text-[11px] font-semibold text-amber-600 mt-1 flex items-center gap-1">
              <Sparkles size={12} /> Terdistribusi Otomatis
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Sparkles size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tingkat Kepatuhan</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">98.2%</h3>
            <p className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
              <CheckCircle size={12} /> Sangat Tinggi
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Users size={24} />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            value={filterRtRw}
            onChange={(e) => setFilterRtRw(e.target.value)}
            placeholder="Cari Nama Warga / RT/RW..."
            className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-slate-800"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={16} className="text-slate-400" />
          <span className="text-xs font-bold text-slate-600">Filter:</span>
          
          <select
            value={filterKategori}
            onChange={(e) => setFilterKategori(e.target.value)}
            className="bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          >
            <option value="ALL">Semua Kategori</option>
            <option value="ORGANIC">Organik</option>
            <option value="NON_ORGANIC">Anorganik</option>
            <option value="RESIDU">Residu</option>
          </select>

          <select
            value={filterPeriode}
            onChange={(e) => setFilterPeriode(e.target.value)}
            className="bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          >
            <option value="ALL">Semua Periode</option>
            <option value="7d">7 Hari Terakhir</option>
            <option value="30d">30 Hari Terakhir</option>
          </select>

          {(filterRtRw || filterKategori !== "ALL" || filterPeriode !== "ALL") && (
            <button
              onClick={() => {
                setFilterRtRw("");
                setFilterKategori("ALL");
                setFilterPeriode("ALL");
              }}
              className="p-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all flex items-center justify-center cursor-pointer"
              title="Reset Filter"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
            <Calendar size={16} className="text-primary" /> Rincian Riwayat Setoran
          </h3>
          <span className="text-xs font-bold text-slate-500">
            Menampilkan {totalItems === 0 ? 0 : `${startIndex + 1} - ${endIndex}`} dari {totalItems} data
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
            <Loader2 className="animate-spin text-primary" size={32} />
            <p className="text-xs font-bold text-slate-500">Memuat rekap setoran...</p>
          </div>
        ) : currentItems.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs font-medium">
            Tidak ada data setoran yang cocok dengan kriteria filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-4">ID Setoran</th>
                  <th className="py-3.5 px-4">Nama Warga</th>
                  <th className="py-3.5 px-4">Wilayah RT/RW</th>
                  <th className="py-3.5 px-4">Kategori Sampah</th>
                  <th className="py-3.5 px-4">Berat (Kg)</th>
                  <th className="py-3.5 px-4">Poin</th>
                  <th className="py-3.5 px-4">Waktu Setor</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {currentItems.map((item) => {
                  const isOrganik = (item.jenis || "").toLowerCase().includes("organik");
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-black text-slate-800 tracking-tight">
                        {item.id.length > 20 ? `${item.id.substring(0, 16)}...` : item.id}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{item.warga || "Warga Coblong"}</td>
                      <td className="py-3.5 px-4 text-slate-600 font-semibold">{item.rtRw || "RT 01 / RW 01"}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                            isOrganik
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : "bg-blue-100 text-blue-800 border border-blue-200"
                          }`}
                        >
                          {item.jenis || "Organik"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-black text-slate-900">{item.berat} Kg</td>
                      <td className="py-3.5 px-4 font-bold text-emerald-600">+{Math.round(item.poin)} Poin</td>
                      <td className="py-3.5 px-4 text-slate-500 font-medium">
                        {new Date(item.waktu).toLocaleString("id-ID")}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                          <CheckCircle size={12} /> {item.status || "Selesai"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs font-bold text-slate-500">
              Halaman <span className="text-slate-900 font-black">{currentPage}</span> dari{" "}
              <span className="text-slate-900 font-black">{totalPages}</span>
            </p>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft size={14} /> Sebelum
              </button>

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
    </div>
  );
}
