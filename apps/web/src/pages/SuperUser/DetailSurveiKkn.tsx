import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, FileText, ArrowLeft, MapPin, Database, Sprout, Building, Users, AlertTriangle, ArrowRight } from "lucide-react";
import api from "../../services/api";
import showToast from "../../utils/showToast";

export default function DetailSurveiKkn() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [selectedSurvey, setSelectedSurvey] = useState<any>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      setIsLoadingDetail(true);
      try {
        const response = await api.get(`/survei-kkn/${id}`);
        if (response.data.success) {
          setSelectedSurvey(response.data.data);
        }
      } catch (error: any) {
        showToast.error("Gagal memuat detail survei");
      } finally {
        setIsLoadingDetail(false);
      }
    };
    fetchDetail();
  }, [id]);

  const tabs = [
    { id: "overview", label: "Ringkasan", icon: FileText },
    { id: "karakter", label: "Karakteristik", icon: MapPin },
    { id: "pemilahan", label: "Pemilahan", icon: Database },
    { id: "bank_sampah", label: "Bank Sampah", icon: Sprout },
    { id: "key_player", label: "Aktor (Key Player)", icon: Users },
    { id: "potensi_risiko", label: "Kesimpulan & Risiko", icon: AlertTriangle },
  ];

  const renderBool = (val: boolean | null | undefined) => {
    if (val === null || val === undefined) return <span className="text-slate-400 italic">Tidak ada data</span>;
    return val ? <span className="text-emerald-600 font-bold">Ya</span> : <span className="text-rose-600 font-bold">Tidak</span>;
  };

  const renderValue = (val: any, suffix = "") => {
    if (val === null || val === undefined || val === "") return <span className="text-slate-400 italic">Tidak ada data</span>;
    return <span className="text-slate-800 font-medium">{val} {suffix}</span>;
  };

  const renderTabContent = () => {
    if (!selectedSurvey) return null;

    const {
      karakteristikWilayah: kw,
      pemilahanSampah: ps,
      bankSampahPengolahan: bs,
      keyPlayers: kp,
      volumeSampah: vs,
      catatanKesimpulan: pr,
    } = selectedSurvey;

    switch (activeTab) {
      case "overview":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 border-b pb-2">Informasi Umum</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
                <span className="text-slate-500">Kecamatan:</span> <div>{renderValue(selectedSurvey.kecamatan)}</div>
                <span className="text-slate-500">Jumlah RW:</span> <div>{renderValue(selectedSurvey.jumlahRw)}</div>
                <span className="text-slate-500">Jumlah RT:</span> <div>{renderValue(selectedSurvey.jumlahRt)}</div>
                <span className="text-slate-500">Jumlah KK:</span> <div>{renderValue(selectedSurvey.jumlahKk)}</div>
                <span className="text-slate-500">Total Rumah:</span> <div>{renderValue(selectedSurvey.jumlahRumahTotal)}</div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 border-b pb-2">Data Pengumpulan</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
                <span className="text-slate-500">Tanggal Survei:</span> <div>{selectedSurvey.tanggalSurvei ? new Date(selectedSurvey.tanggalSurvei).toLocaleDateString("id-ID") : <span className="text-slate-400 italic">Kosong</span>}</div>
                <span className="text-slate-500">Enumerator:</span> <div>{renderValue(selectedSurvey.enumerator)}</div>
                <span className="text-slate-500">Titik Kumpul:</span> <div>{renderValue(selectedSurvey.titikKumpulMahasiswa)}</div>
                <span className="text-slate-500">Catatan Khusus:</span> <div className="col-span-2 mt-1 p-3 bg-slate-50 rounded-xl text-sm text-slate-700 leading-relaxed border border-slate-100">{renderValue(selectedSurvey.catatanData)}</div>
              </div>
            </div>
            {vs && (
              <div className="col-span-1 md:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 border-b pb-2">Estimasi Volume Sampah (Kg/Hari)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100/50 text-center">
                    <p className="text-sm text-emerald-600 font-bold mb-1">Organik</p>
                    <p className="text-2xl font-black text-emerald-700">{renderValue(vs.organikKgPerHari)}</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100/50 text-center">
                    <p className="text-sm text-blue-600 font-bold mb-1">Anorganik</p>
                    <p className="text-2xl font-black text-blue-700">{renderValue(vs.anorganikKgPerHari)}</p>
                  </div>
                  <div className="bg-rose-50 p-4 rounded-xl border border-rose-100/50 text-center">
                    <p className="text-sm text-rose-600 font-bold mb-1">Residu</p>
                    <p className="text-2xl font-black text-rose-700">{renderValue(vs.residuKgPerHari)}</p>
                  </div>
                  <div className="bg-slate-100 p-4 rounded-xl border border-slate-200/50 text-center">
                    <p className="text-sm text-slate-600 font-bold mb-1">Total</p>
                    <p className="text-2xl font-black text-slate-800">{renderValue(vs.totalVolumeKgPerHari)}</p>
                  </div>
                </div>
                {vs.catatan && <p className="text-sm text-slate-500 mt-2 bg-slate-50 p-3 rounded-lg border border-slate-100">Catatan: {vs.catatan}</p>}
              </div>
            )}
          </div>
        );
      case "karakter":
        if (!kw) return <p className="text-center py-10 text-slate-500 font-medium">Belum ada data karakteristik wilayah.</p>;
        return (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4 text-sm">
              <div className="flex justify-between items-center py-2.5 border-b border-slate-50">
                <span className="text-slate-600 font-medium">Padat Penduduk:</span> {renderBool(kw.padatPenduduk)}
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-slate-50">
                <span className="text-slate-600 font-medium">Banyak Kos/Kontrakan:</span> {renderBool(kw.banyakKosKontrakan)}
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-slate-50">
                <span className="text-slate-600 font-medium">Banyak UMKM/Warung:</span> {renderBool(kw.banyakUmkmWarungKafe)}
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-slate-50">
                <span className="text-slate-600 font-medium">Dekat Kampus/Sekolah:</span> {renderBool(kw.dekatKampusSekolah)}
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-slate-50">
                <span className="text-slate-600 font-medium">Dekat Pasar:</span> {renderBool(kw.pasar)}
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-slate-50">
                <span className="text-slate-600 font-medium">Dekat Bantaran Sungai:</span> {renderBool(kw.bantaranSungai)}
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-slate-50">
                <span className="text-slate-600 font-medium">Karakter Lainnya Flag:</span> {renderBool(kw.karakterLainnyaFlag)}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase mb-1.5">Detail Karakter Lainnya</p>
                <p className="text-sm font-semibold text-slate-800">{renderValue(kw.karakterLainnyaKeterangan)}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase mb-1.5">Perkiraan Jml Kos</p>
                <p className="text-sm font-semibold text-slate-800">{renderValue(kw.perkiraanJumlahKosKontrakan)}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase mb-1.5">Perkiraan Jml UMKM</p>
                <p className="text-sm font-semibold text-slate-800">{renderValue(kw.perkiraanJumlahUmkmWarungKafe)}</p>
              </div>
            </div>
          </div>
        );
      case "pemilahan":
        if (!ps) return <p className="text-center py-10 text-slate-500 font-medium">Belum ada data pemilahan sampah.</p>;
        return (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm max-w-3xl mx-auto">
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center py-4 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Jumlah Rumah Memilah</span>
                <span className="text-xl font-black text-slate-800">{renderValue(ps.jumlahRumahMemilah)}</span>
              </div>
              <div className="flex justify-between items-center py-4 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Total Rumah (Sample)</span>
                <span className="text-xl font-black text-slate-800">{renderValue(ps.totalJumlahRumahDiRw)}</span>
              </div>
              <div className="flex justify-between items-center py-5 border-b border-slate-100 bg-[#e5f7ed] -mx-6 px-6 rounded-lg">
                <span className="text-[#009966] font-extrabold text-lg">Persentase Pemilahan</span>
                <span className="text-3xl font-black text-[#009966]">{renderValue(ps.persentasePemilahan, "%")}</span>
              </div>
              <div className="flex justify-between items-center py-4 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Tingkat Pemilahan (Skala Kualitatif)</span>
                <span className="font-bold text-sky-600 bg-sky-50 px-4 py-1.5 rounded-full">{renderValue(ps.tingkatPemilahan)}</span>
              </div>
              {ps.catatan && (
                <div className="pt-4">
                  <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Catatan Tambahan</span>
                  <p className="mt-2 text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm leading-relaxed">{ps.catatan}</p>
                </div>
              )}
            </div>
          </div>
        );
      case "bank_sampah":
        if (!bs) return <p className="text-center py-10 text-slate-500 font-medium">Belum ada data fasilitas bank sampah & pengolahan.</p>;
        return (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-5">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <Building size={28} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Bank Sampah Aktif</p>
                  <p className="text-3xl font-black text-slate-800">{renderValue(bs.bankSampahAktif)}</p>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-5">
                <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <Building size={28} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Bank Sampah Tidak Aktif</p>
                  <p className="text-3xl font-black text-slate-800">{renderValue(bs.bankSampahTidakAktif)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h4 className="font-bold text-slate-800 mb-5 pb-3 border-b">Fasilitas Ekosistem Pendukung</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-sm">
                <div className="flex justify-between items-center py-2.5 border-b border-slate-50">
                  <span className="text-slate-600 font-medium">Biopori / Loseda:</span> {renderBool(bs.bioporiLoseda)}
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-slate-50">
                  <span className="text-slate-600 font-medium">Ecobrick / Kerajinan Daur Ulang:</span> {renderBool(bs.ecobrickKerajinanDaurUlang)}
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-slate-50">
                  <span className="text-slate-600 font-medium">Buruan Sae / Kebun Warga:</span> {renderBool(bs.buruanSae)}
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-slate-50">
                  <span className="text-slate-600 font-medium">Pengepul Mitra Daur Ulang:</span> {renderBool(bs.pengepulMitraDaurUlang)}
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-slate-50">
                  <span className="text-slate-600 font-medium">Sistem Digitalisasi Data:</span> {renderBool(bs.digitalisasiData)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1.5">Jumlah Unit Komposter</p>
                  <p className="text-lg font-black text-slate-800">{renderValue(bs.jumlahUnitKomposter)}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1.5">Titik Maggot / BSF</p>
                  <p className="text-lg font-black text-slate-800">{renderValue(bs.jumlahTitikMaggotBsf)}</p>
                </div>
                {bs.aktivitasLainnyaKeterangan && (
                  <div className="col-span-1 md:col-span-2 bg-sky-50 p-4 rounded-xl border border-sky-100/60 mt-2">
                    <p className="text-xs text-sky-600 uppercase mb-1.5 font-bold">Keterangan Aktivitas Lainnya</p>
                    <p className="text-sm font-semibold text-slate-800">{bs.aktivitasLainnyaKeterangan}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case "key_player":
        if (!kp || kp.length === 0) return <p className="text-center py-10 text-slate-500 font-medium">Belum ada data key player yang terdata.</p>;
        return (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="p-4 font-bold text-xs text-slate-600 uppercase tracking-wider">No</th>
                    <th className="p-4 font-bold text-xs text-slate-600 uppercase tracking-wider">Nama</th>
                    <th className="p-4 font-bold text-xs text-slate-600 uppercase tracking-wider">Jenis Aktor / Posisi</th>
                    <th className="p-4 font-bold text-xs text-slate-600 uppercase tracking-wider">Kontak</th>
                    <th className="p-4 font-bold text-xs text-slate-600 uppercase tracking-wider">Peran Aktif</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {kp.map((actor: any, idx: number) => (
                    <tr key={actor.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 text-slate-500 font-medium">{idx + 1}</td>
                      <td className="p-4 font-bold text-slate-800">{renderValue(actor.nama)}</td>
                      <td className="p-4">
                        <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-md text-xs font-bold border border-emerald-100">
                          {renderValue(actor.jenisAktor)}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600 font-medium">{renderValue(actor.kontak)}</td>
                      <td className="p-4 text-slate-600">{renderValue(actor.peran)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case "potensi_risiko":
        if (!pr) return <p className="text-center py-10 text-slate-500 font-medium">Belum ada catatan kesimpulan atau risiko sosial.</p>;
        return (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h4 className="text-emerald-700 font-extrabold text-lg flex items-center gap-2 mb-4">
                <ArrowRight size={20} /> Rekomendasi / Prioritas Intervensi
              </h4>
              <div className="bg-emerald-50/50 p-5 rounded-xl text-emerald-900 leading-relaxed text-sm border border-emerald-100 whitespace-pre-wrap font-medium">
                {renderValue(pr.prioritasIntervensi)}
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h4 className="text-rose-600 font-extrabold text-lg flex items-center gap-2 mb-4">
                <AlertTriangle size={20} /> Catatan & Risiko Sosial
              </h4>
              <div className="bg-rose-50/50 p-5 rounded-xl text-rose-900 leading-relaxed text-sm border border-rose-100 whitespace-pre-wrap font-medium">
                {renderValue(pr.catatanTambahanRisikoSosial)}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300 pb-20">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <button 
            onClick={() => navigate("/superUser/data-survei-kkn")}
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-emerald-600 mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} /> Kembali ke Tabel
          </button>
          
          {isLoadingDetail ? (
            <div className="h-9 w-64 bg-slate-200 animate-pulse rounded-lg"></div>
          ) : (
            <>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Data Survei: Kelurahan {selectedSurvey?.namaKelurahan}
              </h1>
              {selectedSurvey?.kecamatan && (
                <p className="text-sm font-medium text-slate-500 mt-1">Kecamatan {selectedSurvey.kecamatan}</p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-6 overflow-x-auto scrollbar-none" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  isActive
                    ? "border-emerald-600 text-emerald-700"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm flex items-center gap-2 cursor-pointer transition-colors`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content Area */}
      <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 shadow-xs min-h-[500px]">
        {isLoadingDetail ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="animate-spin text-emerald-600 mb-4" size={40} />
            <p className="text-slate-500 font-medium">Memuat data secara penuh...</p>
          </div>
        ) : (
          renderTabContent()
        )}
      </div>
    </div>
  );
}
