import React, { useState, useEffect } from "react";
import { Upload, Send, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../utils/api";

const InputSetoranManual: React.FC = () => {
  const [wargaList, setWargaList] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [wargaId, setWargaId] = useState("");
  const [beratKg, setBeratKg] = useState("");
  const [kategoriId, setKategoriId] = useState("");
  const [overridePoin, setOverridePoin] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      // Ambil daftar warga
      const resUsers = await api.get("/users?role=WARGA");
      if (resUsers.data?.success) {
        setWargaList(resUsers.data.data);
      }

      // Ambil kategori sampah
      const resCategories = await api.get("/categories");
      if (resCategories.data?.success) {
        setCategories(resCategories.data.data);
      }
    } catch (err) {
      console.error("Gagal memuat data awal", err);
      toast.error("Gagal memuat daftar warga atau kategori.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wargaId || !beratKg || !kategoriId || !photo) {
      toast.error("Mohon lengkapi semua field wajib dan foto bukti.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("wargaId", wargaId);
      formData.append("beratKg", beratKg);
      formData.append("kategoriId", kategoriId);
      formData.append("image", photo);
      if (overridePoin) {
        formData.append("overridePoin", overridePoin);
      }

      const res = await api.post("/transactions/manual", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success) {
        toast.success(res.data.message || "Setoran manual berhasil dicatat!");
        if (res.data.data?.discrepancyStatus === "PENDING_REVIEW") {
          toast.success("Catatan: Status masuk ke PENDING REVIEW karena diskrepansi AI.");
        }
        
        // Reset form
        setWargaId("");
        setBeratKg("");
        setKategoriId("");
        setOverridePoin("");
        setPhoto(null);
        setPhotoPreview(null);
      }
    } catch (err: any) {
      console.error("Gagal mencatat setoran manual:", err);
      toast.error(err.response?.data?.message || "Terjadi kesalahan saat mencatat setoran.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-slate-500 font-medium text-sm animate-pulse">Memuat data form...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6">
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold text-on-surface">Input Setoran Manual</h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Gunakan form ini untuk mencatat setoran warga secara manual (Khusus Petugas Residu).
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Warga Selection */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Nama Warga *</label>
            <select
              value={wargaId}
              onChange={(e) => setWargaId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
              required
            >
              <option value="">-- Pilih Warga --</option>
              {wargaList.map((warga) => (
                <option key={warga.id} value={warga.id}>
                  {warga.name} ({warga.email})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Berat Kg */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Berat (Kg) *</label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                value={beratKg}
                onChange={(e) => setBeratKg(e.target.value)}
                placeholder="Contoh: 2.5"
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                required
              />
            </div>

            {/* Kategori Sampah */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Kategori Sampah *</label>
              <select
                value={kategoriId}
                onChange={(e) => setKategoriId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                required
              >
                <option value="">-- Pilih Kategori --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.pointsPerKg} Pts/Kg)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Override Poin */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              Override Nilai Poin (Opsional)
            </label>
            <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">
              Kosongkan jika ingin menggunakan kalkulasi otomatis dari kategori (Berat × Pts/Kg). Isi jika ingin memberikan poin khusus.
            </p>
            <input
              type="number"
              min="0"
              value={overridePoin}
              onChange={(e) => setOverridePoin(e.target.value)}
              placeholder="Nilai Poin (Opsional)"
              className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
            />
          </div>

          {/* Upload Foto */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Foto Bukti (Wajib) *</label>
            <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
              Foto ini akan dicek silang oleh sistem AI. Jika klasifikasi manual Anda berbeda dengan hasil AI (&gt;90% akurasi), status akan menjadi PENDING REVIEW.
            </p>

            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:border-primary transition-colors bg-slate-50 cursor-pointer relative overflow-hidden group">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                required
              />
              <div className="space-y-2 text-center relative z-0">
                {photoPreview ? (
                  <div className="flex flex-col items-center">
                    <div className="w-32 h-32 rounded-lg overflow-hidden border-2 border-primary mb-3 shadow-sm">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-xs text-primary font-bold group-hover:underline">Ganti Foto Bukti</p>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-12 w-12 text-slate-400 group-hover:text-primary transition-colors" />
                    <div className="flex text-sm text-slate-600 justify-center">
                      <span className="relative rounded-md font-bold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary">
                        Pilih file gambar
                      </span>
                      <p className="pl-1">atau drag & drop</p>
                    </div>
                    <p className="text-xs text-slate-500">PNG, JPG, JPEG up to 5MB</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-200">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-xl shadow-sm text-sm font-extrabold text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 transition-all uppercase tracking-wider"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin w-5 h-5" />
                  Mencatat Setoran...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Kirim Setoran Manual
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InputSetoranManual;
