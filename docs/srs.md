# Software Requirement Specification (SRS) — Pilah Sampah Cerdas

## 1. Spesifikasi Autentikasi & Identifikasi Pengguna (No NIK)
* **FR-AUTH-01 (Identifikasi Tanpa NIK):** Sistem wajib memverifikasi dan mengotentikasi pengguna tanpa menggunakan NIK (Nomor Induk Kependudukan):
  * **Warga:** Autentikasi menggunakan **Nomor Telepon** (No HP). Tidak ada field NIK atau Email.
  * **Mahasiswa KKN:** Autentikasi menggunakan **NIM** (Nomor Induk Mahasiswa).
  * **DPL (Dosen Pembimbing Lapangan):** Autentikasi menggunakan **NIP** (Nomor Induk Pegawai).
  * **Role Lainnya (RT, RW, Pengangkut, Petugas Residu, Admin):** Default autentikasi menggunakan **Nomor Telepon** (opsional Email untuk Admin).

---

## 2. Spesifikasi Fungsional (Functional Requirements)

* **FR-01 (Deteksi AI):** Sistem harus mampu menerima request foto dari Aplikasi Mobile Thin-Client, memproses antrian secara FIFO (First In First Out), dan memprediksi tipe serta volume sampah dalam batas timeout 2000 ms.
* **FR-02 (Validasi QR, Dual Bins, Kapasitas & Jarak):** 
  * Setiap rumah Warga terdaftar wajib memiliki **2 tempat sampah** (Organik & Anorganik) dengan QR Code terpisah.
  * Sistem harus menolak transaksi jika jenis sampah AI tidak sesuai dengan tipe peruntukan tempat sampah (misal: sampah plastik dibuang ke tempat sampah organik).
  * Sistem menolak transaksi jika volume sisa tempat sampah (maksimal 25L) terlampaui.
  * Sistem menolak transaksi jika jarak antara lokasi GPS handphone warga saat penyetoran dengan koordinat lokasi tempat sampah terdaftar melebihi 10 meter (Geofencing).

> ⚠️ DEPRECATED (flow lama, digantikan FR-03 & FR-RESET)
> *Dahulu: Poin dapat ditukarkan langsung melalui katalog reward.*
> *Digantikan: Fitur Penukaran Reward berstatus `[COMING SOON]`. Poin hanya digunakan untuk Akumulasi & Leaderboard.*

* **FR-03 (Sistem Poin & Leaderboard):** 
  * Sistem harus mengonversi liter ke kilogram berdasarkan massa jenis (`ORGANIC = 0.4 kg/L`, `NON_ORGANIC = 0.2 kg/L`).
  * Sistem memberikan 100 poin per kg terpilah. Poin dimasukkan ke akumulasi saldo dan Papan Peringkat (Leaderboard) Warga tingkat RT/RW.
* **FR-04 (Notifikasi & Monitoring Kapasitas):** Sistem harus memicu status peringatan "Tempat Sampah Penuh" jika kapasitas tempat sampah mencapai >90%.
* **FR-RESET-01 (Pengajuan Reset Scoped RT/RW):** Warga dapat mengajukan reset pengosongan tempat sampah melampirkan foto bukti. Pengajuan ini **wajib terisolasi hanya dikirimkan kepada pengurus RT dan RW di wilayah tempat tinggal Warga tersebut** (`rt_id` & `rw_id`).
* **FR-RESET-02 (Halaman Management Reset Web RT/RW):** Sistem wajib menyediakan **Halaman Khusus Management Request Reset Tempat Sampah** di Web Dashboard RT dan RW untuk mereview foto bukti dan melakukan approval (reset kapasitas ke 0 Liter) atau rejection.
* **FR-05 (Master Data CRUD):** Admin dan Pengurus Kelurahan/Kecamatan dapat mengelola seluruh entitas master data melalui halaman Master Data Web App.
* **FR-06 (Live Monitoring):** Sistem menyediakan 1 halaman khusus Live Monitoring di Web App yang menampilkan titik tempat sampah real-time di atas peta geospatial, mencakup area RT, RW, dan Kelurahan secara hierarkis.

---

## 3. Spesifikasi Non-Fungsional (Non-Functional Requirements)
* **NFR-01 (Kinerja Antrian):** Mampu menangani hingga 100 request deteksi foto bersamaan menggunakan Redis Concurrent Queue.
* **NFR-02 (Keamanan):** Batas aman request AI dibatasi maksimal 50 request per user/hari.
* **NFR-03 (Presisi Geospasial):** Database wajib merekam koordinat GIS (latitude & longitude) lokasi rumah/tempat sampah warga menggunakan tipe DECIMAL(11,8) dengan akurasi hingga 1.1 cm di permukaan bumi.
* **NFR-04 (Live Update):** Halaman Live Monitoring harus refresh otomatis data tempat sampah setiap 30 detik (polling atau WebSocket).
* **NFR-05 (Koneksi Internet Wajib):** Aplikasi Mobile **wajib memerlukan koneksi internet aktif** untuk semua fitur inti (deteksi AI, scan QR, riwayat, poin). Tidak ada mode offline. Ketika koneksi terputus, aplikasi menampilkan banner peringatan `NETWORK_UNAVAILABLE` dan menonaktifkan tombol aksi utama.
* **NFR-06 (Desain Responsif):** Seluruh antarmuka Web Dashboard wajib responsif di semua ukuran layar menggunakan breakpoint standar:
  * **Mobile (sm):** ≥ 360px — Tampilan tumpuk vertikal, sidebar tersembunyi (bottom navigation bar)
  * **Tablet (md):** ≥ 768px — Sidebar mini ikon, konten 2 kolom
  * **Desktop (lg):** ≥ 1280px — Sidebar penuh teks + ikon, konten multi-kolom
  * **Large Desktop (xl):** ≥ 1536px — Layout lebar penuh dengan panel statistik tambahan
