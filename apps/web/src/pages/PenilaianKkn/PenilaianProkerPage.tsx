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
  PlusCircle,
  XCircle,
  Clock,
  Lock,
  Image as ImageIcon,
  ZoomIn,
  Camera,
  Calculator,
  ArrowRight,
  CheckSquare,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  dplService,
  type ProgramKerjaItem,
  type AspekPenilaianItem,
  type GroupSummary,
} from "../../services/dplService";
import { EmptyTableState } from "../../components/common/EmptyTableState";
import { getMediaPhotoUrl, formatGoogleDriveUrl } from "../../utils/photoUtils";
import { sortChronologicalList, sortKelompokList } from "../../utils/sortUtils";
import { useAuthStore } from "../../store/useAuthStore";
import { isTestProker, isTestKelompok } from "../../utils/filterTestingUtils";

export interface KelompokProkerSummary {
  kelompokId: string;
  kelompokName: string;
  kelurahan: string;
  dplNama?: string;
  totalProker: number; // n -> banyaknya proker
  evaluatedCount: number; // banyaknya proker yang sudah dinilai
  totalNilai: number; // total nilai proker
  rerataNilai: number; // total nilai / n (banyaknya proker)
  prokers: ProgramKerjaItem[];
}

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

// Helper Resolver Status Pelaksanaan: Hanya "SEDANG_BERJALAN" dan "SELESAI" yang berstatus aktif untuk penilaian
export const resolveStatusPelaksanaan = (
  statusPelaksanaan?: string,
  legacyStatus?: string
): "BELUM_MULAI" | "SEDANG_BERJALAN" | "SELESAI" => {
  const raw = String(statusPelaksanaan || legacyStatus || "")
    .toUpperCase()
    .trim();
  if (raw === "SELESAI" || raw.includes("SELESAI") || raw === "SUDAH") {
    return "SELESAI";
  }
  if (
    raw === "SEDANG_BERJALAN" ||
    raw.includes("BERJALAN") ||
    raw.includes("BERLANGSUNG") ||
    raw.includes("DILAKSANAKAN") ||
    raw === "SEDANG"
  ) {
    return "SEDANG_BERJALAN";
  }
  return "BELUM_MULAI";
};

// Helper format angka standar Indonesia (desimal menggunakan koma)
export const formatIndoNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined || isNaN(Number(num))) return "0,00";
  return Number(num).toFixed(2).replace(".", ",");
};

export const PenilaianProkerPage: React.FC = () => {
  const { user } = useAuthStore();
  const userRole = String(user?.peran || (user as any)?.role || "").toUpperCase();
  const isPimpinan = userRole === "PEMIMPIN" || userRole === "PIMPINAN";

  // State Data Master
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [prokerList, setProkerList] = useState<ProgramKerjaItem[]>([]);
  const [kelompokBinaanList, setKelompokBinaanList] = useState<GroupSummary[]>([]);
  const [selectedProkerId, setSelectedProkerId] = useState<string | null>(null);

  // Mode Tampilan: Ringkasan Nilai Kelompok (Total & Rerata) vs Daftar Detail Proker (Default: DETAIL sesuai acuan)
  const [viewMode, setViewMode] = useState<"KELOMPOK" | "DETAIL">("DETAIL");

  // Filter States (Fokus pada Search, Kelompok, Kategori, Status Pelaksanaan, dan Status Penilaian)
  const [searchQuery, setSearchQuery] = useState("");
  const [kelompokFilter, setKelompokFilter] = useState("ALL");
  const [kelompokSearchQuery, setKelompokSearchQuery] = useState("");
  const [kategoriFilter, setKategoriFilter] = useState("ALL");
  const [statusPelaksanaanFilter, setStatusPelaksanaanFilter] = useState("ALL");
  const [statusPenilaianFilter, setStatusPenilaianFilter] = useState("ALL");

  // Paginasi
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [kelompokPage, setKelompokPage] = useState<number>(1);
  const itemsPerPage = 10;
  const kelompokPerPage = 10;

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

  // Fetch Data Program Kerja dan Master Kelompok dari Backend
  // Master data proker diambil utuh agar jumlah proker (n) tiap kelompok selalu akurat dan dinamis
  const fetchData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [prokerRes, groupsRes] = await Promise.allSettled([
        dplService.getProgramKerja(undefined, {
          statusUsulan: "DISETUJUI",
        }),
        dplService.getGroupSummary(),
      ]);

      const prokerData = prokerRes.status === "fulfilled" ? prokerRes.value : [];
      const groupsData = groupsRes.status === "fulfilled" ? groupsRes.value : [];

      if (prokerRes.status === "rejected" && groupsRes.status === "rejected") {
        throw new Error("Gagal terhubung ke server untuk mengambil data penilaian");
      }

      const cleanGroups = (groupsData || []).filter((g) => !isTestKelompok(g));
      setKelompokBinaanList(cleanGroups);

      const cleanProker = (prokerData || []).filter(
        (p: any) =>
          !isTestProker(p) && !isTestKelompok({ name: p.kelompokName, dplNamaMentah: p.dplNama })
      );

      setProkerList(cleanProker);
    } catch (err: any) {
      console.error("[PenilaianProkerPage.fetchData] error:", err);
      setLoadError("Gagal memuat data penilaian program kerja dari server.");
      toast.error("Gagal memuat data program kerja. Silakan coba lagi.");
      setProkerList([]);
      setKelompokBinaanList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Daftar Opsi Kelompok KKN Unik (dari master kelompok binaan & proker)
  const uniqueKelompokList = useMemo(() => {
    const setK = new Set<string>();
    kelompokBinaanList.forEach((g) => {
      if (g.name) setK.add(g.name);
    });
    prokerList.forEach((p) => {
      if (p.kelompokName) setK.add(p.kelompokName);
    });
    return sortKelompokList(Array.from(setK), (k) => k);
  }, [kelompokBinaanList, prokerList]);

  // Jika kelompok binaan/aktif hanya 1, otomatis pilih kelompok tersebut sesuai tampilan acuan
  useEffect(() => {
    if (kelompokFilter === "ALL" && uniqueKelompokList.length === 1) {
      setKelompokFilter(uniqueKelompokList[0]);
    }
  }, [uniqueKelompokList, kelompokFilter]);

  // Agregasi Ringkasan Penilaian Program Kerja Per Kelompok:
  // - Banyaknya Program Kerja (n)
  // - Total Nilai Seluruh Proker
  // - Rerata Nilai Proker (Total Nilai / n)
  // Kelompok yang belum memiliki proker tetap terdaftar dengan n = 0
  const kelompokSummaries = useMemo<KelompokProkerSummary[]>(() => {
    const map = new Map<string, ProgramKerjaItem[]>();

    // Inisialisasi dengan seluruh kelompok binaan riil agar kelompok tanpa proker tetap terdata dengan n = 0
    kelompokBinaanList.forEach((g) => {
      if (g.name && !map.has(g.name)) {
        map.set(g.name, []);
      }
    });

    prokerList.forEach((p) => {
      const key = p.kelompokName || p.kelompokId || "Kelompok";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    });

    const list: KelompokProkerSummary[] = [];
    map.forEach((prokers, key) => {
      const first = prokers[0];
      const matchingGroup = kelompokBinaanList.find((g) => g.name === key);
      const n = prokers.length; // Banyaknya proker yang disetujui (ACC)
      let totalScore = 0;
      let evaluated = 0;

      prokers.forEach((p) => {
        if (p.skorPenilaian !== null && p.skorPenilaian !== undefined) {
          totalScore += Number(p.skorPenilaian);
          evaluated++;
        }
      });

      // Formula resmi dari arahan beliau: total nilai dibagi n -> banyaknya proker
      const rerata = n > 0 ? totalScore / n : 0;

      list.push({
        kelompokId: first?.kelompokId || matchingGroup?.id || key,
        kelompokName: key,
        kelurahan: first?.kelurahan || matchingGroup?.kelurahan || "-",
        dplNama:
          (first as any)?.dplNama ||
          (first as any)?.dplName ||
          matchingGroup?.dpl?.name ||
          undefined,
        totalProker: n,
        evaluatedCount: evaluated,
        totalNilai: Math.round(totalScore * 100) / 100,
        rerataNilai: Math.round(rerata * 100) / 100,
        prokers: sortChronologicalList(prokers, (p) => p.nomor || p.createdAt, "asc"),
      });
    });

    return sortKelompokList(list, (k) => k.kelompokName);
  }, [prokerList, kelompokBinaanList]);

  // Kelompok summaries difilter berdasarkan pencarian kelompok
  const filteredKelompokSummaries = useMemo(() => {
    if (!kelompokSearchQuery.trim()) return kelompokSummaries;
    const q = kelompokSearchQuery.toLowerCase().trim();
    return kelompokSummaries.filter(
      (k) =>
        k.kelompokName.toLowerCase().includes(q) ||
        k.kelurahan.toLowerCase().includes(q) ||
        (k.dplNama && k.dplNama.toLowerCase().includes(q))
    );
  }, [kelompokSummaries, kelompokSearchQuery]);

  // Statistik Keseluruhan Penilaian Program Kerja
  const overallStats = useMemo(() => {
    const totalKelompok = kelompokSummaries.length;
    const totalProkers = prokerList.length;
    const evaluatedProkers = prokerList.filter(
      (p) => p.skorPenilaian !== null && p.skorPenilaian !== undefined
    ).length;
    const totalScoreAll = prokerList.reduce(
      (acc, p) => acc + (p.skorPenilaian ? Number(p.skorPenilaian) : 0),
      0
    );
    const rerataAll = totalProkers > 0 ? totalScoreAll / totalProkers : 0;

    return {
      totalKelompok,
      totalProkers,
      evaluatedProkers,
      rerataAll: Math.round(rerataAll * 10) / 10,
    };
  }, [prokerList, kelompokSummaries]);

  // Kelompok aktif terpilih untuk banner ringkasan detail
  const selectedKelompokSummary = useMemo(() => {
    if (kelompokFilter === "ALL") return null;
    return kelompokSummaries.find((k) => k.kelompokName === kelompokFilter) || null;
  }, [kelompokSummaries, kelompokFilter]);

  // Statistik Kontekstual Kartu KPI Ringkasan Penilaian:
  // Jika 1 kelompok sedang dipilih/aktif, KPI menyesuaikan jumlah proker (n) kelompok tersebut
  const displayStats = useMemo(() => {
    if (selectedKelompokSummary) {
      return {
        totalKelompok: 1,
        totalProkers: selectedKelompokSummary.totalProker,
        evaluatedProkers: selectedKelompokSummary.evaluatedCount,
        rerataAll: selectedKelompokSummary.rerataNilai,
      };
    }
    return overallStats;
  }, [selectedKelompokSummary, overallStats]);

  // Client-side filtering fallback for immediate search responsiveness
  const filteredProkers = useMemo(() => {
    const filtered = prokerList.filter((p) => {
      // 1. Validasi Status Usulan: Wajib Disetujui (ACC)
      const legacySt = String(p.status || "").toUpperCase();
      let u = p.statusUsulan;
      if (!u) {
        if (
          legacySt === "DITERIMA" ||
          legacySt === "DISETUJUI" ||
          legacySt === "SEDANG_BERJALAN" ||
          legacySt === "SELESAI"
        )
          u = "DISETUJUI";
        else if (legacySt === "DITOLAK" || legacySt === "TIDAK_DISETUJUI") u = "DITOLAK";
        else u = "BELUM_DISETUJUI";
      }
      if (u !== "DISETUJUI" && u !== "DITERIMA") return false;

      // 2. Validasi Status Pelaksanaan
      const pl = resolveStatusPelaksanaan(p.statusPelaksanaan, p.status);
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
        if (!matchesDeskripsi && !matchesKelompok && !matchesKategori && !matchesJudul)
          return false;
      }

      // 4. Kategori
      if (kategoriFilter !== "ALL") {
        const pKat = (p.kategori || "Lainnya").toLowerCase();
        const filterKat = kategoriFilter.toLowerCase();
        if (filterKat.includes("edukasi") || filterKat.includes("sosialisasi")) {
          if (!pKat.includes("edukasi") && !pKat.includes("sosialisasi") && pKat !== "non-fisik")
            return false;
        } else if (filterKat.includes("pemanfaatan")) {
          if (!pKat.includes("pemanfaatan") && !pKat.includes("manfaat") && pKat !== "fisik")
            return false;
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

      // 6. Filter Kelompok
      if (kelompokFilter !== "ALL") {
        if (p.kelompokName !== kelompokFilter) return false;
      }

      return true;
    });
    return sortChronologicalList(filtered, (p) => p.createdAt || p.updatedAt, "desc");
  }, [
    prokerList,
    searchQuery,
    kelompokFilter,
    kategoriFilter,
    statusPelaksanaanFilter,
    statusPenilaianFilter,
  ]);

  // Perhitungan Ringkasan Bawah Tabel Proker (Total Nilai & Rerata Nilai n proker sesuai acuan)
  // n = banyaknya proker kelompok yang disetujui (ACC) bersifat dinamis per kelompok
  const tableSummaryValues = useMemo(() => {
    if (selectedKelompokSummary) {
      // Kelompok terpilih: gunakan n (banyaknya proker yang disetujui) aktual kelompok tersebut
      const n = selectedKelompokSummary.totalProker;
      const scored = selectedKelompokSummary.prokers.filter(
        (p) => p.skorPenilaian !== null && p.skorPenilaian !== undefined
      );
      const breakdown = scored.map((p) => formatIndoNumber(Number(p.skorPenilaian))).join(" + ");
      const total = selectedKelompokSummary.totalNilai;
      const rerata = selectedKelompokSummary.rerataNilai;

      return {
        breakdownString: breakdown || "-",
        totalNilaiFormatted: formatIndoNumber(total),
        nValue: n,
        rerataNilaiFormatted: formatIndoNumber(rerata),
      };
    }

    // Jika Semua Kelompok terpilih
    const targetList = filteredProkers;
    const n = targetList.length;
    const scored = targetList.filter(
      (p) => p.skorPenilaian !== null && p.skorPenilaian !== undefined
    );
    const breakdown = scored.map((p) => formatIndoNumber(Number(p.skorPenilaian))).join(" + ");
    const total = scored.reduce((acc, p) => acc + Number(p.skorPenilaian), 0);
    const rerata = n > 0 ? total / n : 0;

    return {
      breakdownString: breakdown || "-",
      totalNilaiFormatted: formatIndoNumber(total),
      nValue: n,
      rerataNilaiFormatted: formatIndoNumber(rerata),
    };
  }, [selectedKelompokSummary, filteredProkers]);

  // Sync Form State when selected proker changes
  const selectedProker = useMemo(() => {
    return prokerList.find((p) => p.id === selectedProkerId) || null;
  }, [prokerList, selectedProkerId]);

  // Cek apakah proker yang dipilih berstatus Sedang Berlangsung atau Selesai
  const isSelectedOngoingOrDone = useMemo(() => {
    if (!selectedProker) return false;
    const pel = resolveStatusPelaksanaan(selectedProker.statusPelaksanaan, selectedProker.status);
    return pel === "SEDANG_BERJALAN" || pel === "SELESAI";
  }, [selectedProker]);

  // Cek apakah proker yang dipilih berstatus Belum Mulai
  const isSelectedBelumMulai = !isSelectedOngoingOrDone;

  // Cek kelengkapan lampiran berkas
  const hasSelectedAttachment = useMemo(() => {
    if (!selectedProker) return false;
    return Boolean(
      selectedProker.linkGoogleDrive ||
      (selectedProker as any)?.attachmentFile ||
      (selectedProker as any)?.hasAttachment ||
      ((selectedProker as any)?.attachmentUrls && (selectedProker as any).attachmentUrls.length > 0)
    );
  }, [selectedProker]);

  // Form hanya terkunci jika role Pimpinan (view-only) atau proker Belum Mulai.
  // Ketiadaan lampiran berkas TIDAK lagi mengunci form penilaian DPL.
  const isFormLocked = isPimpinan || isSelectedBelumMulai;

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

      if (
        Array.isArray(selectedProker.aspekPenilaian) &&
        selectedProker.aspekPenilaian.length > 0
      ) {
        selectedProker.aspekPenilaian.forEach((item) => {
          if (item.no >= 1 && item.no <= 7) {
            newInputs[item.no] = item.nilai !== undefined && item.nilai !== null ? item.nilai : "";
          }
        });
      } else if (
        selectedProker.skorPenilaian !== null &&
        selectedProker.skorPenilaian !== undefined
      ) {
        const avg = selectedProker.skorPenilaian;
        for (let i = 1; i <= 7; i++) {
          newInputs[i] = avg;
        }
      }

      setInputNilai(newInputs);
      setCatatanDpl(selectedProker.evaluasiDpl || selectedProker.catatanDpl || "");
    }
  }, [selectedProker]);

  // Hitung Skor Berdasarkan Rubrik 7 Aspek (Nilai numerik murni tanpa predikat)
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

    return {
      rubrik: details,
      totalScore: Math.round(totalScore * 100) / 100,
      totalFilled,
      isComplete: totalFilled === 7,
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
      if (
        leg === "DITERIMA" ||
        leg === "DISETUJUI" ||
        leg === "SEDANG_BERJALAN" ||
        leg === "SELESAI"
      )
        u = "DISETUJUI";
      else if (leg === "DITOLAK" || leg === "TIDAK_DISETUJUI") u = "DITOLAK";
      else u = "BELUM_DISETUJUI";
    }
    if (u !== "DISETUJUI" && u !== "DITERIMA") {
      toast.error("Hanya program kerja yang telah disetujui (ACC) yang dapat dinilai");
      return;
    }

    const pel = resolveStatusPelaksanaan(proker.statusPelaksanaan, proker.status);
    if (pel !== "SEDANG_BERJALAN" && pel !== "SELESAI") {
      toast.error(
        "Tombol penilaian hanya aktif jika program kerja sudah berlangsung atau selesai."
      );
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

    const pel = resolveStatusPelaksanaan(selectedProker.statusPelaksanaan, selectedProker.status);
    if (pel !== "SEDANG_BERJALAN" && pel !== "SELESAI") {
      toast.error(
        "Penilaian hanya dapat disimpan jika program kerja sudah berlangsung atau selesai."
      );
      return;
    }

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
      const targetPelaksanaan =
        resolveStatusPelaksanaan(selectedProker.statusPelaksanaan, selectedProker.status) ===
        "SELESAI"
          ? "SELESAI"
          : "SEDANG_BERJALAN";

      await dplService.assessProgramKerja(
        selectedProker.id,
        calculatedRubrik.totalScore,
        catatanDpl,
        payloadAspek,
        undefined,
        statusPenilaian,
        targetPelaksanaan
      );

      toast.success(
        `Penilaian ${selectedProker.kelompokName} berhasil disimpan (Nilai: ${calculatedRubrik.totalScore.toFixed(1)})`
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
                predikat: null,
                statusPenilaian: statusPenilaian,
                statusPelaksanaan: targetPelaksanaan,
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
      if (
        leg === "DITERIMA" ||
        leg === "DISETUJUI" ||
        leg === "SEDANG_BERJALAN" ||
        leg === "SELESAI"
      )
        u = "DISETUJUI";
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
      if (
        leg === "DITERIMA" ||
        leg === "DISETUJUI" ||
        leg === "SEDANG_BERJALAN" ||
        leg === "SELESAI"
      )
        u = "DISETUJUI";
      else if (leg === "DITOLAK" || leg === "TIDAK_DISETUJUI") u = "DITOLAK";
      else u = "BELUM_DISETUJUI";
    }

    switch (u) {
      case "DISETUJUI":
      case "DITERIMA":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/40">
            <CheckCircle2 size={12} className="text-emerald-600 dark:text-emerald-400" />
            <span>Disetujui</span>
          </span>
        );
      case "DITOLAK":
      case "TIDAK_DISETUJUI":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/40">
            <XCircle size={12} className="text-rose-600 dark:text-rose-400" />
            <span>Ditolak</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/40">
            <Clock size={12} className="text-amber-600 dark:text-amber-400" />
            <span>Menunggu</span>
          </span>
        );
    }
  };

  // Helper Badge Status Pelaksanaan (Execution: Belum Mulai / Sedang Berjalan / Selesai)
  const renderStatusPelaksanaanBadge = (statusPelaksanaan?: string, legacyStatus?: string) => {
    const p = resolveStatusPelaksanaan(statusPelaksanaan, legacyStatus);

    switch (p) {
      case "SELESAI":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/40">
            Selesai
          </span>
        );
      case "SEDANG_BERJALAN":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/40">
            Sedang Berlangsung
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

  // Helper Badge Status Penilaian (Tampilan Pill Bersih sesuai acuan)
  const renderStatusPenilaianBadge = (statusPenilaian?: string | null, skor?: number | null) => {
    const status =
      statusPenilaian || (skor !== undefined && skor !== null ? "SUDAH_DINILAI" : "BELUM_DINILAI");
    switch (status) {
      case "SUDAH_DINILAI":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/40">
            <CheckCircle2 size={12} className="text-emerald-600 dark:text-emerald-400" />
            <span>Sudah Dinilai</span>
          </span>
        );
      case "SEDANG_DINILAI":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/40">
            <span>Sedang Dinilai</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/60">
            <span>Belum Dinilai</span>
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

  // Paginasi Data Proker
  const totalItems = filteredProkers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedProkers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProkers.slice(start, start + itemsPerPage);
  }, [filteredProkers, currentPage, itemsPerPage]);

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  // Paginasi Ringkasan Kelompok
  const totalKelompokItems = filteredKelompokSummaries.length;
  const totalKelompokPages = Math.ceil(totalKelompokItems / kelompokPerPage) || 1;
  const paginatedKelompokSummaries = useMemo(() => {
    const start = (kelompokPage - 1) * kelompokPerPage;
    return filteredKelompokSummaries.slice(start, start + kelompokPerPage);
  }, [filteredKelompokSummaries, kelompokPage, kelompokPerPage]);

  const startKelompokIndex = (kelompokPage - 1) * kelompokPerPage + 1;
  const endKelompokIndex = Math.min(kelompokPage * kelompokPerPage, totalKelompokItems);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#f8fafc] dark:bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-6 text-slate-800 dark:text-slate-100 max-w-[1600px] mx-auto">
      {/* Header Halaman Sesuai Acuan Atasan: Penilaian Program Kerja (Kelompok) */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center text-white shadow-xs">
              <Award size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Penilaian Program Kerja (Kelompok)
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Evaluasi capaian program kerja kelompok KKN (ACC), akumulasi total nilai, dan nilai
                rerata program kerja (Total Nilai ÷ n)
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher Sesuai Acuan */}
        <div className="flex items-center gap-2.5 self-stretch sm:self-auto">
          <button
            onClick={() => setViewMode("KELOMPOK")}
            className={`flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs transition-all cursor-pointer flex-1 sm:flex-initial border ${
              viewMode === "KELOMPOK"
                ? "bg-white text-emerald-800 dark:bg-slate-900 dark:text-emerald-300 border-2 border-emerald-600 shadow-2xs font-bold"
                : "bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-300 border-slate-200/90 dark:border-slate-800 font-medium"
            }`}
          >
            <Users
              size={14}
              className={viewMode === "KELOMPOK" ? "text-emerald-600" : "text-slate-500"}
            />
            <span>Ringkasan Nilai Kelompok</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              {overallStats.totalKelompok}
            </span>
          </button>
          <button
            onClick={() => setViewMode("DETAIL")}
            className={`flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs transition-all cursor-pointer flex-1 sm:flex-initial border ${
              viewMode === "DETAIL"
                ? "bg-white text-emerald-800 dark:bg-slate-900 dark:text-emerald-300 border-2 border-emerald-600 shadow-2xs font-bold"
                : "bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-300 border-slate-200/90 dark:border-slate-800 font-medium"
            }`}
          >
            <CheckSquare
              size={14}
              className={viewMode === "DETAIL" ? "text-emerald-600" : "text-slate-500"}
            />
            <span>Daftar Detail Program Kerja</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              {displayStats.totalProkers}
            </span>
          </button>
        </div>
      </div>

      {/* 4 Kartu KPI Summary Ringkasan Penilaian */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Kelompok */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Kelompok KKN
            </span>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {displayStats.totalKelompok}
            </div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 inline-block">
              Kelompok mahasiswa aktif
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
            <Users size={24} />
          </div>
        </div>

        {/* Total Proker ACC */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Proker Disetujui (ACC)
            </span>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {displayStats.totalProkers}
            </div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 inline-block">
              Objek penilaian program kerja
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 flex items-center justify-center">
            <CheckSquare size={24} />
          </div>
        </div>

        {/* Progres Penilaian */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div className="flex-1 pr-3">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Progres Penilaian Proker
            </span>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1 flex items-baseline gap-1">
              <span>{displayStats.evaluatedProkers}</span>
              <span className="text-lg font-normal text-slate-600 dark:text-slate-300">
                / {displayStats.totalProkers} (
                {displayStats.totalProkers > 0
                  ? Math.round((displayStats.evaluatedProkers / displayStats.totalProkers) * 100)
                  : 0}
                %)
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                style={{
                  width: `${
                    displayStats.totalProkers > 0
                      ? (displayStats.evaluatedProkers / displayStats.totalProkers) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <BarChart3 size={24} />
          </div>
        </div>

        {/* Rerata Nilai Keseluruhan */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Rerata Nilai Program Kerja
            </span>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {displayStats.rerataAll > 0 ? formatIndoNumber(displayStats.rerataAll) : "-"}
            </div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 inline-block">
              Skala penilaian 0 - 100
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
            <Calculator size={24} />
          </div>
        </div>
      </div>

      {/* TAMPILAN TAB 1: RINGKASAN NILAI KELOMPOK (TOTAL & RERATA NILAI) */}
      {viewMode === "KELOMPOK" && (
        <div className="space-y-4">
          {/* Filter Bar Kelompok */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <div className="relative flex-1 max-w-md">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Cari kelompok / kelurahan / DPL..."
                value={kelompokSearchQuery}
                onChange={(e) => {
                  setKelompokSearchQuery(e.target.value);
                  setKelompokPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/40 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-medium">
                <Calculator size={14} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>Rerata Nilai = Total Nilai ÷ n (Banyaknya Proker)</span>
              </div>
            </div>
          </div>

          {/* Tabel Ringkasan Nilai Kelompok */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden flex flex-col">
            {loadError ? (
              <div className="p-8 flex flex-col items-center justify-center gap-3 text-center">
                <AlertCircle size={36} className="text-rose-500" />
                <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {loadError}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
                  Terjadi kendala saat memuat data kelompok dari server. Pastikan koneksi internet
                  aktif dan Anda telah masuk sebagai pengguna yang berwenang.
                </p>
                <button
                  onClick={() => fetchData()}
                  className="mt-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Clock size={14} />
                  <span>Coba Lagi</span>
                </button>
              </div>
            ) : loading ? (
              <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="animate-spin text-emerald-600" size={28} />
                <span className="text-xs font-medium">
                  Memuat ringkasan nilai program kerja kelompok...
                </span>
              </div>
            ) : filteredKelompokSummaries.length === 0 ? (
              <div className="p-8">
                <EmptyTableState
                  entityName="Kelompok KKN"
                  isSearch={!!kelompokSearchQuery}
                  searchQuery={kelompokSearchQuery}
                  onResetSearch={() => setKelompokSearchQuery("")}
                />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold">
                        <th className="py-3.5 px-3 w-12 text-center">No.</th>
                        <th className="py-3.5 px-4 min-w-[180px]">Nama Kelompok &amp; Lokasi</th>
                        <th className="py-3.5 px-3.5 text-center min-w-[110px]">
                          Banyaknya Proker (<span className="italic font-bold">n</span>)
                        </th>
                        <th className="py-3.5 px-3.5 text-center min-w-[120px]">Proker Dinilai</th>
                        <th className="py-3.5 px-4 min-w-[280px]">Nilai Tiap Program Kerja</th>
                        <th className="py-3.5 px-3.5 text-center min-w-[110px]">Total Nilai</th>
                        <th className="py-3.5 px-3.5 text-center min-w-[130px]">
                          Rerata Nilai (<span className="italic font-bold">Total ÷ n</span>)
                        </th>
                        <th className="py-3.5 px-3.5 text-center min-w-[120px]">Status</th>
                        <th className="py-3.5 px-4 text-center min-w-[110px]">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-normal">
                      {paginatedKelompokSummaries.map((k, idx) => {
                        const rowNumber = startKelompokIndex + idx;
                        const isComplete = k.evaluatedCount === k.totalProker && k.totalProker > 0;
                        const isPartial = k.evaluatedCount > 0 && k.evaluatedCount < k.totalProker;

                        return (
                          <tr
                            key={k.kelompokId || k.kelompokName}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            {/* No */}
                            <td className="py-3.5 px-3 text-center font-bold text-slate-500 dark:text-slate-400">
                              {rowNumber}
                            </td>

                            {/* Nama Kelompok & Lokasi */}
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                                {k.kelompokName}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                Kel. {k.kelurahan}
                              </div>
                            </td>

                            {/* Banyaknya Proker (n) */}
                            <td className="py-3.5 px-3.5 text-center">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/60">
                                {k.totalProker} proker
                              </span>
                            </td>

                            {/* Proker Dinilai */}
                            <td className="py-3.5 px-3.5 text-center">
                              <div className="inline-flex flex-col items-center">
                                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                  <strong className="text-emerald-700 dark:text-emerald-400">
                                    {k.evaluatedCount}
                                  </strong>{" "}
                                  / {k.totalProker}
                                </span>
                                <div className="w-16 bg-slate-100 dark:bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
                                  <div
                                    className="bg-emerald-600 h-full rounded-full"
                                    style={{
                                      width: `${
                                        k.totalProker > 0
                                          ? (k.evaluatedCount / k.totalProker) * 100
                                          : 0
                                      }%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </td>

                            {/* Nilai Tiap Program Kerja (Pills Per Proker) */}
                            <td className="py-3.5 px-4">
                              <div className="flex flex-wrap gap-1.5 max-w-md">
                                {k.prokers.length > 0 ? (
                                  k.prokers.map((p, pIdx) => {
                                    const hasScore =
                                      p.skorPenilaian !== null && p.skorPenilaian !== undefined;
                                    return (
                                      <div
                                        key={p.id}
                                        title={`${p.judul || p.deskripsi || "Program Kerja"} • Skor: ${
                                          hasScore
                                            ? Number(p.skorPenilaian).toFixed(1)
                                            : "Belum dinilai"
                                        }`}
                                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                                          hasScore
                                            ? "bg-emerald-50 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40"
                                            : "bg-slate-50 text-slate-500 border-slate-200/80 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700/50"
                                        }`}
                                      >
                                        <span className="font-semibold text-[10px] text-slate-500 dark:text-slate-400">
                                          P{pIdx + 1}:
                                        </span>
                                        <span className="font-bold">
                                          {hasScore ? Number(p.skorPenilaian).toFixed(1) : "-"}
                                        </span>
                                      </div>
                                    );
                                  })
                                ) : (
                                  <span className="text-[11px] text-slate-400 italic">
                                    Belum ada proker disetujui
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Total Nilai */}
                            <td className="py-3.5 px-3.5 text-center">
                              <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                                {k.evaluatedCount > 0 ? formatIndoNumber(k.totalNilai) : "-"}
                              </span>
                            </td>

                            {/* Rerata Nilai (Total Nilai / n) */}
                            <td className="py-3.5 px-3.5 text-center">
                              <div className="flex flex-col items-center">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/40">
                                  {k.evaluatedCount > 0 ? formatIndoNumber(k.rerataNilai) : "-"}
                                </span>
                                <span className="text-[10px] text-slate-400 mt-0.5">
                                  {k.totalProker > 0
                                    ? `${formatIndoNumber(k.totalNilai)} ÷ ${k.totalProker}`
                                    : "n = 0"}
                                </span>
                              </div>
                            </td>

                            {/* Status Penilaian */}
                            <td className="py-3.5 px-3.5 text-center">
                              {k.totalProker === 0 ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/60">
                                  0 Proker
                                </span>
                              ) : isComplete ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/40">
                                  <CheckCircle2 size={11} />
                                  <span>Lengkap</span>
                                </span>
                              ) : isPartial ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/40">
                                  <span>
                                    Sebagian ({k.evaluatedCount}/{k.totalProker})
                                  </span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/60">
                                  Belum Dinilai
                                </span>
                              )}
                            </td>

                            {/* Aksi */}
                            <td className="py-3.5 px-4 text-center">
                              <button
                                onClick={() => {
                                  setKelompokFilter(k.kelompokName);
                                  setViewMode("DETAIL");
                                  setCurrentPage(1);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                                title="Lihat detail program kerja kelompok ini"
                              >
                                <span>Detail</span>
                                <ArrowRight size={13} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Paginasi Kelompok */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span>
                    Menampilkan {startKelompokIndex}-{endKelompokIndex} dari {totalKelompokItems}{" "}
                    kelompok KKN
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      disabled={kelompokPage <= 1}
                      onClick={() => setKelompokPage((p) => Math.max(1, p - 1))}
                      className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <ChevronLeft size={14} />
                    </button>

                    {Array.from({ length: totalKelompokPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setKelompokPage(pageNum)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          kelompokPage === pageNum
                            ? "bg-emerald-700 text-white"
                            : "border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}

                    <button
                      disabled={kelompokPage >= totalKelompokPages}
                      onClick={() => setKelompokPage((p) => Math.min(totalKelompokPages, p + 1))}
                      className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* TAMPILAN TAB 2: DAFTAR DETAIL PROGRAM KERJA (TABEL DETAIL PROKER) */}
      {viewMode === "DETAIL" && (
        <div className="space-y-4">
          {/* Banner Informasi Kelompok Aktif (Jika filter kelompok terpilih) */}
          {selectedKelompokSummary && (
            <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                  <Users size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                      {selectedKelompokSummary.kelompokName}
                    </h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      • Kel. {selectedKelompokSummary.kelurahan}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-slate-600 dark:text-slate-400 flex-wrap">
                    <span>
                      Banyaknya Proker (n):{" "}
                      <strong className="text-slate-900 dark:text-slate-100">
                        {selectedKelompokSummary.totalProker}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      Total Nilai:{" "}
                      <strong className="text-emerald-700 dark:text-emerald-400 font-bold">
                        {formatIndoNumber(selectedKelompokSummary.totalNilai)}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      Rerata Nilai:{" "}
                      <strong className="text-emerald-700 dark:text-emerald-400 font-bold">
                        {formatIndoNumber(selectedKelompokSummary.rerataNilai)}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setKelompokFilter("ALL");
                  setCurrentPage(1);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition-colors shadow-2xs cursor-pointer"
              >
                <X size={14} />
                <span>Tampilkan Semua Kelompok</span>
              </button>
            </div>
          )}

          {/* Baris Filter Interaktif (Search, Kelompok, Kategori, Status Pelaksanaan, Status Penilaian) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs items-center">
            {/* Search */}
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Cari proker / judul / kelompok..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Filter Kelompok */}
            <div className="relative">
              <Users
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <select
                value={kelompokFilter}
                onChange={(e) => {
                  setKelompokFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer appearance-none"
              >
                <option value="ALL">Semua Kelompok</option>
                {uniqueKelompokList.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                ▼
              </div>
            </div>

            {/* Filter Kategori */}
            <div className="relative">
              <Folder
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
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
              <Clock
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
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
                <option value="SEDANG_BERJALAN">Sedang Berlangsung</option>
                <option value="SELESAI">Selesai</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                ▼
              </div>
            </div>

            {/* Filter Status Penilaian */}
            <div className="relative">
              <BarChart3
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
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

          {/* Tabel Program Kerja KKN (Full Width Master View) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden flex flex-col">
            {loadError ? (
              <div className="p-8 flex flex-col items-center justify-center gap-3 text-center">
                <AlertCircle size={36} className="text-rose-500" />
                <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {loadError}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
                  Terjadi kendala saat memuat data program kerja dari server. Pastikan koneksi
                  internet aktif dan Anda telah masuk sebagai DPL yang berwenang.
                </p>
                <button
                  onClick={() => fetchData()}
                  className="mt-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Clock size={14} />
                  <span>Coba Lagi</span>
                </button>
              </div>
            ) : loading ? (
              <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="animate-spin text-emerald-600" size={28} />
                <span className="text-xs font-medium">
                  Memuat daftar program kerja yang siap dinilai...
                </span>
              </div>
            ) : filteredProkers.length === 0 ? (
              <div className="p-8">
                <EmptyTableState
                  entityName="Program Kerja Disetujui (ACC)"
                  isSearch={
                    !!(
                      searchQuery ||
                      kelompokFilter !== "ALL" ||
                      kategoriFilter !== "ALL" ||
                      statusPelaksanaanFilter !== "ALL" ||
                      statusPenilaianFilter !== "ALL"
                    )
                  }
                  searchQuery={searchQuery}
                  onResetSearch={() => {
                    setSearchQuery("");
                    setKelompokFilter("ALL");
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
                      <tr className="bg-slate-50/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold">
                        <th className="py-3.5 px-3 w-12 text-center">No.</th>
                        <th className="py-3.5 px-4 min-w-[160px]">Nama Kelompok &amp; Wilayah</th>
                        <th className="py-3.5 px-3.5 min-w-[120px]">Kategori</th>
                        <th className="py-3.5 px-4 min-w-[200px]">Judul Program</th>
                        <th className="py-3.5 px-4 min-w-[260px]">Deskripsi Program Kerja</th>
                        <th className="py-3.5 px-3.5 text-center min-w-[120px]">Status Usulan</th>
                        <th className="py-3.5 px-3.5 text-center min-w-[130px]">
                          Status Pelaksanaan
                        </th>
                        <th className="py-3.5 px-3.5 text-center min-w-[90px]">Nilai</th>
                        <th className="py-3.5 px-3.5 text-center min-w-[130px]">
                          Status Penilaian
                        </th>
                        <th className="py-3.5 px-4 text-center min-w-[160px]">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-normal">
                      {paginatedProkers.map((p, idx) => {
                        const rowNumber = startIndex + idx;
                        const statusPenilaian =
                          p.statusPenilaian ||
                          (p.skorPenilaian ? "SUDAH_DINILAI" : "BELUM_DINILAI");
                        const pPelaksanaan = resolveStatusPelaksanaan(
                          p.statusPelaksanaan,
                          p.status
                        );
                        const isOngoingOrDone =
                          pPelaksanaan === "SEDANG_BERJALAN" || pPelaksanaan === "SELESAI";
                        const isBelumMulai = !isOngoingOrDone;
                        const hasScore = p.skorPenilaian !== null && p.skorPenilaian !== undefined;

                        return (
                          <tr
                            key={p.id}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
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
                            <td className="py-3.5 px-3.5">{renderKategoriBadge(p.kategori)}</td>

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

                            {/* Kolom Nilai Murni (Standar Angka Indonesia) */}
                            <td className="py-3.5 px-3.5 text-center">
                              <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                                {hasScore ? formatIndoNumber(Number(p.skorPenilaian)) : "-"}
                              </span>
                            </td>

                            {/* Kolom Status Penilaian */}
                            <td className="py-3.5 px-3.5 text-center">
                              {renderStatusPenilaianBadge(p.statusPenilaian, p.skorPenilaian)}
                            </td>

                            {/* Aksi Buttons: Tombol Beri Nilai AKTIF hanya jika proker sedang berlangsung / selesai */}
                            <td className="py-3.5 px-3 text-center">
                              <div className="flex flex-col items-center justify-center gap-1.5 w-[96px] mx-auto">
                                {isBelumMulai ? (
                                  <button
                                    disabled
                                    aria-disabled="true"
                                    aria-label={`Penilaian terkunci untuk ${p.judul || "program kerja"}: kegiatan belum dimulai`}
                                    className="w-full inline-flex items-center justify-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 rounded-lg font-semibold text-xs border border-slate-200 dark:border-slate-700/60 cursor-not-allowed opacity-80"
                                    title="Penilaian terkunci: Program kerja belum dimulai oleh mahasiswa (hanya aktif jika sedang berlangsung atau selesai)"
                                  >
                                    <Lock size={12} />
                                    <span>Beri Nilai</span>
                                  </button>
                                ) : statusPenilaian === "SUDAH_DINILAI" ||
                                  statusPenilaian === "SEDANG_DINILAI" ? (
                                  <button
                                    onClick={() => handleOpenAssessModal(p)}
                                    className="w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-1 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
                                    title="Ubah Nilai Program Kerja (Sedang Berlangsung / Selesai)"
                                  >
                                    <Edit3 size={12} />
                                    <span>Ubah Nilai</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleOpenAssessModal(p)}
                                    className="w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-1 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
                                    title="Beri Nilai Program Kerja (Sedang Berlangsung / Selesai)"
                                  >
                                    <PlusCircle size={12} />
                                    <span>Beri Nilai</span>
                                  </button>
                                )}

                                <button
                                  onClick={() => handleOpenBukti(p)}
                                  className="w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-2xs"
                                  title="Lihat Dokumentasi Kegiatan"
                                >
                                  <FileText size={12} />
                                  <span>Bukti</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {/* Baris Total Nilai Sesuai Acuan */}
                      <tr className="border-t-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                        <td colSpan={7} className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                            Total Nilai
                          </div>
                          <div className="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                            {tableSummaryValues.breakdownString}
                          </div>
                        </td>
                        <td className="py-3.5 px-3.5 text-center font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                          {tableSummaryValues.totalNilaiFormatted}
                        </td>
                        <td colSpan={2} className="py-3.5 px-4"></td>
                      </tr>

                      {/* Baris Rerata Nilai Sesuai Acuan */}
                      <tr className="border-t border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/70 dark:bg-emerald-950/30">
                        <td colSpan={7} className="py-3.5 px-4">
                          <div className="font-bold text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm">
                            Rerata Nilai
                          </div>
                          <div className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mt-0.5">
                            {tableSummaryValues.nValue > 0
                              ? `Total Nilai ÷ Jumlah Proker (n) = ${tableSummaryValues.totalNilaiFormatted} ÷ ${tableSummaryValues.nValue}`
                              : "Belum ada program kerja yang disetujui (n = 0)"}
                          </div>
                        </td>
                        <td className="py-3.5 px-3.5 text-center font-extrabold text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm">
                          {tableSummaryValues.rerataNilaiFormatted}
                        </td>
                        <td colSpan={2} className="py-3.5 px-4"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Paginasi Bagian Bawah Tabel Proker Sesuai Acuan */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3 text-xs text-slate-500 dark:text-slate-400">
                  {/* Baris Atas Footer: Keterangan n */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      n = jumlah program kerja yang disetujui (ACC).
                    </span>
                  </div>

                  {/* Baris Bawah Footer: Jumlah Data & Kontrol Navigasi Halaman */}
                  <div className="flex items-center justify-between w-full pt-1">
                    <span>
                      Menampilkan {startIndex}–{endIndex} dari {totalItems} program kerja
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
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL POPUP: Form Penilaian Program Kerja */}
      {isAssessModalOpen && selectedProker && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={() => setIsAssessModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto animate-in fade-in zoom-in-95 duration-150"
          >
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
                      {renderStatusPelaksanaanBadge(
                        selectedProker.statusPelaksanaan,
                        selectedProker.status
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
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
                <AlertCircle
                  size={15}
                  className="shrink-0 mt-0.5 text-blue-600 dark:text-blue-400"
                />
                <span>
                  <strong>Validitas Kegiatan:</strong> Penilaian didasarkan pada presensi riil
                  mahasiswa dan bukti foto dokumentasi yang diunggah melalui aplikasi mobile setelah
                  memenuhi durasi minimal kegiatan.
                </span>
              </div>

              {/* Guard 1: Program Kerja Belum Dimulai */}
              {isSelectedBelumMulai && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300">
                  <Lock size={16} className="shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                  <div>
                    <strong className="block font-bold">Program Kerja Belum Dimulai</strong>
                    <span>
                      Program kerja ini masih berstatus <em>Belum Mulai</em>. Penilaian terkunci dan
                      baru dapat diberikan setelah mahasiswa memulai atau menyelesaikan pelaksanaan
                      kegiatan di lapangan.
                    </span>
                  </div>
                </div>
              )}

              {/* Catatan Berkas Lampiran: Informasi untuk DPL (Tidak Mengunci Penilaian) */}
              {!isSelectedBelumMulai && !hasSelectedAttachment && (
                <div className="p-3 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50 rounded-xl flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
                  <AlertCircle
                    size={15}
                    className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400"
                  />
                  <div>
                    <strong className="block font-semibold">
                      Catatan: Tautan Lampiran Belum Tersedia
                    </strong>
                    <span>
                      Ketua kelompok belum menyertakan berkas/tautan Google Drive. DPL tetap dapat
                      memberikan penilaian berdasarkan rekam jejak presensi dan bukti aktivitas
                      kegiatan mahasiswa di lapangan.
                    </span>
                  </div>
                </div>
              )}

              {isPimpinan && (
                <div className="p-3.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/50 rounded-xl flex items-start gap-2.5 text-xs text-purple-800 dark:text-purple-300">
                  <AlertCircle
                    size={16}
                    className="shrink-0 mt-0.5 text-purple-600 dark:text-purple-400"
                  />
                  <div>
                    <strong className="block font-bold">Mode Akses View-Only</strong>
                    <span>
                      Sebagai Pimpinan, Anda memiliki hak akses pemantauan (monitoring & evaluasi)
                      secara penuh tanpa hak mengubah nilai.
                    </span>
                  </div>
                </div>
              )}

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
                        <tr
                          key={r.no}
                          className="hover:bg-slate-50/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/30"
                        >
                          <td className="py-2 px-2 text-center text-slate-400 font-medium">
                            {r.no}
                          </td>
                          <td className="py-2 px-3 text-slate-800 dark:text-slate-200 font-medium">
                            {r.aspek}
                          </td>
                          <td className="py-2 px-2 text-center text-slate-500 font-semibold">
                            {r.bobot}%
                          </td>
                          <td className="py-2 px-2 text-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              disabled={isFormLocked}
                              placeholder="0"
                              aria-label={`Nilai aspek ${r.no}: ${r.aspek}`}
                              value={inputNilai[r.no] ?? ""}
                              onChange={(e) => handleScoreChange(r.no, e.target.value)}
                              className="w-20 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-center font-bold text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-800"
                            />
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-emerald-700 dark:text-emerald-400">
                            {r.skor.toFixed(1)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-emerald-50/50 dark:bg-emerald-950/20 font-bold border-t border-slate-200 dark:border-slate-800">
                        <td colSpan={2} className="py-2.5 px-3 text-slate-900 dark:text-slate-100">
                          Total Nilai Akhir Proker
                        </td>
                        <td className="py-2.5 px-2 text-center text-slate-700 dark:text-slate-300">
                          100%
                        </td>
                        <td className="py-2.5 px-2 text-center text-slate-400 font-normal text-[11px]">
                          Akumulasi Rubrik
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-700 dark:text-emerald-400 font-extrabold text-sm">
                          {calculatedRubrik.totalScore.toFixed(1)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Catatan DPL */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Catatan Evaluasi / Rekomendasi DPL
                </label>
                <textarea
                  rows={3}
                  disabled={isFormLocked}
                  placeholder="Tuliskan evaluasi, feedback, atau rekomendasi perbaikan program kerja ini..."
                  value={catatanDpl}
                  onChange={(e) => setCatatanDpl(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 resize-none disabled:opacity-50"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <button
                type="button"
                onClick={handleResetForm}
                disabled={isSaving || isFormLocked}
                className="px-3.5 py-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40"
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
                  Tutup
                </button>

                {!isPimpinan && (
                  <button
                    type="button"
                    onClick={handleSimpanNilai}
                    disabled={isSaving || isFormLocked}
                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    title={
                      isSelectedBelumMulai
                        ? "Penilaian terkunci: Program kerja belum dimulai oleh mahasiswa"
                        : "Simpan Penilaian"
                    }
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
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Bukti Kegiatan & Dokumentasi (z-[60] to open over assessment popup if triggered) */}
      {isBuktiModalOpen && (
        <div
          className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsBuktiModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col max-h-[88vh] animate-in fade-in zoom-in-95 duration-150"
          >
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
                        Foto & Logbook (
                        {
                          buktiData.attendances.filter(
                            (a) => !!a.photoUrl && a.photoUrl.trim() !== "" && a.photoUrl !== "null"
                          ).length
                        }
                        )
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
                        Presensi (
                        {
                          buktiData.attendances.filter(
                            (a) => !a.photoUrl || a.photoUrl.trim() === "" || a.photoUrl === "null"
                          ).length
                        }
                        )
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
                    <p className="text-xs">
                      Belum ada foto dokumentasi atau presensi dari kelompok ini.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Grid Foto Dokumentasi & Logbook */}
                    {buktiData.attendances.filter((att) => {
                      const hasPhoto =
                        !!att.photoUrl && att.photoUrl.trim() !== "" && att.photoUrl !== "null";
                      if (buktiFilterTab === "FOTO") return hasPhoto;
                      if (buktiFilterTab === "PRESENSI") return false;
                      return hasPhoto;
                    }).length > 0 && (
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
                              const hasPhoto =
                                !!att.photoUrl &&
                                att.photoUrl.trim() !== "" &&
                                att.photoUrl !== "null";
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
                                          onError={() =>
                                            setFailedImageIds((prev) => ({
                                              ...prev,
                                              [att.id]: true,
                                            }))
                                          }
                                          className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                                        />
                                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white gap-1.5 text-xs font-semibold backdrop-blur-2xs">
                                          <ZoomIn size={16} />
                                          <span>Lihat Foto</span>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-slate-50 dark:bg-slate-800 text-slate-400">
                                        <Camera
                                          size={24}
                                          className="mb-1 text-slate-300 dark:text-slate-600"
                                        />
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
                                      <div
                                        className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1"
                                        title={att.activityTitle}
                                      >
                                        {att.activityTitle}
                                      </div>
                                      {att.description && (
                                        <div
                                          className="text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5"
                                          title={att.description}
                                        >
                                          {att.description}
                                        </div>
                                      )}
                                    </div>

                                    <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                                      <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[110px]">
                                        Oleh: {att.user?.name || "Mahasiswa"}
                                      </span>
                                      <span>
                                        {new Date(att.checkIn).toLocaleDateString("id-ID", {
                                          day: "numeric",
                                          month: "short",
                                        })}
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
                    {buktiData.attendances.filter((att) => {
                      const hasNoPhoto =
                        !att.photoUrl || att.photoUrl.trim() === "" || att.photoUrl === "null";
                      if (buktiFilterTab === "PRESENSI") return true;
                      if (buktiFilterTab === "FOTO") return false;
                      return hasNoPhoto;
                    }).length > 0 && (
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
                              const hasNoPhoto =
                                !att.photoUrl ||
                                att.photoUrl.trim() === "" ||
                                att.photoUrl === "null";
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
                                    Oleh:{" "}
                                    <strong className="text-slate-700 dark:text-slate-300">
                                      {att.user?.name || "Mahasiswa"}
                                    </strong>
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
