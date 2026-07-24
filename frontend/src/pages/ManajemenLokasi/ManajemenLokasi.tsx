import { ChevronDown, Search, Loader2, MapPinPlus, X } from "lucide-react";
/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { useAuthStore } from "../../store/useAuthStore";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";

// Fix default Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom HTML DivIcon for Bins
const createMapBinIcon = (status: string) => {
  let color = "#10b981"; // default Normal
  if (status === "Sedang") color = "#f97316";
  if (status === "Penuh") color = "#ef4444";

  return L.divIcon({
    className: "custom-div-icon",
    html: `<div style="background-color: ${color}; width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
};

const createHouseIcon = () => {
  return L.divIcon({
    className: "custom-div-icon",
    html: `<div style="background-color: #3b82f6; width: 18px; height: 18px; border-radius: 4px; border: 2.5px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold;">H</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
};

const createRwZonaIcon = (rwName: string, patuh: number) => {
  let color = "#10b981"; // green
  if (patuh < 60) color = "#ef4444"; // red
  else if (patuh < 85) color = "#f97316"; // orange

  return L.divIcon({
    className: "custom-div-icon",
    html: `
      <div style="background-color: ${color}; width: 44px; height: 44px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.4); display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; font-weight: bold; line-height: 1.1;">
        <span style="font-size: 11px;">${rwName.replace("RW ", "")}</span>
        <span style="font-size: 9px; font-weight: normal;">${patuh}%</span>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
};

const MapEvents = ({ setZoom }: { setZoom: (z: number) => void }) => {
  useMapEvents({
    zoomend: (e) => {
      setZoom(e.target.getZoom());
    },
  });
  return null;
};

const MapUpdater = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.5 });
  }, [center, zoom, map]);
  return null;
};

const ManajemenLokasi: React.FC = () => {
  const { user } = useAuthStore();
  const isReadOnly = ["ADMIN_DLH", "CAMAT", "LURAH", "RT"].includes(user?.peran || "");

  const [locations, setLocations] = useState<any[]>([]);
  const [bins, setBins] = useState<any[]>([]);
  const [households, setHouseholds] = useState<any[]>([]);
  const [kelurahans, setKelurahans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKelurahan, setSelectedKelurahan] = useState("Semua Kelurahan");

  // Tambah Lokasi Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAreaName, setNewAreaName] = useState("");
  const [newAreaKelurahanId, setNewAreaKelurahanId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Map view reference
  const [mapCenter, setMapCenter] = useState<[number, number]>([-6.8903, 107.611]);
  const [mapZoom, setMapZoom] = useState<number>((user?.peran as string) === "LURAH" ? 14 : (user?.peran as string) === "RW" ? 16 : (user?.peran as string) === "RT" ? 18 : 15);

  // Group bins by household (userId or coordinates)
  const householdGroups = useMemo(() => {
    const groups: Record<string, { bins: any[]; latitude: number; longitude: number }> = {};
    bins
      .filter((b) => b.latitude && b.longitude)
      .forEach((bin) => {
        const key = bin.userId || `${bin.latitude},${bin.longitude}`;
        if (!groups[key]) {
          groups[key] = { bins: [], latitude: Number(bin.latitude), longitude: Number(bin.longitude) };
        }
        groups[key].bins.push(bin);
      });
    return Object.values(groups);
  }, [bins]);

  // Group by RW (Zona)
  const rwGroups = useMemo(() => {
    const groups: Record<string, { bins: any[]; latitude: number; longitude: number; count: number; rwName: string }> = {};
    householdGroups.forEach((hg) => {
      const firstBin = hg.bins[0];
      let rwName = "unknown";
      if (firstBin && firstBin.rtRw) {
        const nameStr = firstBin.rtRw;
        const match = nameStr.match(/RW\s*\d+/i);
        rwName = match ? match[0].toUpperCase() : nameStr;
      }
      
      const key = rwName;
      if (!groups[key]) {
        groups[key] = { bins: [], latitude: 0, longitude: 0, count: 0, rwName };
      }
      groups[key].bins.push(...hg.bins);
      groups[key].latitude += hg.latitude;
      groups[key].longitude += hg.longitude;
      groups[key].count += 1;
    });

    return Object.values(groups).map((g) => {
      const locMatch = locations.find((l) => l.rw.toUpperCase() === g.rwName.toUpperCase());
      const patuhScore = locMatch ? locMatch.patuh : 75;
      return {
        ...g,
        latitude: g.latitude / g.count,
        longitude: g.longitude / g.count,
        totalBins: g.bins.length,
        patuh: patuhScore,
      };
    });
  }, [householdGroups, locations]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [locRes, binRes, hhRes, kelRes] = await Promise.all([
        api.get("/bins/locations"),
        api.get("/bins"),
        api.get("/households"),
        api.get("/bins/kelurahans"),
      ]);
      setLocations(locRes.data.data || []);
      setBins(binRes.data.data || []);
      setHouseholds(hhRes.data.data || []);
      setKelurahans(kelRes.data.data || []);
    } catch (err) {
      setError("Gagal memuat data dari server.");
      toast.error("Gagal memuat data lokasi & peta");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAddModal = () => {
    if (kelurahans.length > 0) {
      setNewAreaKelurahanId(kelurahans[0].id);
    }
    setNewAreaName("");
    setIsAddModalOpen(true);
  };

  const handleSubmitArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAreaName || !newAreaKelurahanId) {
      toast.error("Semua field wajib diisi");
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post("/bins/areas", {
        name: newAreaName,
        kelurahanId: newAreaKelurahanId,
      });
      toast.success("Lokasi RT/RW baru berhasil ditambahkan!");
      setIsAddModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menambahkan lokasi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredLocations = locations.filter((loc) => {
    const matchesSearch = loc.rw.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesKelurahan =
      selectedKelurahan === "Semua Kelurahan" || loc.kelurahan === selectedKelurahan;
    return matchesSearch && matchesKelurahan;
  });

  const handleLocationClick = (loc: any) => {
    // Attempt to find average coord from bins in this RW to fly to
    const rwBins = bins.filter(b => b.rtRw === loc.rw && b.latitude && b.longitude);
    if (rwBins.length > 0) {
      const avgLat = rwBins.reduce((sum, b) => sum + Number(b.latitude), 0) / rwBins.length;
      const avgLng = rwBins.reduce((sum, b) => sum + Number(b.longitude), 0) / rwBins.length;
      setMapCenter([avgLat, avgLng]);
      setMapZoom(17);
    } else {
      toast.error("Tidak ada koordinat terdaftar untuk RW ini");
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden -m-6 bg-surface-container">
      {/* Left Panel: Map Container */}
      <div className="flex-1 relative flex flex-col bg-surface-container-lowest border-r border-outline-variant/50">
        {/* Map Overlay / Tools */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          <div className="bg-white/95 backdrop-blur-md shadow-lg rounded-xl p-4 border border-outline-variant/30 flex flex-col gap-3">
            <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">
              Legenda Peta
            </p>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
              <span className="text-[12px] font-semibold text-on-surface">Organik / Kompos</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[#3b82f6] shadow-[0_0_8px_rgba(59,130,246,0.4)]"></div>
              <span className="text-[12px] font-semibold text-on-surface">Daur Ulang</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[#ef4444] shadow-[0_0_8px_rgba(239,68,68,0.4)]"></div>
              <span className="text-[12px] font-semibold text-on-surface">Residu / TPA</span>
            </div>
            <div className="flex items-center gap-3 border-t border-outline-variant/20 pt-2">
              <div className="w-3 h-3 rounded-full bg-[#eab308] shadow-[0_0_8px_rgba(234,179,8,0.4)] animate-pulse"></div>
              <span className="text-[12px] font-semibold text-on-surface">Flash Drop Challenge</span>
            </div>
          </div>
        </div>

        {/* Leaflet Map */}
        <div className="w-full h-full relative" style={{ zIndex: 1 }}>
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            scrollWheelZoom={true}
            style={{ height: "100%", width: "100%" }}
          >
            <MapUpdater center={mapCenter} zoom={mapZoom} />
            <MapEvents setZoom={setMapZoom} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* Zoom-dependent rendering: Zona (RW) vs Households */}
            {mapZoom < 16 ? (
              rwGroups
                .filter((g) => g.latitude && g.longitude && g.rwName !== "unknown")
                .map((group, idx) => (
                  <React.Fragment key={`rw-zone-frag-${idx}`}>
                    <Circle
                      center={[group.latitude, group.longitude]}
                      radius={150}
                      pathOptions={{ color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.05, weight: 1, dashArray: "4,4" }}
                    />
                    <Marker
                      position={[group.latitude, group.longitude]}
                      icon={createRwZonaIcon(group.rwName, group.patuh)}
                      eventHandlers={{
                        click: () => {
                          setMapCenter([group.latitude, group.longitude]);
                          setMapZoom(17);
                        },
                      }}
                    >
                      <Popup>
                        <div className="text-xs p-1 text-center">
                          <strong className="text-sm font-bold block mb-1">Zona {group.rwName}</strong>
                          <p className="text-gray-600 mb-1">Tingkat Kepatuhan: <strong>{group.patuh}%</strong></p>
                          <p className="text-gray-600 mb-2">{group.totalBins} Tempat Sampah</p>
                          <p className="text-[10px] text-primary italic">Klik untuk zoom in ke tingkat rumah tangga</p>
                        </div>
                      </Popup>
                    </Marker>
                  </React.Fragment>
                ))
            ) : (
              <>
                {/* Active Bins (Grouped by Household) */}
                {householdGroups.map((group, idx) => {
                  // Determine highest status among bins in group
                  let maxPercentage = 0;
                  group.bins.forEach(bin => {
                    const vol = Number(bin.currentVolumeLiter || 0);
                    const max = Number(bin.maxCapacityLiter || 25);
                    const pct = max > 0 ? (vol / max) * 100 : 0;
                    if (pct > maxPercentage) maxPercentage = pct;
                  });

                  let status = "Aman";
                  let color = "#10B981"; // green
                  if (maxPercentage >= 90) {
                    status = "Penuh";
                    color = "#ef4444"; // red
                  } else if (maxPercentage >= 70) {
                    status = "Sedang";
                    color = "#f59e0b"; // yellow
                  }

                  return (
                    <React.Fragment key={`hh-bin-frag-${idx}`}>
                      <Circle
                        center={[group.latitude, group.longitude]}
                        radius={20}
                        pathOptions={{ color: color, fillColor: color, fillOpacity: 0.12, weight: 1 }}
                      />
                      <Marker
                        position={[group.latitude, group.longitude]}
                        icon={createMapBinIcon(status)}
                        eventHandlers={{
                          click: () => {
                            setMapCenter([group.latitude, group.longitude]);
                            setMapZoom(19);
                          },
                        }}
                      >
                        <Popup>
                          <div className="text-[12px] space-y-2">
                            <strong className="text-sm font-bold block mb-1 border-b pb-1">Data Tong Rumah Tangga</strong>
                            {group.bins.map(b => {
                              const vol = Number(b.currentVolumeLiter || 0);
                              const max = Number(b.maxCapacityLiter || 25);
                              const pct = max > 0 ? (vol / max) * 100 : 0;
                              return (
                                <div key={b.id} className="border-b last:border-0 pb-1 mb-1">
                                  <span className="font-bold text-primary">{b.category?.name === "ORGANIC" ? "🌱 Organik" : "♻️ Anorganik"} ({b.kode})</span>
                                  <br />
                                  Kapasitas: {pct.toFixed(1)}% terisi ({vol}L / {max}L)
                                  <br />
                                  RT/RW: {b.rtRw || "-"}
                                  <br />
                                  Status: {b.status}
                                </div>
                              );
                            })}
                          </div>
                        </Popup>
                      </Marker>
                    </React.Fragment>
                  );
                })}

                {/* Households */}
                {households
                  .filter((h) => h.latitude && h.longitude)
                  .map((h) => (
                    <Marker
                      key={h.id}
                      position={[Number(h.latitude), Number(h.longitude)]}
                      icon={createHouseIcon()}
                      eventHandlers={{
                        click: () => {
                          setMapCenter([Number(h.latitude), Number(h.longitude)]);
                          setMapZoom(19);
                        },
                      }}
                    >
                      <Popup>
                        <div className="text-[12px]">
                          <strong>Rumah {h.user?.name || "Warga"}</strong>
                          <br />
                          Alamat: {h.address}
                          <br />
                          RT/RW: {h.rtRw?.name || "-"} (Kel. {h.rtRw?.kelurahan?.name || "-"})
                        </div>
                      </Popup>
                    </Marker>
                  ))}
              </>
            )}
          </MapContainer>
        </div>
      </div>

      {/* Right Panel: Data Sidebar */}
      <div className="w-[400px] bg-white border-l border-outline-variant/50 flex flex-col h-full z-20 shadow-[-4px_0_15px_rgba(0,0,0,0.03)]">
        {/* Panel Header */}
        <div className="p-5 border-b border-outline-variant/30 bg-white">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-[18px] font-bold text-on-surface">Daftar Lokasi (RW)</h3>
                <p className="text-[12px] text-on-surface-variant">
                  {filteredLocations.length} RW Tampil
                </p>
              </div>
              <div className="flex gap-2">
                {!isReadOnly && (
                  <button
                    onClick={handleOpenAddModal}
                    className="bg-primary hover:bg-primary/90 text-white font-bold text-[11px] py-2 px-3.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm uppercase tracking-wider cursor-pointer"
                  >
                    <MapPinPlus size={16} />
                    Tambah
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-2 w-full">
              <div className="relative">
                <select
                  value={selectedKelurahan}
                  onChange={(e) => setSelectedKelurahan(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 bg-surface-container-low border border-outline-variant/50 rounded-lg text-[13px] focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all text-on-surface-variant font-medium cursor-pointer"
                >
                  <option value="Semua Kelurahan">Semua Kelurahan</option>
                  {kelurahans.map((k) => (
                    <option key={k.id} value={k.name}>
                      {k.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-2 text-on-surface-variant pointer-events-none" size={18} />
              </div>
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-2 text-on-surface-variant" size={18} />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 bg-surface-container-low border border-outline-variant/50 rounded-lg text-[13px] focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                  placeholder="Cari RW..."
                  type="text"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RW List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-surface-container-lowest">
          {loading ? (
            <div className="p-8 text-center text-on-surface-variant flex flex-col items-center justify-center gap-3">
              <Loader2 className="animate-spin text-primary" size={32} />
              <p>Memuat lokasi...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-error font-medium">{error}</div>
          ) : filteredLocations.length > 0 ? (
            filteredLocations.map((loc) => (
              <div
                key={loc.id || loc.rw}
                onClick={() => handleLocationClick(loc)}
                className="group bg-white border border-outline-variant/50 rounded-xl p-4 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all duration-200"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface font-bold text-lg">
                      {loc.rw.replace("RW ", "")}
                    </div>
                    <div>
                      <h4 className="text-[16px] font-bold text-on-surface">{loc.rw}</h4>
                      <p className="text-[11px] font-medium text-on-surface-variant">
                        {loc.rtCount} RT • {loc.titikCount} Titik Sampah
                      </p>
                      <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded font-bold">
                        {loc.kelurahan}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        loc.patuh >= 85
                          ? "bg-green-100 text-green-700"
                          : loc.patuh >= 60
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {loc.patuh}% Patuh
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-on-surface-variant text-sm py-8">
              Tidak ada lokasi yang cocok
            </p>
          )}
        </div>
      </div>

      {/* Tambah Lokasi Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-low">
              <h3 className="text-xl font-bold text-on-surface">Tambah Lokasi Wilayah</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-on-surface-variant hover:bg-surface-container-low p-2 rounded-full transition-colors cursor-pointer"
              >
                <X />
              </button>
            </div>
            <form onSubmit={handleSubmitArea} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  Nama Wilayah (RT/RW)
                </label>
                <input
                  type="text"
                  required
                  value={newAreaName}
                  onChange={(e) => setNewAreaName(e.target.value)}
                  placeholder="Contoh: RT 02 RW 06"
                  className="w-full h-10 px-3 rounded-lg border border-outline-variant/50 bg-surface-container-low focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Kelurahan</label>
                <select
                  required
                  value={newAreaKelurahanId}
                  onChange={(e) => setNewAreaKelurahanId(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-outline-variant/50 bg-surface-container-low focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-xs font-bold cursor-pointer"
                >
                  <option value="">Pilih Kelurahan</option>
                  {kelurahans.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-4 flex justify-end gap-3 pt-4 border-t border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg font-medium text-on-surface-variant hover:bg-surface-container-low cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting && (
                    <Loader2 className="animate-spin" size={18} />
                  )}
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManajemenLokasi;
