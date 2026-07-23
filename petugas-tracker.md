# 🚛 Petugas Residu Tracker

Dokumen ini melacak kemajuan implementasi fitur-fitur pada Portal Petugas Residu sesuai spesifikasi Prompt 5.

## Checklist Implementasi

### 1. INPUT BERAT AKTUAL MANUAL
- [x] Penambahan UI input angka manual di form `PetugasDashboard.tsx` khusus untuk berat timbangan fisik.
- [x] Menyimpan `actualWeightPetugas` secara terpisah dari estimasi AI di `WasteLog`.

### 2. PERHITUNGAN KPI PETUGAS
- [x] Implementasi rumus `KPI_Petugas = (0.6 x Ketepatan_Waktu_Lapor) + (0.4 x Akurasi_vs_AI)`.
- [x] Pembaruan nilai `kpiScore` di tabel `PetugasResidu` setiap *submission* berhasil.
- [x] Menampilkan *real-time score* pada dashboard petugas di *frontend*.

### 3. ESKALASI OTOMATIS (CRON JOB)
- [x] Pembuatan `cronService.ts` untuk melacak `DispatchTask` yang tidak dipenuhi dalam *window* operasional (06:00-08:00 dan 16:00-18:00).
- [x] Mengirimkan notifikasi hierarkis secara otomatis (RW -> Lurah -> Camat -> Admin DLH).

### 4. ENDPOINT EXPORT DATASET
- [x] Endpoint `/api/v1/dashboard/export-dataset` untuk men-download riwayat dalam format CSV (hanya bisa diakses oleh role yang ditentukan).
- [x] Tombol pada portal *read-only* Admin DLH.

## Status Eksekusi
- [x] Backend
- [x] Frontend
- [x] Verification
