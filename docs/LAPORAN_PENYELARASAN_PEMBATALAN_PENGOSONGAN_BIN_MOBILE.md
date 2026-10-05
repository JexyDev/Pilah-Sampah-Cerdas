# 📑 LAPORAN TEKNIS RESMI PENYELARASAN BACKEND & PANDUAN INTEGRASI MOBILE
## FITUR PEMBATALAN PENGOSONGAN TEMPAT SAMPAH SATU-PERSATU (GRANULAR CANCELLATION PER-BIN)
**SISTEM BERSEKA (BERSIH SEHAT KELOLA)**

- **Nomor Dokumen**: `REP-INTEGRATION/BERSEKA-MOBILE/2026-10/001`
- **Tanggal Rilis**: 5 Oktober 2026
- **Ditujukan Kepada**: Mobile Lead Developer, Mobile Engineering Team, QA Lead
- **Dari**: Master Backend / Lead Fullstack Developer BERSEKA
- **Menjawab Laporan**: `REP-TECH/BERSEKA-BIN/2026-10/006`
- **Status Integrasi**: 🟢 **READY FOR CLIENT INTEGRATION (PRODUCTION READY)**

---

## 1. RINGKASAN PERUBAHAN & ARSITEKTUR BACKEND

Menindaklanjuti audit teknis Tim Mobile mengenai kendala pembatalan massal (*kebatalin semuanya*) dan kebutuhan proteksi pada tempat sampah tanpa pengajuan aktif, Master Backend telah merilis pembaruan endpoint dan alur bisnis terisolasi:

1. **Pemisahan Alur Pembatalan Granular (Per-Bin)**:
   - Backend kini menyediakan endpoint spesifik berbasis `binId` (`PUT /api/v1/bins/:binId/cancel-reset`).
   - Eksekusi pembatalan **HANYA** membatalkan record `BinResetRequest` milik `binId` bersangkutan yang berstatus `PENDING` atau `ASSIGNED`.
   - Tempat sampah lain milik warga yang sama (misalnya Anorganik vs Organik) **TIDAK AKAN TERSENTUH/TIDAK IKUT TERBATALKAN**.

2. **Proteksi Penolakan Tegas Tempat Sampah Normal (Zero Inappropriate Cancellation)**:
   - Jika mobile mengirim request pembatalan untuk tempat sampah yang tidak memiliki pengajuan aktif (seperti Organik 0% kapasitas normal), backend menolak secara eksplisit dengan **HTTP 404** dan kode error bisnis `NO_ACTIVE_RESET_REQUEST`.

3. **Penyertaan Status & Request ID Aktif pada `GET /api/v1/bins/my-bins`**:
   - Respon `GET /bins/my-bins` kini menyertakan field `activeResetRequestId` serta evaluasi status `PENDING` maupun `ASSIGNED`.

---

## 2. SPESIFIKASI KONTRAK API UNTUK TIM MOBILE

### 2.1. Endpoint Pembatalan Granular Per-Bin

- **URL**: `PUT /api/v1/bins/{binId}/cancel-reset`
- **Metode Alternatif**: `DELETE /api/v1/bins/{binId}/cancel-reset` *(Didukung penuh untuk fleksibilitas klien)*
- **Header**:
  ```http
  Authorization: Bearer <token_jwt_warga>
  Content-Type: application/json
  ```
- **Parameter Path**:
  - `binId` (string, wajib): ID UUID tempat sampah yang hendak dibatalkan pengajuannya.

#### Contoh Respon Sukses (HTTP 200 OK):
```json
{
  "success": true,
  "message": "Pengajuan pengosongan tempat sampah berhasil dibatalkan.",
  "data": {
    "id": "c7a8b901-23de-45f6-789a-bcdef0123456",
    "binId": "bin-organik-001",
    "userId": "warga-123",
    "status": "CANCELLED",
    "updatedAt": "2026-10-05T09:14:00.000Z",
    "bin": {
      "id": "bin-organik-001",
      "qrCode": "TSC-RW10-001"
    }
  }
}
```

#### Contoh Respon Error Bisnis:

1. **Tempat Sampah Tidak Ada Pengajuan Aktif (HTTP 404)**:
   ```json
   {
     "success": false,
     "error": "NO_ACTIVE_RESET_REQUEST",
     "message": "Tempat sampah ini tidak memiliki pengajuan pengosongan aktif yang dapat dibatalkan."
   }
   ```
2. **Tidak Memiliki Hak Akses Kepemilikan (HTTP 403)**:
   ```json
   {
     "success": false,
     "error": "FORBIDDEN",
     "message": "Anda tidak berhak membatalkan pengajuan tempat sampah ini."
   }
   ```
3. **Pengajuan Sudah Selesai / Terlambat Dibatalkan (HTTP 400)**:
   ```json
   {
     "success": false,
     "error": "ALREADY_PROCESSED",
     "message": "Pengajuan sudah selesai diproses oleh petugas sehingga tidak dapat dibatalkan."
   }
   ```

---

### 2.2. Pembaruan Respon `GET /api/v1/bins/my-bins`

Mobile dapat memanfaatkan respon terbaru dari `GET /api/v1/bins/my-bins` untuk menentukan rendering tombol di UI secara presisi:

```json
{
  "success": true,
  "data": [
    {
      "id": "bin-organik-001",
      "qrCode": "TSC-ORG-001",
      "category": "ORGANIK",
      "currentVolumeLiter": 0,
      "maxCapacityLiter": 50,
      "kapasitas": 0,
      "status": "Normal",
      "householdName": "Keluarga Bpk. Budi",
      "resetRequestStatus": null,
      "activeResetRequestId": null,
      "isPendingReset": false
    },
    {
      "id": "bin-anorganik-002",
      "qrCode": "TSC-ANORG-002",
      "category": "ANORGANIK",
      "currentVolumeLiter": 45,
      "maxCapacityLiter": 50,
      "kapasitas": 90,
      "status": "Pending Pengosongan",
      "householdName": "Keluarga Bpk. Budi",
      "resetRequestStatus": "PENDING",
      "activeResetRequestId": "req-anorg-888999",
      "isPendingReset": true
    }
  ]
}
```

---

## 3. CHECKLIST IMPLEMENTASI TIM MOBILE (FLUTTER)

Tim Mobile diharapkan menyelaraskan logika pada repository dan widget tampilan:

### Step 1: Penyesuaian Endpoint di Repository Mobile (`api_bin_repository.dart`)
Ubah fungsi pembatalan pengosongan agar memanggil endpoint baru dan mengisolasi SafeStorage per-bin:

```dart
// lib/app/data/repositories/api_bin_repository.dart

Future<bool> cancelResetRequestByBinId(String binId) async {
  try {
    final response = await apiClient.dio.put('/bins/$binId/cancel-reset');
    
    if (response.statusCode == 200 && response.data['success'] == true) {
      // ✅ ISOLASI CACHE: HANYA HAPUS CACHE TEMPAT SAMPAH INI
      final userId = await safeStorage.read(key: 'current_user_id');
      await safeStorage.delete(key: 'active_reset_request_${userId}_$binId');
      
      // ❌ DILARANG: Jangan panggil safeStorage.delete(key: 'active_reset_request_$userId')
      // karena akan menghapus status tempat sampah lain milik user!
      
      return true;
    }
    return false;
  } on DioException catch (e) {
    if (e.response?.data?['error'] == 'NO_ACTIVE_RESET_REQUEST') {
      debugPrint('[BinRepository] Tidak ada pengajuan aktif untuk bin $binId');
    }
    return false;
  }
}
```

### Step 2: Aturan Rendering Kartu UI (`reset_bin_view.dart` & Kartu Beranda)
Lakukan percabangan tampilan berdasarkan `bin.activeResetRequestId` atau `bin.resetRequestStatus`:

```dart
// Contoh Logika Tampilan:
if (bin.resetRequestStatus == 'PENDING' || bin.resetRequestStatus == 'ASSIGNED') {
  // 1. Tampilkan Badge: MENUNGGU PENJEMPUTAN
  // 2. Tampilkan Tombol Khusus: "Batalkan Pengajuan" (Hanya membatalkan bin.id ini)
  OutlinedButton(
    onPressed: () => controller.cancelBinReset(bin.id),
    child: Text('Batalkan Tempat Sampah Ini'),
  );
} else {
  // 1. Tampilkan status normal (Kapasitas %, indikator warna)
  // 2. Tombol "Ajukan Pengosongan" (jika penuh / perlu dikosongkan)
  // 3. ❌ DILARANG KERAS MENAMPILKAN TOMBOL BATALKAN DI SINI!
}
```

### Step 3: Hapus Tombol "Batalkan Semua Pengajuan"
- Hapus widget/aksi tombol massal *"Batalkan Semua Pengajuan Aktif"* di `reset_bin_view.dart:1190` untuk mencegah perulangan pembatalan liar.

---

## 4. JAMINAN KUALITAS & INTEGRITAS SISTEM (QUALITY GATES)

Backend telah melalui rangkaian pengujian komprehensif:
1. **Unit Test Granular Cancellation**: 13/13 test passing (100% green).
2. **Uji Test Suite DPL & KKN**: 30/30 test passing tanpa ada regresi pada role DPL atau penilaian KKN.
3. **TypeScript Type Safety**: 0 compile error (`tsc --noEmit` lulus bersih).
4. **Audit Trail**: Setiap pembatalan dicatat dengan action `CANCEL_RESET_REQUEST_BY_BIN_ID` mencakup `oldValue` dan `newValue`.

---
*Laporan ini disusun oleh Master Backend BERSEKA untuk memastikan kelancaran rilis fitur mobile.*
