# UI/UX Flow Document
## pilahsampah.id | Backend API Service
**Versi:** 1.0.0 | **Author:** Jeremy Darrell | **Tanggal:** 8 Juli 2026

> **Catatan:** Backend tidak memiliki UI. Dokumen ini mendefinisikan **API Request/Response Flow** untuk setiap alur interaksi yang dipicu oleh Frontend Web dan Mobile — berfungsi sebagai kontrak teknis yang sinkron dengan `frontend/docs/ui_ux_flow.md` dan `mobile/docs/ui_ux_flow.md`.

---

## FLOW 1: Alur Login

### Dipicu oleh: Tombol "Masuk ke Dashboard" (Web) / Tombol "Login" (Mobile)

```
CLIENT                                    BACKEND
  |                                          |
  | POST /api/v1/auth/login                  |
  | { email, password, clientType }          |
  |----------------------------------------->|
  |                                          | 1. Validasi body (zod)
  |                                          | 2. Cari user by email (Prisma)
  |                                          | 3. bcrypt.compare(password, hash)
  |                                          | 4a. [WEB] Set-Cookie: jwt=...; HttpOnly
  |                                          | 4b. [MOBILE] { data: { accessToken } }
  |<-----------------------------------------|
  | 200 OK                                   |
```

**Request Body:**
```json
{
  "email": "admin@coblong.go.id",
  "password": "password123",
  "clientType": "web"
}
```

**Response 200 (Web):** Tidak ada body token. Cookie diset di header.
**Response 200 (Mobile):**
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "accessToken": "eyJ...",
    "user": { "id": "uuid", "name": "Admin Coblong", "role": "ADMIN" }
  }
}
```

**Response 401:**
```json
{ "success": false, "error": "INVALID_CREDENTIALS", "message": "Email atau password salah" }
```

---

## FLOW 2: Alur Scan QR + Simpan Transaksi Sampah

### Dipicu oleh: Tombol "Pindai QR Tong" (Mobile App — setelah AI detection success)

```
FLUTTER APP                               BACKEND
  |                                          |
  | POST /api/v1/bins/scan                   |
  | Bearer Token + body                      |
  |----------------------------------------->|
  |                                          | 1. Authenticate JWT
  |                                          | 2. Validate body (zod)
  |                                          | 3. Cari bin by qrCode
  |                                          | 4. Cek bin.type === wasteType?
  |                                          |    → Jika tidak: ApiError INVALID_BIN_TYPE
  |                                          | 5. Hitung estimatedVolume dari AI result
  |                                          | 6. BEGIN TRANSACTION (pessimistic lock)
  |                                          | 7. Cek overflow: current + new <= 25.0?
  |                                          |    → Jika tidak: ApiError BIN_OVERFLOW
  |                                          | 8. Update bin.currentVolumeLiter += volume
  |                                          | 9. Hitung weightKg: ORGANIC×0.4 / NON_ORGANIC×0.2
  |                                          | 10. Kalkulasi poin: weightKg × 100
  |                                          | 11. Insert WasteLog, PointHistory
  |                                          | 12. COMMIT TRANSACTION
  |                                          | 13. Cek: currentVolumeLiter >= 22.5?
  |                                          |     → Jika ya: Insert Notification + WS broadcast
  |<-----------------------------------------|
  | 201 Created                              |
```

**Request Body:**
```json
{
  "qrCode": "BIN-RT04-001-ORG",
  "wasteType": "ORGANIC",
  "aiRequestId": "uuid-dari-detect-mock",
  "estimatedVolumeLiter": 1.5
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Sampah berhasil dicatat",
  "data": {
    "wasteLogId": "uuid",
    "pointsEarned": 60,
    "totalPoints": 2840,
    "newVolumeLiter": 14.5,
    "binStatus": "NORMAL"
  }
}
```

**WebSocket Broadcast (jika bin ≥ 22.5L):**
```json
{
  "event": "bin_full_alert",
  "data": {
    "binId": "uuid",
    "householdName": "Bp. Asep Syaepudin",
    "address": "RT 04 / RW 05, No. 5",
    "currentVolumeLiter": 23.5,
    "percentage": 94
  }
}
```

---

## FLOW 3: Alur Deteksi AI Mock

### Dipicu oleh: Tombol "Foto Sampah Organik/Anorganik" (Mobile)

```
FLUTTER APP                               BACKEND
  |                                          |
  | POST /api/v1/waste/detect-mock           |
  | Bearer Token + body                      |
  |----------------------------------------->|
  |                                          | 1. Authenticate JWT
  |                                          | 2. Cek quota Redis:
  |                                          |    GET quota:{userId}:{date} >= 50?
  |                                          |    → Jika ya: 429 QUOTA_EXCEEDED
  |                                          | 3. Hitung SHA-256 dari imageBase64
  |                                          | 4. Cek hash Redis:
  |                                          |    GET image_hash:{hash}:{date}?
  |                                          |    → Jika ada: 409 DUPLICATE_IMAGE
  |                                          | 5. Tambah ke queue (max 100)
  |                                          |    → Jika queue penuh: 503 QUEUE_FULL
  |                                          | 6. Proses AI mock (delay 800-1800ms)
  |                                          |    Timer 2000ms → jika lewat: TIMEOUT
  |                                          | 7a. [SUCCESS] Random: wasteType, volume
  |                                          | 7b. [TIMEOUT] Quota dikembalikan (tidak dikurangi)
  |                                          | 7c. [IMAGE_UNREADABLE] 20% prob, quota dikembalikan
  |                                          | 8. Simpan AiRequestLog
  |                                          | 9. Increment quota Redis (jika SUCCESS)
  |<-----------------------------------------|
```

**Response 200 (SUCCESS):**
```json
{
  "success": true,
  "message": "Deteksi AI berhasil",
  "data": {
    "requestId": "uuid",
    "detectedType": "ORGANIC",
    "estimatedVolumeLiter": 1.5,
    "confidence": 0.92,
    "processingTimeMs": 1240,
    "status": "SUCCESS"
  }
}
```

**Response 408 (TIMEOUT):**
```json
{
  "success": false,
  "error": "AI_TIMEOUT",
  "message": "Koneksi lambat. Menggunakan estimasi default.",
  "data": {
    "requestId": "uuid",
    "defaultVolumeLiter": 1.0,
    "defaultType": null
  }
}
```

---

## FLOW 4: WebSocket Connection

### Dipicu oleh: React Dashboard / Flutter App saat mount

```
CLIENT                                    BACKEND
  |                                          |
  | WS ws://localhost:3000/ws?token=<jwt>   |
  |----------------------------------------->|
  |                                          | 1. Upgrade HTTP → WebSocket
  |                                          | 2. Verify JWT dari query param
  |                                          | 3. Daftarkan ws ke clients map[rtRwId]
  |                                          | 4. Send: { "event": "connected", "data": { "userId" } }
  |<-----------------------------------------|
  |                   ...                    |
  |<-----------------------------------------|
  | { "event": "bin_full_alert", "data": {} }|  (pushed by server saat ada tong penuh)
  |                                          |
  | ping (setiap 30 detik dari client)       |
  |----------------------------------------->|
  | pong                                     |
  |<-----------------------------------------|
```

---

## FLOW 5: Reset Volume Tong

### Dipicu oleh: Tombol "Reset Volume" di Dashboard Web (setelah konfirmasi modal)

```
POST /api/v1/bins/:id/empty
→ Authenticate + Authorize: ADMIN atau RT_RW (hanya RT yang sama)
→ Set bin.currentVolumeLiter = 0.0
→ Insert WasteLog dengan flag isReset: true
→ Broadcast WS: { "event": "capacity_update", "data": { binId, newVolume: 0 } }
→ Response 200: { "success": true, "message": "Volume tong berhasil direset" }
```

---

## FLOW 6: Koneksi Ngrok (Development Only)

```
1. Jalankan: ngrok http 3000
2. Ngrok URL: https://<id>.ngrok-free.app
3. Update .env:
   CORS_ORIGIN_NGROK="https://<id>.ngrok-free.app"
4. Flutter: Ubah BASE_URL di config ke URL ngrok
5. Semua request tetap menggunakan path yang sama: /api/v1/...
```
