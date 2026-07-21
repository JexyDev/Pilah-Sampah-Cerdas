/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

const ManajemenTempatSampah: React.FC = () => {
  const [bins, setBins] = useState<any[]>([]);
  const [households, setHouseholds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBin, setSelectedBin] = useState<string | null>(null);

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

  const fetchBins = async () => {
    try {
      setLoading(true);
      const response = await api.get("/bins");
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
    fetchHouseholds();
    loadFormOptions();
  }, []);

  const handleOpenAddModal = () => {
    setModalType("add");
    setFormData({
      qrCode: "",
      categoryId: "",
      rtRwId: areas[0]?.id || 1,
      latitude: "",
      longitude: "",
      maxCapacityLiter: 25,
      userId: "",
    });
    setIsFormModalOpen(true);
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

  const handleDelete = async (binKode: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus tempat sampah dengan kode ${binKode}?`)) {
      try {
        await api.delete(`/bins/${binKode}`);
        toast.success("Tempat sampah berhasil dihapus!");
        fetchBins();
        fetchHouseholds();
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Gagal menghapus tempat sampah");
      }
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
    <div className="flex flex-col gap-6 pb-12">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-headline-xl text-headline-xl text-on-surface">Manajemen Smart Bin</h2>
        <div className="flex gap-3">
          <button
            onClick={handleOpenAddModal}
            className="bg-primary text-white px-6 h-12 rounded-lg font-medium text-base hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Tambah Titik
          </button>
          <button
            onClick={handleExportCSV}
            className="bg-white border border-outline-variant text-on-surface-variant px-6 h-12 rounded-lg font-medium text-base hover:bg-surface-container-low transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">download</span>
            Laporan
          </button>
        </div>
      </div>

      {/* Bin Table */}
      <div className="bg-white rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
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
              <th className="px-6 py-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-on-surface-variant">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <span className="material-symbols-outlined animate-spin text-primary text-[32px]">
                      autorenew
                    </span>
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
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-surface-container rounded-full overflow-hidden min-w-[60px]">
                        <div
                          className={`h-full ${bin.kapasitas > 80 ? "bg-error" : bin.kapasitas > 50 ? "bg-orange-500" : "bg-primary"}`}
                          style={{ width: `${bin.kapasitas}%` }}
                        ></div>
                      </div>
                      <span className="text-[12px] font-bold w-8 text-right">{bin.kapasitas}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${bin.status === "Penuh" ? "bg-red-50 text-red-700" : bin.status === "Normal" ? "bg-green-50 text-green-700" : bin.status === "Perbaikan" ? "bg-yellow-50 text-yellow-700" : "bg-blue-50 text-blue-700"} rounded-full text-[11px] font-bold`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${bin.status === "Penuh" ? "bg-red-500" : bin.status === "Normal" ? "bg-green-500" : bin.status === "Perbaikan" ? "bg-yellow-500" : "bg-blue-500"}`}
                      ></span>
                      {bin.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-on-surface-variant text-[12px]">
                    {bin.lastUpdate}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openLogModal(bin.kode)}
                        className="w-8 h-8 rounded-md bg-surface-container text-on-surface-variant hover:bg-primary hover:text-white transition-colors flex items-center justify-center"
                        title="Log Transaksi"
                      >
                        <span className="material-symbols-outlined text-[18px]">history</span>
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(bin)}
                        className="w-8 h-8 rounded-md bg-surface-container text-on-surface-variant hover:bg-primary hover:text-white transition-colors flex items-center justify-center"
                        title="Edit"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(bin.kode)}
                        className="w-8 h-8 rounded-md bg-surface-container text-on-surface-variant hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center"
                        title="Hapus"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </td>
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
          <span className="material-symbols-outlined text-primary">map</span>
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
                      <strong>Tong: {b.kode}</strong>
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
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {loadingLogs ? (
                <div className="flex justify-center items-center py-12">
                  <span className="material-symbols-outlined animate-spin text-primary text-[32px]">
                    autorenew
                  </span>
                </div>
              ) : logTransactions.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant/50 text-on-surface-variant text-[12px] font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Tanggal & Waktu</th>
                      <th className="py-3 px-4">Pengguna</th>
                      <th className="py-3 px-4">Berat (kg)</th>
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
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form
              onSubmit={handleSubmit}
              className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[80vh]"
            >
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  Kode / QR Code (opsional)
                </label>
                <input
                  type="text"
                  value={formData.qrCode}
                  onChange={(e) => setFormData({ ...formData, qrCode: e.target.value })}
                  placeholder="TS-XXX-001"
                  className="w-full h-10 px-3 rounded-lg border border-outline-variant/50 bg-surface-container-low focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  Kategori Sampah
                </label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">Latitude</label>
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
                  <label className="block text-sm font-medium text-on-surface mb-1">
                    Longitude
                  </label>
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
                    <span className="material-symbols-outlined animate-spin text-[18px]">
                      progress_activity
                    </span>
                  )}
                  Simpan
                </button>
              </div>
            </form>
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
