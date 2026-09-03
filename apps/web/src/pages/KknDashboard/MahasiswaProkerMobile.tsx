/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Mobile Program Kerja & Posko View for Mahasiswa KKN (Interactive Submission & Evaluation)
 */

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Target,
  PlusCircle,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Building2,
  RefreshCw,
  Trash2,
  ChevronRight,
  ExternalLink,
  DollarSign,
  FileText,
  AlertCircle,
  X,
  Send,
  Loader2,
  Award,
  BookOpen,
  Info,
  Sparkles,
  Crosshair,
  Pencil,
  Navigation,
  Check,
} from "lucide-react";
import api from "../../utils/api";
import showToast from "../../utils/showToast";
import { useAuthStore } from "../../store/useAuthStore";

interface ProkerItem {
  id: string;
  nomor?: number;
  judul?: string;
  deskripsi: string;
  kategori?: string;
  sumber?: string;
  waktuPelaksanaan?: string;
  linkGoogleDrive?: string;
  kebutuhanBiaya?: number | string;
  status?: string;
  statusUsulan?: string;
  statusPelaksanaan?: string;
  catatanDpl?: string;
  evaluasiDpl?: string;
  skorPenilaian?: number | string;
  predikat?: string;
  statusPenilaian?: string;
  kelompok?: {
    id: string;
    name: string;
    kelurahan?: string;
  };
  createdAt?: string;
}

interface PoskoItem {
  id: string;
  nama: string;
  alamat?: string;
  kelurahan?: string;
  rw?: string | number;
  latitude: number | string;
  longitude: number | string;
  radius?: number;
  radiusMeters?: number;
  isUtama?: boolean;
  keterangan?: string;
  fotoUrl?: string;
  foto?: string;
}

const KATEGORI_OPTIONS = [
  { value: "TATA_KELOLA", label: "🏛️ Tata Kelola & Koordinasi" },
  { value: "EDUKASI", label: "📢 Edukasi & Sosialisasi Warga" },
  { value: "ORGANIK", label: "🌱 Pengolahan Sampah Organik (Loseda/Maggot)" },
  { value: "ANORGANIK", label: "♻️ Pengelolaan Anorganik & Bank Sampah" },
  { value: "FASILITAS", label: "🛠️ Infrastruktur & Fasilitas Lingkungan" },
  { value: "LAINNYA", label: "📌 Program Pendukung Lainnya" },
];

export const MahasiswaProkerMobile: React.FC<{ onProkerCreated?: () => void }> = ({
  onProkerCreated,
}) => {
  const { user } = useAuthStore();

  const [prokerList, setProkerList] = useState<ProkerItem[]>([]);
  const [poskoList, setPoskoList] = useState<PoskoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"proker" | "posko">("proker");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modal State: Create / Edit Proker
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmittingProker, setIsSubmittingProker] = useState(false);
  const [formJudul, setFormJudul] = useState("");
  const [formKategori, setFormKategori] = useState("TATA_KELOLA");
  const [formDeskripsi, setFormDeskripsi] = useState("");
  const [formWaktu, setFormWaktu] = useState("");
  const [formBiaya, setFormBiaya] = useState("");
  const [formLinkDrive, setFormLinkDrive] = useState("");

  // Modal State: Detail Proker
  const [selectedProker, setSelectedProker] = useState<ProkerItem | null>(null);
  const [isDeletingProker, setIsDeletingProker] = useState(false);

  // Modal State: Daftarkan / Edit Posko KKN
  const [isPoskoModalOpen, setIsPoskoModalOpen] = useState(false);
  const [isEditingPosko, setIsEditingPosko] = useState(false);
  const [poskoFormId, setPoskoFormId] = useState<string | null>(null);
  const [poskoFormNama, setPoskoFormNama] = useState("");
  const [poskoFormAlamat, setPoskoFormAlamat] = useState("");
  const [poskoFormLat, setPoskoFormLat] = useState("");
  const [poskoFormLng, setPoskoFormLng] = useState("");
  const [poskoFormRadius, setPoskoFormRadius] = useState("500");
  const [poskoFormKeterangan, setPoskoFormKeterangan] = useState("");
  const [poskoFormIsUtama, setPoskoFormIsUtama] = useState(true);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [isSubmittingPosko, setIsSubmittingPosko] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [prokerRes, poskoMeRes, poskoAreasRes] = await Promise.allSettled([
        api.get("/dpl/program-kerja"),
        api.get("/posko-kkn/me/all-zones"),
        api.get("/areas/posko"),
      ]);

      // 1. Proker List
      if (prokerRes.status === "fulfilled") {
        setProkerList(prokerRes.value.data?.data || []);
      }

      // 2. Posko List
      let loadedPoskos: PoskoItem[] = [];
      if (poskoMeRes.status === "fulfilled" && poskoMeRes.value.data?.data) {
        const zoneData = poskoMeRes.value.data.data;
        if (zoneData.allPoskos && Array.isArray(zoneData.allPoskos) && zoneData.allPoskos.length > 0) {
          loadedPoskos = zoneData.allPoskos;
        } else if (zoneData.poskoUtama) {
          loadedPoskos = [
            { ...zoneData.poskoUtama, isUtama: true },
            ...(Array.isArray(zoneData.multiPoskos) ? zoneData.multiPoskos : []),
          ];
        }
      }

      if (loadedPoskos.length === 0 && poskoAreasRes.status === "fulfilled") {
        const rawPosko = poskoAreasRes.value.data?.data || poskoAreasRes.value.data || [];
        if (Array.isArray(rawPosko) && rawPosko.length > 0) {
          loadedPoskos = rawPosko;
        }
      }

      setPoskoList(loadedPoskos);
    } catch (err) {
      console.error("Gagal memuat proker & posko", err);
    } finally {
      setIsLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // PROKER HANDLERS
  // ─────────────────────────────────────────────────────────────

  const handleOpenCreateProkerModal = () => {
    setFormJudul("");
    setFormKategori("TATA_KELOLA");
    setFormDeskripsi("");
    setFormWaktu("");
    setFormBiaya("");
    setFormLinkDrive("");
    setIsCreateModalOpen(true);
  };

  const handleCreateProker = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formJudul.trim()) {
      showToast.error("Judul program kerja wajib diisi!");
      return;
    }

    if (!formDeskripsi.trim()) {
      showToast.error("Deskripsi program kerja wajib diisi!");
      return;
    }

    setIsSubmittingProker(true);
    try {
      const payload = {
        judul: formJudul.trim(),
        deskripsi: formDeskripsi.trim(),
        kategori: formKategori,
        sumber: "MAHASISWA",
        waktuPelaksanaan: formWaktu.trim() || undefined,
        kebutuhanBiaya: formBiaya ? Number(formBiaya) : 0,
        linkGoogleDrive: formLinkDrive.trim() || undefined,
        statusUsulan: "BELUM_DISETUJUI",
        statusPelaksanaan: "BELUM_MULAI",
      };

      const res = await api.post("/dpl/program-kerja", payload);
      if (res.data?.success || res.status === 200 || res.status === 201) {
        showToast.success("Usulan program kerja berhasil diajukan ke DPL!");
        setIsCreateModalOpen(false);
        fetchData();
        if (onProkerCreated) onProkerCreated();
      }
    } catch (err: any) {
      console.error("Gagal mengusulkan proker", err);
      showToast.error(
        err.response?.data?.message || "Gagal mengusulkan program kerja. Coba lagi."
      );
    } finally {
      setIsSubmittingProker(false);
    }
  };

  const handleDeleteProker = async (id: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus usulan program kerja ini?")) {
      return;
    }

    setIsDeletingProker(true);
    try {
      await api.delete(`/dpl/program-kerja/${id}`);
      showToast.success("Program kerja berhasil dihapus");
      setSelectedProker(null);
      fetchData();
      if (onProkerCreated) onProkerCreated();
    } catch (err: any) {
      showToast.error(err.response?.data?.message || "Gagal menghapus program kerja.");
    } finally {
      setIsDeletingProker(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // POSKO HANDLERS
  // ─────────────────────────────────────────────────────────────

  const handleOpenCreatePoskoModal = () => {
    setIsEditingPosko(false);
    setPoskoFormId(null);
    setPoskoFormNama("Posko KKN Kelompok");
    setPoskoFormAlamat("");
    setPoskoFormRadius("500");
    setPoskoFormKeterangan("");
    setPoskoFormIsUtama(poskoList.length === 0);
    setPoskoFormLat("");
    setPoskoFormLng("");
    setIsPoskoModalOpen(true);

    // Auto trigger GPS detection
    handleDetectGpsLocation();
  };

  const handleOpenEditPoskoModal = (posko: PoskoItem) => {
    setIsEditingPosko(true);
    setPoskoFormId(posko.id);
    setPoskoFormNama(posko.nama || "Posko KKN");
    setPoskoFormAlamat(posko.alamat || "");
    setPoskoFormLat(String(posko.latitude || ""));
    setPoskoFormLng(String(posko.longitude || ""));
    setPoskoFormRadius(String(posko.radiusMeters || posko.radius || 500));
    setPoskoFormKeterangan(posko.keterangan || "");
    setPoskoFormIsUtama(posko.isUtama ?? true);
    setIsPoskoModalOpen(true);
  };

  const handleDetectGpsLocation = () => {
    if (!navigator.geolocation) {
      showToast.error("Browser tidak mendukung GPS Geolocation.");
      return;
    }

    setIsDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsDetectingGps(false);
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        setPoskoFormLat(lat);
        setPoskoFormLng(lng);
        showToast.success(`📍 Lokasi GPS terdeteksi: ${lat}, ${lng}`);
      },
      (err) => {
        setIsDetectingGps(false);
        console.warn("GPS detection warning:", err);
        showToast.info("Izin lokasi belum aktif. Anda dapat mengetik koordinat manual atau mengaktifkan GPS.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSubmitPosko = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!poskoFormNama.trim()) {
      showToast.error("Nama Posko KKN wajib diisi!");
      return;
    }

    const latNum = parseFloat(poskoFormLat);
    const lngNum = parseFloat(poskoFormLng);

    if (isNaN(latNum) || isNaN(lngNum) || latNum === 0 || lngNum === 0) {
      showToast.error("Koordinat GPS (Latitude & Longitude) wajib diisi valid!");
      return;
    }

    const radNum = parseInt(poskoFormRadius, 10) || 500;

    setIsSubmittingPosko(true);
    try {
      const payload: any = {
        nama: poskoFormNama.trim(),
        alamat: poskoFormAlamat.trim() || "Wilayah Posko KKN",
        latitude: latNum,
        longitude: lngNum,
        radius: radNum,
        keterangan: poskoFormKeterangan.trim() || undefined,
        isUtama: poskoFormIsUtama,
      };

      if (isEditingPosko && poskoFormId) {
        // Update existing posko
        if (poskoFormIsUtama) {
          await api.post("/posko-kkn", payload);
        } else {
          await api.put(`/posko-kkn/multi/${poskoFormId}`, payload);
        }
        showToast.success("Data Posko KKN berhasil diperbarui!");
      } else {
        // Create new posko
        if (poskoFormIsUtama || poskoList.length === 0) {
          await api.post("/posko-kkn", payload);
        } else {
          await api.post("/posko-kkn/multi", payload);
        }
        showToast.success("Posko KKN berhasil didaftarkan & aktif!");
      }

      setIsPoskoModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error("Gagal menyimpan Posko KKN", err);
      showToast.error(
        err.response?.data?.message || "Gagal menyimpan Posko KKN. Pastikan data lengkap."
      );
    } finally {
      setIsSubmittingPosko(false);
    }
  };

  // Helper untuk formatting rupiah
  const formatRupiah = (num: number | string | undefined) => {
    if (!num) return "Rp 0";
    const val = typeof num === "string" ? parseFloat(num) : num;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Filter list berdasarkan tab status
  const filteredProkerList = prokerList.filter((item) => {
    if (statusFilter === "ALL") return true;
    const usulan = (item.statusUsulan || item.status || "").toUpperCase();
    const pelaks = (item.statusPelaksanaan || "").toUpperCase();

    if (statusFilter === "DISETUJUI") return usulan === "DISETUJUI" || usulan === "DITERIMA";
    if (statusFilter === "DIUSULKAN") return usulan === "BELUM_DISETUJUI" || usulan === "DIUSULKAN";
    if (statusFilter === "BERJALAN") return pelaks === "SEDANG_BERJALAN" || pelaks === "BERLANGSUNG";
    if (statusFilter === "SELESAI") return pelaks === "SELESAI";
    if (statusFilter === "DITOLAK") return usulan === "DITOLAK" || usulan === "TIDAK_DISETUJUI";
    return true;
  });

  return (
    <div className="space-y-4">
      {/* 1. Header Segmented Tabs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">Program Kerja & Posko</h2>
            <p className="text-[11px] text-slate-500">Rencana aksi & titik posko kelompok KKN</p>
          </div>
          <div className="flex items-center gap-1.5">
            {activeTab === "proker" ? (
              <button
                type="button"
                onClick={handleOpenCreateProkerModal}
                className="py-1.5 px-3 rounded-xl bg-[#035941] hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              >
                <PlusCircle size={14} />
                <span>+ Usulkan</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenCreatePoskoModal}
                className="py-1.5 px-3 rounded-xl bg-[#035941] hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              >
                <PlusCircle size={14} />
                <span>+ Daftarkan Posko</span>
              </button>
            )}
            <button
              type="button"
              onClick={fetchData}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition cursor-pointer"
              title="Segarkan data"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Main Tabs */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("proker")}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "proker"
                ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-2xs font-extrabold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Target size={14} />
            <span>Program Kerja ({prokerList.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("posko")}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "posko"
                ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-2xs font-extrabold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Building2 size={14} />
            <span>Posko Wilayah ({poskoList.length})</span>
          </button>
        </div>

        {/* Sub Filter Status (Hanya saat tab proker aktif) */}
        {activeTab === "proker" && prokerList.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px] font-bold scrollbar-none pt-1">
            {[
              { id: "ALL", label: `Semua (${prokerList.length})` },
              { id: "DISETUJUI", label: "Disetujui DPL" },
              { id: "DIUSULKAN", label: "Diusulkan" },
              { id: "BERJALAN", label: "Sedang Berjalan" },
              { id: "SELESAI", label: "Selesai" },
              { id: "DITOLAK", label: "Ditolak" },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatusFilter(st.id)}
                className={`py-1 px-2.5 rounded-xl whitespace-nowrap transition cursor-pointer shrink-0 border ${
                  statusFilter === st.id
                    ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-500 font-extrabold"
                    : "bg-slate-50 dark:bg-slate-800/80 text-slate-500 border-slate-200/80 dark:border-slate-700 hover:bg-slate-100"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. Content List */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
          <RefreshCw size={24} className="animate-spin text-emerald-600" />
          <span>Memuat data program kerja &amp; posko...</span>
        </div>
      ) : activeTab === "proker" ? (
        <div className="space-y-3">
          {filteredProkerList.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center text-xs text-slate-400 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
                <Target size={26} />
              </div>
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {statusFilter === "ALL"
                    ? "Belum ada Program Kerja"
                    : "Tidak ada Program Kerja pada filter ini"}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Rencanakan program kerja kelompok KKN Anda dan ajukan untuk validasi DPL.
                </p>
              </div>
              {statusFilter === "ALL" && (
                <button
                  type="button"
                  onClick={handleOpenCreateProkerModal}
                  className="py-3 px-5 bg-[#035941] hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition inline-flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
                >
                  <PlusCircle size={16} />
                  <span>+ Usulkan Program Kerja Pertama</span>
                </button>
              )}
            </div>
          ) : (
            filteredProkerList.map((proker, index) => {
              const isApproved =
                proker.statusUsulan === "DISETUJUI" ||
                proker.status === "DITERIMA" ||
                proker.status === "DISETUJUI";
              const isRejected =
                proker.statusUsulan === "DITOLAK" ||
                proker.status === "DITOLAK" ||
                proker.status === "TIDAK_DISETUJUI";
              const isCompleted =
                proker.statusPelaksanaan === "SELESAI" || proker.status === "SELESAI";
              const isOngoing =
                proker.statusPelaksanaan === "SEDANG_BERJALAN" ||
                proker.status === "SEDANG_BERJALAN";

              // Extract title if combined in description
              let cleanTitle = proker.judul;
              let cleanDesc = proker.deskripsi;
              if (!cleanTitle && proker.deskripsi.startsWith("**")) {
                const match = proker.deskripsi.match(/^\*\*(.*?)\*\*(?:\r?\n+)?([\s\S]*)$/);
                if (match) {
                  cleanTitle = match[1];
                  cleanDesc = match[2];
                }
              }

              return (
                <div
                  key={proker.id || index}
                  onClick={() => setSelectedProker(proker)}
                  className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 rounded-3xl p-4 shadow-2xs space-y-3 transition-all cursor-pointer group active:scale-[0.99]"
                >
                  {/* Top Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {proker.kategori || "Program Kerja"}
                    </span>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Status Pelaksanaan Badge */}
                      {isCompleted ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                          ✓ Selesai
                        </span>
                      ) : isOngoing ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 animate-pulse">
                          ⚡ Berjalan
                        </span>
                      ) : null}

                      {/* Status Usulan Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          isApproved
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : isRejected
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        }`}
                      >
                        {isApproved
                          ? "Disetujui DPL"
                          : isRejected
                          ? "Ditolak"
                          : "Diusulkan"}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                      {cleanTitle || cleanDesc?.slice(0, 50)}
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {cleanDesc}
                    </p>
                  </div>

                  {/* Meta Chips */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 font-medium">
                    <div className="flex items-center gap-3">
                      {proker.waktuPelaksanaan && (
                        <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                          <Calendar size={11} className="text-emerald-600" />
                          <span>{proker.waktuPelaksanaan}</span>
                        </span>
                      )}
                      {Boolean(proker.kebutuhanBiaya && Number(proker.kebutuhanBiaya) > 0) && (
                        <span className="flex items-center gap-0.5 text-emerald-700 dark:text-emerald-400 font-bold">
                          <span>{formatRupiah(proker.kebutuhanBiaya)}</span>
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                      <span>Detail</span>
                      <ChevronRight size={12} />
                    </span>
                  </div>

                  {/* Evaluasi DPL Note if Present */}
                  {(proker.catatanDpl || proker.evaluasiDpl) && (
                    <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-[10.5px] text-amber-800 dark:text-amber-300 space-y-0.5">
                      <div className="flex items-center gap-1 font-bold">
                        <Award size={12} className="text-amber-600" />
                        <span>Catatan DPL:</span>
                      </div>
                      <p className="leading-snug">{proker.catatanDpl || proker.evaluasiDpl}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* POSKO WILAYAH LIST */
        <div className="space-y-3">
          {poskoList.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center text-xs text-slate-400 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
                <Building2 size={26} />
              </div>
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  Belum ada Posko KKN Terdaftar
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Daftarkan titik koordinat Posko KKN kelompok Anda untuk mengaktifkan zona presensi dan pemetaan.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenCreatePoskoModal}
                className="py-3 px-5 bg-[#035941] hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition inline-flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
              >
                <PlusCircle size={16} />
                <span>+ Daftarkan Posko KKN Sekarang</span>
              </button>
            </div>
          ) : (
            <>
              {poskoList.map((posko, pIdx) => {
                const lat = Number(posko.latitude);
                const lng = Number(posko.longitude);
                const isPrimary = posko.isUtama ?? pIdx === 0;

                return (
                  <div
                    key={posko.id || pIdx}
                    className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-2xs space-y-3 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold shrink-0">
                          <Building2 size={20} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                              {posko.nama || "Posko KKN Kelompok"}
                            </h4>
                            {isPrimary && (
                              <span className="px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                ⭐ Posko Utama
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium">
                            {posko.kelurahan ? `Kel. ${posko.kelurahan}` : "Wilayah KKN"}
                            {posko.rw ? ` • RW ${posko.rw}` : ""}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenEditPoskoModal(posko)}
                        className="py-1 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <Pencil size={11} />
                        <span>Edit</span>
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      📍 {posko.alamat || "Alamat posko KKN"}
                    </p>

                    {posko.keterangan && (
                      <p className="text-[10px] text-slate-500 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl">
                        ℹ️ {posko.keterangan}
                      </p>
                    )}

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>GPS: {lat ? lat.toFixed(5) : "-"}, {lng ? lng.toFixed(5) : "-"}</span>
                      <span className="text-emerald-600 font-bold">
                        Radius: {posko.radiusMeters || posko.radius || 500}m
                      </span>
                    </div>

                    {lat && lng ? (
                      <a
                        href={`https://www.google.com/maps?q=${lat},${lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200/60 dark:border-slate-700/60"
                      >
                        <Navigation size={12} className="text-emerald-600" />
                        <span>Buka Rute di Google Maps</span>
                        <ExternalLink size={11} className="text-slate-400" />
                      </a>
                    ) : null}
                  </div>
                );
              })}

              <button
                type="button"
                onClick={handleOpenCreatePoskoModal}
                className="w-full py-3 px-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 text-slate-600 dark:text-slate-400 hover:text-emerald-600 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer bg-slate-50/50 dark:bg-slate-900/50"
              >
                <PlusCircle size={15} />
                <span>+ Daftarkan Posko Tambahan</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. MODAL: TAMBAH USULAN PROGRAM KERJA                         */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isCreateModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0" onClick={() => setIsCreateModalOpen(false)} />

            <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-200 z-10">
              {/* Header */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80 shrink-0">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Target size={18} className="text-emerald-600" />
                    Usulkan Program Kerja KKN
                  </h3>
                  <p className="text-[10px] text-slate-500">Ajukan program kerja kelompok ke DPL</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-300 transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form Body */}
              <form id="form-create-proker" onSubmit={handleCreateProker} className="p-4 space-y-3.5 overflow-y-auto overscroll-contain flex-1 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Judul Program Kerja *
                  </label>
                  <input
                    type="text"
                    required
                    value={formJudul}
                    onChange={(e) => setFormJudul(e.target.value)}
                    placeholder="Contoh: Edukasi Pemilahan Sampah & Pembangunan Loseda"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Kategori Kegiatan *
                  </label>
                  <select
                    value={formKategori}
                    onChange={(e) => setFormKategori(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    {KATEGORI_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Deskripsi & Sasaran Program *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formDeskripsi}
                    onChange={(e) => setFormDeskripsi(e.target.value)}
                    placeholder="Jelaskan tujuan kegiatan, sasaran warga/RW, dan output capaian yang diharapkan..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Rencana Waktu / Jadwal Pelaksanaan
                  </label>
                  <input
                    type="text"
                    value={formWaktu}
                    onChange={(e) => setFormWaktu(e.target.value)}
                    placeholder="Contoh: Minggu 2 - 4 (15 Sept - 5 Okt 2026)"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Estimasi Kebutuhan Biaya (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={formBiaya}
                    onChange={(e) => setFormBiaya(e.target.value)}
                    placeholder="Contoh: 150000"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Tautan Proposal / Google Drive (Opsional)
                  </label>
                  <input
                    type="url"
                    value={formLinkDrive}
                    onChange={(e) => setFormLinkDrive(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </form>

              {/* Action Footer */}
              <div className="p-4 pb-[calc(env(safe-area-inset-bottom,16px)+16px)] border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 grid grid-cols-2 gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="py-3.5 rounded-2xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition cursor-pointer text-xs flex items-center justify-center"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  form="form-create-proker"
                  disabled={isSubmittingProker || !formJudul.trim() || !formDeskripsi.trim()}
                  className="py-3.5 bg-[#035941] hover:bg-emerald-700 text-white rounded-2xl font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50 text-xs active:scale-95"
                >
                  {isSubmittingProker ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      <span>Kirim Usulan</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 4. MODAL: DETAIL & EVALUASI PROGRAM KERJA                     */}
      {/* ───────────────────────────────────────────────────────────── */}
      {selectedProker &&
        createPortal(
          <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0" onClick={() => setSelectedProker(null)} />

            <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-200 z-10">
              {/* Header */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50 dark:bg-slate-800/80 shrink-0">
                <div className="space-y-1 min-w-0 pr-2">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {selectedProker.kategori || "Program Kerja"}
                  </span>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white leading-snug">
                    {selectedProker.judul || selectedProker.deskripsi?.slice(0, 50)}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProker(null)}
                  className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-300 transition cursor-pointer shrink-0"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              <div className="p-4 pb-[calc(env(safe-area-inset-bottom,16px)+16px)] space-y-4 overflow-y-auto overscroll-contain flex-1 text-xs">
                {/* Status Grid */}
                <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Status Usulan</p>
                    <p className="font-extrabold text-slate-800 dark:text-slate-200">
                      {selectedProker.statusUsulan === "DISETUJUI" ||
                      selectedProker.status === "DITERIMA" ||
                      selectedProker.status === "DISETUJUI"
                        ? "✅ Disetujui DPL"
                        : selectedProker.statusUsulan === "DITOLAK"
                        ? "❌ Ditolak"
                        : "⏳ Menunggu Validasi"}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Pelaksanaan</p>
                    <p className="font-extrabold text-slate-800 dark:text-slate-200">
                      {selectedProker.statusPelaksanaan === "SELESAI"
                        ? "🏆 Selesai"
                        : selectedProker.statusPelaksanaan === "SEDANG_BERJALAN"
                        ? "⚡ Sedang Berjalan"
                        : "🕒 Belum Mulai"}
                    </p>
                  </div>
                </div>

                {/* Full Description */}
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Rincian Deskripsi & Target
                  </p>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 text-xs leading-relaxed whitespace-pre-wrap">
                    {selectedProker.deskripsi}
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 text-xs">
                  {selectedProker.waktuPelaksanaan && (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50">
                      <span className="text-slate-400 font-medium">Jadwal Pelaksanaan:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {selectedProker.waktuPelaksanaan}
                      </span>
                    </div>
                  )}

                  {Boolean(selectedProker.kebutuhanBiaya && Number(selectedProker.kebutuhanBiaya) > 0) && (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50">
                      <span className="text-slate-400 font-medium">Estimasi Biaya:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {formatRupiah(selectedProker.kebutuhanBiaya)}
                      </span>
                    </div>
                  )}

                  {selectedProker.linkGoogleDrive && (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Dokumen Pendukung:</span>
                      <a
                        href={selectedProker.linkGoogleDrive}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
                      >
                        <span>Buka Google Drive</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  )}
                </div>

                {/* Evaluasi / Feedback DPL */}
                {(selectedProker.catatanDpl ||
                  selectedProker.evaluasiDpl ||
                  selectedProker.skorPenilaian) && (
                  <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                        <Award size={14} className="text-amber-600" />
                        Evaluasi & Nilai DPL
                      </span>
                      {selectedProker.skorPenilaian && (
                        <span className="px-2 py-0.5 rounded-lg bg-amber-200 dark:bg-amber-900 text-amber-950 dark:text-amber-200 font-black">
                          Skor: {selectedProker.skorPenilaian}
                        </span>
                      )}
                    </div>
                    <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
                      {selectedProker.evaluasiDpl || selectedProker.catatanDpl}
                    </p>
                  </div>
                )}

                {/* Action Buttons: Delete (if not yet approved) */}
                {selectedProker.statusUsulan !== "DISETUJUI" &&
                  selectedProker.status !== "DITERIMA" &&
                  selectedProker.status !== "DISETUJUI" && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleDeleteProker(selectedProker.id)}
                        disabled={isDeletingProker}
                        className="w-full py-3 px-3 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-950 text-rose-700 dark:text-rose-300 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border border-rose-200 dark:border-rose-900"
                      >
                        {isDeletingProker ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                        <span>Hapus Usulan Program Kerja</span>
                      </button>
                    </div>
                  )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 5. MODAL: DAFTARKAN / EDIT POSKO KKN                          */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isPoskoModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0" onClick={() => setIsPoskoModalOpen(false)} />

            <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-200 z-10">
              {/* Header */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80 shrink-0">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 size={18} className="text-emerald-600" />
                    {isEditingPosko ? "Edit Data Posko KKN" : "Daftarkan Posko KKN Kelompok"}
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Titik lokasi posko kelompok KKN untuk validasi presensi
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPoskoModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-300 transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form Body */}
              <form id="form-posko-kkn" onSubmit={handleSubmitPosko} className="p-4 space-y-3.5 overflow-y-auto overscroll-contain flex-1 text-xs">
                {/* Nama Posko */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Nama Posko KKN *
                  </label>
                  <input
                    type="text"
                    required
                    value={poskoFormNama}
                    onChange={(e) => setPoskoFormNama(e.target.value)}
                    placeholder="Contoh: Posko KKN Kelompok 5 Dago"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Alamat Posko */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Alamat Lengkap Posko *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={poskoFormAlamat}
                    onChange={(e) => setPoskoFormAlamat(e.target.value)}
                    placeholder="Contoh: Jl. Dago Pojok No. 12, Balai RW 03..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* GPS Detector Button */}
                <div className="bg-emerald-50/80 dark:bg-emerald-950/40 p-3 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                      <MapPin size={14} className="text-emerald-600" />
                      Titik Lokasi GPS (Koordinat HP)
                    </span>
                    <button
                      type="button"
                      onClick={handleDetectGpsLocation}
                      disabled={isDetectingGps}
                      className="py-1 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      {isDetectingGps ? (
                        <Loader2 size={11} className="animate-spin" />
                      ) : (
                        <Crosshair size={11} />
                      )}
                      <span>Ambil GPS Saat Ini</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-0.5">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Latitude *</label>
                      <input
                        type="text"
                        required
                        value={poskoFormLat}
                        onChange={(e) => setPoskoFormLat(e.target.value)}
                        placeholder="-6.890321"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-xs font-mono text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Longitude *</label>
                      <input
                        type="text"
                        required
                        value={poskoFormLng}
                        onChange={(e) => setPoskoFormLng(e.target.value)}
                        placeholder="107.611234"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-xs font-mono text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <p className="text-[9.5px] text-emerald-700 dark:text-emerald-300 leading-tight">
                    💡 Klik tombol "Ambil GPS Saat Ini" saat Anda berada di lokasi posko, atau masukkan koordinat Google Maps.
                  </p>
                </div>

                {/* Radius Presensi */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Radius Izin Presensi (Meter)
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="3000"
                    step="50"
                    value={poskoFormRadius}
                    onChange={(e) => setPoskoFormRadius(e.target.value)}
                    placeholder="500"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-[9.5px] text-slate-400">
                    Jarak jangkauan radius presensi kegiatan (default: 500 meter).
                  </p>
                </div>

                {/* Tipe Posko: Utama vs Tambahan */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">
                      Tetapkan sebagai Posko Utama
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Posko sentral kelompok KKN untuk presensi harian
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={poskoFormIsUtama}
                    onChange={(e) => setPoskoFormIsUtama(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                </div>

                {/* Keterangan */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Keterangan / Fasilitas Posko (Opsional)
                  </label>
                  <input
                    type="text"
                    value={poskoFormKeterangan}
                    onChange={(e) => setPoskoFormKeterangan(e.target.value)}
                    placeholder="Contoh: Rumah Pak RW, Posyandu Melati..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </form>

              {/* Action Footer */}
              <div className="p-4 pb-[calc(env(safe-area-inset-bottom,16px)+16px)] border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 grid grid-cols-2 gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsPoskoModalOpen(false)}
                  className="py-3.5 rounded-2xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition cursor-pointer text-xs flex items-center justify-center"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  form="form-posko-kkn"
                  disabled={isSubmittingPosko || !poskoFormNama.trim() || !poskoFormLat.trim() || !poskoFormLng.trim()}
                  className="py-3.5 bg-[#035941] hover:bg-emerald-700 text-white rounded-2xl font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50 text-xs active:scale-95"
                >
                  {isSubmittingPosko ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check size={15} />
                      <span>{isEditingPosko ? "Simpan Perubahan" : "Daftarkan Posko"}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default MahasiswaProkerMobile;

