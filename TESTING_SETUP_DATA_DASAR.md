# SETUP DATA DASAR DEMO - KOTA BANDUNG (KECAMATAN COBLONG)

Data dasar telah berhasil disiapkan dan dimasukkan ke dalam database. Data ini merepresentasikan wilayah nyata di Kecamatan Coblong, Kota Bandung, beserta entitas yang mendukung seluruh alur sistem Trashcare.

## 1. Wilayah Administratif
- **Kelurahan yang tersedia**: Dago, Sekeloa, Lebak Gede, Lebak Siliwangi, Sadang Serang, Cipaganti
- **RW/RT Terdaftar (Fokus Demo di Dago)**:
  - RW 01 / RT 01 (Kelurahan Dago)
  - RW 01 / RT 02 (Kelurahan Dago)
  - RW 02 / RT 01 (Kelurahan Dago)

## 2. Kategori Sampah
- Organik (10 Poin/Kg)
- Anorganik (15 Poin/Kg)
- Residu (0 Poin/Kg)

## 3. Akun Pengguna Tersedia (Role Lengkap)
| Nama Asli (Dummy) | Role | No WA (Username) | Keterangan |
| :--- | :--- | :--- | :--- |
| Asep Sunandar | Warga | 081200000001 | Berdomisili di RW 01 Dago |
| Budi Santoso | Warga | 081200000002 | Berdomisili di RW 01 Dago |
| Cecep Kusnadi | RT | 081200000003 | Ketua RT 01 / RW 01 Dago |
| Dadang Sudrajat | RW | 081200000004 | Ketua RW 01 Dago |
| Euis Julaeha | Petugas Residu | 081200000005 | Ditugaskan di RW 01 Dago |
| Ujang Suparman | Pengangkut | 081200000006 | Akses Kota |
| Neng Siti KKN | Mahasiswa | 081200000007 | NIM: 12345678, Polygon: RW 01 Dago |
| Dr. Hendra | DPL | 081200000008 | DPL Neng Siti |
| Admin Dago | Admin Kelurahan | 081200000009 | Admin Kel. Dago |
| Super Admin | Super Admin | 081200000010 | Akses Penuh Sistem |

*Catatan: Semua password default untuk pengujian adalah `password123`.*

## 4. Fasilitas & Tong Sampah (Warga Asep Sunandar)
- **Tong Organik**: QR-ORG-DAGO-001 (Kapasitas 25L, Status: ACTIVE_BOUND)
- **Tong Anorganik**: QR-ANORG-DAGO-001 (Kapasitas 25L, Status: ACTIVE_BOUND)
- **Titik Koordinat**: Digenerate berdasarkan polygon Dago.

## 5. Simulasi Transaksi (End-to-End)
Script seeding telah berhasil melakukan simulasi aktivitas berikut:
1. **Setoran Otomatis Warga**: Asep Sunandar memindai 2,5 Kg Organik (AI Confidence 95%) dan 1,2 Kg Anorganik (AI Confidence 88%). Poin otomatis dihitung dengan tepat sesuai rumus `berat * confidence * poin_per_kg`.
2. **Setoran Manual Petugas**: Euis Julaeha mencatat 5,0 Kg residu di wilayah RW 01 Dago.
3. **Pemanfaatan Sampah**: Dadang Sudrajat (RW) mendaftarkan fasilitas "Buruan Sae" dan mencatat pengolahan 50 Kg sampah organik menjadi 20 Kg kompos.
4. **Kehadiran KKN**: Neng Siti disimulasikan hadir di "Sosialisasi Pemilahan Sampah" di Balai RW 01 Dago dengan GPS yang valid dan masuk poligon.

✅ **Status**: Database berhasil dikonfigurasi dan diekspor ke `demo_data_bandung.sql`. File ini siap dipush ke VPS untuk keperluan demo.
