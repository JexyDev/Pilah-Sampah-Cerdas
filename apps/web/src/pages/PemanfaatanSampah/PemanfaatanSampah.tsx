import React, { useState, useEffect, useMemo } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  Polygon
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
  Sparkles,
  X
} from "lucide-react";
import api from "../../services/api";
import showToast from "../../utils/showToast";
import { Pagination } from "../../components/common/Pagination";
import PageHeader from "../../components/common/PageHeader";
import { ThemeTileLayer } from "../../components/common/ThemeTileLayer";
import { createFacilityIcon, KELURAHAN_GEODATA } from "../../constants/coblongGeoData";

interface FacilityItem {
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

export const PemanfaatanSampah: React.FC = () => {
  const [items, setItems] = useState<FacilityItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJenis, setSelectedJenis] = useState("ALL");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const [facRes, poskoRes] = await Promise.allSettled([
        api.get("/facilities"),
        api.get("/posko-kkn"),
      ]);

      let facilityList: FacilityItem[] = [];
      if (facRes.status === "fulfilled") {
        facilityList = facRes.value.data.data || [];
      }

      let poskoList: FacilityItem[] = [];
      if (poskoRes.status === "fulfilled") {
        const rawPosko = poskoRes.value.data.data || [];
        poskoList = rawPosko.map((p: any) => ({
          id: p.id,
          nama: p.nama || `Posko ${p.kelompok?.name || "KKN"}`,
          jenis: "posko_kkn",
          pic: p.kelompok?.students?.find((s: any) => s.isKetua)?.user?.name || p.kelompok?.dpl?.name || "Ketua Kelompok KKN",
          kontak: p.kelompok?.students?.find((s: any) => s.isKetua)?.user?.phone || "-",
          alamat: p.alamat || `Kel. ${p.kelompok?.kelurahan || "-"}`,
          latitude: p.latitude,
          longitude: p.longitude,
          foto: p.fotoUrl || undefined,
          createdAt: p.createdAt || new Date().toISOString(),
          rw: {
            id: 0,
            name: p.kelompok?.kelurahan ? `Kel. ${p.kelompok.kelurahan}` : "Posko KKN",
          },
        }));
      }

      setItems([...facilityList, ...poskoList]);
    } catch (err: any) {
      showToast.error(err.response?.data?.message || "Gagal memuat data fasilitas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Metrik Penghitungan Fasilitas
  const metrics = useMemo(() => {
    const total = items.length;
    const posko = items.filter((i) => i.jenis === "posko_kkn" || i.jenis === "posko").length;
    const buruanSae = items.filter((i) => i.jenis === "buruan_sae").length;
    const organik = items.filter((i) => ["loseda", "bata_terawang", "rumah_maggot", "poc"].includes(i.jenis)).length;
    const bankSampah = items.filter((i) => i.jenis === "bank_sampah").length;
    const tps = items.filter((i) => i.jenis === "tps").length;

    return { total, posko, buruanSae, organik, bankSampah, tps };
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
      const matchSearch =
        !q ||
        (item.nama || "").toLowerCase().includes(q) ||
        (item.pic || "").toLowerCase().includes(q) ||
        (item.jenis || "").toLowerCase().includes(q) ||
        (item.kontak || "").toLowerCase().includes(q) ||
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

  return (
    <div className="pb-24 lg:pb-8">
      <PageHeader
        title="Fasilitas & Posko KKN"
        description="Pemetaan dan inventarisasi fasilitas pengolahan sampah, inovasi daur ulang warga (Buruan Sae, Bank Sampah, Loseda, Bata Terawang, Rumah Maggot, TPS) serta lokasi Posko Mahasiswa KKN."
        icon={Sprout}
      />

      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
        
        {/* ========================================================================= */}
        {/* 1. CARD JUMLAH FASILITAS (METRIC & QUICK FILTER CARDS)                    */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          
          {/* Card 1: Semua Fasilitas */}
          <button
            type="button"
            onClick={() => handleCardFilterClick("ALL")}
            className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden group ${
              selectedJenis === "ALL"
                ? "bg-emerald-900 text-white border-emerald-800 shadow-md scale-[1.02] ring-2 ring-emerald-500"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-400 hover:shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[11px] font-black uppercase tracking-wider ${selectedJenis === "ALL" ? "text-emerald-200" : "text-slate-500 dark:text-slate-400"}`}>
                Semua Data
              </span>
              <Layers size={17} className={selectedJenis === "ALL" ? "text-emerald-300" : "text-emerald-600 dark:text-emerald-400"} />
            </div>
            <div className={`text-2xl font-extrabold tracking-tight ${selectedJenis === "ALL" ? "text-white" : "text-slate-900 dark:text-white"}`}>
              {metrics.total}
            </div>
            <p className={`text-[11px] font-medium mt-1 truncate ${selectedJenis === "ALL" ? "text-emerald-100" : "text-slate-500 dark:text-slate-400"}`}>
              Titik Terdata
            </p>
          </button>

          {/* Card 2: Posko KKN */}
          <button
            type="button"
            onClick={() => handleCardFilterClick("posko_kkn")}
            className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden group ${
              selectedJenis === "posko_kkn"
                ? "bg-indigo-900 text-white border-indigo-800 shadow-md scale-[1.02] ring-2 ring-indigo-500"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-400 hover:shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[11px] font-black uppercase tracking-wider ${selectedJenis === "posko_kkn" ? "text-indigo-200" : "text-slate-500 dark:text-slate-400"}`}>
                Posko KKN
              </span>
              <GraduationCap size={17} className={selectedJenis === "posko_kkn" ? "text-indigo-300" : "text-indigo-600 dark:text-indigo-400"} />
            </div>
            <div className={`text-2xl font-extrabold tracking-tight ${selectedJenis === "posko_kkn" ? "text-white" : "text-indigo-600 dark:text-indigo-400"}`}>
              {metrics.posko}
            </div>
            <p className={`text-[11px] font-medium mt-1 truncate ${selectedJenis === "posko_kkn" ? "text-indigo-100" : "text-slate-500 dark:text-slate-400"}`}>
              Posko Mahasiswa
            </p>
          </button>

          {/* Card 3: Buruan Sae */}
          <button
            type="button"
            onClick={() => handleCardFilterClick("buruan_sae")}
            className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden group ${
              selectedJenis === "buruan_sae"
                ? "bg-lime-900 text-white border-lime-800 shadow-md scale-[1.02] ring-2 ring-lime-500"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-lime-400 hover:shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[11px] font-black uppercase tracking-wider ${selectedJenis === "buruan_sae" ? "text-lime-200" : "text-slate-500 dark:text-slate-400"}`}>
                Buruan Sae
              </span>
              <Leaf size={17} className={selectedJenis === "buruan_sae" ? "text-lime-300" : "text-lime-600 dark:text-lime-400"} />
            </div>
            <div className={`text-2xl font-extrabold tracking-tight ${selectedJenis === "buruan_sae" ? "text-white" : "text-lime-700 dark:text-lime-400"}`}>
              {metrics.buruanSae}
            </div>
            <p className={`text-[11px] font-medium mt-1 truncate ${selectedJenis === "buruan_sae" ? "text-lime-100" : "text-slate-500 dark:text-slate-400"}`}>
              Kebun Urban Warga
            </p>
          </button>

          {/* Card 4: Inovasi Organik */}
          <button
            type="button"
            onClick={() => handleCardFilterClick("organik_group")}
            className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden group ${
              selectedJenis === "organik_group"
                ? "bg-emerald-900 text-white border-emerald-800 shadow-md scale-[1.02] ring-2 ring-emerald-500"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-400 hover:shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[11px] font-black uppercase tracking-wider ${selectedJenis === "organik_group" ? "text-emerald-200" : "text-slate-500 dark:text-slate-400"}`}>
                Inovasi Organik
              </span>
              <Recycle size={17} className={selectedJenis === "organik_group" ? "text-emerald-300" : "text-emerald-600 dark:text-emerald-400"} />
            </div>
            <div className={`text-2xl font-extrabold tracking-tight ${selectedJenis === "organik_group" ? "text-white" : "text-emerald-600 dark:text-emerald-400"}`}>
              {metrics.organik}
            </div>
            <p className={`text-[11px] font-medium mt-1 truncate ${selectedJenis === "organik_group" ? "text-emerald-100" : "text-slate-500 dark:text-slate-400"}`}>
              Loseda, Maggot, Bata
            </p>
          </button>

          {/* Card 5: Bank Sampah */}
          <button
            type="button"
            onClick={() => handleCardFilterClick("bank_sampah")}
            className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden group ${
              selectedJenis === "bank_sampah"
                ? "bg-blue-900 text-white border-blue-800 shadow-md scale-[1.02] ring-2 ring-blue-500"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-400 hover:shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[11px] font-black uppercase tracking-wider ${selectedJenis === "bank_sampah" ? "text-blue-200" : "text-slate-500 dark:text-slate-400"}`}>
                Bank Sampah
              </span>
              <Coins size={17} className={selectedJenis === "bank_sampah" ? "text-blue-300" : "text-blue-600 dark:text-blue-400"} />
            </div>
            <div className={`text-2xl font-extrabold tracking-tight ${selectedJenis === "bank_sampah" ? "text-white" : "text-blue-600 dark:text-blue-400"}`}>
              {metrics.bankSampah}
            </div>
            <p className={`text-[11px] font-medium mt-1 truncate ${selectedJenis === "bank_sampah" ? "text-blue-100" : "text-slate-500 dark:text-slate-400"}`}>
              Unit Tabungan Sampah
            </p>
          </button>

          {/* Card 6: TPS (Tempat Penampungan Sementara) */}
          <button
            type="button"
            onClick={() => handleCardFilterClick("tps")}
            className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden group ${
              selectedJenis === "tps"
                ? "bg-slate-900 text-white border-slate-800 shadow-md scale-[1.02] ring-2 ring-slate-400"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-400 hover:shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[11px] font-black uppercase tracking-wider ${selectedJenis === "tps" ? "text-slate-300" : "text-slate-500 dark:text-slate-400"}`}>
                TPS
              </span>
              <Trash2 size={17} className={selectedJenis === "tps" ? "text-slate-300" : "text-slate-600 dark:text-slate-400"} />
            </div>
            <div className={`text-2xl font-extrabold tracking-tight ${selectedJenis === "tps" ? "text-white" : "text-slate-800 dark:text-slate-200"}`}>
              {metrics.tps}
            </div>
            <p className={`text-[11px] font-medium mt-1 truncate ${selectedJenis === "tps" ? "text-slate-300" : "text-slate-500 dark:text-slate-400"}`}>
              Tempat Penampungan
            </p>
          </button>

        </div>

        {/* ========================================================================= */}
        {/* 2. PETA GIS INTERAKTIF (DENGAN LEGENDA LENGKAP TERMASUK BURUAN SAE)       */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-3 relative overflow-hidden">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-2 py-1 mb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                <MapPin size={16} />
              </span>
              <div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  Peta Sebaran Fasilitas & Posko KKN
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
                  {/* Fasilitas & Posko */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                      Fasilitas & Posko KKN
                    </span>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-xs bg-[#4f46e5] shrink-0" />
                        <span className="font-bold text-slate-700 dark:text-slate-300 truncate">Posko KKN</span>
                      </div>
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
                if (isNaN(latNum) || isNaN(lngNum)) return null;
                const icon = createFacilityIcon(fac.jenis, fac.nama);
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
                        {fac.foto && (
                          <img src={fac.foto} alt={fac.nama} className="w-full h-24 object-cover rounded-lg mb-2 shadow-xs" />
                        )}
                        <div className="space-y-1 text-xs text-slate-700 border-t border-slate-100 pt-1.5">
                          <p><strong className="text-slate-900">PIC:</strong> {fac.pic}</p>
                          {fac.kontak && fac.kontak !== "-" && (
                            <p><strong className="text-slate-900">Kontak:</strong> {fac.kontak}</p>
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
        {/* 3. TABEL DATA INVENTARIS FASILITAS & POSKO (TERPADU SATU HALAMAN)          */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-0">
          
          {/* Toolbar Pencarian & Filter */}
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-3 md:items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-[#009966] dark:text-emerald-400">
                <Sparkles size={18} />
              </span>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                  Daftar Inventaris Fasilitas & Posko KKN
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Menampilkan {filteredItems.length} fasilitas terdata
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto">
              <div className="relative min-w-[240px] flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Cari fasilitas, PIC, atau wilayah..."
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
                <option value="posko_kkn">Posko KKN</option>
                <option value="buruan_sae">Buruan Sae</option>
                <option value="bank_sampah">Bank Sampah</option>
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
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="p-4">Fasilitas / Posko</th>
                    <th className="p-4">Jenis</th>
                    <th className="p-4">Penanggung Jawab (PIC)</th>
                    <th className="p-4">Wilayah & Koordinat</th>
                    <th className="p-4">Waktu Terdaftar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
                  {paginatedItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {item.foto ? (
                            <img
                              src={item.foto}
                              alt={item.nama}
                              className="w-11 h-11 rounded-xl object-cover bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                              <Sprout size={20} />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                              {item.nama}
                            </p>
                            {item.alamat && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                {item.alamat}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-[10.5px] font-bold border ${getFacilityBadgeClass(item.jenis)}`}>
                          {formatFacilityTypeLabel(item.jenis)}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          {item.pic}
                        </p>
                        {item.kontak && item.kontak !== "-" && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone size={11} className="shrink-0 text-slate-400" /> {item.kontak}
                          </p>
                        )}
                      </td>
                      <td className="p-4">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <MapPin size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                          {item.rw?.name || item.alamat || "-"}
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                          {Number(item.latitude).toFixed(5)}, {Number(item.longitude).toFixed(5)}
                        </p>
                      </td>
                      <td className="p-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                        {new Date(item.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                        <span className="block text-[10.5px] text-slate-400 dark:text-slate-500 mt-0.5">
                          {new Date(item.createdAt).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })} WIB
                        </span>
                      </td>
                    </tr>
                  ))}

                  {paginatedItems.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-slate-500 dark:text-slate-400">
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
            <div className="border-t border-slate-200 dark:border-slate-800 p-2 sm:p-3">
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
    </div>
  );
};

export default PemanfaatanSampah;
