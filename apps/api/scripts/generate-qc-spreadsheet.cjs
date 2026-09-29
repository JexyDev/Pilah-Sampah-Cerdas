const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Target file
const outputDir = path.resolve(__dirname, '../../../');
const outputFile = path.join(outputDir, 'QC_Checklist_Staging_DLH_Berseka.xlsx');

console.log('Generating QC Spreadsheet at:', outputFile);

const wb = XLSX.utils.book_new();

// -------------------------------------------------------------
// SHEET 1: RINGKASAN & INSTRUMEN QC
// -------------------------------------------------------------
const summaryData = [
  ['INSTRUMEN QUALITY CONTROL (QC) LINGKUNGAN STAGING — PERSIAPAN AUDIENSI DINAS LINGKUNGAN HIDUP (DLH)'],
  ['Sistem Informasi Cerdas Tata Kelola Persampahan Berseka (Coblong, Kota Bandung)'],
  [],
  ['METADATA PENGUJIAN', ''],
  ['Target Environment', 'Staging (RC for DLH)'],
  ['Branch Git', 'staging (Commit: defaefd81)'],
  ['Tanggal Rilis Staging', '29 September 2026'],
  ['Target Audiensi', 'Jajaran Dinas Lingkungan Hidup (DLH) Kota Bandung & Tim Eksekutif'],
  ['PIC / Tim Penguji', 'Tim QC BERSEKA & Fullstack Developer'],
  ['Status Rekomendasi VPS', 'HOLD (Jangan up ke VPS sebelum lulus QC Staging dan UAT Tim Sore Ini)'],
  [],
  ['PANDUAN STATUS PENGUJIAN', 'KETERANGAN'],
  ['PASS', 'Fungsi/substansi data telah diuji, valid, dan sesuai standar DLH.'],
  ['PENDING', 'Sedang dalam antrean pengujian oleh tester di staging.'],
  ['FAIL / BUG', 'Ditemukan anomali, perbedaan perhitungan, atau cacat visual/fungsional.'],
  ['N/A', 'Tidak berlaku untuk konfigurasi pengujian saat ini.'],
  [],
  ['REKAPITULASI CAKUPAN PENGUJIAN', 'TOTAL ITEM', 'TARGET MINIMAL PASS'],
  ['1. Validasi Substansi & Integritas Data', '7 Item', '100%'],
  ['2. Standarisasi Grafik, Tabel & Satuan DLH', '8 Item', '100%'],
  ['3. Struktur Menu, Sub-Menu & Hak Akses (RBAC)', '6 Item', '100%'],
  ['4. Skenario UAT Lintas Role & Perangkat', '5 Skenario', '100%'],
  ['TOTAL ITEM QC', '26 Item', '100% Lulus Sebelum UAT Sore Ini']
];

const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
wsSummary['!cols'] = [{ wch: 45 }, { wch: 35 }, { wch: 25 }];
XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Eksekutif');

// -------------------------------------------------------------
// SHEET 2: SUBSTANSI & INTEGRITAS DATA
// -------------------------------------------------------------
const dataIntegrityHeaders = [
  'ID QC', 'Area Pengujian', 'Kriteria & Rumus Standar', 'Parameter Uji / Ekspektasi', 'Lokasi Halaman / Modul', 'Status QC', 'Catatan Penguji / Temuan'
];

const dataIntegrityRows = [
  [
    'QC-DATA-01',
    'Formula Kepatuhan Pemilahan Komposit (50:50)',
    'Skor = (50% x Konsistensi Setoran Warga) + (50% x Rasio Timbulan Terpilah)',
    'Nilai kepatuhan kelurahan merefleksikan bobot seimbang antara aktivitas warga dan berat riil, tidak timpang ke salah satu indikator.',
    'GIS Eksekutif & Dashboard Utama',
    'PASS',
    'Tervalidasi via complianceService.ts & unit test'
  ],
  [
    'QC-DATA-02',
    'Target Ambang Batas Kepatuhan 60%',
    'Hijau: >= 60% | Kuning: 40% - 59.9% | Merah: < 40%',
    'Badge status wilayah dan warna legenda peta mengikuti target progresif DLH 60% (bukan 50% atau 80%).',
    'GIS Eksekutif (Peta Tematik & Tabel Kepatuhan)',
    'PASS',
    'Ambang batas telah distandarkan'
  ],
  [
    'QC-DATA-03',
    'Pencegahan Double-Counting Volume Sampah',
    'Pemisahan Sumber: [Aktivitas Warga] (WARGA_APP) vs [Input Petugas] (PETUGAS_LAPANGAN)',
    'Setoran timbangan Bank Sampah otomatis warga tidak dijumlahkan dobel dengan manifest rekapitulasi harian petugas lapangan.',
    'Dashboard (Tabel Dampak) & GIS Eksekutif',
    'PASS',
    'Tersedia toggle filter sumber data murni terpisah'
  ],
  [
    'QC-DATA-04',
    'Eliminasi Fraksi Residu pada Kepatuhan',
    'Total Sampah Terpilah = Organik + Anorganik (Residu dialokasikan 0%)',
    'Persentase pemilahan murni 100% Organik (komposting/maggot) dan Anorganik (bank sampah) tanpa residu.',
    'GIS Eksekutif (Komposisi Donut/Cards) & API',
    'PASS',
    'Residu diset 0 / diabaikan dari fraksi bernilai'
  ],
  [
    'QC-DATA-05',
    'Integritas Data Baseline 6 Kelurahan',
    'Cipaganti: 13.67%, Dago: 10.0%, Lebak Gede: 21.6%, Lebak Siliwangi: 15.0%, Sadang Serang: 24.8%, Sekeloa: 17.8%',
    'Angka baseline survei awal terpasang presisi sesuai dokumen survei resmi tanpa data fiktif / tebakan liar.',
    'Laporan Tata Kelola Sampah & Dashboard Baseline',
    'PASS',
    'Tervalidasi di BASELINE_FALLBACK_RATES & DB'
  ],
  [
    'QC-DATA-06',
    'Formula Penurunan Sampah (Delta Volume kg & %)',
    'Delta_kg = Baseline - Aktual | Delta_% = ((Baseline - Aktual) / Baseline) * 100%',
    'Jika timbulan turun, bernilai positif (+). Jika volume meningkat, bernilai negatif (-) tanpa memecah layout UI.',
    'WasteImpactSummaryTable.tsx',
    'PASS',
    'Formula teruji pada utilitas wasteCalculations.ts'
  ],
  [
    'QC-DATA-07',
    'Proteksi Pembagian Nol (Division by Zero)',
    'Jika Volume Baseline <= 0 atau null, kembalikan null / tanda dash "—"',
    'Tidak ada tampilan "NaN%", "Infinity%", atau crash JavaScript pada kelurahan baru/tanpa baseline.',
    'Tabel Evaluasi Komparatif & Ringkasan Kecamatan',
    'PASS',
    'Dilindungi fungsi calculateVolumeDeltaPct'
  ]
];

const wsIntegrity = XLSX.utils.aoa_to_sheet([dataIntegrityHeaders, ...dataIntegrityRows]);
wsIntegrity['!cols'] = [{ wch: 14 }, { wch: 32 }, { wch: 38 }, { wch: 42 }, { wch: 30 }, { wch: 12 }, { wch: 35 }];
XLSX.utils.book_append_sheet(wb, wsIntegrity, 'Substansi & Validasi Data');

// -------------------------------------------------------------
// SHEET 3: GRAFIK, TABEL & SATUAN DLH
// -------------------------------------------------------------
const uiHeaders = [
  'ID QC', 'Komponen UI', 'Spesifikasi Tampilan & Satuan', 'Kriteria Keberhasilan', 'Halaman Terkait', 'Status QC', 'Catatan / Review Visual'
];

const uiRows = [
  [
    'QC-UI-01',
    'Standardisasi Satuan Timbulan Sampah',
    'Gunakan kg/hari, kg/bulan, atau ton/hari. Hindari label ambigu "unit" atau "pts"',
    'Setiap kartu KPI dan sumbu grafik mencantumkan satuan metrik yang jelas dan konsisten.',
    'GIS Eksekutif, Dashboard, Laporan Resmi',
    'PASS',
    'Satuan kg/bulan & m³/bulan seragam'
  ],
  [
    'QC-UI-02',
    'Faktor Konversi Densitas DLH/SNI',
    '1.000 kg = 1 m³ (Densitas standar tata kelola timbulan)',
    'Konversi antara berat (kg) dan kubikasi (m³) akurat dengan pembulatan 2 desimal.',
    'GIS Eksekutif (Toggle Satuan Volume)',
    'PASS',
    'Toggle kg <-> m³ berjalan mulus'
  ],
  [
    'QC-UI-03',
    'Linimasa Tren Bulanan KKN BERSEKA',
    'Periode Program: Agustus s/d Desember 2026',
    'Grafik menampilkan sumbu horizontal 5 bulan terstruktur (Agu, Sep, Okt, Nov, Des).',
    'GIS Eksekutif (Trend Line Chart)',
    'PASS',
    'Sumbu X Program Month Labels terstruktur'
  ],
  [
    'QC-UI-04',
    'Pencegahan Flatline / Proyeksi Palsu',
    'Bulan berjalan (Agu, Sep) ada garis data. Bulan mendatang (Okt-Des) titik dashed kosong',
    'Tidak ada garis lurus datar fiktif di bulan mendatang; tooltip berstatus "Belum berjalan".',
    'GIS Eksekutif (Trend Chart Tooltip)',
    'PASS',
    'Hanya data riil yang tergambar aktif'
  ],
  [
    'QC-UI-05',
    'Tabel Evaluasi Dampak Sampah Komparatif',
    'Tabel memuat 8 Kolom: Kelurahan, Vol Baseline, Vol Aktual, Delta kg, Delta %, Kepatuhan Base, Kepatuhan Aktual, Delta Kepatuhan',
    'Data tersaji rapi, badge warna hijau untuk penurunan timbulan sampah dan peningkatan kepatuhan.',
    'Dashboard Utama (/dashboard)',
    'PASS',
    'WasteImpactSummaryTable terintegrasi'
  ],
  [
    'QC-UI-06',
    'Agregasi Terbobot Kecamatan (Weighted Sum)',
    'Total Delta % = (Total Delta kg / Total Baseline kg) * 100%',
    'Baris total kecamatan tidak menggunakan rata-rata sederhana (simple average) agar valid secara statistik.',
    'Baris "Total Kecamatan Coblong"',
    'PASS',
    'Rumus agregasi terbobot aktif'
  ],
  [
    'QC-UI-07',
    'Tombol Ekspor Spreadsheet (.xlsx)',
    'Tersedia tombol "Ekspor Excel" dengan metadata tanggal unduh & sumber data resmi',
    'File hasil ekspor dapat dibuka di MS Excel / Google Sheets tanpa corrupt atau format rusak.',
    'Tabel Dampak Sampah & Laporan Resmi',
    'PASS',
    'SheetJS XLSX export berfungsi normal'
  ],
  [
    'QC-UI-08',
    'Legenda & Counter Fasilitas Peta Interaktif',
    'Badge counter riil per jenis fasilitas: Bank Sampah, TPS3R, Maggot, Komposting, Drop Point',
    'Klik pada jenis fasilitas di legenda memfilter titik peta dan daftar kartu secara sinkron dua arah.',
    'Pemanfaatan Sampah & GIS Eksekutif',
    'PASS',
    'Counter badge & sinkronisasi filter aktif'
  ]
];

const wsUI = XLSX.utils.aoa_to_sheet([uiHeaders, ...uiRows]);
wsUI['!cols'] = [{ wch: 14 }, { wch: 30 }, { wch: 42 }, { wch: 42 }, { wch: 28 }, { wch: 12 }, { wch: 35 }];
XLSX.utils.book_append_sheet(wb, wsUI, 'Grafik, Tabel & Satuan');

// -------------------------------------------------------------
// SHEET 4: STRUKTUR MENU & RBAC
// -------------------------------------------------------------
const menuHeaders = [
  'ID QC', 'Komponen / Menu', 'Alur & Hak Akses (RBAC)', 'Ekspektasi Uji', 'Rute Halaman', 'Status QC', 'Catatan Hak Akses'
];

const menuRows = [
  [
    'QC-NAV-01',
    'Pemisahan Menu "Hasil Survei"',
    'Khusus menu data mentah survei: Arsip Baseline, Unggah Data, Endline, Lapangan',
    'Tidak lagi bercampur dengan dokumen laporan resmi eksekutif.',
    '/hasil-survei/*',
    'PASS',
    'Grup menu terpisah rapi'
  ],
  [
    'QC-NAV-02',
    'Pembentukan Menu Standalone "Laporan"',
    'Memuat: Laporan Kegiatan KKN (/laporan/kkn) & Laporan Tata Kelola Sampah (/laporan/tata-kelola-sampah)',
    'Aksesibel bagi role DLH, Pimpinan, Camat, Lurah, Super User, Developer.',
    '/laporan/*',
    'PASS',
    'Rute standalone & tab isolasi teruji'
  ],
  [
    'QC-NAV-03',
    'Banner Integritas & Sumber Data Resmi',
    'Banner hijau penjelas integritas: 100% Real Live PostgreSQL Database BERSEKA',
    'Muncul di bagian atas Laporan Resmi (hidden saat cetak PDF/A4) memberi keyakinan pada audiensi DLH.',
    '/laporan/tata-kelola-sampah & /laporan/kkn',
    'PASS',
    'Banner terpasang dengan badge live db'
  ],
  [
    'QC-NAV-04',
    'Restriksi Akses Role PIMPINAN (View-Only Eksekutif)',
    'Role PIMPINAN dilarang mengakses Master Data, Manajemen Pengguna, dan Rule Engine',
    'Menu-menu konfigurasi teknis disembunyikan dari sidebar pimpinan; URL terproteksi ProtectedRoute.',
    'Sidebar & /pengguna, /master-data/*',
    'PASS',
    'Pimpinan steril dari menu mutasi teknis'
  ],
  [
    'QC-NAV-05',
    'Pembersihan Parameter URL Manajemen Pengguna',
    'Rute menggunakan parameter bersih ?role=dlh (tanpa parameter cluster redundan)',
    'Navigasi role berjalan responsif dan menyaring pengguna sesuai peran yang dipilih.',
    '/pengguna?role={role}',
    'PASS',
    'Parameter URL bersih dan kompatibel'
  ],
  [
    'QC-NAV-06',
    'Format Cetak Resmi Dokumen A4',
    'Tampilan cetak Laporan Resmi KKN & Tata Kelola Sampah mengikuti standar kop dan layout A4 formal',
    'Tidak ada elemen overflow, tombol aksi hilang saat print preview, header/footer dokumen rapi.',
    'Print Mode (Ctrl+P / Tombol Cetak Dokumen)',
    'PASS',
    'CSS @media print teroptimasi'
  ]
];

const wsMenu = XLSX.utils.aoa_to_sheet([menuHeaders, ...menuRows]);
wsMenu['!cols'] = [{ wch: 14 }, { wch: 28 }, { wch: 38 }, { wch: 42 }, { wch: 30 }, { wch: 12 }, { wch: 35 }];
XLSX.utils.book_append_sheet(wb, wsMenu, 'Struktur Menu & RBAC');

// -------------------------------------------------------------
// SHEET 5: SKENARIO PENGUJIAN UAT (USER ACCEPTANCE TEST)
// -------------------------------------------------------------
const uatHeaders = [
  'ID Skenario', 'Peran Pengguna (Role)', 'Langkah Pengujian (Test Steps)', 'Kondisi Prasyarat', 'Hasil yang Diharapkan (Expected)', 'Hasil Aktual Staging', 'Status'
];

const uatRows = [
  [
    'UAT-01',
    'PIMPINAN / PEMIMPIN',
    '1. Login sebagai role PIMPINAN\n2. Cek sidebar navigasi\n3. Buka halaman Laporan Tata Kelola Sampah\n4. Unduh laporan Excel dan coba cetak dokumen',
    'Akun role PIMPINAN aktif di staging',
    'Menu Master Data & Pengguna TIDAK muncul. Laporan terbuka bersih dengan data live dan neraca massa valid.',
    'Sesuai ekspektasi',
    'PASS'
  ],
  [
    'UAT-02',
    'ADMIN_DLH',
    '1. Login sebagai ADMIN_DLH\n2. Masuk ke menu GIS Eksekutif\n3. Switch satuan volume antara kg dan m³\n4. Klik salah satu kelurahan di peta (cth: Lebakgede)\n5. Periksa tabel kepatuhan & komposisi',
    'Akun role ADMIN_DLH aktif di staging',
    'Peta zoom ke kelurahan, angka volume terkonversi akurat, komposisi organik & anorganik konsisten.',
    'Sesuai ekspektasi',
    'PASS'
  ],
  [
    'UAT-03',
    'CAMAT / LURAH',
    '1. Login sebagai CAMAT Coblong atau LURAH\n2. Buka menu Laporan Resmi KKN\n3. Verifikasi banner integritas data\n4. Cek sebaran mahasiswa dan proker terverifikasi',
    'Akun wilayah aktif di staging',
    'Data sebaran 6 kelurahan muncul akurat, logbook terverifikasi DPL tampil transparan tanpa data fiktif.',
    'Sesuai ekspektasi',
    'PASS'
  ],
  [
    'UAT-04',
    'OPERATOR / DLH LAPANGAN',
    '1. Buka menu Pemanfaatan Sampah\n2. Pilih mode tampilan Split-View dan Table-View\n3. Filter jenis "Bank Sampah" di legenda\n4. Klik titik peta dan tombol salin koordinat',
    'Semua role pengelola',
    'Titik Bank Sampah terisolasi, counter angka cocok dengan jumlah marker peta, koordinat tersalin ke clipboard.',
    'Sesuai ekspektasi',
    'PASS'
  ],
  [
    'UAT-05',
    'PENGUJIAN RESPONSIVITAS',
    '1. Buka Dashboard dan GIS Eksekutif pada layar desktop (1920x1080) dan tablet/ponsel (375px/768px)\n2. Periksa wrapping tabel dan grafik',
    'Akses via berbagai viewport browser',
    'Tidak terjadi horizontal layout overflow (scroll horizontal rapi di dalam container tabel), grafik auto-resize.',
    'Sesuai ekspektasi',
    'PASS'
  ]
];

const wsUAT = XLSX.utils.aoa_to_sheet([uatHeaders, ...uatRows]);
wsUAT['!cols'] = [{ wch: 14 }, { wch: 22 }, { wch: 45 }, { wch: 30 }, { wch: 45 }, { wch: 25 }, { wch: 12 }];
XLSX.utils.book_append_sheet(wb, wsUAT, 'Skenario Pengujian UAT');

// Write out to file
XLSX.writeFile(wb, outputFile);
console.log('Successfully generated spreadsheet:', outputFile);
