/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  MapPin,
  Search,
  Plus,
  Trash2,
  Loader2,
  X,
  Building2,
  Globe2,
  ShieldCheck,
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
  kabupatenId: number;
  kabupatenNama: string;
  provinsiNama: string;
}

export interface GroupedKecamatan {
  kabupatenId: number;
  kabupatenNama: string;
  provinsiNama: string;
  items: { id: number; nama: string }[];
}

export interface KabupatenData {
  id: number;
  nama: string;
  provinsiId: number;
  provinsiNama: string;
}

export interface ProvinsiData {
  id: number;
  nama: string;
}

const MasterKecamatan: React.FC = () => {
  const { user } = useAuthStore();
  const isReadOnly = user?.peran === "PETUGAS_RESIDU" || user?.peran === "MAHASISWA_KKN";

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
  const [formData, setFormData] = useState({
    nama: "",
    provinsiId: 1,
    kabupatenId: 1,
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedGroupToDelete, setSelectedGroupToDelete] = useState<GroupedKecamatan | null>(null);
  const [selectedKecIdsToDelete, setSelectedKecIdsToDelete] = useState<number[]>([]);
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
      }));
      setProvinsiList(provs.length > 0 ? provs : [{ id: 1, nama: "Jawa Barat" }]);

      const kabs: KabupatenData[] = (resKab.data?.data || []).map((k: any) => ({
        id: k.id,
        nama: k.name || k.nama || "Kota Bandung",
        provinsiId: k.provinsiId || k.provinsi?.id || 1,
        provinsiNama: k.provinsi?.name || k.provinsi?.nama || "Jawa Barat",
      }));
      setKabupatenList(kabs);

      const formatKecName = (raw: string) => {
        if (!raw) return "Kecamatan";
        const trimmed = raw.trim();
        if (/^kecamatan\s+/i.test(trimmed)) return trimmed;
        const clean = trimmed.replace(/^kec\.?\s+/i, "").trim();
        return `Kecamatan ${clean.charAt(0).toUpperCase()}${clean.slice(1)}`;
      };

      const kecs: KecamatanItem[] = (resKec.data?.data || []).map((kc: any) => ({
        id: Number(kc.id),
        nama: formatKecName(kc.name || kc.nama || "Kecamatan"),
        kabupatenId: Number(kc.kabupatenId || kc.kabupaten?.id || 1),
        kabupatenNama: kc.kabupaten?.name || kc.kabupaten?.nama || "Kota Bandung",
        provinsiNama: kc.kabupaten?.provinsi?.name || kc.kabupaten?.provinsi?.nama || "Jawa Barat",
      }));

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

  // Group Kecamatan by Kota/Kabupaten
  const groupedData: GroupedKecamatan[] = useMemo(() => {
    const map = new Map<number, GroupedKecamatan>();

    kabupatenList.forEach((kab) => {
      map.set(kab.id, {
        kabupatenId: kab.id,
        kabupatenNama: kab.nama,
        provinsiNama: kab.provinsiNama || "Jawa Barat",
        items: [],
      });
    });

    kecamatanList.forEach((kc) => {
      let group = map.get(kc.kabupatenId);
      if (!group) {
        group = {
          kabupatenId: kc.kabupatenId,
          kabupatenNama: kc.kabupatenNama || "Kota Bandung",
          provinsiNama: kc.provinsiNama || "Jawa Barat",
          items: [],
        };
        map.set(kc.kabupatenId, group);
      }
      group.items.push({ id: kc.id, nama: kc.nama });
    });

    return Array.from(map.values());
  }, [kecamatanList, kabupatenList]);

  // Filtered & Paginated Table Data
  const filteredGroups = useMemo(() => {
    if (!searchTerm.trim()) return groupedData;
    const term = searchTerm.toLowerCase();
    return groupedData.filter(
      (g) =>
        g.kabupatenNama.toLowerCase().includes(term) ||
        g.provinsiNama.toLowerCase().includes(term) ||
        g.items.some((item) => item.nama.toLowerCase().includes(term))
    );
  }, [groupedData, searchTerm]);

  const totalPages = Math.ceil(filteredGroups.length / itemsPerPage) || 1;
  const paginatedGroups = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredGroups.slice(start, start + itemsPerPage);
  }, [filteredGroups, currentPage, itemsPerPage]);

  // Filtered kabupaten based on selected provinsiId in modal
  const modalFilteredKabupaten = useMemo(() => {
    return kabupatenList.filter((k) => k.provinsiId === formData.provinsiId);
  }, [kabupatenList, formData.provinsiId]);

  const handleOpenAddModal = (defaultKabId?: number) => {
    const selectedKabObj = kabupatenList.find((k) => k.id === defaultKabId) || kabupatenList[0];
    const provId = selectedKabObj?.provinsiId || provinsiList[0]?.id || 1;

    setFormData({
      nama: "",
      provinsiId: provId,
      kabupatenId: selectedKabObj?.id || 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenDeleteModal = (group: GroupedKecamatan) => {
    setSelectedGroupToDelete(group);
    setSelectedKecIdsToDelete(group.items.map((item) => item.id));
    setIsDeleteModalOpen(true);
  };

  const handleToggleKecSelect = (id: number) => {
    setSelectedKecIdsToDelete((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (!selectedGroupToDelete) return;
    if (selectedKecIdsToDelete.length === selectedGroupToDelete.items.length) {
      setSelectedKecIdsToDelete([]);
    } else {
      setSelectedKecIdsToDelete(selectedGroupToDelete.items.map((i) => i.id));
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim()) {
      toast.error("Nama Kecamatan tidak boleh kosong!");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/areas/kecamatan", {
        name: formData.nama.trim(),
        kabupatenId: formData.kabupatenId,
      });
      toast.success(`Kecamatan "${formData.nama.trim()}" berhasil ditambahkan!`);
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menyimpan data kecamatan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteBatch = async () => {
    if (!selectedGroupToDelete || selectedKecIdsToDelete.length === 0) {
      toast.error("Pilih minimal satu Kecamatan yang ingin dihapus!");
      return;
    }
    setIsSubmitting(true);
    try {
      await Promise.all(
        selectedKecIdsToDelete.map((id) => api.delete(`/areas/kecamatan/${id}`))
      );
      toast.success(`${selectedKecIdsToDelete.length} Kecamatan berhasil dihapus!`);
      setIsDeleteModalOpen(false);
      setSelectedGroupToDelete(null);
      setSelectedKecIdsToDelete([]);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menghapus kecamatan terpilih");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      {/* 1. Header Navigation & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#009966]/10 border border-[#009966]/20 text-[#009966] flex items-center justify-center shrink-0 shadow-2xs">
            <Compass size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
              Kecamatan
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Kelola data kecamatan terintegrasi secara real-time dengan backend & Master Pengguna.
            </p>
          </div>
        </div>

        {!isReadOnly && (
          <button
            type="button"
            onClick={() => handleOpenAddModal()}
            className="bg-[#009966] hover:bg-[#008055] text-white px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer shrink-0 active:scale-95"
          >
            <Plus size={16} />
            Tambah Kecamatan
          </button>
        )}
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">
              TOTAL KECAMATAN DATABASE
            </span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {kecamatanList.length} <span className="text-xs font-bold text-slate-500">Wilayah</span>
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#009966] border border-emerald-100 flex items-center justify-center">
            <Compass size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">
              KECAMATAN UTAMA PENUGASAN
            </span>
            <h3 className="text-xl font-black text-[#009966]">{kecamatanList[0]?.nama || "Kecamatan Terdata"}</h3>
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
            placeholder="Cari kecamatan..."
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
          Menampilkan <span className="text-slate-800 dark:text-slate-100">{filteredGroups.length}</span> Kota, Kabupaten
        </div>
      </div>

      {/* 4. Main Data Table: Grouped by Kota/Kabupaten */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/80 text-[10.5px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-3.5 px-4 text-center w-16 whitespace-nowrap">NO</th>
                <th className="py-3.5 px-4 whitespace-nowrap">PROVINSI</th>
                <th className="py-3.5 px-4 whitespace-nowrap">KOTA, KABUPATEN</th>
                <th className="py-3.5 px-4 whitespace-nowrap">KECAMATAN</th>
                {!isReadOnly && <th className="py-3.5 px-4 text-center w-32 whitespace-nowrap">AKSI</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
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
                  <td colSpan={5} className="py-12 text-center text-rose-600 font-bold text-xs">
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
              ) : paginatedGroups.length > 0 ? (
                paginatedGroups.map((group, index) => {
                  const itemNumber = (currentPage - 1) * itemsPerPage + index + 1;

                  return (
                    <tr
                      key={group.kabupatenId}
                      className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/80 dark:bg-slate-800/80 dark:hover:bg-slate-800/80 transition-colors text-xs text-slate-700 dark:text-slate-300 font-medium"
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
                          <span className="font-extrabold text-slate-800 dark:text-slate-100 text-xs">
                            {group.provinsiNama}
                          </span>
                        </div>
                      </td>

                      {/* KOTA, KABUPATEN */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-sky-50 text-sky-700 border border-sky-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                            <Building2 size={15} />
                          </div>
                          <span className="font-extrabold text-slate-800 dark:text-slate-100 text-xs">
                            {group.kabupatenNama}
                          </span>
                        </div>
                      </td>

                      {/* KECAMATAN Badges */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap items-center gap-1.5 max-w-2xl">
                          {group.items.length === 0 ? (
                            <span className="text-slate-400 text-[11px] italic font-semibold">Belum ada kecamatan</span>
                          ) : (
                            group.items.map((kec) => (
                              <div
                                key={kec.id}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#e5f7ed] text-[#009966] border border-[#009966]/20 text-[11px] font-mono font-black shadow-2xs hover:bg-[#d0f2df] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                              >
                                <Compass size={12} className="text-[#009966]" />
                                <span>{kec.nama}</span>
                              </div>
                            ))
                          )}

                          {!isReadOnly && (
                            <button
                              onClick={() => handleOpenAddModal(group.kabupatenId)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-[#009966] text-slate-600 dark:text-slate-400 hover:text-white border border-slate-200 dark:border-slate-800 hover:border-[#009966] text-[11px] font-bold transition-all duration-200 cursor-pointer active:scale-95"
                              title="Tambah Kecamatan baru di kota/kabupaten ini"
                            >
                              <Plus size={12} />
                              <span>Tambah Kecamatan</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* AKSI */}
                      {!isReadOnly && (
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenAddModal(group.kabupatenId)}
                              className="p-2 rounded-xl text-emerald-600 hover:text-white hover:bg-[#009966] border border-emerald-100 hover:border-[#009966] transition-all duration-200 cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                              title="Tambah Kecamatan Baru"
                            >
                              <Plus size={15} />
                            </button>
                            {group.items.length > 0 && (
                              <button
                                type="button"
                                onClick={() => handleOpenDeleteModal(group)}
                                className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95"
                                title="Pilih & Hapus Kecamatan"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <EmptyTableState
                  colSpan={5}
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
        {filteredGroups.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredGroups.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            itemsPerPageOptions={[5, 10, 25, 50]}
          />
        )}
      </div>

      {/* 5. Modal Tambah Kecamatan */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#009966]/10 text-[#009966] flex items-center justify-center font-bold">
                  <Compass size={18} />
                </div>
                <h3 className="font-black text-slate-900 dark:text-slate-100 text-base">
                  Tambah Kecamatan Baru
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
                  Provinsi Induk <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.provinsiId}
                  onChange={(e) => {
                    const provId = Number(e.target.value);
                    const kabs = kabupatenList.filter((k) => k.provinsiId === provId);
                    setFormData({
                      ...formData,
                      provinsiId: provId,
                      kabupatenId: kabs[0]?.id || kabupatenList[0]?.id || 1,
                    });
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#009966] focus:bg-white transition-all cursor-pointer"
                >
                  {provinsiList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1">
                  Kota, Kabupaten Induk <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.kabupatenId}
                  onChange={(e) => setFormData({ ...formData, kabupatenId: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#009966] focus:bg-white transition-all cursor-pointer"
                >
                  {modalFilteredKabupaten.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama}
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
                  placeholder="Contoh: Kecamatan Sukasari"
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
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Modal Hapus Kecamatan dengan Checkbox Multi-Seleksi */}
      {isDeleteModalOpen && selectedGroupToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 max-w-lg w-full overflow-hidden">
            {/* Header Modal */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-rose-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold shrink-0">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                    Hapus Data Kecamatan
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-500">
                    {selectedGroupToDelete.kabupatenNama} ({selectedGroupToDelete.provinsiNama})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body Form Multi-Select */}
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                  Pilih Kecamatan Yang Ingin Dihapus:
                </span>
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="text-[11px] font-black text-[#009966] hover:underline cursor-pointer"
                >
                  {selectedKecIdsToDelete.length === selectedGroupToDelete.items.length
                    ? "Batal Pilih Semua"
                    : "Pilih Semua"}
                </button>
              </div>

              {/* List items with Checkboxes */}
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                {selectedGroupToDelete.items.map((kec) => {
                  const isChecked = selectedKecIdsToDelete.includes(kec.id);
                  return (
                    <div
                      key={kec.id}
                      onClick={() => handleToggleKecSelect(kec.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                        isChecked
                          ? "bg-rose-50/70 border-rose-200 text-rose-900 font-extrabold"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-300 font-bold"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
                        />
                        <span className="text-xs font-mono">{kec.nama}</span>
                      </div>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase ${
                          isChecked
                            ? "bg-rose-100 text-rose-700 border border-rose-200"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
                        }`}
                      >
                        {isChecked ? "Akan Dihapus" : "Tetap Simpan"}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Counter Summary */}
              <div className="text-center pt-2">
                <p className="text-xs text-slate-500 font-semibold">
                  Menandai <strong className="text-rose-600 font-black">{selectedKecIdsToDelete.length}</strong> dari{" "}
                  <strong className="text-slate-800 dark:text-slate-100 font-black">{selectedGroupToDelete.items.length}</strong> Kecamatan untuk dihapus.
                </p>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 bg-slate-50/80 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-extrabold text-xs hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteBatch}
                disabled={isSubmitting || selectedKecIdsToDelete.length === 0}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-600/20 active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Trash2 size={15} />
                <span>
                  {isSubmitting
                    ? "Menghapus..."
                    : `Hapus ${selectedKecIdsToDelete.length} Kecamatan Terpilih`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterKecamatan;
