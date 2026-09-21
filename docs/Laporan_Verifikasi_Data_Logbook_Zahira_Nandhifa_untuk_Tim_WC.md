# LAPORAN VERIFIKASI & PENYELARASAN DATA POIN MAHASISWA KKN
**Kepada Yth:** Ka Nabila & Tim Taskforce / WC (Data Validation & Quality Assurance)  
**Dari:** Fullstack Development & Database Engineering Team Berseka  
**Perihal:** Klarifikasi, Audit Forensik, dan Penyelarasan Poin Logbook & Presensi Mahasiswa **Zahira Nandhifa Syifarany** (NIM: `44324016`)  
**Tanggal:** 21 September 2026  
**Status Audit:** **100% SELESAI & AMAN (GOLDEN BACKUP PROTECTED)**

---

## 1. RINGKASAN EKSEKUTIF

Berdasarkan pemeriksaan data verifikasi tim WC terhadap mahasiswa:
* **Nama**: Zahira Nandhifa Syifarany
* **NIM**: `44324016`
* **Program Studi**: S1 Hubungan Internasional (UNIKOM)
* **Penugasan**: Kelompok 8 Sadang Serang (Kelurahan Sadang Serang)
* **Dosen Pembimbing Lapangan (DPL)**: Dr. H. Tatang Supriyadi, S.E., M.M.

Pada laporan awal, poin logbook harian Zahira sempat tercatat hanya **3 Poin (1 hari)** dan poin check-in 18 September sempat tercecer, sehingga total akumulasi poin pribadinya hanya **129 Poin**. Hal ini menimbulkan pertanyaan verifikasi mengingat mahasiswa melaporkan telah mengisi puluhan logbook dan aktif presensi di aplikasi.

Setelah dilakukan **audit forensik langsung pada basis data operasional VPS (`psc_db`)**, sistem telah melakukan rekonsiliasi berbasis **Single Source of Truth (SSOT)**:
1. Poin logbook dihitung secara sah berdasarkan **Tanggal Pelaksanaan Kegiatan (`tanggal_kegiatan`)**, **BUKAN tanggal input/upload (`dibuat_pada` / `createdAt`)**.
2. Zahira terbukti secara sah memiliki **38 catatan logbook** yang mencakup **34 Tanggal Kegiatan Berbeda (Distinct Activity Dates)**.
3. Seluruh 33 tanggal kegiatan yang sempat tertunda telah disinkronisasi ke `riwayat_poin` dengan perlindungan **Golden Backup** (`/home/maker/golden_backup_riwayat_poin_1789966116155.sql`).
4. **Audit Presensi 18 September**: Mahasiswa terbukti hadir pada tanggal 18 September 2026 (absen pukul 06:42 WIB, checkout pukul 20:00 WIB, durasi 797 menit, status `HADIR_MEMENUHI`). Poin durasi (+3 PTS) telah masuk, namun poin check-in (+4 PTS) sempat tidak terbit karena kegagalan jaringan saat check-in. Poin check-in (+4 PTS) ini telah disinkronkan dengan Golden Backup (`/home/maker/golden_backup_riwayat_poin_1789967885062.sql`).
5. **Posisi Poin Zahira Saat Ini**: Resmi tercatat **232 POIN** (19 Presensi Hadir @ 4 Pts = 76 Pts + 18 Durasi @ 3 Pts = 54 Pts + 34 Logbook @ 3 Pts = 102 Pts).
6. **Penjelasan Ekspektasi 235 Poin**: Selisih sisa 3 poin menuju **235 POIN** berasal dari **Poin Durasi Hari Ini (21 September 2026)**. Sesi Zahira hari ini telah berjalan 213 menit (> target 210 menit) dan akan secara otomatis memperoleh +3 PTS saat sesi hari ini ditutup/checkout sore ini pukul 16:00/20:00 WIB (sebagaimana rekan sekelompoknya yang saat ini juga masih berada di 18 durasi / belum checkout hari ini). Total final setelah checkout hari ini adalah tepat **235 POIN**.

---

## 2. ATURAN TATA KELOLA LOGBOOK & POIN (GOVERNANCE RULE)

Untuk memastikan konsistensi verifikasi tim WC terhadap seluruh mahasiswa KKN, berikut adalah acuan arsitektur sistem Berseka:

### A. Evaluasi Berdasarkan Tanggal Kegiatan (Bukan Tanggal Input)
* Mahasiswa seringkali berada di area dengan kendala sinyal atau mengumpulkan dokumentasi terlebih dahulu, kemudian menginput beberapa logbook sekaligus dalam satu hari (susulan/bulk insert).
* **Prinsip Validasi**: Sistem **tidak mendiskualifikasi** logbook susulan selama tanggal kegiatannya berbeda dan berada dalam rentang operasional KKN.
* **Maksimal Poin Harian**: Sistem membatasi **maksimal 1 kali penghargaan poin (+3 PTS) per tanggal kegiatan unik per mahasiswa**.
  * Contoh: Jika mahasiswa menginput 2 logbook untuk kegiatan pagi dan sore di tanggal yang sama (misal 18 Agustus 2026), keduanya tetap tersimpan di riwayat aktivitas lapangan, namun poin yang dihitung adalah **1x (+3 PTS)**.
  * Jika mahasiswa menginput 11 logbook sekaligus pada tanggal 5 September 2026, tetapi masing-masing logbook untuk tanggal kegiatan yang berbeda (misal 1 Jul, 23 Jul, 24 Jul, 8 Agu, 10 Agu, dst.), maka **SELURUH TANGGAL KEGIATAN TERSEBUT MASUK DAN MASING-MASING MEMPEROLEH +3 PTS**.

### B. Aturan Status Persetujuan & Hak Poin Mahasiswa
* Poin logbook (+3 PTS) diberikan seketika saat mahasiswa mengirimkan laporan harian untuk mengapresiasi partisipasi aktif mahasiswa.
* Hak poin tetap berlaku selama logbook berstatus:
  * `DISETUJUI_DPL` (Resmi diverifikasi DPL)
  * `MENUNGGU_VERIFIKASI_DPL` (Sudah disetujui ketua kelompok / langsung menunggu verifikasi DPL)
  * `MENUNGGU_PERSETUJUAN_KETUA` (Dalam antrean verifikasi internal kelompok)
* Poin **hanya dibatalkan / ditarik (0 PTS)** jika DPL secara eksplisit memberikan status **`PERLU_REVISI_DPL`** atau **`DITOLAK_KETUA`**.
* Keterlambatan DPL dalam menekan tombol verifikasi massal di dashboard web tidak boleh merugikan perolehan poin mahasiswa yang telah aktif berkegiatan di lapangan.

---

## 3. AUDIT FORENSIK RINCI LOGBOOK ZAHIRA NANDHIFA SYIFARANY

Dari pemeriksaan tabel `logbook_kkn` di database produksi VPS:
* **Total Logbook Diinput**: 38 Entri
* **Total Tanggal Kegiatan Unik**: 34 Tanggal
* **Status Persetujuan**:
  * `DISETUJUI_DPL`: 1 entri (Kegiatan tgl 2026-07-01)
  * `MENUNGGU_VERIFIKASI_DPL`: 36 entri (Menunggu validasi massal Dr. H. Tatang Supriyadi)
  * `MENUNGGU_PERSETUJUAN_KETUA`: 1 entri (Kegiatan tgl 2026-08-27)
  * `PERLU_REVISI_DPL`: 0 entri (Tidak ada logbook yang ditolak/revisi)

### Tabel Rincian 34 Tanggal Kegiatan Sah:

| No | Tanggal Kegiatan | Jumlah Logbook | Jam Kegiatan | Deskripsi Singkat Kegiatan | Status Approval | Poin Sah |
|:--:|:----------------:|:--------------:|:------------:|:---------------------------|:---------------:|:--------:|
| 1 | **2026-07-01** | 1 | 08:00 - 15:00 | Pelepasan dan penerimaan mahasiswa KKN | `DISETUJUI_DPL` | **+3 PTS** |
| 2 | **2026-07-23** | 1 | 08:00 - 15:00 | Sosialisasi pemilahan sampah ke warga | `MENUNGGU_VERIFIKASI_DPL` | **+3 PTS** |
| 3 | **2026-07-24** | 1 | 09:00 - 14:00 | Pendataan fasilitas TPS & Posko RW | `MENUNGGU_VERIFIKASI_DPL` | **+3 PTS** |
| 4 | **2026-08-08** | 1 | 08:00 - 16:00 | Edukasi door-to-door pemilahan anorganik | `MENUNGGU_VERIFIKASI_DPL` | **+3 PTS** |
| 5 | **2026-08-10** | 1 | 08:30 - 15:30 | Monitoring bak sampah terpilah posko | `MENUNGGU_VERIFIKASI_DPL` | **+3 PTS** |
| 6 | **2026-08-11** | 1 | 08:00 - 16:00 | Pendampingan kader lingkungan RW 07 | `MENUNGGU_VERIFIKASI_DPL` | **+3 PTS** |
| 7 | **2026-08-12** | 1 | 09:00 - 15:00 | Pengolahan data hasil timbangan sampah | `MENUNGGU_VERIFIKASI_DPL` | **+3 PTS** |
| 8 | **2026-08-13** | 1 | 08:00 - 15:30 | Penyuluhan pembuatan kompos mandiri | `MENUNGGU_VERIFIKASI_DPL` | **+3 PTS** |
| 9 | **2026-08-14** | 1 | 08:30 - 16:00 | Koordinasi lapangan bersama pengurus RW | `MENUNGGU_VERIFIKASI_DPL` | **+3 PTS** |
| 10 | **2026-08-18** | 2 | 08:00 & 13:00 | Kegiatan posko & survei titik pembuangan | `MENUNGGU_VERIFIKASI_DPL` | **+3 PTS** |
| 11 | **2026-08-19** | 1 | 08:00 - 15:00 | Pengecekan progres program kerja bank sampah | `MENUNGGU_VERIFIKASI_DPL` | **+3 PTS** |
| 12 | **2026-08-20** | 1 | 09:00 - 16:00 | Edukasi pemanfaatan maggot bsf | `MENUNGGU_VERIFIKASI_DPL` | **+3 PTS** |
| 13 | **2026-08-21** | 1 | 08:00 - 15:00 | Kerja bakti pembersihan saluran lingkungan | `MENUNGGU_VERIFIKASI_DPL` | **+3 PTS** |
| 14 | **2026-08-22** | 1 | 08:30 - 15:30 | Pembuatan media poster edukasi pilah sampah | `MENUNGGU_VERIFIKASI_DPL` | **+3 PTS** |
| 15 | **2026-08-23** | 1 | 09:00 - 16:00 | Rapat evaluasi pekanan kelompok posko | `MENUNGGU_VERIFIKASI_DPL` | **+3 PTS** |
| 16 | **2026-08-25** | 1 | 08:00 - 15:00 | Pendataan ritase sampah anorganik posko | `MENUNGGU_VERIFIKASI_DPL` | **+3 PTS** |
| 17 | **2026-08-26** | 1 | 08:30 - 15:30 | Sosialisasi aplikasi Berseka ke pengurus RT | `MENUNGGU_VERIFIKASI_DPL` | **+3 PTS** |
| 18 | **2026-08-27** | 1 | 09:00 - 16:00 | Penyusunan draf laporan program kerja | `MENUNGGU_PERSETUJUAN_KETUA` | **+3 PTS** |
| 19 | **2026-08-28** | 1 | 08:00 - 16:00 | Pelaksanaan giat rutin pemilahan harian | `MENUNGGU_VERIFIKASI_DPL` | **+3 PTS** |
| 20 | **2026-08-31** | 2 | 08:00 & 13:00 | Evaluasi program akhir bulan & input data | `MENUNGGU_VERIFIKASI_DPL` | **+3 PTS** |
| 21 | **2026-09-01** | 2 | 08:00 & 14:00 | Monitoring pemilahan sampah organik posko | `MENUNGGU_VERIFIKASI_DPL` | **+3 PTS** |
| 22 | **2026-09-02** | 1 | 08:00 - 16:00 | Koordinasi keberlanjutan bank sampah unit | `MENUNGGU_VERIFIKASI_DPL` | **+3 PTS** |
| 23 | **2026-09-03** | 2 | 08:30 & 13:30 | Penimbangan sampah daur ulang warga | `MENUNGGU_VERIFIKASI_DPL` | **+3 PTS** |
| 24 | **2026-09-04** | 1 | 08:00 - 15:30 | Dokumentasi video inovasi pengolahan residu | `MENUNGGU_VERIFIKASI_DPL` | **+3 PTS** |
| 25 | **2026-09-07** | 1 | 08:00 - 16:00 | Piket operasional posko & rekap partisipasi | `MENUNGGU_VERIFIKASI_DPL` | **+3 PTS** |
| 26 | **2026-09-08** | 1 | 08:30 - 16:00 | Penyerahan bibit tanaman & pupuk kompos | `MENUNGGU_VERIFIKASI_DPL` | **+3 PTS** |
| 27 | **2026-09-09** | 1 | 08:00 - 16:00 | Pendampingan pemilahan di RW Sadang Serang | `MENUNGGU_VERIFIKASI_DPL` | **+3 PTS** |
| 28 | **2026-09-10** | 1 | 08:00 - 16:00 | Penyusunan laporan pertanggungjawaban proker | `MENUNGGU_VERIFIKASI_DPL` | **+3 PTS** |
| 29 | **2026-09-11** | 1 | 08:00 - 16:00 | Finalisasi artikel publikasi kegiatan | `MENUNGGU_VERIFIKASI_DPL` | **+3 PTS** |
| 30 | **2026-09-12** | 1 | 09:00 - 16:00 | Penataan posko dan inventarisasi aset KKN | `MENUNGGU_VERIFIKASI_DPL` | **+3 PTS** |
| 31 | **2026-09-14** | 1 | 08:30 - 16:00 | Persiapan penutupan KKN di kelurahan | `MENUNGGU_VERIFIKASI_DPL` | **+3 PTS** |
| 32 | **2026-09-15** | 1 | 08:00 - 16:00 | Giat pamitan warga dan tokoh masyarakat RW | `MENUNGGU_VERIFIKASI_DPL` | **+3 PTS** |
| 33 | **2026-09-16** | 1 | 08:00 - 16:00 | Acara penutupan KKN tingkat kelurahan | `MENUNGGU_VERIFIKASI_DPL` | **+3 PTS** |
| 34 | **2026-09-17** | 1 | 08:00 - 16:00 | Pengembalian posko & serah terima fasilitas | `MENUNGGU_VERIFIKASI_DPL` | **+3 PTS** |
| **TOTAL** | | **38 Logbook** | | | | **102 POIN** |

> *Catatan*: Pada tanggal 18 Agu, 31 Agu, 1 Sep, dan 3 Sep, mahasiswa menginput 2 entri logbook. Sesuai aturan SSOT sistem, hari tersebut dihitung **1x per hari (+3 Pts)**, sehingga total poin sah dari 34 hari kegiatan adalah **34 × 3 = 102 Poin**.

---

## 4. REKAPITULASI KOMPARASI POIN (BEFORE VS AFTER)

| Komponen Penilaian | Laporan Awal | Sebelum Sinkron 18 Sep | Posisi Saat Ini (Tersinkronisasi) | Setelah Checkout Hari Ini (21 Sep) | Keterangan & Dasar Validasi |
|:---|:---:|:---:|:---:|:---:|:---|
| **Presensi Hadir (+4)** | 72 Poin (18x) | 72 Poin (18x) | **76 Poin (19x)** | **76 Poin (19x)** | Valid via radius GPS (termasuk 18 & 21 Sep) |
| **Durasi Memenuhi (+3)** | 54 Poin (18x) | 54 Poin (18x) | **54 Poin (18x)** | **57 Poin (19x)** | Valid durasi (18 Sep = 797 menit; 21 Sep = 213+ menit) |
| **Logbook Harian (+3)** | 3 Poin (1 hari) | 102 Poin (34 hari) | **102 Poin (34 hari)** | **102 Poin (34 hari)** | 34 hari kegiatan unik @ 3 PTS |
| **TOTAL POIN INDIVIDU (SSOT)** | **129 Poin** | **228 Poin** | **232 POIN** | **235 POIN** | **Poin murni akademik 100% Sah** |
| Poin Proker Bocor | 0 Poin | 0 Poin | 0 Poin | 0 Poin | Bersih (tidak ada kebocoran proker kelompok) |
| Bonus Login | 0 Poin | 0 Poin | 0 Poin | 0 Poin | Bersih (tidak ada penggelembungan sistem) |
| Total Riwayat DB | 129 Poin | 228 Poin | **232 Poin** | **235 Poin** | Sinkron 100% antara DB dan Laporan CSV |
| Status Audit | Belum Lengkap | Review 18 Sep | **100% SINKRON** | **FINAL TERCAPAI** | Terverifikasi integritasnya |

---

## 5. DAMPAK TERHADAP SKOR KELOMPOK 8 SADANG SERANG

Dengan bertambahnya 99 poin logbook dan 4 poin presensi 18 September Zahira:
* **Total Saldo Tim Kelompok 8**: Naik menjadi **1.639 Poin**.
* **Rata-Rata Poin Anggota (40%)**: Menjadi **126.08 Poin**.
* **Poin Proker Kelompok (60%)**: **34.00 Poin** (dari 8 usulan proker yang disetujui dan terlaksana).
* **Skor Terbobot Kelompok (Dasbor Mobile)**: **70.83 Poin**.

---

## 6. TINDAKAN TEKNIS YANG TELAH DILAKSANAKAN

1. **Penerapan Golden Backup VPS**:
   - Backup Riwayat Poin 1 (Logbook): `/home/maker/golden_backup_riwayat_poin_1789966116155.sql`.
   - Backup Riwayat Poin 2 (Check-In 18 Sep): `/home/maker/golden_backup_riwayat_poin_1789967885062.sql`.
2. **Sinkronisasi Baris Poin Sah**:
   - 33 entri `KKN_LOGBOOK_HARIAN` (+99 PTS) untuk 33 tanggal kegiatan unik.
   - 1 entri `KKN_PRESENSI_HADIR` (+4 PTS) untuk tanggal 18 September 2026.
3. **Penyempurnaan Controller Mobile (`riwayat_kkn_controller.dart`)**:
   - Logika pembacaan memprioritaskan `tanggalKegiatan` di atas `createdAt`.
   - Menetapkan ID unik pada `scheduleId` untuk menjamin tidak ada riwayat yang hilang akibat deduplikasi.
4. **Regenerasi Dokumen Resmi**:
   - File master `Laporan_Data_Poin_dan_Penilaian_535_Mahasiswa_Berseka.csv` dan `Spreadsheet_Poin_dan_Penilaian_Mahasiswa.html` telah diperbarui pada baris No. 61.

---

## 7. KESIMPULAN & REKOMENDASI UNTUK TIM WC

1. **Status Zahira Nandhifa Syifarany (`44324016`) dinyatakan VALID dan LENGKAP dengan nilai saat ini 232 POIN dan akan menjadi 235 POIN setelah sesi hari ini selesai di-checkout**.
2. Seluruh perolehan poin didukung data operasional riil di database VPS (`psc_db`).
3. Tim WC dapat menggunakan data pada **Laporan Versi Terbaru (Baris 61)** sebagai dasar verifikasi kelulusan dan yudisium KKN.

---
*Dokumen ini diterbitkan secara resmi oleh Tim Pengembang & Tim Basis Data Berseka untuk kepentingan audit mutu dan validasi akademik KKN Tematik Berseka.*
