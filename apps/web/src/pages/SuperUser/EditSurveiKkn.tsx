import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, FileText, ArrowLeft, MapPin, Database, Sprout, Users, AlertTriangle, Save, Trash2, Plus } from "lucide-react";
import api from "../../services/api";
import showToast from "../../utils/showToast";

export default function EditSurveiKkn() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isLoadingDetail, setIsLoadingDetail] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Form State
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      setIsLoadingDetail(true);
      try {
        const response = await api.get(`/survei-kkn/${id}`);
        if (response.data.success) {
          const d = response.data.data;
          
          // Ensure arrays are initialized if null
          if (!d.keyPlayers) d.keyPlayers = [];
          if (!d.karakteristikWilayah) d.karakteristikWilayah = {};
          if (!d.pemilahanSampah) d.pemilahanSampah = {};
          if (!d.bankSampahPengolahan) d.bankSampahPengolahan = {};
          if (!d.volumeSampah) d.volumeSampah = {};
          if (!d.catatanKesimpulan) d.catatanKesimpulan = {};

          // Format Date for HTML Input
          if (d.tanggalSurvei) {
            d.tanggalSurvei = new Date(d.tanggalSurvei).toISOString().split('T')[0];
          }

          setFormData(d);
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

  const handleBaseChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === 'number' ? (value === "" ? null : Number(value)) : value
    }));
  };

  const handleNestedChange = (table: string, name: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [table]: {
        ...prev[table],
        [name]: value
      }
    }));
  };

  const handleNestedNumberChange = (table: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    handleNestedChange(table, name, value === "" ? null : Number(value));
  };

  const handleNestedTextChange = (table: string, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    handleNestedChange(table, name, value);
  };

  const handleNestedBoolChange = (table: string, name: string, value: boolean) => {
    handleNestedChange(table, name, value);
  };

  const handleAddKeyPlayer = () => {
    setFormData((prev: any) => ({
      ...prev,
      keyPlayers: [...prev.keyPlayers, { nama: "", peran: "", kontak: "", keterangan: "" }]
    }));
  };

  const handleRemoveKeyPlayer = (index: number) => {
    setFormData((prev: any) => {
      const newArr = [...prev.keyPlayers];
      newArr.splice(index, 1);
      return { ...prev, keyPlayers: newArr };
    });
  };

  const handleKeyPlayerChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => {
      const newArr = [...prev.keyPlayers];
      newArr[index] = { ...newArr[index], [name]: value };
      return { ...prev, keyPlayers: newArr };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await api.put(`/survei-kkn/${id}`, formData);
      if (response.data.success) {
        showToast.success("Data survei berhasil diperbarui");
        navigate(`/superUser/data-survei-kkn/${id}`);
      }
    } catch (error: any) {
      showToast.error(error.response?.data?.message || "Gagal menyimpan data");
    } finally {
      setIsSaving(false);
    }
  };

  const renderTabContent = () => {
    if (!formData) return null;

    const kw = formData.karakteristikWilayah;
    const ps = formData.pemilahanSampah;
    const bs = formData.bankSampahPengolahan;
    const kp = formData.keyPlayers;
    const vs = formData.volumeSampah;
    const pr = formData.catatanKesimpulan;

    const InputLabel = ({ label }: { label: string }) => (
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{label}</label>
    );

    const TextInput = ({ name, value, onChange, type="text", placeholder="" }: any) => (
      <input type={type} name={name} value={value || ""} onChange={onChange} placeholder={placeholder} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-800" />
    );
    
    const TextArea = ({ name, value, onChange, placeholder="" }: any) => (
      <textarea name={name} value={value || ""} onChange={onChange} placeholder={placeholder} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-800" rows={4} />
    );

    const BoolSelect = ({ value, onChange }: { value: boolean | null | undefined, onChange: (val: boolean) => void }) => (
      <div className="relative">
        <select value={value === true ? "true" : value === false ? "false" : ""} onChange={(e) => onChange(e.target.value === "true")} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-800 appearance-none">
          <option value="" disabled>— Pilih Status —</option>
          <option value="true">Ya (Tersedia / Aktif)</option>
          <option value="false">Tidak (Belum / Kosong)</option>
        </select>
        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </div>
      </div>
    );

    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h4 className="text-lg font-extrabold text-slate-800 mb-6 flex items-center gap-2">
                  <FileText size={20} className="text-emerald-600" /> Informasi Wilayah
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                  <div><InputLabel label="Nama Kelurahan"/><TextInput name="namaKelurahan" value={formData.namaKelurahan} onChange={handleBaseChange} /></div>
                  <div><InputLabel label="Kecamatan"/><TextInput name="kecamatan" value={formData.kecamatan} onChange={handleBaseChange} /></div>
                  <div><InputLabel label="Jumlah RW"/><TextInput type="number" name="jumlahRw" value={formData.jumlahRw} onChange={handleBaseChange} /></div>
                  <div><InputLabel label="Jumlah RT"/><TextInput type="number" name="jumlahRt" value={formData.jumlahRt} onChange={handleBaseChange} /></div>
                  <div><InputLabel label="Jumlah KK"/><TextInput type="number" name="jumlahKk" value={formData.jumlahKk} onChange={handleBaseChange} /></div>
                  <div><InputLabel label="Total Rumah (Fisik)"/><TextInput type="number" name="jumlahRumahTotal" value={formData.jumlahRumahTotal} onChange={handleBaseChange} /></div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h4 className="text-lg font-extrabold text-slate-800 mb-6 flex items-center gap-2">
                  <FileText size={20} className="text-emerald-600" /> Meta Pengumpulan
                </h4>
                <div className="grid grid-cols-1 gap-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><InputLabel label="Tanggal Survei"/><TextInput type="date" name="tanggalSurvei" value={formData.tanggalSurvei} onChange={handleBaseChange} /></div>
                    <div><InputLabel label="Enumerator / PIC"/><TextInput name="enumerator" value={formData.enumerator} onChange={handleBaseChange} /></div>
                  </div>
                  <div><InputLabel label="Titik Kumpul Mahasiswa"/><TextInput name="titikKumpulMahasiswa" value={formData.titikKumpulMahasiswa} onChange={handleBaseChange} placeholder="Contoh: Kantor Kelurahan..." /></div>
                  <div><InputLabel label="Catatan Pelaksanaan"/><TextArea name="catatanData" value={formData.catatanData} onChange={handleBaseChange} placeholder="Tuliskan jika ada anomali atau hambatan..." /></div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
              <h4 className="text-lg font-extrabold text-slate-800 mb-6 flex items-center gap-2 relative z-10">
                <FileText size={20} className="text-emerald-600" /> Taksiran / Estimasi Timbulan Sampah
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <InputLabel label="Organik (Kg/Hari)"/><TextInput type="number" name="organikKgPerHari" value={vs.organikKgPerHari} onChange={(e:any) => handleNestedNumberChange("volumeSampah", e)} />
                </div>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <InputLabel label="Anorganik (Kg/Hari)"/><TextInput type="number" name="anorganikKgPerHari" value={vs.anorganikKgPerHari} onChange={(e:any) => handleNestedNumberChange("volumeSampah", e)} />
                </div>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <InputLabel label="Residu (Kg/Hari)"/><TextInput type="number" name="residuKgPerHari" value={vs.residuKgPerHari} onChange={(e:any) => handleNestedNumberChange("volumeSampah", e)} />
                </div>
                <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100">
                  <InputLabel label="Total Sampah (Kg/Hari)"/><TextInput type="number" name="totalTimbulanSampahKgPerHari" value={vs.totalTimbulanSampahKgPerHari} onChange={(e:any) => handleNestedNumberChange("volumeSampah", e)} />
                </div>
              </div>
            </div>
          </div>
        );
      case "karakter":
        return (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
             <h4 className="text-lg font-extrabold text-slate-800 mb-6 flex items-center gap-2">
                <MapPin size={20} className="text-emerald-600" /> Profil & Karakteristik Wilayah
             </h4>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div><InputLabel label="Padat Penduduk"/><BoolSelect value={kw.padatPenduduk} onChange={(val) => handleNestedBoolChange("karakteristikWilayah", "padatPenduduk", val)} /></div>
                <div><InputLabel label="Banyak Kos/Kontrakan"/><BoolSelect value={kw.banyakKosKontrakan} onChange={(val) => handleNestedBoolChange("karakteristikWilayah", "banyakKosKontrakan", val)} /></div>
                <div><InputLabel label="Banyak UMKM/Kafe"/><BoolSelect value={kw.banyakUmkmWarungKafe} onChange={(val) => handleNestedBoolChange("karakteristikWilayah", "banyakUmkmWarungKafe", val)} /></div>
                <div><InputLabel label="Dekat Kampus/Sekolah"/><BoolSelect value={kw.dekatKampusSekolah} onChange={(val) => handleNestedBoolChange("karakteristikWilayah", "dekatKampusSekolah", val)} /></div>
                <div><InputLabel label="Dekat Pasar"/><BoolSelect value={kw.pasar} onChange={(val) => handleNestedBoolChange("karakteristikWilayah", "pasar", val)} /></div>
                <div><InputLabel label="Bantaran Sungai"/><BoolSelect value={kw.bantaranSungai} onChange={(val) => handleNestedBoolChange("karakteristikWilayah", "bantaranSungai", val)} /></div>
             </div>
             
             <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div><InputLabel label="Perkiraan Jumlah Kos"/><TextInput name="perkiraanJumlahKosKontrakan" value={kw.perkiraanJumlahKosKontrakan} onChange={(e:any) => handleNestedTextChange("karakteristikWilayah", e)} placeholder="Cth: ~20 rumah" /></div>
                  <div><InputLabel label="Perkiraan Jumlah UMKM"/><TextInput name="perkiraanJumlahUmkmWarungKafe" value={kw.perkiraanJumlahUmkmWarungKafe} onChange={(e:any) => handleNestedTextChange("karakteristikWilayah", e)} placeholder="Cth: ~15 warung" /></div>
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
                    <div className="md:col-span-1"><InputLabel label="Ada Karakteristik Lain?"/><BoolSelect value={kw.karakterLainnyaFlag} onChange={(val) => handleNestedBoolChange("karakteristikWilayah", "karakterLainnyaFlag", val)} /></div>
                    <div className="md:col-span-2"><InputLabel label="Penjelasan Spesifik Karakteristik"/><TextInput name="karakterLainnyaKeterangan" value={kw.karakterLainnyaKeterangan} onChange={(e:any) => handleNestedTextChange("karakteristikWilayah", e)} placeholder="Jelaskan karakteristik lainnya..." /></div>
                  </div>
               </div>
             </div>
          </div>
        );
      case "pemilahan":
        return (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h4 className="text-lg font-extrabold text-slate-800 mb-6 flex items-center gap-2">
              <Database size={20} className="text-emerald-600" /> Data Pemilahan Sampah
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><InputLabel label="Jumlah Rumah Memilah"/><TextInput type="number" name="jumlahRumahMemilah" value={ps.jumlahRumahMemilah} onChange={(e:any) => handleNestedNumberChange("pemilahanSampah", e)} /></div>
                <div><InputLabel label="Total Jumlah Rumah di RW"/><TextInput type="number" name="totalJumlahRumahDiRw" value={ps.totalJumlahRumahDiRw} onChange={(e:any) => handleNestedNumberChange("pemilahanSampah", e)} /></div>
                <div><InputLabel label="Persentase Pemilahan (%)"/><TextInput type="number" name="persentasePemilahan" value={ps.persentasePemilahan} onChange={(e:any) => handleNestedNumberChange("pemilahanSampah", e)} /></div>
                <div><InputLabel label="Tingkat Pemilahan"/><TextInput name="tingkatPemilahan" value={ps.tingkatPemilahan} onChange={(e:any) => handleNestedTextChange("pemilahanSampah", e)} placeholder="Rendah / Sedang / Tinggi" /></div>
                <div className="col-span-1 md:col-span-2"><InputLabel label="Catatan Tambahan"/><TextArea name="catatan" value={ps.catatan} onChange={(e:any) => handleNestedTextChange("pemilahanSampah", e)} placeholder="Catatan mengenai pemilahan warga..." /></div>
            </div>
          </div>
        );
      case "bank_sampah":
        return (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
             <h4 className="text-lg font-extrabold text-slate-800 mb-6 flex items-center gap-2">
                <Sprout size={20} className="text-emerald-600" /> Bank Sampah & Pengolahan
             </h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div><InputLabel label="Bank Sampah Aktif (Unit)"/><TextInput type="number" name="bankSampahAktif" value={bs.bankSampahAktif} onChange={(e:any) => handleNestedNumberChange("bankSampahPengolahan", e)} /></div>
                <div><InputLabel label="Bank Sampah Tidak Aktif (Unit)"/><TextInput type="number" name="bankSampahTidakAktif" value={bs.bankSampahTidakAktif} onChange={(e:any) => handleNestedNumberChange("bankSampahPengolahan", e)} /></div>
                <div><InputLabel label="Jumlah Unit Komposter"/><TextInput name="jumlahUnitKomposter" value={bs.jumlahUnitKomposter} onChange={(e:any) => handleNestedTextChange("bankSampahPengolahan", e)} /></div>
                <div><InputLabel label="Jumlah Titik Maggot BSF"/><TextInput name="jumlahTitikMaggotBsf" value={bs.jumlahTitikMaggotBsf} onChange={(e:any) => handleNestedTextChange("bankSampahPengolahan", e)} /></div>
             </div>
             <h5 className="text-sm uppercase tracking-wider font-bold text-slate-400 border-b pb-2 mb-6">Aktivitas Tambahan</h5>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div><InputLabel label="Biopori Loseda"/><BoolSelect value={bs.bioporiLoseda} onChange={(val) => handleNestedBoolChange("bankSampahPengolahan", "bioporiLoseda", val)} /></div>
                <div><InputLabel label="Ecobrick / Kerajinan"/><BoolSelect value={bs.ecobrickKerajinanDaurUlang} onChange={(val) => handleNestedBoolChange("bankSampahPengolahan", "ecobrickKerajinanDaurUlang", val)} /></div>
                <div><InputLabel label="Buruan Sae"/><BoolSelect value={bs.buruanSae} onChange={(val) => handleNestedBoolChange("bankSampahPengolahan", "buruanSae", val)} /></div>
                <div><InputLabel label="Pengepul Mitra"/><BoolSelect value={bs.pengepulMitraDaurUlang} onChange={(val) => handleNestedBoolChange("bankSampahPengolahan", "pengepulMitraDaurUlang", val)} /></div>
                <div><InputLabel label="Digitalisasi Data"/><BoolSelect value={bs.digitalisasiData} onChange={(val) => handleNestedBoolChange("bankSampahPengolahan", "digitalisasiData", val)} /></div>
                <div><InputLabel label="Keterangan Aktivitas Lainnya"/><TextInput name="aktivitasLainnyaKeterangan" value={bs.aktivitasLainnyaKeterangan} onChange={(e:any) => handleNestedTextChange("bankSampahPengolahan", e)} placeholder="Contoh: Ternak lele terintegrasi..." /></div>
             </div>
          </div>
        );
      case "key_player":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-100 text-emerald-700 p-2 rounded-xl"><Users size={20} /></div>
                  <div>
                    <h3 className="font-extrabold text-slate-800">Aktor Penggerak / Key Players</h3>
                    <p className="text-sm text-slate-500 font-medium">Data penggerak kebersihan di wilayah ini.</p>
                  </div>
                </div>
                <button onClick={handleAddKeyPlayer} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-sm">
                    <Plus size={18} /> Tambah Aktor
                </button>
            </div>
            {kp.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-slate-200 border-dashed text-center">
                    <span className="text-slate-500 font-medium">Belum ada aktor penggerak yang didata. Klik tombol di atas untuk menambah.</span>
                </div>
            ) : (
                kp.map((player: any, idx: number) => (
                <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative group transition-all hover:border-emerald-300">
                    <button onClick={() => handleRemoveKeyPlayer(idx)} className="absolute top-6 right-6 p-2 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-colors" title="Hapus Aktor">
                        <Trash2 size={18} />
                    </button>
                    <h4 className="text-sm uppercase tracking-wider font-extrabold text-emerald-600 border-b border-slate-100 pb-3 mb-5">
                      Aktor #{idx + 1}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div><InputLabel label="Nama Lengkap"/><TextInput name="nama" value={player.nama} onChange={(e:any) => handleKeyPlayerChange(idx, e)} placeholder="Contoh: Bpk. Haryanto" /></div>
                        <div><InputLabel label="Peran (Misal: Ketua RW)"/><TextInput name="peran" value={player.peran} onChange={(e:any) => handleKeyPlayerChange(idx, e)} placeholder="Ketua RW / Kader..." /></div>
                        <div><InputLabel label="Kontak (Opsional)"/><TextInput name="kontak" value={player.kontak} onChange={(e:any) => handleKeyPlayerChange(idx, e)} placeholder="081234..." /></div>
                        <div><InputLabel label="Keterangan Lainnya"/><TextArea name="keterangan" value={player.keterangan} onChange={(e:any) => handleKeyPlayerChange(idx, e)} placeholder="Keterangan pengaruh aktor di masyarakat..." /></div>
                    </div>
                </div>
                ))
            )}
          </div>
        );
      case "potensi_risiko":
        return (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h4 className="text-lg font-extrabold text-slate-800 mb-6 flex items-center gap-2">
                <AlertTriangle size={20} className="text-amber-500" /> Potensi, Risiko, & Kesimpulan
            </h4>
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100">
                  <InputLabel label="Kelebihan & Potensi Wilayah"/>
                  <TextArea name="potensi" value={pr.potensi} onChange={(e:any) => handleNestedTextChange("catatanKesimpulan", e)} placeholder="Jelaskan hal-hal positif yang bisa dioptimalkan..." />
              </div>
              <div className="bg-rose-50/50 p-6 rounded-2xl border border-rose-100">
                  <InputLabel label="Kelemahan & Tantangan"/>
                  <TextArea name="kelemahan" value={pr.kelemahan} onChange={(e:any) => handleNestedTextChange("catatanKesimpulan", e)} placeholder="Jelaskan kendala atau kelemahan yang dihadapi..." />
              </div>
              <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                  <InputLabel label="Peluang & Ide Inovasi"/>
                  <TextArea name="peluang" value={pr.peluang} onChange={(e:any) => handleNestedTextChange("catatanKesimpulan", e)} placeholder="Jelaskan peluang yang bisa diimplementasikan ke depannya..." />
              </div>
              <div className="bg-rose-50/50 p-6 rounded-2xl border border-rose-100">
                  <InputLabel label="Ancaman & Risiko Eksternal"/>
                  <TextArea name="ancaman" value={pr.ancaman} onChange={(e:any) => handleNestedTextChange("catatanKesimpulan", e)} placeholder="Jelaskan ancaman dari pihak eksternal..." />
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mt-4">
                  <InputLabel label="Rekomendasi / Solusi Akhir (Kesimpulan)"/>
                  <TextArea name="rekomendasi" value={pr.rekomendasi} onChange={(e:any) => handleNestedTextChange("catatanKesimpulan", e)} placeholder="Jabarkan rekomendasi langkah selanjutnya dari temuan survei ini..." />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (isLoadingDetail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 animate-spin text-[#009966]" size={40} />
          <p className="text-slate-500 font-medium">Memuat formulir edit survei...</p>
        </div>
      </div>
    );
  }

  if (!formData || !formData.kelurahanId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-4 text-rose-500" size={48} />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Data Tidak Ditemukan</h2>
          <button onClick={() => navigate("/superUser/data-survei-kkn")} className="text-[#009966] font-medium hover:underline">
            Kembali ke Daftar Survei
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Header Section */}
        <div className="mb-8">
          <button 
            onClick={() => navigate("/superUser/data-survei-kkn")} 
            className="flex items-center text-slate-500 hover:text-slate-800 transition-colors mb-4 text-sm font-medium"
          >
            <ArrowLeft className="mr-2" size={16} />
            Kembali ke Data Survei
          </button>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-amber-100 text-amber-700 p-2 rounded-xl">
                  <FileText size={24} />
                </div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Edit Survei: {formData.namaKelurahan}</h1>
              </div>
              <p className="text-slate-500 font-medium">Lakukan perubahan pada data survei dan jangan lupa untuk menyimpannya.</p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/superUser/data-survei-kkn/${id}`)}
                className="px-4 py-2.5 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#009966] text-white rounded-xl font-bold hover:bg-[#007f55] transition-all shadow-sm shadow-[#009966]/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 mb-8 overflow-x-auto custom-scrollbar">
          <div className="flex gap-2 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
                    isActive 
                    ? "bg-[#009966] text-white shadow-sm shadow-[#009966]/20" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {renderTabContent()}
        </div>

      </div>
    </div>
  );
}
