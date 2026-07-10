# Task Breakdown
## pilahsampah.id | Backend API Service
**Versi:** 1.0.0 | **Assignee:** Jeremy Darrell (Fullstack) | **Sprint:** 1

---

## Aturan Umum
- Setiap task wajib buat branch: `feature/be-<nama-task>` dari `main`
- Setelah selesai, buat PR dan self-review sebelum merge
- Tandai task di Trello: **Doing → Done** saat selesai
- File `.env` tidak pernah di-commit ke repository

---

## FASE 0: Project Setup (Estimasi: 2 jam)

### Task BE-00: Inisialisasi Project
- [ ] `npm init -y` + `npm install typescript ts-node @types/node`
- [ ] Konfigurasi `tsconfig.json` (strict mode: true, target: ES2022)
- [ ] Install dependensi utama:
  ```
  express cors cookie-parser bcryptjs jsonwebtoken
  zod prisma @prisma/client ws redis express-rate-limit
  ```
- [ ] Install dev dependensi: `@types/express @types/bcryptjs @types/jsonwebtoken @types/ws nodemon`
- [ ] Buat struktur folder sesuai `sdd.md` Section 2
- [ ] Buat file `src/utils/ApiError.ts` dan `src/utils/ApiResponse.ts`
- [ ] Buat file `src/utils/asyncHandler.ts`

### Task BE-01: Environment & Config
- [ ] Buat `.env` dengan semua variabel sesuai `sdd.md` Section 5
- [ ] Buat `.env.example` (tanpa nilai sensitif) untuk di-commit
- [ ] Buat `src/config/env.ts` dengan validasi zod:
  ```typescript
  const envSchema = z.object({
    DATABASE_URL: z.string().url(),
    JWT_SECRET: z.string().min(32),
    PORT: z.coerce.number().default(3000),
    // ... semua env var
  });
  ```
- [ ] Buat `src/config/database.ts` (Prisma singleton)
- [ ] Buat `src/config/redis.ts` (Redis client + fallback in-memory)

**Verifikasi:** `ts-node src/index.ts` berjalan tanpa error

---

## FASE 1: Database & Prisma (Estimasi: 3 jam)

### Task BE-02: Schema Prisma
- [ ] Buat `prisma/schema.prisma` dengan 9 model sesuai `sdd.md` Section 4
- [ ] Jalankan: `npx prisma migrate dev --name init`
- [ ] Buat `prisma/seed.ts`:
  - Seed 3 role (ADMIN, RT_RW, CITIZEN)
  - Seed 6 kelurahan (Dago, Sadangserang, Sekeloa, Lebak Siliwangi, Cipaganti, Coblong)
  - Seed 10 RT/RW area
  - Seed 1 admin user: `admin@coblong.go.id` / `admin123`
  - Seed 10 household dengan koordinat GPS Coblong Bandung
  - Seed tong sampah untuk tiap household
  - Seed 50 waste log random (30 hari terakhir) untuk data chart
- [ ] Jalankan: `npx prisma db seed`

**Verifikasi:** Buka Prisma Studio (`npx prisma studio`) → semua tabel terisi data seed

---

## FASE 2: Middleware & Auth (Estimasi: 3 jam)

### Task BE-03: Auth Middleware
- [ ] Buat `src/middleware/authenticate.ts`:
  - Cek `req.cookies.jwt` (web) ATAU `req.headers.authorization` (mobile)
  - Verify JWT dengan `JWT_SECRET`
  - Set `req.user` = JWT payload
- [ ] Buat `src/middleware/authorize.ts`:
  - Terima array role yang diizinkan: `authorize(['ADMIN', 'RT_RW'])`
  - Bandingkan dengan `req.user.role`
- [ ] Buat `src/middleware/validate.ts`:
  - Generic middleware: `validate(schema: ZodSchema)`
  - Gunakan di semua route POST/PUT
- [ ] Buat `src/middleware/rateLimiter.ts`:
  - Max 100 request / 15 menit per IP
- [ ] Buat `src/middleware/errorHandler.ts`:
  - Catch `ApiError` → return standard error format
  - Catch `ZodError` → return 422 VALIDATION_ERROR
  - Catch `PrismaClientKnownRequestError` → handle P2025 (not found)

### Task BE-04: Auth Endpoints
- [ ] `POST /api/v1/auth/register` + zod schema
- [ ] `POST /api/v1/auth/login` (web: set cookie, mobile: return token)
- [ ] `POST /api/v1/auth/logout` (clear cookie)
- [ ] `GET /api/v1/auth/me` (requires authenticate)

**Verifikasi:** Test dengan Postman — login web (cek Set-Cookie header) dan login mobile (cek response body token)

---

## FASE 3: Core Endpoints (Estimasi: 6 jam)

### Task BE-05: Household Endpoints
- [ ] `GET /api/v1/households` dengan pagination + filter (rtRwId, kelurahan)
- [ ] `POST /api/v1/households` (ADMIN only)
- [ ] `GET /api/v1/households/:id` (include bin status)
- [ ] `PUT /api/v1/households/:id` (ADMIN only)

### Task BE-06: Bin Endpoints
- [ ] `GET /api/v1/bins` dengan filter rtRwId
- [ ] `GET /api/v1/bins/:id/status`
- [ ] `POST /api/v1/bins/:id/empty` (ADMIN / RT_RW) + WS broadcast
- [ ] `POST /api/v1/bins/scan` (CITIZEN) — full transaksi flow dengan DB transaction

**Verifikasi transaksi:** Jalankan 2 request `/bins/scan` secara bersamaan → hanya 1 yang sukses jika hampir overflow

### Task BE-07: Notification Endpoints
- [ ] `GET /api/v1/notifications` (filter isRead, type)
- [ ] `PATCH /api/v1/notifications/:id/read`
- [ ] `PATCH /api/v1/notifications/read-all`

---

## FASE 4: AI & Analytics (Estimasi: 4 jam)

### Task BE-08: AI Mock Service
- [ ] `src/services/waste.service.ts`:
  - SHA-256 hash imageBase64
  - Cek Redis quota dan hash duplikasi
  - Queue management (max 100 concurrent)
  - Simulasi delay 800-1800ms + timeout 2000ms
  - 20% kemungkinan IMAGE_UNREADABLE
- [ ] `POST /api/v1/waste/detect-mock`
- [ ] `GET /api/v1/waste/logs` (paginasi, filter status)

### Task BE-09: Analytics & Leaderboard
- [ ] `GET /api/v1/analytics/summary` (KPI utama, di-cache Redis 5 menit)
- [ ] `GET /api/v1/analytics/trends?days=30` (data chart per hari)
- [ ] `GET /api/v1/analytics/ai-evaluation` (akurasi, request count, avg response time)
- [ ] `GET /api/v1/leaderboard/rt` (ranking RT by total poin bulan ini)
- [ ] `GET /api/v1/leaderboard/households` (Top 10 KK bulan ini)

---

## FASE 5: WebSocket (Estimasi: 2 jam)

### Task BE-10: WebSocket Server
- [ ] Buat `src/websocket.ts` sesuai desain di `sdd.md` Section 3.3
- [ ] Integrasikan ke `src/index.ts` (shared HTTP server)
- [ ] Test event `bin_full_alert` → dipicu setelah `/bins/scan` sukses dengan volume ≥ 22.5L
- [ ] Test event `capacity_update` → dipicu setelah setiap `/bins/scan` sukses
- [ ] Test event `notification_new` → dipicu setelah notification dibuat

---

## FASE 6: Testing & Ngrok (Estimasi: 2 jam)

### Task BE-11: Postman Collection
- [ ] Buat Postman Collection `pilahsampah-backend.postman_collection.json`
- [ ] Tambah semua 20+ endpoint dengan request body contoh
- [ ] Tambah environment variable di Postman: `BASE_URL`, `TOKEN`
- [ ] Test semua happy path + error case utama

### Task BE-12: Ngrok Setup
- [ ] Install Ngrok
- [ ] Buat script `start-dev.sh`:
  ```bash
  ngrok http 3000 &
  npm run dev
  ```
- [ ] Update `.env` dengan CORS_ORIGIN_NGROK setelah Ngrok URL diketahui
- [ ] Test Flutter mobile connect via Ngrok URL → semua endpoint berjalan

---

## Urutan Eksekusi (Sequential Must-Follow)

```
BE-00 → BE-01 → BE-02 → BE-03 → BE-04 → BE-05 → BE-06 → BE-07 → BE-08 → BE-09 → BE-10 → BE-11 → BE-12
```

**Estimasi total:** ±22 jam kerja (±4-5 hari kerja efektif sprint 1)

---

## Link Trello Terkait
- `[BE] Setup Proyek Backend Node.js Express`
- `[BE] Implementasi Auth JWT (Cookie Web + Flutter Secure Storage Mobile)`
- `[BE] Endpoint Manajemen Tong Sampah & Validasi Transaksi`
- `[BE] Service Antrean Deteksi AI Mock + Redis Quota`
- `[BE] Konfigurasi Ngrok & Script Port Forwarding`
