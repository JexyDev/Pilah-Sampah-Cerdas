import React, { useState } from "react";
import api from "../../utils/api";
import toast from "react-hot-toast";

export const BantuFasilitasForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [formData, setFormData] = useState({
    userId: "",
    rtRwId: "",
    nama: "",
    jenis: "BATA_TERAWANG",
    photoUrl: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTakePhoto = () => {
    toast("Membuka Kamera...", { icon: "📸" });
    setTimeout(() => {
      setFormData(prev => ({ ...prev, photoUrl: "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=400&h=300&fit=crop" }));
      toast.success("Foto berhasil diambil");
    }, 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Simulate GPS
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          await api.post("/kkn/fasilitas/bantu-input", {
            ...formData,
            rtRwId: Number(formData.rtRwId),
            latitude,
            longitude
          });
          toast.success("Fasilitas berhasil didaftarkan (Menunggu Approval RW). Kamu mendapat +5 Poin!");
          onSuccess();
        } catch (err: any) {
          setError(err.response?.data?.message || "Gagal input fasilitas.");
        }
        setLoading(false);
      },
      () => {
        setError("Gagal mendapatkan lokasi GPS. Pastikan GPS aktif.");
        setLoading(false);
      }
    );
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mt-6">
      <h3 className="font-bold text-lg mb-4 text-green-700">Bantu Input Fasilitas GIS Warga</h3>
      <p className="text-sm text-gray-500 mb-4">Input fasilitas seperti Bata Terawang atau Loseda ke dalam peta (GPS otomatis direkam).</p>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">ID Warga / Nama Pemilik</label>
          <input type="text" name="userId" required value={formData.userId} onChange={handleChange} className="mt-1 block w-full rounded-md border p-2" placeholder="Nama Warga" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">ID Wilayah RT/RW</label>
          <input type="number" name="rtRwId" required value={formData.rtRwId} onChange={handleChange} className="mt-1 block w-full rounded-md border p-2" placeholder="Cth: 1" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Nama Fasilitas</label>
          <input type="text" name="nama" required value={formData.nama} onChange={handleChange} className="mt-1 block w-full rounded-md border p-2" placeholder="Loseda Pak Budi" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Jenis Fasilitas</label>
          <select name="jenis" value={formData.jenis} onChange={handleChange} className="mt-1 block w-full rounded-md border p-2 bg-white">
            <option value="BATA_TERAWANG">Bata Terawang</option>
            <option value="LOSEDA">Loseda (Kompos Pipa)</option>
            <option value="RUMAH_MAGGOT">Rumah Maggot</option>
            <option value="BANK_SAMPAH">Bank Sampah</option>
            <option value="BUDIDAYA_TERNAK">Budidaya Ternak</option>
          </select>
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Foto Fasilitas (Wajib)</label>
          {formData.photoUrl ? (
            <div className="mt-2 relative inline-block">
              <img src={formData.photoUrl} alt="Preview" className="h-32 rounded-lg object-cover border" />
              <button 
                type="button" 
                onClick={() => setFormData({ ...formData, photoUrl: "" })}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
              >✕</button>
            </div>
          ) : (
            <button 
              type="button" 
              onClick={handleTakePhoto}
              className="mt-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center gap-2"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Ambil/Unggah Foto
            </button>
          )}
        </div>
        
        <div className="md:col-span-2 mt-4">
          {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-green-700 text-white py-3 rounded-lg hover:bg-green-800 disabled:opacity-50">
            {loading ? "Menyimpan & Merekam GPS..." : "Simpan Fasilitas & Rekam Lokasi"}
          </button>
        </div>
      </form>
    </div>
  );
};
