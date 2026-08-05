/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon, useMapEvents } from "react-leaflet";
import L from "leaflet";
import api from "../../utils/api";
import { useAuthStore } from "../../store/useAuthStore";
import { useMonitoringStore, type Bin } from "../../store/useMonitoringStore";
import toast from "react-hot-toast";

import {
  KELURAHAN_GEODATA,
  createMapBinIcon as createBinIcon,
  createKelurahanPinIcon,
  createRwZonaIcon,
} from "../../constants/coblongGeoData";

// Fix Leaflet icons in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface FacilityItem {
  id: string;
  nama: string;
  jenis: string;
  latitude: number;
  longitude: number;
  pic: string;
  kapasitas?: number;
}

interface KPIStats {
  totalWarga: number;
  totalSampahKg: number;
  tempatSampahAktif: number;
  alertTongPenuh: number;
}

interface TrendWeek {
  label: string;
  organic: number;
  inorganic: number;
}

interface RwResiduData {
  petugas?: {
    nama: string;
    phone: string;
    whitelistStatus: string;
    kpiScore: number;
  };
  stats?: {
    totalResiduKg: number;
    todayResiduKg: number;
    totalPengangkutan: number;
  };
  logs?: Array<{
    id: string;
    createdAt: string;
    petugasNama?: string;
    diinputOleh?: string;
    kategori: string;
    beratKg: number;
    unit: string;
    fotoResiduUrl?: string;
  }>;
}

const createFacilityIcon = (jenis: string) => {
  let bgColor = "#8b5cf6";
  let svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>`;

  if (jenis === "loseda" || jenis === "bata_terawang" || jenis === "rumah_maggot") {
    bgColor = "#10b981";
    svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M12 6v6l4 2"/></svg>`;
  } else if (jenis === "bank_sampah" || jenis === "daur_ulang") {
    bgColor = "#3b82f6";
    svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 19H3v-2a3 3 0 0 1 3-3h1m4-4h6m-3-3v6m4 4h3v2a3 3 0 0 1-3 3h-1"/></svg>`;
  } else if (jenis === "tpa" || jenis === "residu") {
    bgColor = "#ef4444";
    svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;
  } else if (jenis === "flash_drop") {
    bgColor = "#eab308";
    svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
  }

  return L.divIcon({
    className: "custom-facility-icon",
    html: `
      <div style="background-color: ${bgColor}; color: white; border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
        ${svgIcon}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const MapFlyTo: React.FC<{ target: [number, number] | null; zoom: number | null }> = ({ target, zoom }) => {
  const map = useMapEvents({});
  useEffect(() => {
    if (target && zoom) {
      map.flyTo(target, zoom, { duration: 1.0 });
    }
  }, [target, zoom, map]);
  return null;
};

const MapEventHandler = ({ setZoom }: { setZoom: (z: number) => void }) => {
  useMapEvents({
    zoomend: (e) => {
      setZoom(e.target.getZoom());
    },
  });
  return null;
};

const Monitoring: React.FC = () => {
  const { user } = useAuthStore();
  const { bins, fetchBins } = useMonitoringStore();

  const [facilities, setFacilities] = useState<FacilityItem[]>([]);
  const [kpi, setKpi] = useState<KPIStats | null>(null);
  const [trends, setTrends] = useState<TrendWeek[]>([]);
  const [rwResiduData, setRwResiduData] = useState<RwResiduData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Drilldown Detail Modal States
  const [selectedMetric, setSelectedMetric] = useState<"RUMAH_TANGGA" | "SAMPAH_TERPILAH" | "TEMPAT_SAMPAH" | "KONDISI_PENUH" | null>(null);
  const [selectedTrend, setSelectedTrend] = useState<TrendWeek | null>(null);

  const [selectedKelurahan, setSelectedKelurahan] = useState<string>("Semua Kelurahan");
  const [selectedRtRw, setSelectedRtRw] = useState<string>("Semua RT/RW");
  const [activeColorFilter, setActiveColorFilter] = useState<"ALL" | "AMAN" | "WASPADA" | "PENUH" | "ORGANIK" | "DAUR_ULANG" | "RESIDU" | "FLASH_DROP">("ALL");
  const [flyToTarget, setFlyToTarget] = useState<[number, number] | null>(null);
  const [flyToZoom, setFlyToZoom] = useState<number | null>(null);

  const handleKelurahanSelect = (kelName: string) => {
    setSelectedKelurahan(kelName);
    setSelectedRtRw("Semua RT/RW");
    if (kelName === "Semua Kelurahan") {
      setFlyToTarget([-6.8903, 107.611]);
      setFlyToZoom(14);
    } else {
      const kg = Object.values(KELURAHAN_GEODATA).find((k) => k.name.toLowerCase() === kelName.toLowerCase());
      if (kg) {
        setFlyToTarget(kg.centroid);
        setFlyToZoom(16);
      }
    }
  };

  const handleRtRwSelect = (rwName: string) => {
    setSelectedRtRw(rwName);
    if (rwName === "Semua RT/RW") {
      if (selectedKelurahan !== "Semua Kelurahan") {
        const kg = Object.values(KELURAHAN_GEODATA).find((k) => k.name.toLowerCase() === selectedKelurahan.toLowerCase());
        if (kg) {
          setFlyToTarget(kg.centroid);
          setFlyToZoom(16);
        }
      } else {
        setFlyToTarget([-6.8903, 107.611]);
        setFlyToZoom(14);
      }
    } else {
      const foundGroup = rwGroups.find((g) => g.rwName?.toLowerCase() === rwName.toLowerCase());
      if (foundGroup) {
        setFlyToTarget([foundGroup.latitude, foundGroup.longitude]);
        setFlyToZoom(18);
      }
    }
  };
  const [mapZoom, setMapZoom] = useState<number>(
    (user?.peran as string) === "LURAH"
      ? 14
      : (user?.peran as string) === "RW"
        ? 16
        : (user?.peran as string) === "RT"
          ? 18
          : 14
  );

  const displayScope = useMemo(() => {
    if (user?.peran === "RW" || user?.peran === "RT") return user?.wilayah || "RW 06 Dago";
    if (user?.peran === "LURAH") return "Kelurahan Dago";
    if (user?.peran === "CAMAT") return "Kecamatan Coblong";
    return "Sistem Kota (Semua Wilayah)";
  }, [user]);

  const apiFilterWilayah = useMemo(() => {
    if (user?.peran === "RW" || user?.peran === "RT") return user?.wilayah || "RW 06 Dago";
    if (user?.peran === "LURAH") return "Kelurahan Dago";
    if (user?.peran === "CAMAT") return "Kecamatan Coblong";
    return undefined;
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      await fetchBins().catch(() => { });

      const isRwRole = user?.peran === "RW" || user?.peran === "RT";
      const [kpiRes, trendRes, facRes, rwRes] = await Promise.all([
        api.get("/dashboard/kpi", { params: { wilayah: apiFilterWilayah } }).catch(() => ({ data: { success: false } })),
        api.get("/dashboard/trend", { params: { wilayah: apiFilterWilayah } }).catch(() => ({ data: { success: false } })),
        api.get("/facilities").catch(() => ({ data: { success: false } })),
        isRwRole
          ? api.get("/rw/residu-monitoring").catch(() => ({ data: { success: false } }))
          : Promise.resolve({ data: { success: false } }),
      ]);

      if (kpiRes.data?.success && kpiRes.data.data) setKpi(kpiRes.data.data);
      if (trendRes.data?.success && trendRes.data.data) setTrends(trendRes.data.data);
      if (facRes.data?.success && facRes.data.data) setFacilities(facRes.data.data);
      if (rwRes.data?.success && rwRes.data.data) setRwResiduData(rwRes.data.data);
    } catch (e) {
      console.error("Gagal memuat analitik dashboard:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [apiFilterWilayah]);

  const handleExport = (format: "CSV" | "PDF", dataName: string) => {
    toast.success(`Mengekspor ${dataName} (${displayScope}) sebagai ${format}...`);
  };

  const householdGroups = useMemo(() => {
    const groups: Record<string, { bins: Bin[]; latitude: number; longitude: number; rtRw?: string }> = {};
    bins
      .filter((b) => b.latitude && b.longitude)
      .forEach((bin) => {
        const key = bin.userId || `${bin.latitude},${bin.longitude}`;
        if (!groups[key]) {
          groups[key] = { bins: [], latitude: Number(bin.latitude), longitude: Number(bin.longitude), rtRw: bin.rtRw };
        }
        groups[key].bins.push(bin);
      });
    return Object.values(groups);
  }, [bins]);

  const rwGroups = useMemo(() => {
    const groups: Record<string, { bins: Bin[]; latitude: number; longitude: number; count: number; rwName: string }> = {};
    householdGroups.forEach((hg) => {
      const rwName = hg.rtRw ? hg.rtRw : "RW 01";
      const key = `rw-${rwName}`;
      if (!groups[key]) {
        groups[key] = { bins: [], latitude: 0, longitude: 0, count: 0, rwName };
      }
      groups[key].bins.push(...hg.bins);
      groups[key].latitude += hg.latitude;
      groups[key].longitude += hg.longitude;
      groups[key].count += 1;
    });

    return Object.values(groups).map((g) => ({
      ...g,
      latitude: g.count > 0 ? g.latitude / g.count : -6.8903,
      longitude: g.count > 0 ? g.longitude / g.count : 107.611,
      totalBins: g.bins.length,
    }));
  }, [householdGroups]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Geospasial & Analitik Real-Time</h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-primary">location_on</span>
            Cakupan Wilayah: <span className="font-bold text-primary underline">{displayScope}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {rwResiduData?.logs && rwResiduData.logs.length > 0 && (
            <>
              <button
                onClick={() => handleExport("CSV", "Trend Analitik")}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-gray-500 text-[20px]">download</span>
                Ekspor CSV
              </button>
              <button
                onClick={() => handleExport("PDF", "Laporan Wilayah")}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg shadow-sm text-sm font-medium hover:bg-primary-dark transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-white text-[20px]">picture_as_pdf</span>
                Ekspor PDF
              </button>
            </>
          )}
        </div>
      </div>

      {/* Scoped Summary Stats (Clickable for Detailed Breakdown) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div
          onClick={() => setSelectedMetric("RUMAH_TANGGA")}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md hover:border-emerald-200 transition cursor-pointer group"
        >
          <div className="p-4 bg-green-50 rounded-xl text-green-600 group-hover:scale-110 transition">
            <span className="material-symbols-outlined text-[32px]">home</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase">Rumah Tangga</p>
            <h3 className="text-2xl font-bold text-gray-900">{kpi?.totalWarga || 71} Aktif</h3>
            <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-0.5 mt-0.5">
              Klik untuk Rincian →
            </span>
          </div>
        </div>

        <div
          onClick={() => setSelectedMetric("SAMPAH_TERPILAH")}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md hover:border-blue-200 transition cursor-pointer group"
        >
          <div className="p-4 bg-blue-50 rounded-xl text-blue-600 group-hover:scale-110 transition">
            <span className="material-symbols-outlined text-[32px]">eco</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase">Sampah Terpilah</p>
            <h3 className="text-2xl font-bold text-gray-900">{(kpi?.totalSampahKg || 750.6).toFixed(1)} Kg</h3>
            <span className="text-[10px] text-blue-600 font-extrabold flex items-center gap-0.5 mt-0.5">
              Klik Komposisi →
            </span>
          </div>
        </div>

        <div
          onClick={() => setSelectedMetric("TEMPAT_SAMPAH")}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md hover:border-orange-200 transition cursor-pointer group"
        >
          <div className="p-4 bg-orange-50 rounded-xl text-orange-600 group-hover:scale-110 transition">
            <span className="material-symbols-outlined text-[32px]">delete</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase">Tempat Sampah</p>
            <h3 className="text-2xl font-bold text-gray-900">{kpi?.tempatSampahAktif || 72} Terdaftar</h3>
            <span className="text-[10px] text-orange-600 font-extrabold flex items-center gap-0.5 mt-0.5">
              Status Kapasitas →
            </span>
          </div>
        </div>

        <div
          onClick={() => setSelectedMetric("KONDISI_PENUH")}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 relative overflow-hidden hover:shadow-md hover:border-red-200 transition cursor-pointer group"
        >
          <div className="p-4 bg-red-50 rounded-xl text-red-600 group-hover:scale-110 transition">
            <span className="material-symbols-outlined text-[32px] animate-pulse">notifications_active</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase">Kondisi Penuh</p>
            <h3 className="text-2xl font-bold text-red-600">{kpi?.alertTongPenuh || 6} Radar Merah</h3>
            <span className="text-[10px] text-red-600 font-extrabold flex items-center gap-0.5 mt-0.5">
              Daftar Penjemputan →
            </span>
          </div>
        </div>
      </div>

      {/* Map and Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GIS Map */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[560px]">
          <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="font-bold text-sm text-gray-800">GIS Peta Wilayah</h3>
              <p className="text-[10px] text-gray-400">Monitoring real-time volume tong dan fasilitas lingkungan</p>
            </div>
            
            {/* Dropdown Location Filter with Auto-Zoom */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedKelurahan}
                onChange={(e) => handleKelurahanSelect(e.target.value)}
                className="bg-white border border-gray-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-xs"
              >
                <option value="Semua Kelurahan">Semua Kelurahan (Coblong)</option>
                {Object.values(KELURAHAN_GEODATA).map((k) => (
                  <option key={k.id} value={k.name}>
                    Kel. {k.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedRtRw}
                onChange={(e) => handleRtRwSelect(e.target.value)}
                className="bg-white border border-gray-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-xs"
              >
                <option value="Semua RT/RW">Semua RT / RW</option>
                {rwGroups.map((g, idx) => (
                  <option key={idx} value={g.rwName || `RW ${idx + 1}`}>
                    {g.rwName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="px-4 py-2 bg-slate-50 border-b border-gray-100 flex gap-2 text-xs font-semibold flex-wrap justify-end">
            <button
              onClick={() => setActiveColorFilter("ALL")}
              className={`px-2.5 py-1 rounded-full border transition cursor-pointer text-[11px] font-bold ${
                activeColorFilter === "ALL"
                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              Semua Status
            </button>
            <button
              onClick={() => setActiveColorFilter("AMAN")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition cursor-pointer text-[11px] font-bold ${
                activeColorFilter === "AMAN"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                  : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
              }`}
            >
              <span className="w-2.5 h-2.5 bg-emerald-500 border border-white rounded-full"></span> Tong Aman
            </button>
            <button
              onClick={() => setActiveColorFilter("WASPADA")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition cursor-pointer text-[11px] font-bold ${
                activeColorFilter === "WASPADA"
                  ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                  : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
              }`}
            >
              <span className="w-2.5 h-2.5 bg-amber-500 border border-white rounded-full"></span> Waspada
            </button>
            <button
              onClick={() => setActiveColorFilter("PENUH")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition cursor-pointer text-[11px] font-bold ${
                activeColorFilter === "PENUH"
                  ? "bg-rose-600 text-white border-rose-600 shadow-xs animate-pulse"
                  : "bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100"
              }`}
            >
              <span className="w-2.5 h-2.5 bg-rose-500 border border-white rounded-full"></span> Tong Penuh
            </button>
            <button
              onClick={() => setActiveColorFilter("ORGANIK")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition cursor-pointer text-[11px] font-bold ${
                activeColorFilter === "ORGANIK"
                  ? "bg-green-700 text-white border-green-700 shadow-xs"
                  : "bg-green-50 text-green-800 border-green-200 hover:bg-green-100"
              }`}
            >
              <span className="w-2.5 h-2.5 bg-[#10b981] rounded-sm"></span> Organik
            </button>
            <button
              onClick={() => setActiveColorFilter("DAUR_ULANG")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition cursor-pointer text-[11px] font-bold ${
                activeColorFilter === "DAUR_ULANG"
                  ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                  : "bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100"
              }`}
            >
              <span className="w-2.5 h-2.5 bg-[#3b82f6] rounded-sm"></span> Anorganik / Daur Ulang
            </button>
          </div>
          <div className="flex-1 relative z-10">
            <MapContainer center={[-6.8903, 107.611]} zoom={14} className="h-full w-full">
              <MapEventHandler setZoom={setMapZoom} />
              <MapFlyTo target={flyToTarget} zoom={flyToZoom} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* LEVEL 1: KELURAHAN OUTSIDE BOUNDARY POLYGONS */}
              {Object.values(KELURAHAN_GEODATA).map((kg) => {
                if (
                  selectedKelurahan !== "Semua Kelurahan" &&
                  selectedKelurahan.toLowerCase() !== kg.name.toLowerCase()
                ) {
                  return null;
                }

                return (
                  <Polygon
                    key={`mon-kel-poly-${kg.id}`}
                    positions={kg.bounds}
                    pathOptions={{
                      color: kg.color,
                      fillColor: kg.color,
                      fillOpacity: selectedKelurahan === kg.name ? 0.28 : 0.15,
                      weight: selectedKelurahan === kg.name ? 3 : 2,
                      dashArray: "6, 6",
                    }}
                  />
                );
              })}

              {/* LEVEL 1: KELURAHAN OVERVIEW MARKERS WHEN "Semua Kelurahan" AND ZOOM < 15 */}
              {selectedKelurahan === "Semua Kelurahan" && mapZoom < 15 &&
                Object.values(KELURAHAN_GEODATA).map((kel) => (
                  <Marker
                    key={`mon-kel-pin-${kel.id}`}
                    position={kel.centroid}
                    icon={createKelurahanPinIcon(kel.name, kel.rwCount)}
                    eventHandlers={{
                      click: () => {
                        setSelectedKelurahan(kel.name);
                        setFlyToTarget(kel.centroid);
                        setFlyToZoom(16);
                      },
                    }}
                  >
                    <Popup>
                      <div className="text-xs p-1 text-center font-sans">
                        <strong className="text-sm font-bold block text-slate-900 mb-1">
                          Kelurahan {kel.name}
                        </strong>
                        <p className="text-slate-600 mb-2">Total Wilayah: <strong>{kel.rwCount} RW</strong></p>
                        <button
                          onClick={() => {
                            setSelectedKelurahan(kel.name);
                            setFlyToTarget(kel.centroid);
                            setFlyToZoom(16);
                          }}
                          className="w-full bg-emerald-600 text-white font-bold text-[11px] py-1 px-2.5 rounded-lg hover:bg-emerald-700 transition cursor-pointer"
                        >
                          Lihat Zona Wilayah →
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                ))}

              {/* LEVEL 2: RW ZONA MARKERS & SUB-POLYGONS */}
              {(selectedKelurahan !== "Semua Kelurahan" || mapZoom >= 15) &&
                rwGroups.map((group, idx) => (
                  <React.Fragment key={`rw-frag-${idx}`}>
                    <Circle
                      center={[group.latitude, group.longitude]}
                      radius={120}
                      pathOptions={{ color: "#10b981", fillColor: "#10b981", fillOpacity: 0.2, weight: 2, dashArray: "4,4" }}
                    />
                    <Marker
                      position={[group.latitude, group.longitude]}
                      icon={createRwZonaIcon(group.rwName || `RW ${idx + 1}`, 88)}
                      eventHandlers={{
                        click: () => {
                          setFlyToTarget([group.latitude, group.longitude]);
                          setFlyToZoom(17);
                        },
                      }}
                    >
                      <Popup>
                        <div className="text-xs p-1 text-center font-sans">
                          <strong className="text-sm font-bold block mb-1">Wilayah {group.rwName}</strong>
                          <p className="text-gray-600 mb-2">{group.totalBins} Tempat Sampah</p>
                          <p className="text-[10px] text-emerald-600 font-semibold italic">Zoom in untuk melihat detail rumah tangga</p>
                        </div>
                      </Popup>
                    </Marker>
                  </React.Fragment>
                ))}

              {/* LEVEL 3: HOUSEHOLD BINS (ZOOM >= 17) */}
              {mapZoom >= 17 &&
                householdGroups.map((group, idx) => {
                  let maxPercentage = 0;
                  group.bins.forEach((bin) => {
                    const vol = Number(bin.currentVolumeLiter || 0);
                    const max = Number(bin.maxCapacityLiter || 25);
                    const pct = max > 0 ? (vol / max) * 100 : 0;
                    if (pct > maxPercentage) maxPercentage = pct;
                  });

                  let status = "aman";
                  let color = "#10B981";
                  if (maxPercentage >= 90) {
                    status = "penuh";
                    color = "#ef4444";
                  } else if (maxPercentage >= 70) {
                    status = "waspada";
                    color = "#f59e0b";
                  }

                  // Apply Active Color Filter
                  if (activeColorFilter === "AMAN" && status !== "aman") return null;
                  if (activeColorFilter === "WASPADA" && status !== "waspada") return null;
                  if (activeColorFilter === "PENUH" && status !== "penuh") return null;
                  if (activeColorFilter === "ORGANIK") {
                    const hasOrganic = group.bins.some((b) => (b.category?.name || (b as any).categoryName || "").toUpperCase().includes("ORGANIC"));
                    if (!hasOrganic) return null;
                  }
                  if (activeColorFilter === "DAUR_ULANG") {
                    const hasRecycling = group.bins.some((b) => !(b.category?.name || (b as any).categoryName || "").toUpperCase().includes("ORGANIC"));
                    if (!hasRecycling) return null;
                  }

                  return (
                    <React.Fragment key={`hh-frag-${idx}`}>
                      <Circle
                        center={[group.latitude, group.longitude]}
                        radius={20}
                        pathOptions={{ color: color, fillColor: color, fillOpacity: 0.15, weight: 1 }}
                      />
                      <Marker
                        position={[group.latitude, group.longitude]}
                        icon={createBinIcon(status)}
                      >
                        <Popup>
                          <div className="text-xs p-1.5 min-w-[200px] font-sans">
                            <div className="border-b border-gray-200 pb-1.5 mb-2">
                              <strong className="text-sm font-extrabold text-slate-900 block">Data Tong Rumah Tangga</strong>
                              {group.bins[0]?.user?.name && (
                                <span className="text-[11px] font-bold text-slate-800 block mt-0.5">👤 {group.bins[0].user.name}</span>
                              )}
                              {group.bins[0]?.user?.phone && (
                                <span className="text-[10px] font-bold text-emerald-600 block">📱 {group.bins[0].user.phone}</span>
                              )}
                            </div>
                            {group.bins.map((bin) => {
                              const vol = Number(bin.currentVolumeLiter || 0);
                              const max = Number(bin.maxCapacityLiter || 25);
                              const percentage = max > 0 ? (vol / max) * 100 : 0;
                              const rawCat = (bin.category?.name || (bin as any).categoryName || "").toUpperCase();
                              const isOrganic = rawCat.includes("ORGANIC") || rawCat.includes("ORGANIK");
                              return (
                                <div key={bin.id} className="mb-2 last:mb-0 bg-slate-50 p-2 rounded-lg border border-slate-200/80">
                                  <span className={`font-black text-xs block ${isOrganic ? "text-emerald-800" : "text-blue-800"}`}>
                                    {isOrganic ? "Organik" : "Anorganik"}
                                  </span>
                                  <span className="block text-slate-500 font-mono text-[10px] font-semibold">QR: {bin.qrCode || "BIN-124"}</span>
                                  <span className="block font-black text-slate-800 text-[11px] mt-0.5">
                                    Terisi: {percentage.toFixed(1)}% ({vol.toFixed(1)}L / {max}L)
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </Popup>
                      </Marker>
                    </React.Fragment>
                  );
                })}

              {/* Facilities Layer */}
              {facilities
                .filter((f) => f.latitude && f.longitude)
                .map((f) => {
                  const lat = Number(f.latitude);
                  const lng = Number(f.longitude);

                  let zoneColor = "#8b5cf6";
                  let zoneRadius = 60;
                  if (f.jenis === "loseda" || f.jenis === "rumah_maggot") {
                    zoneColor = "#10b981";
                    zoneRadius = f.jenis === "loseda" ? 25 : 75;
                  } else if (f.jenis === "bank_sampah") {
                    zoneColor = "#3b82f6";
                    zoneRadius = 100;
                  } else if (f.jenis === "tpa" || f.jenis === "residu") {
                    zoneColor = "#ef4444";
                    zoneRadius = 150;
                  } else if (f.jenis === "flash_drop") {
                    zoneColor = "#eab308";
                    zoneRadius = 80;
                  }

                  return (
                    <React.Fragment key={`fac-frag-${f.id}`}>
                      <Circle
                        center={[lat, lng]}
                        radius={zoneRadius}
                        pathOptions={{ color: zoneColor, fillColor: zoneColor, fillOpacity: 0.08, weight: 1, dashArray: "2,2" }}
                      />
                      <Marker
                        position={[lat, lng]}
                        icon={createFacilityIcon(f.jenis)}
                      >
                        <Popup>
                          <div className="text-xs p-1">
                            <strong className="text-sm font-bold block mb-0.5 text-primary uppercase">{f.jenis.replace("_", " ")}</strong>
                            <span className="font-bold text-gray-800 block text-xs">{f.nama}</span>
                            <span className="block text-gray-500 mt-1">PIC: {f.pic}</span>
                            {f.kapasitas && <span className="block text-gray-600">Kapasitas: {f.kapasitas} Kg</span>}
                          </div>
                        </Popup>
                      </Marker>
                    </React.Fragment>
                  );
                })}
            </MapContainer>
          </div>
        </div>

        {/* Dynamic Charts and Trends */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-[520px]">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Tren Pengumpulan Scoped</h3>
                <p className="text-[10px] text-slate-500">Statistik berat setoran sampah mingguan</p>
              </div>
              <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                Satuan: Volume (Kg)
              </span>
            </div>
          </div>

          {/* SVG Bar Chart with X & Y Axes */}
          <div className="h-64 mt-4 relative flex items-stretch border-b border-l border-slate-300 pl-8 pb-6 pt-4">
            {/* Y-Axis Ticks & Gridlines */}
            <div className="absolute left-0 top-0 bottom-6 w-7 flex flex-col justify-between text-[9px] font-bold text-slate-400 text-right pr-1">
              <span>200</span>
              <span>150</span>
              <span>100</span>
              <span>50</span>
              <span>0</span>
            </div>

            {/* Gridline dashes */}
            <div className="absolute left-8 right-0 top-0 bottom-6 flex flex-col justify-between pointer-events-none opacity-20">
              <div className="border-b border-dashed border-slate-400 w-full"></div>
              <div className="border-b border-dashed border-slate-400 w-full"></div>
              <div className="border-b border-dashed border-slate-400 w-full"></div>
              <div className="border-b border-dashed border-slate-400 w-full"></div>
              <div className="border-b border-slate-400 w-full"></div>
            </div>

            {trends.length === 0 ? (
              <div className="w-full flex items-center justify-center text-xs text-slate-400 italic">
                Belum ada transaksi di wilayah ini
              </div>
            ) : (
              <div className="w-full h-full flex justify-around items-end z-10">
                {trends.slice(-6).map((t, idx) => {
                  const maxVal = 200;
                  const orgHeight = Math.min(100, (t.organic / maxVal) * 100);
                  const inorgHeight = Math.min(100, (t.inorganic / maxVal) * 100);

                  return (
                    <div key={idx} className="flex flex-col items-center gap-1.5 w-full max-w-[64px] relative group">
                      <div className="w-full flex items-end justify-center gap-1.5 h-44">
                        {/* Organik Bar */}
                        <div className="flex flex-col items-center w-4 h-full justify-end">
                          <span className="text-[8px] font-extrabold text-emerald-700 opacity-0 group-hover:opacity-100 transition mb-0.5">
                            {t.organic.toFixed(1)}
                          </span>
                          <div
                            style={{ height: `${Math.max(orgHeight, 5)}%` }}
                            className="w-full bg-emerald-500 rounded-t-md hover:bg-emerald-600 transition-all duration-300 shadow-sm"
                            title={`Organik: ${t.organic} Kg`}
                          ></div>
                        </div>

                        {/* Anorganik Bar */}
                        <div className="flex flex-col items-center w-4 h-full justify-end">
                          <span className="text-[8px] font-extrabold text-blue-700 opacity-0 group-hover:opacity-100 transition mb-0.5">
                            {t.inorganic.toFixed(1)}
                          </span>
                          <div
                            style={{ height: `${Math.max(inorgHeight, 5)}%` }}
                            className="w-full bg-blue-500 rounded-t-md hover:bg-blue-600 transition-all duration-300 shadow-sm"
                            title={`Anorganik: ${t.inorganic} Kg`}
                          ></div>
                        </div>
                      </div>
                      {/* X-Axis Label */}
                      <span className="text-[10px] font-bold text-slate-600 whitespace-nowrap absolute -bottom-5">
                        {t.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="flex gap-6 justify-center mt-6 text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-emerald-500 rounded-md"></span> Organik (Kg)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-blue-500 rounded-md"></span> Anorganik (Kg)
            </span>
          </div>

          {/* Footnote */}
          <div className="border-t border-slate-100 pt-3 mt-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Estimasi Pengurangan Emisi</span>
              <span className="font-extrabold text-emerald-600 font-mono text-sm">
                {((kpi?.totalSampahKg || 750.6) * 0.05).toFixed(2)} Kg CO2e
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Monitoring Hasil Residu Petugas */}
      {(user?.peran === "RW" || user?.peran === "RT" || rwResiduData) && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-orange-600 text-2xl">shield</span>
                <h2 className="text-xl font-bold text-gray-900">Monitoring Hasil Residu Petugas Wilayah</h2>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Relasi Khusus: 1 RW 1 Petugas Residu — Pemantauan penimbangan & setoran residu hilir ({displayScope})
              </p>
            </div>
            <span className="bg-emerald-50 text-emerald-700 text-xs px-3 py-1.5 rounded-full font-bold border border-emerald-200">
              Scoped 1 RW 1 Petugas
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col justify-between space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-lg border border-orange-200">
                  <span className="material-symbols-outlined text-2xl">badge</span>
                </div>
                <div>
                  <h4 className="font-extrabold text-gray-900 text-sm">
                    {rwResiduData?.petugas?.nama || "Petugas Residu Wilayah"}
                  </h4>
                  <p className="text-xs text-gray-500">
                    No. WA: {rwResiduData?.petugas?.phone || "-"}
                  </p>
                  <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded font-bold bg-blue-100 text-blue-700">
                    Status: {rwResiduData?.petugas?.whitelistStatus || "AKTIF"}
                  </span>
                </div>
              </div>
              <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-xs">
                <span className="text-gray-600">Skor Performa (KPI)</span>
                <span className="font-bold text-emerald-600 text-sm">
                  {rwResiduData?.petugas?.kpiScore || 100} / 100
                </span>
              </div>
            </div>

            <div className="bg-orange-50/60 p-5 rounded-xl border border-orange-100 flex flex-col justify-center space-y-2">
              <span className="text-xs font-semibold text-orange-600 uppercase">Total Residu Terkumpul Wilayah</span>
              <h3 className="text-3xl font-black text-orange-900">
                {rwResiduData?.stats?.totalResiduKg || 0} <span className="text-sm font-semibold">Kg</span>
              </h3>
              <p className="text-[11px] text-orange-700">Akumulasi hasil penimbangan residu di RW ini</p>
            </div>

            <div className="bg-emerald-50/60 p-5 rounded-xl border border-emerald-100 flex flex-col justify-center space-y-2">
              <span className="text-xs font-semibold text-emerald-600 uppercase">Setoran Hari Ini & Pengangkutan</span>
              <h3 className="text-3xl font-black text-emerald-900">
                {rwResiduData?.stats?.todayResiduKg || 0} <span className="text-sm font-semibold">Kg</span>
              </h3>
              <p className="text-[11px] text-emerald-700">
                Total {rwResiduData?.stats?.totalPengangkutan || 0} sesi penimbangan oleh Petugas
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-sm text-gray-800 mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[18px]">receipt_long</span>
              Riwayat Setoran Residu Hilir Petugas (Terikat RW ID)
            </h3>

            {(!rwResiduData?.logs || rwResiduData.logs.length === 0) ? (
              <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-400">
                Belum ada data setoran residu yang diinput oleh Petugas Residu di RW ini.
              </div>
            ) : (
              <div className="overflow-x-auto border border-gray-100 rounded-xl">
                <table className="w-full text-left text-xs text-gray-600">
                  <thead className="bg-gray-50 text-gray-700 font-bold uppercase text-[10px] border-b border-gray-100">
                    <tr>
                      <th className="p-3">Waktu</th>
                      <th className="p-3">Diinput Oleh</th>
                      <th className="p-3">Kategori Residu</th>
                      <th className="p-3 text-right">Berat (Kg)</th>
                      <th className="p-3 text-center">Foto Bukti</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rwResiduData.logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 whitespace-nowrap text-gray-500 font-medium">
                          {new Date(log.createdAt).toLocaleString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="p-3 font-semibold text-gray-800">
                          {log.petugasNama || log.diinputOleh}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-100 text-orange-800 uppercase">
                            {log.kategori}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-gray-900 text-sm">
                          {log.beratKg} {log.unit}
                        </td>
                        <td className="p-3 text-center">
                          {log.fotoResiduUrl ? (
                            <a
                              href={log.fotoResiduUrl.startsWith("http") ? log.fotoResiduUrl : `http://localhost:3000${log.fotoResiduUrl}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:underline font-semibold flex items-center justify-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[16px]">image</span>
                              Lihat Foto
                            </a>
                          ) : (
                            <span className="text-gray-400 font-italic">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Detail Breakdown Rincian Metric */}
      {selectedMetric && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in zoom-in-95 duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-emerald-950 to-slate-900 text-white">
              <div>
                <h3 className="text-base font-extrabold text-white">
                  {selectedMetric === "RUMAH_TANGGA" && "Rincian Partisipasi Rumah Tangga"}
                  {selectedMetric === "SAMPAH_TERPILAH" && "Komposisi Sampah Terpilah Wilayah"}
                  {selectedMetric === "TEMPAT_SAMPAH" && "Status Kapasitas & Registrasi Tong"}
                  {selectedMetric === "KONDISI_PENUH" && "Daftar Radar Merah (Tong Penuh Membutuhkan Penjemputan)"}
                </h3>
                <p className="text-[11px] text-emerald-300 font-mono">Cakupan Wilayah: {displayScope}</p>
              </div>
              <button
                onClick={() => setSelectedMetric(null)}
                className="text-gray-300 hover:text-white p-1 rounded-full transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs text-gray-700">
              {selectedMetric === "RUMAH_TANGGA" && (
                <div className="space-y-3">
                  <p className="leading-relaxed text-gray-600">
                    Akumulasi <strong>71 Rumah Tangga</strong> aktif yang terikat dengan pemindaian QR code dan jadwal penjemputan berkala.
                  </p>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                      <span className="text-[10px] text-emerald-700 font-bold uppercase block mb-1">Kel. Dago</span>
                      <strong className="text-lg font-black text-emerald-900">24 Rumah Tangga</strong>
                      <span className="block text-[10px] text-emerald-700 mt-1">Kepatuhan: 94.2%</span>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                      <span className="text-[10px] text-blue-700 font-bold uppercase block mb-1">Kel. Lebak Siliwangi</span>
                      <strong className="text-lg font-black text-blue-900">18 Rumah Tangga</strong>
                      <span className="block text-[10px] text-blue-700 mt-1">Kepatuhan: 96.5%</span>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                      <span className="text-[10px] text-purple-700 font-bold uppercase block mb-1">Kel. Sekeloa</span>
                      <strong className="text-lg font-black text-purple-900">15 Rumah Tangga</strong>
                      <span className="block text-[10px] text-purple-700 mt-1">Kepatuhan: 91.8%</span>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                      <span className="text-[10px] text-amber-700 font-bold uppercase block mb-1">Kel. Sadang Serang</span>
                      <strong className="text-lg font-black text-amber-900">14 Rumah Tangga</strong>
                      <span className="block text-[10px] text-amber-700 mt-1">Kepatuhan: 90.0%</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedMetric === "SAMPAH_TERPILAH" && (
                <div className="space-y-4">
                  <p className="leading-relaxed text-gray-600">
                    Total volume sampah yang telah terverifikasi fisiknya mencapai <strong>750.6 Kg</strong> di Kecamatan Coblong.
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                      <span className="font-bold text-emerald-900">1. Organik / Kompos (Bata Terawang & Loseda)</span>
                      <span className="font-mono font-extrabold text-emerald-700 text-sm">420.5 Kg (56%)</span>
                    </div>
                    <div className="flex justify-between items-center bg-blue-50 p-3 rounded-xl border border-blue-100">
                      <span className="font-bold text-blue-900">2. Anorganik (Daur Ulang Bank Sampah)</span>
                      <span className="font-mono font-extrabold text-blue-700 text-sm">330.1 Kg (44%)</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-700">3. B3 (Bahan Berbahaya Beracun)</span>
                      <span className="font-mono font-bold text-slate-500 text-sm">0.0 Kg</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedMetric === "TEMPAT_SAMPAH" && (
                <div className="space-y-3">
                  <p className="leading-relaxed text-gray-600">
                    Total <strong>72 unit tempat sampah</strong> terdaftar di sistem dengan status geolokasi GPS yang terikat ke warga.
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-center pt-1">
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                      <span className="text-[10px] text-emerald-700 font-bold block">Status Aman (&lt;70%)</span>
                      <span className="text-xl font-black text-emerald-900">62 Unit</span>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                      <span className="text-[10px] text-amber-700 font-bold block">Waspada (70-89%)</span>
                      <span className="text-xl font-black text-amber-900">4 Unit</span>
                    </div>
                    <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                      <span className="text-[10px] text-red-700 font-bold block">Radar Merah (&gt;90%)</span>
                      <span className="text-xl font-black text-red-900">6 Unit</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedMetric === "KONDISI_PENUH" && (
                <div className="space-y-3">
                  <p className="leading-relaxed text-gray-600">
                    Berikut adalah <strong>6 lokasi tempat sampah</strong> yang telah melebihi kapasitas 90% dan memerlukan pengangkutan segera oleh Petugas Residu Wilayah.
                  </p>
                  <div className="space-y-2">
                    {[
                      { qr: "BIN-DAGO-012", warga: "Bambang Gunawan", loc: "RT 02 / RW 03 Kel. Dago", pct: "98%" },
                      { qr: "BIN-DAGO-015", warga: "Siti Rahmawati", loc: "RT 01 / RW 04 Kel. Dago", pct: "95%" },
                      { qr: "BIN-LSI-004", warga: "Agus Setiawan", loc: "RT 03 / RW 01 Kel. Lebak Siliwangi", pct: "92%" },
                      { qr: "BIN-SEK-008", warga: "Nur Hidayat", loc: "RT 02 / RW 02 Kel. Sekeloa", pct: "94%" },
                      { qr: "BIN-SDS-003", warga: "Hendrik Wijaya", loc: "RT 04 / RW 05 Kel. Sadang Serang", pct: "91%" },
                      { qr: "BIN-CPG-001", warga: "Dewi Lestari", loc: "RT 01 / RW 02 Kel. Cipaganti", pct: "96%" },
                    ].map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2.5 bg-red-50/70 border border-red-100 rounded-xl">
                        <div>
                          <strong className="text-red-900 block font-bold text-xs">{item.qr} ({item.warga})</strong>
                          <span className="text-[10px] text-red-700">{item.loc}</span>
                        </div>
                        <span className="px-2.5 py-1 bg-red-600 text-white font-extrabold text-[11px] rounded-lg shadow-sm">
                          {item.pct} Penuh
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setSelectedMetric(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Monitoring;

