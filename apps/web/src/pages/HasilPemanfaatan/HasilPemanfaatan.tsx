import React, { useEffect, useState, useMemo } from "react";
import {
  MessageSquare,
  Sparkles,
  Search,
  Filter,
  Loader2,
  Plus,
  Star,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  X,
  MessageCircle,
  Trash2,
  Building2,
  PackageCheck,
  Leaf,
  Boxes,
  TrendingUp,
  MapPin,
} from "lucide-react";
import pemanfaatanApiService, { type FeedbackItem, type PemanfaatanProgram } from "../../services/pemanfaatanService";
import showToast from "../../utils/showToast";
import { useAuthStore } from "../../store/useAuthStore";
import { Pagination } from "../../components/common/Pagination";
import { EmptyTableState } from "../../components/common/EmptyTableState";
import { ConfirmModal } from "../../components/common/ConfirmModal";
import PageHeader from "../../components/common/PageHeader";

export const HasilPemanfaatan: React.FC = () => {
  const { user } = useAuthStore();
  const [activeSectionTab, setActiveSectionTab] = useState<"HASIL" | "FEEDBACK">("HASIL");

  // Feedback State
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Program / Product Outputs State
  const [programs, setPrograms] = useState<PemanfaatanProgram[]>([]);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [kategoriFilter, setKategoriFilter] = useState<string>("ALL");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRespondModal, setShowRespondModal] = useState(false);
  const [selectedItemForRespond, setSelectedItemForRespond] = useState<FeedbackItem | null>(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  // Form states - Add Feedback
  const [formJudul, setFormJudul] = useState("");
  const [formKategori, setFormKategori] = useState("Pengolahan Kompos");
  const [formIsi, setFormIsi] = useState("");
  const [formRating, setFormRating] = useState(5);
  const [formFotoUrl, setFormFotoUrl] = useState("");
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // Form states - Respond Feedback
  const [respondTanggapan, setRespondTanggapan] = useState("");
  const [respondStatus, setRespondStatus] = useState<string>("SELESAI");
  const [submittingRespond, setSubmittingRespond] = useState(false);
  const [deleteFeedbackId, setDeleteFeedbackId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchFeedbackList = async () => {
    try {
      setLoading(true);
      const data = await pemanfaatanApiService.getFeedbackList();
      setItems(data);
    } catch (e: any) {
      console.warn("[HasilPemanfaatan] Gagal memuat feedback:", e?.message || e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProgramList = async () => {
    try {
      const data = await pemanfaatanApiService.getPrograms();
      setPrograms(data);
    } catch (e: any) {
      console.warn("[HasilPemanfaatan] Gagal memuat program:", e?.message || e);
      setPrograms([]);
    }
  };

  useEffect(() => {
    fetchFeedbackList();
    fetchProgramList();
  }, []);

  const isDpl = ["DPL", "DOSEN_PEMBIMBING"].includes(user?.peran || "");
  const dplKelurahan = user?.kelurahan || "";

  // Extract DPL assigned RW numbers from dplKelompok
  const dplCakupanRwNumbers = useMemo(() => {
    if (!isDpl || !user?.dplKelompok) return [];
    const rws: string[] = [];
    user.dplKelompok.forEach((k: any) => {
      if (Array.isArray(k.cakupanRw)) {
        rws.push(...k.cakupanRw.map(String));
      } else if (typeof k.cakupanRw === "string" || typeof k.cakupanRw === "number") {
        rws.push(String(k.cakupanRw));
      }
    });
    return rws.map((r) => r.toLowerCase().replace(/^rw\s*/i, "").trim());
  }, [user, isDpl]);

  // Filtered feedback calculation
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = (searchQuery || "").toLowerCase().trim();
      const rwName = item?.rw?.name || (item?.rwId ? `RW ${item.rwId}` : "");
      const kelName = item?.rw?.kelurahan?.name || "";
      const rwNumberMatch = rwName.toLowerCase().replace(/^rw\s*/i, "").trim();

      const matchesSearch =
        !q ||
        (item?.wargaNama || "").toLowerCase().includes(q) ||
        (item?.judul || "").toLowerCase().includes(q) ||
        (item?.isiKritikSaran || "").toLowerCase().includes(q) ||
        (item?.kategori || "").toLowerCase().includes(q) ||
        rwName.toLowerCase().includes(q) ||
        kelName.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "ALL" ? true : item?.status === statusFilter;

      const matchesKategori =
        kategoriFilter === "ALL" ? true : (item?.kategori || "").toLowerCase() === (kategoriFilter || "").toLowerCase();

      const matchesDplKelurahan =
        !isDpl || !dplKelurahan || kelName.toLowerCase().includes((dplKelurahan || "").toLowerCase());

      const matchesDplRw =
        !isDpl || dplCakupanRwNumbers.length === 0 || dplCakupanRwNumbers.includes(rwNumberMatch);

      return matchesSearch && matchesStatus && matchesKategori && matchesDplKelurahan && matchesDplRw;
    });
  }, [items, searchQuery, statusFilter, kategoriFilter, isDpl, dplKelurahan, dplCakupanRwNumbers]);

  // Filtered programs calculation
  const filteredPrograms = useMemo(() => {
    return programs.filter((p) => {
      const q = (searchQuery || "").toLowerCase().trim();
      const rwName = p?.rw?.name || (p?.rwId ? `RW ${p.rwId}` : "");
      const kelName = p?.rw?.kelurahan?.name || "";
      const rwNumberMatch = rwName.toLowerCase().replace(/^rw\s*/i, "").trim();
      const matchesSearch =
        !q ||
        (p?.namaProgram || "").toLowerCase().includes(q) ||
        (p?.jenisProgram || "").toLowerCase().includes(q) ||
        (p?.lokasiFasilitas || "").toLowerCase().includes(q) ||
        (p?.targetPenerimaManfaat || "").toLowerCase().includes(q) ||
        rwName.toLowerCase().includes(q) ||
        kelName.toLowerCase().includes(q);

      const matchesKategori =
        kategoriFilter === "ALL" ? true : (p?.jenisProgram || "").toLowerCase().includes((kategoriFilter || "").toLowerCase());

      const matchesDplKelurahan =
        !isDpl || !dplKelurahan || kelName.toLowerCase().includes((dplKelurahan || "").toLowerCase());

      const matchesDplRw =
        !isDpl || dplCakupanRwNumbers.length === 0 || dplCakupanRwNumbers.includes(rwNumberMatch);

      return matchesSearch && matchesKategori && matchesDplKelurahan && matchesDplRw;
    });
  }, [programs, searchQuery, kategoriFilter, isDpl, dplKelurahan, dplCakupanRwNumbers]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, kategoriFilter, itemsPerPage, activeSectionTab]);

  const activeDatasetLength = activeSectionTab === "HASIL" ? filteredPrograms.length : filteredItems.length;

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(activeDatasetLength / itemsPerPage));
  }, [activeDatasetLength, itemsPerPage]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  const paginatedPrograms = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPrograms.slice(start, start + itemsPerPage);
  }, [filteredPrograms, currentPage, itemsPerPage]);

  // Metrics summary - Feedback
  const totalCount = items.length;
  const pendingCount = items.filter((i) => i.status === "MENUNGGU").length;
  const inProgressCount = items.filter((i) => i.status === "DALAM_PROSES").length;
  const resolvedCount = items.filter((i) => i.status === "SELESAI").length;
  const avgRating = useMemo(() => {
    if (items.length === 0) return "5.00";
    const sum = items.reduce((acc, curr) => acc + (curr.rating || 5), 0);
    return (sum / items.length).toFixed(2);
  }, [items]);

  // Metrics summary - Products
  const totalPanenKg = useMemo(() => {
    return programs.reduce((acc, curr) => acc + (curr.jumlahHasilKg || 0), 0);
  }, [programs]);

  const totalNilaiEkonomi = useMemo(() => {
    return programs.reduce((acc, curr) => acc + (curr.nilaiEkonomiRp || 0), 0);
  }, [programs]);

  const totalBahanMasukKg = useMemo(() => {
    return programs.reduce((acc, curr) => acc + (curr.jumlahBahanMasukKg || 0), 0);
  }, [programs]);

  // Handlers - Submit New Feedback
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formJudul.trim() || !formIsi.trim()) {
      showToast.error("Judul dan isi kritik/saran wajib diisi");
      return;
    }

    try {
      setSubmittingAdd(true);
      const res = await pemanfaatanApiService.createFeedback({
        judul: formJudul,
        kategori: formKategori,
        isiKritikSaran: formIsi,
        rating: formRating,
        fotoBuktiUrl: formFotoUrl || null,
      });

      if (res && (res.success || res.id)) {
        showToast.success("Kritik & saran berhasil disampaikan");
        setShowAddModal(false);
        setFormJudul("");
        setFormIsi("");
        setFormRating(5);
        setFormFotoUrl("");
        fetchFeedbackList();
      }
    } catch (e: any) {
      showToast.error(e.response?.data?.message || "Gagal mengirim kritik & saran");
    } finally {
      setSubmittingAdd(false);
    }
  };

  // Handlers - Respond Feedback
  const openRespondModal = (item: FeedbackItem) => {
    setSelectedItemForRespond(item);
    setRespondTanggapan(item.tanggapan || "");
    setRespondStatus(item.status === "MENUNGGU" ? "SELESAI" : item.status);
    setShowRespondModal(true);
  };

  const handleRespondSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForRespond) return;
    if (!respondTanggapan.trim()) {
      showToast.error("Tanggapan resmi tidak boleh kosong");
      return;
    }

    try {
      setSubmittingRespond(true);
      const res = await pemanfaatanApiService.respondFeedback(selectedItemForRespond.id, {
        tanggapan: respondTanggapan,
        status: respondStatus,
      });

      if (res && res.success) {
        showToast.success("Tanggapan resmi berhasil disimpan");
        setShowRespondModal(false);
        setSelectedItemForRespond(null);
        setRespondTanggapan("");
        fetchFeedbackList();
      }
    } catch (e: any) {
      showToast.error(e.response?.data?.message || "Gagal menyimpan tanggapan");
    } finally {
      setSubmittingRespond(false);
    }
  };

  // Handlers - Delete Feedback
  const handleDelete = (id: string) => {
    setDeleteFeedbackId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteFeedbackId) return;
    try {
      setIsDeleting(true);
      const res = await pemanfaatanApiService.deleteFeedback(deleteFeedbackId);
      if (res && res.success) {
        showToast.success("Kritik & saran berhasil dihapus");
        setDeleteFeedbackId(null);
        fetchFeedbackList();
      }
    } catch (e: any) {
      showToast.error(e.response?.data?.message || "Gagal menghapus kritik & saran");
    } finally {
      setIsDeleting(false);
    }
  };

  const isManagementRole = [
    "DEVELOPER",
    "SUPER_USER",
    "ADMIN_DLH",
    "PEMIMPIN",
    "RW",
    "PANITIA_TASKFORCE",
  ].includes(user?.peran || "");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SELESAI":
      case "DISTRIBUSI":
      case "PANEN":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50">
            <CheckCircle2 size={13} /> {status === "DISTRIBUSI" ? "Telah Didistribusikan" : status === "PANEN" ? "Siap Panen/Terkonversi" : "Selesai Ditindaklanjuti"}
          </span>
        );
      case "DALAM_PROSES":
      case "PROSES":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-700/50">
            <Clock size={13} /> {status === "PROSES" ? "Dalam Pengolahan" : "Dalam Proses"}
          </span>
        );
      case "DITOLAK":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-700/50">
            <XCircle size={13} /> Ditolak
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700/50">
            <AlertCircle size={13} /> {status === "TERENCANA" ? "Terjadwal" : "Menunggu Tanggapan"}
          </span>
        );
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1 text-amber-400">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            className={star <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-600"}
          />
        ))}
        <span className="text-xs font-black text-slate-700 dark:text-slate-300 ml-1">{rating}.0</span>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 text-slate-800 dark:text-slate-100 font-sans">
      {/* Clean Enterprise Page Header */}
      <PageHeader
        icon={Sparkles}
        category="Hasil Olahan & Evaluasi"
        scope={
          user?.peran === "DPL" || user?.peran === "DOSEN_PEMBIMBING"
            ? user?.wilayah || (user?.kelurahan ? `Kel. ${user.kelurahan}` : "Wilayah Dampingan KKN")
            : user?.peran === "RW"
            ? `RW ${user?.rw || user?.rtRwId || ""}`
            : user?.peran === "LURAH"
            ? `Kelurahan ${user?.kelurahan || ""}`
            : user?.wilayah || "Wilayah Operasional"
        }
        title="Pemanfaatan & Hasil"
        description="Pusat pemantauan konversi produk hasil daur ulang (Kompos, Maggot BSF, Pupuk POC, Saldo Bank Sampah) dan evaluasi kepuasan pemanfaatan warga."
        actions={
          activeSectionTab === "FEEDBACK" ? (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus size={15} /> <span>Sampaikan Kritik & Saran</span>
            </button>
          ) : undefined
        }
      />

      {/* Segmented Top Navigation Sub-Tabs */}
      <div className="bg-slate-100/90 dark:bg-slate-800/90 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex items-center gap-1.5">
        <button
          onClick={() => {
            setActiveSectionTab("HASIL");
            setSearchQuery("");
            setKategoriFilter("ALL");
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeSectionTab === "HASIL"
              ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs border border-slate-200/60 dark:border-slate-800/60 dark:border-slate-700"
              : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-700/50"
          }`}
        >
          <PackageCheck size={16} />
          <span>Rekapitulasi Produk & Hasil Olahan ({programs.length})</span>
        </button>
        <button
          onClick={() => {
            setActiveSectionTab("FEEDBACK");
            setSearchQuery("");
            setKategoriFilter("ALL");
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeSectionTab === "FEEDBACK"
              ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs border border-slate-200/60 dark:border-slate-800/60 dark:border-slate-700"
              : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-700/50"
          }`}
        >
          <MessageSquare size={16} />
          <span>Aspirasi & Evaluasi Warga ({items.length})</span>
        </button>
      </div>

      {/* VIEW TAB 1: REKAPITULASI PRODUK & HASIL OLAHAN */}
      {activeSectionTab === "HASIL" && (
        <>
          {/* KPI Metric Summary Cards - Hasil Produk */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            <div className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-xl shrink-0 border border-emerald-100 dark:border-emerald-700/50">
                <Leaf className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10.5px] text-slate-400 dark:text-slate-400 font-black uppercase tracking-wider">Hasil Panen Olahan</p>
                <p className="text-lg font-black text-emerald-700 dark:text-emerald-400 mt-0.5">{totalPanenKg.toLocaleString("id-ID")} <span className="text-xs font-semibold text-slate-400">Kg/L</span></p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
              <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl shrink-0 border border-slate-200 dark:border-slate-700">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10.5px] text-slate-400 dark:text-slate-400 font-black uppercase tracking-wider">Nilai Ekonomi Daur</p>
                <p className="text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5">Rp {totalNilaiEkonomi.toLocaleString("id-ID")}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
              <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl shrink-0 border border-slate-200 dark:border-slate-700">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10.5px] text-slate-400 dark:text-slate-400 font-black uppercase tracking-wider">Total Bahan Terolah</p>
                <p className="text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5">{totalBahanMasukKg.toLocaleString("id-ID")} <span className="text-xs font-semibold text-slate-400">Kg</span></p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-xl shrink-0 border border-emerald-100 dark:border-emerald-700/50">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10.5px] text-slate-400 dark:text-slate-400 font-black uppercase tracking-wider">Program & Fasilitas</p>
                <p className="text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5">{programs.length} <span className="text-xs font-semibold text-slate-400">Titik Olahan</span></p>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar - Hasil Produk */}
          <div className="bg-white dark:bg-slate-900 p-4.5 sm:p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Cari nama program, jenis olahan, lokasi fasilitas, atau penerima manfaat..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-10 pr-4 py-2.5 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-[#009966] focus:bg-white dark:focus:bg-slate-800 transition-all"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={kategoriFilter}
                  onChange={(e) => setKategoriFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-3 py-2.5 rounded-2xl text-xs font-bold outline-none focus:border-[#009966] transition-all cursor-pointer"
                >
                  <option value="ALL">Semua Jenis Pengolahan</option>
                  <option value="Kompos">Kompos Organik (Buruan Sae)</option>
                  <option value="Maggot">Maggot BSF</option>
                  <option value="POC">Pupuk Organik Cair (POC)</option>
                  <option value="Bank Sampah">Bank Sampah Anorganik</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table Hasil Olahan & Distribusi */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50/80 dark:bg-slate-800/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-extrabold border-b border-slate-200/80 dark:border-slate-800 uppercase tracking-wider text-[10.5px]">
                  <tr>
                    <th className="px-4 py-3.5 text-center w-12">No</th>
                    <th className="px-4 py-3.5">Nama Program & Fasilitas</th>
                    <th className="px-4 py-3.5">Jenis Olahan</th>
                    <th className="px-4 py-3.5">Wilayah RW</th>
                    <th className="px-4 py-3.5 text-center">Bahan Masuk</th>
                    <th className="px-4 py-3.5 text-center">Hasil Panen</th>
                    <th className="px-4 py-3.5 text-center">Nilai Ekonomi</th>
                    <th className="px-4 py-3.5">Penerima Manfaat</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedPrograms.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 dark:bg-slate-800/80 dark:hover:bg-slate-800/50 transition">
                      <td className="px-4 py-3.5 text-center font-bold text-slate-400">
                        {(currentPage - 1) * itemsPerPage + idx + 1}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-extrabold text-slate-900 dark:text-slate-100 block text-sm">{p.namaProgram}</span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                          <MapPin size={12} /> {p.lokasiFasilitas || "Fasilitas Komunal"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {p.jenisProgram}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-700/50 px-2.5 py-0.5 rounded-md text-[11px] inline-block">
                          {p.rw?.name || `RW ${p.rwId}`} ({p.rw?.kelurahan?.name || "Wilayah Dampingan"})
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-slate-700 dark:text-slate-300">
                        {Number(p.jumlahBahanMasukKg || 0).toFixed(2)} Kg
                      </td>
                      <td className="px-4 py-3.5 text-center font-extrabold text-emerald-700 dark:text-emerald-400">
                        {Number(p.jumlahHasilKg || 0).toFixed(2)} {p.unitHasil || "Kg"}
                      </td>
                      <td className="px-4 py-3.5 text-center font-extrabold text-amber-600 dark:text-amber-400">
                        {p.nilaiEkonomiRp ? `Rp ${p.nilaiEkonomiRp.toLocaleString("id-ID")}` : "-"}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-600 dark:text-slate-300">
                        {p.targetPenerimaManfaat || "Warga Sekitar RW"}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {getStatusBadge(p.status)}
                      </td>
                    </tr>
                  ))}

                  {paginatedPrograms.length === 0 && (
                    <EmptyTableState
                      colSpan={9}
                      entityName="Produk Hasil Pemanfaatan"
                      isSearch={false}
                    />
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  onItemsPerPageChange={setItemsPerPage}
                  totalItems={activeDatasetLength}
                />
              </div>
            )}
          </div>
        </>
      )}

      {/* VIEW TAB 2: ASPIRASI & EVALUASI WARGA */}
      {activeSectionTab === "FEEDBACK" && (
        <>
          {/* KPI Metric Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
            <div className="bg-white dark:bg-slate-900 p-4.5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
              <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10.5px] text-slate-400 dark:text-slate-400 font-black uppercase tracking-wider">Total Aspirasi</p>
                <p className="text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5">{totalCount}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4.5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-2xl shrink-0 border border-amber-100 dark:border-amber-700/50">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10.5px] text-slate-400 dark:text-slate-400 font-black uppercase tracking-wider">Menunggu</p>
                <p className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">{pendingCount}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4.5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
              <div className="p-3 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 rounded-2xl shrink-0 border border-sky-100 dark:border-sky-700/50">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10.5px] text-slate-400 dark:text-slate-400 font-black uppercase tracking-wider">Dalam Proses</p>
                <p className="text-lg font-black text-sky-600 dark:text-sky-400 mt-0.5">{inProgressCount}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4.5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl shrink-0 border border-emerald-100 dark:border-emerald-700/50">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10.5px] text-slate-400 dark:text-slate-400 font-black uppercase tracking-wider">Ditindaklanjuti</p>
                <p className="text-lg font-black text-emerald-700 dark:text-emerald-400 mt-0.5">{resolvedCount}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center gap-3.5 col-span-2 lg:col-span-1">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl shrink-0 border border-amber-100 dark:border-amber-700/50">
                <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
              </div>
              <div>
                <p className="text-[10.5px] text-slate-400 dark:text-slate-400 font-black uppercase tracking-wider">Kepuasan Warga</p>
                <p className="text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5">{avgRating} <span className="text-xs font-semibold text-slate-400">/ 5.0</span></p>
              </div>
            </div>
          </div>

          {/* Interactive Controls & Filters Bar */}
          <div className="bg-white dark:bg-slate-900 p-4.5 sm:p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
            {/* Top Controls Row */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Cari berdasarkan nama warga, judul, isi kritik, atau wilayah RW..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-10 pr-4 py-2.5 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-[#009966] focus:bg-white dark:focus:bg-slate-800 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Kategori Dropdown Filter */}
              <div className="flex items-center gap-2">
                <div className="relative w-full sm:w-56">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <select
                    value={kategoriFilter}
                    onChange={(e) => setKategoriFilter(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 pl-9 pr-3 py-2.5 rounded-2xl text-xs font-bold outline-none focus:border-[#009966] transition-all cursor-pointer"
                  >
                    <option value="ALL">Semua Kategori</option>
                    <option value="Pengolahan Kompos">Pengolahan Kompos</option>
                    <option value="Bank Sampah">Bank Sampah</option>
                    <option value="Rumah Maggot BSF">Rumah Maggot BSF</option>
                    <option value="Pupuk Organik Cair (POC)">Pupuk Organik Cair (POC)</option>
                    <option value="Kualitas Layanan & Fasilitas">Kualitas Layanan &amp; Fasilitas</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Filter Status Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-t border-slate-100 dark:border-slate-800 pt-3">
              {[
                { id: "ALL", label: "Semua Status" },
                { id: "MENUNGGU", label: "Menunggu Tanggapan" },
                { id: "DALAM_PROSES", label: "Dalam Proses" },
                { id: "SELESAI", label: "Selesai Ditindaklanjuti" },
                { id: "DITOLAK", label: "Ditolak" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === tab.id
                      ? "bg-[#009966] text-white shadow-xs"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main Feedback List Section */}
          {loading ? (
            <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs text-center flex flex-col items-center justify-center gap-3">
              <Loader2 size={28} className="animate-spin text-[#009966] dark:text-emerald-400" />
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Memuat data kritik &amp; saran dari database...</p>
            </div>
          ) : paginatedItems.length === 0 ? (
            <EmptyTableState
              entityName="Aspirasi & Evaluasi Warga"
              isSearch={!!(searchQuery || statusFilter !== "ALL" || kategoriFilter !== "ALL")}
              searchQuery={searchQuery}
              onResetSearch={() => {
                setSearchQuery("");
                setStatusFilter("ALL");
                setKategoriFilter("ALL");
              }}
            />
          ) : (
            <div className="space-y-4">
              {paginatedItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-4"
                >
                  {/* Header: Citizen Info & Status Badge */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 font-extrabold flex items-center justify-center border border-emerald-100 dark:border-emerald-700/50 text-sm">
                        {(item.wargaNama || "W").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">{item.wargaNama || "Warga"}</h4>
                          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-700/50 px-2 py-0.5 rounded-md">
                            {item.rw?.name || (item.rwId ? `RW ${item.rwId}` : "Warga Binaan")}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }) : "-"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {renderStars(item.rating)}
                      {getStatusBadge(item.status)}
                    </div>
                  </div>

                  {/* Body: Title & Content */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10.5px] font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 uppercase tracking-wider">
                        {item.kategori}
                      </span>
                      <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">{item.judul}</h3>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-line">
                      {item.isiKritikSaran}
                    </p>

                    {item.fotoBuktiUrl && (
                      <div className="pt-2">
                        <button
                          onClick={() => setPreviewPhotoUrl(item.fotoBuktiUrl || null)}
                          className="group relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 w-36 h-24 block cursor-pointer"
                        >
                          <img
                            src={item.fotoBuktiUrl}
                            alt="Bukti"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <span className="absolute inset-0 bg-black/40 text-white text-[10px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            Lihat Foto
                          </span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Official Response Section (If Available) */}
                  {item.tanggapan ? (
                    <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-black">
                          <MessageCircle size={14} />
                          <span>Tanggapan Resmi Pengelola / RW:</span>
                        </div>
                        {item.ditanggapiPada && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                            {new Date(item.ditanggapiPada).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed whitespace-pre-line">
                        {item.tanggapan}
                      </p>
                      {item.ditanggapiOleh && (
                        <p className="text-[10.5px] text-emerald-700 dark:text-emerald-400 font-bold italic">
                          Oleh: {item.ditanggapiOleh}
                        </p>
                      )}
                    </div>
                  ) : null}

                  {/* Action Buttons for Management Roles */}
                  {isManagementRole && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => openRespondModal(item)}
                        className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-[#009966] dark:text-emerald-400 text-xs font-bold rounded-xl border border-emerald-200 dark:border-emerald-700/50 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <MessageCircle size={13} />
                        <span>{item.tanggapan ? "Perbarui Tanggapan" : "Beri Tanggapan Resmi"}</span>
                      </button>

                      {["DEVELOPER", "SUPER_USER"].includes(user?.peran || "") && (
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-xl transition cursor-pointer"
                          title="Hapus Kritik/Saran"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {totalPages > 1 && (
                <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    onItemsPerPageChange={setItemsPerPage}
                    totalItems={activeDatasetLength}
                  />
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modal 1: Form Sampaikan Kritik & Saran Baru */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col p-6 space-y-4 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Plus size={18} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">Sampaikan Kritik &amp; Saran</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Suara Anda membangun lingkungan yang lebih bersih</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                  Kategori Pemanfaatan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formKategori}
                  onChange={(e) => setFormKategori(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-[#009966] transition cursor-pointer"
                >
                  <option value="Pengolahan Kompos">Pengolahan Kompos</option>
                  <option value="Bank Sampah">Bank Sampah</option>
                  <option value="Rumah Maggot BSF">Rumah Maggot BSF</option>
                  <option value="Pupuk Organik Cair (POC)">Pupuk Organik Cair (POC)</option>
                  <option value="Kualitas Layanan & Fasilitas">Kualitas Layanan &amp; Fasilitas</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                  Judul Aspirasi / Topik <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Usulan Penambahan Komposter di RW 03"
                  value={formJudul}
                  onChange={(e) => setFormJudul(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-[#009966] transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                  Rating Kepuasan Daur Ulang <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormRating(star)}
                      className="cursor-pointer transition-transform hover:scale-110"
                    >
                      <Star
                        size={22}
                        className={star <= formRating ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-600"}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-black text-slate-700 dark:text-slate-300 ml-2">{formRating}.0 Dari 5.0</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                  Isi Kritik &amp; Saran <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Tuliskan masukan, kendala, atau saran konstruktif mengenai pemanfaatan sampah di lingkungan Anda..."
                  value={formIsi}
                  onChange={(e) => setFormIsi(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-[#009966] transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                  URL Foto Lampiran Bukti (Opsional)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formFotoUrl}
                  onChange={(e) => setFormFotoUrl(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-[#009966] transition"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingAdd}
                  className="px-5 py-2.5 bg-[#009966] hover:bg-[#008855] text-white text-xs font-black rounded-xl transition flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {submittingAdd ? "Mengirim..." : "Kirim Aspirasi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Form Beri Tanggapan Resmi (Admin / RW / DLH) */}
      {showRespondModal && selectedItemForRespond && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col p-6 space-y-4 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 flex items-center justify-center font-bold">
                  <MessageCircle size={18} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">Beri Tanggapan Resmi</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tanggapi aspirasi dari {selectedItemForRespond.wargaNama}</p>
                </div>
              </div>
              <button
                onClick={() => setShowRespondModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Aspirasi Summary */}
            <div className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-1">
              <p className="text-[11px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider">{selectedItemForRespond.kategori}</p>
              <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">{selectedItemForRespond.judul}</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium italic">"{selectedItemForRespond.isiKritikSaran}"</p>
            </div>

            <form onSubmit={handleRespondSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                  Status Tindak Lanjut <span className="text-rose-500">*</span>
                </label>
                <select
                  value={respondStatus}
                  onChange={(e) => setRespondStatus(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-[#009966] transition cursor-pointer"
                >
                  <option value="DALAM_PROSES">Dalam Proses</option>
                  <option value="SELESAI">Selesai Ditindaklanjuti</option>
                  <option value="DITOLAK">Ditolak</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                  Pesan Tanggapan Resmi <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Tuliskan jawaban resmi, langkah penanganan, atau tindak lanjut dari pengelola wilayah..."
                  value={respondTanggapan}
                  onChange={(e) => setRespondTanggapan(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-[#009966] transition"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRespondModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingRespond}
                  className="px-5 py-2.5 bg-[#009966] hover:bg-[#008855] text-white text-xs font-black rounded-xl transition flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {submittingRespond ? "Simpan..." : "Simpan Tanggapan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Photo Preview Modal */}
      {previewPhotoUrl && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in"
          onClick={() => setPreviewPhotoUrl(null)}
        >
          <div className="relative max-w-3xl w-full bg-white dark:bg-slate-900 p-2 rounded-3xl shadow-2xl border border-slate-700 overflow-hidden">
            <button
              onClick={() => setPreviewPhotoUrl(null)}
              className="absolute top-4 right-4 bg-slate-900/80 text-white p-2 rounded-full hover:bg-slate-900 cursor-pointer"
            >
              <X size={18} />
            </button>
            <img
              src={previewPhotoUrl}
              alt="Bukti Lampiran Foto"
              className="w-full h-auto max-h-[80vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}

      {/* Confirmation Modal Delete Feedback */}
      <ConfirmModal
        isOpen={Boolean(deleteFeedbackId)}
        onClose={() => setDeleteFeedbackId(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Hapus Kritik & Saran"
        message="Apakah Anda yakin ingin menghapus kritik & saran warga ini? Data yang dihapus tidak dapat dipulihkan."
        confirmText="Ya, Hapus"
        type="danger"
      />
    </div>
  );
};

export default HasilPemanfaatan;

