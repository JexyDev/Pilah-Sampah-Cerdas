# 🧪 LAPORAN PENGUJIAN KUALITAS, AUDIT DATA, & PANDUAN TESTING QC BERSEKA
**Tanggal Pengujian:** 17 September 2026  
**Penyusun:** Fullstack Developer (Backend & Web Lead)  
**Target Pembaca:** Tim Quality Control (QC) & Quality Assurance (QA)  
**Tujuan Dokumen:** Panduan formal verifikasi kelayakan rilis (*Release Candidate Acceptance*) mencakup hasil implementasi rapat koordinasi, audit formula penilaian, dan integrasi aplikasi mobile.

---

## 📌 DAFTAR ISI
1. [Ringkasan Eksekutif Pengujian (QC Overview)](#1-ringkasan-eksekutif-pengujian-qc-overview)
2. [Kategori I: Pengujian Fitur Hasil Diskusi Meet (7 Agenda Notulensi)](#2-kategori-i-pengujian-fitur-hasil-diskusi-meet-7-agenda-notulensi)
   - 2.1. Multi-Role Switcher (Opsi A)
   - 2.2. Normalisasi & Simulasi Formula Poin Mahasiswa KKN
   - 2.3. Portal Mandiri MPL (Mitra Pembimbing Lapangan)
   - 2.4. Dashboard Eksekutif KKN: Peta GIS & Tempat Sampah Teraktivasi
   - 2.5. Penamaan Petugas Mobile Berdasarkan Wilayah
   - 2.6. Optimasi Web Mobile Mahasiswa (iOS Safari & Presensi)
   - 2.7. Integritas Database VPS & Kebijakan Anti-Dummy Seed
3. [Kategori II: Matriks Audit Rumus Penilaian & Integrasi Mobile](#3-kategori-ii-matriks-audit-rumus-penilaian--integrasi-mobile)
   - 3.1. Audit Rumus Gamifikasi & Batas Maksimal (*Anti-Cheat*)
   - 3.2. Audit Rumus Penilaian Akademik KKN (Mitra 50% + DPL 50%)
   - 3.3. Verifikasi Koreksi Backend: Poin Proker Dashboard Mahasiswa
   - 3.4. Checklist Verifikasi 4 Anomali Kritis Sisi Mobile (Flutter)
4. [Tabel Skenario Pengujian QC (Detailed Test Cases Suite)](#4-tabel-skenario-pengujian-qc-detailed-test-cases-suite)
5. [Prosedur Validasi Lingkungan Produksi VPS (`157.10.252.252`)](#5-prosedur-validasi-lingkungan-produksi-vps-15710252252)
6. [Lembar Persetujuan & Sign-Off Rilis QC](#6-lembar-persetujuan--sign-off-rilis-qc)

---

## 1. Ringkasan Eksekutif Pengujian (QC Overview)

Per tanggal **17 September 2026**, seluruh kode backend API dan web frontend telah diperbarui dan lulus verifikasi kompilasi TypeScript (`tsc --noEmit`) serta pengujian otomatis Prisma. Laporan ini disusun khusus bagi Tim QC untuk melakukan pengujian fungsional (*Functional Testing*), pengujian batas nilai (*Boundary Testing*), serta pengujian integrasi antarmuka web dan mobile.

### Lingkungan Pengujian:
* **Backend API Live VPS:** `http://157.10.252.252:5000` (atau via reverse proxy HTTPS)
* **Web Admin Frontend:** Branch `main` / `development`
* **Mobile Engine:** Flutter App (Target Android & iOS)

---

## 2. Kategori I: Pengujian Fitur Hasil Diskusi Meet (7 Agenda Notulensi)

---

### 2.1. Multi-Role Switcher (Opsi A: Active Role Switcher)
* **Deskripsi:** Pengguna dengan multi-peran (misal Dosen DPL yang juga bertindak sebagai Mitra MPL, atau pengembang DEVELOPER) dapat beralih antarmuka dan hak akses secara instan tanpa logout.
* **Komponen yang Diuji:**
  - Endpoint `POST /api/v1/auth/switch-role` dengan header `Authorization: Bearer <token>`.
  - Komponen frontend `RoleSwitcher.tsx` di pojok kanan atas navbar header.
  - Pembaruan hak akses menu sidebar secara dinamis sesuai peran aktif.
* **Kriteria Lulus (Pass Criteria):**
  1. Klik tombol peran di navbar menampilkan dropdown peran yang diizinkan untuk akun tersebut.
  2. Saat memilih peran baru, muncul notifikasi sukses hijau, token JWT diperbarui, dan halaman otomatis diarahkan ke rute portal peran target.
  3. Akun `DEVELOPER` / `SUPER_USER` dapat berganti ke seluruh peran operasional (DPL, MPL, Pimpinan, Camat, Lurah, RW, Petugas).

---

### 2.2. Normalisasi & Simulasi Formula Poin Mahasiswa KKN
* **Deskripsi:** Menghitung poin evaluasi kelompok KKN menggunakan formula resmi 60% Capaian Internal + 40% Kinerja Ekosistem:
  $$\text{Poin Akhir} = (\text{Komponen A} \times 0.6) + (\text{Komponen B} \times 0.4)$$
  Di mana:
  - $\text{Komponen A} = \frac{\text{Rerata Step Proker} + \text{Rerata Skor Anggota}}{2}$
  - $\text{Komponen B} = \frac{\sum \text{Komponen A Seluruh Kelompok}}{\text{Total Kelompok}}$
* **Halaman Pengujian:** URL `/developer/poin-mahasiswa-kkn` (`PROGRAM KKN` $\rightarrow$ `Simulasi Poin KKN`).
* **Kriteria Lulus (Pass Criteria):**
  1. Tombol *"Jalankan Simulasi Formula"* berhasil menarik data riil (proker dan skor asesmen aktual) dan menghitung nilai simulasi dalam hitungan detik.
  2. Eksekusi simulasi bersifat *read-only* (tidak mengubah nilai poin di database sebelum tombol normalisasi ditekan).
  3. Fitur pencarian kelompok dan ekspor berkas CSV berfungsi tanpa galat.

---

### 2.3. Portal Mandiri MPL (Mitra Pembimbing Lapangan)
* **Deskripsi:** Portal mandiri bagi aparat kewilayahan/kelurahan/RW untuk memonitor dan menilai mahasiswa KKN di wilayahnya secara independen dari Dosen DPL.
* **Halaman Pengujian:** URL `/dashboard-mpl` (dengan peran aktif `MPL`).
* **Mekanisme Double Guard:**
  - *Guard 1 (Wilayah):* MPL hanya dapat melihat kelompok yang berada di kelurahan dampingannya.
  - *Guard 2 (Prasyarat DPL):* Form penilaian mahasiswa baru terbuka jika Dosen DPL telah menyelesaikan penilaian (`status !== 'DRAFT'` atau skor DPL > 0).
* **Kriteria Lulus (Pass Criteria):**
  1. Dasbor MPL menampilkan kartu statistik binaan (sesuai notulensi meet: tidak menampilkan metrik absensi di kartu ringkas dasbor utama).
  2. Tab Pelaksanaan Proker menyajikan data kelompok secara *read-only*.
  3. Tab Monitoring menampilkan rincian kehadiran posko.
  4. Tab Penilaian memvalidasi 8 aspek evaluasi (Kehadiran, Warga Binaan, Proker, Komunikasi, Disiplin, Bukti, Dampak, Inisiatif).

---

### 2.4. Dashboard Eksekutif: Tata Kelola Sampah (Peta GIS & Tempat Sampah Teraktivasi)
* **Aturan Isolasi Domain (Domain Isolation Rule):**
  - **Tab KKN (`/dasbor?tab=kkn`):** Khusus murni data KKN Tematik (proker, logbook, presensi, DPL/MPL, kelompok, leaderboard). **Wajib 0% bebas dari modul fasilitas sampah.**
  - **Tab Tata Kelola Sampah (`/dasbor?tab=tata-kelola-sampah`):** Wadah resmi mandiri untuk seluruh pemantauan persampahan Coblong.
* **Halaman Pengujian:** URL `/dasbor?tab=tata-kelola-sampah`
* **Sub-Tab yang Diuji:**
  1. **Sub-Tab Peta GIS Fasilitas (`view=gis`):**
     - Marker Rumah Maggot, TPS, Bank Sampah, Bata Terawang, Loseda/POC, dan Buruan SAE muncul pada koordinat yang benar di wilayah Coblong (83 titik).
     - Filter posko KKN aktif (`jenis != "posko_kkn"` tidak ditampilkan di peta fasilitas sampah).
     - Setiap marker dapat diklik untuk membuka popup informasi detail (PIC, kontak, foto, link maps).
     - Layer poligon/indikator kepatuhan kelurahan menampilkan warna sesuai standar: Hijau ($\ge 70\%$), Kuning ($40\%-69\%$), Merah ($< 40\%$).
  2. **Sub-Tab Tempat Sampah Teraktivasi (`view=bins`):**
     - Menampilkan daftar inventaris tempat sampah berstatus aktif (`ACTIVE_BOUND` dan `ASSIGNED_TO_PIC`).
     - Filter pencarian QR code dan kelurahan berfungsi akurat.
  3. **Sub-Tab Ringkasan & Metrik (`view=ringkasan`):**
     - Metrik timbulan sampah, komposisi sampah, tren mingguan, dan evaluasi kelurahan.
* **Kriteria Lulus Isolasi Domain (Pass Criteria):**
  1. Saat membuka tab *"Kuliah Kerja Nyata"*, tidak ada lagi kartu/modul *"Tata Kelola Sampah (Geospasial & Aktivasi)"* di bagian bawah halaman.
  2. Seluruh visualisasi peta GIS dan tempat sampah aktif berpindah dan tersaji rapi di tab *"Tata Kelola Sampah"*.

---

### 2.5. Penamaan Petugas Mobile Berdasarkan Wilayah
* **Deskripsi:** Petugas residu pengangkutan sampah diberi nama representatif wilayah operasional (contoh: *"Petugas Kelurahan Dago 01"*).
* **Halaman Pengujian:**
  - `Master Data` $\rightarrow$ `Manajemen Pengguna` (`/master-data/pengguna`) filter peran Petugas Pemilah.
  - `Papan Peringkat / Leaderboard` (`/leaderboard`) tab Petugas.
* **Kriteria Lulus (Pass Criteria):**
  1. Mengedit akun petugas di Manajemen Pengguna menyediakan field *"Nama Tampilan Publik"* dan *"Kelurahan Penugasan"*.
  2. Pada Leaderboard publik, nama yang muncul adalah nama display wilayah didampingi subtitle kelurahan penugasan.

---

### 2.6. Optimasi Web Mobile Mahasiswa (iOS Safari & Presensi)
* **Deskripsi:** Menghilangkan bug *tab jumping* dan *viewport jitter* pada peramban iOS Safari saat berpindah aplikasi atau mengaktifkan layar dari kondisi mati.
* **Kriteria Lulus (Pass Criteria):**
  1. Pada web mobile mahasiswa di Safari iOS, saat tab diminimalkan atau layar dikunci lalu dibuka kembali, halaman tidak melonjak ke paling atas.
  2. Presensi tersinkronisasi di latar belakang (*silent refresh*) tanpa menampilkan layar kedip/loading penuh.
  3. Modal konfirmasi check-out menampilkan peringatan waktu kepulangan minimal jika target durasi belum tercapai.

---

### 2.7. Integritas Database VPS & Kebijakan Anti-Dummy Seed
* **Kriteria Lulus (Pass Criteria):**
  1. Database VPS hanya diupdate menggunakan berkas migrasi Prisma terdaftar:  
     `20260917120000_add_multi_role_and_petugas_display/migration.sql`
  2. Tidak ada riwayat eksekusi `prisma db push` atau skrip seeder dummy liar di server produksi.

---

## 3. Kategori II: Matriks Audit Rumus Penilaian & Integrasi Mobile

QC wajib memverifikasi kebenaran matematika dari setiap angka poin yang tampil di aplikasi:

### 3.1. Audit Rumus Gamifikasi & Batas Maksimal (*Anti-Cheat*)

| Modul Pengguna | Rumus Matematika Sistem | Batas Maksimal | Logika & Validasi QC |
| :--- | :--- | :---: | :--- |
| **Poin Warga** | $\text{Volume (L)} \times 100 \times \text{Pengali Waktu} \times \text{Akurasi AI}$ | Dinamis | • Jam Misi (06-08 & 16-18) = `1.0`<br>• Luar Jam = `0.3` (Diskon 70%)<br>• Akurasi AI = `0.0 - 1.0`<br>• Nilai tukar: 1 Poin = Rp 100 |
| **Mahasiswa KKN** | $\text{Absen Datang (4)} + \text{Jam Kerja (3)} + \text{Logbook (3)}$ | **10 PTS / hari** | • Radius GPS posko $\le 100\text{ meter}$<br>• Minimal jam kerja lapangan $\ge 4\text{ jam}$<br>• Logbook disetujui DPL |
| **Program Kerja** | $\text{Disetujui (+2)} + \text{Berjalan (+2)} + \text{Selesai (+2)}$ | **6 PTS / proker** | • Sifat **Shared**: seluruh mahasiswa dalam kelompok menerima poin yang sama |
| **Kelompok KKN** | $(\text{Poin Proker} \times 0.6) + (\text{Rerata Anggota} \times 0.4)$ | Dinamis (Pecahan Desimal) | • BUKAN penjumlahan total poin anggota<br>• Menghasilkan nilai desimal (misal `11.6`) |
| **Petugas Residu** | $(\text{Kg Sampah} \times 2) + \text{Foto (10)} + \text{Rute (50)}$ | Dinamis | • Setiap 1 Kg timbangan = `+2 PTS`<br>• Bonus foto timbangan valid = `+10 PTS`<br>• Bonus 100% rute harian tuntas = `+50 PTS` |

---

### 3.2. Audit Rumus Penilaian Akademik KKN (Mitra 50% + DPL 50%)

$$\text{Nilai Akhir} = (\text{Subtotal Mitra Lapangan} \times 0.5) + (\text{Subtotal DPL} \times 0.5)$$

* **8 Aspek Mitra Lapangan (MPL / RW) - Bobot 100%:**
  1. Kehadiran Lapangan: **15%** (Otomatis dari jam kerja & GPS)
  2. Pendampingan Warga Binaan: **15%** (Otomatis dari tempat sampah aktif)
  3. Pelaksanaan Program Kerja: **15%** (Manual skala 0–100)
  4. Komunikasi & Etika Sosial: **10%** (Manual skala 0–100)
  5. Tanggung Jawab & Disiplin: **10%** (Manual skala 0–100)
  6. Kelengkapan Bukti Kegiatan: **10%** (Manual skala 0–100)
  7. Dampak Lingkungan RW: **15%** (Manual skala 0–100)
  8. Inisiatif & Kreativitas: **10%** (Manual skala 0–100)

* **6 Aspek Dosen Pembimbing (DPL) - Bobot 100%:**
  1. Perencanaan Proker: **20%** (Manual skala 0–100)
  2. Kontribusi Individu: **10%** (Manual skala 0–100)
  3. Kepatuhan Logbook: **20%** (Otomatis: $\frac{\text{Logbook Disetujui}}{24} \times 100$)
  4. Analisis & Pemecahan Masalah: **20%** (Manual skala 0–100)
  5. Kualitas Luaran Nyata: **20%** (Manual skala 0–100)
  6. Laporan Akhir & Refleksi: **10%** (Manual skala 0–100)

* **Rentang Konversi Mutu:**
  - $\ge 80.00$ : **A** | $70.00 - 79.99$ : **B** | $60.00 - 69.99$ : **C** | $50.00 - 59.99$ : **D** | $< 50.00$ : **E**

---

### 3.3. Verifikasi Koreksi Backend: Poin Proker Dashboard Mahasiswa

* **Skenario Masalah Sebelumnya:** Nilai `prokerPoints` pada `GET /api/v1/kkn/dashboard` ditarik dari tabel riwayat perorangan (`PointHistory`). Akibatnya mahasiswa hanya melihat angka mentok `6 PTS` meskipun kelompok memiliki 3 proker bernilai `18 PTS`.
* **Kondisi Terkoreksi (Live VPS Produksi):**
  - Backend menghitung poin proker secara kolektif langsung dari tabel `ProgramKerjaKkn`.
  - Seluruh anggota kelompok menerima poin yang identik.
  - **Uji Forensik Live:** Mahasiswa NIM `52023002` (Kelompok 2 Lebak Siliwangi) menghasilkan respons:
    - `data.prokerPoints` = `12`
    - `data.stats.prokerPoints` = `12`
    - `data.stats.poinProker` = `12`
    *(Status: Sinkron & Konsisten).*

---

### 3.4. Checklist Verifikasi 4 Anomali Kritis Sisi Mobile (Flutter)

QC wajib menguji aplikasi mobile setelah Tim Mobile menerapkan perbaikan kode:

| No | Komponen Mobile | Masalah Sebelumnya | Ekspektasi Hasil Uji QC (Setelah Diperbaiki) | Status |
| :-: | :--- | :--- | :--- | :-: |
| **M-1** | Model `KelompokKknData` | Skor kelompok di-cast `.toInt()`, desimal terpotong (misal `11.8` jadi `11`). | Menggunakan tipe `double`. Angka desimal muncul di UI dengan 1 angka di belakang koma (misal `11.8 Poin`). | [ ] PASS |
| **M-2** | Widget `kelompok_kkn_view` | UI menampilkan *"Penjumlahan poin 12 anggota"* tetapi angkanya `11.8 Poin`. | Ditampilkan **2 kartu terpisah**: (1) Skor Kinerja Kelompok `11.8 Poin` dan (2) Total Akumulasi Tim `132 PTS`. | [ ] PASS |
| **M-3** | View `monitoring_warga_view` | Variabel `kelurahan` diisi alamat posko lengkap, hasil query warga dampingan selalu 0. | Mengambil parameter dari `kelompok.kelurahan`. Daftar warga dampingan kelurahan muncul dengan benar. | [ ] PASS |
| **M-4** | Controller `aktivasi_warga` | Saat wilayah kosong, aplikasi mengunduh ribuan warga se-kota ke RAM HP. | Tidak mengunduh data tanpa filter wilayah. Menampilkan tampilan *Empty State* yang ramah. | [ ] PASS |

---

## 4. Tabel Skenario Pengujian QC (Detailed Test Cases Suite)

| Test ID | Modul | Pra-Kondisi | Langkah Pengujian | Data Uji | Hasil yang Diharapkan (Expected Result) | Status |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-001** | Multi-Role Switcher | Akun memiliki peran `SUPER_USER` | 1. Klik `[ 🔄 Peran: SUPER_USER ]`<br>2. Pilih `MPL`<br>3. Amati perubahan navbar & sidebar | Role: `MPL` | Tampil toast sukses, token diperbarui, diarahkan ke `/dashboard-mpl`, menu sidebar berganti menu MPL. | [ ] PASS |
| **TC-002** | Multi-Role Switcher | Akun hanya memiliki 1 peran (Warga) | Buka halaman web dengan akun warga biasa | Akun Warga | Dropdown switcher hanya menampilkan peran aktifnya tanpa tombol peran operasional lain. | [ ] PASS |
| **TC-003** | Simulasi Poin KKN | Login sebagai Developer | 1. Buka `/developer/poin-mahasiswa-kkn`<br>2. Klik *"Jalankan Simulasi Formula"* | Seluruh kelompok KKN | Sistem menghitung formula 60%:40%, memuat tabel komparasi, dan data di database tidak termutasi. | [ ] PASS |
| **TC-004** | Ekspor Simulasi Poin | Hasil simulasi telah tampil | Klik tombol *"Unduh CSV"* | Data tabel | Berkas CSV terunduh berisi kolom: Kelompok, Proker Step, Rerata Anggota, Komponen A, B, dan Poin Akhir. | [ ] PASS |
| **TC-005** | Guard Wilayah MPL | Login sebagai MPL Kelurahan Dago | Buka tab Pelaksanaan di Portal MPL | Kelurahan Dago | Hanya menampilkan kelompok KKN yang berposko di Kelurahan Dago. Kelompok kelurahan lain tersembunyi. | [ ] PASS |
| **TC-006** | Guard Prasyarat MPL | DPL belum submit nilai (Draft) | Buka tab Penilaian di Portal MPL | Mahasiswa Binaan | Tombol penilaian MPL terkunci/disabled dengan keterangan *"Menunggu DPL menyelesaikan penilaian"*. | [ ] PASS |
| **TC-007** | Peta GIS Sampah | Buka Dasbor Eksekutif | 1. Pilih tab *"Tata Kelola Sampah"*<br>2. Klik salah satu pin fasilitas Maggot | Koordinat Coblong | Peta Leaflet memuat pin titik fasilitas, popup informasi RW muncul lengkap beserta status verifikasinya. | [ ] PASS |
| **TC-008** | Tempat Sampah Aktif | Buka Dasbor Eksekutif | Buka sub-tab *"Tempat Sampah Teraktivasi"* | Filter Kelurahan | Menampilkan inventaris tempat sampah aktif (`ACTIVE_BOUND`), QR code dan tanggal aktivasi tampil valid. | [ ] PASS |
| **TC-009** | Penamaan Petugas | Akun Admin / Super User | 1. Edit akun Petugas Residu<br>2. Isi Nama Display *"Petugas Dago 01"*<br>3. Buka Leaderboard | Nama: Petugas Dago 01, Kelurahan: Dago | Leaderboard publik kategori Petugas menampilkan nama *"Petugas Dago 01"* dan badge *"Kel. Dago"*. | [ ] PASS |
| **TC-010** | iOS Safari Presensi | Buka web mobile di Safari iOS | Masuk halaman presensi, minimalkan browser 30 detik, buka kembali | Sesi presensi aktif | Halaman tidak mengalami jumping scroll, presensi terbarui otomatis via silent background refresh. | [ ] PASS |
| **TC-011** | Sinkronisasi Proker | Mahasiswa KKN login | Panggil `GET /api/v1/kkn/dashboard` | Akun Mahasiswa KKN | `prokerPoints`, `stats.prokerPoints`, dan `stats.poinProker` bernilai sama dan merefleksikan seluruh proker kelompok. | [ ] PASS |
| **TC-012** | Desimal Poin Kelompok | Buka Aplikasi Mobile Flutter | Masuk ke menu Kelompok KKN | Data Kelompok | Nilai poin kelompok menampilkan angka desimal (contoh: `11.6 Poin`), bukan bilangan bulat terpotong `11`. | [ ] PASS |

---

## 5. Prosedur Validasi Lingkungan Produksi VPS (`157.10.252.252`)

Sebelum menandatangani persetujuan rilis akhir, Tim QC wajib memverifikasi kesehatan server produksi:
1. **Pemeriksaan Health Endpoint:**
   ```bash
   curl -I http://157.10.252.252:5000/api/v1/health
   # Ekspektasi: HTTP/1.1 200 OK
   ```
2. **Pemeriksaan Status Cluster PM2:**
   - Kedua worker `psc-backend` (id 0 dan id 1) berada dalam status `online` tanpa restart abnormal (*restart count stabil*).
3. **Pemeriksaan Status Database:**
   - Seluruh tabel `pengguna_peran`, `posko_kkn`, dan kolom `nama_display` pada `petugas_residu` telah terpasang rapi sesuai skema migrasi.

---

## 6. Lembar Persetujuan & Sign-Off Rilis QC

| Peran | Nama Penanggung Jawab | Status Keputusan | Catatan Evaluasi | Tanda Tangan / Tanggal |
| :--- | :--- | :---: | :--- | :--- |
| **Lead Quality Control (QC)** | ................................... | [ ] ACCEPTED<br>[ ] REJECTED | .................................................... | ................................... |
| **Lead Mobile Developer** | ................................... | [ ] ACCEPTED<br>[ ] REJECTED | .................................................... | ................................... |
| **Lead Backend / Fullstack** | ................................... | [ ] ACCEPTED<br>[ ] REJECTED | .................................................... | ................................... |
| **Product Owner / Pimpinan** | ................................... | [ ] ACCEPTED<br>[ ] REJECTED | .................................................... | ................................... |
