/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari sistem cerdas BERSEKA Kecamatan Coblong.
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  Polygon,
  useMap
} from "react-leaflet";
import {
  Loader2,
  MapPin,
  Search,
  GraduationCap,
  Users,
  Building2,
  UserCheck,
  Phone,
  X,
  ExternalLink,
  Copy,
  Check,
  Eye,
  Compass,
  Sparkles,
  Plus,
  Pencil,
  Trash2,
  Upload,
  Crosshair,
  Navigation,
  Info,
  CheckCircle2,
  Clock,
  RefreshCw
} from "lucide-react";
import L from "leaflet";
import api from "../../services/api";
import showToast from "../../utils/showToast";
import { useAuthStore } from "../../store/useAuthStore";
import { Pagination } from "../../components/common/Pagination";
import PageHeader from "../../components/common/PageHeader";
import { ConfirmModal } from "../../components/common/ConfirmModal";
import { ThemeTileLayer } from "../../components/common/ThemeTileLayer";
import { KELURAHAN_GEODATA, CoblongGeo } from "../../constants/coblongGeoData";
import { resolveImageUrl } from "../../utils/imageUrl";

export interface PoskoItem {
  id: string;
  nama: string;
  alamat?: string;
  kelompokId?: string;
  kelompokName: string;
  kelurahan: string;
  rwId?: number | null;
  rwName: string;
  latitude: number | string;
  longitude: number | string;
  foto?: string | null;
  pic: string;
  kontak: string;
  dplName: string;
  totalAnggota: number;
  statusApproval: string;
  createdAt: string;
}

export interface KelompokOption {
  id: string;
  name: string;
  kelurahan?: string;
  cakupanRw?: any;
  dplNamaMentah?: string;
  dpl?: { id: string; name: string; phone?: string };
  students?: Array<{
    id: string;
    isKetua: boolean;
    nim?: string;
    noWa?: string;
    user?: { id: string; name: string; phone?: string };
  }>;
}

// Helper Format URL WhatsApp (Standard International 62)
const formatWhatsAppUrl = (phone?: string | null): string => {
  if (!phone || phone === "-" || phone.trim() === "") return "";
  const cleaned = phone.replace(/[^0-9]/g, "");
  if (!cleaned) return "";
  const formatted = cleaned.startsWith("0") ? `62${cleaned.slice(1)}` : cleaned.startsWith("62") ? cleaned : `62${cleaned}`;
  return `https://wa.me/${formatted}`;
};

// Custom Marker Pin Icon untuk Posko KKN (Indigo Theme)
const createPoskoMarkerIcon = (nama?: string) => {
  return L.divIcon({
    className: "custom-posko-icon",
    html: `
      <div title="${nama || "Posko KKN"}" style="background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%); width: 32px; height: 32px; border-radius: 10px; border: 2.5px solid white; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.45); display: flex; align-items: center; justify-content: center; color: white; cursor: pointer; transition: transform 0.15s ease;">
        <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/>
          <path d="M22 10v6"/>
          <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

// Map FlyTo Helper Component
const MapFlyToController: React.FC<{ center: [number, number] | null; zoom?: number }> = ({
  center,
  zoom = 16,
}) => {
  const map = useMap();
  useEffect(() => {
    if (center && !isNaN(center[0]) && !isNaN(center[1])) {
      map.flyTo(center, zoom, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
};

const INITIAL_FORM_STATE = {
  nama: "",
  alamat: "",
  kelompokId: "",
  kelurahan: "Dago",
  rwName: "01",
  latitude: "",
  longitude: "",
  pic: "",
  kontak: "",
  dplName: "",
  statusApproval: "APPROVED" as "APPROVED" | "PENDING",
};

export const PoskoKknPage: React.FC = () => {
  const { user } = useAuthStore();
  const userRole = String(user?.peran || "").toUpperCase();
  const isDpl = ["DPL", "DOSEN_PEMBIMBING", "DOSEN_PEMBIMBING_LAPANGAN"].some((r) => userRole.includes(r));
  const isDeveloperOrAdmin = [
    "DEVELOPER",
    "SUPER_USER",
    "ADMIN_DLH",
    "DLH_ADMIN",
    "PANITIA_TASKFORCE",
    "PEMIMPIN"
  ].includes(userRole);

  const [items, setItems] = useState<PoskoItem[]>([]);
  const [kelompokList, setKelompokList] = useState<KelompokOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKelurahan, setSelectedKelurahan] = useState("ALL");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Map Animation State
  const [mapTargetCenter, setMapTargetCenter] = useState<[number, number] | null>(null);
  const [mapTargetZoom, setMapTargetZoom] = useState<number>(14);
  const mapSectionRef = useRef<HTMLDivElement>(null);

  // Image Preview Lightbox Modal State
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string; subtitle?: string } | null>(null);

  // Detail Modal State
  const [detailModalPosko, setDetailModalPosko] = useState<PoskoItem | null>(null);

  // Copy coordinate feedback state
  const [copiedCoordId, setCopiedCoordId] = useState<string | null>(null);

  // Form Modal (Add / Edit) States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [selectedPoskoId, setSelectedPoskoId] = useState<string | null>(null);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDetectingGps, setIsDetectingGps] = useState(false);

  // Delete Confirmation Modal State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    posko: PoskoItem | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    posko: null,
    isLoading: false,
  });

  const fetchPoskoList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/kkn/posko");
      setItems(res.data.data || []);
    } catch (err: any) {
      showToast.error(err.response?.data?.message || "Gagal memuat data Posko KKN");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchKelompokList = useCallback(async () => {
    try {
      const res = await api.get("/kelompok?limit=100");
      const list = res.data?.data || res.data?.groups || res.data?.kelompoks || res.data || [];
      if (Array.isArray(list)) {
        setKelompokList(list);
      }
    } catch (err) {
      console.warn("Gagal memuat kelompok list:", err);
    }
  }, []);

  useEffect(() => {
    fetchPoskoList();
    if (isDeveloperOrAdmin || isDpl) {
      fetchKelompokList();
    }
  }, [fetchPoskoList, fetchKelompokList, isDeveloperOrAdmin, isDpl]);

  // Metrik Penghitungan Posko
  const metrics = useMemo(() => {
    const total = items.length;
    const verified = items.filter((i) => i.statusApproval === "APPROVED").length;
    const totalMahasiswa = items.reduce((acc, curr) => acc + (curr.totalAnggota || 0), 0);
    const dplSet = new Set(items.map((i) => i.dplName).filter((d) => d && !d.includes("Belum")));
    const totalDpl = dplSet.size;

    return { total, verified, totalMahasiswa, totalDpl };
  }, [items]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (item.nama || "").toLowerCase().includes(q) ||
        (item.kelompokName || "").toLowerCase().includes(q) ||
        (item.pic || "").toLowerCase().includes(q) ||
        (item.dplName || "").toLowerCase().includes(q) ||
        (item.alamat || "").toLowerCase().includes(q) ||
        (item.kelurahan || "").toLowerCase().includes(q) ||
        (item.rwName || "").toLowerCase().includes(q);

      let matchKelurahan = true;
      if (selectedKelurahan !== "ALL") {
        matchKelurahan = (item.kelurahan || "").toLowerCase().includes(selectedKelurahan.toLowerCase());
      }

      return matchSearch && matchKelurahan;
    });
  }, [items, searchQuery, selectedKelurahan]);

  // Reset pagination on search/filter
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedKelurahan, itemsPerPage]);

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  // Fly to Map Location Handler
  const handleViewOnMap = (lat: number | string, lng: number | string) => {
    const latNum = Number(lat);
    const lngNum = Number(lng);
    if (isNaN(latNum) || isNaN(lngNum) || latNum === 0) {
      showToast.error("Koordinat GPS posko tidak valid");
      return;
    }
    setMapTargetCenter([latNum, lngNum]);
    setMapTargetZoom(17);
    if (mapSectionRef.current) {
      mapSectionRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // Copy Coordinate to Clipboard Handler
  const handleCopyCoordinate = (id: string, lat: number | string, lng: number | string) => {
    const text = `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`;
    navigator.clipboard.writeText(text);
    setCopiedCoordId(id);
    showToast.success(`Koordinat disalin: ${text}`);
    setTimeout(() => setCopiedCoordId(null), 2000);
  };

  // Open Form for Adding New Posko
  const handleOpenAddModal = () => {
    setFormMode("add");
    setSelectedPoskoId(null);
    setFormData({
      ...INITIAL_FORM_STATE,
      latitude: "-6.89030",
      longitude: "107.61100",
    });
    setSelectedFile(null);
    setPreviewPhotoUrl(null);
    setIsFormModalOpen(true);
  };

  // Open Form for Editing Existing Posko
  const handleOpenEditModal = (item: PoskoItem) => {
    setFormMode("edit");
    setSelectedPoskoId(item.id);
    setFormData({
      nama: item.nama || "",
      alamat: item.alamat === "-" ? "" : item.alamat || "",
      kelompokId: item.kelompokId || "",
      kelurahan: item.kelurahan || "Dago",
      rwName: item.rwName === "-" ? "01" : item.rwName || "01",
      latitude: String(item.latitude || ""),
      longitude: String(item.longitude || ""),
      pic: item.pic || "",
      kontak: item.kontak === "-" ? "" : item.kontak || "",
      dplName: item.dplName || "",
      statusApproval: (item.statusApproval as "APPROVED" | "PENDING") || "APPROVED",
    });
    setSelectedFile(null);
    setPreviewPhotoUrl(item.foto ? resolveImageUrl(item.foto) : null);
    setIsFormModalOpen(true);
  };

  // Auto-fill when Kelompok is selected
  const handleKelompokChange = (kelompokId: string) => {
    const selected = kelompokList.find((k) => k.id === kelompokId);
    if (!selected) {
      setFormData((prev) => ({ ...prev, kelompokId }));
      return;
    }

    const ketuaStudent = selected.students?.find((s) => s.isKetua) || selected.students?.[0];
    const ketuaName = ketuaStudent?.user?.name || "";
    const ketuaPhone = ketuaStudent?.user?.phone || ketuaStudent?.noWa || "";
    const dplName = selected.dpl?.name || selected.dplNamaMentah || "";
    const kelurahan = selected.kelurahan || "Dago";

    let rwVal = "01";
    if (selected.cakupanRw) {
      try {
        const parsed = typeof selected.cakupanRw === "string" ? JSON.parse(selected.cakupanRw) : selected.cakupanRw;
        if (Array.isArray(parsed) && parsed.length > 0) {
          rwVal = String(parsed[0]).padStart(2, "0");
        }
      } catch (_) {}
    }

    // Centroid default jika lat/lng kosong
    const centroid = KELURAHAN_GEODATA[kelurahan.toUpperCase()]?.centroid || [-6.8903, 107.611];

    setFormData((prev) => ({
      ...prev,
      kelompokId,
      nama: prev.nama.trim() ? prev.nama : `Posko KKN ${selected.name}`,
      kelurahan,
      rwName: rwVal,
      dplName: dplName || prev.dplName,
      pic: ketuaName || prev.pic,
      kontak: ketuaPhone || prev.kontak,
      latitude: prev.latitude ? prev.latitude : String(centroid[0].toFixed(5)),
      longitude: prev.longitude ? prev.longitude : String(centroid[1].toFixed(5)),
    }));
  };

  // GPS Geolocation Detector Helper
  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      showToast.error("Browser Anda tidak mendukung deteksi GPS Geolocation.");
      return;
    }

    setIsDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsDetectingGps(false);
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }));
        showToast.success(`Lokasi GPS berhasil dideteksi: ${lat}, ${lng}`);
      },
      (err) => {
        setIsDetectingGps(false);
        console.error("GPS error:", err);
        showToast.error("Gagal mendeteksi lokasi GPS. Pastikan izin lokasi diaktifkan.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Quick Preset Centroid Koordinat Kelurahan
  const handleSetKelurahanCentroid = (kelKey: string) => {
    const geo = KELURAHAN_GEODATA[kelKey.toUpperCase()];
    if (geo?.centroid) {
      setFormData((prev) => ({
        ...prev,
        latitude: String(geo.centroid[0].toFixed(6)),
        longitude: String(geo.centroid[1].toFixed(6)),
      }));
      showToast.success(`Koordinat diset ke pusat Kelurahan ${geo.name}`);
    }
  };

  // File Change Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast.error("Ukuran foto maksimal 5 MB.");
        return;
      }
      setSelectedFile(file);
      setPreviewPhotoUrl(URL.createObjectURL(file));
    }
  };

  // Submit Form (Create / Edit)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim()) {
      showToast.error("Nama Posko KKN wajib diisi.");
      return;
    }
    const latNum = Number(formData.latitude);
    const lngNum = Number(formData.longitude);
    if (isNaN(latNum) || isNaN(lngNum) || latNum === 0 || lngNum === 0) {
      showToast.error("Koordinat latitude dan longitude wajib berupa angka valid.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payloadData = new FormData();
      payloadData.append("nama", formData.nama.trim());
      payloadData.append("alamat", formData.alamat.trim());
      if (formData.kelompokId) {
        payloadData.append("kelompokId", formData.kelompokId);
      }
      payloadData.append("latitude", String(latNum));
      payloadData.append("longitude", String(lngNum));
      payloadData.append("pic", formData.pic.trim());
      payloadData.append("kontak", formData.kontak.trim());
      payloadData.append("statusApproval", formData.statusApproval);

      if (selectedFile) {
        payloadData.append("foto", selectedFile);
      }

      if (formMode === "add") {
        await api.post("/kkn/posko", payloadData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showToast.success("Posko KKN baru berhasil ditambahkan!");
      } else {
        await api.put(`/kkn/posko/${selectedPoskoId}`, payloadData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showToast.success("Data Posko KKN berhasil diperbarui!");
      }

      setIsFormModalOpen(false);
      fetchPoskoList();
    } catch (err: any) {
      console.error("Submit Posko Error:", err);
      showToast.error(err.response?.data?.message || "Gagal menyimpan data Posko KKN.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Action Handler
  const handleDeleteConfirm = async () => {
    if (!deleteModal.posko) return;
    setDeleteModal((prev) => ({ ...prev, isLoading: true }));
    try {
      await api.delete(`/kkn/posko/${deleteModal.posko.id}`);
      showToast.success(`Posko "${deleteModal.posko.nama}" berhasil dihapus.`);
      setDeleteModal({ isOpen: false, posko: null, isLoading: false });
      fetchPoskoList();
    } catch (err: any) {
      console.error("Delete Posko Error:", err);
      showToast.error(err.response?.data?.message || "Gagal menghapus data Posko KKN.");
      setDeleteModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <div className="pb-24 lg:pb-8">
      <PageHeader
        title={isDpl ? "Posko KKN Kelompok Bimbingan" : "Posko KKN Mahasiswa"}
        description={
          isDpl
            ? "Pangkalan posko, kontak tim mahasiswa, titik koordinat GPS, dan lokasi kelompok KKN binaan Anda."
            : "Direktori pangkalan posko kegiatan mahasiswa KKN, kelompok binaan, dosen pendamping lapangan (DPL), dan titik koordinat GPS di wilayah Kecamatan Coblong."
        }
        icon={GraduationCap}
      />

      {isDpl ? (
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
          {loading ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-xs">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 dark:text-emerald-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-500">Memuat data posko kelompok bimbingan...</p>
            </div>
          ) : items.length === 0 ? (
            (() => {
              const dplKelompok = kelompokList[0] || null;
              const rawKelurahan = dplKelompok?.kelurahan || (user as any)?.kelurahan || "Coblong";
              const normalizedKelKey =
                Object.keys(KELURAHAN_GEODATA).find(
                  (k) =>
                    k.toLowerCase() === rawKelurahan.toLowerCase().replace(/[\s_]+/g, "") ||
                    rawKelurahan.toLowerCase().replace(/[\s_]+/g, "").includes(k.toLowerCase())
                ) || "DAGO";
              const kelurahanGeo = KELURAHAN_GEODATA[normalizedKelKey] || KELURAHAN_GEODATA["DAGO"];
              const mapCenter: [number, number] = kelurahanGeo?.centroid || CoblongGeo.CENTER;

              const ketuaStudent =
                dplKelompok?.students?.find((s) => s.isKetua) || dplKelompok?.students?.[0];
              const ketuaName = ketuaStudent?.user?.name || (ketuaStudent as any)?.nama || "Ketua Kelompok";
              const ketuaPhone =
                ketuaStudent?.noWa ||
                ketuaStudent?.user?.phone ||
                (ketuaStudent?.user as any)?.noHp ||
                "";
              const totalAnggota = dplKelompok?.students?.length || 0;

              return (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Status Banner */}
                  <div className="bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800">
                        <Clock size={24} />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-200/70 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200">
                            Menunggu Pendaftaran Posko
                          </span>
                          {dplKelompok?.name && (
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              {dplKelompok.name}
                            </span>
                          )}
                        </div>
                        <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 mt-1">
                          Posko Kelompok Bimbingan Belum Didaftarkan
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5 max-w-2xl leading-relaxed">
                          Ketua kelompok KKN bimbingan Anda belum mendaftarkan titik lokasi GPS posko di aplikasi. Peta di bawah menampilkan wilayah penugasan kelompok di <strong>Kelurahan {dplKelompok?.kelurahan || kelurahanGeo.name}</strong>.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                      {formatWhatsAppUrl(ketuaPhone) && (
                        <a
                          href={formatWhatsAppUrl(ketuaPhone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                        >
                          <Phone size={14} />
                          <span>Hubungi Ketua (WA)</span>
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          fetchPoskoList();
                          fetchKelompokList();
                        }}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      >
                        <RefreshCw size={13} />
                        <span>Muat Ulang</span>
                      </button>
                    </div>
                  </div>

                  {/* 2 Column: Info Kelompok & Map Placeholder */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column: Info Kelompok Binaan & Kontak */}
                    <div className="lg:col-span-5 space-y-6">
                      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
                        <div className="flex items-start gap-3.5 pb-4 border-b border-slate-100 dark:border-slate-800">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800">
                            <GraduationCap size={24} />
                          </div>
                          <div>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                              Kelompok Bimbingan DPL
                            </span>
                            <h4 className="text-base font-black text-slate-900 dark:text-slate-100 mt-0.5">
                              {dplKelompok?.name || "Kelompok KKN Binaan"}
                            </h4>
                            <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                              <MapPin size={12} className="text-rose-500" />
                              <span>Kelurahan {dplKelompok?.kelurahan || kelurahanGeo.name}, Kec. Coblong</span>
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3.5 text-xs">
                          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Ketua Kelompok (PIC)
                            </span>
                            <p className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">
                              {ketuaName}
                            </p>
                            {formatWhatsAppUrl(ketuaPhone) ? (
                              <a
                                href={formatWhatsAppUrl(ketuaPhone)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold hover:underline mt-0.5"
                              >
                                <Phone size={12} />
                                <span>WhatsApp: {ketuaPhone}</span>
                              </a>
                            ) : (
                              <span className="text-slate-400 italic">Kontak nomor belum terdata</span>
                            )}
                          </div>

                          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                Total Mahasiswa Binaan
                              </span>
                              <p className="font-black text-slate-800 dark:text-slate-200 text-sm mt-0.5">
                                {totalAnggota} Mahasiswa
                              </p>
                            </div>
                            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                              <Users size={16} />
                            </div>
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-900 dark:text-indigo-300 space-y-1">
                          <div className="font-bold flex items-center gap-1.5">
                            <Info size={14} className="text-indigo-600 shrink-0" />
                            <span>Langkah Selanjutnya:</span>
                          </div>
                          <p className="text-[11px] leading-relaxed text-indigo-800/80 dark:text-indigo-300/80">
                            Silakan beri tahu Ketua Kelompok untuk mendaftarkan titik lokasi posko melalui menu <strong>Posko KKN</strong> di aplikasi.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Peta Wilayah Kelurahan Penugasan */}
                    <div className="lg:col-span-7">
                      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs h-[440px] flex flex-col">
                        <div className="flex items-center justify-between px-2 pb-3 mb-2 border-b border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-2">
                            <Compass size={16} className="text-indigo-600" />
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              Wilayah Penugasan: Kelurahan {dplKelompok?.kelurahan || kelurahanGeo.name}
                            </span>
                          </div>
                          <span className="px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                            <Clock size={11} />
                            <span>Menunggu Titik Posko</span>
                          </span>
                        </div>

                        <div className="flex-1 rounded-2xl overflow-hidden relative border border-slate-200 dark:border-slate-700">
                          <MapContainer
                            center={mapCenter}
                            zoom={14}
                            style={{ height: "100%", width: "100%" }}
                            className="z-0"
                          >
                            <ThemeTileLayer />
                            {kelurahanGeo?.bounds && (
                              <Polygon
                                positions={kelurahanGeo.bounds}
                                pathOptions={{
                                  color: "#4f46e5",
                                  fillColor: "#4f46e5",
                                  fillOpacity: 0.12,
                                  weight: 2.5,
                                  dashArray: "6, 6",
                                }}
                              >
                                <Popup>
                                  <div className="p-1 text-xs">
                                    <strong className="text-indigo-600 block">Kelurahan {kelurahanGeo.name}</strong>
                                    <p className="text-slate-500 mt-0.5">Wilayah Operasional Kelompok Bimbingan Anda.</p>
                                  </div>
                                </Popup>
                              </Polygon>
                            )}
                          </MapContainer>

                          {/* Map Overlay Badge */}
                          <div className="absolute bottom-3 left-3 right-3 sm:right-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md flex items-center gap-3 z-[1000]">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center shrink-0">
                              <MapPin size={16} />
                            </div>
                            <div className="text-xs">
                              <p className="font-bold text-slate-800 dark:text-slate-200">
                                Peta Wilayah Kelurahan {dplKelompok?.kelurahan || kelurahanGeo.name}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                Titik koordinat posko akan otomatis muncul di sini setelah didaftarkan.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            (() => {
              const posko = items[0];
              const latNum = Number(posko.latitude);
              const lngNum = Number(posko.longitude);
              const isValidCoord = !isNaN(latNum) && !isNaN(lngNum) && latNum !== 0 && lngNum !== 0;
              const resolvedFoto = resolveImageUrl(posko.foto);

              return (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Hero Posko Banner */}
                  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-xs">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center shrink-0 shadow-2xs">
                          <GraduationCap size={28} />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              {posko.kelompokName}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                              <CheckCircle2 size={12} />
                              <span>Terverifikasi</span>
                            </span>
                          </div>
                          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-1.5 tracking-tight">
                            {posko.nama}
                          </h2>
                          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1 flex items-center gap-1.5">
                            <MapPin size={14} className="text-rose-500 shrink-0" />
                            <span>Kelurahan {posko.kelurahan} &bull; RW {posko.rwName} &bull; Kec. Coblong</span>
                          </p>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                        {isValidCoord && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${latNum},${lngNum}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <Navigation size={14} />
                            <span>Buka di Google Maps</span>
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* 3 Quick Highlight Metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
                      <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                          Ketua Kelompok (PIC)
                        </span>
                        <span className="text-base font-black text-slate-900 dark:text-slate-100 mt-1 block">
                          {posko.pic || "Ketua Kelompok"}
                        </span>
                        {formatWhatsAppUrl(posko.kontak) ? (
                          <a
                            href={formatWhatsAppUrl(posko.kontak)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 mt-1"
                          >
                            <Phone size={12} />
                            <span>WhatsApp: {posko.kontak}</span>
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium mt-1 block">Kontak belum tersedia</span>
                        )}
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                          Total Mahasiswa Bimbingan
                        </span>
                        <span className="text-base font-black text-slate-900 dark:text-slate-100 mt-1 block">
                          {posko.totalAnggota || 0} Mahasiswa Aktif
                        </span>
                        <p className="text-xs text-slate-400 font-medium mt-1 flex items-center gap-1">
                          <Users size={12} />
                          <span>Anggota Kelompok KKN</span>
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                          Koordinat GPS
                        </span>
                        <span className="text-sm font-black text-slate-800 dark:text-slate-200 mt-1 font-mono block">
                          {isValidCoord ? `${latNum.toFixed(5)}, ${lngNum.toFixed(5)}` : "Belum diset"}
                        </span>
                        {isValidCoord && (
                          <button
                            type="button"
                            onClick={() => handleCopyCoordinate(posko.id, posko.latitude, posko.longitude)}
                            className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 mt-1 cursor-pointer"
                          >
                            {copiedCoordId === posko.id ? (
                              <span className="text-emerald-600 flex items-center gap-1">
                                <Check size={12} /> Tersalin!
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <Copy size={12} /> Salin Koordinat
                              </span>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 2 Column Details & Map */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left: Foto & Alamat */}
                    <div className="lg:col-span-5 space-y-6">
                      {/* Foto Posko Card */}
                      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
                        <h4 className="text-xs font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                          <Eye size={14} />
                          <span>Dokumentasi Posko</span>
                        </h4>
                        {resolvedFoto ? (
                          <div
                            onClick={() => setPreviewImage({ url: resolvedFoto, title: posko.nama, subtitle: posko.alamat })}
                            className="relative aspect-video rounded-2xl overflow-hidden cursor-pointer group border border-slate-200 dark:border-slate-700"
                          >
                            <img
                              src={resolvedFoto}
                              alt={posko.nama}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1.5">
                              <Eye size={16} />
                              <span>Perbesar Foto</span>
                            </div>
                          </div>
                        ) : (
                          <div className="aspect-video rounded-2xl bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center text-slate-400 p-4 border border-dashed border-slate-300 dark:border-slate-700">
                            <Building2 size={32} className="mb-1" />
                            <span className="text-xs font-medium">Foto posko belum diunggah</span>
                          </div>
                        )}

                        <div className="pt-2">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                            Alamat Lengkap
                          </span>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1 leading-relaxed">
                            {posko.alamat || "Alamat fisik posko belum tercatat lengkap."}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right: Map */}
                    <div className="lg:col-span-7">
                      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs h-[420px] flex flex-col">
                        <div className="flex items-center justify-between px-2 pb-3 mb-2 border-b border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-2">
                            <Compass size={16} className="text-indigo-600" />
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              Lokasi Presisi Posko (Peta GIS)
                            </span>
                          </div>
                          {isValidCoord && (
                            <button
                              type="button"
                              onClick={() => handleViewOnMap(latNum, lngNum)}
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1 cursor-pointer"
                            >
                              <Crosshair size={13} />
                              <span>Fokus Posko</span>
                            </button>
                          )}
                        </div>

                        <div className="flex-1 rounded-2xl overflow-hidden relative border border-slate-200 dark:border-slate-700">
                          {isValidCoord ? (
                            <MapContainer
                              center={[latNum, lngNum]}
                              zoom={16}
                              style={{ height: "100%", width: "100%" }}
                              className="z-0"
                            >
                              <ThemeTileLayer />
                              <MapFlyToController center={mapTargetCenter || [latNum, lngNum]} zoom={mapTargetZoom} />
                              {KELURAHAN_GEODATA[posko.kelurahan?.toUpperCase()]?.bounds && (
                                <Polygon
                                  positions={KELURAHAN_GEODATA[posko.kelurahan.toUpperCase()].bounds}
                                  pathOptions={{
                                    color: "#4f46e5",
                                    fillColor: "#4f46e5",
                                    fillOpacity: 0.08,
                                    weight: 2,
                                    dashArray: "4, 6",
                                  }}
                                />
                              )}
                              <Marker position={[latNum, lngNum]} icon={createPoskoMarkerIcon(posko.nama)}>
                                <Popup>
                                  <div className="p-1 space-y-1 text-xs">
                                    <strong className="text-slate-900 font-bold">{posko.nama}</strong>
                                    <p className="text-slate-500">{posko.alamat}</p>
                                    <p className="text-indigo-600 font-semibold">{posko.kelompokName}</p>
                                  </div>
                                </Popup>
                              </Marker>
                            </MapContainer>
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-800">
                              <MapPin size={32} className="mb-2 text-slate-300" />
                              <p className="text-xs font-semibold">Titik koordinat posko belum ditentukan</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()
          )}
        </div>
      ) : (
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
        
          {/* ========================================================================= */}
          {/* 1. METRIC STATS CARDS                                                     */}
          {/* ========================================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Total Posko */}
          <div className="p-4 sm:p-5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between w-full mb-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                Total Posko KKN
              </span>
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Building2 size={18} />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                {metrics.total}
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 truncate">
                Pangkalan Basecamp Mahasiswa
              </p>
            </div>
          </div>

          {/* Card 2: Posko Terverifikasi */}
          <div className="p-4 sm:p-5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between w-full mb-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Status Terverifikasi
              </span>
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <UserCheck size={18} />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                {metrics.verified} <span className="text-sm font-bold text-slate-400">/ {metrics.total}</span>
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 truncate">
                Disetujui Wilayah Setempat
              </p>
            </div>
          </div>

          {/* Card 3: Total Mahasiswa */}
          <div className="p-4 sm:p-5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between w-full mb-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                Mahasiswa Terdata
              </span>
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <Users size={18} />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                {metrics.totalMahasiswa > 0 ? metrics.totalMahasiswa : "-"}
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 truncate">
                Anggota di Seluruh Kelompok
              </p>
            </div>
          </div>

          {/* Card 4: DPL Pendamping */}
          <div className="p-4 sm:p-5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between w-full mb-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                DPL Pendamping
              </span>
              <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                <Sparkles size={18} />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                {metrics.totalDpl > 0 ? metrics.totalDpl : "-"}
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 truncate">
                Dosen Pendamping Aktif
              </p>
            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* 2. PETA SEBARAN POSKO KKN (LEAFLET GIS INTERAKTIF DENGAN POLIGON COBLONG) */}
        {/* ========================================================================= */}
        <div ref={mapSectionRef} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-3 relative overflow-hidden">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-2 py-1 mb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                <Compass size={16} />
              </span>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                  Peta Sebaran Posko KKN Mahasiswa
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Kecamatan Coblong, Kota Bandung ({filteredItems.length} posko aktif)
                </p>
              </div>
            </div>

            {selectedKelurahan !== "ALL" && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg">
                  Filter Kelurahan: {selectedKelurahan}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedKelurahan("ALL")}
                  className="text-xs text-slate-500 hover:text-rose-600 flex items-center gap-1 font-medium transition cursor-pointer"
                >
                  <X size={13} /> Reset Filter
                </button>
              </div>
            )}
          </div>

          <div className="relative rounded-xl overflow-hidden h-[440px] sm:h-[480px] z-0 border border-slate-200/80 dark:border-slate-800">
            {/* Floating Legend */}
            <div className="absolute top-3 right-3 z-[999] max-w-[260px] pointer-events-auto">
              <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xl rounded-xl p-3 border border-slate-200 dark:border-slate-800 flex flex-col gap-2.5">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                    <span className="text-[10.5px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                      Legenda Peta Posko
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-[10px]">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-md bg-indigo-600 border border-white flex items-center justify-center text-white shrink-0">
                      <GraduationCap size={10} />
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Posko Mahasiswa KKN</span>
                  </div>

                  <div className="space-y-1 border-t border-slate-100 dark:border-slate-800 pt-1.5">
                    <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                      6 Kelurahan Coblong
                    </span>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                      <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-xs bg-[#10b981]" /><span className="font-medium text-slate-600 dark:text-slate-400">Dago</span></div>
                      <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-xs bg-[#3b82f6]" /><span className="font-medium text-slate-600 dark:text-slate-400">L. Siliwangi</span></div>
                      <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-xs bg-[#8b5cf6]" /><span className="font-medium text-slate-600 dark:text-slate-400">Lebak Gede</span></div>
                      <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-xs bg-[#f59e0b]" /><span className="font-medium text-slate-600 dark:text-slate-400">Sekeloa</span></div>
                      <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-xs bg-[#ec4899]" /><span className="font-medium text-slate-600 dark:text-slate-400">Sadang Serang</span></div>
                      <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-xs bg-[#06b6d4]" /><span className="font-medium text-slate-600 dark:text-slate-400">Cipaganti</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <MapContainer
              center={[-6.8903, 107.611]}
              zoom={14}
              style={{ height: '100%', width: '100%' }}
              className="z-0"
            >
              <ThemeTileLayer />
              <MapFlyToController center={mapTargetCenter} zoom={mapTargetZoom} />

              {/* Poligon Batas 6 Kelurahan Coblong */}
              {Object.values(KELURAHAN_GEODATA).map((kel) => (
                <Polygon
                  key={kel.id}
                  positions={kel.bounds}
                  pathOptions={{
                    color: kel.color,
                    weight: 2,
                    opacity: 0.8,
                    fillColor: kel.color,
                    fillOpacity: 0.08,
                    dashArray: "4, 4"
                  }}
                >
                  <Popup>
                    <div className="p-1.5 text-xs">
                      <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: kel.color }} />
                        Kelurahan {kel.name}
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Kecamatan Coblong, Kota Bandung ({kel.rwCount} RW)
                      </p>
                    </div>
                  </Popup>
                </Polygon>
              ))}

              {/* Marker Posko KKN */}
              {filteredItems.map((item) => {
                const latNum = Number(item.latitude);
                const lngNum = Number(item.longitude);
                if (isNaN(latNum) || isNaN(lngNum) || latNum === 0 || lngNum === 0) return null;

                const resolvedFoto = resolveImageUrl(item.foto);
                const isApproved = item.statusApproval === "APPROVED";

                return (
                  <Marker
                    key={item.id}
                    position={[latNum, lngNum]}
                    icon={createPoskoMarkerIcon(item.nama)}
                  >
                    <Popup maxWidth={320} className="custom-facility-popup">
                      <div className="p-2 space-y-2.5 text-xs text-slate-800 dark:text-slate-100">
                        {resolvedFoto && (
                          <div 
                            className="relative w-full h-32 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer group"
                            onClick={() => setPreviewImage({ url: resolvedFoto, title: item.nama, subtitle: item.alamat })}
                          >
                            <img
                              src={resolvedFoto}
                              alt={item.nama}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                              <Eye size={16} />
                            </div>
                          </div>
                        )}

                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200">
                              Posko KKN
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              isApproved ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300" : "bg-amber-100 text-amber-800"
                            }`}>
                              {isApproved ? "Aktif & Terverifikasi" : "Menunggu Approval"}
                            </span>
                          </div>
                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 leading-tight">
                            {item.nama}
                          </h4>
                          <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                            {item.kelompokName}
                          </p>
                        </div>

                        <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex items-center justify-between">
                            <span><strong className="text-slate-800 dark:text-slate-200">Ketua Posko:</strong> {item.pic}</span>
                          </div>
                          <div>
                            <strong className="text-slate-800 dark:text-slate-200">DPL:</strong> {item.dplName}
                          </div>
                          <div className="flex items-start gap-1.5 text-slate-600 dark:text-slate-300">
                            <MapPin size={13} className="shrink-0 mt-0.5 text-emerald-500" />
                            <span className="line-clamp-2">{item.alamat || `Kel. ${item.kelurahan}`}</span>
                          </div>
                        </div>

                        <div className="pt-1 flex gap-2">
                          <button
                            type="button"
                            onClick={() => setDetailModalPosko(item)}
                            className="flex-1 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Info size={12} /> Detail
                          </button>
                          {formatWhatsAppUrl(item.kontak) && (
                            <a
                              href={formatWhatsAppUrl(item.kontak)}
                              target="_blank"
                              rel="noreferrer"
                              className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center justify-center gap-1"
                            >
                              <Phone size={12} /> WhatsApp
                            </a>
                          )}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. TABEL DIREKTORI POSKO KKN                                              */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-0">
          
          {/* Toolbar Pencarian & Filter */}
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-3 md:items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
                <GraduationCap size={18} />
              </span>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                  Daftar Direktori Posko KKN Mahasiswa
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Menampilkan {filteredItems.length} posko terdata di Kecamatan Coblong
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto items-stretch sm:items-center">
              <div className="relative min-w-[220px] flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Cari posko, kelompok, ketua, DPL..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 text-slate-800 dark:text-slate-100 placeholder-slate-400 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <select
                value={selectedKelurahan}
                onChange={(e) => setSelectedKelurahan(e.target.value)}
                className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 text-slate-800 dark:text-slate-100 transition-all cursor-pointer"
              >
                <option value="ALL">Semua Kelurahan</option>
                <option value="Dago">Kel. Dago</option>
                <option value="Cipaganti">Kel. Cipaganti</option>
                <option value="Sekeloa">Kel. Sekeloa</option>
                <option value="Sadang Serang">Kel. Sadang Serang</option>
                <option value="Lebak Gede">Kel. Lebak Gede</option>
                <option value="Lebak Siliwangi">Kel. Lebak Siliwangi</option>
              </select>

              {/* Developer / Admin CRUD Button */}
              {isDeveloperOrAdmin && (
                <button
                  type="button"
                  onClick={handleOpenAddModal}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shrink-0"
                >
                  <Plus size={16} />
                  <span>Tambah Posko</span>
                </button>
              )}
            </div>
          </div>

          {/* Konten Tabel */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 size={36} className="text-indigo-600 animate-spin mb-3" />
              <p className="text-slate-500 text-sm font-medium">Memuat data posko KKN...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1020px]">
                <thead>
                  <tr className="bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80 text-[11px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-12 text-center">No</th>
                    <th className="py-3.5 px-4 min-w-[240px]">Foto &amp; Nama Posko</th>
                    <th className="py-3.5 px-4 min-w-[180px]">Kelompok KKN</th>
                    <th className="py-3.5 px-4 min-w-[200px]">Ketua Posko (PIC)</th>
                    <th className="py-3.5 px-4 min-w-[180px]">DPL Pendamping</th>
                    <th className="py-3.5 px-4 min-w-[220px]">Wilayah &amp; Koordinat</th>
                    <th className="py-3.5 px-4 w-36 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
                  {paginatedItems.map((item, index) => {
                    const resolvedFoto = resolveImageUrl(item.foto);
                    const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;
                    const latNum = Number(item.latitude);
                    const lngNum = Number(item.longitude);
                    const hasValidCoords = !isNaN(latNum) && !isNaN(lngNum) && latNum !== 0;
                    const isApproved = item.statusApproval === "APPROVED";

                    return (
                      <tr 
                        key={item.id} 
                        className="hover:bg-slate-50/90 dark:hover:bg-slate-800/50 transition duration-150 group"
                      >
                        {/* 1. Kolom Nomor */}
                        <td className="py-4 px-4 text-center font-bold text-slate-400 dark:text-slate-500">
                          {rowNumber}
                        </td>

                        {/* 2. Kolom Foto & Nama Posko */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3.5">
                            {resolvedFoto ? (
                              <div 
                                className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 group/img cursor-pointer shadow-2xs"
                                onClick={() => setPreviewImage({ 
                                  url: resolvedFoto, 
                                  title: item.nama, 
                                  subtitle: item.alamat || item.kelompokName 
                                })}
                                title="Klik untuk memperbesar foto"
                              >
                                <img
                                  src={resolvedFoto}
                                  alt={item.nama}
                                  className="w-full h-full object-cover group-hover/img:scale-110 transition duration-200"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition flex items-center justify-center text-white">
                                  <Eye size={14} />
                                </div>
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-2xs font-extrabold text-sm">
                                <GraduationCap size={20} />
                              </div>
                            )}

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h4 className="font-black text-slate-900 dark:text-slate-100 truncate text-xs sm:text-sm">
                                  {item.nama}
                                </h4>
                                {!isApproved && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 shrink-0">
                                    Pending
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                                {item.alamat || "Alamat posko belum diisi"}
                              </p>
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md mt-1">
                                Posko KKN
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 3. Kolom Kelompok KKN */}
                        <td className="py-4 px-4">
                          <div>
                            <span className="font-extrabold text-slate-800 dark:text-slate-200 block text-xs sm:text-sm">
                              {item.kelompokName}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                              <Users size={11} className="text-slate-400" />
                              {item.totalAnggota > 0 ? `${item.totalAnggota} Mahasiswa` : "Belum ada anggota"}
                            </span>
                          </div>
                        </td>

                        {/* 4. Kolom Ketua Posko & Kontak */}
                        <td className="py-4 px-4">
                          <div className="space-y-0.5">
                            <div className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
                              {item.pic}
                            </div>
                            <span className="text-[10px] text-slate-400 font-semibold block">
                              Ketua Kelompok
                            </span>
                            {formatWhatsAppUrl(item.kontak) && (
                              <div className="pt-0.5">
                                <a
                                  href={formatWhatsAppUrl(item.kontak)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline"
                                >
                                  <Phone size={11} /> {item.kontak}
                                </a>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* 5. Kolom DPL Pendamping */}
                        <td className="py-4 px-4">
                          <div className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
                            {item.dplName}
                          </div>
                          <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                            Dosen Pendamping
                          </span>
                        </td>

                        {/* 6. Kolom Wilayah & Koordinat */}
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <span className="font-bold text-slate-700 dark:text-slate-300 block text-xs">
                              {item.rwName && item.rwName !== "-" ? `RW ${item.rwName}` : ""} ({item.kelurahan})
                            </span>
                            
                            {hasValidCoords ? (
                              <button
                                type="button"
                                onClick={() => handleCopyCoordinate(item.id, latNum, lngNum)}
                                className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer group/btn"
                                title="Klik untuk menyalin koordinat"
                              >
                                <span>{latNum.toFixed(5)}, {lngNum.toFixed(5)}</span>
                                {copiedCoordId === item.id ? (
                                  <Check size={12} className="text-emerald-600" />
                                ) : (
                                  <Copy size={12} className="opacity-0 group-hover/btn:opacity-100 transition" />
                                )}
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">Koordinat belum diatur</span>
                            )}
                          </div>
                        </td>

                        {/* 7. Kolom Aksi */}
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            
                            {/* Tombol Detail */}
                            <button
                              type="button"
                              onClick={() => setDetailModalPosko(item)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition duration-150 cursor-pointer shadow-2xs"
                              title="Lihat Detail Posko"
                            >
                              <Eye size={14} />
                            </button>

                            {/* Tombol Peta */}
                            {hasValidCoords && (
                              <button
                                type="button"
                                onClick={() => handleViewOnMap(latNum, lngNum)}
                                className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 dark:text-indigo-300 transition duration-150 cursor-pointer shadow-2xs"
                                title="Tampilkan titik di peta"
                              >
                                <MapPin size={14} />
                              </button>
                            )}

                            {/* Tombol Edit & Hapus untuk Role Developer / Admin */}
                            {isDeveloperOrAdmin && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(item)}
                                  className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:hover:bg-amber-900/80 dark:text-amber-300 transition duration-150 cursor-pointer shadow-2xs"
                                  title="Edit Posko KKN"
                                >
                                  <Pencil size={14} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setDeleteModal({ isOpen: true, posko: item, isLoading: false })}
                                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 dark:text-rose-300 transition duration-150 cursor-pointer shadow-2xs"
                                  title="Hapus Posko KKN"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}

                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {paginatedItems.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <GraduationCap size={32} className="text-slate-300 dark:text-slate-600" />
                          <p className="font-semibold text-sm">Tidak ada data Posko KKN yang cocok</p>
                          <p className="text-xs text-slate-400">Coba ubah kata kunci pencarian atau filter kelurahan</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {!loading && filteredItems.length > 0 && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredItems.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={(val) => {
                  setItemsPerPage(val);
                  setCurrentPage(1);
                }}
              />
            </div>
          )}

        </div>
      </div>
    )}

      {/* ========================================================================= */}
      {/* 4. MODAL DETAIL POSKO KKN                                                 */}
      {/* ========================================================================= */}
      {detailModalPosko && (
        <div 
          className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setDetailModalPosko(null)}
        >
          <div 
            className="relative max-w-2xl w-full bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 animate-scaleUp text-slate-800 dark:text-slate-100 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-indigo-600/30 shadow-md">
                  <GraduationCap size={20} />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-slate-100 tracking-tight">
                    Rincian Posko KKN Mahasiswa
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Informasi lengkap pangkalan operasional &amp; kontak
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalPosko(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Foto Banner Posko */}
              {detailModalPosko.foto ? (
                <div 
                  className="relative w-full h-48 rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-slate-800 group cursor-pointer"
                  onClick={() => setPreviewImage({ 
                    url: resolveImageUrl(detailModalPosko.foto) || "", 
                    title: detailModalPosko.nama, 
                    subtitle: detailModalPosko.alamat 
                  })}
                >
                  <img
                    src={resolveImageUrl(detailModalPosko.foto) || ""}
                    alt={detailModalPosko.nama}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4">
                    <div className="flex items-center justify-between w-full text-white">
                      <span className="text-xs font-semibold flex items-center gap-1">
                        <Eye size={13} /> Klik untuk perbesar foto
                      </span>
                      <span className="text-[10px] font-bold bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-lg">
                        Foto Posko
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-28 rounded-2xl bg-gradient-to-br from-indigo-50 to-slate-100 dark:from-slate-800/80 dark:to-indigo-950/40 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-center gap-3 text-indigo-600 dark:text-indigo-400">
                  <GraduationCap size={28} />
                  <span className="font-bold text-sm">Belum ada foto posko diunggah</span>
                </div>
              )}

              {/* Title & Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    {detailModalPosko.nama}
                  </h2>
                  <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                    {detailModalPosko.kelompokName}
                  </p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold w-fit ${
                  detailModalPosko.statusApproval === "APPROVED"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300"
                }`}>
                  <CheckCircle2 size={13} />
                  {detailModalPosko.statusApproval === "APPROVED" ? "Terverifikasi Aktif" : "Menunggu Verifikasi"}
                </span>
              </div>

              {/* Grid Rincian */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Ketua Posko & Kontak */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Ketua Posko (PIC)
                  </span>
                  <p className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                    {detailModalPosko.pic}
                  </p>
                  {formatWhatsAppUrl(detailModalPosko.kontak) ? (
                    <a
                      href={formatWhatsAppUrl(detailModalPosko.kontak)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 mt-1"
                    >
                      <Phone size={12} /> Hubungi: {detailModalPosko.kontak}
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400 italic block">Kontak belum tersedia</span>
                  )}
                </div>

                {/* DPL Pendamping */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Dosen Pendamping Lapangan
                  </span>
                  <p className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                    {detailModalPosko.dplName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    DPL Kelompok KKN
                  </p>
                </div>

                {/* Wilayah Penugasan */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Wilayah Kelurahan &amp; RW
                  </span>
                  <p className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                    Kelurahan {detailModalPosko.kelurahan}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {detailModalPosko.rwName && detailModalPosko.rwName !== "-" ? `RW ${detailModalPosko.rwName}` : "RW Wilayah"} &bull; Kecamatan Coblong
                  </p>
                </div>

                {/* Total Anggota Mahasiswa */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Mahasiswa Terdata
                  </span>
                  <p className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                    {detailModalPosko.totalAnggota > 0 ? `${detailModalPosko.totalAnggota} Anggota` : "Belum diatur"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Anggota binaan di kelompok
                  </p>
                </div>

              </div>

              {/* Alamat Fisik Lengkap */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Alamat Lengkap Posko
                </span>
                <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                  {detailModalPosko.alamat || "Alamat posko belum dicantumkan secara lengkap."}
                </p>
              </div>

              {/* Titik Koordinat GPS & Aksi Maps */}
              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 block">
                    Titik Koordinat GPS
                  </span>
                  <p className="font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                    {Number(detailModalPosko.latitude).toFixed(6)}, {Number(detailModalPosko.longitude).toFixed(6)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyCoordinate(detailModalPosko.id, detailModalPosko.latitude, detailModalPosko.longitude)}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition cursor-pointer flex items-center gap-1"
                  >
                    <Copy size={12} /> Salin
                  </button>

                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${detailModalPosko.latitude},${detailModalPosko.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                  >
                    <ExternalLink size={12} /> Buka Google Maps
                  </a>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => {
                  const lat = Number(detailModalPosko.latitude);
                  const lng = Number(detailModalPosko.longitude);
                  setDetailModalPosko(null);
                  handleViewOnMap(lat, lng);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 cursor-pointer"
              >
                <Compass size={14} /> Lihat di Peta Berseka
              </button>

              <div className="flex items-center gap-2">
                {isDeveloperOrAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      const p = detailModalPosko;
                      setDetailModalPosko(null);
                      handleOpenEditModal(p);
                    }}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Pencil size={13} /> Edit Posko
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setDetailModalPosko(null)}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL FORM TAMBAH / EDIT POSKO KKN                                     */}
      {/* ========================================================================= */}
      {isFormModalOpen && (
        <div 
          className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => !isSubmitting && setIsFormModalOpen(false)}
        >
          <div 
            className="relative max-w-2xl w-full bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 animate-scaleUp text-slate-800 dark:text-slate-100 max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-indigo-600/30 shadow-md">
                  {formMode === "add" ? <Plus size={20} /> : <Pencil size={18} />}
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-slate-100 tracking-tight">
                    {formMode === "add" ? "Tambah Posko KKN Baru" : "Edit Data Posko KKN"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Kelola pangkalan posko kegiatan mahasiswa KKN di Kecamatan Coblong
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setIsFormModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmitForm} className="overflow-y-auto p-6 space-y-5 flex-1">
              
              {/* Field 1: Pilih Kelompok KKN (Auto Fill Support) */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Kelompok KKN Terkait</span>
                  <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                    Auto-fill DPL, Kelurahan &amp; Ketua
                  </span>
                </label>
                <select
                  value={formData.kelompokId}
                  onChange={(e) => handleKelompokChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 text-slate-900 dark:text-slate-100 transition-all cursor-pointer"
                >
                  <option value="">-- Pilih Kelompok KKN (Opsional) --</option>
                  {kelompokList.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.name} {k.kelurahan ? `(Kel. ${k.kelurahan})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Field 2: Nama Posko */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Nama Posko KKN <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Posko KKN Kelompok 1 Cipaganti"
                  value={formData.nama}
                  onChange={(e) => setFormData((prev) => ({ ...prev, nama: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 text-slate-900 dark:text-slate-100 placeholder-slate-400 transition-all"
                />
              </div>

              {/* Field 3: Kelurahan & RW */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Kelurahan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.kelurahan}
                    onChange={(e) => setFormData((prev) => ({ ...prev, kelurahan: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 text-slate-900 dark:text-slate-100 transition-all cursor-pointer"
                  >
                    <option value="Dago">Kel. Dago</option>
                    <option value="Cipaganti">Kel. Cipaganti</option>
                    <option value="Sekeloa">Kel. Sekeloa</option>
                    <option value="Sadang Serang">Kel. Sadang Serang</option>
                    <option value="Lebak Gede">Kel. Lebak Gede</option>
                    <option value="Lebak Siliwangi">Kel. Lebak Siliwangi</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Nomor RW
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 01 atau RW 05"
                    value={formData.rwName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, rwName: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 text-slate-900 dark:text-slate-100 placeholder-slate-400 transition-all"
                  />
                </div>
              </div>

              {/* Field 4: Alamat Posko */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Alamat Lengkap Posko
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Jl. Cisitu Indah No. 20, RT 03 / RW 08, Kelurahan Dago"
                  value={formData.alamat}
                  onChange={(e) => setFormData((prev) => ({ ...prev, alamat: e.target.value }))}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 text-slate-900 dark:text-slate-100 placeholder-slate-400 transition-all"
                />
              </div>

              {/* Field 5: Ketua Posko (PIC) & Kontak */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Ketua Posko (PIC)
                  </label>
                  <input
                    type="text"
                    placeholder="Nama Ketua Posko / Mahasiswa"
                    value={formData.pic}
                    onChange={(e) => setFormData((prev) => ({ ...prev, pic: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 text-slate-900 dark:text-slate-100 placeholder-slate-400 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    No. WhatsApp / Telepon PIC
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    <input
                      type="text"
                      placeholder="081234567890"
                      value={formData.kontak}
                      onChange={(e) => setFormData((prev) => ({ ...prev, kontak: e.target.value }))}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 text-slate-900 dark:text-slate-100 placeholder-slate-400 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Field 6: Titik Koordinat GPS (Interactive Picker) */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                    <MapPin size={14} className="text-indigo-600 dark:text-indigo-400" />
                    Titik Koordinat GPS Posko <span className="text-rose-500">*</span>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDetectGps}
                      disabled={isDetectingGps}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 transition cursor-pointer flex items-center gap-1 shadow-2xs"
                    >
                      {isDetectingGps ? (
                        <Loader2 size={12} className="animate-spin text-indigo-600" />
                      ) : (
                        <Crosshair size={12} />
                      )}
                      <span>Lokasi Saya (GPS)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSetKelurahanCentroid(formData.kelurahan)}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-indigo-50 transition cursor-pointer flex items-center gap-1 shadow-2xs"
                      title="Set koordinat ke titik tengah kelurahan"
                    >
                      <Navigation size={12} />
                      <span>Pusat Kelurahan</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                      Latitude
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="-6.89030"
                      value={formData.latitude}
                      onChange={(e) => setFormData((prev) => ({ ...prev, latitude: e.target.value }))}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                      Longitude
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="107.61100"
                      value={formData.longitude}
                      onChange={(e) => setFormData((prev) => ({ ...prev, longitude: e.target.value }))}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* Field 7: Foto Posko Upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Foto Posko KKN
                </label>
                
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                  {previewPhotoUrl ? (
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-slate-200 dark:border-slate-700">
                      <img
                        src={previewPhotoUrl}
                        alt="Preview Foto"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setPreviewPhotoUrl(null);
                        }}
                        className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 text-white hover:bg-rose-700 transition cursor-pointer"
                        title="Hapus foto"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex flex-col items-center justify-center shrink-0">
                      <Upload size={22} />
                      <span className="text-[10px] font-bold mt-1">Upload Foto</span>
                    </div>
                  )}

                  <div className="flex-1 text-center sm:text-left space-y-1">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Unggah foto fisik bangunan posko KKN
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Format JPG, PNG, atau WEBP. Maksimal ukuran 5 MB.
                    </p>
                    <input
                      type="file"
                      id="posko-file-input"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="posko-file-input"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-xs font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer shadow-2xs mt-1"
                    >
                      <Upload size={12} /> Pilih File Foto
                    </label>
                  </div>
                </div>
              </div>

              {/* Field 8: Status Persetujuan */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Status Verifikasi Posko
                </label>
                <div className="flex gap-3">
                  <label className={`flex-1 p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                    formData.statusApproval === "APPROVED"
                      ? "bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-500 text-emerald-900 dark:text-emerald-300 font-extrabold"
                      : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium"
                  }`}>
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle2 size={16} className={formData.statusApproval === "APPROVED" ? "text-emerald-600" : "text-slate-400"} />
                      <span>Aktif &amp; Terverifikasi (APPROVED)</span>
                    </div>
                    <input
                      type="radio"
                      name="statusApproval"
                      value="APPROVED"
                      checked={formData.statusApproval === "APPROVED"}
                      onChange={() => setFormData((prev) => ({ ...prev, statusApproval: "APPROVED" }))}
                      className="accent-emerald-600"
                    />
                  </label>

                  <label className={`flex-1 p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                    formData.statusApproval === "PENDING"
                      ? "bg-amber-50/60 dark:bg-amber-950/30 border-amber-500 text-amber-900 dark:text-amber-300 font-extrabold"
                      : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium"
                  }`}>
                    <div className="flex items-center gap-2 text-xs">
                      <Clock size={16} className={formData.statusApproval === "PENDING" ? "text-amber-600" : "text-slate-400"} />
                      <span>Menunggu Approval (PENDING)</span>
                    </div>
                    <input
                      type="radio"
                      name="statusApproval"
                      value="PENDING"
                      checked={formData.statusApproval === "PENDING"}
                      onChange={() => setFormData((prev) => ({ ...prev, statusApproval: "PENDING" }))}
                      className="accent-amber-600"
                    />
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-extrabold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>{formMode === "add" ? "Simpan Posko Baru" : "Simpan Perubahan"}</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. LIGHTBOX IMAGE PREVIEW MODAL                                           */}
      {/* ========================================================================= */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div 
            className="relative max-w-3xl w-full bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                  {previewImage.title}
                </h3>
                {previewImage.subtitle && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {previewImage.subtitle}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="relative max-h-[70vh] bg-slate-950 flex items-center justify-center overflow-hidden">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>Pratinjau Foto Posko KKN</span>
              <a
                href={previewImage.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-semibold"
              >
                Buka Ukuran Penuh <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. CONFIRM MODAL HAPUS POSKO KKN                                          */}
      {/* ========================================================================= */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, posko: null, isLoading: false })}
        onConfirm={handleDeleteConfirm}
        title="Hapus Posko KKN"
        message={`Apakah Anda yakin ingin menghapus data posko "${deleteModal.posko?.nama}"? Data yang telah dihapus tidak dapat dikembalikan.`}
        confirmText="Ya, Hapus Posko"
        cancelText="Batal"
        type="danger"
        isLoading={deleteModal.isLoading}
      />

    </div>
  );
};

export default PoskoKknPage;
