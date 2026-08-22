# Task Breakdown & MoM Implementation — BERSEKA

## 1. Rangkuman MoM (Kamis, 09 Juli 2026)

### 1.1 Penamaan Proyek & Monorepo
*   **Nama Resmi Proyek:** "BERSEKA" (Repository: `pilah-sampah-cerdas`).
*   **Struktur Repositori:** Monorepo dengan default branch `backend`. Ditambah 2 branch independen: `frontend` dan `mobile`.

### 1.2 Target Pengguna & Platform Role Scoping
1. **Aplikasi Mobile (Thin-Client):** Digunakan eksklusif oleh **Warga**, **Mahasiswa KKN**, dan **Petugas Residu**.
2. **Aplikasi Web (Superset Dashboard):** Digunakan oleh **SUPER USER, Admin Kecamatan, Admin Kelurahan, DPL, Pengangkut, Petugas RW, Petugas RT**, serta **Warga, Mahasiswa KKN, Petugas Residu** (untuk monitoring visual & analytics).

---

## 2. Pembagian Tugas & Branching Strategy

| Branch Name | Codebase Folder | Docs Folder | Yang Dihapus di Branch Ini |
|---|---|---|---|
| **`backend`** | `/backend`, `/prisma` | `/docs` | `/frontend`, `/mobile` |
| **`frontend`** | `/frontend` | `/docs` | `/backend`, `/mobile`, `/prisma` |
| **`mobile`** | `/mobile` | `/docs` | `/backend`, `/frontend`, `/prisma` |

---

## 3. Milestones Sprint 1
1. **Setup Database Schema (BE):** Migrasi database PostgreSQL (13 tabel) tanpa field NIK (menggunakan Nomor Telepon, NIM, NIP).
2. **Setup Web Shell (FE):** Dashboard berbasis React + Vite. Setup Halaman Khusus Management Reset Tempat Sampah (RT/RW) & Dashboard Monitoring Warga.
3. **Setup Mobile Shell (Mobile):** Project Flutter minimalis dengan assets acuan `/mobile/assets/stitch_ui`.
4. **Integrasi AI Mock (BE):** API deteksi sampah mock sukses, timeout, dan unreadable.

---

## 4. Trello / Task Board (Sprint 1)

### ✅ DONE
- [x] **[Mobile]** Merapikan struktur direktori (menggabungkan `mobile_app` ke `mobile`).
- [x] **[Mobile & BE]** Singkronisasi koneksi: Memperbarui IP Config Mobile (`172.16.0.2` & `127.0.0.1`).
- [x] **[BE]** Memastikan server backend berjalan dan port 3000 terekspos.
- [x] **[Mobile]** Perbaikan `InlineCameraWidget` untuk simulasi Scan QR dan Foto Sampah (AI).
- [x] **[Mobile]** Mengganti `dart:io File` ke `image_picker XFile` untuk kompatibilitas browser Chrome.

### ⏳ IN PROGRESS
- [ ] **[BE]** Hapus field NIK & perbarui Auth Controller menggunakan Nomor Telepon, NIM (KKN), dan NIP (DPL).
- [ ] **[FE Web]** Halaman Khusus Management Request Reset Tempat Sampah untuk RT dan RW (terarah per `rt_id`/`rw_id`).
- [ ] **[FE Web]** Halaman Dashboard Monitoring Warga (Status 2 Tempat Sampah, Grafik Setoran, Leaderboard).
- [ ] **[Mobile & BE & FE]** Sinkronisasi Sistem Terpadu (BE-FE-Mobile).

### 📝 TODO
- [ ] **[BE]** Filter otomatis request reset tempat sampah di database berdasarkan `rt_id` & `rw_id` pengurus yang login.
- [ ] **[BE]** Menyesuaikan *Mock AI* agar mengembalikan jenis sampah secara dinamis berdasarkan input gambar Warga.
- [ ] **[Mobile]** Menyiapkan panduan *build* APK/IPA jika aplikasi sudah lolos seluruh tahap Trial & Error.
