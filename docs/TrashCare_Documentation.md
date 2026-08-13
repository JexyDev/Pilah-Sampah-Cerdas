TrashCare
Dokumentasi Sistem — Role Mapping, Fitur, Entitas & Alur End-to-End
Versi Dokumen 2.0 — Agustus 2026 — Status: Dokumentasi Teknis Resmi
Ringkasan Eksekutif
TrashCare adalah platform pengelolaan sampah berbasis gamifikasi dengan tiga ekosistem peran yang saling terhubung: Warga (aktor utama penghasil poin melalui pemilahan sampah), Mahasiswa KKN (agen lapangan yang mengaktivasi & mendampingi warga binaan), dan Petugas Pemilahan (operator hilir yang menangani residu fisik dari bin warga yang penuh).
Ketiga role membentuk siklus tertutup: Mahasiswa onboarding (aktivasi bin) warga → Warga membuang & mendapat poin → Bin penuh → Petugas Pemilahan mengangkut & mencatat berat → Data terakumulasi di sistem, dan mahasiswa memonitor kepatuhan warga secara berkelanjutan.
1. Gambaran Besar Ekosistem
MAHASISWA KKN --(aktivasi bin warga yang sudah punya akun)-->  WARGA
WARGA --(foto sampah -> AI deteksi -> scan QR bin)-->  BIN --(volume bertambah, +poin warga)
BIN (penuh) --(warga ajukan reset)-->  notifikasi sistem
PETUGAS RESIDU --(jadwal harian -> angkut & timbang -> submit log)-->  BIN (direset)
MAHASISWA KKN --(monitoring mingguan, edukasi jika compliance <80%)-->  WARGA
Empat aturan kritis yang mengikat seluruh ekosistem:
Bin harus aktif (Organik + Non-Organik) sebelum warga bisa scan — diaktivasi mandiri atau oleh Mahasiswa KKN.
Poin hanya keluar jika 3 syarat terpenuhi sekaligus: jenis sampah cocok, GPS ≤ 10 meter dari bin, dan bin belum penuh (proyeksi volume tidak overflow).
Mahasiswa KKN tidak bisa mendaftarkan akun warga baru — warga mendaftar mandiri; tugas mahasiswa adalah mengaktivasi bin warga yang sudah terdaftar.
Petugas Pemilahan wajib melalui verifikasi whitelist admin (status APPROVED) sebelum bisa submit log timbangan; submit hanya aktif pada window 06:00–08:00 dan 16:00–18:00.
2. Role Mapping
2.1 Warga
Pemilik rumah dengan bin fisik. Aktor utama penghasil poin melalui pemilahan sampah. Satu akun mewakili satu rumah tangga (Household) yang terikat secara spesifik pada RW domisilinya dan memuat informasi jumlah anggota keluarga (familySize).
Hak Akses & Batasan
Bisa Diakses
Tidak Bisa Diakses
Daftar & aktivasi bin mandiri • scan sampah (AI + QR bin) • ajukan reset bin • riwayat & saldo poin • leaderboard • kelola profil (beserta info Nama Mahasiswa Pendamping) • melihat statistik & rata-rata akurasi AI
Data warga lain • dashboard Mahasiswa/Petugas • mengubah poin sendiri secara manual
2.2 Mahasiswa KKN
Agen aktivasi lapangan dan supervisi. Bertugas di wilayah penugasan (kelurahan/RW spesifik) untuk mengaktivasi bin milik warga yang SUDAH memiliki akun, memonitor kepatuhan pemilahan warga binaan, melaporkan pemanfaatan sampah, dan mencatat kehadiran berbasis GPS.
Catatan penting: 
Mahasiswa tidak bisa mendaftarkan/membuat akun warga baru. Warga mendaftar mandiri — tugas mahasiswa adalah mengaktivasi bin milik warga yang sudah terdaftar, sehingga warga bisa mulai scan sampah.
Tujuan Utama
Tujuan
Penjelasan
Aktivasi Ekosistem
Mengaktivasi bin (organik + anorganik) milik warga yang sudah terdaftar di wilayah penugasan
Akumulasi Poin KKN
Poin kontribusi dari tiap warga yang berhasil diaktivasi & aktif memilah
Monitoring Kepatuhan
Melihat tingkat kesalahan pemilahan warga binaan (threshold <80% = perlu re-edukasi)
Absensi Kegiatan
Mencatat kehadiran berbasis GPS geofencing saat kegiatan KKN
Pelaporan Pemanfaatan
Submit laporan kegiatan pemanfaatan sampah (kompos, kerajinan) dengan bukti foto
Pengajuan Izin
Mengajukan izin tidak hadir ke DPL dengan bukti dokumen
Hak Akses & Batasan
Bisa Diakses
Tidak Bisa Diakses
Dashboard KKN • cari & aktivasi bin warga (scan QR + GPS) • monitoring warga binaan (read-only) • presensi GPS • laporan pemanfaatan sampah • pengajuan izin • info kelompok & DPL • riwayat kegiatan
Scan sampah untuk poin sendiri • mendaftarkan akun warga baru • data warga di luar wilayah penugasan • mengubah data pemilahan warga • fitur timbangan residu • mengubah wilayah penugasan sendiri
2.3 Petugas Pemilahan
Operator hilir pengelolaan sampah fisik. Mengangkut dan mencatat timbangan residu dari bin warga yang penuh ke TPS3R/RW setempat, dalam window waktu penanganan terjadwal (06:00–08:00 dan 16:00–18:00).
Catatan penting: 
Akun Petugas Pemilahan wajib melalui proses whitelist/verifikasi admin sebelum bisa menggunakan fitur operasional. Akun berstatus PENDING atau REJECTED tidak dapat mengakses fitur inti.
Tujuan Utama
Tujuan
Penjelasan
Manajemen Jadwal
Melihat daftar bin warga yang perlu ditangani hari ini
Submit Log Timbangan
Mencatat berat fisik residu yang diangkut (kg) + foto bukti
Akumulasi Poin Petugas
Poin dari setiap log timbangan yang berhasil disubmit
KPI Monitoring
Skor kinerja: ketepatan waktu (60%) + akurasi (40%)
Riwayat Aktivitas
Riwayat pengangkutan dengan filter tanggal & tipe
Hak Akses & Batasan
Bisa Diakses
Tidak Bisa Diakses
Dashboard (KPI, statistik, jadwal) • jadwal harian per zona • submit timbangan (foto+berat+klasifikasi+GPS) • riwayat log • poin & statistik pribadi • notifikasi khusus petugas
Fitur scan AI/warga • data detail warga • submit log jika belum whitelist APPROVED • submit di luar window waktu • mengubah jadwal • fitur KKN mahasiswa
3. Alur Kerja (User Journey) per Role
3.1 Mahasiswa KKN
STEP 1 - Login & Orientasi
  Login NIM+password -> validasi role -> Dashboard KKN
STEP 2 - Aktivasi Bin Warga
  Cari warga terdaftar di wilayah tugas -> scan QR bin ORGANIK (GPS aktif)
  -> validasi (warga valid? bin belum aktif? mahasiswa di zona benar?)
  -> scan QR bin ANORGANIK -> backend ikat kedua bin ke household warga
  -> notifikasi ke warga -> poin kontribusi mahasiswa bertambah
STEP 3 - Monitoring Warga Binaan
  Tab Monitoring -> lihat % pemilahan benar per warga
  -> flag correctPercentage < 80% ("Perlu Re-edukasi") -> edukasi lapangan
STEP 4 - Presensi Kegiatan
  Pilih kegiatan -> tracking GPS real-time -> dalam radius zona ->
  countdown durasi minimum -> tombol Absen aktif -> check-in tercatat
STEP 5 - Laporan Pemanfaatan Sampah
  Pilih jenis (Kompos/Kerajinan/Biogas) -> isi form + foto -> submit
STEP 6 - Pengajuan Izin
  Pilih kategori -> upload bukti -> submit -> notifikasi ke DPL untuk approval
3.2 Petugas Pemilahan
STEP 1 - Login & Verifikasi Status
  Login -> cek whitelistStatus: PENDING (banner proses verifikasi) /
  REJECTED (banner ditolak) / APPROVED (akses penuh)
STEP 2 - Review Jadwal Harian
  Dashboard: KPI score, total kg hari ini, sisa jadwal
  -> daftar bin perlu ditangani, volume >=70% ditandai HIGH VOLUME
STEP 3 - Proses Pencatatan di Titik Kumpul
  Tiba lokasi -> buka Timbangan Residu -> foto bukti -> timbang fisik
  -> input berat(kg) + klasifikasi (Non-B3/B3) -> aktifkan GPS -> Submit Log
STEP 4 - Validasi & Konfirmasi Sistem
  Backend terima binId+berat+klasifikasi+foto+GPS -> update volume bin RW
  -> notifikasi lokal -> poin petugas bertambah
STEP 5 - Monitoring Riwayat
  Tab Riwayat -> filter Hari Ini/Minggu/Bulan, tipe sampah -> total kg & breakdown
STEP 6 - Notifikasi & Poin
  Poin otomatis bertambah -> notifikasi in-app -> halaman Poin
4. Daftar Fitur per Modul
4.1 Modul Scan & Poin (Warga)
Fitur
Deskripsi
Endpoint / Catatan
Deteksi Sampah AI
Foto sampah -> AI identifikasi jenis, volume, berat, confidence score
/waste/detect
Scan QR Bin
Scan QR bin sesuai jenis sampah; validasi kecocokan + geofencing
/bins/scan
Geofencing Validasi
Haversine distance check, user harus ≤10m dari bin (prod) / ≤500m (debug)
Bagian dari /bins/scan
Validasi Kapasitas Bin
Cek volume proyeksi (current+estimate) vs maxCapacity sebelum commit
Bagian dari /bins/scan
Aktivasi Bin Warga
Scan QR untuk aktivasi & ukur kapasitas bin sebelum dipakai pertama kali
/bins/activate, /bins/measure
Reset Bin (Pengajuan Pengosongan)
Ajukan pengosongan bin penuh dengan foto bukti
/bins/reset
4.2 Modul Reward & Poin
Fitur
Deskripsi
Role
Welcome Bonus Registrasi
Semua user baru (Warga/Mahasiswa/Petugas) otomatis mendapat saldo awal 20 Poin saat pertama kali login.
Semua Role
Akumulasi Poin Warga
Poin otomatis bertambah tiap scan berhasil. Formula: (Berat * 100) * (0.9 * Confidence AI).
Warga
Poin Kontribusi Mahasiswa
Poin dari aktivasi warga (1 Warga = +5 Poin. Jika capai kelipatan 3 Warga = +20 Poin total) + presensi harian posko (+1 Poin).
Mahasiswa KKN
Poin Petugas Pemilahan
Poin bertambah dari skala KPI: 1 Poin per 1 Kg residu + 2 Poin bonus kehadiran di titik kumpul.
Petugas Pemilahan
Leaderboard Warga
Ranking warga berdasarkan total poin dalam lingkup RW/kelurahan
Warga
Poin KKN Kelompok
Total poin kelompok = agregasi poin seluruh anggota kelompok
Mahasiswa KKN
4.3 Modul Verifikasi & Timbangan Residu (Petugas Pemilahan)
Fitur
Deskripsi
Endpoint / Catatan
Dashboard Petugas
Ringkasan harian: KPI score, total kg hari ini, sisa jadwal harian
/petugas-residu/dashboard
Jadwal Harian Titik Kumpul
Daftar bin perlu dijemput, prioritas volume ≥70% = high priority
/petugas-residu/jadwal-harian
Submit Log Timbangan
Foto -> input berat -> submit; backend update bin global RW
/petugas-residu/submit-log
KPI Score
Formula: (0.6 × ketepatan waktu%) + (0.4 × akurasi%)
Dashboard API
Whitelist Guard
Barrier yang menghalangi akun PENDING/REJECTED mengakses fitur inti
Dashboard API
Riwayat Log
Histori log timbangan dengan filter tanggal & tipe
/petugas-residu/riwayat
4.4 Modul Edukasi & Monitoring KKN (Mahasiswa)
Fitur
Deskripsi
Endpoint / Catatan
Dashboard KKN
Progress aktivasi bin, poin kontribusi, sisa kuota
/kkn/dashboard
Daftar Warga Dampingan
Filter OTOMATIS mengambil data warga hanya berdasarkan Kelurahan & RW dari profil Mahasiswa yang sedang login. Menampilkan stats pemilahan.
/kkn/warga-dampingan
Monitoring Detail Warga
% pemilahan benar, log terbaru, flag <80% perlu re-edukasi
Per wargaId
Aktivasi Bin via QR Scan
Scan QR bin organik & anorganik warga (sudah punya akun) untuk aktivasi
/kkn/warga/activate-bin
Presensi GPS Geofencing
Tracking posisi real-time, absen dalam radius zona kegiatan
/kkn/attendance/check-in
Laporan Pemanfaatan Sampah
Submit laporan daur ulang/kompos dengan foto
/kkn/pemanfaatan-sampah
Pengajuan Izin
Ajukan izin tidak hadir dengan kategori & foto bukti ke DPL
/kkn/pengajuan-izin
Kelompok KKN
Info kelompok: nama, DPL, lokasi posko, total poin, anggota
/kkn/kelompok/me
4.5 Modul Akun & Profil (Lintas Role)
Fitur
Deskripsi
Role
Login & Bypass Onboarding
Layar Onboarding di-bypass. Auth via phone+password (warga/petugas) atau NIM (mahasiswa). Frontend memaksa format `+628...`. Backend harus toleran mencocokkan `08...` atau `nim`.
Semua
Register Warga / Mahasiswa / Petugas
Pendaftaran akun sesuai role. Khusus Warga: filter hierarki wilayah (Kecamatan->Kelurahan->RW) dan input Jumlah Anggota Keluarga (familySize)
Sesuai role
Upload Avatar
Ganti foto profil via kamera/galeri
Semua
Ganti / Lupa Password
Ubah password atau reset via email (token -> validasi -> reset)
Semua
Login Warga via OTP
Alternatif login: request OTP via HP -> verifikasi
Warga
FCM Token Registration & Logout
Registrasi push notification token; hapus sesi saat logout
Semua
4.6 Modul Riwayat & Statistik
Fitur
Deskripsi
Role
Riwayat Pemilahan Warga
Histori transaksi scan + poin: jenis, berat, tanggal
Warga
Riwayat Log Petugas
Histori pengangkutan dengan filter tanggal & tipe residu
Petugas Pemilahan
Riwayat Kegiatan KKN
Log aktivitas mahasiswa: presensi, aktivasi, pemanfaatan
Mahasiswa KKN
Statistik Performa & Poin Warga
Total poin, ranking leaderboard, persentase pemilahan benar/salah, rata-rata Akurasi AI (transparan dengan Mahasiswa)
Warga
Statistik Petugas
KPI score, total kg bulanan/harian, ketepatan & akurasi
Petugas Pemilahan
4.7 Modul Notifikasi (Per-Role Terpisah)
Filter notifikasi diimplementasikan client-side melalui keyword matching pada field type, title, dan desc. Setiap role memiliki provider notifikasi sendiri yang terpisah.
Role
Tipe Notifikasi
Warga
REMINDER (07:00 & 16:00), BIN_FULL, SETORAN
Mahasiswa KKN
PRESENSI, IZIN, POIN, KKN, AKTIVASI
Petugas Pemilahan
TIMBANGAN_RESIDU, POIN_PETUGAS, WHITELIST

Daftar Endpoint API Notifikasi
Fitur
Deskripsi
Endpoint / HTTP Method
Ambil Semua Notifikasi
Mendapatkan daftar notifikasi pengguna
GET /api/v1/notifications
Tandai Dibaca (Satu)
Menandai spesifik notifikasi menjadi read (isRead=true)
PUT /api/v1/notifications/{id}/read
Tandai Dibaca (Semua)
Menandai seluruh notifikasi user menjadi read
PUT /api/v1/notifications/read-all
Register Token FCM
Mendaftarkan FCM Device Token untuk push notification
POST /api/v1/notifications/device-token
Unregister Token FCM
Menghapus token saat user logout
POST /api/v1/notifications/unregister-token
5. Relasi Antar Entitas
5.1 Entitas Utama
Entitas
Deskripsi
Kunci Utama
User
Akun pengguna semua role
userId
Household
Rumah tangga warga
householdId
Bin
Tempat sampah fisik ber-QR
binId / qrSerial
WasteLog
Catatan tiap transaksi pemilahan sampah
transactionId
PointHistory
Riwayat perolehan poin per user
pointId
KelompokKKN
Kelompok mahasiswa KKN
groupId
WargaDampingan
Relasi mahasiswa ↔ warga binaan
(mahasiswaId, wargaId)
JadwalKegiatan / Presensi
Jadwal kegiatan & catatan kehadiran KKN
scheduleId
PemanfaatanSampah / PengajuanIzin
Laporan daur ulang / permohonan izin ke DPL
laporanId / izinId
ResiduBinPickup / ResiduSubmitLog
Jadwal penanganan & log timbangan petugas
pickupId / logId
NotifikasiEntity
Pesan notifikasi per user per role
notifId
DPL
Dosen Pembimbing Lapangan
dplId / nip
5.2 Tabel Relasi
Relasi
Kardinalitas
Alasan
User → Household (Warga)
1 : 1
Satu warga satu rumah tangga
Household → Bin
1 : N
Satu rumah tangga = 2 bin (organik + anorganik)
User (Warga) → WasteLog
1 : N
Satu warga bisa punya banyak transaksi pemilahan
WasteLog → PointHistory
1 : 1
Setiap transaksi menghasilkan tepat 1 record poin
KelompokKKN → User (Mahasiswa)
1 : N
Satu kelompok terdiri dari banyak mahasiswa
DPL → KelompokKKN
1 : N
Satu DPL bisa membimbing beberapa kelompok
User (Mahasiswa) ↔ User (Warga)
N : M
Satu mahasiswa dampingi banyak warga; satu warga punya satu pendamping
User (Mahasiswa) → Bin
1 : N
Mahasiswa mengaktivasi bin di banyak warga binaan
Bin → ResiduBinPickup
1 : N
Satu bin bisa muncul di jadwal harian berulang
ResiduBinPickup → ResiduSubmitLog
1 : 1
Setiap penanganan menghasilkan satu log timbangan
User → NotifikasiEntity
1 : N
Satu user punya banyak notifikasi
5.3 Gambaran ERD
DPL --< KelompokKKN >-- User(Mahasiswa)
                                     |
            mendampingi (WargaDampingan: N:M)
                                     v
User(Warga) -- Household --< Bin >-- WasteLog --> PointHistory
                                |
                          mengaktivasi (Mahasiswa)
User(Mahasiswa) --< PemanfaatanSampah
User(Mahasiswa) --< PengajuanIzin ---------------> DPL
User(Mahasiswa) --< Presensi >-- JadwalKegiatan
Bin --< ResiduBinPickup >-- User(Petugas)
              |
              +--< ResiduSubmitLog --> PointHistory (Petugas)
User(any) --< NotifikasiEntity [tipe: WARGA | KKN | PETUGAS_RESIDU]
6. Alur Sistem End-to-End
Skenario lengkap satu siklus pengelolaan sampah TrashCare, melibatkan ketiga role secara berurutan.
Fase 1 — Onboarding (Mahasiswa KKN)
Login -> cari warga terdaftar di wilayah tugas -> scan QR bin ORGANIK (GPS aktif)
-> validasi (warga valid? bin belum aktif? mahasiswa di zona benar?)
-> scan QR bin ANORGANIK -> backend ikat kedua bin ke household warga
-> notifikasi ke warga: "Tempat sampah Anda berhasil diaktivasi"
-> poin kontribusi mahasiswa bertambah
OUTCOME: warga yang sudah punya akun kini bisa scan sampah
Fase 2 — Pemilahan & Reward (Warga)
Notifikasi pengingat pagi -> foto sampah -> AI deteksi (jenis, volume, berat, confidence)
-> konfirmasi estimasi poin -> scan QR bin (geofencing lolos, cek kapasitas aman)
-> backend commit WasteLog + PointHistory -> UI tampilkan poin bertambah
Sore hari, jika bin capai 80% kapasitas -> notifikasi otomatis "Bin hampir penuh"
Fase 3 — Monitoring (Mahasiswa KKN)
Mingguan: buka Monitoring -> lihat correctPercentage tiap warga binaan
-> warga dengan skor <80% di-flag "Perlu Re-edukasi" -> kunjungan lapangan
Presensi: buka jadwal kegiatan -> GPS tracking aktif -> dalam radius lokasi
-> timer durasi minimum terpenuhi -> tombol Absen aktif -> presensi tercatat
Fase 4 — Penanganan Residu (Petugas Pemilahan)
Window pagi 06:00-08:00: dashboard tampil KPI & progress hari ini
-> buka jadwal -> bin HIGH VOLUME (>=70%) prioritas tinggi -> menuju lokasi
-> foto bukti -> timbang fisik -> input berat + klasifikasi -> aktifkan GPS
-> Submit Log -> backend simpan log, update volume bin, poin petugas bertambah
-> notifikasi lokal "Log Timbangan tersimpan"
Fase 5 — Pelaporan & Poin KKN (Mahasiswa)
Akhir minggu: buka Pemanfaatan Sampah -> isi jenis, kategori, jumlah, deskripsi
-> upload foto kegiatan -> submit -> poin KKN kelompok bertambah
Ringkasan Siklus Lengkap
Mahasiswa aktivasi warga
  -> Warga memilah sampah -> dapat poin -> volume bin bertambah
  -> Bin mencapai kapasitas -> warga dapat notif + ajukan reset
  -> Petugas Pemilahan cek titik kumpul -> timbang -> submit timbangan
  -> Bin kosong kembali -> warga bisa scan lagi -> siklus berulang
  -> Mahasiswa monitor kepatuhan warga -> edukasi jika perlu -> siklus membaik
7. Catatan & Rekomendasi (Analisis Risiko)
7.1 Potensi Risiko Sistem
Risiko
Mitigasi Sudah Ada
Rekomendasi Tambahan
Replay attack: scan berulang tanpa buang sampah sungguhan
Volume bin dicek sebelum commit; scan ditolak jika penuh
Cooldown per user per bin (maks 3x/hari); rate limiting API; anomaly detection
GPS spoofing / mock location
Haversine distance check 10m di production
Deteksi isMockLocation; validasi koordinat server-side; log anomaly
Foto bukti palsu (petugas/mahasiswa)
Upload foto dikompresi & multipart
Validasi EXIF; wajib in-app camera; watermark timestamp & GPS otomatis
Whitelist bypass petugas via API langsung
Backend seharusnya validasi whitelist tiap request
Middleware/guard backend reject akun non-APPROVED
Aktivasi bin oleh mahasiswa di luar zona penugasan
-
Validasi backend: zona mahasiswa harus sama dengan alamat warga
7.2 Rekomendasi Fitur Tambahan
Fitur
Penjelasan
Admin Dashboard (Kecamatan/Kelurahan)
Peta sebaran bin, statistik agregat compliance, progress KKN, approval whitelist petugas
Achievement & Badge System
Badge 'Pemilah Konsisten 30 Hari', 'Zero Error Week'; level Warga Biasa → Eco Warrior → Green Champion
Notifikasi Push Proaktif
Pengingat di waktu optimal per user; alert compliance turun drastis
Peta Interaktif Real-Time
Sebaran bin untuk petugas & warga binaan untuk mahasiswa; route planning
Sistem Reward/Tukar Poin
Marketplace virtual voucher/pulsa/token listrik; partnership UMKM; donasi poin
Reporting & Export Data
Export laporan KKN (PDF), laporan bulanan petugas (CSV/PDF), agregat admin
Offline Mode Robust
Queue transaksi scan saat offline, sync otomatis, indikator poin pending
AI Model Improvement Loop
Feedback warga jika deteksi AI salah, dikumpulkan untuk re-training berkala
8. Lampiran: Mapping Endpoint API ↔ Fitur
Endpoint
Method
Role
Fitur
/auth/login
POST
Semua
Login
/auth/register/warga
POST
Warga
Register warga
/auth/register/mahasiswa-kkn
POST
Mahasiswa KKN
Register mahasiswa
/auth/register/petugas-residu
POST
Petugas Pemilahan
Register petugas
/waste/detect
POST
Warga
Deteksi AI sampah
/bins/scan
POST
Warga
Commit transaksi scan + poin
/bins/activate, /bins/measure
POST
Warga/Mahasiswa
Aktivasi & ukur kapasitas bin
/bins/reset
POST
Warga
Ajukan pengosongan bin
/transactions/my-deposits
GET
Warga
Riwayat pemilahan
/points/me, /points/leaderboard
GET
Warga
Poin & leaderboard
/kkn/dashboard
GET
Mahasiswa KKN
Dashboard KKN
/kkn/warga-dampingan, /kkn/warga
GET
Mahasiswa KKN
Daftar & cari warga binaan
/kkn/warga/activate-bin
POST
Mahasiswa KKN
Aktivasi bin warga
/kkn/attendance/check-in
POST
Mahasiswa KKN
Presensi kehadiran
/kkn/pemanfaatan-sampah
POST
Mahasiswa KKN
Submit laporan pemanfaatan
/kkn/pengajuan-izin
POST
Mahasiswa KKN
Ajukan izin ke DPL
/kkn/kelompok/me, /kkn/history
GET
Mahasiswa KKN
Info kelompok & riwayat KKN
/petugas-residu/dashboard
GET
Petugas Pemilahan
Dashboard petugas
/petugas-residu/jadwal-harian
GET
Petugas Pemilahan
Jadwal penjemputan
/petugas-residu/submit-log
POST
Petugas Pemilahan
Submit timbangan residu
/petugas-residu/riwayat
GET
Petugas Pemilahan
Riwayat log
/notifications
GET
Semua
Ambil notifikasi
Dokumen ini disusun berdasarkan gabungan dokumentasi fitur Warga, Mahasiswa KKN, dan Petugas Pemilahan — mencakup model data, alur bisnis, endpoint API, dan analisis risiko sistem TrashCare.