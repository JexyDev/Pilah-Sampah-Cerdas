# UI/UX Specification & Flow — BERSEKA

## 1. Panduan Visual & Desain System
*   **Tema:** Light Mode Only. Tidak ada toggle dark/light mode.
*   **Font Standard:** **Poppins** (semua platform — web dashboard & mobile Flutter). Import dari Google Fonts.
*   **Hierarki Font:**
    *   Heading (H1-H3): `Poppins Bold` (weight 700) atau `Poppins SemiBold` (weight 600).
    *   Body: `Poppins Regular` (weight 400).
    *   Caption: `Poppins Medium` (weight 500).
*   **Palet Warna:**
    *   **Primary Green (Hijau Daun):** `#4CAF50` (Sampah organik, tempat sampah organik, tombol konfirmasi utama).
    *   **Primary Blue (Biru Priangan):** `#0056A4` (Sampah anorganik, tempat sampah anorganik, teknologi GIS).
    *   **Peta GIS Engine:** Menggunakan library gratis **Leaflet.js** dan **OpenStreetMap** (OSM).
    *   **Danger Red (Merah Alarm):** `#EF4444` (Kapasitas tempat sampah kritis >90%, error, mismatch).
    *   **Warning Yellow (Kuning Transisi):** `#F59E0B` (Kapasitas sedang 70-90%).
    *   **Background Canvas:** `#F9FAFB` (Abu-abu terang).
    *   **Card Background:** `#FFFFFF` (Putih bersih dengan shadow tipis).

---

## 2. Struktur Halaman & Navigasi Web Dashboard (Superset)

### 2.1 Sidebar & Topbar (Navigasi Global per Role)
*   **Sidebar (Kiri):**
    *   Logo hijau daun `BERSEKA`.
    *   Menu navigasi (ikon Lucide):
        *   **Dashboard Monitoring Warga** (Tampilan khusus Warga: Status 2 Tempat Sampah, Grafik Setoran, Leaderboard, Status Reset).
        *   **Management Reset Tempat Sampah** *(Halaman Khusus RT & RW)*: Review foto bukti & approval/rejection reset tempat sampah warga wilayahnya.
        *   **Live Monitoring Geospatial** (Peta real-time titik tempat sampah + batas wilayah RT/RW/Kelurahan).
        *   **Master Data Dropdown** (User, Kelurahan, RT/RW, Rumah Tangga, Tempat Sampah, Kategori Sampah).
        *   **Papan Peringkat (Leaderboard)** (Poin & akumulasi kg terpilah).

> ⚠️ DEPRECATED (flow lama)
> *Dahulu: Menu Tukar Poin / Catalog Reward aktif di Web/Mobile.*
> *Digantikan: Menu Penukaran Reward berstatus `[COMING SOON]`. Poin hanya untuk statistik Akumulasi & Leaderboard.*

---

## 3. Acuan Aset Visual UI Mobile (Flutter — Thin-Client)
Screen acuan desain pada branch `mobile` (`/mobile/assets/stitch_ui/`):
1.  `splash_screen_minimalist.png`: Layar pembuka.
2.  `login.png`: Autentikasi berbasis **Nomor Telepon** (Warga/Pengurus), **NIM** (KKN), **NIP** (DPL). Tanpa NIK.
3.  `beranda.png`: Dasbor Warga menampilkan status 2 Tempat Sampah (Organik & Anorganik), total poin, dan riwayat.
4.  `scan_qr_bin.png`: UI pemindaian QR Code pada tempat sampah fisik.
5.  `riwayat_pemilahan.png`: Log penyetoran volume (L) & berat (Kg).
6.  `poin_saya.png`: Ledger akumulasi poin & posisi Leaderboard.
7.  `profil_rumah_tangga.png`: Data rumah tangga, alamat, & geotag presisi GPS rumah Warga.
8.  `aktivasi_bin.png`: Halaman scan QR aktivasi 2 tempat sampah baru (didampingi Mahasiswa KKN).
9.  `ajukan_reset.png`: Halaman khusus Warga foto bukti & kirim request reset tempat sampah penuh ke RT/RW setempat.
10. `bin_mismatch.png`: Penanganan error jenis sampah AI tidak cocok dengan jenis tempat sampah.

---

## 4. Spesifikasi Responsif — Web Dashboard (Frontend)

| Breakpoint | Lebar Layar | Perilaku Layout |
|:---|:---|:---|
| **Mobile (sm)** | ≥ 360px | Sidebar tersembunyi, navigasi pindah ke Bottom Bar. Layout 1 kolom. |
| **Tablet (md)** | ≥ 768px | Sidebar ikoncollapsed, layout 2 kolom. |
| **Desktop (lg)** | ≥ 1280px | Sidebar penuh (teks + ikon). Layout multi-kolom utama. |
| **Large Desktop (xl)** | ≥ 1536px | Layout lebar penuh dengan panel statistik tambahan. |

---

## 5. Spesifikasi Responsif — Aplikasi Mobile Flutter
* **Online-Only:** Semua fitur penyetoran AI & Scan QR memerlukan koneksi internet aktif.
* **Geofencing UI:** Peringatan visual jika lokasi GPS Warga melebihi 10m dari lokasi rumah/tempat sampah terdaftar.
