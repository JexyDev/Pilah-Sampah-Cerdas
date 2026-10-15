# BERSEKA Mobile App

> **Bersih, Sehat, Kampung Asri (BERSEKA)** — Client Mobile Flutter untuk Ekosistem Pengelolaan, Pemilahan Sampah Berbasis Komunitas, Pendampingan Mahasiswa KKN, dan Operasional Lapangan Petugas Pemilahan Residu.

---

## 1. Overview & Tech Stack

Aplikasi mobile BERSEKA menghubungkan tiga kelompok pengguna utama: **Warga**, **Mahasiswa KKN**, dan **Petugas Pemilahan** dalam satu ekosistem terpadu. Arsitektur dibangun dengan standar clean separation of concerns, offline resiliency, dan komputasi edge on-device.

- **UI Framework**: Flutter (>=3.44.0, kompatibel Flutter 3.22+)
- **Bahasa**: Dart (>=3.12.1 <4.0.0)
- **State Management**: Flutter Riverpod (`^2.6.1`) dengan `StateNotifier` dan immutable state pattern
- **Routing & Navigasi**: GetX Router (`AppRoutes`, `AppPages`)
- **HTTP Client**: Dio (`^5.11.0`) dilengkapi interceptor terpusat, token refresh otomatis, dan `NetworkExceptionHelper`
- **Machine Learning & OCR**: `google_mlkit_text_recognition` untuk digitalisasi display timbangan digital
- **Hardware & Peripherals**:
  - Kamera & Scanner: `camera`, `mobile_scanner`, `image_picker`
  - Kompresi Gambar: `flutter_image_compress`
  - Lokasi & Geofencing: `geolocator`, `flutter_foreground_task`, `flutter_map`, `latlong2`
- **Keamanan & Penyimpanan**:
  - Secure Storage: `flutter_secure_storage` via `SafeStorage`
  - Local Cache & Queue: `shared_preferences`, FIFO SQLite/Local Queue (`OfflineQueueService`)
- **Notifikasi**: Firebase Cloud Messaging (`firebase_core`, `firebase_messaging`)

---

## 2. Setup Lingkungan Pengembangan (Dev Setup)

### Persyaratan Sistem
- **Flutter SDK**: Versi stable `3.22.x` atau lebih baru
- **Java SDK**: OpenJDK 17 (disarankan Zulu 17 sesuai target runner CI)
- **Android SDK & Build Tools**: Minimal Android SDK Platform 34 (Android 14)

### Langkah Instalasi
```bash
# 1. Clone repositori dan masuk ke direktori mobile
cd mobile

# 2. Bersihkan artefak lama (bila diperlukan)
flutter clean

# 3. Unduh seluruh dependensi proyek
flutter pub get

# 4. Verifikasi kesiapan lingkungan pengembang
flutter doctor -v
```

---

## 3. Konfigurasi Runtime (`--dart-define`)

Konfigurasi endpoint API bersifat modular dan diinjeksikan saat waktu kompilasi tanpa mengubah kode sumber via `AppConfig`.

### Perintah Menjalankan Aplikasi:

1. **Lingkungan Staging (Server Pengujian/QA)**:
   ```bash
   flutter run --dart-define=API_BASE_URL=https://staging.berseka.id
   ```

2. **Lingkungan Production (Server Rilis Publik)**:
   ```bash
   flutter run --dart-define=API_BASE_URL=https://berseka.id
   ```

3. **Lingkungan Lokal Developer (Backend Localhost/LAN)**:
   ```bash
   flutter run --dart-define=API_BASE_URL=http://<IP_KOMPUTER_BACKEND>:3000
   ```

4. **Kustomisasi Endpoint AI (Opsional)**:
   ```bash
   flutter run --dart-define=AI_API_URL=http://<IP_SERVER_AI>:5000/detect
   ```

---

## 4. Panduan Build & Alur CI/CD

Build APK rilis dikompilasi secara otomatis melalui GitHub Actions (`.github/workflows/deploy.yml`).

### Pipeline Otomatis:
1. **Validasi Kualitas Kode (`validate`)**:
   - Menjalankan `flutter pub get`
   - Strict static analysis: `flutter analyze --no-fatal-warnings` (**wajib 0 warning/issue**)
   - Menjalankan unit test: `flutter test`
2. **Kompilasi Rilis (`build-and-deploy-apk`)**:
   - Kompilasi build APK terpisah per arsitektur ABI (`arm64-v8a`).
   - Otomatis mengunggah artefak build ke server unduhan publik.

### Link Unduh APK Resmi:
| Lingkungan | Target Base URL | Tautan Download APK |
|---|---|---|
| **Staging** | `https://staging.berseka.id/api/v1` | [Download APK Staging](https://staging.berseka.id/downloads/berseka-staging-arm64-v8a.apk) |
| **Production** | `https://berseka.id/api/v1` | [Download APK Production](https://berseka.id/downloads/berseka-release-arm64-v8a.apk) |

---

## 5. Struktur Direktori Arsitektur (`lib/app/`)

Proyek mengadopsi struktur berlapis berbasis domain untuk memudahkan skalabilitas dan isolasi fitur:

```text
lib/
├── app/
│   ├── core/                      # Fondasi & utilitas global
│   │   ├── theme/                 # Palet warna (AppColors), tipografi Poppins
│   │   ├── utils/                 # GeofenceZoneEngine, ScaleDisplayParser, NetworkExceptionHelper
│   │   ├── values/                # AppConfig, ApiConstants, AppDimensions, AppAssets
│   │   └── widgets/               # Komponen UI bersama (AppLoading, AppError, CurvedText)
│   ├── data/                      # Lapisan data dan integrasi API
│   │   ├── models/                # Data model immutable (UserEntity, BinEntity, WasteLogEntity)
│   │   ├── providers/             # Riverpod providers untuk repository & HTTP client
│   │   ├── repositories/          # Implementasi logika repository, caching, dan mapper
│   │   └── services/              # BackgroundTaskHandler, LocationService, OfflineQueueService, FCM
│   ├── modules/                   # Fitur spesifik per domain bisnis / role
│   │   ├── auth/                  # Otentikasi login, session guard, dan lupa kata sandi
│   │   ├── beranda/               # Dashboard warga, feed edukasi, dan agregasi berita
│   │   ├── mahasiswa/             # Presensi geofence, manajemen proker, logbook, dampingan
│   │   ├── petugas_pemilahan/     # Dashboard tugas pickup, OCR timbangan, verifikasi pengosongan
│   │   ├── scan/                  # Pipeline 4-langkah deteksi AI dan verifikasi QR
│   │   ├── riwayat/               # Log riwayat pemilahan dan rekapitulasi timbangan
│   │   ├── poin/                  # Saldo reward, katalog voucher, mutasi, leaderboard
│   │   ├── profil/                # Manajemen tempat sampah rumah tangga, profil pengguna
│   │   ├── warga/                 # Formulir aspirasi warga dan pengaduan layanan
│   │   └── shared/                # Widget input OTP, kamera inline, scanner QR, dialog rating
│   └── routes/                    # Definisi AppRoutes dan mapping GetPage di AppPages
└── main.dart                      # Entry point, ProviderScope, inisialisasi background/Firebase
```

---

## 6. Analisis Alur & Fungsionalitas Role

### A. Role Mahasiswa (KKN)
Mahasiswa KKN bertugas dalam pendampingan warga dan operasional program di tingkat RW:
- **Presensi GPS & Geofence Posko**:
  - Validasi jarak terhadap koordinat Posko Utama atau Posko Multi menggunakan `GeofenceZoneEngine`.
  - Foreground background service (`flutter_foreground_task`) mempertahankan timer presensi saat layar mati/aplikasi di latar belakang.
  - Perekaman jam kerja efektif harian (`targetDurationMinutes`) dan deteksi grace period saat sinyal GPS melayang.
- **Logbook Harian & Dokumentasi**:
  - Formulir kegiatan harian, pencatatan kendala, dan kompresi foto dokumentasi sebelum diunggah.
- **Manajemen Program Kerja (Proker)**:
  - Pengajuan proker kelompok, approval status oleh DPL, pembaruan progres, dan laporan akhir.
- **Monitoring & Aktivasi Warga Dampingan**:
  - Deteksi warga butuh edukasi ulang secara otomatis (kesalahan pemilahan > 30%).
  - Aktivasi stiker QR fisik tempat sampah mandiri ke profil warga binaan.
- **Pemanfaatan Sampah & Panen**:
  - Pencatatan input biokonversi sampah (kompos, maggot BSF) dan pelaporan bobot panen ke sistem.

### B. Role Warga
Warga berperan aktif sebagai produsen pemilahan sampah di tingkat rumah tangga:
- **Pipeline Pemilahan 4-Langkah (Scan Flow)**:
  1. *Ambil Foto*: Pengambilan foto sampah secara langsung via kamera in-app.
  2. *Deteksi AI*: Klasifikasi sampah otomatis (Organik, Anorganik, Residu) dan kalkulasi estimasi poin.
  3. *Pindai QR Tempat Sampah*: Pemindaian stiker QR tempat sampah disertai validasi koordinat GPS live.
  4. *Pencatatan & Reward*: Data tersimpan ke server dan saldo poin bertambah otomatis.
- **Kelola Tempat Sampah Mandiri**:
  - Memantau kapasitas volume tempat sampah rumah tangga (Kosong, Terisi Sebagian, Penuh).
  - Pendaftaran tempat sampah mandiri baru via pairing stiker QR.
- **Poin, Katalog Voucher, & Leaderboard**:
  - Menukar poin hasil pemilahan dengan voucher sembako atau reward mitra.
  - Memantau peringkat keaktifan warga dalam memilah sampah di lingkup RW.
- **Layanan Aspirasi Warga**:
  - Pengajuan keluhan fasilitas, masukan pelayanan, atau laporan kendala lingkungan disertai bukti foto galeri/kamera dan penilaian bintang kepuasan.

### C. Role Petugas Pemilahan
Petugas pemilahan bertugas melakukan validasi logistik dan penimbangan fisik di lapangan:
- **Dashboard Operasional & Window Penjemputan**:
  - Indikator aktif window penjemputan berkala: Shift Pagi (`06:00–08:00`) dan Shift Sore (`16:00–18:00`).
  - Defensive client-side filtering membatasi jadwal tugas hanya pada RW dan Kelurahan penugasan petugas.
- **Timbangan Pemilahan & OCR Display Digital**:
  - Verifikasi jenis sampah (`Organik` / `Anorganik`).
  - Dokumentasi ganda: Foto fisik sampah dan foto display layar timbangan.
  - Pembacaan angka display timbangan otomatis via Google ML Kit Text Recognition (`ScaleDisplayParser`) dengan fallback koreksi manual (`MANUAL` vs `OCR`).
- **Verifikasi Pengosongan Tempat Sampah**:
  - Validasi QR stiker tempat sampah warga target yang mengajukan pengosongan.
  - Pengambilan foto bukti tempat sampah telah dalam kondisi bersih/kosong.
- **Offline-First Synchronization**:
  - Jika berada di area blank spot/minim sinyal, data penimbangan disimpan ke antrean lokal (`OfflineQueueService`).
  - Mekanisme auto-flush FIFO mengeksekusi sinkronisasi data ke server begitu konektivitas internet terdeteksi pulih.

---

## 7. Modul Otentikasi & Alur Forgot Password (E2E)

Modul otentikasi menggunakan basis **Nomor Telepon (+62)** untuk seluruh role pengguna tanpa melibatkan identitas NIK.

### Alur 3-Langkah Pemulihan Kata Sandi (Forgot Password Flow):
1. **Langkah 1: Input & Validasi Nomor Telepon**:
   - Otomatisasi sanitasi input: Menghapus karakter non-digit dan menormalisasi awalan `0` atau `62` ke format standar.
   - Request pengiriman kode verifikasi OTP melalui SMS ke backend.
2. **Langkah 2: Verifikasi OTP 6-Digit**:
   - Memanfaatkan komponen khusus `OtpInputWidget`.
   - Fitur UX modern: Auto-focus ke kotak berikutnya, auto-backspace navigation, dan dukungan clipboard paste listener (menempelkan 6 digit OTP SMS sekaligus ke seluruh kotak input).
   - Countdown timer 60 detik untuk permintaan pengiriman ulang kode OTP.
3. **Langkah 3: Reset Kata Sandi Baru**:
   - Input kata sandi baru dan konfirmasi kata sandi.
   - Validasi kekuatan kata sandi real-time (`PasswordStrengthWidget`) mencakup panjang karakter, kombinasi simbol, huruf, dan angka.
   - Submit token verifikasi dan kata sandi baru ke backend, diikuti pengalihan otomatis ke halaman masuk (login) dengan konfirmasi toast.

---

## 8. Aturan Teknis Repositori & SOP Kontribusi

Pengembang dan agen AI yang bekerja di repositori ini wajib mematuhi ketentuan berikut:

1. **Zero-Warning Strict Linting**:
   - Seluruh perubahan kode Dart wajib lolos kompilasi bersih:
     ```bash
     flutter analyze --no-fatal-warnings
     ```
   - **Toleransi 0 issues**. Pelanggaran linting menggagalkan build CI/CD.
2. **Larangan Istilah 'Tong'**:
   - **Dilarang keras** menggunakan kata `tong` atau `tong sampah` pada teks UI, nama berkas, notifikasi, dokumentasi, maupun komentar kode. Selalu gunakan istilah resmi: **'Tempat Sampah'**.
3. **Penghapusan Total NIK**:
   - Dilarang menambahkan field, parameter, atau tampilan NIK. Otentikasi dan identitas pengguna murni berbasis nomor telepon.
4. **Isolasi Monorepo (Strict Mobile Scope)**:
   - Pengembang di branch `mobile` dilarang memodifikasi direktori backend (`apps/api`) atau web admin (`apps/web`). Kebutuhan integrasi API didokumentasikan dalam format spesifikasi API untuk tim backend.
5. **Kebijakan Anti-Dummy Data**:
   - Dilarang menanamkan data tiruan/mock di UI tanpa label visual penanda `[Belum Terhubung API]`. Seluruh grafik, kalkulasi poin, dan timesheet wajib terikat ke endpoint backend.
6. **Standar Pesan Commit Git**:
   - Format konvensi: `<type>(<scope>): <deskripsi singkat>`
   - Contoh: `feat(mobile): tambah validasi paste pada otp input widget`
   - Opsi type: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`.
