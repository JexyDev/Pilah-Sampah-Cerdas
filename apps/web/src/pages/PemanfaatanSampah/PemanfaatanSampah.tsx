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
  CheckCircle,
  Clock,
  Map as MapIcon,
  List as ListIcon,
  Sprout
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
  statusApproval: string;
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

export const PemanfaatanSampah: React.FC = () => {
  const [items, setItems] = useState<FacilityItem[]>([]);
  const [loading, setLoading] = useState(true);

  // View mode
  const [viewMode, setViewMode] = useState<"MAP" | "TABLE">("TABLE");

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJenis, setSelectedJenis] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

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
          statusApproval: "APPROVED",
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

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        (item.nama || "").toLowerCase().includes(q) ||
        (item.pic || "").toLowerCase().includes(q) ||
        (item.jenis || "").toLowerCase().includes(q);

      const matchJenis = selectedJenis === "ALL" || item.jenis === selectedJenis;
      const matchStatus = selectedStatus === "ALL" || item.statusApproval === selectedStatus;

      return matchSearch && matchJenis && matchStatus;
    });
  }, [items, searchQuery, selectedJenis, selectedStatus]);

  // Pagination logic
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle size={12} /> Disetujui
          </span>
        );
      case "PENDING":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock size={12} /> Menunggu Verifikasi
          </span>
        );
    }
  };

  return (
    <div className="pb-24 lg:pb-8">
      <PageHeader
        title="Inovasi & Posko KKN"
        description="Pemetaan fasilitas pengolahan sampah, inovasi daur ulang warga (Bata Terawang, Loseda, Rumah Maggot, TPS, dll) serta lokasi Posko KKN."
        icon={Sprout}
      />

      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
        
        {/* Toolbar: View Toggle, Search & Filter */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col xl:flex-row gap-4 xl:items-center">
          
          {/* View Mode Toggle */}
          <div className="flex bg-slate-100/80 p-1.5 rounded-xl w-full xl:w-fit border border-slate-200/60 shadow-inner shrink-0">
            <button
              onClick={() => setViewMode("TABLE")}
              className={`flex-1 xl:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                viewMode === "TABLE" 
                  ? "bg-white text-[#009966] shadow-sm ring-1 ring-black/5" 
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/60"
              }`}
            >
              <ListIcon size={18} /> Tabel Data
            </button>
            <button
              onClick={() => setViewMode("MAP")}
              className={`flex-1 xl:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                viewMode === "MAP" 
                  ? "bg-white text-[#009966] shadow-sm ring-1 ring-black/5" 
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/60"
              }`}
            >
              <MapIcon size={18} /> Peta GIS
            </button>
          </div>

          <div className="h-px xl:h-8 w-full xl:w-px bg-slate-200 hidden xl:block"></div>

          <div className="flex-1 flex flex-col sm:flex-row gap-3 w-full">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Cari fasilitas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-[#009966] focus:ring-4 focus:ring-[#009966]/10 transition-all"
              />
            </div>
            <select
              value={selectedJenis}
              onChange={(e) => setSelectedJenis(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-[#009966] focus:ring-4 focus:ring-[#009966]/10 transition-all cursor-pointer"
            >
              <option value="ALL">Semua Jenis</option>
              <option value="posko_kkn">Posko KKN</option>
              <option value="loseda">Loseda</option>
              <option value="bata_terawang">Bata Terawang</option>
              <option value="rumah_maggot">Rumah Maggot</option>
              <option value="bank_sampah">Bank Sampah</option>
              <option value="tps">TPS</option>
              <option value="buruan_sae">Buruan Sae</option>
              <option value="poc">POC</option>
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-[#009966] focus:ring-4 focus:ring-[#009966]/10 transition-all cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="APPROVED">Disetujui</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
            <Loader2 size={40} className="text-[#009966] animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Memuat data fasilitas...</p>
          </div>
        ) : viewMode === "MAP" ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2 overflow-hidden h-[600px] relative z-0">
            {/* Legenda Monitoring Floating Card */}
            <div className="absolute top-4 right-4 z-[999]">
              <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 flex flex-col gap-3 min-w-[250px]">
                <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider">
                    Legenda Monitoring
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider block">
                      Fasilitas & Posko KKN
                    </span>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[10.5px]">
                      <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-[#4f46e5] shrink-0" /><span className="font-bold text-slate-700 truncate">Posko KKN</span></div>
                      <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-green-600 shrink-0" /><span className="font-bold text-slate-700 truncate">Bata Terawang</span></div>
                      <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 shrink-0" /><span className="font-bold text-slate-700 truncate">Loseda</span></div>
                      <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-amber-600 shrink-0" /><span className="font-bold text-slate-700 truncate">Rumah Maggot</span></div>
                      <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-blue-600 shrink-0" /><span className="font-bold text-slate-700 truncate">Bank Sampah</span></div>
                      <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-teal-600 shrink-0" /><span className="font-bold text-slate-700 truncate">TPS</span></div>
                    </div>
                  </div>
                  <div className="space-y-1.5 border-t border-slate-100 pt-2">
                    <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider block">
                      Batas Kelurahan Terdata
                    </span>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[10.5px]">
                      <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-[#10b981]" /><span className="font-bold text-slate-700">Dago</span></div>
                      <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-[#f43f5e]" /><span className="font-bold text-slate-700">Lebak Siliwangi</span></div>
                      <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-[#8b5cf6]" /><span className="font-bold text-slate-700">Lebak Gede</span></div>
                      <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-[#f59e0b]" /><span className="font-bold text-slate-700">Sekeloa</span></div>
                      <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-[#ec4899]" /><span className="font-bold text-slate-700">Sadang Serang</span></div>
                      <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-[#06b6d4]" /><span className="font-bold text-slate-700">Cipaganti</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <MapContainer
              center={[-6.8903, 107.611]}
              zoom={14}
              style={{ height: '100%', width: '100%', borderRadius: '12px' }}
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
                    weight: 3,
                    fillColor: kg.color,
                    fillOpacity: 0.1,
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
                      <div className="p-1 min-w-[200px]">
                        <h3 className="font-bold text-slate-800 text-sm mb-1">{fac.nama}</h3>
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">{fac.jenis.replace("_", " ")}</p>
                        {fac.foto && (
                          <img src={fac.foto} alt={fac.nama} className="w-full h-24 object-cover rounded-lg mb-2" />
                        )}
                        <div className="space-y-1 text-xs">
                          <p><strong>PIC:</strong> {fac.pic}</p>
                          <p><strong>Lokasi:</strong> {fac.rw?.name || "-"}</p>
                          <div className="mt-2">{getStatusBadge(fac.statusApproval)}</div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
                    <th className="p-4 font-bold">Fasilitas</th>
                    <th className="p-4 font-bold">PIC & RW</th>
                    <th className="p-4 font-bold">Koordinat</th>
                    <th className="p-4 font-bold">Terdaftar Pada</th>
                    <th className="p-4 font-bold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedItems.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {item.foto ? (
                            <img src={item.foto} alt="foto" className="w-12 h-12 rounded-lg object-cover bg-slate-100" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                              <Sprout size={20} />
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{item.nama}</p>
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{item.jenis.replace("_", " ")}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm">
                        <p className="font-bold text-slate-700">{item.pic}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><MapPin size={12}/> {item.rw?.name || "-"}</p>
                      </td>
                      <td className="p-4 text-sm text-slate-600 font-mono text-xs">
                        {Number(item.latitude).toFixed(5)}, {Number(item.longitude).toFixed(5)}
                      </td>
                      <td className="p-4 text-sm text-slate-500">
                        {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        <span className="block text-[10px] mt-0.5 opacity-80">{new Date(item.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
                      </td>
                      <td className="p-4 text-center">
                        {getStatusBadge(item.statusApproval)}
                      </td>
                    </tr>
                  ))}
                  {paginatedItems.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        Tidak ada fasilitas yang ditemukan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {filteredItems.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredItems.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
                itemsPerPageOptions={[10, 25, 50, 100]}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PemanfaatanSampah;
