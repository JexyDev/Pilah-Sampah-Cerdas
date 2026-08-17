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
    tanggal: "10 - 16 Ags 2026",
    fase: "Fase 1 - Persiapan & Observasi",
    kegiatanUtama: "KICK OFF: Pelepasan mahasiswa & keberangkatan DPL ke lokasi (12 Agustus, setelah Pembekalan DPL & Diskusi DLH 6 Agustus dan Pembekalan Mahasiswa 8 Agustus); pendirian Posko di 6 kelurahan",
    outputTarget: "Posko terbentuk di 6 kelurahan; mahasiswa & DPL siap di lokasi",
    picKeterangan: "Kunjungan DPL (Para DPL di tiap kelurahan mendampingi keberangkatan mahasiswa pertama kali untuk diterima di kelurahan)",
    statusPelaksanaan: "SEDANG_BERJALAN",
  },
  {
    id: "tl-10",
    tahapMinggu: "Minggu 2",
    tanggal: "17 - 23 Ags 2026",
    fase: "Fase 1 - Persiapan & Observasi",
    kegiatanUtama: "Observasi lapangan & pembuatan proposal/matrik program kerja kegiatan; identifikasi potensi-masalah sampah; koordinasi dengan RT/RW & Kelurahan",
    outputTarget: "Draft proposal & matrik program kerja tersusun berdasarkan hasil observasi lapangan",
    picKeterangan: "Monitoring DPL",
    statusPelaksanaan: "BELUM_DIMULAI",
  },
  {
    id: "tl-11",
    tahapMinggu: "Minggu 3",
    tanggal: "24 - 30 Ags 2026",
    fase: "Fase 2 - Pilot Project",
    kegiatanUtama: "Finalisasi & persetujuan matrik program kerja oleh DPL & Kelurahan; Persiapan sarana pemilahan (tempat sampah 3 kategori, QR Code, materi edukasi); Pemilihan RT percontohan",
    outputTarget: "Matrik program kerja disetujui; RT pilot ditentukan",
    picKeterangan: "Kunjungan DPL",
    statusPelaksanaan: "BELUM_DIMULAI",
  },
  {
    id: "tl-12",
    tahapMinggu: "Minggu 4",
    tanggal: "31 Ags - 6 Sep 2026",
    fase: "Fase 2 - Pilot Project",
    kegiatanUtama: "Distribusi sarana & aktivasi QR Code di RT pilot; Uji coba awal aplikasi warga",
    outputTarget: "RT pilot aktif dengan sarana pemilahan",
    picKeterangan: "Monitoring DPL",
    statusPelaksanaan: "BELUM_DIMULAI",
  },
  {
    id: "tl-13",
    tahapMinggu: "Minggu 5",
    tanggal: "7 - 13 Sep 2026",
    fase: "Fase 3 - Implementasi & Pendampingan",
    kegiatanUtama: "Uji coba aplikasi warga (scan QR, setor sampah, verifikasi poin) & edukasi pemilahan door-to-door di RT pilot; Uji coba timbangan IoT & GPS; Uji coba dashboard monitoring kelurahan; Evaluasi hasil pilot & penyempurnaan sistem",
    outputTarget: "Warga RT pilot mulai menggunakan aplikasi; sistem IoT & dashboard berjalan",
    picKeterangan: "Kunjungan DPL",
    statusPelaksanaan: "BELUM_DIMULAI",
  },
  {
    id: "tl-14",
    tahapMinggu: "Minggu 6 dan 7",
    tanggal: "14 - 27 Sep 2026",
    fase: "Fase 3 - Implementasi & Pendampingan",
    kegiatanUtama: "Perluasan program ke seluruh RW; Aktivasi gamifikasi & leaderboard partisipasi warga; Pendampingan pembentukan/penguatan bank sampah per RW",
    outputTarget: "Seluruh RW terlibat; leaderboard aktif",
    picKeterangan: "Monitoring DPL",
    statusPelaksanaan: "BELUM_DIMULAI",
  },
  {
    id: "tl-15",
    tahapMinggu: "Minggu 8",
    tanggal: "28 Sep - 4 Okt 2026",
    fase: "Fase 3 - Implementasi & Pendampingan",
    kegiatanUtama: "Pendampingan Pengangkutan sampah berbasis data (rute & jadwal via IoT/GPS); Pendampingan pengolahan organik: kompos, biopori, budidaya maggot BSF",
    outputTarget: "Rute pengangkutan optimal; unit pengomposan berjalan",
    picKeterangan: "Kunjungan DPL",
    statusPelaksanaan: "BELUM_DIMULAI",
  },
  {
    id: "tl-16",
    tahapMinggu: "Minggu 9",
    tanggal: "5 - 11 Okt 2026",
    fase: "Fase 3 - Implementasi & Pendampingan",
    kegiatanUtama: "Operasional bank sampah: pencatatan transaksi & saldo nasabah; Produksi POC & pemanfaatan botol bekas (buruan SAE); Pembuatan konten edukasi digital dan pencarian link kerja sama untuk distribusi produksi maggot dan POC dan evaluasi tengah Periode (Kesadaran dan partisipasi warga)",
    outputTarget: "Bank sampah tercatat rapi; produk POC/buruan SAE mulai jalan; data komposisi sampah per wilayah",
    picKeterangan: "Monitoring DPL dan Kunjungan Ketua Pelaksana",
    statusPelaksanaan: "BELUM_DIMULAI",
  },
  {
    id: "tl-17",
    tahapMinggu: "Minggu 10 dan 11",
    tanggal: "12 - 18 Okt 2026",
    fase: "Fase 3 - Implementasi & Pendampingan",
    kegiatanUtama: "Mitigasi persoalan berdasarkan data evaluasi: Edukasi masyarakat, Penguatan kelembagaan bank sampah/TPS 3R & SOP pengelolaan; Optimalisasi rute pengangkutan berdasarkan data terkumpul",
    outputTarget: "Peningkatan warga memilah; SOP kelembagaan bank sampah tersusun",
    picKeterangan: "Monitoring DPL",
    statusPelaksanaan: "BELUM_DIMULAI",
  },
  {
    id: "tl-18",
    tahapMinggu: "Minggu 12",
    tanggal: "26 - 31 Okt 2026",
    fase: "Fase 4 - Evaluasi & Penutupan",
    kegiatanUtama: "Konsolidasi capaian program seluruh kelurahan; Pengukuran indikator keberhasilan (perilaku, operasional, ekonomi sirkular, sistem digital); Finalisasi laporan akhir, video report, dan artikel ilmiah; Persiapan materi seminar hasil & publikasi konten digital; Upacara penarikan mahasiswa di Kantor Kecamatan Coblong; Unggah laporan akhir ke sistem informasi KKN",
    outputTarget: "Laporan akhir final, seminar akhir, Mahasiswa ditarik; laporan terunggah; nilai akhir keluar",
    picKeterangan: "Penilaian akhir DPL & Kelurahan (50:50)",
    statusPelaksanaan: "BELUM_DIMULAI",
  },
];
