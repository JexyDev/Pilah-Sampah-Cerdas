/**
 * Project: TrashCare - Sistem Pemilahan Sampah Cerdas KKN Coblong
 * Page: Penilaian Program Kerja KKN (DPL / Tim Penilai)
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Folder,
  ListFilter,
  BarChart3,
  Users,
  Award,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  X,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  dplService,
  type ProgramKerjaItem,
  type AspekPenilaianItem,
} from "../../services/dplService";
import { EmptyTableState } from "../../components/common/EmptyTableState";

// 7 Standar Aspek Rubrik Penilaian Program Kerja KKN
const DEFAULT_ASPEK_LIST: Array<{ no: number; aspek: string; bobot: number }> = [
  { no: 1, aspek: "Relevansi & Perencanaan Program", bobot: 15 },
  { no: 2, aspek: "Kualitas Pelaksanaan", bobot: 20 },
  { no: 3, aspek: "Partisipasi & Kerja Sama Tim", bobot: 15 },
  { no: 4, aspek: "Inovasi & Pemecahan Masalah", bobot: 15 },
  { no: 5, aspek: "Dokumentasi & Validitas Bukti", bobot: 10 },
  { no: 6, aspek: "Output, Outcome, & Dampak", bobot: 20 },
  { no: 7, aspek: "Keberlanjutan Program", bobot: 5 },
];

export const PenilaianProkerPage: React.FC = () => {
  // State Data Master
  const [loading, setLoading] = useState(true);
  const [prokerList, setProkerList] = useState<ProgramKerjaItem[]>([]);
  const [selectedProkerId, setSelectedProkerId] = useState<string | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [kategoriFilter, setKategoriFilter] = useState("ALL");
  const [statusPelaksanaanFilter, setStatusPelaksanaanFilter] = useState("ALL");
  const [statusPenilaianFilter, setStatusPenilaianFilter] = useState("ALL");

  // Paginasi Kolom Kiri
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 4; // Menampilkan 4 per halaman sesuai layout 1-4 dari total

  // State Form Rubrik Penilaian (Kolom Kanan)
  const [inputNilai, setInputNilai] = useState<Record<number, number | "">>({
    1: "",
    2: "",
    3: "",
    4: "",
    5: "",
    6: "",
    7: "",
  });
  const [catatanDpl, setCatatanDpl] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Modal Bukti Kegiatan
  const [isBuktiModalOpen, setIsBuktiModalOpen] = useState(false);
  const [loadingBukti, setLoadingBukti] = useState(false);
  const [buktiData, setBuktiData] = useState<{
    proker?: any;
    attendances: Array<{
      id: string;
      activityTitle: string;
      description?: string;
      photoUrl?: string;
      checkIn: string;
      user?: { name: string };
    }>;
  } | null>(null);

  // Fetch Data Program Kerja dari Backend
  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await dplService.getProgramKerja(undefined, {
        kategori: kategoriFilter !== "ALL" ? kategoriFilter : undefined,
        statusPelaksanaan: statusPelaksanaanFilter !== "ALL" ? statusPelaksanaanFilter : undefined,
        statusPenilaian: statusPenilaianFilter !== "ALL" ? statusPenilaianFilter : undefined,
        search: searchQuery.trim() ? searchQuery : undefined,
      });

      setProkerList(data);

      // Auto select first item if none or invalid
      if (data.length > 0) {
        if (!selectedProkerId || !data.some((p) => p.id === selectedProkerId)) {
          setSelectedProkerId(data[0].id);
        }
      } else {
        setSelectedProkerId(null);
      }
    } catch {
      toast.error("Gagal memuat daftar program kerja");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [kategoriFilter, statusPelaksanaanFilter, statusPenilaianFilter]);

  // Client-side filtering fallback for immediate search responsiveness
  const filteredProkers = useMemo(() => {
    return prokerList.filter((p) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesDeskripsi = p.deskripsi?.toLowerCase().includes(q);
        const matchesKelompok = p.kelompokName?.toLowerCase().includes(q);
        const matchesKategori = p.kategori?.toLowerCase().includes(q);
        if (!matchesDeskripsi && !matchesKelompok && !matchesKategori) return false;
      }
      // Kategori
      if (kategoriFilter !== "ALL") {
        if (p.kategori?.toLowerCase() !== kategoriFilter.toLowerCase()) return false;
      }
      // Status Pelaksanaan
      if (statusPelaksanaanFilter !== "ALL") {
        if (statusPelaksanaanFilter === "SELESAI" && p.status !== "SELESAI") return false;
        if (
          statusPelaksanaanFilter === "BERJALAN" &&
          p.status !== "SEDANG_BERJALAN" &&
          (p.status as string) !== "SEDANG_DILAKSANAKAN"
        )
          return false;
        if (
          statusPelaksanaanFilter === "BELUM_MULAI" &&
          p.status !== "BELUM_DISETUJUI" &&
          p.status !== "DITERIMA"
        )
          return false;
      }
      // Status Penilaian
      if (statusPenilaianFilter !== "ALL") {
        const currentStatusPenilaian =
          p.statusPenilaian || (p.skorPenilaian ? "SUDAH_DINILAI" : "BELUM_DINILAI");
        if (currentStatusPenilaian !== statusPenilaianFilter) return false;
      }
      return true;
    });
  }, [prokerList, searchQuery, kategoriFilter, statusPelaksanaanFilter, statusPenilaianFilter]);

  // Sync Form State when selected proker changes
  const selectedProker = useMemo(() => {
    return prokerList.find((p) => p.id === selectedProkerId) || null;
  }, [prokerList, selectedProkerId]);

  useEffect(() => {
    if (selectedProker) {
      const newInputs: Record<number, number | ""> = {
        1: "",
        2: "",
        3: "",
        4: "",
        5: "",
        6: "",
        7: "",
      };

      if (Array.isArray(selectedProker.aspekPenilaian) && selectedProker.aspekPenilaian.length > 0) {
        selectedProker.aspekPenilaian.forEach((item) => {
          if (item.no >= 1 && item.no <= 7) {
            newInputs[item.no] = item.nilai !== undefined && item.nilai !== null ? item.nilai : "";
          }
        });
      } else if (selectedProker.skorPenilaian !== null && selectedProker.skorPenilaian !== undefined) {
        // Fallback default distribution jika sebelumnya hanya skor total
        const flatScore = Number(selectedProker.skorPenilaian);
        for (let i = 1; i <= 7; i++) {
          newInputs[i] = flatScore;
        }
      }

      setInputNilai(newInputs);
      setCatatanDpl(selectedProker.evaluasiDpl || selectedProker.catatanDpl || "");
    }
  }, [selectedProkerId, selectedProker]);

  // Kalkulasi Skor per Aspek dan Nilai Akhir Real-time
  const calculatedRubrik = useMemo(() => {
    let totalScore = 0;
    let filledCount = 0;

    const rubrik = DEFAULT_ASPEK_LIST.map((item) => {
      const val = inputNilai[item.no];
      const numericVal = typeof val === "number" && !isNaN(val) ? Math.min(100, Math.max(0, val)) : 0;
      if (typeof val === "number" && !isNaN(val)) filledCount++;
      const score = Number(((numericVal * item.bobot) / 100).toFixed(1));
      totalScore += score;
      return {
        ...item,
        nilai: val,
        numericVal,
        skor: score,
      };
    });

    const finalScore = Number(totalScore.toFixed(1));

    // Menentukan Predikat
    let predikat = "Kurang";
    if (finalScore >= 85) predikat = "Sangat Baik";
    else if (finalScore >= 75) predikat = "Baik";
    else if (finalScore >= 60) predikat = "Cukup";

    return {
      rubrik,
      totalScore: finalScore,
      predikat,
      filledCount,
    };
  }, [inputNilai]);

  // Handler Ganti Nilai Aspek
  const handleScoreChange = (no: number, rawVal: string) => {
    if (rawVal === "") {
      setInputNilai((prev) => ({ ...prev, [no]: "" }));
      return;
    }
    const num = Number(rawVal);
    if (isNaN(num)) return;
    const clamped = Math.min(100, Math.max(0, num));
    setInputNilai((prev) => ({ ...prev, [no]: clamped }));
  };

  // Reset / Batal
  const handleBatal = () => {
    if (selectedProker) {
      const newInputs: Record<number, number | ""> = {
        1: "",
        2: "",
        3: "",
        4: "",
        5: "",
        6: "",
        7: "",
      };
      if (Array.isArray(selectedProker.aspekPenilaian) && selectedProker.aspekPenilaian.length > 0) {
        selectedProker.aspekPenilaian.forEach((item) => {
          if (item.no >= 1 && item.no <= 7) newInputs[item.no] = item.nilai;
        });
      }
      setInputNilai(newInputs);
      setCatatanDpl(selectedProker.evaluasiDpl || selectedProker.catatanDpl || "");
      toast("Form penilaian direset ke kondisi awal", { icon: "↩️" });
    }
  };

  // Simpan Nilai ke Backend (Atomic Update)
  const handleSimpanNilai = async () => {
    if (!selectedProker) return;

    if (calculatedRubrik.filledCount === 0) {
      toast.error("Harap masukkan nilai pada aspek penilaian");
      return;
    }

    setIsSaving(true);
    try {
      const payloadAspek: AspekPenilaianItem[] = calculatedRubrik.rubrik.map((r) => ({
        no: r.no,
        aspek: r.aspek,
        bobot: r.bobot,
        nilai: typeof r.nilai === "number" ? r.nilai : 0,
        skor: r.skor,
      }));

      const statusPenilaian: "BELUM_DINILAI" | "SEDANG_DINILAI" | "SUDAH_DINILAI" =
        calculatedRubrik.filledCount === 7 ? "SUDAH_DINILAI" : "SEDANG_DINILAI";

      await dplService.assessProgramKerja(
        selectedProker.id,
        calculatedRubrik.totalScore,
        catatanDpl,
        payloadAspek,
        calculatedRubrik.predikat,
        statusPenilaian
      );

      toast.success(
        `Penilaian ${selectedProker.kelompokName} berhasil disimpan (${calculatedRubrik.totalScore} - ${calculatedRubrik.predikat})`
      );

      // Update state lokal
      setProkerList((prev) =>
        prev.map((p) =>
          p.id === selectedProker.id
            ? {
                ...p,
                skorPenilaian: calculatedRubrik.totalScore,
                evaluasiDpl: catatanDpl,
                aspekPenilaian: payloadAspek,
                predikat: calculatedRubrik.predikat,
                statusPenilaian: statusPenilaian,
              }
            : p
        )
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menyimpan penilaian");
    } finally {
      setIsSaving(false);
    }
  };

  // Handler Buka Bukti Kegiatan
  const handleOpenBukti = async () => {
    if (!selectedProker) return;
    setIsBuktiModalOpen(true);
    setLoadingBukti(true);
    try {
      const res = await dplService.getProgramKerjaBukti(selectedProker.id);
      setBuktiData(res);
    } catch {
      setBuktiData({
        proker: selectedProker,
        attendances: [],
      });
    } finally {
      setLoadingBukti(false);
    }
  };

  // Helper Badge Status Pelaksanaan
  const renderStatusPelaksanaanBadge = (status: string) => {
    switch (status) {
      case "SELESAI":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/40">
            Selesai
          </span>
        );
      case "SEDANG_BERJALAN":
      case "SEDANG_DILAKSANAKAN":
      case "BERJALAN":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/40">
            Berjalan
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/60">
            Belum Mulai
          </span>
        );
    }
  };

  // Helper Badge Status Penilaian
  const renderStatusPenilaianBadge = (statusPenilaian?: string, skor?: number | null) => {
    const status = statusPenilaian || (skor ? "SUDAH_DINILAI" : "BELUM_DINILAI");
    switch (status) {
      case "SUDAH_DINILAI":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/40">
            Sudah Dinilai
          </span>
        );
      case "SEDANG_DINILAI":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/40">
            Sedang Dinilai
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/60">
            Belum Dinilai
          </span>
        );
    }
  };

  // Helper Kategori Badge
  const renderKategoriBadge = (kategori?: string) => {
    const k = kategori || "Pemilahan";
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
        {k}
      </span>
    );
  };

  // Paginasi Data
  const totalItems = filteredProkers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedProkers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProkers.slice(start, start + itemsPerPage);
  }, [filteredProkers, currentPage, itemsPerPage]);

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#f8fafc] dark:bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-6 text-slate-800 dark:text-slate-100 max-w-[1600px] mx-auto">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Penilaian Program Kerja
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Evaluasi pelaksanaan dan dampak program kerja setiap kelompok KKN
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-all shadow-2xs cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw size={13} className={loading ? "animate-spin text-[#009966]" : "text-[#009966]"} />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* Baris Filter Interaktif (4 Kontrol) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kelompok atau program kerja..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Filter Kategori */}
        <div className="relative">
          <Folder size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select
            value={kategoriFilter}
            onChange={(e) => {
              setKategoriFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer appearance-none"
          >
            <option value="ALL">Semua Kategori</option>
            <option value="Pemilahan">Pemilahan</option>
            <option value="Pengangkutan">Pengangkutan</option>
            <option value="Pengolahan">Pengolahan</option>
            <option value="Pemanfaatan">Pemanfaatan</option>
            <option value="Edukasi">Edukasi</option>
            <option value="Lainnya">Lainnya</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            ▼
          </div>
        </div>

        {/* Filter Status Pelaksanaan */}
        <div className="relative">
          <ListFilter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select
            value={statusPelaksanaanFilter}
            onChange={(e) => {
              setStatusPelaksanaanFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer appearance-none"
          >
            <option value="ALL">Semua Status Pelaksanaan</option>
            <option value="BELUM_MULAI">Belum Mulai</option>
            <option value="BERJALAN">Berjalan</option>
            <option value="SELESAI">Selesai</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            ▼
          </div>
        </div>

        {/* Filter Status Penilaian */}
        <div className="relative">
          <BarChart3 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select
            value={statusPenilaianFilter}
            onChange={(e) => {
              setStatusPenilaianFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer appearance-none"
          >
            <option value="ALL">Semua Status Penilaian</option>
            <option value="BELUM_DINILAI">Belum Dinilai</option>
            <option value="SEDANG_DINILAI">Sedang Dinilai</option>
            <option value="SUDAH_DINILAI">Sudah Dinilai</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            ▼
          </div>
        </div>
      </div>

      {/* Grid Layout Dua Kolom (Split-View) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Kolom Kiri: Tabel Program Kerja (Master) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden flex flex-col">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="animate-spin text-emerald-600" size={28} />
              <span className="text-xs font-medium">Memuat program kerja kelompok...</span>
            </div>
          ) : filteredProkers.length === 0 ? (
            <div className="p-8">
              <EmptyTableState
                entityName="Program Kerja KKN"
                isSearch={!!(searchQuery || kategoriFilter !== "ALL" || statusPelaksanaanFilter !== "ALL" || statusPenilaianFilter !== "ALL")}
                searchQuery={searchQuery}
                onResetSearch={() => {
                  setSearchQuery("");
                  setKategoriFilter("ALL");
                  setStatusPelaksanaanFilter("ALL");
                  setStatusPenilaianFilter("ALL");
                }}
              />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/90 dark:bg-slate-800/90 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold">
                      <th className="py-3 px-3 w-10 text-center">No.</th>
                      <th className="py-3 px-3.5 min-w-[130px]">Nama Kelompok</th>
                      <th className="py-3 px-3 min-w-[100px]">Kategori Program Kerja</th>
                      <th className="py-3 px-3.5 min-w-[170px]">Deskripsi Program Kerja</th>
                      <th className="py-3 px-3 text-center min-w-[95px]">Status Pelaksanaan</th>
                      <th className="py-3 px-3 text-center min-w-[95px]">Status Penilaian</th>
                      <th className="py-3 px-3 text-center min-w-[90px]">Aksi Penilaian</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-normal">
                    {paginatedProkers.map((p, idx) => {
                      const isSelected = selectedProkerId === p.id;
                      const rowNumber = startIndex + idx;
                      const statusPenilaian =
                        p.statusPenilaian || (p.skorPenilaian ? "SUDAH_DINILAI" : "BELUM_DINILAI");

                      return (
                        <tr
                          key={p.id}
                          onClick={() => setSelectedProkerId(p.id)}
                          className={`transition-colors cursor-pointer select-none ${
                            isSelected
                              ? "bg-emerald-50/50 dark:bg-emerald-950/20"
                              : "hover:bg-slate-50/80 dark:bg-slate-800/80 dark:hover:bg-slate-800/40"
                          }`}
                        >
                          {/* No with Green Left Stripe Indicator on Active */}
                          <td
                            className={`py-3 px-3 text-center font-bold text-slate-600 dark:text-slate-300 relative ${
                              isSelected ? "border-l-4 border-l-emerald-700 text-emerald-800 dark:text-emerald-400 font-extrabold" : ""
                            }`}
                          >
                            {rowNumber}
                          </td>

                          {/* Nama Kelompok */}
                          <td className="py-3 px-3.5">
                            <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                              {p.kelompokName}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              Kel. {p.kelurahan}
                            </div>
                          </td>

                          {/* Kategori */}
                          <td className="py-3 px-3">
                            {renderKategoriBadge(p.kategori)}
                          </td>

                          {/* Deskripsi */}
                          <td className="py-3 px-3.5">
                            <p className="text-slate-700 dark:text-slate-300 leading-snug line-clamp-2">
                              {p.deskripsi}
                            </p>
                          </td>

                          {/* Status Pelaksanaan */}
                          <td className="py-3 px-3 text-center">
                            {renderStatusPelaksanaanBadge(p.status)}
                          </td>

                          {/* Status Penilaian */}
                          <td className="py-3 px-3 text-center">
                            {renderStatusPenilaianBadge(p.statusPenilaian, p.skorPenilaian)}
                          </td>

                          {/* Aksi Penilaian Button */}
                          <td className="py-3 px-3 text-center">
                            {statusPenilaian === "SEDANG_DINILAI" ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedProkerId(p.id);
                                }}
                                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
                              >
                                Lanjutkan
                              </button>
                            ) : statusPenilaian === "SUDAH_DINILAI" ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedProkerId(p.id);
                                }}
                                className="px-3 py-1.5 border border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                              >
                                Lihat Nilai
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedProkerId(p.id);
                                }}
                                className="px-3 py-1.5 border border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                              >
                                Beri Nilai
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Paginasi Bagian Bawah Tabel */}
              <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span>
                  Menampilkan {startIndex}-{endIndex} dari {totalItems} program kerja
                </span>

                <div className="flex items-center gap-1">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        currentPage === pageNum
                          ? "bg-emerald-700 text-white"
                          : "border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Kolom Kanan: Form Penilaian Program Kerja (Detail) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-2xs">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3.5">
            Form Penilaian Program Kerja
          </h2>

          {!selectedProker ? (
            <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <Users size={32} className="text-slate-300" />
              <p className="text-xs">Pilih salah satu program kerja di tabel sebelah kiri untuk mulai menilai.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header Info Kelompok & Proker Card */}
              <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800/80 dark:bg-slate-800/40 rounded-xl border border-slate-200/70 dark:border-slate-800 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center text-white shrink-0 shadow-xs">
                    <Users size={20} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                      {selectedProker.kelompokName}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2">
                      {selectedProker.deskripsi}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      {renderKategoriBadge(selectedProker.kategori)}
                      {renderStatusPelaksanaanBadge(selectedProker.status)}
                    </div>
                  </div>
                </div>

                {/* Tombol Lihat Bukti Kegiatan */}
                <button
                  onClick={handleOpenBukti}
                  className="px-2.5 py-1.5 border border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                >
                  <FileText size={13} />
                  <span>Lihat Bukti Kegiatan</span>
                </button>
              </div>

              {/* Subheading Aspek Penilaian */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                  Aspek Penilaian
                </h4>

                {/* Tabel 7 Aspek Rubrik Penilaian */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 dark:bg-slate-800/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-[11px] font-bold border-b border-slate-200 dark:border-slate-800">
                        <th className="py-2.5 px-2 text-center w-8">No.</th>
                        <th className="py-2.5 px-2.5">Aspek Penilaian</th>
                        <th className="py-2.5 px-2 text-center w-14">Bobot</th>
                        <th className="py-2.5 px-2 text-center w-28">Nilai</th>
                        <th className="py-2.5 px-2.5 text-right w-14">Skor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {calculatedRubrik.rubrik.map((r) => (
                        <tr key={r.no} className="hover:bg-slate-50/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/30">
                          <td className="py-2 px-2 text-center font-bold text-slate-400">
                            {r.no}
                          </td>
                          <td className="py-2 px-2.5 font-medium text-slate-800 dark:text-slate-200">
                            {r.aspek}
                          </td>
                          <td className="py-2 px-2 text-center font-semibold text-slate-600 dark:text-slate-300">
                            {r.bobot}%
                          </td>
                          <td className="py-1.5 px-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                placeholder="0-100"
                                value={r.nilai}
                                onChange={(e) => handleScoreChange(r.no, e.target.value)}
                                className="w-16 px-1.5 py-1 text-center font-bold text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                              />
                            </div>
                          </td>
                          <td className="py-2 px-2.5 text-right font-bold text-slate-800 dark:text-slate-200">
                            {r.skor.toFixed(1)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50/90 dark:bg-slate-800/90 dark:bg-slate-800/70 border-t border-slate-200 dark:border-slate-800 text-[11px] font-extrabold text-slate-800 dark:text-slate-200">
                        <td colSpan={2} className="py-2 px-3 text-left">
                          Total Bobot
                        </td>
                        <td className="py-2 px-2 text-center">100%</td>
                        <td></td>
                        <td className="py-2 px-2.5 text-right text-emerald-700 dark:text-emerald-400">
                          {calculatedRubrik.totalScore.toFixed(1)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Summary Box Nilai Akhir & Predikat Sesuai Gambar */}
              <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/50 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0">
                    <Award size={22} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
                      Nilai Akhir
                    </span>
                    <span className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                      {calculatedRubrik.totalScore.toFixed(1)}
                    </span>
                  </div>
                </div>

                <div className="border-l border-emerald-200 dark:border-emerald-800/80 pl-4 text-right">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                    Predikat:
                  </span>
                  <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-400">
                    {calculatedRubrik.predikat}
                  </span>
                </div>
              </div>

              {/* Catatan DPL */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Catatan DPL
                </label>
                <textarea
                  rows={3}
                  placeholder="Tuliskan evaluasi, catatan, atau rekomendasi perbaikan program..."
                  value={catatanDpl}
                  onChange={(e) => setCatatanDpl(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              {/* Tombol Aksi Bawah */}
              <div className="flex items-center justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleBatal}
                  disabled={isSaving}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={handleSimpanNilai}
                  disabled={isSaving}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} />
                      <span>Simpan Nilai</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Bukti Kegiatan & Dokumentasi */}
      {isBuktiModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                  <FileText size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Bukti & Dokumentasi Kegiatan
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {selectedProker?.kelompokName} — {selectedProker?.deskripsi}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsBuktiModalOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4">
              {/* Google Drive Link Section */}
              <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-xs text-blue-900 dark:text-blue-200 font-medium">
                  <ExternalLink size={16} className="text-blue-600 shrink-0" />
                  <span>
                    {selectedProker?.linkGoogleDrive
                      ? "Tautan Google Drive Dokumentasi & Laporan Proker"
                      : "Belum ada link Google Drive terlampir pada proker ini"}
                  </span>
                </div>

                {selectedProker?.linkGoogleDrive && (
                  <a
                    href={selectedProker.linkGoogleDrive}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shrink-0"
                  >
                    <span>Buka Drive</span>
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>

              {/* Activity Attendance & Photos Gallery */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2.5 flex items-center gap-1.5">
                  <ImageIcon size={14} className="text-slate-500" />
                  <span>Dokumentasi Presensi & Aktivitas Lapangan Kelompok</span>
                </h4>

                {loadingBukti ? (
                  <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                    <Loader2 size={24} className="animate-spin text-emerald-600" />
                    <span className="text-xs font-medium">Memuat dokumentasi foto kegiatan...</span>
                  </div>
                ) : !buktiData?.attendances || buktiData.attendances.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800">
                    <AlertCircle size={24} className="mx-auto mb-1.5 text-slate-300" />
                    <p className="text-xs">Belum ada foto dokumentasi aktivitas dari kelompok ini.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {buktiData.attendances.map((att) => (
                      <div
                        key={att.id}
                        className="group border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800/40 flex flex-col"
                      >
                        <div className="aspect-4/3 bg-slate-200 dark:bg-slate-700 relative overflow-hidden">
                          {att.photoUrl ? (
                            <img
                              src={att.photoUrl}
                              alt={att.activityTitle}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <ImageIcon size={24} />
                            </div>
                          )}
                        </div>
                        <div className="p-2 text-[11px]">
                          <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                            {att.activityTitle}
                          </div>
                          <div className="text-slate-500 truncate mt-0.5">
                            Oleh: {att.user?.name || "Mahasiswa"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsBuktiModalOpen(false)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PenilaianProkerPage;
