# 📱 Dokumentasi API BERSEKA Mobile App (Developer Reference)

> **Untuk:** Mobile Developer (Flutter / Riverpod)  
> **Versi API:** `v1`  
> **Base URL Development:** `http://localhost:5000/api/v1` (atau IP lokal / Emulator: `http://10.0.2.2:5000/api/v1`)  
> **Base URL Production:** `https://BERSEKA.makerindo.tech/api/v1`  
> **Standar Autentikasi:** JWT Bearer Token (`Authorization: Bearer <token>`)

---

## 📑 Daftar Isi
1. [Standar Header & Format Response](#1-standar-header--format-response)
2. [Autentikasi & Profil](#2-autentikasi--profil)
3. [Modul Mahasiswa KKN](#3-modul-mahasiswa-kkn)
   - [Dashboard & Statistik](#31-dashboard--statistik)
   - [Warga Dampingan](#32-warga-dampingan)
   - [Presensi, Geofencing & Kegiatan](#33-presensi-geofencing--kegiatan)
   - [Aktivasi Warga & Tempat Sampah](#34-aktivasi-warga--tempat-sampah)
   - [Pemanfaatan Sampah](#35-pemanfaatan-sampah)
   - [Pengajuan Izin & Sakit](#36-pengajuan-izin--sakit)
   - [Posko KKN](#37-posko-kkn)
   - [Fasilitas Warga (Master & Registrasi)](#38-fasilitas-warga-master--registrasi)
   - [Kelompok & Handover](#39-kelompok--handover)
   - [Activity Log & Riwayat](#310-activity-log--riwayat)
4. [Modul Petugas Residu](#4-modul-petugas-residu)
5. [Modul Warga](#5-modul-warga)
6. [Master Data & Fasilitas GIS](#6-master-data--fasilitas-gis)

---

## 1. Standar Header & Format Response

### Request Headers
```http
Content-Type: application/json
Accept: application/json
Authorization: Bearer <jwt_token_disini>
```
*Untuk endpoint upload foto gunakan `Content-Type: multipart/form-data`.*

### Format Response Sukses (Standard Envelope)
```json
{
  "success": true,
  "message": "Deskripsi sukses operasi",
  "data": {}
}
```

### Format Response Gagal (Error Envelope)
```json
{
  "success": false,
  "message": "Pesan kesalahan yang ramah pengguna",
  "error": "ERROR_CODE_OPTIONAL"
}
```

---

## 2. Autentikasi & Profil

### 2.1 Login Warga via Nomor HP & OTP
* **Endpoint:** `POST /auth/request-otp`
* **Role:** Publik / Warga
* **Request Body:**
```json
{
  "phone": "081234567890"
}
```
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Kode OTP telah dikirimkan via WhatsApp",
  "data": {
    "phone": "081234567890",
    "expiresIn": 300
  }
}
```

* **Endpoint:** `POST /auth/verify-otp`
* **Request Body:**
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
  "message": "Autentikasi OTP berhasil",
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
      "address": "Jl. Sadang Serang No. 12"
    }
  }
}
```

---

### 2.2 Login Mahasiswa KKN & Petugas Residu
* **Endpoint:** `POST /auth/login`
* **Role:** `MAHASISWA_KKN`, `PETUGAS_RESIDU`, dll.
* **Request Body:**
```json
{
  "identifier": "10121001",
  "password": "Password123"
}
```
*(Bisa menggunakan NIM/NIP atau Nomor Telepon / Email)*

* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "usr_mhs_01",
      "name": "Acef Kiki",
      "phone": "+628987654321",
      "email": "acef@mahasiswa.unikom.ac.id",
      "role": "MAHASISWA_KKN",
      "nim": "10121001",
      "kelompokId": "klp_01",
      "assignedRwId": 3,
      "kelurahan": "Sadang Serang",
      "rw": "03",
      "points": 120
    }
  }
}
```

---

### 2.3 Profil Saya (`/auth/me`)
* **Endpoint:** `GET /auth/me`
* **Headers:** `Authorization: Bearer <token>`
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Berhasil mengambil profil pengguna",
  "data": {
    "id": "usr_mhs_01",
    "name": "Acef Kiki",
    "email": "acef@mahasiswa.unikom.ac.id",
    "phone": "+628987654321",
    "role": "MAHASISWA_KKN",
    "avatar": "https://BERSEKA.makerindo.tech/uploads/avatar-1.jpg",
    "kelurahan": "Sadang Serang",
    "rw": "03",
    "points": 120,
    "kelompok": {
      "id": "klp_01",
      "nama": "Kelompok 01 Sadang Serang",
      "dplName": "Dr. Dosen Pendamping, M.T."
    }
  }
}
```

---

## 3. Modul Mahasiswa KKN

### 3.1 Dashboard & Statistik
* **Endpoint:** `GET /kkn/dashboard`
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Dashboard data berhasil diambil",
  "data": {
    "totalWargaDampingan": 25,
    "totalBinAktif": 48,
    "totalPoinSaya": 120,
    "kelompok": {
      "id": "klp_01",
      "nama": "Kelompok 01 Sadang Serang",
      "totalPoinKelompok": 580,
      "peringkat": 2
    },
    "kegiatanHariIni": {
      "id": "sch_01",
      "nama": "Sosialisasi Pemilahan Sampah Organik RT 02",
      "status": "SELESAI",
      "waktuMulai": "08:00",
      "waktuSelesai": "10:00"
    },
    "complianceRate": 88.5
  }
}
```

---

### 3.2 Warga Dampingan
* **Endpoint:** `GET /kkn/warga-dampingan`
* **Query Params (Opsional):** `?search=budi&rw=03`
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Daftar warga dampingan berhasil dimuat",
  "data": [
    {
      "id": "usr_warga_01",
      "nama": "Budi Santoso",
      "phone": "+6281234567890",
      "kelurahan": "Sadang Serang",
      "rw": "03",
      "rt": "02",
      "address": "Jl. Sadang Serang No. 12",
      "binCount": 2,
      "bins": [
        {
          "id": "bin_01",
          "type": "ORGANIK",
          "status": "ACTIVE_BOUND",
          "qrCode": "QR-ORG-0012",
          "volumePercentage": 65
        },
        {
          "id": "bin_02",
          "type": "ANORGANIK",
          "status": "ACTIVE_BOUND",
          "qrCode": "QR-ANORG-0012",
          "volumePercentage": 30
        }
      ]
    }
  ]
}
```

---

### 3.3 Presensi, Geofencing & Kegiatan

#### A. Zona KKN Aktif (`GET /kkn/active-zone`)
* **Endpoint:** `GET /kkn/active-zone?latitude=-6.890123&longitude=107.612345`
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "isInZone": true,
    "distance": 45.2,
    "allowedRadius": 300,
    "zoneCenter": {
      "latitude": -6.890200,
      "longitude": 107.612400
    },
    "kelurahan": "Sadang Serang",
    "rw": "03"
  }
}
```

#### B. Check-In Presensi (`POST /kkn/attendance/check-in`)
* **Endpoint:** `POST /kkn/attendance/check-in`
* **Request Body:**
```json
{
  "scheduleId": "sch_01",
  "latitude": -6.890150,
  "longitude": 107.612380,
  "method": "GEOFENCE",
  "deviceInfo": "Samsung Galaxy A52 - Android 13"
}
```
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Presensi masuk berhasil dicatat",
  "data": {
    "attendanceId": "att_01",
    "checkInTime": "2026-08-20T08:02:15.000Z",
    "status": "HADIR_VALID",
    "poinDidapat": 5
  }
}
```

#### C. Mulai & Selesai Kegiatan KKN
* **Mulai:** `POST /kkn/kegiatan/:id/mulai`
```json
{
  "latitude": -6.890150,
  "longitude": 107.612380,
  "deviceInfo": "Android Device"
}
```
* **Selesai:** `POST /kkn/kegiatan/:id/selesai`
```json
{
  "sessionId": "ses_01",
  "totalDurasiDalamZonaMenit": 120,
  "alasan": "Kegiatan sosialisasi pemilahan sampah selesai sesuai jadwal."
}
```
* **Check-Out:** `POST /kkn-attendance/kegiatan/:id/check-out`
```json
{
  "latitude": -6.890150,
  "longitude": 107.612380
}
```

#### D. Pelanggaran Keluar Zona (`POST /kkn/out-of-zone-violation`)
* **Request Body:**
```json
{
  "scheduleId": "sch_01",
  "outOfZoneMinutes": 15.5
}
```

---

### 3.4 Aktivasi Warga & Tempat Sampah

#### A. Aktivasi Warga (`POST /kkn/warga/activate-by-scan`)
* **Request Body:**
```json
{
  "wargaId": "usr_warga_01",
  "qrCode": "QR-MASTER-9912",
  "latitude": -6.890150,
  "longitude": 107.612380
}
```
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Warga berhasil diaktivasi dan ditautkan (+10 Poin Mahasiswa, +10 Poin Warga)",
  "data": {
    "wargaId": "usr_warga_01",
    "status": "ACTIVE_BOUND"
  }
}
```

#### B. Aktivasi Tempat Sampah (`POST /kkn/warga/activate-bin`)
* **Request Body:**
```json
{
  "wargaId": "usr_warga_01",
  "binOrganikId": "QR-BIN-ORG-101",
  "binAnorganikId": "QR-BIN-ANORG-102",
  "latitude": -6.890150,
  "longitude": 107.612380
}
```

---

### 3.5 Pemanfaatan Sampah
* **Endpoint:** `POST /kkn/pemanfaatan-sampah` (Multipart Form Data)
* **Headers:** `Content-Type: multipart/form-data`
* **Form Fields:**
  * `jenis`: `RUMAH_MAGGOT` | `KOMPOS` | `POC` | `BURUAN_SAE`
  * `jumlahKg`: `12.5` (number)
  * `keterangan`: `"Panen larva BSF mingguan siklus 2"`
  * `foto`: `[File binary JPG/PNG]` (wajib)
  * `latitude`: `-6.890150`
  * `longitude`: `107.612380`
* **Response (201 Created):**
```json
{
  "success": true,
  "message": "Data pemanfaatan sampah berhasil dicatat (+5 Poin)",
  "data": {
    "id": "pmf_01",
    "jenis": "RUMAH_MAGGOT",
    "jumlahKg": 12.5,
    "fotoUrl": "https://BERSEKA.makerindo.tech/uploads/pemanfaatan-123.jpg"
  }
}
```

---

### 3.6 Pengajuan Izin & Sakit
* **Endpoint:** `POST /kkn/pengajuan-izin` (Multipart Form Data)
* **Aturan Bisnis:** Minimal diajukan **H-1** (kecuali kondisi darurat/sakit dengan surat dokter).
* **Form Fields:**
  * `jenisIzin`: `IZIN` | `SAKIT` | `DISPENSASI_KAMPUS`
  * `tanggalMulai`: `2026-08-21`
  * `tanggalSelesai`: `2026-08-22`
  * `alasan`: `"Menghadiri sidang pra-skripsi di kampus UNIKOM"`
  * `suratBukti`: `[File binary PDF/JPG]` (opsional / wajib jika sakit)
* **Response (201 Created):**
```json
{
  "success": true,
  "message": "Pengajuan izin berhasil dikirim ke DPL",
  "data": {
    "id": "izn_01",
    "status": "PENDING_APPROVAL"
  }
}
```

---

### 3.7 Posko KKN

#### A. Registrasi Posko (`POST /kkn/posko/register`)
* **Headers:** `Content-Type: multipart/form-data`
* **Form Fields:**
  * `nama`: `"Posko KKN Kelompok 01 Sadang Serang"`
  * `alamat`: `"Jl. Sadang Serang No. 45 RT 03 RW 03"`
  * `latitude`: `-6.890350`
  * `longitude`: `107.612500`
  * `foto`: `[File binary JPG/PNG]`
* **Response (201 Created):**
```json
{
  "success": true,
  "message": "Posko KKN berhasil didaftarkan",
  "data": {
    "id": "posko_01",
    "nama": "Posko KKN Kelompok 01 Sadang Serang",
    "isVerified": true
  }
}
```

#### B. Detail Posko Saya (`GET /kkn/posko/me`)
* **Response (200 OK - Jika Posko Sudah Terdaftar):**
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
* **Response (200 OK - Jika Posko Belum Didaftarkan):**
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
*(Atau `"data": null` jika mahasiswa belum terdaftar dalam kelompok manapun)*

---

### 3.8 Fasilitas Warga (Master & Registrasi)

#### A. Master Data Jenis Fasilitas (`GET /kkn/fasilitas/jenis`)
* **Endpoint:** `GET /kkn/fasilitas/jenis` (atau `GET /facilities/jenis`)
* **Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "key": "rumah_maggot",
      "nama": "Rumah Maggot",
      "deskripsi": "Fasilitas budidaya maggot BSF untuk reduksi sampah organik dapur",
      "iconUrl": "https://BERSEKA.makerindo.tech/icons/rumah_maggot.png",
      "isActive": true
    },
    {
      "id": 2,
      "key": "loseda",
      "nama": "Loseda",
      "deskripsi": "Lodong Sesa Dapur: pipa vertikal komposter sisa makanan",
      "iconUrl": "https://BERSEKA.makerindo.tech/icons/loseda.png",
      "isActive": true
    },
    {
      "id": 3,
      "key": "bata_terawang",
      "nama": "Bata Terawang",
      "deskripsi": "Komposter bata berpori rongga udara untuk dedaunan dan organik",
      "iconUrl": "https://BERSEKA.makerindo.tech/icons/bata_terawang.png",
      "isActive": true
    },
    {
      "id": 4,
      "key": "bank_sampah",
      "nama": "Bank Sampah",
      "deskripsi": "Pusat penimbangan dan tabungan sampah anorganik bernilai ekonomi",
      "iconUrl": "https://BERSEKA.makerindo.tech/icons/bank_sampah.png",
      "isActive": true
    },
    {
      "id": 5,
      "key": "buruan_sae",
      "nama": "Buruan Sae",
      "deskripsi": "Program pekarangan pangan mandiri pemanfaat kompos",
      "iconUrl": "https://BERSEKA.makerindo.tech/icons/buruan_sae.png",
      "isActive": true
    },
    {
      "id": 6,
      "key": "poc",
      "nama": "Pupuk Organik Cair (POC)",
      "deskripsi": "Instalasi fermentasi pupuk cair dari air lindi sampah organik",
      "iconUrl": "https://BERSEKA.makerindo.tech/icons/poc.png",
      "isActive": true
    },
    {
      "id": 7,
      "key": "tps",
      "nama": "TPS",
      "deskripsi": "Tempat Penampungan Sampah Sementara tingkat kelurahan",
      "iconUrl": "https://BERSEKA.makerindo.tech/icons/tps.png",
      "isActive": true
    },
    {
      "id": 8,
      "key": "posko_kkn",
      "nama": "Posko KKN",
      "deskripsi": "Pusat koordinasi lapangan mahasiswa KKN",
      "iconUrl": "https://BERSEKA.makerindo.tech/icons/posko_kkn.png",
      "isActive": true
    }
  ]
}
```

#### B. Registrasi / Bantu Input Fasilitas (`POST /kkn/fasilitas/bantu-input`)
* **Headers:** `Content-Type: multipart/form-data`
* **Form Fields:**
  * `userId`: `"usr_warga_01"` (wajib, penanggung jawab warga)
  * `nama`: `"Rumah Maggot Berkah Mandiri RT 03"` (wajib)
  * `jenis`: `"rumah_maggot"` (wajib)
  * `latitude`: `-6.890120` (wajib)
  * `longitude`: `107.612340` (wajib)
  * `foto`: `[File binary JPG/PNG]` (wajib)
  * `alamat`: `"Jl. Sadang Serang No. 12 RT 03"` (opsional)
  * `rwId`: `3` (opsional, otomatis di-resolve backend jika kosong)
* **Response (201 Created):**
```json
{
  "success": true,
  "message": "Fasilitas berhasil didaftarkan dan menunggu verifikasi RW (+5 Poin)",
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

---

### 3.9 Kelompok & Handover

#### A. Informasi Kelompok Saya (`GET /kkn/kelompok/me`)
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "klp_01",
    "nama": "Kelompok 01 Coblong",
    "dpl": {
      "name": "Dr. Dosen Pendamping, M.T.",
      "phone": "+62812345678"
    },
    "anggota": [
      {
        "id": "usr_mhs_01",
        "name": "Acef Kiki",
        "nim": "10121001",
        "isLeader": true,
        "points": 120
      },
      {
        "id": "usr_mhs_02",
        "name": "Muhamad Habil",
        "nim": "10121002",
        "isLeader": false,
        "points": 110
      }
    ]
  }
}
```

#### B. Submit Handover Akhir Gelombang (`POST /kkn/handover`)
* **Request Body:**
```json
{
  "targetMahasiswaId": "usr_mhs_next_gen",
  "catatan": "Serah terima 25 warga dampingan dan 2 fasilitas komposter",
  "asetBatchIds": ["batch_qr_01", "batch_qr_02"]
}
```

---

### 3.10 Activity Log & Riwayat

#### A. Activity Log (`GET /kkn/activity-log`)
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

## 4. Modul Petugas Residu

### 4.1 Input Setoran & Timbangan Residu
* **Endpoint:** `POST /pengangkutan/setoran` (Multipart Form Data)
* **Form Fields:**
  * `wargaId`: `"usr_warga_01"`
  * `beratKg`: `3.5` (number hasil timbangan fisik industri)
  * `jenisSampah`: `"RESIDU"` | `"ORGANIK"` | `"ANORGANIK"`
  * `foto`: `[File binary JPG/PNG]` (bukti timbangan/pengangkutan)
  * `latitude`: `-6.890120`
  * `longitude`: `107.612340`
* **Response (201 Created):**
```json
{
  "success": true,
  "message": "Data pengangkutan dan timbangan residu berhasil dicatat",
  "data": {
    "id": "pck_01",
    "beratKg": 3.5,
    "kpiScore": 95.0
  }
}
```

---

## 5. Modul Warga

### 5.1 Status Tempat Sampah Warga (`GET /households/me`)
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
        "persentaseIsi": 75,
        "status": "ACTIVE_BOUND",
        "qrCode": "QR-ORG-0012"
      },
      {
        "id": "bin_02",
        "jenis": "ANORGANIK",
        "kapasitasLiter": 30,
        "persentaseIsi": 40,
        "status": "ACTIVE_BOUND",
        "qrCode": "QR-ANORG-0012"
      }
    ]
  }
}
```

### 5.2 Lapor Tempat Sampah Penuh (`POST /households/lapor-penuh`)
* **Request Body:**
```json
{
  "binId": "bin_01",
  "foto": "https://BERSEKA.makerindo.tech/uploads/penuh-12.jpg",
  "keterangan": "Tempat sampah organik sudah melebihi 90%"
}
```

---

## 6. Master Data & Fasilitas GIS

### 6.1 Daftar Seluruh Fasilitas untuk Peta GIS (`GET /facilities`)
* **Query Params:** `?kelurahan=Sadang%20Serang&jenis=rumah_maggot`
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
      "status": "ACTIVE"
    }
  ]
}
```

---

> 💡 **Catatan untuk Mobile Developer:**  
> Seluruh model data Dart untuk response di atas sudah tersedia di [`lib/app/data/models/`](file:///c:/Users/USER/.gemini/antigravity-ide/scratch/pilahsampah-id/lib/app/data/models/) dan endpoint URL terpusat di [`lib/app/core/values/api_constants.dart`](file:///c:/Users/USER/.gemini/antigravity-ide/scratch/pilahsampah-id/lib/app/core/values/api_constants.dart).
