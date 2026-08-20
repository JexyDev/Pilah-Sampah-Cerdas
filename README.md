# BERSEKA Mobile App — Client Application

Aplikasi Mobile Client resmi untuk **BERSEKA (Bersih, Sehat, Kampung Asri)** berbasis **Flutter**. Aplikasi ini memfasilitasi Warga untuk memantau status tempat sampah, melakukan penyetoran sampah cerdas terverifikasi AI, pendaftaran QR oleh Mahasiswa KKN, serta timbangan residu oleh Petugas Pemilahan.

---

## 🛠️ Persyaratan Sistem (Prerequisites)

Sebelum mulai mengembangkan, pastikan Anda telah memasang:
* **Flutter SDK**: `>=3.22.x` (Target minimal `>=3.44.0` per pubspec)
* **Dart SDK**: `>=3.12.x`
* **Android Studio / Xcode**: Untuk emulator dan SDK Android/iOS

---

## 🚀 Panduan Memulai Cepat (Local Development)

### 1. Install Dependencies
Jalankan perintah ini di root folder `mobile` untuk mengunduh semua paket dependensi pubspec:
```bash
flutter pub get
```

### 2. Konfigurasi Endpoint API
Secara default, aplikasi akan terhubung ke domain produksi `https://berseka.id`. 
Untuk mengarahkan endpoint ke localhost atau IP dev backend lokal, gunakan opsi `--dart-define` saat menjalankan/membangun aplikasi:
```bash
flutter run --dart-define=API_BASE_URL=http://localhost:3000
```

### 3. Jalankan Aplikasi
Jalankan aplikasi ke perangkat terhubung atau emulator:
```bash
flutter run
```

---

## 🏗️ Struktur Folder `lib/app/`

```text
lib/
├── app/
│   ├── core/
│   │   ├── theme/          # Tema Visual & Warna
│   │   ├── utils/          # Kompresi Gambar, Geofencing, Sanitizer
│   │   └── values/         # Konstanta API (api_constants.dart), Konfigurasi (app_config.dart)
│   ├── data/
│   │   ├── models/         # Entity & Objek Data (Bin, User, WasteLog)
│   │   ├── providers/      # API Client & Offline Cache Interceptor
│   │   └── repositories/   # Abstraksi Pengambilan Data (API & Local)
│   └── modules/
│       ├── beranda/        # Tampilan Home Screen
│       ├── auth/           # Login Warga (OTP) & Logins email lainnya
│       ├── scan/           # Scanner QR & Alur Pemrosesan AI Kamera
│       ├── mahasiswa/      # Halaman Pendaftaran Posko & Aktivasi QR KKN
│       ├── petugas_pemilahan/# Timbangan manual Petugas Residu
│       └── splash/         # Splash screen minimalis
├── main.dart               # Entry Point Aplikasi
```

---

## 📦 Perintah Build Produksi (Release Build)

Build APK Rilis untuk Android:
```bash
flutter build apk --release --dart-define=API_BASE_URL=https://berseka.id
```

Build Bundle App untuk Google Play Store:
```bash
flutter build appbundle --release --dart-define=API_BASE_URL=https://berseka.id
```
