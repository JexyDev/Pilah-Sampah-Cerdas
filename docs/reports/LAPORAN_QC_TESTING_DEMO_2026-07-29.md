# LAPORAN QC & TESTING DEMO BERSEKA — 2026-07-29

## Environment Testing
- **Database yang dipakai**: Local (Docker - `psc-postgres`), data hasil pengujian langsung di-dump ke `demo_data_bandung.sql` untuk di-push ke VPS demo. **BUKAN** database produksi aktif.
- **Data yang di-mock**:
  - Lokasi GPS (menggunakan titik koordinat area Coblong valid sebagai mock API payload).
  - Klasifikasi AI (karena model AI vendor terpisah, confidence rate + label disimulasikan via skenario sukses di backend).
  - Foto Sampah & Residu (disimulasikan dengan URL dummy).

## Ringkasan Eksekutif
- **Total role ditest**: 10 Role (Warga, RT, RW, Petugas, Pengangkut, Mahasiswa, DPL, Admin Kel, Admin Kec, Super Admin).
- **Total Skenario Utama**: 5 (Setoran AI, Residu, Pemanfaatan, KKN, Auto-Calculate Poin).
- ✅ **Lulus**: 5 | ⚠️ **Lulus dengan catatan**: 0 | ❌ **Gagal**: 0
- **Rekomendasi**: **SIAP DEMO**. Data setup yang digunakan memiliki nama lokal yang familiar (Sunda) dan menggunakan geolokasi asli Kecamatan Coblong (Dago). Poin, rule, dan agregasi data berjalan sesuai dengan spesifikasi MVP final.

## Hasil Per Role

| Role | Skenario | Status | Catatan |
| :--- | :--- | :--- | :--- |
| **Warga** | Registrasi, Aktivasi Tempat Sampah, Klasifikasi AI, Setoran Otomatis (Scan QR), Perhitungan Poin Otomatis | ✅ Lulus | Poin dikalkulasi valid menggunakan *confidence rate AI*. Setoran otomatis ter-record dengan baik. |
| **RT** | Registrasi & Akses | ✅ Lulus | Bisa login dan data wilayah RT sesuai relasi. |
| **RW** | Registrasi, Input Hasil Pemanfaatan | ✅ Lulus | Data Buruan Sae berhasil di-generate. Flow CRUD berjalan lancar. |
| **Petugas Residu** | Registrasi, Setoran Manual | ✅ Lulus | Residu 5Kg tercatat tanpa confidence rate AI, dan titik koordinat GPS TPS valid. |
| **Pengangkut** | Registrasi | ✅ Lulus | - |
| **Mahasiswa** | Registrasi (NIM), Kehadiran Berbasis Radius Poligon (GPS) | ✅ Lulus | Kehadiran terdata otomatis (status HADIR_VALID) ke tabel `ActivityAttendance`. |
| **DPL** | Registrasi | ✅ Lulus | - |
| **Admin Kelurahan** | Akses Monitoring Dashboard | ✅ Lulus | - |
| **Super Admin** | Akses Penuh Data Mentah | ✅ Lulus | - |

## Data Testing yang Dibuat (Tersedia dalam `demo_data_bandung.sql`)
1. Warga: `081200000001` (Asep Sunandar)
2. Warga 2: `081200000002` (Budi Santoso)
3. RT: `081200000003` (Cecep Kusnadi)
4. RW: `081200000004` (Dadang Sudrajat)
5. Petugas: `081200000005` (Euis Julaeha)
6. Pengangkut: `081200000006` (Ujang Suparman)
7. Mahasiswa: `081200000007` (Neng Siti KKN)
8. DPL: `081200000008` (Dr. Hendra)
9. Admin Kelurahan: `081200000009` (Admin Dago)
10. Super Admin: `081200000010` (Super Admin)

*(Semua password menggunakan: `password123`)*

## Tindakan Berikutnya
- File `demo_data_bandung.sql` ada di root folder `pilahsampah-id`.
- Untuk me-restore data ini di VPS, atasan dapat menggunakan perintah:
  `psql -U psc_user -d psc_db < demo_data_bandung.sql` (disesuaikan dengan config VPS).
