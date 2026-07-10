# SRS — Software Requirement Specification
## pilahsampah.id | Backend API Service
**Versi:** 1.0.0 | **Author:** Jeremy Darrell | **Tanggal:** 8 Juli 2026

---

## 1. Functional Requirements

### FR-01: Autentikasi & Sesi

| ID | Requirement |
|----|-------------|
| FR-01.1 | Sistem harus menerima login via `POST /api/v1/auth/login` dengan body `{ email, password, clientType }` |
| FR-01.2 | Jika `clientType = "web"`, server merespons dengan `Set-Cookie: jwt=...; HttpOnly; SameSite=Strict; Path=/` |
| FR-01.3 | Jika `clientType = "mobile"`, server merespons dengan JSON body `{ "data": { "accessToken": "..." } }` |
| FR-01.4 | Middleware `authenticate` harus memverifikasi JWT dari cookie (web) atau header `Authorization: Bearer <token>` (mobile) |
| FR-01.5 | Middleware `authorize(roles[])` harus menolak akses dengan HTTP 403 jika role tidak sesuai |
| FR-01.6 | `POST /api/v1/auth/logout` harus menghapus cookie JWT (set expired) untuk web client |
| FR-01.7 | `GET /api/v1/auth/me` mengembalikan data user yang sedang login |
| FR-01.8 | Password di database harus di-hash menggunakan bcrypt (salt rounds: 12) |

### FR-02: Manajemen Rumah Tangga

| ID | Requirement |
|----|-------------|
| FR-02.1 | `GET /api/v1/households` mengembalikan list rumah tangga dengan pagination (`?page=1&limit=10`) |
| FR-02.2 | `POST /api/v1/households` membuat rumah tangga baru; wajib ada `latitude`, `longitude`, `rtRwId`, `userId` |
| FR-02.3 | Koordinat `latitude` dan `longitude` harus disimpan dengan tipe `DECIMAL(11,8)` |
| FR-02.4 | `GET /api/v1/households/:id` mengembalikan detail 1 rumah tangga beserta status tong dan log terakhir |
| FR-02.5 | Filter query: `?rtRwId=`, `?status=ACTIVE`, `?kelurahan=` |

### FR-03: Manajemen Tong Sampah (Bins)

| ID | Requirement |
|----|-------------|
| FR-03.1 | `GET /api/v1/bins/:id/status` mengembalikan `{ id, qrCode, type, maxCapacityLiter: 25.0, currentVolumeLiter, rtRw }` |
| FR-03.2 | `POST /api/v1/bins/:id/empty` mereset `currentVolumeLiter` ke `0.0` |
| FR-03.3 | `POST /api/v1/bins/scan` memproses transaksi pemilahan lengkap (validasi tipe, kapasitas, kalkulasi poin) |
| FR-03.4 | Kapasitas maksimal tong adalah **25.0 Liter** — nilai ini konstanta tidak boleh diubah |
| FR-03.5 | Jika `currentVolumeLiter + estimatedVolume > 25.0`, kembalikan HTTP 400 `BIN_OVERFLOW` |
| FR-03.6 | Proses update volume WAJIB menggunakan database transaction untuk mencegah race condition |

### FR-04: AI Detection Service

| ID | Requirement |
|----|-------------|
| FR-04.1 | `POST /api/v1/waste/detect-mock` menerima `{ userId, imageBase64? }` |
| FR-04.2 | Request dimasukkan ke Redis FIFO queue sebelum diproses |
| FR-04.3 | Jika `userId` tidak terautentikasi via JWT, kembalikan HTTP 401 |
| FR-04.4 | Quota diambil dari JWT payload userId (BUKAN dari request body) untuk keamanan |
| FR-04.5 | Jika quota harian user habis (≥ 50), kembalikan HTTP 429 `QUOTA_EXCEEDED` |
| FR-04.6 | Hitung SHA-256 dari `imageBase64` untuk mendeteksi duplikasi; jika hash sama hari ini, kembalikan `DUPLICATE_IMAGE` |
| FR-04.7 | Jika proses melebihi 2000ms, kembalikan HTTP 408 `AI_TIMEOUT`; quota TIDAK dikurangi |
| FR-04.8 | 20% kemungkinan `IMAGE_UNREADABLE`; quota dikembalikan jika terjadi |

### FR-05: WebSocket

| ID | Requirement |
|----|-------------|
| FR-05.1 | Server WebSocket berjalan di path `/ws` |
| FR-05.2 | Client harus mengirim token saat koneksi: `ws://host/ws?token=<jwt>` |
| FR-05.3 | Event `bin_full_alert`: dikirim ke semua client dengan role PETUGAS_RT / PETUGAS_RW / PETUGAS_KELURAHAN di wilayah yang bersangkutan |
| FR-05.4 | Event `capacity_update`: dikirim setelah setiap transaksi scan berhasil |
| FR-05.5 | Event `notification_new`: dikirim saat notifikasi baru dibuat di database |

### FR-06: Analytics & Leaderboard

| ID | Requirement |
|----|-------------|
| FR-06.1 | `GET /api/v1/analytics/summary` mengembalikan KPI: `activeHouseholds`, `avgCompliance`, `totalWeightKg`, `interventionCount` |
| FR-06.2 | `GET /api/v1/analytics/trends?days=30` mengembalikan array data volume harian 30 hari terakhir |
| FR-06.3 | `GET /api/v1/leaderboard/rt` mengembalikan RT diurutkan berdasarkan total poin warga bulan ini |
| FR-06.4 | `GET /api/v1/leaderboard/households` mengembalikan Top 10 KK berdasarkan total poin bulan ini |

---

## 2. Non-Functional Requirements

### NFR-01: Keamanan
- JWT secret disimpan di environment variable `JWT_SECRET` (min. 256-bit random string)
- httpOnly Cookie untuk web: tidak dapat diakses JavaScript
- Rate limiting: max 100 request/15 menit per IP (menggunakan `express-rate-limit`)
- Input validation menggunakan `zod` di semua endpoint POST/PUT
- CORS: whitelist hanya origin frontend yang diketahui

### NFR-02: Performa
- Semua query database harus menggunakan index yang tepat
- Redis caching untuk data yang jarang berubah (leaderboard, analytics summary)
- Redis TTL untuk analytics cache: 5 menit

### NFR-03: Keandalan
- Graceful shutdown: server menutup koneksi aktif dengan benar saat restart
- Database connection pool: min 2, max 10 koneksi
- Redis fallback ke in-memory jika Redis server offline

### NFR-04: Logging
- Request logging: method, path, status code, response time (ms)
- Error logging: stack trace, user ID, timestamp
- Format: JSON structured logging (siap untuk future log aggregation)

---

## 3. Standard API Contract (SINKRON: identik di semua docs)

### 3.1 Request Headers Wajib
```
Content-Type: application/json
Authorization: Bearer <token>   (hanya untuk mobile client)
// Cookie JWT otomatis dikirim browser (untuk web client)
```

### 3.2 Standard Success Response
```json
{
  "success": true,
  "message": "Operasi berhasil",
  "data": { ... }
}
```

### 3.3 Standard Error Response
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Deskripsi error dalam Bahasa Indonesia"
}
```

### 3.4 Daftar Error Code (SINKRON — identik di frontend & mobile)
| Error Code | HTTP Status | Keterangan |
|------------|-------------|------------|
| `INVALID_CREDENTIALS` | 401 | Email/password salah |
| `UNAUTHORIZED` | 401 | Token tidak ada atau expired |
| `FORBIDDEN` | 403 | Role tidak punya akses |
| `NOT_FOUND` | 404 | Data tidak ditemukan |
| `VALIDATION_ERROR` | 422 | Input tidak valid |
| `BIN_OVERFLOW` | 400 | Kapasitas tong terlampaui (>25L) |
| `INVALID_BIN_TYPE` | 400 | Jenis sampah tidak sesuai tong |
| `AI_TIMEOUT` | 408 | Deteksi AI melebihi 2000ms |
| `IMAGE_UNREADABLE` | 422 | Gambar buram/tidak terbaca |
| `QUOTA_EXCEEDED` | 429 | Kuota AI harian habis (50/hari) |
| `DUPLICATE_IMAGE` | 409 | Foto yang sama sudah diupload hari ini |
| `QUEUE_FULL` | 503 | Antrian request AI penuh (>100) |

---

## 4. Daftar Endpoint Lengkap (SINKRON — identik di frontend & mobile)

```
[AUTH]
POST   /api/v1/auth/login
POST   /api/v1/auth/register
POST   /api/v1/auth/logout
GET    /api/v1/auth/me

[HOUSEHOLDS]
GET    /api/v1/households
POST   /api/v1/households
GET    /api/v1/households/:id
PUT    /api/v1/households/:id
DELETE /api/v1/households/:id

[BINS]
GET    /api/v1/bins
POST   /api/v1/bins
GET    /api/v1/bins/:id/status
POST   /api/v1/bins/:id/empty
POST   /api/v1/bins/scan

[WASTE / AI]
POST   /api/v1/waste/detect-mock
GET    /api/v1/waste/logs

[NOTIFICATIONS]
GET    /api/v1/notifications
PATCH  /api/v1/notifications/:id/read
PATCH  /api/v1/notifications/read-all

[LEADERBOARD]
GET    /api/v1/leaderboard/rt
GET    /api/v1/leaderboard/households

[ANALYTICS]
GET    /api/v1/analytics/summary
GET    /api/v1/analytics/trends
GET    /api/v1/analytics/ai-evaluation

[SYSTEM]
GET    /health
WS     /ws
```
