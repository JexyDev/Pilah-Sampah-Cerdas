# Form Quality Control (QC) — Mobile BERSEKA

**Versi Dokumen:** 1.0  
**Tanggal Pengujian:** ___/___/______  
**Penguji (QC Tester):** _________________________  
**Device Uji:** _________________________  
**OS & Versi:** _________________________  
**Versi Aplikasi / Build:** _________________________  
**Koneksi Jaringan:** WiFi / 4G / 3G (coret yang tidak sesuai)

---

## Petunjuk Pengisian

| Kode | Status Pengujian | Deskripsi |
|------|-----------------|-----------|
| ✅ PASS | Lolos | Fitur berjalan sesuai spesifikasi tanpa kendala |
| ⚠️ MINOR | Minor Issue | Fitur berjalan namun ada kekurangan kecil (UI, typo, UX kurang optimal) |
| ❌ FAIL | Gagal | Fitur tidak berjalan / tidak sesuai spesifikasi / crash / error |
| ⏳ | Belum Diuji | Belum dilakukan pengujian |

| Kode | Status Perbaikan | Deskripsi |
|------|-----------------|-----------|
| 🔧 IN PROGRESS | Sedang Diperbaiki | Developer sedang mengerjakan perbaikan |
| ✅ FIXED | Sudah Diperbaiki | Developer sudah memperbaiki, siap verifikasi ulang |
| ❌ NOT FIXED | Belum Diperbaiki | Belum ada tindakan perbaikan |
| ➖ N/A | Tidak Perlu | Tidak memerlukan perbaikan (status PASS) |

---

## 1. SPLASH SCREEN & INISIALISASI

| No | Kategori (Menu) | Fitur / Poin Pengecekan | Status Pengujian | Keterangan | Catatan QC | Status Perbaikan | Respon Developer | Dokumentasi Developer (Link/Bukti) | Verifikasi QC |
|----|-----------------|------------------------|-----------------|------------|------------|-----------------|-----------------|-----------------------------------|--------------|
| 1.1 | Splash Screen | Logo aplikasi tampil dengan benar (warna Primary, posisi center) | | | | | | | |
| 1.2 | Splash Screen | Indikator loading/spinner tampil saat proses inisialisasi | | | | | | | |
| 1.3 | Splash Screen | Pengecekan koneksi internet berjalan (`connectivity_plus`) | | | | | | | |
| 1.4 | Splash Screen | Pengecekan token JWT di `flutter_secure_storage` berjalan | | | | | | | |
| 1.5 | Splash Screen | Routing: Token valid → redirect ke Halaman Beranda (Dashboard) | | | | | | | |
| 1.6 | Splash Screen | Routing: Token tidak ada → redirect ke Halaman Login | | | | | | | |
| 1.7 | Splash Screen | Routing: Token expired → redirect ke Halaman Login | | | | | | | |
| 1.8 | Splash Screen | Splash screen tidak stuck/hang lebih dari 5 detik | | | | | | | |

---

## 2. HALAMAN LOGIN & AUTENTIKASI

| No | Kategori (Menu) | Fitur / Poin Pengecekan | Status Pengujian | Keterangan | Catatan QC | Status Perbaikan | Respon Developer | Dokumentasi Developer (Link/Bukti) | Verifikasi QC |
|----|-----------------|------------------------|-----------------|------------|------------|-----------------|-----------------|-----------------------------------|--------------|
| 2.1 | Login | Form input Email tampil dan bisa diisi | | | | | | | |
| 2.2 | Login | Form input Password tampil dan bisa diisi | | | | | | | |
| 2.3 | Login | Toggle visibility password (icon mata) berfungsi | | | | | | | |
| 2.4 | Login | Tombol Login disable (abu-abu) saat field Email/Password kosong | | | | | | | |
| 2.5 | Login | Tombol Login aktif setelah kedua field terisi | | | | | | | |
| 2.6 | Login | Loading state: Spinner muncul pada tombol saat proses login | | | | | | | |
| 2.7 | Login | Loading state: Field form menjadi disable saat proses login | | | | | | | |
| 2.8 | Login | Error: Snackbar merah muncul saat kredensial salah | | | | | | | |
| 2.9 | Login | Error: Snackbar merah muncul saat timeout koneksi | | | | | | | |
| 2.10 | Login | Error: Rate limiting aktif setelah >5 percobaan gagal dalam 15 menit (SRS NFR-02) | | | | | | | |
| 2.11 | Login | Sukses: Token JWT tersimpan di `flutter_secure_storage` | | | | | | | |
| 2.12 | Login | Sukses: Redirect ke Beranda sesuai Role (Warga/Petugas/Admin) | | | | | | | |
| 2.13 | Login | Validasi format email (input tidak valid ditolak) | | | | | | | |
| 2.14 | Login | Password minimum length validation | | | | | | | |

---

## 3. NAVIGASI UTAMA (BOTTOM NAVIGATION BAR)

| No | Kategori (Menu) | Fitur / Poin Pengecekan | Status Pengujian | Keterangan | Catatan QC | Status Perbaikan | Respon Developer | Dokumentasi Developer (Link/Bukti) | Verifikasi QC |
|----|-----------------|------------------------|-----------------|------------|------------|-----------------|-----------------|-----------------------------------|--------------|
| 3.1 | Navbar | Tab Beranda tampil untuk semua role (Warga, Petugas, Admin) | | | | | | | |
| 3.2 | Navbar | Tab Riwayat tampil untuk semua role | | | | | | | |
| 3.3 | Navbar | Tab Peta HANYA tampil untuk role Petugas dan Admin | | | | | | | |
| 3.4 | Navbar | Tab Peta TIDAK tampil untuk role Warga | | | | | | | |
| 3.5 | Navbar | Tab Profil tampil untuk semua role | | | | | | | |
| 3.6 | Navbar | Navigasi antar tab berjalan lancar tanpa delay/lag | | | | | | | |
| 3.7 | Navbar | Indikator aktif (highlight/warna) pada tab yang sedang dipilih | | | | | | | |
| 3.8 | Navbar | State tab tetap preserved saat berpindah antar tab (tidak reset) | | | | | | | |

---

## 4. BERANDA (DASHBOARD)

| No | Kategori (Menu) | Fitur / Poin Pengecekan | Status Pengujian | Keterangan | Catatan QC | Status Perbaikan | Respon Developer | Dokumentasi Developer (Link/Bukti) | Verifikasi QC |
|----|-----------------|------------------------|-----------------|------------|------------|-----------------|-----------------|-----------------------------------|--------------|
| **Header & Status** | | | | | | | | | |
| 4.1 | Beranda | Sapaan "Halo, [Nama User]" tampil sesuai nama user login | | | | | | | |
| 4.2 | Beranda | Role badge tampil sesuai role user (Warga/Petugas/Admin) | | | | | | | |
| 4.3 | Beranda | Foto profil kecil tampil di header | | | | | | | |
| 4.4 | Beranda | Banner Merah `NETWORK_UNAVAILABLE` muncul saat offline | | | | | | | |
| 4.5 | Beranda | Banner hilang otomatis saat koneksi kembali online | | | | | | | |
| **Saldo / Statistik** | | | | | | | | | |
| 4.6 | Beranda | Warga: Total Poin tampil dengan benar | | | | | | | |
| 4.7 | Beranda | Warga: Animasi hitung naik (count-up animation) pada poin berjalan | | | | | | | |
| 4.8 | Beranda | Petugas: Ringkasan jumlah tong penuh di area tugas tampil | | | | | | | |
| 4.9 | Beranda | Offline: Angka terakhir dari cache `SharedPreferences` tampil | | | | | | | |
| **Call-To-Action (CTA)** | | | | | | | | | |
| 4.10 | Beranda | Tombol FAB / "Mulai Buang Sampah" tampil dan bisa diklik | | | | | | | |
| 4.11 | Beranda | Offline: Tombol CTA berwarna abu-abu (disabled), `onPressed: null` | | | | | | | |
| **Notifikasi Cepat** | | | | | | | | | |
| 4.12 | Beranda | Widget 3 notifikasi terbaru (FCM) tampil | | | | | | | |
| 4.13 | Beranda | Petugas: Alert tong penuh (>90%) tampil di notifikasi | | | | | | | |
| 4.14 | Beranda | Notifikasi bisa di-tap untuk navigasi ke detail | | | | | | | |

---

## 5. ALUR INTI: PEMILAHAN & BUANG SAMPAH

### 5A. Scan QR Code

| No | Kategori (Menu) | Fitur / Poin Pengecekan | Status Pengujian | Keterangan | Catatan QC | Status Perbaikan | Respon Developer | Dokumentasi Developer (Link/Bukti) | Verifikasi QC |
|----|-----------------|------------------------|-----------------|------------|------------|-----------------|-----------------|-----------------------------------|--------------|
| 5.1 | Scan QR | Klik tombol "Mulai Buang Sampah" membuka layar kamera | | | | | | | |
| 5.2 | Scan QR | Permission prompt: Akses Kamera muncul | | | | | | | |
| 5.3 | Scan QR | Permission prompt: Akses Lokasi (GPS) muncul | | | | | | | |
| 5.4 | Scan QR | Tolak permission kamera → tampil error/dialog wajib izinkan | | | | | | | |
| 5.5 | Scan QR | Tolak permission lokasi → tampil error/dialog wajib izinkan | | | | | | | |
| 5.6 | Scan QR | UI viewfinder kamera tampil dengan benar | | | | | | | |
| 5.7 | Scan QR | Garis batas area scan QR tampil | | | | | | | |
| 5.8 | Scan QR | Tombol nyalakan flash/senter berfungsi | | | | | | | |
| 5.9 | Scan QR | QR Code valid berhasil di-scan dan diproses | | | | | | | |
| 5.10 | Scan QR | QR Code invalid → Alert dialog "QR tidak dikenali" muncul | | | | | | | |
| 5.11 | Scan QR | Geofencing: Jarak ≤10m dari tong → scan diterima | | | | | | | |
| 5.12 | Scan QR | Geofencing: Jarak >10m dari tong → Alert "Anda terlalu jauh dari Tempat Sampah" (Haversine) | | | | | | | |
| 5.13 | Scan QR | Kapasitas tong aman (<25L) → proses lanjut normal | | | | | | | |
| 5.14 | Scan QR | Kapasitas tong penuh (≥25L) → Alert "Tempat Sampah Penuh, cari Tempat Sampah lain" | | | | | | | |

### 5B. Foto Sampah & Deteksi AI

| No | Kategori (Menu) | Fitur / Poin Pengecekan | Status Pengujian | Keterangan | Catatan QC | Status Perbaikan | Respon Developer | Dokumentasi Developer (Link/Bukti) | Verifikasi QC |
|----|-----------------|------------------------|-----------------|------------|------------|-----------------|-----------------|-----------------------------------|--------------|
| 5.15 | Foto & AI | Setelah QR & Lokasi valid → layar kamera foto sampah terbuka | | | | | | | |
| 5.16 | Foto & AI | Instruksi teks "Foto sampah Anda dengan jelas" tampil | | | | | | | |
| 5.17 | Foto & AI | Foto berhasil diambil (capture) | | | | | | | |
| 5.18 | Foto & AI | Foto otomatis dikompres (<1MB) sebelum dikirim (SRS FR-01, PRD §2.1) | | | | | | | |
| 5.19 | Foto & AI | Foto dikirim ke endpoint AI backend (bukan mock lokal) — ref: BUG-002 | | | | | | | |
| 5.20 | Foto & AI | Overlay loading "AI Sedang Menganalisa..." tampil saat proses | | | | | | | |
| 5.21 | Foto & AI | Timeout AI: Maks 2000ms (SRS FR-01) — tidak stuck loading melebihi batas | | | | | | | |
| 5.22 | Foto & AI | Timeout AI: Alert "Analisa gagal, coba lagi" muncul saat timeout | | | | | | | |
| 5.23 | Foto & AI | Error jaringan saat kirim foto → error handling graceful (tidak crash) | | | | | | | |

### 5C. Hasil Deteksi & Konfirmasi

| No | Kategori (Menu) | Fitur / Poin Pengecekan | Status Pengujian | Keterangan | Catatan QC | Status Perbaikan | Respon Developer | Dokumentasi Developer (Link/Bukti) | Verifikasi QC |
|----|-----------------|------------------------|-----------------|------------|------------|-----------------|-----------------|-----------------------------------|--------------|
| 5.24 | Hasil Deteksi | Thumbnail foto sampah tampil | | | | | | | |
| 5.25 | Hasil Deteksi | Label kategori tampil: ORGANIC (warna hijau) | | | | | | | |
| 5.26 | Hasil Deteksi | Label kategori tampil: NON_ORGANIC (warna kuning/biru) | | | | | | | |
| 5.27 | Hasil Deteksi | Estimasi poin tampil sesuai formula: ORGANIC=0.4 kg/L × 100 poin/kg (SRS FR-03) — ref: BUG-003 | | | | | | | |
| 5.28 | Hasil Deteksi | Estimasi poin tampil sesuai formula: NON_ORGANIC=0.2 kg/L × 100 poin/kg (SRS FR-03) — ref: BUG-003 | | | | | | | |
| 5.29 | Hasil Deteksi | Tombol "Ulangi Foto" → kembali ke layar kamera foto | | | | | | | |
| 5.30 | Hasil Deteksi | Tombol "Simpan & Masukkan" → submit data ke backend | | | | | | | |
| 5.31 | Hasil Deteksi | Submit sukses → Lottie animation sukses tampil | | | | | | | |
| 5.32 | Hasil Deteksi | Setelah animasi → Halaman Beranda di-refresh otomatis (poin terupdate) | | | | | | | |
| 5.33 | Hasil Deteksi | Submit gagal (error server) → error message tampil, tidak crash | | | | | | | |
| 5.34 | Hasil Deteksi | Validasi jenis sampah vs tipe tong: sampah plastik ke tong organik → ditolak (SRS FR-02) | | | | | | | |

---

## 6. RIWAYAT (HISTORY)

| No | Kategori (Menu) | Fitur / Poin Pengecekan | Status Pengujian | Keterangan | Catatan QC | Status Perbaikan | Respon Developer | Dokumentasi Developer (Link/Bukti) | Verifikasi QC |
|----|-----------------|------------------------|-----------------|------------|------------|-----------------|-----------------|-----------------------------------|--------------|
| 6.1 | Riwayat | List view card riwayat pembuangan tampil | | | | | | | |
| 6.2 | Riwayat | Isi card: Tanggal tampil dengan format benar | | | | | | | |
| 6.3 | Riwayat | Isi card: Waktu tampil dengan format benar | | | | | | | |
| 6.4 | Riwayat | Isi card: Lokasi Tong tampil | | | | | | | |
| 6.5 | Riwayat | Isi card: Kategori (Organik/Non-Organik) tampil dengan warna benar | | | | | | | |
| 6.6 | Riwayat | Isi card: Poin yang didapat tampil | | | | | | | |
| 6.7 | Riwayat | Pull-to-refresh berfungsi (data terupdate) | | | | | | | |
| 6.8 | Riwayat | Infinite scroll / pagination berfungsi saat scroll ke bawah | | | | | | | |
| 6.9 | Riwayat | Loading state: Shimmer effect tampil saat loading data | | | | | | | |
| 6.10 | Riwayat | Empty state: Ilustrasi "Belum ada riwayat pembuangan" tampil jika data kosong | | | | | | | |
| 6.11 | Riwayat | Offline: Data cache lokal tampil | | | | | | | |
| 6.12 | Riwayat | Offline: Pull-to-refresh → snackbar "Anda sedang offline" | | | | | | | |
| 6.13 | Riwayat | Urutan data: riwayat terbaru di atas (descending) | | | | | | | |

---

## 7. PETA & MONITORING (KHUSUS PETUGAS/ADMIN)

| No | Kategori (Menu) | Fitur / Poin Pengecekan | Status Pengujian | Keterangan | Catatan QC | Status Perbaikan | Respon Developer | Dokumentasi Developer (Link/Bukti) | Verifikasi QC |
|----|-----------------|------------------------|-----------------|------------|------------|-----------------|-----------------|-----------------------------------|--------------|
| **Peta Live** | | | | | | | | | |
| 7.1 | Peta | Full screen map (Leaflet/Map) tampil dengan benar | | | | | | | |
| 7.2 | Peta | Posisi GPS user tampil sebagai titik biru | | | | | | | |
| 7.3 | Peta | Marker Tong: Icon Hijau untuk kapasitas aman | | | | | | | |
| 7.4 | Peta | Marker Tong: Icon Merah/Blinking untuk kapasitas penuh (>90%) | | | | | | | |
| 7.5 | Peta | Auto-refresh data setiap 30 detik (SRS NFR-04) | | | | | | | |
| 7.6 | Peta | Peta bisa di-zoom in/out dan di-pan/geser | | | | | | | |
| **Detail Tong & Eksekusi** | | | | | | | | | |
| 7.7 | Peta | Tap marker merah → Bottom Sheet muncul | | | | | | | |
| 7.8 | Peta | Bottom Sheet: Info Tong ID tampil | | | | | | | |
| 7.9 | Peta | Bottom Sheet: Alamat tong tampil | | | | | | | |
| 7.10 | Peta | Bottom Sheet: Persentase kapasitas penuh tampil | | | | | | | |
| 7.11 | Peta | Tombol "Kosongkan Tong" tampil dan bisa diklik | | | | | | | |
| 7.12 | Peta | Dialog konfirmasi muncul sebelum eksekusi kosongkan tong | | | | | | | |
| 7.13 | Peta | Konfirmasi → Hit API Reset → Marker berubah dari merah ke hijau | | | | | | | |
| 7.14 | Peta | Error saat reset tong → error handling, tidak crash | | | | | | | |

---

## 8. PROFIL & PENGATURAN

| No | Kategori (Menu) | Fitur / Poin Pengecekan | Status Pengujian | Keterangan | Catatan QC | Status Perbaikan | Respon Developer | Dokumentasi Developer (Link/Bukti) | Verifikasi QC |
|----|-----------------|------------------------|-----------------|------------|------------|-----------------|-----------------|-----------------------------------|--------------|
| **Informasi Profil** | | | | | | | | | |
| 8.1 | Profil | Foto profil user tampil | | | | | | | |
| 8.2 | Profil | Nama user tampil sesuai data akun | | | | | | | |
| 8.3 | Profil | Email user tampil sesuai data akun | | | | | | | |
| 8.4 | Profil | Role user tampil (Warga/Petugas/Admin) | | | | | | | |
| 8.5 | Profil | Data Kelurahan/RT/RW tampil | | | | | | | |
| **Ganti Password** | | | | | | | | | |
| 8.6 | Profil | Menu "Ganti Password" bisa diakses | | | | | | | |
| 8.7 | Profil | Form old password dan new password tampil | | | | | | | |
| 8.8 | Profil | Validasi old password benar sebelum update | | | | | | | |
| 8.9 | Profil | Password berhasil diubah → sukses feedback | | | | | | | |
| **Menu Lainnya** | | | | | | | | | |
| 8.10 | Profil | Menu "Pusat Bantuan" bisa diakses dan konten tampil | | | | | | | |
| 8.11 | Profil | Menu "Syarat & Ketentuan" bisa diakses dan konten tampil | | | | | | | |
| **Logout** | | | | | | | | | |
| 8.12 | Profil | Tombol "Keluar" tampil | | | | | | | |
| 8.13 | Profil | Tap "Keluar" → Dialog konfirmasi "Yakin ingin keluar?" muncul | | | | | | | |
| 8.14 | Profil | Konfirmasi logout → JWT dihapus dari secure storage | | | | | | | |
| 8.15 | Profil | Konfirmasi logout → Cache SharedPreferences dihapus | | | | | | | |
| 8.16 | Profil | Setelah logout → Redirect ke Halaman Login | | | | | | | |
| 8.17 | Profil | Setelah logout → Tombol back device TIDAK bisa kembali ke beranda | | | | | | | |

---

## 9. FITUR PENGOSONGAN TONG ON-DEMAND (WARGA — ref: PRD §3)

| No | Kategori (Menu) | Fitur / Poin Pengecekan | Status Pengujian | Keterangan | Catatan QC | Status Perbaikan | Respon Developer | Dokumentasi Developer (Link/Bukti) | Verifikasi QC |
|----|-----------------|------------------------|-----------------|------------|------------|-----------------|-----------------|-----------------------------------|--------------|
| 9.1 | Pengosongan Tong | Menu "Ajukan Pengosongan Tong" muncul saat kapasitas tong >90% | | | | | | | |
| 9.2 | Pengosongan Tong | Warga bisa memotret kondisi tong sebagai bukti fisik | | | | | | | |
| 9.3 | Pengosongan Tong | Tombol "Ajukan Reset" berfungsi dan mengirim request ke backend | | | | | | | |
| 9.4 | Pengosongan Tong | Status pengajuan tercatat sebagai `PENDING` | | | | | | | |
| 9.5 | Pengosongan Tong | Status tong tetap penuh di sistem selama masih `PENDING` | | | | | | | |
| 9.6 | Pengosongan Tong | Feedback sukses setelah pengajuan terkirim | | | | | | | |
| 9.7 | Pengosongan Tong | Pengajuan yang sudah `APPROVED` → kapasitas tong reset ke 0L | | | | | | | |
| 9.8 | Pengosongan Tong | Pengajuan yang `REJECTED` → status tong tetap penuh | | | | | | | |

---

## 10. SKENARIO KHUSUS QC (STRESS TEST & EDGE CASE)

### 10A. Skenario Offline-Online Drop

| No | Kategori (Menu) | Fitur / Poin Pengecekan | Status Pengujian | Keterangan | Catatan QC | Status Perbaikan | Respon Developer | Dokumentasi Developer (Link/Bukti) | Verifikasi QC |
|----|-----------------|------------------------|-----------------|------------|------------|-----------------|-----------------|-----------------------------------|--------------|
| 10.1 | Offline Test | Matikan internet di tengah proses scan QR → app tidak crash | | | | | | | |
| 10.2 | Offline Test | Matikan internet di tengah proses foto AI → app tidak crash | | | | | | | |
| 10.3 | Offline Test | Offline: Banner/dialog error jaringan muncul | | | | | | | |
| 10.4 | Offline Test | Kembali online: Proses bisa dilanjutkan/diulang tanpa restart app | | | | | | | |
| 10.5 | Offline Test | Offline di halaman Beranda: tombol CTA disable, banner tampil | | | | | | | |
| 10.6 | Offline Test | Offline di halaman Riwayat: data cache tampil | | | | | | | |

### 10B. Skenario Geofence Spoofing

| No | Kategori (Menu) | Fitur / Poin Pengecekan | Status Pengujian | Keterangan | Catatan QC | Status Perbaikan | Respon Developer | Dokumentasi Developer (Link/Bukti) | Verifikasi QC |
|----|-----------------|------------------------|-----------------|------------|------------|-----------------|-----------------|-----------------------------------|--------------|
| 10.7 | Geofence Test | Mock location GPS ke >10m dari target → scan ditolak | | | | | | | |
| 10.8 | Geofence Test | Mock location GPS ke ≤10m → scan diterima | | | | | | | |
| 10.9 | Geofence Test | Perhitungan jarak menggunakan rumus Haversine (SRS FR-02) | | | | | | | |
| 10.10 | Geofence Test | Backend juga validasi geofencing (bukan hanya client-side) — ref: BUG-001 | | | | | | | |

### 10C. Skenario Timeout AI

| No | Kategori (Menu) | Fitur / Poin Pengecekan | Status Pengujian | Keterangan | Catatan QC | Status Perbaikan | Respon Developer | Dokumentasi Developer (Link/Bukti) | Verifikasi QC |
|----|-----------------|------------------------|-----------------|------------|------------|-----------------|-----------------|-----------------------------------|--------------|
| 10.11 | AI Timeout | Simulasi jaringan lambat (throttle 3G) → UI tidak stuck loading | | | | | | | |
| 10.12 | AI Timeout | Loading bisa dibatalkan / ada fallback button "Coba Lagi" | | | | | | | |
| 10.13 | AI Timeout | Timeout 2000ms terlewati → alert error muncul (bukan infinite loading) | | | | | | | |

### 10D. Skenario Token Expired

| No | Kategori (Menu) | Fitur / Poin Pengecekan | Status Pengujian | Keterangan | Catatan QC | Status Perbaikan | Respon Developer | Dokumentasi Developer (Link/Bukti) | Verifikasi QC |
|----|-----------------|------------------------|-----------------|------------|------------|-----------------|-----------------|-----------------------------------|--------------|
| 10.14 | Token Test | Diamkan app hingga JWT expired → lakukan aksi (refresh riwayat) | | | | | | | |
| 10.15 | Token Test | Interceptor Dio: berhasil auto-refresh token via Cookie/refresh token | | | | | | | |
| 10.16 | Token Test | Jika refresh token mati → user otomatis logout ke halaman Login | | | | | | | |
| 10.17 | Token Test | Session expired notification/snackbar tampil sebelum logout | | | | | | | |

### 10E. Responsivitas & Kompatibilitas Layar

| No | Kategori (Menu) | Fitur / Poin Pengecekan | Status Pengujian | Keterangan | Catatan QC | Status Perbaikan | Respon Developer | Dokumentasi Developer (Link/Bukti) | Verifikasi QC |
|----|-----------------|------------------------|-----------------|------------|------------|-----------------|-----------------|-----------------------------------|--------------|
| 10.18 | Responsif | Layout di device kecil (sm: ≥360px) → teks tidak terpotong/overflow | | | | | | | |
| 10.19 | Responsif | Layout di tablet (md: ≥768px) → tampilan proporsional | | | | | | | |
| 10.20 | Responsif | Bottom Navigation Bar tampil benar di semua ukuran layar | | | | | | | |
| 10.21 | Responsif | Dialog/Alert tidak terpotong di layar kecil | | | | | | | |
| 10.22 | Responsif | Orientasi landscape → layout tidak broken | | | | | | | |

---

## 11. KEAMANAN & NON-FUNGSIONAL

| No | Kategori (Menu) | Fitur / Poin Pengecekan | Status Pengujian | Keterangan | Catatan QC | Status Perbaikan | Respon Developer | Dokumentasi Developer (Link/Bukti) | Verifikasi QC |
|----|-----------------|------------------------|-----------------|------------|------------|-----------------|-----------------|-----------------------------------|--------------|
| 11.1 | Keamanan | JWT token tersimpan di `flutter_secure_storage` (bukan SharedPref biasa) | | | | | | | |
| 11.2 | Keamanan | Endpoint transaksi memerlukan header Authorization JWT — ref: BUG-006 | | | | | | | |
| 11.3 | Keamanan | Rate limiting login aktif: maks 5 gagal / 15 menit — ref: BUG-006 | | | | | | | |
| 11.4 | Keamanan | Batas request AI: maks 50 request per user/hari (SRS NFR-02) | | | | | | | |
| 11.5 | Keamanan | Data sensitif (password) tidak tampil di log/console | | | | | | | |
| 11.6 | Non-Fungsional | Koneksi internet wajib untuk fitur inti (SRS NFR-05) | | | | | | | |
| 11.7 | Non-Fungsional | App start-up time wajar (<3 detik splash) | | | | | | | |
| 11.8 | Non-Fungsional | Navigasi antar halaman smooth (tidak lag/jank) | | | | | | | |
| 11.9 | Non-Fungsional | Memory usage stabil (tidak memory leak setelah navigasi berulang) | | | | | | | |
| 11.10 | Non-Fungsional | Notifikasi FCM diterima saat app di foreground | | | | | | | |
| 11.11 | Non-Fungsional | Notifikasi FCM diterima saat app di background | | | | | | | |
| 11.12 | Non-Fungsional | Notifikasi "Tempat Sampah Penuh" masuk ke petugas saat kapasitas >90% (SRS FR-04) — ref: BUG-004 | | | | | | | |

---

## 12. REFERENSI SILANG BUG YANG DIKETAHUI (KNOWN ISSUES)

Daftar bug dari dokumen QA Issues yang WAJIB diverifikasi ulang status perbaikannya:

| No | Bug ID | Severity | Deskripsi Singkat | Status Terakhir | Sudah Fixed? | Verifikasi QC |
|----|--------|----------|-------------------|----------------|-------------|--------------|
| 12.1 | BUG-001 | 🔴 Critical | Backend tidak validasi geofencing (jarak Haversine) | Open | | |
| 12.2 | BUG-002 | 🟡 High | Mobile masih pakai mock lokal AI, bukan endpoint backend live | Open | | |
| 12.3 | BUG-003 | 🟡 High | Kalkulasi poin statis (bukan formula kg/L × 100 per SRS FR-03) | Open | | |
| 12.4 | BUG-004 | 🟡 High | Notifikasi "Tempat Sampah Penuh" tidak di-trigger ke FCM/DB | Open | | |
| 12.5 | BUG-005 | 🟢 Medium | Endpoint `/monitoring/live` belum diimplementasi | Open | | |
| 12.6 | BUG-006 | 🔴 Critical | Endpoint transaksi tanpa JWT middleware & login tanpa rate limit | Open | | |

---

## Ringkasan Hasil QC

| Kategori | Total Poin | ✅ PASS | ⚠️ MINOR | ❌ FAIL | ⏳ Belum Diuji |
|----------|-----------|--------|---------|--------|---------------|
| 1. Splash Screen | 8 | | | | |
| 2. Login & Autentikasi | 14 | | | | |
| 3. Navigasi (Navbar) | 8 | | | | |
| 4. Beranda (Dashboard) | 14 | | | | |
| 5. Alur Inti (Scan, Foto, Deteksi) | 34 | | | | |
| 6. Riwayat | 13 | | | | |
| 7. Peta & Monitoring | 14 | | | | |
| 8. Profil & Pengaturan | 17 | | | | |
| 9. Pengosongan Tong On-Demand | 8 | | | | |
| 10. Skenario Khusus QC | 22 | | | | |
| 11. Keamanan & Non-Fungsional | 12 | | | | |
| 12. Known Issues Verification | 6 | | | | |
| **TOTAL** | **170** | | | | |

---

## Tanda Tangan

| Peran | Nama | Tanggal | Tanda Tangan |
|-------|------|---------|-------------|
| QC Tester | | | |
| QC Lead | | | |
| Project Manager | | | |
| Developer Lead | | | |

---

*Dokumen ini dibuat berdasarkan analisis lengkap dari:*
- *`docs/mobile_ui_ux_flow.md` — Alur UI/UX & Referensi QC Mobile*
- *`docs/prd.md` — Product Requirement Document*
- *`docs/srs.md` — Software Requirement Specification (FR-01 s/d FR-06, NFR-01 s/d NFR-06)*
- *`docs/qa_issues_trello_github.md` — Known QA Issues (BUG-001 s/d BUG-006)*
