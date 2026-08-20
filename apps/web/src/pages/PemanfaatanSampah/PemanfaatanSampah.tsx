import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  Tooltip
} from "react-leaflet";
import L from "leaflet";
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
import { useAuthStore } from "../../store/useAuthStore";
import { Pagination } from "../../components/common/Pagination";
import PageHeader from "../../components/common/PageHeader";
import { ThemeTileLayer } from "../../components/common/ThemeTileLayer";
import { createFacilityIcon } from "../../constants/coblongGeoData";

interface FacilityItem {
  id: string;
  nama: string;
  jenis: string;
  pic: string;
  kontak: string;
  alamat?: string;
  kapasitas?: number;
  latitude: number;
  longitude: number;
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
  const { user } = useAuthStore();
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
  const mapContainerRef = useRef<HTMLDivElement>(null);

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
        title="Inovasi Pengolahan"
        description="Pemetaan fasilitas pengolahan sampah dan inovasi daur ulang warga (Bata Terawang, Loseda, Rumah Maggot, TPS, dll)."
        icon={Sprout}
      />

      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
        
        {/* View Mode Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-fit border border-slate-200 shadow-inner">
          <button
            onClick={() => setViewMode("TABLE")}
            className={lex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition }
          >
            <ListIcon size={16} /> Tabel Data
          </button>
          <button
            onClick={() => setViewMode("MAP")}
            className={lex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition }
          >
            <MapIcon size={16} /> Peta GIS
          </button>
        </div>

        {/* Search & Filter */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Cari fasilitas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#009966] transition"
            />
          </div>
          <select
            value={selectedJenis}
            onChange={(e) => setSelectedJenis(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-[#009966]"
          >
            <option value="ALL">Semua Jenis</option>
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
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-[#009966]"
          >
            <option value="ALL">Semua Status</option>
            <option value="APPROVED">Disetujui</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
            <Loader2 size={40} className="text-[#009966] animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Memuat data fasilitas...</p>
          </div>
        ) : viewMode === "MAP" ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2 overflow-hidden h-[600px] relative z-0">
            <MapContainer
              center={[-6.8903, 107.611]}
              zoom={15}
              style={{ height: '100%', width: '100%', borderRadius: '12px' }}
              className="z-0"
            >
              <ThemeTileLayer />
              {filteredItems.map(fac => {
                if (!fac.latitude || !fac.longitude) return null;
                const icon = createFacilityIcon(fac.jenis, fac.nama);
                return (
                  <Marker key={fac.id} position={[fac.latitude, fac.longitude]} icon={icon}>
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
                        {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}
                      </td>
                      <td className="p-4 text-center">
                        {getStatusBadge(item.statusApproval)}
                      </td>
                    </tr>
                  ))}
                  {paginatedItems.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-500">
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
