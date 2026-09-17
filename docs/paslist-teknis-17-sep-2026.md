# Paslist Teknis — Notulensi Rapat BERSEKA 17 September 2026

> **Branch**: `feat/notulensi-17-sep-2026` → PR ke `development`
> **Dibuat**: 17 September 2026
> **Digunakan oleh**: Tim Developer & Tim QC

---

## Catatan Penting dari Analisis Codebase

- `BinStatus` enum yang valid: `PRINTED`, `ASSIGNED_TO_PIC`, `ACTIVE_BOUND`, `BROKEN`, `INACTIVE`, `PENDING_APPROVAL`
- "Teraktivasi" = `ASSIGNED_TO_PIC` atau `ACTIVE_BOUND`
- "Kepatuhan" (compliance overlay) dihitung dari `ACTIVE_BOUND` per kelurahan
- `Facility.jenis` adalah String (bukan Prisma enum): `loseda`, `bata_terawang`, `rumah_maggot`, `bank_sampah`, `tps`, `buruan_sae`, `poc`, `posko_kkn`

---

## AREA 1 — Poin Mahasiswa KKN

### Formula

```
Komponen A (bobot 60%):
  NilaiProkerStep = rata-rata step proker kelompok
    SELESAI                              -> 100 poin
    SEDANG_BERJALAN / DISETUJUI          ->  60 poin
    Lainnya (belum mulai)                ->  25 poin
  RataAssessment  = rata-rata assessmentScore anggota
  KomponenA       = (NilaiProkerStep + RataAssessment) / 2

Komponen B (bobot 40%):
  RataRataKelompok = mean(KomponenA semua kelompok)

PoinAkhir per mahasiswa = (KomponenA x 0.6) + (RataRataKelompok x 0.4)
Catatan: PoinAkhir sama untuk semua anggota dalam kelompok yang sama.
```

### Checklist Developer

| No  | Item                                              | File                                                     | Status |
| --- | ------------------------------------------------- | -------------------------------------------------------- | ------ |
| 1.1 | Service `mahasiswaPoinService.ts` dibuat          | `apps/api/src/services/mahasiswaPoinService.ts`          | [ ]    |
| 1.2 | Fungsi `hitungPoinKelompok(kelompokId)`           | idem                                                     | [ ]    |
| 1.3 | Fungsi `hitungPoinSemua()` — batch semua kelompok | idem                                                     | [ ]    |
| 1.4 | Fungsi `simulasiFormula()` — preview tanpa DB write | idem                                                   | [ ]    |
| 1.5 | Fungsi `normalisasiPoinBulk()` — commit ke PointHistory | idem                                               | [ ]    |
| 1.6 | kategori PointHistory: "POIN_KKN_FINAL"           | idem                                                     | [ ]    |
| 1.7 | Route `GET /api/v1/points/kkn/simulasi` (DEVELOPER only) | `apps/api/src/routes/pointRoutes.ts`              | [ ]    |
| 1.8 | Route `POST /api/v1/points/kkn/normalisasi-bulk` (DEVELOPER only) | idem                                     | [ ]    |
| 1.9 | Filter test data: `isTestKelompok`, `isTestStudent` | idem                                                   | [ ]    |

### Checklist QC

| No   | Item                            | Kriteria Lulus                                     |
| ---- | ------------------------------- | -------------------------------------------------- |
| Q1.1 | Simulasi formula lulus          | Hasil preview konsisten sebelum dan setelah commit |
| Q1.2 | Kelompok tanpa proker           | NilaiProkerStep = 25 (default belum mulai)         |
| Q1.3 | Kelompok tanpa assessment       | RataAssessment = 0, tidak ada division by zero     |
| Q1.4 | Normalisasi bulk                | `PointHistory.kategori === "POIN_KKN_FINAL"`       |
| Q1.5 | Rekonsiliasi data lama          | Tidak ada duplikasi entri POIN_KKN_FINAL           |

---

## AREA 2 — Dashboard & Sistem MPL (Independent)

### Prinsip Desain MPL

- **Independent** dari DPL — file terpisah, route terpisah
- **Scope otomatis** ke kelurahan MPL (tidak ada manual filter kelurahan)
- **Tidak ada** Log Aktivitas untuk MPL
- **Tidak ada** verifikasi izin sakit (read-only)
- **Penilaian MPL** menunggu DPL selesai dulu (guard)

### Checklist Developer

| No   | Item                                                       | File                                                | Status |
| ---- | ---------------------------------------------------------- | --------------------------------------------------- | ------ |
| 2.1  | Service `mplService.ts` dibuat                             | `apps/api/src/services/mplService.ts`               | [ ]    |
| 2.2  | Fungsi `getDashboard(mplUserId)`                           | idem                                                | [ ]    |
| 2.3  | Fungsi `getKelompok(mplUserId, filters)`                   | idem                                                | [ ]    |
| 2.4  | Fungsi `getProgramKerja(mplUserId, filters)`               | idem                                                | [ ]    |
| 2.5  | Fungsi `getMonitoring(mplUserId, filters)`                 | idem                                                | [ ]    |
| 2.6  | Fungsi `getPenilaianMahasiswaList(mplUserId)`              | idem                                                | [ ]    |
| 2.7  | Fungsi `assessMahasiswaByMpl(opts)` — 8 aspek Mitra        | idem                                                | [ ]    |
| 2.8  | Guard: DPL harus sudah menilai sebelum MPL                 | idem                                                | [ ]    |
| 2.9  | Kalkulasi subtotalMitra, nilaiAkhir via calculateCompositeScore | idem                                           | [ ]    |
| 2.10 | Route `mplRoutes.ts` — semua endpoint MPL                  | `apps/api/src/routes/mplRoutes.ts`                  | [ ]    |
| 2.11 | Route registered di `index.ts`: `/api/v1/mpl`              | `apps/api/src/index.ts`                             | [ ]    |
| 2.12 | Halaman `MplDashboardPage.tsx`                             | `apps/web/src/pages/mpl/MplDashboardPage.tsx`       | [ ]    |
| 2.13 | Tab Dashboard: kelurahan, kelompok, jumlah anggota         | idem                                                | [ ]    |
| 2.14 | TIDAK ada tingkat presensi di dashboard                    | idem                                                | [ ]    |
| 2.15 | Tab Pelaksanaan: filter Kelurahan -> RW -> Kelompok         | idem                                                | [ ]    |
| 2.16 | Tab Monitoring: read-only, tanpa tombol verifikasi izin    | idem                                                | [ ]    |
| 2.17 | Tab Penilaian: 8 aspek Mitra, guard DPL dulu               | idem                                                | [ ]    |
| 2.18 | TIDAK ada menu Log Aktivitas                               | idem                                                | [ ]    |
| 2.19 | Route `/dashboard-mpl` di `AppRoutes.tsx`                  | `apps/web/src/routes/AppRoutes.tsx`                 | [ ]    |

### Checklist QC

| No   | Item                               | Kriteria Lulus                                          |
| ---- | ---------------------------------- | ------------------------------------------------------- |
| Q2.1 | Login MPL -> dashboard              | Hanya kelompok dari kelurahan MPL yang tampil           |
| Q2.2 | Tingkat presensi                   | Tidak muncul di dashboard MPL                           |
| Q2.3 | Filter Program Kerja               | Urutan Kelurahan -> RW -> Kelompok benar                |
| Q2.4 | Monitoring                         | Tidak ada tombol approve/reject izin sakit              |
| Q2.5 | Penilaian sebelum DPL              | Error 422: PENILAIAN_DPL_BELUM_SELESAI                  |
| Q2.6 | Penilaian setelah DPL              | Form 8 aspek bisa diisi dan disimpan                    |
| Q2.7 | Log Aktivitas                      | Menu tidak ada sama sekali di sidebar MPL               |
| Q2.8 | Scope wilayah                      | Data MPL tidak bocor ke kelurahan lain                  |

---

## AREA 3 — Penyesuaian DPL

### Checklist Developer

| No  | Item                                                              | File                                                | Status |
| --- | ----------------------------------------------------------------- | --------------------------------------------------- | ------ |
| 3.1 | Verifikasi: tidak ada filter kelurahan di UI DPL                  | `apps/web/src/pages/dpl/DplDashboardPage.tsx`       | [x]    |
| 3.2 | Scope DPL sudah otomatis dari backend (`kelompok.dplId`)          | `apps/api/src/services/dplService.ts`               | [x]    |

### Checklist QC

| No   | Item                         | Kriteria Lulus                              |
| ---- | ---------------------------- | ------------------------------------------- |
| Q3.1 | Login DPL                    | Kelompok yang tampil hanya milik DPL itu    |
| Q3.2 | Tidak ada dropdown kelurahan | UI bersih tanpa filter kelurahan di DPL     |

---

## AREA 4 — Dashboard Eksekutif: Tata Kelola Sampah + GIS

### Logic Overlay Kepatuhan (Otomatis dari Data Sistem)

```
Kepatuhan per Kelurahan = (Jumlah Bin ACTIVE_BOUND) / (Total Bin di kelurahan) x 100%
  TINGGI  : >= 70% -> hijau (#22c55e)
  SEDANG  : 40-69% -> kuning (#eab308)
  RENDAH  : < 40%  -> merah (#ef4444)
```

### Checklist Developer

| No   | Item                                                         | File                                                        | Status |
| ---- | ------------------------------------------------------------ | ----------------------------------------------------------- | ------ |
| 4.1  | Fungsi `getWasteFacilitiesGis(filters)`                      | `apps/api/src/services/kknExecutiveService.ts`              | [x]    |
| 4.2  | Exclude `jenis === "posko_kkn"` dari hasil GIS               | idem                                                        | [x]    |
| 4.3  | Fungsi `getActivatedBinsBreakdown(filters)`                  | idem                                                        | [x]    |
| 4.4  | Fungsi `getComplianceOverlay(filters)` — otomatis dari data  | idem                                                        | [x]    |
| 4.5  | Route `GET /dashboard/kkn-executive/gis/facilities`          | `apps/api/src/routes/dashboardRoutes.ts`                    | [x]    |
| 4.6  | Route `GET /dashboard/kkn-executive/gis/compliance-overlay`  | idem                                                        | [x]    |
| 4.7  | Route `GET /dashboard/kkn-executive/waste/bins-activated`    | idem                                                        | [x]    |
| 4.8  | Tab GIS/Peta di frontend eksekutif (Leaflet.js)              | `apps/web/src/pages/SuperUser/GisMapTab.tsx`                | [x]    |
| 4.9  | Marker per fasilitas — ikon berbeda per jenis                | idem                                                        | [x]    |
| 4.10 | Popup marker: nama, jenis, kelurahan, RW                     | idem                                                        | [x]    |
| 4.11 | Overlay warna kepatuhan per kelurahan                        | idem                                                        | [x]    |
| 4.12 | Filter kelurahan + RW di peta                                | idem                                                        | [x]    |
| 4.13 | Tab Tempat Sampah Teraktivasi                                | `apps/web/src/pages/SuperUser/TempatSampahAktifPage.tsx`    | [x]    |
| 4.14 | Kolom: ID, QR Code, Kelurahan, RW, Tgl Aktivasi              | idem                                                        | [x]    |
| 4.15 | Tab Tata Kelola Sampah di dasbor pimpinan/eksekutif          | `apps/web/src/pages/Dashboard/Dashboard.tsx`                | [x]    |
| 4.16 | Akses: role DLH + PIMPINAN + SUPER_USER                      | idem                                                        | [x]    |
| 4.17 | Isolasi Ranah: Tab KKN 100% bebas dari modul fasilitas sampah | `apps/web/src/pages/Dashboard/DashboardEksekutifKkn.tsx`    | [x]    |

### Checklist QC

| No   | Item                            | Kriteria Lulus                                             |
| ---- | ------------------------------- | ---------------------------------------------------------- |
| Q4.1 | Marker peta                     | Semua fasilitas tampil (maggot, TPS, bank sampah, dll)     |
| Q4.2 | Tidak ada posko KKN di GIS      | Filter jenis != "posko_kkn" berfungsi                      |
| Q4.3 | Popup marker                    | Kelurahan dan RW tampil benar                              |
| Q4.4 | Overlay warna                   | Tiga kategori berbeda warna sesuai formula                 |
| Q4.5 | Tempat sampah aktif             | Minimal 138 data tampil (status ASSIGNED_TO_PIC + ACTIVE_BOUND) |
| Q4.6 | Filter kelurahan/RW             | Data ter-filter benar                                      |
| Q4.7 | Isolasi Tab KKN                 | Tab KKN murni data mahasiswa & proker (0% elemen sampah)   |
| Q4.8 | Tab Tata Kelola Sampah          | Wadah resmi terpadu untuk Ringkasan, Peta GIS, & Tempat Sampah Aktif |

---

## AREA 5 — Multi-Role Akun (Opsi A: Switch Role)

### Arsitektur

```
User.roleId      -> role aktif saat ini (existing, tidak berubah)
UserRole[]       -> semua role yang dimiliki user (junction table baru)
JWT payload      -> { userId, role: activeRole, availableRoles: string[] }
POST /auth/switch-role -> ganti activeRole, regenerate JWT
```

### Checklist Developer

| No  | Item                                                               | File                                      | Status |
| --- | ------------------------------------------------------------------ | ----------------------------------------- | ------ |
| 5.1 | Model `UserRole` junction table di schema                          | `apps/api/prisma/schema.prisma`           | [ ]    |
| 5.2 | `prisma generate` berjalan bersih                                  | —                                         | [ ]    |
| 5.3 | Migrasi SQL disiapkan: `add-multi-role-junction`                   | `apps/api/prisma/migrations/`             | [ ]    |
| 5.4 | `authService.ts` — return `availableRoles` saat login              | `apps/api/src/services/authService.ts`    | [ ]    |
| 5.5 | Endpoint `POST /api/v1/auth/switch-role`                           | `apps/api/src/routes/authRoutes.ts`       | [ ]    |
| 5.6 | JWT payload diperbarui (availableRoles)                            | idem                                      | [ ]    |
| 5.7 | `authStore.ts` — state `availableRoles`, action `switchRole`       | `apps/web/src/store/`                     | [ ]    |
| 5.8 | `RoleSwitcher.tsx` — dropdown navbar                               | `apps/web/src/components/RoleSwitcher.tsx` | [ ]   |
| 5.9 | Hanya tampil jika `availableRoles.length > 1`                      | idem                                      | [ ]    |

### Checklist QC

| No   | Item              | Kriteria Lulus                                        |
| ---- | ----------------- | ----------------------------------------------------- |
| Q5.1 | Akun single-role  | Dropdown tidak muncul                                 |
| Q5.2 | Akun multi-role   | Dropdown muncul, semua role tersedia                  |
| Q5.3 | Switch role       | Role aktif berubah, redirect ke dashboard role baru   |
| Q5.4 | Data akses        | Setelah switch, hanya data role aktif yang terlihat   |

---

## AREA 6 — Petugas Mobile (Field Penamaan Daerah)

### Keputusan Implementasi

- Akun petugas sudah ada — dibuat oleh tim Berseka
- Tidak perlu bulk insert
- Yang ditambah: field `namaDisplay` dan `kelurahan` di model `PetugasResidu`
- Leaderboard/peringkat menampilkan `namaDisplay` (misal: "Petugas Kelurahan Dago 01")

### Checklist Developer

| No  | Item                                               | File                                        | Status |
| --- | -------------------------------------------------- | ------------------------------------------- | ------ |
| 6.1 | Field `namaDisplay String?` di `PetugasResidu`     | `apps/api/prisma/schema.prisma`             | [ ]    |
| 6.2 | Field `kelurahan String?` di `PetugasResidu`       | idem                                        | [ ]    |
| 6.3 | `prisma generate` bersih                           | —                                           | [ ]    |
| 6.4 | Form edit petugas: input `namaDisplay` + `kelurahan` | Frontend terkait                          | [ ]    |
| 6.5 | Leaderboard: tampilkan `namaDisplay` jika ada, fallback ke `nama` | Frontend terkait              | [ ]    |

### Checklist QC

| No   | Item                  | Kriteria Lulus                              |
| ---- | --------------------- | ------------------------------------------- |
| Q6.1 | Field namaDisplay     | Dapat diisi dan tersimpan via form          |
| Q6.2 | Leaderboard           | Tampilkan "Petugas Kelurahan [nama] [no]"   |
| Q6.3 | Fallback              | Jika namaDisplay kosong, tampilkan nama     |

---

## Rangkuman Validasi Akhir

| Prioritas    | Area                                         | Status |
| ------------ | -------------------------------------------- | ------ |
| KRITIS       | Poin mahasiswa: formula dan normalisasi       | [ ]    |
| KRITIS       | MPL dashboard dan penilaian (independent)    | [ ]    |
| PENTING      | GIS/Peta dan tempat sampah teraktivasi       | [x] Backend done |
| PENTING      | Multi-role switch + namaDisplay petugas      | [ ]    |
| VERIFIKASI   | DPL auto-scope (sudah benar)                 | [x]    |

### Perintah Validasi CI/CD (Wajib Lulus Sebelum PR)

```bash
# Backend
cd apps/api && npx tsc --noEmit     # 0 error
cd apps/api && npx prisma generate  # Sukses

# Frontend
cd apps/web && npx tsc --noEmit     # 0 error

# Tests (jangan sampai patah)
cd apps/api && npx vitest run penilaianKknRoleGuard.test.ts
cd apps/api && npx vitest run mplScoping.test.ts
```
