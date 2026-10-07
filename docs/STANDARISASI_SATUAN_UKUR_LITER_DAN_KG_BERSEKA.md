# 📜 DOKUMEN RESMI KETETAPAN ARSITEKTUR & INTEGRASI SISTEM BERSEKA
## STANDARISASI SATUAN UKUR: WARGA/KKN (LITER) VS PETUGAS RESIDU (KILOGRAM)

---

### 1. RINGKASAN EKSEKUTIF & GROUND TRUTH
Dokumen ini disusun sebagai panduan paten bagi tim Backend, Web Frontend, dan Mobile Developer untuk mengakhiri kerancuan satuan ukur (*Unit of Measurement*) pada ekosistem BERSEKA.

Satuan **Liter** bukanlah asumsi yang dibuat-buat, melainkan **fondasi bawaan arsitektur sistem BERSEKA** sejak pertama kali dirancang, terbukti pada skema database, model visi komputer AI, dan perhitungan reward.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             ROLE WARGA & AI SETOR                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ • Sensor / Input    : Kamera HP (Bounding Box 3D: P × L × T cm)            │
│ • Unit Kalkulasi AI : cm³ / 1000 ➔ LITER (Volume Geometris)                 │
│ • Wadah Fisik       : Tempat Sampah Rumah Tangga (15L, 25L, 50L)            │
│ • Kolom Database    : Bin.maks_kapasitas_liter, Bin.volume_sekarang_liter   │
│ • Formula Poin      : estimatedVolume (Liter) × multiplier × conf           │
│ • Kondisi Lapangan  : Warga TIDAK memiliki timbangan massa di rumah tangga. │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ▲
                                 BERBEDA DENGAN
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ROLE PETUGAS RESIDU / TPS                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ • Sensor / Input    : Foto Display Timbangan Fisik Digital/Jarum (OCR)      │
│ • Unit Pengukuran   : KILOGRAM (Kg / Massa Riil)                            │
│ • Kapasitas Angkut  : Timbangan Posko/TPS (Maks 500 Kg)                     │
│ • Kondisi Lapangan  : TPS membawa timbangan riil dan pelaporan dinas DLH    │
│                       memerlukan metrik tonase/berat riil.                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 2. BUKTI OTENTIK SUMBER KODE & DATABASE

#### A. Skema Database Prisma (`prisma/schema.prisma`)
Kolom fisik tempat sampah pada PostgreSQL tidak pernah menggunakan satuan Kg:
```prisma
model Bin {
  ...
  maxCapacityLiter    Decimal  @default(25.0) @map("maks_kapasitas_liter")   // Satuan asli DB
  currentVolumeLiter  Decimal  @default(0.0)  @map("volume_sekarang_liter") // Satuan asli DB
}
```

#### B. Pipeline Computer Vision AI (`apps/api/src/services/aiService.ts`)
Model AI mendeteksi estimasi dimensi bounding box $(P \times L \times T\text{ cm})$, kemudian dikonversi ke Liter ($cm^3 / 1000$):
```typescript
const volumeLiters = parseFloat(((lengthCm * widthCm * heightCm) / 1000).toFixed(2));
volumeEstimate: aiResult.estimatedVolumeLiter || 2.5,
```
Kamera smartphone mendeteksi geometri optik, bukan timbangan massa. Oleh sebab itu output murni AI adalah **Volume Liter**.

#### C. Kalkulasi Reward Poin Warga (`apps/api/src/services/binService.ts`)
Perhitungan poin setor sampah warga berbasis variabel volume Liter:
```typescript
const rate = 100 * multiplier;
let calculatedPoints = Math.max(1, Math.round(estimatedVolume * rate * confScale));
```

#### D. Pengukuran Kapasitas di Mobile (`ukur_kapasitas_view.dart`)
Formulir ukur kapasitas tempat sampah mandiri menghitung volume silinder ke Liter:
```dart
return (math.pi * r * r * t) / 1000.0; // cm3 to liter
```
Preset tempat sampah standar warga adalah **15 Liter, 25 Liter, dan 50 Liter**.

---

### 3. MENGAPA SEBELUMNYA MUNCUL SATUAN "KG" PADA WARGA?

1. **Faktor Densitas Semu**:
   Pengembang sebelumnya sempat menambahkan konversi asumsi perkalian berat jenis (Organik $\times 0.4$, Anorganik $\times 0.2$).
2. **Kekeliruan di Lapangan**:
   Saat warga membuang sampah 2.5 Liter ke tempat sampah berkapasitas 25 Liter, UI menampilkan *"1.0 kg"*. Hal ini membuat warga bingung karena tempat sampah mereka bertuliskan 25 Liter dan mereka tidak pernah menimbangnya.
3. **Keputusan Arsitektur**:
   Menghapus pengaburan konversi semu pada antarmuka Warga dan mengembalikan satuan murni **Liter** menjaga *Single Source of Truth* yang selaras antara AI, Database, dan Logika Reward.

---

### 4. ATURAN INTEGRASI MULTI-PLATFORM (WEB & MOBILE)

1. **Warga & Mahasiswa KKN**:
   - Seluruh label input kapasitas, riwayat setor, logbook volume, dan visualisasi bar tempat sampah **WAJIB MENGGUNAKAN SATUAN LITER (L)**.
   - Dilarang menampilkan label satuan "kg" untuk setoran sampah rumah tangga/warga mandiri.
2. **Petugas Residu / Pengangkutan Posko**:
   - Tetap menggunakan satuan **KILOGRAM (Kg)** dengan bukti foto timbangan OCR.
3. **Dampak Agregasi Wilayah (Dashboard DLH / Eksekutif)**:
   - Jika dashboard membutuhkan total tonase lingkungan (Kg/Ton), agregasi dilakukan di tingkat analitik/layanan pelaporan menggunakan faktor konversi terstandarisasi, tanpa merusak data mentah transaksi warga yang berdasar pada Liter.

---
*Ditetapkan dan disahkan untuk kepatuhan seluruh tim pengembang BERSEKA.*
