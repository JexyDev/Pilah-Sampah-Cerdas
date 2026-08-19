import React, { useState, useEffect, useMemo } from "react";
import { Sparkles, Plus, Pencil, Trash2, Loader2, X, Search, Layers, CheckCircle2, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { ConfirmModal } from "../../components/common/ConfirmModal";
import { Pagination } from "../../components/common/Pagination";

export interface KegiatanSampahItem {
  id: string;
  nama: string;
  kategori: string;
  deskripsi?: string;
  statusAktif: boolean;
  createdAt: string;
  updatedAt: string;
}

const KATEGORI_OPTIONS = [
  { value: "ALL", label: "Semua Kategori" },
  { value: "KOMPOSTER", label: "Komposter & Organik" },
  { value: "BANK_SAMPAH", label: "Bank Sampah" },
  { value: "PUPUK_POC", label: "Pupuk Organik Cair (POC)" },
  { value: "MAGGOT_BSF", label: "Budidaya Maggot BSF" },
  { value: "BURUAN_SAE", label: "Buruan SAE / Urban Farming" },
  { value: "ECOBRICK", label: "Ecobrick & Kerajinan" },
  { value: "INOVASI_LAIN", label: "Inovasi Pengolahan Lainnya" },
];

export const MasterKegiatanSampahPage: React.FC = () => {
  const [kegiatanList, setKegiatanList] = useState<KegiatanSampahItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKategoriFilter, setSelectedKategoriFilter] = useState("ALL");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Form Modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nama: "",
    kategori: "KOMPOSTER",
    deskripsi: "",
    statusAktif: true,
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete Modal
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; nama: string }>({
    isOpen: false,
    id: "",
    nama: "",
  });

  const fetchKegiatan = async () => {
    setLoading(true);
    try {
      const res = await api.get("/master-kegiatan", {
        params: selectedKategoriFilter !== "ALL" ? { kategori: selectedKategoriFilter } : undefined,
      });
      if (res.data?.success && Array.isArray(res.data.data)) {
        setKegiatanList(res.data.data);
      }
    } catch (err: any) {
      console.error("Gagal memuat master kegiatan sampah:", err);
      toast.error("Gagal mengambil data master kegiatan dari server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKegiatan();
  }, [selectedKategoriFilter]);

  const filteredData = useMemo(() => {
    return kegiatanList.filter((item) => {
      const matchSearch =
        item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.deskripsi && item.deskripsi.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchSearch;
    });
  }, [kegiatanList, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const handleOpenAdd = () => {
    setFormMode("add");
    setEditingId(null);
    setFormData({
      nama: "",
      kategori: "KOMPOSTER",
      deskripsi: "",
      statusAktif: true,
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: KegiatanSampahItem) => {
    setFormMode("edit");
    setEditingId(item.id);
    setFormData({
      nama: item.nama,
      kategori: item.kategori,
      deskripsi: item.deskripsi || "",
      statusAktif: item.statusAktif,
    });
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim()) {
      toast.error("Nama kegiatan wajib diisi");
      return;
    }

    setSubmitting(true);
    try {
      if (formMode === "add") {
        await api.post("/master-kegiatan", formData);
        toast.success("Master kegiatan berhasil ditambahkan");
      } else if (editingId) {
        await api.put(`/master-kegiatan/${editingId}`, formData);
        toast.success("Master kegiatan berhasil diperbarui");
      }
      setIsFormOpen(false);
      fetchKegiatan();
    } catch (err: any) {
      console.error("Gagal menyimpan master kegiatan:", err);
      toast.error(err.response?.data?.message || "Gagal menyimpan master kegiatan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/master-kegiatan/${deleteModal.id}`);
      toast.success("Master kegiatan berhasil dihapus");
      setDeleteModal({ isOpen: false, id: "", nama: "" });
      fetchKegiatan();
    } catch (err: any) {
      console.error("Gagal menghapus master kegiatan:", err);
      toast.error(err.response?.data?.message || "Gagal menghapus master kegiatan");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold mb-2">
            <Sparkles size={14} />
            Master Tata Kelola & Inovasi Sampah
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Master Kegiatan & Inovasi Sampah</h1>
          <p className="text-xs text-slate-500 mt-1">
            Kelola daftar jenis aktivitas pengolahan sampah dan inovasi sirkular yang terdaftar di wilayah operasional.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <Plus size={15} />
          <span>Tambah Jenis Kegiatan</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 shrink-0">Kategori:</span>
          <select
            value={selectedKategoriFilter}
            onChange={(e) => {
              setSelectedKategoriFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-emerald-500"
          >
            {KATEGORI_OPTIONS.map((opt) => (
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
            placeholder="Cari jenis kegiatan..."
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
            <span className="text-xs font-semibold">Memuat master kegiatan sampah...</span>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Layers className="mx-auto text-slate-300" size={48} />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Belum Ada Kegiatan Sampah</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Belum ada master kegiatan yang didaftarkan untuk kategori ini. Silakan klik tombol Tambah.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-50/90 text-slate-500 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider font-bold">
                  <th className="py-3.5 px-4 w-12 text-center">No</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Nama Kegiatan</th>
                  <th className="py-3.5 px-4 w-44 text-center">Kategori</th>
                  <th className="py-3.5 px-4 min-w-[260px]">Deskripsi</th>
                  <th className="py-3.5 px-4 w-32 text-center">Status</th>
                  <th className="py-3.5 px-4 w-28 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {paginatedData.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                      {(currentPage - 1) * itemsPerPage + idx + 1}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 dark:text-slate-100 block text-sm">{item.nama}</span>
                      <span className="text-[10.5px] text-slate-400">
                        Dibuat: {new Date(item.createdAt).toLocaleDateString("id-ID")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-bold text-[10.5px]">
                        {item.kategori}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-slate-600 dark:text-slate-400 line-clamp-2">{item.deskripsi || "-"}</p>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {item.statusAktif ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-[10.5px]">
                          <CheckCircle2 size={12} />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-full font-bold text-[10.5px]">
                          <XCircle size={12} />
                          Non-Aktif
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition cursor-pointer"
                          title="Edit Kegiatan"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteModal({ isOpen: true, id: item.id, nama: item.nama })
                          }
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Hapus Kegiatan"
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
                <Sparkles size={18} className="text-emerald-600" />
                {formMode === "add" ? "Tambah Jenis Kegiatan Sampah" : "Edit Jenis Kegiatan Sampah"}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Kegiatan / Teknologi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pengomposan Bata Terawang, Budidaya Maggot BSF"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kategori Kegiatan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.kategori}
                  onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="KOMPOSTER">Komposter & Organik</option>
                  <option value="BANK_SAMPAH">Bank Sampah</option>
                  <option value="PUPUK_POC">Pupuk Organik Cair (POC)</option>
                  <option value="MAGGOT_BSF">Budidaya Maggot BSF</option>
                  <option value="BURUAN_SAE">Buruan SAE / Urban Farming</option>
                  <option value="ECOBRICK">Ecobrick & Kerajinan</option>
                  <option value="INOVASI_LAIN">Inovasi Pengolahan Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Deskripsi / Keterangan SOP
                </label>
                <textarea
                  rows={3}
                  placeholder="Jelaskan alur proses atau panduan kegiatan..."
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="statusAktif"
                  checked={formData.statusAktif}
                  onChange={(e) => setFormData({ ...formData, statusAktif: e.target.checked })}
                  className="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="statusAktif" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Status Aktif (Tersedia untuk dipilih pada input kegiatan)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  Simpan Kegiatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Hapus Master Kegiatan"
        message={`Apakah Anda yakin ingin menghapus master kegiatan "${deleteModal.nama}"?`}
        confirmText="Hapus Kegiatan"
        cancelText="Batal"
        type="danger"
        onConfirm={handleDelete}
        onClose={() => setDeleteModal({ isOpen: false, id: "", nama: "" })}
      />
    </div>
  );
};

export default MasterKegiatanSampahPage;
