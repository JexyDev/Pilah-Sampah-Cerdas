/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useEffect, useState, useMemo } from "react";
import { Loader2, MapPin, Search, Download, CheckCircle, Map } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import api from "../../services/api";
import { Pagination } from "../../components/common/Pagination";
import { useAuthStore } from "../../store/useAuthStore";
import toast from "react-hot-toast";

const TAB_LABEL_MAP: Record<string, string> = {
  kecamatan: "Kecamatan",
  kelurahan: "Kelurahan",
  rw: "Rukun Warga",
};

const MasterWilayah: React.FC = () => {
  const { user } = useAuthStore();
  const isReadOnly = ["ADMIN_DLH", "CAMAT", "LURAH", "RT"].includes(user?.peran || "");

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "kecamatan";
  
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await api.get(`/areas/${activeTab}`);
        let fetchedData = response.data.data || [];
        
        // Integrasi data kelurahan untuk tab kecamatan jika deploy belum mengembalikan relasinya
        if (activeTab === "kecamatan") {
          try {
            const kelResponse = await api.get('/areas/kelurahan');
            const kelData = kelResponse.data.data || [];
            fetchedData = fetchedData.map((k: any) => ({
              ...k,
              kelurahans: k.kelurahans?.length > 0 ? k.kelurahans : kelData
            }));
          } catch (e) {
            console.error("Gagal sinkronisasi data kelurahan:", e);
          }
        }
        
        setData(fetchedData);
      } catch (err) {
        console.error(`Gagal memuat master wilayah (${activeTab}):`, err);
        setError(`Gagal memuat data ${TAB_LABEL_MAP[activeTab] || activeTab}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [activeTab]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab, rowsPerPage]);

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase();
    return data.filter((item) => {
      return (
        item.name?.toLowerCase().includes(q) ||
        item.id?.toString().toLowerCase().includes(q) ||
        item.kelurahan?.name?.toLowerCase().includes(q) ||
        item.rw?.name?.toLowerCase().includes(q)
      );
    });
  }, [data, searchQuery]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleTabChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchParams({ tab: e.target.value });
  };

  const handleExportCsv = () => {
    if (!filteredData || filteredData.length === 0) {
      toast.error("Tidak ada data wilayah dalam tabel untuk diekspor.");
      return;
    }

    const headers = ["ID", "Nama Wilayah", "Kelurahan", "RW", "Keterangan"];
    const rows = filteredData.map((item) => [
      `"${item.id || ""}"`,
      `"${item.name || ""}"`,
      `"${item.kelurahan?.name || item.kelurahanNama || "-"}"`,
      `"${item.rw?.name || item.rwNama || "-"}"`,
      `"${activeTab.toUpperCase()}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `master_wilayah_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Berhasil mengekspor data ${activeTab}!`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Master Data Wilayah
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Kelola data hierarki wilayah Kecamatan Coblong, Kelurahan, RW, dan RT.
          </p>
        </div>

        {!isReadOnly && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Download size={15} className="text-slate-500" />
              Ekspor CSV
            </button>
            <button
              onClick={() => alert("Tambah wilayah via UI belum didukung")}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <MapPin size={15} />
              Tambah Wilayah
            </button>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              Total Wilayah
            </p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">
              {data.length}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/60">
            <Map size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              Status Sistem
            </p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">
              Aktif
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60">
            <CheckCircle size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              Tingkat Wilayah
            </p>
            <h3 className="text-lg font-black text-slate-800 mt-1 truncate max-w-[150px]">
              {TAB_LABEL_MAP[activeTab] || activeTab}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200/60">
            <MapPin size={20} />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari ID, Nama Wilayah..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={activeTab}
              onChange={handleTabChange}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="kecamatan">Kecamatan</option>
              <option value="kelurahan">Kelurahan</option>
              <option value="rw">Rukun Warga</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {activeTab === "kecamatan" ? (
                <tr className="bg-slate-50 text-[11px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-4 w-12 text-center">No</th>
                  <th className="py-3.5 px-4">Nama Kecamatan</th>
                  <th className="py-3.5 px-4">Total Kelurahan</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                </tr>
              ) : activeTab === "kelurahan" ? (
                <tr className="bg-slate-50 text-[11px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-4 w-12 text-center">No</th>
                  <th className="py-3.5 px-4">Nama Kelurahan</th>
                  <th className="py-3.5 px-4">Dibuat Pada</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                </tr>
              ) : (
                <tr className="bg-slate-50 text-[11px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-4 w-12 text-center">No</th>
                  <th className="py-3.5 px-4">Nama Rukun Warga</th>
                  <th className="py-3.5 px-4">Kelurahan</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                </tr>
              )}
            </thead>
            <tbody className="text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 className="animate-spin text-blue-600" size={28} />
                      <p className="font-semibold text-xs">Memuat data wilayah...</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-rose-600 font-medium">
                    {error}
                  </td>
                </tr>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((item, idx) => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                      {(currentPage - 1) * rowsPerPage + idx + 1}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{item.name}</td>
                    
                    {activeTab === "kecamatan" && (
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {item.kelurahans?.length || 0}
                      </td>
                    )}
                    {activeTab === "kelurahan" && (
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {new Date(item.createdAt || Date.now()).toLocaleDateString("id-ID", {
                          day: "numeric", month: "short", year: "numeric"
                        })}
                      </td>
                    )}
                    {activeTab === "rw" && (
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {item.kelurahan?.name || "-"}
                      </td>
                    )}

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center justify-center px-2 py-1 bg-emerald-50 text-emerald-600 rounded-md font-black text-[10px] tracking-wide uppercase border border-emerald-100/50">
                        Aktif
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-500 font-medium">
                    Tidak ada data wilayah yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Section */}
        {filteredData.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredData.length}
            itemsPerPage={rowsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setRowsPerPage}
          />
        )}
      </div>
    </div>
  );
};

export default MasterWilayah;
