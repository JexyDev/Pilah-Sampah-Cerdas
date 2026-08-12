import api from "./api";

/** Interface untuk data baseline (dari SurveiKelurahan) */
export interface BaselineData {
  kelurahanId: number;
  namaKelurahan: string;
  kecamatan: string | null;
  jumlahRw: number | null;
  jumlahRt: number | null;
  tanggalSurvei: string | null;
  jumlahKk: number | null;
  jumlahRumahTotal: number | null;
  enumerator: string | null;
  statusValidasi: string;
  catatanValidasi: string | null;
  validasiDpl: { id: string; name: string } | null;
  pemilahanSampah: {
    jumlahRumahMemilah: number | null;
    totalJumlahRumahDiRw: number | null;
    persentasePemilahan: number | null;
    tingkatPemilahan: string | null;
    catatan: string | null;
  } | null;
  volumeSampah: {
    organikKgPerHari: number | null;
    anorganikKgPerHari: number | null;
    residuKgPerHari: number | null;
    totalVolumeKgPerHari: number | null;
    catatan: string | null;
  } | null;
  bankSampahPengolahan: {
    bankSampahAktif: number | null;
    bankSampahTidakAktif: number | null;
    jumlahUnitKomposter: string | null;
    jumlahTitikMaggotBsf: string | null;
  } | null;
  karakteristikWilayah: {
    padatPenduduk: boolean | null;
    banyakKosKontrakan: boolean | null;
    banyakUmkmWarungKafe: boolean | null;
    dekatKampusSekolah: boolean | null;
  } | null;
  catatanKesimpulan: {
    prioritasIntervensi: string | null;
    catatanTambahanRisikoSosial: string | null;
  } | null;
}

/** Interface untuk data endline */
export interface EndlineData {
  kelurahanId: number;
  namaKelurahan: string;
  kecamatan: string | null;
  tanggalSurvei: string | null;
  enumerator: string | null;
  statusValidasi: string;
  catatanValidasi: string | null;
  validasiDpl: { id: string; name: string } | null;
  pemilahanSampah: BaselineData["pemilahanSampah"];
  volumeSampah: BaselineData["volumeSampah"];
  bankSampahPengolahan: BaselineData["bankSampahPengolahan"];
  catatanKesimpulan: BaselineData["catatanKesimpulan"];
}

/** Interface untuk data komparasi dampak per kelurahan */
export interface KomparasiData {
  kelurahanId: number;
  namaKelurahan: string;
  kecamatan: string | null;
  hasEndline: boolean;
  pemilahan: { baseline: number | null; endline: number | null; delta: number | null };
  volumeSampah: { baseline: number | null; endline: number | null; delta: number | null };
  bankSampahAktif: { baseline: number | null; endline: number | null; delta: number | null };
}

/** Service untuk memanggil endpoint evaluasi dampak KKN */
export const evaluasiDampakApiService = {
  /** Mengambil data baseline (survei awal) */
  getBaseline: async (): Promise<BaselineData[]> => {
    try {
      const res = await api.get("/evaluasi-dampak/baseline");
      if (res.data.success && Array.isArray(res.data.data)) return res.data.data;
      return [];
    } catch {
      return [];
    }
  },

  /** Memvalidasi/revisi data baseline */
  validateBaseline: async (
    kelurahanId: number,
    status: "VALID" | "REVISI",
    catatan?: string
  ) => {
    const res = await api.put(`/evaluasi-dampak/baseline/${kelurahanId}/validate`, {
      status,
      catatan,
    });
    return res.data;
  },

  /** Mengambil data endline (survei akhir) */
  getEndline: async (): Promise<EndlineData[]> => {
    try {
      const res = await api.get("/evaluasi-dampak/endline");
      if (res.data.success && Array.isArray(res.data.data)) return res.data.data;
      return [];
    } catch {
      return [];
    }
  },

  /** Memvalidasi/revisi data endline */
  validateEndline: async (
    kelurahanId: number,
    status: "VALID" | "REVISI",
    catatan?: string
  ) => {
    const res = await api.put(`/evaluasi-dampak/endline/${kelurahanId}/validate`, {
      status,
      catatan,
    });
    return res.data;
  },

  /** Mengambil data komparasi dampak (baseline vs endline) */
  getKomparasi: async (): Promise<KomparasiData[]> => {
    try {
      const res = await api.get("/evaluasi-dampak/komparasi");
      if (res.data.success && Array.isArray(res.data.data)) return res.data.data;
      return [];
    } catch {
      return [];
    }
  },
};
