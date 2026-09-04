# 📜 AGENTS.md — Agent Rulebook & Development Guidelines

## 👨‍💻 1. Profil Pengguna & Arsitektur Workspace
- **Role**: Senior Fullstack Developer & AI Engineer.
- **Struktur Repositori**:
  - `main/` (Monorepo Node.js / Express API Backend & React Web Dashboard)
  - `mobile/` (Aplikasi Mobile Flutter untuk Warga & Mahasiswa KKN)

---

## 🛡️ 2. Aturan Keamanan Git & Branch
1. **DILARANG KERAS PUSH LANGSUNG KE `main`**:
   - Jangan pernah menjalankan `git push origin main` atau push langsung ke branch `main`.
   - Segala perubahan wajib melalui branch pengembangan (`feat/*`, `fix/*`) atau Pull Request.
2. **Sinkronisasi & Keamanan Kode Tim**:
   - Selalu periksa `git status` dan amankan perubahan lokal (stash/commit) sebelum melakukan pull/rebase agar perubahan anggota tim tidak saling tertimpa atau konflik.
   - Dilarang keras melakukan `push --force` pada branch bersama.

---

## 🚫 3. Anti-Regression & Role-Scoping Rules (Pencegahan Bug Berulang)
1. **Dilarang Merusak Fiksasi Sebelumnya (Anti-Revert)**:
   - Sebelum mengubah atau merefaktor komponen dashboard/halaman, AI Agent WAJIB mengecek riwayat fiksasi dan aturan bisnis yang sudah disepakati (Single Source of Truth).
   - Dilarang keras mengembalikan fitur/label yang sudah dikoreksi Klien/Atasan (contoh: label "Ajukan Absensi" HANYA milik Mahasiswa KKN, DILARANG muncul di Dasbor DPL/Taskforce).
2. **Role-Based Component Scoping**:
   - **Dasbor DPL**: Menu & kartu berupa `Validasi Izin & Sakit`, `Monitoring Kelompok` (Bukan `Ajukan Absensi`).
   - **Dasbor Taskforce**: Menu & kartu berupa `Monitoring Presensi`, `Validasi Survei`.
   - **Aplikasi Mahasiswa / Warga**: Menu `Ajukan Absensi`, `Setor Sampah`.
   - Selalu gunakan guard peran yang ketat (`useAuthStore` role check) untuk memfilter navigasi.

---

## 🎨 4. Anti-Slop Guidelines (Filter Visual & Copywriting Generik AI)
1. **No Generic AI Slop Visuals**:
   - Dilarang membuat visual khas AI generik (gradient biru-purple bawaan, floating centered card polos, atau elemen template tanpa ciri khas).
   - Landing Page & UI Web WAJIB menggunakan identitas visual **BERSEKA Eco-Tech** (Warna Emerald/Slate terkurasi `#059669`, `#0f172a`, typography `Plus Jakarta Sans`, serta visual berkarakter humanis lokal Bandung).
2. **No AI Buzzword Copywriting**:
   - Dilarang menggunakan kalimat AI generik seperti *"Seamless, Empowering, Next-Gen, Revolutionary, All-in-One Solution"*.
   - Gunakan kalimat manusiawi, lugas, profesional, dan kontekstual seputar penimbangan sampah & KKN.

---

## 💎 5. Taste-Skill Standards (Frontend Craftsmanship)
1. **Typography & Hierarchy**:
   - Gunakan hirarki typography yang kontras antara judul (`font-black`/`font-extrabold`) dan teks isi (`font-medium`/`font-normal`).
2. **Micro-Animations & Responsive Tactility**:
   - Tambahkan interaksi mikro yang halus saat tombol/card di-hover (`hover:scale-[1.01]`, transition shadow, active state feedback).
3. **No Unstyled Elements**:
   - Setiap elemen interaktif wajib memiliki custom state focus, hover, dan dark/light mode yang konsisten.

---

## ⚙️ 6. Verifikasi & Integritas Teknis
1. **Kompilasi Safe**: Setiap perubahan backend/web WAJIB diverifikasi `npx tsc --noEmit` (0 error) sebelum diajukan.
2. **VPS Touch Approval**: Dilarang mengubah server VPS tanpa persetujuan dan review eksplisit dari pengguna.

---

## ⚠️ 7. Panduan Diagnosa & Antisisipasi 8 Jenis Error Programming

Agent wajib memahami, mengidentifikasi, dan mencegah 8 jenis error berikut dalam setiap siklus pengembangan:

1. **Logical Error (Kesalahan Logika & Algoritma)**
   - *Ciri*: Kode berjalan tanpa crash, namun output/perilaku program salah (contoh: regresi label dashboard, atau salah urutan perhitungan poin).
   - *Pencegahan*: Verifikasi aturan bisnis & scoping role sebelum menulis kode; tulis self-check logic.
2. **Syntax Error (Kesalahan Tata Bahasa Kode)**
   - *Ciri*: Kode gagal berjalan sama sekali karena kesalahan ejaan kata kunci, kurung buka/tutup yang hilang, atau struktur broken.
   - *Pencegahan*: Lakukan linter check & verifikasi keakuratan penulisan kode.
3. **Runtime Error (Kesalahan Saat Program Berjalan)**
   - *Ciri*: Program mengalami *crash* atau melempar pengecualian (*uncaught exception*) saat diproses (contoh: *null pointer dereference*, *unhandled promise rejection*).
   - *Pencegahan*: Gunakan *optional chaining* (`?.`), validasi `non-null`, dan *try-catch error boundary*.
4. **Compilation Error (Kesalahan Saat Build / Transpile)**
   - *Ciri*: TypeScript/Compiler gagal mengubah kode ke JavaScript/executable karena *type mismatch* atau *missing export/import*.
   - *Pencegahan*: Selalu jalankan `npx tsc --noEmit` secara lokal sebelum menganggap pekerjaan selesai.
5. **Interfacing Error (Kesalahan Protokol & Kontrak API)**
   - *Ciri*: Ketidaksesuaian kontrak payload antara frontend (Mobile/Web) dan backend API (contoh: format JSON beda, endpoint URL salah, HTTP status code keliru).
   - *Pencegahan*: Inspeksi skema DTO/Interface API secara utuh sebelum mengonsumsi data.
6. **Arithmetic Error (Kesalahan Perhitungan Matematika)**
   - *Ciri*: Operasi matematika yang tidak valid (contoh: pembagian angka dengan `0`, nilai `NaN`, atau *overflow* urutan kurung).
   - *Pencegahan*: Validasi pembagi tidak nol (`denominator !== 0`) dan gunakan pembulatan aman (`Math.round` / `toFixed`).
7. **Resource Error (Kesalahan Sumber Daya System / Memory Exceed)**
   - *Ciri*: Penggunaan memori/CPU melebihi kapasitas server, *memory leak*, atau *queue overflow*.
   - *Pencegahan*: Lakukan *compression image* di client, atur batas *time-out*, dan bersihkan resource listener/cron.
8. **Semantic Error (Kesalahan Makna Eksekusi Kode)**
   - *Ciri*: Pernyataan secara sintaksis valid, tetapi menghasilkan operasi yang tidak memiliki arti/makna bisnis (contoh: variabel terdefinisi tapi bernilai `undefined` tanpa kegunaan).
   - *Pencegahan*: Pastikan variabel dan ekspresi kode memiliki makna dan kegunaan nyata yang sesuai tujuan bisnis.

---

## 🐛 8. Backlog Perbaikan QC — "Pilah Sampah Cerdas" (Website)

> Daftar ini merupakan hasil Quality Control (QC) resmi. Agent WAJIB menyelesaikan perbaikan berdasarkan urutan prioritas: **FAIL → MINOR → ENHANCEMENT/TASK**.
> Setiap fix harus di-commit pada branch `fix/<nomor-poin>-<slug-deskripsi>` dan PR wajib mencantumkan nomor poin QC terkait.

---

### 🔴 PRIORITAS 1 — FAIL (Wajib Diselesaikan Segera)

#### [QC-05] Redundansi Filter Tanggal di Menu Presensi
- **Scope**: Semua Role | **Menu**: Presensi
- **Masalah**: Komponen filter tanggal masih ada di halaman Presensi, padahal sudah dipusatkan di "Laporan Presensi".
- **Aksi Agent**:
  1. Temukan komponen filter tanggal (`DateRangePicker` / `DateFilter` / serupa) di halaman `Presensi`.
  2. Hapus rendering komponen tersebut dari halaman Presensi.
  3. Pastikan UI Presensi tidak menampilkan input filter tanggal sama sekali.
- **Verifikasi**: Halaman Presensi tampil tanpa komponen filter tanggal; tidak ada error setelah penghapusan.

#### [QC-04] UI Filter Berantakan pada Halaman Laporan Presensi
- **Scope**: Semua Role | **Menu**: Laporan Presensi
- **Masalah**: Tampilan dropdown/filter tidak rapi, spacing/alignment kacau.
- **Aksi Agent**:
  1. Audit layout filter (dropdown bulan, tahun, kelurahan, dll.) menggunakan Flexbox/Grid Tailwind.
  2. Standardisasi spacing: gunakan `gap-3` atau `gap-4` antar elemen filter.
  3. Terapkan responsive breakpoints (`sm:`, `md:`) agar filter tidak tumpang tindih di layar kecil.
  4. Pastikan label & input memiliki alignment vertikal yang konsisten (`items-center`).
- **Verifikasi**: Layout filter rapi di resolusi 1280px, 1024px, dan 768px.

#### [QC-07] Fallback Lokasi Kerja Default Kampus Unikom
- **Scope**: Mahasiswa (Website + Mobile) | **Menu**: Presensi / Geofencing
- **Masalah**: Jika mahasiswa/kelompok belum memiliki mapping area kerja, geofencing gagal tanpa fallback.
- **Aksi Agent**:
  1. **Backend**: Tambahkan konstanta koordinat default Kampus Unikom (misal: `{ lat: -6.8681, lng: 107.5886, radius: 200 }`) di konfigurasi geofencing.
  2. **Backend**: Pada logika validasi presensi, jika query area kerja kelompok kosong/null, gunakan koordinat default tersebut.
  3. **Frontend/Mobile**: Tampilkan notifikasi/label "Menggunakan lokasi default Kampus Unikom" jika fallback aktif.
- **Verifikasi**: Mahasiswa tanpa mapping area kerja tetap bisa presensi menggunakan koordinat fallback Unikom.

#### [QC-11] Tabel Overflow & Tombol Aksi Terpotong di Linimasa
- **Scope**: Super Admin | **Menu**: Linimasa
- **Masalah**: Kolom "Aksi" terpotong, tabel tidak bisa digeser horizontal.
- **Aksi Agent**:
  1. Bungkus elemen `<table>` dalam `<div className="overflow-x-auto w-full">`.
  2. Tambahkan `whitespace-nowrap` pada sel kolom Aksi dan kolom yang mengandung teks panjang.
  3. Pastikan tabel memiliki `min-w-max` atau `table-auto` agar kolom tidak collapse.
- **Contoh pola**:
  ```tsx
  <div className="overflow-x-auto w-full rounded-lg border border-slate-200">
    <table className="min-w-max w-full text-sm">
      {/* ... */}
      <td className="whitespace-nowrap px-4 py-2">
        {/* Tombol Aksi */}
      </td>
    </table>
  </div>
  ```
- **Verifikasi**: Tabel Linimasa memiliki horizontal scroll di resolusi 1024px ke bawah; tombol Aksi tidak terpotong.

#### [QC-15] Fatal Runtime Error "user is not defined" di Rekapitulasi Setoran
- **Scope**: Super Admin | **Menu**: Rekapitulasi Setoran
- **Masalah**: `ReferenceError: user is not defined` saat halaman dimuat.
- **Aksi Agent**:
  1. Lacak sumber error: periksa apakah `user` diambil dari `useAuthStore()`, `useContext(AuthContext)`, atau props.
  2. Tambahkan guard null-check di atas JSX:
     ```tsx
     const { user } = useAuthStore();
     if (!user) return <LoadingSpinner />;
     ```
  3. Terapkan optional chaining pada setiap akses properti user: `user?.id`, `user?.name`, `user?.role`.
  4. Pastikan tidak ada variabel `user` yang di-destructure dari sumber yang belum di-initialize.
- **Verifikasi**: Halaman Rekapitulasi Setoran memuat tanpa error di console; `user` terdefinisi sebelum render.

#### [QC-06] Standarisasi Naming Role "PIMPINAN"
- **Scope**: Role Pimpinan | **Menu**: Pengaturan Profil & seluruh UI
- **Masalah**: Label role masih tertulis `"PEMIMPIN"` di berbagai tempat.
- **Aksi Agent**:
  1. Lakukan global search: `grep -r "PEMIMPIN" src/` untuk menemukan semua kemunculan.
  2. Ganti semua label teks, konstanta, enum, dan conditional `role === 'PEMIMPIN'` menjadi `"PIMPINAN"`.
  3. Periksa juga nilai yang mungkin datang dari backend (seed/migration DB) — koordinasikan dengan backend jika perlu migrasi data.
  4. Pastikan tidak ada tampilan yang masih menampilkan teks "PEMIMPIN" di seluruh role Pimpinan.
- **Verifikasi**: Semua label role terkait Pimpinan menampilkan "PIMPINAN" secara konsisten.

---

### 🟡 PRIORITAS 2 — MINOR (Diselesaikan Setelah FAIL)

#### [QC-10] Routing Detail Card "Top 10" & Ranking Kelurahan
- **Scope**: Super Admin | **Menu**: Dashboard
- **Masalah**: Link detail card "Top 10..." belum semua mengarah ke route yang benar; data ranking "Top 10 Kelurahan" tidak muncul.
- **Aksi Agent**:
  1. Audit setiap card "Top 10" — pastikan prop `href` / `onClick` navigate mengarah ke route yang valid dan konsisten.
  2. Periksa API endpoint untuk "Top 10 Kelurahan": validasi response payload memiliki field `rank` / nomor urut.
  3. Jika field rank tidak ada di response, hitung ranking di frontend menggunakan index array: `index + 1`.
  4. Tampilkan nomor ranking (badge/kolom) pada list "Top 10 Kelurahan" di UI.
- **Verifikasi**: Semua card "Top 10" linkable dengan route benar; "Top 10 Kelurahan" menampilkan nomor 1-10.

#### [QC-27] Integrasi Input Link Google Drive pada Form Kelompok
- **Scope**: Super Admin | **Menu**: Kelompok
- **Masalah**: Field `gdrive_link` pada modal form kelompok tidak tersimpan ke database.
- **Aksi Agent**:
  1. **Frontend**: Pastikan field `gdrive_link` terdaftar di `formState` / `react-hook-form` dan disertakan dalam payload `POST`/`PUT`.
  2. **Validasi Frontend**: Tambahkan validasi format URL Google Drive (regex: `^https:\/\/drive\.google\.com\/`).
  3. **Backend**: Pastikan kolom `gdrive_link` ada di schema/model DB dan endpoint `create`/`update` kelompok menerima field ini.
  4. **Frontend**: Saat mode edit, pastikan nilai `gdrive_link` di-populate kembali ke input dari data API.
- **Verifikasi**: Link Google Drive tersimpan ke DB saat create/edit; tampil kembali saat buka modal edit.

#### [QC-17b / QC-09] Default Basemap Satelit untuk Semua Role
- **Scope**: Semua Role (khususnya Pimpinan) | **Menu**: Monitoring Wilayah (Maps)
- **Masalah**: Layer default peta bukan Satelit saat halaman maps dibuka.
- **Aksi Agent**:
  1. Temukan inisialisasi instance map (Leaflet `L.map()` / Mapbox `mapboxgl.Map()` / Google Maps `new google.maps.Map()`).
  2. Set tile layer default ke Satelit:
     - **Leaflet**: `L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}').addTo(map)`
     - **Mapbox**: `style: 'mapbox://styles/mapbox/satellite-v9'`
  3. Pastikan layer Satelit aktif saat komponen pertama kali mount, bukan hanya saat tombol switcher diklik.
- **Verifikasi**: Halaman Maps terbuka langsung dengan layer Satelit tanpa interaksi tambahan.

#### [QC-21] Tampilkan Nomor Ranking pada Leaderboard Total Point
- **Scope**: Semua Role | **Menu**: Dashboard — Leaderboard / Papan Peringkat
- **Masalah**: Nomor urut peringkat tidak ditampilkan pada list/tabel total point Kelurahan/Kelompok.
- **Aksi Agent**:
  1. Tambahkan kolom/elemen "Rank" (nomor urut) pada tabel/list leaderboard.
  2. Jika data sudah diurutkan dari backend, gunakan `index + 1` untuk nomor urut.
  3. Beri styling khusus untuk rank 1, 2, 3 (ikon trophy / warna emas/perak/perunggu).
- **Verifikasi**: Leaderboard menampilkan nomor 1, 2, 3, dst. di sebelah kiri nama kelurahan/kelompok.

---

### 🔵 PRIORITAS 3 — ENHANCEMENT & TASK (Fitur Baru / Pembaruan)

#### [QC-17a] Dynamic Text Loading Sesuai Role
- **Scope**: Super Admin, Pimpinan | **Menu**: Global / Loading Screen
- **Masalah**: Teks loading hardcoded "Memuat Portal DPL" untuk semua role.
- **Aksi Agent**:
  1. Buat mapping konstanta teks loading berdasarkan role:
     ```ts
     const LOADING_TEXT: Record<string, string> = {
       SUPER_ADMIN: 'Memuat Portal Super Admin',
       PIMPINAN:    'Memuat Portal Pimpinan',
       DPL:         'Memuat Portal DPL',
       TASKFORCE:   'Memuat Portal Taskforce',
       MAHASISWA:   'Memuat Portal Mahasiswa',
     };
     ```
  2. Baca role dari auth store/session sebelum komponen loading dirender.
  3. Render teks loading secara dinamis: `LOADING_TEXT[role] ?? 'Memuat Portal...'`.
- **Verifikasi**: Setiap role menampilkan teks loading yang sesuai saat berpindah halaman.

#### [QC-16] Pembaruan Asset Logo
- **Scope**: Semua Role | **Menu**: Navbar, Sidebar Header, Favicon
- **Ekspektasi**:
  1. Ganti file asset logo lama dengan file logo resmi terbaru di direktori `public/assets/` atau `src/assets/`.
  2. Update referensi logo di: komponen Navbar, komponen Sidebar header, dan `index.html` (tag `<link rel="icon">`).
  3. Pastikan logo baru memiliki format optimal: SVG untuk navbar/sidebar, `.ico` / `.png 32x32` untuk favicon.
- **Verifikasi**: Logo terbaru tampil di navbar, sidebar header, dan browser tab favicon.

#### [QC-18] Pencarian Tempat Sampah Berdasarkan Nama
- **Scope**: Semua Role | **Menu**: Tempat Sampah
- **Masalah**: Filter pencarian hanya bisa berdasarkan "Kode".
- **Aksi Agent**:
  1. **Frontend**: Update logika filter agar input search memeriksa field `kode` DAN `nama` secara bersamaan:
     ```ts
     const filtered = data.filter(item =>
       item.kode.toLowerCase().includes(query.toLowerCase()) ||
       item.nama.toLowerCase().includes(query.toLowerCase())
     );
     ```
  2. **Backend** (jika search berbasis API): Update query `WHERE kode LIKE ? OR nama LIKE ?` dengan parameter yang sama.
  3. Update placeholder input: `"Cari berdasarkan Nama atau Kode..."`.
- **Verifikasi**: Input nama tempat sampah menemukan hasil yang relevan; tidak hanya kode yang bisa dicari.

#### [QC-22] Munculkan Menu "Panduan" di Sidebar
- **Scope**: Semua Role | **Menu**: Navigasi Sidebar
- **Ekspektasi**:
  1. Temukan konfigurasi sidebar nav (biasanya array `navItems` atau `routes`).
  2. Un-hide / un-comment item menu "Panduan" yang sebelumnya disembunyikan.
  3. Pastikan route `/panduan` aktif dan mengarah ke halaman/konten yang valid.
- **Verifikasi**: Menu "Panduan" terlihat di sidebar semua role; klik menu membuka halaman yang sesuai.

#### [QC-20] Pembuatan Halaman "About"
- **Scope**: Semua Role | **Menu**: Halaman Static
- **Ekspektasi**:
  1. Buat route baru `/about` dan komponen halaman `AboutPage`.
  2. Konten halaman memuat:
     - Profil singkat tim pengembang.
     - Deskripsi hak akses tiap role (Super Admin, Pimpinan, DPL, Taskforce, Mahasiswa, Warga).
     - Informasi versi aplikasi.
  3. Tambahkan link ke halaman About di sidebar atau footer.
  4. Gunakan identitas visual BERSEKA (warna `#059669`, typography `Plus Jakarta Sans`).
- **Verifikasi**: Route `/about` dapat diakses semua role; konten informasi tim & role tampil dengan benar.

#### [QC-36] Advance Scheduling Polygon Area Kerja
- **Scope**: Super Admin | **Menu**: Monitoring Wilayah / Kelompok
- **Ekspektasi**:
  1. Tambahkan field `effective_month` (format: `YYYY-MM`) pada form input koordinat/polygon area kerja.
  2. **Backend**: Simpan polygon dengan field `effective_month`; query aktif harus memfilter berdasarkan bulan yang sedang berjalan.
  3. **Frontend**: Tambahkan input bulan/tahun (date picker bulan) pada form polygon, dengan validasi minimal 1 bulan ke depan dari bulan saat ini.
  4. UI daftar polygon menampilkan kolom "Berlaku Bulan" untuk memudahkan monitoring jadwal.
- **Verifikasi**: SU dapat menginput polygon bulan Oktober pada bulan September; sistem menggunakan polygon yang sesuai bulan aktif.

---

## 📋 9. Aturan Commit & PR untuk Perbaikan QC

Setiap fix wajib mengikuti konvensi berikut:

```
# Format nama branch:
fix/QC-<nomor>-<slug>

# Contoh:
fix/QC-15-runtime-error-rekapitulasi-setoran
fix/QC-06-rename-role-pimpinan
feat/QC-20-halaman-about
feat/QC-36-advance-scheduling-polygon

# Format pesan commit:
<type>(QC-<nomor>): <deskripsi singkat>

# Contoh:
fix(QC-15): tambah null-check user di halaman rekapitulasi setoran
fix(QC-06): rename label role PEMIMPIN -> PIMPINAN secara global
fix(QC-11): tambah overflow-x-auto pada tabel linimasa
feat(QC-20): buat halaman static About dengan info tim & role
```

**Checklist sebelum PR**:
- [ ] `npx tsc --noEmit` -> 0 error
- [ ] Self-tested sesuai role yang terdampak
- [ ] Tidak ada console error / warning baru
- [ ] Nomor QC tercantum di judul PR
