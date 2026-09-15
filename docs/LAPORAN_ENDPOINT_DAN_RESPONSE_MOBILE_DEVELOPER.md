# 📱 LAPORAN RESMI SPESIFIKASI ENDPOINT & RESPONSE API MOBILE DEVELOPER
## Sistem Tata Kelola Sampah & Gamifikasi KKN — BERSEKA
**Versi Dokumen:** 2.0 (Formula Penilaian Resmi & Anti-Overawarding)  
**Target Pembaca:** Mobile Application Developer (Flutter / Riverpod)  
**Tanggal Rilis:** 15 September 2026  

---

## 1. 📢 Ringkasan Perubahan Formula Poin KKN

Sesuai arahan dan pengumuman resmi terbaru Berseka:

### A. Poin Personal Mahasiswa (Maksimal 10 Poin / Hari)
Nilai dasar 4, 3, dan 3 poin adalah **representasi langsung dari bobot 40%, 30%, dan 30%** dari total 10 poin harian. Oleh karena itu, poin harian dihitung dengan **penjumlahan langsung**:

$$\mathbf{\text{Poin Personal Harian}} = \text{Kehadiran (4)} + \text{Pemenuhan Waktu (3)} + \text{Log Aktivitas (3)} = \mathbf{10\text{ Poin}}$$

| Komponen | Aksi Pemicu di Mobile | Syarat Kelulusan | Poin Didapat | Kategori Database |
| :--- | :--- | :--- | :---: | :--- |
| **1. Kehadiran** | `POST /api/v1/kkn/attendance/check-in` | Hadir dalam radius posko/zona | **+4 PTS** | `KKN_PRESENSI_HADIR` |
| **2. Pemenuhan Waktu** | `POST /api/v1/kkn/attendance/check-out` | Total durasi kerja memenuhi target harian (`HADIR_MEMENUHI`) | **+3 PTS** | `KKN_DURASI_MEMENUHI` |
| **3. Log Aktivitas** | `POST /api/v1/kkn/logbook` | Mengisi logbook aktivitas harian | **+3 PTS** | `KKN_LOGBOOK_HARIAN` |

> 📌 **Poin historis yang sudah terkumpul tidak hilang**, sistem menghitung akumulasi Poin Personal dari total poin ketiga komponen tersebut.

---

### B. Poin Kelompok (Bobot 60% : 40%)

$$\mathbf{\text{Poin Kelompok}} = (\text{Poin Proker} \times 0{,}6) + (\text{Rata-Rata Poin Anggota} \times 0{,}4)$$

1. **Komponen Program Kerja (Bobot 60%)**:
   - **Input / Usulan Disetujui**: **+2 Poin**
   - **Kerjain / Sedang Berlangsung**: **+2 Poin** *(akumulasi berjalan = 4 Poin)*
   - **Beres / Selesai**: **+2 Poin** *(akumulasi tuntas = 6 Poin)*
   - *Total per Proker tuntas:* **6 Poin Proker**.
2. **Rata-Rata Poin Anggota (Bobot 40%)**:
   - Rata-rata total Poin Personal dari seluruh mahasiswa di kelompok terkait.

---

### C. Standardisasi Poin Siklus Program Kerja (2 + 2 + 2 = 6 Poin)
Nilai lama yang bernilai anomali (10 dan 25 poin) telah **diganti sepenuhnya** menjadi standar berjenjang:
1. **Pengajuan Proker Disetujui**: **+2 Poin** per anggota (`KKN_PROKER`) saat DPL menyetujui usulan.
2. **Aksi Pemanfaatan Sampah (Sedang Dikerjakan)**: **+2 Poin** per anggota (`REDUKSI_TONASE`) saat logbook pemanfaatan dicatat.
3. **Panen Hasil (Proker Selesai)**: **+2 Poin** per anggota (`REDUKSI_TONASE`) saat hasil olahan dipanen dan proker tuntas.
- Total kumulatif per program kerja tuntas: **$2 + 2 + 2 = 6\text{ Poin}$**.
- Rasio Poin Kelompok (60% Proker : 40% Rata-Rata Anggota) terjaga adil dan proporsional.

---

## 2. 🌐 Spesifikasi Komunikasi HTTP

| Parameter | Lingkungan Pengembangan (Local) | Lingkungan Produksi (Live VPS) |
| :--- | :--- | :--- |
| **Base URL** | `http://10.0.2.2:5000/api/v1` *(Android)*<br>`http://localhost:5000/api/v1` *(iOS / Web)* | `https://trashcare.makerindo.tech/api/v1` |
| **Auth Header** | `Authorization: Bearer <jwt_token>` | `Authorization: Bearer <jwt_token>` |
| **Content-Type Standar** | `application/json` | `application/json` |
| **Content-Type File Upload** | `multipart/form-data` | `multipart/form-data` |

---

## 3. 📚 Katalog Endpoint & Response JSON Lengkap

---

### MODUL 1: Dashboard & Saldo Poin Mahasiswa

#### 1.1. Dashboard Mahasiswa
Mengambil statistik penugasan, lokasi posko, sisa kuota, serta saldo Poin Personal resmi beserta rincian breakdown-nya.

* **Endpoint:** `GET /api/v1/kkn/dashboard`
* **Headers:** `Authorization: Bearer <token>`
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Dashboard Mahasiswa KKN berhasil dimuat.",
  "data": {
    "studentKkn": {
      "nim": "10123045",
      "jurusan": "Teknik Lingkungan",
      "fakultas": "FTSL",
      "whitelistStatus": "APPROVED",
      "endDate": "2026-10-15T00:00:00.000Z",
      "assignedArea": "RW 03 Sadang Serang",
      "latitude": -6.890245,
      "longitude": 107.612398,
      "radiusMeter": 300
    },
    "poskoLocation": {
      "name": "Posko KKN RW 03 Sadang Serang",
      "latitude": -6.890245,
      "longitude": 107.612398,
      "radiusMeter": 300
    },
    "stats": {
      "totalRegistered": 42,
      "remainingQuota": 8,
      "progressPct": 84.0,
      "contributionPoints": 70,
      "points": 70,
      "totalPoints": 70,
      "pointKkn": 70,
      "personalScoreBreakdown": {
        "personalPoints": 70,
        "poinKehadiran": 28,
        "poinPemenuhanWaktu": 21,
        "poinLogAktivitas": 21,
        "rawKehadiran": 28,
        "rawPemenuhanWaktu": 21,
        "rawLogAktivitas": 21
      },
      "maxLimit": 50
    }
  }
}
```

---

#### 1.2. Riwayat Perolehan Poin KKN
Menampilkan daftar log transaksi poin per aksi presensi, pemenuhan durasi, atau logbook.

* **Endpoint:** `GET /api/v1/points/history`
* **Query Params (Opsional):** `?page=1&limit=20`
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Riwayat perolehan poin berhasil diambil.",
  "data": {
    "points": [
      {
        "id": "ph_01j7x001",
        "points": 3,
        "description": "Poin pengisian logbook harian KKN (2026-09-15)",
        "kategori": "KKN_LOGBOOK_HARIAN",
        "createdAt": "2026-09-15T10:30:00.000Z"
      },
      {
        "id": "ph_01j7x002",
        "points": 3,
        "description": "Poin durasi harian terpenuhi (245 menit): Sesi Operasional RW 03",
        "kategori": "KKN_DURASI_MEMENUHI",
        "createdAt": "2026-09-15T16:05:00.000Z"
      },
      {
        "id": "ph_01j7x003",
        "points": 4,
        "description": "Poin kehadiran KKN (Check-In): Sesi Operasional RW 03 (GPS)",
        "kategori": "KKN_PRESENSI_HADIR",
        "createdAt": "2026-09-15T08:00:15.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalRecords": 3
    }
  }
}
```

---

#### 1.3. Leaderboard Mahasiswa & Kelompok KKN
Menampilkan klasemen resmi Mahasiswa (berdasarkan Poin Personal) dan Kelompok KKN (berdasarkan formula 60% Proker + 40% Rata-rata Anggota).

* **Endpoint:** `GET /api/v1/kkn/leaderboard`
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Leaderboard KKN berhasil diambil.",
  "data": {
    "students": [
      {
        "id": "std_01",
        "name": "Ahmad Fauzi",
        "nim": "10123045",
        "kelompok": "Kelompok 01 Sadang Serang",
        "kelompokId": "klp_01",
        "totalHours": 42.5,
        "activeBins": 12,
        "dplScore": 88,
        "personalPoints": 70,
        "finalScore": 70
      }
    ],
    "kelompok": [
      {
        "id": "klp_01",
        "name": "Kelompok 01 Sadang Serang",
        "dplName": "DPL: Dr. Budi Santoso, M.T.",
        "avgScore": 54.8,
        "poinProker": 24,
        "rataRataPoinAnggota": 68.5,
        "membersCount": 10
      }
    ]
  }
}
```

---

### MODUL 2: Presensi GPS & Jam Kerja (Kehadiran & Pemenuhan Waktu)

#### 2.1. Presensi Masuk (Check-In)
Dilakukan di awal kegiatan saat mahasiswa berada di dalam radius posko/zona KKN.  
**Dampak Gamifikasi:** Memberikan **+4 PTS** (`KKN_PRESENSI_HADIR`).

* **Endpoint:** `POST /api/v1/kkn/attendance/check-in`
* **Headers:** `Content-Type: application/json`
* **Request Body:**
```json
{
  "scheduleId": "sch_today_01",
  "latitude": -6.890250,
  "longitude": 107.612400,
  "method": "GPS",
  "deskripsiKegiatan": "Mulai kegiatan sosialisasi pilah sampah di RW 03",
  "fotoUrl": "https://storage.makerindo.tech/presensi/checkin_101.jpg"
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

---

#### 2.2. Presensi Pulang (Check-Out)
Dilakukan saat mahasiswa mengakhiri kegiatan harian. Backend menghitung total menit akumulasi dalam zona.  
**Dampak Gamifikasi:** Jika durasi aktual $\ge$ target durasi harian, status menjadi `HADIR_MEMENUHI` dan mendapatkan **+3 PTS** (`KKN_DURASI_MEMENUHI`). Jika kurang, status menjadi `HADIR_TIDAK_MEMENUHI` (+0 PTS).

* **Endpoint:** `POST /api/v1/kkn/attendance/check-out`
* **Headers:** `Content-Type: application/json`
* **Request Body:**
```json
{
  "scheduleId": "sch_today_01",
  "latitude": -6.890240,
  "longitude": 107.612410,
  "accumulatedDurationSeconds": 14700,
  "deskripsiKegiatan": "Selesai mendampingi 5 warga dan mencatat logbook",
  "fotoUrl": "https://storage.makerindo.tech/presensi/checkout_101.jpg"
}
```
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Check-out berhasil. Durasi kerja terpenuhi (+3 PTS Pemenuhan Waktu didapatkan).",
  "data": {
    "id": "att_01j7y001",
    "status": "HADIR_MEMENUHI",
    "attendedAt": "2026-09-15T08:00:00.000Z",
    "checkOutAt": "2026-09-15T16:05:00.000Z",
    "durationMinutes": 245,
    "isMemenuhiDurasi": true,
    "pointsAwarded": 3
  }
}
```

---

### MODUL 3: Logbook Aktivitas Harian Mahasiswa

#### 3.1. Pengajuan Logbook Harian
Diisi oleh mahasiswa setiap hari untuk mencatat aktivitas riil di lapangan.  
**Dampak Gamifikasi:** Memberikan **+3 PTS** (`KKN_LOGBOOK_HARIAN`, maksimal 1x per tanggal kegiatan).

* **Endpoint:** `POST /api/v1/kkn/logbook`
* **Headers:** `Content-Type: multipart/form-data`
* **Form Fields:**
  - `tanggalKegiatan`: `2026-09-15` (YYYY-MM-DD)
  - `tempat`: `Balai RW 03 Sadang Serang`
  - `deskripsi`: `Melakukan edukasi pemilahan sampah organik kepada 6 KK dan membantu setup wadah komposter.`
  - `programKerjaId`: *(Opsional, ID Proker jika terafiliasi)*
  - `file`: *(File gambar dokumentasi)*
* **Response (201 Created):**
```json
{
  "success": true,
  "message": "Logbook harian berhasil diajukan (+3 PTS Log Aktivitas).",
  "data": {
    "id": "log_01j7z001",
    "pekanKe": 2,
    "tanggalKegiatan": "2026-09-15T00:00:00.000Z",
    "tempat": "Balai RW 03 Sadang Serang",
    "deskripsi": "Melakukan edukasi pemilahan sampah organik kepada 6 KK dan membantu setup wadah komposter.",
    "fotoBuktiUrl": "/uploads/logbook-1726389200.jpg",
    "statusApproval": "MENUNGGU_PERSETUJUAN_KETUA",
    "pointsAwarded": 3
  }
}
```

---

### MODUL 4: Program Kerja (Proker) KKN

#### 4.1. Daftar Program Kerja Kelompok
Menampilkan seluruh program kerja kelompok berserta status usulan dan status pelaksanaannya.

* **Endpoint:** `GET /api/v1/kkn/program-kerja`
* **Headers:** `Authorization: Bearer <token>`
* **Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "proker_01",
      "judul": "Pemberdayaan Rumah Maggot BSF Komunal",
      "deskripsi": "Pembuatan 2 biopond maggot BSF di RW 03",
      "statusUsulan": "DISETUJUI",
      "statusPelaksanaan": "SELESAI",
      "kategori": "Pemanfaatan",
      "targetSelesai": "2026-09-30T00:00:00.000Z",
      "poinKontribusiProker": 6
    },
    {
      "id": "proker_02",
      "judul": "Sosialisasi Pemilahan Organik & Anorganik",
      "deskripsi": "Penyuluhan door-to-door ke 50 rumah warga",
      "statusUsulan": "DISETUJUI",
      "statusPelaksanaan": "SEDANG_BERJALAN",
      "kategori": "Edukasi & Sosialisasi",
      "targetSelesai": "2026-10-05T00:00:00.000Z",
      "poinKontribusiProker": 4
    }
  ]
}
```

---

#### 4.2. Pengajuan Program Kerja Baru
* **Endpoint:** `POST /api/v1/kkn/program-kerja`
* **Headers:** `Content-Type: multipart/form-data`
* **Form Fields:**
  - `judul`: `Pembuatan Bata Terawang Organik RW 03`
  - `deskripsi`: `Instalasi 5 unit bata terawang untuk pengomposan mandiri di lahan warga.`
  - `kategori`: `Pemanfaatan`
  - `targetSelesai`: `2026-10-10`
* **Response (201 Created):**
```json
{
  "success": true,
  "message": "Program kerja berhasil diajukan dan menunggu persetujuan DPL.",
  "data": {
    "id": "proker_03",
    "judul": "Pembuatan Bata Terawang Organik RW 03",
    "statusUsulan": "BELUM_DISETUJUI",
    "statusPelaksanaan": "BELUM_MULAI"
  }
}
```

---

### MODUL 5: Aksi Pemanfaatan Sampah & Panen Hasil

#### 5.1. Catat Aksi Pemanfaatan Sampah (Kerjain)
Mencatat proses input sampah organik ke teknologi (Loseda, Maggot BSF, Komposter, Bata Terawang).  
**Dampak Gamifikasi:** Mengubah status pelaksanaan Proker terafiliasi menjadi `SEDANG_BERJALAN` (**+2 Poin Proker**) dan mencatat riwayat poin **+2 Poin** (`REDUKSI_TONASE`) ke seluruh anggota kelompok KKN.

* **Endpoint:** `POST /api/v1/kkn/pemanfaatan-sampah`
* **Headers:** `Content-Type: multipart/form-data`
* **Form Fields:**
  - `teknologi`: `Maggot BSF`
  - `bahanBaku`: `Sisa Sayur & Nasi Warga RW 03`
  - `beratInputKg`: `35.5`
  - `programKerjaId`: `proker_01`
  - `catatan`: `Pengisian pakan maggot siklus ke-1`
  - `foto`: *(File gambar dokumentasi)*
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Aksi pemanfaatan sampah berhasil disimpan. Poin +2 diberikan ke anggota kelompok.",
  "data": {
    "id": "pmf_01j8a001",
    "teknologi": "Maggot BSF",
    "bahanBaku": "Sisa Sayur & Nasi Warga RW 03",
    "volumeBahanBaku": 35.5,
    "status": "PROSES",
    "programKerjaId": "proker_01",
    "prokerStatus": "SEDANG_BERJALAN",
    "earnedPoints": 2
  }
}
```

---

#### 5.2. Catat Panen Hasil Olahan (Beres)
Mencatat hasil fisik panen olahan (kasgot, kompos matang, telur maggot, POC).  
**Dampak Gamifikasi:** Mengubah status pelaksanaan Proker menjadi `SELESAI` (**+2 Poin Proker**, kumulatif **6 Poin Proker**) dan mencatat riwayat poin **+2 Poin** (`REDUKSI_TONASE`) ke seluruh anggota kelompok KKN.

* **Endpoint:** `POST /api/v1/kkn/panen-hasil`
* **Headers:** `Content-Type: multipart/form-data`
* **Form Fields:**
  - `pemanfaatanId`: `pmf_01j8a001`
  - `beratOutputKg`: `15.0`
  - `nilaiEkonomiRp`: `45000`
  - `jenisKomoditas`: `Kasgot Organik Super`
  - `foto`: *(File gambar hasil panen)*
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Hasil panen berhasil dicatat. Proker beralih ke SELESAI (+2 Poin Proker, Total 6 Poin).",
  "data": {
    "id": "pmf_01j8a001",
    "hasil": 15.0,
    "luasLahanM2": 45000,
    "jenisKomoditas": "Kasgot Organik Super",
    "status": "SELESAI",
    "prokerStatus": "SELESAI",
    "earnedPoints": 2
  }
}
```

---

#### 5.3. Hapus Logbook Pemanfaatan / Batal Panen
Jika laporan dibatalkan atau dihapus:
* **Hapus Pemanfaatan:** `DELETE /api/v1/kkn/pemanfaatan-sampah/:id`
* **Batal Panen:** `DELETE /api/v1/kkn/panen-hasil/:id`
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Data berhasil dihapus dan status proker disesuaikan."
}
```

---

### MODUL 6: Kelompok & Posko KKN

#### 6.1. Profil Kelompok Saya
* **Endpoint:** `GET /api/v1/kkn/kelompok/me`
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "klp_01",
    "name": "Kelompok 01 Sadang Serang",
    "kelurahan": "Sadang Serang",
    "dpl": {
      "id": "usr_dpl_01",
      "name": "Dr. Budi Santoso, M.T.",
      "phone": "+6281299887766"
    },
    "posko": {
      "nama": "Posko KKN RW 03 Sadang Serang",
      "alamat": "Jl. Sadang Serang No. 42",
      "latitude": -6.890245,
      "longitude": 107.612398
    },
    "members": [
      {
        "userId": "usr_mhs_01",
        "name": "Ahmad Fauzi",
        "nim": "10123045",
        "jurusan": "Teknik Lingkungan",
        "isKetua": true,
        "personalPoints": 70
      }
    ]
  }
}
```

---

## 4. 💡 Tips Implementasi di Sisi Mobile (Flutter / Riverpod)

1. **State Refresh Otomatis**:
   Setelah melakukan `check-in`, `check-out`, atau submit `logbook`, selalu trigger invalidate provider berikut agar UI segera ter-update:
   ```dart
   ref.invalidate(pointHistoryProvider);
   ref.invalidate(mahasiswaControllerProvider);
   ```

2. **Null-Safety Parsing Poin**:
   Karena kalkulasi poin di database kini menghasilkan bilangan bulat murni (`int`), parse angka poin dengan aman:
   ```dart
   final points = (json['points'] as num?)?.toInt() ?? 0;
   final contributionPoints = (json['stats']?['contributionPoints'] as num?)?.toInt() ?? 0;
   ```

3. **Indikator Banner Poin KKN**:
   Banner panduan poin di layar profil/poin mahasiswa menampilkan keterangan:
   > *"Formula Resmi Berseka:\n• Poin Personal Harian = Kehadiran (4 PTS) + Pemenuhan Waktu (3 PTS) + Log Aktivitas (3 PTS) = Maksimal 10 PTS/hari\n• Poin Kelompok = (Poin Proker × 0,6) + (Rata-Rata Anggota × 0,4)"*
