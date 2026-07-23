/**
 * Project: TrashCare
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
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

// Custom DivIcons for Map Marker Bins & Facilities
const createBinIcon = (status: "aman" | "waspada" | "penuh") => {
  let color = "#10B981"; // green
  let pulse = "";
  if (status === "waspada") {
    color = "#F59E0B"; // yellow
  } else if (status === "penuh") {
    color = "#EF4444"; // red
    // Red radar pulse effect for full bins
    pulse = `<span class="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping"></span>`;
  }

  return L.divIcon({
    className: "relative flex h-6 w-6 items-center justify-center",
    html: `
      <div class="relative flex h-6 w-6">
        ${pulse}
        <span class="relative inline-flex rounded-full h-6 w-6 border-4 border-white shadow-md bg-[${color}]" style="background-color: ${color}"></span>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const createFacilityIcon = (jenis: string) => {
  let iconName = "storefront";
  let colorClass = "bg-purple-600"; // fallback

  if (jenis === "loseda" || jenis === "bata_terawang" || jenis === "rumah_maggot") {
    iconName = jenis === "loseda" ? "water_pipe" : jenis === "rumah_maggot" ? "bug_report" : "grid_view";
    colorClass = "bg-[#10b981]"; // Hijau (Organik/Kompos)
  } else if (jenis === "bank_sampah" || jenis === "daur_ulang") {
    iconName = "recycling";
    colorClass = "bg-[#3b82f6]"; // Biru (Daur Ulang)
  } else if (jenis === "tpa" || jenis === "residu") {
    iconName = "delete";
    colorClass = "bg-[#ef4444]"; // Merah (Residu/TPA)
  } else if (jenis === "flash_drop") {
    iconName = "bolt";
    colorClass = "bg-[#eab308]"; // Emas (Flash Drop Challenge)
  }

  return L.divIcon({
    className: "relative flex h-8 w-8 items-center justify-center",
    html: `
      <div class="${colorClass} text-white rounded-lg p-1.5 shadow-lg flex items-center justify-center border-2 border-white">
        <span class="material-symbols-outlined text-[16px] text-white font-bold">${iconName}</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const Monitoring: React.FC = () => {
  const { user } = useAuthStore();
  const { bins, fetchBins } = useMonitoringStore();

  const [facilities, setFacilities] = useState<FacilityItem[]>([]);
  const [kpi, setKpi] = useState<KPIStats | null>(null);
  const [trends, setTrends] = useState<TrendWeek[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Scoped variables based on role
  const displayScope = useMemo(() => {
    if (user?.peran === "LURAH") return "Kelurahan Dago";
    if (user?.peran === "CAMAT") return "Kecamatan Coblong";
    return "Sistem Kota (Semua Wilayah)";
  }, [user]);

  const apiFilterWilayah = useMemo(() => {
    if (user?.peran === "LURAH") return "Kelurahan Dago";
    if (user?.peran === "CAMAT") return "Kecamatan Coblong";
    return undefined;
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      await fetchBins();
      
      const kpiRes = await api.get("/dashboard/kpi", {
        params: { wilayah: apiFilterWilayah },
      });
      const trendRes = await api.get("/dashboard/trend", {
        params: { wilayah: apiFilterWilayah },
      });
      const facRes = await api.get("/facilities");

      if (kpiRes.data.success) setKpi(kpiRes.data.data);
      if (trendRes.data.success) setTrends(trendRes.data.data);
      if (facRes.data.success) setFacilities(facRes.data.data);
    } catch (e) {
      console.error("Gagal memuat analitik dashboard:", e);
      toast.error("Gagal memuat visualisasi real-time");
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
    const groups: Record<string, { bins: Bin[]; latitude: number; longitude: number }> = {};
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
            <MapContainer center={mapCenter} zoom={(user?.peran as string) === "LURAH" ? 14 : (user?.peran as string) === "RW" ? 16 : (user?.peran as string) === "RT" ? 18 : 15} className="h-full w-full">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Bins Layer Grouped by Household */}
              {householdGroups.map((group, idx) => {
                // Determine highest status among bins in group
                let maxPercentage = 0;
                group.bins.forEach(bin => {
                  const vol = Number(bin.currentVolumeLiter);
                  const max = Number(bin.maxCapacityLiter);
                  const pct = max > 0 ? (vol / max) * 100 : 0;
                  if (pct > maxPercentage) maxPercentage = pct;
                });

                let status: "aman" | "waspada" | "penuh" = "aman";
                if (maxPercentage >= 90) status = "penuh";
                else if (maxPercentage >= 70) status = "waspada";

                return (
                  <Marker
                    key={`hh-${idx}`}
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
                              <span className="font-semibold">{bin.category.name}</span>
                              <span className="block text-gray-500 text-[10px]">QR: {bin.qrCode}</span>
                              <span className="block text-gray-700">Terisi: {percentage.toFixed(1)}% ({vol}L / {max}L)</span>
                            </div>
                          );
                        })}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              {/* Facilities Layer */}
              {facilities
                .filter((f) => f.latitude && f.longitude)
                .map((f) => (
                  <Marker
                    key={f.id}
                    position={[Number(f.latitude), Number(f.longitude)]}
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
                ))}
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
    </div>
  );
};

export default Monitoring;
