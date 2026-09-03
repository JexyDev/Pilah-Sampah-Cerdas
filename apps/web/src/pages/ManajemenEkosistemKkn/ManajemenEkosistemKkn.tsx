import React, { useState, useEffect, useMemo } from "react";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Search, 
  Loader2, 
  X, 
  GraduationCap, 
  User, 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  Crown,
  Filter,
  Users,
  MapPin,
  ChevronsLeft,
  ChevronsRight,
  UserPlus,
  UserMinus,
  Eye,
  ExternalLink,
  Phone
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { useAuthStore } from "../../store/useAuthStore";
import { ConfirmModal } from "../../components/common/ConfirmModal";
import { sortKelompokList } from "../../utils/sortUtils";

export const ManajemenEkosistemKkn: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const isDpl = ["DPL", "DOSEN_PEMBIMBING"].includes(currentUser?.peran || "");
  const isReadOnly = ["ADMIN_DLH", "CAMAT", "LURAH", "DPL", "DOSEN_PEMBIMBING"].includes(currentUser?.peran || "");

  const [activeTab, setActiveTab] = useState("kelompok");

  // Kelompok State & Pagination
  const [kelompokList, setKelompokList] = useState<any[]>([]);
  const [loadingKelompok, setLoadingKelompok] = useState(true);
  const [searchKelompok, setSearchKelompok] = useState("");
  const [filterKelurahan, setFilterKelurahan] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isKelompokModalOpen, setIsKelompokModalOpen] = useState(false);
  const [kelompokModalType, setKelompokModalType] = useState<"add" | "edit">("add");
  const [selectedKelompokId, setSelectedKelompokId] = useState<string | null>(null);
  const [kelompokForm, setKelompokForm] = useState({ name: "", dplId: "", ketuaStudentId: "", kelurahan: "", cakupanRw: "", linkGoogleDrive: "" });
  const [currentKelompokStudents, setCurrentKelompokStudents] = useState<any[]>([]);
  const [submittingKelompok, setSubmittingKelompok] = useState(false);

  // Detail & Anggota Kelompok Modal State
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDetailKelompok, setSelectedDetailKelompok] = useState<any>(null);
  const [detailStudentSearch, setDetailStudentSearch] = useState("");

  // DPL Leader Assignment State
  const [isLeaderModalOpen, setIsLeaderModalOpen] = useState(false);
  const [selectedLeaderKelompok, setSelectedLeaderKelompok] = useState<any>(null);
  const [selectedLeaderStudentId, setSelectedLeaderStudentId] = useState<string>("");
  const [submittingLeader, setSubmittingLeader] = useState(false);
  const [openedLeaderFromDetail, setOpenedLeaderFromDetail] = useState(false);

  // Members Management State
  const [allStudentsList, setAllStudentsList] = useState<any[]>([]);
  const [studentToAssignId, setStudentToAssignId] = useState("");
  const [filterStudentQuery, setFilterStudentQuery] = useState("");
  const [submittingMemberAction, setSubmittingMemberAction] = useState(false);
  const [deleteKelompokId, setDeleteKelompokId] = useState<string | null>(null);
  const [deleteUniName, setDeleteUniName] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAvailableStudents = async () => {
    try {
      const res = await api.get("/users?roleName=MAHASISWA_KKN&limit=0");
      if (res.data?.success) {
        // backend returns role as string: { role: "MAHASISWA_KKN" }
        const students = (res.data.data || []).filter(
          (u: any) => u.role === "MAHASISWA_KKN"
        );
        setAllStudentsList(students);
      }
    } catch {
      // ignore
    }
  };

  const handleAddStudentToGroup = async (studentId: string, kelompokId: string) => {
    setSubmittingMemberAction(true);
    try {
      await api.put(`/users/${studentId}`, { kelompokId });
      toast.success("Mahasiswa berhasil dialokasikan ke kelompok ini!");
      setStudentToAssignId("");
      fetchKelompok();
      fetchAvailableStudents();
      const updatedKelompokRes = await api.get(`/kelompok/${kelompokId}`);
      if (updatedKelompokRes.data?.data) {
        setSelectedDetailKelompok(updatedKelompokRes.data.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal mengalokasikan mahasiswa");
    } finally {
      setSubmittingMemberAction(false);
    }
  };

  const handleRemoveStudentFromGroup = async (studentId: string, kelompokId: string) => {
    setSubmittingMemberAction(true);
    try {
      await api.put(`/users/${studentId}`, { kelompokId: null });
      toast.success("Mahasiswa berhasil dilepas dari kelompok!");
      fetchKelompok();
      fetchAvailableStudents();
      const updatedKelompokRes = await api.get(`/kelompok/${kelompokId}`);
      if (updatedKelompokRes.data?.data) {
        setSelectedDetailKelompok(updatedKelompokRes.data.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal melepas mahasiswa");
    } finally {
      setSubmittingMemberAction(false);
    }
  };

  const handleOpenSetLeaderModal = (k: any, fromDetail = false) => {
    setSelectedLeaderKelompok(k);
    const currentKetua = k.students?.find((s: any) => s.isKetua);
    setSelectedLeaderStudentId(currentKetua?.id || "");
    setOpenedLeaderFromDetail(fromDetail);
    if (fromDetail) {
      setIsDetailModalOpen(false);
    }
    setIsLeaderModalOpen(true);
  };

  const handleCloseLeaderModal = () => {
    setIsLeaderModalOpen(false);
    if (openedLeaderFromDetail) {
      setIsDetailModalOpen(true);
      setOpenedLeaderFromDetail(false);
    }
  };

  const handleSaveLeader = async () => {
    if (!selectedLeaderKelompok) return;
    setSubmittingLeader(true);
    try {
      await api.put(`/kelompok/${selectedLeaderKelompok.id}/leader`, {
        studentId: selectedLeaderStudentId || null,
      });
      toast.success(
        selectedLeaderStudentId ? "Ketua Kelompok berhasil ditunjuk!" : "Ketua Kelompok berhasil dilepas!"
      );
      setIsLeaderModalOpen(false);
      fetchKelompok();
      if (openedLeaderFromDetail || (selectedDetailKelompok && selectedDetailKelompok.id === selectedLeaderKelompok.id)) {
        const updatedKelompokRes = await api.get(`/kelompok/${selectedLeaderKelompok.id}`);
        if (updatedKelompokRes.data?.data) {
          setSelectedDetailKelompok(updatedKelompokRes.data.data);
          if (openedLeaderFromDetail) {
            setIsDetailModalOpen(true);
          }
        }
      }
      setOpenedLeaderFromDetail(false);
    } catch (err: any) {
      console.error("[setLeader] error:", err.response?.data || err.message, {
        kelompokId: selectedLeaderKelompok.id,
        studentId: selectedLeaderStudentId,
      });
      toast.error(err.response?.data?.message || err.response?.data?.error || "Gagal memperbarui Ketua Kelompok");
    } finally {
      setSubmittingLeader(false);
    }
  };

  // DPL State
  const [dplList, setDplList] = useState<any[]>([]);
  const [loadingDpl, setLoadingDpl] = useState(true);
  const [searchDpl, setSearchDpl] = useState("");
  const [dplPage, setDplPage] = useState(1);
  const dplRowsPerPage = 12;
  const [isDplModalOpen, setIsDplModalOpen] = useState(false);
  const [dplForm, setDplForm] = useState({ name: "", email: "", phone: "", password: "", nip: "" });
  const [submittingDpl, setSubmittingDpl] = useState(false);

  // Universitas State (Hanya UNIKOM)
  const [uniList, setUniList] = useState<string[]>([
    "Universitas Komputer Indonesia (UNIKOM)"
  ]);
  const [newUniName, setNewUniName] = useState("");

  // Fetch groups
  const fetchKelompok = async () => {
    try {
      setLoadingKelompok(true);
      // Fetch all groups with limit=0 so client-side search, filtering, and pagination are instantaneous
      const res = await api.get("/kelompok?limit=0");
      if (res.data?.success) {
        const rawGroups = res.data.groups || res.data.data || (Array.isArray(res.data) ? res.data : []);
        setKelompokList(sortKelompokList(rawGroups, (k: any) => k.name));
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat kelompok KKN");
    } finally {
      setLoadingKelompok(false);
    }
  };

  // Fetch DPLs
  const fetchDpls = async () => {
    try {
      setLoadingDpl(true);
      const res = await api.get("/kelompok/dpls");
      if (res.data?.success) {
        setDplList(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat daftar DPL");
    } finally {
      setLoadingDpl(false);
    }
  };

  useEffect(() => {
    if (activeTab === "kelompok") {
      fetchKelompok();
      fetchDpls();
    } else if (activeTab === "dpl") {
      fetchDpls();
    }
  }, [activeTab]);

  // Extract unique Kelurahan list from data
  const kelurahanOptions = useMemo(() => {
    const set = new Set<string>();
    kelompokList.forEach((k) => {
      if (k.kelurahan) set.add(k.kelurahan);
    });
    // Add default Coblong kelurahans if not present
    ["Sekeloa", "Sadang Serang", "Lebak Gede", "Lebak Siliwangi", "Dago", "Cipaganti"].forEach((kel) => set.add(kel));
    return Array.from(set).sort();
  }, [kelompokList]);

  // Filtered Kelompok List
  const filteredKelompokList = useMemo(() => {
    return kelompokList.filter((k) => {
      const matchSearch =
        searchKelompok === "" ||
        (k.name || "").toLowerCase().includes(searchKelompok.toLowerCase()) ||
        (k.dpl?.name || "").toLowerCase().includes(searchKelompok.toLowerCase()) ||
        (k.kelurahan || "").toLowerCase().includes(searchKelompok.toLowerCase()) ||
        (k.students || []).some((s: any) => (s.user?.name || "").toLowerCase().includes(searchKelompok.toLowerCase()));

      const matchKelurahan =
        filterKelurahan === "ALL" ||
        (k.kelurahan || "").toLowerCase() === filterKelurahan.toLowerCase() ||
        (k.name || "").toLowerCase().includes(filterKelurahan.toLowerCase());

      return matchSearch && matchKelurahan;
    });
  }, [kelompokList, searchKelompok, filterKelurahan]);

  // Reset page to 1 on filter/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchKelompok, filterKelurahan, rowsPerPage]);

  // Paginated Kelompok
  const totalPages = Math.max(1, Math.ceil(filteredKelompokList.length / (rowsPerPage === 9999 ? filteredKelompokList.length || 1 : rowsPerPage)));
  const paginatedKelompok = useMemo(() => {
    if (rowsPerPage === 9999) return filteredKelompokList;
    const start = (currentPage - 1) * rowsPerPage;
    return filteredKelompokList.slice(start, start + rowsPerPage);
  }, [filteredKelompokList, currentPage, rowsPerPage]);

  // Filtered DPL List
  const filteredDplList = useMemo(() => {
    return dplList.filter((dp) => {
      if (!searchDpl) return true;
      const s = searchDpl.toLowerCase();
      return (
        (dp.name || "").toLowerCase().includes(s) ||
        (dp.email || "").toLowerCase().includes(s) ||
        (dp.phone || "").toLowerCase().includes(s) ||
        (dp.nip || "").toLowerCase().includes(s)
      );
    });
  }, [dplList, searchDpl]);

  const totalDplPages = Math.max(1, Math.ceil(filteredDplList.length / dplRowsPerPage));
  const paginatedDpl = useMemo(() => {
    const start = (dplPage - 1) * dplRowsPerPage;
    return filteredDplList.slice(start, start + dplRowsPerPage);
  }, [filteredDplList, dplPage]);

  // Kelompok Submit Handlers
  const handleOpenDetailKelompok = (k: any) => {
    setSelectedDetailKelompok(k);
    setDetailStudentSearch("");
    setFilterStudentQuery("");
    setStudentToAssignId("");
    setIsDetailModalOpen(true);
    fetchAvailableStudents();
  };

  const handleOpenAddKelompok = () => {
    setKelompokModalType("add");
    setKelompokForm({ name: "", dplId: "", ketuaStudentId: "", kelurahan: "", cakupanRw: "", linkGoogleDrive: "" });
    setCurrentKelompokStudents([]);
    setSelectedKelompokId(null);
    setIsKelompokModalOpen(true);
  };

  const handleOpenEditKelompok = (k: any) => {
    setKelompokModalType("edit");
    const ketuaMhs = k.students?.find((s: any) => s.isKetua);
    
    let rwStr = "";
    if (Array.isArray(k.cakupanRw)) {
      rwStr = k.cakupanRw.join(", ");
    } else if (typeof k.cakupanRw === "string") {
      rwStr = k.cakupanRw;
    }
    
    setKelompokForm({ 
      name: k.name, 
      dplId: k.dpl?.id || "", 
      ketuaStudentId: ketuaMhs?.id || "",
      kelurahan: k.kelurahan || "",
      cakupanRw: rwStr,
      linkGoogleDrive: k.linkGoogleDrive || ""
    });
    setCurrentKelompokStudents(k.students || []);
    setSelectedKelompokId(k.id);
    setIsKelompokModalOpen(true);
  };

  const handleDeleteKelompok = (id: string) => {
    setDeleteKelompokId(id);
  };

  const handleConfirmDeleteKelompok = async () => {
    if (!deleteKelompokId) return;
    try {
      setIsDeleting(true);
      await api.delete(`/kelompok/${deleteKelompokId}`);
      toast.success("Kelompok berhasil dihapus");
      setDeleteKelompokId(null);
      fetchKelompok();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menghapus kelompok");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleKelompokSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kelompokForm.name.trim()) return toast.error("Nama kelompok wajib diisi");

    setSubmittingKelompok(true);
    
    const payload = {
      name: kelompokForm.name,
      dplId: kelompokForm.dplId,
      kelurahan: kelompokForm.kelurahan,
      cakupanRw: kelompokForm.cakupanRw ? kelompokForm.cakupanRw.split(",").map(r => r.trim()).filter(Boolean) : [],
      linkGoogleDrive: kelompokForm.linkGoogleDrive
    };
    
    try {
      if (kelompokModalType === "add") {
        const res = await api.post("/kelompok", payload);
        if (kelompokForm.ketuaStudentId && res.data?.data?.id) {
          await api.put(`/kelompok/${res.data.data.id}/leader`, { studentId: kelompokForm.ketuaStudentId });
        }
        toast.success("Kelompok berhasil dibuat!");
      } else {
        await api.put(`/kelompok/${selectedKelompokId}`, payload);
        await api.put(`/kelompok/${selectedKelompokId}/leader`, { studentId: kelompokForm.ketuaStudentId || null });
        toast.success("Kelompok berhasil diperbarui!");
      }
      setIsKelompokModalOpen(false);
      fetchKelompok();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menyimpan kelompok");
    } finally {
      setSubmittingKelompok(false);
    }
  };

  // DPL Submit Handler
  const handleDplSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dplForm.name || !dplForm.email || !dplForm.phone || !dplForm.password) {
      return toast.error("Semua field wajib diisi");
    }

    setSubmittingDpl(true);
    try {
      await api.post("/auth/register/dpl", {
        name: dplForm.name,
        email: dplForm.email,
        phone: dplForm.phone,
        password: dplForm.password,
        nip: dplForm.nip || `NIP-${Date.now()}`,
        universityId: "PSC-UNIVERSITY"
      });
      toast.success("Dosen Pendamping Lapangan (DPL) berhasil didaftarkan!");
      setIsDplModalOpen(false);
      setDplForm({ name: "", email: "", phone: "", password: "", nip: "" });
      fetchDpls();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal mendaftarkan DPL");
    } finally {
      setSubmittingDpl(false);
    }
  };

  // Uni Submit Handler
  const handleAddUni = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUniName.trim()) return;
    if (uniList.includes(newUniName.trim())) return toast.error("Universitas sudah terdaftar");
    setUniList([...uniList, newUniName.trim()]);
    setNewUniName("");
    toast.success("Universitas berhasil ditambahkan!");
  };

  const handleRemoveUni = (name: string) => {
    setDeleteUniName(name);
  };

  const handleConfirmRemoveUni = () => {
    if (!deleteUniName) return;
    setUniList(uniList.filter((u) => u !== deleteUniName));
    toast.success("Universitas berhasil dihapus.");
    setDeleteUniName(null);
  };

  // Generate page numbers array for pagination
  const renderPaginationButtons = () => {
    const buttons: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) buttons.push(i);
    } else {
      if (currentPage <= 4) {
        buttons.push(1, 2, 3, 4, 5, "...", totalPages);
      } else if (currentPage >= totalPages - 3) {
        buttons.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        buttons.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return buttons;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Kelompok Dampingan KKN</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Pengelolaan kelompok mahasiswa KKN, alokasi wilayah dampingan, dan struktur dosen pendamping lapangan.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {(isDpl
            ? [{ id: "kelompok", label: `Kelompok Saya (${kelompokList.length})`, icon: GraduationCap }]
            : [
                { id: "kelompok", label: `Kelompok KKN (${kelompokList.length})`, icon: GraduationCap },
                { id: "dpl", label: `Dosen Pendamping (${dplList.length})`, icon: User },
                { id: "universitas", label: `Universitas Mitra (${uniList.length})`, icon: BookOpen }
              ]
          ).map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? "border-emerald-600 text-emerald-700"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm flex items-center gap-2 cursor-pointer transition-colors`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content Area */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs">
        {activeTab === "kelompok" && (
          <div className="space-y-6">
            {/* Filter & Search Bar */}
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                {/* Search Input */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Cari kelompok, DPL, ketua, kelurahan..."
                    value={searchKelompok}
                    onChange={(e) => setSearchKelompok(e.target.value)}
                    className="pl-10 pr-4 py-2.5 w-full border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-slate-50/50 dark:bg-slate-800/50 hover:bg-white"
                  />
                  {searchKelompok && (
                    <button
                      onClick={() => setSearchKelompok("")}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* Filter Kelurahan (Hanya untuk Admin / Taskforce / Pemimpin, disembunyikan untuk DPL) */}
                {!isDpl && (
                  <div className="flex items-center gap-2">
                    <Filter size={16} className="text-slate-400 shrink-0" />
                    <select
                      value={filterKelurahan}
                      onChange={(e) => setFilterKelurahan(e.target.value)}
                      aria-label="Filter Kelurahan"
                      className="px-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                    >
                      <option value="ALL">Semua Kelurahan</option>
                      {kelurahanOptions.map((kel) => (
                        <option key={kel} value={kel}>
                          Kel. {kel}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Action Buttons & Rows per page */}
              <div className="flex items-center gap-3 justify-between sm:justify-end">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <span>Tampilkan:</span>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => setRowsPerPage(Number(e.target.value))}
                    aria-label="Jumlah baris per halaman"
                    className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={9999}>Semua ({kelompokList.length})</option>
                  </select>
                </div>

                {!isReadOnly && (
                  <button
                    onClick={handleOpenAddKelompok}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                  >
                    <Plus size={18} />
                    Tambah Kelompok
                  </button>
                )}
              </div>
            </div>

            {/* Table or Empty/Loading State */}
            {loadingKelompok ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="animate-spin text-emerald-600" size={32} />
                <p className="text-slate-500 font-medium">Memuat data kelompok KKN...</p>
              </div>
            ) : filteredKelompokList.length === 0 ? (
              <div className="text-center py-16 text-slate-500 font-medium border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50">
                <Users size={40} className="mx-auto text-slate-300 mb-2" />
                Tidak ada data kelompok KKN yang sesuai dengan filter pencarian.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800 shadow-2xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
                        <th className="p-4 font-bold text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wider">Nama Kelompok</th>
                        <th className="p-4 font-bold text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wider">Wilayah / Kelurahan</th>
                        <th className="p-4 font-bold text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wider">Ketua Kelompok</th>
                        <th className="p-4 font-bold text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wider">Dosen Pendamping (DPL)</th>
                        <th className="p-4 font-bold text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wider text-center">Anggota</th>
                        {(!isReadOnly || isDpl) && (
                          <th className="p-4 font-bold text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wider text-center">Aksi</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                      {paginatedKelompok.map((k) => {
                        const ketuaMhs = k.students?.find((s: any) => s.isKetua);
                        const cakupanRw = Array.isArray(k.cakupanRw) ? k.cakupanRw.join(", ") : k.cakupanRw;
                        return (
                          <tr key={k.id} className="hover:bg-slate-50/70 dark:bg-slate-800/70 dark:hover:bg-slate-800/70 transition-colors">
                            <td className="p-4">
                              <button
                                onClick={() => handleOpenDetailKelompok(k)}
                                className="font-bold text-slate-900 dark:text-slate-100 hover:text-emerald-600 text-left transition flex items-center gap-1.5 cursor-pointer group"
                                title="Klik untuk melihat detail lengkap kelompok"
                              >
                                <span className="group-hover:underline">{k.name}</span>
                                <Eye size={14} className="text-slate-400 group-hover:text-emerald-600 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </button>
                              {k.linkGoogleDrive && (
                                <a
                                  href={k.linkGoogleDrive}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 font-semibold mt-0.5 hover:underline"
                                  title="Buka Folder Google Drive Kelompok"
                                >
                                  <ExternalLink size={11} />
                                  <span>Google Drive</span>
                                </a>
                              )}
                            </td>
                            <td className="p-4">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-semibold text-slate-800 dark:text-slate-100 text-xs flex items-center gap-1">
                                  <MapPin size={13} className="text-emerald-600" />
                                  Kel. {k.kelurahan || "Wilayah Dampingan"}
                                </span>
                                {cakupanRw && (
                                  <span className="text-[11px] text-slate-500 font-medium pl-4">
                                    RW: {cakupanRw}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              {ketuaMhs ? (
                                <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-900 border border-amber-200/80 px-2.5 py-1 rounded-lg text-xs font-bold shadow-2xs">
                                  <Crown size={13} className="text-amber-600" />
                                  {ketuaMhs.user?.name || "Ketua Kelompok"}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic text-xs">Belum di-assign</span>
                              )}
                            </td>
                            <td className="p-4">
                              {k.dpl?.name ? (
                                <div className="flex flex-col">
                                  <span className="font-medium text-slate-800 dark:text-slate-100">{k.dpl.name}</span>
                                  {k.dpl.phone && <span className="text-[11px] text-slate-400 font-mono">{k.dpl.phone}</span>}
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-xs">Belum ditentukan</span>
                              )}
                            </td>
                            <td className="p-4 text-center font-bold text-slate-700 dark:text-slate-300">
                              <button
                                onClick={() => handleOpenDetailKelompok(k)}
                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-teal-800 border border-teal-200/80 hover:bg-teal-100 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/60 dark:hover:bg-teal-900/50 rounded-full text-xs font-bold transition-all cursor-pointer shadow-2xs"
                                title="Klik untuk melihat detail lengkap & anggota kelompok"
                              >
                                <Users size={13} className="text-teal-600 dark:text-teal-400" />
                                {k.students?.length || 0} Mahasiswa
                              </button>
                            </td>
                            {(!isReadOnly || isDpl) && (
                              <td className="p-4 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  {(isDpl || !isReadOnly) && (
                                    <button
                                      onClick={() => handleOpenSetLeaderModal(k)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60 dark:hover:bg-amber-900/50 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
                                      title="Klik untuk menunjuk atau melepas ketua kelompok"
                                    >
                                      <Crown size={13} className="text-amber-600 dark:text-amber-400" />
                                      <span>{ketuaMhs ? "Ketua" : "Tunjuk"}</span>
                                    </button>
                                  )}

                                  {!isReadOnly && (
                                    <>
                                      <button
                                        onClick={() => handleOpenEditKelompok(k)}
                                        className="p-1.5 text-slate-500 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-400 transition-all cursor-pointer"
                                        title="Edit Kelompok & DPL"
                                      >
                                        <Pencil size={15} />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteKelompok(k.id)}
                                        className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-all cursor-pointer"
                                        title="Hapus Kelompok"
                                      >
                                        <Trash2 size={15} />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="p-4 border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/70 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Menampilkan{" "}
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {filteredKelompokList.length === 0
                        ? 0
                        : (currentPage - 1) * rowsPerPage + 1}
                    </span>{" "}
                    sampai{" "}
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {Math.min(currentPage * rowsPerPage, filteredKelompokList.length)}
                    </span>{" "}
                    dari <span className="font-bold text-slate-900 dark:text-slate-100">{filteredKelompokList.length}</span> kelompok
                    {filteredKelompokList.length !== kelompokList.length && (
                      <span className="text-slate-400 ml-1">(difilter dari {kelompokList.length} total)</span>
                    )}
                  </p>

                  {totalPages > 1 && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 rounded-lg transition-all cursor-pointer"
                        title="Halaman Pertama"
                      >
                        <ChevronsLeft size={15} />
                      </button>
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <ChevronLeft size={14} /> Sebelumnya
                      </button>

                      {/* Numbered Page Buttons */}
                      <div className="hidden sm:flex items-center gap-1 mx-1">
                        {renderPaginationButtons().map((btn, idx) => (
                          typeof btn === "number" ? (
                            <button
                              key={idx}
                              onClick={() => setCurrentPage(btn)}
                              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                currentPage === btn
                                  ? "bg-emerald-600 text-white shadow-xs"
                                  : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                              }`}
                            >
                              {btn}
                            </button>
                          ) : (
                            <span key={idx} className="px-1 text-slate-400 font-bold text-xs">
                              ...
                            </span>
                          )
                        ))}
                      </div>

                      <button
                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        Selanjutnya <ChevronRight size={14} />
                      </button>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 rounded-lg transition-all cursor-pointer"
                        title="Halaman Terakhir"
                      >
                        <ChevronsRight size={15} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "dpl" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Cari DPL, NIP, no HP..."
                  value={searchDpl}
                  onChange={(e) => {
                    setSearchDpl(e.target.value);
                    setDplPage(1);
                  }}
                  className="pl-10 pr-4 py-2.5 w-full border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-slate-50/50 dark:bg-slate-800/50 hover:bg-white"
                />
                {searchDpl && (
                  <button
                    onClick={() => setSearchDpl("")}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {!isReadOnly && (
                <button
                  onClick={() => setIsDplModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                >
                  <Plus size={18} />
                  Tambah DPL
                </button>
              )}
            </div>

            {loadingDpl ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="animate-spin text-emerald-600" size={32} />
                <p className="text-slate-500 font-medium">Memuat data DPL...</p>
              </div>
            ) : filteredDplList.length === 0 ? (
              <div className="text-center py-16 text-slate-500 font-medium border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50">
                <User size={40} className="mx-auto text-slate-300 mb-2" />
                Tidak ada data DPL yang sesuai pencarian.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {paginatedDpl.map((dp) => (
                    <div
                      key={dp.id}
                      className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col justify-between hover:shadow-xs transition-shadow"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base leading-snug">{dp.name}</h3>
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0">
                            DPL
                          </span>
                        </div>
                        {dp.nip && <p className="text-xs text-slate-600 dark:text-slate-400 font-mono mt-1">NIP: {dp.nip}</p>}
                        <p className="text-xs text-slate-500 font-mono mt-1">{dp.phone || "No HP tidak tersedia"}</p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-medium">
                        <span>Universitas Mitra</span>
                        <span className="font-bold text-slate-800 dark:text-slate-100">UNIKOM</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* DPL Pagination */}
                {totalDplPages > 1 && (
                  <div className="p-4 border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/70 rounded-xl flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Halaman <span className="font-bold text-slate-900 dark:text-slate-100">{dplPage}</span> dari{" "}
                      <span className="font-bold text-slate-900 dark:text-slate-100">{totalDplPages}</span> ({filteredDplList.length} DPL total)
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setDplPage((p) => Math.max(p - 1, 1))}
                        disabled={dplPage === 1}
                        className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <ChevronLeft size={14} /> Sebelumnya
                      </button>
                      <button
                        onClick={() => setDplPage((p) => Math.min(p + 1, totalDplPages))}
                        disabled={dplPage === totalDplPages}
                        className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        Selanjutnya <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "universitas" && (
          <div className="space-y-6">
            {!isReadOnly && (
              <form onSubmit={handleAddUni} className="flex gap-4 max-w-xl">
                <input
                  type="text"
                  placeholder="Nama Universitas Mitra Baru..."
                  value={newUniName}
                  onChange={(e) => setNewUniName(e.target.value)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                >
                  Tambah Mitra
                </button>
              </form>
            )}

            <div className="space-y-3">
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Daftar Universitas Mitra</h2>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/20 dark:bg-slate-800/20">
                {uniList.map((uni) => (
                  <div key={uni} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm">{uni}</span>
                    {!isReadOnly && (
                      <button
                        onClick={() => handleRemoveUni(uni)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Kelompok Modal */}
      {isKelompokModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-100 dark:border-slate-800">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {kelompokModalType === "add" ? "Tambah Kelompok KKN" : "Edit Kelompok KKN"}
              </h3>
              <button onClick={() => setIsKelompokModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleKelompokSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nama Kelompok</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kelompok 1 Sekeloa"
                  value={kelompokForm.name}
                  onChange={(e) => setKelompokForm({ ...kelompokForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Dosen Pendamping (DPL)</label>
                <select
                  value={kelompokForm.dplId}
                  onChange={(e) => setKelompokForm({ ...kelompokForm, dplId: e.target.value })}
                  aria-label="Pilih Dosen Pendamping (DPL)"
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white dark:bg-slate-900 cursor-pointer"
                >
                  <option value="">Pilih DPL (Opsional)</option>
                  {dplList.map((dp) => (
                    <option key={dp.id} value={dp.id}>
                      {dp.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Kelurahan</label>
                  <select
                    value={kelompokForm.kelurahan}
                    onChange={(e) => setKelompokForm({ ...kelompokForm, kelurahan: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white dark:bg-slate-900"
                  >
                    <option value="">Pilih Kelurahan...</option>
                    {["Sekeloa", "Sadang Serang", "Lebak Gede", "Lebak Siliwangi", "Dago", "Cipaganti"].map((kel) => (
                      <option key={kel} value={kel}>
                        Kel. {kel}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Cakupan RW</label>
                  <input
                    type="text"
                    placeholder="Contoh: 01, 02, 05"
                    value={kelompokForm.cakupanRw}
                    onChange={(e) => setKelompokForm({ ...kelompokForm, cakupanRw: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Link Google Drive Kelompok (Opsional)</label>
                <div className="relative">
                  <input
                    type="url"
                    placeholder="https://drive.google.com/drive/folders/..."
                    value={kelompokForm.linkGoogleDrive || ""}
                    onChange={(e) => setKelompokForm({ ...kelompokForm, linkGoogleDrive: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono text-xs"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Folder Google Drive disiapkan oleh Super User / Admin untuk monitoring laporan dan portofolio KKN.
                </p>
              </div>

              {kelompokModalType === "edit" && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ketua Kelompok (Mahasiswa)</label>
                  <select
                    value={kelompokForm.ketuaStudentId}
                    onChange={(e) => setKelompokForm({ ...kelompokForm, ketuaStudentId: e.target.value })}
                    aria-label="Pilih Ketua Kelompok (Mahasiswa)"
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white dark:bg-slate-900 cursor-pointer"
                  >
                    <option value="">-- Tanpa Ketua / Lepas Ketua --</option>
                    {currentKelompokStudents.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.user?.name || `Mahasiswa ${st.id.substring(0, 6)}`} {st.isKetua ? "(Ketua Saat Ini)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setIsKelompokModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingKelompok}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {submittingKelompok && <Loader2 className="animate-spin" size={16} />}
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DPL Modal */}
      {isDplModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-100 dark:border-slate-800">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Registrasi DPL Baru</h3>
              <button onClick={() => setIsDplModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleDplSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Nama Lengkap Beserta Gelar"
                  value={dplForm.name}
                  onChange={(e) => setDplForm({ ...dplForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email</label>
                <input
                  type="email"
                  required
                  placeholder="dpl@univ.ac.id"
                  value={dplForm.email}
                  onChange={(e) => setDplForm({ ...dplForm, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">No WA/Handphone</label>
                <input
                  type="text"
                  required
                  placeholder="081234567890"
                  value={dplForm.phone}
                  onChange={(e) => setDplForm({ ...dplForm, phone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
                <input
                  type="password"
                  required
                  placeholder="Minimal 8 karakter (Huruf & Angka)"
                  value={dplForm.password}
                  onChange={(e) => setDplForm({ ...dplForm, password: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">NIP / NIDN (Opsional)</label>
                <input
                  type="text"
                  placeholder="Nomor Induk Pegawai / Dosen"
                  value={dplForm.nip}
                  onChange={(e) => setDplForm({ ...dplForm, nip: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setIsDplModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingDpl}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {submittingDpl && <Loader2 className="animate-spin" size={16} />}
                  Daftarkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DPL Modal: Tunjuk Ketua Kelompok */}
      {isLeaderModalOpen && selectedLeaderKelompok && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-[70] animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-scale-up">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-amber-50/50">
              <div className="flex items-center gap-2">
                <Crown className="text-amber-600" size={20} />
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                  Tunjuk Ketua {selectedLeaderKelompok.name}
                </h3>
              </div>
              <button
                onClick={handleCloseLeaderModal}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500">
                Pilih salah satu mahasiswa dari kelompok Anda untuk ditunjuk sebagai Ketua Kelompok:
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                <label
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                    !selectedLeaderStudentId
                      ? "border-red-500 bg-red-50/60 ring-1 ring-red-500 font-bold"
                      : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="ketua"
                      value=""
                      checked={!selectedLeaderStudentId}
                      onChange={() => setSelectedLeaderStudentId("")}
                      className="text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300 italic">-- Tanpa Ketua / Lepas Ketua --</span>
                  </div>
                  {!selectedLeaderKelompok?.students?.some((s: any) => s.isKetua) && (
                    <span className="text-[10px] font-extrabold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md uppercase">
                      Saat Ini Tanpa Ketua
                    </span>
                  )}
                </label>

                {(selectedLeaderKelompok.students || []).map((mhs: any) => (
                  <label
                    key={mhs.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                      selectedLeaderStudentId === mhs.id
                        ? "border-amber-500 bg-amber-50/60 ring-1 ring-amber-500 font-bold"
                        : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="ketua"
                        value={mhs.id}
                        checked={selectedLeaderStudentId === mhs.id}
                        onChange={() => setSelectedLeaderStudentId(mhs.id)}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-sm text-slate-800 dark:text-slate-100">{mhs.user?.name || "Mahasiswa"}</span>
                    </div>
                    {mhs.isKetua && (
                      <span className="text-[10px] font-extrabold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md uppercase">
                        Ketua Saat Ini
                      </span>
                    )}
                  </label>
                ))}
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleCloseLeaderModal}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveLeader}
                  disabled={submittingLeader}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {submittingLeader && <Loader2 className="animate-spin" size={16} />}
                  Simpan Ketua
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail & Anggota Kelompok Modal (Unified Complete Modal) */}
      {isDetailModalOpen && selectedDetailKelompok && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden animate-scale-up border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50/80 dark:bg-slate-800/80">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                    Kel. {selectedDetailKelompok.kelurahan || "Wilayah Dampingan"}
                  </span>
                  {selectedDetailKelompok.cakupanRw && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-200/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300">
                      RW: {Array.isArray(selectedDetailKelompok.cakupanRw) ? selectedDetailKelompok.cakupanRw.join(", ") : selectedDetailKelompok.cakupanRw}
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60">
                    {selectedDetailKelompok.students?.length || 0} Mahasiswa
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1.5">{selectedDetailKelompok.name}</h3>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 dark:text-slate-300 flex-1">
              {/* Meta DPL & Ketua & Google Drive */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800">
                  <span className="text-[10.5px] font-bold text-slate-400 block uppercase">Dosen Pendamping (DPL)</span>
                  <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm mt-0.5 block">
                    {selectedDetailKelompok.dpl?.name || "Belum Ditentukan"}
                  </span>
                  {selectedDetailKelompok.dpl?.phone && (
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                      <Phone size={11} className="text-emerald-600" />
                      {selectedDetailKelompok.dpl.phone}
                    </span>
                  )}
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between">
                  <div>
                    <span className="text-[10.5px] font-bold text-slate-400 block uppercase">Ketua Kelompok</span>
                    {(() => {
                      const ketua = selectedDetailKelompok.students?.find((s: any) => s.isKetua);
                      return ketua ? (
                        <div>
                          <span className="font-extrabold text-amber-900 dark:text-amber-400 text-sm mt-0.5 flex items-center gap-1">
                            <Crown size={14} className="text-amber-600" />
                            {ketua.user?.name || "Ketua Kelompok"}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 block">
                            NIM: {ketua.nim || "-"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs mt-1 block">Belum ditentukan</span>
                      );
                    })()}
                  </div>
                  {(isDpl || !isReadOnly) && (
                    <button
                      type="button"
                      onClick={() => handleOpenSetLeaderModal(selectedDetailKelompok, true)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-amber-800 dark:text-amber-400 mt-2 hover:underline cursor-pointer"
                    >
                      <Crown size={12} className="text-amber-600" />
                      <span>{selectedDetailKelompok.students?.some((s: any) => s.isKetua) ? "Ganti Ketua" : "Tunjuk Ketua"}</span>
                    </button>
                  )}
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between">
                  <div>
                    <span className="text-[10.5px] font-bold text-slate-400 block uppercase">Google Drive Kelompok</span>
                    {selectedDetailKelompok.linkGoogleDrive ? (
                      <a
                        href={selectedDetailKelompok.linkGoogleDrive}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-black text-blue-600 hover:text-blue-700 dark:text-blue-400 mt-1 hover:underline"
                      >
                        <ExternalLink size={13} />
                        <span>Buka Folder Drive</span>
                      </a>
                    ) : (
                      <span className="text-slate-400 italic text-[11px] mt-1 block">Belum ada link drive</span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400">Penyimpanan dokumen & portofolio</span>
                </div>
              </div>

              {/* Form Tambah/Alokasikan Mahasiswa ke Kelompok (Admin Only) */}
              {!isReadOnly && (
                <div className="border border-teal-100 dark:border-teal-800/50 bg-teal-50/40 dark:bg-teal-950/20 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserPlus size={15} className="text-teal-600 dark:text-teal-400" />
                      <label className="text-xs font-bold text-teal-900 dark:text-teal-200 uppercase tracking-wider">
                        Alokasikan Mahasiswa ke Kelompok Ini
                      </label>
                    </div>
                    <span className="text-[11px] text-teal-700 dark:text-teal-300 font-semibold bg-teal-100/80 dark:bg-teal-900/50 px-2 py-0.5 rounded-full">
                      {allStudentsList.filter((u) => u.studentProfile?.kelompokId !== selectedDetailKelompok.id).length} Mahasiswa Tersedia
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={filterStudentQuery}
                        onChange={(e) => setFilterStudentQuery(e.target.value)}
                        placeholder="Cari nama atau NIM mahasiswa..."
                        className="w-full pl-9 pr-3 py-1.5 border border-teal-200/80 dark:border-teal-800/60 rounded-xl text-xs bg-white dark:bg-slate-900 focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        value={studentToAssignId}
                        onChange={(e) => setStudentToAssignId(e.target.value)}
                        className="flex-1 px-3 py-2 border border-teal-200/80 dark:border-teal-800/60 rounded-xl text-xs font-medium bg-white dark:bg-slate-900 focus:outline-none focus:border-teal-500"
                      >
                        <option value="">-- Pilih Mahasiswa untuk Dialokasikan --</option>
                        {allStudentsList
                          .filter((u) => {
                            if (u.studentProfile?.kelompokId === selectedDetailKelompok.id) return false;
                            if (!filterStudentQuery) return true;
                            const q = filterStudentQuery.toLowerCase();
                            const matchName = (u.name || "").toLowerCase().includes(q);
                            const matchNim = (u.studentProfile?.nim || "").toLowerCase().includes(q);
                            return matchName || matchNim;
                          })
                          .map((u) => {
                            const kelName = u.studentProfile?.kelompok?.name || "Belum Ada Kelompok";
                            return (
                              <option key={u.id} value={u.id}>
                                {u.name} (NIM: {u.studentProfile?.nim || "-"}) - [{kelName}]
                              </option>
                            );
                          })}
                      </select>

                      <button
                        type="button"
                        disabled={!studentToAssignId || submittingMemberAction}
                        onClick={() => handleAddStudentToGroup(studentToAssignId, selectedDetailKelompok.id)}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
                      >
                        {submittingMemberAction ? <Loader2 className="animate-spin" size={14} /> : <UserPlus size={14} />}
                        <span>+ Tambah Mahasiswa</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tabel Anggota Mahasiswa Lengkap */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <h4 className="font-black text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                    <Users size={16} className="text-emerald-600" />
                    <span>Daftar Anggota Mahasiswa ({selectedDetailKelompok.students?.length || 0})</span>
                  </h4>

                  {/* Input Search Mahasiswa */}
                  <div className="relative w-full sm:w-64">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={detailStudentSearch}
                      onChange={(e) => setDetailStudentSearch(e.target.value)}
                      placeholder="Cari nama / NIM / prodi..."
                      className="w-full pl-8.5 pr-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 focus:outline-none focus:border-emerald-500"
                    />
                    {detailStudentSearch && (
                      <button
                        type="button"
                        onClick={() => setDetailStudentSearch("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {(() => {
                  const rawStudents = selectedDetailKelompok.students || [];
                  const filtered = detailStudentSearch.trim()
                    ? rawStudents.filter((st: any) => {
                        const q = detailStudentSearch.toLowerCase();
                        const name = (st.user?.name || "").toLowerCase();
                        const nim = (st.nim || "").toLowerCase();
                        const jur = (st.jurusan || "").toLowerCase();
                        return name.includes(q) || nim.includes(q) || jur.includes(q);
                      })
                    : rawStudents;

                  if (rawStudents.length === 0) {
                    return (
                      <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50">
                        Belum ada mahasiswa yang dialokasikan ke kelompok ini.
                      </div>
                    );
                  }

                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-6 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 text-xs">
                        Tidak ada mahasiswa yang cocok dengan pencarian "{detailStudentSearch}".
                      </div>
                    );
                  }

                  return (
                    <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-extrabold uppercase text-[10.5px] border-b border-slate-200 dark:border-slate-800">
                            <th className="py-2.5 px-3 text-center w-8">No</th>
                            <th className="py-2.5 px-3">NIM</th>
                            <th className="py-2.5 px-3">Nama Mahasiswa</th>
                            <th className="py-2.5 px-3">Jenjang</th>
                            <th className="py-2.5 px-3">Program Studi</th>
                            <th className="py-2.5 px-3 text-center">Peran</th>
                            {!isReadOnly && <th className="py-2.5 px-3 text-center">Aksi</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                          {filtered.map((st: any, idx: number) => (
                            <tr key={st.id} className="hover:bg-slate-50/70 dark:bg-slate-800/70 dark:hover:bg-slate-800/70 transition">
                              <td className="py-2 px-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                              <td className="py-2 px-3 font-mono font-bold text-slate-800 dark:text-slate-100">{st.nim || "-"}</td>
                              <td className="py-2 px-3 font-bold text-slate-900 dark:text-slate-100">{st.user?.name || `Mahasiswa ${st.id.substring(0, 6)}`}</td>
                              <td className="py-2 px-3 font-semibold text-slate-600 dark:text-slate-400">{st.jenjangPendidikan || "S1"}</td>
                              <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{st.jurusan || "-"}</td>
                              <td className="py-2 px-3 text-center">
                                {st.isKetua ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 font-black text-[10px] border border-amber-300 dark:border-amber-800">
                                    <Crown size={11} className="text-amber-600" /> KETUA
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-[11px]">Anggota</span>
                                )}
                              </td>
                              {!isReadOnly && (
                                <td className="py-2 px-3 text-center">
                                  <button
                                    type="button"
                                    disabled={submittingMemberAction}
                                    onClick={() => handleRemoveStudentFromGroup(st.userId || st.user?.id, selectedDetailKelompok.id)}
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800/60 rounded-lg text-[11px] font-bold transition cursor-pointer"
                                    title="Lepas mahasiswa dari kelompok ini"
                                  >
                                    <UserMinus size={12} />
                                    <span>Lepas</span>
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/70 flex justify-between items-center text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Total {selectedDetailKelompok.students?.length || 0} Mahasiswa Terdaftar</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal Hapus Kelompok */}
      <ConfirmModal
        isOpen={Boolean(deleteKelompokId)}
        onClose={() => setDeleteKelompokId(null)}
        onConfirm={handleConfirmDeleteKelompok}
        isLoading={isDeleting}
        title="Hapus Kelompok KKN"
        message="Apakah Anda yakin ingin menghapus kelompok KKN ini? Data relasi mahasiswa dalam kelompok ini akan dilepaskan."
        confirmText="Ya, Hapus Kelompok"
        type="danger"
      />

      {/* Confirm Modal Hapus Universitas */}
      <ConfirmModal
        isOpen={Boolean(deleteUniName)}
        onClose={() => setDeleteUniName(null)}
        onConfirm={handleConfirmRemoveUni}
        title="Hapus Universitas Mitra"
        message={`Apakah Anda yakin ingin menghapus universitas ${deleteUniName || ""}?`}
        confirmText="Ya, Hapus"
        type="warning"
      />
    </div>
  );
};

export default ManajemenEkosistemKkn;
