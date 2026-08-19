import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, FileText, MapPin, Database, Sprout, Users, AlertTriangle, ArrowRight, Building, Map, CheckCircle2, Edit3, Home, ClipboardList, Info } from "lucide-react";
import api from "../../services/api";
import showToast from "../../utils/showToast";
import EditSurveiModal from "./EditSurveiModal";
import { useAuthStore } from "../../store/useAuthStore";

export default function DetailSurveiKkn() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const canEdit = user?.peran === "SUPER_USER" || user?.peran === "PANITIA_TASKFORCE";

  const [selectedSurvey, setSelectedSurvey] = useState<any>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchDetail = async () => {
    if (!id) return;
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

  useEffect(() => {
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
    if (val === null || val === undefined) return <span className="text-slate-400 font-medium">— Belum tersedia</span>;
    return val ? <span className="text-emerald-600 font-bold">Ya</span> : <span className="text-rose-600 font-bold">Tidak</span>;
  };

  const renderValue = (val: any, suffix = "") => {
    if (val === null || val === undefined || val === "") return <span className="text-slate-400 font-medium">— Belum tersedia</span>;
    return <span className="text-slate-800 dark:text-slate-100 font-medium">{val} {suffix}</span>;
  };

  const calculateCompletion = () => {
    if (!selectedSurvey) return { percentage: 0, breakdown: [] };
    
    let completedSteps = 0;
    const breakdown = [
      { key: "Data Wilayah", isComplete: false },
      { key: "Data Pengumpulan", isComplete: false },
      { key: "Karakteristik", isComplete: false },
      { key: "Pemilahan", isComplete: false },
      { key: "Bank Sampah", isComplete: false },
      { key: "Aktor", isComplete: false },
      { key: "Kesimpulan", isComplete: false },
    ];

    // 1. Data Wilayah (Informasi Umum)
    if (selectedSurvey.kecamatan && selectedSurvey.jumlahRw && selectedSurvey.jumlahRt) {
      breakdown[0].isComplete = true; completedSteps++;
    }
    // 2. Data Pengumpulan
    if (selectedSurvey.tanggalSurvei && selectedSurvey.enumerator) {
      breakdown[1].isComplete = true; completedSteps++;
    }
    // 3. Karakteristik
    if (selectedSurvey.karakteristikWilayah) {
      breakdown[2].isComplete = true; completedSteps++;
    }
    // 4. Pemilahan
    if (selectedSurvey.pemilahanSampah) {
      breakdown[3].isComplete = true; completedSteps++;
    }
    // 5. Bank Sampah
    if (selectedSurvey.bankSampahPengolahan) {
      breakdown[4].isComplete = true; completedSteps++;
    }
    // 6. Aktor
    if (selectedSurvey.keyPlayers && selectedSurvey.keyPlayers.length > 0) {
      breakdown[5].isComplete = true; completedSteps++;
    }
    // 7. Kesimpulan
    if (selectedSurvey.catatanKesimpulan) {
      breakdown[6].isComplete = true; completedSteps++;
    }

    return {
      percentage: Math.round((completedSteps / 7) * 100),
      breakdown
    };
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
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <h4 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <Map size={20} className="text-emerald-600" /> Informasi Wilayah
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b-2 border-slate-100 dark:border-slate-800 text-slate-400">
                        <th className="pb-3 font-bold uppercase tracking-wider">Data</th>
                        <th className="pb-3 font-bold uppercase tracking-wider text-right">Nilai</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      <tr>
                        <td className="py-3.5 text-slate-600 dark:text-slate-400 font-medium flex items-center gap-2"><MapPin size={16} /> Kecamatan</td>
                        <td className="py-3.5 text-right font-bold text-slate-800 dark:text-slate-100">{renderValue(selectedSurvey.kecamatan)}</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 text-slate-600 dark:text-slate-400 font-medium flex items-center gap-2"><Map size={16} /> Jumlah RW</td>
                        <td className="py-3.5 text-right font-bold text-slate-800 dark:text-slate-100">{renderValue(selectedSurvey.jumlahRw, "RW")}</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 text-slate-600 dark:text-slate-400 font-medium flex items-center gap-2"><Map size={16} /> Jumlah RT</td>
                        <td className="py-3.5 text-right font-bold text-slate-800 dark:text-slate-100">{renderValue(selectedSurvey.jumlahRt, "RT")}</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 text-slate-600 dark:text-slate-400 font-medium flex items-center gap-2"><Users size={16} /> Jumlah KK</td>
                        <td className="py-3.5 text-right font-bold text-slate-800 dark:text-slate-100">{renderValue(selectedSurvey.jumlahKk, "KK")}</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 text-slate-600 dark:text-slate-400 font-medium flex items-center gap-2"><Home size={16} /> Total Rumah</td>
                        <td className="py-3.5 text-right font-bold text-slate-800 dark:text-slate-100">{renderValue(selectedSurvey.jumlahRumahTotal)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col">
                <h4 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <ClipboardList size={20} className="text-emerald-600" /> Data Pengumpulan
                </h4>
                
                {(!selectedSurvey.tanggalSurvei || !selectedSurvey.enumerator) && (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-4 flex items-start gap-3">
                    <Info size={20} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-amber-800 font-bold text-sm">Data belum lengkap</p>
                      <p className="text-amber-700 text-xs mt-1 leading-relaxed">Beberapa informasi belum tersedia karena belum diisi pada formulir sumber.</p>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-y-6 gap-x-4 text-sm flex-1 content-start">
                  <div>
                    <span className="text-slate-500 font-medium block mb-1">Status Survei</span>
                    {completion.percentage === 100 ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold">
                        <CheckCircle2 size={14} /> Lengkap
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg font-bold">
                        <Info size={14} /> Belum Lengkap
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block mb-1">Tanggal Survei</span>
                    <div className="font-bold text-slate-800 dark:text-slate-100">
                      {selectedSurvey.tanggalSurvei ? new Date(selectedSurvey.tanggalSurvei).toLocaleDateString("id-ID") : renderValue(null)}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block mb-1">Enumerator</span>
                    <div className="font-bold text-slate-800 dark:text-slate-100">{renderValue(selectedSurvey.enumerator)}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block mb-1">Titik Kumpul</span>
                    <div className="font-bold text-slate-800 dark:text-slate-100">{renderValue(selectedSurvey.titikKumpulMahasiswa)}</div>
                  </div>
                  {selectedSurvey.catatanData && (
                    <div className="col-span-2">
                      <span className="text-slate-500 font-medium block mb-1">Catatan Khusus</span>
                      <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl text-slate-700 dark:text-slate-300 leading-relaxed border border-slate-100 dark:border-slate-800">
                        {selectedSurvey.catatanData}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <h4 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                <Database size={20} className="text-emerald-600" /> Estimasi Timbulan Sampah
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 text-center flex flex-col items-center justify-center min-h-[140px]">
                  <p className="text-xs text-emerald-700 font-bold uppercase tracking-wider mb-2">Organik</p>
                  {vs?.organikKgPerHari !== undefined && vs?.organikKgPerHari !== null ? (
                    <>
                      <p className="text-5xl font-black text-emerald-600 mb-1">{vs.organikKgPerHari}</p>
                      <p className="text-xs text-emerald-600/70 font-bold uppercase">kg / hari</p>
                    </>
                  ) : (
                    <>
                      <p className="text-5xl font-black text-slate-300 mb-1">—</p>
                      <p className="text-xs text-slate-400 font-bold uppercase">Belum tersedia</p>
                    </>
                  )}
                </div>
                <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 text-center flex flex-col items-center justify-center min-h-[140px]">
                  <p className="text-xs text-blue-700 font-bold uppercase tracking-wider mb-2">Anorganik</p>
                  {vs?.anorganikKgPerHari !== undefined && vs?.anorganikKgPerHari !== null ? (
                    <>
                      <p className="text-5xl font-black text-blue-600 mb-1">{vs.anorganikKgPerHari}</p>
                      <p className="text-xs text-blue-600/70 font-bold uppercase">kg / hari</p>
                    </>
                  ) : (
                    <>
                      <p className="text-5xl font-black text-slate-300 mb-1">—</p>
                      <p className="text-xs text-slate-400 font-bold uppercase">Belum tersedia</p>
                    </>
                  )}
                </div>
                <div className="bg-rose-50/50 p-6 rounded-2xl border border-rose-100 text-center flex flex-col items-center justify-center min-h-[140px]">
                  <p className="text-xs text-rose-700 font-bold uppercase tracking-wider mb-2">Residu</p>
                  {vs?.residuKgPerHari !== undefined && vs?.residuKgPerHari !== null ? (
                    <>
                      <p className="text-5xl font-black text-rose-600 mb-1">{vs.residuKgPerHari}</p>
                      <p className="text-xs text-rose-600/70 font-bold uppercase">kg / hari</p>
                    </>
                  ) : (
                    <>
                      <p className="text-5xl font-black text-slate-300 mb-1">—</p>
                      <p className="text-xs text-slate-400 font-bold uppercase">Belum tersedia</p>
                    </>
                  )}
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center min-h-[140px]">
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider mb-2">Total</p>
                  {vs?.totalVolumeKgPerHari !== undefined && vs?.totalVolumeKgPerHari !== null ? (
                    <>
                      <p className="text-5xl font-black text-slate-800 dark:text-slate-100 mb-1">{vs.totalVolumeKgPerHari}</p>
                      <p className="text-xs text-slate-500 font-bold uppercase">kg / hari</p>
                    </>
                  ) : (
                    <>
                      <p className="text-5xl font-black text-slate-300 mb-1">—</p>
                      <p className="text-xs text-slate-400 font-bold uppercase">Belum tersedia</p>
                    </>
                  )}
                </div>
              </div>
              {vs?.catatan && <p className="text-sm text-slate-500 mt-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800 italic">Catatan: {vs.catatan}</p>}
            </div>
          </div>
        );
      case "karakter":
        if (!kw) return (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 border-dashed">
             <MapPin size={32} className="text-slate-300 mb-3" />
             <p className="text-slate-500 font-medium">Data Karakteristik Wilayah belum tersedia.</p>
          </div>
        );
        return (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <h4 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <MapPin size={20} className="text-emerald-600" /> Profil & Karakteristik Wilayah
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b-2 border-slate-100 dark:border-slate-800 text-slate-400">
                      <th className="pb-3 font-bold uppercase tracking-wider">Karakteristik Lingkungan</th>
                      <th className="pb-3 font-bold uppercase tracking-wider text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    <tr>
                      <td className="py-3.5 text-slate-600 dark:text-slate-400 font-medium">Padat Penduduk</td>
                      <td className="py-3.5 text-right">{renderBool(kw.padatPenduduk)}</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 text-slate-600 dark:text-slate-400 font-medium">Banyak Kos/Kontrakan</td>
                      <td className="py-3.5 text-right">{renderBool(kw.banyakKosKontrakan)}</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 text-slate-600 dark:text-slate-400 font-medium">Banyak UMKM/Warung</td>
                      <td className="py-3.5 text-right">{renderBool(kw.banyakUmkmWarungKafe)}</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 text-slate-600 dark:text-slate-400 font-medium">Dekat Kampus/Sekolah</td>
                      <td className="py-3.5 text-right">{renderBool(kw.dekatKampusSekolah)}</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 text-slate-600 dark:text-slate-400 font-medium">Dekat Pasar</td>
                      <td className="py-3.5 text-right">{renderBool(kw.pasar)}</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 text-slate-600 dark:text-slate-400 font-medium">Dekat Bantaran Sungai</td>
                      <td className="py-3.5 text-right">{renderBool(kw.bantaranSungai)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-center">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Perkiraan Jml Kos</p>
                <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{renderValue(kw.perkiraanJumlahKosKontrakan)}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-center">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Perkiraan Jml UMKM</p>
                <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{renderValue(kw.perkiraanJumlahUmkmWarungKafe)}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center md:col-span-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Karakter Lainnya</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
                  {kw.karakterLainnyaFlag ? renderValue(kw.karakterLainnyaKeterangan) : <span className="text-slate-400">— Tidak ada spesifikasi lain</span>}
                </p>
              </div>
            </div>
          </div>
        );
      case "pemilahan":
        if (!ps) return (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 border-dashed">
             <Database size={32} className="text-slate-300 mb-3" />
             <p className="text-slate-500 font-medium">Data pemilahan sampah belum tersedia.</p>
          </div>
        );
        return (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Database size={160} />
              </div>
              <h4 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 relative z-10">
                <Database size={20} className="text-emerald-600" /> Statistik Pemilahan Warga
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10 mb-8">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col justify-center">
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Jumlah Rumah Memilah</p>
                  <p className="text-4xl font-black text-slate-800 dark:text-slate-100">{renderValue(ps.jumlahRumahMemilah)}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col justify-center">
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Total Rumah (Sample)</p>
                  <p className="text-4xl font-black text-slate-800 dark:text-slate-100">{renderValue(ps.totalJumlahRumahDiRw)}</p>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div>
                  <p className="text-emerald-700 font-bold uppercase tracking-wider text-sm mb-1">Persentase Kepatuhan</p>
                  <div className="flex items-end gap-2">
                    <span className="text-5xl font-black text-emerald-600">{ps.persentasePemilahan !== null ? ps.persentasePemilahan : '—'}</span>
                    {ps.persentasePemilahan !== null && <span className="text-2xl font-bold text-emerald-600/70 mb-1">%</span>}
                  </div>
                </div>
                <div className="w-px h-16 bg-emerald-200 hidden md:block"></div>
                <div className="text-left md:text-right">
                  <p className="text-emerald-700 font-bold uppercase tracking-wider text-sm mb-2">Tingkat Kesadaran</p>
                  <span className="inline-block bg-white dark:bg-slate-900 text-emerald-700 px-5 py-2 rounded-xl font-bold border border-emerald-200 text-lg shadow-sm">
                    {renderValue(ps.tingkatPemilahan)}
                  </span>
                </div>
              </div>

              {ps.catatan && (
                <div className="mt-8 relative z-10">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Info size={14} /> Catatan Lapangan</h5>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-xl border border-slate-100 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {ps.catatan}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case "bank_sampah":
        if (!bs) return (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 border-dashed">
             <Sprout size={32} className="text-slate-300 mb-3" />
             <p className="text-slate-500 font-medium">Data fasilitas bank sampah & pengolahan belum tersedia.</p>
          </div>
        );
        return (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 shadow-sm flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <Building size={32} />
                </div>
                <div>
                  <p className="text-xs text-emerald-700 uppercase font-bold tracking-wider mb-1">Bank Sampah Aktif</p>
                  <p className="text-4xl font-black text-slate-800 dark:text-slate-100">{renderValue(bs.bankSampahAktif)}</p>
                </div>
              </div>
              <div className="bg-rose-50/50 p-6 rounded-2xl border border-rose-100 shadow-sm flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <Building size={32} />
                </div>
                <div>
                  <p className="text-xs text-rose-700 uppercase font-bold tracking-wider mb-1">Bank Sampah Tidak Aktif</p>
                  <p className="text-4xl font-black text-slate-800 dark:text-slate-100">{renderValue(bs.bankSampahTidakAktif)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <h4 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <Sprout size={20} className="text-emerald-600" /> Fasilitas Ekosistem Pendukung
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2 text-sm mb-8">
                <div className="flex justify-between items-center py-3 border-b border-slate-50">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Biopori / Loseda</span> {renderBool(bs.bioporiLoseda)}
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-50">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Ecobrick / Daur Ulang</span> {renderBool(bs.ecobrickKerajinanDaurUlang)}
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-50">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Buruan Sae / Kebun Warga</span> {renderBool(bs.buruanSae)}
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-50">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Pengepul Mitra</span> {renderBool(bs.pengepulMitraDaurUlang)}
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-50 md:col-span-2">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Sistem Digitalisasi Data</span> {renderBool(bs.digitalisasiData)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Jumlah Unit Komposter</p>
                  <p className="text-3xl font-black text-slate-800 dark:text-slate-100">{renderValue(bs.jumlahUnitKomposter)}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Titik Maggot / BSF</p>
                  <p className="text-3xl font-black text-slate-800 dark:text-slate-100">{renderValue(bs.jumlahTitikMaggotBsf)}</p>
                </div>
                <div className="col-span-1 md:col-span-2 bg-sky-50/50 p-5 rounded-2xl border border-sky-100/60 mt-2">
                  <p className="text-xs text-sky-700 uppercase tracking-wider font-bold mb-2">Keterangan Aktivitas Lainnya</p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {bs.aktivitasLainnyaKeterangan ? renderValue(bs.aktivitasLainnyaKeterangan) : <span className="text-slate-400 font-medium">— Belum tersedia</span>}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      case "key_player":
        if (!kp || kp.length === 0) return (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 border-dashed">
             <Users size={32} className="text-slate-300 mb-3" />
             <p className="text-slate-500 font-medium">Data Aktor / Key Player belum tersedia.</p>
          </div>
        );
        return (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <h4 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Users size={20} className="text-emerald-600" /> Daftar Aktor (Key Players)
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 dark:border-slate-800">
                    <th className="px-6 py-4 font-bold text-xs text-slate-500 uppercase tracking-wider">No</th>
                    <th className="px-6 py-4 font-bold text-xs text-slate-500 uppercase tracking-wider">Nama</th>
                    <th className="px-6 py-4 font-bold text-xs text-slate-500 uppercase tracking-wider">Jenis Aktor / Posisi</th>
                    <th className="px-6 py-4 font-bold text-xs text-slate-500 uppercase tracking-wider">Kontak</th>
                    <th className="px-6 py-4 font-bold text-xs text-slate-500 uppercase tracking-wider">Peran Aktif</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {kp.map((actor: any, idx: number) => (
                    <tr key={actor.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 text-slate-400 font-bold">{idx + 1}</td>
                      <td className="px-6 py-4 font-extrabold text-slate-800 dark:text-slate-100">{renderValue(actor.nama)}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg text-xs font-bold border border-emerald-100">
                          {renderValue(actor.jenisAktor)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">{renderValue(actor.kontak)}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{renderValue(actor.peran)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case "potensi_risiko":
        if (!pr) return (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 border-dashed">
             <AlertTriangle size={32} className="text-slate-300 mb-3" />
             <p className="text-slate-500 font-medium">Catatan kesimpulan dan risiko sosial belum tersedia.</p>
          </div>
        );
        return (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <ArrowRight size={120} />
              </div>
              <h4 className="text-emerald-700 font-extrabold text-lg flex items-center gap-2 mb-4 relative z-10">
                <ArrowRight size={20} /> Rekomendasi / Prioritas Intervensi
              </h4>
              <div className="bg-emerald-50/50 p-6 rounded-xl text-emerald-900 leading-relaxed text-sm border border-emerald-100 whitespace-pre-wrap font-medium relative z-10">
                {pr.prioritasIntervensi ? renderValue(pr.prioritasIntervensi) : <span className="text-emerald-700/50 italic">— Belum tersedia</span>}
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <AlertTriangle size={120} />
              </div>
              <h4 className="text-rose-600 font-extrabold text-lg flex items-center gap-2 mb-4 relative z-10">
                <AlertTriangle size={20} /> Catatan & Risiko Sosial
              </h4>
              <div className="bg-rose-50/50 p-6 rounded-xl text-rose-900 leading-relaxed text-sm border border-rose-100 whitespace-pre-wrap font-medium relative z-10">
                {pr.catatanTambahanRisikoSosial ? renderValue(pr.catatanTambahanRisikoSosial) : <span className="text-rose-700/50 italic">— Belum tersedia</span>}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const completion = calculateCompletion();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300 pb-20">
      {/* Header Area */}
      <div className="flex flex-col gap-6">
        <div>
          <button
            onClick={() => navigate("/superUser/data-survei-kkn")}
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-600 font-bold mb-4 transition-colors cursor-pointer"
          >
            ← Kembali ke Data Survei KKN
          </button>
          
          {isLoadingDetail ? (
            <div className="h-9 w-64 bg-slate-200 dark:bg-slate-700 animate-pulse rounded-lg"></div>
          ) : (
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 w-full">
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                  Detail Survei Kelurahan {selectedSurvey?.namaKelurahan}
                </h1>
                <div className="flex items-center gap-3 mt-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${completion.percentage === 100 ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'}`}>
                    {completion.percentage === 100 ? 'Lengkap' : 'Belum Lengkap'}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="bg-white dark:bg-slate-900 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs min-w-[280px]">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Kelengkapan Data</span>
                    <span className="text-sm font-black text-slate-800 dark:text-slate-100">{completion.percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mb-3">
                    <div className={`h-2 rounded-full ${completion.percentage === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${completion.percentage}%` }}></div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
                    {completion.breakdown.map((b, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        {b.isComplete ? (
                          <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                        ) : (
                          <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0 border border-slate-300 dark:border-slate-600" />
                        )}
                        <span className={`text-[10px] font-bold ${b.isComplete ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}`}>{b.key}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Row with Edit Button on the far right */}
      <div className="border-b border-slate-200 dark:border-slate-800 mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <nav className="-mb-px flex space-x-6 sm:space-x-8 overflow-x-auto scrollbar-none" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  isActive
                    ? "border-emerald-600 text-emerald-600"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                } whitespace-nowrap py-3.5 border-b-2 font-bold text-sm cursor-pointer transition-colors`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {canEdit && (
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="mb-2 sm:mb-0 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold text-xs shadow-xs hover:shadow-md transition-all transform active:scale-95 cursor-pointer border border-emerald-500/20 shrink-0 self-start sm:self-auto"
          >
            <Edit3 size={15} />
            <span>Edit Data Survei</span>
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="min-h-[500px]">
        {isLoadingDetail ? (
          <div className="flex flex-col items-center justify-center py-32 bg-slate-50/50 rounded-2xl border border-slate-100 dark:border-slate-800">
            <Loader2 className="animate-spin text-emerald-600 mb-4" size={40} />
            <p className="text-slate-500 font-medium">Memuat data secara penuh...</p>
          </div>
        ) : (
          renderTabContent()
        )}
      </div>

      {/* Edit Modal */}
      {selectedSurvey && (
        <EditSurveiModal
          isOpen={isEditModalOpen}
          kelurahanId={selectedSurvey.kelurahanId}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            fetchDetail();
          }}
        />
      )}
    </div>
  );
}
