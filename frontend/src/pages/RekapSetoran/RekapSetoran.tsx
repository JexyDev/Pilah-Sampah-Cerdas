import { Loader2, Grid, Receipt, MapPin } from "lucide-react";
/**
 * Project: TrashCare
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import api from "../../services/api";

const RekapSetoran: React.FC = () => {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDeposits = async () => {
      try {
        const response = await api.get("/transactions/deposits");
        setDeposits(response.data.data);
      } catch (err) {
        setError("Gagal memuat data dari server.");
        toast.error("Gagal memuat data setoran");
      } finally {
        setLoading(false);
      }
    };
    fetchDeposits();
  }, []);

  const handleExportCSV = () => {
    if (deposits.length === 0) {
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
    const csvData = deposits.map((d) => [
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
                <th className="py-4 px-6 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Warga
                </th>
                <th className="py-4 px-6 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Kategori
                </th>
                <th className="py-4 px-6 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Berat & Poin
                </th>
                <th className="py-4 px-6 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Waktu & Lokasi
                </th>
                <th className="py-4 px-6 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider text-right">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="text-[14px] text-on-surface">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 className="animate-spin text-primary" size={32} />
                      <p>Memuat data transaksi...</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-error font-medium">
                    {error}
                  </td>
                </tr>
              ) : deposits.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant">
                    Belum ada data setoran.
                  </td>
                </tr>
              ) : (
                deposits.map((dep) => (
                  <tr
                    key={dep.id}
                    className="border-b border-outline-variant/30 hover:bg-surface-container-low transition-colors duration-150"
                  >
                    <td className="py-4 px-6">
                      <div className="font-bold text-on-surface">{dep.warga}</div>
                      <div className="text-[12px] text-on-surface-variant mt-0.5">{dep.rtRw}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-md font-bold text-[11px] tracking-wide uppercase bg-surface-container-high text-on-surface-variant">
                        {dep.jenis}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-on-surface">{dep.berat} Kg</span>
                        <span className="text-[12px] font-bold text-primary flex items-center gap-1">
                          +{dep.poin} Poin
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-[13px] text-on-surface font-medium">
                        {new Date(dep.waktu).toLocaleString()}
                      </div>
                      <div className="text-[11px] text-on-surface-variant flex items-center gap-1 mt-0.5">
                        <MapPin size={14} />
                        {dep.lokasi}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-green-100 text-green-700">
                        {dep.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RekapSetoran;
