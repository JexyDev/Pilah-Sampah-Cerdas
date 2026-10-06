# PANDUAN INTEGRASI TEKNIS & HANDOVER RESMI: FITUR TONG KOMUNAL TPS

**Kepada:** Tim Mobile Developer BERSEKA  
**Dari:** Lead / Master Backend Developer BERSEKA  
**Status Implementasi:** **SELESAI (100% PRODUCTION READY & DEPLOYED DI VPS)**  
**Target Lingkungan:** Live Production VPS (`https://berseka.id/api/v1` & `157.10.252.252`)  
**Dokumen Referensi:** `docs/WORK_ORDER_BACKEND_KOMUNAL.md`

---

## ⚠️ TEGURAN RESMI & CATATAN PENTING UNTUK TIM MOBILE
> [!IMPORTANT]
> **DOKUMEN INI BERDIRI SENDIRI KHUSUS UNTUK FITUR TONG KOMUNAL.**  
> Seluruh kebutuhan pada Surat Perintah Kerja (`WORK_ORDER_BACKEND_KOMUNAL.md`) Tahap 1, Tahap 2, dan Tahap 3 telah kami selesaikan, uji dengan test suite otomatis (100% lulus), dan terapkan langsung di server VPS tanpa *downtime*.  
> 
> **Harap baca spesifikasi kontrak JSON dan alur kerja di bawah ini secara teliti dan seksama.** Jangan mencampuradukkan payload fitur Tong Komunal ini dengan fitur Edit Profil Pengguna/Warga yang sudah dilaporkan sebelumnya.

---

## 1. RANGKUMAN HASIL IMPLEMENTASI BACKEND

| Tahapan Work Order | Status Backend | Keterangan Implementasi |
| :--- | :---: | :--- |
| **Tahap 1: Modifikasi Skema Prisma** | ✅ **SELESAI** | Menambahkan `isCommunal: Boolean @default(false)` pada tabel `tempat_sampah` (`Bin`) dan nilai enum `KOMUNAL` pada enum `OwnershipType` (`BinOwnership`). Telah diaplikasikan ke database PostgreSQL via migrasi `20261006151000_add_communal_bin_and_ownership`. |
| **Tahap 2: Endpoint Registrasi Komunal** | ✅ **SELESAI** | Disediakan endpoint terisolasi `POST /api/v1/bins/komunal` khusus role `PETUGAS_RESIDU` / `PETUGAS`. Mendukung registrasi **1 QR Code saja** (Organik saja), bypass pembentukan rumah tangga (`Household`), mengikat GPS permanen, dan menetapkan `isCommunal = true` serta tipe kepemilikan `KOMUNAL`. |
| **Tahap 3: Penyesuaian Setor Sampah (Warga)** | ✅ **SELESAI** | Diperbarui pada `POST /api/v1/bins/scan`. Jika QR Tong Komunal di-scan warga, validasi kepemilikan (`BIN_NOT_OWNED`) dibypass. Poin pemilahan sampah **tetap masuk 100% ke dompet Warga**, sedangkan akumulasi volume sampah **dibebankan ke Tong Komunal TPS milik Petugas**. |

---

## 2. SPESIFIKASI ENDPOINT BARU: REGISTRASI TONG KOMUNAL (KHUSUS PETUGAS)

### A. Endpoint & Otorisasi
- **URL Endpoint:** `POST https://berseka.id/api/v1/bins/komunal` (atau `http://<HOST_API>/api/v1/bins/komunal`)
- **Metode HTTP:** `POST`
- **Headers Wajib:**
  ```http
  Authorization: Bearer <ACCESS_TOKEN_PETUGAS>
  Content-Type: application/json
  ```
- **Akses Role:** HANYA akun dengan role `PETUGAS_RESIDU` atau `PETUGAS`. Akun `WARGA` atau role lain akan ditolak dengan `403 Forbidden`.

---

### B. Payload Permintaan (Request Body)

Mobile dapat mengirimkan payload untuk 1 tong komunal (hanya Organik) atau array tong:

#### Opsi 1: Format Standar / Single Tong Komunal (Sangat Direkomendasikan untuk Mobile)
```json
{
  "qrCodes": ["BERSEKA-ORG-TPS-001"],
  "latitude": -6.892714,
  "longitude": 107.618429,
  "address": "TPS RW 16 Kelurahan Sekeloa, Coblong"
}
```

#### Opsi 2: Format Multi-Tong (Jika Mendaftarkan Sekaligus)
```json
{
  "qrCodes": [
    "BERSEKA-ORG-TPS-001",
    "BERSEKA-ANORG-TPS-001"
  ],
  "latitude": -6.892714,
  "longitude": 107.618429,
  "address": "TPS RW 16 Kelurahan Sekeloa, Coblong"
}
```

#### Kamus Data Field Payload:
| Field | Tipe Data | Wajib? | Keterangan |
| :--- | :--- | :---: | :--- |
| `qrCodes` | `Array<string>` | **Ya** | Daftar QR Code tong yang ditempel. Boleh hanya berisi **1 kode QR** (contoh: tong Organik saja). Tidak wajib berpasangan dengan anorganik. |
| `latitude` | `Float / Number` | **Ya** | Koordinat garis lintang GPS lokasi TPS/tong komunal. Dikunci permanen di database. |
| `longitude` | `Float / Number` | **Ya** | Koordinat garis bujur GPS lokasi TPS/tong komunal. Dikunci permanen di database. |
| `address` | `String` | Opsional | Alamat atau deskripsi lokasi penempatan fisik tong komunal di TPS. |

---

### C. Contoh Respons Sukses (`201 Created`)
```json
{
  "success": true,
  "message": "Tong komunal berhasil didaftarkan (1 tong)",
  "data": {
    "totalRegistered": 1,
    "bins": [
      {
        "id": "e43b1234-a123-4567-8901-abcdef123456",
        "qrCode": "BERSEKA-ORG-TPS-001",
        "category": "ORGANIK",
        "isCommunal": true,
        "ownershipType": "KOMUNAL",
        "status": "AKTIF",
        "registeredAt": "2026-10-06T15:20:00.000Z"
      }
    ],
    "location": {
      "latitude": -6.892714,
      "longitude": 107.618429,
      "address": "TPS RW 16 Kelurahan Sekeloa, Coblong"
    }
  }
}
```

---

### D. Penanganan Error HTTP & Kode Kesalahan
| HTTP Status | Pesan Error (`message`) | Solusi untuk Mobile Developer |
| :---: | :--- | :--- |
| `400 Bad Request` | `Minimal satu QR code tong komunal harus disertakan` | Pastikan array `qrCodes` tidak kosong. |
| `400 Bad Request` | `Koordinat GPS (latitude dan longitude) wajib disertakan untuk tong komunal` | Pastikan izin GPS aktif dan nilai `latitude` serta `longitude` terkirim berupa angka valid. |
| `403 Forbidden` | `Akses ditolak: Hanya petugas yang berwenang mendaftarkan tong komunal` | Pastikan token yang digunakan login adalah akun Petugas Pemilah, bukan Warga. |
| `404 Not Found` | `Tong sampah dengan QR code ... tidak terdaftar di sistem` | Pastikan QR Code sudah dicetak/digenerate di batch master data backend. |
| `409 Conflict` | `Tong sampah ... sudah aktif digunakan` | Tong tersebut sudah terdaftar sebelumnya oleh akun lain. Gunakan stiker QR baru. |

---

## 3. ADAPTASI ENDPOINT SETOR SAMPAH WARGA: `POST /api/v1/bins/scan`

Warga dapat langsung memindai QR Code Tong Komunal yang terpasang di TPS tanpa memerlukan perubahan payload di aplikasi Mobile Warga.

### A. Endpoint & Otorisasi
- **URL Endpoint:** `POST https://berseka.id/api/v1/bins/scan`
- **Metode HTTP:** `POST`
- **Otorisasi:** `Bearer <ACCESS_TOKEN_WARGA>`

### B. Payload dari Mobile Warga (Tetap Standar)
```json
{
  "qrCode": "BERSEKA-ORG-TPS-001",
  "latitude": -6.892714,
  "longitude": 107.618429,
  "wasteType": "ORGANIK",
  "volume": 2.5
}
```

### C. Alur Kerja Logika Backend yang Sudah Aktif:
1. **Bypass Validasi Kepemilikan:** Backend otomatis mendeteksi bahwa `isCommunal == true` atau tipe kepemilikan adalah `KOMUNAL`. Backend **TIDAK AKAN** melempar error `BIN_NOT_OWNED` meskipun Warga tidak memiliki tong sampah tersebut di profil rumah tangganya.
2. **Kredit Poin ke Warga:** Poin reward pemilahan sampah langsung masuk ke dompet akun Warga yang melakukan scan.
3. **Pencatatan Volume ke Tong TPS:** Volume sampah (`volume`) dibukukan langsung ke kapasitas tong komunal terkait untuk kebutuhan monitoring TPS oleh Petugas.

---

## 4. CHECKLIST INTEGRASI UNTUK TIM MOBILE

Silakan Tim Mobile mengimplementasikan UI dan logika flow sesuai panduan ini:
- [ ] Tombol/Menu "Daftar Tong Komunal" hanya ditampilkan jika role pengguna adalah `PETUGAS` / `PETUGAS_RESIDU`.
- [ ] Formulir pendaftaran hanya memerlukan scan 1 QR Code (misal: Organik), GPS TPS otomatis terkunci, dan nama TPS/Alamat.
- [ ] Kirim request ke `POST /api/v1/bins/komunal`.
- [ ] Di sisi Warga, pemindai QR untuk setor sampah tetap mengarah ke `POST /api/v1/bins/scan` tanpa perlu validasi bahwa tong adalah milik warga sendiri.

Semua perubahan sudah live dan dapat langsung dites pada lingkungan server VPS.
