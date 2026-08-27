/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { prisma } from "../lib/prisma.js";

export interface TimelineGuidance {
  rekomendasiAksi: string[];
  pertanyaanKritis: string[];
  tipsSukses: string[];
  checklist: string[];
  indikatorKeberhasilan: string[];
  dokumenAcuan?: string[];
}

// Data acuan default 18 tahapan resmi KKN Coblong 2026 yang diperkaya rekomendasi & pertanyaan kritis
export const DEFAULT_TIMELINE_COBLONG = [
  {
    tahapMinggu: "Pra-Kegiatan",
    tanggal: "1 Juli 2026",
    startDate: new Date("2026-07-01T00:00:00.000Z"),
    endDate: new Date("2026-07-01T23:59:59.000Z"),
    fase: "Pra-Kegiatan",
    kegiatanUtama: "Sosialisasi & Pembukaan Kegiatan KKN di Lantai 17",
    outputTarget: "Civitas akademika memahami program & kegiatan resmi dibuka secara internal",
    picKeterangan: "Wakil Rektor 1 (WR 1) UNIKOM",
    statusPelaksanaan: "SELESAI",
    bidangKegiatan: "Tata Kelola & Koordinasi",
    rekomendasiAksi: [
      "Catat seluruh arahan Wakil Rektor 1 dan panduan umum pelaksanaan KKN Tematik Berseka.",
      "Bentuk struktur internal kelompok (Ketua, Sekretaris, Bendahara, Divisi Lapangan, Divisi Edukasi, Divisi IT).",
      "Pelajari buku panduan KKN dan kenali karakteristik wilayah target Kecamatan Coblong."
    ],
    pertanyaanKritis: [
      "Apakah seluruh anggota kelompok telah memahami visi, misi, dan target utama program KKN Tematik Berseka di Coblong?",
      "Bagaimana strategi pembagian peran internal kelompok agar seluruh program kerja berjalan paralel, efektif, dan adil?"
    ],
    tipsSukses: [
      "Buat grup koordinasi digital internal dan tetapkan jadwal evaluasi kelompok secara berkala."
    ],
    checklist: [
      "Pemahaman panduan KKN",
      "Pembentukan struktur organisasi kelompok",
      "Pemetaan nomor kontak dan jalur komunikasi anggota"
    ],
    indikatorKeberhasilan: [
      "Struktur kelompok terbentuk 100%",
      "Seluruh anggota memahami fokus tema persampahan Berseka"
    ]
  },
  {
    tahapMinggu: "Pra-Kegiatan",
    tanggal: "6 Juli 2026",
    startDate: new Date("2026-07-06T00:00:00.000Z"),
    endDate: new Date("2026-07-06T23:59:59.000Z"),
    fase: "Pra-Kegiatan",
    kegiatanUtama: "Pertemuan koordinasi dengan Camat Coblong & Pemerintah Provinsi Jawa Barat",
    outputTarget: "Penyelarasan teknis kerja sama, penentuan wilayah & dukungan pemerintah daerah",
    picKeterangan: "Camat Coblong, Perwakilan Pemprov Jabar, Tim KKN UNIKOM",
    statusPelaksanaan: "SELESAI",
    bidangKegiatan: "Tata Kelola & Koordinasi",
    rekomendasiAksi: [
      "Simak arahan Camat Coblong terkait prioritas penanganan sampah di 6 kelurahan sasaran.",
      "Identifikasi regulasi lokal persampahan Kota Bandung dan kebijakan kewilayahan di Kecamatan Coblong.",
      "Jalin komunikasi awal dengan perwakilan kantor kecamatan untuk memfasilitasi izin operasional lapangan."
    ],
    pertanyaanKritis: [
      "Kebijakan atau program lokal apa yang sudah berlaku di Kecamatan Coblong terkait pemilahan sampah dari sumber?",
      "Fasilitas dan dukungan kewilayahan apa yang dapat difasilitasi oleh pihak kecamatan dan pemprov selama KKN?"
    ],
    tipsSukses: [
      "Dokumentasikan poin penting pertemuan sebagai landasan penyusunan proposal program kerja kelompok."
    ],
    checklist: [
      "Notulensi arahan Camat",
      "Daftar kontak pejabat penghubung kecamatan",
      "Pemetaan isu prioritas persampahan per kecamatan"
    ],
    indikatorKeberhasilan: [
      "Terjalin kesepakatan koordinasi tingkat kecamatan",
      "Wilayah 6 kelurahan terpetakan secara formal"
    ]
  },
  {
    tahapMinggu: "Pra-Kegiatan",
    tanggal: "7 - 10 Juli 2026",
    startDate: new Date("2026-07-07T00:00:00.000Z"),
    endDate: new Date("2026-07-10T23:59:59.000Z"),
    fase: "Pra-Kegiatan",
    kegiatanUtama: "Koordinasi dengan Kepala Kelurahan & Dinas Lingkungan Hidup (DLH) untuk persiapan survey awal",
    outputTarget: "Kesepakatan teknis pelaksanaan survey lapangan & data awal persampahan dari DLH",
    picKeterangan: "Kepala Kelurahan (6 kelurahan), DLH, DPL, Tim KKN UNIKOM",
    statusPelaksanaan: "SELESAI",
    bidangKegiatan: "Tata Kelola & Koordinasi",
    rekomendasiAksi: [
      "Lakukan audiensi resmi ke kantor kelurahan binaan dan temui Lurah serta seksi ketenteraman/kebersihan.",
      "Minta data baseline persampahan kelurahan dari DLH (volume sampah harian, jumlah RT/RW, TPS 3R, dan Bank Sampah).",
      "Sepakati jadwal dan rute survey pendahuluan di masing-masing RW binaan bersama lurah."
    ],
    pertanyaanKritis: [
      "Berapa timbulan sampah harian di kelurahan dan berapa persen yang saat ini berhasil diangkut ke TPA vs terolah di TPS 3R?",
      "Bagaimana kesiapan dan keterbukaan aparatur kelurahan dalam mendukung digitalisasi sistem BERSEKA?"
    ],
    tipsSukses: [
      "Bawa surat pengantar resmi universitas dan profil ringkas inovasi Berseka saat audiensi kelurahan."
    ],
    checklist: [
      "Surat izin kelurahan",
      "Data baseline persampahan DLH",
      "Jadwal survey pendahuluan"
    ],
    indikatorKeberhasilan: [
      "Izin survey lapangan disetujui pihak kelurahan",
      "Data baseline awal DLH diperoleh"
    ]
  },
  {
    tahapMinggu: "Pra-Kegiatan",
    tanggal: "16 - 20 Juli 2026",
    startDate: new Date("2026-07-16T00:00:00.000Z"),
    endDate: new Date("2026-07-20T23:59:59.000Z"),
    fase: "Pra-Kegiatan",
    kegiatanUtama: "Survey lapangan di 6 kelurahan (Lebak Siliwangi, Lebak Gede, Cipaganti, Sadang Serang, Sekeloa, Dago)",
    outputTarget: "Data kondisi eksisting persampahan per kelurahan (titik TPS/TPS 3R, bank sampah, volume sampah) sebagai bahan baseline & lokasi posko",
    picKeterangan: "Tim KKN UNIKOM, DPL, Kepala Kelurahan, DLH",
    statusPelaksanaan: "SELESAI",
    bidangKegiatan: "Pemilahan Sampah",
    rekomendasiAksi: [
      "Kunjungi titik fisik: TPS, TPS 3R, bank sampah eksisting, dan calon lokasi posko KKN.",
      "Lakukan wawancara informal dengan tokoh masyarakat, pengurus RW, dan petugas pengangkut sampah.",
      "Dokumentasikan kondisi eksisting wadah sampah warga dan catat koordinat GPS posko."
    ],
    pertanyaanKritis: [
      "Apa kendala utama yang menyebabkan pemilahan sampah di RW binaan belum optimal sebelum program KKN?",
      "Apakah lokasi calon posko KKN strategis, aman, dan memiliki koneksi internet memadai untuk sistem BERSEKA?"
    ],
    tipsSukses: [
      "Ambil foto dokumentasi sebelum intervensi (kondisi awal) sebagai bahan laporan baseline visual."
    ],
    checklist: [
      "Foto baseline TPS/Bank Sampah",
      "Koordinat GPS calon posko KKN",
      "Hasil wawancara ketua RW & petugas kebersihan"
    ],
    indikatorKeberhasilan: [
      "Data eksisting 6 kelurahan terdokumentasi rapi",
      "Lokasi posko di kelurahan binaan disepakati"
    ]
  },
  {
    tahapMinggu: "Pra-Kegiatan",
    tanggal: "25 Juli 2026",
    startDate: new Date("2026-07-25T00:00:00.000Z"),
    endDate: new Date("2026-07-25T23:59:59.000Z"),
    fase: "Pra-Kegiatan",
    kegiatanUtama: "Pembukaan resmi Kegiatan KKN oleh Pemerintah Provinsi Jawa Barat",
    outputTarget: "Program KKN UNIKOM 2026 di Kecamatan Coblong resmi dibuka",
    picKeterangan: "Pemerintah Provinsi Jawa Barat, Rektorat UNIKOM, Camat Coblong",
    statusPelaksanaan: "SELESAI",
    bidangKegiatan: "Tata Kelola & Koordinasi",
    rekomendasiAksi: [
      "Hadiri upacara pembukaan resmi dan pahami target capaian provinsi terkait program 'Jabar Bebas Sampah'.",
      "Konsolidasikan komitmen seluruh anggota kelompok di bawah arahan DPL dan panitia taskforce.",
      "Siapkan atribut, perlengkapan kelompok, dan materi awal sebelum pembekalan teknis."
    ],
    pertanyaanKritis: [
      "Bagaimana menyelaraskan target program kerja kelompok dengan indikator keberhasilan program Pemprov Jabar?",
      "Apakah ada target kuantitatif reduksi sampah yang dibebankan kepada tiap kelompok KKN?"
    ],
    tipsSukses: [
      "Bangun komunikasi dan jaringan kolaborasi antar-kelompok KKN di kelurahan tetangga."
    ],
    checklist: [
      "Kehadiran pembukaan resmi",
      "Penyelarasan indikator program",
      "Atribut & banner kelompok KKN"
    ],
    indikatorKeberhasilan: [
      "Seluruh peserta hadir dan memahami mandat program pembukaan resmi KKN"
    ]
  },
  {
    tahapMinggu: "Pra-Kegiatan",
    tanggal: "6 Agustus 2026 (Kamis)",
    startDate: new Date("2026-08-06T00:00:00.000Z"),
    endDate: new Date("2026-08-06T23:59:59.000Z"),
    fase: "Pra-Kegiatan",
    kegiatanUtama: "Pembekalan DPL & Diskusi dengan Dinas Lingkungan Hidup (DLH)",
    outputTarget: "DPL memahami mekanisme KKN, tata tertib, fokus program sampah, dan kebijakan/data teknis persampahan dari DLH",
    picKeterangan: "Tim KKN UNIKOM, seluruh DPL, Perwakilan DLH",
    statusPelaksanaan: "SELESAI",
    bidangKegiatan: "Tata Kelola & Koordinasi",
    rekomendasiAksi: [
      "Dampingi DPL dalam menyerap teknis penilaian, instrumen evaluasi 50:50 (DPL & Kelurahan), dan tata tertib.",
      "Dapatkan materi teknis persampahan terkini dari DLH Kota Bandung untuk bahan edukasi warga.",
      "Jadwalkan pertemuan rutin bimbingan kelompok dengan DPL pembimbing."
    ],
    pertanyaanKritis: [
      "Bagaimana pembagian proporsi penilaian akhir KKN antara DPL (akademik/logbook) dan pihak Kelurahan (kontribusi riil)?",
      "Apa standar pelaporan logbook harian dan mingguan yang disepakati bersama DPL?"
    ],
    tipsSukses: [
      "Sepakati jadwal bimbingan mingguan (visitasi fisik & daring) bersama DPL sejak awal penerjunan."
    ],
    checklist: [
      "Instrumen penilaian DPL & Kelurahan",
      "Materi teknis persampahan DLH",
      "Jadwal bimbingan rutin DPL"
    ],
    indikatorKeberhasilan: [
      "Format penilaian 50:50 dipahami oleh DPL dan tim mahasiswa"
    ]
  },
  {
    tahapMinggu: "Pra-Kegiatan",
    tanggal: "8 Agustus 2026 (Sabtu)",
    startDate: new Date("2026-08-08T00:00:00.000Z"),
    endDate: new Date("2026-08-08T23:59:59.000Z"),
    fase: "Pra-Kegiatan",
    kegiatanUtama: "Pembekalan Mahasiswa",
    outputTarget: "Mahasiswa memahami kode etik, tata tertib, kompetensi TIK & soft skills, dan profil wilayah Coblong",
    picKeterangan: "Tim KKN UNIKOM, DPL, narasumber Pemkot Bandung & mitra",
    statusPelaksanaan: "SELESAI",
    bidangKegiatan: "Tata Kelola & Koordinasi",
    rekomendasiAksi: [
      "Pastikan seluruh anggota menguasai penggunaan aplikasi mobile BERSEKA (fitur QR, aktivasi tempat sampah, presensi geofencing, logbook).",
      "Pahami SOP keselamatan kerja lapangan, kode etik bermasyarakat di wilayah Coblong, dan soft skills komunikasi.",
      "Simulasikan skenario pendaftaran dan aktivasi warga lansia/non-gadget di lingkungan simulasi."
    ],
    pertanyaanKritis: [
      "Apakah semua mahasiswa kelompok sudah berhasil login, mengaktifkan izin GPS/kamera, dan memahami flow absensi geofencing?",
      "Bagaimana mitigasi kelompok jika terjadi kendala teknis (offline/blank spot) saat berada di lapangan?"
    ],
    tipsSukses: [
      "Lakukan uji coba scan QR dan aktivasi tempat sampah bersama rekan satu kelompok sebelum turun ke warga."
    ],
    checklist: [
      "Akun login & izin GPS aplikasi mobile aktif",
      "Simulasi aktivasi tempat sampah warga",
      "Kesiapan perlengkapan & identitas mahasiswa"
    ],
    indikatorKeberhasilan: [
      "100% mahasiswa lulus pembekalan teknis dan siap diterjunkan"
    ]
  },
  {
    tahapMinggu: "Pra-Kegiatan",
    tanggal: "12 Agustus 2026 (Rabu)",
    startDate: new Date("2026-08-12T00:00:00.000Z"),
    endDate: new Date("2026-08-12T23:59:59.000Z"),
    fase: "Pra-Kegiatan",
    kegiatanUtama: "Pelepasan Mahasiswa & Keberangkatan DPL ke lokasi",
    outputTarget: "Mahasiswa & DPL tiba dan mulai bertugas di 6 kelurahan - Minggu 1 dimulai",
    picKeterangan: "Seluruh mahasiswa peserta, DPL, Tim KKN UNIKOM",
    statusPelaksanaan: "SELESAI",
    bidangKegiatan: "Tata Kelola & Koordinasi",
    rekomendasiAksi: [
      "Lakukan serah terima berkas pelepasan dan berangkat bersama DPL menuju lokasi posko kelurahan.",
      "Laporkan kedatangan secara resmi ke kantor kelurahan dan lakukan serah terima fisik posko.",
      "Aktivasi presensi GPS kehadiran hari pertama di aplikasi BERSEKA."
    ],
    pertanyaanKritis: [
      "Apakah seluruh logistik posko (tempat tinggal, sanitasi, ATK, banner posko) sudah siap 100%?",
      "Apakah dokumen berita acara penerimaan mahasiswa sudah ditandatangani oleh pihak kelurahan?"
    ],
    tipsSukses: [
      "Lakukan check-in presensi pertama begitu tiba di radius posko/kelurahan."
    ],
    checklist: [
      "Berita acara serah terima posko",
      "Check-in GPS presensi perdana",
      "Pemasangan banner posko KKN Berseka"
    ],
    indikatorKeberhasilan: [
      "Mahasiswa tiba di lokasi posko 6 kelurahan dengan selamat dan resmi diterima"
    ]
  },
  {
    tahapMinggu: "Minggu 1",
    tanggal: "12 - 18 Agustus 2026",
    startDate: new Date("2026-08-12T00:00:00.000Z"),
    endDate: new Date("2026-08-18T23:59:59.000Z"),
    fase: "Fase 1 - Persiapan & Observasi",
    kegiatanUtama: "KICK OFF & Penerjunan: Pelepasan mahasiswa & keberangkatan DPL ke lokasi posko di 6 kelurahan; Koordinasi awal dengan RT/RW & verifikasi data baseline",
    outputTarget: "Posko terbentuk di 6 kelurahan; Mahasiswa & DPL siap di lokasi; Dokumen penerimaan resmi kelurahan",
    picKeterangan: "Kunjungan DPL & Pelepasan Tim KKN UNIKOM",
    statusPelaksanaan: "SELESAI",
    bidangKegiatan: "Tata Kelola & Koordinasi",
    rekomendasiAksi: [
      "Kunjungi seluruh ketua RW dan RT binaan untuk sowan, sosialisasi program, dan membagikan jadwal kerja kelompok.",
      "Lakukan pendataan baseline awal: jumlah KK, kondisi tempat sampah eksisting, dan keberadaan bank sampah aktif.",
      "Daftarkan posko KKN di aplikasi mobile dan verifikasi batas polygon radius presensi."
    ],
    pertanyaanKritis: [
      "Apakah batas wilayah tugas RW sudah sinkron antara aplikasi BERSEKA dan batas administratif riil?",
      "Berapa estimasi total KK di RW binaan yang menjadi target intervensi pemilahan sampah?"
    ],
    tipsSukses: [
      "Gunakan bahasa yang santun dan libatkan tokoh pemuda/kader PKK saat berkunjung ke warga."
    ],
    checklist: [
      "Sowan ketua RT/RW binaan",
      "Registrasi posko di aplikasi mobile",
      "Verifikasi baseline data KK warga"
    ],
    indikatorKeberhasilan: [
      "Posko aktif dan terdaftar di sistem",
      "Data baseline RW binaan terverifikasi"
    ]
  },
  {
    tahapMinggu: "Minggu 2",
    tanggal: "19 - 25 Agustus 2026",
    startDate: new Date("2026-08-19T00:00:00.000Z"),
    endDate: new Date("2026-08-25T23:59:59.000Z"),
    fase: "Fase 1 - Persiapan & Observasi",
    kegiatanUtama: "Observasi lapangan & pembuatan proposal/matrik program kerja; Identifikasi potensi-masalah sampah; Sosialisasi awal pemilahan & aplikasi BERSEKA",
    outputTarget: "Draft proposal & matrik program kerja tersusun; Warga RW binaan memahami pemilahan sampah",
    picKeterangan: "Monitoring DPL & Mahasiswa KKN",
    statusPelaksanaan: "SEDANG_BERJALAN",
    bidangKegiatan: "Edukasi Warga & Sosialisasi",
    rekomendasiAksi: [
      "Identifikasi peta potensi dan masalah persampahan: rasio sampah organik dapur, plastik, dan residu.",
      "Susun draft Proposal KKN dan Matriks Program Kerja rinci (timeline, penanggung jawab, kebutuhan biaya, target output).",
      "Lakukan sosialisasi awal pemilahan sampah organik-anorganik dan kenalkan manfaat aplikasi BERSEKA kepada warga."
    ],
    pertanyaanKritis: [
      "Apakah program kerja yang dirancang realistis diselesaikan dalam 10 pekan ke depan dengan sumber daya yang ada?",
      "Bagaimana mengukur tingkat kesadaran awal (baseline awareness) warga sebelum program intervensi dimulai?"
    ],
    tipsSukses: [
      "Konsultasikan draft matriks program kerja ke DPL sebelum difinalisasi bersama pihak kelurahan."
    ],
    checklist: [
      "Draft matriks program kerja KKN",
      "Peta masalah persampahan RW",
      "Materi edukasi pemilahan sampah"
    ],
    indikatorKeberhasilan: [
      "Draft matriks proker tersusun lengkap",
      "Sosialisasi awal pemilahan terlaksana di RW binaan"
    ]
  },
  {
    tahapMinggu: "Minggu 3",
    tanggal: "26 Agustus - 1 September 2026",
    startDate: new Date("2026-08-26T00:00:00.000Z"),
    endDate: new Date("2026-09-01T23:59:59.000Z"),
    fase: "Fase 2 - Pilot Project",
    kegiatanUtama: "Finalisasi & persetujuan matrik program kerja oleh DPL & Kelurahan; Persiapan sarana pemilahan (tempat sampah 3 kategori, QR Code, materi edukasi); Pemilihan RT percontohan",
    outputTarget: "Matrik program kerja disetujui; RT pilot ditentukan",
    picKeterangan: "Kunjungan DPL",
    statusPelaksanaan: "BELUM_DIMULAI",
    bidangKegiatan: "Pemilahan Sampah",
    rekomendasiAksi: [
      "Ajukan proposal dan matriks program kerja ke DPL dan Lurah untuk mendapatkan persetujuan dan tanda tangan resmi.",
      "Tentukan 1 RT percontohan (Pilot Project) yang memiliki komitmen warga tertinggi untuk uji coba awal.",
      "Siapkan sarana fisik: stiker edukasi 3 wadah, QR Code tempat sampah, dan materi sosialisasi door-to-door."
    ],
    pertanyaanKritis: [
      "Mengapa RT tersebut dipilih sebagai pilot project dan apa indikator keberhasilan fase uji coba ini?",
      "Apakah sarana tempat sampah 3 kategori (organik, anorganik, residu) sudah tersedia cukup di RT percontohan?"
    ],
    tipsSukses: [
      "Ajak ketua RT pilot menjadi 'champion' yang memotivasi warganya secara langsung."
    ],
    checklist: [
      "Persetujuan matriks proker DPL/Lurah",
      "Penetapan 1 RT percontohan pilot",
      "Stiker & label QR Code tempat sampah siap"
    ],
    indikatorKeberhasilan: [
      "Matriks proker disetujui 100%",
      "Lokasi RT pilot project ditetapkan secara resmi"
    ]
  },
  {
    tahapMinggu: "Minggu 4",
    tanggal: "2 - 8 September 2026",
    startDate: new Date("2026-09-02T00:00:00.000Z"),
    endDate: new Date("2026-09-08T23:59:59.000Z"),
    fase: "Fase 2 - Pilot Project",
    kegiatanUtama: "Distribusi sarana & aktivasi QR Code di RT pilot; Uji coba awal aplikasi warga",
    outputTarget: "RT pilot aktif dengan sarana pemilahan",
    picKeterangan: "Monitoring DPL",
    statusPelaksanaan: "BELUM_DIMULAI",
    bidangKegiatan: "Pemilahan Sampah",
    rekomendasiAksi: [
      "Distribusikan stiker dan pasang QR Code pada tempat sampah warga di RT pilot project.",
      "Lakukan pendampingan registrasi akun warga dan aktivasi tempat sampah via scan QR hingga status ACTIVE_BOUND.",
      "Bantu warga lansia atau yang belum memiliki smartphone dengan mencatatkannya di akun keluarga / kartu pendamping."
    ],
    pertanyaanKritis: [
      "Berapa persentase KK di RT pilot yang berhasil mengaktifkan tempat sampahnya di sistem BERSEKA?",
      "Apa hambatan terbesar warga saat proses aktivasi QR tempat sampah dan bagaimana solusinya?"
    ],
    tipsSukses: [
      "Lakukan aktivasi saat waktu senggang warga (sore hari atau akhir pekan) agar didampingi dengan tenang."
    ],
    checklist: [
      "Pemasangan QR tempat sampah di RT pilot",
      "Aktivasi akun warga di sistem Berseka",
      "Rekap daftar warga yang telah aktif"
    ],
    indikatorKeberhasilan: [
      "Minimal 80% rumah di RT pilot terpasang QR Code",
      "Status tempat sampah berubah menjadi ACTIVE_BOUND"
    ]
  },
  {
    tahapMinggu: "Minggu 5",
    tanggal: "9 - 15 September 2026",
    startDate: new Date("2026-09-09T00:00:00.000Z"),
    endDate: new Date("2026-09-15T23:59:59.000Z"),
    fase: "Fase 3 - Implementasi & Pendampingan",
    kegiatanUtama: "Uji coba aplikasi warga (scan QR, setor sampah, verifikasi poin) & edukasi pemilahan door-to-door di RT pilot; Uji coba timbangan IoT & GPS; Uji coba dashboard monitoring kelurahan; Evaluasi hasil pilot & penyempurnaan sistem",
    outputTarget: "Warga RT pilot mulai menggunakan aplikasi; sistem IoT & dashboard berjalan",
    picKeterangan: "Kunjungan DPL",
    statusPelaksanaan: "BELUM_DIMULAI",
    bidangKegiatan: "Edukasi Warga & Sosialisasi",
    rekomendasiAksi: [
      "Dampingi warga RT pilot dalam membuang sampah: foto sampah AI -> scan QR -> verifikasi poin.",
      "Uji coba integrasi timbangan IoT di pos pengumpulan dan validasi berat sampah (Kg) yang masuk ke dashboard.",
      "Evaluasi hasil uji coba 1 minggu di RT pilot: data kepatuhan pemilahan, kesalahan pilah (mismatch), dan kepuasan warga."
    ],
    pertanyaanKritis: [
      "Berapa tingkat kepatuhan pemilahan warga RT pilot (apakah sampah organik bersih dari kontaminasi plastik)?",
      "Apakah sistem IoT timbangan dan dashboard monitoring kelurahan menampilkan data yang akurat dan real-time?"
    ],
    tipsSukses: [
      "Berikan apresiasi langsung kepada warga yang memilah dengan benar untuk membangun kebiasaan positif."
    ],
    checklist: [
      "Uji coba deteksi AI & scan QR warga",
      "Verifikasi data timbangan IoT di dashboard",
      "Laporan evaluasi 1 pekan pilot project"
    ],
    indikatorKeberhasilan: [
      "Transaksi pembuangan sampah tercatat di sistem",
      "Dashboard monitoring kelurahan menampilkan data riil"
    ]
  },
  {
    tahapMinggu: "Minggu 6 dan 7",
    tanggal: "16 - 29 September 2026",
    startDate: new Date("2026-09-16T00:00:00.000Z"),
    endDate: new Date("2026-09-29T23:59:59.000Z"),
    fase: "Fase 3 - Implementasi & Pendampingan",
    kegiatanUtama: "Perluasan program ke seluruh RW; Aktivasi gamifikasi & leaderboard partisipasi warga; Pendampingan pembentukan/penguatan bank sampah per RW",
    outputTarget: "Seluruh RW terlibat; leaderboard aktif",
    picKeterangan: "Monitoring DPL",
    statusPelaksanaan: "BELUM_DIMULAI",
    bidangKegiatan: "Pengolahan & Bank Sampah",
    rekomendasiAksi: [
      "Replikasi keberhasilan pilot project ke seluruh RT dan RW binaan di kelurahan.",
      "Aktivasi fitur leaderboard, peringkat keaktifan warga, dan sosialisasi reward green point untuk memicu kompetisi positif.",
      "Bantu pembentukan atau penguatan struktur kelembagaan Bank Sampah di tingkat RW yang belum aktif."
    ],
    pertanyaanKritis: [
      "Bagaimana strategi mahasiswa menjaga kualitas edukasi saat skala intervensi diperluas ke seluruh RW?",
      "Berapa target nasabah baru bank sampah yang ditargetkan terbentuk di tiap RW binaan?"
    ],
    tipsSukses: [
      "Gunakan media sosial dan grup WhatsApp warga untuk mengumumkan leaderboard mingguan teraktif."
    ],
    checklist: [
      "Ekspansi sosialisasi ke seluruh RW",
      "Aktivasi leaderboard dan poin warga",
      "Revitalisasi kepengurusan bank sampah RW"
    ],
    indikatorKeberhasilan: [
      "Seluruh RW binaan terlibat dalam sistem Berseka",
      "Terjadi peningkatan partisipasi warga di leaderboard"
    ]
  },
  {
    tahapMinggu: "Minggu 8",
    tanggal: "30 September - 6 Oktober 2026",
    startDate: new Date("2026-09-30T00:00:00.000Z"),
    endDate: new Date("2026-10-06T23:59:59.000Z"),
    fase: "Fase 3 - Implementasi & Pendampingan",
    kegiatanUtama: "Pendampingan Pengangkutan sampah berbasis data (rute & jadwal via IoT/GPS); Pendampingan pengolahan organik: kompos, biopori, budidaya maggot BSF",
    outputTarget: "Rute pengangkutan optimal; unit pengomposan berjalan",
    picKeterangan: "Kunjungan DPL",
    statusPelaksanaan: "BELUM_DIMULAI",
    bidangKegiatan: "Pengangkutan & Logistik",
    rekomendasiAksi: [
      "Dampingi petugas pengangkut residu dalam optimalisasi rute dan jadwal pengangkutan berbasis polygon.",
      "Inisiasi instalasi pengolahan sampah organik: pembuatan lubang biopori komunal, komposter takakura, atau biokonversi maggot BSF.",
      "Latih kader PKK / karang taruna setempat agar mampu merawat unit biopori dan panen pupuk kompos."
    ],
    pertanyaanKritis: [
      "Berapa estimasi volume sampah organik per hari yang berhasil dicegah masuk ke TPS melalui biopori dan komposter?",
      "Apakah jadwal penjemputan sampah oleh petugas sudah teratur dan tidak menimbulkan penumpukan di rumah warga?"
    ],
    tipsSukses: [
      "Buat panduan visual sederhana (stiker/leaflet) cara merawat biopori dan takakura agar tidak berbau."
    ],
    checklist: [
      "Instalasi biopori / komposter takakura",
      "Pelatihan kader lingkungan & PKK",
      "Pencatatan rute optimal petugas pengangkut"
    ],
    indikatorKeberhasilan: [
      "Unit pengolahan organik komunal beroperasi",
      "Jadwal dan rute pengangkutan sampah terpetakan di sistem"
    ]
  },
  {
    tahapMinggu: "Minggu 9",
    tanggal: "7 - 13 Oktober 2026",
    startDate: new Date("2026-10-07T00:00:00.000Z"),
    endDate: new Date("2026-10-13T23:59:59.000Z"),
    fase: "Fase 3 - Implementasi & Pendampingan",
    kegiatanUtama: "Operasional bank sampah: pencatatan transaksi & saldo nasabah; Produksi POC & pemanfaatan botol bekas (buruan SAE); Pembuatan konten edukasi digital dan pencarian link kerja sama untuk distribusi produksi maggot dan POC dan evaluasi tengah Periode (Kesadaran dan partisipasi warga)",
    outputTarget: "Bank sampah tercatat rapi; produk POC/buruan SAE mulai jalan; data komposisi sampah per wilayah",
    picKeterangan: "Monitoring DPL dan Kunjungan Ketua Pelaksana",
    statusPelaksanaan: "BELUM_DIMULAI",
    bidangKegiatan: "Pengolahan & Bank Sampah",
    rekomendasiAksi: [
      "Dampingi kegiatan penimbangan bank sampah: pencatatan berat anorganik, buku tabungan sampah, dan input data transaksi.",
      "Produksi Pupuk Organik Cair (POC) dan integrasikan dengan program urban farming (Buruan SAE) warga.",
      "Lakukan evaluasi tengah periode bersama DPL dan Lurah mengenai tren kepatuhan dan kesadaran masyarakat."
    ],
    pertanyaanKritis: [
      "Berapa total kilogram sampah anorganik bernilai ekonomis yang terkumpul di bank sampah selama 1 bulan terakhir?",
      "Bagaimana serapan produk kompos dan POC oleh kelompok tani / kebun warga (Buruan SAE) di wilayah tersebut?"
    ],
    tipsSukses: [
      "Ajak warga melihat langsung hasil tanaman yang subur menggunakan POC/kompos buatan sendiri."
    ],
    checklist: [
      "Pencatatan transaksi bank sampah di sistem",
      "Produksi batch pertama POC dari sampah organik",
      "Laporan evaluasi tengah periode KKN"
    ],
    indikatorKeberhasilan: [
      "Pembukuan bank sampah rapi dan transparan",
      "Produk pupuk organik dimanfaatkan untuk Buruan SAE"
    ]
  },
  {
    tahapMinggu: "Minggu 10 dan 11",
    tanggal: "14 - 27 Oktober 2026",
    startDate: new Date("2026-10-14T00:00:00.000Z"),
    endDate: new Date("2026-10-27T23:59:59.000Z"),
    fase: "Fase 3 - Implementasi & Pendampingan",
    kegiatanUtama: "Mitigasi persoalan berdasarkan data evaluasi: Edukasi masyarakat, Penguatan kelembagaan bank sampah/TPS 3R & SOP pengelolaan; Optimalisasi rute pengangkutan berdasarkan data terkumpul",
    outputTarget: "Peningkatan warga memilah; SOP kelembagaan bank sampah tersusun",
    picKeterangan: "Monitoring DPL",
    statusPelaksanaan: "BELUM_DIMULAI",
    bidangKegiatan: "Evaluasi & Pelaporan",
    rekomendasiAksi: [
      "Analisis data kelurahan: identifikasi RT/RW dengan partisipasi rendah dan lakukan edukasi door-to-door susulan.",
      "Susun dokumen Standar Operasional Prosedur (SOP) pengelolaan bank sampah dan TPS 3R mandiri pasca-KKN.",
      "Lakukan serah terima kelola sistem kepada pengurus RW, kader lingkungan, dan petugas pemilahan kelurahan."
    ],
    pertanyaanKritis: [
      "Langkah konkret apa yang diambil untuk memastikan warga tetap memilah sampah setelah mahasiswa menyelesaikan KKN?",
      "Apakah kader lingkungan dan pengurus RT/RW sudah mampu mengoperasikan aplikasi dan dashboard secara mandiri?"
    ],
    tipsSukses: [
      "Lakukan simulasi serah terima dan pastikan admin kelurahan/RW paham cara melihat laporan sistem."
    ],
    checklist: [
      "Analisis data kepatuhan rendah per RW",
      "Penyusunan draft SOP keberlanjutan pasca-KKN",
      "Pelatihan mandiri admin kelurahan & RW"
    ],
    indikatorKeberhasilan: [
      "Dokumen SOP keberlanjutan disahkan kelurahan",
      "Kader lokal mampu mengelola sistem secara mandiri"
    ]
  },
  {
    tahapMinggu: "Minggu 12",
    tanggal: "28 - 31 Oktober 2026",
    startDate: new Date("2026-10-28T00:00:00.000Z"),
    endDate: new Date("2026-10-31T23:59:59.000Z"),
    fase: "Fase 4 - Evaluasi & Penutupan",
    kegiatanUtama: "Konsolidasi capaian program seluruh kelurahan; Pengukuran indikator keberhasilan (perilaku, operasional, ekonomi sirkular, sistem digital); Finalisasi laporan akhir, video report, dan artikel ilmiah; Persiapan materi seminar hasil & publikasi konten digital; Upacara penarikan mahasiswa di Kantor Kecamatan Coblong; Unggah laporan akhir ke sistem informasi KKN",
    outputTarget: "Laporan akhir final, seminar akhir, Mahasiswa ditarik; laporan terunggah; nilai akhir keluar",
    picKeterangan: "Penilaian akhir DPL & Kelurahan (50:50)",
    statusPelaksanaan: "BELUM_DIMULAI",
    bidangKegiatan: "Evaluasi & Pelaporan",
    rekomendasiAksi: [
      "Rekapitulasi seluruh capaian kuantitatif: total tonase sampah terpilah, emisi CO2e tereduksi, dan poin keaktifan warga.",
      "Selesaikan penyusunan Laporan Akhir KKN, Video Dokumenter Program, dan Draf Artikel Ilmiah Pengabdian Masyarakat.",
      "Siapkan materi presentasi Seminar Hasil di Kantor Kecamatan Coblong dan hadiri upacara penarikan resmi.",
      "Unggah seluruh berkas laporan, logbook, dan link Google Drive luaran ke sistem informasi BERSEKA."
    ],
    pertanyaanKritis: [
      "Apakah seluruh target pada matriks program kerja awal berhasil dicapai 100% dengan bukti dokumen yang valid?",
      "Berapa nilai akhir evaluasi kontribusi dari pihak Kelurahan dan DPL (proporsi 50:50) yang telah diinput ke sistem?"
    ],
    tipsSukses: [
      "Periksa kelengkapan seluruh berkas luaran (laporan, video dokumenter, artikel ilmiah) sebelum submit final ke sistem."
    ],
    checklist: [
      "Laporan akhir KKN lengkap bertanda tangan",
      "Video dokumenter program & draf artikel ilmiah",
      "Unggah berkas luaran ke Google Drive & sistem Berseka",
      "Penilaian akhir 50:50 DPL & Kelurahan"
    ],
    indikatorKeberhasilan: [
      "Laporan akhir terunggah 100%",
      "Seminar hasil sukses dilaksanakan di Kecamatan Coblong",
      "Nilai akhir KKN diterbitkan"
    ]
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
 * Helper untuk menentukan status linimasa secara dinamis mengikuti kalender hari ini (real-time)
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

  // Jika belum ada startDate / endDate, coba parse dari teks string tanggal
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

export const inferBidangKegiatan = (kegiatanUtama: string = "", tahapMinggu: string = "", fase: string = ""): string => {
  const text = `${kegiatanUtama} ${tahapMinggu} ${fase}`.toLowerCase();
  if (text.includes("sosialisasi") || text.includes("edukasi") || text.includes("door-to-door") || text.includes("uji coba aplikasi")) {
    return "Edukasi Warga & Sosialisasi";
  }
  if (text.includes("bank sampah") || text.includes("maggot") || text.includes("poc") || text.includes("biopori") || text.includes("kompos") || text.includes("pengolahan")) {
    return "Pengolahan & Bank Sampah";
  }
  if (text.includes("pengangkutan") || text.includes("rute") || text.includes("logistik") || text.includes("tps")) {
    return "Pengangkutan & Logistik";
  }
  if (text.includes("pemilahan") || text.includes("sarana") || text.includes("pilot") || text.includes("tempat sampah") || text.includes("observasi")) {
    return "Pemilahan Sampah";
  }
  if (text.includes("evaluasi") || text.includes("laporan") || text.includes("seminar") || text.includes("penarikan") || text.includes("indikator")) {
    return "Evaluasi & Pelaporan";
  }
  return "Tata Kelola & Koordinasi";
};

/**
 * Resolver panduan rekomendasi aksi dan pertanyaan kritis untuk tahapan linimasa KKN
 */
export const resolveTimelineGuidance = (item: {
  kegiatanUtama?: string;
  tahapMinggu?: string;
  fase?: string;
  tanggal?: string;
}): TimelineGuidance => {
  const keg = (item.kegiatanUtama || "").toLowerCase();
  const minggu = (item.tahapMinggu || "").toLowerCase();
  const fase = (item.fase || "").toLowerCase();
  const tgl = (item.tanggal || "").toLowerCase();

  // 1. Cocokkan dengan salah satu default timeline jika ada kecocokan
  const matched = DEFAULT_TIMELINE_COBLONG.find((d) => {
    const dMinggu = d.tahapMinggu.toLowerCase();
    const dKeg = d.kegiatanUtama.toLowerCase();
    const dTgl = d.tanggal.toLowerCase();

    if (minggu === dMinggu && (keg.includes(dKeg.substring(0, 20)) || dKeg.includes(keg.substring(0, 20)))) {
      return true;
    }
    if (minggu === dMinggu && tgl.includes(dTgl.substring(0, 8))) {
      return true;
    }
    if (keg.includes(dKeg.substring(0, 30)) || dKeg.includes(keg.substring(0, 30))) {
      return true;
    }
    return false;
  });

  if (matched) {
    return {
      rekomendasiAksi: matched.rekomendasiAksi || [],
      pertanyaanKritis: matched.pertanyaanKritis || [],
      tipsSukses: matched.tipsSukses || [],
      checklist: matched.checklist || [],
      indikatorKeberhasilan: matched.indikatorKeberhasilan || [],
    };
  }

  // 2. Fallback cerdas berdasarkan analisis semantik kata kunci
  const rekomendasiAksi: string[] = [];
  const pertanyaanKritis: string[] = [];
  const tipsSukses: string[] = [];
  const checklist: string[] = [];
  const indikatorKeberhasilan: string[] = [];

  if (fase.includes("pra") || minggu.includes("pra")) {
    rekomendasiAksi.push(
      "Lakukan koordinasi persiapan administratif dan konfirmasi data wilayah sasaran.",
      "Pastikan seluruh anggota memahami pembagian tugas dan SOP keselamatan kerja di lapangan."
    );
    pertanyaanKritis.push(
      "Apakah seluruh data perizinan, kontak pejabat lokal, dan perangkat teknis sudah siap sebelum diterjunkan?"
    );
    tipsSukses.push("Siapkan dokumen tertulis dan jalin komunikasi intensif dengan DPL.");
    checklist.push("Koordinasi internal", "Kesiapan dokumen izin", "Perangkat & aplikasi mobile aktif");
    indikatorKeberhasilan.push("Persiapan 100% lengkap sebelum hari penerjunan");
  } else if (fase.includes("observasi") || minggu.includes("minggu 1") || minggu.includes("minggu 2")) {
    rekomendasiAksi.push(
      "Kunjungi pengurus RT/RW setempat untuk sowan dan memverifikasi data baseline warga.",
      "Petakan kondisi tempat sampah eksisting dan potensi pemilahan di wilayah dampingan.",
      "Susun matriks program kerja KKN terinci bersama DPL dan pihak kelurahan."
    );
    pertanyaanKritis.push(
      "Apakah program kerja yang dirancang benar-benar menjawab permasalahan persampahan riil di wilayah tersebut?",
      "Bagaimana kesiapan kader dan warga dalam menerima program pemilahan cerdas Berseka?"
    );
    tipsSukses.push("Utamakan pendekatan persuasif dan dengarkan aspirasi warga.");
    checklist.push("Sowan aparat RT/RW", "Penyusunan matriks proker", "Verifikasi baseline warga");
    indikatorKeberhasilan.push("Matriks program kerja disetujui DPL & Kelurahan");
  } else if (fase.includes("pilot") || minggu.includes("minggu 3") || minggu.includes("minggu 4")) {
    rekomendasiAksi.push(
      "Pasang QR Code pada tempat sampah warga di RT percontohan.",
      "Dampingi warga melakukan registrasi dan aktivasi akun hingga berstatus ACTIVE_BOUND.",
      "Uji coba flow pemilahan sampah organik-anorganik dan verifikasi pencatatan poin."
    );
    pertanyaanKritis.push(
      "Berapa persen tempat sampah warga di RT pilot yang berhasil diaktivasi tanpa kendala teknis?",
      "Apa hambatan utama warga saat pertama kali mencoba scan QR tempat sampah?"
    );
    tipsSukses.push("Dampingi warga lansia secara sabar dan berikan tutorial langsung.");
    checklist.push("Distribusi QR Code tempat sampah", "Aktivasi akun warga", "Uji coba setor sampah");
    indikatorKeberhasilan.push("RT pilot aktif dengan kepatuhan pemilahan yang terverifikasi");
  } else if (fase.includes("implementasi") || minggu.includes("minggu 5") || minggu.includes("minggu 6") || minggu.includes("minggu 7") || minggu.includes("minggu 8") || minggu.includes("minggu 9") || minggu.includes("minggu 10") || minggu.includes("minggu 11")) {
    rekomendasiAksi.push(
      "Perluas sosialisasi pemilahan sampah dan aktivasi leaderboard gamifikasi ke seluruh RW.",
      "Dampingi operasional bank sampah, produksi kompos/POC, dan penjemputan sampah terpilah.",
      "Pantau tren data kepatuhan (HSCR) di dashboard kelurahan dan lakukan intervensi pada wilayah dengan partisipasi rendah."
    );
    pertanyaanKritis.push(
      "Berapa kilogram sampah organik dan anorganik yang berhasil terpilah dan dicegah masuk ke TPA?",
      "Apakah sistem pemilahan dan bank sampah siap beroperasi secara mandiri pasca-KKN?"
    );
    tipsSukses.push("Publikasikan leaderboard warga teraktif secara berkala untuk memicu motivasi.");
    checklist.push("Pendampingan bank sampah", "Pengolahan organik (kompos/POC/biopori)", "Evaluasi berkala kepatuhan warga");
    indikatorKeberhasilan.push("Terjadi peningkatan volume sampah terpilah dan nasabah bank sampah");
  } else {
    rekomendasiAksi.push(
      "Rekapitulasi seluruh data capaian dampak (kg terpilah, emisi CO2e, poin warga, partisipasi).",
      "Selesaikan laporan akhir KKN, video dokumenter, artikel ilmiah, dan presentasi seminar hasil.",
      "Lakukan serah terima kelola sistem kepada aparatur kelurahan dan kader lingkungan."
    );
    pertanyaanKritis.push(
      "Apakah seluruh target pada matriks program kerja awal berhasil dicapai 100% dengan bukti valid?",
      "Bagaimana mekanisme keberlanjutan program pemilahan Berseka setelah masa KKN selesai?"
    );
    tipsSukses.push("Pastikan semua bukti luaran dan logbook telah disetujui DPL sebelum penutupan.");
    checklist.push("Laporan akhir KKN lengkap", "Video dokumenter & artikel", "Penilaian 50:50 DPL & Kelurahan", "Seminar hasil");
    indikatorKeberhasilan.push("100% laporan terunggah dan nilai akhir diterbitkan");
  }

  return {
    rekomendasiAksi,
    pertanyaanKritis,
    tipsSukses,
    checklist,
    indikatorKeberhasilan,
  };
};

export interface TimelineQueryParams {
  kelompokId?: string;
  kelurahan?: string;
  bidangKegiatan?: string;
  fase?: string;
  statusPelaksanaan?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export const timelineKknService = {
  /**
   * Mengambil semua linimasa sesuai role, scope kelompok, dan filter
   */
  getAll: async (params: TimelineQueryParams, userId?: string, userRole?: string) => {
    const role = (userRole || "").toUpperCase();

    // Inisialisasi data bawaan jika database masih kosong sama sekali
    try {
      const count = await prisma.timelineKkn.count();
      if (count === 0) {
        await timelineKknService.seedDefaultCoblong();
      }
    } catch (e: any) {
      console.warn("[timelineKknService.getAll] auto-seed warning:", e?.message || e);
    }

    let allowedKelompokIds: string[] | null = null; // null = dapat melihat semua kelompok

    if (role === "MAHASISWA_KKN" && userId) {
      const studentProfile = await prisma.studentKkn.findUnique({
        where: { userId },
        select: { kelompokId: true },
      });
      allowedKelompokIds = studentProfile?.kelompokId ? [studentProfile.kelompokId] : [];
    } else if (["DPL", "DOSEN_PEMBIMBING"].includes(role) && userId) {
      const kelompokBinaan = await prisma.kelompokKkn.findMany({
        where: {
          OR: [{ dplId: userId }, { dpl: { id: userId } }],
        },
        select: { id: true },
      });
      allowedKelompokIds = kelompokBinaan.map((k) => k.id);
    }

    const where: any = {};

    // Filter Scope Kelompok
    if (params.kelompokId) {
      if (params.kelompokId === "GLOBAL") {
        where.kelompokId = null;
      } else if (params.kelompokId !== "ALL") {
        where.kelompokId = params.kelompokId;
      }
    } else if (allowedKelompokIds !== null) {
      // Role dengan batas akses kelompok (Mahasiswa / DPL)
      if (allowedKelompokIds.length === 0) {
        where.kelompokId = null; // hanya bisa melihat timeline global
      } else {
        where.OR = [
          { kelompokId: { in: allowedKelompokIds } },
          { kelompokId: null }, // tetap bisa melihat acuan global
        ];
      }
    }

    // Filter Fase
    if (params.fase && params.fase !== "ALL") {
      where.fase = { contains: params.fase, mode: "insensitive" };
    }

    // Filter Status Pelaksanaan
    if (params.statusPelaksanaan && params.statusPelaksanaan !== "ALL") {
      where.statusPelaksanaan = params.statusPelaksanaan;
    }

    // Filter Pencarian Teks
    if (params.search && params.search.trim() !== "") {
      const q = params.search.trim();
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { tahapMinggu: { contains: q, mode: "insensitive" } },
            { kegiatanUtama: { contains: q, mode: "insensitive" } },
            { outputTarget: { contains: q, mode: "insensitive" } },
            { picKeterangan: { contains: q, mode: "insensitive" } },
            { tanggal: { contains: q, mode: "insensitive" } },
            { fase: { contains: q, mode: "insensitive" } },
          ],
        },
      ];
    }

    // Filter Rentang Tanggal
    if (params.startDate) {
      const start = new Date(params.startDate);
      if (!isNaN(start.getTime())) {
        where.endDate = { gte: start };
      }
    }
    if (params.endDate) {
      const end = new Date(params.endDate);
      if (!isNaN(end.getTime())) {
        where.startDate = { lte: end };
      }
    }

    const items = await prisma.timelineKkn.findMany({
      where,
      include: {
        kelompok: {
          select: { id: true, name: true, kelurahan: true },
        },
      },
      orderBy: [
        { startDate: "asc" },
        { createdAt: "asc" },
      ],
    });

    // Dinamisasi status secara real-time mengikuti kalender hari ini
    const resolvedItems = items.map((item) => {
      const dynamicStatus = computeTimelineStatus(
        item.startDate,
        item.endDate,
        item.tanggal,
        item.statusPelaksanaan
      );

      // Jika status database tidak sinkron dengan kalender hari ini, lakukan update
      if (item.statusPelaksanaan !== dynamicStatus) {
        prisma.timelineKkn
          .update({
            where: { id: item.id },
            data: { statusPelaksanaan: dynamicStatus },
          })
          .catch((err) => console.warn("[timelineKknService] auto-sync status warn:", err?.message));

        return { ...item, statusPelaksanaan: dynamicStatus };
      }

      return item;
    });

    let mapped = resolvedItems.map((item, idx) => {
      const bidang = (item as any).bidangKegiatan || inferBidangKegiatan(item.kegiatanUtama, item.tahapMinggu, item.fase);
      const kelurahan = item.kelompok?.kelurahan || (item as any).kelurahan || "Coblong (Semua Wilayah)";
      
      const guidance = resolveTimelineGuidance({
        kegiatanUtama: item.kegiatanUtama,
        tahapMinggu: item.tahapMinggu,
        fase: item.fase,
        tanggal: item.tanggal,
      });

      return {
        ...item,
        nomor: idx + 1,
        kelurahan,
        bidangKegiatan: bidang,
        kelompokNama: item.kelompok?.name || "Seluruh Kelompok KKN",
        urlGoogleDrive: (item as any).urlGoogleDrive || (item as any).linkGoogleDrive || "https://drive.google.com/drive/folders/kkn-coblong-2026",
        rekomendasiAksi: (item as any).rekomendasiAksi || guidance.rekomendasiAksi,
        pertanyaanKritis: (item as any).pertanyaanKritis || guidance.pertanyaanKritis,
        tipsSukses: (item as any).tipsSukses || guidance.tipsSukses,
        checklist: (item as any).checklist || guidance.checklist,
        indikatorKeberhasilan: (item as any).indikatorKeberhasilan || guidance.indikatorKeberhasilan,
        isCurrentActive: item.statusPelaksanaan === "SEDANG_BERJALAN",
      };
    });

    // Filter tambahan untuk kelurahan
    if (params.kelurahan && params.kelurahan !== "ALL") {
      const qKel = params.kelurahan.toLowerCase();
      mapped = mapped.filter((item) =>
        item.kelurahan.toLowerCase().includes(qKel) ||
        item.kegiatanUtama.toLowerCase().includes(qKel) ||
        item.kelurahan.toLowerCase().includes("semua") ||
        item.kelurahan.toLowerCase().includes("coblong")
      );
    }

    // Filter tambahan untuk bidang kegiatan
    if (params.bidangKegiatan && params.bidangKegiatan !== "ALL") {
      const qBid = params.bidangKegiatan.toLowerCase();
      mapped = mapped.filter((item) => item.bidangKegiatan.toLowerCase().includes(qBid));
    }

    return mapped;
  },

  /**
   * Mengambil item linimasa berdasarkan ID dengan panduan lengkap
   */
  getById: async (id: string) => {
    const item = await prisma.timelineKkn.findUnique({
      where: { id },
      include: {
        kelompok: {
          select: { id: true, name: true, kelurahan: true },
        },
      },
    });

    if (!item) return null;

    const dynamicStatus = computeTimelineStatus(
      item.startDate,
      item.endDate,
      item.tanggal,
      item.statusPelaksanaan
    );

    const bidang = (item as any).bidangKegiatan || inferBidangKegiatan(item.kegiatanUtama, item.tahapMinggu, item.fase);
    const guidance = resolveTimelineGuidance({
      kegiatanUtama: item.kegiatanUtama,
      tahapMinggu: item.tahapMinggu,
      fase: item.fase,
      tanggal: item.tanggal,
    });

    return {
      ...item,
      statusPelaksanaan: dynamicStatus,
      nomor: 1,
      bidangKegiatan: bidang,
      kelurahan: item.kelompok?.kelurahan || "Coblong (Semua Wilayah)",
      kelompokNama: item.kelompok?.name || "Seluruh Kelompok KKN",
      urlGoogleDrive: (item as any).urlGoogleDrive || (item as any).linkGoogleDrive || "https://drive.google.com/drive/folders/kkn-coblong-2026",
      rekomendasiAksi: (item as any).rekomendasiAksi || guidance.rekomendasiAksi,
      pertanyaanKritis: (item as any).pertanyaanKritis || guidance.pertanyaanKritis,
      tipsSukses: (item as any).tipsSukses || guidance.tipsSukses,
      checklist: (item as any).checklist || guidance.checklist,
      indikatorKeberhasilan: (item as any).indikatorKeberhasilan || guidance.indikatorKeberhasilan,
      isCurrentActive: dynamicStatus === "SEDANG_BERJALAN",
    };
  },

  /**
   * Endpoint Terstruktur Khusus Mobile Mahasiswa: Linimasa, Rekomendasi & Pertanyaan Kritis
   */
  getTimelineMahasiswa: async (params: TimelineQueryParams, userId?: string, userRole?: string) => {
    const items = await timelineKknService.getAll(params, userId, userRole);

    const totalTahapan = items.length;
    const totalSelesai = items.filter((i) => i.statusPelaksanaan === "SELESAI").length;
    const totalSedangBerjalan = items.filter((i) => i.statusPelaksanaan === "SEDANG_BERJALAN").length;
    const totalBelumDimulai = items.filter((i) => i.statusPelaksanaan === "BELUM_DIMULAI").length;

    const progressPercentage = totalTahapan > 0 ? Math.round((totalSelesai / totalTahapan) * 100) : 0;

    const activeItem =
      items.find((i) => i.statusPelaksanaan === "SEDANG_BERJALAN") ||
      items.find((i) => i.statusPelaksanaan === "BELUM_DIMULAI") ||
      items[items.length - 1];

    const activeWeek = activeItem?.tahapMinggu || "Minggu 1";
    const activeFase = activeItem?.fase || "Fase 1 - Persiapan & Observasi";

    // Agregasi Fase
    const faseMap = new Map<string, { fase: string; total: number; selesai: number; sedangBerjalan: number }>();
    items.forEach((item) => {
      const f = item.fase || "Tahap Pelaksanaan";
      if (!faseMap.has(f)) {
        faseMap.set(f, {
          fase: f,
          total: 0,
          selesai: 0,
          sedangBerjalan: 0,
        });
      }
      const entry = faseMap.get(f)!;
      entry.total += 1;
      if (item.statusPelaksanaan === "SELESAI") entry.selesai += 1;
      if (item.statusPelaksanaan === "SEDANG_BERJALAN") entry.sedangBerjalan += 1;
    });

    const fases = Array.from(faseMap.values()).map((f) => ({
      fase: f.fase,
      totalTahapan: f.total,
      totalSelesai: f.selesai,
      totalSedangBerjalan: f.sedangBerjalan,
      progressPercentage: f.total > 0 ? Math.round((f.selesai / f.total) * 100) : 0,
    }));

    return {
      summary: {
        totalTahapan,
        totalSelesai,
        totalSedangBerjalan,
        totalBelumDimulai,
        progressPercentage,
        activeWeek,
        activeFase,
        activeStageId: activeItem?.id || null,
        activeStageTitle: activeItem?.kegiatanUtama || null,
        todayDate: new Date().toISOString(),
      },
      fases,
      data: items,
    };
  },

  /**
   * Membuat item linimasa baru
   */
  create: async (data: {
    tahapMinggu: string;
    tanggal: string;
    startDate?: Date | null;
    endDate?: Date | null;
    fase: string;
    kegiatanUtama: string;
    outputTarget: string;
    picKeterangan: string;
    statusPelaksanaan?: string;
    kelompokId?: string | null;
  }) => {
    return prisma.timelineKkn.create({
      data: {
        tahapMinggu: data.tahapMinggu.trim(),
        tanggal: data.tanggal.trim(),
        startDate: data.startDate || null,
        endDate: data.endDate || null,
        fase: data.fase.trim(),
        kegiatanUtama: data.kegiatanUtama.trim(),
        outputTarget: data.outputTarget.trim(),
        picKeterangan: data.picKeterangan.trim(),
        statusPelaksanaan: data.statusPelaksanaan || "BELUM_DIMULAI",
        kelompokId: data.kelompokId && data.kelompokId !== "GLOBAL" ? data.kelompokId : null,
      },
      include: {
        kelompok: {
          select: { id: true, name: true, kelurahan: true },
        },
      },
    });
  },

  /**
   * Mengupdate item linimasa
   */
  update: async (
    id: string,
    data: Partial<{
      tahapMinggu: string;
      tanggal: string;
      startDate: Date | null;
      endDate: Date | null;
      fase: string;
      kegiatanUtama: string;
      outputTarget: string;
      picKeterangan: string;
      statusPelaksanaan: string;
      kelompokId: string | null;
    }>
  ) => {
    const payload: any = {};
    if (data.tahapMinggu !== undefined) payload.tahapMinggu = data.tahapMinggu.trim();
    if (data.tanggal !== undefined) payload.tanggal = data.tanggal.trim();
    if (data.startDate !== undefined) payload.startDate = data.startDate;
    if (data.endDate !== undefined) payload.endDate = data.endDate;
    if (data.fase !== undefined) payload.fase = data.fase.trim();
    if (data.kegiatanUtama !== undefined) payload.kegiatanUtama = data.kegiatanUtama.trim();
    if (data.outputTarget !== undefined) payload.outputTarget = data.outputTarget.trim();
    if (data.picKeterangan !== undefined) payload.picKeterangan = data.picKeterangan.trim();
    if (data.statusPelaksanaan !== undefined) payload.statusPelaksanaan = data.statusPelaksanaan;
    if (data.kelompokId !== undefined) {
      payload.kelompokId = data.kelompokId && data.kelompokId !== "GLOBAL" ? data.kelompokId : null;
    }

    return prisma.timelineKkn.update({
      where: { id },
      data: payload,
      include: {
        kelompok: {
          select: { id: true, name: true, kelurahan: true },
        },
      },
    });
  },

  /**
   * Mengubah status pelaksanaan secara cepat
   */
  updateStatus: async (id: string, statusPelaksanaan: string) => {
    const validStatuses = ["BELUM_DIMULAI", "SEDANG_BERJALAN", "SELESAI"];
    if (!validStatuses.includes(statusPelaksanaan)) {
      throw new Error("Status pelaksanaan tidak valid. Harus BELUM_DIMULAI, SEDANG_BERJALAN, atau SELESAI");
    }

    return prisma.timelineKkn.update({
      where: { id },
      data: { statusPelaksanaan },
      include: {
        kelompok: {
          select: { id: true, name: true, kelurahan: true },
        },
      },
    });
  },

  /**
   * Menghapus item linimasa
   */
  delete: async (id: string) => {
    return prisma.timelineKkn.delete({
      where: { id },
    });
  },

  /**
   * Import batch dari array JSON / Excel yang sudah diparsing
   */
  bulkImport: async (
    items: Array<{
      tahapMinggu: string;
      tanggal: string;
      startDate?: string | Date | null;
      endDate?: string | Date | null;
      fase: string;
      kegiatanUtama: string;
      outputTarget: string;
      picKeterangan: string;
      statusPelaksanaan?: string;
      kelompokId?: string | null;
    }>,
    mode: "APPEND" | "REPLACE" = "APPEND",
    targetKelompokId?: string | null
  ) => {
    const resolvedKelompokId = targetKelompokId && targetKelompokId !== "GLOBAL" ? targetKelompokId : null;

    if (mode === "REPLACE") {
      // Hapus data lama pada scope kelompok tersebut
      await prisma.timelineKkn.deleteMany({
        where: {
          kelompokId: resolvedKelompokId,
        },
      });
    }

    const createdItems = [];
    for (const item of items) {
      if (!item.kegiatanUtama || !item.tahapMinggu) continue;

      let startD: Date | null = null;
      let endD: Date | null = null;

      if (item.startDate) {
        const d = new Date(item.startDate);
        if (!isNaN(d.getTime())) startD = d;
      }
      if (item.endDate) {
        const d = new Date(item.endDate);
        if (!isNaN(d.getTime())) endD = d;
      }

      const created = await prisma.timelineKkn.create({
        data: {
          tahapMinggu: String(item.tahapMinggu).trim(),
          tanggal: String(item.tanggal || "").trim() || "Sesuai Jadwal",
          startDate: startD,
          endDate: endD,
          fase: String(item.fase || "Fase 1: Persiapan").trim(),
          kegiatanUtama: String(item.kegiatanUtama).trim(),
          outputTarget: String(item.outputTarget || "-").trim(),
          picKeterangan: String(item.picKeterangan || "-").trim(),
          statusPelaksanaan: item.statusPelaksanaan || "BELUM_DIMULAI",
          kelompokId: item.kelompokId !== undefined ? (item.kelompokId && item.kelompokId !== "GLOBAL" ? item.kelompokId : null) : resolvedKelompokId,
        },
      });
      createdItems.push(created);
    }

    return {
      importedCount: createdItems.length,
      mode,
    };
  },

  /**
   * Seed acuan default Coblong jika diperlukan
   */
  seedDefaultCoblong: async (forceReplace = false) => {
    if (forceReplace) {
      await prisma.timelineKkn.deleteMany({
        where: { kelompokId: null },
      });
    }

    const creates = DEFAULT_TIMELINE_COBLONG.map((item) =>
      prisma.timelineKkn.create({
        data: {
          tahapMinggu: item.tahapMinggu,
          tanggal: item.tanggal,
          startDate: item.startDate,
          endDate: item.endDate,
          fase: item.fase,
          kegiatanUtama: item.kegiatanUtama,
          outputTarget: item.outputTarget,
          picKeterangan: item.picKeterangan,
          statusPelaksanaan: item.statusPelaksanaan,
          kelompokId: null,
        },
      })
    );

    return prisma.$transaction(creates);
  },
};
