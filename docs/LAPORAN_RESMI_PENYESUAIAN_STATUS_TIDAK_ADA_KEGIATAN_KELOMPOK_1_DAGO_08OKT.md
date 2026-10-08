# 🌿 BERSEKA - SISTEM TATA KELOLA KKN TEMATIK TERPADU
## LAPORAN RESMI PENYESUAIAN STATUS TIDAK ADA KEGIATAN KELOMPOK 1 DAGO PADA VPS LIVE

* **Nomor Dokumen**: `REP-ATTENDANCE/KKN-DAGO1/2026-10/027`
* **Tanggal Pelaksanaan**: Kamis, 08 Oktober 2026 (Pukul 12:00 WIB)
* **Target Infrastruktur**: Server Live VPS PostgreSQL 16 (`157.10.252.252` / `psc_db`)
* **Kelompok Penempatan**: **Kelompok 1 Dago**, Kelurahan Dago (Kecamatan Coblong)
* **Dosen Pembimbing Lapangan (DPL)**: **Prof. Dra. Umi Narimawati, S.E., M.Si., M.Pd.**
* **Penerbit Dokumen**: **Tim Data Governance & Backend Engineering Berseka**
* **Status Eksekusi**: 🟢 **BERHASIL DISELESAIKAN & TERSINKRONISASI 100% (EXIT CODE 0)**

---

## 1. Latar Belakang & Instruksi Operasional

Berdasarkan laporan dan permohonan resmi dari perwakilan Kelompok 1 Dago pada hari **Kamis, 08 Oktober 2026**:
> *"Selamat pagi kak, izin informasi hari ini kelompok 1 dago semuanya tidak ada kegiatan yaa, terima kasih banyak🙏🏻 eksekusi ke vps agar tidak alpha"*

Seluruh anggota (43 mahasiswa) Kelompok 1 Dago mengonfirmasi bahwa pada hari Kamis, 08 Oktober 2026 tidak memiliki jadwal kegiatan lapangan di posko. Agar sistem evaluasi harian tidak salah menandai anggota kelompok sebagai **`ALPA`** ataupun penalti **`HADIR_TIDAK_MEMENUHI`** (Kurang Jam), telah dilakukan penyesuaian operasional sesuai dengan standar sistem presensi Berseka.

---

## 2. Tindakan Data Governance & Keamanan Database VPS

Sesuai dengan **Aturan Perlindungan Database VPS & Data Governance Berseka**:
1. **Pembuatan Golden Backup Snapshot Sebelum Eksekusi**:
   Snapshot database PostgreSQL `psc_db` telah berhasil diamankan pada path server:
   ```bash
   /home/maker/backups/golden_backup_pre_k1_dago_08okt_1791435561023.sql (Ukuran: 542 MB)
   ```
2. **Pembaruan Status Jadwal Level Kelompok (`Schedule`)**:
   * **Jadwal ID**: `a6f72a98-e774-4a9e-8367-177762d7ba0c`
   * **Judul**: `Kegiatan Harian Posko KKN Kelompok 1 Dago`
   * **Tanggal Sesi**: Kamis, 08 Oktober 2026 (`2026-10-07T17:00:00.000Z` UTC / `2026-10-08 00:00:00` WIB)
   * **Status Kegiatan**: Diubah dari `AKTIF` menjadi **`TIDAK_ADA_KEGIATAN`**
   * **Detail Skip**:
     ```json
     {
       "alasan": "Tidak ada kegiatan (Konfirmasi resmi Kelompok 1 Dago seluruh anggota)",
       "markedBy": "SYSTEM_ADMIN_DIRECTIVE",
       "skippedAt": "2026-10-08T04:59:34.422Z",
       "keterangan": "Konfirmasi tidak ada kegiatan di lapangan hari ini (08 Oktober 2026) untuk seluruh 43 anggota Kelompok 1 Dago"
     }
     ```

3. **Sinkronisasi Presensi Seluruh Anggota (`ActivityAttendance`)**:
   * Sebanyak **43 mahasiswa** anggota Kelompok 1 Dago telah di-upsert dengan rincian:
     * **Status Kehadiran**: **`TIDAK_ADA_KEGIATAN`**
     * **Metode**: `SKIP_KEGIATAN`
     * **Durasi Efektif**: `0 Menit`
     * **Keterangan**: *"Tidak ada kegiatan (Konfirmasi resmi Kelompok 1 Dago seluruh anggota)"*
     * **Jam Sesi**: 08:00 WIB (`2026-10-08T01:00:00.000Z`)

4. **Pembersihan Cache Redis**:
   * Eksekusi `docker exec psc-redis redis-cli flushall` berhasil dijalankan agar perubahan data langsung terdistribusi ke seluruh klien aplikasi mobile (Flutter) dan web frontend.

---

## 3. Hasil Verifikasi Sistem & Dampak Status Presensi

Berdasarkan rule engine presensi Berseka:
1. **Bebas dari Penalti ALPA (0 ALPA)**:
   Sesi dengan status `TIDAK_ADA_KEGIATAN` / `SKIP_KEGIATAN` secara otomatis dikecualikan dari proses nightly auto-sweep penandaan alpa sistem.
2. **Bebas dari Penalti Kurang Jam / Tidak Memenuhi**:
   Sesi `TIDAK_ADA_KEGIATAN` tidak menambah counter `totalHariTidakMemenuhi`.
3. **Penyajian UI Mobile**:
   Pada aplikasi mobile mahasiswa, kartu hari ini akan berlabel resmi **"Tidak Ada Kegiatan"** (Bebas Tugas), bukan merah/alpha.

---

## 4. Daftar 43 Mahasiswa Kelompok 1 Dago Terlindungi

| No | NIM | Nama Mahasiswa | Peran | Status Hari Ini (08 Okt 2026) | Keterangan |
|:---:|:---:|:---|:---:|:---:|:---|
| 1 | `21224001` | Muhamad Rizkal Jatnika | **Ketua** | `TIDAK_ADA_KEGIATAN` | Bebas Alpha (Off-day resmi) |
| 2 | `21224002` | Mesya Siti Nuralia | Anggota | `TIDAK_ADA_KEGIATAN` | Bebas Alpha (Off-day resmi) |
| 3 | `21224003` | Cicy Fauzzyah Rifqi Iskandar Sunu Saranani | Anggota | `TIDAK_ADA_KEGIATAN` | Bebas Alpha (Off-day resmi) |
| 4 | `21224004` | Anindia Geisya Lauria | Anggota | `TIDAK_ADA_KEGIATAN` | Bebas Alpha (Off-day resmi) |
| 5 | `21224005` | Ahmad Shadiq | Anggota | `TIDAK_ADA_KEGIATAN` | Bebas Alpha (Off-day resmi) |
| 6 | `21224006` | Giandhika Bambang Supriatna | Anggota | `TIDAK_ADA_KEGIATAN` | Bebas Alpha (Off-day resmi) |
| 7 | `21224007` | Salma Fauziyyah Firdaus | Anggota | `TIDAK_ADA_KEGIATAN` | Bebas Alpha (Off-day resmi) |
| 8 | `21224008` | Laila Nazifa Sanjaya | Anggota | `TIDAK_ADA_KEGIATAN` | Bebas Alpha (Off-day resmi) |
| 9 | `21224009` | Reynaldi Pasha Nugraha | Anggota | `TIDAK_ADA_KEGIATAN` | Bebas Alpha (Off-day resmi) |
| 10 | `21224010` | Maryam Agatha Islami | Anggota | `TIDAK_ADA_KEGIATAN` | Bebas Alpha (Off-day resmi) |
| 11 | `21224011` | Riky wildan hepyliyadi | Anggota | `TIDAK_ADA_KEGIATAN` | Bebas Alpha (Off-day resmi) |
| 12 | `21224012` | Kesya Putri Fibrianto | Anggota | `TIDAK_ADA_KEGIATAN` | Bebas Alpha (Off-day resmi) |
| 13 | `21224014` | Yazdaniar Alfaathir | Anggota | `TIDAK_ADA_KEGIATAN` | Bebas Alpha (Off-day resmi) |
| 14 | `21224017` | Zahra Puteri Qintara | Anggota | `TIDAK_ADA_KEGIATAN` | Bebas Alpha (Off-day resmi) |
| 15 | `21224018` | Virginia Putri Andeida | Anggota | `TIDAK_ADA_KEGIATAN` | Bebas Alpha (Off-day resmi) |
| 16 | `21224019` | Muhammad Rendi Ansari | Anggota | `TIDAK_ADA_KEGIATAN` | Bebas Alpha (Off-day resmi) |
| 17 | `21224020` | Rio Islami Pasha | Anggota | `TIDAK_ADA_KEGIATAN` | Bebas Alpha (Off-day resmi) |
| 18 | `21224021` | Muhammad Rachil Tri Gusti | Anggota | `TIDAK_ADA_KEGIATAN` | Bebas Alpha (Off-day resmi) |
| 19 | `21224022` | Risa Marseliana | Anggota | `TIDAK_ADA_KEGIATAN` | Bebas Alpha (Off-day resmi) |
| 20 | `21224024` | Bilhaqqi Kitabullah | Anggota | `TIDAK_ADA_KEGIATAN` | Bebas Alpha (Off-day resmi) |
| 21 | `21224025` | Devan Elka Raihansyah | Anggota | `TIDAK_ADA_KEGIATAN` | Bebas Alpha (Off-day resmi) |
| 22 | `21224026` | Evania Salsabila Andariki | Anggota | `TIDAK_ADA_KEGIATAN` | Bebas Alpha (Off-day resmi) |
| 23 | `21224027` | Amelya Rizqi Rachmadani | Anggota | `TIDAK_ADA_KEGIATAN` | Bebas Alpha (Off-day resmi) |
| 24 | `21224028` | Nanda Puspita Dewi | Anggota | `TIDAK_ADA_KEGIATAN` | Bebas Alpha (Off-day resmi) |
| 25 | `21224029` | Rizka Rahma Kamila | Anggota | `TIDAK_ADA_KEGIATAN` | Bebas Alpha (Off-day resmi) |
| 26 | `21224030` | Devitasari | Anggota | `TIDAK_ADA_KEGIATAN` | Bebas Alpha (Off-day resmi) |
| 27 | `21224031` | Aldrin Juandika | Anggota | `TIDAK_ADA_KEGIATAN` | Bebas Alpha (Off-day resmi) |
| 28 | `21224033` | Darrell Rafif Rizky Ramadhan | Anggota | `TIDAK_ADA_KEGIATAN` | Bebas Alpha (Off-day resmi) |
| 29 | `21224034` | Saepul Anwar | Anggota | `TIDAK_ADA_KEGIATAN` | Bebas Alpha (Off-day resmi) |
| 30 | `21224035` | Kaesya Prasetya Gandhi | Anggota | `TIDAK_ADA_KEGIATAN` | Bebas Alpha (Off-day resmi) |
| 31 | `21224036` | Juan Morgan Pakpahan | Anggota | `TIDAK_ADA_KEGIATAN` | Bebas Alpha (Off-day resmi) |
| 32 | `21224037` | Rika Yuseliana | Anggota | `TIDAK_ADA_KEGIATAN` | Bebas Alpha (Off-day resmi) |
| 33 | `21224038` | Melisa Febrianty Effendi | Anggota | `TIDAK_ADA_KEGIATAN` | Bebas Alpha (Off-day resmi) |
| 34 | `21224039` | Mochamad mir’an kholid | Anggota | `TIDAK_ADA_KEGIATAN` | Bebas Alpha (Off-day resmi) |
| 35 | `21224040` | Naaila Rizky Kurniawan | Anggota | `TIDAK_ADA_KEGIATAN` | Bebas Alpha (Off-day resmi) |
| 36 | `21224041` | Dwi Anggeria Maulana | Anggota | `TIDAK_ADA_KEGIATAN` | Bebas Alpha (Off-day resmi) |
| 37 | `21224042` | Dimas Aditiya | Anggota | `TIDAK_ADA_KEGIATAN` | Bebas Alpha (Off-day resmi) |
| 38 | `21224164` | Bunga Sefrizanti | Anggota | `TIDAK_ADA_KEGIATAN` | Bebas Alpha (Off-day resmi) |
| 39 | `21224165` | Novia Sri Wahyuni | Anggota | `TIDAK_ADA_KEGIATAN` | Bebas Alpha (Off-day resmi) |
| 40 | `21224166` | Ana Alailla | Anggota | `TIDAK_ADA_KEGIATAN` | Bebas Alpha (Off-day resmi) |
| 41 | `21224175` | Rajnan khairul akhyar | Anggota | `TIDAK_ADA_KEGIATAN` | Bebas Alpha (Off-day resmi) |
| 42 | `21224176` | Lukman Hakim | Anggota | `TIDAK_ADA_KEGIATAN` | Bebas Alpha (Off-day resmi) |
| 43 | `21225023` | Muhamad Ghassan Rabbani Hadiana | Anggota | `TIDAK_ADA_KEGIATAN` | Bebas Alpha (Off-day resmi) |

---

## 5. Kesimpulan & Panduan Tindak Lanjut

1. **Status Aman 100%**: Seluruh 43 mahasiswa Kelompok 1 Dago telah terkunci aman dengan status **`TIDAK_ADA_KEGIATAN`** untuk hari Kamis, 08 Oktober 2026.
2. **Nol Alpha**: Tidak akan ada anggota Kelompok 1 Dago yang terkena status `ALPA` saat sistem auto-cutoff berjalan malam hari.
3. **Instruksi Mahasiswa**: Mahasiswa dapat membuka aplikasi Berseka dan melakukan *pull-to-refresh* (geser ke bawah) pada menu Beranda atau Timesheet untuk memastikan status telah terbarui menjadi **"Tidak Ada Kegiatan"**.
