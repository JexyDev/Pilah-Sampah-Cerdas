# Software Requirement Specification (SRS) — Pilah Sampah Cerdas

## 1. Spesifikasi Autentikasi & Identifikasi Pengguna (No NIK & Universal Phone Auth)
* **FR-AUTH-01 (Identifikasi Tanpa NIK & No HP Universal):** 
  * Sistem memverifikasi dan mengautentikasi **100% pengguna dari seluruh role** (Warga, Mahasiswa KKN, DPL, Petugas Residu, RW, Lurah, Camat, Admin DLH, SUPER USER) menggunakan **Nomor Telepon (+62)** (OTP WhatsApp / Kredensial).
  * Field NIK **dihapus total** dari seluruh tabel, formulir, dan API.
  * Metadata profil tambahan: `nim` untuk Mahasiswa KKN, `nip` untuk DPL.

* **FR-AUTH-02 (Guard Akses Read-Only & Scoping Wilayah):**
  * Middleware `readOnlyGuard` memblokir operasi Tulis (POST, PUT, DELETE) untuk role Admin DLH, Camat, dan Lurah (kecuali approval diskrepansi AI oleh Admin DLH).
  * Data-Scoping: Admin DLH (Kota Bandung), Camat (Kecamatan Coblong), Lurah (Kelurahan), RW (Wilayah RW).

---

## 2. Spesifikasi Fungsional (Functional Requirements)

* **FR-01 (Deteksi AI & Threshold Confidence):** Sistem menerima request foto sampah dari Aplikasi Mobile, mengklasifikasikan tipe sampah (`ORGANIC` / `NON_ORGANIC`), dan mengembalikan nilai confidence AI (0.0–1.0) dalam timeout 2000 ms.
* **FR-02 (State Machine & Validasi QR Tempat Sampah):** 
  * Setiap rumah Warga terdaftar wajib memiliki maksimal **2 tempat sampah** (Organik & Anorganik) dengan QR Code terpisah. Residu tidak dibuatkan tempat sampah di rumah warga.
  * Alur Status Tempat Sampah: `PRINTED` -> `ASSIGNED_TO_PIC` (Mahasiswa KKN) -> `ACTIVE_BOUND` (Otomatis langsung aktif tanpa persetujuan RW, approval QR di-skip/dihapus, +10 Poin atomik).
  * Masa Aktif 30 Hari: Tempat sampah aktif di-reset otomatis setiap penyetoran foto + scan QR valid. Jika 30 hari tanpa aktivitas -> status `TIDAK AKTIF`.
  * Penanganan Tempat Sampah Rusak: RW dapat mengubah status bin menjadi `BROKEN` (QR non-aktif permanen).
  * Geofencing: Transaksi ditolak jika jarak GPS Warga > 10 meter dari lokasi terdaftar.
* **FR-03 (Sistem Poin & Rumus Gamifikasi):** 
  * Liter dikonversi ke Kilogram (`ORGANIC = 0.4 kg/L`, `NON_ORGANIC = 0.2 kg/L`).
  * Formula Poin: $\text{Poin} = \text{Berat (Kg)} \times 100 \times \text{Confidence AI} \times 0.9$.
  * Pencatatan poin menggunakan **ledger terpisah** dan berstatus gamifikasi (`redeemable: false`).
* **FR-04 (Penjemputan, Window Waktu, & Eskalasi Otomatis):** 
  * Penjemputan dilakukan pada window 06:00–08:00 WIB & 16:00–18:00 WIB.
  * Foto tempat sampah meluber memicu notifikasi push ke Petugas Residu & RW.
  * Eskalasi Otomatis: Jika pengangkutan tidak didokumentasikan dalam window waktu, notifikasi otomatis terkirim secara hierarkis (RW -> Lurah -> Camat -> Admin DLH).
* **FR-05 (Timbangan Fisik Petugas Residu & Rule of Discrepancy):** 
  * Hasil timbangan sampah diinput manual oleh Petugas Residu dari timbangan fisik industri.
  * Jika input manual petugas berbeda dari klasifikasi AI (>90% confidence), status setoran menjadi `PENDING_REVIEW` untuk dievaluasi oleh Admin DLH.
* **FR-06 (Live Monitoring GIS & Fasilitas):** Web Dashboard menyediakan halaman Live Monitoring peta geospasial real-time (timbulan sampah, fasilitas Bata Terawang, Loseda, Rumah Maggot, Bank Sampah).

---

## 3. Spesifikasi Non-Fungsional (Non-Functional Requirements)
* **NFR-01 (Kinerja Antrian):** Mampu menangani hingga 100 request deteksi foto bersamaan menggunakan Redis Concurrent Queue.
* **NFR-02 (Keamanan):** Batas aman request AI dibatasi maksimal 50 request per user/hari.
* **NFR-03 (Presisi Geospasial):** Database wajib merekam koordinat GIS (latitude & longitude) lokasi rumah/tempat sampah warga menggunakan tipe DECIMAL(11,8) dengan akurasi hingga 1.1 cm di permukaan bumi.
* **NFR-04 (Live Update):** Halaman Live Monitoring refresh otomatis data tempat sampah setiap 30 detik via polling / WebSocket.
* **NFR-05 (Koneksi Internet Wajib):** Aplikasi Mobile memerlukan koneksi internet aktif untuk fitur inti. Banner `NETWORK_UNAVAILABLE` muncul saat offline.
* **NFR-06 (Desain Responsif):** Web App responsif di breakpoint: sm (≥360px), md (≥768px), lg (≥1280px), xl (≥1536px).
