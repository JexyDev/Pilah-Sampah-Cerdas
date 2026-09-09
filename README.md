# BERSEKA Mobile App — Client Application

[![Mobile CI/CD](https://github.com/JexyDev/Pilah-Sampah-Cerdas/actions/workflows/deploy.yml/badge.svg?branch=mobile)](https://github.com/JexyDev/Pilah-Sampah-Cerdas/actions/workflows/deploy.yml)
[![Flutter Version](https://img.shields.io/badge/Flutter-v3.22+-blue.svg)](https://flutter.dev/)
[![Dart Version](https://img.shields.io/badge/Dart-v3.12+-teal.svg)](https://dart.dev/)
[![License](https://img.shields.io/badge/License-Proprietary-blue.svg)](LICENSE)

Aplikasi Mobile Client resmi untuk **BERSEKA (Bersih, Sehat, Kampung Asri)** berbasis **Flutter**. Aplikasi ini memfasilitasi Warga untuk memantau status tempat sampah, melakukan penyetoran sampah cerdas terverifikasi AI, pendaftaran QR oleh Mahasiswa KKN, serta timbangan residu oleh Petugas Pemilahan.

---

## 🌐 Lingkungan & Konfigurasi API (Multi-Environment)

Aplikasi mobile mendukung konfigurasi endpoint backend dinamis menggunakan `--dart-define=API_BASE_URL=...`:

| Lingkungan | Target API URL | Output Nama APK | Lokasi Unduh |
|---|---|---|---|
| **Lokal (Dev)** | `http://localhost:3000` atau IP LAN | Build lokal debug | Perangkat dev |
| **Staging (QA)** | [staging.berseka.id](https://staging.berseka.id) | `berseka-staging-arm64-v8a.apk` | [Download APK Staging](https://staging.berseka.id/downloads/berseka-staging-arm64-v8a.apk) |
| **Production** | [berseka.id](https://berseka.id) | `berseka-release-arm64-v8a.apk` | [Download APK Production](https://berseka.id/downloads/berseka-release-arm64-v8a.apk) |

---

## 🛠️ Persyaratan Sistem (Prerequisites)

Sebelum mulai mengembangkan, pastikan Anda telah memasang:
* **Flutter SDK**: `>=3.22.x` (Target rekomendasi `>=3.44.0`)
* **Dart SDK**: `>=3.12.x`
* **Android Studio / Xcode**: Untuk emulator dan SDK Android/iOS

---

## 🚀 Panduan Memulai Cepat (Local Development)

### 1. Install Dependencies
Jalankan perintah ini di root folder branch `mobile`:
```bash
flutter pub get
```

### 2. Jalankan Aplikasi di Perangkat / Emulator

* **Koneksi ke Backend Staging (Rekomendasi QA):**
  ```bash
  flutter run --dart-define=API_BASE_URL=https://staging.berseka.id
  ```
* **Koneksi ke Backend Lokal Developer:**
  ```bash
  flutter run --dart-define=API_BASE_URL=http://localhost:3000
  ```
* **Koneksi ke Backend Produksi:**
  ```bash
  flutter run --dart-define=API_BASE_URL=https://berseka.id
  ```

---

## 🚀 CI/CD & Prosedur Build APK (GitHub Actions)

Proses kompilasi dan distribusi APK ditangani secara otomatis melalui GitHub Actions:

### 1. Build APK Staging (Untuk Testing & QA)
1. Buka tab **Actions** di GitHub repository.
2. Pilih workflow **"BERSEKA Mobile — CI/CD Pipeline"**.
3. Klik **Run workflow**:
   - Branch: `mobile`
   - Target Environment: pilih **`staging`**
4. CI akan mengompilasi APK dan mengunggahnya langsung ke VPS Staging di:
   `https://staging.berseka.id/downloads/berseka-staging-arm64-v8a.apk`

### 2. Rilis APK Production
Jalankan workflow dengan memilih Target Environment **`production`** (atau push commit ke branch `mobile`). APK rilis otomatis terunggah ke:
`https://berseka.id/downloads/berseka-release-arm64-v8a.apk`

---

## 🏗️ Struktur Folder `lib/app/`

```text
lib/
├── app/
│   ├── core/
│   │   ├── theme/            # Tema Visual & Warna (AppColors)
│   │   ├── utils/            # Kompresi Gambar, Geofencing, Sanitizer
│   │   └── values/           # Konstanta API (api_constants.dart), Konfigurasi (app_config.dart)
│   ├── data/
│   │   ├── models/           # Entity & Objek Data (Bin, User, WasteLog)
│   │   ├── providers/        # API Client & Offline Cache Interceptor
│   │   └── repositories/     # Abstraksi Pengambilan Data (API & Local)
│   └── modules/
│       ├── beranda/          # Tampilan Home Screen
│       ├── auth/             # Login Warga (OTP) & Logins email lainnya
│       ├── scan/             # Scanner QR & Alur Pemrosesan AI Kamera
│       ├── mahasiswa/        # Halaman Pendaftaran Posko & Aktivasi QR KKN
│       ├── petugas_pemilahan/# Timbangan manual Petugas Residu
│       └── splash/           # Splash screen minimalis
├── AGENTS.md                 # Pedoman AI Agent untuk mobile (SOP wajib)
└── main.dart                 # Entry Point Aplikasi
```

---

## 🧪 Validasi Kualitas Kode & Analisis Statis (QC Standard)

Sebelum melakukan commit atau mengajukan Pull Request, pastikan kode lulus uji:

```bash
# Validasi Statis Analisis Dart (Wajib 0 Issue)
flutter analyze --no-fatal-warnings

# Menjalankan Seluruh Unit & Widget Tests
flutter test
```

---

## 📋 Standar Pedoman untuk AI & Developer

Setiap kontributor manusia maupun AI Agent (Cursor, Copilot, Antigravity, Claude Code) **wajib** mematuhi [AGENTS.md](AGENTS.md):
* **Larangan Kata 'Tong'**: Dilarang menggunakan kata 'tong' atau 'tong sampah', wajib gunakan 'Tempat Sampah'.
* **Larangan Penggunaan NIK**: Identitas autentikasi menggunakan Nomor Telepon (+62).
* **Anti-Dummy Policy**: Dilarang menampilkan data dummy hardcode tanpa label `[Belum Terhubung API]`.
* **Dynamic API URL**: Selalu gunakan `AppConfig.apiBaseUrl` via `--dart-define`.
* **Review Mandat**: Konfirmasi perubahan ke pengguna sebelum melakukan commit/push/build.
