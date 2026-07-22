# 📋 Master Tracker — Pilah Sampah Cerdas (8-Role Transition)

## BATCH 1: Fondasi

### Bagian 2 — Perubahan Database & Migrasi (Batch 1)
- [x] Database - Tambah/perluas data role di tabel `roles` menjadi 8 role (Selesai: Diperbarui via Prisma seed & migration)
- [x] Database - Buat tabel `qr_batches` untuk melacak pencetakan batch QR (Selesai: Ditambahkan ke schema & migrated)
- [x] Database - Update tabel `bins` tambahkan status (PRINTED, ASSIGNED_TO_PIC, ACTIVE_BOUND, BROKEN, INACTIVE) (Selesai: Ditambahkan ke schema & migrated)
- [x] Database - Update tabel `bins` tambahkan `kepemilikan_utama_user_id` (Foreign Key ke `users`) (Selesai: Ditambahkan ke schema & migrated)
- [x] Database - Update tabel `bins` tambahkan `kepemilikan_tambahan_user_ids` (Array string/JSON untuk sub-pemilik) (Selesai: Ditambahkan ke schema & migrated)
- [x] Database - Update tabel `waste_logs` tambahkan `ai_confidence`, `ai_classification`, `actual_weight_petugas`, `discrepancy_status`, `geolocation` (Selesai: Ditambahkan ke schema & migrated)
- [x] Database - Buat tabel `students_kkn` untuk menyimpan profil mahasiswa KKN, tanggal aktif, dan wilayah tugas (Selesai: Ditambahkan ke schema & migrated)
- [x] Database - Buat tabel `petugas_residu` untuk melacak skor KPI dan zona tugas petugas (Selesai: Ditambahkan ke schema & migrated)
- [x] Database - Buat tabel `facilities` untuk mencatat lokasi dan operasional Loseda, Bata Terawang, Rumah Maggot, Bank Sampah, TPS (Selesai: Ditambahkan ke schema & migrated)
- [x] Database - Buat tabel `facility_production_logs` untuk mencatat material masuk dan output produksi maggot/pupae (Selesai: Ditambahkan ke schema & migrated)
- [x] Database - Buat tabel `bank_sampah_ledger` untuk mencatat transaksi keuangan riil penjualan anorganik warga (Selesai: Ditambahkan ke schema & migrated)
- [x] Database - Buat tabel `ide_daur_ulang` untuk menampung pengajuan ide daur ulang warga (Selesai: Ditambahkan ke schema & migrated)
- [x] Database - Buat tabel `system_configs` untuk menyimpan parameter bisnis dinamis (Selesai: Ditambahkan ke schema & migrated)
- [x] Database - Buat tabel `audit_trail` untuk mencatat log perubahan data sensitif oleh admin (Selesai: Ditambahkan ke schema & migrated)
- [x] Database - Buat tabel `social_feed` untuk menampung stream aktivitas positif publik (Selesai: Ditambahkan ke schema & migrated)
- [x] Database - Buat tabel `notification_logs` untuk logging status pengiriman notifikasi WhatsApp, Email, dan FCM (Selesai: Ditambahkan ke schema & migrated)
- [x] Database - Buat Prisma Migration files bertahap dan reversible (up/down) (Selesai: Ditulis di migrations/20260721130000_extend_schema_for_8_roles/migration.sql)
- [x] Database - Buat migration script untuk memigrasikan data lama (users, bins, waste_logs) tanpa kehilangan data (Selesai: Dialter secara safe via migration.sql)
- [ ] Database - Uji coba migration rollback (down) secara lokal untuk memastikan keandalan migrasi
- [ ] Database - Lakukan backup database production sebelum eksekusi migrasi di server

### 3.1 IAM 8-Role (Batch 1)
- [x] BE - Definisikan RBAC Matrix dan middleware verifikasi izin untuk ke-8 role (Selesai)
- [x] BE - Implementasikan data-scoping berjenjang berbasis polygon wilayah pada query database (Selesai)
- [x] BE - Implementasikan endpoint registrasi Admin DLH (oleh Super Admin) (Selesai)
- [x] BE - Implementasikan endpoint registrasi Camat, Lurah, RW, dan whitelist Mahasiswa KKN (oleh Admin DLH) (Selesai)
- [x] BE - Implementasikan endpoint registrasi Petugas Residu (oleh RW atau Admin DLH) (Selesai)
- [x] BE - Implementasikan endpoint self-registration Warga dengan validasi otomatis terhadap QR ID master database (Selesai)
- [x] BE - Implementasikan endpoint self-registration Mahasiswa KKN (status PENDING sebelum diapprove Admin DLH) (Selesai)
- [x] BE - Buat logic time-bound akun Mahasiswa KKN (otomatis read-only setelah `end_date`) (Selesai)
- [ ] FE - Buat halaman login dan register dinamis menyesuaikan tipe akun (Role-based UI flow)
- [ ] Mobile - Hubungkan antarmuka login dan register ke API backend menggunakan JWT & Secure Storage

### 3.2 QR/Bin State Machine (Batch 1)
- [x] BE - Implementasikan state machine transition untuk QR Code (PRINTED -> ASSIGNED_TO_PIC -> ACTIVE_BOUND -> BROKEN/INACTIVE) (Selesai)
- [ ] BE - Buat audit trail otomatis setiap terjadi transisi status QR Code
- [x] BE - Buat endpoint bagi Admin DLH untuk generate QR batch baru (menciptakan baris di `qr_batches` & `bins`) (Selesai)
- [x] BE - Buat endpoint bagi Admin DLH untuk assign QR batch ke PIC Mahasiswa KKN (Selesai)
- [x] BE - Buat endpoint scan & registrasi bin oleh Mahasiswa KKN (validasi kecocokan PIC dan status ASSIGNED_TO_PIC) (Selesai)
- [x] BE - Ubah status bin menjadi ACTIVE_BOUND setelah registrasi berhasil (Selesai)
- [x] BE - Implementasikan logic kepemilikan ganda (1 Warga Utama sebagai penanggung jawab fisik, N Warga Tambahan) (Selesai)
- [ ] BE - Hubungkan AI volume estimation endpoint untuk estimasi volume tong (P x L x T) dari foto saat registrasi
- [x] BE - Implementasikan bonus +10 poin otomatis per tong sampah yang berhasil mencapai status ACTIVE_BOUND (Selesai)
- [ ] BE - Buat endpoint bagi RW untuk menandai tong sampah sebagai BROKEN (otomatis transisi ke INACTIVE)
- [ ] BE - Buat endpoint pengajuan penggantian tong sampah rusak oleh Warga ke RW/Admin DLH
- [ ] FE - Buat panel Admin DLH untuk generate dan assign batch QR ke Mahasiswa KKN
- [ ] FE/Mobile - Buat alur form pengajuan penggantian tong rusak bagi Warga/RW

### 3.8 Rule Engine (Batch 1)
- [x] Database - Seed tabel `system_configs` dengan 14 parameter bisnis bawaan (ai_confidence_threshold, multiplier, penalty, dll.) (Selesai)
- [x] BE - Implementasikan Service/Repository untuk membaca konfigurasi dinamis dari `system_configs` (Selesai)
- [x] BE - Integrasikan caching Redis untuk optimasi pembacaan system configs (Selesai)
- [x] BE - Implementasikan invalidasi cache Redis otomatis ketika ada konfigurasi yang diupdate (Selesai)
- [ ] FE - Buat halaman panel admin Rule Engine (Super Admin & Admin DLH) untuk CRUD parameter bisnis secara dinamis

### Batch 1 Gaps (Refinement)
- [x] BE - Refactor `kepemilikanTambahanUserIds` dan `kepemilikanUtamaUserId` ke tabel junction `bin_ownerships` (Selesai)
- [x] BE - Terapkan middleware `readOnlyGuard` untuk `CAMAT` & `LURAH` (Selesai)
- [x] Database - Seed 13 parameter default `system_configs` di migration SQL (Selesai)
- [x] Dokumentasi - Tambahkan backup runbook `pg_dump` ke `docs/deployment_runbook.md` (Selesai)
- [x] BE - Hubungkan logging `AuditTrail` untuk approve KKN, status BROKEN, dan batch assignment (Selesai)
- BE - Konfirmasi/Validasi PIC: bypass PIC check untuk registrasi mandiri Warga, validasi hanya untuk Mahasiswa KKN (Selesai)
- [x] BE - Cegah race condition aktivasi QR dengan transaction lock `FOR UPDATE` (Selesai)
- [x] Testing - Tambahkan test case vitest untuk Camat/Lurah block, KKN expired block, dan PIC mismatch (Selesai)

---

## BATCH 2: Operasional Inti

### 3.3 Fleet Management (Batch 2)
- [ ] BE - Buat Cron job untuk memicu window pelaporan Petugas Residu pukul 06:00-08:00 dan 16:00-18:00
- [ ] BE - Implementasikan potongan skor KPI 15% otomatis jika Petugas telat atau tidak melaporkan di dalam window
- [ ] BE - Buat WebSocket server untuk sistem dispatch on-demand tong penuh (>80%)
- [ ] BE - Implementasikan broadcast dispatch ke seluruh Petugas Residu dalam radius 2 KM (Haversine formula)
- [ ] BE - Buat endpoint/WebSocket event "Terima Tugas" tercepat (concurrency safe)
- [ ] BE - Lakukan re-optimasi rute penjemputan dinamis setelah tugas diclaim oleh petugas
- [ ] FE - Tambahkan visualisasi status penjemputan petugas pada peta monitoring
- [ ] Mobile - Integrasikan WebSocket client pada aplikasi Petugas Residu untuk menerima broadcast dispatch secara real-time
- [ ] Mobile - Desain UI claim tugas "Terima Tugas" tercepat dengan kalkulasi rute navigasi GPS ke lokasi bin

### 3.4 AI Deteksi & Emisi (Batch 2)
- [ ] BE - Implementasikan endpoint discrepancy check: bandingkan input manual Petugas vs klasifikasi AI
- [ ] BE - Buat status PENDING_REVIEW jika ada ketidaksesuaian klasifikasi dan confidence AI > 90%
- [ ] BE - Buat endpoint bagi Admin DLH untuk mengaudit/memvalidasi laporan berstatus PENDING_REVIEW
- [ ] BE - Implementasikan kalkulator skor kepatuhan warga (Compliance Score) berbasis formula On-Time Rate & AI Accuracy
- [ ] BE - Buat kalkulator emisi gas rumah kaca yang dihindari (CO2e avoided) dari berat organik komposter/maggot (*0.05)
- [ ] BE - Buat endpoint bagi Petugas Residu untuk submit laporan aktual (timbangan, foto, klasifikasi manual, GPS)
- [ ] FE - Buat halaman audit discrepancy bagi Admin DLH untuk memproses laporan PENDING_REVIEW
- [ ] Mobile - Hubungkan form input setoran sampah Petugas Residu ke endpoint laporan aktual backend

### 3.5 Gamifikasi 3D (Batch 2)
- [ ] BE - Implementasikan ledger poin terpisah per dimensi (Reduksi Tonase, Partisipasi Streak, Ide Daur Ulang)
- [ ] BE - Buat tracker streak 5 hari berturut-turut setoran tepat waktu untuk bonus +10 poin Warga Tambahan
- [ ] BE - Buat endpoint pengajuan ide daur ulang oleh warga (upload foto, deskripsi, material)
- [ ] BE - Buat endpoint persetujuan ide daur ulang oleh RW (sekaligus memicu penambahan +50 poin)
- [ ] BE - Buat service poin KPI Petugas Residu (poin dari presisi laporan & ketepatan waktu)
- [ ] BE - Buat service poin Mahasiswa KKN (poin dari pendampingan rumah tangga aktif & growth compliance rate)
- [ ] BE - Buat logic agregasi poin wilayah (RT, RW, Kelurahan, Kecamatan) sebagai data virtual (read-only)
- [ ] FE - Buat leaderboard gamifikasi berjenjang berdasarkan agregasi wilayah dan individu warga
- [ ] FE/Mobile - Buat antarmuka pengajuan ide daur ulang (Warga) dan persetujuan ide daur ulang (RW)

---

## BATCH 3: Modul Besar

### 3.6 GIS & Fasilitas (Batch 3)
- [ ] FE - Integrasikan peta Leaflet.js dengan kustomisasi marker (Loseda/Maggot=Hijau, Bank Sampah=Biru, TPS=Merah, Flash Drop=Emas)
- [ ] FE - Buat komponen legenda peta interaktif sesuai kategori fasilitas
- [ ] FE - Buat form GIS untuk input data fasilitas baru (oleh Mahasiswa KKN atau RW)
- [ ] BE - Buat endpoint manajemen fasilitas dan pencatatan produksi Rumah Maggot (Material masuk vs output panen)
- [ ] BE - Buat log distribusi produk maggot ke peternakan terdaftar
- [ ] BE - Buat model data dan CRUD untuk entitas peternakan penerima distribusi (populasi & hasil panen)
- [ ] BE - Buat model dan endpoint Bank Sampah Ledger untuk pencatatan saldo rupiah warga dari penjualan anorganik
- [ ] FE - Buat UI Bank Sampah Ledger untuk melihat saldo rupiah, riwayat transaksi, dan penarikan tunai warga

### 3.7 Notifikasi (Batch 3)
- [ ] BE - Buat provider-agnostic interface untuk layanan WhatsApp (Wablas/Fonnte)
- [ ] BE - Implementasikan pengiriman OTP Login Warga via WhatsApp
- [ ] BE - Implementasikan push alarm WhatsApp untuk notifikasi "Tong Penuh" ke Petugas Residu terdekat
- [ ] BE - Implementasikan pengiriman daily report kepatuhan wilayah ke WhatsApp RW jika kepatuhan menurun
- [ ] BE - Integrasikan SendGrid SMTP untuk pengiriman laporan PDF bulanan otomatis ke Camat & Lurah
- [ ] BE - Implementasikan pengiriman email SendGrid untuk konfirmasi penerimaan Ide Daur Ulang
- [ ] BE - Konfigurasikan Firebase Cloud Messaging (FCM) SDK di backend
- [ ] BE - Implementasikan trigger push notification FCM saat event "Flash Drop Hour" aktif
- [ ] BE - Implementasikan trigger push notification FCM saat warga berhasil meng-unlock Badge Gamifikasi baru
- [ ] FE/Mobile - Implementasikan receiver token FCM dan penanganan notifikasi in-app

---

## BATCH 4: Penyempurnaan

### 3.9 Dashboard & Logging (Batch 4)
- [ ] FE - Buat Multi-axis Line Chart gabungan tren mingguan (Organik, Non-Organik, Residu) berlabel satuan kg
- [ ] FE - Tambahkan fitur toggle filter untuk memecah bagan multi-axis menjadi bagan kategori individual
- [ ] FE - Buat chart donat komposisi sampah disertai tombol detail breakdown per RT/RW
- [ ] FE - Implementasikan fitur export CSV dan PDF untuk tabel breakdown komposisi sampah
- [ ] FE - Buat visualisasi Heatmap kepatuhan pada peta GIS berbasis polygon RT/RW sewarna skor kepatuhannya
- [ ] BE - Buat sistem logging Audit Trail untuk melacak perubahan data oleh admin (Super Admin only view)
- [ ] BE - Buat sistem logging Social Feed untuk menampilkan stream aktivitas positif publik secara real-time
- [ ] FE - Tampilkan feed aktivitas publik di Dashboard Warga
- [ ] FE - Buat fitur download panduan pemilahan sampah PDF statis yang diunggah oleh Admin DLH
- [ ] FE - Hapus card "Tempat Sampah QR" dari Dashboard Utama dan pindahkan ke halaman Manajemen Tempat Sampah
- [ ] FE - Hapus panel "Manajemen Pengguna" dari Dashboard Poin Warga
- [ ] FE - Ganti tombol "Hubungi RT" menjadi "Hubungi Petugas" yang memicu dispatch darurat & marker di peta petugas

### 3.10 Mobile & Web Sinkronisasi (Batch 4)
- [ ] Mobile - Hapus seluruh fallback dummy/mock data pada `mobile/lib/config/app_config.dart`
- [ ] Mobile - Hapus file dummy `mobile/lib/data/mock/mock_data.dart`
- [ ] Mobile - Hubungkan layer repository auth ke API backend (`api_auth_repository.dart`) dengan JWT token rotation
- [ ] Mobile - Hubungkan layer repository bin ke API backend (`api_bin_repository.dart`) untuk monitoring kapasitas riil
- [ ] Mobile - Hubungkan riwayat setoran sampah ke API backend menggunakan `api_waste_log_repository.dart`
- [ ] Mobile - Uji sinkronisasi WebSocket untuk dispatch on-demand dari sisi aplikasi mobile Petugas Residu
- [ ] Mobile - Uji integrasi scan QR Code dan kirim payload registrasi bin beserta foto estimasi volume AI ke backend
- [ ] Sistem - Jalankan end-to-end integration testing antara Backend, Web Frontend, dan Mobile App secara penuh
