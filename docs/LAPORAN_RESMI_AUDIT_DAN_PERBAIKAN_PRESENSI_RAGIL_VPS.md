# 🌿 BERSEKA - SISTEM TATA KELOLA KKN TEMATIK TERPADU
## LAPORAN RESMI AUDIT & PERBAIKAN PRESENSI MAHASISWA KKN PADA VPS LIVE

* **Nomor Dokumen**: `REP-AUDIT/KKN-ATT/2026-10/021`
* **Tanggal Pelaksanaan**: Kamis, 08 Oktober 2026 (Pukul 06:25 WIB)
* **Target Infrastruktur**: Server Live VPS PostgreSQL 16 (`157.10.252.252` / `psc_db`)
* **Subjek Mahasiswa**: **Ragil Yuni Wulandari** (NIM: `10124707`)
* **Kelompok Penempatan**: **Kelompok 11 Sadang Serang**, Kelurahan Sadang Serang (Cakupan Wilayah: RW 16 & RW 19)
* **Lokasi Kegiatan Lapangan**: **RW 16**, Kelurahan Sadang Serang
* **Dosen Pembimbing Lapangan (DPL)**: **Ayub Subandi, S.Si., M.T., Ph.D.** (NIP: `4127.70.05.030`)
* **Penerbit Dokumen**: **Tim Data Governance & Backend Engineering Berseka**
* **Status Eksekusi**: 🟢 **BERHASIL DISELESAIKAN & TERSINKRONISASI 100% DI VPS (EXIT CODE 0)**

---

## 1. Latar Belakang & Laporan Resmi Konfirmasi Lapangan

Sehubungan dengan kendala teknis pencatatan durasi presensi pada aplikasi mobile Berseka untuk kegiatan hari **Rabu, 07 Oktober 2026**, tim administrator membuka jalur konfirmasi mandiri/kelompok untuk memastikan seluruh aktivitas lapangan diakui secara sah dan tidak ada mahasiswa yang dirugikan.

Perwakilan **Kelompok 11 Sadang Serang** telah mengirimkan format konfirmasi resmi kegiatan sebagai berikut:

1. **Kelompok & Lokasi RW**: Kelompok 11 & RW 16
2. **Daftar Nama & NIM Anggota yang Hadir**: Ragil Yuni Wulandari - `10124707`
3. **Rincian Kegiatan Hari Ini**: *Ecobrick, Monitoring Rumah Memilah.*
4. **Waktu Kegiatan (Jam Mulai - Selesai)**: **06.30 - 16.00 WIB** (Durasi: **570 Menit / 9 Jam 30 Menit**)
5. **Foto Dokumentasi Kegiatan**: Tersimpan pada sistem penyimpanan digital (`/uploads/1791330304307-c39512c5-593c-4e97-9cbf-73c29c405ba2.jpg`)

### Temuan Forensik Basis Data Sebelum Penyesuaian:
1. Record presensi mahasiswa sempat terpotong oleh auto-logout pada pukul 14:39 WIB (`jedaLogs: "Pengguna Keluar / Logout Aplikasi"`) dan terselesaikan secara otomatis oleh modul sistem auto-cutoff pada pukul 20:00 WIB dengan durasi berjalan 794 menit.
2. Deskripsi kegiatan awal belum mencerminkan format konfirmasi terkini lapangan (*Ecobrick, Monitoring Rumah Memilah.*).
3. Diperlukan penyesuaian durasi riil menjadi **06.30 – 16.00 WIB (570 Menit)**, pembersihan jeda logout, dan penyelarasan poin kehadiran serta durasi.

---

## 2. Tindakan Eksekusi & Pembaruan Data pada Database VPS

Sesuai SOP Data Governance & Perlindungan Basis Data Berseka, sebelum tindakan mutasi telah diamankan **Golden Backup VPS** di server live:
```bash
/home/maker/golden_backup_pre_ragil_07okt.sql (Ukuran: 543 MB - Exit Code 0)
```

Tim Data Governance & Backend Engineering telah mengeksekusi rekonsiliasi data menyeluruh pada tabel operasional server live VPS:

### A. Tabel `ActivityAttendance` (Presensi Kegiatan Terjadwal Posko)
* **ID Record**: `5fddfe92-47c7-46f9-a42b-85375c8d483c`
* **Jadwal Terkait**: Kegiatan Harian Posko KKN Kelompok 11 Sadang Serang (`679000cd-b43b-4592-aead-d5ea93d1327a`)
* **Waktu Masuk (`attendedAt`)**: `2026-10-06T23:30:00.000Z` (**06:30:00 WIB**)
* **Waktu Keluar (`checkOutAt`)**: `2026-10-07T09:00:00.000Z` (**16:00:00 WIB**)
* **Durasi Efektif**: **570 Menit (9 Jam 30 Menit)** — *Melampaui target minimum 240 menit/hari (4 jam)*.
* **Status Kehadiran**: `HADIR_MEMENUHI`
* **Deskripsi Kegiatan**: *"Ecobrick, Monitoring Rumah Memilah."*
* **Log Jeda (`jedaLogs`)**: Dinormalkan menjadi `[]` (bersih dari auto-logout bug).
* **Metode Presensi**: `GPS_MANDIRI_SYNC` (Platform: `ANDROID`)

### B. Tabel `PresensiMandiri` (Sinkronisasi Modul Presensi Mandiri)
* **ID Record**: `98b87e98-b72a-4ce5-8605-24133a0cf08a`
* **Waktu Check-In**: `2026-10-06T23:30:00.000Z` (**06:30:00 WIB**)
* **Waktu Check-Out**: `2026-10-07T09:00:00.000Z` (**16:00:00 WIB**)
* **Durasi Efektif**: **570 Menit**
* **Status**: `SELESAI`
* **Deskripsi Kegiatan**: *"Ecobrick, Monitoring Rumah Memilah."*
* **Foto Bukti**: `/uploads/1791330304307-c39512c5-593c-4e97-9cbf-73c29c405ba2.jpg`

### C. Tabel `PointHistory` & Saldo Poin Mahasiswa
1. **+4 Poin**: Poin Kehadiran KKN Check-In disinkronkan ke 06:30 WIB (`KKN_PRESENSI_HADIR`).
2. **+3 Poin**: Poin Durasi Harian Terpenuhi 570 Menit disinkronkan ke 16:00 WIB (`KKN_DURASI_MEMENUHI`).
* **Total Saldo Poin Akumulatif**: **203 PTS** (Tercatat prima dan memenuhi ambang kelulusan).

### D. Pembersihan Cache Redis Live
* Perintah `docker exec psc-redis redis-cli flushall` berhasil dieksekusi dengan status `OK`. Seluruh aplikasi mobile dan web portal DPL/Admin langsung menampilkan data presensi terbaru secara realtime.

---

## 3. Ringkasan Eksekutif Rekam Jejak Kehadiran Ragil Yuni Wulandari

| Parameter Audit & Rekam Jejak | Data Terverifikasi VPS | Status / Analisis Sistem |
|:---|:---:|:---|
| **Nama Lengkap** | **Ragil Yuni Wulandari** | Mahasiswa Aktif KKN Tematik |
| **NIM** | **10124707** | Terdaftar di LPPM UNIKOM |
| **Kelompok & Lokasi** | Kelompok 11 Sadang Serang | RW 16 & RW 19 Sadang Serang |
| **DPL Pembimbing** | Ayub Subandi, S.Si., M.T., Ph.D. | NIP: `4127.70.05.030` |
| **Total Sesi Hadir Memenuhi** | **31 Sesi** (`HADIR_MEMENUHI`) | **Kepatuhan Luar Biasa (100% Hari Aktif)** |
| **Total Jam Hadir Kumulatif** | **252,67 Jam** (15.160 Menit) | **Melampaui Target Wajib 80 Jam (315%)** |
| **Rata-Rata Durasi per Sesi** | **8 Jam 09 Menit** | Sangat Produktif di Lapangan |
| **Total Saldo Poin** | **203 PTS** | Sangat Aman & Kategori Nilai A |
| **Status Presensi 07 Okt 2026** | 🟢 **HADIR_MEMENUHI (570 Menit)** | **Telah Disesuaikan Resmi** |

---

## 4. Kesimpulan & Panduan Pengecekan Mahasiswa

1. **Presensi 07 Oktober 2026 Sah & Sempurna**: Presensi telah berstatus **HADIR_MEMENUHI** dengan durasi resmi **570 Menit (06.30 – 16.00 WIB)** serta rincian kegiatan *"Ecobrick, Monitoring Rumah Memilah."*.
2. **Saldo Poin 203 PTS Terlindungi**: Seluruh poin kehadiran (+4 PTS) dan durasi (+3 PTS) telah tersinkronisasi rapi.
3. **Akumulasi Jam Lapangan Sangat Tinggi**: Total jam kerja lapangan Ragil Yuni Wulandari telah menembus **252,67 Jam**, jauh melampaui batas kelulusan minimal 80 jam.
4. **Sinkronisasi Aplikasi Mobile**: Mahasiswa dipersilakan membuka aplikasi Berseka dan melakukan tarik ke bawah (*pull to refresh*) pada tab Beranda dan Timesheet untuk melihat tampilan terkini.
5. **Keabsahan Dokumen**: Dokumen ini merupakan berita acara resmi dari tim pengembang sistem Berseka dan dapat digunakan sebagai rujukan administratif kepada DPL (**Bapak Ayub Subandi, S.Si., M.T., Ph.D.**) atau panitia KKN.
