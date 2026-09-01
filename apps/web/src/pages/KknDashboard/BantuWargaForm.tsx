import React, { useState } from "react";
import api from "../../utils/api";
import toast from "react-hot-toast";

export const BantuWargaForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    rtRwId: "",
    binQrCode: "",
    binCategoryId: "",
    capacityOption: "DEFAULT", // DEFAULT, AI, MANUAL
    manualCapacity: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Calculate max capacity liter based on option
    let maxCapacityLiter: number | undefined = undefined;
    if (formData.capacityOption === "MANUAL") {
      maxCapacityLiter = Number(formData.manualCapacity);
    } else if (formData.capacityOption === "AI") {
      try {
        const aiRes = await api.post("/ai/classify", {});
        maxCapacityLiter = aiRes.data?.data?.estimatedVolumeLiter || 50;
      } catch (_e) {
        maxCapacityLiter = 50;
      }
    }

    try {
      await api.post("/kkn/register-warga", {
        ...formData,
        rtRwId: Number(formData.rtRwId),
        maxCapacityLiter
      });
      toast.success("Pendaftaran warga berhasil! Menunggu Approval RW.");
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal mendaftarkan warga.");
    }
    setLoading(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 text-slate-800 dark:text-slate-100">
      <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-slate-100">Langkah 2: Registrasi Warga (Gunakan QR yang telah diklaim)</h3>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">QR Code (Telah Diklaim)</label>
          <input type="text" name="binQrCode" required value={formData.binQrCode} onChange={handleChange} className="mt-1 block w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 uppercase text-slate-900 dark:text-slate-100" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Nama Lengkap Warga</label>
          <input type="text" name="name" required value={formData.name} onChange={handleChange} className="mt-1 block w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-900 dark:text-slate-100" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Email Warga</label>
          <input type="email" name="email" required value={formData.email} onChange={handleChange} className="mt-1 block w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-900 dark:text-slate-100" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">No. Telepon / WhatsApp</label>
          <input type="text" name="phone" required value={formData.phone} onChange={handleChange} className="mt-1 block w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-900 dark:text-slate-100" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Alamat Rumah</label>
          <input type="text" name="address" required value={formData.address} onChange={handleChange} className="mt-1 block w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-900 dark:text-slate-100" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">ID Wilayah RT/RW (Cth: 1)</label>
          <input type="number" name="rtRwId" required value={formData.rtRwId} onChange={handleChange} className="mt-1 block w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-900 dark:text-slate-100" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">ID Kategori Tempat Sampah (Cth: 1 = Organik)</label>
          <input type="text" name="binCategoryId" required value={formData.binCategoryId} onChange={handleChange} className="mt-1 block w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-900 dark:text-slate-100" />
        </div>
        
        {/* Pilihan Kapasitas */}
        <div className="md:col-span-2 bg-gray-50 dark:bg-slate-800 p-4 rounded-lg mt-2 border border-slate-200 dark:border-slate-700">
          <label className="block text-sm font-bold text-gray-800 dark:text-slate-200 mb-2">Penentuan Kapasitas Tempat Sampah</label>
          <div className="flex gap-4 text-slate-800 dark:text-slate-200">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="capacityOption" value="DEFAULT" checked={formData.capacityOption === "DEFAULT"} onChange={handleChange} /> Standar (100L)
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="capacityOption" value="AI" checked={formData.capacityOption === "AI"} onChange={handleChange} /> AI Camera
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="capacityOption" value="MANUAL" checked={formData.capacityOption === "MANUAL"} onChange={handleChange} /> Manual Input
            </label>
          </div>
          {formData.capacityOption === "MANUAL" && (
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Estimasi Kapasitas (Liter)</label>
              <input type="number" name="manualCapacity" required value={formData.manualCapacity} onChange={handleChange} className="mt-1 block w-1/2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-900 dark:text-slate-100" placeholder="Cth: 60" />
            </div>
          )}
          {formData.capacityOption === "AI" && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-700/40 text-blue-700 dark:text-blue-300 rounded-md flex items-center gap-2 text-sm">
              <span className="material-icons-outlined">camera_alt</span> Simulasi: Menggunakan AI Foto, estimasi terbaca 50L.
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          {error && <p className="text-red-500 dark:text-red-400 text-sm mb-2">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg disabled:opacity-50 font-bold transition-all cursor-pointer">
            {loading ? "Menyimpan..." : "Daftarkan Warga & Kirim ke RW"}
          </button>
        </div>
      </form>
    </div>
  );
};
