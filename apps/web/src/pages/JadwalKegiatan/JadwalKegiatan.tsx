import {
  Loader2,
  CalendarCheck,
  CalendarDays,
  Clock,
  ChevronLeft,
  ChevronRight,
  Plus,
  MapPin,
  X,
  Trash2,
  Pencil,
  ChevronDown,
  ChevronUp,
  Layers,
  List,
  Table as TableIcon,
  Download,
  Search,
  CheckCircle2,
  FileSpreadsheet,
  Calendar,
} from "lucide-react";
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
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, Polygon, Polyline, Circle } from "react-leaflet";
import L from "leaflet";
import { ConfirmModal } from "../../components/common/ConfirmModal";
import {
  TIMELINE_KKN_DATA,
  TIMELINE_KKN_HEADER,
  type TimelineKknItem,
} from "../../data/timelineKknData";

// Fix default Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const DualGeofencePickerMap: React.FC<{
  mode: "CIRCLE" | "POLYGON";
  points: [number, number][];
  onChange: (points: [number, number][]) => void;
  radius: number;
}> = ({ mode, points, onChange, radius }) => {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const t = setTimeout(() => map.invalidateSize(), 150);
    return () => clearTimeout(t);
  }, [map, mode]);

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
            pathOptions={{ color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.25, weight: 2 }}
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

const JadwalKegiatan: React.FC = () => {
  const { user } = useAuthStore();
  const userRole = String(user?.peran || (user as any)?.role || "").toUpperCase();
  const canManageSchedules = [
    "SUPER_USER",
    "ADMIN_DLH",
    "PEMIMPIN",
    "PANITIA_TASKFORCE",
    "DPL",
    "DOSEN_PEMBIMBING",
    "DEVELOPER",
  ].includes(userRole);
  const isDpl = ["DPL", "DOSEN_PEMBIMBING"].includes(userRole);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isGroupedView, setIsGroupedView] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Main Tab: Tabel Timeline (Excel View) vs Kalender & Agenda Interaktif
  const [activeMainTab, setActiveMainTab] = useState<"TABEL_TIMELINE" | "KALENDER_AGENDA">("TABEL_TIMELINE");
  const [timelineSearch, setTimelineSearch] = useState("");
  const [selectedFase, setSelectedFase] = useState<string>("ALL");
  const [timelineList] = useState<TimelineKknItem[]>(TIMELINE_KKN_DATA);

  const filteredTimeline = useMemo(() => {
    return timelineList.filter((item) => {
      const q = timelineSearch.toLowerCase();
      const matchesSearch =
        item.tahapMinggu.toLowerCase().includes(q) ||
        item.kegiatanUtama.toLowerCase().includes(q) ||
        item.outputTarget.toLowerCase().includes(q) ||
        item.picKeterangan.toLowerCase().includes(q) ||
        item.fase.toLowerCase().includes(q);

      const matchesFase =
        selectedFase === "ALL" ||
        item.fase.toLowerCase().includes(selectedFase.toLowerCase());

      return matchesSearch && matchesFase;
    });
  }, [timelineList, timelineSearch, selectedFase]);

  const handleExportTimelineCsv = () => {
    const headers = ["Tahap / Minggu", "Tanggal", "Fase", "Kegiatan Utama", "Output / Target", "PIC / Keterangan", "Status"];
    const rows = filteredTimeline.map((item) => [
      `"${item.tahapMinggu.replace(/"/g, '""')}"`,
      `"${item.tanggal.replace(/"/g, '""')}"`,
      `"${item.fase.replace(/"/g, '""')}"`,
      `"${item.kegiatanUtama.replace(/"/g, '""')}"`,
      `"${item.outputTarget.replace(/"/g, '""')}"`,
      `"${item.picKeterangan.replace(/"/g, '""')}"`,
      `"${item.statusPelaksanaan || "BELUM_DIMULAI"}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Timeline_KKN_Coblong_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Tabel Timeline KKN berhasil diunduh (CSV)");
  };

  const [geofenceMode, setGeofenceMode] = useState<"CIRCLE" | "POLYGON">("CIRCLE");
  const [manualLat, setManualLat] = useState<string>("");
  const [manualLng, setManualLng] = useState<string>("");

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const toggleGroupExpand = (groupKey: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const [formData, setFormData] = useState<any>({
    title: "",
    date: "",
    time: "",
    category: "Pengangkutan",
    location: "",
    latitude: "",
    longitude: "",
    radius: 100,
    polygon: [] as [number, number][],
  });

  const fetchSchedules = async () => {
    try {
      const response = await api.get("/schedules");
      // Backend returns array under data.data
      const raw = response.data.data;
      setSchedules(Array.isArray(raw) ? raw : []);
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.response?.data?.error || err.message || "Gagal memuat data dari server.";
      setError(errMsg);
      toast.error(`Gagal memuat jadwal kegiatan: ${errMsg}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);


  const safeFormatTime = (dateStr: string | null | undefined) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  };

  const handleSubmit = async () => {
    // Validasi: title dan date wajib diisi
    if (!formData.title.trim()) {
      toast.error("Nama kegiatan wajib diisi");
      return;
    }
    if (!formData.date) {
      toast.error("Tanggal wajib diisi");
      return;
    }
    // Validasi format tanggal
    const testDate = new Date(formData.date);
    if (isNaN(testDate.getTime())) {
      toast.error("Format tanggal tidak valid");
      return;
    }
    if (formData.latitude && formData.longitude) {
      const lat = parseFloat(String(formData.latitude));
      const lng = parseFloat(String(formData.longitude));
      
      // Bounding box Coblong: lat [-6.9100, -6.8600], lng [107.6000, 107.6500]
      // Bounding box Makerindo (Pesona Ciganitri): lat [-6.9900, -6.9500], lng [107.6400, 107.6800]
      const isInCoblong = (lat >= -6.9100 && lat <= -6.8600 && lng >= 107.6000 && lng <= 107.6500);
      const isInMakerindo = (lat >= -6.9900 && lat <= -6.9500 && lng >= 107.6400 && lng <= 107.6800);
      if (!isInCoblong && !isInMakerindo) {
        toast.error("Lokasi harus berada di dalam wilayah Kecamatan Coblong atau dekat kantor Makerindo (Pesona Ciganitri)!");
        return;
      }
    }

    let formattedIsoDate: string;
    try {
      const timePart = formData.time && formData.time.includes(":") ? formData.time : "00:00";
      const dateObj = new Date(`${formData.date}T${timePart}:00`);
      if (isNaN(dateObj.getTime())) {
        const fallbackDate = new Date(formData.date);
        if (isNaN(fallbackDate.getTime())) {
          toast.error("Format tanggal tidak valid");
          return;
        }
        formattedIsoDate = fallbackDate.toISOString();
      } else {
        formattedIsoDate = dateObj.toISOString();
      }
    } catch {
      toast.error("Format tanggal tidak valid");
      return;
    }

    try {
      const isCircle = geofenceMode === "CIRCLE";
      let calcLat = isCircle && formData.polygon.length >= 1 ? Number(formData.polygon[0][0]) : (formData.latitude ? Number(formData.latitude) : null);
      let calcLng = isCircle && formData.polygon.length >= 1 ? Number(formData.polygon[0][1]) : (formData.longitude ? Number(formData.longitude) : null);

      if (!isCircle && formData.polygon.length >= 3) {
        const sumLat = formData.polygon.reduce((acc: number, p: any) => acc + Number(p[0]), 0);
        const sumLng = formData.polygon.reduce((acc: number, p: any) => acc + Number(p[1]), 0);
        calcLat = Number((sumLat / formData.polygon.length).toFixed(7));
        calcLng = Number((sumLng / formData.polygon.length).toFixed(7));
      }

      const payload = {
        ...formData,
        date: formattedIsoDate,
        latitude: calcLat,
        longitude: calcLng,
        radius: formData.radius !== "" ? parseInt(String(formData.radius), 10) : 100,
        polygon: !isCircle && formData.polygon.length >= 3 ? formData.polygon : null,
      };

      if (editId) {
        await api.put(`/schedules/${editId}`, payload);
        toast.success("Jadwal berhasil diperbarui!");
      } else {
        await api.post("/schedules", payload);
        toast.success("Jadwal berhasil ditambahkan!");
      }
      
      setIsModalOpen(false);
      setEditId(null);
      fetchSchedules();
      setFormData({ title: "", date: "", time: "", category: "Pengangkutan", location: "", latitude: "", longitude: "", radius: 100, polygon: [] });
      setGeofenceMode("CIRCLE");
      setManualLat("");
      setManualLng("");
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.response?.data?.error || err.message || "Gagal menyimpan jadwal";
      toast.error(errMsg);
    }
  };

  const handleEdit = (schedule: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditId(schedule.id);
    
    // Format tanggal ke YYYY-MM-DD untuk input date
    let formattedDate = "";
    if (schedule.date) {
      const d = new Date(schedule.date);
      if (!isNaN(d.getTime())) {
        formattedDate = d.toISOString().split("T")[0];
      }
    }

    const isPoly = Boolean(schedule.polygon && Array.isArray(schedule.polygon) && schedule.polygon.length >= 3);
    setGeofenceMode(isPoly ? "POLYGON" : "CIRCLE");

    setFormData({
      title: schedule.title || "",
      date: formattedDate,
      time: schedule.time || "",
      category: schedule.category || "Pengangkutan",
      location: schedule.location || "",
      latitude: schedule.latitude || "",
      longitude: schedule.longitude || "",
      radius: schedule.radius || 100,
      polygon: schedule.polygon || (schedule.latitude && schedule.longitude ? [[Number(schedule.latitude), Number(schedule.longitude)]] : []),
    });
    setModalStep(1);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await api.delete(`/schedules/${deleteConfirmId}`);
      toast.success("Jadwal berhasil dihapus");
      fetchSchedules();
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.response?.data?.error || err.message || "Gagal menghapus jadwal";
      toast.error(errMsg);
    } finally {
      setDeleteConfirmId(null);
    }
  };

  // Calendar logic
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  // Adjust so Monday is 0, Sunday is 6
  const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const prevMonthDays = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();

  const days = [];

  // Previous month trailing days
  for (let i = 0; i < startDay; i++) {
    days.push({
      day: prevMonthDays - startDay + i + 1,
      isCurrentMonth: false,
      date: new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - 1,
        prevMonthDays - startDay + i + 1
      ),
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      day: i,
      isCurrentMonth: true,
      date: new Date(currentDate.getFullYear(), currentDate.getMonth(), i),
    });
  }

  // Next month leading days (to fill 42 slots, 6 rows)
  const remainingSlots = 42 - days.length;
  for (let i = 1; i <= remainingSlots; i++) {
    days.push({
      day: i,
      isCurrentMonth: false,
      date: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i),
    });
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  // Match schedules to a calendar day using the `date` field (ISO 8601 from backend)
  const getSchedulesForDay = (date: Date) => {
    const target = date.toISOString().split("T")[0];
    return schedules.filter((s) => {
      if (!s.date) return false;
      const sDate = new Date(s.date);
      if (isNaN(sDate.getTime())) return false;
      return sDate.toISOString().split("T")[0] === target;
    });
  };

  const renderFaseBadge = (fase: string) => {
    if (fase.includes("Pra-Kegiatan")) {
      return (
        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[10.5px] font-extrabold whitespace-nowrap">
          Pra-Kegiatan
        </span>
      );
    }
    if (fase.includes("Fase 1")) {
      return (
        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-[10.5px] font-extrabold whitespace-nowrap">
          Fase 1: Persiapan
        </span>
      );
    }
    if (fase.includes("Fase 2")) {
      return (
        <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[10.5px] font-extrabold whitespace-nowrap">
          Fase 2: Pilot
        </span>
      );
    }
    if (fase.includes("Fase 3")) {
      return (
        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[10.5px] font-extrabold whitespace-nowrap">
          Fase 3: Implementasi
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-[10.5px] font-extrabold whitespace-nowrap">
        Fase 4: Evaluasi
      </span>
    );
  };

  const renderStatusBadge = (status?: string) => {
    if (status === "SELESAI") {
      return (
        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10.5px] font-extrabold flex items-center gap-1 w-fit">
          <CheckCircle2 size={12} /> Selesai
        </span>
      );
    }
    if (status === "SEDANG_BERJALAN") {
      return (
        <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10.5px] font-extrabold flex items-center gap-1 w-fit">
          <Clock size={12} /> Berjalan
        </span>
      );
    }
    return (
      <span className="px-3 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-[10.5px] font-bold w-fit">
        Belum
      </span>
    );
  };

  return (
    <div className="space-y-6 text-slate-800">
      {/* Top Header & View Switcher Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Time Line & Jadwal Kegiatan KKN</h1>
          <p className="text-slate-500 text-xs mt-1">
            Rencana kerja terstruktur, tahapan timeline, dan monitoring jadwal lapangan Kecamatan Coblong.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200 flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveMainTab("TABEL_TIMELINE")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
              activeMainTab === "TABEL_TIMELINE"
                ? "bg-white text-emerald-800 shadow-xs border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <TableIcon size={14} className={activeMainTab === "TABEL_TIMELINE" ? "text-emerald-600" : "text-slate-400"} />
            <span>Tabel Rencana Kerja</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMainTab("KALENDER_AGENDA")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
              activeMainTab === "KALENDER_AGENDA"
                ? "bg-white text-emerald-800 shadow-xs border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <CalendarDays size={14} className={activeMainTab === "KALENDER_AGENDA" ? "text-emerald-600" : "text-slate-400"} />
            <span>Kalender & Agenda</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: TABEL TIMELINE (SESUAI SHEET 1 EXCEL DPL) */}
      {activeMainTab === "TABEL_TIMELINE" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Hero Banner: Info Timeline Resmi */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0 shadow-2xs">
                  <FileSpreadsheet size={24} className="text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    {TIMELINE_KKN_HEADER.judul}
                  </h2>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    Tema: <strong className="text-emerald-800">"{TIMELINE_KKN_HEADER.tema}"</strong> • Pra-Kegiatan: {TIMELINE_KKN_HEADER.praKegiatan} • Penerjunan: {TIMELINE_KKN_HEADER.penerjunan}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleExportTimelineCsv}
                  className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer shadow-2xs"
                >
                  <Download size={14} className="text-emerald-600" />
                  <span>Unduh CSV</span>
                </button>
              </div>
            </div>

            {/* 4 Summary Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70">
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">Total Kegiatan</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">{TIMELINE_KKN_DATA.length} Tahapan</span>
                <span className="text-[10.5px] text-slate-400 font-medium">Pra-kegiatan hingga penutupan</span>
              </div>
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70">
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">Fase Program</span>
                <span className="text-2xl font-black text-emerald-700 mt-1 block">4 Fase</span>
                <span className="text-[10.5px] text-emerald-600 font-semibold">Persiapan, Pilot, Implementasi, Evaluasi</span>
              </div>
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70">
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">Durasi Penerjunan</span>
                <span className="text-2xl font-black text-indigo-700 mt-1 block">12 Pekan</span>
                <span className="text-[10.5px] text-indigo-600 font-semibold">12 Agustus – 31 Oktober 2026</span>
              </div>
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70">
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">Wilayah Sasaran</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">6 Kelurahan</span>
                <span className="text-[10.5px] text-slate-400 font-medium">Kecamatan Coblong, Bandung</span>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full md:w-auto flex-1">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Cari kegiatan utama, target capaian, atau PIC..."
                  value={timelineSearch}
                  onChange={(e) => setTimelineSearch(e.target.value)}
                  className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500 focus:bg-white transition font-medium"
                />
                <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              <div className="min-w-[200px]">
                <select
                  value={selectedFase}
                  onChange={(e) => setSelectedFase(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-emerald-500 focus:bg-white transition cursor-pointer"
                >
                  <option value="ALL">Semua Fase Program</option>
                  <option value="Pra-Kegiatan">Pra-Kegiatan</option>
                  <option value="Fase 1">Fase 1 - Persiapan & Observasi</option>
                  <option value="Fase 2">Fase 2 - Pilot Project</option>
                  <option value="Fase 3">Fase 3 - Implementasi & Pendampingan</option>
                  <option value="Fase 4">Fase 4 - Evaluasi & Penutupan</option>
                </select>
              </div>
            </div>

            <div className="text-xs font-bold text-slate-500">
              Menampilkan <strong className="text-slate-900">{filteredTimeline.length}</strong> kegiatan
            </div>
          </div>

          {/* Tabular Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 text-slate-500 border-b border-slate-200 text-[11px] uppercase tracking-wider font-bold">
                    <th className="py-3.5 px-4 w-12 text-center">No</th>
                    <th className="py-3.5 px-4 w-32">Tahap / Minggu</th>
                    <th className="py-3.5 px-4 w-36">Tanggal</th>
                    <th className="py-3.5 px-4 w-40">Fase</th>
                    <th className="py-3.5 px-4 min-w-[280px]">Kegiatan Utama</th>
                    <th className="py-3.5 px-4 min-w-[260px]">Output / Target</th>
                    <th className="py-3.5 px-4 w-52">PIC / Keterangan</th>
                    <th className="py-3.5 px-4 w-28 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredTimeline.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-slate-900 block">
                          {item.tahapMinggu}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5">
                          <Calendar size={13} className="text-emerald-600 shrink-0" />
                          {item.tanggal}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {renderFaseBadge(item.fase)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 leading-relaxed">
                        {item.kegiatanUtama}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 leading-relaxed">
                        {item.outputTarget}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-semibold text-[11px] leading-relaxed">
                        {item.picKeterangan}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {renderStatusBadge(item.statusPelaksanaan)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: KALENDER & AGENDA INTERAKTIF */}
      {activeMainTab === "KALENDER_AGENDA" && (
        <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-140px)] overflow-hidden bg-surface-container rounded-3xl border border-slate-200">
          {/* Canvas */}
          <main className="flex-1 overflow-hidden flex flex-col lg:flex-row bg-surface p-4 lg:p-6 gap-4 lg:gap-6 relative">
            {/* Calendar Section */}
            <div className="flex-1 min-h-[400px] lg:min-h-0 flex flex-col bg-white rounded-xl shadow-sm border border-outline-variant/50 overflow-hidden">
              {/* Calendar Header */}
              <div className="p-5 border-b border-outline-variant/30 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                  <h2 className="text-[20px] font-bold text-on-surface">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h2>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={prevMonth}
                      className="p-1 rounded hover:bg-surface-container-low text-on-surface-variant transition-colors cursor-pointer"
                    >
                      <ChevronLeft />
                    </button>
                    <button
                      onClick={goToToday}
                      className="text-[12px] font-bold px-3 py-1 rounded hover:bg-surface-container-low text-on-surface-variant transition-colors cursor-pointer"
                    >
                      Hari Ini
                    </button>
                    <button
                      onClick={nextMonth}
                      className="p-1 rounded hover:bg-surface-container-low text-on-surface-variant transition-colors cursor-pointer"
                    >
                      <ChevronRight />
                    </button>
                  </div>
                </div>
                {["SUPER_USER", "RW", "RT", "PETUGAS_RESIDU"].includes(user?.peran || "") && (
                  <button
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors active:scale-95 transform shadow-sm cursor-pointer"
                    onClick={() => setIsModalOpen(true)}
                  >
                    <Plus size={14} />
                    Buat Jadwal Baru
                  </button>
                )}
              </div>

          {/* Calendar Grid */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Days Header */}
            <div className="grid grid-cols-7 border-b border-outline-variant/30 shrink-0 bg-surface-container-lowest">
              {["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"].map((d, i) => (
                <div
                  key={d}
                  className={`py-2 text-center text-[11px] font-bold ${i >= 5 ? "text-red-500" : "text-on-surface-variant"} uppercase tracking-wider`}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="flex-1 grid grid-cols-7 grid-rows-6 bg-outline-variant/30 gap-[1px]">
              {days.map((day, i) => {
                const daySchedules = getSchedulesForDay(day.date);
                const isToday = new Date().toDateString() === day.date.toDateString();
                const isSelected = selectedDate.toDateString() === day.date.toDateString();

                // Deduplicate schedules for cell pills display
                const groupedCellSchedules = daySchedules.reduce((acc: any[], curr: any) => {
                  const titleKey = (curr.title || "(tanpa judul)").trim();
                  const catKey = (curr.category || "Lainnya").trim();
                  const existing = acc.find(
                    (item) => (item.title || "").trim() === titleKey && (item.category || "").trim() === catKey
                  );
                  if (existing) {
                    existing.count += 1;
                  } else {
                    acc.push({ ...curr, title: titleKey, category: catKey, count: 1 });
                  }
                  return acc;
                }, []);

                const maxPills = 2;
                const visibleSchedules = groupedCellSchedules.slice(0, maxPills);
                const hiddenCount = groupedCellSchedules.reduce((sum, item, idx) => idx >= maxPills ? sum + item.count : sum, 0);

                return (
                  <div
                    key={i}
                    onClick={() => setSelectedDate(day.date)}
                    className={`bg-white p-2 hover:bg-emerald-50/30 transition-all cursor-pointer group flex flex-col justify-between min-h-[90px] border border-transparent rounded-lg ${
                      !day.isCurrentMonth ? "opacity-40" : ""
                    } ${
                      isSelected
                        ? "ring-2 ring-emerald-500 bg-emerald-50/60 font-bold shadow-sm z-10"
                        : isToday
                        ? "bg-blue-50/40 border-blue-400 font-bold relative"
                        : ""
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        {isToday ? (
                          <span className="text-[10px] font-extrabold bg-blue-600 text-white px-1.5 py-0.2 rounded-full">
                            Hari Ini
                          </span>
                        ) : (
                          <span></span>
                        )}
                        <span
                          className={`text-right text-[12px] font-bold ${
                            isToday
                              ? "text-blue-700 font-black"
                              : i % 7 >= 5
                              ? "text-red-500"
                              : "text-slate-800"
                          }`}
                        >
                          {day.day}
                        </span>
                      </div>

                      {/* Clean Aggregated Activity Pills */}
                      <div className="flex flex-col gap-1">
                        {visibleSchedules.map((s, idx) => {
                          let colorCls = "bg-blue-50 border-blue-200 text-blue-800";
                          const titleLower = s.title.toLowerCase();
                          const catLower = s.category.toLowerCase();
                          if (catLower.includes("pengangkutan") || titleLower.includes("pengangkutan"))
                            colorCls = "bg-emerald-50 border-emerald-200 text-emerald-800";
                          else if (catLower.includes("sosialisasi") || titleLower.includes("sosialisasi"))
                            colorCls = "bg-amber-50 border-amber-200 text-amber-800";
                          else if (catLower.includes("rapat") || titleLower.includes("rapat"))
                            colorCls = "bg-purple-50 border-purple-200 text-purple-800";

                          return (
                            <div
                              key={idx}
                              className={`border text-[10px] font-bold px-2 py-0.5 rounded-md truncate w-full shadow-2xs transition-transform flex items-center justify-between gap-1 ${colorCls}`}
                              title={`${s.title} (${s.count} kegiatan)`}
                            >
                              <span className="truncate">{s.title}</span>
                              {s.count > 1 && (
                                <span className="bg-white/80 px-1 py-0.2 rounded text-[9px] font-extrabold shrink-0">
                                  {s.count}x
                                </span>
                              )}
                            </div>
                          );
                        })}

                        {hiddenCount > 0 && (
                          <div className="text-[9px] font-extrabold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.5 rounded-md text-center truncate">
                            +{hiddenCount} kegiatan lagi
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Details */}
        <aside className="w-full lg:w-[340px] max-h-[50vh] lg:max-h-none bg-white rounded-xl shadow-sm border border-outline-variant/50 flex flex-col shrink-0 overflow-hidden transition-all">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-bold text-slate-900 flex items-center gap-2">
                <CalendarCheck className="text-emerald-600" size={18} />
                Detail Agenda
              </h3>
              <button
                onClick={() => setIsGroupedView(!isGroupedView)}
                className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-600 hover:text-emerald-700 hover:border-emerald-300 transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                title={isGroupedView ? "Tampilkan semua individual" : "Ringkas kegiatan serupa"}
              >
                {isGroupedView ? <Layers size={12} /> : <List size={12} />}
                {isGroupedView ? "Mode Ringkas" : "Mode Semua"}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-wider">
                {selectedDate.toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              {(() => {
                const total = getSchedulesForDay(selectedDate).length;
                return total > 0 ? (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                    {total} Agenda
                  </span>
                ) : null;
              })()}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {loading ? (
              <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
                <Loader2 className="animate-spin text-emerald-600" size={28} />
                <p className="text-xs">Memuat agenda...</p>
              </div>
            ) : error ? (
              <div className="p-6 text-center text-red-500 text-xs font-medium">{error}</div>
            ) : (
              (() => {
                const daySchedules = getSchedulesForDay(selectedDate);
                if (daySchedules.length === 0) {
                  return (
                    <div className="mt-4 flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-xl text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                        <CalendarDays size={24} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          Tidak ada kegiatan
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Belum ada agenda dijadwalkan pada tanggal ini.
                        </p>
                      </div>
                      {["SUPER_USER", "RW", "RT", "PETUGAS_RESIDU"].includes(user?.peran || "") && (
                        <button
                          onClick={() => {
                            const year = selectedDate.getFullYear();
                            const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
                            const day = String(selectedDate.getDate()).padStart(2, "0");
                            setFormData((prev: any) => ({ ...prev, date: `${year}-${month}-${day}` }));
                            setIsModalOpen(true);
                          }}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus size={14} /> Buat Agenda Baru
                        </button>
                      )}
                    </div>
                  );
                }

                // If Grouped View is active, group identical activities
                if (isGroupedView) {
                  const groupsMap: Record<string, { title: string; category: string; location: string; items: any[] }> = {};

                  daySchedules.forEach((sch) => {
                    const key = `${(sch.title || "(tanpa judul)").trim()}__${(sch.category || "Lainnya").trim()}`;
                    if (!groupsMap[key]) {
                      groupsMap[key] = {
                        title: sch.title || "(tanpa judul)",
                        category: sch.category || "Lainnya",
                        location: sch.location || "Wilayah Coblong",
                        items: [],
                      };
                    }
                    groupsMap[key].items.push(sch);
                  });

                  const groupsList = Object.entries(groupsMap);

                  return (
                    <div className="flex flex-col gap-3">
                      {groupsList.map(([groupKey, group]) => {
                        const count = group.items.length;
                        const isExpanded = !!expandedGroups[groupKey];
                        const firstItem = group.items[0];
                        const lastItem = group.items[group.items.length - 1];

                        const categoryColors: Record<string, { border: string; badge: string; dot: string }> = {
                          Pengangkutan: { border: "border-l-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
                          Sosialisasi: { border: "border-l-amber-500", badge: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
                          Rapat: { border: "border-l-purple-500", badge: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-500" },
                          Lainnya: { border: "border-l-blue-500", badge: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" },
                        };
                        const catTheme = categoryColors[group.category] || categoryColors.Lainnya;

                        const startTimeStr = firstItem.time || safeFormatTime(firstItem.date);
                        const endTimeStr = lastItem.time || safeFormatTime(lastItem.date);
                        const timeDisplay = count > 1 && startTimeStr !== endTimeStr ? `${startTimeStr} - ${endTimeStr}` : startTimeStr;

                        return (
                          <div
                            key={groupKey}
                            className={`border border-slate-200/80 rounded-xl bg-white hover:border-slate-300 transition-all overflow-hidden border-l-4 ${catTheme.border}`}
                          >
                            <div
                              onClick={() => count > 1 && toggleGroupExpand(groupKey)}
                              className={`p-3 flex flex-col gap-2 ${count > 1 ? "cursor-pointer hover:bg-slate-50/60" : ""}`}
                            >
                              <div className="flex justify-between items-center">
                                <span className={`text-[10px] px-2 py-0.5 rounded border uppercase tracking-wider font-extrabold ${catTheme.badge}`}>
                                  {group.category}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                                    <Clock size={12} className="text-slate-400" />
                                    {timeDisplay}
                                  </span>
                                  {count > 1 && (
                                    <button className="text-slate-400 hover:text-slate-600 p-0.5">
                                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h4 className="text-[13px] font-extrabold text-slate-900 leading-snug">
                                    {group.title}
                                  </h4>
                                  <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1 mt-1">
                                    <MapPin size={12} className="text-slate-400" />
                                    {group.location}
                                  </p>
                                </div>

                                {count > 1 && (
                                  <span className="bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0">
                                    {count} Sesi
                                  </span>
                                )}
                              </div>

                              {/* Single item actions */}
                              {count === 1 && canManageSchedules && (
                                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100 mt-1">
                                  <button
                                    onClick={(e) => handleEdit(firstItem, e)}
                                    className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 cursor-pointer"
                                  >
                                    <Pencil size={12} /> Edit
                                  </button>
                                  <button
                                    onClick={(e) => handleDelete(firstItem.id, e)}
                                    className="text-[11px] text-red-500 hover:text-red-600 font-bold flex items-center gap-1 cursor-pointer"
                                  >
                                    <Trash2 size={12} /> Hapus
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Expanded items list */}
                            {count > 1 && isExpanded && (
                              <div className="bg-slate-50 border-t border-slate-100 p-2 flex flex-col gap-1.5">
                                <div className="text-[10px] font-extrabold text-slate-400 px-2 uppercase tracking-wider">
                                  Rincian Waktu Sesi ({count}):
                                </div>
                                {group.items.map((item, idx) => (
                                  <div
                                    key={item.id || idx}
                                    className="bg-white p-2 rounded-lg border border-slate-200/60 flex items-center justify-between text-[11px] hover:border-emerald-300 transition-colors"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className={`w-1.5 h-1.5 rounded-full ${catTheme.dot}`}></div>
                                      <span className="font-bold text-slate-700">
                                        {item.time || safeFormatTime(item.date)}
                                      </span>
                                      <span className="text-slate-400">•</span>
                                      <span className="text-slate-500 truncate max-w-[120px]">
                                        {item.location || "Wilayah Coblong"}
                                      </span>
                                    </div>
                                    {canManageSchedules && (
                                      <div className="flex items-center gap-1">
                                        <button
                                          onClick={(e) => handleEdit(item, e)}
                                          className="p-1 text-slate-400 hover:text-emerald-600 rounded"
                                          title="Edit"
                                        >
                                          <Pencil size={12} />
                                        </button>
                                        <button
                                          onClick={(e) => handleDelete(item.id, e)}
                                          className="p-1 text-slate-400 hover:text-red-500 rounded"
                                          title="Hapus"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                // Standard full timeline view
                return (
                  <div className="relative pl-3 space-y-3 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {daySchedules.map((schedule) => {
                      const categoryColors: Record<string, { badge: string; dot: string }> = {
                        Pengangkutan: { badge: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
                        Sosialisasi: { badge: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
                        Rapat: { badge: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-500" },
                        Lainnya: { badge: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" },
                      };
                      const catTheme = categoryColors[schedule.category] || categoryColors.Lainnya;

                      return (
                        <div key={schedule.id} className="relative pl-4 group">
                          {/* Timeline dot */}
                          <div className={`absolute -left-[14px] top-3.5 w-2.5 h-2.5 rounded-full ring-4 ring-white ${catTheme.dot}`}></div>

                          <div className="p-3 border border-slate-200/80 rounded-xl bg-white hover:border-emerald-400 hover:shadow-sm transition-all relative">
                            {canManageSchedules && (
                              <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 p-0.5 rounded-md shadow-2xs">
                                <button
                                  onClick={(e) => handleEdit(schedule, e)}
                                  className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                                  title="Edit"
                                >
                                  <Pencil size={13} />
                                </button>
                                <button
                                  onClick={(e) => handleDelete(schedule.id, e)}
                                  className="p-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded"
                                  title="Hapus"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            )}

                            <div className="flex justify-between items-center mb-1">
                              <span className={`text-[9px] px-2 py-0.5 rounded border uppercase tracking-wider font-extrabold ${catTheme.badge}`}>
                                {schedule.category || "Kegiatan"}
                              </span>
                              <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                                <Clock size={12} className="text-slate-400" />
                                {schedule.time || safeFormatTime(schedule.date)}
                              </span>
                            </div>

                            <h4 className="text-[13px] font-extrabold text-slate-900 leading-snug">
                              {schedule.title || "(tanpa judul)"}
                            </h4>
                            <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1 mt-1">
                              <MapPin size={12} className="text-slate-400" />
                              {schedule.location || "Wilayah Coblong"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            )}
          </div>
        </aside>

        {/* Modal Overlay */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-[740px] max-w-full overflow-hidden flex flex-col transform transition-all duration-200 border border-slate-200 max-h-[90vh]">
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {editId ? "Edit Jadwal Kegiatan" : "Buat Jadwal Kegiatan Baru"}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    {modalStep === 1
                      ? "Langkah 1/2: Penentuan Area Geofence (Presensi Lokasi)"
                      : "Langkah 2/2: Informasi Detail & Waktu Pelaksanaan"}
                  </p>
                </div>
                <button
                  className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-200/60 transition-colors cursor-pointer"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditId(null);
                    setFormData({
                      title: "",
                      date: "",
                      time: "",
                      category: "Pengangkutan",
                      location: "",
                      latitude: "",
                      longitude: "",
                      radius: 100,
                      polygon: [],
                    });
                    setGeofenceMode("CIRCLE");
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
                {modalStep === 1 ? (
                  <div className="flex flex-col gap-4">
                    {/* Mode Selector Tabs */}
                    <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setGeofenceMode("CIRCLE");
                          if (formData.polygon.length > 1) {
                            setFormData((prev: any) => ({
                              ...prev,
                              polygon: prev.polygon.slice(0, 1),
                            }));
                          }
                        }}
                        className={`flex-1 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          geofenceMode === "CIRCLE"
                            ? "bg-white text-blue-700 shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <span>🔵 Radius Lingkaran (Bulat)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setGeofenceMode("POLYGON")}
                        className={`flex-1 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          geofenceMode === "POLYGON"
                            ? "bg-white text-emerald-700 shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <span>🟢 Polygon Kustom (Multi-Sudut)</span>
                      </button>
                    </div>

                    {/* Geofence Map */}
                    <div className="h-[280px] rounded-xl overflow-hidden border border-slate-200 relative z-0 shadow-inner">
                      <MapContainer
                        center={
                          formData.polygon.length > 0
                            ? formData.polygon[0]
                            : [-6.8915, 107.6107]
                        }
                        zoom={15}
                        style={{ height: "100%", width: "100%" }}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <DualGeofencePickerMap
                          mode={geofenceMode}
                          points={formData.polygon || []}
                          onChange={(pts) =>
                            setFormData((prev: any) => ({ ...prev, polygon: pts }))
                          }
                          radius={Number(formData.radius) || 100}
                        />
                      </MapContainer>

                      {/* Map overlay action buttons */}
                      <div className="absolute bottom-3 right-3 z-[999] flex items-center gap-1.5 bg-white/95 backdrop-blur-xs p-1 rounded-xl shadow-md border border-slate-200">
                        {geofenceMode === "POLYGON" && formData.polygon.length > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev: any) => ({
                                ...prev,
                                polygon: prev.polygon.slice(0, -1),
                              }))
                            }
                            className="px-2.5 py-1 text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                          >
                            Hapus Titik Terakhir
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setFormData((prev: any) => ({ ...prev, polygon: [] }))}
                          className="px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                        >
                          Reset Peta
                        </button>
                      </div>
                    </div>

                    {/* Mode Specific Controls */}
                    {geofenceMode === "CIRCLE" ? (
                      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-4 flex flex-col gap-3">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <label className="text-xs font-black text-slate-800">
                              Radius Area Absensi:
                            </label>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min={30}
                                max={10000}
                                step={50}
                                value={formData.radius || 100}
                                onChange={(e) =>
                                  setFormData((prev: any) => ({ ...prev, radius: Math.max(30, Number(e.target.value)) }))
                                }
                                className="w-20 h-7 text-center font-mono font-black bg-white border border-emerald-300 rounded-lg text-emerald-950 text-xs outline-none focus:border-emerald-600 shadow-2xs"
                              />
                              <span className="text-[11px] font-bold text-slate-600">Meter</span>
                              <span className="bg-emerald-700 text-white px-2 py-0.5 rounded-md text-[11px] font-mono font-bold shadow-2xs">
                                {Number(formData.radius || 100) >= 1000
                                  ? `${(Number(formData.radius || 100) / 1000).toFixed(1).replace(/\.0$/, "")} km`
                                  : `${formData.radius || 100} m`}
                              </span>
                            </div>
                          </div>
                          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                            +15m Toleransi Drift GPS
                          </span>
                        </div>

                        {/* Slider & Presets */}
                        <div className="space-y-1">
                          <input
                            type="range"
                            min="50"
                            max="5000"
                            step="50"
                            value={formData.radius || 100}
                            onChange={(e) =>
                              setFormData((prev: any) => ({ ...prev, radius: e.target.value }))
                            }
                            className="w-full h-2.5 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-700"
                          />
                          <div className="flex justify-between text-[10px] text-slate-400 font-bold font-mono px-0.5">
                            <span>50m</span>
                            <span>1 km</span>
                            <span>2.5 km</span>
                            <span>5 km (5000m)</span>
                          </div>
                        </div>

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
                              onClick={() =>
                                setFormData((prev: any) => ({ ...prev, radius: preset.val }))
                              }
                              className={`px-2.5 py-1 text-[11px] font-black rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                                Number(formData.radius) === preset.val
                                  ? "bg-emerald-700 text-white shadow-2xs ring-1 ring-emerald-800"
                                  : "bg-white border border-emerald-200 text-emerald-950 hover:bg-emerald-100"
                              }`}
                            >
                              <span>📍</span>
                              <span>{preset.label}</span>
                            </button>
                          ))}
                        </div>

                        {/* Titik Pusat Koordinat */}
                        <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-xs">
                          <span className="text-slate-700 font-semibold">
                            Titik Pusat:{" "}at:{" "}
                            {formData.polygon.length > 0 ? (
                              <strong className="font-mono text-slate-900">
                                {formData.polygon[0][0].toFixed(6)},{" "}
                                {formData.polygon[0][1].toFixed(6)}
                              </strong>
                            ) : (
                              <span className="italic text-slate-400">
                                Belum dipilih (Klik pada peta)
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-4 flex flex-col gap-3">
                        {/* Status Validation Badge */}
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black text-emerald-950">
                            Daftar Titik Sudut Poligon ({formData.polygon.length} Titik)
                          </span>
                          {formData.polygon.length >= 3 ? (
                            <span className="text-[10.5px] font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                              ✓ Poligon Valid & Siap Digunakan
                            </span>
                          ) : (
                            <span className="text-[10.5px] font-black text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                              ⚠️ Butuh minimal 3 titik sudut (Kurang {3 - formData.polygon.length})
                            </span>
                          )}
                        </div>

                        {/* Manual Coordinate Input Row */}
                        <div className="flex gap-2 items-center">
                          <input
                            type="number"
                            step="any"
                            placeholder="Latitude (cth: -6.8915)"
                            value={manualLat}
                            onChange={(e) => setManualLat(e.target.value)}
                            className="flex-1 px-3 py-1.5 text-xs bg-white border border-emerald-200 rounded-lg focus:outline-none focus:border-emerald-600"
                          />
                          <input
                            type="number"
                            step="any"
                            placeholder="Longitude (cth: 107.6107)"
                            value={manualLng}
                            onChange={(e) => setManualLng(e.target.value)}
                            className="flex-1 px-3 py-1.5 text-xs bg-white border border-emerald-200 rounded-lg focus:outline-none focus:border-emerald-600"
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
                              setFormData((prev: any) => ({
                                ...prev,
                                polygon: [...prev.polygon, [lat, lng]],
                              }));
                              setManualLat("");
                              setManualLng("");
                              toast.success("Titik koordinat berhasil ditambahkan");
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0"
                          >
                            + Tambah Titik
                          </button>
                        </div>

                        {/* Coordinate Points Table */}
                        {formData.polygon.length > 0 && (
                          <div className="max-h-[120px] overflow-y-auto rounded-lg border border-emerald-200 bg-white">
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
                                {formData.polygon.map((p: [number, number], idx: number) => (
                                  <tr key={idx} className="hover:bg-emerald-50/50">
                                    <td className="px-2.5 py-1 font-bold text-slate-500">
                                      {idx + 1}
                                    </td>
                                    <td className="px-2.5 py-1 font-mono text-slate-800">
                                      {Number(p[0]).toFixed(6)}
                                    </td>
                                    <td className="px-2.5 py-1 font-mono text-slate-800">
                                      {Number(p[1]).toFixed(6)}
                                    </td>
                                    <td className="px-2.5 py-1 text-right">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setFormData((prev: any) => ({
                                            ...prev,
                                            polygon: prev.polygon.filter(
                                              (_: any, i: number) => i !== idx
                                            ),
                                          }))
                                        }
                                        className="text-red-500 hover:text-red-700 font-bold cursor-pointer"
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
                ) : (
                  <div className="flex flex-col gap-4">
                    {isDpl && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 font-semibold flex items-center gap-2">
                        <span>📌</span>
                        <span>
                          Jadwal kegiatan ini akan otomatis ditugaskan ke seluruh Mahasiswa KKN di
                          kelompok bimbingan Anda.
                        </span>
                      </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-black text-slate-800">
                        Nama Kegiatan <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 w-full text-xs font-bold text-slate-800"
                        placeholder="Contoh: Sosialisasi Pemilahan Sampah Organik RW 03"
                      />
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-1 flex flex-col gap-1.5">
                        <label className="text-xs font-black text-slate-800">
                          Tanggal <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <CalendarDays
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            size={16}
                          />
                          <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 w-full text-xs font-bold text-slate-800"
                          />
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col gap-1.5">
                        <label className="text-xs font-black text-slate-800">
                          Waktu Pelaksanaan <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Clock
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            size={16}
                          />
                          <input
                            type="time"
                            value={formData.time}
                            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                            className="pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 w-full text-xs font-bold text-slate-800"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-black text-slate-800">
                        Kategori Kegiatan <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 w-full text-xs font-bold text-slate-800 bg-white"
                      >
                        <option value="Pengangkutan">Pengangkutan</option>
                        <option value="Sosialisasi">Sosialisasi</option>
                        <option value="Rapat">Rapat</option>
                        <option value="Monitoring">Monitoring Lapangan</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-black text-slate-800">
                        Lokasi Deskriptif (Opsional)
                      </label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 w-full text-xs text-slate-800 font-medium"
                        placeholder="Contoh: Balai Pertemuan RW 04 Kelurahan Dago"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex justify-end gap-2.5">
                {modalStep === 1 ? (
                  <>
                    <button
                      type="button"
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
                      onClick={() => {
                        setIsModalOpen(false);
                        setEditId(null);
                      }}
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                      disabled={
                        geofenceMode === "CIRCLE"
                          ? formData.polygon.length === 0
                          : formData.polygon.length < 3
                      }
                      onClick={() => setModalStep(2)}
                    >
                      <span>Lanjut Isi Detail</span>
                      <ChevronRight size={14} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
                      onClick={() => setModalStep(1)}
                    >
                      Kembali ke Peta
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl transition-colors cursor-pointer"
                      onClick={handleSubmit}
                    >
                      {editId ? "Simpan Perubahan" : "Publikasikan Jadwal"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <ConfirmModal
          isOpen={!!deleteConfirmId}
          onClose={() => setDeleteConfirmId(null)}
          onConfirm={handleConfirmDelete}
          title="Hapus Jadwal Kegiatan"
          message="Apakah Anda yakin ingin menghapus jadwal kegiatan ini? Tindakan ini tidak dapat dibatalkan."
          confirmText="Ya, Hapus Jadwal"
          type="danger"
        />
      </main>
    </div>
      )}
    </div>
  );
};

export default JadwalKegiatan;
