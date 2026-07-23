import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import toast from "react-hot-toast";

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
}

export const WargaRegistrationWizard: React.FC<Props> = ({ onSuccess, onCancel }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    binQrCode: "",
    name: "",
    email: "",
    phone: "",
    address: "",
    rtRwId: "",
    binCategoryId: "1", // Default to Organik
    latitude: -6.88923,
    longitude: 107.6105,
    capacityOption: "DEFAULT",
    manualCapacity: "",
    photoUrl: ""
  });

  // Mock API to fetch RT/RW list
  useEffect(() => {
    // In a real app, this would fetch from an API
    // but realistically it should be a dropdown.
    
    // Simulate fetching GPS
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setFormData(prev => ({
          ...prev,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        }));
      });
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const nextStep = async () => {
    if (step === 1) {
      if (!formData.binQrCode) {
        setError("QR Code wajib diisi");
        return;
      }
      try {
        setLoading(true);
        await api.post("/kkn/validate-qr-master", { qrCode: formData.binQrCode });
        setError("");
        setStep(s => s + 1);
      } catch (err: any) {
        setError(err.response?.data?.message || "QR Code tidak valid atau sudah digunakan.");
        toast.error("Validasi QR Master gagal");
      } finally {
        setLoading(false);
      }
    } else {
      setStep(s => s + 1);
    }
  };
  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    let maxCapacityLiter: number | undefined = undefined;
    if (formData.capacityOption === "MANUAL") {
      maxCapacityLiter = Number(formData.manualCapacity);
    } else if (formData.capacityOption === "AI") {
       maxCapacityLiter = 50; 
    }

    try {
      await api.post("/kkn/register-warga", {
        ...formData,
        rtRwId: Number(formData.rtRwId),
        maxCapacityLiter
      });
      toast.success("Registrasi Warga Berhasil! Menunggu Approval RW.", { duration: 5000 });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal mendaftarkan warga.");
    }
    setLoading(false);
  };

  // Mock taking a photo
  const handleTakePhoto = () => {
    toast("Membuka Kamera...", { icon: "📸" });
    setTimeout(() => {
      setFormData(prev => ({ ...prev, photoUrl: "https://images.unsplash.com/photo-1605600659873-d808a1d85715?w=200&h=200&fit=crop" }));
      toast.success("Foto berhasil diambil");
    }, 1000);
  };

  // Progress bar calculation
  const totalSteps = 4;
  const progressPct = ((step - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl border border-emerald-100 max-w-2xl mx-auto relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50 z-0"></div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Registrasi Warga Baru</h2>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Progress Tracker */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {['QR Code', 'Biodata', 'Lokasi & Foto', 'Kapasitas'].map((label, idx) => (
              <span key={idx} className={`text-xs font-medium ${step > idx ? 'text-emerald-600' : 'text-slate-400'}`}>
                {label}
              </span>
            ))}
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progressPct}%` }}
            ></div>
          </div>
        </div>

        <form onSubmit={step === totalSteps ? handleSubmit : (e) => { e.preventDefault(); nextStep(); }}>
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-md">
              <p className="font-medium text-sm">{error}</p>
            </div>
          )}

          {/* STEP 1: QR CODE */}
          {step === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center p-6 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm mb-4">
                  <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                </div>
                <h3 className="font-semibold text-slate-800 mb-2">Scan QR Code Tong Sampah</h3>
                <p className="text-sm text-slate-500 mb-4">Pastikan Anda telah mengklaim stiker QR Code ini sebelumnya.</p>
                
                <div className="max-w-xs mx-auto">
                  <input 
                    type="text" 
                    name="binQrCode" 
                    required 
                    value={formData.binQrCode} 
                    onChange={handleChange} 
                    placeholder="Contoh: TS-0001"
                    className="w-full text-center text-lg font-mono uppercase rounded-lg border-slate-300 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: BIODATA */}
          {step === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <h3 className="font-semibold text-slate-800 border-b pb-2">Informasi Kepemilikan Warga</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
                  <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full rounded-lg border-slate-300 focus:border-emerald-500 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full rounded-lg border-slate-300 focus:border-emerald-500 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">No. WhatsApp</label>
                  <input type="text" name="phone" required value={formData.phone} onChange={handleChange} className="w-full rounded-lg border-slate-300 focus:border-emerald-500 focus:ring-emerald-500" placeholder="+628..." />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Alamat Lengkap</label>
                  <input type="text" name="address" required value={formData.address} onChange={handleChange} className="w-full rounded-lg border-slate-300 focus:border-emerald-500 focus:ring-emerald-500" placeholder="Jl. Contoh No. 123" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">ID Wilayah RT/RW</label>
                  <input type="number" name="rtRwId" required value={formData.rtRwId} onChange={handleChange} className="w-full rounded-lg border-slate-300 focus:border-emerald-500 focus:ring-emerald-500" placeholder="Contoh: 6 (Lihat Master Data)" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: LOKASI & FOTO */}
          {step === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <h3 className="font-semibold text-slate-800 border-b pb-2">Geotagging & Foto Fisik</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* GPS Mapping */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2 mb-3 text-emerald-700 font-medium text-sm">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    Koordinat GPS Tersimpan
                  </div>
                  <div className="aspect-video bg-slate-200 rounded-lg overflow-hidden relative group">
                    {/* Fake Minimap */}
                    <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&h=400&fit=crop" alt="Map" className="w-full h-full object-cover opacity-60" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative">
                        <div className="w-4 h-4 bg-red-500 rounded-full animate-ping absolute"></div>
                        <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white relative shadow-md"></div>
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur text-xs p-2 rounded shadow-sm">
                      Lat: {formData.latitude.toFixed(5)}, Lng: {formData.longitude.toFixed(5)}
                    </div>
                  </div>
                </div>

                {/* Photo Upload */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col">
                  <div className="flex items-center gap-2 mb-3 text-emerald-700 font-medium text-sm">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    Foto Tong Sampah
                  </div>
                  <div className="flex-1 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center relative overflow-hidden bg-white">
                    {formData.photoUrl ? (
                      <img src={formData.photoUrl} alt="Tong" className="w-full h-full object-cover" />
                    ) : (
                      <button type="button" onClick={handleTakePhoto} className="text-slate-500 hover:text-emerald-600 flex flex-col items-center transition-colors">
                        <svg className="w-10 h-10 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                        <span className="text-sm font-medium">Buka Kamera</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: KAPASITAS */}
          {step === 4 && (
            <div className="space-y-6 animate-fadeIn">
              <h3 className="font-semibold text-slate-800 border-b pb-2">Kategori & Kapasitas Tong</h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Kategori Tong Sampah</label>
                <div className="grid grid-cols-2 gap-4">
                  <label className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${formData.binCategoryId === '1' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-emerald-200'}`}>
                    <div className="flex items-center gap-3">
                      <input type="radio" name="binCategoryId" value="1" checked={formData.binCategoryId === '1'} onChange={handleChange} className="text-emerald-600 focus:ring-emerald-500 w-5 h-5" />
                      <div>
                        <div className="font-semibold text-emerald-800">Organik</div>
                        <div className="text-xs text-emerald-600/80">Sisa makanan, daun</div>
                      </div>
                    </div>
                  </label>
                  <label className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${formData.binCategoryId === '2' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-200'}`}>
                    <div className="flex items-center gap-3">
                      <input type="radio" name="binCategoryId" value="2" checked={formData.binCategoryId === '2'} onChange={handleChange} className="text-blue-600 focus:ring-blue-500 w-5 h-5" />
                      <div>
                        <div className="font-semibold text-blue-800">Anorganik</div>
                        <div className="text-xs text-blue-600/80">Plastik, kertas, kaca</div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Penentuan Kapasitas Liter</label>
                <div className="space-y-3">
                  <label className={`flex items-center p-3 rounded-lg border transition-colors ${formData.capacityOption === 'DEFAULT' ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200'}`}>
                    <input type="radio" name="capacityOption" value="DEFAULT" checked={formData.capacityOption === 'DEFAULT'} onChange={handleChange} className="text-emerald-600 focus:ring-emerald-500 mr-3" />
                    <div>
                      <span className="block font-medium text-slate-800 text-sm">Standar (100L)</span>
                      <span className="text-xs text-slate-500">Gunakan kapasitas default pemerintah</span>
                    </div>
                  </label>
                  <label className={`flex items-center p-3 rounded-lg border transition-colors ${formData.capacityOption === 'AI' ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200'}`}>
                    <input type="radio" name="capacityOption" value="AI" checked={formData.capacityOption === 'AI'} onChange={handleChange} className="text-emerald-600 focus:ring-emerald-500 mr-3" />
                    <div className="flex-1 flex justify-between items-center">
                      <div>
                        <span className="block font-medium text-slate-800 text-sm flex items-center gap-1">
                          Estimasi AI <span className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0.5 rounded font-bold">SMART</span>
                        </span>
                        <span className="text-xs text-slate-500">Hitung otomatis dari foto fisik</span>
                      </div>
                      {formData.capacityOption === 'AI' && formData.photoUrl && (
                        <div className="text-sm font-bold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">
                          ~50 Liter
                        </div>
                      )}
                    </div>
                  </label>
                  <label className={`flex items-center p-3 rounded-lg border transition-colors ${formData.capacityOption === 'MANUAL' ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200'}`}>
                    <input type="radio" name="capacityOption" value="MANUAL" checked={formData.capacityOption === 'MANUAL'} onChange={handleChange} className="text-emerald-600 focus:ring-emerald-500 mr-3" />
                    <div>
                      <span className="block font-medium text-slate-800 text-sm">Input Manual</span>
                      <span className="text-xs text-slate-500">Ukur sendiri dimensi tong</span>
                    </div>
                  </label>
                </div>

                {formData.capacityOption === "MANUAL" && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Volume Kapasitas (Liter)</label>
                    <input type="number" name="manualCapacity" required value={formData.manualCapacity} onChange={handleChange} className="w-full md:w-1/2 rounded-lg border-slate-300 focus:border-emerald-500 focus:ring-emerald-500" placeholder="Contoh: 60" />
                  </div>
                )}
              </div>
              
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex gap-3 text-amber-800 text-sm">
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p>Setelah disubmit, kepemilikan tong sampah ini akan berstatus <strong>PENDING_APPROVAL</strong>. RW setempat harus memberikan persetujuan sebelum tong aktif.</p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex justify-between items-center pt-4 border-t border-slate-100">
            <button 
              type="button" 
              onClick={prevStep} 
              disabled={step === 1 || loading}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${step === 1 ? 'opacity-0 pointer-events-none' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Kembali
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-all flex items-center gap-2 ${loading ? 'bg-emerald-400 text-white cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-md'}`}
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Memproses...</>
              ) : step === totalSteps ? (
                <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Submit Pendaftaran</>
              ) : (
                <>Lanjut <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
