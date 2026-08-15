/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Component: Pengelolaan Sampah & Daur Ulang Hilir
 * - 100% End-to-End API Integration dengan Backend PostgreSQL (`/api/v1/pemanfaatan`)
 * - Mobile Ready REST API Response Compatible
 * - Design Standar Industri: Executive Hero Banner, KPI Summary Cards, Multi-Filter, Responsive Table, Lightbox Preview, & TrashCare Standardized Pagination.
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  Loader2,
  Pencil,
  Trash2,
  Search,
  X,
  Sparkles,
  Leaf,
  RotateCcw,
  PlusCircle,
  Recycle,
  Layers,
  Sprout,
  ArrowRightLeft,
  MapPin,
  RefreshCw,
  Bug,
  FlaskConical,
} from "lucide-react";
import api from "../../services/api";
import showToast from "../../utils/showToast";
import { useAuthStore } from "../../store/useAuthStore";
import { Pagination } from "../../components/common/Pagination";
import { ConfirmModal } from "../../components/common/ConfirmModal";
import PageHeader from "../../components/common/PageHeader";

interface PemanfaatanItem {
  id: string;
  rwId: number;
  rw?: {
    name: string;
    kelurahan?: {
      name: string;
    };
  };
  nomorCaraPemanfaatan: string;
  program: string;
  teknologi: string;
  bahanBaku: string;
  volumeBahanBaku: number;
  unitBahanBaku: string;
  hasil: number;
  unitHasil: string;
  fotoDokumentasiUrl: string;
  tanggalPencatatan: string;
}

export const PemanfaatanSampah: React.FC = () => {
  const { user } = useAuthStore();
  const [items, setItems] = useState<PemanfaatanItem[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProgramFilter, setSelectedProgramFilter] = useState("ALL");
  const [selectedBahanFilter, setSelectedBahanFilter] = useState("ALL");
  const [selectedRwFilter, setSelectedRwFilter] = useState("ALL");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal & Photo Preview States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PemanfaatanItem | null>(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  // Form states
  const [rwId, setRwId] = useState("");
  const [nomorCaraPemanfaatan, setNomorCaraPemanfaatan] = useState("");
  const [program, setProgram] = useState("BURUAN_SAE");
  const [teknologi, setTeknologi] = useState("");
  const [bahanBaku, setBahanBaku] = useState("Organik");
  const [volumeBahanBaku, setVolumeBahanBaku] = useState("");
  const [unitBahanBaku, setUnitBahanBaku] = useState("Kg");
  const [hasil, setHasil] = useState("");
  const [unitHasil, setUnitHasil] = useState("Kg");
  const [fotoDokumentasiUrl, setFotoDokumentasiUrl] = useState("");
  const [tanggalPencatatan, setTanggalPencatatan] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteProgramId, setDeleteProgramId] = useState<string | null>(null);
  const [isDeletingProgram, setIsDeletingProgram] = useState(false);

  const isDpl = ["DPL", "DOSEN_PEMBIMBING"].includes(user?.peran || "");
  const dplKelurahan = user?.kelurahan || "";
  const isReadOnly = ["ADMIN_DLH", "CAMAT", "LURAH", "PEMIMPIN", "PANITIA_TASKFORCE", "DPL", "DOSEN_PEMBIMBING"].includes(user?.peran || "");
  const isMahasiswaMember = user?.peran === "MAHASISWA_KKN";
  const isKetuaKelompok = (user as any)?.isKetuaKelompok === true || (user as any)?.wargaSubtype === "KETUA_KELOMPOK";
  const canSubmitRecap = !isReadOnly && (!isMahasiswaMember || isKetuaKelompok);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await api.get("/pemanfaatan");
      if (res.data && res.data.success) {
        setItems(res.data.data);
      }
    } catch (e: any) {
      showToast.error("Gagal memuat data pengelolaan sampah");
    } finally {
      setLoading(false);
    }
  };

  const fetchAreas = async () => {
    try {
      const res = await api.get("/areas/rt-rw");
      if (res.data && res.data.success) {
        setAreas(res.data.data);
      }
    } catch (e) {
      console.error("Gagal memuat list area RW");
    }
  };

  useEffect(() => {
    fetchItems();
    fetchAreas();
  }, []);

  // Filtered Items Logic
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const rwName = item.rw?.name || `RW ${item.rwId}`;
      const kelName = item.rw?.kelurahan?.name || "";

      const matchesSearch =
        !q ||
        item.program.toLowerCase().includes(q) ||
        (item.teknologi && item.teknologi.toLowerCase().includes(q)) ||
        (item.bahanBaku && item.bahanBaku.toLowerCase().includes(q)) ||
        rwName.toLowerCase().includes(q) ||
        kelName.toLowerCase().includes(q) ||
        item.nomorCaraPemanfaatan.toLowerCase().includes(q);

      const matchesProgram =
        selectedProgramFilter === "ALL"
          ? true
          : item.program.toUpperCase().includes(selectedProgramFilter);

      const matchesBahan =
        selectedBahanFilter === "ALL"
          ? true
          : (item.bahanBaku || "").toUpperCase().includes(selectedBahanFilter);

      const matchesRw =
        selectedRwFilter === "ALL" ? true : item.rwId.toString() === selectedRwFilter;

      const matchesDplKelurahan =
        !isDpl || !dplKelurahan || kelName.toLowerCase().includes(dplKelurahan.toLowerCase());

      return matchesSearch && matchesProgram && matchesBahan && matchesRw && matchesDplKelurahan;
    });
  }, [items, searchQuery, selectedProgramFilter, selectedBahanFilter, selectedRwFilter, isDpl, dplKelurahan]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedProgramFilter, selectedBahanFilter, selectedRwFilter, itemsPerPage]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
  }, [filteredItems.length, itemsPerPage]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  // Aggregate KPI Calculations
  const totalVolumeBahan = useMemo(() => {
    return filteredItems.reduce((sum, item) => sum + (Number(item.volumeBahanBaku) || 0), 0);
  }, [filteredItems]);

  const totalHasilPemanfaatan = useMemo(() => {
    return filteredItems.reduce((sum, item) => sum + (Number(item.hasil) || 0), 0);
  }, [filteredItems]);

  const conversionRatio = useMemo(() => {
    if (totalVolumeBahan === 0) return "0.0";
    return Math.min(100, Math.round((totalHasilPemanfaatan / totalVolumeBahan) * 100)).toFixed(1);
  }, [totalVolumeBahan, totalHasilPemanfaatan]);

  const activeRwCount = useMemo(() => {
    return new Set(filteredItems.map((item) => item.rwId)).size;
  }, [filteredItems]);

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedProgramFilter("ALL");
    setSelectedBahanFilter("ALL");
    setSelectedRwFilter("ALL");
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadingPhoto(true);
      try {
        const formData = new FormData();
        formData.append("image", file);

        const res = await api.post("/ai/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        if (res.data && res.data.success) {
          const imageUrl = res.data.data.imageUrl;
          const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";
          const serverUrl = apiBaseUrl.replace("/api/v1", "");
          const fullImageUrl = `${serverUrl}${imageUrl}`;
          setFotoDokumentasiUrl(fullImageUrl);
          showToast.success("Foto berhasil diunggah");
        }
      } catch (err) {
        showToast.error("Gagal mengunggah foto");
      } finally {
        setUploadingPhoto(false);
      }
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setRwId(user?.rtRwId ? user.rtRwId.toString() : "");
    setNomorCaraPemanfaatan(`PMF-${Date.now()}`);
    setProgram("BURUAN_SAE");
    setTeknologi("");
    setBahanBaku("Organik");
    setVolumeBahanBaku("");
    setUnitBahanBaku("Kg");
    setHasil("");
    setUnitHasil("Kg");
    setFotoDokumentasiUrl("");
    setTanggalPencatatan(new Date().toISOString().split("T")[0]);
    setIsModalOpen(true);
  };

  const openEditModal = (item: PemanfaatanItem) => {
    setEditingItem(item);
    setRwId(item.rwId.toString());
    setNomorCaraPemanfaatan(item.nomorCaraPemanfaatan);
    setProgram(item.program);
    setTeknologi(item.teknologi);
    setBahanBaku(item.bahanBaku || "Organik");
    setVolumeBahanBaku(item.volumeBahanBaku.toString());
    setUnitBahanBaku(item.unitBahanBaku || "Kg");
    setHasil(item.hasil.toString());
    setUnitHasil(item.unitHasil || "Kg");
    setFotoDokumentasiUrl(item.fotoDokumentasiUrl);
    setTanggalPencatatan(item.tanggalPencatatan ? item.tanggalPencatatan.split("T")[0] : "");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      showToast.error("Akses Ditolak: Peran Anda hanya memiliki akses Read-Only");
      return;
    }

    if (!rwId) {
      showToast.error("Silakan pilih Wilayah RW");
      return;
    }

    const payload = {
      rwId: parseInt(rwId, 10),
      nomorCaraPemanfaatan,
      program,
      teknologi,
      bahanBaku,
      volumeBahanBaku: parseFloat(volumeBahanBaku) || 0,
      unitBahanBaku,
      hasil: parseFloat(hasil) || 0,
      unitHasil,
      fotoDokumentasiUrl,
      tanggalPencatatan: new Date(tanggalPencatatan).toISOString(),
    };

    try {
      setSubmitting(true);
      if (editingItem) {
        await api.put(`/pemanfaatan/${editingItem.id}`, payload);
        showToast.success("Program pengelolaan sampah berhasil diperbarui");
      } else {
        await api.post("/pemanfaatan", payload);
        showToast.success("Program pengelolaan sampah berhasil dicatat");
      }
      setIsModalOpen(false);
      fetchItems();
    } catch (err: any) {
      showToast.error(err.response?.data?.message || "Gagal menyimpan data");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    if (isReadOnly) {
      showToast.error("Akses Ditolak: Peran Anda hanya memiliki akses Read-Only");
      return;
    }
    setDeleteProgramId(id);
  };

  const handleConfirmDeleteProgram = async () => {
    if (!deleteProgramId) return;
    try {
      setIsDeletingProgram(true);
      await api.delete(`/pemanfaatan/${deleteProgramId}`);
      showToast.success("Program pengelolaan sampah berhasil dihapus");
      setDeleteProgramId(null);
      fetchItems();
    } catch (err: any) {
      showToast.error(err.response?.data?.message || "Gagal menghapus data");
    } finally {
      setIsDeletingProgram(false);
    }
  };

  const getProgramBadge = (programStr: string) => {
    const pUpper = programStr.toUpperCase();
    if (pUpper.includes("BANK")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
          <Recycle size={13} className="text-[#009966]" /> Bank Sampah
        </span>
      );
    }
    if (pUpper.includes("MAGGOT")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
          <Bug size={13} className="text-amber-600" /> Rumah Maggot BSF
        </span>
      );
    }
    if (pUpper.includes("POC")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-purple-50 text-purple-800 border border-purple-200 shadow-2xs">
          <FlaskConical size={13} className="text-purple-600" /> Pupuk Organik Cair (POC)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-teal-50 text-teal-800 border border-teal-200 shadow-2xs">
        <Sprout size={13} className="text-teal-600" /> Buruan Sae
      </span>
    );
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 text-slate-800 font-sans">
      {/* Clean Enterprise Page Header */}
      <PageHeader
        icon={Sparkles}
        category="Tata Kelola Daur Ulang Hilir"
        scope="Kecamatan Coblong"
        title="Pengelolaan Sampah"
        description="Pencatatan operasional, sirkulasi bahan baku, dan monitoring konversi hasil panen daur ulang lingkungan (Buruan Sae, Maggot BSF, POC, Bank Sampah)."
        actions={
          canSubmitRecap ? (
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <PlusCircle size={15} /> <span>Catat Program Baru</span>
            </button>
          ) : isMahasiswaMember ? (
            <div className="bg-amber-50 border border-amber-200 px-3.5 py-1.5 rounded-xl text-xs font-bold text-amber-800">
              Hanya Ketua Kelompok KKN yang memproses pencatatan rekap
            </div>
          ) : null
        }
      />

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white p-4.5 rounded-3xl border border-slate-200/90 shadow-2xs flex items-center gap-3.5">
          <div className="p-3 bg-slate-100 text-slate-700 rounded-2xl shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10.5px] text-slate-400 font-black uppercase tracking-wider">Volume Bahan Baku</p>
            <p className="text-lg font-black text-slate-900 mt-0.5">
              {totalVolumeBahan >= 1000 ? (totalVolumeBahan / 1000).toFixed(1) : totalVolumeBahan.toLocaleString("id-ID", { maximumFractionDigits: 1 })}{" "}
              <span className="text-xs font-bold text-slate-500">{totalVolumeBahan >= 1000 ? "Ton" : "Kg"}</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-3xl border border-slate-200/90 shadow-2xs flex items-center gap-3.5">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0 border border-emerald-100">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10.5px] text-slate-400 font-black uppercase tracking-wider">Hasil Daur Ulang</p>
            <p className="text-lg font-black text-emerald-700 mt-0.5">
              {totalHasilPemanfaatan >= 1000 ? (totalHasilPemanfaatan / 1000).toFixed(1) : totalHasilPemanfaatan.toLocaleString("id-ID", { maximumFractionDigits: 1 })}{" "}
              <span className="text-xs font-bold text-slate-500">{totalHasilPemanfaatan >= 1000 ? "Ton" : "Kg"}</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-3xl border border-slate-200/90 shadow-2xs flex items-center gap-3.5">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shrink-0 border border-blue-100">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10.5px] text-slate-400 font-black uppercase tracking-wider">Efisiensi Sirkular</p>
            <p className="text-lg font-black text-blue-700 mt-0.5">{conversionRatio}%</p>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-3xl border border-slate-200/90 shadow-2xs flex items-center gap-3.5">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl shrink-0 border border-purple-100">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10.5px] text-slate-400 font-black uppercase tracking-wider">RW Berpartisipasi</p>
            <p className="text-lg font-black text-purple-700 mt-0.5">{activeRwCount} Wilayah</p>
          </div>
        </div>
      </div>

      {/* Interactive Control & Multi-Filter Bar */}
      <div className="bg-white p-4.5 sm:p-5 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5">
        {/* Search Bar Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Cari nama program, teknologi, bahan baku, RW..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#009966] focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Multi-Filters Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Program Filter */}
          <select
            value={selectedProgramFilter}
            onChange={(e) => setSelectedProgramFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:border-[#009966] transition-all cursor-pointer"
          >
            <option value="ALL">Semua Kategori Program</option>
            <option value="BANK_SAMPAH">Bank Sampah</option>
            <option value="KOMPOS">Kompos</option>
            <option value="BURUAN_SAE">Buruan Sae</option>
            <option value="RUMAH_MAGGOT">Rumah Maggot BSF</option>
            <option value="POC">Pupuk Organik Cair (POC)</option>
          </select>

          {/* Bahan Baku Filter */}
          <select
            value={selectedBahanFilter}
            onChange={(e) => setSelectedBahanFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:border-[#009966] transition-all cursor-pointer"
          >
            <option value="ALL">Semua Jenis Bahan</option>
            <option value="ORGANIK">Organik</option>
            <option value="ANORGANIK">Anorganik</option>
          </select>

          {/* RW Filter */}
          <select
            value={selectedRwFilter}
            onChange={(e) => setSelectedRwFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:border-[#009966] transition-all cursor-pointer max-w-[180px]"
          >
            <option value="ALL">Semua Wilayah RW</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id.toString()}>
                {a.name} (Kel. {a.kelurahan?.name || "Coblong"})
              </option>
            ))}
          </select>

          <button
            onClick={fetchItems}
            title="Refresh Data"
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition-all cursor-pointer shrink-0"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>

          {/* Reset Filters */}
          {(searchQuery || selectedProgramFilter !== "ALL" || selectedBahanFilter !== "ALL" || selectedRwFilter !== "ALL") && (
            <button
              onClick={resetFilters}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw size={13} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
              Tabel Program Pengelolaan Sampah
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Menampilkan {filteredItems.length} dari total {items.length} entri terdaftar di database.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
            <Loader2 className="animate-spin text-[#009966]" size={28} />
            <p className="text-xs font-bold">Memuat data pengelolaan sampah...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16 text-slate-400 border border-dashed border-slate-200 rounded-3xl space-y-3">
            <Leaf size={36} className="mx-auto text-slate-300" />
            <p className="text-xs font-bold text-slate-600">
              {items.length === 0
                ? "Belum ada program pengelolaan sampah yang terdaftar."
                : "Tidak ada data yang cocok dengan pencarian / kriteria filter."}
            </p>
            {items.length > 0 && (
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-200 hover:bg-emerald-100 transition inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw size={13} /> Reset Filter
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="text-[10.5px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-200 bg-slate-50/80">
                  <th className="py-3.5 px-4 rounded-l-2xl">Program Daur Ulang</th>
                  <th className="py-3.5 px-4">Teknologi / Metode</th>
                  <th className="py-3.5 px-4">Bahan Baku</th>
                  <th className="py-3.5 px-4 text-right">Volume Input (Kg)</th>
                  <th className="py-3.5 px-4 text-right">Hasil Output (Kg)</th>
                  <th className="py-3.5 px-4">Wilayah RW</th>
                  <th className="py-3.5 px-4">Tanggal Pencatatan</th>
                  <th className="py-3.5 px-4 text-center">Dokumentasi</th>
                  {!isReadOnly && <th className="py-3.5 px-4 text-right rounded-r-2xl">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {paginatedItems.map((item) => {
                  const rawTekno = item.teknologi || "Pengolahan Mandiri";
                  const teknoFormatted = rawTekno.replace(/permentasi/gi, "Fermentasi");

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-all group">
                      {/* Program */}
                      <td className="py-3.5 px-4 align-middle">
                        {getProgramBadge(item.program)}
                      </td>

                      {/* Teknologi */}
                      <td className="py-3.5 px-4 align-middle font-extrabold text-slate-800">
                        {teknoFormatted}
                      </td>

                      {/* Bahan Baku */}
                      <td className="py-3.5 px-4 align-middle font-bold text-slate-600">
                        {item.bahanBaku || "Organik"}
                      </td>

                      {/* Volume Input */}
                      <td className="py-3.5 px-4 text-right align-middle font-mono font-black text-slate-900 text-sm">
                        {item.volumeBahanBaku}
                      </td>

                      {/* Hasil Output */}
                      <td className="py-3.5 px-4 text-right align-middle font-mono font-black text-[#009966] text-sm">
                        {item.hasil}
                      </td>

                      {/* Wilayah RW */}
                      <td className="py-3.5 px-4 text-slate-700 font-bold align-middle">
                        {item.rw?.name || `RW ${item.rwId}`}
                        {item.rw?.kelurahan?.name && (
                          <span className="block text-[10px] text-slate-400 font-semibold">
                            Kel. {item.rw.kelurahan.name}
                          </span>
                        )}
                      </td>

                      {/* Tanggal */}
                      <td className="py-3.5 px-4 font-bold text-slate-700 whitespace-nowrap align-middle">
                        {new Date(item.tanggalPencatatan).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </td>

                      {/* Bukti Foto */}
                      <td className="py-3.5 px-4 text-center align-middle">
                        {item.fotoDokumentasiUrl && item.fotoDokumentasiUrl.trim() !== "" ? (
                          <button
                            onClick={() => setPreviewPhotoUrl(item.fotoDokumentasiUrl)}
                            className="inline-block hover:scale-105 transition-transform cursor-pointer group/img"
                            title="Lihat Foto Dokumentasi"
                          >
                            <img
                              src={item.fotoDokumentasiUrl}
                              alt="Dokumentasi"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = null;
                                target.src = "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=300&auto=format&fit=crop&q=80";
                              }}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-2xs mx-auto group-hover/img:border-emerald-500"
                            />
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/80">
                            Tanpa Foto
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      {!isReadOnly && (
                        <td className="py-3.5 px-4 text-right align-middle whitespace-nowrap">
                          <div className="flex justify-end items-center gap-1">
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                              title="Edit Program"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                              title="Hapus Program"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Standardized TrashCare Pagination */}
        {filteredItems.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredItems.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            itemsPerPageOptions={[10, 25, 50, 100]}
          />
        )}
      </div>

      {/* Photo Lightbox Modal */}
      {previewPhotoUrl && (
        <div
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-[120] flex items-center justify-center p-4"
          onClick={() => setPreviewPhotoUrl(null)}
        >
          <div className="relative max-w-3xl w-full bg-slate-900 rounded-3xl p-2 shadow-2xl border border-slate-700 overflow-hidden">
            <button
              onClick={() => setPreviewPhotoUrl(null)}
              className="absolute top-4 right-4 bg-slate-900/80 text-white p-2 rounded-full hover:bg-slate-900 cursor-pointer z-10"
            >
              <X size={18} />
            </button>
            <img
              src={previewPhotoUrl}
              alt="Bukti Dokumentasi"
              className="w-full h-auto max-h-[80vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}

      {/* Form Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col p-6 space-y-4 border border-slate-200 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#009966] flex items-center justify-center font-bold">
                  <Sprout size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {editingItem ? "Edit Program Pengelolaan Sampah" : "Catat Program Pengelolaan Sampah Baru"}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Lengkapi parameter sirkulasi bahan baku &amp; hasil olahan</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    Program Daur Ulang <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={program}
                    onChange={(e) => setProgram(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold bg-slate-50 outline-none focus:border-[#009966] transition cursor-pointer"
                  >
                    <option value="BURUAN_SAE">Buruan Sae</option>
                    <option value="RUMAH_MAGGOT">Rumah Maggot BSF</option>
                    <option value="POC">Pupuk Organik Cair (POC)</option>
                    <option value="BANK_SAMPAH">Bank Sampah</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    Wilayah RW Penugasan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={rwId}
                    onChange={(e) => setRwId(e.target.value)}
                    disabled={!!user?.rtRwId}
                    className="w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold bg-slate-50 outline-none focus:border-[#009966] transition disabled:opacity-60 cursor-pointer"
                    required
                  >
                    <option value="">Pilih RW</option>
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} (Kel. {a.kelurahan?.name || "Coblong"})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    Teknologi / Metode <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Kompos Takakura, Fermentasi BSF"
                    value={teknologi}
                    onChange={(e) => setTeknologi(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-[#009966] transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    Bahan Baku <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Organik Dapur, Daun Kering"
                    value={bahanBaku}
                    onChange={(e) => setBahanBaku(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-[#009966] transition"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    Volume Input (Kg) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    value={volumeBahanBaku}
                    onChange={(e) => setVolumeBahanBaku(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-xs font-mono font-black text-slate-800 outline-none focus:border-[#009966] transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    Hasil Output (Kg) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    value={hasil}
                    onChange={(e) => setHasil(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-xs font-mono font-black text-slate-800 outline-none focus:border-[#009966] transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  Tanggal Pencatatan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={tanggalPencatatan}
                  onChange={(e) => setTanggalPencatatan(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-[#009966] transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  Foto Dokumentasi Hilir
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition cursor-pointer"
                />
                {uploadingPhoto && <p className="text-[11px] text-emerald-600 font-semibold mt-1">Mengunggah foto...</p>}
                {fotoDokumentasiUrl && (
                  <img
                    src={fotoDokumentasiUrl}
                    alt="Preview"
                    className="mt-2 h-16 w-16 object-cover rounded-xl border border-slate-200"
                  />
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-[#009966] hover:bg-[#008855] text-white text-xs font-black rounded-xl transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {submitting ? "Simpan..." : editingItem ? "Simpan Perubahan" : "Simpan Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal Hapus Program Pengelolaan Sampah */}
      <ConfirmModal
        isOpen={Boolean(deleteProgramId)}
        onClose={() => setDeleteProgramId(null)}
        onConfirm={handleConfirmDeleteProgram}
        isLoading={isDeletingProgram}
        title="Hapus Program Pengelolaan Sampah"
        message="Apakah Anda yakin ingin menghapus data program daur ulang & pemanfaatan sampah ini? Data historis terkait akan dihapus."
        confirmText="Ya, Hapus Program"
        type="danger"
      />
    </div>
  );
};

export default PemanfaatanSampah;
