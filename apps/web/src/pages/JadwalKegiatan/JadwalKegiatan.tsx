import { Loader2, CalendarCheck, CalendarDays, Clock, ChevronLeft, ChevronRight, Plus, MapPin, X, Trash2, Pencil, ChevronDown, ChevronUp, Layers, List } from "lucide-react";
/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { useAuthStore } from "../../store/useAuthStore";
import { MapContainer, TileLayer, Marker, useMapEvents, Polygon, Polyline, Circle } from "react-leaflet";
import L from "leaflet";

// Fix default Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const LocationPickerMap: React.FC<{
  points: [number, number][];
  onChange: (points: [number, number][]) => void;
  radius: number;
}> = ({ points, onChange, radius }) => {
  useMapEvents({
    click(e) {
      onChange([...points, [e.latlng.lat, e.latlng.lng]]);
    },
  });

  return (
    <>
      {points.length === 1 && (
        <>
          <Marker position={points[0]} />
          <Circle center={points[0]} radius={radius} pathOptions={{ color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.2 }} />
        </>
      )}
      {points.length === 2 && (
        <>
          {points.map((p, i) => <Marker key={i} position={p} />)}
          <Polyline positions={points} pathOptions={{ color: "#3b82f6", dashArray: "4,4" }} />
        </>
      )}
      {points.length >= 3 && (
        <>
          {points.map((p, i) => <Marker key={i} position={p} />)}
          <Polygon positions={points} pathOptions={{ color: "#10b981", fillColor: "#10b981", fillOpacity: 0.3 }} />
        </>
      )}
    </>
  );
};

const JadwalKegiatan: React.FC = () => {
  const { user } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [editId, setEditId] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isGroupedView, setIsGroupedView] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

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
      const payload = {
        ...formData,
        date: formattedIsoDate,
        latitude: formData.polygon.length === 1 ? formData.polygon[0][0] : null,
        longitude: formData.polygon.length === 1 ? formData.polygon[0][1] : null,
        radius: formData.radius !== "" ? parseInt(String(formData.radius), 10) : 100,
        polygon: formData.polygon.length >= 3 ? formData.polygon : null,
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

    setFormData({
      title: schedule.title || "",
      date: formattedDate,
      time: schedule.time || "",
      category: schedule.category || "Pengangkutan",
      location: schedule.location || "",
      latitude: schedule.latitude || "",
      longitude: schedule.longitude || "",
      radius: schedule.radius || 100,
      polygon: schedule.polygon || (schedule.latitude && schedule.longitude ? [[schedule.latitude, schedule.longitude]] : []),
    });
    setModalStep(1);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Apakah Anda yakin ingin menghapus jadwal ini?")) return;
    
    try {
      await api.delete(`/schedules/${id}`);
      toast.success("Jadwal berhasil dihapus");
      fetchSchedules();
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.response?.data?.error || err.message || "Gagal menghapus jadwal";
      toast.error(errMsg);
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

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden -m-6 bg-surface-container">
      {/* Canvas */}
      <main className="flex-1 overflow-hidden flex bg-surface p-6 gap-6 relative">
        {/* Calendar Section */}
        <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-outline-variant/50 overflow-hidden">
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
            {["SUPER_ADMIN", "RW", "RT", "PETUGAS_RESIDU"].includes(user?.peran || "") && (
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
        <aside className="w-[340px] bg-white rounded-xl shadow-sm border border-outline-variant/50 flex flex-col shrink-0 overflow-hidden transition-all">
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
                      {["SUPER_ADMIN", "RW", "RT", "PETUGAS_RESIDU"].includes(user?.peran || "") && (
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
                              {count === 1 && user?.peran === "SUPER_ADMIN" && (
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
                                    {user?.peran === "SUPER_ADMIN" && (
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
                            {user?.peran === "SUPER_ADMIN" && (
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
          <div className="absolute inset-0 bg-on-surface/30 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-lg w-[480px] max-w-[90%] overflow-hidden flex flex-col transform transition-all duration-200">
              <div className="p-5 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-low/30">
                <h3 className="text-[18px] font-bold text-on-surface">{editId ? "Edit Jadwal Kegiatan" : "Buat Jadwal Baru"} - {modalStep === 1 ? "Marking Zona" : "Detail Kegiatan"}</h3>
                <button
                  className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-variant transition-colors"
                  onClick={() => { setIsModalOpen(false); setEditId(null); setFormData({ title: "", date: "", time: "", category: "Pengangkutan", location: "", latitude: "", longitude: "", radius: 100, polygon: [] }); }}
                >
                  <X />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh] flex flex-col gap-4">
                
                {modalStep === 1 ? (
                  <>
                    <div className="flex flex-col gap-2">
                      <p className="text-[13px] text-on-surface-variant mb-2">
                        Pilih zona kegiatan di peta:
                        <br />• <strong>1 Titik</strong> = Area Radius melingkar.
                        <br />• <strong>3 Titik atau lebih</strong> = Area Poligon kustom.
                      </p>
                      <div className="h-[280px] rounded-lg overflow-hidden border border-outline-variant z-0 relative">
                        <MapContainer center={[-6.8915, 107.6107]} zoom={14} style={{ height: "100%", width: "100%" }}>
                          <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                          <LocationPickerMap
                            points={formData.polygon || []}
                            onChange={(pts) => setFormData((prev: any) => ({ ...prev, polygon: pts }))}
                            radius={formData.radius || 100}
                          />
                        </MapContainer>
                        <button
                          onClick={() => setFormData((prev: any) => ({ ...prev, polygon: [] }))}
                          className="absolute bottom-4 right-4 z-[999] bg-white border border-outline-variant shadow-md text-[11px] font-bold text-on-surface-variant px-3 py-1.5 rounded-lg hover:bg-surface-container-low transition-colors"
                        >
                          Reset Titik
                        </button>
                      </div>
                      
                      {formData.polygon.length === 1 && (
                        <div className="flex flex-col gap-1.5 mt-2">
                          <label className="text-[12px] font-bold text-on-surface-variant">Radius Absensi (meter)</label>
                          <input
                            type="number"
                            value={formData.radius}
                            onChange={(e) => setFormData({ ...formData, radius: e.target.value })}
                            className="px-4 py-2 border border-outline-variant rounded-lg focus:outline-none focus:border-primary text-[14px] w-full"
                            placeholder="Contoh: 100"
                          />
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12px] font-bold text-on-surface-variant">
                        Nama Kegiatan <span className="text-error">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="px-4 py-2 border border-outline-variant rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full text-[14px]"
                        placeholder="Contoh: Sosialisasi Pengomposan"
                      />
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1 flex flex-col gap-1.5">
                        <label className="text-[12px] font-bold text-on-surface-variant">
                          Tanggal <span className="text-error">*</span>
                        </label>
                        <div className="relative">
                          <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                          <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="pl-10 pr-4 py-2 border border-outline-variant rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full text-[14px]"
                          />
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col gap-1.5">
                        <label className="text-[12px] font-bold text-on-surface-variant">
                          Waktu <span className="text-error">*</span>
                        </label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                          <input
                            type="time"
                            value={formData.time}
                            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                            className="pl-10 pr-4 py-2 border border-outline-variant rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full text-[14px]"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12px] font-bold text-on-surface-variant">
                        Kategori <span className="text-error">*</span>
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="px-4 py-2 border border-outline-variant rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full text-[14px] bg-white text-on-surface"
                      >
                        <option value="Pengangkutan">Pengangkutan</option>
                        <option value="Sosialisasi">Sosialisasi</option>
                        <option value="Rapat">Rapat</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12px] font-bold text-on-surface-variant">
                        Lokasi Deskriptif (Opsional)
                      </label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="px-4 py-2 border border-outline-variant rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full text-[14px]"
                        placeholder="Contoh: Balai RW 06"
                      />
                    </div>
                  </>
                )}
                
              </div>
              <div className="p-5 border-t border-outline-variant/30 bg-surface-container-lowest flex justify-end gap-3">
                {modalStep === 1 ? (
                  <>
                    <button
                      className="px-4 py-2 text-[14px] font-bold text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors"
                      onClick={() => { setIsModalOpen(false); setEditId(null); setFormData({ title: "", date: "", time: "", category: "Pengangkutan", location: "", latitude: "", longitude: "", radius: 100, polygon: [] }); }}
                    >
                      Batal
                    </button>
                    <button
                      className="px-4 py-2 text-[14px] font-bold bg-primary text-white hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={formData.polygon.length === 2 || formData.polygon.length === 0}
                      onClick={() => setModalStep(2)}
                      title={formData.polygon.length === 2 ? "Harus 1 titik (Radius) atau minimal 3 titik (Poligon)" : ""}
                    >
                      Lanjut Isi Detail
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="px-4 py-2 text-[14px] font-bold text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors"
                      onClick={() => setModalStep(1)}
                    >
                      Kembali
                    </button>
                    <button
                      className="px-4 py-2 text-[14px] font-bold bg-primary text-white hover:bg-primary/90 rounded-lg transition-colors"
                      onClick={handleSubmit}
                    >
                      {editId ? "Simpan Perubahan" : "Simpan Jadwal"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default JadwalKegiatan;
