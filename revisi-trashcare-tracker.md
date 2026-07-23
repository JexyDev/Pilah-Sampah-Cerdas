# 📋 Tracker Revisi TrashCare (v1.0.0)

## 1. BRANDING & INFRASTRUKTUR
- [ ] Ganti nama aplikasi "Pilah Sampah Cerdas" -> "TrashCare" (Web & Mobile).
- [ ] Pasang logo baru TrashCare di header/navbar/splash screen/favicon.
- [ ] Tambah halaman "Tentang Aplikasi" (Nama, Versi dari konstanta, Logo).
- [ ] (Hosting tetap di VPS, tidak perlu migrasi).

## 2. PENAMAAN DATABASE (BAHASA INDONESIA BAKU)
- [ ] Audit SEMUA nama tabel & kolom database.
- [ ] Buat `mapping-nama-tabel.md` untuk direview sebelum eksekusi.
- [ ] Buat dan jalankan reversible migration (rename `users` -> `pengguna`, `bins` -> `tong_sampah`, dll).

## 3. BERAT SAMPAH — DUA MEKANISME
- [ ] **Warga**: Pakai AI deteksi gambar (tanpa timbangan fisik). Deteksi campuran organik/anorganik dalam 1 foto, breakdown poin & berat per kategori.
- [ ] **Petugas Residu**: Input manual timbangan (sebagai placeholder IoT) + Wajib foto dokumentasi riil. (Tanpa AI).

## 4. QR CODE & PETA
- [ ] Format QR baru: `[JENIS][NNNN][TAHUN]` (e.g., ORG00002026), lanjut nomor urut, unique constraint di DB.
- [ ] State QR (PRINTED -> ASSIGNED_TO_PIC -> ACTIVE -> BROKEN/INACTIVE) dan approval RW tetap dipertahankan.
- [ ] Alur aktivasi: Mahasiswa bantu scan 2 QR (organik & anorganik) -> submit RW -> saat disetujui, kepemilikan masuk ke akun Warga & sistem mencatat mahasiswa pembantu.
- [ ] Peta GIS: Gabung 2 tong menjadi 1 titik marker per rumah tangga di visualisasi peta (Data tetap 2 record di DB).
- [ ] Foto dokumentasi tong diambil bersamaan saat buang sampah (bukan berkala terpisah).
- [ ] Ubah kapasitas tong oleh warga harus wajib disertai foto bukti (default 25kg).

## 5. ROLE & HIERARKI (TAMBAH RT)
- [ ] Tambah Role **RT** (punya login, scope read-only data warga RT-nya).
- [ ] Role **RW** melihat data & agregasi RT di wilayahnya.
- [ ] Role **Kelurahan** agregasi RW + data aktivitas Warga & Petugas Residu.
- [ ] Validasi pendaftaran: 1 RW wajib punya TEPAT 1 Petugas Residu.
- [ ] Revisi UI Super Admin: Hapus widget yang tidak informatif di Dashboard.
- [ ] Revisi UI Admin DLH/Camat/Lurah/RT: Hapus TOTAL elemen/tombol CRUD (hilang dari UI, bukan hanya disable).

## 6. GAMIFIKASI & PENALTY
- [ ] Formula poin: `confidence x poin_basic(10)`, dihitung terpisah per kategori lalu diakumulasikan.
- [ ] Jadwal misi (06-08 & 16-18): Di luar jam ini tetap dapat poin dasar tanpa bonus.
- [ ] Penalty tidak setor: Mulai -1 di hari pertama absen, bertambah akumulatif per hari. Poin berhenti berkurang di 0 (floor=0), tetap kirim notifikasi.
- [ ] Template pesan motivasi rule-based di database (berdasarkan streak). Tanpa AI LLM generatif.
- [ ] Transisi Mahasiswa KKN: Tambah field konfigurasi manual (threshold aktif). Saat lewat threshold, fitur mahasiswa beralih jadi reminder notifikasi.

## 7. PETUGAS RESIDU ALUR
- [ ] Rute pengambilan bebas diatur petugas.
- [ ] Pengambilan wajib: foto dokumentasi + input timbangan manual.
- [ ] Kategori tunggal "Residu" (rincian menggunakan teks notes).
- [ ] Grafik tren volume residu per waktu (naik/turun).

## 8. DASHBOARD SIMPLIFIKASI
- [ ] Pindahkan peta dari Dashboard ke halaman GIS terpisah.
- [ ] Pindahkan "Aktivitas Terbaru" ke halaman Log Aktivitas.
- [ ] Dashboard Utama HANYA berisi: Grafik komposisi, tren setoran, kepatuhan wilayah, dan performa waktu.
- [ ] Tambah Bar Chart Race (Ranking dinamis & animatif).
- [ ] Aktor yang masuk evaluasi: Warga, Petugas Residu, RT, RW (Mahasiswa KKN tidak dimasukkan).
- [ ] Rekap Setoran: Tambah sortir/filter (RT/RW/Kategori/Periode) yang terhubung dengan Export CSV dan pengelompokan kohort tantangan.

## 9. GIS 3-LEVEL ZOOM
- [ ] Halaman GIS berdiri sendiri.
- [ ] Navigasi 3 level: ZONA Kelurahan -> klik -> ZONA RW -> klik -> Titik Warga per RT.
- [ ] Warna zona berdasar skor kepatuhan (tinggi/sedang/rendah).
- [ ] Tiap zoom menampilkan grafik performa wilayah bersangkutan dengan transisi animasi halus.

## 10. KATEGORI SAMPAH PANDUAN BARU
- [ ] Buat UI Panduan Kategori (card + foto contoh visual + deskripsi).
- [ ] Terpisah dari fitur scan.
- [ ] Struktur data di-setup dengan dinamis (database-driven) agar mudah di-update oleh Admin (Aset menyusul).
