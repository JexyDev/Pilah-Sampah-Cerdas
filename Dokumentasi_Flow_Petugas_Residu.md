# DOKUMENTASI LENGKAP FLOW ARSITEKTUR & INTEGRASI API MODUL PETUGAS RESIDU TRASHCARE

Dokumen ini disusun sebagai panduan teknis dan operasional untuk pengembang yang akan melanjutkan/mengembangkan fitur **Modul Petugas Residu** pada aplikasi mobile **TrashCare** (Flutter Dart).

---

## 1. IKHTISAR MODUL PETUGAS RESIDU

Modul Petugas Residu dirancang khusus untuk petugas kebersihan lapangan DLH / Pengangkut Sampah Residu. Modul ini berfokus pada:
1. **Pemeriksaan Status Whitelist Account** (Keamanan akses berdasarkan persetujuan Admin DLH).
2. **Monitoring Jadwal Penjemputan Harian** (Tempat sampah residu dengan volume ≥ 70% di wilayah penugasan).
3. **Pencatatan & Input Timbangan Fisik Residu** (Perekaman berat nyata dan foto bukti timbangan).
4. **Pelaporan Pelanggaran Warga** (Pencatatan sampah tercampur organik/B3 dengan bukti foto).
5. **Monitoring KPI & Riwayat Aktivitas Petugas** (Statistik performa, ketepatan waktu, dan akurasi).

---

## 2. ARSITEKTUR NAVIGASI & ALUR APLIKASI (FLOWCHART)

```
                       ┌─────────────────────────┐
                       │   Login Petugas Residu  │
                       └────────────┬────────────┘
                                    │
                       ┌────────────▼────────────┐
                       │  Whitelist Guard Check  │
                       └────────────┬────────────┘
                                    │
            ┌───────────────────────┴───────────────────────┐
            │                                               │
   [Status: PENDING / REJECTED]                    [Status: APPROVED]
            │                                               │
┌───────────▼───────────┐                       ┌───────────▼───────────┐
│ Layar Restriksi       │                       │ Main Navigation View  │
│ (Menunggu Approval)   │                       │ (Bottom Navigation)   │
└───────────────────────┘                       └───────────┬───────────┘
                                                            │
         ┌───────────────────┬───────────────────┬──────────┴───────────┐
         │                   │                   │                      │
┌────────▼─────────┐ ┌───────▼─────────┐ ┌───────▼─────────┐ ┌──────────▼─────────┐
│ TAB 1: BERANDA   │ │ TAB 2: TIMBANGAN│ │ TAB 3: RIWAYAT  │ │ TAB 4: PROFIL     │
│ - Stat Dashboard │ │ - Input Berat   │ │ - Log Setoran   │ │ - Detail Account  │
│ - Jadwal Pickup  │ │ - Upload Foto   │ │ - Log Violation │ │ - Ganti Password  │
│ - Lapor Violation│ │ - QR Scanner    │ │ - Filter Range  │ │ - Logout          │
└──────────────────┘ └─────────────────┘ └─────────────────┘ └───────────────────┘
```

---

## 3. RINCIAN SPESIFIKASI ALUR & INTEGRASI ENDPOINT API

### 3.1. Whitelist Access Guard & Profiling
* **Tujuan:** Memastikan hanya petugas yang disetujui Admin DLH yang dapat mengakses fitur operasional.
* **Flow:**
  1. Pengguna login dengan `UserRole.petugasResidu`.
  2. Guard Widget (`PetugasWhitelistGuardWidget`) membaca `user.whitelistStatus`.
  3. Jika `PENDING` / `REJECTED`, aplikasi menampilkan pesan blokir ramah pengguna dengan tombol refresh status.
  4. Jika `APPROVED`, pengguna otomatis diarahkan ke `PetugasResiduMainNavigationView`.

---

### 3.2. Dashboard Performa & Jadwal Penjemputan Harian
* **Tab 1:** `PetugasResiduDashboardView`

#### Endpoint A: Ringkasan Dashboard Petugas
- **HTTP Method:** `GET`
- **URL:** `/api/v1/residu/dashboard`
- **Headers:** `Authorization: Bearer <accessToken>`
- **Response Success (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "petugasId": "PTR-001",
    "name": "Budi Santoso",
    "assignedZone": "RT 01/RW 02 Kel. Bojongsoang",
    "whitelistStatus": "APPROVED",
    "accountStatus": "ACTIVE",
    "totalJadwal": 8,
    "sudahDiambil": 3,
    "pelanggaranCount": 1,
    "totalWeightKg": 42.5,
    "kpiScore": 93.8,
    "ketepatanWaktuScore": 95.0,
    "akurasiScore": 92.0
  }
}
```

#### Endpoint B: List Jadwal Penjemputan Harian (Filtered by Zone)
- **HTTP Method:** `GET`
- **URL:** `/api/v1/residu/jadwal-harian`
- **Query Parameters:** `?kelurahan=Bojongsoang&rtRw=01/02`
- **Headers:** `Authorization: Bearer <accessToken>`
- **Response Success (`200 OK`):**
```json
{
  "success": true,
  "data": [
    {
      "binId": "BIN-RES-01",
      "binCode": "RES-010201",
      "wargaName": "Asep Sunandar",
      "address": "Jl. Asep Sunandar No. 49, RT 01/RW 02",
      "kelurahan": "Bojongsoang",
      "rtRw": "01/02",
      "volumePercentage": 85.0,
      "isPickedUp": false,
      "latitude": -6.9744,
      "longitude": 107.6303
    }
  ]
}
```

---

### 3.3. Input Timbangan Fisik Residu (Pencatatan Berat)
* **Tab 2:** `TimbanganResiduView`
* **Flow:**
  1. Petugas memilih Bins dari daftar jadwal atau melakukan Scan QR Code pada fisik tempat sampah.
  2. Petugas menginputkan **Berat Nyata Hasil Timbangan (Kg)**.
  3. Petugas memilih **Klasifikasi Residu** (misal: *Residu Non-B3*, *Residu B3*, *Popok/Pembalut*).
  4. Petugas mengambil foto bukti fisik timbangan menggunakan kamera. Foto akan dikompresi otomatis via `ImageCompressor` (Target `< 500KB`, Max Width `1280px`).
  5. Petugas menekan tombol **"Simpan & Kirim Timbangan"**.

#### Endpoint: Submit Timbangan Residu
- **HTTP Method:** `POST` (Multipart / FormData)
- **URL:** `/api/v1/residu/submit-log`
- **Headers:** `Authorization: Bearer <accessToken>`, `Content-Type: multipart/form-data`
- **Request Body (FormData):**
  - `binId`: String (misal: `"BIN-RES-01"`)
  - `actualWeightKg`: Double (misal: `14.5`)
  - `classification`: String (misal: `"Residu Non-B3"`)
  - `image`: File (Binary foto bukti timbangan)
  - `isGlobalBin`: Boolean (`true`)
  - `timestamp`: ISO8601 String (`"2026-08-03T09:45:00.000Z"`)
- **Response Success (`201 Created`):**
```json
{
  "success": true,
  "message": "Data timbangan residu berhasil dicatat dan status penjemputan diperbarui."
}
```

---

### 3.4. Pelaporan Pelanggaran Residu Tercampur (Violation Report)
* **Form View:** `LaporPelanggaranView`
* **Flow:**
  1. Apabila saat penjemputan petugas menemukan tempat sampah residu diisi oleh sampah organik/anorganik tercampur atau limbah berbahaya B3 tanpa penanganan.
  2. Petugas membuka form pelaporan via tombol di Dashboard atau Detail Bin.
  3. Petugas menginputkan QR Code / Bin ID Warga.
  4. Petugas memilih **Kategori Pelanggaran** (*Sampah Organik Tercampur*, *Limbah B3 Tanpa Label*, *Penumpukan Berlebih*).
  5. Petugas memilih **Tingkat Pelanggaran** (`LOW`, `MEDIUM`, `SEVERE`).
  6. Petugas mengambil foto bukti pelanggaran (foto dikompresi `< 500KB`).
  7. Petugas menekan tombol **"Kirim Laporan Pelanggaran"**.

#### Endpoint: Submit Laporan Pelanggaran
- **HTTP Method:** `POST` (Multipart / FormData)
- **URL:** `/api/v1/residu/violation`
- **Headers:** `Authorization: Bearer <accessToken>`, `Content-Type: multipart/form-data`
- **Request Body (FormData):**
  - `binQrCode`: String (misal: `"RES-010203"`)
  - `type`: String (`"Sampah Organik Tercampur"`)
  - `severity`: String (`"SEVERE"`)
  - `evidence`: File (Binary foto bukti)
  - `timestamp`: ISO8601 String (`"2026-08-03T09:45:00.000Z"`)
- **Response Success (`201 Created`):**
```json
{
  "success": true,
  "message": "Laporan pelanggaran berhasil dicatat. Pengurangan poin warga otomatis diproses."
}
```

---

### 3.5. Riwayat Setoran & Laporan Pelanggaran
* **Tab 3:** `RiwayatPetugasResiduView`
* **Flow:**
  1. Menampilkan seluruh aktivitas gabungan (*Setoran Timbangan* & *Laporan Pelanggaran*) yang pernah dilakukan oleh petugas yang sedang login.
  2. Menyediakan filter rentang waktu (`Semua Hari Ini`, `7 Hari Terakhir`, `Bulan Ini`) dan tipe aktivitas (`Semua`, `Timbangan`, `Pelanggaran`).

#### Endpoint: Ambil Riwayat Petugas
- **HTTP Method:** `GET`
- **URL:** `/api/v1/residu/riwayat`
- **Query Parameters:** `?range=7_days&type=ALL`
- **Headers:** `Authorization: Bearer <accessToken>`
- **Response Success (`200 OK`):**
```json
{
  "success": true,
  "data": [
    {
      "id": "HIST-01",
      "type": "SETORAN",
      "title": "Input Timbangan Residu Global",
      "subtitle": "Pos RT 01/RW 02 • 14.5 Kg",
      "classification": "Residu Non-B3",
      "weightKg": 14.5,
      "status": "SUDAH_DIAMBIL",
      "timestamp": "2026-08-03T09:00:00.000Z",
      "address": "Pos RT 01 / RW 02 Kel. Bojongsoang",
      "photoUrl": "https://storage.trashcare.id/uploads/residu-01.jpg"
    },
    {
      "id": "HIST-02",
      "type": "PELANGGARAN",
      "title": "Laporan Pelanggaran: Organik Tercampur",
      "subtitle": "QR: RES-010203 • Tingkat SEVERE",
      "severity": "SEVERE",
      "violationType": "Sampah Organik Tercampur",
      "pointDeduction": 50,
      "status": "DIPROSES",
      "timestamp": "2026-08-03T06:30:00.000Z",
      "address": "Jl. Dadang Suherman No. 96",
      "photoUrl": "https://storage.trashcare.id/uploads/violation-02.jpg"
    }
  ]
}
```

---

### 3.6. Profil Petugas & Fitur Ganti Password
* **Tab 4:** `PetugasResiduProfilView` & `GantiPasswordPetugasView`

#### Endpoint: Ganti Password Account Petugas
- **HTTP Method:** `POST`
- **URL:** `/api/v1/auth/change-password`
- **Headers:** `Authorization: Bearer <accessToken>`
- **Request Body (JSON):**
```json
{
  "oldPassword": "passwordLama123",
  "newPassword": "passwordBaru123"
}
```
- **Response Success (`200 OK`):**
```json
{
  "success": true,
  "message": "Password berhasil diperbarui."
}
```

---

## 4. FCM PUSH NOTIFICATION SERVICE (`PetugasResiduFcmService`)

Aplikasi dilengkapi service pemantau notifikasi real-time (`lib/app/modules/petugas_residu/services/petugas_residu_fcm_service.dart`) yang menangani:
1. **Notifikasi Peringatan Volume Tempat Sampah Penuh (≥ 80%):** Memicu notifikasi lokal agar petugas segera menuju lokasi penjemputan.
2. **Notifikasi Penugasan Rute Baru dari Admin DLH:** Notifikasi otomatis saat Admin menambahkan lokasi penjemputan baru pada zona penugasan petugas.

---

## 5. RANGKUMAN DIREKTORI KODE MODUL PETUGAS RESIDU

| Path Berkas | Fungsi / Komponen |
|---|---|
| `lib/app/data/models/petugas_residu_models.dart` | Model data Dart (`PetugasResiduDashboard`, `ResiduBinPickup`, `WhitelistStatus`) |
| `lib/app/data/repositories/petugas_residu_repository.dart` | Interface kontrak repository Petugas Residu |
| `lib/app/data/repositories/api_petugas_residu_repository.dart` | Implementasi komunikasi API Dio & kompresi foto |
| `lib/app/modules/petugas_residu/controllers/petugas_residu_controller.dart` | State Manager (Riverpod `PetugasResiduNotifier`) |
| `lib/app/modules/petugas_residu/widgets/petugas_whitelist_guard_widget.dart` | Guard proteksi akun whitelist approval DLH |
| `lib/app/modules/petugas_residu/views/petugas_residu_main_navigation_view.dart` | Bottom Navigation Container (4 Tab Utama) |
| `lib/app/modules/petugas_residu/views/petugas_residu_dashboard_view.dart` | Tab 1: Dashboard statistik KPI & jadwal pickup |
| `lib/app/modules/petugas_residu/timbangan_residu_view.dart` | Tab 2: Form input berat timbangan fisik & foto |
| `lib/app/modules/petugas_residu/views/riwayat_petugas_residu_view.dart` | Tab 3: Timeline riwayat setoran & pelanggaran |
| `lib/app/modules/petugas_residu/views/petugas_residu_profil_view.dart` | Tab 4: Layar profil petugas & informasi akun |
| `lib/app/modules/petugas_residu/views/lapor_pelanggaran_view.dart` | Form dialog/layar pelaporan pelanggaran warga |
| `lib/app/modules/petugas_residu/views/ganti_password_petugas_view.dart` | Layar form ubah kata sandi petugas |
| `lib/app/modules/petugas_residu/services/petugas_residu_fcm_service.dart` | Push notification service untuk alert penjemputan |

---

*Dokumen ini dibuat secara otomatis sebagai referensi resmi pengembang Modul Petugas Residu TrashCare.*
