# 🛠️ Monitoring Portal (Admin DLH, Camat, Lurah) Tracker

Dokumen ini melacak kemajuan implementasi fitur-fitur pada Portal Monitoring sesuai spesifikasi.

## Checklist Implementasi

### 1. RBAC READ-ONLY ENFORCEMENT
- [x] Middleware `readOnlyGuard` menolak (403) seluruh request POST/PUT/DELETE/PATCH dari role `ADMIN_DLH`, `CAMAT`, dan `LURAH` ke endpoint manapun.
- [x] Bypassing (pengecualian) khusus untuk endpoint `PUT /api/v1/waste/logs/:id/resolve` jika dilakukan oleh `ADMIN_DLH` (resolving discrepancy).
- [x] Data-scoping wilayah secara dinamis:
  - Admin DLH melihat seluruh kota (nasional/kota).
  - Camat melihat data Kecamatan Coblong.
  - Lurah melihat data Kelurahan Dago.

### 2. DASHBOARD ANALITIK
- [x] 3 Grafik tren setoran mingguan (Organik vs Anorganik) sesuai batasan scope wilayah.
- [x] Ringkasan data median wilayah kepatuhan.
- [x] Kartu Summary: Total Rumah Tangga, Sampah Terkumpul, Tempat Sampah Aktif, dan Peringatan Radar Merah Tong Penuh.

### 3. PETA GIS REAL-TIME
- [x] Peta interaktif Leaflet menampilkan titik tong sampah dengan indikator warna (Aman/Waspada/Penuh).
- [x] Radar merah berkedip (pulsing effect) pada tong sampah dengan tingkat keterisian penuh (>90%).
- [x] Marker fasilitas (Bata Terawang, Loseda, Rumah Maggot, Bank Sampah) terpasang di peta.
- [x] Seluruh komponen peta bersifat Read-Only bagi para pemantau.

### 4. REVIEW DISKREPANSI AI (KHUSUS ADMIN DLH)
- [x] Halaman Review Diskrepansi AI (`ReviewDiscrepancy.tsx`) memuat seluruh log berstatus `PENDING_REVIEW` akibat ketidaksesuaian input petugas dan deteksi AI.
- [x] Menampilkan data foto/timbangan/klasifikasi kontras untuk mempermudah audit.
- [x] Tombol resolusi putusan: "Setujui Hasil AI" dan "Setujui Petugas" yang mengirim data ke backend.
- [x] Camat dan Lurah dilarang keras/ditolak masuk ke halaman ini.

### 5. EXPORT DATA & PANDUAN
- [x] Tombol ekspor data CSV & PDF terintegrasi pada dashboard analitik.
- [x] Tombol "Buku Panduan PDF" untuk mengunduh pedoman pemilahan sampah cerdas.
