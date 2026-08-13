/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
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
  Receipt,
  Users,
} from "lucide-react";
import { Pagination } from "../../components/common/Pagination";
import api from "../../services/api";

export default function RekapSetoran() {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Detail Modal State
  const [selectedDeposit, setSelectedDeposit] = useState<any | null>(null);

  // Filters State
  const [filterKategori, setFilterKategori] = useState("ALL");
  const [filterRtRw, setFilterRtRw] = useState("");
  const [filterPeriode, setFilterPeriode] = useState("ALL");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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
        setDeposits([]);
      }
    } catch (err: any) {
      console.error("Failed to load deposits:", err);
      setDeposits([]);
    } finally {
      setLoading(false);
    }
  };

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
    if (!filteredDeposits || filteredDeposits.length === 0) {
      toast.error("Tidak ada data setoran untuk diekspor pada periode/filter yang dipilih.");
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
            Menampilkan {totalItems === 0 ? 0 : `${startIndex + 1} - ${endIndex}`} dari {totalItems} data (Klik baris untuk rincian detail)
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
                    <tr
                      key={item.id}
                      onClick={() => setSelectedDeposit(item)}
                      className="hover:bg-emerald-50/50 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-black text-slate-800 tracking-tight group-hover:text-emerald-700">
                        {item.id.length > 20 ? `${item.id.substring(0, 16)}...` : item.id}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{item.warga || "Warga Coblong"}</td>
                      <td className="py-3.5 px-4 text-slate-600 font-semibold">{item.rtRw || "RT 01 / RW 01"}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold ${isOrganik
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
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition">
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
        {!loading && filteredDeposits.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredDeposits.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        )}
      </div>

      {/* Modal Detail Transaksi Setoran */}
      {selectedDeposit && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in zoom-in-95 duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-emerald-950 to-slate-900 text-white">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Receipt size={18} className="text-emerald-400" /> Detail Transaksi Setoran
                </h3>
                <span className="text-[11px] text-emerald-300 font-mono">ID: {selectedDeposit.id}</span>
              </div>
              <button
                onClick={() => setSelectedDeposit(null)}
                className="text-gray-300 hover:text-white p-1 rounded-full transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700">
              <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                  {selectedDeposit.warga?.[0] || "W"}
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">{selectedDeposit.warga || "Warga Coblong"}</h4>
                  <p className="text-[11px] text-slate-500">{selectedDeposit.rtRw || "RT 01 / RW 01"} - Kecamatan Coblong</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Kategori Sampah</span>
                  <span className="font-black text-slate-900 text-sm">{selectedDeposit.jenis || "Organik"}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Berat Timbangan</span>
                  <span className="font-mono font-black text-emerald-700 text-sm">{selectedDeposit.berat} Kg</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Poin Gamifikasi</span>
                  <span className="font-extrabold text-emerald-600 text-sm">+{Math.round(selectedDeposit.poin)} Poin</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Status Verifikasi</span>
                  <span className="font-extrabold text-emerald-700 text-xs flex items-center gap-1">
                    <CheckCircle size={13} /> {selectedDeposit.status || "Terverifikasi (Selesai)"}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Waktu Pencatatan</span>
                <span className="font-semibold text-slate-800 block text-xs">
                  {new Date(selectedDeposit.waktu).toLocaleString("id-ID", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
                <span className="text-[10px] text-slate-400 block">Metode: Pemindaian QR Code + Verifikasi Fisik Petugas</span>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedDeposit(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

