import React, { useState } from "react";
import { 
  Building2, 
  Sprout, 
  Recycle, 
  TrendingUp,
  Lightbulb,
  Factory,
  Database,
  ArrowRight
} from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import toast from "react-hot-toast";

export const RwDashboard: React.FC = () => {
  const { user } = useAuthStore();
  
  const [maggotHarvest, setMaggotHarvest] = useState({
    weight: "",
    durationDays: "7"
  });

  const handleMaggotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!maggotHarvest.weight) return;
    toast.success(`Berhasil mencatat panen maggot sebesar  kg!`);
    setMaggotHarvest({ weight: "", durationDays: "7" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-outline-variant shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Building2 className="text-emerald-600 w-7 h-7" />
            Dashboard RW (Fasilitas & GIS)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Wilayah: {user?.address || "RW 00"} • Kelurahan Dago
          </p>
        </div>
      </div>

      {/* Insight & Rekomendasi (Khusus RW) */}
      <div className="bg-indigo-50/80 backdrop-blur-sm shadow-sm rounded-2xl p-6 border border-indigo-100 card-polish">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-bold text-[18px] text-indigo-900 flex items-center gap-2">
            <Lightbulb className="text-indigo-600 w-5 h-5" />
            Insight & Rekomendasi AI
          </h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-white p-4 rounded-xl border border-indigo-50 text-xs shadow-sm">
            <span className="font-bold text-indigo-800 block mb-1">Peningkatan Setoran Anorganik</span>
            <p className="text-slate-600">Minggu ini terdapat kenaikan sampah anorganik 15% di RT 02. Disarankan melakukan sosialisasi pemilahan plastik ulang.</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-indigo-50 text-xs shadow-sm">
            <span className="font-bold text-amber-600 block mb-1">tempat sampah Hampir Penuh</span>
            <p className="text-slate-600">Ada 3 tempat sampah di area Anda yang mendekati kapasitas maksimal (80%). Petugas diinfokan untuk menjemput sore ini.</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-indigo-50 text-xs shadow-sm">
            <span className="font-bold text-emerald-600 block mb-1">Gamifikasi Partisipasi</span>
            <p className="text-slate-600">Warga atas nama Budi Setiawan sedang aktif. Pertimbangkan approval ide daur ulangnya untuk memotivasi warga lain.</p>
          </div>
        </div>
      </div>

      {/* Statistik Fasilitas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { title: "Bata Terawang", count: 24, trend: "+3 minggu ini", icon: Database, color: "text-amber-600", bg: "bg-amber-100" },
          { title: "Loseda", count: 56, trend: "+12 minggu ini", icon: Sprout, color: "text-emerald-600", bg: "bg-emerald-100" },
          { title: "Rumah Maggot", count: 4, trend: "Stabil", icon: Recycle, color: "text-blue-600", bg: "bg-blue-100" },
          { title: "Bank Sampah", count: 2, trend: "Aktif", icon: Factory, color: "text-indigo-600", bg: "bg-indigo-100" },
        ].map((item, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 ${item.bg} rounded-xl flex items-center justify-center shrink-0`}>
              <item.icon className={`w-6 h-6 ${item.color}`} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold">{item.title}</p>
              <h3 className="text-2xl font-black text-gray-800">{item.count}</h3>
              <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                <TrendingUp className="w-3 h-3" /> {item.trend}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Aktivitas Panen Maggot */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
            <Sprout className="w-5 h-5 text-emerald-600" />
            Input Panen Rumah Maggot
          </h3>
          <form onSubmit={handleMaggotSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Berat Panen (Kg)</label>
                <input 
                  type="number" 
                  required 
                  value={maggotHarvest.weight}
                  onChange={(e) => setMaggotHarvest({...maggotHarvest, weight: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" 
                  placeholder="Cth: 15"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Periode (Hari)</label>
                <select 
                  value={maggotHarvest.durationDays}
                  onChange={(e) => setMaggotHarvest({...maggotHarvest, durationDays: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="7">Mingguan (7 Hari)</option>
                  <option value="14">Bi-Weekly (14 Hari)</option>
                </select>
              </div>
            </div>
            <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all">
              Catat Panen Maggot
            </button>
          </form>
          
          <div className="mt-6">
            <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Histori Panen Terakhir</h4>
            <div className="space-y-2">
              {[
                { date: "15 Jul 2026", weight: "14.5 Kg" },
                { date: "08 Jul 2026", weight: "12.0 Kg" },
                { date: "01 Jul 2026", weight: "13.2 Kg" },
              ].map((h, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg text-sm border border-gray-100">
                  <span className="font-medium text-gray-700">{h.date}</span>
                  <span className="font-bold text-emerald-600">{h.weight}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Visualisasi Rantai Distribusi & Log Sistem */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Rantai Distribusi Maggot
            </h3>
            <div className="flex items-center justify-between p-4 bg-blue-50/50 rounded-xl border border-blue-100">
              <div className="text-center">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mx-auto mb-2 border border-gray-100">
                  <span className="text-xl">🗑️</span>
                </div>
                <p className="text-[10px] font-bold text-gray-600">Sampah Organik</p>
                <p className="text-xs font-black text-blue-700">120 Kg</p>
              </div>
              <ArrowRight className="w-5 h-5 text-blue-300" />
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-md shadow-blue-600/20 mx-auto mb-2">
                  <Sprout className="w-6 h-6 text-white" />
                </div>
                <p className="text-[10px] font-bold text-gray-600">Rumah Maggot</p>
                <p className="text-xs font-black text-blue-700">Aktif</p>
              </div>
              <ArrowRight className="w-5 h-5 text-blue-300" />
              <div className="text-center">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mx-auto mb-2 border border-gray-100">
                  <span className="text-xl">🐟</span>
                </div>
                <p className="text-[10px] font-bold text-gray-600">Peternakan/Lele</p>
                <p className="text-xs font-black text-emerald-600">35 Kg Pakan</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-600" />
              Log Sistem (Rasio Sampah Terserap)
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold text-gray-600 mb-1">
                  <span>Organik Terolah Lokal (Loseda/Maggot)</span>
                  <span className="text-purple-600">65%</span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-purple-600 h-full rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold text-gray-600 mb-1">
                  <span>Anorganik ke Bank Sampah</span>
                  <span className="text-emerald-600">42%</span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: '42%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold text-gray-600 mb-1">
                  <span>Residu ke TPS (Tidak Terolah)</span>
                  <span className="text-rose-600">15%</span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-rose-600 h-full rounded-full" style={{ width: '15%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
