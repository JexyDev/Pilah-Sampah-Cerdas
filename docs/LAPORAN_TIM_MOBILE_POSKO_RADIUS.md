# 📱 LAPORAN TEKNIS & PANDUAN INTEGRASI TIM MOBILE
**Modul:** Posko KKN, Radius Geofencing Presensi, dan Standardisasi Payload Foto  
**Tanggal Rilis Backend:** 31 Agustus 2026  
**Penyusun:** Backend & Web Fullstack Developer  
**Status Backend:** ✅ DEPLOYED & TESTED (Vitest: 121 Tests Passed)

---

## 🎯 1. LATAR BELAKANG & TUJUAN PEMBARUAN

Dalam rangka optimalisasi sistem pemantauan presensi dan verifikasi data posko KKN di lapangan:
1. **Fitur Radius Geofence Dinamis**: Mahasiswa/Ketua Kelompok kini dapat menentukan toleransi batas jarak radius posko (dalam satuan meter, default **150m**) saat registrasi maupun edit posko.
2. **Standardisasi Properti Foto (`foto` & `fotoUrl`)**: Backend telah menormalkan properti respons gambar dengan menyediakan kedua key `foto` dan `fotoUrl` guna mencegah *photo missing / null pointer exception* di sisi mobile.
3. **Preservasi Foto Saat Edit**: Proses edit posko tidak akan menghapus/menimpa foto lama jika pengguna hanya mengubah koordinat, alamat, atau radius tanpa memilih file gambar baru.

---

## 📋 2. RINGKASAN PERUBAHAN CONTRACT API (API SPECIFICATION)

### A. Perubahan Parameter Baru
| Parameter | Tipe Data | Lokasi | Default | Validasi | Deskripsi |
| :--- | :--- | :--- | :---: | :---: | :--- |
| `radius` | `Integer` / `Number` | Request & Response Body | `150` | `10 <= radius <= 5000` | Jarak batas toleransi presensi mandiri (meter). |
| `foto` | `String` / `Binary` | Request Form-Data & Response | `null` | Max 5 MB (JPG/PNG/WEBP) | URL relatif/absolut foto atau file binary upload. |
| `fotoUrl` | `String` | Response Body | `null` | - | Alias identik dari `foto` untuk kompatibilitas. |

---

## 📡 3. DETAIL ENDPOINT POSKO KKN UNTUK MOBILE

### 1. Registrasi Posko KKN (Mahasiswa / Ketua Kelompok)
Digunakan saat mahasiswa pertama kali mendaftarkan lokasi posko fisik kelompoknya.

- **Method**: `POST`
- **Path**: `/api/v1/kkn/posko/register`
- **Headers**:
  ```http
  Authorization: Bearer <TOKEN_MAHASISWA>
  Content-Type: multipart/form-data
  ```
- **Form-Data Request Body**:
  ```ini
  nama=Posko KKN Kelompok 01 Dago
  alamat=Jl. Ir. H. Juanda No. 123, RT 01 / RW 02
  latitude=-6.89030
  longitude=107.61100
  radius=150
  foto=[FILE_BINARY_GAMBAR]  ; Opsional
  ```

- **Contoh Response (`201 Created`)**:
  ```json
  {
    "status": "success",
    "message": "Posko KKN berhasil didaftarkan. Menunggu verifikasi DPL.",
    "data": {
      "id": "cm123abc456posko",
      "nama": "Posko KKN Kelompok 01 Dago",
      "alamat": "Jl. Ir. H. Juanda No. 123, RT 01 / RW 02",
      "kelompokId": "kel_dago_01",
      "kelompokName": "Kelompok 01 - Dago",
      "kelurahan": "DAGO",
      "rwName": "01",
      "latitude": -6.89030,
      "longitude": 107.61100,
      "radius": 150,
      "foto": "/uploads/posko/posko_1725100000000.jpg",
      "fotoUrl": "/uploads/posko/posko_1725100000000.jpg",
      "pic": "Ahmad Fauzi (Ketua)",
      "kontak": "081234567890",
      "dplName": "Dr. Ir. Budi Santoso, M.T.",
      "statusApproval": "PENDING",
      "createdAt": "2026-08-31T15:00:00.000Z"
    }
  }
  ```

---

### 2. Edit / Pembaruan Data Posko KKN (Mahasiswa / Ketua Kelompok)
Digunakan saat ketua memperbarui alamat, koordinat GPS, radius, atau mengganti foto posko.

- **Method**: `PUT`
- **Path**: `/api/v1/kkn/posko/me`
- **Headers**:
  ```http
  Authorization: Bearer <TOKEN_MAHASISWA>
  Content-Type: multipart/form-data
  ```
- **Form-Data Request Body**:
  ```ini
  nama=Posko KKN Kelompok 01 Dago (Updated)
  alamat=Jl. Ir. H. Juanda No. 125, RT 01 / RW 02
  latitude=-6.89035
  longitude=107.61105
  radius=200
  foto=[FILE_BINARY_GAMBAR]  ; Opsional. Jika kosong, foto lama TIDAK akan terhapus.
  ```

- **Contoh Response (`200 OK`)**:
  ```json
  {
    "status": "success",
    "message": "Data Posko KKN berhasil diperbarui.",
    "data": {
      "id": "cm123abc456posko",
      "nama": "Posko KKN Kelompok 01 Dago (Updated)",
      "alamat": "Jl. Ir. H. Juanda No. 125, RT 01 / RW 02",
      "kelompokId": "kel_dago_01",
      "kelompokName": "Kelompok 01 - Dago",
      "kelurahan": "DAGO",
      "rwName": "01",
      "latitude": -6.89035,
      "longitude": 107.61105,
      "radius": 200,
      "foto": "/uploads/posko/posko_1725100000000.jpg",
      "fotoUrl": "/uploads/posko/posko_1725100000000.jpg",
      "pic": "Ahmad Fauzi (Ketua)",
      "kontak": "081234567890",
      "dplName": "Dr. Ir. Budi Santoso, M.T.",
      "statusApproval": "APPROVED",
      "createdAt": "2026-08-31T15:00:00.000Z"
    }
  }
  ```

---

### 3. Get Detail Posko KKN Saya
- **Method**: `GET`
- **Path**: `/api/v1/kkn/posko/me`
- **Headers**:
  ```http
  Authorization: Bearer <TOKEN_MAHASISWA>
  ```
- **Contoh Response (`200 OK`)**:
  ```json
  {
    "status": "success",
    "data": {
      "id": "cm123abc456posko",
      "nama": "Posko KKN Kelompok 01 Dago",
      "alamat": "Jl. Ir. H. Juanda No. 123",
      "latitude": -6.89030,
      "longitude": 107.61100,
      "radius": 150,
      "foto": "/uploads/posko/posko_1725100000000.jpg",
      "fotoUrl": "/uploads/posko/posko_1725100000000.jpg",
      "statusApproval": "APPROVED"
    }
  }
  ```

---

### 4. Get Multi-Posko & Smart Zones (Untuk Geofence & Map Presensi)
- **Method**: `GET`
- **Path**: `/api/v1/posko-kkn/me/all-zones`
- **Headers**:
  ```http
  Authorization: Bearer <TOKEN_MAHASISWA>
  ```
- **Contoh Response (`200 OK`)**:
  ```json
  {
    "status": "success",
    "data": {
      "kelompokId": "kel_dago_01",
      "kelompokNama": "Kelompok 01 - Dago",
      "poskos": [
        {
          "id": "cm123abc456posko",
          "nama": "Posko KKN Utama Kelompok 1",
          "lat": -6.89030,
          "lng": 107.61100,
          "latitude": -6.89030,
          "longitude": 107.61100,
          "isUtama": true,
          "radius": 150,
          "foto": "/uploads/posko/posko_1725100000000.jpg",
          "fotoUrl": "/uploads/posko/posko_1725100000000.jpg",
          "alamat": "Jl. Ir. H. Juanda No. 123",
          "source": "POSKO_KKN"
        }
      ],
      "polygonZone": {
        "kelompokId": "kel_dago_01",
        "kelompokNama": "Kelompok 01 - Dago",
        "polygon": [
          { "lat": -6.88950, "lng": 107.61050 },
          { "lat": -6.89100, "lng": 107.61200 },
          { "lat": -6.89200, "lng": 107.60950 }
        ],
        "centerLat": -6.89030,
        "centerLng": 107.61100,
        "radiusBufferMeters": 150
      }
    }
  }
  ```

---

## 🛠️ 4. PANDUAN IMPLEMENTASI TEKNIS FLUTTER / DART

### A. Update Data Model (`PoskoModel.dart`)
```dart
class PoskoModel {
  final String id;
  final String nama;
  final String? alamat;
  final double latitude;
  final double longitude;
  final int radius; // Default 150 jika null
  final String? foto;
  final String? fotoUrl;
  final String? pic;
  final String? kontak;
  final String? statusApproval;

  PoskoModel({
    required this.id,
    required this.nama,
    this.alamat,
    required this.latitude,
    required this.longitude,
    this.radius = 150,
    this.foto,
    this.fotoUrl,
    this.pic,
    this.kontak,
    this.statusApproval,
  });

  // Getter resolusi URL foto dengan fallback aman
  String? get resolvedImageUrl {
    final raw = fotoUrl ?? foto;
    if (raw == null || raw.isEmpty) return null;
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    const String baseUrl = 'https://api.berseka.id'; // Sesuaikan baseUrl environment
    return '$baseUrl${raw.startsWith('/') ? '' : '/'}$raw';
  }

  factory PoskoModel.fromJson(Map<String, dynamic> json) {
    return PoskoModel(
      id: json['id']?.toString() ?? '',
      nama: json['nama']?.toString() ?? 'Posko KKN',
      alamat: json['alamat']?.toString(),
      latitude: double.tryParse(json['latitude']?.toString() ?? '') ?? 0.0,
      longitude: double.tryParse(json['longitude']?.toString() ?? '') ?? 0.0,
      radius: int.tryParse(json['radius']?.toString() ?? '') ?? 150,
      foto: json['foto']?.toString(),
      fotoUrl: json['fotoUrl']?.toString(),
      pic: json['pic']?.toString(),
      kontak: json['kontak']?.toString(),
      statusApproval: json['statusApproval']?.toString() ?? 'PENDING',
    );
  }
}
```

---

### B. Form Registrasi / Edit Posko (UI & Preset Chips)
1. **Input Radius**: Sediakan input numerik `TextFormField` dengan suffix `Meter`.
2. **Pilihan Cepat (Chips)**: Sediakan opsi cepat `[50m, 100m, 150m (Standar), 200m, 300m, 500m]`.
3. **Upload File Gambar**:
   ```dart
   Future<void> submitPosko({
     required String nama,
     required String alamat,
     required double latitude,
     required double longitude,
     required int radius,
     File? imageFile,
     bool isEdit = false,
   }) async {
     final formData = dio.FormData.fromMap({
       'nama': nama,
       'alamat': alamat,
       'latitude': latitude.toString(),
       'longitude': longitude.toString(),
       'radius': radius.toString(),
       if (imageFile != null)
         'foto': await dio.MultipartFile.fromFile(
           imageFile.path,
           filename: 'posko_${DateTime.now().millisecondsSinceEpoch}.jpg',
         ),
     });

     final endpoint = isEdit ? '/api/v1/kkn/posko/me' : '/api/v1/kkn/posko/register';
     final method = isEdit ? dio.Options(method: 'PUT') : dio.Options(method: 'POST');

     await dioClient.request(endpoint, data: formData, options: method);
   }
   ```

---

### C. Visualisasi Geofence di Peta (Google Maps / Flutter Map)
Tambahkan `Circle` di sekeliling marker Posko:
```dart
Set<Circle> getPoskoCircles(PoskoModel posko) {
  return {
    Circle(
      circleId: CircleId('posko_geofence_${posko.id}'),
      center: LatLng(posko.latitude, posko.longitude),
      radius: posko.radius.toDouble(), // Radius dalam meter
      fillColor: const Color(0xFF4F46E5).withOpacity(0.15),
      strokeColor: const Color(0xFF4F46E5),
      strokeWidth: 2,
    ),
  };
}
```

---

### D. Perhitungan Jarak Geofence Presensi Mahasiswa
Gunakan package `geolocator` untuk menghitung jarak GPS user terhadap radius posko:
```dart
import 'package:geolocator/geolocator.dart';

bool checkWithinPoskoRadius(double userLat, double userLng, PoskoModel posko) {
  final double distanceInMeters = Geolocator.distanceBetween(
    userLat,
    userLng,
    posko.latitude,
    posko.longitude,
  );
  return distanceInMeters <= posko.radius;
}
```

---

## 🧪 5. CHECKLIST PENGUJIAN MOBILE (QA CHECKLIST)

- [ ] **Registrasi Posko Baru**: Mengirim `radius` kustom (contoh: 250m) dan upload foto kamera/galeri berhasil disimpan.
- [ ] **Edit Posko Tanpa Ganti Foto**: Mengedit koordinat dan nama posko tanpa memilih file baru, foto lama tetap tampil.
- [ ] **Fallback Gambar**: Jika `foto` bernilai null atau koneksi bermasalah, aplikasi menampilkan placeholder posko default tanpa crash.
- [ ] **Circle Geofence di Peta**: Lingkaran radius di peta mobile berubah ukuran secara proporsional sesuai nilai radius posko.
- [ ] **Validasi Presensi**: Mahasiswa di dalam radius (misal jarak 80m saat radius 150m) berhasil absen; mahasiswa di luar radius (misal jarak 300m) ditolak dengan pesan selisih jarak.

---

*Laporan ini dapat langsung diteruskan ke tim Mobile Engineer untuk mulai diimplementasikan.*
