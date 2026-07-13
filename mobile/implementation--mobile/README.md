# Pilah Sampah Cerdas — Monorepo
## pilahsampah.id | Kecamatan Coblong, Kota Bandung

Platform cerdas manajemen pemilahan sampah berbasis AI untuk meningkatkan kepatuhan warga dalam memilah sampah rumah tangga secara digital.

---

## Struktur Monorepo

```
pilahsampah-id/
├── backend/          # Express.js + TypeScript + Prisma + Redis
│   └── docs/         # PRD, SRS, SDD, UI/UX Flow, Task Breakdown
├── frontend/         # React.js + Vite + Tailwind + TanStack Query
│   ├── docs/         # PRD, SRS, SDD, UI/UX Flow, Task Breakdown
│   └── src/          # Kode React (App.tsx, index.css)
├── mobile/           # Flutter + Dart
│   ├── docs/         # PRD, SRS, SDD, UI/UX Flow, Task Breakdown
│   └── lib/          # Kode Flutter (main.dart)
├── prisma/           # Schema database Prisma (PostgreSQL)
├── src/              # Backend source (Express routes, services)
├── docs/             # Dokumen tingkat proyek
├── .env              # Environment variables (jangan di-commit!)
├── .env.example      # Template environment variables
├── package.json      # Backend dependencies
├── tsconfig.json     # TypeScript config
└── start-ngrok.ps1   # Script Ngrok tunnel
```

---

## Branch Strategy

| Branch | Tujuan |
|--------|--------|
| `main` | Branch utama — hanya kode yang sudah disetujui senior |
| `dev/backend` | Jeremy — pengembangan Backend API |
| `dev/frontend` | Jeremy — pengembangan Web Dashboard |
| `dev/mobile` | Habil — pengembangan Flutter Mobile App |

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Backend | Node.js, Express.js, TypeScript, Prisma ORM |
| Database | PostgreSQL + Redis |
| Frontend | React.js, Vite, Tailwind CSS, TanStack Query, Recharts, Leaflet |
| Mobile | Flutter, Dart, Dio, flutter_secure_storage |
| Tunnel | Ngrok (localhost → HTTPS) |
| Auth | JWT (httpOnly Cookie untuk Web, Bearer Token untuk Mobile) |

---

## Cara Mulai Development

### 1. Jalankan Backend
```bash
npm install
npx prisma migrate dev --name init
npm run dev
```

### 2. Jalankan Ngrok (untuk Mobile)
```powershell
.\start-ngrok.ps1
```

### 3. Jalankan Frontend
```bash
cd frontend
npm install
npm run dev
```

### 4. Jalankan Mobile (Flutter)
```bash
cd mobile
flutter pub get
flutter run
```

---

## Environment Variables (.env)

Lihat `.env.example` untuk daftar semua variabel yang diperlukan. Salin ke `.env` dan isi nilainya.

---

## Dokumentasi Teknis

Setiap modul memiliki 5 dokumen teknis di folder `docs/`:
- `prd.md` — Product Requirement Document
- `srs.md` — Software Requirement Specification
- `sdd.md` — Software Design Document
- `ui_ux_flow.md` — UI/UX Flow & Screen Specification
- `task_breakdown.md` — Sprint Task Breakdown

---

*© 2026 Pilah Sampah Cerdas. Sampah Terdaftar, Lingkungan Tertata.*
