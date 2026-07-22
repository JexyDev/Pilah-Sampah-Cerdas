# Audit Project Mobile `pilahsampah.id`

## 1. STRUKTUR PROJECT
Project ini **ternyata sudah terstruktur dengan sangat baik dan rapi**. Developer sebelumnya menggunakan pendekatan *Clean Architecture* dengan struktur folder sebagai berikut:

- `lib/config/`: Konfigurasi terpusat (contoh: `app_config.dart`).
- `lib/core/`: Berisi konstanta (`app_colors`, `app_strings`, dll), router, utilitas, dan tema aplikasi.
- `lib/data/`: Berisi `api_client` (konfigurasi Dio) dan implementasi repository (`api_auth_repository.dart`, dll).
- `lib/domain/`: Berisi *entities* (model data) dan *repositories interfaces*.
- `lib/presentation/`: Berisi UI/Screens yang dipisah berdasarkan fitur (`aktivasi`, `auth`, `beranda`, `main`, `poin`, `profil`, `riwayat`, `scan`, `splash`). Juga ada subfolder `shared/widgets` untuk komponen UI reusable.

**Status Reorganisasi**: Sudah sesuai standar industri. Tidak berantakan di `main.dart`.

## 2. KONEKSI BACKEND SAAT INI
- **Base URL Terpusat**: Base URL tidak di-hardcode secara menyebar, melainkan **sudah terpusat** di dalam file `lib/config/app_config.dart`.
- Saat ini `apiBaseUrl` di-set menggunakan logika IP Address untuk mengakomodasi pengetesan fisik/emulator (`192.168.110.221`, `10.0.2.2`, atau `127.0.0.1` port `3000`). Path backend lama menggunakan format `/api/v1`.
- HTTP Client menggunakan **Dio** dengan konfigurasi *interceptor* yang sudah mengatur injeksi token `Authorization: Bearer <token>` dan auto-refresh token (saat 401 Unauthorized) di `lib/data/network/api_client.dart`.

## 3. AUTH & STATE MANAGEMENT
- **State Management**: Project ini menggunakan **Riverpod** (`flutter_riverpod`). State diatur di dalam `lib/presentation/providers/`.
- **Penyimpanan Sesi (Session/Auth Storage)**: Token disimpan secara aman menggunakan **`flutter_secure_storage`**. Token yang disimpan meliputi `access_token`, `refresh_token`, `user_data`, dan `household_id`.

## 4. INVENTARISASI UI & FITUR YANG SUDAH ADA
Folder `presentation` sudah memuat kerangka layar (*screens*) utama, namun perlu dicek seberapa "hidup" UI ini dan apakah fetch API-nya sesuai dengan backend yang lama atau sekadar *dummy*:
- `auth`: `login_screen.dart`
- `beranda`: `beranda_screen.dart`
- `main`: `main_shell.dart` (Kemungkinan untuk Bottom Navigation Bar)
- `poin`: `poin_screen.dart`
- `profil`: `profil_screen.dart`
- `riwayat`: `riwayat_screen.dart`
- `scan`: `scan_flow_screen.dart`
- `aktivasi`: `aktivasi_bin_screen.dart`
- `reset`: `reset_bin_screen.dart`

**Kesimpulan Awal vs Cakupan Fitur Web (Warga):**
Secara struktural, semua fitur krusial yang seharusnya ada untuk role Warga (Login, Dashboard, Poin, Profil, Riwayat, Scan/Pilah) **sudah ada layarnya/file-nya**. Komponen kamera (`inline_camera_widget.dart`) dan *QR scanner* (`qr_scanner_widget.dart`) juga sudah tersedia di folder `shared/widgets`. 

**Langkah Selanjutnya**: UI perlu ditinjau (*redesign*) untuk mencocokkan *feel* dan *interactivity* dengan Web, dan semua fetch logic (repository) harus ditandai `// TODO: connect to backend` agar mudah diintegrasikan dengan backend utama di tahap sinkronisasi nanti.
