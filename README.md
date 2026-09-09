# BERSEKA (Bersih, Sehat, Kampung Asri) — Monorepo Workspace

[![Staging CI/CD](https://github.com/JexyDev/Pilah-Sampah-Cerdas/actions/workflows/deploy-staging.yml/badge.svg)](https://github.com/JexyDev/Pilah-Sampah-Cerdas/actions/workflows/deploy-staging.yml)
[![Production CI/CD](https://github.com/JexyDev/Pilah-Sampah-Cerdas/actions/workflows/deploy.yml/badge.svg)](https://github.com/JexyDev/Pilah-Sampah-Cerdas/actions/workflows/deploy.yml)
[![License](https://img.shields.io/badge/License-Proprietary-blue.svg)](LICENSE)
[![Node Version](https://img.shields.io/badge/Node.js-v20.x+-green.svg)](https://nodejs.org/)

BERSEKA (**Bersih, Sehat, Kampung Asri**) adalah platform sistem cerdas pengelolaan dan pemilahan sampah terpadu tingkat Rukun Warga (RW) dan Kecamatan di Kota Bandung, yang diintegrasikan dengan program KKN Tematik perguruan tinggi serta model *Artificial Intelligence (Computer Vision)* untuk klasifikasi sampah organik, anorganik, dan residu.

Repositori ini dikelola sebagai **Monorepo** (NPM Workspaces) yang memayungi layanan **Backend REST API** (`apps/api`) dan **Frontend Web Dashboard** (`apps/web`).

---

## 🌐 Lingkungan Live (Environments & Endpoints)

| Lingkungan | Web Dashboard | API Base URL | CI/CD Trigger | Catatan |
|---|---|---|---|---|
| **Lokal (Dev)** | `http://localhost:5173` | `http://localhost:3000/api/v1` | Manual | Database Docker PostgreSQL 15 |
| **Staging (QA)** | [staging.berseka.id](https://staging.berseka.id) | [staging.berseka.id/api/v1](https://staging.berseka.id/api/v1) | Push / Merge ke `staging` | VPS Staging (`157.10.160.93`), auto-deploy |
| **Production** | [berseka.id](https://berseka.id) | [berseka.id/api/v1](https://berseka.id/api/v1) | Push / Merge ke `main` | VPS Produksi, auto-deploy |

---

## 🏗️ Struktur Arsitektur Monorepo

```text
.
├── .github/
│   ├── workflows/
│   │   ├── deploy-staging.yml  # Auto-deploy ke VPS Staging (branch staging)
│   │   └── deploy.yml          # Auto-deploy ke VPS Production (branch main)
│   └── pull_request_template.md # Template PR standar ISO & Quality Control
├── apps/
│   ├── api/                    # Express.js (TypeScript) Backend REST API & Prisma ORM
│   └── web/                    # React 18 + Vite Multi-Role Portal & Geofencing Dashboard
├── database/                   # Berkas skema & dump inisialisasi SQL
├── docs/                       # Dokumentasi teknis, modul KKN, integrasi mobile, & laporan QC
├── scripts/                    # Skrip otomatisasi & pemeliharaan VPS
├── docker-compose.yml          # Orchestrasi container lokal (PostgreSQL & Redis)
├── AGENTS.md                   # Pedoman AI Agent untuk web & backend (SOP wajib)
├── package.json                # Monorepo Workspace Root
└── README.md
```

---

## 🌳 Standarisasi Git Workflow (ISO/IEC 12207 & 27001)

Repositori ini menerapkan alur kerja **3-Tier Branching Strategy** untuk menjamin isolasi lingkungan pengujian dan stabilitas produksi:

```text
[feat/... / fix/...]  ──PR──>  [development]  ──PR──>  [staging]  ──PR──>  [main]
    (Developer)               (Integrasi Dev)         (UAT / QA)        (Live Production VPS)
                                                           │                     │
                                                     Auto-deploy           Auto-deploy
                                                     Staging VPS            Prod VPS
```

1. **`development`**: Cabang integrasi aktif untuk seluruh pengerjaan fitur harian tim developer.
2. **`staging`**: Cabang pengujian UAT (*User Acceptance Testing*) dan kandidat rilis (*Release Candidate*). Setiap push/merge otomatis ter-deploy ke `https://staging.berseka.id`.
3. **`main`**: Cabang rilis produksi terlindungi. Setiap push/merge otomatis ter-deploy ke `https://berseka.id`.
4. **`mobile`**: Cabang mandiri terisolasi untuk source code aplikasi client Flutter Mobile.

> ⚠️ **Aturan:** Dilarang melakukan *direct push* ke cabang `staging` maupun `main`. Semua perubahan wajib melalui Pull Request dengan checklist QC yang terpenuhi.

---

## 🛠️ Prasyarat Lingkungan (Prerequisites)

* **Node.js**: `v20.x` atau versi LTS yang lebih tinggi
* **NPM**: `v10.x` atau lebih baru
* **Docker & Docker Compose**: Untuk menjalankan PostgreSQL dan Redis lokal
* **PostgreSQL Client (Opsional)**: Untuk eksplorasi database langsung

---

## 🚀 Panduan Memulai Cepat (Local Development)

### 1. Pasang Dependensi Monorepo
Jalankan satu perintah dari root folder untuk menginstal seluruh dependensi backend dan frontend:
```bash
npm install
```

### 2. Jalankan Database Lokal (Docker)
Nyalakan PostgreSQL (Port 5432) dan Redis (Port 6379) di background:
```bash
docker-compose up -d
```

### 3. Konfigurasi Environment Variables
Salin template environment untuk Backend API:
```bash
cp apps/api/.env.example apps/api/.env
```
Salin template environment untuk Frontend Web:
```bash
cp apps/web/.env.example apps/web/.env
```

### 4. Sinkronisasi Database (Prisma ORM)
Generate client Prisma dan jalankan migrasi database:
```bash
npm run prisma:generate
npm run db:push
```
*(Opsional)* Isi database dengan data awal (*seed data*):
```bash
npm run prisma:seed
```

### 5. Jalankan Server Pengembangan

* **Menjalankan Keduanya Bersamaan (API + Web):**
  ```bash
  npm run dev
  ```
* **Menjalankan Hanya Backend API (`http://localhost:3000`):**
  ```bash
  npm run dev:api
  ```
* **Menjalankan Hanya Frontend Web (`http://localhost:5173`):**
  ```bash
  npm run dev:web
  ```

---

## 🧪 Validasi Kualitas Kode & Build (QC Standard)

Monorepo ini menerapkan type-checking ketat sebelum kode dapat di-merge ke branch `staging` atau `main`:

```bash
# Validasi TypeScript Backend API (apps/api)
npm run build:api

# Validasi & Bundling Frontend Web (apps/web)
npm run build:web

# Menjalankan Unit Testing API
npm run test:api
```

---

## 📋 Standar Pedoman untuk AI & Developer

Setiap kontributor manusia maupun AI Agent (Cursor, Copilot, Antigravity, Claude Code) **wajib** mematuhi pedoman di [AGENTS.md](AGENTS.md):
* **Larangan Kata 'Tong'**: Wajib gunakan 'Tempat Sampah'.
* **Larangan Penggunaan NIK**: Identitas autentikasi menggunakan Nomor Telepon (+62).
* **Anti-Dummy Policy**: Dilarang menggunakan mock data statis tanpa indikator status yang jelas.
* **Review Mandat**: Wajib konfirmasi kepada user sebelum melakukan commit/push/deploy.

---

## 👥 Tim & Kepemilikan

Dikembangkan oleh tim pengembang **PT Makerindo Prima Solusi** bekerja sama dengan akademisi dan pemerintah daerah dalam program digitalisasi lingkungan Kecamatan Coblong, Kota Bandung.
