/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon, Polyline, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { Loader2, Calendar, MapPin, Search, Users, Activity, CheckCircle2, RefreshCw, Plus, Trash2, X, Pencil } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

import {
  KELURAHAN_GEODATA,
  createKknMhsIcon as createStudentIcon,
  createHouseIcon,
} from "../../constants/coblongGeoData";

// Fix Leaflet icons in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});


const createActivityMarkerIcon = () => {
  return L.divIcon({
    className: "custom-activity-icon",
    html: `
      <div style="background-color: #3b82f6; color: white; border-radius: 8px; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.3);">
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
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
  polygon?: [number, number][];
}

// Component to dynamically set map center and zoom
const ChangeMapView: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

// Map component for picking coordinates in Modal
const LocationPickerMap: React.FC<{
  points: [number, number][];
  onChange: (points: [number, number][]) => void;
  radius: number;
}> = ({ points, onChange, radius }) => {
  const defaultCenter: [number, number] = [-6.8915, 107.6107];
  const MapEvents = () => {
    useMapEvents({
      click(e) {
        onChange([...points, [e.latlng.lat, e.latlng.lng]]);
      },
    });
    return null;
  };

  return (
    <MapContainer center={points.length > 0 ? points[0] : defaultCenter} zoom={15} className="w-full h-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapEvents />
      {points.length === 1 && (
        <>
          <Marker position={points[0]} icon={createActivityMarkerIcon()} />
          <Circle center={points[0]} radius={radius} pathOptions={{ color: "#006d37", fillColor: "#006d37", fillOpacity: 0.2 }} />
        </>
      )}
      {points.length === 2 && (
        <>
          {points.map((p, i) => <Marker key={i} position={p} icon={createActivityMarkerIcon()} />)}
          <Polyline positions={points} pathOptions={{ color: "#006d37", dashArray: "4,4" }} />
        </>
      )}
      {points.length >= 3 && (
        <>
          {points.map((p, i) => <Marker key={i} position={p} icon={createActivityMarkerIcon()} />)}
          <Polygon positions={points} pathOptions={{ color: "#10b981", fillColor: "#10b981", fillOpacity: 0.3 }} />
        </>
      )}
    </MapContainer>
  );
};

const MonitoringAbsen: React.FC = () => {
  const [schedules, setSchedules] = useState<ScheduleActivity[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>("");
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [studentLocations, setStudentLocations] = useState<StudentLoc[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5;
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [formData, setFormData] = useState<Partial<ScheduleActivity>>({ radius: 100 });
  const [selectedPos, setSelectedPos] = useState<[number, number][]>([]);

  // Map settings
  const [mapCenter, setMapCenter] = useState<[number, number]>([-6.8915, 107.6107]); // Coblong
  const [mapZoom, setMapZoom] = useState<number>(15);

  const fetchSchedules = async () => {
    try {
      const res = await api.get("/schedules");
      const list = res.data.data || [];
      setSchedules(list);
      if (list.length > 0 && !selectedScheduleId) {
        setSelectedScheduleId(list[0].id);
      }
    } catch (err: any) {
      toast.error("Gagal memuat jadwal kegiatan");
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceAndLocations = async (scheduleId?: string) => {
    setRefreshing(true);
    try {
      if (scheduleId) {
        const attRes = await api.get(`/kegiatan/${scheduleId}/absen`);
        setAttendance(attRes.data.data || []);
      }
      const locRes = await api.get("/mahasiswa/lokasi-aktif");
      setStudentLocations(locRes.data.data || []);
      
      if (scheduleId) {
        const schedule = schedules.find(s => s.id === scheduleId);
        if (schedule && schedule.latitude && schedule.longitude) {
          const lat = Number(schedule.latitude);
          const lng = Number(schedule.longitude);
          if (!isNaN(lat) && !isNaN(lng)) {
            setMapCenter([lat, lng]);
            setMapZoom(17);
          }
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
    fetchAttendanceAndLocations();
  }, []);

  useEffect(() => {
    if (selectedScheduleId) {
      fetchAttendanceAndLocations(selectedScheduleId);
      const interval = setInterval(() => {
        fetchAttendanceAndLocations(selectedScheduleId);
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [selectedScheduleId, schedules]);

  const activeSchedule = useMemo(() => {
    return schedules.find(s => s.id === selectedScheduleId);
  }, [selectedScheduleId, schedules]);

  const filteredSchedules = useMemo(() => {
    if (!searchQuery.trim()) return schedules;
    const query = searchQuery.toLowerCase();
    return schedules.filter(s => s.title.toLowerCase().includes(query) || s.category.toLowerCase().includes(query));
  }, [schedules, searchQuery]);

  const paginatedSchedules = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredSchedules.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSchedules, currentPage]);
  
  const totalPages = Math.ceil(filteredSchedules.length / itemsPerPage);

  const mapElements = useMemo(() => {
    if (!activeSchedule) return null;
    const items = [];
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
    studentLocations.forEach(loc => {
      const lat = Number(loc.latitude);
      const lng = Number(loc.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        let status: "in_radius" | "out_radius" = "out_radius";
        if (activeSchedule && activeSchedule.latitude && activeSchedule.longitude) {
          const sLat = Number(activeSchedule.latitude);
          const sLng = Number(activeSchedule.longitude);
          const rad = Number(activeSchedule.radius || 100);
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
          if (distance <= rad) status = "in_radius";
        }
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

  const handleOpenAddModal = () => {
    setModalMode("add");
    setFormData({ title: "", category: "", location: "", date: "", time: "", radius: 100 });
    setSelectedPos([]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (e: React.MouseEvent, schedule: ScheduleActivity) => {
    e.stopPropagation();
    setModalMode("edit");
    setFormData({
      id: schedule.id,
      title: schedule.title,
      category: schedule.category,
      location: schedule.location || "",
      date: schedule.date.split("T")[0],
      time: schedule.time || "",
      radius: schedule.radius || 100,
    });
    if (schedule.polygon && schedule.polygon.length > 0) {
      setSelectedPos(schedule.polygon);
    } else if (schedule.latitude && schedule.longitude) {
      setSelectedPos([[Number(schedule.latitude), Number(schedule.longitude)]]);
    } else {
      setSelectedPos([]);
    }
    setModalStep(1);
    setIsModalOpen(true);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("Apakah Anda yakin ingin menghapus kegiatan ini?")) return;
    try {
      await api.delete(`/schedules/${id}`);
      toast.success("Kegiatan berhasil dihapus");
      if (selectedScheduleId === id) setSelectedScheduleId("");
      fetchSchedules();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menghapus kegiatan");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.date) {
      toast.error("Harap isi semua field wajib");
      return;
    }
    if (!selectedPos) {
      toast.error("Harap tentukan titik lokasi pada peta");
      return;
    }

    const payload = {
      ...formData,
      category: "Monitoring",
      date: formData.date ? new Date(formData.date).toISOString() : new Date().toISOString(),
      latitude: selectedPos.length === 1 ? selectedPos[0][0] : null,
      longitude: selectedPos.length === 1 ? selectedPos[0][1] : null,
      polygon: selectedPos.length >= 3 ? selectedPos : null,
    };

    try {
      if (modalMode === "add") {
        await api.post("/schedules", payload);
        toast.success("Kegiatan berhasil ditambahkan");
      } else {
        await api.put(`/schedules/${formData.id}`, payload);
        toast.success("Kegiatan berhasil diupdate");
      }
      setIsModalOpen(false);
      fetchSchedules();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Terjadi kesalahan saat menyimpan");
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden -m-6 bg-surface-container">
      {/* Tengah/Kanan: Peta */}
      <div className="flex-1 flex flex-col relative bg-surface-dim">
        <div className="flex-1 relative z-10">
          <MapContainer center={mapCenter} zoom={mapZoom} className="w-full h-full">
            <ChangeMapView center={mapCenter} zoom={mapZoom} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {mapElements}
          </MapContainer>
        </div>

        {/* Panel Bawah: Detail Kehadiran (Menimpa Peta) */}
        {selectedScheduleId && activeSchedule && (
          <div className="absolute bottom-4 left-4 right-4 z-20 bg-white/95 backdrop-blur-md border border-outline-variant/40 rounded-xl shadow-lg p-5 flex flex-col max-h-[40vh]">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <div>
                <h3 className="text-sm font-bold text-on-surface">Status Kehadiran: {activeSchedule.title}</h3>
                <p className="text-[11px] text-on-surface-variant flex items-center gap-1">
                  <Users size={12} /> {attendance.length} Mahasiswa Terdata
                </p>
              </div>
              <button 
                onClick={() => fetchAttendanceAndLocations(selectedScheduleId)}
                className={`p-1.5 rounded-lg hover:bg-surface-container transition-colors ${refreshing ? "animate-spin text-primary" : "text-on-surface-variant"}`}
                title="Refresh Data"
              >
                <RefreshCw size={16} />
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 pr-2">
              {attendance.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {attendance.map((rec) => {
                    const attendedTime = new Date(rec.attendedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
                    let statusBadge = "bg-gray-100 text-gray-700";
                    if (rec.currentStatus === "MASIH_DI_LOKASI") statusBadge = "bg-emerald-100 text-emerald-800 font-bold";
                    else if (rec.currentStatus === "SUDAH_MENINGGALKAN_RADIUS") statusBadge = "bg-rose-100 text-rose-800 font-bold";

                    return (
                      <div key={rec.id} className="border border-outline-variant/30 rounded-lg p-3 bg-white shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="text-xs font-bold text-on-surface line-clamp-1">{rec.student.name}</h4>
                            <p className="text-[10px] text-on-surface-variant">{rec.student.studentProfile?.nim || "-"}</p>
                          </div>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full whitespace-nowrap ${statusBadge}`}>
                            {rec.currentStatus.replace(/_/g, " ")}
                          </span>
                        </div>
                        <div className="text-[10px] flex justify-between items-center text-on-surface-variant">
                          <span className="flex items-center gap-1 text-primary"><CheckCircle2 size={10} /> Hadir {attendedTime}</span>
                          <span className="uppercase font-bold">{rec.method}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-on-surface-variant text-xs flex flex-col items-center gap-2">
                  <Activity size={24} className="text-outline-variant" />
                  Belum ada data kehadiran.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Kiri: Daftar Kegiatan */}
      <div className="w-[420px] bg-white border-l border-outline-variant/40 flex flex-col shrink-0 overflow-hidden z-20 shadow-[4px_0_15px_rgba(0,0,0,0.03)]">
        <div className="p-5 border-b border-outline-variant/30 bg-surface-container-low/30">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-base font-bold text-on-surface">Kegiatan KKN</h3>
              <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mt-0.5">
                {schedules.length} Jadwal Tersedia
              </p>
            </div>
            <button
              onClick={handleOpenAddModal}
              className="bg-primary hover:bg-primary/90 text-white font-bold text-[11px] py-2 px-3.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm uppercase tracking-wider cursor-pointer"
            >
              <Plus size={16} />
              Tambah
            </button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
            <input
              type="text"
              placeholder="Cari kegiatan..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="pl-9 pr-4 py-1.5 border border-outline rounded-lg text-xs w-full focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-surface"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-surface-container-lowest p-4 space-y-3">
          {paginatedSchedules.length > 0 ? (
            paginatedSchedules.map(schedule => (
              <div 
                key={schedule.id}
                onClick={() => setSelectedScheduleId(schedule.id)}
                className={`border rounded-xl p-4 cursor-pointer transition-all duration-200 ${selectedScheduleId === schedule.id ? 'border-primary shadow-md bg-primary/5' : 'border-outline-variant/50 bg-white hover:border-primary/50'}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-on-surface">{schedule.title}</h4>
                    <span className="text-[9px] font-bold px-2 py-0.5 mt-1 inline-block rounded bg-primary-container text-on-primary-container">
                      {schedule.category}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={(e) => handleOpenEditModal(e, schedule)} className="text-primary hover:bg-primary/10 p-1.5 rounded transition-colors"><Pencil size={14} /></button>
                    <button onClick={(e) => handleDelete(e, schedule.id)} className="text-error hover:bg-error/10 p-1.5 rounded transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="mt-3 text-xs text-on-surface-variant space-y-1">
                  <p className="flex items-center gap-1.5"><Calendar size={12}/> {new Date(schedule.date).toLocaleDateString("id-ID")} {schedule.time}</p>
                  <p className="flex items-center gap-1.5"><MapPin size={12}/> {schedule.location || "Lokasi belum diatur"}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-xs text-on-surface-variant pt-8">Tidak ada kegiatan ditemukan</p>
          )}
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-outline-variant/30 flex justify-between items-center bg-surface-container-low">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="px-3 py-1 bg-white border border-outline-variant/50 rounded text-xs font-bold disabled:opacity-50"
            >
              Prev
            </button>
            <span className="text-xs text-on-surface-variant font-medium">
              Halaman {currentPage} dari {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="px-3 py-1 bg-white border border-outline-variant/50 rounded text-xs font-bold disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="absolute inset-0 bg-on-surface/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-[480px] max-w-full overflow-hidden flex flex-col transform transition-all duration-200 max-h-[90vh]">
            <div className="p-5 border-b border-outline-variant/30 flex justify-between items-start bg-surface-container-lowest shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-surface-container p-2 rounded-lg text-on-surface-variant">
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 className="text-[18px] font-bold text-on-surface">{modalMode === "add" ? "Detail Zona Baru" : "Edit Zona"}</h3>
                  <p className="text-[12px] text-on-surface-variant">
                    {selectedPos.length >= 3 ? `Polygon • ${selectedPos.length} titik` : `Radius • 1 titik`}
                  </p>
                </div>
              </div>
              <button
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-variant transition-colors cursor-pointer"
                onClick={() => { setIsModalOpen(false); setFormData({ radius: 100 }); setSelectedPos([]); }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex flex-col gap-4">
              {modalStep === 1 ? (
                <div className="flex flex-col gap-2">
                  <p className="text-[13px] text-on-surface-variant mb-2">
                    Pilih area absensi untuk kegiatan ini:
                  </p>
                  <div className="h-[280px] rounded-lg overflow-hidden border border-outline-variant z-0 relative">
                    <LocationPickerMap
                      points={selectedPos}
                      onChange={(pts) => setSelectedPos(pts)}
                      radius={formData.radius || 100}
                    />
                    <button
                      type="button"
                      onClick={() => setSelectedPos([])}
                      className="absolute bottom-4 right-4 z-[999] bg-white border border-outline-variant shadow-md text-[11px] font-bold text-on-surface-variant px-3 py-1.5 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer"
                    >
                      Reset Titik
                    </button>
                  </div>
                  {selectedPos.length === 1 && (
                    <div className="flex flex-col gap-1.5 mt-2">
                      <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Radius Absensi (m)</label>
                      <input
                        type="number"
                        value={formData.radius}
                        onChange={(e) => setFormData({ ...formData, radius: Number(e.target.value) })}
                        className="px-4 py-2 border border-outline-variant rounded-lg focus:outline-none focus:border-primary text-[14px] w-full"
                        placeholder="100"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                      Nama Kegiatan <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title || ""}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="px-4 py-2.5 border border-outline-variant rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full text-[14px]"
                      placeholder="Nama Kegiatan"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                      Nama Lokasi <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.location || ""}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="px-4 py-2.5 border border-outline-variant rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full text-[14px]"
                      placeholder="Nama Lokasi"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                      Waktu Mulai <span className="text-error">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.date ? formData.date.slice(0, 16) : ""}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="px-4 py-2.5 border border-outline-variant rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full text-[14px]"
                    />
                  </div>
                  
                  {/* Mocked fields from screenshot to look good */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                      Batas Waktu Absen <span className="text-error">*</span>
                    </label>
                    <input
                      type="time"
                      className="px-4 py-2.5 border border-outline-variant rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full text-[14px]"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                      Status Zona <span className="text-error">*</span>
                    </label>
                    <select className="px-4 py-2.5 border border-outline-variant rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full text-[14px] bg-white">
                      <option>🟢 Aktif</option>
                      <option>🔴 Tidak Aktif</option>
                    </select>
                  </div>
                  
                  <div className="mt-2">
                    <h4 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-3">Rule Engine</h4>
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[12px] font-semibold text-on-surface flex items-center gap-2">
                          <span className="text-error">⛔</span> Jika Tidak Hadir
                        </label>
                        <select className="px-4 py-2 border border-outline-variant rounded-lg text-[13px] bg-white">
                          <option>Pilih kegiatan...</option>
                          <option>Potong Poin (-5)</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[12px] font-semibold text-on-surface flex items-center gap-2">
                          <span className="text-error">⛔</span> Jika Terlambat
                        </label>
                        <select className="px-4 py-2 border border-outline-variant rounded-lg text-[13px] bg-white">
                          <option>Pilih kegiatan...</option>
                          <option>Potong Poin (-2)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="p-5 border-t border-outline-variant/30 bg-surface-container-lowest flex justify-end gap-3 shrink-0">
              {modalStep === 1 ? (
                <>
                  <button
                    type="button"
                    className="px-4 py-2 text-[14px] font-bold text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors cursor-pointer"
                    onClick={() => { setIsModalOpen(false); setFormData({ radius: 100 }); setSelectedPos([]); }}
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 text-[14px] font-bold bg-[#0f172a] text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    disabled={selectedPos.length === 2 || selectedPos.length === 0}
                    onClick={() => setModalStep(2)}
                  >
                    <MapPin size={16} /> Lanjut Isi Detail
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="px-4 py-2 text-[14px] font-bold text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors cursor-pointer"
                    onClick={() => setModalStep(1)}
                  >
                    Kembali
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 text-[14px] font-bold bg-[#0f172a] text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                    onClick={handleSubmit}
                  >
                    <CheckCircle2 size={16} /> Buat Zona
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonitoringAbsen;
