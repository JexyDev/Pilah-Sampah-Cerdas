/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Developer Multi-Zone KKN Inspector & Collision/Overlap Detector + Interactive CRUD
 * Menampilkan seluruh zona presensi auto-generate & posko 50+ kelompok KKN secara simultan,
 * mendeteksi tabrakan/tumpang tindih (overlap) antar zona, mencocokkan kesesuaian posisi GPS mahasiswa,
 * dan menyediakan fitur CRUD interaktif untuk mengubah titik posko, radius geofence, poligon, serta jadwal kegiatan.
 * 
 * Strict Relational Integrity & Real-Time Client-Side Overlap Engine.
 */

import React, { useEffect, useState, useMemo } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  Circle,
  Polygon,
  Polyline,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import {
  Layers,
  AlertTriangle,
  CheckCircle2,
  Users,
  Search,
  RefreshCw,
  Building,
  ChevronRight,
  Sparkles,
  Compass,
  Radio,
  GraduationCap,
  AlertCircle,
  Pencil,
  Trash2,
  Save,
  SlidersHorizontal,
} from "lucide-react";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";
import api from "../../services/api";
import { ThemeTileLayer } from "../../components/common/ThemeTileLayer";
import { ConfirmModal } from "../../components/common/ConfirmModal";
import { sortKelompokList } from "../../utils/sortUtils";
import {
  KELURAHAN_GEODATA,
  CoblongGeo,
  createKknMhsIcon,
} from "../../constants/coblongGeoData";

// Fix Leaflet Default Icon in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Helper: Haversine distance in meters
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
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

// Helper: Ray-casting Point in Polygon
const isPointInPolygon = (lat: number, lng: number, polygon: [number, number][]): boolean => {
  let inside = false;
  const n = polygon.length;
  let j = n - 1;
  for (let i = 0; i < n; i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];
    const intersect = yi > lng !== yj > lng && lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
    j = i;
  }
  return inside;
};

// Map Controller for smooth flyTo / panTo
const MapController: React.FC<{
  center: [number, number];
  zoom: number;
}> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
};

// Generate distinct color per index using Golden Ratio Hue distribution
const getGroupColor = (index: number) => {
  const hue = (index * 137.5) % 360;
  return `hsl(${hue}, 80%, 45%)`;
};

// Dedicated Distinct Icon Generator for Posko KKN (Non-generic, completely different from trash bins / other facilities)
const createPoskoKknIcon = (
  status: "REGISTERED" | "UNREGISTERED",
  groupName: string,
  color: string = "#4f46e5",
  isOverlapping: boolean = false
) => {
  const isReg = status === "REGISTERED";
  // Extract number from groupName e.g. "Kelompok 01" -> "K01"
  const match = (groupName || "").match(/\d+/);
  const tag = match ? `K${match[0].padStart(2, "0")}` : (groupName.slice(0, 3).toUpperCase() || "KKN");

  const bgGrad = isReg
    ? `linear-gradient(135deg, ${color}, #1e1b4b)`
    : "linear-gradient(135deg, #f59e0b, #9a3412)";
  const borderColor = isOverlapping ? "#ef4444" : isReg ? "#ffffff" : "#fef08a";
  const borderStyle = isReg ? "solid" : "dashed";
  const badgeBg = isReg ? "#10b981" : "#f59e0b";
  const badgeIcon = isReg
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
    : `<span style="color: white; font-size: 9px; font-weight: 900; line-height: 1;">!</span>`;

  return L.divIcon({
    className: "custom-posko-kkn-pin",
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);">
        ${isOverlapping ? `<div style="position: absolute; inset: -4px; border-radius: 50%; background-color: #ef4444; opacity: 0.35; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : ""}
        
        <!-- Main Posko Head -->
        <div style="background: ${bgGrad}; border: 2px ${borderStyle} ${borderColor}; border-radius: 12px; box-shadow: 0 4px 14px rgba(0,0,0,0.4); width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; color: white; position: relative; z-index: 5;">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/>
            <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          </svg>
          
          <!-- Mini Verification / Warning Badge at top-right -->
          <div style="position: absolute; top: -5px; right: -5px; width: 15px; height: 15px; border-radius: 50%; background: ${badgeBg}; border: 1.5px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 4px rgba(0,0,0,0.3); z-index: 6;">
            ${badgeIcon}
          </div>
        </div>
        
        <!-- Downward Pointer Arrow -->
        <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 7px solid ${isReg ? color : '#f59e0b'}; margin-top: -1px; z-index: 4;"></div>

        <!-- Group Label Pill -->
        <div style="background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(4px); color: white; border: 1px solid rgba(255, 255, 255, 0.2); font-size: 8.5px; font-weight: 900; font-family: monospace; padding: 1px 5px; border-radius: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.3); margin-top: 1px; white-space: nowrap; z-index: 7;">
          ${tag}
        </div>
      </div>
    `,
    iconSize: [44, 52],
    iconAnchor: [22, 42],
    popupAnchor: [0, -42],
  });
};

// Interactive Geofence / Posko Picker Sub-Map component for Modal
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
      map.setView(points[0], 16);
    }
    const t1 = setTimeout(() => {
      map.invalidateSize();
      if (points && points.length > 0 && points[0] && !isNaN(points[0][0]) && !isNaN(points[0][1])) {
        map.setView(points[0], 16);
      }
    }, 200);
    return () => clearTimeout(t1);
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
            <Marker key={`poly-node-${i}`} position={p} />
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
                color: "#059669",
                fillColor: "#10b981",
                fillOpacity: 0.25,
                weight: 2.5,
              }}
            />
          )}
        </>
      )}
    </>
  );
};

export const ZonaInspectorPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialKelompokId = searchParams.get("kelompokId");

  // Master Data States (Strict Relational Binding by ID)
  const [kelompokList, setKelompokList] = useState<any[]>([]);
  const [poskoList, setPoskoList] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [studentLocations, setStudentLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterKelurahan, setFilterKelurahan] = useState("ALL");
  const [filterPoskoStatus, setFilterPoskoStatus] = useState<"ALL" | "REGISTERED" | "UNREGISTERED">("ALL");
  const [filterOverlapOnly, setFilterOverlapOnly] = useState(false);

  // Map Layer Visibility Switches
  const [showKelurahanBounds, setShowKelurahanBounds] = useState(true);
  const [showGeofenceCircles, setShowGeofenceCircles] = useState(true);
  const [showPoskoMarkers, setShowPoskoMarkers] = useState(true);
  const [showStudentGps, setShowStudentGps] = useState(true);
  const [showOverlapLines, setShowOverlapLines] = useState(true);

  // UI Active / Selection States
  const [selectedKelompokId, setSelectedKelompokId] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(CoblongGeo.CENTER);
  const [mapZoom, setMapZoom] = useState<number>(CoblongGeo.DEFAULT_ZOOM);
  const [activeTab, setActiveTab] = useState<"kelompok" | "overlap" | "mahasiswa">("kelompok");
  const [detailModalGroup, setDetailModalGroup] = useState<any | null>(null);

  // ─── CRUD MODAL STATES ───
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any | null>(null);
  const [editMode, setEditMode] = useState<"CIRCLE" | "POLYGON">("CIRCLE");
  const [editPoints, setEditPoints] = useState<[number, number][]>([[-6.8906, 107.615]]);
  const [editRadius, setEditRadius] = useState<number>(500);
  const [editPoskoForm, setEditPoskoForm] = useState({
    nama: "",
    alamat: "",
    keterangan: "",
  });
  const [savingAction, setSavingAction] = useState(false);
  const [deletePoskoTarget, setDeletePoskoTarget] = useState<{ id: string; nama?: string } | null>(null);
  const [isLegendOpen, setIsLegendOpen] = useState<boolean>(true);

  // Fetch all master data in parallel with strict ID-scoped queries
  const loadAllData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [kelompokRes, poskoRes, scheduleRes, studentLocRes] = await Promise.all([
        api.get("/kelompok?limit=0").catch(() => ({ data: { groups: [] } })),
        api.get("/posko-kkn").catch(() => ({ data: { data: [] } })),
        api.get("/schedules").catch(() => ({ data: { data: [] } })),
        api.get("/mahasiswa/lokasi-aktif").catch(() => ({ data: { data: [] } })),
      ]);

      const groups = kelompokRes.data?.groups || kelompokRes.data?.data || [];
      const poskos = poskoRes.data?.data || [];
      const scheds = scheduleRes.data?.data || [];
      const locs = studentLocRes.data?.data || [];

      setKelompokList(Array.isArray(groups) ? sortKelompokList(groups, (k: any) => k.name || "") : []);
      setPoskoList(Array.isArray(poskos) ? poskos : []);
      setSchedules(Array.isArray(scheds) ? scheds : []);
      setStudentLocations(Array.isArray(locs) ? locs : []);

      if (isManualRefresh) {
        toast.success("Data seluruh zona dan lokasi mahasiswa berhasil diperbarui!");
      }
    } catch (err: any) {
      console.error("[ZonaInspectorPage] Load data error:", err);
      toast.error("Gagal memuat data zona kelompok");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Map groups with their respective Posko, Geofence, and Students (Strict Relation by ID)
  const enrichedGroups = useMemo(() => {
    // 1. Map of ALL Poskos by Kelompok ID (Multi-Posko support)
    const poskoGroupMap = new Map<string, any[]>();
    poskoList.forEach((p) => {
      if (p && p.kelompokId) {
        const arr = poskoGroupMap.get(String(p.kelompokId)) || [];
        arr.push(p);
        poskoGroupMap.set(String(p.kelompokId), arr);
      }
    });

    // 2. Strict Map of Active Schedules by Kelompok ID (UUID)
    const scheduleMap = new Map<string, any>();
    schedules.forEach((s) => {
      if (s && s.kelompokId && s.isActive !== false) {
        scheduleMap.set(String(s.kelompokId), s);
      }
    });

    // 3. Strict Map of Active Student Locations by Student User ID
    const locMap = new Map<string, any>();
    studentLocations.forEach((l) => {
      const uId = l.studentId || l.userId;
      if (uId) {
        locMap.set(String(uId), l);
      }
    });

    return kelompokList.map((group, idx) => {
      const gId = String(group.id);
      const groupPoskos = poskoGroupMap.get(gId) || (group.poskoKkn ? [group.poskoKkn] : []);
      const primaryPosko = groupPoskos.find((p: any) => p.isUtama) || groupPoskos[0] || null;
      const activeSchedule = scheduleMap.get(gId) || null;

      // Determine primary center coordinate: 1. Posko Utama -> 2. Schedule -> 3. Kelurahan Centroid -> 4. Coblong Center
      let lat = CoblongGeo.CENTER[0];
      let lng = CoblongGeo.CENTER[1];
      let geofenceSource: "POSKO_RESMI" | "JADWAL_KEGIATAN" | "ESTIMASI_KELURAHAN" | "DEFAULT_COBLONG" = "DEFAULT_COBLONG";
      let radius = 500;
      let polygon: [number, number][] | null = null;

      if (primaryPosko && primaryPosko.latitude && primaryPosko.longitude) {
        lat = Number(primaryPosko.latitude);
        lng = Number(primaryPosko.longitude);
        geofenceSource = "POSKO_RESMI";
        if (primaryPosko.radius) radius = Number(primaryPosko.radius);
      } else if (activeSchedule && activeSchedule.latitude && activeSchedule.longitude) {
        lat = Number(activeSchedule.latitude);
        lng = Number(activeSchedule.longitude);
        geofenceSource = "JADWAL_KEGIATAN";
        if (activeSchedule.radius) radius = Number(activeSchedule.radius);
        if (activeSchedule.polygon && Array.isArray(activeSchedule.polygon) && activeSchedule.polygon.length >= 3) {
          polygon = activeSchedule.polygon.map((pt: any) => [Number(pt.lat ?? pt[0]), Number(pt.lng ?? pt[1])]);
        }
      } else if (group.kelurahan) {
        const kelKey = String(group.kelurahan).toUpperCase().replace(/[\s-]+/g, "_");
        if (KELURAHAN_GEODATA[kelKey]) {
          lat = KELURAHAN_GEODATA[kelKey].centroid[0];
          lng = KELURAHAN_GEODATA[kelKey].centroid[1];
          geofenceSource = "ESTIMASI_KELURAHAN";
        }
      }

      // Check students belonging strictly to this group: Inside if near ANY group posko or polygon
      const groupStudents = (group.students || []).map((st: any) => {
        const sUserId = String(st.userId || st.user?.id || st.id);
        const loc = locMap.get(sUserId) || null;
        let dist: number | null = null;
        let inZone = false;

        if (loc && loc.latitude && loc.longitude) {
          const sLat = Number(loc.latitude);
          const sLng = Number(loc.longitude);

          if (polygon && polygon.length >= 3) {
            inZone = isPointInPolygon(sLat, sLng, polygon);
            dist = calculateDistance(lat, lng, sLat, sLng);
          } else if (groupPoskos.length > 0) {
            let minDistance = Infinity;
            for (const gp of groupPoskos) {
              const gpLat = Number(gp.latitude);
              const gpLng = Number(gp.longitude);
              const gpRadius = gp.radius ? Number(gp.radius) : 500;
              const d = calculateDistance(gpLat, gpLng, sLat, sLng);
              if (d < minDistance) minDistance = d;
              if (d <= gpRadius) {
                inZone = true;
              }
            }
            dist = minDistance;
          } else {
            dist = calculateDistance(lat, lng, sLat, sLng);
            inZone = dist <= radius;
          }
        }

        return {
          ...st,
          location: loc,
          distanceToZoneMeters: dist,
          isInsideZone: inZone,
        };
      });

      const studentsWithGps = groupStudents.filter((s: any) => s.location);
      const studentsInsideZone = groupStudents.filter((s: any) => s.isInsideZone);

      return {
        ...group,
        index: idx,
        color: getGroupColor(idx),
        posko: primaryPosko,
        poskos: groupPoskos,
        activeSchedule,
        center: [lat, lng] as [number, number],
        radius,
        polygon,
        geofenceSource,
        hasRegisteredPosko: groupPoskos.length > 0,
        studentsDetailed: groupStudents,
        totalStudents: groupStudents.length,
        activeGpsStudentsCount: studentsWithGps.length,
        insideZoneCount: studentsInsideZone.length,
      };
    });
  }, [kelompokList, poskoList, schedules, studentLocations]);

  // Overlap / Collision Detection Engine across all pairs
  const overlapConflicts = useMemo(() => {
    const conflicts: Array<{
      groupA: any;
      groupB: any;
      distanceMeters: number;
      overlapAmountMeters: number;
      centerA: [number, number];
      centerB: [number, number];
      severity: "HIGH" | "MEDIUM" | "LOW";
    }> = [];

    for (let i = 0; i < enrichedGroups.length; i++) {
      for (let j = i + 1; j < enrichedGroups.length; j++) {
        const a = enrichedGroups[i];
        const b = enrichedGroups[j];

        const dist = calculateDistance(a.center[0], a.center[1], b.center[0], b.center[1]);
        const sumRadius = a.radius + b.radius;

        if (dist < sumRadius) {
          const overlapAmount = Math.round(sumRadius - dist);
          let severity: "HIGH" | "MEDIUM" | "LOW" = "LOW";
          if (dist < 50) severity = "HIGH"; // Titik pusat hampir bertumpukan
          else if (dist < 150) severity = "MEDIUM";

          conflicts.push({
            groupA: a,
            groupB: b,
            distanceMeters: Math.round(dist),
            overlapAmountMeters: overlapAmount,
            centerA: a.center,
            centerB: b.center,
            severity,
          });
        }
      }
    }

    return conflicts;
  }, [enrichedGroups]);

  // Set of group IDs that have at least one overlap conflict
  const overlappingGroupIds = useMemo(() => {
    const set = new Set<string>();
    overlapConflicts.forEach((c) => {
      set.add(String(c.groupA.id));
      set.add(String(c.groupB.id));
    });
    return set;
  }, [overlapConflicts]);

  // Filtered Groups for Sidebar & Map Focus
  const filteredGroups = useMemo(() => {
    return enrichedGroups.filter((g) => {
      // Kelurahan Filter
      if (filterKelurahan !== "ALL") {
        const gKel = (g.kelurahan || "").toUpperCase().replace(/[\s-]+/g, "_");
        const fKel = filterKelurahan.toUpperCase().replace(/[\s-]+/g, "_");
        if (gKel !== fKel) return false;
      }

      // Posko Status Filter
      if (filterPoskoStatus === "REGISTERED" && !g.hasRegisteredPosko) return false;
      if (filterPoskoStatus === "UNREGISTERED" && g.hasRegisteredPosko) return false;

      // Overlap Only Filter
      if (filterOverlapOnly && !overlappingGroupIds.has(String(g.id))) return false;

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = (g.name || "").toLowerCase().includes(query);
        const matchKel = (g.kelurahan || "").toLowerCase().includes(query);
        const matchDpl = (g.dpl?.name || g.dplNamaMentah || "").toLowerCase().includes(query);
        const matchPosko = (g.posko?.nama || g.posko?.alamat || "").toLowerCase().includes(query);
        if (!matchName && !matchKel && !matchDpl && !matchPosko) return false;
      }

      return true;
    });
  }, [enrichedGroups, filterKelurahan, filterPoskoStatus, filterOverlapOnly, searchQuery, overlappingGroupIds]);

  // Focus to a specific group
  const handleFocusGroup = (group: any) => {
    setSelectedKelompokId(group.id);
    setMapCenter(group.center);
    setMapZoom(16);
  };

  // Auto-focus jika dibuka dari Menu Posko via URL ?kelompokId=...
  useEffect(() => {
    if (initialKelompokId && enrichedGroups.length > 0) {
      const target = enrichedGroups.find((g) => String(g.id) === String(initialKelompokId));
      if (target) {
        setSelectedKelompokId(target.id);
        setMapCenter(target.center);
        setMapZoom(17);
        setDetailModalGroup(target);
      }
    }
  }, [initialKelompokId, enrichedGroups]);

  // Reset to full view
  const handleResetView = () => {
    setSelectedKelompokId(null);
    setMapCenter(CoblongGeo.CENTER);
    setMapZoom(CoblongGeo.DEFAULT_ZOOM);
  };

  // ─── OPEN CRUD MODAL ───
  const handleOpenEditModal = (group: any) => {
    setEditingGroup(group);
    setEditRadius(group.radius || 500);

    if (group.polygon && group.polygon.length >= 3) {
      setEditMode("POLYGON");
      setEditPoints(group.polygon);
    } else {
      setEditMode("CIRCLE");
      setEditPoints([group.center]);
    }

    setEditPoskoForm({
      nama: group.posko?.nama || `Posko KKN ${group.name}`,
      alamat: group.posko?.alamat || `Kelurahan ${group.kelurahan || "Coblong"}`,
      keterangan: group.posko?.keterangan || "",
    });

    setIsEditModalOpen(true);
  };

  // ─── SAVE POSKO KKN RESMI (UPSERT) ───
  const handleSavePosko = async () => {
    if (!editingGroup) return;
    if (!editPoints || editPoints.length === 0) {
      toast.error("Titik koordinat posko belum ditentukan");
      return;
    }

    setSavingAction(true);
    try {
      const lat = editPoints[0][0];
      const lng = editPoints[0][1];

      await api.post("/posko-kkn", {
        kelompokId: editingGroup.id,
        nama: editPoskoForm.nama.trim() || `Posko ${editingGroup.name}`,
        alamat: editPoskoForm.alamat.trim() || `Kel. ${editingGroup.kelurahan || "Coblong"}`,
        latitude: lat,
        longitude: lng,
        radius: editRadius,
        keterangan: editPoskoForm.keterangan || undefined,
      });

      // Update Schedule radius if active schedule exists
      if (editingGroup.activeSchedule?.id) {
        await api.put(`/schedules/${editingGroup.activeSchedule.id}`, {
          latitude: lat,
          longitude: lng,
          radius: editRadius,
          polygon: editMode === "POLYGON" ? editPoints : null,
        }).catch(() => {});
      }

      toast.success(`Posko & Geofence ${editingGroup.name} berhasil disimpan! Presensi otomatis mengikuti titik ini.`);
      setIsEditModalOpen(false);
      await loadAllData(false);
    } catch (err: any) {
      console.error("[handleSavePosko] error:", err);
      toast.error(err.response?.data?.message || "Gagal menyimpan Posko KKN");
    } finally {
      setSavingAction(false);
    }
  };

  // ─── DELETE POSKO KKN (RESET KE DEFAULT) ───
  const handlePromptDeletePosko = (kelompokId: string, nama?: string) => {
    setDeletePoskoTarget({ id: kelompokId, nama });
  };

  const handleConfirmDeletePosko = async () => {
    if (!deletePoskoTarget) return;
    setSavingAction(true);
    try {
      await api.delete(`/posko-kkn/${deletePoskoTarget.id}`);
      toast.success("Posko berhasil dihapus. Zona kembali ke estimasi default.");
      setIsEditModalOpen(false);
      if (detailModalGroup?.id === deletePoskoTarget.id) setDetailModalGroup(null);
      setDeletePoskoTarget(null);
      await loadAllData(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menghapus posko");
    } finally {
      setSavingAction(false);
    }
  };

  const [syncingDaily, setSyncingDaily] = useState(false);
  const handleSyncDailySchedules = async () => {
    setSyncingDaily(true);
    try {
      const res = await api.post("/schedules/sync-today");
      toast.success(res.data?.message || "Jadwal kegiatan hari ini berhasil disinkronkan untuk semua kelompok!");
      await loadAllData(false);
    } catch (err: any) {
      toast.error("Gagal sinkronisasi jadwal harian");
    } finally {
      setSyncingDaily(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 p-4 md:p-6 min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      {/* ─── HEADER BAR ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
            <Radio size={26} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                Portal Developer
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Multi-Zone Geofence &amp; Collision Inspector
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white mt-1">
              Inspeksi Geospatial Seluruh Zona KKN &amp; Overlap
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5 max-w-3xl">
              Pantau seluruh zona otomatis by system dan posko 50+ kelompok KKN secara simultan, verifikasi tabrakan antar zona, sesuaikan ukuran/radius, dan pastikan presensi mahasiswa otomatis mengikuti titik terbaru.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleSyncDailySchedules}
            disabled={syncingDaily}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition-all border border-indigo-200 dark:border-indigo-800 active:scale-95 disabled:opacity-50"
            title="Sinkronkan / Buat Otomatis Jadwal Seluruh Kelompok Hari Ini"
          >
            <Sparkles size={15} className={syncingDaily ? "animate-spin text-indigo-500" : "text-indigo-600"} />
            <span>{syncingDaily ? "Sinkron..." : "Sinkronkan Jadwal Hari Ini"}</span>
          </button>
          <button
            onClick={() => loadAllData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin text-emerald-500" : ""} />
            <span>{refreshing ? "Memuat..." : "Refresh Live"}</span>
          </button>
          <button
            onClick={handleResetView}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all active:scale-95"
          >
            <Compass size={15} />
            <span>Reset Peta Coblong</span>
          </button>
        </div>
      </div>

      {/* ─── KPI & METRICS STATS BAR ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Kelompok */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Kelompok</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{enrichedGroups.length}</h3>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Semua Kelurahan Coblong</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
            <Building size={20} />
          </div>
        </div>

        {/* Posko Terdaftar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Titik Posko</p>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {poskoList.length}
            </h3>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">
              {enrichedGroups.filter((g) => g.hasRegisteredPosko).length} / {enrichedGroups.length} Kelompok Ter-cover
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={20} />
          </div>
        </div>

        {/* Posko Belum Dibuat */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Kelompok Tanpa Posko</p>
            <h3 className="text-2xl font-black text-amber-500 dark:text-amber-400 mt-0.5">
              {enrichedGroups.filter((g) => !g.hasRegisteredPosko).length}
            </h3>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">Memakai Estimasi Default</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <AlertCircle size={20} />
          </div>
        </div>

        {/* Zona Overlap / Tabrakan */}
        <div className={`bg-white dark:bg-slate-900 p-4 rounded-2xl border shadow-xs flex items-center justify-between transition-colors ${
          overlapConflicts.length > 0
            ? "border-rose-300 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20"
            : "border-slate-200 dark:border-slate-800"
        }`}>
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Zona Overlap / Nabrak</p>
            <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5">{overlapConflicts.length}</h3>
            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">
              {overlapConflicts.length > 0 ? "⚠️ Perlu Penyesuaian Zona" : "✅ Bersih Tanpa Tabrakan"}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <AlertTriangle size={20} />
          </div>
        </div>

        {/* Mahasiswa Terpantau */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Live GPS Mahasiswa</p>
            <h3 className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-0.5">
              {studentLocations.length}
            </h3>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
              {enrichedGroups.reduce((acc, g) => acc + g.insideZoneCount, 0)} Mahasiswa di Zona
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Users size={20} />
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT: MAP & SIDE PANEL ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT / CENTER: INTERACTIVE MAP CANVAS (8 COLS) */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          {/* Map Layer Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200">
              <Layers size={16} className="text-emerald-500" />
              <span>Layer Peta:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Toggle Kelurahan Bounds */}
              <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer font-medium text-[11px]">
                <input
                  type="checkbox"
                  checked={showKelurahanBounds}
                  onChange={(e) => setShowKelurahanBounds(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                />
                <span>Batas Kelurahan</span>
              </label>

              {/* Toggle Geofence Circles */}
              <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer font-medium text-[11px]">
                <input
                  type="checkbox"
                  checked={showGeofenceCircles}
                  onChange={(e) => setShowGeofenceCircles(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                />
                <span>Zona Geofence ({enrichedGroups.length})</span>
              </label>

              {/* Toggle Posko Markers */}
              <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer font-medium text-[11px]">
                <input
                  type="checkbox"
                  checked={showPoskoMarkers}
                  onChange={(e) => setShowPoskoMarkers(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                />
                <span>Marker Posko KKN</span>
              </label>

              {/* Toggle Student GPS */}
              <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer font-medium text-[11px]">
                <input
                  type="checkbox"
                  checked={showStudentGps}
                  onChange={(e) => setShowStudentGps(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                />
                <span>GPS Mahasiswa ({studentLocations.length})</span>
              </label>

              {/* Toggle Overlap Lines */}
              <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 cursor-pointer font-medium text-[11px]">
                <input
                  type="checkbox"
                  checked={showOverlapLines}
                  onChange={(e) => setShowOverlapLines(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500 w-3.5 h-3.5"
                />
                <span>Garis Tabrakan ({overlapConflicts.length})</span>
              </label>
            </div>
          </div>

          {/* Leaflet Map Canvas Container */}
          <div className="relative w-full h-[620px] rounded-3xl overflow-hidden border-2 border-slate-200 dark:border-slate-800 shadow-lg bg-slate-900">
            {loading ? (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm text-white gap-3">
                <RefreshCw size={32} className="animate-spin text-emerald-400" />
                <p className="text-sm font-semibold tracking-wide">Memuat peta geospatial seluruh kelompok...</p>
              </div>
            ) : null}

            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              scrollWheelZoom={true}
              className="w-full h-full z-10"
              style={{ minHeight: "100%", width: "100%" }}
            >
              <ThemeTileLayer />
              <MapController center={mapCenter} zoom={mapZoom} />

              {/* LAYER 1: Official Kelurahan Boundary Polygons */}
              {showKelurahanBounds &&
                Object.values(KELURAHAN_GEODATA).map((kel) => (
                  <Polygon
                    key={`boundary-${kel.id}`}
                    positions={kel.bounds}
                    pathOptions={{
                      color: kel.color,
                      weight: 2,
                      dashArray: "4, 6",
                      fillOpacity: 0.06,
                    }}
                  >
                    <Tooltip sticky direction="center" className="custom-leaflet-tooltip font-bold text-xs">
                      Kel. {kel.name} ({kel.rwCount} RW)
                    </Tooltip>
                  </Polygon>
                ))}

              {/* LAYER 2: Geofence Zones for All Groups */}
              {showGeofenceCircles &&
                filteredGroups.map((group) => {
                  const isSelected = selectedKelompokId === group.id;
                  const isOverlapping = overlappingGroupIds.has(String(group.id));
                  const circleColor = isOverlapping ? "#ef4444" : group.color;

                  return (
                    <React.Fragment key={`geofence-${group.id}`}>
                      {/* Polygon Geofence if exists */}
                      {group.polygon && group.polygon.length >= 3 ? (
                        <Polygon
                          positions={group.polygon}
                          pathOptions={{
                            color: circleColor,
                            weight: isSelected ? 3.5 : 2,
                            fillColor: circleColor,
                            fillOpacity: isSelected ? 0.35 : 0.18,
                            dashArray: group.hasRegisteredPosko ? undefined : "6, 6",
                          }}
                          eventHandlers={{
                            click: () => handleFocusGroup(group),
                          }}
                        >
                          <Popup>
                            <div className="p-1 min-w-[230px] text-xs font-sans">
                              <div className="flex items-center gap-1.5 font-black text-slate-800 text-sm">
                                <span>{group.name}</span>
                                {isOverlapping && (
                                  <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 font-bold text-[9px]">
                                    OVERLAP
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-500 text-[11px] mt-0.5">
                                Kel. {group.kelurahan || "Coblong"} • Poligon Geofence
                              </p>
                              <div className="mt-2 pt-2 border-t border-slate-100 space-y-1">
                                <p><strong>DPL:</strong> {group.dpl?.name || group.dplNamaMentah || "-"}</p>
                                <p><strong>Posko:</strong> {group.posko?.nama || "Belum Didaftarkan"}</p>
                                <p><strong>Anggota:</strong> {group.totalStudents} Mahasiswa ({group.insideZoneCount} di zona)</p>
                              </div>
                              <div className="mt-2.5 pt-2 border-t border-slate-100 flex gap-1.5">
                                <button
                                  onClick={() => handleOpenEditModal(group)}
                                  className="flex-1 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10.5px] flex items-center justify-center gap-1"
                                >
                                  <Pencil size={12} />
                                  <span>Ubah Zona</span>
                                </button>
                                <button
                                  onClick={() => setDetailModalGroup(group)}
                                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10.5px]"
                                >
                                  Detail
                                </button>
                              </div>
                            </div>
                          </Popup>
                        </Polygon>
                      ) : group.poskos && group.poskos.length > 1 ? (
                        /* Multi-Posko Circle Radius Geofences */
                        group.poskos.map((gp: any, pIdx: number) => {
                          const gpLat = Number(gp.latitude);
                          const gpLng = Number(gp.longitude);
                          const gpRadius = gp.radius ? Number(gp.radius) : 500;
                          return (
                            <Circle
                              key={`group-circle-${group.id}-posko-${gp.id || pIdx}`}
                              center={[gpLat, gpLng]}
                              radius={gpRadius}
                              pathOptions={{
                                color: circleColor,
                                weight: isSelected ? 3.5 : isOverlapping ? 2.5 : 1.8,
                                fillColor: circleColor,
                                fillOpacity: isSelected ? 0.35 : isOverlapping ? 0.22 : 0.15,
                              }}
                              eventHandlers={{
                                click: () => handleFocusGroup(group),
                              }}
                            >
                              <Popup>
                                <div className="p-1 min-w-[240px] text-xs font-sans">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-black text-slate-900 text-sm">{group.name}</span>
                                    <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-extrabold text-[9px]">
                                      {gp.isUtama ? "POSKO UTAMA" : `POSKO SATELIT #${pIdx + 1}`}
                                    </span>
                                  </div>
                                  <p className="text-slate-500 text-[11px] mt-0.5 font-medium">
                                    {gp.nama} • Radius {gpRadius}m
                                  </p>
                                  <div className="mt-2 pt-1.5 border-t border-slate-100 space-y-1 text-slate-700">
                                    <p><span className="font-semibold text-slate-500">Alamat:</span> {gp.alamat || "-"}</p>
                                    <p><span className="font-semibold text-slate-500">DPL:</span> {group.dpl?.name || group.dplNamaMentah || "-"}</p>
                                  </div>
                                </div>
                              </Popup>
                              <Tooltip direction="top" offset={[0, -10]} opacity={0.9} className="custom-leaflet-tooltip font-bold text-[10px]">
                                {group.name} ({gp.nama})
                              </Tooltip>
                            </Circle>
                          );
                        })
                      ) : (
                        /* Single Circle Radius Geofence */
                        <Circle
                          center={group.center}
                          radius={group.radius}
                          pathOptions={{
                            color: circleColor,
                            weight: isSelected ? 3.5 : isOverlapping ? 2.5 : 1.8,
                            fillColor: circleColor,
                            fillOpacity: isSelected ? 0.35 : isOverlapping ? 0.22 : 0.15,
                            dashArray: group.hasRegisteredPosko ? undefined : "5, 6",
                          }}
                          eventHandlers={{
                            click: () => handleFocusGroup(group),
                          }}
                        >
                          <Popup>
                            <div className="p-1 min-w-[240px] text-xs font-sans">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-black text-slate-900 text-sm">{group.name}</span>
                                {isOverlapping ? (
                                  <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-extrabold text-[9px]">
                                    ⚠️ OVERLAP
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-extrabold text-[9px]">
                                    ZONA AMAN
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-500 text-[11px] mt-0.5 font-medium">
                                Kel. {group.kelurahan || "Coblong"} • Radius {group.radius}m
                              </p>

                              <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1 text-slate-700">
                                <p><span className="font-semibold text-slate-500">Status Titik:</span> {
                                  group.geofenceSource === "POSKO_RESMI" ? "🟢 Posko Resmi" : "🟡 Default Kelurahan/Coblong"
                                }</p>
                                <p><span className="font-semibold text-slate-500">DPL:</span> {group.dpl?.name || group.dplNamaMentah || "-"}</p>
                                <p><span className="font-semibold text-slate-500">Posko:</span> {group.posko?.nama || "Belum Ada (Menunggu Mahasiswa)"}</p>
                                <p><span className="font-semibold text-slate-500">Mahasiswa:</span> {group.insideZoneCount} / {group.totalStudents} di zona</p>
                              </div>

                              <div className="mt-3 pt-2 border-t border-slate-100 flex gap-1.5">
                                <button
                                  onClick={() => handleOpenEditModal(group)}
                                  className="flex-1 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10.5px] flex items-center justify-center gap-1 shadow-xs"
                                >
                                  <Pencil size={12} />
                                  <span>Ubah Posko / Zona</span>
                                </button>
                                <button
                                  onClick={() => setDetailModalGroup(group)}
                                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10.5px]"
                                >
                                  Detail
                                </button>
                              </div>
                            </div>
                          </Popup>
                          <Tooltip direction="top" offset={[0, -10]} opacity={0.9} className="custom-leaflet-tooltip font-bold text-[10px]">
                            {group.name} {isOverlapping ? "⚠️ (Overlap)" : ""}
                          </Tooltip>
                        </Circle>
                      )}
                    </React.Fragment>
                  );
                })}

              {/* LAYER 3: Dedicated Distinct Posko KKN Pin Markers (Multi-Posko support) */}
              {showPoskoMarkers &&
                filteredGroups.flatMap((group) => {
                  const isOverlapping = overlappingGroupIds.has(String(group.id));
                  const poskoStatus = group.hasRegisteredPosko ? "REGISTERED" : "UNREGISTERED";
                  const poskoListToRender = group.poskos && group.poskos.length > 0 
                    ? group.poskos 
                    : [{ id: `default-${group.id}`, isDefault: true, latitude: group.center[0], longitude: group.center[1], nama: "Estimasi Default Kelurahan", isUtama: true }];

                  return poskoListToRender.map((poskoItem: any, pIdx: number) => {
                    const lat = Number(poskoItem.latitude);
                    const lng = Number(poskoItem.longitude);
                    const isMulti = !poskoItem.isUtama && poskoListToRender.length > 1;

                    return (
                      <Marker
                        key={`posko-marker-${group.id}-${poskoItem.id || pIdx}`}
                        position={[lat, lng]}
                        icon={createPoskoKknIcon(
                          poskoStatus,
                          `${group.name}${isMulti ? ` (Posko ${pIdx + 1})` : ""}`,
                          group.color,
                          isOverlapping
                        )}
                        eventHandlers={{
                          click: () => handleFocusGroup(group),
                        }}
                      >
                        <Popup>
                          <div className="p-1 min-w-[220px] text-xs">
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="font-bold text-slate-900 text-sm block">{group.name}</span>
                              {poskoListToRender.length > 1 && (
                                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-indigo-100 text-indigo-800">
                                  {poskoItem.isUtama ? "Posko Utama" : `Posko ${pIdx + 1}`}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 block mb-1.5">
                              {group.hasRegisteredPosko ? `📍 ${poskoItem.nama || "Posko KKN Resmi"}` : "⚠️ Posko Belum Didaftarkan (Titik Default)"}
                            </span>
                            {group.hasRegisteredPosko ? (
                              <div className="space-y-1 text-slate-600 text-[11px]">
                                <p><strong>Nama Posko:</strong> {poskoItem.nama}</p>
                                <p><strong>Alamat:</strong> {poskoItem.alamat || `Kelurahan ${group.kelurahan}`}</p>
                                <p><strong>Koordinat:</strong> {lat.toFixed(5)}, {lng.toFixed(5)}</p>
                                <p><strong>Radius Geofence:</strong> {poskoItem.radius || 150}m</p>
                              </div>
                            ) : (
                              <p className="text-amber-600 font-medium text-[11px]">
                                Mahasiswa kelompok ini belum menentukan titik posko pada aplikasi.
                              </p>
                            )}
                            <div className="mt-2 pt-2 border-t border-slate-100">
                              <button
                                onClick={() => handleOpenEditModal(group)}
                                className="w-full py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] flex items-center justify-center gap-1"
                              >
                                <Pencil size={11} />
                                <span>Ubah / Set Titik Posko</span>
                              </button>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  });
                })}

              {/* LAYER 4: Student Live GPS Markers */}
              {showStudentGps &&
                filteredGroups.flatMap((group) =>
                  group.studentsDetailed
                    .filter((s: any) => s.location && s.location.latitude && s.location.longitude)
                    .map((s: any) => {
                      const lat = Number(s.location.latitude);
                      const lng = Number(s.location.longitude);
                      const studentName = s.user?.name || s.name || "Mahasiswa";

                      return (
                        <Marker
                          key={`student-gps-${s.id}-${s.userId}`}
                          position={[lat, lng]}
                          icon={createKknMhsIcon(s.isInsideZone ? "PRESENT" : "out_radius")}
                        >
                          <Popup>
                            <div className="p-1 min-w-[210px] text-xs">
                              <div className="flex items-center gap-1.5">
                                <GraduationCap size={15} className="text-emerald-600" />
                                <span className="font-bold text-slate-900 text-sm">{studentName}</span>
                              </div>
                              <p className="text-slate-500 text-[10.5px]">
                                NIM: {s.nim || "-"} • {s.jurusan || "-"}
                              </p>
                              <div className="mt-2 pt-1.5 border-t border-slate-100 space-y-1 text-[11px]">
                                <p><strong>Kelompok:</strong> {group.name}</p>
                                <p>
                                  <strong>Status Zona:</strong>{" "}
                                  {s.isInsideZone ? (
                                    <span className="text-emerald-600 font-bold">🟢 Di Dalam Zona</span>
                                  ) : (
                                    <span className="text-amber-600 font-bold">
                                      ⚠️ Di Luar Zona ({Math.round(s.distanceToZoneMeters || 0)}m dari posko)
                                    </span>
                                  )}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  Last Ping: {new Date(s.location.recordedAt || s.location.createdAt).toLocaleTimeString("id-ID")}
                                </p>
                              </div>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })
                )}

              {/* LAYER 5: Overlap / Collision Visual Connectors */}
              {showOverlapLines &&
                overlapConflicts.map((c, idx) => (
                  <React.Fragment key={`overlap-conn-${idx}`}>
                    <Polyline
                      positions={[c.centerA, c.centerB]}
                      pathOptions={{
                        color: "#ef4444",
                        weight: 2.5,
                        dashArray: "6, 6",
                        opacity: 0.85,
                      }}
                    >
                      <Tooltip sticky className="custom-leaflet-tooltip font-bold text-[10px] text-rose-700">
                        ⚠️ Overlap: {c.groupA.name} ⚔️ {c.groupB.name} (Saling Berjarak {c.distanceMeters}m)
                      </Tooltip>
                    </Polyline>
                  </React.Fragment>
                ))}
            </MapContainer>

            {/* Map Legend Overlay (Collapsible on Mobile) */}
            <div className="absolute bottom-4 left-4 z-20 pointer-events-auto">
              {isLegendOpen ? (
                <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl text-xs max-w-xs animate-fade-in">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <span className="font-extrabold text-slate-800 dark:text-slate-200 text-[11px] uppercase tracking-wider">
                      Legenda Peta
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsLegendOpen(false)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition"
                      title="Sembunyikan Legenda"
                    >
                      ✕ Tutup
                    </button>
                  </div>
                  <div className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border border-white shadow-xs shrink-0"></span>
                      <span>Zona Geofence Aman / Mandiri</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full bg-rose-500 border border-white shadow-xs shrink-0"></span>
                      <span>Zona Overlap / Bertabrakan</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded bg-indigo-600 border border-white shadow-xs shrink-0"></span>
                      <span>Posko Resmi Terverifikasi (🟢)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded bg-amber-500 border border-dashed border-white shadow-xs shrink-0"></span>
                      <span>Posko Belum Didaftarkan (🟡)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shrink-0"></span>
                      <span>Mahasiswa Di Dalam Zona (GPS)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full bg-amber-500 shrink-0"></span>
                      <span>Mahasiswa Di Luar Zona (GPS)</span>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsLegendOpen(true)}
                  className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg text-[11px] font-extrabold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition"
                >
                  <Layers size={13} className="text-emerald-600" />
                  <span>Legenda Peta</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: INSPECTION DRAWER & CONFLICT AUDIT (4 COLS) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Filter & Search Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari kelompok, DPL, atau alamat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Kelurahan</label>
                <select
                  value={filterKelurahan}
                  onChange={(e) => setFilterKelurahan(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                >
                  <option value="ALL">Semua Kelurahan</option>
                  <option value="DAGO">Dago</option>
                  <option value="SEKELOA">Sekeloa</option>
                  <option value="SADANG_SERANG">Sadang Serang</option>
                  <option value="LEBAK_GEDE">Lebak Gede</option>
                  <option value="LEBAK_SILIWANGI">Lebak Siliwangi</option>
                  <option value="CIPAGANTI">Cipaganti</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Status Posko</label>
                <select
                  value={filterPoskoStatus}
                  onChange={(e: any) => setFilterPoskoStatus(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                >
                  <option value="ALL">Semua Posko</option>
                  <option value="REGISTERED">🟢 Sudah Ada Posko</option>
                  <option value="UNREGISTERED">🟡 Belum Ada Posko</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 cursor-pointer text-xs text-rose-700 dark:text-rose-300 font-bold">
              <input
                type="checkbox"
                checked={filterOverlapOnly}
                onChange={(e) => setFilterOverlapOnly(e.target.checked)}
                className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
              />
              <span>Filter Hanya Kelompok yang Overlap ({overlapConflicts.length})</span>
            </label>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab("kelompok")}
              className={`flex-1 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
                activeTab === "kelompok"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Kelompok ({filteredGroups.length})
            </button>
            <button
              onClick={() => setActiveTab("overlap")}
              className={`flex-1 py-1.5 text-xs font-extrabold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "overlap"
                  ? "bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <span>Tabrakan</span>
              {overlapConflicts.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[9.5px]">
                  {overlapConflicts.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("mahasiswa")}
              className={`flex-1 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
                activeTab === "mahasiswa"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              GPS Mhs ({studentLocations.length})
            </button>
          </div>

          {/* TAB 1: Kelompok List */}
          {activeTab === "kelompok" && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-3 max-h-[500px] overflow-y-auto space-y-2.5 custom-scrollbar">
              {filteredGroups.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  Tidak ada kelompok yang sesuai filter.
                </div>
              ) : (
                filteredGroups.map((group) => {
                  const isSelected = selectedKelompokId === group.id;
                  const isOverlapping = overlappingGroupIds.has(String(group.id));

                  return (
                    <div
                      key={`card-${group.id}`}
                      onClick={() => handleFocusGroup(group)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-xs"
                          : isOverlapping
                          ? "border-rose-200 dark:border-rose-900/50 hover:border-rose-400 bg-rose-50/20 dark:bg-rose-950/10"
                          : "border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-700 bg-slate-50/50 dark:bg-slate-800/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: group.color }}
                            />
                            <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">
                              {group.name}
                            </h4>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Kel. {group.kelurahan || "Coblong"} • DPL: {group.dpl?.name || group.dplNamaMentah || "-"}
                          </p>
                        </div>

                        {/* Status Badges */}
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {group.hasRegisteredPosko ? (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[9.5px]">
                              🟢 Posko Ada
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold text-[9.5px]">
                              🟡 Default Geo
                            </span>
                          )}

                          {isOverlapping && (
                            <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold text-[9.5px]">
                              ⚠️ Overlap
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Footer Info & Action */}
                      <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[10.5px]">
                        <span className="text-slate-500 font-medium">
                          {group.insideZoneCount} / {group.totalStudents} Mahasiswa di Zona
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditModal(group);
                            }}
                            className="px-2 py-1 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold hover:bg-indigo-100 transition flex items-center gap-1"
                          >
                            <Pencil size={11} />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDetailModalGroup(group);
                            }}
                            className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-0.5"
                          >
                            <span>Detail</span>
                            <ChevronRight size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: Overlap / Collision Conflicts */}
          {activeTab === "overlap" && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-3 max-h-[500px] overflow-y-auto space-y-3 custom-scrollbar">
              {overlapConflicts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
                  <CheckCircle2 size={36} className="text-emerald-500 mb-2" />
                  <p className="font-bold text-slate-700 dark:text-slate-300 text-xs">Semua Zona Bersih</p>
                  <p className="text-[11px] text-slate-500 mt-1">Tidak ditemukan irisan / tabrakan geofence antar kelompok.</p>
                </div>
              ) : (
                overlapConflicts.map((c, idx) => (
                  <div
                    key={`conflict-card-${idx}`}
                    className="p-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-extrabold text-[9.5px]">
                        {c.severity === "HIGH" ? "🚨 KRITIS (Jarak < 50m)" : "⚠️ OVERLAP GEOFENCE"}
                      </span>
                      <span className="text-[10px] font-bold text-rose-600">
                        Irisan ~{c.overlapAmountMeters}m
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between gap-2 text-xs">
                      <div
                        onClick={() => handleFocusGroup(c.groupA)}
                        className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex-1 cursor-pointer hover:border-emerald-500"
                      >
                        <p className="font-black text-slate-800 dark:text-slate-100">{c.groupA.name}</p>
                        <p className="text-[10px] text-slate-500">Kel. {c.groupA.kelurahan}</p>
                      </div>

                      <span className="text-rose-500 font-bold">⚔️</span>

                      <div
                        onClick={() => handleFocusGroup(c.groupB)}
                        className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex-1 cursor-pointer hover:border-emerald-500"
                      >
                        <p className="font-black text-slate-800 dark:text-slate-100">{c.groupB.name}</p>
                        <p className="text-[10px] text-slate-500">Kel. {c.groupB.kelurahan}</p>
                      </div>
                    </div>

                    <div className="mt-2 text-[10.5px] text-slate-600 dark:text-slate-300">
                      Jarak antar titik pusat: <strong>{c.distanceMeters} meter</strong> (Radius A: {c.groupA.radius}m, Radius B: {c.groupB.radius}m).
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: Student Live GPS Inspector */}
          {activeTab === "mahasiswa" && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-3 max-h-[500px] overflow-y-auto space-y-2 custom-scrollbar">
              {studentLocations.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  Belum ada mahasiswa yang mengirimkan ping lokasi GPS aktif hari ini.
                </div>
              ) : (
                enrichedGroups.flatMap((g) =>
                  g.studentsDetailed
                    .filter((s: any) => s.location)
                    .map((s: any) => (
                      <div
                        key={`mhs-row-${s.id}`}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-xs flex items-center justify-between gap-2"
                      >
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">
                            {s.user?.name || s.name}
                          </p>
                          <p className="text-[10.5px] text-slate-500">
                            {g.name} • NIM: {s.nim || "-"}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          {s.isInsideZone ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold text-[9.5px]">
                              🟢 Di Dalam Zona
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-extrabold text-[9.5px]">
                              ⚠️ Luar Zona ({Math.round(s.distanceToZoneMeters || 0)}m)
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── GROUP DETAIL INSPECTOR MODAL ─── */}
      {detailModalGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: detailModalGroup.color }}
                />
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {detailModalGroup.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Kelurahan {detailModalGroup.kelurahan || "Coblong"} • DPL: {detailModalGroup.dpl?.name || detailModalGroup.dplNamaMentah || "-"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetailModalGroup(null)}
                className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar text-xs">
              {/* Posko Section */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
                    Data Posko KKN
                  </span>
                  <button
                    onClick={() => {
                      setDetailModalGroup(null);
                      handleOpenEditModal(detailModalGroup);
                    }}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-xs"
                  >
                    <Pencil size={12} />
                    <span>Ubah Posko &amp; Geofence</span>
                  </button>
                </div>

                {detailModalGroup.posko ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700 dark:text-slate-300">
                    <div>
                      <p className="text-[10.5px] text-slate-400 font-bold">NAMA POSKO</p>
                      <p className="font-bold text-slate-900 dark:text-white">{detailModalGroup.posko.nama}</p>
                    </div>
                    <div>
                      <p className="text-[10.5px] text-slate-400 font-bold">ALAMAT</p>
                      <p className="font-medium">{detailModalGroup.posko.alamat}</p>
                    </div>
                    <div>
                      <p className="text-[10.5px] text-slate-400 font-bold">KOORDINAT GPS</p>
                      <p className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        {detailModalGroup.posko.latitude}, {detailModalGroup.posko.longitude}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10.5px] text-slate-400 font-bold">RADIUS GEOFENCE</p>
                      <p className="font-bold">{detailModalGroup.radius} Meter</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300">
                    <p className="font-bold">⚠️ Belum Mendaftarkan Posko Resmi</p>
                    <p className="text-[11px] mt-0.5">
                      Titik geofence presensi saat ini masih menggunakan titik tengah kelurahan / Coblong. Anda dapat mendaftarkan titik posko resmi untuk kelompok ini sekarang.
                    </p>
                  </div>
                )}
              </div>

              {/* Members Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
                    Anggota Mahasiswa ({detailModalGroup.studentsDetailed?.length || 0})
                  </span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                    {detailModalGroup.insideZoneCount} / {detailModalGroup.totalStudents} Di Dalam Zona
                  </span>
                </div>

                <div className="space-y-2">
                  {detailModalGroup.studentsDetailed?.map((st: any) => (
                    <div
                      key={`modal-mhs-${st.id}`}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900 dark:text-white">
                            {st.user?.name || st.name}
                          </p>
                          {st.isKetua && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-extrabold text-[9px]">
                              KETUA
                            </span>
                          )}
                        </div>
                        <p className="text-[10.5px] text-slate-500">
                          NIM: {st.nim || "-"} • {st.jurusan || "-"}
                        </p>
                      </div>

                      <div className="text-right">
                        {st.location ? (
                          st.isInsideZone ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px]">
                              🟢 Di Dalam Zona
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold text-[10px]">
                              ⚠️ {Math.round(st.distanceToZoneMeters || 0)}m Di Luar
                            </span>
                          )
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-[10px]">
                            Offline
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between gap-2">
              {detailModalGroup.posko && (
                <button
                  onClick={() => handlePromptDeletePosko(detailModalGroup.id, detailModalGroup.name)}
                  disabled={savingAction}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 dark:border-rose-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>Hapus Posko</span>
                </button>
              )}
              <button
                onClick={() => {
                  handleFocusGroup(detailModalGroup);
                  setDetailModalGroup(null);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs ml-auto"
              >
                Fokuskan di Peta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── INTERACTIVE GEOFENCE & POSKO CRUD EDITOR MODAL ─── */}
      {isEditModalOpen && editingGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30">
                  <SlidersHorizontal size={20} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    Ubah Geofence &amp; Posko: {editingGroup.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Klik pada peta untuk menggeser koordinat, sesuaikan radius zona presensi, atau ubah identitas posko.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar text-xs">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* Left: Mini Map Picker (7 Cols) */}
                <div className="md:col-span-7 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">
                      Peta Pemilihan Titik &amp; Radius
                    </span>
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => {
                          setEditMode("CIRCLE");
                          if (editPoints.length > 1) setEditPoints([editPoints[0]]);
                        }}
                        className={`px-2.5 py-1 rounded-md transition-all ${
                          editMode === "CIRCLE"
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        Radius Lingkaran
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditMode("POLYGON")}
                        className={`px-2.5 py-1 rounded-md transition-all ${
                          editMode === "POLYGON"
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        Poligon Custom
                      </button>
                    </div>
                  </div>

                  {/* Leaflet Sub-Map */}
                  <div className="w-full h-72 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner relative">
                    <MapContainer
                      center={editPoints[0] || editingGroup.center}
                      zoom={16}
                      scrollWheelZoom={true}
                      className="w-full h-full"
                    >
                      <ThemeTileLayer />
                      <DualGeofencePickerModalMap
                        mode={editMode}
                        points={editPoints}
                        onChange={(pts) => setEditPoints(pts)}
                        radius={editRadius}
                      />
                    </MapContainer>
                  </div>

                  {/* Polygon Node Action buttons if in POLYGON mode */}
                  {editMode === "POLYGON" && (
                    <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/50">
                      <span className="text-[11px] text-amber-800 dark:text-amber-300 font-semibold">
                        Titik Sudut: <strong>{editPoints.length}</strong> (Minimal 3 titik)
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditPoints([editPoints[0] || editingGroup.center])}
                        className="px-2 py-1 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 font-bold text-[10px]"
                      >
                        Reset Titik
                      </button>
                    </div>
                  )}

                  {/* Radius Slider if in CIRCLE mode */}
                  {editMode === "CIRCLE" && (
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">
                          Ukuran Radius Geofence
                        </span>
                        <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-md font-black text-xs">
                          {editRadius} Meter
                        </span>
                      </div>

                      <input
                        type="range"
                        min="50"
                        max="800"
                        step="25"
                        value={editRadius}
                        onChange={(e) => setEditRadius(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                      />

                      {/* Quick Radius Presets */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {[50, 100, 150, 200, 250, 300, 500].map((r) => (
                          <button
                            key={`preset-${r}`}
                            type="button"
                            onClick={() => setEditRadius(r)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition ${
                              editRadius === r
                                ? "bg-emerald-600 text-white border-emerald-600"
                                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-500"
                            }`}
                          >
                            {r}m {r === 500 ? "(Standar)" : ""}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Form Data Posko (5 Cols) */}
                <div className="md:col-span-5 flex flex-col gap-3.5">
                  <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">
                    Informasi &amp; Identitas Posko
                  </span>

                  <div>
                    <label className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                      Nama Posko KKN
                    </label>
                    <input
                      type="text"
                      value={editPoskoForm.nama}
                      onChange={(e) => setEditPoskoForm({ ...editPoskoForm, nama: e.target.value })}
                      placeholder="Contoh: Posko KKN RW 05 Sekeloa"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                      Alamat Lengkap Posko
                    </label>
                    <textarea
                      rows={2}
                      value={editPoskoForm.alamat}
                      onChange={(e) => setEditPoskoForm({ ...editPoskoForm, alamat: e.target.value })}
                      placeholder="Contoh: Jl. Tubagus Ismail Raya No. 42"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Latitude</label>
                      <input
                        type="number"
                        step="any"
                        value={editPoints[0] ? editPoints[0][0] : ""}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (!isNaN(val)) setEditPoints([[val, editPoints[0]?.[1] || CoblongGeo.CENTER[1]]]);
                        }}
                        className="w-full px-2.5 py-1.5 text-xs font-mono rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Longitude</label>
                      <input
                        type="number"
                        step="any"
                        value={editPoints[0] ? editPoints[0][1] : ""}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (!isNaN(val)) setEditPoints([[editPoints[0]?.[0] || CoblongGeo.CENTER[0], val]]);
                        }}
                        className="w-full px-2.5 py-1.5 text-xs font-mono rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                      Catatan / Keterangan (Opsional)
                    </label>
                    <input
                      type="text"
                      value={editPoskoForm.keterangan}
                      onChange={(e) => setEditPoskoForm({ ...editPoskoForm, keterangan: e.target.value })}
                      placeholder="Contoh: Rumah Ketua RT 02 / Balai RW"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300">
                    <p className="font-bold text-[11px] flex items-center gap-1">
                      <Sparkles size={13} />
                      <span>Sinkronisasi Otomatis Presensi</span>
                    </p>
                    <p className="text-[10.5px] mt-0.5">
                      Menyimpan posko ini akan langsung mengaktifkan titik geofence presensi untuk semua mahasiswa di kelompok ini.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleSavePosko}
                disabled={savingAction}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/30 active:scale-95 transition disabled:opacity-50"
              >
                <Save size={15} />
                <span>{savingAction ? "Menyimpan..." : "Simpan & Terapkan Zona"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern BERSEKA Confirmation Modal for Deleting Posko KKN */}
      <ConfirmModal
        isOpen={Boolean(deletePoskoTarget)}
        onClose={() => setDeletePoskoTarget(null)}
        onConfirm={handleConfirmDeletePosko}
        isLoading={savingAction}
        title="Hapus Posko KKN & Reset Zona"
        message={`Apakah Anda yakin ingin menghapus data posko${
          deletePoskoTarget?.nama ? ` untuk ${deletePoskoTarget.nama}` : ""
        } dan mereset zona presensi ke estimasi default kelurahan?`}
        confirmText="Ya, Hapus & Reset"
        cancelText="Batal"
        type="danger"
      />
    </div>
  );
};

export default ZonaInspectorPage;
