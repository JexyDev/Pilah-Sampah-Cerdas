# Catatan Perubahan (Changelog) — Trashcare

Semua perubahan penting pada proyek **Trashcare** dicatat di sini berdasarkan format [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Added
- **Mahasiswa KKN** — Presensi & Tracking Poligon: Endpoint presensi berbasis durasi 2 jam & area poligon kegiatan KKN (`apps/api/src/routes/adminMahasiswaRoutes.ts`).
- **Warga** — Setoran AI & Poin: Logika 1 Kg = 10 Poin, notifikasi peringatan aktivasi 24 jam, serta scan QR Tempat Sampah.
- **Petugas Residu** — Setoran Manual: Autocomplete pencarian warga dan perhitungan kalkulasi poin real-time saat penimbangan manual.
- **RW** — Management Lokasi & Pemanfaatan: Visualisasi peta Voronoi lokasi dan CRUD data Pemanfaatan (Buruan Sae, Rumah Maggot, POC).
- **Admin Kelurahan/Kecamatan/Super Admin** — Monitoring Dashboard: Grafik komposisi sampah dominan dan perbaikan layout leaderboard.

### Changed
- **Sistem Akun (Semua Role)** — Refactor registrasi: Penghapusan field NIK dan Email di seluruh modul user & backend API.
- **Super Admin & Admin Coblong** — Standardisasi nama role menjadi UPPERCASE pada script seed database (`seed_demo_bandung.ts`).

### Fixed
- **Camat & Mahasiswa KKN** — Perbaikan guard permission endpoint panggil pendaftaran & ping presensi.
- **Warga** — Bypass `BIN_CATEGORY_DUPLICATE` untuk mengizinkan 2 Tempat Sampah (1 Organik & 1 Anorganik) per rumah tangga.
- **RW & Warga** — Perbaikan overlap visual pada komponen Leaderboard Dashboard Web.
- **Mahasiswa KKN** — Perbaikan algoritma deteksi titik dalam poligon geofencing presensi.

---

## [0.1.0-alpha] — 2026-07-10
### Added
- Inisialisasi Monorepo untuk `backend`, `frontend`, dan `mobile`.
- Dokumen spesifikasi teknis dan panduan arsitektur di folder `docs/`.
