# 📋 LAPORAN SIMULASI DRY-RUN: PERBAIKAN DATA HISTORIS PRESENSI KKN & PENARIKAN POIN

**Kepada Yth:** Tim QC, Tim Mobile, & Master/Lead Backend Developer  
**Tanggal Simulasi:** 21 September 2026  
**Lingkungan:** Basis Data Operasional Production VPS (`157.10.252.252` / `psc_db`)  
**Status Eksekusi:** **DRY-RUN (SIMULASI MURNI — 0 MUTASI DATABASE)**  

---

## 1. RINGKASAN EKSEKUTIF (EXECUTIVE SUMMARY)

Simulasi audit komprehensif telah dijalankan terhadap seluruh log kehadiran kegiatan KKN di database VPS untuk mendeteksi data yang terdampak penggelembungan durasi BUG-1 Auto-Checkout (sebelum commit `9d96c037`).

| Metrik Audit | Nilai Sebelum Migrasi | Nilai Setelah Migrasi (Proyeksi) | Keterangan |
|:---|:---:|:---:|:---|
| **Total Seluruh Sesi Presensi KKN** | `8372` | `8372` | Total sesi tidak berubah |
| **Sesi Hadir Selesai Diaudit** | `6461` | `6461` | Filter status `HADIR_MEMENUHI` & non-override DPL |
| **Sesi Sah & Memenuhi Target (≥ Target)** | `6.368` | `6.368` | **100% AMAN (Tidak disentuh)** |
| **Sesi Terdampak (< Target Durasi)** | **`89`** | **`0`** | Durasi palsu 240+ mnt dikembalikan ke durasi riil |
| **Status `HADIR_MEMENUHI`** | `6461` | **`6372`** | Berkurang 89 sesi (koreksi status) |
| **Status `HADIR_TIDAK_MEMENUHI`** | `450` | **`539`** | Bertambah 89 sesi (status jujur) |
| **Jumlah Mahasiswa Terdampak** | - | **`69` Mahasiswa** | Mahasiswa yang memiliki minimal 1 sesi palsu |
| **Total Poin Durasi Tidak Sah Ditarik** | - | **`-267 PTS`** | 89 sesi × 3 poin `KKN_DURASI_MEMENUHI` di-set ke 0 |

---

## 2. REKAPITULASI MAHASISWA YANG POINNYA AKAN DIKOREKSI (69 MAHASISWA)

Berikut adalah daftar mahasiswa yang saldo poinnya akan disesuaikan setelah verifikasi tim QC disetujui:

| No | Nama Mahasiswa | NIM | Kelompok KKN | Jml Sesi Terdampak | Poin Ditarik | Tanggal Sesi Terdampak |
|:---:|:---|:---:|:---|:---:|:---:|:---|
| 1 | **Nur Ain Salimah** | `10123049` | Kelompok 4 Lebak Gede | 4 | **-12 PTS** | 2026-08-31, 2026-09-09, 2026-09-16, 2026-09-19 |
| 2 | **Angga Adhya Pratama** | `10124119` | Kelompok 3 Sadang Serang | 3 | **-9 PTS** | 2026-08-28, 2026-08-31, 2026-09-01 |
| 3 | **Steven Cornelius** | `51923209` | Kelompok 1 Lebak Gede | 3 | **-9 PTS** | 2026-08-28, 2026-08-29, 2026-09-01 |
| 4 | **Ananda Fityan Syakur** | `10123024` | Kelompok 1 Lebak Gede | 2 | **-6 PTS** | 2026-08-28, 2026-08-29 |
| 5 | **Arasya Melandri Winardi** | `13024003` | Kelompok 2 Lebak Siliwangi | 2 | **-6 PTS** | 2026-08-28, 2026-09-01 |
| 6 | **Arif Hardyansyah** | `10123042` | Kelompok 1 Lebak Gede | 2 | **-6 PTS** | 2026-08-28, 2026-09-13 |
| 7 | **Aristyan Akhsan** | `51923197` | Kelompok 7 Sadang Serang | 2 | **-6 PTS** | 2026-09-04, 2026-09-10 |
| 8 | **Dea Michelya Alba** | `21124807` | Kelompok 3 Sadang Serang | 2 | **-6 PTS** | 2026-08-28, 2026-09-01 |
| 9 | **Ernest Tristan Rafael Siringoringo** | `10124469` | Kelompok 10 Sadang Serang | 2 | **-6 PTS** | 2026-08-31, 2026-09-01 |
| 10 | **Ferdinan Pasaribu** | `41724008` | Kelompok 4 Sekeloa | 2 | **-6 PTS** | 2026-08-31, 2026-09-20 |
| 11 | **Hana Husniyah** | `63824012` | Kelompok 1 Lebak Gede | 2 | **-6 PTS** | 2026-08-28, 2026-08-29 |
| 12 | **Malfin Jaffan Inggil Waskito** | `10124225` | Kelompok 1 Sadang Serang | 2 | **-6 PTS** | 2026-08-29, 2026-09-01 |
| 13 | **Muhammad Palda Satrio** | `10524144` | Kelompok 5 Sadang Serang | 2 | **-6 PTS** | 2026-09-01, 2026-09-04 |
| 14 | **Muhammad Rizky Laksana** | `10422009` | Kelompok 3 Sadang Serang | 2 | **-6 PTS** | 2026-09-01, 2026-09-05 |
| 15 | **Paguh Santoso** | `10420053` | Kelompok 1 Lebak Gede | 2 | **-6 PTS** | 2026-08-28, 2026-08-29 |
| 16 | **Tias Nurrohman Hidayat** | `10123053` | Kelompok 1 Lebak Gede | 2 | **-6 PTS** | 2026-08-28, 2026-09-01 |
| 17 | **Acef Testing** | `12345678` | Kelompok TEST | 1 | **-3 PTS** | 2026-09-14 |
| 18 | **Alya Rahmawati** | `10124143` | Kelompok 9 Sadang Serang | 1 | **-3 PTS** | 2026-09-01 |
| 19 | **Amelia Vega** | `10124307` | Kelompok 10 Sadang Serang | 1 | **-3 PTS** | 2026-09-01 |
| 20 | **Angga Adittya lrawan** | `13123013` | Kelompok 9 Sadang Serang | 1 | **-3 PTS** | 2026-09-01 |
| 21 | **Anugrah Rizky Agustian** | `21124805` | Kelompok 1 Sadang Serang | 1 | **-3 PTS** | 2026-08-29 |
| 22 | **Ariq Ghassan Fadhillah** | `21224047` | Kelompok 2 Dago | 1 | **-3 PTS** | 2026-09-02 |
| 23 | **Asep Saepul** | `10124324` | Kelompok 1 Sadang Serang | 1 | **-3 PTS** | 2026-08-29 |
| 24 | **Azzahra Fitri Ramadhanti Sutarso** | `51923211` | Kelompok 10 Sadang Serang | 1 | **-3 PTS** | 2026-09-01 |
| 25 | **Chistya Lamisa Balqis** | `44324072` | Kelompok 10 Sadang Serang | 1 | **-3 PTS** | 2026-08-31 |
| 26 | **Cindy Mega Amelia** | `31624006` | Kelompok 3 Sadang Serang | 1 | **-3 PTS** | 2026-09-01 |
| 27 | **Dewi Azra Tami** | `21224173` | Kelompok 2 Dago | 1 | **-3 PTS** | 2026-09-02 |
| 28 | **Dewi Handayani** | `31624009` | Kelompok 1 Lebak Gede | 1 | **-3 PTS** | 2026-08-29 |
| 29 | **Diwa** | `10124387` | Kelompok 2 Sadang Serang | 1 | **-3 PTS** | 2026-08-29 |
| 30 | **Elga Aulia Zamita Damopolii** | `31624002` | Kelompok 1 Cipaganti | 1 | **-3 PTS** | 2026-09-04 |
| 31 | **Eva Natalia Br. Sinurat** | `44324038` | Kelompok 4 Cipaganti | 1 | **-3 PTS** | 2026-09-12 |
| 32 | **Fadhil Muhammad Akram** | `10523016` | Kelompok 1 Lebak Siliwangi | 1 | **-3 PTS** | 2026-08-31 |
| 33 | **Faisal Syahrul Gufron** | `13024009` | Kelompok 1 Sadang Serang | 1 | **-3 PTS** | 2026-09-01 |
| 34 | **Farid Maulana Yusuf** | `10124288` | Kelompok 7 Sadang Serang | 1 | **-3 PTS** | 2026-09-04 |
| 35 | **Farsha Bilqis NurulHusna** | `51924013` | Kelompok 6 Sekeloa | 1 | **-3 PTS** | 2026-09-04 |
| 36 | **Fazlie Mawla Al Ammarik** | `10524113` | Kelompok 3 Sadang Serang | 1 | **-3 PTS** | 2026-09-01 |
| 37 | **Ghaida Nur Qolbi** | `21224172` | Kelompok 4 Dago | 1 | **-3 PTS** | 2026-09-09 |
| 38 | **Ginda Nugraha Pratama** | `10124274` | Kelompok 5 Sadang Serang | 1 | **-3 PTS** | 2026-09-06 |
| 39 | **Ivana Agustin Ragil Ayomi** | `21224072` | Kelompok 2 Dago | 1 | **-3 PTS** | 2026-09-02 |
| 40 | **Kayla Yusuf Sumantri** | `10124095` | Kelompok 4 Cipaganti | 1 | **-3 PTS** | 2026-09-04 |
| 41 | **Lion star sabolo gaho** | `41724013` | Kelompok 2 Lebak Siliwangi | 1 | **-3 PTS** | 2026-09-20 |
| 42 | **Mochammad Maliki Fadhlan Hasya** | `13024019` | Kelompok 2 Cipaganti | 1 | **-3 PTS** | 2026-09-11 |
| 43 | **Muhammad Farhan Rasyad** | `10524035` | Kelompok 3 Sekeloa | 1 | **-3 PTS** | 2026-09-01 |
| 44 | **Muhammad Ihram Noor Rasyad** | `13024012` | Kelompok 5 Sadang Serang | 1 | **-3 PTS** | 2026-09-06 |
| 45 | **Muhammad Iqbal Noor Iskandar** | `10123366` | Kelompok 6 Sekeloa | 1 | **-3 PTS** | 2026-09-04 |
| 46 | **Muhammad Rakha Ikhsan** | `10124336` | Kelompok 3 Sadang Serang | 1 | **-3 PTS** | 2026-09-01 |
| 47 | **Muhammad Rigan Marezka Permana** | `10124074` | Kelompok 3 Cipaganti | 1 | **-3 PTS** | 2026-09-04 |
| 48 | **Muhammad Rizki** | `10123030` | Kelompok 2 Lebak Siliwangi | 1 | **-3 PTS** | 2026-08-28 |
| 49 | **Muhammad Rizqi Ramadhani** | `21224174` | Kelompok 2 Dago | 1 | **-3 PTS** | 2026-09-02 |
| 50 | **Nadhira Aprillia** | `10123425` | Kelompok 6 Sekeloa | 1 | **-3 PTS** | 2026-09-04 |
| 51 | **Nasya Destianti** | `21224053` | Kelompok 2 Dago | 1 | **-3 PTS** | 2026-09-02 |
| 52 | **Naufal Akbar Subarna** | `13124023` | Kelompok 3 Lebak Siliwangi | 1 | **-3 PTS** | 2026-09-20 |
| 53 | **Niko Adrian Farizi** | `13025028` | Kelompok 7 Sadang Serang | 1 | **-3 PTS** | 2026-09-04 |
| 54 | **Nova fitriana** | `21124801` | Kelompok 2 Cipaganti | 1 | **-3 PTS** | 2026-09-11 |
| 55 | **Panji Gumilang** | `10124071` | Kelompok 1 Cipaganti | 1 | **-3 PTS** | 2026-09-20 |
| 56 | **Raditya Muhammad Alghifary** | `10124150` | Kelompok 10 Sadang Serang | 1 | **-3 PTS** | 2026-09-01 |
| 57 | **Radja Alkahfi Siregar** | `10124354` | Kelompok 11 Sadang Serang | 1 | **-3 PTS** | 2026-09-19 |
| 58 | **Raja Maudia Farhan** | `13022002` | Kelompok 1 Lebak Gede | 1 | **-3 PTS** | 2026-08-28 |
| 59 | **Raka Habibi Putra Budi** | `51924029` | Kelompok 3 Sadang Serang | 1 | **-3 PTS** | 2026-09-01 |
| 60 | **Regita Setiani** | `10124239` | Kelompok 3 Sadang Serang | 1 | **-3 PTS** | 2026-09-01 |
| 61 | **Rilva Muhammad Akbar** | `10323001` | Kelompok 3 Sadang Serang | 1 | **-3 PTS** | 2026-09-01 |
| 62 | **Riska Aprilia** | `63724017` | Kelompok 3 Sadang Serang | 1 | **-3 PTS** | 2026-09-01 |
| 63 | **Risna Dwi Putera** | `13024023` | Kelompok 1 Cipaganti | 1 | **-3 PTS** | 2026-09-04 |
| 64 | **Selfy Oktapiani Permana** | `10524131` | Kelompok 11 Sadang Serang | 1 | **-3 PTS** | 2026-08-31 |
| 65 | **Shafira Nurazizah Baeha** | `51923704` | Kelompok 1 Lebak Siliwangi | 1 | **-3 PTS** | 2026-08-31 |
| 66 | **Siti Marhamah** | `10124175` | Kelompok 3 Sadang Serang | 1 | **-3 PTS** | 2026-09-01 |
| 67 | **Sucipto Makalalag** | `10523193` | Kelompok 3 Lebak Gede | 1 | **-3 PTS** | 2026-09-02 |
| 68 | **Viki Ayu Armaita** | `21124806` | Kelompok 3 Sekeloa | 1 | **-3 PTS** | 2026-08-31 |
| 69 | **Yoan Ready Syavera** | `10123015` | Kelompok 3 Lebak Gede | 1 | **-3 PTS** | 2026-09-03 |

---

## 3. DAFTAR LENGKAP 89 SESI PRESENSI YANG AKAN DI-UPDATE

Tabel berikut mencantumkan seluruh baris data presensi mentah beserta nilai sebelum dan sesudah koreksi:

| No | Mahasiswa | NIM | Kelompok | Tanggal | Jam Masuk | Jam Pulang | Durasi Lama | Durasi Riil | Target | Status Lama → Baru | ID Transaksi Poin (Set 0) |
|:---:|:---|:---:|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---|:---|
| 1 | Ananda Fityan Syakur | `10123024` | Kelompok 1 Lebak Gede | 2026-08-28 | 10:41 | 11:18 | 259 mnt | **36 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `0d8a8b07-b217-4861-b833-2c58af66a85d` (-3 PTS) |
| 2 | Hana Husniyah | `63824012` | Kelompok 1 Lebak Gede | 2026-08-28 | 10:42 | 11:21 | 301 mnt | **39 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `01d785b4-01db-4b06-bc89-648d8b548d0b` (-3 PTS) |
| 3 | Arif Hardyansyah | `10123042` | Kelompok 1 Lebak Gede | 2026-08-28 | 10:42 | 11:31 | 335 mnt | **48 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `15b2b76d-a95d-4bea-876c-7b63a135bf4e` (-3 PTS) |
| 4 | Tias Nurrohman Hidayat | `10123053` | Kelompok 1 Lebak Gede | 2026-08-28 | 10:44 | 11:52 | 480 mnt | **67 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `57c4e7ec-e154-4579-842e-92d8d0495231` (-3 PTS) |
| 5 | Steven Cornelius | `51923209` | Kelompok 1 Lebak Gede | 2026-08-28 | 10:45 | 11:45 | 425 mnt | **60 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `634b1643-72d1-4212-a22f-a36e022bea36` (-3 PTS) |
| 6 | Muhammad Rizki | `10123030` | Kelompok 2 Lebak Siliwangi | 2026-08-28 | 10:52 | 12:06 | 480 mnt | **74 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `2a5cb86c-e860-4dfc-9c7d-d7f24a96942d` (-3 PTS) |
| 7 | Arasya Melandri Winardi | `13024003` | Kelompok 2 Lebak Siliwangi | 2026-08-28 | 11:26 | 11:36 | 268 mnt | **9 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `937af9d4-691b-4d27-a0ef-4e7afdf5d163` (-3 PTS) |
| 8 | Paguh Santoso | `10420053` | Kelompok 1 Lebak Gede | 2026-08-28 | 11:33 | 11:45 | 317 mnt | **11 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `0aa95168-5d49-4a49-813f-2445eb4ffee4` (-3 PTS) |
| 9 | Raja Maudia Farhan | `13022002` | Kelompok 1 Lebak Gede | 2026-08-28 | 12:06 | 12:18 | 382 mnt | **11 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `51764e3e-9179-466a-afe2-937677772745` (-3 PTS) |
| 10 | Angga Adhya Pratama | `10124119` | Kelompok 3 Sadang Serang | 2026-08-28 | 12:29 | 15:12 | 480 mnt | **162 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `f9ad53b7-2ade-4e61-9bcc-99372d123596` (-3 PTS) |
| 11 | Dea Michelya Alba | `21124807` | Kelompok 3 Sadang Serang | 2026-08-28 | 13:33 | 16:00 | 378 mnt | **146 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `0e4c8f00-d9d0-4676-83c2-4d6080185ed1` (-3 PTS) |
| 12 | Malfin Jaffan Inggil Waskito | `10124225` | Kelompok 1 Sadang Serang | 2026-08-29 | 10:10 | 13:49 | 14 mnt | **218 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `df56b937-19eb-43cc-a05e-23dc99f7032d` (-3 PTS) |
| 13 | Anugrah Rizky Agustian | `21124805` | Kelompok 1 Sadang Serang | 2026-08-29 | 10:17 | 13:52 | 35 mnt | **214 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `a722e12f-cd40-4a76-b4bd-efaf5ccc3fc9` (-3 PTS) |
| 14 | Paguh Santoso | `10420053` | Kelompok 1 Lebak Gede | 2026-08-29 | 10:26 | 10:36 | 312 mnt | **9 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `286c0f30-d70b-4254-bc03-196bfb2cfe96` (-3 PTS) |
| 15 | Diwa | `10124387` | Kelompok 2 Sadang Serang | 2026-08-29 | 13:14 | 13:58 | 9 mnt | **43 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `d8281428-1713-4074-afa1-2e195ee39ca2` (-3 PTS) |
| 16 | Dewi Handayani | `31624009` | Kelompok 1 Lebak Gede | 2026-08-29 | 13:21 | 13:50 | 28 mnt | **28 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `f05b2342-4042-4c2c-9276-ed9cb088074f` (-3 PTS) |
| 17 | Hana Husniyah | `63824012` | Kelompok 1 Lebak Gede | 2026-08-29 | 13:21 | 13:48 | 26 mnt | **26 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `4ab3ef19-99cc-4672-bc57-aef76a6d9707` (-3 PTS) |
| 18 | Ananda Fityan Syakur | `10123024` | Kelompok 1 Lebak Gede | 2026-08-29 | 13:45 | 13:53 | 7 mnt | **7 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `8ef556f7-2197-4512-be1e-43d500679b27` (-3 PTS) |
| 19 | Steven Cornelius | `51923209` | Kelompok 1 Lebak Gede | 2026-08-29 | 13:47 | 14:08 | 6 mnt | **21 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `7d6611fd-c402-49a4-890b-7bf98d985eca` (-3 PTS) |
| 20 | Asep Saepul | `10124324` | Kelompok 1 Sadang Serang | 2026-08-29 | 13:58 | 14:05 | 6 mnt | **6 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `40d1c048-82f6-4386-a2a4-b0a02080e926` (-3 PTS) |
| 21 | Angga Adhya Pratama | `10124119` | Kelompok 3 Sadang Serang | 2026-08-31 | 07:58 | 11:27 | 480 mnt | **208 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `402e4dd2-c6d9-4605-89b1-99b53d06e527` (-3 PTS) |
| 22 | Shafira Nurazizah Baeha | `51923704` | Kelompok 1 Lebak Siliwangi | 2026-08-31 | 08:04 | 13:59 | 320 mnt | **138 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `7679eac2-1893-4dbf-a8b4-2b7b4f5cfbb1` (-3 PTS) |
| 23 | Nur Ain Salimah | `10123049` | Kelompok 4 Lebak Gede | 2026-08-31 | 08:04 | 08:18 | 333 mnt | **13 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `31c6bc45-9f08-4ac0-82f5-678c5fadb9de` (-3 PTS) |
| 24 | Ernest Tristan Rafael Siringoringo | `10124469` | Kelompok 10 Sadang Serang | 2026-08-31 | 08:17 | 10:45 | 326 mnt | **147 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `a21da919-2436-40ad-bb7e-67cf92146be7` (-3 PTS) |
| 25 | Selfy Oktapiani Permana | `10524131` | Kelompok 11 Sadang Serang | 2026-08-31 | 08:25 | 16:00 | 366 mnt | **219 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `028b1e78-8f40-48bf-a0f8-068765acc182` (-3 PTS) |
| 26 | Chistya Lamisa Balqis | `44324072` | Kelompok 10 Sadang Serang | 2026-08-31 | 09:16 | 10:06 | 463 mnt | **49 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `c130dcd5-210f-4289-9853-60fb792f5099` (-3 PTS) |
| 27 | Fadhil Muhammad Akram | `10523016` | Kelompok 1 Lebak Siliwangi | 2026-08-31 | 09:16 | 09:49 | 480 mnt | **33 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `f3b579fb-55e2-4449-9bcb-0954180b9156` (-3 PTS) |
| 28 | Ferdinan Pasaribu | `41724008` | Kelompok 4 Sekeloa | 2026-08-31 | 10:08 | 13:14 | 438 mnt | **186 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `2d8f8bda-94f7-4b5f-bfc1-e16b784f2d93` (-3 PTS) |
| 29 | Viki Ayu Armaita | `21124806` | Kelompok 3 Sekeloa | 2026-08-31 | 11:10 | 13:29 | 391 mnt | **138 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `769d9494-19ae-4a90-9f31-cb9b433db98b` (-3 PTS) |
| 30 | Azzahra Fitri Ramadhanti Sutarso | `51923211` | Kelompok 10 Sadang Serang | 2026-09-01 | 07:07 | 08:00 | 52 mnt | **42 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `f72f76a0-8988-4134-bf26-29ea7209d0aa` (-3 PTS) |
| 31 | Raditya Muhammad Alghifary | `10124150` | Kelompok 10 Sadang Serang | 2026-09-01 | 07:08 | 08:16 | 67 mnt | **58 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `771120a8-2dba-4108-838c-03dd6d43c264` (-3 PTS) |
| 32 | Amelia Vega | `10124307` | Kelompok 10 Sadang Serang | 2026-09-01 | 07:08 | 08:08 | 59 mnt | **36 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `da9ce537-1ddf-4c2d-aa71-591450c71560` (-3 PTS) |
| 33 | Ernest Tristan Rafael Siringoringo | `10124469` | Kelompok 10 Sadang Serang | 2026-09-01 | 07:09 | 08:20 | 71 mnt | **22 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `f06bad8f-1d2b-45c1-bb39-f8d9c0a12e9d` (-3 PTS) |
| 34 | Arasya Melandri Winardi | `13024003` | Kelompok 2 Lebak Siliwangi | 2026-09-01 | 07:25 | 08:49 | 83 mnt | **19 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `303ce97c-d0fc-4167-bc3f-c87ba292ac88` (-3 PTS) |
| 35 | Raka Habibi Putra Budi | `51924029` | Kelompok 3 Sadang Serang | 2026-09-01 | 07:58 | 16:00 | 482 mnt | **84 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `32049d3b-333a-4cc5-b02d-a4c8e163171d` (-3 PTS) |
| 36 | Riska Aprilia | `63724017` | Kelompok 3 Sadang Serang | 2026-09-01 | 07:59 | 16:00 | 481 mnt | **230 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `8084f37a-9493-4e36-a2d2-f36a30b59e13` (-3 PTS) |
| 37 | Tias Nurrohman Hidayat | `10123053` | Kelompok 1 Lebak Gede | 2026-09-01 | 08:00 | 13:11 | 241 mnt | **188 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `5c444e19-435f-47c9-9913-bc3e2ddeb2a0` (-3 PTS) |
| 38 | Muhammad Farhan Rasyad | `10524035` | Kelompok 3 Sekeloa | 2026-09-01 | 08:01 | 15:54 | 278 mnt | **221 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `29ad3505-ade3-48d9-8f0e-6636360d65c5` (-3 PTS) |
| 39 | Angga Adhya Pratama | `10124119` | Kelompok 3 Sadang Serang | 2026-09-01 | 08:07 | 15:32 | 445 mnt | **166 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `b886b65a-a988-49ac-922d-023792422815` (-3 PTS) |
| 40 | Fazlie Mawla Al Ammarik | `10524113` | Kelompok 3 Sadang Serang | 2026-09-01 | 08:07 | 16:00 | 473 mnt | **88 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `57890f31-7a47-4463-ac14-74c3dc6c40ca` (-3 PTS) |
| 41 | Rilva Muhammad Akbar | `10323001` | Kelompok 3 Sadang Serang | 2026-09-01 | 08:25 | 16:00 | 455 mnt | **238 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `2e831528-d25d-4bdb-a5a4-82405a4ba4b1` (-3 PTS) |
| 42 | Regita Setiani | `10124239` | Kelompok 3 Sadang Serang | 2026-09-01 | 08:26 | 16:00 | 454 mnt | **92 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `d80370de-56ad-4d70-bc60-b202a285ec00` (-3 PTS) |
| 43 | Muhammad Rizky Laksana | `10422009` | Kelompok 3 Sadang Serang | 2026-09-01 | 08:26 | 16:00 | 454 mnt | **95 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `c3144c53-9989-4d06-b228-48702812c11a` (-3 PTS) |
| 44 | Alya Rahmawati | `10124143` | Kelompok 9 Sadang Serang | 2026-09-01 | 08:26 | 08:46 | 19 mnt | **9 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `d696f2a4-a497-4275-a480-7f16ada0914e` (-3 PTS) |
| 45 | Dea Michelya Alba | `21124807` | Kelompok 3 Sadang Serang | 2026-09-01 | 08:27 | 16:00 | 453 mnt | **83 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `9187620e-0096-4e69-81ba-5c0a47fff094` (-3 PTS) |
| 46 | Faisal Syahrul Gufron | `13024009` | Kelompok 1 Sadang Serang | 2026-09-01 | 08:29 | 14:09 | 266 mnt | **231 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `cd6b3fe0-4dae-498d-aaa7-56a392d0190e` (-3 PTS) |
| 47 | Steven Cornelius | `51923209` | Kelompok 1 Lebak Gede | 2026-09-01 | 08:30 | 15:10 | 242 mnt | **233 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `5f426f3c-8fa7-4af9-9adf-48371d0390ad` (-3 PTS) |
| 48 | Siti Marhamah | `10124175` | Kelompok 3 Sadang Serang | 2026-09-01 | 08:33 | 15:27 | 414 mnt | **90 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `ee839dda-c0ca-4864-874a-b3acdee8689f` (-3 PTS) |
| 49 | Malfin Jaffan Inggil Waskito | `10124225` | Kelompok 1 Sadang Serang | 2026-09-01 | 08:36 | 16:00 | 245 mnt | **200 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `2716c0fb-f634-43cf-b685-28bfb9ed5138` (-3 PTS) |
| 50 | Muhammad Rakha Ikhsan | `10124336` | Kelompok 3 Sadang Serang | 2026-09-01 | 08:37 | 15:56 | 243 mnt | **203 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `5ce21035-03d6-47b8-a258-5f370b759c39` (-3 PTS) |
| 51 | Angga Adittya lrawan | `13123013` | Kelompok 9 Sadang Serang | 2026-09-01 | 08:41 | 14:40 | 240 mnt | **215 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `d5dc96d4-f5d8-4c03-9559-c243b4890cce` (-3 PTS) |
| 52 | Cindy Mega Amelia | `31624006` | Kelompok 3 Sadang Serang | 2026-09-01 | 10:39 | 16:00 | 321 mnt | **19 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `3cbec61e-b8c4-4466-885a-df3a3a806de8` (-3 PTS) |
| 53 | Muhammad Palda Satrio | `10524144` | Kelompok 5 Sadang Serang | 2026-09-01 | 10:50 | 15:38 | 241 mnt | **232 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `8651d497-fee6-49f9-8290-22b3d207728b` (-3 PTS) |
| 54 | Sucipto Makalalag | `10523193` | Kelompok 3 Lebak Gede | 2026-09-02 | 11:00 | 14:00 | 180 mnt | **180 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `37b66237-f63d-4d93-a91b-4eaabff96e7d` (-3 PTS) |
| 55 | Muhammad Rizqi Ramadhani | `21224174` | Kelompok 2 Dago | 2026-09-02 | 12:35 | 15:36 | 240 mnt | **180 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `01505679-10f7-487a-b726-aa08a8141897` (-3 PTS) |
| 56 | Dewi Azra Tami | `21224173` | Kelompok 2 Dago | 2026-09-02 | 12:50 | 16:00 | 240 mnt | **190 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `370b3b93-10af-4ce6-b914-13ea45b3e056` (-3 PTS) |
| 57 | Nasya Destianti | `21224053` | Kelompok 2 Dago | 2026-09-02 | 12:56 | 16:11 | 240 mnt | **195 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `04b7765a-3dea-4058-8948-f8f29a197c88` (-3 PTS) |
| 58 | Ivana Agustin Ragil Ayomi | `21224072` | Kelompok 2 Dago | 2026-09-02 | 12:57 | 16:14 | 240 mnt | **196 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `ded6d949-4234-440c-8d54-6b880e5fe43e` (-3 PTS) |
| 59 | Ariq Ghassan Fadhillah | `21224047` | Kelompok 2 Dago | 2026-09-02 | 13:15 | 16:11 | 240 mnt | **175 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `5d1efd85-7826-4770-9161-91fa2f295f0b` (-3 PTS) |
| 60 | Yoan Ready Syavera | `10123015` | Kelompok 3 Lebak Gede | 2026-09-03 | 08:20 | 15:08 | 408 mnt | **236 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `08e44904-4d3d-442b-a723-604e831d42d9` (-3 PTS) |
| 61 | Kayla Yusuf Sumantri | `10124095` | Kelompok 4 Cipaganti | 2026-09-04 | 09:25 | 13:00 | 215 mnt | **215 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `923af9d7-65a7-4857-a99d-eae9fd536449` (-3 PTS) |
| 62 | Muhammad Palda Satrio | `10524144` | Kelompok 5 Sadang Serang | 2026-09-04 | 10:11 | 18:00 | 240 mnt | **217 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `7ca3a2ec-c27b-4196-ba8a-6b9d1d65aa96` (-3 PTS) |
| 63 | Farsha Bilqis NurulHusna | `51924013` | Kelompok 6 Sekeloa | 2026-09-04 | 14:09 | 18:00 | 240 mnt | **230 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `9b1403fa-210e-4ffd-94de-245b1ffea44b` (-3 PTS) |
| 64 | Muhammad Iqbal Noor Iskandar | `10123366` | Kelompok 6 Sekeloa | 2026-09-04 | 14:10 | 18:00 | 240 mnt | **229 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `78aeaa69-429a-48ee-aa65-9517aa45b00d` (-3 PTS) |
| 65 | Risna Dwi Putera | `13024023` | Kelompok 1 Cipaganti | 2026-09-04 | 14:18 | 18:00 | 240 mnt | **221 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `5859d523-a6c7-481d-a8ff-1d6217b3cf1c` (-3 PTS) |
| 66 | Nadhira Aprillia | `10123425` | Kelompok 6 Sekeloa | 2026-09-04 | 14:43 | 18:00 | 240 mnt | **196 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `56c8063e-7511-4418-a354-285338a4dbfe` (-3 PTS) |
| 67 | Elga Aulia Zamita Damopolii | `31624002` | Kelompok 1 Cipaganti | 2026-09-04 | 14:47 | 18:19 | 240 mnt | **212 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `bff37cc3-8ed3-4d36-9636-2c031b8541d2` (-3 PTS) |
| 68 | Farid Maulana Yusuf | `10124288` | Kelompok 7 Sadang Serang | 2026-09-04 | 15:29 | 18:04 | 240 mnt | **155 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `25ec9428-bd87-4508-a49f-cf28cc976455` (-3 PTS) |
| 69 | Niko Adrian Farizi | `13025028` | Kelompok 7 Sadang Serang | 2026-09-04 | 15:29 | 18:00 | 240 mnt | **150 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `b18de66f-5264-432a-981d-6fc0a29b728e` (-3 PTS) |
| 70 | Aristyan Akhsan | `51923197` | Kelompok 7 Sadang Serang | 2026-09-04 | 15:31 | 18:00 | 240 mnt | **148 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `be608e3c-a1bc-4bd1-b575-5194161bb9af` (-3 PTS) |
| 71 | Muhammad Rigan Marezka Permana | `10124074` | Kelompok 3 Cipaganti | 2026-09-04 | 17:26 | 18:00 | 240 mnt | **33 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `8c194144-60ae-4280-a9c1-684f6ca68c69` (-3 PTS) |
| 72 | Muhammad Rizky Laksana | `10422009` | Kelompok 3 Sadang Serang | 2026-09-05 | 18:25 | 20:00 | 240 mnt | **94 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `bda7fe52-2442-41e6-90b0-177ab4e255f5` (-3 PTS) |
| 73 | Muhammad Ihram Noor Rasyad | `13024012` | Kelompok 5 Sadang Serang | 2026-09-06 | 16:25 | 20:00 | 240 mnt | **214 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `cb722afc-a83d-41d1-90c2-5c0e8ef6d0f4` (-3 PTS) |
| 74 | Ginda Nugraha Pratama | `10124274` | Kelompok 5 Sadang Serang | 2026-09-06 | 19:53 | 20:00 | 240 mnt | **6 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `ce3da2d9-0282-4507-8a57-781b09ecf05b` (-3 PTS) |
| 75 | Nur Ain Salimah | `10123049` | Kelompok 4 Lebak Gede | 2026-09-09 | 08:19 | 20:00 | 240 mnt | **203 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `63933fd2-7c51-400e-8468-560701fb8c08` (-3 PTS) |
| 76 | Ghaida Nur Qolbi | `21224172` | Kelompok 4 Dago | 2026-09-09 | 10:10 | 20:00 | 240 mnt | **224 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `992c4ad0-bc9e-4305-bb07-f1537492ae48` (-3 PTS) |
| 77 | Aristyan Akhsan | `51923197` | Kelompok 7 Sadang Serang | 2026-09-10 | 17:07 | 20:00 | 240 mnt | **172 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `ec17fa47-f869-4ad2-906e-0291ba9fe2fd` (-3 PTS) |
| 78 | Nova fitriana | `21124801` | Kelompok 2 Cipaganti | 2026-09-11 | 16:00 | 20:00 | 240 mnt | **239 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `dce36ddf-7a9d-4f23-a6b5-e927de72aafd` (-3 PTS) |
| 79 | Mochammad Maliki Fadhlan Hasya | `13024019` | Kelompok 2 Cipaganti | 2026-09-11 | 18:09 | 20:00 | 240 mnt | **110 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `9f24adc5-86fe-429a-9295-1fffb3c0984c` (-3 PTS) |
| 80 | Eva Natalia Br. Sinurat | `44324038` | Kelompok 4 Cipaganti | 2026-09-12 | 13:50 | 20:00 | 240 mnt | **143 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `2da89608-37d6-465c-ae25-639a2b067978` (-3 PTS) |
| 81 | Arif Hardyansyah | `10123042` | Kelompok 1 Lebak Gede | 2026-09-13 | 16:33 | 20:00 | 240 mnt | **206 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `0a87bf6c-8134-404b-9369-bb3d4c2a4fe2` (-3 PTS) |
| 82 | Acef Testing | `12345678` | Kelompok TEST | 2026-09-14 | 09:53 | 20:00 | 240 mnt | **182 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `7b2b2c45-c48e-47d1-b149-35dcf8ecee7a` (-3 PTS) |
| 83 | Nur Ain Salimah | `10123049` | Kelompok 4 Lebak Gede | 2026-09-16 | 16:06 | 20:00 | 240 mnt | **233 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `24a2208b-95f8-4ba3-ab8a-945aee82caca` (-3 PTS) |
| 84 | Radja Alkahfi Siregar | `10124354` | Kelompok 11 Sadang Serang | 2026-09-19 | 16:58 | 20:00 | 240 mnt | **181 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `bc0dddc7-1473-4c79-8686-74485faf65dd` (-3 PTS) |
| 85 | Nur Ain Salimah | `10123049` | Kelompok 4 Lebak Gede | 2026-09-19 | 19:45 | 20:00 | 240 mnt | **14 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `e3e4a1cc-6c11-4e82-853d-ec5ead63f7f9` (-3 PTS) |
| 86 | Ferdinan Pasaribu | `41724008` | Kelompok 4 Sekeloa | 2026-09-20 | 16:10 | 20:00 | 240 mnt | **229 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `2dff8e43-2a8f-4fa2-a790-27542bd0bab9` (-3 PTS) |
| 87 | Panji Gumilang | `10124071` | Kelompok 1 Cipaganti | 2026-09-20 | 16:25 | 20:00 | 240 mnt | **214 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `828663f7-7392-4780-91ff-a251daac1639` (-3 PTS) |
| 88 | Lion star sabolo gaho | `41724013` | Kelompok 2 Lebak Siliwangi | 2026-09-20 | 17:11 | 20:00 | 240 mnt | **168 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `c3d5737e-b98f-4337-a6fd-cb9af1f4af1a` (-3 PTS) |
| 89 | Naufal Akbar Subarna | `13124023` | Kelompok 3 Lebak Siliwangi | 2026-09-20 | 19:50 | 20:00 | 240 mnt | **9 mnt** | 240 mnt | `HADIR_MEMENUHI` → `HADIR_TIDAK_MEMENUHI` | `fb5df69a-f76f-4d00-a086-629eac6adc66` (-3 PTS) |

---

## 4. BUKTI KOREKSI ANOMALI KELOMPOK 1 SADANG SERANG

Dua kasus penting pada Kelompok 1 Sadang Serang yang sempat menjadi tanda tanya pada audit manual Tim QC:

1. **Anugrah Rizky Agustian (`21124805`) pada 29 Agustus 2026**:
   - **Data Asli**: Check-in 10:17 WIB, Check-out 13:52 WIB (Durasi Riil: 214 Menit < Target 240 Menit).
   - **Kondisi Sebelum**: Status tersimpan `HADIR_MEMENUHI` dan mendapatkan poin +3 PTS.
   - **Hasil Koreksi**: Status diubah ke `HADIR_TIDAK_MEMENUHI`, durasi tercatat 214 menit, dan poin +3 PTS ditarik (-3 PTS). Saldo Anugrah terkoreksi dari 154 PTS menjadi 151 PTS (Tepat identik dengan hitungan manual QC: 151 PTS!).

2. **Malfin Jaffan Inggil Waskito (`10124225`) pada 29 Agustus 2026**:
   - **Data Asli**: Check-in 10:10 WIB, Check-out 13:49 WIB (Durasi Riil: 218 Menit < Target 240 Menit).
   - **Hasil Koreksi**: Status diubah ke `HADIR_TIDAK_MEMENUHI`, durasi tercatat 218 menit, dan poin +3 PTS ditarik (-3 PTS).

## 5. REKOMENDASI & LANGKAH SELANJUTNYA

1. **Review Tim Mobile & QC**: Mohon tim Mobile & QC membandingkan daftar 89 sesi dan 69 mahasiswa di atas dengan catatan manual tim.
2. **Eksekusi Update**: Setelah konfirmasi persetujuan dari QC, migration script resmi `node scripts/vps/migrate_historical_presensi_durasi_vps.cjs --commit` akan dijalankan di database VPS dengan proteksi **Golden Backup** mandatori.
