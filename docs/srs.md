# Software Requirement Specification (SRS) — Pilah Sampah Cerdas

## 1. Spesifikasi Fungsional (Functional Requirements)
* **FR-01 (Deteksi AI):** Sistem harus mampu menerima request foto, memproses antrian secara FIFO (First In First Out), dan memprediksi tipe serta volume sampah dalam batas timeout 2000 ms.
* **FR-02 (Validasi QR & Kapasitas):** Sistem harus menolak transaksi jika jenis sampah tidak sesuai dengan tipe peruntukan tong (misal, membuang plastik ke tong organik) atau jika volume sisa tong (maksimal 25L) terlampaui.
* **FR-03 (Sistem Poin):** Sistem harus mengonversi liter ke kilogram berdasarkan massa jenis (`ORGANIC = 0.4 kg/L`, `NON_ORGANIC = 0.2 kg/L`) dan memberikan 100 poin per kg.
* **FR-04 (Notifikasi & Monitoring):** Sistem harus memicu notifikasi "Tong Penuh" jika kapasitas tong mencapai >90%.
* **FR-05 (Master Data CRUD):** Admin dan Petugas Kelurahan dapat mengelola seluruh entitas master data melalui halaman Master Data dengan navigasi dropdown.
* **FR-06 (Live Monitoring):** Sistem menyediakan 1 halaman khusus Live Monitoring yang menampilkan titik tong sampah real-time di atas peta geospatial, mencakup area RT, RW, dan Kelurahan secara hierarkis.

---

## 2. Spesifikasi Non-Fungsional (Non-Functional Requirements)
* **NFR-01 (Kinerja Antrian):** Mampu menangani hingga 100 request deteksi foto bersamaan menggunakan Redis Concurrent Queue.
* **NFR-02 (Keamanan):** Batas aman request AI dibatasi maksimal 50 request per user/hari.
* **NFR-03 (Presisi Geospasial):** Database wajib merekam koordinat GIS (latitude & longitude) rumah tangga menggunakan tipe DECIMAL(11,8) dengan akurasi hingga 1.1 cm di permukaan bumi.
* **NFR-04 (Live Update):** Halaman Live Monitoring harus refresh otomatis data tong sampah setiap 30 detik (polling atau WebSocket).
