import { Loader2, Check, X, History, Trash2, Map, Plus, Download, Search, Filter, AlertTriangle, Pencil, Eye } from "lucide-react";

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
import { Pagination } from "../../components/common/Pagination";
import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import {
  KELURAHAN_GEODATA,
  createMapBinIcon,
  createRwZonaIcon,
  createKelurahanPinIcon,
  createHouseIcon,
} from "../../constants/coblongGeoData";
import { Layers } from "lucide-react";

// Fix default Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const MapEvents = ({
  setZoom,
  setSelectedKelurahan,
}: {
  setZoom: (z: number) => void;
  setSelectedKelurahan: (k: string) => void;
}) => {
  useMapEvents({
    zoomend: (e) => {
      const z = e.target.getZoom();
      setZoom(z);
      if (z < 15) {
        setSelectedKelurahan("Semua Kelurahan");
      }
    },
  });
  return null;
};

const MapFlyTo = ({ target }: { target: { center: [number, number]; zoom: number; timestamp: number } | null }) => {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo(target.center, target.zoom, { duration: 1.2 });
    }
  }, [target, map]);
  return null;
};

const kelurahanCentroidsMap = Object.values(KELURAHAN_GEODATA).map((kg) => ({
  name: kg.name,
  lat: kg.centroid[0],
  lng: kg.centroid[1],
  bounds: kg.bounds,
  color: kg.color,
  rwCount: kg.rwCount,
}));


const LocationPicker = ({ position, onChange }: { position: [number, number] | null; onChange: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return position ? <Marker position={position} /> : null;
};

const ManajemenTempatSampah: React.FC = () => {
  const { user } = useAuthStore();
  const isReadOnly = ["ADMIN_DLH", "CAMAT", "LURAH", "RT"].includes(user?.peran || "");

  const [bins, setBins] = useState<any[]>([]);
  const [households, setHouseholds] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBin, setSelectedBin] = useState<string | null>(null);
  const [selectedBinDetail, setSelectedBinDetail] = useState<any | null>(null);

  // Map view reference
  const [mapCenter, setMapCenter] = useState<[number, number]>([-6.8903, 107.611]);
  const [mapZoom, setMapZoom] = useState<number>(15);
  const [selectedMapKelurahan, setSelectedMapKelurahan] = useState("Semua Kelurahan");
  const [flyTarget, setFlyTarget] = useState<{ center: [number, number]; zoom: number; timestamp: number } | null>(null);

  // Group bins by household / location
  const householdGroups = React.useMemo(() => {
    const groups: Record<string, { bins: any[]; latitude: number; longitude: number }> = {};
    bins
      .filter((b) => b.latitude && b.longitude)
      .forEach((bin) => {
        const key = bin.userId || `${bin.latitude},${bin.longitude}`;
        if (!groups[key]) {
          groups[key] = { bins: [], latitude: Number(bin.latitude), longitude: Number(bin.longitude) };
        }
        groups[key].bins.push(bin);
      });
    return Object.values(groups);
  }, [bins]);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [binToDelete, setBinToDelete] = useState<string | null>(null);

  // Form Modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"add" | "edit">("add");
  const [formData, setFormData] = useState({
    qrCode: "",
    categoryId: "",
    rtRwId: 1,
    latitude: "",
    longitude: "",
    maxCapacityLiter: 25,
    userId: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dropdown options
  const [categories, setCategories] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [wargas, setWargas] = useState<any[]>([]);

  // Logs state
  const [logTransactions, setLogTransactions] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Search & Filter state
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchInput, statusFilter, areaFilter, categoryFilter, rowsPerPage]);

  const totalPages = Math.max(1, Math.ceil(bins.length / rowsPerPage));
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedBins = bins.slice(startIndex, startIndex + rowsPerPage);


  const fetchBins = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (searchInput) query.append("search", searchInput);
      if (statusFilter) query.append("status", statusFilter);
      if (areaFilter) query.append("areaId", areaFilter);
      if (categoryFilter) query.append("categoryId", categoryFilter);

      const response = await api.get(`/bins?${query.toString()}`);
      setBins(response.data.data);
    } catch (err) {
      setError("Gagal memuat data dari server.");
      toast.error("Gagal memuat data tempat sampah");
    } finally {
      setLoading(false);
    }
  };

  const fetchHouseholds = async () => {
    try {
      const response = await api.get("/households");
      setHouseholds(response.data.data || []);
    } catch (err) {
      console.error("Failed to fetch households:", err);
    }
  };

  const loadFormOptions = async () => {
    try {
      const [catRes, areaRes] = await Promise.all([api.get("/categories"), api.get("/bins/areas")]);
      setCategories(catRes.data?.data || []);
      setAreas(areaRes.data?.data || []);

      api
        .get("/users", { params: { roleName: "WARGA" } })
        .then((res) => setWargas(res.data?.data || []))
        .catch((err) => console.log("Non-admin or error fetching wargas:", err));
    } catch (err) {
      console.error("Failed to load form options:", err);
    }
  };

  useEffect(() => {
    fetchBins();
  }, [statusFilter, areaFilter, categoryFilter]);

  const fetchLocations = async () => {
    try {
      const response = await api.get("/bins/locations");
      if (response.data?.success) {
        setLocations(response.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch locations for map:", err);
    }
  };

  useEffect(() => {
    fetchHouseholds();
    loadFormOptions();
    fetchLocations();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchBins();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  const fetchNextQrCode = async (catId: string) => {
    if (!catId) return;
    try {
      const response = await api.get(`/bins/next-qr?categoryId=${catId}`);
      if (response.data?.success) {
        setFormData((prev) => ({ ...prev, qrCode: response.data.data.qrCode }));
      }
    } catch (err) {
      console.error("Gagal mendapatkan kode QR otomatis:", err);
    }
  };

  const handleOpenAddModal = () => {
    setModalType("add");
    const defaultCategoryId = categories[0]?.id || "";
    setFormData({
      qrCode: "",
      categoryId: defaultCategoryId,
      rtRwId: areas[0]?.id || 1,
      latitude: "",
      longitude: "",
      maxCapacityLiter: 25,
      userId: "",
    });
    setIsFormModalOpen(true);
    if (defaultCategoryId) {
      fetchNextQrCode(defaultCategoryId);
    }
  };

  const handleOpenEditModal = (bin: any) => {
    setModalType("edit");
    setSelectedBin(bin.kode);
    setFormData({
      qrCode: bin.kode,
      categoryId: bin.categoryId || "",
      rtRwId: bin.rtRwId || 1,
      latitude: bin.latitude ? bin.latitude.toString() : "",
      longitude: bin.longitude ? bin.longitude.toString() : "",
      maxCapacityLiter: bin.maxCapacityLiter || 25,
      userId: bin.userId || "",
    });
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setSelectedBin(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      };

      if (modalType === "add") {
        await api.post("/bins", payload);
        toast.success("Tempat sampah berhasil ditambahkan!");
      } else {
        await api.put(`/bins/${selectedBin}`, payload);
        toast.success("Data tempat sampah berhasil diperbarui!");
      }
      closeFormModal();
      fetchBins();
      fetchHouseholds();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveActivation = async (binKode: string) => {
    try {
      const res = await api.put(`/bins/${binKode}/approve-activation`);
      if (res.data?.success) {
        toast.success("Aktivasi tempat sampah disetujui!");
        fetchBins();
        fetchHouseholds();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal menyetujui aktivasi");
    }
  };

  const handleRejectActivation = async (binKode: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menolak aktivasi untuk tempat sampah ${binKode}? Akun warga terkait akan dihapus.`)) {
      try {
        const res = await api.put(`/bins/${binKode}/reject-activation`);
        if (res.data?.success) {
          toast.success("Aktivasi tempat sampah ditolak dan akun warga dibersihkan!");
          fetchBins();
          fetchHouseholds();
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Gagal menolak aktivasi");
      }
    }
  };

  const handleDeleteClick = (binKode: string) => {
    setBinToDelete(binKode);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!binToDelete) return;
    try {
      await api.delete(`/bins/${binToDelete}`);
      toast.success("Tempat sampah berhasil dihapus!");
      setIsDeleteModalOpen(false);
      setBinToDelete(null);
      fetchBins();
      fetchHouseholds();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal menghapus tempat sampah");
    }
  };

  const handleExportCSV = () => {
    if (bins.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    const headers = [
      "Kode",
      "Lokasi",
      "Pemilik",
      "Kapasitas",
      "Kategori",
      "Status",
      "Terakhir Update",
    ];
    const csvData = bins.map((b: any) => [
      b.kode,
      b.lokasi,
      b.wargaName || "-",
      `${b.kapasitas} Liter`,
      b.categoryId,
      b.status,
      b.lastUpdate,
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Laporan_Tempat_Sampah_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Laporan CSV berhasil diunduh");
  };

  const openLogModal = async (binId: string) => {
    setSelectedBin(binId);
    setIsModalOpen(true);
    setLoadingLogs(true);
    try {
      const res = await api.get("/transactions/deposits", {
        params: { binCode: binId },
      });
      setLogTransactions(res.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch bin logs:", err);
      toast.error("Gagal memuat log transaksi");
    } finally {
      setLoadingLogs(false);
    }
  };

  const closeLogModal = () => {
    setIsModalOpen(false);
    setSelectedBin(null);
    setLogTransactions([]);
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Manajemen Tempat Sampah</h1>
            <span className="bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full font-extrabold flex items-center gap-1">
              <Map size={13} /> Titik Fasilitas
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Pemantauan status kapasitas, lokasi GPS, QR code, & pengajuan reset tempat sampah fisik.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isReadOnly && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white font-extrabold rounded-xl transition-all text-xs shadow-sm cursor-pointer"
            >
              <Plus size={15} /> Tambah Titik
            </button>
          )}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all text-xs border border-slate-200 cursor-pointer"
          >
            <Download size={15} /> Ekspor CSV
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-outline-variant/30 p-4 mb-4 flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Cari ID Tempat Sampah, QR Code..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
          />
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
          <div className="flex items-center gap-2 min-w-[140px]">
            <Filter size={16} className="text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2.5 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-primary"
            >
              <option value="">Semua Status</option>
              <option value="Normal">Normal</option>
              <option value="Penuh">Penuh</option>
              <option value="Sedang">Sedang</option>
              <option value="Perbaikan">Perbaikan</option>
            </select>
          </div>

          <div className="flex items-center gap-2 min-w-[140px]">
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="w-full py-2.5 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-primary"
            >
              <option value="">Semua Wilayah</option>
              {areas.map(area => (
                <option key={area.id} value={area.id}>{area.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 min-w-[140px]">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full py-2.5 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-primary"
            >
              <option value="">Semua Kategori</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>


      {/* Bin Table */}
      <div className="bg-white rounded-xl shadow-sm border border-outline-variant/30 overflow-x-auto">
        <table className="w-full min-w-[850px] text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low text-on-surface-variant text-[12px] font-bold uppercase tracking-wider whitespace-nowrap">
              <th className="px-6 py-4">QR Code</th>
              <th className="px-6 py-4">Kode</th>
              <th className="px-6 py-4">Lokasi</th>
              <th className="px-6 py-4">Pemilik</th>
              <th className="px-6 py-4">Kapasitas</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Update Terakhir</th>
              {!isReadOnly && <th className="px-6 py-4 text-center">Aksi</th>}
            </tr>
          </thead>
          <tbody className="text-sm whitespace-nowrap">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-on-surface-variant">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Loader2 className="animate-spin text-primary" size={32} />
                    <p>Memuat data...</p>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-error font-medium">
                  {error}
                </td>
              </tr>
            ) : bins.length > 0 ? (
              paginatedBins.map((bin) => (
                <tr
                  key={bin.kode}
                  className="border-b border-outline-variant/30 hover:bg-surface-container-low/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-center gap-1 bg-white p-2 rounded-xl border border-outline-variant/60 w-fit shadow-sm">
                      <img
                        className="w-16 h-16"
                        alt="QR Code"
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(bin.kode)}`}
                      />
                      <span className="text-[10px] font-mono font-bold text-primary tracking-wider">
                        {bin.kode}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-on-surface">{bin.kode}</td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-on-surface">{bin.lokasi}</p>
                    <p className="text-[11px] text-on-surface-variant mt-1">{bin.rtRw}</p>
                  </td>
                  <td className="px-6 py-4 font-medium text-on-surface">{bin.wargaName || "-"}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5 min-w-[120px]">
                      <div className="flex justify-between items-center text-[12px] font-bold">
                        <span className={
                          bin.kapasitas > 90 ? "text-red-600" :
                          bin.kapasitas >= 50 ? "text-orange-500" :
                          "text-emerald-600"
                        }>
                          {bin.kapasitas > 90 ? "Kritis" : bin.kapasitas >= 50 ? "Waspada" : "Aman"}
                        </span>
                        <span className="text-slate-600">{bin.kapasitas}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden shadow-inner border border-slate-200/50">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ease-out ${
                            bin.kapasitas > 90 ? "bg-gradient-to-r from-red-500 to-red-600" :
                            bin.kapasitas >= 50 ? "bg-gradient-to-r from-orange-400 to-orange-500" :
                            "bg-gradient-to-r from-emerald-400 to-emerald-500"
                          }`}
                          style={{ width: `${Math.min(bin.kapasitas, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {bin.realStatus === "PENDING_APPROVAL" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-[11px] font-bold animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        Menunggu Persetujuan
                      </span>
                    ) : bin.realStatus === "BROKEN" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 rounded-full text-[11px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                        Rusak / Sobek
                      </span>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${bin.status === "Penuh" ? "bg-red-50 text-red-700" : bin.status === "Normal" ? "bg-green-50 text-green-700" : bin.status === "Perbaikan" ? "bg-yellow-50 text-yellow-700" : "bg-blue-50 text-blue-700"} rounded-full text-[11px] font-bold`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${bin.status === "Penuh" ? "bg-red-500" : bin.status === "Normal" ? "bg-green-500" : bin.status === "Perbaikan" ? "bg-yellow-500" : "bg-blue-500"}`}
                        ></span>
                        {bin.status}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-on-surface-variant text-[12px]">
                    {bin.lastUpdate}
                  </td>
                  {!isReadOnly && (
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {bin.realStatus === "PENDING_APPROVAL" && (
                          <>
                            <button
                              onClick={() => handleApproveActivation(bin.kode)}
                              className="w-8 h-8 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-colors flex items-center justify-center"
                              title="Setujui Aktivasi"
                            >
                              <Check size={18} />
                            </button>
                            <button
                              onClick={() => handleRejectActivation(bin.kode)}
                              className="w-8 h-8 rounded-md bg-red-50 text-red-600 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center"
                              title="Tolak Aktivasi & Hapus Akun"
                            >
                              <X size={18} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setSelectedBinDetail(bin)}
                          className="w-8 h-8 rounded-md bg-surface-container text-on-surface-variant hover:bg-primary hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                          title="Detail Tempat Sampah"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => openLogModal(bin.kode)}
                          className="w-8 h-8 rounded-md bg-surface-container text-on-surface-variant hover:bg-primary hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                          title="Log Transaksi"
                        >
                          <History size={18} />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(bin)}
                          className="w-8 h-8 rounded-md bg-surface-container text-on-surface-variant hover:bg-primary hover:text-white transition-colors flex items-center justify-center"
                          title="Edit"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(bin.kode)}
                          className="w-8 h-8 rounded-md bg-surface-container text-on-surface-variant hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center"
                          title="Hapus"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-on-surface-variant">
                  Tidak ada data tempat sampah
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Interactive Table Pagination Footer Bar */}
        {bins.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={bins.length}
            itemsPerPage={rowsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setRowsPerPage}
          />
        )}
      </div>


      {/* Geospatial Map with Kelurahan Polygons & RW Zona Details */}
      <div className="bg-white rounded-xl shadow-sm border border-outline-variant/30 p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h3 className="font-bold text-[15px] sm:text-[18px] text-on-surface flex items-start gap-2 leading-snug">
            <Map className="text-primary flex-shrink-0 mt-0.5" size={20} />
            <span>Peta Sebaran Tempat Sampah & Detail RW/Zona (Geospatial)</span>
          </h3>
          <div className="flex items-center gap-2">
            <select
              value={selectedMapKelurahan}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedMapKelurahan(val);
                if (val !== "Semua Kelurahan" && KELURAHAN_GEODATA[val.toUpperCase().replace(/\s+/g, "_")]) {
                  const geo = KELURAHAN_GEODATA[val.toUpperCase().replace(/\s+/g, "_")];
                  setFlyTarget({ center: geo.centroid, zoom: 16, timestamp: Date.now() });
                } else {
                  setFlyTarget({ center: [-6.8903, 107.611], zoom: 15, timestamp: Date.now() });
                }
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-white shadow-2xs cursor-pointer hover:border-primary focus:outline-none"
            >
              <option value="Semua Kelurahan">Semua Kelurahan</option>
              <option value="Dago">Kel. Dago</option>
              <option value="Sadang Serang">Kel. Sadang Serang</option>
              <option value="Sekeloa">Kel. Sekeloa</option>
              <option value="Lebak Gede">Kel. Lebak Gede</option>
              <option value="Lebak Siliwangi">Kel. Lebak Siliwangi</option>
              <option value="Cipaganti">Kel. Cipaganti</option>
            </select>
          </div>
        </div>

        <div className="h-[350px] sm:h-[480px] w-full rounded-xl overflow-hidden border border-outline-variant/30 relative">
          {/* Map Overlay Legend Card */}
          <div className="absolute bottom-3 sm:bottom-auto sm:top-4 left-3 right-3 sm:left-auto sm:right-4 z-10 flex flex-col pointer-events-auto">
            <div className="bg-white/95 backdrop-blur-md shadow-xl rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border border-slate-100/80 flex flex-col gap-1.5 sm:gap-3 sm:min-w-[200px]">
              <div className="flex items-center gap-1.5 sm:gap-2 border-b border-slate-100 pb-1.5 sm:pb-2">
                <Layers className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600 flex-shrink-0" />
                <p className="text-[9px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider leading-tight">
                  Kapasitas Tempat Sampah / Zona
                </p>
              </div>
              <div className="flex flex-wrap sm:flex-col gap-x-3 gap-y-1.5 sm:gap-3 mt-0.5 sm:mt-0">
                <div className="flex items-center gap-1.5 sm:gap-3">
                  <div className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 flex-shrink-0 rounded-full bg-emerald-500 ring-2 sm:ring-4 ring-emerald-100 shadow-sm"></div>
                  <span className="text-[9px] sm:text-[12px] font-semibold text-slate-700">&lt; 70% (Aman)</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-3">
                  <div className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 flex-shrink-0 rounded-full bg-amber-500 ring-2 sm:ring-4 ring-amber-100 shadow-sm"></div>
                  <span className="text-[9px] sm:text-[12px] font-semibold text-slate-700">70-90% (Siaga)</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-3">
                  <div className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 flex-shrink-0 rounded-full bg-rose-500 ring-2 sm:ring-4 ring-rose-100 shadow-sm"></div>
                  <span className="text-[9px] sm:text-[12px] font-semibold text-slate-700">&gt; 90% (Penuh)</span>
                </div>
              </div>
            </div>
          </div>

          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            scrollWheelZoom={true}
            style={{ height: "100%", width: "100%", zIndex: 1 }}
          >
            <MapFlyTo target={flyTarget} />
            <MapEvents setZoom={setMapZoom} setSelectedKelurahan={setSelectedMapKelurahan} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* LEVEL 1: KELURAHAN BOUNDARY POLYGONS */}
            {Object.values(KELURAHAN_GEODATA).map((kg) => {
              if (
                selectedMapKelurahan !== "Semua Kelurahan" &&
                selectedMapKelurahan.toLowerCase() !== kg.name.toLowerCase()
              ) {
                return null;
              }

              return (
                <Polygon
                  key={`kel-poly-bman-${kg.id}`}
                  positions={kg.bounds}
                  pathOptions={{
                    color: kg.color,
                    fillColor: kg.color,
                    fillOpacity: selectedMapKelurahan.toLowerCase() === kg.name.toLowerCase() ? 0.32 : 0.18,
                    weight: selectedMapKelurahan.toLowerCase() === kg.name.toLowerCase() ? 3 : 2.2,
                  }}
                />
              );
            })}

            {/* LEVEL 1: KELURAHAN OVERVIEW MARKERS */}
            {selectedMapKelurahan === "Semua Kelurahan" &&
              kelurahanCentroidsMap.map((kel) => {
                const rwsInKel = locations.filter(
                  (l) => l.kelurahan.toLowerCase() === kel.name.toLowerCase()
                );
                return (
                  <Marker
                    key={`bman-kel-${kel.name}`}
                    position={[kel.lat, kel.lng]}
                    icon={createKelurahanPinIcon(kel.name, rwsInKel.length)}
                    eventHandlers={{
                      click: () => {
                        setSelectedMapKelurahan(kel.name);
                        setFlyTarget({ center: [kel.lat, kel.lng], zoom: 16, timestamp: Date.now() });
                      },
                    }}
                  >
                    <Popup>
                      <div className="text-xs p-1 text-center font-sans">
                        <strong className="text-sm font-bold block text-slate-900 mb-1">
                          Kelurahan {kel.name}
                        </strong>
                        <p className="text-slate-600 mb-2">
                          Total Wilayah: <strong>{rwsInKel.length} RW</strong>
                        </p>
                        <button
                          onClick={() => {
                            setSelectedMapKelurahan(kel.name);
                            setFlyTarget({ center: [kel.lat, kel.lng], zoom: 16, timestamp: Date.now() });
                          }}
                          className="w-full bg-emerald-600 text-white font-bold text-[11px] py-1.5 px-3 rounded-lg hover:bg-emerald-700 transition cursor-pointer"
                        >
                          Buka Detail Tempat Sampah →
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

            {/* LEVEL 2: RW ZONA MARKERS WITH FULL RW METADATA */}
            {(() => {
              if (selectedMapKelurahan === "Semua Kelurahan" && mapZoom < 16) return null;

              const filteredLocs = locations.filter((loc) => {
                if (selectedMapKelurahan === "Semua Kelurahan") return true;
                return loc.kelurahan.toLowerCase() === selectedMapKelurahan.toLowerCase();
              });

              const validLocations = filteredLocs.filter((g) => g.latitude && g.longitude);
              if (validLocations.length === 0) return null;

              return validLocations.map((group, idx) => (
                <Marker
                  key={`rw-zona-bman-${group.rw}-${idx}`}
                  position={[group.latitude, group.longitude]}
                  icon={createRwZonaIcon(group.rw, group.patuh)}
                  eventHandlers={{
                    click: () => {
                      setMapCenter([group.latitude, group.longitude]);
                      setMapZoom(17);
                    },
                  }}
                >
                  <Popup>
                    <div className="text-xs p-2 text-left font-sans min-w-[260px] sm:min-w-[300px]">
                      <strong className="text-sm font-black block mb-2 text-slate-900 border-b pb-1.5 text-center">
                        Wilayah {group.rw.includes(`(${group.kelurahan})`) ? group.rw : `${group.rw} (${group.kelurahan})`}
                      </strong>

                      <div className="space-y-1.5 my-2 text-xs text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                        <div className="flex justify-between items-center gap-3">
                          <span className="text-slate-500 font-semibold shrink-0">Ketua RW:</span>
                          <span className="font-extrabold text-slate-900 text-right truncate">{group.ketuaRwName || "Belum ditugaskan"}</span>
                        </div>
                        <div className="flex justify-between items-center gap-3">
                          <span className="text-slate-500 font-semibold shrink-0">Petugas Residu:</span>
                          <span className="font-extrabold text-slate-900 text-right truncate">{group.petugasResiduName || "Belum ditugaskan"}</span>
                        </div>
                        <div className="flex justify-between items-center gap-3">
                          <span className="text-slate-500 font-semibold shrink-0">Mahasiswa KKN:</span>
                          <span className="font-extrabold text-slate-900 text-right truncate">{group.mahasiswaKknName || "Tidak ada"}</span>
                        </div>
                        <div className="flex justify-between items-center gap-3">
                          <span className="text-slate-500 font-semibold shrink-0">Lurah {group.kelurahan ? `(${group.kelurahan})` : ""}:</span>
                          <span className="font-extrabold text-slate-900 text-right truncate">{group.lurahName || "Belum ditugaskan"}</span>
                        </div>
                      </div>

                      <div className="flex justify-between text-slate-600 my-1 px-1 text-xs">
                        <span>Tingkat Kepatuhan:</span>
                        <strong className="text-emerald-600 font-black text-sm">{group.patuh}%</strong>
                      </div>
                      <div className="flex justify-between text-slate-600 mb-2 px-1 text-xs">
                        <span>Tempat Sampah:</span>
                        <strong className="text-slate-800 font-black">{group.titikCount} Tempat Sampah</strong>
                      </div>

                      <p className="text-[11px] text-emerald-600 font-bold italic text-center pt-1.5 border-t border-slate-100">
                        Klik untuk zoom ke detail rumah tangga
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ));
            })()}

            {/* LEVEL 3: HOUSEHOLD BINS & CAPACITY CIRCLES */}
            {mapZoom >= 14 && (
              <>
                {householdGroups.map((group, idx) => {
                  let maxPercentage = 0;
                  group.bins.forEach((bin) => {
                    const vol = Number(bin.currentVolumeLiter || 0);
                    const max = Number(bin.maxCapacityLiter || 25);
                    const pct = max > 0 ? (vol / max) * 100 : 0;
                    if (pct > maxPercentage) maxPercentage = pct;
                  });

                  let status = "Aman";
                  let color = "#10b981";
                  if (maxPercentage >= 90) {
                    status = "Penuh";
                    color = "#ef4444";
                  } else if (maxPercentage >= 70) {
                    status = "Sedang";
                    color = "#f59e0b";
                  }

                  return (
                    <React.Fragment key={`hh-bin-frag-bman-${idx}`}>
                      <Circle
                        center={[group.latitude, group.longitude]}
                        radius={20}
                        pathOptions={{ color: color, fillColor: color, fillOpacity: 0.15, weight: 1 }}
                      />
                      <Marker
                        position={[group.latitude, group.longitude]}
                        icon={createMapBinIcon(status)}
                        eventHandlers={{
                          click: () => {
                            setMapCenter([group.latitude, group.longitude]);
                            setMapZoom(19);
                          },
                        }}
                      >
                        <Popup>
                          <div className="text-[12px] space-y-2 font-sans">
                            <strong className="text-sm font-bold block mb-1 border-b pb-1 text-slate-800">
                              Data Tempat Sampah Rumah Tangga
                            </strong>
                            <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                              {group.bins.map((bin) => {
                                const vol = Number(bin.currentVolumeLiter || 0);
                                const max = Number(bin.maxCapacityLiter || 25);
                                const pct = max > 0 ? Math.round((vol / max) * 100) : 0;

                                return (
                                  <div
                                    key={`bin-popup-${bin.kode}`}
                                    className="bg-slate-50 p-2 rounded border border-slate-200 text-xs"
                                  >
                                    <div className="flex justify-between font-bold text-slate-900 mb-0.5">
                                      <span>{bin.kode}</span>
                                      <span
                                        className={
                                          pct >= 90
                                            ? "text-red-600"
                                            : pct >= 70
                                              ? "text-amber-600"
                                              : "text-emerald-600"
                                        }
                                      >
                                        {pct}%
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-slate-600">
                                      Pemilik: {bin.wargaName || "Publik/Umum"}
                                      <br />
                                      Kategori: {bin.category?.name || bin.categoryId} ({vol}L / {max}L)
                                      <br />
                                      RT/RW: {bin.rtRw}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    </React.Fragment>
                  );
                })}

                {/* Individual House Markers */}
                {households
                  .filter((h) => h.latitude && h.longitude)
                  .map((h) => (
                    <Marker
                      key={`house-bman-${h.id}`}
                      position={[Number(h.latitude), Number(h.longitude)]}
                      icon={createHouseIcon()}
                    >
                      <Popup>
                        <div className="text-[12px] font-sans">
                          <strong>Rumah {h.user?.name || "Warga"}</strong>
                          <br />
                          Alamat: {h.address}
                          <br />
                          RT/RW: {h.rtRw?.name || "-"} (Kel. {h.rtRw?.kelurahan?.name || "-"})
                        </div>
                      </Popup>
                    </Marker>
                  ))}
              </>
            )}
          </MapContainer>

          {/* Map Legend Overlay for Manajemen Tempat Sampah */}
          <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2 max-w-xs font-sans text-xs">
            <div className="bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200/90 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2">
                <span className="font-black text-[11px] uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Legenda Tempat Sampah
                </span>
              </div>

              {/* Status Volume Tempat Sampah */}
              <div className="space-y-1 mb-2 pb-2 border-b border-slate-100">
                <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                  Kapasitas Tempat Sampah
                </span>
                <div className="space-y-1 text-[10.5px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white"></span>
                    <span className="font-bold text-slate-700">Aman (&lt; 70%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-white"></span>
                    <span className="font-bold text-slate-700">Waspada (70% - 90%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-white"></span>
                    <span className="font-bold text-slate-700">Penuh (&gt; 90%)</span>
                  </div>
                </div>
              </div>

              {/* Batas Kelurahan */}
              <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                Polygon 6 Kelurahan
              </span>
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10.5px]">
                {Object.values(KELURAHAN_GEODATA).map((kg) => (
                  <div key={kg.id} className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-xs shrink-0 border border-black/10"
                      style={{ backgroundColor: kg.color }}
                    ></span>
                    <span className="font-bold text-slate-700 truncate">{kg.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Log Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-on-surface/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-low">
              <div>
                <h3 className="text-[20px] font-bold text-on-surface">
                  Log Transaksi Setoran Sampah
                </h3>
                <p className="text-[12px] font-bold text-on-surface-variant">
                  Bin ID: {selectedBin}
                </p>
              </div>
              <button
                className="text-on-surface-variant hover:bg-surface-container-low p-2 rounded-full transition-colors cursor-pointer"
                onClick={closeLogModal}
              >
                <X />
              </button>
            </div>
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {loadingLogs ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="animate-spin text-primary" size={32} />
                </div>
              ) : logTransactions.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant/50 text-on-surface-variant text-[12px] font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Tanggal & Waktu</th>
                      <th className="py-3 px-4">Pengguna</th>
                      <th className="py-3 px-4">Berat (Kg)</th>
                      <th className="py-3 px-4">Volume (L)</th>
                      <th className="py-3 px-4">Poin</th>
                      <th className="py-3 px-4">Jenis</th>
                    </tr>
                  </thead>
                  <tbody className="text-[14px] text-on-surface">
                    {logTransactions.map((tx: any) => (
                      <tr
                        key={tx.id}
                        className="border-b border-outline-variant/30 hover:bg-surface-container-low transition-colors"
                      >
                        <td className="py-3 px-4">
                          {new Date(tx.waktu).toLocaleString("id-ID", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </td>
                        <td className="py-3 px-4">{tx.warga}</td>
                        <td className="py-3 px-4 font-bold">{tx.berat}</td>
                        <td className="py-3 px-4">{tx.volume || "-"}</td>
                        <td className="py-3 px-4 text-yellow-600 font-bold">+{tx.poin}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`font-bold ${tx.jenis.toUpperCase().includes("ORGANIK") ? "text-primary" : "text-secondary"}`}
                          >
                            {tx.jenis}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-center text-on-surface-variant text-sm py-8">
                  Belum ada transaksi di tempat sampah ini
                </p>
              )}
            </div>
            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-outline-variant/30 flex justify-end bg-surface-container-low">
              <button
                className="px-4 py-2 border border-outline-variant/50 text-on-surface rounded-lg text-[12px] font-bold hover:bg-surface-container transition-colors cursor-pointer"
                onClick={closeLogModal}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Detail Bin Modal */}
      {selectedBinDetail && (
        <div className="fixed inset-0 bg-on-surface/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-[18px] font-bold text-slate-800 flex items-center gap-2">
                <Map className="text-primary" size={20} />
                Detail Smart Bin
              </h3>
              <button
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full transition-colors cursor-pointer"
                onClick={() => setSelectedBinDetail(null)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex flex-col items-center gap-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <img
                  className="w-32 h-32"
                  alt="QR Code"
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(selectedBinDetail.kode)}`}
                />
                <span className="text-xs font-mono font-bold text-primary tracking-widest uppercase">
                  {selectedBinDetail.kode}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-slate-400 font-bold block mb-0.5">Pemilik Warga</span>
                  <span className="font-bold text-slate-700">{selectedBinDetail.wargaName || "Publik / Umum"}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-slate-400 font-bold block mb-0.5">Lokasi RT/RW</span>
                  <span className="font-bold text-slate-700">{selectedBinDetail.rtRw || "-"}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-slate-400 font-bold block mb-0.5">Kategori</span>
                  <span className="font-bold text-emerald-600">{selectedBinDetail.category?.name || selectedBinDetail.categoryId || "Umum"}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-slate-400 font-bold block mb-0.5">Kapasitas Maks</span>
                  <span className="font-bold text-slate-700">{selectedBinDetail.maxCapacityLiter || 25} Liter ({selectedBinDetail.kapasitas || 0}% terisi)</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 col-span-2">
                  <span className="text-slate-400 font-bold block mb-0.5">Koordinat GPS</span>
                  <span className="font-mono text-slate-700 font-bold">
                    {selectedBinDetail.latitude && selectedBinDetail.longitude
                      ? `${selectedBinDetail.latitude}, ${selectedBinDetail.longitude}`
                      : "Belum diset (0, 0)"}
                  </span>
                </div>
              </div>
            </div>
            <div className="px-6 py-3 border-t border-slate-200 flex justify-end bg-slate-50">
              <button
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                onClick={() => setSelectedBinDetail(null)}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah/Edit Form */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-low">
              <h3 className="text-xl font-bold text-on-surface">
                {modalType === "add" ? "Tambah Titik Tempat Sampah" : "Edit Tempat Sampah"}
              </h3>
              <button
                onClick={closeFormModal}
                className="text-on-surface-variant hover:bg-surface-container-low p-2 rounded-full transition-colors cursor-pointer"
              >
                <X />
              </button>
            </div>
            <form
              onSubmit={handleSubmit}
              className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[80vh]"
            >
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  Kode / QR Code (Auto-generated)
                </label>
                <input
                  type="text"
                  readOnly
                  value={formData.qrCode}
                  placeholder="Generating QR Code..."
                  className="w-full h-10 px-3 rounded-lg border border-outline-variant/50 bg-slate-100 text-slate-500 cursor-not-allowed focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  Kategori Sampah
                </label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) => {
                    const newCatId = e.target.value;
                    setFormData({ ...formData, categoryId: newCatId });
                    if (modalType === "add") {
                      fetchNextQrCode(newCatId);
                    }
                  }}
                  className="w-full h-10 px-3 rounded-lg border border-outline-variant/50 bg-surface-container-low focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-xs font-bold"
                >
                  <option value="">Pilih Kategori</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.description})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  Wilayah RT/RW
                </label>
                <select
                  required
                  value={formData.rtRwId}
                  onChange={(e) => setFormData({ ...formData, rtRwId: parseInt(e.target.value) })}
                  className="w-full h-10 px-3 rounded-lg border border-outline-variant/50 bg-surface-container-low focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-xs font-bold"
                >
                  <option value="">Pilih Wilayah</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (Kel. {a.kelurahan?.name})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  Pemilik Tempat Sampah (Warga - Opsional)
                </label>
                <select
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-outline-variant/50 bg-surface-container-low focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-xs font-bold"
                >
                  <option value="">Publik / Tempat Sampah Umum</option>
                  {wargas.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="block text-sm font-medium text-on-surface">Titik Lokasi (GPS)</label>
                <div className="h-[200px] w-full rounded-xl overflow-hidden border border-outline-variant/50 relative z-0">
                  <MapContainer
                    center={
                      formData.latitude && formData.longitude
                        ? [Number(formData.latitude), Number(formData.longitude)]
                        : [-6.8903, 107.611]
                    }
                    zoom={15}
                    scrollWheelZoom={true}
                    style={{ height: "100%", width: "100%" }}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <LocationPicker 
                      position={formData.latitude && formData.longitude ? [Number(formData.latitude), Number(formData.longitude)] : null} 
                      onChange={(lat, lng) => setFormData({ ...formData, latitude: lat.toString(), longitude: lng.toString() })} 
                    />
                  </MapContainer>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1">Latitude</label>
                    <input
                      type="number"
                      step="0.00000001"
                      required
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      placeholder="-6.8895"
                      className="w-full h-10 px-3 rounded-lg border border-outline-variant/50 bg-surface-container-low focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1">Longitude</label>
                    <input
                      type="number"
                      step="0.00000001"
                      required
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      placeholder="107.6108"
                      className="w-full h-10 px-3 rounded-lg border border-outline-variant/50 bg-surface-container-low focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-xs"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  Kapasitas Maksimal (Liter)
                </label>
                <input
                  type="number"
                  required
                  value={formData.maxCapacityLiter}
                  onChange={(e) =>
                    setFormData({ ...formData, maxCapacityLiter: parseFloat(e.target.value) })
                  }
                  className="w-full h-10 px-3 rounded-lg border border-outline-variant/50 bg-surface-container-low focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
              <div className="mt-4 flex justify-end gap-3 pt-4 border-t border-outline-variant/30 bg-surface-container-low -mx-6 -mb-6 p-4">
                <button
                  type="button"
                  onClick={closeFormModal}
                  className="px-4 py-2 rounded-lg font-medium text-on-surface-variant hover:bg-surface-container-low cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting && (
                    <Loader2 className="animate-spin" size={18} />
                  )}
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirm Delete */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm overflow-hidden flex flex-col p-6 text-center transform transition-all">
            <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border-4 border-red-100">
              <AlertTriangle size={26} />
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-2">Hapus Tempat Sampah?</h3>
            <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
              Apakah Anda yakin ingin menghapus tempat sampah dengan kode <strong>{binToDelete}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl font-bold border border-outline-variant text-on-surface-variant hover:bg-surface-container-low cursor-pointer transition-all"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-sm shadow-red-200 cursor-pointer transition-all"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ManajemenTempatSampah;
