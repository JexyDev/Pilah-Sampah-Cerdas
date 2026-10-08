# 📊 BERSEKA - MASTER PROJECT STATUS & LIVING PROGRESS

**Terakhir Diperbarui:** 06 Oktober 2026  
**Otoritas:** Tech Lead & Lead Fullstack Developer  
**Status Proyek:** Active Production & Continuous Enhancement  
**Dokumen Referensi Inti:**  
- 📜 [Konstitusi Paten DPL](DPL_PATEN_CONSTITUTION.md)
- 🔀 [Git Workflow Standar](GIT_WORKFLOW.md)
- 📱 [Spesifikasi API Mobile](MOBILE_API_DOCS.md)
- 📂 Arsip Laporan Historis: [`docs/archive/`](archive/)

---

## 1. Ringkasan Eksekutif & Arsitektur Sistem

**BERSEKA** adalah platform terintegrasi untuk pengelolaan sampah perkotaan, pemilahan limbah residu, dan tata kelola program Kuliah Kerja Nyata (KKN) Tematik di wilayah Coblong (Sadang Serang, Sekeloa, Dago, Lebak Siliwangi, Cipaganti, Lebak Gede).

### Arsitektur Teknologi
* **Backend API (`apps/api`)**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL (VPS Live: `157.10.252.252:3000`).
* **Web Frontend (`apps/web`)**: React 18, Vite, TypeScript, TailwindCSS.
* **Mobile App (`mobile`)**: Flutter / Dart (Didukung target iOS & Android).

---

## 2. Invarian Paten & Aturan Tata Kelola (Anti-Halusinasi AI)

Setiap pengembang maupun asisten AI wajib mematuhi 3 pilar perlindungan sistem berikut:

### A. 🔒 Role DPL (Dosen Pembimbing Lapangan) - Status PATEN / IMMUTABLE
* **Scoping Strict**: DPL hanya dapat melihat dan menilai mahasiswa di dalam `KelompokKkn` miliknya (`getKelompokWhere`).
* **Hak Mutasi Eksklusif**: Keputusan izin/sakit mahasiswa (`/dpl/approvals/:requestId/decide`) dan penilaian program kerja (`/dpl/program-kerja/:id/decision`) adalah hak eksklusif DPL & Panitia Taskforce. Role Pimpinan dan MPL berstatus **READ-ONLY (403 Forbidden)**.
* **Logbook Edit Pasca-ACC**: Jika mahasiswa mengedit logbook yang sudah di-ACC, status otomatis kembali ke `MENUNGGU_VERIFIKASI_DPL` tanpa merusak saldo poin (tetap 3 PTS tanpa duplikasi).
* **Threshold Kelulusan**: Nilai lulus minimum KKN adalah **65**.
* **Proteksi File**: Dilarang memodifikasi file DPL (`dplService.ts`, `dplRoutes.ts`, `dplController.ts`, `penilaianKknService.ts`, `pages/dpl/*`) tanpa konfirmasi eksplisit dan wajib menjalankan test suite:
  ```bash
  npx vitest run apps/api/src/controllers/dplApproval.test.ts apps/api/src/services/logbookVerifikasi.test.ts apps/api/src/services/penilaianKknRoleGuard.test.ts
  ```

### B. 🛡️ Perlindungan Database VPS & Larangan Seeder Dummy
* **Anti-Dummy Seed**: Dilarang keras menjalankan skrip seeder apa pun ke database VPS (`157.10.252.252` / `psc_db`) yang berisi data operasional riil.
* **Skrip Terproteksi**: Semua seeder lokal wajib dicegat modul `vpsSafetyGuard`.
* **Prisma Rule**: Di VPS hanya diizinkan `npx prisma migrate deploy`. **Dilarang memakai `prisma db push`**.
* **Golden Backup**: Wajib backup dump sebelum intervensi skema (`npm run backup:full`).

### C. 🌿 Standar 3-Tier Git-Flow
* Alur integrasi: `[feat/* / fix/*] ──PR──> [development] ──PR──> [staging] ──PR──> [main]`.
* Larangan push langsung ke `staging` atau `main`.
* Selalu jalankan type-check dan linter sebelum merge (`npm run build` / `tsc --noEmit`).

---

## 3. Matriks Peran Pengguna (Role Matrix)

| Peran (Role) | Platform Akses | Tanggung Jawab Utama | Batasan Khusus |
| :--- | :---: | :--- | :--- |
| **DPL** | Web Desktop (NIP/HP) | Verifikasi logbook, izin/sakit, penilaian akhir KKN | Terisolasi per kelompok bimbingan |
| **Mahasiswa KKN** | Mobile (iOS / Android) | Presensi mandiri, logbook kegiatan harian, pendampingan warga | Geofencing posko & jadwal ketat |
| **Petugas Residu** | Mobile | Pencatatan pengangkutan sampah residu, penimbangan | Terikat jadwal rute TPS |
| **MPL (Mitra)** | Web Desktop | Monitoring kebersihan lingkungan & progres wilayah | Read-only untuk nilai & persetujuan DPL |
| **Pimpinan** | Web Desktop | Dashboard eksekutif, rekap analitik, GIS monitoring | Read-only untuk mutasi izin, nilai, dan Posko KKN |
| **Panitia Taskforce**| Web Desktop | Supervisi teknis KKN, intervensi kendala darurat | Hak approval backup untuk DPL |
| **Admin / Superuser**| Web Desktop | Konfigurasi master data, manajemen akun & wilayah | Full access berizin khusus |

---

## 4. Status Fitur & Pencapaian Utama (Resolved Milestones)

- [x] **Presensi Mandiri Mahasiswa KKN (V2)**:
  - Validasi radius geofencing posko (50-100 meter dinamis).
  - Cutoff waktu otomatis (pagi s.d. 18:00 WIB).
  - Fitur pengajuan izin / sakit dengan lampiran surat dokter.
- [x] **Alur Verifikasi Logbook & Gamifikasi Poin**:
  - Poin awal logbook: 3 PTS saat submit.
  - Reset status saat koreksi pasca-ACC tanpa duplikasi poin.
  - Perhitungan poin pembimbingan DPL (6 PTS per logbook aktivitas).
- [x] **Sistem Penilaian Akhir KKN & Nilai Konversi**:
  - Formula terpadu: Nilai Etika, Kehadiran, Logbook, Program Kerja, dan Laporan Akhir.
  - Passing grade standar: 65 (Nilai Mutu C / Lulus).
- [x] **Modul Pendampingan Warga & Pengosongan Tempat Sampah**:
  - Integrasi barcode/QR multi-RW di Coblong.
  - Integrasi endpoint mobile Flutter untuk pencatatan warga dampingan.
  - **Pembatalan Granular Per-Bin (`REP-TECH/BERSEKA-BIN/2026-10/006`)**: Endpoint `PUT /api/v1/bins/:binId/cancel-reset` untuk membatalkan pengosongan per tempat sampah secara independen tanpa memicu pembatalan massal, proteksi penolakan ketat (`NO_ACTIVE_RESET_REQUEST`) untuk tempat sampah tanpa pengajuan aktif, dan penyertaan `activeResetRequestId` di `getMyBins`.
  - **Poin Validasi Pengosongan Petugas Pemilahan (+5 PTS)**: Memperbaiki kueri anti-duplikasi berbasis RequestID (sebelumnya terblokir qrCode berulang), menyertakan properti `pointsEarned` pada respon `/bins/reset/:id/approve` dan `reviewResetRequest`, serta penanganan error penulisan point history.
- [x] **Sinkronisasi Profil Petugas Pemilahan / Petugas Residu (`PUT /api/v1/auth/me`)**:
  - Pemisahan nomor telepon akun login utama (`User.phone`) dan WhatsApp personil lapangan (`PetugasResidu.noWa`).
  - Sinkronisasi pembaruan nama asli personil (`PetugasResidu.nama` via payload `namaAsli` / `namaPersonil`), `noWa`, `namaDisplay`, dan `assignedZone` ke tabel `petugas_residu`.
  - Penyertaan relasi `petugasProfile` serta atribut langsung `namaAsli`, `namaPersonil`, dan `noWa` pada payload respon `PUT /api/v1/auth/me`, `GET /api/v1/auth/me`, dan `/auth/login` demi kompatibilitas penuh klien Mobile & Web Dashboard.
- [x] **Validasi & Penanganan Konflik Edit Profil Warga (`PUT /api/v1/auth/me` & `PUT /api/v1/auth/profile`)**:
  - Penanganan elegan error duplikasi nomor telepon (`P2002` / `PHONE_ALREADY_IN_USE`): mengembalikan HTTP 409 Conflict (`errorCode: "PHONE_ALREADY_EXISTS"`, `code: "PHONE_ALREADY_EXISTS"`) dengan pesan informatif kepada pengguna alih-alih HTTP 500.
  - Validasi panjang karakter nama lengkap (minimal 2 dan maksimal 255 karakter) dan format digit nomor telepon (9 hingga 15 digit angka) dengan status HTTP 400 Bad Request (`VALIDATION_ERROR`).
  - Normalisasi otomatis nomor telepon format lokal (`08xxx`, `628xxx`) ke standar E.164 (`+628xxx`).
  - Deployment zero-downtime rolling reload ke cluster PM2 VPS (`157.10.252.252`) tanpa mengganggu proses operasional mahasiswa KKN dan warga aktif.
- [x] **Penyelarasan Aturan Check-Out KKN (30 Menit Setelah Check-In)**:
  - Mengoreksi aturan pembatasan presensi pulang KKN dari yang semula terkunci hingga H-30 menit jam selesai jadwal (misal 15:30 WIB) menjadi **dapat dilakukan 30 menit setelah jam masuk (check-in)**.
  - Mahasiswa yang telah berkegiatan >= 30 menit sejak klik tombol masuk dapat melakukan check-out kapan saja (status otomatis dinilai: `HADIR_MEMENUHI` jika durasi kerja >= target wajib, atau `HADIR_TIDAK_MEMENUHI` jika kurang dari target wajib).
  - Menyertakan payload `jedaLogs` pada endpoint `kegiatanAktif` agar timer web mobile sinkron dan akurat dengan penghitungan backend.
  - Menghilangkan bug masking error di `MahasiswaPresensiMobile.tsx` agar respon `EARLY_CHECKOUT_RESTRICTED` (< 30 menit dari jam masuk) ditampilkan secara jelas dan transparan.
- [x] **Audit & Rekonsiliasi Presensi Lapangan Sofie Aprilia Putri (`REP-AUDIT/KKN-ATT/2026-10/017`)**:
  - Penyelarasan presensi 06 Oktober 2026 ke rentang 06.50 – 13.30 WIB (400 menit / 6 Jam 40 Menit) dengan status `HADIR_MEMENUHI`.
  - Sinkronisasi modul `PresensiMandiri` (status `SELESAI`) dan pembuatan entri `LogbookKkn` Pekan Ke-4 (Proker #2: Sosialisasi IoT & GASLAH).
  - Penyesuaian reward poin harian penuh (+10 PTS) sehingga akumulasi poin akun mencapai **176 PTS**.
- [x] **Audit & Rekonsiliasi Presensi Launa Shafa Nadira (NIM: 21224145, Kelompok 4 Dago)**:
  - Penanganan kasus salah switch akun (login dengan akun Naufal Rabani NIM 21224153 di pagi hari).
  - Sinkronisasi presensi harian 06 Oktober 2026: 07:00 – 16:00 WIB (540 menit / 9 jam penuh) dengan status `HADIR_MEMENUHI`.
  - Integrasi modul `PresensiMandiri` (status `SELESAI`) dan penyesuaian logbook KKN ke rentang 07:00 – 16:00 WIB (`MENUNGGU_VERIFIKASI_DPL`).
  - Total jam kumulatif tercapai: **88 Jam 06 Menit (5.286 Menit)**, setara dengan rekan sekelompoknya Naufal Rabani (87 Jam 59 Menit / ~88 Jam). Saldo poin: **157 PTS**. Akun rekan Naufal terverifikasi 100% aman dan utuh.
- [x] **Dashboard Pimpinan & GIS Tata Kelola Sampah**:
  - Visualisasi sebaran timbulan sampah dan progres KKN per kelurahan.
- [x] **Standarisasi Kolom Waktu / Timestamp Tabel Tempat Sampah Dasbor (`Dashboard.tsx`)**:
  - Penambahan kolom `Waktu` (Tanggal + Jam WIB) pada widget ringkasan *Data Tempat Sampah Terbaru* di dasbor utama (`apps/web/src/pages/Dashboard/Dashboard.tsx`).
  - Penambahan visualisasi waktu pembaruan / aktivasi pada modal detail tempat sampah cerdas (`selectedBinForDetail`).
  - Penyelarasan format tampilan dengan standar audit QC (menampilkan `d Mmm yyyy` dan `HH.mm WIB` berbasis data riil `updatedAt` / `verifiedAt` / `createdAt`).
  - Lulus 100% Quality Gate (type-check 0 error & 30/30 DPL Vitest Suite pass) dan telah dirilis melalui pipeline 3-Tier Git-Flow ke branch `development`, `staging`, dan `main`.
- [x] **Audit & Perbaikan Deduplikasi Sesi Hadir Mahasiswa KKN (`kknAttendanceService.ts` & `MahasiswaMobileHome.tsx`)**:
  - **Akar Masalah**: Sesi hadir mahasiswa (seperti Rafly Isyandie NIM 21224140 dan rekan sekelompok) melonjak ke 21 (seharusnya 16 sesuai 16 logbook) akibat kueri `/timesheet/summary` menghitung record mentah `ActivityAttendance` tanpa deduplikasi tanggal kalender. Sinkronisasi ganda/bridge (`GPS_ACTIVITY` dan `MANDIRI_BRIDGE`) pada tanggal yang sama (03/09, 05/09, 08/09, 11/09, 29/09) menyebabkan `fulfilledTargetDays` dan `totalDaysAttended` terhitung dua kali lipat per tanggal tersebut, menimbulkan kesan bahwa sesi hadir mahasiswa lain yang tidak memiliki duplikat menjadi "anjlok" (13–15).
  - **Solusi Backend**: Menerapkan deduplikasi harian cerdas berbasis tanggal kalender WIB (`dateKey`) pada `kknAttendanceService.getTimesheetSummary`. Satu tanggal kalender kini dihitung maksimal sebagai 1 hari kehadiran sah, durasi diakumulasi secara akurat tanpa duplikasi jam, dan metrik `fulfilledTargetDays`, `totalDaysAttended`, serta `totalHariTerpenuhi` 100% selaras dengan hari riil mahasiswa (16 hari untuk Rafly).
  - **Solusi Web Mobile**: Memperbaiki resolusi `tsSummary` di `MahasiswaMobileHome.tsx` agar memprioritaskan profil mahasiswa pengguna aktif (`user?.id`) dan mengharmonisasi penghitungan `attendedCount` berbasis hari unik valid sehingga kartu Ringkasan Kemajuan KKN menampilkan `16 SESI HADIR` tepat 1:1 dengan `16 LOGBOOK` dan `16 VALID DPL`.
- [x] **Audit & Perbaikan Sinkronisasi Check-Out iOS Web & Deadlock ATTENDANCE_NOT_FOUND (`MahasiswaPresensiMobile.tsx`, `kknAttendanceService.ts`, & `presensiMandiriService.ts`)**:
  - **Akar Masalah**: Mahasiswa pengguna iOS/Web (contoh: Varel Yosephin NIM 21224099 Kelompok 3 Dago) mengalami galat `ATTENDANCE_NOT_FOUND: Belum ada data check-in hari ini untuk di-checkout` saat menekan tombol "Akhiri Sesi & Presensi Pulang". Hal ini disebabkan oleh:
    1. *Timezone UTC Server Mismatch* pada `presensiMandiriService.ts` yang mencari jadwal KKN resmi dengan `setHours(0,0,0,0)` (UTC), sehingga tidak cocok dengan `schedule.date` yang tersimpan dalam format WIB (`2026-10-06T17:00:00Z`). Akibatnya, sinkronisasi awal ke `ActivityAttendance` gagal saat check-in.
    2. *Virtual Ongoing State* di `getKegiatanAktif` mensintesis status jadwal resmi menjadi `BERLANGSUNG` karena adanya record `PresensiMandiri` aktif.
    3. *Deadlock UI* di `MahasiswaPresensiMobile.tsx`: Saat `/kkn/kegiatan/:id/selesai` merespons galat 404/`ATTENDANCE_NOT_FOUND`, fungsi langsung melempar pesan error dan melakukan `return` (hard-stop) sehingga langkah ke-2 (`PATCH /presensi/mandiri/:id/checkout`) tidak pernah dijalankan.
    4. *Ketiadaan Cross-Table Bridge* di `kknAttendanceService.ts`: Jika data di `ActivityAttendance` kosong, backend langsung menolak tanpa memeriksa dan menjembatani sesi aktif di `PresensiMandiri`.
  - **Solusi Komprehensif**:
    1. **Web Client (`MahasiswaPresensiMobile.tsx`)**: Menjadikan penanganan galat `isNotFound` pada jadwal resmi non-blocking sehingga alur eksekusi mulus melanjutkan checkout ke `PresensiMandiri` aktif.
    2. **Backend Timezone (`presensiMandiriService.ts`)**: Menstandarkan kalkulasi `todayStart` dan `todayEnd` ke zona waktu WIB (UTC+7) dan menambahkan mekanisme fallback upsert penyelesaian ke `ActivityAttendance`.
    3. **Backend Cross-Table Bridge (`kknAttendanceService.ts`)**: Menambahkan fallback cerdas pada `checkOutAttendance` yang mendeteksi sesi aktif `PresensiMandiri`, membuat record `ActivityAttendance` pendamping, dan menyinkronkan status presensi mandiri ke `SELESAI`.
  - **Validasi Mutu**: 30/30 Vitest suite DPL & KKN pass 100%, TypeScript build `apps/api` dan `apps/web` 0 error (lulus penuh Quality Gate).
- [x] **Penyesuaian Target Jam Kerja Dasbor Eksekutif KKN Menjadi 250 Jam (`kknExecutiveService.ts` & `DashboardEksekutifKkn.tsx`)**:
  - **Kebutuhan Bisnis**: Sesuai arahan atasan, target pemantauan akumulasi jam kerja KKN pada Dasbor Eksekutif KKN disesuaikan dari target 200 jam menjadi 250 jam. Penyesuaian ini dikhususkan hanya pada dasbor eksekutif monitoring dan tidak menyentuh modul/halaman lain.
  - **Backend API (`kknExecutiveService.ts`)**:
    1. Mengubah konstanta `targetHours = 250` pada kalkulasi rasio kehadiran dan tren mingguan (`weeklyTrends`).
    2. Menyelaraskan perhitungan `rasioPercentage` = `(currentAvgHours / 250) * 100` dan `remainingHours` = `max(0, 250 - currentAvgHours)`.
    3. Memperbarui `sublabel` ringkasan eksekutif menjadi `... dari target 250 jam`.
    4. Menambahkan test case komprehensif pada `kknExecutiveService.test.ts` (8/8 tests pass).
  - **Web Frontend (`DashboardEksekutifKkn.tsx`)**:
    1. Memperbarui kartu monitoring menjadi **"Target 250 Jam Kerja"**.
    2. Menyesuaikan fallback `targetHours: 250` dan sisa jam tersisa.
    3. Mengubah format capaian menjadi `X Jam / 250 Jam`.
    4. Menyesuaikan visualisasi `LineChart`: domain sumbu Y diubah menjadi `[0, 250]` dengan ticks `[0, 50, 100, 150, 200, 250]` dan garis target putus-putus (*dashed line*) di angka 250 jam.
  - **Validasi Mutu**:
    - `kknExecutiveService.test.ts`: 8/8 tests PASSED (100%).
    - DPL Test Suite (`dplApproval.test.ts`, `logbookVerifikasi.test.ts`, `penilaianKknRoleGuard.test.ts`): 30/30 tests PASSED (100%).
    - Build & Type-Check (`npm run build --prefix apps/api` dan `npm run build --prefix apps/web`): 0 Error (PASSED).
- [x] **Penyesuaian & Rekonsiliasi Presensi KKN Ghazwan Jabbar Khairullah - Kelompok 5 Sekeloa (07 Oktober 2026)**:
  - **Latar Belakang**: Menindaklanjuti kendala teknis pencatatan durasi presensi mobile pada 07 Oktober 2026, dilakukan penyesuaian data lapangan untuk Ghazwan Jabbar Khairullah (NIM: `10524067`) dari Kelompok 5 Sekeloa (kegiatan penanaman bibit di kelurahan, 07:00 - 16:00 WIB, 540 menit).
  - **Eksekusi VPS Live**:
    1. `ActivityAttendance`: ID `fe848a32-ca8a-4375-8ee3-33cde787e13c`, status `HADIR_MEMENUHI`, durasi 540 menit, metode `GPS_ACTIVITY`.
    2. `PresensiMandiri`: Status `SELESAI`, durasi 540 menit.
    3. `LogbookKkn`: ID `a93d77f5-172c-4fa9-a7c8-7094bdacff88`, Proker #4 (Tabebuya 11 Bibit), status `MENUNGGU_VERIFIKASI_DPL`.
    4. `PointHistory`: +4 PTS check-in, +3 PTS durasi terpenuhi, +3 PTS logbook harian (Total Saldo: 193 PTS, 25 hari hadir, 166 jam kerja).
    5. Cache Redis di-flush (`redis-cli flushall`). Seluruh 13 anggota Kelompok 5 Sekeloa tercatat 100% `HADIR_MEMENUHI`.
  - **Laporan Resmi**: [`LAPORAN_RESMI_AUDIT_DAN_PENYESUAIAN_PRESENSI_GHAZWAN_KELOMPOK_5_SEKELOA_07OKT.md`](LAPORAN_RESMI_AUDIT_DAN_PENYESUAIAN_PRESENSI_GHAZWAN_KELOMPOK_5_SEKELOA_07OKT.md).
- [x] **Penyesuaian & Rekonsiliasi Presensi KKN Ragil Yuni Wulandari - Kelompok 11 Sadang Serang (07 Oktober 2026)**:
  - **Latar Belakang**: Menindaklanjuti konfirmasi resmi perwakilan Kelompok 11 Sadang Serang terkait kendala teknis pencatatan durasi presensi pada aplikasi mobile untuk kegiatan lapangan 07 Oktober 2026 (aktivitas Ecobrick & Monitoring Rumah Memilah di RW 16, 06.30 - 16.00 WIB, 570 menit / 9 jam 30 menit).
  - **Eksekusi VPS Live (`157.10.252.252`)**:
    1. `ActivityAttendance`: ID `5fddfe92-47c7-46f9-a42b-85375c8d483c`, diselaraskan waktu masuk 06:30 WIB (`2026-10-06T23:30:00Z`), waktu keluar 16:00 WIB (`2026-10-07T09:00:00Z`), durasi aktual 570 menit, status `HADIR_MEMENUHI`, deskripsi `"Ecobrick, Monitoring Rumah Memilah."`, `jedaLogs` dibersihkan (`[]`).
    2. `PresensiMandiri`: ID `98b87e98-b72a-4ce5-8605-24133a0cf08a`, check-in 06:30 WIB, check-out 16:00 WIB, durasi 570 menit, status `SELESAI`, deskripsi diselaraskan.
    3. `PointHistory`: Poin check-in (+4 PTS) dan durasi (+3 PTS) diselaraskan (Total Saldo: 203 PTS, 31 sesi hadir memenuhi, 252,67 jam kerja kumulatif).
- [x] **Penyesuaian & Rekonsiliasi Presensi KKN Idin Naufal Hakim - Kelompok 2 Sekeloa (07 Oktober 2026)**:
  - **Latar Belakang**: Menindaklanjuti konfirmasi resmi perwakilan Kelompok 2 Sekeloa (RW 03 dan 04) terkait kendala teknis pencatatan durasi presensi mobile pada hari kegiatan Rabu, 07 Oktober 2026 (pembuatan tong sampah sedekah dari galon bekas dan kawat, persiapan atribut pemilahan sampah, serta pendataan warga, pukul 10.00 – 16.00 WIB, 360 menit / 6 jam).
  - **Eksekusi VPS Live (`157.10.252.252`)**:
    1. `ActivityAttendance`: ID `7f8f9984-3e36-4974-8f1e-074f30c14930`, diselaraskan waktu masuk 10:00 WIB (`2026-10-07T03:00:00Z`), waktu keluar 16:00 WIB (`2026-10-07T09:00:00Z`), durasi aktual 360 menit, status `HADIR_MEMENUHI`, deskripsi `"Pembuatan tong sampah sedekah dari galon bekas dan kawat, persiapan atribut pemilahan sampah, serta pendataan warga di RW 03 dan 04 Sekeloa"`, foto bukti `/uploads/1791368329749-1a014dde-8cb8-496c-a630-e05df8c5b646.jpg`.
    2. `PresensiMandiri`: Status `SELESAI`, durasi 360 menit (10:00 - 16:00 WIB).
    3. `LogbookKkn`: ID `f6a7e636-5037-4505-87a1-620b6737f042`, Pekan Ke-4, Proker #7 (`c364992c-cfc5-4073-9c08-ee3c0932e6e0`: Pembuatan tong sampah sedekah dari galon bekas dan kawat), status `MENUNGGU_VERIFIKASI_DPL`.
    4. `PointHistory`: Poin check-in (+4 PTS), poin durasi terpenuhi (+3 PTS), dan poin logbook harian (+3 PTS) terverifikasi lengkap (Total Saldo: 226 PTS, 25 hari hadir memenuhi, 211,40 jam kerja kumulatif).
    5. Cache Redis di-flush penuh (`redis-cli flushall`).
  - **Laporan Resmi**: [`LAPORAN_RESMI_AUDIT_DAN_PERBAIKAN_PRESENSI_IDIN_NAUFAL_VPS.md`](LAPORAN_RESMI_AUDIT_DAN_PERBAIKAN_PRESENSI_IDIN_NAUFAL_VPS.md) / [PDF](LAPORAN_RESMI_AUDIT_DAN_PERBAIKAN_PRESENSI_IDIN_NAUFAL_VPS.pdf).
- [x] **Penyesuaian & Rekonsiliasi Presensi KKN 3 Mahasiswa Kelompok 1 Lebak Siliwangi (07 Oktober 2026)**:
  - **Latar Belakang**: Menindaklanjuti laporan resmi Sekretaris Kelompok 1 Lebak Siliwangi terkait kendala pencatatan presensi 3 mahasiswa (Fitri Najla Salsabila - 31624005, Putri Andini - 41824048, dan Aulia Zahwa Putri - 63824024) pada kegiatan lapangan Rabu, 07 Oktober 2026 (Edukasi & Sosialisasi Pemilahan Sampah serta apk Berseka ke warga RW 7 dengan Reward 2 Keranjang sampah per warga yang instal, serta penempelan brosur edukasi, pukul 09.00 – 16.00 WIB, 420 menit / 7 jam).
  - **Eksekusi VPS Live (`157.10.252.252`)**:
    1. `ActivityAttendance` (Jadwal `1c9fb933`): Diselaraskan rentang waktu 09:00 - 16:00 WIB (420 menit), status `HADIR_MEMENUHI`, deskripsi kegiatan diselaraskan, foto kegiatan tersambung.
    2. `PresensiMandiri`: Status `SELESAI`, durasi 420 menit (09:00 - 16:00 WIB).
    3. `LogbookKkn`: Tertaut ke Proker #1 ("Dari Kita Untuk Lingkungan" - `3cdc733e`), status `MENUNGGU_VERIFIKASI_DPL` untuk DPL Fenny Febrianty, S.S., M.Pd.
    4. `PointHistory`: Poin check-in (+4 PTS), poin durasi harian (+3 PTS), dan poin logbook harian (+3 PTS) lengkap (+10 PTS/mahasiswa).
       - Fitri Najla Salsabila: Saldo 236 PTS (26 hari hadir sah, 174 jam 54 menit).
       - Putri Andini: Saldo 248 PTS (31 hari hadir sah, 223 jam 40 menit).
       - Aulia Zahwa Putri: Saldo 172 PTS (19 hari hadir sah, 145 jam 44 menit).
- [x] **Penyesuaian & Rekonsiliasi Presensi KKN Ailsha Azka Sahda Nabilla - Kelompok 2 Dago (07 Oktober 2026)**:
  - **Latar Belakang**: Menindaklanjuti konfirmasi resmi perwakilan Kelompok 2 Dago terkait kendala teknis pencatatan durasi presensi mobile pada hari kegiatan Rabu, 07 Oktober 2026 (Melakukan aktifitas pembagian tong sampah ke RW 03, 05, dan 06, aktivasi warga, pendataan DLH, serta koordinasi petugas pemilah, pukul 09.00 – 13.15 WIB, 255 menit / 4 jam 15 menit).
  - **Eksekusi VPS Live (`157.10.252.252`)**:
    1. `ActivityAttendance`: ID `22ca8302-3281-4375-87cc-c89ee91d694c`, diselaraskan waktu masuk 09:00 WIB (`2026-10-07T02:00:00Z`), waktu keluar 13:15 WIB (`2026-10-07T06:15:00Z`), durasi aktual 255 menit, status `HADIR_MEMENUHI`, deskripsi diselaraskan.
    2. `PresensiMandiri`: ID `043b7c4b-daf2-44c3-be6d-cdd6bed8e252`, status `SELESAI`, durasi 255 menit (09:00 - 13:15 WIB).
    3. `LogbookKkn`: ID `6cf03a53-b68c-436c-980d-dd64da2882f4`, Pekan Ke-4, Proker #3 (`5811e630-ffcc-4dad-b645-a866c7ebbf38`: Penerapan Sistem Informasi BERSEKA & Bank Sampah), status `MENUNGGU_VERIFIKASI_DPL` untuk DPL Assoc. Prof. Dr. Agus Riyanto, S.T., M.T.
    4. `PointHistory`: Poin check-in (+4 PTS), poin durasi terpenuhi (+3 PTS), dan poin logbook harian (+3 PTS) lengkap (Total Saldo: 160 PTS, 17 hari hadir memenuhi, 94 jam 39 menit akumulatif kerja lapangan).
    5. Cache Redis di-flush penuh (`redis-cli flushall`).
  - **Laporan Resmi**: [`LAPORAN_RESMI_AUDIT_DAN_PENYESUAIAN_PRESENSI_AILSHA_KELOMPOK_2_DAGO_07OKT.md`](LAPORAN_RESMI_AUDIT_DAN_PENYESUAIAN_PRESENSI_AILSHA_KELOMPOK_2_DAGO_07OKT.md) / [PDF](LAPORAN_RESMI_AUDIT_DAN_PENYESUAIAN_PRESENSI_AILSHA_KELOMPOK_2_DAGO_07OKT.pdf).

### D. 08 Oktober 2026 - Penyempurnaan Menu Program Kerja KKN: Kartu Lengkap, Donut Chart Analitik, & Sinkronisasi Filter
- **Konteks & Latar Belakang**:
  1. Di menu Program Kerja KKN, kartu statistik atas belum lengkap (hanya Total, Menunggu, Disetujui, Pelaksanaan) tanpa status Ditolak/Kadaluarsa dan metrik Belum Mulai.
  2. Terdapat desinkronisasi tampilan dropdown Kelompok pada role Pimpinan (Camat, Lurah, Rektor) di mana opsi `<option value="ALL">Semua Kelompok</option>` tidak tercetak, sehingga browser secara default menampilkan kelompok pertama (misal "Kelompok 1 Cipaganti") padahal state bernilai `"ALL"` dan data yang tampil adalah seluruh 157 proker.
  3. Metrik kartu dihitung dari `prokerList` mentah (tanpa menyaring filter wilayah/kelompok/waktu di client), sehingga saat user memilih Kelurahan atau RW tertentu, tabel memfilter dengan benar namun kartu statistik di atas tetap menampilkan total global (157 proker).
- **Implementasi Solusi (`apps/web/src/pages/ProgramKerjaKkn/ProgramKerjaKkn.tsx`)**:
  1. **5 Kartu KPI Lengkap**:
     - Card 1: Total Program Kerja (Semua usulan kegiatan KKN)
     - Card 2: Menunggu Persetujuan (Menunggu verifikasi DPL + persentase)
     - Card 3: Disetujui (ACC DPL + persentase)
     - Card 4: Ditolak / Kadaluarsa (Usulan ditolak atau kadaluarsa H+5 + persentase)
     - Card 5: Pelaksanaan Kegiatan (Sedang Berlangsung, Belum Mulai, dan Selesai)
  2. **Widget Visual Analitik (Diadaptasi dari Dashboard Eksekutif)**:
     - Ditambahkan tepat di bawah 5 kartu ringkasan.
     - Dimensi 1 (Status Usulan): Donut Chart interaktif (Recharts) dengan tooltip proker dan teks tengah total proker + 4 kartu metrik (Total, Disetujui, Menunggu, Ditolak).
     - Dimensi 2 (Status Pelaksanaan): Donut Chart interaktif + badge Total Disetujui + 3 baris rincian (Belum Mulai, Sedang Berjalan, Sudah Selesai) dengan persentase.
     - Interaktivitas dua arah: Mengklik kartu atau irisan diagram otomatis mengaktifkan filter status pada dropdown dan tabel.
  3. **Penyelarasan Arsitektur Filtering (Scoped vs Filtered)**:
     - `scopedProkers`: Proker yang disaring berdasarkan lingkup wilayah (`selectedKelurahan`, `selectedRw`), `selectedKelompokId`, rentang waktu (`startDateFilter`, `endDateFilter`), kategori, sumber, dan kata kunci pencarian. Seluruh 5 kartu dan kedua donut chart dihitung dari `scopedProkers`, menjamin sinkronisasi 100% saat dropdown filter diganti.
     - `filteredProkers`: Menyaring baris data tabel dari `scopedProkers` jika user memilih filter status tertentu.
     - Perbaikan `<option value="ALL">Semua Kelompok</option>` untuk mencakup role `isPimpinan` dan DPL dengan banyak kelompok.
     - Ditambahkan *Active Filter Feedback Strip* di atas tabel untuk memberikan kejelasan visual data yang sedang ditampilkan.
- **Validasi Mutu**:
  - `npx vitest run apps/api/src/controllers/dplApproval.test.ts apps/api/src/services/logbookVerifikasi.test.ts apps/api/src/services/penilaianKknRoleGuard.test.ts`: 30 passed (100% green).
  - `npx tsc --noEmit --project apps/web/tsconfig.json`: 0 errors.
  - `npm run build --prefix apps/web`: Vite build sukses 100% (`✓ built in 12.46s`).

---

## 5. Direktori & Arsip Dokumen

Semua laporan audit berkala, investigasi teknis perorangan, dan dokumen historis telah dirapikan ke dalam folder:
📁 [`docs/archive/`](archive/)

Daftar dokumen operasional aktif yang tetap berada di `docs/`:
1. `PROJECT_PROGRESS.md` *(Dokumen ini - Single Source of Truth)*
2. `DPL_PATEN_CONSTITUTION.md` *(Konstitusi paten DPL)*
3. `GIT_WORKFLOW.md` *(Tata kelola branch & deployment)*
4. `MOBILE_API_DOCS.md` *(Spesifikasi REST API mobile)*
5. `deployment_runbook.md` *(Panduan deploy VPS & Staging)*
6. `prd.md`, `sdd.md`, `srs.md` *(Spesifikasi kebutuhan perangkat lunak)*

---

## 6. Panduan untuk Agen AI & Developer Baru
1. Sebelum mulai mengerjakan fitur atau bugfix:
   - Baca dokumen ini dan pastikan branch yang digunakan adalah turunan dari `development`.
   - Cek apakah task bersinggungan dengan modul **DPL** atau **VPS Database**. Jika ya, patuhi klausul invarian di Bab 2.
2. Gunakan **1 sesi percakapan per tugas spesifik** (misal: "Fix validasi QR RW 04"). Setelah selesai di-commit/di-merge, mulai sesi baru untuk tugas berikutnya agar penalaran AI tetap jernih dan bebas *context noise*.
