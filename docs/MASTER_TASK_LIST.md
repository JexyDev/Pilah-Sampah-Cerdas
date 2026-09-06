# 📋 MASTER TASK LIST — BERSEKA (BERSEKA)
> **1 dokumen, 4 bagian tim.** Setiap tim mengisi bagian masing-masing.
> Status: 🔴 Belum | 🟡 Sedang | 🟢 Selesai & Terverifikasi | ⚪ Sengaja Disembunyikan
> **Aturan 🟢:** Hanya boleh diisi jika sudah DITES SUNGGUHAN (bukan sekadar baca kode), data dari backend REAL, tidak ada kata "Tempat Sampah" tersisa.

---
---

# 📍 BAGIAN 1 — PROGRESS TRACKER (PIC: Developer Backend/Frontend)
> Diisi oleh developer. Kapan fitur selesai dikoding & deployed ke VPS staging.

| # | Role | Fitur | Status | PIC | API Endpoint | Selesai (Tanggal) | Catatan Developer |
|---|------|-------|--------|-----|-------------|------------------|------------------|
| **AUTH LINTAS ROLE** | | | | | | | |
| 1 | Semua | Login HP + Password | 🔴 | | POST /auth/login | | |
| 2 | Warga / KKN | Login HP + OTP WhatsApp | 🔴 | | POST /auth/request-otp + verify-otp | | |
| 3 | Semua | Refresh Token | 🔴 | | POST /auth/refresh | | |
| 4 | Semua | Logout & invalidate token | 🔴 | | POST /auth/logout | | |
| 5 | Semua | GET /auth/me — info user login | 🔴 | | GET /auth/me | | |
| **SUPER USER — WEB** | | | | | | | |
| 6 | SUPER USER | Dashboard aggregated (warga aktif / setoran total / kelompok KKN) | 🔴 | | GET /super-user/dashboard | | |
| 7 | SUPER USER | Manajemen Pengguna — list semua role | 🔴 | | GET /users | | |
| 8 | SUPER USER | Manajemen Pengguna — tambah user | 🔴 | | POST /auth/register | | |
| 9 | SUPER USER | Manajemen Pengguna — edit user | 🔴 | | PUT /users/:id | | |
| 10 | SUPER USER | Manajemen Pengguna — hapus/nonaktif user | 🔴 | | DELETE /users/:id | | |
| 11 | SUPER USER | Register Admin DLH | 🔴 | | POST /auth/register/admin-dlh | | |
| 12 | SUPER USER | Register Camat | 🔴 | | POST /auth/register/camat | | |
| 13 | SUPER USER | Register Lurah | 🔴 | | POST /auth/register/lurah | | |
| 14 | SUPER USER | Register RW | 🔴 | | POST /auth/register/rw | | |
| 15 | SUPER USER | Register RT | 🔴 | | POST /auth/register/rt | | |
| 16 | SUPER USER | Register DPL | 🔴 | | POST /auth/register/dpl | | |
| 17 | SUPER USER | QR Master — generate batch | 🔴 | | POST /super-user/bins/generate-qr | | |
| 18 | SUPER USER | QR Master — download PDF | 🔴 | | GET /super-user/bins/qr-master | | |
| 19 | SUPER USER | QR Master — replace bin BROKEN | 🔴 | | POST /super-user/bins/:id/replace | | |
| 20 | SUPER USER | QR Master — hapus bin permanen | 🔴 | | DELETE /super-user/bins/:id | | |
| 21 | SUPER USER | Reaktivasi bin kadaluarsa | 🔴 | | PUT /super-user/bins/:id/reactivate | | |
| 22 | SUPER USER | Update status bin manual (override) | 🔴 | | PUT /super-user/bins/:id/status | | |
| 23 | SUPER USER | KKN Handover (serah terima mahasiswa) | 🔴 | | POST /super-user/kkn/handover | | |
| 24 | SUPER USER | KKN Handover — lihat histori kronologis | 🔴 | | GET /super-user/kkn/handover-history | | |
| 25 | SUPER USER | Approval whitelist Mahasiswa KKN | 🔴 | | PATCH /auth/kkn/whitelist/:id | | |
| 26 | SUPER USER | Audit Trail log semua aksi kritis | 🔴 | | GET /super-user/audit-trail | | |
| 27 | SUPER USER | Ekspor data CSV/Excel (semua tabel utama) | 🔴 | | — (frontend) | | |
| **PIMPINAN (ADMIN DLH) — WEB** | | | | | | | |
| 28 | Admin DLH | Dashboard monitoring seluruh kota (read-only) | 🔴 | | GET /dashboard/summary | | |
| 29 | Admin DLH | Grafik tren timbulan per kelurahan | 🔴 | | GET /dashboard/analytics | | |
| 30 | Admin DLH | Dashboard KKN (view only) | 🔴 | | GET /kkn/dashboard | | |
| 31 | Admin DLH | Review setoran PENDING_REVIEW (diskrepansi AI) | 🔴 | | GET /dashboard/discrepancies | | |
| 32 | Admin DLH | Approve/Reject diskrepansi AI | 🔴 | | PUT /dashboard/discrepancies/:id/resolve | | |
| 33 | Admin DLH | readOnlyGuard — block POST/PUT/DELETE (kecuali diskrepansi) | 🔴 | | Middleware | | |
| **CAMAT — WEB** | | | | | | | |
| 34 | Camat | Dashboard monitoring 1 kecamatan (read-only) | 🔴 | | GET /dashboard/summary | | |
| 35 | Camat | Grafik compliance score per kelurahan | 🔴 | | GET /dashboard/analytics | | |
| 36 | Camat | readOnlyGuard — block semua write | 🔴 | | Middleware | | |
| **LURAH — WEB** | | | | | | | |
| 37 | Lurah | Dashboard monitoring 1 kelurahan (read-only) | 🔴 | | GET /dashboard/summary | | |
| 38 | Lurah | readOnlyGuard — block semua write | 🔴 | | Middleware | | |
| **TASKFORCE — WEB** | | | | | | | |
| 39 | Taskforce | Login & akses sesuai scope (scope perlu difinalkan tim) | 🔴 | | POST /auth/login | | ⚠️ Open issue — scope belum terdefinisi |
| **RW — WEB** | | | | | | | |
| 40 | RW | Login + auto-link ke RtRwArea | 🔴 | | POST /auth/login + middleware | | |
| 41 | RW | Dashboard statistik wilayah RW | 🔴 | | GET /rw/dashboard | | |
| 42 | RW | Daftar bin penuh (pending review) dari warga | 🔴 | | GET /rw/bins/pending | | |
| 43 | RW | Approve pengajuan bin penuh | 🔴 | | PUT /rw/bins/:id/approve | | |
| 44 | RW | Reject pengajuan bin penuh (alasan wajib) | 🔴 | | PUT /rw/bins/:id/reject | | |
| 45 | RW | Tandai bin BROKEN (nonaktif permanen) | 🔴 | | PUT /rw/bins/:id/broken | | |
| 46 | RW | Daftar bin tidak aktif >30 hari | 🔴 | | GET /rw/bins/inactive | | |
| 47 | RW | Verifikasi Petugas Residu — daftar pending | 🔴 | | GET /rw/petugas/pending | | |
| 48 | RW | Verifikasi Petugas Residu — approve/reject | 🔴 | | PUT /rw/petugas/:id/verify | | |
| 49 | RW | Monitoring setoran residu Petugas wilayahnya | 🔴 | | GET /rw/residu-monitoring | | |
| 50 | RW | Ide daur ulang warga — daftar pending | 🔴 | | GET /rw/ide | | |
| 51 | RW | Ide daur ulang — approve (+50 poin warga) | 🔴 | | PUT /rw/ide/:id/verify | | |
| 52 | RW | Fasilitas — lihat daftar (Loseda/Maggot/Bata/Bank Sampah) | 🔴 | | GET /rw/facilities | | |
| 53 | RW | Fasilitas — approve pendaftaran baru | 🔴 | | PUT /rw/facilities/:id/verify | | |
| 54 | RW | Fasilitas — input laporan mingguan material & panen | 🔴 | | POST /rw/facilities/:id/production | | |
| **RT — WEB** | | | | | | | |
| 55 | RT | Login + dashboard monitoring wilayah RT | 🔴 | | POST /auth/login + GET /rw/dashboard | | |
| **WARGA — MOBILE** | | | | | | | |
| 56 | Warga | Registrasi mandiri: nama + HP + password + wilayah berjenjang | 🔴 | | POST /auth/register/warga | | |
| 57 | Warga | Dropdown wilayah dari data REAL (Kec→Kel→RW→RT) | 🔴 | | GET /areas | | |
| 58 | Warga | Poin registrasi +10 otomatis di ledger | 🔴 | | — (service) | | |
| 59 | Warga | Login HP + Password | 🔴 | | POST /auth/login | | |
| 60 | Warga | Login HP + OTP WhatsApp | 🔴 | | POST /auth/request-otp + verify-otp | | |
| 61 | Warga | Aktivasi bin: scan QR → ACTIVE_BOUND (tanpa approval RW) | 🔴 | | POST /bins/scan | | |
| 62 | Warga | GPS direkam permanen saat aktivasi | 🔴 | | — (binService) | | |
| 63 | Warga | Maksimal 2 bin per warga (1 Organik + 1 Anorganik) | 🔴 | | — (validasi backend) | | |
| 64 | Warga | Poin +10 Warga + +10 Mahasiswa (jika dibantu KKN) — atomik | 🔴 | | — (point ledger) | | |
| 65 | Warga | Masa aktif bin 30 hari dari tanggal aktivasi | 🔴 | | — (cronService) | | |
| 66 | Warga | Foto sampah → AI klasifikasi (ORGANIC/NON_ORGANIC + confidence) | 🔴 | | POST /ai/classify | | |
| 67 | Warga | Scan QR bin — validasi jenis sampah cocok dengan jenis bin | 🔴 | | POST /bins/deposit | | |
| 68 | Warga | Validasi geofencing ≤10m dari lokasi rumah | 🔴 | | — (middleware) | | |
| 69 | Warga | Hitung poin: Berat×100×ConfidenceAI×0.9 | 🔴 | | — (formula binService) | | |
| 70 | Warga | Poin dicatat di ledger terpisah (redeemable: false) | 🔴 | | — (pointService) | | |
| 71 | Warga | Riwayat setoran: Kg dan Poin TERPISAH tampilannya | 🔴 | | GET /transactions/my | | |
| 72 | Warga | Laporan bin penuh: upload foto → notif push ke Petugas + RW | 🔴 | | POST /bins/:id/full-report | | |
| 73 | Warga | Marker merah di peta GIS setelah laporan bin penuh | 🔴 | | — (websocket/GIS) | | |
| 74 | Warga | Bin expired 30 hari → status TIDAK_AKTIF otomatis (cron) | 🔴 | | — (cronService) | | |
| 75 | Warga | Pengajuan reaktivasi bin expired → RW approve | 🔴 | | POST /bins/:id/reset-request | | |
| 76 | Warga | Leaderboard poin warga (all-time & periodik) dari data REAL | 🔴 | | GET /gamification/leaderboard | | |
| **MAHASISWA KKN — MOBILE** | | | | | | | |
| 77 | KKN | Registrasi via Admin/DPL: NIM + Prodi + Kelompok + DPL + Wilayah | 🔴 | | POST /auth/register/mahasiswa-kkn | | |
| 78 | KKN | Whitelist pending → Admin DLH approve | 🔴 | | PATCH /auth/kkn/whitelist/:id | | |
| 79 | KKN | Login HP + Password (NIM sebagai identifier) | 🔴 | | POST /auth/login | | |
| 80 | KKN | Dashboard individu: poin + presensi + warga binaan | 🔴 | | GET /kkn/dashboard | | |
| 81 | KKN | Dashboard kelompok: poin total + presensi | 🔴 | | GET /kkn/kelompok/me | | |
| 82 | KKN | Geofencing: status HIJAU (≤100m) / MERAH (>100m) | 🔴 | | GET /kkn/active-zone | | |
| 83 | KKN | Radius 100m presisi (sudah fix kknService.ts) | 🟢 | | — | 2026-08-05 | Sudah diperbaiki dari 5km → 100m |
| 84 | KKN | Akumulasi durasi dalam zona (target 2 jam/hari) | 🔴 | | POST /kkn/location-ping | | |
| 85 | KKN | Check-in absensi dalam zona | 🔴 | | POST /kkn/attendance/check-in | | |
| 86 | KKN | Bantu aktivasi bin warga: scan QR → data warga → GPS → ACTIVE_BOUND | 🔴 | | POST /kkn/warga/activate-bin | | |
| 87 | KKN | Poin +10 Mahasiswa atomik bersamaan aktivasi | 🔴 | | — (point ledger) | | |
| 88 | KKN | Auto-resolve wilayah RW/RT warga dari area penugasan mahasiswa | 🟢 | | — (kknService.ts) | 2026-08-05 | Auto-resolve RtRwArea implementasi selesai |
| 89 | KKN | Pengajuan sakit/izin: upload foto bukti + deskripsi | 🔴 | | POST /kkn/pengajuan-izin | | |
| 90 | KKN | Izin hanya terkirim ke DPL kelompok SENDIRI (scope ketat) | 🔴 | | — | | |
| 91 | KKN | Laporan Pemanfaatan Kreatif: upload laporan + foto | 🔴 | | POST /kkn/pemanfaatan-sampah | | |
| 92 | KKN | Laporan HANYA masuk ke DPL kelompok sendiri (tidak bocor) | 🔴 | | — (scope per kelompok ID) | | |
| 93 | KKN | Poin individu terakumulasi ke poin kelompok | 🔴 | | — | | |
| 94 | KKN | Leaderboard Mahasiswa individu (TERPISAH dari Leaderboard Warga) | 🔴 | | GET /gamification/leaderboard | | |
| 95 | KKN | Leaderboard Kelompok (terpisah dari leaderboard individu) | 🔴 | | — | | |
| 96 | KKN | Riwayat absensi individu | 🔴 | | GET /kkn/history | | |
| **DPL — WEB** | | | | | | | |
| 97 | DPL | Login HP + Password | 🔴 | | POST /auth/login | | |
| 98 | DPL | Dashboard kelompok bimbingan (filter wilayah & waktu) | 🔴 | | GET /dpl/dashboard | | |
| 99 | DPL | Hanya bisa lihat kelompok bimbingan sendiri (scope ketat) | 🔴 | | — (middleware query filter) | | |
| 100 | DPL | Review & approve/reject izin sakit mahasiswa bimbingan | 🔴 | | GET/PUT /dpl/leave-requests | | |
| 101 | DPL | Review laporan pemanfaatan kreatif dari mahasiswa bimbingan | 🔴 | | GET /dpl/pemanfaatan-reports | | |
| 102 | DPL | Beri feedback/komentar pada laporan | 🔴 | | PUT /dpl/pemanfaatan-reports/:id | | |
| 103 | DPL | Form pencatatan aktivitas bersama (bukan penilaian) | 🔴 | | POST /dpl/activity-log | | |
| 104 | DPL | Peta Sebaran — DI-HIDE (bukan bug) | ⚪ | | — | — | Sengaja disembunyikan |
| 105 | DPL | Fitur Penilaian Formal — DI-HIDE (bukan bug) | ⚪ | | — | — | Sengaja disembunyikan |
| **PETUGAS RESIDU — MOBILE + WEB** | | | | | | | |
| 106 | Petugas | Registrasi oleh Admin/RW (bukan self-register) | 🔴 | | POST /auth/register/petugas-residu | | |
| 107 | Petugas | 1 RW = 1 Petugas Residu (constraint unik di DB) | 🔴 | | — (schema prisma) | | |
| 108 | Petugas | Login HP + Password | 🔴 | | POST /auth/login | | |
| 109 | Petugas | MODE HULU: lihat jadwal bin warga yang perlu dijemput | 🔴 | | GET /residu/schedule | | |
| 110 | Petugas | MODE HULU: upload foto + input berat aktual (timbangan fisik) | 🔴 | | POST /residu/submit | | |
| 111 | Petugas | Rule of Discrepancy: beda vs AI (>90% conf) → PENDING_REVIEW | 🔴 | | — (residuService) | | |
| 112 | Petugas | Eskalasi otomatis jika tidak lapor dalam window: RW→Lurah→Camat→DLH | 🔴 | | — (cronService) | | |
| 113 | Petugas | MODE HILIR: submit setoran dari Pengangkut — foto + berat TANPA QR | 🔴 | | POST /residu/submit-hilir | | |
| 114 | Petugas | Flag source HULU / HILIR dibedakan di laporan | 🔴 | | — | | |
| 115 | Petugas | KPI: (0.6 × Ketepatan_Waktu) + (0.4 × Akurasi_vs_AI) tampil | 🔴 | | GET /residu/kpi | | |
| 116 | Petugas | Web monitoring: dashboard data sendiri (read-only) | 🔴 | | GET /rw/residu-monitoring | | |
| **LINTAS ROLE — ISU BESAR** | | | | | | | |
| 117 | Sistem | Migrasi format HP +62 → 08 di seluruh DB + 43 data mahasiswa | 🔴 | | Script SQL migrasi | | ⚠️ Breaking change |
| 118 | Sistem | Hapus sisa role Pengangkut (dispatch_tasks / routing / UI) | 🔴 | | Cleanup total | | |
| 119 | Sistem | QR auto-active: audit dampak ke RW Portal approval bin | 🔴 | | — | | Poin berubah timing |
| 120 | Sistem | Semua dashboard connect ke data REAL (bukan dummy) | 🔴 | | Semua GET /dashboard/* | | ⚠️ Prioritas tinggi |
| 121 | Sistem | Bersihkan semua kata "Tempat Sampah" dari UI / API response / notifikasi | 🔴 | | — | | |
| 122 | Sistem | Buku Panduan per role tersedia di landing page | 🔴 | | — | | |
| 123 | Sistem | Zero NIK — tidak ada sisa NIK di DB / API / UI | 🔴 | | — | | |

---
---

# 🔍 BAGIAN 2 — QC / TESTING (PIC: Tim QA)
> Diisi oleh Tim QC. Setiap fitur WAJIB diuji secara fungsional (bukan baca kode). Isi kolom Bukti dengan link screenshot/log.

| # | Role | Skenario Uji | Tipe Test | Expected Result | Actual Result | Status | Severity | PIC QC | Bukti (Screenshot/Log) | Tanggal Tes |
|---|------|-------------|-----------|-----------------|---------------|--------|----------|--------|----------------------|------------|
| **AUTH** | | | | | | | | | | |
| A-01 | Semua | Login dengan kredensial valid | Happy Path | Token JWT diterima, redirect dashboard | | 🔴 | Critical | | | |
| A-02 | Semua | Login password salah 3x berturut | Negative | Error message jelas, tidak crash | | 🔴 | High | | | |
| A-03 | Semua | Token expired — refresh otomatis | Edge Case | Token baru diterima tanpa re-login | | 🔴 | High | | | |
| A-04 | Semua | Logout — token tidak bisa dipakai lagi | Security | 401 pada request berikutnya | | 🔴 | Critical | | | |
| A-05 | Warga | Registrasi dengan HP duplikat | Negative | Error 409: nomor HP sudah terdaftar | | 🔴 | Critical | | | |
| A-06 | Warga | Form registrasi — tidak ada field NIK | Security | Field NIK tidak ada di UI manapun | | 🔴 | Critical | | | |
| **READ-ONLY GUARD** | | | | | | | | | | |
| G-01 | Admin DLH | POST ke endpoint non-diskrepansi | Security | 403 Forbidden | | 🔴 | Critical | | | |
| G-02 | Camat | PUT data apapun | Security | 403 Forbidden | | 🔴 | Critical | | | |
| G-03 | Lurah | DELETE data apapun | Security | 403 Forbidden | | 🔴 | Critical | | | |
| G-04 | Admin DLH | POST approve diskrepansi AI (diizinkan) | Happy Path | 200 OK | | 🔴 | Critical | | | |
| **SCOPE / ISOLASI DATA** | | | | | | | | | | |
| S-01 | DPL | DPL A akses data kelompok DPL B | Security | 403 Forbidden | | 🔴 | Critical | | | |
| S-02 | KKN | Mahasiswa kelompok A akses data kelompok B | Security | 403 Forbidden | | 🔴 | Critical | | | |
| S-03 | KKN | Laporan pemanfaatan tidak bocor ke kelompok lain | Security | Data tidak tampil di DPL/kelompok lain | | 🔴 | Critical | | | |
| S-04 | Lurah | Lihat data kelurahan lain | Security | 403 atau data filtered | | 🔴 | High | | | |
| S-05 | Camat | Lihat data kecamatan lain | Security | 403 atau data filtered | | 🔴 | High | | | |
| **WARGA — SKENARIO PENYETORAN** | | | | | | | | | | |
| W-01 | Warga | Foto sampah → AI classify → ORGANIC | Happy Path | confidence score diterima, poin dihitung | | 🔴 | Critical | | | |
| W-02 | Warga | Confidence AI <50% — response sistem | Edge Case | Ditolak atau warning eksplisit | | 🔴 | High | | | |
| W-03 | Warga | Scan QR bin Organik dengan sampah Anorganik | Negative | Ditolak: jenis tidak cocok | | 🔴 | Critical | | | |
| W-04 | Warga | GPS >10m dari rumah saat setor | Negative | Ditolak: lokasi tidak sesuai | | 🔴 | Critical | | | |
| W-05 | Warga | Scan QR bin BROKEN | Negative | Error: bin tidak aktif / rusak | | 🔴 | Critical | | | |
| W-06 | Warga | Scan QR bin TIDAK_AKTIF (expired) | Negative | Error: bin kadaluarsa, minta reaktivasi | | 🔴 | High | | | |
| W-07 | Warga | Formula poin: Berat×100×Conf×0.9 dihitung benar | Happy Path | Poin sesuai hitungan manual | | 🔴 | Critical | | | |
| W-08 | Warga | Coba buat bin ke-3 (sudah punya 2) | Negative | Ditolak: maksimal 2 bin | | 🔴 | High | | | |
| W-09 | Warga | Bin expired >30 hari — status berubah otomatis | Edge Case | Status TIDAK_AKTIF di DB | | 🔴 | High | | | |
| W-10 | Warga | Laporan bin penuh — notif sampai ke Petugas + RW | Happy Path | Push notification diterima | | 🔴 | High | | | |
| **MAHASISWA KKN** | | | | | | | | | | |
| K-01 | KKN | GPS dalam 100m posko — status HIJAU | Happy Path | Indikator hijau, durasi akumulasi jalan | | 🔴 | Critical | | | |
| K-02 | KKN | GPS >100m posko — status MERAH | Happy Path | Indikator merah, durasi reset | | 🔴 | Critical | | | |
| K-03 | KKN | GPS fake / simulasi | Security | Absensi tidak diterima | | 🔴 | High | | | |
| K-04 | KKN | Bantu aktivasi bin — poin +10 mahasiswa tercatat | Happy Path | point_history bertambah | | 🔴 | Critical | | | |
| K-05 | KKN | Pengajuan izin terkirim ke DPL yang benar | Happy Path | Notif DPL kelompok sendiri | | 🔴 | Critical | | | |
| K-06 | KKN | Pengajuan izin tidak terkirim ke DPL kelompok lain | Security | DPL lain tidak dapat notif | | 🔴 | Critical | | | |
| **PETUGAS RESIDU** | | | | | | | | | | |
| P-01 | Petugas | Submit setoran dalam window 06:00-08:00 | Happy Path | Diterima, tidak ada penalti KPI | | 🔴 | High | | | |
| P-02 | Petugas | Tidak lapor sampai 08:05 | Edge Case | Eskalasi notif ke RW | | 🔴 | High | | | |
| P-03 | Petugas | Berat input beda signifikan vs AI (>90% conf) | Edge Case | Status setoran → PENDING_REVIEW | | 🔴 | Critical | | | |
| P-04 | Petugas | Submit hilir tanpa QR (hanya foto + berat) | Happy Path | Tersimpan dengan flag HILIR | | 🔴 | High | | | |
| **LINTAS SISTEM** | | | | | | | | | | |
| L-01 | Sistem | Tidak ada kolom NIK di API response mana pun | Security | Tidak ada field nik/NIK | | 🔴 | Critical | | | |
| L-02 | Sistem | Tidak ada kata "Tempat Sampah" di UI/notifikasi | QC Text | Zero hasil pencarian "Tempat Sampah" | | 🔴 | Medium | | | |
| L-03 | Sistem | Dashboard menampilkan data REAL (bukan dummy/0) | Data | Grafik bergerak sesuai data DB | | 🔴 | Critical | | | |
| L-04 | Sistem | Format HP: sistem menerima 08xx (bukan hanya +62) | Regression | Login/register dengan 08xx berhasil | | 🔴 | Critical | | | |
| L-05 | Sistem | Tidak ada sisa fitur/UI Pengangkut di BERSEKA | Cleanup | Zero elemen Pengangkut di UI & route | | 🔴 | Medium | | | |

---
---

# 🎨 BAGIAN 3 — UI / UX (PIC: Tim UI/UX)
> Diisi oleh Tim UI/UX. Review tampilan, konsistensi desain, usability, dan kelengkapan state.

| # | Role / Halaman | Item Pengecekan | Platform | Status | PIC UX | Catatan / Temuan | Tanggal Cek |
|---|----------------|----------------|----------|--------|--------|-----------------|------------|
| **SISTEM DESAIN GLOBAL** | | | | | | | |
| U-01 | Semua | Design token konsisten: warna, font, spacing di semua halaman | Web + Mobile | 🔴 | | | |
| U-02 | Semua | Tidak ada placeholder image di production | Web + Mobile | 🔴 | | | |
| U-03 | Semua | Typography: nama font resmi teraplikasi (bukan default browser/system) | Web + Mobile | 🔴 | | | |
| U-04 | Semua | Responsive: tampilan tidak rusak di mobile web (min 375px) | Web | 🔴 | | | |
| **3 STATE WAJIB PER HALAMAN** | | | | | | | |
| U-05 | Semua | Loading State: skeleton / spinner tampil saat fetch data | Web + Mobile | 🔴 | | | |
| U-06 | Semua | Empty State: tampilan bermakna saat data kosong | Web + Mobile | 🔴 | | | |
| U-07 | Semua | Error State: pesan error jelas + tombol retry saat API gagal | Web + Mobile | 🔴 | | | |
| **AUTH HALAMAN** | | | | | | | |
| U-08 | Semua | Form login: label jelas, placeholder informatif, tombol submit visible | Web + Mobile | 🔴 | | | |
| U-09 | Semua | Pesan error login: teks jelas (bukan kode teknis) | Web + Mobile | 🔴 | | | |
| U-10 | Warga / KKN | Alur OTP WhatsApp: instruksi langkah demi langkah jelas | Mobile | 🔴 | | | |
| **REGISTRASI WARGA** | | | | | | | |
| U-11 | Warga | Dropdown wilayah berjenjang (Kec→Kel→RW→RT) muncul berurutan | Mobile | 🔴 | | | |
| U-12 | Warga | Form tidak memiliki field NIK (zero NIK policy) | Mobile | 🔴 | | | |
| U-13 | Warga | Validasi form real-time (merah jika error, hijau jika valid) | Mobile | 🔴 | | | |
| U-14 | Warga | Konfirmasi registrasi berhasil + poin +10 tampil | Mobile | 🔴 | | | |
| **PENYETORAN SAMPAH (WARGA MOBILE)** | | | | | | | |
| U-15 | Warga | Alur foto → AI → scan QR ≤3 langkah, mudah dipahami warga non-teknis | Mobile | 🔴 | | | |
| U-16 | Warga | Hasil AI klasifikasi tampil visual jelas (label + confidence bar) | Mobile | 🔴 | | | |
| U-17 | Warga | Feedback visual saat mismatch jenis sampah vs bin | Mobile | 🔴 | | | |
| U-18 | Warga | Sukses setor: animasi/konfirmasi + poin yang didapat tampil | Mobile | 🔴 | | | |
| U-19 | Warga | Riwayat setoran: Kg dan Poin ditampilkan TERPISAH dan terbaca jelas | Mobile | 🔴 | | | |
| **GEOFENCING — KKN MOBILE** | | | | | | | |
| U-20 | KKN | Indikator zona: visual HIJAU / MERAH besar dan jelas (bisa dilihat di sinar matahari) | Mobile | 🔴 | | | |
| U-21 | KKN | Durasi akumulasi tampil sebagai progress (bukan hanya angka mentah) | Mobile | 🔴 | | | |
| U-22 | KKN | Transisi animasi saat masuk/keluar zona | Mobile | 🔴 | | | |
| **DASHBOARD WEB** | | | | | | | |
| U-23 | SUPER USER | Dashboard: widget ringkasan tidak terlihat kosong (data real) | Web | 🔴 | | | |
| U-24 | SUPER USER | Grafik: label sumbu X/Y jelas, legenda ada, tooltips informatif | Web | 🔴 | | | |
| U-25 | SUPER USER | Tabel pengguna: kolom tidak terpotong di layar 1366px | Web | 🔴 | | | |
| U-26 | SUPER USER | Pagination tabel berfungsi dan tidak lompat ke atas | Web | 🔴 | | | |
| U-27 | RW | Tombol approve/reject: warna berbeda jelas (hijau/merah) | Web | 🔴 | | | |
| U-28 | RW | Modal konfirmasi muncul sebelum aksi destructive (reject/broken) | Web | 🔴 | | | |
| **NOTIFIKASI** | | | | | | | |
| U-29 | Semua | Push notification teks: tidak ada kata "Tempat Sampah" | Mobile + Web | 🔴 | | | |
| U-30 | Semua | Notifikasi in-app: bisa di-dismiss, badge count akurat | Mobile + Web | 🔴 | | | |
| **AKSESIBILITAS** | | | | | | | |
| U-31 | Semua | Ukuran font minimum 14sp (mobile) / 14px (web) — ramah lansia | Mobile + Web | 🔴 | | | |
| U-32 | Semua | Tombol minimum touch area 44×44dp (mobile) | Mobile | 🔴 | | | |
| U-33 | Semua | Kontras teks vs background ≥ 4.5:1 (WCAG AA) | Mobile + Web | 🔴 | | | |
| **KONTEN & COPY** | | | | | | | |
| U-34 | Semua | Zero kata "Tempat Sampah" di seluruh UI (gunakan "tempat sampah") | Web + Mobile | 🔴 | | | |
| U-35 | Semua | Teks error/informasi dalam Bahasa Indonesia yang mudah dipahami | Web + Mobile | 🔴 | | | |
| U-36 | Semua | Nama label field konsisten antar halaman | Web + Mobile | 🔴 | | | |

---
---

# 📝 BAGIAN 4 — NOTULENSI & MANAJEMEN REVISI (PIC: Tim Notulensi / PM)
> Diisi oleh Tim Notulensi. Catat setiap keputusan, revisi, dan dampaknya ke kode.

## 4A. Log Keputusan (Decision Log)

| # | Tanggal | Topik Keputusan | Keputusan Final | Diputuskan Oleh | Dampak ke Kode | Status Implementasi | PIC Developer |
|---|---------|----------------|----------------|-----------------|---------------|--------------------|--------------| 
| D-01 | | QR auto-active tanpa approval RW | Bin langsung ACTIVE_BOUND saat scan, tanpa tunggu RW | | binService + kknService | 🔴 | |
| D-02 | 2026-08-05 | Geofencing radius posko | 100 meter presisi (bukan 5km) | Developer | kknService.ts + mobile | 🟢 Selesai | |
| D-03 | | Format HP login | Sistem menerima +62 dan 08 | | authService normalisasi | 🔴 | |
| D-04 | | Peta Sebaran DPL | DI-HIDE sementara (bukan bug) | | Frontend hide component | 🔴 | |
| D-05 | | Fitur Penilaian Formal DPL | DI-HIDE sementara (bukan bug) | | Frontend hide component | 🔴 | |
| D-06 | | Role Pengangkut | Dihapus total dari BERSEKA (punya app sendiri) | | Cleanup seluruh sistem | 🔴 | |
| D-07 | | Scope Taskforce | Belum terdefinisi — perlu keputusan tim | | — | ⚠️ Open | |
| D-08 | | Approval bin oleh RW | Jadi obsolete karena auto-active — repurpose atau hapus? | | rwRoutes + frontend | 🔴 | |

---

## 4B. Log Revisi / Perubahan Fitur

| # | Tanggal | Fitur yang Direvisi | Deskripsi Perubahan | Diajukan Oleh | Dampak ke DB/API/UI | Prioritas | Status | PIC Dev |
|---|---------|--------------------|--------------------|---------------|---------------------|-----------|--------|---------|
| R-01 | 2026-08-05 | Geofencing radius | 5000m → 100m | | kknService.ts | P1 | 🟢 | |
| R-02 | | Bin aktivasi flow | Tambah approval RW → auto-active (tanpa approval) | | binService + kknService + rwRoutes | P1 | 🔴 | |
| R-03 | | NIK removal | Hapus total NIK dari semua layer | | DB + API + UI + Mobile | P1 | 🔴 | |
| R-04 | | Format HP migrasi | +62 → 08 di seluruh DB (43 data mahasiswa) | | Script SQL + authService | P1 | 🔴 | |
| R-05 | | Scope notifikasi | Global → per-UserID & per-Role | | notificationService | P1 | 🟢 | |
| R-06 | | Laporan Pemanfaatan KKN | Fitur baru: scope ketat per kelompok | | kknService + dplRoutes | P1 | 🔴 | |
| R-07 | | Istilah "Tempat Sampah" | Rename ke "tempat sampah" di seluruh sistem | | UI + API response + notifikasi | P2 | 🔴 | |

---

## 4C. Isu Terbuka (Open Issues)

| # | Isu | Dampak | Deadline | PIC | Status |
|---|-----|--------|---------|-----|--------|
| I-01 | Scope & fungsi Taskforce belum terdefinisi | Fitur tidak bisa dibuat | — | Tim | 🔴 Open |
| I-02 | Approval bin RW menjadi obsolete pasca auto-active — repurpose atau hapus? | RW Portal berubah fungsi | — | Tim | 🔴 Open |
| I-03 | Kapan poin +10 diberikan sekarang? (dulu saat RW approve, sekarang saat aktivasi) | Logika poin berubah | Segera | Dev | 🔴 Open |
| I-04 | Semua dashboard masih dummy — tidak connect ke data real | Tidak bisa demo ke stakeholder | Sebelum launch | Dev | 🔴 Open |
| I-05 | Script migrasi HP +62 → 08 belum dibuat | Data lama tidak bisa login dengan format 08 | Segera | Dev | 🔴 Open |
| I-06 | Buku Panduan per role belum dibuat | Warga/mahasiswa tidak tahu cara pakai | Sebelum launch | Tim | 🔴 Open |

---

## 4D. Ringkasan Eksekutif (Update setiap ada progress signifikan)

| Metrik | Nilai |
|--------|-------|
| **Total Task Bagian 1 (Progress Tracker)** | 123 item |
| **Total Test Case Bagian 2 (QC)** | 35 skenario |
| **Total Item Bagian 3 (UI/UX)** | 36 item |
| **Open Issues** | 6 isu terbuka |
| **🟢 Selesai & Terverifikasi** | 2 item (geofencing 100m + auto-resolve RW) |
| **🔴 Belum dimulai** | Mayoritas |
| **⚪ Sengaja disembunyikan** | 2 fitur DPL |
| **Update terakhir** | 2026-08-05 |
| **3 Isu Paling Berisiko sebelum Launch** | (1) Dashboard masih dummy · (2) Migrasi HP +62→08 · (3) RW Portal pasca auto-active bin |
| **Urutan Prioritas Pengerjaan** | I-04 → I-05 → I-02 → I-01 → I-06 |
