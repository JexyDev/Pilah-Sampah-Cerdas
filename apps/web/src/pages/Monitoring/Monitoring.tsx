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
import { RefreshCw, MapPin } from "lucide-react";
import toast from "react-hot-toast";

import {
  KELURAHAN_GEODATA,
  createMapBinIcon,
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
  alertTempatSampahPenuh: number;
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

const MapEventHandler = ({
  setZoom,
  setSelectedKelurahan,
  setSelectedRtRw,
}: {
  setZoom: (z: number) => void;
  setSelectedKelurahan: (k: string) => void;
  setSelectedRtRw: (r: string) => void;
}) => {
  useMapEvents({
    zoomend: (e) => {
      const z = e.target.getZoom();
      setZoom(z);
      if (z <= 14) {
        // Auto-reset filter kelurahan & RT/RW saat user melakukan Zoom Out ke level kecamatan (<= 14)
        setSelectedKelurahan("Semua Kelurahan");
        setSelectedRtRw("Semua RT/RW");
      }
    },
  });
  return null;
};

const Monitoring: React.FC = () => {
  const { user } = useAuthStore();
  const { bins, fetchBins } = useMonitoringStore();

  const [facilities, setFacilities] = useState<FacilityItem[]>([]);
  const [kpi, setKpi] = useState<KPIStats | null>(null);
  const [rwResiduData, setRwResiduData] = useState<RwResiduData | null>(null);
  const [rwLocations, setRwLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Drilldown Detail Modal States
  const [selectedMetric, setSelectedMetric] = useState<"RUMAH_TANGGA" | "SAMPAH_TERPILAH" | "TEMPAT_SAMPAH" | "KONDISI_PENUH" | null>(null);

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
      const foundGroup = rwGroups.find((g: any) => g.rwName?.toLowerCase() === rwName.toLowerCase());
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
      const [kpiRes, , facRes, rwRes, locRes] = await Promise.all([
        api.get("/dashboard/kpi", { params: { wilayah: apiFilterWilayah } }).catch(() => ({ data: { success: false } })),
        api.get("/dashboard/trend", { params: { wilayah: apiFilterWilayah } }).catch(() => ({ data: { success: false } })),
        api.get("/facilities").catch(() => ({ data: { success: false } })),
        isRwRole
          ? api.get("/rw/residu-monitoring").catch(() => ({ data: { success: false } }))
          : Promise.resolve({ data: { success: false } }),
        api.get("/bins/locations").catch(() => ({ data: { success: false } })),
      ]);

      if (kpiRes.data?.success && kpiRes.data.data) setKpi(kpiRes.data.data);
      if (facRes.data?.success && facRes.data.data) setFacilities(facRes.data.data);
      if (rwRes.data?.success && rwRes.data.data) setRwResiduData(rwRes.data.data);
      if (locRes.data?.success && locRes.data.data) setRwLocations(locRes.data.data);
    } catch (e) {
      console.error("Gagal memuat analitik dashboard:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [apiFilterWilayah]);

  const householdGroups = useMemo(() => {
    const groups: Record<string, { bins: Bin[]; latitude: number; longitude: number; rtRw: string; address: string; citizenName: string }> = {};
    bins
      .filter((b) => b.latitude && b.longitude)
      .forEach((bin) => {
        const key = `${bin.latitude},${bin.longitude}`;
        if (!groups[key]) {
          const owner = (bin as any).user?.name || "Warga";
          const addr = (bin as any).user?.address || "Alamat Terdaftar";
          const rtRwStr = (bin as any).rw?.name || (bin as any).rtRw || "RW 01";
          groups[key] = { bins: [], latitude: Number(bin.latitude), longitude: Number(bin.longitude), rtRw: rtRwStr, address: addr, citizenName: owner };
        }
        groups[key].bins.push(bin);
      });
    return Object.values(groups);
  }, [bins]);

  const rwGroups = useMemo(() => {
    if (rwLocations && rwLocations.length > 0) {
      let filtered = rwLocations.filter((l: any) => l.latitude && l.longitude);
      if (selectedKelurahan !== "Semua Kelurahan") {
        filtered = filtered.filter((l: any) => l.kelurahan?.toLowerCase() === selectedKelurahan.toLowerCase());
      }
      return filtered.map((l: any) => ({
        rwName: l.rw,
        kelurahan: l.kelurahan,
        latitude: Number(l.latitude),
        longitude: Number(l.longitude),
        totalBins: l.titikCount || 0,
        patuh: l.patuh || 0,
        ketuaRwName: l.ketuaRwName,
        petugasResiduName: l.petugasResiduName,
        mahasiswaKknName: l.mahasiswaKknName,
        lurahName: l.lurahName,
      }));
    }

    const groups: Record<string, { bins: Bin[]; latitude: number; longitude: number; count: number; rwName: string; kelurahan: string; ketuaRwName?: string; petugasResiduName?: string; mahasiswaKknName?: string; lurahName?: string; patuh: number }> = {};
    householdGroups.forEach((hg) => {
      const rwName = hg.rtRw ? hg.rtRw : "RW 01";
      const key = `rw-${rwName}`;
      if (!groups[key]) {
        groups[key] = { bins: [], latitude: 0, longitude: 0, count: 0, rwName, kelurahan: "Coblong", patuh: 88 };
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
  }, [householdGroups, rwLocations, selectedKelurahan]);

  const uniqueRwOptions = useMemo(() => {
    const set = new Set<string>();
    rwGroups.forEach((g) => {
      if (g.rwName) set.add(g.rwName);
    });
    if (set.size === 0) {
      for (let i = 1; i <= 15; i++) set.add(`RW ${i < 10 ? "0" : ""}${i}`);
    }
    return Array.from(set).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, "") || "0", 10);
      const numB = parseInt(b.replace(/\D/g, "") || "0", 10);
      return numA - numB;
    });
  }, [rwGroups]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Executive Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-black border border-emerald-500/30 flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Geospasial & Analitik Real-Time
            </span>
            <span className="bg-slate-800 text-slate-200 px-3 py-1 rounded-full text-xs font-extrabold border border-slate-700 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-emerald-400">location_on</span>
              Cakupan Wilayah: {displayScope}
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Monitoring Wilayah Kecamatan Coblong
          </h1>
          <p className="text-slate-400 text-xs md:text-sm mt-1">
            Pantau sebaran tempat sampah, fasilitas GIS, dan status timbulan residu real-time per Kelurahan & RW.
          </p>
        </div>
      </div>

      {/* Scoped Summary Stats (Real DB Data Aggregation) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => setSelectedMetric("RUMAH_TANGGA")}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4 hover:shadow-md hover:border-emerald-300 transition cursor-pointer group"
        >
          <div className="p-3.5 bg-emerald-50 rounded-xl text-emerald-600 group-hover:scale-110 transition shadow-2xs">
            <span className="material-symbols-outlined text-[28px]">home</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rumah Tangga</p>
            <h3 className="text-xl font-black text-slate-900">
              {(kpi as any)?.totalRumahTangga ?? (kpi as any)?.totalWarga ?? householdGroups.length ?? 0} Aktif
            </h3>
            <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-0.5 mt-0.5">
              Klik rincian →
            </span>
          </div>
        </div>

        <div
          onClick={() => setSelectedMetric("SAMPAH_TERPILAH")}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4 hover:shadow-md hover:border-blue-300 transition cursor-pointer group"
        >
          <div className="p-3.5 bg-blue-50 rounded-xl text-blue-600 group-hover:scale-110 transition shadow-2xs">
            <span className="material-symbols-outlined text-[28px]">eco</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sampah Terpilah</p>
            <h3 className="text-xl font-black text-slate-900">
              {(kpi?.totalSampahKg ?? 0).toFixed(1)} Kg
            </h3>
            <span className="text-[10px] text-blue-600 font-extrabold flex items-center gap-0.5 mt-0.5">
              Klik komposisi →
            </span>
          </div>
        </div>

        <div
          onClick={() => setSelectedMetric("TEMPAT_SAMPAH")}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4 hover:shadow-md hover:border-amber-300 transition cursor-pointer group"
        >
          <div className="p-3.5 bg-amber-50 rounded-xl text-amber-600 group-hover:scale-110 transition shadow-2xs">
            <span className="material-symbols-outlined text-[28px]">delete</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tempat Sampah</p>
            <h3 className="text-xl font-black text-slate-900">
              {kpi?.tempatSampahAktif ?? bins.length ?? 0} Terdaftar
            </h3>
            <span className="text-[10px] text-amber-600 font-extrabold flex items-center gap-0.5 mt-0.5">
              Status kapasitas →
            </span>
          </div>
        </div>

        <div
          onClick={() => setSelectedMetric("KONDISI_PENUH")}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4 relative overflow-hidden hover:shadow-md hover:border-rose-300 transition cursor-pointer group"
        >
          <div className="p-3.5 bg-rose-50 rounded-xl text-rose-600 group-hover:scale-110 transition shadow-2xs">
            <span className="material-symbols-outlined text-[28px] animate-pulse">notifications_active</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kondisi Penuh</p>
            <h3 className="text-xl font-black text-rose-600">
              {kpi?.alertTempatSampahPenuh && kpi.alertTempatSampahPenuh > 0
                ? kpi.alertTempatSampahPenuh
                : bins.filter((b) => b.status === "FULL" || b.status === "penuh").length} Radar Merah
            </h3>
            <span className="text-[10px] text-rose-600 font-extrabold flex items-center gap-0.5 mt-0.5">
              Penjemputan →
            </span>
          </div>
        </div>
      </div>

      {/* Full Width GIS Map */}
      <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[650px]">
          <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="font-bold text-sm text-gray-800">GIS Peta Wilayah</h3>
              <p className="text-[10px] text-gray-400">Monitoring real-time volume tempat sampah dan fasilitas lingkungan</p>
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
                className="bg-white border border-gray-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-xs cursor-pointer"
              >
                <option value="Semua RT/RW">Semua RW</option>
                {uniqueRwOptions.map((rwName) => (
                  <option key={rwName} value={rwName}>
                    {rwName}
                  </option>
                ))}
              </select>

              {(selectedKelurahan !== "Semua Kelurahan" || selectedRtRw !== "Semua RT/RW") && (
                <button
                  onClick={() => {
                    setSelectedKelurahan("Semua Kelurahan");
                    setSelectedRtRw("Semua RT/RW");
                    setFlyToTarget([-6.8903, 107.611]);
                    setFlyToZoom(14);
                  }}
                  className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-slate-800 transition shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw size={12} /> Reset Peta
                </button>
              )}
            </div>
          </div>

          {/* Quick Filter Badges */}
          <div className="px-4 py-2.5 bg-slate-50/90 border-b border-slate-200/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {[
              {
                id: "ALL" as const,
                label: "Semua Status",
                dotBg: "bg-slate-400",
                active: "bg-slate-900 text-white border-slate-900 shadow-xs",
                inactive: "bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900",
              },
              {
                id: "AMAN" as const,
                label: "Tempat Sampah Aman",
                dotBg: "bg-emerald-500",
                active: "bg-emerald-600 text-white border-emerald-600 shadow-xs",
                inactive: "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100",
              },
              {
                id: "WASPADA" as const,
                label: "Waspada",
                dotBg: "bg-amber-500",
                active: "bg-amber-500 text-white border-amber-500 shadow-xs",
                inactive: "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100",
              },
              {
                id: "PENUH" as const,
                label: "Tempat Sampah Penuh",
                dotBg: "bg-rose-500",
                active: "bg-rose-600 text-white border-rose-600 shadow-xs animate-pulse",
                inactive: "bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100",
              },
              {
                id: "ORGANIK" as const,
                label: "Organik",
                dotBg: "bg-emerald-500",
                active: "bg-emerald-700 text-white border-emerald-700 shadow-xs",
                inactive: "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100",
              },
              {
                id: "DAUR_ULANG" as const,
                label: "Anorganik / Daur Ulang",
                dotBg: "bg-blue-500",
                active: "bg-blue-600 text-white border-blue-600 shadow-xs",
                inactive: "bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100",
              },
            ].map((item) => {
              const isActive = activeColorFilter === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveColorFilter(item.id)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold whitespace-nowrap shrink-0 transition-all duration-150 cursor-pointer outline-none focus:outline-none select-none ${
                    isActive ? item.active : item.inactive
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${item.dotBg} ${
                      isActive ? "ring-2 ring-white/60" : ""
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
          <div className="flex-1 relative z-10">
            <MapContainer center={[-6.8903, 107.611]} zoom={14} className="h-full w-full">
              <MapEventHandler
                setZoom={setMapZoom}
                setSelectedKelurahan={setSelectedKelurahan}
                setSelectedRtRw={setSelectedRtRw}
              />
              <MapFlyTo target={flyToTarget} zoom={flyToZoom} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* LEVEL 1: RENDER KELURAHAN PINS & POLYGONS */}
              {selectedKelurahan === "Semua Kelurahan" &&
                Object.values(KELURAHAN_GEODATA).map((kel) => (
                  <Marker
                    key={`kel-pin-${kel.id}`}
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
                      <div className="text-xs p-1">
                        <strong className="text-sm font-bold block mb-1">Kelurahan {kel.name}</strong>
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

              {/* LEVEL 2: RW ZONA MARKERS (SHOW ONLY WHEN KELURAHAN SELECTED OR ZOOM >= 16) */}
              {(selectedKelurahan !== "Semua Kelurahan" || mapZoom >= 16) &&
                rwGroups.map((group, idx) => (
                  <React.Fragment key={`rw-frag-${idx}`}>
                    <Marker
                      position={[group.latitude, group.longitude]}
                      icon={createRwZonaIcon(group.rwName || `RW ${idx + 1}`, group.patuh ?? 0)}
                      eventHandlers={{
                        click: () => {
                          setFlyToTarget([group.latitude, group.longitude]);
                          setFlyToZoom(17);
                        },
                      }}
                    >
                      <Popup>
                        <div className="text-xs p-2 text-left font-sans min-w-[260px] sm:min-w-[300px]">
                          <strong className="text-sm font-black block mb-2 text-slate-900 border-b pb-1.5 text-center">
                            Wilayah {group.rwName.includes('(') ? group.rwName : `${group.rwName} (${group.kelurahan || 'Coblong'})`}
                          </strong>

                          <div className="space-y-1.5 my-2 text-xs text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                            <div className="flex justify-between items-center gap-3">
                              <span className="text-slate-500 font-semibold shrink-0">Ketua RW:</span>
                              <span className="font-extrabold text-slate-900 text-right truncate">{group.ketuaRwName || "Belum ditugaskan"}</span>
                            </div>
                            <div className="flex justify-between items-center gap-3">
                              <span className="text-slate-500 font-semibold shrink-0">Petugas Residu:</span>
                              <span className="font-extrabold text-slate-900 text-right truncate">{group.petugasResiduName || "Belum ditugaskan"}</span>
                            </div>
                            <div className="flex justify-between items-center gap-3">
                              <span className="text-slate-500 font-semibold shrink-0">Mahasiswa KKN:</span>
                              <span className="font-extrabold text-slate-900 text-right truncate">{group.mahasiswaKknName || "Tidak ada"}</span>
                            </div>
                            <div className="flex justify-between items-center gap-3">
                              <span className="text-slate-500 font-semibold shrink-0">Lurah {group.kelurahan ? `(${group.kelurahan})` : ""}:</span>
                              <span className="font-extrabold text-slate-900 text-right truncate">{group.lurahName || "Belum ditugaskan"}</span>
                            </div>
                          </div>

                          <div className="flex justify-between text-slate-600 my-1 px-1 text-xs">
                            <span>Tingkat Kepatuhan:</span>
                            <strong className="text-emerald-600 font-black text-sm">{group.patuh || 0}%</strong>
                          </div>
                          <div className="flex justify-between text-slate-600 mb-2 px-1 text-xs">
                            <span>Tempat Sampah:</span>
                            <strong className="text-slate-800 font-black">{group.totalBins} Unit</strong>
                          </div>

                          <p className="text-[11px] text-emerald-600 font-bold italic text-center pt-1.5 border-t border-slate-100">
                            Klik untuk zoom ke detail rumah tangga
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  </React.Fragment>
                ))}

              {/* LEVEL 3: HOUSEHOLD BINS (ZOOM >= 14) */}
              {mapZoom >= 14 &&
                householdGroups.map((group, idx) => {
                  let maxPercentage = 0;
                  group.bins.forEach((bin) => {
                    const vol = Number(bin.currentVolumeLiter || 0);
                    const max = Number(bin.maxCapacityLiter || 25);
                    const pct = max > 0 ? (vol / max) * 100 : 0;
                    if (pct > maxPercentage) maxPercentage = pct;
                  });

                  let statusText = "Aman";
                  if (maxPercentage >= 90) statusText = "Penuh";
                  else if (maxPercentage >= 70) statusText = "Waspada";

                  // Filter matching
                  if (activeColorFilter === "AMAN" && statusText !== "Aman") return null;
                  if (activeColorFilter === "WASPADA" && statusText !== "Waspada") return null;
                  if (activeColorFilter === "PENUH" && statusText !== "Penuh") return null;

                  return (
                    <React.Fragment key={`hh-frag-${idx}`}>
                      <Marker
                        position={[group.latitude, group.longitude]}
                        icon={createMapBinIcon(statusText)}
                      >
                        <Popup>
                          <div className="text-xs p-1 font-sans min-w-[200px]">
                            <div className="border-b border-gray-100 pb-2 mb-2">
                              <span className="text-[10px] font-bold uppercase text-primary tracking-wider block">Rumah Tangga</span>
                              <strong className="text-sm font-bold text-gray-900 block">{group.citizenName}</strong>
                              <span className="text-[11px] text-gray-500 block font-medium">{group.address}</span>
                              <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold inline-block mt-1">
                                {group.rtRw}
                              </span>
                            </div>

                            <p className="text-[11px] font-bold text-gray-700 mb-1.5">
                              Daftar Tempat Sampah ({group.bins.length} Unit):
                            </p>
                            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                              {group.bins.map((bin) => {
                                const vol = Number(bin.currentVolumeLiter || 0);
                                const max = Number(bin.maxCapacityLiter || 25);
                                const pct = max > 0 ? Math.round((vol / max) * 100) : 0;

                                let badgeColor = "bg-emerald-100 text-emerald-800 border-emerald-200";
                                if (pct >= 90) badgeColor = "bg-rose-100 text-rose-800 border-rose-200 font-bold";
                                else if (pct >= 70) badgeColor = "bg-amber-100 text-amber-800 border-amber-200";

                                return (
                                  <div key={bin.id} className="bg-slate-50 p-1.5 rounded border border-slate-100 flex justify-between items-center text-[11px]">
                                    <div>
                                      <span className="font-bold text-gray-800 block">{(bin as any).kategori || (bin as any).category?.name || "Tempat Sampah"}</span>
                                      <span className="text-[9px] text-gray-400 font-mono">{bin.qrCode}</span>
                                    </div>
                                    <div className="text-right">
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${badgeColor}`}>
                                        {pct}% ({vol}/{max}L)
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    </React.Fragment>
                  );
                })}

              {/* LEVEL 4: FACILITY MARKERS */}
              {facilities
                .filter((f) => f.latitude && f.longitude)
                .map((f) => {
                  const lat = Number(f.latitude);
                  const lng = Number(f.longitude);

                  let zoneColor = "#10b981"; // green
                  let zoneRadius = 150;
                  if (f.jenis === "BATA_TERAWANG") { zoneColor = "#16a34a"; zoneRadius = 120; }
                  else if (f.jenis === "LOSEDA") { zoneColor = "#059669"; zoneRadius = 100; }
                  else if (f.jenis === "MAGGOT") { zoneColor = "#d97706"; zoneRadius = 200; }
                  else if (f.jenis === "BANK_SAMPAH") { zoneColor = "#2563eb"; zoneRadius = 300; }
                  else if (f.jenis === "TERNAK") { zoneColor = "#9333ea"; zoneRadius = 180; }

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
                  {rwResiduData?.petugas?.kpiScore ?? 0} / 100
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
                  {selectedMetric === "TEMPAT_SAMPAH" && "Status Kapasitas & Registrasi Tempat Sampah"}
                  {selectedMetric === "KONDISI_PENUH" && "Daftar Radar Merah (Tempat Sampah Penuh Membutuhkan Penjemputan)"}
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
              {selectedMetric === "RUMAH_TANGGA" && (() => {
                const totalHh = (kpi as any)?.totalRumahTangga || kpi?.totalWarga || bins.filter((b) => (b as any).userId).length || 0;
                
                const kelMap: Record<string, { count: number; patuhSum: number; rwCount: number }> = {};
                rwLocations.forEach((loc) => {
                  const kelName = loc.kelurahan || "Coblong";
                  if (!kelMap[kelName]) {
                    kelMap[kelName] = { count: 0, patuhSum: 0, rwCount: 0 };
                  }
                  kelMap[kelName].count += loc.titikCount || 0;
                  kelMap[kelName].patuhSum += loc.patuh || 0;
                  kelMap[kelName].rwCount += 1;
                });

                const kelEntries = Object.entries(kelMap);

                return (
                  <div className="space-y-3">
                    <p className="leading-relaxed text-gray-600">
                      Akumulasi <strong>{totalHh} Rumah Tangga</strong> terdaftar yang terikat dengan pemindaian QR code dan jadwal penjemputan.
                    </p>
                    {kelEntries.length === 0 ? (
                      <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-400 italic">
                        Belum ada data partisipasi rumah tangga terdaftar di wilayah ini.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        {kelEntries.map(([kelName, stat], idx) => {
                          const avgPatuh = stat.rwCount > 0 ? Math.round(stat.patuhSum / stat.rwCount) : 0;
                          return (
                            <div key={idx} className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100">
                              <span className="text-[10px] text-emerald-800 font-bold uppercase block mb-1">Kel. {kelName}</span>
                              <strong className="text-lg font-black text-emerald-950">{stat.count} Tempat Sampah ({stat.rwCount} RW)</strong>
                              <span className="block text-[10px] text-emerald-700 font-semibold mt-1">Kepatuhan Rata-rata: {avgPatuh}%</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}

              {selectedMetric === "SAMPAH_TERPILAH" && (() => {
                const totalKg = Number(kpi?.totalSampahKg || 0);
                const orgKg = Number((kpi as any)?.organikKg || (totalKg * 0.56));
                const inorgKg = Number((kpi as any)?.anorganikKg || (totalKg * 0.44));
                const b3Kg = 0.0;

                const orgPct = totalKg > 0 ? Math.round((orgKg / totalKg) * 100) : 0;
                const inorgPct = totalKg > 0 ? Math.round((inorgKg / totalKg) * 100) : 0;

                return (
                  <div className="space-y-4">
                    <p className="leading-relaxed text-gray-600">
                      Total volume sampah terpilah yang tercatat di sistem: <strong>{totalKg.toFixed(1)} Kg</strong> di {displayScope}.
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                        <span className="font-bold text-emerald-900">1. Organik / Kompos (Bata Terawang & Loseda)</span>
                        <span className="font-mono font-extrabold text-emerald-700 text-sm">{orgKg.toFixed(1)} Kg ({orgPct}%)</span>
                      </div>
                      <div className="flex justify-between items-center bg-blue-50 p-3 rounded-xl border border-blue-100">
                        <span className="font-bold text-blue-900">2. Anorganik (Daur Ulang Bank Sampah)</span>
                        <span className="font-mono font-extrabold text-blue-700 text-sm">{inorgKg.toFixed(1)} Kg ({inorgPct}%)</span>
                      </div>
                      <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <span className="font-bold text-slate-700">3. B3 (Bahan Berbahaya Beracun)</span>
                        <span className="font-mono font-bold text-slate-500 text-sm">{b3Kg.toFixed(1)} Kg (0%)</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {selectedMetric === "TEMPAT_SAMPAH" && (() => {
                const totalBins = kpi?.tempatSampahAktif || (kpi as any)?.totalBins || bins.length || 0;
                let amanCount = 0;
                let waspadaCount = 0;
                let penuhCount = 0;

                bins.forEach((b) => {
                  const vol = Number(b.currentVolumeLiter || 0);
                  const max = Number(b.maxCapacityLiter || 25);
                  const pct = max > 0 ? (vol / max) * 100 : 0;
                  if (pct >= 90 || b.status === "Penuh" || b.status === "kritis") penuhCount++;
                  else if (pct >= 70) waspadaCount++;
                  else amanCount++;
                });

                if (bins.length === 0) {
                  amanCount = Math.max(0, totalBins - (kpi?.alertTempatSampahPenuh || 0));
                  penuhCount = kpi?.alertTempatSampahPenuh || 0;
                }

                return (
                  <div className="space-y-3">
                    <p className="leading-relaxed text-gray-600">
                      Total <strong>{totalBins} unit tempat sampah</strong> terdaftar di sistem dengan status geolokasi GPS yang terikat ke warga.
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-center pt-1">
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                        <span className="text-[10px] text-emerald-700 font-bold block">Status Aman (&lt;70%)</span>
                        <span className="text-xl font-black text-emerald-900">{amanCount} Unit</span>
                      </div>
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                        <span className="text-[10px] text-amber-700 font-bold block">Waspada (70-89%)</span>
                        <span className="text-xl font-black text-amber-900">{waspadaCount} Unit</span>
                      </div>
                      <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                        <span className="text-[10px] text-red-700 font-bold block">Radar Merah (&gt;90%)</span>
                        <span className="text-xl font-black text-red-900">{penuhCount} Unit</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {selectedMetric === "KONDISI_PENUH" && (() => {
                const fullBins = bins.filter((b) => {
                  const vol = Number(b.currentVolumeLiter || 0);
                  const max = Number(b.maxCapacityLiter || 25);
                  const pct = max > 0 ? (vol / max) * 100 : 0;
                  return pct >= 90 || b.status === "Penuh" || b.status === "kritis";
                });

                return (
                  <div className="space-y-3">
                    <p className="leading-relaxed text-gray-600">
                      Berikut adalah <strong>{fullBins.length} lokasi tempat sampah</strong> yang telah melebihi kapasitas 90% dan memerlukan pengangkutan segera oleh Petugas Residu Wilayah. Klik item untuk menuju lokasi di peta.
                    </p>
                    {fullBins.length === 0 ? (
                      <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-center text-emerald-800 font-semibold">
                        Semua tempat sampah di wilayah ini dalam kondisi aman (&lt;90%).
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {fullBins.map((item, idx) => {
                          const owner = (item as any).user?.name || "Warga";
                          const rwStr = (item as any).rw?.name || "RW";
                          const vol = Number(item.currentVolumeLiter || 0);
                          const max = Number(item.maxCapacityLiter || 25);
                          const pct = max > 0 ? Math.round((vol / max) * 100) : 95;

                          return (
                            <button
                              key={item.id || idx}
                              onClick={() => {
                                if (item.latitude && item.longitude) {
                                  setFlyToTarget([Number(item.latitude), Number(item.longitude)]);
                                  setFlyToZoom(18);
                                  setSelectedMetric(null);
                                  toast.success(`Menuju lokasi tempat sampah ${item.qrCode || `BIN-${idx + 1}`}`);
                                } else {
                                  toast.error("Koordinat GPS tempat sampah tidak tersedia");
                                }
                              }}
                              className="w-full text-left flex justify-between items-center p-3 bg-red-50/80 border border-red-200 rounded-xl hover:bg-red-100 hover:border-red-300 transition-all cursor-pointer group shadow-2xs"
                              title="Klik untuk melihat lokasi tempat sampah di peta geospasial"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-red-100 text-red-600 rounded-lg group-hover:bg-red-600 group-hover:text-white transition-colors">
                                  <MapPin size={16} />
                                </div>
                                <div>
                                  <strong className="text-red-950 group-hover:text-red-700 block font-bold text-xs underline decoration-red-300 underline-offset-2">
                                    {item.qrCode || `BIN-${idx + 1}`} ({owner})
                                  </strong>
                                  <span className="text-[10px] text-red-700 font-medium">{rwStr}</span>
                                </div>
                              </div>
                              <span className="px-2.5 py-1 bg-red-600 group-hover:bg-red-700 text-white font-extrabold text-[11px] rounded-lg shadow-sm">
                                {pct}% Penuh
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
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

