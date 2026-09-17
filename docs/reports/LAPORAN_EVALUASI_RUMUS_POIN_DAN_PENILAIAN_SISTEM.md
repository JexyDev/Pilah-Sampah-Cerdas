# LAPORAN EVALUASI RUMUS POIN DAN PENILAIAN SISTEM BERSEKA
**Panduan Lengkap Rumus Matematika Sederhana & Pertanyaan Kritis untuk Evaluasi Manajemen**

* **Tanggal Dokumen:** 17 September 2026  
* **Penyusun:** Fullstack Developer (Tim Teknis Berseka)  
* **Tujuan Dokumen:** Bahan Paparan Evaluasi Sistem Bersama Pimpinan / Atasan  
* **Status Rumus:** Berdasarkan Implementasi Aktif di Codebase Backend & Web Admin  

---

## DAFTAR ISI
1. [Daftar Pertanyaan Kritis Sebelum Menghadap Atasan](#1-daftar-pertanyaan-kritis-sebelum-menghadap-atasan)
2. [Sistem Poin Warga (Setor Sampah Cerdas & AI Vision)](#2-sistem-poin-warga-setor-sampah-cerdas--ai-vision)
3. [Sistem Poin Mahasiswa KKN (Presensi Harian & Batas Maksimal)](#3-sistem-poin-mahasiswa-kkn-presensi-harian--batas-maksimal)
4. [Sistem Poin Program Kerja (3 Tahapan Proker KKN)](#4-sistem-poin-program-kerja-3-tahapan-proker-kkn)
5. [Sistem Poin Kelompok KKN (Bobot 60% : 40%)](#5-sistem-poin-kelompok-kkn-bobot-60--40)
6. [Sistem Poin DPL (Dosen Pembimbing Lapangan)](#6-sistem-poin-dpl-dosen-pembimbing-lapangan)
7. [Sistem Poin Petugas Residu (Pengangkutan & TPS3R)](#7-sistem-poin-petugas-residu-pengangkutan--tps3r)
8. [Sistem Penilaian Akademik Mahasiswa (Komposit MPL 50% + DPL 50%)](#8-sistem-penilaian-akademik-mahasiswa-komposit-mpl-50--dpl-50)
9. [Metrik & Formula Analisis Sistem (Dasbor Eksekutif)](#9-metrik--formula-analisis-sistem-dasbor-eksekutif)
10. [Rangkuman Matriks & Rekomendasi Keputusan Hari Ini](#10-rangkuman-matriks--rekomendasi-keputusan-hari-ini)

---

## 1. DAFTAR PERTANYAAN KRITIS SEBELUM MENGHADAP ATASAN
*(Gunakan 5 pertanyaan strategis ini saat membuka sesi diskusi evaluasi agar atasan melihat ketajaman analisa Anda terhadap risiko bisnis, keadilan sistem, dan operasional lapangan)*

### Pertanyaan 1: Kelayakan Finansial & Potensi Kebocoran Kas (Poin Warga)
> *"Poin warga bernilai riil (1 Poin = Rp 100). Jika seorang warga rajin menyetor sampah 10 liter per hari, ia bisa memperoleh ~1.000 Poin atau Rp 100.000 per hari. Apakah sudah ada batas maksimal pencairan uang kas per RW per bulan agar kas subsidi operasional tidak jebol?"*

### Pertanyaan 2: Keadilan Formula Kelompok KKN (Bobot 60% : 40%)
> *"Pada formula Poin Kelompok, bobot Program Kerja adalah 60% dan Rata-rata Anggota adalah 40%. Apakah adil bagi kelompok yang anggotanya sangat rajin turun ke warga setiap hari (absen dan logbook 100%), namun skor kelompoknya tertinggal hanya karena mereka hanya memiliki 1 program kerja besar yang terfokus?"*

### Pertanyaan 3: Logika Nilai DPL yang Terlalu Sederhana (Sistem Biner)
> *"Komponen logbook DPL saat ini bernilai biner: jika mengisi minimal 1 logbook langsung mendapat nilai maksimal 6 Poin, jika tidak mengisi mendapat 0 Poin. Apakah ini adil untuk membedakan DPL yang sangat rajin membimbing (mengisi 10 kali logbook) dengan DPL yang hanya mengisi formalitas 1 kali saja?"*

### Pertanyaan 4: Penguncian Penilaian Akademik Otomatis
> *"Saat ini nilai kehadiran dan logbook mahasiswa dihitung otomatis oleh sistem database. Apakah kita perlu mengunci tombol 'Finalisasi Nilai' milik DPL jika mahasiswa tersebut belum memenuhi syarat minimal 80% kehadiran atau belum mencapai 24 logbook?"*

### Pertanyaan 5: Verifikasi Fisik vs Deteksi AI Vision
> *"AI Vision menghitung estimasi berat sampah menggunakan rumus massa jenis (Organik = 0.4 kg per liter, Anorganik = 0.2 kg per liter). Bagaimana mekanisme rekonsiliasi jika timbangan fisik asli milik Petugas Residu TPS3R di lapangan berbeda cukup jauh dari hasil estimasi AI?"*

---

## 2. SISTEM POIN WARGA (SETOR SAMPAH CERDAS & AI VISION)

### Penjelasan Konsep
Warga memilah sampah di rumah, lalu membawanya ke **Tempat Sampah Cerdas** terdaftar. Warga membuka aplikasi HP, memindai QR Code Tempat Sampah, dan memotret isi sampah. AI akan mendeteksi jenis sampah dan tingkat keyakinan (confidence). Poin dihitung otomatis oleh server.

### Rumus Perhitungan Poin

```text
Poin Warga = Volume (Liter) x Tarif Dasar x Pengali Waktu x Akurasi AI
```

### Keterangan Komponen:
1. **Volume (Liter):** Banyaknya sampah yang disetor dalam satuan Liter.
2. **Tarif Dasar:** Standar sistem adalah **100**.
3. **Pengali Waktu (Kepatuhan Jam Misi):**
   * **Tepat Waktu (Jam Misi):** Jam 06.00–08.00 WIB atau 16.00–18.00 WIB $\rightarrow$ **Pengali = 1.0 (100% Poin)**
   * **Terlambat (Di Luar Jam Misi):** Di luar jam di atas $\rightarrow$ **Pengali = 0.3 (Diskon Keterlambatan 70%, hanya dapat 30% Poin)**
4. **Akurasi AI (Confidence):** Nilai desimal antara **0.0 sampai 1.0** dari hasil pemindaian foto AI. Jika foto buram atau meragukan, pengali mengecil.
5. **Syarat Akun:** Warga wajib berstatus aktif penuh (`FULLY_ACTIVE`). Jika belum terverifikasi, poin bernilai 0.

### Contoh Perhitungan Sederhana:
* **Kasus 1 (Rajin Pagi Hari):**  
  Ibu Siti membuang sampah **2 Liter** pada pukul **07.15 WIB** (tepat waktu, pengali = 1.0). Foto sangat jelas, AI yakin **95% (0.95)**.  
  `Poin = 2 x 100 x 1.0 x 0.95 = 190 Poin`

* **Kasus 2 (Terlambat Siang Hari):**  
  Pak Budi membuang sampah **2 Liter** pada pukul **13.00 WIB** (di luar jadwal, pengali = 0.3). Foto sangat jelas, AI yakin **95% (0.95)**.  
  `Poin = 2 x 100 x 0.3 x 0.95 = 57 Poin`

### Bonus & Nilai Tukar Uang:
* **Bonus Konsisten 5 Hari Berturut-turut:** Tambahan **+10 Poin**.
* **Bonus Ide Daur Ulang Disetujui RW:** Tambahan **+50 Poin**.
* **Konversi ke Saldo E-Wallet:**  
  ```text
  Uang Tunai / E-Wallet (Rupiah) = Total Poin x Rp 100
  ```
  *(Contoh: 190 Poin = Rp 19.000)*

---

## 3. SISTEM POIN MAHASISWA KKN (PRESENSI HARIAN)

### Penjelasan Konsep
Mahasiswa KKN mendapatkan poin individu harian dari kedisiplinan beraktivitas di posko dan wilayah penugasan. Untuk mencegah kecurangan (*anti-overawarding*), sistem membatasi pendapatan maksimal mahasiswa adalah **10 Poin per hari**.

### Rumus Poin Harian Mahasiswa

```text
Total Poin Harian Mahasiswa = Poin Kehadiran + Poin Durasi Kerja + Poin Logbook
```

### Rincian Pembagian Poin Harian:
1. **Poin Kehadiran Datang (+4 Poin):**  
   Mahasiswa melakukan absensi masuk tepat waktu di dalam batas wilayah posko (radius GPS maksimal 100 meter dari posko).
2. **Poin Pemenuhan Durasi Kerja (+3 Poin):**  
   Mahasiswa melakukan absensi pulang (check-out) dan memenuhi minimal jam kerja lapangan (minimal 4 jam kerja).
3. **Poin Pengisian Logbook (+3 Poin):**  
   Mahasiswa mencatat laporan aktivitas kegiatan lapangan di aplikasi pada hari tersebut.

```text
Maksimal Poin Harian = 4 + 3 + 3 = 10 Poin per hari
```

---

## 4. SISTEM POIN PROGRAM KERJA (3 TAHAPAN PROKER KKN)

### Penjelasan Konsep
Setiap 1 Program Kerja (Proker) memiliki 3 siklus hidup (*3-Step Lifecycle*). Setiap kali status program kerja diperbarui di aplikasi, **seluruh mahasiswa di kelompok tersebut** otomatis mendapatkan tambahan poin yang adil.

### Tabel Perolehan Poin Proker:

| Tahapan Proker | Status di Sistem | Tambahan Poin | Total Akumulasi |
| :--- | :--- | :---: | :---: |
| **Tahap 1: Usulan Disetujui** | Usulan disetujui DPL di sistem | **+2 Poin** | 2 Poin |
| **Tahap 2: Sedang Dikerjakan** | Mahasiswa menekan tombol "Mulai Dikerjakan" | **+2 Poin** | 4 Poin |
| **Tahap 3: Tuntas Selesai** | Mahasiswa menekan tombol "Selesaikan" | **+2 Poin** | 6 Poin |

*Catatan Teknis:* Sistem dilengkapi penangkal duplikasi (*idempotent safe*). Jika tombol ditekan berulang kali saat sinyal buruk, poin tidak akan terduplikasi.

---

## 5. SISTEM POIN KELOMPOK KKN (BOBOT 60% : 40%)

### Penjelasan Konsep
Banyak kesalahpahaman mengira Poin Kelompok adalah hasil penjumlahan total poin anggota. Ini **keliru**.  
Poin Kelompok adalah **Skor Evaluasi Terbobot** yang menggabungkan kuantitas dan progres program kerja (60%) dengan rata-rata keaktifan harian seluruh anggota tim (40%).

### Rumus Poin Kelompok

```text
Poin Kelompok = (Poin Proker x 0.6) + (Rata-rata Poin Anggota x 0.4)
```

### Cara Menghitung Dua Komponen Tersebut:
1. **Menghitung Poin Proker:**
   * Setiap Proker Disetujui (belum jalan) bernilai **2 Poin**
   * Setiap Proker Sedang Berjalan bernilai **4 Poin**
   * Setiap Proker Tuntas Selesai bernilai **6 Poin**
   ```text
   Poin Proker = (Jumlah Proker Disetujui x 2) + (Jumlah Proker Berjalan x 4) + (Jumlah Proker Selesai x 6)
   ```
2. **Menghitung Rata-rata Poin Anggota:**
   ```text
   Rata-rata Poin Anggota = Total Seluruh Poin Anggota Kelompok / Jumlah Mahasiswa
   ```

### Contoh Simulasi Nyata:
Kelompok KKN memiliki **10 orang mahasiswa**.  
* **Progres Proker Kelompok:**
  * 1 proker baru disetujui: `1 x 2 = 2 Poin`
  * 1 proker sedang berlangsung: `1 x 4 = 4 Poin`
  * 2 proker sudah selesai: `2 x 6 = 12 Poin`  
  * **Total Poin Proker** = `2 + 4 + 12 = 18 Poin`
* **Keaktifan Anggota:**  
  Rata-rata poin harian anggota kelompok adalah **8 Poin**.
* **Perhitungan Poin Kelompok Akhir:**
  ```text
  Bagian Proker  = 18 x 0.6 = 10.8
  Bagian Anggota =  8 x 0.4 =  3.2
  --------------------------------- +
  Poin Kelompok  = 10.8 + 3.2 = 14 Poin
  ```

---

## 6. SISTEM POIN DPL (DOSEN PEMBIMBING LAPANGAN)

### Penjelasan Konsep
Poin DPL mengukur keaktifan bimbingan Dosen Pembimbing Lapangan terhadap kinerja kelompok mahasiswa yang dibimbingnya dengan rasio seimbang 50% : 50%.

### Rumus Poin DPL

```text
Poin DPL = (Poin Logbook DPL x 0.5) + (Poin Kelompok x 0.5)
```

### Keterangan Komponen:
1. **Poin Logbook DPL (Biner Keaktifan):**
   * Jika DPL sudah pernah mengisi logbook bimbingan lapangan ($\ge 1$ kali) $\rightarrow$ bernilai **6 Poin**
   * Jika DPL belum pernah mengisi logbook bimbingan (0 kali) $\rightarrow$ bernilai **0 Poin**
2. **Poin Kelompok:** Nilai Poin Kelompok terbobot dari kelompok yang diampu DPL tersebut.

### Contoh Perhitungan:
* **Skenario A (DPL Aktif Mengisi Logbook, Poin Kelompok = 14):**  
  `Poin DPL = (6 x 0.5) + (14 x 0.5) = 3.0 + 7.0 = 10 Poin`
* **Skenario B (DPL Pasif Belum Mengisi Logbook, Poin Kelompok = 14):**  
  `Poin DPL = (0 x 0.5) + (14 x 0.5) = 0 + 7.0 = 7 Poin`

---

## 7. SISTEM POIN PETUGAS RESIDU (PENGANGKUTAN & TPS3R)

### Penjelasan Konsep
Petugas Residu dinilai berdasarkan **beban fisik riil**: menimbang sampah di Tempat Sampah / TPS3R, mengunggah foto timbangan yang valid, dan menuntaskan rute pengangkutan harian di wilayah RT/RW penugasan.

### Rumus Poin Input Timbangan

```text
Poin Input = (Berat Sampah dalam Kg x 2) + Bonus Foto Bukti Valid (10 Poin)
```

### Rumus Poin Total Harian Petugas

```text
Total Poin Harian = Penjumlahan Seluruh Poin Input + Bonus Tuntas Rute (50 Poin)
```

### Keterangan Komponen:
1. **Poin Berat Fisik:** Setiap **1 Kg** sampah ditimbang bernilai **+2 Poin**.
2. **Bonus Foto Bukti:** Mengunggah foto jarum/angka timbangan yang jelas bernilai **+10 Poin**.
3. **Bonus Ketuntasan Rute (Daily Completion):** Jika petugas berhasil mendatangi dan menimbang 100% titik Tempat Sampah di jadwal penugasannya pada hari itu, mendapat bonus **+50 Poin**.

### Contoh Perhitungan Nyata:
Petugas menimbang sampah residu seberat **14.5 Kg** dan mengunggah foto timbangan valid:  
`Poin Input = (14.5 x 2) + 10 = 29 + 10 = 39 Poin`

---

## 8. SISTEM PENILAIAN AKADEMIK MAHASISWA (KOMPOSIT MPL 50% + DPL 50%)

### Penjelasan Konsep
Nilai akhir mata kuliah KKN dihitung adil menggabungkan penilaian lapangan oleh **Mitra Pembimbing Lapangan (MPL / Ketua RW)** dengan penilaian akademik oleh **Dosen Pembimbing Lapangan (DPL)**.

### Rumus Nilai Akhir Mahasiswa

```text
Nilai Akhir = (Subtotal Nilai Mitra x 0.5) + (Subtotal Nilai DPL x 0.5)
```

### A. Rincian 8 Aspek Penilaian Mitra Lapangan (MPL / RW) - Total Bobot 100%
1. **Kehadiran Lapangan (Bobot 15%):**  
   *Dihitung otomatis oleh sistem* dari pemenuhan jam kerja dan radius GPS di posko.
2. **Pendampingan Warga Binaan (Bobot 15%):**  
   *Dihitung otomatis oleh sistem* dari jumlah Tempat Sampah warga yang berhasil diaktivasi.
3. **Pelaksanaan Program Kerja (Bobot 15%):** Dinilai manual oleh Mitra (skala 0–100).
4. **Komunikasi & Etika Sosial (Bobot 10%):** Dinilai manual oleh Mitra (skala 0–100).
5. **Tanggung Jawab & Disiplin (Bobot 10%):** Dinilai manual oleh Mitra (skala 0–100).
6. **Kelengkapan Bukti Kegiatan (Bobot 10%):** Dinilai manual oleh Mitra (skala 0–100).
7. **Dampak Nyata Lingkungan RW (Bobot 15%):** Dinilai manual oleh Mitra (skala 0–100).
8. **Inisiatif & Kreativitas (Bobot 10%):** Dinilai manual oleh Mitra (skala 0–100).

### B. Rincian 6 Aspek Penilaian Akademik Dosen (DPL) - Total Bobot 100%
1. **Perencanaan Program Kerja (Bobot 20%):** Dinilai manual oleh DPL (skala 0–100).
2. **Kontribusi Individu Mahasiswa (Bobot 10%):** Dinilai manual oleh DPL (skala 0–100).
3. **Kepatuhan Logbook Harian (Bobot 20%):**  
   *Dihitung otomatis oleh sistem* dengan target resmi 24 logbook disetujui:  
   ```text
   Skor Logbook = (Jumlah Logbook Disetujui DPL / 24) x 100
   ```
   *(Contoh: Jika memiliki 24 logbook disetujui, skor = 100. Jika 18 logbook disetujui, skor = 75)*
4. **Analisis & Pemecahan Masalah (Bobot 20%):** Dinilai manual oleh DPL (skala 0–100).
5. **Kualitas Output / Luaran Nyata (Bobot 20%):** Dinilai manual oleh DPL (skala 0–100).
6. **Laporan Akhir & Refleksi (Bobot 10%):** Dinilai manual oleh DPL (skala 0–100).

### C. Tabel Konversi Huruf Mutu Akademik

| Rentang Nilai Akhir | Huruf Mutu | Kategori Keterangan |
| :---: | :---: | :--- |
| **80.00 – 100.00** | **A** | Sangat Memuaskan / Istimewa |
| **70.00 – 79.99** | **B** | Baik / Memuaskan |
| **60.00 – 69.99** | **C** | Cukup |
| **50.00 – 59.99** | **D** | Kurang |
| **Di bawah 50.00** | **E** | Tidak Lulus |

---

## 9. METRIK & FORMULA ANALISIS SISTEM (DASBOR EKSEKUTIF)

Modul **Analisis Sistem** di Web Dashboard Pimpinan menyajikan indikator kinerja makro wilayah:

### A. Indikator Kinerja KKN (5 Pilar)
1. **Kepatuhan Lokasi Presensi (Geofence Compliance):**
   ```text
   Kepatuhan Geofence (%) = (Jumlah Absen Dalam Posko / Total Seluruh Absen) x 100%
   ```
2. **Skor Kinerja Posko (Peringkat Top 5 Kelompok KKN):**
   ```text
   Skor Kinerja = (Rasio Proker Selesai x 40) + Skor Logbook (Maks 30) + Skor Mahasiswa (Maks 30)
   ```
   *Di mana Skor Logbook dihitung dari `(Total Logbook Kelompok / 300) x 30` dan Skor Mahasiswa dihitung dari `Jumlah Mahasiswa x 2`.*

### B. Indikator Tata Kelola Sampah (4 Pilar)
1. **Rasio Warga Aktif Pilah Sampah:**
   ```text
   Rasio Warga Aktif (%) = (Warga yang Setor Sampah 30 Hari Terakhir / Total Warga Terdaftar) x 100%
   ```
2. **Tingkat Kritisitas Tempat Sampah:**
   ```text
   Kritisitas (%) = (Volume Terisi Saat Ini / Kapasitas Maksimal Tempat Sampah) x 100%
   ```
   * Status **Normal:** Volume di bawah 70%
   * Status **Waspada:** Volume 70% sampai 89%
   * Status **Kritis (Perlu Dijemput):** Volume mencapai $\ge$ 90%
3. **Pemanfaatan Sampah Lokal (Waste Utilization Rate):**
   ```text
   Pemanfaatan Sampah (%) = (Sampah Berhasil Terolah di Fasilitas / Total Sampah Masuk) x 100%
   ```
4. **Estimasi Penurunan Emisi Karbon (Dampak Lingkungan Hijau):**
   ```text
   Reduksi Emisi CO2 (Kg CO2e) = (Kg Sampah Organik x 0.58) + (Kg Sampah Anorganik x 1.45)
   ```
   *Menghitung kontribusi nyata pemilahan sampah terhadap penurunan efek gas rumah kaca.*

---

## 10. RANGKUMAN MATRIKS & REKOMENDASI KEPUTUSAN HARI INI

### Tabel Rangkuman Seluruh Formula

| Entitas Pengguna | Rumus Matematika Inti | Batas Maksimal | Manfaat & Dampak |
| :--- | :--- | :---: | :--- |
| **Warga** | `Volume x 100 x Pengali Jadwal x Akurasi AI` | Tidak ada | Mendorong pemilahan tepat waktu di rumah |
| **Mahasiswa KKN** | `Absen(4) + Jam Kerja(3) + Logbook(3)` | 10 Poin / hari | Menjaga kedisiplinan harian lapangan |
| **Program Kerja** | `Disetujui(+2) + Berjalan(+2) + Selesai(+2)` | 6 Poin / proker | Mendorong eksekusi nyata program kerja |
| **Kelompok KKN** | `(Poin Proker x 0.6) + (Rerata Anggota x 0.4)` | Dinamis | Mengutamakan kerja tim di atas individu |
| **DPL** | `(Logbook DPL x 0.5) + (Poin Kelompok x 0.5)` | Dinamis | Mendorong dosen rutin membimbing |
| **Petugas Residu** | `(Kg x 2) + Foto(10) + Rute Tuntas(50)` | Dinamis | Apresiasi beban kerja fisik pengangkutan |
| **Nilai Akademik** | `(Subtotal Mitra x 50%) + (Subtotal DPL x 50%)` | 100 (Nilai A) | Transparansi kelulusan mata kuliah KKN |
| **Emisi Karbon** | `(Organik x 0.58) + (Anorganik x 1.45)` | Kg CO2e | Laporan indikator hijau ke DLH Kota |

---

### Rekomendasi Keputusan untuk Disahkan Atasan Hari Ini:
1. **Persetujuan Label Aplikasi Mobile:**  
   Menyepakati bahwa kartu Poin Kelompok di aplikasi mahasiswa dan DPL secara resmi berlabel **"Formula Poin Terbobot (60% Proker + 40% Rata-rata Anggota)"**, bukan penjumlahan total poin anggota.
2. **Pemberlakuan Plafon Penukaran Poin Warga:**  
   Menetapkan batasan maksimal pencairan e-wallet bulanan per RW (misalnya maksimal Rp 500.000 per warga per bulan) untuk menjaga stabilitas anggaran kas Bank Sampah.
3. **Pemberlakuan Syarat Kelulusan Otomatis:**  
   Menyetujui bahwa sistem otomatis mengunci nilai akhir jika mahasiswa memiliki persentase kehadiran di bawah 80% atau logbook disetujui kurang dari 24 entri.
