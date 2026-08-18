import React, { useState } from "react";
import toast from "react-hot-toast";
import { UserPlus, Loader2, Key, MapPin } from "lucide-react";
import api from "../../services/api";

interface BantuPetugasFormProps {
  onSuccess: () => void;
}

export const BantuPetugasForm: React.FC<BantuPetugasFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    assignedZone: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password || !formData.assignedZone) {
      toast.error("Semua field wajib diisi!");
      return;
    }

    try {
      setIsLoading(true);
      await api.post("/auth/register/petugas-residu", formData);
      toast.success("Berhasil mendaftar! Menunggu verifikasi RW.");
      setFormData({ name: "", email: "", password: "", phone: "", assignedZone: "" });
      setIsOpen(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal mendaftarkan Petugas");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"
      >
        <UserPlus className="w-5 h-5" />
        Daftarkan Petugas Pemilah
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Registrasi Petugas Pemilah
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 flex justify-center items-center text-slate-500 dark:text-slate-400 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  className="w-full mt-1 px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-slate-100"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">Email Login</label>
                <input
                  type="email"
                  required
                  className="w-full mt-1 px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-slate-100"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase flex gap-1 items-center">
                  <Key className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /> Kata Sandi
                </label>
                <input
                  type="password"
                  required
                  className="w-full mt-1 px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-slate-100"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">Nomor HP</label>
                <input
                  type="text"
                  className="w-full mt-1 px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-slate-100"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase flex gap-1 items-center">
                  <MapPin className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /> Zona Tugas (RT/RW)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: RT01/RW02"
                  className="w-full mt-1 px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-slate-100"
                  value={formData.assignedZone}
                  onChange={(e) => setFormData({ ...formData, assignedZone: e.target.value })}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors disabled:opacity-70 cursor-pointer"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
