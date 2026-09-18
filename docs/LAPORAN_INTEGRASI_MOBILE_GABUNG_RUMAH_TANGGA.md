# 📢 Update Backend: Rilis Endpoint Fitur Gabung Rumah Tangga (Household Sharing)

Kepada: **Tim Mobile BERSEKA**  
Dari: **Tim Backend**  
Status: **Tersedia di branch `development`**  
Terkait Isu: `404 Not Found` pada rute `POST /api/v1/households/join`

---

## 1. Ringkasan Perubahan

Backend telah mengimplementasikan 2 endpoint untuk alur **Gabung Rumah Tangga (Onboarding Warga & Profil)**:
1. `POST /api/v1/households/join` — Menghubungkan akun anggota keluarga ke Rumah Tangga & Smart Bin Kepala Keluarga.
2. `GET /api/v1/households/my-household` — Mengambil data relasi keluarga, status kepemilikan (`UTAMA` / `TAMBAHAN`), serta nomor kontak penanggung jawab.

---

## 2. Spesifikasi Endpoint

### A. Endpoint Gabung Rumah Tangga

- **Path**: `/api/v1/households/join`
- **Method**: `POST`
- **Header**:
  ```http
  Authorization: Bearer <access_token>
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "headPhone": "0857947745369"
  }
  ```
  *(Backend otomatis mendukung varian format: `08xxx`, `+62xxx`, maupun `62xxx`)*.

- **Response Sukses (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Berhasil terhubung ke Rumah Tangga",
    "data": {
      "household": {
        "id": "hh-uuid-xxxx",
        "address": "Jl. Sangkuriang No. 10",
        "rw": "03",
        "kelurahan": "Dago",
        "kecamatan": "Coblong",
        "headName": "Budi Santoso",
        "headPhone": "0857947745369"
      },
      "user": {
        "id": "user-uuid-xxxx",
        "lifecycleState": "FULLY_ACTIVE",
        "komunitasId": "KOM-123456"
      }
    }
  }
  ```

---

### B. Endpoint Detail Rumah Tangga Saya

- **Path**: `/api/v1/households/my-household`
- **Method**: `GET`
- **Header**:
  ```http
  Authorization: Bearer <access_token>
  ```

- **Response Sukses (`200 OK`)**:

  **1. Jika Akun adalah Kepala Keluarga (`UTAMA`):**
  ```json
  {
    "success": true,
    "data": {
      "myOwnershipType": "UTAMA",
      "headName": "Budi Santoso",
      "sharePhone": "0857947745369",
      "members": [
        {
          "id": "uuid-member-1",
          "name": "Siti Aminah",
          "phone": "081234567890",
          "type": "TAMBAHAN"
        }
      ]
    }
  }
  ```

  **2. Jika Akun adalah Anggota Keluarga (`TAMBAHAN`):**
  ```json
  {
    "success": true,
    "data": {
      "myOwnershipType": "TAMBAHAN",
      "headName": "Budi Santoso",
      "sharePhone": "0857947745369",
      "members": []
    }
  }
  ```

---

## 3. Matriks Error Code untuk Mapping UI Mobile

Gunakan field `error` dari respons JSON backend untuk menampilkan notifikasi/dialog yang sesuai:

| HTTP Status | Error Code (`res.error`) | Pesan Backend (`res.message`) | Rekomendasi Aksi UI Mobile |
| :--- | :--- | :--- | :--- |
| `400` | `VALIDATION_ERROR` | Nomor HP Kepala Keluarga wajib diisi | Tampilkan validasi error di bawah textfield input |
| `400` | `CANNOT_JOIN_SELF` | Anda tidak dapat memasukkan nomor telepon Anda sendiri. | Tampilkan snackbar peringatan nomor mandiri |
| `404` | `HEAD_NOT_FOUND` | Nomor HP Kepala Keluarga tidak terdaftar di Berseka. | Informasikan nomor belum terdaftar |
| `400` | `HEAD_HAS_NO_BIN` | Kepala Keluarga belum mengaktifkan Tempat Sampah di rumah. | Arahkan agar Kepala Keluarga aktivasi bin terlebih dahulu |
| `400` | `ALREADY_FULLY_ACTIVE` | Akun Anda sudah memiliki Tempat Sampah aktif terdaftar. | Peringatan bahwa akun sudah memiliki tong utama |

---

## 4. Arahan Integrasi untuk Tim Mobile

1. **Update Local State / Riverpod Provider**:
   - Setelah respons `POST /api/v1/households/join` sukses, segera mutasikan state `user`:
     - `lifecycleState` set ke `'FULLY_ACTIVE'`.
     - `komunitasId` simpan dari `data.user.komunitasId`.
   - Hal ini memastikan banner/card "Ayo Gabung Komunitas" di Beranda langsung hilang dan status warga berubah menjadi aktif.
2. **Navigasi Pasca-Join**:
   - Tampilkan bottomsheet atau dialog sukses: *"Selamat! Anda telah terhubung dengan Rumah Tangga [headName]"*.
   - Arahkan rute ke Beranda Warga.
3. **Menu Profil Warga**:
   - Konsumsi `GET /api/v1/households/my-household` untuk membedakan badge peran (`Kepala Keluarga` vs `Anggota Keluarga`).
   - Tampilkan list anggota keluarga jika `myOwnershipType == "UTAMA"`.
