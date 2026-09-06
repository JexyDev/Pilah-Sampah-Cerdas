# Mobile API Documentation — KKN Attendance LOSS MODE

> **Version:** 2.0 (LOSS MODE + Manual Jeda)
> **Base URL:** `https://api.berseka.id/api/v1/kkn`
> **Auth:** Bearer Token (JWT) — semua endpoint wajib header `Authorization: Bearer <token>`

---

## Ringkasan Perubahan dari Versi Lama

| Aspek | Versi Lama | Versi Baru (LOSS MODE) |
|-------|-----------|----------------------|
| GPS setelah mulai | Cek zona setiap ping, auto-pause jika keluar | **Tidak cek** — GPS hanya untuk peta DPL |
| Auto-pause/resume | Ya (grace period 90 detik) | **Dihapus** |
| Out-of-zone penalty | Ya (poin dipotong) | **Dihapus** |
| Jeda | Auto (GPS) + Manual | **Manual saja** (tombol mahasiswa) |
| Timer jeda | Tetap jalan | **Berhenti** saat jeda |
| Minimum checkout | Tidak ada di code | **Tidak ada** — bebas checkout kapan saja |
| Status HADIR_MEMENUHI | Durasi >= target | Sama |

---

## Status Presensi

| Status | Arti |
|--------|------|
| `BERLANGSUNG` | Timer berjalan aktif |
| `TERJEDA` | Timer berhenti (mahasiswa tekan Jeda) |
| `HADIR_MEMENUHI` | Selesai, durasi >= target (default 240 menit) |
| `HADIR_TIDAK_MEMENUHI` | Selesai, durasi < target |
| `BELUM_MULAI` | Ada jadwal hari ini tapi belum mulai |

---

## Endpoint GPS Ping

### `POST /api/v1/kkn/location-ping`

Kirim posisi GPS mahasiswa. Tidak berpengaruh pada presensi — hanya untuk monitoring DPL dan update durasi jika sesi BERLANGSUNG.

**Request Body:**
```json
{
  "latitude": -7.123456,
  "longitude": 112.654321
}
```

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Lokasi berhasil dilacak",
  "data": {
    "activeScheduleId": "sched_xxx",
    "status": "OK",
    "currentStatus": "BERLANGSUNG",
    "attendanceStatus": "BERLANGSUNG",
    "inZoneMinutes": 47,
    "actualInZoneSeconds": 2847,
    "actualInZoneMinutes": 47,
    "autoAttendanceTriggered": false,
    "poskoArea": null
  }
}
```

**Nilai `currentStatus`:** BERLANGSUNG | TERJEDA | BELUM_MULAI | TIDAK_ADA_KEGIATAN

**Catatan:** Kirim GPS ping semampunya. Jika gagal/timeout, abaikan — tidak mempengaruhi presensi.

---

## Endpoint Mulai Kegiatan

### `POST /api/v1/kkn/kegiatan/:scheduleId/mulai`

Mulai presensi. **Hanya di sini** backend cek apakah mahasiswa di dalam zona posko.

**Request Body (multipart/form-data atau JSON):**
```json
{
  "latitude": -7.123456,
  "longitude": 112.654321,
  "keterangan": "Opsional"
}
```

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Kegiatan KKN berhasil dimulai.",
  "data": {
    "id": "att_xxx",
    "status": "BERLANGSUNG",
    "attendedAt": "2026-09-02T08:00:00.000Z",
    "actualInZoneMinutes": 0,
    "durasiWajibMenit": 240
  }
}
```

**Response 422 — Di luar zona:**
```json
{
  "success": false,
  "error": "OUT_OF_ZONE",
  "message": "Kamu harus berada di zona kegiatan untuk mulai presensi."
}
```

---

## Endpoint Jeda Kegiatan

### `POST /api/v1/kkn/kegiatan/:scheduleId/jeda`

Jeda manual. Timer berhenti.

**Request Body:**
```json
{ "alasan": "Makan siang" }
```

> alasan opsional — default "Jeda manual oleh mahasiswa"

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Kegiatan dijeda. Timer berhenti.",
  "data": {
    "id": "att_xxx",
    "status": "TERJEDA",
    "actualInZoneMinutes": 47,
    "actualInZoneSeconds": 2847,
    "jedaAt": "2026-09-02T09:47:00.000Z"
  }
}
```

---

## Endpoint Lanjut Kegiatan (BARU v2.0)

### `POST /api/v1/kkn/kegiatan/:scheduleId/lanjut`

Resume setelah jeda. Timer lanjut dari titik berhenti.

**Request Body:** (kosong)

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Kegiatan dilanjutkan. Timer berjalan kembali.",
  "data": {
    "id": "att_xxx",
    "status": "BERLANGSUNG",
    "actualInZoneMinutes": 47,
    "actualInZoneSeconds": 2847,
    "resumeAt": "2026-09-02T09:55:00.000Z"
  }
}
```

---

## Endpoint Selesai Kegiatan

### `POST /api/v1/kkn/kegiatan/:scheduleId/selesai`

Checkout. Tidak ada syarat minimum durasi — bebas kapan saja.

**Request Body:**
```json
{
  "latitude": -7.123456,
  "longitude": 112.654321
}
```

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Presensi berhasil diselesaikan.",
  "data": {
    "id": "att_xxx",
    "status": "HADIR_MEMENUHI",
    "attendedAt": "2026-09-02T08:00:00.000Z",
    "checkOutAt": "2026-09-02T12:30:00.000Z",
    "actualInZoneMinutes": 243,
    "durasiWajibMenit": 240
  }
}
```

Status final: HADIR_MEMENUHI (>=240 menit) | HADIR_TIDAK_MEMENUHI (<240 menit)

---

## Kalkulasi Durasi

```
Durasi Aktual = (checkOutAt/sekarang - attendedAt) - SIGMA(waktuResume[i] - waktuJeda[i])
```

- actualInZoneSeconds — presisi detik, untuk timer UI mobile
- actualInZoneMinutes — menit, untuk status dan laporan

---

## Flow Lengkap

```
Login -> [Background GPS Ping 30 detik]
           |
           +-> Klik "Mulai" -> POST /mulai
           |       |--> 200: timer mulai
           |       `-> 422: di luar zona (error)
           |
           +-> (Opsional) Klik "Jeda" -> POST /jeda -> timer berhenti
           |
           +-> (Opsional) Klik "Lanjut" -> POST /lanjut -> timer lanjut
           |
           `-> Klik "Selesai" -> POST /selesai -> presensi tersimpan
```

---

## Catatan Mobile Dev

- GPS Ping: kirim tiap 30 detik, jika gagal skip (tidak pengaruhi presensi)
- Timer UI: init dari actualInZoneSeconds, tambah +1/detik, re-sync tiap ping
- Jika status TERJEDA: tampil tombol "Lanjut", timer freeze
- App restart: cek attendanceStatus dari ping, render sesuai status
- BREAKING: endpoint /out-of-zone-violation DIHAPUS di v2.0 — hapus dari kode mobile
