# Backend Architecture — BERSEKA API (`apps/api`)

## 1. Ikhtisar Arsitektur
Aplikasi backend `apps/api` dikembangkan menggunakan **Node.js**, **Express.js**, **TypeScript**, dan **Prisma ORM** (MySQL/PostgreSQL) dengan mengimplementasikan **Clean Architecture**.

```
apps/api/src/
├── controllers/      # Transport Layer (Express Handlers, Request Validation, HTTP Response)
├── middlewares/      # Auth JWT, Role RBAC Guard, Read-Only Guard, Upload Middleware
├── routes/           # Routing API Versioning (/api/v1/*)
├── services/         # Business Logic Layer (Use Cases, Rules Engine, Agregasi, Poin)
├── repositories/     # Data Access Layer (Prisma ORM Queries & Mutations)
├── config/           # Database, JWT, Multer, & Environment Configs
└── utils/            # Shared Helpers, Error Handling, Logger
```

---

## 2. Aturan Autentikasi & Autorisasi (RBAC)

### 2.1 Identitas Auth Universal (Phone Number +62)
- **Kredensial Utama:** SELURUH role (Warga, Mahasiswa KKN, DPL, Petugas Residu, RW, Lurah, Camat, Admin DLH, SUPER USER) menggunakan **Nomor Telepon (+62)** untuk login / penerimaan OTP WhatsApp.
- **NIM & NIP:** Digunakan sebagai data profil / metadata Mahasiswa KKN (NIM) dan DPL (NIP).
- **Penghapusan NIK:** Sesuai Aturan AGENTS.md #9, NIK **dihapus total** dari seluruh tabel database & endpoint API.

### 2.2 Middleware & Guards
1. `authMiddleware`: Verifikasi JWT Bearer Token, ekstrak `userId`, `role`, dan `scopeId`.
2. `roleMiddleware([RoleA, RoleB])`: Membatasi akses endpoint berdasarkan role user.
3. `readOnlyGuard`: Memblokir operasi mutasi (`POST`, `PUT`, `DELETE`, `PATCH`) untuk role Admin DLH, Camat, dan Lurah (mengembalikan 403 Forbidden, kecuali approval AI khusus DLH).
4. `dplScopeGuard`: Memastikan DPL hanya dapat mengakses data Mahasiswa KKN bimbingannya.

---

## 3. Ringkasan Endpoint Utama API (`/api/v1`)

### 3.1 Auth & User Management (`/auth`, `/users`)
- `POST /api/v1/auth/login-phone` — Login / Minta OTP via No HP (+62)
- `POST /api/v1/auth/verify-otp` — Verifikasi OTP & terbitkan JWT Token
- `GET /api/v1/users/me` — Profil user aktif & status role

### 3.2 Mahasiswa KKN & Bulk Management (`/kkn`, `/admin/mahasiswa`)
- `POST /api/v1/admin/mahasiswa/bulk` — Import massal akun Mahasiswa KKN & DPL
- `GET /api/v1/kkn/dashboard` — Metric dashboard KKN (Dampingan Warga, QR Assigned)
- `POST /api/v1/kkn/scan-qr` — Scan & bind QR Tempat Sampah Warga

### 3.3 DPL (Dosen Pendamping Lapangan) (`/dpl`)
- `GET /api/v1/dpl/dashboard` — Ringkasan progress Mahasiswa KKN dampingan
- `GET /api/v1/dpl/mahasiswa` — Daftar Mahasiswa KKN di bawah dampingan NIP DPL
- `GET /api/v1/dpl/logbook` — Review & monitoring logbook kegiatan mahasiswa

### 3.4 Petugas Residu (`/petugas-residu`)
- `GET /api/v1/petugas-residu/dashboard` — Metric monitoring timbulan residu & penjemputan
- `POST /api/v1/petugas-residu/timbangan` — Input manual hasil penimbangan residu
- `GET /api/v1/petugas-residu/pengaduan` — Daftar laporan penjemputan & marker merah

### 3.5 Tempat Sampah (Bin) & Gamifikasi (`/bins`, `/points`)
- `GET /api/v1/bins` — Daftar tempat sampah aktif warga
- `POST /api/v1/bins/request` — Pengajuan tempat sampah baru (Warga/KKN)
- `PUT /api/v1/bins/:id/approval` — Approval status aktivasi tempat sampah oleh RW
- `GET /api/v1/points/ledger` — Riwayat mutasi poin (Ledger terpisah)

---

## 4. Standar Error Handling & Logging
- **Success Response:** `{ "success": true, "data": { ... }, "message": "..." }`
- **Error Response:** `{ "success": false, "error": { "code": "NOT_FOUND", "message": "..." } }`
