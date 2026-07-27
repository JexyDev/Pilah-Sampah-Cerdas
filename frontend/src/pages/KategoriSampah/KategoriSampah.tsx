import { Loader2, Plus, Trash2, X, Pencil } from "lucide-react";
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

const KategoriSampah: React.FC = () => {
  const { user } = useAuthStore();
  const isReadOnly = ["ADMIN_DLH", "CAMAT", "LURAH", "RT"].includes(user?.peran || "");

  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"add" | "edit">("add");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", pointsPerKg: 10, description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get("/categories");
      setCategories(response.data.data);
    } catch (err) {
      setError("Gagal memuat data dari server.");
      toast.error("Gagal memuat kategori");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAddModal = () => {
    setModalType("add");
    setFormData({ name: "", pointsPerKg: 10, description: "" });
    setSelectedId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: any) => {
    setModalType("edit");
    setFormData({
      name: cat.name,
      pointsPerKg: cat.pointsPerKg,
      description: cat.description || "",
    });
    setSelectedId(cat.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus kategori ini?")) {
      try {
        await api.delete(`/categories/${id}`);
        toast.success("Kategori berhasil dihapus!");
        fetchCategories();
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Gagal menghapus kategori");
      }
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

  const getCategoryIllustration = (name: string) => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes("organik") || nameLower.includes("organic")) {
      return "https://images.unsplash.com/photo-1595278069441-2cf29f8db058?auto=format&fit=crop&q=80&w=400";
    }
    if (nameLower.includes("anorganik") || nameLower.includes("inorganic") || nameLower.includes("non")) {
      return "https://images.unsplash.com/photo-1605600611281-9b1b702ec945?auto=format&fit=crop&q=80&w=400";
    }
    return "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&q=80&w=400";
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-on-surface">Kategori Tempat Sampah</h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Daftar jenis kategori sampah terpilah yang didukung sistem TrashCare.
          </p>
        </div>
        {!isReadOnly && (
          <button
            onClick={openAddModal}
            className="bg-primary text-white px-6 h-12 rounded-lg font-medium text-base hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Plus size={20} />
            Tambah Kategori
          </button>
        )}
      </div>

      {/* Grid of Category Cards */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white rounded-xl border border-outline-variant/30">
          <Loader2 className="animate-spin text-primary" size={32} />
          <p className="text-on-surface-variant font-medium">Memuat data kategori...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center text-error font-medium bg-white rounded-xl border border-outline-variant/30">
          {error}
        </div>
      ) : categories.length === 0 ? (
        <div className="p-8 text-center text-on-surface-variant font-medium bg-white rounded-xl border border-outline-variant/30">
          Belum ada data kategori.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white rounded-2xl border border-outline-variant/50 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
            >
              {/* Illustration Photo */}
              <div className="h-44 w-full relative overflow-hidden bg-slate-100">
                <img
                  src={getCategoryIllustration(cat.name)}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-3 right-3 bg-primary text-white font-bold text-xs px-2.5 py-1 rounded-full shadow">
                  {cat.pointsPerKg} Poin/Kg
                </span>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-lg font-bold text-on-surface uppercase tracking-wide mb-2">
                    {cat.name}
                  </h4>
                  <p className="text-sm text-on-surface-variant leading-relaxed mb-4">
                    {cat.description || "Tidak ada deskripsi singkat."}
                  </p>
                </div>

                {/* Card Footer Actions */}
                {!isReadOnly && (
                  <div className="flex justify-end gap-2 border-t border-outline-variant/20 pt-4 mt-2">
                    <button
                      onClick={() => openEditModal(cat)}
                      className="w-9 h-9 rounded-lg hover:bg-surface-variant text-on-surface-variant flex items-center justify-center transition-colors cursor-pointer border border-outline-variant/50"
                      title="Edit"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="w-9 h-9 rounded-lg hover:bg-red-50 text-red-600 flex items-center justify-center transition-colors cursor-pointer border border-red-200"
                      title="Hapus"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-lowest">
              <h3 className="text-xl font-bold text-on-surface">
                {modalType === "add" ? "Tambah Kategori Baru" : "Edit Kategori"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface rounded-full p-1 hover:bg-surface-container-highest transition-colors"
              >
                <X />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-on-surface mb-1.5">
                    Nama Kategori (Contoh: ORGANIK, KERTAS)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value.toUpperCase() })
                    }
                    className="w-full px-4 py-2.5 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-[14px]"
                    placeholder="Masukkan nama kategori"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-on-surface mb-1.5">
                    Poin per Kg
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.pointsPerKg}
                    onChange={(e) =>
                      setFormData({ ...formData, pointsPerKg: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-4 py-2.5 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-[14px]"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-on-surface mb-1.5">
                    Deskripsi (Opsional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-[14px] min-h-[80px]"
                    placeholder="Keterangan singkat"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-lg font-bold text-[14px] text-on-surface-variant hover:bg-surface-container-highest transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-lg font-bold text-[14px] bg-primary text-white hover:bg-primary/90 disabled:opacity-70 transition-colors flex items-center justify-center min-w-[120px]"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    "Simpan"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KategoriSampah;
