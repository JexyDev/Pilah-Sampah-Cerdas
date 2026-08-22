## PROMPT UNTUK ANTIGRAVITY — QC DETAIL, API REQUIREMENT & UI/UX ROLE PETUGAS (RESIDU)

**Catatan awal:** Berdasarkan hasil QC, role **Petugas** saat ini **belum diimplementasikan sama sekali** di aplikasi mobile ("belum ada role petugas" — poin 4.8, 4.13). Jadi berbeda dengan role Mahasiswa (yang sudah ada tapi banyak bug), untuk role **Petugas Residu** ini kamu perlu **membangun dari awal**, bukan sekadar memperbaiki. Sebelum mulai, pahami dulu sedetail mungkin apa saja fitur yang dibutuhkan role ini, jangan asal generate.

---

## TAHAP 0 — PEMAHAMAN KONTEKS & KONFIRMASI SCOPE (WAJIB DILAKUKAN LEBIH DULU)

Karena role ini benar-benar baru dan belum ada di kode, sebelum membangun apapun, lakukan hal berikut lalu tampilkan hasilnya ke saya untuk dikonfirmasi:

1. **Cek ulang seluruh kode role-check/permission yang sudah ada** (dari role Warga, Mahasiswa, dan modul Peta & Monitoring kategori 7 yang sudah/sedang dibangun) — pastikan kamu paham polanya, supaya role "Petugas" bisa ditambahkan dengan cara yang konsisten (bukan bikin sistem role baru yang terpisah).
2. **Konfirmasi definisi tugas role Petugas (Residu)** berdasarkan apa yang sudah saya jelaskan sebelumnya: tugas utamanya adalah **membuang/mengangkut sampah dari Tempat Sampah yang penuh** (fokus pada sampah residu/Tempat Sampah yang sudah penuh kapasitasnya), menggunakan modul Peta & Monitoring untuk mengetahui lokasi dan status Tempat Sampah, lalu melakukan aksi "Kosongkan Tempat Sampah" di lapangan.
3. **Rangkum fitur apa saja yang seharusnya dimiliki Petugas** berdasarkan QC + konteks tugas di atas:
   - Redirect ke Beranda khusus Petugas setelah login (poin 2.12).
   - Tab Beranda (poin 3.1) dan Profil (poin 3.5) — sama seperti role lain.
   - **TIDAK** memiliki tab Scan (poin 3.4 — Scan hanya untuk Warga & Mahasiswa).
   - Beranda dengan ringkasan tugas: jumlah Tempat Sampah Penuh di area tugasnya (poin 4.8), role badge "Petugas" (poin 4.2), alert notifikasi Tempat Sampah Penuh >90% (poin 4.13, terkait BUG-004 & poin 11.12).
   - Akses penuh ke modul **Peta & Monitoring** (kategori 7) — termasuk hak untuk menekan tombol "Kosongkan Tempat Sampah" (berbeda dengan Mahasiswa yang perlu dikonfirmasi apakah read-only atau tidak, sesuai prompt sebelumnya — Petugas **PASTI punya hak eksekusi**, ini yang membedakan).
   - Profil dengan role "Petugas" tampil dengan benar (poin 8.4).
4. **Tampilkan rangkuman scope fitur role Petugas ini ke saya** dalam bentuk daftar/tabel sebelum lanjut membangun, supaya saya bisa koreksi kalau ada yang belum sesuai (misalnya kalau ternyata ada pembagian "Petugas Residu" vs "Petugas" jenis lain yang belum saya sebutkan, tanyakan ke saya, jangan diasumsikan sendiri).

---

## TAHAP 1 — QC DETAIL PER FITUR ROLE PETUGAS (RESIDU) — YANG PERLU DIBANGUN

Buat dokumentasi QC dalam bentuk tabel untuk **SETIAP fitur yang perlu dibangun** untuk role Petugas:

| No | Fitur | Sub-Fitur/Elemen UI | Status Saat Ini | Perlu Dibangun/Diperbaiki | Endpoint API Terkait | Status Fetch API | Catatan |
|----|-------|---------------------|------------------|----------------------------|-----------------------|-------------------|---------|

Cakup seluruh area berikut:

**A. Login & Redirect**
- Redirect ke Beranda khusus Petugas setelah login berhasil (poin 2.12) — pastikan role terbaca dengan benar dari response login.

**B. Navigasi Utama**
- Tab yang tampil untuk Petugas: Beranda, Profil, dan akses ke Peta & Monitoring (baik lewat tab tersendiri atau lewat Beranda — sebutkan pendekatan yang dipakai dan alasannya). Tab Riwayat/Poin/Scan **TIDAK berlaku** untuk Petugas kecuali ada instruksi lain dari saya — cek dan konfirmasi dulu jika ternyata Petugas juga butuh riwayat aktivitas "Tempat Sampah yang sudah dikosongkan" sebagai bentuk riwayat tersendiri (beda dari riwayat scan Warga/Mahasiswa).

**C. Beranda/Dashboard Khusus Petugas**
- Role badge "Petugas" (poin 4.2).
- Ringkasan jumlah Tempat Sampah Penuh di area tugas (poin 4.8) — jelaskan bagaimana "area tugas" ditentukan (apakah berdasarkan wilayah/Kelurahan yang di-assign, radius dari lokasi Petugas, atau seluruh Tempat Sampah tanpa filter wilayah — cek/konfirmasi ke saya jika belum jelas di data).
- Alert/notifikasi saat ada Tempat Sampah dengan kapasitas >90% (poin 4.13, 11.12, terkait BUG-004) — pastikan notifikasi ini benar-benar ter-trigger dari backend (bukan cuma UI kosong).
- Notifikasi bisa di-tap untuk langsung ke Lokasi Tempat Sampah terkait di Peta (mirip pola poin 4.14 untuk role lain, disesuaikan konteks Petugas).

**D. Peta & Monitoring (Fitur Utama Petugas)**
- Full-screen map, posisi GPS Petugas (titik biru), Marker Tempat Sampah hijau (aman)/merah berkedip (penuh) (poin 7.1-7.4).
- Auto-refresh data peta setiap 30 detik (poin 7.5), zoom/pan (poin 7.6).
- Tap marker merah → Bottom Sheet dengan info Tempat Sampah ID, alamat, persentase kapasitas (poin 7.7-7.10).
- Tombol "Kosongkan Tempat Sampah" dengan dialog konfirmasi sebelum eksekusi (poin 7.11-7.12).
- Setelah konfirmasi: hit API reset kapasitas Tempat Sampah, marker berubah dari merah ke hijau secara real-time (poin 7.13).
- Error handling jika reset gagal (tidak boleh crash) (poin 7.14).

**E. Profil & Pengaturan**
- Foto profil, email, role "Petugas" tampil dengan benar (poin 8.4), data wilayah/area tugas jika relevan, menu Ganti Password (poin 8.6-8.9).

**F. Skenario Khusus**
- Mode offline saat di lapangan (koneksi internet Petugas bisa tidak stabil saat di jalan/area kerja — ini penting untuk dipikirkan lebih detail dibanding role lain).
- JWT expired saat sedang proses Kosongkan Tempat Sampah di lapangan — pastikan tidak kehilangan progress kerja secara tiba-tiba tanpa peringatan.

---

## TAHAP 2 — AUDIT & LIST REQUIREMENT API (KHUSUS ALUR PETUGAS)

Untuk setiap endpoint yang dibutuhkan fitur-fitur di atas, buatkan dokumentasi dengan format:

1. **Nama/Endpoint API** (method + path) — termasuk endpoint yang sudah disebut di prompt-prompt sebelumnya (`/monitoring/live`, endpoint Reset Tempat Sampah) dan endpoint baru yang mungkin dibutuhkan khusus Petugas (contoh: endpoint untuk assignment area tugas, endpoint riwayat Tempat Sampah yang sudah dikosongkan oleh Petugas tertentu, endpoint notifikasi Tempat Sampah Penuh).
2. **Dipakai di fitur mana** (rujuk ke Tahap 1).
3. **Status:**
   - ✅ Sudah ada & sudah tersambung.
   - 🟡 Sudah ada di backend, tapi belum disambungkan di mobile — **WAJIB disambungkan sekarang**.
   - 🟠 Endpoint ada tapi field belum lengkap — sebutkan field yang kurang.
   - 🔴 Belum ada sama sekali di backend — dokumentasikan sebagai requirement resmi, **JANGAN dibuat mock diam-diam**.
4. **Request payload** — field, tipe data, wajib/opsional.
5. **Response payload** — field, tipe data, contoh nilai.
6. **Auth/header & validasi role** — pastikan backend juga memvalidasi bahwa hanya role Petugas yang boleh mengakses endpoint reset/Kosongkan Tempat Sampah (validasi role harus di backend, bukan cuma disembunyikan di UI mobile — ini penting dari sisi keamanan).
7. **Error case yang harus dihandle** (401, 403 — termasuk kasus role lain mencoba akses endpoint khusus Petugas, 404 Tempat Sampah tidak ditemukan, 409 Tempat Sampah sudah dikosongkan petugas lain di waktu bersamaan, 500, timeout/offline).
8. **File mobile yang terlibat**.

Endpoint yang **wajib dipastikan tersambung asli (bukan mock)**:
- Endpoint live monitoring Tempat Sampah (posisi, kapasitas, status).
- Endpoint reset/Kosongkan Tempat Sampah.
- Endpoint notifikasi Tempat Sampah Penuh (push ke Petugas).
- Endpoint profil Petugas (termasuk role & area tugas jika ada).

Untuk endpoint berstatus 🔴, susun sebagai **List Requirement API resmi** siap dikirim ke tim backend.

---

## TAHAP 3 — EKSEKUSI PEMBANGUNAN & PERBAIKAN

Setelah Tahap 0-2 dikonfirmasi, baru bangun/perbaiki:
- Tambahkan role "Petugas" ke seluruh sistem role-check yang sudah ada (role guard, navigasi, permission) — pastikan konsisten dengan pola yang sudah dipakai untuk role Warga/Mahasiswa, jangan bikin sistem terpisah.
- Bangun/lengkapi Beranda khusus Petugas (ringkasan tugas, notifikasi).
- Pastikan modul Peta & Monitoring berfungsi penuh untuk Petugas, termasuk hak eksekusi "Kosongkan Tempat Sampah" (berbeda dari Mahasiswa yang read-only, sesuai keputusan yang sudah dikonfirmasi sebelumnya).
- Sambungkan seluruh fetch API sesuai Tahap 2, tanpa mock kecuali memang belum ada backend-nya (dan itu harus dilaporkan eksplisit).

Laporkan dengan format: **Fitur/Endpoint | Yang Dibangun/Diperbaiki | File yang Diubah/Ditambahkan | Status Akhir**.

---

## TAHAP 4 — PENYEMPURNAAN UI/UX AGAR MUDAH DIGUNAKAN PETUGAS LAPANGAN

Petugas menggunakan aplikasi ini **di lapangan saat bekerja** (bukan santai di rumah seperti Warga/Mahasiswa), jadi UI/UX-nya harus dioptimalkan untuk konteks kerja cepat, sering di luar ruangan, dan kadang koneksi tidak stabil:

1. **Kecepatan Akses Informasi Kritis**
   - Begitu buka aplikasi, Petugas harus langsung tahu: ada berapa Tempat Sampah Penuh yang perlu segera ditangani, tanpa perlu banyak tap/scroll.
   - Peta harus jadi elemen utama yang mudah diakses (idealnya 1 tap dari Beranda), bukan tersembunyi di menu dalam.

2. **Kejelasan Visual di Kondisi Lapangan**
   - Warna marker merah (penuh) vs hijau (aman) harus kontras tinggi dan mudah dilihat meski di bawah sinar matahari langsung/layar HP redup.
   - Ukuran tombol "Kosongkan Tempat Sampah" harus cukup besar dan mudah ditekan (Petugas mungkin memakai sarung tangan kerja atau kondisi terburu-buru).

3. **Alur Kosongkan Tempat Sampah yang Cepat & Minim Kesalahan**
   - Dialog konfirmasi sebelum Kosongkan Tempat Sampah harus singkat dan jelas (misalnya: "Kosongkan Tempat Sampah [ID] di [alamat]? Aksi ini tidak bisa dibatalkan.") — hindari teks panjang yang bikin Petugas malas baca dan asal klik.
   - Setelah berhasil Kosongkan Tempat Sampah, beri feedback jelas dan cepat (misalnya marker langsung berubah hijau + toast/snackbar konfirmasi singkat), supaya Petugas yakin aksinya berhasil tanpa harus refresh manual.

4. **Toleransi Koneksi Tidak Stabil**
   - Jika sinyal lemah saat menekan tombol Kosongkan Tempat Sampah, beri indikator loading yang jelas dan retry otomatis/opsi retry manual, jangan sampai Petugas menekan berkali-kali karena tidak ada feedback (berisiko double action).
   - Jika gagal karena offline, beri pesan yang jelas ("Gagal, cek koneksi internet Anda") — jangan silent fail.

5. **Minim Distraksi**
   - UI Petugas tidak perlu elemen dekoratif/gamifikasi berlebihan seperti di Beranda Warga/Mahasiswa (animasi count-up poin, dsb) — fokus ke fungsi kerja, tampilan lebih clean dan informatif.

6. **Notifikasi yang Actionable**
   - Notifikasi Tempat Sampah Penuh harus bisa langsung di-tap dan mengarahkan Petugas ke Lokasi Tempat Sampah tersebut di peta, bukan hanya notifikasi pasif tanpa tindak lanjut.

Setelah selesai, laporkan dengan format: **Halaman/Elemen | Masalah UX Sebelumnya (jika ada) | Perbaikan Dilakukan | Alasan (Kenapa Ini Lebih Sesuai untuk Petugas Lapangan)**.

---

## ATURAN KERJA

- Kerjakan Tahap 0 (pemahaman & konfirmasi scope) dan Tahap 1-2 (QC detail + API requirement) dulu, tampilkan hasilnya untuk saya review terlebih dahulu — terutama soal definisi "area tugas" Petugas dan apakah ada sub-kategori "Petugas Residu" vs jenis Petugas lain yang perlu dibedakan.
- Setelah saya konfirmasi, baru lanjut ke Tahap 3 (eksekusi) dan Tahap 4 (UI/UX).
- Semua perbaikan/pembangunan **tidak boleh pakai mock**, kecuali backend-nya memang belum tersedia — infokan eksplisit sebagai bagian dari List Requirement API.
- Jangan mengubah/merusak fitur role Warga maupun Mahasiswa yang sudah dikerjakan sebelumnya — pastikan penambahan role Petugas tetap kompatibel dengan sistem role-check yang sudah ada.
- **JANGAN melakukan `git push` ke GitHub (atau remote repository manapun) sebelum saya perintahkan secara eksplisit.** Commit lokal boleh, tapi push ke remote (termasuk branch baru) harus menunggu instruksi langsung dari saya. Jika ragu, tanya dulu ke saya sebelum push.
