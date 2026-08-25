/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  MapContainer,
  Marker,
  Popup,
  Circle,
  Polygon,
  Polyline,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { ThemeTileLayer } from "../../components/common/ThemeTileLayer";
import L from "leaflet";
import {
  Loader2,
  Calendar,
  CalendarDays,
  Clock,
  MapPin,
  Search,
  Plus,
  Trash2,
  Power,
  X,
  Pencil,
  Download,
  Navigation,
  CheckCircle2,
  Map as MapIcon,
  ChevronDown,
  Target,
  Info,
  Hourglass,
  XCircle,
  Thermometer,
  Settings,
  Users,
  ExternalLink,
  FileCheck,
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { ConfirmModal } from "../../components/common/ConfirmModal";
import { EmptyTableState } from "../../components/common/EmptyTableState";
import { useAuthStore } from "../../store/useAuthStore";
import { dplService, type ConfigTargets } from "../../services/dplService";
import { wsClient } from "../../utils/websocket";
import {
  KELURAHAN_GEODATA,
  createKknMhsIcon as createStudentIcon,
  createMhsClusterIcon,
  createFacilityIcon,
  formatKelompokDisplayName,
} from "../../constants/coblongGeoData";

// Fix Leaflet default icon issues in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const MapZoomEvents: React.FC<{ onZoom: (zoom: number) => void }> = ({ onZoom }) => {
  useMapEvents({
    zoomend: (e) => {
      onZoom(e.target.getZoom());
    },
  });
  return null;
};

const createActivityMarkerIcon = () => {
  return L.divIcon({
    className: "custom-activity-icon",
    html: `
      <div style="background-color: #059669; color: white; border-radius: 6px; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
};

const getDistanceInMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const isPointInPoly = (lat: number, lng: number, polygon: [number, number][]): boolean => {
  let inside = false;
  const n = polygon.length;
  let j = n - 1;
  for (let i = 0; i < n; i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];
    const intersect = ((yi > lng) !== (yj > lng)) && (lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
    j = i;
  }
  return inside;
};

const createActivePresenceIcon = (studentName: string) => {
  const initial = (studentName || "M").charAt(0).toUpperCase();
  return L.divIcon({
    className: "custom-active-student-presence",
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        <style>
          @keyframes pulseRing {
            0% { transform: scale(0.9); opacity: 0.8; }
            50% { transform: scale(1.7); opacity: 0.35; }
            100% { transform: scale(2.3); opacity: 0; }
          }
        </style>
        <div style="position: absolute; inset: -4px; border-radius: 50%; background-color: #10b981; animation: pulseRing 1.5s ease-out infinite;"></div>
        <div style="background: linear-gradient(135deg, #059669, #10b981); color: white; border-radius: 50%; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 8px rgba(16,185,129,0.6); font-weight: 900; font-size: 10px; font-family: sans-serif; position: relative; z-index: 10;">
          ${initial}
        </div>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
};

const formatDurationUnits = (totalMinutes: number): string => {
  if (!totalMinutes || totalMinutes <= 0) return "0 Menit";
  const totalSeconds = Math.round(totalMinutes * 60);
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} Jam`);
  if (mins > 0) parts.push(`${mins} Menit`);
  if (secs > 0 && hours === 0 && mins === 0) parts.push(`${secs} Detik`);
  return parts.length > 0 ? parts.join(" ") : "0 Menit";
};

const formatHoursToUnits = (hoursDecimal: number): string => {
  if (!hoursDecimal || hoursDecimal <= 0) return "0 Menit";
  const totalMinutes = Math.round(hoursDecimal * 60);
  if (totalMinutes > 0) {
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours} Jam`);
    if (mins > 0) parts.push(`${mins} Menit`);
    return parts.length > 0 ? parts.join(" ") : "0 Menit";
  }
  const totalSeconds = Math.round(hoursDecimal * 3600);
  if (totalSeconds > 0) return `${totalSeconds} Detik`;
  return "0 Menit";
};

const formatTargetDuration = (config: ConfigTargets): string => {
  const h = Number(config.attendanceMinDurationHours || 0);
  const m = Number(config.attendanceMinDurationMinutes || 0);
  const s = Number(config.attendanceMinDurationSeconds || 0);
  const totalMins = h * 60 + m + s / 60;

  if (totalMins > 0) {
    const parts: string[] = [];
    if (h > 0) parts.push(`${h} Jam`);
    if (m > 0) parts.push(`${m} Menit`);
    if (s > 0 && h === 0 && m === 0) parts.push(`${s} Detik`);
    if (parts.length > 0) return parts.join(" ");
  }
  if (config.targetHarianJam && config.targetHarianJam > 0) {
    return formatHoursToUnits(config.targetHarianJam);
  }
  if (config.targetTotalJam && config.targetTotalHari && config.targetTotalHari > 0) {
    const autoDailyHours = config.targetTotalJam / config.targetTotalHari;
    return formatHoursToUnits(autoDailyHours);
  }
  return "0 Menit";
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
  attendedAt: string; // Jam Masuk (Check-In)
  completedAt?: string; // Jam Pulang (Check-Out)
  method: "OTOMATIS" | "MANUAL" | string;
  latitude: string;
  longitude: string;
  status: string;
  statusDisplay?: string;
  isMemenuhiDurasi?: boolean;
  actualInZoneMinutes?: number;
  currentStatus:
    | "MASIH_DI_LOKASI"
    | "SUDAH_MENINGGALKAN_RADIUS"
    | "TIDAK_TERDETEKSI"
    | "BELUM_ABSEN"
    | "DI_LOKASI_BELUM_ABSEN"
    | "IZIN_DISETUJUI"
    | "MENUNGGU_PERSETUJUAN_IZIN"
    | "PENGAJUAN_BATAL_IZIN"
    | "OVERRIDDEN_HADIR"
    | string;
  student: {
    id: string;
    name: string;
    studentProfile?: {
      nim: string;
      jurusan: string;
      isKetua?: boolean;
      kelompok?: {
        id: string;
        name: string;
        kelurahan?: string;
      };
    };
  };
  kelompokName?: string;
  totalHours?: number;
  totalMinutes?: number;
  leaveRequest?: {
    id: string;
    type: string;
    reason: string;
    evidenceUrl?: string;
    status: string;
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
  isActive?: boolean;
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
    if (points && points.length > 0 && points[0] && !isNaN(points[0][0]) && !isNaN(points[0][1])) {
      map.setView(points[0], map.getZoom() || 15);
    }
    const t1 = setTimeout(() => {
      map.invalidateSize();
      if (points && points.length > 0 && points[0] && !isNaN(points[0][0]) && !isNaN(points[0][1])) {
        map.setView(points[0], map.getZoom() || 15);
      }
    }, 150);
    const t2 = setTimeout(() => map.invalidateSize(), 350);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [mode, map, points]);

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
            pathOptions={{
              color: "#059669",
              fillColor: "#10b981",
              fillOpacity: 0.25,
              weight: 2.5,
            }}
          />
        </>
      )}
      {mode === "POLYGON" && (
        <>
          {points.map((p, i) => (
            <Marker key={i} position={p} />
          ))}
          {points.length === 2 && (
            <Polyline
              positions={points}
              pathOptions={{ color: "#f59e0b", dashArray: "5,5", weight: 2 }}
            />
          )}
          {points.length >= 3 && (
            <Polygon
              positions={points}
              pathOptions={{
                color: "#10b981",
                fillColor: "#10b981",
                fillOpacity: 0.3,
                weight: 2,
              }}
            />
          )}
        </>
      )}
    </>
  );
};

const parseTimeString = (timeStr?: string) => {
  if (!timeStr) return { start: "08:00", end: "12:00" };
  const matches = timeStr.match(
    /(\d{1,2}[:.]\d{2})\s*(?:-|s\/d|sampai)\s*(\d{1,2}[:.]\d{2})/i
  );
  if (matches) {
    return {
      start: matches[1].replace(".", ":").padStart(5, "0"),
      end: matches[2].replace(".", ":").padStart(5, "0"),
    };
  }
  return { start: "08:00", end: "12:00" };
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

const getCenterFromSchedule = (sched?: ScheduleActivity): [number, number] => {
  if (!sched) return [-6.8915, 107.6107];
  if (sched.polygon && Array.isArray(sched.polygon) && sched.polygon.length > 0) {
    const validPts = sched.polygon.filter(
      (p) =>
        Array.isArray(p) &&
        p.length === 2 &&
        !isNaN(p[0]) &&
        !isNaN(p[1]) &&
        Number(p[0]) < 0 &&
        Number(p[1]) > 0
    );
    if (validPts.length > 0) {
      const avgLat =
        validPts.reduce((acc, p) => acc + Number(p[0]), 0) / validPts.length;
      const avgLng =
        validPts.reduce((acc, p) => acc + Number(p[1]), 0) / validPts.length;
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

const ChangeMapView: React.FC<{
  center: [number, number];
  zoom: number;
}> = ({ center, zoom }) => {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);

  useEffect(() => {
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 80);
    const t2 = setTimeout(() => map.invalidateSize(), 250);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [map]);

  return null;
};

const MonitoringAbsen: React.FC = () => {
  const { user } = useAuthStore();
  const userRole = String(
    user?.peran || (user as any)?.role || ""
  ).toUpperCase();
  const isDpl = userRole === "DPL" || userRole === "DOSEN_PEMBIMBING";

  const [selectedKelompokId, setSelectedKelompokId] = useState<string>("");
  const [schedules, setSchedules] = useState<ScheduleActivity[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>("");
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [studentLocations, setStudentLocations] = useState<StudentLoc[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter & Search States
  const [attendanceFilterTab, setAttendanceFilterTab] = useState<
    "ALL" | "ACTIVE" | "COMPLETED" | "IZIN_SAKIT" | "NOT_ATTENDED"
  >("ALL");
  const [studentSearch, setStudentSearch] = useState<string>("");
  const [displayMode] = useState<"table" | "cards">("table");
  const [showMap, setShowMap] = useState<boolean>(false);

  // Real-Time WebSocket & Pagination States
  const [wsStatus, setWsStatus] = useState<"CONNECTED" | "CONNECTING" | "DISCONNECTED">("DISCONNECTED");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [, setLiveTicker] = useState<number>(0);

  // Live timer interval to keep active elapsed durations ticking smoothly
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTicker((prev) => prev + 1);
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Export Modal State with Period Picker
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportPeriod, setExportPeriod] = useState<
    "SEMUA" | "BULAN_INI" | "30_HARI" | "CUSTOM"
  >("SEMUA");
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");

  // Modal State for Schedule Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [modalStep, setModalStep] = useState<1 | 2>(1);
  const [geofenceMode, setGeofenceMode] = useState<"CIRCLE" | "POLYGON">("CIRCLE");
  const [formData, setFormData] = useState<Partial<ScheduleActivity>>({
    radius: 100,
    category: "Sosialisasi",
  });
  const [isCustomCategory, setIsCustomCategory] = useState<boolean>(false);
  const [customCategoryText, setCustomCategoryText] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("08:00");
  const [endTime, setEndTime] = useState<string>("12:00");
  const [groups, setGroups] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [selectedPos, setSelectedPos] = useState<[number, number][]>([]);
  const [deleteScheduleId, setDeleteScheduleId] = useState<string | null>(null);
  const [isDeletingSchedule, setIsDeletingSchedule] = useState(false);
  const [isSubmittingSchedule, setIsSubmittingSchedule] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

const getScheduleStatus = (schedule?: ScheduleActivity | null) => {
  if (!schedule) {
    return {
      label: "Belum Ada Jadwal",
      color: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700",
      tooltip: "Tidak ada jadwal kegiatan terpilih",
    };
  }

  if (schedule.isActive === false) {
    return {
      label: "Nonaktif (Libur)",
      color: "bg-amber-100 text-amber-900 border-amber-300",
      tooltip: "Jadwal dinonaktifkan secara manual oleh developer",
    };
  }

  const now = new Date();
  const start = new Date(schedule.date);
  start.setHours(0, 0, 0, 0);

  const end = schedule.endDate ? new Date(schedule.endDate) : new Date(schedule.date);
  end.setHours(23, 59, 59, 999);

  if (now > end) {
    return {
      label: "Selesai",
      color: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700",
      tooltip: "Periode pelaksanaan kegiatan sudah berakhir (kedaluwarsa)",
    };
  }

  if (now < start) {
    return {
      label: "Mendatang",
      color: "bg-sky-100 text-sky-800 border-sky-300",
      tooltip: "Jadwal kegiatan terdaftar untuk masa mendatang",
    };
  }

  return {
    label: "Aktif",
    color: "bg-emerald-100 text-emerald-800 border-emerald-300",
    tooltip: "Kegiatan sedang berlangsung dalam rentang tanggal jadwal",
  };
};

  // Dynamic Targets & Ketentuan Waktu (Managed by Super User / Taskforce / Developer)
  const ALL_DAYS_LIST = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

  const parseDaysFromString = (str?: string): string[] => {
    if (!str) return ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
    const s = str.toLowerCase();
    if (s.includes("senin") && s.includes("jumat")) {
      return ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
    }
    if (s.includes("senin") && s.includes("sabtu")) {
      return ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    }
    if (s.includes("setiap") || (s.includes("senin") && s.includes("minggu"))) {
      return ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
    }
    const matched = ALL_DAYS_LIST.filter((d) => s.includes(d.toLowerCase()));
    return matched.length > 0 ? matched : ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
  };

  const formatDaysToString = (days: string[]): string => {
    if (days.length === 5 && ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"].every((d) => days.includes(d))) {
      return "Senin – Jumat";
    }
    if (days.length === 6 && ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"].every((d) => days.includes(d))) {
      return "Senin – Sabtu";
    }
    if (days.length === 7) {
      return "Setiap Hari (Senin – Minggu)";
    }
    return days.join(", ");
  };

  const parseTimeRange = (timeStr?: string): { start: string; end: string } => {
    if (!timeStr) return { start: "08:00", end: "16:00" };
    const matches = timeStr.match(/(\d{1,2}[:.]\d{2})\s*(?:-|–|s\/d|sampai)\s*(\d{1,2}[:.]\d{2})/i);
    if (matches) {
      return {
        start: matches[1].replace(".", ":").padStart(5, "0"),
        end: matches[2].replace(".", ":").padStart(5, "0"),
      };
    }
    return { start: "08:00", end: "16:00" };
  };

  const [configTargets, setConfigTargets] = useState<ConfigTargets>({
    targetTotalKegiatan: 2000,
    targetTotalJam: 200,
    targetHarianJam: 4,
    targetHarianKegiatan: 5,
    attendanceMinDurationHours: 4,
    attendanceMinDurationMinutes: 0,
    attendanceMinDurationSeconds: 0,
    hariKerja: "Senin – Jumat",
    jamKerja: "08:00 – 16:00 WIB",
    targetPekan: 10,
    targetTotalHari: 50,
  });

  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [formDays, setFormDays] = useState<string[]>(["Senin", "Selasa", "Rabu", "Kamis", "Jumat"]);
  const [formStartTime, setFormStartTime] = useState<string>("08:00");
  const [formEndTime, setFormEndTime] = useState<string>("16:00");
  const [formDurasiJam, setFormDurasiJam] = useState<number>(4);
  const [formDurasiMenit, setFormDurasiMenit] = useState<number>(0);
  const [formTargetPekan, setFormTargetPekan] = useState<number>(10);
  const [formTotalHari, setFormTotalHari] = useState<number>(50);
  const [formTotalJam, setFormTotalJam] = useState<number>(200);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  const calculatePreciseTargetJam = (totalHari: number, jam: number, menit: number): number => {
    const totalMins = totalHari * (jam * 60 + menit);
    const totalHours = totalMins / 60;
    return Number.isInteger(totalHours) ? totalHours : Math.round(totalHours * 100) / 100;
  };

  const openConfigModal = () => {
    const parsedDays = parseDaysFromString(configTargets.hariKerja);
    const parsedTimes = parseTimeRange(configTargets.jamKerja);
    const pekan = configTargets.targetPekan || 10;
    const daysCount = parsedDays.length || 5;
    const totalHari = configTargets.targetTotalHari || (pekan * daysCount);

    const durJam = Number(configTargets.attendanceMinDurationHours !== undefined ? configTargets.attendanceMinDurationHours : 4);
    const durMenit = Number(configTargets.attendanceMinDurationMinutes !== undefined ? configTargets.attendanceMinDurationMinutes : 0);
    const computedTotalJam = calculatePreciseTargetJam(totalHari, durJam, durMenit);

    setFormDays(parsedDays);
    setFormStartTime(parsedTimes.start);
    setFormEndTime(parsedTimes.end);
    setFormDurasiJam(durJam);
    setFormDurasiMenit(durMenit);
    setFormTargetPekan(pekan);
    setFormTotalHari(totalHari);
    setFormTotalJam(computedTotalJam);
    setIsConfigModalOpen(true);
  };

  const handleDaysPreset = (preset: "SENIN_JUMAT" | "SENIN_SABTU" | "SETIAP_HARI") => {
    let nextDays: string[] = [];
    if (preset === "SENIN_JUMAT") nextDays = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
    else if (preset === "SENIN_SABTU") nextDays = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    else nextDays = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

    setFormDays(nextDays);
    const newTotalHari = formTargetPekan * nextDays.length;
    setFormTotalHari(newTotalHari);
    const newTotalJam = calculatePreciseTargetJam(newTotalHari, formDurasiJam, formDurasiMenit);
    setFormTotalJam(newTotalJam);
  };

  const handleToggleDay = (day: string) => {
    let nextDays: string[];
    if (formDays.includes(day)) {
      if (formDays.length <= 1) {
        toast.error("Minimal harus memilih 1 hari kerja operasional.");
        return;
      }
      nextDays = formDays.filter((d) => d !== day);
    } else {
      nextDays = [...formDays, day].sort((a, b) => ALL_DAYS_LIST.indexOf(a) - ALL_DAYS_LIST.indexOf(b));
    }
    setFormDays(nextDays);
    const newTotalHari = formTargetPekan * nextDays.length;
    setFormTotalHari(newTotalHari);
    const newTotalJam = calculatePreciseTargetJam(newTotalHari, formDurasiJam, formDurasiMenit);
    setFormTotalJam(newTotalJam);
  };

  const handlePekanChange = (pekan: number) => {
    setFormTargetPekan(pekan);
    const daysCount = formDays.length || 1;
    const newTotalHari = pekan * daysCount;
    setFormTotalHari(newTotalHari);
    const newTotalJam = calculatePreciseTargetJam(newTotalHari, formDurasiJam, formDurasiMenit);
    setFormTotalJam(newTotalJam);
  };

  const handleDurasiChange = (jam: number, menit: number) => {
    setFormDurasiJam(jam);
    setFormDurasiMenit(menit);
    const newTotalJam = calculatePreciseTargetJam(formTotalHari, jam, menit);
    setFormTotalJam(newTotalJam);
  };

  const handleTotalHariChange = (hari: number) => {
    setFormTotalHari(hari);
    const daysCount = formDays.length || 1;
    const computedPekan = Math.max(1, Math.ceil(hari / daysCount));
    setFormTargetPekan(computedPekan);
    const newTotalJam = calculatePreciseTargetJam(hari, formDurasiJam, formDurasiMenit);
    setFormTotalJam(newTotalJam);
  };

  const fetchConfigTargets = async () => {
    try {
      const data = await dplService.getConfigTargets();
      if (data) {
        setConfigTargets(data);
      }
    } catch (err) {
      console.error("Gagal memuat target:", err);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!["SUPER_USER", "DEVELOPER"].includes(userRole)) {
      toast.error("Hanya Developer dan Super User yang memiliki hak akses mengubah ketentuan target.");
      return;
    }
    if (formDays.length === 0) {
      toast.error("Pilih minimal 1 hari kerja operasional.");
      return;
    }
    if (!formStartTime || !formEndTime) {
      toast.error("Isi jam mulai dan jam selesai operasional.");
      return;
    }
    const totalMenitHarian = formDurasiJam * 60 + formDurasiMenit;
    if (totalMenitHarian <= 0) {
      toast.error("Target minimal durasi harian harus lebih dari 0.");
      return;
    }
    const durasiTotalHarian = totalMenitHarian / 60;

    setIsSavingConfig(true);
    try {
      const payload: Partial<ConfigTargets> = {
        hariKerja: formatDaysToString(formDays),
        jamKerja: `${formStartTime} – ${formEndTime} WIB`,
        targetPekan: Number(formTargetPekan),
        targetTotalHari: Number(formTotalHari),
        targetHarianJam: durasiTotalHarian,
        targetTotalJam: Number(formTotalJam),
        attendanceMinDurationHours: Number(formDurasiJam),
        attendanceMinDurationMinutes: Number(formDurasiMenit),
        attendanceMinDurationSeconds: 0,
      };

      const res = await dplService.updateConfigTargets(payload);
      setConfigTargets(res);
      toast.success("Ketentuan waktu & target kegiatan berhasil diperbarui!");
      setIsConfigModalOpen(false);
      fetchAttendanceAndLocations(selectedScheduleId, selectedKelompokId);
    } catch (err: any) {
      console.error("Gagal update target:", err);
      toast.error(err.response?.data?.message || "Gagal menyimpan ketentuan & target kegiatan");
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Map settings
  const [mapCenter, setMapCenter] = useState<[number, number]>([-6.8915, 107.6107]);
  const [mapZoom, setMapZoom] = useState<number>(15);

  const visibleSchedules = useMemo(() => {
    if (!selectedKelompokId) return schedules;
    return schedules.filter(
      (s) => !s.kelompokId || s.kelompokId === selectedKelompokId
    );
  }, [schedules, selectedKelompokId]);

  const activeSchedule = useMemo(() => {
    return visibleSchedules.find((s) => s.id === selectedScheduleId);
  }, [visibleSchedules, selectedScheduleId]);

  const scheduleTargetHours = useMemo(() => {
    const h = Number(configTargets.attendanceMinDurationHours || 0);
    const m = Number(configTargets.attendanceMinDurationMinutes || 0);
    const s = Number(configTargets.attendanceMinDurationSeconds || 0);
    const totalH = (h * 3600 + m * 60 + s) / 3600;
    if (totalH > 0) return totalH;

    const harian = Number(configTargets.targetHarianJam);
    if (!isNaN(harian) && harian > 0) return harian;

    if (configTargets.targetTotalJam && configTargets.targetTotalHari && configTargets.targetTotalHari > 0) {
      return configTargets.targetTotalJam / configTargets.targetTotalHari;
    }

    return 4;
  }, [
    configTargets.attendanceMinDurationHours,
    configTargets.attendanceMinDurationMinutes,
    configTargets.attendanceMinDurationSeconds,
    configTargets.targetHarianJam,
    configTargets.targetTotalJam,
    configTargets.targetTotalHari,
  ]);

  // Attendance metrics counts
  const attendanceStats = useMemo(() => {
    const total = attendance.length;
    const active = attendance.filter((a) => {
      const st = String(a.status || "").toUpperCase();
      const isIzinSakit = st.includes("IZIN") || st.includes("SAKIT");
      const isFinished = Boolean(a.completedAt) || st === "HADIR_MEMENUHI" || st === "HADIR_TIDAK_MEMENUHI" || st === "SELESAI";
      return Boolean(a.attendedAt) && !isFinished && !isIzinSakit;
    }).length;
    const completed = attendance.filter((a) => {
      const st = String(a.status || "").toUpperCase();
      const isIzinSakit = st.includes("IZIN") || st.includes("SAKIT");
      return (Boolean(a.completedAt) || st === "HADIR_MEMENUHI" || st === "HADIR_TIDAK_MEMENUHI" || st === "SELESAI") && !isIzinSakit;
    }).length;
    const izinSakit = attendance.filter((a) => {
      const st = String(a.status || "").toUpperCase();
      return st.includes("IZIN") || st.includes("SAKIT");
    }).length;
    const notAttended = attendance.filter((a) => {
      const st = String(a.status || "").toUpperCase();
      const isIzinSakit = st.includes("IZIN") || st.includes("SAKIT");
      const isAttended = Boolean(a.attendedAt) || st === "HADIR_MEMENUHI" || st === "HADIR_TIDAK_MEMENUHI" || st === "SELESAI";
      return !isAttended && !isIzinSakit;
    }).length;
    const fulfilledTarget = attendance.filter((a) => {
      const st = String(a.status || "").toUpperCase();
      if (st === "HADIR_MEMENUHI") return true;
      if (st === "HADIR_TIDAK_MEMENUHI" || st === "SELESAI_TELAT") return false;
      if (a.isMemenuhiDurasi !== undefined) return a.isMemenuhiDurasi;
      if (!a.completedAt) return false;
      const mins = calculateDurationMinutes(a.attendedAt, a.completedAt);
      return mins >= scheduleTargetHours * 60;
    }).length;

    return { total, active, completed, izinSakit, notAttended, fulfilledTarget };
  }, [attendance, scheduleTargetHours]);

  const fetchGroups = async () => {
    try {
      const res = await api.get("/kelompok");
      const list =
        res.data?.groups ||
        res.data?.data ||
        (Array.isArray(res.data) ? res.data : []);
      setGroups(list);
      if (isDpl && list.length > 0) {
        setSelectedKelompokId(list[0].id);
      }
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

  const fetchAttendanceAndLocations = async (
    scheduleId?: string,
    kelompokId?: string
  ) => {
    try {
      if (scheduleId) {
        const attRes = await api.get(`/kegiatan/${scheduleId}/absen`);
        setAttendance(attRes.data.data || []);
      } else {
        // Fallback: Jika belum ada kegiatan terjadwal, ambil timesheet/roster mahasiswa agar halaman tidak kosong
        try {
          const tsRes = await api.get("/timesheet/summary", {
            params: { kelompokId: kelompokId || undefined },
          });
          const studentList = tsRes.data?.data?.students || [];
          if (studentList.length > 0) {
            const mappedAttendance: AttendanceRecord[] = studentList.map(
              (s: any) => ({
                id: `roster-${s.studentId}`,
                studentId: s.studentId,
                scheduleId: "",
                attendedAt: "",
                completedAt: "",
                method: "MANUAL",
                latitude: "0",
                longitude: "0",
                status: "BELUM_ADA_JADWAL",
                currentStatus: "BELUM_ABSEN",
                student: {
                  id: s.studentId,
                  name: s.studentName,
                  studentProfile: {
                    nim: s.nim,
                    jurusan: s.jurusan,
                    isKetua: s.isKetua,
                    kelompok: {
                      id: s.kelompokId,
                      name: s.kelompokName,
                      kelurahan: s.kelurahan,
                    },
                  },
                },
                kelompokName: s.kelompokName,
                totalHours: s.totalHours,
                totalMinutes: s.totalMinutes,
              })
            );
            setAttendance(mappedAttendance);
          } else {
            setAttendance([]);
          }
        } catch (_tsErr) {
          setAttendance([]);
        }
      }

      // Fetch live GPS markers (filtered by kelompok if selected)
      const locRes = await api.get("/mahasiswa/lokasi-aktif", {
        params: { kelompokId: kelompokId || undefined },
      });
      setStudentLocations(locRes.data.data || []);
    } catch (err: any) {
      console.error("[fetchAttendanceAndLocations] error:", err);
    }
  };

  const fetchFacilities = async () => {
    try {
      const res = await api.get("/facilities");
      const list =
        res.data?.data ||
        (Array.isArray(res.data) ? res.data : []);
      setFacilities(list);
    } catch (_e) {
      // Ignored
    }
  };

  useEffect(() => {
    fetchSchedules();
    fetchGroups();
    fetchFacilities();
    fetchConfigTargets();
  }, []);

  useEffect(() => {
    if (visibleSchedules.length > 0) {
      setSelectedScheduleId((prev) => {
        if (prev && visibleSchedules.some((s) => s.id === prev)) return prev;
        
        // Utamakan jadwal hari ini (WIB)
        const todayStr = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().split("T")[0];
        const todaySched = visibleSchedules.find((s) => {
          if (!s.date) return false;
          const dStr = new Date(new Date(s.date).toISOString()).toISOString().split("T")[0];
          return dStr === todayStr;
        });
        if (todaySched) return todaySched.id;

        return visibleSchedules[0].id;
      });
    } else {
      setSelectedScheduleId("");
    }
  }, [selectedKelompokId, visibleSchedules]);

  useEffect(() => {
    fetchAttendanceAndLocations(selectedScheduleId, selectedKelompokId);
  }, [selectedScheduleId, selectedKelompokId]);

  useEffect(() => {
    if (activeSchedule) {
      const center = getCenterFromSchedule(activeSchedule);
      setMapCenter(center);
    } else if (selectedKelompokId) {
      const grp = groups.find((g) => g.id === selectedKelompokId);
      if (grp) {
        const loc = getKelompokLocationInfo(grp);
        setMapCenter(loc.centroid);
      }
    } else {
      setMapCenter([-6.8906, 107.6150]);
    }
  }, [selectedKelompokId, activeSchedule, groups]);

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [studentSearch, attendanceFilterTab, selectedKelompokId, selectedScheduleId]);

  // WebSocket Live GPS & Attendance Tracking for Developer & Super Admin (and seamless real-time map/table updates)
  useEffect(() => {
    const unsubStatus = wsClient.onStatusChange((status) => {
      setWsStatus(status);
    });

    const unsubLoc = wsClient.onStudentLocation((locData) => {
      if (!locData || !locData.studentId) return;
      const lat = Number(locData.latitude);
      const lng = Number(locData.longitude);
      if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return;

      const recordedAt = locData.recordedAt || new Date().toISOString();

      setStudentLocations((prev) => {
        const index = prev.findIndex((s) => s.studentId === locData.studentId);
        const studentInfo = locData.student || {
          id: locData.studentId,
          name: locData.namaMahasiswa || locData.name || "Mahasiswa KKN",
          email: "",
          phone: locData.phone || "",
          studentProfile: {
            nim: locData.nim || "-",
            jurusan: locData.jurusan || "-",
            kelompokId: locData.kelompokId || null,
          },
        };

        const updatedItem: StudentLoc = {
          id: locData.id || `loc-${locData.studentId}-${Date.now()}`,
          studentId: locData.studentId,
          latitude: String(lat),
          longitude: String(lng),
          recordedAt: recordedAt,
          student: studentInfo,
        };

        if (index >= 0) {
          const next = [...prev];
          next[index] = {
            ...next[index],
            latitude: String(lat),
            longitude: String(lng),
            recordedAt: recordedAt,
            student: {
              ...next[index].student,
              ...studentInfo,
            },
          };
          return next;
        } else {
          return [updatedItem, ...prev];
        }
      });

      // Synchronize attendance list coordinates in real time
      setAttendance((prev) => {
        return prev.map((a) => {
          if (a.studentId === locData.studentId || a.student?.id === locData.studentId) {
            const actualMins = locData.actualInZoneMinutes ?? locData.inZoneMinutes;
            return {
              ...a,
              latitude: String(lat),
              longitude: String(lng),
              actualInZoneMinutes: actualMins !== undefined ? actualMins : (a as any).actualInZoneMinutes,
            };
          }
          return a;
        });
      });
    });

    const unsubLogout = wsClient.onStudentLogout((data) => {
      if (!data || !data.studentId) return;
      setStudentLocations((prev) => prev.filter((s) => s.studentId !== data.studentId));
    });

    const unsubCheckout = wsClient.onStudentCheckout((data) => {
      if (!data || !data.studentId) return;
      setAttendance((prev) =>
        prev.map((a) =>
          a.studentId === data.studentId
            ? {
                ...a,
                completedAt: data.checkOutAt || new Date().toISOString(),
                status: "SELESAI",
                currentStatus: "SELESAI",
                totalMinutes: data.durationMinutes || a.totalMinutes,
              }
            : a
        )
      );
    });

    const unsubAttendance = wsClient.onStudentAttendance((attData) => {
      if (!attData || !attData.studentId) return;
      setAttendance((prev) => {
        const index = prev.findIndex((a) => a.studentId === attData.studentId);
        if (index >= 0) {
          const next = [...prev];
          const recAny = next[index] as any;
          next[index] = {
            ...recAny,
            id: attData.id || recAny.id,
            attendedAt: attData.attendedAt || recAny.attendedAt,
            completedAt: attData.completedAt !== undefined ? attData.completedAt : recAny.completedAt,
            status: attData.status || recAny.status,
            currentStatus: attData.status || recAny.currentStatus,
            method: attData.method || recAny.method,
            latitude: attData.latitude !== undefined ? attData.latitude : recAny.latitude,
            longitude: attData.longitude !== undefined ? attData.longitude : recAny.longitude,
            totalMinutes: attData.totalMinutes !== undefined ? attData.totalMinutes : recAny.totalMinutes,
            actualInZoneMinutes: attData.actualInZoneMinutes !== undefined ? attData.actualInZoneMinutes : recAny.actualInZoneMinutes,
          };
          return next;
        } else if (attData.student) {
          const newRec: AttendanceRecord = {
            id: attData.id || `att-${Date.now()}`,
            scheduleId: attData.scheduleId || selectedScheduleId,
            studentId: attData.studentId,
            attendedAt: attData.attendedAt || new Date().toISOString(),
            completedAt: attData.completedAt || null,
            status: attData.status || "HADIR",
            currentStatus: attData.status || "HADIR",
            method: attData.method || "GPS_ACTIVITY",
            latitude: attData.latitude,
            longitude: attData.longitude,
            student: attData.student,
          };
          return [newRec, ...prev];
        }
        return prev;
      });
    });

    // Auto-decay stale student markers older than 5 minutes every 30 seconds
    const decayInterval = setInterval(() => {
      const now = Date.now();
      setStudentLocations((prev) =>
        prev.filter((loc) => {
          const time = new Date(loc.recordedAt).getTime();
          return !isNaN(time) && now - time < 5 * 60 * 1000;
        })
      );
    }, 30000);

    // Fallback automatic refresh every 15 seconds if WebSocket is not CONNECTED
    const fallbackPollingInterval = setInterval(() => {
      if (wsStatus !== "CONNECTED") {
        fetchAttendanceAndLocations(selectedScheduleId, selectedKelompokId);
      }
    }, 15000);

    return () => {
      unsubStatus();
      unsubLoc();
      unsubLogout();
      unsubCheckout();
      unsubAttendance();
      clearInterval(decayInterval);
      clearInterval(fallbackPollingInterval);
    };
  }, [selectedScheduleId]);

  // Export Attendance Rekap to CSV
  const handleExportCSV = () => {
    if (!attendance || attendance.length === 0) {
      toast.error(
        "Tidak ada data presensi pada kegiatan/periode ini untuk diekspor."
      );
      return;
    }

    let filtered = [...attendance];
    if (exportPeriod === "BULAN_INI") {
      const now = new Date();
      filtered = filtered.filter((r) => {
        const d = r.attendedAt ? new Date(r.attendedAt) : new Date();
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      });
    } else if (exportPeriod === "30_HARI") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      filtered = filtered.filter((r) => {
        const d = r.attendedAt ? new Date(r.attendedAt) : new Date();
        return d >= thirtyDaysAgo;
      });
    } else if (exportPeriod === "CUSTOM" && exportStartDate && exportEndDate) {
      const start = new Date(exportStartDate);
      const end = new Date(exportEndDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter((r) => {
        const d = r.attendedAt ? new Date(r.attendedAt) : new Date();
        return d >= start && d <= end;
      });
    }

    if (filtered.length === 0) {
      toast.error(
        "Tidak ada data presensi pada filter periode tanggal yang dipilih."
      );
      return;
    }

    const headers = [
      "Nama Mahasiswa",
      "NIM",
      "Status Absensi",
      "Waktu Masuk",
      "Waktu Pulang",
      "Durasi (Menit)",
    ];
    const rows = filtered.map((rec) => {
      const isAttended = Boolean(rec.attendedAt);
      const isCompleted = Boolean(rec.completedAt);
      const statusUpper = String(rec.status || "").toUpperCase();
      const isFinished = isCompleted || statusUpper === "HADIR_MEMENUHI" || statusUpper === "HADIR_TIDAK_MEMENUHI" || statusUpper === "SELESAI";
      const recAny = rec as any;
      const liveElapsedMins = calculateDurationMinutes(rec.attendedAt, rec.completedAt);
      const storedMins = (recAny.actualInZoneMinutes !== null && recAny.actualInZoneMinutes !== undefined) ? Number(recAny.actualInZoneMinutes) : 0;
      const durationMins = storedMins > 0 ? storedMins : liveElapsedMins;

      let statusStr = "Belum Absen";
      if (statusUpper.includes("SAKIT")) {
        statusStr = "Sakit (Disetujui)";
      } else if (statusUpper.includes("IZIN")) {
        statusStr = "Izin (Disetujui)";
      } else if (statusUpper.includes("ALPA")) {
        statusStr = "Alpa";
      } else if (isAttended && !isFinished) {
        statusStr = "Sedang di Lapangan";
      } else if (isFinished) {
        const isMemenuhi = rec.isMemenuhiDurasi !== undefined
          ? rec.isMemenuhiDurasi
          : (statusUpper === "HADIR_MEMENUHI" ? true : statusUpper === "HADIR_TIDAK_MEMENUHI" || statusUpper === "SELESAI_TELAT" ? false : (durationMins >= scheduleTargetHours * 60));
        statusStr = isMemenuhi ? "Hadir & Memenuhi" : "Hadir & Tidak Memenuhi";
      }

      return [
        `"${(rec.student?.name || "").replace(/"/g, '""')}"`,
        `"${rec.student?.studentProfile?.nim || "-"}"`,
        `"${statusStr}"`,
        `"${rec.attendedAt ? new Date(rec.attendedAt).toLocaleString("id-ID") : "-"}"`,
        `"${rec.completedAt ? new Date(rec.completedAt).toLocaleString("id-ID") : "-"}"`,
        durationMins,
      ].join(",");
    });

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Rekap_Presensi_KKN_${activeSchedule?.title || "Kegiatan"}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportModalOpen(false);
    toast.success(
      `Laporan Presensi (${filtered.length} baris) berhasil diunduh`
    );
  };

  // Fly Map to Mahasiswa Location & smooth scroll to Map Section
  const handleFocusMahasiswaMap = (rec: AttendanceRecord) => {
    const liveLoc = studentLocations.find(l => l.studentId === rec.student.id || l.student?.id === rec.student.id);
    const lat = liveLoc ? Number(liveLoc.latitude) : Number(rec.latitude);
    const lng = liveLoc ? Number(liveLoc.longitude) : Number(rec.longitude);
    
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      setMapCenter([lat, lng]);
      setMapZoom(18);
      setShowMap(true);
      
      const mapElement = document.getElementById("monitoring-map-section");
      if (mapElement) {
        mapElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      
      const nameClean = rec.student.name.replace(/👑|\(Ketua Kelompok\)/g, "").trim();
      toast.success(
        `Berhasil fokus ke lokasi GPS live mahasiswa: ${nameClean}`
      );
    } else {
      toast.error("Koordinat GPS lokasi absensi mahasiswa belum tersedia");
    }
  };

  // Filtered Attendance List
  const filteredAttendance = useMemo(() => {
    return attendance.filter((rec) => {
      const isAttended = Boolean(rec.attendedAt);
      const isCompleted = Boolean(rec.completedAt);
      const statusUpper = String(rec.status || "").toUpperCase();
      const isSakit = statusUpper.includes("SAKIT");
      const isIzin = statusUpper.includes("IZIN");
      const isIzinSakit = isIzin || isSakit;
      const isTanpaKeterangan = statusUpper.includes("ALPHA") || statusUpper.includes("TANPA_KETERANGAN") || statusUpper.includes("ALPA");
      const isBelumAdaJadwal = statusUpper === "BELUM_ADA_JADWAL";
      const isFinished = isCompleted || statusUpper === "HADIR_MEMENUHI" || statusUpper === "HADIR_TIDAK_MEMENUHI" || statusUpper === "SELESAI";
      const isHadir = (isAttended || isFinished) && !isTanpaKeterangan && !isIzinSakit && !isBelumAdaJadwal;
      const isActivePresence = isHadir && !isFinished;

      if (attendanceFilterTab === "ACTIVE" && !isActivePresence) return false;
      if (attendanceFilterTab === "COMPLETED" && (!isFinished || isIzinSakit)) return false;
      if (attendanceFilterTab === "IZIN_SAKIT" && !isIzinSakit) return false;
      if (attendanceFilterTab === "NOT_ATTENDED" && (isHadir || isIzinSakit)) return false;

      if (studentSearch.trim()) {
        const q = studentSearch.toLowerCase();
        const name = (rec.student?.name || "").toLowerCase();
        const nim = (rec.student?.studentProfile?.nim || "").toLowerCase();
        return name.includes(q) || nim.includes(q);
      }
      return true;
    });
  }, [attendance, attendanceFilterTab, studentSearch]);

  // Paginated Attendance for Table & Card views
  const totalPages = Math.max(1, Math.ceil(filteredAttendance.length / pageSize));
  const paginatedAttendance = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAttendance.slice(start, start + pageSize);
  }, [filteredAttendance, currentPage, pageSize]);

  // Active student markers with smart clustering (Anti-Numpuk)
  const activeStudentMarkers = useMemo(() => {
    type GroupedStudent = {
      key: string;
      centerLat: number;
      centerLng: number;
      students: Array<{
        loc: StudentLoc;
        record: any;
        isActivePresence: boolean;
        isInsideZone: boolean;
      }>;
    };

    const groups: Record<string, GroupedStudent> = {};

    studentLocations.forEach((loc, idx) => {
      const lat = Number(loc.latitude);
      const lng = Number(loc.longitude);
      if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return;

      const studentRecord = attendance.find(
        (a) => a.studentId === loc.studentId
      );

      const isAttended = Boolean(
        studentRecord && (studentRecord.status === "HADIR" || studentRecord.attendedAt || studentRecord.method)
      );

      let isInsideZone = false;
      if (activeSchedule) {
        if (activeSchedule.polygon && Array.isArray(activeSchedule.polygon) && activeSchedule.polygon.length >= 3) {
          isInsideZone = isPointInPoly(lat, lng, activeSchedule.polygon);
        } else if (activeSchedule.latitude && activeSchedule.longitude) {
          const schedLat = Number(activeSchedule.latitude);
          const schedLng = Number(activeSchedule.longitude);
          const rad = activeSchedule.radius || 150;
          if (!isNaN(schedLat) && !isNaN(schedLng) && schedLat !== 0 && schedLng !== 0) {
            const dist = getDistanceInMeters(lat, lng, schedLat, schedLng);
            isInsideZone = dist <= rad;
          }
        }
      }

      const recordedTime = new Date(loc.recordedAt).getTime();
      const isRecentLocation = !isNaN(recordedTime) && (Date.now() - recordedTime) < 30 * 60 * 1000;

      const isActivePresence = isAttended || isInsideZone || (isRecentLocation && Boolean(activeSchedule));

      // Smart zoom-aware grid key: if zoomed in close (zoom >= 17), do not cluster unless exactly same coordinates
      const gridKey = mapZoom >= 17 ? `${loc.studentId || idx}` : `${lat.toFixed(4)}_${lng.toFixed(4)}`;

      if (!groups[gridKey]) {
        groups[gridKey] = {
          key: gridKey,
          centerLat: lat,
          centerLng: lng,
          students: [],
        };
      }
      groups[gridKey].students.push({
        loc,
        record: studentRecord,
        isActivePresence,
        isInsideZone,
      });
    });

    const items: React.ReactNode[] = [];

    Object.values(groups).forEach((grp) => {
      const count = grp.students.length;
      const activeCount = grp.students.filter((s) => s.isActivePresence).length;

      if (count === 1) {
        const s = grp.students[0];
        const isHadir = Boolean(s.record && (s.record.status === "HADIR" || s.record.attendedAt));

        let badgeText = "STANDBY";
        let badgeColorClass = "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200";

        if (isHadir) {
          badgeText = "HADIR";
          badgeColorClass = "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700";
        } else if (s.isInsideZone) {
          badgeText = "DI ZONA (PRESENSI)";
          badgeColorClass = "bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border-teal-300 dark:border-teal-700";
        } else if (s.isActivePresence) {
          badgeText = "AKTIF LAPANGAN";
          badgeColorClass = "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700";
        }

        items.push(
          <Marker
            key={`student-single-${s.loc.studentId}`}
            position={[grp.centerLat, grp.centerLng]}
            icon={
              s.isActivePresence
                ? createActivePresenceIcon(s.loc.student.name)
                : createStudentIcon("in_radius")
            }
          >
            <Popup>
              <div className="p-2 font-sans space-y-1 text-xs min-w-[200px]">
                <div className="flex items-center justify-between gap-1.5 mb-1">
                  <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">
                    {s.loc.student.name}
                  </span>
                  <span className={`font-black text-[9px] px-1.5 py-0.5 rounded-full border ${badgeColorClass}`}>
                    {badgeText}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-mono">
                  NIM: {s.loc.student.studentProfile?.nim || "-"}
                </p>
                <p className="text-[10.5px] text-slate-500">
                  Update GPS: {new Date(s.loc.recordedAt).toLocaleTimeString("id-ID")}
                </p>
                {s.record?.attendedAt && (
                  <div className="mt-1.5 p-1.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800/60 text-[10px] text-emerald-800 dark:text-emerald-300 font-bold">
                    Waktu Masuk: {new Date(s.record.attendedAt).toLocaleTimeString("id-ID")} | Durasi: {formatDurationText(calculateDurationMinutes(s.record.attendedAt))}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      } else {
        items.push(
          <Marker
            key={`student-cluster-${grp.key}`}
            position={[grp.centerLat, grp.centerLng]}
            icon={createMhsClusterIcon(count, activeCount)}
          >
            <Popup>
              <div className="p-2 font-sans space-y-2 text-xs min-w-[240px] max-w-[280px] max-h-[260px] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-black text-[10px] px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">
                      🎓 {count} Mahasiswa di Lokasi Ini
                    </span>
                  </div>
                  {activeCount > 0 && (
                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                      {activeCount} Aktif
                    </span>
                  )}
                </div>
                <div className="space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800">
                  {grp.students.map((s, sIdx) => {
                    const statusUpper = String(s.record?.status || "").toUpperCase();
                    const isHadir = Boolean(s.record && (statusUpper === "HADIR" || statusUpper === "SELESAI"));
                    const isBerlangsung = Boolean(s.record && (statusUpper === "BERLANGSUNG" || statusUpper === "DALAM_RADIUS" || statusUpper === "DI_ZONA"));
                    let badgeText = "Standby";
                    let badgeClass = "bg-slate-100 dark:bg-slate-800 text-slate-500 text-[8.5px] px-1 py-0.2 rounded";

                    if (isHadir) {
                      badgeText = "Hadir";
                      badgeClass = "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold text-[8.5px] px-1 py-0.2 rounded border border-emerald-200 dark:border-emerald-800";
                    } else if (isBerlangsung) {
                      badgeText = "Berlangsung";
                      badgeClass = "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 font-bold text-[8.5px] px-1 py-0.2 rounded border border-amber-200 dark:border-amber-850";
                    } else if (s.isInsideZone) {
                      badgeText = "Di Zona";
                      badgeClass = "bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-400 font-bold text-[8.5px] px-1 py-0.2 rounded border border-teal-200 dark:border-teal-800";
                    } else if (s.isActivePresence) {
                      badgeText = "Aktif";
                      badgeClass = "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold text-[8.5px] px-1 py-0.2 rounded border border-emerald-200 dark:border-emerald-800";
                    }

                    return (
                      <div key={s.loc.studentId || sIdx} className="pt-1.5 first:pt-0 space-y-0.5">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-[11px] truncate">
                            {s.loc.student.name}
                          </span>
                          <span className={badgeClass}>
                            {badgeText}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                          <span>NIM: {s.loc.student.studentProfile?.nim || "-"}</span>
                          <span>{new Date(s.loc.recordedAt).toLocaleTimeString("id-ID")}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      }
    });

    return items;
  }, [studentLocations, attendance, activeSchedule, mapZoom]);

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
        kelurahan: "Wilayah Dampingan",
        rws: [] as string[],
        fullAddress: "Wilayah Dampingan Mahasiswa KKN",
        presetLocations: [] as Array<{ label: string; address: string }>,
        centroid: [-6.8906, 107.615] as [number, number],
      };
    }

    const kelurahan = group.kelurahan || "Wilayah Dampingan";
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

    const cleanKelName = kelurahan.toUpperCase().replace(/\s+/g, "_");
    let centroid: [number, number] = [-6.8906, 107.615];
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
    const fullAddress = `${defaultRwName}, Kelurahan ${kelurahan}`;

    const presetLocations: Array<{ label: string; address: string }> = [];
    rws.forEach((rw) => {
      presetLocations.push({
        label: `Balai ${rw}`,
        address: `Balai ${rw}, Kelurahan ${kelurahan}`,
      });
    });
    presetLocations.push({
      label: `Kantor Kel. ${kelurahan}`,
      address: `Kantor Kelurahan ${kelurahan}`,
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

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    if (!startDate) {
      errors.startDate = "Tanggal mulai pelaksanaan wajib diisi";
    } else if (startDate < todayStr) {
      errors.startDate = "Tanggal mulai kegiatan tidak boleh pada hari sebelumnya (masa lalu)";
    }

    if (!endDate) {
      errors.endDate = "Tanggal selesai pelaksanaan wajib diisi";
    } else if (startDate && endDate < startDate) {
      errors.endDate =
        "Tanggal selesai tidak boleh lebih awal dari tanggal mulai";
    }

    if (!startTime) {
      errors.startTime = "Jam mulai wajib diisi";
    }

    if (!endTime) {
      errors.endTime = "Jam selesai wajib diisi";
    } else if (startDate && endDate && startTime && endTime) {
      const startDateTime = new Date(`${startDate}T${startTime}`).getTime();
      const endDateTime = new Date(`${endDate}T${endTime}`).getTime();
      if (!isNaN(startDateTime) && !isNaN(endDateTime) && endDateTime <= startDateTime) {
        if (endTime === "00:00" || endTime.startsWith("00:")) {
          errors.endTime = "Waktu selesai (12:00 AM / 00:00 Tengah Malam) lebih awal dari waktu mulai. Silakan ubah ke 12:00 PM (12 Siang).";
        } else {
          errors.endTime = "Waktu selesai (tanggal & jam) harus lebih besar dari waktu mulai";
        }
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
        errors.geofence =
          "Titik pusat geofence belum ditentukan pada peta";
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
    const targetHours = scheduleTargetHours;
    const totalMinutes = Math.round(targetHours * 60);
    const endTotalMinutes = (8 * 60) + totalMinutes;
    const endHourNum = Math.floor(endTotalMinutes / 60);
    const endMinNum = endTotalMinutes % 60;
    const endHourStr = `${endHourNum < 10 ? `0${endHourNum}` : endHourNum}:${endMinNum < 10 ? `0${endMinNum}` : endMinNum}`;
    setStartTime("08:00");
    setEndTime(endHourStr);
    setIsCustomCategory(false);
    setCustomCategoryText("");
    setFormErrors({});

    const targetGroup =
      (selectedKelompokId && groups.find((g) => g.id === selectedKelompokId)) ||
      (isDpl && groups.length > 0 ? groups[0] : groups[0]);
    const defaultKelompokId = targetGroup ? targetGroup.id : "";
    const locInfo = getKelompokLocationInfo(targetGroup);
    const rwTag = locInfo.rws.length > 0 ? ` ${locInfo.rws.join(", ")}` : "";
    const defaultTitle = targetGroup
      ? `Sosialisasi Pemilahan - Kel. ${locInfo.kelurahan}${rwTag}`
      : "";

    setFormData({
      title: defaultTitle,
      category: "Sosialisasi",
      location: locInfo.fullAddress,
      radius: 100,
      kelompokId: defaultKelompokId,
    });
    setSelectedPos([]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (
    e: React.MouseEvent,
    schedule: ScheduleActivity
  ) => {
    e.stopPropagation();
    setModalMode("edit");
    setModalStep(1);
    setFormErrors({});
    const dateStr = schedule.date
      ? schedule.date.split("T")[0]
      : new Date().toISOString().split("T")[0];
    setStartDate(dateStr);
    setEndDate(schedule.endDate ? schedule.endDate.split("T")[0] : dateStr);
    const parsedTime = parseTimeString(schedule.time);
    setStartTime(parsedTime.start);
    setEndTime(parsedTime.end);

    const cat = schedule.category || "Sosialisasi";
    if (STANDARD_CATEGORIES.includes(cat)) {
      setIsCustomCategory(false);
      setCustomCategoryText("");
    } else {
      setIsCustomCategory(true);
      setCustomCategoryText(cat);
    }

    const defaultKelompokId =
      schedule.kelompokId || (isDpl && groups.length > 0 ? groups[0].id : "");

    setFormData({
      id: schedule.id,
      title: schedule.title,
      category: cat,
      location: schedule.location || "",
      radius: schedule.radius || 100,
      kelompokId: defaultKelompokId,
    });
    if (
      schedule.polygon &&
      Array.isArray(schedule.polygon) &&
      schedule.polygon.length >= 3
    ) {
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

  const handleToggleScheduleActive = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!activeSchedule) return;
    try {
      const newStatus = activeSchedule.isActive === false ? true : false;
      await api.put(`/schedules/${activeSchedule.id}`, { isActive: newStatus });
      toast.success(newStatus ? "Kegiatan berhasil DIAKTIFKAN!" : "Kegiatan berhasil DINONAKTIFKAN (Libur)!");
      fetchSchedules();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal mengubah status kegiatan");
    }
  };

  const handleProceedToStep2 = (e?: React.MouseEvent | React.FormEvent) => {
    if (e) e.preventDefault();
    const step1Errors = validateStep1();
    if (Object.keys(step1Errors).length > 0) {
      setFormErrors(step1Errors);
      const firstErr = Object.values(step1Errors)[0];
      toast.dismiss();
      toast.error(`Periksa Form: ${firstErr}`);
      return;
    }
    setFormErrors({});
    setModalStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Jika masih di langkah 1 (Detail), wajib lanjut ke langkah 2 (Peta) terlebih dahulu
    if (modalStep === 1) {
      handleProceedToStep2(e);
      return;
    }

    const step1Errors = validateStep1();
    const step2Errors = validateStep2();
    const combinedErrors = { ...step1Errors, ...step2Errors };

    if (Object.keys(combinedErrors).length > 0) {
      setFormErrors(combinedErrors);
      toast.dismiss();
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

    // Format: "HH:MM - HH:MM" tanpa suffix WIB agar API parser tidak gagal
    // (parser split ':' → "00 WIB" → NaN → fallback jam 16)
    const timeFormatted = `${startTime} - ${endTime}`;
    const finalCategory = isCustomCategory
      ? customCategoryText.trim()
      : formData.category || "Sosialisasi";

    const targetKelompokId =
      isDpl && groups.length > 0
        ? formData.kelompokId || groups[0].id
        : formData.kelompokId || undefined;

    let calcLat =
      geofenceMode === "CIRCLE" && selectedPos.length >= 1
        ? Number(selectedPos[0][0])
        : undefined;
    let calcLng =
      geofenceMode === "CIRCLE" && selectedPos.length >= 1
        ? Number(selectedPos[0][1])
        : undefined;

    if (geofenceMode === "POLYGON" && selectedPos.length >= 3) {
      const sumLat = selectedPos.reduce((acc: number, p: any) => acc + Number(p[0]), 0);
      const sumLng = selectedPos.reduce((acc: number, p: any) => acc + Number(p[1]), 0);
      calcLat = Number((sumLat / selectedPos.length).toFixed(7));
      calcLng = Number((sumLng / selectedPos.length).toFixed(7));
    }

    const payload = {
      title: (formData.title || "").trim(),
      category: finalCategory,
      // Simpan tanggal sebagai midnight WIB (UTC+7) agar konsisten dengan
      // query window API yang juga berbasis WIB
      date: new Date(`${startDate}T00:00:00+07:00`).toISOString(),
      time: timeFormatted,
      location: (formData.location || "").trim(),
      kelompokId: targetKelompokId,
      radius: Number(formData.radius) || 100,
      latitude: calcLat,
      longitude: calcLng,
      polygon:
        geofenceMode === "POLYGON" && selectedPos.length >= 3
          ? selectedPos
          : undefined,
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
      toast.error(
        err.response?.data?.message ||
          "Terjadi kesalahan saat menyimpan jadwal kegiatan"
      );
    } finally {
      setIsSubmittingSchedule(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-slate-50 dark:bg-slate-800/60">
        <Loader2 className="animate-spin text-emerald-600" size={40} />
      </div>
    );
  }

  const canManageSchedules = [
    "SUPER_USER",
    "ADMIN_DLH",
    "PEMIMPIN",
    "PANITIA_TASKFORCE",
    "DEVELOPER",
  ].includes(userRole);

  const isSuperUserOrDev = ["SUPER_USER", "DEVELOPER"].includes(userRole);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950 dark:bg-slate-800/60 p-4 md:p-6 space-y-5 text-slate-800 dark:text-slate-100">
      {/* Header Utama: Ringkas, Informatif & Aksi Cepat */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0 shadow-2xs">
            <CheckCircle2 size={22} className="text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Monitoring & Validasi Presensi Mahasiswa
              </h1>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                {isDpl ? "Dosen Pendamping Lapangan (DPL)" : "Monitoring Wilayah"}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Pantau jam presensi mahasiswa KKN, verifikasi lokasi geofence GPS, dan unduh berita acara resmi.
            </p>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* WebSocket Live Status Indicator Badge - Eksklusif Role Developer / Super User */}
          {isSuperUserOrDev && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold shadow-2xs ${
                wsStatus === "CONNECTED"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                  : wsStatus === "CONNECTING"
                  ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700"
              }`}
              title={
                wsStatus === "CONNECTED"
                  ? "WebSocket Realtime Terhubung: Presensi dan GPS otomatis diperbarui seketika tanpa perlu refresh halaman."
                  : wsStatus === "CONNECTING"
                  ? "Menghubungkan ke server realtime..."
                  : "WebSocket Terputus (mencoba menyambung kembali)"
              }
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  wsStatus === "CONNECTED"
                    ? "bg-emerald-500 animate-pulse"
                    : wsStatus === "CONNECTING"
                    ? "bg-amber-500 animate-ping"
                    : "bg-slate-400"
                }`}
              />
              <span>{wsStatus === "CONNECTED" ? "Live WebSocket" : wsStatus === "CONNECTING" ? "Menghubungkan..." : "Offline"}</span>
            </div>
          )}

          {/* Filter Kelompok KKN (Multi-Tenant Selector untuk Developer / Super User / DLH / Camat) */}
          {!isDpl ? (
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <Users size={14} className="text-emerald-600 shrink-0" />
              <span className="text-[11px] font-bold text-slate-500 shrink-0">Kelompok:</span>
              <select
                value={selectedKelompokId}
                onChange={(e) => setSelectedKelompokId(e.target.value)}
                className="bg-transparent text-xs font-black text-slate-800 dark:text-slate-100 outline-none cursor-pointer pr-1 max-w-[220px] truncate"
              >
                <option value="">Semua Kelompok (Seluruh Wilayah)</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {formatKelompokDisplayName(g)}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 text-emerald-900 shadow-2xs">
              <Users size={14} className="text-emerald-700 shrink-0" />
              <span className="text-xs font-black">
                {formatKelompokDisplayName(groups.find((g) => g.id === selectedKelompokId) || groups[0])}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowMap(!showMap)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
              showMap
                ? "bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
            }`}
            title="Tampilkan / Sembunyikan Peta Geofence"
          >
            <MapIcon size={14} className={showMap ? "text-emerald-600" : "text-slate-500"} />
            <span>{showMap ? "Sembunyikan Peta" : "Buka Peta GPS"}</span>
          </button>

          <Link
            to="/ajuan-absensi"
            className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700/40 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Buka Halaman Verifikasi Ajuan Izin & Sakit"
          >
            <FileCheck size={14} className="text-amber-600 dark:text-amber-400" />
            <span>Pengajuan Izin/Sakit</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Ekspor Rekap Presensi format CSV"
          >
            <Download size={14} className="text-emerald-600" />
            <span>Ekspor CSV</span>
          </button>

          {isSuperUserOrDev && (
            <button
              type="button"
              onClick={openConfigModal}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Atur Hari, Jam Kerja & Target Kegiatan KKN (Khusus Developer & Super User)"
            >
              <Settings size={14} className="text-emerald-600" />
              <span>Atur Ketentuan & Target</span>
            </button>
          )}

          {canManageSchedules && (
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus size={15} />
              <span>Buat Kegiatan</span>
            </button>
          )}
        </div>
      </div>

      {/* Hero Banner: Info Kegiatan Terpilih & Switcher Kegiatan */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          {/* Kegiatan Info Header */}
          <div className="flex items-center gap-3.5 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0 shadow-2xs">
              <CalendarDays size={24} className="text-emerald-600" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  {activeSchedule?.title || (visibleSchedules.length === 0 ? "Roster Mahasiswa KKN" : "-")}
                </h2>
                {activeSchedule?.category && (
                  <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {activeSchedule.category}
                  </span>
                )}
                {/* Dynamic Status Badge calculated by Dates & Times */}
                {activeSchedule && (
                  <span
                    className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border shadow-2xs ${
                      getScheduleStatus(activeSchedule).color
                    }`}
                    title={getScheduleStatus(activeSchedule).tooltip}
                  >
                    {getScheduleStatus(activeSchedule).label}
                  </span>
                )}
                {!activeSchedule && selectedKelompokId && (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {groups.find((g) => g.id === selectedKelompokId)?.name || "Kelompok KKN"}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500 font-semibold mt-1 flex-wrap">
                {activeSchedule ? (
                  <>
                    <span className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-emerald-600" />
                      {new Date(activeSchedule.date).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} className="text-emerald-600" />
                      {activeSchedule.time || configTargets.jamKerja || "08:00 – 16:00 WIB"} (Target Minimal {formatHoursToUnits(scheduleTargetHours)})
                    </span>
                    <span className="flex items-center gap-1.5 truncate max-w-sm">
                      <MapPin size={14} className="text-emerald-600 shrink-0" />
                      <span className="truncate">
                        {activeSchedule.location || (activeSchedule.kelompok ? `Kelompok ${activeSchedule.kelompok.name}` : "Lokasi Belum Diatur")}
                      </span>
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-slate-500 font-medium">
                    Menampilkan daftar {attendance.length} mahasiswa terdaftar. Belum ada jadwal kegiatan aktif pada filter ini.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Schedule Selector & Manager */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative min-w-[260px]">
              <select
                value={selectedScheduleId}
                onChange={(e) => setSelectedScheduleId(e.target.value)}
                className="w-full h-11 pl-3.5 pr-8 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-extrabold text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 focus:bg-white transition cursor-pointer appearance-none shadow-2xs"
              >
                {visibleSchedules.length === 0 ? (
                  <option value="">Belum ada jadwal {selectedKelompokId ? "pada kelompok ini" : ""}</option>
                ) : (
                  visibleSchedules.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.kelompok ? `[${s.kelompok.name}] ` : "[Bersama] "}
                      {s.title} ({new Date(s.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })})
                    </option>
                  ))
                )}
              </select>
              <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {activeSchedule && (
              <div className="flex items-center gap-1.5">
                {/* Developer Only: Manual Toggle Aktif/Libur Button */}
                {userRole === "DEVELOPER" && (
                  <button
                    type="button"
                    onClick={handleToggleScheduleActive}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border shadow-2xs ${
                      activeSchedule.isActive !== false
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                        : "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                    }`}
                    title="Developer Override: Klik untuk Mengaktifkan / Menonaktifkan Kegiatan Secara Manual"
                  >
                    <Power size={14} className={activeSchedule.isActive !== false ? "text-emerald-600" : "text-amber-600"} />
                    <span>{activeSchedule.isActive !== false ? "Dev: Aktif" : "Dev: Libur"}</span>
                  </button>
                )}

                {canManageSchedules && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => handleOpenEditModal(e, activeSchedule)}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 transition cursor-pointer shadow-2xs"
                      title="Edit Jadwal Kegiatan"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, activeSchedule.id)}
                      className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition cursor-pointer shadow-2xs"
                      title="Hapus Jadwal Kegiatan"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 2-Column Cards: Informasi Waktu Kerja & Target Kegiatan Lapangan */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left Card: Informasi Waktu Kerja */}
          <div className="bg-slate-50/70 dark:bg-slate-800/70 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-100">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 flex items-center justify-center">
                  <Clock size={15} />
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Informasi Waktu Kerja</span>
              </div>
              {isSuperUserOrDev && (
                <button
                  type="button"
                  onClick={openConfigModal}
                  className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Pencil size={12} />
                  <span>Ubah</span>
                </button>
              )}
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-700/60 text-xs">
                <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-semibold">
                  <Calendar size={14} className="text-emerald-600 dark:text-emerald-400" />
                  Hari Kerja Operasional
                </span>
                <span className="font-extrabold text-slate-900 dark:text-slate-100">{configTargets.hariKerja || "Senin – Jumat"}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-700/60 text-xs">
                <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-semibold">
                  <Clock size={14} className="text-emerald-600 dark:text-emerald-400" />
                  Jam Kerja Operasional
                </span>
                <span className="font-extrabold text-slate-900 dark:text-slate-100">{configTargets.jamKerja || "08:00 – 16:00"}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-semibold">
                  <Hourglass size={14} className="text-emerald-600 dark:text-emerald-400" />
                  Minimal Durasi / Hari
                </span>
                <span className="font-extrabold text-slate-900 dark:text-slate-100">{formatTargetDuration(configTargets)}</span>
              </div>
            </div>
          </div>

          {/* Right Card: Target Kegiatan Lapangan */}
          <div className="bg-slate-50/70 dark:bg-slate-800/70 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-100">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 flex items-center justify-center">
                  <Target size={15} />
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Target Kegiatan Lapangan</span>
              </div>
              {isSuperUserOrDev && (
                <button
                  type="button"
                  onClick={openConfigModal}
                  className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Pencil size={12} />
                  <span>Ubah Target</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-700/60 pt-1 text-center">
              <div className="px-2 flex flex-col items-center justify-center">
                <Calendar size={18} className="text-emerald-600 dark:text-emerald-400 mb-1" />
                <span className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{configTargets.targetPekan ?? 10}</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Pekan</span>
                <span className="text-[10px] text-slate-400 font-medium">Periode Kegiatan</span>
              </div>

              <div className="px-2 flex flex-col items-center justify-center">
                <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 mb-1" />
                <span className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{configTargets.targetTotalHari ?? 50}</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Hari</span>
                <span className="text-[10px] text-slate-400 font-medium">Total Hari Kegiatan</span>
              </div>

              <div className="px-2 flex flex-col items-center justify-center">
                <Clock size={18} className="text-emerald-600 dark:text-emerald-400 mb-1" />
                <span className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{formatHoursToUnits(configTargets.targetTotalJam ?? 200)}</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Minimal Target</span>
                <span className="text-[10px] text-slate-400 font-medium">Minimal Jam Kumulatif</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Peta Interaktif Geofence & Lokasi GPS Mahasiswa (Dapat Ditutup / Dibuka) */}
      {showMap && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs animate-in fade-in duration-200">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/70">
            <div className="flex items-center gap-2">
              <MapIcon size={16} className="text-emerald-600" />
              <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                Peta Wilayah Geofence Presensi & Live GPS Mahasiswa
              </span>
              {activeSchedule?.radius && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Radius {activeSchedule.radius}m
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowMap(false)}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <X size={14} /> Tutup Peta
            </button>
          </div>

          <div className="h-[340px] relative z-0">
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              maxZoom={20}
              minZoom={11}
              className="w-full h-full"
            >
              <ChangeMapView center={mapCenter} zoom={mapZoom} />
              <MapZoomEvents onZoom={(z) => setMapZoom(z)} />
              <ThemeTileLayer maxZoom={20} maxNativeZoom={19} />

              {/* Boundary 6 Kelurahan */}
              {Object.values(KELURAHAN_GEODATA).map((kg) => (
                <Polygon
                  key={`kel-${kg.id}`}
                  positions={kg.bounds}
                  pathOptions={{
                    color: kg.color,
                    fillColor: kg.color,
                    fillOpacity: 0.12,
                    weight: 1.5,
                  }}
                >
                  <Popup>
                    <div className="text-xs font-bold p-1">Kelurahan {kg.name}</div>
                  </Popup>
                </Polygon>
              ))}

              {/* Geofence Kegiatan */}
              {activeSchedule && (
                <>
                  {activeSchedule.polygon && activeSchedule.polygon.length >= 3 ? (
                    <Polygon
                      positions={activeSchedule.polygon}
                      pathOptions={{
                        color: "#10b981",
                        fillColor: "#10b981",
                        fillOpacity: 0.25,
                        weight: 2,
                      }}
                    />
                  ) : (() => {
                    const lat = Number(activeSchedule.latitude);
                    const lng = Number(activeSchedule.longitude);
                    if (!isNaN(lat) && !isNaN(lng) && lat < 0 && lng > 0) {
                      return (
                        <>
                          <Marker position={[lat, lng]} icon={createActivityMarkerIcon()} />
                          <Circle
                            center={[lat, lng]}
                            radius={Number(activeSchedule.radius || 100)}
                            pathOptions={{
                              color: "#3b82f6",
                              fillColor: "#3b82f6",
                              fillOpacity: 0.2,
                              weight: 2,
                            }}
                          />
                        </>
                      );
                    }
                    return null;
                  })()}
                </>
              )}

              {/* Real Facilities GIS Markers */}
              {facilities.map((fac) => {
                const lat = Number(fac.latitude);
                const lng = Number(fac.longitude);
                if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return null;

                const jenisLabel: Record<string, string> = {
                  posko_kkn: "Posko KKN",
                  rumah_maggot: "Rumah Maggot BSF",
                  bank_sampah: "Bank Sampah Anorganik",
                  buruan_sae: "Buruan SAE (Urban Farming)",
                  loseda: "Loseda Kompos",
                  bata_terawang: "Bata Terawang",
                  poc: "POC (Pupuk Organik Cair)",
                  tps: "TPS",
                };

                return (
                  <Marker
                    key={`facility-${fac.id}`}
                    position={[lat, lng]}
                    icon={createFacilityIcon(fac.jenis, fac.nama)}
                  >
                    <Popup>
                      <div className="p-2 font-sans space-y-1 text-xs">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">
                            {fac.nama}
                          </span>
                        </div>
                        <p className="text-[10px] font-black text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-block uppercase">
                          {jenisLabel[fac.jenis] || fac.jenis}
                        </p>
                        {fac.pic && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-400">
                            <span className="font-bold">PIC:</span> {fac.pic}
                          </p>
                        )}
                        {fac.kontak && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-400">
                            <span className="font-bold">Kontak:</span> {fac.kontak}
                          </p>
                        )}
                        {fac.kapasitas && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-400">
                            <span className="font-bold">Kapasitas:</span> {fac.kapasitas} Kg
                          </p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              {/* Active Student GPS Pins */}
              {activeStudentMarkers}
            </MapContainer>
          </div>

          {/* Interactive Map Legend */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
              <CheckCircle2 size={14} className="text-emerald-600" />
              <span>Legenda Fasilitas & Marker Lapangan:</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Posko KKN</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-purple-200 shadow-2xs">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                <span>Rumah Maggot</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                <span>Bank Sampah (Anorganik)</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-lime-300 shadow-2xs">
                <span className="w-2.5 h-2.5 rounded-full bg-lime-600"></span>
                <span>Buruan SAE (Organik)</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-teal-200 shadow-2xs">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
                <span>Loseda / Bata Terawang</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-amber-200 shadow-2xs">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                <span>Live Presensi Mahasiswa</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Konten Utama: Tabel & Kartu Rekapitulasi Presensi */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
        {/* Toolbar: Search, Filter Tabs, View Switcher */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative min-w-[240px] flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Cari nama mahasiswa atau NIM..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-emerald-500 focus:bg-white transition"
            />
            {studentSearch && (
              <button
                type="button"
                onClick={() => setStudentSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Status Chips & Mode Switcher (Disembunyikan untuk role DPL) */}
          {!isDpl && (
            <div className="flex items-center gap-2 flex-wrap justify-between sm:justify-end">
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 text-[11px] font-bold text-slate-600 dark:text-slate-400">
                <button
                  type="button"
                  onClick={() => setAttendanceFilterTab("ALL")}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    attendanceFilterTab === "ALL"
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs font-black"
                      : "hover:text-slate-900"
                  }`}
                >
                  Semua ({attendanceStats.total})
                </button>
                <button
                  type="button"
                  onClick={() => setAttendanceFilterTab("ACTIVE")}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    attendanceFilterTab === "ACTIVE"
                      ? "bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-400 shadow-xs font-black"
                      : "hover:text-slate-900"
                  }`}
                >
                  🟢 Lapangan ({attendanceStats.active})
                </button>
                <button
                  type="button"
                  onClick={() => setAttendanceFilterTab("COMPLETED")}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    attendanceFilterTab === "COMPLETED"
                      ? "bg-white dark:bg-slate-800 text-teal-800 dark:text-teal-400 shadow-xs font-black"
                      : "hover:text-slate-900"
                  }`}
                >
                  ✨ Selesai ({attendanceStats.completed})
                </button>
                <button
                  type="button"
                  onClick={() => setAttendanceFilterTab("IZIN_SAKIT")}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    attendanceFilterTab === "IZIN_SAKIT"
                      ? "bg-white dark:bg-slate-800 text-blue-800 dark:text-blue-400 shadow-xs font-black"
                      : "hover:text-slate-900"
                  }`}
                >
                  📋 Izin / Sakit ({attendanceStats.izinSakit || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setAttendanceFilterTab("NOT_ATTENDED")}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    attendanceFilterTab === "NOT_ATTENDED"
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs font-black"
                      : "hover:text-slate-900"
                  }`}
                >
                  ⚪ Belum ({attendanceStats.notAttended})
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Info Banner when viewing Roster mode (no schedule active) */}
        {!activeSchedule && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-800/60 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <Users size={20} />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">
                  Daftar Roster Mahasiswa KKN {selectedKelompokId ? `(${groups.find((g) => g.id === selectedKelompokId)?.name || "Kelompok Terpilih"})` : "(Seluruh Wilayah Binaan)"}
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                  Belum ada jadwal kegiatan aktif pada filter ini. Menampilkan rekapitulasi data mahasiswa terdaftar, progres aktual / target jam kerja, dan pin live GPS.
                </p>
              </div>
            </div>
            {canManageSchedules && (
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
              >
                <Plus size={14} />
                <span>Buat Kegiatan Baru</span>
              </button>
            )}
          </div>
        )}

        {/* Data List Display */}
        {filteredAttendance.length > 0 ? (
          <>
            {displayMode === "table" ? (
              /* Mode 1: Table Pro */
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-800 text-[11px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4 w-12 text-center text-emerald-700"># No</th>
                      <th className="py-3.5 px-4 min-w-[200px]">Mahasiswa & NIM</th>
                      {!selectedKelompokId && (
                        <th className="py-3.5 px-4 text-center">Kelompok</th>
                      )}
                      <th className="py-3.5 px-4 text-center">Status Presensi</th>
                      <th className="py-3.5 px-4 text-center">Jam Masuk</th>
                      <th className="py-3.5 px-4 text-center">Jam Pulang</th>
                      <th className="py-3.5 px-4 text-center">Durasi</th>
                      <th className="py-3.5 px-4 text-center">
                        Aktual / Target
                      </th>
                      <th className="py-3.5 px-4 text-center">Poin Dampingan</th>
                      <th className="py-3.5 px-4 text-center">Lokasi Kegiatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                    {paginatedAttendance.map((rec, idx) => {
                      const itemNumber = (currentPage - 1) * pageSize + idx + 1;
                      const statusUpper = String(rec.status || "").toUpperCase();
                      const methodUpper = String(rec.method || "").toUpperCase();
                      const currentStatusUpper = String(rec.currentStatus || "").toUpperCase();
                      const isSakitPending = statusUpper === "SAKIT_PENDING" || (statusUpper.includes("SAKIT") && (statusUpper.includes("PENDING") || currentStatusUpper.includes("MENUNGGU")));
                      const isIzinPending = statusUpper === "IZIN_PENDING" || (statusUpper.includes("IZIN") && (statusUpper.includes("PENDING") || currentStatusUpper.includes("MENUNGGU")));
                      const isCancelRequested = statusUpper === "CANCEL_REQUESTED" || currentStatusUpper === "PENGAJUAN_BATAL_IZIN";
                      const isSakit = (statusUpper.includes("SAKIT") || statusUpper === "SAKIT") && !isSakitPending;
                      const isIzin = (statusUpper.includes("IZIN") || statusUpper === "IZIN") && !isIzinPending;
                      const isOverrideDpl = methodUpper === "OVERRIDE_DPL" || statusUpper.includes("OVERRIDE") || currentStatusUpper === "OVERRIDDEN_HADIR";
                      const isTanpaKeterangan = statusUpper.includes("ALPHA") || statusUpper.includes("TANPA_KETERANGAN") || statusUpper.includes("ALPA");
                      const isBelumAdaJadwal = statusUpper === "BELUM_ADA_JADWAL";
                      
                      const isLeaveOrPending = isSakit || isIzin || isSakitPending || isIzinPending || isCancelRequested;
                      const isTerjeda = statusUpper === "TERJEDA";
                      const isBerlangsung = statusUpper === "BERLANGSUNG" || statusUpper === "DALAM_RADIUS" || statusUpper === "DI_ZONA";
                      const isAttended = Boolean(rec.attendedAt) && !isLeaveOrPending && !isTanpaKeterangan && !isBelumAdaJadwal;
                      const recAny = rec as any;
                      const liveElapsedMins = rec.attendedAt ? calculateDurationMinutes(rec.attendedAt, rec.completedAt) : 0;
                      const storedMins = (recAny.actualInZoneMinutes !== null && recAny.actualInZoneMinutes !== undefined) ? Number(recAny.actualInZoneMinutes) : 0;
                      const durationMins = isLeaveOrPending 
                        ? 0 
                        : isBerlangsung
                        ? Math.max(storedMins, liveElapsedMins)
                        : (storedMins > 0 ? storedMins : liveElapsedMins);
                      const isFinished = statusUpper === "HADIR_MEMENUHI" || statusUpper === "HADIR_TIDAK_MEMENUHI" || statusUpper === "SELESAI" || statusUpper === "SELESAI_TELAT" || rec.completedAt !== null;
                      const isHadir = (statusUpper === "HADIR" || isFinished) && isAttended && !isOverrideDpl && !isBerlangsung && !isTerjeda;
                      const isMemenuhiDurasi = rec.isMemenuhiDurasi !== undefined
                        ? rec.isMemenuhiDurasi
                        : (statusUpper === "HADIR_MEMENUHI"
                          ? true
                          : (statusUpper === "HADIR_TIDAK_MEMENUHI" || statusUpper === "SELESAI_TELAT")
                          ? false
                          : (scheduleTargetHours > 0 ? durationMins >= scheduleTargetHours * 60 : true));

                      const formattedHours = isLeaveOrPending
                        ? "-"
                        : (isAttended || isBerlangsung || isTerjeda)
                        ? formatDurationUnits(durationMins)
                        : "-";

                      const targetKumulatif = configTargets.targetTotalJam || 200;
                      const percentCapaian = rec.totalHours !== undefined ? Number((((rec.totalHours || 0) / (targetKumulatif || 1)) * 100).toFixed(2)) : 0;
                      const isExceeded = percentCapaian > 100;

                      const formattedActualTarget = isLeaveOrPending
                        ? `0 Menit / ${formatHoursToUnits(scheduleTargetHours)}`
                        : (rec.totalHours !== undefined
                            ? (
                                <div className="flex flex-col items-center gap-1">
                                  <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-100">
                                    {formatHoursToUnits(rec.totalHours)} / {formatHoursToUnits(targetKumulatif)}
                                  </span>
                                  {isExceeded ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 shadow-2xs">
                                      <span>🌟 Melampaui</span>
                                      <span className="font-extrabold">({percentCapaian}%)</span>
                                    </span>
                                  ) : (
                                    <div className="w-full max-w-[120px] flex flex-col items-center gap-0.5">
                                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                        <div
                                          className="bg-emerald-600 h-full rounded-full transition-all"
                                          style={{ width: `${Math.min(100, percentCapaian)}%` }}
                                        />
                                      </div>
                                      <span className="text-[9px] font-bold text-slate-500">
                                        {percentCapaian}% Tercapai
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )
                            : `${(isAttended || isBerlangsung) ? formatDurationUnits(durationMins) : "0 Menit"} / ${formatHoursToUnits(scheduleTargetHours)}`);

                      const poinDampingan = (isLeaveOrPending || isTanpaKeterangan || isBelumAdaJadwal || isBerlangsung) ? 0 : (isHadir ? 10 : 0);

                      // Pastel avatar backgrounds
                      const avatarColors = [
                        "bg-emerald-100 text-emerald-800 border-emerald-200",
                        "bg-teal-100 text-teal-800 border-teal-200",
                        "bg-blue-100 text-blue-800 border-blue-200",
                        "bg-indigo-100 text-indigo-800 border-indigo-200",
                        "bg-amber-100 text-amber-800 border-amber-200",
                        "bg-purple-100 text-purple-800 border-purple-200",
                      ];
                      const avatarColor = avatarColors[idx % avatarColors.length];

                      return (
                        <tr
                          key={rec.id}
                          className="hover:bg-slate-50/70 dark:bg-slate-800/70 dark:hover:bg-slate-800/70 transition-colors"
                        >
                          <td className="py-3.5 px-4 text-center text-slate-500 font-bold">
                            {itemNumber}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full font-black text-xs flex items-center justify-center shrink-0 border shadow-2xs ${avatarColor}`}>
                                {rec.student.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 lowercase first-letter:capitalize">
                                  {rec.student.name
                                    .replace(/👑|\(Ketua Kelompok\)/g, "")
                                    .trim()}
                                  {rec.student.studentProfile?.isKetua && (
                                    <span className="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 border border-amber-200 capitalize">
                                      Ketua
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono">
                                  NIM: {rec.student.studentProfile?.nim || "-"}
                                </div>
                              </div>
                            </div>
                          </td>
                          {!selectedKelompokId && (
                            <td className="py-3.5 px-4 text-center">
                              <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-black border border-slate-200 dark:border-slate-700 inline-block">
                                {rec.kelompokName || rec.student.studentProfile?.kelompok?.name || "Kelompok KKN"}
                              </span>
                            </td>
                          )}
                          <td className="py-3.5 px-4 text-center">
                            {isBelumAdaJadwal ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                                <Clock size={13} className="text-slate-400" />
                                Belum Ada Jadwal
                              </span>
                            ) : isOverrideDpl ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200" title="Izin dibatalkan dan di-override menjadi Hadir oleh DPL">
                                <CheckCircle2 size={13} className="text-cyan-600" />
                                Hadir (Batal Izin)
                              </span>
                            ) : isCancelRequested ? (
                              <Link
                                to="/ajuan-absensi"
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition cursor-pointer"
                                title="Mahasiswa mengajukan pembatalan izin - Klik untuk review di menu Ajuan"
                              >
                                <Hourglass size={13} className="text-rose-600" />
                                <span>Batal Izin (Menunggu)</span>
                                <ExternalLink size={10} className="text-rose-500" />
                              </Link>
                            ) : isSakitPending ? (
                              <Link
                                to="/ajuan-absensi"
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition cursor-pointer"
                                title="Pengajuan Sakit sedang menunggu persetujuan DPL - Klik untuk buka menu Ajuan"
                              >
                                <Hourglass size={13} className="text-amber-600 animate-pulse" />
                                <span>Sakit (Menunggu)</span>
                                <ExternalLink size={10} className="text-amber-600" />
                              </Link>
                            ) : isIzinPending ? (
                              <Link
                                to="/ajuan-absensi"
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-sky-50 text-sky-800 border border-sky-300 hover:bg-sky-100 transition cursor-pointer"
                                title="Pengajuan Izin sedang menunggu persetujuan DPL - Klik untuk buka menu Ajuan"
                              >
                                <Hourglass size={13} className="text-sky-600 animate-pulse" />
                                <span>Izin (Menunggu)</span>
                                <ExternalLink size={10} className="text-sky-600" />
                              </Link>
                            ) : isSakit ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200" title={rec.leaveRequest?.reason ? `Alasan: ${rec.leaveRequest.reason}` : "Sakit disetujui DPL"}>
                                <Thermometer size={13} className="text-amber-600" />
                                Sakit (Disetujui)
                              </span>
                            ) : isIzin ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200" title={rec.leaveRequest?.reason ? `Alasan: ${rec.leaveRequest.reason}` : "Izin disetujui DPL"}>
                                <Info size={13} className="text-blue-600" />
                                Izin (Disetujui)
                              </span>
                            ) : isTanpaKeterangan ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <XCircle size={13} className="text-rose-600" />
                                Tanpa Keterangan
                              </span>
                            ) : isTerjeda ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-ping" />
                                <span>Terjeda</span>
                              </span>
                            ) : isBerlangsung ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700 animate-pulse">
                                <Clock size={13} className="text-amber-600 animate-spin" />
                                <span>Berlangsung</span>
                              </span>
                            ) : isHadir ? (
                              isMemenuhiDurasi ? (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700" title="Hadir dan durasi di lokasi memenuhi target minimal">
                                  <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                                  Hadir & Memenuhi
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700" title="Hadir tetapi durasi di lokasi kurang dari target minimal">
                                  <Clock size={13} className="text-amber-600 dark:text-amber-400" />
                                  Hadir & Tidak Memenuhi
                                </span>
                              )
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                                <Clock size={13} className="text-slate-400" />
                                Belum Tercatat
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800 dark:text-slate-100">
                            {!isLeaveOrPending && rec.attendedAt
                              ? new Date(rec.attendedAt).toLocaleTimeString(
                                  "id-ID",
                                  { hour: "2-digit", minute: "2-digit" }
                                )
                              : "-"}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800 dark:text-slate-100">
                            {!isLeaveOrPending && rec.completedAt
                              ? new Date(rec.completedAt).toLocaleTimeString(
                                  "id-ID",
                                  { hour: "2-digit", minute: "2-digit" }
                                )
                              : "-"}
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold text-slate-800 dark:text-slate-100">
                            {formattedHours}
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold text-slate-800 dark:text-slate-100">
                            {formattedActualTarget}
                          </td>
                          <td className="py-3.5 px-4 text-center font-black text-emerald-700">
                            {poinDampingan}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleFocusMahasiswaMap(rec)}
                                className="px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-emerald-50 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-300 transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                                title="Lihat posisi GPS pada peta"
                              >
                                <MapPin size={13} className="text-emerald-600" />
                                <span>Lihat Peta</span>
                              </button>
                              {(() => {
                                const liveLoc = studentLocations.find(
                                  (l) => l.studentId === rec.student.id || l.student?.id === rec.student.id
                                );
                                if (!liveLoc) return null;
                                const recTime = new Date(liveLoc.recordedAt).getTime();
                                const isRecent = !isNaN(recTime) && Date.now() - recTime < 5 * 60 * 1000;
                                if (!isRecent) return null;
                                return (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700 animate-pulse">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    <span>Live GPS</span>
                                  </span>
                                );
                              })()}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Mode 2: Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {paginatedAttendance.map((rec) => {
                const isAttended = Boolean(rec.attendedAt);
                const isCompleted = Boolean(rec.completedAt);
                const isInsideZone = rec.currentStatus === "MASIH_DI_LOKASI" || rec.currentStatus === "DI_LOKASI_BELUM_ABSEN";
                const isActivePresence = (isAttended && !isCompleted) || isInsideZone;
                const durationMins = calculateDurationMinutes(
                  rec.attendedAt,
                  rec.completedAt
                );
                const isDurationSufficient =
                  durationMins >= scheduleTargetHours * 60;
                const isBelumAdaJadwal = rec.status === "BELUM_ADA_JADWAL";

                return (
                  <div
                    key={rec.id}
                    className="border border-slate-200 dark:border-slate-800 hover:border-emerald-500 rounded-2xl p-4 bg-white dark:bg-slate-900 hover:shadow-sm transition flex flex-col justify-between"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex justify-between items-start mb-3 gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center shrink-0 border border-emerald-200">
                            {rec.student.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">
                              {rec.student.name
                                .replace(/👑|\(Ketua Kelompok\)/g, "")
                                .trim()}
                            </h4>
                            <p className="text-[10px] text-slate-400 font-mono font-semibold">
                              NIM: {rec.student.studentProfile?.nim || "-"}
                            </p>
                          </div>
                        </div>

                        {isBelumAdaJadwal ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 shrink-0">
                            Belum Ada Jadwal
                          </span>
                        ) : rec.status === "IZIN_PENDING" || rec.currentStatus === "MENUNGGU_PERSETUJUAN_IZIN" ? (
                          <Link
                            to="/ajuan-absensi"
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-300 hover:bg-sky-100 transition shrink-0 flex items-center gap-1"
                          >
                            <span>Izin (Menunggu)</span>
                            <ExternalLink size={9} />
                          </Link>
                        ) : rec.status === "SAKIT_PENDING" ? (
                          <Link
                            to="/ajuan-absensi"
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition shrink-0 flex items-center gap-1"
                          >
                            <span>Sakit (Menunggu)</span>
                            <ExternalLink size={9} />
                          </Link>
                        ) : rec.status === "CANCEL_REQUESTED" || rec.currentStatus === "PENGAJUAN_BATAL_IZIN" ? (
                          <Link
                            to="/ajuan-absensi"
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition shrink-0 flex items-center gap-1"
                          >
                            <span>Batal Izin (Menunggu)</span>
                            <ExternalLink size={9} />
                          </Link>
                        ) : rec.method === "OVERRIDE_DPL" || String(rec.status).toUpperCase().includes("OVERRIDE") ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 shrink-0">
                            Hadir (Batal Izin)
                          </span>
                        ) : String(rec.status).toUpperCase().includes("SAKIT") ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                            Sakit (Disetujui)
                          </span>
                        ) : String(rec.status).toUpperCase().includes("IZIN") ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 shrink-0">
                            Izin (Disetujui)
                          </span>
                        ) : isActivePresence ? (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                            Di Lapangan
                          </span>
                        ) : (isCompleted || String(rec.status).toUpperCase() === "HADIR_MEMENUHI" || String(rec.status).toUpperCase() === "HADIR_TIDAK_MEMENUHI" || String(rec.status).toUpperCase() === "SELESAI") ? (
                          (() => {
                            const stUpper = String(rec.status || "").toUpperCase();
                            const isMem = rec.isMemenuhiDurasi !== undefined
                              ? rec.isMemenuhiDurasi
                              : (stUpper === "HADIR_MEMENUHI"
                                ? true
                                : (stUpper === "HADIR_TIDAK_MEMENUHI" || stUpper === "SELESAI_TELAT")
                                ? false
                                : isDurationSufficient);
                            return isMem ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700 shrink-0">
                                Hadir & Memenuhi
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700 shrink-0">
                                Hadir & Tidak Memenuhi
                              </span>
                            );
                          })()
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 shrink-0">
                            Belum Absen
                          </span>
                        )}
                      </div>

                      {(rec.kelompokName || rec.student.studentProfile?.kelompok?.name) && (
                        <div className="mb-2">
                          <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                            {rec.kelompokName || rec.student.studentProfile?.kelompok?.name}
                          </span>
                        </div>
                      )}

                      {/* Card Stats Grid */}
                      <div className="grid grid-cols-3 gap-2 text-center bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-[11px] mb-3">
                        <div>
                          <span className="text-[9px] text-slate-400 block font-bold uppercase">
                            Masuk
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-100">
                            {rec.attendedAt
                              ? new Date(rec.attendedAt).toLocaleTimeString(
                                  "id-ID",
                                  { hour: "2-digit", minute: "2-digit" }
                                )
                              : "-"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block font-bold uppercase">
                            Aktual / Target
                          </span>
                          <span
                            className={`font-black ${
                              rec.totalHours !== undefined
                                ? "text-emerald-700"
                                : isDurationSufficient
                                ? "text-emerald-700"
                                : "text-amber-700"
                            }`}
                          >
                            {rec.totalHours !== undefined
                              ? formatHoursToUnits(rec.totalHours)
                              : isAttended
                               ? formatDurationUnits(durationMins)
                              : "0 Menit"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block font-bold uppercase">
                            Pulang
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-100">
                            {rec.completedAt
                              ? new Date(rec.completedAt).toLocaleTimeString(
                                  "id-ID",
                                  { hour: "2-digit", minute: "2-digit" }
                                )
                              : isActivePresence
                              ? "Aktif"
                              : "-"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                      {rec.totalHours !== undefined ? (
                        (() => {
                          const targetKumulatif = configTargets.targetTotalJam || 200;
                          const percentCapaian = Number((((rec.totalHours || 0) / (targetKumulatif || 1)) * 100).toFixed(2));
                          const isExceeded = percentCapaian > 100;
                          return isExceeded ? (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                              🌟 Melampaui ({percentCapaian}%)
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                              {percentCapaian}% ({formatHoursToUnits(rec.totalHours)} / {formatHoursToUnits(targetKumulatif)})
                            </span>
                          );
                        })()
                      ) : isAttended ? (
                        isDurationSufficient ? (
                          <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400">
                            ✅ Target Minimal {formatHoursToUnits(scheduleTargetHours)} OK
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-800 dark:text-amber-400">
                            ⚠️ Target Minimal {formatHoursToUnits(scheduleTargetHours)}
                          </span>
                        )
                      ) : (
                        <span className="text-[10px] text-slate-400 font-semibold">
                          Belum Mulai Absen
                        </span>
                      )}

                      <div className="flex items-center gap-2">
                        {(() => {
                          const liveLoc = studentLocations.find(
                            (l) => l.studentId === rec.student.id || l.student?.id === rec.student.id
                          );
                          if (!liveLoc) return null;
                          const recTime = new Date(liveLoc.recordedAt).getTime();
                          const isRecent = !isNaN(recTime) && Date.now() - recTime < 5 * 60 * 1000;
                          if (!isRecent) return null;
                          return (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <span>Live</span>
                            </span>
                          );
                        })()}
                        <button
                          type="button"
                          onClick={() => handleFocusMahasiswaMap(rec)}
                          className="text-emerald-700 hover:text-emerald-800 font-black flex items-center gap-1 text-[11px] cursor-pointer"
                        >
                          <Navigation size={11} />
                          <span>Peta GPS</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Kontrol Navigasi Pagination Pro */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3.5 bg-white dark:bg-slate-900 px-5 py-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs mt-4">
            <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold flex-wrap">
              <span>
                Menampilkan{" "}
                <strong className="text-slate-800 dark:text-slate-100 font-bold">
                  {(currentPage - 1) * pageSize + 1} -{" "}
                  {Math.min(filteredAttendance.length, currentPage * pageSize)}
                </strong>{" "}
                dari{" "}
                <strong className="text-slate-800 dark:text-slate-100 font-bold">
                  {filteredAttendance.length}
                </strong>{" "}
                mahasiswa
              </span>

              <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-400">Baris:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                >
                  <option value={10}>10 / halaman</option>
                  <option value={25}>25 / halaman</option>
                  <option value={50}>50 / halaman</option>
                  <option value={100}>100 / halaman</option>
                </select>
              </div>
            </div>

            {/* Tombol Halaman */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
              >
                Sebelumnya
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    if (totalPages <= 7) return true;
                    if (page === 1 || page === totalPages) return true;
                    return Math.abs(page - currentPage) <= 1;
                  })
                  .reduce<(number | string)[]>((acc, page, idx, arr) => {
                    if (idx > 0 && (page as number) - (arr[idx - 1] as number) > 1) {
                      acc.push("...");
                    }
                    acc.push(page);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    typeof item === "string" ? (
                      <span key={`ellipsis-${idx}`} className="px-2 text-slate-400 font-bold text-xs">
                        ...
                      </span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setCurrentPage(item as number)}
                        className={`w-8 h-8 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center ${
                          currentPage === item
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        {item}
                      </button>
                    )
                  )}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        </>
        ) : (
          <EmptyTableState
            entityName="Presensi Mahasiswa"
            isSearch={!!(studentSearch || attendanceFilterTab !== "ALL")}
            searchQuery={studentSearch}
            onResetSearch={() => {
              setStudentSearch("");
              setAttendanceFilterTab("ALL");
            }}
          />
        )}
      </div>

      {/* Modal Add / Edit Jadwal Kegiatan KKN */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-[740px] max-w-full overflow-hidden flex flex-col transform transition-all duration-200 border border-slate-200 dark:border-slate-800 max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/60">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-50 text-emerald-700 p-2.5 rounded-2xl border border-emerald-200">
                  <CalendarDays size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-slate-100 text-base">
                    {modalMode === "add"
                      ? "Tambah Kegiatan KKN"
                      : "Edit Kegiatan KKN"}
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                    {modalStep === 1
                      ? "Langkah 1/2: Informasi Detail & Waktu Pelaksanaan Kegiatan"
                      : "Langkah 2/2: Penentuan Area Geofence Presensi (Peta)"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex bg-slate-100/80 dark:bg-slate-800/80 px-6 pt-3 pb-2 gap-2 border-b border-slate-200/60">
              <button
                type="button"
                onClick={() => setModalStep(1)}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  modalStep === 1
                    ? "bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-400 shadow-2xs border border-slate-200 dark:border-slate-700"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black flex items-center justify-center">
                  1
                </span>
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
                    ? "bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-400 shadow-2xs border border-slate-200 dark:border-slate-700"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black flex items-center justify-center">
                  2
                </span>
                <span>
                  Area Geofence (
                  {geofenceMode === "CIRCLE"
                    ? "Radius Lingkaran"
                    : "Polygon"}
                  )
                </span>
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter" && modalStep === 1) {
                  e.preventDefault();
                  handleProceedToStep2(e);
                }
              }}
              noValidate
              className="p-6 overflow-y-auto space-y-4 text-xs font-semibold flex-1"
            >
              {Object.keys(formErrors).length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs font-bold flex items-start gap-2 shadow-2xs">
                  <span className="text-base shrink-0">⚠️</span>
                  <div className="flex-1">
                    <p className="font-black text-rose-950 mb-0.5">
                      Mohon lengkapi data yang belum valid:
                    </p>
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
                  <div>
                    <label className="block text-slate-800 dark:text-slate-100 font-black mb-1">
                      Judul Kegiatan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title || ""}
                      onChange={(e) => {
                        setFormData({ ...formData, title: e.target.value });
                        if (formErrors.title)
                          setFormErrors((prev) => ({ ...prev, title: "" }));
                      }}
                      placeholder="Contoh: Sosialisasi Pemilahan Sampah Organik RW 03"
                      className={`w-full h-10 px-3.5 border rounded-xl text-xs font-bold placeholder-slate-400 outline-none transition-all ${
                        formErrors.title
                          ? "border-rose-400 bg-rose-50/40 dark:bg-rose-950/40 text-slate-800 dark:text-slate-100 focus:border-rose-600"
                          : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500"
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-slate-800 dark:text-slate-100 font-black mb-1">
                        Kategori Kegiatan <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={
                          isCustomCategory
                            ? "__CUSTOM__"
                            : formData.category || "Sosialisasi"
                        }
                        onChange={(e) => {
                          if (e.target.value === "__CUSTOM__") {
                            setIsCustomCategory(true);
                          } else {
                            setIsCustomCategory(false);
                            setFormData({
                              ...formData,
                              category: e.target.value,
                            });
                          }
                        }}
                        className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/60 focus:bg-white focus:border-emerald-500 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
                      >
                        {STANDARD_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                        <option value="__CUSTOM__">
                          ➕ Kategori Kustom...
                        </option>
                      </select>

                      {isCustomCategory && (
                        <input
                          type="text"
                          value={customCategoryText}
                          onChange={(e) =>
                            setCustomCategoryText(e.target.value)
                          }
                          placeholder="Nama kategori kustom..."
                          className="mt-2 w-full h-9 px-3 border border-emerald-300 bg-emerald-50/50 rounded-xl text-xs font-bold outline-none"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-slate-800 dark:text-slate-100 font-black mb-1">
                        Target Kelompok KKN
                      </label>
                      {isDpl ? (
                        <div className="w-full h-10 px-3.5 border border-emerald-200 rounded-xl bg-emerald-50/70 flex items-center justify-between text-xs font-black text-emerald-950">
                          <span className="truncate">
                            {formatKelompokDisplayName(
                              groups.find((g) => g.id === formData.kelompokId) ||
                                groups[0]
                            )}
                          </span>
                          <span className="text-[10px] text-emerald-700 font-bold shrink-0 ml-1">
                            Binaan Anda
                          </span>
                        </div>
                      ) : (
                        <select
                          value={formData.kelompokId || ""}
                          onChange={(e) => {
                            const newGroupId = e.target.value;
                            const targetGroup = groups.find(
                              (g) => g.id === newGroupId
                            );
                            const locInfo = getKelompokLocationInfo(targetGroup);
                            const rwTag = locInfo.rws.length > 0 ? ` ${locInfo.rws.join(", ")}` : "";
                            const cat = isCustomCategory ? customCategoryText : formData.category || "Sosialisasi";
                            setFormData((prev) => ({
                              ...prev,
                              kelompokId: newGroupId,
                              location: targetGroup ? locInfo.fullAddress : (prev.location || "Kecamatan Coblong, Kota Bandung"),
                              title: targetGroup ? `${cat} - Kel. ${locInfo.kelurahan}${rwTag}` : `${cat} - Kegiatan Bersama Seluruh Wilayah`,
                            }));
                          }}
                          className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/60 focus:bg-white focus:border-emerald-500 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
                        >
                          <option value="">Semua Kelompok (Kecamatan)</option>
                          {groups.map((g) => (
                            <option key={g.id} value={g.id}>
                              {formatKelompokDisplayName(g)}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                    <div>
                      <label className="block text-slate-800 dark:text-slate-100 font-black mb-1 flex items-center gap-1.5">
                        <Calendar size={13} className="text-emerald-600" /> Tanggal Mulai
                      </label>
                      <input
                        type="date"
                        min={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`}
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          if (!endDate || e.target.value > endDate)
                            setEndDate(e.target.value);
                        }}
                        className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-800 dark:text-slate-100 font-black mb-1 flex items-center gap-1.5">
                        <Calendar size={13} className="text-emerald-600" /> Tanggal Selesai
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        min={startDate || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 outline-none"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-slate-800 dark:text-slate-100 font-black mb-1 flex items-center gap-1.5">
                          <Clock size={13} className="text-emerald-700" /> Waktu Mulai
                        </label>
                        <input
                          type="time"
                          lang="id"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-800 dark:text-slate-100 font-black mb-1 flex items-center gap-1.5">
                          <Clock size={13} className="text-emerald-700" /> Waktu Selesai
                        </label>
                        <input
                          type="time"
                          lang="id"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200 text-xs font-semibold text-emerald-900">
                      <span className="flex items-center gap-1.5 font-bold">
                        <Hourglass size={14} className="text-emerald-700 shrink-0" />
                        <span>Durasi Minimal Presensi:</span>
                      </span>
                      <span className="font-extrabold text-emerald-950 bg-emerald-100/90 px-2.5 py-1 rounded-lg border border-emerald-300 text-[11px]">
                        {formatTargetDuration(configTargets)} (Terpusat Rule Engine)
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-800 dark:text-slate-100 font-black mb-1 flex items-center gap-1.5">
                      <MapPin size={13} className="text-rose-500" /> Lokasi Pelaksanaan Kegiatan
                    </label>
                    <input
                      type="text"
                      value={formData.location || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                      placeholder="Balai Pertemuan RW / Wilayah Tugas"
                      className="w-full h-10 px-3.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 focus:bg-white rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setGeofenceMode("CIRCLE");
                        if (selectedPos.length > 1) {
                          setSelectedPos(selectedPos.slice(0, 1));
                        }
                      }}
                      className={`flex-1 py-2 rounded-lg text-xs font-black transition cursor-pointer ${
                        geofenceMode === "CIRCLE"
                          ? "bg-slate-900 text-white shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      📍 Radius Lingkaran
                    </button>
                    <button
                      type="button"
                      onClick={() => setGeofenceMode("POLYGON")}
                      className={`flex-1 py-2 rounded-lg text-xs font-black transition cursor-pointer ${
                        geofenceMode === "POLYGON"
                          ? "bg-emerald-700 text-white shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      📐 Polygon Kustom
                    </button>
                  </div>

                  <div className="bg-emerald-50/80 border border-emerald-200/90 px-3.5 py-2.5 rounded-xl flex items-center gap-2 text-xs text-emerald-950">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse shrink-0"></span>
                    <span className="font-bold">
                      {geofenceMode === "CIRCLE"
                        ? "Klik pada peta untuk menentukan / menggeser titik pusat geofence presensi."
                        : "Klik pada peta untuk menambahkan titik sudut batas polygon presensi."}
                    </span>
                  </div>

                  {(() => {
                    const modalTargetGroup = groups.find((g) => g.id === formData.kelompokId);
                    const modalLocInfo = getKelompokLocationInfo(modalTargetGroup);
                    const mapModalCenter = selectedPos.length > 0 ? selectedPos[0] : modalLocInfo.centroid;

                    return (
                      <div className="h-[280px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 relative z-0 shadow-inner">
                        <MapContainer
                          key={`modal-geofence-map-${modalMode}-${formData.id || "new"}-${geofenceMode}`}
                          center={mapModalCenter}
                          zoom={15}
                          maxZoom={20}
                          minZoom={11}
                          style={{ height: "100%", width: "100%" }}
                        >
                          <ThemeTileLayer maxZoom={20} maxNativeZoom={19} />
                          <DualGeofencePickerModalMap
                            mode={geofenceMode}
                            points={selectedPos || []}
                            onChange={(pts) => setSelectedPos(pts)}
                            radius={Number(formData.radius) || 100}
                          />
                        </MapContainer>
                      </div>
                    );
                  })()}

                  {geofenceMode === "CIRCLE" && (
                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-4">
                      <label className="text-xs font-black text-slate-800 dark:text-slate-100">
                        Ukuran Radius Presensi:
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={30}
                          max={5000}
                          value={formData.radius || 100}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              radius: Number(e.target.value),
                            })
                          }
                          className="w-24 h-8 text-center font-mono font-black bg-white dark:bg-slate-900 border border-emerald-300 rounded-lg text-emerald-950 text-xs outline-none"
                        />
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                          Meter
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    if (modalStep === 2) setModalStep(1);
                    else setIsModalOpen(false);
                  }}
                  className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold cursor-pointer transition text-xs flex items-center gap-1.5"
                >
                  {modalStep === 2 ? "← Kembali ke Detail" : "Batal"}
                </button>

                <div className="flex items-center gap-2">
                  {modalStep === 1 ? (
                    <button
                      type="button"
                      onClick={handleProceedToStep2}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer shadow-sm transition text-xs flex items-center gap-1.5"
                    >
                      <span>Lanjut ke Area Peta</span>
                      <span>→</span>
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmittingSchedule}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black cursor-pointer shadow-sm transition text-xs flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isSubmittingSchedule ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Menyimpan...</span>
                        </>
                      ) : (
                        <span>{modalMode === "edit" ? "Simpan Perubahan Kegiatan" : "Simpan Kegiatan Baru"}</span>
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
        message="Apakah Anda yakin ingin menghapus kegiatan KKN ini? Seluruh riwayat presensi yang terkait akan dihapus."
        confirmText="Ya, Hapus Kegiatan"
        type="danger"
      />

      {/* Modal Ekspor Presensi dengan Filter Periode */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2.5">
                <Download size={18} className="text-emerald-400" />
                <h3 className="font-black text-white text-base">
                  Ekspor Rekap Presensi KKN
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 font-semibold">
                Kegiatan:{" "}
                <strong className="text-emerald-950">
                  {activeSchedule?.title || "Semua Kegiatan"}
                </strong>{" "}
                • {attendance.length} Data Mahasiswa
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                  <Calendar size={14} className="text-slate-500" /> Filter Periode Laporan:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "SEMUA", label: "Semua Data" },
                    { id: "BULAN_INI", label: "Bulan Berjalan" },
                    { id: "30_HARI", label: "30 Hari Terakhir" },
                    { id: "CUSTOM", label: "Tanggal Kustom" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setExportPeriod(p.id as any)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition border text-left flex items-center justify-between cursor-pointer ${
                        exportPeriod === p.id
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                      }`}
                    >
                      <span>{p.label}</span>
                      {exportPeriod === p.id && (
                        <CheckCircle2 size={14} className="text-white" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {exportPeriod === "CUSTOM" && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 animate-in fade-in duration-200">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Tanggal Mulai:
                    </label>
                    <input
                      type="date"
                      value={exportStartDate}
                      onChange={(e) => setExportStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Tanggal Selesai:
                    </label>
                    <input
                      type="date"
                      value={exportEndDate}
                      onChange={(e) => setExportEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download size={14} />
                  Download CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pengaturan Ketentuan Waktu & Target Kegiatan KKN (Khusus Super User & Developer) */}
      {isConfigModalOpen && isSuperUserOrDev && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-xl shadow-2xl border border-slate-100 dark:border-slate-800 space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                  <Settings size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                    Atur Ketentuan Operasional & Target Minimal KKN
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Konfigurasi otomatis tersimpan ke basis data terpusat dan menjadi acuan presensi.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              {/* Bagian 1: Hari Kerja Operasional (Pilihan Preset & Checkbox 7 Hari) */}
              <div className="space-y-2 p-3.5 bg-slate-50/80 dark:bg-slate-800/80 dark:bg-slate-800/40 rounded-2xl border border-slate-200/70 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <Calendar size={14} className="text-emerald-600" />
                    Hari Kerja Operasional
                  </label>
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                    {formDays.length} Hari / Pekan
                  </span>
                </div>

                {/* Preset Cepat */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <button
                    type="button"
                    onClick={() => handleDaysPreset("SENIN_JUMAT")}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition border cursor-pointer ${
                      formDays.length === 5 && ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"].every((d) => formDays.includes(d))
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-emerald-300"
                    }`}
                  >
                    Senin – Jumat (5 Hari)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDaysPreset("SENIN_SABTU")}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition border cursor-pointer ${
                      formDays.length === 6 && ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"].every((d) => formDays.includes(d))
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-emerald-300"
                    }`}
                  >
                    Senin – Sabtu (6 Hari)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDaysPreset("SETIAP_HARI")}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition border cursor-pointer ${
                      formDays.length === 7
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-emerald-300"
                    }`}
                  >
                    Setiap Hari (7 Hari)
                  </button>
                </div>

                {/* 7-Days Checkbox Pills */}
                <div className="grid grid-cols-7 gap-1.5 pt-1">
                  {ALL_DAYS_LIST.map((day) => {
                    const isSelected = formDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleToggleDay(day)}
                        className={`py-1.5 px-1 rounded-xl text-xs font-black transition border text-center cursor-pointer ${
                          isSelected
                            ? "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700"
                            : "bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800 hover:bg-slate-100"
                        }`}
                        title={day}
                      >
                        {day.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold pt-0.5">
                  Label Tersimpan: <strong className="text-slate-800 dark:text-slate-200">{formatDaysToString(formDays)}</strong>
                </p>
              </div>

              {/* Bagian 2: Jam Kerja Operasional & Target Minimal Durasi Harian */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Jam Operasional */}
                <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800/80 dark:bg-slate-800/40 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-2">
                  <label className="block text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <Clock size={14} className="text-emerald-600" />
                    Jam Kerja Operasional
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 mb-0.5">Jam Mulai</span>
                      <input
                        type="time"
                        required
                        value={formStartTime}
                        onChange={(e) => setFormStartTime(e.target.value)}
                        className="w-full px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 mb-0.5">Jam Selesai</span>
                      <input
                        type="time"
                        required
                        value={formEndTime}
                        onChange={(e) => setFormEndTime(e.target.value)}
                        className="w-full px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                  <span className="block text-[10px] text-slate-500 font-medium">
                    Format: {formStartTime} – {formEndTime} WIB
                  </span>
                </div>

                {/* Minimal Durasi / Hari */}
                <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800/80 dark:bg-slate-800/40 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <Hourglass size={14} className="text-emerald-600" />
                      Target Minimal Durasi / Hari
                    </label>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-100/80 dark:bg-emerald-900/50 px-2 py-0.5 rounded-md">
                      Otomatis
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 mb-0.5">Jam</span>
                      <input
                        type="number"
                        min={0}
                        max={24}
                        required
                        value={formDurasiJam}
                        onChange={(e) => handleDurasiChange(Math.max(0, Number(e.target.value) || 0), formDurasiMenit)}
                        className="w-full px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 mb-0.5">Menit</span>
                      <input
                        type="number"
                        min={0}
                        max={59}
                        step={5}
                        required
                        value={formDurasiMenit}
                        onChange={(e) => handleDurasiChange(formDurasiJam, Math.max(0, Math.min(59, Number(e.target.value) || 0)))}
                        className="w-full px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                  <span className="block text-[10px] text-slate-500 font-medium">
                    Total Durasi: <strong>{formDurasiJam} Jam {formDurasiMenit > 0 ? `${formDurasiMenit} Menit` : ''}</strong> / Hari ({formTotalJam} Jam ÷ {formTotalHari} Hari)
                  </span>
                </div>
              </div>

              {/* Bagian 3: Periode & Target Minimal Jam Kumulatif */}
              <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800/80 dark:bg-slate-800/40 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-slate-800 dark:text-slate-100 mb-1">
                      Periode Kegiatan (Pekan)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={52}
                      required
                      value={formTargetPekan}
                      onChange={(e) => handlePekanChange(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                    <span className="block text-[10px] text-slate-400 font-medium mt-1">
                      {formDays.length} hari kerja per pekan
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-800 dark:text-slate-100 mb-1">
                      Total Hari Kegiatan
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={formTotalHari}
                      onChange={(e) => handleTotalHariChange(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                    <span className="block text-[10px] text-slate-400 font-medium mt-1">
                      = {formTargetPekan} pekan × {formDays.length} hari
                    </span>
                  </div>
                </div>

                {/* Live Formula & Calculation Breakdown Preview (Akumulasi Otomatis) */}
                {(() => {
                  const dailyMins = formDurasiJam * 60 + formDurasiMenit;
                  const totalMins = formTotalHari * dailyMins;
                  const kumulatifJam = Math.floor(totalMins / 60);
                  const kumulatifMenit = totalMins % 60;
                  const dailyFormatted = formDurasiJam > 0
                    ? `${formDurasiJam} Jam${formDurasiMenit > 0 ? ` ${formDurasiMenit} Menit` : ''}`
                    : `${formDurasiMenit} Menit`;
                  const kumulatifFormatted = kumulatifJam > 0
                    ? `${kumulatifJam} Jam${kumulatifMenit > 0 ? ` ${kumulatifMenit} Menit` : ''}`
                    : `${kumulatifMenit} Menit`;

                  return (
                    <div className="p-3.5 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/80 space-y-2 text-xs">
                      <div className="flex items-center justify-between font-black text-emerald-950 dark:text-emerald-200">
                        <span className="flex items-center gap-1.5">
                          <Target size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                          Akumulasi Minimal Target Kumulatif
                        </span>
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-extrabold bg-emerald-100/90 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md">
                          Otomatis
                        </span>
                      </div>
                      <div className="text-[11px] text-emerald-800/90 dark:text-emerald-300/90 font-semibold space-y-1 pt-0.5">
                        <div className="flex items-center justify-between">
                          <span>Target Durasi Harian:</span>
                          <span className="font-bold">{dailyFormatted} ({dailyMins} Menit / {(dailyMins / 60).toFixed(2)} Jam)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Total Hari Operasional:</span>
                          <span className="font-bold">{formTargetPekan} Pekan × {formDays.length} Hari = {formTotalHari} Hari</span>
                        </div>
                        <div className="flex items-center justify-between pt-1.5 border-t border-emerald-200/60 dark:border-emerald-800/60">
                          <span className="font-bold">Total Target Kumulatif:</span>
                          <span className="font-black text-emerald-950 dark:text-emerald-100 text-sm">
                            {kumulatifFormatted} ({totalMins.toLocaleString('id-ID')} Menit / {formTotalJam} Jam)
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingConfig}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSavingConfig && <Loader2 size={14} className="animate-spin" />}
                  Simpan Ketentuan & Target
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
