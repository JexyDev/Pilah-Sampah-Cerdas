# 🏛️ KONSTITUSI & SPESIFIKASI PATEN ROLE DPL (DOSEN PEMBIMBING LAPANGAN)
## Sistem Manajemen Sampah & Program KKN Tematik BERSEKA
**Status Dokumen:** 🔒 **PATEN / FINAL / IMMUTABLE BASELINE**  
**Tanggal Pengesahan:** 2 Oktober 2026  
**Otoritas:** Master Backend & Lead Frontend Architecture PT Makerindo  
**Target Lingkungan:** VPS Produksi (`157.10.252.252:3000`), Staging, & Local Development  

---

## 1. Latar Belakang & Filosofi "Paten"
Role **DPL (Dosen Pembimbing Lapangan)** memegang peranan krusial dalam tata kelola akademik, pendampingan lapangan, validasi kegiatan, dan penilaian akhir mahasiswa KKN. Mengingat kompleksitas keterkaitan data antara DPL, Kelompok KKN, Mahasiswa, Logbook Harian, Presensi Mandiri, dan Program Kerja, arsitektur role DPL telah mencapai status **stabil dan teruji (100% Vitest & TypeScript Passed)**.

Dokumen ini menjadi **Hukum Dasar (Constitution)** bagi seluruh pengembang manusia maupun agen AI. **Segala bentuk perubahan atau intervensi pada role DPL di masa mendatang WAJIB tunduk pada klausul di bawah ini.**

---

## 2. Invarian Arsitektur & Skema Database (DB Invariants)

### A. Entitas & Relasi Prisma Schema
1. **User Identity (`model User`)**:
   - Kolom `role`: Menerima string `"DPL"`, `"DOSEN_PEMBIMBING"`, atau `"DOSEN_PENDAMPING"`.
   - Kolom `nip`: Menyimpan Nomor Induk Pegawai Dosen (format unik / awalan `4127`).
   - Relasi `dplKelompok`: Relasi satu DPL ke satu atau lebih `KelompokKkn` (`dplId: User.id`).
2. **Kelompok KKN (`model KelompokKkn`)**:
   - Foreign Key: `dplId String? @map("id_dpl")`.
   - Relasi: `dpl User? @relation("DplKelompok", fields: [dplId], references: [id])`.
   - **Klausul Paten:** Satu kelompok KKN hanya memiliki satu DPL penanggung jawab. DPL hanya dapat mengelola data mahasiswa dalam kelompok yang terikat dengan `dplId`-nya.
3. **Logbook Aktivitas DPL (`model LogbookDpl`)**:
   - Tabel: `logbook_dpl`.
   - Kolom Utama: `id`, `dplId`, `kelompokId`, `tanggal`, `pekanKe`, `aktivitas`, `catatan`, `fotoUrl`.
   - Relasi: Cascade delete jika DPL atau Kelompok dihapus.
   - Poin DPL dihitung berdasarkan ketersediaan logbook: `poinLogbookDpl = hasLogbookDpl ? 6 : 0`.
4. **Logbook Mahasiswa (`model LogbookKkn`)**:
   - Kolom Verifikasi: `diverifikasiDplOlehId`, `diverifikasiDplPada`, `catatanDpl`.
   - Status Approval: `MENUNGGU_VERIFIKASI_DPL`, `DISETUJUI_DPL`, `PERLU_REVISI_DPL`, `DITOLAK_DPL`.

---

## 3. Matriks Otorisasi & Hak Mutasi Eksklusif (Access Control)

| Fitur / Modul | DPL | Panitia Taskforce | MPL | Pimpinan | Mahasiswa | Keterangan Guard Backend |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Login Web Desktop** | ✅ Buka (NIP/HP) | ✅ Buka | ✅ Buka | ✅ Buka | ❌ Tutup (iOS Safari) | DPL diizinkan login browser desktop |
| **Telaah / Keputusan Izin/Sakit** | ✅ **Eksklusif** | ✅ Backup | ❌ 403 Forbidden | ❌ 403 Forbidden | ❌ | `disallowReadOnlyLeaveMutation` |
| **Verifikasi Logbook Mahasiswa** | ✅ **Eksklusif** | ✅ Backup | ❌ Read-Only | ❌ Read-Only | ❌ | Single & Batch approval di `/logbook` |
| **Keputusan Program Kerja (Proker)**| ✅ **Eksklusif** | ✅ Backup | ❌ 403 Forbidden | ❌ 403 Forbidden | ❌ | `disallowReadOnlyProkerDecision` |
| **Penilaian Laporan Akhir & Proker**| ✅ **Eksklusif** | ✅ Backup | ❌ 403 Forbidden | ❌ 403 Forbidden | ❌ | `penilaianKknRoleGuard` |
| **Input Logbook Aktivitas DPL** | ✅ Mandiri | ❌ | ❌ | ❌ | ❌ | CRUD logbook DPL pribadi via `/activity-logs` |
| **Master Rule Engine & DB User** | ❌ Read-Only/Tutup | ❌ | ❌ | ❌ | ❌ | Hak eksklusif DEVELOPER / SUPER_USER |

---

## 4. Alur Bisnis Paten (Strict Business Flows)

### A. Flow 1: Verifikasi & Edit Logbook Pasca-ACC DPL
1. Mahasiswa mengunggah logbook awal ➔ Status: `MENUNGGU_VERIFIKASI_DPL` ➔ Poin bertambah 3 PTS.
2. DPL melakukan ACC ➔ Status: `DISETUJUI_DPL` ➔ Tercatat waktu dan DPL verifikator.
3. Mahasiswa mengoreksi logbook pasca-ACC via Mobile:
   - Endpoint: `PUT /api/v1/logbook/mahasiswa/:id`.
   - Status **otomatis reset** ke `MENUNGGU_VERIFIKASI_DPL`.
   - `diverifikasiDplPada` di-reset ke `null`.
   - Push notifikasi otomatis dikirimkan ke HP DPL pembimbing.
   - **Integritas Poin Mutlak:** Saldo mahasiswa tetap utuh 3 PTS (Zero Mutation: tidak dipotong, tidak digandakan).
4. DPL memverifikasi ulang dari panel DPL.

### B. Flow 2: Scoping Wilayah & Mahasiswa Dampingan
- Fungsi: `getKelompokWhere(dplUserId, role)`.
- Logika: Murni mengambil record `kelompokKkn` dengan kondisi `OR: [{ dplId: dplUserId }, { dpl: { id: dplUserId } }]`.
- **Klausul Paten:** DPL **TIDAK BOLEH** melihat, mengubah status kehadiran, atau menilai mahasiswa dari kelompok binaan DPL lain.

### C. Flow 3: Formula Nilai Kelulusan & Bobot Penilaian
- Batas Kelulusan: `NILAI_LULUS_MINIMUM = 65`.
- Komponen Nilai Akhir Mahasiswa:
  - Kehadiran / Presensi: Bobot 20%
  - Logbook Harian Mahasiswa: Bobot 25%
  - Program Kerja Kelompok: Bobot 30%
  - Laporan Akhir KKN: Bobot 25%
- Formula Poin DPL: `Poin = (poinLogbookDpl * 0.5) + (poinKelompok * 0.5)`.

---

## 5. UI/UX & Web Frontend Baseline

1. **Dashboard Home Landing**:
   - Mengakses `/dasbor` langsung me-render `<DplDashboardPage />`.
2. **Navigasi Sidebar (`apps/web/src/utils/sidebarAccess.ts`)**:
   - Menu DPL yang aktif:
     - `/dasbor` (Statistik kelompok, kepatuhan, alert)
     - `/pelaksanaan/kelompok` & `/pelaksanaan/posko`
     - `/pelaksanaan/program-kerja`
     - `/monitoring-kegiatan/presensi` & `/monitoring-kegiatan/pengajuan-izin`
     - `/penilaian/mahasiswa`, `/penilaian/program-kerja`, `/penilaian/laporan-akhir`, `/penilaian/rekapitulasi-nilai-akhir`
     - `/log-aktivitas/mahasiswa` & `/log-aktivitas/dosen-pembimbing-lapangan`
3. **Penyembunyian Modul Non-DPL**:
   - DPL tidak diizinkan mengakses pengaturan sistem, manajemen pengguna admin, atau rule engine DLH.

---

## 6. Protokol Anti-Halusinasi AI & Wajib Konfirmasi Panjang

Setiap agen AI (termasuk Antigravity / Gemini / Claude) yang bekerja pada repositori ini **TERIKAT SECARA HUKUM DENGAN PROTOKOL INI**:

### 🚫 Yang DILARANG Dilakukan AI:
1. Mengubah nama string role `DPL` atau membuang variasi normalisasinya (`DOSEN_PEMBIMBING`, `DOSEN_PENDAMPING`).
2. Menghapus guard otorisasi `disallowReadOnlyLeaveMutation` atau `disallowReadOnlyProkerDecision`.
3. Membuka hak mutasi approval kepada role Pimpinan atau MPL.
4. Mengubah formula nilai lulus `NILAI_LULUS_MINIMUM = 65` tanpa instruksi tertulis khusus dari Rektor/Ketua LPPM.
5. Menghilangkan filter `dplId` pada query database sehingga data mahasiswa antar DPL tercampur.

### 📝 Format Wajib Konfirmasi Panjang Jika DPL Tersentuh:
Jika suatu tugas perbaikan fitur lain secara tidak terhindarkan berdampak pada file DPL, AI **WAJIB MENSTOP TINDAKANNYA** dan mengirimkan konfirmasi kepada pengguna dengan template berikut:

```markdown
⚠️ [KONFIRMASI PERLINDUNGAN ROLE DPL TERDETEKSI]

Halo Developer, pekerjaan saat ini berpotensi menyentuh modul DPL yang telah dipatenkan.
Sebelum melanjutkan, berikut rincian dampak dan mitigasi teknis:

1. File Terkait DPL yang Berpotensi Terpengaruh:
   - [Sebutkan file, misal: apps/api/src/services/dplService.ts]

2. Alasan Teknis & Latar Belakang:
   - [Jelaskan secara komprehensif mengapa kode ini perlu disentuh]

3. Jaminan Invarian Paten:
   - [ ] Scoping kelompok DPL tetap 100% terisolasi
   - [ ] Hak mutasi approval izin/sakit tetap eksklusif DPL (Pimpinan/MPL tetap 403)
   - [ ] Formula nilai lulus (65) dan bobot penilaian tidak berubah
   - [ ] Fitur edit logbook pasca-ACC tetap mempertahankan saldo poin 3 PTS

4. Rencana Validasi Pengujian:
   - Menjalankan Vitest: dplApproval.test.ts, logbookVerifikasi.test.ts, penilaianKknRoleGuard.test.ts

Mohon ketik "SETUJU" jika Anda mengizinkan AI melanjutkan modifikasi ini.
```

---

## 7. Status Pengujian Terkini (Baseline Verification)

Pengujian otomatis telah dijalankan pada 2 Oktober 2026 dan menghasilkan status **100% HIJAU (PASS)**:
- `apps/api/src/controllers/dplApproval.test.ts` (10/10 Passed)
- `apps/api/src/services/logbookVerifikasi.test.ts` (7/7 Passed)
- `apps/api/src/services/penilaianKknRoleGuard.test.ts` (13/13 Passed)
- **Total: 30 Unit Tests Lulus Tanpa Regresi.**
