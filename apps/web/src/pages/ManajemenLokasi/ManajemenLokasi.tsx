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
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polygon,
  Polyline,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import {
  ChevronDown,
  Search,
  Loader2,
  MapPinPlus,
  X,
  Trash2,
  AlertTriangle,
  Pencil,
  MapPin,
  Pentagon,
  RotateCcw,
  Undo2,
  CheckCircle2,
  Layers,
  Sparkles,
} from "lucide-react";

import {
  KELURAHAN_GEODATA,
  createMapBinIcon,
  createRwZonaIcon,
  createKelurahanPinIcon,
} from "../../constants/coblongGeoData";

// Fix default Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const kelurahanCentroidsMap = Object.values(KELURAHAN_GEODATA).map((kg) => ({
  name: kg.name,
  lat: kg.centroid[0],
  lng: kg.centroid[1],
  bounds: kg.bounds,
  color: kg.color,
  rwCount: kg.rwCount,
}));


const MapEvents = ({
  setZoom,
  setSelectedKelurahan,
}: {
  setZoom: (z: number) => void;
  setSelectedKelurahan: (k: string) => void;
}) => {
  useMapEvents({
    zoomend: (e) => {
      const z = e.target.getZoom();
      setZoom(z);
      if (z < 15) {
        setSelectedKelurahan("Semua Kelurahan");
      }
    },
  });
  return null;
};

const MapFlyTo = ({ target }: { target: { center: [number, number]; zoom: number; timestamp: number } | null }) => {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo(target.center, target.zoom, { duration: 1.2 });
    }
  }, [target, map]);
  return null;
};

// Interactive Component for Modal Map (Single Marker vs Manual Polygon Drawing)
const ModalMapInteractive = ({
  inputMode,
  markerPosition,
  polygonPoints,
  kelurahanBounds,
  onMarkerChange,
  onAddPolygonPoint,
}: {
  inputMode: "marker" | "polygon";
  markerPosition: [number, number] | null;
  polygonPoints: [number, number][];
  kelurahanBounds?: [number, number][];
  onMarkerChange: (lat: number, lng: number) => void;
  onAddPolygonPoint: (lat: number, lng: number) => void;
}) => {
  useMapEvents({
    click(e) {
      if (inputMode === "marker") {
        onMarkerChange(e.latlng.lat, e.latlng.lng);
      } else {
        onAddPolygonPoint(e.latlng.lat, e.latlng.lng);
      }
    },
  });

  return (
    <>
      {/* Background guide: Authentic Kelurahan LapakGIS Boundary Polygon */}
      {kelurahanBounds && (
        <Polygon
          positions={kelurahanBounds}
          pathOptions={{
            color: "#059669",
            fillColor: "#10b981",
            fillOpacity: 0.15,
            weight: 2,
            dashArray: "5, 5",
          }}
        />
      )}

      {/* Primary GPS Location Marker */}
      {markerPosition && <Marker position={markerPosition} />}

      {/* Drawn Custom Sub-Polygon */}
      {inputMode === "polygon" && (
        <>
          {polygonPoints.map((pt, idx) => (
            <Marker
              key={`modal-poly-pt-${idx}`}
              position={pt}
              icon={L.divIcon({
                className: "custom-div-icon",
                html: `<div style="background-color: #2563eb; width: 18px; height: 18px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-size: 9px; font-weight: bold;">${idx + 1}</div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10],
              })}
            />
          ))}
          {polygonPoints.length > 1 && (
            <Polyline
              positions={[...polygonPoints, polygonPoints[0]]}
              pathOptions={{ color: "#2563eb", weight: 2.5, dashArray: "6, 6" }}
            />
          )}
          {polygonPoints.length >= 3 && (
            <Polygon
              positions={polygonPoints}
              pathOptions={{ fillColor: "#3b82f6", fillOpacity: 0.3, color: "#1d4ed8", weight: 2 }}
            />
          )}
        </>
      )}
    </>
  );
};



const ManajemenLokasi: React.FC = () => {
  const { user } = useAuthStore();
  const isReadOnly = ["ADMIN_DLH", "CAMAT", "LURAH", "RT"].includes(user?.peran || "");

  const [locations, setLocations] = useState<any[]>([]);
  const [bins, setBins] = useState<any[]>([]);
  const [kelurahans, setKelurahans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKelurahan, setSelectedKelurahan] = useState("Semua Kelurahan");
  const [selectedRt, setSelectedRt] = useState("Semua RT");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Tambah / Edit Lokasi Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newAreaName, setNewAreaName] = useState("");
  const [newAreaKelurahanId, setNewAreaKelurahanId] = useState("");
  const [areaLat, setAreaLat] = useState("");
  const [areaLng, setAreaLng] = useState("");

  // Polygon Drawing Mode in Modal
  const [inputMode, setInputMode] = useState<"marker" | "polygon">("polygon");
  const [polygonPoints, setPolygonPoints] = useState<[number, number][]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Map view reference
  const [mapCenter, setMapCenter] = useState<[number, number]>([-6.8903, 107.611]);
  const [mapZoom, setMapZoom] = useState<number>(
    (user?.peran as string) === "LURAH"
      ? 14
      : (user?.peran as string) === "RW"
        ? 16
        : (user?.peran as string) === "RT"
          ? 18
          : 15
  );
  const [flyTarget, setFlyTarget] = useState<{ center: [number, number]; zoom: number; timestamp: number } | null>(null);

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

  const fetchData = async () => {
    try {
      setLoading(true);
      const [locRes, binRes, kelRes] = await Promise.all([
        api.get("/bins/locations"),
        api.get("/bins"),
        api.get("/bins/kelurahans"),
      ]);

      if (locRes.data?.success) setLocations(locRes.data.data || []);
      if (binRes.data?.success) setBins(binRes.data.data || []);
      if (kelRes.data?.success) setKelurahans(kelRes.data.data || []);
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

  // Calculate centroid from polygon points
  const updateCentroidFromPolygon = (pts: [number, number][]) => {
    if (pts.length === 0) return;
    const avgLat = pts.reduce((sum, p) => sum + p[0], 0) / pts.length;
    const avgLng = pts.reduce((sum, p) => sum + p[1], 0) / pts.length;
    setAreaLat(avgLat.toFixed(7));
    setAreaLng(avgLng.toFixed(7));
  };

  const handleAddPolygonPoint = (lat: number, lng: number) => {
    const newPts: [number, number][] = [...polygonPoints, [lat, lng]];
    setPolygonPoints(newPts);
    updateCentroidFromPolygon(newPts);
  };

  const handleUndoPolygonPoint = () => {
    if (polygonPoints.length === 0) return;
    const newPts = polygonPoints.slice(0, -1);
    setPolygonPoints(newPts);
    updateCentroidFromPolygon(newPts);
  };

  const handleClearPolygonPoints = () => {
    setPolygonPoints([]);
  };

  const handleOpenAddModal = () => {
    if (kelurahans.length > 0) {
      setNewAreaKelurahanId(kelurahans[0].id);
    }
    setModalType("add");
    setNewAreaName("");
    setAreaLat("-6.8895");
    setAreaLng("107.6108");
    setInputMode("polygon");
    setPolygonPoints([]);
    setIsAddModalOpen(true);
  };

  const handleEdit = (e: React.MouseEvent, loc: any) => {
    e.stopPropagation();
    setModalType("edit");
    setEditingId(loc.id);
    setNewAreaName(loc.rw);
    setNewAreaKelurahanId(kelurahans.find((k) => k.name.toLowerCase() === (loc.kelurahan || "").toLowerCase())?.id || "");

    const initialLat = loc.latitude ? loc.latitude.toString() : "-6.8895";
    const initialLng = loc.longitude ? loc.longitude.toString() : "107.6108";
    setAreaLat(initialLat);
    setAreaLng(initialLng);

    // Default to Single Marker mode on authentic OpenStreetMap coordinate (no fake artificial polygon)
    setPolygonPoints([]);
    setInputMode("marker");
    setIsAddModalOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setDeletingId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      await api.delete(`/bins/areas/${deletingId}`);
      toast.success("Lokasi berhasil dihapus!");
      setIsDeleteModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menghapus lokasi karena relasi aktif");
    }
  };

  const handleSubmitArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAreaName || !newAreaKelurahanId) {
      toast.error("Nama Wilayah dan Kelurahan wajib diisi!");
      return;
    }
    setIsSubmitting(true);
    try {
      if (modalType === "add") {
        await api.post("/bins/areas", {
          name: newAreaName,
          kelurahanId: newAreaKelurahanId,
          latitude: areaLat ? Number(areaLat) : undefined,
          longitude: areaLng ? Number(areaLng) : undefined,
        });
        toast.success("Lokasi RT/RW baru berhasil ditambahkan!");
      } else {
        await api.put(`/bins/areas/${editingId}`, {
          name: newAreaName,
          kelurahanId: newAreaKelurahanId,
          latitude: areaLat ? Number(areaLat) : undefined,
          longitude: areaLng ? Number(areaLng) : undefined,
        });
        toast.success("Lokasi RT/RW berhasil diperbarui!");
      }
      setIsAddModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menyimpan lokasi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatRegionName = (name: string, kelurahan?: string) => {
    const rtMatch = name.match(/RT\s*(\d+)/i);
    const rwMatch = name.match(/RW\s*(\d+)/i);
    const kel = kelurahan ? `Kel. ${kelurahan}` : "Kec. Coblong";
    if (rtMatch && rwMatch) {
      return `RT ${rtMatch[1]} / RW ${rwMatch[1]} (${kel})`;
    }
    return `${name} (${kel})`;
  };

  const uniqueRts = useMemo(() => {
    return Array.from(
      new Set(
        locations
          .map((l) => {
            const match = l.rw.match(/RT\s*(\d+)/i);
            return match ? match[1] : null;
          })
          .filter(Boolean)
      )
    ).sort() as string[];
  }, [locations]);

  const coblongKelurahans = ["Dago", "Sadang Serang", "Sekeloa", "Lebak Gede", "Lebak Siliwangi", "Cipaganti"];

  const filteredLocations = locations.filter((loc) => {
    const isCoblongKelurahan = coblongKelurahans.some((k) => k.toLowerCase() === (loc.kelurahan || "").toLowerCase());
    if (!isCoblongKelurahan && selectedKelurahan === "Semua Kelurahan") return false;

    const matchesSearch = loc.rw.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesKelurahan =
      selectedKelurahan === "Semua Kelurahan" || loc.kelurahan.toLowerCase() === selectedKelurahan.toLowerCase();
    const matchesRt =
      selectedRt === "Semua RT" || loc.rw.toLowerCase().includes(`rt ${selectedRt.toLowerCase()}`);
    return matchesSearch && matchesKelurahan && matchesRt;
  });

  const paginatedLocations = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLocations.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLocations, currentPage]);

  const totalPages = Math.ceil(filteredLocations.length / itemsPerPage);

  const handleLocationClick = (loc: any) => {
    if (loc.latitude && loc.longitude) {
      const lat = Number(loc.latitude);
      const lng = Number(loc.longitude);
      setMapCenter([lat, lng]);
      setMapZoom(17);
      setFlyTarget({ center: [lat, lng], zoom: 17, timestamp: Date.now() });
    } else {
      const rwBins = bins.filter((b) => b.rtRw === loc.rw && b.latitude && b.longitude);
      if (rwBins.length > 0) {
        const avgLat = rwBins.reduce((sum, b) => sum + Number(b.latitude), 0) / rwBins.length;
        const avgLng = rwBins.reduce((sum, b) => sum + Number(b.longitude), 0) / rwBins.length;
        setMapCenter([avgLat, avgLng]);
        setMapZoom(17);
        setFlyTarget({ center: [avgLat, avgLng], zoom: 17, timestamp: Date.now() });
      } else {
        toast.error("Tidak ada koordinat terdaftar untuk lokasi ini");
      }
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden -m-6 bg-slate-50 font-sans">
      {/* Left Panel: Map Container */}
      <div className="flex-1 relative flex flex-col bg-slate-100 border-r border-slate-200">
        {/* Map Overlay / Legendary Legend Card */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          <div className="bg-white/95 backdrop-blur-md shadow-xl rounded-2xl p-4 border border-slate-100/80 flex flex-col gap-3 min-w-[200px]">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Kapasitas Tempat Sampah / Zona
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100 shadow-sm"></div>
              <span className="text-[12px] font-semibold text-slate-700">&lt; 70% (Aman)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3.5 h-3.5 rounded-full bg-amber-500 ring-4 ring-amber-100 shadow-sm"></div>
              <span className="text-[12px] font-semibold text-slate-700">70% - 90% (Siaga)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3.5 h-3.5 rounded-full bg-rose-500 ring-4 ring-rose-100 shadow-sm"></div>
              <span className="text-[12px] font-semibold text-slate-700">&gt; 90% (Penuh)</span>
            </div>
          </div>
        </div>

        {/* Leaflet Map */}
        <div className="w-full h-full relative z-0">
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            scrollWheelZoom={true}
            style={{ height: "100%", width: "100%" }}
          >
            <MapFlyTo target={flyTarget} />
            <MapEvents setZoom={setMapZoom} setSelectedKelurahan={setSelectedKelurahan} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* LEVEL 1: RENDER AUTHENTIC HIGH-PRECISION LAPAKGIS KELURAHAN BOUNDARY POLYGONS */}
            {Object.values(KELURAHAN_GEODATA).map((kg) => {
              if (
                selectedKelurahan !== "Semua Kelurahan" &&
                selectedKelurahan.toLowerCase() !== kg.name.toLowerCase()
              ) {
                return null;
              }

              return (
                <Polygon
                  key={`kel-poly-${kg.id}`}
                  positions={kg.bounds}
                  pathOptions={{
                    color: kg.color,
                    fillColor: kg.color,
                    fillOpacity: selectedKelurahan.toLowerCase() === kg.name.toLowerCase() ? 0.32 : 0.18,
                    weight: selectedKelurahan.toLowerCase() === kg.name.toLowerCase() ? 3 : 2.2,
                  }}
                />
              );
            })}

            {/* LEVEL 1: RENDER KELURAHAN OVERVIEW MARKERS WHEN "Semua Kelurahan" IS SELECTED */}
            {selectedKelurahan === "Semua Kelurahan" &&
              kelurahanCentroidsMap.map((kel) => {
                const rwsInKel = locations.filter(
                  (l) => l.kelurahan.toLowerCase() === kel.name.toLowerCase()
                );
                return (
                  <Marker
                    key={`man-kel-${kel.name}`}
                    position={[kel.lat, kel.lng]}
                    icon={createKelurahanPinIcon(kel.name, rwsInKel.length)}
                    eventHandlers={{
                      click: () => {
                        setSelectedKelurahan(kel.name);
                        setFlyTarget({ center: [kel.lat, kel.lng], zoom: 16, timestamp: Date.now() });
                      },
                    }}
                  >
                    <Popup>
                      <div className="text-xs p-1 text-center font-sans">
                        <strong className="text-sm font-bold block text-slate-900 mb-1">
                          Kelurahan {kel.name}
                        </strong>
                        <p className="text-slate-600 mb-2">
                          Total Wilayah: <strong>{rwsInKel.length} RW</strong>
                        </p>
                        <button
                          onClick={() => {
                            setSelectedKelurahan(kel.name);
                            setFlyTarget({ center: [kel.lat, kel.lng], zoom: 16, timestamp: Date.now() });
                          }}
                          className="w-full bg-emerald-600 text-white font-bold text-[11px] py-1.5 px-3 rounded-lg hover:bg-emerald-700 transition cursor-pointer"
                        >
                          Buka Detail Tempat Sampah →
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

            {/* LEVEL 2: RENDER DETAILED RW MARKERS (WHEN KELURAHAN SELECTED OR ZOOM >= 17) */}
            {(() => {
              if (selectedKelurahan === "Semua Kelurahan" && mapZoom < 17) return null;

              const validLocations = filteredLocations.filter((g) => g.latitude && g.longitude);
              if (validLocations.length === 0) return null;

              return validLocations.map((group, idx) => (
                <Marker
                  key={`rw-marker-${group.rw}-${idx}`}
                  position={[group.latitude, group.longitude]}
                  icon={createRwZonaIcon(group.rw, group.patuh)}
                  eventHandlers={{
                    click: () => {
                      setMapCenter([group.latitude, group.longitude]);
                      setMapZoom(17);
                    },
                  }}
                >
                  <Popup>
                    <div className="text-xs p-2 text-left font-sans min-w-[260px] sm:min-w-[300px]">
                      <strong className="text-sm font-black block mb-2 text-slate-900 border-b pb-1.5 text-center">
                        Wilayah {group.rw.includes(`(${group.kelurahan})`) ? group.rw : `${group.rw} (${group.kelurahan})`}
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
                        <strong className="text-emerald-600 font-black text-sm">{group.patuh}%</strong>
                      </div>
                      <div className="flex justify-between text-slate-600 mb-2 px-1 text-xs">
                        <span>Tempat Sampah:</span>
                        <strong className="text-slate-800 font-black">{group.titikCount} Tempat Sampah</strong>
                      </div>

                      <p className="text-[11px] text-emerald-600 font-bold italic text-center pt-1.5 border-t border-slate-100">
                        Klik untuk zoom ke detail rumah tangga
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ));
            })()}

            {mapZoom >= 14 ? (
              <>
                {/* Active Bins (Grouped by Household) */}
                {householdGroups.map((group, idx) => {
                  let maxPercentage = 0;
                  group.bins.forEach((bin) => {
                    const vol = Number(bin.currentVolumeLiter || 0);
                    const max = Number(bin.maxCapacityLiter || 25);
                    const pct = max > 0 ? (vol / max) * 100 : 0;
                    if (pct > maxPercentage) maxPercentage = pct;
                  });

                  let status = "Aman";
                  let color = "#10b981";
                  if (maxPercentage >= 90) {
                    status = "Penuh";
                    color = "#ef4444";
                  } else if (maxPercentage >= 70) {
                    status = "Sedang";
                    color = "#f59e0b";
                  }

                  return (
                    <React.Fragment key={`hh-bin-frag-${idx}`}>
                      <Circle
                        center={[group.latitude, group.longitude]}
                        radius={20}
                        pathOptions={{ color: color, fillColor: color, fillOpacity: 0.15, weight: 1 }}
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
                          <div className="text-[12px] space-y-2 font-sans">
                            <strong className="text-sm font-bold block mb-1 border-b pb-1 text-slate-800">
                              Data Tempat Sampah Rumah Tangga
                            </strong>
                            {group.bins.map((b) => {
                              const vol = Number(b.currentVolumeLiter || 0);
                              const max = Number(b.maxCapacityLiter || 25);
                              const pct = max > 0 ? (vol / max) * 100 : 0;
                              return (
                                <div key={b.id} className="border-b last:border-0 pb-1 mb-1">
                                  <span className="font-bold text-emerald-600">
                                    {b.category?.name === "ORGANIC" ? "🌱 Organik" : "♻️ Anorganik"} ({b.kode})
                                  </span>
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
              </>
            ) : null}
          </MapContainer>
        </div>
      </div>

      {/* Right Panel: Data Sidebar */}
      <div className="w-[420px] bg-white border-l border-slate-200 flex flex-col h-full z-20 shadow-[-4px_0_20px_rgba(0,0,0,0.03)]">
        {/* Panel Header */}
        <div className="p-5 border-b border-slate-100 bg-white">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-extrabold text-[11px] text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Layers size={13} className="text-emerald-600" />
                  Kapasitas Tempat Sampah / Zona
                </h4>
                <p className="text-[12px] text-slate-500 font-medium mt-0.5">
                  {filteredLocations.length} RW Terdaftar
                </p>
              </div>
              <div className="flex gap-2">
                {!isReadOnly && (
                  <button
                    onClick={handleOpenAddModal}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] py-2 px-3.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-emerald-200 uppercase tracking-wider cursor-pointer"
                  >
                    <MapPinPlus size={16} />
                    Tambah
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-2 w-full">
              <div className="relative flex-1">
                <select
                  value={selectedKelurahan}
                  onChange={(e) => {
                    setSelectedKelurahan(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[12px] appearance-none focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all cursor-pointer font-semibold text-slate-700"
                >
                  <option value="Semua Kelurahan">Semua Kelurahan</option>
                  {kelurahans.map((k) => (
                    <option key={k.id} value={k.name}>
                      {k.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" size={16} />
              </div>
              <div className="relative w-[110px]">
                <select
                  value={selectedRt}
                  onChange={(e) => {
                    setSelectedRt(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[12px] appearance-none focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all cursor-pointer font-semibold text-slate-700"
                >
                  <option value="Semua RT">Semua RT</option>
                  {uniqueRts.map((rt) => (
                    <option key={rt} value={rt}>
                      RT {rt}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" size={16} />
              </div>
            </div>

            <div className="relative w-full">
              <Search className="absolute left-3.5 top-2.5 text-slate-400" size={16} />
              <input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all placeholder:text-slate-400 font-medium"
                placeholder="Cari RW atau RT..."
                type="text"
              />
            </div>
          </div>
        </div>

        {/* RW List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
          {loading ? (
            <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
              <Loader2 className="animate-spin text-emerald-600" size={32} />
              <p className="text-sm font-medium">Memuat lokasi...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-rose-600 font-medium text-sm">{error}</div>
          ) : paginatedLocations.length > 0 ? (
            paginatedLocations.map((loc) => (
              <div
                key={loc.id || loc.rw}
                onClick={() => handleLocationClick(loc)}
                className="group bg-white border border-slate-200/80 rounded-2xl p-4 cursor-pointer hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-200"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex flex-col items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm leading-none p-1">
                      <span className="text-[8px] font-extrabold uppercase opacity-70">
                        {loc.rw.includes("RT") ? "RT" : "RW"}
                      </span>
                      <span className="text-sm font-black tracking-tight mt-0.5">
                        {(() => {
                          const m = loc.rw.match(/(\d+)/);
                          return m ? m[1].padStart(2, "0") : "01";
                        })()}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-[13px] font-bold text-slate-800 leading-tight">
                        {formatRegionName(loc.rw, loc.kelurahan)}
                      </h4>
                      <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                        {loc.rtCount} RT • {loc.titikCount} Tempat Sampah
                      </p>
                      <span className="inline-block text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full font-bold mt-1">
                        {loc.kelurahan}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold ${loc.patuh >= 85
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : loc.patuh >= 60
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-rose-100 text-rose-800 border border-rose-200"
                        }`}
                    >
                      {loc.patuh}% Patuh
                    </span>
                    {!isReadOnly && loc.id && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all ml-1">
                        <button
                          onClick={(e) => handleEdit(e, loc)}
                          className="p-1.5 bg-slate-100 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors cursor-pointer"
                          title="Edit Lokasi"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteClick(e, loc.id)}
                          className="p-1.5 bg-slate-100 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Lokasi"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-slate-400 text-sm py-12 flex flex-col items-center gap-2">
              <Search className="w-8 h-8 text-slate-300" />
              <p>Tidak ada lokasi yang cocok</p>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-white">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-bold disabled:opacity-40 hover:bg-slate-100 cursor-pointer transition-all text-slate-700"
            >
              Prev
            </button>
            <span className="text-[12px] text-slate-500 font-semibold">
              Halaman {currentPage} dari {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-bold disabled:opacity-40 hover:bg-slate-100 cursor-pointer transition-all text-slate-700"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Tambah / Edit Lokasi Modal with Manual Polygon Drawing */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-100">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <Pentagon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    {modalType === "add" ? "Tambah Lokasi Wilayah" : "Edit Lokasi Wilayah"}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Atur batas wilayah RT/RW dan titik koordinat GPS
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:bg-slate-200/60 p-2 rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitArea} className="p-6 flex flex-col gap-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nama Wilayah (RT/RW)
                  </label>
                  <input
                    type="text"
                    required
                    value={newAreaName}
                    onChange={(e) => setNewAreaName(e.target.value)}
                    placeholder="Contoh: RT 01 RW 02"
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none text-xs font-medium text-slate-800 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Kelurahan</label>
                  <select
                    required
                    value={newAreaKelurahanId}
                    onChange={(e) => setNewAreaKelurahanId(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none text-xs font-bold cursor-pointer text-slate-800 transition-all"
                  >
                    <option value="">Pilih Kelurahan</option>
                    {kelurahans.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Input Mode Selector */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-slate-700">
                    Bentuk & Titik Lokasi GPS
                  </label>
                  <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                    <button
                      type="button"
                      onClick={() => setInputMode("polygon")}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${inputMode === "polygon"
                          ? "bg-white text-emerald-700 shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                        }`}
                    >
                      <Pentagon size={13} />
                      Draw Polygon
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputMode("marker")}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${inputMode === "marker"
                          ? "bg-white text-emerald-700 shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                        }`}
                    >
                      <MapPin size={13} />
                      Single Marker
                    </button>
                  </div>
                </div>

                {/* Map Control Helper Bar */}
                <div className="bg-emerald-50/80 border border-emerald-100 rounded-xl p-2.5 flex items-center justify-between text-xs text-emerald-800 font-medium">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      {inputMode === "polygon"
                        ? "Klik pada peta untuk membuat sudut polygon (minimal 3 titik)."
                        : "Klik pada peta untuk menentukan posisi titik GPS utama."}
                    </span>
                  </div>
                  {inputMode === "polygon" && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleUndoPolygonPoint}
                        disabled={polygonPoints.length === 0}
                        className="p-1 hover:bg-emerald-100 text-emerald-700 rounded disabled:opacity-30 cursor-pointer"
                        title="Undo Titik Terakhir"
                      >
                        <Undo2 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={handleClearPolygonPoints}
                        disabled={polygonPoints.length === 0}
                        className="p-1 hover:bg-rose-100 text-rose-600 rounded disabled:opacity-30 cursor-pointer"
                        title="Reset Polygon"
                      >
                        <RotateCcw size={15} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Interactive Mini Map for Polygon Drawing */}
                <div className="h-[220px] w-full rounded-2xl overflow-hidden border border-slate-200 relative z-0 shadow-inner">
                  <MapContainer
                    center={
                      areaLat && areaLng
                        ? [Number(areaLat), Number(areaLng)]
                        : [-6.8903, 107.611]
                    }
                    zoom={16}
                    scrollWheelZoom={true}
                    style={{ height: "100%", width: "100%" }}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <ModalMapInteractive
                      inputMode={inputMode}
                      markerPosition={areaLat && areaLng ? [Number(areaLat), Number(areaLng)] : null}
                      polygonPoints={polygonPoints}
                      kelurahanBounds={(() => {
                        const curKel = kelurahans.find((k) => k.id === newAreaKelurahanId);
                        if (!curKel) return undefined;
                        const kg = Object.values(KELURAHAN_GEODATA).find((g) => g.name.toLowerCase() === curKel.name.toLowerCase());
                        return kg?.bounds;
                      })()}
                      onMarkerChange={(lat, lng) => {
                        setAreaLat(lat.toFixed(7));
                        setAreaLng(lng.toFixed(7));
                      }}
                      onAddPolygonPoint={handleAddPolygonPoint}
                    />
                  </MapContainer>
                </div>

                {/* Polygon Points Counter Badges */}
                {inputMode === "polygon" && polygonPoints.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1 max-h-[60px] overflow-y-auto p-1">
                    {polygonPoints.map((pt, idx) => (
                      <span
                        key={`badge-poly-${idx}`}
                        className="inline-flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200"
                      >
                        <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 text-white text-[8px] flex items-center justify-center">
                          {idx + 1}
                        </span>
                        {pt[0].toFixed(4)}, {pt[1].toFixed(4)}
                      </span>
                    ))}
                  </div>
                )}

                {/* Manual Lat Lng Input */}
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Latitude Centroid
                    </label>
                    <input
                      type="number"
                      step="0.00000001"
                      required
                      value={areaLat}
                      onChange={(e) => setAreaLat(e.target.value)}
                      placeholder="-6.8895"
                      className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none text-xs font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Longitude Centroid
                    </label>
                    <input
                      type="number"
                      step="0.00000001"
                      required
                      value={areaLng}
                      onChange={(e) => setAreaLng(e.target.value)}
                      placeholder="107.6108"
                      className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none text-xs font-semibold text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-4 flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 transition-all shadow-md shadow-emerald-200 cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}
                  Simpan Lokasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirm Delete */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col p-6 text-center transform transition-all border border-slate-100">
            <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border-4 border-rose-100 shadow-sm">
              <AlertTriangle size={26} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">Hapus Lokasi Wilayah?</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Apakah Anda yakin ingin menghapus wilayah ini? Pastikan tidak ada data yang terkait.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl font-bold text-xs border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer transition-all"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-xl font-bold text-xs hover:bg-rose-700 shadow-md shadow-rose-200 cursor-pointer transition-all"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManajemenLokasi;
