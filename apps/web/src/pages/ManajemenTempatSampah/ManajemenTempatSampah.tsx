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
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";

// Fix default Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom HTML DivIcon for Bins
const createMapBinIcon = (status: string) => {
  let color = "#10b981"; // default Normal
  if (status === "Sedang") color = "#f97316";
  if (status === "Penuh") color = "#ef4444";

  return L.divIcon({
    className: "custom-div-icon",
    html: `<div style="background-color: ${color}; width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
};

const createHouseIcon = () => {
  return L.divIcon({
    className: "custom-div-icon",
    html: `<div style="background-color: #3b82f6; width: 18px; height: 18px; border-radius: 4px; border: 2.5px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold;">H</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
};

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBin, setSelectedBin] = useState<string | null>(null);
  const [selectedBinDetail, setSelectedBinDetail] = useState<any | null>(null);

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

  useEffect(() => {
    fetchHouseholds();
    loadFormOptions();
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
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Manajemen Smart Bin (Tempat Sampah)</h1>
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
            placeholder="Cari ID Tong, QR Code..."
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
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low text-on-surface-variant text-[12px] font-bold uppercase tracking-wider">
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
          <tbody className="text-sm">
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
              bins.map((bin) => (
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
                          title="Detail Bin"
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
      </div>

      {/* Geospatial Map */}
      <div className="bg-white rounded-xl shadow-sm border border-outline-variant/30 p-6 space-y-4">
        <h3 className="font-bold text-[18px] text-on-surface flex items-center gap-2">
          <Map className="text-primary" />
          Peta Sebaran Bins & Rumah Warga (Geospatial)
        </h3>
        <div className="h-[400px] w-full rounded-xl overflow-hidden border border-outline-variant/30 relative">
          <MapContainer
            center={[-6.8903, 107.611]}
            zoom={15}
            scrollWheelZoom={true}
            style={{ height: "100%", width: "100%", zIndex: 1 }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* Bin Markers */}
            {bins
              .filter((b) => b.latitude && b.longitude)
              .map((b) => (
                <Marker
                  key={b.kode}
                  position={[Number(b.latitude), Number(b.longitude)]}
                  icon={createMapBinIcon(b.status)}
                >
                  <Popup>
                    <div className="text-[12px] space-y-1">
                      <strong>Tempat Sampah: {b.kode}</strong>
                      <br />
                      Pemilik: {b.wargaName || "Publik/Umum"}
                      <br />
                      Kategori: {b.category?.name || b.categoryId}
                      <br />
                      Kapasitas: {b.kapasitas}% terisi ({b.currentVolumeLiter || 0}L /{" "}
                      {b.maxCapacityLiter || 25}L)
                      <br />
                      RT/RW: {b.rtRw}
                      <br />
                      Status: {b.status}
                    </div>
                  </Popup>
                </Marker>
              ))}

            {/* Household Markers */}
            {households
              .filter((h) => h.latitude && h.longitude)
              .map((h) => (
                <Marker
                  key={h.id}
                  position={[Number(h.latitude), Number(h.longitude)]}
                  icon={createHouseIcon()}
                >
                  <Popup>
                    <div className="text-[12px]">
                      <strong>Rumah {h.user?.name || "Warga"}</strong>
                      <br />
                      Alamat: {h.address}
                      <br />
                      RT/RW: {h.rtRw?.name || "-"} (Kel. {h.rtRw?.kelurahan?.name || "-"})
                    </div>
                  </Popup>
                </Marker>
              ))}
          </MapContainer>
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
                  Belum ada transaksi di tong ini
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
                  Pemilik Tong (Warga - Opsional)
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
