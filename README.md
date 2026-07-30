<<<<<<< HEAD
# 🗑️ Pilah Sampah Cerdas (Trashcare)

> **Sistem Pengelolaan Sampah Terintegrasi Berbasis AI** — Kecamatan Coblong, Bandung

Aplikasi yang membantu warga memilah sampah dengan benar, memantau kepatuhan, dan memberikan insentif melalui gamifikasi. Dibangun sebagai monorepo dengan Backend API, Frontend Web, dan Mobile App dalam satu repositori.

---

## 📁 Struktur Monorepo
=======
﻿# Backend Service — Pilah Sampah Cerdas

Layanan backend berbasis **Express.js (TypeScript)** untuk mengelola database PostgreSQL, antrian deteksi AI di Redis, dan sistem notifikasi/poin.

## 🛠️ Persyaratan Sistem (Prerequisites)
Sebelum menjalankan, pastikan Anda telah memasang:
*   [Node.js (v18 atau lebih baru)](https://nodejs.org/)
*   [Docker Desktop](https://www.docker.com/)

---

## 🚀 Panduan Memulai Cepat (Local Development)
>>>>>>> origin/mobile

### 1. Jalankan Database & Cache (Docker)
Buka terminal di folder `/backend` lalu jalankan perintah berikut untuk menyalakan PostgreSQL dan Redis secara otomatis di background:
```bash
docker-compose up -d
```
<<<<<<< HEAD
pilahsampah-id/
├── apps/
│   ├── api/                 # Backend — Express.js + Prisma + TypeScript
│   │   ├── prisma/          #   Database schema & migrations
│   │   └── src/
│   │       ├── controllers/ #   Request handlers
│   │       ├── services/    #   Business logic
│   │       ├── repositories/#   Data access layer
│   │       ├── routes/      #   API route definitions
│   │       ├── middlewares/  #   Auth, RBAC, rate limiting
│   │       └── utils/       #   JWT, hashing, geolocation
│   │
│   ├── web/                 # Frontend — React + Vite + Tailwind CSS
│   │   └── src/
│   │       ├── pages/       #   27 halaman fitur
│   │       ├── components/  #   Reusable UI components
│   │       ├── services/    #   API client layer
│   │       ├── store/       #   Zustand state management
│   │       └── routes/      #   React Router config
│   │
│   └── mobile/              # Mobile — Flutter (Dart)
│       └── lib/
│           ├── core/        #   Services, providers
│           ├── data/        #   Models, repositories
│           ├── domain/      #   Entities, use cases
│           └── presentation/#   Screens, widgets
│
├── docs/                    # Dokumentasi proyek
├── scripts/                 # Migration & seed scripts
├── docker-compose.yml       # PostgreSQL + Redis (local dev)
└── package.json             # Root monorepo scripts
```

---

## 🚀 Quick Start

### Prasyarat
- Node.js >= 18
- PostgreSQL 15+ & Redis 7+
- Flutter SDK (untuk mobile)

### 1. Clone & Install
```bash
git clone https://github.com/JexyDev/Pilah-Sampah-Cerdas.git
cd Pilah-Sampah-Cerdas

# Install semua dependencies
npm run install:all
```

### 2. Setup Database (Docker)
```bash
docker-compose up -d
cd apps/api
cp .env.example .env    # Edit sesuai kebutuhan
npx prisma migrate dev
npx prisma db seed
```

### 3. Jalankan Aplikasi
```bash
# Dari root folder:
npm run dev:api          # Backend  → http://localhost:3000
npm run dev:web          # Frontend → http://localhost:5173

# Atau jalankan bersamaan (Linux/Mac):
npm run dev:api & npm run dev:web
```

### 4. Mobile (Flutter)
```bash
cd apps/mobile
flutter pub get
flutter run
```

---

## 🛠 Tech Stack

| Layer | Teknologi |
|---|---|
| **Backend** | Express.js, TypeScript, Prisma ORM, PostgreSQL, Redis |
| **Frontend** | React 19, Vite, Tailwind CSS 4, Zustand, Recharts, Leaflet |
| **Mobile** | Flutter, Dart |
| **AI** | Gemini API (klasifikasi sampah) |
| **Infra** | PM2, Nginx, GitHub Actions CI/CD |

---

## 📋 Branching Strategy

Lihat [docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md) untuk SOP lengkap.

**Ringkasan:** Satu branch `main`, fitur dikerjakan di `feature/*`, merge via Pull Request.

---

## 👥 Tim Pengembang

- **Jeremy Darrell** — Backend & Frontend Web
- **Muhammad Habil Putrawan** — Mobile App (Flutter)

---

## 📄 Lisensi

UNLICENSED — Hak cipta dilindungi.
=======
Gunakan perintah `docker-compose ps` untuk memastikan status container berjalan (`running`).

### 2. Setup Environment Variables
Salin file `.env.example` menjadi `.env` di folder `/backend`:
```bash
cp .env.example .env
```
Sesuaikan konfigurasi koneksi database di `.env`:
```env
DATABASE_URL="postgresql://psc_user:psc_password@localhost:5432/psc_db?schema=public"
REDIS_URL="redis://localhost:6379"
PORT=3000
```

### 3. Install Dependencies
Jalankan instalasi modul node:
```bash
npm install
```

### 4. Setup Prisma Database Schema & Seed
Jalankan migrasi database PostgreSQL dan buat tabel secara otomatis sesuai skema SDD:
```bash
# Jalankan migrasi Prisma
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate
```

### 5. Jalankan Backend (Development Mode)
Jalankan server dengan auto-reload (nodemon):
```bash
npm run dev
```
Server backend akan aktif di `http://localhost:3000`.

---

## 🧪 Pengujian API (API Testing)
Gunakan tools API client seperti Postman atau Thunder Client ke endpoint berikut:
*   `POST http://localhost:3000/api/v1/waste/detect-mock` (Upload / deteksi AI)
*   `POST http://localhost:3000/api/v1/bins/scan` (Scan transaksi buang sampah)
>>>>>>> origin/mobile
