import { Loader2, Grid, Receipt, MapPin } from "lucide-react";
/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import api from "../../services/api";

const RekapSetoran: React.FC = () => {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterKategori, setFilterKategori] = useState("ALL");
  const [filterRtRw, setFilterRtRw] = useState("");
  const [filterPeriode, setFilterPeriode] = useState("ALL");

  useEffect(() => {
    const fetchDeposits = async () => {
      try {
        const response = await api.get("/transactions/deposits");
        setDeposits(response.data.data);
      } catch (err: any) {
        const errMsg = err.response?.data?.message || err.response?.data?.error || err.message || "Gagal memuat data dari server.";
        setError(errMsg);
        toast.error(`Gagal memuat data setoran: ${errMsg}`);
      } finally {
        setLoading(false);
      }
    };
    fetchDeposits();
  }, []);

  const filteredDeposits = React.useMemo(() => {
    return deposits.filter((d) => {
      // 1. Filter Kategori
      if (filterKategori !== "ALL") {
        const catUpper = d.jenis ? d.jenis.toUpperCase() : "";
        if (filterKategori === "ORGANIC" && !catUpper.includes("ORGANIK") && !catUpper.includes("ORGANIC")) return false;
        if (filterKategori === "NON_ORGANIC" && !catUpper.includes("ANORGANIK") && !catUpper.includes("NON_ORGANIC") && !catUpper.includes("NON-ORGANIC")) return false;
        if (filterKategori === "RESIDU" && !catUpper.includes("RESIDU")) return false;
        if (filterKategori === "MIXED" && !catUpper.includes("CAMPURAN") && !catUpper.includes("MIXED")) return false;
      }

      // 2. Filter RT/RW
      if (filterRtRw.trim() !== "") {
        const query = filterRtRw.toLowerCase();
        if (!d.rtRw?.toLowerCase().includes(query)) return false;
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

  const handleExportCSV = () => {
    if (filteredDeposits.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    const headers = [
      "ID",
      "Warga",
      "RT/RW",
      "Jenis Sampah",
      "Berat (Kg)",
      "Poin",
      "Waktu",
      "Lokasi Tong",
      "Status",
    ];
    const csvData = filteredDeposits.map((d) => [
      d.id,
      d.warga,
      d.rtRw,
      d.jenis,
      d.berat,
      d.poin,
      new Date(d.waktu).toLocaleString(),
      d.lokasi,
      d.status,
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Rekap_Setoran_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV berhasil diunduh");
  };

  return (
    <div className="flex flex-col">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-on-surface mb-1">Rekap & Analisis Setoran</h2>
          <p className="text-[14px] text-on-surface-variant">
            Ringkasan data setoran sampah warga.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-outline-variant/50 rounded-lg text-on-surface text-[12px] font-bold hover:bg-surface-container-low transition-colors shadow-sm"
          >
            <Grid size={18} />
            Ekspor CSV
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-outline-variant/50 shadow-sm mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Kategori</label>
          <select
            value={filterKategori}
            onChange={(e) => setFilterKategori(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700"
          >
            <option value="ALL">Semua Kategori</option>
            <option value="ORGANIC">Organik</option>
            <option value="NON_ORGANIC">Anorganik</option>
            <option value="MIXED">Campuran</option>
            <option value="RESIDU">Residu</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cari RT/RW</label>
          <input
            type="text"
            placeholder="Contoh: RT 01 / RW 02"
            value={filterRtRw}
            onChange={(e) => setFilterRtRw(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 placeholder-slate-400"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Periode</label>
          <select
            value={filterPeriode}
            onChange={(e) => setFilterPeriode(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700"
          >
            <option value="ALL">Semua Waktu</option>
            <option value="7d">7 Hari Terakhir</option>
            <option value="30d">30 Hari Terakhir</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow-sm border border-outline-variant/50 overflow-hidden mb-6 flex-1">
        <div className="p-4 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-lowest">
          <h3 className="font-bold text-on-surface flex items-center gap-2">
            <Receipt className="text-primary" size={20} />
            Riwayat Setoran Warga
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/30">
                <th className="py-3 px-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Warga
                </th>
                <th className="py-3 px-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Kategori
                </th>
                <th className="py-3 px-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Berat (Kg)
                </th>
                <th className="py-3 px-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Poin
                </th>
                <th className="py-3 px-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Waktu Setor
                </th>
                <th className="py-3 px-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Lokasi
                </th>
                <th className="py-3 px-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider text-right">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="text-[14px] text-on-surface">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-on-surface-variant">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 className="animate-spin text-primary" size={32} />
                      <p>Memuat data transaksi...</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-error font-medium">
                    {error}
                  </td>
                </tr>
              ) : filteredDeposits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-on-surface-variant">
                    Belum ada data setoran.
                  </td>
                </tr>
              ) : (
                filteredDeposits.map((dep) => {
                  const formatRtRw = (raw?: string) => {
                    if (!raw) return "-";
                    const trimmed = raw.trim();
                    if (trimmed.includes("/") && !trimmed.toLowerCase().includes("rt")) {
                      const parts = trimmed.split("/");
                      if (parts.length === 2) {
                        return `RT ${parts[0].trim()} / RW ${parts[1].trim()}`;
                      }
                    }
                    return trimmed.toLowerCase().startsWith("rt") ? trimmed : `RT/RW: ${trimmed}`;
                  };

                  return (
                    <tr
                      key={dep.id}
                      className="border-b border-outline-variant/30 hover:bg-surface-container-low transition-colors duration-150"
                    >
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-on-surface">{dep.warga}</div>
                        <div className="text-[12px] font-medium text-slate-500 mt-0.5">
                          {formatRtRw(dep.rtRw)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-md font-bold text-[11px] tracking-wide uppercase bg-surface-container-high text-on-surface-variant">
                          {dep.jenis}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-bold text-on-surface">
                        {dep.berat} Kg
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-bold text-primary">
                        +{dep.poin} Poin
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-[13px] text-on-surface font-medium">
                        {new Date(dep.waktu).toLocaleString('id-ID', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-[12px] text-on-surface-variant">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={14} className="text-slate-400 shrink-0" />
                          <span>{dep.lokasi}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-green-100 text-green-700">
                          {dep.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RekapSetoran;
