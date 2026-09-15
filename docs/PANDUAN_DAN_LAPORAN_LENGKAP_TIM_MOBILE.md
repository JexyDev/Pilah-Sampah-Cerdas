# PANDUAN LENGKAP & LAPORAN PERBAIKAN API UNTUK TIM MOBILE DEVELOPER

**Nomor Dokumen**: 005/DEV-BACKEND/MOBILE-SPEC/IX/2026  
**Kepada**: Habil & Tim Mobile Developer (Flutter)  
**Dari**: Lead Fullstack & Backend Architect (`main`)  
**Tanggal Rilis**: 16 September 2026  
**Status**: RESMI & AKTIF DI VPS (PRODUCTION)  

---

## 1. Ringkasan Eksekutif Resolusi Masalah (Gamifikasi & Notifikasi)

Berdasarkan laporan dari Tim Mobile, Backend telah menyelesaikan 100% perbaikan dan standardisasi pada sistem:

| No | Isu yang Dilaporkan Tim Mobile | Status Backend | Tindakan & Solusi yang Diterapkan |
|---|---|---|---|
| 1 | **Poin Proker Mandek di Tahap 1 (+2 PTS)** | **SELESAI (FIXED)** | Backend telah mengaktifkan fungsi `syncProkerGamificationPoints()` di setiap tahap lifecycle proker: <br>• **Disetujui**: +2 PTS <br>• **Sedang Berjalan** (Submit Pemanfaatan): +2 PTS <br>• **Selesai** (Panen Hasil): +2 PTS <br>*(Total akumulasi 6 PTS per proker utuh tercatat di `PointHistory`)*. |
| 2 | **Poin Kelompok Rusak oleh Desimal 0.6** | **SELESAI (FIXED)** | Pengali pecahan desimal telah **dihapus**. Nilai `totalGroupPoints` di `/api/v1/kkn/kelompok/me` dan `/api/v1/kkn/dashboard` kini mengembalikan **bilangan bulat utuh akumulasi poin proker** (2, 4, 6, 8, ...). |
| 3 | **Poin Personal Buta Terhadap Penalti** | **SELESAI (FIXED)** | Fungsi `calculatePersonalPoints()` dan `calculatePersonalPointsForUsers()` kini menghitung **seluruh saldo riil dari `PointHistory`**, sehingga penalti (seperti `PENALTY_OUT_OF_ZONE = -5`) langsung memotong total skor personal mahasiswa secara akurat. |
| 4 | **Endpoint Proker Kelompok Belum Tersedia** | **SELESAI (NEW)** | Telah disediakan dedicated RESTful endpoints: <br>`GET /api/v1/kelompok/:id/program-kerja` <br>`GET /api/v1/kelompok/:id/proker` <br>`GET /api/v1/kkn/kelompok/:kelompokId/program-kerja` |
| 5 | **Notifikasi Mobile Kosong / Tidak Muncul** | **SELESAI (FIXED)** | Mahasiswa KKN kini memiliki pipeline notifikasi khusus di `GET /api/v1/notifications` yang mengagregasikan: Notifikasi DB Personal, Persetujuan Izin DPL, Validasi Logbook, dan Keputusan Proker. Tidak ada lagi data tong sampah warga (`req-*`) yang bocor. |
| 6 | **Alias Bahasa Indonesia `/notifikasi` & Unread Badge** | **SELESAI (NEW)** | Ditambahkan alias route `GET /api/v1/notifikasi` serta endpoint ringan `GET /api/v1/notifications/unread-count` untuk badge lonceng. |

---

## 2. Dedicated Endpoint Program Kerja Kelompok

### `GET /api/v1/kelompok/:id/program-kerja`
*(Alias: `GET /api/v1/kelompok/:id/proker` atau `GET /api/v1/kkn/kelompok/:kelompokId/program-kerja`)*

Endpoint ini digunakan oleh aplikasi mobile untuk mengambil seluruh daftar program kerja milik suatu kelompok KKN secara spesifik.

- **Headers**:
  ```http
  Authorization: Bearer <ACCESS_TOKEN>
  ```
- **Path Parameter**:
  - `id` *(string)*: ID Kelompok KKN (contoh: `kelompok-sadang-serang-04` atau UUID).
- **Query Parameters (Opsional)**:
  - `statusUsulan`: `DISETUJUI` | `BELUM_DISETUJUI` | `DITOLAK` | `ALL`
  - `statusPelaksanaan`: `BELUM_MULAI` | `SEDANG_BERJALAN` | `SELESAI` | `ALL`
  - `kategori`: `Pemilahan` | `Pengolahan` | `Pemanfaatan` | `Edukasi & Sosialisasi` | `Lainnya`
  - `search`: Kata kunci pencarian judul atau deskripsi proker.

#### Contoh Response JSON:
```json
{
  "success": true,
  "kelompokId": "cm81abc123-group-id",
  "total": 2,
  "data": [
    {
      "id": "cm81proker001",
      "kelompokId": "cm81abc123-group-id",
      "kelompokName": "Kelompok 4 Sadang Serang",
      "kelurahan": "Sadang Serang",
      "cakupanRw": ["RW 01", "RW 02", "RW 04"],
      "dplName": "Dr. Ir. Budi Santoso, M.T.",
      "nomor": 1,
      "judul": "Budidaya Maggot BSF & Biokonversi Sampah Organik",
      "deskripsi": "Program pengolahan sampah organik dapur warga menggunakan larva lalat tentara hitam.",
      "kategori": "Pemanfaatan",
      "sumber": "MAHASISWA",
      "waktuPelaksanaan": "2026-09-20",
      "rencanaAnggaran": 1500000,
      "status": "APPROVED",
      "statusUsulan": "DISETUJUI",
      "statusPelaksanaan": "SEDANG_BERJALAN",
      "catatanDpl": "Rencana sangat baik. Pastikan koordinasi dengan ketua RW 04.",
      "totalLogbookTerkait": 3,
      "penginput": {
        "id": "student-kkn-01",
        "nama": "Robi Darwis",
        "nim": "220101004",
        "prodi": "Teknik Informatika",
        "isKetua": true,
        "phone": "081234567890"
      },
      "createdAt": "2026-09-10T08:00:00.000Z",
      "updatedAt": "2026-09-15T14:30:00.000Z"
    }
  ]
}
```

---

## 3. Spesifikasi Endpoint Notifikasi Mobile Terpadu

### A. Mengambil Daftar Notifikasi User
`GET /api/v1/notifications`  
*(Alias: `GET /api/v1/notifikasi`)*

Mengembalikan daftar notifikasi yang relevan untuk akun yang sedang login (Warga, Mahasiswa KKN, Petugas, atau DPL).

- **Headers**:
  ```http
  Authorization: Bearer <ACCESS_TOKEN>
  ```
- **Contoh Response JSON Mahasiswa KKN**:
```json
{
  "success": true,
  "status": "success",
  "unreadCount": 2,
  "data": [
    {
      "id": "leave-mhs-cm81leave01-approved",
      "type": "IZIN_DISETUJUI",
      "title": "Pengajuan Izin SAKIT Disetujui DPL",
      "desc": "Pengajuan izin SAKIT Anda telah disetujui DPL. Presensi kehadiran telah disesuaikan.",
      "isRead": false,
      "time": "15 menit lalu",
      "createdAt": "2026-09-16T05:45:00.000Z",
      "icon": "check_circle",
      "iconBg": "bg-emerald-100",
      "iconColor": "text-emerald-600"
    },
    {
      "id": "proker-cm81proker001-disetujui",
      "type": "PROKER_DISETUJUI",
      "title": "Program Kerja Disetujui: Budidaya Maggot BSF",
      "desc": "Program kerja \"Budidaya Maggot BSF\" telah disetujui DPL dan siap dijalankan.",
      "isRead": false,
      "time": "1 jam lalu",
      "createdAt": "2026-09-16T05:00:00.000Z",
      "icon": "assignment_turned_in",
      "iconBg": "bg-indigo-100",
      "iconColor": "text-indigo-600"
    },
    {
      "id": "notif-db-uuid-003",
      "type": "POIN_BERTAMBAH",
      "title": "Poin KKN Bertambah! (+2 PTS)",
      "desc": "Program Kerja Berjalan: Budidaya Maggot BSF [ProkerID:cm81proker001:BERJALAN]",
      "isRead": true,
      "time": "1 hari lalu",
      "createdAt": "2026-09-15T09:00:00.000Z",
      "icon": "star",
      "iconBg": "bg-yellow-100",
      "iconColor": "text-yellow-500"
    }
  ]
}
```

---

### B. Mengambil Jumlah Notifikasi Belum Dibaca (Badge Count)
`GET /api/v1/notifications/unread-count`  
*(Alias: `GET /api/v1/notifikasi/unread-count`)*

Endpoint ultra-ringan untuk polling atau refresh counter badge merah di ikon lonceng dashboard.

- **Response**:
```json
{
  "success": true,
  "status": "success",
  "count": 2,
  "unreadCount": 2
}
```

---

### C. Menandai Notifikasi Sudah Dibaca
1. **Tandai 1 Notifikasi**: `PUT /api/v1/notifications/:id/read` *(atau `/api/v1/notifikasi/:id/read`)*
2. **Tandai Semua Dibaca**: `PUT /api/v1/notifications/read-all` *(atau `/api/v1/notifikasi/read-all`)*

- **Response**:
```json
{
  "success": true,
  "status": "success",
  "message": "Notifikasi berhasil ditandai dibaca"
}
```

---

### D. Registrasi FCM Token untuk Push Notification
`POST /api/v1/notifications/device-token`  
*(Alias: `POST /api/v1/notifikasi/device-token`)*

- **Payload JSON**:
```json
{
  "token": "eXample_FCM_Device_Token_From_Firebase_Messaging_SDK..."
}
```
- **Response**:
```json
{
  "status": "success",
  "message": "Device token berhasil disimpan"
}
```

---

## 4. Struktur Formula Poin KKN Terbaru

### A. Poin Personal Mahasiswa (Individu)
$$\text{Poin Personal} = \sum \text{PointHistory (Saldo Riil)}$$
- Presensi Hadir Tepat Waktu: $+4\text{ PTS}$
- Durasi Standar Memenuhi: $+3\text{ PTS}$
- Logbook Harian Terisi: $+3\text{ PTS}$
- Proker Disetujui / Berjalan / Selesai: $+2\text{ PTS / tahap}$
- Penalti Keluar Radius (*Out of Zone*): $-5\text{ PTS}$
- Penalti Alpa (*Tidak Hadir Tanpa Izin*): $-10\text{ PTS}$

### B. Skor Akumulasi Kelompok KKN
$$\text{Poin Kelompok} = \sum (\text{Poin Proker Disetujui} + \text{Poin Proker Berjalan} + \text{Poin Proker Selesai})$$
- Setiap 1 Proker Disetujui: $+2\text{ Poin}$
- Setiap 1 Proker Berjalan: $+2\text{ Poin}$ (total 4)
- Setiap 1 Proker Selesai: $+2\text{ Poin}$ (total 6)
- **Nilai murni integer/bulat (tanpa koma desimal).**

---

## 5. Rekomendasi Integrasi Tim Mobile (Flutter Riverpod)

1. **Gunakan Repository Baru untuk Proker Kelompok**:
   ```dart
   Future<List<Map<String, dynamic>>> getKelompokProgramKerja(String kelompokId) async {
     final res = await apiClient.dio.get('/kelompok/$kelompokId/program-kerja');
     return List<Map<String, dynamic>>.from(res.data['data'] ?? []);
   }
   ```
2. **Hapus Filter Manual yang Memotong Notifikasi**:
   Karena backend sudah tidak mengirim data pengosongan tong sampah warga (`req-*`) ke role `MAHASISWA_KKN`, Tim Mobile dapat mempercayai array data langsung dari `GET /api/v1/notifications`.
3. **Sinkronisasi Badge Lonceng**:
   Panggil `GET /api/v1/notifications/unread-count` saat aplikasi dibuka atau resume dari background untuk mengupdate angka badge notifikasi secara instan.

---
**Lead Fullstack & Backend Architect**  
*Berseka Development Team*
