# Backend Service — Pilah Sampah Cerdas

Layanan backend berbasis **Express.js (TypeScript)** untuk mengelola database PostgreSQL, antrian deteksi AI di Redis, dan sistem notifikasi/poin.

## 🛠️ Persyaratan Sistem (Prerequisites)
Sebelum menjalankan, pastikan Anda telah memasang:
*   [Node.js (v18 atau lebih baru)](https://nodejs.org/)
*   [Docker Desktop](https://www.docker.com/)

---

## 🚀 Panduan Memulai Cepat (Local Development)

### 1. Jalankan Database & Cache (Docker)
Buka terminal di folder `/backend` lalu jalankan perintah berikut untuk menyalakan PostgreSQL dan Redis secara otomatis di background:
```bash
docker-compose up -d
```
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
