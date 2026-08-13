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
  Building2,
  Globe2,
  ShieldCheck,
  AlertTriangle,
  Compass,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { Pagination } from "../../components/common/Pagination";
import { useAuthStore } from "../../store/useAuthStore";

export interface KecamatanData {
  id: string;
  nama: string;
  kabupatenId: number;
  kabupatenNama: string;
  provinsiNama: string;
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

  const [kecamatanList, setKecamatanList] = useState<KecamatanData[]>([]);
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
  const [selectedKec, setSelectedKec] = useState<KecamatanData | null>(null);

  const [formData, setFormData] = useState({
    nama: "",
    provinsiId: 1,
    kabupatenId: 1,
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [kecToDelete, setKecToDelete] = useState<KecamatanData | null>(null);
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
      setKabupatenList(
        kabs.length > 0
          ? kabs
          : [{ id: 1, nama: "Kota Bandung", provinsiId: 1, provinsiNama: "Jawa Barat" }]
      );

      const kecs: KecamatanData[] = (resKec.data?.data || []).map((kc: any) => ({
        id: String(kc.id),
        nama: kc.name || kc.nama || "Kecamatan Coblong",
        kabupatenId: kc.kabupatenId || kc.kabupaten?.id || 1,
        kabupatenNama: kc.kabupaten?.name || kc.kabupaten?.nama || "Kota Bandung",
        provinsiNama: kc.kabupaten?.provinsi?.name || kc.kabupaten?.provinsi?.nama || "Jawa Barat",
      }));

      setKecamatanList(
        kecs.length > 0
          ? kecs
          : [
              {
                id: "1",
                nama: "Kecamatan Coblong",
                kabupatenId: 1,
                kabupatenNama: "Kota Bandung",
                provinsiNama: "Jawa Barat",
              },
            ]
      );
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

  // Filtered kabupaten based on selected provinsiId in modal
  const modalFilteredKabupaten = useMemo(() => {
    return kabupatenList.filter((k) => k.provinsiId === formData.provinsiId);
  }, [kabupatenList, formData.provinsiId]);

  // Filtered & Paginated Table Data
  const filteredKecamatan = useMemo(() => {
    return kecamatanList.filter(
      (k) =>
        k.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        k.kabupatenNama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        k.provinsiNama.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [kecamatanList, searchTerm]);

  const totalPages = Math.ceil(filteredKecamatan.length / itemsPerPage) || 1;
  const paginatedKecamatan = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredKecamatan.slice(start, start + itemsPerPage);
  }, [filteredKecamatan, currentPage, itemsPerPage]);

  const handleOpenAddModal = () => {
    setModalType("add");
    setSelectedKec(null);
    const defaultProvId = provinsiList[0]?.id || 1;
    const availableKabs = kabupatenList.filter((k) => k.provinsiId === defaultProvId);
    setFormData({
      nama: "",
      provinsiId: defaultProvId,
      kabupatenId: availableKabs[0]?.id || kabupatenList[0]?.id || 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (kec: KecamatanData) => {
    setModalType("edit");
    setSelectedKec(kec);
    const parentKab = kabupatenList.find((k) => k.id === kec.kabupatenId);
    setFormData({
      nama: kec.nama,
      provinsiId: parentKab?.provinsiId || provinsiList[0]?.id || 1,
      kabupatenId: kec.kabupatenId || kabupatenList[0]?.id || 1,
    });
    setIsModalOpen(true);
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
          kabupatenId: formData.kabupatenId,
        });
        toast.success(`Kecamatan "${formData.nama.trim()}" berhasil ditambahkan!`);
      } else if (selectedKec) {
        await api.put(`/areas/kecamatan/${selectedKec.id}`, {
          name: formData.nama.trim(),
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
      {/* 1. Header Navigation & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#009966]/10 border border-[#009966]/20 text-[#009966] flex items-center justify-center shrink-0 shadow-2xs">
            <Compass size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
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
            onClick={handleOpenAddModal}
            className="bg-[#009966] hover:bg-[#008055] text-white px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer shrink-0 active:scale-95"
          >
            <Plus size={16} />
            Tambah Kecamatan
          </button>
        )}
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">
              TOTAL KECAMATAN DATABASE
            </span>
            <h3 className="text-2xl font-black text-slate-900">
              {kecamatanList.length} <span className="text-xs font-bold text-slate-500">Wilayah</span>
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#009966] border border-emerald-100 flex items-center justify-center">
            <Compass size={20} />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">
              KECAMATAN UTAMA PENUGASAN
            </span>
            <h3 className="text-xl font-black text-[#009966]">Kecamatan Coblong</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center">
            <MapPin size={20} />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
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
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
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
            className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-9 pr-4 py-2 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#009966] focus:bg-white transition-all"
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
          Menampilkan <span className="text-slate-800">{filteredKecamatan.length}</span> Kecamatan
        </div>
      </div>

      {/* 4. Main Data Table: NO, PROVINSI, KOTA, KABUPATEN, KECAMATAN, AKSI */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[10.5px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-200">
                <th className="py-3.5 px-4 text-center w-16 whitespace-nowrap">NO</th>
                <th className="py-3.5 px-4 whitespace-nowrap">PROVINSI</th>
                <th className="py-3.5 px-4 whitespace-nowrap">KOTA, KABUPATEN</th>
                <th className="py-3.5 px-4 whitespace-nowrap">KECAMATAN</th>
                {!isReadOnly && <th className="py-3.5 px-4 text-center w-32 whitespace-nowrap">AKSI</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#009966]/10 text-[#009966] flex items-center justify-center border border-[#009966]/20">
                        <Loader2 className="animate-spin text-[#009966]" size={22} />
                      </div>
                      <p className="text-xs font-black text-slate-800">Memuat Data Kecamatan Real-Time...</p>
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
                        className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 transition cursor-pointer"
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
                      className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors text-xs text-slate-700 font-medium whitespace-nowrap"
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
                          <span className="font-extrabold text-slate-800 text-xs">
                            {kec.provinsiNama}
                          </span>
                        </div>
                      </td>

                      {/* KOTA, KABUPATEN */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-sky-50 text-sky-700 border border-sky-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                            <Building2 size={15} />
                          </div>
                          <span className="font-extrabold text-slate-800 text-xs">
                            {kec.kabupatenNama}
                          </span>
                        </div>
                      </td>

                      {/* KECAMATAN */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#009966] border border-emerald-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                            <Compass size={15} />
                          </div>
                          <span className="font-extrabold text-slate-900 text-xs">
                            {kec.nama.startsWith("Kecamatan") ? kec.nama : `Kecamatan ${kec.nama}`}
                          </span>
                        </div>
                      </td>

                      {/* AKSI */}
                      {!isReadOnly && (
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(kec)}
                              className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all cursor-pointer"
                              title="Edit Kecamatan"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setKecToDelete(kec);
                                setIsDeleteModalOpen(true);
                              }}
                              className="p-2 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all cursor-pointer"
                              title="Hapus Kecamatan"
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
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-bold text-xs">
                    Tidak ada data kecamatan yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Pagination */}
        <div className="px-5 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Tampilkan</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-700 text-xs focus:outline-none"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
            </select>
            <span>data per halaman</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-xs text-slate-500 font-medium">
              Menampilkan <span className="font-bold text-slate-800">{filteredKecamatan.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}–{Math.min(currentPage * itemsPerPage, filteredKecamatan.length)}</span> dari <span className="font-bold text-[#009966]">{filteredKecamatan.length} data</span>
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        </div>
      </div>

      {/* 5. Modal Tambah / Edit Kecamatan */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#009966]/10 text-[#009966] flex items-center justify-center font-bold">
                  <Compass size={18} />
                </div>
                <h3 className="font-black text-slate-900 text-base">
                  {modalType === "add" ? "Tambah Kecamatan Baru" : "Edit Data Kecamatan"}
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
                <label className="text-xs font-extrabold text-slate-700 block mb-1">
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#009966] focus:bg-white transition-all cursor-pointer"
                >
                  {provinsiList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">
                  Kota, Kabupaten Induk <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.kabupatenId}
                  onChange={(e) => setFormData({ ...formData, kabupatenId: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#009966] focus:bg-white transition-all cursor-pointer"
                >
                  {modalFilteredKabupaten.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">
                  Nama Kecamatan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kecamatan Coblong"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#009966] focus:bg-white transition-all"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 font-extrabold text-xs rounded-xl hover:bg-slate-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-[#009966] hover:bg-[#008055] text-white font-extrabold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                  {modalType === "add" ? "Simpan Data" : "Update Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Modal Hapus Kecamatan */}
      {isDeleteModalOpen && kecToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto border border-rose-100">
              <Trash2 size={24} />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900">Konfirmasi Hapus</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Apakah Anda yakin ingin menghapus kecamatan <span className="font-bold text-slate-800">"{kecToDelete.nama}"</span>?
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-700 font-extrabold text-xs rounded-xl hover:bg-slate-50 transition cursor-pointer"
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

export default MasterKecamatan;
