import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  Polygon,
  useMap
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
  Building2
} from "lucide-react";
import api from "../../services/api";
import showToast from "../../utils/showToast";
import { Pagination } from "../../components/common/Pagination";
import PageHeader from "../../components/common/PageHeader";
import { ThemeTileLayer } from "../../components/common/ThemeTileLayer";
import { createFacilityIcon, KELURAHAN_GEODATA } from "../../constants/coblongGeoData";
import { resolveImageUrl } from "../../utils/imageUrl";

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
  // Jika rawPic berupa nama warga (bukan UUID)
  if (rawPic && rawPic !== "-" && !isUUID(rawPic)) {
    return {
      name: rawPic,
      roleBadge: "Warga Pengelola",
      isWarga: true,
      registeredByName: regName || undefined,
      contact: directPhone,
    };
  }

  // Jika rawPic berupa UUID atau kosong (data lama yang terisi ID atau belum diset nama warganya)
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
      return "TPS (Tempat Penampungan Sementara)";
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

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJenis, setSelectedJenis] = useState("ALL");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Map Animation State
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

  useEffect(() => {
    fetchItems();
  }, []);

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
    return items.filter((item) => {
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

      return matchSearch && matchJenis;
    });
  }, [items, searchQuery, selectedJenis]);

  // Reset pagination on search / filter
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedJenis, itemsPerPage]);

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

  return (
    <div className="pb-24 lg:pb-8">
      <PageHeader
        title="Fasilitas Pengelolaan Sampah"
        description="Pemetaan dan direktori inventaris fasilitas fisik pengolahan sampah serta inovasi daur ulang warga (Bank Sampah, Buruan Sae, Loseda, Bata Terawang, Rumah Maggot, POC, TPS) di Kecamatan Coblong."
        icon={Sprout}
      />

      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
        
        {/* ========================================================================= */}
        {/* 1. CARD JUMLAH FASILITAS (METRIC & QUICK FILTER CARDS - CLEAN LOOK)       */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3.5 sm:gap-4.5">
          
          {/* Card 1: Semua Fasilitas */}
          <button
            type="button"
            onClick={() => handleCardFilterClick("ALL")}
            className={`relative p-4 sm:p-4.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden group ${
              selectedJenis === "ALL"
                ? "bg-emerald-50/90 dark:bg-emerald-950/50 border-emerald-500 text-emerald-950 dark:text-emerald-50 shadow-md ring-2 ring-emerald-500/20"
                : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:border-emerald-400 hover:shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between w-full mb-2.5">
              <span className={`text-[11px] font-extrabold uppercase tracking-wider ${selectedJenis === "ALL" ? "text-emerald-800 dark:text-emerald-300" : "text-slate-500 dark:text-slate-400"}`}>
                Semua Data
              </span>
              <div className={`p-2 rounded-xl transition-colors ${selectedJenis === "ALL" ? "bg-emerald-200/60 dark:bg-emerald-800/60 text-emerald-900 dark:text-emerald-200" : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"}`}>
                <Layers size={17} />
              </div>
            </div>
            <div>
              <div className={`text-2xl sm:text-[26px] font-black tracking-tight ${selectedJenis === "ALL" ? "text-emerald-950 dark:text-white" : "text-slate-900 dark:text-white"}`}>
                {metrics.total}
              </div>
              <p className={`text-xs font-semibold mt-1 truncate ${selectedJenis === "ALL" ? "text-emerald-700 dark:text-emerald-300" : "text-slate-500 dark:text-slate-400"}`}>
                Titik Terdata
              </p>
            </div>
          </button>

          {/* Card 2: Bank Sampah */}
          <button
            type="button"
            onClick={() => handleCardFilterClick("bank_sampah")}
            className={`relative p-4 sm:p-4.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden group ${
              selectedJenis === "bank_sampah"
                ? "bg-blue-50/90 dark:bg-blue-950/50 border-blue-500 text-blue-950 dark:text-blue-50 shadow-md ring-2 ring-blue-500/20"
                : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:border-blue-400 hover:shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between w-full mb-2.5">
              <span className={`text-[11px] font-extrabold uppercase tracking-wider ${selectedJenis === "bank_sampah" ? "text-blue-800 dark:text-blue-300" : "text-slate-500 dark:text-slate-400"}`}>
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
              <p className={`text-xs font-semibold mt-1 truncate ${selectedJenis === "bank_sampah" ? "text-blue-700 dark:text-blue-300" : "text-slate-500 dark:text-slate-400"}`}>
                Unit Tabungan
              </p>
            </div>
          </button>

          {/* Card 3: Inovasi Organik */}
          <button
            type="button"
            onClick={() => handleCardFilterClick("organik_group")}
            className={`relative p-4 sm:p-4.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden group ${
              selectedJenis === "organik_group"
                ? "bg-teal-50/90 dark:bg-teal-950/50 border-teal-500 text-teal-950 dark:text-teal-50 shadow-md ring-2 ring-teal-500/20"
                : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:border-teal-400 hover:shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between w-full mb-2.5">
              <span className={`text-[11px] font-extrabold uppercase tracking-wider ${selectedJenis === "organik_group" ? "text-teal-800 dark:text-teal-300" : "text-slate-500 dark:text-slate-400"}`}>
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
              <p className={`text-xs font-semibold mt-1 truncate ${selectedJenis === "organik_group" ? "text-teal-700 dark:text-teal-300" : "text-slate-500 dark:text-slate-400"}`}>
                Loseda, Maggot, POC
              </p>
            </div>
          </button>

          {/* Card 4: Buruan Sae */}
          <button
            type="button"
            onClick={() => handleCardFilterClick("buruan_sae")}
            className={`relative p-4 sm:p-4.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden group ${
              selectedJenis === "buruan_sae"
                ? "bg-lime-50/90 dark:bg-lime-950/50 border-lime-500 text-lime-950 dark:text-lime-50 shadow-md ring-2 ring-lime-500/20"
                : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:border-lime-400 hover:shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between w-full mb-2.5">
              <span className={`text-[11px] font-extrabold uppercase tracking-wider ${selectedJenis === "buruan_sae" ? "text-lime-800 dark:text-lime-300" : "text-slate-500 dark:text-slate-400"}`}>
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
              <p className={`text-xs font-semibold mt-1 truncate ${selectedJenis === "buruan_sae" ? "text-lime-700 dark:text-lime-300" : "text-slate-500 dark:text-slate-400"}`}>
                Kebun Urban Warga
              </p>
            </div>
          </button>

          {/* Card 5: TPS */}
          <button
            type="button"
            onClick={() => handleCardFilterClick("tps")}
            className={`relative p-4 sm:p-4.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden group ${
              selectedJenis === "tps"
                ? "bg-amber-50/90 dark:bg-amber-950/50 border-amber-500 text-amber-950 dark:text-amber-50 shadow-md ring-2 ring-amber-500/20"
                : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:border-amber-400 hover:shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between w-full mb-2.5">
              <span className={`text-[11px] font-extrabold uppercase tracking-wider ${selectedJenis === "tps" ? "text-amber-800 dark:text-amber-300" : "text-slate-500 dark:text-slate-400"}`}>
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
              <p className={`text-xs font-semibold mt-1 truncate ${selectedJenis === "tps" ? "text-amber-700 dark:text-amber-300" : "text-slate-500 dark:text-slate-400"}`}>
                Tempat Penampungan
              </p>
            </div>
          </button>

          {/* Card 6: Kapasitas Olah Total */}
          <div
            className="relative p-4 sm:p-4.5 rounded-2xl border text-left flex flex-col justify-between overflow-hidden bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100"
          >
            <div className="flex items-center justify-between w-full mb-2.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Kapasitas Olah
              </span>
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                <Boxes size={17} />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-[26px] font-black tracking-tight text-slate-900 dark:text-white">
                {metrics.totalKapasitas > 0 ? `${metrics.totalKapasitas} Kg` : "-"}
              </div>
              <p className="text-xs font-semibold mt-1 truncate text-slate-500 dark:text-slate-400">
                Kapasitas Fasilitas
              </p>
            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* 2. PETA GIS INTERAKTIF (DENGAN LEGENDA LENGKAP FASILITAS PERSAMPAHAN)     */}
        {/* ========================================================================= */}
        <div ref={mapSectionRef} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-3 relative overflow-hidden">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-2 py-1 mb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                <MapPin size={16} />
              </span>
              <div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  Peta Sebaran Fasilitas Pengelolaan Sampah
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Wilayah Kecamatan Coblong, Kota Bandung ({filteredItems.length} titik aktif)
                </p>
              </div>
            </div>

            {selectedJenis !== "ALL" && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                  Filter Aktif: {selectedJenis === "organik_group" ? "Inovasi Organik" : formatFacilityTypeLabel(selectedJenis)}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedJenis("ALL")}
                  className="text-xs text-slate-500 hover:text-rose-600 flex items-center gap-1 font-medium transition cursor-pointer"
                >
                  <X size={13} /> Reset Filter
                </button>
              </div>
            )}
          </div>

          <div className="relative rounded-xl overflow-hidden h-[440px] sm:h-[480px] z-0 border border-slate-200/80 dark:border-slate-800">
            {/* Legenda Monitoring Floating Card */}
            <div className="absolute top-3 right-3 z-[999] max-w-[280px] pointer-events-auto">
              <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xl rounded-xl p-3 border border-slate-200 dark:border-slate-800 flex flex-col gap-2.5">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10.5px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                      Legenda Simbol Peta
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {/* Fasilitas */}
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
                        <span className="w-2.5 h-2.5 rounded-xs bg-[#06b6d4] shrink-0" />
                        <span className="font-bold text-slate-700 dark:text-slate-300 truncate">POC</span>
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
              </div>
            </div>

            <MapContainer
              center={[-6.8903, 107.611]}
              zoom={14}
              style={{ height: '100%', width: '100%' }}
              className="z-0"
            >
              <ThemeTileLayer />
              <MapFlyToController center={mapTargetCenter} zoom={mapTargetZoom} />
              
              {/* Render Kelurahan Boundaries */}
              {Object.values(KELURAHAN_GEODATA).map((kg) => (
                <Polygon
                  key={kg.id}
                  positions={kg.bounds as any}
                  pathOptions={{
                    color: kg.color,
                    weight: 2.5,
                    fillColor: kg.color,
                    fillOpacity: 0.08,
                  }}
                />
              ))}

              {filteredItems.map(fac => {
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
                      <div className="p-1 min-w-[220px]">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className={`inline-block px-2 py-0.5 rounded text-[9.5px] font-bold border ${getFacilityBadgeClass(fac.jenis)}`}>
                            {formatFacilityTypeLabel(fac.jenis)}
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm mb-1.5 leading-snug">{fac.nama}</h3>
                        {resolvedFoto && (
                          <div 
                            className="relative group cursor-pointer overflow-hidden rounded-lg mb-2"
                            onClick={() => setPreviewImage({ url: resolvedFoto, title: fac.nama, subtitle: fac.alamat })}
                          >
                            <img 
                              src={resolvedFoto} 
                              alt={fac.nama} 
                              className="w-full h-28 object-cover rounded-lg shadow-xs hover:scale-105 transition duration-300"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold gap-1 transition">
                              <Eye size={13} /> Lihat Foto
                            </div>
                          </div>
                        )}
                        <div className="space-y-1 text-xs text-slate-700 border-t border-slate-100 pt-1.5">
                          <p><strong className="text-slate-900">PIC:</strong> {picInfo.name}</p>
                          {picInfo.contact && picInfo.contact !== "-" && (
                            <p><strong className="text-slate-900">Kontak:</strong> {picInfo.contact}</p>
                          )}
                          <p><strong className="text-slate-900">Wilayah:</strong> {fac.rw?.name || fac.alamat || "-"}</p>
                          <p className="text-[10.5px] text-slate-500 font-mono">
                            {latNum.toFixed(5)}, {lngNum.toFixed(5)}
                          </p>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. TABEL DATA INVENTARIS FASILITAS PERSAMPAHAN (TERPADU & RAPI)            */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-0">
          
          {/* Toolbar Pencarian & Filter */}
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-3 md:items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-[#009966] dark:text-emerald-400">
                <Boxes size={18} />
              </span>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                  Daftar Inventaris Fasilitas Pengelolaan Sampah
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Menampilkan {filteredItems.length} fasilitas terdata di Kecamatan Coblong
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto">
              <div className="relative min-w-[240px] flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Cari fasilitas, PIC, alamat, wilayah..."
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

              <select
                value={selectedJenis}
                onChange={(e) => setSelectedJenis(e.target.value)}
                className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold outline-none focus:border-[#009966] focus:ring-2 focus:ring-[#009966]/10 text-slate-800 dark:text-slate-100 transition-all cursor-pointer"
              >
                <option value="ALL">Semua Jenis Fasilitas</option>
                <option value="bank_sampah">Bank Sampah</option>
                <option value="organik_group">Inovasi Organik (Loseda, Maggot, Bata, POC)</option>
                <option value="buruan_sae">Buruan Sae</option>
                <option value="loseda">Loseda</option>
                <option value="bata_terawang">Bata Terawang</option>
                <option value="rumah_maggot">Rumah Maggot</option>
                <option value="poc">POC (Pupuk Organik Cair)</option>
                <option value="tps">TPS (Tempat Penampungan Sementara)</option>
              </select>
            </div>
          </div>

          {/* Konten Tabel */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 size={36} className="text-[#009966] animate-spin mb-3" />
              <p className="text-slate-500 text-sm font-medium">Memuat data fasilitas...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[920px]">
                <thead>
                  <tr className="bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80 text-[11px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-12 text-center">No</th>
                    <th className="py-3.5 px-4 min-w-[240px]">Foto &amp; Fasilitas</th>
                    <th className="py-3.5 px-4 min-w-[150px]">Jenis Fasilitas</th>
                    <th className="py-3.5 px-4 min-w-[200px]">Penanggung Jawab (PIC)</th>
                    <th className="py-3.5 px-4 min-w-[220px]">Wilayah &amp; Koordinat</th>
                    <th className="py-3.5 px-4 min-w-[140px]">Waktu Terdaftar</th>
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
                          <div className="flex items-center gap-3.5">
                            {/* Thumbnail Foto */}
                            {resolvedFoto ? (
                              <div 
                                className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 group/img cursor-pointer shadow-2xs"
                                onClick={() => setPreviewImage({ 
                                  url: resolvedFoto, 
                                  title: item.nama, 
                                  subtitle: item.alamat || item.rw?.name 
                                })}
                                title="Klik untuk memperbesar foto"
                              >
                                <img
                                  src={resolvedFoto}
                                  alt={item.nama}
                                  className="w-full h-full object-cover group-hover/img:scale-110 transition duration-300"
                                  onError={(e) => {
                                    // Fallback ke icon jika URL gambar error 404
                                    (e.target as HTMLElement).style.display = "none";
                                    const fallbackDiv = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                                    if (fallbackDiv) fallbackDiv.style.display = "flex";
                                  }}
                                />
                                <div className="hidden absolute inset-0 bg-emerald-50 dark:bg-emerald-950/60 items-center justify-center text-emerald-600 dark:text-emerald-400">
                                  <Sprout size={20} />
                                </div>
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-white transition">
                                  <ZoomIn size={16} />
                                </div>
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-2xs">
                                <TypeIcon size={22} />
                              </div>
                            )}

                            {/* Info Nama & Kapasitas */}
                            <div className="min-w-0 flex-1">
                              <p className="font-extrabold text-slate-900 dark:text-slate-100 text-sm leading-snug">
                                {item.nama}
                              </p>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                {item.kapasitas !== undefined && item.kapasitas !== null && item.kapasitas > 0 && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                    <Building2 size={10} /> Kapasitas: {item.kapasitas} Kg
                                  </span>
                                )}
                                <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                  Aktif
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 3. Kolom Jenis Fasilitas */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${getFacilityBadgeClass(item.jenis)}`}>
                            <TypeIcon size={13} className="shrink-0" />
                            {formatFacilityTypeLabel(item.jenis)}
                          </span>
                        </td>

                        {/* 4. Kolom Penanggung Jawab (PIC Warga / Posko) */}
                        <td className="py-4 px-4">
                          <div className="space-y-1.5">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <User size={13} className="text-slate-400 shrink-0" />
                                <p className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm leading-snug">
                                  {picInfo.name}
                                </p>
                              </div>
                              <span className={`inline-block mt-0.5 text-[9.5px] font-bold px-1.5 py-0.2 rounded border ${
                                picInfo.isWarga
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                                  : "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800"
                              }`}>
                                {picInfo.roleBadge}
                              </span>
                            </div>

                            {picInfo.contact && picInfo.contact !== "-" && (
                              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                <Phone size={11} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <a 
                                  href={`https://wa.me/${picInfo.contact.replace(/\D/g, '')}`} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline font-mono text-[11px]"
                                  title="Hubungi via WhatsApp"
                                >
                                  {picInfo.contact}
                                </a>
                              </div>
                            )}

                            {picInfo.registeredByName && (
                              <div className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 pt-0.5 border-t border-slate-100 dark:border-slate-800/80">
                                <span>Didata KKN:</span>
                                <span className="font-medium text-slate-600 dark:text-slate-300 truncate max-w-[130px]">
                                  {picInfo.registeredByName}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* 5. Kolom Wilayah & Koordinat */}
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <MapPin size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                {item.rw?.name ? (item.rw.name.startsWith("RW") || item.rw.name.startsWith("Kel.") ? item.rw.name : `RW ${item.rw.name}`) : "Wilayah Coblong"}
                              </span>
                            </div>

                            {item.alamat && (
                              <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug line-clamp-2">
                                {item.alamat}
                              </p>
                            )}

                            {hasValidCoords && (
                              <div className="flex items-center gap-1.5 pt-0.5">
                                <button
                                  type="button"
                                  onClick={() => handleCopyCoordinate(item.id, latNum, lngNum)}
                                  className="inline-flex items-center gap-1 text-[10.5px] font-mono text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer transition"
                                  title="Salin Koordinat GPS"
                                >
                                  {copiedCoordId === item.id ? (
                                    <Check size={11} className="text-emerald-600" />
                                  ) : (
                                    <Copy size={11} />
                                  )}
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
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                            <Clock size={11} className="shrink-0" />
                            <span>
                              {new Date(item.createdAt).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })} WIB
                            </span>
                          </div>
                        </td>

                        {/* 7. Kolom Aksi */}
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          {hasValidCoords ? (
                            <button
                              type="button"
                              onClick={() => handleViewOnMap(latNum, lngNum)}
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 text-[#009966] dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-800/80 transition active:scale-95 cursor-pointer shadow-2xs"
                              title="Tampilkan lokasi titik ini di peta GIS"
                            >
                              <MapPin size={13} />
                              <span>Peta</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">-</span>
                          )}
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
          )}

          {/* Paginasi */}
          {!loading && filteredItems.length > 0 && (
            <div className="border-t border-slate-200 dark:border-slate-800 p-2 sm:p-3 bg-slate-50/40 dark:bg-slate-800/20">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredItems.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
                itemsPerPageOptions={[10, 25, 50, 100]}
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
            {/* Header Modal */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
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

            {/* Gambar Besar */}
            <div className="p-4 bg-slate-950 flex items-center justify-center max-h-[70vh] overflow-hidden">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-h-[65vh] max-w-full object-contain rounded-lg shadow-md"
              />
            </div>

            {/* Footer Modal */}
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

    </div>
  );
};

export default PemanfaatanSampah;
