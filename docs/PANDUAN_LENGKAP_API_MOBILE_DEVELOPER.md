# 📱 DOKUMENTASI LENGKAP SPESIFIKASI ENDPOINT & RESPONSE API MOBILE DEVELOPER
## Sistem Tata Kelola Sampah Cerdas & Ekosistem KKN — BERSEKA
**Target Pengguna:** Mobile Application Developer (Flutter / Dart / Mobile Team)  
**Status Backend:** ✅ Terstandarisasi, 100% Bebas Data Dummy / Hardcode, & Lulus QC Vitest  
**Terakhir Diperbarui:** 15 September 2026  

---

## 📑 DAFTAR ISI
1. [Lingkungan Server & Konfigurasi Base URL](#1-lingkungan-server--konfigurasi-base-url)
2. [Standarisasi Rumus Poin & Aturan Gamifikasi](#2-standarisasi-rumus-poin--aturan-gamifikasi)
3. [Format Standar Header & Penanganan Respons HTTP](#3-format-standar-header--penanganan-respons-http)
4. [Katalog Endpoint Lengkap & Contoh Respons](#4-katalog-endpoint-lengkap--contoh-respons)
   - [Modul 1: Autentikasi & Profil Pengguna](#modul-1-autentikasi--profil-pengguna)
   - [Modul 2: Mahasiswa KKN (Presensi, Durasi, & Izin)](#modul-2-mahasiswa-kkn-presensi-durasi--izin)
   - [Modul 3: Mahasiswa KKN (Logbook Harian)](#modul-3-mahasiswa-kkn-logbook-harian)
   - [Modul 4: Mahasiswa KKN (Program Kerja, Pemanfaatan, & Panen)](#modul-4-mahasiswa-kkn-program-kerja-pemanfaatan--panen)
   - [Modul 5: Petugas Pemilah & Residu (Flat 5 Poin)](#modul-5-petugas-pemilah--residu-flat-5-poin)
   - [Modul 6: Dosen Pembimbing Lapangan (DPL)](#modul-6-dosen-pembimbing-lapangan-dpl)
   - [Modul 7: Warga & Penyetoran Sampah](#modul-7-warga--penyetoran-sampah)
   - [Modul 8: Papan Peringkat (Leaderboard Ekosistem)](#modul-8-papan-peringkat-leaderboard-ekosistem)
5. [Tabel Kode Galat (Error Codes) & Solusi Penanganan](#5-tabel-kode-galat-error-codes--solusi-penanganan)
6. [Praktik Terbaik Implementasi Flutter (Tips & Best Practices)](#6-praktik-terbaik-implementasi-flutter-tips--best-practices)

---

## 1. Lingkungan Server & Konfigurasi Base URL

Gunakan Base URL sesuai dengan target build aplikasi Anda (Development / QA / Production):

| Lingkungan | Target Base URL | Keterangan |
| :--- | :--- | :--- |
| **Local Emulator Android** | `http://10.0.2.2:5000/api/v1` | IP virtual alias host lokal pada Android Emulator |
| **Local iOS Simulator** | `http://localhost:5000/api/v1` | Localhost mesin macOS untuk iOS Simulator |
| **Local Physical Device** | `http://<IP_LAN_KOMPUTER>:5000/api/v1` | Pastikan smartphone & laptop dalam satu jaringan WiFi |
| **Staging (Testing / QA)** | `https://staging.berseka.id/api/v1` | Server uji coba (Auto-deploy dari branch `staging`) |
| **Production (Live)** | `https://berseka.id/api/v1` *(atau `https://trashcare.makerindo.tech/api/v1`)* | Server Live Produksi VPS |

---

## 2. Standarisasi Rumus Poin & Aturan Gamifikasi

Backend Berseka telah menstandarisasi perhitungan seluruh sistem poin menjadi murni berbasis basis data riil (tanpa nilai acak atau bonus berlebih).

### A. Poin Personal Mahasiswa (Maksimal 10 Poin / Hari)
Dihitung dari 3 aksi harian wajib:
$$\mathbf{\text{Poin Personal Harian}} = \text{Kehadiran (4 PTS)} + \text{Pemenuhan Waktu (3 PTS)} + \text{Logbook (3 PTS)} = \mathbf{10\text{ PTS}}$$

1. **Kehadiran (+4 PTS)**: Diterima saat melakukan `check-in` di dalam radius posko/zona KKN (`KKN_PRESENSI_HADIR`).
2. **Pemenuhan Waktu (+3 PTS)**: Diterima saat `check-out` jika akumulasi durasi kerja harian memenuhi target (`HADIR_MEMENUHI`) (`KKN_DURASI_MEMENUHI`).
3. **Log Aktivitas (+3 PTS)**: Diterima saat mengirimkan laporan logbook harian pertama di tanggal bersangkutan (`KKN_LOGBOOK_HARIAN`).

### B. Poin Program Kerja (2 + 2 + 2 = 6 Poin Siklus)
Setiap proker kelompok memiliki 3 tahap berurutan:
1. **Pengajuan Disetujui DPL**: **+2 Poin** (`KKN_PROKER`)
2. **Sedang Dikerjakan (Aksi Pemanfaatan Sampah)**: **+2 Poin** (`REDUKSI_TONASE`)
3. **Beres (Panen Hasil Olahan)**: **+2 Poin** (`REDUKSI_TONASE`)
*Total per proker tuntas = **6 Poin Proker**.*

### C. Poin Kelompok KKN (Bobot 60% : 40%)
$$\mathbf{\text{Poin Kelompok}} = (\text{Poin Proker} \times 0{,}6) + (\text{Rata-rata Poin Harian Mahasiswa} \times 0{,}4)$$
* Catatan: Rata-rata poin harian mahasiswa berada dalam skala 0 - 10.

### D. Poin DPL (Dosen Pembimbing Lapangan)
$$\mathbf{\text{Poin DPL}} = ([\text{Jumlah Log DPL} \times 5] \times 0{,}5) + (\text{Rerata Poin Kelompok Bimbingan} \times 0{,}5)$$
* Setiap 1 log kegiatan mandiri DPL bernilai tetap **5 Poin**.

### E. Poin Petugas Pemilah & Residu (Flat 5 Poin)
* **Input Timbangan Pemilahan**: Ditetapkan **Flat 5 Poin** (Dihilangkan sistem perkalian per kilogram).
* **Validasi / Pengosongan Tempat Sampah**: Ditetapkan **Flat 5 Poin** (Dihilangkan bonus foto terpisah).

---

## 3. Format Standar Header & Penanganan Respons HTTP

### A. Header Standar
```http
Authorization: Bearer <access_token_jwt>
Accept: application/json
Content-Type: application/json
```
*(Gunakan `Content-Type: multipart/form-data` saat mengunggah foto/berkas).*

### B. Pola Response Sukses
```json
{
  "success": true,
  "message": "Operasi berhasil dilakukan.",
  "data": { ... }
}
```

### C. Pola Response Galat (Error)
```json
{
  "success": false,
  "message": "Pesan deskripsi kesalahan yang ramah pengguna.",
  "error": "KODE_ERROR_BACKEND",
  "details": null
}
```

---

## 4. Katalog Endpoint Lengkap & Contoh Respons

---

### Modul 1: Autentikasi & Profil Pengguna

#### 1.1. Login Pengguna
* **Endpoint:** `POST /api/v1/auth/login`
* **Auth:** Tidak Diperlukan (*Public*)
* **Body:**
```json
{
  "email": "mahasiswa1@berseka.id",
  "password": "Password123!"
}
```
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Login berhasil.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "user": {
      "id": "usr_mhs_001",
      "name": "Ahmad Fauzi",
      "email": "mahasiswa1@berseka.id",
      "role": "MAHASISWA_KKN",
      "peran": "MAHASISWA_KKN",
      "phone": "081234567890",
      "kelompokId": "klp_sadang_01",
      "kelompokName": "Kelompok 01 Sadang Serang",
      "nim": "10123045",
      "jurusan": "Teknik Lingkungan"
    }
  }
}
```

#### 1.2. Ambil Profil Sendiri (Session Check)
* **Endpoint:** `GET /api/v1/auth/me`
* **Headers:** `Authorization: Bearer <token>`
* **Response (200 OK):** Mengembalikan data profil lengkap pengguna yang sedang aktif beserta relasi wilayah dan peran.

---

### Modul 2: Mahasiswa KKN (Presensi, Durasi, & Izin)

#### 2.1. Check-In (Mulai Kegiatan Lapangan)
* **Endpoint:** `POST /api/v1/kkn/attendance/check-in`
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
* **Dampak Poin:** Memberikan **+4 Poin** (`KKN_PRESENSI_HADIR`).
* **Request Body:**
```json
{
  "scheduleId": "sch_2026_09_15",
  "latitude": -6.890250,
  "longitude": 107.612400,
  "method": "GPS",
  "deskripsiKegiatan": "Mulai sosialisasi pemilahan sampah organik di RW 03",
  "fotoUrl": "https://staging.berseka.id/uploads/presensi/checkin_001.jpg"
}
```
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Check-in berhasil dicatat (+4 PTS Kehadiran didapatkan).",
  "data": {
    "id": "att_01j7y001",
    "status": "BERLANGSUNG",
    "attendedAt": "2026-09-15T08:00:00.000Z",
    "pointsAwarded": 4,
    "isInRadius": true
  }
}
```

#### 2.2. Check-Out (Akhiri Kegiatan & Hitung Durasi)
* **Endpoint:** `POST /api/v1/kkn/attendance/check-out`
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
* **Dampak Poin:** Jika total menit akumulasi kerja memenuhi target harian, status diubah menjadi `HADIR_MEMENUHI` dan mendapatkan **+3 Poin** (`KKN_DURASI_MEMENUHI`).
* **Request Body:**
```json
{
  "scheduleId": "sch_2026_09_15",
  "latitude": -6.890240,
  "longitude": 107.612410,
  "accumulatedDurationSeconds": 14400,
  "deskripsiKegiatan": "Selesai mendampingi warga dan pengisian logbook.",
  "fotoUrl": "https://staging.berseka.id/uploads/presensi/checkout_001.jpg"
}
```
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Check-out berhasil. Durasi kerja terpenuhi (+3 PTS Pemenuhan Waktu).",
  "data": {
    "id": "att_01j7y001",
    "status": "HADIR_MEMENUHI",
    "attendedAt": "2026-09-15T08:00:00.000Z",
    "checkOutAt": "2026-09-15T16:05:00.000Z",
    "durationMinutes": 240,
    "isMemenuhiDurasi": true,
    "pointsAwarded": 3
  }
}
```

#### 2.3. Pengajuan Izin / Sakit
* **Endpoint:** `POST /api/v1/kkn/attendance/leave-request`
* **Headers:** `Content-Type: multipart/form-data`
* **Form Fields:**
  - `tanggal`: `2026-09-16` (YYYY-MM-DD)
  - `jenis`: `SAKIT` atau `IZIN`
  - `alasan`: `Demam tinggi dan istirahat dokter`
  - `file`: Berkas surat dokter / bukti pendukung (PDF/JPG/PNG)
* **Response (201 Created):**
```json
{
  "success": true,
  "message": "Pengajuan izin berhasil dikirim dan menunggu verifikasi DPL.",
  "data": {
    "id": "lvr_01j8899",
    "status": "PENDING",
    "tanggal": "2026-09-16T00:00:00.000Z"
  }
}
```

---

### Modul 3: Mahasiswa KKN (Logbook Harian)

#### 3.1. Pengisian Logbook Aktivitas
* **Endpoint:** `POST /api/v1/kkn/logbook`
* **Headers:** `Content-Type: multipart/form-data`
* **Dampak Poin:** Memberikan **+3 Poin** (`KKN_LOGBOOK_HARIAN`) untuk logbook pertama di tanggal terkait.
* **Form Fields:**
  - `tanggalKegiatan`: `2026-09-15`
  - `tempat`: `Balai Pertemuan RW 03 Sadang Serang`
  - `deskripsi`: `Sosialisasi pembuatan Loseda (Lodong Sesa Dapur) untuk 10 warga RT 02.`
  - `programKerjaId`: `proker_01` *(Opsional)*
  - `file`: Gambar dokumentasi kegiatan
* **Response (201 Created):**
```json
{
  "success": true,
  "message": "Logbook harian berhasil dikirim (+3 PTS Log Aktivitas didapatkan).",
  "data": {
    "id": "log_01j7z001",
    "pekanKe": 3,
    "tanggalKegiatan": "2026-09-15T00:00:00.000Z",
    "tempat": "Balai Pertemuan RW 03 Sadang Serang",
    "deskripsi": "Sosialisasi pembuatan Loseda...",
    "fotoBuktiUrl": "/uploads/logbook-1726389200.jpg",
    "statusApproval": "MENUNGGU_PERSETUJUAN_KETUA",
    "pointsAwarded": 3
  }
}
```

---

### Modul 4: Mahasiswa KKN (Program Kerja, Pemanfaatan, & Panen)

#### 4.1. Daftar Program Kerja
* **Endpoint:** `GET /api/v1/kkn/program-kerja`
* **Headers:** `Authorization: Bearer <token>`
* **Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "proker_01",
      "judul": "Budidaya Maggot BSF Organik",
      "deskripsi": "Pengolahan sampah sisa makanan dapur rumah tangga menggunakan biopond BSF",
      "statusUsulan": "DISETUJUI",
      "statusPelaksanaan": "SEDANG_BERJALAN",
      "kategori": "Pemanfaatan",
      "poinKontribusiProker": 4
    }
  ]
}
```

#### 4.2. Catat Pemanfaatan Sampah (Tahap Kerjain ➔ +2 Poin)
* **Endpoint:** `POST /api/v1/kkn/pemanfaatan-sampah`
* **Headers:** `Content-Type: multipart/form-data`
* **Form Fields:** `teknologi`, `bahanBaku`, `beratInputKg`, `programKerjaId`, `foto`.
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Aksi pemanfaatan sampah dicatat. Status proker beralih ke SEDANG_BERJALAN (+2 PTS).",
  "data": {
    "id": "pmf_001",
    "status": "PROSES",
    "prokerStatus": "SEDANG_BERJALAN",
    "earnedPoints": 2
  }
}
```

#### 4.3. Catat Panen Hasil (Tahap Beres ➔ +2 Poin, Kumulatif 6 Poin)
* **Endpoint:** `POST /api/v1/kkn/panen-hasil`
* **Headers:** `Content-Type: multipart/form-data`
* **Form Fields:** `pemanfaatanId`, `beratOutputKg`, `nilaiEkonomiRp`, `jenisKomoditas`, `foto`.
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Hasil panen dicatat. Status proker beralih ke SELESAI (+2 PTS, Total 6 PTS).",
  "data": {
    "id": "pmf_001",
    "status": "SELESAI",
    "prokerStatus": "SELESAI",
    "earnedPoints": 2
  }
}
```

---

### Modul 5: Petugas Pemilah & Residu (Flat 5 Poin)

#### 5.1. Input Timbangan Pemilahan Sampah
* **Endpoint:** `POST /api/v1/petugas-residu/submit-log`
* **Headers:** `Content-Type: multipart/form-data`
* **Dampak Poin:** Ditetapkan **Flat 5 Poin** (kategori ledger: `SUBMIT_RESIDU`).
* **Form Fields:**
  - `weightKg`: `15.5`
  - `classification`: `Organik` atau `Anorganik`
  - `lokasiTps`: `TPS RW 03 Coblong`
  - `photo`: File foto bukti timbangan
* **Response (201 Created):**
```json
{
  "success": true,
  "message": "Log timbangan pemilahan berhasil dicatat (+5 Poin Petugas).",
  "data": {
    "id": "res_log_001",
    "berat": 15.5,
    "weightKg": 15.5,
    "classification": "Organik",
    "pointsEarned": 5,
    "points": 5,
    "imagePhotoUrl": "/uploads/residu-001.jpg",
    "status": "TERKIRIM"
  }
}
```

#### 5.2. Validasi Pengosongan Tempat Sampah
* **Endpoint:** `POST /api/v1/petugas-residu/requests/:id/accept`
* **Dampak Poin:** Ditetapkan **Flat 5 Poin** (kategori ledger: `VALIDASI_PENGOSONGAN`).
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Tempat sampah berhasil dikosongkan dan divalidasi (+5 Poin Petugas).",
  "data": {
    "binId": "bin_004",
    "points": 5,
    "status": "EMPTY_CLEANED"
  }
}
```

---

### Modul 6: Dosen Pembimbing Lapangan (DPL)

#### 6.1. Catat Logbook Aktivitas Mandiri DPL
* **Endpoint:** `POST /api/v1/dpl/activity-logs`
* **Dampak Poin:** Setiap 1 log yang dicatat bernilai tetap **5 Poin** (berkontribusi 50% pada total skor DPL).
* **Form Fields:** `tanggal`, `pekanKe`, `waktuMulai`, `waktuSelesai`, `kelompokId`, `kategori`, `deskripsi`, `foto`.
* **Response (201 Created):**
```json
{
  "success": true,
  "message": "Aktivitas DPL berhasil dicatat (Bernilai 5 Poin DPL).",
  "data": {
    "id": "dpl_log_001",
    "points": 5,
    "deskripsi": "Kunjungan evaluasi biopond maggot RW 03"
  }
}
```

---

### Modul 7: Warga & Penyetoran Sampah

#### 7.1. Registrasi Akun Warga
* **Endpoint:** `POST /api/v1/auth/register`
* **Aturan Khusus (Anti-Dummy):**
  - Warga wajib menyertakan identitas wilayah valid (`rwId` atau `kelurahanId`).
  - Akun baru disetel ke status `lifecycleState: "REGISTERED"` untuk menunggu verifikasi RW setempat.
* **Body:**
```json
{
  "name": "Budi Gunawan",
  "email": "warga.budi@example.com",
  "password": "Password123!",
  "phone": "081234567890",
  "rwId": 14,
  "address": "Jl. Cisitu Indah No. 12"
}
```

#### 7.2. Setoran Sampah Mandiri
* **Endpoint:** `POST /api/v1/penyetoran/manual`
* **Response (201 Created):** Mengembalikan catatan setoran, estimasi poin reward warga, dan konfirmasi timbangan.

---

### Modul 8: Papan Peringkat (Leaderboard Ekosistem)

#### 8.1. Leaderboard Ekosistem KKN
* **Endpoint:** `GET /api/v1/gamification/leaderboard-kkn`
* **Headers:** `Authorization: Bearer <token>`
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "students": [
      {
        "id": "std_01",
        "name": "Ahmad Fauzi",
        "nim": "10123045",
        "kelompok": "Kelompok 01 Sadang Serang",
        "personalPoints": 70,
        "finalScore": 70,
        "totalHours": 45.0,
        "activeBins": 10
      }
    ],
    "groups": [
      {
        "id": "klp_01",
        "name": "Kelompok 01 Sadang Serang",
        "dplName": "DPL: Dr. Budi Santoso",
        "avgScore": 54.8,
        "poinProker": 24,
        "rataRataPoinAnggota": 68.5,
        "membersCount": 10
      }
    ],
    "dpl": [
      {
        "id": "usr_dpl_01",
        "name": "Dr. Budi Santoso, M.T.",
        "points": 24.9,
        "poinLogbook": 20,
        "poinKelompok": 29.8,
        "logbookCount": 4,
        "totalGroups": 2,
        "totalStudents": 20
      }
    ]
  }
}
```

---

## 5. Tabel Kode Galat (Error Codes) & Solusi Penanganan

| HTTP Code | Error Code Backend | Deskripsi Penyebab | Rekomendasi Solusi di Mobile |
| :---: | :--- | :--- | :--- |
| **400** | `VALIDATION_ERROR` | Parameter atau format JSON tidak sesuai skema | Periksa kembali format body / field yang dikirim |
| **401** | `TOKEN_EXPIRED` | Token JWT kedaluwarsa | Lakukan refresh token atau arahkan ke layar Login |
| **403** | `FORBIDDEN_ROLE` | Role pengguna tidak memiliki hak akses endpoint | Sembunyikan tombol / navigasi yang tidak sesuai hak akses |
| **403** | `OUTSIDE_ZONE` | Posisi GPS berada di luar radius Posko / TPS | Tampilkan dialog panduan: mendekat ke lokasi posko |
| **409** | `ALREADY_CHECKED_IN` | Mahasiswa sudah check-in pada jadwal hari ini | Perbarui status UI menjadi `SEDANG_AKTIF` |
| **409** | `LOGBOOK_ALREADY_EXISTS` | Logbook pada tanggal tersebut sudah pernah diajukan | Arahkan ke mode Edit Logbook, jangan buat baru |
| **404** | `RESOURCE_NOT_FOUND` | Data yang dicari tidak ditemukan di database | Tampilkan Empty State yang informatif dengan tombol Coba Lagi |
| **500** | `INTERNAL_SERVER_ERROR` | Kesalahan server internal | Tampilkan error banner dan tombol coba lagi (*retry*) |

---

## 6. Praktik Terbaik Implementasi Flutter (Tips & Best Practices)

### 1. Parsing Poin Aman (Null-Safety & Casting)
Poin dihitung sebagai bilangan bulat murni (`int`). Selalu lakukan parsing defensif:
```dart
int parsePoints(dynamic rawValue) {
  if (rawValue == null) return 0;
  if (rawValue is int) return rawValue;
  if (rawValue is double) return rawValue.round();
  if (rawValue is String) return int.tryParse(rawValue) ?? 0;
  return 0;
}

// Penggunaan pada Model:
final points = parsePoints(json['points']);
final contributionPoints = parsePoints(json['stats']?['contributionPoints']);
```

### 2. Penanganan Token Kedaluwarsa (Interceptor Refresh Auto)
Pada `Dio` atau `HttpInterceptor`, tangkap status `401` untuk mencoba me-refresh session sebelum memaksa *logout*:
```dart
dio.interceptors.add(InterceptorsWrapper(
  onError: (DioException error, handler) async {
    if (error.response?.statusCode == 401) {
      final success = await authProvider.refreshToken();
      if (success) {
        // Ulangi request sebelumnya dengan token baru
        return handler.resolve(await dio.fetch(error.requestOptions));
      } else {
        authProvider.forceLogout();
      }
    }
    return handler.next(error);
  },
));
```

### 3. Invalidate Provider / State Refresh Setelah Mutasi
Setiap kali melakukan aksi mutasi data (`check-in`, `check-out`, `submit-log`, `logbook`), segera lakukan refresh pada data terkait:
```dart
// Contoh pada Riverpod:
await ref.read(kknAttendanceControllerProvider.notifier).checkIn(...);
ref.invalidate(kknDashboardProvider);
ref.invalidate(pointHistoryProvider);
ref.invalidate(kknLeaderboardProvider);
```

### 4. Unggah Dokumen / Foto Menggunakan FormData
Selalu sertakan `filename` saat membungkus berkas ke dalam `MultipartFile`:
```dart
final formData = FormData.fromMap({
  'tanggalKegiatan': '2026-09-15',
  'deskripsi': deskripsiController.text,
  'file': await MultipartFile.fromFile(
    pickedFile.path,
    filename: 'logbook_${DateTime.now().millisecondsSinceEpoch}.jpg',
  ),
});
```

---
*Dokumen ini merupakan spesifikasi resmi antarmuka integrasi Mobile BERSEKA.*  
*Untuk pertanyaan teknis lebih lanjut, hubungi tim Backend API (Main Repository).*