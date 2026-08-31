/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Portal RW: Fasilitas Lingkungan, Peta GIS Interaktif, Catatan Produksi & Ide Daur Ulang
 */

import React, { useEffect, useState, useMemo } from "react";
import api from "../../utils/api";
import toast from "react-hot-toast";
import { exportToXlsx } from "../../utils/exportXlsx";
import {
  MapContainer,
  Marker,
  Popup,
  Polygon,
  useMap,
  useMapEvents
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { ThemeTileLayer } from "../../components/common/ThemeTileLayer";
import {
  CoblongGeo,
  KELURAHAN_GEODATA,
  createFacilityIcon
} from "../../constants/coblongGeoData";
import {
  Building2,
  Lightbulb,
  Scale,
  TrendingUp,
  MapPin,
  Plus,
  Check,
  X,
  Eye,
  Sparkles,
  Search,
  RefreshCw,
  Layers,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  User,
  Sprout,
  FileSpreadsheet
} from "lucide-react";

// Helper component to smoothly center Leaflet map
const MapFlyTo: React.FC<{ center: [number, number]; zoom?: number }> = ({
  center,
  zoom = 16
}) => {
  const map = useMap();
  useEffect(() => {
    if (center && !isNaN(center[0]) && !isNaN(center[1])) {
      map.flyTo(center, zoom, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
};

// Helper component for coordinate selection via map click in Add Facility modal
const LocationPicker: React.FC<{
  position: [number, number] | null;
  onPositionChange: (pos: [number, number]) => void;
}> = ({ position, onPositionChange }) => {
  useMapEvents({
    click(e) {
      onPositionChange([e.latlng.lat, e.latlng.lng]);
    }
  });

  return position ? (
    <Marker position={position} icon={createFacilityIcon("posko_kkn", "Titik Terpilih")} />
  ) : null;
};

export const RwFacilityInput: React.FC = () => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<
    "overview_map" | "production" | "recycle_ideas" | "pending_facilities"
  >("overview_map");

  // Data states
  const [facilities, setFacilities] = useState<any[]>([]);
  const [pendingIde, setPendingIde] = useState<any[]>([]);
  const [pendingFacilities, setPendingFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Map & GIS states
  const [selectedFacilityOnMap, setSelectedFacilityOnMap] = useState<any | null>(null);
  const [mapCategoryFilter, setMapCategoryFilter] = useState<string>("ALL");
  const [mapSearchQuery, setMapSearchQuery] = useState<string>("");
  const [mapCenter, setMapCenter] = useState<[number, number]>(CoblongGeo.CENTER);
  const [mapZoom, setMapZoom] = useState<number>(14);

  // Production Form states
  const [selectedFacilityId, setSelectedFacilityId] = useState("");
  const [materialMasuk, setMaterialMasuk] = useState("");
  const [output, setOutput] = useState("");
  const [jenisOutput, setJenisOutput] = useState("");
  const [periode, setPeriode] = useState("");
  const [submittingProduction, setSubmittingProduction] = useState(false);

  // Production Log filters
  const [prodSearchQuery, setProdSearchQuery] = useState("");
  const [prodFacilityFilter, setProdFacilityFilter] = useState("ALL");

  // Idea review filter & states
  const [ideaSearchQuery, setIdeaSearchQuery] = useState("");
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  // Rejection Dialog state
  const [rejectModal, setRejectModal] = useState<{
    isOpen: boolean;
    type: "IDE" | "FACILITY";
    id: string;
    title: string;
    reason: string;
  }>({
    isOpen: false,
    type: "IDE",
    id: "",
    title: "",
    reason: ""
  });

  // Add Facility Modal state
  const [isAddFacilityModalOpen, setIsAddFacilityModalOpen] = useState(false);
  const [newFacilityForm, setNewFacilityForm] = useState({
    nama: "",
    jenis: "loseda",
    pic: "",
    kontak: "",
    kapasitas: "",
    alamat: "",
    latitude: -6.8906,
    longitude: 107.6150
  });
  const [creatingFacility, setCreatingFacility] = useState(false);

  // Auto-generate suggested current period
  useEffect(() => {
    const now = new Date();
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
      "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
    ];
    const weekNum = Math.ceil(now.getDate() / 7);
    const suggestedPeriod = `Minggu ${weekNum} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;
    if (!periode) {
      setPeriode(suggestedPeriod);
    }
  }, [periode]);

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);

    try {
      const [facRes, ideRes, pendFacRes] = await Promise.all([
        api.get("/rw/facilities").catch(() => ({ data: [] })),
        api.get("/rw/ide").catch(() => ({ data: [] })),
        api.get("/rw/facilities/pending").catch(() => ({ data: [] }))
      ]);

      const facData = Array.isArray(facRes.data) ? facRes.data : facRes.data?.data || [];
      const ideData = Array.isArray(ideRes.data) ? ideRes.data : ideRes.data?.data || [];
      const pendFacData = Array.isArray(pendFacRes.data) ? pendFacRes.data : pendFacRes.data?.data || [];

      setFacilities(facData);
      setPendingIde(ideData);
      setPendingFacilities(pendFacData);

      if (facData.length > 0 && !selectedFacilityId) {
        setSelectedFacilityId(facData[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch RW facility data", error);
      toast.error("Gagal memuat data fasilitas dan ide");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Quick helper calculations
  const allProductionLogs = useMemo(() => {
    const logs: any[] = [];
    facilities.forEach((f) => {
      if (Array.isArray(f.productionLogs)) {
        f.productionLogs.forEach((log: any) => {
          logs.push({
            ...log,
            facilityName: f.nama,
            facilityJenis: f.jenis,
            facilityPic: f.pic
          });
        });
      }
    });
    return logs.sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }, [facilities]);

  const totalMaterialMasukKg = useMemo(() => {
    return allProductionLogs.reduce((acc, curr) => acc + Number(curr.materialMasukKg || 0), 0);
  }, [allProductionLogs]);

  const totalOutputKg = useMemo(() => {
    return allProductionLogs.reduce((acc, curr) => acc + Number(curr.outputKg || 0), 0);
  }, [allProductionLogs]);

  const overallConversionEfficiency = useMemo(() => {
    if (totalMaterialMasukKg === 0) return 0;
    return Math.min(100, Math.round((totalOutputKg / totalMaterialMasukKg) * 100));
  }, [totalMaterialMasukKg, totalOutputKg]);

  // Form Conversion live calculation
  const liveConversionRate = useMemo(() => {
    const masuk = parseFloat(materialMasuk);
    const keluar = parseFloat(output);
    if (!masuk || !keluar || isNaN(masuk) || isNaN(keluar) || masuk <= 0) return null;
    const rate = ((keluar / masuk) * 100).toFixed(1);
    return parseFloat(rate);
  }, [materialMasuk, output]);

  // Filtered facilities for map & directory
  const filteredFacilities = useMemo(() => {
    return facilities.filter((f) => {
      const matchCat = mapCategoryFilter === "ALL" || f.jenis === mapCategoryFilter;
      const matchSearch =
        !mapSearchQuery ||
        f.nama.toLowerCase().includes(mapSearchQuery.toLowerCase()) ||
        (f.alamat && f.alamat.toLowerCase().includes(mapSearchQuery.toLowerCase())) ||
        (f.pic && f.pic.toLowerCase().includes(mapSearchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [facilities, mapCategoryFilter, mapSearchQuery]);

  // Filtered Production Logs
  const filteredProductionLogs = useMemo(() => {
    return allProductionLogs.filter((log) => {
      const matchFac = prodFacilityFilter === "ALL" || log.facilityId === prodFacilityFilter;
      const matchSearch =
        !prodSearchQuery ||
        (log.facilityName && log.facilityName.toLowerCase().includes(prodSearchQuery.toLowerCase())) ||
        (log.jenisOutput && log.jenisOutput.toLowerCase().includes(prodSearchQuery.toLowerCase())) ||
        (log.periode && log.periode.toLowerCase().includes(prodSearchQuery.toLowerCase()));
      return matchFac && matchSearch;
    });
  }, [allProductionLogs, prodFacilityFilter, prodSearchQuery]);

  // Filtered Recycle Ideas
  const filteredIdeas = useMemo(() => {
    return pendingIde.filter((ide) => {
      const matchSearch =
        !ideaSearchQuery ||
        ide.judul.toLowerCase().includes(ideaSearchQuery.toLowerCase()) ||
        (ide.material && ide.material.toLowerCase().includes(ideaSearchQuery.toLowerCase())) ||
        (ide.user?.name && ide.user.name.toLowerCase().includes(ideaSearchQuery.toLowerCase()));
      return matchSearch;
    });
  }, [pendingIde, ideaSearchQuery]);

  // Action handlers
  const handleVerifyIde = async (id: string, action: "APPROVED" | "REJECTED", reason?: string) => {
    try {
      await api.put(`/rw/ide/${id}/verify`, { action, rejectionReason: reason });
      if (action === "APPROVED") {
        toast.success("Ide disetujui! Warga memperoleh +50 Poin Gamifikasi.");
      } else {
        toast.error("Pengajuan ide telah ditolak.");
      }
      setRejectModal((prev) => ({ ...prev, isOpen: false }));
      fetchData();
    } catch (error: any) {
      console.error("Failed to verify ide", error);
      toast.error(error?.response?.data?.message || "Gagal memverifikasi ide");
    }
  };

  const handleVerifyFacility = async (
    id: string,
    action: "APPROVED" | "REJECTED",
    reason?: string
  ) => {
    try {
      await api.put(`/rw/facilities/${id}/verify`, { action, rejectionReason: reason });
      if (action === "APPROVED") {
        toast.success("Fasilitas lingkungan berhasil diverifikasi & diaktifkan!");
      } else {
        toast.error("Pendaftaran fasilitas telah ditolak.");
      }
      setRejectModal((prev) => ({ ...prev, isOpen: false }));
      fetchData();
    } catch (error: any) {
      console.error("Failed to verify facility", error);
      toast.error(error?.response?.data?.message || "Gagal memverifikasi fasilitas");
    }
  };

  const handleSubmitProduction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFacilityId) {
      toast.error("Silakan pilih fasilitas terlebih dahulu");
      return;
    }
    setSubmittingProduction(true);
    try {
      await api.post(`/rw/facilities/${selectedFacilityId}/production`, {
        materialMasukKg: parseFloat(materialMasuk),
        outputKg: parseFloat(output),
        jenisOutput,
        periode
      });
      toast.success("Data produksi fasilitas berhasil disimpan!");
      setMaterialMasuk("");
      setOutput("");
      setJenisOutput("");
      fetchData();
    } catch (error: any) {
      console.error("Failed to submit production data", error);
      toast.error(error?.response?.data?.message || "Gagal menyimpan data produksi");
    } finally {
      setSubmittingProduction(false);
    }
  };

  const handleCreateFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingFacility(true);
    try {
      await api.post("/facilities", {
        nama: newFacilityForm.nama,
        jenis: newFacilityForm.jenis,
        pic: newFacilityForm.pic,
        kontak: newFacilityForm.kontak,
        kapasitas: newFacilityForm.kapasitas ? parseFloat(newFacilityForm.kapasitas) : undefined,
        alamat: newFacilityForm.alamat,
        latitude: newFacilityForm.latitude,
        longitude: newFacilityForm.longitude
      });
      toast.success("Fasilitas baru berhasil didaftarkan!");
      setIsAddFacilityModalOpen(false);
      setNewFacilityForm({
        nama: "",
        jenis: "loseda",
        pic: "",
        kontak: "",
        kapasitas: "",
        alamat: "",
        latitude: -6.8906,
        longitude: 107.6150
      });
      fetchData();
    } catch (error: any) {
      console.error("Failed to create facility", error);
      toast.error(error?.response?.data?.message || "Gagal mendaftarkan fasilitas");
    } finally {
      setCreatingFacility(false);
    }
  };

  // Quick export CSV
  const handleExportCsv = () => {
    if (filteredProductionLogs.length === 0) {
      toast.error("Tidak ada data produksi untuk diekspor");
      return;
    }
    const headers = ["Nama Fasilitas", "Jenis", "Periode", "Material Masuk (Kg)", "Hasil Output (Kg)", "Jenis Output", "Tanggal Catat"];
    const rows = filteredProductionLogs.map((log) => [
      log.facilityName || "-",
      log.facilityJenis || "-",
      log.periode || "-",
      log.materialMasukKg,
      log.outputKg,
      log.jenisOutput || "-",
      new Date(log.createdAt).toLocaleDateString("id-ID"),
    ]);

    exportToXlsx(headers, rows, `Data_Produksi_Fasilitas_${new Date().toISOString().split("T")[0]}`, "Produksi");
    toast.success("Laporan data produksi berhasil diunduh (XLSX)");
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-9 w-64 skeleton-loading rounded-xl" />
          <div className="h-9 w-32 skeleton-loading rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 skeleton-loading rounded-2xl" />
          ))}
        </div>
        <div className="h-96 skeleton-loading rounded-2xl" />
      </div>
    );
  }

  const selectedFacilityObj = facilities.find((f) => f.id === selectedFacilityId);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl border border-emerald-200 dark:border-emerald-800/80 text-emerald-600 dark:text-emerald-400 shadow-xs">
              <Sprout size={24} className="stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Fasilitas &amp; Ide Daur Ulang
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                Peta geospasial fasilitas pengolahan, pencatatan hasil panen, dan apresiasi inovasi warga
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => setIsAddFacilityModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 rounded-xl transition-all shadow-sm shadow-emerald-600/20 cursor-pointer"
          >
            <Plus size={15} className="stroke-[2.5]" />
            <span>+ Fasilitas Baru</span>
          </button>
        </div>
      </div>

      {/* Overview KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Facilities */}
        <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/90 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
              Fasilitas Aktif
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Building2 size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
              {facilities.length}
            </span>
            <span className="text-xs text-slate-400 font-semibold">Titik Lokasi</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium truncate">
            {facilities.filter((f) => f.jenis === "posko_kkn").length} Posko KKN &bull;{" "}
            {facilities.filter((f) => f.jenis === "rumah_maggot").length} Maggot &bull;{" "}
            {facilities.filter((f) => f.jenis === "bank_sampah").length} Bank Sampah
          </p>
        </div>

        {/* Pending Review Alert */}
        <div
          onClick={() => {
            if (pendingIde.length > 0) setActiveTab("recycle_ideas");
            else if (pendingFacilities.length > 0) setActiveTab("pending_facilities");
          }}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            pendingIde.length + pendingFacilities.length > 0
              ? "bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60 hover:border-amber-300"
              : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/90"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Menunggu Review
            </span>
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
              <AlertCircle size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-700 dark:text-amber-300">
              {pendingIde.length + pendingFacilities.length}
            </span>
            <span className="text-xs text-amber-600/80 font-semibold">Pengajuan Baru</span>
          </div>
          <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-1 font-medium truncate">
            {pendingIde.length} Ide Warga (+50 Poin) &bull; {pendingFacilities.length} Fasilitas Baru
          </p>
        </div>

        {/* Total Waste Processed */}
        <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
              Material Terolah
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Scale size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
              {totalMaterialMasukKg.toLocaleString("id-ID")}
            </span>
            <span className="text-xs text-slate-400 font-semibold">Kg Masuk</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium truncate">
            Akumulasi input sampah organik &amp; bahan olahan
          </p>
        </div>

        {/* Total Harvest Output & Ratio */}
        <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
              Hasil Panen &amp; Efisiensi
            </span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-purple-700 dark:text-purple-300">
              {totalOutputKg.toLocaleString("id-ID")}
            </span>
            <span className="text-xs text-purple-600/80 font-bold">Kg Panen ({overallConversionEfficiency}%)</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium truncate">
            Kompos matang, maggot pupa, kasgot, dan POC
          </p>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex overflow-x-auto gap-2 p-1.5 bg-slate-100 dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 scrollbar-none">
        <button
          onClick={() => setActiveTab("overview_map")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === "overview_map"
              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/60 dark:border-slate-700"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
          }`}
        >
          <Layers size={16} className={activeTab === "overview_map" ? "text-emerald-600" : ""} />
          <span>Peta &amp; Direktori Fasilitas</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
            {facilities.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("production")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === "production"
              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/60 dark:border-slate-700"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
          }`}
        >
          <Scale size={16} className={activeTab === "production" ? "text-blue-600" : ""} />
          <span>Pencatatan &amp; Log Produksi</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
            {allProductionLogs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("recycle_ideas")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === "recycle_ideas"
              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/60 dark:border-slate-700"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
          }`}
        >
          <Lightbulb size={16} className={activeTab === "recycle_ideas" ? "text-amber-500" : ""} />
          <span>Ide Daur Ulang Warga</span>
          {pendingIde.length > 0 && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500 text-white font-bold animate-pulse">
              {pendingIde.length} Baru
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("pending_facilities")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === "pending_facilities"
              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/60 dark:border-slate-700"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
          }`}
        >
          <Building2 size={16} className={activeTab === "pending_facilities" ? "text-purple-600" : ""} />
          <span>Pendaftaran Fasilitas Baru</span>
          {pendingFacilities.length > 0 && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-600 text-white font-bold">
              {pendingFacilities.length}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PETA INTERAKTIF & DIREKTORI FASILITAS */}
      {/* ========================================================================= */}
      {activeTab === "overview_map" && (
        <div className="space-y-4">
          {/* Map Filters Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/90 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama fasilitas, alamat, atau PIC..."
                value={mapSearchQuery}
                onChange={(e) => setMapSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto scrollbar-none">
              {[
                { key: "ALL", label: "Semua", icon: "🌐" },
                { key: "posko_kkn", label: "Posko KKN", icon: "📍" },
                { key: "rumah_maggot", label: "Maggot BSF", icon: "🐛" },
                { key: "bank_sampah", label: "Bank Sampah", icon: "🏦" },
                { key: "loseda", label: "Loseda / Kompos", icon: "🌱" },
                { key: "bata_terawang", label: "Bata Terawang", icon: "🧱" },
                { key: "poc", label: "Pupuk Cair (POC)", icon: "💧" }
              ].map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setMapCategoryFilter(cat.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                    mapCategoryFilter === cat.key
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive GIS Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Leaflet Map Box */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/90 shadow-xs overflow-hidden relative">
              <div className="h-[480px] sm:h-[540px] w-full z-0">
                <MapContainer
                  center={mapCenter}
                  zoom={mapZoom}
                  className="h-full w-full"
                  scrollWheelZoom={true}
                >
                  <ThemeTileLayer />
                  <MapFlyTo center={mapCenter} zoom={mapZoom} />

                  {/* Kelurahan Boundary Polygon for Context */}
                  {Object.values(KELURAHAN_GEODATA).map((kel) => (
                    <Polygon
                      key={kel.id}
                      positions={kel.bounds}
                      pathOptions={{
                        color: kel.color,
                        weight: 1.5,
                        fillOpacity: 0.05,
                        dashArray: "4, 4"
                      }}
                    />
                  ))}

                  {/* Facility Pins */}
                  {filteredFacilities.map((fac) => {
                    const lat = parseFloat(fac.latitude);
                    const lng = parseFloat(fac.longitude);
                    if (isNaN(lat) || isNaN(lng)) return null;

                    return (
                      <Marker
                        key={fac.id}
                        position={[lat, lng]}
                        icon={createFacilityIcon(fac.jenis, fac.nama)}
                        eventHandlers={{
                          click: () => {
                            setSelectedFacilityOnMap(fac);
                            setMapCenter([lat, lng]);
                            setMapZoom(16);
                          }
                        }}
                      >
                        <Popup className="custom-popup">
                          <div className="p-1 max-w-xs space-y-2 text-slate-800 font-sans">
                            <div className="flex items-center justify-between border-b pb-1.5">
                              <span className="font-extrabold text-xs uppercase text-emerald-700 tracking-wider">
                                {fac.jenis.replace("_", " ")}
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                Aktif
                              </span>
                            </div>
                            <h4 className="font-black text-sm text-slate-900">{fac.nama}</h4>
                            <p className="text-xs text-slate-500 flex items-start gap-1">
                              <MapPin size={12} className="mt-0.5 shrink-0 text-slate-400" />
                              <span>{fac.alamat || "Alamat tidak dicantumkan"}</span>
                            </p>
                            <div className="grid grid-cols-2 gap-1 text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100">
                              <div>
                                <span className="text-slate-400 block text-[9px] uppercase font-bold">PIC</span>
                                <span className="font-bold text-slate-700">{fac.pic || "-"}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[9px] uppercase font-bold">Kapasitas</span>
                                <span className="font-bold text-slate-700">
                                  {fac.kapasitas ? `${fac.kapasitas} Kg` : "-"}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedFacilityId(fac.id);
                                setActiveTab("production");
                              }}
                              className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-all"
                            >
                              <Scale size={12} />
                              <span>Catat Produksi</span>
                            </button>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              </div>

              {/* Map Floating Indicator */}
              <div className="absolute top-3 left-3 z-[400] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{filteredFacilities.length} Fasilitas Ditampilkan</span>
              </div>
            </div>

            {/* Facility List Sidebar */}
            <div className="lg:col-span-4 space-y-3 max-h-[540px] overflow-y-auto pr-1">
              {filteredFacilities.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/90 text-slate-400 space-y-2">
                  <Building2 size={32} className="mx-auto text-slate-300 dark:text-slate-700" />
                  <p className="text-xs font-bold">Tidak ada fasilitas yang cocok dengan filter pencarian.</p>
                </div>
              ) : (
                filteredFacilities.map((fac) => {
                  const isSelected = selectedFacilityOnMap?.id === fac.id;
                  const logCount = fac.productionLogs?.length || 0;

                  return (
                    <div
                      key={fac.id}
                      onClick={() => {
                        setSelectedFacilityOnMap(fac);
                        const lat = parseFloat(fac.latitude);
                        const lng = parseFloat(fac.longitude);
                        if (!isNaN(lat) && !isNaN(lng)) {
                          setMapCenter([lat, lng]);
                          setMapZoom(16);
                        }
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-500 shadow-sm"
                          : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              fac.jenis === "posko_kkn"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : fac.jenis === "rumah_maggot"
                                ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                            }`}
                          >
                            {fac.jenis === "posko_kkn" ? "📍 POSKO KKN" : fac.jenis.replace("_", " ").toUpperCase()}
                          </span>
                          <h4 className="font-black text-sm text-slate-900 dark:text-slate-100 mt-1">
                            {fac.nama}
                          </h4>
                        </div>
                        <span className="text-[11px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md shrink-0">
                          {logCount} Log
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex items-start gap-1 line-clamp-2">
                        <MapPin size={12} className="mt-0.5 shrink-0 text-slate-400" />
                        <span>{fac.alamat || "Alamat tidak dicantumkan"}</span>
                      </p>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400 font-medium truncate max-w-[150px]">
                          PIC: <strong className="text-slate-700 dark:text-slate-200">{fac.pic || "-"}</strong>
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFacilityId(fac.id);
                            setActiveTab("production");
                          }}
                          className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                        >
                          <span>Input Produksi</span>
                          <ChevronRight size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PENCATATAN & MONITORING PRODUKSI FASILITAS */}
      {/* ========================================================================= */}
      {activeTab === "production" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form: Smart Input Production Form */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/90 p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
              <div>
                <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
                  Input Manual Data Produksi
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Catat konversi material masuk &amp; panen fasilitas
                </p>
              </div>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <Scale size={18} />
              </div>
            </div>

            <form onSubmit={handleSubmitProduction} className="space-y-4">
              {/* Facility Select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Pilih Fasilitas (Aktif) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedFacilityId}
                  onChange={(e) => setSelectedFacilityId(e.target.value)}
                  required
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="">-- Pilih Fasilitas Pengolahan --</option>
                  {facilities.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nama} ({f.jenis.replace("_", " ").toUpperCase()})
                    </option>
                  ))}
                </select>
                {selectedFacilityObj && (
                  <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    📍 {selectedFacilityObj.alamat || "Lokasi RW bersangkutan"} &bull; Kapasitas:{" "}
                    {selectedFacilityObj.kapasitas ? `${selectedFacilityObj.kapasitas} Kg` : "Tidak dibatasi"}
                  </p>
                )}
              </div>

              {/* Periode Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Periode Produksi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Misal: Minggu 3 Agustus 2026"
                  required
                  value={periode}
                  onChange={(e) => setPeriode(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Material Masuk & Hasil Output (Side-by-Side) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Material Masuk (Kg) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    placeholder="0.0"
                    required
                    value={materialMasuk}
                    onChange={(e) => setMaterialMasuk(e.target.value)}
                    className="w-full text-xs sm:text-sm font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Hasil Output (Kg) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    placeholder="0.0"
                    required
                    value={output}
                    onChange={(e) => setOutput(e.target.value)}
                    className="w-full text-xs sm:text-sm font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Real-time Conversion Rate Calculation Badge */}
              {liveConversionRate !== null && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-600 dark:text-slate-400">Rasio Konversi Reduksi:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                      {liveConversionRate}%
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        liveConversionRate >= 20 && liveConversionRate <= 40
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                      }`}
                    >
                      {liveConversionRate >= 20 && liveConversionRate <= 40 ? "Rasio Ideal" : "Hasil Tercatat"}
                    </span>
                  </div>
                </div>
              )}

              {/* Jenis Output Input & Quick Chips */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Jenis Output / Hasil Olahan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Misal: Pupuk Kompos Matang / Maggot Fresh"
                  required
                  value={jenisOutput}
                  onChange={(e) => setJenisOutput(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />

                {/* Quick Chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[
                    "Pupuk Kompos Matang",
                    "Maggot BSF Fresh",
                    "Pupa / Pre-Pupa BSF",
                    "Pupuk Kasgot",
                    "Pupuk Organik Cair (POC)",
                    "Cacahan Plastik Press",
                    "Tabungan Bank Sampah"
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setJenisOutput(chip)}
                      className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[11px] font-medium transition-colors"
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!selectedFacilityId || submittingProduction}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-600/20 disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center gap-2"
              >
                {submittingProduction ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={16} />
                )}
                <span>Simpan Data Produksi</span>
              </button>
            </form>
          </div>

          {/* Right Table: Comprehensive Production Logs */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/90 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
              <div>
                <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
                  Riwayat &amp; Log Produksi Fasilitas
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Total {filteredProductionLogs.length} catatan panen terdaftar
                </p>
              </div>
              <button
                onClick={handleExportCsv}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl hover:bg-emerald-100 transition-all self-start sm:self-auto"
              >
                <FileSpreadsheet size={14} />
                <span>Ekspor CSV</span>
              </button>
            </div>

            {/* Log Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari log hasil atau periode..."
                  value={prodSearchQuery}
                  onChange={(e) => setProdSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <select
                value={prodFacilityFilter}
                onChange={(e) => setProdFacilityFilter(e.target.value)}
                className="w-full py-1.5 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium"
              >
                <option value="ALL">Semua Fasilitas</option>
                {facilities.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nama}
                  </option>
                ))}
              </select>
            </div>

            {/* Log Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-3.5 py-2.5">Fasilitas &amp; Periode</th>
                    <th className="px-3.5 py-2.5 text-right">Masuk (Kg)</th>
                    <th className="px-3.5 py-2.5 text-right">Panen (Kg)</th>
                    <th className="px-3.5 py-2.5">Jenis Output</th>
                    <th className="px-3.5 py-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredProductionLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Belum ada catatan data produksi tersimpan.
                      </td>
                    </tr>
                  ) : (
                    filteredProductionLogs.slice(0, 15).map((log) => (
                      <tr
                        key={log.id}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-3.5 py-3">
                          <strong className="block text-slate-900 dark:text-slate-100 font-bold">
                            {log.facilityName}
                          </strong>
                          <span className="text-[11px] text-slate-400">{log.periode}</span>
                        </td>
                        <td className="px-3.5 py-3 text-right font-mono font-bold text-slate-600 dark:text-slate-400">
                          {Number(log.materialMasukKg).toFixed(1)}
                        </td>
                        <td className="px-3.5 py-3 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                          {Number(log.outputKg).toFixed(1)}
                        </td>
                        <td className="px-3.5 py-3">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                            {log.jenisOutput}
                          </span>
                        </td>
                        <td className="px-3.5 py-3 text-center">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            <Check size={10} className="stroke-[3]" /> Terverifikasi
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: VERIFIKASI IDE DAUR ULANG WARGA */}
      {/* ========================================================================= */}
      {activeTab === "recycle_ideas" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/90 p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-slate-100">
                  Pengajuan Ide Inovasi Daur Ulang Warga
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  +50 Poin Gamifikasi / Persetujuan
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Verifikasi ide pemanfaatan sampah kreatif dari warga untuk mendapatkan insentif poin sistem
              </p>
            </div>

            <div className="relative max-w-xs w-full">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari judul ide, material, atau warga..."
                value={ideaSearchQuery}
                onChange={(e) => setIdeaSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          {filteredIdeas.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <Lightbulb size={40} className="mx-auto text-slate-300 dark:text-slate-700" />
              <div>
                <p className="font-bold text-sm text-slate-600 dark:text-slate-300">
                  Tidak ada pengajuan ide daur ulang baru yang menunggu persetujuan.
                </p>
                <p className="text-xs text-slate-400">
                  Warga dapat mengirimkan ide kreasi pengolahan daur ulang melalui aplikasi mobile.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredIdeas.map((ide) => (
                <div
                  key={ide.id}
                  className="bg-slate-50/60 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-4 flex flex-col justify-between hover:shadow-md transition-all group"
                >
                  <div className="space-y-3">
                    {/* Header: Judul & Pengusul */}
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {ide.sumber || "WARGA"}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(ide.createdAt).toLocaleDateString("id-ID")}
                        </span>
                      </div>
                      <h4 className="font-black text-base text-slate-900 dark:text-slate-100 mt-1.5">
                        {ide.judul}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <User size={12} className="text-slate-400" />
                        <span>Oleh: <strong className="text-slate-700 dark:text-slate-300">{ide.user?.name || "Warga"}</strong></span>
                      </p>
                    </div>

                    {/* Material Tag */}
                    <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                      <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                        Bahan / Material:
                      </span>
                      <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                        {ide.material || "Bahan daur ulang umum"}
                      </p>
                    </div>

                    {/* Foto Lampiran */}
                    {ide.foto && (
                      <div
                        onClick={() => setPreviewPhotoUrl(ide.foto)}
                        className="relative h-40 rounded-xl overflow-hidden cursor-pointer group/img border border-slate-200 dark:border-slate-700"
                      >
                        <img
                          src={ide.foto}
                          alt={ide.judul}
                          className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1.5 backdrop-blur-2xs">
                          <Eye size={16} />
                          <span>Perbesar Foto</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center gap-2">
                    <button
                      onClick={() => handleVerifyIde(ide.id, "APPROVED")}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <Sparkles size={14} />
                      <span>Setujui (+50 Poin)</span>
                    </button>
                    <button
                      onClick={() =>
                        setRejectModal({
                          isOpen: true,
                          type: "IDE",
                          id: ide.id,
                          title: ide.judul,
                          reason: ""
                        })
                      }
                      className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 rounded-xl font-bold text-xs border border-rose-200 dark:border-rose-800 transition-all flex items-center justify-center"
                    >
                      <X size={14} />
                      <span>Tolak</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: PENDAFTARAN FASILITAS LINGKUNGAN BARU */}
      {/* ========================================================================= */}
      {activeTab === "pending_facilities" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/90 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-slate-100">
                Verifikasi Pengajuan Fasilitas Baru &amp; Posko KKN
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Tinjau kelayakan lokasi dan validasi titik koordinat GPS sebelum fasilitas aktif di peta
              </p>
            </div>
            <button
              onClick={() => setIsAddFacilityModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs self-start sm:self-auto"
            >
              <Plus size={14} className="stroke-[2.5]" />
              <span>+ Daftarkan Fasilitas</span>
            </button>
          </div>

          {pendingFacilities.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <Building2 size={40} className="mx-auto text-slate-300 dark:text-slate-700" />
              <div>
                <p className="font-bold text-sm text-slate-600 dark:text-slate-300">
                  Tidak ada pendaftaran fasilitas baru yang menunggu verifikasi.
                </p>
                <p className="text-xs text-slate-400">
                  Semua fasilitas dan Posko KKN di wilayah RW Anda telah aktif dan terverifikasi.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Nama &amp; Jenis Fasilitas</th>
                    <th className="px-4 py-3">Alamat &amp; GPS Koordinat</th>
                    <th className="px-4 py-3">PIC / Kontak Pendaftar</th>
                    <th className="px-4 py-3 text-center">Aksi Verifikasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {pendingFacilities.map((fac) => (
                    <tr
                      key={fac.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-4 py-3.5">
                        <strong className="block text-slate-900 dark:text-slate-100 font-bold text-sm">
                          {fac.nama}
                        </strong>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              fac.jenis === "posko_kkn"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                            }`}
                          >
                            {fac.jenis === "posko_kkn" ? "📍 Posko KKN Mahasiswa" : fac.jenis.replace("_", " ").toUpperCase()}
                          </span>
                          {fac.foto && (
                            <button
                              onClick={() => setPreviewPhotoUrl(fac.foto)}
                              className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-bold flex items-center gap-0.5"
                            >
                              <Eye size={11} /> Lihat Foto
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-400">
                        <p className="font-medium">{fac.alamat || "Alamat tidak dicantumkan"}</p>
                        <p className="text-slate-400 font-mono text-[11px] mt-0.5">
                          Lat: {Number(fac.latitude).toFixed(6)}, Lng: {Number(fac.longitude).toFixed(6)}
                        </p>
                      </td>

                      <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-400">
                        <p className="font-bold text-slate-800 dark:text-slate-200">{fac.pic || "-"}</p>
                        <p className="text-slate-400 font-mono">{fac.kontak || "-"}</p>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleVerifyFacility(fac.id, "APPROVED")}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-1"
                          >
                            <Check size={13} className="stroke-[2.5]" />
                            <span>Setujui</span>
                          </button>
                          <button
                            onClick={() =>
                              setRejectModal({
                                isOpen: true,
                                type: "FACILITY",
                                id: fac.id,
                                title: fac.nama,
                                reason: ""
                              })
                            }
                            className="bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1"
                          >
                            <X size={13} />
                            <span>Tolak</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DAFTARKAN FASILITAS BARU LANGSUNG (WITH INTERACTIVE PINPICKER) */}
      {/* ========================================================================= */}
      {isAddFacilityModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-2xl w-full shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-xl">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900 dark:text-slate-100">
                    Daftarkan Fasilitas Lingkungan Baru
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Tentukan titik GPS di peta dan lengkapi rincian penanggung jawab
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddFacilityModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateFacility} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Nama Fasilitas <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Misal: Rumah Maggot Mandiri RW 04"
                    value={newFacilityForm.nama}
                    onChange={(e) => setNewFacilityForm({ ...newFacilityForm, nama: e.target.value })}
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Jenis Fasilitas <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newFacilityForm.jenis}
                    onChange={(e) => setNewFacilityForm({ ...newFacilityForm, jenis: e.target.value })}
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                  >
                    <option value="loseda">Loseda (Lodong Sesa Dapur)</option>
                    <option value="rumah_maggot">Rumah Maggot BSF</option>
                    <option value="bank_sampah">Bank Sampah Unit</option>
                    <option value="bata_terawang">Bata Terawang / Komposter</option>
                    <option value="poc">Instalasi Pupuk Cair (POC)</option>
                    <option value="buruan_sae">Buruan SAE Lingkungan</option>
                    <option value="posko_kkn">Posko KKN Mahasiswa</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    PIC / Penanggung Jawab <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nama PIC"
                    value={newFacilityForm.pic}
                    onChange={(e) => setNewFacilityForm({ ...newFacilityForm, pic: e.target.value })}
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Nomor WhatsApp / HP
                  </label>
                  <input
                    type="text"
                    placeholder="081234567890"
                    value={newFacilityForm.kontak}
                    onChange={(e) => setNewFacilityForm({ ...newFacilityForm, kontak: e.target.value })}
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Kapasitas (Kg)
                  </label>
                  <input
                    type="number"
                    step="1"
                    placeholder="Misal: 250"
                    value={newFacilityForm.kapasitas}
                    onChange={(e) => setNewFacilityForm({ ...newFacilityForm, kapasitas: e.target.value })}
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Alamat Lengkap / Keterangan Lokasi
                </label>
                <input
                  type="text"
                  placeholder="Misal: Samping Balai Warga RT 02 / RW 04"
                  value={newFacilityForm.alamat}
                  onChange={(e) => setNewFacilityForm({ ...newFacilityForm, alamat: e.target.value })}
                  className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Interactive Mini Map GPS Picker */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Pilih Titik Koordinat GPS di Peta <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] font-mono text-emerald-600 font-bold">
                    Lat: {newFacilityForm.latitude.toFixed(6)}, Lng: {newFacilityForm.longitude.toFixed(6)}
                  </span>
                </div>

                <div className="h-56 w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 relative">
                  <MapContainer
                    center={[newFacilityForm.latitude, newFacilityForm.longitude]}
                    zoom={15}
                    className="h-full w-full"
                  >
                    <ThemeTileLayer />
                    <LocationPicker
                      position={[newFacilityForm.latitude, newFacilityForm.longitude]}
                      onPositionChange={([lat, lng]) => {
                        setNewFacilityForm((prev) => ({
                          ...prev,
                          latitude: lat,
                          longitude: lng
                        }));
                      }}
                    />
                  </MapContainer>
                  <div className="absolute bottom-2 left-2 z-[400] bg-black/75 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-lg">
                    💡 Klik pada peta untuk memindahkan pin lokasi
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddFacilityModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={creatingFacility}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {creatingFacility ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>Daftarkan Fasilitas</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PHOTO LIGHTBOX PREVIEW */}
      {/* ========================================================================= */}
      {previewPhotoUrl && (
        <div
          onClick={() => setPreviewPhotoUrl(null)}
          className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
          <div className="relative max-w-3xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setPreviewPhotoUrl(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300 p-1"
            >
              <X size={24} />
            </button>
            <img
              src={previewPhotoUrl}
              alt="Preview"
              className="max-h-[80vh] w-auto object-contain rounded-2xl shadow-2xl border border-white/20"
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REJECTION REASON PROMPT */}
      {/* ========================================================================= */}
      {rejectModal.isOpen && (
        <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-rose-600">
              <div className="p-2 bg-rose-50 dark:bg-rose-950 rounded-xl">
                <AlertCircle size={20} />
              </div>
              <div>
                <h4 className="font-black text-base text-slate-900 dark:text-slate-100">
                  Konfirmasi Penolakan
                </h4>
                <p className="text-xs text-slate-400 font-medium">
                  {rejectModal.type === "IDE" ? "Ide Daur Ulang: " : "Fasilitas: "}
                  <strong>{rejectModal.title}</strong>
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Catatan / Alasan Penolakan (Opsional)
              </label>
              <textarea
                rows={3}
                placeholder="Contoh: Foto tidak jelas / konsep telah pernah diterapkan di RW sebelumnya..."
                value={rejectModal.reason}
                onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModal({ ...rejectModal, isOpen: false })}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (rejectModal.type === "IDE") {
                    handleVerifyIde(rejectModal.id, "REJECTED", rejectModal.reason);
                  } else {
                    handleVerifyFacility(rejectModal.id, "REJECTED", rejectModal.reason);
                  }
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-all"
              >
                Konfirmasi Tolak
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
