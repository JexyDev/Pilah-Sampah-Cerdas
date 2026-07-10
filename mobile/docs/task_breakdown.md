# Task Breakdown
## pilahsampah.id | Mobile App (Flutter)
**Versi:** 1.0.0 | **Assignee:** Habil (Flutter Developer) | **Sprint:** 1
**Prasyarat:** Backend berjalan + Ngrok aktif + URL dikomunikasikan ke Habil

---

## Aturan Umum
- Branch: `feature/mobile-<nama-task>` dari `main`
- Setiap screen harus di-test di **Android Emulator** (Android 8.0, API 26)
- BASE_URL diubah di `assets/.env` — TIDAK ada hardcode URL di source code
- Koordinasikan Ngrok URL terbaru dengan Jeremy setiap kali session dimulai

---

## FASE 0: Setup Project Flutter (Estimasi: 1.5 jam)

### Task MOB-00: Inisialisasi Project
- [ ] `flutter create pilahsampah_mobile --org id.pilahsampah --platforms android,ios`
- [ ] Tambah dependensi ke `pubspec.yaml`:
  ```yaml
  dependencies:
    flutter_bloc: ^8.1.3
    dio: ^5.4.0
    flutter_secure_storage: ^9.0.0
    image_picker: ^1.0.7
    flutter_image_compress: ^2.1.0
    mobile_scanner: ^5.0.0
    go_router: ^13.0.0
    google_fonts: ^6.2.1
    flutter_dotenv: ^5.1.0
    
  dev_dependencies:
    flutter_lints: ^3.0.0
  ```
- [ ] Jalankan `flutter pub get`
- [ ] Buat struktur folder sesuai `sdd.md` Section 2
- [ ] Buat `assets/.env` dengan `API_BASE_URL`
- [ ] Tambahkan `assets/.env` ke `pubspec.yaml` di bagian assets
- [ ] Setup `app_theme.dart` dengan semua color constants dan ThemeData

### Task MOB-01: Core Infrastructure
- [ ] Buat `core/config/app_config.dart` (load .env)
- [ ] Buat `core/storage/secure_storage.dart` (singleton flutter_secure_storage)
- [ ] Buat `core/network/dio_client.dart`:
  - BaseURL dari AppConfig
  - `connectTimeout: 10s`, `receiveTimeout: 15s`
  - Auth interceptor: baca token dari secure_storage → set Authorization header
  - Error interceptor: 401 → clear token → navigate login
- [ ] Buat `core/network/api_response.dart`: `ApiResponse<T>` + `ApiError`
- [ ] Buat `core/error/failure.dart`: mapping error code → pesan Bahasa Indonesia
- [ ] Setup `go_router` di `main.dart` dengan semua routes

**Verifikasi:** `flutter run` → splash screen muncul tanpa crash

---

## FASE 1: Autentikasi (Estimasi: 2 jam)

### Task MOB-02: Splash Screen + Auto-Login
- [ ] Buat `SplashScreen`:
  - Logo + nama app tampil selama 2 detik
  - Baca token dari secure_storage
  - Ada token → `GET /api/v1/auth/me`
    - 200 → navigate ke HomeScreen
    - 401 → hapus token → navigate ke LoginScreen
  - Tidak ada token → navigate ke LoginScreen
- [ ] Pastikan navigation menggunakan `go_router` `pushReplacement` (hapus history)

### Task MOB-03: Login Screen
- [ ] Buat `LoginScreen` sesuai `ui_ux_flow.md` Screen 1
- [ ] Email input + Password input (show/hide toggle)
- [ ] Tombol "Masuk" full-width 56px hijau
- [ ] `AuthBloc`: state `AuthInitial | AuthLoading | AuthSuccess | AuthError`
- [ ] API: `POST /api/v1/auth/login { clientType: "mobile" }`
- [ ] Simpan token ke secure_storage (key: "access_token")
- [ ] Error: Snackbar merah dengan pesan Bahasa Indonesia

### Task MOB-04: Register Screen
- [ ] Buat `RegisterScreen` sesuai `ui_ux_flow.md` Screen 2
- [ ] Form: NIK (16 digit, validasi), nama, telepon, kelurahan, RT, RW, alamat, GPS
- [ ] GPS button: `Geolocator.getCurrentPosition()` → tampilkan chip koordinat
- [ ] Dropdown Kelurahan: Dago, Sadangserang, Sekeloa, Lebak Siliwangi, Cipaganti, Coblong
- [ ] Submit → `POST /api/v1/auth/register`
- [ ] Success dialog hijau → kembali ke Login

**Verifikasi:** Login dengan akun seed `admin@coblong.go.id` / `admin123` → masuk HomeScreen

---

## FASE 2: Home Screen (Estimasi: 1.5 jam)

### Task MOB-05: Home Screen
- [ ] Buat `HomeScreen` sesuai `ui_ux_flow.md` Screen 3
- [ ] Header: salam "Halo, [Nama]!" dari state auth
- [ ] `ComplianceWidget`: progress bar kesadaran hari ini dari `/auth/me`
- [ ] `ActionButtonCard` Organik (hijau) → navigate ke CameraScreen dengan `wasteType: ORGANIC`
- [ ] `ActionButtonCard` Anorganik (biru) → navigate ke CameraScreen dengan `wasteType: NON_ORGANIC`
- [ ] `RecentHistoryList`: fetch 2 log terakhir dari `GET /api/v1/waste/logs?limit=2`
- [ ] Bottom Navigation Bar: Beranda | Riwayat | Profil

**Verifikasi:** HomeScreen load dengan data user yang benar dari backend

---

## FASE 3: Alur Foto & AI (Estimasi: 4 jam)

### Task MOB-06: Camera Screen
- [ ] Buat `CameraScreen` sesuai `ui_ux_flow.md` Screen 4
- [ ] Gunakan `image_picker`: tampilkan preview sebelum kirim
- [ ] Tombol "Ambil Foto" + "Gunakan Foto Ini" + "Ambil Ulang"
- [ ] Buat `ImageCompressService`:
  ```dart
  // Kompres hingga < 1MB
  // maxWidth: 1280, maxHeight: 960, quality: 75
  // Jika masih > 1MB → kompres ulang dengan quality: 50
  ```
- [ ] Setelah "Gunakan Foto Ini":
  - Tampilkan `LoadingOverlay`: "Mendeteksi jenis sampah..."
  - `POST /api/v1/waste/detect-mock` (multipart/form-data)
  - Navigate ke AiResultScreen ATAU tampilkan error dialog

### Task MOB-07: AI Result Screen
- [ ] Buat `AiResultScreen` sesuai `ui_ux_flow.md` Screen 5
- [ ] Tampilkan: jenis, volume, confidence, konversi berat, estimasi poin
- [ ] Kalkulasi poin di client: `berat × 100` (untuk preview sebelum konfirmasi)
- [ ] "Konfirmasi & Pindai QR" → Navigate ke QrScannerScreen
- [ ] "Hasil Tidak Sesuai? Ulangi" → kembali ke CameraScreen
- [ ] Semua error dialog sesuai `ui_ux_flow.md` Screen 5

### Task MOB-08: QR Scanner Screen
- [ ] Buat `QrScannerScreen` sesuai `ui_ux_flow.md` Screen 6
- [ ] Gunakan `mobile_scanner` untuk scan QR Code
- [ ] Setelah QR terbaca: hentikan scanner → tampilkan loading
- [ ] `POST /api/v1/bins/scan` dengan semua data transaksi
- [ ] Handle semua response: 201 SUCCESS, 400 INVALID_BIN_TYPE, 400 BIN_OVERFLOW, 404 NOT_FOUND
- [ ] Success → Navigate ke SuccessScreen

**Verifikasi:** Foto sampah → AI result muncul → scan QR seed → transaksi berhasil → success screen

---

## FASE 4: Success Screen & History (Estimasi: 1.5 jam)

### Task MOB-09: Success Screen
- [ ] Buat `SuccessScreen` sesuai `ui_ux_flow.md` Screen 7
- [ ] Animasi centang hijau: `AnimatedContainer` scale 0→1 durasi 600ms
- [ ] Tampilkan poin diperoleh + total poin + status tong
- [ ] Auto-navigate ke HomeScreen setelah 5 detik
- [ ] Tombol manual "Selesai" + "Lihat Riwayat"

### Task MOB-10: History Screen
- [ ] Buat `HistoryScreen` sesuai `ui_ux_flow.md` Screen 8
- [ ] API: `GET /api/v1/waste/logs` dengan pagination
- [ ] Infinite scroll: `ScrollController` → fetch page berikutnya saat near bottom
- [ ] Filter chips: Semua / Organik / Anorganik
- [ ] `HistoryItemCard`: warna ikon sesuai jenis (hijau/biru), info lengkap
- [ ] `EmptyStateWidget` jika belum ada riwayat

---

## FASE 5: Profile (Estimasi: 1 jam)

### Task MOB-11: Profile Screen
- [ ] Buat `ProfileScreen` sesuai `ui_ux_flow.md` Screen 9
- [ ] Avatar inisial dari nama user (2 huruf pertama)
- [ ] NIK dengan masking: tampilkan hanya 4 digit terakhir
- [ ] Total poin + peringkat RT
- [ ] Tombol "Keluar" → ConfirmDialog → hapus token → navigate ke Login

---

## FASE 6: Testing & Polish (Estimasi: 2 jam)

### Task MOB-12: Testing & Bug Fix
- [ ] Test happy path lengkap: Splash → Login → Home → Foto → AI → QR → Sukses → History
- [ ] Test error handling:
  - [ ] Matikan backend → semua screen tampilkan error yang benar
  - [ ] Login credentials salah → Snackbar merah muncul
  - [ ] Upload foto > 1MB → kompresi berjalan
  - [ ] Simulasi timeout: delay backend 3000ms → AI_TIMEOUT dialog muncul
- [ ] Test di emulator: Android 8.0 (API 26) + Android 13 (API 33)
- [ ] Pastikan font Plus Jakarta Sans tampil dengan benar
- [ ] Pastikan semua teks menggunakan Bahasa Indonesia

### Task MOB-13: Konfigurasi Ngrok
- [ ] Update `assets/.env` dengan Ngrok URL terbaru dari Jeremy
- [ ] Test semua endpoint melalui Ngrok URL (bukan localhost)
- [ ] Pastikan HTTPS berjalan (Ngrok default sudah HTTPS)
- [ ] Test dari device fisik Android (bukan hanya emulator)

---

## Urutan Eksekusi (Sequential)

```
MOB-00 → MOB-01 → MOB-02 → MOB-03 → MOB-04 → MOB-05 → MOB-06 → MOB-07 → MOB-08 → MOB-09 → MOB-10 → MOB-11 → MOB-12 → MOB-13
```

**Estimasi total:** ±15 jam kerja (±3 hari kerja efektif sprint 1)

---

## Koordinasi dengan Jeremy (Backend)

| Yang Habil Butuhkan | Cara Mendapatkan |
|---------------------|------------------|
| Ngrok URL terbaru | Tanya Jeremy setiap mulai session |
| Format QR Code tong | Dari seed database: `BIN-RT{no}-{id}-{ORG/NON}` |
| Kredensial test | `admin@coblong.go.id` / `admin123` |
| Contoh response AI | Lihat `backend/docs/ui_ux_flow.md` FLOW 3 |

---

## Link Trello Terkait
- `[MOBILE] Implementasi Fitur Scan Foto Sampah & Deteksi AI Mock (Alur Utama)`
- `[MOBILE] Integrasi Scanner QR Code Tong Sampah & Validasi Backend`
- `[MOBILE] Implementasi Autentikasi & Penyimpanan Token Aman (JWT + flutter_secure_storage)`
- `[MOBILE] Kompresi Gambar, Riwayat Setoran & Konfigurasi Ngrok`
