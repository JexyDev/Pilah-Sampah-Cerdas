# Task Breakdown & Trello Sync — Trashcare

## 1. Rangkuman MoM & Spesifikasi Final (27 Juli 2026)

### 1.1 Penamaan Proyek & Monorepo
*   **Nama Resmi Proyek:** "Trashcare — Sistem Pemilahan Sampah Cerdas Kecamatan Coblong".
*   **Struktur Repositori:** Monorepo murni (`apps/backend`, `apps/frontend`, `apps/mobile`, `packages/shared-types`).

### 1.2 Target Pengguna (10 Role RBAC)
1.  **Warga:** Registrasi (Auto-accept GPS vs RT/RW), Aktivasi Tempat Sampah 30 hari, Setoran AI + Scan QR, Monitoring Poin & Leaderboard.
2.  **RT:** Akses monitoring warga & data wilayah RT.
3.  **RW:** Approval aktivasi Tempat Sampah (+10 Poin atomik), CRUD Pemanfaatan Sampah (Buruan Sae, Maggot, POC), Monitoring Poligon RW.
4.  **Petugas Residu:** Timbangan manual Kg, Setoran via-RW / mandiri, Monitoring Notifikasi Marker Merah.
5.  **Pengangkut:** Penugasan otomatis area poligon terdekat, update status armada pengangkutan.
6.  **Mahasiswa KKN:** Pendaftaran NIM, pendampingan warga gaptek, Presensi Poligon GPS (2 jam akumulasi).
7.  **DPL:** Pemantauan durasi presensi mahasiswa & penilaian performa KKN.
8.  **Admin Kelurahan:** Monitoring visual dashboard (Read-Only), drill-down zoom RT/RW.
9.  **Admin Kecamatan:** Monitoring visual se-Kecamatan (Read-Only), evaluasi diskrepansi AI (`PENDING_REVIEW`).
10. **Super Admin:** Akses penuh data mentah & log immutable Aktivitas Pemilahan Sampah.

---

## 2. Struktur Trello Board ("PT Markerindo Project Pengolahan Sampah Kecamatan")

### 🟢 DONE (89 Cards)
- [x] Setup Monorepo, CI/CD Actions, Database Schema & Seeding Data Bandung
- [x] Backend Clean Architecture & Express API Scaffolding
- [x] RBAC & JWT Authentication (Auth WA OTP Warga & Email/Password Role Lain)
- [x] Core Use Case: Setoran AI, Scan QR Bin, Timbangan Residu, Presensi KKN, Pemanfaatan RW
- [x] Dashboard Analytics (Dominant Category Chart, Pemanfaatan Bar Chart, Fix Overlapping Leaderboard)

### ⏳ IN PROGRESS (5 Cards)
- [ ] **[Fullstack]** Sinkronisasi Sistem Terpadu (BE - FE - Mobile)
- [ ] **[Mobile]** Mobile Tes Fitur (End-to-End Flow Warga & Mahasiswa)
- [ ] **[FE Web]** Frontend Tes Fitur (Dashboard Monitoring & Management Data)
- [ ] **[QA]** Trial & Error Manual & Penyelarasan Skenario Demo
- [ ] **[Docs]** 📂 Pilah Sampah Cerdas — Project Overview & Synchronization

### 📋 BACKLOG / TASK (19 Cards & Catatan Terbuka)

#### 🔴 Butuh Klarifikasi (Top Backlog)
1. **[Catatan Terbuka] — Pengangkut:** Rumus final ranking leaderboard pengangkut.
2. **[Catatan Terbuka] — RW:** Field schema spesifik CRUD Pemanfaatan (Buruan Sae, Maggot, POC).
3. **[Catatan Terbuka] — Monitoring:** Trigger detail kondisi Tempat Sampah bermasalah/rusak.
4. **[Catatan Terbuka] — GIS:** Skala gradasi warna pekat poligon wilayah berdasarkan akumulasi Kg.
5. **[Catatan Terbuka] — Backend:** Spesifikasi contract interface AI Vendor.

#### 🟡 Task MVP & Bug Tracker
- [ ] `🔴 [BUG-001] Missing Backend Geofencing Validation`
- [ ] `🟡 [BUG-002] AI API Contract Schema Mismatch`
- [ ] `🟡 [BUG-003] Incorrect Point Reward Calculation Formula`
- [ ] `🟡 [BUG-004] Missing "Tong Penuh" Notification Event Trigger`
- [ ] `🟢 [BUG-005] Missing Live Monitoring Geospatial Endpoint`
- [ ] `🔴 [BUG-006] Security: Missing Route Authentication and Rate Limiting`
