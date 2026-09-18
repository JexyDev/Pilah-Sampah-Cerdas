/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 *
 * Komponen Tab Peta GIS Dasbor Eksekutif:
 * - Menampilkan sebaran fasilitas pengelolaan sampah di atas peta Leaflet
 * - Ikon pin modern interaktif (createFacilityIcon)
 * - Layer poligon batas presisi 6 Kelurahan Kecamatan Coblong (KELURAHAN_GEODATA)
 * - Kartu KPI interaktif untuk memfilter marker berdasarkan jenis fasilitas secara langsung
 * - Pop-up lengkap dengan PIC, nomor WhatsApp, foto, alamat, dan link Google Maps
 * - Legenda floating interaktif dan panel kepatuhan per kelurahan
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  Polygon,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  RefreshCw,
  AlertCircle,
  MapPin,
  Layers,
  Search,
  X,
  ExternalLink,
  Copy,
  Check,
  Eye,
  Compass,
  Boxes,
  Trash2,
  Leaf,
  Phone,
} from "lucide-react";
import api from "../../services/api";
import showToast from "../../utils/showToast";
import {
  KELURAHAN_GEODATA,
  CoblongGeo,
  createFacilityIcon,
} from "../../constants/coblongGeoData";
import {
  ThemeTileLayer,
  GOOGLE_SATELLITE_URL,
  OSM_LIGHT_URL,
} from "../../components/common/ThemeTileLayer";
import { resolveImageUrl } from "../../utils/imageUrl";

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
export interface GisFacility {
  id: string;
  jenis: string;
  namaJenis: string;
  nama: string;
  alamat?: string | null;
  latitude: number | null;
  longitude: number | null;
  kelurahan: string | null;
  rwNama: string | null;
  statusApproval: string;
  pic?: string | null;
  kontak?: string | null;
  kapasitas?: number | string | null;
  foto?: string | null;
}


// ── Helper Format WhatsApp ───────────────────────────────────────────────────
const formatWhatsAppUrl = (phone?: string | null): string => {
  if (!phone || phone === "-" || phone.trim() === "") return "";
  const cleaned = phone.replace(/[^0-9]/g, "");
  if (!cleaned) return "";
  const formatted = cleaned.startsWith("0") ? `62${cleaned.slice(1)}` : cleaned.startsWith("62") ? cleaned : `62${cleaned}`;
  return `https://wa.me/${formatted}`;
};

// ── Helper Format Label Jenis ────────────────────────────────────────────────
const formatFacilityTypeLabel = (jenis: string): string => {
  const map: Record<string, string> = {
    rumah_maggot: "Rumah Maggot BSF",
    bank_sampah: "Bank Sampah",
    buruan_sae: "Buruan SAE",
    loseda: "Loseda / Proseda",
    bata_terawang: "Bata Terawang",
    poc: "Pupuk Organik Cair (POC)",
    tps: "TPS / TPST",
  };
  return map[jenis] || jenis.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

// ── Badge Approval Helper ─────────────────────────────────────────────────────
const getApprovalBadge = (status: string) => {
  if (status === "APPROVED") return "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700";
  if (status === "PENDING") return "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700";
  return "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700";
};

// ── Map FlyTo Helper Component ────────────────────────────────────────────────
const MapFlyToController: React.FC<{
  center: [number, number] | null;
  zoom?: number;
}> = ({ center, zoom = 15 }) => {
  const map = useMap();
  useEffect(() => {
    if (center && !isNaN(center[0]) && !isNaN(center[1])) {
      map.flyTo(center, zoom, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
};

// ── Komponen Utama GisMapTab ──────────────────────────────────────────────────
export const GisMapTab: React.FC = () => {
  const [selectedKelurahan, setSelectedKelurahan] = useState("Semua Kelurahan");
  const [rwInput, setRwInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJenis, setSelectedJenis] = useState<string>("ALL");

  const [facilities, setFacilities] = useState<GisFacility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Map view controls
  const [mapTargetCenter, setMapTargetCenter] = useState<[number, number] | null>(null);
  const [mapTargetZoom, setMapTargetZoom] = useState<number>(CoblongGeo.DEFAULT_ZOOM);
  const [showSatellite, setShowSatellite] = useState(false);
  const [showBoundaries, setShowBoundaries] = useState(true);
  const [copiedCoordId, setCopiedCoordId] = useState<string | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; title: string; subtitle?: string } | null>(null);

  const mapSectionRef = useRef<HTMLDivElement>(null);

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

      const res = await api.get("/dashboard/kkn-executive/gis/facilities", { params });
      if (res.data?.success) {
        setFacilities(res.data.data || []);
      } else {
        setFacilities([]);
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

  // ── Auto FlyTo saat kelurahan berubah ────────────────────────────────────────
  useEffect(() => {
    if (selectedKelurahan && selectedKelurahan !== "Semua Kelurahan") {
      const cleanInput = selectedKelurahan.toUpperCase().replace(/\s+/g, "_");
      const matched = Object.entries(KELURAHAN_GEODATA).find(([k, v]) => {
        return (
          k === cleanInput ||
          v.name.toLowerCase() === selectedKelurahan.toLowerCase()
        );
      });
      if (matched && matched[1].centroid) {
        setMapTargetCenter(matched[1].centroid);
        setMapTargetZoom(15);
      }
    } else {
      setMapTargetCenter(CoblongGeo.CENTER);
      setMapTargetZoom(CoblongGeo.DEFAULT_ZOOM);
    }
  }, [selectedKelurahan]);

  // ── Filter Data di Memori (Search & Jenis) ──────────────────────────────────
  const filteredFacilities = useMemo(() => {
    return facilities.filter((f) => {
      // Filter Jenis
      if (selectedJenis !== "ALL") {
        if (selectedJenis === "organik_group") {
          if (!["loseda", "poc", "rumah_maggot"].includes(f.jenis)) return false;
        } else if (f.jenis !== selectedJenis) {
          return false;
        }
      }

      // Filter Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nama = (f.nama || "").toLowerCase();
        const jenis = (f.namaJenis || f.jenis || "").toLowerCase();
        const alamat = (f.alamat || "").toLowerCase();
        const pic = (f.pic || "").toLowerCase();
        const rw = (f.rwNama || "").toLowerCase();
        const kel = (f.kelurahan || "").toLowerCase();

        return (
          nama.includes(q) ||
          jenis.includes(q) ||
          alamat.includes(q) ||
          pic.includes(q) ||
          rw.includes(q) ||
          kel.includes(q)
        );
      }

      return true;
    });
  }, [facilities, selectedJenis, searchQuery]);

  // ── Metrik Fasilitas ────────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    let bankSampah = 0;
    let rumahMaggot = 0;
    let buruanSae = 0;
    let loseda = 0;
    let bataTerawang = 0;
    let poc = 0;
    let tps = 0;

    facilities.forEach((f) => {
      if (f.jenis === "bank_sampah") bankSampah++;
      else if (f.jenis === "rumah_maggot") rumahMaggot++;
      else if (f.jenis === "buruan_sae") buruanSae++;
      else if (f.jenis === "loseda") loseda++;
      else if (f.jenis === "bata_terawang") bataTerawang++;
      else if (f.jenis === "poc") poc++;
      else if (f.jenis === "tps") tps++;
    });

    const organikTotal = loseda + rumahMaggot + poc;

    return {
      total: facilities.length,
      bankSampah,
      rumahMaggot,
      buruanSae,
      loseda,
      bataTerawang,
      poc,
      tps,
      organikTotal,
    };
  }, [facilities]);

  // ── Copy Koordinat Helper ───────────────────────────────────────────────────
  const handleCopyCoordinate = (id: string, lat: number, lng: number) => {
    const text = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    navigator.clipboard.writeText(text);
    setCopiedCoordId(id);
    showToast.success(`Koordinat disalin: ${text}`);
    setTimeout(() => setCopiedCoordId(null), 2500);
  };

  return (
    <div className="space-y-5 text-slate-800 dark:text-slate-100">
      {/* ── Header & Filter Bar ──────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/60 dark:border-emerald-700/40 shadow-xs">
              <MapPin size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[10.5px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                  Geospasial Coblong
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {facilities.length} Titik Terdata
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
                Peta GIS Fasilitas Pengelolaan Sampah
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sebaran titik fasilitas reduksi sampah, inovasi organik, bank sampah, dan TPS se-Kecamatan Coblong
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span>Perbarui Data</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-5">
          {/* Dropdown Kelurahan */}
          <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-2xl">
            <MapPin size={15} className="text-emerald-600 shrink-0" />
            <div className="flex-1">
              <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Kelurahan
              </label>
              <select
                value={selectedKelurahan}
                onChange={(e) => setSelectedKelurahan(e.target.value)}
                className="bg-transparent outline-none text-xs font-bold text-slate-800 dark:text-slate-200 w-full cursor-pointer mt-0.5"
                aria-label="Pilih Kelurahan"
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
          <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-2xl">
            <Layers size={15} className="text-blue-500 shrink-0" />
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
                  if (e.key === "Enter") fetchData();
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
                }}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-2xl">
            <Search size={15} className="text-purple-500 shrink-0" />
            <div className="flex-1">
              <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Cari Fasilitas
              </label>
              <input
                type="text"
                placeholder="Nama fasilitas, PIC, alamat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent outline-none text-xs font-bold text-slate-800 dark:text-slate-200 w-full placeholder:text-slate-400 placeholder:font-normal mt-0.5"
                aria-label="Cari fasilitas"
              />
            </div>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Interactive KPI & Filter Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Card 1: Total Fasilitas */}
        <button
          type="button"
          onClick={() => setSelectedJenis("ALL")}
          className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
            selectedJenis === "ALL"
              ? "bg-emerald-50/90 dark:bg-emerald-950/60 border-emerald-600 text-emerald-950 dark:text-emerald-50 shadow-md ring-2 ring-emerald-600/25"
              : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:border-emerald-400 hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between w-full mb-2">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider ${selectedJenis === "ALL" ? "text-emerald-800 dark:text-emerald-300" : "text-slate-400 dark:text-slate-500"}`}>
              Semua
            </span>
            <div className={`p-1.5 rounded-lg ${selectedJenis === "ALL" ? "bg-emerald-200/70 dark:bg-emerald-800/60 text-emerald-900 dark:text-emerald-200" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"}`}>
              <Boxes size={14} />
            </div>
          </div>
          <div>
            <div className={`text-2xl font-black tracking-tight ${selectedJenis === "ALL" ? "text-emerald-950 dark:text-white" : ""}`}>{metrics.total}</div>
            <p className={`text-[11px] font-semibold mt-0.5 truncate ${selectedJenis === "ALL" ? "text-emerald-700/90 dark:text-emerald-300/90" : "text-slate-400"}`}>
              Total Titik
            </p>
          </div>
        </button>

        {/* Card 2: Bank Sampah */}
        <button
          type="button"
          onClick={() => setSelectedJenis(selectedJenis === "bank_sampah" ? "ALL" : "bank_sampah")}
          className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
            selectedJenis === "bank_sampah"
              ? "bg-blue-50/90 dark:bg-blue-950/60 border-blue-500 text-blue-950 dark:text-blue-50 shadow-md ring-2 ring-blue-500/25"
              : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:border-blue-400 hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between w-full mb-2">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider ${selectedJenis === "bank_sampah" ? "text-blue-800 dark:text-blue-300" : "text-slate-400"}`}>
              Bank Sampah
            </span>
            <div className={`p-1.5 rounded-lg ${selectedJenis === "bank_sampah" ? "bg-blue-200/60 dark:bg-blue-800/60 text-blue-900" : "bg-blue-50 dark:bg-blue-950/60 text-blue-600"}`}>
              <Boxes size={14} />
            </div>
          </div>
          <div>
            <div className={`text-2xl font-black tracking-tight ${selectedJenis === "bank_sampah" ? "text-blue-950 dark:text-white" : ""}`}>
              {metrics.bankSampah}
            </div>
            <p className="text-[11px] font-semibold text-slate-400 mt-0.5 truncate">Daur Ulang</p>
          </div>
        </button>

        {/* Card 3: Rumah Maggot */}
        <button
          type="button"
          onClick={() => setSelectedJenis(selectedJenis === "rumah_maggot" ? "ALL" : "rumah_maggot")}
          className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
            selectedJenis === "rumah_maggot"
              ? "bg-purple-50/90 dark:bg-purple-950/60 border-purple-500 text-purple-950 dark:text-purple-50 shadow-md ring-2 ring-purple-500/25"
              : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:border-purple-400 hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between w-full mb-2">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider ${selectedJenis === "rumah_maggot" ? "text-purple-800 dark:text-purple-300" : "text-slate-400"}`}>
              Maggot BSF
            </span>
            <div className={`p-1.5 rounded-lg ${selectedJenis === "rumah_maggot" ? "bg-purple-200/60 dark:bg-purple-800/60 text-purple-900" : "bg-purple-50 dark:bg-purple-950/60 text-purple-600"}`}>
              <Leaf size={14} />
            </div>
          </div>
          <div>
            <div className={`text-2xl font-black tracking-tight ${selectedJenis === "rumah_maggot" ? "text-purple-950 dark:text-white" : ""}`}>
              {metrics.rumahMaggot}
            </div>
            <p className="text-[11px] font-semibold text-slate-400 mt-0.5 truncate">Biokonversi</p>
          </div>
        </button>

        {/* Card 4: Buruan Sae */}
        <button
          type="button"
          onClick={() => setSelectedJenis(selectedJenis === "buruan_sae" ? "ALL" : "buruan_sae")}
          className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
            selectedJenis === "buruan_sae"
              ? "bg-lime-50/90 dark:bg-lime-950/60 border-lime-500 text-lime-950 dark:text-lime-50 shadow-md ring-2 ring-lime-500/25"
              : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:border-lime-400 hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between w-full mb-2">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider ${selectedJenis === "buruan_sae" ? "text-lime-800 dark:text-lime-300" : "text-slate-400"}`}>
              Buruan SAE
            </span>
            <div className={`p-1.5 rounded-lg ${selectedJenis === "buruan_sae" ? "bg-lime-200/60 dark:bg-lime-800/60 text-lime-900" : "bg-lime-50 dark:bg-lime-950/60 text-lime-600"}`}>
              <Leaf size={14} />
            </div>
          </div>
          <div>
            <div className={`text-2xl font-black tracking-tight ${selectedJenis === "buruan_sae" ? "text-lime-950 dark:text-white" : ""}`}>
              {metrics.buruanSae}
            </div>
            <p className="text-[11px] font-semibold text-slate-400 mt-0.5 truncate">Urban Farm</p>
          </div>
        </button>

        {/* Card 5: Loseda / Proseda */}
        <button
          type="button"
          onClick={() => setSelectedJenis(selectedJenis === "loseda" ? "ALL" : "loseda")}
          className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
            selectedJenis === "loseda"
              ? "bg-teal-50/90 dark:bg-teal-950/60 border-teal-500 text-teal-950 dark:text-teal-50 shadow-md ring-2 ring-teal-500/25"
              : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:border-teal-400 hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between w-full mb-2">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider ${selectedJenis === "loseda" ? "text-teal-800 dark:text-teal-300" : "text-slate-400"}`}>
              Loseda
            </span>
            <div className={`p-1.5 rounded-lg ${selectedJenis === "loseda" ? "bg-teal-200/60 dark:bg-teal-800/60 text-teal-900" : "bg-teal-50 dark:bg-teal-950/60 text-teal-600"}`}>
              <Trash2 size={14} />
            </div>
          </div>
          <div>
            <div className={`text-2xl font-black tracking-tight ${selectedJenis === "loseda" ? "text-teal-950 dark:text-white" : ""}`}>
              {metrics.loseda}
            </div>
            <p className="text-[11px] font-semibold text-slate-400 mt-0.5 truncate">Resapan Organik</p>
          </div>
        </button>

        {/* Card 6: Bata Terawang */}
        <button
          type="button"
          onClick={() => setSelectedJenis(selectedJenis === "bata_terawang" ? "ALL" : "bata_terawang")}
          className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
            selectedJenis === "bata_terawang"
              ? "bg-amber-50/90 dark:bg-amber-950/60 border-amber-500 text-amber-950 dark:text-amber-50 shadow-md ring-2 ring-amber-500/25"
              : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:border-amber-400 hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between w-full mb-2">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider ${selectedJenis === "bata_terawang" ? "text-amber-800 dark:text-amber-300" : "text-slate-400"}`}>
              Bata Terawang
            </span>
            <div className={`p-1.5 rounded-lg ${selectedJenis === "bata_terawang" ? "bg-amber-200/60 dark:bg-amber-800/60 text-amber-900" : "bg-amber-50 dark:bg-amber-950/60 text-amber-600"}`}>
              <Boxes size={14} />
            </div>
          </div>
          <div>
            <div className={`text-2xl font-black tracking-tight ${selectedJenis === "bata_terawang" ? "text-amber-950 dark:text-white" : ""}`}>
              {metrics.bataTerawang}
            </div>
            <p className="text-[11px] font-semibold text-slate-400 mt-0.5 truncate">Kompos Bata</p>
          </div>
        </button>

        {/* Card 7: TPS */}
        <button
          type="button"
          onClick={() => setSelectedJenis(selectedJenis === "tps" ? "ALL" : "tps")}
          className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
            selectedJenis === "tps"
              ? "bg-slate-100 dark:bg-slate-800 border-slate-500 text-slate-900 dark:text-slate-100 shadow-md ring-2 ring-slate-500/25"
              : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:border-slate-400 hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between w-full mb-2">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider ${selectedJenis === "tps" ? "text-slate-800 dark:text-slate-200" : "text-slate-400"}`}>
              TPS / TPST
            </span>
            <div className={`p-1.5 rounded-lg ${selectedJenis === "tps" ? "bg-slate-300 dark:bg-slate-700 text-slate-900" : "bg-slate-100 dark:bg-slate-800 text-slate-600"}`}>
              <Trash2 size={14} />
            </div>
          </div>
          <div>
            <div className={`text-2xl font-black tracking-tight ${selectedJenis === "tps" ? "text-slate-900 dark:text-white" : ""}`}>
              {metrics.tps}
            </div>
            <p className="text-[11px] font-semibold text-slate-400 mt-0.5 truncate">Penampungan</p>
          </div>
        </button>
      </div>

      {/* ── Error Notification ────────────────────────────────────────────────── */}
      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle size={18} className="text-rose-600 shrink-0" />
          <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
        </div>
      )}

      {/* ── PETA GIS LEAFLET INTERAKTIF ────────────────────────────────────────── */}
      <div
        ref={mapSectionRef}
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 relative overflow-hidden"
      >
        {/* Map Header Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2 pb-3 mb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              <Compass size={17} />
            </span>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Peta Spasial Fasilitas Kebersihan</span>
                {selectedJenis !== "ALL" && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                    Filter: {formatFacilityTypeLabel(selectedJenis)}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Menampilkan {filteredFacilities.length} dari {facilities.length} fasilitas aktif di wilayah Coblong
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Reset Filter Button */}
            {(selectedJenis !== "ALL" || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedJenis("ALL");
                  setSearchQuery("");
                }}
                className="text-xs text-slate-500 hover:text-rose-600 flex items-center gap-1 font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 transition cursor-pointer"
              >
                <X size={13} /> Reset Filter
              </button>
            )}

            {/* Toggle Batas Kelurahan */}
            <button
              type="button"
              onClick={() => setShowBoundaries((v) => !v)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                showBoundaries
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              }`}
            >
              <Layers size={13} />
              <span>Batas 6 Kelurahan</span>
            </button>

            {/* Toggle Peta Satelit / Vektor */}
            <button
              type="button"
              onClick={() => setShowSatellite((v) => !v)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                showSatellite
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              <Compass size={13} />
              <span>{showSatellite ? "Satelit Aktif" : "Mode Satelit"}</span>
            </button>
          </div>
        </div>

        {/* Map Container Viewport */}
        <div className="relative rounded-2xl overflow-hidden h-[500px] sm:h-[560px] z-0 border border-slate-200/80 dark:border-slate-800">
          {/* Floating Legend Overlay (Top Right) */}
          <div className="absolute top-3 right-3 z-[999] max-w-[270px] pointer-events-auto">
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xl rounded-2xl p-3.5 border border-slate-200 dark:border-slate-800 flex flex-col gap-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                    Legenda Simbol Peta
                  </span>
                </div>
              </div>

              {/* Fasilitas */}
              <div className="space-y-1.5">
                <span className="text-[9.5px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Jenis Fasilitas
                </span>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10.5px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#2563eb] shrink-0" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">Bank Sampah</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#7c3aed] shrink-0" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">Rumah Maggot</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#65a30d] shrink-0" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">Buruan SAE</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#0d9488] shrink-0" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">Loseda</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#f59e0b] shrink-0" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">Bata Terawang</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#06b6d4] shrink-0" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">POC</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#64748b] shrink-0" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">TPS</span>
                  </div>
                </div>
              </div>

              {/* Batas 6 Kelurahan */}
              <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-2">
                <span className="text-[9.5px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Batas 6 Kelurahan Coblong
                </span>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
                  <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-xs bg-[#10b981]" /><span className="font-medium text-slate-600 dark:text-slate-400">Dago</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-xs bg-[#3b82f6]" /><span className="font-medium text-slate-600 dark:text-slate-400">L. Siliwangi</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-xs bg-[#8b5cf6]" /><span className="font-medium text-slate-600 dark:text-slate-400">Lebak Gede</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-xs bg-[#f59e0b]" /><span className="font-medium text-slate-600 dark:text-slate-400">Sekeloa</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-xs bg-[#ec4899]" /><span className="font-medium text-slate-600 dark:text-slate-400">Sadang Serang</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-xs bg-[#06b6d4]" /><span className="font-medium text-slate-600 dark:text-slate-400">Cipaganti</span></div>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="h-full flex items-center justify-center bg-slate-50/50 dark:bg-slate-850/50">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-3 border-emerald-600/20 border-t-emerald-600 rounded-full animate-spin" />
                <p className="text-xs text-slate-500 font-semibold">Memuat peta geospasial Coblong...</p>
              </div>
            </div>
          ) : (
            <MapContainer
              center={CoblongGeo.CENTER}
              zoom={CoblongGeo.DEFAULT_ZOOM}
              style={{ height: "100%", width: "100%" }}
              className="z-0"
            >
              <ThemeTileLayer
                lightUrl={showSatellite ? GOOGLE_SATELLITE_URL : OSM_LIGHT_URL}
                darkUrl={showSatellite ? GOOGLE_SATELLITE_URL : undefined}
              />
              <MapFlyToController center={mapTargetCenter} zoom={mapTargetZoom} />

              {/* Poligon Batas 6 Kelurahan */}
              {showBoundaries &&
                Object.values(KELURAHAN_GEODATA).map((kg) => (
                  <Polygon
                    key={kg.id}
                    positions={kg.bounds}
                    pathOptions={{
                      color: kg.color,
                      weight: 2.2,
                      opacity: 0.85,
                      fillColor: kg.color,
                      fillOpacity: 0.08,
                      dashArray: "4, 5",
                    }}
                  >
                    <Popup>
                      <div className="p-1.5 text-xs space-y-1">
                        <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: kg.color }} />
                          Kelurahan {kg.name}
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                          Kecamatan Coblong, Kota Bandung ({kg.rwCount} RW)
                        </p>
                      </div>
                    </Popup>
                  </Polygon>
                ))}

              {/* Marker Fasilitas dengan createFacilityIcon */}
              {filteredFacilities.map((facility) => {
                if (!facility.latitude || !facility.longitude) return null;
                const latNum = Number(facility.latitude);
                const lngNum = Number(facility.longitude);
                if (isNaN(latNum) || isNaN(lngNum) || latNum === 0 || lngNum === 0) return null;

                const icon = createFacilityIcon(facility.jenis, facility.nama);
                const resolvedFoto = facility.foto ? resolveImageUrl(facility.foto) : null;
                const waUrl = formatWhatsAppUrl(facility.kontak);

                return (
                  <Marker
                    key={facility.id}
                    position={[latNum, lngNum]}
                    icon={icon}
                  >
                    <Popup maxWidth={300} className="custom-popup">
                      <div className="p-1 space-y-2 text-xs">
                        {/* Header Badge */}
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="px-2 py-0.5 rounded text-[9.5px] font-extrabold uppercase bg-emerald-100 text-emerald-800">
                            {formatFacilityTypeLabel(facility.jenis)}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[9.5px] font-bold border ${getApprovalBadge(facility.statusApproval)}`}
                          >
                            {facility.statusApproval === "APPROVED"
                              ? "Disetujui"
                              : facility.statusApproval === "PENDING"
                              ? "Menunggu"
                              : "Ditolak"}
                          </span>
                        </div>

                        {/* Title */}
                        <div>
                          <h4 className="font-black text-slate-900 text-sm leading-snug">
                            {facility.nama}
                          </h4>
                          {facility.alamat && (
                            <p className="text-slate-500 text-[11px] mt-0.5 line-clamp-2">
                              {facility.alamat}
                            </p>
                          )}
                        </div>

                        {/* Foto Thumbnail if available */}
                        {resolvedFoto && (
                          <div
                            className="relative group cursor-pointer overflow-hidden rounded-xl border border-slate-200"
                            onClick={() =>
                              setPreviewPhoto({
                                url: resolvedFoto,
                                title: facility.nama,
                                subtitle: facility.alamat || undefined,
                              })
                            }
                          >
                            <img
                              src={resolvedFoto}
                              alt={facility.nama}
                              className="w-full h-28 object-cover rounded-xl hover:scale-105 transition duration-300"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold gap-1 transition">
                              <Eye size={13} /> Lihat Foto
                            </div>
                          </div>
                        )}

                        {/* Detail PIC & Wilayah */}
                        <div className="space-y-1 text-[11px] text-slate-700 border-t border-slate-100 pt-1.5">
                          <p>
                            <strong className="text-slate-900">Wilayah:</strong>{" "}
                            {facility.kelurahan || "Coblong"}{" "}
                            {facility.rwNama ? `• ${facility.rwNama}` : ""}
                          </p>

                          {facility.pic && (
                            <p>
                              <strong className="text-slate-900">PIC:</strong> {facility.pic}
                            </p>
                          )}

                          {facility.kontak && (
                            <div className="flex items-center gap-1">
                              <strong className="text-slate-900">Kontak:</strong>
                              {waUrl ? (
                                <a
                                  href={waUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-emerald-600 font-bold hover:underline flex items-center gap-0.5"
                                >
                                  <Phone size={10} />
                                  <span>{facility.kontak}</span>
                                </a>
                              ) : (
                                <span>{facility.kontak}</span>
                              )}
                            </div>
                          )}

                          {facility.kapasitas && (
                            <p>
                              <strong className="text-slate-900">Kapasitas:</strong>{" "}
                              {facility.kapasitas} Kg
                            </p>
                          )}
                        </div>

                        {/* Koordinat & External Actions */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5 font-mono text-[10.5px]">
                          <span className="text-slate-500">
                            {latNum.toFixed(5)}, {lngNum.toFixed(5)}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleCopyCoordinate(facility.id, latNum, lngNum)}
                              className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                              title="Salin Koordinat"
                            >
                              {copiedCoordId === facility.id ? (
                                <Check size={11} className="text-emerald-600" />
                              ) : (
                                <Copy size={11} />
                              )}
                            </button>
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${latNum},${lngNum}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-600 transition cursor-pointer"
                              title="Buka di Google Maps"
                            >
                              <ExternalLink size={11} />
                            </a>
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          )}
        </div>
      </div>



      {/* ── Photo Preview Modal ──────────────────────────────────────────────── */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 p-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {previewPhoto.title}
                </h4>
                {previewPhoto.subtitle && (
                  <p className="text-xs text-slate-500">{previewPhoto.subtitle}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer transition"
              >
                <X size={18} />
              </button>
            </div>
            <img
              src={previewPhoto.url}
              alt={previewPhoto.title}
              className="w-full h-80 object-cover rounded-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default GisMapTab;
