/**
 * Acuan Timeline Resmi KKN UNIKOM 2026 - Kecamatan Coblong
 * Berdasarkan dokumen: Tabel_Acuan_Timeline_KKN_UNIKOM_Coblong_2026.xlsx
 * Tema: "Sampah Terdata, Lingkungan Tertata"
 * Pra-Kegiatan: 1 Juli - 12 Agustus 2026 | Penerjunan: 12 Agustus - 31 Oktober 2026
 */

export interface TimelineKknItem {
  id: string;
  tahapMinggu: string;
  tanggal: string;
  fase: string;
  kegiatanUtama: string;
  outputTarget: string;
  picKeterangan: string;
  statusPelaksanaan?: "SELESAI" | "SEDANG_BERJALAN" | "BELUM_DIMULAI";
}

export const TIMELINE_KKN_HEADER = {
  judul: "TIMELINE KEGIATAN KKN UNIKOM 2026 - KECAMATAN COBLONG",
  tema: "Sampah Terdata, Lingkungan Tertata",
  praKegiatan: "1 Juli – 12 Agustus 2026",
  penerjunan: "12 Agustus – 31 Oktober 2026",
  totalPekan: 12,
  wilayah: "Kecamatan Coblong (6 Kelurahan: Dago, Lebak Gede, Lebak Siliwangi, Sadang Serang, Sekeloa, Cipaganti)",
};

export const TIMELINE_KKN_DATA: TimelineKknItem[] = [
  {
    id: "tl-1",
    tahapMinggu: "Pra-Kegiatan",
    tanggal: "1 Juli 2026",
    fase: "Pra-Kegiatan",
    kegiatanUtama: "Sosialisasi & Pembukaan Kegiatan KKN di Lantai 17",
    outputTarget: "Civitas akademika memahami program & kegiatan resmi dibuka secara internal",
    picKeterangan: "Wakil Rektor 1 (WR 1) UNIKOM",
    statusPelaksanaan: "SELESAI",
  },
  {
    id: "tl-2",
    tahapMinggu: "Pra-Kegiatan",
    tanggal: "6 Juli 2026",
    fase: "Pra-Kegiatan",
    kegiatanUtama: "Pertemuan koordinasi dengan Camat Coblong & Pemerintah Provinsi Jawa Barat",
    outputTarget: "Penyelarasan teknis kerja sama, penentuan wilayah & dukungan pemerintah daerah",
    picKeterangan: "Camat Coblong, Perwakilan Pemprov Jabar, Tim KKN UNIKOM",
    statusPelaksanaan: "SELESAI",
  },
  {
    id: "tl-3",
    tahapMinggu: "Pra-Kegiatan",
    tanggal: "7 - 10 Juli 2026",
    fase: "Pra-Kegiatan",
    kegiatanUtama: "Koordinasi dengan Kepala Kelurahan & Dinas Lingkungan Hidup (DLH) untuk persiapan survey awal",
    outputTarget: "Kesepakatan teknis pelaksanaan survey lapangan & data awal persampahan dari DLH",
    picKeterangan: "Kepala Kelurahan (6 kelurahan), DLH, DPL, Tim KKN UNIKOM",
    statusPelaksanaan: "SELESAI",
  },
  {
    id: "tl-4",
    tahapMinggu: "Pra-Kegiatan",
    tanggal: "16 - 20 Juli 2026",
    fase: "Pra-Kegiatan",
    kegiatanUtama: "Survey lapangan di 6 kelurahan (Lebak Siliwangi, Lebak Gede, Cipaganti, Sadang Serang, Sekeloa, Dago)",
    outputTarget: "Data kondisi eksisting persampahan per kelurahan (titik TPS/TPS 3R, bank sampah, volume sampah) sebagai bahan baseline & lokasi posko",
    picKeterangan: "Tim KKN UNIKOM, DPL, Kepala Kelurahan, DLH",
    statusPelaksanaan: "SELESAI",
  },
  {
    id: "tl-5",
    tahapMinggu: "Pra-Kegiatan",
    tanggal: "25 Juli 2026",
    fase: "Pra-Kegiatan",
    kegiatanUtama: "Pembukaan resmi Kegiatan KKN oleh Pemerintah Provinsi Jawa Barat",
    outputTarget: "Program KKN UNIKOM 2026 di Kecamatan Coblong resmi dibuka",
    picKeterangan: "Pemerintah Provinsi Jawa Barat, Rektorat UNIKOM, Camat Coblong",
    statusPelaksanaan: "SELESAI",
  },
  {
    id: "tl-6",
    tahapMinggu: "Pra-Kegiatan",
    tanggal: "6 Agustus 2026 (Kamis)",
    fase: "Pra-Kegiatan",
    kegiatanUtama: "Pembekalan DPL & Diskusi dengan Dinas Lingkungan Hidup (DLH)",
    outputTarget: "DPL memahami mekanisme KKN, tata tertib, fokus program sampah, dan kebijakan/data teknis persampahan dari DLH",
    picKeterangan: "Tim KKN UNIKOM, seluruh DPL, Perwakilan DLH",
    statusPelaksanaan: "SELESAI",
  },
  {
    id: "tl-7",
    tahapMinggu: "Pra-Kegiatan",
    tanggal: "8 Agustus 2026 (Sabtu)",
    fase: "Pra-Kegiatan",
    kegiatanUtama: "Pembekalan Mahasiswa",
    outputTarget: "Mahasiswa memahami kode etik, tata tertib, kompetensi TIK & soft skills, dan profil wilayah Coblong",
    picKeterangan: "Tim KKN UNIKOM, DPL, narasumber Pemkot Bandung & mitra",
    statusPelaksanaan: "SELESAI",
  },
  {
    id: "tl-8",
    tahapMinggu: "Pra-Kegiatan",
    tanggal: "12 Agustus 2026 (Rabu)",
    fase: "Pra-Kegiatan",
    kegiatanUtama: "Pelepasan Mahasiswa & Keberangkatan DPL ke lokasi",
    outputTarget: "Mahasiswa & DPL tiba dan mulai bertugas di 6 kelurahan - Minggu 1 dimulai",
    picKeterangan: "Seluruh mahasiswa peserta, DPL, Tim KKN UNIKOM",
    statusPelaksanaan: "SELESAI",
  },
  {
    id: "tl-9",
    tahapMinggu: "Minggu 1",
    tanggal: "12 - 18 Agustus 2026",
    fase: "Fase 1 - Persiapan & Observasi",
    kegiatanUtama: "KICK OFF & Penerjunan: Pelepasan mahasiswa & keberangkatan DPL ke lokasi posko di 6 kelurahan; Koordinasi awal dengan RT/RW & verifikasi data baseline",
    outputTarget: "Posko terbentuk di 6 kelurahan; Mahasiswa & DPL siap di lokasi; Dokumen penerimaan resmi kelurahan",
    picKeterangan: "Kunjungan DPL & Pelepasan Tim KKN UNIKOM",
    statusPelaksanaan: "SELESAI",
  },
  {
    id: "tl-10",
    tahapMinggu: "Minggu 2",
    tanggal: "19 - 25 Agustus 2026",
    fase: "Fase 1 - Persiapan & Observasi",
    kegiatanUtama: "Observasi lapangan & pembuatan proposal/matrik program kerja; Identifikasi potensi-masalah sampah; Sosialisasi awal pemilahan & aplikasi BERSEKA",
    outputTarget: "Draft proposal & matrik program kerja tersusun; Warga RW binaan memahami pemilahan sampah",
    picKeterangan: "Monitoring DPL & Mahasiswa KKN",
    statusPelaksanaan: "SEDANG_BERJALAN",
  },
  {
    id: "tl-11",
    tahapMinggu: "Minggu 3",
    tanggal: "26 Agustus - 1 September 2026",
    fase: "Fase 2 - Pilot Project",
    kegiatanUtama: "Finalisasi & persetujuan matrik program kerja oleh DPL & Kelurahan; Persiapan sarana pemilahan (tempat sampah 3 kategori, QR Code, materi edukasi); Pemilihan RT percontohan",
    outputTarget: "Matrik program kerja disetujui; RT pilot ditentukan",
    picKeterangan: "Kunjungan DPL",
    statusPelaksanaan: "BELUM_DIMULAI",
  },
  {
    id: "tl-12",
    tahapMinggu: "Minggu 4",
    tanggal: "2 - 8 September 2026",
    fase: "Fase 2 - Pilot Project",
    kegiatanUtama: "Distribusi sarana & aktivasi QR Code di RT pilot; Uji coba awal aplikasi warga",
    outputTarget: "RT pilot aktif dengan sarana pemilahan",
    picKeterangan: "Monitoring DPL",
    statusPelaksanaan: "BELUM_DIMULAI",
  },
  {
    id: "tl-13",
    tahapMinggu: "Minggu 5",
    tanggal: "9 - 15 September 2026",
    fase: "Fase 3 - Implementasi & Pendampingan",
    kegiatanUtama: "Uji coba aplikasi warga (scan QR, setor sampah, verifikasi poin) & edukasi pemilahan door-to-door di RT pilot; Uji coba timbangan IoT & GPS; Uji coba dashboard monitoring kelurahan; Evaluasi hasil pilot & penyempurnaan sistem",
    outputTarget: "Warga RT pilot mulai menggunakan aplikasi; sistem IoT & dashboard berjalan",
    picKeterangan: "Kunjungan DPL",
    statusPelaksanaan: "BELUM_DIMULAI",
  },
  {
    id: "tl-14",
    tahapMinggu: "Minggu 6 dan 7",
    tanggal: "16 - 29 September 2026",
    fase: "Fase 3 - Implementasi & Pendampingan",
    kegiatanUtama: "Perluasan program ke seluruh RW; Aktivasi gamifikasi & leaderboard partisipasi warga; Pendampingan pembentukan/penguatan bank sampah per RW",
    outputTarget: "Seluruh RW terlibat; leaderboard aktif",
    picKeterangan: "Monitoring DPL",
    statusPelaksanaan: "BELUM_DIMULAI",
  },
  {
    id: "tl-15",
    tahapMinggu: "Minggu 8",
    tanggal: "30 September - 6 Oktober 2026",
    fase: "Fase 3 - Implementasi & Pendampingan",
    kegiatanUtama: "Pendampingan Pengangkutan sampah berbasis data (rute & jadwal via IoT/GPS); Pendampingan pengolahan organik: kompos, biopori, budidaya maggot BSF",
    outputTarget: "Rute pengangkutan optimal; unit pengomposan berjalan",
    picKeterangan: "Kunjungan DPL",
    statusPelaksanaan: "BELUM_DIMULAI",
  },
  {
    id: "tl-16",
    tahapMinggu: "Minggu 9",
    tanggal: "7 - 13 Oktober 2026",
    fase: "Fase 3 - Implementasi & Pendampingan",
    kegiatanUtama: "Operasional bank sampah: pencatatan transaksi & saldo nasabah; Produksi POC & pemanfaatan botol bekas (buruan SAE); Pembuatan konten edukasi digital dan pencarian link kerja sama untuk distribusi produksi maggot dan POC dan evaluasi tengah Periode (Kesadaran dan partisipasi warga)",
    outputTarget: "Bank sampah tercatat rapi; produk POC/buruan SAE mulai jalan; data komposisi sampah per wilayah",
    picKeterangan: "Monitoring DPL dan Kunjungan Ketua Pelaksana",
    statusPelaksanaan: "BELUM_DIMULAI",
  },
  {
    id: "tl-17",
    tahapMinggu: "Minggu 10 dan 11",
    tanggal: "14 - 27 Oktober 2026",
    fase: "Fase 3 - Implementasi & Pendampingan",
    kegiatanUtama: "Mitigasi persoalan berdasarkan data evaluasi: Edukasi masyarakat, Penguatan kelembagaan bank sampah/TPS 3R & SOP pengelolaan; Optimalisasi rute pengangkutan berdasarkan data terkumpul",
    outputTarget: "Peningkatan warga memilah; SOP kelembagaan bank sampah tersusun",
    picKeterangan: "Monitoring DPL",
    statusPelaksanaan: "BELUM_DIMULAI",
  },
  {
    id: "tl-18",
    tahapMinggu: "Minggu 12",
    tanggal: "28 - 31 Oktober 2026",
    fase: "Fase 4 - Evaluasi & Penutupan",
    kegiatanUtama: "Konsolidasi capaian program seluruh kelurahan; Pengukuran indikator keberhasilan (perilaku, operasional, ekonomi sirkular, sistem digital); Finalisasi laporan akhir, video report, dan artikel ilmiah; Persiapan materi seminar hasil & publikasi konten digital; Upacara penarikan mahasiswa di Kantor Kecamatan Coblong; Unggah laporan akhir ke sistem informasi KKN",
    outputTarget: "Laporan akhir final, seminar akhir, Mahasiswa ditarik; laporan terunggah; nilai akhir keluar",
    picKeterangan: "Penilaian akhir DPL & Kelurahan (50:50)",
    statusPelaksanaan: "BELUM_DIMULAI",
  },
];

const MONTH_MAP: Record<string, number> = {
  jan: 0,
  januari: 0,
  feb: 1,
  februari: 1,
  mar: 2,
  maret: 2,
  apr: 3,
  april: 3,
  mei: 4,
  jun: 5,
  juni: 5,
  jul: 6,
  juli: 6,
  ags: 7,
  agu: 7,
  agustus: 7,
  sep: 8,
  september: 8,
  okt: 9,
  oktober: 9,
  nov: 10,
  november: 10,
  des: 11,
  desember: 11,
};

export const parseIndonesianDateRange = (str: string): { start: Date | null; end: Date | null } => {
  if (!str) return { start: null, end: null };
  const clean = str.replace(/\(.*?\)/g, "").trim().toLowerCase();

  // Pola 1: "12 - 18 agustus 2026"
  const m1 = clean.match(/(\d{1,2})\s*[-–]\s*(\d{1,2})\s+([a-z]+)\s+(\d{4})/);
  if (m1) {
    const d1 = parseInt(m1[1], 10);
    const d2 = parseInt(m1[2], 10);
    const mon = MONTH_MAP[m1[3]];
    const yr = parseInt(m1[4], 10);
    if (mon !== undefined && !isNaN(yr)) {
      return {
        start: new Date(Date.UTC(yr, mon, d1, 0, 0, 0)),
        end: new Date(Date.UTC(yr, mon, d2, 23, 59, 59)),
      };
    }
  }

  // Pola 2: "26 agustus - 1 september 2026"
  const m2 = clean.match(/(\d{1,2})\s+([a-z]+)\s*[-–]\s*(\d{1,2})\s+([a-z]+)\s+(\d{4})/);
  if (m2) {
    const d1 = parseInt(m2[1], 10);
    const mon1 = MONTH_MAP[m2[2]];
    const d2 = parseInt(m2[3], 10);
    const mon2 = MONTH_MAP[m2[4]];
    const yr = parseInt(m2[5], 10);
    if (mon1 !== undefined && mon2 !== undefined && !isNaN(yr)) {
      return {
        start: new Date(Date.UTC(yr, mon1, d1, 0, 0, 0)),
        end: new Date(Date.UTC(yr, mon2, d2, 23, 59, 59)),
      };
    }
  }

  // Pola 3: "1 juli 2026"
  const m3 = clean.match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})/);
  if (m3) {
    const d1 = parseInt(m3[1], 10);
    const mon = MONTH_MAP[m3[2]];
    const yr = parseInt(m3[3], 10);
    if (mon !== undefined && !isNaN(yr)) {
      return {
        start: new Date(Date.UTC(yr, mon, d1, 0, 0, 0)),
        end: new Date(Date.UTC(yr, mon, d1, 23, 59, 59)),
      };
    }
  }

  return { start: null, end: null };
};

/**
 * Menghitung status pelaksanaan dinamis mengikuti kalender hari ini (real-time)
 */
export const computeTimelineStatus = (
  startDate?: Date | string | null,
  endDate?: Date | string | null,
  tanggalStr?: string,
  currentStatus?: string
): "SELESAI" | "SEDANG_BERJALAN" | "BELUM_DIMULAI" => {
  const now = new Date();

  let start: Date | null = null;
  let end: Date | null = null;

  if (startDate) {
    const d = new Date(startDate);
    if (!isNaN(d.getTime())) start = d;
  }
  if (endDate) {
    const d = new Date(endDate);
    if (!isNaN(d.getTime())) end = d;
  }

  if (!start || !end) {
    const parsed = parseIndonesianDateRange(tanggalStr || "");
    if (parsed.start) start = parsed.start;
    if (parsed.end) end = parsed.end;
  }

  if (!start || !end) {
    return (currentStatus as any) || "BELUM_DIMULAI";
  }

  const nowStr = now.toISOString().split("T")[0];
  const startStr = start.toISOString().split("T")[0];
  const endStr = end.toISOString().split("T")[0];

  if (nowStr > endStr) {
    return "SELESAI";
  }
  if (nowStr >= startStr && nowStr <= endStr) {
    return "SEDANG_BERJALAN";
  }
  return "BELUM_DIMULAI";
};

