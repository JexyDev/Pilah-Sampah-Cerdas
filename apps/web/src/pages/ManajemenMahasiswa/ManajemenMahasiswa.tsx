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
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Users,
  CheckCircle,
  MapPin,
  Eye,
  Building,
  Phone,
  FileSpreadsheet,
  Download,
  Filter
} from "lucide-react";
import Sidebar from "../../components/layout/Sidebar/Sidebar";

const ManajemenMahasiswa: React.FC = () => {
  const { user } = useAuthStore();

  const [mahasiswas, setMahasiswas] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [kelompokFilter, setKelompokFilter] = useState("Semua");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    nama_lengkap: "",
    nim: "",
    universitas: "UNIKOM",
    no_telepon: "",
    area_tugas: "",
    status_aktif: "Aktif",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<any>(null);

  const fetchMahasiswas = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/mahasiswa?search=${searchTerm}&limit=500`);
      setMahasiswas(response.data.users || []);
    } catch (err: any) {
      setError("Gagal memuat data mahasiswa dari server.");
      toast.error(err.response?.data?.message || "Gagal memuat data mahasiswa");
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
  }, [searchTerm, statusFilter, kelompokFilter]);

  // Extract unique Kelompok KKN list
  const uniqueKelompoks = useMemo(() => {
    const set = new Set<string>();
    mahasiswas.forEach((m) => {
      if (m.studentProfile?.kelompok?.name) {
        set.add(m.studentProfile.kelompok.name);
      }
    });
    return Array.from(set).sort();
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

      return matchesSearch && matchesStatus && matchesKelompok;
    });
  }, [mahasiswas, searchTerm, statusFilter, kelompokFilter]);

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
      area_tugas: mhs.rtRwId ? String(mhs.rtRwId) : "",
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

  const handleExportCSV = () => {
    if (filteredMahasiswas.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    const headers = ["Nama Lengkap", "NIM", "Universitas", "No WhatsApp", "Kelompok KKN", "Wilayah RT/RW", "Status"];
    const csvRows = [headers.join(",")];

    filteredMahasiswas.forEach((m) => {
      const row = [
        `"${m.name || ""}"`,
        `"${m.studentProfile?.nim || ""}"`,
        `"${m.studentProfile?.fakultas || "UNIKOM"}"`,
        `"${m.phone || ""}"`,
        `"${m.studentProfile?.kelompok?.name || "-"}"`,
        `"${m.rtRw?.name || "-"}"`,
        `"${m.status || "Aktif"}"`,
      ];
      csvRows.push(row.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `data-mahasiswa-kkn-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Berhasil mengunduh ${filteredMahasiswas.length} data mahasiswa!`);
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredMahasiswas.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedMahasiswas = filteredMahasiswas.slice(startIndex, startIndex + rowsPerPage);

  if (user?.peran !== "SUPER_ADMIN") {
    return (
      <div className="p-8 text-center text-rose-600 font-bold bg-white rounded-2xl m-6 border border-rose-200">
        Akses Ditolak. Halaman ini khusus Super Admin.
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <Sidebar isOpen={true} onClose={() => {}} />

      <main className="flex-1 overflow-y-auto p-8 relative space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Manajemen Mahasiswa KKN</h1>
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
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all text-xs border border-slate-200 cursor-pointer"
            >
              <Download size={15} /> Ekspor CSV
            </button>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Mahasiswa</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{mahasiswas.length}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Status Aktif</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              {mahasiswas.filter((m) => m.status === "Aktif").length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Kelompok KKN</p>
            <p className="text-2xl font-black text-blue-600 mt-1">{uniqueKelompoks.length} Kelompok</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Wilayah Dampingan</p>
            <p className="text-2xl font-black text-purple-600 mt-1">{areas.length} RT/RW</p>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari Nama, NIM, No. WA..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <div className="flex items-center gap-2 flex-1 justify-end">
            <Filter size={15} className="text-slate-400" />
            <span className="text-xs font-bold text-slate-600">Filter:</span>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
            >
              <option value="Semua">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Nonaktif">Nonaktif</option>
            </select>

            <select
              value={kelompokFilter}
              onChange={(e) => setKelompokFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
            >
              <option value="Semua">Semua Kelompok</option>
              {uniqueKelompoks.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table Master Data */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-4 w-14 text-center">No</th>
                  <th className="py-3.5 px-4">Nama & NIM</th>
                  <th className="py-3.5 px-4">Universitas / Fakultas</th>
                  <th className="py-3.5 px-4">No. WhatsApp</th>
                  <th className="py-3.5 px-4">Kelompok KKN</th>
                  <th className="py-3.5 px-4">Wilayah Tugas</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="animate-spin text-primary" size={32} />
                        <p className="font-bold text-xs">Memuat data mahasiswa KKN...</p>
                      </div>
                    </td>
                  </tr>
                ) : paginatedMahasiswas.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-semibold">
                      Tidak ada data mahasiswa yang cocok dengan kriteria pencarian.
                    </td>
                  </tr>
                ) : (
                  paginatedMahasiswas.map((mhs, idx) => (
                    <tr key={mhs.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                        {startIndex + idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{mhs.name}</p>
                        <p className="text-[10px] font-mono text-slate-400">NIM: {mhs.studentProfile?.nim || "-"}</p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-semibold">
                        {mhs.studentProfile?.fakultas || "UNIKOM"}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">
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
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {mhs.rtRw?.name ? (
                          <span className="flex items-center gap-1">
                            <MapPin size={13} className="text-primary" />
                            {mhs.rtRw.name}
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
                            className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-primary hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                            title="Detail Profil"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(mhs)}
                            className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-blue-600 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                            title="Edit Data"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(mhs)}
                            className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-rose-600 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
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

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs font-bold text-slate-500">
                Halaman <span className="text-slate-900 font-black">{currentPage}</span> dari{" "}
                <span className="text-slate-900 font-black">{totalPages}</span>
              </p>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft size={14} /> Sebelum
                </button>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  Lanjut <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Detail Student */}
        {selectedStudentDetail && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col border border-slate-200">
              <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
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
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/20">
                    {selectedStudentDetail.name?.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-base">{selectedStudentDetail.name}</h4>
                    <p className="text-xs font-mono text-slate-500">NIM: {selectedStudentDetail.studentProfile?.nim || "-"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-slate-400 font-bold block mb-0.5">Universitas</span>
                    <span className="font-bold text-slate-700">{selectedStudentDetail.studentProfile?.fakultas || "UNIKOM"}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-slate-400 font-bold block mb-0.5">No. WhatsApp</span>
                    <span className="font-mono font-bold text-slate-700">{selectedStudentDetail.phone || "-"}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-slate-400 font-bold block mb-0.5">Kelompok KKN</span>
                    <span className="font-bold text-blue-600">{selectedStudentDetail.studentProfile?.kelompok?.name || "Belum Plotting"}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-slate-400 font-bold block mb-0.5">Wilayah Tugas</span>
                    <span className="font-bold text-emerald-600">{selectedStudentDetail.rtRw?.name || "-"}</span>
                  </div>
                </div>
              </div>

              <div className="px-6 py-3 border-t border-slate-200 flex justify-end bg-slate-50">
                <button
                  onClick={() => setSelectedStudentDetail(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
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
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col border border-slate-200">
              <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h3 className="text-lg font-bold text-slate-800">
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    value={formData.nama_lengkap}
                    onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">NIM *</label>
                  <input
                    type="text"
                    required
                    value={formData.nim}
                    onChange={(e) => setFormData({ ...formData, nim: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono text-slate-800 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Universitas / Perguruan Tinggi</label>
                  <input
                    type="text"
                    value={formData.universitas}
                    onChange={(e) => setFormData({ ...formData, universitas: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">No. WhatsApp (+62) *</label>
                  <input
                    type="text"
                    required
                    value={formData.no_telepon}
                    onChange={(e) => setFormData({ ...formData, no_telepon: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono text-slate-800 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    placeholder="081234567890"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Wilayah RT/RW Penugasan</label>
                  <select
                    value={formData.area_tugas}
                    onChange={(e) => setFormData({ ...formData, area_tugas: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
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
                    <label className="block text-xs font-bold text-slate-700 mb-1">Status Akun</label>
                    <select
                      value={formData.status_aktif}
                      onChange={(e) => setFormData({ ...formData, status_aktif: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                    >
                      <option value="Aktif">Aktif</option>
                      <option value="Nonaktif">Nonaktif</option>
                    </select>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
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
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col p-6 text-center border border-slate-200">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 border-4 border-rose-50">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Nonaktifkan Akun</h3>
              <p className="text-xs text-slate-500 mb-6">
                Apakah Anda yakin ingin menonaktifkan akun <strong>{studentToDelete.name}</strong>?
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl font-bold border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors text-xs"
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
