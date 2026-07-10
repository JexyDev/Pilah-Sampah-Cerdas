# SDD — Software Design Document
## pilahsampah.id | Mobile App (Flutter)
**Versi:** 1.0.0 | **Author:** Habil | **Tanggal:** 8 Juli 2026

---

## 1. Tech Stack Mobile

| Kategori | Package | Versi | Fungsi |
|----------|---------|-------|--------|
| Framework | Flutter + Dart | 3.x / 3.4+ | UI cross-platform |
| State Management | flutter_bloc / Riverpod | 2.x | State app secara reaktif |
| HTTP Client | dio | 5.x | HTTP request + interceptor |
| Token Storage | flutter_secure_storage | 9.x | Simpan JWT di Keychain/EncryptedSharedPrefs |
| Kamera | image_picker | 1.x | Ambil foto dari kamera/galeri |
| Kompresi | flutter_image_compress | 2.x | Kompres foto < 1MB |
| QR Scanner | mobile_scanner | 5.x | Scan QR Code tong sampah |
| Navigasi | go_router | 13.x | Declarative routing + deep link |
| Font | google_fonts | 6.x | Plus Jakarta Sans |
| Icons | Material Icons (built-in) | — | Icon standar Material |
| Config/Env | flutter_dotenv | 5.x | Kelola BASE_URL per environment |

---

## 2. Struktur Folder Mobile (Feature-First Architecture)

```
mobile/
├── lib/
│   ├── main.dart                           # Entry point, DI setup, GoRouter
│   │
│   ├── core/
│   │   ├── config/
│   │   │   └── app_config.dart             # BASE_URL dari .env
│   │   ├── network/
│   │   │   ├── dio_client.dart             # Dio instance + Auth interceptor
│   │   │   └── api_response.dart           # Model: ApiResponse<T>, ApiError
│   │   ├── storage/
│   │   │   └── secure_storage.dart         # flutter_secure_storage singleton
│   │   ├── error/
│   │   │   └── failure.dart               # Custom Failure class + error mapping
│   │   └── router/
│   │       └── app_router.dart             # GoRouter semua routes
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── data/
│   │   │   │   ├── auth_remote_datasource.dart
│   │   │   │   └── auth_repository_impl.dart
│   │   │   ├── domain/
│   │   │   │   ├── auth_repository.dart    # Abstract class
│   │   │   │   └── user_model.dart
│   │   │   ├── presentation/
│   │   │   │   ├── login_screen.dart
│   │   │   │   ├── register_screen.dart
│   │   │   │   └── auth_bloc.dart         # AuthBloc / AuthNotifier
│   │   │   └── splash_screen.dart         # Auto-login check
│   │   │
│   │   ├── home/
│   │   │   ├── home_screen.dart
│   │   │   ├── widgets/
│   │   │   │   ├── compliance_widget.dart  # % kesadaran hari ini
│   │   │   │   ├── action_button_card.dart # Tombol Organik/Anorganik besar
│   │   │   │   └── recent_history_list.dart
│   │   │   └── home_bloc.dart
│   │   │
│   │   ├── waste/
│   │   │   ├── data/
│   │   │   │   └── waste_remote_datasource.dart
│   │   │   ├── domain/
│   │   │   │   └── waste_model.dart
│   │   │   ├── presentation/
│   │   │   │   ├── camera_screen.dart      # Ambil foto
│   │   │   │   ├── ai_result_screen.dart   # Tampilkan hasil AI
│   │   │   │   ├── qr_scanner_screen.dart  # Scan QR tong
│   │   │   │   ├── success_screen.dart     # Poin + centang hijau
│   │   │   │   └── waste_bloc.dart
│   │   │   └── services/
│   │   │       └── image_compress_service.dart
│   │   │
│   │   ├── history/
│   │   │   ├── history_screen.dart
│   │   │   ├── history_item_card.dart
│   │   │   └── history_bloc.dart
│   │   │
│   │   └── profile/
│   │       ├── profile_screen.dart
│   │       └── profile_bloc.dart
│   │
│   └── shared/
│       ├── widgets/
│       │   ├── primary_button.dart         # Tombol hijau/biru besar reusable
│       │   ├── loading_overlay.dart        # Full-screen loading
│       │   ├── error_dialog.dart           # Dialog error standar
│       │   ├── success_animation.dart      # AnimatedCheckmark widget
│       │   └── empty_state_widget.dart
│       └── theme/
│           └── app_theme.dart             # ThemeData + color scheme
│
├── assets/
│   ├── images/
│   │   ├── logo.png
│   │   └── empty_bin.svg
│   ├── fonts/                             # Plus Jakarta Sans (backup lokal)
│   └── .env                               # BASE_URL config
│
├── docs/                                  # ← DOKUMEN INI ADA DI SINI
│   ├── prd.md
│   ├── srs.md
│   ├── sdd.md
│   ├── ui_ux_flow.md
│   └── task_breakdown.md
│
└── pubspec.yaml
```

---

## 3. Design System

### 3.1 AppTheme
```dart
// shared/theme/app_theme.dart
class AppTheme {
  static const primaryGreen  = Color(0xFF4CAF50);
  static const darkGreen     = Color(0xFF2E7D32);
  static const lightGreen    = Color(0xFFE8F5E9);
  static const primaryBlue   = Color(0xFF0056A4);
  static const darkBlue      = Color(0xFF0D47A1);
  static const lightBlue     = Color(0xFFE3F2FD);
  static const warningAmber  = Color(0xFFF59E0B);
  static const dangerRed     = Color(0xFFEF4444);
  static const bgCanvas      = Color(0xFFF9FAFB);
  static const cardWhite     = Color(0xFFFFFFFF);
  
  static ThemeData get lightTheme => ThemeData(
    colorScheme: ColorScheme.fromSeed(seedColor: primaryGreen),
    fontFamily: 'Plus Jakarta Sans',
    useMaterial3: true,
    scaffoldBackgroundColor: bgCanvas,
    appBarTheme: const AppBarTheme(backgroundColor: cardWhite, elevation: 0),
    cardTheme: CardThemeData(
      color: cardWhite,
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: primaryGreen,
        foregroundColor: Colors.white,
        minimumSize: const Size(double.infinity, 56), // Tombol besar
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
      ),
    ),
  );
}
```

### 3.2 BLoC Pattern (State Management)
```dart
// Contoh: waste_bloc.dart
// States: WasteInitial | WasteLoading | WasteDetected | WasteError
// Events: DetectWaste(imageFile) | ConfirmDetection(requestId) | ScanQR(qrCode)

class WasteBloc extends Bloc<WasteEvent, WasteState> {
  final WasteRepository repository;
  WasteDetectedData? _pendingDetection;  // simpan hasil AI sementara
  
  // Transition: Kamera → AI → QR → Sukses
}
```

### 3.3 Authentication Flow (Mobile)
```
App Launch
  │
  ├─ Baca token dari flutter_secure_storage
  │
  ├─ Ada token? ──→ GET /api/v1/auth/me
  │               ├─ 200 OK → Navigate ke HomeScreen
  │               └─ 401    → Hapus token → Navigate ke LoginScreen
  │
  └─ Tidak ada token → Navigate ke LoginScreen
```

### 3.4 Waste Submission State Machine
```
[HomeScreen]
    │ Klik "Foto Sampah Organik"
    ▼
[CameraScreen] — Ambil foto → kompresi → preview
    │ Klik "Gunakan Foto Ini"
    ▼
[Loading Overlay] — POST /api/v1/waste/detect-mock
    │
    ├─ SUCCESS → [AiResultScreen]: jenis + volume + confidence
    │                │ Klik "Konfirmasi & Scan QR"
    │                ▼
    │           [QrScannerScreen] — mobile_scanner buka kamera QR
    │                │ QR terbaca
    │                ▼
    │           [Loading Overlay] — POST /api/v1/bins/scan
    │                │
    │                ├─ 201 → [SuccessScreen]: animasi centang + poin
    │                └─ Error → [ErrorDialog]: pesan sesuai error code
    │
    ├─ AI_TIMEOUT → [ErrorDialog]: "Koneksi lambat. Estimasi default digunakan."
    ├─ IMAGE_UNREADABLE → [ErrorDialog]: "Foto buram. Ambil ulang." → kembali ke CameraScreen
    ├─ QUOTA_EXCEEDED → [ErrorDialog]: "Kuota habis. Coba besok."
    └─ Network Error → SnackBar: "Tidak ada koneksi internet."
```

### 3.5 Bottom Navigation
```dart
// Navigasi 3 tab (Bottom Navigation Bar)
0 → HomeScreen
1 → HistoryScreen
2 → ProfileScreen
```

---

## 4. Environment Configuration

```dart
// assets/.env
API_BASE_URL=https://<ngrok-id>.ngrok-free.app
# Development local (jika test di emulator Android dengan backend di PC yang sama):
# API_BASE_URL=http://10.0.2.2:3000   (10.0.2.2 = localhost dari emulator Android)
```

```dart
// core/config/app_config.dart
class AppConfig {
  static String get apiBaseUrl => dotenv.env['API_BASE_URL'] ?? '';
}
```

---

## 5. Keamanan & Catatan Penting

| Aspek | Implementasi |
|-------|--------------|
| Token storage | flutter_secure_storage WAJIB, bukan SharedPreferences |
| HTTPS | Wajib untuk upload foto — Ngrok sudah HTTPS secara default |
| Token expired | Interceptor Dio menangkap 401 → clear token → ke login |
| Foto | Tidak disimpan permanen di device — hanya temporary file saat upload |
| NIK | Ditampilkan di Profil dengan masking: "32XXXXXXXXXX1234" |
