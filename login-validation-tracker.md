# Login Validation Tracker — pilahsampah.id

## VALIDASI FORM BELUM LENGKAP
- [x] Saat tombol Login diklik dengan field Email dan/atau Password masih kosong: saat ini masih pakai alert/notif bawaan browser (`alert()` atau validasi HTML default yang tampilannya standar/jelek) — ganti dengan notifikasi custom modern (toast atau inline helper text di bawah tiap field, pilih salah satu yang konsisten dengan komponen lain di project).
- [x] Validasi kosong harus per-field, bukan satu pesan generik: jika Email kosong tampilkan pesan di bawah field Email ("Email wajib diisi"), jika Password kosong tampilkan pesan di bawah field Password ("Password wajib diisi"), jika keduanya kosong tampilkan keduanya sekaligus.
- [x] Saat Email/Password lengkap tapi salah (kredensial ditolak backend): tampilkan notifikasi modern (toast atau modal ringan) dengan pesan jelas dan ramah, contoh: "Email atau password salah. Coba lagi." — tanpa detail teknis dari backend.
- [x] Semua notifikasi (kosong dan salah) WAJIB pakai komponen visual yang sama (satu sistem toast/alert saja untuk seluruh app, jangan campur `alert()` bawaan dengan komponen custom di tempat lain).

## SPESIFIKASI DESAIN NOTIFIKASI
- [x] Style: card kecil dengan sudut membulat (rounded), latar putih/surface, border tipis, sedikit shadow halus — bukan warna mencolok penuh (flat, bukan gradient).
- [x] Ikon di kiri sesuai jenis pesan: ikon peringatan/error untuk kredensial salah atau field kosong (gunakan ikon dari icon set yang sudah dipakai di project, konsisten, jangan tambah library ikon baru).
- [x] Posisi: toast muncul di pojok atas (atau posisi yang konsisten dengan notifikasi lain di project jika sudah ada), dengan animasi masuk (slide/fade) dan otomatis hilang setelah beberapa detik, atau bisa ditutup manual dengan tombol close.
- [x] Untuk error kredensial salah, field Password dikosongkan lagi otomatis setelah gagal (Email tetap terisi) agar user tidak perlu ketik ulang email.
- [x] Test di light mode dan dark mode (jika project sudah punya dark mode) — pastikan warna teks dan background tetap kontras jelas di keduanya.
