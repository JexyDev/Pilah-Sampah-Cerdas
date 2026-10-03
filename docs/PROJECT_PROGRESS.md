# 📊 BERSEKA - MASTER PROJECT STATUS & LIVING PROGRESS

**Terakhir Diperbarui:** 3 Oktober 2026  
**Otoritas:** Tech Lead & Lead Fullstack Developer  
**Status Proyek:** Active Production & Continuous Enhancement  
**Dokumen Referensi Inti:**  
- 📜 [Konstitusi Paten DPL](DPL_PATEN_CONSTITUTION.md)
- 🔀 [Git Workflow Standar](GIT_WORKFLOW.md)
- 📱 [Spesifikasi API Mobile](MOBILE_API_DOCS.md)
- 📂 Arsip Laporan Historis: [`docs/archive/`](archive/)

---

## 1. Ringkasan Eksekutif & Arsitektur Sistem

**BERSEKA** adalah platform terintegrasi untuk pengelolaan sampah perkotaan, pemilahan limbah residu, dan tata kelola program Kuliah Kerja Nyata (KKN) Tematik di wilayah Coblong (Sadang Serang, Sekeloa, Dago, Lebak Siliwangi, Cipaganti, Lebak Gede).

### Arsitektur Teknologi
* **Backend API (`apps/api`)**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL (VPS Live: `157.10.252.252:3000`).
* **Web Frontend (`apps/web`)**: React 18, Vite, TypeScript, TailwindCSS.
* **Mobile App (`mobile`)**: Flutter / Dart (Didukung target iOS & Android).

---

## 2. Invarian Paten & Aturan Tata Kelola (Anti-Halusinasi AI)

Setiap pengembang maupun asisten AI wajib mematuhi 3 pilar perlindungan sistem berikut:

### A. 🔒 Role DPL (Dosen Pembimbing Lapangan) - Status PATEN / IMMUTABLE
* **Scoping Strict**: DPL hanya dapat melihat dan menilai mahasiswa di dalam `KelompokKkn` miliknya (`getKelompokWhere`).
* **Hak Mutasi Eksklusif**: Keputusan izin/sakit mahasiswa (`/dpl/approvals/:requestId/decide`) dan penilaian program kerja (`/dpl/program-kerja/:id/decision`) adalah hak eksklusif DPL & Panitia Taskforce. Role Pimpinan dan MPL berstatus **READ-ONLY (403 Forbidden)**.
* **Logbook Edit Pasca-ACC**: Jika mahasiswa mengedit logbook yang sudah di-ACC, status otomatis kembali ke `MENUNGGU_VERIFIKASI_DPL` tanpa merusak saldo poin (tetap 3 PTS tanpa duplikasi).
* **Threshold Kelulusan**: Nilai lulus minimum KKN adalah **65**.
* **Proteksi File**: Dilarang memodifikasi file DPL (`dplService.ts`, `dplRoutes.ts`, `dplController.ts`, `penilaianKknService.ts`, `pages/dpl/*`) tanpa konfirmasi eksplisit dan wajib menjalankan test suite:
  ```bash
  npx vitest run apps/api/src/controllers/dplApproval.test.ts apps/api/src/services/logbookVerifikasi.test.ts apps/api/src/services/penilaianKknRoleGuard.test.ts
  ```

### B. 🛡️ Perlindungan Database VPS & Larangan Seeder Dummy
* **Anti-Dummy Seed**: Dilarang keras menjalankan skrip seeder apa pun ke database VPS (`157.10.252.252` / `psc_db`) yang berisi data operasional riil.
* **Skrip Terproteksi**: Semua seeder lokal wajib dicegat modul `vpsSafetyGuard`.
* **Prisma Rule**: Di VPS hanya diizinkan `npx prisma migrate deploy`. **Dilarang memakai `prisma db push`**.
* **Golden Backup**: Wajib backup dump sebelum intervensi skema (`npm run backup:full`).

### C. 🌿 Standar 3-Tier Git-Flow
* Alur integrasi: `[feat/* / fix/*] ──PR──> [development] ──PR──> [staging] ──PR──> [main]`.
* Larangan push langsung ke `staging` atau `main`.
* Selalu jalankan type-check dan linter sebelum merge (`npm run build` / `tsc --noEmit`).

---

## 3. Matriks Peran Pengguna (Role Matrix)

| Peran (Role) | Platform Akses | Tanggung Jawab Utama | Batasan Khusus |
| :--- | :---: | :--- | :--- |
| **DPL** | Web Desktop (NIP/HP) | Verifikasi logbook, izin/sakit, penilaian akhir KKN | Terisolasi per kelompok bimbingan |
| **Mahasiswa KKN** | Mobile (iOS / Android) | Presensi mandiri, logbook kegiatan harian, pendampingan warga | Geofencing posko & jadwal ketat |
| **Petugas Residu** | Mobile | Pencatatan pengangkutan sampah residu, penimbangan | Terikat jadwal rute TPS |
| **MPL (Mitra)** | Web Desktop | Monitoring kebersihan lingkungan & progres wilayah | Read-only untuk nilai & persetujuan DPL |
| **Pimpinan** | Web Desktop | Dashboard eksekutif, rekap analitik, GIS monitoring | Read-only untuk mutasi izin & nilai |
| **Panitia Taskforce**| Web Desktop | Supervisi teknis KKN, intervensi kendala darurat | Hak approval backup untuk DPL |
| **Admin / Superuser**| Web Desktop | Konfigurasi master data, manajemen akun & wilayah | Full access berizin khusus |

---

## 4. Status Fitur & Pencapaian Utama (Resolved Milestones)

- [x] **Presensi Mandiri Mahasiswa KKN (V2)**:
  - Validasi radius geofencing posko (50-100 meter dinamis).
  - Cutoff waktu otomatis (pagi s.d. 18:00 WIB).
  - Fitur pengajuan izin / sakit dengan lampiran surat dokter.
- [x] **Alur Verifikasi Logbook & Gamifikasi Poin**:
  - Poin awal logbook: 3 PTS saat submit.
  - Reset status saat koreksi pasca-ACC tanpa duplikasi poin.
  - Perhitungan poin pembimbingan DPL (6 PTS per logbook aktivitas).
- [x] **Sistem Penilaian Akhir KKN & Nilai Konversi**:
  - Formula terpadu: Nilai Etika, Kehadiran, Logbook, Program Kerja, dan Laporan Akhir.
  - Passing grade standar: 65 (Nilai Mutu C / Lulus).
- [x] **Modul Pendampingan Warga & Pengosongan Tempat Sampah**:
  - Integrasi barcode/QR multi-RW di Coblong.
  - Integrasi endpoint mobile Flutter untuk pencatatan warga dampingan.
- [x] **Dashboard Pimpinan & GIS Tata Kelola Sampah**:
  - Visualisasi sebaran timbulan sampah dan progres KKN per kelurahan.

---

## 5. Direktori & Arsip Dokumen

Semua laporan audit berkala, investigasi teknis perorangan, dan dokumen historis telah dirapikan ke dalam folder:
📁 [`docs/archive/`](archive/)

Daftar dokumen operasional aktif yang tetap berada di `docs/`:
1. `PROJECT_PROGRESS.md` *(Dokumen ini - Single Source of Truth)*
2. `DPL_PATEN_CONSTITUTION.md` *(Konstitusi paten DPL)*
3. `GIT_WORKFLOW.md` *(Tata kelola branch & deployment)*
4. `MOBILE_API_DOCS.md` *(Spesifikasi REST API mobile)*
5. `deployment_runbook.md` *(Panduan deploy VPS & Staging)*
6. `prd.md`, `sdd.md`, `srs.md` *(Spesifikasi kebutuhan perangkat lunak)*

---

## 6. Panduan untuk Agen AI & Developer Baru
1. Sebelum mulai mengerjakan fitur atau bugfix:
   - Baca dokumen ini dan pastikan branch yang digunakan adalah turunan dari `development`.
   - Cek apakah task bersinggungan dengan modul **DPL** atau **VPS Database**. Jika ya, patuhi klausul invarian di Bab 2.
2. Gunakan **1 sesi percakapan per tugas spesifik** (misal: "Fix validasi QR RW 04"). Setelah selesai di-commit/di-merge, mulai sesi baru untuk tugas berikutnya agar penalaran AI tetap jernih dan bebas *context noise*.
