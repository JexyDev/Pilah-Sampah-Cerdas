# LAPORAN INTEGRASI & EKSEKUSI SISTEM POIN UNTUK TIM MOBILE APP

Dokumen ini berisi panduan teknis, spesifikasi kontrak API, dan hasil pengujian aplikasi mobile (*Flutter*) terhadap 3 pembaruan logika sistem poin di backend BERSEKA.

---

## 1. Ringkasan Pembaruan Backend & Dampaknya pada Mobile

| No | Fitur / Logic Backend | Perubahan Kontrak & Perilaku API | Dampak & Penyesuaian pada Mobile App |
|:---|:----------------------|:---------------------------------|:-------------------------------------|
| **1** | **Bonus +20 Poin Mahasiswa KKN (Login Pertama)** | Poin tidak lagi diberikan saat admin membuat akun (`createUser`). Poin otomatis dicairkan (+20) saat `POST /api/auth/login` pertama kali jika `role == "MAHASISWA_KKN"`. | Response login `user.points` & `user.totalPoints` langsung bernilai 20 saat Mahasiswa KKN pertama kali login. Halaman `MahasiswaPoinView` & `MahasiswaView` langsung menampilkan total poin 20 tanpa jeda. Role `WARGA` & `PETUGAS_RESIDU` tetap bernilai 0. |
| **2** | **Reward +15 Poin Petugas Pemilahan saat Approve Reset Bin** | Saat Petugas memanggil `PUT /api/residu/pengajuan-reset/:id/accept` atau staff mereview di `PUT /api/bins/reset-requests/:id/review`, backend otomatis mencatat `+15 poin` ke `pointHistory` Petugas. | Setelah petugas menekan tombol *Terima / Setujui Pengajuan* di `PengajuanWargaView`, poin petugas bertambah +15. Riwayat pengosongan di `RiwayatPetugasView` mencatat transaksi `VALIDASI_PENGOSONGAN`. |
| **3** | **Reward Presensi Mahasiswa KKN (+10 Check-In & +10 Check-Out)** | Presensi valid (dalam geofence & jam operasional) memicu +10 poin saat Masuk/Mulai (`recordAttendance`/`mulaiKegiatan`) dan +10 poin saat Pulang/Selesai (`checkOutAttendance`/`selesaiKegiatan`). Anti-duplikasi aktif per sesi per hari. | Saat mahasiswa melakukan presensi masuk di `MahasiswaView` / QR Scan / Live GPS, poin bertambah +10. Saat kepulangan / checkout selesai, poin bertambah +10 lagi (total +20 poin presensi per hari). Riwayat poin ter-sync real-time via WebSocket. |

---

## 2. Rincian Endpoint & Payload untuk Tim Mobile

### A. Endpoint Login (`POST /api/auth/login`)
- **Request**:
  ```json
  {
    "identifier": "081234567890",
    "password": "password123"
  }
  ```
- **Response Data**:
  ```json
  {
    "accessToken": "eyJhbGci...",
    "refreshToken": "...",
    "user": {
      "id": "usr-uuid-mhs",
      "name": "Budi Santoso",
      "role": "MAHASISWA_KKN",
      "phone": "081234567890",
      "points": 20,
      "totalPoints": 20,
      "nim": "1301210001",
      "jurusan": "Informatika"
    }
  }
  ```
- **Keterangan**:
  - `user.points` langsung berisi nilai 20 pada login pertama kali.
  - Mobile memetakan payload ini ke `UserEntity` dan menyimpannya di state `AuthNotifier` serta secure storage cache.

---

### B. Endpoint Validasi Reset Bin (`PUT /api/residu/pengajuan-reset/:id/accept`)
- **Headers**: `Authorization: Bearer <petugas_token>`
- **Response**:
  ```json
  {
    "id": "req-123",
    "status": "IN_PROGRESS",
    "reviewedById": "usr-uuid-petugas",
    "bin": {
      "id": "bin-456",
      "qrCode": "QR-COBLONG-01"
    }
  }
  ```
- **Catatan**: Backend secara atomik membuat entri `PointHistory`:
  - `points`: `15`
  - `kategori`: `"VALIDASI_PENGOSONGAN"`
  - `description`: `"Reward validasi pengosongan tempat sampah (QR-COBLONG-01)"`

---

### C. Endpoint Presensi Masuk & Pulang Mahasiswa KKN

#### 1. Presensi Masuk (Check-In)
- **Endpoint**: `POST /api/kkn-attendance/presensi`
- **Request**:
  ```json
  {
    "scheduleId": "sch-posko-01",
    "latitude": -6.8915,
    "longitude": 107.6107,
    "method": "MANUAL"
  }
  ```
- **Reward Backend**: +10 Poin (`PARTISIPASI_STREAK`), `description`: `"Bonus kehadiran (Check-In) KKN: Posko Coblong (MANUAL)"`.

#### 2. Presensi Pulang (Check-Out)
- **Endpoint**: `POST /api/kkn-attendance/checkout`
- **Request**:
  ```json
  {
    "scheduleId": "sch-posko-01",
    "latitude": -6.8915,
    "longitude": 107.6107
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Check-out presensi berhasil dicatat.",
    "data": {
      "attendanceId": "att-uuid-1",
      "scheduleId": "sch-posko-01",
      "attendedAt": "2026-08-20T08:00:00.000Z",
      "checkOutAt": "2026-08-20T16:00:00.000Z",
      "durationMinutes": 480,
      "durationFormatted": "8 Jam 0 Menit",
      "status": "SELESAI"
    }
  }
  ```
- **Reward Backend**: +10 Poin (`PARTISIPASI_STREAK`), `description`: `"Bonus kepulangan (Check-Out) presensi KKN: Posko Coblong"`.

---

## 3. Hasil Eksekusi & Validasi Test Suite Mobile (Flutter)

Pengujian unit dan integrasi aplikasi Flutter telah dieksekusi menggunakan Flutter Test Runner:

```bash
flutter test
```

### Hasil Test:
- **`kelompok_mahasiswa_points_test.dart`**:
  - `SUM poin individu anggota menghasilkan total poin kelompok yang tepat` — **PASSED**
  - `Leaderboard kelompok terurut berdasarkan total poin terbanyak` — **PASSED**
- **`nim_phone_detection_test.dart`**:
  - Validasi deteksi dual-mode No HP vs NIM (ITB 8 digit, Telkom/Unpad 10 digit) — **PASSED (6 tests)**
- **`widget_test.dart`**:
  - Konfigurasi parameter geofence radius, kapasitas bin, threshold AI, density organik/anorganik — **PASSED (10 tests)**
- **`points_system_integration_test.dart`**:
  - Pemetaan role RBAC & parsing histori poin bonus login, validasi reset bin, dan check-in/out presensi — **PASSED (2 tests)**

**Total Status**: **20 / 20 Tests Passed (100% SUCCESS)**.

---

## 4. Rekomendasi untuk Developer Mobile

1. **State Refresh Poin Setelah Transaksi**:
   - Pastikan setelah memanggil API Checkout presensi atau Approve Reset Bin, controller memanggil `ref.refresh(pointHistoryProvider)` atau membaca ulang `user.points` agar UI langsung ter-update.
2. **WebSocket Listener**:
   - Mobile app sudah mendukung listener WebSocket `broadcastStudentAttendance` dan `broadcastStudentCheckout`. Point count badge di navbar dapat langsung di-refresh saat event ini diterima.
3. **Pesan Sukses / SnackBar**:
   - Tampilkan snackbar yang informatif kepada Mahasiswa KKN (`"+10 Poin berhasil didapatkan!"`) saat check-in dan check-out berhasil.
