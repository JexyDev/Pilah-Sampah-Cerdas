/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */

import React, { useState, useEffect, useMemo } from "react";
import api from "../../utils/api";
import { useAuthStore } from "../../store/useAuthStore";
import toast from "react-hot-toast";
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
} from "lucide-react";

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

  const isReadOnly = user?.peran === "ADMIN_DLH" || user?.peran === "CAMAT" || user?.peran === "LURAH";
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
      toast.error("Gagal memuat data pemanfaatan");
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

      return matchesSearch && matchesProgram && matchesBahan && matchesRw;
    });
  }, [items, searchQuery, selectedProgramFilter, selectedBahanFilter, selectedRwFilter]);

  // Aggregate KPI Calculations
  const totalVolumeBahan = useMemo(() => {
    return filteredItems.reduce((sum, item) => sum + (Number(item.volumeBahanBaku) || 0), 0);
  }, [filteredItems]);

  const totalHasilPemanfaatan = useMemo(() => {
    return filteredItems.reduce((sum, item) => sum + (Number(item.hasil) || 0), 0);
  }, [filteredItems]);

  const conversionRatio = useMemo(() => {
    if (totalVolumeBahan === 0) return 0;
    return Math.min(100, Math.round((totalHasilPemanfaatan / totalVolumeBahan) * 100));
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
          const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://157.10.252.252:3000/api/v1";
          const serverUrl = apiBaseUrl.replace("/api/v1", "");
          const fullImageUrl = `${serverUrl}${imageUrl}`;
          setFotoDokumentasiUrl(fullImageUrl);
          toast.success("Foto berhasil diunggah");
        }
      } catch (err) {
        toast.error("Gagal mengunggah foto");
      } finally {
        setUploadingPhoto(false);
      }
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setRwId(user?.rtRwId ? user.rtRwId.toString() : "");
    setNomorCaraPemanfaatan(`CARA-${Date.now()}`);
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
      toast.error("Akses Ditolak: Peran Anda hanya memiliki akses Read-Only");
      return;
    }

    if (!rwId) {
      toast.error("Silakan pilih Wilayah RW");
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
      if (editingItem) {
        await api.put(`/pemanfaatan/${editingItem.id}`, payload);
        toast.success("Program pemanfaatan berhasil diperbarui");
      } else {
        await api.post("/pemanfaatan", payload);
        toast.success("Program pemanfaatan berhasil dicatat");
      }
      setIsModalOpen(false);
      fetchItems();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menyimpan data");
    }
  };

  const handleDelete = async (id: string) => {
    if (isReadOnly) {
      toast.error("Akses Ditolak: Peran Anda hanya memiliki akses Read-Only");
      return;
    }
    if (!window.confirm("Apakah Anda yakin ingin menghapus program pemanfaatan ini?")) return;

    try {
      await api.delete(`/pemanfaatan/${id}`);
      toast.success("Program pemanfaatan berhasil dihapus");
      fetchItems();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menghapus data");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-800">
      {/* Top Banner Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold w-fit mb-2 border border-emerald-500/30">
            <Sparkles size={14} /> Program Ekonomi Sirkular
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Pemanfaatan Sampah</h1>
          <p className="text-slate-400 text-xs md:text-sm mt-1">
            Pencatatan dan pemantauan program sirkular sampah (Buruan Sae, Rumah Maggot, POC, Bank Sampah).
          </p>
        </div>

        {canSubmitRecap ? (
          <button
            onClick={openAddModal}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <PlusCircle size={16} /> Catat Program Baru
          </button>
        ) : isMahasiswaMember ? (
          <div className="bg-amber-500/20 border border-amber-500/30 px-4 py-2 rounded-xl text-xs font-bold text-amber-300">
            Hanya Ketua Kelompok yang memproses submit rekapitulasi
          </div>
        ) : null}
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <p className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider">Total Volume Bahan Baku</p>
          <h3 className="text-xl font-extrabold text-slate-900 mt-2">
            {totalVolumeBahan.toLocaleString("id-ID", { maximumFractionDigits: 1 })}{" "}
            <span className="text-xs font-bold text-slate-500">Kg</span>
          </h3>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <p className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider">Hasil Pemanfaatan</p>
          <h3 className="text-xl font-extrabold text-emerald-700 mt-2">
            {totalHasilPemanfaatan.toLocaleString("id-ID", { maximumFractionDigits: 1 })}{" "}
            <span className="text-xs font-bold text-slate-500">Kg</span>
          </h3>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <p className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider">Efisiensi Sirkular</p>
          <h3 className="text-xl font-extrabold text-teal-700 mt-2">
            {conversionRatio}% <span className="text-xs font-normal text-slate-500">(Konversi)</span>
          </h3>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <p className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider">RW Berpartisipasi</p>
          <h3 className="text-xl font-extrabold text-blue-700 mt-2">
            {activeRwCount} <span className="text-xs font-normal text-slate-500">Wilayah</span>
          </h3>
        </div>
      </div>

      {/* Interactive Search & Multi-Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5">
        {/* Search Bar Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Cari program, teknologi, bahan baku, RW..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Program Filter */}
          <select
            value={selectedProgramFilter}
            onChange={(e) => setSelectedProgramFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="ALL">Semua Program</option>
            <option value="BANK_SAMPAH">Bank Sampah</option>
            <option value="KOMPOS">Kompos</option>
            <option value="BURUAN_SAE">Buruan Sae</option>
            <option value="RUMAH_MAGGOT">Rumah Maggot</option>
            <option value="POC">Pupuk Organik Cair (POC)</option>
          </select>

          {/* Bahan Baku Filter */}
          <select
            value={selectedBahanFilter}
            onChange={(e) => setSelectedBahanFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="ALL">Semua Bahan Baku</option>
            <option value="ORGANIK">Organik</option>
            <option value="ANORGANIK">Anorganik</option>
          </select>

          {/* RW Filter */}
          <select
            value={selectedRwFilter}
            onChange={(e) => setSelectedRwFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="ALL">Semua RW</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id.toString()}>
                {a.name} (Kel. {a.kelurahan?.name || "Coblong"})
              </option>
            ))}
          </select>

          {/* Reset Filters Button */}
          {(searchQuery || selectedProgramFilter !== "ALL" || selectedBahanFilter !== "ALL" || selectedRwFilter !== "ALL") && (
            <button
              onClick={resetFilters}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw size={13} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-extrabold text-slate-800">Daftar Tata Kelola & Pemanfaatan</h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Menampilkan {filteredItems.length} dari {items.length} program pemanfaatan terdaftar
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
            <Loader2 className="animate-spin text-emerald-600" size={28} />
            <p className="text-xs font-semibold">Memuat data pemanfaatan sampah...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16 text-slate-400 border border-dashed border-slate-200 rounded-2xl space-y-3">
            <Leaf size={36} className="mx-auto text-slate-300" />
            <p className="text-xs font-bold text-slate-600">
              {items.length === 0
                ? "Belum ada data pemanfaatan sampah terdaftar."
                : "Tidak ada data yang cocok dengan kriteria pencarian / filter."}
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
                <tr className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
                  <th className="py-3 px-4 rounded-l-xl">Program & Teknologi</th>
                  <th className="py-3 px-4">Bahan Baku</th>
                  <th className="py-3 px-4 text-center">Volume (Kg)</th>
                  <th className="py-3 px-4 text-center">Hasil Pemanfaatan (Kg)</th>
                  <th className="py-3 px-4">Wilayah RW</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4 text-center">Bukti Foto</th>
                  {!isReadOnly && <th className="py-3 px-4 text-right rounded-r-xl">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => {
                  const progUpper = item.program.toUpperCase();
                  let badgeBg = "bg-slate-100 text-slate-700 border-slate-200";
                  let progLabel = item.program.replace("_", " ");

                  if (progUpper.includes("BANK")) {
                    badgeBg = "bg-emerald-50 text-emerald-700 border-emerald-200";
                    progLabel = "Bank Sampah";
                  } else if (progUpper.includes("KOMPOS") || progUpper.includes("BURUAN")) {
                    badgeBg = "bg-teal-50 text-teal-700 border-teal-200";
                    progLabel = progUpper.includes("BURUAN") ? "Buruan Sae" : "Kompos";
                  } else if (progUpper.includes("MAGGOT")) {
                    badgeBg = "bg-amber-50 text-amber-700 border-amber-200";
                    progLabel = "Rumah Maggot";
                  } else if (progUpper.includes("POC")) {
                    badgeBg = "bg-blue-50 text-blue-700 border-blue-200";
                    progLabel = "Pupuk Organik Cair";
                  }

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-all group">
                      {/* Program & Teknologi */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center gap-1 text-[10.5px] font-extrabold px-2.5 py-0.5 rounded-md border w-fit ${badgeBg}`}>
                            {progLabel}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium pl-0.5">
                            {item.teknologi || "Pengolahan Mandiri"}
                          </span>
                        </div>
                      </td>

                      {/* Bahan Baku */}
                      <td className="py-3.5 px-4 align-middle">
                        <span className="font-bold text-slate-700">{item.bahanBaku || "Organik"}</span>
                      </td>

                      {/* Volume */}
                      <td className="py-3.5 px-4 text-center align-middle">
                        <span className="font-mono font-extrabold text-slate-900 text-sm">
                          {item.volumeBahanBaku}
                        </span>
                      </td>

                      {/* Hasil */}
                      <td className="py-3.5 px-4 text-center align-middle">
                        <span className="font-mono font-extrabold text-emerald-700 text-sm">
                          {item.hasil}
                        </span>
                      </td>

                      {/* Wilayah RW */}
                      <td className="py-3.5 px-4 text-slate-600 font-medium align-middle">
                        {item.rw?.name || `RW ${item.rwId}`}
                        {item.rw?.kelurahan?.name && (
                          <span className="block text-[10px] text-slate-400 font-normal">
                            Kel. {item.rw.kelurahan.name}
                          </span>
                        )}
                      </td>

                      {/* Tanggal */}
                      <td className="py-3.5 px-4 font-semibold text-slate-800 whitespace-nowrap align-middle">
                        {new Date(item.tanggalPencatatan).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </td>

                      {/* Bukti Foto */}
                      <td className="py-3.5 px-4 text-center align-middle">
                        {item.fotoDokumentasiUrl ? (
                          <button
                            onClick={() => setPreviewPhotoUrl(item.fotoDokumentasiUrl)}
                            className="inline-block hover:scale-105 transition-transform cursor-pointer"
                            title="Klik untuk memperbesar"
                          >
                            <img
                              src={item.fotoDokumentasiUrl}
                              alt="Bukti Dokumentasi"
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-2xs mx-auto"
                            />
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">-</span>
                        )}
                      </td>

                      {/* Actions */}
                      {!isReadOnly && (
                        <td className="py-3.5 px-4 text-right align-middle whitespace-nowrap">
                          <div className="flex justify-end items-center gap-1">
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Program"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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
      </div>

      {/* Photo Preview Lightbox Modal */}
      {previewPhotoUrl && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewPhotoUrl(null)}
        >
          <div className="relative max-w-2xl w-full bg-slate-900 rounded-3xl p-3 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setPreviewPhotoUrl(null)}
              className="absolute top-4 right-4 bg-black/60 text-white p-2 rounded-full hover:bg-black transition cursor-pointer z-10"
            >
              <X size={18} />
            </button>
            <img
              src={previewPhotoUrl}
              alt="Bukti Pemanfaatan Sampah"
              className="w-full h-auto max-h-[80vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-extrabold text-base text-slate-800">
                {editingItem ? "Edit Hasil Pemanfaatan" : "Catat Hasil Pemanfaatan Baru"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Program</label>
                  <select
                    value={program}
                    onChange={(e) => setProgram(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold bg-slate-50 focus:bg-white focus:outline-emerald-500 transition-colors cursor-pointer"
                  >
                    <option value="BURUAN_SAE">Buruan Sae</option>
                    <option value="RUMAH_MAGGOT">Rumah Maggot</option>
                    <option value="POC">Pupuk Organik Cair (POC)</option>
                    <option value="BANK_SAMPAH">Bank Sampah</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Wilayah RW</label>
                  <select
                    value={rwId}
                    onChange={(e) => setRwId(e.target.value)}
                    disabled={!!user?.rtRwId}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold bg-slate-50 focus:bg-white focus:outline-emerald-500 transition-colors disabled:opacity-60 cursor-pointer"
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Teknologi / Metode</label>
                  <input
                    type="text"
                    placeholder="Contoh: Kompos Takakura, Biopori"
                    value={teknologi}
                    onChange={(e) => setTeknologi(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:outline-emerald-500 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Bahan Baku</label>
                  <input
                    type="text"
                    placeholder="Contoh: Organik Dapur, Daun Kering"
                    value={bahanBaku}
                    onChange={(e) => setBahanBaku(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:outline-emerald-500 font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Volume Input (Kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    value={volumeBahanBaku}
                    onChange={(e) => setVolumeBahanBaku(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:outline-emerald-500 font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Hasil Output (Kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    value={hasil}
                    onChange={(e) => setHasil(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:outline-emerald-500 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Tanggal Pencatatan</label>
                <input
                  type="date"
                  value={tanggalPencatatan}
                  onChange={(e) => setTanggalPencatatan(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Foto Dokumentasi</label>
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

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition cursor-pointer"
                >
                  {editingItem ? "Simpan Perubahan" : "Simpan Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PemanfaatanSampah;
