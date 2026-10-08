# LAPORAN TEKNIS & PANDUAN INTEGRASI TIM: PEMISAHAN ALIRAN SAMPAH ORGANIK & ANORGANIK

**Tanggal**: 8 Oktober 2026  
**Status**: SELESAI & TERVALIDASI 100%  
**Lingkup**: Web Dashboard Berseka, Backend API, Aplikasi Mobile Mahasiswa  

---

## 1. Latar Belakang & Akar Masalah (Root Cause Analysis)

### Fenomena yang Ditemukan
Pada dashboard Web Berseka menu **Analisis Projek & Pemantauan Pemanfaatan** (`/monitoring-pemanfaatan`), saat membuka tab **Anorganik**, muncul data dengan:
- **Program / Proker**: *"Pendataan UMKM"*
- **Jenis Olahan / Metode**: *"Kompos Organik (Buruan Sae)"*
- **Kategori**: Anorganik *(kontradiksi)*

### Akar Penyebab Teknis (3 Titik Kritis)

1. **Classification Leakage di Web Frontend (`HasilPemanfaatan.tsx`)**:
   - Filter sebelumnya hanya mengandalkan pengecekan teks sederhana:
     ```typescript
     const itemIsAnorg = kategoriBahan.toUpperCase().includes("ANORGANIK") || ...
     ```
   - Akibatnya, jika field `kategoriBahan` bernilai `"ANORGANIK"` (meskipun olahan nyatanya adalah Kompos), data tersebut dipaksa masuk ke tab Anorganik.
   - Pilihan dropdown olahan juga tidak responsif terhadap tab yang sedang dibuka (pilihan Organik dan Anorganik tercampur baur).

2. **Heuristik Rapuh di Backend API (`pemanfaatanService.ts`)**:
   - Backend memetakan kategori bahan semata-mata dari string matching pada field `bahanBaku`:
     ```typescript
     let kategoriBahan = "ORGANIK";
     if (normBahan.includes("ANORGANIK")) kategoriBahan = "ANORGANIK";
     ```
   - Jika mahasiswa memasukkan catatan bebas pada bahan baku yang mengandung kata "anorganik", atau payload tidak konsisten, backend mengeset label bahan menjadi `ANORGANIK` tanpa memverifikasi jenis produk keluarannya (`jenisOlahan`).

3. **Input Campur Aduk di Aplikasi Mobile (`logbook_pemanfaatan_view.dart` & `pemanfaatan_sampah_view.dart`)**:
   - Form input pemanfaatan sampah di aplikasi Mobile mahasiswa tidak memiliki pemilih kategori (Organik vs Anorganik).
   - Seluruh jenis olahan (Kompos, Maggot, POC, Bank Sampah, Ecobrick, dsb.) digabung dalam satu dropdown panjang tanpa filter. Mahasiswa mudah salah pilih atau kebingungan membedakan alur sampah organik dan anorganik.

---

## 2. Solusi & Perbaikan yang Telah Diimplementasikan

### A. Web Dashboard (`apps/web/src/pages/HasilPemanfaatan/HasilPemanfaatan.tsx`)
1. **Strict Category Isolation**:
   - Menetapkan aturan taksonomi olahan yang tegas:
     - **Definitif Organik**: `Kompos`, `Maggot BSF`, `Pupuk Organik Cair (POC)`, `Loseda`, `Bata Terawang`, `Takakura`.
     - **Definitif Anorganik**: `Bank Sampah`, `Daur Ulang Plastik`, `Ecobrick`, `Pemilahan Kertas/Karton`, `Pengumpulan Logam/Kaleng`.
   - Jenis olahan definitif diutamakan mutlak di atas teks bebas `bahanBaku`. Data Kompos Organik **100% diblokir** dari tab Anorganik.
2. **Dropdown Luaran Dinamis (`availableLuaranOptions`)**:
   - Dropdown filter Master Luaran kini otomatis menyesuaikan dengan tab aktif (saat di tab Organik hanya menampilkan opsi organik, saat di tab Anorganik hanya menampilkan opsi anorganik).

### B. Backend API (`apps/api/src/services/pemanfaatanService.ts` & `kknService.ts`)
1. **Fungsi Determinasi Kategori (`resolveKategoriBahan`)**:
   - Menganalisis jenis olahan (`jenisOlahan`) terlebih dahulu. Jika olahan termasuk kategori kompos/maggot/poc/loseda, kategori dikunci sebagai `ORGANIK`.
   - Jika jenis olahan termasuk bank sampah/plastik/ecobrick, kategori dikunci sebagai `ANORGANIK`.
2. **Penanganan Default Bahan Baku di KKN Service**:
   - Method `createLogbookPemanfaatan` menerima field opsional `kategori`.
   - Jika bahan baku kosong, sistem memberikan fallback otomatis:
     - Olahan Anorganik $\rightarrow$ `"Sampah Anorganik"`
     - Olahan Organik $\rightarrow$ `"Sampah Organik"`

### C. Aplikasi Mobile Mahasiswa (`mobile/lib/app/modules/mahasiswa/views/`)
1. **Visual Segmented Selector (Organik vs Anorganik)**:
   - Mahasiswa kini disuguhkan dua tombol kategori yang jelas:
     - 🌿 **Organik** (Green accent)
     - ♻️ **Anorganik** (Blue accent)
2. **Pemisahan Daftar Metode/Olahan**:
   - **Organik**:
     - `Kompos Organik (Buruan Sae)`
     - `Budidaya Maggot BSF`
     - `Pupuk Organik Cair (POC)`
     - `Loseda (Lodong Sesa Dapur)`
     - `Bata Terawang`
     - `Metode Keranjang Takakura`
   - **Anorganik**:
     - `Penyetoran Bank Sampah`
     - `Pemilahan Botol & Sampah Plastik`
     - `Pemilahan Kertas & Karton`
     - `Pengumpulan Logam & Kaleng`
     - `Pembuatan Ecobrick`
     - `Kreasi Daur Ulang Anorganik`
3. **Dynamic Placeholder Bahan Baku**:
   - Form bahan baku memberikan petunjuk kontekstual sesuai kategori yang dipilih.
   - Mengirim field `'kategori'` pada payload request saat submit.

---

## 3. Spesifikasi Kontrak Payload API

### Endpoint: `POST /api/kkn/logbook/pemanfaatan`
**Headers**: `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `programKerjaId` | String | Ya | ID Program Kerja yang berelasi |
| `fasilitasId` | String | Tidak | ID Fasilitas TPST / Rumah Kompos |
| `kategori` | String | Ya | `"ORGANIK"` atau `"ANORGANIK"` |
| `teknologi` | String | Ya | Nama metode olahan (sesuai daftar kategori) |
| `bahanBaku` | String | Ya | Deskripsi bahan baku (contoh: *"Sisa Sayur Pasar"*) |
| `beratInputKg` | Number | Ya | Berat bahan baku yang diolah (satuan Kg) |
| `foto` | File | Tidak | Dokumentasi kegiatan di lapangan |

---

## 4. Hasil Verifikasi & Quality Assurance (QA)

| Komponen | Metode Uji | Hasil | Status |
|---|---|---|---|
| **Web Dashboard** | `npx tsc --noEmit` (apps/web) | 0 error, Clean build | ✅ LULUS |
| **Backend API** | `npx tsc --noEmit` (apps/api) | 0 error, Clean build | ✅ LULUS |
| **Mobile Flutter** | `dart analyze` (2 views) | `No issues found!` | ✅ LULUS |
| **Role Invariant DPL** | `npx vitest run apps/api/src/controllers/dplApproval.test.ts apps/api/src/services/logbookVerifikasi.test.ts apps/api/src/services/penilaianKknRoleGuard.test.ts` | 30 tests passed (100%) | ✅ LULUS |

---
**Catatan Akhir**: Pemisahan sampah organik dan anorganik kini telah sinkron dari hulu (input mobile mahasiswa) hingga hilir (dashboard monitoring web dan agregasi backend).
