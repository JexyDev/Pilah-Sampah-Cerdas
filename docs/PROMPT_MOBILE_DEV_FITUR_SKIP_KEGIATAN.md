# 📱 Panduan Integrasi & Prompt Mobile Developer: Fitur Skip Kegiatan KKN ("Tidak Ada Kegiatan")

Dokumen ini berisi spesifikasi teknis endpoint Backend API yang telah selesai diimplementasikan serta **Prompt Siap Pakai** untuk diberikan kepada Mobile Developer (Flutter).

---

## 🌐 1. Spesifikasi Endpoint Backend API

### A. Endpoint Skip Kegiatan (Baru)

- **Method**: POST
- **URL**: /api/v1/kkn/kegiatan/:id/skip  
  *(Alias: /api/v1/kegiatan/:id/skip)*
- **Headers**:
  `http
  Authorization: Bearer <JWT_ACCESS_TOKEN>
  Content-Type: application/json
  `
- **Path Parameters**:
  - id *(string, required)*: ID Jadwal/Kegiatan KKN.
- **Request Body** *(JSON, optional)*:
  `json
  {
    "alasan": "Tidak ada kegiatan di posko pada hari ini"
  }
  `
  *(Default nilai lasan jika tidak dikirim: "Tidak ada kegiatan")*

#### 🟢 Response Sukses (200 OK):
`json
{
  "success": true,
  "message": "Kegiatan berhasil ditandai sebagai Tidak Ada Kegiatan.",
  "data": {
    "kegiatanId": "sch-0b819fa2-8b43-4f51-bdfc-2798f6d6c412",
    "jadwalId": "sch-0b819fa2-8b43-4f51-bdfc-2798f6d6c412",
    "statusKegiatan": "TIDAK_ADA_KEGIATAN",
    "totalMahasiswaTerdampak": 8,
    "alasan": "Tidak ada kegiatan di posko pada hari ini",
    "ditandaiOleh": "user-dpl-or-ketua-uuid",
    "ditandaiPada": "2026-08-30T15:00:00.000Z"
  }
}
`

#### 🔴 Response Error - Tidak Memiliki Izin / Bukan Ketua/DPL (403 Forbidden):
`json
{
  "success": false,
  "error": "FORBIDDEN",
  "message": "Anda tidak memiliki izin untuk melewati kegiatan ini."
}
`

#### 🔴 Response Error - Kegiatan Sudah Dimulai / Selesai (409 Conflict):
`json
{
  "success": false,
  "error": "CONFLICT",
  "message": "Tidak dapat skip kegiatan yang sudah dimulai."
}
`

#### 🔴 Response Error - Jadwal Tidak Ditemukan (404 Not Found):
`json
{
  "success": false,
  "error": "NOT_FOUND",
  "message": "Jadwal kegiatan tidak ditemukan."
}
`

---

### B. Endpoint Kegiatan Aktif (Data Terupdate)

- **Method**: GET
- **URL**: /api/v1/kkn/kegiatan-aktif
- **Headers**:
  `http
  Authorization: Bearer <JWT_ACCESS_TOKEN>
  `

#### Cuplikan Response Item Kegiatan yang di-Skip:
`json
{
  "success": true,
  "data": [
    {
      "id": "sch-0b819fa2-8b43-4f51-bdfc-2798f6d6c412",
      "namaKegiatan": "Kegiatan Harian Posko KKN Sekeloa",
      "tanggal": "2026-08-30",
      "jamMulai": "08:00",
      "jamSelesai": "16:00",
      "durasiWajibMenit": 120,
      "lokasi": {
        "alamat": "Posko KKN Sekeloa",
        "latitude": -6.8900,
        "longitude": 107.6200,
        "radiusMeter": 200,
        "polygon": null
      },
      "status": "AKTIF",
      "statusKehadiran": "TIDAK_ADA_KEGIATAN",
      "attendanceStatus": "TIDAK_ADA_KEGIATAN",
      "statusDisplay": "Tidak Ada Kegiatan",
      "isMemenuhiDurasi": false,
      "keteranganSkip": "Tidak ada kegiatan di posko pada hari ini",
      "skippedBy": "user-dpl-uuid",
      "skippedAt": "2026-08-30T15:00:00.000Z",
      "actualInZoneSeconds": 0,
      "actualInZoneMinutes": 0,
      "attendedAt": "2026-08-30T15:00:00.000Z",
      "time": "08:00 - 16:00"
    }
  ]
}
`

---

## 💬 2. Prompt Siap Pakai untuk Mobile Developer (Flutter)

Salin prompt di bawah ini dan kirimkan langsung kepada Mobile Developer:

\\\markdown
Halo Tim Mobile Dev! 👋

Endpoint Backend untuk fitur **"Skip Kegiatan KKN" (TIDAK_ADA_KEGIATAN)** sudah selesai dideploy dan diuji (100% lulus unit test).

Berikut panduan & spesifikasi untuk implementasi di aplikasi Mobile Flutter:

### 1. Endpoint Details
- URL: POST /api/v1/kkn/kegiatan/:id/skip
- Header: Authorization: Bearer <token>
- Body: {"alasan": "Tidak ada kegiatan pada hari ini"}
- Izin: Hanya DPL dan Ketua Kelompok (isKetua == true) yang dapat memanggil endpoint ini. Mahasiswa biasa akan mendapat response 403.
- Response Sukses: 200 OK dengan status TIDAK_ADA_KEGIATAN.

### 2. Task Checklist Mobile:
1. **lib/app/data/repositories/kkn_repository.dart & api_kkn_repository.dart**:
   Tambahkan method:
   \\\dart
   Future<void> skipKegiatan(String kegiatanId, {String? alasan}) async {
     await apiClient.dio.post(
       '/kkn/kegiatan/\/skip',
       data: {'alasan': alasan ?? 'Tidak ada kegiatan pada hari ini'},
     );
   }
   \\\

2. **lib/app/modules/mahasiswa/controllers/kkn_location_controller.dart**:
   - Tambahkan konstanta: static const String kStatusTidakAdaKegiatan = 'TIDAK_ADA_KEGIATAN';
   - Tambahkan method skipKegiatan(String kegiatanId, {String? alasan}):
     - Panggil repo skipKegiatan.
     - Refresh list kegiatan aktif / update state lokal statusKehadiran = 'TIDAK_ADA_KEGIATAN'.
   - Pastikan canStart bernilai false jika statusKehadiran == 'TIDAK_ADA_KEGIATAN'.

3. **lib/app/modules/mahasiswa/views/kkn_attendance_view.dart (KegiatanKknCard)**:
   - Jika statusKehadiran == 'TIDAK_ADA_KEGIATAN':
     - Badge header: "⚪ TIDAK ADA KEGIATAN" (background abu-abu netral Colors.grey.shade200, text Colors.grey.shade800).
     - Tombol Utama: Disabled dengan label "Tidak Ada Kegiatan".
   - Tombol Aksi Tambahan:
     - Jika user adalah Ketua Kelompok atau DPL, dan status kehadiran masih kosong/belum mulai:
       Tampilkan tombol "Tandai: Tidak Ada Kegiatan" (ikon Icons.event_busy_rounded, warna abu-abu/outline).
     - Saat tombol diklik, tampilkan modal konfirmasi:
       "⚠️ Tandai 'Tidak Ada Kegiatan'?"
       "Seluruh anggota kelompok pada jadwal ini akan mendapatkan status 'Tidak Ada Kegiatan' dan tidak diwajibkan hadir."
       Pilihan: [Batal] [Ya, Tandai]

Terima kasih! Jika ada kendala integrasi, silakan kabari. 🚀
\\\

---
