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
  AlertTriangle,
  Home,
  Tag,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { Pagination } from "../../components/common/Pagination";
import { EmptyTableState } from "../../components/common/EmptyTableState";
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
  if (!raw || raw === "-") return "Kecamatan";
  const trimmed = raw.trim();
  if (/^kecamatan\s+/i.test(trimmed)) return trimmed;
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
    rwNumber: "",
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedGroupToDelete, setSelectedGroupToDelete] = useState<GroupedRw | null>(null);
  const [selectedRwIdsToDelete, setSelectedRwIdsToDelete] = useState<number[]>([]);
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
        nama: formatKecName(kc.name || kc.nama || "Kecamatan"),
        kabupatenId: kc.kabupatenId || kc.kabupaten?.id || 1,
      }));
      setKecamatanList(kecs.length > 0 ? kecs : [{ id: 1, nama: "Kecamatan Terdaftar", kabupatenId: 1 }]);

      const kels: KelurahanData[] = (resKel.data?.data || []).map((kl: any) => ({
        id: String(kl.id),
        nama: kl.name || kl.nama || "Dago",
        kecamatanId: kl.kecamatanId || kl.kecamatan?.id || 1,
        kecamatanNama: formatKecName(kl.kecamatan?.name || kl.kecamatan?.nama || "Kecamatan"),
        kabupatenNama: kl.kecamatan?.kabupaten?.name || kl.kecamatan?.kabupaten?.nama || "Kota Bandung",
        provinsiNama: kl.kecamatan?.kabupaten?.provinsi?.name || kl.kecamatan?.kabupaten?.provinsi?.nama || "Jawa Barat",
      }));
      setKelurahanList(kels);

      const rws: RwItem[] = (resRw.data?.data || []).map((r: any) => ({
        id: r.id,
        name: (r.name || "").split("(")[0].trim(),
        kelurahanId: String(r.kelurahanId || r.kelurahan?.id || ""),
        kelurahanNama: r.kelurahan?.name || r.kelurahan?.nama || "Dago",
        kecamatanNama: formatKecName(r.kelurahan?.kecamatan?.name || r.kelurahan?.kecamatan?.nama || "Kecamatan"),
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
        kecamatanNama: formatKecName(kel.kecamatanNama || parentKec?.nama || "Kecamatan"),
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

  // Modal Cascaded Location Filters
  const modalFilteredKabupaten = useMemo(() => {
    return kabupatenList.filter((k) => k.provinsiId === formData.provinsiId);
  }, [kabupatenList, formData.provinsiId]);

  const modalFilteredKecamatan = useMemo(() => {
    return kecamatanList.filter((kc) => kc.kabupatenId === formData.kabupatenId);
  }, [kecamatanList, formData.kabupatenId]);

  const modalFilteredKelurahan = useMemo(() => {
    return kelurahanList.filter((kl) => Number(kl.kecamatanId) === Number(formData.kecamatanId));
  }, [kelurahanList, formData.kecamatanId]);

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
      rwNumber: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rw: { id: number; name: string }, kelurahanId: string) => {
    setModalType("edit");
    const foundRw = rawRwList.find((r) => r.id === rw.id);
    if (foundRw) {
      setSelectedRwToEdit(foundRw);
    } else {
      setSelectedRwToEdit({
        id: rw.id,
        name: rw.name,
        kelurahanId,
        kelurahanNama: "",
        kecamatanNama: "",
        kabupatenNama: "",
        provinsiNama: "",
      });
    }

    const numOnly = rw.name.replace(/\D/g, "");
    const selectedKelObj = kelurahanList.find((k) => k.id === kelurahanId);
    const parentKecId = selectedKelObj?.kecamatanId || kecamatanList[0]?.id || 1;
    const parentKecObj = kecamatanList.find((kc) => kc.id === parentKecId);
    const parentKabId = parentKecObj?.kabupatenId || kabupatenList[0]?.id || 1;
    const parentKabObj = kabupatenList.find((kb) => kb.id === parentKabId);
    const parentProvId = parentKabObj?.provinsiId || provinsiList[0]?.id || 1;

    setFormData({
      provinsiId: parentProvId,
      kabupatenId: parentKabId,
      kecamatanId: parentKecId,
      kelurahanId,
      rwNumber: numOnly,
    });
    setIsModalOpen(true);
  };


  const handleOpenDeleteModal = (group: GroupedRw, initialRwId?: number) => {
    setSelectedGroupToDelete(group);
    if (initialRwId) {
      setSelectedRwIdsToDelete([initialRwId]);
    } else {
      setSelectedRwIdsToDelete(group.rws.map((r) => r.id));
    }
    setIsDeleteModalOpen(true);
  };

  const handleToggleRwSelect = (rwId: number) => {
    setSelectedRwIdsToDelete((prev) =>
      prev.includes(rwId) ? prev.filter((id) => id !== rwId) : [...prev, rwId]
    );
  };

  const handleToggleSelectAllRw = () => {
    if (!selectedGroupToDelete) return;
    if (selectedRwIdsToDelete.length === selectedGroupToDelete.rws.length) {
      setSelectedRwIdsToDelete([]);
    } else {
      setSelectedRwIdsToDelete(selectedGroupToDelete.rws.map((r) => r.id));
    }
  };

  // Submit Add / Edit Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.rwNumber || !String(formData.rwNumber).trim()) {
      toast.error("Nomor Rukun Warga tidak boleh kosong!");
      return;
    }

    const numVal = parseInt(String(formData.rwNumber).replace(/\D/g, "") || "0", 10);
    if (isNaN(numVal) || numVal <= 0) {
      toast.error("Nomor Rukun Warga harus berupa angka positif!");
      return;
    }

    if (!formData.kelurahanId) {
      toast.error("Pilih Kelurahan terlebih dahulu!");
      return;
    }

    const formattedName = `RW ${String(numVal).padStart(2, "0")}`;

    // Unique Validation Check within selected Kelurahan
    const isDuplicate = rawRwList.some(
      (item) =>
        String(item.kelurahanId) === String(formData.kelurahanId) &&
        (item.name.toLowerCase() === formattedName.toLowerCase() ||
          parseInt(item.name.replace(/\D/g, "") || "0", 10) === numVal) &&
        (modalType === "add" || (selectedRwToEdit && item.id !== selectedRwToEdit.id))
    );

    if (isDuplicate) {
      const selectedKelObj = kelurahanList.find((k) => k.id === formData.kelurahanId);
      const kelName = selectedKelObj?.nama || "Kelurahan ini";
      toast.error(`Rukun Warga "${formattedName}" sudah terdaftar di Kel. ${kelName}! Nomor RW harus unik.`);
      return;
    }

    setIsSubmitting(true);
    try {
      if (modalType === "add") {
        await api.post("/areas/rw", {
          name: formattedName,
          kelurahanId: formData.kelurahanId,
        });
        toast.success(`Rukun Warga "${formattedName}" berhasil ditambahkan!`);
      } else if (selectedRwToEdit) {
        await api.put(`/areas/rw/${selectedRwToEdit.id}`, {
          name: formattedName,
          kelurahanId: formData.kelurahanId,
        });
        toast.success(`Rukun Warga "${formattedName}" berhasil diperbarui!`);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menyimpan data Rukun Warga");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Delete Batch RW
  const confirmDeleteBatch = async () => {
    if (!selectedGroupToDelete || selectedRwIdsToDelete.length === 0) {
      toast.error("Pilih minimal satu RW yang ingin dihapus!");
      return;
    }
    setIsSubmitting(true);
    try {
      await Promise.all(
        selectedRwIdsToDelete.map((id) => api.delete(`/areas/rw/${id}`))
      );
      toast.success(`${selectedRwIdsToDelete.length} Rukun Warga berhasil dihapus!`);
      setIsDeleteModalOpen(false);
      setSelectedGroupToDelete(null);
      setSelectedRwIdsToDelete([]);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menghapus Rukun Warga terpilih");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      {/* 1. Header Navigation & Title */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#009966]/10 border border-[#009966]/20 text-[#009966] flex items-center justify-center shrink-0 shadow-2xs">
            <Tag size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
              Rukun Warga
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Kelola data Rukun Warga terintegrasi secara real-time dengan backend.
            </p>
          </div>
        </div>

        {!isReadOnly && (
          <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
            <button
              type="button"
              onClick={() => handleOpenAddModal()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#009966] hover:bg-[#008855] active:scale-95 text-white font-extrabold text-xs rounded-full shadow-xs transition-all cursor-pointer shrink-0"
            >
              <Plus size={16} />
              <span>Tambah Rukun Warga</span>
            </button>
          </div>
        )}
      </div>



      {/* 3. Search Bar Container */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
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
          Menampilkan <span className="text-slate-800 dark:text-slate-100">{filteredGroups.length}</span> Kelurahan
        </div>
      </div>

      {/* 4. Main Data Table: NO, PROVINSI, KOTA, KABUPATEN, KECAMATAN, KELURAHAN, RUKUN WARGA, AKSI */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/80 text-[10.5px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-3.5 px-4 text-center w-16 whitespace-nowrap">NO</th>
                <th className="py-3.5 px-4 whitespace-nowrap">KELURAHAN</th>
                <th className="py-3.5 px-4 whitespace-nowrap">DAFTAR RUKUN WARGA</th>
                {!isReadOnly && <th className="py-3.5 px-4 text-center w-32 whitespace-nowrap">AKSI</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#009966]/10 text-[#009966] flex items-center justify-center border border-[#009966]/20">
                        <Loader2 className="animate-spin text-[#009966]" size={22} />
                      </div>
                      <p className="text-xs font-black text-slate-800 dark:text-slate-100">Memuat Data Rukun Warga Real-Time...</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-rose-600 font-bold text-xs">
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
                      key={group.kelurahanId}
                      className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/80 dark:bg-slate-800/80 dark:hover:bg-slate-800/80 transition-colors text-xs text-slate-700 dark:text-slate-300 font-medium"
                    >
                      {/* NO */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-500 whitespace-nowrap">
                        {itemNumber}
                      </td>

                      {/* KELURAHAN & WILAYAH INDUK */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-[#009966] border border-emerald-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                            <Home size={18} />
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs block">
                              {group.kelurahanNama.startsWith("Kel.") ? group.kelurahanNama : `Kel. ${group.kelurahanNama}`}
                            </span>
                            <span className="text-[10.5px] font-semibold text-slate-400 dark:text-slate-500 block mt-0.5">
                              {group.provinsiNama} • {group.kabupatenNama} • {group.kecamatanNama}
                            </span>
                          </div>
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
                                onClick={() => handleOpenEditModal(rw, group.kelurahanId)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-200/80 text-[11px] font-mono font-black shadow-2xs hover:bg-blue-100 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                                title="Klik untuk edit Rukun Warga ini"
                              >
                                <Tag size={11} className="text-blue-600" />
                                <span>{rw.name}</span>
                              </div>
                            ))
                          )}

                          {!isReadOnly && (
                            <button
                              onClick={() => handleOpenAddModal(group.kelurahanId)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-[#009966] text-slate-600 dark:text-slate-400 hover:text-white border border-slate-200 dark:border-slate-800 hover:border-[#009966] text-[11px] font-bold transition-all cursor-pointer active:scale-95"
                              title="Tambah Rukun Warga baru di kelurahan ini"
                            >
                              <Plus size={12} />
                              <span>Tambah Rukun Warga</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* AKSI */}
                      {!isReadOnly && (
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenAddModal(group.kelurahanId)}
                              className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/60 border border-emerald-200/80 dark:border-emerald-900/40 transition-all flex items-center justify-center cursor-pointer active:scale-95 shadow-2xs"
                              title="Tambah Rukun Warga Baru"
                            >
                              <Plus size={14} />
                            </button>
                            {group.rws.length > 0 && (
                              <button
                                type="button"
                                onClick={() => handleOpenDeleteModal(group)}
                                className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100/80 dark:hover:bg-rose-900/60 border border-rose-200/80 dark:border-rose-900/40 transition-all flex items-center justify-center cursor-pointer active:scale-95 shadow-2xs"
                                title="Pilih & Hapus Rukun Warga"
                              >
                                <Trash2 size={14} />
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
                  colSpan={4}
                  entityName="Rukun Warga"
                  isSearch={!!searchTerm}
                  searchQuery={searchTerm}
                  onResetSearch={() => setSearchTerm("")}
                />
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Pagination Footer */}
        {filteredGroups.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredGroups.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            itemsPerPageOptions={[10, 25, 50]}
          />
        )}
      </div>

      {/* MODAL TAMBAH / EDIT RW */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 max-w-lg w-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-[#009966] flex items-center justify-center font-bold">
                  {modalType === "add" ? <Plus size={18} /> : <Pencil size={18} />}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
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
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              {/* Provinsi */}
              <div>
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1">
                  Provinsi <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.provinsiId}
                  onChange={(e) => {
                    const provId = Number(e.target.value);
                    const kabs = kabupatenList.filter((k) => k.provinsiId === provId);
                    const kabId = kabs[0]?.id || kabupatenList[0]?.id || 1;
                    const kecs = kecamatanList.filter((kc) => kc.kabupatenId === kabId);
                    const kecId = kecs[0]?.id || kecamatanList[0]?.id || 1;
                    const kels = kelurahanList.filter((kl) => Number(kl.kecamatanId) === kecId);
                    const kelId = kels[0]?.id || kelurahanList[0]?.id || "";

                    setFormData({
                      ...formData,
                      provinsiId: provId,
                      kabupatenId: kabId,
                      kecamatanId: kecId,
                      kelurahanId: kelId,
                    });
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#009966] focus:bg-white transition-all cursor-pointer"
                >
                  {provinsiList.map((p) => (
                    <option key={p.id} value={p.id}>{p.nama}</option>
                  ))}
                </select>
              </div>

              {/* Kota / Kabupaten */}
              <div>
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1">
                  Kota / Kabupaten <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.kabupatenId}
                  onChange={(e) => {
                    const kabId = Number(e.target.value);
                    const kecs = kecamatanList.filter((kc) => kc.kabupatenId === kabId);
                    const kecId = kecs[0]?.id || kecamatanList[0]?.id || 1;
                    const kels = kelurahanList.filter((kl) => Number(kl.kecamatanId) === kecId);
                    const kelId = kels[0]?.id || kelurahanList[0]?.id || "";

                    setFormData({
                      ...formData,
                      kabupatenId: kabId,
                      kecamatanId: kecId,
                      kelurahanId: kelId,
                    });
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#009966] focus:bg-white transition-all cursor-pointer"
                >
                  {modalFilteredKabupaten.map((k) => (
                    <option key={k.id} value={k.id}>{k.nama}</option>
                  ))}
                </select>
              </div>

              {/* Kecamatan */}
              <div>
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1">
                  Kecamatan <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.kecamatanId}
                  onChange={(e) => {
                    const kecId = Number(e.target.value);
                    const kels = kelurahanList.filter((kl) => Number(kl.kecamatanId) === kecId);
                    const kelId = kels[0]?.id || kelurahanList[0]?.id || "";

                    setFormData({
                      ...formData,
                      kecamatanId: kecId,
                      kelurahanId: kelId,
                    });
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#009966] focus:bg-white transition-all cursor-pointer"
                >
                  {modalFilteredKecamatan.map((kc) => (
                    <option key={kc.id} value={kc.id}>{kc.nama}</option>
                  ))}
                </select>
              </div>

              {/* Kelurahan */}
              <div>
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1">
                  Kelurahan <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.kelurahanId}
                  onChange={(e) => setFormData({ ...formData, kelurahanId: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#009966] focus:bg-white transition-all cursor-pointer"
                >
                  {modalFilteredKelurahan.length === 0 ? (
                    <option value="">Tidak ada kelurahan di kecamatan ini</option>
                  ) : (
                    modalFilteredKelurahan.map((kl) => (
                      <option key={kl.id} value={kl.id}>Kel. {kl.nama}</option>
                    ))
                  )}
                </select>
              </div>

              {/* Nomor RW */}
              <div>
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1">
                  Nomor Rukun Warga <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="px-4 py-2.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 text-[#009966] font-black text-xs rounded-xl shrink-0 shadow-2xs">
                    RW
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    required
                    placeholder="Contoh: 01"
                    value={formData.rwNumber}
                    onChange={(e) => setFormData({ ...formData, rwNumber: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#009966] focus:bg-white transition-all"
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-semibold mt-1 block">
                  Cukup masukkan angka (misal: 1 atau 01). Sistem otomatis format "RW 01" & validasi keunikan.
                </span>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-extrabold text-xs hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all cursor-pointer"
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

      {/* MODAL HAPUS RW DENGAN CHECKBOX MULTI-SELEKSI */}
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
                    Hapus Data Rukun Warga
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-500">
                    Kel. {selectedGroupToDelete.kelurahanNama} ({selectedGroupToDelete.kecamatanNama})
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
                  Pilih Rukun Warga Yang Ingin Dihapus:
                </span>
                <button
                  type="button"
                  onClick={handleToggleSelectAllRw}
                  className="text-[11px] font-black text-[#009966] hover:underline cursor-pointer"
                >
                  {selectedRwIdsToDelete.length === selectedGroupToDelete.rws.length
                    ? "Batal Pilih Semua"
                    : "Pilih Semua"}
                </button>
              </div>

              {/* List RW items with Checkboxes */}
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                {selectedGroupToDelete.rws.map((rw) => {
                  const isChecked = selectedRwIdsToDelete.includes(rw.id);
                  return (
                    <div
                      key={rw.id}
                      onClick={() => handleToggleRwSelect(rw.id)}
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
                          onChange={() => {}} // handled by parent div click
                          className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
                        />
                        <span className="text-xs font-mono">{rw.name}</span>
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
                  Menandai <strong className="text-rose-600 font-black">{selectedRwIdsToDelete.length}</strong> dari{" "}
                  <strong className="text-slate-800 dark:text-slate-100 font-black">{selectedGroupToDelete.rws.length}</strong> RW untuk dihapus.
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
                disabled={isSubmitting || selectedRwIdsToDelete.length === 0}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-600/20 active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Trash2 size={15} />
                <span>
                  {isSubmitting
                    ? "Menghapus..."
                    : `Hapus ${selectedRwIdsToDelete.length} Rukun Warga Terpilih`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterRw;
