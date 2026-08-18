import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../utils/api";

const MahasiswaRegistration: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    rtRwId: 1, // Optional, since KKN represents polygon. Defaulting to 1 for demo.
    nim: "",
    jurusan: "",
    fakultas: "",
    noWa: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // +30 days
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/register/mahasiswa-kkn", formData);
      toast.success("Registrasi berhasil! Akun Anda berstatus PENDING hingga disetujui Admin DLH.");
      navigate("/login");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal melakukan registrasi.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 dark:bg-slate-800/60 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-emerald-100 rounded-full blur-3xl opacity-50 z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-50 z-0"></div>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 max-w-xl w-full relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Registrasi Mahasiswa KKN</h2>
          <p className="text-slate-500 mt-2">Daftarkan diri Anda untuk menjadi fasilitator TrashCare</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap</label>
              <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full rounded-lg border-slate-300 dark:border-slate-700 focus:border-emerald-500 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
              <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full rounded-lg border-slate-300 dark:border-slate-700 focus:border-emerald-500 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
              <input type="password" name="password" required value={formData.password} onChange={handleChange} className="w-full rounded-lg border-slate-300 dark:border-slate-700 focus:border-emerald-500 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">No. WhatsApp (Format 08)</label>
              <input type="text" name="noWa" required value={formData.noWa} onChange={handleChange} className="w-full rounded-lg border-slate-300 dark:border-slate-700 focus:border-emerald-500 focus:ring-emerald-500" placeholder="0812xxxxxxxx" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">NIM</label>
              <input type="text" name="nim" required value={formData.nim} onChange={handleChange} className="w-full rounded-lg border-slate-300 dark:border-slate-700 focus:border-emerald-500 focus:ring-emerald-500" placeholder="10121001" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">No. HP / Telepon (Format 08)</label>
              <input type="text" name="phone" required value={formData.phone} onChange={handleChange} className="w-full rounded-lg border-slate-300 dark:border-slate-700 focus:border-emerald-500 focus:ring-emerald-500" placeholder="0812xxxxxxxx" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Jurusan</label>
              <input type="text" name="jurusan" required value={formData.jurusan} onChange={handleChange} className="w-full rounded-lg border-slate-300 dark:border-slate-700 focus:border-emerald-500 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fakultas</label>
              <input type="text" name="fakultas" required value={formData.fakultas} onChange={handleChange} className="w-full rounded-lg border-slate-300 dark:border-slate-700 focus:border-emerald-500 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tgl Mulai KKN</label>
              <input type="date" name="startDate" required value={formData.startDate} onChange={handleChange} className="w-full rounded-lg border-slate-300 dark:border-slate-700 focus:border-emerald-500 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tgl Selesai KKN</label>
              <input type="date" name="endDate" required value={formData.endDate} onChange={handleChange} className="w-full rounded-lg border-slate-300 dark:border-slate-700 focus:border-emerald-500 focus:ring-emerald-500" />
            </div>
          </div>

          <div className="mt-8 pt-4">
            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-3 rounded-xl font-bold shadow-sm transition-all flex items-center justify-center gap-2 ${loading ? 'bg-emerald-400 text-white cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-md'}`}
            >
              {loading ? (
                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Memproses...</>
              ) : (
                "Daftar Sekarang"
              )}
            </button>
          </div>
          
          <p className="text-center text-sm text-slate-500 mt-4">
            Sudah punya akun? <Link to="/login" className="text-emerald-600 font-semibold hover:underline">Masuk di sini</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default MahasiswaRegistration;
