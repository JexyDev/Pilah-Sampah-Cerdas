import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import { X, QrCode, MapPin, Camera, Plus, Info, Check, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
}

export const WargaRegistrationWizard: React.FC<Props> = ({ onSuccess, onCancel }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [gpsError, setGpsError] = useState("");

  const [formData, setFormData] = useState({
    qrCodeOrganic: '',
    qrCodeInorganic: '',
    name: '',
    email: '',
    phone: '',
    nik: '',
    address: '',
    rtRwId: '',
    latitude: 0,
    longitude: 0,
    useCustomCapacity: false,
    maxCapacityLiter: 25,
    capacityOption: 'DEFAULT',
    manualCapacity: '',
    photoUrl: '',
  });

  // Mock API to fetch RT/RW list
  useEffect(() => {
    // In a real app, this would fetch from an API
    // but realistically it should be a dropdown.
    // Fetch GPS
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData(prev => ({
            ...prev,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          }));
          setGpsError("");
        },
        (err) => {
          setGpsError("GPS tidak aktif atau akses ditolak. Harap izinkan akses lokasi.");
        }
      );
    } else {
      setGpsError("Peramban Anda tidak mendukung GPS.");
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const nextStep = async () => {
    if (step === 1) {
      if (!formData.qrCodeOrganic || !formData.qrCodeInorganic) {
        setError("Kedua QR Code wajib diisi");
        return;
      }
      try {
        setLoading(true);
        // validate both QR codes
        await api.post("/kkn/validate-qr-master", { qrCode: formData.qrCodeOrganic });
        await api.post("/kkn/validate-qr-master", { qrCode: formData.qrCodeInorganic });
        setError("");
        setStep(s => s + 1);
      } catch (err: any) {
        setError(err.response?.data?.message || "QR Code tidak valid atau sudah digunakan.");
        toast.error("Validasi QR Master gagal");
      } finally {
        setLoading(false);
      }
    } else if (step === 3) {
      if (formData.latitude === 0 && formData.longitude === 0) {
        setError("Lokasi GPS wajib diaktifkan sebelum melanjutkan.");
        return;
      }
      if (!formData.photoUrl) {
        setError("Foto bukti fisik wajib diambil.");
        return;
      }
      setError("");
      setStep(s => s + 1);
    } else {
      setError("");
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
            <X className="w-6 h-6" />
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
                  <QrCode className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-slate-800 mb-2">Scan QR Code Tong Sampah</h3>
                <p className="text-sm text-slate-500 mb-4">Pastikan Anda telah mengklaim stiker QR Code ini sebelumnya.</p>
                
                <div className="max-w-xs mx-auto space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 text-left">QR Code Organik</label>
                    <input 
                      type="text" 
                      name="qrCodeOrganic" 
                      required 
                      value={formData.qrCodeOrganic} 
                      onChange={handleChange} 
                      placeholder="Contoh: ORG00012026"
                      className="w-full text-center text-lg font-mono uppercase rounded-lg border-slate-300 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 text-left">QR Code Anorganik</label>
                    <input 
                      type="text" 
                      name="qrCodeInorganic" 
                      required 
                      value={formData.qrCodeInorganic} 
                      onChange={handleChange} 
                      placeholder="Contoh: ANO00012026"
                      className="w-full text-center text-lg font-mono uppercase rounded-lg border-slate-300 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>
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
                    <MapPin className="w-5 h-5" />
                    Koordinat GPS Tersimpan
                  </div>
                  {gpsError ? (
                    <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-200 mb-3">
                      {gpsError}
                      <button type="button" onClick={() => {
                        if (navigator.geolocation) {
                          setGpsError("Sedang mencari lokasi...");
                          navigator.geolocation.getCurrentPosition(
                            (pos) => {
                              setFormData(prev => ({
                                ...prev,
                                latitude: pos.coords.latitude,
                                longitude: pos.coords.longitude
                              }));
                              setGpsError("");
                            },
                            (err) => setGpsError("Akses ditolak atau gagal mendapatkan lokasi.")
                          );
                        }
                      }} className="block mt-2 font-bold underline">Coba Lagi</button>
                    </div>
                  ) : null}
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
                    <Camera className="w-5 h-5" />
                    Foto Tong Sampah
                  </div>
                  <div className="flex-1 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center relative overflow-hidden bg-white">
                    {formData.photoUrl ? (
                      <img src={formData.photoUrl} alt="Tong" className="w-full h-full object-cover" />
                    ) : (
                      <button type="button" onClick={handleTakePhoto} className="text-slate-500 hover:text-emerald-600 flex flex-col items-center transition-colors">
                        <Plus className="w-10 h-10 mb-2 opacity-50" />
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
              <h3 className="font-semibold text-slate-800 border-b pb-2">Kapasitas Tong</h3>

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
                <Info className="w-5 h-5 shrink-0" />
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
                <><Check className="w-4 h-4" /> Submit Pendaftaran</>
              ) : (
                <>Lanjut <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
