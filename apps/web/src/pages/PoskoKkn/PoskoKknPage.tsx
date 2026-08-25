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
  GraduationCap,
  Users,
  Building2,
  UserCheck,
  Phone,
  X,
  ExternalLink,
  Copy,
  Check,
  Eye,
  Compass,
  Sparkles
} from "lucide-react";
import L from "leaflet";
import api from "../../services/api";
import showToast from "../../utils/showToast";
import { Pagination } from "../../components/common/Pagination";
import PageHeader from "../../components/common/PageHeader";
import { ThemeTileLayer } from "../../components/common/ThemeTileLayer";
import { KELURAHAN_GEODATA } from "../../constants/coblongGeoData";
import { resolveImageUrl } from "../../utils/imageUrl";

export interface PoskoItem {
  id: string;
  nama: string;
  alamat?: string;
  kelompokId?: string;
  kelompokName: string;
  kelurahan: string;
  rwName: string;
  latitude: number | string;
  longitude: number | string;
  foto?: string | null;
  pic: string;
  kontak: string;
  dplName: string;
  totalAnggota: number;
  statusApproval: string;
  createdAt: string;
}

// Custom Marker Pin Icon untuk Posko KKN (Indigo Theme)
const createPoskoMarkerIcon = (nama?: string) => {
  return L.divIcon({
    className: "custom-posko-icon",
    html: `
      <div title="${nama || "Posko KKN"}" style="background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%); width: 32px; height: 32px; border-radius: 10px; border: 2.5px solid white; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.45); display: flex; align-items: center; justify-content: center; color: white; cursor: pointer; transition: transform 0.15s ease;">
        <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/>
          <path d="M22 10v6"/>
          <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
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

export const PoskoKknPage: React.FC = () => {
  const [items, setItems] = useState<PoskoItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKelurahan, setSelectedKelurahan] = useState("ALL");

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

  const fetchPoskoList = async () => {
    setLoading(true);
    try {
      const res = await api.get("/kkn/posko");
      setItems(res.data.data || []);
    } catch (err: any) {
      showToast.error(err.response?.data?.message || "Gagal memuat data Posko KKN");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPoskoList();
  }, []);

  // Metrik Penghitungan Posko
  const metrics = useMemo(() => {
    const total = items.length;
    const verified = items.filter((i) => i.statusApproval === "APPROVED").length;
    const totalMahasiswa = items.reduce((acc, curr) => acc + (curr.totalAnggota || 0), 0);
    const dplSet = new Set(items.map((i) => i.dplName).filter((d) => d && !d.includes("Belum")));
    const totalDpl = dplSet.size;

    return { total, verified, totalMahasiswa, totalDpl };
  }, [items]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (item.nama || "").toLowerCase().includes(q) ||
        (item.kelompokName || "").toLowerCase().includes(q) ||
        (item.pic || "").toLowerCase().includes(q) ||
        (item.dplName || "").toLowerCase().includes(q) ||
        (item.alamat || "").toLowerCase().includes(q) ||
        (item.kelurahan || "").toLowerCase().includes(q) ||
        (item.rwName || "").toLowerCase().includes(q);

      let matchKelurahan = true;
      if (selectedKelurahan !== "ALL") {
        matchKelurahan = (item.kelurahan || "").toLowerCase().includes(selectedKelurahan.toLowerCase());
      }

      return matchSearch && matchKelurahan;
    });
  }, [items, searchQuery, selectedKelurahan]);

  // Reset pagination on search/filter
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedKelurahan, itemsPerPage]);

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
      showToast.error("Koordinat GPS posko tidak valid");
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
        title="Posko KKN Mahasiswa"
        description="Direktori pangkalan posko kegiatan mahasiswa KKN, kelompok binaan, dosen pembimbing lapangan (DPL), dan titik koordinat GPS di wilayah Kecamatan Coblong."
        icon={GraduationCap}
      />

      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
        
        {/* ========================================================================= */}
        {/* 1. METRIC STATS CARDS (CLEAN & MODERN)                                    */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Total Posko */}
          <div className="p-4 sm:p-5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between w-full mb-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                Total Posko KKN
              </span>
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Building2 size={18} />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                {metrics.total}
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 truncate">
                Pangkalan Basecamp Mahasiswa
              </p>
            </div>
          </div>

          {/* Card 2: Posko Terverifikasi */}
          <div className="p-4 sm:p-5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between w-full mb-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Status Terverifikasi
              </span>
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <UserCheck size={18} />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                {metrics.verified} <span className="text-sm font-bold text-slate-400">/ {metrics.total}</span>
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 truncate">
                Disetujui Wilayah Setempat
              </p>
            </div>
          </div>

          {/* Card 3: Total Mahasiswa */}
          <div className="p-4 sm:p-5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between w-full mb-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                Mahasiswa Terdata
              </span>
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <Users size={18} />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                {metrics.totalMahasiswa > 0 ? metrics.totalMahasiswa : "-"}
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 truncate">
                Anggota di Seluruh Kelompok
              </p>
            </div>
          </div>

          {/* Card 4: DPL Pendamping */}
          <div className="p-4 sm:p-5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between w-full mb-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                DPL Pembimbing
              </span>
              <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                <Sparkles size={18} />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                {metrics.totalDpl > 0 ? metrics.totalDpl : "-"}
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 truncate">
                Dosen Pembimbing Aktif
              </p>
            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* 2. PETA SEBARAN POSKO KKN (LEAFLET GIS INTERAKTIF DENGAN POLIGON COBLONG) */}
        {/* ========================================================================= */}
        <div ref={mapSectionRef} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-3 relative overflow-hidden">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-2 py-1 mb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                <Compass size={16} />
              </span>
              <div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  Peta Sebaran Posko KKN Mahasiswa
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Kecamatan Coblong, Kota Bandung ({filteredItems.length} posko aktif)
                </p>
              </div>
            </div>

            {selectedKelurahan !== "ALL" && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-700">
                  Filter Kelurahan: {selectedKelurahan}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedKelurahan("ALL")}
                  className="text-xs text-slate-500 hover:text-rose-600 flex items-center gap-1 font-medium transition cursor-pointer"
                >
                  <X size={13} /> Reset Filter
                </button>
              </div>
            )}
          </div>

          <div className="relative rounded-xl overflow-hidden h-[440px] sm:h-[480px] z-0 border border-slate-200/80 dark:border-slate-800">
            {/* Floating Legend */}
            <div className="absolute top-3 right-3 z-[999] max-w-[260px] pointer-events-auto">
              <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xl rounded-xl p-3 border border-slate-200 dark:border-slate-800 flex flex-col gap-2.5">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                    <span className="text-[10.5px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                      Legenda Peta Posko
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-[10px]">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-md bg-indigo-600 border border-white flex items-center justify-center text-white shrink-0">
                      <GraduationCap size={10} />
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Posko Mahasiswa KKN</span>
                  </div>

                  <div className="space-y-1 border-t border-slate-100 dark:border-slate-800 pt-1.5">
                    <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                      6 Kelurahan Coblong
                    </span>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1">
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

              {/* Poligon Batas 6 Kelurahan Coblong */}
              {Object.values(KELURAHAN_GEODATA).map((kel) => (
                <Polygon
                  key={kel.id}
                  positions={kel.bounds}
                  pathOptions={{
                    color: kel.color,
                    weight: 2,
                    opacity: 0.8,
                    fillColor: kel.color,
                    fillOpacity: 0.08,
                    dashArray: "4, 4"
                  }}
                >
                  <Popup>
                    <div className="p-1.5 text-xs">
                      <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: kel.color }} />
                        Kelurahan {kel.name}
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Kecamatan Coblong, Kota Bandung ({kel.rwCount} RW)
                      </p>
                    </div>
                  </Popup>
                </Polygon>
              ))}

              {/* Marker Posko KKN */}
              {filteredItems.map((item) => {
                const latNum = Number(item.latitude);
                const lngNum = Number(item.longitude);
                if (isNaN(latNum) || isNaN(lngNum) || latNum === 0 || lngNum === 0) return null;

                const resolvedFoto = resolveImageUrl(item.foto);
                const isApproved = item.statusApproval === "APPROVED";

                return (
                  <Marker
                    key={item.id}
                    position={[latNum, lngNum]}
                    icon={createPoskoMarkerIcon(item.nama)}
                  >
                    <Popup maxWidth={320} className="custom-facility-popup">
                      <div className="p-2 space-y-2.5 text-xs text-slate-800 dark:text-slate-100">
                        {resolvedFoto && (
                          <div 
                            className="relative w-full h-32 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer group"
                            onClick={() => setPreviewImage({ url: resolvedFoto, title: item.nama, subtitle: item.alamat })}
                          >
                            <img
                              src={resolvedFoto}
                              alt={item.nama}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                              <Eye size={16} />
                            </div>
                          </div>
                        )}

                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200">
                              Posko KKN
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              isApproved ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300" : "bg-amber-100 text-amber-800"
                            }`}>
                              {isApproved ? "Aktif & Terverifikasi" : "Menunggu Approval"}
                            </span>
                          </div>
                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 leading-tight">
                            {item.nama}
                          </h4>
                          <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                            {item.kelompokName}
                          </p>
                        </div>

                        <div className="space-y-1.5 text-[11px] border-t border-slate-100 dark:border-slate-800 pt-2">
                          <div className="flex items-start gap-1.5 text-slate-600 dark:text-slate-300">
                            <GraduationCap size={13} className="shrink-0 mt-0.5 text-indigo-500" />
                            <span><strong className="text-slate-800 dark:text-slate-200">Ketua Posko:</strong> {item.pic}</span>
                          </div>

                          <div className="flex items-start gap-1.5 text-slate-600 dark:text-slate-300">
                            <Sparkles size={13} className="shrink-0 mt-0.5 text-purple-500" />
                            <span><strong className="text-slate-800 dark:text-slate-200">DPL:</strong> {item.dplName}</span>
                          </div>

                          <div className="flex items-start gap-1.5 text-slate-600 dark:text-slate-300">
                            <MapPin size={13} className="shrink-0 mt-0.5 text-emerald-500" />
                            <span className="line-clamp-2">{item.alamat || `Kel. ${item.kelurahan}`}</span>
                          </div>
                        </div>

                        {item.kontak && item.kontak !== "-" && (
                          <div className="pt-1">
                            <a
                              href={`https://wa.me/${item.kontak.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition"
                            >
                              <Phone size={12} /> Hubungi Ketua Posko (WhatsApp)
                            </a>
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. TABEL DIREKTORI POSKO KKN                                              */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-0">
          
          {/* Toolbar Pencarian & Filter */}
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-3 md:items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
                <GraduationCap size={18} />
              </span>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                  Daftar Direktori Posko KKN Mahasiswa
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Menampilkan {filteredItems.length} posko terdata di Kecamatan Coblong
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto">
              <div className="relative min-w-[240px] flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Cari posko, kelompok, ketua, DPL..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 text-slate-800 dark:text-slate-100 placeholder-slate-400 transition-all"
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
                value={selectedKelurahan}
                onChange={(e) => setSelectedKelurahan(e.target.value)}
                className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 text-slate-800 dark:text-slate-100 transition-all cursor-pointer"
              >
                <option value="ALL">Semua Kelurahan</option>
                <option value="Dago">Kel. Dago</option>
                <option value="Cipaganti">Kel. Cipaganti</option>
                <option value="Sekeloa">Kel. Sekeloa</option>
                <option value="Sadang Serang">Kel. Sadang Serang</option>
                <option value="Lebak Gede">Kel. Lebak Gede</option>
                <option value="Lebak Siliwangi">Kel. Lebak Siliwangi</option>
              </select>
            </div>
          </div>

          {/* Konten Tabel */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 size={36} className="text-indigo-600 animate-spin mb-3" />
              <p className="text-slate-500 text-sm font-medium">Memuat data posko KKN...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[960px]">
                <thead>
                  <tr className="bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80 text-[11px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-12 text-center">No</th>
                    <th className="py-3.5 px-4 min-w-[240px]">Foto &amp; Nama Posko</th>
                    <th className="py-3.5 px-4 min-w-[180px]">Kelompok KKN</th>
                    <th className="py-3.5 px-4 min-w-[200px]">Ketua Posko (PIC)</th>
                    <th className="py-3.5 px-4 min-w-[180px]">DPL Pendamping</th>
                    <th className="py-3.5 px-4 min-w-[220px]">Wilayah &amp; Koordinat</th>
                    <th className="py-3.5 px-4 w-28 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
                  {paginatedItems.map((item, index) => {
                    const resolvedFoto = resolveImageUrl(item.foto);
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

                        {/* 2. Kolom Foto & Nama Posko */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3.5">
                            {resolvedFoto ? (
                              <div 
                                className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 group/img cursor-pointer shadow-2xs"
                                onClick={() => setPreviewImage({ 
                                  url: resolvedFoto, 
                                  title: item.nama, 
                                  subtitle: item.alamat || item.kelompokName 
                                })}
                                title="Klik untuk memperbesar foto"
                              >
                                <img
                                  src={resolvedFoto}
                                  alt={item.nama}
                                  className="w-full h-full object-cover group-hover/img:scale-110 transition duration-300"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = "none";
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 shadow-2xs">
                                <Building2 size={22} />
                              </div>
                            )}

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                                  {item.nama}
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800">
                                  Posko KKN
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 max-w-[260px]">
                                {item.alamat || `Kelurahan ${item.kelurahan}`}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* 3. Kolom Kelompok KKN */}
                        <td className="py-4 px-4">
                          <div className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
                            {item.kelompokName}
                          </div>
                          {item.totalAnggota > 0 && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                              <Users size={12} className="text-slate-400" />
                              <span>{item.totalAnggota} Mahasiswa</span>
                            </div>
                          )}
                        </td>

                        {/* 4. Kolom Ketua Posko & Kontak */}
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <div className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
                              {item.pic}
                            </div>
                            <span className="inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/40">
                              Ketua Kelompok
                            </span>

                            {item.kontak && item.kontak !== "-" && (
                              <div>
                                <a
                                  href={`https://wa.me/${item.kontak.replace(/\D/g, "")}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline"
                                >
                                  <Phone size={11} /> {item.kontak}
                                </a>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* 5. Kolom DPL Pendamping */}
                        <td className="py-4 px-4">
                          <div className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
                            {item.dplName}
                          </div>
                          <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                            Dosen Pembimbing
                          </span>
                        </td>

                        {/* 6. Kolom Wilayah & Koordinat */}
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <span className="font-bold text-slate-700 dark:text-slate-300 block text-xs">
                              {item.rwName && item.rwName !== "-" ? `RW ${item.rwName}` : ""} ({item.kelurahan})
                            </span>
                            
                            {hasValidCoords ? (
                              <button
                                type="button"
                                onClick={() => handleCopyCoordinate(item.id, latNum, lngNum)}
                                className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer group/btn"
                                title="Klik untuk menyalin koordinat"
                              >
                                <span>{latNum.toFixed(5)}, {lngNum.toFixed(5)}</span>
                                {copiedCoordId === item.id ? (
                                  <Check size={12} className="text-emerald-600" />
                                ) : (
                                  <Copy size={12} className="opacity-0 group-hover/btn:opacity-100 transition" />
                                )}
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">Koordinat belum diatur</span>
                            )}
                          </div>
                        </td>

                        {/* 7. Kolom Aksi */}
                        <td className="py-4 px-4 text-center">
                          {hasValidCoords ? (
                            <button
                              type="button"
                              onClick={() => handleViewOnMap(latNum, lngNum)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 dark:text-indigo-300 text-xs font-bold transition duration-200 cursor-pointer shadow-2xs"
                              title="Tampilkan titik di peta"
                            >
                              <MapPin size={13} />
                              <span>Peta</span>
                            </button>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {paginatedItems.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <GraduationCap size={32} className="text-slate-300 dark:text-slate-600" />
                          <p className="font-semibold text-sm">Tidak ada data Posko KKN yang cocok</p>
                          <p className="text-xs text-slate-400">Coba ubah kata kunci pencarian atau filter kelurahan</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {!loading && filteredItems.length > 0 && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredItems.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={(val) => {
                  setItemsPerPage(val);
                  setCurrentPage(1);
                }}
              />
            </div>
          )}

        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. LIGHTBOX IMAGE PREVIEW MODAL                                           */}
      {/* ========================================================================= */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div 
            className="relative max-w-3xl w-full bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                  {previewImage.title}
                </h3>
                {previewImage.subtitle && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {previewImage.subtitle}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="relative max-h-[70vh] bg-slate-950 flex items-center justify-center overflow-hidden">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>Pratinjau Foto Posko KKN</span>
              <a
                href={previewImage.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-semibold"
              >
                Buka Ukuran Penuh <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PoskoKknPage;
