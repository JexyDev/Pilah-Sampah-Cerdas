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
  Home,
  Tag,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { Pagination } from "../../components/common/Pagination";
import { useAuthStore } from "../../store/useAuthStore";

export interface RwItem {
  id: number;
  name: string;
  kelurahanId: string;
  kelurahanNama: string;
  kecamatanNama: string;
  kabupatenNama: string;
  provinsiNama: string;
}

export interface GroupedRw {
  kelurahanId: string;
  kelurahanNama: string;
  kecamatanNama: string;
  kabupatenNama: string;
  provinsiNama: string;
  rws: { id: number; name: string }[];
}

export interface KelurahanData {
  id: string;
  nama: string;
  kecamatanId: number;
  kecamatanNama: string;
  kabupatenNama: string;
  provinsiNama: string;
}

export interface KecamatanData {
  id: number;
  nama: string;
  kabupatenId: number;
}

export interface KabupatenData {
  id: number;
  nama: string;
  provinsiId: number;
}

export interface ProvinsiData {
  id: number;
  nama: string;
}

const formatKecName = (raw: string | undefined | null): string => {
  if (!raw || raw === "-") return "Kecamatan Coblong";
  const trimmed = raw.trim();
  if (/^kecamatan\s+/i.test(trimmed)) return trimmed;
  if (trimmed.toLowerCase().includes("coblong")) return "Kecamatan Coblong";
  const clean = trimmed.replace(/^kec\.?\s+/i, "").trim();
  return `Kecamatan ${clean.charAt(0).toUpperCase()}${clean.slice(1)}`;
};

const MasterRw: React.FC = () => {
  const { user } = useAuthStore();
  const isReadOnly = user?.peran === "PETUGAS_RESIDU" || user?.peran === "MAHASISWA_KKN";

  const [rawRwList, setRawRwList] = useState<RwItem[]>([]);
  const [kelurahanList, setKelurahanList] = useState<KelurahanData[]>([]);
  const [kecamatanList, setKecamatanList] = useState<KecamatanData[]>([]);
  const [kabupatenList, setKabupatenList] = useState<KabupatenData[]>([]);
  const [provinsiList, setProvinsiList] = useState<ProvinsiData[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"add" | "edit">("add");
  const [selectedRwToEdit, setSelectedRwToEdit] = useState<RwItem | null>(null);

  const [formData, setFormData] = useState({
    provinsiId: 1,
    kabupatenId: 1,
    kecamatanId: 1,
    kelurahanId: "",
    rwName: "",
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRwToDelete, setSelectedRwToDelete] = useState<RwItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch real data from backend API
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resRw, resKel, resKec, resKab, resProv] = await Promise.all([
        api.get("/areas/rw"),
        api.get("/areas/kelurahan"),
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
      }));
      setKabupatenList(kabs.length > 0 ? kabs : [{ id: 1, nama: "Kota Bandung", provinsiId: 1 }]);

      const kecs: KecamatanData[] = (resKec.data?.data || []).map((kc: any) => ({
        id: kc.id,
        nama: formatKecName(kc.name || kc.nama || "Kecamatan Coblong"),
        kabupatenId: kc.kabupatenId || kc.kabupaten?.id || 1,
      }));
      setKecamatanList(kecs.length > 0 ? kecs : [{ id: 1, nama: "Kecamatan Coblong", kabupatenId: 1 }]);

      const kels: KelurahanData[] = (resKel.data?.data || []).map((kl: any) => ({
        id: String(kl.id),
        nama: kl.name || kl.nama || "Dago",
        kecamatanId: kl.kecamatanId || kl.kecamatan?.id || 1,
        kecamatanNama: formatKecName(kl.kecamatan?.name || kl.kecamatan?.nama || "Kecamatan Coblong"),
        kabupatenNama: kl.kecamatan?.kabupaten?.name || kl.kecamatan?.kabupaten?.nama || "Kota Bandung",
        provinsiNama: kl.kecamatan?.kabupaten?.provinsi?.name || kl.kecamatan?.kabupaten?.provinsi?.nama || "Jawa Barat",
      }));
      setKelurahanList(kels);

      const rws: RwItem[] = (resRw.data?.data || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        kelurahanId: String(r.kelurahanId || r.kelurahan?.id || ""),
        kelurahanNama: r.kelurahan?.name || r.kelurahan?.nama || "Dago",
        kecamatanNama: formatKecName(r.kelurahan?.kecamatan?.name || r.kelurahan?.kecamatan?.nama || "Kecamatan Coblong"),
        kabupatenNama: r.kelurahan?.kecamatan?.kabupaten?.name || r.kelurahan?.kecamatan?.kabupaten?.nama || "Kota Bandung",
        provinsiNama: r.kelurahan?.kecamatan?.kabupaten?.provinsi?.name || r.kelurahan?.kecamatan?.kabupaten?.provinsi?.nama || "Jawa Barat",
      }));

      setRawRwList(rws);
    } catch (err: any) {
      console.error("Gagal memuat data RW dari backend:", err);
      setError("Gagal memuat data Rukun Warga dari server real-time.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Group RW by Kelurahan for structured row presentation
  const groupedData: GroupedRw[] = useMemo(() => {
    const map = new Map<string, GroupedRw>();

    // Seed empty groups from kelurahanList first
    kelurahanList.forEach((kel) => {
      const parentKec = kecamatanList.find((kc) => kc.id === kel.kecamatanId);
      const parentKab = kabupatenList.find((kb) => kb.id === parentKec?.kabupatenId);
      const parentProv = provinsiList.find((pv) => pv.id === parentKab?.provinsiId);

      map.set(kel.id, {
        kelurahanId: kel.id,
        kelurahanNama: kel.nama,
        kecamatanNama: formatKecName(kel.kecamatanNama || parentKec?.nama || "Kecamatan Coblong"),
        kabupatenNama: kel.kabupatenNama || parentKab?.nama || "Kota Bandung",
        provinsiNama: kel.provinsiNama || parentProv?.nama || "Jawa Barat",
        rws: [],
      });
    });

    // Populate RWs into corresponding group
    rawRwList.forEach((r) => {
      let group = map.get(r.kelurahanId);
      if (!group) {
        group = {
          kelurahanId: r.kelurahanId,
          kelurahanNama: r.kelurahanNama,
          kecamatanNama: r.kecamatanNama,
          kabupatenNama: r.kabupatenNama,
          provinsiNama: r.provinsiNama,
          rws: [],
        };
        map.set(r.kelurahanId, group);
      }
      group.rws.push({ id: r.id, name: r.name });
    });

    // Sort RW items inside each group numerically
    map.forEach((grp) => {
      grp.rws.sort((a, b) => {
        const numA = parseInt(a.name.replace(/\D/g, "") || "0", 10);
        const numB = parseInt(b.name.replace(/\D/g, "") || "0", 10);
        return numA - numB;
      });
    });

    return Array.from(map.values());
  }, [rawRwList, kelurahanList, kecamatanList, kabupatenList, provinsiList]);

  // Filtered & Paginated Table Data
  const filteredGroups = useMemo(() => {
    if (!searchTerm.trim()) return groupedData;
    const term = searchTerm.toLowerCase();
    return groupedData.filter(
      (g) =>
        g.kelurahanNama.toLowerCase().includes(term) ||
        g.kecamatanNama.toLowerCase().includes(term) ||
        g.kabupatenNama.toLowerCase().includes(term) ||
        g.provinsiNama.toLowerCase().includes(term) ||
        g.rws.some((rw) => rw.name.toLowerCase().includes(term))
    );
  }, [groupedData, searchTerm]);

  const totalPages = Math.ceil(filteredGroups.length / itemsPerPage) || 1;
  const paginatedGroups = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredGroups.slice(start, start + itemsPerPage);
  }, [filteredGroups, currentPage, itemsPerPage]);

  // Modal Open Handlers
  const handleOpenAddModal = (defaultKelId?: string) => {
    setModalType("add");
    setSelectedRwToEdit(null);

    const defaultKel = defaultKelId || kelurahanList[0]?.id || "";
    const selectedKelObj = kelurahanList.find((k) => k.id === defaultKel);
    const parentKecId = selectedKelObj?.kecamatanId || kecamatanList[0]?.id || 1;
    const parentKecObj = kecamatanList.find((kc) => kc.id === parentKecId);
    const parentKabId = parentKecObj?.kabupatenId || kabupatenList[0]?.id || 1;
    const parentKabObj = kabupatenList.find((kb) => kb.id === parentKabId);
    const parentProvId = parentKabObj?.provinsiId || provinsiList[0]?.id || 1;

    setFormData({
      provinsiId: parentProvId,
      kabupatenId: parentKabId,
      kecamatanId: parentKecId,
      kelurahanId: defaultKel,
      rwName: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rw: RwItem) => {
    setModalType("edit");
    setSelectedRwToEdit(rw);

    const selectedKelObj = kelurahanList.find((k) => k.id === rw.kelurahanId);
    const parentKecId = selectedKelObj?.kecamatanId || kecamatanList[0]?.id || 1;

    setFormData({
      provinsiId: provinsiList[0]?.id || 1,
      kabupatenId: kabupatenList[0]?.id || 1,
      kecamatanId: parentKecId,
      kelurahanId: rw.kelurahanId,
      rwName: rw.name,
    });
    setIsModalOpen(true);
  };

  const handleOpenDeleteModal = (rw: RwItem) => {
    setSelectedRwToDelete(rw);
    setIsDeleteModalOpen(true);
  };

  // Submit Add / Edit Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.rwName.trim()) {
      toast.error("Nama RW tidak boleh kosong!");
      return;
    }
    if (!formData.kelurahanId) {
      toast.error("Pilih Kelurahan terlebih dahulu!");
      return;
    }

    setIsSubmitting(true);
    try {
      if (modalType === "add") {
        await api.post("/areas/rw", {
          name: formData.rwName.trim(),
          kelurahanId: formData.kelurahanId,
        });
        toast.success(`Rukun Warga "${formData.rwName.trim()}" berhasil ditambahkan!`);
      } else if (selectedRwToEdit) {
        await api.put(`/areas/rw/${selectedRwToEdit.id}`, {
          name: formData.rwName.trim(),
          kelurahanId: formData.kelurahanId,
        });
        toast.success(`Rukun Warga "${formData.rwName.trim()}" berhasil diperbarui!`);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menyimpan data Rukun Warga");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Delete RW
  const confirmDelete = async () => {
    if (!selectedRwToDelete) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/areas/rw/${selectedRwToDelete.id}`);
      toast.success(`Rukun Warga "${selectedRwToDelete.name}" berhasil dihapus!`);
      setIsDeleteModalOpen(false);
      setSelectedRwToDelete(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menghapus Rukun Warga");
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
            <Tag size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
              Rukun Warga
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Kelola data Rukun Warga (RW) terintegrasi secara real-time dengan backend & Master Pengguna.
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
            Tambah Rukun Warga
          </button>
        )}
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">
              TOTAL RUKUN WARGA DATABASE
            </span>
            <h3 className="text-2xl font-black text-slate-900">
              {rawRwList.length} <span className="text-xs font-bold text-slate-500">RW</span>
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#009966] border border-emerald-100 flex items-center justify-center">
            <Tag size={20} />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">
              CAKUPAN PENUGASAN UTAMA
            </span>
            <h3 className="text-xl font-black text-[#009966]">6 Kelurahan Coblong</h3>
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
            placeholder="Cari Rukun Warga..."
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
          Menampilkan <span className="text-slate-800">{filteredGroups.length}</span> Kelurahan
        </div>
      </div>

      {/* 4. Main Data Table: NO, PROVINSI, KOTA, KABUPATEN, KECAMATAN, KELURAHAN, RUKUN WARGA, AKSI */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[10.5px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-200">
                <th className="py-3.5 px-4 text-center w-16 whitespace-nowrap">NO</th>
                <th className="py-3.5 px-4 whitespace-nowrap">PROVINSI</th>
                <th className="py-3.5 px-4 whitespace-nowrap">KOTA, KABUPATEN</th>
                <th className="py-3.5 px-4 whitespace-nowrap">KECAMATAN</th>
                <th className="py-3.5 px-4 whitespace-nowrap">KELURAHAN</th>
                <th className="py-3.5 px-4 whitespace-nowrap">RUKUN WARGA</th>
                {!isReadOnly && <th className="py-3.5 px-4 text-center w-32 whitespace-nowrap">AKSI</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#009966]/10 text-[#009966] flex items-center justify-center border border-[#009966]/20">
                        <Loader2 className="animate-spin text-[#009966]" size={22} />
                      </div>
                      <p className="text-xs font-black text-slate-800">Memuat Data Rukun Warga Real-Time...</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-rose-600 font-bold text-xs">
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
              ) : paginatedGroups.length > 0 ? (
                paginatedGroups.map((group, index) => {
                  const itemNumber = (currentPage - 1) * itemsPerPage + index + 1;

                  return (
                    <tr
                      key={group.kelurahanId}
                      className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors text-xs text-slate-700 font-medium"
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
                          <span className="font-extrabold text-slate-800 text-xs">
                            {group.kabupatenNama}
                          </span>
                        </div>
                      </td>

                      {/* KECAMATAN */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#009966] border border-emerald-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                            <Compass size={15} />
                          </div>
                          <span className="font-extrabold text-slate-800 text-xs">
                            {group.kecamatanNama}
                          </span>
                        </div>
                      </td>

                      {/* KELURAHAN */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#009966] border border-emerald-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                            <Home size={15} />
                          </div>
                          <span className="font-extrabold text-slate-800 text-xs">
                            {group.kelurahanNama.startsWith("Kel.") ? group.kelurahanNama : `Kel. ${group.kelurahanNama}`}
                          </span>
                        </div>
                      </td>

                      {/* RUKUN WARGA Badges */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap items-center gap-1.5 max-w-md">
                          {group.rws.length === 0 ? (
                            <span className="text-slate-400 text-[11px] italic font-semibold">Belum ada RW</span>
                          ) : (
                            group.rws.map((rw) => (
                              <div
                                key={rw.id}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-[#009966] border border-emerald-200/80 text-[11px] font-mono font-black shadow-2xs hover:bg-emerald-100 transition-all group/badge"
                              >
                                <Tag size={11} className="text-[#009966]" />
                                <span>{rw.name}</span>
                                {!isReadOnly && (
                                  <button
                                    onClick={() =>
                                      handleOpenEditModal({
                                        id: rw.id,
                                        name: rw.name,
                                        kelurahanId: group.kelurahanId,
                                        kelurahanNama: group.kelurahanNama,
                                        kecamatanNama: group.kecamatanNama,
                                        kabupatenNama: group.kabupatenNama,
                                        provinsiNama: group.provinsiNama,
                                      })
                                    }
                                    title="Edit RW ini"
                                    className="ml-1 opacity-0 group-hover/badge:opacity-100 text-emerald-700 hover:text-emerald-950 transition-all cursor-pointer"
                                  >
                                    <Pencil size={11} />
                                  </button>
                                )}
                              </div>
                            ))
                          )}

                          {!isReadOnly && (
                            <button
                              onClick={() => handleOpenAddModal(group.kelurahanId)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#009966] text-slate-600 hover:text-white border border-slate-200 hover:border-[#009966] text-[11px] font-bold transition-all cursor-pointer active:scale-95"
                              title="Tambah RW baru di kelurahan ini"
                            >
                              <Plus size={12} />
                              <span>Tambah RW</span>
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
                              onClick={() => handleOpenAddModal(group.kelurahanId)}
                              className="p-2 rounded-xl text-emerald-600 hover:text-white hover:bg-[#009966] border border-emerald-100 hover:border-[#009966] transition-all cursor-pointer shadow-2xs"
                              title="Tambah RW Baru"
                            >
                              <Plus size={15} />
                            </button>
                            {group.rws.length > 0 && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenEditModal({
                                    id: group.rws[0].id,
                                    name: group.rws[0].name,
                                    kelurahanId: group.kelurahanId,
                                    kelurahanNama: group.kelurahanNama,
                                    kecamatanNama: group.kecamatanNama,
                                    kabupatenNama: group.kabupatenNama,
                                    provinsiNama: group.provinsiNama,
                                  })
                                }
                                className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all cursor-pointer"
                                title="Edit RW Pertama"
                              >
                                <Pencil size={15} />
                              </button>
                            )}
                            {group.rws.length > 0 && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenDeleteModal({
                                    id: group.rws[group.rws.length - 1].id,
                                    name: group.rws[group.rws.length - 1].name,
                                    kelurahanId: group.kelurahanId,
                                    kelurahanNama: group.kelurahanNama,
                                    kecamatanNama: group.kecamatanNama,
                                    kabupatenNama: group.kabupatenNama,
                                    provinsiNama: group.provinsiNama,
                                  })
                                }
                                className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all cursor-pointer"
                                title="Hapus RW Terakhir"
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
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-bold text-xs">
                    Data Rukun Warga tidak ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Pagination Footer */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold text-slate-500">
          <div className="flex items-center gap-2">
            <span>Tampilkan</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-800 font-bold focus:outline-none cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>data per halaman</span>
          </div>

          <div className="flex items-center gap-4">
            <span>
              Menampilkan{" "}
              <strong className="text-slate-800">
                {filteredGroups.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}-
                {Math.min(currentPage * itemsPerPage, filteredGroups.length)}
              </strong>{" "}
              dari <strong className="text-[#009966]">{filteredGroups.length} data</strong>
            </span>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        </div>
      </div>

      {/* MODAL TAMBAH / EDIT RW */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-[#009966] flex items-center justify-center font-bold">
                  {modalType === "add" ? <Plus size={18} /> : <Pencil size={18} />}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">
                    {modalType === "add" ? "Tambah Data Rukun Warga" : "Edit Data Rukun Warga"}
                  </h3>
                  <p className="text-[11px] font-medium text-slate-400">
                    {modalType === "add"
                      ? "Tambahkan RW baru ke kelurahan penugasan"
                      : "Ubah nama RW atau pindah kelurahan"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              {/* Provinsi */}
              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">Provinsi *</label>
                <select
                  disabled
                  value={formData.provinsiId}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-500 cursor-not-allowed"
                >
                  {provinsiList.map((p) => (
                    <option key={p.id} value={p.id}>{p.nama}</option>
                  ))}
                </select>
              </div>

              {/* Kota, Kabupaten */}
              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">Kota, Kabupaten *</label>
                <select
                  disabled
                  value={formData.kabupatenId}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-500 cursor-not-allowed"
                >
                  {kabupatenList.map((k) => (
                    <option key={k.id} value={k.id}>{k.nama}</option>
                  ))}
                </select>
              </div>

              {/* Kecamatan */}
              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">Kecamatan *</label>
                <select
                  disabled
                  value={formData.kecamatanId}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-500 cursor-not-allowed"
                >
                  {kecamatanList.map((kc) => (
                    <option key={kc.id} value={kc.id}>{kc.nama}</option>
                  ))}
                </select>
              </div>

              {/* Kelurahan */}
              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">
                  Kelurahan Penugasan <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.kelurahanId}
                  onChange={(e) => setFormData({ ...formData, kelurahanId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#009966] focus:bg-white transition-all cursor-pointer"
                >
                  {kelurahanList.map((kl) => (
                    <option key={kl.id} value={kl.id}>Kel. {kl.nama}</option>
                  ))}
                </select>
              </div>

              {/* Nama RW */}
              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">
                  Nama Rukun Warga (RW) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: RW 07 (atau RW 07, RW 08 untuk sekaligus)"
                  value={formData.rwName}
                  onChange={(e) => setFormData({ ...formData, rwName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#009966] focus:bg-white transition-all"
                />
                {modalType === "add" && (
                  <span className="text-[10px] text-slate-400 font-semibold mt-1 block">
                    Bisa mengisikan beberapa RW sekaligus dipisah koma (Contoh: RW 07, RW 08)
                  </span>
                )}
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-extrabold text-xs hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#009966] hover:bg-[#008055] text-white font-extrabold text-xs shadow-md shadow-emerald-700/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan RW"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL HAPUS RW */}
      {isDeleteModalOpen && selectedRwToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle size={28} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800">Hapus Data RW</h3>
              <p className="text-xs font-semibold text-slate-500 mt-1">
                Apakah Anda yakin ingin menghapus <strong className="text-rose-600">{selectedRwToDelete.name}</strong> dari <strong className="text-slate-800">Kel. {selectedRwToDelete.kelurahanNama}</strong>?
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-extrabold text-xs hover:bg-slate-50 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-600/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Menghapus..." : "Ya, Hapus RW"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterRw;
