# Fix & Standardisasi: Tumpang Tindih Endpoint Backend API (Mobile & Web)

**Branch:** `fix/mobile-backend-endpoint-overlap` & `development`  
**Tanggal:** 2026-08-31  
**Kategori:** `fix(api)` — Route deduplication, collision prevention & zero-downtime client compatibility

---

## 1. Latar Belakang Masalah

Audit menyeluruh terhadap file route backend menemukan bahwa beberapa router di-mount ke **lebih dari satu prefix** di `index.ts`, dan beberapa endpoint didefinisikan di **dua router berbeda** dengan handler yang berbeda. Kondisi ini menyebabkan:

1. **Route collision** — request ditangani oleh handler yang salah atau urutan mount di Express saling tumpang tindih.
2. **Wildcard root collision** — `app.use("/api/v1", kknAttendanceRouter)` mencegat request secara tidak sengaja.
3. **Mobile client hit handler lama** — `POST /api/v1/kkn/location-ping` mengarah ke `updateLocation()` lama alih-alih `pingLocation()` yang memiliki sinkronisasi durasi dan deteksi smart zone.
4. **Resiko 404 pada Mobile & Web** — jika endpoint presensi hanya dipindahkan ke `/api/v1/kkn-attendance/*`, Mobile Flutter (`baseUrl=/api/v1`) dan Web Dashboard yang memanggil `/api/v1/kkn/*` dan direct root endpoint akan gagal.

---

## 2. Rincian Solusi Arsitektur

### A. `apps/api/src/index.ts`
- **Pembersihan Root Wildcard**: Menghapus `app.use("/api/v1", kknAttendanceRouter)` dan `app.use("/api", kknAttendanceRouter)` yang menyebabkan collision ke seluruh route lain.
- **Pembersihan Alias Duplikat**: Menghapus alias berlebih seperti `/petugas-pemilahan`, `/pemilahan`, `/wilayah`, dan `/rt`.
- **Dedicated Direct Endpoints**: Menambahkan mapping rute eksplisit (tanpa wildcard) untuk request non-prefix yang dibutuhkan oleh Web Dashboard dan Mobile Background Worker:
  - `POST /api/v1/location-ping` & `/api/location-ping` $\rightarrow$ `kknAttendanceController.pingLocation`
  - `GET /api/v1/mahasiswa/lokasi-aktif` & `/api/mahasiswa/lokasi-aktif` $\rightarrow$ `kknAttendanceController.getActiveStudentsLocations`
  - `GET /api/v1/timesheet/summary` & `/api/timesheet/summary` $\rightarrow$ `kknAttendanceController.getTimesheetSummary`
  - `GET /api/v1/laporan-rekap` & `/api/v1/laporan-presensi` $\rightarrow$ `kknAttendanceController.getLaporanPresensi`
  - `GET /api/v1/kegiatan/:id/lokasi` & `/api/kegiatan/:id/lokasi` $\rightarrow$ `kknAttendanceController.getActivityLocation`
  - `GET /api/v1/kegiatan/:id/absen` & `/api/kegiatan/:id/absen` $\rightarrow$ `kknAttendanceController.getAttendanceList`
  - `POST /api/v1/kegiatan/:id/absen` & `/api/kegiatan/:id/absen` $\rightarrow$ `kknAttendanceController.recordAttendance`
  - `POST /api/v1/kegiatan/:id/check-out` & `/api/kegiatan/:id/check-out` $\rightarrow$ `kknAttendanceController.checkOutAttendance`

### B. `apps/api/src/routes/kknRoutes.ts` (Prefix: `/api/v1/kkn`)
Semua endpoint presensi di bawah prefix `/kkn` dihubungkan langsung ke handler canonical `kknAttendanceController`:
- `GET /kegiatan-aktif` $\rightarrow$ `kknAttendanceController.getKegiatanAktif`
- `POST /kegiatan/:id/mulai` $\rightarrow$ `kknAttendanceController.mulaiKegiatan`
- `POST /kegiatan/:id/jeda` $\rightarrow$ `kknAttendanceController.jedaKegiatan`
- `POST /kegiatan/:id/selesai` $\rightarrow$ `kknAttendanceController.selesaiKegiatan`
- `POST /location-ping` $\rightarrow$ `kknAttendanceController.pingLocation` (menerima payload `accumulatedDuration`, `inZoneSeconds`, dll.)
- `POST /out-of-zone-violation` $\rightarrow$ `kknAttendanceController.recordOutOfZoneViolation`
- `GET /kegiatan/:id/presensi-history` $\rightarrow$ `kknAttendanceController.getPresensiHistory`
- `GET ["/kegiatan/:id/lokasi", "/target-lokasi"]` $\rightarrow$ `kknAttendanceController.getActivityLocation`
- `POST ["/absen", "/kegiatan/:id/absen"]` $\rightarrow$ `kknAttendanceController.absenAlias`
- `POST ["/attendance/check-in", "/attendance/checkin"]` $\rightarrow$ `kknAttendanceController.recordAttendance`
- `POST ["/attendance/check-out", "/attendance/checkout"]` $\rightarrow$ `kknAttendanceController.checkOutAttendance`

### C. `apps/api/src/routes/kknAttendanceRoutes.ts` (Prefix: `/api/v1/kkn-attendance`)
Mendukung semua pemanggilan dengan prefix `/api/v1/kkn-attendance/*` dengan path array yang fleksibel (`/kegiatan-aktif` maupun `/kkn/kegiatan-aktif`).

---

## 3. Matriks Kompatibilitas Endpoint KKN & Presensi

| Fitur | Method | URL Mobile (Dio BaseUrl: `/api/v1`) | URL Alternatif / Canonical | Handler Controller |
|---|---|---|---|---|
| Kegiatan Aktif | `GET` | `/api/v1/kkn/kegiatan-aktif` | `/api/v1/kkn-attendance/kkn/kegiatan-aktif` | `kknAttendanceController.getKegiatanAktif` |
| Mulai Kegiatan | `POST` | `/api/v1/kkn/kegiatan/:id/mulai` | `/api/v1/kkn-attendance/kkn/kegiatan/:id/mulai` | `kknAttendanceController.mulaiKegiatan` |
| Jeda Kegiatan | `POST` | `/api/v1/kkn/kegiatan/:id/jeda` | `/api/v1/kkn-attendance/kkn/kegiatan/:id/jeda` | `kknAttendanceController.jedaKegiatan` |
| Selesai Kegiatan | `POST` | `/api/v1/kkn/kegiatan/:id/selesai` | `/api/v1/kkn-attendance/kkn/kegiatan/:id/selesai` | `kknAttendanceController.selesaiKegiatan` |
| Foreground Ping | `POST` | `/api/v1/kkn/location-ping` | `/api/v1/kkn-attendance/location-ping` | `kknAttendanceController.pingLocation` |
| Background Ping | `POST` | `/api/v1/location-ping` | `/api/v1/kkn-attendance/location-ping` | `kknAttendanceController.pingLocation` |
| Out of Zone | `POST` | `/api/v1/kkn/out-of-zone-violation` | `/api/v1/kkn-attendance/kkn/out-of-zone-violation` | `kknAttendanceController.recordOutOfZoneViolation` |
| Riwayat Presensi | `GET` | `/api/v1/kkn/kegiatan/:id/presensi-history` | `/api/v1/kkn-attendance/kkn/kegiatan/:id/presensi-history` | `kknAttendanceController.getPresensiHistory` |
| Target Lokasi | `GET` | `/api/v1/kkn/target-lokasi` / `/kegiatan/:id/lokasi` | `/api/v1/kegiatan/:id/lokasi` | `kknAttendanceController.getActivityLocation` |
| Timesheet Summary | `GET` | `/api/v1/timesheet/summary` | `/api/v1/kkn-attendance/timesheet/summary` | `kknAttendanceController.getTimesheetSummary` |
| Lokasi Mahasiswa | `GET` | `/api/v1/mahasiswa/lokasi-aktif` | `/api/v1/kkn-attendance/mahasiswa/lokasi-aktif` | `kknAttendanceController.getActiveStudentsLocations` |
| Rekap Presensi | `GET` | `/api/v1/laporan-rekap` | `/api/v1/kkn-attendance/laporan-rekap` | `kknAttendanceController.getLaporanPresensi` |

---

## 4. Penanganan Error & Validasi (QC & Error Handling)

1. **Koordinat Tidak Valid (GPS Jitter / Missing)**:
   - Request tanpa `latitude`/`longitude` atau bernilai `NaN` menghasilkan HTTP `400 Bad Request` dengan kode error `"INVALID_COORDINATES"` dan pesan jelas dalam Bahasa Indonesia.
2. **Autentikasi & Otorisasi Role**:
   - Mahasiswa hanya dapat mengakses aksi presensi mahasiswa (`403 FORBIDDEN` jika role tidak sesuai).
   - Pengajar/DPL/Admin mendapatkan akses monitoring tanpa dapat memalsukan presensi.
3. **Payload Durasi Fleksibel**:
   - Backend membaca `accumulatedDurationSeconds`, `accumulatedDuration`, maupun `inZoneSeconds` secara modular.
4. **Safe Image Upload**:
   - Menggunakan `safeUploadSingleImage("foto")` agar request tetap berhasil diproses meskipun foto bukti bersifat opsional atau terjadi masalah multipart pada koneksi seluler lambat.

---

## 5. Status Verifikasi Pengujian

- [x] **Vitest Unit & Integration Test Suite**: 19 test suite lolos (115/115 tests passed).
- [x] **Backward Compatibility Check**: Klien mobile Flutter tidak memerlukan build/rilis ulang APK mendesak.
- [x] **Web Monitoring Portal Check**: Semua query dashboard monitoring (`/timesheet/summary`, `/mahasiswa/lokasi-aktif`, `/laporan-rekap`) terlayani dengan benar.
