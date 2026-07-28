# UI/UX Specification & Flow — Pilah Sampah Cerdas

## 1. Panduan Visual & Desain
*   **Tema:** Light Mode Only. Tidak ada toggle dark/light mode.
*   **Font Standard:** **Poppins** (semua platform — web dashboard & mobile Flutter). Import dari Google Fonts.
*   **Hierarki Font:**
    *   Heading (H1-H3): `Poppins Bold` (weight 700) atau `Poppins SemiBold` (weight 600).
    *   Body: `Poppins Regular` (weight 400).
    *   Caption: `Poppins Medium` (weight 500).
*   **Palet Warna:**
    *   **Primary Green (Hijau Daun):** `#4CAF50` (Sampah organik, tombol konfirmasi utama, status patuh).
    *   **Primary Blue (Biru Priangan):** `#0056A4` (Sampah non-organik, teknologi GIS).
    *   **Peta GIS Engine:** Menggunakan library gratis **Leaflet.js** dan **OpenStreetMap** (OSM) sebagai penyedia basemap gratis untuk fase testing awal sistem.
    *   **Danger Red (Merah Alarm):** `#EF4444` (Kapasitas tong kritis >90%, error, mismatch).
    *   **Warning Yellow (Kuning Transisi):** `#F59E0B` (Kapasitas sedang 70-90%).
    *   **Background Canvas:** `#F9FAFB` (Abu-abu sangat terang).
    *   **Card Background:** `#FFFFFF` (Putih bersih dengan shadow tipis).

---

## 2. Struktur Halaman & Fitur Web Dashboard

### 2.1 Sidebar & Topbar (Navigasi Global)
*   **Sidebar (Kiri):**
    *   Logo hijau daun bertuliskan `Pilah Sampah Cerdas` (Kecamatan Coblong).
    *   Menu navigasi dengan ikon Lucide:
        *   **Dashboard** (Ringkasan statistik utama KPI).
        *   **Live Monitoring** (Peta geospatial real-time titik tong + batas RT/RW/Kelurahan).
        *   **Master Data Dropdown** (User, Kelurahan, RT/RW, Rumah Tangga, Tong Sampah, Kategori Sampah, Jadwal Pengangkutan, Konfigurasi Poin).
        *   **Peta Wilayah** (Visualisasi spasial GIS & analitik per RT).
        *   **Data Warga & Tong** (Tabel detail status sensor warga).
        *   **Leaderboard** (Papan peringkat kompetisi antar-RT).
        *   **Evaluasi AI** (Log audit kuota dan akurasi model visi komputer).
        *   **Notifikasi** (Log peringatan tong penuh & sistem).

---

## 3. Acuan Aset Visual UI Mobile (Flutter)
Semua screen acuan desain terletak di branch `mobile` pada folder `/mobile/assets/stitch_ui/`:
1.  `splash_screen_minimalist.png`: Layar awal pembuka aplikasi.
2.  `login.png_1` & `login.png_2`: UI Autentikasi/masuk warga & petugas.
3.  `beranda.png`: Dasbor utama warga (tombol foto organik/anorganik, total poin, log riwayat).
4.  `scan_barcode.png` & `scan_qr_bin.png`: UI pemindaian QR Code di tong sampah fisik warga.
5.  `riwayat_pemilahan.png`: Daftar riwayat pembuangan sampah lengkap dengan volume/liter.
6.  `poin_saya.png`: Grafik & ledger riwayat perolehan poin dari penyetoran sampah terpilah.
7.  `profil_rumah_tangga.png`: Data administratif KK, alamat, koordinat GIS geotag.
8.  `aktivasi_bin.png`: Halaman scan QR untuk mengaktivasi/menghubungkan tong sampah baru dengan akun warga.
9.  `bin_mismatch.png`: Penanganan error (peringatan tipe sampah tidak sesuai dengan peruntukan tong).
10. `success_scan_step_1.png` & `success_final_step.png`: Alur sukses deteksi AI hingga transaksi berhasil dan poin bertambah.

---

## 4. Spesifikasi Responsif — Web Dashboard (Frontend)

Seluruh halaman Web Dashboard **wajib responsif** menggunakan breakpoint standar CSS berikut:

| Breakpoint | Lebar Layar | Perilaku Layout |
|:---|:---|:---|
| **Mobile (sm)** | ≥ 360px | Sidebar tersembunyi. Navigasi bergeser ke **Bottom Navigation Bar** (5 ikon utama). Konten 1 kolom penuh. |
| **Tablet (md)** | ≥ 768px | Sidebar tampil sebagai **ikon saja** (collapsed). Konten 2 kolom. Peta Live Monitoring mengecil. |
| **Desktop (lg)** | ≥ 1280px | Sidebar tampil **penuh** (ikon + teks menu). Konten multi-kolom. Tampilan standar utama. |
| **Large Desktop (xl)** | ≥ 1536px | Layout lebar penuh. Panel statistik KPI melebar. Tabel data lebih banyak kolom terlihat. |

### Ketentuan Tambahan Responsif FE:
*   **Tabel Data:** Pada breakpoint Mobile dan Tablet, kolom tabel yang tidak esensial disembunyikan. Scroll horizontal diperbolehkan untuk tabel dengan data padat.
*   **Peta Geospatial (Leaflet):** Tinggi peta menyesuaikan viewport secara dinamis (`height: calc(100vh - topbar_height)`).
*   **Modal & Dialog:** Selalu tampil lebar penuh di Mobile (100vw), terpusat dengan lebar maksimum di Desktop.
*   **Tombol Aksi:** Di Mobile, tombol aksi (Approve/Reject) pindah ke bagian bawah layar sebagai Fixed Action Button (FAB).

---

## 5. Spesifikasi Responsif — Aplikasi Mobile Flutter

### 5.1 Prinsip Dasar Responsif Flutter
*   Gunakan `LayoutBuilder` dan `MediaQuery` untuk mendeteksi ukuran layar secara dinamis.
*   Semua dimensi menggunakan **persentase relatif** (`MediaQuery.of(context).size.width * 0.XX`) atau widget `Flexible` / `Expanded`, **bukan nilai pixel statis**.
*   Target perangkat utama: **Smartphone Android** (layar 360dp–480dp lebar).
*   Target perangkat sekunder: **Tablet Android** (layar 600dp–840dp lebar).

### 5.2 Breakpoint Flutter

| Kondisi | Lebar (dp) | Perilaku Layout |
|:---|:---|:---|
| **Compact (HP kecil)** | < 360dp | Font dikurangi 10%. Padding minimal. Elemen di-stack vertikal. |
| **Medium (HP standar)** | 360dp – 479dp | Tampilan standar. Layout utama 1 kolom. |
| **Large (HP besar/Tablet kecil)** | 480dp – 599dp | Elemen dapat tampil 2 kolom di beranda. |
| **Tablet** | ≥ 600dp | Grid 2 kolom. Navigasi pindah ke **NavigationRail** (sidebar kiri). |

### 5.3 Ketentuan Koneksi Internet (Online-Only)
*   **Semua fitur inti wajib online:** Deteksi AI foto sampah, scan QR, melihat riwayat, dan menambah poin memerlukan koneksi internet aktif karena bergantung pada Backend API dan AI Mock Service.
*   **Penanganan Offline:** Ketika koneksi terputus (`DioException.type == connectionTimeout` atau `connectionError`):
    1.  Tampilkan **Banner merah** di bagian atas layar: *"Tidak ada koneksi internet. Beberapa fitur tidak tersedia."*
    2.  Tombol **"Foto & Pilah Sampah"** dan **"Scan QR Tong"** dinonaktifkan (`onPressed: null`).
    3.  Halaman **Riwayat** dan **Poin** dapat tetap tampil menggunakan **cache terakhir** (dari `SharedPreferences`).
*   **Cek Koneksi:** Gunakan package `connectivity_plus` untuk memantau perubahan status jaringan secara real-time.

