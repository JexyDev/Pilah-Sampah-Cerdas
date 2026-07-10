# PRD — Product Requirement Document
## pilahsampah.id | Frontend Web Dashboard
**Versi:** 1.0.0 | **Author:** Jeremy Darrell | **Tanggal:** 8 Juli 2026
**Status:** Active Development | **Phase:** Sprint 1 (Localhost)

---

## 1. Ringkasan Produk

**pilahsampah.id Frontend** adalah Web Dashboard Application berbasis React.js yang digunakan oleh **Admin Kecamatan** dan **Petugas RT/RW** untuk memantau kepatuhan pemilahan sampah rumah tangga di Kecamatan Coblong, Kota Bandung secara real-time. Dashboard menerima data dari Backend API dan menampilkan visualisasi interaktif, peta spasial, dan tabel monitoring.

### 1.1 Tujuan Produk
- Memberikan visibilitas real-time kondisi tong sampah dan kepatuhan warga
- Memudahkan petugas RT mengidentifikasi rumah tangga yang membutuhkan intervensi
- Menampilkan analytics dan prediksi AI untuk evaluasi bulanan
- Memfasilitasi kompetisi positif antar-warga melalui sistem gamifikasi leaderboard

### 1.2 Target Pengguna
| Role | Deskripsi | Akses |
|------|-----------|-------|
| Admin Kecamatan | Pegawai Kecamatan Coblong | Full access semua fitur |
| Petugas RT/RW | Warga yang ditunjuk sebagai petugas | Hanya data RT/RW mereka |

### 1.3 Referensi Desain
- **Acuan utama:** Stitch AI design pilahsampah.id (web dashboard version)
- **Design system:** `design.md` di project root
- Font: Plus Jakarta Sans | Icon: Lucide React | Colors: lihat `design.md`

### 1.4 Batasan Scope Sprint 1
- Data ditampilkan dari mock/seed database (bukan live IoT)
- Peta menggunakan SVG statis/Leaflet.js dengan data koordinat dari database
- Tidak ada fitur export PDF di Sprint 1 (placeholder button saja)

---

## 2. Fitur Halaman Web Dashboard

### 2.1 Halaman Auth (Login & Register)
- Split-screen layout 60/40
- Login form: email, password, dropdown role, tombol masuk
- Register form: NIK, nama, telepon, kelurahan, RT/RW, alamat, geotag GPS
- Auth menggunakan httpOnly Cookie (transparant untuk user, dikelola browser)
- Toggle mulus antara login dan register
- Success toast setelah registrasi

### 2.2 Dashboard Utama
- 4 KPI cards: Rumah Aktif, Kesadaran Pemilahan, Volume Terpilah, RT Butuh Intervensi
- Dual-line chart tren 30 hari (organik vs anorganik)
- Donut chart kapasitas rata-rata tong
- Mini peta kepatuhan (clickable → pindah ke halaman Peta)
- Panel peringatan tong penuh terkini (real-time via WebSocket)
- Evaluasi bulan lalu + prediksi bulan depan (AI)

### 2.3 Peta Wilayah
- Peta interaktif Kecamatan Coblong (SVG polygon atau Leaflet.js)
- Poligon zona RT berwarna: hijau/kuning/merah berdasarkan kepatuhan
- Titik koordinat rumah tangga (dot berwarna sesuai kapasitas tong)
- Filter panel di sisi kanan (kelurahan, status kepatuhan, kapasitas tong)
- Klik polygon RT → RT Detail sub-page (slide transition)
- RT Detail: KPI RT, tabel warga, daftar butuh intervensi, empty state

### 2.4 Data Warga & Tong Sampah
- Tabel kompleks dengan pagination (10 per halaman)
- Kolom: Nama KK, Alamat, Jenis Tong, Progress Bar Kapasitas, Status AI, Poin, Terakhir Aktif, Aksi
- Progress bar berwarna dinamis (hijau/amber/merah)
- Modal konfirmasi "Reset Volume"
- Search & filter multi-kriteria
- Empty state jika filter tidak menemukan data

### 2.5 Papan Peringkat (Leaderboard)
- Podium visual 🥇🥈🥉 Top 3 RT
- Daftar ranking RT lengkap + trend (naik/turun)
- Top 5 keluarga paling aktif
- Filter bulan dengan navigasi ← →
- Statistik gamifikasi bulanan

### 2.6 Evaluasi AI
- KPI akurasi AI (total request, success rate, avg response time, quota habis)
- Tabel log request AI (paginated, filter by status)
- Bar chart request per jam (hari ini)
- Line chart tren akurasi 30 hari

### 2.7 Komponen Global
- Sidebar navigasi dengan active state
- Topbar: search, tanggal, notifikasi bell (dropdown WebSocket), avatar
- Notifikasi bell: badge merah, dropdown list, klik → mark as read
- Toast notification system (slide-in dari kanan atas)

---

## 3. Non-Functional Requirements

| Aspek | Target |
|-------|--------|
| Initial load time | < 3 detik (localhost) |
| Re-render performa | Tidak ada unnecessary re-render (React.memo, useMemo) |
| Accessibility | WCAG AA minimum (kontras 4.5:1) |
| Browser support | Chrome 100+, Firefox 100+, Edge 100+ |
| Resolusi optimal | 1440px wide (desktop-first) |
| Sidebar collapse | Otomatis di ≤ 1024px |
| Mobile fallback | Readable di ≥ 375px |

---

## 4. Definisi Selesai (DoD) — Sprint 1

- [ ] Semua 6 halaman dapat diakses dan ditampilkan tanpa error di `http://localhost:5173`
- [ ] Login web menggunakan httpOnly cookie (verifikasi di browser DevTools → Application → Cookies)
- [ ] WebSocket terhubung dan notifikasi bell update real-time saat ada tong penuh
- [ ] Semua chart menampilkan data dari backend seed (bukan hardcoded di frontend)
- [ ] Progress bar kapasitas berwarna merah untuk data ≥ 22.5L
- [ ] Peta klik → RT detail transition mulus
