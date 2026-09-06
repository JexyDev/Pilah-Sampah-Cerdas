import React, { useState, useEffect, useMemo } from "react";
import { BookOpen, Plus, Pencil, Trash2, Loader2, X, Search, FileText, ExternalLink, Download } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { ConfirmModal } from "../../components/common/ConfirmModal";
import { Pagination } from "../../components/common/Pagination";

export interface PanduanItem {
  id: string;
  judul: string;
  kategoriRole: string;
  deskripsi?: string;
  fileUrl?: string;
  linkUrl?: string;
  createdAt: string;
  updatedAt: string;
}

const ROLE_OPTIONS = [
  { value: "ALL", label: "Semua Kategori Peran" },
  { value: "WARGA", label: "Warga" },
  { value: "MAHASISWA_KKN", label: "Mahasiswa KKN" },
  { value: "RW", label: "Pengurus RW / RT" },
  { value: "PETUGAS_RESIDU", label: "Petugas Residu" },
  { value: "DPL", label: "Dosen Pendamping Lapangan" },
  { value: "UMUM", label: "Panduan Umum & SOP" },
];

export const MasterPanduanPage: React.FC = () => {
  const [panduanList, setPanduanList] = useState<PanduanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("ALL");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Form Modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    judul: "",
    kategoriRole: "WARGA",
    deskripsi: "",
    fileUrl: "",
    linkUrl: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete Modal
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; judul: string }>({
    isOpen: false,
    id: "",
    judul: "",
  });

  const fetchPanduan = async () => {
    setLoading(true);
    try {
      const res = await api.get("/panduan", {
        params: selectedRoleFilter !== "ALL" ? { kategoriRole: selectedRoleFilter } : undefined,
      });
      if (res.data?.success && Array.isArray(res.data.data)) {
        setPanduanList(res.data.data);
      }
    } catch (err: any) {
      console.error("Gagal memuat buku panduan:", err);
      toast.error("Gagal mengambil data buku panduan dari server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPanduan();
  }, [selectedRoleFilter]);

  const filteredData = useMemo(() => {
    return panduanList.filter((item) => {
      const matchSearch =
        item.judul.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.deskripsi && item.deskripsi.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchSearch;
    });
  }, [panduanList, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const handleOpenAdd = () => {
    setFormMode("add");
    setEditingId(null);
    setFormData({
      judul: "",
      kategoriRole: "WARGA",
      deskripsi: "",
      fileUrl: "",
      linkUrl: "",
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: PanduanItem) => {
    setFormMode("edit");
    setEditingId(item.id);
    setFormData({
      judul: item.judul,
      kategoriRole: item.kategoriRole,
      deskripsi: item.deskripsi || "",
      fileUrl: item.fileUrl || "",
      linkUrl: item.linkUrl || "",
    });
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.judul.trim()) {
      toast.error("Judul panduan wajib diisi");
      return;
    }

    setSubmitting(true);
    try {
      if (formMode === "add") {
        await api.post("/panduan", formData);
        toast.success("Dokumen panduan berhasil ditambahkan");
      } else if (editingId) {
        await api.put(`/panduan/${editingId}`, formData);
        toast.success("Dokumen panduan berhasil diperbarui");
      }
      setIsFormOpen(false);
      fetchPanduan();
    } catch (err: any) {
      console.error("Gagal menyimpan panduan:", err);
      toast.error(err.response?.data?.message || "Gagal menyimpan panduan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/panduan/${deleteModal.id}`);
      toast.success("Dokumen panduan berhasil dihapus");
      setDeleteModal({ isOpen: false, id: "", judul: "" });
      fetchPanduan();
    } catch (err: any) {
      console.error("Gagal menghapus panduan:", err);
      toast.error(err.response?.data?.message || "Gagal menghapus panduan");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold mb-2">
            <BookOpen size={14} />
            Master Data Edukasi & Dokumentasi
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Manajemen Buku Panduan</h1>
          <p className="text-xs text-slate-500 mt-1">
            Kelola arsip dokumen SOP, buku petunjuk teknis KKN, dan materi edukasi pemilahan sampah per peran.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <Plus size={15} />
          <span>Tambah Dokumen Panduan</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 shrink-0">Filter Peran:</span>
          <select
            value={selectedRoleFilter}
            onChange={(e) => {
              setSelectedRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-emerald-500"
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full md:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari judul panduan..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="animate-spin text-emerald-600" size={32} />
            <span className="text-xs font-semibold">Memuat dokumen panduan...</span>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <FileText className="mx-auto text-slate-300" size={48} />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Belum Ada Dokumen Panduan</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Belum ada panduan yang terdaftar untuk kategori peran ini. Silakan klik tombol Tambah.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-50/90 dark:bg-slate-800/90 text-slate-500 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider font-bold">
                  <th className="py-3.5 px-4 w-12 text-center">No</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Judul Dokumen</th>
                  <th className="py-3.5 px-4 w-40 text-center">Target Peran</th>
                  <th className="py-3.5 px-4 min-w-[260px]">Deskripsi</th>
                  <th className="py-3.5 px-4 w-36 text-center">Tautan / File</th>
                  <th className="py-3.5 px-4 w-28 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {paginatedData.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 dark:bg-slate-800/80 dark:hover:bg-slate-800/80 transition-colors">
                    <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                      {(currentPage - 1) * itemsPerPage + idx + 1}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 dark:text-slate-100 block text-sm">{item.judul}</span>
                      <span className="text-[10.5px] text-slate-400">
                        Diperbarui: {new Date(item.updatedAt).toLocaleDateString("id-ID")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-[10.5px]">
                        {item.kategoriRole}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-slate-600 dark:text-slate-400 line-clamp-2">{item.deskripsi || "-"}</p>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {item.linkUrl ? (
                          <a
                            href={item.linkUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition"
                            title="Buka Tautan"
                          >
                            <ExternalLink size={14} />
                          </a>
                        ) : null}
                        {item.fileUrl ? (
                          <a
                            href={item.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition"
                            title="Unduh File"
                          >
                            <Download size={14} />
                          </a>
                        ) : null}
                        {!item.linkUrl && !item.fileUrl && (
                          <span className="text-slate-300 text-[11px]">-</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition cursor-pointer"
                          title="Edit Panduan"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteModal({ isOpen: true, id: item.id, judul: item.judul })
                          }
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Hapus Panduan"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredData.length}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </div>
      </div>

      {/* Modal Add / Edit Form */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BookOpen size={18} className="text-emerald-600" />
                {formMode === "add" ? "Tambah Dokumen Panduan" : "Edit Dokumen Panduan"}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Judul Dokumen <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Panduan Operasional Tempat Sampah Pintar"
                  value={formData.judul}
                  onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kategori Peran Sasaran <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.kategoriRole}
                  onChange={(e) => setFormData({ ...formData, kategoriRole: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="WARGA">Warga</option>
                  <option value="MAHASISWA_KKN">Mahasiswa KKN</option>
                  <option value="RW">Pengurus RW / RT</option>
                  <option value="PETUGAS_RESIDU">Petugas Residu</option>
                  <option value="DPL">Dosen Pendamping Lapangan (DPL)</option>
                  <option value="UMUM">Umum & SOP</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tautan File / Dokumen (URL)
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/... atau tautan file PDF"
                  value={formData.linkUrl}
                  onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Deskripsi / Ringkasan Panduan
                </label>
                <textarea
                  rows={3}
                  placeholder="Jelaskan ringkasan materi panduan..."
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  Simpan Panduan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Hapus Dokumen Panduan"
        message={`Apakah Anda yakin ingin menghapus dokumen panduan "${deleteModal.judul}"?`}
        confirmText="Hapus Dokumen"
        cancelText="Batal"
        type="danger"
        onConfirm={handleDelete}
        onClose={() => setDeleteModal({ isOpen: false, id: "", judul: "" })}
      />
    </div>
  );
};

export default MasterPanduanPage;
