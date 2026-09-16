# 📋 LAPORAN TEKNIS & KONTRAK ENDPOINT API (TIM MOBILE)
**Topik:** Penyelarasan Aturan Gamifikasi 3-Step Program Kerja (Proker) & Format Respons Endpoint Mobile  
**Target Modul:** Mobile Mahasiswa KKN, Mobile DPL, & Dasbor Gamifikasi  
**Versi API:** `api/v1`  
**Status:** ✅ SUDAH AKTIF DI BACKEND

---

## 📌 DAFTAR ISI
1. [Ringkasan Eksekutif & Aturan Gamifikasi 3-Step Proker](#1-ringkasan-eksekutif--aturan-gamifikasi-3-step-proker)
2. [Matriks Status & Perolehan Poin](#2-matriks-status--perolehan-poin)
3. [Daftar Endpoint & Kontrak Request / Response](#3-daftar-endpoint--kontrak-request--response)
   - [3.1 Update Status / Pelaksanaan Proker (Mahasiswa & DPL)](#31-update-status--pelaksanaan-proker-mahasiswa--dpl)
   - [3.2 Detail Program Kerja](#32-detail-program-kerja)
   - [3.3 Persetujuan Usulan Proker oleh DPL (Approval / Rejection)](#33-persetujuan-usulan-proker-oleh-dpl-approval--rejection)
   - [3.4 Evaluasi & Penilaian Proker oleh DPL](#34-evaluasi--penilaian-proker-oleh-dpl)
   - [3.5 Riwayat Gamifikasi & Saldo Poin Mahasiswa](#35-riwayat-gamifikasi--saldo-poin-mahasiswa)
4. [Penyesuaian Penting Lainnya (Group Score, Presensi, Non-Poin)](#4-penyesuaian-penting-lainnya)
5. [Contoh Panduan Implementasi di Flutter (Dart Model & Service)](#5-contoh-panduan-implementasi-di-flutter)

---

## 1. Ringkasan Eksekutif & Aturan Gamifikasi 3-Step Proker

Sebelumnya terjadi kendala di mana poin proker mahasiswa mandek di angka **+2 poin** karena backend hanya menembakkan poin saat status `DISETUJUI`.

**Perbaikan yang telah diaktifkan di Backend:**
1. Satu Program Kerja (Proker) kini terbagi menjadi **3 tahapan (3-Step Lifecycle)**.
2. Setiap tahapan memberikan **+2 Poin Statis** ke riwayat gamifikasi (`PointHistory`) **setiap anggota kelompok KKN** yang bersangkutan.
3. Total poin mahasiswa bertambah **+6 Poin** setelah proker tuntas diselesaikan.
4. Mekanisme backend dilengkapi **idempotensi aman** (`[ProkerID:<id>:<STEP>]`), sehingga pemanggilan API berulang (misal saat retry koneksi internet) tidak akan menduplikasi poin.
5. Jika usulan proker **DITOLAK** oleh DPL, seluruh poin terkait proker tersebut otomatis dicabut.

---

## 2. Matriks Status & Perolehan Poin

| Step | Status Usulan (`statusUsulan`) | Status Pelaksanaan (`statusPelaksanaan`) | Legacy Status (`status`) | Poin yang Diterima | Tagging Idempotensi di Backend |
| :---: | :--- | :--- | :--- | :---: | :--- |
| **Step 1** | `DISETUJUI` | `BELUM_MULAI` | `DITERIMA` | **+2 PTS** | `[ProkerID:<id>:DISETUJUI]` |
| **Step 2** | `DISETUJUI` | `SEDANG_BERJALAN` | `SEDANG_BERJALAN` | **+2 PTS** *(Total +4)* | `[ProkerID:<id>:BERJALAN]` |
| **Step 3** | `DISETUJUI` | `SELESAI` | `SELESAI` | **+2 PTS** *(Total +6)* | `[ProkerID:<id>:SELESAI]` |
| ❌ | `DITOLAK` | `BELUM_MULAI` | `DITOLAK` | **0 PTS** *(Direset)* | Seluruh tag `[ProkerID:<id>` dihapus |

---

## 3. Daftar Endpoint & Kontrak Request / Response

### 3.1 Update Status / Pelaksanaan Proker (Mahasiswa & DPL)
Digunakan oleh aplikasi mobile saat mahasiswa atau DPL menggeser status pelaksanaan proker (misal dari belum mulai menjadi sedang berjalan, atau dari sedang berjalan menjadi selesai).

* **Method & URL:** `PUT /api/v1/kkn/program-kerja/:id`  
  *(Atau route alias: `PUT /api/v1/logbooks/program-kerja/:id`, `PUT /api/v1/dpl/program-kerja/:id`)*
* **Headers:**  
  ```http
  Authorization: Bearer <JWT_TOKEN>
  Content-Type: application/json
  ```

#### A. Request Body (Mulai Dikerjakan / Sedang Berjalan):
```json
{
  "statusPelaksanaan": "SEDANG_BERJALAN",
  "catatanDpl": "Kegiatan lapangan resmi dimulai."
}
```

#### B. Request Body (Selesai):
```json
{
  "statusPelaksanaan": "SELESAI",
  "catatanDpl": "Seluruh target sosialisasi telah tercapai."
}
```

> 💡 **Fleksibilitas Payload:** Backend menerima baik format camelCase (`statusPelaksanaan`), snake_case (`status_pelaksanaan`), alias (`pelaksanaan`), maupun legacy (`status: "SEDANG_BERJALAN"` / `status: "SELESAI"`).

#### Response Body (`200 OK`):
```json
{
  "success": true,
  "message": "Program Kerja berhasil diperbarui.",
  "data": {
    "id": "clx123abc456proker789",
    "nomor": 1,
    "judul": "Sosialisasi Komposter Rumah Tangga RW 05",
    "deskripsi": "**Sosialisasi Komposter Rumah Tangga RW 05**\n\nPelaksanaan sosialisasi dan demonstrasi pembuatan pupuk organik bersama warga RW 05.",
    "kategori": "LINGKUNGAN",
    "kebutuhanBiaya": 250000,
    "waktuPelaksanaan": "2026-09-20",
    "linkGoogleDrive": "https://drive.google.com/drive/folders/sample-folder-id",
    "statusUsulan": "DISETUJUI",
    "statusPelaksanaan": "SEDANG_BERJALAN",
    "status": "SEDANG_BERJALAN",
    "statusDisplay": "SEDANG_BERJALAN",
    "isUsulanDisetujui": true,
    "isPelaksanaanSelesai": false,
    "catatanDpl": "Kegiatan lapangan resmi dimulai.",
    "kelompokId": "cm-kelompok-kkn-01",
    "kelompok": {
      "id": "cm-kelompok-kkn-01",
      "name": "Kelompok KKN 01 Coblong",
      "kelurahan": "Sadang Serang",
      "cakupanRw": [5, 6]
    },
    "logbooks": [],
    "createdAt": "2026-09-10T08:00:00.000Z",
    "updatedAt": "2026-09-15T21:05:00.000Z"
  }
}
```

---

### 3.2 Detail Program Kerja
* **Method & URL:** `GET /api/v1/kkn/program-kerja/:id` *(atau `GET /api/v1/logbooks/program-kerja/:id`)*
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`

#### Response Body (`200 OK`):
```json
{
  "success": true,
  "data": {
    "id": "clx123abc456proker789",
    "nomor": 1,
    "judul": "Sosialisasi Komposter Rumah Tangga RW 05",
    "deskripsi": "**Sosialisasi Komposter Rumah Tangga RW 05**\n\nPelaksanaan sosialisasi dan demonstrasi pembuatan pupuk organik.",
    "kategori": "LINGKUNGAN",
    "kebutuhanBiaya": 250000,
    "waktuPelaksanaan": "2026-09-20",
    "linkGoogleDrive": "https://drive.google.com/drive/folders/sample-folder-id",
    "statusUsulan": "DISETUJUI",
    "statusPelaksanaan": "SELESAI",
    "status": "SELESAI",
    "statusDisplay": "SELESAI",
    "isUsulanDisetujui": true,
    "isPelaksanaanSelesai": true,
    "skorPenilaian": 92,
    "predikat": "A",
    "evaluasiDpl": "Sangat baik dan partisipasi warga tinggi.",
    "catatanDpl": "Sangat baik dan partisipasi warga tinggi.",
    "kelompokId": "cm-kelompok-kkn-01",
    "kelompok": {
      "id": "cm-kelompok-kkn-01",
      "name": "Kelompok KKN 01 Coblong",
      "kelurahan": "Sadang Serang",
      "cakupanRw": [5, 6],
      "dpl": {
        "id": "user-dpl-123",
        "name": "Dr. DPL Pembimbing, M.T.",
        "phone": "081234567890",
        "nip": "198001012005011001"
      },
      "students": [
        {
          "id": "student-profile-1",
          "nim": "21001001",
          "jurusan": "Teknik Lingkungan",
          "isKetua": true,
          "user": {
            "id": "user-mhs-1",
            "name": "Ahmad Mahasiswa",
            "phone": "08111111111"
          }
        }
      ]
    },
    "logbooks": [
      {
        "id": "log-001",
        "nomor": 1,
        "tanggalKegiatan": "2026-09-18T09:00:00.000Z",
        "tempat": "Balai RW 05",
        "deskripsi": "Koordinasi teknis penempatan komposter",
        "fotoBuktiUrl": "https://server.berseka.id/uploads/logbook-1.jpg",
        "statusApproval": "DISETUJUI",
        "penulis": {
          "id": "user-mhs-1",
          "name": "Ahmad Mahasiswa"
        }
      }
    ]
  }
}
```

---

### 3.3 Persetujuan Usulan Proker oleh DPL (Approval / Rejection)
* **Method & URL:** `PATCH /api/v1/dpl/program-kerja/:id/decision`
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`

#### A. Approve Payload:
```json
{
  "statusUsulan": "DISETUJUI",
  "catatanDpl": "Usulan rencana kerja disetujui."
}
```
*Memicu **Step 1 (+2 PTS)** ke seluruh anggota kelompok.*

#### B. Reject Payload:
```json
{
  "statusUsulan": "DITOLAK",
  "catatanDpl": "Topik proker tidak sesuai dengan tema KKN Tematik."
}
```
*Mencabut seluruh poin proker terkait dari riwayat gamifikasi.*

#### Response Body (`200 OK`):
```json
{
  "success": true,
  "message": "Status usulan program kerja berhasil diperbarui",
  "data": {
    "id": "clx123abc456proker789",
    "statusUsulan": "DISETUJUI",
    "statusPelaksanaan": "BELUM_MULAI",
    "status": "DITERIMA",
    "catatanDpl": "Usulan rencana kerja disetujui."
  }
}
```

---

### 3.4 Evaluasi & Penilaian Proker oleh DPL
* **Method & URL:** `PATCH /api/v1/dpl/program-kerja/:id/penilaian`
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`

#### Request Body:
```json
{
  "skorPenilaian": 90,
  "statusPelaksanaan": "SELESAI",
  "predikat": "A",
  "evaluasiDpl": "Luar biasa, output terdokumentasi rapi."
}
```
*Memicu **Step 3 (+2 PTS)** (total +6 PTS) jika proker belum tercatat selesai sebelumnya.*

#### Response Body (`200 OK`):
```json
{
  "success": true,
  "message": "Penilaian program kerja berhasil disimpan",
  "data": {
    "id": "clx123abc456proker789",
    "skorPenilaian": 90,
    "predikat": "A",
    "statusPenilaian": "SUDAH_DINILAI",
    "statusPelaksanaan": "SELESAI",
    "status": "SELESAI",
    "evaluasiDpl": "Luar biasa, output terdokumentasi rapi."
  }
}
```

---

### 3.5 Riwayat Gamifikasi & Saldo Poin Mahasiswa
* **Method & URL:** `GET /api/v1/gamification/history` *(atau `GET /api/v1/gamification/points`)*
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`

#### Response Body (`200 OK`):
```json
{
  "success": true,
  "data": {
    "totalPoints": 32,
    "history": [
      {
        "id": "ph-uuid-3",
        "points": 2,
        "kategori": "KKN_PROKER",
        "description": "Program Kerja Selesai: Sosialisasi Komposter Rumah Tangga RW 05 [ProkerID:clx123abc456proker789:SELESAI]",
        "createdAt": "2026-09-15T21:05:00.000Z"
      },
      {
        "id": "ph-uuid-2",
        "points": 2,
        "kategori": "KKN_PROKER",
        "description": "Program Kerja Berjalan: Sosialisasi Komposter Rumah Tangga RW 05 [ProkerID:clx123abc456proker789:BERJALAN]",
        "createdAt": "2026-09-15T20:00:00.000Z"
      },
      {
        "id": "ph-uuid-1",
        "points": 2,
        "kategori": "KKN_PROKER",
        "description": "Program Kerja Disetujui: Sosialisasi Komposter Rumah Tangga RW 05 [ProkerID:clx123abc456proker789:DISETUJUI]",
        "createdAt": "2026-09-15T19:00:00.000Z"
      }
    ]
  }
}
```

---

## 4. Formula Resmi Poin Kelompok & Poin DPL KKN

1. **Skor Kelompok (Group Score / `totalGroupPoints` / `poinKelompok`)**:
   - Dihitung menggunakan **Formula Pembobotan Resmi 60% : 40%**:
     $$\mathbf{\text{Poin Kelompok}} = (\text{Poin Proker} \times 0{,}6) + (\text{Rata-rata Poin Anggota} \times 0{,}4)$$
   - **Komponen Program Kerja**:
     - Status Usulan `DISETUJUI`: **+2 Poin**
     - Status Pelaksanaan `SEDANG_BERJALAN`: **+2 Poin lagi** *(Akumulasi 4 Poin)*
     - Status Pelaksanaan `SELESAI`: **+2 Poin lagi** *(Akumulasi 6 Poin)*
   - **Contoh Kasus**:
     - Kelompok memiliki: 2 proker disetujui ($2 \times 2 = 4$), 2 sedang berlangsung ($2 \times 4 = 8$), 2 selesai ($2 \times 6 = 12$).
     - Total Poin Proker = $4 + 8 + 12 = 24\text{ Poin}$.
     - Rata-rata capaian poin anggota = $4\text{ Poin}$.
     - **Poin Kelompok Akhir** = $(24 \times 0{,}6) + (4 \times 0{,}4) = 14{,}4 + 1{,}6 = \mathbf{16\text{ Poin}}$.

2. **Skor DPL (Dosen Pembimbing Lapangan / `poinDpl`)**:
   - Dihitung menggunakan **Data Logbook DPL + Poin Kelompok (Bobot 60% : 40%)**:
     - Jika logbook DPL **tersedia** (minimal 1 logbook): **6 Poin**
     - Jika **tidak tersedia**: **0 Poin**
     $$\mathbf{\text{Poin DPL}} = (\text{Poin Logbook} \times 0{,}6) + (\text{Poin Kelompok} \times 0{,}4)$$
   - **Contoh Kasus**:
     - Logbook DPL tersedia (6 Poin) dan Poin Kelompok 16:
       $$\text{Poin DPL} = (6 \times 0{,}6) + (16 \times 0{,}4) = 3{,}6 + 6{,}4 = \mathbf{10\text{ Poin}}$$
     - Logbook DPL belum diisi (0 Poin) dan Poin Kelompok 16:
       $$\text{Poin DPL} = (0 \times 0{,}6) + (16 \times 0{,}4) = 0 + 6{,}4 = \mathbf{6{,}4\text{ Poin}}$$

3. **Pelanggaran Geofence Presensi (Out of Zone)**:
   - Presensi di luar radius posko tetap tercatat sebagai audit log, tetapi **TIDAK mengurangi saldo poin** mahasiswa (`points: 0`, `kategori: "PENALTY_OUT_OF_ZONE"`).

4. **Pemanfaatan Sampah & Catat Panen**:
   - Form pencatatan pemanfaatan dan panen berfungsi murni sebagai riwayat kegiatan/logbook kelompok (**Non-Poin**).

---

## 5. Contoh Panduan Implementasi di Flutter

### Model Program Kerja (Dart)
```dart
class ProgramKerjaModel {
  final String id;
  final int nomor;
  final String judul;
  final String deskripsi;
  final String? kategori;
  final String statusUsulan;
  final String statusPelaksanaan;
  final String status;
  final int? skorPenilaian;
  final String? predikat;
  final String? catatanDpl;

  ProgramKerjaModel({
    required this.id,
    required this.nomor,
    required this.judul,
    required this.deskripsi,
    this.kategori,
    required this.statusUsulan,
    required this.statusPelaksanaan,
    required this.status,
    this.skorPenilaian,
    this.predikat,
    this.catatanDpl,
  });

  factory ProgramKerjaModel.fromJson(Map<String, dynamic> json) {
    return ProgramKerjaModel(
      id: json['id'] ?? '',
      nomor: json['nomor'] ?? 0,
      judul: json['judul'] ?? '',
      deskripsi: json['deskripsi'] ?? '',
      kategori: json['kategori'],
      statusUsulan: json['statusUsulan'] ?? 'BELUM_DISETUJUI',
      statusPelaksanaan: json['statusPelaksanaan'] ?? 'BELUM_MULAI',
      status: json['status'] ?? 'BELUM_DISETUJUI',
      skorPenilaian: json['skorPenilaian'] != null ? (json['skorPenilaian'] as num).toInt() : null,
      predikat: json['predikat'],
      catatanDpl: json['catatanDpl'],
    );
  }

  bool get isDisetujui => statusUsulan == 'DISETUJUI';
  bool get isSedangBerjalan => statusPelaksanaan == 'SEDANG_BERJALAN';
  bool get isSelesai => statusPelaksanaan == 'SELESAI';
  
  /// Total poin gamifikasi yang didapatkan dari proker ini
  int get calculatedPoints {
    if (statusUsulan == 'DITOLAK') return 0;
    int pts = 0;
    if (isDisetujui) pts += 2;
    if (isSedangBerjalan || isSelesai) pts += 2;
    if (isSelesai) pts += 2;
    return pts; // Maksimal 6 PTS
  }
}
```

### Method Update Status Proker (Service HTTP)
```dart
Future<ProgramKerjaModel?> updateProkerStatus({
  required String prokerId,
  required String targetPelaksanaan, // 'SEDANG_BERJALAN' atau 'SELESAI'
  String? catatan,
}) async {
  final url = Uri.parse('$baseUrl/api/v1/kkn/program-kerja/$prokerId');
  final response = await http.put(
    url,
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({
      'statusPelaksanaan': targetPelaksanaan,
      if (catatan != null) 'catatanDpl': catatan,
    }),
  );

  if (response.statusCode == 200) {
    final body = jsonDecode(response.body);
    if (body['success'] == true) {
      return ProgramKerjaModel.fromJson(body['data']);
    }
  }
  return null;
}
```
