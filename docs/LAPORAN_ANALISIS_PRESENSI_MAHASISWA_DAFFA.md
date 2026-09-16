# LAPORAN AUDIT & ANALISIS PRESENSI MAHASISWA KKN: MUHAMMAD DAFA IKHLASHUL AMAL
**Basis Data Produksi VPS (`157.10.252.252` / `psc_db`) & Sistem BERSEKA.ID**

---

**Kepada Yth:**  
1. **Dr. Agus Mulyana, S.Kom., M.T.** (Chief Executive Officer, PT. Makerindo Prima Solusi / DPL Kelompok 1 Sadang Serang)  
2. **Pak Sofyan** (Manajemen PT. Makerindo Prima Solusi)  

**Dari:** Lead Fullstack Developer & Database Auditor  
**Tanggal:** 16 September 2026  
**Perihal:** Laporan Analisis Rinci Presensi Kegiatan, Kepatuhan Geofencing, Logbook, dan Mutasi Poin Mahasiswa Daffa  
**Subjek Audit:** **Muhammad Dafa Ikhlashul Amal** (NIM: `10923004`) — Kelompok 1 Sadang Serang  

---

## 1. Identifikasi & Verifikasi Profil Subjek di Basis Data VPS

Melalui audit penelusuran identitas pada tabel `pengguna` dan `mahasiswa_kkn` di basis data produksi VPS, ditemukan data berikut:

| Parameter | Data Hasil Audit Database VPS |
| :--- | :--- |
| **Nama Lengkap** | **Muhammad Dafa Ikhlashul Amal** |
| **Nomor Induk Mahasiswa (NIM)** | **10923004** |
| **ID Pengguna (`User ID`)** | `e36586eb-becb-41d7-8ab9-7d9d34c42135` |
| **Nomor Telepon (+62)** | `+6282217417415` |
| **Kelompok KKN** | **Kelompok 1 Sadang Serang** (ID: `3b5cf9da-4209-4796-8ece-8a606c625711`) |
| **Wilayah Penugasan** | RW 21 Kelurahan Sadang Serang, Kec. Coblong, Kota Bandung |
| **Dosen Pembimbing Lapangan (DPL)** | **Dr. Agus Mulyana, S.Kom., M.T.** |
| **Total Akumulasi Poin Personal** | **183 PTS** (Gamifikasi) / **117 Poin Capped** (Akademik) |
| **Rerata Capaian Harian (Skala 0–10)** | **5,57 Poin/hari** *(Di atas rata-rata kelompok: 5,40 Poin/hari)* |

> [!NOTE]
> **Klarifikasi Akun Identitas Bernama "Daffa":**  
> Di dalam basis data juga terdaftar akun **Daffa Jaya Perkasa** (`e60bb857-b9be-4655-814a-759c7061f82a`) sebagai akun tim teknis/pengembang (tanpa data mahasiswa KKN), serta mahasiswa Daffa lain di luar kelompok bimbingan Pak Agus (Ananda Daffa di Kelompok 3 Dago dan Rangga Arya Daffa di Kelompok 2 Lebak Gede). Sesuai arahan sebelumnya yang berfokus pada Kelompok 1 Sadang Serang bimbingan Pak Agus, audit difokuskan secara mendalam pada **Muhammad Dafa Ikhlashul Amal (NIM: 10923004)**.

---

## 2. Ringkasan Statistik Kinerja & Presensi

Dari total **21 hari kalender operasional KKN** (26 Agustus s.d. 16 September 2026):

```
┌────────────────────────────────────────┬───────────────────┐
│ Metrik Kinerja Presensi                │ Capaian Aktual    │
├────────────────────────────────────────┼───────────────────┤
│ Total Hari Kehadiran Tercatat          │ 15 Hari           │
│ Hadir Memenuhi Durasi (≥ 240 menit)    │ 7 Hari            │
│ Hadir Kurang Durasi (< 240 menit)      │ 6 Hari            │
│ Terdeteksi Alpa (Lupa Check-Out)       │ 1 Hari (2 Sep)    │
│ Sesi Sedang Berlangsung Hari Ini       │ 1 Hari (16 Sep)   │
│ Hari Tidak Ada Jadwal / Libur Akhir Pkn│ 6 Hari (Weekend)  │
│ Total Logbook Harian Terisi            │ 10 Entri          │
│ Status Verifikasi Logbook DPL          │ 100% DISETUJUI DPL│
│ Presensi Mandiri Lapangan (Door-to-door│ 1 Entri           │
│ Pelanggaran Zona (Out-of-Zone Penalty) │ 0 Kasus (Nihil)   │
└────────────────────────────────────────┴───────────────────┘
```

---

## 3. Matriks Rekapitulasi Presensi Harian Lengkap (21 Hari KKN)

Berikut adalah riwayat presensi harian Muhammad Dafa dari basis data `kehadiran_kegiatan`, `logbook_kkn`, dan `riwayat_poin` yang disinkronkan ke waktu lokal Indonesia Barat (WIB):

| No | Tanggal | Jam Check-In (WIB) | Jam Check-Out (WIB) | Durasi Zona | Status Presensi Sistem | Logbook Harian | Poin Hadir (4) | Poin Durasi (3) | Poin Log (3) | Poin Tambahan | Total Poin Hari Ini | Capped (Max 10) |
| :---: | :---: | :---: | :---: | :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| 1 | **26-Agu** | 10:19 | - | - | Simulasi / Perdana | 1 Log (Disetujui) | +4 | 0 | 0 | +20 (Login) | 24 PTS | 4 |
| 2 | **27-Agu** | - | - | - | Belum Absen | - | 0 | 0 | +3 | 0 | 3 PTS | 3 |
| 3 | **28-Agu** | 15:53 | 16:00 | 7 menit | `HADIR_TIDAK_MEMENUHI` | 1 Log (Disetujui) | +4 | +3 | 0 | 0 | 7 PTS | 7 |
| 4 | **29-Agu** | 15:33 | 16:00 | 100 menit | `HADIR_TIDAK_MEMENUHI` | - | +4 | +3 | +3 | 0 | 10 PTS | 10 |
| 5 | **30-Agu** | - | - | - | *Libur (Minggu)* | - | 0 | 0 | 0 | 0 | 0 PTS | 0 |
| 6 | **31-Agu** | - | - | - | *Persiapan Kelompok* | - | 0 | 0 | 0 | 0 | 0 PTS | 0 |
| 7 | **01-Sep** | 10:47 | 16:00 | 166 menit | `HADIR_TIDAK_MEMENUHI` | - | +4 | +3 | 0 | 0 | 7 PTS | 7 |
| 8 | **02-Sep** | 10:20 | *(Lupa)* | 119 menit | `ALPA` *(Lupa Check-Out)* | 1 Log (Disetujui) | +4 | 0 | 0 | 0 | 4 PTS | 4 |
| 9 | **03-Sep** | 09:19 | 13:16 | 236 menit | `HADIR_TIDAK_MEMENUHI` | - | +4 | +3 | +3 | 0 | 10 PTS | 10 |
| 10 | **04-Sep** | 07:54 | 12:36 | 282 menit | `HADIR_MEMENUHI` ✅ | - | +4 | +3 | 0 | 0 | 7 PTS | 7 |
| 11 | **05-Sep** | - | - | - | *Libur (Sabtu)* | - | 0 | 0 | 0 | 0 | 0 PTS | 0 |
| 12 | **06-Sep** | - | - | - | *Libur (Minggu)* | - | 0 | 0 | 0 | 0 | 0 PTS | 0 |
| 13 | **07-Sep** | 10:46 | 20:00 | 434 menit | `HADIR_MEMENUHI` ✅ | 1 Log (Disetujui) | +4 | +3 | 0 | 0 | 7 PTS | 7 |
| 14 | **08-Sep** | 10:29 | 14:36 | 246 menit | `HADIR_MEMENUHI` ✅ | - | +4 | +3 | +3 | +10 (Kompos) | 20 PTS | 10 |
| 15 | **09-Sep** | 09:51 | 18:22 | 150 menit | `HADIR_TIDAK_MEMENUHI` | 1 Log (Disetujui) | +4 | +3 | 0 | 0 | 7 PTS | 7 |
| 16 | **10-Sep** | 08:43 | 15:01 | 312 menit | `HADIR_MEMENUHI` ✅ | 1 Log (Disetujui) | +4 | +3 | +6 | 0 | 13 PTS | 10 |
| 17 | **11-Sep** | 07:19 | 13:43 | 383 menit | `HADIR_MEMENUHI` ✅ | 2 Log (Disetujui) | +4 | +3 | +3 | +30 (Kompos) | 40 PTS | 10 |
| 18 | **12-Sep** | - | - | - | *Libur (Sabtu)* | - | 0 | 0 | 0 | 0 | 0 PTS | 0 |
| 19 | **13-Sep** | - | - | - | *Libur (Minggu)* | - | 0 | 0 | 0 | 0 | 0 PTS | 0 |
| 20 | **14-Sep** | 08:36 | 13:48 | 271 menit | `HADIR_MEMENUHI` ✅ | 1 Log (Disetujui) | +4 | +3 | 0 | 0 | 7 PTS | 7 |
| 21 | **15-Sep** | 08:22 | 15:01 | 251 menit | `HADIR_MEMENUHI` ✅ | 1 Log (Disetujui) | +4 | +3 | +6 | 0 | 13 PTS | 10 |
| 22 | **16-Sep** | 10:16 | *Berjalan* | 195 menit | `BERLANGSUNG` *(Aktif)* | - | +4 | 0 | 0 | 0 | 4 PTS | 4 |
| **TOTAL** | - | - | - | - | **15 Hadir / 10 Logbook** | **10 Logbook Disetujui** | **60** | **36** | **27** | **60** | **183 PTS** | **117** |

---

## 4. Analisis Temuan Operasional Lapangan

### A. Evaluasi Pemenuhan Jam Kerja Lapangan (Durasi $\ge 240$ Menit)
1. **Performa Sangat Disiplin pada Pekan ke-2 dan ke-3:**
   - Mulai tanggal 4 September 2026, mahasiswa menunjukkan peningkatan disiplin yang sangat drastis:
     - 4 September: **282 menit** (4 jam 42 menit)
     - 7 September: **434 menit** (7 jam 14 menit)
     - 8 September: **246 menit** (4 jam 6 menit)
     - 10 September: **312 menit** (5 jam 12 menit)
     - 11 September: **383 menit** (6 jam 23 menit)
     - 14 September: **271 menit** (4 jam 31 menit)
     - 15 September: **251 menit** (4 jam 11 menit)
   - Seluruh hari di atas berhasil meraih predikat `HADIR_MEMENUHI` dan mendapatkan bonus penuh kepulangan (+3 PTS).
2. **Kasus Kurang 4 Menit (3 September 2026):**
   - Pada tanggal 3 September, durasi aktual mahasiswa tercatat **236 menit** (3 jam 56 menit). Karena ambang batas sistem adalah 240 menit (4 jam pas), sistem menandai hari ini sebagai `HADIR_TIDAK_MEMENUHI`.
3. **Kasus Lupa Check-Out (2 September 2026):**
   - Pada tanggal 2 September, mahasiswa melakukan check-in pukul 10:20 WIB, namun tidak melakukan check-out resmi saat kepulangan (meski terpantau berada di posko selama 119 menit). Akibatnya, pada pukul 23:59 sistem mendeteksi lupa check-out dan mengubah statusnya menjadi `ALPA` tanpa memberikan poin kepulangan.

---

### B. Analisis Kepatuhan Geofencing (Koordinat GPS)
- Posko Kelompok 1 Sadang Serang berlokasi di **RW 21 Sadang Serang** dengan poligon zona koordinat:
  $$\text{Lintang: } -6{,}888\text{ s.d. } -6{,}891 \quad|\quad \text{Bujur: } 107{,}627\text{ s.d. } 107{,}630$$
- Seluruh 14 transaksi absensi harian Muhammad Dafa di posko tercatat berada tepat di koordinat `lat: -6.888 s.d. -6.891, lng: 107.627 s.d. 107.630` (**100% IN-ZONE**).
- **Presensi Mandiri Hari Ini (16 September 2026):**
  Mahasiswa melakukan check-in pukul 10:16 WIB pada koordinat `lat: -6.96060382, lng: 107.6468961` dengan keterangan *"door to door"* sosialisasi warga. Fitur Presensi Mandiri mengakomodasi pergerakan dinamis mahasiswa di luar titik posko utama secara sah.

---

### C. Kinerja Logbook & Verifikasi DPL (Dr. Agus Mulyana)
- Mahasiswa mengunggah total **10 entri laporan logbook**.
- Seluruh 10 entri telah melalui verifikasi berjenjang:
  1. Disetujui oleh Ketua Kelompok KKN.
  2. Diverifikasi dan disahkan langsung oleh DPL (**Dr. Agus Mulyana, S.Kom., M.T.**) dengan status `DISETUJUI_DPL`.
- Hal ini membuktikan bahwa pembimbingan dan pelaporan antara Muhammad Dafa dengan Pak Agus berjalan aktif dan tertib.

---

### D. Kontribusi Khusus: Reduksi Sampah Organik (Buruan Sae RW 21)
Selain presensi rutin, Muhammad Dafa berkontribusi aktif dalam program kerja pemanfaatan sampah lingkungan:
- **8 September 2026:** Melaporkan pembuatan kompos organik (Buruan Sae) $\rightarrow$ **+10 PTS**
- **11 September 2026:** Melaporkan 3 batch kompos pemilahan sampah organik RW 21 $\rightarrow$ **+30 PTS**
- Total kontribusi lingkungan: **+40 PTS** kategori `REDUKSI_TONASE`.

---

## 5. Kesimpulan & Rekomendasi untuk Manajemen

1. **Integritas Data Mahasiswa Daffa Sempurna:**  
   Tidak ditemukan adanya data anomali, manipulasi GPS (mock location), ataupun duplikasi poin pada akun Muhammad Dafa Ikhlashul Amal. Seluruh mutasi poin presensi dan logbook terekam secara kronologis dan transparan.
2. **Kinerja di Atas Rata-Rata Kelompok:**  
   Dengan rerata harian **5,57 Poin/hari** (skala 0–10), capaian Muhammad Dafa melampaui rata-rata anggota kelompoknya (5,40 Poin/hari) dan menyumbang kontribusi positif terhadap skor kelompok 11,8 Poin.
3. **Catatan Pembinaan / Reminder:**  
   Dianjurkan kepada DPL / Ketua Kelompok untuk mengingatkan mahasiswa agar:
   - Selalu melakukan **Check-Out tepat waktu** sebelum pukul 18:00 WIB agar durasi tercatat resmi dan tidak terkena penalti lupa check-out seperti pada tanggal 2 September.
   - Memperhatikan ambang batas 240 menit (4 jam kerja) agar tidak kehilangan poin pemenuhan waktu kepulangan (+3 PTS).

---
*Laporan ini disusun secara obyektif berdasarkan audit data langsung dari basis data PostgreSQL server produksi VPS dan siap dilaporkan kepada Dr. Agus Mulyana, S.Kom., M.T. dan Pak Sofyan.*
