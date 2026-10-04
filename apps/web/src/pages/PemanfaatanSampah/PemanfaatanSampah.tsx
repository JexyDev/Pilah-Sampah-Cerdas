/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Halaman: Data Fasilitas Pengelolaan Sampah (/monitoring-pengelolaan/fasilitas)
 * - Tampilan Full-Map GIS Interaktif (Satelit Hybrid Google / Vektor, Batas 6 Kelurahan Coblong)
 * - Kontrol Peta Lengkap: Fullscreen (Layar Penuh), Tile Switcher, Layer Batas Wilayah, Quick In-Map Search & FlyTo
 * - Legenda Simbol Peta Mengambang (Collapsible Floating Legend)
 * - Kartu Ikon Metrik Agregat & Filter Cepat tepat di bawah peta (iconnya di bawah)
 * - Direktori Fasilitas Lengkap: Mode Grid Kartu & Mode Tabel Data Lengkap
 * - Integrasi WhatsApp PIC, Navigasi Google Maps, Salin Koordinat GPS, dan Lightbox Foto
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  Polygon,
  useMap,
} from "react-leaflet";
import {
  Loader2,
  MapPin,
  Search,
  Sprout,
  GraduationCap,
  Leaf,
  Recycle,
  Trash2,
  Coins,
  Phone,
  Layers,
  Boxes,
  X,
  ExternalLink,
  Copy,
  Check,
  Calendar,
  Clock,
  User,
  ZoomIn,
  Eye,
  Building2,
  Users,
  Globe,
  Edit2,
  LayoutGrid,
  Table2,
  Navigation,
  Database,
  Plus,
  Maximize2,
  Minimize2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import api from "../../services/api";
import showToast from "../../utils/showToast";
import { useAuthStore } from "../../store/useAuthStore";
import { Pagination } from "../../components/common/Pagination";
import PageHeader from "../../components/common/PageHeader";
import {
  ThemeTileLayer,
  GOOGLE_SATELLITE_URL,
  GOOGLE_VECTOR_URL,
} from "../../components/common/ThemeTileLayer";
import { createFacilityIcon, KELURAHAN_GEODATA } from "../../constants/coblongGeoData";
import { resolveImageUrl } from "../../utils/imageUrl";
import { sortChronologicalList } from "../../utils/sortUtils";
import {
  formatRwLabel,
  isKelurahanMatching,
  isRwMatching,
  isKelompokCoveringRw,
  getRwOptionsForKelurahan,
  fetchMasterWilayah,
  type MasterKelurahanItem,
  type MasterRwItem,
} from "../../utils/areaFilterUtils";
import { formatWilayahName, formatKelompokName } from "../../utils/textFormatter";

export interface FacilityItem {
  id: string;
  nama: string;
  jenis: string;
  pic: string;
  kontak: string;
  alamat?: string;
  kapasitas?: number;
  latitude: number | string;
  longitude: number | string;
  foto?: string;
  createdAt: string;
  kelompokId?: string;
  rw?: {
    id: number;
    name: string;
  };
  registeredBy?: {
    id: string;
    name: string;
    phone?: string;
  };
}

export interface KelompokItem {
  id: string;
  name: string;
}

// Helper cek apakah string adalah UUID
export const isUUID = (str?: string): boolean => {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
};

// Helper smart resolver PIC (memisahkan data PIC Warga dan data Mahasiswa Pendata)
export const getDisplayPic = (item: FacilityItem): {
  name: string;
  roleBadge: string;
  isWarga: boolean;
  registeredByName?: string;
  contact?: string;
} => {
  const rawPic = (item.pic || "").trim();
  const regName = item.registeredBy?.name?.trim();
  const regPhone = item.registeredBy?.phone?.trim();
  const directPhone = item.kontak && item.kontak !== "-" ? item.kontak.trim() : undefined;
  const isPosko = item.jenis === "posko_kkn" || item.jenis === "posko";

  // Kasus 1: Posko KKN (PIC adalah Ketua Posko Mahasiswa / DPL)
  if (isPosko) {
    const poskoPicName = (!isUUID(rawPic) && rawPic && rawPic !== "-") ? rawPic : (regName || "Ketua Kelompok KKN");
    return {
      name: poskoPicName,
      roleBadge: "Ketua Posko KKN",
      isWarga: false,
      registeredByName: undefined,
      contact: directPhone || regPhone,
    };
  }

  // Kasus 2: Fasilitas Warga (Buruan Sae, Bank Sampah, Maggot, Loseda, Bata Terawang, POC, TPS)
  if (rawPic && rawPic !== "-" && !isUUID(rawPic)) {
    return {
      name: rawPic,
      roleBadge: "Warga Pengelola",
      isWarga: true,
      registeredByName: regName || undefined,
      contact: directPhone,
    };
  }

  // Kasus fallback jika rawPic berupa UUID atau kosong
  const defaultWargaLabel = item.rw?.name 
    ? `Warga Pengelola (${item.rw.name.startsWith("RW") || item.rw.name.startsWith("Kel.") ? item.rw.name : `RW ${item.rw.name}`})`
    : "Warga Pengelola Setempat";

  return {
    name: defaultWargaLabel,
    roleBadge: "Warga Pengelola",
    isWarga: true,
    registeredByName: regName || undefined,
    contact: directPhone || regPhone,
  };
};

// Helper format label jenis fasilitas
export const formatFacilityTypeLabel = (jenis: string): string => {
  const j = (jenis || "").toLowerCase();
  switch (j) {
    case "posko_kkn":
    case "posko":
      return "Posko KKN";
    case "buruan_sae":
      return "Buruan Sae";
    case "bank_sampah":
      return "Bank Sampah";
    case "loseda":
      return "Loseda (Lodong Sesa Dapur)";
    case "bata_terawang":
      return "Bata Terawang";
    case "rumah_maggot":
      return "Rumah Maggot (BSF)";
    case "poc":
      return "POC (Pupuk Organik Cair)";
    case "tps":
      return "TPS (Tempat Penampungan)";
    default:
      return jenis.replace(/_/g, " ").toUpperCase();
  }
};

// Helper badge style jenis fasilitas
export const getFacilityBadgeClass = (jenis: string): string => {
  const j = (jenis || "").toLowerCase();
  switch (j) {
    case "posko_kkn":
    case "posko":
      return "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800";
    case "buruan_sae":
      return "bg-lime-50 text-lime-800 border-lime-200 dark:bg-lime-950/60 dark:text-lime-300 dark:border-lime-800";
    case "bank_sampah":
      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800";
    case "loseda":
    case "bata_terawang":
    case "rumah_maggot":
    case "poc":
      return "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800";
    case "tps":
      return "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
};

// Helper Icon Jenis Fasilitas
export const getFacilityTypeIcon = (jenis: string) => {
  const j = (jenis || "").toLowerCase();
  switch (j) {
    case "posko_kkn":
    case "posko":
      return GraduationCap;
    case "buruan_sae":
      return Leaf;
    case "bank_sampah":
      return Coins;
    case "rumah_maggot":
    case "loseda":
    case "bata_terawang":
    case "poc":
      return Recycle;
    case "tps":
      return Trash2;
    default:
      return Sprout;
  }
};

// Map Resizer Helper Component
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

// Map FlyTo Helper Component
const MapFlyToController: React.FC<{ center: [number, number] | null; zoom?: number }> = ({
  center,
  zoom = 16,
}) => {
  const map = useMap();
  useEffect(() => {
    if (center && !isNaN(center[0]) && !isNaN(center[1])) {
      map.flyTo(center, zoom, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
};

export const PemanfaatanSampah: React.FC = () => {
  const [items, setItems] = useState<FacilityItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { user } = useAuthStore();
  const isDeveloper = user?.peran === "DEVELOPER" || user?.peran === "SUPER_USER";
  const [searchParams, setSearchParams] = useSearchParams();
  const [editingFacility, setEditingFacility] = useState<FacilityItem | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // View Mode: "cards" (Grid Kartu) atau "table" (Tabel Data Lengkap)
  const [viewMode, setViewMode] = useState<"cards" | "table">(
    searchParams.get("view") === "table" ? "table" : "cards"
  );

  useEffect(() => {
    const v = searchParams.get("view");
    if (v === "table") {
      setViewMode("table");
    } else {
      setViewMode("cards");
    }
  }, [searchParams]);

  const handleViewModeChange = (mode: "cards" | "table") => {
    setViewMode(mode);
    setSearchParams((prev: URLSearchParams) => {
      const next = new URLSearchParams(prev);
      if (mode === "table") {
        next.set("view", "table");
      } else {
        next.delete("view");
      }
      return next;
    });
  };

  const handleDeleteFacility = async (id: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus fasilitas ini?")) return;
    try {
      const res = await api.delete(`/facilities/${id}`);
      if (res.data.success) {
        showToast.success("Fasilitas berhasil dihapus");
        setItems(prev => prev.filter(item => item.id !== id));
      }
    } catch (error: any) {
      showToast.error(error.response?.data?.message || "Gagal menghapus fasilitas");
    }
  };

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJenis, setSelectedJenis] = useState("ALL");
  const [selectedKelurahan, setSelectedKelurahan] = useState("ALL");
  const [selectedRwId, setSelectedRwId] = useState("ALL");
  const [selectedKelompokId, setSelectedKelompokId] = useState("ALL");
  const [masterKelurahanList, setMasterKelurahanList] = useState<MasterKelurahanItem[]>([]);
  const [masterRwList, setMasterRwList] = useState<MasterRwItem[]>([]);

  // Kelompok list for filter dropdown
  const [kelompokList, setKelompokList] = useState<KelompokItem[]>([]);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Map Interactive States
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [showKelurahanBoundaries, setShowKelurahanBoundaries] = useState(true);
  const [mapTileProvider, setMapTileProvider] = useState<"google_satellite" | "google_vector">("google_satellite");
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const [mapSearchInput, setMapSearchInput] = useState("");
  const [mapTargetCenter, setMapTargetCenter] = useState<[number, number] | null>(null);
  const [mapTargetZoom, setMapTargetZoom] = useState<number>(14);
  const mapSectionRef = useRef<HTMLDivElement>(null);

  // Image Preview Lightbox Modal State
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string; subtitle?: string } | null>(null);

  // Copy coordinate feedback state
  const [copiedCoordId, setCopiedCoordId] = useState<string | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.get("/facilities");
      setItems(res.data.data || []);
    } catch (err: any) {
      showToast.error(err.response?.data?.message || "Gagal memuat data fasilitas");
    } finally {
      setLoading(false);
    }
  };

  const fetchKelompok = async () => {
    try {
      const res = await api.get("/kelompok");
      setKelompokList(res.data.data || res.data || []);
    } catch {
      // Kelompok list optional, silent fail
    }
  };

  useEffect(() => {
    fetchItems();
    fetchKelompok();
    fetchMasterWilayah().then(({ kelurahans, rws }) => {
      setMasterKelurahanList(kelurahans);
      setMasterRwList(rws);
    });
  }, []);

  // Derive dynamic RW list based on selected Kelurahan
  const rwFilterOptions = useMemo(() => {
    return getRwOptionsForKelurahan(selectedKelurahan, masterRwList);
  }, [selectedKelurahan, masterRwList]);

  // Derive filtered Kelompok list based on selected Kelurahan & RW
  const filteredKelompokOptions = useMemo(() => {
    return kelompokList.filter((k: any) => {
      if (selectedKelurahan !== "ALL" && !isKelurahanMatching(k.kelurahan, selectedKelurahan)) {
        return false;
      }
      if (selectedRwId !== "ALL" && !isKelompokCoveringRw(k, selectedRwId)) {
        return false;
      }
      return true;
    });
  }, [kelompokList, selectedKelurahan, selectedRwId]);

  // Metrik Penghitungan Fasilitas Persampahan
  const metrics = useMemo(() => {
    const total = items.length;
    const bankSampah = items.filter((i) => i.jenis === "bank_sampah").length;
    const organik = items.filter((i) => ["loseda", "bata_terawang", "rumah_maggot", "poc"].includes(i.jenis)).length;
    const buruanSae = items.filter((i) => i.jenis === "buruan_sae").length;
    const tps = items.filter((i) => i.jenis === "tps").length;
    const totalKapasitas = items.reduce((acc, curr) => acc + (Number(curr.kapasitas) || 0), 0);

    return { total, bankSampah, organik, buruanSae, tps, totalKapasitas };
  }, [items]);

  // Handler toggle filter jenis saat card metrik diklik
  const handleCardFilterClick = (jenisKey: string) => {
    if (selectedJenis === jenisKey) {
      setSelectedJenis("ALL");
    } else {
      setSelectedJenis(jenisKey);
    }
    setCurrentPage(1);
  };

  const filteredItems = useMemo(() => {
    const result = items.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const rwName = item?.rw?.name || "";
      const picInfo = getDisplayPic(item);
      const matchSearch =
        !q ||
        (item.nama || "").toLowerCase().includes(q) ||
        picInfo.name.toLowerCase().includes(q) ||
        (item.pic || "").toLowerCase().includes(q) ||
        (item.jenis || "").toLowerCase().includes(q) ||
        (item.kontak || "").toLowerCase().includes(q) ||
        (item.alamat || "").toLowerCase().includes(q) ||
        rwName.toLowerCase().includes(q);

      let matchJenis = true;
      if (selectedJenis === "ALL") {
        matchJenis = true;
      } else if (selectedJenis === "organik_group") {
        matchJenis = ["loseda", "bata_terawang", "rumah_maggot", "poc"].includes(item.jenis);
      } else {
        matchJenis = item.jenis === selectedJenis;
      }

      let matchKelurahan = true;
      if (selectedKelurahan !== "ALL") {
        const itemKelName = (item as any).kelurahan || (item.rw as any)?.kelurahan?.name;
        if (itemKelName) {
          matchKelurahan = isKelurahanMatching(itemKelName, selectedKelurahan);
        } else if (item.rw?.id) {
          const rwObj = masterRwList.find((r) => r.id === item.rw?.id);
          if (rwObj?.kelurahanName) {
            matchKelurahan = isKelurahanMatching(rwObj.kelurahanName, selectedKelurahan);
          } else {
            matchKelurahan = isKelurahanMatching(item.alamat, selectedKelurahan);
          }
        } else {
          matchKelurahan = isKelurahanMatching(item.alamat, selectedKelurahan);
        }
      }

      let matchRw = true;
      if (selectedRwId !== "ALL") {
        const itemRwStr = item.rw?.name ? String(item.rw.name) : (item.rw?.id ? String(item.rw.id) : "");
        matchRw = isRwMatching(itemRwStr, selectedRwId);
      }

      const matchKelompok =
        selectedKelompokId === "ALL" || item.kelompokId === selectedKelompokId;

      return matchSearch && matchJenis && matchKelurahan && matchRw && matchKelompok;
    });

    return sortChronologicalList(result, (item) => item.createdAt || (item as any).updatedAt, "desc");
  }, [items, searchQuery, selectedJenis, selectedKelurahan, selectedRwId, selectedKelompokId, masterRwList]);

  // Live in-map search results for quick flyTo
  const mapSearchResults = useMemo(() => {
    if (!mapSearchInput.trim()) return [];
    const q = mapSearchInput.toLowerCase().trim();
    return items
      .filter((item) => {
        const latNum = Number(item.latitude);
        const lngNum = Number(item.longitude);
        const hasCoords = !isNaN(latNum) && !isNaN(lngNum) && latNum !== 0 && lngNum !== 0;
        if (!hasCoords) return false;
        return (
          (item.nama || "").toLowerCase().includes(q) ||
          (item.pic || "").toLowerCase().includes(q) ||
          (item.alamat || "").toLowerCase().includes(q) ||
          formatFacilityTypeLabel(item.jenis).toLowerCase().includes(q)
        );
      })
      .slice(0, 5);
  }, [items, mapSearchInput]);

  // Reset pagination on search / filter
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedJenis, selectedKelurahan, selectedRwId, selectedKelompokId, itemsPerPage]);

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  // Fly to Map Location Handler
  const handleViewOnMap = (lat: number | string, lng: number | string) => {
    const latNum = Number(lat);
    const lngNum = Number(lng);
    if (isNaN(latNum) || isNaN(lngNum) || latNum === 0) {
      showToast.error("Koordinat GPS fasilitas tidak valid");
      return;
    }
    setMapTargetCenter([latNum, lngNum]);
    setMapTargetZoom(17);
    if (mapSectionRef.current) {
      mapSectionRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // Copy Coordinate to Clipboard Handler
  const handleCopyCoordinate = (id: string, lat: number | string, lng: number | string) => {
    const text = `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`;
    navigator.clipboard.writeText(text);
    setCopiedCoordId(id);
    showToast.success(`Koordinat disalin: ${text}`);
    setTimeout(() => setCopiedCoordId(null), 2000);
  };

  // =========================================================================
  // RENDER SEKSI PETA SEBARAN FULL-MAP DENGAN KONTROL & LEGENDA
  // =========================================================================
  const renderFullMapSection = () => (
    <div
      ref={mapSectionRef}
      className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden relative transition-all duration-300 ${
        isMapFullscreen
          ? "fixed inset-0 z-[9999] rounded-none p-3 sm:p-5 flex flex-col bg-white dark:bg-slate-950"
          : "p-3 sm:p-4 space-y-3"
      }`}
    >
      {/* Header Bar Peta & Toolbar Aksi Kontrol */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-[#009966] dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800 shadow-2xs shrink-0">
            <MapPin size={20} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-slate-100 tracking-tight">
                Peta Sebaran Fasilitas Pengelolaan Sampah
              </h3>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {filteredItems.length} Titik Terpantau
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Cakupan Wilayah Binaan Kecamatan Coblong (Bank Sampah, Inovasi Organik, Buruan Sae, TPS)
            </p>
          </div>
        </div>

        {/* Action Controls: Filter Indicator, Tile Switcher, Boundary Layer & Fullscreen */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {selectedJenis !== "ALL" && (
            <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/70 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <span>Filter: {selectedJenis === "organik_group" ? "Inovasi Organik" : formatFacilityTypeLabel(selectedJenis)}</span>
              <button
                type="button"
                onClick={() => setSelectedJenis("ALL")}
                className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer ml-1"
                title="Reset filter jenis"
              >
                <X size={13} />
              </button>
            </div>
          )}

          {/* Batas Wilayah Toggle */}
          <button
            type="button"
            onClick={() => setShowKelurahanBoundaries(!showKelurahanBoundaries)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-2xs border ${
              showKelurahanBoundaries
                ? "bg-emerald-50 dark:bg-emerald-950/70 text-[#009966] dark:text-emerald-400 border-emerald-300 dark:border-emerald-700 shadow-xs"
                : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
            }`}
            title={showKelurahanBoundaries ? "Sembunyikan Poligon Batas Kelurahan" : "Tampilkan Poligon Batas Kelurahan"}
          >
            <Layers size={14} className={showKelurahanBoundaries ? "text-[#009966]" : "text-slate-400"} />
            <span>Batas Wilayah</span>
          </button>

          {/* Tile Layer Provider Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setMapTileProvider("google_vector")}
              className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                mapTileProvider === "google_vector"
                  ? "bg-[#009966] text-white shadow-2xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
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
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
              }`}
            >
              Google Satelit
            </button>
          </div>

          {/* Fullscreen Map Toggle */}
          <button
            type="button"
            onClick={() => setIsMapFullscreen(!isMapFullscreen)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#009966] to-emerald-600 hover:from-[#008055] hover:to-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer transform hover:scale-105 active:scale-95"
            title={isMapFullscreen ? "Keluar Layar Penuh" : "Mode Layar Penuh (Peta Lebar Maksimal)"}
          >
            {isMapFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            <span>{isMapFullscreen ? "Kecilkan" : "Layar Penuh"}</span>
          </button>
        </div>
      </div>

      {/* Map Canvas Viewport */}
      <div
        className={`w-full rounded-2xl overflow-hidden border border-slate-200/90 dark:border-slate-800 relative ${
          isMapFullscreen ? "flex-1 min-h-0" : "h-[480px] sm:h-[530px]"
        }`}
      >
        {/* Floating In-Map Search Box (Top-Left) */}
        <div className="absolute top-3 left-3 z-[1000] pointer-events-auto">
          <div className="relative w-64 sm:w-80 shadow-xl rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
            <div className="flex items-center px-3 py-2">
              <Search size={14} className="text-[#009966] dark:text-emerald-400 shrink-0 mr-2" />
              <input
                type="text"
                placeholder="Cari titik fasilitas atau PIC..."
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

            {/* Quick Suggestions Dropdown */}
            {mapSearchInput.trim() && (
              <div className="border-t border-slate-100 dark:border-slate-800 max-h-56 overflow-y-auto rounded-b-2xl bg-white dark:bg-slate-900 shadow-xl">
                {mapSearchResults.length > 0 ? (
                  mapSearchResults.map((fac) => (
                    <div
                      key={`map-search-item-${fac.id}`}
                      onClick={() => {
                        setMapSearchInput("");
                        handleViewOnMap(fac.latitude, fac.longitude);
                      }}
                      className="px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 last:border-0 cursor-pointer transition flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="font-extrabold text-slate-900 dark:text-slate-100 block truncate">{fac.nama}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate block">{fac.alamat || fac.rw?.name || "Wilayah Coblong"}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold border shrink-0 ${getFacilityBadgeClass(fac.jenis)}`}>
                        {formatFacilityTypeLabel(fac.jenis)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2.5 text-xs text-slate-400 dark:text-slate-500 font-medium text-center">
                    Tidak ada fasilitas yang cocok
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Floating Collapsible Legend (Bottom-Right) */}
        <div className="absolute bottom-3 right-3 z-[1000] pointer-events-auto select-none max-w-[290px] sm:max-w-[310px]">
          {!isLegendOpen ? (
            <button
              type="button"
              onClick={() => setIsLegendOpen(true)}
              className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xl rounded-2xl px-3.5 py-2 border border-slate-200/90 dark:border-slate-800 flex items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-100 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-[#009966] transition-all cursor-pointer group"
              title="Tampilkan Legenda Simbol Peta"
            >
              <Layers className="w-4 h-4 text-[#009966] group-hover:scale-110 transition-transform" />
              <span>Legenda Simbol Peta</span>
              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            </button>
          ) : (
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl rounded-2xl p-3 border border-slate-200/90 dark:border-slate-800 flex flex-col gap-2 min-w-[260px] animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10.5px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                    Legenda Simbol Peta
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLegendOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  title="Tutup Legenda"
                >
                  <ChevronDown size={14} />
                </button>
              </div>

              {/* Jenis Fasilitas */}
              <div className="space-y-1">
                <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Jenis Fasilitas
                </span>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#65a30d] shrink-0" />
                    <span className="font-bold text-slate-700 dark:text-slate-300 truncate">Buruan Sae</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#2563eb] shrink-0" />
                    <span className="font-bold text-slate-700 dark:text-slate-300 truncate">Bank Sampah</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#0d9488] shrink-0" />
                    <span className="font-bold text-slate-700 dark:text-slate-300 truncate">Loseda</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#f59e0b] shrink-0" />
                    <span className="font-bold text-slate-700 dark:text-slate-300 truncate">Bata Terawang</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#7c3aed] shrink-0" />
                    <span className="font-bold text-slate-700 dark:text-slate-300 truncate">Rumah Maggot</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#64748b] shrink-0" />
                    <span className="font-bold text-slate-700 dark:text-slate-300 truncate">TPS</span>
                  </div>
                </div>
              </div>

              {/* Batas Kelurahan */}
              <div className="space-y-1 border-t border-slate-100 dark:border-slate-800 pt-1.5">
                <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
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
          )}
        </div>

        {/* Leaflet Map Renderer */}
        <MapContainer
          center={[-6.8903, 107.611]}
          zoom={14}
          scrollWheelZoom={true}
          attributionControl={false}
          style={{ height: "100%", width: "100%", zIndex: 1 }}
        >
          <MapResizer isFullscreen={isMapFullscreen} />
          <ThemeTileLayer
            lightUrl={mapTileProvider === "google_satellite" ? GOOGLE_SATELLITE_URL : GOOGLE_VECTOR_URL}
            darkUrl={mapTileProvider === "google_satellite" ? GOOGLE_SATELLITE_URL : GOOGLE_VECTOR_URL}
          />
          <MapFlyToController center={mapTargetCenter} zoom={mapTargetZoom} />

          {/* Render Kelurahan Boundaries */}
          {showKelurahanBoundaries &&
            Object.values(KELURAHAN_GEODATA).map((kg) => (
              <Polygon
                key={kg.id}
                positions={kg.bounds as any}
                pathOptions={{
                  color: kg.color,
                  weight: 2.2,
                  fillColor: kg.color,
                  fillOpacity: 0.08,
                  dashArray: "3, 3",
                }}
              >
                <Popup>
                  <div className="p-1 text-xs">
                    <span className="font-extrabold text-slate-900 block">Kelurahan {kg.name}</span>
                    <span className="text-[10.5px] text-slate-500 font-medium">Kecamatan Coblong</span>
                  </div>
                </Popup>
              </Polygon>
            ))}

          {/* Render Markers for Facilities */}
          {filteredItems.map((fac) => {
            if (!fac.latitude || !fac.longitude) return null;
            const latNum = Number(fac.latitude);
            const lngNum = Number(fac.longitude);
            if (isNaN(latNum) || isNaN(lngNum) || latNum === 0) return null;
            const icon = createFacilityIcon(fac.jenis, fac.nama);
            const picInfo = getDisplayPic(fac);
            const resolvedFoto = resolveImageUrl(fac.foto);

            return (
              <Marker key={fac.id} position={[latNum, lngNum]} icon={icon}>
                <Popup className="custom-popup">
                  <div className="p-1 min-w-[240px] max-w-[280px]">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className={`inline-block px-2 py-0.5 rounded text-[9.5px] font-bold border ${getFacilityBadgeClass(fac.jenis)}`}>
                        {formatFacilityTypeLabel(fac.jenis)}
                      </span>
                      {fac.kapasitas && fac.kapasitas > 0 ? (
                        <span className="text-[9.5px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {fac.kapasitas} kg
                        </span>
                      ) : null}
                    </div>

                    <h3 className="font-extrabold text-slate-900 text-sm mb-1.5 leading-snug">{fac.nama}</h3>

                    {resolvedFoto && (
                      <div
                        className="relative group cursor-pointer overflow-hidden rounded-lg mb-2 border border-slate-200"
                        onClick={() => setPreviewImage({ url: resolvedFoto, title: fac.nama, subtitle: fac.alamat })}
                      >
                        <img
                          src={resolvedFoto}
                          alt={fac.nama}
                          className="w-full h-28 object-cover rounded-lg group-hover:scale-105 transition duration-300"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                        <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold gap-1 transition">
                          <Eye size={13} /> Lihat Foto
                        </div>
                      </div>
                    )}

                    <div className="space-y-1 text-xs text-slate-700 border-t border-slate-100 pt-1.5">
                      <p>
                        <strong className="text-slate-900">PIC:</strong> {picInfo.name} ({picInfo.roleBadge})
                      </p>
                      {picInfo.contact && picInfo.contact !== "-" && (
                        <p className="flex items-center gap-1">
                          <strong className="text-slate-900">Kontak:</strong>
                          <a
                            href={`https://wa.me/${picInfo.contact.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-700 font-mono font-bold hover:underline"
                          >
                            {picInfo.contact}
                          </a>
                        </p>
                      )}
                      <p>
                        <strong className="text-slate-900">Wilayah:</strong> {fac.rw?.name || fac.alamat || "Coblong"}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {latNum.toFixed(5)}, {lngNum.toFixed(5)}
                      </p>
                    </div>

                    <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                      <a
                        href={`https://www.google.com/maps?q=${latNum},${lngNum}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-[10.5px] font-bold border border-blue-200 transition"
                      >
                        <ExternalLink size={11} /> Google Maps
                      </a>

                      {isDeveloper && (
                        <button
                          type="button"
                          onClick={() => setEditingFacility(fac)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10.5px] font-bold transition cursor-pointer"
                        >
                          <Edit2 size={11} /> Edit
                        </button>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );

  // =========================================================================
  // RENDER METRIK & QUICK FILTER CARDS TEPAT DI BAWAH PETA ("ICONNYA DIBAWAH")
  // =========================================================================
  const renderMetricCardsBelowMap = () => (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Ringkasan Inventaris &amp; Filter Kategori
        </span>
        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          Klik kartu untuk memfilter titik peta &amp; direktori
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {/* Card 1: Semua Data */}
        <button
          type="button"
          onClick={() => handleCardFilterClick("ALL")}
          className={`relative p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden group shadow-2xs ${
            selectedJenis === "ALL"
              ? "bg-emerald-50/90 dark:bg-emerald-950/60 border-emerald-500 text-emerald-950 dark:text-emerald-50 shadow-md ring-2 ring-emerald-500/30"
              : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:border-emerald-400 hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between w-full mb-2">
            <span className={`text-[10.5px] font-extrabold uppercase tracking-wider ${selectedJenis === "ALL" ? "text-emerald-800 dark:text-emerald-300" : "text-slate-500 dark:text-slate-400"}`}>
              Semua Titik
            </span>
            <div className={`p-2 rounded-xl transition-colors ${selectedJenis === "ALL" ? "bg-emerald-200/60 dark:bg-emerald-800/60 text-emerald-900 dark:text-emerald-200" : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"}`}>
              <Layers size={17} />
            </div>
          </div>
          <div>
            <div className={`text-2xl sm:text-[26px] font-black tracking-tight ${selectedJenis === "ALL" ? "text-emerald-950 dark:text-white" : "text-slate-900 dark:text-white"}`}>
              {metrics.total}
            </div>
            <p className={`text-[11.5px] font-semibold mt-0.5 truncate ${selectedJenis === "ALL" ? "text-emerald-700 dark:text-emerald-300" : "text-slate-500 dark:text-slate-400"}`}>
              Seluruh Wilayah
            </p>
          </div>
        </button>

        {/* Card 2: Bank Sampah */}
        <button
          type="button"
          onClick={() => handleCardFilterClick("bank_sampah")}
          className={`relative p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden group shadow-2xs ${
            selectedJenis === "bank_sampah"
              ? "bg-blue-50/90 dark:bg-blue-950/60 border-blue-500 text-blue-950 dark:text-blue-50 shadow-md ring-2 ring-blue-500/30"
              : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:border-blue-400 hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between w-full mb-2">
            <span className={`text-[10.5px] font-extrabold uppercase tracking-wider ${selectedJenis === "bank_sampah" ? "text-blue-800 dark:text-blue-300" : "text-slate-500 dark:text-slate-400"}`}>
              Bank Sampah
            </span>
            <div className={`p-2 rounded-xl transition-colors ${selectedJenis === "bank_sampah" ? "bg-blue-200/60 dark:bg-blue-800/60 text-blue-900 dark:text-blue-200" : "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400"}`}>
              <Coins size={17} />
            </div>
          </div>
          <div>
            <div className={`text-2xl sm:text-[26px] font-black tracking-tight ${selectedJenis === "bank_sampah" ? "text-blue-950 dark:text-white" : "text-slate-900 dark:text-white"}`}>
              {metrics.bankSampah}
            </div>
            <p className={`text-[11.5px] font-semibold mt-0.5 truncate ${selectedJenis === "bank_sampah" ? "text-blue-700 dark:text-blue-300" : "text-slate-500 dark:text-slate-400"}`}>
              Unit Tabungan
            </p>
          </div>
        </button>

        {/* Card 3: Inovasi Organik */}
        <button
          type="button"
          onClick={() => handleCardFilterClick("organik_group")}
          className={`relative p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden group shadow-2xs ${
            selectedJenis === "organik_group"
              ? "bg-teal-50/90 dark:bg-teal-950/60 border-teal-500 text-teal-950 dark:text-teal-50 shadow-md ring-2 ring-teal-500/30"
              : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:border-teal-400 hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between w-full mb-2">
            <span className={`text-[10.5px] font-extrabold uppercase tracking-wider ${selectedJenis === "organik_group" ? "text-teal-800 dark:text-teal-300" : "text-slate-500 dark:text-slate-400"}`}>
              Inovasi Organik
            </span>
            <div className={`p-2 rounded-xl transition-colors ${selectedJenis === "organik_group" ? "bg-teal-200/60 dark:bg-teal-800/60 text-teal-900 dark:text-teal-200" : "bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400"}`}>
              <Recycle size={17} />
            </div>
          </div>
          <div>
            <div className={`text-2xl sm:text-[26px] font-black tracking-tight ${selectedJenis === "organik_group" ? "text-teal-950 dark:text-white" : "text-slate-900 dark:text-white"}`}>
              {metrics.organik}
            </div>
            <p className={`text-[11.5px] font-semibold mt-0.5 truncate ${selectedJenis === "organik_group" ? "text-teal-700 dark:text-teal-300" : "text-slate-500 dark:text-slate-400"}`}>
              Loseda / Maggot
            </p>
          </div>
        </button>

        {/* Card 4: Buruan Sae */}
        <button
          type="button"
          onClick={() => handleCardFilterClick("buruan_sae")}
          className={`relative p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden group shadow-2xs ${
            selectedJenis === "buruan_sae"
              ? "bg-lime-50/90 dark:bg-lime-950/60 border-lime-500 text-lime-950 dark:text-lime-50 shadow-md ring-2 ring-lime-500/30"
              : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:border-lime-400 hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between w-full mb-2">
            <span className={`text-[10.5px] font-extrabold uppercase tracking-wider ${selectedJenis === "buruan_sae" ? "text-lime-800 dark:text-lime-300" : "text-slate-500 dark:text-slate-400"}`}>
              Buruan Sae
            </span>
            <div className={`p-2 rounded-xl transition-colors ${selectedJenis === "buruan_sae" ? "bg-lime-200/60 dark:bg-lime-800/60 text-lime-900 dark:text-lime-200" : "bg-lime-50 dark:bg-lime-950/60 text-lime-600 dark:text-lime-400"}`}>
              <Leaf size={17} />
            </div>
          </div>
          <div>
            <div className={`text-2xl sm:text-[26px] font-black tracking-tight ${selectedJenis === "buruan_sae" ? "text-lime-950 dark:text-white" : "text-slate-900 dark:text-white"}`}>
              {metrics.buruanSae}
            </div>
            <p className={`text-[11.5px] font-semibold mt-0.5 truncate ${selectedJenis === "buruan_sae" ? "text-lime-700 dark:text-lime-300" : "text-slate-500 dark:text-slate-400"}`}>
              Kebun Urban Warga
            </p>
          </div>
        </button>

        {/* Card 5: TPS */}
        <button
          type="button"
          onClick={() => handleCardFilterClick("tps")}
          className={`relative p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden group shadow-2xs ${
            selectedJenis === "tps"
              ? "bg-amber-50/90 dark:bg-amber-950/60 border-amber-500 text-amber-950 dark:text-amber-50 shadow-md ring-2 ring-amber-500/30"
              : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:border-amber-400 hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between w-full mb-2">
            <span className={`text-[10.5px] font-extrabold uppercase tracking-wider ${selectedJenis === "tps" ? "text-amber-800 dark:text-amber-300" : "text-slate-500 dark:text-slate-400"}`}>
              TPS
            </span>
            <div className={`p-2 rounded-xl transition-colors ${selectedJenis === "tps" ? "bg-amber-200/60 dark:bg-amber-800/60 text-amber-900 dark:text-amber-200" : "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"}`}>
              <Trash2 size={17} />
            </div>
          </div>
          <div>
            <div className={`text-2xl sm:text-[26px] font-black tracking-tight ${selectedJenis === "tps" ? "text-amber-950 dark:text-white" : "text-slate-900 dark:text-white"}`}>
              {metrics.tps}
            </div>
            <p className={`text-[11.5px] font-semibold mt-0.5 truncate ${selectedJenis === "tps" ? "text-amber-700 dark:text-amber-300" : "text-slate-500 dark:text-slate-400"}`}>
              Penampungan
            </p>
          </div>
        </button>

        {/* Card 6: Kapasitas Olah Total */}
        <div className="relative p-4 rounded-2xl border text-left flex flex-col justify-between overflow-hidden bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100 shadow-2xs">
          <div className="flex items-center justify-between w-full mb-2">
            <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Kapasitas Olah
            </span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Boxes size={17} />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-[26px] font-black tracking-tight text-slate-900 dark:text-white">
              {metrics.totalKapasitas > 0 ? `${metrics.totalKapasitas} kg` : "-"}
            </div>
            <p className="text-[11.5px] font-semibold mt-0.5 truncate text-slate-500 dark:text-slate-400">
              Total Kapasitas Terdata
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // =========================================================================
  // RENDER GRID KARTU DIREKTORI FASILITAS (RESPONSIVE MULTI-COLUMN)
  // =========================================================================
  const renderCardsGridView = () => {
    if (loading) {
      return (
        <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Loader2 size={32} className="text-emerald-600 animate-spin mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-500">Memuat direktori fasilitas...</p>
        </div>
      );
    }

    if (paginatedItems.length === 0) {
      return (
        <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Sprout size={36} className="text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="font-extrabold text-sm text-slate-800 dark:text-slate-200">Tidak ada fasilitas ditemukan</p>
          <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau reset filter wilayah.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {paginatedItems.map((item) => {
          const picInfo = getDisplayPic(item);
          const resolvedFoto = resolveImageUrl(item.foto);
          const TypeIcon = getFacilityTypeIcon(item.jenis);
          const latNum = Number(item.latitude);
          const lngNum = Number(item.longitude);
          const hasValidCoords = !isNaN(latNum) && !isNaN(lngNum) && latNum !== 0 && lngNum !== 0;

          return (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
            >
              <div className="p-4 space-y-3">
                {/* Header Card: Thumbnail + Info Pokok */}
                <div className="flex items-start gap-3.5">
                  {resolvedFoto ? (
                    <div
                      className="relative group/thumb cursor-pointer overflow-hidden rounded-xl shrink-0 w-16 h-16 border border-slate-200 dark:border-slate-700 bg-slate-100"
                      onClick={() => setPreviewImage({ url: resolvedFoto, title: item.nama, subtitle: item.alamat })}
                      title="Klik perbesar foto"
                    >
                      <img
                        src={resolvedFoto}
                        alt={item.nama}
                        className="w-full h-full object-cover group-hover/thumb:scale-110 transition duration-300"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center text-white transition">
                        <ZoomIn size={15} />
                      </div>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-center shrink-0">
                      <TypeIcon size={24} className="text-emerald-600 dark:text-emerald-400" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${getFacilityBadgeClass(item.jenis)}`}>
                        <TypeIcon size={11} className="shrink-0" />
                        {formatFacilityTypeLabel(item.jenis)}
                      </span>
                      {item.kapasitas && item.kapasitas > 0 ? (
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          {item.kapasitas} kg
                        </span>
                      ) : null}
                    </div>

                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug line-clamp-1 group-hover:text-[#009966] transition-colors">
                      {item.nama}
                    </h4>

                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <MapPin size={12} className="text-emerald-600 shrink-0" />
                      <span className="truncate">
                        {item.rw?.name ? (item.rw.name.startsWith("RW") || item.rw.name.startsWith("Kel.") ? item.rw.name : `RW ${item.rw.name}`) : "Wilayah Binaan"}
                        {item.alamat ? ` • ${item.alamat}` : ""}
                      </span>
                    </div>
                  </div>
                </div>

                {/* PIC Info & WhatsApp */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <User size={13} className="text-slate-400 shrink-0" />
                    <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs truncate max-w-[130px]">
                      {picInfo.name}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                      picInfo.isWarga
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                        : "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800"
                    }`}>
                      {picInfo.roleBadge}
                    </span>
                  </div>

                  {picInfo.contact && picInfo.contact !== "-" && (
                    <a
                      href={`https://wa.me/${picInfo.contact.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 hover:underline shrink-0"
                      title="Hubungi via WhatsApp"
                    >
                      <Phone size={11} />
                      <span>{picInfo.contact}</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Card Footer: Koordinat GPS, Fokus Peta & Aksi */}
              <div className="px-4 py-2.5 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {hasValidCoords && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleCopyCoordinate(item.id, latNum, lngNum)}
                        className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-500 hover:text-emerald-600 px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer transition shadow-2xs"
                        title="Salin Koordinat GPS"
                      >
                        {copiedCoordId === item.id ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                        <span>{latNum.toFixed(4)}, {lngNum.toFixed(4)}</span>
                      </button>

                      <a
                        href={`https://www.google.com/maps?q=${latNum},${lngNum}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Buka di Google Maps"
                      >
                        <ExternalLink size={13} />
                      </a>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {hasValidCoords && (
                    <button
                      type="button"
                      onClick={() => handleViewOnMap(latNum, lngNum)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#009966] hover:bg-[#008055] active:scale-95 text-white text-xs font-bold transition cursor-pointer shadow-2xs"
                      title="Sorot lokasi titik ini di peta GIS atas"
                    >
                      <Navigation size={12} />
                      <span>Lihat di Peta</span>
                    </button>
                  )}

                  {isDeveloper && (
                    <>
                      <button
                        type="button"
                        onClick={() => setEditingFacility(item)}
                        className="p-1.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 transition cursor-pointer"
                        title="Edit Fasilitas"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteFacility(item.id)}
                        className="p-1.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition cursor-pointer"
                        title="Hapus Fasilitas"
                      >
                        <Trash2 size={12} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // =========================================================================
  // RENDER TABEL DATA LENGKAP DIREKTORI FASILITAS (HIGH-DENSITY TABULAR)
  // =========================================================================
  const renderTableView = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[950px]">
        <thead>
          <tr className="bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80 text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
            <th className="py-3.5 px-4 w-12 text-center">No</th>
            <th className="py-3.5 px-4 min-w-[240px]">Foto &amp; Fasilitas</th>
            <th className="py-3.5 px-4 min-w-[150px]">Jenis Fasilitas</th>
            <th className="py-3.5 px-4 min-w-[200px]">Penanggung Jawab (PIC)</th>
            <th className="py-3.5 px-4 min-w-[220px]">Wilayah &amp; Koordinat</th>
            <th className="py-3.5 px-4 min-w-[130px]">Waktu Terdaftar</th>
            <th className="py-3.5 px-4 w-28 text-center">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
          {paginatedItems.map((item, index) => {
            const picInfo = getDisplayPic(item);
            const resolvedFoto = resolveImageUrl(item.foto);
            const TypeIcon = getFacilityTypeIcon(item.jenis);
            const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;
            const latNum = Number(item.latitude);
            const lngNum = Number(item.longitude);
            const hasValidCoords = !isNaN(latNum) && !isNaN(lngNum) && latNum !== 0;

            return (
              <tr 
                key={item.id} 
                className="hover:bg-slate-50/90 dark:hover:bg-slate-800/50 transition duration-150 group"
              >
                {/* 1. Kolom Nomor */}
                <td className="py-4 px-4 text-center font-bold text-slate-400 dark:text-slate-500">
                  {rowNumber}
                </td>

                {/* 2. Kolom Foto & Nama Fasilitas */}
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    {resolvedFoto ? (
                      <div
                        className="relative group cursor-pointer overflow-hidden rounded-xl shrink-0 w-12 h-12 border border-slate-200 dark:border-slate-700"
                        onClick={() => setPreviewImage({ url: resolvedFoto, title: item.nama, subtitle: item.alamat })}
                        title="Klik perbesar foto"
                      >
                        <img
                          src={resolvedFoto}
                          alt={item.nama}
                          className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition">
                          <Eye size={12} />
                        </div>
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-center shrink-0">
                        <TypeIcon size={20} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                    )}

                    <div className="min-w-0">
                      <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight">
                        {item.nama}
                      </h4>
                      {item.kapasitas && item.kapasitas > 0 ? (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                          Kapasitas: <strong className="text-emerald-600 dark:text-emerald-400">{item.kapasitas} kg</strong>
                        </p>
                      ) : null}
                    </div>
                  </div>
                </td>

                {/* 3. Kolom Jenis Fasilitas */}
                <td className="py-4 px-4 whitespace-nowrap">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${getFacilityBadgeClass(item.jenis)}`}>
                    <TypeIcon size={13} className="shrink-0" />
                    <span>{formatFacilityTypeLabel(item.jenis)}</span>
                  </span>
                </td>

                {/* 4. Kolom Penanggung Jawab */}
                <td className="py-4 px-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100">
                        {picInfo.name}
                      </span>
                      <span className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded border ${
                        picInfo.isWarga
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                          : "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800"
                      }`}>
                        {picInfo.roleBadge}
                      </span>
                    </div>

                    {picInfo.contact && picInfo.contact !== "-" && (
                      <a
                        href={`https://wa.me/${picInfo.contact.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-mono text-emerald-600 dark:text-emerald-400 hover:underline"
                        title="Hubungi via WhatsApp"
                      >
                        <Phone size={11} />
                        <span>{picInfo.contact}</span>
                      </a>
                    )}
                  </div>
                </td>

                {/* 5. Kolom Wilayah & Koordinat */}
                <td className="py-4 px-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-semibold">
                      <MapPin size={12} className="text-emerald-600 shrink-0" />
                      <span className="truncate max-w-[200px]">
                        {item.rw?.name ? (item.rw.name.startsWith("RW") || item.rw.name.startsWith("Kel.") ? item.rw.name : `RW ${item.rw.name}`) : "Wilayah Binaan"}
                        {item.alamat ? ` • ${item.alamat}` : ""}
                      </span>
                    </div>

                    {hasValidCoords && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopyCoordinate(item.id, latNum, lngNum)}
                          className="inline-flex items-center gap-1 text-[10.5px] font-mono text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer transition"
                          title="Salin Koordinat GPS"
                        >
                          {copiedCoordId === item.id ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                          <span>{latNum.toFixed(5)}, {lngNum.toFixed(5)}</span>
                        </button>

                        <a
                          href={`https://www.google.com/maps?q=${latNum},${lngNum}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-400 hover:text-blue-600 p-0.5"
                          title="Buka di Google Maps"
                        >
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    )}
                  </div>
                </td>

                {/* 6. Kolom Waktu Terdaftar */}
                <td className="py-4 px-4 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} className="text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {new Date(item.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </td>

                {/* 7. Kolom Aksi */}
                <td className="py-4 px-4 text-center whitespace-nowrap">
                  <div className="flex items-center justify-center gap-2">
                    {hasValidCoords ? (
                      <button
                        type="button"
                        onClick={() => handleViewOnMap(latNum, lngNum)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 text-[#009966] dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-800/80 transition active:scale-95 cursor-pointer shadow-2xs"
                        title="Tampilkan lokasi titik ini di peta GIS atas"
                      >
                        <MapPin size={13} />
                        <span>Peta</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic px-2">-</span>
                    )}
                    
                    {isDeveloper && (
                      <>
                        <button
                          type="button"
                          onClick={() => setEditingFacility(item)}
                          className="inline-flex items-center justify-center p-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/70 hover:bg-blue-100 dark:hover:bg-blue-900/80 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/80 transition active:scale-95 cursor-pointer"
                          title="Edit Fasilitas"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteFacility(item.id)}
                          className="inline-flex items-center justify-center p-1.5 rounded-xl bg-red-50 dark:bg-red-950/70 hover:bg-red-100 dark:hover:bg-red-900/80 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/80 transition active:scale-95 cursor-pointer"
                          title="Hapus Fasilitas"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}

          {paginatedItems.length === 0 && (
            <tr>
              <td colSpan={7} className="p-12 text-center text-slate-500 dark:text-slate-400">
                <div className="max-w-xs mx-auto flex flex-col items-center">
                  <Sprout size={32} className="text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="font-semibold text-sm">Tidak ada fasilitas yang ditemukan</p>
                  <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter jenis fasilitas.</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="pb-24 lg:pb-8 pt-4 sm:pt-6">
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
        
        {/* ========================================================================= */}
        {/* HEADER HALAMAN RESMI                                                      */}
        {/* ========================================================================= */}
        <PageHeader
          category="Tata Kelola Sampah • Peta Sebaran"
          scope={
            user?.peran === "DPL" || user?.peran === "DOSEN_PEMBIMBING"
              ? user?.wilayah || (user?.kelurahan ? `Kel. ${user.kelurahan}` : "Wilayah Dampingan KKN")
              : user?.peran === "RW"
              ? `RW ${user?.rw || user?.rtRwId || ""}`
              : user?.peran === "LURAH"
              ? `Kelurahan ${user?.kelurahan || ""}`
              : "Kecamatan Coblong"
          }
          title="Data Fasilitas Pengelolaan Sampah"
          description="Pemetaan spasial interaktif dan direktori inventaris fasilitas fisik daur ulang sampah (Bank Sampah, Buruan Sae, Inovasi Organik Loseda/Bata Terawang/Maggot, dan TPS) di seluruh wilayah binaan."
          icon={Sprout}
          actions={
            <div className="flex items-center gap-2.5 flex-wrap justify-end">
              {/* Toggle Switcher Tampilan Direktori */}
              <div className="inline-flex items-center p-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0">
                <button
                  type="button"
                  onClick={() => handleViewModeChange("cards")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    viewMode === "cards"
                      ? "bg-[#009966] text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:text-[#009966]"
                  }`}
                  title="Tampilan kartu direktori fasilitas"
                >
                  <LayoutGrid size={14} />
                  <span>Grid Kartu</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleViewModeChange("table")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    viewMode === "table"
                      ? "bg-[#009966] text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:text-[#009966]"
                  }`}
                  title="Tampilan tabel data tabular lengkap"
                >
                  <Table2 size={14} />
                  <span>Tabel Lengkap</span>
                </button>
              </div>

              {isDeveloper && (
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#035941] dark:bg-emerald-600 text-white hover:bg-[#024432] dark:hover:bg-emerald-700 shadow-sm transition-all cursor-pointer active:scale-95"
                  title="Tambah Fasilitas Baru (Khusus Developer / Super User)"
                >
                  <Plus size={14} />
                  <span>Tambah Fasilitas</span>
                </button>
              )}
            </div>
          }
        />

        {/* ========================================================================= */}
        {/* 1. SEKSI FULL-MAP GIS INTERAKTIF (LEBAR PENUH & INTERAKTIF)                */}
        {/* ========================================================================= */}
        {renderFullMapSection()}

        {/* ========================================================================= */}
        {/* 2. CARD METRIK & QUICK FILTER KATEGORI ("ICONNYA DIBAWAH PETA")           */}
        {/* ========================================================================= */}
        {renderMetricCardsBelowMap()}

        {/* ========================================================================= */}
        {/* 3. DIREKTORI & TABEL INVENTARIS FASILITAS PERSAMPAHAN                     */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden space-y-0">
          {/* Toolbar Pencarian & Filter Terpadu */}
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-3 md:items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-[#009966] dark:text-emerald-400">
                <Boxes size={18} />
              </span>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                  Direktori Inventaris Fasilitas Pengelolaan Sampah
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Menampilkan {filteredItems.length} fasilitas terdata di wilayah binaan
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 w-full md:w-auto">
              {/* Baris 1: Pencarian */}
              <div className="relative w-full min-w-[240px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Cari fasilitas, PIC, alamat, RW..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm outline-none focus:border-[#009966] focus:ring-2 focus:ring-[#009966]/10 text-slate-800 dark:text-slate-100 placeholder-slate-400 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Baris 2: Dropdown Filter */}
              <div className="flex flex-wrap gap-2">
                {/* Filter Jenis */}
                <div className="relative flex items-center">
                  <Boxes size={14} className="absolute left-2.5 text-slate-400 pointer-events-none" />
                  <select
                    value={selectedJenis}
                    onChange={(e) => { setSelectedJenis(e.target.value); setCurrentPage(1); }}
                    className="pl-7 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none focus:border-[#009966] focus:ring-2 focus:ring-[#009966]/10 text-slate-800 dark:text-slate-100 transition-all cursor-pointer"
                  >
                    <option value="ALL">Semua Jenis</option>
                    <option value="bank_sampah">Bank Sampah</option>
                    <option value="organik_group">Inovasi Organik</option>
                    <option value="buruan_sae">Buruan Sae</option>
                    <option value="loseda">Loseda</option>
                    <option value="bata_terawang">Bata Terawang</option>
                    <option value="rumah_maggot">Rumah Maggot</option>
                    <option value="tps">TPS</option>
                  </select>
                </div>

                {/* Filter Kelurahan */}
                <div className="relative flex items-center">
                  <MapPin size={14} className="absolute left-2.5 text-slate-400 pointer-events-none" />
                  <select
                    value={selectedKelurahan}
                    onChange={(e) => {
                      setSelectedKelurahan(e.target.value);
                      setSelectedRwId("ALL");
                      setCurrentPage(1);
                    }}
                    className="pl-7 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none focus:border-[#009966] focus:ring-2 focus:ring-[#009966]/10 text-slate-800 dark:text-slate-100 transition-all cursor-pointer"
                  >
                    <option value="ALL">Semua Kelurahan</option>
                    {masterKelurahanList.map((k) => (
                      <option key={k.id} value={k.name}>
                        Kel. {formatWilayahName(k.name)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filter RW */}
                <div className="relative flex items-center">
                  <Globe size={14} className="absolute left-2.5 text-slate-400 pointer-events-none" />
                  <select
                    value={selectedRwId}
                    onChange={(e) => { setSelectedRwId(e.target.value); setCurrentPage(1); }}
                    className="pl-7 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none focus:border-[#009966] focus:ring-2 focus:ring-[#009966]/10 text-slate-800 dark:text-slate-100 transition-all cursor-pointer"
                  >
                    <option value="ALL">Semua RW</option>
                    {rwFilterOptions.map((rw) => (
                      <option key={rw} value={rw}>
                        {formatRwLabel(rw)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filter Kelompok KKN */}
                {kelompokList.length > 0 && (
                  <div className="relative flex items-center">
                    <Users size={14} className="absolute left-2.5 text-slate-400 pointer-events-none" />
                    <select
                      value={selectedKelompokId}
                      onChange={(e) => { setSelectedKelompokId(e.target.value); setCurrentPage(1); }}
                      className="pl-7 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none focus:border-[#009966] focus:ring-2 focus:ring-[#009966]/10 text-slate-800 dark:text-slate-100 transition-all cursor-pointer"
                    >
                      <option value="ALL">Semua Kelompok</option>
                      {filteredKelompokOptions.map((kel) => (
                        <option key={kel.id} value={kel.id}>
                          {formatKelompokName(kel.name)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Reset Filter Button */}
                {(selectedJenis !== "ALL" || selectedKelurahan !== "ALL" || selectedRwId !== "ALL" || selectedKelompokId !== "ALL" || searchQuery) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedJenis("ALL");
                      setSelectedKelurahan("ALL");
                      setSelectedRwId("ALL");
                      setSelectedKelompokId("ALL");
                      setCurrentPage(1);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition cursor-pointer"
                  >
                    <X size={13} />
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Konten Direktori: Tampilan Kartu Grid ATAU Tabel Lengkap */}
          <div className="p-4 sm:p-5">
            {viewMode === "cards" ? renderCardsGridView() : renderTableView()}
          </div>

          {/* Paginasi Terpadu */}
          {!loading && filteredItems.length > 0 && (
            <div className="border-t border-slate-200 dark:border-slate-800 p-2 sm:p-3 bg-slate-50/40 dark:bg-slate-800/20">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredItems.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
                itemsPerPageOptions={[6, 12, 24, 48]}
              />
            </div>
          )}
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. MODAL LIGHTBOX IMAGE PREVIEW (MEMPERBESAR FOTO FASILITAS)                */}
      {/* ========================================================================= */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                  {previewImage.title}
                </h4>
                {previewImage.subtitle && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {previewImage.subtitle}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-950 flex items-center justify-center max-h-[70vh] overflow-hidden">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-h-[65vh] max-w-full object-contain rounded-lg shadow-md"
              />
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>Foto dokumentasi fasilitas terverifikasi</span>
              <a
                href={previewImage.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
              >
                <ExternalLink size={13} /> Buka Gambar Asli
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL EDIT & TAMBAH FASILITAS                                           */}
      {/* ========================================================================= */}
      {editingFacility && (
        <EditFacilityModal
          facility={editingFacility}
          onClose={() => setEditingFacility(null)}
          onSuccess={() => {
            setEditingFacility(null);
            fetchItems();
          }}
        />
      )}

      {isCreateOpen && (
        <CreateFacilityModal
          onClose={() => setIsCreateOpen(false)}
          onSuccess={() => {
            setIsCreateOpen(false);
            fetchItems();
          }}
        />
      )}
    </div>
  );
};

const CreateFacilityModal: React.FC<{
  onClose: () => void;
  onSuccess: () => void;
}> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    nama: "",
    jenis: "bank_sampah",
    pic: "",
    kontak: "",
    alamat: "",
    kapasitas: "",
    latitude: -6.885,
    longitude: 107.615,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/facilities", formData);
      showToast.success("Fasilitas baru berhasil didaftarkan");
      onSuccess();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || "Gagal menambahkan fasilitas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Plus size={18} className="text-emerald-500" /> Tambah Fasilitas Baru
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer">
            <X size={20} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">
          <form id="create-facility-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Fasilitas</label>
              <input type="text" value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" required placeholder="Contoh: Bank Sampah Berkah RW 03" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Jenis Fasilitas</label>
              <select value={formData.jenis} onChange={e => setFormData({...formData, jenis: e.target.value})} className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" required>
                <option value="bank_sampah">Bank Sampah</option>
                <option value="buruan_sae">Buruan Sae</option>
                <option value="loseda">Loseda</option>
                <option value="rumah_maggot">Rumah Maggot</option>
                <option value="bata_terawang">Bata Terawang</option>
                <option value="tps">TPS</option>
                <option value="posko_kkn">Posko KKN</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">PIC (Penanggung Jawab)</label>
              <input type="text" value={formData.pic} onChange={e => setFormData({...formData, pic: e.target.value})} className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" required placeholder="Nama lengkap pengelola" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Kontak PIC (Nomor HP/WA)</label>
              <input type="text" value={formData.kontak} onChange={e => setFormData({...formData, kontak: e.target.value})} className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" placeholder="08xxxxxxxxxx" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Kapasitas Olah (kg)</label>
              <input type="number" value={formData.kapasitas} onChange={e => setFormData({...formData, kapasitas: e.target.value})} className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" placeholder="Contoh: 100" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Alamat Lengkap</label>
              <textarea value={formData.alamat} onChange={e => setFormData({...formData, alamat: e.target.value})} className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" rows={2} placeholder="Jalan, RT/RW, Kelurahan..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Latitude</label>
                <input type="text" value={formData.latitude} onChange={e => setFormData({...formData, latitude: Number(e.target.value) || 0})} className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Longitude</label>
                <input type="text" value={formData.longitude} onChange={e => setFormData({...formData, longitude: Number(e.target.value) || 0})} className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" required />
              </div>
            </div>
          </form>
        </div>
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600">Batal</button>
          <button type="submit" form="create-facility-form" disabled={loading} className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Tambahkan
          </button>
        </div>
      </div>
    </div>
  );
};

const EditFacilityModal: React.FC<{
  facility: FacilityItem;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ facility, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    nama: facility.nama || "",
    jenis: facility.jenis || "bank_sampah",
    pic: facility.pic || "",
    kontak: facility.kontak || "",
    alamat: facility.alamat || "",
    kapasitas: facility.kapasitas || "",
    latitude: facility.latitude || -6.885,
    longitude: facility.longitude || 107.615,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/facilities/${facility.id}`, formData);
      showToast.success("Data fasilitas berhasil diperbarui");
      onSuccess();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || "Gagal memperbarui fasilitas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Edit2 size={18} className="text-blue-500" /> Edit Fasilitas
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer">
            <X size={20} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">
          <form id="edit-facility-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Fasilitas</label>
              <input type="text" value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Jenis Fasilitas</label>
              <select value={formData.jenis} onChange={e => setFormData({...formData, jenis: e.target.value})} className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" required>
                <option value="bank_sampah">Bank Sampah</option>
                <option value="buruan_sae">Buruan Sae</option>
                <option value="loseda">Loseda</option>
                <option value="rumah_maggot">Rumah Maggot</option>
                <option value="bata_terawang">Bata Terawang</option>
                <option value="tps">TPS</option>
                <option value="posko_kkn">Posko KKN</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">PIC (Penanggung Jawab)</label>
              <input type="text" value={formData.pic} onChange={e => setFormData({...formData, pic: e.target.value})} className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Kontak PIC</label>
              <input type="text" value={formData.kontak} onChange={e => setFormData({...formData, kontak: e.target.value})} className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Kapasitas (kg)</label>
              <input type="number" value={formData.kapasitas} onChange={e => setFormData({...formData, kapasitas: e.target.value})} className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Alamat Lengkap</label>
              <textarea value={formData.alamat} onChange={e => setFormData({...formData, alamat: e.target.value})} className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Latitude</label>
                <input type="text" value={formData.latitude} onChange={e => setFormData({...formData, latitude: Number(e.target.value) || 0})} className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Longitude</label>
                <input type="text" value={formData.longitude} onChange={e => setFormData({...formData, longitude: Number(e.target.value) || 0})} className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" required />
              </div>
            </div>
          </form>
        </div>
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600">Batal</button>
          <button type="submit" form="edit-facility-form" disabled={loading} className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Simpan
          </button>
        </div>
      </div>
    </div>
  );
};

export default PemanfaatanSampah;
