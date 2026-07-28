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
1.  **Setup Database Schema (BE):** Migrasi database PostgreSQL (13 tabel: roles, users, refresh_tokens, kelurahan, rt_rw_areas, households, bins, waste_categories, waste_logs, ai_request_logs, point_history, notifications, bin_reset_requests) dan setup Prisma ORM.
2.  **Setup Web Shell (FE):** Dashboard berbasis react dengan framework Vite. Setup halaman Master Data & Live Monitoring.
3.  **Setup Mobile Shell (Mobile):** Project Flutter minimalis dengan menyertakan assets acuan `/mobile/assets/stitch_ui`.
4.  **Integrasi AI Mock (BE):** API deteksi sampah mock sukses, timeout, dan unreadable.

---

## 4. Trello / Task Board (Sprint 1)

### ✅ DONE
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
1.  **Setup Database Schema (BE):** Migrasi database PostgreSQL (13 tabel: roles, users, refresh_tokens, kelurahan, rt_rw_areas, households, bins, waste_categories, waste_logs, ai_request_logs, point_history, notifications, bin_reset_requests) dan setup Prisma ORM.
2.  **Setup Web Shell (FE):** Dashboard berbasis react dengan framework Vite. Setup halaman Master Data & Live Monitoring.
3.  **Setup Mobile Shell (Mobile):** Project Flutter minimalis dengan menyertakan assets acuan `/mobile/assets/stitch_ui`.
4.  **Integrasi AI Mock (BE):** API deteksi sampah mock sukses, timeout, dan unreadable.

---

## 4. Trello / Task Board (Sprint 1)

### ✅ DONE
- [x] **[Mobile]** Merapikan struktur direktori (menggabungkan `mobile_app` ke `mobile`).
- [x] **[Mobile & BE]** Singkronisasi koneksi: Memperbarui IP Config Mobile (`172.16.0.2` & `127.0.0.1`) agar Mobile berhasil nge-ping BE.
- [x] **[BE]** Memastikan server backend berjalan (tidak crash/idle) dan port 3000 terekspos untuk aplikasi Mobile.
- [x] **[Mobile]** Perbaikan `InlineCameraWidget`: Menghapus limitasi Web sehingga kamera laptop bisa dipakai untuk simulasi fitur Scan QR dan Foto Sampah (AI).
- [x] **[Mobile]** Perbaikan kompatibilitas: Mengganti tipe penyimpanan `dart:io File` ke `image_picker XFile` agar tidak crash saat mengambil foto di browser Chrome.

### ⏳ IN PROGRESS
- [ ] **[Mobile & BE & FE]** Sinkronisasi Sistem Terpadu (BE-FE-Mobile) <!-- id: 6a55b8ed150557caf34fd600 -->
- [ ] **[Mobile]** Tes Fitur Mobile <!-- id: 6a55b8ee6a9ca7f03b634e93 -->
- [ ] **[FE]** Tes Fitur Frontend <!-- id: 6a55b8ef3f47248b3459b8dc -->
- [ ] **[QA]** Trial & Error Manual <!-- id: 6a55b8f000ee8c65f4c3ce42 -->

### 📝 TODO
- [ ] **[Mobile]** Menyiapkan panduan *build* APK/IPA jika aplikasi sudah lolos seluruh tahap Trial & Error.
- [ ] **[BE]** Menyesuaikan *Mock AI* agar mengembalikan jenis sampah secara dinamis berdasarkan input gambar Warga.
