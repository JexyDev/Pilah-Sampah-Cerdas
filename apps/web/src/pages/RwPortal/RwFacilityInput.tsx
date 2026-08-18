import { useEffect, useState } from "react";
import api from "../../utils/api";
import toast from "react-hot-toast";

export const RwFacilityInput = () => {
  const [facilities, setFacilities] = useState<any[]>([]);
  const [pendingIde, setPendingIde] = useState<any[]>([]);
  const [pendingFacilities, setPendingFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedFacility, setSelectedFacility] = useState("");
  const [materialMasuk, setMaterialMasuk] = useState("");
  const [output, setOutput] = useState("");
  const [jenisOutput, setJenisOutput] = useState("");
  const [periode, setPeriode] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [facRes, ideRes, pendFacRes] = await Promise.all([
        api.get("/rw/facilities"),
        api.get("/rw/ide"),
        api.get("/rw/facilities/pending")
      ]);
      setFacilities(facRes.data);
      setPendingIde(ideRes.data);
      setPendingFacilities(pendFacRes.data);
    } catch (error) {
      console.error("Failed to fetch RW facility data", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const verifyIde = async (id: string, action: "APPROVED" | "REJECTED") => {
    try {
      await api.put(`/rw/ide/${id}/verify`, { action });
      fetchData();
    } catch (error) {
      console.error("Failed to verify ide", error);
    }
  };

  const verifyFacility = async (id: string, action: "APPROVED" | "REJECTED") => {
    try {
      await api.put(`/rw/facilities/${id}/verify`, { action });
      fetchData();
    } catch (error) {
      console.error("Failed to verify facility", error);
    }
  };

  const submitProduction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/rw/facilities/${selectedFacility}/production`, {
        materialMasukKg: materialMasuk,
        outputKg: output,
        jenisOutput,
        periode
      });
      toast.success("Data produksi berhasil disimpan");
      setMaterialMasuk("");
      setOutput("");
      setJenisOutput("");
      setPeriode("");
      fetchData();
    } catch (error) {
      console.error("Failed to submit production data", error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight">Fasilitas & Ide Daur Ulang</h1>

      {/* Pending Ide Daur Ulang */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50">
          <h3 className="font-bold text-gray-800 dark:text-slate-100 text-sm">Ide Daur Ulang Warga (Menunggu Persetujuan)</h3>
        </div>
        <div className="p-4">
          {pendingIde.length === 0 ? (
            <p className="text-gray-500">Tidak ada pengajuan ide daur ulang baru.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingIde.map(ide => (
                <div key={ide.id} className="border p-4 rounded-lg flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-lg">{ide.judul}</h4>
                    <p className="text-sm text-gray-500">Oleh: {ide.user?.name}</p>
                    <p className="mt-2 text-sm"><span className="font-semibold">Material:</span> {ide.material}</p>
                    {ide.foto && <img src={ide.foto} alt="Ide Daur Ulang" className="mt-2 h-32 object-cover rounded" />}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => verifyIde(ide.id, "APPROVED")} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex-1">Setujui (+50 Poin)</button>
                    <button onClick={() => verifyIde(ide.id, "REJECTED")} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex-1">Tolak</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pending Facilities */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50">
          <h3 className="font-bold text-gray-800 dark:text-slate-100 text-sm">Pendaftaran Fasilitas Lingkungan Baru</h3>
        </div>
        <div className="p-4">
          {pendingFacilities.length === 0 ? (
            <p className="text-gray-500">Tidak ada pendaftaran fasilitas baru.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama & Jenis</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Lokasi & GPS</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">PIC / Kontak</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi Verifikasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                  {pendingFacilities.map((fac) => (
                    <tr key={fac.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-800 dark:text-slate-100">{fac.nama}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            fac.jenis === "posko_kkn"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                          }`}>
                            {fac.jenis === "posko_kkn" ? "📍 Posko KKN Mahasiswa" : fac.jenis.replace("_", " ").toUpperCase()}
                          </span>
                          {fac.foto && (
                            <a href={fac.foto} target="_blank" rel="noreferrer" className="text-[11px] text-primary hover:underline">Lihat Foto</a>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                        <p className="font-medium">{fac.alamat || "Alamat tidak dicantumkan"}</p>
                        <p className="text-slate-400 font-mono mt-0.5">Lat: {Number(fac.latitude).toFixed(6)}, Lng: {Number(fac.longitude).toFixed(6)}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                        <p className="font-medium">{fac.pic || "-"}</p>
                        <p className="text-slate-400">{fac.kontak || "-"}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => verifyFacility(fac.id, "APPROVED")} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 font-semibold text-xs transition-colors shadow-sm">Setujui</button>
                          <button onClick={() => verifyFacility(fac.id, "REJECTED")} className="bg-rose-600 text-white px-3 py-1.5 rounded-lg hover:bg-rose-700 font-semibold text-xs transition-colors shadow-sm">Tolak</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Input Fasilitas */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50">
          <h3 className="font-bold text-gray-800 dark:text-slate-100 text-sm">Input Manual Data Produksi Fasilitas</h3>
        </div>
        <div className="p-4">
          <form onSubmit={submitProduction} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Pilih Fasilitas (Aktif)</label>
              <select value={selectedFacility} onChange={e => setSelectedFacility(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-700 shadow-sm focus:border-primary focus:ring-primary p-2 border">
                <option value="">Pilih...</option>
                {facilities.map(f => (
                  <option key={f.id} value={f.id}>{f.nama} ({f.jenis.replace("_", " ")})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Periode</label>
              <input type="text" placeholder="Minggu 1 Jan 2026" required value={periode} onChange={e => setPeriode(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-700 shadow-sm focus:border-primary focus:ring-primary p-2 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Material Masuk (Kg)</label>
              <input type="number" step="0.1" required value={materialMasuk} onChange={e => setMaterialMasuk(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-700 shadow-sm focus:border-primary focus:ring-primary p-2 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Hasil Output (Kg)</label>
              <input type="number" step="0.1" required value={output} onChange={e => setOutput(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-700 shadow-sm focus:border-primary focus:ring-primary p-2 border" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Jenis Output (Misal: Pupuk Kompos / Maggot Pupa)</label>
              <input type="text" required value={jenisOutput} onChange={e => setJenisOutput(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-700 shadow-sm focus:border-primary focus:ring-primary p-2 border" />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button type="submit" disabled={!selectedFacility} className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark disabled:opacity-50">Simpan Data Produksi</button>
            </div>
          </form>
        </div>
      </div>
      
    </div>
  );
};
