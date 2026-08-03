# DOKUMEN CHECKLIST & SPESIFIKASI TESTING QC TRASHCARE (SEMUA ROLE & FITUR)

> **Versi Dokumen:** 2.0 (Final Comprehensive QC Checklist)  
> **Tanggal Pembaruan:** 31 Juli 2026  
> **Target Aplikasi:** Trashcare (Web App & Mobile App Monorepo)  
> **Standar Bahasa:** Bahasa Indonesia Baku (Sesuai KBBI & Spec Final Trashcare)  

---

## 1. Matriks Hak Akses & Role (RBAC Matrix)

Sistem Trashcare mendukung **10 Peran (Role)** dengan tingkat otorisasi dan akses data yang terisolasi secara ketat:

| No | Peran / Role | Metode Login (Saat Ini) | Scope Data | Batasan Operasi (Read/Write) |
|---|---|---|---|---|
| 1 | **Warga** | No HP (+62) + OTP/Password | Rumah Tangga Sendiri | Read/Write (Setoran, Bin, Ide Daur Ulang) |
| 2 | **Mahasiswa KKN** | No HP (+62) + Password (Profile: NIM) | Zona KKN & Warga Dampingan | Read/Write (Binding Warga, Location Ping) |
| 3 | **DPL (Dosen Pembimbing)** | No HP (+62) + Password (Profile: NIP) | Mahasiswa Bimbingan KKN | Read/Write (Web Monitoring KKN & Logbook) |
| 4 | **Petugas Residu** | No HP (+62) + Password | TPS / TPA Hilir & Web Portal | Read/Write (Web Monitoring Residu & Input Timbangan Manual) |
| 5 | **RW** | No HP (+62) + Password | Wilayah RW Sendiri | Read/Write (Approval Bin, Pemanfaatan, Approval Ide) |
| 6 | **Lurah** | No HP (+62) + Password | Se-Kelurahan | **Read-Only** (Strict Guard 403 write attempt) |
| 7 | **Camat** | No HP (+62) + Password | Se-Kecamatan | **Read-Only** (Strict Guard 403 write attempt) |
| 8 | **Admin DLH** | No HP (+62) + Password | Se-Kota | **Read-Only** (Kecuali Approval Diskrepansi AI) |
| 9 | **Super Admin** | No HP (+62) + Password | System Wide (Se-Kota) | Akses Penuh (Raw Data, System Config, Admin CRUD, Bulk KKN) |


---

## 2. Rincian 28 Modul Fitur QC (Lengkap & Detail)

### Modul 1: Dashboard Ringkasan & Grafik Metrik
- [ ] **1.1 Summary Cards**: Render akumulasi Total Sampah (Kg), Total Poin Terkumpul, User Aktif, dan Jumlah Tempat Sampah.
- [ ] **1.2 Chart Tren**: Render grafik tren harian dan bulanan (Line Chart & Bar Chart) secara responsif.
- [ ] **1.3 Filter Date Range**: Filter tanggal (Start Date – End Date) berfungsi memuat ulang data metrik & chart.
- [ ] **1.4 Loading State**: Skeleton / Spinner loading tampil saat memanggil API backend.
- [ ] **1.5 Empty/Error State**: Pesan informatif & tombol reload tampil saat data kosong atau API error.

### Modul 2: Input Setoran Manual & Estimasi Poin
- [ ] **2.1 Autocomplete Warga/NKK**: Search box nama warga / NKK responsif dengan debouncing.
- [ ] **2.2 Validasi Form**: Jenis sampah wajib dipilih, berat sampah (Kg) harus angka numerik > 0.
- [ ] **2.3 Estimasi Poin Otomatis**: Kalkulasi otomatis estimasi poin (Organik: 0.4/L atau 0.9 x Kg x Confidence, Anorganik: 0.2/L).
- [ ] **2.4 Form Reset**: Form otomatis bersih setelah transaksi setoran berhasil disimpan.
- [ ] **2.5 Feedback Toast/Alert**: Notification toast muncul memberitahukan status sukses / gagal submit.

### Modul 3: Manajemen Pengguna & Hak Akses
- [ ] **3.1 Tabel Pengguna**: Menampilkan daftar user lengkap dengan role (Warga, RT, RW, Mahasiswa, Petugas, dll).
- [ ] **3.2 Pagination Tabel**: Tombol Next, Prev, dan Page Number berfungsi tepat.
- [ ] **3.3 Pencarian Pengguna**: Filter live search berdasarkan Nama, Email, atau Nomor HP.
- [ ] **3.4 Tambah Pengguna**: Form validasi email unik, format password kuat, dan penentuan role.
- [ ] **3.5 Edit Pengguna**: Perubahan data profil & pergeseran role tersimpan ke database.
- [ ] **3.6 Hapus / Nonaktifkan**: Modal konfirmasi muncul sebelum aksi penghapusan/penonaktifan user.

### Modul 4: Manajemen Tempat Sampah (Bin Management)
- [ ] **4.1 List Tabel Bin**: Menampilkan ID Bin, Nama Pemilik/Lokasi, Jenis (Organik/Anorganik), Kapasitas.
- [ ] **4.2 Indikator Kapasitas**: Bar indikator warna (Hijau <70%, Kuning 70-89%, Merah >=90% Penuh).
- [ ] **4.3 Tambah Bin & Geofencing**: Input titik koordinat lat/long pada peta interaktif dan penetapan kapasitas liter/Kg.
- [ ] **4.4 Edit Detail Bin**: Update kapasitas, koordinat GPS, dan lokasi tempat sampah tersimpan.
- [ ] **4.5 Hapus Bin Modal**: Modal konfirmasi penghapusan tempat sampah.

### Modul 5: Manajemen Lokasi & Struktur Wilayah
- [ ] **5.1 Hirarki Data Wilayah**: Tampilan struktur bertingkat (Kecamatan → Kelurahan → RW → RT).
- [ ] **5.2 Tambah Wilayah Baru**: Form validasi input nama Kelurahan/RW/RT baru.
- [ ] **5.3 Edit Detail Lokasi**: Update nama RT/RW dan batas wilayah.
- [ ] **5.4 Validasi Relasi Hapus**: Gagal hapus (400 Bad Request) jika masih ada User/Tempat Sampah yang terikat pada lokasi tersebut.

### Modul 6: Review Diskrepansi AI & Verifikasi Manual
- [ ] **6.1 Tabel Diskrepansi**: Menampilkan daftar setoran bermasalah (Klasifikasi AI vs Input Manual Petugas).
- [ ] **6.2 Komparasi Gambar**: Tampilan foto sampah warga side-by-side dengan label klasifikasi AI.
- [ ] **6.3 Action Approve AI**: Tombol membenarkan hasil AI -> Update DB & penyesuaian poin otomatis.
- [ ] **6.4 Action Reject/Koreksi**: Tombol membenarkan input manual -> Re-kalkulasi poin sesuai koreksi.
- [ ] **6.5 Filter Status**: Filter berdasarkan tanggal setoran dan status (`PENDING_REVIEW`, `RESOLVED`).

### Modul 7: Rekap Setoran & Transaction History
- [ ] **7.1 Tabel Rekap Setoran**: Menampilkan riwayat transaksi setoran dari seluruh wilayah.
- [ ] **7.2 Date Range Filter**: Filter data transaksi berdasarkan rentang tanggal.
- [ ] **7.3 Filter Tipe Sampah**: Filter spesifik jenis sampah (Organik vs Anorganik).
- [ ] **7.4 Fitur Export Data**: Download file format CSV / Excel dengan header kolom baku (Berat dalam Kg).

### Modul 8: Laporan & Analitik Lanjutan
- [ ] **8.1 Chart Perbandingan Tren**: Chart visualisasi perbandingan sampah terpilah vs residu.
- [ ] **8.2 Metrik Analitik**: Tampilan persentase daur ulang, akumulasi organik, dan tingkat partisipasi aktif.
- [ ] **8.3 Filter Wilayah Laporan**: Dropdown filter laporan berdasar Kelurahan / RW.
- [ ] **8.4 Export Laporan Valid**: Export laporan ke format PDF / Excel menghasilkan dokumen yang valid.

### Modul 9: Poin Warga & Histori Mutasi
- [ ] **9.1 Akurasi Saldo Poin**: Tampilan saldo poin warga realtime sinkron dengan database ledger.
- [ ] **9.2 Tabel Histori Mutasi**: Log kredit/debit poin lengkap dengan tanggal, deskripsi pemicu, dan referensi transaksi.
- [ ] **9.3 Placeholder Redeem Poin**: Struktur data mendukung `redeemable: false` untuk pengembangan tahap berikutnya.

### Modul 10: Ide Daur Ulang & Edukasi Warga
- [ ] **10.1 Grid/List Konten**: Tampilan artikel & panduan ide daur ulang dengan card UI modern.
- [ ] **10.2 Pencarian Artikel**: Search bar filter artikel daur ulang berdasarkan kata kunci.
- [ ] **10.3 Admin CRUD (Tambah)**: Upload gambar thumbnail dan pengisian artikel edukasi.
- [ ] **10.4 Admin CRUD (Edit & Hapus)**: Update isi artikel atau hapus ide daur ulang dengan konfirmasi.

### Modul 11: Jadwal Kegiatan Lingkungan
- [ ] **11.1 Tampilan Agenda/Kalender**: Menampilkan kalender / list jadwal kerja bakti & sosialisasi.
- [ ] **11.2 Detail Kegiatan Modal**: Pop-up detail waktu, lokasi TPS/RW, dan deskripsi acara.
- [ ] **11.3 CRUD Jadwal (Admin)**: Form tambah/edit jadwal dengan validasi format tanggal & waktu.
- [ ] **11.4 Hapus Jadwal**: Aksi hapus jadwal disertai modal konfirmasi.

### Modul 12: Kategori Sampah & Multiplier Konversi
- [ ] **12.1 List Kategori Master**: Menampilkan master jenis sampah (Organik & Anorganik) dan formula konversinya.
- [ ] **12.2 Edit Multiplier Poin**: Pengubahan nilai pengali poin (misal: 100 poin/Kg) tersimpan otomatis.
- [ ] **12.3 Proteksi System Default**: Kategori bawaan sistem tidak dapat dihapus dari UI.

### Modul 13: Notifikasi System & Notification Center
- [ ] **13.1 List Alert System**: Menampilkan daftar notifikasi (contoh: Alert Tong Penuh >90%, Eskalasi Penjemputan).
- [ ] **13.2 State Read/Unread**: Visualisasi pembeda jelas antara notifikasi belum dibaca (Bold/Highlight) dan sudah dibaca.
- [ ] **13.3 Mark All as Read**: Tombol "Tandai Semua Dibaca" memperbarui state seluruh notifikasi user.
- [ ] **13.4 Navigasi Klik Notifikasi**: Mengklik item notifikasi langsung mengarah ke halaman/detail terkait.

### Modul 14: Pengaturan Profil & Keamanan
- [ ] **14.1 Update Profil**: Form ubah nama lengkap & upload foto profil berfungsi.
- [ ] **14.2 Ganti Password**: Validasi password lama, matching password baru, dan min length 8 karakter.
- [ ] **14.3 Preferensi Tampilan**: Switch toggle Dark Mode / Light Mode tersimpan di local preference.

### Modul 15: Rule Engine & System Configuration
- [ ] **15.1 Parameter Global**: List konfigurasi sistem (Timeout AI, Masa Aktif Bin 30 hari, Confidence Threshold 90%).
- [ ] **15.2 Form Edit Configuration**: Input pengubahan nilai threshold variabel global.
- [ ] **15.3 Backend Update Realtime**: Perubahan konfigurasi langsung berdampak pada logika bisnis backend.

### Modul 16: Master QR Code & Inaktivasi Perangkat
- [ ] **16.1 Bulk Generate Batch QR**: Form pembuatan batch QR Code fisik (input jumlah batch yang dicetak).
- [ ] **16.2 Export Batch Download**: Download daftar QR yang dibuat ke format CSV / Excel.
- [ ] **16.3 Tabel Management Status QR**: Monitoring status fisik QR (`PRINTED`, `ASSIGNED_TO_PIC`, `PENDING_APPROVAL`, `ACTIVE_BOUND`, `BROKEN`).
- [ ] **16.4 Action Inaktivasi / Marking Broken**: Menonaktifkan QR rusak / hilang menjadi status `BROKEN` secara permanen.

### Modul 17: Aktivitas Pemilahan Sampah (Immutable Audit Log)
- [ ] **17.1 Immutable Log Table**: Menampilkan histori log aktivitas tata kelola sampah (Read-Only).
- [ ] **17.2 Filter Timestamp**: Filter log berdasarkan rentang tanggal & waktu presisi.
- [ ] **17.3 Filter Action & User**: Filter berdasarkan nama pengguna atau tipe aksi sistem.
- [ ] **17.4 Restriction Edit/Delete**: Tidak ada tombol edit atau hapus (Data log murni immutable).

### Modul 18: Logout, Session & Cookie Cleanup
- [ ] **18.1 Logout Confirmation**: Modal konfirmasi saat pengguna menekan tombol Logout.
- [ ] **18.2 Session & Cookie Purge**: Menghapus `psc_refresh_token` di HttpOnly cookie dan LocalStorage token.
- [ ] **18.3 Redirect Secure**: Pengguna di-redirect otomatis ke halaman `/login`.
- [ ] **18.4 Prevent Back Button**: Menekan tombol "Back" pada browser setelah logout tidak bisa masuk kembali ke Dashboard.

### Modul 19: Ekosistem KKN, Posko & Handover History
- [ ] **19.1 Management Kelompok & Posko KKN**: CRUD data kelompok KKN, alamat posko, dan mapping wilayah RT/RW binaan.
- [ ] **19.2 Assignment Mahasiswa & DPL**: Floating mahasiswa ke kelompok KKN dan penunjukan DPL pembimbing.
- [ ] **19.3 Log Histori Handover (`kkn_handover_history`)**: Pencatatan kronologis serah terima wilayah, warga dampingan, dan aset QR dari gelombang KKN lama ke KKN baru.
- [ ] **19.4 Binding Warga Dampingan**: Pendaftaran warga oleh mahasiswa KKN otomatis ter-bind via JWT token.
- [ ] **19.5 Dashboard Flagging Edukasi**: Menampilkan daftar warga dampingan yang memiliki performa pemilahan buruk untuk edukasi ulang.

### Modul 20: Presensi Background Location Ping & Validasi Polygon KKN
- [ ] **20.1 Background Location Service**: Ping koordinat GPS otomatis (interval 5-10 menit) tanpa tombol absen manual.
- [ ] **20.2 Validasi Geofence Polygon KKN**: Perhitungan akumulasi durasi di dalam zona polygon (Minimal 2 jam hadir, 0m toleransi di luar polygon).
- [ ] **20.3 Monitoring Status Presensi**: Tampilan status presensi otomatis (`HADIR_VALID`, `DI_LUAR_ZONA`, `DURASI_KURANG`).
- [ ] **20.4 Penilaian Performa DPL**: Form penilaian aktivitas mahasiswa oleh DPL terpisah dari log absensi otomatis.

### Modul 21: Pemanfaatan Sampah & Fasilitas GIS
- [ ] **21.1 Pencatatan Program Lingkungan**: Input data kegiatan Buruan Sae, BSF Rumah Maggot, POC, Loseda, Bata Terawang, dan Bank Sampah.
- [ ] **21.2 Input Tonase & Panen**: Form input jumlah Kg bahan baku organik masuk, hasil panen/produk, dan foto dokumentasi.
- [ ] **21.3 Filter Tampilan Pemanfaatan**: Filter data pemanfaatan berbasis Realtime, Mingguan, Bulanan, dan Wilayah RW.

### Modul 22: Pengangkutan Sampah & Eskalasi Berjenjang
- [ ] **22.1 Trigger Alert Notif Tong Penuh**: Notifikasi push ke Petugas & RW + Marker merah pada peta saat tempat sampah >90%.
- [ ] **22.2 Flow Status Pengangkutan**: Transisi status penjemputan (`Menunggu` → `Diterima` → `Dalam Perjalanan` → `Selesai` / `Dibatalkan`).
- [ ] **22.3 Eskalasi Otomatis Berjenjang**: Notifikasi eskalasi otomatis jika melebihi jam operasional (06:00-08:00 & 16:00-18:00) berjenjang: RW → Lurah → Camat → Admin DLH.
- [ ] **22.4 Routing Petugas Pengangkut**: Auto-assign petugas pengangkut terdekat berdasarkan zona polygon.

### Modul 23: Dashboard Residu Hilir & Input Timbangan Fisik
- [ ] **23.1 Form Input Timbangan Hilir**: Input manual hasil timbangan industri fisik (Kg) di TPS/TPA oleh Petugas Residu.
- [ ] **23.2 Komposisi Residu TPS**: Pencatatan volume residu tidak terolah per wilayah/kontainer.
- [ ] **23.3 Analitik Rasio Residu**: Grafik perbandingan volume sampah terpilah warga vs residu akhir TPA.

### Modul 24: Peta GIS Polygon Interaktif, Heatmap & Legenda 4 Warna
- [ ] **24.1 Dynamic Polygon Generator**: Peta polygon RT/RW digambar otomatis dari batas titik rumah warga.
- [ ] **24.2 Heatmap Keaktifan Wilayah**: Gradasi warna zona berdasarkan tingkat keaktifan & volume pembuangan sampah.
- [ ] **24.3 Multi-Level Drill-Down Zoom**: Interaksi klik Kelurahan → Zoom ke RW → Klik RW → Zoom ke RT/Rumah Warga.
- [ ] **24.4 Peta Legenda 4 Warna**: Hijau (Organik/Kompos), Biru (Daur Ulang), Merah (Residu/TPA), Emas (Flash Drop Challenge).

### Modul 25: Papan Peringkat (Leaderboard) Multi-Kategori Publik
- [ ] **25.1 Leaderboard Warga**: Ranking warga berdasar **Total Poin Terbanyak** (`Berat Kg x AI Confidence x 0.9`).
- [ ] **25.2 Leaderboard RT/RW & Kelurahan**: Ranking wilayah berdasar **Total Volume Sampah Terkelola (Kg)**.
- [ ] **25.3 Akses Publik Realtime**: Leaderboard dapat diakses publik, bersifat realtime, dan all-time.

### Modul 26: Portal RW (RW Verification Center)
- [ ] **26.1 Approval Activation Bin Pertama**: Approval status bin dari `PENDING_APPROVAL` → `ACTIVE_BOUND` (+10 Poin Warga, +10 Poin Mahasiswa).
- [ ] **26.2 Re-aktivasi Bin Inaktif**: Approval tempat sampah yang inaktif (>30 hari tanpa aktivitas).
- [ ] **26.3 Marking Broken Bin**: Penandaan bin rusak (`BROKEN`) sehingga QR deaktif permanen.
- [ ] **26.4 Approval Ide Daur Ulang**: Review & approval ide daur ulang warga (+50 poin warga & publish ke Social Feed).

### Modul 27: Autentikasi WhatsApp OTP (+62) & Read-Only Scoping Guard
- [ ] **27.1 Login Warga via WA OTP**: Login khusus warga via No HP (+62) + WhatsApp OTP + Password Hashed (bcrypt).
- [ ] **27.2 Strict Read-Only Guard (`readOnlyGuard`)**: Middleware menolak (403) seluruh akses write (POST, PUT, DELETE) untuk Admin DLH, Camat, dan Lurah.
- [ ] **27.3 Data-Scoping Wilayah**: Admin DLH (Se-Kota), Camat (Se-Kecamatan), Lurah (Se-Kelurahan).
- [ ] **27.4 Auto-Acceptance Registrasi Warga**: Matching lokasi GPS warga dengan Polygon RT/RW saat registrasi tanpa butuh approval manual.

### Modul 28: Ledger Poin Terpisah & Analitik Kepatuhan / KPI
- [ ] **28.1 Separate Points Ledger**: Pencatatan mutasi poin di tabel DB terpisah per peran dengan flag `redeemable: false`.
- [ ] **28.2 Formula Compliance Score**: Perhitungan `Compliance = (0.5 x OnTimeSubmissionRate) + (0.5 x Avg_AI_Confidence)`.
- [ ] **28.3 Agregasi Wilayah Median**: Pengunaan nilai **MEDIAN** (bukan average) untuk agregasi data wilayah guna mencegah outlier.
- [ ] **28.4 Perhitungan KPI Petugas**: Perhitungan `KPI_Petugas = (0.6 x Ketepatan_Waktu_Lapor) + (0.4 x Akurasi_vs_AI)`.

---

## 3. Skenario QC & Acceptance Criteria per Role (10 Role)

### 3.1 Role: WARGA
| ID Test | Fitur / Modul | Skenario Pengujian | Ekspektasi Hasil | Status |
|---|---|---|---|---|
| W-01 | Auth WA OTP | Login menggunakan Nomor HP (+62) dan OTP WhatsApp | Berhasil masuk & menerima token JWT | [ ] |
| W-02 | Registrasi Bin | Mendaftarkan tempat sampah miliknya (Maks 2: Organik & Anorganik) | Status Bin menjadi `PENDING_APPROVAL` | [ ] |
| W-03 | Setor Sampah AI | Mengunggah foto sampah → AI klasifikasi → Scan QR tempat sampah | Transaksi setoran tercatat, poin dihitung otomatis | [ ] |
| W-04 | Notif Tong Penuh | Mengunggah foto tempat sampah penuh | Push notification terkirim ke Petugas & RW | [ ] |
| W-05 | Histori & Poin | Melihat saldo poin dan histori mutasi setoran | Poin akurat sesuai rumus (`Kg x Confidence x 0.9`) | [ ] |
| W-06 | Ide Daur Ulang | Mengajukan ide daur ulang baru + foto | Status pengajuan `PENDING_APPROVAL_RW` | [ ] |
| W-07 | Leaderboard | Melihat posisi ranking warga berdasarkan poin | Nama & poin tampil di leaderboard publik | [ ] |

### 3.2 Role: RT
| ID Test | Fitur / Modul | Skenario Pengujian | Ekspektasi Hasil | Status |
|---|---|---|---|---|
| RT-01 | Monitoring RT | Login & akses dashboard monitoring wilayah RT | Menampilkan data warga & tempat sampah di RT-nya saja | [ ] |
| RT-02 | Autentikasi Registrasi | Menerima notifikasi registrasi warga di RT-nya | Lokasi GPS warga cocok dengan polygon RT (Auto-Accepted) | [ ] |

### 3.3 Role: RW
| ID Test | Fitur / Modul | Skenario Pengujian | Ekspektasi Hasil | Status |
|---|---|---|---|---|
| RW-01 | Portal RW (Approval Bin) | Menyetujui pendaftaran tempat sampah warga | Status bin berubah `ACTIVE_BOUND`, +10 Poin Warga & KKN | [ ] |
| RW-02 | Approval Re-aktivasi Bin | Verifikasi pengajuan tempat sampah inaktif (>30 hari) | Tempat sampah aktif kembali untuk transaksi setoran | [ ] |
| RW-03 | Marking Broken Bin | Menonaktifkan tempat sampah yang rusak di wilayahnya | Status bin berubah `BROKEN`, QR deaktif permanen | [ ] |
| RW-04 | Approval Ide Daur Ulang | Menyetujui ide daur ulang warga | Warga mendapat +50 poin & artikel terpublish ke feed | [ ] |
| RW-05 | Pemanfaatan Sampah | Input hasil Buruan Sae, BSF Maggot, POC, Loseda | Data tonase & foto panen tersimpan ke sistem | [ ] |

### 3.4 Role: PETUGAS PENGANGKUT
| ID Test | Fitur / Modul | Skenario Pengujian | Ekspektasi Hasil | Status |
|---|---|---|---|---|
| PG-01 | Alert Notif Penuh | Menerima notifikasi tong penuh di area polygon penugasan | Marker merah tampil pada peta rute penjemputan | [ ] |
| PG-02 | Status Penjemputan | Update status pengangkutan (`Menunggu` → `Diterima` → `Dalam Perjalanan` → `Selesai`) | Warga menerima push notif perubahan status | [ ] |
| PG-03 | Laporan Window Waktu | Mendokumentasikan pengambilan dalam window 06-08 / 16-18 | KPI waktu lapor tercatat tinggi | [ ] |

### 3.5 Role: PETUGAS RESIDU
| ID Test | Fitur / Modul | Skenario Pengujian | Ekspektasi Hasil | Status |
|---|---|---|---|---|
| RS-01 | Input Timbangan Hilir | Input berat residu fisik (Kg) dari timbangan industri TPS/TPA | Data residu tercatat tanpa nilai AI confidence | [ ] |
| RS-02 | Residu Dashboard | Melihat grafik tren komposisi residu hilir | Grafik rasio terpilah vs residu ter-update | [ ] |

### 3.6 Role: MAHASISWA KKN
| ID Test | Fitur / Modul | Skenario Pengujian | Ekspektasi Hasil | Status |
|---|---|---|---|---|
| M-01 | Background Location | Membuka aplikasi mobile & mengaktifkan GPS | Location ping terkirim otomatis tiap 5-10 menit | [ ] |
| M-02 | Geofence Presensi | Berada di dalam zona polygon KKN selama >= 2 jam | Status presensi tercatat `HADIR_VALID` | [ ] |
| M-03 | Pendampingan Warga | Mendaftarkan warga yang kesulitan teknologi via app | Warga terdaftar & otomatis ter-bind ke mahasiswa | [ ] |
| M-04 | Handover KKN | Menyerahkan data warga & batch QR ke mahasiswa periode baru | Record histori tersimpan di `kkn_handover_history` | [ ] |
| M-05 | Monitoring Dampingan | Memantau grafik kepatuhan warga dampingan | Flagging edukasi ulang muncul pada warga bermasalah | [ ] |

### 3.7 Role: DPL (DOSEN PEMBIMBING LAPANGAN)
| ID Test | Fitur / Modul | Skenario Pengujian | Ekspektasi Hasil | Status |
|---|---|---|---|---|
| D-01 | Monitoring Absensi | Melihat rekapitulasi kehadiran mahasiswa bimbingannya | Tampilan durasi & status hadir valid/di luar zona | [ ] |
| D-02 | Penilaian Aktivitas | Mengisi form assessment performa mahasiswa KKN | Nilai & catatan evaluasi tersimpan | [ ] |

### 3.8 Role: ADMIN KELURAHAN
| ID Test | Fitur / Modul | Skenario Pengujian | Ekspektasi Hasil | Status |
|---|---|---|---|---|
| AK-01 | Monitoring Scoping | Akses dashboard monitoring se-Kelurahan | Data terbatas pada wilayah Kelurahan bersangkutan | [ ] |
| AK-02 | Read-Only Guard | Mengirim request POST/PUT/DELETE via API | Sistem mengembalikan `HTTP 403 Forbidden` | [ ] |

### 3.9 Role: ADMIN KECAMATAN
| ID Test | Fitur / Modul | Skenario Pengujian | Ekspektasi Hasil | Status |
|---|---|---|---|---|
| AC-01 | Monitoring Scoping | Akses dashboard monitoring se-Kecamatan | Visualisasi data mencakup seluruh Kelurahan di Kecamatan | [ ] |
| AC-02 | Read-Only Guard | Mengirim request ubah data via API/UI | Akses ditolak dengan respon `HTTP 403 Forbidden` | [ ] |

### 3.10 Role: SUPER ADMIN
| ID Test | Fitur / Modul | Skenario Pengujian | Ekspektasi Hasil | Status |
|---|---|---|---|---|
| SA-01 | Akses Data Mentah | Mengakses menu Aktivitas Pemilahan Sampah (Audit Log) | Menampilkan log transaksi mentah seluruh kota | [ ] |
| SA-02 | Discrepancy Approval | Review & approval diskrepansi AI vs Manual | Status diskrepansi `RESOLVED` & poin ter-update | [ ] |
| SA-03 | System Configuration | Mengubah parameter global (Masa aktif bin, timeout AI) | Konfigurasi backend ter-update realtime | [ ] |
| SA-04 | Bulk QR Generator | Generate batch QR Code fisik & Export CSV/Excel | File batch QR terunduh dengan struktur data valid | [ ] |

---

## 4. Rencana Eksekusi & Laporan Testing

1. **Persiapan Data Testing**: Gunakan database dump `demo_data_bandung.sql` untuk pengujian data awal.
2. **Kriteria Kelulusan (Pass Criteria)**:
   - 100% Skenario Wajib (W-01 s/d SA-04) Lulus.
   - Tidak ada error `500 Internal Server Error` atau unhandled exception pada console browser / backend log.
   - Hak akses Read-Only Role (Admin Kelurahan & Kecamatan) terbukti terlindungi 100% dari aksi manipulasi data.
3. **Dokumentasi Hasil**: Lampirkan screenshot / screen recording untuk setiap skenario yang berhasil diuji pada laporan akhir QC.
