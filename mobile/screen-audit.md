# Audit Kedalaman Layar (Screen Audit)

Berdasarkan pengecekan mendalam terhadap file-file di dalam `lib/presentation/`, berikut adalah status implementasi UI dan integrasinya:

## 1. Layar Utama (Screens)

**a. `login_screen.dart`**
- **Status:** Menggunakan repository sungguhan (`ApiAuthRepository` via `authProvider`).
- **Endpoint:** Memanggil `/api/v1/auth/login` (format backend lama).
- **Validasi:** Sudah ada validasi form dasar, menembak error ke UI via Snackbar.

**b. `beranda_screen.dart`**
- **Status:** Menggunakan repository sungguhan (`totalPointsProvider`, `wasteLogsProvider` via `ApiWasteLogRepository`).
- **Endpoint:** Memanggil `/api/v1/points/me` dan `/api/v1/transactions/my-deposits`.
- **UI:** UI terhubung dengan state Riverpod (bukan dummy data). Terdapat handler untuk refresh data.

**c. `main_shell.dart`**
- **Status:** Menjadi kerangka navigasi utama (BottomNavigationBar) yang membungkus Beranda, Poin, Riwayat, dan Profil.

**d. `poin_screen.dart` & `riwayat_screen.dart`**
- **Status:** Keduanya mengonsumsi `wasteLogsProvider` dan `pointHistoryProvider` secara riil. Membutuhkan sinkronisasi dengan endpoint backend yang benar nantinya.

**e. `profil_screen.dart`**
- **Status:** Menampilkan data dari `authProvider.user` (fetch dari `/api/v1/households/me`). Saat ini *belum ada fitur upload foto profil*, perlu ditambahkan di tahap redesign.

**f. `scan_flow_screen.dart`**
- **Status:** Menggabungkan kamera, proses deteksi AI, dan QR scanner dengan alur State (step 0 sampai 3). Menggunakan `ApiBinRepository` (`/api/v1/waste/detect` dan `/api/v1/bins/scan`). 
- **Integrasi:** Sangat terstruktur, tetapi wajib disinkronisasi endpoint-nya.

**g. `aktivasi_bin_screen.dart` & `reset_bin_screen.dart`**
- **Status:** Tersambung ke provider terkait. Logika aktivasi dan reset mengambil data dari `/api/v1/bins/my`.

## 2. Komponen Khusus (Widgets)

**h. `inline_camera_widget.dart`**
- **Kondisi Kamera:** Menggunakan package `camera` asli untuk device, bukan file picker (kecuali di web fallback).
- **Permission:** Penanganan izin bergantung pada internal package `camera`. Fiturnya sudah berjalan dengan fallback ke Galeri jika kamera tidak bisa dibuka, namun tampilan *error state/permission denied* bisa dipercantik.

**i. `qr_scanner_widget.dart`**
- **Kondisi QR:** Menggunakan `mobile_scanner` secara *real-time*.
- **Permission:** **SUDAH MENGGUNAKAN `permission_handler`** (`Permission.camera.request()`). Sudah menangani 3 kondisi dengan UI masing-masing: *loading*, *denied* (izin ditolak), dan *permDenied* (ditolak permanen -> arahkan ke setting).

## Kesimpulan
Keseluruhan UI **BUKAN DUMMY**. Semua fitur telah dihubungkan ke Riverpod dan mengakses endpoint backend lokal (lama) teman Anda yang menggunakan path `/api/v1/*`. Fokus tahap selanjutnya adalah mempercantik/menyelaraskan UI dengan versi web, memastikan *empty state/loading* ada, serta menaruh komentar `// TODO-SYNC` di semua `Api*Repository` untuk persiapan tahap integrasi.
