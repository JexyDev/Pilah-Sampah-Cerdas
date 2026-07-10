# Aplikasi Mobile Warga — Pilah Sampah Cerdas

Aplikasi mobile berbasis **Flutter (Dart)** untuk warga menyetor sampah, memotret/verifikasi AI, scan QR tong, mengumpulkan poin, dan mengajukan reset kapasitas tong sampah.

## 🛠️ Persyaratan Sistem (Prerequisites)
Sebelum menjalankan, pastikan Anda telah memasang:
*   [Flutter SDK (v3.x atau lebih baru)](https://docs.flutter.dev/get-started/install)
*   [Android Studio](https://developer.android.com/studio) / Xcode (untuk iOS)
*   Java Development Kit (JDK 11 atau lebih baru)

---

## 🚀 Panduan Memulai Cepat (Local Development)

### 1. Masuk ke Folder Mobile
```bash
cd mobile
```

### 2. Ambil Modul & Dependencies
Jalankan instalasi dependencies Flutter pub:
```bash
flutter pub get
```

### 3. Jalankan Pengujian Linting
Gunakan perintah ini untuk memverifikasi linter kode:
```bash
flutter analyze
```

### 4. Jalankan Aplikasi di Emulator / HP Fisik
Sambungkan device fisik Anda (dengan USB debugging aktif) atau nyalakan emulator Android/iOS, lalu ketik perintah:
```bash
flutter run
```

---

## 🎨 Spesifikasi Tampilan & Aset Acuan
Semua screens acuan visual yang diekspor dari Stitch AI terletak di folder:
`/mobile/assets/stitch_ui`
*   Layar utama warga: `beranda.png`
*   Layar scan QR code: `scan_qr_bin.png`
*   Layar pengajuan reset tong penuh: `failed_scan_step_1.png`
*   Layar aktivasi tong baru: `aktivasi_bin.png`
