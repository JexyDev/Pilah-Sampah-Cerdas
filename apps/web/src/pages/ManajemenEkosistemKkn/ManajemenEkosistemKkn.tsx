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
  ChevronsRight
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { useAuthStore } from "../../store/useAuthStore";

export const ManajemenEkosistemKkn: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const isReadOnly = ["ADMIN_DLH", "CAMAT", "LURAH"].includes(currentUser?.peran || "");

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
  const [kelompokForm, setKelompokForm] = useState({ name: "", dplId: "", ketuaStudentId: "", kelurahan: "", cakupanRw: "" });
  const [currentKelompokStudents, setCurrentKelompokStudents] = useState<any[]>([]);
  const [submittingKelompok, setSubmittingKelompok] = useState(false);

  // DPL State
  const [dplList, setDplList] = useState<any[]>([]);
  const [loadingDpl, setLoadingDpl] = useState(true);
  const [searchDpl, setSearchDpl] = useState("");
  const [dplPage, setDplPage] = useState(1);
  const dplRowsPerPage = 12;
  const [isDplModalOpen, setIsDplModalOpen] = useState(false);
  const [dplForm, setDplForm] = useState({ name: "", email: "", phone: "", password: "", nip: "" });
  const [submittingDpl, setSubmittingDpl] = useState(false);

  // Universitas State
  const [uniList, setUniList] = useState<string[]>([
    "Universitas Komputer Indonesia (UNIKOM)",
    "Institut Teknologi Bandung (ITB)",
    "Universitas Padjadjaran (UNPAD)",
    "Universitas Pendidikan Indonesia (UPI)"
  ]);
  const [newUniName, setNewUniName] = useState("");

  // Fetch groups
  const fetchKelompok = async () => {
    try {
      setLoadingKelompok(true);
      // Fetch all groups with limit=0 so client-side search, filtering, and pagination are instantaneous
      const res = await api.get("/kelompok?limit=0");
      if (res.data?.success) {
        setKelompokList(res.data.groups || []);
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
  const handleOpenAddKelompok = () => {
    setKelompokModalType("add");
    setKelompokForm({ name: "", dplId: "", ketuaStudentId: "", kelurahan: "", cakupanRw: "" });
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
      cakupanRw: rwStr
    });
    setCurrentKelompokStudents(k.students || []);
    setSelectedKelompokId(k.id);
    setIsKelompokModalOpen(true);
  };

  const handleDeleteKelompok = async (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus kelompok ini?")) {
      try {
        await api.delete(`/kelompok/${id}`);
        toast.success("Kelompok berhasil dihapus");
        fetchKelompok();
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Gagal menghapus kelompok");
      }
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
      cakupanRw: kelompokForm.cakupanRw ? kelompokForm.cakupanRw.split(",").map(r => r.trim()).filter(Boolean) : []
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
        if (kelompokForm.ketuaStudentId) {
          await api.put(`/kelompok/${selectedKelompokId}/leader`, { studentId: kelompokForm.ketuaStudentId });
        }
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
      toast.success("Dosen Pembimbing Lapangan (DPL) berhasil didaftarkan!");
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
    if (window.confirm(`Hapus universitas ${name}?`)) {
      setUniList(uniList.filter((u) => u !== name));
      toast.success("Universitas dihapus.");
    }
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
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Manajemen Ekosistem KKN</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola data Universitas, Dosen Pembimbing (DPL), dan Kelompok Mahasiswa secara real-time.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {[
            { id: "kelompok", label: `Kelompok KKN (${kelompokList.length})`, icon: GraduationCap },
            { id: "dpl", label: `Dosen Pembimbing (${dplList.length})`, icon: User },
            { id: "universitas", label: `Universitas Mitra (${uniList.length})`, icon: BookOpen }
          ].map((tab) => {
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
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
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
                    className="pl-10 pr-4 py-2.5 w-full border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-slate-50/50 hover:bg-white"
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

                {/* Filter Kelurahan */}
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-slate-400 shrink-0" />
                  <select
                    value={filterKelurahan}
                    onChange={(e) => setFilterKelurahan(e.target.value)}
                    aria-label="Filter Kelurahan"
                    className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                  >
                    <option value="ALL">Semua Kelurahan</option>
                    {kelurahanOptions.map((kel) => (
                      <option key={kel} value={kel}>
                        Kel. {kel}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Buttons & Rows per page */}
              <div className="flex items-center gap-3 justify-between sm:justify-end">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <span>Tampilkan:</span>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => setRowsPerPage(Number(e.target.value))}
                    aria-label="Jumlah baris per halaman"
                    className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold bg-white text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
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
              <div className="text-center py-16 text-slate-500 font-medium border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <Users size={40} className="mx-auto text-slate-300 mb-2" />
                Tidak ada data kelompok KKN yang sesuai dengan filter pencarian.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-xl border border-slate-100 shadow-2xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="p-4 font-bold text-xs text-slate-600 uppercase tracking-wider">Nama Kelompok</th>
                        <th className="p-4 font-bold text-xs text-slate-600 uppercase tracking-wider">Wilayah / Kelurahan</th>
                        <th className="p-4 font-bold text-xs text-slate-600 uppercase tracking-wider">Ketua Kelompok</th>
                        <th className="p-4 font-bold text-xs text-slate-600 uppercase tracking-wider">Dosen Pembimbing (DPL)</th>
                        <th className="p-4 font-bold text-xs text-slate-600 uppercase tracking-wider text-center">Anggota</th>
                        {!isReadOnly && (
                          <th className="p-4 font-bold text-xs text-slate-600 uppercase tracking-wider text-center">Aksi</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {paginatedKelompok.map((k) => {
                        const ketuaMhs = k.students?.find((s: any) => s.isKetua);
                        const cakupanRw = Array.isArray(k.cakupanRw) ? k.cakupanRw.join(", ") : k.cakupanRw;
                        return (
                          <tr key={k.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="p-4">
                              <span className="font-bold text-slate-900">{k.name}</span>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-semibold text-slate-800 text-xs flex items-center gap-1">
                                  <MapPin size={13} className="text-emerald-600" />
                                  Kel. {k.kelurahan || "Coblong"}
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
                                  <span className="font-medium text-slate-800">{k.dpl.name}</span>
                                  {k.dpl.phone && <span className="text-[11px] text-slate-400 font-mono">{k.dpl.phone}</span>}
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-xs">Belum ditentukan</span>
                              )}
                            </td>
                            <td className="p-4 text-center font-bold text-slate-700">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-full text-xs">
                                <Users size={13} className="text-slate-500" />
                                {k.students?.length || 0} Mahasiswa
                              </span>
                            </td>
                            {!isReadOnly && (
                              <td className="p-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => handleOpenEditKelompok(k)}
                                    className="p-2 text-slate-500 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 transition-all cursor-pointer"
                                    title="Edit Kelompok"
                                  >
                                    <Pencil size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteKelompok(k.id)}
                                    className="p-2 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                                    title="Hapus Kelompok"
                                  >
                                    <Trash2 size={16} />
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

                {/* Pagination Controls */}
                <div className="p-4 border border-slate-100 bg-slate-50/70 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-xs font-semibold text-slate-600">
                    Menampilkan{" "}
                    <span className="font-bold text-slate-900">
                      {filteredKelompokList.length === 0
                        ? 0
                        : (currentPage - 1) * rowsPerPage + 1}
                    </span>{" "}
                    sampai{" "}
                    <span className="font-bold text-slate-900">
                      {Math.min(currentPage * rowsPerPage, filteredKelompokList.length)}
                    </span>{" "}
                    dari <span className="font-bold text-slate-900">{filteredKelompokList.length}</span> kelompok
                    {filteredKelompokList.length !== kelompokList.length && (
                      <span className="text-slate-400 ml-1">(difilter dari {kelompokList.length} total)</span>
                    )}
                  </p>

                  {totalPages > 1 && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="p-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-30 rounded-lg transition-all cursor-pointer"
                        title="Halaman Pertama"
                      >
                        <ChevronsLeft size={15} />
                      </button>
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-30 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
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
                                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
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
                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-30 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        Selanjutnya <ChevronRight size={14} />
                      </button>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="p-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-30 rounded-lg transition-all cursor-pointer"
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
                  placeholder="Cari DPL, NIP, no HP, email..."
                  value={searchDpl}
                  onChange={(e) => {
                    setSearchDpl(e.target.value);
                    setDplPage(1);
                  }}
                  className="pl-10 pr-4 py-2.5 w-full border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-slate-50/50 hover:bg-white"
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
              <div className="text-center py-16 text-slate-500 font-medium border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <User size={40} className="mx-auto text-slate-300 mb-2" />
                Tidak ada data DPL yang sesuai pencarian.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {paginatedDpl.map((dp) => (
                    <div
                      key={dp.id}
                      className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between hover:shadow-xs transition-shadow"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-slate-800 text-base leading-snug">{dp.name}</h3>
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0">
                            DPL
                          </span>
                        </div>
                        {dp.nip && <p className="text-xs text-slate-600 font-mono mt-1">NIP: {dp.nip}</p>}
                        <p className="text-xs text-slate-500 mt-1">{dp.email || "Email tidak tersedia"}</p>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">{dp.phone || "No HP tidak tersedia"}</p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-600 font-medium">
                        <span>Universitas Mitra</span>
                        <span className="font-bold text-slate-800">UNIKOM</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* DPL Pagination */}
                {totalDplPages > 1 && (
                  <div className="p-4 border border-slate-100 bg-slate-50/70 rounded-xl flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-600">
                      Halaman <span className="font-bold text-slate-900">{dplPage}</span> dari{" "}
                      <span className="font-bold text-slate-900">{totalDplPages}</span> ({filteredDplList.length} DPL total)
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setDplPage((p) => Math.max(p - 1, 1))}
                        disabled={dplPage === 1}
                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-30 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <ChevronLeft size={14} /> Sebelumnya
                      </button>
                      <button
                        onClick={() => setDplPage((p) => Math.min(p + 1, totalDplPages))}
                        disabled={dplPage === totalDplPages}
                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-30 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
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
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
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
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden bg-slate-50/20">
                {uniList.map((uni) => (
                  <div key={uni} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <span className="font-semibold text-slate-700 text-sm">{uni}</span>
                    {!isReadOnly && (
                      <button
                        onClick={() => handleRemoveUni(uni)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
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
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-100">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">
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
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Dosen Pembimbing (DPL)</label>
                <select
                  value={kelompokForm.dplId}
                  onChange={(e) => setKelompokForm({ ...kelompokForm, dplId: e.target.value })}
                  aria-label="Pilih Dosen Pembimbing (DPL)"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white cursor-pointer"
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
                  <input
                    type="text"
                    placeholder="Contoh: Sekeloa"
                    value={kelompokForm.kelurahan}
                    onChange={(e) => setKelompokForm({ ...kelompokForm, kelurahan: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Cakupan RW</label>
                  <input
                    type="text"
                    placeholder="Contoh: 01, 02, 05"
                    value={kelompokForm.cakupanRw}
                    onChange={(e) => setKelompokForm({ ...kelompokForm, cakupanRw: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              {kelompokModalType === "edit" && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ketua Kelompok (Mahasiswa)</label>
                  <select
                    value={kelompokForm.ketuaStudentId}
                    onChange={(e) => setKelompokForm({ ...kelompokForm, ketuaStudentId: e.target.value })}
                    aria-label="Pilih Ketua Kelompok (Mahasiswa)"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white cursor-pointer"
                  >
                    <option value="">Pilih Ketua Kelompok</option>
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
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
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
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-100">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">Registrasi DPL Baru</h3>
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
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
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
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
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
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
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
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">NIP / NIDN (Opsional)</label>
                <input
                  type="text"
                  placeholder="Nomor Induk Pegawai / Dosen"
                  value={dplForm.nip}
                  onChange={(e) => setDplForm({ ...dplForm, nip: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setIsDplModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
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
    </div>
  );
};

export default ManajemenEkosistemKkn;
