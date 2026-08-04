/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from "react-leaflet";
import L from "leaflet";
import api from "../../utils/api";
import { useAuthStore } from "../../store/useAuthStore";
import { useMonitoringStore, type Bin } from "../../store/useMonitoringStore";
import toast from "react-hot-toast";

// Fix Leaflet icons in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface KPIStats {
  totalWarga: number;
  totalSampahKg: number;
  tempatSampahAktif: number;
  alertTongPenuh: number;
  setoranHariIniKg: number;
  komposisiSampah: { organikKg: number; anorganikKg: number };
}

interface TrendWeek {
  label: string;
  weight: number;
  organic: number;
  inorganic: number;
}

interface FacilityItem {
  id: string;
  jenis: string;
  nama: string;
  pic: string;
  kapasitas: number;
  latitude: number;
  longitude: number;
}

interface RwResiduData {
  petugas: {
    id: string;
    nama: string;
    phone: string;
    status: string;
    whitelistStatus: string;
    kpiScore: number;
  } | null;
  stats: {
    totalResiduKg: number;
    todayResiduKg: number;
    totalPengangkutan: number;
  };
  logs: Array<{
    id: string;
    diinputOleh: string;
    petugasNama: string;
    petugasPhone: string;
    beratKg: number;
    unit: string;
    kategori: string;
    fotoResiduUrl: string;
    createdAt: string;
  }>;
}

// Custom DivIcons for Map Marker Bins & Facilities
const createBinIcon = (status: "aman" | "waspada" | "penuh" | string) => {
  let color = "#10B981"; // green
  if (status === "waspada") color = "#F59E0B"; // yellow
  if (status === "penuh") color = "#EF4444"; // red

  return L.divIcon({
    className: "custom-bin-icon",
    html: `
      <div style="background-color: ${color}; width: 26px; height: 26px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: white;">
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
};

const createFacilityIcon = (jenis: string) => {
  let bgColor = "#8b5cf6"; // purple default
  let svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>`;

  if (jenis === "loseda" || jenis === "bata_terawang" || jenis === "rumah_maggot") {
    bgColor = "#10b981"; // Hijau (Organik/Kompos)
    svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M12 6v6l4 2"/></svg>`;
  } else if (jenis === "bank_sampah" || jenis === "daur_ulang") {
    bgColor = "#3b82f6"; // Biru (Daur Ulang)
    svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 19H3v-2a3 3 0 0 1 3-3h1m4-4h6m-3-3v6m4 4h3v2a3 3 0 0 1-3 3h-1"/></svg>`;
  } else if (jenis === "tpa" || jenis === "residu") {
    bgColor = "#ef4444"; // Merah (Residu/TPA)
    svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;
  } else if (jenis === "flash_drop") {
    bgColor = "#eab308"; // Emas (Flash Drop Challenge)
    svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
  }

  return L.divIcon({
    className: "custom-facility-icon",
    html: `
      <div style="background-color: ${bgColor}; color: white; border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
        ${svgIcon}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};


const createRwIcon = (totalBins: number) => {
  return L.divIcon({
    className: "custom-div-icon",
    html: `
      <div style="background-color: rgba(59, 130, 246, 0.8); width: 40px; height: 40px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; color: white; font-size: 14px; font-weight: bold;">
        ${totalBins}
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

const MapEventHandler = ({ setZoom }: { setZoom: (z: number) => void }) => {
  useMapEvents({
    zoomend: (e) => {
      setZoom(e.target.getZoom());
    }
  });
  return null;
};

const Monitoring: React.FC = () => {
  const { user } = useAuthStore();
  const { bins, fetchBins } = useMonitoringStore();

  const [facilities, setFacilities] = useState<FacilityItem[]>([]);
  const [kpi, setKpi] = useState<KPIStats | null>(null);
  const [trends, setTrends] = useState<TrendWeek[]>([]);
  const [rwResiduData, setRwResiduData] = useState<RwResiduData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>((user?.peran as string) === "LURAH" ? 14 : (user?.peran as string) === "RW" ? 16 : (user?.peran as string) === "RT" ? 18 : 15);

  // Scoped variables based on role
  const displayScope = useMemo(() => {
    if (user?.peran === "RW" || user?.peran === "RT") return user?.wilayah || "RW 06 Dago";
    if (user?.peran === "LURAH") return "Kelurahan Dago";
    if (user?.peran === "CAMAT") return "Kecamatan Coblong";
    return "Sistem Kota (Semua Wilayah)";
  }, [user]);

  const apiFilterWilayah = useMemo(() => {
    if (user?.peran === "RW" || user?.peran === "RT") return user?.wilayah || "RW 06 Dago";
    if (user?.peran === "LURAH") return "Kelurahan Dago";
    if (user?.peran === "CAMAT") return "Kecamatan Coblong";
    return undefined;
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      await fetchBins().catch(() => {});

      const isRwRole = user?.peran === "RW" || user?.peran === "RT";
      const [kpiRes, trendRes, facRes, rwRes] = await Promise.all([
        api.get("/dashboard/kpi", { params: { wilayah: apiFilterWilayah } }).catch(() => ({ data: { success: false } })),
        api.get("/dashboard/trend", { params: { wilayah: apiFilterWilayah } }).catch(() => ({ data: { success: false } })),
        api.get("/facilities").catch(() => ({ data: { success: false } })),
        isRwRole
          ? api.get("/rw/residu-monitoring").catch(() => ({ data: { success: false } }))
          : Promise.resolve({ data: { success: false } }),
      ]);

      if (kpiRes.data?.success && kpiRes.data.data) setKpi(kpiRes.data.data);
      if (trendRes.data?.success && trendRes.data.data) setTrends(trendRes.data.data);
      if (facRes.data?.success && facRes.data.data) setFacilities(facRes.data.data);
      if (rwRes.data?.success && rwRes.data.data) setRwResiduData(rwRes.data.data);
    } catch (e) {
      console.error("Gagal memuat analitik dashboard:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [apiFilterWilayah]);

  const handleExport = (format: "CSV" | "PDF", dataName: string) => {
    toast.success(`Mengekspor ${dataName} (${displayScope}) sebagai ${format}...`);
  };

  const handleDownloadGuide = () => {
    toast.success("Mempersiapkan berkas PDF Panduan Pemilahan Sampah...");
  };

  // Determine map center
  const mapCenter: [number, number] = useMemo(() => {
    const binWithLoc = bins.find((b) => b.latitude && b.longitude);
    if (binWithLoc) return [Number(binWithLoc.latitude), Number(binWithLoc.longitude)];
    return [-6.8903, 107.611]; // Default Coblong, Bandung
  }, [bins]);

  // Group bins by household (userId or coordinates)
  const householdGroups = useMemo(() => {
    const groups: Record<string, { bins: Bin[]; latitude: number; longitude: number; rtRw?: string }> = {};
    bins
      .filter((b) => b.latitude && b.longitude)
      .forEach((bin) => {
        const key = bin.userId || `${bin.latitude},${bin.longitude}`;
        if (!groups[key]) {
          groups[key] = { bins: [], latitude: Number(bin.latitude), longitude: Number(bin.longitude), rtRw: bin.rtRw };
        }
        groups[key].bins.push(bin);
      });
    return Object.values(groups);
  }, [bins]);

  // Group by RW (Zona)
  const rwGroups = useMemo(() => {
    const groups: Record<string, { bins: Bin[]; latitude: number; longitude: number; count: number }> = {};
    householdGroups.forEach((hg) => {
      const key = hg.rtRw ? `rw-${hg.rtRw}` : "unknown";
      if (!groups[key]) {
        groups[key] = { bins: [], latitude: 0, longitude: 0, count: 0 };
      }
      groups[key].bins.push(...hg.bins);
      groups[key].latitude += hg.latitude;
      groups[key].longitude += hg.longitude;
      groups[key].count += 1;
    });

    // Calculate center
    return Object.values(groups).map((g) => ({
      ...g,
      latitude: g.latitude / g.count,
      longitude: g.longitude / g.count,
      totalBins: g.bins.length,
    }));
  }, [householdGroups]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Geospasial & Analitik Real-Time</h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-primary">location_on</span>
            Cakupan Wilayah: <span className="font-bold text-primary underline">{displayScope}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleDownloadGuide}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm text-sm font-semibold transition"
          >
            <span className="material-symbols-outlined text-[20px]">menu_book</span>
            Buku Panduan PDF
          </button>
          <button
            onClick={() => handleExport("CSV", "Trend Analitik")}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            <span className="material-symbols-outlined text-gray-500 text-[20px]">download</span>
            CSV
          </button>
          <button
            onClick={() => handleExport("PDF", "Laporan Wilayah")}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg shadow-sm text-sm font-medium hover:bg-primary-dark transition"
          >
            <span className="material-symbols-outlined text-white text-[20px]">picture_as_pdf</span>
            PDF
          </button>
        </div>
      </div>

      {/* Scoped Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-green-50 rounded-xl text-green-600">
            <span className="material-symbols-outlined text-[32px]">home</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase">Rumah Tangga</p>
            <h3 className="text-2xl font-bold text-gray-900">{kpi?.totalWarga || 0} Aktif</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-blue-50 rounded-xl text-blue-600">
            <span className="material-symbols-outlined text-[32px]">eco</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase">Sampah Terpilah</p>
            <h3 className="text-2xl font-bold text-gray-900">{(kpi?.totalSampahKg || 0).toFixed(1)} Kg</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-orange-50 rounded-xl text-orange-600">
            <span className="material-symbols-outlined text-[32px]">delete</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase">Tempat Sampah</p>
            <h3 className="text-2xl font-bold text-gray-900">{kpi?.tempatSampahAktif || 0} Terdaftar</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="p-4 bg-red-50 rounded-xl text-red-600">
            <span className="material-symbols-outlined text-[32px] animate-pulse">notifications_active</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase">Kondisi Penuh</p>
            <h3 className="text-2xl font-bold text-red-600">{kpi?.alertTongPenuh || 0} Radar Merah</h3>
          </div>
        </div>
      </div>

      {/* Map and Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GIS Map */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[520px]">
          <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-sm text-gray-800">GIS Peta Wilayah</h3>
              <p className="text-[10px] text-gray-400">Monitoring real-time volume tong dan fasilitas lingkungan</p>
            </div>
            <div className="flex gap-4 text-xs font-semibold flex-wrap justify-end max-w-md">
              <span className="flex items-center gap-1"><span className="w-3.5 h-3.5 bg-green-500 border border-white rounded-full"></span> Tong Aman</span>
              <span className="flex items-center gap-1"><span className="w-3.5 h-3.5 bg-yellow-500 border border-white rounded-full"></span> Tong Waspada</span>
              <span className="flex items-center gap-1"><span className="w-3.5 h-3.5 bg-red-500 border border-white rounded-full animate-ping"></span> Tong Penuh</span>
              <div className="w-full h-px bg-gray-200 my-1"></div>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#10b981] rounded-sm"></span> Organik/Kompos</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#3b82f6] rounded-sm"></span> Daur Ulang</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#ef4444] rounded-sm"></span> Residu/TPA</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#eab308] rounded-sm"></span> Flash Drop</span>
            </div>
          </div>
          <div className="flex-1 relative z-10">
            <MapContainer center={mapCenter} zoom={zoomLevel} className="h-full w-full">
              <MapEventHandler setZoom={setZoomLevel} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Bins Layer Grouped by Household or RW Zona */}
              {/* Bins Layer Grouped by Household or RW Zona */}
              {zoomLevel < 16 ? (
                rwGroups.map((group, idx) => (
                  <React.Fragment key={`rw-frag-${idx}`}>
                    <Circle
                      center={[group.latitude, group.longitude]}
                      radius={150}
                      pathOptions={{ color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.05, weight: 1, dashArray: "4,4" }}
                    />
                    <Marker
                      position={[group.latitude, group.longitude]}
                      icon={createRwIcon(group.totalBins)}
                    >
                      <Popup>
                        <div className="text-xs p-1 text-center">
                          <strong className="text-sm font-bold block mb-1">Zona RW</strong>
                          <p className="text-gray-600 mb-2">{group.totalBins} Tempat Sampah</p>
                          <p className="text-[10px] text-primary italic">Zoom in untuk melihat detail</p>
                        </div>
                      </Popup>
                    </Marker>
                  </React.Fragment>
                ))
              ) : (
                householdGroups.map((group, idx) => {
                  // Determine highest status among bins in group
                  let maxPercentage = 0;
                  group.bins.forEach(bin => {
                    const vol = Number(bin.currentVolumeLiter);
                    const max = Number(bin.maxCapacityLiter);
                    const pct = max > 0 ? (vol / max) * 100 : 0;
                    if (pct > maxPercentage) maxPercentage = pct;
                  });

                  let status: "aman" | "waspada" | "penuh" = "aman";
                  let color = "#10B981"; // green
                  if (maxPercentage >= 90) {
                    status = "penuh";
                    color = "#ef4444"; // red
                  } else if (maxPercentage >= 70) {
                    status = "waspada";
                    color = "#f59e0b"; // yellow
                  }

                  return (
                    <React.Fragment key={`hh-frag-${idx}`}>
                      <Circle
                        center={[group.latitude, group.longitude]}
                        radius={20}
                        pathOptions={{ color: color, fillColor: color, fillOpacity: 0.12, weight: 1 }}
                      />
                      <Marker
                        position={[group.latitude, group.longitude]}
                        icon={createBinIcon(status)}
                      >
                        <Popup>
                          <div className="text-xs p-1 min-w-[150px]">
                            <strong className="text-sm font-bold block mb-2 border-b pb-1">Data Tong Rumah Tangga</strong>
                            {group.bins.map(bin => {
                              const vol = Number(bin.currentVolumeLiter);
                              const max = Number(bin.maxCapacityLiter);
                              const percentage = max > 0 ? (vol / max) * 100 : 0;
                              return (
                                <div key={bin.id} className="mb-2 last:mb-0">
                                  <span className="font-semibold">{bin.category?.name || (bin as any).categoryName || "Tempat Sampah"}</span>
                                  <span className="block text-gray-500 text-[10px]">QR: {bin.qrCode}</span>
                                  <span className="block text-gray-700">Terisi: {percentage.toFixed(1)}% ({vol}L / {max}L)</span>
                                </div>
                              );
                            })}
                          </div>
                        </Popup>
                      </Marker>
                    </React.Fragment>
                  );
                })
              )}

              {/* Facilities Layer */}
              {facilities
                .filter((f) => f.latitude && f.longitude)
                .map((f) => {
                  const lat = Number(f.latitude);
                  const lng = Number(f.longitude);
                  
                  // Zone/coverage indicator based on facility type
                  let zoneColor = "#8b5cf6"; // purple
                  let zoneRadius = 60;
                  if (f.jenis === "loseda" || f.jenis === "rumah_maggot") {
                    zoneColor = "#10b981"; // green
                    zoneRadius = f.jenis === "loseda" ? 25 : 75;
                  } else if (f.jenis === "bank_sampah") {
                    zoneColor = "#3b82f6"; // blue
                    zoneRadius = 100;
                  } else if (f.jenis === "tpa" || f.jenis === "residu") {
                    zoneColor = "#ef4444"; // red
                    zoneRadius = 150;
                  } else if (f.jenis === "flash_drop") {
                    zoneColor = "#eab308"; // gold/yellow
                    zoneRadius = 80;
                  }

                  return (
                    <React.Fragment key={`fac-frag-${f.id}`}>
                      <Circle
                        center={[lat, lng]}
                        radius={zoneRadius}
                        pathOptions={{ color: zoneColor, fillColor: zoneColor, fillOpacity: 0.08, weight: 1, dashArray: "2,2" }}
                      />
                      <Marker
                        position={[lat, lng]}
                        icon={createFacilityIcon(f.jenis)}
                      >
                        <Popup>
                          <div className="text-xs p-1">
                            <strong className="text-sm font-bold block mb-0.5 text-primary uppercase">{f.jenis.replace("_", " ")}</strong>
                            <span className="font-bold text-gray-800 block text-xs">{f.nama}</span>
                            <span className="block text-gray-500 mt-1">PIC: {f.pic}</span>
                            {f.kapasitas && <span className="block text-gray-600">Kapasitas: {f.kapasitas} Kg</span>}
                          </div>
                        </Popup>
                      </Marker>
                    </React.Fragment>
                  );
                })}
            </MapContainer>
          </div>
        </div>

        {/* Dynamic Charts and Trends */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-[520px]">
          <div>
            <h3 className="font-bold text-sm text-gray-800">Tren Pengumpulan Scoped</h3>
            <p className="text-[10px] text-gray-400">Statistik berat setoran sampah mingguan</p>
          </div>

          <div className="h-64 mt-4 flex items-end relative border-b border-l border-gray-200 p-2">
            {trends.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
                Belum ada transaksi di wilayah ini
              </div>
            ) : (
              <div className="w-full h-full flex justify-around items-end">
                {trends.slice(-6).map((t, idx) => {
                  const maxVal = Math.max(1, ...trends.map(x => x.organic + x.inorganic));
                  const orgHeight = (t.organic / maxVal) * 100;
                  const inorgHeight = (t.inorganic / maxVal) * 100;

                  return (
                    <div key={idx} className="flex flex-col items-center gap-2 w-full max-w-[60px]">
                      <div className="w-full flex items-end gap-1.5 h-44">
                        <div
                          style={{ height: `${orgHeight}%` }}
                          className="w-4 bg-emerald-500 rounded-t-sm hover:opacity-85 transition-all duration-300"
                          title={`Organik: ${t.organic} Kg`}
                        ></div>
                        <div
                          style={{ height: `${inorgHeight}%` }}
                          className="w-4 bg-blue-500 rounded-t-sm hover:opacity-85 transition-all duration-300"
                          title={`Anorganik: ${t.inorganic} Kg`}
                        ></div>
                      </div>
                      <span className="text-[9px] text-gray-500 whitespace-nowrap">{t.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex gap-4 justify-center mt-4 text-xs font-semibold">
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-emerald-500 rounded-full"></span> Organik</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded-full"></span> Anorganik</span>
          </div>

          <div className="border-t border-gray-100 pt-4 mt-4">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">Estimasi Pengurangan Emisi</span>
              <span className="font-bold text-emerald-600 font-mono">
                {((kpi?.totalSampahKg || 0) * 0.05).toFixed(2)} Kg CO2e
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Monitoring Hasil Residu Petugas (Relasi 1 RW 1 Petugas) */}
      {(user?.peran === "RW" || user?.peran === "RT" || rwResiduData) && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-orange-600 text-2xl">shield</span>
                <h2 className="text-xl font-bold text-gray-900">Monitoring Hasil Residu Petugas Wilayah</h2>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Relasi Khusus: 1 RW 1 Petugas Residu — Pemantauan penimbangan & setoran residu hilir ({displayScope})
              </p>
            </div>
            <span className="bg-emerald-50 text-emerald-700 text-xs px-3 py-1.5 rounded-full font-bold border border-emerald-200">
              Scoped 1 RW 1 Petugas
            </span>
          </div>

          {/* Card Info Petugas Residu Terkait */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col justify-between space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-lg border border-orange-200">
                  <span className="material-symbols-outlined text-2xl">badge</span>
                </div>
                <div>
                  <h4 className="font-extrabold text-gray-900 text-sm">
                    {rwResiduData?.petugas?.nama || "Petugas Residu Wilayah"}
                  </h4>
                  <p className="text-xs text-gray-500">
                    No. WA: {rwResiduData?.petugas?.phone || "-"}
                  </p>
                  <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded font-bold bg-blue-100 text-blue-700">
                    Status: {rwResiduData?.petugas?.whitelistStatus || "AKTIF"}
                  </span>
                </div>
              </div>
              <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-xs">
                <span className="text-gray-600">Skor Performa (KPI)</span>
                <span className="font-bold text-emerald-600 text-sm">
                  {rwResiduData?.petugas?.kpiScore || 100} / 100
                </span>
              </div>
            </div>

            <div className="bg-orange-50/60 p-5 rounded-xl border border-orange-100 flex flex-col justify-center space-y-2">
              <span className="text-xs font-semibold text-orange-600 uppercase">Total Residu Terkumpul Wilayah</span>
              <h3 className="text-3xl font-black text-orange-900">
                {rwResiduData?.stats?.totalResiduKg || 0} <span className="text-sm font-semibold">Kg</span>
              </h3>
              <p className="text-[11px] text-orange-700">Akumulasi hasil penimbangan residu di RW ini</p>
            </div>

            <div className="bg-emerald-50/60 p-5 rounded-xl border border-emerald-100 flex flex-col justify-center space-y-2">
              <span className="text-xs font-semibold text-emerald-600 uppercase">Setoran Hari Ini & Pengangkutan</span>
              <h3 className="text-3xl font-black text-emerald-900">
                {rwResiduData?.stats?.todayResiduKg || 0} <span className="text-sm font-semibold">Kg</span>
              </h3>
              <p className="text-[11px] text-emerald-700">
                Total {rwResiduData?.stats?.totalPengangkutan || 0} sesi penimbangan oleh Petugas
              </p>
            </div>
          </div>

          {/* Tabel Riwayat Setoran Residu Hilir */}
          <div>
            <h3 className="font-bold text-sm text-gray-800 mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[18px]">receipt_long</span>
              Riwayat Setoran Residu Hilir Petugas (Terikat RW ID)
            </h3>

            {(!rwResiduData?.logs || rwResiduData.logs.length === 0) ? (
              <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-400">
                Belum ada data setoran residu yang diinput oleh Petugas Residu di RW ini.
              </div>
            ) : (
              <div className="overflow-x-auto border border-gray-100 rounded-xl">
                <table className="w-full text-left text-xs text-gray-600">
                  <thead className="bg-gray-50 text-gray-700 font-bold uppercase text-[10px] border-b border-gray-100">
                    <tr>
                      <th className="p-3">Waktu</th>
                      <th className="p-3">Diinput Oleh</th>
                      <th className="p-3">Kategori Residu</th>
                      <th className="p-3 text-right">Berat (Kg)</th>
                      <th className="p-3 text-center">Foto Bukti</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rwResiduData.logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 whitespace-nowrap text-gray-500 font-medium">
                          {new Date(log.createdAt).toLocaleString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="p-3 font-semibold text-gray-800">
                          {log.petugasNama || log.diinputOleh}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-100 text-orange-800 uppercase">
                            {log.kategori}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-gray-900 text-sm">
                          {log.beratKg} {log.unit}
                        </td>
                        <td className="p-3 text-center">
                          {log.fotoResiduUrl ? (
                            <a
                              href={log.fotoResiduUrl.startsWith("http") ? log.fotoResiduUrl : `http://localhost:3000${log.fotoResiduUrl}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:underline font-semibold flex items-center justify-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[16px]">image</span>
                              Lihat Foto
                            </a>
                          ) : (
                            <span className="text-gray-400 font-italic">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Monitoring;
