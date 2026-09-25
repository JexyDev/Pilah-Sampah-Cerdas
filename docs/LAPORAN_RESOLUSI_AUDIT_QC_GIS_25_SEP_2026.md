# 📑 Laporan Resolusi Audit & Tindak Lanjut Tim Developer
**Kepada**: Fajar & Tim Quality Control (QC)  
**Dari**: Tim Fullstack Developer BERSEKA  
**Tanggal**: 25 September 2026  
**Perihal**: Laporan Penutupan Temuan Audit Dasbor GIS (`/dasbor?tab=gis`) & Status Rilis Produksi VPS  
**Status Akhir**: 🟢 **RESOLVED & DEPLOYED TO PRODUCTION**

---

## 1. Ringkasan Eksekutif

Menindaklanjuti dokumen audit internal sistem mengenai Dasbor Tata Kelola Sampah (GIS) terkait **Kalkulasi Komposisi Volume & Grafik Akumulasi**, tim Developer telah menyelesaikan verifikasi komprehensif, perbaikan kode (*patching*), penambahan unit test terotomatisasi, serta merilis pembaruan ke lingkungan produksi (*VPS Production*).

Kedua temuan audit telah ditutup dengan rincian status sebagai berikut:

| No | Temuan Audit | Prioritas | Status Sebelum | Status Sesudah | Lokasi Komponen |
|:--:|---|:---:|:---:|:---:|---|
| **1** | **Kebocoran Kategori "Anorganik" Menjadi "Organik"** | 🔴 CRITICAL | Terbuka (Bug Aktif) | 🟢 **RESOLVED** | `apps/api/src/services/gisEksekutifService.ts` |
| **2** | **Bias Proyeksi Flatline Grafik Akumulasi** | 🟡 MEDIUM | Telah Diatasi (Commit `51dd6832a`) | 🟢 **RESOLVED** | `apps/web/src/pages/GisEksekutif/charts.tsx` |

---

## 2. Rincian Resolusi Teknis

### 🔴 Temuan 1: Kebocoran Kategori "Anorganik" Menjadi "Organik" (Setoran Manual)

#### A. Akar Masalah (Root Cause)
Pada fungsi agregasi setoran manual bulanan (`setoranManualBulanan.forEach`) di `gisEksekutifService.ts`, terdapat kelemahan logika *short-circuit* pada pengecekan substring:
```typescript
// ❌ IMPLEMENTASI LAMA (SEBELUM PATCH)
const kat = (sm.kategori || "").toLowerCase();
if (kat.includes("organik")) {  // "anorganik" mengandung kata "organik" -> TRUE!
  m.organikKg += kg;
} else if (kat.includes("anorganik")) { // DEAD CODE
  m.anorganikKg += kg;
} else if (kat.includes("residu")) {
  m.residuKg += kg;
} else {
  m.organikKg += kg;
}
```
Akibatnya, seluruh setoran manual petugas yang berkategori `"Anorganik"` (misal: sampah plastik, kardus, logam, botol) secara otomatis terhitung ke dalam metrik `organikKg`.

#### B. Resolusi & Kode Perbaikan (Patch)
Logika evaluasi diubah untuk **memprioritaskan kategori kata turunan/spesifik terlebih dahulu** (`anorganik`, `non-organik`, `residu`) sebelum kata dasar (`organik`), serta penambahan normalisasi `.trim()`:

```typescript
// ✅ IMPLEMENTASI BARU (SESUDAH PATCH - COMMIT c365b02fb)
const kg = Number(sm.berat || 0);
const kat = (sm.kategori || "").toLowerCase().trim();
// urutan penting: "anorganik" mengandung substring "organik"
if (kat.includes("anorganik") || kat.includes("non-organik") || kat.includes("non organik")) {
  m.anorganikKg += kg;
} else if (kat.includes("residu") || kat.includes("residual")) {
  m.residuKg += kg;
} else if (kat.includes("organik")) {
  m.organikKg += kg;
} else {
  m.organikKg += kg;
}
```

#### C. Pengujian Terotomatisasi (Unit Test)
Ditambahkan skenario pengujian baru pada `apps/api/src/services/gisEksekutifService.test.ts`:
- **Nama Skenario**: `should accurately classify manual deposits into anorganik, residu, and organik without lexical substring collision`.
- **Hasil Test**: **11/11 tests passed (100% lulus)**.
- **Hasil Verifikasi**: Sampel setoran manual 100 kg Anorganik + 50 kg Non-Organik + 30 kg Residu + 70 kg Organik terklasifikasi secara presisi:
  - Anorganik: 150 kg (60%)
  - Residu: 30 kg (12%)
  - Organik: 70 kg (28%)
  - Tidak ada lagi kebocoran klasifikasi leksikal.

---

### 🟡 Temuan 2: Bias Proyeksi Bulan Masa Depan (Grafik Akumulasi)

#### A. Akar Masalah
Grafik akumulasi sebelumnya mengalokasikan nilai 0 kg untuk bulan-bulan mendatang (Oktober – Desember 2026), sehingga fungsi akumulatif (`runningSum += v`) membawa angka bulan September secara konstan (*carry-forward flatline*), yang memberikan impresi keliru bahwa terjadi stagnasi volume sampah.

#### B. Status & Solusi yang Telah Diterapkan
Pembaruan telah diterapkan pada `apps/web/src/pages/GisEksekutif/charts.tsx` (Commit `51dd6832a`):
1. **Truncation Array**: Indeks bulan kalender setelah bulan aktif (`idx > defaultIdx`) secara eksplisit diisi nilai `null`, bukan `0` atau carry-forward.
2. **Dynamic SVG Rendering**: Jalur kurva SVG area dan garis (`line` & `area`) otomatis memutus penggambaran hanya sampai bulan berjalan yang memiliki data transaksi riil.
3. **Ghost Point Visual**: Titik bulan mendatang dirender sebagai lingkaran putus-putus abu-abu (*placeholder*), tooltip membaca `"Belum berjalan"`, dan tabel metrik menampilkan tanda strip (`—`).

---

## 3. Tata Kelola Rilis & Pipeline Git-Flow

Sesuai dengan **Aturan Git-Flow 3-Tier** dan **Kebijakan Perlindungan Data VPS** pada `AGENTS.md`:

```
[fix/gis-anorganik-category-leak] (Commit c365b02fb)
           │
           ▼ (Merged & Pushed)
     [development]
           │
           ▼ (Merged & Pushed)
       [staging]
           │
           ▼ (Merged & Pushed)
        [main] (Production VPS Live)
```

1. **Commit Hash**: `c365b02fb`
2. **Pesan Commit**: `fix(gis): perbaiki urutan evaluasi kategori setoran manual agar anorganik tidak terserap ke organik`
3. **Validasi Build Lokal**:
   - `tsc` (API TypeScript Compile): **LULUS (Tanpa Error)**
   - `vite build` (Web Frontend): **LULUS (Built in 4.26s)**
   - Vitest (`gisEksekutifService.test.ts`): **11/11 Lulus**
4. **CI/CD Auto-Deploy**:
   - Push ke branch `main` secara otomatis memicu GitHub Actions (`.github/workflows/deploy.yml`) untuk proses pembaruan layanan API & Nginx di server VPS produksi (`157.10.252.252`).
   - Tidak ada modifikasi atau intervensi berbahaya terhadap data riil database (Zero-Risk DB Mutation).

---

## 4. Panduan Verifikasi UAT untuk Tim QC (Fajar)

Tim QC dapat melakukan verifikasi langsung pada lingkungan aplikasi Dasbor GIS:

1. **URL Pengujian**: Buka `/dasbor?tab=gis` (atau login sebagai Eksekutif / Super User).
2. **Pengujian Komposisi Sampah**:
   - Periksa widget **Komposisi Volume** (Donut Chart & breakdown kg/hari).
   - Pastikan persentase Anorganik kini mencerminkan volume setoran manual anorganik aktual dan tidak lagi terserap ke dalam kategori Organik.
3. **Pengujian Grafik Tren & Akumulasi**:
   - Klik toggle **Akumulasi** pada grafik "Tren volume bulanan".
   - Pastikan grafik tidak lagi menarik garis datar (*flatline*) dari September hingga Desember.
   - Arahkan kursor (*hover*) pada bulan Oktober, November, dan Desember: pastikan tooltip bertuliskan `"Belum berjalan"` dan pada tabel bernilai `"—"`.

---
*Dokumentasi ini disusun secara otomatis oleh Tim Pengembang BERSEKA untuk memastikan transparansi dan akuntabilitas siklus pengembangan perangkat lunak.*
