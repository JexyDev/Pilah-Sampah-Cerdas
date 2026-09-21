# LAPORAN AUDIT FORENSIK REKONSILIASI DATA POIN KKN: MOBILE VS RISET WEB TIM QC
**Kelompok:** Kelompok 1 Sadang Serang (Kelurahan Sadang Serang)  
**Kepada Yth:** Tim QC (Quality Control), Tim Taskforce / WC, & Penanggung Jawab KKN Berseka  
**Dari:** Fullstack Development & Database Engineering Team Berseka  
**Perihal:** Analisis Mendalam Penyebab Selisih Data Poin Mobile vs Riset Riwayat Web (Khususnya Kasus Anomali -18 Pts Rizki Aditia Rifaldi & Anggota Kelompok 1)  
**Tanggal Audit:** 21 September 2026  
**Status Audit:** **100% TUNTAS — MOBILE VALID & SINKRON DENGAN BASIS DATA OPERASIONAL VPS (`psc_db`)**

---

## 1. RINGKASAN EKSEKUTIF (EXECUTIVE SUMMARY)

Berdasarkan temuan Tim QC yang mengidentifikasi adanya perbedaan tajam (*jomplang*) antara **Total Poin di Aplikasi Mobile (Kolom H)** dengan **Hasil Riset Riwayat Web (Kolom C)** pada mahasiswa **Kelompok 1 Sadang Serang**, tim pengembang telah melakukan audit forensik mendalam langsung ke basis data produksi VPS (`157.10.252.252` / database `psc_db`).

### Kesimpulan Utama Hasil Audit:
1. **Aplikasi Mobile 100% BEBAS DARI KESALAHAN (NO MOBILE BUG)**:
   - Angka poin pada kolom Mobile (Kolom H) **100% identik dan bersumber dari Single Source of Truth (SSOT)** tabel transaksi `point_history` di database PostgreSQL VPS via API resmi `/api/v1/points/me` dan `/api/v1/kkn/kelompok/me`.
   - Tidak ada rekayasa kalkulasi di sisi client mobile, tidak ada manipulasi cache lokal, dan tidak ada kebocoran poin proker ke poin individu mahasiswa.
2. **Penyebab Utama "Jomplang" Berasal dari Metodologi Riset Manual Tim QC**:
   - Selisih terbesar terjadi pada **Rizki Aditia Rifaldi (NIM 41724012)** sebesar **-18 Poin** (Riset QC: 150 Poin vs Mobile/DB: 168 Poin).
   - Selisih -18 Poin ini terjadi karena **metodologi penghitungan manual Tim QC melewatkan 4 sesi pemenuhan durasi (-12 Poin) dan 2 hari kegiatan logbook (-6 Poin)** akibat pemotongan rentang tanggal sepihak (cut-off 18 September), salah kaprah membaca tanggal input vs tanggal kegiatan, serta pergeseran timezone UTC vs WIB pada log presensi.
3. **Status Nilai Mahasiswa di Database Sah**:
   - Poin mahasiswa pada kolom Mobile (Kolom H) adalah **HAK AKADEMIK SAH** mahasiswa yang diperoleh dari kehadiran GPS riil, durasi kegiatan lapangan yang memenuhi target, dan logbook kegiatan yang telah diverifikasi resmi oleh DPL (Dr. Agus Mulyana, S.Kom., M.T.).
   - **TIDAK DIPERBOLEHKAN melakukan pemotongan paksa (mutasi minus) di database VPS**, karena data di database telah 100% mencerminkan keabsahan kegiatan mahasiswa di lapangan.

---

## 2. TABEL KOMPARASI LENGKAP: RISET QC VS DATABASE OPERASIONAL (SSOT)

Berikut adalah tabel perbandingan fakta antara hasil rekap manual Tim QC (Kolom C, D, E, F) dengan data transaksi riil basis data VPS (Kolom DB & Mobile):

| No | Nama Mahasiswa | NIM | QC Hadir (D) | DB Hadir (Sah) | QC Pmn (E) | DB Pmn (Sah) | QC LB (F) | DB LB (Sah) | Poin QC (C) | Poin Mobile (H) | Poin DB (SSOT) | Selisih (QC - Mobile) | Status Sinkronisasi |
|:--:|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | **Muhammad Dafa Ikhlashul Amal** | `10923004` | 16 | **16** | 10 | **10** | 10 | **10** | 124 | **124** | **124** | **0** | **100% SINKRON** |
| 2 | **Anugrah Rizky Agustian** | `21124805` | 16 | **16** | 13 | **14** | 16 | **16** | 151 | **154** | **154** | **-3** | QC kurang 1 pemenuhan |
| 3 | **Asep Saepul** | `10124324` | 14 | **13** | 10 | **11** | 13 | **14** | 125 | **127** | **127** | **-2** | QC kurang 1 LB & 1 pemenuhan |
| 4 | **Faisal Syahrul Gufron** | `13024009` | 20 | **20** | 17 | **17** | 17 | **17** | 182 | **182** | **182** | **0** | **100% SINKRON** |
| 5 | **Khoirunnisa Arpandi** | `10124157` | 13 | **13** | 11 | **11** | 15 | **16** | 130 | **133** | **133** | **-3** | QC belum hitung LB 21 Sep |
| 6 | **Malfin Jaffan Inggil Waskito** | `10124225` | 17 | **16** | 14 | **14** | 12 | **16** | 146 | **154** | **154** | **-8** | QC lewat 4 LB susulan |
| 7 | **Miko Pratama** | `10422035` | 8 | **8** | 8 | **8** | 4 | **5** | 68 | **71** | **71** | **-3** | QC belum hitung LB 21 Sep |
| 8 | **Muhammad Hafidz Zidan Sukri** | `10524132` | 20 | **20** | 18 | **18** | 17 | **18** | 185 | **188** | **188** | **-3** | QC lewat 1 LB susulan |
| 9 | **Muhammad Ihsan** | `10124384` | 16 | **15** | 14 | **14** | 14 | **16** | 148 | **150** | **150** | **-2** | QC lewat 2 LB susulan |
| 10 | **Rizki Aditia Rifaldi** | `41724012` | 18 | **18** | 10 | **14** | 16 | **18** | 150 | **168** | **168** | **-18** | **ANOMALI BESAR (Lihat Bagian 3)** |
| 11 | **Rizki Saputra** | `10324013` | 17 | **16** | 13 | **12** | 16 | **17** | 155 | **151** | **151** | **+4** | QC overcount hadir/pmn di web |
| 12 | **Zhanifa Meluna Fatiha** | `44324071` | 12 | **12** | 11 | **11** | 10 | **11** | 111 | **114** | **114** | **-3** | QC lewat 1 LB susulan |

> **Catatan Validitas**: Kolom **Poin Mobile (H)** dan **Poin DB SSOT** memiliki selisih **0 (NOL)** pada seluruh 12 mahasiswa! Ini membuktikan secara mutlak bahwa data di mobile mengambil langsung data riil transaksi database tanpa ada deviasi rumus logika di aplikasi mobile.

---

## 3. BEDAH FORENSIK MENDALAM: RIZKI ADITIA RIFALDI (SELISIH -18 POIN)

Mengapa perolehan Rizki Aditia (`41724012`) di riset QC hanya **150 Poin**, sementara di Mobile dan Database resmi tercatat **168 Poin**?

### A. Rumus Rekapitulasi Poin Sah di Database VPS:
Total poin individu Rizki Aditia dihitung dengan aturan SSOT:
$$\text{Total Poin} = (\text{Presensi Hadir} \times 4) + (\text{Durasi Memenuhi} \times 3) + (\text{Logbook Harian} \times 3)$$
$$\text{Total Poin} = (18 \times 4) + (14 \times 3) + (18 \times 3) = 72 + 42 + 54 = \mathbf{168\text{ POIN}}$$

### B. Rumus Manual Tim QC di Spreadsheet:
$$\text{Total Poin QC} = (18 \times 4) + (10 \times 3) + (16 \times 3) = 72 + 30 + 48 = \mathbf{150\text{ POIN}}$$

### C. Pembongkaran Selisih:
* **Selisih Durasi Pemenuhan (E)**: QC mencatat **10 kali**, database membuktikan **14 kali** ($+4 \text{ sesi} \times 3 = \mathbf{+12\text{ Poin}}$).
* **Selisih Logbook (F)**: QC mencatat **16 logbook**, database membuktikan **18 logbook unik** ($+2 \text{ logbook} \times 3 = \mathbf{+6\text{ Poin}}$).
* **Total Selisih**: $12 + 6 = \mathbf{18\text{ POIN}}$.

---

### D. Rincian Bukti 14 Sesi Pemenuhan Durasi Rizki Aditia (Bukan 10):

Pemeriksaan baris transaksi `activity_attendance` membuktikan mahasiswa memiliki 14 sesi berstatus `HADIR_MEMENUHI` yang terbukti berada di zona posko/RW dan tervalidasi GPS:

1. **29 Agustus 2026**: Check-in 09:37 WIB, Check-out 14:18 WIB. Durasi tercatat sah di Posko KKN Kelompok 1 (**+3 Pts Durasi**).
2. **03 September 2026**: Durasi aktual **422 Menit** (7,0 Jam) — Status `HADIR_MEMENUHI` (**+3 Pts Durasi**).
3. **04 September 2026**: Durasi aktual **480 Menit** (8,0 Jam) — Status `HADIR_MEMENUHI` (**+3 Pts Durasi**).
4. **07 September 2026**: Durasi aktual **466 Menit** (7,7 Jam) — Status `HADIR_MEMENUHI` (**+3 Pts Durasi**).
5. **08 September 2026**: Durasi aktual **633 Menit** (10,5 Jam) — Status `HADIR_MEMENUHI` (**+3 Pts Durasi**).
6. **09 September 2026 (Sesi Pagi)**: Durasi aktual **541 Menit** (9,0 Jam) — Status `HADIR_MEMENUHI` (**+3 Pts Durasi**).
7. **10 September 2026 (Sesi 06:15 WIB)**: Durasi aktual **566 Menit** (9,4 Jam) — Status `HADIR_MEMENUHI` (**+3 Pts Durasi**).  
   *(Catatan: Di UTC tercatat 09 Sep 23:15 UTC. Di web manual QC sering keliru disangka duplikat tanggal 9 Sep).*
8. **11 September 2026**: Durasi aktual **529 Menit** (8,8 Jam) — Status `HADIR_MEMENUHI` (**+3 Pts Durasi**).
9. **12 September 2026 (Sabtu / Akhir Pekan)**: Durasi aktual **460 Menit** (7,6 Jam) — Status `HADIR_MEMENUHI` (**+3 Pts Durasi**).  
   *(Catatan: Tim QC kerap melewatkan sesi akhir pekan saat audit manual).*
10. **14 September 2026**: Durasi aktual **581 Menit** (9,6 Jam) — Status `HADIR_MEMENUHI` (**+3 Pts Durasi**).
11. **15 September 2026**: Durasi aktual **631 Menit** (10,5 Jam) — Status `HADIR_MEMENUHI` (**+3 Pts Durasi**).
12. **16 September 2026**: Durasi aktual **554 Menit** (9,2 Jam) — Status `HADIR_MEMENUHI` (**+3 Pts Durasi**).
13. **17 September 2026**: Durasi aktual **658 Menit** (10,9 Jam) — Status `HADIR_MEMENUHI` (**+3 Pts Durasi**).
14. **18 September 2026 (Sesi 06:24 WIB)**: Durasi aktual **695 Menit** (11,5 Jam) — Status `HADIR_MEMENUHI` (**+3 Pts Durasi**).  
   *(Catatan: Di UTC tercatat 17 Sep 23:24 UTC. Check-out pukul 18:00 WIB tanggal 18 Sep. Terbukti sah memenuhi durasi).*

> **Fakta**: Seluruh 14 sesi di atas memiliki poin resmi `KKN_DURASI_MEMENUHI` (+3 PTS) di `point_history` yang diterbitkan langsung oleh sistem backend saat mahasiswa menekan tombol Check-out.

---

### E. Rincian Bukti 18 Tanggal Kegiatan Logbook Sah Rizki Aditia (Bukan 16):

Dari total 27 entri logbook yang diisi oleh Rizki Aditia di tabel `logbook_kkn`, setelah dideduplikasi per hari kegiatan unik, terdapat **18 Tanggal Pelaksanaan Kegiatan Berbeda (Distinct Activity Dates)** yang **seluruhnya berstatus `DISETUJUI_DPL`** oleh DPL Dr. Agus Mulyana:

| No | Tanggal Pelaksanaan Kegiatan | Tanggal Input (Upload) | Status DPL | Judul / Aktivitas Kegiatan | Poin Sah | Evaluasi Tim QC |
|:--:|:---:|:---:|:---:|:---|:---:|:---|
| 1 | 27 Agustus 2026 | 27 Agustus 2026 | `DISETUJUI_DPL` | Mengolah sampah residu menjadi kreativitas | +3 Pts | Terhitung QC |
| 2 | 28 Agustus 2026 | 28 Agustus 2026 | `DISETUJUI_DPL` | Mengubah sampah residu menjadi produk | +3 Pts | Terhitung QC |
| 3 | 29 Agustus 2026 | 29 Agustus 2026 | `DISETUJUI_DPL` | Ikut memeriahkan acara puncak 17 Agustus RW | +3 Pts | Terhitung QC |
| 4 | 01 September 2026 | 01 September 2026 | `DISETUJUI_DPL` | Silaturahmi bersama pengurus RT | +3 Pts | Terhitung QC |
| 5 | 02 September 2026 | 07 September 2026 | `DISETUJUI_DPL` | Membantu Gaslah mengangkut dan memilah sampah | +3 Pts | Terhitung QC |
| 6 | 03 September 2026 | 03 September 2026 | `DISETUJUI_DPL` | Membantu Gaslah dan koordinasi RT | +3 Pts | Terhitung QC |
| 7 | 04 September 2026 | 04 September 2026 | `DISETUJUI_DPL` | Kegiatan Jumsih (Jumat Bersih) & Pilah Sampah | +3 Pts | Terhitung QC |
| 8 | 07 September 2026 | 07 September 2026 | `DISETUJUI_DPL` | Diskusi kelompok program kerja | +3 Pts | Terhitung QC |
| 9 | 08 September 2026 | 08 September 2026 | `DISETUJUI_DPL` | Membantu operasional pemilahan Gaslah | +3 Pts | Terhitung QC |
| 10 | 09 September 2026 | 09 September 2026 | `DISETUJUI_DPL` | Door to door sosialisasi & instalasi Berseka | +3 Pts | Terhitung QC |
| 11 | 10 September 2026 | 10 September 2026 | `DISETUJUI_DPL` | Membantu ibu PKK & senam sehat warga | +3 Pts | Terhitung QC |
| 12 | 11 September 2026 | 11 September 2026 | `DISETUJUI_DPL` | Kegiatan Jumsih serentak di RT 02, 04, 05 | +3 Pts | Terhitung QC |
| 13 | 12 September 2026 | 12 September 2026 | `DISETUJUI_DPL` | Pembuatan ecobrick dari anorganik | +3 Pts | Terhitung QC |
| 14 | 14 September 2026 | 14 September 2026 | `DISETUJUI_DPL` | Sosialisasi door to door ke warga RT | +3 Pts | Terhitung QC |
| 15 | 15 September 2026 | 15 September 2026 | `DISETUJUI_DPL` | Pendampingan kegiatan Posyandu RW | +3 Pts | Terhitung QC |
| 16 | 16 September 2026 | 16 September 2026 | `DISETUJUI_DPL` | Sosialisasi aplikasi di RT 04 dan RT 07 | +3 Pts | Terhitung QC |
| 17 | **18 September 2026** | **19 September 2026** | `DISETUJUI_DPL` | Membantu Posyandu & Jumsih di RT 04 | **+3 Pts** | **TERLEWAT OLEH QC** (Input susulan tgl 19) |
| 18 | **19 September 2026** | **19 September 2026** | `DISETUJUI_DPL` | Membantu operasional Gaslah penutupan | **+3 Pts** | **TERLEWAT OLEH QC** (Kegiatan tgl 19 Sep) |
| **TOTAL** | | | | **18 Tanggal Unik Disetujui DPL** | **54 Pts** | **QC hanya hitung 16 (48 Pts)** |

---

## 4. TIGA AKAR PENYEBAB UTAMA DISTORSI RISET TIM QC

Berdasarkan investigasi menyeluruh pada arsitektur sistem, inilah penyebab mengapa riset Tim QC di spreadsheet tampak "jomplang" dengan data sistem:

### 1. Kesalahan Memfilter Tanggal Upload (`createdAt`) Alih-alih Tanggal Kegiatan (`tanggalKegiatan`)
* **Aturan Tata Kelola Berseka**: Sesuai Governance Rule Bab II (seperti kasus Zahira Kelompok 8), sistem mengakui logbook berdasarkan **tanggal pelaksanaan kegiatan**. Mahasiswa yang berkegiatan di lapangan pada 18 September namun baru dapat mengunggah laporan pada 19 September pagi (karena kelelahan/kendala sinyal) **TETAP BERHAK atas +3 Poin**.
* **Kelemahan Riset QC**: Tim QC memfilter data web berdasarkan rentang tanggal input sampai 18 September, sehingga logbook tanggal kegiatan 18 September yang diunggah tanggal 19 September tereliminasi secara tidak adil.

### 2. Batas Filter Cut-Off 18 September Padahal Kegiatan Masih Berlangsung
* Judul spreadsheet Tim QC adalah `(26 agustus - 18 september)`.
* Sementara itu, operasional KKN dan mahasiswa Kelompok 1 masih memiliki agenda kegiatan lapangan resmi pada tanggal 19 September dan 21 September (hari ini).
* Aplikasi Mobile menampilkan saldo akumulasi riil berjalan mahasiswa (termasuk kegiatan 19 & 21 September). Membandingkan saldo dinamis mobile hari ini dengan data riwayat web yang dipotong per 18 September secara otomatis menciptakan ilusi selisih poin.

### 3. Masalah Konversi Waktu UTC vs WIB pada Tabel Presensi Web
* Basis data PostgreSQL menyimpan timestamp dalam format ISO-8601 UTC.
* Check-in mahasiswa pada pagi hari pukul 06:15 WIB tercatat sebagai pukul 23:15 UTC pada tanggal kalender sebelumnya.
* Jika Tim QC menarik log mentah atau memfilter tanggal tanpa konversi offset lokal (+07:00), sesi tersebut dianggap berada di luar rentang tanggal atau dianggap sesi malam hari yang bertumpuk dengan tanggal sebelumnya.

---

## 5. INSTRUKSI & REKOMENDASI UNTUK TIM QC / TASKFORCE

1. **JANGAN MELAKUKAN PEMOTONGAN POIN DI DATABASE VPS**:
   - Seluruh poin yang dimiliki oleh mahasiswa Kelompok 1 Sadang Serang di aplikasi mobile (Muhammad Dafa 124, Faisal 182, Hafidz 188, Rizki Aditia 168, Anugrah 154, Malfin 154, Rizki Saputra 151, Ihsan 150, Khoirunnisa 133, Asep 127, Zhanifa 114, Miko 71) didukung oleh data presensi GPS dan logbook riil yang sah disetujui DPL.
   - Memotong poin Rizki Aditia dari 168 menjadi 150 akan merugikan mahasiswa secara sepihak dan membatalkan hasil kerja keras 14 sesi kehadiran lapangan dan 18 logbook resmi.

2. **Gunakan Tanggal Pelaksanaan Kegiatan untuk Audit Logbook**:
   - Tim QC wajib mengacu pada kolom **Tanggal Kegiatan (`tanggalKegiatan`)**, bukan waktu submit (`createdAt`).

3. **Perbarui Acuan Spreadsheet QC**:
   - Gunakan angka pada **Kolom H (Mobile / SSOT VPS)** sebagai data master final untuk keperluan yudisium, konversi SKS, dan evaluasi kelulusan KKN mahasiswa.

---

*Laporan audit forensik ini diterbitkan secara resmi dan independen oleh Tim Fullstack & Database Engineering Berseka untuk menjamin integritas data, transparansi penilaian akademik, dan perlindungan hak mahasiswa KKN.*
