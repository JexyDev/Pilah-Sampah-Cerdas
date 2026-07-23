# Polish Tracker — pilahsampah.id

## HALAMAN LOGIN
- [x] Saat email/password salah, tampilkan pesan error dalam bentuk popup/modal atau toast modern (bukan alert bawaan browser, bukan teks error polos di bawah form) — desain clean, konsisten dengan tema warna project (hijau organik/biru non-organik), dengan ikon dan animasi masuk/keluar yang halus. (Selesai: Menambahkan modal error custom dan interaktif dengan warning icon)
- [x] Pesan error harus jelas dan manusiawi (contoh: "Email atau password salah, silakan coba lagi" — jangan tampilkan detail teknis/stack trace ke user). (Selesai: Diubah menjadi pesan humanis "Akses Ditolak: Email atau kata sandi salah...")
- [x] Tambahkan debounce/cooldown pada tombol Login: setelah diklik, tombol langsung disabled dan tampilkan loading indicator (spinner) selama 1-2 detik minimum sebelum bisa diklik lagi — ini untuk mencegah spam-click maupun spam request ke backend. (Selesai: Tombol disabled dengan spinner loading minimal 1.5 detik)
  a) Implementasikan di sisi Frontend (disable tombol selama proses + minimum delay sebelum re-enable). (Selesai)
  b) Tambahkan JUGA rate limiting di sisi Backend untuk endpoint /api/auth/login (contoh: maksimal beberapa percobaan per menit per IP/email) sebagai lapisan keamanan tambahan, bukan hanya mengandalkan disable tombol di frontend. (Selesai: Membuat loginRateLimiter middleware dengan limit 5 attempts per menit per IP+email)
- [x] Saat login berhasil, tampilkan transisi/loading state yang halus sebelum redirect ke dashboard sesuai role (jangan langsung lompat halaman tanpa feedback visual). (Selesai: Overlay full-screen berwarna hijau sukses dengan progress spinner selama 1.5 detik)

## PENGATURAN PROFIL (SEMUA ROLE: WARGA, PETUGAS RT/RW, ADMIN)
- [x] Pastikan halaman "Pengaturan Informasi"/Profil benar-benar berfungsi di SETIAP role (bukan hanya salah satu role) — ambil data asli dari backend sesuai user yang sedang login, dan submit perubahan (nama, no HP, alamat, dsb sesuai field yang relevan per role) benar-benar tersimpan ke backend. (Selesai: Form terintegrasi untuk nama, email, no HP, dan alamat tinggal untuk semua role)
- [x] Tambahkan fitur upload foto profil: (Selesai: Multer upload avatar di `/auth/upload-avatar` terintegrasi)
  a) Frontend: tombol/area upload foto (klik atau drag-drop), preview sebelum simpan, validasi ukuran & format file (contoh: maks 2MB, format jpg/png/webp). (Selesai: Drag-and-drop & file selection fungsional dengan client-side validation)
  b) Backend: endpoint upload foto profil, simpan file (ke storage/folder yang sudah dipakai project untuk foto sampah, atau buat folder terpisah untuk foto profil), simpan path/URL-nya ke kolom foto_profil pada tabel users. (Selesai: Path disimpan di database)
  c) Tampilkan foto profil yang sudah diupload di header/navbar dan halaman profil setelah berhasil disimpan (bukan hanya di preview lokal, harus persist setelah reload halaman). (Selesai: Navbar & Sidebar langsung ter-update secara real-time via useAuthStore.updateUser)
  d) Jika user belum punya foto profil, tampilkan avatar default/inisial nama yang rapi (bukan kotak kosong). (Selesai: Circle inisial nama default berdasarkan role tetap didukung jika foto profil kosong)
- [x] Pastikan validasi & error handling saat update profil/upload foto gagal (tampilkan pesan error yang jelas, bukan blank/crash), konsisten dengan pola loading/error/empty state yang sudah dipakai di halaman lain. (Selesai: Pesan error/toast modern ditampilkan jika terjadi kegagalan)
