# Refactor Baseline Snapshot - userController & binController

File ini berisi baseline snapshot untuk semua endpoint di `userController.ts` dan `binController.ts`. Nilai dinamis seperti UUID, Token, dan Tanggal telah disensor (`MASKED_*`) agar perbandingan diff setelah refactor konsisten.

Jumlah Skenario: 22

## Ringkasan Skenario
| Controller | Endpoint | Skenario | Method | Status |
|---|---|---|---|---|
| userController | `/api/v1/users` | Sukses - Admin | GET | 200 |
| userController | `/api/v1/users` | Error - Tanpa Token | GET | 401 |
| userController | `/api/v1/users` | Error - Warga Akses Get Users | GET | 403 |
| userController | `/api/v1/users` | Sukses - Create User | POST | 201 |
| userController | `/api/v1/users` | Error - Validation Missing Fields | POST | 400 |
| userController | `/api/v1/users` | Error - Conflict Email | POST | 409 |
| userController | `/api/v1/users/1af8993f-00b3-4312-b743-88be646c7382` | Sukses - Update User | PUT | 200 |
| userController | `/api/v1/users/00000000-0000-0000-0000-000000000000` | Error - User Not Found | PUT | 404 |
| userController | `/api/v1/users/1af8993f-00b3-4312-b743-88be646c7382` | Sukses - Delete User | DELETE | 200 |
| userController | `/api/v1/users/47961fde-05fa-48e8-a0b0-9e85e3572bdd` | Error - Delete Self | DELETE | 400 |
| binController | `/api/v1/bins` | Sukses - Get Bins | GET | 200 |
| binController | `/api/v1/bins/locations` | Sukses - Get Locations | GET | 200 |
| binController | `/api/v1/bins/areas` | Sukses - Get Areas | GET | 200 |
| binController | `/api/v1/bins/kelurahans` | Sukses - Get Kelurahans | GET | 200 |
| binController | `/api/v1/bins/my-bins` | Sukses - Get My Bins | GET | 200 |
| binController | `/api/v1/bins` | Sukses - Create Bin | POST | 201 |
| binController | `/api/v1/bins` | Error - Missing QR Code | POST | 500 |
| binController | `/api/v1/bins/QR-TEST-4823/status` | Sukses - Get Status | GET | 404 |
| binController | `/api/v1/bins/QR-NOT-EXIST/status` | Error - Bin Status Not Found | GET | 404 |
| binController | `/api/v1/bins/QR-TEST-4823/empty` | Sukses - Empty Bin | POST | 500 |
| binController | `/api/v1/bins/scan` | Error - Scan Out of Range | POST | 500 |
| binController | `/api/v1/bins/QR-TEST-4823` | Sukses - Delete Bin | DELETE | 500 |

## Rincian Skenario dan Response

### userController - GET /api/v1/users (Sukses - Admin)
**HTTP Status:** 200

```json
{
  "success": true,
  "data": [
    {
      "id": "MASKED_UUID",
      "name": "Jeremy Darrell Andreas",
      "email": "Jeremy@gmail.com",
      "role": "WARGA",
      "nik": "3271010101010101",
      "status": "Aktif",
      "wilayah": "RT 02 / RW 06 (Kel. Dago)",
      "setoran": 0,
      "totalPoin": 0,
      "createdAt": "MASKED_DATE"
    },
    {
      "id": "MASKED_UUID",
      "name": "SUPER USER",
      "email": "admin@pilahsampah.id",
      "role": "ADMIN",
      "nik": "-",
      "status": "Aktif",
      "wilayah": "-",
      "setoran": 0,
      "totalPoin": 0,
      "createdAt": "MASKED_DATE"
    },
    {
      "id": "MASKED_UUID",
      "name": "Dewi Lestari",
      "email": "warga@psc.id",
      "role": "WARGA",
      "nik": "3273012345678901",
      "status": "Aktif",
      "wilayah": "RT 04 / RW 06 (Kel. Dago)",
      "setoran": 3.5,
      "totalPoin": 275,
      "createdAt": "MASKED_DATE"
    },
    {
      "id": "MASKED_UUID",
      "name": "Budi RT",
      "email": "rt@psc.id",
      "role": "PETUGAS_RT",
      "nik": "3273012345678902",
      "status": "Aktif",
      "wilayah": "RT 02 / RW 06 (Kel. Dago)",
      "setoran": 0,
      "totalPoin": 0,
      "createdAt": "MASKED_DATE"
    },
    {
      "id": "MASKED_UUID",
      "name": "Asep RW",
      "email": "rw@psc.id",
      "role": "PETUGAS_RW",
      "nik": "3273012345678903",
      "status": "Aktif",
      "wilayah": "RT 02 / RW 06 (Kel. Dago)",
      "setoran": 0,
      "totalPoin": 0,
      "createdAt": "MASKED_DATE"
    },
    {
      "id": "MASKED_UUID",
      "name": "Siti Kelurahan",
      "email": "kelurahan@psc.id",
      "role": "PETUGAS_KELURAHAN",
      "nik": "3273012345678904",
      "status": "Aktif",
      "wilayah": "-",
      "setoran": 0,
      "totalPoin": 0,
      "createdAt": "MASKED_DATE"
    },
    {
      "id": "MASKED_UUID",
      "name": "Admin Utama",
      "email": "admin@psc.id",
      "role": "ADMIN",
      "nik": "3273012345678905",
      "status": "Aktif",
      "wilayah": "-",
      "setoran": 0,
      "totalPoin": 0,
      "createdAt": "MASKED_DATE"
    }
  ]
}
```

### userController - GET /api/v1/users (Error - Tanpa Token)
**HTTP Status:** 401

```json
{
  "error": "UNAUTHORIZED",
  "message": "Token otentikasi tidak ditemukan"
}
```

### userController - GET /api/v1/users (Error - Warga Akses Get Users)
**HTTP Status:** 403

```json
{
  "error": "FORBIDDEN",
  "message": "Anda tidak memiliki akses ke resource ini"
}
```

### userController - POST /api/v1/users (Sukses - Create User)
**HTTP Status:** 201

```json
{
  "success": true,
  "data": {
    "id": "MASKED_UUID",
    "name": "Test User Refactor",
    "email": "test_31034@psc.id",
    "role": "WARGA"
  }
}
```

### userController - POST /api/v1/users (Error - Validation Missing Fields)
**HTTP Status:** 400

```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "name, email, password, dan roleName wajib diisi"
}
```

### userController - POST /api/v1/users (Error - Conflict Email)
**HTTP Status:** 409

```json
{
  "success": false,
  "error": "CONFLICT",
  "message": "Email sudah digunakan"
}
```

### userController - PUT /api/v1/users/1af8993f-00b3-4312-b743-88be646c7382 (Sukses - Update User)
**HTTP Status:** 200

```json
{
  "success": true,
  "data": {
    "id": "MASKED_UUID",
    "name": "Test User Refactor Updated",
    "email": "test_31034@psc.id",
    "role": "WARGA"
  }
}
```

### userController - PUT /api/v1/users/00000000-0000-0000-0000-000000000000 (Error - User Not Found)
**HTTP Status:** 404

```json
{
  "success": false,
  "error": "NOT_FOUND",
  "message": "Pengguna tidak ditemukan"
}
```

### userController - DELETE /api/v1/users/1af8993f-00b3-4312-b743-88be646c7382 (Sukses - Delete User)
**HTTP Status:** 200

```json
{
  "success": true,
  "message": "Pengguna berhasil dihapus"
}
```

### userController - DELETE /api/v1/users/47961fde-05fa-48e8-a0b0-9e85e3572bdd (Error - Delete Self)
**HTTP Status:** 400

```json
{
  "success": false,
  "error": "BAD_REQUEST",
  "message": "Tidak bisa menghapus akun sendiri"
}
```

### binController - GET /api/v1/bins (Sukses - Get Bins)
**HTTP Status:** 200

```json
{
  "success": true,
  "data": [
    {
      "kode": "TS-COB-001",
      "lokasi": "Kategori: ORGANIC",
      "rtRw": "RT 04 / RW 06",
      "kapasitas": 20,
      "status": "Normal",
      "lastUpdate": "3:26:41 PM",
      "categoryId": "c702fee9-f75a-4fde-baf3-cbd5cbe0f4a2",
      "rtRwId": 1,
      "maxCapacityLiter": 25,
      "latitude": "-6.8895",
      "longitude": "107.6108",
      "currentVolumeLiter": 5,
      "category": {
        "id": "MASKED_UUID",
        "name": "ORGANIC",
        "pointsPerKg": 100,
        "description": "Sampah Organik",
        "createdAt": "MASKED_DATE",
        "updatedAt": "MASKED_DATE"
      }
    },
    {
      "kode": "TS-COB-002",
      "lokasi": "Kategori: NON_ORGANIC",
      "rtRw": "RT 04 / RW 06",
      "kapasitas": 48,
      "status": "Normal",
      "lastUpdate": "3:26:41 PM",
      "categoryId": "ba9c4d7b-2e1a-4f3b-994c-b44dd8ee0063",
      "rtRwId": 1,
      "maxCapacityLiter": 25,
      "latitude": "-6.889",
      "longitude": "107.6102",
      "currentVolumeLiter": 12,
      "category": {
        "id": "MASKED_UUID",
        "name": "NON_ORGANIC",
        "pointsPerKg": 50,
        "description": "Sampah Anorganik",
        "createdAt": "MASKED_DATE",
        "updatedAt": "MASKED_DATE"
      }
    },
    {
      "kode": "TS-COB-003",
      "lokasi": "Kategori: ORGANIC",
      "rtRw": "RT 02 / RW 06",
      "kapasitas": 94,
      "status": "Penuh",
      "lastUpdate": "3:26:41 PM",
      "categoryId": "c702fee9-f75a-4fde-baf3-cbd5cbe0f4a2",
      "rtRwId": 2,
      "maxCapacityLiter": 25,
      "latitude": "-6.8885",
      "longitude": "107.6115",
      "currentVolumeLiter": 23.5,
      "category": {
        "id": "MASKED_UUID",
        "name": "ORGANIC",
        "pointsPerKg": 100,
        "description": "Sampah Organik",
        "createdAt": "MASKED_DATE",
        "updatedAt": "MASKED_DATE"
      }
    },
    {
      "kode": "QR-TEST-4823",
      "lokasi": "Kategori: NON_ORGANIC",
      "rtRw": "RT 01 / RW 05",
      "kapasitas": 0,
      "status": "Normal",
      "lastUpdate": "5:51:55 PM",
      "categoryId": "ba9c4d7b-2e1a-4f3b-994c-b44dd8ee0063",
      "rtRwId": 3,
      "maxCapacityLiter": 25,
      "latitude": "-6.8912345",
      "longitude": "107.6123456",
      "currentVolumeLiter": 0,
      "category": {
        "id": "MASKED_UUID",
        "name": "NON_ORGANIC",
        "pointsPerKg": 50,
        "description": "Sampah Anorganik",
        "createdAt": "MASKED_DATE",
        "updatedAt": "MASKED_DATE"
      }
    },
    {
      "kode": "QR-TEST-8913",
      "lokasi": "Kategori: NON_ORGANIC",
      "rtRw": "RT 01 / RW 05",
      "kapasitas": 0,
      "status": "Normal",
      "lastUpdate": "5:54:51 PM",
      "categoryId": "ba9c4d7b-2e1a-4f3b-994c-b44dd8ee0063",
      "rtRwId": 3,
      "maxCapacityLiter": 25,
      "latitude": "-6.8912345",
      "longitude": "107.6123456",
      "currentVolumeLiter": 0,
      "category": {
        "id": "MASKED_UUID",
        "name": "NON_ORGANIC",
        "pointsPerKg": 50,
        "description": "Sampah Anorganik",
        "createdAt": "MASKED_DATE",
        "updatedAt": "MASKED_DATE"
      }
    },
    {
      "kode": "QR-TEST-6435",
      "lokasi": "Kategori: NON_ORGANIC",
      "rtRw": "RT 01 / RW 05",
      "kapasitas": 0,
      "status": "Normal",
      "lastUpdate": "5:57:54 PM",
      "categoryId": "ba9c4d7b-2e1a-4f3b-994c-b44dd8ee0063",
      "rtRwId": 3,
      "maxCapacityLiter": 25,
      "latitude": "-6.8912345",
      "longitude": "107.6123456",
      "currentVolumeLiter": 0,
      "category": {
        "id": "MASKED_UUID",
        "name": "NON_ORGANIC",
        "pointsPerKg": 50,
        "description": "Sampah Anorganik",
        "createdAt": "MASKED_DATE",
        "updatedAt": "MASKED_DATE"
      }
    }
  ]
}
```

### binController - GET /api/v1/bins/locations (Sukses - Get Locations)
**HTTP Status:** 200

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "rw": "RW 05",
      "kelurahan": "Dago",
      "rtCount": 1,
      "titikCount": 3,
      "patuh": 75
    },
    {
      "id": 2,
      "rw": "RW 06",
      "kelurahan": "Dago",
      "rtCount": 2,
      "titikCount": 3,
      "patuh": 100
    }
  ]
}
```

### binController - GET /api/v1/bins/areas (Sukses - Get Areas)
**HTTP Status:** 200

```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "kelurahanId": "59b01a95-5ebe-49e2-a70e-95c90a70c6c7",
      "name": "RT 01 / RW 05",
      "createdAt": "MASKED_DATE",
      "updatedAt": "MASKED_DATE",
      "kelurahan": {
        "id": "MASKED_UUID",
        "name": "Dago",
        "createdAt": "MASKED_DATE",
        "updatedAt": "MASKED_DATE"
      }
    },
    {
      "id": 2,
      "kelurahanId": "59b01a95-5ebe-49e2-a70e-95c90a70c6c7",
      "name": "RT 02 / RW 06",
      "createdAt": "MASKED_DATE",
      "updatedAt": "MASKED_DATE",
      "kelurahan": {
        "id": "MASKED_UUID",
        "name": "Dago",
        "createdAt": "MASKED_DATE",
        "updatedAt": "MASKED_DATE"
      }
    },
    {
      "id": 1,
      "kelurahanId": "59b01a95-5ebe-49e2-a70e-95c90a70c6c7",
      "name": "RT 04 / RW 06",
      "createdAt": "MASKED_DATE",
      "updatedAt": "MASKED_DATE",
      "kelurahan": {
        "id": "MASKED_UUID",
        "name": "Dago",
        "createdAt": "MASKED_DATE",
        "updatedAt": "MASKED_DATE"
      }
    }
  ]
}
```

### binController - GET /api/v1/bins/kelurahans (Sukses - Get Kelurahans)
**HTTP Status:** 200

```json
{
  "success": true,
  "data": [
    {
      "id": "MASKED_UUID",
      "name": "Cigadung",
      "createdAt": "MASKED_DATE",
      "updatedAt": "MASKED_DATE"
    },
    {
      "id": "MASKED_UUID",
      "name": "Dago",
      "createdAt": "MASKED_DATE",
      "updatedAt": "MASKED_DATE"
    }
  ]
}
```

### binController - GET /api/v1/bins/my-bins (Sukses - Get My Bins)
**HTTP Status:** 200

```json
{
  "success": true,
  "data": [
    {
      "id": "MASKED_UUID",
      "qrCode": "TS-COB-001",
      "category": "ORGANIC",
      "currentVolumeLiter": 5,
      "maxCapacityLiter": 25,
      "kapasitas": 20,
      "rtRw": "RT 04 / RW 06",
      "status": "Normal"
    },
    {
      "id": "MASKED_UUID",
      "qrCode": "TS-COB-002",
      "category": "NON_ORGANIC",
      "currentVolumeLiter": 12,
      "maxCapacityLiter": 25,
      "kapasitas": 48,
      "rtRw": "RT 04 / RW 06",
      "status": "Normal"
    }
  ]
}
```

### binController - POST /api/v1/bins (Sukses - Create Bin)
**HTTP Status:** 201

```json
{
  "success": true,
  "data": {
    "id": "MASKED_UUID",
    "qrCode": "QR-TEST-4151",
    "categoryId": "ba9c4d7b-2e1a-4f3b-994c-b44dd8ee0063",
    "maxCapacityLiter": "25",
    "currentVolumeLiter": "0",
    "rtRwId": 3,
    "kelurahanId": "59b01a95-5ebe-49e2-a70e-95c90a70c6c7",
    "latitude": "-6.8912345",
    "longitude": "107.6123456",
    "createdAt": "MASKED_DATE",
    "updatedAt": "MASKED_DATE"
  }
}
```

### binController - POST /api/v1/bins (Error - Missing QR Code)
**HTTP Status:** 500

```json
{
  "error": "INTERNAL_SERVER_ERROR",
  "message": "Gagal membuat Tempat Sampah"
}
```

### binController - GET /api/v1/bins/QR-TEST-4823/status (Sukses - Get Status)
**HTTP Status:** 404

```json
{
  "error": "RESOURCE_NOT_FOUND",
  "message": "Tong sampah tidak ditemukan"
}
```

### binController - GET /api/v1/bins/QR-NOT-EXIST/status (Error - Bin Status Not Found)
**HTTP Status:** 404

```json
{
  "error": "RESOURCE_NOT_FOUND",
  "message": "Tong sampah tidak ditemukan"
}
```

### binController - POST /api/v1/bins/QR-TEST-4823/empty (Sukses - Empty Bin)
**HTTP Status:** 500

```json
{
  "error": "FETCH_ERROR",
  "message": "Body is unusable: Body has already been read"
}
```

### binController - POST /api/v1/bins/scan (Error - Scan Out of Range)
**HTTP Status:** 500

```json
{
  "error": "FETCH_ERROR",
  "message": "Request with GET/HEAD method cannot have body."
}
```

### binController - DELETE /api/v1/bins/QR-TEST-4823 (Sukses - Delete Bin)
**HTTP Status:** 500

```json
{
  "error": "FETCH_ERROR",
  "message": "Body is unusable: Body has already been read"
}
```
