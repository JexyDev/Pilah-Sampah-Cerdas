# BERSEKA Web Dashboard & Multi-Role Portal

Portal Web Terpadu untuk Sistem Tata Kelola Sampah Cerdas & Evaluasi Dampak Lingkungan **BERSEKA (Bersih, Sehat, Kampung Asri)** di wilayah Kecamatan Coblong, Kota Bandung.

Dibangun dengan arsitektur modern berbasis modul portal peran (*Multi-Role Portals*), visualisasi geospasial (*Interactive GIS Map*), serta integrasi model AI Computer Vision untuk klasifikasi sampah.

---

## 🌟 Fitur Utama

- **Multi-Role Portal Access**: Mendukung dashboard peran yang terisolasi dengan RBAC dinamis:
  - **Super User / Administrator**: Manajemen pengguna, hak akses matriks, master wilayah, kurasi data, dan audit trail.
  - **Admin Dinas Lingkungan Hidup (DLH)**: Monitoring volume sampah, kepatuhan RW, dan tren pemilahan tingkat kecamatan.
  - **Pimpinan & Eksekutif KKN (Rektorat / Camat / Lurah)**: Ringkasan capaian eksekutif, rekapitulasi nilai, dan analisis dampak program.
  - **Dosen Pembimbing Lapangan (DPL)**: Validasi logbook mahasiswa, pemantauan presensi GPS, dan evaluasi program kerja KKN.
  - **Rukun Warga (RW)**: Input fasilitas pengolahan, persetujuan jadwal, dan rekapitulasi setoran sampah warga.
  - **Mahasiswa KKN**: Pelaporan logbook kegiatan, presensi mandiri geofence, dan inventarisasi survei sampah.
  - **Mitra Pendamping Lapangan (MPL)**: Penilaian kolaboratif mahasiswa dan monitoring hasil pemanfaatan sampah.
- **Interactive Geofencing & GIS Map**: Peta polygon interaktif (Leaflet) untuk monitoring lokasi posko, sebaran tempat sampah pintar (IoT QR), dan lintasan pengangkutan.
- **AI Classification Dashboard**: Integrasi real-time dengan model Computer Vision untuk audit foto setoran, skor akurasi deteksi, dan deteksi anomali.
- **Export & Reporting Engine**: Ekspor laporan rekapitulasi transaksi, absensi, dan luaran sampah ke format XLSX terstandarisasi.

---

## 🛠️ Tech Stack

- **Framework**: [React 18](https://react.dev/) + [Vite 6](https://vitejs.dev/)
- **Bahasa**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Routing**: [React Router v6](https://reactrouter.com/) (Lazy Loaded Code-Splitting)
- **Visualisasi & Charts**: [Recharts](https://recharts.org/)
- **Peta Geospasial**: [Leaflet](https://leafletjs.com/) + [React-Leaflet](https://react-leaflet.js.org/)
- **Iconography**: [Lucide React](https://lucide.dev/)
- **HTTP Client**: [Axios](https://axios-http.com/)

---

## 📁 Struktur Direktori `src/`

```text
src/
├── assets/             # Aset gambar statis, ilustrasi, dan logo
├── components/         # Komponen UI modular
│   ├── analytics/      # Komponen widget analitik & chart
│   ├── common/         # Komponen reusable (Pagination, Modal, TableState, dll.)
│   ├── layout/         # Header, Sidebar navigasi dinamis, dan Layout wrapper
│   └── maps/           # Komponen peta Leaflet & polygon geofence
├── config/             # Konfigurasi aplikasi & konstanta runtime
├── constants/          # GeoJSON batas wilayah & metadata statis
├── data/               # Data template kurikulum & timeline
├── hooks/              # Custom React hooks (autentikasi, notifikasi, dll.)
├── pages/              # Halaman portal dikelompokkan per fitur bisnis
│   ├── Dashboard/      # Dashboard utama & Dashboard Eksekutif KKN
│   ├── KknDashboard/   # Portal Mahasiswa & Logbook
│   ├── Monitoring/     # Pemantauan real-time tempat sampah
│   ├── RekapSetoran/   # Rekapitulasi transaksi pemilahan warga
│   ├── SuperUser/      # Manajemen sistem & role permissions
│   └── ...
├── routes/             # Definisi routing aplikasi (AppRoutes.tsx)
├── services/           # Service layer HTTP API client
├── store/              # Global state (useAuthStore, useLeaderboardStore)
└── utils/              # Utility fungsi (formatting tanggal Safari-safe, toast, sorting)
```

---

## 🚀 Panduan Pengembangan Lokal

### 1. Salin Konfigurasi Environment
```bash
cp .env.example .env
```
Sesuaikan `VITE_API_URL` dengan endpoint backend lokal Anda (default: `http://localhost:3000`).

### 2. Jalankan Server Pengembangan (Dev Server)
Dari root monorepo:
```bash
npm run dev:web
```
Atau langsung dari folder `apps/web`:
```bash
npm run dev
```
Aplikasi akan aktif di `http://localhost:5173`.

### 3. Validasi Tipe & Build Produksi
Pastikan tidak ada error kompilasi TypeScript:
```bash
npx tsc --noEmit
```
Jalankan proses bundling aset produksi:
```bash
npm run build
```
Aset bundle yang siap dideploy akan di-generate di folder `dist/`.
