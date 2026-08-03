# DOKUMENTASI RESMI FLOW ALUR & INTEGRASI API MODUL PETUGAS RESIDU TRASHCARE

Dokumen ini disusun sebagai panduan teknis resmi untuk pengembang yang melanjutkan/mengembangkan **Modul Petugas Residu** pada aplikasi mobile **TrashCare** (Flutter Dart).

> [!IMPORTANT]
> **SPESIFIKASI KETAT ALUR TUNGGAL MODUL PETUGAS RESIDU:**
> - **TIDAK ADA FITUR/ALUR PENJEMPUTAN SAMPAH.**
> - **TIDAK ADA FITUR/ALUR PELAPORAN PELANGGARAN WARGA.**
> - Modul Petugas Residu **MURNI HANYA MEMILIKI 1 ALUR UTAMA**: Yaitu **Input Sampah Residu RT/RW** (mencatat hasil berat timbangan fisik & foto tempat sampah residu di wilayah RT/RW setempat yang dikirim langsung dan **masuk ke Web Monitoring RT/RW & Admin DLH**).

---

## 1. ARSITEKTUR ALUR TUNGGAL PETUGAS RESIDU

```
                          ┌─────────────────────────┐
                          │   Login Petugas Residu  │
                          └────────────┬────────────┘
                                       │
                          ┌────────────▼────────────┐
                          │  Whitelist Guard Check  │
                          │   (Persetujuan RW/DLH)  │
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
   │ - List Tempat    │ │   Residu (Kg)   │ │   Residu        │ │ - Ganti Password  │
   │   Sampah RT/RW   │ │ - Upload Foto   │ │ - Status Sync   │ │ - Logout          │
   │ - Tombol Utamna  │ │ - Masuk Web     │ │   Web RT/RW     │ │                   │
   │   Input Timbangan│ │   RT/RW         │ │                 │ │                   │
   └──────────────────┘ └─────────────────┘ └─────────────────┘ └───────────────────┘
```

---

## 2. DETAIL ALUR & SPESIFIKASI ENDPOINT API

### 2.1. Whitelist Access Guard (Persetujuan RW / DLH)
- **Tujuan:** Memastikan hanya Petugas Residu sah di wilayah RT/RW yang dapat menginputkan data timbangan ke Web RT/RW.
- **Flow:**
  1. Pengguna login sebagai `UserRole.petugasResidu`.
  2. `PetugasWhitelistGuardWidget` memeriksa `whitelistStatus`.
  3. Jika `APPROVED`, pengguna diizinkan menginputkan timbangan residu RT/RW.

---

### 2.2. Dashboard & List Tempat Sampah Residu RT/RW
- **Layar:** `PetugasResiduView` (Tab 1)

#### Endpoint A: Dashboard Ringkasan Residu
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
    "totalWeightKg": 42.5,
    "kpiScore": 93.8
  }
}
```

#### Endpoint B: List Tempat Sampah Residu RT/RW
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
      "isPickedUp": false
    }
  ]
}
```

---

### 2.3. Alur Tunggal: Input Sampah Residu ke Web RT/RW
- **Layar:** `TimbanganResiduView` (Tab 2)
- **Alur Kerja Petugas:**
  1. Petugas memindai QR Code tempat sampah residu / memilih dari daftar lokasi RT/RW.
  2. Petugas menginputkan **Berat Nyata Sampah Residu (Kg)**.
  3. Petugas memilih **Klasifikasi Residu** (*Residu Non-B3*, *Residu B3*, *Popok/Pembalut*, *Lainnya*).
  4. Petugas mengambil foto bukti timbangan (otomatis dikompresi `< 500KB` via `ImageCompressor`).
  5. Petugas menekan tombol **"Simpan & Kirim Timbangan"**. Data secara otomatis terkirim dan **langsung masuk ke Dashboard Web RT/RW**.

#### Endpoint: Submit Input Timbangan Residu (Masuk ke Web RT/RW)
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
  "message": "Data timbangan sampah residu berhasil dicatat dan dikirim ke Web RT/RW."
}
```

---

### 2.4. Riwayat Setoran Residu ke Web RT/RW
- **Layar:** `RiwayatPetugasResiduView` (Tab 3)
- Menampilkan seluruh histori input timbangan residu yang telah dicatat petugas dan tersimpan di Web RT/RW.
- **Endpoint:** `GET /api/v1/residu/riwayat`

---

### 2.5. Profil & Ganti Password
- **Layar:** `PetugasResiduProfilView` & `GantiPasswordPetugasView` (Tab 4)
- **Endpoint:** `POST /api/v1/auth/change-password`

---

## 3. DIREKTORI BERKAS MODUL PETUGAS RESIDU

| Path Berkas | Fungsi |
|---|---|
| `lib/app/data/models/petugas_residu_models.dart` | Model data Dart (`PetugasResiduDashboard`, `ResiduBinPickup`, `WhitelistStatus`) |
| `lib/app/data/repositories/api_petugas_residu_repository.dart` | Repositori API Dio & Kompresi Foto |
| `lib/app/modules/petugas_residu/controllers/petugas_residu_controller.dart` | State Manager Riverpod `PetugasResiduNotifier` |
| `lib/app/modules/petugas_residu/widgets/petugas_whitelist_guard_widget.dart` | Guard persetujuan Whitelist RW/DLH |
| `lib/app/modules/petugas_residu/views/petugas_residu_main_navigation_view.dart` | Container Bottom Navigation Bar |
| `lib/app/modules/petugas_residu/views/petugas_residu_dashboard_view.dart` | Tab 1: Dashboard statistik & daftar residu RT/RW |
| `lib/app/modules/petugas_residu/timbangan_residu_view.dart` | Tab 2: Form Input Sampah Residu ke Web RT/RW |
| `lib/app/modules/petugas_residu/views/riwayat_petugas_residu_view.dart` | Tab 3: Timeline Riwayat Timbangan Residu Web RT/RW |
| `lib/app/modules/petugas_residu/views/petugas_residu_profil_view.dart` | Tab 4: Profil Petugas & Ganti Password |

---

*Dokumen ini merupakan pedoman baku untuk pengembangan Modul Petugas Residu.*
