import React, { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Search, Loader2, X, GraduationCap, User, BookOpen } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { useAuthStore } from "../../store/useAuthStore";

export const ManajemenEkosistemKkn: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const isReadOnly = ["ADMIN_DLH", "CAMAT", "LURAH"].includes(currentUser?.peran || "");

  const [activeTab, setActiveTab] = useState("kelompok");

  // Kelompok State
  const [kelompokList, setKelompokList] = useState<any[]>([]);
  const [loadingKelompok, setLoadingKelompok] = useState(true);
  const [searchKelompok, setSearchKelompok] = useState("");
  const [isKelompokModalOpen, setIsKelompokModalOpen] = useState(false);
  const [kelompokModalType, setKelompokModalType] = useState<"add" | "edit">("add");
  const [selectedKelompokId, setSelectedKelompokId] = useState<string | null>(null);
  const [kelompokForm, setKelompokForm] = useState({ name: "", dplId: "" });
  const [submittingKelompok, setSubmittingKelompok] = useState(false);

  // DPL State
  const [dplList, setDplList] = useState<any[]>([]);
  const [loadingDpl, setLoadingDpl] = useState(true);
  const [isDplModalOpen, setIsDplModalOpen] = useState(false);
  const [dplForm, setDplForm] = useState({ name: "", email: "", phone: "", password: "", nik: "" });
  const [submittingDpl, setSubmittingDpl] = useState(false);

  // Universitas State (derived statically/dynamically)
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
      const res = await api.get(`/kelompok?search=${searchKelompok}`);
      if (res.data?.success) {
        setKelompokList(res.data.groups);
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
        setDplList(res.data.data);
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
  }, [activeTab, searchKelompok]);

  // Kelompok Submit Handlers
  const handleOpenAddKelompok = () => {
    setKelompokModalType("add");
    setKelompokForm({ name: "", dplId: "" });
    setSelectedKelompokId(null);
    setIsKelompokModalOpen(true);
  };

  const handleOpenEditKelompok = (k: any) => {
    setKelompokModalType("edit");
    setKelompokForm({ name: k.name, dplId: k.dpl?.id || "" });
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
    try {
      if (kelompokModalType === "add") {
        await api.post("/kelompok", kelompokForm);
        toast.success("Kelompok berhasil dibuat!");
      } else {
        await api.put(`/kelompok/${selectedKelompokId}`, kelompokForm);
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
        nik: dplForm.nik || `DPL-${Date.now()}`,
        universityId: "PSC-UNIVERSITY"
      });
      toast.success("Dosen Pembimbing Lapangan (DPL) berhasil didaftarkan!");
      setIsDplModalOpen(false);
      setDplForm({ name: "", email: "", phone: "", password: "", nik: "" });
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
            { id: "kelompok", label: "Kelompok KKN", icon: GraduationCap },
            { id: "dpl", label: "Dosen Pembimbing (DPL)", icon: User },
            { id: "universitas", label: "Universitas Mitra", icon: BookOpen }
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
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Cari kelompok..."
                  value={searchKelompok}
                  onChange={(e) => setSearchKelompok(e.target.value)}
                  className="pl-10 pr-4 py-2.5 w-full border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              {!isReadOnly && (
                <button
                  onClick={handleOpenAddKelompok}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                >
                  <Plus size={18} />
                  Tambah Kelompok
                </button>
              )}
            </div>

            {loadingKelompok ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="animate-spin text-emerald-600" size={32} />
                <p className="text-slate-500 font-medium">Memuat data kelompok KKN...</p>
              </div>
            ) : kelompokList.length === 0 ? (
              <div className="text-center py-16 text-slate-500 font-medium border border-dashed border-slate-200 rounded-2xl">
                Belum ada data kelompok KKN.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="p-4 font-bold text-xs text-slate-600 uppercase tracking-wider">Nama Kelompok</th>
                      <th className="p-4 font-bold text-xs text-slate-600 uppercase tracking-wider">Dosen Pembimbing (DPL)</th>
                      <th className="p-4 font-bold text-xs text-slate-600 uppercase tracking-wider text-center">Jumlah Anggota</th>
                      {!isReadOnly && (
                        <th className="p-4 font-bold text-xs text-slate-600 uppercase tracking-wider text-center">Aksi</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {kelompokList.map((k) => (
                      <tr key={k.id} className="hover:bg-slate-50/55 transition-colors">
                        <td className="p-4 font-semibold text-slate-800">{k.name}</td>
                        <td className="p-4 text-slate-600">{k.dpl?.name || <span className="text-slate-400 italic">Belum ditentukan</span>}</td>
                        <td className="p-4 text-slate-600 text-center font-medium">{k.students?.length || 0} Mahasiswa</td>
                        {!isReadOnly && (
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-3">
                              <button
                                onClick={() => handleOpenEditKelompok(k)}
                                className="p-1.5 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
                                title="Edit Kelompok"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteKelompok(k.id)}
                                className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
                                title="Hapus Kelompok"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "dpl" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">Dosen Pembimbing Lapangan (DPL)</h2>
              {!isReadOnly && (
                <button
                  onClick={() => setIsDplModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
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
            ) : dplList.length === 0 ? (
              <div className="text-center py-16 text-slate-500 font-medium border border-dashed border-slate-200 rounded-2xl">
                Belum ada dosen pembimbing yang terdaftar.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dplList.map((dp) => (
                  <div
                    key={dp.id}
                    className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between hover:shadow-xs transition-shadow"
                  >
                    <div>
                      <h3 className="font-bold text-slate-800 text-base">{dp.name}</h3>
                      <p className="text-xs text-slate-500 mt-1">{dp.email || "Email tidak tersedia"}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{dp.phone || "No HP tidak tersedia"}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-600 font-medium">
                      <span>Peran: Dosen Pembimbing</span>
                      <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-bold">
                        Aktif
                      </span>
                    </div>
                  </div>
                ))}
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
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm px-5 py-2.5 rounded-xl transition-colors cursor-pointer shadow-xs"
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
                  placeholder="Contoh: Kelompok A"
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
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white"
                >
                  <option value="">Pilih DPL (Opsional)</option>
                  {dplList.map((dp) => (
                    <option key={dp.id} value={dp.id}>
                      {dp.name}
                    </option>
                  ))}
                </select>
              </div>

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
                  placeholder="Minimal 6 karakter"
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
                  value={dplForm.nik}
                  onChange={(e) => setDplForm({ ...dplForm, nik: e.target.value })}
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
