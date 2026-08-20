# BERSEKA (Bersih, Sehat, Kampung Asri) — Monorepo Workspace

BERSEKA (**Bersih, Sehat, Kampung Asri**) adalah sistem manajemen & pengolahan sampah cerdas berbasis komunitas dan KKN. Repositori ini merupakan **Monorepo** yang mengintegrasikan layanan **Backend API** (`apps/api`) dan **Web Dashboard Admin/Portal** (`apps/web`).

---

## 🏗️ Struktur Repositori

```text
main/
├── .github/workflows/        # CI/CD Deployment (deploy.yml)
├── apps/
│   ├── api/                  # Express.js (TypeScript) Backend API & Prisma ORM
│   └── web/                  # React + Vite Web Dashboard
├── database/                 # Inisialisasi Database SQL (trashcare.sql)
├── docs/                     # Dokumentasi Sistem & Laporan Audit QC
│   ├── architecture/         # Dokumen Arsitektur & Mapping Fitur
│   ├── reports/              # Laporan QC, Testing, & Progress Tracker
│   └── assets/               # Berkas PDF, Excel (.xlsx), & Data Dump
├── scripts/                  # Skrip Utility & Deployment
│   ├── dev/                  # Skrip bantu pengembangan & skema
│   ├── tools/                # Tools otomatisasi
│   └── vps/                  # Skrip setup & deploy VPS
├── docker-compose.yml        # Konfigurasi PostgreSQL & Redis local
├── package.json              # Root Workspace Configuration (NPM Workspaces)
└── README.md
```

---

## 🛠️ Persyaratan Sistem (Prerequisites)

* **Node.js**: `v20.x` atau lebih baru
* **NPM**: `v10.x` atau lebih baru
* **Docker & Docker Compose**: Untuk menjalankan PostgreSQL & Redis secara lokal

---

## 🚀 Panduan Memulai Cepat (Local Development)

### 1. Clone & Install Dependencies
Dari root repositori `main`, jalankan satu perintah untuk memasang dependensi seluruh workspace (`apps/api` & `apps/web`):
```bash
npm install
```

### 2. Jalankan Database & Redis (Docker)
Jalankan PostgreSQL dan Redis di latar belakang:
```bash
docker-compose up -d
```

### 3. Setup Environment Variables
Salin file environment untuk Backend API:
```bash
cp apps/api/.env.example apps/api/.env
```

### 4. Setup Database Schema (Prisma)
Jalankan generate Prisma Client untuk Backend API:
```bash
npm run prisma:generate
```

### 5. Jalankan Aplikasi (Development Mode)
Jalankan Backend API (`apps/api`) dan Web Dashboard (`apps/web`) secara bersamaan:
```bash
npm run dev:all
```
* **Backend API**: `http://localhost:3000`
* **Web Dashboard**: `http://localhost:5173`

---

## 📦 Perintah NPM Workspace

| Perintah | Deskripsi |
| :--- | :--- |
| `npm run dev:api` | Jalankan hanya Backend API (`apps/api`) |
| `npm run dev:web` | Jalankan hanya Web Dashboard (`apps/web`) |
| `npm run dev:all` | Jalankan Backend API & Web Dashboard secara paralel |
| `npm run build:all` | Compile & Build seluruh aplikasi untuk produksi |
| `npm run prisma:generate` | Generate Prisma Client pada `apps/api` |
| `npm run test:api` | Jalankan unit testing pada `apps/api` |

---

## 🚀 Deployment (CI/CD)
Deployment otomatis diatur via GitHub Actions ([.github/workflows/deploy.yml](file:///.github/workflows/deploy.yml)) yang akan otomatis men-deploy `apps/api` dan `apps/web` ke server VPS setiap ada *push* ke branch `main`.
