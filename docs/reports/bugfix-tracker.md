# Bugfix Tracker

## DASHBOARD
- [x] Dropdown pilih RT/wilayah di header tidak berfungsi — terhubung ke `/dashboard/regions`, memperbarui `user.wilayah` dan memfilter seluruh KPI, grafik, serta data tabel di dashboard.
- [x] Dropdown filter di grafik "Tren Setoran Sampah per Minggu" tidak berfungsi — terhubung ke endpoint `/dashboard/trend` dengan parameter `weeks` dan `wilayah`.
- [x] Bagian "Kepatuhan RT/RW" dibuat dinamis dari data asli — ditambahkan tombol "Kepatuhan RT/RW" yang memicu modal modern berisi progres kepatuhan dari `/bins/locations`.
- [x] Bagian "Data Tempat Sampah Terbaru" (master data) — ditambahkan kolom Poin per kg dan tombol Aksi (Detail, Edit, Delete) yang terhubung ke API backend.
- [x] Icon "Jadwal Kegiatan" di dashboard tidak bisa diklik — dihubungkan via `linkTo="/jadwal-kegiatan"`.
- [x] Icon "Aktivitas Terbaru" pemilik/warga tidak bisa diklik — dihubungkan via link ke `/rekap-setoran`.
- [x] Icon "Notifikasi Sistem" tidak bisa diklik — membuka panel notifikasi dan tombol menuju `/notifikasi`.

## HALAMAN TEMPAT SAMPAH / QR
- [x] Tombol "Detail Bin" tidak bisa diklik — menambahkan modal Detail Smart Bin dengan QR code, serial ID, pemilik, lokasi, kategori, kapasitas, dan koordinat GPS.
- [x] Gambar QR code masih placeholder UI — diganti dengan QR code sungguhan yang digenerate per bin (`https://api.qrserver.com/v1/create-qr-code/?data=${kode}`).
- [x] Di halaman Manajemen Tempat Sampah: QR code ditampilkan sebagai gambar QR asli + teks ID/serial di bawahnya.
- [x] Fitur Maps masih simulasi — dikembangkan jadi peta asli dengan Leaflet yang menampilkan titik lokasi bin dan rumah warga asli dari database.
- [x] Tombol "Tambah Titik" belum berfungsi — form pemilih koordinat dan pendaftaran lokasi tempat sampah baru tersimpan ke backend.
- [x] Tombol "Laporan" belum berfungsi — fitur ekspor data ke file CSV asli berdasarkan filter aktif.

## HALAMAN MANAJEMEN PENGGUNA
- [x] Kolom data yang belum ada di tabel: NIK, Peran, Wilayah, Setoran, Status — ditambahkan kolom NIK di bawah Nama dan kolom Peran, Wilayah, Setoran, Status lengkap.
- [x] Bagian Setting Password: ubah agar password bisa ditampilkan (toggle show/hide, ikon mata) — ditambahkan tombol toggle `Eye`/`EyeOff` pada input password modal.
- [x] Fitur pencarian (search bar) — terhubung ke query parameter `search` di backend API `/users`.
- [x] Filter Peran, Status, RW, RT — terhubung sebagai query parameters `roleName`, `status`, `rw`, `rt` ke backend API `/users`.
- [x] Tombol "Tambah Pengguna" — form modal create user terhubung ke `POST /users` dengan validasi lengkap.
- [x] Fitur "Export CSV" — mengunduh file CSV data pengguna terfilter.

## HALAMAN MANAJEMEN LOKASI
- [x] SEMUA fitur di halaman ini berfungsi penuh:
  - [x] Tombol "Tambah Lokasi" — form input lokasi baru submit ke `POST /bins/areas` tersimpan dengan koordinat GPS Leaflet map.
  - [x] Peta — peta Leaflet interaktif menampilkan data lokasi tempat sampah & rumah warga sungguhan dari database.
  - [x] Search bar lokasi — terhubung ke filter pencarian nama wilayah.
  - [x] Dropdown filter RT/Kelurahan — terhubung ke data RT & Kelurahan asli dan menerapkan filter ke daftar serta peta.
  - [x] Ikon modern — menggunakan icon set `lucide-react` secara konsisten.

## HALAMAN JADWAL KEGIATAN
- [x] Backend memuat data jadwal kegiatan ke frontend — `GET /schedules` terhubung dan mengembalikan data ISO 8601 konsisten `{ success: true, data: [...] }`.
- [x] Tombol "Buat Jadwal Baru" — terhubung ke form modal 2-step (Map polygon/radius + detail form) yang submit ke `POST /schedules` dan `PUT /schedules/:id`.
- [x] BUG KRITIS: "Invalid time value" diperbaiki:
  - [x] Validasi input tanggal dan waktu di form sebelum submit.
  - [x] Backend mengembalikan format tanggal ISO 8601 yang valid.
  - [x] Frontend menggunakan `safeFormatDate` & `safeFormatTime` yang memberikan fallback `"-"` alih-alih crash.

## HALAMAN REKAP SETORAN — BUG RBAC PENTING
- [x] BUG RBAC Setoran Sampah: Endpoint pencatatan setoran sampah (`/api/v1/bins/scan`, `/api/v1/waste/detect`) dilindungi secara ketat dengan `roleMiddleware(["WARGA"])` di backend, dan UI `RekapSetoran.tsx` murni berupa laporan audit read-only. Role non-Warga ditolak (403 Forbidden).

## HALAMAN POIN WARGA — DETAIL PROFIL
- [x] Data profil, riwayat poin, dan leaderboard terhubung penuh ke backend API `/points/leaderboard` & `/points/history/:userId`.
- [x] Ringkasan poin per warga, riwayat penambahan/pengurangan poin, dan search filter fungsional (nama & RT/RW).
- [x] Tombol "Beri / Penyesuaian Poin Manual" (khusus Admin & RW) — modal form submit penyesuaian poin ke `POST /points/adjust` dengan notifikasi otomatis.

## NOTIFIKASI — BUG RBAC KRITIS (SALAH IZIN AKSES)
- [x] BUG RBAC Notifikasi: Saat role Admin/RW/Petugas mengklik notifikasi Pengosongan Tempat Sampah, komponen `Notifikasi.tsx` menampilkan modal Tinjau Review Pengosongan dengan tombol ACC / Tolak & foto bukti warga, sedangkan form upload foto bukti HANYA ditampilkan untuk role Warga.
- [x] Audit komponen notifikasi: setiap role hanya melihat aksi yang relevan (Warga = form pengajuan, Admin/Petugas = review & approval).
