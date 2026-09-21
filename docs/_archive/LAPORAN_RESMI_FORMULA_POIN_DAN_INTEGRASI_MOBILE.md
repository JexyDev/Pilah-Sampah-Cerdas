# 📱 LAPORAN RESMI KONTRAK API & LOGIKA FORMULA POIN KKN (TIM MOBILE)

**Nomor Rilis:** REL-2026-IX-POIN-KKN-V2  
**Tanggal Rilis:** 16 September 2026  
**Status Backend:** ✅ SUDAH AKTIF & TERVERIFIKASI DI BRANCH DEVELOPMENT  
**Target:** Tim Mobile Developer (Flutter) & QA Engineer  

---

## 📌 DAFTAR ISI
1. [Ringkasan Eksekutif & Latar Belakang Penyelarasan](#1-ringkasan-eksekutif--latar-belakang-penyelarasan)
2. [Bedah Logika Rumus & Formula Poin KKN](#2-bedah-logika-rumus--formula-poin-kkn)
   - [2.1 Aturan 3-Step Program Kerja (Proker)](#21-aturan-3-step-program-kerja-proker)
   - [2.2 Formula Poin Kelompok (Bobot 60% : 40%)](#22-formula-poin-kelompok-bobot-60--40)
   - [2.3 Formula Poin DPL (Bobot 60% : 40%)](#23-formula-poin-dpl-bobot-60--40)
3. [Daftar Endpoint, Request & Response JSON Lengkap](#3-daftar-endpoint-request--response-json-lengkap)
   - [3.1 Update Status Pelaksanaan Proker (Mulai / Selesai)](#31-update-status-pelaksanaan-proker-mulai--selesai)
   - [3.2 Detail Program Kerja](#32-detail-program-kerja)
   - [3.3 Info Kelompok KKN & Anggota Tim (GET /api/v1/kkn/kelompok/me)](#33-info-kelompok-kkn--anggota-tim)
   - [3.4 Riwayat Perolehan Poin Gamifikasi Mahasiswa](#34-riwayat-perolehan-poin-gamifikasi-mahasiswa)
   - [3.5 Leaderboard KKN (Mahasiswa, Kelompok, & DPL)](#35-leaderboard-kkn)
   - [3.6 Dasbor & Detail Kelompok DPL](#36-dasbor--detail-kelompok-dpl)
4. [Tindakan Wajib Tim Mobile (Flutter UI/Model Fixes)](#4-tindakan-wajib-tim-mobile-flutter-uimodel-fixes)

---

## 1. Ringkasan Eksekutif & Latar Belakang Penyelarasan

Sebelumnya terjadi kebingungan di mana pengguna dan tim operasional mengira sistem mengalami anomali ("ngaco/halusinasi") karena:
1. Poin proker mahasiswa mandek di **+2 Poin** setelah berstatus `DISETUJUI`, dan tidak bertambah saat `SEDANG_BERJALAN` atau `SELESAI`.
2. Rumus Poin Kelompok terbobot ($60\% : 40\%$) sempat ter-bypass menjadi murni poin proker saja di backend, sementara di kartu antarmuka aplikasi Mobile tertulis label yang salah: **"Penjumlahan poin individu 12 anggota kelompok"**. Mahasiswa yang memiliki total poin tim $> 1.000\text{ PTS}$ kaget melihat angka kartu bernilai belasan poin.
3. Rumus Poin DPL menggunakan pengali logbook tak terhingga ($5\text{ PTS} \times n$) dengan rasio $50\% : 50\%$, bukan biner $6\text{ PTS}$ dengan rasio $60\% : 40\%$.

**Status Saat Ini:** Seluruh inkonsistensi telah **diperbaiki dan diselaraskan secara penuh** di codebase Backend (`apps/api`) mengikuti spesifikasi resmi.

---

## 2. Bedah Logika Rumus & Formula Poin KKN

### 2.1 Aturan 3-Step Program Kerja (Proker)
Setiap 1 Program Kerja (Proker) memiliki 3 tahapan (*3-Step Lifecycle*), di mana setiap tahapannya akan memberikan nilai statis mutlak **+2 poin** ke riwayat gamifikasi (`PointHistory`) setiap anggota kelompok (kategori: `KKN_PROKER`):

| Tahapan | Status Usulan (`statusUsulan`) | Status Pelaksanaan (`statusPelaksanaan`) | Nilai Poin Step | Total Poin Akumulasi | Tagging Idempotensi |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **Step 1: Usulan Disetujui** | `DISETUJUI` | `BELUM_MULAI` | **+2 PTS** | 2 PTS | `[ProkerID:<id>:DISETUJUI]` |
| **Step 2: Mulai Berjalan** | `DISETUJUI` | `SEDANG_BERJALAN` | **+2 PTS** | 4 PTS | `[ProkerID:<id>:BERJALAN]` |
| **Step 3: Tuntas Selesai** | `DISETUJUI` | `SELESAI` | **+2 PTS** | 6 PTS | `[ProkerID:<id>:SELESAI]` |
| ❌ **Usulan Ditolak** | `DITOLAK` | `BELUM_MULAI` | **0 PTS** | 0 PTS | Seluruh tag proker terkait dihapus |

*Idempotensi Aman:* Pemanggilan API berulang (misal saat retry koneksi internet seluler terputus) tidak akan menduplikasi poin berkat mekanisme tagging unik per proker dan per step.

---

### 2.2 Formula Poin Kelompok (Bobot 60% : 40%)
Poin Kelompok adalah **Skor Evaluasi Terbobot KKN** yang menggabungkan kuantitas dan progres program kerja (60%) dengan rata-rata keaktifan harian anggota tim (40%):

$$\mathbf{\text{Poin Kelompok}} = (\text{Poin Proker} \times 0{,}6) + (\text{Rata-rata Poin Anggota} \times 0{,}4)$$

#### Komponen:
1. **Poin Proker:**
   - Proker Disetujui (belum mulai) = **2 Poin**
   - Proker Sedang Berjalan = **4 Poin**
   - Proker Selesai = **6 Poin**
2. **Rata-rata Poin Anggota:**
   - Dihitung dari capaian harian rata-rata presensi & logbook seluruh anggota (skala harian 0–10 poin/hari).

#### Contoh Perhitungan Resmi:
- Kelompok memiliki:
  - 2 proker disetujui: $2 \times 2 = 4\text{ Poin}$
  - 2 proker sedang berlangsung: $2 \times 4 = 8\text{ Poin}$
  - 2 proker selesai: $2 \times 6 = 12\text{ Poin}$
- **Total Poin Proker** = $4 + 8 + 12 = \mathbf{24\text{ Poin}}$
- **Rata-rata Poin Anggota** = $\mathbf{4\text{ Poin}}$
- **Poin Kelompok Akhir:**
  $$\text{Poin Kelompok} = (24 \times 0{,}6) + (4 \times 0{,}4) = 14{,}4 + 1{,}6 = \mathbf{16\text{ Poin}}$$

---

### 2.3 Formula Poin DPL (Bobot 50% : 50%)
Poin DPL (Dosen Pembimbing Lapangan) dihitung berdasarkan pemenuhan kewajiban logbook bimbingan lapangan DPL (50%) dan kinerja kelompok dampingannya (50%):

$$\mathbf{\text{Poin DPL}} = (\text{Poin Logbook DPL} \times 0{,}5) + (\text{Poin Kelompok} \times 0{,}5)$$

#### Komponen:
1. **Poin Logbook DPL (Biner Ketersediaan):**
   - Jika logbook DPL **tersedia** ($\ge 1$ entri): **6 Poin**
   - Jika **tidak tersedia** ($0$ entri): **0 Poin**
2. **Poin Kelompok:**
   - Nilai Poin Kelompok terbobot dari kelompok dampingan DPL tersebut.

#### Contoh Perhitungan Resmi:
- **Skenario A (DPL sudah mengisi logbook, Poin Kelompok = 11,8):**
  $$\text{Poin DPL} = (6 \times 0{,}5) + (11{,}8 \times 0{,}5) = 3{,}0 + 5{,}9 = \mathbf{8{,}9\text{ Poin}}$$
- **Skenario B (DPL belum mengisi logbook, Poin Kelompok = 11,8):**
  $$\text{Poin DPL} = (0 \times 0{,}5) + (11{,}8 \times 0{,}5) = 0 + 5{,}9 = \mathbf{5{,}9\text{ Poin}}$$

---

## 3. Daftar Endpoint, Request & Response JSON Lengkap

### 3.1 Update Status Pelaksanaan Proker (Mulai / Selesai)
Digunakan saat mahasiswa menekan tombol **"Mulai Dikerjakan"** atau **"Selesaikan"** di aplikasi mobile.

* **Method & URL:** `PATCH /api/v1/kkn/program-kerja/:id` *(atau `PUT /api/v1/kkn/program-kerja/:id`)*
* **Headers:**
  ```http
  Authorization: Bearer <JWT_TOKEN>
  Content-Type: application/json
  ```

#### A. Request Body (Mulai Dikerjakan):
```json
{
  "statusPelaksanaan": "SEDANG_BERJALAN"
}
```
*Efek Samping Backend:* Menembakkan **+2 PTS** (`KKN_PROKER`) ke seluruh anggota kelompok dan mengirimkan push notifikasi FCM `PROKER_STARTED`.

#### B. Request Body (Selesaikan):
```json
{
  "statusPelaksanaan": "SELESAI"
}
```
*Efek Samping Backend:* Menembakkan **+2 PTS** (`KKN_PROKER`) tambahan ke seluruh anggota kelompok (total +6 PTS) dan mengirimkan push notifikasi FCM `PROKER_COMPLETED`.

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
    "rencanaAnggaran": 250000,
    "kebutuhanBiaya": 250000,
    "waktuPelaksanaan": "2026-09-20",
    "linkGoogleDrive": "https://drive.google.com/drive/folders/sample-folder-id",
    "urlGoogleDrive": "https://drive.google.com/drive/folders/sample-folder-id",
    "status": "APPROVED",
    "statusUsulan": "DISETUJUI",
    "statusPelaksanaan": "SEDANG_BERJALAN",
    "catatanDpl": "Kegiatan lapangan resmi dimulai.",
    "kelompokId": "cm-kelompok-kkn-01",
    "kelompokNama": "Kelompok KKN 01 Coblong",
    "kelompokName": "Kelompok KKN 01 Coblong",
    "kelurahan": "Sadang Serang",
    "cakupanRw": [5, 6],
    "dplName": "Dr. DPL Pembimbing, M.T.",
    "dplPhone": "081234567890",
    "skorPenilaian": null,
    "predikat": null,
    "statusPenilaian": "BELUM_DINILAI",
    "logbooks": [],
    "pemanfaatan": {
      "totalBeratInputKg": 0,
      "totalBeratOutputKg": 0,
      "totalNilaiEkonomi": 0,
      "totalEntri": 0,
      "perTeknologi": [],
      "entries": []
    }
  }
}
```

---

### 3.2 Detail Program Kerja
* **Method & URL:** `GET /api/v1/kkn/program-kerja/:id`
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`

#### Response Body (`200 OK`):
```json
{
  "success": true,
  "data": {
    "id": "clx123abc456proker789",
    "nomor": 1,
    "judul": "Sosialisasi Komposter Rumah Tangga RW 05",
    "deskripsi": "Pelaksanaan sosialisasi dan demonstrasi pembuatan pupuk organik.",
    "kategori": "LINGKUNGAN",
    "statusUsulan": "DISETUJUI",
    "statusPelaksanaan": "SELESAI",
    "status": "APPROVED",
    "skorPenilaian": 92,
    "predikat": "A",
    "catatanDpl": "Sangat baik dan partisipasi warga tinggi.",
    "kelompokId": "cm-kelompok-kkn-01",
    "kelompokName": "Kelompok KKN 01 Coblong",
    "dplName": "Dr. DPL Pembimbing, M.T."
  }
}
```

---

### 3.3 Info Kelompok KKN & Anggota Tim
* **Method & URL:** `GET /api/v1/kkn/kelompok/me`
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`

#### Response Body (`200 OK`):
```json
{
  "groupId": "cm-kelompok-kkn-01",
  "groupName": "Kelompok KKN 01 Coblong",
  "dosenPembimbing": "Dr. DPL Pembimbing, M.T.",
  "dplName": "Dr. DPL Pembimbing, M.T.",
  "dplNip": "198001012005011001",
  "dplPhone": "081234567890",
  "dpl": {
    "id": "user-dpl-123",
    "name": "Dr. DPL Pembimbing, M.T.",
    "nip": "198001012005011001",
    "phone": "081234567890",
    "nomorWa": "081234567890",
    "fotoProfil": null
  },
  "poskoLocation": "RW 05, Kel. Sadang Serang",
  "poskoAlamat": "Balai Pertemuan Warga RW 05",
  "poskoStatus": "APPROVED",
  "poskoLatitude": -6.885123,
  "poskoLongitude": 107.618456,
  "radiusMeter": 500,
  "isUserLeader": true,
  "totalGroupPoints": 16,
  "members": [
    {
      "userId": "user-mhs-1",
      "nim": "1301210001",
      "name": "Ahmad Ketua Tim",
      "jurusan": "Teknik Informatika",
      "fakultas": "Informatika",
      "individualPoints": 174,
      "isLeader": true
    },
    {
      "userId": "user-mhs-2",
      "nim": "1301210002",
      "name": "Siti Anggota",
      "jurusan": "Teknik Lingkungan",
      "fakultas": "Teknik Sipil & Lingkungan",
      "individualPoints": 100,
      "isLeader": false
    }
  ],
  "linkGoogleDrive": "https://drive.google.com/drive/folders/sample-kkn-coblong"
}
```

> ⚠️ **PENTING UNTUK TIM MOBILE:**  
> Field `totalGroupPoints` di atas bernilai **16** (Formula terbobot: $24 \times 0{,}6 + 4 \times 0{,}4 = 16$).  
> Total akumulasi poin individu kedua anggota adalah $174 + 100 = 274\text{ PTS}$.  
> Jangan gunakan nilai `totalGroupPoints` untuk label "Penjumlahan poin individu"!

---

### 3.4 Riwayat Perolehan Poin Gamifikasi Mahasiswa
* **Method & URL:** `GET /api/v1/gamification/history` *(atau `GET /api/v1/gamification/points`)*
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`

#### Response Body (`200 OK`):
```json
{
  "success": true,
  "data": {
    "totalPoints": 174,
    "history": [
      {
        "id": "ph-003",
        "points": 2,
        "kategori": "KKN_PROKER",
        "description": "Program Kerja Selesai: Sosialisasi Komposter Rumah Tangga RW 05 [ProkerID:clx123abc456proker789:SELESAI]",
        "createdAt": "2026-09-16T08:30:00.000Z"
      },
      {
        "id": "ph-002",
        "points": 2,
        "kategori": "KKN_PROKER",
        "description": "Program Kerja Berjalan: Sosialisasi Komposter Rumah Tangga RW 05 [ProkerID:clx123abc456proker789:BERJALAN]",
        "createdAt": "2026-09-15T10:00:00.000Z"
      },
      {
        "id": "ph-001",
        "points": 2,
        "kategori": "KKN_PROKER",
        "description": "Program Kerja Disetujui: Sosialisasi Komposter Rumah Tangga RW 05 [ProkerID:clx123abc456proker789:DISETUJUI]",
        "createdAt": "2026-09-14T09:00:00.000Z"
      }
    ]
  }
}
```

---

### 3.5 Leaderboard KKN
* **Method & URL:** `GET /api/v1/gamification/leaderboard/kkn`
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`

#### Response Body (`200 OK`):
```json
{
  "students": [
    {
      "id": "st-01",
      "name": "Ahmad Ketua Tim",
      "nim": "1301210001",
      "kelompok": "Kelompok KKN 01 Coblong",
      "kelompokId": "cm-kelompok-kkn-01",
      "totalHours": 48.5,
      "activeBins": 12,
      "personalPoints": 174,
      "finalScore": 174
    }
  ],
  "groups": [
    {
      "id": "cm-kelompok-kkn-01",
      "name": "Kelompok KKN 01 Coblong",
      "dplName": "DPL: Dr. DPL Pembimbing, M.T.",
      "avgScore": 16,
      "poinProker": 24,
      "rataRataPoinAnggota": 4,
      "membersCount": 12
    }
  ],
  "dpl": [
    {
      "id": "user-dpl-123",
      "name": "Dr. DPL Pembimbing, M.T.",
      "points": 10,
      "poinLogbook": 6,
      "poinKelompok": 16,
      "hasLogbook": true,
      "logbookCount": 3,
      "totalGroups": 1,
      "totalStudents": 12
    }
  ]
}
```

---

## 4. Tindakan Wajib Tim Mobile (Flutter UI/Model Fixes)

Untuk mencegah mispersepsi pengguna di aplikasi mobile, Tim Mobile (Habil dkk.) diwajibkan menerapkan 2 penyesuaian:

### 1. Perbaiki Label Teks di `kelompok_kkn_view.dart`
**Berkas:** `mobile/lib/app/modules/mahasiswa/views/kelompok_kkn_view.dart` (Baris 388–414)

```dart
// ❌ KODE LAMA YANG SALAH & MENYESATKAN:
Text('Poin Akumulasi Kelompok'),
Text('${kelompokData.calculatedTotalPoints} Poin'),
Text('Penjumlahan poin individu ${membersToDisplay.length} anggota kelompok')

// ✅ GANTI DENGAN 2 KARTU INFORMATIF BERIKUT:
// Kartu 1: Skor Terbobot KKN (Nilai Resmi Akademik/DPL)
Container(
  child: Column(
    children: [
      Text('Skor Terbobot Kelompok (KKN)', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
      Text('${kelompokData.totalGroupPoints} Poin', style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold)),
      Text('Formula: 60% Proker + 40% Rata-rata Anggota', style: TextStyle(fontSize: 11, color: Colors.black45)),
    ],
  ),
),

// Kartu 2: Total Akumulasi Poin Tim (Gamifikasi Anggota)
Container(
  child: Column(
    children: [
      Text('Total Akumulasi Tim', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
      Text(
        '${kelompokData.members.fold(0, (sum, m) => sum + m.individualPoints)} PTS',
        style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.primaryGreen),
      ),
      Text('Penjumlahan riwayat poin dari ${kelompokData.members.length} anggota kelompok', style: TextStyle(fontSize: 11, color: Colors.black45)),
    ],
  ),
)
```

### 2. Pisahkan Getter di `mahasiswa_kkn_models.dart`
Hapus logika fallback `calculatedTotalPoints` yang mencampurkan `totalGroupPoints` dengan `members.fold(...)`. Berikan dua getter terpisah yang eksplisit:
```dart
/// Skor Terbobot KKN Resmi dari Backend API (60% Proker + 40% Rata-rata Anggota)
final int totalGroupPoints;

/// Total Penjumlahan Poin Individu Seluruh Anggota
int get cumulativeMemberPoints => members.fold(0, (sum, m) => sum + m.individualPoints);
```

---
**Lead Fullstack & Backend Architect**  
*Berseka Development Team*
