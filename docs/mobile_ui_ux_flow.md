# Alur UI/UX & Referensi QC Mobile - Pilah Sampah Cerdas

Dokumen ini memetakan alur antarmuka dan pengalaman pengguna (UI/UX) dari ujung ke ujung pada aplikasi mobile. Gunakan dokumen ini sebagai acuan pembuatan Form Quality Control (QC).

## 1. Fase Inisialisasi & Autentikasi

### 1.1. Splash Screen
*   **Trigger:** User membuka aplikasi.
*   **UI:** Logo aplikasi, warna latar standar (Primary), indikator loading.
*   **Proses System:** 
    *   Cek koneksi internet (`connectivity_plus`).
    *   Cek token JWT di `flutter_secure_storage`.
*   **Routing:**
    *   Ada token valid -> Ke Halaman Beranda (Dashboard).
    *   Token tidak ada/expired -> Ke Halaman Login.

### 1.2. Halaman Login
*   **UI:** Form Email, Form Password (dengan toggle mata), Tombol Login.
*   **State:**
    *   *Empty State:* Tombol Login disable jika field kosong.
    *   *Loading State:* Spinner pada tombol saat fetch API, field form disable.
    *   *Error State:* Snackbar merah (Kredensial salah, Timeout, Rate limit >5x/15mnt).
*   **Routing:** Sukses -> Simpan Token -> Redirect ke Beranda sesuai Role.

---

## 2. Navigasi Utama (Bottom Navigation Bar)
Terdiri dari 3-4 Tab tergantung Role:
1.  **Beranda** (Semua Role)
2.  **Riwayat** (Semua Role)
3.  **Peta** (Khusus PETUGAS / ADMIN)
4.  **Profil** (Semua Role)

---

## 3. Alur Beranda (Dashboard)

### 3.1. Header & Status
*   **UI:** Sapaan "Halo, [Nama]", Role badge, Foto profil kecil.
*   **Kondisi Offline:** Muncul Banner Merah `NETWORK_UNAVAILABLE` di bawah header.

### 3.2. Section Saldo/Statistik
*   **Warga:** Tampil Total Poin (dengan animasi hitung naik).
*   **Petugas:** Tampil ringkasan tong penuh di area tugasnya.
*   **State Offline:** Menampilkan angka terakhir dari cache (`SharedPreferences`).

### 3.3. Call-To-Action (Scan QR)
*   **UI:** Tombol FAB / Tombol besar di tengah layar "Mulai Buang Sampah".
*   **Kondisi Offline:** Tombol berwarna abu-abu (Disabled), `onPressed: null`.

### 3.4. Widget Notifikasi Cepat
*   **UI:** List 3 notifikasi terbaru (FCM). 
*   **Petugas:** Alert tong penuh (>90%).

---

## 4. Alur Inti: Pemilahan & Buang Sampah (Warga & Petugas)

### 4.1. Akses Kamera & Scan QR
*   **Trigger:** Klik tombol "Mulai Buang Sampah".
*   **Permission:** Prompt minta akses Kamera & Lokasi (GPS). Tolak -> Tampil error wajib izinkan.
*   **UI:** Viewfinder kamera, garis batas scan, tombol nyalakan flash.
*   **Proses & Validasi (QC Points):**
    *   *Geofencing:* Hitung jarak Haversine (Lokasi HP vs Koordinat Tong dari DB). Jarak > 10m -> Alert dialog "Anda terlalu jauh dari tong sampah".
    *   *Kapasitas:* Jika API lapor tong penuh (≥25L) -> Alert dialog "Tong Penuh, cari tong lain".
    *   *Format QR:* Validasi QR invalid -> Alert "QR tidak dikenali".

### 4.2. Pengambilan Foto Sampah (AI Detection)
*   **Trigger:** QR & Lokasi valid.
*   **UI:** Layar kamera dengan instruksi "Foto sampah Anda dengan jelas".
*   **Proses QC:**
    *   Ambil foto -> Sistem kompres otomatis (< 1MB).
    *   Kirim ke endpoint AI.
    *   *Loading:* Muncul overlay loading "AI Sedang Menganalisa..." (Maks timeout 2000ms).
    *   *Error Timeout:* Alert "Analisa gagal, coba lagi."

### 4.3. Hasil Deteksi & Konfirmasi
*   **UI:** Thumbnail foto, Label Kategori (ORGANIC warna hijau, NON_ORGANIC warna kuning/biru), Estimasi poin (0.4 kg/L atau 0.2 kg/L).
*   **Aksi:** 
    *   "Ulangi Foto" -> Kembali ke 4.2.
    *   "Simpan & Masukkan" -> Submit data ke BE.
*   **Routing:** Submit sukses -> Muncul Lottie animation sukses -> Halaman Beranda direfresh.

---

## 5. Alur Riwayat (History)

### 5.1. Tampilan Daftar Riwayat
*   **UI:** List view card riwayat pembuangan.
*   **Isi Card:** Tanggal, Waktu, Lokasi Tong, Kategori (Organik/Non), Poin didapat.
*   **Interaksi:** Pull-to-refresh untuk update data. Scroll ke bawah untuk pagination (Infinite scroll).
*   **State:**
    *   *Loading:* Shimmer effect.
    *   *Empty:* Ilustrasi keranjang kosong "Belum ada riwayat pembuangan".
    *   *Offline:* Menampilkan data yang di-cache lokal. Pull-to-refresh menampilkan snackbar "Anda sedang offline".

---

## 6. Alur Peta & Monitoring (Khusus Petugas/Admin)

### 6.1. Peta Live (Leaflet / Map)
*   **UI:** Full screen map dengan posisi GPS user (titik biru).
*   **Marker Tong:**
    *   Icon Hijau: Kapasitas aman.
    *   Icon Merah/Blinking: Kapasitas penuh (>90%).
*   **Proses:** Auto-refresh setiap 30 detik.

### 6.2. Detail Tong & Eksekusi
*   **Trigger:** Tap pada marker merah.
*   **UI:** Bottom Sheet muncul menampilkan Info Tong (ID, Alamat, Persentase Penuh).
*   **Aksi:** Tombol "Kosongkan Tong" -> Muncul dialog konfirmasi -> Hit API Reset -> Marker berubah hijau.

---

## 7. Alur Profil & Pengaturan

### 7.1. Halaman Profil
*   **UI:** Foto, Nama, Email, Role, Kelurahan/RT/RW.
*   **Aksi:**
    *   Ganti Password (buka form old password & new password).
    *   Pusat Bantuan / Syarat & Ketentuan.

### 7.2. Alur Keluar (Logout)
*   **Trigger:** Tap tombol "Keluar".
*   **UI:** Dialog konfirmasi "Yakin ingin keluar?".
*   **Proses:** 
    *   Hapus JWT dari secure storage.
    *   Hapus cache SharedPreferences.
*   **Routing:** Kembali ke Halaman Login.

---

## 8. Panduan Khusus QC (Checklist Tambahan)

Tim QC wajib memverifikasi skenario berikut:
1.  **Skenario Offline-Online Drop:** Matikan koneksi internet saat di tengah proses scan QR atau foto. Aplikasi tidak boleh crash, wajib muncul banner / dialog error jaringan.
2.  **Skenario Geofence Spoofing:** Coba mock location GPS ke jarak >10m dari target. Sistem wajib menolak scan.
3.  **Skenario Timeout AI:** Simulasikan jaringan lambat (throttle 3G). Pastikan UI tidak stuck loading lebih dari indikator wajar dan bisa dibatalkan (graceful fallback).
4.  **Skenario Token Expired:** Diamkan aplikasi hingga JWT expired, lakukan aksi (misal refresh history), pastikan interceptor Dio berhasil me-refresh token via Cookie atau me-logout user jika refresh token mati.
5.  **Responsivitas Layar:** Test layout di device kecil (sm: 360px) dan tablet (md: 768px). Pastikan teks tidak terpotong (overflow pixels).
