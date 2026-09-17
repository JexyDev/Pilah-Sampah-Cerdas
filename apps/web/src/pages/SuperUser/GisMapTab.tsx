/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 *
 * Komponen Tab Peta GIS:
 * - Menampilkan fasilitas pengelolaan sampah di atas peta Leaflet
 * - Overlay kepatuhan per kelurahan
 * - Filter Kelurahan & RW
 */

import React, { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { RefreshCw, AlertCircle, MapPin, Layers } from "lucide-react";
import api from "../../services/api";

// ── Warna marker per jenis fasilitas ─────────────────────────────────────────
const JENIS_COLOR: Record<string, string> = {
  rumah_maggot: "#15803d",
  tps: "#64748b",
  bank_sampah: "#2563eb",
  bata_terawang: "#7c3aed",
  loseda: "#ea580c",
  poc: "#ea580c",
  buruan_sae: "#0891b2",
};

const JENIS_COLOR_DEFAULT = "#6b7280";

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

// ── Tipe Data ─────────────────────────────────────────────────────────────────
interface GisFacility {
  id: string;
  jenis: string;
  namaJenis: string;
  nama: string;
  alamat?: string;
  latitude: number;
  longitude: number;
  kelurahan: string;
  rwNama: string;
  statusApproval: string;
}

interface ComplianceData {
  kelurahan: string;
  totalBin: number;
  binAktif: number;
  persentaseAktif: number;
  tingkat: "TINGGI" | "SEDANG" | "RENDAH";
  warna: string;
}

// ── Pusat Kecamatan Coblong ───────────────────────────────────────────────────
const COBLONG_CENTER: [number, number] = [-6.8946, 107.6107];
const COBLONG_ZOOM = 14;

// ── Badge helper ──────────────────────────────────────────────────────────────
const getApprovalBadge = (status: string) => {
  if (status === "APPROVED") return "bg-emerald-100 text-emerald-700 border-emerald-300";
  if (status === "PENDING") return "bg-amber-100 text-amber-700 border-amber-300";
  return "bg-rose-100 text-rose-700 border-rose-300";
};

const getTingkatBadge = (tingkat: "TINGGI" | "SEDANG" | "RENDAH") => {
  if (tingkat === "TINGGI") return "bg-emerald-100 text-emerald-700";
  if (tingkat === "SEDANG") return "bg-amber-100 text-amber-700";
  return "bg-rose-100 text-rose-700";
};

// ── Komponen GisMapTab ────────────────────────────────────────────────────────
const GisMapTab: React.FC = () => {
  const [selectedKelurahan, setSelectedKelurahan] = useState("Semua Kelurahan");
  const [rwInput, setRwInput] = useState("");
  const [facilities, setFacilities] = useState<GisFacility[]>([]);
  const [compliance, setCompliance] = useState<ComplianceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ── Fetch data dari API ─────────────────────────────────────────────────────
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

      const [facilRes, compRes] = await Promise.allSettled([
        api.get("/dashboard/kkn-executive/gis/facilities", { params }),
        api.get("/dashboard/kkn-executive/gis/compliance-overlay", { params }),
      ]);

      if (facilRes.status === "fulfilled" && facilRes.value.data?.success) {
        setFacilities(facilRes.value.data.data || []);
      } else {
        setFacilities([]);
      }

      if (compRes.status === "fulfilled" && compRes.value.data?.success) {
        setCompliance(compRes.value.data.data || []);
      } else {
        setCompliance([]);
      }
    } catch (err: unknown) {
      console.error("GIS fetch error:", err);
      setError("Gagal memuat data GIS dari server.");
    } finally {
      setLoading(false);
    }
  }, [selectedKelurahan, rwInput]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Statistik per jenis ─────────────────────────────────────────────────────
  const statsPerJenis = facilities.reduce<Record<string, number>>((acc, f) => {
    const key = f.namaJenis || f.jenis || "Lainnya";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* ── Header & Filter ──────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/60 dark:border-emerald-700/40">
              <MapPin size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100">Peta GIS Fasilitas</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sebaran titik fasilitas pengelolaan sampah Kecamatan Coblong
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Perbarui</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl">
            <MapPin size={13} className="text-emerald-600 shrink-0" />
            <select
              value={selectedKelurahan}
              onChange={(e) => setSelectedKelurahan(e.target.value)}
              className="bg-transparent outline-none text-xs font-semibold text-slate-700 dark:text-slate-200 w-full cursor-pointer"
              aria-label="Filter Kelurahan GIS"
            >
              {KELURAHAN_OPTIONS.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl">
            <Layers size={13} className="text-blue-500 shrink-0" />
            <input
              type="text"
              placeholder="Nomor RW (opsional, tekan Enter)"
              value={rwInput}
              onChange={(e) => setRwInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") fetchData(); }}
              className="bg-transparent outline-none text-xs font-semibold text-slate-700 dark:text-slate-200 w-full placeholder:text-slate-400"
              aria-label="Filter RW GIS"
            />
          </div>
        </div>
      </div>

      {/* ── Kartu Statistik ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Fasilitas</p>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {loading ? "..." : facilities.length}
          </p>
        </div>
        {!loading && Object.entries(statsPerJenis).slice(0, 3).map(([jenis, count]) => (
          <div key={jenis} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
            <p
              className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider line-clamp-1"
              title={jenis}
            >
              {jenis}
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{count}</p>
          </div>
        ))}
      </div>

      {/* ── Error State ───────────────────────────────────────────────────────── */}
      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle size={18} className="text-rose-600 shrink-0" />
          <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
        </div>
      )}

      {/* ── Peta Leaflet ─────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="h-[480px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-3 border-emerald-600/20 border-t-emerald-600 rounded-full animate-spin" />
              <p className="text-xs text-slate-400 font-semibold">Memuat peta...</p>
            </div>
          </div>
        ) : (
          <MapContainer
            center={COBLONG_CENTER}
            zoom={COBLONG_ZOOM}
            style={{ height: "480px", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {facilities.map((facility) => {
              const color = JENIS_COLOR[facility.jenis] ?? JENIS_COLOR_DEFAULT;
              return (
                <CircleMarker
                  key={facility.id}
                  center={[facility.latitude, facility.longitude]}
                  radius={9}
                  pathOptions={{
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.85,
                    weight: 2,
                  }}
                >
                  <Popup>
                    <div style={{ minWidth: 160 }}>
                      <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{facility.nama}</p>
                      <p style={{ fontSize: 11, color: "#64748b" }}>{facility.namaJenis}</p>
                      {facility.alamat && (
                        <p style={{ fontSize: 11, color: "#64748b" }}>{facility.alamat}</p>
                      )}
                      <p style={{ fontSize: 11, color: "#64748b" }}>
                        Kelurahan: <strong>{facility.kelurahan}</strong>
                      </p>
                      <p style={{ fontSize: 11, color: "#64748b" }}>
                        RW: <strong>{facility.rwNama}</strong>
                      </p>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border mt-1 ${getApprovalBadge(facility.statusApproval)}`}
                      >
                        {facility.statusApproval === "APPROVED"
                          ? "Disetujui"
                          : facility.statusApproval === "PENDING"
                          ? "Menunggu"
                          : "Ditolak"}
                      </span>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        )}
      </div>

      {/* ── Legend ───────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-5">
        {/* Legend Warna Jenis */}
        <div>
          <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-3">Legenda Jenis Fasilitas</h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(JENIS_COLOR).map(([jenis, color]) => (
              <div key={jenis} className="flex items-center gap-1.5">
                <span
                  className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-slate-600 dark:text-slate-400 capitalize">
                  {jenis.replace(/_/g, " ")}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabel Kepatuhan Kelurahan */}
        {compliance.length > 0 && (
          <div>
            <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-3">Tingkat Kepatuhan per Kelurahan</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-left">
                    <th className="pb-2 pr-4 text-slate-400 font-bold uppercase tracking-wide">Kelurahan</th>
                    <th className="pb-2 pr-4 text-slate-400 font-bold uppercase tracking-wide text-right">Total Bin</th>
                    <th className="pb-2 pr-4 text-slate-400 font-bold uppercase tracking-wide text-right">Bin Aktif</th>
                    <th className="pb-2 pr-4 text-slate-400 font-bold uppercase tracking-wide text-right">%</th>
                    <th className="pb-2 text-slate-400 font-bold uppercase tracking-wide text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {compliance.map((row) => (
                    <tr key={row.kelurahan} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                      <td className="py-2.5 pr-4 font-semibold text-slate-700 dark:text-slate-300">{row.kelurahan}</td>
                      <td className="py-2.5 pr-4 text-right text-slate-600 dark:text-slate-400">{row.totalBin}</td>
                      <td className="py-2.5 pr-4 text-right text-slate-600 dark:text-slate-400">{row.binAktif}</td>
                      <td className="py-2.5 pr-4 text-right font-bold text-slate-700 dark:text-slate-300">
                        {row.persentaseAktif.toFixed(1)}%
                      </td>
                      <td className="py-2.5 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${getTingkatBadge(row.tingkat)}`}>
                          {row.tingkat}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && compliance.length === 0 && facilities.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-4">
            Tidak ada data fasilitas untuk filter yang dipilih.
          </p>
        )}
      </div>
    </div>
  );
};

export default GisMapTab;
