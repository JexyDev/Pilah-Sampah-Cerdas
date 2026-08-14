/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon, useMap } from "react-leaflet";
import L from "leaflet";
import { Loader2, Calendar, MapPin, Search, Activity, RefreshCw, Plus, Trash2, X, Pencil, Download, Navigation, ChevronDown, ChevronUp, Layers } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { Pagination } from "../../components/common/Pagination";
import { useAuthStore } from "../../store/useAuthStore";

import {
  KELURAHAN_GEODATA,
  createKknMhsIcon as createStudentIcon,
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

const createActivePresenceIcon = (studentName: string) => {
  const initial = (studentName || "M").charAt(0).toUpperCase();
  return L.divIcon({
    className: "custom-active-student-presence",
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        <div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background-color: #10b981; opacity: 0.35; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="background: linear-gradient(135deg, #059669, #10b981); color: white; border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; border: 2.5px solid white; box-shadow: 0 4px 14px rgba(16,185,129,0.5); font-weight: 900; font-size: 13px;">
          ${initial}
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
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
  attendedAt: string; // Tm (Absen Masuk)
  completedAt?: string; // Ts (Absen Pulang)
  method: "OTOMATIS" | "MANUAL";
  latitude: string;
  longitude: string;
  status: string;
  currentStatus: "MASIH_DI_LOKASI" | "SUDAH_MENINGGALKAN_RADIUS" | "TIDAK_TERDETEKSI" | "BELUM_ABSEN" | "DI_LOKASI_BELUM_ABSEN" | string;
  student: {
    id: string;
    name: string;
    studentProfile?: {
      nim: string;
      jurusan: string;
      isKetua?: boolean;
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

const calculateDurationMinutes = (tmStr?: string, tsStr?: string) => {
  if (!tmStr) return 0;
  const tm = new Date(tmStr).getTime();
  const ts = tsStr ? new Date(tsStr).getTime() : new Date().getTime();
  if (isNaN(tm) || isNaN(ts)) return 0;
  return Math.max(0, Math.floor((ts - tm) / (1000 * 60)));
};

const formatDurationText = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} Menit`;
  if (m === 0) return `${h} Jam`;
  return `${h} Jam ${m} Menit`;
};

// Component to dynamically set map center and zoom
const ChangeMapView: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

const MonitoringAbsen: React.FC = () => {
  const { user } = useAuthStore();
  const [schedules, setSchedules] = useState<ScheduleActivity[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>("");
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [studentLocations, setStudentLocations] = useState<StudentLoc[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const minHoursRequired = Number(localStorage.getItem("TRASHCARE_MIN_ATTENDANCE_HOURS") || localStorage.getItem("TRASHCARE_DPL_MIN_ATTENDANCE_HOURS") || "4");
  const [attendanceFilterTab, setAttendanceFilterTab] = useState<"ALL" | "ACTIVE" | "COMPLETED" | "NOT_ATTENDED">("ALL");
  const [isLegendOpen, setIsLegendOpen] = useState<boolean>(true);

  // Export Attendance Rekap to CSV
  const handleExportCSV = () => {
    if (!attendance || attendance.length === 0) {
      toast.error("Tidak ada data presensi pada kegiatan/periode ini untuk diekspor.");
      return;
    }
    const headers = ["Nama Mahasiswa", "NIM", "Status Absensi", "Waktu Masuk (Tm)", "Waktu Pulang (Ts)", "Durasi (Menit)"];
    const rows = attendance.map((rec) => {
      const isAttended = Boolean(rec.attendedAt);
      const isCompleted = Boolean(rec.completedAt);
      const durationMins = calculateDurationMinutes(rec.attendedAt, rec.completedAt);
      let statusStr = "Belum Absen";
      if (isAttended && !isCompleted) statusStr = "Sedang di Lapangan";
      else if (isCompleted) statusStr = durationMins >= minHoursRequired * 60 ? "Selesai (Memenuhi)" : "Selesai (Kurang Durasi)";

      return [
        `"${(rec.student?.name || "").replace(/"/g, '""')}"`,
        `"${rec.student?.studentProfile?.nim || "-"}"`,
        `"${statusStr}"`,
        `"${rec.attendedAt ? new Date(rec.attendedAt).toLocaleString("id-ID") : "-"}"`,
        `"${rec.completedAt ? new Date(rec.completedAt).toLocaleString("id-ID") : "-"}"`,
        durationMins,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rekap_Presensi_KKN_${activeSchedule?.title || "Kegiatan"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Laporan Presensi CSV berhasil diunduh");
  };

  // Fly Map to Mahasiswa Location
  const handleFocusMahasiswaMap = (rec: AttendanceRecord) => {
    const lat = Number(rec.latitude);
    const lng = Number(rec.longitude);
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      setMapCenter([lat, lng]);
      toast.success(`Fokus lokasi ke: ${rec.student.name.replace(/👑|\(Ketua Kelompok\)/g, "").trim()}`);
    } else {
      toast.error("Koordinat GPS lokasi absensi mahasiswa belum tersedia");
    }
  };

  // Filtered Attendance List based on Selected Filter Tab
  const filteredAttendance = useMemo(() => {
    return attendance.filter((rec) => {
      const isAttended = Boolean(rec.attendedAt);
      const isCompleted = Boolean(rec.completedAt);
      const isActivePresence = isAttended && !isCompleted;

      if (attendanceFilterTab === "ACTIVE") return isActivePresence;
      if (attendanceFilterTab === "COMPLETED") return isCompleted;
      if (attendanceFilterTab === "NOT_ATTENDED") return !isAttended;
      return true;
    });
  }, [attendance, attendanceFilterTab]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [formData, setFormData] = useState<Partial<ScheduleActivity>>({ radius: 100 });
  const [selectedPos, setSelectedPos] = useState<[number, number][]>([]);

  // Map settings
  const [mapCenter, setMapCenter] = useState<[number, number]>([-6.8915, 107.6107]); // Coblong
  const [mapZoom] = useState<number>(15);

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
          setMapCenter([Number(schedule.latitude), Number(schedule.longitude)]);
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
    }
  }, [selectedScheduleId]);

  const activeSchedule = useMemo(() => {
    return schedules.find((s) => s.id === selectedScheduleId);
  }, [schedules, selectedScheduleId]);

  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      const query = searchQuery.toLowerCase();
      return (
        s.title.toLowerCase().includes(query) ||
        (s.location && s.location.toLowerCase().includes(query)) ||
        (s.category && s.category.toLowerCase().includes(query))
      );
    });
  }, [schedules, searchQuery]);

  const totalPages = Math.ceil(filteredSchedules.length / itemsPerPage) || 1;
  const paginatedSchedules = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSchedules.slice(start, start + itemsPerPage);
  }, [filteredSchedules, currentPage, itemsPerPage]);

  // Active student markers with glowing pulse for currently clocked-in students
  const activeStudentMarkers = useMemo(() => {
    const items: React.ReactNode[] = [];
    studentLocations.forEach((loc) => {
      const lat = Number(loc.latitude);
      const lng = Number(loc.longitude);
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        const studentRecord = attendance.find((a) => a.studentId === loc.studentId);
        const isActivePresence = studentRecord && Boolean(studentRecord.attendedAt) && !studentRecord.completedAt;

        items.push(
          <Marker
            key={`student-${loc.studentId}`}
            position={[lat, lng]}
            icon={isActivePresence ? createActivePresenceIcon(loc.student.name) : createStudentIcon("in_radius" as any)}
          >
            <Popup>
              <div className="p-2 font-sans space-y-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="font-extrabold text-slate-900 text-xs">{loc.student.name}</span>
                  {isActivePresence && (
                    <span className="bg-emerald-100 text-emerald-800 font-black text-[9px] px-1.5 py-0.5 rounded-full border border-emerald-300">
                      SEDANG BERADA DI LAPANGAN
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 font-mono">NIM: {loc.student.studentProfile?.nim || "-"}</p>
                <p className="text-[11px] text-slate-500">Update GPS: {new Date(loc.recordedAt).toLocaleTimeString("id-ID")}</p>
                {isActivePresence && studentRecord?.attendedAt && (
                  <div className="mt-2 p-1.5 bg-emerald-50 rounded-lg border border-emerald-200 text-[10px] text-emerald-800 font-extrabold">
                    ⏱️ Tm: {new Date(studentRecord.attendedAt).toLocaleTimeString("id-ID")} | Durasi: {formatDurationText(calculateDurationMinutes(studentRecord.attendedAt))}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      }
    });
    return items;
  }, [studentLocations, attendance]);

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

  const canManageSchedules = ["SUPER_USER", "PEMIMPIN", "PANITIA_TASKFORCE"].includes(
    String(user?.peran || (user as any)?.role || "").toUpperCase()
  );

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

            {/* Kelurahan Boundary Polygons */}
            {Object.values(KELURAHAN_GEODATA).map((kg) => (
              <Polygon
                key={`kkn-kel-poly-${kg.id}`}
                positions={kg.bounds}
                pathOptions={{
                  color: kg.color,
                  fillColor: kg.color,
                  fillOpacity: 0.16,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="text-xs p-1 font-sans">
                    <strong className="font-bold block text-slate-900 mb-1">
                      Kelurahan {kg.name}
                    </strong>
                  </div>
                </Popup>
              </Polygon>
            ))}

            {/* Active Schedule Zone Marker & Circle */}
            {activeSchedule && activeSchedule.latitude && activeSchedule.longitude && (
              <>
                <Marker
                  position={[Number(activeSchedule.latitude), Number(activeSchedule.longitude)]}
                  icon={createActivityMarkerIcon()}
                />
                <Circle
                  center={[Number(activeSchedule.latitude), Number(activeSchedule.longitude)]}
                  radius={Number(activeSchedule.radius || 100)}
                  pathOptions={{ color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.2 }}
                />
              </>
            )}

            {/* Active Student Presence Markers */}
            {activeStudentMarkers}
          </MapContainer>

          {/* Map Controls & Color Legend Overlay */}
          <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-2 pointer-events-auto">
            {!isLegendOpen ? (
              <button
                type="button"
                onClick={() => setIsLegendOpen(true)}
                className="bg-white/95 backdrop-blur-md shadow-xl rounded-2xl px-3.5 py-2 border border-slate-200/90 flex items-center gap-2 text-xs font-black text-slate-800 hover:bg-emerald-50 hover:text-[#009966] transition-all cursor-pointer group"
                title="Tampilkan Legenda Peta"
              >
                <Layers className="w-4 h-4 text-[#009966] group-hover:scale-110 transition-transform" />
                <span>Legenda Peta & Wilayah</span>
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              </button>
            ) : (
              <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/90 shadow-xl max-w-xs font-sans text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                  <span className="font-black text-[11px] uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Legenda Peta &amp; Wilayah
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsLegendOpen(false)}
                    className="text-slate-400 hover:text-slate-700 p-0.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Sembunyikan Legenda"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Status Markers Legend */}
                <div className="space-y-1.5 mb-2.5 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm shrink-0"></span>
                    <span className="text-[11px] font-bold text-slate-700">🟢 Mahasiswa Aktif di Lapangan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-md bg-blue-500 border-2 border-white shadow-sm shrink-0"></span>
                    <span className="text-[11px] font-bold text-slate-700">🔵 Zona Kegiatan KKN (Radius)</span>
                  </div>
                </div>

                {/* Kelurahan Colors Legend */}
                <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block mb-1.5">
                  Batas 6 Kelurahan Coblong
                </span>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
                  {Object.values(KELURAHAN_GEODATA).map((kg) => (
                    <div key={kg.id} className="flex items-center gap-1.5">
                      <span
                        className="w-3 h-3 rounded-md shrink-0 border border-black/10 shadow-2xs"
                        style={{ backgroundColor: kg.color }}
                      ></span>
                      <span className="font-bold text-slate-700 truncate">{kg.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Panel Bawah: Detail Presensi & Durasi Tm - Ts */}
        {activeSchedule && (
          <div className="bg-white/95 backdrop-blur-md border-t border-slate-200 z-20 p-4 shadow-lg max-h-64 flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-slate-900">
                    Rekap Presensi &amp; Keberadaan Lapangan
                  </h3>
                  <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                    Syarat Minimum: {minHoursRequired} Jam (\(\Delta T = T_s - T_m\))
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  {attendance.length} Mahasiswa Terdata • {attendance.filter((a) => Boolean(a.attendedAt) && !a.completedAt).length} Sedang Berada di Lapangan
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Filter Tabs */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-[10px] font-bold text-slate-600">
                  <button
                    onClick={() => setAttendanceFilterTab("ALL")}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      attendanceFilterTab === "ALL" ? "bg-white text-slate-900 shadow-xs" : "hover:text-slate-900"
                    }`}
                  >
                    Semua ({attendance.length})
                  </button>
                  <button
                    onClick={() => setAttendanceFilterTab("ACTIVE")}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      attendanceFilterTab === "ACTIVE" ? "bg-white text-emerald-700 shadow-xs font-black" : "hover:text-slate-900"
                    }`}
                  >
                    🟢 Lapangan ({attendance.filter((a) => Boolean(a.attendedAt) && !a.completedAt).length})
                  </button>
                  <button
                    onClick={() => setAttendanceFilterTab("COMPLETED")}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      attendanceFilterTab === "COMPLETED" ? "bg-white text-blue-700 shadow-xs font-black" : "hover:text-slate-900"
                    }`}
                  >
                    🔵 Selesai ({attendance.filter((a) => Boolean(a.completedAt)).length})
                  </button>
                  <button
                    onClick={() => setAttendanceFilterTab("NOT_ATTENDED")}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      attendanceFilterTab === "NOT_ATTENDED" ? "bg-white text-slate-800 shadow-xs font-black" : "hover:text-slate-900"
                    }`}
                  >
                    ⚪ Belum Absen ({attendance.filter((a) => !a.attendedAt).length})
                  </button>
                </div>

                {/* CSV Download Button */}
                <button
                  onClick={handleExportCSV}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-xl flex items-center gap-1 shadow-xs transition cursor-pointer"
                  title="Unduh Laporan Rekap Presensi (CSV)"
                >
                  <Download size={13} />
                  <span>CSV</span>
                </button>

                {/* Refresh Button */}
                <button
                  onClick={() => fetchAttendanceAndLocations(selectedScheduleId)}
                  className={`p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer ${
                    refreshing ? "animate-spin text-blue-600" : "text-slate-500"
                  }`}
                  title="Refresh Data Presensi"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 pr-1">
              {filteredAttendance.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredAttendance.map((rec) => {
                    const isAttended = Boolean(rec.attendedAt);
                    const isCompleted = Boolean(rec.completedAt);
                    const isActivePresence = isAttended && !isCompleted;
                    const durationMins = calculateDurationMinutes(rec.attendedAt, rec.completedAt);
                    const isDurationSufficient = durationMins >= minHoursRequired * 60;

                    let statusBadge = "bg-slate-100 text-slate-700";
                    let statusText = rec.currentStatus?.replace(/_/g, " ") || "Belum Absen";

                    if (isActivePresence) {
                      statusBadge = "bg-emerald-100 text-emerald-800 font-black border border-emerald-300";
                      statusText = "🟢 SEDANG BERADA DI LAPANGAN";
                    } else if (isCompleted) {
                      statusBadge = isDurationSufficient
                        ? "bg-blue-100 text-blue-800 font-bold border border-blue-300"
                        : "bg-amber-100 text-amber-800 font-bold border border-amber-300";
                      statusText = isDurationSufficient ? "SELESAI (DURASI TERPENUHI)" : `DURASI KURANG (< ${minHoursRequired} JAM)`;
                    }

                    return (
                      <div
                        key={rec.id}
                        onClick={() => handleFocusMahasiswaMap(rec)}
                        className="border border-slate-200 hover:border-emerald-500 rounded-xl p-3 bg-white hover:bg-emerald-50/30 transition-all shadow-2xs flex flex-col justify-between cursor-pointer group"
                        title="Klik untuk fokus lokasi di peta"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="text-xs font-black text-slate-900 group-hover:text-emerald-700 transition-colors flex items-center gap-1">
                              {rec.student.name.replace(/👑|\(Ketua Kelompok\)/g, "").trim()}
                              <Navigation size={11} className="opacity-0 group-hover:opacity-100 text-emerald-600 transition-opacity" />
                            </h4>
                            <p className="text-[10px] text-slate-400 font-mono font-semibold">
                              NIM: {rec.student.studentProfile?.nim || "-"}
                            </p>
                          </div>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full whitespace-nowrap ${statusBadge}`}>
                            {statusText}
                          </span>
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-100 text-[10.5px] flex flex-col gap-1 text-slate-600">
                          {isAttended ? (
                            <>
                              <div className="flex justify-between items-center">
                                <span>Tm (Masuk): <strong>{new Date(rec.attendedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</strong></span>
                                <span>Ts (Pulang): <strong>{rec.completedAt ? new Date(rec.completedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "Aktif"}</strong></span>
                              </div>
                              <div className="flex justify-between items-center text-emerald-700 font-extrabold">
                                <span>Durasi (\(\Delta T\)):</span>
                                <span>{formatDurationText(durationMins)}</span>
                              </div>
                            </>
                          ) : (
                            <span className="text-slate-400 italic">Belum melakukan absensi</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs flex flex-col items-center gap-2">
                  <Activity size={24} className="text-slate-300" />
                  Tidak ada data presensi yang sesuai dengan filter ini.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Kiri: Daftar Kegiatan */}
      <div className="w-[420px] bg-white border-l border-slate-200 flex flex-col shrink-0 overflow-hidden z-20 shadow-lg">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-base font-black text-slate-800">Kegiatan KKN</h3>
              <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mt-0.5">
                {schedules.length} Jadwal Tersedia
              </p>
            </div>
            {canManageSchedules && (
              <button
                onClick={handleOpenAddModal}
                className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] py-2 px-3.5 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs uppercase tracking-wider cursor-pointer"
              >
                <Plus size={16} />
                Tambah
              </button>
            )}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari kegiatan..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs w-full focus:outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all font-semibold"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {paginatedSchedules.length > 0 ? (
            paginatedSchedules.map((schedule) => (
              <div
                key={schedule.id}
                onClick={() => setSelectedScheduleId(schedule.id)}
                className={`border rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                  selectedScheduleId === schedule.id
                    ? "border-blue-500 shadow-md bg-blue-50/40 ring-1 ring-blue-500"
                    : "border-slate-200/80 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-black text-slate-800">{schedule.title}</h4>
                    <span className="text-[9px] font-extrabold px-2 py-0.5 mt-1 inline-block rounded-md bg-blue-100 text-blue-800 uppercase">
                      {schedule.category}
                    </span>
                  </div>
                  {canManageSchedules && (
                    <div className="flex gap-1.5">
                      <button
                        onClick={(e) => handleOpenEditModal(e, schedule)}
                        className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, schedule.id)}
                        className="text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="mt-3 text-xs text-slate-500 space-y-1 font-medium">
                  <p className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-slate-400" />{" "}
                    {new Date(schedule.date).toLocaleDateString("id-ID")} {schedule.time}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-slate-400" />{" "}
                    {schedule.location || "Lokasi belum diatur"}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-xs text-slate-400 pt-8">Tidak ada kegiatan ditemukan</p>
          )}
        </div>

        {/* Pagination Controls */}
        {filteredSchedules.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredSchedules.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        )}
      </div>

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-[480px] max-w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 text-blue-600 p-2 rounded-xl border border-blue-200">
                  <MapPin size={20} />
                </div>
                <h3 className="font-extrabold text-slate-800 text-base">
                  {modalMode === "add" ? "Tambah Kegiatan KKN" : "Edit Kegiatan KKN"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 mb-1">Judul Kegiatan</label>
                <input
                  type="text"
                  required
                  value={formData.title || ""}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Sosialisasi Pemilahan Sampah..."
                  className="w-full h-10 px-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-blue-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={formData.date || ""}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full h-10 px-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-blue-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">Waktu</label>
                  <input
                    type="text"
                    value={formData.time || ""}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    placeholder="08.00 - 12.00 WIB"
                    className="w-full h-10 px-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-blue-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Lokasi Kegiatan</label>
                <input
                  type="text"
                  value={formData.location || ""}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Balai RW 03, Cipaganti"
                  className="w-full h-10 px-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-blue-500 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-extrabold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold cursor-pointer shadow-xs"
                >
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

export default MonitoringAbsen;
