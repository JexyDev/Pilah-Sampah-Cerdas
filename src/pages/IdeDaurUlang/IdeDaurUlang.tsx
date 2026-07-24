import React, { useState, useEffect } from "react";
import { Upload, Send, Loader2, CheckCircle, XCircle, Search, Filter } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../utils/api";
import { useAuthStore } from "../../store/useAuthStore";

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
  const [judul, setJudul] = useState("");
  const [material, setMaterial] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search & Filter
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

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

      await api.post("/ide-daur-ulang", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Ide berhasil dikirim dan menunggu persetujuan!");
      setJudul("");
      setMaterial("");
      setFoto(null);
      fetchIdes();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal mengirim ide");
    } finally {
      setIsSubmitting(false);
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
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";
    const host = baseUrl.replace("/api/v1", "");
    return `${host}${path}`;
  };

  const isWarga = user?.peran === "WARGA";
  const isRW = user?.peran === "RW" || user?.peran === "SUPER_ADMIN";

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900">Social Feed: Ide Daur Ulang</h1>
        <p className="text-sm text-gray-500 mt-1">Bagikan ide kreatif daur ulang dan dapatkan 50 poin jika disetujui!</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Form Submit (Hanya Warga) */}
        {isWarga && (
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Bagikan Ide Anda</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Judul Ide</label>
                <input
                  type="text"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                  placeholder="Contoh: Pot Tanaman dari Botol"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Material</label>
                <textarea
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                  rows={3}
                  placeholder="Contoh: Botol plastik, cat, tali"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Foto Hasil (Opsional)</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg cursor-pointer transition text-sm">
                    <Upload size={18} />
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
                  {foto && <span className="text-sm text-gray-500 truncate max-w-[150px]">{foto.name}</span>}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-lg font-bold hover:bg-primary-dark transition disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                Kirim Ide
              </button>
            </form>
          </div>
        )}

        {/* Kolom Kanan: Feed List */}
        <div className={isWarga ? "lg:col-span-2" : "lg:col-span-3"}>
          
          {/* Search & Filter Bar */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Cari ide, material, atau nama penulis..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
              />
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto min-w-[150px]">
              <Filter size={16} className="text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full py-2.5 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-primary"
              >
                <option value="">Semua Status</option>
                <option value="APPROVED">Disetujui</option>
                <option value="PENDING">Menunggu</option>
                <option value="REJECTED">Ditolak</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Feed Publik</h2>
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin text-primary" /></div>
            ) : ides.length === 0 ? (
              <div className="text-center text-gray-400 py-12">Belum ada ide daur ulang.</div>
            ) : (
              <div className="space-y-6">
                {ides.map((ide) => (
                  <div key={ide.id} className="border border-gray-100 rounded-xl p-5 hover:bg-gray-50 transition">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{ide.judul}</h3>
                        <p className="text-xs text-gray-500">Oleh: {ide.user.name} ({ide.user.role.name}) • {new Date(ide.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        {ide.statusApproval === "APPROVED" && <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">Disetujui</span>}
                        {ide.statusApproval === "PENDING" && <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold">Pending</span>}
                        {ide.statusApproval === "REJECTED" && <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">Ditolak</span>}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-4 whitespace-pre-wrap"><span className="font-semibold text-gray-800">Material: </span>{ide.material}</p>
                    
                    {ide.foto && (
                      <div className="mb-4">
                        <img src={getImageUrl(ide.foto)} alt={ide.judul} className="rounded-lg max-h-64 object-cover" />
                      </div>
                    )}

                    {isRW && ide.statusApproval === "PENDING" && (
                      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                        <button
                          onClick={() => handleApprove(ide.id)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg text-sm font-bold transition"
                        >
                          <CheckCircle size={18} />
                          Setujui (+50 Poin)
                        </button>
                        <button
                          onClick={() => handleReject(ide.id)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-bold transition"
                        >
                          <XCircle size={18} />
                          Tolak
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdeDaurUlang;
