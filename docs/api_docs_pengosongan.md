# API Dokumentasi — Pengajuan Pengosongan Tempat Sampah

Semua endpoint membutuhkan header:
```
Authorization: Bearer <JWT_TOKEN>
```

Base URL: `https://<VPS_HOST>/api/v1`

---

## 1. Cek Status Petugas Tetap Warga

**Cek apakah warga sudah punya petugas tetap. Jika pindah wilayah, `defaultPetugasId` auto-reset.**

```
GET /api/v1/bins/reset/petugas-status
Role: WARGA
```

### Response — Belum punya petugas tetap

```json
{
  "success": true,
  "data": {
    "hasDefaultPetugas": false,
    "petugas": null
  }
}
```

### Response — Sudah punya petugas tetap

```json
{
  "success": true,
  "data": {
    "hasDefaultPetugas": true,
    "petugas": {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "nama": "Budi Santoso",
      "foto": "https://vps.trashcare.id/uploads/budi.jpg"
    }
  }
}
```

### Error

| HTTP | `error` | Penyebab |
|------|---------|---------|
| 401 | `UNAUTHORIZED` | Token tidak valid / tidak ada |
| 403 | `FORBIDDEN` | Role bukan WARGA |
| 500 | `INTERNAL_SERVER_ERROR` | Server error |

---

## 2. Daftar Petugas di Wilayah Warga

**Hanya petugas dengan `role = PETUGAS_RESIDU`, `status = Aktif`, dan `rwId` sama dengan warga.**
**Wilayah diambil dari profil server — tidak bisa dimanipulasi frontend.**

```
GET /api/v1/bins/reset/petugas-wilayah
Role: WARGA
```

### Response — Ada petugas

```json
{
  "success": true,
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "Budi Santoso",
      "fotoProfil": "https://vps.trashcare.id/uploads/budi.jpg"
    },
    {
      "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "name": "Siti Rahayu",
      "fotoProfil": null
    }
  ]
}
```

### Response — Tidak ada petugas di wilayah (fallback ke RW)

```json
{
  "success": true,
  "data": []
}
```

> Jika `data` array kosong → tampilkan pesan di mobile:
> *"Belum ada petugas terdaftar di wilayah Anda. Pengajuan akan diteruskan ke Admin RW."*

### Error

| HTTP | `error` | Penyebab |
|------|---------|---------|
| 401 | `UNAUTHORIZED` | Token tidak valid |
| 403 | `FORBIDDEN` | Role bukan WARGA |
| 500 | `INTERNAL_SERVER_ERROR` | Server error |

---

## 3. Simpan Petugas Tetap

**Simpan pilihan petugas warga sebagai default. Dipakai pada pengajuan pertama.**
**Backend validasi: petugas wajib di RW yang sama dengan warga.**

```
POST /api/v1/bins/reset/set-default-petugas
Role: WARGA
Content-Type: application/json
```

### Request Body

```json
{
  "petugasId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

### Response — Sukses

```json
{
  "success": true,
  "data": {
    "success": true,
    "petugasId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }
}
```

### Error

| HTTP | `error` | Penyebab |
|------|---------|---------|
| 400 | `BAD_REQUEST` | `petugasId` tidak dikirim |
| 400 | `NOT_PETUGAS` | User yang dipilih bukan role PETUGAS_RESIDU |
| 403 | `WILAYAH_MISMATCH` | Petugas tidak bertugas di RW warga (anti-manipulasi) |
| 404 | `PETUGAS_NOT_FOUND` | `petugasId` tidak ada di database |
| 500 | `INTERNAL_SERVER_ERROR` | Server error |

---

## 4. Submit Pengajuan Pengosongan (JSON)

**Untuk submit via JSON (bukan file upload). Foto harus sudah diupload terlebih dahulu.**
**`petugasId` opsional — jika tidak dikirim, backend auto-ambil dari `defaultPetugasId` warga.**

```
POST /api/v1/bins/reset-request
Role: WARGA
Content-Type: application/json
```

### Request Body

```json
{
  "binId": "c3d4e5f6-a7b8-9012-cdef-123456789012",
  "evidencePhotoUrl": "https://vps.trashcare.id/uploads/bukti_penuh.jpg",
  "jenisSampah": "organik,anorganik",
  "petugasId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

> `petugasId` → opsional. Jika tidak dikirim, sistem pakai petugas tetap warga.
> `jenisSampah` → opsional. Format: `"organik"` / `"anorganik"` / `"organik,anorganik"`

### Response — Sukses (201)

```json
{
  "success": true,
  "data": {
    "id": "d4e5f6a7-b8c9-0123-defa-234567890123",
    "binId": "c3d4e5f6-a7b8-9012-cdef-123456789012",
    "userId": "e5f6a7b8-c9d0-1234-efab-345678901234",
    "petugasId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "jenisSampah": "organik,anorganik",
    "evidencePhotoUrl": "https://vps.trashcare.id/uploads/bukti_penuh.jpg",
    "status": "PENDING",
    "reviewedById": null,
    "createdAt": "2026-08-15T03:20:00.000Z",
    "updatedAt": "2026-08-15T03:20:00.000Z",
    "bin": {
      "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
      "qrCode": "TSC-0042",
      "rw": {
        "id": 3,
        "name": "RW 02",
        "kelurahan": null
      }
    },
    "user": {
      "id": "e5f6a7b8-c9d0-1234-efab-345678901234",
      "name": "Joko Widodo",
      "phone": "+6281234567890"
    }
  }
}
```

### Error

| HTTP | `error` | Penyebab |
|------|---------|---------|
| 400 | `BAD_REQUEST` | `binId` atau `evidencePhotoUrl` kosong |
| 400 | `DUPLICATE_REQUEST` | Sudah ada pengajuan PENDING untuk tempat sampah ini |
| 403 | `BIN_NOT_OWNED` | Tempat sampah bukan milik warga ini |
| 404 | `RESOURCE_NOT_FOUND` | `binId` tidak ditemukan |
| 500 | `INTERNAL_SERVER_ERROR` | Server error |

---

## 5. Submit Pengajuan Pengosongan (Mobile — Multipart)

**Untuk upload foto langsung dari kamera/galeri. Foto di-upload sekaligus dengan request.**

```
POST /api/v1/bins/reset
Role: WARGA
Content-Type: multipart/form-data
```

### Request Body (form-data)

| Field | Type | Wajib | Keterangan |
|-------|------|-------|-----------|
| `binId` | string | ✅ | ID tempat sampah |
| `evidence` | file | ✅ | Foto bukti (jpg/png/webp) |
| `petugasId` | string | ❌ | ID petugas tujuan (auto dari default jika kosong) |
| `jenisSampah` | string | ❌ | `"organik"` / `"anorganik"` / `"organik,anorganik"` |

### Response — Sukses (201)

```json
{
  "success": true,
  "data": {
    "id": "d4e5f6a7-b8c9-0123-defa-234567890123",
    "binId": "c3d4e5f6-a7b8-9012-cdef-123456789012",
    "userId": "e5f6a7b8-c9d0-1234-efab-345678901234",
    "petugasId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "jenisSampah": "organik",
    "status": "PENDING",
    "evidencePhotoUrl": "https://vps.trashcare.id/uploads/1723689600000-bukti.jpg",
    "createdAt": "2026-08-15T03:20:00.000Z"
  }
}
```

### Error

| HTTP | `error` | Penyebab |
|------|---------|---------|
| 400 | `BAD_REQUEST` | File foto tidak ada / `binId` kosong |
| 400 | `DUPLICATE_REQUEST` | Sudah ada pengajuan PENDING untuk tempat sampah ini |
| 403 | `BIN_NOT_OWNED` | Tempat sampah bukan milik warga |
| 404 | `RESOURCE_NOT_FOUND` | `binId` tidak ditemukan |
| 500 | `INTERNAL_SERVER_ERROR` | Server error |

---

## 6. Detail Pengajuan Berdasarkan ID

```
GET /api/v1/bins/reset-request/:id
Role: semua (auth wajib)
```

### Response — Sukses

```json
{
  "success": true,
  "data": {
    "id": "d4e5f6a7-b8c9-0123-defa-234567890123",
    "binId": "c3d4e5f6-a7b8-9012-cdef-123456789012",
    "userId": "e5f6a7b8-c9d0-1234-efab-345678901234",
    "petugasId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "jenisSampah": "organik,anorganik",
    "evidencePhotoUrl": "https://vps.trashcare.id/uploads/bukti.jpg",
    "status": "PENDING",
    "reviewedById": null,
    "createdAt": "2026-08-15T03:20:00.000Z",
    "updatedAt": "2026-08-15T03:20:00.000Z",
    "bin": {
      "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
      "qrCode": "TSC-0042"
    },
    "user": {
      "id": "e5f6a7b8-c9d0-1234-efab-345678901234",
      "name": "Joko Widodo"
    }
  }
}
```

### Error

| HTTP | `error` | Penyebab |
|------|---------|---------|
| 404 | `RESOURCE_NOT_FOUND` | ID pengajuan tidak ditemukan |
| 500 | `INTERNAL_SERVER_ERROR` | Server error |

---

## 7. Cek Status Pengajuan Aktif Warga

**Untuk menampilkan status pengajuan yang sedang berjalan di halaman warga.**

```
GET /api/v1/bins/reset-request/status
GET /api/v1/bins/reset/my-requests
Role: semua (auth wajib)
```

---

## 8. Daftar Semua Pengajuan (Admin/RW/Petugas)

**Scoped otomatis — Petugas hanya lihat pengajuan di wilayahnya.**

```
GET /api/v1/bins/reset-requests?status=PENDING
Role: SUPER_USER, ADMIN_DLH, RW, PETUGAS_RESIDU
```

### Query Params

| Param | Nilai | Keterangan |
|-------|-------|-----------|
| `status` | `PENDING` / `ON_PROGRESS` / `APPROVED` / `REJECTED` / `COMPLETED` | Filter status (opsional) |

### Response — Sukses

```json
{
  "success": true,
  "data": [
    {
      "id": "d4e5f6a7-b8c9-0123-defa-234567890123",
      "binId": "c3d4e5f6-a7b8-9012-cdef-123456789012",
      "userId": "e5f6a7b8-c9d0-1234-efab-345678901234",
      "petugasId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "jenisSampah": "organik",
      "evidencePhotoUrl": "https://vps.trashcare.id/uploads/bukti.jpg",
      "status": "PENDING",
      "reviewedById": null,
      "createdAt": "2026-08-15T03:20:00.000Z",
      "updatedAt": "2026-08-15T03:20:00.000Z",
      "bin": {
        "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
        "qrCode": "TSC-0042",
        "rw": {
          "id": 3,
          "name": "RW 02",
          "kelurahan": {
            "id": "kel-sekeloa",
            "name": "Sekeloa"
          }
        }
      },
      "user": {
        "id": "e5f6a7b8-c9d0-1234-efab-345678901234",
        "name": "Joko Widodo",
        "phone": "+6281234567890"
      }
    }
  ]
}
```

---

## 9. Review Pengajuan (Petugas/RW)

**Petugas update status pengajuan. Jika `APPROVED` atau `COMPLETED`, volume tempat sampah direset ke 0.**

```
PUT /api/v1/bins/reset-request/:id/review
Role: SUPER_USER, ADMIN_DLH, RW, PETUGAS_RESIDU
Content-Type: application/json
```

### Request Body

```json
{
  "status": "ON_PROGRESS"
}
```

> Nilai `status` yang valid: `APPROVED` | `REJECTED` | `ON_PROGRESS` | `COMPLETED`

### Efek per Status

| Status | Efek |
|--------|------|
| `ON_PROGRESS` | Notif ke warga: "Petugas sedang menuju lokasi" |
| `APPROVED` / `COMPLETED` | Volume bin reset ke 0 + notif ke warga: "Pengajuan disetujui" |
| `REJECTED` | Notif ke warga: "Foto ditolak, silakan ajukan ulang" |

### Response — Sukses

```json
{
  "success": true,
  "data": {
    "id": "d4e5f6a7-b8c9-0123-defa-234567890123",
    "status": "ON_PROGRESS",
    "reviewedById": "f6a7b8c9-d0e1-2345-fabc-456789012345",
    "updatedAt": "2026-08-15T04:00:00.000Z"
  }
}
```

### Error

| HTTP | `error` | Penyebab |
|------|---------|---------|
| 400 | `BAD_REQUEST` | Nilai `status` tidak valid |
| 404 | `RESOURCE_NOT_FOUND` | ID pengajuan tidak ditemukan |
| 500 | `INTERNAL_SERVER_ERROR` | Server error |

---

## 10. Approve Pengajuan (Shortcut — langsung COMPLETED)

```
PUT /api/v1/bins/reset/:id/approve
Role: SUPER_USER, ADMIN_DLH, RW, PETUGAS_RESIDU
```

Tidak perlu request body. Langsung set status `COMPLETED` + reset volume bin ke 0.

### Response — Sukses

```json
{
  "success": true,
  "data": {
    "id": "d4e5f6a7-b8c9-0123-defa-234567890123",
    "status": "COMPLETED",
    "reviewedById": "f6a7b8c9-d0e1-2345-fabc-456789012345",
    "updatedAt": "2026-08-15T04:05:00.000Z"
  }
}
```

---

## Alur Status Pengajuan

```
PENDING → ON_PROGRESS → COMPLETED
        → REJECTED
```

---

## Notifikasi Otomatis (Backend)

| Event | Penerima | Judul | Isi |
|-------|---------|-------|-----|
| Submit pengajuan | Petugas tujuan (atau semua staff RW jika belum ada petugas tetap) | Pengajuan Pengosongan Baru | `{nama} mengajukan pengosongan tempat sampah ({qrCode}) di {RW}` |
| Submit pengajuan | Warga | Pengajuan Pengosongan Dikirim | `Pengajuan ... berhasil dikirim. Status: PENDING.` |
| Status → ON_PROGRESS | Warga | Pengangkutan Sedang Berlangsung | `Petugas sedang menuju lokasi...` |
| Status → APPROVED/COMPLETED | Warga | Pengajuan Disetujui | `Petugas telah memverifikasi foto bukti Anda...` |
| Status → REJECTED | Warga | Pengajuan Ditolak | `Foto bukti ditolak... Silakan ajukan kembali.` |

---

## Catatan Implementasi Mobile

1. **Alur pertama kali:** Panggil `GET /reset/petugas-status` → jika `hasDefaultPetugas: false` → tampilkan `GET /reset/petugas-wilayah` → user pilih → `POST /reset/set-default-petugas`
2. **Alur berikutnya:** Langsung `POST /bins/reset` tanpa kirim `petugasId` — backend auto-resolve
3. **Ganti petugas:** Tampilkan tombol "Ganti Petugas" → ulangi step 1 (panggil `set-default-petugas` dengan ID baru)
4. **Tidak ada petugas di wilayah:** `GET /reset/petugas-wilayah` return `[]` → tampilkan pesan fallback, tetap bisa submit tanpa `petugasId`
