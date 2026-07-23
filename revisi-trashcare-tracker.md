# Revisi TrashCare Tracker

## 1. BRANDING & INFRASTRUKTUR
- [ ] Ganti nama aplikasi & semua referensi teks dari "Pilah Sampah Cerdas" menjadi "TrashCare" di seluruh web & mobile.
- [ ] Pasang logo baru TrashCare (asset sudah ada, minta filenya) di header/navbar/splash screen/favicon.
- [ ] Tambahkan halaman/section "Tentang Aplikasi" menampilkan: nama aplikasi (TrashCare), versi (mulai 1.0.0 saat rilis — siapkan konstanta versi terpusat, jangan hardcode di banyak tempat), logo.
- [ ] Hosting tetap di VPS existing, tidak perlu migrasi.

## 2. PENAMAAN DATABASE — BAHASA INDONESIA BAKU (KBBI)
- [ ] Audit SEMUA nama tabel & kolom database, buat migration untuk rename ke Bahasa Indonesia baku sesuai KBBI.
- [ ] Buat dokumen mapping-nama-tabel.md berisi nama lama -> nama baru untuk semua tabel/kolom yang diubah.
- [ ] Migration WAJIB reversible, backup database dulu sebelum eksekusi.

## 3. BERAT SAMPAH — DUA MEKANISME BERBEDA (WAJIB DIBEDAKAN)
- [ ] WARGA: tetap pakai foto -> AI deteksi -> hasil berat (kg) + klasifikasi organik/anorganik.
- [ ] PETUGAS RESIDU: TIDAK pakai AI — pakai timbangan IoT (manual input) + WAJIB foto dokumentasi.
- [ ] AI Warga WAJIB mendukung deteksi CAMPURAN dalam satu foto (hasil deteksi berupa breakdown per kategori dalam satu response).

## 4. QR CODE — FORMAT & ALUR
- [ ] Format QR: `[JENIS][NNNN][TAHUN]` (lanjutkan nomor urut existing, unique constraint).
- [ ] State machine QR TETAP ADA (PRINTED -> ASSIGNED_TO_PIC -> ACTIVE -> NONAKTIF/BROKEN) dan approval RW.
- [ ] Alur baru: Warga & Mahasiswa punya akun terpisah -> Mahasiswa bantu Warga aktivasi (scan 2 QR) -> RW approve -> kepemilikan tercatat, catat `dibantu_oleh_mahasiswa_id`.
- [ ] Peta GIS: 2 tong (organik+anorganik) milik satu RT digabung jadi SATU marker.
- [ ] Dokumentasi foto tong: diambil rutin saat buang sampah.
- [ ] Kapasitas tong: ubah manual WAJIB pakai foto bukti.

## 5. ROLE & HIERARKI — TAMBAH ROLE RT, SEDERHANAKAN UI MONITORING-ONLY
- [ ] Tambah role RT (read-only scope RT).
- [ ] RW melihat scope RT dan warganya.
- [ ] Kelurahan ambil data agregat dari RW + Warga & Petugas Residu.
- [ ] Validasi: 1 RW WAJIB punya 1 Petugas Residu.
- [ ] UI Super Admin: hapus widget tidak penting.
- [ ] UI Admin DLH, Camat, Kelurahan: Sembunyikan total semua CRUD, hanya grafik dan monitoring.

## 6. GAMIFIKASI — FORMULA & PENALTY DIPERBARUI
- [ ] Formula poin: `confidence x poin_basic(10)`, dihitung terpisah per kategori jika campuran, akumulasi ke total.
- [ ] Misi jam 06-08 & 16-18 (luar jam tetap dapat poin dasar tanpa bonus).
- [ ] Penalty: -1 poin/hari berturut, floor di 0.
- [ ] Motivasi/kondisi: rule-based template (if streak > X hari), simpan di DB.
- [ ] Fase Mahasiswa: Threshold aktif vs reminder (satuan hari/bulan per mahasiswa), beralih fungsi notifikasi otomatis.

## 7. PETUGAS RESIDU — ALUR KERJA LAPANGAN
- [ ] Rute bebas (tidak diatur sistem).
- [ ] Setiap pengambilan: foto dokumentasi + hasil timbang (manual).
- [ ] Kategori residu: 1 kategori umum "Residu".
- [ ] Grafik tren volume residu.

## 8. DASHBOARD — DISEDERHANAKAN
- [ ] Hapus peta dari dashboard (pindah ke GIS).
- [ ] Hapus widget "Aktivitas Terbaru" (pindah ke Log Aktivitas).
- [ ] Dashboard utama hanya: grafik komposisi sampah, tren setoran, kepatuhan wilayah, performa.
- [ ] Bar Chart Race untuk grafik balapan real-time.
- [ ] Aktor dievaluasi: Warga, Petugas Residu, RT, RW.
- [ ] Rekap Setoran: data default scope login, fungsi filter untuk export dan grouping kohort.

## 9. GIS — PETA BERJENJANG 3 LEVEL ZOOM
- [ ] Halaman GIS terpisah. Level 1 (Kelurahan), Level 2 (RW), Level 3 (RT & titik individu gabungan 2 bin).
- [ ] Setiap level tampilkan grafik performa samping peta, animasi halus.

## 10. KATEGORI SAMPAH — HALAMAN PANDUAN BARU
- [ ] Halaman "Panduan Kategori Sampah" (terpisah dari AI scan) dengan contoh foto.
- [ ] Struktur data tabel kategori (dengan `url_foto_contoh`) edit via admin.

## STANDAR UI
- [ ] Modern, clean, minim.
- [ ] Konsisten dengan design system (Lucide, warna hijau/biru).
- [ ] Tetap loading/error state via API asli.
