# Integrasi API Posko KKN: Penambahan Radius Geofence & Penanganan Foto
**Untuk Tim Pengembang Mobile (Mobile Developer / Flutter / Android)**
*Dokumen ini disusun oleh Backend & Web Fullstack Developer.*

---

## 📌 Ringkasan Pembaruan Backend API

1. **Penambahan Parameter `radius`**:
   - Parameter `radius` (tipe `integer`, satuan **meter**, default: `150`) kini didukung pada seluruh endpoint pendaftaran, pembaruan, dan pengambilan data Posko KKN.
   - Digunakan sebagai batas radius toleransi geofencing presensi mandiri mahasiswa di sekitar posko.
2. **Perbaikan & Standarisasi Penanganan Foto (`foto` & `fotoUrl`)**:
   - Backend kini mengembalikan kedua atribut `foto` dan `fotoUrl` (berisi URL/path foto yang sama) demi kompatibilitas penuh.
   - Endpoint pendaftaran dan edit mendukung upload file gambar fisik (`multipart/form-data` dengan field `foto`) maupun JSON string URL.
   - Pada pembaruan/edit posko, jika tidak ada file foto baru yang diunggah, foto lama **tidak akan terhapus**.

---

## 📡 Rincian Endpoint API Posko KKN

### 1. Registrasi / Pendaftaran Posko KKN (Mahasiswa / Ketua Kelompok)
- **Method**: `POST`
- **Path**: `/api/v1/kkn/posko/register`
- **Headers**:
  - `Authorization: Bearer <TOKEN_MAHASISWA>`
  - `Content-Type: multipart/form-data`
- **Request Body (FormData)**:
  | Field | Tipe | Wajib | Deskripsi |
  | :--- | :--- | :--- | :--- |
  | `nama` | `string` | Ya | Nama Posko KKN (contoh: `"Posko KKN Kelompok 1 Dago"`) |
  | `alamat` | `string` | Ya | Alamat lengkap posko |
  | `latitude` | `number` / `string` | Ya | Koordinat latitude (contoh: `-6.89030`) |
  | `longitude` | `number` / `string` | Ya | Koordinat longitude (contoh: `107.61100`) |
  | `radius` | `number` / `string` | Tidak | Radius geofence dalam meter (default `150`, range: `10 - 5000`) |
  | `foto` | `File` (Binary) / `string` | Tidak | File foto bangunan fisik posko (JPG/PNG/WEBP maks 5MB) |

- **Response Sukses (`201 Created`)**:
```json
{
  "status": "success",
  "message": "Posko KKN berhasil didaftarkan. Menunggu verifikasi DPL.",
  "data": {
    "id": "posko_cm123abc456",
    "nama": "Posko KKN Kelompok 1 Dago",
    "alamat": "Jl. Ir. H. Juanda No. 123, RT 01 / RW 02",
    "kelompokId": "kel_abc123",
    "kelompokName": "Kelompok 01 - Dago",
    "kelurahan": "DAGO",
    "rwName": "01",
    "latitude": -6.89030,
    "longitude": 107.61100,
    "radius": 150,
    "foto": "/uploads/posko/posko_1725100000000.jpg",
    "fotoUrl": "/uploads/posko/posko_1725100000000.jpg",
    "pic": "Ahmad Fauzi",
    "kontak": "081234567890",
    "dplName": "Dr. Ir. Budi Santoso, M.T.",
    "statusApproval": "PENDING",
    "createdAt": "2026-08-31T15:00:00.000Z"
  }
}
```

---

### 2. Edit / Pembaruan Data Posko KKN (Mahasiswa / Ketua Kelompok)
- **Method**: `PUT`
- **Path**: `/api/v1/kkn/posko/me`
- **Headers**:
  - `Authorization: Bearer <TOKEN_MAHASISWA>`
  - `Content-Type: multipart/form-data`
- **Request Body (FormData)**:
  | Field | Tipe | Wajib | Deskripsi |
  | :--- | :--- | :--- | :--- |
  | `nama` | `string` | Tidak | Nama baru posko |
  | `alamat` | `string` | Tidak | Alamat baru posko |
  | `latitude` | `number` / `string` | Tidak | Koordinat latitude baru |
  | `longitude` | `number` / `string` | Tidak | Koordinat longitude baru |
  | `radius` | `number` / `string` | Tidak | Radius toleransi geofence baru (meter, contoh: `200`) |
  | `foto` | `File` (Binary) / `string` | Tidak | File foto baru. Jika tidak dikirim, foto lama tetap dipertahankan |

- **Response Sukses (`200 OK`)**:
```json
{
  "status": "success",
  "message": "Data Posko KKN berhasil diperbarui.",
  "data": {
    "id": "posko_cm123abc456",
    "nama": "Posko KKN Kelompok 1 Dago (Updated)",
    "alamat": "Jl. Ir. H. Juanda No. 125, RT 01 / RW 02",
    "kelompokId": "kel_abc123",
    "kelompokName": "Kelompok 01 - Dago",
    "kelurahan": "DAGO",
    "rwName": "01",
    "latitude": -6.89035,
    "longitude": 107.61105,
    "radius": 200,
    "foto": "/uploads/posko/posko_1725100000000.jpg",
    "fotoUrl": "/uploads/posko/posko_1725100000000.jpg",
    "pic": "Ahmad Fauzi",
    "kontak": "081234567890",
    "dplName": "Dr. Ir. Budi Santoso, M.T.",
    "statusApproval": "APPROVED",
    "createdAt": "2026-08-31T15:00:00.000Z"
  }
}
```

---

### 3. Get Detail Posko KKN Saya (Mahasiswa)
- **Method**: `GET`
- **Path**: `/api/v1/kkn/posko/me`
- **Headers**:
  - `Authorization: Bearer <TOKEN_MAHASISWA>`
- **Response Sukses (`200 OK`)**:
```json
{
  "status": "success",
  "data": {
    "id": "posko_cm123abc456",
    "nama": "Posko KKN Kelompok 1 Dago",
    "alamat": "Jl. Ir. H. Juanda No. 123",
    "kelompokId": "kel_abc123",
    "kelompokName": "Kelompok 01 - Dago",
    "kelurahan": "DAGO",
    "rwName": "01",
    "latitude": -6.89030,
    "longitude": 107.61100,
    "radius": 150,
    "foto": "/uploads/posko/posko_1725100000000.jpg",
    "fotoUrl": "/uploads/posko/posko_1725100000000.jpg",
    "pic": "Ahmad Fauzi",
    "kontak": "081234567890",
    "dplName": "Dr. Ir. Budi Santoso, M.T.",
    "statusApproval": "APPROVED",
    "createdAt": "2026-08-31T15:00:00.000Z"
  }
}
```

---

### 4. Get Multi-Posko & Smart Zones (Presensi Geofence Mobile)
- **Method**: `GET`
- **Path**: `/api/v1/posko-kkn/me/all-zones`
- **Headers**:
  - `Authorization: Bearer <TOKEN_MAHASISWA>`
- **Response Sukses (`200 OK`)**:
```json
{
  "status": "success",
  "data": {
    "kelompokId": "kel_abc123",
    "kelompokNama": "Kelompok 01 - Dago",
    "poskos": [
      {
        "id": "posko_cm123abc456",
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
      "kelompokId": "kel_abc123",
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

## 🛠️ Geofencing & Image Helper Tips untuk Mobile

1. **Resolusi URL Gambar**:
   - Jika `foto` atau `fotoUrl` diawali dengan `/uploads/...`, gabungkan dengan `BASE_URL` backend (contoh: `https://api.berseka.id/uploads/...`).
   - Jika bernilai `null` atau gagal dimuat, tampilkan placeholder ilustrasi posko/ikon `Icons.home_work`.
2. **Formula Geofence Presensi (Haversine Distance)**:
   ```dart
   bool isWithinPoskoGeofence(double userLat, double userLng, PoskoModel posko) {
     final double distanceInMeters = Geolocator.distanceBetween(
       userLat,
       userLng,
       posko.latitude,
       posko.longitude,
     );
     return distanceInMeters <= (posko.radius ?? 150);
   }
   ```

---

## 💬 PROMPT SIAP PAKAI UNTUK MOBILE DEVELOPER (FLUTTER / ANDROID)

Salin prompt di bawah ini dan berikan kepada developer Flutter / Mobile:

```text
Halo Mobile Developer,

Backend API Berseka telah diperbarui untuk fitur Registrasi & Edit Posko KKN serta sistem Geofencing Presensi. Tolong lakukan pembaruan pada aplikasi Mobile (Flutter):

### 1. Update Posko Model & DTO
Tambahkan atribut `radius` dan pastikan fallback `foto` / `fotoUrl`:
- `final int? radius;` // Default 150 jika null
- `final String? foto;`
- `final String? fotoUrl;`
- Getter gambar: `String? get imageUrl => fotoUrl ?? foto;`

### 2. Form Registrasi & Edit Posko KKN (Ketua / Mahasiswa)
- Tambahkan input **Radius Toleransi Geofence (Meter)**:
  - Input angka (contoh: 150 meter).
  - Pilihan cepat / Chip presets: `50m`, `100m`, `150m (Standar)`, `200m`, `300m`, `500m`.
  - Berikan label keterangan: "Jarak toleransi mahasiswa dapat melakukan presensi mandiri di sekitar posko."
- Upload Foto Posko:
  - Gunakan `image_picker` untuk memilih foto kamera / galeri.
  - Kirim via `FormData` (`multipart/form-data`) dengan key `foto`.
  - Saat edit posko: jika user tidak memilih foto baru, biarkan key `foto` kosong atau kirimkan URL lama agar backend tidak menghapus foto eksisting.

### 3. Halaman Detail & Peta Posko
- Tampilkan indikator / badge `Radius: ${posko.radius ?? 150} meter`.
- Pada Google Maps / Flutter Map:
  - Gambar `Circle` overlay di sekitar marker posko dengan `radius: (posko.radius ?? 150).toDouble()`, `fillColor: Colors.indigo.withOpacity(0.15)`, `strokeColor: Colors.indigo`, `strokeWidth: 2`.
- Tampilkan foto posko dengan `CachedNetworkImage` dan fallback placeholder jika `imageUrl == null` atau terjadi error koneksi.

### 4. Validasi Presensi Mahasiswa Berbasis Radius Posko
- Saat mahasiswa melakukan presensi, ambil data posko via `GET /api/v1/kkn/posko/me` atau `GET /api/v1/posko-kkn/me/all-zones`.
- Hitung jarak GPS user ke titik posko menggunakan `Geolocator.distanceBetween(userLat, userLng, posko.latitude, posko.longitude)`.
- Validasi apakah jarak <= `posko.radius ?? 150`. Tampilkan feedback visual (Hijau jika dalam radius posko, Merah jika di luar radius dengan info selisih meter).

Mohon disesuaikan dengan arsitektur state management yang digunakan (Bloc / Riverpod / Provider). Terima kasih!
```
