# Product Requirement Document (PRD) — Pilah Sampah Cerdas

## 1. Pendahuluan
### 1.1 Deskripsi Produk
**Pilah Sampah Cerdas** adalah platform berbasis IoT/sensor & AI untuk mengotomatisasi pendataan, pemilahan, dan pemantauan kapasitas tempat sampah secara real-time. Produk ini dibuat untuk membantu pengurus RT/RW, petugas kebersihan, dan warga mengelola sampah secara disiplin guna menaikkan efisiensi pemilahan sampah di permukiman permukiman Kecamatan Coblong, Kota Bandung.

### 1.2 Platfrom & Arsitektur Akses Role
- **Aplikasi Mobile (Thin Client):** Digunakan secara terbatas oleh role **Warga**, **Mahasiswa KKN**, dan **Petugas Residu**. Focus pada aksi harian cepat (Scan QR tempat sampah, Deteksi AI, Foto Bukti, & Laporan Lapangan).
- **Aplikasi Web (Superset Dashboard):** Digunakan oleh **RT, RW, Pengangkut, DPL, Admin Kelurahan, Admin Kecamatan, Super Admin**, serta **Warga/Mahasiswa/Petugas Residu** sebagai superset untuk monitoring komprehensif, manajemen data, grafik analytics, dan approval halaman khusus.

### 1.3 Standar Identifikasi & Autentikasi User (Tanpa NIK)
Seluruh identifikasi dan login pengguna di platform **tidak menggunakan NIK**:
* **Warga:** Menggunakan **Nomor Telepon** (No HP). Tidak ada NIK atau Email.
* **Mahasiswa KKN:** Menggunakan **NIM** (Nomor Induk Mahasiswa).
* **DPL (Dosen Pembimbing Lapangan):** Menggunakan **NIP** (Nomor Induk Pegawai).
* **Role Pengurus / Atasan (RT, RW, Pengangkut, Petugas Residu, Admin):** Default menggunakan **Nomor Telepon** (opsional Email untuk Admin).

### 1.4 Masalah yang Diselesaikan
1. **Ketidakdisiplinan Pemilahan:** Sampah organik kerap tercampur dengan anorganik sehingga merusak proses daur ulang.
2. **Tempat Sampah Meluber:** Pengurus RT/RW & petugas tidak tahu kapan tempat sampah penuh, mengakibatkan tumpukan sampah di luar kapasitas.
3. **Kurangnya Insentif Warga:** Warga malas memilah karena tidak ada umpan balik langsung (diatasi dengan akumulasi poin & leaderboard).
4. **Data Tidak Terpusat:** Tidak ada satu platform yang menyatukan data RT/RW/Kelurahan dalam satu dasbor monitoring.

---

## 2. Ketentuan Kepemilikan & Aktivasi Tempat Sampah Warga
1. **Dual Bins per Rumah:** Setiap 1 akun/lokasi rumah Warga memiliki **2 tempat sampah**:
   - Tempat Sampah **Organik** (QR Code tersendiri).
   - Tempat Sampah **Anorganik** (QR Code tersendiri).
2. **Aktivasi Lokasi Presisi:**
   - Warga (atau dibantu oleh **Mahasiswa KKN**) memindai QR Code tempat sampah baru saat registrasi/aktivasi.
   - Koordinat lokasi GPS tempat sampah disimpan dan dipastikan **persis berada di titik lokasi rumah Warga**.
   - Validasi Geofencing transaksi penyetoran sampah diatur maksimal **10 meter** dari koordinat rumah/tempat sampah terdaftar ini.

---

## 3. Alur Pengguna (User Flow)
### 3.1 Alur UX Penyetoran Sampah Warga (Aplikasi Mobile)
1. **Foto Sampah:** Warga mengambil foto sampah yang akan dibuang.
2. **Kompresi Citra:** Aplikasi secara otomatis memotong resolusi foto hingga berukuran di bawah 1MB untuk menghemat kuota transmisi.
3. **Verifikasi AI:** Foto dikirim ke AI Mock Service backend. AI mengembalikan jenis sampah (`ORGANIC` / `NON_ORGANIC`) dan estimasi volume (Liter).
4. **Scan QR Tempat Sampah:** Warga memindai QR Code pada tempat sampah fisik (wajib cocok antara jenis sampah AI dengan jenis tempat sampah yang scanned).
5. **Validasi Geofencing & Kapasitas:** Backend mengecek koordinat GPS pengguna (<= 10m dari lokasi tempat sampah terdaftar) dan sisa kapasitas tempat sampah.
6. **Kirim Transaksi & Poin:** 
   - Data transaksi tersimpan.
   - Konversi volume ke kilogram (`ORGANIC = 0.4 kg/L`, `NON_ORGANIC = 0.2 kg/L`).
   - Warga menerima **100 poin per kg**.
   - Poin masuk ke akumulasi akun & leaderboard Warga.

> ⚠️ DEPRECATED (flow lama, digantikan lihat bagian 3.2 & 3.3)
> *Dahulu: Poin dapat langsung ditukarkan reward di menu catalog.*
> *Digantikan: Fitur Penukaran Reward berstatus `[COMING SOON]`. Poin saat ini hanya untuk Akumulasi & Leaderboard.*

### 3.2 Alur Monitoring Warga (Aplikasi Web - Superset)
1. Warga dapat login ke Web App untuk melihat dasbor visual monitoring pribadi.
2. Fitur Web Warga mencakup:
   - Monitoring persentase kapasitas real-time 2 Tempat Sampah milik sendiri (Organik & Anorganik).
   - Riwayat transaksi penyetoran lengkap (dengan filter tanggal & jenis sampah).
   - Grafik akumulasi kg sampah terpilah & total poin.
   - Papan Peringkat (Leaderboard) Warga tingkat RT/RW.
   - Tracking status pengajuan reset tempat sampah.

---

## 4. Alur Pengosongan Tempat Sampah On-Demand (Reset Volume)

> ⚠️ DEPRECATED (flow lama, digantikan lihat bagian 4.1 & 4.2)
> *Dahulu: Notifikasi reset terkirim umum ke Petugas Residu/Kebersihan atau hanya berupa notifikasi melayang di web.*
> *Digantikan: Pengajuan reset dari Warga terisolasi hanya ke RT dan RW wilayahnya saja, dan diproses melalui Halaman Khusus Management Reset di Web RT/RW.*

### 4.1 Alur Pengajuan Warga (Mobile & Web)
1. **Pemberitahuan Penuh:** Ketika tempat sampah Warga mendekati/mencapai kapasitas kritis (>90%), Warga masuk ke menu **"Ajukan Reset Tempat Sampah"**.
2. **Foto Bukti Fisik:** Warga memotret kondisi tempat sampah penuh sebagai bukti.
3. **Kirim Pengajuan (Scoped RT/RW):** Request dikirim ke backend, secara otomatis terarah **hanya kepada RT dan RW di wilayah tempat tinggal Warga tersebut** (berdasarkan relasi `rt_id` dan `rw_id`).

### 4.2 Alur Review & Eksekusi RT/RW (Web Dashboard)
1. **Masuk Halaman Khusus Reset:** Pengurus RT/RW membuka **Halaman Khusus Management Request Reset Tempat Sampah** (bukan sekadar notifikasi melayang).
2. **Daftar Request Terfilter:** Halaman menampilkan daftar pengajuan khusus dari warga di wilayah RT/RW mereka.
3. **Review & Action (Approve / Reject):**
   - **Approve:** Pengurus RT/RW menyetujui request. Sistem mereset kapasitas tempat sampah Warga kembali ke `0 Liter`.
   - **Reject:** Request ditolak dengan alasan (misal: foto bukti tidak jelas). Status kapasitas tempat sampah tetap pada posisi sebelumnya.

---

## 5. Spesifikasi Bulk Actions Tempat Sampah (Master Data)
Disediakan menu khusus di dalam Master Data Tempat Sampah pada Web Admin/RT/RW:

### 5.1 Bulk Generate Bins (Pre-Registration)
* **Fungsi:** Menghasilkan nomor ID Tempat Sampah dan QR Serial secara masal dalam format Excel/CSV.
* **Tujuan:** Data di-print menjadi stiker QR Code fisik untuk ditempel di tempat sampah baru sebelum didistribusikan.
* **Aktivasi Mobile / KKN:** Saat tempat sampah didistribusikan, Warga atau Mahasiswa KKN melakukan scan pertama kali untuk menghubungkan `bin_id` tersebut ke akun & lokasi rumah Warga.

### 5.2 Bulk Import & Verify Bins
* **Fungsi:** Mengimpor file Excel/CSV berisi tempat sampah yang sudah diverifikasi dan langsung diasosiasikan dengan Master Data Warga (`user_id` / Nomor Telepon).

---

## 6. Area Perlu Konfirmasi Tambahan
* `[PERLU KONFIRMASI: Mekanisme penanganan jika 1 dari 2 tempat sampah (misal Organik) rusak/hilang, apakah registrasi ulang dilakukan per-bin tunggal via Web Admin RT/RW?]`
