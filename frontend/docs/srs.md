# SRS — Software Requirement Specification
## pilahsampah.id | Frontend Web Dashboard
**Versi:** 1.0.0 | **Author:** Jeremy Darrell | **Tanggal:** 8 Juli 2026

---

## 1. Functional Requirements

### FR-01: Autentikasi Web

| ID | Requirement |
|----|-------------|
| FR-01.1 | Form login mengirim `POST /api/v1/auth/login` dengan `clientType: "web"` |
| FR-01.2 | Setelah login, JWT disimpan di **httpOnly Cookie** oleh server — frontend TIDAK menyimpan apapun di localStorage |
| FR-01.3 | Browser otomatis mengirim cookie di setiap request ke backend (origin sama atau `credentials: 'include'`) |
| FR-01.4 | `GET /api/v1/auth/me` dipanggil saat app pertama load untuk verifikasi sesi aktif |
| FR-01.5 | Jika `/auth/me` mengembalikan 401, redirect paksa ke halaman login |
| FR-01.6 | Tombol logout memanggil `POST /api/v1/auth/logout` lalu redirect ke `/login` |
| FR-01.7 | Form register dengan NIK 16 digit (validasi pattern: `^\d{16}$`) dan GPS geotag |
| FR-01.8 | Geotag GPS: gunakan `navigator.geolocation.getCurrentPosition()` → tampilkan lat/lng sebagai readonly chip |

### FR-02: Fetch Data & State Management

| ID | Requirement |
|----|-------------|
| FR-02.1 | Semua request API menggunakan `axios` dengan `withCredentials: true` (untuk cookie) |
| FR-02.2 | Axios instance base URL dari environment variable `VITE_API_URL` |
| FR-02.3 | Axios interceptor: jika response 401, clear local state + redirect `/login` |
| FR-02.4 | Global state dengan **Zustand** (tidak pakai Redux): `useAuthStore`, `useNotifStore`, `useHouseholdStore` |
| FR-02.5 | Server state (cache, loading, error) dengan **TanStack Query** (React Query v5) |
| FR-02.6 | Loading state: tampilkan skeleton loader (bukan spinner polos) di setiap section |
| FR-02.7 | Error state: tampilkan error card dengan tombol "Coba Lagi" + pesan error dalam Bahasa Indonesia |

### FR-03: WebSocket Real-Time

| ID | Requirement |
|----|-------------|
| FR-03.1 | Koneksi WebSocket dibuka setelah login berhasil: `ws://localhost:3000/ws?token=<jwt>` |
| FR-03.2 | Token JWT untuk WS diambil dari state auth (tidak dari cookie — karena WS tidak kirim cookie) |
| FR-03.3 | Event `bin_full_alert` → tambahkan notifikasi ke `useNotifStore` + tampilkan badge merah di bell |
| FR-03.4 | Event `capacity_update` → trigger refetch query bin/household yang relevan |
| FR-03.5 | Event `notification_new` → increment notif count |
| FR-03.6 | Jika WS disconnect, lakukan reconnect dengan exponential backoff (1s, 2s, 4s, 8s, max 30s) |
| FR-03.7 | Kirim ping setiap 30 detik untuk menjaga koneksi aktif |

### FR-04: Dashboard Halaman

| ID | Requirement |
|----|-------------|
| FR-04.1 | KPI data dari `GET /api/v1/analytics/summary` — di-cache 5 menit (TanStack Query staleTime) |
| FR-04.2 | Chart tren dari `GET /api/v1/analytics/trends?days=30` — dirender dengan **Recharts** |
| FR-04.3 | Donut chart kapasitas dengan **Recharts PieChart** |
| FR-04.4 | Panel peringatan dari `GET /api/v1/notifications?isRead=false&type=BIN_FULL` |

### FR-05: Peta Wilayah

| ID | Requirement |
|----|-------------|
| FR-05.1 | Peta dirender menggunakan **Leaflet.js + React-Leaflet** (OpenStreetMap tiles) |
| FR-05.2 | Polygon RT digambar dari koordinat GeoJSON yang didapat dari backend |
| FR-05.3 | Fill color polygon berdasarkan compliance rate: ≥70% → green, 50-69% → amber, <50% → red |
| FR-05.4 | Titik koordinat rumah tangga dirender sebagai `CircleMarker` dengan warna sesuai bin status |
| FR-05.5 | Klik polygon → navigasi ke `/map/:rtRwId` (RT Detail) dengan transition CSS |

### FR-06: Data Warga Tabel

| ID | Requirement |
|----|-------------|
| FR-06.1 | Data dari `GET /api/v1/households?page=1&limit=10` |
| FR-06.2 | Progress bar kapasitas: `(currentVolumeLiter / 25) * 100`% |
| FR-06.3 | Warna bar: <70% → green-500, 70-89% → amber-500, ≥90% → red-500 dengan CSS animation `pulse` |
| FR-06.4 | Reset Volume: tampilkan modal konfirmasi → panggil `POST /api/v1/bins/:id/empty` |
| FR-06.5 | Setelah reset berhasil, invalidate query dan refetch tabel |

---

## 2. Non-Functional Requirements

### NFR-01: HTTP Client Configuration
```typescript
// src/lib/axios.ts
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // http://localhost:3000
  withCredentials: true,   // WAJIB untuk httpOnly cookie
  headers: { 'Content-Type': 'application/json' }
});

// Interceptor: auto redirect jika 401
api.interceptors.response.use(null, (error) => {
  if (error.response?.status === 401) {
    useAuthStore.getState().clearAuth();
    window.location.href = '/login';
  }
  return Promise.reject(error);
});
```

### NFR-02: Standard Error Display
- Semua error API ditampilkan dalam Bahasa Indonesia
- Error code dari backend dipetakan ke pesan lokal (lihat `srs.md` backend Section 3.4)
- Tidak ada error teknis (stack trace) yang ditampilkan ke pengguna

### NFR-03: Environment Variables
```env
# frontend/.env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```
---

## 3. API Contract (SINKRON — identik dengan backend/docs/srs.md)

### Endpoint yang Dikonsumsi Frontend:
```
POST   /api/v1/auth/login          (withCredentials: true)
POST   /api/v1/auth/logout         (withCredentials: true)
GET    /api/v1/auth/me             (withCredentials: true)
POST   /api/v1/auth/register
GET    /api/v1/households
GET    /api/v1/households/:id
POST   /api/v1/bins/:id/empty
GET    /api/v1/notifications
PATCH  /api/v1/notifications/:id/read
PATCH  /api/v1/notifications/read-all
GET    /api/v1/leaderboard/rt
GET    /api/v1/leaderboard/households
GET    /api/v1/analytics/summary
GET    /api/v1/analytics/trends
GET    /api/v1/analytics/ai-evaluation
GET    /api/v1/waste/logs
WS     /ws?token=<token>
```

### Error Code Mapping (Bahasa Indonesia):
| Backend Error Code | Pesan Tampil ke User |
|-------------------|----------------------|
| `INVALID_CREDENTIALS` | "Email atau password yang Anda masukkan salah." |
| `UNAUTHORIZED` | "Sesi Anda telah berakhir. Silakan login kembali." |
| `FORBIDDEN` | "Anda tidak memiliki akses untuk tindakan ini." |
| `NOT_FOUND` | "Data tidak ditemukan." |
| `VALIDATION_ERROR` | "Periksa kembali isian formulir Anda." |
| `BIN_OVERFLOW` | "Tong sampah sudah penuh! Volume tidak dapat ditambah." |
