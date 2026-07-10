# Frontend Web Dashboard — Pilah Sampah Cerdas

Dasbor pemantauan, peta spasial GIS, dan pengelolaan Master Data berbasis **React.js & Vite**.

## 🛠️ Persyaratan Sistem (Prerequisites)
Sebelum menjalankan, pastikan Anda telah memasang:
*   [Node.js (v18 atau lebih baru)](https://nodejs.org/)

---

## 🚀 Panduan Memulai Cepat (Local Development)

### 1. Masuk ke Folder Frontend
```bash
cd frontend
```

### 2. Install Dependencies
Jalankan instalasi modul node:
```bash
npm install
```

### 3. Setup Environment Variables
Buat file `.env` di folder `/frontend` (sesuaikan port backend API yang menyala):
```env
VITE_API_BASE_URL="http://localhost:3000/api/v1"
```

### 4. Jalankan Server Development React
Jalankan server Vite untuk local development:
```bash
npm run dev
```
Aplikasi web dashboard akan aktif di `http://localhost:5173`. Buka di browser Anda.

---

## 📂 Struktur Menu Web Dashboard
*   **Dashboard:** Ringkasan KPI statistik volume dan tingkat kesadaran warga.
*   **Live Monitoring (Dedicated Page):** Peta geospatial (hierarki RT/RW/Kelurahan) dengan auto-refresh 30 detik untuk memantau titik tong sampah.
*   **Master Data:** Navigasi dropdown untuk CRUD 8 entitas utama (User, Area RT/RW, Rumah Tangga, Tong Sampah, dll).
*   **Leaderboard:** Peringkat kompetisi pemilahan antar-RT dan warga teraktif.
