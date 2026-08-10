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

### 3.3 Alur Absensi GPS Mahasiswa KKN (Aplikasi Mobile)
Fitur absensi Mahasiswa KKN menggunakan sistem pelacakan otomatis (Geofencing) tanpa memerlukan check-in manual di awal.
1. **Target Sinkronisasi (API Fetching):** Aplikasi menarik data kegiatan (koordinat lokasi/target, rentang jam buka-tutup, dan target durasi absensi minimal).
2. **Otomatisasi Timer (Geofencing 50m):** Mahasiswa tidak perlu menekan tombol "Mulai". Ketika GPS Mahasiswa mendeteksi jarak berada di dalam radius <= 50 meter dari titik target, *Stopwatch* kehadiran akan berjalan otomatis (Status bar/Dashboard berubah menjadi Hijau "Aktif").
3. **Mekanisme Jeda (Pause & Resume):** Jika mahasiswa keluar dari radius 50 meter (misalnya sinyal melompat atau keluar zona sementara), *Stopwatch* tidak di-reset ke 0, melainkan hanya di-jeda (*freeze*). Saat masuk zona kembali, timer dilanjutkan. (Saat *freeze*, Dashboard berubah Merah/Abu-abu menandakan status "Tidak Aktif").
4. **Eksekusi Check-In:** Tombol "Hadir / Absen" hanya akan terbuka (dapat diklik) apabila:
   - *Stopwatch* telah mencapai/memenuhi target durasi minimum dari server (misal 120 menit).
   - Mahasiswa sedang secara fisik berada di dalam zona (Dashboard Hijau) pada saat menekan tombol tersebut.
5. **Anti-Kecurangan (Anti-Fraud) & Ketahanan:**
   - **Fake GPS:** Sistem wajib mendeteksi penggunaan aplikasi *Mock Location*. Jika terdeteksi, *timer* dihentikan/dikunci paksa.
   - **Manipulasi Waktu:** Penghitungan waktu menggunakan interval *tick* internal memori aplikasi (akumulatif detik per detik), bukan sekadar membandingkan jam lokal HP, sehingga merubah jam HP tidak akan memanipulasi durasi.
   - **Persistent Notification:** Menampilkan notifikasi latar belakang (*sticky notification*) agar sistem operasi HP tidak mematikan timer secara diam-diam saat aplikasi ditekan tombol *Home* (minimize).

### 3.4 Alur Fitur Operasional Mahasiswa KKN (Aplikasi Mobile)
Selain fitur absensi, aplikasi Mahasiswa KKN berfungsi sebagai alat kerja pendataan lapangan dengan 4 fitur utama berikut:
1. **Kelompok KKN (Informasi Tim):** Menampilkan detail profil anggota kelompok mahasiswa dan informasi kontak Dosen Pembimbing Lapangan (DPL) yang membina kelompok tersebut (Read-Only).
2. **Aktivasi Tempat Sampah Warga (Registrasi):**
   - Mahasiswa memindai stiker QR Code pada tempat sampah baru Warga.
   - Mengisi form identitas warga (Nama, No HP, Kelurahan, RW) dan menyematkan koordinat lokasi tempat sampah secara presisi.
   - Data tersimpan dan Warga resmi terdaftar, memungkinkan Warga *login* ke aplikasi Warga menggunakan Nomor HP-nya.
3. **Warga Dampingan Terbaru (Monitoring & Evaluasi):**
   - Mahasiswa memantau aktivitas historis Warga yang telah didaftarkannya.
   - Sistem menampilkan total poin warga, riwayat buang sampah, dan metrik akurasi AI (*API Correct Percentage*) guna melihat kedisiplinan pemilahan (Organik vs Anorganik). Warga dengan akurasi rendah menjadi target edukasi ulang.
4. **Kegiatan Mahasiswa (Pemanfaatan & Log Individu):**
   - Mahasiswa mengirimkan laporan harian/aktivitas edukasi pemanfaatan sampah warga (misal: sosialisasi pembuatan kompos).
   - Mahasiswa menginput form dan mengunggah foto bukti (terkompresi otomatis) yang langsung tersinkronisasi ke sistem Backend sebagai log untuk di-*approve* atau dinilai oleh DPL.

### 3.5 Alur Fitur Operasional Petugas Residu (Aplikasi Mobile)
Modul Petugas Residu didesain secara tertutup (*restricted*) khusus untuk input berat timbangan fisik sampah residu di titik kumpul RT/RW, dan **TIDAK** melayani penjemputan ke rumah warga.
1. **Whitelist Guard (Gerbang Akses):** 
   - Saat login, sistem memvalidasi `whitelistStatus` ke Backend.
   - Petugas berstatus `PENDING` atau `REJECTED` akan ditahan di layar restriksi (menunggu persetujuan Admin DLH/RW). Hanya status `APPROVED` yang diizinkan mengakses dasbor utama.
2. **Beranda & Jadwal Harian:**
   - Menampilkan statistik kinerja (Total Tugas, Titik Selesai, Total Kg Terangkut, Skor KPI).
   - Menampilkan daftar titik lokasi tempat sampah residu di wilayah penugasan (misal RT 01/RW 02) yang harus ditangani pada hari tersebut.
3. **Input Timbangan & Foto (Core Action):**
   - Petugas mendatangi lokasi, menimbang sampah residu, lalu memasukkan angka berat aktual (Kg) ke dalam aplikasi.
   - Sistem mewajibkan petugas mengambil foto bukti dari kamera (terkompresi).
   - Data dikirim langsung (*Real-Time Sync*) ke Dasbor Web RT/RW dan DLH.
4. **Insentif & Riwayat Poin:**
   - Setiap kali petugas berhasil menginput/sinkronisasi laporan timbangan yang valid, sistem Backend mengkalkulasi dan mengirimkan **Poin Insentif** ke akun petugas.
   - Petugas dapat melihat riwayat penyelesaian tugas dan jumlah poin yang telah dikumpulkan sebagai motivasi gamifikasi kinerja.

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
