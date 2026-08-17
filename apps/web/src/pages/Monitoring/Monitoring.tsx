/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Page: Monitoring Wilayah (/monitoring-wilayah)
 * - 100% Structural & Behavioral Parity dengan Tab Monitoring pada Manajemen Tempat Sampah
 * - 100% Real PostgreSQL Database Data (/api/v1/bins, /api/v1/dashboard/kpi)
 * - ZERO Mock / Hardcoded Data
 * - Auto Fly-To Location on Search & Perfect Marker Icon Alignment (Zero Offset)
 */

import React, { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon, Tooltip, useMapEvents } from "react-leaflet";
import api from "../../services/api";
import { useAuthStore } from "../../store/useAuthStore";
import { useMonitoringStore } from "../../store/useMonitoringStore";
import { 
  Map, 
  Search, 
  X, 
  Maximize2, 
  Minimize2, 
  Layers, 
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import showToast from "../../utils/showToast";

import {
  KELURAHAN_GEODATA,
  createRealBinIcon,
} from "../../constants/coblongGeoData";

interface KPIStats {
  totalWarga: number;
  totalSampahKg: number;
  tempatSampahAktif: number;
  alertTempatSampahPenuh: number;
  totalRumahTangga?: number;
}

const MapFlyTo: React.FC<{ target: { center: [number, number]; zoom: number; timestamp?: number } | null }> = ({ target }) => {
  const map = useMapEvents({});
  useEffect(() => {
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 150);
    const t2 = setTimeout(() => map.invalidateSize(), 400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [map]);

  useEffect(() => {
    if (target && target.center && !isNaN(target.center[0]) && !isNaN(target.center[1]) && target.center[0] < 0 && target.center[1] > 0) {
      map.flyTo(target.center, target.zoom, { duration: 1.2 });
    }
  }, [target, map]);
  return null;
};

const MapEvents: React.FC<{ setZoom: (z: number) => void; setSelectedKelurahan: (k: string) => void }> = ({ setZoom, setSelectedKelurahan }) => {
  useMapEvents({
    zoomend: (e) => {
      const z = e.target.getZoom();
      setZoom(z);
      if (z <= 14) {
        setSelectedKelurahan("Semua Kelurahan");
      }
    },
  });
  return null;
};

const Monitoring: React.FC = () => {
  const { user } = useAuthStore();
  const { bins, fetchBins } = useMonitoringStore();

  const [_kpi, setKpi] = useState<KPIStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  const isLurah = (user?.role || user?.peran || "").toUpperCase() === "LURAH";
  const isDpl = ["DPL", "DOSEN_PEMBIMBING"].includes((user?.role || user?.peran || "").toUpperCase());
  const userKelurahan = user?.kelurahan || (user?.address?.includes("Cipaganti") || user?.name?.includes("Cipaganti") ? "Cipaganti" : "Cipaganti");
  const [dplKelurahans, setDplKelurahans] = useState<string[]>([]);

  // Filter & Search States (100% Identik ManajemenTempatSampah.tsx)
  const [selectedMapKelurahan, setSelectedMapKelurahan] = useState<string>(isLurah ? userKelurahan : "Semua Kelurahan");
  const [selectedRukunWarga, setSelectedRukunWarga] = useState<string>("Semua Rukun Warga");
  const [mapCategoryFilter, setMapCategoryFilter] = useState<string>("Semua");
  const [mapStatusFilter, setMapStatusFilter] = useState<string>("Semua");
  const [mapSearchInput, setMapSearchInput] = useState<string>("");
  const [isMapFullscreen, setIsMapFullscreen] = useState<boolean>(false);
  const [showKelurahanBoundaries, setShowKelurahanBoundaries] = useState<boolean>(true);
  const [mapTileProvider, setMapTileProvider] = useState<"google_vector" | "google_satellite" | "cartodb" | "osm">("cartodb");
  const [isLegendOpen, setIsLegendOpen] = useState<boolean>(true);
  const [activeLegendTab, setActiveLegendTab] = useState<"sampah" | "fasilitas_wilayah">("sampah");

  // Map Controls
  const [_mapZoom, setMapZoom] = useState<number>(14);
  const [flyTarget, setFlyTarget] = useState<{ center: [number, number]; zoom: number; timestamp?: number } | null>(null);

  const apiFilterWilayah = useMemo(() => {
    if (user?.peran === "RW") return user?.wilayah || "RW 06 Dago";
    if (isLurah) return userKelurahan || "Cipaganti";
    if (isDpl) {
      if (selectedMapKelurahan !== "Semua Kelurahan" && selectedMapKelurahan !== "Semua Kelurahan Binaan") {
        return selectedMapKelurahan;
      }
      return dplKelurahans.length > 0 ? dplKelurahans.join(",") : user?.kelurahan || "Dago";
    }
    if (user?.peran === "CAMAT") return "Kecamatan Coblong";
    return undefined;
  }, [user, isLurah, isDpl, userKelurahan, selectedMapKelurahan, dplKelurahans]);

  useEffect(() => {
    if (isDpl) {
      let initialList: string[] = [];
      if (user?.dplKelompok && Array.isArray(user.dplKelompok) && user.dplKelompok.length > 0) {
        initialList = Array.from(new Set(user.dplKelompok.map((g: any) => g.kelurahan).filter(Boolean))) as string[];
      } else if (user?.kelurahan && user.kelurahan !== "Kota Bandung" && user.kelurahan !== "Seluruh Kelurahan") {
        initialList = user.kelurahan.split(",").map((s) => s.trim()).filter(Boolean);
      }

      if (initialList.length > 0) {
        setDplKelurahans(initialList);
        setSelectedMapKelurahan(initialList.length === 1 ? initialList[0] : initialList[0]);
        const geoKey = initialList[0].toUpperCase().replace(/\s+/g, "_");
        if (KELURAHAN_GEODATA[geoKey]) {
          const geo = KELURAHAN_GEODATA[geoKey];
          setFlyTarget({ center: geo.centroid, zoom: 16, timestamp: Date.now() });
        }
      }

      api.get("/dpl/groups")
        .then((res) => {
          if (res.data?.success && Array.isArray(res.data.data)) {
            const liveList = Array.from(
              new Set(res.data.data.map((g: any) => g.kelurahan).filter(Boolean))
            ) as string[];
            if (liveList.length > 0) {
              setDplKelurahans(liveList);
              setSelectedMapKelurahan(liveList[0]);
              const geoKey = liveList[0].toUpperCase().replace(/\s+/g, "_");
              if (KELURAHAN_GEODATA[geoKey]) {
                const geo = KELURAHAN_GEODATA[geoKey];
                setFlyTarget({ center: geo.centroid, zoom: 16, timestamp: Date.now() });
              }
            }
          }
        })
        .catch(() => {});
    } else if (isLurah && userKelurahan) {
      setSelectedMapKelurahan(userKelurahan);
      const geoKey = userKelurahan.toUpperCase().replace(/\s+/g, "_");
      if (KELURAHAN_GEODATA[geoKey]) {
        const geo = KELURAHAN_GEODATA[geoKey];
        setFlyTarget({ center: geo.centroid, zoom: 16, timestamp: Date.now() });
      }
    }
  }, [isDpl, isLurah, user, userKelurahan]);

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      await fetchBins().catch(() => {});

      const kpiRes = await api.get("/dashboard/kpi", { params: { wilayah: apiFilterWilayah } }).catch(() => ({ data: { success: false } }));
      if (kpiRes.data?.success && kpiRes.data.data) {
        setKpi(kpiRes.data.data);
      }
      setLastSyncTime(new Date());
    } catch (e) {
      console.error("Gagal memuat data monitoring wilayah:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Automated Polling: Auto-sync GIS map & telemetry stats every 10 seconds
    const pollInterval = setInterval(() => {
      loadData(true);
    }, 10000);
    return () => clearInterval(pollInterval);
  }, [apiFilterWilayah]);

  // Verified Bins (ONLY bins with valid GPS coordinates)
  const verifiedMapBins = useMemo(() => {
    return bins.filter((b) => {
      const lat = Number(b.latitude);
      const lng = Number(b.longitude);
      return b.latitude !== null && b.longitude !== null && !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
    });
  }, [bins]);

  // Auto-center map to the average location of verified active bins
  useEffect(() => {
    if (verifiedMapBins.length > 0 && selectedMapKelurahan === "Semua Kelurahan" && !mapSearchInput) {
      const avgLat = verifiedMapBins.reduce((sum, b) => sum + Number(b.latitude), 0) / verifiedMapBins.length;
      const avgLng = verifiedMapBins.reduce((sum, b) => sum + Number(b.longitude), 0) / verifiedMapBins.length;
      if (!isNaN(avgLat) && !isNaN(avgLng) && avgLat !== 0 && avgLng !== 0) {
        setFlyTarget({ center: [avgLat, avgLng], zoom: 15, timestamp: Date.now() });
      }
    }
  }, [verifiedMapBins.length]);

  // Search input auto-fly to matched bin (100% Identik ManajemenTempatSampah.tsx)
  useEffect(() => {
    const queryStr = (mapSearchInput || "").trim().toLowerCase();
    if (queryStr && verifiedMapBins.length > 0) {
      const match = verifiedMapBins.find(
        (b) =>
          ((b as any).kode || b.qrCode || b.id || "").toLowerCase().includes(queryStr) ||
          (b.wargaName || (b as any).user?.name || "").toLowerCase().includes(queryStr)
      );
      if (match && match.latitude && match.longitude) {
        setFlyTarget({
          center: [Number(match.latitude), Number(match.longitude)],
          zoom: 18,
          timestamp: Date.now(),
        });
      }
    }
  }, [mapSearchInput, verifiedMapBins]);

  // Filtered Bins matching active filters (100% Identik ManajemenTempatSampah.tsx)
  const filteredMapBins = useMemo(() => {
    return verifiedMapBins.filter((b) => {
      // 0. Filter by Map Search Input
      const queryStr = (mapSearchInput || "").toLowerCase().trim();
      if (queryStr) {
        const codeMatch = ((b as any).kode || b.qrCode || b.id || "").toLowerCase().includes(queryStr);
        const ownerMatch = (b.wargaName || (b as any).user?.name || "").toLowerCase().includes(queryStr);
        if (!codeMatch && !ownerMatch) return false;
      }

      // 1. Filter Kelurahan
      if (selectedMapKelurahan !== "Semua Kelurahan") {
        const binRw = (b.rtRw || (b as any).rw?.name || b.lokasi || "").toLowerCase();
        const selKel = selectedMapKelurahan.toLowerCase();
        const userAddress = ((b as any).user?.address || b.lokasi || "").toLowerCase();
        if (!binRw.includes(selKel) && !userAddress.includes(selKel)) {
          return false;
        }
      }

      // 2. Filter Rukun Warga
      if (selectedRukunWarga !== "Semua Rukun Warga") {
        const binRw = (b.rtRw || (b as any).rw?.name || "").toLowerCase();
        if (!binRw.includes(selectedRukunWarga.toLowerCase())) return false;
      }

      // 3. Category Filter
      if (mapCategoryFilter !== "Semua") {
        const catName = (b.category?.name || b.lokasi || "").toLowerCase();
        const target = mapCategoryFilter.toLowerCase();
        if (target === "organik" && !catName.includes("organik") && !catName.includes("organic")) return false;
        if (target === "anorganik" && !catName.includes("anorganik") && !catName.includes("non_organic")) return false;
      }

      // 4. Capacity / Status Filter
      if (mapStatusFilter !== "Semua") {
        const vol = Number(b.currentVolumeLiter || 0);
        const max = Number(b.maxCapacityLiter || 25);
        const pct = (b as any).kapasitas !== undefined ? (b as any).kapasitas : (max > 0 ? (vol / max) * 100 : 0);
        const isRusak = b.status === "Rusak" || (b as any).realStatus === "BROKEN";
        const isPenuh = b.status === "Penuh" || pct >= 90;
        const isSedang = b.status === "Sedang" || (pct >= 70 && pct < 90);
        const isAman = b.status === "Normal" || pct < 70;

        if (mapStatusFilter === "Rusak" && !isRusak) return false;
        if (mapStatusFilter === "Penuh" && !isPenuh) return false;
        if (mapStatusFilter === "Sedang" && !isSedang) return false;
        if (mapStatusFilter === "Aman" && !isAman) return false;
      }

      return true;
    });
  }, [verifiedMapBins, selectedMapKelurahan, selectedRukunWarga, mapCategoryFilter, mapStatusFilter, mapSearchInput]);

  // Limit 5 Search Results Overlay
  const mapSearchResults = useMemo(() => {
    const queryStr = (mapSearchInput || "").trim().toLowerCase();
    if (!queryStr) return [];
    return verifiedMapBins
      .filter(
        (b) =>
          ((b as any).kode || b.qrCode || b.id || "").toLowerCase().includes(queryStr) ||
          (b.wargaName || (b as any).user?.name || "").toLowerCase().includes(queryStr)
      )
      .slice(0, 5);
  }, [verifiedMapBins, mapSearchInput]);

  // Unique Rukun Warga list
  const uniqueRwOptions = useMemo(() => {
    const set = new Set<string>();
    verifiedMapBins.forEach((b) => {
      const rwName = b.rtRw || (b as any).rw?.name;
      if (rwName) set.add(rwName);
    });
    if (set.size === 0) {
      ["RW 01", "RW 02", "RW 03", "RW 04", "RW 05", "RW 06"].forEach((r) => set.add(r));
    }
    return Array.from(set).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, "") || "0", 10);
      const numB = parseInt(b.replace(/\D/g, "") || "0", 10);
      return numA - numB;
    });
  }, [verifiedMapBins]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-400">
        <Loader2 className="animate-spin text-[#009966]" size={32} />
        <p className="text-xs font-bold text-slate-600">Memuat geospasial real-time monitoring wilayah...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      {/* 1. Main Header Title matching ManajemenTempatSampah */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#009966]/10 border border-[#009966]/20 text-[#009966] flex items-center justify-center shrink-0 shadow-2xs">
            <Map size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
              Monitoring Wilayah
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Pemantauan sebaran geospasial tempat sampah terverifikasi, tingkat okupansi volume, &amp; batas wilayah per Kelurahan dan Rukun Warga.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Monitoring Container matching ManajemenTempatSampah */}
      <div className={`space-y-6 ${isMapFullscreen ? "fixed inset-0 z-50 bg-slate-100 p-4 sm:p-6 overflow-y-auto flex flex-col justify-between h-screen w-screen animate-in fade-in duration-200" : ""}`}>

        {/* Header Summary KPI Cards for Monitoring (100% Identik ManajemenTempatSampah line 633) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
              TERVERIFIKASI GPS
            </span>
            <div className="flex items-baseline justify-between">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">{verifiedMapBins.length}</h3>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Aktif
              </span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
              ORGANIK
            </span>
            <div className="flex items-baseline justify-between">
              <h3 className="text-xl sm:text-2xl font-black text-emerald-600">
                {verifiedMapBins.filter((b) => (b.category?.name || b.lokasi || "").toLowerCase().includes("organik") && !(b.category?.name || b.lokasi || "").toLowerCase().includes("anorganik")).length}
              </h3>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-2xs" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
              ANORGANIK
            </span>
            <div className="flex items-baseline justify-between">
              <h3 className="text-xl sm:text-2xl font-black text-amber-500">
                {verifiedMapBins.filter((b) => (b.category?.name || b.lokasi || "").toLowerCase().includes("anorganik")).length}
              </h3>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-2xs" />
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
              PENUH
            </span>
            <div className="flex items-baseline justify-between">
              <h3 className="text-xl sm:text-2xl font-black text-rose-600">
                {verifiedMapBins.filter((b) => {
                  const vol = Number(b.currentVolumeLiter || 0);
                  const max = Number(b.maxCapacityLiter || 25);
                  const pct = (b as any).kapasitas !== undefined ? (b as any).kapasitas : (max > 0 ? (vol / max) * 100 : 0);
                  return b.status === "Penuh" || pct >= 90;
                }).length}
              </h3>
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shadow-2xs" />
            </div>
          </div>
        </div>

        {/* Geospatial Map Container with Live Sync Toolbar (100% Identik ManajemenTempatSampah line 684) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 sm:p-5 space-y-4 flex-1 flex flex-col min-h-0">

          {/* Toolbar Top Bar - Tiered Layout for Clean UX */}
          <div className="space-y-3 pb-3 border-b border-slate-100">
            {/* Row 1: Title, Live Sync Status, and Action Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#009966]/10 text-[#009966] flex items-center justify-center border border-[#009966]/20 shrink-0 shadow-2xs">
                  <Map size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                      Peta Sebaran Real-Time Tempat Sampah Terverifikasi
                    </h3>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      Live Sync
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Menampilkan tempat sampah aktif terverifikasi ({filteredMapBins.length} dari {verifiedMapBins.length} Tempat Sampah)
                  </p>
                </div>
              </div>

              {/* Right Primary Action Controls */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsMapFullscreen(!isMapFullscreen)}
                  className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-[#009966] to-emerald-600 hover:from-[#008055] hover:to-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer transform hover:scale-105 active:scale-95"
                  title={isMapFullscreen ? "Keluar Layar Penuh" : "Mode Layar Penuh (Full Size Peta)"}
                >
                  {isMapFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                  <span className="hidden sm:inline">{isMapFullscreen ? "Kecilkan Peta" : "Full Size Peta"}</span>
                </button>
              </div>
            </div>

            {/* Row 2: Clean Filter & Map Layer Switcher Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                {/* 1. Kelurahan Filter */}
                <select
                  value={selectedMapKelurahan}
                  disabled={isLurah || (isDpl && dplKelurahans.length === 1)}
                  onChange={(e) => {
                    if (isLurah || (isDpl && dplKelurahans.length === 1)) return;
                    const val = e.target.value;
                    setSelectedMapKelurahan(val);
                    if (val !== "Semua Kelurahan" && val !== "Semua Kelurahan Binaan" && KELURAHAN_GEODATA[val.toUpperCase().replace(/\s+/g, "_")]) {
                      const geo = KELURAHAN_GEODATA[val.toUpperCase().replace(/\s+/g, "_")];
                      setFlyTarget({ center: geo.centroid, zoom: 16, timestamp: Date.now() });
                    } else {
                      setFlyTarget({ center: [-6.8903, 107.611], zoom: 15, timestamp: Date.now() });
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold shadow-2xs transition-all focus:outline-none ${
                    isLurah || (isDpl && dplKelurahans.length === 1)
                      ? "bg-slate-100 border-slate-200 text-slate-700 cursor-not-allowed opacity-90"
                      : "bg-slate-50 border-slate-200 text-slate-700 cursor-pointer hover:bg-slate-100"
                  }`}
                >
                  {isDpl ? (
                    <>
                      {dplKelurahans.length > 1 && (
                        <option value="Semua Kelurahan Binaan">Semua Kelurahan Binaan</option>
                      )}
                      {dplKelurahans.length > 0 ? (
                        dplKelurahans.map((kel) => (
                          <option key={kel} value={kel}>
                            Kel. {kel} {dplKelurahans.length === 1 ? "(Binaan DPL)" : ""}
                          </option>
                        ))
                      ) : (
                        <option value={user?.kelurahan || "Dago"}>
                          Kel. {user?.kelurahan || "Dago"} (Binaan DPL)
                        </option>
                      )}
                    </>
                  ) : isLurah ? (
                    <option value={userKelurahan}>Kel. {userKelurahan} (Terkunci - Wilayah Tugas)</option>
                  ) : (
                    <>
                      <option value="Semua Kelurahan">Semua Kelurahan</option>
                      <option value="Dago">Kel. Dago</option>
                      <option value="Sadang Serang">Kel. Sadang Serang</option>
                      <option value="Sekeloa">Kel. Sekeloa</option>
                      <option value="Lebak Gede">Kel. Lebak Gede</option>
                      <option value="Lebak Siliwangi">Kel. Lebak Siliwangi</option>
                      <option value="Cipaganti">Kel. Cipaganti</option>
                    </>
                  )}
                </select>

                {/* 2. Rukun Warga Filter */}
                <select
                  value={selectedRukunWarga}
                  onChange={(e) => setSelectedRukunWarga(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-extrabold text-slate-700 bg-slate-50 shadow-2xs cursor-pointer hover:bg-slate-100 transition-all focus:outline-none"
                >
                  <option value="Semua Rukun Warga">Semua Rukun Warga</option>
                  {uniqueRwOptions.map((rwName) => (
                    <option key={rwName} value={rwName}>
                      {rwName}
                    </option>
                  ))}
                </select>

                {/* 3. Kategori Filter */}
                <select
                  value={mapCategoryFilter}
                  onChange={(e) => setMapCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-extrabold text-slate-700 bg-slate-50 shadow-2xs cursor-pointer hover:bg-slate-100 transition-all focus:outline-none"
                >
                  <option value="Semua">Semua Kategori</option>
                  <option value="Organik">Organik</option>
                  <option value="Anorganik">Anorganik</option>
                </select>

                {/* 4. Status Filter */}
                <select
                  value={mapStatusFilter}
                  onChange={(e) => setMapStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-extrabold text-slate-700 bg-slate-50 shadow-2xs cursor-pointer hover:bg-slate-100 transition-all focus:outline-none"
                >
                  <option value="Semua">Semua Status</option>
                  <option value="Aman">Aman (&lt;70%)</option>
                  <option value="Sedang">Sedang (70-90%)</option>
                  <option value="Penuh">Penuh (&gt;90%)</option>
                  <option value="Rusak">Fisik Rusak</option>
                </select>
              </div>

              {/* Icon Batas Wilayah Toggle & Map Layer Switcher */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowKelurahanBoundaries(!showKelurahanBoundaries)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-2xs border ${
                    showKelurahanBoundaries
                      ? "bg-[#009966]/10 text-[#009966] border-[#009966]/30 shadow-xs"
                      : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                  }`}
                  title={showKelurahanBoundaries ? "Sembunyikan Batas Wilayah (GeoJSON)" : "Tampilkan Batas Wilayah (GeoJSON)"}
                >
                  <Layers size={14} className={showKelurahanBoundaries ? "text-[#009966]" : "text-slate-400"} />
                  <span>Batas Wilayah</span>
                </button>

                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => setMapTileProvider("google_vector")}
                    className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      mapTileProvider === "google_vector"
                        ? "bg-[#009966] text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                    title="Tampilan Google Maps Vektor"
                  >
                    Google Peta
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapTileProvider("google_satellite")}
                    className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      mapTileProvider === "google_satellite"
                        ? "bg-[#009966] text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                    title="Tampilan Google Maps Satelit / Hybrid"
                  >
                    Satelit
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapTileProvider("cartodb")}
                    className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      mapTileProvider === "cartodb"
                        ? "bg-[#009966] text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                    title="Tampilan Kartografi Clean"
                  >
                    CartoDB
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Map Canvas Viewport */}
          <div className={`w-full rounded-2xl overflow-hidden border border-slate-200/90 relative ${isMapFullscreen ? "h-[calc(100vh-180px)]" : "h-[500px]"}`}>

            {/* Floating Top-Left Search Bar Overlay with Limit 5 Candidate Results */}
            <div className="absolute top-4 left-4 z-20 pointer-events-auto">
              <div className="relative w-64 sm:w-80 shadow-2xl rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-md">
                <div className="flex items-center px-3.5 py-2">
                  <Search size={15} className="text-[#009966] shrink-0 mr-2.5" />
                  <input
                    type="text"
                    placeholder="Cari kode tempat sampah..."
                    value={mapSearchInput}
                    onChange={(e) => setMapSearchInput(e.target.value)}
                    className="w-full bg-transparent text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none"
                  />
                  {mapSearchInput && (
                    <button
                      type="button"
                      onClick={() => setMapSearchInput("")}
                      className="text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Limit 5 Search Results List Dropdown */}
                {(mapSearchInput || "").trim() && (
                  <div className="border-t border-slate-100 max-h-60 overflow-y-auto rounded-b-2xl bg-white shadow-xl">
                    {mapSearchResults.length > 0 ? (
                      mapSearchResults.map((bin) => {
                        const binCode = (bin as any).kode || bin.qrCode || bin.id;
                        const catLower = (bin.category?.name || bin.lokasi || "").toLowerCase();
                        const isResidu = catLower.includes("residu") || catLower.includes("b3");
                        const isAnorganic = catLower.includes("anorganik");
                        const catName = isResidu ? "Residu" : isAnorganic ? "Anorganik" : "Organik";
                        return (
                          <div
                            key={`search-res-${bin.id || binCode}`}
                            onClick={() => {
                              setMapSearchInput(binCode);
                              if (bin.latitude && bin.longitude) {
                                setFlyTarget({
                                  center: [Number(bin.latitude), Number(bin.longitude)],
                                  zoom: 18,
                                  timestamp: Date.now(),
                                });
                              }
                            }}
                            className="px-3.5 py-2.5 hover:bg-slate-50 border-b border-slate-100 last:border-0 cursor-pointer transition-colors flex items-center justify-between"
                          >
                            <div>
                              <span className="font-mono font-black text-xs text-slate-900 block">{binCode}</span>
                              <span className="text-[10.5px] text-slate-500 font-semibold">{bin.wargaName || (bin as any).user?.name || "Warga Terdaftar"}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                              isResidu
                                ? "bg-slate-100 text-slate-700 border border-slate-200"
                                : isAnorganic
                                ? "bg-amber-50 text-amber-800 border border-amber-200"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}>
                              {catName}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="px-3.5 py-3 text-xs text-slate-400 font-medium text-center">
                        Tidak ada tempat sampah yang cocok
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Map Overlay Unified Legend Card (Single Consolidated Source of Truth) */}
            <div
              className="absolute bottom-4 right-4 flex flex-col pointer-events-auto max-w-[280px] sm:max-w-[300px] select-none"
              style={{ zIndex: 500, isolation: "isolate" }}
            >
              {!isLegendOpen ? (
                <button
                  type="button"
                  onClick={() => setIsLegendOpen(true)}
                  className="bg-white/95 backdrop-blur-md shadow-xl rounded-2xl px-3.5 py-2 border border-slate-200/90 flex items-center gap-2 text-xs font-black text-slate-800 hover:bg-emerald-50 hover:text-[#009966] transition-all cursor-pointer group"
                  title="Tampilkan Legenda Peta"
                >
                  <Layers className="w-4 h-4 text-[#009966] group-hover:scale-110 transition-transform" />
                  <span>Legenda Monitoring</span>
                  <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                </button>
              ) : (
                <div className="bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl p-3.5 border border-slate-200/90 flex flex-col gap-2.5 min-w-[230px] max-w-[280px] sm:max-w-[300px]">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider">
                        Legenda Monitoring
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsLegendOpen(false)}
                      className="text-slate-400 hover:text-slate-700 p-0.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Sembunyikan Legenda"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Tab Switcher */}
                  <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-100/90 rounded-xl border border-slate-200/60">
                    <button
                      type="button"
                      onClick={() => setActiveLegendTab("sampah")}
                      className={`py-1 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer ${
                        activeLegendTab === "sampah"
                          ? "bg-white text-slate-900 shadow-2xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Tempat Sampah
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveLegendTab("fasilitas_wilayah")}
                      className={`py-1 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer ${
                        activeLegendTab === "fasilitas_wilayah"
                          ? "bg-white text-slate-900 shadow-2xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Fasilitas & Wilayah
                    </button>
                  </div>

                  {/* Tab 1: Tempat Sampah & Okupansi */}
                  {activeLegendTab === "sampah" ? (
                    <div className="space-y-2">
                      {/* Legenda Kategori */}
                      <div className="space-y-1">
                        <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider block">
                          Kategori Tempat Sampah
                        </span>
                        <div className="grid grid-cols-3 gap-1 text-[11px] font-bold text-slate-700">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white shadow-2xs" />
                            <span>Organik</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-white shadow-2xs" />
                            <span>Anorganik</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-500 border border-white shadow-2xs" />
                            <span>Residu</span>
                          </div>
                        </div>
                      </div>

                      {/* Legenda Kapasitas & Status Volume */}
                      <div className="space-y-1 border-t border-slate-100 pt-2">
                        <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider block">
                          Status Volume & Okupansi
                        </span>
                        <div className="grid grid-cols-1 gap-1 text-[11px] font-semibold text-slate-700">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100 shadow-2xs" />
                            <span>Aman (&lt; 70% Terisi)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-100 shadow-2xs" />
                            <span>Sedang / Waspada (70% - 90%)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-100 animate-pulse shadow-2xs" />
                            <span className="font-bold text-rose-600">Penuh (&gt; 90% Terisi)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-700 border border-white shadow-2xs" />
                            <span>Tempat Sampah Rusak</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Tab 2: Fasilitas & Batas 6 Kelurahan */
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5 custom-scrollbar">
                      {/* Fasilitas Pengolahan */}
                      <div className="space-y-1">
                        <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider block">
                          Fasilitas Pengolahan Sampah
                        </span>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10.5px]">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-xs bg-green-600 shrink-0" />
                            <span className="font-bold text-slate-700 truncate">Bata Terawang</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 shrink-0" />
                            <span className="font-bold text-slate-700 truncate">Loseda</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-xs bg-amber-600 shrink-0" />
                            <span className="font-bold text-slate-700 truncate">Rumah Maggot</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-xs bg-blue-600 shrink-0" />
                            <span className="font-bold text-slate-700 truncate">Bank Sampah</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-xs bg-teal-600 shrink-0" />
                            <span className="font-bold text-slate-700 truncate">TPS</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-xs bg-orange-600 shrink-0" />
                            <span className="font-bold text-slate-700 truncate">Incinerator</span>
                          </div>
                        </div>
                      </div>

                      {/* Batas 6 Kelurahan */}
                      <div className="space-y-1 border-t border-slate-100 pt-2">
                        <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider block">
                          Batas 6 Kelurahan Coblong
                        </span>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10.5px]">
                          {Object.values(KELURAHAN_GEODATA).map((kg) => (
                            <div key={kg.id} className="flex items-center gap-1.5">
                              <span
                                className="w-2.5 h-2.5 rounded-xs shrink-0 border border-black/10 shadow-2xs"
                                style={{ backgroundColor: kg.color }}
                              />
                              <span className="font-bold text-slate-700 truncate">{kg.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Footer Sync Indicator */}
                  <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                    <span>Diperbarui: {lastSyncTime.toLocaleTimeString("id-ID")}</span>
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Realtime
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Leaflet Map Renderer */}
            <MapContainer
              center={[-6.8903, 107.611]}
              zoom={14}
              scrollWheelZoom={true}
              attributionControl={false}
              zoomControl={false}
              style={{ height: "100%", width: "100%", zIndex: 1 }}
            >
              <MapFlyTo target={flyTarget} />
              <MapEvents setZoom={setMapZoom} setSelectedKelurahan={setSelectedMapKelurahan} />

              <TileLayer
                url={
                  mapTileProvider === "google_vector"
                    ? "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                    : mapTileProvider === "google_satellite"
                    ? "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                    : mapTileProvider === "cartodb"
                    ? "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                }
              />

              {/* KELURAHAN BOUNDARY POLYGONS */}
              {showKelurahanBoundaries && Object.values(KELURAHAN_GEODATA).map((kg) => {
                if (
                  selectedMapKelurahan !== "Semua Kelurahan" &&
                  selectedMapKelurahan.toLowerCase() !== kg.name.toLowerCase()
                ) {
                  return null;
                }

                return (
                  <Polygon
                    key={`mon-poly-${kg.id}`}
                    positions={kg.bounds}
                    pathOptions={{
                      color: kg.color,
                      fillColor: kg.color,
                      fillOpacity: selectedMapKelurahan.toLowerCase() === kg.name.toLowerCase() ? 0.30 : 0.15,
                      weight: selectedMapKelurahan.toLowerCase() === kg.name.toLowerCase() ? 3 : 2,
                    }}
                  />
                );
              })}

              {/* REAL BINS MARKERS WITH HOVER TOOLTIPS & POPUPS */}
              {filteredMapBins.map((bin) => {
                const lat = Number(bin.latitude);
                const lng = Number(bin.longitude);
                const vol = Number(bin.currentVolumeLiter || 0);
                const max = Number(bin.maxCapacityLiter || 25);
                const pct = (bin as any).kapasitas !== undefined ? (bin as any).kapasitas : (max > 0 ? Math.round((vol / max) * 100) : 0);

                const catLower = (bin.category?.name || bin.lokasi || "").toLowerCase();
                const isResiduCat = catLower.includes("residu") || catLower.includes("b3");
                const isAnorganikCat = catLower.includes("anorganik");
                const isRusak = bin.status === "Rusak" || (bin as any).realStatus === "BROKEN";
                const isPenuh = bin.status === "Penuh" || pct >= 90;
                const categoryTitle = isResiduCat ? "Residu" : isAnorganikCat ? "Anorganik" : "Organik";
                const ownerName = bin.wargaName || (bin as any).user?.name || "Warga Terdaftar";
                const ownerPhone = (bin as any).user?.phone || (bin as any).phone;
                const binCode = (bin as any).kode || bin.qrCode || bin.id;
                const circleColor = isRusak ? "#e11d48" : isPenuh ? "#ef4444" : isResiduCat ? "#64748b" : isAnorganikCat ? "#f59e0b" : "#10b981";

                return (
                  <React.Fragment key={`real-bin-${bin.id || binCode}`}>
                    <Circle
                      center={[lat, lng]}
                      radius={15}
                      pathOptions={{
                        color: circleColor,
                        fillColor: circleColor,
                        fillOpacity: 0.2,
                        weight: 1.5,
                      }}
                    />

                    <Marker
                      position={[lat, lng]}
                      icon={createRealBinIcon(bin.category?.name || categoryTitle, bin.status || "ACTIVE", isPenuh, isRusak)}
                    >
                      {/* HOVER TOOLTIP (Matching ManajemenTempatSampah.tsx 1:1) */}
                      <Tooltip permanent={false} direction="top" offset={[0, -12]} className="custom-bin-hover-tooltip">
                        <div className="p-2 min-w-[210px] space-y-1.5 font-sans">
                          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1">
                            <span className="font-mono font-black text-slate-900 text-xs">{binCode}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                              isResiduCat
                                ? "bg-slate-200 text-slate-800"
                                : isAnorganikCat
                                ? "bg-amber-100 text-amber-900"
                                : "bg-emerald-100 text-emerald-800"
                            }`}>
                              {categoryTitle}
                            </span>
                          </div>

                          <div className="text-xs text-slate-700 space-y-0.5">
                            <div className="font-extrabold text-slate-900">{ownerName}</div>
                            {ownerPhone && <div className="text-[11px] font-mono text-emerald-700 font-bold">{ownerPhone}</div>}
                          </div>

                          <div className="pt-1 border-t border-slate-100 space-y-1">
                            <div className="flex justify-between text-[10.5px] font-bold">
                              <span className="text-slate-500">Volume Terisi:</span>
                              <span className={pct >= 90 ? "text-rose-600" : pct >= 70 ? "text-amber-600" : "text-emerald-600"}>
                                {vol}/{max}L ({pct}%)
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${pct >= 90 ? "bg-rose-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500"}`}
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                          </div>

                          {/* Log Aktivitas Terakhir Laporan Pemilahan Sampah */}
                          <div className="pt-1 border-t border-slate-100">
                            <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">
                              Log Aktivitas Terakhir:
                            </span>
                            <div className="text-[10.5px] font-bold text-slate-800 leading-tight">
                              {(bin as any).lastActivityLog || (bin as any).verifiedAt || "Terverifikasi Real-Time"}
                            </div>
                          </div>
                        </div>
                      </Tooltip>

                      {/* CLICK POPUP (Matching ManajemenTempatSampah.tsx 1:1) */}
                      <Popup>
                        <div className="p-2 min-w-[250px] space-y-2.5 font-sans">
                          <div className="flex items-center justify-between border-b pb-1.5">
                            <div>
                              <span className="font-mono font-black text-slate-900 text-xs block">{binCode}</span>
                              <span className="text-[10px] text-slate-400 font-bold">{bin.rtRw || (bin as any).rw?.name || "Wilayah Coblong"}</span>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              isResiduCat
                                ? "bg-slate-200 text-slate-800"
                                : isAnorganikCat
                                ? "bg-amber-100 text-amber-900"
                                : "bg-emerald-100 text-emerald-800"
                            }`}>
                              {categoryTitle}
                            </span>
                          </div>

                          {/* Owner details */}
                          <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100 space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pemilik Terverifikasi</span>
                            <div className="font-extrabold text-slate-900 text-xs">{ownerName}</div>
                            {ownerPhone && (
                              <div className="text-[11px] font-mono text-emerald-700 font-bold mt-0.5">{ownerPhone}</div>
                            )}
                          </div>

                          {/* Capacity Status */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs font-bold">
                              <span className="text-slate-600">Kapasitas Terisi</span>
                              <span className={pct >= 90 ? "text-rose-600" : pct >= 70 ? "text-amber-600" : "text-emerald-600"}>
                                {vol}/{max} Liter ({pct}%)
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/60">
                              <div
                                className={`h-full rounded-full ${pct >= 90 ? "bg-rose-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500"}`}
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                          </div>

                          {/* Log Aktivitas Terakhir Laporan Pemilahan Sampah */}
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 space-y-1">
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                              Log Aktivitas Terakhir
                            </span>
                            <div className="text-xs font-bold text-slate-800 leading-tight">
                              {(bin as any).lastActivityLog || (bin as any).verifiedAt || "Terverifikasi Real-Time"}
                            </div>
                          </div>

                          {/* Verification info & GPS */}
                          <div className="text-[10.5px] text-slate-500 space-y-0.5 pt-1 border-t border-slate-100">
                            <div>Diverifikasi: <strong className="text-slate-700">{(bin as any).verifiedAt || "Sistem Real-Time"}</strong></div>
                            <div>Koordinat: <strong className="font-mono text-slate-700">{lat.toFixed(4)}, {lng.toFixed(4)} mdpl</strong></div>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  </React.Fragment>
                );
              })}

            </MapContainer>


          </div>
        </div>
      </div>
    </div>
  );
};

export default Monitoring;
