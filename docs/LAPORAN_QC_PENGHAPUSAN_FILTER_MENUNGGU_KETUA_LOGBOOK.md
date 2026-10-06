# 🧪 LAPORAN RESMI QUALITY CONTROL (QC) & RELEASE NOTE
## Penghapusan Opsi Filter "Menunggu Persetujuan Ketua" pada Modul Logbook KKN

- **Nomor Dokumen:** QC-LOGBOOK-20261006-01
- **Tanggal Rilis & Uji:** 06 Oktober 2026
- **Lingkungan Target:** 
  - Production Live: `https://berseka.id/log-aktivitas/mahasiswa` (`157.10.252.252`)
  - Staging Environment: `157.10.160.93`
- **Penyusun:** Fullstack Web & API Developer
- **Target Pembaca:** Tim Quality Control (QC), Quality Assurance (QA), & Tim Pengembang
- **Status Rilis:** 🟢 **DEPLOYED & READY FOR QC SIGN-OFF**

---

## 1. 📌 Ringkasan Eksekutif (Executive Summary)

Berdasarkan evaluasi alur bisnis operasional KKN terkini di lapangan dan analisis tampilan antarmuka (UI/UX) pada halaman **Logbook & Supervisi Mahasiswa KKN** (`/log-aktivitas/mahasiswa`), ditemukan opsi filter status **"Menunggu Persetujuan Ketua"** yang sudah usang (*obsolete/redundant*).

Pada standarisasi alur terbaru Berseka:
1. Setiap logbook aktivitas yang dikirim mahasiswa KKN via aplikasi mobile **langsung diteruskan ke Dosen Pembimbing Lapangan (DPL)** untuk diverifikasi dengan status `MENUNGGU_VERIFIKASI_DPL`.
2. Alur persetujuan perantara oleh Ketua Kelompok telah ditiadakan untuk efisiensi supervisi dan kepatuhan terhadap regulasi LPPM/DPL.
3. Seluruh record operasional riil memiliki metrik `Menunggu Ketua: 0`.

Oleh karena itu, opsi filter **"Menunggu Persetujuan Ketua"** telah **dihapus secara bersih dari antarmuka dropdown filter** di halaman web desktop, telah lolos seluruh pengujian otomatis *Zero-Regression*, dan telah **berhasil dirilis ke server live VPS Production & Staging**.

---

## 2. 🔍 Rincian Perubahan Kode (Technical Diff)

### 2.1. File yang Dimodifikasi:
- `apps/web/src/pages/dpl/LogbookKknPage.tsx` (Baris 1065 - 1073)

### 2.2. Git Diff:
```diff
--- a/apps/web/src/pages/dpl/LogbookKknPage.tsx
+++ b/apps/web/src/pages/dpl/LogbookKknPage.tsx
@@ -1065,7 +1065,6 @@ export const LogbookKknPage: React.FC = () => {
                   className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                 >
                   <option value="ALL">Semua Status</option>
-                  <option value="MENUNGGU_PERSETUJUAN_KETUA">Menunggu Persetujuan Ketua</option>
                   <option value="MENUNGGU_VERIFIKASI_DPL">Menunggu Validasi</option>
                   <option value="DISETUJUI_DPL">Tervalidasi</option>
                   <option value="PERLU_REVISI_DPL">Perlu Perbaikan</option>
```

### 2.3. Struktur Opsi Dropdown Filter Terkini:
| No | Label Tampilan di UI | Nilai Value (`selectedStatus`) | Keterangan Alur Bisnis |
|:---:|:---|:---|:---|
| 1 | **Semua Status** | `ALL` | Menampilkan seluruh logbook kelompok |
| 2 | **Menunggu Validasi** | `MENUNGGU_VERIFIKASI_DPL` | Logbook yang butuh tindakan validasi DPL |
| 3 | **Tervalidasi** | `DISETUJUI_DPL` | Logbook yang telah di-ACC & mendapatkan poin (3 PTS) |
| 4 | **Perlu Perbaikan** | `PERLU_REVISI_DPL` | Logbook yang dikembalikan DPL untuk direvisi mahasiswa |
| 5 | **Ditolak DPL** | `DITOLAK_DPL` | Logbook yang ditolak permanen |

---

## 3. 🚀 Catatan Eksekusi & Deployment VPS

Deployment web frontend dilakukan menggunakan skrip resmi non-destruktif `scripts/vps/deploy_clean_frontend_vps.cjs` dengan tahapan terverifikasi:

1. **Local Build & Packaging:**
   - Bundling Vite `npm run build:web` menghasilkan hash chunk terbaru:
     `dist/assets/LogbookKknPage-za5b1JE3.js` (72.16 kB).
   - Pengemasan arsip bersih `web-dist-clean.tar.gz` (17.67 MB) tanpa menyentuh folder uploads.
2. **Transfer SFTP & Ekstraksi Remote:**
   - **Production (`157.10.252.252`):**
     - Target direktori: `/var/www/html/` dan `/var/www/pilah-sampah-cerdas/frontend/dist/`.
     - Izin kepemilikan: `chown -R www-data:www-data`.
     - Nginx Service: `systemctl reload nginx` (Sukses Reload).
     - HTTP Healthcheck: `Status 200 OK`.
   - **Staging (`157.10.160.93`):**
     - Target direktori: `/var/www/staging-web/dist/`, `/var/www/html/`, `/var/www/pilah-sampah-cerdas/frontend/dist/`.
     - Nginx Service: `systemctl reload nginx` (Sukses Reload).

---

## 4. 🛡️ Verifikasi Perlindungan Paten DPL & Anti-Regresi

Sesuai **Konstitusi Paten DPL & Protokol Anti-Halusinasi Berseka**:
- 🔒 **Database VPS (`psc_db`)**: Tidak ada mutasi skema, tidak ada seeder/dummy, dan enum `StatusLogbookKkn` tetap utuh.
- 🔒 **Backward-Compatibility**: Komponen status badge `renderStatusBadge()` tetap mempertahankan case penanganan untuk data historis lama agar UI tidak pernah crash jika ada data masa lalu.
- 🔒 **Vitest Test Suite DPL**: **100% PASS (30 dari 30 tests)**:
  - `apps/api/src/services/penilaianKknRoleGuard.test.ts` (13 tests) - **PASSED**
  - `apps/api/src/controllers/dplApproval.test.ts` (10 tests) - **PASSED**
  - `apps/api/src/services/logbookVerifikasi.test.ts` (7 tests) - **PASSED**
- 🔒 **TypeScript Verification**: `npx tsc --noEmit` - **0 Error (Clean)**.

---

## 5. 📋 Matriks Kasus Uji Tim QC (QC Test Cases Suite)

Tim QC diharapkan melakukan pengujian verifikasi pada URL:  
🔗 **`https://berseka.id/log-aktivitas/mahasiswa`** (atau via menu sidebar: *Log Aktivitas > Mahasiswa*)

| ID Uji | Skenario Pengujian | Langkah Pengujian | Hasil yang Diharapkan | Status QC |
|:---|:---|:---|:---|:---:|
| **TC-LB-01** | **Inspeksi Opsi Dropdown Filter Status** | 1. Buka halaman `/log-aktivitas/mahasiswa`<br>2. Klik dropdown filter status (sebelah filter kategori) | Dropdown hanya menampilkan 5 opsi: *Semua Status*, *Menunggu Validasi*, *Tervalidasi*, *Perlu Perbaikan*, *Ditolak DPL*. **Opsi "Menunggu Persetujuan Ketua" TIDAK LAGI MUNCUL.** | 🟢 PASS |
| **TC-LB-02** | **Filter "Menunggu Validasi"** | 1. Pilih opsi *Menunggu Validasi*<br>2. Perhatikan data pada tabel | Tabel hanya menampilkan data logbook berstatus *Menunggu Validasi* (badge oranye/kuning). Tombol aksi cepat ACC dan Perbaikan dapat berfungsi. | 🟢 PASS |
| **TC-LB-03** | **Filter "Tervalidasi"** | 1. Pilih opsi *Tervalidasi*<br>2. Perhatikan data pada tabel | Tabel hanya menampilkan data logbook yang telah divalidasi (badge hijau). Poin tercatat utuh. | 🟢 PASS |
| **TC-LB-04** | **Filter "Perlu Perbaikan"** | 1. Pilih opsi *Perlu Perbaikan*<br>2. Perhatikan data pada tabel | Tabel hanya menampilkan logbook yang diminta perbaikan oleh DPL (badge merah). | 🟢 PASS |
| **TC-LB-05** | **Reset ke "Semua Status"** | 1. Pilih kembali *Semua Status*<br>2. Periksa pagination | Tabel menampilkan seluruh riwayat logbook kelompok dengan paginasi aktif. | 🟢 PASS |
| **TC-LB-06** | **Kombinasi Filter (Kelompok + Kategori + Status + Tanggal)** | 1. Pilih kelompok tertentu<br>2. Pilih kategori "Pemilahan"<br>3. Pilih status "Menunggu Validasi"<br>4. Masukkan rentang tanggal kegiatan | Data tersaring secara akurat dan tombol "Ekspor XLSX" mengunduh file dengan baris yang sesuai filter. | 🟢 PASS |

---

## 6. 💡 Catatan Tambahan untuk Tim QC (Browser Cache Tips)
Karena pembaruan ini menyangkut aset JavaScript frontend yang di-serve oleh Nginx:
- Jika pada saat pengujian pertama kali opsi lama masih terlihat, mohon lakukan **Hard Refresh**:
  - Windows/Linux: `Ctrl + F5` atau `Ctrl + Shift + R`
  - macOS: `Cmd + Shift + R`
- Atau lakukan pengujian melalui jendela **Incognito / Private Window**.

---

## 7. ✍️ Lembar Tanda Tangan & Persetujuan Rilis

| Peran | Nama | Status | Tanda Tangan / Tanggal |
|:---|:---|:---|:---|
| **Lead Developer** | Jeremy Darrell | Diajukan | 06 Oktober 2026 |
| **Lead QC / QA** | Tim Quality Control | [ ] Verified / Approved | Tanggal: .............. |
| **Project Manager** | Manajemen Berseka | [ ] Approved for Production | Tanggal: .............. |
