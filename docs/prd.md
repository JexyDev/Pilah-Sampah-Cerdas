# Product Requirement Document (PRD) — Pilah Sampah Cerdas

## 1. Pendahuluan
### 1.1 Deskripsi Produk
**Pilah Sampah Cerdas** adalah platform berbasis IoT/sensor & AI untuk mengotomatisasi pendataan, pemilahan, dan pemantauan kapasitas tong sampah secara real-time. Produk ini dibuat untuk membantu petugas kebersihan RT/RW/Kelurahan dan warga mengelola sampah secara disiplin guna menaikkan efisiensi pemilahan sampah di permukiman Kecamatan Coblong, Kota Bandung.

### 1.2 Masalah yang Diselesaikan
1. **Ketidakdisiplinan Pemilahan:** Sampah organik kerap tercampur dengan anorganik sehingga merusak proses daur ulang.
2. **Tong Sampah Meluber:** Petugas tidak tahu kapan tong sampah penuh, mengakibatkan tumpukan sampah di luar kapasitas.
3. **Kurangnya Insentif Warga:** Warga malas memilah karena tidak ada umpan balik langsung.
4. **Data Tidak Terpusat:** Tidak ada satu platform yang menyatukan data RT/RW/Kelurahan dalam satu dasbor monitoring.

---

## 2. Alur Pengguna (User Flow)
### 2.1 Alur UX Warga (Aplikasi Mobile)
1. **Foto Sampah:** Warga mengambil foto sampah yang akan dibuang.
2. **Kompresi Citra:** Aplikasi secara otomatis memotong resolusi foto hingga berukuran di bawah 1MB untuk menghemat kuota transmisi.
3. **Verifikasi AI:** Foto dikirim ke AI Mock Service. AI mengembalikan jenis sampah (`ORGANIC` / `NON_ORGANIC`) dan estimasi volume (Liter).
4. **Scan QR:** Warga memindai QR Code di tong sampah fisik.
5. **Kirim Transaksi:** Data dikirim ke backend. Jika kapasitas mencukupi, data disimpan dan warga mendapat poin. Jika tong penuh, transaksi ditolak dan petugas RT/RW mendapatkan notifikasi otomatis.

---

## 3. Alur Pengosongan Tong Sampah On-Demand (Reset Volume)
Untuk menjaga akurasi kapasitas tanpa perlu sensor IoT real-time mahal di tiap rumah, sistem menggunakan mekanisme **On-Demand Reset dengan Verifikasi Foto oleh Petugas**.

### 3.1 Alur UX Warga (Mobile)
1. **Pemberitahuan Penuh:** Ketika kapasitas tong warga sudah mencapai status kritis (>90%), warga masuk ke menu **"Ajukan Pengosongan Tong"**.
2. **Foto Bukti Fisik:** Warga memotret kondisi tong sampahnya yang penuh sebagai bukti fisik pengosongan.
3. **Kirim Pengajuan:** Warga menekan tombol **"Ajukan Reset"**. Request dikirim ke backend.
4. **Status Pending:** Status tong tetap penuh di sistem, dan status pengajuan warga tercatat `PENDING`.

### 3.2 Alur UX Petugas RT/RW (Web Dashboard)
1. **Notifikasi Masuk:** Petugas RT/RW mendapatkan notifikasi bahwa ada warga di lingkungannya yang mengajukan pengosongan tong.
2. **Review Pengajuan:** Petugas masuk ke menu **"Persetujuan Pengosongan"** (Approval Dashboard) dan melihat foto bukti fisik.
3. **Konfirmasi Pengosongan (Approve/Reject):**
   - **Approve:** Petugas menyetujui (kapasitas tong warga tersebut langsung ter-reset kembali ke `0 Liter` di database).
   - **Reject:** Petugas menolak jika foto tidak sesuai (status tong tetap penuh).

---

## 4. Spesifikasi Bulk Actions Tong Sampah (Master Data)
Disediakan menu khusus di dalam Master Data Tong Sampah untuk mempermudah pendaftaran masal:

### 4.1 Bulk Generate Bins (Pre-Registration)
* **Fungsi:** Menghasilkan nomor ID Tong Sampah dan QR Serial secara masal (misal: generate 100 tong sekaligus) dalam format Excel/CSV.
* **Tujuan:** Data ini di-print oleh kelurahan menjadi stiker QR Code fisik untuk ditempel di tong sampah baru sebelum didistribusikan ke warga.
* **Aktivasi Mobile:** Saat warga menerima tong, mereka melakukan scan pertama kali lewat aplikasi mobile untuk mengasosiasikan `bin_id` tersebut dengan akun warga mereka.

### 4.2 Bulk Import & Verify Bins (Linked to Master Data)
* **Fungsi:** Mengimpor file Excel/CSV berisi tong sampah yang sudah diverifikasi dan langsung diasosiasikan dengan Master Data Warga (`user_id` / No HP).

---

## 5. Peran Pengguna (RBAC 9 Role) & Autentikasi
1. **Warga:** Mengunggah foto sampah, scan QR bin, mengumpulkan poin gamifikasi. (Auth: No HP +62).
2. **Mahasiswa KKN:** Pendaftaran warga, scan awal & penyerahan QR Bins, logbook KKN. (Auth: No HP +62, Profile: NIM).
3. **DPL (Dosen Pembimbing Lapangan):** Monitoring progress KKN & dampingan mahasiswa. (Auth: No HP +62, Profile: NIP).
4. **Petugas Residu:** Monitoring web/mobile timbulan residu, log penimbangan fisik manual, penanganan eskalasi. (Auth: No HP +62).
5. **RW:** Approval aktivasi tempat sampah, approval daur ulang, penanganan pengaduan wilayah. (Auth: No HP +62).
6. **Lurah:** Monitoring read-only wilayah Kelurahan. (Auth: No HP +62).
7. **Camat:** Monitoring read-only wilayah Kecamatan Coblong. (Auth: No HP +62).
8. **Admin DLH:** Monitoring read-only Kota & Approval Diskrepansi AI. (Auth: No HP +62).
9. **Super Admin:** Master data management (Bulk KKN/DPL, Configurator). (Auth: No HP +62).

