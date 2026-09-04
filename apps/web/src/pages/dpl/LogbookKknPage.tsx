/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Modul Logbook & Supervisi Lapangan KKN Mahasiswa (DPL & Admin)
 * Halaman Mandiri Khusus Log Aktivitas Mahasiswa:
 * 1. Rekap Log Aktivitas Kelompok Mahasiswa (Tabel Full-Width 12 Kolom + Popup Modal Detail & Validasi DPL)
 * 2. Standardisasi Satuan Waktu Durasi 'Jam'
 * 3. Validasi Individual DPL melalui Modal Tinjau
 */

import React, { useEffect, useState, useMemo } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import {
  BookOpen,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Search,
  Download,
  FileSpreadsheet,
  Eye,
  RefreshCw,
  Users,
  ChevronRight,
  ChevronLeft,
  Settings,
  Smartphone,
  X,
  CheckCheck,
  CheckSquare,
  Square,
  Trash2,
  Target,
  Building2,
  MapPin,
  ExternalLink,
  FileText,
  Sparkles,
  ListChecks,
  RotateCcw,
} from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import api from "../../services/api";
import {
  logbookApiService,
  type LogbookMahasiswaItem,
} from "../../services/logbookService";
import { dplService, type GroupSummary } from "../../services/dplService";
import { sortKelompokList, sortChronologicalList } from "../../utils/sortUtils";
import { resolveImageUrl } from "../../utils/imageUrl";

// Helper Format Tanggal
const formatDateShort = (dateStr: string): string => {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
};

const formatDateFull = (dateStr: string): string => {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return dateStr;
  }
};

// Helper Format Tanggal + Jam Menit — untuk kolom "Waktu Diinput" (createdAt)
const formatDateTime = (dateStr: string): { date: string; time: string } => {
  if (!dateStr) return { date: "-", time: "" };
  try {
    const d = new Date(dateStr);
    const date = d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
    const time = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false });
    return { date, time };
  } catch {
    return { date: dateStr, time: "" };
  }
};

// Helper Durasi Waktu dengan Satuan 'Jam'
const formatDuration = (waktuMulai?: string | null, waktuSelesai?: string | null): { short: string; long: string } => {
  if (!waktuMulai || waktuMulai === "-") return { short: "2 jam", long: "Durasi 2 jam" };
  if (!waktuSelesai || waktuSelesai === "-") return { short: "1 jam", long: "Durasi 1 jam" };

  try {
    const [startH, startM] = waktuMulai.replace(".", ":").split(":").map(Number);
    const [endH, endM] = waktuSelesai.replace(".", ":").split(":").map(Number);
    if (!isNaN(startH) && !isNaN(endH)) {
      const diffMins = Math.max(30, (endH * 60 + (endM || 0)) - (startH * 60 + (startM || 0)));
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      if (hours > 0 && mins > 0) {
        return { short: `${hours} jam ${mins} menit`, long: `Durasi ${hours} jam ${mins} menit` };
      } else if (hours > 0) {
        return { short: `${hours} jam`, long: `Durasi ${hours} jam` };
      } else {
        return { short: `${mins} menit`, long: `Durasi ${mins} menit` };
      }
    }
  } catch {
    // fallback
  }
  return { short: "2 jam", long: "Durasi 2 jam" };
};

// Helper Kategori Aktivitas
const resolveKategori = (item: LogbookMahasiswaItem): string => {
  if (item.programKerjaKategori) return item.programKerjaKategori;
  const desc = (item.deskripsi || "").toLowerCase();
  if (desc.includes("pilah") || desc.includes("pemilahan")) return "Pemilahan";
  if (desc.includes("angkut") || desc.includes("pengangkutan")) return "Pengangkutan";
  if (desc.includes("kompos") || desc.includes("olah") || desc.includes("pengolahan") || desc.includes("maggot")) return "Pengolahan";
  if (desc.includes("poc") || desc.includes("manfaat") || desc.includes("pemanfaatan") || desc.includes("kebun")) return "Pemanfaatan";
  if (desc.includes("sosialisasi") || desc.includes("edukasi") || desc.includes("penyuluhan")) return "Sosialisasi";
  if (desc.includes("survei") || desc.includes("data") || desc.includes("pendataan")) return "Pendataan";
  return "Aktivitas KKN";
};

// Helper Output / Capaian Kegiatan
const resolveHasilOutput = (item: LogbookMahasiswaItem): string => {
  if ((item as any).hasilOutput) return (item as any).hasilOutput;
  if ((item as any).ringkasanImpak) return (item as any).ringkasanImpak;

  const desc = (item?.deskripsi || "").toLowerCase();
  if (desc.includes("rumah") || desc.includes("kg")) {
    const rawDesc = item?.deskripsi || "";
    const rumahMatch = rawDesc.match(/(\d+)\s*(rumah|kk|warga)/i);
    const kgMatch = rawDesc.match(/(\d+)\s*(kg|kilogram)/i);
    if (rumahMatch && kgMatch) {
      return `${rumahMatch[1]} rumah binaan • ${kgMatch[1]} kg sampah terkelola`;
    }
    if (rumahMatch) return `${rumahMatch[1]} rumah binaan`;
    if (kgMatch) return `${kgMatch[1]} kg sampah terkelola`;
  }

  const kat = resolveKategori(item);
  if (kat !== "Aktivitas KKN") return `Kegiatan ${kat} telah dilaksanakan`;
  return "Kegiatan kelompok terlaksana sesuai target program kerja";
};

/**
 * Helper untuk mengurai Program Kerja menjadi judul tebal, deskripsi, kategori, status & link
 */
interface ParsedProkerInfo {
  title: string;
  description: string;
  kategori: string;
  statusPelaksanaan: string;
  linkGoogleDrive?: string | null;
}

const parseProkerInfo = (item: LogbookMahasiswaItem): ParsedProkerInfo => {
  const rawDesc = item.programKerja?.deskripsi || item.programKerjaDeskripsi || "";
  const kategori = item.programKerja?.kategori || item.programKerjaKategori || resolveKategori(item);
  const statusPelaksanaan =
    item.programKerja?.statusPelaksanaan ||
    item.programKerja?.status ||
    "SEDANG_BERLANGSUNG";
  const linkGoogleDrive = item.programKerja?.linkGoogleDrive || null;

  if (!rawDesc || !rawDesc.trim()) {
    return {
      title: `Program ${kategori} Berseka`,
      description: `Program kerja ${kategori.toLowerCase()} kelompok mahasiswa KKN di wilayah ${item.kelurahan || "binaan"}.`,
      kategori,
      statusPelaksanaan,
      linkGoogleDrive,
    };
  }

  // 1. Cek pola **Judul Program**: Deskripsi... atau **Judul Program** - Deskripsi...
  const boldPrefixMatch = rawDesc.match(/^\s*\*\*([^*]+)\*\*(?:\s*[:\-–—]\s*|\s*\n\s*|\s+)([\s\S]*)$/);
  if (boldPrefixMatch) {
    const title = boldPrefixMatch[1].trim();
    const description = boldPrefixMatch[2].trim();
    return {
      title,
      description: description || `Program kegiatan ${title} untuk mendukung kebersihan dan kesehatan lingkungan.`,
      kategori,
      statusPelaksanaan,
      linkGoogleDrive,
    };
  }

  // 2. Cek apakah seluruh string berada di dalam **...**
  const fullBoldMatch = rawDesc.match(/^\s*\*\*([^*]+)\*\*\s*$/);
  if (fullBoldMatch) {
    return {
      title: fullBoldMatch[1].trim(),
      description: `Program kerja ${kategori} kelompok mahasiswa KKN.`,
      kategori,
      statusPelaksanaan,
      linkGoogleDrive,
    };
  }

  // 3. Cek pemisah "Judul : Deskripsi" atau "Judul - Deskripsi"
  const separatorMatch = rawDesc.match(/^([^:\n\-–—]{3,50})[:\-–—]\s+([\s\S]+)$/);
  if (separatorMatch) {
    return {
      title: separatorMatch[1].trim().replace(/^\*+|\*+$/g, ""),
      description: separatorMatch[2].trim(),
      kategori,
      statusPelaksanaan,
      linkGoogleDrive,
    };
  }

  // 4. Jika teks pendek (< 60 karakter) dan tidak ada baris baru, anggap judul
  if (rawDesc.length <= 60 && !rawDesc.includes("\n")) {
    return {
      title: rawDesc.replace(/\*\*/g, "").trim(),
      description: `Program kerja ${kategori} kelompok mahasiswa KKN.`,
      kategori,
      statusPelaksanaan,
      linkGoogleDrive,
    };
  }

  // 5. Fallback teks panjang
  return {
    title: `Program ${kategori} Berseka`,
    description: rawDesc.replace(/\*\*/g, "").trim(),
    kategori,
    statusPelaksanaan,
    linkGoogleDrive,
  };
};

/**
 * Helper untuk merender teks dengan format markdown sederhana (**bold**)
 */
const renderFormattedText = (text: string) => {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
          return (
            <strong key={i} className="font-bold text-slate-900 dark:text-slate-100">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      })}
    </>
  );
};

/**
 * Helper untuk mengurai data fasilitas kebersihan terkait
 */
const resolveFasilitasDetails = (item: LogbookMahasiswaItem) => {
  const fObj = item.fasilitas;
  const fNama =
    fObj?.nama ||
    item.fasilitasNama ||
    (item.fasilitasId ? `Fasilitas #${item.fasilitasId.slice(0, 8)}` : null);

  if (!fNama && !fObj && !item.fasilitasId) return null;

  const jenisRaw = (fObj?.jenis || "").toUpperCase();
  let jenisLabel = "Fasilitas Kebersihan";
  let jenisBadgeClass =
    "bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800";

  if (jenisRaw.includes("BANK_SAMPAH") || jenisRaw.includes("BANK SAMPAH")) {
    jenisLabel = "Bank Sampah";
    jenisBadgeClass =
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
  } else if (jenisRaw.includes("TPS3R") || jenisRaw.includes("TPS 3R")) {
    jenisLabel = "TPS3R";
    jenisBadgeClass =
      "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800";
  } else if (jenisRaw.includes("MAGGOT") || jenisRaw.includes("RUMAH_MAGGOT")) {
    jenisLabel = "Rumah Maggot";
    jenisBadgeClass =
      "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800";
  } else if (jenisRaw.includes("KOMPOS") || jenisRaw.includes("KOMPOSTER") || jenisRaw.includes("LOSEDA")) {
    jenisLabel = "Komposter / Loseda";
    jenisBadgeClass =
      "bg-lime-50 text-lime-700 dark:bg-lime-950/60 dark:text-lime-300 border-lime-200 dark:border-lime-800";
  } else if (fObj?.jenis) {
    jenisLabel = fObj.jenis.replace(/_/g, " ");
  }

  return {
    nama: fNama || "Fasilitas Kebersihan",
    jenis: jenisLabel,
    jenisBadgeClass,
    alamat: fObj?.alamat || null,
    latitude: fObj?.latitude || null,
    longitude: fObj?.longitude || null,
  };
};

/**
 * Render Badge Kategori Program Kerja dengan warna tematik
 */
const renderProkerCategoryBadge = (kategori: string) => {
  const kat = (kategori || "").toLowerCase();
  let badgeClass =
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
  if (kat.includes("pengolahan") || kat.includes("organik") || kat.includes("maggot")) {
    badgeClass =
      "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800";
  } else if (kat.includes("pemanfaatan") || kat.includes("anorganik")) {
    badgeClass =
      "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800";
  } else if (kat.includes("sosialisasi") || kat.includes("edukasi") || kat.includes("penyuluhan")) {
    badgeClass =
      "bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800";
  } else if (kat.includes("tata kelola") || kat.includes("pendataan") || kat.includes("survei")) {
    badgeClass =
      "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800";
  } else if (kat.includes("fasilitas") || kat.includes("infrastruktur")) {
    badgeClass =
      "bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800";
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badgeClass}`}>
      {kategori}
    </span>
  );
};

/**
 * Render Badge Status Pelaksanaan Program Kerja
 */
const renderProkerStatusBadge = (status: string) => {
  const st = (status || "").toUpperCase();
  if (st === "SELESAI" || st === "COMPLETED" || st === "TERLAKSANA") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
        <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
        Selesai
      </span>
    );
  }
  if (st === "BELUM_MULAI" || st === "USULAN" || st === "RENCANA") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-750 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
        <Clock className="w-3 h-3 text-slate-500" />
        Direncanakan
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
      <Clock className="w-3 h-3 text-blue-600 dark:text-blue-400" />
      Sedang Berlangsung
    </span>
  );
};

export const LogbookKknPage: React.FC = () => {
  const { user } = useAuthStore();
  const userRole = String(user?.peran || (user as any)?.role || "").toUpperCase();
  const isDeveloper = ["DEVELOPER", "SUPER_USER", "ADMIN_DLH"].includes(userRole);
  const isPimpinan = ["PEMIMPIN", "PIMPINAN", "CAMAT", "LURAH", "KEPALA_DESA", "REKTOR"].includes(userRole);

  const [loading, setLoading] = useState(true);

  // State Data
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedKategori, setSelectedKategori] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [startDateFilter, setStartDateFilter] = useState<string>("");
  const [endDateFilter, setEndDateFilter] = useState<string>("");

  const [logbooks, setLogbooks] = useState<LogbookMahasiswaItem[]>([]);
  const [toleranceDays, setToleranceDays] = useState<number>(1);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modal Detail & Validasi Mahasiswa State
  const [selectedItemDetail, setSelectedItemDetail] = useState<LogbookMahasiswaItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [validationCatatan, setValidationCatatan] = useState("");
  const [isSubmittingQuickVerif, setIsSubmittingQuickVerif] = useState(false);

  // 2-Step Deletion Modal State (Validasi 2 Langkah Hapus Logbook)
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetItem, setDeleteTargetItem] = useState<LogbookMahasiswaItem | null>(null);
  const [deleteConfirmChecked, setDeleteConfirmChecked] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [isDeletingLogbook, setIsDeletingLogbook] = useState(false);

  // Multi-Select & Validasi Semua (Batch Validation) State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchCatatan, setBatchCatatan] = useState("");
  const [isSubmittingBatch, setIsSubmittingBatch] = useState(false);

  // Lightbox Preview Foto
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>("");

  // Config Toleransi Modal (Developer)
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configInputDays, setConfigInputDays] = useState<number>(1);
  const [isSubmittingConfig, setIsSubmittingConfig] = useState(false);

  // Status Pengerjaan Update State (DPL)
  const [statusPelaksanaanTarget, setStatusPelaksanaanTarget] = useState<{ logbookId: string; programKerjaId: string; currentStatus: string } | null>(null);
  const [newStatusPelaksanaan, setNewStatusPelaksanaan] = useState<string>("SEDANG_BERLANGSUNG");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Load Data
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Ambil daftar kelompok
      const groupData = await dplService.getGroupSummary().catch(() => []);
      setGroups(sortKelompokList(groupData, (g) => g.name || ""));

      // 2. Ambil logbook mahasiswa
      const mhsData = await logbookApiService.getMahasiswaLogbooks({
        groupId: selectedGroup !== "ALL" ? selectedGroup : undefined,
        statusApproval: selectedStatus !== "ALL" ? selectedStatus : undefined,
        search: searchQuery || undefined,
      });
      setLogbooks(mhsData);

      // 3. Ambil toleransi config
      const conf = await logbookApiService.getToleranceConfig().catch(() => ({ toleranceDays: 1 }));
      setToleranceDays(conf.toleranceDays);
      setConfigInputDays(conf.toleranceDays);
    } catch (err: any) {
      console.error("Error loading logbook data:", err);
      toast.error("Gagal memuat data logbook: " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedGroup, selectedStatus]);

  // Sync modal catatan when selected item changes
  useEffect(() => {
    if (selectedItemDetail) {
      setValidationCatatan(selectedItemDetail.catatanDpl || "");
    } else {
      setValidationCatatan("");
    }
  }, [selectedItemDetail?.id]);

  // Filtered logbooks by category & search & date range with Chronological Sorting (Newest First)
  const filteredLogbooks = useMemo(() => {
    const filtered = logbooks.filter((item) => {
      if (selectedKategori !== "ALL") {
        const itemKat = resolveKategori(item);
        if (itemKat !== selectedKategori) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (item.penulisNama || "").toLowerCase().includes(q);
        const matchPlace = (item.tempat || "").toLowerCase().includes(q);
        const matchDesc = (item.deskripsi || "").toLowerCase().includes(q);
        const matchGroup = (item.kelompokNama || "").toLowerCase().includes(q);
        if (!matchName && !matchPlace && !matchDesc && !matchGroup) return false;
      }
      if (startDateFilter) {
        const start = new Date(startDateFilter);
        start.setHours(0, 0, 0, 0);
        const itemDate = new Date(item.tanggalKegiatan || item.createdAt);
        if (itemDate < start) return false;
      }
      if (endDateFilter) {
        const end = new Date(endDateFilter);
        end.setHours(23, 59, 59, 999);
        const itemDate = new Date(item.tanggalKegiatan || item.createdAt);
        if (itemDate > end) return false;
      }
      return true;
    });

    return sortChronologicalList(filtered, (item) => item.tanggalKegiatan || item.createdAt, "desc");
  }, [logbooks, selectedKategori, searchQuery, startDateFilter, endDateFilter]);

  // Statistics KPI
  const stats = useMemo(() => {
    const total = logbooks.length;
    const pendingDpl = logbooks.filter((l) => l.statusApproval === "MENUNGGU_VERIFIKASI_DPL").length;
    const approved = logbooks.filter((l) => l.statusApproval === "DISETUJUI_DPL").length;
    const revisi = logbooks.filter(
      (l) => l.statusApproval === "PERLU_REVISI_DPL" || l.statusApproval === "DITOLAK_KETUA"
    ).length;
    return { total, pendingDpl, approved, revisi };
  }, [logbooks]);

  // Target Validasi Serentak / Batch Approval
  const pendingLogbooks = useMemo(() => {
    return filteredLogbooks.filter((item) => item.statusApproval === "MENUNGGU_VERIFIKASI_DPL");
  }, [filteredLogbooks]);

  const selectedLogbooks = useMemo(() => {
    return filteredLogbooks.filter((item) => selectedIds.includes(item.id));
  }, [filteredLogbooks, selectedIds]);

  const selectedPendingLogbooks = useMemo(() => {
    return filteredLogbooks.filter(
      (item) => selectedIds.includes(item.id) && item.statusApproval === "MENUNGGU_VERIFIKASI_DPL"
    );
  }, [filteredLogbooks, selectedIds]);

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filteredLogbooks.length / pageSize));
  const paginatedLogbooks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogbooks.slice(start, start + pageSize);
  }, [filteredLogbooks, currentPage, pageSize]);

  // Pending logbooks on current active page
  const paginatedPendingLogbooks = useMemo(() => {
    return paginatedLogbooks.filter((item) => item.statusApproval === "MENUNGGU_VERIFIKASI_DPL");
  }, [paginatedLogbooks]);

  // Checkbox Multi-Selection Helpers (Smart Select: memprioritaskan item yang butuh validasi)
  const isAllCurrentPageSelected = useMemo(() => {
    if (paginatedLogbooks.length === 0) return false;
    if (paginatedPendingLogbooks.length > 0) {
      return paginatedPendingLogbooks.every((item) => selectedIds.includes(item.id));
    }
    return paginatedLogbooks.every((item) => selectedIds.includes(item.id));
  }, [paginatedLogbooks, paginatedPendingLogbooks, selectedIds]);

  const handleToggleSelectAllPage = () => {
    const targetList = paginatedPendingLogbooks.length > 0 ? paginatedPendingLogbooks : paginatedLogbooks;
    if (isAllCurrentPageSelected) {
      const pageIds = new Set(targetList.map((p) => p.id));
      setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)));
    } else {
      const pageIds = targetList.map((p) => p.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Validasi Filter & Gating Aturan Ekspor
  const isDateRangePartial = useMemo(() => {
    return (startDateFilter && !endDateFilter) || (!startDateFilter && endDateFilter);
  }, [startDateFilter, endDateFilter]);

  const isDateRangeInvalid = useMemo(() => {
    if (!startDateFilter || !endDateFilter) return false;
    return new Date(startDateFilter) > new Date(endDateFilter);
  }, [startDateFilter, endDateFilter]);

  const hasExplicitFilter = useMemo(() => {
    const hasCategory = selectedKategori !== "ALL";
    const hasGroup = selectedGroup !== "ALL";
    const hasStatus = selectedStatus !== "ALL";
    const hasSearch = searchQuery.trim().length > 0;
    const hasCompleteDate = Boolean(startDateFilter && endDateFilter && !isDateRangeInvalid);
    return hasCompleteDate || hasCategory || hasGroup || hasStatus || hasSearch;
  }, [selectedKategori, selectedGroup, selectedStatus, searchQuery, startDateFilter, endDateFilter, isDateRangeInvalid]);

  const isExportReady = useMemo(() => {
    if (!startDateFilter || !endDateFilter || isDateRangeInvalid) return false;
    return filteredLogbooks.length > 0;
  }, [startDateFilter, endDateFilter, isDateRangeInvalid, filteredLogbooks.length]);

  const exportTooltipMessage = useMemo(() => {
    if (!startDateFilter || !endDateFilter) {
      return "Pilih tanggal awal dan tanggal akhir terlebih dahulu untuk mengekspor.";
    }
    if (isDateRangeInvalid) {
      return "Tanggal 'Dari' tidak boleh melebihi tanggal 'Sampai'.";
    }
    if (filteredLogbooks.length === 0) {
      return "Tidak ada data logbook yang sesuai filter untuk diekspor.";
    }
    return `Ekspor ${filteredLogbooks.length} baris data logbook terfilter ke XLSX`;
  }, [startDateFilter, endDateFilter, isDateRangeInvalid, filteredLogbooks.length]);

  // Open Detail Modal
  const handleOpenDetailModal = (item: LogbookMahasiswaItem) => {
    setSelectedItemDetail(item);
    setIsDetailModalOpen(true);
  };

  // Batch Verification Handler (Validasi Semua / Validasi Terpilih)
  const handleBatchVerifikasi = async () => {
    const targets = selectedIds.length > 0 ? selectedPendingLogbooks : pendingLogbooks;
    if (targets.length === 0) {
      toast.error("Tidak ada aktivitas berstatus Menunggu Validasi untuk divalidasi.");
      return;
    }
    setIsSubmittingBatch(true);
    try {
      const targetIds = targets.map((t) => t.id);
      const res = await logbookApiService.batchVerifikasiByDpl(
        targetIds,
        "APPROVE",
        batchCatatan.trim() || undefined
      );
      const successCount = Array.isArray(res?.data)
        ? res.data.filter((r: any) => r.success).length
        : targetIds.length;

      toast.success(
        `Berhasil memvalidasi ${successCount} aktivitas logbook kelompok sekaligus! 🎉`
      );
      setIsBatchModalOpen(false);
      setSelectedIds([]);
      await fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Gagal memproses validasi serentak");
    } finally {
      setIsSubmittingBatch(false);
    }
  };

  // Quick Verification from Modal
  const handleVerifikasiDpl = async (action: "APPROVE" | "REVISI") => {
    if (!selectedItemDetail) {
      toast.error("Pilih salah satu logbook terlebih dahulu");
      return;
    }
    setIsSubmittingQuickVerif(true);
    try {
      await logbookApiService.verifikasiByDpl(
        selectedItemDetail.id,
        action,
        validationCatatan.trim() || undefined
      );
      toast.success(
        action === "APPROVE"
          ? "Aktivitas berhasil divalidasi dan disetujui DPL."
          : "Catatan perbaikan berhasil dikirim ke mahasiswa."
      );
      setIsDetailModalOpen(false);
      await fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Gagal memproses validasi");
    } finally {
      setIsSubmittingQuickVerif(false);
    }
  };

  // Open Delete Modal with 2-Step Verification
  const handleOpenDeleteModal = (item: LogbookMahasiswaItem) => {
    setDeleteTargetItem(item);
    setDeleteConfirmChecked(false);
    setDeleteConfirmationText("");
    setShowDeleteModal(true);
  };

  // Execute Confirmed Delete Logbook Activity (Validasi 2 Langkah)
  const handleConfirmDeleteLogbook = async () => {
    if (!deleteTargetItem) return;
    if (!deleteConfirmChecked || deleteConfirmationText.trim().toUpperCase() !== "HAPUS") {
      toast.error("Lengkapi 2 langkah validasi: centang konfirmasi dan ketik 'HAPUS'.");
      return;
    }
    setIsDeletingLogbook(true);
    try {
      await logbookApiService.deleteMahasiswaLogbook(deleteTargetItem.id);
      toast.success("Catatan logbook aktivitas berhasil dihapus secara permanen.");
      setShowDeleteModal(false);
      if (selectedItemDetail?.id === deleteTargetItem.id) {
        setIsDetailModalOpen(false);
        setSelectedItemDetail(null);
      }
      setDeleteTargetItem(null);
      await fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Gagal menghapus logbook");
    } finally {
      setIsDeletingLogbook(false);
    }
  };

  // Submit Update Toleransi (Developer)
  const handleSaveToleranceConfig = async () => {
    if (configInputDays < 0) {
      toast.error("Batas toleransi minimal 0 hari");
      return;
    }
    setIsSubmittingConfig(true);
    try {
      await logbookApiService.updateToleranceConfig(configInputDays);
      toast.success(`Toleransi berhasil diubah menjadi ${configInputDays} hari sebelumnya (H-${configInputDays}).`);
      setToleranceDays(configInputDays);
      setShowConfigModal(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Gagal mengubah toleransi");
    } finally {
      setIsSubmittingConfig(false);
    }
  };

  // Handler Update Status Pengerjaan Program Kerja (DPL)
  const handleOpenStatusModal = (item: LogbookMahasiswaItem) => {
    const prokerInfo = parseProkerInfo(item);
    const currentStatus = prokerInfo.statusPelaksanaan || "SEDANG_BERLANGSUNG";
    const programKerjaId = item.programKerjaId || item.programKerja?.id || "";
    if (!programKerjaId) {
      toast.error("Logbook ini tidak terhubung ke Program Kerja manapun.");
      return;
    }
    setStatusPelaksanaanTarget({ logbookId: item.id, programKerjaId, currentStatus });
    setNewStatusPelaksanaan(currentStatus);
  };

  const handleSaveStatusPelaksanaan = async () => {
    if (!statusPelaksanaanTarget) return;
    setIsUpdatingStatus(true);
    try {
      await api.patch(`/dpl/program-kerja/${statusPelaksanaanTarget.programKerjaId}/decision`, {
        statusPelaksanaan: newStatusPelaksanaan,
      });
      const label =
        newStatusPelaksanaan === "SELESAI"
          ? "Selesai"
          : newStatusPelaksanaan === "BELUM_MULAI"
          ? "Belum Mulai"
          : "Sedang Berlangsung";
      toast.success(`Status pengerjaan berhasil diubah menjadi: ${label}`);
      setStatusPelaksanaanTarget(null);
      await fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Gagal mengubah status pengerjaan");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Export XLSX (Mendukung Ekspor Data Terfilter atau Ekspor Data Terpilih)
  const handleExportXlsx = (customItems?: LogbookMahasiswaItem[], labelPrefix?: string) => {
    const isCustom = Boolean(customItems && customItems.length > 0);
    if (!isCustom && (!startDateFilter || !endDateFilter)) {
      toast.error("Pilih tanggal awal dan tanggal akhir terlebih dahulu sebelum mengekspor.");
      return;
    }
    const itemsToExport = customItems || filteredLogbooks;
    if (itemsToExport.length === 0) {
      toast.error("Tidak ada data logbook untuk diekspor");
      return;
    }
    const headers = [
      "No",
      "Tanggal Kegiatan",
      "Tgl Diinput",
      "Jam Diinput",
      "Waktu Mulai",
      "Waktu Selesai",
      "Kelompok",
      "Diinput Oleh",
      "NIM",
      "Kategori",
      "Tempat / Lokasi",
      "Program Kerja Terkait",
      "Fasilitas Kebersihan",
      "Uraian Aktivitas",
      "Status",
      "Catatan Validasi DPL",
    ];
    const rows = itemsToExport.map((item, index) => {
      const pInfo = parseProkerInfo(item);
      const fInfo = resolveFasilitasDetails(item);
      const prokerDisplay = pInfo.title ? `${pInfo.title}: ${pInfo.description}` : "-";
      const fasilitasDisplay = fInfo ? `${fInfo.nama} (${fInfo.jenis})` : "-";
      const inputDt = formatDateTime(item.createdAt);

      return [
        index + 1,
        item.tanggalKegiatan || "-",
        inputDt.date,
        inputDt.time ? `${inputDt.time} WIB` : "-",
        item.waktuMulai || "-",
        item.waktuSelesai || "-",
        item.kelompokNama || "-",
        item.penulisNama || "-",
        item.penulisNim || "-",
        resolveKategori(item),
        item.tempat || "-",
        prokerDisplay,
        fasilitasDisplay,
        item.deskripsi || "-",
        item.statusApproval || "-",
        item.catatanDpl || "-",
      ];
    });

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws["!cols"] = [
      { wch: 6 },
      { wch: 18 },
      { wch: 18 },
      { wch: 14 },
      { wch: 12 },
      { wch: 12 },
      { wch: 18 },
      { wch: 25 },
      { wch: 15 },
      { wch: 20 },
      { wch: 25 },
      { wch: 35 },
      { wch: 25 },
      { wch: 45 },
      { wch: 22 },
      { wch: 30 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap_Logbook");
    const filenamePrefix = labelPrefix ? `Rekap_Logbook_${labelPrefix}` : "Rekap_Logbook_Mahasiswa";
    const dateSuffix =
      startDateFilter && endDateFilter
        ? `${startDateFilter}_sd_${endDateFilter}`
        : new Date().toISOString().split("T")[0];
    XLSX.writeFile(wb, `${filenamePrefix}_${dateSuffix}.xlsx`);
    toast.success(`Data logbook (${itemsToExport.length} data) berhasil diekspor ke XLSX!`);
  };

  // Render Status Badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "DISETUJUI_DPL":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckCircle className="w-3 h-3" />
            Tervalidasi
          </span>
        );
      case "MENUNGGU_VERIFIKASI_DPL":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            <Clock className="w-3 h-3" />
            Menunggu Validasi
          </span>
        );
      case "PERLU_REVISI_DPL":
      case "DITOLAK_KETUA":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
            <XCircle className="w-3 h-3" />
            Perlu Perbaikan
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-900/60 p-4 md:p-6 lg:p-8 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* ─────────────────────────────────────────────
            1. HEADER & ACTION BUTTONS
            ───────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-emerald-600" />
              Logbook & Supervisi Mahasiswa KKN
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Pantau dan validasi aktivitas kelompok mahasiswa yang dikirim melalui aplikasi mobile
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {isDeveloper && (
              <button
                onClick={() => setShowConfigModal(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                title="Konfigurasi Batas Toleransi Hari (H-1)"
              >
                <Settings className="w-4 h-4" />
                Toleransi (H-{toleranceDays})
              </button>
            )}
          </div>
        </div>

        {/* ─────────────────────────────────────────────
            2. 4 SUMMARY STAT CARDS
            ───────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Total Log Kelompok */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Log Kelompok</p>
              <h3 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                {stats.total}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50">
              <Users className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2: Menunggu Validasi */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-amber-200/80 dark:border-amber-900/50 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Menunggu Validasi</p>
              <h3 className="text-3xl font-extrabold tracking-tight text-amber-600 dark:text-amber-300">
                {stats.pendingDpl}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3: Tervalidasi */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/50 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Tervalidasi</p>
              <h3 className="text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-300">
                {stats.approved}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>

          {/* Card 4: Perlu Perbaikan */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-rose-200/80 dark:border-rose-900/50 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-rose-700 dark:text-rose-400">Perlu Perbaikan</p>
              <h3 className="text-3xl font-extrabold tracking-tight text-rose-600 dark:text-rose-300">
                {stats.revisi}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-800">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────
            3. REKAP AKTIVITAS MAHASISWA (FULL WIDTH TABLE)
            ───────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
            
            {/* Header Table & Filters */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Rekap Aktivitas Kelompok Mahasiswa
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Daftar logbook harian yang diisi mahasiswa melalui aplikasi mobile berbasis presensi & GPS
                  </p>
                </div>
                {groups.length === 1 && (
                  <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300">
                    {groups[0].name} ({groups[0].kelurahan || "-"})
                  </span>
                )}
              </div>

              {/* Filter Controls Row */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Search Input */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Cari kelompok, nama mahasiswa, atau uraian kegiatan..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 dark:text-slate-200"
                  />
                </div>

                {/* Filter Kelompok */}
                {groups.length > 1 && (
                  <select
                    value={selectedGroup}
                    onChange={(e) => {
                      setSelectedGroup(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">Semua Kelompok</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                )}

                {/* Filter Kategori */}
                <select
                  value={selectedKategori}
                  onChange={(e) => {
                    setSelectedKategori(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">Semua Kategori</option>
                  <option value="Pemilahan">Pemilahan</option>
                  <option value="Pengangkutan">Pengangkutan</option>
                  <option value="Pengolahan">Pengolahan</option>
                  <option value="Pemanfaatan">Pemanfaatan</option>
                  <option value="Sosialisasi">Sosialisasi / Edukasi</option>
                  <option value="Pendataan">Pendataan</option>
                </select>

                {/* Filter Status */}
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="MENUNGGU_VERIFIKASI_DPL">Menunggu Validasi</option>
                  <option value="DISETUJUI_DPL">Tervalidasi</option>
                  <option value="PERLU_REVISI_DPL">Perlu Perbaikan</option>
                </select>

                {/* Date Range Inputs (Notulensi Item 12: Filter Tanggal) */}
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs shadow-2xs transition-colors ${
                    isDateRangeInvalid
                      ? "bg-rose-50/70 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700"
                      : isDateRangePartial
                      ? "bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700"
                      : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                  }`}
                  title={
                    isDateRangeInvalid
                      ? "Tanggal 'Dari' tidak boleh melebihi 'Sampai'"
                      : isDateRangePartial
                      ? "Lengkapi tanggal 'Sampai'"
                      : "Filter Rentang Tanggal Kegiatan"
                  }
                >
                  <span className="text-[10px] font-bold text-slate-400">Dari:</span>
                  <input
                    type="date"
                    value={startDateFilter}
                    onChange={(e) => {
                      setStartDateFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                  />
                </div>
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs shadow-2xs transition-colors ${
                    isDateRangeInvalid
                      ? "bg-rose-50/70 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700"
                      : isDateRangePartial
                      ? "bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700"
                      : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                  }`}
                  title={
                    isDateRangeInvalid
                      ? "Tanggal 'Sampai' harus setelah tanggal 'Dari'"
                      : isDateRangePartial
                      ? "Lengkapi rentang tanggal"
                      : "Filter Rentang Tanggal Kegiatan"
                  }
                >
                  <span className="text-[10px] font-bold text-slate-400">Sampai:</span>
                  <input
                    type="date"
                    value={endDateFilter}
                    onChange={(e) => {
                      setEndDateFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                  />
                </div>
                {(startDateFilter || endDateFilter) && (
                  <button
                    type="button"
                    onClick={() => {
                      setStartDateFilter("");
                      setEndDateFilter("");
                      setCurrentPage(1);
                    }}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 text-xs font-semibold cursor-pointer"
                    title="Reset Filter Tanggal"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Button Ekspor Standar 1 Tombol XLSX */}
                <button
                  type="button"
                  onClick={() => handleExportXlsx()}
                  disabled={!isExportReady}
                  title={exportTooltipMessage}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700/60 cursor-pointer ml-1"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Ekspor XLSX</span>
                </button>

                {/* Button Validasi Semua / Validasi Terpilih (DPL & Admin) */}
                {!isPimpinan && (
                  <button
                    type="button"
                    onClick={() => {
                      setBatchCatatan("");
                      setIsBatchModalOpen(true);
                    }}
                    disabled={selectedIds.length > 0 ? selectedPendingLogbooks.length === 0 : pendingLogbooks.length === 0}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                      (selectedIds.length > 0 ? selectedPendingLogbooks.length > 0 : pendingLogbooks.length > 0)
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95 hover:shadow-md cursor-pointer"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700 opacity-70"
                    }`}
                    title={
                      selectedIds.length > 0
                        ? selectedPendingLogbooks.length > 0
                          ? `Validasi & setujui ${selectedPendingLogbooks.length} aktivitas terpilih yang menunggu validasi`
                          : "Semua aktivitas terpilih sudah berstatus tervalidasi atau perlu perbaikan"
                        : pendingLogbooks.length > 0
                        ? `Validasi semua ${pendingLogbooks.length} aktivitas yang menunggu validasi`
                        : "Tidak ada aktivitas yang berstatus menunggu validasi"
                    }
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span>
                      {selectedIds.length > 0
                        ? selectedPendingLogbooks.length > 0
                          ? `Validasi Terpilih (${selectedPendingLogbooks.length})`
                          : `Validasi Terpilih (0 Siap)`
                        : `Validasi Semua (${pendingLogbooks.length})`}
                    </span>
                  </button>
                )}
              </div>

              {/* Banner Pilihan Multi-Select */}
              {selectedIds.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 px-3.5 py-2.5 rounded-xl text-xs">
                  <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-semibold">
                    <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{selectedIds.length} aktivitas dipilih</span>
                    {selectedPendingLogbooks.length > 0 ? (
                      <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                        • {selectedPendingLogbooks.length} siap divalidasi
                      </span>
                    ) : (
                      <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                        • (Semua yang dipilih sudah tervalidasi / perlu revisi)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Tombol Ekspor Khusus Baris Terpilih */}
                    <button
                      type="button"
                      onClick={() => handleExportXlsx(selectedLogbooks, `${selectedIds.length}_Aktivitas`)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 rounded-lg font-semibold text-xs transition cursor-pointer shadow-2xs"
                      title={`Ekspor ${selectedIds.length} data aktivitas terpilih ke format XLSX`}
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Ekspor Terpilih ({selectedIds.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedIds([])}
                      className="px-2.5 py-1 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/40 rounded-lg font-medium transition cursor-pointer"
                    >
                      Batalkan Pilihan
                    </button>

                    {!isPimpinan && selectedPendingLogbooks.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setBatchCatatan("");
                          setIsBatchModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs cursor-pointer transition text-xs"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Validasi Terpilih ({selectedPendingLogbooks.length})</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Full-Width Table Component (12 Kolom) */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/70 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold">
                    <th className="p-3.5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={isAllCurrentPageSelected}
                        onChange={handleToggleSelectAllPage}
                        title={
                          isAllCurrentPageSelected
                            ? "Batalkan pilih di halaman ini"
                            : paginatedPendingLogbooks.length > 0
                            ? `Pilih semua ${paginatedPendingLogbooks.length} aktivitas yang menunggu validasi di halaman ini`
                            : "Pilih semua baris di halaman ini"
                        }
                        className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                      />
                    </th>
                    <th className="p-3.5 whitespace-nowrap">Tgl Kegiatan</th>
                    <th className="p-3.5 whitespace-nowrap">Tgl Diinput</th>
                    <th className="p-3.5 whitespace-nowrap">Kelompok</th>
                    <th className="p-3.5 whitespace-nowrap">Pengisi Data</th>
                    <th className="p-3.5 whitespace-nowrap">Kategori</th>
                    <th className="p-3.5 min-w-[220px]">Ringkasan Aktivitas Kelompok</th>
                    <th className="p-3.5 whitespace-nowrap">Lokasi / GPS</th>
                    <th className="p-3.5 whitespace-nowrap text-center">Durasi (Jam)</th>
                    <th className="p-3.5 whitespace-nowrap text-center">Anggota</th>
                    <th className="p-3.5 whitespace-nowrap text-center">Bukti</th>
                    <th className="p-3.5 whitespace-nowrap text-center">Status</th>
                    <th className="p-3.5 whitespace-nowrap text-center">Status Pengerjaan</th>
                    <th className="p-3.5 whitespace-nowrap text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-750">
                  {loading ? (
                    <tr>
                      <td colSpan={14} className="p-12 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <RefreshCw className="w-5 h-5 animate-spin text-emerald-500" />
                          <span>Memuat rekap aktivitas kelompok mahasiswa...</span>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedLogbooks.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="p-12 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <BookOpen className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                          <p className="font-semibold text-slate-700 dark:text-slate-300">Tidak ada data aktivitas</p>
                          <p className="text-[11px] text-slate-400">
                            Ubah filter atau tunggu input logbook terbaru dari mahasiswa melalui aplikasi mobile.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedLogbooks.map((item) => {
                      const durasi = formatDuration(item.waktuMulai, item.waktuSelesai);
                      const kategori = resolveKategori(item);
                      const memberCount = item.anggotaKelompok?.length || 0;
                      const isSelected = selectedIds.includes(item.id);

                      return (
                        <tr
                          key={item.id}
                          className={`transition-colors ${
                            isSelected
                              ? "bg-emerald-50/70 dark:bg-emerald-950/30"
                              : "hover:bg-slate-50/80 dark:hover:bg-slate-750/50"
                          }`}
                        >
                          {/* 0. Checkbox Multi-Select */}
                          <td className="p-3.5 align-top text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectRow(item.id)}
                              className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                            />
                          </td>
                          {/* 1. Tgl Kegiatan */}
                          <td className="p-3.5 align-top whitespace-nowrap">
                            <div className="font-bold text-slate-800 dark:text-slate-200">
                              {formatDateShort(item.tanggalKegiatan)}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {item.waktuLengkap}
                            </div>
                          </td>

                          {/* 1b. Tgl Diinput — createdAt server timestamp */}
                          <td className="p-3.5 align-top whitespace-nowrap">
                            <div className="font-medium text-slate-700 dark:text-slate-300 text-[11px]">
                              {formatDateTime(item.createdAt).date}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {formatDateTime(item.createdAt).time} WIB
                            </div>
                          </td>

                          {/* 2. Kelompok */}
                          <td className="p-3.5 align-top whitespace-nowrap font-medium text-slate-800 dark:text-slate-200">
                            {item.kelompokNama}
                          </td>

                          {/* 3. Diinput Oleh */}
                          <td className="p-3.5 align-top whitespace-nowrap text-slate-700 dark:text-slate-300">
                            <div className="font-semibold text-slate-800 dark:text-slate-100">{item.penulisNama}</div>
                            {item.penulisNim && (
                              <div className="text-[10px] text-slate-400 font-mono">{item.penulisNim}</div>
                            )}
                          </td>

                          {/* 4. Kategori */}
                          <td className="p-3.5 align-top whitespace-nowrap">
                            <span className="inline-block px-2.5 py-1 text-[11px] font-semibold bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300">
                              {kategori}
                            </span>
                          </td>

                          {/* 5. Ringkasan Aktivitas Kelompok */}
                          <td className="p-3.5 align-top">
                            <p className="text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed" title={item.deskripsi}>
                              {item.deskripsi}
                            </p>
                          </td>

                          {/* 6. Lokasi / GPS */}
                          <td className="p-3.5 align-top whitespace-nowrap">
                            <div className="text-slate-800 dark:text-slate-200 font-medium">
                              {item.tempat}
                            </div>
                            <span className="inline-flex items-center gap-0.5 mt-0.5 px-1.5 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded">
                              GPS Terverifikasi
                            </span>
                          </td>

                          {/* 7. Durasi (Jam) */}
                          <td className="p-3.5 align-top whitespace-nowrap text-center text-slate-700 dark:text-slate-300 font-medium">
                            <span className="inline-flex items-center gap-1 font-semibold">
                              <Clock className="w-3 h-3 text-indigo-500" />
                              {durasi.short}
                            </span>
                          </td>

                          {/* 8. Anggota */}
                          <td className="p-3.5 align-top whitespace-nowrap text-center font-semibold text-slate-700 dark:text-slate-300">
                            {memberCount > 0 ? `${memberCount}/${memberCount}` : "Tim"}
                          </td>

                          {/* 9. Bukti (Thumbnail Visual & Quick Zoom) */}
                          <td className="p-3.5 align-top whitespace-nowrap text-center">
                            {item.fotoBuktiUrl ? (
                              <div className="inline-flex flex-col items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPreviewPhotoUrl(resolveImageUrl(item.fotoBuktiUrl));
                                    setPreviewTitle(`Bukti: ${item.tempat} (${formatDateShort(item.tanggalKegiatan)})`);
                                  }}
                                  className="relative group w-14 h-12 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shadow-2xs hover:shadow-md hover:scale-105 transition-all duration-150 cursor-pointer flex items-center justify-center"
                                  title="Klik untuk memperbesar foto bukti"
                                >
                                  <img
                                    src={resolveImageUrl(item.fotoBuktiUrl)}
                                    alt="Bukti Logbook"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const target = e.currentTarget;
                                      target.style.display = "none";
                                      const parent = target.parentElement;
                                      if (parent && !parent.querySelector(".fallback-label")) {
                                        parent.classList.add("bg-emerald-50", "dark:bg-emerald-950/30");
                                        const label = document.createElement("span");
                                        label.className = "fallback-label text-[10px] font-bold text-emerald-700 dark:text-emerald-400";
                                        label.innerText = "Foto";
                                        parent.appendChild(label);
                                      }
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                    <Eye className="w-4 h-4" />
                                  </div>
                                </button>
                                <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                                  {Array.isArray((item as any).attachmentUrls) && (item as any).attachmentUrls.length > 1
                                    ? `${(item as any).attachmentUrls.length} Foto`
                                    : "Foto Bukti"}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500 text-xs font-medium">-</span>
                            )}
                          </td>

                          {/* 10. Status */}
                          <td className="p-3.5 align-top whitespace-nowrap text-center">
                            {renderStatusBadge(item.statusApproval)}
                          </td>

                          {/* 11. Status Pengerjaan Program Kerja */}
                          <td className="p-3.5 align-top whitespace-nowrap text-center">
                            {item.programKerjaId || item.programKerja?.id ? (
                              <div className="flex flex-col items-center gap-1">
                                {renderProkerStatusBadge(parseProkerInfo(item).statusPelaksanaan)}
                                {!isPimpinan && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenStatusModal(item)}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition cursor-pointer shadow-2xs"
                                    title="Ubah status pengerjaan program kerja"
                                  >
                                    <ListChecks size={11} className="shrink-0" />
                                    <span>Ubah</span>
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500 text-xs">-</span>
                            )}
                          </td>

                          {/* 12. Aksi */}
                          <td className="p-3.5 align-top whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenDetailModal(item)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 shadow-2xs ${
                                  item.statusApproval === "MENUNGGU_VERIFIKASI_DPL"
                                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                                    : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600"
                                }`}
                                title={item.statusApproval === "MENUNGGU_VERIFIKASI_DPL" ? "Tinjau aktivitas" : "Lihat detil"}
                              >
                                <Eye size={14} className="w-3.5 h-3.5 shrink-0" />
                                <span>{item.statusApproval === "MENUNGGU_VERIFIKASI_DPL" ? "Tinjau" : "Lihat"}</span>
                              </button>
                              {!isPimpinan && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenDeleteModal(item)}
                                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer shadow-2xs flex items-center justify-center"
                                  title="Hapus logbook aktivitas (Validasi 2 Langkah)"
                                >
                                  <Trash2 size={14} className="w-3.5 h-3.5 shrink-0" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Pagination Bar */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div>
                Menampilkan{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {filteredLogbooks.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}-
                  {Math.min(currentPage * pageSize, filteredLogbooks.length)}
                </span>{" "}
                dari{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {filteredLogbooks.length}
                </span>{" "}
                aktivitas
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 dark:text-slate-300"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${
                      currentPage === pageNum
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 dark:text-slate-300"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          4. POPUP MODAL: DETAIL AKTIVITAS MAHASISWA & VALIDASI DPL
          ───────────────────────────────────────────── */}
      {isDetailModalOpen && selectedItemDetail && (() => {
        const prokerInfo = parseProkerInfo(selectedItemDetail);
        const fasilitasInfo = resolveFasilitasDetails(selectedItemDetail);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs" onClick={() => setIsDetailModalOpen(false)}>
            <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-700 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto text-xs text-slate-700 dark:text-slate-300">
              
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {resolveKategori(selectedItemDetail)}
                    </span>
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-full text-[10px] font-medium text-slate-600 dark:text-slate-300">
                      <Smartphone className="w-3 h-3 text-slate-500" />
                      <span>Aplikasi Mobile</span>
                    </div>
                    {selectedItemDetail.pekanKe && (
                      <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded-full text-[10px] font-semibold border border-blue-200 dark:border-blue-800">
                        Pekan #{selectedItemDetail.pekanKe}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {selectedItemDetail.kelompokNama}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Grid 2 Kolom Ringkasan */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-750">
                <div>
                  <span className="text-slate-400 block text-[11px]">Pengisi Data</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    {selectedItemDetail.penulisNama}
                    {selectedItemDetail.penulisNim && (
                      <span className="font-normal text-slate-400 font-mono ml-1">
                        ({selectedItemDetail.penulisNim})
                      </span>
                    )}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Tanggal & Waktu</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatDateFull(selectedItemDetail.tanggalKegiatan)} ({selectedItemDetail.waktuLengkap})
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Durasi (Satuan Jam)</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatDuration(selectedItemDetail.waktuMulai, selectedItemDetail.waktuSelesai).long}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Lokasi & Presensi</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedItemDetail.tempat}</span>
                    <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      GPS Valid
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 1: Program Kerja Terkait (Card & Badge Terstruktur) */}
              <div className="bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl p-4 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-emerald-100/80 dark:border-emerald-900/40">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                      <Target className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold text-xs text-emerald-950 dark:text-emerald-200">
                      Program Kerja Terkait
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {renderProkerCategoryBadge(prokerInfo.kategori)}
                    {renderProkerStatusBadge(prokerInfo.statusPelaksanaan)}
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                    {prokerInfo.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {renderFormattedText(prokerInfo.description)}
                  </p>
                </div>

                {prokerInfo.linkGoogleDrive && (
                  <div className="pt-1">
                    <a
                      href={prokerInfo.linkGoogleDrive}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka Dokumen Pendukung Program Kerja</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Card 2: Fasilitas Kebersihan Terkait (Kondisional jika ada fasilitas) */}
              {fasilitasInfo && (
                <div className="bg-teal-50/40 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/50 rounded-2xl p-4 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-teal-100/80 dark:border-teal-900/40">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                        <Building2 className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-xs text-teal-950 dark:text-teal-200">
                        Fasilitas Kebersihan Terkait
                      </span>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${fasilitasInfo.jenisBadgeClass}`}>
                      {fasilitasInfo.jenis}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {fasilitasInfo.nama}
                    </div>
                    {fasilitasInfo.alamat && (
                      <div className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                        <span>{fasilitasInfo.alamat}</span>
                      </div>
                    )}
                    {fasilitasInfo.latitude && fasilitasInfo.longitude && (
                      <div className="flex items-center gap-2 pt-0.5">
                        <span className="text-[11px] font-mono text-slate-400">
                          GPS: {fasilitasInfo.latitude.toFixed(6)}, {fasilitasInfo.longitude.toFixed(6)}
                        </span>
                        <a
                          href={`https://www.google.com/maps?q=${fasilitasInfo.latitude},${fasilitasInfo.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Buka Google Maps</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Card 3: Uraian Aktivitas Logbook */}
              <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-750 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200/70 dark:border-slate-700/60">
                  <div className="w-6 h-6 rounded-lg bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                    Uraian Aktivitas Kelompok
                  </span>
                </div>
                <p className="text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {renderFormattedText(selectedItemDetail.deskripsi)}
                </p>
              </div>

              {/* Anggota Tim Kelompok */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Anggota Tim Kelompok ({selectedItemDetail.anggotaKelompok?.length || 0} Mahasiswa):
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Aktivitas Tim Terdaftar
                  </span>
                </div>
                {selectedItemDetail.anggotaKelompok && selectedItemDetail.anggotaKelompok.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {selectedItemDetail.anggotaKelompok.map((st) => {
                      const isPenulis = Boolean(
                        (st.userId && st.userId === selectedItemDetail.penulisId) ||
                        (st.id && st.id === selectedItemDetail.penulisId)
                      );
                      return (
                        <span
                          key={st.id}
                          title={
                            st.name +
                            (st.isKetua ? " (Ketua Kelompok)" : "") +
                            (isPenulis ? " (Pengisi Data)" : "")
                          }
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            isPenulis
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300"
                              : st.isKetua
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300"
                              : "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200"
                          }`}
                        >
                          <span>{st.name}</span>
                          {st.isKetua && <span className="text-[10px] text-amber-700 font-bold">(Ketua Kelompok)</span>}
                          {isPenulis && !st.isKetua && (
                            <span className="text-[10px] text-emerald-700 font-bold">(Pengisi Data)</span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-slate-500 italic">Diisi oleh {selectedItemDetail.penulisNama}</p>
                )}
              </div>

              {/* Capaian Kegiatan */}
              <div className="space-y-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Capaian Kegiatan:</span>
                <p className="text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-750 font-medium">
                  {resolveHasilOutput(selectedItemDetail)}
                </p>
              </div>

              {/* Dokumentasi Kegiatan (Multi-Foto Gallery) */}
              {(() => {
                const rawPhotos: string[] = Array.isArray((selectedItemDetail as any).attachmentUrls) && (selectedItemDetail as any).attachmentUrls.length > 0
                  ? (selectedItemDetail as any).attachmentUrls
                  : selectedItemDetail.fotoBuktiUrl && selectedItemDetail.fotoBuktiUrl.trim() !== ""
                  ? selectedItemDetail.fotoBuktiUrl.split(/[,;]/).map((u) => u.trim()).filter(Boolean)
                  : [];
                const allPhotos = Array.from(new Set(rawPhotos.map((u) => (typeof u === "string" ? u.trim() : u)).filter(Boolean)));

                if (allPhotos.length === 0) return null;

                return (
                  <div className="space-y-1.5">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Dokumentasi Kegiatan ({allPhotos.length} foto):
                    </span>
                    <div className={`grid gap-2.5 ${allPhotos.length > 1 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1"}`}>
                      {allPhotos.map((photoUrl, pIdx) => (
                        <div
                          key={pIdx}
                          className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-52 bg-slate-900 flex items-center justify-center min-h-[120px] group"
                        >
                          <img
                            src={resolveImageUrl(photoUrl)}
                            alt={`Dokumentasi Kegiatan ${pIdx + 1}`}
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                              const parent = (e.target as HTMLElement).parentElement;
                              if (parent) {
                                const fallback = document.createElement("div");
                                fallback.className = "text-slate-400 text-xs italic p-4 text-center";
                                fallback.innerText = "Foto tidak dapat dimuat.";
                                parent.appendChild(fallback);
                              }
                            }}
                            className="w-full h-full object-contain max-h-52 group-hover:scale-105 transition duration-200"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewPhotoUrl(resolveImageUrl(photoUrl));
                              setPreviewTitle(`Dokumentasi #${pIdx + 1}: ${selectedItemDetail.tempat}`);
                            }}
                            className="absolute bottom-2 right-2 px-2.5 py-1 bg-black/60 hover:bg-black/80 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer shadow-xs"
                          >
                            <Eye className="w-3 h-3" /> Perbesar
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Catatan Sebelumnya */}
              {(selectedItemDetail.catatanKetua || selectedItemDetail.catatanDpl) && (
                <div className="space-y-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {selectedItemDetail.catatanKetua ? "Catatan Ketua Kelompok:" : "Catatan Evaluasi DPL:"}
                  </span>
                  <p className="italic text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    "{selectedItemDetail.catatanKetua || selectedItemDetail.catatanDpl}"
                  </p>
                </div>
              )}

              {/* Section Catatan dan Validasi DPL / Mode Pimpinan View-Only */}
              {isPimpinan ? (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-700 space-y-3">
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
                    <span className="font-semibold">Mode Pemimpin: View-Only (Hanya Memantau Data Supervisi & Logbook)</span>
                    <button
                      type="button"
                      onClick={() => setIsDetailModalOpen(false)}
                      className="py-1.5 px-3 bg-amber-100 dark:bg-amber-900/60 hover:bg-amber-200 text-amber-900 dark:text-amber-100 rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-700 space-y-3">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                    Catatan & Validasi DPL
                  </h4>

                  <textarea
                    rows={2}
                    value={validationCatatan}
                    onChange={(e) => setValidationCatatan(e.target.value)}
                    placeholder="Tambahkan catatan masukan, evaluasi, atau rekomendasi perbaikan untuk kelompok..."
                    className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                  />

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => handleOpenDeleteModal(selectedItemDetail)}
                      className="py-2.5 px-4 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50/60 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Hapus logbook aktivitas ini (Validasi 2 Langkah)"
                    >
                      <Trash2 size={14} className="w-3.5 h-3.5 shrink-0" />
                      <span>Hapus Logbook</span>
                    </button>

                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setIsDetailModalOpen(false)}
                        className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs transition-all cursor-pointer"
                      >
                        Tutup
                      </button>

                      <button
                        type="button"
                        disabled={isSubmittingQuickVerif}
                        onClick={() => handleVerifikasiDpl("REVISI")}
                        className="py-2.5 px-4 rounded-xl border border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        Minta Perbaikan
                      </button>

                      <button
                        type="button"
                        disabled={isSubmittingQuickVerif}
                        onClick={() => handleVerifikasiDpl("APPROVE")}
                        className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      >
                        {isSubmittingQuickVerif && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                        <CheckCircle className="w-3.5 h-3.5" />
                        Setujui Kegiatan
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ─────────────────────────────────────────────
          5. MODAL: KONFIRMASI VALIDASI SEMUA / SERENTAK DPL
          ───────────────────────────────────────────── */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs" onClick={() => setIsBatchModalOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-700 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto text-xs text-slate-700 dark:text-slate-300">
            
            {/* Header Modal */}
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                  <CheckCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {selectedIds.length > 0
                      ? "Setujui Kegiatan Terpilih"
                      : "Setujui Semua Kegiatan"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Persetujuan serentak kegiatan mahasiswa KKN
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBatchModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Summary Card */}
            <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-emerald-900 dark:text-emerald-200">
                  Jumlah yang akan disetujui:
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-600 text-white">
                  {(selectedIds.length > 0 ? selectedPendingLogbooks : pendingLogbooks).length} Kegiatan
                </span>
              </div>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300 leading-relaxed">
                Semua logbook berstatus <span className="font-bold">Menunggu Validasi</span> pada daftar ini akan otomatis disetujui, poin kehadiran/aktivitas dikreditkan ke mahasiswa, dan notifikasi persetujuan akan dikirim.
              </p>
            </div>

            {/* Preview List (Up to 5 items) */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 block">
                Daftar Kegiatan yang Akan Disetujui:
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {(selectedIds.length > 0 ? selectedPendingLogbooks : pendingLogbooks).slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="p-2 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2"
                  >
                    <div className="truncate flex-1">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {item.kelompokNama} • {item.penulisNama}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">{item.deskripsi}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                      {formatDateShort(item.tanggalKegiatan)}
                    </span>
                  </div>
                ))}
                {(selectedIds.length > 0 ? selectedPendingLogbooks : pendingLogbooks).length > 5 && (
                  <p className="text-center text-[10px] text-slate-400 italic">
                    ... dan {(selectedIds.length > 0 ? selectedPendingLogbooks : pendingLogbooks).length - 5} kegiatan lainnya
                  </p>
                )}
              </div>
            </div>

            {/* Input Catatan Batch */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                Catatan & Validasi DPL (Opsional):
              </label>
              <textarea
                rows={2}
                value={batchCatatan}
                onChange={(e) => setBatchCatatan(e.target.value)}
                placeholder="Contoh: Disetujui serentak oleh DPL, dokumentasi foto dan GPS terverifikasi."
                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setIsBatchModalOpen(false)}
                className="py-2 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSubmittingBatch}
                onClick={handleBatchVerifikasi}
                className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                {isSubmittingBatch && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <CheckCheck className="w-3.5 h-3.5" />
                <span>
                  Ya, Setujui {(selectedIds.length > 0 ? selectedPendingLogbooks : pendingLogbooks).length} Kegiatan
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          5B. MODAL: KONFIRMASI HAPUS LOGBOOK (VALIDASI 2 LANGKAH)
          ───────────────────────────────────────────── */}
      {showDeleteModal && deleteTargetItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150" onClick={() => setShowDeleteModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-700 space-y-4 animate-in zoom-in-95 duration-150 text-xs text-slate-700 dark:text-slate-300">
            
            {/* Header Modal */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-800">
                <Trash2 size={20} className="shrink-0" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Hapus Logbook Aktivitas
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Validasi 2 langkah untuk mencegah penghapusan data secara tidak sengaja.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isDeletingLogbook) {
                    setShowDeleteModal(false);
                    setDeleteTargetItem(null);
                  }
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
              >
                <X size={18} className="shrink-0" />
              </button>
            </div>

            {/* Target Summary Card */}
            <div className="bg-slate-50 dark:bg-slate-900/70 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {deleteTargetItem.penulisNama} {deleteTargetItem.penulisNim ? `(${deleteTargetItem.penulisNim})` : ""}
                </span>
                <span className="font-semibold text-slate-500">
                  {formatDateShort(deleteTargetItem.tanggalKegiatan)}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                {deleteTargetItem.kelompokNama} • {deleteTargetItem.tempat}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 italic line-clamp-2 bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                "{deleteTargetItem.deskripsi}"
              </p>
            </div>

            {/* Step 1: Checkbox Confirmation */}
            <div className="p-3 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-bold text-[11px]">
                <span className="px-1.5 py-0.5 rounded bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-200 text-[10px]">
                  Langkah 1
                </span>
                <span>Konfirmasi Persetujuan Risiko</span>
              </div>
              <label className="flex items-start gap-2.5 cursor-pointer select-none text-[11px] text-rose-900 dark:text-rose-200 font-medium">
                <input
                  type="checkbox"
                  checked={deleteConfirmChecked}
                  onChange={(e) => setDeleteConfirmChecked(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-rose-300 text-rose-600 focus:ring-rose-500 cursor-pointer accent-rose-600 shrink-0"
                />
                <span>
                  Saya memahami bahwa data logbook ini akan dihapus secara permanen dari database dan tidak dapat dipulihkan.
                </span>
              </label>
            </div>

            {/* Step 2: Type HAPUS */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-[10px]">
                  Langkah 2
                </span>
                <span>Ketik Kata Kunci Konfirmasi</span>
              </div>
              <label className="block text-[11px] text-slate-600 dark:text-slate-400">
                Ketik kata <span className="text-rose-600 dark:text-rose-400 font-black">HAPUS</span> pada kolom di bawah ini:
              </label>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="Ketik HAPUS..."
                disabled={!deleteConfirmChecked}
                className="w-full px-3 py-2 text-xs font-bold text-center uppercase tracking-widest bg-white dark:bg-slate-800 border border-rose-300 dark:border-rose-700 rounded-xl text-rose-600 dark:text-rose-400 placeholder:text-slate-400 placeholder:normal-case placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                disabled={isDeletingLogbook}
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteTargetItem(null);
                }}
                className="py-2 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={
                  !deleteConfirmChecked ||
                  deleteConfirmationText.trim().toUpperCase() !== "HAPUS" ||
                  isDeletingLogbook
                }
                onClick={handleConfirmDeleteLogbook}
                className="py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isDeletingLogbook && <RefreshCw size={14} className="w-3.5 h-3.5 animate-spin shrink-0" />}
                <Trash2 size={14} className="w-3.5 h-3.5 shrink-0" />
                <span>Hapus Logbook Permanen</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          6. MODAL: PREVIEW FOTO LIGHTBOX
          ───────────────────────────────────────────── */}
      {previewPhotoUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={closePreview}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-slate-800 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate pr-4">
                {previewTitle || "Foto Dokumentasi Bukti Kegiatan"}
              </h3>
              <button
                onClick={() => setPreviewPhotoUrl(null)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-slate-950 flex items-center justify-center max-h-[75vh] overflow-auto">
              <img
                src={previewPhotoUrl}
                alt="Preview Bukti"
                className="max-h-[70vh] w-auto object-contain rounded-lg shadow-lg"
              />
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900 text-center text-xs text-slate-500">
              Diambil langsung melalui kamera mobile mahasiswa sebagai bukti autentik kegiatan.
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          7. MODAL: KONFIGURASI TOLERANSI BACKDATE (DEVELOPER)
          ───────────────────────────────────────────── */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowConfigModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm">
                <Settings className="w-5 h-5 text-slate-600" />
                Konfigurasi Toleransi Pengisian (Developer)
              </h3>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Batas toleransi menentukan berapa hari sebelumnya (H-x) mahasiswa dapat menginput tanggal kegiatan logbook.
              Default: 1 hari sebelumnya (H-1).
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Batas Hari Toleransi (Hari)
              </label>
              <input
                type="number"
                min={0}
                max={30}
                value={configInputDays}
                onChange={(e) => setConfigInputDays(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Jika diisi 1: Mahasiswa hanya boleh mengisi untuk hari ini dan H-1.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSubmittingConfig}
                onClick={handleSaveToleranceConfig}
                className="px-4 py-2 text-xs font-bold bg-slate-900 dark:bg-slate-700 text-white rounded-xl cursor-pointer"
              >
                {isSubmittingConfig && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Simpan Konfigurasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          8. MODAL: UPDATE STATUS PENGERJAAN PROGRAM KERJA (DPL)
          ───────────────────────────────────────────── */}
      {statusPelaksanaanTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setStatusPelaksanaanTarget(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm">
                <ListChecks className="w-5 h-5 text-indigo-600" />
                Ubah Status Pengerjaan
              </h3>
              <button
                onClick={() => setStatusPelaksanaanTarget(null)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ubah status pengerjaan program kerja yang terkait dengan logbook ini. Perubahan akan tercatat dan terlihat oleh mahasiswa.
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                Status Pengerjaan
              </label>
              <div className="space-y-2">
                {[
                  { value: "BELUM_MULAI", label: "⬜ Belum Mulai / Direncanakan", desc: "Program kerja belum dimulai" },
                  { value: "SEDANG_BERLANGSUNG", label: "🔵 Sedang Berlangsung", desc: "Program kerja sedang dikerjakan" },
                  { value: "SELESAI", label: "✅ Selesai / Terlaksana", desc: "Program kerja sudah selesai dilaksanakan" },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                      newStatusPelaksanaan === opt.value
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40"
                        : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="statusPelaksanaan"
                      value={opt.value}
                      checked={newStatusPelaksanaan === opt.value}
                      onChange={() => setNewStatusPelaksanaan(opt.value)}
                      className="mt-0.5 accent-indigo-600"
                    />
                    <div>
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{opt.label}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{opt.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setStatusPelaksanaanTarget(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isUpdatingStatus || newStatusPelaksanaan === statusPelaksanaanTarget.currentStatus}
                onClick={handleSaveStatusPelaksanaan}
                className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition"
              >
                {isUpdatingStatus && <RotateCcw className="w-3.5 h-3.5 animate-spin" />}
                Simpan Status
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LogbookKknPage;
