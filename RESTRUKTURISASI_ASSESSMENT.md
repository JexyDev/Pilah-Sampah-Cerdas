# RESTRUKTURISASI_ASSESSMENT.md — Document Baseline & Rencana Restrukturisasi

**Tanggal Audit Baseline:** 30 Juli 2026  
**Status Audit:** Baseline resmi dicatat, isolasi script sementara selesai, penyesuaian domain & temuan arsitektur diperbarui.

---

## 1. Baseline Sebelum Perapihan (Test Suite apps/api)

Sesuai hasil eksekusi test runner (`vitest run`), terdapat **6 test/suite yang teridentifikasi gagal** SEBELUM adanya perapihan/pemindahan lokasi file.

### Kriteria Sukses Pasca-Restrukturisasi
> **Bukan 0 test gagal**, melainkan **jumlah dan nama test yang gagal TETAP SAMA (maksimal 6 test ini)**. Jika bertambah menjadi 7+ atau ada nama test lain yang gagal, menandakan terjadinya regresi akibat proses pemindahan kode.

### Daftar 6 Test Fungsional/Integration yang Gagal (Baseline Resmi):

1. **`src/services/portals.test.ts` (Integration Test)**
   - **Pesan Error:** `PrismaClientKnownRequestError: Foreign key constraint violated on the constraint: catatan_permintaan_ai_id_pengguna_fkey` pada `prisma.user.deleteMany()`.
   - **Penyebab Baseline:** Isu pembersihan data seed/FK constraint relational database pada teardown setup sebelum test berjalan.

2. **`src/services/userService.test.ts` > `getAllUsers`**
   - **Pesan Error:** `AssertionError: expected { id: 'user-1', ... } to deeply equal ...` (`email` expected `one@psc.id`, received `+6281122233344`; `nik` expected `1234567890123456`, received `-`).
   - **Penyebab Baseline:** Mock data test unit belum disesuaikan dengan skema login warga berbasis nomor HP (+62).

3. **`src/services/userService.test.ts` > `createUser` (Valid Inputs)**
   - **Pesan Error:** `AssertionError: expected "vi.fn()" to be called with arguments: [ 'new@psc.id' ] (Number of calls: 0)`.
   - **Penyebab Baseline:** Implementasi service beralih menggunakan pencarian identifier HP (`findByPhone`), sedangkan unit test masih mengecek mock `findByEmail`.

4. **`src/services/userService.test.ts` > `createUser` (Duplicate Constraint)**
   - **Pesan Error:** `AssertionError: promise resolved "{ id: 'user-new', ... }" instead of rejecting (toThrow EMAIL_CONFLICT)`.
   - **Penyebab Baseline:** Validasi konflik duplikasi beralih ke validasi HP warga.

5. **`dist/services/e2e.test.js` > `should verify login and credentials generation for all seeded roles`**
   - **Pesan Error:** `PrismaClientKnownRequestError: Foreign key constraint violated on the constraint: token_penyegar_id_pengguna_fkey` pada `prisma.refreshToken.create()`.
   - **Penyebab Baseline:** Relasi FK refresh token pada build artifact `dist/` saat dieksekusi bersamaan.

6. **`dist/services/userService.test.js`**
   - **Pesan Error:** *Duplikasi test suite dari `userService.test.ts` pada compiled `dist/` folder.*

---

## 2. Status Isolasi File Workaround / Temporary Script (Selesai)

File tools sekali-pakai / script perbaikan telah dipisahkan ke folder `scripts/` masing-masing app dan **TIDAK DI-REFACTOR** ke dalam Clean Architecture/Feature folder.

- **`apps/api/scripts/`** (Tersimpan 3 file):
  - `add-bins.ts.bak`
  - `seed-rt.ts`
  - `test_e2e_api.ts`
- **`apps/web/scripts/`** (Tersimpan 3 file):
  - `tsc-auto-fix.ts`
  - `auto-fix-all.ts`
  - `remove-unused.ts`

---

## 3. Klarifikasi & Hasil Audit Komponen Halaman Web

### A. Evaluasi `ManajemenLokasi`
- **Hasil Audit Kode:** File `ManajemenLokasi.tsx` mengimpor `Leaflet`, `MapContainer`, `Turf.js`, serta menjalankan kalkulasi spasial `Polygon`, `generateHexagon`, dan penandaan visual koordinat tempat sampah (bin) & rumah tangga (household).
- **Keputusan Penempatan:** Karena mengelola Polygon Warga & Zona RT-RW spasial untuk pengangkutan, halaman ini dialokasikan ke domain **`src/features/tata-kelola-sampah/`** (BUKAN `pengaturan-master`).

### B. Pemisahan Composite Dashboards vs Feature Laporan
- Sesuai prinsip *feature-based architecture*, halaman dashboard multi-role (`Dashboard`, `Monitoring`, `ResiduDashboard`, `RwPortal`, `SuperAdmin`) bersifat *composite shell* (menggabungkan widget dari banyak feature). 
- **Keputusan Penempatan:** Halaman-halaman tersebut ditempatkan di **`src/pages/dashboards/`** (bukan di dalam folder `features/` untuk mencegah circular dependency), sedangkan `LaporanAnalitik` ditempatkan khusus di **`src/features/laporan-analitik/`**.

---

## 4. Temuan Arsitektur (Architectural Findings)

### ⚠️ Penggabungan Leaderboard Warga & Leaderboard Mahasiswa
- **Deskripsi Temuan:** Kode `apps/web/src/pages/Leaderboard/Leaderboard.tsx` saat ini menampung 2 sistem leaderboard sekaligus (Leaderboard Warga/RT/RW dan Leaderboard Mahasiswa/Kelompok KKN) yang berpindah menggunakan state toggle tab (`System 1` vs `System 2`).
- **Status Aturan Ketat:** Menurut aturan spesifikasi, 2 sistem leaderboard ini seharusnya berdiri secara independen di level kode.
- **Rencana Tindakan:** Sesuai Aturan Ketat #1, isu ini **HANYA DICATAT SEBAGAI TEMUAN** pada sesi perapihan ini (tidak di-refactor secara logic/UI sekarang). Pemisahan komponen UI `LeaderboardMahasiswa` menjadi file independen akan dijadwalkan pada sesi pemisahan logic terpisah.

---

## 5. Urutan Eksekusi Tahap 1 Restrukturisasi Modul

### A. Modul `apps/api` (Urutan Risiko Rendah -> Tinggi):
1. `scripts/` — **[SELESAI]** Pemindahan 3 script utility.
2. `shared/` + `utils/` — Pemindahan utility functions & helper independen.
3. `middlewares/` (8 file) — Pemindahan middleware HTTP ke layer interface/middleware.
4. `routes/` (21 file) — Pemindahan ke `src/interfaces/http/routes/`.
5. `controllers/` (24 file) — Pemindahan ke `src/interfaces/http/controllers/` (tanpa mengubah logic controller).
6. `services/` (39 file) — Pemindahan ke `src/infrastructure/` / `src/application/use-cases/` tanpa mengubah isi logic.

### B. Modul `apps/web` (Urutan Risiko Rendah -> Tinggi):
1. `scripts/` — **[SELESAI]** Pemindahan 3 script utility.
2. `components/common/` + `layout/` — Pemindahan komponen global UI.
3. `services/` (`aiService`, `authService`, `transactionService`, `api.ts`) — Perapihan layer pemanggilan API.
4. `pages/` (31 folder) — Pengelompokan ke `src/features/` & `src/pages/dashboards/` sesuai tabel final.

---

## 6. Tabel Final Pengelompokan 31 Halaman (`apps/web`)

| No | Lokasi Domain Target | Halaman (`apps/web/src/pages/`) yang Dikelompokkan | Jumlah |
|:--:|:---------------------|:---------------------------------------------------|:------:|
| **1** | `pages/dashboards/` *(Composite Shell)* | `Dashboard`, `Monitoring`, `ResiduDashboard`, `RwPortal`, `SuperAdmin` | 5 |
| **2** | `src/features/auth/` | `Login`, `Registration` | 2 |
| **3** | `src/features/tata-kelola-sampah/` | `SetorSampah`, `InputSetoranManual`, `RekapSetoran`, `KategoriSampah`, `ManajemenTempatSampah`, `ManajemenPengangkutan`, `ManajemenLokasi` | 7 |
| **4** | `src/features/pemanfaatan-daur-ulang/` | `PemanfaatanSampah`, `HasilPemanfaatan`, `IdeDaurUlang` | 3 |
| **5** | `src/features/ekosistem-kkn/` | `KknDashboard`, `ManajemenEkosistemKkn`, `ManajemenMahasiswa`, `MonitoringAbsen`, `JadwalKegiatan` | 5 |
| **6** | `src/features/gamifikasi-poin/` | `Leaderboard`, `PoinWarga` | 2 |
| **7** | `src/features/laporan-analitik/` | `LaporanAnalitik` | 1 |
| **8** | `src/features/pengaturan-master/` | `MasterData`, `ManajemenPengguna`, `Pengaturan`, `Notifikasi` | 4 |
| **9** | `pages/common/` *(Halaman Umum)* | `TentangAplikasi`, `NotFound` | 2 |
| | **TOTAL HALAMAN** | | **31** |

---

## 7. Rencana Sub-Langkah Pemindahan File Test (`apps/api`)

File test (`*.test.ts` / `*.spec.ts`) yang saat ini berada di dalam `apps/api/src/services/` akan dipindahkan secara **TERPISAH** dari pemindahan source code `services/`:
1. **Langkah 6a:** Pindahkan source code `services/*.ts` ke target layer architecture. Pastikan import path app tetap valid.
2. **Langkah 6b:** Pindahkan file `services/*.test.ts` ke folder `__tests__/` yang sejajar.
