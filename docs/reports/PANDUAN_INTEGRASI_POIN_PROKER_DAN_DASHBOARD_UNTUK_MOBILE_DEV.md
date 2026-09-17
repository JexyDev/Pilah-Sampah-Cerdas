# Panduan Integrasi & Laporan Perubahan: Kalkulasi Bertahap Poin Proker & Dashboard KKN

**Ditujukan kepada**: Mobile Developer (Flutter)  
**Dari**: Backend Developer  
**Tanggal**: 17 September 2026  
**Status Backend**: Selesai & Terverifikasi (Branch: `development`)  
**Status Repository Mobile**: Tidak ada perubahan yang disentuh/di-commit di repo mobile (clean).

---

## 1. Ringkasan Eksekutif & Perubahan Logika Backend

Sebelumnya, pencairan poin Program Kerja (Proker) kelompok tertahan oleh *gate blocker* (`poinProker = prokerSelesaiCount * 6`), sehingga proker yang masih berstatus **Diajukan** atau **Sedang Berjalan** belum menyumbang poin apa pun ke `totalGroupPoints` sampai statusnya 100% Selesai.

Sesuai kebutuhan sistem dan panduan UI terbaru pada halaman Poin KKN di aplikasi mobile, backend telah memperbarui logika kalkulasi:
1. **Pencairan Bertahap & Akumulatif Proker**:
   - **Diajukan / Disetujui DPL**: +2 poin
   - **Sedang Berjalan**: +4 poin
   - **Selesai**: +6 poin
   - **Ditolak**: 0 poin
2. **Formula Terbobot KKN (60% : 40%) Real-time**:
   $$\text{totalGroupPoints} = \text{round}\Big((\text{poinProker} \times 0.6) + (\text{rataRataPoinAnggota} \times 0.4),\; 1\Big)$$
   - Poin proker yang sedang berjalan langsung cair dan diakumulasikan secara real-time dengan 40% nilai rata-rata kumulatif anggota kelompok.
   - Setiap kali ada transisi status proker (Diajukan -> Berjalan -> Selesai), backend otomatis menghitung ulang `totalGroupPoints`.
3. **Pemisahan Field Metrik**:
   - Response `GET /api/v1/kkn/dashboard` kini memisahkan poin individu mahasiswa dari total poin kelompok, poin proker, dan rerata anggota secara eksplisit.

---

## 2. Spesifikasi Kontrak API Terkini

### A. Endpoint `GET /api/v1/kkn/dashboard`
Pada payload response `data`, backend kini menyertakan field-field baru berikut:

| Nama Field | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `personalPoints` | `number` | **Poin personal** milik mahasiswa yang sedang login. |
| `contributionPoints` | `number` | Tetap disediakan (nilai sama dengan `personalPoints`) demi *backward compatibility*. |
| `totalGroupPoints` | `number` | **Skor akhir kelompok terbobot** ($(poinProker \times 0.6) + (rataRata \times 0.4)$). |
| `poinKelompok` | `number` | Alias dari `totalGroupPoints`. |
| `poinProker` | `number` | Total akumulasi poin proker (Diajukan: +2, Berjalan: +4, Selesai: +6). |
| `rataRataPoinAnggota` | `number` (float) | Nilai rata-rata poin personal anggota kelompok. |
| `totalCumulativeMemberPoints` | `number` | Total penjumlahan poin personal seluruh anggota tim. |
| `groupScoreBreakdown` | `object` | Informasi transparan mengenai bobot formula. |

#### Contoh Payload JSON Response `GET /api/v1/kkn/dashboard`:
```json
{
  "success": true,
  "message": "Statistik dashboard berhasil diambil",
  "data": {
    "studentKkn": {
      "id": "std_123",
      "nim": "210001",
      "name": "Budi Santoso",
      "status": "APPROVED",
      "kelompokId": "kel_abc",
      "kelompok": {
        "id": "kel_abc",
        "name": "Kelompok KKN Cimenyan 01",
        "totalGroupPoints": 14.8
      }
    },
    "totalRegisteredBins": 12,
    "remainingQuota": 8,
    "progressPercentage": 60.0,
    "personalPoints": 18,
    "contributionPoints": 18,
    "totalGroupPoints": 14.8,
    "poinKelompok": 14.8,
    "poinProker": 12,
    "rataRataPoinAnggota": 19.0,
    "totalCumulativeMemberPoints": 190,
    "groupScoreBreakdown": {
      "poinProker": 12,
      "rataRataPoinAnggota": 19.0,
      "prokerWeight": 0.6,
      "memberWeight": 0.4,
      "formula": "(poinProker * 0.6) + (rataRataPoinAnggota * 0.4)"
    }
  }
}
```

---

### B. Endpoint `GET /api/v1/kkn/groups/my-group`
Pada payload response kelompok:
```json
{
  "success": true,
  "data": {
    "id": "kel_abc",
    "name": "Kelompok KKN Cimenyan 01",
    "totalGroupPoints": 14.8,
    "poinProker": 12,
    "rataRataPoinAnggota": 19.0,
    "totalCumulativeMemberPoints": 190,
    "members": [ ... ]
  }
}
```

---

## 3. Panduan Implementasi untuk Mobile Developer

Untuk menyelaraskan aplikasi Flutter dengan kontrak data backend di atas, tim Mobile disarankan memperbarui model data dan tampilan UI sebagai berikut:

### 1. Update Model Data (`lib/app/data/models/mahasiswa_kkn_models.dart`)

Tambahkan atribut baru pada class `KknDashboardData`:

```dart
class KknDashboardData extends Equatable {
  const KknDashboardData({
    required this.nim,
    required this.totalRegisteredBins,
    required this.remainingQuota,
    required this.progressPercentage,
    required this.contributionPoints,
    this.totalGroupPoints = 0,
    this.poinKelompok = 0,
    this.poinProker = 0,
    this.rataRataPoinAnggota = 0.0,
    this.totalCumulativeMemberPoints = 0,
  });

  final String nim;
  final int totalRegisteredBins;
  final int remainingQuota;
  final double progressPercentage;
  final int contributionPoints; // Poin personal mahasiswa
  final int totalGroupPoints;    // Poin kelompok terbobot (dari backend)
  final int poinKelompok;
  final int poinProker;          // Akumulasi poin proker bertahap
  final double rataRataPoinAnggota;
  final int totalCumulativeMemberPoints;

  factory KknDashboardData.fromJson(Map<String, dynamic> json) {
    final stats = json['stats'] as Map<String, dynamic>? ?? {};

    // Poin personal mahasiswa
    final pointVal = (json['personalPoints'] ??
            json['contributionPoints'] ??
            stats['personalPoints'] ??
            stats['contributionPoints'] ??
            json['points'] ??
            0) as num?;

    // Poin kelompok terbobot (60% proker + 40% rerata anggota)
    final groupPointVal = (json['totalGroupPoints'] ??
            json['poinKelompok'] ??
            stats['totalGroupPoints'] ??
            stats['poinKelompok'] ??
            0) as num?;

    // Akumulasi proker
    final prokerPointVal = (json['poinProker'] ??
            stats['poinProker'] ??
            0) as num?;

    // Rata-rata anggota
    final avgMemberVal = (json['rataRataPoinAnggota'] ??
            stats['rataRataPoinAnggota'] ??
            0.0) as num?;

    final cumulativeVal = (json['totalCumulativeMemberPoints'] ??
            stats['totalCumulativeMemberPoints'] ??
            0) as num?;

    return KknDashboardData(
      nim: json['nim']?.toString() ?? '',
      totalRegisteredBins: (json['totalRegisteredBins'] as num?)?.toInt() ?? 0,
      remainingQuota: (json['remainingQuota'] as num?)?.toInt() ?? 0,
      progressPercentage: (json['progressPercentage'] as num?)?.toDouble() ?? 0.0,
      contributionPoints: pointVal?.toInt() ?? 0,
      totalGroupPoints: groupPointVal?.toInt() ?? 0,
      poinKelompok: groupPointVal?.toInt() ?? 0,
      poinProker: prokerPointVal?.toInt() ?? 0,
      rataRataPoinAnggota: avgMemberVal?.toDouble() ?? 0.0,
      totalCumulativeMemberPoints: cumulativeVal?.toInt() ?? 0,
    );
  }

  @override
  List<Object?> get props => [
    nim,
    totalRegisteredBins,
    contributionPoints,
    totalGroupPoints,
    poinProker,
  ];
}
```

Pada `KelompokKknData`:
```dart
// Di dalam class KelompokKknData:
final int totalGroupPoints;
final int poinProker;
final double rataRataPoinAnggota;

// Fallback jika backend mengirim 0 atau null:
int get calculatedTotalPoints {
  if (totalGroupPoints > 0) return totalGroupPoints;
  return members.fold(0, (sum, m) => sum + m.individualPoints);
}
```

---

### 2. Penyesuaian Komponen UI di Mobile

1. **Card "Poin Saya" (Personal)**:
   - Gunakan `dashboardData.contributionPoints` atau `dashboardData.personalPoints`.
2. **Card / Banner "Poin Kelompok"**:
   - Gunakan `dashboardData.totalGroupPoints` (atau `kelompokData.totalGroupPoints`).
   - **PENTING**: Jangan lagi menghitung penjumlahan manual `individualPoints` anggota di client karena formula resmi KKN menggunakan pembobotan 60% : 40%.
3. **Card / Progress "Poin Proker"**:
   - Gunakan `dashboardData.poinProker` untuk menampilkan berapa poin proker yang telah terkumpul secara bertahap saat ini.

---

## 4. Status Pengujian Backend

Perubahan ini telah diuji dengan pengujian otomatis:
- **Unit & Logic Test**: `src/services/kknGamificationLogic.test.ts` -> **16/16 Passed** (termasuk verifikasi simulasi transisi proker Diajukan -> Berjalan -> Selesai).
- **Type Check**: `npx tsc --noEmit` -> **0 Errors**.
- Logika seeder dilindungi `vpsSafetyGuard` dan tidak ada modifikasi/eksekusi mutasi ke database VPS.

Jika tim Mobile Developer memerlukan mock JSON tambahan atau penyesuaian penamaan field, silakan hubungi tim Backend.
