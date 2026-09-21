# LAPORAN EKSEKUSI AUDIT FORENSIK & NORMALISASI DATA PRESENSI KKN DI VPS (`psc_db`)

**Tanggal Pelaksanaan:** 21 September 2026  
**Target Lingkungan:** VPS Produksi (`157.10.252.252`) — Database `psc_db`  
**Otoritas Pelaksana:** Fullstack Developer (Backend API & Database Engineering)  
**Status Tindakan:** 🟢 **100% SUKSES TERNORMALISASI & TERVERIFIKASI (ZERO ANOMALY)**

---

## 1. Ringkasan Eksekutif

Sebagai tindak lanjut atas temuan audit investigatif bug presensi KKN (**BUG-1, BUG-2, BUG-4, BUG-5**), tim pengembang telah melakukan audit forensik menyeluruh dan normalisasi data pada basis data operasional VPS (`psc_db`).

Sesuai persetujuan pimpinan teknis (**Opsi A: Normalisasi Penuh Transaksional**), seluruh anomali data historis yang diakibatkan oleh relaksasi geofence, duplikasi endpoint, serta inflasi durasi sistem auto-checkout telah dibersihkan secara aman dengan mitigasi **Golden Backup**.

### Hasil Komparasi Sebelum vs Sesudah Normalisasi:

| No | Parameter Data Audit | Sebelum Normalisasi | Sesudah Normalisasi | Selisih Koreksi | Status Akhir |
| :---: | :--- | :---: | :---: | :---: | :---: |
| **1** | **Duplikasi Poin Check-In (`KKN_PRESENSI_HADIR`)** | 13 pasang rekor | **0 rekor** | -13 rekor (-52 Pts) | **BERSIH** |
| **2** | **Duplikasi Poin Durasi (`KKN_DURASI_MEMENUHI`)** | 1 pasang rekor | **0 rekor** | -1 rekor (-3 Pts) | **BERSIH** |
| **3** | **Rekor Auto-Checkout Terinflasi 240m (BUG-1)** | 17 rekor | **0 rekor** | -17 rekor (-51 Pts) | **TERKOREKSI** |
| **4** | **Kasus Ekstrem Durasi < 30 Menit yang Dapat Poin** | 3 rekor | **0 rekor** | -3 rekor | **TERKOREKSI** |
| **Total** | **Anomali Poin yang Dinormalisasi** | **106 Pts** | **0 Pts** | **-106 Pts Anomali** | **VALID 100%** |

---

## 2. Mitigasi Keamanan Data & Golden Backup

Mengacu pada aturan baku **`AGENTS.md`** (*🛡️ Aturan Perlindungan Database VPS & Data Governance*), normalisasi dijalankan dengan 3 lapis perlindungan mutlak:

1. **Snapshot Dump Lengkap (Golden Backup VPS)**:
   - File tersimpan di server VPS: `/home/maker/golden_backup_2026-09-21T09-00-29-109Z.sql` (Ukuran: **410 MB**).
2. **Snapshot Tabel PostgreSQL Internal**:
   - `riwayat_poin_backup_20260921_pre_norm`
   - `kehadiran_kegiatan_backup_20260921_pre_norm`
3. **Eksekusi Atomik & Transaksional (`DO $$ BEGIN ... END $$;`)**:
   - Menjamin bahwa jika terjadi kegagalan pada salah satu baris, seluruh operasi otomatis di-*rollback* tanpa merusak data mahasiswa lainnya.

---

## 3. Rincian Rinci Tindakan Normalisasi Data

### A. Deduplikasi Poin Check-In (`KKN_PRESENSI_HADIR`)
- **Akar Masalah**: Mahasiswa menembak endpoint `/mulai` dan `/absen` pada hari yang sama sebelum adanya guard helper `awardCheckInPointIfNotExists()`.
- **Tindakan**: Menghapus 13 baris duplikat berlebih pada tanggal 31 Agustus s.d. 21 September 2026 dan mempertahankan 1 transaksi check-in pertama yang sah per hari per mahasiswa.
- **Mahasiswa Terdampak (13 Rekor)**:
  - 2026-09-21: Fadilah Aulia Rahman, Mohammad Agung Arrifai, Rilva Muhammad Akbar, Panji Gumilang, Fauzan Ahmad Dhani, Cepi Muhamad Faisal, Dzaki Ghufron, Rimo Saptazi.
  - 2026-09-20: Naufal Akbar Subarna, Risna Dwi Putera.
  - 2026-09-19: Septian Muhammad Saputra, Dini Novalia Fitriani.
  - 2026-08-31: Muhammad Palda Satrio.

### B. Deduplikasi Poin Durasi (`KKN_DURASI_MEMENUHI`)
- **Akar Masalah**: Double-checkout pada tanggal 31 Agustus 2026.
- **Tindakan**: Menghapus 1 rekor duplikat Muhammad Palda Satrio (NIM 10524144).

### C. Koreksi 17 Rekor Auto-Checkout Terinflasi (BUG-1)
- **Akar Masalah**: Skrip auto-checkout pukul 20:00 WIB di kode lama memaksakan `durasi = Math.max(durasi, 240)` sehingga mahasiswa yang baru absen beberapa menit sebelum jam cutoff otomatis berstatus `HADIR_MEMENUHI` dan mendapatkan +3 Pts.
- **Tindakan**:
  1. Durasi pada tabel `kehadiran_kegiatan` dikembalikan ke durasi riil `elapsed_mins` (selisih menit dari waktu check-in ke check-out).
  2. Status diubah dari `HADIR_MEMENUHI` menjadi `HADIR_TIDAK_MEMENUHI` karena durasi riil < 240 menit.
  3. Poin `KKN_DURASI_MEMENUHI` (+3 Pts) ditarik kembali untuk 17 rekor tersebut.
- **Kasus Ekstrem yang Berhasil Dinetralisir**:
  - **Ginda Nugraha Pratama (NIM 10124274)**: Absen pukul 19:53, auto-checkout 20:00 (Hanya **6 menit** di lapangan). Sebelumnya terinflasi 240 menit $\rightarrow$ Kini terkoreksi menjadi **6 menit** (`HADIR_TIDAK_MEMENUHI`, 0 poin durasi).
  - **Naufal Akbar Subarna (NIM 13124023)**: Absen pukul 19:50, auto-checkout 20:00 (Hanya **10 menit** di lapangan). Sebelumnya terinflasi 240 menit $\rightarrow$ Kini terkoreksi menjadi **10 menit**.
  - **Nur Ain Salimah (NIM 10123049)**: Absen pukul 19:45, auto-checkout 20:00 (Hanya **14,8 menit** di lapangan). Sebelumnya terinflasi 240 menit $\rightarrow$ Kini terkoreksi menjadi **15 menit**.
  - Serta 14 mahasiswa lainnya dengan durasi antara 33 hingga 233 menit yang telah dikembalikan ke waktu riil.

---

## 4. Status Rekapitulasi Poin KKN Pasca-Normalisasi (SSOT Final)

Berikut adalah saldo resmi seluruh kategori poin KKN di tabel `riwayat_poin` VPS:

```
      kategori       | total_tx | total_pts 
---------------------+----------+-----------
 KKN_PRESENSI_HADIR  |     6956 |     27824
 KKN_DURASI_MEMENUHI |     6471 |     19413
 KKN_LOGBOOK_HARIAN  |     3565 |     10695
---------------------+----------+-----------
 TOTAL BERSIH        |    16992 |     57932
```

---

## 5. Kesimpulan & Status Sistem

1. Basis data operasional VPS (`psc_db`) kini telah **100% bersih, adil, dan sinkron** dengan kondisi riil di lapangan.
2. Tidak ada lagi duplikasi poin pada mahasiswa KKN manapun.
3. Backend telah diproteksi dengan:
   - Gerbang Geofence ketat di `mulaiKegiatan()` dan `recordAttendance()` (menutup BUG-2 & BUG-5).
   - Gerbang Geofence ketat saat check-out (menutup eksploitasi BUG-4).
   - Helper idempotensi `awardCheckInPointIfNotExists()` (mencegah duplikasi masa depan).
   - Penghapusan inflasi durasi auto-checkout (menutup BUG-1).

*Laporan ini disusun secara otomatis dan diverifikasi langsung dari server produksi untuk menjamin keaslian data dan kepatuhan standar akademik Berseka.*
