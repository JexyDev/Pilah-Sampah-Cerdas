# LAPORAN TEKNIS TIM BACKEND: PANDUAN PERBAIKAN SINKRONISASI WARGA DAMPINGAN STRICT BY ID RW (MOBILE DEVELOPER)

**Dokumen**: Panduan Perbaikan Integrasi & Standarisasi Wilayah Mahasiswa KKN  
**Target**: Mobile Developer (Flutter App)  
**Tanggal Rilis**: 16 September 2026  
**Status Backend**: ✅ Selesai Diperbaiki & Diuji (Branch `fix/strict-rw-warga-dampingan`)  

---

## 1. Ringkasan Eksekutif: Mengapa Sebelumnya "Semua Warga Masuk"?

Sebelumnya ditemukan kendala di mana pada aplikasi mobile, menu **Warga Dampingan Mahasiswa** menampilkan seluruh warga satu kelurahan dan tidak tersaring berdasarkan RW mahasiswa yang bersangkutan (*"semua warga masuk"*). 

Setelah dilakukan investigasi mendalam dari tim backend, akar penyebabnya berasal dari **kombinasi 2 sisi**:

### A. Akar Masalah di Sisi Mobile:
1. **Salah Memanggil Endpoint di Repository (`api_kkn_repository.dart`)**:
   Pada `mobile/lib/app/data/repositories/api_kkn_repository.dart` baris 126, method `getWargaDampingan()` memanggil:
   ```dart
   // ❌ KELIRU: Memanggil /kkn/warga (Direktori Master Seluruh Warga Kelurahan)
   final response = await apiClient.dio.get(ApiEndpoints.kknWarga);
   ```
   Padahal konstanta `ApiEndpoints.kknWargaDampingan` (`/kkn/warga-dampingan`) **sudah tersedia** di `api_constants.dart` baris 57.
   - Endpoint `/kkn/warga` ditujukan untuk fitur **Aktivasi/Pencarian Warga Baru** se-kelurahan.
   - Endpoint `/kkn/warga-dampingan` adalah endpoint resmi untuk **Warga yang Didampingi Mahasiswa**.
2. **Tidak Mengirim Parameter `rwId`**:
   Mobile memanggil request tanpa menyertakan query parameter wilayah penugasan mahasiswa.
3. **Model `UserEntity` Mobile Belum Menyimpan `rwId` Numerik**:
   Di `user_entity.dart`, field RW hanya bertipe `String rw` (contoh: `"01"`, `"RW 03, 04"`). Karena tidak ada integer `rwId`, mobile terpaksa memakai regex pemecah string yang rentan gagal jika format string berbeda.
4. **Logika Fallback di View yang Terlalu Longgar**:
   Di `monitoring_warga_view.dart`, jika string RW tidak menghasilkan angka (`targetRwSet.isEmpty`), filter meloloskan seluruh data warga (`return true;`).

### B. Akar Masalah di Sisi Backend (Telah Diperbaiki):
1. **Flaw Logika OR di Backend**: Di versi sebelumnya, query backend menggabungkan `targetRwId` dan `targetKelurahan` menggunakan `OR`, sehingga seluruh warga satu kelurahan di RW mana pun ikut terbawa.
2. **Tidak Ada Auto-Scoping Default**: Di versi sebelumnya, jika mobile tidak mengirim `?rwId=...`, backend tidak mengunci ke `assignedRwId` milik mahasiswa login.
3. **Inkonsistensi Parameter**: Controller lama membaca `rw` di satu endpoint dan `rwId` di endpoint lain.

---

## 2. Perubahan yang Telah Diterapkan di Backend API (`main`)

Backend kini telah diperbarui dengan standar keamanan dan akurasi data wilayah tertinggi:

1. **Auto-Resolution `assignedRwId` Mahasiswa KKN**:
   - Jika mobile memanggil `GET /api/v1/kkn/warga-dampingan` atau `GET /api/v1/kkn/warga` tanpa parameter, backend **secara otomatis mengunci data warga hanya ke `assignedRwId`** yang tercatat pada profil `StudentKkn` mahasiswa tersebut.
2. **Normalisasi Multi-Query Parameter**:
   - Backend sekarang menerima seluruh variasi parameter: `rwId`, `rw`, `idRw`, maupun `rw_id`.
3. **Strict AND Scoping**:
   - Logika query kelurahan dan RW telah diubah menjadi `AND`. Tidak ada lagi kebocoran warga RW lain meskipun satu kelurahan.
4. **Jaminan Field `rwId` & `rw` pada Response JSON**:
   - Setiap objek warga yang dikembalikan backend kini dijamin menyertakan:
     - `rwId`: Integer ID RW (contoh: `15`)
     - `rw`: Nama RW (contoh: `"03"` atau `"RW 03"`)
     - `kelurahan`: Nama Kelurahan (contoh: `"Sadang Serang"`)

---

## 3. Panduan Perbaikan untuk Mobile Developer (Action Items)

Mohon tim Mobile Developer menerapkan 4 langkah perbaikan berikut di repositori `mobile`:

### 🔹 Langkah 1: Perbaiki Endpoint di `api_kkn_repository.dart`
Buka file `mobile/lib/app/data/repositories/api_kkn_repository.dart` pada method `getWargaDampingan()`:

```dart
// SEBELUM:
@override
Future<List<WargaDampingan>> getWargaDampingan() async {
  List<dynamic> rawList = [];
  try {
    final response = await apiClient.dio.get(ApiEndpoints.kknWarga); // ❌ SALAH ENDPOINT
    ...

// SESUDAH (PERBAIKAN):
@override
Future<List<WargaDampingan>> getWargaDampingan({int? rwId}) async {
  List<dynamic> rawList = [];
  try {
    final Map<String, dynamic> queryParams = {};
    if (rwId != null) {
      queryParams['rwId'] = rwId;
    }

    final response = await apiClient.dio.get(
      ApiEndpoints.kknWargaDampingan, // ✅ GUNAKAN ENDPOINT RESMI
      queryParameters: queryParams.isNotEmpty ? queryParams : null,
    );
    if (response.statusCode == 200) {
      if (response.data is Map<String, dynamic>) {
        rawList = (response.data as Map<String, dynamic>)['data'] as List<dynamic>? ?? [];
      } else if (response.data is List) {
        rawList = response.data as List<dynamic>;
      }
    }
  } catch (_) {
    rawList = [];
  }
  ...
```

---

### 🔹 Langkah 2: Tambahkan Field `rwId` di `UserEntity` (`user_entity.dart`)
Agar aplikasi mobile dapat memfilter secara akurat tanpa regex:

1. Tambahkan properti `final int? rwId;` pada kelas `UserEntity`:
```dart
class UserEntity extends Equatable {
  const UserEntity({
    required this.id,
    required this.name,
    required this.role,
    this.rwId, // ✅ Tambahkan ini
    this.rw = '',
    ...
  });

  final int? rwId; // ✅ Integer ID RW dari backend
  final String rw;
```

2. Pada mapper `_mapUser` di `api_auth_repository.dart`:
```dart
rwId: int.tryParse(userMap['rwId']?.toString() ?? '') ??
      int.tryParse(userMap['assignedRwId']?.toString() ?? ''),
```

---

### 🔹 Langkah 3: Tambahkan Field `rwId` di `WargaDampingan` (`mahasiswa_kkn_models.dart`)
Buka `mobile/lib/app/data/models/mahasiswa_kkn_models.dart`:

```dart
class WargaDampingan {
  final String wargaId;
  final String wargaName;
  final int? rwId; // ✅ Tambahkan field ini
  final String rw;
  final String kelurahan;
  ...

  factory WargaDampingan.fromJson(Map<String, dynamic> json) {
    return WargaDampingan(
      wargaId: json['wargaId']?.toString() ?? json['id']?.toString() ?? '',
      wargaName: json['wargaName']?.toString() ?? json['name']?.toString() ?? '',
      rwId: json['rwId'] != null ? int.tryParse(json['rwId'].toString()) : null, // ✅ Parse rwId
      rw: json['rw']?.toString() ?? '',
      kelurahan: json['kelurahan']?.toString() ?? '',
      ...
    );
  }
```

---

### 🔹 Langkah 4: Sederhanakan Filter di `monitoring_warga_view.dart` & `daftar_warga_view.dart`
Dengan adanya `rwId` numerik, logika filter di mobile menjadi sangat sederhana, cepat, dan tidak akan bocor:

```dart
// Di monitoring_warga_view.dart atau daftar_warga_view.dart:
final userRwId = user?.rwId;

final myWarga = allWarga.where((w) {
  // 1. Filter strict by ID RW numerik
  if (userRwId != null && w.rwId != null) {
    return w.rwId == userRwId;
  }
  // 2. Fallback jika salah satu rwId null: bersihkan string RW
  if (user?.rw != null && user!.rw.isNotEmpty) {
    final cleanUserRw = user.rw.replaceAll(RegExp(r'[^\d]'), '');
    final cleanWargaRw = w.rw.replaceAll(RegExp(r'[^\d]'), '');
    return cleanUserRw == cleanWargaRw;
  }
  return true;
}).toList();
```

> ⚠️ **Catatan Penting**: Di `monitoring_warga_view.dart`, **jangan** menggabungkan `state.wargaList` dengan `_getFilteredWargaAktivasi()` jika sedang berada pada mode **Monitoring Warga Dampingan**. Direktori aktivasi hanya digunakan saat mahasiswa membuka tab/mode **Aktivasi Tempat Sampah Baru**.

---

## 4. Alur Lengkap: Registrasi Warga, Aktivasi Bin, & Mahasiswa Pendamping

Backend telah menyelaraskan 3 siklus interaksi antara Mahasiswa KKN dan Warga:

### A. Registrasi Warga Baru oleh Mahasiswa (`POST /api/v1/auth/register/warga`)
- Mahasiswa membantu registrasi warga melalui scanner/form di aplikasi mobile.
- Token mahasiswa yang melakukan registrasi ditangkap oleh backend (`scannerUser.userId`).
- Backend otomatis:
  1. Menetapkan `rwId` warga sesuai `assignedRwId` mahasiswa pendamping (jika tidak diinput spesifik).
  2. Menyimpan referensi `registeredByStudentId` pada bin placeholder / user warga.
  3. Mengembalikan objek user lengkap dengan `lifecycleState: "REGISTERED"` dan `rwId`.

### B. Aktivasi Tempat Sampah Warga (`POST /api/v1/kkn/bins/activate`)
- Mahasiswa memindai QR Tempat Sampah Organik & Anorganik milik warga.
- Backend otomatis mengaitkan bin ke user warga, memperbarui status menjadi `ACTIVE_BOUND`, serta mengisi `registeredByStudentId: kknUserId`.
- Jika warga belum memiliki `rwId`, backend secara otomatis mengisi `rwId` warga dan household ke `assignedRwId` mahasiswa pendamping agar data tidak menjadi yatim piatu (*orphaned*).

### C. Profil Warga Menampilkan Mahasiswa Pendamping (`GET /api/v1/auth/me`)
- Saat warga membuka aplikasi mobile dan memanggil `GET /api/v1/auth/me`, backend kini menyertakan objek `pendamping` dan `pendampingName`:
```json
{
  "success": true,
  "data": {
    "id": "warga-uuid-123",
    "name": "Pak Budi Santoso",
    "role": "WARGA",
    "rwId": 15,
    "rw": "03",
    "kelurahan": "Sadang Serang",
    "pendampingName": "Jeremy Darrell",
    "pendamping": {
      "id": "mhs-uuid-456",
      "name": "Jeremy Darrell",
      "phone": "081298765432",
      "nim": "12022001",
      "jurusan": "Teknik Lingkungan",
      "fakultas": "Fakultas Teknik",
      "kelompokName": "Kelompok KKN 05"
    }
  }
}
```
*Dengan field ini, mobile developer dapat langsung menampilkan kartu profil mahasiswa pendamping di dashboard/halaman profil warga.*

---

## 5. Contoh Kontrak Payload API Terbaru

### Request:
```http
GET /api/v1/kkn/warga-dampingan?rwId=15 HTTP/1.1
Host: berseka.id
Authorization: Bearer <TOKEN_MAHASISWA_KKN>
```
*(Catatan: Jika `?rwId=15` tidak dikirimkan, backend tetap otomatis mengunci ke RW penugasan mahasiswa).*

### Response (`200 OK`):
```json
{
  "success": true,
  "data": [
    {
      "id": "c7a8b912-3456-4abc-9def-123456789abc",
      "wargaId": "c7a8b912-3456-4abc-9def-123456789abc",
      "wargaName": "Pak Budi Santoso",
      "name": "Pak Budi Santoso",
      "phone": "081234567890",
      "address": "Jl. Cisitu Lama No. 12, RW 03, Kel. Sadang Serang",
      "rwId": 15,
      "rw": "03",
      "kelurahan": "Sadang Serang",
      "binId": "BIN-ORG-00123",
      "binCode": "BIN-ORG-00123",
      "bin": {
        "qrCode": "BIN-ORG-00123",
        "category": "Organik",
        "capacity": "15L / 25L"
      },
      "totalKg": 14.5,
      "totalPoin": 145,
      "totalActivities": 6,
      "correctCount": 5,
      "incorrectCount": 1,
      "isActivated": true,
      "needsReeducation": false,
      "pendampingName": "Jeremy Darrell",
      "pendamping": {
        "id": "mhs-uuid-456",
        "name": "Jeremy Darrell"
      },
      "mahasiswaId": "mhs-uuid-456",
      "registeredByStudentId": "mhs-uuid-456",
      "recentLogs": []
    }
  ]
}
```

---

## 6. Ringkasan Checklist Tim Mobile

- [ ] Ganti endpoint `ApiEndpoints.kknWarga` menjadi `ApiEndpoints.kknWargaDampingan` pada `getWargaDampingan()` di `api_kkn_repository.dart`.
- [ ] Kirim parameter `?rwId=` dari `user.rwId` saat fetch warga dampingan.
- [ ] Tambahkan `rwId: int?` pada `UserEntity` dan `WargaDampingan`.
- [ ] Tampilkan informasi Mahasiswa Pendamping di halaman profil warga (`user.pendampingName` / `user.pendamping`).
- [ ] Update filter wilayah di UI `monitoring_warga_view.dart` & `daftar_warga_view.dart` menggunakan pencocokan integer `rwId`.
- [ ] Pisahkan data warga dampingan aktif dengan data pencarian aktivasi warga se-kelurahan.

Jika ada pertanyaan atau kendala integrasi lebih lanjut, silakan koordinasikan dengan tim backend. Terima kasih!
