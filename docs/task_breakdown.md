# Task Breakdown & MoM Implementation — Pilah Sampah Cerdas

## 1. Rangkuman MoM (Kamis, 09 Juli 2026)

### 1.1 Penamaan Proyek & Monorepo
*   **Nama Resmi Proyek:** "Pilah Sampah Cerdas" (Repository: `pilah-sampah-cerdas`).
*   **Struktur Repositori:** Monorepo dengan default branch `backend`. Ditambah 2 branch independen: `frontend` dan `mobile`.

### 1.2 Target Pengguna (5 Role RBAC)
1.  **Admin Kecamatan Coblong:** Hak akses penuh CRUD Master Data dan review seluruh Kecamatan Coblong.
2.  **Petugas Kelurahan:** CRUD data RT/RW, data warga, dan tong sampah dalam cakupan kelurahan binaan.
3.  **Petugas RW:** CRUD terbatas dan pemantauan data warga/tong di lingkup RW.
4.  **Petugas RT:** Pemantauan warga, review & verifikasi pengosongan tong warga di lingkup RT.
5.  **Warga (Aplikasi Mobile):** Penyetoran sampah terpilah (Organik/Anorganik), pendaftaran tong (Aktivasi), dan pengajuan pengosongan tong penuh.

---

## 2. Pembagian Tugas & Branching Strategy

Untuk pengembangan IDE yang rapi, tim akan membuka satu root folder bernama **"pilah-sampah-cerdas"**. 

Setiap branch hanya berisi kode relevan dan folder `docs/` yang disinkronkan:

| Branch Name | Codebase Folder | Docs Folder | Yang Dihapus di Branch Ini (Tidak Boleh Di-push) |
|---|---|---|---|
| **`backend`** | `/backend`, `/prisma` | `/docs` | `/frontend`, `/mobile` |
| **`frontend`** | `/frontend` | `/docs` | `/backend`, `/mobile`, `/prisma`, `/src` |
| **`mobile`** | `/mobile` | `/docs` | `/backend`, `/frontend`, `/prisma`, `/src` |

---

## 3. Milestones Sprint 1
1.  **Setup Database Schema (BE):** Migrasi database PostgreSQL (11 tabel) dan setup Prisma ORM.
2.  **Setup Web Shell (FE):** Dashboard berbasis react dengan framework Vite. Setup halaman Master Data & Live Monitoring.
3.  **Setup Mobile Shell (Mobile):** Project Flutter minimalis dengan menyertakan assets acuan `/mobile/assets/stitch_ui`.
4.  **Integrasi AI Mock (BE):** API deteksi sampah mock sukses, timeout, dan unreadable.
