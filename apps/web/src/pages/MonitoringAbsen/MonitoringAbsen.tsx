/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon, Polyline, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import {
  Loader2,
  Calendar,
  CalendarDays,
  Clock,
  MapPin,
  Search,
  Activity,
  RefreshCw,
  Plus,
  Trash2,
  X,
  Pencil,
  Download,
  Printer,
  Navigation,
  ChevronDown,
  ChevronUp,
  Layers,
  Maximize2,
  Table as TableIcon,
  LayoutGrid,
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { Pagination } from "../../components/common/Pagination";
import { useAuthStore } from "../../store/useAuthStore";
import { ConfirmModal } from "../../components/common/ConfirmModal";

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
      <div style="background-color: #059669; color: white; border-radius: 8px; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.3);">
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
  endDate?: string;
  time?: string;
  category: string;
  location?: string;
  latitude?: string | number;
  longitude?: string | number;
  radius?: number;
  polygon?: [number, number][];
  kelompokId?: string;
  kelompok?: {
    id: string;
    name: string;
    kelurahan?: string;
  };
}

const DualGeofencePickerModalMap: React.FC<{
  mode: "CIRCLE" | "POLYGON";
  points: [number, number][];
  onChange: (pts: [number, number][]) => void;
  radius: number;
}> = ({ mode, points, onChange, radius }) => {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 100);
    const t2 = setTimeout(() => map.invalidateSize(), 300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [mode, map]);

  useMapEvents({
    click(e) {
      if (mode === "CIRCLE") {
        onChange([[e.latlng.lat, e.latlng.lng]]);
      } else {
        onChange([...points, [e.latlng.lat, e.latlng.lng]]);
      }
    },
  });

  return (
    <>
      {mode === "CIRCLE" && points.length >= 1 && (
        <>
          <Marker position={points[0]} />
          <Circle
            center={points[0]}
            radius={radius}
            pathOptions={{ color: "#059669", fillColor: "#10b981", fillOpacity: 0.25, weight: 2.5 }}
          />
        </>
      )}
      {mode === "POLYGON" && (
        <>
          {points.map((p, i) => (
            <Marker key={i} position={p} />
          ))}
          {points.length === 2 && (
            <Polyline positions={points} pathOptions={{ color: "#f59e0b", dashArray: "5,5", weight: 2 }} />
          )}
          {points.length >= 3 && (
            <Polygon
              positions={points}
              pathOptions={{ color: "#10b981", fillColor: "#10b981", fillOpacity: 0.3, weight: 2 }}
            />
          )}
        </>
      )}
    </>
  );
};

const parseTimeString = (timeStr?: string) => {
  if (!timeStr) return { start: "08:00", end: "12:00" };
  const matches = timeStr.match(/(\d{1,2}[:.]\d{2})\s*(?:-|s\/d|sampai)\s*(\d{1,2}[:.]\d{2})/i);
  if (matches) {
    return {
      start: matches[1].replace(".", ":").padStart(5, "0"),
      end: matches[2].replace(".", ":").padStart(5, "0"),
    };
  }
  return { start: "08:00", end: "12:00" };
};

const calculateHourDifference = (start: string, end: string) => {
  if (!start || !end) return 0;
  const [sH, sM] = start.split(":").map(Number);
  const [eH, eM] = end.split(":").map(Number);
  if (isNaN(sH) || isNaN(sM) || isNaN(eH) || isNaN(eM)) return 0;
  const totalStart = sH * 60 + sM;
  const totalEnd = eH * 60 + eM;
  return Math.max(0, totalEnd - totalStart);
};

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

// Helper to reliably compute map center from schedule data (falling back safely to Kecamatan Coblong center)
const getCenterFromSchedule = (sched?: ScheduleActivity): [number, number] => {
  if (!sched) return [-6.8915, 107.6107];
  if (sched.polygon && Array.isArray(sched.polygon) && sched.polygon.length > 0) {
    const validPts = sched.polygon.filter(
      (p) => Array.isArray(p) && p.length === 2 && !isNaN(p[0]) && !isNaN(p[1]) && Number(p[0]) < 0 && Number(p[1]) > 0
    );
    if (validPts.length > 0) {
      const avgLat = validPts.reduce((acc, p) => acc + Number(p[0]), 0) / validPts.length;
      const avgLng = validPts.reduce((acc, p) => acc + Number(p[1]), 0) / validPts.length;
      if (avgLat < 0 && avgLng > 0) return [avgLat, avgLng];
    }
  }
  const lat = Number(sched.latitude);
  const lng = Number(sched.longitude);
  if (!isNaN(lat) && !isNaN(lng) && lat < 0 && lng > 0) {
    return [lat, lng];
  }
  return [-6.8915, 107.6107];
};

// Component to dynamically set map center, zoom, and invalidate size on layout changes
const ChangeMapView: React.FC<{
  center: [number, number];
  zoom: number;
  mode?: string;
}> = ({ center, zoom, mode }) => {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);

  useEffect(() => {
    // Invalidate size immediately, and at key intervals of the CSS transition
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 80);
    const t2 = setTimeout(() => map.invalidateSize(), 200);
    const t3 = setTimeout(() => map.invalidateSize(), 350);
    const t4 = setTimeout(() => map.invalidateSize(), 500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [mode, map]);

  useEffect(() => {
    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [map]);

  return null;
};

const MonitoringAbsen: React.FC = () => {
  const { user } = useAuthStore();
  const userRole = String(user?.peran || (user as any)?.role || "").toUpperCase();
  const isDpl = userRole === "DPL" || userRole === "DOSEN_PEMBIMBING";

  const [schedules, setSchedules] = useState<ScheduleActivity[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>("");
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [studentLocations, setStudentLocations] = useState<StudentLoc[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [attendanceFilterTab, setAttendanceFilterTab] = useState<"ALL" | "ACTIVE" | "COMPLETED" | "NOT_ATTENDED">("ALL");
  const [studentSearch, setStudentSearch] = useState<string>("");
  const [panelViewMode, setPanelViewMode] = useState<"split" | "expanded" | "fullscreen" | "minimized">("split");
  const [displayMode, setDisplayMode] = useState<"table" | "cards">("table");
  const [isLegendOpen, setIsLegendOpen] = useState<boolean>(true);

  const activeSchedule = useMemo(() => {
    return schedules.find((s) => s.id === selectedScheduleId);
  }, [schedules, selectedScheduleId]);

  const scheduleTargetHours = useMemo(() => {
    if (!activeSchedule?.time) return 4;
    const parsed = parseTimeString(activeSchedule.time);
    const diffMins = calculateHourDifference(parsed.start, parsed.end);
    const hours = Math.round(diffMins / 60);
    return hours > 0 ? hours : 4;
  }, [activeSchedule]);

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
      else if (isCompleted) statusStr = durationMins >= scheduleTargetHours * 60 ? "Selesai (Memenuhi)" : "Selesai (Kurang Durasi)";

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

  // Cetak Berita Acara Presensi PDF/Print
  const handlePrintAttendanceReport = () => {
    if (!attendance || attendance.length === 0) {
      toast.error("Tidak ada data presensi untuk dicetak.");
      return;
    }
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Gagal membuka jendela cetak. Izinkan popup di browser.");
      return;
    }

    const todayStr = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });

    const activeSched = schedules.find((s) => s.id === selectedScheduleId);

    const rowsHtml = attendance.map((rec, i) => {
      const durationMins = calculateDurationMinutes(rec.attendedAt, rec.completedAt);
      const isAttended = Boolean(rec.attendedAt);
      const isCompleted = Boolean(rec.completedAt);
      let statusStr = "Belum Absen";
      let statusColor = "#64748b";
      if (isAttended && !isCompleted) {
        statusStr = "Sedang di Lokasi";
        statusColor = "#0284c7";
      } else if (isCompleted) {
        if (durationMins >= scheduleTargetHours * 60) {
          statusStr = "Hadir (Memenuhi Syarat)";
          statusColor = "#059669";
        } else {
          statusStr = "Hadir (Kurang Jam)";
          statusColor = "#d97706";
        }
      }

      return `
        <tr>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${i + 1}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px; font-weight: bold;">${rec.student?.name || "-"}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px; font-family: monospace;">${rec.student?.studentProfile?.nim || "-"}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px; font-weight: bold; color: ${statusColor};">${statusStr}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${rec.attendedAt ? new Date(rec.attendedAt).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' }) : "-"}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${rec.completedAt ? new Date(rec.completedAt).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' }) : "-"}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px; font-weight: bold;">${formatDurationText(durationMins)}</td>
        </tr>
      `;
    }).join("");

    const presentCount = attendance.filter((r) => Boolean(r.attendedAt)).length;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Daftar Hadir Presensi KKN - ${activeSched?.title || "Kegiatan"}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 10.5pt; color: #0f172a; line-height: 1.4; padding: 15px; }
          .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 15px; }
          .header h2 { margin: 0; font-size: 13pt; text-transform: uppercase; }
          .header h3 { margin: 4px 0 0 0; font-size: 11pt; font-weight: normal; color: #334155; }
          .meta-table { width: 100%; margin-bottom: 12px; font-size: 9.5pt; }
          .meta-table td { padding: 3px 0; }
          table.data { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 9pt; }
          table.data th { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 7px; font-weight: bold; text-align: left; }
          .signature-section { margin-top: 30px; display: flex; justify-content: space-between; font-size: 9.5pt; page-break-inside: avoid; }
          .sig-box { width: 200px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>KECAMATAN COBLONG — KOTA BANDUNG</h2>
          <h3>BERITA ACARA & DAFTAR HADIR KEGIATAN KKN TRASHCARE</h3>
        </div>

        <table class="meta-table">
          <tr>
            <td width="18%"><strong>Kegiatan</strong></td>
            <td width="42%">: ${activeSched?.title || "Kegiatan KKN"}</td>
            <td width="18%"><strong>Tanggal</strong></td>
            <td width="22%">: ${activeSched?.date || todayStr}</td>
          </tr>
          <tr>
            <td><strong>Lokasi Geofence</strong></td>
            <td>: ${activeSched?.location || "Kecamatan Coblong"}</td>
            <td><strong>Kehadiran</strong></td>
            <td>: <strong>${presentCount}/${attendance.length} Mahasiswa</strong></td>
          </tr>
        </table>

        <table class="data">
          <thead>
            <tr>
              <th width="5%" style="text-align:center;">No</th>
              <th width="28%">Nama Mahasiswa</th>
              <th width="14%">NIM</th>
              <th width="19%" style="text-align:center;">Status Presensi</th>
              <th width="11%" style="text-align:center;">Masuk (Tm)</th>
              <th width="11%" style="text-align:center;">Pulang (Ts)</th>
              <th width="12%" style="text-align:center;">Durasi</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="signature-section">
          <div class="sig-box">
            <p>Ketua Kelompok KKN,</p>
            <div style="height: 55px;"></div>
            <p style="text-decoration: underline; font-weight: bold;">( ........................................ )</p>
          </div>
          <div class="sig-box">
            <p>Dosen Pembimbing Lapangan,</p>
            <div style="height: 55px;"></div>
            <p style="text-decoration: underline; font-weight: bold;">( ........................................ )</p>
          </div>
        </div>

        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
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

  // Filtered Attendance List based on Selected Filter Tab and Student Search
  const filteredAttendance = useMemo(() => {
    return attendance.filter((rec) => {
      const isAttended = Boolean(rec.attendedAt);
      const isCompleted = Boolean(rec.completedAt);
      const isActivePresence = isAttended && !isCompleted;

      if (attendanceFilterTab === "ACTIVE" && !isActivePresence) return false;
      if (attendanceFilterTab === "COMPLETED" && !isCompleted) return false;
      if (attendanceFilterTab === "NOT_ATTENDED" && isAttended) return false;

      if (studentSearch.trim()) {
        const q = studentSearch.toLowerCase();
        const name = (rec.student?.name || "").toLowerCase();
        const nim = (rec.student?.studentProfile?.nim || "").toLowerCase();
        return name.includes(q) || nim.includes(q);
      }
      return true;
    });
  }, [attendance, attendanceFilterTab, studentSearch]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [modalStep, setModalStep] = useState<1 | 2>(1); // 1: Info & Waktu, 2: Area Geofence
  const [geofenceMode, setGeofenceMode] = useState<"CIRCLE" | "POLYGON">("CIRCLE");
  const [formData, setFormData] = useState<Partial<ScheduleActivity>>({
    radius: 100,
    category: "Sosialisasi",
  });
  const [isCustomCategory, setIsCustomCategory] = useState<boolean>(false);
  const [customCategoryText, setCustomCategoryText] = useState<string>("");
  const [activityMinHours, setActivityMinHours] = useState<number>(4);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("08:00");
  const [endTime, setEndTime] = useState<string>("12:00");
  const [manualLat, setManualLat] = useState<string>("");
  const [manualLng, setManualLng] = useState<string>("" );
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedPos, setSelectedPos] = useState<[number, number][]>([]);
  const [deleteScheduleId, setDeleteScheduleId] = useState<string | null>(null);
  const [isDeletingSchedule, setIsDeletingSchedule] = useState(false);
  const [isSubmittingSchedule, setIsSubmittingSchedule] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Map settings
  const [mapCenter, setMapCenter] = useState<[number, number]>([-6.8915, 107.6107]); // Coblong
  const [mapZoom] = useState<number>(15);

  const fetchGroups = async () => {
    try {
      const res = await api.get("/kelompok");
      const list = res.data?.groups || res.data?.data || (Array.isArray(res.data) ? res.data : []);
      setGroups(list);
    } catch (_e) {
      // Ignored
    }
  };

  const fetchSchedules = async () => {
    try {
      const res = await api.get("/schedules");
      const list = res.data.data || [];
      setSchedules(list);
      if (list.length > 0) {
        setSelectedScheduleId((prev) => {
          if (prev && list.some((s: any) => s.id === prev)) return prev;
          const initialCenter = getCenterFromSchedule(list[0]);
          setMapCenter(initialCenter);
          return list[0].id;
        });
      } else {
        setMapCenter([-6.8915, 107.6107]);
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
    } catch (err: any) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
    fetchGroups();
  }, []);

  useEffect(() => {
    if (selectedScheduleId) {
      fetchAttendanceAndLocations(selectedScheduleId);
    }
  }, [selectedScheduleId]);

  useEffect(() => {
    if (activeSchedule) {
      const center = getCenterFromSchedule(activeSchedule);
      setMapCenter(center);
    }
  }, [activeSchedule]);

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

  const STANDARD_CATEGORIES = [
    "Sosialisasi",
    "Pengangkutan",
    "Monitoring",
    "Workshop",
    "Rapat",
    "Aksi Bersih",
    "Pelatihan Kompos & Loseda",
    "Validasi Tempat Sampah",
  ];

  const getKelompokLocationInfo = (group?: any) => {
    if (!group) {
      return {
        kelurahan: "Coblong",
        rws: [] as string[],
        fullAddress: "Kecamatan Coblong, Kota Bandung",
        presetLocations: [] as Array<{ label: string; address: string }>,
        centroid: [-6.8906, 107.6150] as [number, number],
      };
    }

    const kelurahan = group.kelurahan || "Coblong";
    let rws: string[] = [];
    if (Array.isArray(group.cakupanRw)) {
      rws = group.cakupanRw.map((rw: any) => {
        const num = String(rw).replace(/\D/g, "");
        return num ? `RW ${num.padStart(2, "0")}` : String(rw);
      });
    } else if (typeof group.cakupanRw === "string" && group.cakupanRw) {
      rws = group.cakupanRw
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean);
    }

    // Centroid dari data resmi GIS Coblong
    const cleanKelName = kelurahan.toUpperCase().replace(/\s+/g, "_");
    let centroid: [number, number] = [-6.8906, 107.6150];
    for (const [key, val] of Object.entries(KELURAHAN_GEODATA)) {
      if (
        key.includes(cleanKelName) ||
        cleanKelName.includes(key) ||
        val.name.toLowerCase() === kelurahan.toLowerCase()
      ) {
        centroid = val.centroid;
        break;
      }
    }

    const defaultRwName =
      rws.length > 0
        ? rws.length === 1
          ? `Balai ${rws[0]}`
          : `Wilayah Dampingan ${rws.join(", ")}`
        : "Balai Pertemuan Warga";
    const fullAddress = `${defaultRwName}, Kelurahan ${kelurahan}, Kecamatan Coblong, Kota Bandung`;

    const presetLocations: Array<{ label: string; address: string }> = [];
    rws.forEach((rw) => {
      presetLocations.push({
        label: `Balai ${rw}`,
        address: `Balai ${rw}, Kelurahan ${kelurahan}, Kecamatan Coblong, Kota Bandung`,
      });
    });
    presetLocations.push({
      label: `Kantor Kel. ${kelurahan}`,
      address: `Kantor Kelurahan ${kelurahan}, Kecamatan Coblong, Kota Bandung`,
    });

    return {
      kelurahan,
      rws,
      fullAddress,
      presetLocations,
      centroid,
    };
  };

  const validateStep1 = () => {
    const errors: Record<string, string> = {};
    if (!formData.title?.trim()) {
      errors.title = "Judul kegiatan wajib diisi";
    }
    if (isCustomCategory && !customCategoryText.trim()) {
      errors.category = "Nama kategori kustom wajib diisi";
    }
    if (!startDate) {
      errors.startDate = "Tanggal mulai pelaksanaan wajib diisi";
    }
    if (!endDate) {
      errors.endDate = "Tanggal selesai pelaksanaan wajib diisi";
    } else if (startDate && endDate < startDate) {
      errors.endDate = "Tanggal selesai tidak boleh lebih awal dari tanggal mulai";
    }
    if (!startTime) {
      errors.startTime = "Jam mulai wajib diisi";
    }
    if (!endTime) {
      errors.endTime = "Jam selesai wajib diisi";
    } else if (startTime && endTime) {
      const diff = calculateHourDifference(startTime, endTime);
      if (diff <= 0) {
        errors.endTime = "Jam selesai harus lebih besar dari jam mulai";
      }
    }
    if (!formData.location?.trim()) {
      errors.location = "Lokasi deskriptif kegiatan wajib diisi";
    }
    return errors;
  };

  const validateStep2 = () => {
    const errors: Record<string, string> = {};
    if (geofenceMode === "CIRCLE") {
      const r = Number(formData.radius);
      if (isNaN(r) || r < 30) {
        errors.radius = "Ukuran radius minimal 30 meter";
      }
      if (!selectedPos || selectedPos.length === 0) {
        errors.geofence = "Titik pusat geofence belum ditentukan pada peta";
      }
    } else {
      if (!selectedPos || selectedPos.length < 3) {
        errors.geofence = `Polygon membutuhkan minimal 3 titik sudut pada peta (saat ini ${selectedPos?.length || 0} titik)`;
      }
    }
    return errors;
  };

  const handleOpenAddModal = () => {
    const today = new Date().toISOString().split("T")[0];
    setModalMode("add");
    setModalStep(1);
    setGeofenceMode("CIRCLE");
    setStartDate(today);
    setEndDate(today);
    setStartTime("08:00");
    setEndTime("12:00");
    setActivityMinHours(4);
    setIsCustomCategory(false);
    setCustomCategoryText("");
    setFormErrors({});

    const targetGroup = isDpl && groups.length > 0 ? groups[0] : groups[0];
    const defaultKelompokId = isDpl && targetGroup ? targetGroup.id : (groups[0]?.id || "");
    const locInfo = getKelompokLocationInfo(targetGroup);

    setFormData({
      title: "",
      category: "Sosialisasi",
      location: locInfo.fullAddress,
      radius: 100,
      kelompokId: defaultKelompokId,
    });
    setSelectedPos([[locInfo.centroid[0], locInfo.centroid[1]]]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (e: React.MouseEvent, schedule: ScheduleActivity) => {
    e.stopPropagation();
    setModalMode("edit");
    setModalStep(1);
    setFormErrors({});
    const dateStr = schedule.date ? schedule.date.split("T")[0] : new Date().toISOString().split("T")[0];
    setStartDate(dateStr);
    setEndDate(schedule.endDate ? schedule.endDate.split("T")[0] : dateStr);
    const parsedTime = parseTimeString(schedule.time);
    setStartTime(parsedTime.start);
    setEndTime(parsedTime.end);
    const diffMins = calculateHourDifference(parsedTime.start, parsedTime.end);
    setActivityMinHours(Math.max(1, Math.round(diffMins / 60)));

    const cat = schedule.category || "Sosialisasi";
    if (STANDARD_CATEGORIES.includes(cat)) {
      setIsCustomCategory(false);
      setCustomCategoryText("");
    } else {
      setIsCustomCategory(true);
      setCustomCategoryText(cat);
    }

    const defaultKelompokId = schedule.kelompokId || (isDpl && groups.length > 0 ? groups[0].id : "");

    setFormData({
      id: schedule.id,
      title: schedule.title,
      category: cat,
      location: schedule.location || "",
      radius: schedule.radius || 100,
      kelompokId: defaultKelompokId,
    });
    if (schedule.polygon && Array.isArray(schedule.polygon) && schedule.polygon.length >= 3) {
      setGeofenceMode("POLYGON");
      setSelectedPos(schedule.polygon);
    } else if (schedule.latitude && schedule.longitude) {
      setGeofenceMode("CIRCLE");
      setSelectedPos([[Number(schedule.latitude), Number(schedule.longitude)]]);
    } else {
      setGeofenceMode("CIRCLE");
      setSelectedPos([[-6.8915, 107.6107]]);
    }
    setIsModalOpen(true);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteScheduleId(id);
  };

  const handleConfirmDeleteSchedule = async () => {
    if (!deleteScheduleId) return;
    try {
      setIsDeletingSchedule(true);
      await api.delete(`/schedules/${deleteScheduleId}`);
      toast.success("Kegiatan berhasil dihapus");
      if (selectedScheduleId === deleteScheduleId) setSelectedScheduleId("");
      setDeleteScheduleId(null);
      fetchSchedules();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menghapus kegiatan");
    } finally {
      setIsDeletingSchedule(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Jika pengguna masih di Step 1 (Detail & Waktu), arahkan ke Step 2 (Area Geofence Maps) terlebih dahulu
    if (modalStep === 1) {
      const step1Errors = validateStep1();
      if (Object.keys(step1Errors).length > 0) {
        setFormErrors(step1Errors);
        const firstErr = Object.values(step1Errors)[0];
        toast.error(`Periksa Form: ${firstErr}`);
        return;
      }
      setFormErrors({});
      setModalStep(2);
      return;
    }

    // Step 2: Validasi penuh sebelum simpan kegiatan ke database
    const step1Errors = validateStep1();
    const step2Errors = validateStep2();
    const combinedErrors = { ...step1Errors, ...step2Errors };

    if (Object.keys(combinedErrors).length > 0) {
      setFormErrors(combinedErrors);
      if (Object.keys(step1Errors).length > 0) {
        setModalStep(1);
        const firstErr = Object.values(step1Errors)[0];
        toast.error(`Periksa Form: ${firstErr}`);
      } else {
        const firstErr = Object.values(step2Errors)[0];
        toast.error(`Periksa Geofence: ${firstErr}`);
      }
      return;
    }

    setFormErrors({});

    const timeFormatted = `${startTime} - ${endTime} WIB`;
    const finalCategory = isCustomCategory
      ? customCategoryText.trim()
      : formData.category || "Sosialisasi";

    const targetKelompokId = isDpl && groups.length > 0
      ? (formData.kelompokId || groups[0].id)
      : (formData.kelompokId || undefined);

    const payload = {
      title: (formData.title || "").trim(),
      category: finalCategory,
      date: new Date(startDate).toISOString(),
      time: timeFormatted,
      location: (formData.location || "").trim(),
      kelompokId: targetKelompokId,
      radius: geofenceMode === "CIRCLE" ? Number(formData.radius) || 100 : undefined,
      latitude: geofenceMode === "CIRCLE" && selectedPos.length >= 1 ? Number(selectedPos[0][0]) : undefined,
      longitude: geofenceMode === "CIRCLE" && selectedPos.length >= 1 ? Number(selectedPos[0][1]) : undefined,
      polygon: geofenceMode === "POLYGON" && selectedPos.length >= 3 ? selectedPos : undefined,
    };

    try {
      setIsSubmittingSchedule(true);
      if (modalMode === "add") {
        await api.post("/schedules", payload);
        toast.success("Kegiatan KKN berhasil ditambahkan");
      } else {
        await api.put(`/schedules/${formData.id}`, payload);
        toast.success("Kegiatan KKN berhasil diperbarui");
      }
      setIsModalOpen(false);
      fetchSchedules();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Terjadi kesalahan saat menyimpan jadwal kegiatan");
    } finally {
      setIsSubmittingSchedule(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  const canManageSchedules = [
    "SUPER_USER",
    "ADMIN_DLH",
    "PEMIMPIN",
    "PANITIA_TASKFORCE",
    "DPL",
    "DOSEN_PEMBIMBING",
    "DEVELOPER",
  ].includes(userRole);

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden -m-6 bg-surface-container">
      {/* Tengah/Kanan: Peta & Panel Rekap Presensi Dinamis */}
      <div className="flex-1 flex flex-col relative bg-surface-dim overflow-hidden">
        {/* View Mode Switcher Header Bar */}
        <div className="bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-2 flex items-center justify-between z-30 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              {activeSchedule ? `Kegiatan: ${activeSchedule.title}` : "Monitoring Presensi KKN"}
            </h2>
            {activeSchedule && (
              <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">
                {activeSchedule.category}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase hidden sm:inline">Mode Tampilan:</span>
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-[11px] font-bold text-slate-600">
              <button
                type="button"
                onClick={() => setPanelViewMode("split")}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  panelViewMode === "split" ? "bg-white text-emerald-800 shadow-xs font-black" : "hover:text-slate-900"
                }`}
                title="Tampilan Kombinasi Peta di Atas & Tabel di Bawah"
              >
                <span>⛶</span>
                <span className="hidden md:inline">Mode Split</span>
              </button>
              <button
                type="button"
                onClick={() => setPanelViewMode("fullscreen")}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  panelViewMode === "fullscreen" ? "bg-emerald-600 text-white shadow-xs font-black" : "hover:text-slate-900"
                }`}
                title="Buka Tabel Rekap Presensi Layar Penuh (100% Lega)"
              >
                <Maximize2 size={12} />
                <span>Tabel Layar Penuh</span>
              </button>
              <button
                type="button"
                onClick={() => setPanelViewMode("expanded")}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  panelViewMode === "expanded" ? "bg-white text-emerald-800 shadow-xs font-black" : "hover:text-slate-900"
                }`}
                title="Perluas Panel Rekap (Tabel 75% Layar)"
              >
                <span>⤡</span>
                <span className="hidden md:inline">Perluas Tabel</span>
              </button>
              <button
                type="button"
                onClick={() => setPanelViewMode("minimized")}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  panelViewMode === "minimized" ? "bg-white text-slate-900 shadow-xs font-black" : "hover:text-slate-900"
                }`}
                title="Fokus Peta Penuh (Minimalkan Tabel)"
              >
                <Layers size={12} />
                <span className="hidden md:inline">Peta Penuh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Area Peta Leaflet (Tampil saat bukan mode Layar Penuh) */}
        {panelViewMode !== "fullscreen" && (
          <div
            className={`relative z-10 transition-all duration-300 ${
              panelViewMode === "minimized"
                ? "flex-1 h-[calc(100%-56px)]"
                : panelViewMode === "expanded"
                ? "h-[200px] shrink-0"
                : "flex-1 min-h-[280px]"
            }`}
          >
            <MapContainer center={mapCenter} zoom={mapZoom} className="w-full h-full">
              <ChangeMapView center={mapCenter} zoom={mapZoom} mode={panelViewMode} />
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

              {/* Active Schedule Zone Marker & Circle / Polygon Geofence */}
              {activeSchedule && (
                <>
                  {activeSchedule.polygon &&
                  Array.isArray(activeSchedule.polygon) &&
                  activeSchedule.polygon.length >= 3 ? (
                    <Polygon
                      positions={activeSchedule.polygon}
                      pathOptions={{
                        color: "#10b981",
                        fillColor: "#10b981",
                        fillOpacity: 0.25,
                        weight: 2,
                      }}
                    >
                      <Popup>
                        <div className="text-xs p-1 font-sans">
                          <strong className="font-bold block text-slate-900 mb-0.5">
                            {activeSchedule.title}
                          </strong>
                          <span className="text-slate-500 font-semibold">
                            Area Poligon ({activeSchedule.polygon.length} Titik Sudut)
                          </span>
                        </div>
                      </Popup>
                    </Polygon>
                  ) : (() => {
                    const lat = Number(activeSchedule.latitude);
                    const lng = Number(activeSchedule.longitude);
                    if (!isNaN(lat) && !isNaN(lng) && lat < 0 && lng > 0) {
                      return (
                        <>
                          <Marker
                            position={[lat, lng]}
                            icon={createActivityMarkerIcon()}
                          />
                          <Circle
                            center={[lat, lng]}
                            radius={Number(activeSchedule.radius || 100)}
                            pathOptions={{
                              color: "#3b82f6",
                              fillColor: "#3b82f6",
                              fillOpacity: 0.2,
                              weight: 2,
                            }}
                          >
                            <Popup>
                              <div className="text-xs p-1 font-sans">
                                <strong className="font-bold block text-slate-900 mb-0.5">
                                  {activeSchedule.title}
                                </strong>
                                <span className="text-slate-500 font-semibold">
                                  Radius Area: {activeSchedule.radius || 100} Meter
                                </span>
                              </div>
                            </Popup>
                          </Circle>
                        </>
                      );
                    }
                    return null;
                  })()}
                </>
              )}

              {/* Active Student Presence Markers */}
              {activeStudentMarkers}
            </MapContainer>

            {/* Map Controls & Color Legend Overlay */}
            <div
              className="absolute bottom-4 right-4 flex flex-col gap-2 pointer-events-auto select-none"
              style={{ zIndex: 1000, isolation: "isolate" }}
            >
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
                      <span className="w-3.5 h-3.5 rounded-md bg-emerald-600 border-2 border-white shadow-sm shrink-0"></span>
                      <span className="text-[11px] font-bold text-slate-700">📍 Zona Geofence KKN (Radius/Polygon)</span>
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
        )}

        {/* Panel Bawah: Detail Presensi & Durasi Tm - Ts (Modern, Expandable, Full-Width Table) */}
        {activeSchedule ? (
          <div
            className={`bg-white/95 backdrop-blur-md border-t border-slate-200 z-20 flex flex-col shadow-xl transition-all duration-300 ${
              panelViewMode === "fullscreen"
                ? "flex-1 h-full p-6"
                : panelViewMode === "expanded"
                ? "flex-1 p-5 overflow-hidden"
                : panelViewMode === "minimized"
                ? "h-14 px-4 py-2.5 justify-center cursor-pointer hover:bg-emerald-50/50"
                : "h-[390px] max-h-[55%] p-4"
            }`}
          >
            {/* Minimized View Bar */}
            {panelViewMode === "minimized" ? (
              <div
                onClick={() => setPanelViewMode("split")}
                className="flex items-center justify-between w-full"
              >
                <div className="flex items-center gap-3">
                  <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                    <Activity size={16} />
                  </span>
                  <div>
                    <span className="text-xs font-black text-slate-900">
                      Rekap Presensi Mahasiswa:
                    </span>{" "}
                    <span className="text-xs font-bold text-slate-600">
                      {attendance.length} Mahasiswa Terdata •{" "}
                      <strong className="text-emerald-700">
                        {attendance.filter((a) => Boolean(a.attendedAt) && !a.completedAt).length} Sedang di Lapangan
                      </strong>
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black text-emerald-700 bg-emerald-100 px-3 py-1 rounded-xl hover:bg-emerald-200 transition">
                    Buka Panel Rekap ↗️
                  </span>
                </div>
              </div>
            ) : (
              /* Expanded / Fullscreen / Split View Content */
              <div className="flex flex-col h-full overflow-hidden space-y-3">
                {/* Header Panel Atas */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 pb-2 border-b border-slate-100 shrink-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                          <Activity size={16} className="text-emerald-600" />
                          Rekap Presensi &amp; Keberadaan Lapangan
                        </h3>
                        <div
                          className="flex items-center gap-1.5 bg-emerald-50 text-emerald-900 px-2.5 py-0.5 rounded-full border border-emerald-300 text-[10px] font-black"
                          title="Target durasi kegiatan ditentukan dan diedit langsung melalui form Jadwal Kegiatan"
                        >
                          <span>⏱️ Target Kegiatan:</span>
                          <span className="font-extrabold text-emerald-950">{scheduleTargetHours} Jam</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                        {attendance.length} Mahasiswa Terdata •{" "}
                        <strong className="text-emerald-700">
                          {attendance.filter((a) => Boolean(a.attendedAt) && !a.completedAt).length} Sedang di Lapangan
                        </strong>{" "}
                        • {attendance.filter((a) => Boolean(a.completedAt)).length} Selesai Absen
                      </p>
                    </div>
                  </div>

                  {/* Controls Kanan: Search, Filter Tabs, Tampilan, Export */}
                  <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-between lg:justify-end">
                    {/* Live Search Mahasiswa */}
                    <div className="relative min-w-[170px] sm:min-w-[210px]">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                      <input
                        type="text"
                        placeholder="Cari nama / NIM..."
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500 bg-slate-50 focus:bg-white transition-all shadow-2xs"
                      />
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-[10px] font-bold text-slate-600 border border-slate-200/60">
                      <button
                        onClick={() => setAttendanceFilterTab("ALL")}
                        className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                          attendanceFilterTab === "ALL" ? "bg-white text-slate-900 shadow-xs font-black" : "hover:text-slate-900"
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
                          attendanceFilterTab === "COMPLETED" ? "bg-white text-emerald-800 shadow-xs font-black" : "hover:text-slate-900"
                        }`}
                      >
                        ✨ Selesai ({attendance.filter((a) => Boolean(a.completedAt)).length})
                      </button>
                      <button
                        onClick={() => setAttendanceFilterTab("NOT_ATTENDED")}
                        className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                          attendanceFilterTab === "NOT_ATTENDED" ? "bg-white text-slate-800 shadow-xs font-black" : "hover:text-slate-900"
                        }`}
                      >
                        ⚪ Belum ({attendance.filter((a) => !a.attendedAt).length})
                      </button>
                    </div>

                    {/* Switcher: Tabel vs Kartu */}
                    <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-slate-600">
                      <button
                        type="button"
                        onClick={() => setDisplayMode("table")}
                        className={`p-1.5 rounded-lg transition cursor-pointer ${
                          displayMode === "table" ? "bg-white text-emerald-800 shadow-xs" : "hover:text-slate-900"
                        }`}
                        title="Tampilan Tabel Data"
                      >
                        <TableIcon size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDisplayMode("cards")}
                        className={`p-1.5 rounded-lg transition cursor-pointer ${
                          displayMode === "cards" ? "bg-white text-emerald-800 shadow-xs" : "hover:text-slate-900"
                        }`}
                        title="Tampilan Grid Kartu"
                      >
                        <LayoutGrid size={14} />
                      </button>
                    </div>

                    {/* CSV & Print Buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={handleExportCSV}
                        className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[10px] font-black px-2.5 py-1.5 rounded-xl flex items-center gap-1 shadow-xs transition cursor-pointer"
                        title="Unduh Laporan Rekap Presensi (CSV)"
                      >
                        <Download size={13} />
                        <span>CSV</span>
                      </button>
                      <button
                        onClick={handlePrintAttendanceReport}
                        className="bg-slate-800 hover:bg-slate-900 active:scale-95 text-white text-[10px] font-black px-2.5 py-1.5 rounded-xl flex items-center gap-1 shadow-xs transition cursor-pointer"
                        title="Cetak Berita Acara Presensi Resmi (PDF/Print)"
                      >
                        <Printer size={13} />
                        <span>PDF</span>
                      </button>
                    </div>

                    {/* Refresh Button */}
                    <button
                      onClick={() => fetchAttendanceAndLocations(selectedScheduleId)}
                      className={`p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer ${
                        refreshing ? "animate-spin text-emerald-600" : "text-slate-500"
                      }`}
                      title="Refresh Data Presensi"
                    >
                      <RefreshCw size={14} />
                    </button>
                  </div>
                </div>

                {/* Konten Data Mahasiswa (Tabel Pro vs Grid Kartu) */}
                <div className="flex-1 overflow-y-auto pr-1">
                  {filteredAttendance.length > 0 ? (
                    displayMode === "table" ? (
                      /* Mode 1: Table View (Rapi, Lengkap, Mudah Dibaca Puluhan Mahasiswa) */
                      <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-2xs">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-700 uppercase tracking-wider sticky top-0 z-10">
                            <tr>
                              <th className="py-2.5 px-3 w-10 text-center">#</th>
                              <th className="py-2.5 px-4">Nama Mahasiswa &amp; NIM</th>
                              <th className="py-2.5 px-3">Status Presensi</th>
                              <th className="py-2.5 px-3 text-center">Masuk (Tm)</th>
                              <th className="py-2.5 px-3 text-center">Pulang (Ts)</th>
                              <th className="py-2.5 px-3 text-center">Durasi Lapangan</th>
                              <th className="py-2.5 px-3 text-center">Kepatuhan Jam</th>
                              <th className="py-2.5 px-3 text-center">Aksi Peta</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-semibold">
                            {filteredAttendance.map((rec, idx) => {
                              const isAttended = Boolean(rec.attendedAt);
                              const isCompleted = Boolean(rec.completedAt);
                              const isActivePresence = isAttended && !isCompleted;
                              const durationMins = calculateDurationMinutes(rec.attendedAt, rec.completedAt);
                              const isDurationSufficient = durationMins >= scheduleTargetHours * 60;

                              let statusBadge = "bg-slate-100 text-slate-700 border-slate-200";
                              let statusText = rec.currentStatus?.replace(/_/g, " ") || "Belum Absen";

                              if (isActivePresence) {
                                statusBadge = "bg-emerald-100 text-emerald-900 border-emerald-300 font-black animate-pulse";
                                statusText = "🟢 Di Lapangan";
                              } else if (isCompleted) {
                                statusBadge = isDurationSufficient
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold"
                                  : "bg-amber-50 text-amber-900 border-amber-300 font-bold";
                                statusText = isDurationSufficient ? "✨ Selesai" : "⚠️ Selesai (Kurang Jam)";
                              }

                              return (
                                <tr
                                  key={rec.id}
                                  onClick={() => handleFocusMahasiswaMap(rec)}
                                  className="hover:bg-emerald-50/40 transition-colors cursor-pointer group"
                                  title="Klik baris untuk fokus posisi mahasiswa di peta"
                                >
                                  <td className="py-2.5 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                                  <td className="py-2.5 px-4">
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center shrink-0 border border-emerald-200">
                                        {rec.student.name.charAt(0).toUpperCase()}
                                      </div>
                                      <div>
                                        <div className="font-black text-slate-900 group-hover:text-emerald-700 transition-colors flex items-center gap-1">
                                          {rec.student.name.replace(/👑|\(Ketua Kelompok\)/g, "").trim()}
                                          <Navigation size={11} className="opacity-0 group-hover:opacity-100 text-emerald-600 transition-opacity shrink-0" />
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-mono">
                                          NIM: {rec.student.studentProfile?.nim || "-"}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge}`}>
                                      {statusText}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                                    {rec.attendedAt ? new Date(rec.attendedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-"}
                                  </td>
                                  <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                                    {rec.completedAt ? new Date(rec.completedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : (isActivePresence ? "Aktif" : "-")}
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    {isAttended ? (
                                      <span className={`font-black font-mono text-[11px] ${isDurationSufficient ? "text-emerald-700" : "text-amber-700"}`}>
                                        {formatDurationText(durationMins)}
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 font-mono">-</span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    {isAttended ? (
                                      isDurationSufficient ? (
                                        <span className="text-[10px] text-emerald-800 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                          ✅ Terpenuhi (≥ {scheduleTargetHours} Jam)
                                        </span>
                                      ) : (
                                        <span className="text-[10px] text-amber-800 font-extrabold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                          ⚠️ Kurang ({scheduleTargetHours} Jam)
                                        </span>
                                      )
                                    ) : (
                                      <span className="text-slate-400 text-[10px]">Belum Ada Jam</span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleFocusMahasiswaMap(rec);
                                      }}
                                      className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100 p-1.5 rounded-lg border border-emerald-200 text-[10px] font-black inline-flex items-center gap-1 transition"
                                      title="Fokus Lokasi GPS di Peta"
                                    >
                                      <Navigation size={11} />
                                      <span>Peta</span>
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      /* Mode 2: Cards Grid View */
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {filteredAttendance.map((rec) => {
                          const isAttended = Boolean(rec.attendedAt);
                          const isCompleted = Boolean(rec.completedAt);
                          const isActivePresence = isAttended && !isCompleted;
                          const durationMins = calculateDurationMinutes(rec.attendedAt, rec.completedAt);
                          const isDurationSufficient = durationMins >= scheduleTargetHours * 60;

                          let statusBadge = "bg-slate-100 text-slate-700";
                          let statusText = rec.currentStatus?.replace(/_/g, " ") || "Belum Absen";

                          if (isActivePresence) {
                            statusBadge = "bg-emerald-100 text-emerald-800 font-black border border-emerald-300";
                            statusText = "🟢 SEDANG DI LAPANGAN";
                          } else if (isCompleted) {
                            statusBadge = isDurationSufficient
                              ? "bg-emerald-50 text-emerald-900 font-bold border border-emerald-300"
                              : "bg-amber-50 text-amber-900 font-bold border border-amber-300";
                            statusText = isDurationSufficient ? "✨ SELESAI (DURASI TERPENUHI)" : `⚠️ KURANG DARI ${scheduleTargetHours} JAM`;
                          }

                          return (
                            <div
                              key={rec.id}
                              onClick={() => handleFocusMahasiswaMap(rec)}
                              className="border border-slate-200 hover:border-emerald-500 rounded-2xl p-3.5 bg-white hover:bg-emerald-50/30 transition-all shadow-2xs flex flex-col justify-between cursor-pointer group"
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

                              <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-1">
                                <div>
                                  <span className="text-slate-400 text-[9px] block uppercase font-mono">Masuk (Tm)</span>
                                  <span className="text-slate-800 font-extrabold">
                                    {rec.attendedAt ? new Date(rec.attendedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-"}
                                  </span>
                                </div>
                                <div className="text-center">
                                  <span className="text-slate-400 text-[9px] block uppercase font-mono">Durasi</span>
                                  <span className={`font-black ${isDurationSufficient ? "text-emerald-700" : "text-amber-700"}`}>
                                    {isAttended ? formatDurationText(durationMins) : "0 Menit"}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="text-slate-400 text-[9px] block uppercase font-mono">Pulang (Ts)</span>
                                  <span className="text-slate-800 font-extrabold">
                                    {rec.completedAt ? new Date(rec.completedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : (isActivePresence ? "Aktif" : "-")}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )
                  ) : (
                    <div className="text-center py-10 text-slate-400 text-xs flex flex-col items-center gap-2 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                      <Activity size={28} className="text-slate-300" />
                      <p className="font-bold text-slate-600">Tidak ada data presensi yang sesuai kriteria pencarian</p>
                      {studentSearch && (
                        <button
                          onClick={() => setStudentSearch("")}
                          className="text-[11px] font-bold text-emerald-700 underline cursor-pointer"
                        >
                          Reset kata kunci pencarian
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white/95 backdrop-blur-md border-t border-slate-200 z-20 p-8 flex flex-col items-center justify-center text-center shadow-xl">
            <Activity className="w-8 h-8 text-slate-300 mb-2" />
            <h4 className="text-sm font-black text-slate-700">Belum Ada Kegiatan KKN yang Dipilih</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-md font-medium">
              Pilih salah satu jadwal kegiatan dari daftar di samping untuk melihat peta wilayah dan rekapitulasi data presensi mahasiswa.
            </p>
          </div>
        )}
      </div>

      {/* Kiri/Kanan: Daftar Kegiatan & Search */}
      <div className="w-80 border-l border-slate-200 bg-white/95 backdrop-blur-md flex flex-col z-20 shadow-lg shrink-0 overflow-hidden">
        <div className="p-4 border-b border-slate-100 shrink-0">
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
                className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-[11px] py-2 px-3.5 rounded-xl flex items-center gap-1.5 transition-all shadow-xs uppercase tracking-wider cursor-pointer"
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
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs w-full focus:outline-none focus:border-emerald-600 bg-slate-50 focus:bg-white transition-all font-semibold"
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
                    ? "border-emerald-600 shadow-md bg-emerald-50/40 ring-1 ring-emerald-600"
                    : "border-slate-200/80 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-black text-slate-800">{schedule.title}</h4>
                    <span className="text-[9px] font-extrabold px-2 py-0.5 mt-1 inline-block rounded-md bg-emerald-100 text-emerald-900 uppercase">
                      {schedule.category}
                    </span>
                  </div>
                  {canManageSchedules && (
                    <div className="flex gap-1.5">
                      <button
                        onClick={(e) => handleOpenEditModal(e, schedule)}
                        className="text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                        title="Edit Kegiatan"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, schedule.id)}
                        className="text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Kegiatan"
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
            compact={true}
          />
        )}
      </div>

      {/* Modal Add/Edit Kegiatan KKN */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-[740px] max-w-full overflow-hidden flex flex-col transform transition-all duration-200 border border-slate-200 max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-50 text-emerald-700 p-2.5 rounded-2xl border border-emerald-200">
                  <CalendarDays size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    {modalMode === "add" ? "Tambah Kegiatan KKN" : "Edit Kegiatan KKN"}
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                    {modalStep === 1
                      ? "Langkah 1/2: Informasi Detail & Waktu Pelaksanaan Kegiatan"
                      : "Langkah 2/2: Penentuan Area Geofence Presensi (Peta)"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Step Tabs Selector */}
            <div className="flex bg-slate-100/80 px-6 pt-3 pb-2 gap-2 border-b border-slate-200/60">
              <button
                type="button"
                onClick={() => setModalStep(1)}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  modalStep === 1
                    ? "bg-white text-emerald-800 shadow-2xs border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black flex items-center justify-center">1</span>
                <span>Detail & Waktu</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const errs = validateStep1();
                  if (Object.keys(errs).length > 0) {
                    setFormErrors(errs);
                    const firstErr = Object.values(errs)[0];
                    toast.error(`Periksa Form: ${firstErr}`);
                    return;
                  }
                  setFormErrors({});
                  setModalStep(2);
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  modalStep === 2
                    ? "bg-white text-emerald-800 shadow-2xs border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black flex items-center justify-center">2</span>
                <span>Area Geofence ({geofenceMode === "CIRCLE" ? "Radius Lingkaran" : "Polygon"})</span>
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} noValidate className="p-6 overflow-y-auto space-y-4 text-xs font-semibold flex-1">
              {/* Alert Summary jika ada error */}
              {Object.keys(formErrors).length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs font-bold flex items-start gap-2 shadow-2xs">
                  <span className="text-base shrink-0">⚠️</span>
                  <div className="flex-1">
                    <p className="font-black text-rose-950 mb-0.5">Mohon lengkapi dan periksa data yang belum valid:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-800 font-semibold">
                      {Object.values(formErrors).map((msg, idx) => (
                        <li key={idx}>{msg}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {modalStep === 1 ? (
                <div className="space-y-4">
                  {/* Judul Kegiatan */}
                  <div>
                    <label className="block text-slate-800 font-black mb-1">
                      Judul Kegiatan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title || ""}
                      onChange={(e) => {
                        setFormData({ ...formData, title: e.target.value });
                        if (formErrors.title) setFormErrors((prev) => ({ ...prev, title: "" }));
                      }}
                      placeholder="Contoh: Sosialisasi Pemilahan Sampah Organik RW 03"
                      className={`w-full h-10 px-3.5 border rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 outline-none transition-all ${
                        formErrors.title
                          ? "border-rose-400 bg-rose-50/40 focus:border-rose-600 focus:bg-white"
                          : "border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500"
                      }`}
                    />
                    {formErrors.title && (
                      <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-1">
                        <span>⚠️</span> {formErrors.title}
                      </p>
                    )}
                  </div>

                  {/* Kategori & Target Kelompok */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-slate-800 font-black mb-1">
                        Kategori Kegiatan <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={isCustomCategory ? "__CUSTOM__" : (formData.category || "Sosialisasi")}
                        onChange={(e) => {
                          if (e.target.value === "__CUSTOM__") {
                            setIsCustomCategory(true);
                            if (!customCategoryText) setCustomCategoryText("");
                          } else {
                            setIsCustomCategory(false);
                            setFormData({ ...formData, category: e.target.value });
                            if (formErrors.category) setFormErrors((prev) => ({ ...prev, category: "" }));
                          }
                        }}
                        className="w-full h-10 px-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-emerald-500 text-xs font-bold text-slate-800 outline-none cursor-pointer"
                      >
                        <option value="Sosialisasi">Sosialisasi Warga</option>
                        <option value="Pengangkutan">Pengangkutan & Penimbangan</option>
                        <option value="Monitoring">Monitoring Lapangan</option>
                        <option value="Workshop">Workshop Daur Ulang</option>
                        <option value="Rapat">Rapat Koordinasi</option>
                        <option value="Aksi Bersih">Aksi Bersih Lingkungan</option>
                        <option value="Pelatihan Kompos & Loseda">Pelatihan Kompos & Loseda</option>
                        <option value="Validasi Tempat Sampah">Validasi Tempat Sampah</option>
                        <option value="__CUSTOM__">➕ Tambah Kategori Kustom / Lainnya...</option>
                      </select>

                      {isCustomCategory && (
                        <div className="mt-2">
                          <input
                            type="text"
                            value={customCategoryText}
                            onChange={(e) => {
                              setCustomCategoryText(e.target.value);
                              if (formErrors.category) setFormErrors((prev) => ({ ...prev, category: "" }));
                            }}
                            placeholder="Ketik nama kategori kegiatan baru..."
                            className={`w-full h-9 px-3 border rounded-xl text-xs font-bold outline-none ${
                              formErrors.category
                                ? "border-rose-400 bg-rose-50/40 text-rose-950 placeholder-rose-400"
                                : "border-emerald-300 bg-emerald-50/50 text-emerald-950 placeholder-emerald-400 focus:bg-white focus:border-emerald-600"
                            }`}
                          />
                          {formErrors.category && (
                            <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-1">
                              <span>⚠️</span> {formErrors.category}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-slate-800 font-black mb-1 flex items-center justify-between">
                        <span>Target Kelompok KKN</span>
                        {isDpl && (
                          <span className="text-[10px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                            🔒 Terkunci (Kelompok Anda)
                          </span>
                        )}
                      </label>
                      {isDpl ? (
                        <div className="w-full h-10 px-3.5 border border-amber-200 rounded-xl bg-amber-50/70 flex items-center justify-between text-xs font-black text-amber-950">
                          <span className="truncate">
                            {groups.find((g) => g.id === formData.kelompokId)?.name || groups[0]?.name || "Kelompok Bimbingan DPL"}
                            {groups[0]?.kelurahan ? ` (${groups[0].kelurahan})` : ""}
                          </span>
                          <span className="text-[10px] text-amber-700 font-bold shrink-0 ml-1">Otomatis Ditugaskan</span>
                        </div>
                      ) : (
                        <select
                          value={formData.kelompokId || ""}
                          onChange={(e) => {
                            const newGroupId = e.target.value;
                            const targetGroup = groups.find((g) => g.id === newGroupId);
                            const locInfo = getKelompokLocationInfo(targetGroup);
                            setFormData((prev) => ({
                              ...prev,
                              kelompokId: newGroupId,
                              location: locInfo.fullAddress,
                            }));
                            setSelectedPos([[locInfo.centroid[0], locInfo.centroid[1]]]);
                          }}
                          className="w-full h-10 px-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-emerald-500 text-xs font-bold text-slate-800 outline-none cursor-pointer"
                        >
                          <option value="">Semua Kelompok KKN (Kecamatan)</option>
                          {groups.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.name} {g.kelurahan ? `(${g.kelurahan})` : ""} {g.dpl?.name ? `- DPL: ${g.dpl.name}` : ""}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Rentang Tanggal Mulai & Selesai */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                    <div>
                      <label className="block text-slate-800 font-black mb-1 flex items-center gap-1.5">
                        <Calendar size={13} className="text-emerald-600" /> Tanggal Mulai <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          if (!endDate || e.target.value > endDate) {
                            setEndDate(e.target.value);
                          }
                          if (formErrors.startDate) setFormErrors((prev) => ({ ...prev, startDate: "" }));
                        }}
                        className={`w-full h-10 px-3 border rounded-xl text-xs font-bold text-slate-800 outline-none ${
                          formErrors.startDate
                            ? "border-rose-400 bg-rose-50/40 focus:border-rose-600"
                            : "border-slate-200 bg-white focus:border-emerald-500"
                        }`}
                      />
                      {formErrors.startDate && (
                        <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-1">
                          <span>⚠️</span> {formErrors.startDate}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-slate-800 font-black mb-1 flex items-center gap-1.5">
                        <Calendar size={13} className="text-emerald-600" /> Tanggal Selesai <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        min={startDate}
                        onChange={(e) => {
                          setEndDate(e.target.value);
                          if (formErrors.endDate) setFormErrors((prev) => ({ ...prev, endDate: "" }));
                        }}
                        className={`w-full h-10 px-3 border rounded-xl text-xs font-bold text-slate-800 outline-none ${
                          formErrors.endDate
                            ? "border-rose-400 bg-rose-50/40 focus:border-rose-600"
                            : "border-slate-200 bg-white focus:border-emerald-500"
                        }`}
                      />
                      {formErrors.endDate && (
                        <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-1">
                          <span>⚠️</span> {formErrors.endDate}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Rentang Jam Mulai & Selesai */}
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-slate-800 font-black mb-1 flex items-center gap-1.5">
                          <Clock size={13} className="text-emerald-700" /> Waktu Mulai <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="time"
                          value={startTime}
                          onChange={(e) => {
                            setStartTime(e.target.value);
                            if (formErrors.startTime || formErrors.endTime) {
                              setFormErrors((prev) => ({ ...prev, startTime: "", endTime: "" }));
                            }
                          }}
                          className={`w-full h-10 px-3 border rounded-xl text-xs font-bold text-slate-800 outline-none ${
                            formErrors.startTime
                              ? "border-rose-400 bg-rose-50/40 focus:border-rose-600"
                              : "border-slate-200 bg-white focus:border-emerald-500"
                          }`}
                        />
                        {formErrors.startTime && (
                          <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-1">
                            <span>⚠️</span> {formErrors.startTime}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-slate-800 font-black mb-1 flex items-center gap-1.5">
                          <Clock size={13} className="text-emerald-700" /> Waktu Selesai <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="time"
                          value={endTime}
                          onChange={(e) => {
                            setEndTime(e.target.value);
                            if (formErrors.endTime) setFormErrors((prev) => ({ ...prev, endTime: "" }));
                          }}
                          className={`w-full h-10 px-3 border rounded-xl text-xs font-bold text-slate-800 outline-none ${
                            formErrors.endTime
                              ? "border-rose-400 bg-rose-50/40 focus:border-rose-600"
                              : "border-slate-200 bg-white focus:border-emerald-500"
                          }`}
                        />
                        {formErrors.endTime && (
                          <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-1">
                            <span>⚠️</span> {formErrors.endTime}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Quick Presets */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase mr-1">Preset Jam:</span>
                      {[
                        { label: "Pagi (08.00 - 12.00)", s: "08:00", e: "12:00" },
                        { label: "Siang (13.00 - 17.00)", s: "13:00", e: "17:00" },
                        { label: "Sore (16.00 - 18.00)", s: "16:00", e: "18:00" },
                        { label: "Seharian (08.00 - 16.00)", s: "08:00", e: "16:00" },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            setStartTime(preset.s);
                            setEndTime(preset.e);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                            startTime === preset.s && endTime === preset.e
                              ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    {/* Syarat Minimum Jam Absen Konfigurabel */}
                    <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                          <Clock size={13} className="text-emerald-700" />
                          <span>Syarat Minimum Jam Absensi Kegiatan:</span>
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={1}
                            max={12}
                            value={activityMinHours}
                            onChange={(e) => setActivityMinHours(Math.max(1, Number(e.target.value)))}
                            className="w-14 h-7 text-center font-black bg-white border border-emerald-300 rounded-lg text-emerald-950 text-xs outline-none"
                          />
                          <span className="font-black text-emerald-900 text-xs">Jam</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-black text-emerald-800 uppercase mr-1">Preset Jam Absen:</span>
                        {[2, 3, 4, 6, 8].map((hVal) => (
                          <button
                            key={hVal}
                            type="button"
                            onClick={() => setActivityMinHours(hVal)}
                            className={`px-2.5 py-0.5 rounded-md text-[10px] font-black border transition cursor-pointer ${
                              activityMinHours === hVal
                                ? "bg-emerald-700 text-white border-emerald-700"
                                : "bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-100"
                            }`}
                          >
                            {hVal} Jam
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Duration Preview Banner */}
                    {(() => {
                      const diffMins = calculateHourDifference(startTime, endTime);
                      const isSatisfied = diffMins >= activityMinHours * 60;
                      return (
                        <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs font-extrabold ${
                          isSatisfied
                            ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                            : "bg-amber-50 text-amber-900 border-amber-200"
                        }`}>
                          <div className="flex items-center gap-1.5">
                            <Clock size={14} className={isSatisfied ? "text-emerald-600" : "text-amber-600"} />
                            <span>Durasi Kegiatan: <strong>{formatDurationText(diffMins)}</strong></span>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-black ${
                            isSatisfied ? "bg-emerald-200/60 text-emerald-950" : "bg-amber-200/60 text-amber-950"
                          }`}>
                            {isSatisfied
                              ? `✅ Memenuhi target durasi (≥ ${activityMinHours} Jam)`
                              : `⚠️ Durasi kegiatan kurang dari target (${activityMinHours} Jam)`}
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Lokasi Deskriptif dengan Auto-Fill Kelompok DPL & RW */}
                  {(() => {
                    const activeGroupForLocation = groups.find((g) => g.id === formData.kelompokId) || (isDpl ? groups[0] : groups[0]);
                    const activeLocInfo = getKelompokLocationInfo(activeGroupForLocation);

                    return (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-slate-800 font-black flex items-center gap-1.5 text-xs">
                            <MapPin size={13} className="text-rose-500" /> Lokasi Kegiatan (Deskriptif) <span className="text-rose-500">*</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, location: activeLocInfo.fullAddress });
                              setSelectedPos([[activeLocInfo.centroid[0], activeLocInfo.centroid[1]]]);
                              if (formErrors.location) setFormErrors((prev) => ({ ...prev, location: "" }));
                              toast.success(`Alamat disesuaikan ke ${activeLocInfo.kelurahan}`);
                            }}
                            className="text-[10px] font-black text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200 transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <span>🔄 Auto-isi Alamat Kelompok</span>
                          </button>
                        </div>

                        <input
                          type="text"
                          value={formData.location || ""}
                          onChange={(e) => {
                            setFormData({ ...formData, location: e.target.value });
                            if (formErrors.location) setFormErrors((prev) => ({ ...prev, location: "" }));
                          }}
                          placeholder={`Balai RW 03, Kelurahan ${activeLocInfo.kelurahan}, Kecamatan Coblong`}
                          className={`w-full h-10 px-3.5 border rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 outline-none transition-all ${
                            formErrors.location
                              ? "border-rose-400 bg-rose-50/40 focus:border-rose-600"
                              : "border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500"
                          }`}
                        />
                        {formErrors.location && (
                          <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-1">
                            <span>⚠️</span> {formErrors.location}
                          </p>
                        )}

                        {/* Quick Presets RW Binaan Kelompok */}
                        {activeLocInfo.presetLocations.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            <span className="text-[10px] font-black text-slate-400 uppercase mr-1">Pilih Cepat RW:</span>
                            {activeLocInfo.presetLocations.map((loc) => (
                              <button
                                key={loc.label}
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, location: loc.address });
                                  setSelectedPos([[activeLocInfo.centroid[0], activeLocInfo.centroid[1]]]);
                                  if (formErrors.location) setFormErrors((prev) => ({ ...prev, location: "" }));
                                }}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer flex items-center gap-1 ${
                                  formData.location === loc.address
                                    ? "bg-emerald-700 text-white border-emerald-700 shadow-sm"
                                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                                }`}
                              >
                                <span>📍</span>
                                <span>{loc.label}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Info Wilayah Kelompok */}
                        <div className="text-[10px] text-slate-700 bg-slate-100/80 p-2 rounded-xl border border-slate-200 flex items-center justify-between">
                          <span className="font-semibold">
                            🏡 <strong>Kel. {activeLocInfo.kelurahan}</strong> • Cakupan: <strong>{activeLocInfo.rws.length > 0 ? activeLocInfo.rws.join(", ") : "Semua RW"}</strong>
                          </span>
                          <span className="text-emerald-700 font-bold text-[9px] bg-emerald-100 px-1.5 py-0.5 rounded">
                            GPS Peta: Otomatis di {activeLocInfo.kelurahan}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                /* Step 2: Area Geofence Presensi (Peta) */
                <div className="space-y-4">
                  {/* Mode Selector Tabs */}
                  <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setGeofenceMode("CIRCLE");
                        if (selectedPos.length > 1) {
                          setSelectedPos(selectedPos.slice(0, 1));
                        }
                        if (formErrors.geofence) setFormErrors((prev) => ({ ...prev, geofence: "" }));
                      }}
                      className={`flex-1 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        geofenceMode === "CIRCLE"
                          ? "bg-slate-900 text-white shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <span>📍 Radius Lingkaran (Bulat)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setGeofenceMode("POLYGON");
                        if (formErrors.geofence) setFormErrors((prev) => ({ ...prev, geofence: "" }));
                      }}
                      className={`flex-1 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        geofenceMode === "POLYGON"
                          ? "bg-emerald-700 text-white shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <span>📐 Polygon Kustom (Multi-Sudut)</span>
                    </button>
                  </div>

                  {/* Geofence Map */}
                  <div className="h-[280px] rounded-2xl overflow-hidden border border-slate-200 relative z-0 shadow-inner">
                    <MapContainer
                      center={
                        selectedPos.length > 0
                          ? selectedPos[0]
                          : [-6.8915, 107.6107]
                      }
                      zoom={15}
                      style={{ height: "100%", width: "100%" }}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <DualGeofencePickerModalMap
                        mode={geofenceMode}
                        points={selectedPos || []}
                        onChange={(pts) => {
                          setSelectedPos(pts);
                          if (formErrors.geofence) setFormErrors((prev) => ({ ...prev, geofence: "" }));
                        }}
                        radius={Number(formData.radius) || 100}
                      />
                    </MapContainer>

                    {/* Map overlay action buttons */}
                    <div className="absolute bottom-3 right-3 z-[999] flex items-center gap-1.5 bg-white/95 backdrop-blur-xs p-1 rounded-xl shadow-md border border-slate-200">
                      {geofenceMode === "POLYGON" && selectedPos.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedPos(selectedPos.slice(0, -1))}
                          className="px-2.5 py-1 text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                        >
                          Hapus Titik Terakhir
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedPos([[-6.8915, 107.6107]])}
                        className="px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                      >
                        Reset Lokasi
                      </button>
                    </div>
                  </div>

                  {formErrors.geofence && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-1.5">
                      <span>⚠️</span> {formErrors.geofence}
                    </div>
                  )}

                  {/* Controls Mode Radius / Polygon */}
                  {geofenceMode === "CIRCLE" ? (
                    <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex flex-col gap-3">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <label className="text-xs font-black text-slate-800">
                            Ukuran Radius Presensi:
                          </label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min={10}
                              max={10000}
                              step="any"
                              value={formData.radius || 100}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setFormData({ ...formData, radius: val });
                                if (formErrors.radius) setFormErrors((prev) => ({ ...prev, radius: "" }));
                              }}
                              className={`w-24 h-7 text-center font-mono font-black bg-white border rounded-lg text-emerald-950 text-xs outline-none shadow-2xs ${
                                formErrors.radius ? "border-rose-400 bg-rose-50" : "border-emerald-300 focus:border-emerald-600"
                              }`}
                            />
                            <span className="text-[11px] font-bold text-slate-600">Meter</span>
                            <span className="bg-emerald-700 text-white px-2 py-0.5 rounded-md text-[11px] font-mono font-bold shadow-2xs">
                              {Number(formData.radius || 100) >= 1000
                                ? `${(Number(formData.radius || 100) / 1000).toFixed(1).replace(/\.0$/, "")} km`
                                : `${formData.radius || 100} m`}
                            </span>
                          </div>
                        </div>
                        <span className="text-[11px] text-slate-500 font-semibold">
                          Pusat: {selectedPos.length >= 1 ? `${selectedPos[0][0].toFixed(5)}, ${selectedPos[0][1].toFixed(5)}` : "Belum dipilih"}
                        </span>
                      </div>

                      {formErrors.radius && (
                        <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                          <span>⚠️</span> {formErrors.radius}
                        </p>
                      )}

                      {/* Slider 50m - 5000m (5 km) */}
                      <div className="space-y-1">
                        <input
                          type="range"
                          min={50}
                          max={5000}
                          step={50}
                          value={formData.radius || 100}
                          onChange={(e) => {
                            setFormData({ ...formData, radius: Number(e.target.value) });
                            if (formErrors.radius) setFormErrors((prev) => ({ ...prev, radius: "" }));
                          }}
                          className="w-full h-2.5 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-700"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400 font-bold font-mono px-0.5">
                          <span>50m</span>
                          <span>1 km</span>
                          <span>2.5 km</span>
                          <span>5 km (5000m)</span>
                        </div>
                      </div>

                      {/* Preset Radius Buttons: 100m, 500m, 1km, 2km, 5km */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        <span className="text-[10px] font-black text-emerald-900 uppercase mr-1">Preset Cepat:</span>
                        {[
                          { val: 100, label: "100m (RW)" },
                          { val: 500, label: "500m (Sub-Kelurahan)" },
                          { val: 1000, label: "1 km (Kelurahan)" },
                          { val: 2000, label: "2 km (Multi-Kelurahan)" },
                          { val: 5000, label: "5 km (Kecamatan)" },
                        ].map((preset) => (
                          <button
                            key={preset.val}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, radius: preset.val });
                              if (formErrors.radius) setFormErrors((prev) => ({ ...prev, radius: "" }));
                            }}
                            className={`px-2.5 py-1 text-[11px] font-black rounded-lg transition cursor-pointer flex items-center gap-1 ${
                              Number(formData.radius) === preset.val
                                ? "bg-emerald-700 text-white shadow-2xs ring-1 ring-emerald-800"
                                : "bg-white text-emerald-950 border border-emerald-200 hover:bg-emerald-100"
                            }`}
                          >
                            <span>📍</span>
                            <span>{preset.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Mode Polygon */
                    <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-black text-slate-800">
                          Titik Sudut Polygon Presensi:
                        </label>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                            selectedPos.length >= 3
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {selectedPos.length} Titik (Min. 3 titik)
                        </span>
                      </div>

                      {/* Manual coordinate input */}
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="any"
                          placeholder="Latitude (cth: -6.8915)"
                          value={manualLat}
                          onChange={(e) => setManualLat(e.target.value)}
                          className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none font-mono"
                        />
                        <input
                          type="number"
                          step="any"
                          placeholder="Longitude (cth: 107.6107)"
                          value={manualLng}
                          onChange={(e) => setManualLng(e.target.value)}
                          className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const lat = parseFloat(manualLat);
                            const lng = parseFloat(manualLng);
                            if (isNaN(lat) || isNaN(lng)) {
                              toast.error("Masukkan koordinat Latitude dan Longitude yang valid");
                              return;
                            }
                            setSelectedPos([...selectedPos, [lat, lng]]);
                            setManualLat("");
                            setManualLng("");
                            if (formErrors.geofence) setFormErrors((prev) => ({ ...prev, geofence: "" }));
                            toast.success("Titik koordinat berhasil ditambahkan");
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition cursor-pointer shrink-0"
                        >
                          + Titik
                        </button>
                      </div>

                      {/* Coordinate list table */}
                      {selectedPos.length > 0 && (
                        <div className="max-h-[100px] overflow-y-auto rounded-lg border border-emerald-200 bg-white">
                          <table className="w-full text-left text-[11px]">
                            <thead className="bg-emerald-100/70 text-emerald-950 font-bold sticky top-0">
                              <tr>
                                <th className="px-2.5 py-1">#</th>
                                <th className="px-2.5 py-1">Latitude</th>
                                <th className="px-2.5 py-1">Longitude</th>
                                <th className="px-2.5 py-1 text-right">Aksi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-emerald-100">
                              {selectedPos.map((p: [number, number], idx: number) => (
                                <tr key={idx} className="hover:bg-emerald-50/50">
                                  <td className="px-2.5 py-1 font-bold text-slate-500">{idx + 1}</td>
                                  <td className="px-2.5 py-1 font-mono text-slate-800">{Number(p[0]).toFixed(6)}</td>
                                  <td className="px-2.5 py-1 font-mono text-slate-800">{Number(p[1]).toFixed(6)}</td>
                                  <td className="px-2.5 py-1 text-right">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedPos(selectedPos.filter((_, i) => i !== idx))}
                                      className="text-rose-500 hover:text-rose-700 font-bold cursor-pointer"
                                    >
                                      Hapus
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Modal Footer Navigation */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    if (modalStep === 2) {
                      setModalStep(1);
                    } else {
                      setIsModalOpen(false);
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-extrabold cursor-pointer transition text-xs"
                >
                  {modalStep === 2 ? "⬅️ Kembali ke Info" : "Batal"}
                </button>

                <div className="flex items-center gap-2">
                  {modalStep === 1 ? (
                    <button
                      type="button"
                      onClick={() => {
                        const errs = validateStep1();
                        if (Object.keys(errs).length > 0) {
                          setFormErrors(errs);
                          const firstErr = Object.values(errs)[0];
                          toast.error(`Lengkapi Form: ${firstErr}`);
                          return;
                        }
                        setFormErrors({});
                        setModalStep(2);
                      }}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl font-black cursor-pointer shadow-sm transition text-xs flex items-center gap-1.5"
                    >
                      <span>Pilih Area Geofence di Peta 🗺️</span>
                      <span>➡️</span>
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmittingSchedule}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl font-black cursor-pointer shadow-sm transition text-xs flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isSubmittingSchedule ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Menyimpan...</span>
                        </>
                      ) : (
                        <span>Simpan Kegiatan KKN</span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal Hapus Jadwal Kegiatan */}
      <ConfirmModal
        isOpen={Boolean(deleteScheduleId)}
        onClose={() => setDeleteScheduleId(null)}
        onConfirm={handleConfirmDeleteSchedule}
        isLoading={isDeletingSchedule}
        title="Hapus Jadwal Kegiatan"
        message="Apakah Anda yakin ingin menghapus kegiatan KKN ini? Seluruh data presensi yang terkait akan dihapus."
        confirmText="Ya, Hapus Kegiatan"
        type="danger"
      />
    </div>
  );
};

export default MonitoringAbsen;
