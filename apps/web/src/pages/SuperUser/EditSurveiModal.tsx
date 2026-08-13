import React, { useState, useEffect } from "react";
import {
  X,
  Save,
  Loader2,
  FileText,
  MapPin,
  Database,
  Sprout,
  Users,
  AlertTriangle,
  Plus,
  Trash2,
  Scale,
} from "lucide-react";
import api from "../../services/api";
import showToast from "../../utils/showToast";

interface EditSurveiModalProps {
  kelurahanId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditSurveiModal: React.FC<EditSurveiModalProps> = ({
  kelurahanId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<string>("umum");
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // Form State
  const [namaKelurahan, setNamaKelurahan] = useState("");
  const [kecamatan, setKecamatan] = useState("");
  const [jumlahRw, setJumlahRw] = useState<number | string>("");
  const [jumlahRt, setJumlahRt] = useState<number | string>("");
  const [jumlahKk, setJumlahKk] = useState<number | string>("");
  const [jumlahRumahTotal, setJumlahRumahTotal] = useState<number | string>("");
  const [tanggalSurvei, setTanggalSurvei] = useState("");
  const [enumerator, setEnumerator] = useState("");
  const [titikKumpulMahasiswa, setTitikKumpulMahasiswa] = useState("");
  const [catatanData, setCatatanData] = useState("");

  // Karakteristik
  const [karakteristik, setKarakteristik] = useState({
    padatPenduduk: false,
    banyakKosKontrakan: false,
    banyakUmkmWarungKafe: false,
    dekatKampusSekolah: false,
    pasar: false,
    bantaranSungai: false,
    karakterLainnyaFlag: false,
    karakterLainnyaKeterangan: "",
    perkiraanJumlahKosKontrakan: "",
    perkiraanJumlahUmkmWarungKafe: "",
  });

  // Pemilahan
  const [pemilahan, setPemilahan] = useState({
    jumlahRumahMemilah: "" as number | string,
    totalJumlahRumahDiRw: "" as number | string,
    persentasePemilahan: "" as number | string,
    tingkatPemilahan: "",
    catatan: "",
  });

  // Bank Sampah & Pengolahan
  const [bankSampah, setBankSampah] = useState({
    bankSampahAktif: "" as number | string,
    bankSampahTidakAktif: "" as number | string,
    jumlahUnitKomposter: "",
    jumlahTitikMaggotBsf: "",
    bioporiLoseda: false,
    ecobrickKerajinanDaurUlang: false,
    buruanSae: false,
    pengepulMitraDaurUlang: false,
    digitalisasiData: false,
    aktivitasLainnyaKeterangan: "",
  });

  // Volume Sampah
  const [volume, setVolume] = useState({
    organikKgPerHari: "" as number | string,
    anorganikKgPerHari: "" as number | string,
    residuKgPerHari: "" as number | string,
    totalVolumeKgPerHari: "" as number | string,
    catatan: "",
  });

  // Key Players
  const [keyPlayers, setKeyPlayers] = useState<
    { jenisAktor: string; nama: string; kontak: string; peran: string }[]
  >([]);

  // Kesimpulan
  const [kesimpulan, setKesimpulan] = useState({
    prioritasIntervensi: "",
    catatanTambahanRisikoSosial: "",
  });

  useEffect(() => {
    if (isOpen && kelurahanId) {
      loadSurveyDetail(kelurahanId);
    }
  }, [isOpen, kelurahanId]);

  const loadSurveyDetail = async (id: number) => {
    setLoading(true);
    try {
      const res = await api.get(`/survei-kkn/${id}`);
      if (res.data?.success && res.data?.data) {
        const d = res.data.data;
        setNamaKelurahan(d.namaKelurahan || "");
        setKecamatan(d.kecamatan || "");
        setJumlahRw(d.jumlahRw ?? "");
        setJumlahRt(d.jumlahRt ?? "");
        setJumlahKk(d.jumlahKk ?? "");
        setJumlahRumahTotal(d.jumlahRumahTotal ?? "");
        setTanggalSurvei(
          d.tanggalSurvei ? new Date(d.tanggalSurvei).toISOString().split("T")[0] : ""
        );
        setEnumerator(d.enumerator || "");
        setTitikKumpulMahasiswa(d.titikKumpulMahasiswa || "");
        setCatatanData(d.catatanData || "");

        const kw = d.karakteristikWilayah || {};
        setKarakteristik({
          padatPenduduk: Boolean(kw.padatPenduduk),
          banyakKosKontrakan: Boolean(kw.banyakKosKontrakan),
          banyakUmkmWarungKafe: Boolean(kw.banyakUmkmWarungKafe),
          dekatKampusSekolah: Boolean(kw.dekatKampusSekolah),
          pasar: Boolean(kw.pasar),
          bantaranSungai: Boolean(kw.bantaranSungai),
          karakterLainnyaFlag: Boolean(kw.karakterLainnyaFlag),
          karakterLainnyaKeterangan: kw.karakterLainnyaKeterangan || "",
          perkiraanJumlahKosKontrakan: kw.perkiraanJumlahKosKontrakan || "",
          perkiraanJumlahUmkmWarungKafe: kw.perkiraanJumlahUmkmWarungKafe || "",
        });

        const ps = d.pemilahanSampah || {};
        setPemilahan({
          jumlahRumahMemilah: ps.jumlahRumahMemilah ?? "",
          totalJumlahRumahDiRw: ps.totalJumlahRumahDiRw ?? "",
          persentasePemilahan:
            ps.persentasePemilahan !== null && ps.persentasePemilahan !== undefined
              ? (Number(ps.persentasePemilahan) * 100).toFixed(1)
              : "",
          tingkatPemilahan: ps.tingkatPemilahan || "",
          catatan: ps.catatan || "",
        });

        const bs = d.bankSampahPengolahan || {};
        setBankSampah({
          bankSampahAktif: bs.bankSampahAktif ?? "",
          bankSampahTidakAktif: bs.bankSampahTidakAktif ?? "",
          jumlahUnitKomposter: bs.jumlahUnitKomposter || "",
          jumlahTitikMaggotBsf: bs.jumlahTitikMaggotBsf || "",
          bioporiLoseda: Boolean(bs.bioporiLoseda),
          ecobrickKerajinanDaurUlang: Boolean(bs.ecobrickKerajinanDaurUlang),
          buruanSae: Boolean(bs.buruanSae),
          pengepulMitraDaurUlang: Boolean(bs.pengepulMitraDaurUlang),
          digitalisasiData: Boolean(bs.digitalisasiData),
          aktivitasLainnyaKeterangan: bs.aktivitasLainnyaKeterangan || "",
        });

        const vs = d.volumeSampah || {};
        setVolume({
          organikKgPerHari: vs.organikKgPerHari ?? "",
          anorganikKgPerHari: vs.anorganikKgPerHari ?? "",
          residuKgPerHari: vs.residuKgPerHari ?? "",
          totalVolumeKgPerHari: vs.totalVolumeKgPerHari ?? "",
          catatan: vs.catatan || "",
        });

        setKeyPlayers(
          Array.isArray(d.keyPlayers)
            ? d.keyPlayers.map((kp: any) => ({
                jenisAktor: kp.jenisAktor || "",
                nama: kp.nama || "",
                kontak: kp.kontak || "",
                peran: kp.peran || "",
              }))
            : []
        );

        const ck = d.catatanKesimpulan || {};
        setKesimpulan({
          prioritasIntervensi: ck.prioritasIntervensi || "",
          catatanTambahanRisikoSosial: ck.catatanTambahanRisikoSosial || "",
        });
      }
    } catch (err: any) {
      console.error(err);
      showToast.error("Gagal memuat detail survei");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kelurahanId) return;

    setSaving(true);
    try {
      // Hitung persentase desimal (misal 35% -> 0.35)
      let pctDecimal: number | null = null;
      if (pemilahan.persentasePemilahan !== "" && pemilahan.persentasePemilahan !== null) {
        pctDecimal = Number(pemilahan.persentasePemilahan) / 100;
      }

      const payload = {
        namaKelurahan,
        kecamatan,
        jumlahRw,
        jumlahRt,
        jumlahKk,
        jumlahRumahTotal,
        tanggalSurvei: tanggalSurvei || null,
        enumerator,
        titikKumpulMahasiswa,
        catatanData,
        karakteristikWilayah: karakteristik,
        pemilahanSampah: {
          jumlahRumahMemilah: pemilahan.jumlahRumahMemilah,
          totalJumlahRumahDiRw: pemilahan.totalJumlahRumahDiRw,
          persentasePemilahan: pctDecimal,
          tingkatPemilahan: pemilahan.tingkatPemilahan,
          catatan: pemilahan.catatan,
        },
        bankSampahPengolahan: bankSampah,
        volumeSampah: volume,
        catatanKesimpulan: kesimpulan,
        keyPlayers,
      };

      const res = await api.put(`/survei-kkn/${kelurahanId}`, payload);
      if (res.data?.success) {
        showToast.success("Data survei berhasil diperbarui!");
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      console.error(err);
      showToast.error(err.response?.data?.message || "Gagal menyimpan perubahan survei");
    } finally {
      setSaving(false);
    }
  };

  const addKeyPlayer = () => {
    setKeyPlayers([
      ...keyPlayers,
      { jenisAktor: "Tokoh Masyarakat", nama: "", kontak: "", peran: "" },
    ]);
  };

  const removeKeyPlayer = (index: number) => {
    setKeyPlayers(keyPlayers.filter((_, i) => i !== index));
  };

  const updateKeyPlayer = (index: number, field: string, value: string) => {
    const updated = [...keyPlayers];
    updated[index] = { ...updated[index], [field]: value };
    setKeyPlayers(updated);
  };

  if (!isOpen) return null;

  const tabs = [
    { id: "umum", label: "Informasi Umum", icon: FileText },
    { id: "karakter", label: "Karakteristik Wilayah", icon: MapPin },
    { id: "pemilahan", label: "Pemilahan Sampah", icon: Database },
    { id: "bank_sampah", label: "Bank Sampah & Fasilitas", icon: Sprout },
    { id: "volume", label: "Volume Sampah", icon: Scale },
    { id: "key_player", label: "Aktor (Key Players)", icon: Users },
    { id: "kesimpulan", label: "Kesimpulan & Risiko", icon: AlertTriangle },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-lg font-black text-slate-800">
              Edit Data Hasil Survei: Kel. {namaKelurahan || kelurahanId}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Ubah data baseline hasil survei lapangan untuk evaluasi dampak program KKN.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 overflow-x-auto px-6 bg-white gap-1 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? "border-emerald-600 text-emerald-700 bg-emerald-50/50"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Icon size={14} className={isActive ? "text-emerald-600" : "text-slate-400"} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="animate-spin text-emerald-600" size={32} />
              <p className="text-xs font-bold text-slate-500">Memuat data survei...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: INFORMASI UMUM */}
              {activeTab === "umum" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nama Kelurahan</label>
                    <input
                      type="text"
                      value={namaKelurahan}
                      onChange={(e) => setNamaKelurahan(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kecamatan</label>
                    <input
                      type="text"
                      value={kecamatan}
                      onChange={(e) => setKecamatan(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Jumlah RW</label>
                    <input
                      type="number"
                      value={jumlahRw}
                      onChange={(e) => setJumlahRw(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Jumlah RT</label>
                    <input
                      type="number"
                      value={jumlahRt}
                      onChange={(e) => setJumlahRt(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Jumlah KK</label>
                    <input
                      type="number"
                      value={jumlahKk}
                      onChange={(e) => setJumlahKk(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Jumlah Rumah Total</label>
                    <input
                      type="number"
                      value={jumlahRumahTotal}
                      onChange={(e) => setJumlahRumahTotal(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tanggal Survei</label>
                    <input
                      type="date"
                      value={tanggalSurvei}
                      onChange={(e) => setTanggalSurvei(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Enumerator (Petugas Survei)</label>
                    <input
                      type="text"
                      value={enumerator}
                      onChange={(e) => setEnumerator(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Titik Kumpul Mahasiswa</label>
                    <input
                      type="text"
                      value={titikKumpulMahasiswa}
                      onChange={(e) => setTitikKumpulMahasiswa(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Catatan Khusus</label>
                    <textarea
                      rows={3}
                      value={catatanData}
                      onChange={(e) => setCatatanData(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: KARAKTERISTIK WILAYAH */}
              {activeTab === "karakter" && (
                <div className="space-y-4 text-xs">
                  <h4 className="font-bold text-slate-700 border-b pb-2">Karakteristik & Kondisi Lingkungan</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { key: "padatPenduduk", label: "Kawasan Padat Penduduk" },
                      { key: "banyakKosKontrakan", label: "Banyak Kos-Kosan / Kontrakan" },
                      { key: "banyakUmkmWarungKafe", label: "Banyak UMKM / Warung / Kafe" },
                      { key: "dekatKampusSekolah", label: "Dekat Kampus / Sekolah" },
                      { key: "pasar", label: "Terdapat Pasar Tradisional / Modern" },
                      { key: "bantaranSungai", label: "Area Bantaran Sungai" },
                      { key: "karakterLainnyaFlag", label: "Karakteristik Khusus Lainnya" },
                    ].map((item) => (
                      <label
                        key={item.key}
                        className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition"
                      >
                        <input
                          type="checkbox"
                          checked={(karakteristik as any)[item.key]}
                          onChange={(e) =>
                            setKarakteristik({
                              ...karakteristik,
                              [item.key]: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                        />
                        <span className="font-bold text-slate-800">{item.label}</span>
                      </label>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Perkiraan Jumlah Kos / Kontrakan
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: ~50 unit atau Tinggi"
                        value={karakteristik.perkiraanJumlahKosKontrakan}
                        onChange={(e) =>
                          setKarakteristik({
                            ...karakteristik,
                            perkiraanJumlahKosKontrakan: e.target.value,
                          })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Perkiraan Jumlah UMKM / Warung
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: ~30 warung"
                        value={karakteristik.perkiraanJumlahUmkmWarungKafe}
                        onChange={(e) =>
                          setKarakteristik({
                            ...karakteristik,
                            perkiraanJumlahUmkmWarungKafe: e.target.value,
                          })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                      />
                    </div>
                    {karakteristik.karakterLainnyaFlag && (
                      <div className="md:col-span-2">
                        <label className="block font-bold text-slate-700 mb-1">
                          Keterangan Karakteristik Lainnya
                        </label>
                        <input
                          type="text"
                          value={karakteristik.karakterLainnyaKeterangan}
                          onChange={(e) =>
                            setKarakteristik({
                              ...karakteristik,
                              karakterLainnyaKeterangan: e.target.value,
                            })
                          }
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: PEMILAHAN SAMPAH */}
              {activeTab === "pemilahan" && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Jumlah Rumah Memilah</label>
                      <input
                        type="number"
                        value={pemilahan.jumlahRumahMemilah}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPemilahan((prev) => {
                            const jml = Number(val);
                            const tot = Number(prev.totalJumlahRumahDiRw);
                            const pct = tot > 0 && val !== "" ? ((jml / tot) * 100).toFixed(1) : prev.persentasePemilahan;
                            return { ...prev, jumlahRumahMemilah: val, persentasePemilahan: pct };
                          });
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Total Rumah (Sampel Wilayah)</label>
                      <input
                        type="number"
                        value={pemilahan.totalJumlahRumahDiRw}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPemilahan((prev) => {
                            const tot = Number(val);
                            const jml = Number(prev.jumlahRumahMemilah);
                            const pct = tot > 0 && prev.jumlahRumahMemilah !== "" ? ((jml / tot) * 100).toFixed(1) : prev.persentasePemilahan;
                            return { ...prev, totalJumlahRumahDiRw: val, persentasePemilahan: pct };
                          });
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Persentase Pemilahan (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={pemilahan.persentasePemilahan}
                        onChange={(e) =>
                          setPemilahan({ ...pemilahan, persentasePemilahan: e.target.value })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Tingkat Pemilahan (Kualitatif)</label>
                      <select
                        value={pemilahan.tingkatPemilahan}
                        onChange={(e) =>
                          setPemilahan({ ...pemilahan, tingkatPemilahan: e.target.value })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                      >
                        <option value="">Pilih Tingkat Pemilahan...</option>
                        <option value="Sangat Rendah (< 20%)">Sangat Rendah (&lt; 20%)</option>
                        <option value="Rendah (20% - 40%)">Rendah (20% - 40%)</option>
                        <option value="Sedang (40% - 60%)">Sedang (40% - 60%)</option>
                        <option value="Tinggi (60% - 80%)">Tinggi (60% - 80%)</option>
                        <option value="Sangat Tinggi (>= 80%)">Sangat Tinggi (&ge; 80%)</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block font-bold text-slate-700 mb-1">Catatan Pemilahan Sampah</label>
                      <textarea
                        rows={2}
                        value={pemilahan.catatan}
                        onChange={(e) => setPemilahan({ ...pemilahan, catatan: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none leading-relaxed"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: BANK SAMPAH & FASILITAS */}
              {activeTab === "bank_sampah" && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Jumlah Bank Sampah Aktif</label>
                      <input
                        type="number"
                        value={bankSampah.bankSampahAktif}
                        onChange={(e) =>
                          setBankSampah({ ...bankSampah, bankSampahAktif: e.target.value })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Jumlah Bank Sampah Tidak Aktif</label>
                      <input
                        type="number"
                        value={bankSampah.bankSampahTidakAktif}
                        onChange={(e) =>
                          setBankSampah({ ...bankSampah, bankSampahTidakAktif: e.target.value })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Unit Komposter</label>
                      <input
                        type="text"
                        placeholder="Contoh: 5 unit / Ada"
                        value={bankSampah.jumlahUnitKomposter}
                        onChange={(e) =>
                          setBankSampah({ ...bankSampah, jumlahUnitKomposter: e.target.value })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Titik Maggot / BSF</label>
                      <input
                        type="text"
                        placeholder="Contoh: 2 titik / Ada"
                        value={bankSampah.jumlahTitikMaggotBsf}
                        onChange={(e) =>
                          setBankSampah({ ...bankSampah, jumlahTitikMaggotBsf: e.target.value })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  <h4 className="font-bold text-slate-700 border-b pb-2 pt-2">Program Pemanfaatan / Fasilitas Terintegrasi</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { key: "bioporiLoseda", label: "Biopori / Loseda" },
                      { key: "ecobrickKerajinanDaurUlang", label: "Ecobrick / Kerajinan Daur Ulang" },
                      { key: "buruanSae", label: "Buruan Sae / Kebun Warga" },
                      { key: "pengepulMitraDaurUlang", label: "Pengepul Mitra Daur Ulang" },
                      { key: "digitalisasiData", label: "Digitalisasi Data (TrashCare / Aplikasi)" },
                    ].map((item) => (
                      <label
                        key={item.key}
                        className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition"
                      >
                        <input
                          type="checkbox"
                          checked={(bankSampah as any)[item.key]}
                          onChange={(e) =>
                            setBankSampah({
                              ...bankSampah,
                              [item.key]: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                        />
                        <span className="font-bold text-slate-800">{item.label}</span>
                      </label>
                    ))}
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Keterangan Aktivitas Lainnya</label>
                    <input
                      type="text"
                      value={bankSampah.aktivitasLainnyaKeterangan}
                      onChange={(e) =>
                        setBankSampah({ ...bankSampah, aktivitasLainnyaKeterangan: e.target.value })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* TAB 5: VOLUME SAMPAH */}
              {activeTab === "volume" && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-bold text-emerald-700 mb-1">Organik (Kg/Hari)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={volume.organikKgPerHari}
                        onChange={(e) => {
                          const val = e.target.value;
                          setVolume((prev) => {
                            const org = Number(val) || 0;
                            const anorg = Number(prev.anorganikKgPerHari) || 0;
                            const res = Number(prev.residuKgPerHari) || 0;
                            return { ...prev, organikKgPerHari: val, totalVolumeKgPerHari: (org + anorg + res).toFixed(2) };
                          });
                        }}
                        className="w-full bg-emerald-50/40 border border-emerald-200 rounded-xl px-3 py-2 text-emerald-900 font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-blue-700 mb-1">Anorganik (Kg/Hari)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={volume.anorganikKgPerHari}
                        onChange={(e) => {
                          const val = e.target.value;
                          setVolume((prev) => {
                            const org = Number(prev.organikKgPerHari) || 0;
                            const anorg = Number(val) || 0;
                            const res = Number(prev.residuKgPerHari) || 0;
                            return { ...prev, anorganikKgPerHari: val, totalVolumeKgPerHari: (org + anorg + res).toFixed(2) };
                          });
                        }}
                        className="w-full bg-blue-50/40 border border-blue-200 rounded-xl px-3 py-2 text-blue-900 font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-rose-700 mb-1">Residu (Kg/Hari)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={volume.residuKgPerHari}
                        onChange={(e) => {
                          const val = e.target.value;
                          setVolume((prev) => {
                            const org = Number(prev.organikKgPerHari) || 0;
                            const anorg = Number(prev.anorganikKgPerHari) || 0;
                            const res = Number(val) || 0;
                            return { ...prev, residuKgPerHari: val, totalVolumeKgPerHari: (org + anorg + res).toFixed(2) };
                          });
                        }}
                        className="w-full bg-rose-50/40 border border-rose-200 rounded-xl px-3 py-2 text-rose-900 font-bold focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block font-bold text-slate-700 mb-1">Total Volume Sampah (Kg/Hari)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={volume.totalVolumeKgPerHari}
                        onChange={(e) =>
                          setVolume({ ...volume, totalVolumeKgPerHari: e.target.value })
                        }
                        className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-black focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block font-bold text-slate-700 mb-1">Catatan Volume Sampah</label>
                      <textarea
                        rows={2}
                        value={volume.catatan}
                        onChange={(e) => setVolume({ ...volume, catatan: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none leading-relaxed"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: KEY PLAYERS */}
              {activeTab === "key_player" && (
                <div className="space-y-4 text-xs">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h4 className="font-bold text-slate-700">Daftar Aktor / Tokoh Penggerak Sampah</h4>
                    <button
                      type="button"
                      onClick={addKeyPlayer}
                      className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-100 transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={14} /> Tambah Aktor
                    </button>
                  </div>

                  {keyPlayers.length === 0 ? (
                    <p className="text-slate-400 italic text-center py-6">
                      Belum ada aktor terdaftar. Klik "Tambah Aktor" untuk memasukkan data.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {keyPlayers.map((kp, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-2 items-center relative"
                        >
                          <div>
                            <label className="block font-bold text-slate-500 text-[10px] uppercase mb-0.5">
                              Jenis Aktor
                            </label>
                            <input
                              type="text"
                              placeholder="Ketua RW / Pengelola..."
                              value={kp.jenisAktor}
                              onChange={(e) => updateKeyPlayer(idx, "jenisAktor", e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 outline-none focus:border-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="block font-bold text-slate-500 text-[10px] uppercase mb-0.5">
                              Nama
                            </label>
                            <input
                              type="text"
                              placeholder="Nama lengkap"
                              value={kp.nama}
                              onChange={(e) => updateKeyPlayer(idx, "nama", e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 outline-none focus:border-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="block font-bold text-slate-500 text-[10px] uppercase mb-0.5">
                              Kontak / No HP
                            </label>
                            <input
                              type="text"
                              placeholder="0812..."
                              value={kp.kontak}
                              onChange={(e) => updateKeyPlayer(idx, "kontak", e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 outline-none focus:border-emerald-500"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <label className="block font-bold text-slate-500 text-[10px] uppercase mb-0.5">
                                Peran / Tugas
                              </label>
                              <input
                                type="text"
                                placeholder="Peran"
                                value={kp.peran}
                                onChange={(e) => updateKeyPlayer(idx, "peran", e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 outline-none focus:border-emerald-500"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeKeyPlayer(idx)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition mt-3"
                              title="Hapus Aktor"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 7: KESIMPULAN & RISIKO */}
              {activeTab === "kesimpulan" && (
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Prioritas Intervensi Program KKN
                    </label>
                    <textarea
                      rows={3}
                      value={kesimpulan.prioritasIntervensi}
                      onChange={(e) =>
                        setKesimpulan({ ...kesimpulan, prioritasIntervensi: e.target.value })
                      }
                      placeholder="Contoh: Edukasi pemilahan anorganik di kos-kosan, pengadaan loseda di RW 03..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none leading-relaxed"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Catatan Tambahan & Risiko Sosial
                    </label>
                    <textarea
                      rows={3}
                      value={kesimpulan.catatanTambahanRisikoSosial}
                      onChange={(e) =>
                        setKesimpulan({
                          ...kesimpulan,
                          catatanTambahanRisikoSosial: e.target.value,
                        })
                      }
                      placeholder="Catatan kendala sosial, partisipasi masyarakat, atau risiko penolakan..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none leading-relaxed"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving || loading}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition shadow-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Simpan Perubahan Survei
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSurveiModal;
