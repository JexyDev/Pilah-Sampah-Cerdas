# Software Design Document (SDD) — Pilah Sampah Cerdas

## 1. Arsitektur Sistem

```mermaid
graph TD
    A[Aplikasi Mobile Warga - Flutter] -->|1. Deteksi AI / Upload| B[API Gateway / Express.js]
    A -->|3. Kirim Transaksi Scan QR| B
    B -->|2. Kelola Antrian & Kuota| C[(Redis Queue & Cache)]
    B -->|4. Simpan Data & Log| D[(Database PostgreSQL)]
    E[Dashboard Web Petugas - React/Next.js] -->|5. Ambil Data Real-time| B
    F[Live Monitoring WebSocket] -->|6. Push notif tong penuh| E
```

---

## 2. Desain Database (13 Tabel Utama)
* **`roles`**: Menyimpan level hak akses (ADMIN, PETUGAS_KELURAHAN, PETUGAS_RW, PETUGAS_RT, WARGA).
* **`users`**: Kredensial akun dan profil warga/petugas.
* **`refresh_tokens`**: Token rotasi refresh session untuk keamanan login (id, user_id, token, expires_at, created_at).
* **`kelurahan`**: Data kelurahan dalam Kecamatan Coblong (Dago, Sadangserang, Sekeloa, Lebak Siliwangi, Cipaganti, Coblong).
* **`rt_rw_areas`**: Penanda area administratif pengelolaan sampah (berelasi ke `kelurahan`).
* **`households`**: Data rumah tangga warga dengan koordinat presisi DECIMAL(11,8) untuk peta GIS.
* **`bins`**: Informasi fisik tong sampah warga (kapasitas maks 25 Liter), dengan status real-time kapasitas.
* **`waste_categories`**: Kategori sampah (ORGANIC, NON_ORGANIC, B3) — Master Data.
* **`waste_logs`**: Catatan riwayat setoran volume dan berat sampah.
* **`ai_request_logs`**: Log transaksi pendeteksian AI beserta status (SUCCESS, TIMEOUT, IMAGE_UNREADABLE).
* **`point_history`**: Riwayat perolehan poin warga.
* **`notifications`**: Penyimpanan pesan notifikasi sistem.
* **`bin_reset_requests`**: Persetujuan Pengosongan Tong (id, bin_id, user_id, evidence_photo_url, status: PENDING/APPROVED/REJECTED, reviewed_by, created_at, updated_at).

---

## 3. Kontrak API (API Contract Specification)

### 3.1 AI Mock Detection
* **Endpoint:** `POST /api/v1/waste/detect-mock`
* **Request Body:**
  ```json
  {
    "userId": "user-jeremy"
  }
  ```
* **Response Success (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "detectedType": "ORGANIC",
      "volumeEstimate": 3.4,
      "isBlurry": false
    }
  }
  ```
* **Response Timeout (408 Request Timeout):**
  ```json
  {
    "error": "AI_TIMEOUT"
  }
  ```
* **Response Unreadable Image (422 Unprocessable Entity):**
  ```json
  {
    "error": "IMAGE_UNREADABLE"
  }
  ```

### 3.2 Bin QR Scan Transaction
* **Endpoint:** `POST /api/v1/bins/scan`
* **Request Body:**
  ```json
  {
    "qrCode": "QR-BIN-WARGA-ORGANIK",
    "userId": "user-jeremy",
    "detectedType": "ORGANIC",
    "estimatedVolume": 4.5,
    "householdId": "household-uuid-01"
  }
  ```
* **Response Success (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "weightKg": 1.8,
      "pointsAwarded": 180,
      "newBinVolume": 14.8
    }
  }
  ```
* **Response Overflow (400 Bad Request):**
  ```json
  {
    "error": "BIN_OVERFLOW"
  }
  ```

### 3.3 Live Monitoring
* **Endpoint:** `GET /api/v1/monitoring/live`
* **Query Params:** `kelurahan`, `rw`, `rt` (opsional)
* **Response Success (200 OK):**
  ```json
  {
    "success": true,
    "lastUpdated": "2026-07-10T11:23:00Z",
    "data": {
      "bins": [
        {
          "binId": "bin-uuid-01",
          "lat": -6.9034,
          "lng": 107.6198,
          "capacityPercent": 94,
          "status": "CRITICAL",
          "householdName": "Bp. Asep Syaepudin",
          "rt": "RT 04",
          "rw": "RW 02",
          "kelurahan": "Dago"
        }
      ],
      "summary": {
        "totalBins": 142,
        "criticalBins": 8,
        "warningBins": 23,
        "safeBins": 111
      }
    }
  }
  ```

---

## 4. Spesifikasi Keamanan & Autentikasi

### 4.1 Penyimpanan Token Login
*   **Web Dashboard (Frontend):** Token JWT disimpan di **HttpOnly Cookie** dengan flag `Secure` dan `SameSite=Strict`. Ini mencegah pencurian token melalui serangan Cross-Site Scripting (XSS).
*   **Aplikasi Mobile (Warga):** Token JWT disimpan menggunakan **Flutter Secure Storage** (Keystore untuk Android, Keychain untuk iOS).
*   **Rotasi Token (Refresh Token):** Sistem backend mengimplementasikan tabel `refresh_tokens`. Saat token akses JWT habis (misal: 15 menit), aplikasi secara otomatis meminta token baru dengan mengirimkan Refresh Token (masa aktif 7 hari) untuk menghindari logout paksa pada pengguna.

### 4.2 Verifikasi Lokasi Geofencing
*   Saat mengirim transaksi scan QR (`POST /api/v1/bins/scan`), aplikasi mengirim koordinat GPS warga (`userLat` & `userLng`).
*   Backend mengambil koordinat lokasi fisik tong dari tabel `bins` (`binLat` & `binLng`) — bukan dari `households`, karena lokasi tong fisik bisa berbeda dari lokasi rumah (tong bisa di pinggir jalan, gang, atau halaman depan).
*   Rumus **Haversine** digunakan untuk menghitung jarak: jika jarak > **10 meter**, transaksi ditolak (`400 Bad Request` dengan error `LOCATION_OUT_OF_RANGE`).

---

## 5. Sinkronisasi Skema API (Swagger & OpenAPI)

Untuk menyelaraskan struktur data tanpa menyalin manual antar-branch:
1.  **Ekspor Swagger:** Backend secara otomatis mengekspor skema dalam format JSON/YAML (`swagger.json`) ke folder `/docs/swagger.json` saat build atau commit.
2.  **TypeScript Generator:** Tim Frontend Web dan Mobile menggunakan command npm generator (`openapi-generator-cli`) di branch masing-masing untuk mengubah `swagger.json` tersebut langsung menjadi *TypeScript Types* / *Dart Models* secara otomatis.
3.  **MCP Integration:** IDE Antigravity dapat membaca file `swagger.json` tersebut langsung melalui MCP tool untuk memverifikasi keselarasan tipe data API secara instan saat penulisan kode.

---

## 6. Kontrak API Lengkap — Auth & Session

### 6.1 Login
* **Endpoint:** `POST /api/v1/auth/login`
* **Request Body:**
  ```json
  { "nik": "3273012345678901", "password": "rahasia123" }
  ```
* **Response Success (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "<jwt_string>",
      "user": { "id": "uuid", "name": "Bp. Asep", "role": "PETUGAS_RT" }
    }
  }
  ```
  *Catatan: `accessToken` dikirim via **HttpOnly Cookie** (`Set-Cookie`), bukan di body response.*
* **Response Gagal (401 Unauthorized):**
  ```json
  { "success": false, "error": "INVALID_CREDENTIALS" }
  ```
* **Rate Limiting:** Maksimum 5 percobaan gagal per IP per 15 menit. Kelebihan → `429 Too Many Requests` + header `Retry-After: 900`.

### 6.2 Refresh Token
* **Endpoint:** `POST /api/v1/auth/refresh`
* **Request:** Tidak ada body. Refresh token dibaca otomatis dari **HttpOnly Cookie** bernama `psc_refresh_token`.
* **Response Success (200 OK):**
  ```json
  { "success": true, "message": "Token refreshed" }
  ```
  *Catatan: Access token baru langsung dikirim via `Set-Cookie`.*
* **Response Gagal (401):**
  ```json
  { "success": false, "error": "REFRESH_TOKEN_EXPIRED" }
  ```

### 6.3 Logout
* **Endpoint:** `POST /api/v1/auth/logout`
* **Request:** Tidak ada body. Server menghapus `refresh_token` dari database & menghapus cookie.
* **Response (200 OK):**
  ```json
  { "success": true, "message": "Logged out successfully" }
  ```

---

## 7. Kontrak API Lengkap — Bin Reset Request

### 7.1 Ajukan Reset Tong (Warga)
* **Endpoint:** `POST /api/v1/bins/reset-request`
* **Authorization:** Role `WARGA`
* **Request Body (multipart/form-data):**
  ```
  binId: "bin-uuid-01"
  evidencePhoto: <file.jpg, maks 1MB>
  ```
* **Response Success (201 Created):**
  ```json
  {
    "success": true,
    "data": { "resetRequestId": "req-uuid-01", "status": "PENDING" }
  }
  ```
* **Response Gagal — Tong Tidak Kritis (400):**
  ```json
  { "success": false, "error": "BIN_NOT_CRITICAL" }
  ```

### 7.2 Approve Reset Tong (Petugas RT)
* **Endpoint:** `PATCH /api/v1/bins/reset-request/:id/approve`
* **Authorization:** Role `PETUGAS_RT`, `PETUGAS_RW`, `PETUGAS_KELURAHAN`, `ADMIN`
* **Response Success (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "resetRequestId": "req-uuid-01",
      "status": "APPROVED",
      "newBinVolume": 0
    }
  }
  ```

### 7.3 Reject Reset Tong (Petugas RT)
* **Endpoint:** `PATCH /api/v1/bins/reset-request/:id/reject`
* **Authorization:** Role `PETUGAS_RT`, `PETUGAS_RW`, `PETUGAS_KELURAHAN`, `ADMIN`
* **Request Body:**
  ```json
  { "rejectReason": "Foto tidak sesuai kondisi tong" }
  ```
* **Response Success (200 OK):**
  ```json
  {
    "success": true,
    "data": { "resetRequestId": "req-uuid-01", "status": "REJECTED" }
  }
  ```

---

## 8. Kontrak API Lengkap — Bulk Bin Management

### 8.1 Bulk Generate QR Bin (Pre-Registration)
* **Endpoint:** `POST /api/v1/bins/bulk-generate`
* **Authorization:** Role `ADMIN`, `PETUGAS_KELURAHAN`
* **Request Body:**
  ```json
  {
    "quantity": 100,
    "binType": "ORGANIC",
    "kelurahanId": "kel-uuid-dago",
    "prefix": "PSC-DAGO"
  }
  ```
* **Response Success (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "generated": 100,
      "downloadUrl": "/api/v1/bins/export/PSC-DAGO-20260711.xlsx"
    }
  }
  ```
  *Format file: Excel/CSV berisi kolom `bin_id`, `qr_serial`, `bin_type`, `kelurahan`.*

### 8.2 Bulk Import Bins (Link ke Master Data Warga)
* **Endpoint:** `POST /api/v1/bins/bulk-import`
* **Authorization:** Role `ADMIN`, `PETUGAS_KELURAHAN`
* **Request Body (multipart/form-data):**
  ```
  file: <bins_import.xlsx>
  ```
  *Format kolom Excel wajib: `qr_serial`, `household_nik`, `rt_rw_id`, `bin_lat`, `bin_lng`.*
* **Response Success (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "imported": 95,
      "skipped": 5,
      "errors": [
        { "row": 12, "nik": "327301XXX", "reason": "NIK_NOT_FOUND" }
      ]
    }
  }
  ```

---

## 9. Scan QR — Field Tambahan (Geofencing)

Kontrak API `POST /api/v1/bins/scan` (Seksi 3.2) diperbarui untuk menyertakan koordinat GPS warga:

* **Request Body (Updated):**
  ```json
  {
    "qrCode": "QR-BIN-WARGA-ORGANIK",
    "userId": "user-jeremy",
    "detectedType": "ORGANIC",
    "estimatedVolume": 4.5,
    "householdId": "household-uuid-01",
    "userLat": -6.9034,
    "userLng": 107.6198
  }
  ```
* **Response Gagal — Geofencing (400):**
  ```json
  { "success": false, "error": "LOCATION_OUT_OF_RANGE", "distanceMeters": 34.2 }
  ```

---

## 10. Standar Format Error Response API

Semua endpoint menggunakan format error yang seragam:

```json
{
  "success": false,
  "error": "ERROR_CODE_IN_SCREAMING_SNAKE_CASE",
  "message": "Pesan deskriptif untuk developer (opsional, hanya di dev mode)",
  "details": {}
}
```

### Daftar Kode Error Standard

| Kode Error | HTTP Status | Deskripsi |
|:---|:---:|:---|
| `INVALID_CREDENTIALS` | 401 | NIK atau password salah |
| `REFRESH_TOKEN_EXPIRED` | 401 | Refresh token habis masa aktif |
| `UNAUTHORIZED` | 403 | Role tidak memiliki akses endpoint ini |
| `RESOURCE_NOT_FOUND` | 404 | Resource (bin, user, dll) tidak ditemukan |
| `BIN_OVERFLOW` | 400 | Volume sampah melebihi kapasitas tong (25L) |
| `BIN_TYPE_MISMATCH` | 400 | Jenis sampah tidak sesuai peruntukan tong |
| `LOCATION_OUT_OF_RANGE` | 400 | GPS warga > 10m dari lokasi tong |
| `BIN_NOT_CRITICAL` | 400 | Tong belum mencapai >90% untuk bisa reset |
| `AI_TIMEOUT` | 408 | Deteksi AI melebihi 2000ms |
| `IMAGE_UNREADABLE` | 422 | Foto tidak bisa diproses AI |
| `DAILY_LIMIT_EXCEEDED` | 429 | Kuota 50 request AI/hari habis |
| `RATE_LIMIT_EXCEEDED` | 429 | Rate limit login terlampaui |
| `VALIDATION_ERROR` | 422 | Input tidak valid (field wajib kosong, format salah) |
| `NIK_NOT_FOUND` | 404 | NIK tidak terdaftar di sistem |
| `INTERNAL_SERVER_ERROR` | 500 | Kesalahan server tidak terduga |

---

## 11. Matriks RBAC — Akses Endpoint per Role

| Endpoint | ADMIN | PETUGAS_KEL | PETUGAS_RW | PETUGAS_RT | WARGA |
|:---|:---:|:---:|:---:|:---:|:---:|
| `POST /auth/login` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `POST /auth/refresh` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `POST /auth/logout` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `POST /waste/detect-mock` | ✅ | ❌ | ❌ | ❌ | ✅ |
| `POST /bins/scan` | ✅ | ❌ | ❌ | ❌ | ✅ |
| `POST /bins/reset-request` | ✅ | ❌ | ❌ | ❌ | ✅ |
| `PATCH /bins/reset-request/:id/approve` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `PATCH /bins/reset-request/:id/reject` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `POST /bins/bulk-generate` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `POST /bins/bulk-import` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `GET /monitoring/live` | ✅ | ✅ | ✅ | ✅ | ❌ |
| Master Data CRUD (semua entitas) | ✅ | ✅* | ❌ | ❌ | ❌ |
| Master Data READ ONLY | ✅ | ✅ | ✅ | ✅ | ❌ |

*`PETUGAS_KELURAHAN` hanya CRUD dalam lingkup kelurahan binaannya.

---

## 12. Spesifikasi Tech Stack & Versi (Dikunci)

### Backend (`/backend`)
| Komponen | Library/Tool | Versi Dikunci |
|:---|:---|:---|
| Runtime | Node.js | v24.18.0 (LTS) |
| Framework | Express.js | ^5.1.0 |
| ORM | Prisma | ^6.11.0 |
| Database | PostgreSQL | 16-alpine (Docker) |
| Cache/Queue | Redis | 7.4-alpine (Docker) |
| Auth | jsonwebtoken | ^9.0.2 |
| Validasi | zod | ^3.25.0 |
| Upload | multer | ^2.0.0 |
| API Docs | swagger-jsdoc + swagger-ui-express | ^6.2.8 + ^5.0.1 |
| Rate Limit | express-rate-limit | ^7.5.0 |
| Environment | dotenv | ^16.5.0 |
| TypeScript | typescript | ^5.8.0 |

### Frontend (`/frontend`)
| Komponen | Library/Tool | Versi Dikunci |
|:---|:---|:---|
| Framework | React | ^19.1.0 |
| Build Tool | Vite | ^6.3.0 |
| Language | TypeScript | ^5.8.0 |
| State Management | Zustand | ^5.0.5 |
| HTTP Client | Axios | ^1.9.0 |
| Peta | Leaflet.js | ^1.9.4 |
| Ikon | Lucide React | ^0.515.0 |
| Styling | CSS Modules + Poppins | (Google Fonts CDN) |
| API Type Generator | openapi-generator-cli | ^2.20.0 |
| CSRF Protection | (dihandle via `SameSite=Strict` pada cookie) | — |

### Mobile (`/mobile`)
| Komponen | Library/Tool | Versi Dikunci |
|:---|:---|:---|
| Framework | Flutter | 3.44.6 (stable) |
| Language | Dart | 3.12.2 |
| HTTP Client | dio | ^5.8.0 |
| QR Scanner | mobile_scanner | ^6.0.10 |
| Kamera | image_picker | ^1.1.2 |
| GPS | geolocator | ^13.0.4 |
| State Management | flutter_riverpod | ^2.6.1 |
| Auth Storage | flutter_secure_storage | ^9.2.4 |
| Push Notification | firebase_messaging | ^15.2.5 |
| Koneksi Monitor | connectivity_plus | ^6.1.4 |
| Cache Lokal | shared_preferences | ^2.5.3 |
| API Model Generator | openapi_generator_annotations | ^6.0.0 |
| Min Android SDK | API Level 24 | (Android 7.0 Nougat) |
| Min iOS Version | 13.0 | — |

---

## 13. Spesifikasi Environment Variables

### Backend `.env` (Development)
```env
# Server
NODE_ENV=development
PORT=3000
BASE_URL=http://localhost:3000

# Database
DATABASE_URL="postgresql://psc_user:psc_password@localhost:5432/psc_db?schema=public"

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_ACCESS_SECRET=your_super_secret_access_key_min_32chars
JWT_REFRESH_SECRET=your_super_secret_refresh_key_min_32chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# AI Mock Config
AI_MOCK_TIMEOUT_MS=2000
AI_DAILY_LIMIT_PER_USER=50

# Upload
MAX_UPLOAD_SIZE_MB=1
UPLOAD_PATH=./uploads

# Swagger
SWAGGER_ENABLED=true
```

### Frontend `.env` (Development)
```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
VITE_APP_NAME=Pilah Sampah Cerdas
VITE_APP_ENV=development
```

### Mobile `lib/config/env.dart` (Development)
```dart
class AppConfig {
  static const String apiBaseUrl = 'http://10.0.2.2:3000/api/v1'; // Android emulator localhost
  static const String appName = 'Pilah Sampah Cerdas';
  static const int geofenceRadiusMeters = 10;
  static const int aiTimeoutMs = 2000;
  static const int maxUploadSizeMb = 1;
}
```

### Push Notification Strategy — Firebase Cloud Messaging (FCM)
*   **Platform:** Google Firebase Cloud Messaging (FCM) — gratis hingga skala besar.
*   **Flow:**
    1.  Mobile app mendaftarkan FCM Device Token saat login ke BE.
    2.  BE menyimpan FCM token di tabel `users` (kolom `fcm_token`).
    3.  Saat kapasitas tong >90%, BE server mengirim push notification via FCM API ke device Petugas RT yang bertanggung jawab.
    4.  Saat ada pengajuan reset tong (`PENDING`), BE mengirim push notification ke Petugas RT area terkait.

