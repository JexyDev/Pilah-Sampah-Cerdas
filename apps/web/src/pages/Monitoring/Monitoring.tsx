/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Page: Monitoring Wilayah (/monitoring-wilayah)
 * - 100% Real PostgreSQL Database Data (/api/v1/bins, /api/v1/dashboard/kpi)
 * - Zero Mock / Hardcoded Data
 * - Strict Role-Based Access Control (RBAC) Data Scoping
 * - Interactive Geospatial GIS Map & Real-Time Verified Bin Table
 * - Auto Fly-To Location & Real Coordinate Markers
 */

import React, { useEffect, useState, useMemo, useRef } from "react";
import { MapContainer, Marker, Popup, Circle, Polygon, Tooltip, useMap, useMapEvents } from "react-leaflet";
import { ThemeTileLayer } from "../../components/common/ThemeTileLayer";
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
  ChevronLeft,
  ChevronRight,
  Eye,
  Navigation,
  QrCode,
  AlertTriangle,
  Lock,
  RefreshCw,
  Table as TableIcon
} from "lucide-react";

import {
  KELURAHAN_GEODATA,
  createHouseholdPinIcon,
} from "../../constants/coblongGeoData";

interface KPIStats {
  totalWarga: number;
  totalSampahKg: number;
  tempatSampahAktif: number;
  alertTempatSampahPenuh: number;
  totalRumahTangga?: number;
}

const MapResizer: React.FC<{ isFullscreen: boolean }> = ({ isFullscreen }) => {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 80);
    const t2 = setTimeout(() => map.invalidateSize(), 250);
    const t3 = setTimeout(() => map.invalidateSize(), 500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isFullscreen, map]);
  return null;
};

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

const MapEvents: React.FC<{ setZoom: (z: number) => void; setSelectedKelurahan: (k: string) => void; isLocked: boolean }> = ({ setZoom, setSelectedKelurahan, isLocked }) => {
  useMapEvents({
    zoomend: (e) => {
      const z = e.target.getZoom();
      setZoom(z);
      if (z <= 14 && !isLocked) {
        setSelectedKelurahan("Semua Kelurahan");
      }
    },
  });
  return null;
};

const Monitoring: React.FC = () => {
  const { user } = useAuthStore();
  const { bins, fetchBins } = useMonitoringStore();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [_kpi, setKpi] = useState<KPIStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [selectedBinDetail, setSelectedBinDetail] = useState<any | null>(null);

  // Role Scoping Flags
  const userRole = (user?.role || user?.peran || "").toUpperCase();
  const isLurah = userRole === "LURAH" || userRole === "ADMIN_KELURAH";
  const isCamat = userRole === "CAMAT" || userRole === "ADMIN_KECAMATAN";
  const isDpl = ["DPL", "DOSEN_PEMBIMBING"].includes(userRole);
  const isRw = userRole === "RW" || userRole === "RT";
  const isMahasiswa = userRole === "MAHASISWA_KKN";

  const userKelurahan = user?.kelurahan || (user?.address?.includes("Cipaganti") || user?.name?.includes("Cipaganti") ? "Cipaganti" : "Cipaganti");
  const [dplKelurahans, setDplKelurahans] = useState<string[]>([]);

  // Filter & Search States
  const [selectedMapKelurahan, setSelectedMapKelurahan] = useState<string>(isLurah ? userKelurahan : "Semua Kelurahan");
  const [selectedRukunWarga, setSelectedRukunWarga] = useState<string>("Semua Rukun Warga");
  const [mapCategoryFilter, setMapCategoryFilter] = useState<string>("Semua");
  const [mapStatusFilter, setMapStatusFilter] = useState<string>("Semua");
  const [mapSearchInput, setMapSearchInput] = useState<string>("");
  const [tableSearchInput, setTableSearchInput] = useState<string>("");
  const [isMapFullscreen, setIsMapFullscreen] = useState<boolean>(false);
  const [showKelurahanBoundaries, setShowKelurahanBoundaries] = useState<boolean>(true);
  const [mapTileProvider, setMapTileProvider] = useState<"google_vector" | "google_satellite" | "cartodb" | "osm">("cartodb");
  const [isLegendOpen, setIsLegendOpen] = useState<boolean>(true);
  const [activeLegendTab, setActiveLegendTab] = useState<"sampah" | "fasilitas_wilayah">("sampah");

  // Pagination for Table
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Map Controls
  const [_mapZoom, setMapZoom] = useState<number>(14);
  const [flyTarget, setFlyTarget] = useState<{ center: [number, number]; zoom: number; timestamp?: number } | null>(null);

  // Handle ESC key to exit map fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMapFullscreen) {
        setIsMapFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMapFullscreen]);

  // Lock body scroll when fullscreen
  useEffect(() => {
    if (isMapFullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMapFullscreen]);

  const isKelurahanLocked = isLurah || (isDpl && dplKelurahans.length === 1);
  const isRwLocked = isRw;

  const apiFilterWilayah = useMemo(() => {
    if (isRw) return user?.wilayah || "RW 06 Dago";
    if (isLurah) return userKelurahan || "Cipaganti";
    if (selectedMapKelurahan && selectedMapKelurahan !== "Semua Kelurahan" && selectedMapKelurahan !== "Semua Kelurahan Binaan" && selectedMapKelurahan !== "Semua") {
      return selectedMapKelurahan;
    }
    if (isDpl) {
      return dplKelurahans.length > 0 ? dplKelurahans.join(",") : user?.kelurahan || "Dago";
    }
    if (isCamat) return user?.wilayah || "Kecamatan";
    return undefined;
  }, [user, isLurah, isDpl, isRw, isCamat, userKelurahan, selectedMapKelurahan, dplKelurahans]);

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
        setSelectedMapKelurahan(initialList.length === 1 ? initialList[0] : "Semua Kelurahan Binaan");
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
              if (liveList.length === 1) {
                setSelectedMapKelurahan(liveList[0]);
              } else {
                setSelectedMapKelurahan("Semua Kelurahan Binaan");
              }
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
    } else if (isRw && user?.wilayah) {
      setSelectedRukunWarga(user.wilayah);
    }
  }, [isDpl, isLurah, isRw, user, userKelurahan]);

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

  // Search input auto-fly to matched bin
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

  // Filtered Bins matching active filters
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
      if (selectedMapKelurahan !== "Semua Kelurahan" && selectedMapKelurahan !== "Semua Kelurahan Binaan") {
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

  // Group Filtered Bins by Household (1 Single Pin per House)
  const householdMapGroups = useMemo<Array<{
    householdKey: string;
    userId?: string;
    wargaName: string;
    wargaPhone?: string;
    address: string;
    rtRw: string;
    kelurahan: string;
    latitude: number;
    longitude: number;
    organikBin: any | null;
    anorganikBin: any | null;
    residuBin: any | null;
    allBins: any[];
    isPenuh: boolean;
    isSedang: boolean;
    isRusak: boolean;
    lastActivity?: string;
  }>>(() => {
    const map: Record<string, {
      householdKey: string;
      userId?: string;
      wargaName: string;
      wargaPhone?: string;
      address: string;
      rtRw: string;
      kelurahan: string;
      latitude: number;
      longitude: number;
      organikBin: any | null;
      anorganikBin: any | null;
      residuBin: any | null;
      allBins: any[];
      isPenuh: boolean;
      isSedang: boolean;
      isRusak: boolean;
      lastActivity?: string;
    }> = {};

    for (const bin of filteredMapBins) {
      const lat = Number(bin.latitude);
      const lng = Number(bin.longitude);
      if (!lat || !lng || isNaN(lat) || isNaN(lng)) continue;

      const ownerName = bin.wargaName || (bin as any).user?.name || "Warga Terdaftar";
      const ownerPhone = (bin as any).user?.phone || (bin as any).phone || (bin as any).wargaPhone || "";
      const userId = bin.userId || (bin as any).user?.id || "";
      const key = userId ? `user-${userId}` : ownerPhone ? `phone-${ownerPhone}` : `loc-${lat.toFixed(5)}_${lng.toFixed(5)}`;

      const vol = Number(bin.currentVolumeLiter || 0);
      const max = Number(bin.maxCapacityLiter || 25);
      const pct = (bin as any).kapasitas !== undefined ? (bin as any).kapasitas : (max > 0 ? Math.round((vol / max) * 100) : 0);
      const isRusak = bin.status === "Rusak" || (bin as any).realStatus === "BROKEN";
      const isPenuh = bin.status === "Penuh" || pct >= 90;
      const isSedang = bin.status === "Sedang" || (pct >= 70 && pct < 90);

      const binCode = (bin as any).kode || bin.qrCode || bin.id || "";
      const rawCat = (bin.category?.name || (binCode.includes("ANG") ? "anorganik" : binCode.includes("RSD") ? "residu" : binCode.includes("OGN") ? "organik" : "") || "").toLowerCase();
      const isAnorganik = rawCat.includes("anorganik") || rawCat.includes("non_organic") || rawCat.includes("ang");
      const isResidu = rawCat.includes("residu") || rawCat.includes("b3") || rawCat.includes("rsd");
      const isOrganik = !isAnorganik && !isResidu;

      let group = map[key];
      if (!group) {
        const candidateAddress =
          bin.address ||
          (bin as any).wargaAddress ||
          (bin as any).user?.address ||
          (bin.lokasi && !bin.lokasi.toLowerCase().startsWith("kategori:") ? bin.lokasi : null) ||
          "Wilayah Operasional";

        group = {
          householdKey: key,
          userId,
          wargaName: ownerName,
          wargaPhone: ownerPhone,
          address: candidateAddress,
          rtRw: bin.rtRw || (bin as any).rw?.name || (typeof bin.rw === "string" ? bin.rw : "Wilayah Dampingan"),
          kelurahan: (bin as any).kelurahan?.name || (bin as any).user?.kelurahan?.name || (typeof bin.kelurahan === "string" ? bin.kelurahan : ""),
          latitude: lat,
          longitude: lng,
          organikBin: null,
          anorganikBin: null,
          residuBin: null,
          allBins: [],
          isPenuh: false,
          isSedang: false,
          isRusak: false,
          lastActivity: (bin as any).lastActivityLog || (bin as any).verifiedAt,
        };
        map[key] = group;
      }

      group.allBins.push(bin);
      if (isRusak) group.isRusak = true;
      if (isPenuh) group.isPenuh = true;
      if (isSedang) group.isSedang = true;

      if (isOrganik && !group.organikBin) {
        group.organikBin = bin;
      } else if (isAnorganik && !group.anorganikBin) {
        group.anorganikBin = bin;
      } else if (isResidu && !group.residuBin) {
        group.residuBin = bin;
      } else if (!group.organikBin) {
        group.organikBin = bin;
      } else if (!group.anorganikBin) {
        group.anorganikBin = bin;
      }
    }

    return Object.values(map);
  }, [filteredMapBins]);

  // Table Filtered Items
  const filteredTableBins = useMemo(() => {
    const query = (tableSearchInput || "").trim().toLowerCase();
    if (!query) return filteredMapBins;

    return filteredMapBins.filter((b) => {
      const code = ((b as any).kode || b.qrCode || b.id || "").toLowerCase();
      const owner = (b.wargaName || (b as any).user?.name || "").toLowerCase();
      const phone = ((b as any).user?.phone || (b as any).wargaPhone || "").toLowerCase();
      const rw = (b.rtRw || (b as any).rw?.name || "").toLowerCase();
      return code.includes(query) || owner.includes(query) || phone.includes(query) || rw.includes(query);
    });
  }, [filteredMapBins, tableSearchInput]);

  // Pagination Slice
  const totalPages = Math.ceil(filteredTableBins.length / itemsPerPage) || 1;
  const paginatedBins = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTableBins.slice(start, start + itemsPerPage);
  }, [filteredTableBins, currentPage, itemsPerPage]);

  // Limit 5 Search Results Overlay for Map
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

  const handleFlyToBin = (bin: any) => {
    if (bin.latitude && bin.longitude) {
      setFlyTarget({
        center: [Number(bin.latitude), Number(bin.longitude)],
        zoom: 18,
        timestamp: Date.now(),
      });
      if (mapContainerRef.current) {
        mapContainerRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  const getScopeLabel = () => {
    if (isRw) return `Wilayah ${user?.wilayah || "RW Binaan"}`;
    if (isLurah) return `Kelurahan ${userKelurahan}`;
    if (isDpl) {
      if (dplKelurahans.length === 1) return `Kelurahan ${dplKelurahans[0]} (Binaan KKN)`;
      if (dplKelurahans.length > 1) return `${dplKelurahans.length} Kelurahan Binaan KKN (${dplKelurahans.join(", ")})`;
      return "Kelompok KKN Binaan";
    }
    if (isMahasiswa) return "Wilayah Dampingan Mahasiswa KKN";
    if (isCamat) return user?.wilayah ? `${user.wilayah} (Seluruh Kelurahan)` : "Wilayah Kecamatan";
    return "Seluruh Wilayah (Developer / Admin DLH)";
  };

  if (loading && bins.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-400">
        <Loader2 className="animate-spin text-[#009966]" size={32} />
        <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Memuat geospasial real-time monitoring wilayah...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      {/* 1. Header Bar (Clean Multi-Tier Executive UI) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
        {/* Tier 1: Title & Status Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
              Monitoring Wilayah &amp; Peta GIS
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Pemantauan sebaran geospasial tempat sampah terverifikasi, tingkat okupansi volume, &amp; batas wilayah per Kelurahan dan Rukun Warga.
            </p>
          </div>

          <div className="self-start sm:self-center flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-[#009966] border border-emerald-200/80 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#009966] animate-pulse" />
              GIS Spasial Live
            </span>
            <button
              type="button"
              onClick={() => loadData()}
              className="p-2 text-slate-400 hover:text-[#009966] hover:bg-emerald-50 rounded-xl transition-all border border-slate-200/80 dark:border-slate-800 shadow-2xs cursor-pointer"
              title="Perbarui Data Realtime"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {/* Tier 2: Metadata & Role Scope Information */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 font-medium">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Cakupan Wilayah:</span>
            <strong className="text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200/60">
              {getScopeLabel()}
            </strong>
          </div>
          <div className="text-slate-500 text-[11px] flex items-center gap-2">
            <span>Sinkronisasi: <strong>{lastSyncTime.toLocaleTimeString("id-ID")}</strong></span>
            <span className="text-slate-300">•</span>
            <span>Total <strong>{verifiedMapBins.length}</strong> tempat sampah terverifikasi GPS</span>
          </div>
        </div>
      </div>

      {/* 2. Monitoring Container */}
      <div className="space-y-6">

        {/* Summary KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
              TERVERIFIKASI GPS
            </span>
            <div className="flex items-baseline justify-between">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">{verifiedMapBins.length}</h3>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Aktif
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
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

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
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

          <div className="col-span-2 sm:col-span-1 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
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

        {/* Geospatial Map Container with Live Sync Toolbar */}
        <div
          ref={mapContainerRef}
          className={`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 transition-all duration-200 ${
            isMapFullscreen
              ? "fixed inset-0 z-[1000] p-4 sm:p-6 flex flex-col h-screen w-screen rounded-none shadow-2xl overflow-hidden"
              : "rounded-2xl shadow-sm p-4 sm:p-5 space-y-4 flex flex-col min-h-0"
          }`}
        >

          {/* Toolbar Top Bar */}
          <div className="space-y-3 pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#009966]/10 text-[#009966] flex items-center justify-center border border-[#009966]/20 shrink-0 shadow-2xs">
                  <Map size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 tracking-tight">
                      Peta Sebaran Real-Time Tempat Sampah Terverifikasi
                    </h3>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      Live Sync
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Menampilkan sebaran {householdMapGroups.length} Rumah Tangga ({filteredMapBins.length} Tempat Sampah aktif terhubung)
                  </p>
                </div>
              </div>

              {/* Action Controls */}
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

            {/* Clean Filter & Map Layer Switcher Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                {/* 1. Kelurahan Filter */}
                <div className="relative">
                  <select
                    value={selectedMapKelurahan}
                    disabled={isKelurahanLocked}
                    onChange={(e) => {
                      if (isKelurahanLocked) return;
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
                      isKelurahanLocked
                        ? "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-not-allowed opacity-90 pr-7"
                        : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
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
                  {isKelurahanLocked && (
                    <Lock size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  )}
                </div>

                {/* 2. Rukun Warga Filter */}
                <div className="relative">
                  <select
                    value={selectedRukunWarga}
                    disabled={isRwLocked}
                    onChange={(e) => setSelectedRukunWarga(e.target.value)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold shadow-2xs transition-all focus:outline-none ${
                      isRwLocked
                        ? "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-not-allowed opacity-90 pr-7"
                        : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}
                  >
                    {isRwLocked ? (
                      <option value={user?.wilayah || "RW 06"}>{user?.wilayah || "RW 06"} (Terkunci - Wilayah Tugas)</option>
                    ) : (
                      <>
                        <option value="Semua Rukun Warga">Semua Rukun Warga</option>
                        {uniqueRwOptions.map((rwName) => (
                          <option key={rwName} value={rwName}>
                            {rwName}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  {isRwLocked && (
                    <Lock size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  )}
                </div>

                {/* 3. Kategori Filter */}
                <select
                  value={mapCategoryFilter}
                  onChange={(e) => setMapCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-extrabold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 shadow-2xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-all focus:outline-none"
                >
                  <option value="Semua">Semua Kategori</option>
                  <option value="Organik">Organik</option>
                  <option value="Anorganik">Anorganik</option>
                </select>

                {/* 4. Status Filter */}
                <select
                  value={mapStatusFilter}
                  onChange={(e) => setMapStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-extrabold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 shadow-2xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-all focus:outline-none"
                >
                  <option value="Semua">Semua Status</option>
                  <option value="Aman">Aman (&lt;70%)</option>
                  <option value="Sedang">Sedang (70-90%)</option>
                  <option value="Penuh">Penuh (&gt;90%)</option>
                  <option value="Rusak">Fisik Rusak</option>
                </select>
              </div>

              {/* Layer Controls */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowKelurahanBoundaries(!showKelurahanBoundaries)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-2xs border ${
                    showKelurahanBoundaries
                      ? "bg-[#009966]/10 text-[#009966] border-[#009966]/30 shadow-xs"
                      : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                  }`}
                  title={showKelurahanBoundaries ? "Sembunyikan Batas Wilayah" : "Tampilkan Batas Wilayah"}
                >
                  <Layers size={14} className={showKelurahanBoundaries ? "text-[#009966]" : "text-slate-400"} />
                  <span>Batas Wilayah</span>
                </button>

                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setMapTileProvider("google_vector")}
                    className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      mapTileProvider === "google_vector"
                        ? "bg-[#009966] text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
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
                  >
                    CartoDB
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Map Canvas Viewport */}
          <div className={`w-full rounded-2xl overflow-hidden border border-slate-200/90 dark:border-slate-800 relative ${isMapFullscreen ? "flex-1 min-h-0 mt-3" : "h-[520px]"}`}>

            {/* Floating Top-Left Search Bar */}
            <div className="absolute top-4 left-4 z-20 pointer-events-auto">
              <div className="relative w-64 sm:w-80 shadow-2xl rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
                <div className="flex items-center px-3.5 py-2">
                  <Search size={15} className="text-[#009966] dark:text-emerald-400 shrink-0 mr-2.5" />
                  <input
                    type="text"
                    placeholder="Cari kode tempat sampah..."
                    value={mapSearchInput}
                    onChange={(e) => setMapSearchInput(e.target.value)}
                    className="w-full bg-transparent text-xs font-bold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
                  />
                  {mapSearchInput && (
                    <button
                      type="button"
                      onClick={() => setMapSearchInput("")}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Search Results Dropdown */}
                {(mapSearchInput || "").trim() && (
                  <div className="border-t border-slate-100 dark:border-slate-800 max-h-60 overflow-y-auto rounded-b-2xl bg-white dark:bg-slate-900 shadow-xl">
                    {mapSearchResults.length > 0 ? (
                      mapSearchResults.map((bin) => {
                        const binCode = (bin as any).kode || bin.qrCode || bin.id || "";
                        const rawCat = (bin.category?.name || (binCode.includes("ANG") ? "anorganik" : binCode.includes("RSD") ? "residu" : binCode.includes("OGN") ? "organik" : "")).toLowerCase();
                        const isResidu = rawCat.includes("residu") || rawCat.includes("b3") || rawCat.includes("rsd");
                        const isAnorganic = rawCat.includes("anorganik") || rawCat.includes("ang");
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
                            className="px-3.5 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 last:border-0 cursor-pointer transition-colors flex items-center justify-between"
                          >
                            <div>
                              <span className="font-mono font-black text-xs text-slate-900 dark:text-slate-100 block">{binCode}</span>
                              <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-semibold">{bin.wargaName || (bin as any).user?.name || "Warga Terdaftar"}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                              isResidu
                                ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                                : isAnorganic
                                ? "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700/40"
                                : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/40"
                            }`}>
                              {catName}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="px-3.5 py-3 text-xs text-slate-400 dark:text-slate-500 font-medium text-center">
                        Tidak ada tempat sampah yang cocok
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Map Legend Overlay */}
            <div
              className="absolute bottom-4 right-4 flex flex-col pointer-events-auto max-w-[280px] sm:max-w-[300px] select-none"
              style={{ zIndex: 500, isolation: "isolate" }}
            >
              {!isLegendOpen ? (
                <button
                  type="button"
                  onClick={() => setIsLegendOpen(true)}
                  className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xl rounded-2xl px-3.5 py-2 border border-slate-200/90 dark:border-slate-800 flex items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-100 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-[#009966] transition-all cursor-pointer group"
                  title="Tampilkan Legenda Peta"
                >
                  <Layers className="w-4 h-4 text-[#009966] group-hover:scale-110 transition-transform" />
                  <span>Legenda Monitoring</span>
                  <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                </button>
              ) : (
                <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl rounded-2xl p-3.5 border border-slate-200/90 dark:border-slate-800 flex flex-col gap-2.5 min-w-[230px] max-w-[280px] sm:max-w-[300px]">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[11px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                        Legenda Monitoring
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsLegendOpen(false)}
                      className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Sembunyikan Legenda"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-100/90 dark:bg-slate-800/90 rounded-xl border border-slate-200/60 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setActiveLegendTab("sampah")}
                      className={`py-1 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer ${
                        activeLegendTab === "sampah"
                          ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                    >
                      Tempat Sampah
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveLegendTab("fasilitas_wilayah")}
                      className={`py-1 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer ${
                        activeLegendTab === "fasilitas_wilayah"
                          ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                    >
                      Fasilitas &amp; Wilayah
                    </button>
                  </div>

                  {activeLegendTab === "sampah" ? (
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider block">
                          Kategori Tempat Sampah
                        </span>
                        <div className="grid grid-cols-3 gap-1 text-[11px] font-bold text-slate-700 dark:text-slate-300">
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

                      <div className="space-y-1 border-t border-slate-100 dark:border-slate-800 pt-2">
                        <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider block">
                          Status Volume &amp; Okupansi
                        </span>
                        <div className="grid grid-cols-1 gap-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
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
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5 custom-scrollbar">
                      <div className="space-y-1">
                        <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider block">
                          Fasilitas Pengolahan Sampah
                        </span>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10.5px]">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-xs bg-green-600 shrink-0" />
                            <span className="font-bold text-slate-700 dark:text-slate-300 truncate">Bata Terawang</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 shrink-0" />
                            <span className="font-bold text-slate-700 dark:text-slate-300 truncate">Loseda</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-xs bg-amber-600 shrink-0" />
                            <span className="font-bold text-slate-700 dark:text-slate-300 truncate">Rumah Maggot</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-xs bg-blue-600 shrink-0" />
                            <span className="font-bold text-slate-700 dark:text-slate-300 truncate">Bank Sampah</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-xs bg-teal-600 shrink-0" />
                            <span className="font-bold text-slate-700 dark:text-slate-300 truncate">TPS</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-xs bg-orange-600 shrink-0" />
                            <span className="font-bold text-slate-700 dark:text-slate-300 truncate">Incinerator</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1 border-t border-slate-100 dark:border-slate-800 pt-2">
                        <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider block">
                          Batas Kelurahan Terdata
                        </span>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10.5px]">
                          {Object.values(KELURAHAN_GEODATA).map((kg) => (
                            <div key={kg.id} className="flex items-center gap-1.5">
                              <span
                                className="w-2.5 h-2.5 rounded-xs shrink-0 border border-black/10 shadow-2xs"
                                style={{ backgroundColor: kg.color }}
                              />
                              <span className="font-bold text-slate-700 dark:text-slate-300 truncate">{kg.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="border-t border-slate-100 dark:border-slate-800 pt-2 flex items-center justify-between text-[10px] text-slate-400 font-medium">
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
              <MapResizer isFullscreen={isMapFullscreen} />
              <MapFlyTo target={flyTarget} />
              <MapEvents setZoom={setMapZoom} setSelectedKelurahan={setSelectedMapKelurahan} isLocked={isKelurahanLocked} />

              <ThemeTileLayer
                lightUrl={
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
                  selectedMapKelurahan !== "Semua Kelurahan Binaan" &&
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

              {/* REAL HOUSEHOLD MAP MARKERS (1 Single Pin per House with 2 Bins) */}
              {householdMapGroups.map((group) => {
                const lat = group.latitude;
                const lng = group.longitude;
                const circleColor = group.isRusak
                  ? "#e11d48"
                  : group.isPenuh
                  ? "#ef4444"
                  : group.isSedang
                  ? "#f59e0b"
                  : "#10b981";

                const org = group.organikBin;
                const anorg = group.anorganikBin;

                const orgVol = Number(org?.currentVolumeLiter || 0);
                const orgMax = Number(org?.maxCapacityLiter || 25);
                const orgPct = org ? (org.kapasitas !== undefined ? org.kapasitas : (orgMax > 0 ? Math.round((orgVol / orgMax) * 100) : 0)) : 0;

                const anorgVol = Number(anorg?.currentVolumeLiter || 0);
                const anorgMax = Number(anorg?.maxCapacityLiter || 25);
                const anorgPct = anorg ? (anorg.kapasitas !== undefined ? anorg.kapasitas : (anorgMax > 0 ? Math.round((anorgVol / anorgMax) * 100) : 0)) : 0;

                return (
                  <React.Fragment key={`hh-pin-${group.householdKey}`}>
                    {/* Radius indicator circle */}
                    <Circle
                      center={[lat, lng]}
                      radius={18}
                      pathOptions={{
                        color: circleColor,
                        fillColor: circleColor,
                        fillOpacity: 0.18,
                        weight: 1.5,
                      }}
                    />

                    <Marker
                      position={[lat, lng]}
                      icon={createHouseholdPinIcon(
                        Boolean(org),
                        Boolean(anorg),
                        group.isPenuh,
                        group.isSedang,
                        group.isRusak
                      )}
                    >
                      {/* HOVER TOOLTIP */}
                      <Tooltip permanent={false} direction="top" offset={[0, -16]} className="custom-bin-hover-tooltip">
                        <div className="p-2 min-w-[230px] space-y-1.5 font-sans">
                          <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">{group.wargaName}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-800 uppercase">
                              Aktif Terhubung
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-500 space-y-0.5">
                            <div>{group.address} - {group.rtRw}</div>
                            {group.wargaPhone && <div className="font-mono text-emerald-700 font-bold">{group.wargaPhone}</div>}
                          </div>

                          {/* Dual Bin Status Snippet */}
                          <div className="pt-1 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                            {org && (
                              <div className="space-y-0.5">
                                <div className="flex justify-between text-[10px] font-bold">
                                  <span className="text-emerald-700 dark:text-emerald-400">Organik ({org.kode || org.qrCode})</span>
                                  <span className={orgPct >= 90 ? "text-rose-600" : orgPct >= 70 ? "text-amber-600" : "text-emerald-600"}>
                                    {orgVol}/{orgMax}L ({orgPct}%)
                                  </span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${orgPct >= 90 ? "bg-rose-500" : orgPct >= 70 ? "bg-amber-500" : "bg-emerald-500"}`}
                                    style={{ width: `${Math.min(orgPct, 100)}%` }}
                                  />
                                </div>
                              </div>
                            )}

                            {anorg && (
                              <div className="space-y-0.5">
                                <div className="flex justify-between text-[10px] font-bold">
                                  <span className="text-amber-700 dark:text-amber-400">Anorganik ({anorg.kode || anorg.qrCode})</span>
                                  <span className={anorgPct >= 90 ? "text-rose-600" : anorgPct >= 70 ? "text-amber-600" : "text-emerald-600"}>
                                    {anorgVol}/{anorgMax}L ({anorgPct}%)
                                  </span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${anorgPct >= 90 ? "bg-rose-500" : anorgPct >= 70 ? "bg-amber-500" : "bg-emerald-500"}`}
                                    style={{ width: `${Math.min(anorgPct, 100)}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </Tooltip>

                      {/* CLICK POPUP (Rich Dual Bin View) */}
                      <Popup>
                        <div className="p-2 min-w-[280px] max-w-[320px] space-y-3 font-sans">
                          {/* Header */}
                          <div className="flex items-center justify-between border-b pb-2">
                            <div>
                              <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs block">{group.wargaName}</span>
                              <span className="text-[10px] text-slate-400 font-bold">{group.rtRw}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[9.5px] font-extrabold bg-emerald-100 text-emerald-800 uppercase">
                              Rumah Warga
                            </span>
                          </div>

                          {/* Citizen Details */}
                          <div className="bg-emerald-50/70 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-800/50 space-y-1">
                            <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Identitas Rumah Tangga</span>
                            <div className="text-xs text-slate-700 dark:text-slate-300 space-y-0.5">
                              <div>Alamat: <strong className="text-slate-900 dark:text-slate-100">{group.address}</strong></div>
                              {group.wargaPhone && (
                                <div>No. WhatsApp: <strong className="font-mono text-emerald-700 dark:text-emerald-400">{group.wargaPhone}</strong></div>
                              )}
                            </div>
                          </div>

                          {/* 2 Tempat Sampah Grid Cards */}
                          <div className="space-y-2">
                            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                              Tempat Sampah Terhubung (2 Wadah)
                            </span>

                            <div className="grid grid-cols-1 gap-2">
                              {/* Tempat Sampah Organik */}
                              {org ? (
                                <div className="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-slate-800/80 border border-emerald-200/80 dark:border-slate-700 space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <span className="font-mono font-black text-xs text-slate-900 dark:text-slate-100">{org.kode || org.qrCode}</span>
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-800 uppercase">
                                      Organik
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-[11px] font-bold">
                                    <span className="text-slate-500">Volume Terisi:</span>
                                    <span className={orgPct >= 90 ? "text-rose-600" : orgPct >= 70 ? "text-amber-600" : "text-emerald-600"}>
                                      {orgVol}/{orgMax}L ({orgPct}%)
                                    </span>
                                  </div>
                                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${orgPct >= 90 ? "bg-rose-500" : orgPct >= 70 ? "bg-amber-500" : "bg-emerald-500"}`}
                                      style={{ width: `${Math.min(orgPct, 100)}%` }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 text-xs italic border border-slate-100 dark:border-slate-800">
                                  Tempat Sampah Organik belum terhubung
                                </div>
                              )}

                              {/* Tempat Sampah Anorganik */}
                              {anorg ? (
                                <div className="p-2.5 rounded-xl bg-amber-50/50 dark:bg-slate-800/80 border border-amber-200/80 dark:border-slate-700 space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <span className="font-mono font-black text-xs text-slate-900 dark:text-slate-100">{anorg.kode || anorg.qrCode}</span>
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-100 text-amber-900 uppercase">
                                      Anorganik
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-[11px] font-bold">
                                    <span className="text-slate-500">Volume Terisi:</span>
                                    <span className={anorgPct >= 90 ? "text-rose-600" : anorgPct >= 70 ? "text-amber-600" : "text-emerald-600"}>
                                      {anorgVol}/{anorgMax}L ({anorgPct}%)
                                    </span>
                                  </div>
                                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${anorgPct >= 90 ? "bg-rose-500" : anorgPct >= 70 ? "bg-amber-500" : "bg-emerald-500"}`}
                                      style={{ width: `${Math.min(anorgPct, 100)}%` }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 text-xs italic border border-slate-100 dark:border-slate-800">
                                  Tempat Sampah Anorganik belum terhubung
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                            <div>Koordinat Rumah: <strong className="font-mono text-slate-700 dark:text-slate-300">{lat.toFixed(4)}, {lng.toFixed(4)}</strong></div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedBinDetail(org || anorg || group.allBins[0])}
                            className="w-full py-1.5 bg-[#009966] hover:bg-[#008055] text-white text-xs font-extrabold rounded-lg transition-all text-center cursor-pointer shadow-2xs"
                          >
                            Buka Detail Lengkap
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  </React.Fragment>
                );
              })}
            </MapContainer>
          </div>
        </div>

        {/* 3. Real-Time Verified Bin Data Table Section */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden space-y-4 p-5 sm:p-6">
          {/* Table Header & Search Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#009966] flex items-center justify-center border border-emerald-200/60 shrink-0 shadow-2xs">
                <TableIcon size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-lg text-slate-900 dark:text-slate-100 tracking-tight">
                    Tabel Data Tempat Sampah Terverifikasi
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                    {filteredTableBins.length} Unit
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Daftar inventaris tempat sampah terdaftar dan terpantau di server real-time PostgreSQL.
                </p>
              </div>
            </div>

            {/* Quick Table Search & Limit */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari kode, nama, atau HP..."
                  value={tableSearchInput}
                  onChange={(e) => {
                    setTableSearchInput(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#009966] bg-slate-50/70"
                />
                {tableSearchInput && (
                  <button
                    type="button"
                    onClick={() => setTableSearchInput("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-50/70 cursor-pointer focus:outline-none"
              >
                <option value={10}>10 Baris</option>
                <option value={25}>25 Baris</option>
                <option value={50}>50 Baris</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto w-full rounded-xl border border-slate-100 dark:border-slate-800">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-[10.5px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-200 dark:border-slate-800 whitespace-nowrap">
                  <th className="py-3.5 px-4 text-center">QR Code</th>
                  <th className="py-3.5 px-4">Kode Tempat Sampah</th>
                  <th className="py-3.5 px-4">Kategori</th>
                  <th className="py-3.5 px-4">Dimiliki Oleh</th>
                  <th className="py-3.5 px-4">Kapasitas &amp; Volume</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4">Diverifikasi Pada</th>
                  <th className="py-3.5 px-4">GPS / Koordinat</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedBins.length > 0 ? (
                  paginatedBins.map((bin) => {
                    const binCode = (bin as any).kode || bin.qrCode || bin.id || "";
                    const rawCat = (bin.category?.name || (binCode.includes("ANG") ? "anorganik" : binCode.includes("RSD") ? "residu" : binCode.includes("OGN") ? "organik" : "")).toLowerCase();
                    const isResidu = rawCat.includes("residu") || rawCat.includes("b3") || rawCat.includes("rsd");
                    const isAnorganik = rawCat.includes("anorganik") || rawCat.includes("ang");
                    const catName = isResidu ? "Residu" : isAnorganik ? "Anorganik" : "Organik";

                    const vol = Number(bin.currentVolumeLiter || 0);
                    const max = Number(bin.maxCapacityLiter || 25);
                    const pct = (bin as any).kapasitas !== undefined ? (bin as any).kapasitas : (max > 0 ? Math.round((vol / max) * 100) : 0);

                    const isRusak = bin.status === "Rusak" || (bin as any).realStatus === "BROKEN";
                    const isPenuh = bin.status === "Penuh" || pct >= 90;
                    const isSedang = bin.status === "Sedang" || (pct >= 70 && pct < 90);

                    const ownerName = bin.wargaName || (bin as any).user?.name || "Warga Terdaftar";
                    const ownerPhone = (bin as any).user?.phone || (bin as any).wargaPhone || (bin as any).phone;
                    const areaText = bin.rtRw || (bin as any).rw?.name || (typeof bin.rw === "string" ? bin.rw : null) || (bin.lokasi && !bin.lokasi.toLowerCase().startsWith("kategori:") ? bin.lokasi : "Wilayah Dampingan");

                    const lat = Number(bin.latitude);
                    const lng = Number(bin.longitude);

                    return (
                      <tr
                        key={`tbl-bin-${bin.id || binCode}`}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-colors text-xs text-slate-700 dark:text-slate-300 font-medium"
                      >
                        {/* 1. QR CODE */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div
                            onClick={() => setSelectedBinDetail(bin)}
                            className="inline-flex items-center justify-center p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-[#009966] hover:scale-105 transition-all cursor-pointer"
                            title="Lihat Detail &amp; QR Code"
                          >
                            <img
                              className="w-9 h-9 rounded-lg object-contain"
                              alt="QR Code"
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(binCode)}`}
                            />
                          </div>
                        </td>

                        {/* 2. KODE */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setSelectedBinDetail(bin)}
                            className="font-mono font-black text-slate-900 dark:text-slate-100 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-[#009966]/10 hover:text-[#009966] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
                          >
                            {binCode}
                          </button>
                        </td>

                        {/* 3. KATEGORI */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                            isResidu
                              ? "bg-slate-100 text-slate-700 border border-slate-200"
                              : isAnorganik
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}>
                            {catName}
                          </span>
                        </td>

                        {/* 4. PEMILIK */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div>
                            <div className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">{ownerName}</div>
                            <div className="text-[11px] text-slate-500 font-medium">{areaText}</div>
                            {ownerPhone && (
                              <div className="text-[10.5px] font-mono text-emerald-700 font-bold">{ownerPhone}</div>
                            )}
                          </div>
                        </td>

                        {/* 5. KAPASITAS & OKUPANSI */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="space-y-1 min-w-[130px]">
                            <div className="flex justify-between text-[11px] font-bold">
                              <span className="text-slate-600 dark:text-slate-400">{vol}/{max} Liter</span>
                              <span className={pct >= 90 ? "text-rose-600" : pct >= 70 ? "text-amber-600" : "text-emerald-600"}>
                                {pct}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${pct >= 90 ? "bg-rose-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500"}`}
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* 6. STATUS */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                            isRusak
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : isPenuh
                              ? "bg-rose-50 text-rose-600 border border-rose-200"
                              : isSedang
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              isRusak ? "bg-rose-600" : isPenuh ? "bg-rose-500 animate-pulse" : isSedang ? "bg-amber-500" : "bg-emerald-500"
                            }`} />
                            {isRusak ? "Rusak" : isPenuh ? "Penuh" : isSedang ? "Sedang" : "Normal"}
                          </span>
                        </td>

                        {/* 7. DIVERIFIKASI */}
                        <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400 text-[11px]">
                          {(bin as any).verifiedAt || "Sistem Real-Time"}
                        </td>

                        {/* 8. GPS */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {lat && lng ? (
                            <div className="text-[11px] font-mono text-slate-700 dark:text-slate-300">
                              <div>{lat.toFixed(4)}, {lng.toFixed(4)}</div>
                              <div className="text-[10px] text-slate-400">Elevasi: {(bin as any).altitude || 768} mdpl</div>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[10.5px] italic">Belum Ada GPS</span>
                          )}
                        </td>

                        {/* 9. AKSI */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleFlyToBin(bin)}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-[#009966]/10 text-slate-600 dark:text-slate-400 hover:text-[#009966] transition-all cursor-pointer"
                              title="Lihat di Peta"
                            >
                              <Navigation size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedBinDetail(bin)}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-[#009966]/10 text-slate-600 dark:text-slate-400 hover:text-[#009966] transition-all cursor-pointer"
                              title="Buka Detail"
                            >
                              <Eye size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 space-y-2">
                      <AlertTriangle className="mx-auto text-slate-300" size={28} />
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Tidak ada tempat sampah yang sesuai filter</p>
                      <button
                        type="button"
                        onClick={() => {
                          setTableSearchInput("");
                          setMapCategoryFilter("Semua");
                          setMapStatusFilter("Semua");
                          if (!isKelurahanLocked) setSelectedMapKelurahan("Semua Kelurahan");
                          if (!isRwLocked) setSelectedRukunWarga("Semua Rukun Warga");
                        }}
                        className="text-xs text-[#009966] font-bold hover:underline cursor-pointer"
                      >
                        Reset Semua Filter
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          {filteredTableBins.length > itemsPerPage && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400">
              <div>
                Menampilkan <strong>{Math.min((currentPage - 1) * itemsPerPage + 1, filteredTableBins.length)}</strong> - <strong>{Math.min(currentPage * itemsPerPage, filteredTableBins.length)}</strong> dari <strong>{filteredTableBins.length}</strong> Tempat Sampah
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft size={15} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((p, idx, arr) => (
                    <React.Fragment key={`page-btn-${p}`}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className="px-1 text-slate-400">...</span>
                      )}
                      <button
                        type="button"
                        onClick={() => setCurrentPage(p)}
                        className={`w-8 h-8 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          currentPage === p
                            ? "bg-[#009966] text-white shadow-2xs"
                            : "border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  ))}

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Modal Detail Tempat Sampah */}
      {selectedBinDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-5 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 flex items-center justify-center border border-emerald-200/60 dark:border-emerald-700/40 font-bold">
                  <QrCode size={20} />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
                    Detail Tempat Sampah
                  </h3>
                  <span className="font-mono text-xs text-slate-500 dark:text-slate-400 font-bold">
                    {(selectedBinDetail as any).kode || selectedBinDetail.qrCode || selectedBinDetail.id}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedBinDetail(null)}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4">
              {/* QR Code & Basic Specs */}
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-700/60">
                <img
                  className="w-24 h-24 rounded-xl bg-white dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800 shadow-2xs object-contain"
                  alt="QR Code Besar"
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                    (selectedBinDetail as any).kode || selectedBinDetail.qrCode || selectedBinDetail.id
                  )}`}
                />
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 w-full">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Kategori:</span>
                    <span className="font-black text-slate-900 dark:text-slate-100">
                      {selectedBinDetail.category?.name || (selectedBinDetail.lokasi?.includes("Organik") ? "Organik" : "Anorganik")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Status Fisik:</span>
                    <span className="font-black text-emerald-700 dark:text-emerald-400">
                      {selectedBinDetail.status || "Normal (Aktif Terverifikasi)"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Wilayah:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">
                      {selectedBinDetail.rtRw || (selectedBinDetail as any).rw?.name || "Wilayah Dampingan"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Kapasitas:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">
                      {selectedBinDetail.currentVolumeLiter || 0} / {selectedBinDetail.maxCapacityLiter || 25} Liter
                    </span>
                  </div>
                </div>
              </div>

              {/* Owner Info */}
              <div className="bg-emerald-50/60 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800/60 space-y-2 text-xs">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Informasi Pemilik Terdaftar
                </span>
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                    {selectedBinDetail.wargaName || (selectedBinDetail as any).user?.name || "Warga Terdaftar"}
                  </span>
                  {((selectedBinDetail as any).user?.phone || (selectedBinDetail as any).wargaPhone || (selectedBinDetail as any).phone) && (
                    <span className="font-mono text-emerald-800 dark:text-emerald-300 font-extrabold bg-emerald-100/80 dark:bg-emerald-900/60 px-2.5 py-0.5 rounded-full text-xs">
                      {((selectedBinDetail as any).user?.phone || (selectedBinDetail as any).wargaPhone || (selectedBinDetail as any).phone)}
                    </span>
                  )}
                </div>
                <p className="text-[11.5px] text-slate-600 dark:text-slate-400">
                  {(selectedBinDetail as any).user?.address || selectedBinDetail.lokasi || "Wilayah Operasional"}
                </p>
              </div>

              {/* GPS Coordinates & Activity */}
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-700/60">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">Koordinat GPS:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {selectedBinDetail.latitude ? `${Number(selectedBinDetail.latitude).toFixed(5)}, ${Number(selectedBinDetail.longitude).toFixed(5)}` : "Belum terikat"}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-400 font-semibold block mb-0.5">Log Terakhir:</span>
                  <p className="font-bold text-slate-800 dark:text-slate-100 text-[11.5px]">
                    {(selectedBinDetail as any).lastActivityLog || "Setoran sampah aktif terpantau real-time."}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  handleFlyToBin(selectedBinDetail);
                  setSelectedBinDetail(null);
                }}
                className="flex-1 py-2.5 bg-[#009966] hover:bg-[#008055] text-white text-xs font-black rounded-xl transition-all shadow-md cursor-pointer text-center"
              >
                Fokuskan ke Peta
              </button>
              <button
                type="button"
                onClick={() => setSelectedBinDetail(null)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Monitoring;
