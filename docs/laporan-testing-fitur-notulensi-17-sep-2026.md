# 📋 LAPORAN PANDUAN PENGUJIAN FITUR BARU BERSEKA
**Notulensi Rapat 17 September 2026**
*Platform Tata Kelola Sampah & KKN Tematik BERSEKA*

---

## 📌 Ringkasan Eksekutif

Seluruh 7 agenda hasil notulensi rapat tanggal 17 September 2026 telah selesai diimplementasikan secara terintegrasi baik di sisi Backend API maupun Web Frontend. Dokumen ini disusun khusus sebagai panduan praktis bagi tim pengembang, QA, dan pimpinan untuk memverifikasi dan menguji setiap fitur secara komprehensif.

---

## 1. 🔄 Multi-Role Akun (Opsi A: Role Switcher)

### A. Konsep Dasar & Mekanisme
Pada arsitektur sebelumnya, setiap akun pengguna hanya memiliki satu `roleId` statis. Pada **Opsi A (Active Role Switcher)**:
- Pengguna tetap memiliki **satu akun, satu nomor HP/identitas login, dan satu password**.
- Tabel junction baru `pengguna_peran` (`UserRole`) menyimpan peran-peran alternatif yang diizinkan untuk akun tersebut.
- Pengguna dapat berpindah peran kapan saja melalui tombol **Role Switcher di Navbar Atas** secara instan tanpa perlu logout dan login ulang.
- Token autentikasi JWT (`accessToken`) secara otomatis diperbarui di browser dan server saat peran ditukar, sehingga seluruh navigasi sidebar, hak akses data (RBAC), dan tampilan portal langsung berganti ke antarmuka peran yang dipilih.
- Khusus akun berkedudukan **DEVELOPER** atau **SUPER_USER**, sistem menyediakan tombol beralih cepat ke seluruh peran operasional (DPL, MPL, Pimpinan, Task Force, Camat, Lurah, RW, Petugas, dll) untuk mempermudah simulasi, monitoring, dan audit.

### B. Endpoint API
- **Route**: `POST /api/v1/auth/switch-role`
- **Header**: `Authorization: Bearer <accessToken>`
- **Payload Request**:
  ```json
  {
    "role": "MPL"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Berhasil beralih ke peran MPL",
    "data": {
      "accessToken": "eyJhbGciOi...",
      "currentRole": "MPL",
      "user": { ... }
    }
  }
  ```

### C. Langkah-Langkah Pengujian di Web:
1. Login menggunakan akun pengembang (`DEVELOPER` / `SUPER_USER`) atau akun multi-peran (misalnya akun Dosen yang juga bertindak sebagai Mitra Pembimbing).
2. Perhatikan bagian kanan atas (navbar header), terdapat tombol pill bertuliskan:  
   `[ 🔄 Peran: <Peran Saat Ini> ▾ ]`
3. Klik tombol tersebut untuk membuka daftar dropdown peran yang tersedia.
4. Pilih peran target yang ingin diuji (contoh: klik **MPL (Mitra Pembimbing)**).
5. Sistem akan menampilkan notifikasi hijau *"Berhasil beralih ke peran MPL"* dan secara otomatis mengarahkan ke antarmuka **Portal MPL**.
6. Periksa sidebar: menu sidebar kini mencerminkan kewenangan peran MPL (menu penilaian mitra, monitoring dampingan, dll).
7. Klik kembali tombol switcher dan pilih peran sebelumnya (misal **DPL**): antarmuka kembali ke mode DPL tanpa hambatan.

---

## 2. 🧮 Normalisasi & Simulasi Formula Poin Mahasiswa KKN

### A. Formula Resmi yang Diterapkan
Berdasarkan arahan notulensi rapat, perhitungan poin mahasiswa KKN dihitung secara bertahap menggunakan formula komposit:

$$\text{Poin Akhir} = (\text{Komponen A} \times 0.6) + (\text{Komponen B} \times 0.4)$$

Di mana:
1. **Komponen A (Bobot 60%)**: Capaian internal kelompok
   - $\text{Nilai Proker Step}$: Rerata progres 3-step dari seluruh proker kelompok:
     - Step 1 (BELUM_MULAI / DIUSULKAN): **25 poin**
     - Step 2 (SEDANG_BERJALAN / DITERIMA / DISETUJUI): **60 poin**
     - Step 3 (SELESAI): **100 poin**
   - $\text{Rata-rata Skor Anggota}$: Rerata `assessmentScore` seluruh mahasiswa dalam kelompok tersebut.
   - $\text{Komponen A} = \frac{\text{Nilai Proker Step} + \text{Rata-rata Skor Anggota}}{2}$
2. **Komponen B (Bobot 40%)**: Kinerja komparatif kelompok terhadap ekosistem
   - $\text{Komponen B} = \frac{\sum \text{Komponen A seluruh kelompok KKN}}{\text{Total Kelompok KKN}}$
3. **Keadilan Kolaboratif**:
   - Seluruh mahasiswa dalam kelompok yang sama memperoleh nilai akhir poin yang sama.

### B. Cara Pengujian & Simulasi Real-Time:
1. Buka menu sidebar: **PROGRAM KKN** $\rightarrow$ **Simulasi Poin KKN** (atau akses langsung URL `/developer/poin-mahasiswa-kkn`).
2. Halaman menampilkan penjelasan formula matematis dan kartu metrik ringkasan.
3. Klik tombol **"Jalankan Simulasi Formula"**.
4. Sistem akan menarik data riil dari database (progres proker aktual + skor asesmen aktual) dan menghitung nilai simulasi tanpa mengubah data di database (*read-only*).
5. Tabel menampilkan: Nama Kelompok, Nilai Proker (Step), Rerata Nilai Anggota, Komponen A (60%), Komponen B (40%), Poin Akhir, serta daftar anggota kelompok.
6. Anda dapat mengunduh preview data ke format CSV atau melakukan pencarian per kelompok.
7. Tombol **"Normalisasi & Simpan ke Database"** disediakan khusus bagi Developer apabila ingin merekonsiliasi seluruh poin ke riwayat poin mahasiswa secara permanen.

---

## 3. 🎓 Portal Mandiri MPL (Mitra Pembimbing Lapangan)

### A. Arsitektur & Keamanan
- Service (`mplService.ts`) dan Controller (`mplRoutes.ts`) dibangun **independen** dari DPL untuk menjamin pemisahan kewenangan.
- Dilengkapi pengaman berjenjang (*Double Guard*):
  - **Guard 1 (Wilayah)**: MPL hanya dapat melihat dan menilai mahasiswa di kelurahan binaannya.
  - **Guard 2 (Alur Penilaian)**: Penilaian DPL bersifat prasyarat; MPL baru diizinkan menilai setelah DPL menyelesaikan penilaian (`status !== 'DRAFT'` atau skor DPL > 0).

### B. Langkah-Langkah Pengujian:
1. Beralih ke peran **MPL** melalui Role Switcher atau login akun MPL.
2. Akses menu **"Portal MPL"** di sidebar (`/dashboard-mpl`).
3. Uji 4 tab utama:
   - **Tab Dashboard**: Menampilkan kartu ringkasan (Total Kelompok Binaan, Total Mahasiswa, Kelurahan Dampingan). *Catatan: Sesuai notulensi, metrik presensi tidak ditampilkan di dasbor utama MPL.*
   - **Tab Pelaksanaan**: Melihat progres program kerja kelompok dalam cakupan kelurahan secara *read-only*.
   - **Tab Monitoring**: Melihat ringkasan kehadiran mahasiswa (jumlah hadir/izin/sakit).
   - **Tab Penilaian**: Tabel penilaian 8 aspek mitra (Kehadiran, Warga Binaan, Proker, Komunikasi, Tanggung Jawab, Bukti Kegiatan, Dampak, Inisiatif). Coba simpan penilaian: pastikan sistem memvalidasi kelengkapan nilai dan status penilaian DPL.

---

## 4. 🗺️ Dasbor Eksekutif: Tab Tata Kelola Sampah (Peta GIS & Tempat Sampah Teraktivasi)

### A. Konsep Isolasi Ranah (*Domain Separation*)
Sesuai hasil diskusi rapat Zoom dan notulensi, Dasbor Eksekutif (`/dasbor`) dibagi secara tegas menjadi dua ranah independen:
1. **Tab "Kuliah Kerja Nyata" (`?tab=kkn`)**: Khusus menyajikan metrik kelompok KKN, proker, bimbingan DPL & MPL, presensi, konversi SKS, dan evaluasi mahasiswa (0% elemen sampah).
2. **Tab "Tata Kelola Sampah" (`?tab=tata-kelola-sampah`)**: Wadah resmi terpadu yang memuat seluruh instrumen persampahan Kecamatan Coblong dengan 3 sub-tab:
   - **Peta GIS Interaktif (Leaflet.js)**:
     - Menampilkan koordinat fasilitas sampah: Rumah Maggot (hijau tua), TPS (abu-abu), Bank Sampah (biru), Bata Terawang (ungu), Loseda/POC (oranye), Buruan SAE (cyan).
     - Filter posko KKN aktif (`jenis != "posko_kkn"` tidak ditampilkan di peta fasilitas sampah).
     - Setiap titik dapat diklik untuk melihat popup detail (nama fasilitas, jenis, kelurahan, RW, status verifikasi, PIC, kontak WA).
     - Dilengkapi **Overlay Kepatuhan Kelurahan**:
       - $\ge 70\%$ : Tingkat TINGGI (Warna Hijau `#22c55e`)
       - $40\% - 69\%$ : Tingkat SEDANG (Warna Kuning `#eab308`)
       - $< 40\%$ : Tingkat RENDAH (Warna Merah `#ef4444`)
   - **Tempat Sampah Teraktivasi**:
     - Menampilkan daftar inventaris tempat sampah berstatus aktif (`ACTIVE_BOUND` dan `ASSIGNED_TO_PIC`).
     - Dilengkapi kartu statistik total tempat sampah aktif, filter kelurahan/RW, pencarian QR Code, serta paginasi tabel.
   - **Ringkasan & Metrik**:
     - Metrik timbulan pemilahan sampah, komposisi sampah, tren mingguan, dan evaluasi kelurahan.

### B. Langkah-Langkah Pengujian:
1. Beralih ke peran **PIMPINAN**, **SUPER_USER**, atau **DEVELOPER**.
2. Masuk ke halaman **Dasbor** (`/dasbor`).
3. **Uji Isolasi Tab KKN**:
   - Klik tab **"Kuliah Kerja Nyata"** (`?tab=kkn`).
   - Gulir ke bawah: pastikan **TIDAK ADA** modul sampah atau peta GIS fasilitas.
4. **Uji Tab Tata Kelola Sampah**:
   - Klik tab **"Tata Kelola Sampah"** (`?tab=tata-kelola-sampah`).
   - Uji sub-tab **"Peta GIS Fasilitas"**: Zoom, filter kelurahan, dan klik marker fasilitas.
   - Uji sub-tab **"Tempat Sampah Teraktivasi"**: Periksa daftar QR Code dan status aktif.
   - Uji sub-tab **"Ringkasan & Metrik"**: Periksa kartu KPI timbulan sampah dan komposisi.

---

## 5. 🚚 Penamaan Petugas Mobile Sesuai Daerah

### A. Tujuan & Logika
Sesuai arahan notulensi rapat, petugas mobile yang telah dibuatkan akunnya perlu dinamai secara representatif sesuai daerah operasionalnya (contoh: *"Petugas Kelurahan Dago 01"*), agar pada papan peringkat (*Leaderboard*) dan laporan pimpinan nama yang muncul langsung jelas mencerminkan kelurahan dan zona penugasannya.

### B. Penerapan Teknis:
- Model database `PetugasResidu` telah ditambahkan kolom `namaDisplay` (`nama_display`) dan `kelurahan` (`kelurahan`).
- Endpoint `/users` (POST & PUT) dan service `userService.ts` telah disesuaikan untuk menerima dan menyimpan `namaDisplay` dan `kelurahan`.
- Endpoint `/gamification/leaderboard` pada kategori Pengangkut/Petugas secara otomatis memprioritaskan `namaDisplay` sebagai nama peringkat publik, didampingi label kelurahan penugasan.

### C. Langkah-Langkah Pengujian:
1. Masuk ke menu **Master Data** $\rightarrow$ **Manajemen Pengguna** (`/master-data/pengguna`).
2. Filter tabel berdasarkan peran **Petugas Pemilah** (`PETUGAS_RESIDU`).
3. Klik tombol **Edit** pada salah satu akun petugas.
4. Pada modal form, isi field baru:
   - **Nama Tampilan Publik (Sesuai Daerah)**: misalnya isi `Petugas Kelurahan Dago 01`.
   - **Kelurahan Penugasan**: misalnya isi `Dago`.
5. Klik **Simpan Perubahan**.
6. Buka menu **Peringkat / Leaderboard** (`/leaderboard`) $\rightarrow$ pilih tab **Peringkat Petugas**.
7. Pastikan pada daftar dan grafik 10 besar, nama yang muncul adalah `Petugas Kelurahan Dago 01` dengan subtitle `Kel. Dago`.

---

## 🛡️ Jaminan Keamanan Database VPS & Anti-Dummy Seed
Seluruh perubahan skema telah dikompilasi ke dalam berkas migrasi Prisma terstandarisasi:
`apps/api/prisma/migrations/20260917120000_add_multi_role_and_petugas_display/migration.sql`

Dengan format ini:
- Server produksi di VPS dapat menerapkan perubahan secara aman menggunakan perintah resmi:
  ```bash
  npx prisma migrate deploy
  ```
- Tidak menggunakan perintah `prisma db push` yang berisiko mengubah atau mereset data.
- Kebijakan *Golden Backup* dan *VPS Safety Guard* tetap aktif dan terjaga sepenuhnya.
