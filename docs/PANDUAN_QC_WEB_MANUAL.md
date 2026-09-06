# PANDUAN & CHECKLIST TESTING QC WEB MANUAL (BERSEKA)

> **Versi Dokumen:** 1.0 (Manual Web QA Checklist)  
> **Lokasi File:** `docs/PANDUAN_QC_WEB_MANUAL.md`  
> **Target Aplikasi:** Frontend Web BERSEKA (`apps/web`)  
> **Metode Pengujian:** Pengujian Manual UI/UX, Alur Bisnis, & Respon API  

---

## KATEGORI 1: AUTENTIKASI, HAK AKSES, & SESI

### 1.1 Login & Autentikasi Pengguna
- [ ] **Langkah Tes**:
  1. Buka URL `/login`.
  2. Masukkan Email/No HP dan Password valid (misal: SUPER USER / RW / Mahasiswa).
  3. Klik tombol **"Masuk"**.
- [ ] **Ekspektasi Visual & System**:
  - Loading indicator tampil pada tombol saat API dipanggil.
  - Berhasil login dan di-redirect ke `/dashboard` sesuai role.
  - Token JWT & refresh token tersimpan di storage/cookie secara aman.

### 1.2 Login Warga via WhatsApp OTP (+62)
- [ ] **Langkah Tes**:
  1. Pilih tab **"Login Warga"**.
  2. Input nomor WhatsApp (+628xxxxxxxxxx).
  3. Masukkan kode OTP yang dikirimkan.
- [ ] **Ekspektasi Visual & System**:
  - Validasi format nomor telepon Indonesia (+62 / 08).
  - Timer countdown OTP tampil (60 detik).
  - Berhasil terverifikasi & masuk ke portal Warga.

### 1.3 Strict Read-Only Guard (Admin Kelurahan / Admin Kecamatan)
- [ ] **Langkah Tes**:
  1. Login sebagai **Admin Kelurahan** atau **Admin Kecamatan**.
  2. Coba akses form tambah/edit/hapus data di modul apapun (misal: Tambah Pengguna atau Edit Lokasi).
- [ ] **Ekspektasi Visual & System**:
  - Tombol aksi Ubah/Hapus disembunyikan atau di-disable.
  - Jika dicoba via API console, backend mengembalikan status `403 Forbidden`.
  - Tampilan dashboard murni berfokus pada **Monitoring Visual & Chart Data**.

### 1.4 Logout & Proteksi Tombol Back Browser
- [ ] **Langkah Tes**:
  1. Klik tombol **"Logout"** di header/sidebar.
  2. Muncul modal konfirmasi → Klik **"Ya, Logout"**.
  3. Tekan tombol **"Back"** pada browser.
- [ ] **Ekspektasi Visual & System**:
  - Session terhapus sepenuhnya (`psc_refresh_token` cleared).
  - Di-redirect ke `/login`.
  - Tombol Back browser **TIDAK BISA** mengembalikan pengguna ke halaman dashboard yang dilindungi.

---

## KATEGORI 2: DASHBOARD & ANALITIK UTAMA

### 2.1 Ringkasan Metrik Summary Cards
- [ ] **Langkah Tes**:
  1. Buka halaman `/dashboard`.
  2. Periksa widget Ringkasan Metrik: Total Sampah (Kg), Total Poin, Jumlah Warga Aktif, dan Tempat Sampah Terdaftar.
- [ ] **Ekspektasi Visual & System**:
  - Angka metrik sesuai dengan akumulasi data aktual di database.
  - Satuan berat konsisten ditulis `Kg` (sesuai KBBI & Spec).

### 2.2 Grafik Tren Harian & Bulanan
- [ ] **Langkah Tes**:
  1. Amati chart visualisasi tren sampah masuk (Line Chart / Bar Chart).
  2. Uji toggle perbandingan tren harian vs bulanan.
- [ ] **Ekspektasi Visual & System**:
  - Chart me-render data dengan animasi halus.
  - Hover pada titik chart menampilkan tooltip detail volume (Kg) & tanggal.

### 2.3 Filter Rentang Tanggal (Date Range Filter)
- [ ] **Langkah Tes**:
  1. Pilih *Start Date* dan *End Date* pada komponen DatePicker filter.
  2. Klik tombol **"Terapkan Filter"**.
- [ ] **Ekspektasi Visual & System**:
  - State loading skeleton muncul saat data di-fetch ulang.
  - Widget metrik & chart memperbarui tampilan sesuai rentang tanggal terpilih.

---

## KATEGORI 3: SETORAN SAMPAH & INPUT MANUAL

### 3.1 Input Setoran Manual oleh Petugas
- [ ] **Langkah Tes**:
  1. Akses halaman `/input-setoran-manual`.
  2. Ketik nama warga / NKK pada input pencarian (Autocomplete).
  3. Pilih jenis sampah (Organik / Anorganik).
  4. Input berat sampah (Kg) angka > 0.
- [ ] **Ekspektasi Visual & System**:
  - Live search autocomplete menampilkan hasil presisi dengan debouncing.
  - Estimasi poin terhitung otomatis di UI (Organik: 0.4/L / 0.9xKg, Anorganik: 0.2/L).
  - Klik **"Simpan Setoran"** → Toast notifikasi sukses muncul & form di-clear otomatis.

### 3.2 Review Diskrepansi AI vs Manual
- [ ] **Langkah Tes**:
  1. Akses halaman `/review-diskrepansi-ai`.
  2. Lihat daftar transaksi setoran dengan confidence AI >90% yang berbeda dari input manual.
  3. Klik tombol **"Approve AI"** atau **"Reject / Koreksi Manual"**.
- [ ] **Ekspektasi Visual & System**:
  - Foto komparasi sampah tampil jelas side-by-side.
  - Klik **Approve AI** → DB ter-update membenarkan AI & poin warga disesuaikan.
  - Status diskrepansi berubah dari `PENDING_REVIEW` menjadi `RESOLVED`.

---

## KATEGORI 4: MANAJEMEN PENGGUNA (USER MANAGEMENT)

### 4.1 Tabel Pengguna & Search / Pagination
- [ ] **Langkah Tes**:
  1. Akses `/manajemen-pengguna`.
  2. Ketik kata kunci nama/email pada search bar.
  3. Uji navigasi halaman tabel (Pagination).
- [ ] **Ekspektasi Visual & System**:
  - Tabel memfilter daftar pengguna secara instan.
  - Pagination berpindah halaman tanpa reload penuh (SPA behavior).

### 4.2 Tambah, Edit, & Nonaktifkan Pengguna
- [ ] **Langkah Tes**:
  1. Klik **"Tambah Pengguna"** → Isi form (Email, Password kuat, Role).
  2. Edit salah satu user → Ubah role (misal: Warga ke RT).
  3. Klik tombol **"Nonaktifkan"** pada user test.
- [ ] **Ekspektasi Visual & System**:
  - Validasi error muncul jika email duplikat atau password < 8 karakter.
  - Perubahan role tersimpan ke DB.
  - Modal konfirmasi wajib muncul sebelum aksi penonaktifan.

---

## KATEGORI 5: MANAJEMEN TEMPAT SAMPAH & MASTER QR

### 5.1 Tabel Tempat Sampah & Indikator Warna Kapasitas
- [ ] **Langkah Tes**:
  1. Akses `/manajemen-tempat-sampah`.
  2. Amati kolom indikator kapasitas tempat sampah.
- [ ] **Ekspektasi Visual & System**:
  - Kapasitas <70% berwarna **Hijau**.
  - Kapasitas 70%-89% berwarna **Kuning**.
  - Kapasitas >=90% berwarna **Merah (Tempat Sampah Penuh)**.

### 5.2 Bulk Generate & Export Master QR Code
- [ ] **Langkah Tes**:
  1. Akses `/master-qr`.
  2. Masukkan jumlah batch QR Code yang ingin dibuat (misal: 50 batch).
  3. Klik **"Generate Batch"** lalu klik **"Export CSV/Excel"**.
- [ ] **Ekspektasi Visual & System**:
  - Batch QR tercetak dengan status awal `PRINTED`.
  - File Excel/CSV terunduh dengan kolom ID QR & Token Unik valid.

---

## KATEGORI 6: MANAJEMEN LOKASI & REGIONAL SCOPING

### 6.1 Hirarki Struktur Data Wilayah (Kecamatan / Kelurahan / RW / RT)
- [ ] **Langkah Tes**:
  1. Akses `/manajemen-lokasi`.
  2. Buka accordion / tree-view struktur wilayah.
- [ ] **Ekspektasi Visual & System**:
  - Data menampilkan relasi hirarki presisi dari Kecamatan Coblong → Kelurahan → RW → RT.

### 6.2 Validasi Relasi Hapus Wilayah
- [ ] **Langkah Tes**:
  1. Coba hapus salah satu RT yang masih memiliki Warga / Tempat Sampah aktif.
- [ ] **Ekspektasi Visual & System**:
  - Sistem menolak penghapusan dan menampilkan error toast: *"Tidak dapat menghapus lokasi yang memiliki relasi data pengguna/tempat sampah aktif"*.

---

## KATEGORI 7: PETA GIS INTERAKTIF & POLYGON WILAYAH

### 7.1 Dynamic Polygon Zona RT/RW & Heatmap Keaktifan
- [ ] **Langkah Tes**:
  1. Akses halaman `/monitoring` (Peta GIS).
  2. Amati garis polygon zona RT/RW pada peta.
- [ ] **Ekspektasi Visual & System**:
  - Polygon terbentuk dari batas koordinat rumah warga terdaftar.
  - Pewarnaan zona menyesuaikan tingkat keaktifan (Heatmap pembuangan sampah).

### 7.2 Drill-Down Zoom & Legenda 4 Warna
- [ ] **Langkah Tes**:
  1. Klik area Kelurahan pada peta → Zoom in ke level RW.
  2. Klik area RW → Zoom in ke detail RT & Marker Tempat Sampah.
  3. Periksa komponen Legenda Peta.
- [ ] **Ekspektasi Visual & System**:
  - Zooming berjalan lancar dan bertingkat.
  - Legenda menampilkan 4 warna standar:
    - **Hijau**: Organik / Kompos
    - **Biru**: Daur Ulang / Anorganik
    - **Merah**: Residu / TPA / Tempat Sampah Penuh
    - **Emas**: Flash Drop Challenge

---

## KATEGORI 8: PORTAL RW (RW VERIFICATION CENTER)

### 8.1 Approval Tempat Sampah (Bin Activation)
- [ ] **Langkah Tes**:
  1. Login sebagai **RW** → Akses `/rw-portal`.
  2. Lihat daftar tempat sampah berstatus `PENDING_APPROVAL`.
  3. Klik **"Setujui Tempat Sampah"**.
- [ ] **Ekspektasi Visual & System**:
  - Status tempat sampah berubah menjadi `ACTIVE_BOUND`.
  - Poin bonus (+10 Warga, +10 Mahasiswa KKN) ditambahkan secara atomik.

### 8.2 Re-Aktivasi & Marking Bin Broken
- [ ] **Langkah Tes**:
  1. Pilih tempat sampah inaktif (>30 hari) → Klik **"Setujui Re-Aktivasi"**.
  2. Pilih tempat sampah fisik rusak → Klik **"Tandai Rusak (BROKEN)"**.
- [ ] **Ekspektasi Visual & System**:
  - Bin inaktif aktif kembali untuk transaksi setoran.
  - Bin rusak berubah status menjadi `BROKEN` dan QR Code deaktif permanen.

---

## KATEGORI 9: PENGANGKUTAN SAMPAH & ESKALASI BERJENJANG

### 9.1 Alert Tempat Sampah Penuh & Flow Status Penjemputan
- [ ] **Langkah Tes**:
  1. Access `/manajemen-pengangkutan`.
  2. Amati daftar penjemputan pemicu Notifikasi Tempat Sampah Penuh (>90%).
  3. Ubah status penjemputan: `Menunggu` → `Diterima` → `Dalam Perjalanan` → `Selesai`.
- [ ] **Ekspektasi Visual & System**:
  - Status ter-update realtime.
  - Push notification terkirim ke warga pemilik tempat sampah.

### 9.2 Eskalasi Otomatis Berjenjang Jam Operasional
- [ ] **Langkah Tes**:
  1. Simulasikan penjemputan yang belum diselesaikan melewati window operasional (06:00-08:00 atau 16:00-18:00).
- [ ] **Ekspektasi Visual & System**:
  - Sistem memicu notifikasi eskalasi berjenjang otomatis: **RW → Lurah → Camat → Admin DLH**.

---

## KATEGORI 10: RESIDU HILIR & TIMBANGAN FISIK TPS/TPA

### 10.1 Input Timbangan Fisik oleh Petugas Residu
- [ ] **Langkah Tes**:
  1. Login sebagai **Petugas Residu** → Akses `/residu-dashboard`.
  2. Input data penimbangan industri fisik (Kg) sampah residu TPS.
  3. Klik **"Simpan Data Residu"**.
- [ ] **Ekspektasi Visual & System**:
  - Volume residu (Kg) tercatat murni tanpa nilai AI confidence.
  - Grafik tren rasio sampah terpilah vs residu ter-update instan.

---

## KATEGORI 11: EKOSISTEM KKN & MONITORING PRESENSI

### 11.1 Manajemen Kelompok KKN & Posko
- [ ] **Langkah Tes**:
  1. Akses `/manajemen-ekosistem-kkn`.
  2. Tambah Kelompok KKN baru, tentukan Posko & DPL Pembimbing.
  3. Assign Mahasiswa ke zona polygon KKN.
- [ ] **Ekspektasi Visual & System**:
  - Relasi Kelompok - DPL - Zona KKN tersimpan presisi.

### 11.2 Monitoring Presensi Mahasiswa & Assessment DPL
- [ ] **Langkah Tes**:
  1. Akses `/monitoring-absen`.
  2. Periksa log presensi otomatis (Background Location Ping).
  3. Login sebagai **DPL** → Isi form penilaian aktivitas mahasiswa.
- [ ] **Ekspektasi Visual & System**:
  - Status presensi tampil: `HADIR_VALID` (>=2 Jam di zona), `DI_LUAR_ZONA`, atau `DURASI_KURANG`.
  - Assessment DPL tersimpan terpisah dari log absensi otomatis.

### 11.3 Histori Handover KKN (`kkn_handover_history`)
- [ ] **Langkah Tes**:
  1. Uji fitur serah terima wilayah & daftar warga dampingan dari Mahasiswa KKN periode lama ke periode baru.
- [ ] **Ekspektasi Visual & System**:
  - Record transaksi serah terima tercatat kronologis di tabel `kkn_handover_history`.

---

## KATEGORI 12: PEMANFAATAN SAMPAH & LINGKUNGAN (BURUAN SAE)

### 12.1 Input Data Hasil Pemanfaatan (Buruan Sae, Maggot, POC, Loseda, Bata Terawang)
- [ ] **Langkah Tes**:
  1. Akses `/pemanfaatan-sampah` / `/hasil-pemanfaatan`.
  2. Isi form input hasil program: Bahan baku organik masuk (Kg), Tonase panen, Jenis produk (POC/Maggot/Kompos), Upload Foto Dokumentasi.
  3. Klik **"Simpan Data Pemanfaatan"**.
- [ ] **Ekspektasi Visual & System**:
  - Data tersimpan dan tampil pada grid/tabel pemanfaatan.
  - Filter mode tampilan (Realtime, Mingguan, Bulanan) berfungsi memperbarui chart & summary.

---

## KATEGORI 13: PAPAN PERINGKAT (LEADERBOARD) PUBLIK

### 13.1 Leaderboard Warga (Berdasarkan Poin)
- [ ] **Langkah Tes**:
  1. Akses `/leaderboard` → Tab **"Warga"**.
- [ ] **Ekspektasi Visual & System**:
  - Ranking warga diurutkan berdasar **Total Poin Terbanyak**.
  - Poin warga terhitung dari rumus: `Berat (Kg) x AI Confidence x 0.9`.

### 13.2 Leaderboard RT/RW & Kelurahan (Berdasarkan Volume Kg)
- [ ] **Langkah Tes**:
  1. Akses `/leaderboard` → Tab **"RT/RW"** atau **"Kelurahan"**.
- [ ] **Ekspektasi Visual & System**:
  - Ranking wilayah diurutkan berdasar **Total Volume Sampah Terkelola (Kg)**.
  - Leaderboard bersifat publik, realtime, dan all-time.

---

## KATEGORI 14: REKAP SETORAN & EXPORT DATA

### 14.1 Rekap Setoran & Filter Multi-Kriteria
- [ ] **Langkah Tes**:
  1. Akses `/rekap-setoran`.
  2. Terapkan filter tanggal & jenis sampah (Organik / Anorganik).
- [ ] **Ekspektasi Visual & System**:
  - Data transaksi terfilter presisi sesuai kriteria.

### 14.2 Export CSV / Excel Format Baku
- [ ] **Langkah Tes**:
  1. Klik tombol **"Export Excel"** atau **"Export CSV"**.
- [ ] **Ekspektasi Visual & System**:
  - File terunduh otomatis.
  - Header kolom mengikuti aturan baku (Header: `Berat (Kg)`, Isi data: `25` numerik murni tanpa teks 'Kg' berulang).

---

## KATEGORI 15: LAPORAN & ANALITIK LOKAL

### 15.1 Analitik Metrik & Formula Agregasi Median
- [ ] **Langkah Tes**:
  1. Akses `/laporan-analitik`.
  2. Periksa metrik Agregasi Wilayah, Compliance Score, dan Reliability Score.
- [ ] **Ekspektasi Visual & System**:
  - Metrik agregasi wilayah menggunakan nilai **MEDIAN** (bukan average) untuk menahan outlier data.
  - Export Laporan PDF/Excel menghasilkan dokumen ringkasan yang valid.

---

## KATEGORI 16: NOTIFIKASI SYSTEM & CENTER

### 16.1 Notification Center UI & Navigation
- [ ] **Langkah Tes**:
  1. Klik ikon lonceng notifikasi di navbar.
  2. Periksa item belum dibaca (Bold) vs sudah dibaca.
  3. Klik tombol **"Tandai Semua Dibaca"**.
  4. Klik salah satu notifikasi (misal: Notif Diskrepansi atau Tempat Sampah Penuh).
- [ ] **Ekspektasi Visual & System**:
  - Counter unread notification berkurang/nol.
  - Mengklik notifikasi langsung me-redirect ke halaman detail terkait.

---

## KATEGORI 17: IDE DAUR ULANG & CONTENT MANAGEMENT

### 17.1 Admin CRUD Ide Daur Ulang & Search
- [ ] **Langkah Tes**:
  1. Akses `/ide-daur-ulang`.
  2. Tambah konten artikel baru + upload thumbnail gambar.
  3. Uji pencarian artikel pada search bar.
- [ ] **Ekspektasi Visual & System**:
  - Card artikel tampil dengan thumbnail presisi.
  - Search bar memfilter daftar artikel secara realtime.

---

## KATEGORI 18: JADWAL KEGIATAN LINGKUNGAN

### 18.1 Kalender Agenda & Admin CRUD Jadwal
- [ ] **Langkah Tes**:
  1. Akses `/jadwal-kegiatan`.
  2. Tambah agenda kerja bakti / sosialisasi baru (Waktu, Lokasi RW, Deskripsi).
  3. Klik salah satu event pada kalender.
- [ ] **Ekspektasi Visual & System**:
  - Validasi format tanggal & waktu berfungsi.
  - Pop-up modal detail kegiatan muncul menampilkan informasi lengkap.

---

## KATEGORI 19: KATEGORI SAMPAH & MULTIPLIER POIN

### 19.1 Edit Multiplier Poin & Proteksi Default
- [ ] **Langkah Tes**:
  1. Akses `/kategori-sampah`.
  2. Ubah nilai multiplier poin kategori Organik.
  3. Coba hapus kategori default sistem (Organik/Anorganik).
- [ ] **Ekspektasi Visual & System**:
  - Multiplier baru tersimpan ke DB.
  - Tombol hapus pada kategori default di-disable / sistem menolak penghapusan.

---

## KATEGORI 20: AKTIVITAS PEMILAHAN SAMPAH (IMMUTABLE AUDIT LOG)

### 20.1 View Audit Log & Filter Timestamp
- [ ] **Langkah Tes**:
  1. Login sebagai **SUPER USER** → Akses `/aktivitas-pemilahan`.
  2. Terapkan filter rentang waktu & tipe aksi.
- [ ] **Ekspektasi Visual & System**:
  - Menampilkan log aktivitas mentah seluruh sistem.
  - Data bersifat read-only (tidak ada tombol edit atau hapus).

---

## KATEGORI 21: PENGATURAN PROFIL & RULE ENGINE

### 21.1 Profil & Change Password
- [ ] **Langkah Tes**:
  1. Akses `/pengaturan`.
  2. Ubah nama & foto profil.
  3. Form ganti password (Password lama, password baru, konfirmasi).
- [ ] **Ekspektasi Visual & System**:
  - Profil ter-update.
  - Validasi password lama vs baru berfungsi dengan benar.

### 21.2 Rule Engine / System Configuration
- [ ] **Langkah Tes**:
  1. Akses `/super-user` atau menu Rule Engine.
  2. Ubah parameter global (misal: Masa Aktif Bin 30 hari, AI Confidence Threshold 90%).
- [ ] **Ekspektasi Visual & System**:
  - Parameter global tersimpan & langsung berdampak pada backend logic.

---

## 5. REKAPITULASI DOKUMEN TESTING

| Kategori Fitur Web | Total Skenario QC | Target Role Tester | Status Hasil |
|---|---|---|---|
| 1. Autentikasi & Sesi | 4 Skenario | Semua Role | [ ] Pass / [ ] Fail |
| 2. Dashboard & Analitik | 3 Skenario | Semua Role (Scoped) | [ ] Pass / [ ] Fail |
| 3. Setoran & Input Manual | 2 Skenario | Petugas, Warga | [ ] Pass / [ ] Fail |
| 4. Manajemen Pengguna | 2 Skenario | SUPER USER, Admin | [ ] Pass / [ ] Fail |
| 5. Tempat Sampah & QR | 2 Skenario | RW, SUPER USER | [ ] Pass / [ ] Fail |
| 6. Manajemen Lokasi | 2 Skenario | SUPER USER | [ ] Pass / [ ] Fail |
| 7. Peta GIS & Polygon | 2 Skenario | Semua Role | [ ] Pass / [ ] Fail |
| 8. Portal RW | 2 Skenario | RW | [ ] Pass / [ ] Fail |
| 9. Pengangkutan & Eskalasi | 2 Skenario | Petugas Pengangkut | [ ] Pass / [ ] Fail |
| 10. Residu Hilir TPS | 1 Skenario | Petugas Residu | [ ] Pass / [ ] Fail |
| 11. Ekosistem & Presensi KKN | 3 Skenario | Mahasiswa, DPL | [ ] Pass / [ ] Fail |
| 12. Pemanfaatan Buruan Sae | 1 Skenario | RW, Mahasiswa | [ ] Pass / [ ] Fail |
| 13. Leaderboard Publik | 2 Skenario | Publik / Semua Role | [ ] Pass / [ ] Fail |
| 14. Rekap & Export Data | 2 Skenario | Admin, SUPER USER | [ ] Pass / [ ] Fail |
| 15. Laporan & Analitik | 1 Skenario | Camat, Lurah, DLH | [ ] Pass / [ ] Fail |
| 16. Notifikasi System | 1 Skenario | Semua Role | [ ] Pass / [ ] Fail |
| 17. Ide Daur Ulang | 1 Skenario | Admin, Warga | [ ] Pass / [ ] Fail |
| 18. Jadwal Kegiatan | 1 Skenario | Admin, RW | [ ] Pass / [ ] Fail |
| 19. Kategori Sampah | 1 Skenario | SUPER USER | [ ] Pass / [ ] Fail |
| 20. Audit Log Immutable | 1 Skenario | SUPER USER | [ ] Pass / [ ] Fail |
| 21. Profil & Rule Engine | 2 Skenario | Semua Role / Admin | [ ] Pass / [ ] Fail |
