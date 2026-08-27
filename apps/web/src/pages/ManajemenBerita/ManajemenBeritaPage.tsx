/**
 * Project: BERSEKA
 * Page: ManajemenBerita — CMS Admin untuk Berita & Konten Kegiatan Mahasiswa KKN
 * Route: /manajemen-berita (accessible by ADMIN_DLH, DPL, DOSEN_PEMBIMBING, SUPER_USER, DEVELOPER)
 */

import React, { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Globe,
  Archive,
  FileText,
  CheckCircle,
  Clock,
  X,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  RefreshCw,
  Tag,
} from "lucide-react";
import toast from "react-hot-toast";
import { beritaService, type BeritaItem, type BeritaStatus, type BeritaKategori } from "../../services/beritaService";

// ─── Types ─────────────────────────────────────────────────────────────────
type FormMode = "create" | "edit";

const KATEGORI_OPTIONS: { value: BeritaKategori; label: string }[] = [
  { value: "KEGIATAN", label: "Kegiatan KKN" },
  { value: "PENGUMUMAN", label: "Pengumuman" },
  { value: "PRESTASI", label: "Prestasi Mahasiswa" },
  { value: "LINGKUNGAN", label: "Lingkungan Hidup" },
  { value: "UMUM", label: "Umum" },
];

const STATUS_CONFIG: Record<BeritaStatus, { label: string; color: string; icon: React.ReactNode }> = {
  PUBLISHED: { label: "Published", color: "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700/40", icon: <Globe size={11} /> },
  DRAFT: { label: "Draft", color: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700", icon: <FileText size={11} /> },
  ARCHIVED: { label: "Archived", color: "bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-700/40", icon: <Archive size={11} /> },
};

const EMPTY_FORM = {
  judul: "",
  ringkasan: "",
  konten: "",
  gambarUrl: "",
  kategori: "KEGIATAN" as BeritaKategori,
  tags: "",
  status: "DRAFT" as BeritaStatus,
};

// ─── Main Page ───────────────────────────────────────────────────────────────
export const ManajemenBeritaPage: React.FC = () => {
  const [beritaList, setBeritaList] = useState<BeritaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterKategori, setFilterKategori] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const LIMIT = 10;

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  // Confirm delete
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingTitle, setDeletingTitle] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await beritaService.getAdminList({
        limit: LIMIT,
        offset: (page - 1) * LIMIT,
        status: filterStatus === "ALL" ? undefined : filterStatus,
        kategori: filterKategori === "ALL" ? undefined : filterKategori,
        search: search.trim() || undefined,
      });
      setBeritaList(res.data || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      toast.error("Gagal memuat data berita");
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, filterKategori, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  // Reset page on filter change
  const handleFilterChange = (fn: () => void) => {
    setPage(1);
    fn();
  };

  // Open create form
  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormMode("create");
    setEditingId(null);
    setShowForm(true);
  };

  // Open edit form
  const openEdit = async (item: BeritaItem) => {
    setFormMode("edit");
    setEditingId(item.id);
    setForm({
      judul: item.judul,
      ringkasan: item.ringkasan || "",
      konten: item.konten || "",
      gambarUrl: item.gambarUrl || "",
      kategori: item.kategori,
      tags: (item.tags || []).join(", "),
      status: item.status,
    });
    setShowForm(true);
  };

  // Submit create / edit
  const handleSubmit = async () => {
    if (!form.judul.trim()) { toast.error("Judul berita tidak boleh kosong"); return; }
    if (!form.konten.trim()) { toast.error("Konten berita tidak boleh kosong"); return; }

    setSubmitting(true);
    try {
      const payload = {
        judul: form.judul.trim(),
        ringkasan: form.ringkasan.trim() || undefined,
        konten: form.konten.trim(),
        gambarUrl: form.gambarUrl.trim() || undefined,
        kategori: form.kategori,
        tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : undefined,
        status: form.status,
      };

      if (formMode === "create") {
        await beritaService.create(payload);
        toast.success("Berita berhasil dibuat!");
      } else if (editingId) {
        await beritaService.update(editingId, payload);
        toast.success("Berita berhasil diperbarui!");
      }

      setShowForm(false);
      setForm(EMPTY_FORM);
      await loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Gagal menyimpan berita");
    } finally {
      setSubmitting(false);
    }
  };

  // Change status
  const handleChangeStatus = async (id: string, status: BeritaStatus) => {
    try {
      await beritaService.changeStatus(id, status);
      const msg = status === "PUBLISHED" ? "Berita diterbitkan ke landing page!" : status === "ARCHIVED" ? "Berita diarsipkan." : "Berita dikembalikan ke draft.";
      toast.success(msg);
      await loadData();
    } catch {
      toast.error("Gagal mengubah status berita");
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await beritaService.delete(deletingId);
      toast.success("Berita berhasil dihapus");
      setDeletingId(null);
      await loadData();
    } catch {
      toast.error("Gagal menghapus berita");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-800 dark:text-slate-200">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
            <Globe size={15} />
            <span>CMS Konten</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Manajemen Berita Kegiatan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl">
            Kelola berita dan konten kegiatan mahasiswa KKN yang akan tampil secara real-time di landing page publik.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl flex items-center gap-2 transition shadow-sm cursor-pointer"
        >
          <Plus size={16} /> Tulis Berita Baru
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari judul berita..."
              value={search}
              onChange={(e) => handleFilterChange(() => setSearch(e.target.value))}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-100 placeholder-slate-400"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => handleFilterChange(() => setFilterStatus(e.target.value))}
            className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <select
            value={filterKategori}
            onChange={(e) => handleFilterChange(() => setFilterKategori(e.target.value))}
            className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <option value="ALL">Semua Kategori</option>
            {KATEGORI_OPTIONS.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
          </select>
          <button
            type="button"
            onClick={loadData}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl transition cursor-pointer"
            title="Refresh"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Daftar Berita
            <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">({total} total)</span>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wide">
                <th className="px-4 py-3 text-left w-[35%]">Judul</th>
                <th className="px-4 py-3 text-left">Kategori</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Views</th>
                <th className="px-4 py-3 text-left">Tanggal</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw size={16} className="animate-spin" /> Memuat data...
                    </div>
                  </td>
                </tr>
              ) : beritaList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <FileText size={32} className="opacity-30" />
                      <p className="font-semibold">Belum ada berita yang dibuat</p>
                      <button
                        type="button"
                        onClick={openCreate}
                        className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition cursor-pointer"
                      >
                        Tulis Berita Pertama
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                beritaList.map((item) => {
                  const statusCfg = STATUS_CONFIG[item.status];
                  return (
                    <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2.5">
                          {item.gambarUrl ? (
                            <img src={item.gambarUrl} alt="" className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                              <ImageIcon size={14} className="text-slate-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 dark:text-slate-100 line-clamp-1">{item.judul}</p>
                            {item.ringkasan && <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{item.ringkasan}</p>}
                            {item.author && <p className="text-[10px] text-slate-400 mt-0.5">oleh {item.author.name}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-semibold">
                          {KATEGORI_OPTIONS.find(k => k.value === item.kategori)?.label || item.kategori}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full font-bold ${statusCfg.color}`}>
                          {statusCfg.icon} {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                          <Eye size={11} /> {item.viewCount}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                        {item.publishedAt
                          ? new Date(item.publishedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
                          : new Date(item.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Publish / Unpublish toggle */}
                          {item.status === "PUBLISHED" ? (
                            <button
                              type="button"
                              onClick={() => handleChangeStatus(item.id, "DRAFT")}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                              title="Kembalikan ke Draft"
                            >
                              <Clock size={13} />
                            </button>
                          ) : item.status === "DRAFT" ? (
                            <button
                              type="button"
                              onClick={() => handleChangeStatus(item.id, "PUBLISHED")}
                              className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400 transition cursor-pointer"
                              title="Terbitkan ke Landing Page"
                            >
                              <Globe size={13} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleChangeStatus(item.id, "DRAFT")}
                              className="p-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/60 hover:bg-orange-100 text-orange-700 dark:text-orange-400 transition cursor-pointer"
                              title="Kembalikan dari Arsip ke Draft"
                            >
                              <RefreshCw size={13} />
                            </button>
                          )}

                          {item.status !== "ARCHIVED" && (
                            <button
                              type="button"
                              onClick={() => handleChangeStatus(item.id, "ARCHIVED")}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-950/40 text-slate-500 hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-400 transition cursor-pointer"
                              title="Arsipkan"
                            >
                              <Archive size={13} />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => openEdit(item)}
                            className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-400 transition cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 size={13} />
                          </button>

                          <button
                            type="button"
                            onClick={() => { setDeletingId(item.id); setDeletingTitle(item.judul); }}
                            className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-400 transition cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 px-5 py-3 border-t border-slate-200/80 dark:border-slate-700 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              Halaman {page} dari {totalPages} • {total} berita
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── MODAL: FORM BUAT/EDIT BERITA ─────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-900 text-white shrink-0">
              <div>
                <h2 className="font-black text-base flex items-center gap-2">
                  <FileText size={17} className="text-emerald-400" />
                  {formMode === "create" ? "Tulis Berita Baru" : "Edit Berita"}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Konten yang diterbitkan akan tampil di landing page secara real-time.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Judul */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Judul Berita <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.judul}
                  onChange={e => setForm(f => ({ ...f, judul: e.target.value }))}
                  placeholder="Contoh: Mahasiswa KKN Sadang Serang Raih Penghargaan Lingkungan..."
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-100 placeholder-slate-400"
                />
              </div>

              {/* Ringkasan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Ringkasan (Deskripsi Singkat)</label>
                <textarea
                  rows={2}
                  value={form.ringkasan}
                  onChange={e => setForm(f => ({ ...f, ringkasan: e.target.value }))}
                  placeholder="Deskripsi singkat 1–2 kalimat untuk preview di landing page..."
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-100 placeholder-slate-400 resize-none"
                />
              </div>

              {/* Konten */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Konten Lengkap <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={8}
                  value={form.konten}
                  onChange={e => setForm(f => ({ ...f, konten: e.target.value }))}
                  placeholder="Tulis konten berita lengkap di sini. Mendukung teks biasa dengan paragraf..."
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-100 placeholder-slate-400 resize-y"
                />
              </div>

              {/* Gambar URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <ImageIcon size={12} /> URL Gambar Utama (Cover)
                </label>
                <input
                  type="url"
                  value={form.gambarUrl}
                  onChange={e => setForm(f => ({ ...f, gambarUrl: e.target.value }))}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-100 placeholder-slate-400"
                />
                {form.gambarUrl && (
                  <img src={form.gambarUrl} alt="preview" className="mt-2 h-20 rounded-xl object-cover border border-slate-200 dark:border-slate-700" onError={e => (e.currentTarget.style.display = "none")} />
                )}
              </div>

              {/* Kategori & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Kategori</label>
                  <select
                    value={form.kategori}
                    onChange={e => setForm(f => ({ ...f, kategori: e.target.value as BeritaKategori }))}
                    className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 text-slate-700 dark:text-slate-200"
                  >
                    {KATEGORI_OPTIONS.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Status Publikasi</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value as BeritaStatus }))}
                    className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 text-slate-700 dark:text-slate-200"
                  >
                    <option value="DRAFT">Draft (Tidak tampil)</option>
                    <option value="PUBLISHED">Published (Tampil di landing page)</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Tag size={12} /> Tags (pisahkan dengan koma)
                </label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                  placeholder="kkn, lingkungan, penghijauan, gotong royong..."
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-100 placeholder-slate-400"
                />
              </div>

              {/* Published info */}
              {form.status === "PUBLISHED" && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-700/40 rounded-xl text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                  <CheckCircle size={14} />
                  Berita akan langsung tampil di landing page publik setelah disimpan.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition disabled:opacity-60 cursor-pointer flex items-center gap-2"
              >
                {submitting ? <><RefreshCw size={14} className="animate-spin" /> Menyimpan...</> : <><CheckCircle size={14} /> {formMode === "create" ? "Terbitkan / Simpan" : "Perbarui Berita"}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: KONFIRMASI HAPUS ────────────────────────────────────── */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-red-600 dark:text-rose-400 flex items-center gap-2">
              <Trash2 size={18} /> Hapus Berita
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Yakin ingin menghapus berita <strong className="text-slate-900 dark:text-slate-100">"{deletingTitle}"</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManajemenBeritaPage;
