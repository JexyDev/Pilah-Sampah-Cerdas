# 📱 LAPORAN & PANDUAN IMPLEMENTASI STANDARISASI POIN PETUGAS PEMILAH
## Sistem Gamifikasi & Tata Kelola Operasional — BERSEKA
**Target Audiens:** Mobile Application Developer (Habil / Flutter Team)  
**Dokumen:** Handover Spesifikasi Poin Petugas Pemilahan  
**Tanggal Rilis:** 15 September 2026  
**Status Backend:** ✅ Selesai Diimplementasikan & Lulus Uji Vitest  

---

## 1. Ringkasan Kebijakan Poin Petugas Pemilah

Sesuai arahan dan standarisasi sistem terbaru:
1. **Poin Petugas Pemilah diseragamkan menjadi FLAT 5 POIN** untuk setiap aktivitas operasional.
2. **Ditiadakan seluruh perkalian/konversi bobot** (tidak ada lagi $1\text{ Kg} = 2\text{ Poin}$ atau $1\text{ Kg} = 5\text{ Poin}$).
3. **Ditiadakan bonus foto bukti terpisah** ($+10$ poin foto dihilangkan).
4. Setiap kali petugas melakukan **Input Timbangan Pemilahan** $\rightarrow$ **Flat 5 Poin**.
5. Setiap kali petugas melakukan **Validasi / Reset Pengosongan Tempat Sampah** $\rightarrow$ **Flat 5 Poin**.

---

## 2. Status & Spesifikasi Endpoint Backend API

Seluruh endpoint di sisi Backend (`main/apps/api/src`) telah selesai disesuaikan dan siap dikonsumsi:

| Aktivitas | Endpoint HTTP | Response Poin | Kategori Ledger | Status Backend |
| :--- | :--- | :---: | :--- | :---: |
| **Input Timbangan Pemilahan** | `POST /api/v1/petugas-residu/submit-log` | `pointsEarned: 5`<br>`points: 5` | `SUBMIT_RESIDU` | ✅ **Flat 5 Poin** |
| **Validasi Pengosongan Tempat Sampah** | `POST /api/v1/petugas-residu/requests/:id/accept` | `points: 5` | `VALIDASI_PENGOSONGAN` | ✅ **Flat 5 Poin** |
| **Persetujuan Pengosongan (Fallback)** | `PATCH /api/v1/bins/reset-requests/:id` | `points: 5` | `VALIDASI_PENGOSONGAN` | ✅ **Flat 5 Poin** |
| **Ringkasan Poin Petugas** | `GET /api/v1/petugas-residu/points` | Agregasi resmi tabel `pointHistory` | Seluruh kategori | ✅ **Sinkron Otomatis** |
| **Riwayat Aktivitas Petugas** | `GET /api/v1/petugas-residu/riwayat` | Item timbangan: `5 pts`<br>Item validasi: `5 pts` | Log aktivitas | ✅ **Sinkron Otomatis** |

### Contoh Payload Response `POST /api/v1/petugas-residu/submit-log`:
```json
{
  "success": true,
  "data": {
    "id": "cm1abcdef...",
    "logId": "cm1abcdef...",
    "berat": 14.5,
    "weightKg": 14.5,
    "classification": "Organik",
    "pointsEarned": 5,
    "points": 5,
    "imagePhotoUrl": "/uploads/residu-xxx.jpg",
    "status": "TERKIRIM",
    "timestamp": "2026-09-15T09:30:00.000Z"
  }
}
```

> 📌 **Catatan:** Controller mobile (`petugas_pemilahan_controller.dart:251-255`) membaca `pointsEarned` langsung dari return backend, sehingga ketika disubmit, poin aktual yang bertambah di database dan state lokal sudah pasti **5 Poin**.

---

## 3. Panduan Rekomendasi Perubahan di Sisi Mobile Flutter

Untuk menjaga tampilan UI dan estimasi lokal di aplikasi mobile 100% konsisten dengan backend, berikut berkas dan baris kode yang perlu disesuaikan oleh Tim Mobile:

---

### A. Berkas: `lib/app/modules/petugas_pemilahan/views/timbangan_pemilahan_view.dart`

#### 1. Estimasi Poin Lokal (Fungsi `_calculatePoints`)
* **Lokasi**: Sekitar baris 115–130.
* **Perubahan**: Ganti rumus perkalian kg dan bonus foto menjadi flat 5 poin saat berat timbangan terisi ($>0$).

```dart
// ❌ SEBELUM:
void _calculatePoints() {
  final weightStr = _weightController.text.trim().replaceAll(',', '.');
  final weight = double.tryParse(weightStr) ?? 0.0;

  // Skala KPI Petugas: 2 Poin per 1 Kg (Dibulatkan)
  int points = weight.round() * 2;

  // Bonus kehadiran & foto bukti di titik kumpul (+10)
  if (weight > 0 && _photoPath != null) {
    points += 10;
  }

  if (points != _estimatedPoints) {
    setState(() {
      _estimatedPoints = points;
    });
  }
  _saveDraft();
}

// ✅ SESUDAH (REKOMENDASI):
void _calculatePoints() {
  final weightStr = _weightController.text.trim().replaceAll(',', '.');
  final weight = double.tryParse(weightStr) ?? 0.0;

  // Poin Petugas Pemilahan: Flat 5 Poin per input timbangan (tanpa konversi/perkalian kg)
  final int points = weight > 0 ? 5 : 0;

  if (points != _estimatedPoints) {
    setState(() {
      _estimatedPoints = points;
    });
  }
  _saveDraft();
}
```

#### 2. Badge Foto Bukti pada Bar Bawah Estimasi Poin
* **Lokasi**: Sekitar baris 940–965.
* **Masalah**: Label badge lama menampilkan `+10` (atau `+5`). Jika estimasi poin menampilkan `5 Pts` dan di sebelahnya ada badge `+5`, pengguna akan bingung mengira total poin adalah $5 + 5 = 10\text{ Pts}$.
* **Solusi**: Ubah badge tersebut menjadi indikator status verifikasi foto (misal: `Foto OK` atau `Bukti Terlampir`) berwarna hijau tanpa angka tambahan.

```dart
// ❌ SEBELUM:
if (_photoPath != null)
  Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
    decoration: BoxDecoration(
      color: AppColors.warningYellow.withValues(alpha: 0.2),
      borderRadius: BorderRadius.circular(20),
    ),
    child: const Row(
      children: [
        Icon(Icons.camera_alt_rounded, size: 12, color: AppColors.warningOrange),
        SizedBox(width: 4),
        Text(
          '+10',
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: AppColors.warningOrange,
          ),
        ),
      ],
    ),
  ),

// ✅ SESUDAH (REKOMENDASI):
if (_photoPath != null)
  Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
    decoration: BoxDecoration(
      color: AppColors.primaryGreen.withValues(alpha: 0.15),
      borderRadius: BorderRadius.circular(20),
    ),
    child: const Row(
      children: [
        Icon(Icons.check_circle_rounded, size: 12, color: AppColors.primaryGreen),
        SizedBox(width: 4),
        Text(
          'Foto OK',
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.bold,
            color: AppColors.primaryGreen,
          ),
        ),
      ],
    ),
  ),
```

---

### B. Berkas: `lib/app/modules/petugas_pemilahan/views/petugas_pemilahan_poin_view.dart`

#### Banner "Skema Insentif Poin"
* **Lokasi**: Sekitar baris 140–152.
* **Perubahan**: Hapus baris yang menyebut konversi $1\text{ Kg} = 2\text{ Poin}$ dan baris bonus foto $+10\text{ Poin}$. Gantikan dengan aturan flat 5 poin per input timbangan dan 5 poin per validasi pengosongan.

```dart
// ❌ SEBELUM:
_buildPoinRuleRow(Icons.scale_rounded, 'Timbangan Sampah', '1 Kg = 2 Poin'),
_buildPoinRuleRow(Icons.camera_alt_rounded, 'Bonus Foto Bukti Valid', '+10 Poin / Input'),
_buildPoinRuleRow(Icons.check_circle_outline_rounded, 'Validasi Pengosongan RW', '+15 Poin / Pengajuan Warga'),
_buildPoinRuleRow(Icons.event_available_rounded, 'Penyelesaian Jadwal RW', 'Bonus Insentif Harian'),

// ✅ SESUDAH (REKOMENDASI):
_buildPoinRuleRow(Icons.scale_rounded, 'Input Timbangan Pemilahan', '+5 Poin / Input'),
_buildPoinRuleRow(Icons.check_circle_outline_rounded, 'Reset Pengosongan Tempat Sampah', '+5 Poin / Pengajuan'),
_buildPoinRuleRow(Icons.event_available_rounded, 'Penyelesaian Jadwal RW', 'Bonus Insentif Harian'),
```

---

### C. Berkas: `lib/app/modules/petugas_pemilahan/views/verifikasi_pengosongan_view.dart`

#### Modal Konfirmasi Sukses Pengosongan
* **Lokasi**: Sekitar baris 270–280.
* **Perubahan**: Ubah teks badge perolehan poin dari `+15 Poin` menjadi `+5 Poin`.

```dart
// ❌ SEBELUM:
Text(
  '+15 Poin Validasi Diperoleh',
  style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primaryGreen, fontSize: 12),
),

// ✅ SESUDAH (REKOMENDASI):
Text(
  '+5 Poin Validasi Diperoleh',
  style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primaryGreen, fontSize: 12),
),
```

---

## 4. Kesimpulan & Status Repositori Mobile

1. **Kode di repositori `mobile` TIDAK DIUBAH / TETAP UTUH** sesuai instruksi, sehingga Tim Mobile memiliki kendali penuh atas commit dan alur kerjanya.
2. Tim Mobile (Habil) dapat langsung mengacu pada berkas ini untuk menyelaraskan UI & kalkulator estimasi lokal.
3. Seluruh kalkulasi poin di database server telah tervalidasi dan siap digunakan.
