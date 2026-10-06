# 📋 LAPORAN RESMI AUDIT & REKONSILIASI DATA: TOTAL MAHASISWA KKN (532 ➔ 531)

**Nomor Dokumen**: BERSEKA/QC/RECON/20261006-01  
**Tanggal**: 06 Oktober 2026  
**Kepada**: Tim Quality Control (QC), Tech Lead, dan Tim Pengembang BERSEKA  
**Perihal**: Laporan Penyelesaian Selisih Data Total Mahasiswa KKN antara Laporan Presensi dan Dasbor Eksekutif  
**Status Eksekusi**: **100% RESOLVED & DEPLOYED TO PRODUCTION**  

---

## 1. 🎯 Ringkasan Eksekutif

| Indikator | Sebelum Perbaikan (Status QC) | Setelah Perbaikan (Status Produksi) | Status |
| :--- | :---: | :---: | :---: |
| **Dasbor Eksekutif KKN** (`/dasbor?tab=kkn`) | 531 Orang | 531 Orang | ✅ MATCH |
| **Laporan & Akumulasi Presensi** (`/monitoring-kegiatan/laporan-presensi`) | 532 Mahasiswa | 531 Mahasiswa | ✅ SINKRON 100% |
| **Selisih Data** | +1 Orang (Anomali) | 0 (Nol Selisih) | ✅ TUNTAS |
| **Single Source of Truth** | Tidak Sinkron | 100% Selaras (32 Kelompok Resmi) | ✅ VALID |

---

## 2. 🔍 Temuan Forensik Database VPS (Identitas Akun Selisih +1)

Berdasarkan audit langsung pada basis data PostgreSQL live VPS (`psc_db`):
- **Akar Masalah**: Terdapat 1 akun mahasiswa uji coba yang tercatat memiliki riwayat presensi di kelompok pengujian (`Kelompok TEST`), namun akun tersebut tidak berstatus `isTestAccount = true` di tabel user.
- **Profil Akun Teridentifikasi**:
  - **Nama**: `wulan mahasiswa`
  - **NIM**: `098786`
  - **Program Studi**: `informatika`
  - **Kelompok**: `Kelompok TEST` (ID: `2317e30b-1cac-43ba-ab6f-857bd91f5c79`)
  - **DPL**: `Dpl Test`
  - **Cakupan RW**: `["98", "99"]`
  - **Riwayat Kehadiran**: 3 sesi (total durasi 3 menit)

### Mengapa Angka Berbeda Sebelum Perbaikan?
1. **Di Dasbor Eksekutif KKN (`kknExecutiveService.ts`)**:
   - Sistem mengambil daftar 32 kelompok sah dan mengecualikan kelompok uji coba (`!isTestKelompok(k)`).
   - Mahasiswa difilter dengan syarat `kelompokId: { in: kelompokIds }`. Karena `Kelompok TEST` tereliminasi, `wulan mahasiswa` otomatis tidak terhitung.
   - **Hasil Dasbor**: **531 Orang**.
2. **Di Laporan Presensi KKN (`kknAttendanceService.ts`)**:
   - Query presensi `allSummaryRecords` mengambil data kehadiran tanpa membatasi bahwa kelompok mahasiswa wajib non-test.
   - Kolom `phone`, `noWa`, dan `isTestAccount` tidak disertakan dalam `select`.
   - Iterasi akumulasi tidak memverifikasi validitas kelompok mahasiswa, sehingga `wulan mahasiswa` dimasukkan ke dalam daftar mahasiswa terhitung.
   - Pada frontend (`LaporanPresensiPage.tsx`), filter uji coba gagal mendeteksi kelompok karena mengakses properti `it.kelompokName` yang bernilai `undefined`.
   - **Hasil Laporan**: **532 Mahasiswa**.

---

## 3. 🛠️ Rincian Implementasi Perbaikan

### A. Backend (`apps/api/src/services/kknAttendanceService.ts`)
1. **Penerapan Filter Kelompok Sah di Query Level**:
   - Mengambil seluruh ID kelompok resmi non-testing (`validKelompokIds`).
   - Menyisipkan kondisi `studentProfile: { kelompokId: { in: validKelompokIds } }` pada klausa `where` ketika parameter `includeTestAccounts` bernilai false.
2. **Seleksi Field Pengujian Lengkap**:
   - Menambahkan field `phone: true`, `isTestAccount: true` pada `student.select`.
   - Menambahkan field `noWa: true` pada `studentProfile.select`.
   - Menambahkan field `dplNamaMentah: true` pada relasi kelompok.
3. **Penyaringan Berlapis di Memory Loop**:
   - Melewati mahasiswa tanpa kelompok atau mahasiswa di kelompok testing (`!kknGroup || isTestKelompok(kknGroup)`).
   - Melewati akun yang terdeteksi sebagai testing (`isTestStudent(...)` dan `isTestAccount`).
   - Mencegah durasi dan sesi testing menambah akumulasi `totalMenitKumulatif` dan `hadirKurangCount`.
4. **Penyelarasan DTO Response**:
   - Menyediakan `kelompokName` dan `dplName` pada root item dan aggregate object agar UI frontend dapat membaca data secara konsisten.

### B. Frontend Web (`apps/web/src/pages/MonitoringAbsen/LaporanPresensiPage.tsx`)
1. **Perbaikan Sanitasi Objek Kelompok**:
   - Ekstraksi kelompok menggunakan fallback: `it.kelompok || (it.kelompokName ? { name: it.kelompokName, dplNamaMentah: it.dplName } : null)`.
   - Menghubungkan fungsi filter `isTestKelompok` dan `isTestStudent` dengan data lengkap (NIM, Nama, No HP, No WA, Kelompok).
2. **Sinkronisasi Kartu Metrik Ringkasan**:
   - Mengikat nilai `summary.totalMahasiswa` langsung ke panjang array bersih `cleanAggs.length` (531).

---

## 4. 🧪 Hasil Verifikasi & Uji Kualitas (Quality Gates)

### 1. Test Suite Otomatis (Vitest)
- **KKN Attendance & Executive Test**:
  - `apps/api/src/services/kknAttendanceService.test.ts` (59 tests) ➔ **PASSED (100%)**
  - `apps/api/src/services/kknExecutiveService.test.ts` (5 tests) ➔ **PASSED (100%)**
- **DPL Protection Constitution Guard**:
  - `apps/api/src/controllers/dplApproval.test.ts` (10 tests) ➔ **PASSED (100%)**
  - `apps/api/src/services/logbookVerifikasi.test.ts` (7 tests) ➔ **PASSED (100%)**
  - `apps/api/src/services/penilaianKknRoleGuard.test.ts` (13 tests) ➔ **PASSED (100%)**
- **Total Uji Unit**: **94 tests passed, 0 failures**.

### 2. Validasi Kompilasi TypeScript
- Backend API (`apps/api`): `tsc --noEmit` ➔ **Clean (0 errors)**.
- Frontend Web (`apps/web`): `vite build` ➔ **Clean (0 errors)**.

---

## 5. 🚀 Riwayat Alur Git & Deployment Produksi (3-Tier Git Flow)

Sesuai SOP tata kelola Git BERSEKA:
1. **Branch Bugfix**: `fix/rekonsiliasi-total-mahasiswa-kkn` dibuat dari `development` dan dicommit (`98b35a756`).
2. **Merge ke Development**: `development` diperbarui via merge commit (`26f6d235c`) dan dipush ke GitHub.
3. **Merge ke Staging**: `staging` diperbarui via merge commit (`9656ba9ae`) sebagai Release Candidate.
4. **Merge ke Production (Main)**: `main` diperbarui via merge commit (`939ab5325`) dan dipush ke GitHub.
5. **CI/CD Pipeline**: GitHub Actions otomatis memvalidasi build dan mendistribusikan kode ke server live VPS (`berseka.id`).

---

**Ditandatangani oleh**,  
*Fullstack Engineering Team BERSEKA*
