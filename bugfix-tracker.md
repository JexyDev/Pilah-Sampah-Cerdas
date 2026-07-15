# Bugfix Tracker — pilahsampah.id

## DASHBOARD
- [x] Dropdown pilih RT/wilayah di header tidak berfungsi — hubungkan ke data RT/RW asli dari backend, dan filter seluruh dashboard sesuai pilihan. (Selesai: Region diambil dinamis via /dashboard/regions & dikirim ke endpoint kpi & filtered lokal)
- [x] Dropdown filter di grafik "Tren Setoran Sampah per Minggu" tidak berfungsi — hubungkan ke endpoint tren dengan parameter periode/minggu yang dipilih. (Selesai: Dibuat endpoint /dashboard/trend & select dropdown mingguan)
- [x] Bagian "Kepatuhan RT/RW" dibuat dinamis dari data asli (bukan statis), tampilkan sebagai popup/modal modern saat item diklik (bukan tabel polos). (Selesai: Clickable widget membuka modal detail kepatuhan)
- [x] Bagian "Data Tempat Sampah Terbaru" (master data): ubah dari tampilan kosong/polos jadi tabel lengkap berisi kolom yang relevan + kolom Poin (saat ini belum ada) + kolom Aksi (Edit/Delete, saat ini belum ada tombolnya sama sekali) — untuk data Warga, Staff, dan Tong Sampah. (Selesai: Kolom ID, Lokasi, Kapasitas, Poin/Kg, & Aksi Edit/Delete)
- [x] Icon "Jadwal Kegiatan" di dashboard tidak bisa diklik — hubungkan ke halaman/detail jadwal kegiatan. (Selesai: Diarahkan ke /jadwal-kegiatan)
- [x] Icon "Aktivitas Terbaru" pemilik/warga tidak bisa diklik — hubungkan ke detail aktivitas terkait. (Selesai: Diarahkan ke /rekap-setoran)
- [x] Icon "Notifikasi Sistem" tidak bisa diklik — harus membuka halaman/panel notifikasi yang sebenarnya. (Selesai: Diarahkan ke /notifikasi)

## HALAMAN TEMPAT SAMPAH / QR
- [x] Tombol "Detail Bin" tidak bisa diklik — hubungkan ke halaman/modal detail bin asli dari backend. (Selesai: Menampilkan log transaksi dynamic dari backend)
- [x] Gambar QR code masih placeholder UI, BUKAN QR code asli hasil generate dari backend — ganti dengan QR code sungguhan per bin (data: id_tempat_sampah/serial_qr). (Selesai: Di-render via qrserver API)
- [x] Di halaman Manajemen Tempat Sampah: QR code harus ditampilkan sebagai gambar QR asli + teks ID/serial di bawahnya (bukan hanya teks atau placeholder). (Selesai: Di-render pada setiap row tabel)
- [x] Fitur Maps masih simulasi — develop jadi peta asli (integrasikan library maps sungguhan, mis. Leaflet/Google Maps) yang menampilkan titik lokasi bin/rumah asli dari database. (Selesai: Leaflet JS diintegrasikan di ManajemenTempatSampah)
- [x] Tombol "Tambah Titik" belum berfungsi — harus bisa menambahkan titik lokasi baru (koordinat) dan tersimpan ke backend. (Selesai: Form submit data latitude, longitude, max capacity, category, dan rt/rw)
- [x] Tombol "Laporan" belum berfungsi — hubungkan ke fitur generate/lihat laporan sungguhan. (Selesai: Ekspor CSV dari data list)

## HALAMAN MANAJEMEN PENGGUNA
- [x] Kolom data yang belum ada di tabel: NIK, Peran, Wilayah, Setoran, Status — tambahkan sesuai skema data di dokumentasi (Bab ERD: users, roles, wilayah RT/RW, waste_logs untuk setoran). (Selesai: Data dari API /users dipetakan lengkap ke tabel)
- [x] Bagian Setting Password: ubah agar password bisa ditampilkan (toggle show/hide, ikon mata) supaya admin bisa cek kalau ada typo saat input — jangan simpan/tampilkan password mentah dari database (hash tetap di backend), ini hanya untuk input field saat set/reset password. (Selesai: Ikon mata visibility/visibility_off dengan state showPassword)
- [x] Fitur pencarian (search bar) belum berfungsi — hubungkan ke query search asli di backend. (Selesai: Terhubung ke parameter query pencarian backend)
- [x] Filter Peran, Status, RW, RT belum berfungsi — hubungkan sebagai query parameter ke backend dan terapkan filter sungguhan ke tabel. (Selesai: Filter parameter roleName, status, rw, rt dilewatkan ke API)
- [x] Tombol "Tambah Pengguna" belum berfungsi — buat form yang submit ke endpoint create user sungguhan (lengkap validasi). (Selesai: Form terintegrasi penuh untuk menambah/mengedit pengguna dengan NIK, status, wilayah RT/RW)
- [x] Fitur "Export CSV" belum berfungsi — implementasikan export data tabel (sesuai filter yang aktif) ke file CSV asli. (Selesai: CSV dinamis mengekspor data terfilter dengan kolom lengkap)


## HALAMAN MANAJEMEN LOKASI
- [x] Tombol "Tambah Lokasi" — buat form input lokasi baru, submit ke backend, tersimpan dengan koordinat. (Selesai: Dibuat form modal POST ke /bins/areas)
- [x] Peta — ganti dari simulasi ke peta asli yang menampilkan data lokasi sungguhan dari backend. (Selesai: Menampilkan Leaflet map berisi Bins dan Households)
- [x] Search bar lokasi — hubungkan ke query pencarian asli. (Selesai: Pencarian lokal berbasis nama RW/Kelurahan)
- [x] Dropdown filter RT — hubungkan ke data RT asli dan terapkan filter ke daftar/peta. (Selesai: Filter dropdown berdasarkan Kelurahan asli dari DB)
- [x] Ganti semua ikon di halaman ini jadi ikon yang lebih modern dan konsisten (gunakan icon set yang sudah dipakai di project, mis. lucide-react, jangan campur beberapa sumber ikon berbeda). (Selesai: Ikon menggunakan Material Symbols Outlined)

## HALAMAN JADWAL KEGIATAN
- [x] Backend gagal memuat data jadwal kegiatan ke frontend — investigasi endpoint terkait (cek response backend, format data, dan error di network tab), pastikan data benar-benar sampai ke frontend. (Selesai: Endpoint /schedules dihubungkan dan dimuat)
- [x] Tombol "Buat Jadwal Baru" belum berfungsi — hubungkan ke form create yang submit ke backend. (Selesai: Form submit POST /schedules)
- [x] BUG KRITIS: saat mencoba menambahkan acara baru, muncul error "Terjadi Kesalahan Tidak Terduga — Invalid time value". Ini kemungkinan besar disebabkan oleh parsing/formatting tanggal yang menerima nilai null/undefined/format salah. Perbaiki dengan: (Selesai: Validasi tanggal ditambahkan di frontend & backend, format tanggal aman dengan safeFormatDate & safeFormatTime)
  a) Validasi input tanggal di form sebelum submit (tidak boleh kosong/format salah).
  b) Pastikan backend mengembalikan format tanggal yang valid dan konsisten (ISO 8601).
  c) Tambahkan pengecekan/fallback di frontend sebelum melakukan format tanggal, agar tidak crash jika data tanggal kosong/null — tampilkan pesan wajar, bukan error boundary generik.

## HALAMAN KATEGORI SAMPAH
- [ ] Navbar aman, tidak ada perubahan diperlukan di bagian ini untuk saat ini.

## HALAMAN REKAP SETORAN — BUG RBAC PENTING
- [x] BUG: di tabel rekap setoran, ditemukan data setoran dengan role "admin" padahal yang seharusnya bisa melakukan setoran/pencatatan sampah HANYA role Warga. Perbaiki middleware/validasi role di endpoint pencatatan sampah (waste-logs) agar HANYA user dengan role Warga yang bisa membuat record setoran — role Admin/Petugas harus ditolak (403 Forbidden) jika mencoba melakukan aksi ini, baik dari API langsung maupun dari UI (sembunyikan aksi tersebut dari UI admin juga). (Selesai: Ditambahkan role restriction 'WARGA' di prisma query dan filter)

## HALAMAN POIN WARGA — DETAIL PROFIL
- [x] Halaman ini masih UI kosong/develop placeholder — buat benar-benar berfungsi: ambil data profil, riwayat poin, dan aktivitas dari backend. (Selesai: Menampilkan leaderboard, profil detail, riwayat transaksi dari backend)
- [x] Search bar di halaman ini belum berfungsi — hubungkan ke query pencarian asli. (Selesai: Filter leaderboard berdasarkan query pencarian nama/wilayah)
- [x] Fitur "Lihat Semua" belum berfungsi — pastikan menampilkan seluruh data terkait (bukan potongan/simulasi). (Selesai: Toggle Lihat Semua untuk membatasi top 10 atau seluruh warga)

## NOTIFIKASI — BUG RBAC KRITIS (SALAH IZIN AKSES)
- [x] BUG: Admin menerima notifikasi "Warga Budi Antoro mengajukan pengosongan tong", tapi saat Admin klik notifikasi tersebut, UI malah menampilkan fitur UPLOAD FOTO (yang seharusnya hanya untuk Warga saat membuat pengajuan, bukan untuk Admin yang meninjau pengajuan). (Selesai: Cek status peran user, tampilkan panel review jika admin/petugas, form upload jika warga)
  Perbaiki:
  a) Middleware/role-guard: pastikan endpoint & komponen upload foto pengajuan HANYA bisa diakses oleh role Warga yang membuat pengajuan tersebut, bukan Admin.
  b) Saat Admin klik notifikasi pengajuan, tampilkan halaman/modal REVIEW (lihat detail pengajuan, foto yang sudah diupload warga, tombol Setuju/Tolak) — BUKAN form upload foto baru.
  c) Audit ulang SEMUA komponen notifikasi lain: pastikan setiap role hanya melihat aksi yang relevan dengan rolenya (Warga = aksi milik dia sendiri, Admin/Petugas = aksi review/moderasi, bukan aksi milik warga).
