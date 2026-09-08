## ARSITEKTUR PRESENSI KKN BERBASIS GPS MELALUI WEB/PWA

Solusi praktis untuk registrasi dan pemantauan kehadiran pada iPhone tanpa kompilasi aplikasi iOS dan tanpa distribusi melalui App Store.

Layak digunakan untuk registrasi, check-in, checkpoint, dan check-out berbasis GPS. Tidak direkomendasikan untuk pelacakan lokasi kontinu

ketika Safari ditutup atau layar terkunci.

## KEPUTUSAN UTAMA

## Ringkasan Solusi

Mahasiswa membuka web responsif atau PWA melalui Safari di iPhone. Browser mengambil koordinat setelah mahasiswa memberikan izin. Data GPS, akurasi, agenda, waktu klien, foto atau QR, dan informasi perangkat dikirim melalui HTTPS. Backend Express.js melakukan seluruh kalkulasi: jadwal, radius geofence, kualitas GPS, duplikasi, durasi, serta penetapan status hadir.

Prinsip desain: browser hanya mengumpulkan bukti; server menjadi sumber kebenaran dan pemutus status presensi.


## 1. Komponen Arsitektur

| Komponen | Teknologi / Bentuk | Tanggung Jawab |
| --- | --- | --- |
| Frontend web/PWA | Flutter Web, React, atau Vue | Registrasi, login, izin lokasi, kamera, QR, |
|   |   | check-in/check-out, dan status. |
| Backend aplikasi | Node.js + Express.js | API, autentikasi, geofence, aturan jadwal, durasi, |
|   |   | anomali, serta keputusan kehadiran. |
| Database | PostgreSQL disarankan | Mahasiswa, kelompok, wilayah, agenda, titik lokasi, |
|   |   | transaksi presensi, bukti, dan audit log. |
| Peta & geofence | OpenStreetMap/Leaflet, | Visualisasi titik, radius, lokasi mahasiswa, dan kalkulasi |
|   | Mapbox, atau Google Maps | jarak. |
| Penyimpanan bukti | Object storage privat | Selfie dan dokumen bukti; URL bertanda tangan dan |
|   |   | masa simpan terkontrol. |
| Dashboard | Web admin | Konfigurasi agenda, radius, durasi, monitoring DPL/MPL, |
|   |   | anomali, dan rekap. |

Semua endpoint presensi wajib menggunakan HTTPS, autentikasi berbasis token/sesi aman, pembatasan permintaan, dan pencatatan audit. Waktu server digunakan sebagai waktu resmi agar jam perangkat mahasiswa tidak menentukan hasil.


## 2. Alur Registrasi dan Kehadiran

## Tahapan operasional

- 1. Mahasiswa melakukan registrasi atau login dengan identitas resmi, kemudian akun dikaitkan dengan kelompok, DPL, RW, dan lokasi kegiatan.

- 2. Mahasiswa memilih agenda aktif. Web meminta izin lokasi dan menampilkan status GPS serta estimasi akurasinya.

- 3. Ketika tombol Check-in ditekan, frontend mengambil koordinat terbaru dan mengirim bukti ke server.

- 4. Server memvalidasi hari, jam, agenda, radius, akurasi, status akun, duplikasi, serta pola anomali.

- 5. Jika valid, transaksi check-in dicatat. Selama kegiatan, sistem dapat meminta checkpoint berkala.

- 6. Saat kegiatan selesai, mahasiswa melakukan check-out. Server menghitung irisan waktu valid dengan jadwal dan menetapkan status akhir.

## Data minimum setiap transaksi

| Kelompok data | Elemen yang direkam |
| --- | --- |
| Identitas | studentId, groupId, agendaId, role, sessionId |
| Lokasi | latitude, longitude, accuracy, capturedAt |
| Waktu | clientCapturedAt dan serverReceivedAt; keputusan memakai waktu server |
| Perangkat | device binding pseudonim, browser, OS, IP hash, user-agent |
| Bukti | selfie langsung dan/atau token QR dinamis |
| Keputusan | distance, rule result, status, reason code, reviewer, audit trail |


## 3. Aturan Validasi di Server

Aturan berikut merupakan konfigurasi awal dan tetap dapat diubah oleh admin per agenda atau per lokasi. Nilai radius serta toleransi akurasi harus diuji terlebih dahulu di lapangan.

| Parameter | Nilai awal | Logika server |
| --- | --- | --- |
| Hari aktif | Senin-Sabtu | Tolak transaksi di luar kalender agenda. |
| Jam kegiatan | 08.00-17.00 WIB | Hitung hanya waktu yang beririsan dengan jendela |
|   |   | kegiatan. |
| Radius geofence | 100 m; dapat diatur | Valid bila jarak terhadap pusat lokasi <= radius efektif. |
| Akurasi GPS | <= 50 m | Jika lebih buruk, minta pembacaan ulang; jangan |
|   |   | langsung menerima. |
| Durasi minimum | 4 jam/hari | Hadir jika bukti masuk-keluar valid dan durasi memenuhi |
|   |   | batas. |
| Checkpoint | 60-90 menit | Pengingat berkala; toleransi ditetapkan admin. |
| Waktu resmi | Waktu server | Jam perangkat hanya menjadi metadata pendukung. |
| Data anomali | Perlu verifikasi | Tidak langsung hadir/tidak hadir; masuk antrean |
|   |   | pemeriksaan DPL. |

## Perhitungan geofence

Jarak antara posisi mahasiswa dan titik kegiatan dihitung pada server menggunakan rumus Haversine. Untuk dua koordinat lintang-bujur, server memperoleh jarak permukaan bumi dalam meter, kemudian membandingkannya dengan radius efektif lokasi.

Keputusan praktis: radius 100 m dapat menjadi nilai awal. Area terbuka dapat memakai radius lebih kecil; area dengan gedung padat mungkin membutuhkan 100-150 m. Akurasi lokasi harus ikut dipertimbangkan agar sistem tidak menghukum pengguna ketika sinyal GPS sedang lemah.


## 4. Kemampuan dan Batasan pada iPhone

| Fitur | Web/PWA iPhone | Catatan |
| --- | --- | --- |
| Registrasi dan login | Bisa | Gunakan Safari/Chrome dan HTTPS. |
| Check-in GPS saat halaman aktif | Bisa | Pengguna harus mengizinkan akses lokasi. |
| Check-out dan checkpoint | Bisa | Halaman perlu dibuka saat bukti dikirim. |
| Kamera/selfie dan QR | Bisa | Dapat memakai kamera browser; tetap sediakan |
|   |   | fallback terkontrol. |
| Add to Home Screen | Bisa | Memberi pengalaman menyerupai aplikasi. |
| Push notification PWA | Terbatas/bergantung | Sediakan pengingat alternatif di dashboard atau |
|   | versi | kanal resmi. |
| Tracking saat Safari ditutup | Tidak andal | Proses dapat dihentikan oleh iOS. |
| Tracking saat layar terkunci | Tidak andal | Tidak boleh dijadikan syarat presensi. |
| Native background geofencing | Perlu aplikasi iOS | Dipertimbangkan hanya jika live tracking |
|   |   | benar-benar wajib. |

## Implikasi desain

Jangan mengharuskan mahasiswa menyalakan GPS secara kontinu selama empat jam. Gunakan transaksi berbasis aksi: check-in, checkpoint, dan check-out. Pendekatan ini lebih stabil, hemat baterai, lebih transparan, dan lebih sesuai dengan batasan browser iOS.


## 5. Keamanan, Privasi, dan Pencegahan Kecurangan

GPS browser bukan bukti tunggal yang sempurna. Keandalan ditingkatkan melalui kombinasi kontrol

teknis dan verifikasi administratif.

## Kontrol identitas

- Akun mahasiswa terverifikasi dan terikat pada kelompok KKN.

- Satu sesi aktif dan pembatasan perangkat secara wajar.

- Selfie langsung atau QR dinamis untuk agenda tertentu.

## Kontrol lokasi dan waktu

- Gunakan waktu server, koordinat terbaru, akurasi GPS, radius, dan masa berlaku data.

- Tolak koordinat yang terlalu lama atau akurasinya tidak memenuhi batas.

- Deteksi kecepatan/perpindahan tidak wajar dan transaksi duplikat.

## Kontrol sistem

- HTTPS, token aman, rate limiting, validasi input, audit log tidak mudah diubah.

- Simpan bukti foto secara privat; akses berbasis peran dan URL sementara.

- Pisahkan status valid, ditolak, dan perlu verifikasi.

## Privasi dan tata kelola

- Ambil lokasi hanya ketika diperlukan untuk presensi, bukan untuk pengawasan terus-menerus.

- Tampilkan persetujuan, tujuan penggunaan, periode retensi, dan kanal koreksi data.

- Batasi akses: mahasiswa melihat data sendiri; DPL/MPL hanya lingkup penugasannya.

## Status keputusan yang disarankan

| VALID | DITOLAK | PERLU VERIFIKASI |
| --- | --- | --- |
| Semua aturan inti terpenuhi; | Aturan pasti tidak terpenuhi, | Ada anomali, GPS lemah, konflik |
| transaksi dihitung. | misalnya agenda tidak aktif. | data, atau bukti perlu diperiksa DPL. |


## 6. Rekomendasi Implementasi

- 1. Gunakan PWA responsif. Satu basis aplikasi dapat melayani iPhone, Android, tablet, dan desktop tanpa proses App Store.

- 2. Pusatkan kalkulasi di Express.js. Frontend mengirim bukti mentah; server menghitung jarak, jadwal, durasi, checkpoint, dan status akhir.

- 3. Terapkan model checkpoint. Check-in, satu atau beberapa checkpoint, lalu check-out; hindari live tracking terus-menerus.

- 4. Gunakan PostgreSQL. Struktur relasional dan kemampuan spasial melalui PostGIS cocok untuk agenda, wilayah, transaksi, dan analisis geofence.

- 5. Pilih peta sesuai biaya. OpenStreetMap/Leaflet cocok untuk efisiensi; Mapbox atau Google Maps dapat digunakan bila diperlukan dukungan komersial.

- 6. Uji lapangan sebelum produksi. Uji iPhone dan Android pada area terbuka, gedung padat, sinyal lemah, pergantian jaringan, izin lokasi ditolak, dan kamera gagal.

- 7. Sediakan jalur koreksi. Mahasiswa dapat mengajukan bukti ketika kondisi teknis gagal; keputusan manual tercatat dalam audit log.

- 8. Bangun bertahap. Mulai dari registrasi, agenda, check-in/out, geofence, dan rekap; kemudian tambahkan checkpoint, selfie/QR, anomali, serta analitik.

## Tahapan pengembangan yang disarankan

| Tahap | Ruang lingkup | Luaran |
| --- | --- | --- |
| 1. Fondasi | Akun, role, mahasiswa, kelompok, RW, agenda, lokasi. | Master data dan autentikasi. |
| 2. Presensi inti | GPS, check-in/out, Haversine, jadwal, durasi. | Status hadir berbasis aturan |
|   |   | server. |
| 3. Bukti & kontrol | Selfie/QR, perangkat, checkpoint, anomali. | Validasi berlapis dan audit log. |
| 4. Dashboard | Monitoring, peta, rekap, ekspor, koreksi. | Operasional DPL/MPL dan |
|   |   | pimpinan. |
| 5. Pilot & hardening | Uji lapangan, keamanan, performa, SOP. | Sistem siap produksi. |


## 7. Kesimpulan

## Rekomendasi akhir

Kebutuhan registrasi dan presensi KKN berbasis GPS dapat dikerjakan melalui web responsif/PWA. Pendekatan ini mengatasi kebutuhan pengguna iPhone tanpa Mac, kompilasi iOS, akun Apple Developer, atau publikasi App Store.

Model yang paling realistis adalah check-in + checkpoint + check-out, dengan seluruh kalkulasi dilaksanakan pada backend Express.js. GPS, selfie, QR, waktu server, geofence, dan audit log digunakan sebagai bukti berlapis. Sistem tidak mengandalkan pelacakan kontinu di latar belakang karena Safari/iOS dapat menghentikannya.

Apabila kelak kebutuhan berubah menjadi live tracking atau geofence otomatis saat aplikasi tertutup, aplikasi Flutter iOS dapat ditambahkan tanpa mengganti backend, database, API, maupun aturan presensi yang telah dibangun.

## Parameter keputusan desain

| Kebutuhan | Pilihan yang disarankan |
| --- | --- |
| Presensi pada iPhone | Web/PWA |
| Validasi kehadiran | Server-side pada Express.js |
| Lokasi | GPS saat transaksi + geofence |
| Durasi | Check-in, checkpoint, check-out |
| Bukti tambahan | Selfie dan/atau QR dinamis |
| Kasus anomali | Antrean verifikasi DPL |
| Live tracking tertutup | Aplikasi native hanya bila benar-benar diperlukan |
