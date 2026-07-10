# SRS — Software Requirement Specification
## pilahsampah.id | Mobile App (Flutter)
**Versi:** 1.0.0 | **Author:** Habil | **Tanggal:** 8 Juli 2026

---

## 1. Functional Requirements

### FR-01: Autentikasi Mobile

| ID | Requirement |
|----|-------------|
| FR-01.1 | Login mengirim `POST /api/v1/auth/login` dengan body `{ email, password, clientType: "mobile" }` |
| FR-01.2 | Response JSON berisi `accessToken` → wajib disimpan di **`flutter_secure_storage`** dengan key `"access_token"` |
| FR-01.3 | Setiap HTTP request menggunakan header: `Authorization: Bearer <token>` |
| FR-01.4 | Saat app dibuka (`main.dart`), cek token di storage → panggil `GET /api/v1/auth/me` |
| FR-01.5 | Jika `/auth/me` response 401 → hapus token dari storage → tampilkan halaman login |
| FR-01.6 | Logout: hapus token dari storage → navigate ke login screen |
| FR-01.7 | Token TIDAK boleh disimpan di `SharedPreferences` (tidak aman, tidak terenkripsi) |

### FR-02: Kompresi & Upload Foto

| ID | Requirement |
|----|-------------|
| FR-02.1 | Setelah foto diambil dari kamera, wajib dilakukan kompresi menggunakan package `flutter_image_compress` |
| FR-02.2 | Target output: resolusi max 1280×960px, kualitas JPEG 75%, ukuran file < 1MB |
| FR-02.3 | Gambar dikirim sebagai `multipart/form-data` ke `POST /api/v1/waste/detect-mock` |
| FR-02.4 | Tampilkan pratinjau gambar terkompresi sebelum konfirmasi pengiriman |
| FR-02.5 | Selama upload berlangsung, tampilkan `CircularProgressIndicator` dengan pesan "Mendeteksi jenis sampah..." |

### FR-03: AI Detection Response Handling

| ID | Requirement |
|----|-------------|
| FR-03.1 | Response 200 `SUCCESS`: tampilkan jenis sampah terdeteksi + estimasi volume + confidence score |
| FR-03.2 | Response 408 `AI_TIMEOUT` (>2000ms): tampilkan dialog merah "Koneksi lambat. Menggunakan estimasi default." — kuota TIDAK dikurangi |
| FR-03.3 | Response 422 `IMAGE_UNREADABLE`: tampilkan dialog "Foto kurang jelas. Silakan ambil foto ulang." — kembali ke kamera |
| FR-03.4 | Response 429 `QUOTA_EXCEEDED`: tampilkan dialog "Kuota harian AI Anda sudah habis (50/hari). Coba lagi besok." |
| FR-03.5 | Response 409 `DUPLICATE_IMAGE`: tampilkan dialog "Foto ini sudah pernah dikirimkan hari ini." |
| FR-03.6 | Network error (no internet): tampilkan Snackbar "Tidak ada koneksi internet. Coba lagi." |

### FR-04: Scan QR Code & Validasi Transaksi

| ID | Requirement |
|----|-------------|
| FR-04.1 | Setelah AI detection berhasil dikonfirmasi warga, buka scanner kamera QR menggunakan `mobile_scanner` |
| FR-04.2 | Kirim `POST /api/v1/bins/scan` dengan: `{ qrCode, wasteType, aiRequestId, estimatedVolumeLiter }` |
| FR-04.3 | Response 400 `INVALID_BIN_TYPE`: dialog merah "Jenis tong tidak sesuai! Anda memilih sampah [Organik] tetapi memindai tong [Anorganik]." |
| FR-04.4 | Response 400 `BIN_OVERFLOW`: dialog merah "Tong sampah ini sudah penuh! Gunakan tong lain atau hubungi petugas RT." |
| FR-04.5 | Response 404 `NOT_FOUND`: dialog "QR Code tidak dikenali. Pastikan memindai tong sampah yang terdaftar." |
| FR-04.6 | Response 201 `SUCCESS`: navigate ke `SuccessScreen` dengan data `{ pointsEarned, totalPoints, newVolumeLiter }` |

### FR-05: Riwayat Setoran

| ID | Requirement |
|----|-------------|
| FR-05.1 | Data dari `GET /api/v1/waste/logs?userId=<id>&page=1&limit=20` |
| FR-05.2 | Infinite scroll: saat user scroll ke bawah, fetch halaman berikutnya |
| FR-05.3 | Filter by wasteType: Semua / Organik / Anorganik |
| FR-05.4 | Empty state jika belum ada riwayat: ilustrasi tong kosong + teks panduan |

### FR-06: Profil Warga

| ID | Requirement |
|----|-------------|
| FR-06.1 | Data dari `GET /api/v1/auth/me` (include totalPoints, rank) |
| FR-06.2 | Tampilkan: nama, NIK (masking 4 digit terakhir), alamat, kelurahan, RT/RW |
| FR-06.3 | Total poin dengan format ribuan titik (contoh: "2.840 Poin") |
| FR-06.4 | Peringkat di RT: "Peringkat #3 di RT 04 bulan ini" |
| FR-06.5 | Tombol logout → konfirmasi dialog → hapus token → navigate ke login |

---

## 2. Non-Functional Requirements

### NFR-01: Keamanan Token
```
flutter_secure_storage:
  - Android: menggunakan EncryptedSharedPreferences (AES-256)
  - iOS: menggunakan iOS Keychain
  - KEY: "access_token"
  - TIDAK ada fallback ke SharedPreferences
```

### NFR-02: HTTP Client Configuration (Dio)
```dart
// lib/core/network/dio_client.dart
final dio = Dio(BaseOptions(
  baseUrl: AppConfig.apiBaseUrl,    // dari env: Ngrok URL
  connectTimeout: const Duration(seconds: 10),
  receiveTimeout: const Duration(seconds: 15),
  headers: {'Content-Type': 'application/json'},
));

// Interceptor: tambah Authorization header otomatis
dio.interceptors.add(InterceptorsWrapper(
  onRequest: (options, handler) async {
    final token = await secureStorage.read(key: 'access_token');
    if (token != null) options.headers['Authorization'] = 'Bearer $token';
    return handler.next(options);
  },
  onError: (error, handler) async {
    if (error.response?.statusCode == 401) {
      await secureStorage.delete(key: 'access_token');
      // Navigate ke login
    }
    return handler.next(error);
  },
));
```

### NFR-03: Kompresi Gambar
```dart
// lib/features/waste/services/image_compress_service.dart
final compressed = await FlutterImageCompress.compressAndGetFile(
  file.absolute.path,
  targetPath,
  quality: 75,
  minWidth: 1280,
  minHeight: 960,
);
// Validasi: if (compressed.lengthSync() > 1048576) → compress ulang dengan quality: 50
```

---

## 3. API Contract (SINKRON — identik dengan backend/docs/srs.md)

### Endpoint yang Dikonsumsi Mobile:
```
POST  /api/v1/auth/login          (clientType: "mobile")
POST  /api/v1/auth/register
GET   /api/v1/auth/me
POST  /api/v1/waste/detect-mock   (multipart/form-data)
POST  /api/v1/bins/scan
GET   /api/v1/waste/logs
GET   /api/v1/leaderboard/rt
GET   /api/v1/leaderboard/households
```

### Error Code Mapping (Bahasa Indonesia — tampil ke warga):
| Backend Error Code | Pesan Dialog ke Warga |
|-------------------|-----------------------|
| `INVALID_CREDENTIALS` | "Email atau kata sandi salah." |
| `AI_TIMEOUT` | "Koneksi lambat. Menggunakan estimasi default." |
| `IMAGE_UNREADABLE` | "Foto kurang jelas/buram. Silakan ambil foto ulang." |
| `QUOTA_EXCEEDED` | "Kuota harian Anda sudah habis (50x). Coba lagi besok." |
| `DUPLICATE_IMAGE` | "Foto ini sudah pernah dikirimkan hari ini." |
| `INVALID_BIN_TYPE` | "Jenis tong tidak sesuai dengan jenis sampah!" |
| `BIN_OVERFLOW` | "Tong sampah penuh! Gunakan tong lain atau lapor ke petugas RT." |
| `QUEUE_FULL` | "Server sedang sibuk. Coba beberapa saat lagi." |
