import { Loader2, Trash2, X, Pencil, Tags, Coins, QrCode, AlertTriangle, Eye, Layers, Sparkles, Check, Upload } from "lucide-react";
/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { useAuthStore } from "../../store/useAuthStore";
import { EmptyTableState } from "../../components/common/EmptyTableState";

interface KategoriSampahProps {
  openAddModalSignal?: number;
}

const KategoriSampah: React.FC<KategoriSampahProps> = ({ openAddModalSignal }) => {
  const { user } = useAuthStore();
  const isReadOnly = ["ADMIN_DLH", "CAMAT", "LURAH", "RT", "PANITIA_TASKFORCE", "PEMIMPIN", "DPL", "DOSEN_PEMBIMBING"].includes(user?.peran || "");

  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"add" | "edit">("add");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", pointsPerKg: 10, description: "", imageUrl: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detail Modal State
  const [detailModalCat, setDetailModalCat] = useState<any | null>(null);

  // Delete Confirmation Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [catToDelete, setCatToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get("/categories");
      setCategories(response.data.data || []);
    } catch (err) {
      setError("Gagal memuat data dari server.");
      toast.error("Gagal memuat data kategori");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (openAddModalSignal && openAddModalSignal > 0) {
      openAddModal();
    }
  }, [openAddModalSignal]);

  const openAddModal = () => {
    setModalType("add");
    setFormData({ name: "", pointsPerKg: 10, description: "", imageUrl: "" });
    setSelectedId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: any) => {
    setModalType("edit");
    setFormData({
      name: cat.name,
      pointsPerKg: cat.pointsPerKg,
      description: cat.description || "",
      imageUrl: cat.imageUrl || "",
    });
    setSelectedId(cat.id);
    setIsModalOpen(true);
  };

  const confirmDeleteCategory = (cat: any) => {
    setCatToDelete(cat);
    setIsDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!catToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/categories/${catToDelete.id}`);
      toast.success("Kategori berhasil dihapus!");
      setIsDeleteModalOpen(false);
      setCatToDelete(null);
      fetchCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menghapus kategori");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (modalType === "add") {
        await api.post("/categories", formData);
        toast.success("Kategori berhasil ditambahkan!");
      } else {
        await api.put(`/categories/${selectedId}`, formData);
        toast.success("Kategori berhasil diperbarui!");
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryIllustration = (cat: any) => {
    if (cat?.imageUrl) {
      return cat.imageUrl;
    }

    const nameLower = (cat?.name || "").toLowerCase();
    if (nameLower.includes("anorganik") || nameLower.includes("inorganic") || nameLower.includes("non")) {
      return "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=600";
    }
    if (nameLower.includes("organik") || nameLower.includes("organic")) {
      return "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=600";
    }
    return "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=600";
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, name: string) => {
    const nameLower = (name || "").toLowerCase();
    let bgStart = "#10b981";
    let bgEnd = "#059669";
    let label = "🌱 ORGANIK";

    if (nameLower.includes("anorganik") || nameLower.includes("non")) {
      bgStart = "#f59e0b";
      bgEnd = "#d97706";
      label = "♻️ ANORGANIK";
    } else if (nameLower.includes("residu") || nameLower.includes("b3")) {
      bgStart = "#64748b";
      bgEnd = "#475569";
      label = "⚠️ RESIDU / B3";
    }

    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"><rect width="400" height="200" fill="url(#grad)"/><defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${bgStart};stop-opacity:1" /><stop offset="100%" style="stop-color:${bgEnd};stop-opacity:1" /></linearGradient></defs><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="22" font-weight="bold">${label}</text></svg>`;
    e.currentTarget.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
  };

  const totalAssociatedBins = categories.reduce((sum, c) => sum + (c._count?.bins || 0), 0);

  return (
    <div className="flex flex-col gap-6 text-slate-800 dark:text-slate-100">

      {/* 1. Integrated KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between transition-all hover:shadow-md">
          <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
              TOTAL KATEGORI AKTIF
            </p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {categories.length} <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Jenis</span>
            </h3>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#009966]/10 text-[#009966] dark:text-emerald-400 flex items-center justify-center border border-[#009966]/20 dark:border-emerald-700/40 shadow-2xs">
            <Tags size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between transition-all hover:shadow-md">
          <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
              TEMPAT SAMPAH TERKONEKSI
            </p>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {totalAssociatedBins} <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Kodefikasi</span>
            </h3>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-700/50 shadow-2xs">
            <QrCode size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between transition-all hover:shadow-md">
          <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
              RATA-RATA POIN INSENTIF
            </p>
            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {categories.length > 0 ? Math.round(categories.reduce((s, c) => s + Number(c.pointsPerKg || 0), 0) / categories.length) : 0} <span className="text-xs font-bold text-amber-700 dark:text-amber-300">Poin/Kg</span>
            </h3>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-700/50 shadow-2xs">
            <Coins size={20} />
          </div>
        </div>
      </div>

      {/* 2. Top Header Info */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#009966]/10 text-[#009966] dark:text-emerald-400 flex items-center justify-center border border-[#009966]/20 dark:border-emerald-700/40 shrink-0">
            <Layers size={20} />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Kategori Tempat Sampah dan Insentif</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Daftar jenis kategori terpilah yang terintegrasi langsung dengan Kodefikasi QR dan Peta Monitoring.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Grid of Category Cards */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <Loader2 className="animate-spin text-[#009966]" size={32} />
          <p className="text-slate-500 dark:text-slate-400 font-bold text-xs">Memuat data kategori terintegrasi...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center text-rose-600 dark:text-rose-400 font-bold bg-white dark:bg-slate-900 rounded-2xl border border-rose-100 dark:border-rose-800/50 shadow-2xs text-xs">
          {error}
        </div>
      ) : categories.length === 0 ? (
        <EmptyTableState
          entityName="Kategori Tempat Sampah"
          description="Sistem belum memiliki data kategori sampah. Silakan tambahkan kategori baru."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => {
            const isResidu = (cat.name || "").toLowerCase().includes("residu") || (cat.name || "").toLowerCase().includes("b3");
            const isAnorganik = (cat.name || "").toLowerCase().includes("anorganik");
            const binCount = cat._count?.bins || 0;

            return (
              <div
                key={cat.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
              >
                {/* Illustration Banner */}
                <div className="h-44 w-full relative overflow-hidden bg-slate-100 dark:bg-slate-800 dark:bg-slate-800">
                  <img
                    src={getCategoryIllustration(cat)}
                    alt={cat.name}
                    onError={(e) => handleImageError(e, cat.name)}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />

                  {/* Category Name Badge */}
                  <span className={`absolute bottom-3 left-3 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-md ${
                    isResidu
                      ? "bg-slate-600 text-white font-black border border-slate-400"
                      : isAnorganik
                      ? "bg-amber-400 text-slate-950 font-black border border-amber-300"
                      : "bg-[#009966] text-white"
                  }`}>
                    {cat.name}
                  </span>

                  {/* Points Pill */}
                  <span className="absolute top-3 right-3 bg-amber-500 text-white font-black text-xs px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                    <Coins size={13} />
                    {cat.pointsPerKg} Poin/Kg
                  </span>
                </div>

                {/* Card Content Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                      {cat.description || "Kategori tempat sampah terverifikasi."}
                    </p>
                  </div>

                  {/* Integration Metadata Badge */}
                  <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold">
                      <QrCode size={15} className="text-[#009966] dark:text-emerald-400" />
                      <span>Terikat Kodefikasi:</span>
                    </div>
                    <span className="font-extrabold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 px-2.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-600 shadow-2xs">
                      {binCount} Bins
                    </span>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                    <button
                      type="button"
                      onClick={() => setDetailModalCat(cat)}
                      className="text-xs font-extrabold text-[#009966] dark:text-emerald-400 hover:text-[#008055] flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Eye size={14} /> Detail Peta
                    </button>

                    {!isReadOnly && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(cat)}
                          className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                          title="Edit Kategori"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => confirmDeleteCategory(cat)}
                          className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center transition-colors cursor-pointer border border-rose-200 dark:border-rose-700/50"
                          title="Hapus Kategori"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#009966]/10 text-[#009966] dark:text-emerald-400 flex items-center justify-center border border-[#009966]/20 dark:border-emerald-700/40">
                  <Tags size={16} />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  {modalType === "add" ? "Tambah Kategori Baru" : "Edit Kategori Sampah"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Nama Kategori <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:border-[#009966] text-xs font-bold text-slate-800 dark:text-slate-100 outline-none transition-all"
                  placeholder="Contoh: Organik, Anorganik, Kertas, Plastik"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Poin Insentif per Kg <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="500"
                  value={formData.pointsPerKg}
                  onChange={(e) => setFormData({ ...formData, pointsPerKg: parseInt(e.target.value, 10) || 0 })}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:border-[#009966] text-xs font-bold text-slate-800 dark:text-slate-100 outline-none transition-all"
                />
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Preset:</span>
                  {[10, 15, 20, 25].map((preset) => (
                    <button
                      key={`preset-${preset}`}
                      type="button"
                      onClick={() => setFormData({ ...formData, pointsPerKg: preset })}
                      className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                        formData.pointsPerKg === preset
                          ? "bg-[#009966] text-white border-[#009966]"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                      }`}
                    >
                      {preset} Poin
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Foto / Gambar Kategori (Opsional)
                </label>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="URL Gambar (https://...) atau Unggah Berkas"
                      className="flex-1 h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:border-[#009966] text-xs font-bold text-slate-800 dark:text-slate-100 outline-none transition-all"
                    />
                    <label className="h-11 px-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-[#009966] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700/50 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 shadow-2xs">
                      <Upload size={15} />
                      <span>Unggah Berkas</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setFormData({ ...formData, imageUrl: reader.result as string });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    {formData.imageUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, imageUrl: "" })}
                        className="h-11 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-700/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-xs font-bold transition-colors cursor-pointer"
                        title="Hapus Foto"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  {formData.imageUrl && (
                    <div className="relative w-full h-28 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 mt-1 shadow-2xs">
                      <img
                        src={formData.imageUrl}
                        alt="Preview Kategori"
                        className="w-full h-full object-cover"
                        onError={(e) => handleImageError(e, formData.name || "Kategori")}
                      />
                      <span className="absolute bottom-2 left-2 bg-slate-900/80 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-md backdrop-blur-xs">
                        Preview Foto Kategori
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Deskripsi Singkat (Opsional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:border-[#009966] text-xs font-bold text-slate-800 dark:text-slate-100 outline-none transition-all min-h-[80px]"
                  placeholder="Masukkan keterangan jenis sampah atau petunjuk pemilahan..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs bg-[#009966] text-white hover:bg-[#008055] disabled:opacity-70 transition-all shadow-xs flex items-center justify-center min-w-[110px] cursor-pointer"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : "Simpan Kategori"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Detail & Integration Modal */}
      {detailModalCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#009966]/10 text-[#009966] dark:text-emerald-400 flex items-center justify-center border border-[#009966]/20 dark:border-emerald-700/40">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">Detail Integrasi Kategori</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalCat(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Nama Kategori:</span>
                  <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">{detailModalCat.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Nilai Insentif Poin:</span>
                  <span className="font-extrabold text-amber-600 dark:text-amber-400 text-xs">{detailModalCat.pointsPerKg} Poin/Kg</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Bins di Kodefikasi:</span>
                  <span className="font-mono font-extrabold text-[#009966] dark:text-emerald-400 text-xs">{detailModalCat._count?.bins || 0} Tempat Sampah</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Deskripsi:</span>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  {detailModalCat.description || "Tidak ada deskripsi rincian."}
                </p>
              </div>

              <div className="bg-emerald-50/70 dark:bg-emerald-950/60 p-3.5 rounded-2xl border border-emerald-100 dark:border-emerald-700/50 flex items-start gap-3 text-xs">
                <Check className="text-[#009966] dark:text-emerald-400 shrink-0 mt-0.5" size={16} />
                <div>
                  <div className="font-extrabold text-slate-900 dark:text-slate-100">Terintegrasi Otomatis dengan Peta & Mobile</div>
                  <div className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">
                    Kategori ini langsung terhubung dengan klasifikasi AI kamera Mobile Warga dan filter sebaran tempat sampah pada peta Monitoring.
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setDetailModalCat(null)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer"
                >
                  Tutup Detail
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Delete Confirmation Modal */}
      {isDeleteModalOpen && catToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-800 p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-700/50 flex items-center justify-center mx-auto">
              <AlertTriangle size={28} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">Hapus Kategori Sampah?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                Apakah Anda yakin ingin menghapus kategori <strong className="text-slate-800 dark:text-slate-200">"{catToDelete.name}"</strong>? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer w-1/2"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeDelete}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl font-bold text-xs bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-70 transition-all cursor-pointer w-1/2 flex items-center justify-center"
              >
                {isDeleting ? <Loader2 className="animate-spin" size={16} /> : "Hapus Kategori"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default KategoriSampah;
