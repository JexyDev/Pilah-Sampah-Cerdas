/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  Building2,
  Globe2,
  AlertTriangle,
  Compass,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { Pagination } from "../../components/common/Pagination";
import { EmptyTableState } from "../../components/common/EmptyTableState";
import { useAuthStore } from "../../store/useAuthStore";

export interface KecamatanItem {
  id: number;
  nama: string;
  code?: string | null;
  kode?: string | null;
  kabupatenId: number;
  kabupatenNama: string;
  kabupatenKode?: string | null;
  provinsiId: number;
  provinsiNama: string;
  provinsiKode?: string | null;
}

export interface KabupatenData {
  id: number;
  nama: string;
  kode?: string | null;
  provinsiId: number;
  provinsiNama: string;
  provinsiKode?: string | null;
}

export interface ProvinsiData {
  id: number;
  nama: string;
  kode?: string | null;
}

const formatKecName = (raw: string) => {
  if (!raw) return "Kecamatan";
  const trimmed = raw.trim();
  if (/^kecamatan\s+/i.test(trimmed)) return trimmed;
  const clean = trimmed.replace(/^kec\.?\s+/i, "").trim();
  return `Kecamatan ${clean.charAt(0).toUpperCase()}${clean.slice(1)}`;
};

const MasterKecamatan: React.FC = () => {
  const { user } = useAuthStore();
  const isReadOnly = !["DEVELOPER", "SUPER_USER"].includes(user?.peran || "");

  const [kecamatanList, setKecamatanList] = useState<KecamatanItem[]>([]);
  const [kabupatenList, setKabupatenList] = useState<KabupatenData[]>([]);
  const [provinsiList, setProvinsiList] = useState<ProvinsiData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"add" | "edit">("add");
  const [selectedKec, setSelectedKec] = useState<KecamatanItem | null>(null);

  const [formData, setFormData] = useState({
    nama: "",
    kode: "",
    provinsiId: 1,
    kabupatenId: 1,
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [kecToDelete, setKecToDelete] = useState<KecamatanItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch real data from backend API
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resKec, resKab, resProv] = await Promise.all([
        api.get("/areas/kecamatan"),
        api.get("/areas/kabupaten"),
        api.get("/areas/provinsi"),
      ]);

      const provs: ProvinsiData[] = (resProv.data?.data || []).map((p: any) => ({
        id: p.id,
        nama: p.name || p.nama || "Jawa Barat",
        kode: p.code || p.kode || null,
      }));
      setProvinsiList(provs.length > 0 ? provs : [{ id: 1, nama: "Jawa Barat" }]);

      const kabs: KabupatenData[] = (resKab.data?.data || []).map((k: any) => ({
        id: k.id,
        nama: k.name || k.nama || "Kota Bandung",
        kode: k.code || k.kode || null,
        provinsiId: k.provinsiId || k.provinsi?.id || 1,
        provinsiNama: k.provinsi?.name || k.provinsi?.nama || "Jawa Barat",
        provinsiKode: k.provinsi?.code || k.provinsi?.kode || null,
      }));
      setKabupatenList(kabs);

      const kecs: KecamatanItem[] = (resKec.data?.data || []).map((kc: any) => {
        const kab = kc.kabupaten;
        const prov = kab?.provinsi;

        return {
          id: Number(kc.id),
          nama: formatKecName(kc.name || kc.nama || "Kecamatan"),
          code: kc.code || kc.kode || null,
          kode: kc.code || kc.kode || null,
          kabupatenId: Number(kc.kabupatenId || kab?.id || 1),
          kabupatenNama: kab?.name || kab?.nama || "Kota Bandung",
          kabupatenKode: kab?.code || kab?.kode || null,
          provinsiId: Number(prov?.id || kab?.provinsiId || 1),
          provinsiNama: prov?.name || prov?.nama || "Jawa Barat",
          provinsiKode: prov?.code || prov?.kode || null,
        };
      });

      setKecamatanList(kecs);
    } catch (err: any) {
      console.error("Gagal memuat data kecamatan dari backend:", err);
      setError("Gagal memuat data kecamatan dari server real-time.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered & Paginated Table Data (Flat per Kecamatan)
  const filteredKecamatan = useMemo(() => {
    if (!searchTerm.trim()) return kecamatanList;
    const term = searchTerm.toLowerCase();
    return kecamatanList.filter(
      (kc) =>
        kc.nama.toLowerCase().includes(term) ||
        (kc.kode && kc.kode.toLowerCase().includes(term)) ||
        kc.kabupatenNama.toLowerCase().includes(term) ||
        kc.provinsiNama.toLowerCase().includes(term)
    );
  }, [kecamatanList, searchTerm]);

  const totalPages = Math.ceil(filteredKecamatan.length / itemsPerPage) || 1;
  const paginatedKecamatan = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredKecamatan.slice(start, start + itemsPerPage);
  }, [filteredKecamatan, currentPage, itemsPerPage]);

  // Modal filters
  const modalFilteredKabupaten = useMemo(() => {
    return kabupatenList.filter((k) => k.provinsiId === formData.provinsiId);
  }, [kabupatenList, formData.provinsiId]);

  const handleOpenAddModal = () => {
    setModalType("add");
    setSelectedKec(null);
    const firstProv = provinsiList[0]?.id || 1;
    const firstKabs = kabupatenList.filter((k) => k.provinsiId === firstProv);
    const firstKabId = firstKabs[0]?.id || kabupatenList[0]?.id || 1;

    setFormData({
      nama: "",
      kode: "",
      provinsiId: firstProv,
      kabupatenId: firstKabId,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (kec: KecamatanItem) => {
    setModalType("edit");
    setSelectedKec(kec);

    const targetKab = kabupatenList.find((kb) => kb.id === kec.kabupatenId);
    const targetProvId = targetKab?.provinsiId || kec.provinsiId || 1;

    setFormData({
      nama: kec.nama,
      kode: kec.kode || kec.code || "",
      provinsiId: targetProvId,
      kabupatenId: kec.kabupatenId,
    });
    setIsModalOpen(true);
  };

  const handleOpenDeleteModal = (kec: KecamatanItem) => {
    setKecToDelete(kec);
    setIsDeleteModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim()) {
      toast.error("Nama Kecamatan tidak boleh kosong!");
      return;
    }

    setIsSubmitting(true);
    try {
      if (modalType === "add") {
        await api.post("/areas/kecamatan", {
          name: formData.nama.trim(),
          code: formData.kode.trim() || undefined,
          kabupatenId: formData.kabupatenId,
        });
        toast.success(`Kecamatan "${formData.nama.trim()}" berhasil ditambahkan!`);
      } else if (selectedKec) {
        await api.put(`/areas/kecamatan/${selectedKec.id}`, {
          name: formData.nama.trim(),
          code: formData.kode.trim() || undefined,
          kabupatenId: formData.kabupatenId,
        });
        toast.success(`Kecamatan "${formData.nama.trim()}" berhasil diperbarui!`);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menyimpan data kecamatan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!kecToDelete) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/areas/kecamatan/${kecToDelete.id}`);
      toast.success(`Kecamatan "${kecToDelete.nama}" berhasil dihapus!`);
      setIsDeleteModalOpen(false);
      setKecToDelete(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menghapus kecamatan");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      {/* 1. Header Navigation & Title (SATU-SATUNYA TOMBOL TAMBAH) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#009966]/10 border border-[#009966]/20 text-[#009966] flex items-center justify-center shrink-0 shadow-2xs">
            <Compass size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
              Kecamatan
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Kelola data kecamatan terintegrasi secara real-time dengan backend.
            </p>
          </div>
        </div>

        {!isReadOnly && (
          <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#009966] hover:bg-[#008855] active:scale-95 text-white font-extrabold text-xs rounded-full shadow-xs transition-all cursor-pointer shrink-0"
            >
              <Plus size={16} />
              <span>Tambah Kecamatan</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Search Bar Container */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, kode, atau kabupaten..."
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
          Menampilkan <span className="text-slate-800 dark:text-slate-100">{filteredKecamatan.length}</span> Kecamatan
        </div>
      </div>

      {/* 3. Main Data Table: Flat Kecamatan -> Provinsi */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/80 text-[10.5px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-3.5 px-4 text-center w-14 whitespace-nowrap">NO</th>
                <th className="py-3.5 px-4 w-28 whitespace-nowrap">KODE</th>
                <th className="py-3.5 px-4 whitespace-nowrap">KECAMATAN</th>
                <th className="py-3.5 px-4 whitespace-nowrap">KOTA / KABUPATEN</th>
                <th className="py-3.5 px-4 whitespace-nowrap">PROVINSI</th>
                {!isReadOnly && <th className="py-3.5 px-4 text-center w-28 whitespace-nowrap">AKSI</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={isReadOnly ? 5 : 6} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#009966]/10 text-[#009966] flex items-center justify-center border border-[#009966]/20">
                        <Loader2 className="animate-spin text-[#009966]" size={22} />
                      </div>
                      <p className="text-xs font-black text-slate-800 dark:text-slate-100">Memuat Data Kecamatan Real-Time...</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={isReadOnly ? 5 : 6} className="py-12 text-center text-rose-600 font-bold text-xs">
                    <div className="flex flex-col items-center gap-2">
                      <AlertTriangle size={24} className="text-rose-500" />
                      <p>{error}</p>
                      <button
                        onClick={fetchData}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-200 transition cursor-pointer"
                      >
                        Coba Lagi
                      </button>
                    </div>
                  </td>
                </tr>
              ) : paginatedKecamatan.length > 0 ? (
                paginatedKecamatan.map((kec, index) => {
                  const itemNumber = (currentPage - 1) * itemsPerPage + index + 1;

                  return (
                    <tr
                      key={kec.id}
                      className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/80 dark:bg-slate-800/80 dark:hover:bg-slate-800/80 transition-colors text-xs text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap"
                    >
                      {/* NO */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-500 whitespace-nowrap">
                        {itemNumber}
                      </td>

                      {/* KODE */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold">
                        {kec.kode ? (
                          <span className="px-2.5 py-1 rounded-lg bg-[#009966]/10 dark:bg-[#009966]/20 text-[#009966] text-xs border border-[#009966]/20 shadow-2xs">
                            {kec.kode}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">-</span>
                        )}
                      </td>

                      {/* KECAMATAN */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">
                          {kec.nama}
                        </span>
                      </td>

                      {/* KOTA / KABUPATEN */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800 font-mono text-[11px] font-bold shrink-0">
                            {kec.kabupatenKode || "-"}
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                            {kec.kabupatenNama}
                          </span>
                        </div>
                      </td>

                      {/* PROVINSI */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800 font-mono text-[11px] font-bold shrink-0">
                            {kec.provinsiKode || "32"}
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                            {kec.provinsiNama}
                          </span>
                        </div>
                      </td>

                      {/* AKSI (HANYA EDIT & HAPUS, TANPA TOMBOL TAMBAH) */}
                      {!isReadOnly && (
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(kec)}
                              className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 hover:bg-amber-100/80 dark:hover:bg-amber-900/60 border border-amber-200/80 dark:border-amber-900/40 transition-all flex items-center justify-center cursor-pointer active:scale-95 shadow-2xs"
                              title="Edit Data Kecamatan"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenDeleteModal(kec)}
                              className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100/80 dark:hover:bg-rose-900/60 border border-rose-200/80 dark:border-rose-900/40 transition-all flex items-center justify-center cursor-pointer active:scale-95 shadow-2xs"
                              title="Hapus Kecamatan"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <EmptyTableState
                  colSpan={isReadOnly ? 5 : 6}
                  entityName="Kecamatan"
                  isSearch={!!searchTerm}
                  searchQuery={searchTerm}
                  onResetSearch={() => setSearchTerm("")}
                />
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Pagination */}
        {filteredKecamatan.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredKecamatan.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            itemsPerPageOptions={[5, 10, 25, 50]}
          />
        )}
      </div>

      {/* 4. Modal Tambah / Edit Kecamatan */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#009966]/10 text-[#009966] flex items-center justify-center font-bold">
                  <Compass size={18} />
                </div>
                <h3 className="font-black text-slate-900 dark:text-slate-100 text-base">
                  {modalType === "add" ? "Tambah Kecamatan Baru" : "Edit Data Kecamatan"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div>
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1">
                  Provinsi Induk <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.provinsiId}
                  onChange={(e) => {
                    const provId = Number(e.target.value);
                    const kabs = kabupatenList.filter((k) => k.provinsiId === provId);
                    const kabId = kabs[0]?.id || kabupatenList[0]?.id || 1;
                    setFormData({
                      ...formData,
                      provinsiId: provId,
                      kabupatenId: kabId,
                    });
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#009966] focus:bg-white transition-all cursor-pointer"
                >
                  {provinsiList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.kode ? `[${p.kode}] ` : ""}{p.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1">
                  Kota / Kabupaten Induk <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.kabupatenId}
                  onChange={(e) => setFormData({ ...formData, kabupatenId: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#009966] focus:bg-white transition-all cursor-pointer"
                >
                  {modalFilteredKabupaten.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.kode ? `[${k.kode}] ` : ""}{k.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1">
                  Nama Kecamatan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kecamatan Coblong"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#009966] focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1">
                  Kode Kecamatan (Kemendagri)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 02"
                  value={formData.kode}
                  onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#009966] focus:bg-white transition-all font-mono"
                  maxLength={10}
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
                  className="flex-1 py-2.5 bg-[#009966] hover:bg-[#008855] text-white font-extrabold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                  {modalType === "add" ? "Simpan Kecamatan" : "Update Kecamatan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Modal Hapus Kecamatan (Single Confirmation) */}
      {isDeleteModalOpen && kecToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 dark:border-slate-800 text-center space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto border border-rose-100">
              <Trash2 size={24} />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900 dark:text-slate-100">Konfirmasi Hapus</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Apakah Anda yakin ingin menghapus kecamatan <span className="font-bold text-slate-800 dark:text-slate-100">"{kecToDelete.nama}"</span> ({kecToDelete.kabupatenNama})?
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-xs rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
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

export default MasterKecamatan;
