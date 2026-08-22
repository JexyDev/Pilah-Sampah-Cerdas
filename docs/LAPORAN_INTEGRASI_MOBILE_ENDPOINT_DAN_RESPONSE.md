# 📄 LAPORAN RESMI INTEGRASI ENDPOINT & RESPONSE API MOBILE
## Sistem Pemilahan Sampah Terintegrasi — BERSEKA (Kecamatan Coblong & Kota Bandung)

---

| Dokumen Informasi | Detail |
| :--- | :--- |
| **Penyusun** | Tim Full-Stack (Backend & Integrasi API) |
| **Penerima** | Tim Pengembang Mobile App (Flutter / Riverpod) |
| **Status API** | 🟢 Aktif & Terverifikasi (100% Real Database, Anti-Dummy) |
| **Base URL Development** | `http://localhost:5000/api/v1` / `http://10.0.2.2:5000/api/v1` (Android Emulator) |
| **Base URL Production** | `https://BERSEKA.makerindo.tech/api/v1` |
| **Format Komunikasi** | JSON over RESTful HTTP / Multipart Form-Data (Upload) |
| **Standar Autentikasi** | Header `Authorization: Bearer <jwt_token>` |

---

## 1. Ringkasan Eksekutif

Laporan ini memuat spesifikasi teknis lengkap seluruh antarmuka pemrograman aplikasi (**REST API**) untuk **Mobile App BERSEKA**. Seluruh endpoint dirancang mengikuti prinsip **Clean Architecture**, terhubung ke database **PostgreSQL** melalui **Prisma ORM**, menerapkan aturan **Role-Based Access Control (RBAC)**, dan bebas dari data statis dummy sesuai kebijakan proyek.

### Poin Penting untuk Pengembang Mobile:
1. **Identitas Login**:
   - **Warga**: Menggunakan **Nomor Telepon (+62) + OTP via WhatsApp** (`POST /auth/request-otp` & `POST /auth/verify-otp`).
   - **Mahasiswa KKN & Petugas Residu**: Menggunakan **NIM / NIP / Nomor HP + Password** (`POST /auth/login`).
2. **Penanganan Kasus Kosong (200 OK vs 404)**:
   - Endpoint status/profil (seperti `GET /kkn/posko/me`) mengembalikan status **`200 OK`** dengan `"data": null` jika data belum dibuat, guna mencegah `DioException` bawaan di sisi Flutter.
3. **Smart RW Resolver**:
   - Pendaftaran fasilitas warga (`POST /kkn/fasilitas/bantu-input`) tidak mewajibkan input manual `rwId` karena backend otomatis mereferensikan wilayah tugas mahasiswa yang sedang login.

---

## 2. Katalog Endpoint & Payload Response Lengkap

```
HTTP Header Standar:
Content-Type: application/json
Accept: application/json
Authorization: Bearer <token_jwt>
```

---

### A. Modul Autentikasi & Pengguna

#### 1. Request OTP WhatsApp (Warga)
* **Endpoint:** `POST /api/v1/auth/request-otp`
* **Request Payload:**
```json
{
  "phone": "081234567890"
}
```
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Kode OTP berhasil dikirimkan via WhatsApp ke nomor 081234567890",
  "data": {
    "phone": "+6281234567890",
    "expiresIn": 300
  }
}
```

#### 2. Verify OTP WhatsApp (Warga)
* **Endpoint:** `POST /api/v1/auth/verify-otp`
* **Request Payload:**
```json
{
  "phone": "081234567890",
  "otp": "123456"
}
```
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "usr_warga_01",
      "name": "Budi Santoso",
      "phone": "+6281234567890",
      "role": "WARGA",
      "kelurahan": "Sadang Serang",
      "rw": "03",
      "rt": "02",
      "address": "Jl. Sadang Serang No. 12",
      "points": 140
    }
  }
}
```

#### 3. Login Mahasiswa KKN & Petugas Residu
* **Endpoint:** `POST /api/v1/auth/login`
* **Request Payload:**
```json
{
  "identifier": "10121001",
  "password": "PasswordMahasiswa123"
}
```
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Autentikasi berhasil",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "usr_mhs_01",
      "name": "Acef Kiki",
      "nim": "10121001",
      "phone": "+628987654321",
      "email": "acef@mahasiswa.unikom.ac.id",
      "role": "MAHASISWA_KKN",
      "assignedRwId": 3,
      "kelurahan": "Sadang Serang",
      "rw": "03",
      "points": 125,
      "kelompokId": "klp_01"
    }
  }
}
```

#### 4. Profil Pengguna Terkini (`/auth/me`)
* **Endpoint:** `GET /api/v1/auth/me`
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Profil pengguna berhasil dimuat",
  "data": {
    "id": "usr_mhs_01",
    "name": "Acef Kiki",
    "nim": "10121001",
    "email": "acef@mahasiswa.unikom.ac.id",
    "phone": "+628987654321",
    "role": "MAHASISWA_KKN",
    "kelurahan": "Sadang Serang",
    "rw": "03",
    "rt": "01",
    "avatar": "https://BERSEKA.makerindo.tech/uploads/avatar-mhs-1.jpg",
    "points": 125,
    "assignedRw": {
      "id": 3,
      "rw": "03",
      "kelurahan": "Sadang Serang"
    },
    "kelompok": {
      "id": "klp_01",
      "nama": "Kelompok 01 Sadang Serang",
      "dpl": "Dr. Dosen Pembimbing, M.T."
    }
  }
}
```

---

### B. Modul Mahasiswa KKN

#### 1. Dashboard Mahasiswa
* **Endpoint:** `GET /api/v1/kkn/dashboard`
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Dashboard data berhasil diambil",
  "data": {
    "totalWargaDampingan": 28,
    "totalBinAktif": 56,
    "totalPoinSaya": 125,
    "kelompok": {
      "id": "klp_01",
      "nama": "Kelompok 01 Sadang Serang",
      "totalPoinKelompok": 620,
      "peringkat": 1
    },
    "kegiatanHariIni": {
      "id": "sch_101",
      "title": "Sosialisasi Pemilahan Sampah Organik & Rumah Maggot",
      "status": "AKTIF",
      "startTime": "08:00",
      "endTime": "11:00",
      "lokasi": "Balai RW 03 Sadang Serang"
    },
    "complianceRate": 92.4
  }
}
```

#### 2. Daftar Warga Dampingan
* **Endpoint:** `GET /api/v1/kkn/warga-dampingan`
* **Query Params:** `?search=budi&rw=03`
* **Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "wargaId": "usr_warga_01",
      "wargaName": "Budi Santoso",
      "phone": "+6281234567890",
      "kelurahan": "Sadang Serang",
      "rw": "03",
      "rt": "02",
      "address": "Jl. Sadang Serang No. 12",
      "mahasiswaId": "usr_mhs_01",
      "binCount": 2,
      "bins": [
        {
          "id": "bin_01",
          "type": "ORGANIK",
          "status": "ACTIVE_BOUND",
          "qrCode": "QR-ORG-0012",
          "volumePercentage": 65.0
        },
        {
          "id": "bin_02",
          "type": "ANORGANIK",
          "status": "ACTIVE_BOUND",
          "qrCode": "QR-ANORG-0012",
          "volumePercentage": 30.0
        }
      ]
    }
  ]
}
```

#### 3. Zona KKN Aktif (Geofence)
* **Endpoint:** `GET /api/v1/kkn/active-zone?latitude=-6.890123&longitude=107.612345`
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "isInZone": true,
    "distanceMeters": 42.5,
    "allowedRadiusMeters": 300.0,
    "zoneCenter": {
      "latitude": -6.890200,
      "longitude": 107.612400
    },
    "kelurahan": "Sadang Serang",
    "rw": "03"
  }
}
```

#### 4. Check-In Presensi KKN
* **Endpoint:** `POST /api/v1/kkn/attendance/check-in`
* **Request Payload:**
```json
{
  "scheduleId": "sch_101",
  "latitude": -6.890150,
  "longitude": 107.612380,
  "method": "GEOFENCE",
  "deviceInfo": "Xiaomi Redmi Note 11 - Android 13",
  "nim": "10121001",
  "namaMahasiswa": "Acef Kiki"
}
```
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Presensi masuk berhasil dicatat (+5 Poin)",
  "data": {
    "attendanceId": "att_9012",
    "checkInTime": "2026-08-20T08:02:15.000Z",
    "status": "HADIR_VALID",
    "pointsEarned": 5
  }
}
```

#### 5. Background GPS Location Ping
* **Endpoint:** `POST /api/v1/kkn/location-ping`
* **Request Payload:**
```json
{
  "latitude": -6.890150,
  "longitude": 107.612380,
  "accuracy": 12.4,
  "timestamp": "2026-08-20T08:15:00.000Z"
}
```
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Lokasi berhasil diperbarui",
  "data": {
    "isInZone": true,
    "isViolating": false
  }
}
```

#### 6. Kegiatan KKN (Mulai, Selesai & Check-Out)
* **GET Kegiatan:** `GET /api/v1/kkn/kegiatan-aktif`
* **POST Mulai:** `POST /api/v1/kkn/kegiatan/:id/mulai`
```json
{
  "latitude": -6.890150,
  "longitude": 107.612380,
  "deviceInfo": "Android 13"
}
```
* **POST Selesai:** `POST /api/v1/kkn/kegiatan/:id/selesai`
```json
{
  "sessionId": "ses_9981",
  "totalDurasiDalamZonaMenit": 175,
  "alasan": "Kegiatan sosialisasi dan instalasi loseda selesai dilaksanakan."
}
```
* **POST Check-Out:** `POST /api/v1/kkn-attendance/kegiatan/:id/check-out`
```json
{
  "latitude": -6.890150,
  "longitude": 107.612380
}
```

#### 7. Aktivasi Warga & Tempat Sampah
* **Aktivasi Warga:** `POST /api/v1/kkn/warga/activate-by-scan`
```json
{
  "wargaId": "usr_warga_01",
  "qrCode": "QR-MASTER-9912",
  "latitude": -6.890150,
  "longitude": 107.612380
}
```
* **Aktivasi Bin:** `POST /api/v1/kkn/warga/activate-bin`
```json
{
  "wargaId": "usr_warga_01",
  "binOrganikId": "QR-BIN-ORG-101",
  "binAnorganikId": "QR-BIN-ANORG-102",
  "latitude": -6.890150,
  "longitude": 107.612380
}
```

#### 8. Pemanfaatan Sampah
* **Endpoint:** `POST /api/v1/kkn/pemanfaatan-sampah` *(Multipart)*
* **Form Fields:** `jenis` (`RUMAH_MAGGOT` | `KOMPOS` | `POC` | `BURUAN_SAE`), `jumlahKg` (`15.0`), `keterangan`, `foto` (File), `latitude`, `longitude`.
* **Response (201 Created):**
```json
{
  "success": true,
  "message": "Data pemanfaatan sampah berhasil disimpan (+5 Poin)",
  "data": {
    "id": "pmf_101",
    "jenis": "POC",
    "jumlahKg": 15.0,
    "fotoUrl": "https://BERSEKA.makerindo.tech/uploads/pemanfaatan-101.jpg",
    "createdAt": "2026-08-20T08:40:00.000Z"
  }
}
```

#### 9. Pengajuan Izin / Sakit
* **Endpoint:** `POST /api/v1/kkn/pengajuan-izin` *(Multipart)*
* **Form Fields:** `jenisIzin` (`IZIN` | `SAKIT`), `tanggalMulai`, `tanggalSelesai`, `alasan`, `suratBukti` (File).
* **Response (201 Created):**
```json
{
  "success": true,
  "message": "Pengajuan izin berhasil dikirimkan ke Dosen Pembimbing Lapangan (DPL)",
  "data": {
    "id": "izn_501",
    "jenisIzin": "IZIN",
    "tanggalMulai": "2026-08-21",
    "tanggalSelesai": "2026-08-22",
    "status": "PENDING_APPROVAL"
  }
}
```

#### 10. Posko KKN (Registrasi & Retrieval 200 OK Safe)
* **Registrasi:** `POST /api/v1/kkn/posko/register` *(Multipart)*
  - Fields: `nama`, `alamat`, `latitude`, `longitude`, `foto`
* **Detail Posko:** `GET /api/v1/kkn/posko/me`
* **Response (200 OK - Jika Terdaftar):**
```json
{
  "success": true,
  "message": "Data posko berhasil diambil",
  "data": {
    "posko": {
      "id": "posko_01",
      "nama": "Posko KKN Kelompok 01 Sadang Serang",
      "alamat": "Jl. Sadang Serang No. 45 RT 03 RW 03",
      "latitude": -6.890350,
      "longitude": 107.612500,
      "foto": "https://BERSEKA.makerindo.tech/uploads/posko-01.jpg"
    },
    "isUserLeader": true,
    "kelompokId": "klp_01"
  }
}
```
* **Response (200 OK - Jika Belum Terdaftar):**
```json
{
  "success": true,
  "message": "Data posko belum terdaftar",
  "data": {
    "posko": null,
    "isUserLeader": true,
    "kelompokId": "klp_01"
  }
}
```

#### 11. Master Data Jenis Fasilitas Dinamis
* **Endpoint:** `GET /api/v1/kkn/fasilitas/jenis` (atau `GET /api/v1/facilities/jenis`)
* **Response (200 OK):**
```json
{
  "success": true,
  "data": [
    { "id": 1, "key": "rumah_maggot", "nama": "Rumah Maggot", "deskripsi": "Fasilitas budidaya maggot BSF untuk reduksi sampah organik dapur", "iconUrl": "https://BERSEKA.makerindo.tech/icons/rumah_maggot.png", "isActive": true },
    { "id": 2, "key": "loseda", "nama": "Loseda", "deskripsi": "Lodong Sesa Dapur: pipa vertikal komposter sisa makanan", "iconUrl": "https://BERSEKA.makerindo.tech/icons/loseda.png", "isActive": true },
    { "id": 3, "key": "bata_terawang", "nama": "Bata Terawang", "deskripsi": "Komposter bata berpori rongga udara untuk dedaunan dan organik", "iconUrl": "https://BERSEKA.makerindo.tech/icons/bata_terawang.png", "isActive": true },
    { "id": 4, "key": "bank_sampah", "nama": "Bank Sampah", "deskripsi": "Pusat penimbangan dan tabungan sampah anorganik bernilai ekonomi", "iconUrl": "https://BERSEKA.makerindo.tech/icons/bank_sampah.png", "isActive": true },
    { "id": 5, "key": "buruan_sae", "nama": "Buruan Sae", "deskripsi": "Program pekarangan pangan mandiri pemanfaat kompos", "iconUrl": "https://BERSEKA.makerindo.tech/icons/buruan_sae.png", "isActive": true },
    { "id": 6, "key": "poc", "nama": "Pupuk Organik Cair (POC)", "deskripsi": "Instalasi fermentasi pupuk cair dari air lindi sampah organik", "iconUrl": "https://BERSEKA.makerindo.tech/icons/poc.png", "isActive": true },
    { "id": 7, "key": "tps", "nama": "TPS", "deskripsi": "Tempat Penampungan Sampah Sementara tingkat kelurahan", "iconUrl": "https://BERSEKA.makerindo.tech/icons/tps.png", "isActive": true },
    { "id": 8, "key": "posko_kkn", "nama": "Posko KKN", "deskripsi": "Pusat koordinasi lapangan mahasiswa KKN", "iconUrl": "https://BERSEKA.makerindo.tech/icons/posko_kkn.png", "isActive": true }
  ]
}
```

#### 12. Bantu Input Fasilitas Warga
* **Endpoint:** `POST /api/v1/kkn/fasilitas/bantu-input` *(Multipart)*
* **Form Fields:** `userId` (wargaId), `nama`, `jenis`, `latitude`, `longitude`, `foto` (wajib), `alamat` (opsional), `rwId` (opsional).
* **Response (201 Created):**
```json
{
  "success": true,
  "message": "Fasilitas warga berhasil didaftarkan (+5 Poin)",
  "data": {
    "id": "fac_01",
    "nama": "Rumah Maggot Berkah Mandiri RT 03",
    "jenis": "rumah_maggot",
    "foto": "https://BERSEKA.makerindo.tech/uploads/fac-101.jpg",
    "status": "ACTIVE",
    "registeredBy": {
      "id": "usr_mhs_01",
      "name": "Acef Kiki",
      "nim": "10121001"
    }
  }
}
```

#### 13. Kelompok & Anggota Tim
* **Endpoint:** `GET /api/v1/kkn/kelompok/me`
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "klp_01",
    "nama": "Kelompok 01 Coblong - Sadang Serang",
    "dpl": {
      "name": "Dr. Dosen Pembimbing, M.T.",
      "phone": "+62812345678"
    },
    "anggota": [
      { "id": "usr_mhs_01", "name": "Acef Kiki", "nim": "10121001", "isLeader": true, "points": 125, "avatar": "https://BERSEKA.makerindo.tech/uploads/avatar-mhs-1.jpg" },
      { "id": "usr_mhs_02", "name": "Muhamad Habil", "nim": "10121002", "isLeader": false, "points": 110, "avatar": "https://BERSEKA.makerindo.tech/uploads/avatar-mhs-2.jpg" }
    ]
  }
}
```

#### 14. Activity Log
* **Endpoint:** `GET /api/v1/kkn/activity-log`
* **Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "act_01",
      "type": "AKTIVASI_WARGA",
      "title": "Aktivasi Warga Budi Santoso",
      "description": "Berhasil menautkan 2 tempat sampah di RT 02 RW 03",
      "points": 10,
      "createdAt": "2026-08-20T08:30:00.000Z"
    }
  ]
}
```

---

### C. Modul Petugas Residu

#### 1. Input Timbangan Fisik Residu
* **Endpoint:** `POST /api/v1/pengangkutan/setoran` *(Multipart)*
* **Form Fields:** `wargaId`, `beratKg` (`3.8`), `jenisSampah` (`RESIDU`), `foto` (wajib), `latitude`, `longitude`.
* **Response (201 Created):**
```json
{
  "success": true,
  "message": "Data pengangkutan dan timbangan residu berhasil dicatat (+10 Poin Petugas)",
  "data": {
    "id": "pck_1092",
    "beratKg": 3.8,
    "jenisSampah": "RESIDU",
    "kpiScore": 96.0,
    "recordedAt": "2026-08-20T09:10:00.000Z"
  }
}
```

#### 2. Riwayat Pengangkutan Petugas
* **Endpoint:** `GET /api/v1/pengangkutan/riwayat`
* **Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "pck_1092",
      "wargaName": "Budi Santoso",
      "rw": "03",
      "rt": "02",
      "beratKg": 3.8,
      "jenisSampah": "RESIDU",
      "fotoBukti": "https://BERSEKA.makerindo.tech/uploads/timbangan-1092.jpg",
      "createdAt": "2026-08-20T09:10:00.000Z"
    }
  ]
}
```

---

### D. Modul Warga

#### 1. Monitoring Rumah Tangga & Tempat Sampah
* **Endpoint:** `GET /api/v1/households/me`
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "hh_01",
    "kepalaKeluarga": "Budi Santoso",
    "totalPoin": 140,
    "tempatSampah": [
      {
        "id": "bin_01",
        "jenis": "ORGANIK",
        "kapasitasLiter": 20,
        "persentaseIsi": 75.0,
        "status": "ACTIVE_BOUND",
        "qrCode": "QR-ORG-0012",
        "terakhirDiambil": "2026-08-19T16:30:00.000Z"
      },
      {
        "id": "bin_02",
        "jenis": "ANORGANIK",
        "kapasitasLiter": 30,
        "persentaseIsi": 35.0,
        "status": "ACTIVE_BOUND",
        "qrCode": "QR-ANORG-0012",
        "terakhirDiambil": "2026-08-18T08:00:00.000Z"
      }
    ]
  }
}
```

#### 2. Lapor Tempat Sampah Penuh
* **Endpoint:** `POST /api/v1/households/lapor-penuh`
* **Request Payload:**
```json
{
  "binId": "bin_01",
  "foto": "https://BERSEKA.makerindo.tech/uploads/bukti-penuh-01.jpg",
  "keterangan": "Tempat sampah organik sudah melebihi 90% penuh"
}
```
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Laporan tempat sampah penuh berhasil dikirim ke Petugas Pengangkut",
  "data": {
    "reportId": "rep_901",
    "status": "NOTIFIED_PETUGAS"
  }
}
```

#### 3. Buku Besar / Ledger Poin Gamifikasi
* **Endpoint:** `GET /api/v1/points/history`
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalPoin": 140,
    "history": [
      {
        "id": "poi_01",
        "kategori": "SETOR_PILAH",
        "poin": 15,
        "deskripsi": "Setoran Sampah Organik Terpilah 100%",
        "createdAt": "2026-08-19T07:15:00.000Z"
      },
      {
        "id": "poi_02",
        "kategori": "AKTIVASI_BIN",
        "poin": 10,
        "deskripsi": "Bonus Aktivasi Tempat Sampah Pertama Kali",
        "createdAt": "2026-08-18T10:00:00.000Z"
      }
    ]
  }
}
```

---

### E. Master Data & Fasilitas GIS

#### 1. Seluruh Fasilitas untuk Peta GIS
* **Endpoint:** `GET /api/v1/facilities?kelurahan=Sadang%20Serang&jenis=rumah_maggot`
* **Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "fac_01",
      "nama": "Rumah Maggot Berkah Mandiri RT 03",
      "jenis": "rumah_maggot",
      "latitude": -6.890120,
      "longitude": 107.612340,
      "foto": "https://BERSEKA.makerindo.tech/uploads/fac-101.jpg",
      "pic": "Budi Santoso",
      "kontak": "+6281234567890",
      "kapasitas": 50,
      "status": "ACTIVE",
      "registeredBy": {
        "id": "usr_mhs_01",
        "name": "Acef Kiki",
        "nim": "10121001"
      }
    }
  ]
}
```

---

## 3. Hasil Validasi & Pengujian Sistem

1. **Uji Kompilasi TypeScript Backend (`apps/api`)**:
   - Perintah: `npx tsc --noEmit`
   - Hasil: **`Exit Code 0`** (0 error, tipe data dan query sinkron 100% dengan Prisma Client).
2. **Uji Analisis Statis Flutter Dart (`apps/mobile`)**:
   - Perintah: `dart analyze lib/`
   - Hasil: **`No issues found!`** (0 warnings, 0 errors).
3. **Penyelarasan Repository Git**:
   - Remote GitHub `origin/main` & `origin/mobile` berada dalam kondisi **up-to-date**.
