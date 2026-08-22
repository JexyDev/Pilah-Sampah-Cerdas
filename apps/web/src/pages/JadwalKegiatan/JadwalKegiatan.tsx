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
  Upload,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import api from "../../services/api";
import { useAuthStore } from "../../store/useAuthStore";
import { MapContainer, Marker, useMapEvents, useMap, Polygon, Polyline, Circle } from "react-leaflet";
import { ThemeTileLayer } from "../../components/common/ThemeTileLayer";
import L from "leaflet";
import { ConfirmModal } from "../../components/common/ConfirmModal";
import {
  TIMELINE_KKN_HEADER,
  TIMELINE_KKN_DATA,
  computeTimelineStatus,
} from "../../data/timelineKknData";
import { TimelineKknModal } from "./components/TimelineKknModal";
import { TimelineImportModal } from "./components/TimelineImportModal";

// Google Drive Official Logo Icon Component
const GoogleDriveIcon = () => (
  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 87.3 78" fill="none">
    <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da" />
    <path d="M43.65 25 29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47" />
    <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.85 10.1z" fill="#ea4335" />
    <path d="M43.65 25 57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.4-4.5 1.2z" fill="#00832d" />
    <path d="M59.8 53H87.3c0-1.55-.4-3.1-1.2-4.5l-19.9-34.5c-.8-1.4-1.95-2.5-3.3-3.3z" fill="#2684fc" />
    <path d="m73.55 76.8-13.75-23.8H27.5l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.4 4.5-1.2z" fill="#ffba00" />
  </svg>
);

const KELURAHAN_FILTER_OPTIONS = [
  "ALL",
  "Dago",
  "Lebak Gede",
  "Lebak Siliwangi",
  "Sadang Serang",
  "Sekeloa",
  "Cipaganti",
];

const BIDANG_FILTER_OPTIONS = [
  "ALL",
  "Tata Kelola & Koordinasi",
  "Pemilahan Sampah",
  "Edukasi Warga & Sosialisasi",
  "Pengangkutan & Logistik",
  "Pengolahan & Bank Sampah",
  "Evaluasi & Pelaporan",
];

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
  const isDpl = ["DPL", "DOSEN_PEMBIMBING"].includes(userRole);
  const canManageSchedules =
    !isDpl &&
    [
      "SUPER_USER",
      "ADMIN_DLH",
      "PEMIMPIN",
      "PANITIA_TASKFORCE",
      "DEVELOPER",
      "RW",
      "RT",
      "PETUGAS_RESIDU",
    ].includes(userRole);

  const canManageTimeline =
    !isDpl && ["SUPER_USER", "DEVELOPER", "PANITIA_TASKFORCE"].includes(userRole);

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

  // Dynamic Timeline State & Filters (Termasuk Kelurahan, Bidang, Status)
  const [timelineList, setTimelineList] = useState<any[]>(TIMELINE_KKN_DATA);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineSearch, setTimelineSearch] = useState("");
  const [selectedKelurahan, setSelectedKelurahan] = useState<string>("ALL");
  const [selectedBidang, setSelectedBidang] = useState<string>("ALL");
  const [selectedFase, setSelectedFase] = useState<string>("ALL");
  const [selectedScope, setSelectedScope] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [startDateFilter, setStartDateFilter] = useState<string>("");
  const [endDateFilter, setEndDateFilter] = useState<string>("");

  // Timeline Modals
  const [timelineModalOpen, setTimelineModalOpen] = useState(false);
  const [timelineEditItem, setTimelineEditItem] = useState<any | null>(null);
  const [timelineDeleteId, setTimelineDeleteId] = useState<string | null>(null);
  const [timelineImportModalOpen, setTimelineImportModalOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const [groups, setGroups] = useState<any[]>([]);

  const fetchGroups = async () => {
    try {
      const res = await api.get("/kelompok?limit=0");
      const list = res.data?.groups || res.data?.data || (Array.isArray(res.data) ? res.data : []);
      setGroups(list);
    } catch {
      // ignore
    }
  };

  const filterLocalDefaultData = () => {
    let list = TIMELINE_KKN_DATA.map((item) => ({
      ...item,
      statusPelaksanaan: computeTimelineStatus(
        (item as any).startDate,
        (item as any).endDate,
        item.tanggal,
        item.statusPelaksanaan
      ),
    }));

    if (selectedKelurahan !== "ALL") {
      list = list.filter((item) =>
        (item.kelurahan || "Semua Kelurahan").toLowerCase().includes(selectedKelurahan.toLowerCase()) ||
        (item.kelurahan || "").includes("Semua")
      );
    }
    if (selectedBidang !== "ALL") {
      list = list.filter((item) =>
        (item.bidangKegiatan || "Tata Kelola & Koordinasi").toLowerCase().includes(selectedBidang.toLowerCase())
      );
    }
    if (selectedFase !== "ALL") {
      list = list.filter((item) => item.fase.toLowerCase().includes(selectedFase.toLowerCase()));
    }
    if (selectedStatus !== "ALL") {
      list = list.filter((item) => (item.statusPelaksanaan || "BELUM_DIMULAI") === selectedStatus);
    }
    if (timelineSearch.trim()) {
      const q = timelineSearch.trim().toLowerCase();
      list = list.filter(
        (item) =>
          item.tahapMinggu.toLowerCase().includes(q) ||
          (item.kelurahan && item.kelurahan.toLowerCase().includes(q)) ||
          (item.bidangKegiatan && item.bidangKegiatan.toLowerCase().includes(q)) ||
          item.kegiatanUtama.toLowerCase().includes(q) ||
          item.outputTarget.toLowerCase().includes(q) ||
          item.picKeterangan.toLowerCase().includes(q) ||
          item.fase.toLowerCase().includes(q) ||
          item.tanggal.toLowerCase().includes(q)
      );
    }
    if (selectedScope !== "ALL" && selectedScope !== "GLOBAL") {
      list = list.filter((item) => item.kelompokId === selectedScope);
    }
    setTimelineList(list);
  };

  const fetchTimelineList = async () => {
    setTimelineLoading(true);
    try {
      const params: any = {};
      if (selectedScope !== "ALL") params.kelompokId = selectedScope;
      if (selectedKelurahan !== "ALL") params.kelurahan = selectedKelurahan;
      if (selectedBidang !== "ALL") params.bidangKegiatan = selectedBidang;
      if (selectedFase !== "ALL") params.fase = selectedFase;
      if (selectedStatus !== "ALL") params.statusPelaksanaan = selectedStatus;
      if (timelineSearch.trim()) params.search = timelineSearch.trim();
      if (startDateFilter) params.startDate = startDateFilter;
      if (endDateFilter) params.endDate = endDateFilter;

      const res = await api.get("/timeline-kkn", { params });
      const rawData = res.data?.data;
      if (Array.isArray(rawData) && rawData.length > 0) {
        // Dinamisasi status real-time mengikuti kalender hari ini
        const resolved = rawData.map((item: any) => ({
          ...item,
          statusPelaksanaan: computeTimelineStatus(
            item.startDate,
            item.endDate,
            item.tanggal,
            item.statusPelaksanaan
          ),
        }));
        setTimelineList(resolved);
      } else if (
        Array.isArray(rawData) &&
        rawData.length === 0 &&
        (selectedScope !== "ALL" || selectedKelurahan !== "ALL" || selectedBidang !== "ALL")
      ) {
        setTimelineList([]);
      } else {
        filterLocalDefaultData();
      }
    } catch (err: any) {
      console.warn("[fetchTimelineList] API unavailable, using local default reference data:", err?.message || err);
      filterLocalDefaultData();
    } finally {
      setTimelineLoading(false);
    }
  };

  const fetchSchedules = async () => {
    try {
      const response = await api.get("/schedules");
      const raw = response.data.data;
      setSchedules(Array.isArray(raw) ? raw : []);
    } catch (err: any) {
      const errMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Gagal memuat data dari server.";
      setError(errMsg);
      toast.error(`Gagal memuat jadwal kegiatan: ${errMsg}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
    fetchGroups();
  }, []);

  useEffect(() => {
    fetchTimelineList();
  }, [
    selectedScope,
    selectedKelurahan,
    selectedBidang,
    selectedFase,
    selectedStatus,
    timelineSearch,
    startDateFilter,
    endDateFilter,
  ]);

  const handleQuickStatusChange = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/timeline-kkn/${id}/status`, { statusPelaksanaan: newStatus });
      setTimelineList((prev) =>
        prev.map((item) => (item.id === id ? { ...item, statusPelaksanaan: newStatus } : item))
      );
      toast.success("Status kegiatan diperbarui!");
    } catch (err: any) {
      toast.error("Gagal memperbarui status: " + (err.response?.data?.message || err.message));
    }
  };

  const handleConfirmDeleteTimeline = async () => {
    if (!timelineDeleteId) return;
    try {
      await api.delete(`/timeline-kkn/${timelineDeleteId}`);
      toast.success("Kegiatan linimasa berhasil dihapus!");
      setTimelineDeleteId(null);
      fetchTimelineList();
    } catch (err: any) {
      toast.error("Gagal menghapus kegiatan: " + (err.response?.data?.message || err.message));
    }
  };

  const handleResetOfficialAcuan = async () => {
    try {
      await api.post("/timeline-kkn/seed-defaults", { forceReplace: true });
      toast.success("Berhasil mengatur ulang ke acuan resmi 12 pekan!");
      setResetConfirmOpen(false);
      fetchTimelineList();
    } catch (err: any) {
      toast.error("Gagal reset acuan: " + (err.response?.data?.message || err.message));
    }
  };

  const handleExportTimelineExcel = () => {
    try {
      const headers = [
        "No",
        "Kelurahan",
        "Kelompok",
        "Tahap / Minggu",
        "Tanggal",
        "Fase",
        "Bidang Kegiatan",
        "Kegiatan Utama",
        "Output / Target",
        "PIC / Keterangan",
        "URL Google Drive",
        "Status",
      ];
      const rows = timelineList.map((item, idx) => [
        idx + 1,
        item.kelurahan || item.kelompok?.kelurahan || "Semua Kelurahan",
        item.kelompok ? `Kelompok ${item.kelompok.name}` : "Global (Semua Kelompok)",
        item.tahapMinggu,
        item.tanggal,
        item.fase,
        item.bidangKegiatan || "Tata Kelola & Koordinasi",
        item.kegiatanUtama,
        item.outputTarget,
        item.picKeterangan,
        item.linkGoogleDrive || "-",
        item.statusPelaksanaan || "BELUM_DIMULAI",
      ]);

      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      ws["!cols"] = [
        { wch: 8 },
        { wch: 20 },
        { wch: 20 },
        { wch: 18 },
        { wch: 25 },
        { wch: 30 },
        { wch: 25 },
        { wch: 45 },
        { wch: 45 },
        { wch: 30 },
        { wch: 40 },
        { wch: 20 },
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Linimasa_KKN");
      XLSX.writeFile(wb, `Linimasa_KKN_${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success("Data linimasa berhasil diexport ke Excel (.xlsx)!");
    } catch (err: any) {
      toast.error("Gagal export Excel: " + err.message);
    }
  };

  const handleExportTimelineCsv = () => {
    const headers = [
      "No",
      "Kelurahan",
      "Kelompok",
      "Tahap / Minggu",
      "Tanggal",
      "Fase",
      "Bidang Kegiatan",
      "Kegiatan Utama",
      "Output / Target",
      "PIC / Keterangan",
      "URL Google Drive",
      "Status",
    ];
    const rows = timelineList.map((item, idx) => [
      idx + 1,
      `"${(item.kelurahan || item.kelompok?.kelurahan || "Semua Kelurahan").replace(/"/g, '""')}"`,
      `"${item.kelompok ? "Kelompok " + item.kelompok.name : "Global (Semua Kelompok)"}"`,
      `"${(item.tahapMinggu || "").replace(/"/g, '""')}"`,
      `"${(item.tanggal || "").replace(/"/g, '""')}"`,
      `"${(item.fase || "").replace(/"/g, '""')}"`,
      `"${(item.bidangKegiatan || "Tata Kelola & Koordinasi").replace(/"/g, '""')}"`,
      `"${(item.kegiatanUtama || "").replace(/"/g, '""')}"`,
      `"${(item.outputTarget || "").replace(/"/g, '""')}"`,
      `"${(item.picKeterangan || "").replace(/"/g, '""')}"`,
      `"${(item.linkGoogleDrive || "-").replace(/"/g, '""')}"`,
      `"${item.statusPelaksanaan || "BELUM_DIMULAI"}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Timeline_KKN_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Tabel Timeline KKN berhasil diunduh (CSV)");
  };

  useEffect(() => {
    fetchSchedules();
    fetchGroups();
  }, []);


  const [geofenceMode, setGeofenceMode] = useState<"CIRCLE" | "POLYGON">("CIRCLE");
  const [manualLat, setManualLat] = useState<string>("");
  const [manualLng, setManualLng] = useState<string>("");

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const toggleGroupExpand = (groupKey: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const [timeStart, setTimeStart] = useState<string>("08:00");
  const [timeEnd, setTimeEnd] = useState<string>("16:00");

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
    kelompokId: "",
  });

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
        toast.error("Lokasi koordinat berada di luar wilayah operasional yang terdaftar!");
        return;
      }
    }

    // Simpan tanggal sebagai midnight WIB (UTC+7)
    const formattedIsoDate = new Date(`${formData.date}T00:00:00+07:00`).toISOString();
    if (!formattedIsoDate) {
      toast.error("Format tanggal tidak valid");
      return;
    }

    // Gabung waktu range — selalu format 24-jam dari <input type="time">
    const timeFormatted = `${timeStart} - ${timeEnd}`;

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
        time: timeFormatted,
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
      setFormData({ title: "", date: "", time: "", category: "Pengangkutan", location: "", latitude: "", longitude: "", radius: 100, polygon: [], kelompokId: "" });
      setTimeStart("08:00");
      setTimeEnd("16:00");
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
      kelompokId: schedule.kelompokId || "",
    });
    // Parse existing time range "HH:MM - HH:MM" back into separate fields
    if (schedule.time) {
      const stripped = schedule.time.replace(/\s*(WIB|WITA|WIT)\s*/gi, "").trim();
      const parts = stripped.split("-");
      if (parts.length >= 2) {
        setTimeStart(parts[0].trim().replace(".", ":") || "08:00");
        setTimeEnd(parts[1].trim().replace(".", ":") || "16:00");
      }
    }
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
        <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-lg text-[10.5px] font-extrabold whitespace-nowrap">
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
    if (status === "SEDANG_BERJALAN") {
      return (
        <span className="px-3 py-1 bg-emerald-500 text-white rounded-full text-[10.5px] font-extrabold flex items-center gap-1.5 w-fit shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Berjalan
        </span>
      );
    }
    if (status === "SELESAI") {
      return (
        <span className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-full text-[10.5px] font-extrabold flex items-center gap-1 w-fit">
          <CheckCircle2 size={12} /> Selesai
        </span>
      );
    }
    return (
      <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-full text-[10.5px] font-bold w-fit">
        Belum
      </span>
    );
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      {/* Top Header & View Switcher Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Time Line & Jadwal Kegiatan KKN</h1>
          <p className="text-slate-500 text-xs mt-1">
            Rencana kerja terstruktur, tahapan linimasa, dan monitoring jadwal lapangan program KKN.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="bg-slate-100/90 dark:bg-slate-800/90 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveMainTab("TABEL_TIMELINE")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
              activeMainTab === "TABEL_TIMELINE"
                ? "bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-400 shadow-xs border border-slate-200/80 dark:border-slate-700"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <TableIcon size={14} className={activeMainTab === "TABEL_TIMELINE" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"} />
            <span>Tabel Rencana Kerja</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMainTab("KALENDER_AGENDA")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
              activeMainTab === "KALENDER_AGENDA"
                ? "bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-400 shadow-xs border border-slate-200/80 dark:border-slate-700"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <CalendarDays size={14} className={activeMainTab === "KALENDER_AGENDA" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"} />
            <span>Kalender & Agenda</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: TABEL TIMELINE (DINAMIS DENGAN CRUD, FILTER & IMPORT EXCEL) */}
      {activeMainTab === "TABEL_TIMELINE" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Hero Banner: Info Timeline & Action Buttons */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/40 flex items-center justify-center shrink-0 shadow-2xs">
                  <FileSpreadsheet size={24} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                    {TIMELINE_KKN_HEADER.judul}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                    Tema: <strong className="text-emerald-800 dark:text-emerald-400">"{TIMELINE_KKN_HEADER.tema}"</strong> • Pra-Kegiatan: {TIMELINE_KKN_HEADER.praKegiatan} • Penerjunan: {TIMELINE_KKN_HEADER.penerjunan}
                  </p>
                </div>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleExportTimelineExcel}
                  className="px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Unduh Linimasa dalam format Excel (.xlsx)"
                >
                  <FileSpreadsheet size={14} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Excel (.xlsx)</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportTimelineCsv}
                  className="px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Unduh Linimasa dalam format CSV"
                >
                  <Download size={14} className="text-slate-500" />
                  <span>CSV</span>
                </button>

                {canManageTimeline && (
                  <>
                    <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 hidden sm:block mx-1"></div>

                    <button
                      type="button"
                      onClick={() => setTimelineImportModalOpen(true)}
                      className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Import dari file Excel (.xlsx / .csv)"
                    >
                      <Upload size={14} />
                      <span>Import Excel</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTimelineEditItem(null);
                        setTimelineModalOpen(true);
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                    >
                      <Plus size={14} />
                      <span>Tambah Kegiatan</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setResetConfirmOpen(true)}
                      className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                      title="Reset ke Acuan Resmi 12 Pekan"
                    >
                      <RotateCcw size={15} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* 4 Dynamic Summary Stat Cards */}
            {(() => {
              const total = timelineList.length;
              const selesai = timelineList.filter((t) => t.statusPelaksanaan === "SELESAI").length;
              const berjalan = timelineList.filter((t) => t.statusPelaksanaan === "SEDANG_BERJALAN").length;
              const belum = timelineList.filter(
                (t) => !t.statusPelaksanaan || t.statusPelaksanaan === "BELUM_DIMULAI"
              ).length;
              const pctSelesai = total > 0 ? Math.round((selesai / total) * 100) : 0;

              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  <div className="bg-slate-50/80 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-700/60">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">
                      Total Kegiatan
                    </span>
                    <span className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1 block">
                      {total} Tahapan
                    </span>
                    <span className="text-[10.5px] text-slate-400 font-medium">
                      Sesuai filter & cakupan aktif
                    </span>
                  </div>
                  <div className="bg-blue-50/70 dark:bg-blue-950/40 p-4 rounded-2xl border border-blue-200/80 dark:border-blue-800/60">
                    <span className="text-[11px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider block">
                      Selesai Dilaksanakan
                    </span>
                    <span className="text-2xl font-black text-blue-700 dark:text-blue-300 mt-1 block">
                      {selesai} ({pctSelesai}%)
                    </span>
                    <span className="text-[10.5px] text-blue-600/80 dark:text-blue-400 font-semibold">
                      Tahapan rampung
                    </span>
                  </div>
                  <div className="bg-emerald-50/80 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/60">
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-bold uppercase tracking-wider block">
                      Sedang Berjalan
                    </span>
                    <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1 block">
                      {berjalan} Agenda
                    </span>
                    <span className="text-[10.5px] text-emerald-700/80 dark:text-emerald-400 font-semibold">
                      Fokus kegiatan saat ini
                    </span>
                  </div>
                  <div className="bg-slate-50/80 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-700/60">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">
                      Belum Dimulai
                    </span>
                    <span className="text-2xl font-black text-slate-600 dark:text-slate-300 mt-1 block">
                      {belum} Agenda
                    </span>
                    <span className="text-[10.5px] text-slate-400 font-medium">
                      Rencana kerja mendatang
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Multi-Filter Bar (6 Filter Lengkap: Search, Kelurahan, Kelompok, Bidang, Fase, Status) */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {/* Search Bar */}
              <div className="relative sm:col-span-2 md:col-span-3 lg:col-span-2">
                <input
                  type="text"
                  placeholder="Cari kegiatan, output, PIC, atau tanggal..."
                  value={timelineSearch}
                  onChange={(e) => setTimelineSearch(e.target.value)}
                  className="w-full pl-3 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-emerald-500 focus:bg-white transition font-medium"
                />
                {timelineSearch ? (
                  <button
                    onClick={() => setTimelineSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                ) : (
                  <Search
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                )}
              </div>

              {/* Kelurahan Filter */}
              <div>
                <select
                  value={selectedKelurahan}
                  onChange={(e) => setSelectedKelurahan(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none focus:border-emerald-500 focus:bg-white transition cursor-pointer"
                >
                  <option value="ALL">📍 Semua Kelurahan</option>
                  {KELURAHAN_FILTER_OPTIONS.filter((k) => k !== "ALL").map((k) => (
                    <option key={k} value={k}>
                      📍 Kel. {k}
                    </option>
                  ))}
                </select>
              </div>

              {/* Scope / Kelompok Filter */}
              <div>
                <select
                  value={selectedScope}
                  onChange={(e) => setSelectedScope(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none focus:border-emerald-500 focus:bg-white transition cursor-pointer"
                >
                  <option value="ALL">🌐 Semua Kelompok / Global</option>
                  <option value="GLOBAL">🏛️ Acuan Global KKN</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      👥 {g.name} {g.kelurahan ? `(${g.kelurahan})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bidang Kegiatan Filter */}
              <div>
                <select
                  value={selectedBidang}
                  onChange={(e) => setSelectedBidang(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none focus:border-emerald-500 focus:bg-white transition cursor-pointer"
                >
                  <option value="ALL">🏷️ Semua Bidang Kegiatan</option>
                  {BIDANG_FILTER_OPTIONS.filter((b) => b !== "ALL").map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fase Filter */}
              <div>
                <select
                  value={selectedFase}
                  onChange={(e) => setSelectedFase(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none focus:border-emerald-500 focus:bg-white transition cursor-pointer"
                >
                  <option value="ALL">Semua Fase Program</option>
                  <option value="Pra-Kegiatan">Pra-Kegiatan</option>
                  <option value="Fase 1">Fase 1 - Persiapan</option>
                  <option value="Fase 2">Fase 2 - Pilot Project</option>
                  <option value="Fase 3">Fase 3 - Implementasi</option>
                  <option value="Fase 4">Fase 4 - Evaluasi</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="sm:col-span-2 md:col-span-1 lg:col-span-1">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none focus:border-emerald-500 focus:bg-white transition cursor-pointer"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="BELUM_DIMULAI">Belum Dimulai</option>
                  <option value="SEDANG_BERJALAN">Sedang Berjalan (Hijau)</option>
                  <option value="SELESAI">Selesai</option>
                </select>
              </div>
            </div>

            {/* Sub Filter Row: Date Range & Results Count */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-400 font-semibold flex items-center gap-1">
                  <Calendar size={13} /> Rentang Tanggal:
                </span>
                <input
                  type="date"
                  value={startDateFilter}
                  onChange={(e) => setStartDateFilter(e.target.value)}
                  className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 outline-none focus:border-emerald-500 cursor-pointer"
                />
                <span className="text-slate-400">s/d</span>
                <input
                  type="date"
                  value={endDateFilter}
                  onChange={(e) => setEndDateFilter(e.target.value)}
                  className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 outline-none focus:border-emerald-500 cursor-pointer"
                />
                {(timelineSearch ||
                  selectedKelurahan !== "ALL" ||
                  selectedBidang !== "ALL" ||
                  selectedFase !== "ALL" ||
                  selectedScope !== "ALL" ||
                  selectedStatus !== "ALL" ||
                  startDateFilter ||
                  endDateFilter) && (
                  <button
                    onClick={() => {
                      setTimelineSearch("");
                      setSelectedKelurahan("ALL");
                      setSelectedBidang("ALL");
                      setSelectedFase("ALL");
                      setSelectedScope("ALL");
                      setSelectedStatus("ALL");
                      setStartDateFilter("");
                      setEndDateFilter("");
                    }}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1 ml-1 cursor-pointer"
                  >
                    <RotateCcw size={11} /> Reset Filter
                  </button>
                )}
              </div>

              <div className="text-xs font-bold text-slate-500">
                Menampilkan <strong className="text-slate-900 dark:text-slate-100">{timelineList.length}</strong> kegiatan
              </div>
            </div>
          </div>

          {/* Banner Status Pekan KKN Aktif Saat Ini (Indikator Hijau Konsisten) */}
          {(() => {
            const activeItem =
              timelineList.find((t) => t.statusPelaksanaan === "SEDANG_BERJALAN") ||
              timelineList.find((t) => t.tahapMinggu?.includes("Minggu 2"));

            if (!activeItem) return null;

            return (
              <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 dark:from-emerald-950/40 dark:via-teal-950/40 dark:to-emerald-950/40 border border-emerald-300/80 dark:border-emerald-700/60 rounded-3xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Clock size={22} className="animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                        ⚡ Pekan Sedang Berjalan (Hari Ini: 21 Agustus 2026)
                      </span>
                      <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                        {activeItem.tahapMinggu} • {activeItem.tanggal}
                      </span>
                    </div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 mt-1">
                      {activeItem.kegiatanUtama}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                      <strong>Target Output:</strong> {activeItem.outputTarget}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <span className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                    SEDANG BERJALAN
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Dynamic Tabular Table (10 Kolom Lengkap: No, Kelurahan, Kelompok, Tahap, Tanggal, Bidang & Kegiatan, Output, URL GDrive, Status, Aksi) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            {timelineLoading ? (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
                <Loader2 className="animate-spin text-emerald-600" size={32} />
                <p className="text-xs font-bold">Memuat data linimasa...</p>
              </div>
            ) : timelineList.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
                <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                  <CalendarDays size={28} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Tidak ada kegiatan ditemukan
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Coba sesuaikan kata kunci pencarian atau ubah filter kelurahan/bidang/scope.
                  </p>
                </div>
                {canManageTimeline && (
                  <button
                    onClick={() => {
                      setTimelineEditItem(null);
                      setTimelineModalOpen(true);
                    }}
                    className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus size={14} /> Tambah Kegiatan Pertama
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
                  <thead>
                    <tr className="bg-slate-50/90 dark:bg-slate-800/90 text-slate-500 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider font-bold">
                      <th className="py-3.5 px-4 w-12 text-center">No</th>
                      <th className="py-3.5 px-4 w-32">Kelurahan</th>
                      <th className="py-3.5 px-4 w-32">Kelompok</th>
                      <th className="py-3.5 px-4 w-32">Tahap / Minggu</th>
                      <th className="py-3.5 px-4 w-36">Tanggal</th>
                      <th className="py-3.5 px-4 min-w-[280px]">Cakupan & Kegiatan Utama</th>
                      <th className="py-3.5 px-4 min-w-[220px]">Output / Target</th>
                      <th className="py-3.5 px-4 w-36 text-center">URL Google Drive</th>
                      <th className="py-3.5 px-4 w-36 text-center">Status</th>
                      {canManageTimeline && <th className="py-3.5 px-4 w-20 text-center">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {timelineList.map((item, idx) => (
                      <tr
                        key={item.id || idx}
                        className={`transition-colors group ${
                          item.statusPelaksanaan === "SEDANG_BERJALAN"
                            ? "bg-emerald-50/60 dark:bg-emerald-950/20 font-semibold ring-1 ring-emerald-300/50 dark:ring-emerald-800/40"
                            : "hover:bg-slate-50/80 dark:hover:bg-slate-800/80"
                        }`}
                      >
                        <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-[10.5px] font-bold block truncate max-w-[130px]"
                            title={item.kelurahan || item.kelompok?.kelurahan || "Coblong"}
                          >
                            📍 {item.kelurahan || item.kelompok?.kelurahan || "Coblong"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {item.kelompok ? (
                            <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg text-[10px] font-extrabold block truncate max-w-[130px]">
                              👥 {item.kelompok.name}
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold block truncate max-w-[130px]">
                              🌐 Global
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-extrabold text-slate-900 dark:text-slate-100 block mb-1">
                            {item.tahapMinggu}
                          </span>
                          {renderFaseBadge(item.fase || "Fase 1: Persiapan")}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 whitespace-nowrap">
                            <Calendar size={13} className="text-emerald-600 shrink-0" />
                            {item.tanggal}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            {item.bidangKegiatan && (
                              <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-md text-[10px] font-extrabold inline-block">
                                {item.bidangKegiatan}
                              </span>
                            )}
                            <div className="font-bold text-slate-900 dark:text-slate-100 leading-snug">
                              {item.kegiatanUtama}
                            </div>
                            <div className="text-[10.5px] text-slate-500 font-medium">
                              PIC: {item.picKeterangan || "-"}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 leading-relaxed text-[11.5px]">
                          {item.outputTarget}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {item.linkGoogleDrive ? (
                            <a
                              href={item.linkGoogleDrive}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-[10.5px] font-extrabold inline-flex items-center gap-1.5 transition shadow-2xs group-hover:border-emerald-400"
                              title="Buka folder dokumentasi di Google Drive"
                            >
                              <GoogleDriveIcon />
                              <span>Drive</span>
                              <ExternalLink size={11} className="opacity-70" />
                            </a>
                          ) : (
                            <span className="text-slate-400 text-[10.5px] italic">
                              Belum Disematkan
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {canManageTimeline && item.id ? (
                            <select
                              value={item.statusPelaksanaan || "BELUM_DIMULAI"}
                              onChange={(e) => handleQuickStatusChange(item.id, e.target.value)}
                              className={`px-2.5 py-1 rounded-full text-[10.5px] font-extrabold border outline-none cursor-pointer transition ${
                                item.statusPelaksanaan === "SEDANG_BERJALAN"
                                  ? "bg-emerald-500 text-white border-emerald-600 shadow-2xs font-extrabold"
                                  : item.statusPelaksanaan === "SELESAI"
                                  ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800"
                                  : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                              }`}
                            >
                              <option value="BELUM_DIMULAI">Belum Dimulai</option>
                              <option value="SEDANG_BERJALAN">Sedang Berjalan</option>
                              <option value="SELESAI">Selesai</option>
                            </select>
                          ) : (
                            renderStatusBadge(item.statusPelaksanaan)
                          )}
                        </td>
                        {canManageTimeline && (
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5 opacity-90 group-hover:opacity-100 transition">
                              <button
                                onClick={() => {
                                  setTimelineEditItem(item);
                                  setTimelineModalOpen(true);
                                }}
                                className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-lg transition cursor-pointer"
                                title="Edit Kegiatan"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                onClick={() => setTimelineDeleteId(item.id)}
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition cursor-pointer"
                                title="Hapus Kegiatan"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: KALENDER & AGENDA INTERAKTIF */}
      {activeMainTab === "KALENDER_AGENDA" && (
        <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-140px)] overflow-hidden bg-surface-container rounded-3xl border border-slate-200 dark:border-slate-800">
          {/* Canvas */}
          <main className="flex-1 overflow-hidden flex flex-col lg:flex-row bg-surface p-4 lg:p-6 gap-4 lg:gap-6 relative">
            {/* Calendar Section */}
            <div className="flex-1 min-h-[400px] lg:min-h-0 flex flex-col bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-outline-variant/50 overflow-hidden">
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
                {canManageSchedules && (
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
                    className={`bg-white dark:bg-slate-900 p-2 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/30 transition-all cursor-pointer group flex flex-col justify-between min-h-[90px] border border-transparent rounded-lg ${
                      !day.isCurrentMonth ? "opacity-40" : ""
                    } ${
                      isSelected
                        ? "ring-2 ring-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/60 font-bold shadow-sm z-10"
                        : isToday
                        ? "bg-blue-50/40 dark:bg-blue-950/40 border-blue-400 dark:border-blue-700 font-bold relative"
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
                              ? "text-blue-700 dark:text-blue-300 font-black"
                              : i % 7 >= 5
                              ? "text-red-500 dark:text-red-400"
                              : "text-slate-800 dark:text-slate-200"
                          }`}
                        >
                          {day.day}
                        </span>
                      </div>

                      {/* Clean Aggregated Activity Pills */}
                      <div className="flex flex-col gap-1">
                        {visibleSchedules.map((s, idx) => {
                          let colorCls = "bg-blue-50 dark:bg-sky-950/60 border-blue-200 dark:border-sky-800 text-blue-800 dark:text-sky-300";
                          const titleLower = s.title.toLowerCase();
                          const catLower = s.category.toLowerCase();
                          if (catLower.includes("pengangkutan") || titleLower.includes("pengangkutan"))
                            colorCls = "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300";
                          else if (catLower.includes("sosialisasi") || titleLower.includes("sosialisasi"))
                            colorCls = "bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300";
                          else if (catLower.includes("rapat") || titleLower.includes("rapat"))
                            colorCls = "bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300";

                          return (
                            <div
                              key={idx}
                              className={`border text-[10px] font-bold px-2 py-0.5 rounded-md truncate w-full shadow-2xs transition-transform flex items-center justify-between gap-1 ${colorCls}`}
                              title={`${s.title} (${s.count} kegiatan)`}
                            >
                              <span className="truncate">{s.title}</span>
                              {s.count > 1 && (
                                <span className="bg-white/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-1 py-0.2 rounded text-[9px] font-extrabold shrink-0">
                                  {s.count}x
                                </span>
                              )}
                            </div>
                          );
                        })}

                        {hiddenCount > 0 && (
                          <div className="text-[9px] font-extrabold text-emerald-800 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded-md text-center truncate">
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
        <aside className="w-full lg:w-[340px] max-h-[50vh] lg:max-h-none bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-outline-variant/50 flex flex-col shrink-0 overflow-hidden transition-all">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <CalendarCheck className="text-emerald-600" size={18} />
                Detail Agenda
              </h3>
              <button
                onClick={() => setIsGroupedView(!isGroupedView)}
                className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-emerald-700 hover:border-emerald-300 transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
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
                    <div className="mt-4 flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                        <CalendarDays size={24} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          Tidak ada kegiatan
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Belum ada agenda dijadwalkan pada tanggal ini.
                        </p>
                      </div>
                      {canManageSchedules && (
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
                        location: sch.location || "Wilayah Dampingan",
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
                            className={`border border-slate-200/80 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all overflow-hidden border-l-4 ${catTheme.border}`}
                          >
                            <div
                              onClick={() => count > 1 && toggleGroupExpand(groupKey)}
                              className={`p-3 flex flex-col gap-2 ${count > 1 ? "cursor-pointer hover:bg-slate-50/60 dark:bg-slate-800/60 dark:hover:bg-slate-800/60" : ""}`}
                            >
                              <div className="flex justify-between items-center">
                                <span className={`text-[10px] px-2 py-0.5 rounded border uppercase tracking-wider font-extrabold ${catTheme.badge}`}>
                                  {group.category}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
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
                                  <h4 className="text-[13px] font-extrabold text-slate-900 dark:text-slate-100 leading-snug">
                                    {group.title}
                                  </h4>
                                  <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1 mt-1">
                                    <MapPin size={12} className="text-slate-400" />
                                    {group.location}
                                  </p>
                                </div>

                                {count > 1 && (
                                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0">
                                    {count} Sesi
                                  </span>
                                )}
                              </div>

                              {/* Single item actions */}
                              {count === 1 && canManageSchedules && (
                                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 mt-1">
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
                              <div className="bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 p-2 flex flex-col gap-1.5">
                                <div className="text-[10px] font-extrabold text-slate-400 px-2 uppercase tracking-wider">
                                  Rincian Waktu Sesi ({count}):
                                </div>
                                {group.items.map((item, idx) => (
                                  <div
                                    key={item.id || idx}
                                    className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[11px] hover:border-emerald-300 transition-colors"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className={`w-1.5 h-1.5 rounded-full ${catTheme.dot}`}></div>
                                      <span className="font-bold text-slate-700 dark:text-slate-300">
                                        {item.time || safeFormatTime(item.date)}
                                      </span>
                                      <span className="text-slate-400">•</span>
                                      <span className="text-slate-500 truncate max-w-[120px]">
                                        {item.location || "Wilayah Dampingan"}
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
                  <div className="relative pl-3 space-y-3 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
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

                          <div className="p-3 border border-slate-200/80 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 hover:border-emerald-400 hover:shadow-sm transition-all relative">
                            {canManageSchedules && (
                              <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-slate-800/90 p-0.5 rounded-md shadow-2xs border border-slate-200/80 dark:border-slate-700">
                                <button
                                  onClick={(e) => handleEdit(schedule, e)}
                                  className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded"
                                  title="Edit"
                                >
                                  <Pencil size={13} />
                                </button>
                                <button
                                  onClick={(e) => handleDelete(schedule.id, e)}
                                  className="p-1 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-rose-950/60 rounded"
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
                              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                <Clock size={12} className="text-slate-400" />
                                {schedule.time || safeFormatTime(schedule.date)}
                              </span>
                            </div>

                            <h4 className="text-[13px] font-extrabold text-slate-900 dark:text-slate-100 leading-snug">
                              {schedule.title || "(tanpa judul)"}
                            </h4>
                            <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1 mt-1">
                              <MapPin size={12} className="text-slate-400" />
                              {schedule.location || "Wilayah Dampingan"}
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
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-[740px] max-w-full overflow-hidden flex flex-col transform transition-all duration-200 border border-slate-200 dark:border-slate-800 max-h-[90vh]">
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/80 dark:bg-slate-800/80">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                    {editId ? "Edit Jadwal Kegiatan" : "Buat Jadwal Kegiatan Baru"}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    {modalStep === 1
                      ? "Langkah 1/2: Penentuan Area Geofence (Presensi Lokasi)"
                      : "Langkah 2/2: Informasi Detail & Waktu Pelaksanaan"}
                  </p>
                </div>
                <button
                  className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
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
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1">
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
                            ? "bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-xs"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                        }`}
                      >
                        <span>🔵 Radius Lingkaran (Bulat)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setGeofenceMode("POLYGON")}
                        className={`flex-1 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          geofenceMode === "POLYGON"
                            ? "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                        }`}
                      >
                        <span>🟢 Polygon Kustom (Multi-Sudut)</span>
                      </button>
                    </div>

                    {/* Geofence Map */}
                    <div className="h-[280px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 relative z-0 shadow-inner">
                      <MapContainer
                        center={
                          formData.polygon.length > 0
                            ? formData.polygon[0]
                            : [-6.8915, 107.6107]
                        }
                        zoom={15}
                        style={{ height: "100%", width: "100%" }}
                      >
                        <ThemeTileLayer />
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
                      <div className="absolute bottom-3 right-3 z-[999] flex items-center gap-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs p-1 rounded-xl shadow-md border border-slate-200 dark:border-slate-800">
                        {geofenceMode === "POLYGON" && formData.polygon.length > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev: any) => ({
                                ...prev,
                                polygon: prev.polygon.slice(0, -1),
                              }))
                            }
                            className="px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 rounded-lg transition-colors cursor-pointer"
                          >
                            Hapus Titik Terakhir
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setFormData((prev: any) => ({ ...prev, polygon: [] }))}
                          className="px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                        >
                          Reset Peta
                        </button>
                      </div>
                    </div>

                    {/* Mode Specific Controls */}
                    {geofenceMode === "CIRCLE" ? (
                      <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl p-4 flex flex-col gap-3">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <label className="text-xs font-black text-slate-800 dark:text-slate-100">
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
                                className="w-20 h-7 text-center font-mono font-black bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-lg text-emerald-950 dark:text-emerald-100 text-xs outline-none focus:border-emerald-600 shadow-2xs"
                              />
                              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Meter</span>
                              <span className="bg-emerald-700 text-white px-2 py-0.5 rounded-md text-[11px] font-mono font-bold shadow-2xs">
                                {Number(formData.radius || 100) >= 1000
                                  ? `${(Number(formData.radius || 100) / 1000).toFixed(2)} km`
                                  : `${formData.radius || 100} m`}
                              </span>
                            </div>
                          </div>
                          <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
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
                            className="w-full h-2.5 bg-emerald-200 dark:bg-emerald-800 rounded-lg appearance-none cursor-pointer accent-emerald-700"
                          />
                          <div className="flex justify-between text-[10px] text-slate-400 font-bold font-mono px-0.5">
                            <span>50m</span>
                            <span>1 km</span>
                            <span>2.5 km</span>
                            <span>5 km (5000m)</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          <span className="text-[10px] font-black text-emerald-900 dark:text-emerald-300 uppercase mr-1">Preset Cepat:</span>
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
                                  : "bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-700/40 text-emerald-950 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-slate-700"
                              }`}
                            >
                              <span>📍</span>
                              <span>{preset.label}</span>
                            </button>
                          ))}
                        </div>

                        {/* Titik Pusat Koordinat */}
                        <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-between text-xs">
                          <span className="text-slate-700 dark:text-slate-300 font-semibold">
                            Titik Pusat:{" "}at:{" "}
                            {formData.polygon.length > 0 ? (
                              <strong className="font-mono text-slate-900 dark:text-slate-100">
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
                            className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-emerald-200 rounded-lg focus:outline-none focus:border-emerald-600"
                          />
                          <input
                            type="number"
                            step="any"
                            placeholder="Longitude (cth: 107.6107)"
                            value={manualLng}
                            onChange={(e) => setManualLng(e.target.value)}
                            className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-emerald-200 rounded-lg focus:outline-none focus:border-emerald-600"
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
                          <div className="max-h-[120px] overflow-y-auto rounded-lg border border-emerald-200 bg-white dark:bg-slate-900">
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
                                    <td className="px-2.5 py-1 font-mono text-slate-800 dark:text-slate-100">
                                      {Number(p[0]).toFixed(6)}
                                    </td>
                                    <td className="px-2.5 py-1 font-mono text-slate-800 dark:text-slate-100">
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
                      <label className="text-xs font-black text-slate-800 dark:text-slate-100">
                        Nama Kegiatan <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-600 w-full text-xs font-bold text-slate-800 dark:text-slate-100"
                        placeholder="Contoh: Sosialisasi Pemilahan Sampah Organik RW 03"
                      />
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-1 flex flex-col gap-1.5">
                        <label className="text-xs font-black text-slate-800 dark:text-slate-100">
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
                            className="pl-9 pr-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-600 w-full text-xs font-bold text-slate-800 dark:text-slate-100"
                          />
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col gap-1.5">
                        <label className="text-xs font-black text-slate-800 dark:text-slate-100">
                          Waktu Mulai <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Clock
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            size={16}
                          />
                          <input
                            type="time"
                            lang="id"
                            value={timeStart}
                            onChange={(e) => setTimeStart(e.target.value)}
                            className="pl-9 pr-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-600 w-full text-xs font-bold text-slate-800 dark:text-slate-100"
                          />
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col gap-1.5">
                        <label className="text-xs font-black text-slate-800 dark:text-slate-100">
                          Waktu Selesai <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Clock
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            size={16}
                          />
                          <input
                            type="time"
                            lang="id"
                            value={timeEnd}
                            onChange={(e) => setTimeEnd(e.target.value)}
                            className="pl-9 pr-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-600 w-full text-xs font-bold text-slate-800 dark:text-slate-100"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-black text-slate-800 dark:text-slate-100">
                        Kategori Kegiatan <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-600 w-full text-xs font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900"
                      >
                        <option value="Pengangkutan">Pengangkutan</option>
                        <option value="Sosialisasi">Sosialisasi</option>
                        <option value="Rapat">Rapat</option>
                        <option value="Monitoring">Monitoring Lapangan</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-black text-slate-800 dark:text-slate-100">
                        Kelompok KKN Terkait (Opsional)
                      </label>
                      <select
                        value={formData.kelompokId || ""}
                        onChange={(e) => setFormData({ ...formData, kelompokId: e.target.value || undefined })}
                        className="px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-600 w-full text-xs font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900"
                      >
                        <option value="">-- Semua Kelompok (Jadwal Global / Bersama) --</option>
                        {groups.map((g: any) => (
                          <option key={g.id} value={g.id}>
                            {g.name} ({g.kelurahan ? `Kel. ${g.kelurahan}` : "Wilayah Dampingan"})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-black text-slate-800 dark:text-slate-100">
                        Lokasi Deskriptif (Opsional)
                      </label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-600 w-full text-xs text-slate-800 dark:text-slate-100 font-medium"
                        placeholder="Contoh: Balai Pertemuan RW 04 Kelurahan Dago"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 flex justify-end gap-2.5">
                {modalStep === 1 ? (
                  <>
                    <button
                      type="button"
                      className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 rounded-xl transition-colors cursor-pointer"
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
                      className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 rounded-xl transition-colors cursor-pointer"
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

      {/* Timeline Modals */}
      <TimelineKknModal
        isOpen={timelineModalOpen}
        onClose={() => {
          setTimelineModalOpen(false);
          setTimelineEditItem(null);
        }}
        onSuccess={fetchTimelineList}
        editItem={timelineEditItem}
        groups={groups}
        defaultKelompokId={selectedScope !== "ALL" ? selectedScope : "GLOBAL"}
      />

      <TimelineImportModal
        isOpen={timelineImportModalOpen}
        onClose={() => setTimelineImportModalOpen(false)}
        onSuccess={fetchTimelineList}
        groups={groups}
        defaultKelompokId={selectedScope !== "ALL" ? selectedScope : "GLOBAL"}
      />

      <ConfirmModal
        isOpen={Boolean(timelineDeleteId)}
        onClose={() => setTimelineDeleteId(null)}
        onConfirm={handleConfirmDeleteTimeline}
        title="Hapus Kegiatan Linimasa"
        message="Apakah Anda yakin ingin menghapus kegiatan linimasa ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, Hapus Kegiatan"
        type="danger"
      />

      <ConfirmModal
        isOpen={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        onConfirm={handleResetOfficialAcuan}
        title="Reset ke Acuan Resmi 12 Pekan"
        message="Apakah Anda yakin ingin mengatur ulang linimasa global ke acuan resmi 12 pekan KKN UNIKOM Coblong 2026? Data kustom pada acuan global akan ditimpa."
        confirmText="Ya, Reset Acuan"
        type="warning"
      />
    </div>
  );
};

export default JadwalKegiatan;
