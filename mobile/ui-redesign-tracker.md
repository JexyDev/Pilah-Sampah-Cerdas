# UI Redesign Tracker — pilahsampah.id Mobile

## Design Reference dari Web
Berikut adalah acuan desain visual yang diambil dari proyek frontend web (`frontend/src/index.css`):

### 1. Warna (Color Palette)
*   **Warna Utama (Organic Green)**:
    *   `Primary`: `#006d37` (Hijau Utama)
    *   `Primary Container / Success`: `#27ae60` (Hijau Terang)
    *   `On Primary`: `#ffffff`
*   **Warna Kedua (Non-Organic Blue)**:
    *   `Secondary`: `#006397` (Biru Utama)
    *   `Secondary Container`: `#5cb8fd` (Biru Terang)
    *   `On Secondary`: `#ffffff`
*   **Warna Latar & Netral (Neutral / Surface)**:
    *   `Background`: `#f7f9fc` (Abu-abu kebiruan sangat terang)
    *   `Surface`: `#f7f9fc`
    *   `Surface Container Lowest`: `#ffffff` (Putih bersih untuk card / latar form)
    *   `Surface Container Low`: `#f2f4f7`
    *   `Surface Container`: `#eceef1`
    *   `On Surface (Text Utama)`: `#191c1e` (Hitam/Abu Gelap)
    *   `On Surface Variant (Text Sekunder)`: `#3d4a3f`
    *   `Outline (Border/Divider)`: `#6d7a6e`
    *   `Outline Variant (Border Ringan)`: `#bccabc`
*   **Warna Kesalahan (Error)**:
    *   `Error`: `#ba1a1a`
    *   `On Error`: `#ffffff`

### 2. Tipografi (Typography)
*   **Font Family**: `Plus Jakarta Sans` (atau Poppins sebagai fallback utama pada mobile)
*   **Heading Style**: Bold, warna `On Surface` (`#191c1e`)
*   **Body Style**: Regular/Medium, warna `On Surface Variant` (`#3d4a3f`)

### 3. Spacing, Radius & Shadow
*   **Border Radius**: `12px` (Card dan Input Field), `24px` (Tombol besar / Header Card)
*   **Card Spacing**: Padding `20px` (Internal card padding)
*   **Shadow**: Shadow halus (`BoxShadow` dengan warna hitam transparansi sangat rendah `rgba(0,0,0,0.05)`, blur radius `8px` ke atas)

---

## Progress Redesign Checklist

### 1. Setup & Bug Kritis
- [ ] Implementasi Warna Global di `lib/core/app_colors.dart` & Tema Terpusat (Plus Jakarta Sans)
- [ ] Perbaikan **Splash Screen Stuck** (ditambahkan timeout 3 detik + auto navigate sesuai Auth state)
- [ ] Penggunaan **Logo Asli** (`assets/logo.png`) pada Splash Screen dan Login Screen

### 2. Redesign Layar Mobile (Visual Redesign)
- [ ] **login_screen.dart** (Redesign form, logo asli, style input dan button, validasi & toast custom)
- [ ] **beranda_screen.dart** (Redesign dashboard warga, card poin/saldo/setoran dengan gaya card web)
- [ ] **scan_flow_screen.dart** (Redesign step-by-step UI deteksi sampah dan QR code bin)
- [ ] **poin_screen.dart** & **riwayat_screen.dart** (Redesign riwayat, list item, badge status, empty state)
- [ ] **profil_screen.dart** (Redesign avatar profil bulat dengan aksen web, edit profil form)
- [ ] **aktivasi_bin_screen.dart** & **reset_bin_screen.dart** (Redesign form & steps pengajuan)
- [ ] **main_shell.dart** (Redesign bottom navigation bar mengikuti gaya modern web)

### 3. Konsistensi Global & Transisi
- [ ] Gunakan variabel warna terpusat di semua widget (tidak ada warna hardcoded)
- [ ] Reusable Button Component untuk semua tombol primary/secondary
- [ ] Transisi antar halaman yang halus (page transition animation)
