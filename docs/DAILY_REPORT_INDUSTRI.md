# Laporan Harian Projek Trashcare (2 Agustus 2026 - 14 Agustus 2026)

Dokumen ini berisi pencatatan laporan harian (daily report) untuk pihak industri/pembimbing projek dengan pasangan **Task** dan **Note/Problem** per item pekerjaan.

---

## Minggu 1 (2 - 9 Agustus 2026)

### Senin, 3 Agustus 2026
1. **Task:** Review dokumen kebutuhan sistem & penyesuaian skema database Prisma untuk modul KKN.
   - **Note/Problem:** Menyesuaikan skema tabel agar mematuhi kebijakan penanganan data (tanpa NIK, menggunakan No. HP).
2. **Task:**  
   - **Note/Problem:** Memastikan struktur payload API sesuai skema RBAC baru.

### Selasa, 4 Agustus 2026
1. **Task:** Implementasi middleware `readOnlyGuard` dan `taskforceRoleGuard` pada API.
   - **Note/Problem:** Perlu pengujian ketat agar role read-only (Lurah/Camat) menolak HTTP method POST/PUT/DELETE.
2. **Task:** Setup API routing untuk data timbulan sampah dan kelurahan scope.
   - **Note/Problem:** Berhasil diimplementasikan tanpa kendala signifikan.

### Rabu, 5 Agustus 2026
1. **Task:** Refactoring controller kelompok KKN untuk dukungan CRUD dan filter wilayah.
   - **Note/Problem:** Filter wilayah (Kelurahan/Kecamatan) memerlukan relasi query Prisma yang efisien.
2. **Task:** Penyesuaian skema DPL dan Taskforce pada modul backend.
   - **Note/Problem:** Penyesuaian hierarki akses role memerlukan validasi ekstra pada penanganan JWT payload.

### Kamis, 6 Agustus 2026
1. **Task:** Pengolahan modul import data survei KKN via Excel (`import-xlsx-survei-kkn`).
   - **Note/Problem:** Format file Excel memerlukan validasi header strict agar tidak memicu error parsing.
2. **Task:** Penyusunan dokumentasi endpoint survei KKN dan integrasi database.
   - **Note/Problem:** Dokumentasi harus diselaraskan dengan parameter request pada frontend.

### Jumat, 7 Agustus 2026
1. **Task:** Pengecekan unit test & validasi role guard pada endpoint backend.
   - **Note/Problem:** Memastikan seluruh rute backend terproteksi dengan middleware role guard yang sesuai.
2. **Task:** Sinkronisasi perubahan fitur dengan dokumentasi arsitektur frontend/backend.
   - **Note/Problem:** Persiapan penyesuaian TOR KKN untuk minggu berikutnya.

---

## Minggu 2 (10 - 14 Agustus 2026)

### Senin, 10 Agustus 2026
1. **Task:** Mengikuti kegiatan lomba (WFH) dan koordinasi meet online tim projek.
   - **Note/Problem:** Fokus terbagi dengan agenda lomba, koordinasi projek dijaga melalui meet online.
2. **Task:** Memahami hasil pembahasan meet online & persiapan mapping role konteks KKN berdasarkan TOR.
   - **Note/Problem:** Pengumpulan bahan & dokumen TOR awal untuk analisis kebutuhan role KKN.

### Selasa, 11 Agustus 2026
1. **Task:** Mengikuti agenda lanjutan lomba (WFH).
   - **Note/Problem:** Tetap memantau pembaruan projek dari jauh via tim internal.
2. **Task:** Menganalisis dokumen PDF TOR sebagai acuan utama integrasi fitur KKN & Role Taskforce.
   - **Note/Problem:** Dokumen TOR cukup komprehensif, perlu ekstraksi poin-poin fitur prioritas.

### Rabu, 12 Agustus 2026
1. **Task:** Dispen kegiatan lomba / analisis mendalam dokumen TOR projek.
   - **Note/Problem:** Memerlukan konversi acuan TOR menjadi daftar fitur teknis frontend & backend.
2. **Task:** Merancang strategi pemetaan role & adaptasi requirement TOR ke dalam arsitektur aplikasi.
   - **Note/Problem:** Perlu penyesuaian hak akses tampilan UI sesuai batasan role di TOR.

### Kamis, 13 Agustus 2026
1. **Task:** Melakukan mapping role requirement secara detail (DPL, Taskforce, Pimpinan/Lurah/Camat).
   - **Note/Problem:** Menentukan batasan fungsional menu & aksi per role sesuai dokumen spec.
2. **Task:** Penyusunan spesifikasi mapping role fitur di dokumentasi projek (`docs/ROLE_MAPPING_FINAL.md`).
   - **Note/Problem:** Memastikan struktur menu navigasi sidebar selaras antar role.

### Jumat, 14 Agustus 2026
1. **Task:** Mapping role requirement & navigasi rute pengguna (DPL, Taskforce, dan Pimpinan/Lurah/Camat).
   - **Note/Problem:** Memastikan struktur navigasi dan pembatasan hak akses (read-only vs full access) sesuai spesifikasi TOR.
2. **Task:** Build & deployment pembaruan sistem ke server production (VPS Ubuntu via CI/CD GitHub Actions).
   - **Note/Problem:** Memastikan proses integrasi live berjalan stabil dan seluruh service backend/frontend terhubung lancar.
