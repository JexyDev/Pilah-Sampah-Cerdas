import React, { useState, useEffect } from "react";
import { Upload, Send, Loader2, CheckCircle, XCircle, Search, Filter, Trash2, X, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../utils/api";
import { useAuthStore } from "../../store/useAuthStore";
import PageHeader from "../../components/common/PageHeader";
import { Lightbulb } from "lucide-react";

interface IdeDaurUlang {
  id: string;
  judul: string;
  material: string;
  foto: string | null;
  statusApproval: string;
  createdAt: string;
  user: {
    name: string;
    role: {
      name: string;
    };
  };
}

const IdeDaurUlang: React.FC = () => {
  const { user } = useAuthStore();
  const [ides, setIdes] = useState<IdeDaurUlang[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [judul, setJudul] = useState("");
  const [material, setMaterial] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search, Filter & Pagination
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchIdes = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (searchInput) query.append("search", searchInput);
      if (statusFilter) query.append("status", statusFilter);

      const res = await api.get(`/ide-daur-ulang?${query.toString()}`);
      if (res.data.success) {
        setIdes(res.data.data);
      }
    } catch (err) {
      toast.error("Gagal memuat ide daur ulang");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdes();
  }, [statusFilter]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchIdes();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  // Delete Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul || !material) {
      toast.error("Judul dan material wajib diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("judul", judul);
      formData.append("material", material);
      if (foto) {
        formData.append("foto", foto);
      }

      if (editingId) {
        await api.put(`/ide-daur-ulang/${editingId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Ide berhasil diperbarui!");
      } else {
        await api.post("/ide-daur-ulang", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Ide berhasil dikirim dan menunggu persetujuan!");
      }

      setEditingId(null);
      setJudul("");
      setMaterial("");
      setFoto(null);
      fetchIdes();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menyimpan ide");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (ide: IdeDaurUlang) => {
    setEditingId(ide.id);
    setJudul(ide.judul);
    setMaterial(ide.material);
    setFoto(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      await api.delete(`/ide-daur-ulang/${deletingId}`);
      toast.success("Ide berhasil dihapus");
      setIsDeleteModalOpen(false);
      fetchIdes();
    } catch (err) {
      toast.error("Gagal menghapus ide");
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.put(`/ide-daur-ulang/${id}/approve`);
      toast.success("Ide disetujui, Warga mendapatkan 50 poin!");
      fetchIdes();
    } catch (err) {
      toast.error("Gagal approve ide");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.put(`/ide-daur-ulang/${id}/reject`);
      toast.success("Ide ditolak");
      fetchIdes();
    } catch (err) {
      toast.error("Gagal reject ide");
    }
  };

  const getImageUrl = (path: string | null) => {
    if (!path) return "";
    return path;
  };

  const canSubmit = user?.peran === "WARGA" || user?.peran === "SUPER_USER" || user?.peran === "ADMIN_DLH" || user?.peran === "RW";
  const isRW = user?.peran === "RW" || user?.peran === "SUPER_USER";
  const isAdmin = user?.peran === "SUPER_USER" || user?.peran === "ADMIN_DLH" || user?.peran === "RW";

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 text-slate-800 dark:text-slate-100 font-sans">
      <PageHeader
        icon={Lightbulb}
        category="Kreativitas & Pemanfaatan"
        scope="Komunitas Warga Binaan"
        title="Ide & Inovasi Daur Ulang"
        description="Bagikan inspirasi daur ulang sampah lingkungan. Ide yang disetujui RW mendapatkan 50 poin gamifikasi."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Form Submit */}
        {canSubmit && (
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl shadow-2xs border border-slate-200/90 h-fit space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100">{editingId ? "Edit Ide Daur Ulang" : "Bagikan Ide Baru"}</h2>
              <p className="text-xs text-slate-500 font-medium">Unggah konsep kreasi pengolahan daur ulang</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Judul Ide</label>
                <input
                  type="text"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#009966] focus:bg-white transition"
                  placeholder="Contoh: Pot Tanaman dari Botol Plastik"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Material yang Digunakan</label>
                <textarea
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#009966] focus:bg-white transition"
                  rows={3}
                  placeholder="Contoh: Botol plastik bekas, cat akrilik, tali rami"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Foto Dokumentasi (Opsional)</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl cursor-pointer transition text-xs font-bold border border-slate-200/80 dark:border-slate-800">
                    <Upload size={15} className="text-slate-500" />
                    <span>Pilih Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setFoto(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                  {foto && <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 truncate max-w-[150px]">{foto.name}</span>}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-emerald-700 transition disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  <span>{editingId ? "Simpan Perubahan" : "Kirim Ide"}</span>
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setJudul("");
                      setMaterial("");
                      setFoto(null);
                    }}
                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Batal
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Kolom Kanan: Feed List */}
        <div className={canSubmit ? "lg:col-span-2" : "lg:col-span-3"}>
          
          {/* Search & Filter Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xs border border-slate-200/90 p-4 mb-6 flex flex-col sm:flex-row gap-3.5 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Cari ide, material, atau nama penulis..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#009966] focus:bg-white transition"
              />
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto min-w-[150px]">
              <Filter size={15} className="text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#009966] transition cursor-pointer"
              >
                <option value="">Semua Status</option>
                <option value="APPROVED">Disetujui</option>
                <option value="PENDING">Menunggu</option>
                <option value="REJECTED">Ditolak</option>
              </select>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xs border border-slate-200/90 p-5 sm:p-6">
            <h2 className="text-base font-black text-slate-900 dark:text-slate-100 mb-4">Feed Publik Inovasi</h2>
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin text-emerald-600" /></div>
            ) : ides.length === 0 ? (
              <div className="text-center text-slate-400 py-12 text-xs font-bold">Belum ada ide daur ulang.</div>
            ) : (
              <>
                <div className="space-y-4">
                  {ides.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((ide) => (
                    <div key={ide.id} className="border border-slate-100 dark:border-slate-800 rounded-xl p-4.5 hover:border-slate-200 hover:bg-slate-50/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 transition group">
                      <div className="flex justify-between items-start mb-2.5">
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">{ide.judul}</h3>
                          <p className="text-[11px] text-slate-500 font-medium">Oleh: {ide.user.name} ({ide.user.role.name}) • {new Date(ide.createdAt).toLocaleDateString("id-ID")}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {ide.statusApproval === "APPROVED" && <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-lg text-[11px] font-bold">Disetujui</span>}
                          {ide.statusApproval === "PENDING" && <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-lg text-[11px] font-bold">Menunggu</span>}
                          {ide.statusApproval === "REJECTED" && <span className="bg-rose-50 text-rose-800 border border-rose-200 px-2.5 py-0.5 rounded-lg text-[11px] font-bold">Ditolak</span>}

                          {isAdmin && (
                            <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleEdit(ide)}
                                className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit Ide"
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(ide.id)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Hapus Ide"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 mb-3 whitespace-pre-wrap leading-relaxed"><span className="font-bold text-slate-800 dark:text-slate-100">Material: </span>{ide.material}</p>
                      
                      {ide.foto && (
                        <div className="mb-3">
                          <img src={getImageUrl(ide.foto)} alt={ide.judul} className="rounded-xl max-h-56 object-cover border border-slate-100 dark:border-slate-800" />
                        </div>
                      )}

                      {isRW && ide.statusApproval === "PENDING" && (
                        <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                          <button
                            onClick={() => handleApprove(ide.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition border border-emerald-200 cursor-pointer"
                          >
                            <CheckCircle size={14} />
                            <span>Setujui (+50 Poin)</span>
                          </button>
                          <button
                            onClick={() => handleReject(ide.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold transition border border-rose-200 cursor-pointer"
                          >
                            <XCircle size={14} />
                            <span>Tolak</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {Math.ceil(ides.length / itemsPerPage) > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-semibold text-slate-500">
                      Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, ides.length)} dari {ides.length} ide daur ulang
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                      >
                        ← Sebelum
                      </button>
                      {Array.from({ length: Math.ceil(ides.length / itemsPerPage) }, (_, i) => i + 1).map((pg) => (
                        <button
                          key={pg}
                          type="button"
                          onClick={() => setCurrentPage(pg)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition cursor-pointer ${
                            currentPage === pg
                              ? "bg-emerald-600 text-white"
                              : "border border-slate-200 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                          }`}
                        >
                          {pg}
                        </button>
                      ))}
                      <button
                        type="button"
                        disabled={currentPage === Math.ceil(ides.length / itemsPerPage)}
                        onClick={() => setCurrentPage((p) => Math.min(Math.ceil(ides.length / itemsPerPage), p + 1))}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                      >
                        Selanjut →
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal Hapus */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg w-full max-w-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-outline-variant/30 flex justify-between items-center">
              <h3 className="text-lg font-bold text-error">Hapus Ide</h3>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-700 dark:text-slate-300">Apakah Anda yakin ingin menghapus konten ide daur ulang ini? File gambar terkait juga akan dihapus dari server.</p>
            </div>
            <div className="px-6 py-4 border-t border-outline-variant/30 flex justify-end gap-3 bg-gray-50 dark:bg-slate-800/60">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-slate-400 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800/60"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-bold text-white bg-error rounded-lg hover:bg-error/90"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IdeDaurUlang;
