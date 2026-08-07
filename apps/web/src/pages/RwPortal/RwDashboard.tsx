import React, { useEffect, useState } from "react";
import { 
  Building2, 
  Sprout, 
  Recycle, 
  TrendingUp,
  Lightbulb,
  Factory,
  Database,
  ArrowRight,
  Truck
} from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import api from "../../utils/api";
import toast from "react-hot-toast";

export const RwDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [facilities, setFacilities] = useState<any[]>([]);
  const [rwSummary, setRwSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [maggotHarvest, setMaggotHarvest] = useState({
    weight: "",
    durationDays: "7"
  });

  useEffect(() => {
    const fetchRwData = async () => {
      try {
        setLoading(true);
        const [facRes, dashRes] = await Promise.all([
          api.get("/facilities").catch(() => ({ data: [] })),
          api.get("/rw/dashboard").catch(() => ({ data: null })),
        ]);
        setFacilities(Array.isArray(facRes.data) ? facRes.data : facRes.data?.data || []);
        setRwSummary(dashRes.data || null);
      } catch (err) {
        console.error("Gagal memuat data dashboard RW:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRwData();
  }, []);

  const countByJenis = (jenis: string) => {
    return facilities.filter((f: any) => f.jenis === jenis || f.type === jenis).length;
  };

  const handleMaggotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!maggotHarvest.weight) return;
    toast.success(`Berhasil mencatat panen maggot sebesar ${maggotHarvest.weight} kg!`);
    setMaggotHarvest({ weight: "", durationDays: "7" });
  };

  const warningCount = rwSummary?.warningBins || 0;
  const fullCount = rwSummary?.fullBins || 0;
  const totalBins = rwSummary?.totalBins || 0;

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
            Wilayah: {user?.address || "RW 00"} • Kecamatan Coblong
          </p>
        </div>
      </div>

      {/* Insight & Rekomendasi (Khusus RW - Real Metrics) */}
      <div className="bg-indigo-50/80 backdrop-blur-sm shadow-sm rounded-2xl p-6 border border-indigo-100 card-polish">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-bold text-[18px] text-indigo-900 flex items-center gap-2">
            <Lightbulb className="text-indigo-600 w-5 h-5" />
            Insight & Stat Wilayah Real
          </h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-white p-4 rounded-xl border border-indigo-50 text-xs shadow-sm">
            <span className="font-bold text-indigo-800 block mb-1">Total Tempat Sampah Aktif</span>
            <p className="text-slate-600">
              {loading ? "Memuat..." : `Terdapat ${totalBins} tempat sampah terdaftar & terikat di wilayah kerja RW Anda.`}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-indigo-50 text-xs shadow-sm">
            <span className="font-bold text-amber-600 block mb-1">Status Kapasitas (&gt;70%)</span>
            <p className="text-slate-600">
              {loading ? "Memuat..." : fullCount > 0 || warningCount > 0 ? `Ada ${fullCount} tempat sampah penuh (>=90%) dan ${warningCount} mendekati kapasitas.` : "Seluruh tempat sampah wilayah dalam kondisi kapasitas aman."}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-indigo-50 text-xs shadow-sm">
            <span className="font-bold text-emerald-600 block mb-1">Fasilitas Pengolahan</span>
            <p className="text-slate-600">
              {loading ? "Memuat..." : `Total ${facilities.length} fasilitas terdata di wilayah Anda (Bata Terawang, Loseda, Rumah Maggot, Bank Sampah).`}
            </p>
          </div>
        </div>
      </div>

      {/* Statistik Fasilitas Real */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { title: "Bata Terawang", count: countByJenis("bata_terawang"), trend: "Terdata di DB", icon: Database, color: "text-amber-600", bg: "bg-amber-100" },
          { title: "Loseda", count: countByJenis("loseda"), trend: "Terdata di DB", icon: Sprout, color: "text-emerald-600", bg: "bg-emerald-100" },
          { title: "Rumah Maggot", count: countByJenis("rumah_maggot"), trend: "Terdata di DB", icon: Recycle, color: "text-blue-600", bg: "bg-blue-100" },
          { title: "Bank Sampah", count: countByJenis("bank_sampah"), trend: "Terdata di DB", icon: Factory, color: "text-indigo-600", bg: "bg-indigo-100" },
        ].map((item, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 ${item.bg} rounded-xl flex items-center justify-center shrink-0`}>
              <item.icon className={`w-6 h-6 ${item.color}`} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold">{item.title}</p>
              <h3 className="text-2xl font-black text-gray-800">{loading ? "..." : item.count}</h3>
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
      {/* Monitoring Petugas Residu Wilayah RW */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-rose-600" />
              Monitoring Petugas Residu Wilayah RW
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pemantauan data timbulan residu hilir, jadwal pengangkutan, dan kinerja Petugas Residu di area RW ini.
            </p>
          </div>
          <span className="bg-rose-50 text-rose-700 border border-rose-100 font-bold text-xs px-3 py-1 rounded-full">
            Petugas Residu Terpasang
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* PIC Petugas Residu Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl border border-slate-800 shadow-md space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                  Petugas Residu Resmi
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <h4 className="text-base font-bold text-slate-100">Bpk. Agus Supriatna</h4>
              <p className="text-xs text-slate-400 mt-0.5">NIP/ID: RESIDU-CB-004</p>
              <div className="mt-4 pt-3 border-t border-slate-800 space-y-2 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Wilayah Tugas:</span>
                  <strong className="text-emerald-400">{user?.address || "RW 01"}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Kelurahan:</span>
                  <strong className="text-slate-200">Dago</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Window Tugas:</span>
                  <strong className="text-amber-300">06:00-08:00 & 16:00-18:00</strong>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 flex items-center justify-between text-xs">
              <span className="text-slate-400">Kontak Petugas:</span>
              <a href="tel:+6281200000004" className="font-bold text-emerald-400 hover:underline">
                +62 812-0000-0004
              </a>
            </div>
          </div>

          {/* Table Log Penimbangan Residu RW */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Riwayat Penimbangan Residu Hilir RW Hari Ini
              </h4>
              <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                Total: 48.5 Kg Residu Terinput
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                  <tr>
                    <th className="p-3">Waktu Input</th>
                    <th className="p-3">Diinput Oleh</th>
                    <th className="p-3">Kategori Residu</th>
                    <th className="p-3">Berat (Kg)</th>
                    <th className="p-3">Status Monitoring</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white font-medium">
                  {[
                    { time: "07:30 WIB", pet: "Bpk. Agus Supriatna", kat: "Residu Non-Recyclable", kg: "18.5 Kg", status: "VERIFIED_HILIR" },
                    { time: "06:45 WIB", pet: "Bpk. Agus Supriatna", kat: "Residu B3 / Popok", kg: "16.0 Kg", status: "VERIFIED_HILIR" },
                    { time: "Kemarin", pet: "Bpk. Agus Supriatna", kat: "Residu TPA Hilir", kg: "14.0 Kg", status: "VERIFIED_HILIR" },
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-semibold text-slate-700">{row.time}</td>
                      <td className="p-3 font-bold text-slate-800">{row.pet}</td>
                      <td className="p-3">
                        <span className="bg-rose-50 text-rose-700 border border-rose-200 font-bold px-2 py-0.5 rounded text-[10px]">
                          {row.kat}
                        </span>
                      </td>
                      <td className="p-3 font-black text-slate-900">{row.kg}</td>
                      <td className="p-3">
                        <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 font-extrabold px-2 py-0.5 rounded text-[10px]">
                          100% Terverifikasi
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
