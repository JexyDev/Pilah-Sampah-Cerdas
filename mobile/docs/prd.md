# PRD — Product Requirement Document
## pilahsampah.id | Mobile App (Flutter)
**Versi:** 1.0.0 | **Author:** Habil (Flutter Developer) | **Tanggal:** 8 Juli 2026
**Status:** Active Development | **Phase:** Sprint 1 (Localhost + Ngrok)

---

## 1. Ringkasan Produk

**pilahsampah.id Mobile App** adalah aplikasi Flutter yang digunakan oleh **warga rumah tangga** di Kecamatan Coblong, Bandung untuk mencatat pemilahan sampah sehari-hari. Warga memotret sampah, AI backend mendeteksi jenis dan estimasi volume, lalu warga memindai QR Code tong sampah fisik untuk mencatat transaksi dan mendapatkan poin gamifikasi.

### 1.1 Tujuan Produk
- Menggantikan pencatatan manual sampah yang tidak efisien dengan sistem digital berbasis kamera
- Memberikan feedback instan kepada warga tentang kepatuhan dan poin mereka
- Memicu persaingan positif antar-warga dan antar-RT melalui sistem leaderboard
- Memudahkan petugas RT memantau status tong sampah tanpa harus keliling

### 1.2 Target Pengguna
| Tipe | Deskripsi |
|------|-----------|
| Warga Rumah Tangga | Kepala/anggota keluarga, semua kalangan usia |
| Karakteristik | Tidak semua melek teknologi; UI harus sangat sederhana, tombol besar |
| Device | Smartphone Android (Android 8.0+) utama; iOS opsional |

### 1.3 Referensi Desain
- **Acuan utama:** Stitch AI design pilahsampah.id (mobile version)
- Font: Plus Jakarta Sans | Icon: Material Icons + custom SVG
- Navigasi: Bottom Navigation Bar (3 tab: Beranda, Riwayat, Profil)

### 1.4 Batasan Scope Sprint 1
- Backend diakses via **Ngrok HTTPS URL** (bukan IP lokal — iOS/Android butuh HTTPS)
- Foto dikirim ke backend sebagai **multipart/form-data** (bukan Base64)
- Penyimpanan token JWT menggunakan `flutter_secure_storage`
- Tidak ada push notification (Sprint 1); notifikasi via in-app state saja
- Target platform utama: **Android** (iOS bisa diuji di simulator)

---

## 2. Fitur Utama Aplikasi Mobile

### 2.1 Autentikasi Mobile
- Login dengan email + password
- JWT diterima dari response body API, disimpan di `flutter_secure_storage`
- Setiap request HTTP menggunakan header `Authorization: Bearer <token>`
- Auto-login saat app dibuka jika token masih valid

### 2.2 Beranda Warga
- Salam personal: "Halo, [Nama Warga]! 👋"
- Widget status kepatuhan hari ini: "Kesadaran Anda hari ini: 72% 🎉"
- 2 tombol aksi dominan:
  - 🟢 "Foto Sampah Organik" (besar, hijau)
  - 🔵 "Foto Sampah Anorganik" (besar, biru)
- Riwayat setoran terakhir: Organik X.X Liter · Anorganik X.X Liter

### 2.3 Alur Deteksi AI + Scan QR (Fitur Inti)
1. Warga klik tombol "Foto Sampah"
2. Buka kamera Flutter → warga foto sampah
3. Kompresi gambar: ukuran output < 1MB sebelum dikirim ke backend
4. Kirim ke `POST /api/v1/waste/detect-mock` via Ngrok URL
5. Tampilkan hasil deteksi: jenis + estimasi volume + confidence
6. Warga konfirmasi → buka scanner QR Code
7. Scan QR Code tong sampah fisik
8. Kirim ke `POST /api/v1/bins/scan` dengan data AI + QR code
9. Layar sukses: animasi centang hijau + poin yang diperoleh
10. Error handling di setiap langkah

### 2.4 Riwayat Setoran
- List kronologis transaksi warga
- Setiap item: jenis sampah, volume, berat, poin, waktu, status AI
- Infinite scroll pagination
- Filter: All / Organik / Anorganik

### 2.5 Profil Warga
- Nama, alamat, kelurahan, RT/RW
- Total poin terkumpul
- Peringkat warga di RT saat ini
- Riwayat poin bulan ini
- Tombol "Keluar"

---

## 3. Non-Functional Requirements

| Aspek | Target |
|-------|--------|
| Kompresi foto | Output < 1MB sebelum upload |
| AI timeout threshold | 2000ms — tampilkan error jika melebihi |
| Token storage | flutter_secure_storage (bukan SharedPreferences) |
| Offline behavior | Tampilkan pesan "Tidak ada koneksi" jika network error |
| Target OS | Android 8.0+ (API Level 26+) |
| Orientasi | Portrait only (locked) |
| Ukuran APK | < 30MB (tanpa aset berat) |

---

## 4. Definisi Selesai (DoD) — Sprint 1

- [ ] Login/logout berfungsi dengan token tersimpan aman di flutter_secure_storage
- [ ] Foto sampah terkirim ke Ngrok URL → hasil deteksi AI muncul di layar
- [ ] Scan QR berhasil → transaksi tercatat → poin muncul di layar sukses
- [ ] Error handling semua kasus: timeout, gambar buram, tong penuh, jenis tidak sesuai
- [ ] Riwayat setoran tampil dengan data nyata dari backend
- [ ] App berjalan di emulator Android tanpa crash
