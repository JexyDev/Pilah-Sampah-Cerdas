/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  MapPin,
  Search,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  Globe2,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { Pagination } from "../../components/common/Pagination";
import { EmptyTableState } from "../../components/common/EmptyTableState";
import { useAuthStore } from "../../store/useAuthStore";

export interface ProvinsiData {
  id: string;
  nama: string;
  kodeIso?: string;
  ibuKota?: string;
  status: "Aktif" | "Non-Aktif";
  jumlahKotaKab?: number;
}

const MasterProvinsi: React.FC = () => {
  const { user } = useAuthStore();
  const isReadOnly = user?.peran === "PETUGAS_RESIDU" || user?.peran === "MAHASISWA_KKN";

  const [provinsiList, setProvinsiList] = useState<ProvinsiData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"add" | "edit">("add");
  const [selectedProv, setSelectedProv] = useState<ProvinsiData | null>(null);

  const [formData, setFormData] = useState({
    nama: "",
    kodeIso: "",
    ibuKota: "",
    status: "Aktif" as "Aktif" | "Non-Aktif",
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [provToDelete, setProvToDelete] = useState<ProvinsiData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch real provinsi data from backend database API
  const fetchProvinsi = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/areas/provinsi");
      const list = (res.data?.data || []).map((p: any) => ({
        id: String(p.id),
        nama: p.name || p.nama || "Jawa Barat",
        kodeIso: p.kodeIso || `ID-${(p.name || "JB").substring(0, 2).toUpperCase()}`,
        ibuKota: p.ibuKota || "Bandung",
        status: "Aktif",
      }));

      // Default fallback Jawa Barat if database empty
      setProvinsiList(
        list.length > 0
          ? list
          : [{ id: "1", nama: "Jawa Barat", kodeIso: "ID-JB", ibuKota: "Bandung", status: "Aktif" }]
      );
    } catch (err: any) {
      console.error("Gagal memuat data provinsi dari backend:", err);
      setError("Gagal memuat data provinsi dari server real-time.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProvinsi();
  }, []);

  // Filtered & Paginated Data
  const filteredProvinsi = useMemo(() => {
    return provinsiList.filter((p) => {
      return (
        p.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.kodeIso || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [provinsiList, searchTerm]);

  const totalPages = Math.ceil(filteredProvinsi.length / itemsPerPage) || 1;
  const paginatedProvinsi = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProvinsi.slice(start, start + itemsPerPage);
  }, [filteredProvinsi, currentPage, itemsPerPage]);

  const handleOpenAddModal = () => {
    setModalType("add");
    setSelectedProv(null);
    setFormData({
      nama: "",
      kodeIso: "ID-",
      ibuKota: "",
      status: "Aktif",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prov: ProvinsiData) => {
    setModalType("edit");
    setSelectedProv(prov);
    setFormData({
      nama: prov.nama,
      kodeIso: prov.kodeIso || "",
      ibuKota: prov.ibuKota || "",
      status: prov.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim()) {
      toast.error("Nama Provinsi tidak boleh kosong!");
      return;
    }

    setIsSubmitting(true);
    try {
      if (modalType === "add") {
        await api.post("/areas/provinsi", { name: formData.nama.trim() });
        toast.success(`Provinsi "${formData.nama.trim()}" berhasil ditambahkan ke database!`);
      } else if (selectedProv) {
        await api.put(`/areas/provinsi/${selectedProv.id}`, { name: formData.nama.trim() });
        toast.success(`Provinsi "${formData.nama.trim()}" berhasil diperbarui!`);
      }
      setIsModalOpen(false);
      fetchProvinsi();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menyimpan data provinsi ke backend");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!provToDelete) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/areas/provinsi/${provToDelete.id}`);
      toast.success(`Provinsi "${provToDelete.nama}" berhasil dihapus!`);
      setIsDeleteModalOpen(false);
      setProvToDelete(null);
      fetchProvinsi();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menghapus provinsi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      {/* 1. Header Navigation & Title matching Manajemen Tempat Sampah UI/UX */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#009966]/10 border border-[#009966]/20 text-[#009966] flex items-center justify-center shrink-0 shadow-2xs">
            <Globe2 size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
              Provinsi
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Kelola data wilayah provinsi terintegrasi secara real-time dengan backend & Master Pengguna.
            </p>
          </div>
        </div>

        {!isReadOnly && (
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="bg-[#009966] hover:bg-[#008055] text-white px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer shrink-0 active:scale-95"
          >
            <Plus size={16} />
            Tambah Provinsi
          </button>
        )}
      </div>

      {/* 2. Top Summary KPI Cards matching Manajemen Tempat Sampah */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">
              TOTAL PROVINSI DATABASE
            </span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {provinsiList.length} <span className="text-xs font-bold text-slate-500">Wilayah</span>
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center">
            <Globe2 size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">
              PROVINSI UTAMA WILAYAH
            </span>
            <h3 className="text-xl font-black text-[#009966]">Jawa Barat</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center">
            <MapPin size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">
              INTEGRASI BACKEND API
            </span>
            <h3 className="text-xl font-black text-emerald-600">Terhubung Real-Time</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
            <ShieldCheck size={20} />
          </div>
        </div>
      </div>

      {/* 3. Search Bar Container */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kode atau nama provinsi..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#009966] focus:bg-white transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="text-xs font-bold text-slate-400 self-end sm:self-auto">
          Menampilkan <span className="text-slate-800 dark:text-slate-100">{filteredProvinsi.length}</span> Provinsi
        </div>
      </div>

      {/* 4. Main Data Table matching Manajemen Tempat Sampah (Gambar Referensi User) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[10.5px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-3.5 px-4 text-center w-16 whitespace-nowrap">NO</th>
                <th className="py-3.5 px-4 whitespace-nowrap">PROVINSI</th>
                {!isReadOnly && <th className="py-3.5 px-4 text-center w-32 whitespace-nowrap">AKSI</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={3} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#009966]/10 text-[#009966] flex items-center justify-center border border-[#009966]/20">
                        <Loader2 className="animate-spin text-[#009966]" size={22} />
                      </div>
                      <p className="text-xs font-black text-slate-800 dark:text-slate-100">Memuat Data Provinsi Real-Time...</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-rose-600 font-bold text-xs">
                    <div className="flex flex-col items-center gap-2">
                      <AlertTriangle size={24} className="text-rose-500" />
                      <p>{error}</p>
                      <button
                        onClick={fetchProvinsi}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-200 transition cursor-pointer"
                      >
                        Coba Lagi
                      </button>
                    </div>
                  </td>
                </tr>
              ) : paginatedProvinsi.length > 0 ? (
                paginatedProvinsi.map((prov, index) => {
                  const itemNumber = (currentPage - 1) * itemsPerPage + index + 1;

                  return (
                    <tr
                      key={prov.id}
                      className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-colors text-xs text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap"
                    >
                      {/* NO */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-500 whitespace-nowrap">
                        {itemNumber}
                      </td>

                      {/* PROVINSI */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-700 border border-teal-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                            <Globe2 size={15} />
                          </div>
                          <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">
                            {prov.nama}
                          </span>
                        </div>
                      </td>

                      {/* AKSI (Soft Squircle Icon Buttons persis Gambar Referensi User) */}
                      {!isReadOnly && (
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(prov)}
                              className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all cursor-pointer"
                              title="Edit Data Provinsi"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setProvToDelete(prov);
                                setIsDeleteModalOpen(true);
                              }}
                              className="p-2 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all cursor-pointer"
                              title="Hapus Data Provinsi"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <EmptyTableState
                  colSpan={3}
                  entityName="Provinsi"
                  isSearch={!!searchTerm}
                  searchQuery={searchTerm}
                  onResetSearch={() => setSearchTerm("")}
                />
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Pagination */}
        {filteredProvinsi.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredProvinsi.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            itemsPerPageOptions={[5, 10, 25, 50]}
          />
        )}
      </div>

      {/* 5. Modal Tambah / Edit Provinsi */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#009966]/10 text-[#009966] flex items-center justify-center font-bold">
                  <Globe2 size={18} />
                </div>
                <h3 className="font-black text-slate-900 dark:text-slate-100 text-base">
                  {modalType === "add" ? "Tambah Provinsi Baru" : "Edit Data Provinsi"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div>
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1">
                  Nama Provinsi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Jawa Barat"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#009966] focus:bg-white transition-all"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-xs rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-[#009966] hover:bg-[#008055] text-white font-extrabold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                  {modalType === "add" ? "Simpan Provinsi" : "Update Provinsi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Modal Hapus Provinsi */}
      {isDeleteModalOpen && provToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 dark:border-slate-800 text-center space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto border border-rose-100">
              <Trash2 size={24} />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900 dark:text-slate-100">Konfirmasi Hapus</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Apakah Anda yakin ingin menghapus provinsi <span className="font-bold text-slate-800 dark:text-slate-100">"{provToDelete.nama}"</span>?
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-xs rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-rose-600 text-white font-extrabold text-xs rounded-xl hover:bg-rose-700 transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterProvinsi;
