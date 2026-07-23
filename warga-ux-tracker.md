# Warga UX Tracker — pilahsampah.id

## DASHBOARD WARGA — KARTU RINGKASAN JADI INTERAKTIF
- [x] Kartu "Poin Saya": klik untuk membuka halaman detail riwayat poin (bukan hanya angka statis) — tampilkan breakdown poin harian/mingguan dari data asli backend.
- [x] Kartu "Saldo Rupiah" (jika ada konversi poin ke saldo, konfirmasikan sumber datanya ke backend — jika belum ada endpoint-nya, buat dulu): klik untuk membuka halaman detail saldo/riwayat konversi.
- [x] Kartu "Total Setoran": klik untuk membuka halaman riwayat semua setoran (waste logs) milik warga tersebut.
- [x] Tambahkan efek hover/tap (elevation/shadow berubah, cursor pointer) di semua kartu ini supaya terasa jelas bisa diklik — konsisten dengan gaya kartu di dashboard Admin.
- [x] Tambahkan loading skeleton saat data kartu sedang diambil, dan empty state yang rapi jika data belum ada (misal warga baru belum pernah setor).

## HALAMAN PILAH & SETOR SAMPAH (AI SCAN QR) — REDESIGN + AKSES KAMERA ASLI
- [x] UI saat ini terlalu basic/polos — redesign dengan tampilan modern clean look, konsisten dengan tema warna project (hijau organik/biru non-organik), tombol dengan style jelas (primary/secondary), spacing rapi, dan micro-interaction (animasi transisi antar step: ambil foto -> hasil deteksi -> scan QR bin).
- [x] BUG PENTING: fitur ambil foto saat ini malah membuka file picker laptop/galeri, BUKAN mengakses kamera perangkat langsung — perbaiki agar benar-benar membuka kamera device (gunakan getUserMedia untuk web, atau image_picker dengan source kamera untuk Flutter).
- [x] Tambahkan permintaan izin akses kamera yang eksplisit: saat pertama kali fitur ini dibuka, browser/device harus menampilkan popup izin kamera; tangani 3 kondisi:
  a) User mengizinkan — lanjut tampilkan live preview kamera.
  b) User menolak — tampilkan pesan jelas + tombol "Coba Lagi" atau panduan cara mengaktifkan izin kamera dari pengaturan browser/device.
  c) Device tidak punya kamera / API tidak didukung — tampilkan fallback pesan yang jelas (baru di kondisi ini boleh sediakan opsi upload dari file sebagai cadangan, bukan jadi jalur utama).
- [x] Tampilkan live preview kamera dengan overlay bingkai (guide frame) untuk membantu user memposisikan sampah saat difoto, plus tombol capture yang jelas (ikon shutter kamera).
- [x] Setelah foto diambil: tampilkan preview hasil foto dengan opsi "Pakai Foto Ini" atau "Ambil Ulang" sebelum benar-benar dikirim ke backend/AI.
- [x] Pastikan seluruh alur (foto -> kirim ke backend -> deteksi AI -> tampilkan hasil -> arahkan scan QR bin -> validasi -> simpan) benar-benar fetch API asli sesuai dokumentasi sebelumnya (request_id, kompresi foto maks 1MB, timeout 2000ms, Detection Token, dst) — TIDAK ADA lagi simulasi/data dummy di alur ini.
- [x] Tampilkan status loading yang jelas dan menarik (bukan spinner polos) selama menunggu hasil deteksi AI, termasuk indikator sisa kuota Token Request jika relevan.

## FITUR TAMBAHAN YANG DIBUTUHKAN WARGA (TAMBAHKAN JIKA BELUM ADA)
- [x] Riwayat lengkap aktivitas setor sampah (list + filter tanggal/jenis sampah), fetch dari backend.
- [x] Status kapasitas tong milik warga tersebut (organik & non-organik) ditampilkan jelas dengan progress bar (liter terisi / kapasitas maksimum).
- [x] Notifikasi personal untuk warga (contoh: status pengajuan pengosongan tong, poin baru masuk) — fetch dari backend, bukan dummy.
- [x] Halaman profil warga menampilkan info rumah tangga (alamat, RT/RW) dan riwayat aktivitas terbaru dalam satu tampilan ringkas yang enak dilihat.
