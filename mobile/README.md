# mobile_app_sampah — Pilah Sampah Cerdas

Aplikasi mobile warga berbasis Flutter untuk penyetoran sampah terpilah, scan QR tong, poin reward, dan pengajuan pengosongan tong.

## Status: MOCK MODE

Semua data bersifat lokal (tidak ada koneksi ke backend/API). Siap diintegrasikan saat backend tersedia cukup dengan mengganti implementasi di `lib/data/repositories/`.

---

## Arsitektur: Clean Architecture + Riverpod

```
lib/
├── config/                   # AppConfig — env constants
├── core/
│   ├── constants/            # Colors, TextStyles, Strings, Dimensions
│   ├── theme/                # AppTheme (Light Mode Only)
│   └── router/               # AppRouter + AppRoutes
├── domain/
│   ├── entities/             # UserEntity, BinEntity, WasteLogEntity, dll
│   └── repositories/         # Abstract interfaces (AuthRepo, BinRepo, WasteLogRepo)
├── data/
│   ├── mock/                 # MockData — semua dummy data terpusat
│   └── repositories/         # MockAuthRepository, MockBinRepository, MockWasteLogRepository
└── presentation/
    ├── providers/            # Riverpod providers & StateNotifiers
    ├── shared/widgets/       # OfflineBanner, AppLoading, AppError, BinStatusBadge
    ├── splash/               # SplashScreen
    ├── auth/                 # LoginScreen
    ├── main/                 # MainShell (BottomNav)
    ├── beranda/              # BerandaScreen
    ├── scan/                 # ScanFlowScreen (4-step)
    ├── riwayat/              # RiwayatScreen
    ├── poin/                 # PoinScreen
    ├── profil/               # ProfilScreen
    ├── aktivasi/             # AktivasiBinScreen
    └── reset/                # ResetBinScreen
```

---

## Cara Menjalankan

```bash
cd mobile_app_sampah
flutter pub get
flutter run
```

## Mock Credentials (Login)
- **NIK:** `3273012345678901`
- **Password:** `password123`

---

## Tech Stack (sesuai sdd.md §12)

| Package | Versi | Kegunaan |
|---|---|---|
| flutter_riverpod | ^2.6.1 | State management |
| dio | ^5.8.0 | HTTP client (disiapkan, belum aktif) |
| mobile_scanner | ^6.0.10 | QR Scanner |
| image_picker | ^1.1.2 | Kamera |
| geolocator | ^13.0.4 | GPS |
| flutter_secure_storage | ^9.2.4 | Token storage |
| firebase_messaging | ^15.2.5 | Push notification |
| connectivity_plus | ^6.1.4 | Monitor koneksi |
| shared_preferences | ^2.5.3 | Cache lokal |
| google_fonts | ^6.2.1 | Poppins font |

## Fitur Sprint 1 M3 yang Sudah Diimplementasi

- [x] Struktur project Clean Architecture
- [x] Design system (Light Mode, Poppins, palet warna sesuai ui_ux_flow.md)
- [x] Login dengan validasi NIK 16 digit
- [x] Bottom Navigation 5 tab + FAB Setor
- [x] Online-Only enforcement dengan `connectivity_plus` + banner offline merah
- [x] Beranda: greeting, total poin, tombol setor organik/anorganik, status tong
- [x] Scan Flow 4-step: Foto → AI Detect → Scan QR → Sukses (dengan mock Haversine + validasi bisnis)
- [x] Riwayat pemilahan (grouped by date)
- [x] Halaman Poin (total + riwayat)
- [x] Profil Rumah Tangga
- [x] Aktivasi Tong Baru
- [x] Pengajuan Reset/Pengosongan Tong (hanya untuk tong kritis >90%)
- [x] Error handling sesuai error codes sdd.md §10
- [x] RBAC-aware (hanya role WARGA yang bisa akses fitur setor/scan)
