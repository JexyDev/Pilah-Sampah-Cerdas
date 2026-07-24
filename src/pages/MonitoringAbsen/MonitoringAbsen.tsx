/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import { Loader2, Calendar, MapPin, Search, Users, Activity, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import api from "../../services/api";
import { useAuthStore } from "../../store/useAuthStore";
import toast from "react-hot-toast";

// Fix Leaflet icons in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom Icons for Map markers
const createStudentIcon = (status: "in_radius" | "out_radius") => {
  const color = status === "in_radius" ? "#10B981" : "#EF4444"; // green vs red
  const pulse = status === "in_radius" 
    ? `<span class="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>`
    : "";

  return L.divIcon({
    className: "relative flex h-6 w-6 items-center justify-center",
    html: `
      <div class="relative flex h-6 w-6">
        ${pulse}
        <span class="relative inline-flex rounded-full h-6 w-6 border-4 border-white shadow-md" style="background-color: ${color}"></span>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const createActivityMarkerIcon = () => {
  return L.divIcon({
    className: "relative flex h-8 w-8 items-center justify-center",
    html: `
      <div class="bg-primary text-white rounded-lg p-1.5 shadow-lg flex items-center justify-center border-2 border-white">
        <span class="material-symbols-outlined text-[16px] text-white font-bold">flag</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

interface StudentLoc {
  id: string;
  studentId: string;
  latitude: string;
  longitude: string;
  recordedAt: string;
  student: {
    id: string;
    name: string;
    email: string;
    phone: string;
    studentProfile?: {
      nim: string;
      jurusan: string;
    };
  };
}

interface AttendanceRecord {
  id: string;
  studentId: string;
  scheduleId: string;
  attendedAt: string;
  method: "OTOMATIS" | "MANUAL";
  latitude: string;
  longitude: string;
  status: string;
  currentStatus: "MASIH_DI_LOKASI" | "SUDAH_MENINGGALKAN_RADIUS" | "TIDAK_TERDETEKSI";
  student: {
    id: string;
    name: string;
    studentProfile?: {
      nim: string;
      jurusan: string;
    };
  };
}

// Component to dynamically set map center and zoom
const ChangeMapView: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

interface ScheduleActivity {
  id: string;
  title: string;
  date: string;
  time?: string;
  category: string;
  location?: string;
  latitude?: string | number;
  longitude?: string | number;
  radius?: number;
}

const MonitoringAbsen: React.FC = () => {
  const { user } = useAuthStore();
  const [schedules, setSchedules] = useState<ScheduleActivity[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>("");
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [studentLocations, setStudentLocations] = useState<StudentLoc[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Map settings
  const [mapCenter, setMapCenter] = useState<[number, number]>([-6.8915, 107.6107]); // Coblong
  const [mapZoom, setMapZoom] = useState<number>(15);

  // Load activities list
  const fetchSchedules = async () => {
    try {
      const res = await api.get("/schedules");
      const list = res.data.data || [];
      setSchedules(list);
      
      // Auto select first activity today or latest
      if (list.length > 0 && !selectedScheduleId) {
        setSelectedScheduleId(list[0].id);
      }
    } catch (err: any) {
      toast.error("Gagal memuat jadwal kegiatan");
    } finally {
      setLoading(false);
    }
  };

  // Load attendance list & locations for the selected activity
  const fetchAttendanceAndLocations = async (scheduleId: string) => {
    if (!scheduleId) return;
    setRefreshing(true);
    try {
      // 1. Get attendance list
      const attRes = await api.get(`/kegiatan/${scheduleId}/absen`);
      setAttendance(attRes.data.data || []);

      // 2. Get active student locations
      const locRes = await api.get("/mahasiswa/lokasi-aktif");
      setStudentLocations(locRes.data.data || []);

      // 3. Move map focus if target schedule has location coordinates
      const schedule = schedules.find(s => s.id === scheduleId);
      if (schedule && schedule.latitude && schedule.longitude) {
        const lat = Number(schedule.latitude);
        const lng = Number(schedule.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          setMapCenter([lat, lng]);
          setMapZoom(16);
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  useEffect(() => {
    if (selectedScheduleId) {
      fetchAttendanceAndLocations(selectedScheduleId);

      // Periodic updates every 15 seconds
      const interval = setInterval(() => {
        fetchAttendanceAndLocations(selectedScheduleId);
      }, 15000);

      return () => clearInterval(interval);
    }
  }, [selectedScheduleId, schedules]);

  const activeSchedule = useMemo(() => {
    return schedules.find(s => s.id === selectedScheduleId);
  }, [selectedScheduleId, schedules]);

  // Filtered attendance records based on search query
  const filteredAttendance = useMemo(() => {
    if (!searchQuery.trim()) return attendance;
    const query = searchQuery.toLowerCase();
    return attendance.filter(a => 
      a.student.name.toLowerCase().includes(query) ||
      a.student.studentProfile?.nim.includes(query)
    );
  }, [attendance, searchQuery]);

  // Prepare map rendering elements
  const mapElements = useMemo(() => {
    if (!activeSchedule) return null;

    const items = [];

    // Add activity circle and center flag marker
    if (activeSchedule.latitude && activeSchedule.longitude) {
      const lat = Number(activeSchedule.latitude);
      const lng = Number(activeSchedule.longitude);
      const rad = Number(activeSchedule.radius || 100);

      if (!isNaN(lat) && !isNaN(lng)) {
        items.push(
          <Circle
            key="activity-circle"
            center={[lat, lng]}
            radius={rad}
            pathOptions={{ color: "#006d37", fillColor: "#006d37", fillOpacity: 0.15 }}
          />
        );
        items.push(
          <Marker
            key="activity-marker"
            position={[lat, lng]}
            icon={createActivityMarkerIcon()}
          >
            <Popup>
              <div className="p-2">
                <h4 className="font-bold text-primary">{activeSchedule.title}</h4>
                <p className="text-xs text-gray-600 mt-1">{activeSchedule.location || "-"}</p>
                <p className="text-xs font-semibold text-gray-500">Radius: {rad}m</p>
              </div>
            </Popup>
          </Marker>
        );
      }
    }

    // Add active student markers on the map
    studentLocations.forEach(loc => {
      const lat = Number(loc.latitude);
      const lng = Number(loc.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        // Calculate if this student is in radius of active activity
        let status: "in_radius" | "out_radius" = "out_radius";
        if (activeSchedule && activeSchedule.latitude && activeSchedule.longitude) {
          const sLat = Number(activeSchedule.latitude);
          const sLng = Number(activeSchedule.longitude);
          const rad = Number(activeSchedule.radius || 100);

          // Simple distance logic in js
          const R = 6371e3;
          const phi1 = (lat * Math.PI) / 180;
          const phi2 = (sLat * Math.PI) / 180;
          const deltaPhi = ((sLat - lat) * Math.PI) / 180;
          const deltaLambda = ((sLng - lng) * Math.PI) / 180;
          const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
                    Math.cos(phi1) * Math.cos(phi2) *
                    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;

          if (distance <= rad) {
            status = "in_radius";
          }
        }

        // Only show if user has updated GPS recently
        items.push(
          <Marker
            key={`student-${loc.studentId}`}
            position={[lat, lng]}
            icon={createStudentIcon(status)}
          >
            <Popup>
              <div className="p-2">
                <h4 className="font-bold text-gray-800">{loc.student.name}</h4>
                <p className="text-xs text-gray-500">NIM: {loc.student.studentProfile?.nim || "-"}</p>
                <p className="text-xs text-gray-500 mt-1">Update: {new Date(loc.recordedAt).toLocaleTimeString("id-ID")}</p>
                <div className="mt-2 text-xs">
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${status === "in_radius" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                    {status === "in_radius" ? "Dalam Radius" : "Di Luar Radius"}
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      }
    });

    return items;
  }, [activeSchedule, studentLocations]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden -m-6 bg-surface-container">
      {/* Peta (Leaflet) */}
      <div className="flex-1 relative bg-surface-dim">
        <MapContainer center={mapCenter} zoom={mapZoom} className="w-full h-full z-10">
          <ChangeMapView center={mapCenter} zoom={mapZoom} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {mapElements}
        </MapContainer>
        
        {/* Floating Activity Selector */}
        <div className="absolute top-4 left-4 z-20 bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-outline-variant/30 max-w-sm w-full">
          <h3 className="text-sm font-bold text-on-surface mb-2">Kegiatan Dipantau</h3>
          <select
            value={selectedScheduleId}
            onChange={(e) => setSelectedScheduleId(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-outline rounded-lg bg-surface text-on-surface focus:outline-none focus:border-primary"
          >
            <option value="" disabled>Pilih kegiatan...</option>
            {schedules.map(s => (
              <option key={s.id} value={s.id}>
                {s.title} ({s.category})
              </option>
            ))}
          </select>
          {activeSchedule && (
            <div className="mt-3 text-xs text-on-surface-variant flex flex-col gap-1">
              <span className="flex items-center gap-1.5"><Calendar size={13} /> {new Date(activeSchedule.date).toLocaleDateString("id-ID", { weekday: 'long', day: 'numeric', month: 'long' })}</span>
              <span className="flex items-center gap-1.5"><MapPin size={13} /> {activeSchedule.location || "-"}</span>
            </div>
          )}
        </div>
      </div>

      {/* Panel Daftar Kehadiran (Sidebar Kanan) */}
      <aside className="w-[420px] bg-white border-l border-outline-variant/40 flex flex-col shrink-0 overflow-hidden">
        <div className="p-5 border-b border-outline-variant/30 bg-surface-container-low/30 flex justify-between items-center">
          <div>
            <h3 className="text-base font-bold text-on-surface">Daftar Kehadiran</h3>
            <p className="text-[11px] font-semibold text-on-surface-variant uppercase mt-0.5 tracking-wider flex items-center gap-1">
              <Users size={12} /> {attendance.length} Mahasiswa Hadir
            </p>
          </div>
          <button 
            onClick={() => selectedScheduleId && fetchAttendanceAndLocations(selectedScheduleId)}
            className={`p-2 rounded-lg hover:bg-surface-container transition-colors ${refreshing ? "animate-spin text-primary" : "text-on-surface-variant"}`}
            title="Refresh Data"
          >
            <RefreshCw size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-outline-variant/20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
            <input
              type="text"
              placeholder="Cari nama / NIM..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 border border-outline rounded-lg text-xs w-full focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-surface"
            />
          </div>
        </div>

        {/* List Table */}
        <div className="flex-1 overflow-y-auto">
          {filteredAttendance.length > 0 ? (
            <div className="divide-y divide-outline-variant/20">
              {filteredAttendance.map((rec) => {
                const attendedTime = new Date(rec.attendedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
                
                // Color badges for status
                let statusBadge = "bg-gray-100 text-gray-700";
                let statusLabel = "Tidak Terdeteksi";
                if (rec.currentStatus === "MASIH_DI_LOKASI") {
                  statusBadge = "bg-emerald-100 text-emerald-800 font-bold";
                  statusLabel = "Masih di Lokasi";
                } else if (rec.currentStatus === "SUDAH_MENINGGALKAN_RADIUS") {
                  statusBadge = "bg-rose-100 text-rose-800 font-bold";
                  statusLabel = "Lepas Radius";
                }

                return (
                  <div key={rec.id} className="p-4 hover:bg-surface-container-lowest transition-colors flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-bold text-on-surface">{rec.student.name}</h4>
                        <p className="text-[10px] text-on-surface-variant mt-0.5">
                          NIM: {rec.student.studentProfile?.nim || "-"} • {rec.student.studentProfile?.jurusan || "-"}
                        </p>
                      </div>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full ${statusBadge}`}>
                        {statusLabel}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-on-surface-variant font-medium mt-1">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 size={11} className="text-primary" /> Hadir {attendedTime}
                      </span>
                      <span className="bg-primary-container/20 text-primary-container px-2 py-0.5 rounded-md uppercase font-bold text-[8px]">
                        {rec.method}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-on-surface-variant flex flex-col items-center justify-center gap-3">
              <Activity size={32} className="text-outline-variant" />
              <p className="text-xs">Belum ada mahasiswa yang ter-absen untuk kegiatan ini.</p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

export default MonitoringAbsen;
