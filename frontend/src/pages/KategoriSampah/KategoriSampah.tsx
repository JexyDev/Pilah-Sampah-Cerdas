/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import api from "../../services/api";

const KategoriSampah: React.FC = () => {
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

  return (
    <div className="flex flex-col gap-6">
      {/* Header Section */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-bold text-on-surface mb-2">Konfigurasi Kategori Sampah</h2>
          <p className="text-[14px] text-on-surface-variant max-w-3xl">
            Atur poin untuk setiap jenis sampah. Faktor poin digunakan untuk kalkulasi poin warga
            secara otomatis berdasarkan berat (Kg).
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-primary text-white px-5 h-10 rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Tambah Kategori
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl shadow-sm border border-outline-variant/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/30">
                <th className="py-4 px-6 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Nama Kategori
                </th>
                <th className="py-4 px-6 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Poin per Kg
                </th>
                <th className="py-4 px-6 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Deskripsi
                </th>
                <th className="py-4 px-6 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider text-right">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="text-[14px] text-on-surface">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-on-surface-variant">
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
                  <td colSpan={4} className="px-6 py-8 text-center text-error font-medium">
                    {error}
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-on-surface-variant">
                    Belum ada data kategori.
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr
                    key={cat.id}
                    className="border-b border-outline-variant/30 hover:bg-surface-container-low transition-colors duration-150 group"
                  >
                    <td className="py-4 px-6">
                      <span className="font-bold text-on-surface uppercase">{cat.name}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-primary">{cat.pointsPerKg} Poin</span>
                    </td>
                    <td className="py-4 px-6 text-[12px] text-on-surface-variant max-w-xs">
                      {cat.description || "-"}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(cat)}
                          className="p-2 rounded-full text-blue-600 hover:bg-blue-50 transition-colors inline-flex items-center justify-center"
                          title="Edit"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          className="p-2 rounded-full text-red-600 hover:bg-red-50 transition-colors inline-flex items-center justify-center"
                          title="Hapus"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
                <span className="material-symbols-outlined">close</span>
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
                    <span className="material-symbols-outlined animate-spin text-[20px]">
                      autorenew
                    </span>
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
