# 📋 Laporan Koreksi Nilai `prokerPoints` Dashboard KKN & Panduan Integrasi Mobile Developer

**Proyek:** BERSEKA (Aplikasi Pilah Sampah Cerdas - Modul Mahasiswa KKN)  
**Target Pembaca:** Mobile Developer (Flutter) & Backend Developer  
**Tanggal Rilis:** 17 September 2026  
**Status Backend:** ✅ **LIVE & TERVERIFIKASI DI VPS PRODUKSI (`157.10.252.252`) — ZERO DOWNTIME**

---

## 📌 1. Ringkasan Eksekutif

Menindaklanjuti temuan bug pada endpoint `GET /api/kkn/dashboard` (dan alias `/api/v1/kkn/dashboard`), Tim Backend telah berhasil melakukan investigasi, penyesuaian logika gamifikasi, dan **mendeploy pembaruan langsung ke server produksi VPS**.

### Inti Masalah yang Diperbaiki:
* **Kondisi Sebelumnya (Bug):** Nilai `prokerPoints` pada payload dashboard ditarik dari fungsi `calculatePersonalPoints(userId)` yang membaca tabel `PointHistory` milik individu. Akibatnya, jika satu kelompok menyelesaikan beberapa program kerja (misal 3 proker bernilai 18 PTS), mahasiswa hanya melihat **"6 PTS"** karena angka tersebut adalah batas riwayat yang sempat tercatat di akun pribadinya saja selaku submitter proker pertama. Selain itu, terjadi inkonsistensi di mana `stats.prokerPoints` bernilai 6 PTS sedangkan `stats.poinProker` bernilai 18 PTS.
* **Kondisi Baru (Fix):** Poin proker kini resmi diperlakukan sebagai **Milik Kelompok (Shared)**. Nilai `prokerPoints` ditarik langsung dari kalkulasi kolektif kelompok on-the-fly (`groupPointsData.poinProker`) yang menjadi *Single Source of Truth* dari tabel `ProgramKerjaKkn`.
* **Hasil Verifikasi Live di VPS:** Mahasiswa di kelompok KKN kini secara otomatis menerima total akumulasi seluruh proker kelompok yang valid (contoh sampel kelompok live di VPS langsung terverifikasi mengembalikan `prokerPoints: 12` secara seragam dan konsisten).

---

## 🔄 2. Komparasi Logika Backend

| Aspek | Sebelum Perbaikan (Buggy) | Setelah Perbaikan (Live VPS) |
| :--- | :--- | :--- |
| **Sumber Nilai `prokerPoints`** | `personalData.prokerPoints` (Tabel `PointHistory` perorangan) | `groupPointsData.poinProker` (Tabel `ProgramKerjaKkn` kelompok) |
| **Sifat Nilai** | Tergantung siapa yang submit dan apakah sync riwayat berhasil | Real-time & Otomatis berlaku ke seluruh anggota kelompok |
| **Konsistensi Payload** | Kontradiksi: `stats.prokerPoints` $\neq$ `stats.poinProker` | Konsisten: `prokerPoints` == `poinProker` |
| **Dampak di Sisi Mobile** | Angka proker mentok di 1 proker (6 PTS) | Angka proker akurat mengikuti seluruh proker aktif/selesai tim |

---

## 📡 3. Kontrak Payload API Dashboard Terbaru

### Endpoint:
* `GET /api/kkn/dashboard`
* `GET /api/v1/kkn/dashboard`
* **Header:** `Authorization: Bearer <JWT_MAHASISWA>`

### Contoh Respons JSON (Live VPS):
```json
{
  "success": true,
  "data": {
    "personalPoints": 122,
    "prokerPoints": 12,
    "contributionPoints": 122,
    "points": 122,
    "totalPoints": 122,
    "pointKkn": 122,
    "totalGroupPoints": 11.6,
    "poinKelompok": 11.6,
    "poinProker": 12,
    "rataRataPoinAnggota": 11,
    "totalRegisteredBins": 15,
    "remainingQuota": 85,
    "progressPct": 15.0,
    "assignmentLimit": 100,
    "stats": {
      "personalPoints": 122,
      "prokerPoints": 12,
      "poinProker": 12,
      "contributionPoints": 122,
      "points": 122,
      "totalPoints": 122,
      "pointKkn": 122,
      "totalGroupPoints": 11.6,
      "poinKelompok": 11.6,
      "rataRataPoinAnggota": 11,
      "totalCumulativeMemberPoints": 132,
      "maxLimit": 100
    },
    "studentKkn": {
      "nim": "52023002",
      "jurusan": "Teknik Informatika",
      "fakultas": "FTIK",
      "assignedArea": "RW 02 Lebak Siliwangi"
    }
  }
}
```

> [!NOTE]
> `prokerPoints` disediakan baik pada **tingkat root (`data.prokerPoints`)** maupun **di dalam objek stats (`data.stats.prokerPoints`)** untuk menjamin fleksibilitas pembacaan model di Flutter.

---

## 📱 4. Panduan Implementasi untuk Mobile Developer (Flutter)

Sisi Mobile **tidak mengalami breaking change**, namun disarankan untuk memastikan parsing model `KknDashboardData` mengambil field `prokerPoints` dengan aman:

### A. Model `KknDashboardData` ([`mobile/lib/app/data/models/mahasiswa_kkn_models.dart`](file:///c:/Users/USER/.gemini/antigravity-ide/scratch/berseka/mobile/lib/app/data/models/mahasiswa_kkn_models.dart))

Pastikan getter/field `prokerPoints` mengecek fallback hierarkis:

```dart
final prkPoints = (json['prokerPoints'] ??
        stats['prokerPoints'] ??
        stats['poinProker'] ??
        json['poinProker'] ??
        0) as num;

final persPoints = (json['personalPoints'] ??
        stats['personalPoints'] ??
        json['contributionPoints'] ??
        0) as num;
```

### B. Widget Tampilan Rincian Poin ([`mahasiswa_poin_view.dart`](file:///c:/Users/USER/.gemini/antigravity-ide/scratch/berseka/mobile/lib/app/modules/mahasiswa/views/mahasiswa_poin_view.dart))

Untuk menampilkan kartu ringkasan program kerja kelompok:
```dart
// Mengambil poin proker kelompok
final prokerPoints = mhsState.dashboard?.prokerPoints ?? 0;

// Render di widget UI
_buildProkerSummaryCard(
  title: 'Poin Program Kerja Kelompok',
  points: '$prokerPoints PTS',
  subtitle: 'Akumulasi progres program kerja seluruh kelompok',
);
```

---

## 🧪 5. Bukti Pengujian & Verifikasi Live VPS

Pengujian langsung dieksekusi ke server live VPS `157.10.252.252` terhadap mahasiswa nyata:

```bash
Sample student: 52023002 Kelompok: Kelompok 2 Lebak Siliwangi
Response Status: 200
Response prokerPoints (root): 12
Response prokerPoints (stats): 12
Response poinProker (stats): 12
Response personalPoints: 122
Response contributionPoints: 122
```

* **Hasil Audit:** Nilai `prokerPoints` (root), `stats.prokerPoints`, dan `stats.poinProker` telah **100% identik dan sinkron** (bernilai 12 PTS untuk 2 proker selesai/berjalan kelompok, tidak lagi terkunci di 6 PTS).
* **PM2 Status:** Cluster PM2 `psc-backend` (id 0 & 1) online dalam mode zero-downtime reload.
