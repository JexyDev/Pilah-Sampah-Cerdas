# DOKUMENTASI REVISI FLOW ARSITEKTUR & INTEGRASI API MODUL PETUGAS RESIDU TRASHCARE

Dokumen ini disusun sebagai panduan teknis dan operasional resmi untuk pengembang yang melanjutkan/mengembangkan **Modul Petugas Residu** pada aplikasi mobile **TrashCare** (Flutter Dart).

> [!IMPORTANT]
> **CATATAN REVISI ALUR UTAMA (SANGAT PENTING):**
> - **TIDAK ADA FLOW / FITUR PENJEMPUTAN SAMPAH** pada Modul Petugas Residu.
> - Modul Petugas Residu murni berfokus pada **Pencatatan & Input Timbangan Fisik Sampah Residu RT/RW** oleh Petugas Lapangan.
> - Seluruh data hasil timbangan dan laporan pelanggaran yang diinputkan oleh Petugas Residu akan **langsung terhubung dan otomatis masuk ke Web Monitoring RT/RW & Admin DLH**.

---

## 1. IKHTISAR MODUL PETUGAS RESIDU

Modul Petugas Residu dirancang khusus untuk petugas kebersihan lapangan / petugas residu wilayah. Fokus modul ini meliputi:
1. **Pemeriksaan Status Whitelist Account:** Verifikasi akses keamanan akun petugas berdasarkan persetujuan Pengurus RW / Admin DLH.
2. **Monitoring Daftar Tempat Sampah Residu RT/RW:** Memantau daftar tempat sampah residu di wilayah penugasan (RT/RW & Kelurahan) yang siap diinput timbangannya.
3. **Pencatatan & Input Hasil Timbangan Residu:** Memasukkan berat nyata (Kg), klasifikasi residu, dan foto bukti timbangan yang akan **langsung masuk ke Web RT/RW**.
4. **Pelaporan Pelanggaran Warga (Violation Report):** Melaporkan pelanggaran jika tempat sampah residu diisi sampah tercampur organik/anorganik/B3 dengan bukti foto (data langsung terhubung ke Web RT/RW & sistem poin warga).
5. **Monitoring KPI & Riwayat Aktivitas Petugas:** Pantauan performa pencatatan, ketepatan waktu window input, dan akurasi data timbangan.

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
│ - List Tempat    │ │ - Upload Foto   │ │ - Log Violation │ │ - Ganti Password  │
│   Sampah RT/RW   │ │ - QR Scanner    │ │ - Status Sync   │ │ - Logout          │
│ - Lapor Violation│ │ - Masuk Web     │ │   Web RT/RW     │ │                   │
└──────────────────┘ └─────────────────┘ └─────────────────┘ └───────────────────┘
```

---

## 3. RINCIAN SPESIFIKASI ALUR & INTEGRASI ENDPOINT API

### 3.1. Whitelist Access Guard & Profiling
* **Tujuan:** Memastikan hanya petugas yang disetujui Pengurus RW / Admin DLH yang dapat menginputkan data timbangan residu ke Web RT/RW.
* **Flow:**
  1. Pengguna login dengan `UserRole.petugasResidu`.
  2. Guard Widget (`PetugasWhitelistGuardWidget`) membaca `user.whitelistStatus`.
  3. Jika `PENDING` / `REJECTED`, aplikasi menampilkan layar restriksi.
  4. Jika `APPROVED`, pengguna otomatis masuk ke `PetugasResiduMainNavigationView`.

---

### 3.2. Dashboard Performa & Daftar Residu RT/RW
* **Tab 1:** `PetugasResiduDashboardView` / `PetugasResiduView`

#### Endpoint A: Ringkasan Dashboard Petugas Residu
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

#### Endpoint B: List Tempat Sampah Residu RT/RW (Siap Input Timbangan)
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

### 3.3. Input Timbangan Fisik Residu (Masuk ke Web RT/RW)
* **Tab 2:** `TimbanganResiduView`
* **Flow:**
  1. Petugas melakukan Scan QR Code atau memilih Tempat Sampah Residu warga dari daftar RT/RW.
  2. Petugas menginputkan **Berat Nyata Hasil Timbangan (Kg)**.
  3. Petugas memilih **Klasifikasi Residu** (*Residu Non-B3*, *Residu B3*, *Popok/Pembalut*, *Lainnya*).
  4. Petugas mengambil foto bukti timbangan (dikompresi otomatis `< 500KB` via `ImageCompressor`).
  5. Petugas menekan tombol **"Simpan & Kirim Timbangan"**. Data langsung dikirim dan **otomatis terarsip di Web Monitoring RT/RW & DLH**.

#### Endpoint: Submit Input Timbangan Residu (Masuk Web RT/RW)
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
  "message": "Data timbangan residu berhasil dicatat dan masuk ke Dashboard Web RT/RW."
}
```

---

### 3.4. Pelaporan Pelanggaran Sampah Residu Tercampur (Violation Report)
* **Form View:** `LaporPelanggaranView`
* **Flow:**
  1. Apabila petugas mendapati tempat sampah residu diisi oleh sampah organik/anorganik tercampur.
  2. Petugas memilih QR Code tempat sampah warga.
  3. Petugas menginputkan **Jenis Pelanggaran** dan **Tingkat Keparahan** (`LOW`, `MEDIUM`, `SEVERE`).
  4. Petugas menyertakan foto bukti pelanggaran (dikompresi `< 500KB`).
  5. Petugas menekan tombol **"Kirim Laporan Pelanggaran"**. Laporan langsung masuk ke **Web RT/RW** dan memicu pengurangan poin ketaatan warga.

#### Endpoint: Submit Pelanggaran ke Web RT/RW
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
  "message": "Laporan pelanggaran berhasil dicatat di Web RT/RW."
}
```

---

### 3.5. Riwayat Input Timbangan & Pelanggaran
* **Tab 3:** `RiwayatPetugasResiduView`
* Menampilkan daftar histori penimbangan dan laporan yang telah diinput petugas dan tersinkronisasi dengan Web RT/RW.
* **Endpoint:** `GET /api/v1/residu/riwayat`

---

### 3.6. Profil & Ganti Password
* **Tab 4:** `PetugasResiduProfilView` & `GantiPasswordPetugasView`
* Fitur ubah kata sandi via **Endpoint:** `POST /api/v1/auth/change-password`.

---

## 4. RANGKUMAN DIREKTORI KODE MODUL PETUGAS RESIDU

| Path Berkas | Fungsi / Komponen |
|---|---|
| `lib/app/data/models/petugas_residu_models.dart` | Model data Dart (`PetugasResiduDashboard`, `ResiduBinPickup`, `WhitelistStatus`) |
| `lib/app/data/repositories/petugas_residu_repository.dart` | Interface kontrak repository Petugas Residu |
| `lib/app/data/repositories/api_petugas_residu_repository.dart` | Implementasi komunikasi API Dio & kompresi foto |
| `lib/app/modules/petugas_residu/controllers/petugas_residu_controller.dart` | State Manager (Riverpod `PetugasResiduNotifier`) |
| `lib/app/modules/petugas_residu/widgets/petugas_whitelist_guard_widget.dart` | Guard proteksi akun whitelist approval RW/DLH |
| `lib/app/modules/petugas_residu/views/petugas_residu_main_navigation_view.dart` | Bottom Navigation Container (4 Tab Utama) |
| `lib/app/modules/petugas_residu/views/petugas_residu_dashboard_view.dart` | Tab 1: Dashboard statistik KPI & daftar residu RT/RW |
| `lib/app/modules/petugas_residu/timbangan_residu_view.dart` | Tab 2: Form input berat timbangan fisik & foto |
| `lib/app/modules/petugas_residu/views/riwayat_petugas_residu_view.dart` | Tab 3: Timeline riwayat setoran (sinkron Web RT/RW) |
| `lib/app/modules/petugas_residu/views/petugas_residu_profil_view.dart` | Tab 4: Layar profil petugas & informasi akun |
| `lib/app/modules/petugas_residu/views/lapor_pelanggaran_view.dart` | Form pelaporan pelanggaran ke Web RT/RW |
| `lib/app/modules/petugas_residu/views/ganti_password_petugas_view.dart` | Layar form ubah kata sandi petugas |

---

*Dokumen revisi ini dibuat sebagai referensi resmi pengembang Modul Petugas Residu TrashCare.*
