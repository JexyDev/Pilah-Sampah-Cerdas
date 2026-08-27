/**
 * Project: BERSEKA - Kurasi Kegiatan Landing Page
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Plus,
  Trash2,
  Edit,
  CheckCircle2,
  Calendar,
  MapPin,
  Download,
  AlertCircle,
  Save,
  RefreshCw,
  Image as ImageIcon,
  BookOpen,
  Layers,
} from "lucide-react";
import api from "../../services/api";
import showToast from "../../utils/showToast";
import { useAuthStore } from "../../store/useAuthStore";

export interface CuratedActivityItem {
  id: string;
  prokerId?: string | null;
  kelompokId?: string | null;
  kelompokNama?: string | null;
  title: string;
  date: string;
  location: string;
  category: string;
  imageUrl: string;
  description: string;
  sdgTags: string[];
  isPublished: boolean;
  isStrictRelation?: boolean;
}

export const KurasiLandingPage: React.FC = () => {
  const { user } = useAuthStore();
  const isDeveloper = user?.peran === "DEVELOPER" || (user as any)?.role === "DEVELOPER";

  const [activities, setActivities] = useState<CuratedActivityItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // Form modal state
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<CuratedActivityItem>({
    id: "",
    prokerId: null,
    kelompokId: null,
    kelompokNama: null,
    title: "",
    date: new Date().toISOString().slice(0, 10),
    location: "Kecamatan Coblong, Kota Bandung",
    category: "Edukasi Pemilahan",
    imageUrl: "/uploads/default-pemanfaatan.jpg",
    description: "",
    sdgTags: ["#3", "#11"],
    isPublished: true,
  });

  // Candidate import modal state (Proker & Logbook)
  const [showCandidateModal, setShowCandidateModal] = useState<boolean>(false);
  const [candidateTab, setCandidateTab] = useState<"proker" | "logbook">("proker");
  const [prokerCandidates, setProkerCandidates] = useState<any[]>([]);
  const [logbookCandidates, setLogbookCandidates] = useState<any[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState<boolean>(false);

  const categoryOptions = [
    "Edukasi Pemilahan",
    "Pengolahan Kompos & Maggot",
    "Aksi Bersih Lingkungan",
    "Pemanfaatan Daur Ulang",
    "Sosialisasi Kode QR",
    "Monitoring & Pengangkutan",
    "Lainnya",
  ];

  const sdgOptions = [
    { tag: "#3", label: "SDG 3: Kehidupan Sehat & Sejahtera" },
    { tag: "#4", label: "SDG 4: Pendidikan Berkualitas" },
    { tag: "#11", label: "SDG 11: Kota & Permukiman Berkelanjutan" },
    { tag: "#12", label: "SDG 12: Konsumsi & Produksi Bertanggung Jawab" },
    { tag: "#13", label: "SDG 13: Penanganan Perubahan Iklim" },
    { tag: "#15", label: "SDG 15: Ekosistem Daratan" },
  ];

  const fetchCuratedActivities = async () => {
    setLoading(true);
    try {
      const res = await api.get("/system/landing-curated");
      if (res.data?.success && Array.isArray(res.data?.data)) {
        setActivities(res.data.data);
      }
    } catch (err) {
      console.warn("[KurasiLandingPage] Failed fetching activities:", err);
      showToast.error("Gagal memuat data kurasi kegiatan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCuratedActivities();
  }, []);

  const handleOpenAddModal = () => {
    setEditingIndex(null);
    setFormData({
      id: `curated-${Date.now()}`,
      title: "",
      date: new Date().toISOString().slice(0, 10),
      location: "Kelurahan Lebak Gede, Kec. Coblong",
      category: "Edukasi Pemilahan",
      imageUrl: "/uploads/default-pemanfaatan.jpg",
      description: "",
      sdgTags: ["#3", "#11", "#12"],
      isPublished: true,
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (index: number) => {
    setEditingIndex(index);
    setFormData({ ...activities[index] });
    setShowModal(true);
  };

  const handleTogglePublished = async (index: number) => {
    const updated = [...activities];
    updated[index].isPublished = !updated[index].isPublished;
    setActivities(updated);
    await saveActivitiesToServer(updated, false);
  };

  const handleDelete = async (index: number) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus kegiatan ini dari daftar kurasi?")) {
      return;
    }
    const updated = activities.filter((_, idx) => idx !== index);
    setActivities(updated);
    await saveActivitiesToServer(updated, true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast.error("Judul kegiatan wajib diisi");
      return;
    }

    let updated: CuratedActivityItem[];
    if (editingIndex !== null) {
      updated = [...activities];
      updated[editingIndex] = formData;
    } else {
      updated = [formData, ...activities];
    }

    setActivities(updated);
    setShowModal(false);
    await saveActivitiesToServer(updated, true);
  };

  const saveActivitiesToServer = async (items: CuratedActivityItem[], showSuccessToast = true) => {
    setSaving(true);
    try {
      const res = await api.post("/system/landing-curated", { activities: items });
      if (res.data?.success) {
        if (showSuccessToast) {
          showToast.success("Kurasi kegiatan Landing Page berhasil disimpan");
        }
      }
    } catch (err) {
      console.error("[KurasiLandingPage] Failed saving activities:", err);
      showToast.error("Gagal menyimpan ke server");
    } finally {
      setSaving(false);
    }
  };

  const fetchCandidateSources = async () => {
    setLoadingCandidates(true);
    setShowCandidateModal(true);
    try {
      const [resLogbook, resProker] = await Promise.all([
        api.get("/system/landing-curated/logbook-sources"),
        api.get("/system/landing-curated/proker-sources"),
      ]);
      if (resLogbook.data?.success && Array.isArray(resLogbook.data?.data)) {
        setLogbookCandidates(resLogbook.data.data);
      }
      if (resProker.data?.success && Array.isArray(resProker.data?.data)) {
        setProkerCandidates(resProker.data.data);
      }
    } catch (err) {
      console.warn("[KurasiLandingPage] Failed fetching candidate sources:", err);
      showToast.error("Gagal memuat kandidat kegiatan KKN");
    } finally {
      setLoadingCandidates(false);
    }
  };

  const handleImportProker = (proker: any) => {
    let rawTitle = proker.judul;
    let rawDesc = proker.deskripsi || "";

    if (!rawTitle && rawDesc.startsWith("**")) {
      const match = rawDesc.match(/^\*\*(.*?)\*\*/);
      if (match && match[1]) {
        rawTitle = match[1];
        rawDesc = rawDesc.replace(/^\*\*.*?\*\*\s*/, "").trim();
      }
    }
    if (!rawTitle) {
      const lines = rawDesc.split("\n").map((l: string) => l.trim()).filter(Boolean);
      rawTitle = lines[0] ? lines[0].replace(/\*\*/g, "").replace(/^#+\s*/, "") : "Program Kerja Mahasiswa KKN";
      if (lines.length > 1) {
        rawDesc = lines.slice(1).join("\n\n");
      }
    }

    if (proker.kelompokNama && !rawTitle.includes(proker.kelompokNama)) {
      rawTitle += ` (${proker.kelompokNama})`;
    }

    const rwStr = Array.isArray(proker.cakupanRw) && proker.cakupanRw.length > 0 ? `RW ${proker.cakupanRw.join(", RW ")}` : "";
    const locationText = [rwStr, proker.kelurahan ? `Kelurahan ${proker.kelurahan}` : "Kecamatan Coblong"].filter(Boolean).join(", ");

    let category = proker.kategori || "Aksi Lingkungan";
    let img = "/uploads/1787810753706-6e97bf38-1c6b-4336-a20f-e67182c87ade.jpg";
    let sdgTags = ["#11", "#12", "#13"];

    const catLower = (proker.kategori || "").toLowerCase();
    const descLower = (rawDesc + " " + rawTitle).toLowerCase();

    if (catLower.includes("pengolahan") || descLower.includes("kompos") || descLower.includes("maggot")) {
      category = "Pengolahan Kompos & Maggot";
      img = "/uploads/1787810430897-88c05dc9-798a-4a53-aa83-b1f47853bedc.jpg";
      sdgTags = ["#12", "#13", "#15"];
    } else if (catLower.includes("pemilahan") || descLower.includes("pilah") || descLower.includes("edukasi")) {
      category = "Edukasi Pemilahan";
      img = "/uploads/1787800993979-3bea1d8c-fc69-46a9-b1c2-c9d37e4f4a83.jpg";
      sdgTags = ["#3", "#11", "#12"];
    } else if (catLower.includes("pemanfaatan") || descLower.includes("daur ulang") || descLower.includes("bank sampah")) {
      category = "Pemanfaatan Daur Ulang";
      img = "/uploads/1787803766196-a4f6ca4f-943e-4ddb-a1aa-d6a7d9727097.jpg";
      sdgTags = ["#11", "#12", "#13"];
    }

    setEditingIndex(null);
    setFormData({
      id: `proker-${proker.id || Date.now()}`,
      prokerId: proker.id,
      kelompokId: proker.kelompokId,
      kelompokNama: proker.kelompokNama,
      title: rawTitle,
      date: proker.dibuatPada ? new Date(proker.dibuatPada).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      location: locationText || "Kecamatan Coblong, Kota Bandung",
      category,
      imageUrl: proker.fotoBuktiUrl || img,
      description: rawDesc || `Program kerja ${rawTitle} yang diinisiasi oleh ${proker.kelompokNama || "Mahasiswa KKN"} bersama warga setempat.`,
      sdgTags,
      isPublished: true,
      isStrictRelation: true,
    });
    setShowCandidateModal(false);
    setShowModal(true);
  };

  const handleImportLogbook = (logbook: any) => {
    const rawDate = logbook.tanggalKegiatan
      ? new Date(logbook.tanggalKegiatan).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);

    const locationText = logbook.tempat
      ? `${logbook.tempat}, Kelurahan ${logbook.kelurahan || "Coblong"}`
      : `Kelurahan ${logbook.kelurahan || "Lebak Gede"}, Kec. Coblong`;

    const cleanTitle = logbook.prokerDeskripsi
      ? `${logbook.prokerDeskripsi.replace(/\*\*/g, "").slice(0, 60)} (${logbook.kelompokNama || "KKN"})`
      : logbook.deskripsi
      ? logbook.deskripsi.split("\n")[0].replace(/\*\*/g, "").slice(0, 75)
      : `Aksi Lingkungan Mahasiswa di ${logbook.tempat || "Coblong"}`;

    let img = logbook.fotoBuktiUrl || "/uploads/1787810753706-6e97bf38-1c6b-4336-a20f-e67182c87ade.jpg";

    setEditingIndex(null);
    setFormData({
      id: `curated-log-${logbook.id || Date.now()}`,
      title: cleanTitle,
      date: rawDate,
      location: locationText,
      category: logbook.prokerKategori || "Edukasi & Sosialisasi",
      imageUrl: img,
      description: logbook.deskripsi || "Dokumentasi kegiatan lapangan mahasiswa KKN terpadu bersama masyarakat.",
      sdgTags: ["#3", "#11", "#12"],
      isPublished: true,
    });
    setShowCandidateModal(false);
    setShowModal(true);
  };

  const handleResetToRealProkerDefaults = async () => {
    if (!window.confirm("Sinkronkan otomatis daftar kurasi kegiatan Landing Page langsung dari data Program Kerja riil mahasiswa di database?")) {
      return;
    }
    setSaving(true);
    try {
      const res = await api.post("/system/landing-curated/sync-prokers");
      if (res.data?.success && Array.isArray(res.data?.data)) {
        setActivities(res.data.data);
        showToast.success("Berhasil menyinkronkan kegiatan dari Program Kerja riil mahasiswa");
      } else {
        fetchCuratedActivities();
      }
    } catch (err) {
      console.error("[KurasiLandingPage] Failed syncing real prokers:", err);
      showToast.error("Gagal menyinkronkan data proker riil");
    } finally {
      setSaving(false);
    }
  };

  const toggleSdgTag = (tag: string) => {
    if (formData.sdgTags.includes(tag)) {
      setFormData({
        ...formData,
        sdgTags: formData.sdgTags.filter((t) => t !== tag),
      });
    } else {
      setFormData({
        ...formData,
        sdgTags: [...formData.sdgTags, tag],
      });
    }
  };

  if (!isDeveloper) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-rose-200 dark:border-rose-900/40 my-6 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shadow-xs">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Akses Terbatas: Khusus Developer</h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md leading-relaxed font-medium">
          Halaman kurasi konten dan kegiatan Landing Page diproteksi ketat dan hanya dapat diakses serta di-CRUD oleh akun dengan peran <strong>DEVELOPER</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/60 dark:border-emerald-800/40">
                <Sparkles size={20} />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Kurasi Kegiatan Landing Page
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              Kelola dan validasi kegiatan riil yang dipublikasikan pada seksi <strong>Kegiatan Terbaru</strong> di Landing Page publik BERSEKA. Mencegah kebocoran data simulasi/testing absensi ke pengunjung publik.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleResetToRealProkerDefaults}
              className="px-4 py-2.5 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/80 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs flex items-center gap-2 transition cursor-pointer shadow-2xs"
              title="Reset dan isi otomatis kurasi dengan program kerja mahasiswa KKN riil"
            >
              <Sparkles size={15} />
              <span>Sinkronkan Sorotan Proker Real</span>
            </button>

            <button
              onClick={fetchCandidateSources}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-2xs"
            >
              <Download size={15} />
              <span>Tarik dari Proker / Logbook Real</span>
            </button>

            <button
              onClick={handleOpenAddModal}
              className="px-5 py-2.5 rounded-2xl bg-[#035941] hover:bg-[#024633] text-white font-extrabold text-xs flex items-center gap-2 transition cursor-pointer shadow-md shadow-[#035941]/20"
            >
              <Plus size={16} />
              <span>Tambah Sorotan Kegiatan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/40 rounded-2xl p-4 flex items-start gap-3 text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
        <AlertCircle size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <strong>Aturan Publikasi:</strong> Hanya kegiatan yang berstatus <strong>Publik (Aktif)</strong> yang akan ditampilkan kepada pengunjung Landing Page (maksimal 6 kegiatan terbaru). Pengunjung dapat mengklik kartu kegiatan untuk membaca foto dan narasi lengkap secara interaktif.
        </div>
      </div>

      {/* Activities Grid / Table */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
          <RefreshCw size={28} className="animate-spin text-emerald-600" />
          <p className="text-xs font-semibold">Memuat daftar kurasi kegiatan...</p>
        </div>
      ) : activities.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Sparkles size={28} />
          </div>
          <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-200">
            Belum Ada Kegiatan Dikurasi
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Klik tombol di atas untuk menambahkan sorotan kegiatan riil pertama Anda atau menarik data dari Logbook KKN mahasiswa yang telah disetujui DPL.
          </p>
          <button
            onClick={handleOpenAddModal}
            className="px-5 py-2.5 rounded-2xl bg-[#035941] text-white font-extrabold text-xs inline-flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Tambah Kegiatan Sekarang</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map((item, index) => (
            <div
              key={item.id || index}
              className={`bg-white dark:bg-slate-900 rounded-3xl border overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                item.isPublished
                  ? "border-slate-200/80 dark:border-slate-800"
                  : "border-amber-200 dark:border-amber-800/60 opacity-75"
              }`}
            >
              <div>
                {/* Photo Header */}
                <div className="relative h-44 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <img
                    src={item.imageUrl || "/uploads/default-pemanfaatan.jpg"}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/uploads/default-pemanfaatan.jpg";
                    }}
                  />
                  <div className="absolute top-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-xl text-[11px] font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5 shadow-sm">
                    <Calendar size={12} className="text-emerald-600" />
                    <span>{item.date}</span>
                  </div>

                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${
                        item.isPublished
                          ? "bg-emerald-600 text-white"
                          : "bg-amber-500 text-white"
                      }`}
                    >
                      {item.isPublished ? "Publik" : "Draft"}
                    </span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center flex-wrap gap-1.5">
                    {item.prokerId ? (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
                        Proker #{item.prokerId.slice(0, 8)}
                      </span>
                    ) : item.kelompokNama ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                        {item.kelompokNama}
                      </span>
                    ) : null}
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
                      {item.category}
                    </span>
                    {item.sdgTags?.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-medium">
                    {item.description || "Tidak ada deskripsi rinci."}
                  </p>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <MapPin size={13} className="text-[#035941] shrink-0" />
                    <span className="truncate">{item.location}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleTogglePublished(index)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition cursor-pointer flex items-center gap-1.5 ${
                    item.isPublished
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                      : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                  }`}
                >
                  <CheckCircle2 size={13} />
                  <span>{item.isPublished ? "Sembunyikan" : "Publikasikan"}</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(index)}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition cursor-pointer"
                    title="Edit Kegiatan"
                  >
                    <Edit size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(index)}
                    className="p-2 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                    title="Hapus dari Kurasi"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ----------------- MODAL FORM TAMBAH / EDIT KEGIATAN ----------------- */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-100 dark:border-slate-800 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Sparkles size={16} />
                </div>
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                  {editingIndex !== null ? "Edit Sorotan Kegiatan" : "Tambah Sorotan Kegiatan Publik"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              {/* Judul Kegiatan */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-700 dark:text-slate-300">
                  Judul Kegiatan Publik <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Misal: Edukasi Pemilahan Sampah Organik di RW 03"
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:outline-emerald-500 text-xs"
                />
              </div>

              {/* Tanggal & Kategori */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-700 dark:text-slate-300">
                    Tanggal Pelaksanaan
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:outline-emerald-500 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-700 dark:text-slate-300">
                    Kategori Kegiatan
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:outline-emerald-500 text-xs"
                  >
                    {categoryOptions.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Lokasi */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-700 dark:text-slate-300">
                  Lokasi Pelaksanaan (Kelurahan / RW)
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Misal: Balai RW 03, Kelurahan Lebak Gede, Kec. Coblong"
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:outline-emerald-500 text-xs"
                />
              </div>

              {/* Foto Dokumentasi */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-700 dark:text-slate-300">
                  URL Foto Dokumentasi HD Mahasiswa
                </label>
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="URL Foto unggahan mahasiswa (misal: /uploads/... atau https://...)"
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:outline-emerald-500 text-xs"
                />

                {/* Candidate Photos from Real Logbooks */}
                {logbookCandidates.filter((l) => l.fotoBuktiUrl && l.fotoBuktiUrl.length > 5).length > 0 && (
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <span className="text-[11px] text-slate-400 font-bold">Foto Logbook Riil:</span>
                    {logbookCandidates
                      .filter((l) => l.fotoBuktiUrl && l.fotoBuktiUrl.length > 5)
                      .slice(0, 6)
                      .map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, imageUrl: p.fotoBuktiUrl })}
                          className={`text-[10px] font-extrabold px-2.5 py-1 rounded-xl border transition cursor-pointer ${
                            formData.imageUrl === p.fotoBuktiUrl
                              ? "bg-emerald-600 text-white border-emerald-600"
                              : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {p.kelompokNama || p.tempat || "Foto Logbook"}
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {/* Deskripsi / Narasi Lengkap */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-700 dark:text-slate-300">
                  Narasi & Deskripsi Lengkap (Tampil di Modal Pengunjung)
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Jelaskan dampak kegiatan, pihak yang terlibat, dan hasil aksi pemilahan..."
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:outline-emerald-500 text-xs"
                />
              </div>

              {/* SDGs Terkait */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-700 dark:text-slate-300">
                  Komitmen SDGs Terkait
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {sdgOptions.map((sdg) => {
                    const isSelected = formData.sdgTags.includes(sdg.tag);
                    return (
                      <button
                        key={sdg.tag}
                        type="button"
                        onClick={() => toggleSdgTag(sdg.tag)}
                        className={`text-[11px] font-bold px-3 py-1 rounded-xl border transition cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-500 font-extrabold"
                            : "bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <span>{sdg.tag}</span>
                        <span>{isSelected ? "✓" : "+"}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Toggle Publikasi */}
              <div className="pt-2 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label
                  htmlFor="isPublished"
                  className="font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  Tampilkan langsung pada Landing Page Publik
                </label>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-2xl bg-[#035941] hover:bg-[#024633] text-white font-extrabold text-xs flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Save size={15} />
                  <span>{saving ? "Menyimpan..." : "Simpan Kegiatan"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL IMPOR DARI PROKER & LOGBOOK KKN RIIL ----------------- */}
      {showCandidateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-100 dark:border-slate-800 my-8 max-h-[88vh] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                    <Download size={18} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                      Tarik dari Data Mahasiswa KKN (Riil)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Pilih program kerja atau logbook mahasiswa KKN dari database untuk dijadikan sorotan Landing Page.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCandidateModal(false)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition text-lg"
                >
                  ✕
                </button>
              </div>

              {/* Tabs Switcher */}
              <div className="flex items-center gap-2 pt-4 pb-2">
                <button
                  type="button"
                  onClick={() => setCandidateTab("proker")}
                  className={`px-4 py-2 rounded-xl font-extrabold text-xs flex items-center gap-2 transition cursor-pointer ${
                    candidateTab === "proker"
                      ? "bg-[#035941] text-white shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  }`}
                >
                  <BookOpen size={14} />
                  <span>Program Kerja Mahasiswa ({prokerCandidates.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCandidateTab("logbook")}
                  className={`px-4 py-2 rounded-xl font-extrabold text-xs flex items-center gap-2 transition cursor-pointer ${
                    candidateTab === "logbook"
                      ? "bg-[#035941] text-white shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  }`}
                >
                  <Layers size={14} />
                  <span>Logbook Lapangan ({logbookCandidates.length})</span>
                </button>
              </div>

              <div className="py-2 space-y-3 overflow-y-auto max-h-[48vh] pr-1">
                {loadingCandidates ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                    <RefreshCw size={24} className="animate-spin text-emerald-600" />
                    <span className="text-xs">Memuat data riil dari database...</span>
                  </div>
                ) : candidateTab === "proker" ? (
                  prokerCandidates.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-xs font-semibold">
                      Belum ada data Program Kerja Mahasiswa KKN di database.
                    </div>
                  ) : (
                    prokerCandidates.map((proker) => (
                      <div
                        key={proker.id}
                        className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-emerald-500 transition"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                              {proker.kelompokNama || "Kelompok KKN"}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/40">
                              {proker.kategori || "Program Kerja"}
                            </span>
                            {proker.kelurahan && (
                              <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                                <MapPin size={11} />
                                Kel. {proker.kelurahan}
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug">
                            {(proker.deskripsi || "").replace(/\*\*/g, "")}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleImportProker(proker)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shrink-0 cursor-pointer shadow-xs"
                        >
                          Impor Proker →
                        </button>
                      </div>
                    ))
                  )
                ) : logbookCandidates.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs font-semibold">
                    Belum ada logbook KKN lapangan di database.
                  </div>
                ) : (
                  logbookCandidates.map((log) => (
                    <div
                      key={log.id}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-emerald-500 transition"
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {log.fotoBuktiUrl ? (
                          <img
                            src={log.fotoBuktiUrl}
                            alt="Bukti"
                            className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/uploads/default-pemanfaatan.jpg";
                            }}
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                            <ImageIcon size={18} className="text-slate-400" />
                          </div>
                        )}
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                              {log.kelompokNama || "KKN"}
                            </span>
                            <span className="text-[11px] text-slate-400 font-semibold">
                              {log.tanggalKegiatan ? new Date(log.tanggalKegiatan).toLocaleDateString("id-ID") : "-"}
                            </span>
                          </div>
                          <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 line-clamp-1">
                            {log.tempat ? `Kegiatan di ${log.tempat}` : log.prokerDeskripsi ? log.prokerDeskripsi.replace(/\*\*/g, "") : log.deskripsi}
                          </p>
                          <p className="text-[11px] text-slate-500 line-clamp-1">
                            {log.deskripsi}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleImportLogbook(log)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shrink-0 cursor-pointer shadow-xs"
                      >
                        Impor Logbook →
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowCandidateModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-xs cursor-pointer hover:bg-slate-200"
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

export default KurasiLandingPage;
