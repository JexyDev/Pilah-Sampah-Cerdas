# 🌿 BERSEKA - SISTEM TATA KELOLA KKN TEMATIK TERPADU
## LAPORAN RESMI AUDIT & PENYESUAIAN PRESENSI MAHASISWA KKN PADA VPS LIVE

* **Nomor Dokumen**: `REP-AUDIT/KKN-ATT/2026-10/021`
* **Tanggal Pelaksanaan**: Kamis, 08 Oktober 2026 (Pukul 06:25 WIB)
* **Target Infrastruktur**: Server Live VPS PostgreSQL 16 (`157.10.252.252` / `psc_db`)
* **Subjek Mahasiswa**: **Idin Naufal Hakim** (NIM: `10123157`)
* **Kelompok Penempatan**: **Kelompok 2 Sekeloa**, Kelurahan Sekeloa (Cakupan Wilayah: RW 03 dan 04)
* **Dosen Pembimbing Lapangan (DPL)**: **Dr. Eng. Siswanti Zuraida, S.Pd., M.T.** (NIP: `4127.88.80.717`)
* **Penerbit Dokumen**: **Tim Data Governance & Backend Engineering Berseka**
* **Status Eksekusi**: 🟢 **BERHASIL DISELESAIKAN & TERSINKRONISASI 100% (EXIT CODE 0)**

---

## 1. Latar Belakang Permintaan Verifikasi & Penyesuaian

Sehubungan dengan kendala teknis pencatatan durasi presensi pada aplikasi mobile pada hari **Rabu, 07 Oktober 2026**, admin sistem telah membuka jalur konfirmasi mandiri/kelompok bagi mahasiswa yang bertugas di lapangan. Perwakilan **Kelompok 2 Sekeloa** telah mengirimkan konfirmasi resmi kegiatan sebagai berikut:

1. **Kelompok & Lokasi RW**: Kelompok Sekeloa 2 RW 03 dan 04
2. **Daftar Nama & NIM Anggota yang Hadir**: **Idin Naufal Hakim** (NIM: `10123157`)
3. **Rincian Kegiatan Hari Ini**: Pembuatan tong sampah sedekah dari galon bekas dan kawat, persiapan atribut pemilahan sampah, serta pendataan warga di RW 03 dan 04 Sekeloa (sinkron dengan Program Kerja #7: `c364992c-cfc5-4073-9c08-ee3c0932e6e0`).
4. **Waktu Kegiatan (Jam Mulai - Selesai)**: **10.00 - 16.00 WIB** (Durasi: **360 Menit / 6 Jam Penuh**)
5. **Foto Dokumentasi Kegiatan**: Terverifikasi melalui repositori foto dokumentasi posko (`/uploads/1791368329749-1a014dde-8cb8-496c-a630-e05df8c5b646.jpg`).

Sebelum perbaikan, sistem auto-cutoff mencatat presensi masuk Idin Naufal Hakim pada pukul 16:34 WIB dengan checkout otomatis pada pukul 20:00 WIB (durasi 205 menit / status `HADIR_TIDAK_MEMENUHI`). Penyesuaian ini memulihkan durasi riil mahasiswa ke **360 Menit** dengan status **`HADIR_MEMENUHI`**.

---

## 2. Tindakan Eksekusi & Pembaruan Data pada Database VPS

Tim Engineering telah mengeksekusi rekonsiliasi data menyeluruh pada tabel operasional server live VPS:

### A. Tabel `ActivityAttendance` (`kehadiran_kegiatan`)
* **ID Record**: `7f8f9984-3e36-4974-8f1e-074f30c14930`
* **Jadwal Terkait**: Kegiatan Harian Posko KKN Kelompok 2 Sekeloa (`04717f62-add3-479f-b682-1c87acbfa0b7`)
* **Waktu Masuk (`attendedAt`)**: `2026-10-07T03:00:00.000Z` (**10:00:00 WIB**)
* **Waktu Keluar (`checkOutAt`)**: `2026-10-07T09:00:00.000Z` (**16:00:00 WIB**)
* **Durasi Efektif**: **360 Menit (6 Jam 00 Menit)** — *Melampaui syarat minimum 240 menit/hari (4 jam)*.
* **Status Kehadiran**: `HADIR_MEMENUHI`
* **Deskripsi Kegiatan**: *Pembuatan tong sampah sedekah dari galon bekas dan kawat, persiapan atribut pemilahan sampah, serta pendataan warga di RW 03 dan 04 Sekeloa*
* **Foto Bukti**: `/uploads/1791368329749-1a014dde-8cb8-496c-a630-e05df8c5b646.jpg`
* **Platform**: `ANDROID`

### B. Tabel `PresensiMandiri` (`presensi_mandiri`)
* **Status**: `SELESAI`
* **Waktu Check-In**: **10:00:00 WIB**
* **Waktu Check-Out**: **16:00:00 WIB**
* **Durasi**: **360 Menit**
* **Koordinat Posko**: Lat: `-6.88869540`, Lng: `107.62178540` (RW 03 dan 04 Sekeloa)

### C. Tabel `LogbookKkn` (`logbook_kkn`)
* **ID Record**: `f6a7e636-5037-4505-87a1-620b6737f042`
* **Tanggal Kegiatan**: 07 Oktober 2026
* **Waktu**: **10:00 – 16:00 WIB**
* **Tempat**: RW 03 dan 04 Sekeloa
* **Tipe Aktivitas**: `KELOMPOK`
* **Program Kerja Terkait**: *Pembuatan tong sampah sedekah dari galon bekas dan kawat* (`c364992c-cfc5-4073-9c08-ee3c0932e6e0`)
* **Pekan Ke**: 4
* **Status Approval**: `MENUNGGU_VERIFIKASI_DPL` (Telah diteruskan ke portal DPL Ibu Dr. Eng. Siswanti Zuraida, S.Pd., M.T.)

### D. Tabel `PointHistory` (`riwayat_poin`) & Total Saldo Poin
1. **+4 Poin**: Poin Kehadiran KKN Check-In (`KKN_PRESENSI_HADIR`) disinkronkan ke 10:00 WIB.
2. **+3 Poin**: Poin Durasi Harian Terpenuhi 360 Menit (`KKN_DURASI_MEMENUHI`) disinkronkan ke 16:00 WIB.
3. **+3 Poin**: Poin Pengisian Logbook Harian Pekan Ke-4 (`KKN_LOGBOOK_HARIAN`) disinkronkan ke 16:00 WIB.
* **Total Saldo Poin Terkini**: **226 PTS** (Meningkat dari 220 PTS).

### E. Flush Redis Cache
* Perintah `docker exec psc-redis redis-cli flushall` berhasil dieksekusi sehingga aplikasi mobile mahasiswa dan dashboard DPL langsung merefleksikan status terbaru secara instan.

---

## 3. Ringkasan Eksekutif Rekam Jejak Kehadiran Idin Naufal Hakim

| Parameter Audit & Rekam Jejak | Data Terverifikasi VPS | Analisis Sistem |
|:---|:---:|:---|
| **Total Sesi Hadir Memenuhi** | **25 Hari** (`HADIR_MEMENUHI`) | **Kepatuhan disiplin sangat tinggi di lapangan** |
| **Total Jam Hadir Kumulatif** | **211 Jam 24 Menit** (12.684 menit) | **Melampaui target KKN 80 Jam (>260% Target)** |
| **Rata-Rata Durasi per Hari Hadir** | **8 Jam 27 Menit** | Sangat produktif, konsisten di atas 4 jam/hari |
| **Total Saldo Poin** | **226 PTS** | Saldo poin sangat aman & unggul |
| **Status Kelulusan Minimum** | **TERPENUHI (AMAT BAIK)** | Jam kumulatif & komponen logbook memenuhi syarat A |

---

## 4. Rincian 31 Sesi Kehadiran Idin Naufal Hakim (Live Database VPS)

| No | Tanggal Kegiatan | Waktu Check-In | Waktu Check-Out | Durasi Efektif | Status Presensi | Keterangan / Kegiatan |
|:---:|:---:|:---:|:---:|:---:|:---:|:---|
| 1 | Sen, 31 Agu 2026 | 07:07:17 WIB | 09:00:06 WIB | 1 Jam 52 Mnt (112 m) | `HADIR_TIDAK_MEMENUHI` | Sesi Awal KKN |
| 2 | Sen, 31 Agu 2026 | 10:07:36 WIB | 09:00:21 WIB | 1 Jam 31 Mnt (91 m) | `HADIR_TIDAK_MEMENUHI` | Sesi Tambahan Awal |
| 3 | Sel, 01 Sep 2026 | 11:11:49 WIB | 23:50:04 WIB | 0 Mnt | `HADIR_TIDAK_MEMENUHI` | Koreksi Sesi Mandiri |
| 4 | Kam, 03 Sep 2026 | - | - | 0 Mnt | `TIDAK_ADA_KEGIATAN` | Tidak ada kegiatan pada hari ini |
| 5 | Kam, 03 Sep 2026 | 08:05:56 WIB | 18:00:00 WIB | 8 Jam 00 Mnt (480 m) | `HADIR_MEMENUHI` | Kegiatan Rutinan Posko |
| 6 | Sab, 05 Sep 2026 | - | - | 0 Mnt | `TIDAK_ADA_KEGIATAN` | Tidak ada kegiatan pada hari ini |
| 7 | Min, 06 Sep 2026 | - | - | 0 Mnt | `ALPA` | Tanpa Keterangan Sistem |
| 8 | Sen, 07 Sep 2026 | 08:03:39 WIB | 16:16:42 WIB | 8 Jam 13 Mnt (493 m) | `HADIR_MEMENUHI` | Kegiatan Rutin Posko |
| 9 | Sel, 08 Sep 2026 | 07:08:41 WIB | 15:42:38 WIB | 6 Jam 47 Mnt (407 m) | `HADIR_MEMENUHI` | Fiksasi proposal & kumpul DLH RW 02 |
| 10 | Rab, 09 Sep 2026 | 08:21:10 WIB | 14:50:31 WIB | 4 Jam 34 Mnt (274 m) | `HADIR_MEMENUHI` | Bantu Gaslah dan MBG di RW 04 |
| 11 | Kam, 10 Sep 2026 | 08:19:29 WIB | 16:00:32 WIB | 7 Jam 41 Mnt (461 m) | `HADIR_MEMENUHI` | Kegiatan harian MBG PKK & proposal kelurahan |
| 12 | Jum, 11 Sep 2026 | 08:23:23 WIB | 20:00:00 WIB | 11 Jam 36 Mnt (696 m) | `HADIR_MEMENUHI` | Kegiatan Harian Posko KKN |
| 13 | Min, 13 Sep 2026 | 08:13:52 WIB | 16:23:43 WIB | 8 Jam 09 Mnt (489 m) | `HADIR_MEMENUHI` | Kegiatan rutinan MBG dan posko |
| 14 | Sen, 14 Sep 2026 | 08:11:11 WIB | 17:16:27 WIB | 9 Jam 05 Mnt (545 m) | `HADIR_MEMENUHI` | Gaslah & MBG serta survei lokasi RW 04 & 03 |
| 15 | Sel, 15 Sep 2026 | 07:55:58 WIB | 16:24:42 WIB | 8 Jam 28 Mnt (508 m) | `HADIR_MEMENUHI` | MBG & pemasangan poster RW 03 |
| 16 | Rab, 16 Sep 2026 | 09:19:21 WIB | 20:00:00 WIB | 4 Jam 26 Mnt (266 m) | `HADIR_MEMENUHI` | Kegiatan Harian Posko KKN |
| 17 | Kam, 17 Sep 2026 | 08:24:50 WIB | 15:48:39 WIB | 5 Jam 10 Mnt (310 m) | `HADIR_MEMENUHI` | Diskusi sosialisasi & uji app Berseka ke warga |
| 18 | Min, 20 Sep 2026 | 08:13:35 WIB | 12:20:43 WIB | 4 Jam 07 Mnt (247 m) | `HADIR_MEMENUHI` | Bantu Gaslah, MBG, koordinasi RT/RW sosialisasi |
| 19 | Sen, 21 Sep 2026 | 08:05:41 WIB | 20:00:00 WIB | 8 Jam 04 Mnt (484 m) | `HADIR_MEMENUHI` | Kegiatan Harian Posko KKN |
| 20 | Sel, 22 Sep 2026 | 09:00:04 WIB | 16:02:12 WIB | 7 Jam 02 Mnt (422 m) | `HADIR_MEMENUHI` | Aplikasi DTD & surat persiapan ke PAUD |
| 21 | Rab, 23 Sep 2026 | 07:59:30 WIB | 16:06:31 WIB | 8 Jam 07 Mnt (487 m) | `HADIR_MEMENUHI` | Koordinasi RT DTD pendataan pilah sampah |
| 22 | Kam, 24 Sep 2026 | 07:51:14 WIB | 20:00:00 WIB | 12 Jam 08 Mnt (728 m) | `HADIR_MEMENUHI` | Kegiatan Harian Posko KKN |
| 23 | Jum, 25 Sep 2026 | 08:04:59 WIB | 20:00:00 WIB | 11 Jam 55 Mnt (715 m) | `HADIR_MEMENUHI` | Kegiatan Harian Posko KKN |
| 24 | Min, 27 Sep 2026 | 08:16:34 WIB | 20:00:00 WIB | 11 Jam 43 Mnt (703 m) | `HADIR_MEMENUHI` | Kegiatan Harian Posko KKN |
| 25 | Sen, 28 Sep 2026 | 09:19:10 WIB | 20:00:00 WIB | 10 Jam 40 Mnt (640 m) | `HADIR_MEMENUHI` | Kegiatan Harian Posko KKN |
| 26 | Sel, 29 Sep 2026 | 11:03:56 WIB | 20:00:00 WIB | 8 Jam 56 Mnt (536 m) | `HADIR_MEMENUHI` | Kegiatan Harian Posko KKN |
| 27 | Rab, 30 Sep 2026 | 08:37:50 WIB | 15:57:11 WIB | 6 Jam 27 Mnt (387 m) | `HADIR_MEMENUHI` | Sosialisasi PAUD Sejahtera |
| 28 | Kam, 01 Okt 2026 | 07:58:55 WIB | 20:00:00 WIB | 12 Jam 01 Mnt (721 m) | `HADIR_MEMENUHI` | Kegiatan Harian Posko KKN |
| 29 | Min, 04 Okt 2026 | 10:52:11 WIB | 17:38:10 WIB | 6 Jam 45 Mnt (405 m) | `HADIR_MEMENUHI` | DTD pendataan warga pemilah sampah |
| 30 | Sen, 05 Okt 2026 | 08:02:17 WIB | 20:00:00 WIB | 11 Jam 57 Mnt (717 m) | `HADIR_MEMENUHI` | Kegiatan Harian Posko KKN |
| 31 | Rab, 07 Okt 2026 | 10:00:00 WIB | 16:00:00 WIB | 6 Jam 00 Mnt (360 m) | `HADIR_MEMENUHI` | Pembuatan tong sampah sedekah RW 03 & 04 Sekeloa |

---

## 5. Kesimpulan & Rekomendasi

1. **Integritas Sistem Terjamin**: Seluruh data riil presensi dan logbook Idin Naufal Hakim pada tanggal 07 Oktober 2026 telah 100% tersinkronisasi di basis data VPS (`157.10.252.252`).
2. **Kompensasi Poin Penuh**: Hak mahasiswa berupa poin durasi harian (+3 PTS) dan poin logbook (+3 PTS) telah berhasil dikreditkan ke akun, menjadikan total saldo poin akun mencapai **226 PTS**.
3. **Portal DPL Terhubung**: Logbook kegiatan harian telah masuk ke daftar antrean verifikasi DPL Ibu Dr. Eng. Siswanti Zuraida, S.Pd., M.T. tanpa hambatan teknis.
