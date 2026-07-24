import React, { useState, useEffect } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import api from "../../services/api";
import { toast } from "react-hot-toast";
import { Loader2, Plus, X, Pencil, Trash2, Search, GraduationCap } from "lucide-react";
import Sidebar from "../../components/layout/Sidebar/Sidebar";

const ManajemenMahasiswa: React.FC = () => {
  const { user } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [mahasiswas, setMahasiswas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    nama_lengkap: "",
    nim: "",
    universitas: "UNIKOM",
    no_telepon: "",
    status_aktif: "Aktif",
  });

  const fetchMahasiswas = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/mahasiswa?search=${searchTerm}`);
      setMahasiswas(response.data.users || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal memuat data mahasiswa");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMahasiswas();
  }, [searchTerm]);

  const handleSubmit = async () => {
    if (!formData.nama_lengkap || !formData.nim || !formData.no_telepon) {
      toast.error("Nama, NIM, dan No Telepon wajib diisi");
      return;
    }
    
    // Ensure no_telepon starts with +62
    let phone = formData.no_telepon;
    if (phone.startsWith("0")) phone = "+62" + phone.substring(1);
    else if (!phone.startsWith("+62")) phone = "+62" + phone;

    try {
      const payload = { ...formData, no_telepon: phone };
      if (editId) {
        await api.put(`/admin/mahasiswa/${editId}`, payload);
        toast.success("Data mahasiswa berhasil diperbarui");
      } else {
        await api.post("/admin/mahasiswa", payload);
        toast.success("Mahasiswa berhasil ditambahkan");
      }
      setIsModalOpen(false);
      setEditId(null);
      fetchMahasiswas();
      setFormData({ nama_lengkap: "", nim: "", universitas: "UNIKOM", no_telepon: "", status_aktif: "Aktif" });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menyimpan data");
    }
  };

  const handleEdit = (mhs: any) => {
    setEditId(mhs.id);
    setFormData({
      nama_lengkap: mhs.name || "",
      nim: mhs.studentProfile?.nim || "",
      universitas: mhs.studentProfile?.fakultas || "UNIKOM",
      no_telepon: mhs.phone || "",
      status_aktif: mhs.status || "Aktif",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menonaktifkan akun mahasiswa ini? Mereka tidak akan bisa login lagi.")) return;
    try {
      await api.delete(`/admin/mahasiswa/${id}`);
      toast.success("Mahasiswa berhasil dinonaktifkan");
      fetchMahasiswas();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menghapus mahasiswa");
    }
  };

  if (user?.peran !== "SUPER_ADMIN") {
    return <div className="p-8 text-center text-error">Akses Ditolak. Halaman ini khusus Super Admin.</div>;
  }

  return (
    <div className="flex h-screen bg-surface-container-lowest font-sans">
      <Sidebar isOpen={true} onClose={() => {}} />
      <main className="flex-1 overflow-y-auto p-8 relative">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-[32px] font-bold text-on-surface flex items-center gap-3">
              <GraduationCap className="text-primary" size={32} />
              Manajemen Mahasiswa KKN
            </h1>
            <p className="text-on-surface-variant text-[14px] mt-1">
              Kelola data mahasiswa KKN, penempatan, dan akses sistem
            </p>
          </div>
          <button
            onClick={() => {
              setEditId(null);
              setFormData({ nama_lengkap: "", nim: "", universitas: "UNIKOM", no_telepon: "", status_aktif: "Aktif" });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold shadow-sm hover:shadow-md transition-all hover:bg-primary/90"
          >
            <Plus size={20} />
            Tambah Mahasiswa
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[18px] font-bold text-on-surface">Daftar Mahasiswa</h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
              <input
                type="text"
                placeholder="Cari nama atau NIM..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-none focus:border-primary text-[14px]"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant text-[12px] uppercase tracking-wider">
                    <th className="p-4 font-bold rounded-tl-lg">Nama & NIM</th>
                    <th className="p-4 font-bold">Universitas</th>
                    <th className="p-4 font-bold">No WhatsApp</th>
                    <th className="p-4 font-bold">Status</th>
                    <th className="p-4 font-bold text-right rounded-tr-lg">Aksi</th>
                  </tr>
                </thead>
                <tbody className="text-[14px] text-on-surface divide-y divide-outline-variant/30">
                  {mahasiswas.map((mhs) => (
                    <tr key={mhs.id} className="hover:bg-surface-container-lowest/50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold">{mhs.name}</div>
                        <div className="text-on-surface-variant text-[12px]">{mhs.studentProfile?.nim || "-"}</div>
                      </td>
                      <td className="p-4">{mhs.studentProfile?.fakultas || "-"}</td>
                      <td className="p-4">{mhs.phone}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-[12px] font-bold ${
                          mhs.status === "Aktif" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>
                          {mhs.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(mhs)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(mhs.id)}
                            className="p-1.5 text-error hover:bg-error/10 rounded transition-colors"
                            title="Hapus"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {mahasiswas.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-on-surface-variant">
                        Belum ada data mahasiswa KKN.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 bg-on-surface/30 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-lg w-[500px] max-w-[90%] flex flex-col">
              <div className="p-5 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-low/30">
                <h3 className="text-[18px] font-bold text-on-surface">{editId ? "Edit Mahasiswa" : "Tambah Mahasiswa"}</h3>
                <button
                  className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-variant transition-colors"
                  onClick={() => setIsModalOpen(false)}
                >
                  <X />
                </button>
              </div>
              <div className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[70vh]">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-on-surface-variant">Nama Lengkap <span className="text-error">*</span></label>
                  <input
                    type="text"
                    value={formData.nama_lengkap}
                    onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
                    className="px-4 py-2 border border-outline-variant rounded-lg focus:outline-none focus:border-primary w-full text-[14px]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-on-surface-variant">NIM <span className="text-error">*</span></label>
                  <input
                    type="text"
                    value={formData.nim}
                    onChange={(e) => setFormData({ ...formData, nim: e.target.value })}
                    className="px-4 py-2 border border-outline-variant rounded-lg focus:outline-none focus:border-primary w-full text-[14px]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-on-surface-variant">Universitas</label>
                  <input
                    type="text"
                    value={formData.universitas}
                    onChange={(e) => setFormData({ ...formData, universitas: e.target.value })}
                    className="px-4 py-2 border border-outline-variant rounded-lg focus:outline-none focus:border-primary w-full text-[14px]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-on-surface-variant">No WhatsApp (+62) <span className="text-error">*</span></label>
                  <input
                    type="text"
                    value={formData.no_telepon}
                    onChange={(e) => setFormData({ ...formData, no_telepon: e.target.value })}
                    className="px-4 py-2 border border-outline-variant rounded-lg focus:outline-none focus:border-primary w-full text-[14px]"
                    placeholder="Contoh: 08123456789 atau +628123456789"
                  />
                </div>
                {editId && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-bold text-on-surface-variant">Status Akun</label>
                    <select
                      value={formData.status_aktif}
                      onChange={(e) => setFormData({ ...formData, status_aktif: e.target.value })}
                      className="px-4 py-2 border border-outline-variant rounded-lg focus:outline-none focus:border-primary w-full text-[14px] bg-white"
                    >
                      <option value="Aktif">Aktif</option>
                      <option value="Nonaktif">Nonaktif</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="p-5 border-t border-outline-variant/30 bg-surface-container-lowest flex justify-end gap-3 rounded-b-xl">
                <button
                  className="px-4 py-2 text-[14px] font-bold text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors"
                  onClick={() => setIsModalOpen(false)}
                >
                  Batal
                </button>
                <button
                  className="px-4 py-2 text-[14px] font-bold bg-primary text-white hover:bg-primary/90 rounded-lg transition-colors"
                  onClick={handleSubmit}
                >
                  {editId ? "Simpan Perubahan" : "Simpan Data"}
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
