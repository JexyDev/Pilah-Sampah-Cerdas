import React, { useState, useEffect } from "react";
import { Upload, Send, Loader2, Search } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../utils/api";

const InputSetoranManual: React.FC = () => {
  const [wargaList, setWargaList] = useState<any[]>([]);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [wargaId, setWargaId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showWargaSuggestions, setShowWargaSuggestions] = useState(false);
  const [kategoriId, setKategoriId] = useState("");
  const [beratKg, setBeratKg] = useState("");
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
      const resWarga = await api.get("/users", { params: { roleName: "WARGA" } });
      if (resWarga.data?.success) {
        setWargaList(resWarga.data.data);
      } else if (Array.isArray(resWarga.data)) {
        setWargaList(resWarga.data);
      }

      // Ambil daftar kategori & set default ke Residu
      const resCats = await api.get("/categories");
      let cats: any[] = [];
      if (resCats.data?.success) {
        cats = resCats.data.data;
      } else if (Array.isArray(resCats.data)) {
        cats = resCats.data;
      }
      setCategoriesList(cats);

      // Auto-select Residu category for Petugas Residu
      const residuCat = cats.find(
        (c: any) => c.name?.toLowerCase().includes("residu")
      );
      if (residuCat) {
        setKategoriId(residuCat.id);
      }
    } catch (err) {
      console.error("Gagal memuat data awal", err);
      toast.error("Gagal memuat data formulir.");
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

      const res = await api.post("/transactions/manual", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success) {
        toast.success(res.data.message || "Setoran sampah residu berhasil dicatat!");
        
        // Reset form (keep Residu category selected)
        setWargaId("");
        setSearchQuery("");
        setBeratKg("");
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

  // Autocomplete filtering
  const filteredWarga = searchQuery
    ? wargaList.filter(
        (w) =>
          w.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (w.phone && w.phone.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : wargaList;

  // Real-time calculation of estimated points
  const selectedCat = categoriesList.find((c) => c.id === kategoriId);
  const selectedCatName = selectedCat?.name?.toLowerCase() || "";
  let multiplier = 0.0;
  if (selectedCatName === "organik") {
    multiplier = 0.4;
  } else if (selectedCatName === "anorganik" || selectedCatName === "non-organik" || selectedCatName.includes("anorganik")) {
    multiplier = 0.2;
  }
  const estimatedPoints = Number(beratKg) > 0 ? Number(beratKg) * multiplier : 0;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-slate-500 font-medium text-sm animate-pulse">Memuat data form...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6 text-slate-800 dark:text-slate-100">
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Input Setoran Residu Hilir</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Gunakan form ini khusus Petugas Residu untuk mencatat penimbangan & setoran sampah residu hasil pemilahan hilir (Residu tanpa QR Code).
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Warga Selection Searchable Autocomplete */}
          <div className="relative">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Nama Warga / Nomor HP *</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setShowWargaSuggestions(true)}
                onBlur={() => {
                  setTimeout(() => setShowWargaSuggestions(false), 200);
                }}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setWargaId("");
                  setShowWargaSuggestions(true);
                }}
                placeholder="Cari Nama Warga atau Nomor HP..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 pl-11 pr-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-[#009966]/20 focus:border-[#009966] transition-all text-sm font-bold"
                required
              />
            </div>
            
            {showWargaSuggestions && filteredWarga.length > 0 && (
              <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 p-2 flex flex-col gap-1">
                {filteredWarga.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => {
                      setWargaId(w.id);
                      setSearchQuery(`${w.name} (${w.phone || 'Warga'})`);
                      setShowWargaSuggestions(false);
                    }}
                    className="text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex justify-between items-center cursor-pointer"
                  >
                    <div>
                      <p className="font-bold">{w.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{w.phone || "-"}</p>
                    </div>
                    {wargaId === w.id && (
                      <span className="text-[#009966] dark:text-emerald-400 font-bold">Terpilih</span>
                    )}
                  </button>
                ))}
              </div>
            )}
            {showWargaSuggestions && filteredWarga.length === 0 && (
              <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 p-4 text-center text-xs text-slate-500 dark:text-slate-400">
                Tidak ada warga ditemukan
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Kategori Sampah */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Kategori Sampah *</label>
              <select
                value={kategoriId}
                onChange={(e) => setKategoriId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-[#009966]/20 focus:border-[#009966] transition-all text-sm font-bold cursor-pointer"
                required
              >
                <option value="">-- Pilih Kategori --</option>
                {categoriesList.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} (Poin Dasar: {cat.pointsPerKg}/Kg)
                  </option>
                ))}
              </select>
            </div>

            {/* Berat Kg */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Berat Setoran (Kg) *</label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                value={beratKg}
                onChange={(e) => setBeratKg(e.target.value)}
                placeholder="Contoh: 15.5"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-[#009966]/20 focus:border-[#009966] transition-all text-sm font-bold"
                required
              />
              
              {/* Real-time points estimation */}
              {kategoriId && Number(beratKg) > 0 && (
                <div className="mt-2 p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl border border-emerald-100 dark:border-emerald-700/50 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Estimasi Poin:</span>
                  <span className="text-sm font-black text-[#009966] dark:text-emerald-400">
                    +{estimatedPoints.toFixed(2)} Poin
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Upload Foto */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Foto Bukti (Wajib) *</label>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
              Silakan unggah foto bukti setoran sampah untuk disimpan di dalam log audit.
            </p>

            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-xl hover:border-[#009966] dark:hover:border-emerald-500 transition-colors bg-slate-50 dark:bg-slate-800/60 cursor-pointer relative overflow-hidden group">
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
                    <div className="w-32 h-32 rounded-lg overflow-hidden border-2 border-[#009966] dark:border-emerald-500 mb-3 shadow-sm">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-xs text-[#009966] dark:text-emerald-400 font-bold group-hover:underline">Ganti Foto Bukti</p>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500 group-hover:text-[#009966] dark:group-hover:text-emerald-400 transition-colors" />
                    <div className="flex text-sm text-slate-600 dark:text-slate-300 justify-center">
                      <span className="relative rounded-md font-bold text-[#009966] dark:text-emerald-400 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[#009966]">
                        Pilih file gambar
                      </span>
                      <p className="pl-1">atau drag & drop</p>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">PNG, JPG, JPEG up to 5MB</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-xl shadow-sm text-sm font-extrabold text-white bg-[#009966] hover:bg-[#008055] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#009966] disabled:opacity-70 transition-all uppercase tracking-wider cursor-pointer"
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
