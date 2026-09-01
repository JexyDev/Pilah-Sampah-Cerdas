import React, { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import api from "../../services/api";
import { toast } from "react-hot-toast";
import {
  Loader2,
  Plus,
  X,
  Pencil,
  Trash2,
  Search,
  GraduationCap,
  AlertTriangle,
  MapPin,
  Eye,
  Phone,
  Download,
  Filter,
  FileSpreadsheet,
  RotateCcw,
} from "lucide-react";
import * as XLSX from "xlsx";
import { Pagination } from "../../components/common/Pagination";
import { EmptyTableState } from "../../components/common/EmptyTableState";
import Sidebar from "../../components/layout/Sidebar/Sidebar";
import { sortKelompokList } from "../../utils/sortUtils";

const ManajemenMahasiswa: React.FC = () => {
  const { user } = useAuthStore();

  const [mahasiswas, setMahasiswas] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState("");

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [kelompokFilter, setKelompokFilter] = useState("Semua");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    nama_lengkap: "",
    nim: "",
    no_telepon: "",
    universitas: "UNIKOM",
    kelompok: "",
    dpl_nama: "",
    area_tugas: "",
    is_ketua: false,
  });

  const [studentToDelete, setStudentToDelete] = useState<any | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const fetchMahasiswas = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/mahasiswa");
      setMahasiswas(res.data?.data || []);
      setError("");
    } catch (err) {
      setError("Gagal memuat data mahasiswa");
    } finally {
      setLoading(false);
    }
  };

  const fetchAreas = async () => {
    try {
      const res = await api.get("/bins/areas");
      setAreas(res.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch areas:", err);
    }
  };

  useEffect(() => {
    fetchMahasiswas();
    fetchAreas();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, kelompokFilter, startDateFilter, endDateFilter]);

  // Extract unique Kelompok KKN list (Natural Sorted)
  const uniqueKelompoks = useMemo(() => {
    const set = new Set<string>();
    mahasiswas.forEach((m) => {
      if (m.studentProfile?.kelompok?.name) {
        set.add(m.studentProfile.kelompok.name);
      }
    });
    return sortKelompokList(Array.from(set), (s) => s);
  }, [mahasiswas]);

  // Filtered List
  const filteredMahasiswas = useMemo(() => {
    return mahasiswas.filter((m) => {
      const matchesSearch =
        (m.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.studentProfile?.nim || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.phone || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "Semua" || m.status === statusFilter;

      const matchesKelompok =
        kelompokFilter === "Semua" ||
        m.studentProfile?.kelompok?.name === kelompokFilter;

      let matchesDate = true;
      if (startDateFilter && m.createdAt) {
        const startTs = new Date(`${startDateFilter}T00:00:00`).getTime();
        if (new Date(m.createdAt).getTime() < startTs) matchesDate = false;
      }
      if (endDateFilter && m.createdAt) {
        const endTs = new Date(`${endDateFilter}T23:59:59`).getTime();
        if (new Date(m.createdAt).getTime() > endTs) matchesDate = false;
      }

      return matchesSearch && matchesStatus && matchesKelompok && matchesDate;
    });
  }, [mahasiswas, searchTerm, statusFilter, kelompokFilter, startDateFilter, endDateFilter]);

  const handleOpenAddModal = () => {
    setModalType("add");
    setEditingId(null);
    setFormData({
      nama_lengkap: "",
      nim: "",
      universitas: "UNIKOM",
      no_telepon: "",
      area_tugas: areas[0]?.id ? String(areas[0].id) : "",
      status_aktif: "Aktif",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (mhs: any) => {
    setModalType("edit");
    setEditingId(mhs.id);
    setFormData({
      nama_lengkap: mhs.name || "",
      nim: mhs.studentProfile?.nim || "",
      universitas: mhs.studentProfile?.fakultas || "UNIKOM",
      no_telepon: mhs.phone || "",
      area_tugas: mhs.rwId ? String(mhs.rwId) : mhs.studentProfile?.assignedRwId ? String(mhs.studentProfile.assignedRwId) : (mhs.rtRwId ? String(mhs.rtRwId) : ""),
      status_aktif: mhs.status || "Aktif",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama_lengkap.trim() || !formData.nim.trim() || !formData.no_telepon.trim()) {
      toast.error("Nama Lengkap, NIM, dan No WhatsApp wajib diisi");
      return;
    }

    let phone = formData.no_telepon.trim();
    if (phone.startsWith("0")) phone = "+62" + phone.substring(1);
    else if (!phone.startsWith("+62")) phone = "+62" + phone;

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        no_telepon: phone,
        area_tugas: formData.area_tugas ? Number(formData.area_tugas) : undefined,
      };

      if (modalType === "add") {
        await api.post("/admin/mahasiswa", payload);
        toast.success("Mahasiswa KKN berhasil ditambahkan!");
      } else {
        await api.put(`/admin/mahasiswa/${editingId}`, payload);
        toast.success("Data mahasiswa KKN berhasil diperbarui!");
      }
      setIsModalOpen(false);
      fetchMahasiswas();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menyimpan data mahasiswa");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (mhs: any) => {
    setStudentToDelete(mhs);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!studentToDelete) return;
    try {
      await api.delete(`/admin/mahasiswa/${studentToDelete.id}`);
      toast.success("Akun mahasiswa berhasil dinonaktifkan!");
      setIsDeleteModalOpen(false);
      setStudentToDelete(null);
      fetchMahasiswas();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menonaktifkan mahasiswa");
    }
  };

  const handleExportXLSX = () => {
    if (!startDateFilter || !endDateFilter) {
      toast.error("Pilih tanggal awal dan tanggal akhir terlebih dahulu sebelum mengekspor.");
      return;
    }

    if (!filteredMahasiswas || filteredMahasiswas.length === 0) {
      toast.error("Tidak ada data mahasiswa pada rentang tanggal yang dipilih.");
      return;
    }

    const headers = ["No", "Nama Lengkap", "NIM", "Universitas", "No WhatsApp", "Kelompok KKN", "Dosen Pendamping (DPL)", "Wilayah RT/RW", "Status", "Tanggal Terdaftar"];
    const rows = filteredMahasiswas.map((m, idx) => {
      const dplName = m.studentProfile?.kelompok?.dplName || m.studentProfile?.kelompok?.dpl?.name || m.studentProfile?.kelompok?.dplNamaMentah || "-";
      return [
        idx + 1,
        m.name || "-",
        m.studentProfile?.nim || "-",
        m.studentProfile?.fakultas || "UNIKOM",
        m.phone || "-",
        m.studentProfile?.kelompok?.name || "-",
        dplName,
        m.rtRw?.name || "-",
        m.status || "Aktif",
        m.createdAt ? new Date(m.createdAt).toLocaleDateString("id-ID") : "-",
      ];
    });

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws["!cols"] = [
      { wch: 6 },
      { wch: 25 },
      { wch: 15 },
      { wch: 18 },
      { wch: 18 },
      { wch: 20 },
      { wch: 25 },
      { wch: 20 },
      { wch: 12 },
      { wch: 18 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Mahasiswa_KKN");
    XLSX.writeFile(wb, `Data_Mahasiswa_KKN_${startDateFilter}_sd_${endDateFilter}.xlsx`);
    toast.success(`Data mahasiswa (${filteredMahasiswas.length} data) berhasil diekspor ke XLSX!`);
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredMahasiswas.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedMahasiswas = filteredMahasiswas.slice(startIndex, startIndex + rowsPerPage);

  if (user?.peran !== "SUPER_USER") {
    return (
      <div className="p-8 text-center text-rose-600 font-bold bg-white dark:bg-slate-900 rounded-2xl m-6 border border-rose-200">
        Akses Ditolak. Halaman ini khusus Admin.
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-800/60 font-sans overflow-hidden">
      <Sidebar isOpen={true} onClose={() => {}} />

      <main className="flex-1 overflow-y-auto p-8 relative space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Manajemen Mahasiswa KKN</h1>
              <span className="bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full font-extrabold flex items-center gap-1">
                <GraduationCap size={13} /> Modul Penugasan
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Kelola data mahasiswa pendamping KKN, plotting wilayah RT/RW, dan penetapan kelompok kerja.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white font-extrabold rounded-xl transition-all text-xs shadow-sm cursor-pointer"
            >
              <Plus size={15} /> Tambah Mahasiswa
            </button>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Mahasiswa</p>
            <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">{mahasiswas.length}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Status Aktif</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              {mahasiswas.filter((m) => m.status === "Aktif").length}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Kelompok KKN</p>
            <p className="text-2xl font-black text-blue-600 mt-1">{uniqueKelompoks.length} Kelompok</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Wilayah Dampingan</p>
            <p className="text-2xl font-black text-purple-600 mt-1">{areas.length} RT/RW</p>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari Nama, NIM, No. WA..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 pl-10 pr-4 py-2.5 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 flex-1 justify-end">
            <Filter size={15} className="text-slate-400" />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Filter:</span>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
            >
              <option value="Semua">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Nonaktif">Nonaktif</option>
            </select>

            <select
              value={kelompokFilter}
              onChange={(e) => setKelompokFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
            >
              <option value="Semua">Semua Kelompok</option>
              {uniqueKelompoks.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1 text-xs">
              <input
                type="date"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
              />
              <span className="text-slate-400 text-xs">s/d</span>
              <input
                type="date"
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
              />
            </div>

            {(searchTerm || statusFilter !== "Semua" || kelompokFilter !== "Semua" || startDateFilter || endDateFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("Semua");
                  setKelompokFilter("Semua");
                  setStartDateFilter("");
                  setEndDateFilter("");
                }}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer ml-1"
                title="Reset Filter"
              >
                <RotateCcw size={11} /> Reset
              </button>
            )}

            <button
              type="button"
              onClick={handleExportXLSX}
              disabled={!startDateFilter || !endDateFilter}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700/60 cursor-pointer ml-1"
              title={(!startDateFilter || !endDateFilter) ? "Pilih tanggal awal dan tanggal akhir terlebih dahulu untuk mengekspor" : "Ekspor data mahasiswa ke XLSX"}
            >
              <FileSpreadsheet size={13} />
              <span>Ekspor XLSX</span>
            </button>
          </div>
        </div>

        {/* Table Master Data */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3.5 px-4 w-14 text-center">No</th>
                  <th className="py-3.5 px-4">Nama Lengkap</th>
                  <th className="py-3.5 px-4">Program Studi</th>
                  <th className="py-3.5 px-4">NIM</th>
                  <th className="py-3.5 px-4">No. HP</th>
                  <th className="py-3.5 px-4">Kelompok KKN</th>
                  <th className="py-3.5 px-4">Dosen Pendamping (DPL)</th>
                  <th className="py-3.5 px-4">Wilayah Tugas</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="animate-spin text-primary" size={32} />
                        <p className="font-bold text-xs">Memuat data mahasiswa KKN...</p>
                      </div>
                    </td>
                  </tr>
                ) : paginatedMahasiswas.length === 0 ? (
                  <EmptyTableState
                    colSpan={10}
                    entityName="Mahasiswa KKN"
                    isSearch={!!(searchTerm || statusFilter !== "Semua" || kelompokFilter !== "Semua")}
                    searchQuery={searchTerm}
                    onResetSearch={() => {
                      setSearchTerm("");
                      setStatusFilter("Semua");
                      setKelompokFilter("Semua");
                    }}
                  />
                ) : (
                  paginatedMahasiswas.map((mhs, idx) => (
                    <tr key={mhs.id} className="hover:bg-slate-50/80 dark:bg-slate-800/80 dark:hover:bg-slate-800/80 transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                        {startIndex + idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-bold text-slate-900 dark:text-slate-100">{mhs.name}</p>
                          {mhs.studentProfile?.isKetua && (
                            <span className="bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.5 rounded text-[9px] font-extrabold inline-flex items-center gap-0.5 shadow-2xs" title="Ketua Kelompok KKN">
                              ⭐ KETUA
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-semibold">
                        {mhs.studentProfile?.jurusan || mhs.studentProfile?.fakultas || "UNIKOM"}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {mhs.studentProfile?.nim || "-"}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                        <a
                          href={`https://wa.me/${(mhs.phone || "").replace(/\+/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-emerald-600 hover:underline flex items-center gap-1"
                        >
                          <Phone size={12} className="text-emerald-500" />
                          {mhs.phone || "-"}
                        </a>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-200 font-bold text-[10px] inline-block">
                          {mhs.studentProfile?.kelompok?.name || "Belum Plotting"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        {mhs.studentProfile?.kelompok?.dplName ||
                         mhs.studentProfile?.kelompok?.dpl?.name ||
                         mhs.studentProfile?.kelompok?.dplNamaMentah || (
                          <span className="text-slate-400 italic">Belum Plotting</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-medium">
                        {mhs.studentProfile?.kelompok?.wilayahPenugasan || mhs.rtRw?.name || mhs.wilayah ? (
                          <span className="flex items-center gap-1">
                            <MapPin size={13} className="text-primary" />
                            {mhs.studentProfile?.kelompok?.wilayahPenugasan || mhs.rtRw?.name || mhs.wilayah}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Belum diset</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                            mhs.status === "Aktif"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : "bg-rose-100 text-rose-800 border border-rose-200"
                          }`}
                        >
                          {mhs.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => setSelectedStudentDetail(mhs)}
                            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-primary hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                            title="Detail Profil"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(mhs)}
                            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-blue-600 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                            title="Edit Data"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(mhs)}
                            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-rose-600 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                            title="Nonaktifkan"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Standard BERSEKA Pagination */}
          {!loading && filteredMahasiswas.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages || 1}
              totalItems={filteredMahasiswas.length}
              itemsPerPage={rowsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setRowsPerPage}
              itemsPerPageOptions={[10, 25, 50, 100]}
            />
          )}
        </div>

        {/* Modal Detail Student */}
        {selectedStudentDetail && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/60">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <GraduationCap className="text-primary" size={20} />
                  Detail Profil Mahasiswa KKN
                </h3>
                <button
                  onClick={() => setSelectedStudentDetail(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/20">
                    {selectedStudentDetail.name?.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">{selectedStudentDetail.name}</h4>
                    <p className="text-xs font-mono text-slate-500">NIM: {selectedStudentDetail.studentProfile?.nim || "-"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 font-bold block mb-0.5">Universitas</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{selectedStudentDetail.studentProfile?.fakultas || "UNIKOM"}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 font-bold block mb-0.5">No. WhatsApp</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{selectedStudentDetail.phone || "-"}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 font-bold block mb-0.5">Kelompok KKN</span>
                    <span className="font-bold text-blue-600">{selectedStudentDetail.studentProfile?.kelompok?.name || "Belum Plotting"}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 font-bold block mb-0.5">Dosen Pendamping (DPL)</span>
                    <span className="font-bold text-indigo-600">
                      {selectedStudentDetail.studentProfile?.kelompok?.dplName ||
                       selectedStudentDetail.studentProfile?.kelompok?.dpl?.name ||
                       selectedStudentDetail.studentProfile?.kelompok?.dplNamaMentah ||
                       "Belum Plotting"}
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-100 dark:border-slate-800 col-span-2">
                    <span className="text-slate-400 font-bold block mb-0.5">Wilayah Tugas</span>
                    <span className="font-bold text-emerald-600">
                      {selectedStudentDetail.studentProfile?.kelompok?.wilayahPenugasan || selectedStudentDetail.rtRw?.name || selectedStudentDetail.wilayah || "-"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-800/60">
                <button
                  onClick={() => setSelectedStudentDetail(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Tambah / Edit */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/60">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {modalType === "add" ? "Tambah Mahasiswa KKN" : "Edit Mahasiswa KKN"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    value={formData.nama_lengkap}
                    onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">NIM *</label>
                  <input
                    type="text"
                    required
                    value={formData.nim}
                    onChange={(e) => setFormData({ ...formData, nim: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs font-mono text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Universitas / Perguruan Tinggi</label>
                  <input
                    type="text"
                    value={formData.universitas}
                    onChange={(e) => setFormData({ ...formData, universitas: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">No. WhatsApp (+62) *</label>
                  <input
                    type="text"
                    required
                    value={formData.no_telepon}
                    onChange={(e) => setFormData({ ...formData, no_telepon: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs font-mono text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    placeholder="081234567890"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Wilayah RT/RW Penugasan</label>
                  <select
                    value={formData.area_tugas}
                    onChange={(e) => setFormData({ ...formData, area_tugas: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                  >
                    <option value="">Pilih Wilayah RT/RW</option>
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} (Kel. {a.kelurahan?.name})
                      </option>
                    ))}
                  </select>
                </div>

                {modalType === "edit" && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Status Akun</label>
                    <select
                      value={formData.status_aktif}
                      onChange={(e) => setFormData({ ...formData, status_aktif: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                    >
                      <option value="Aktif">Aktif</option>
                      <option value="Nonaktif">Nonaktif</option>
                    </select>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-extrabold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    {isSubmitting && <Loader2 className="animate-spin" size={16} />}
                    Simpan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && studentToDelete && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col p-6 text-center border border-slate-200 dark:border-slate-800">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 border-4 border-rose-50">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">Nonaktifkan Akun</h3>
              <p className="text-xs text-slate-500 mb-6">
                Apakah Anda yakin ingin menonaktifkan akun <strong>{studentToDelete.name}</strong>?
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl font-bold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors text-xs"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 cursor-pointer transition-colors text-xs shadow-sm"
                >
                  Nonaktifkan
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ManajemenMahasiswa;
