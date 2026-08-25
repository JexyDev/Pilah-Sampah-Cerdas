/**
 * Project: BERSEKA - Sistem Pemilahan Sampah Cerdas KKN Coblong
 * Page: Penilaian Program Kerja KKN (DPL / Tim Penilai)
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Folder,
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
  AlertCircle,
  Edit3,
  Eye,
  PlusCircle,
  XCircle,
  Clock,
  Image as ImageIcon,
  ZoomIn,
  Camera,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  dplService,
  type ProgramKerjaItem,
  type AspekPenilaianItem,
} from "../../services/dplService";
import { EmptyTableState } from "../../components/common/EmptyTableState";
import { getMediaPhotoUrl, formatGoogleDriveUrl } from "../../utils/photoUtils";

// 7 Standar Aspek Rubrik Penilaian Program Kerja KKN
const ASPEK_RUBRIK_PROKER: Array<{ no: number; aspek: string; bobot: number }> = [
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

  // Filter States (Fokus pada Search, Kategori, Status Pelaksanaan, dan Status Penilaian)
  const [searchQuery, setSearchQuery] = useState("");
  const [kategoriFilter, setKategoriFilter] = useState("ALL");
  const [statusPelaksanaanFilter, setStatusPelaksanaanFilter] = useState("ALL");
  const [statusPenilaianFilter, setStatusPenilaianFilter] = useState("ALL");

  // Paginasi
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Modal Penilaian Program Kerja (Popup)
  const [isAssessModalOpen, setIsAssessModalOpen] = useState(false);

  // State Form Rubrik Penilaian
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
  const [buktiFilterTab, setBuktiFilterTab] = useState<"ALL" | "FOTO" | "PRESENSI">("ALL");
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [failedImageIds, setFailedImageIds] = useState<Record<string, boolean>>({});
  const [buktiData, setBuktiData] = useState<{
    proker?: any;
    attendances: Array<{
      id: string;
      activityTitle: string;
      description?: string;
      photoUrl?: string | null;
      checkIn: string;
      user?: { name: string };
      type?: string;
    }>;
  } | null>(null);

  // Fetch Data Program Kerja dari Backend: Semua Program Kerja yang Telah Disetujui (ACC)
  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await dplService.getProgramKerja(undefined, {
        kategori: kategoriFilter !== "ALL" ? kategoriFilter : undefined,
        statusUsulan: "DISETUJUI",
        statusPelaksanaan: statusPelaksanaanFilter !== "ALL" ? statusPelaksanaanFilter : undefined,
        statusPenilaian: statusPenilaianFilter !== "ALL" ? statusPenilaianFilter : undefined,
        search: searchQuery.trim() ? searchQuery : undefined,
      });

      setProkerList(data);
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
      // 1. Validasi Status Usulan: Wajib Disetujui (ACC)
      const legacySt = String(p.status || "").toUpperCase();
      let u = p.statusUsulan;
      if (!u) {
        if (legacySt === "DITERIMA" || legacySt === "DISETUJUI" || legacySt === "SEDANG_BERJALAN" || legacySt === "SELESAI") u = "DISETUJUI";
        else if (legacySt === "DITOLAK" || legacySt === "TIDAK_DISETUJUI") u = "DITOLAK";
        else u = "BELUM_DISETUJUI";
      }
      if (u !== "DISETUJUI" && u !== "DITERIMA") return false;

      // 2. Validasi Status Pelaksanaan
      let pl = p.statusPelaksanaan;
      if (!pl) {
        if (legacySt === "SELESAI") pl = "SELESAI";
        else if (legacySt === "SEDANG_BERJALAN" || legacySt === "SEDANG_DILAKSANAKAN" || legacySt === "BERJALAN") pl = "SEDANG_BERJALAN";
        else pl = "BELUM_MULAI";
      }
      if (statusPelaksanaanFilter !== "ALL") {
        if (pl !== statusPelaksanaanFilter) return false;
      }

      // 3. Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesDeskripsi = p.deskripsi?.toLowerCase().includes(q);
        const matchesKelompok = p.kelompokName?.toLowerCase().includes(q);
        const matchesKategori = p.kategori?.toLowerCase().includes(q);
        const matchesJudul = p.judul?.toLowerCase().includes(q);
        if (!matchesDeskripsi && !matchesKelompok && !matchesKategori && !matchesJudul) return false;
      }

      // 4. Kategori
      if (kategoriFilter !== "ALL") {
        const pKat = (p.kategori || "Lainnya").toLowerCase();
        const filterKat = kategoriFilter.toLowerCase();
        if (filterKat.includes("edukasi") || filterKat.includes("sosialisasi")) {
          if (!pKat.includes("edukasi") && !pKat.includes("sosialisasi") && pKat !== "non-fisik") return false;
        } else if (filterKat.includes("pemanfaatan")) {
          if (!pKat.includes("pemanfaatan") && !pKat.includes("manfaat") && pKat !== "fisik") return false;
        } else if (filterKat.includes("pengolahan")) {
          if (!pKat.includes("pengolahan") && !pKat.includes("olah")) return false;
        } else if (filterKat.includes("pengangkutan")) {
          if (!pKat.includes("pengangkutan") && !pKat.includes("angkut")) return false;
        } else if (filterKat.includes("pemilahan")) {
          if (!pKat.includes("pemilahan") && !pKat.includes("pilah")) return false;
        } else {
          if (pKat !== filterKat) return false;
        }
      }

      // 5. Status Penilaian
      if (statusPenilaianFilter !== "ALL") {
        const currentStatusPenilaian =
          p.statusPenilaian || (p.skorPenilaian ? "SUDAH_DINILAI" : "BELUM_DINILAI");
        if (currentStatusPenilaian !== statusPenilaianFilter) return false;
      }
      return true;
    });
  }, [prokerList, searchQuery, kategoriFilter, statusPenilaianFilter]);

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
        const avg = selectedProker.skorPenilaian;
        for (let i = 1; i <= 7; i++) {
          newInputs[i] = avg;
        }
      }

      setInputNilai(newInputs);
      setCatatanDpl(selectedProker.evaluasiDpl || selectedProker.catatanDpl || "");
    }
  }, [selectedProker]);

  // Hitung Skor & Predikat Berdasarkan Rubrik 7 Aspek
  const calculatedRubrik = useMemo(() => {
    let totalScore = 0;
    let totalFilled = 0;

    const details = ASPEK_RUBRIK_PROKER.map((item) => {
      const val = inputNilai[item.no];
      const numericVal = typeof val === "number" ? val : 0;
      if (typeof val === "number") totalFilled++;

      const skorItem = (numericVal * item.bobot) / 100;
      totalScore += skorItem;

      return {
        no: item.no,
        aspek: item.aspek,
        bobot: item.bobot,
        nilai: val,
        skor: skorItem,
      };
    });

    let predikat = "Belum Dinilai";
    if (totalFilled > 0) {
      if (totalScore >= 85) predikat = "Sangat Baik";
      else if (totalScore >= 70) predikat = "Baik";
      else if (totalScore >= 60) predikat = "Cukup";
      else predikat = "Kurang";
    }

    return {
      rubrik: details,
      totalScore: Math.round(totalScore * 100) / 100,
      totalFilled,
      isComplete: totalFilled === 7,
      predikat,
    };
  }, [inputNilai]);

  // Handler Nilai Per Aspek Rubrik
  const handleScoreChange = (no: number, valStr: string) => {
    if (valStr === "") {
      setInputNilai((prev) => ({ ...prev, [no]: "" }));
      return;
    }
    const num = Math.min(100, Math.max(0, Number(valStr)));
    if (!isNaN(num)) {
      setInputNilai((prev) => ({ ...prev, [no]: num }));
    }
  };

  // Handler Reset Form Modal
  const handleResetForm = () => {
    setInputNilai({ 1: "", 2: "", 3: "", 4: "", 5: "", 6: "", 7: "" });
    setCatatanDpl("");
  };

  // Handler Buka Modal Penilaian
  const handleOpenAssessModal = (proker: ProgramKerjaItem) => {
    let u = proker.statusUsulan;
    const leg = String(proker.status || "").toUpperCase();
    if (!u) {
      if (leg === "DITERIMA" || leg === "DISETUJUI" || leg === "SEDANG_BERJALAN" || leg === "SELESAI") u = "DISETUJUI";
      else if (leg === "DITOLAK" || leg === "TIDAK_DISETUJUI") u = "DITOLAK";
      else u = "BELUM_DISETUJUI";
    }
    if (u !== "DISETUJUI" && u !== "DITERIMA") {
      toast.error("Hanya program kerja yang telah disetujui (ACC) yang dapat dinilai");
      return;
    }

    setSelectedProkerId(proker.id);
    setIsAssessModalOpen(true);
  };

  // Handler Tutup Modal
  const handleCloseAssessModal = () => {
    setIsAssessModalOpen(false);
  };

  // Handler Simpan Penilaian Program Kerja
  const handleSimpanNilai = async () => {
    if (!selectedProker) return;

    if (calculatedRubrik.totalFilled === 0) {
      toast.error("Silakan isi setidaknya satu nilai aspek sebelum menyimpan");
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

      const statusPenilaian = calculatedRubrik.isComplete ? "SUDAH_DINILAI" : "SEDANG_DINILAI";

      await dplService.assessProgramKerja(
        selectedProker.id,
        calculatedRubrik.totalScore,
        catatanDpl,
        payloadAspek,
        calculatedRubrik.predikat,
        statusPenilaian,
        "SELESAI"
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
                statusPelaksanaan: "SELESAI",
              }
            : p
        )
      );

      // Tutup popup modal setelah berhasil simpan
      setIsAssessModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menyimpan penilaian");
    } finally {
      setIsSaving(false);
    }
  };

  // Handler Buka Bukti Kegiatan
  const handleOpenBukti = async (proker?: ProgramKerjaItem) => {
    const targetProker = proker || selectedProker;
    if (!targetProker) return;

    let u = targetProker.statusUsulan;
    const leg = String(targetProker.status || "").toUpperCase();
    if (!u) {
      if (leg === "DITERIMA" || leg === "DISETUJUI" || leg === "SEDANG_BERJALAN" || leg === "SELESAI") u = "DISETUJUI";
      else if (leg === "DITOLAK" || leg === "TIDAK_DISETUJUI") u = "DITOLAK";
      else u = "BELUM_DISETUJUI";
    }
    if (u === "DITOLAK" || u === "TIDAK_DISETUJUI") {
      toast.error("Program kerja dengan status Ditolak tidak memiliki bukti kegiatan");
      return;
    }

    if (!selectedProkerId || selectedProkerId !== targetProker.id) {
      setSelectedProkerId(targetProker.id);
    }

    setIsBuktiModalOpen(true);
    setLoadingBukti(true);
    setFailedImageIds({});
    setBuktiFilterTab("ALL");
    try {
      const res = await dplService.getProgramKerjaBukti(targetProker.id);
      setBuktiData(res);
    } catch {
      setBuktiData({
        proker: targetProker,
        attendances: [],
      });
    } finally {
      setLoadingBukti(false);
    }
  };

  // Helper Badge Status Usulan (Approval: Disetujui / Ditolak / Menunggu)
  const renderStatusUsulanBadge = (statusUsulan?: string, legacyStatus?: string) => {
    let u = statusUsulan;
    const leg = String(legacyStatus || "").toUpperCase();
    if (!u) {
      if (leg === "DITERIMA" || leg === "DISETUJUI" || leg === "SEDANG_BERJALAN" || leg === "SELESAI") u = "DISETUJUI";
      else if (leg === "DITOLAK" || leg === "TIDAK_DISETUJUI") u = "DITOLAK";
      else u = "BELUM_DISETUJUI";
    }

    switch (u) {
      case "DISETUJUI":
      case "DITERIMA":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/40">
            <CheckCircle2 size={11} />
            <span>Disetujui</span>
          </span>
        );
      case "DITOLAK":
      case "TIDAK_DISETUJUI":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/40">
            <XCircle size={11} />
            <span>Ditolak</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/40">
            <Clock size={11} />
            <span>Menunggu</span>
          </span>
        );
    }
  };

  // Helper Badge Status Pelaksanaan (Execution: Belum Mulai / Sedang Berjalan / Selesai)
  const renderStatusPelaksanaanBadge = (statusPelaksanaan?: string, legacyStatus?: string) => {
    let p = statusPelaksanaan;
    const leg = String(legacyStatus || "").toUpperCase();
    if (!p) {
      if (leg === "SELESAI") p = "SELESAI";
      else if (leg === "SEDANG_BERJALAN" || leg === "SEDANG_DILAKSANAKAN" || leg === "BERJALAN") p = "SEDANG_BERJALAN";
      else p = "BELUM_MULAI";
    }

    switch (p) {
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
            Sedang Berjalan
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
  const renderStatusPenilaianBadge = (
    statusPenilaian?: string | null,
    skor?: number | null,
    predikat?: string | null
  ) => {
    const status = statusPenilaian || (skor ? "SUDAH_DINILAI" : "BELUM_DINILAI");
    switch (status) {
      case "SUDAH_DINILAI":
        return (
          <div className="flex flex-col items-center gap-0.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/40">
              <CheckCircle2 size={11} />
              <span>Sudah Dinilai</span>
            </span>
            {skor !== undefined && skor !== null && (
              <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                {skor.toFixed(1)} {predikat ? `(${predikat})` : ""}
              </span>
            )}
          </div>
        );
      case "SEDANG_DINILAI":
        return (
          <div className="flex flex-col items-center gap-0.5">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/40">
              Sedang Dinilai
            </span>
            {skor !== undefined && skor !== null && skor > 0 && (
              <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                Skor: {skor.toFixed(1)}
              </span>
            )}
          </div>
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
    const raw = (kategori || "Pemilahan").toLowerCase();
    if (raw.includes("pemilahan") || raw.includes("pilah")) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
          Pemilahan
        </span>
      );
    }
    if (raw.includes("pengangkutan") || raw.includes("angkut")) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
          Pengangkutan
        </span>
      );
    }
    if (raw.includes("pengolahan") || raw.includes("olah")) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40">
          Pengolahan
        </span>
      );
    }
    if (raw.includes("pemanfaatan") || raw.includes("manfaat") || raw === "fisik") {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/40">
          Pemanfaatan
        </span>
      );
    }
    if (raw.includes("edukasi") || raw.includes("sosialisasi") || raw === "non-fisik") {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40">
          Edukasi &amp; Sosialisasi
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/40">
        {kategori || "Lainnya"}
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
            Evaluasi dan penilaian capaian program kerja setiap kelompok KKN yang telah disetujui dan selesai dilaksanakan
          </p>
        </div>
      </div>

      {/* Baris Filter Interaktif (4 Kontrol: Search, Kategori, Status Pelaksanaan, Status Penilaian + Info Banner) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs items-center">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kelompok / judul / deskripsi..."
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
            <option value="Edukasi & Sosialisasi">Edukasi &amp; Sosialisasi</option>
            <option value="Lainnya">Lainnya</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            ▼
          </div>
        </div>

        {/* Filter Status Pelaksanaan */}
        <div className="relative">
          <Clock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select
            value={statusPelaksanaanFilter}
            onChange={(e) => {
              setStatusPelaksanaanFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer appearance-none"
          >
            <option value="ALL">Semua Pelaksanaan</option>
            <option value="BELUM_MULAI">Belum Mulai</option>
            <option value="SEDANG_BERJALAN">Sedang Berjalan</option>
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

        {/* Info Banner Indikator Kriteria */}
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/40 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs">
          <CheckCircle2 size={14} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="truncate font-medium">Khusus Proker Disetujui (ACC)</span>
        </div>
      </div>

      {/* Tabel Program Kerja KKN (Full Width Master View) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden flex flex-col">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="animate-spin text-emerald-600" size={28} />
            <span className="text-xs font-medium">Memuat daftar program kerja yang siap dinilai...</span>
          </div>
        ) : filteredProkers.length === 0 ? (
          <div className="p-8">
            <EmptyTableState
              entityName="Program Kerja Disetujui (ACC)"
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
                    <th className="py-3.5 px-3 w-12 text-center">No.</th>
                    <th className="py-3.5 px-4 min-w-[160px]">Nama Kelompok &amp; Wilayah</th>
                    <th className="py-3.5 px-3.5 min-w-[120px]">Kategori</th>
                    <th className="py-3.5 px-4 min-w-[200px]">Judul Program</th>
                    <th className="py-3.5 px-4 min-w-[260px]">Deskripsi Program Kerja</th>
                    <th className="py-3.5 px-3.5 text-center min-w-[130px]">Status Usulan</th>
                    <th className="py-3.5 px-3.5 text-center min-w-[130px]">Status Pelaksanaan</th>
                    <th className="py-3.5 px-3.5 text-center min-w-[130px]">Status Penilaian</th>
                    <th className="py-3.5 px-4 text-center min-w-[160px]">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-normal">
                  {paginatedProkers.map((p, idx) => {
                    const rowNumber = startIndex + idx;
                    const statusPenilaian =
                      p.statusPenilaian || (p.skorPenilaian ? "SUDAH_DINILAI" : "BELUM_DINILAI");

                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-slate-50/80 dark:bg-slate-800/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* No */}
                        <td className="py-3.5 px-3 text-center font-bold text-slate-500 dark:text-slate-400">
                          {rowNumber}
                        </td>

                        {/* Nama Kelompok */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                            {p.kelompokName}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Kel. {p.kelurahan}
                          </div>
                        </td>

                        {/* Kategori */}
                        <td className="py-3.5 px-3.5">
                          {renderKategoriBadge(p.kategori)}
                        </td>

                        {/* Judul Program */}
                        <td className="py-3.5 px-4">
                          <p className="text-slate-900 dark:text-slate-100 font-bold text-xs">
                            {p.judul || "-"}
                          </p>
                        </td>

                        {/* Deskripsi */}
                        <td className="py-3.5 px-4">
                          <p className="text-slate-700 dark:text-slate-300 leading-snug line-clamp-2 text-xs">
                            {p.deskripsi}
                          </p>
                        </td>

                        {/* Status Usulan */}
                        <td className="py-3.5 px-3.5 text-center">
                          {renderStatusUsulanBadge(p.statusUsulan, p.status)}
                        </td>

                        {/* Status Pelaksanaan */}
                        <td className="py-3.5 px-3.5 text-center">
                          {renderStatusPelaksanaanBadge(p.statusPelaksanaan, p.status)}
                        </td>

                        {/* Status Penilaian */}
                        <td className="py-3.5 px-3.5 text-center">
                          {renderStatusPenilaianBadge(p.statusPenilaian, p.skorPenilaian, p.predikat)}
                        </td>

                        {/* Aksi Buttons */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {statusPenilaian === "SEDANG_DINILAI" ? (
                              <button
                                onClick={() => handleOpenAssessModal(p)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
                                title="Lanjutkan Pengisian Nilai"
                              >
                                <Edit3 size={12} />
                                <span>Lanjutkan</span>
                              </button>
                            ) : statusPenilaian === "SUDAH_DINILAI" ? (
                              <button
                                onClick={() => handleOpenAssessModal(p)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 border border-emerald-600 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                                title="Lihat / Edit Nilai"
                              >
                                <Eye size={12} />
                                <span>Lihat / Edit Nilai</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleOpenAssessModal(p)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
                                title="Beri Penilaian Baru"
                              >
                                <PlusCircle size={12} />
                                <span>Beri Nilai</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleOpenBukti(p)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                              title="Lihat Dokumentasi Kegiatan"
                            >
                              <FileText size={12} />
                              <span className="hidden xl:inline">Bukti</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginasi Bagian Bawah Tabel */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
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

      {/* MODAL POPUP: Form Penilaian Program Kerja */}
      {isAssessModalOpen && selectedProker && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-700 flex items-center justify-center text-white shrink-0 shadow-xs">
                  <Award size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 leading-tight">
                    Form Penilaian Program Kerja
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {selectedProker.kelompokName} • Kel. {selectedProker.kelurahan}
                  </p>
                </div>
              </div>

              <button
                onClick={handleCloseAssessModal}
                disabled={isSaving}
                className="w-8 h-8 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content Scrollable */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
              {/* Header Info Card */}
              <div className="p-4 bg-slate-50/90 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Users size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                      {selectedProker.kelompokName}
                    </h4>
                    <p className="text-slate-600 dark:text-slate-300 mt-0.5 text-xs">
                      {selectedProker.deskripsi}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {renderKategoriBadge(selectedProker.kategori)}
                      {renderStatusUsulanBadge(selectedProker.statusUsulan, selectedProker.status)}
                      {renderStatusPelaksanaanBadge(selectedProker.statusPelaksanaan, selectedProker.status)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                  <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/50 px-2.5 py-1 rounded-lg text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 size={13} />
                    <span className="text-xs font-bold">Pelaksanaan: Selesai</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenBukti(selectedProker)}
                    className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <FileText size={13} />
                    <span>Lihat Bukti</span>
                  </button>

                  {selectedProker.linkGoogleDrive && (
                    <a
                      href={formatGoogleDriveUrl(selectedProker.linkGoogleDrive)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="Buka Google Drive"
                    >
                      <ExternalLink size={13} />
                    </a>
                  )}
                </div>
              </div>

              {/* Info Keterikatan Presensi & Dokumentasi Foto Mobile */}
              <div className="p-3 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/40 rounded-xl flex items-start gap-2.5 text-xs text-blue-800 dark:text-blue-300">
                <AlertCircle size={15} className="shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                <span>
                  <strong>Validitas Kegiatan:</strong> Penilaian didasarkan pada presensi riil mahasiswa dan bukti foto dokumentasi yang diunggah melalui aplikasi mobile setelah memenuhi durasi minimal kegiatan.
                </span>
              </div>

              {/* Rubrik Penilaian Aspek */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2.5 flex items-center justify-between">
                  <span>Aspek Penilaian (7 Indikator Rubrik)</span>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Masukkan nilai 0 - 100
                  </span>
                </h4>

                {/* Tabel 7 Aspek Rubrik Penilaian */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 dark:bg-slate-800/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-[11px] font-bold border-b border-slate-200 dark:border-slate-800">
                        <th className="py-2.5 px-2 text-center w-8">No.</th>
                        <th className="py-2.5 px-3">Aspek Penilaian</th>
                        <th className="py-2.5 px-2 text-center w-16">Bobot</th>
                        <th className="py-2.5 px-2 text-center w-28">Nilai (0-100)</th>
                        <th className="py-2.5 px-3 text-right w-16">Skor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {calculatedRubrik.rubrik.map((r) => (
                        <tr key={r.no} className="hover:bg-slate-50/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/30">
                          <td className="py-2.5 px-2 text-center font-bold text-slate-400">
                            {r.no}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                            {r.aspek}
                          </td>
                          <td className="py-2.5 px-2 text-center font-semibold text-slate-600 dark:text-slate-300">
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
                                className="w-20 px-2 py-1 text-center font-bold text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                              />
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-800 dark:text-slate-200">
                            {r.skor.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50/90 dark:bg-slate-800/90 dark:bg-slate-800/70 border-t border-slate-200 dark:border-slate-800 text-[11px] font-extrabold text-slate-800 dark:text-slate-200">
                        <td colSpan={2} className="py-2.5 px-3 text-left">
                          Total Bobot & Nilai
                        </td>
                        <td className="py-2.5 px-2 text-center">100%</td>
                        <td></td>
                        <td className="py-2.5 px-3 text-right text-emerald-700 dark:text-emerald-400 text-xs">
                          {calculatedRubrik.totalScore.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Summary Box Nilai Akhir & Predikat */}
              <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/50 rounded-xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0">
                    <Award size={22} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
                      Nilai Akhir
                    </span>
                    <span className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                      {calculatedRubrik.totalScore.toFixed(2)}
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
                  Catatan Evaluasi / Rekomendasi DPL
                </label>
                <textarea
                  rows={3}
                  placeholder="Tuliskan evaluasi, feedback, atau rekomendasi perbaikan program kerja ini..."
                  value={catatanDpl}
                  onChange={(e) => setCatatanDpl(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <button
                type="button"
                onClick={handleResetForm}
                disabled={isSaving}
                className="px-3.5 py-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                Reset Nilai
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCloseAssessModal}
                  disabled={isSaving}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={handleSimpanNilai}
                  disabled={isSaving}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} />
                      <span>Simpan Penilaian</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Bukti Kegiatan & Dokumentasi (z-[60] to open over assessment popup if triggered) */}
      {isBuktiModalOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col max-h-[88vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
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
                className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
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
                  <span className="truncate">
                    {selectedProker?.linkGoogleDrive
                      ? "Tautan Google Drive Dokumentasi & Laporan Proker"
                      : "Belum ada link Google Drive terlampir pada proker ini"}
                  </span>
                </div>

                {selectedProker?.linkGoogleDrive && (
                  <a
                    href={formatGoogleDriveUrl(selectedProker.linkGoogleDrive)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                  >
                    <span>Buka Drive</span>
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>

              {/* Activity Attendance & Photos Section */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <ImageIcon size={14} className="text-emerald-600 dark:text-emerald-400" />
                    <span>Dokumentasi Presensi & Aktivitas Lapangan Kelompok</span>
                  </h4>

                  {/* Tabs Filter */}
                  {buktiData?.attendances && buktiData.attendances.length > 0 && (
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[11px] font-semibold">
                      <button
                        type="button"
                        onClick={() => setBuktiFilterTab("ALL")}
                        className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                          buktiFilterTab === "ALL"
                            ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                        }`}
                      >
                        Semua ({buktiData.attendances.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setBuktiFilterTab("FOTO")}
                        className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                          buktiFilterTab === "FOTO"
                            ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                        }`}
                      >
                        Foto & Logbook ({buktiData.attendances.filter((a) => !!a.photoUrl && a.photoUrl.trim() !== "" && a.photoUrl !== "null").length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setBuktiFilterTab("PRESENSI")}
                        className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                          buktiFilterTab === "PRESENSI"
                            ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                        }`}
                      >
                        Presensi ({buktiData.attendances.filter((a) => !a.photoUrl || a.photoUrl.trim() === "" || a.photoUrl === "null").length})
                      </button>
                    </div>
                  )}
                </div>

                {loadingBukti ? (
                  <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                    <Loader2 size={24} className="animate-spin text-emerald-600" />
                    <span className="text-xs font-medium">Memuat dokumentasi foto kegiatan...</span>
                  </div>
                ) : !buktiData?.attendances || buktiData.attendances.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800/60 dark:border-slate-800">
                    <AlertCircle size={24} className="mx-auto mb-1.5 text-slate-300" />
                    <p className="text-xs">Belum ada foto dokumentasi atau presensi dari kelompok ini.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Grid Foto Dokumentasi & Logbook */}
                    {buktiData.attendances
                      .filter((att) => {
                        const hasPhoto = !!att.photoUrl && att.photoUrl.trim() !== "" && att.photoUrl !== "null";
                        if (buktiFilterTab === "FOTO") return hasPhoto;
                        if (buktiFilterTab === "PRESENSI") return false;
                        return hasPhoto;
                      })
                      .length > 0 && (
                      <div>
                        {buktiFilterTab === "ALL" && (
                          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                            <Camera size={13} />
                            <span>Foto Dokumentasi & Logbook Kegiatan</span>
                          </div>
                        )}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {buktiData.attendances
                            .filter((att) => {
                              const hasPhoto = !!att.photoUrl && att.photoUrl.trim() !== "" && att.photoUrl !== "null";
                              if (buktiFilterTab === "FOTO") return hasPhoto;
                              if (buktiFilterTab === "PRESENSI") return false;
                              return hasPhoto;
                            })
                            .map((att) => {
                              const fullPhotoUrl = getMediaPhotoUrl(att.photoUrl);
                              const isFailed = failedImageIds[att.id];

                              return (
                                <div
                                  key={att.id}
                                  className="group border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-800/80 shadow-2xs hover:shadow-md transition-all flex flex-col"
                                >
                                  <div className="aspect-4/3 bg-slate-100 dark:bg-slate-700/60 relative overflow-hidden">
                                    {fullPhotoUrl && !isFailed ? (
                                      <div
                                        className="w-full h-full relative cursor-pointer group/img"
                                        onClick={() => setPreviewImageUrl(fullPhotoUrl)}
                                      >
                                        <img
                                          src={fullPhotoUrl}
                                          alt={att.activityTitle}
                                          onError={() => setFailedImageIds((prev) => ({ ...prev, [att.id]: true }))}
                                          className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                                        />
                                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white gap-1.5 text-xs font-semibold backdrop-blur-2xs">
                                          <ZoomIn size={16} />
                                          <span>Lihat Foto</span>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-slate-50 dark:bg-slate-800 text-slate-400">
                                        <Camera size={24} className="mb-1 text-slate-300 dark:text-slate-600" />
                                        <span className="text-[10px] font-medium text-slate-500">
                                          Foto Dokumentasi
                                        </span>
                                      </div>
                                    )}

                                    {/* Badge Tipe di Sudut Atas */}
                                    <div className="absolute top-2 left-2 pointer-events-none">
                                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900/70 text-white backdrop-blur-xs">
                                        {att.type === "LOGBOOK"
                                          ? "Logbook"
                                          : att.type === "LAPOR_PEMANFAATAN"
                                          ? "Pemanfaatan"
                                          : att.type === "CATAT_PEMANFAATAN"
                                          ? "Catat Hasil"
                                          : "Dokumentasi"}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="p-2.5 text-[11px] flex-1 flex flex-col justify-between">
                                    <div>
                                      <div className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1" title={att.activityTitle}>
                                        {att.activityTitle}
                                      </div>
                                      {att.description && (
                                        <div className="text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5" title={att.description}>
                                          {att.description}
                                        </div>
                                      )}
                                    </div>

                                    <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                                      <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[110px]">
                                        Oleh: {att.user?.name || "Mahasiswa"}
                                      </span>
                                      <span>
                                        {new Date(att.checkIn).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* List Presensi Kehadiran Lapangan */}
                    {buktiData.attendances
                      .filter((att) => {
                        const hasNoPhoto = !att.photoUrl || att.photoUrl.trim() === "" || att.photoUrl === "null";
                        if (buktiFilterTab === "PRESENSI") return true;
                        if (buktiFilterTab === "FOTO") return false;
                        return hasNoPhoto;
                      })
                      .length > 0 && (
                      <div>
                        {buktiFilterTab === "ALL" && (
                          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1 pt-2">
                            <Clock size={13} />
                            <span>Presensi Kehadiran & Aktivitas Lapangan</span>
                          </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {buktiData.attendances
                            .filter((att) => {
                              const hasNoPhoto = !att.photoUrl || att.photoUrl.trim() === "" || att.photoUrl === "null";
                              if (buktiFilterTab === "PRESENSI") return true;
                              if (buktiFilterTab === "FOTO") return false;
                              return hasNoPhoto;
                            })
                            .map((att) => (
                              <div
                                key={att.id}
                                className="border border-slate-200/90 dark:border-slate-800 rounded-xl p-3 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition-colors flex items-start gap-3"
                              >
                                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                                  <CheckCircle2 size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">
                                      {att.activityTitle}
                                    </div>
                                    <span className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                                      Hadir
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                    Oleh: <strong className="text-slate-700 dark:text-slate-300">{att.user?.name || "Mahasiswa"}</strong>
                                    {att.description ? ` • ${att.description}` : ""}
                                  </div>
                                  <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
                                    <Clock size={11} />
                                    <span>
                                      {new Date(att.checkIn).toLocaleDateString("id-ID", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-slate-50/50 dark:bg-slate-800/40">
              <button
                type="button"
                onClick={() => setIsBuktiModalOpen(false)}
                className="px-4 py-1.5 bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LIGHTBOX: Preview Zoom Foto */}
      {previewImageUrl && (
        <div
          className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 bg-slate-900/90 flex items-center justify-between border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <ImageIcon size={14} className="text-emerald-400" />
                <span>Dokumentasi Foto Kegiatan</span>
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={previewImageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  <ExternalLink size={12} />
                  <span>Buka Gambar Asli</span>
                </a>
                <button
                  onClick={() => setPreviewImageUrl(null)}
                  className="w-7 h-7 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="p-2 overflow-auto max-h-[80vh] flex items-center justify-center bg-black/40">
              <img
                src={previewImageUrl}
                alt="Dokumentasi Kegiatan"
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PenilaianProkerPage;
