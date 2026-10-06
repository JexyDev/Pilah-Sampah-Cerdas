# 🧪 LAPORAN RESMI QUALITY CONTROL (QC) & RELEASE NOTE
## Penambahan Kolom Waktu Penginputan (Timestamp) pada Tabel Log Aktivitas DPL

- **Nomor Dokumen:** QC-DPL-LOG-20261006-02
- **Tanggal Rilis & Uji:** 06 Oktober 2026
- **Lingkungan Target:** 
  - Production Live: `https://berseka.id/log-aktivitas/dosen-pembimbing-lapangan` (`157.10.252.252`)
  - Staging Environment: `157.10.160.93`
- **Penyusun:** Fullstack Web & API Developer
- **Target Pembaca:** Tim Quality Control (QC), Tim Quality Assurance (QA), & Project Manager
- **Status Rilis:** 🟢 **DEPLOYED & READY FOR QC SIGN-OFF**

---

## 1. 📌 Ringkasan Eksekutif (Executive Summary)

Dalam rangka penyelarasan audit trail dan standarisasi antarmuka pengawasan KKN, dilakukan penambahan kolom **"Tgl Diinput"** (Timestamp Submit) pada tabel riwayat kegiatan di halaman **Log Aktivitas DPL** (`/log-aktivitas/dosen-pembimbing-lapangan`).

### Kebutuhan & Latar Belakang:
1. **Pemisahan Waktu Pelaksanaan vs. Waktu Pelaporan**:
   - Kolom **Tanggal & Waktu** menampilkan tanggal dan rentang jam pelaksanaan kegiatan di posko/lapangan (misal: `5 Okt 2026, 13.00–15.00`).
   - Kolom baru **Tgl Diinput** menampilkan waktu riil saat log aktivitas tersebut disimpan/disubmit ke database oleh DPL/Petugas (`createdAt`), termasuk jam dan menit WIB (misal: `5 Okt 2026, 15.42 WIB`).
2. **Penyelarasan Desain (UI Parity)**:
   - Menyamakan format visual dengan kolom *Tgl Diinput* pada tabel **Logbook Mahasiswa** (`/log-aktivitas/mahasiswa`), sehingga memberikan konsistensi visual di seluruh modul supervisi.
3. **Audit Trail Komprehensif**:
   - Memudahkan tim monitoring, taskforce KKN, dan pimpinan dalam memverifikasi ketepatan waktu pelaporan aktivitas harian/mingguan DPL.

---

## 2. 🔍 Rincian Modifikasi Teknis (Technical Diff)

### 2.1. Berkas yang Dimodifikasi:
- `apps/web/src/pages/dpl/LogAktivitasDpl.tsx`

### 2.2. Git Commit & Branching Pipeline:
- **Feature Branch:** `feat/kolom-waktu-input-log-dpl`
- **Commit SHA Feature:** `5da5f4dc4` (`feat(web): tambah kolom Tgl Diinput pada tabel log aktivitas DPL`)
- **Merge ke Development:** `3ca67b8a5` (`merge: feat/kolom-waktu-input-log-dpl into development`)
- **Merge ke Staging:** `789dae6d5` (`merge: development into staging (Release Candidate: Kolom Tgl Diinput Log Aktivitas DPL)`)
- **Merge ke Production (Main):** `b6e965540` (`merge: staging into main (Release: Kolom Tgl Diinput Log Aktivitas DPL)`)

### 2.3. Git Diff Rinci:
```diff
--- a/apps/web/src/pages/dpl/LogAktivitasDpl.tsx
+++ b/apps/web/src/pages/dpl/LogAktivitasDpl.tsx
@@ -170,6 +170,24 @@ export const LogAktivitasDpl: React.FC = () => {
     }
   };
 
+  // Helper Format Tanggal + Jam Menit — untuk kolom "Tgl Diinput" (createdAt)
+  const formatDateTime = (dateStr?: string | null): { date: string; time: string } => {
+    if (!dateStr) return { date: "-", time: "" };
+    try {
+      const d = new Date(dateStr);
+      if (isNaN(d.getTime())) return { date: String(dateStr), time: "" };
+      const date = d.toLocaleDateString("id-ID", {
+        day: "numeric",
+        month: "short",
+        year: "numeric",
+      });
+      const hours = String(d.getHours()).padStart(2, "0");
+      const minutes = String(d.getMinutes()).padStart(2, "0");
+      return { date, time: `${hours}.${minutes}` };
+    } catch {
+      return { date: String(dateStr), time: "" };
+    }
+  };
 
   // Kalkulasi Durasi Dinamis Real-Time dengan Satuan "Jam"
   const calculatedDuration = useMemo(() => {
@@ -671,6 +689,7 @@ export const LogAktivitasDpl: React.FC = () => {
             <thead>
               <tr className="bg-slate-50/90 text-slate-600 font-semibold border-b border-slate-200">
                 <th className="py-3 px-3.5 whitespace-nowrap">Tanggal & Waktu</th>
+                <th className="py-3 px-3.5 whitespace-nowrap">Tgl Diinput</th>
                 <th className="py-3 px-3.5 whitespace-nowrap">Kelompok Dampingan</th>
                 <th className="py-3 px-3.5 whitespace-nowrap text-center">Pekan</th>
                 <th className="py-3 px-3.5 whitespace-nowrap">Kategori</th>
@@ -684,7 +703,7 @@ export const LogAktivitasDpl: React.FC = () => {
             <tbody className="divide-y divide-slate-100 text-slate-700">
               {loading ? (
                 <tr>
-                  <td colSpan={9} className="py-12 text-center text-slate-400">
+                  <td colSpan={10} className="py-12 text-center text-slate-400">
                     <div className="flex flex-col items-center justify-center gap-2">
                       <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                       <span>{isMpl ? "Memuat riwayat pendampingan lapangan..." : "Memuat riwayat aktivitas DPL..."}</span>
@@ -693,7 +712,7 @@ export const LogAktivitasDpl: React.FC = () => {
                 </tr>
               ) : logs.length === 0 ? (
                 <tr>
-                  <td colSpan={9} className="py-12 text-center text-slate-400">
+                  <td colSpan={10} className="py-12 text-center text-slate-400">
                     <div className="flex flex-col items-center justify-center gap-2">
                       <AlertCircle className="w-7 h-7 text-slate-300" />
                       <span className="font-semibold text-slate-600 text-sm">
@@ -716,6 +735,16 @@ export const LogAktivitasDpl: React.FC = () => {
                       <div className="text-[11px] text-slate-400">{item.waktuLengkap}</div>
                     </td>
 
+                    {/* 1b. Tgl Diinput — createdAt server timestamp */}
+                    <td className="py-3 px-3.5 whitespace-nowrap">
+                      <div className="font-medium text-slate-700 text-[11px]">
+                        {formatDateTime(item.createdAt).date}
+                      </div>
+                      <div className="text-[11px] text-slate-400">
+                        {formatDateTime(item.createdAt).time} WIB
+                      </div>
+                    </td>
+
                     {/* 2. Kelompok Dampingan */}
                     <td className="py-3 px-3.5 whitespace-nowrap">
                       <div className="font-semibold text-slate-800">{item.kelompokNama}</div>
```

---

## 3. 📊 Struktur Tabel Log Aktivitas DPL Terkini (10 Kolom)

| No | Nama Kolom Header | Sumber Data | Format Visual Tampilan | Fungsi / Keterangan |
|:---:|:---|:---|:---|:---|
| 1 | **Tanggal & Waktu** | `tanggalFormatted`, `waktuLengkap` | Teks tebal tanggal di atas, rentang jam di bawah (mis. `09.00–11.00`) | Waktu operasional kegiatan di lapangan |
| 2 | **Tgl Diinput** ⭐ *(BARU)* | `createdAt` | Tanggal format `d Mmm yyyy` di atas, jam `HH.mm WIB` di bawah | Timestamp riil penginputan logbook ke sistem |
| 3 | **Kelompok Dampingan** | `kelompokNama`, `kelurahan` | Nama kelompok di atas, nama kelurahan di bawah | Identitas kelompok bimbingan DPL |
| 4 | **Pekan** | `pekanKe` | Badge rounded `Pekan X` (biru lembut) | Penomoran pekan KKN dinamis (1–12) |
| 5 | **Kategori** | `kategori` | Badge abu-abu (mis. `Koordinasi`, `Kunjungan Lapangan`) | Klasifikasi jenis aktivitas |
| 6 | **Ringkasan Aktivitas** | `deskripsi` | Teks truncate 2 baris (`line-clamp-2`) | Ringkasan uraian kegiatan |
| 7 | **Lokasi Kegiatan** | `lokasi` | Ikon pin lokasi + nama tempat (mis. `RW Dampingan`) | Posko / lokasi kegiatan |
| 8 | **Durasi (Jam)** | `durasi` | Ikon jam + durasi terstandarisasi (mis. `2 jam`) | Durasi kegiatan supervisi |
| 9 | **Bukti** | `fotoBuktiUrl` | Tombol badge hijau (mis. `1 Foto`, `2 Foto`) | Akses modal preview foto dokumentasi |
| 10 | **Aksi** | - | Tombol `Detail`, `Edit`, `Hapus` | Interaksi manajemen logbook |

---

## 4. 🛡️ Jaminan Invarian Paten DPL (Zero Regression)

Perubahan ini telah diverifikasi memenuhi protokol proteksi **🔒 ATURAN PATEN ROLE DPL**:
1. **Backend Zero Touch**: Tidak ada pengubahan pada layer backend (`dplService.ts`, `dplController.ts`, `dplRoutes.ts`).
2. **Scoping Wilayah DPL**: Hak isolasi data bimbingan DPL tetap 100% menggunakan `getKelompokWhere`.
3. **Hak Mutasi Eksklusif**: Hak persetujuan izin/sakit dan program kerja tetap eksklusif bagi DPL/Taskforce. Role Pimpinan dan MPL tetap strictly *Read-Only (403)*.
4. **Formula Nilai KKN**: Threshold kelulusan minimum tetap `65`.

---

## 5. ✅ Hasil Pengujian Otomatis (Quality Gates)

| Parameter Uji | Perintah Eksekusi | Target Lulus | Hasil Aktual | Status |
|:---|:---|:---:|:---:|:---:|
| **Type Checking Web** | `npx tsc --noEmit --project apps/web/tsconfig.json` | 0 Error | 0 Error | 🟢 PASS |
| **DPL Test Suite** | `npx vitest run apps/api/src/controllers/dplApproval.test.ts apps/api/src/services/logbookVerifikasi.test.ts apps/api/src/services/penilaianKknRoleGuard.test.ts` | 30 / 30 Pass | 30 / 30 Pass | 🟢 PASS |
| **Lint & Format** | `git diff --check` | 0 Conflict | 0 Conflict | 🟢 PASS |
| **Git 3-Tier Pipeline** | `feat` ➔ `development` ➔ `staging` ➔ `main` | Clean Merge | Clean Merge | 🟢 PASS |

---

## 6. 📋 Panduan Pengujian Manual (Manual UAT Checklist untuk Tim QC)

Tim QC dapat melakukan verifikasi fungsional dengan langkah-langkah berikut:

- [ ] **Langkah 1:** Buka peramban (browser) dan akses halaman `/log-aktivitas/dosen-pembimbing-lapangan`.
- [ ] **Langkah 2:** Periksa header tabel: Pastikan kolom **"Tgl Diinput"** muncul tepat setelah kolom **"Tanggal & Waktu"** dan sebelum kolom **"Kelompok Dampingan"**.
- [ ] **Langkah 3:** Periksa data baris tabel:
  - Baris atas menampilkan tanggal (contoh: `5 Okt 2026`).
  - Baris bawah menampilkan waktu dengan format WIB (contoh: `14.30 WIB`).
- [ ] **Langkah 4:** Bandingkan dengan tanggal kegiatan di kolom **"Tanggal & Waktu"**:
  - Kolom **Tanggal & Waktu** menunjukkan waktu pelaksanaan kegiatan di posko.
  - Kolom **Tgl Diinput** menunjukkan waktu entri data disubmit ke sistem.
- [ ] **Langkah 5:** Uji klik tombol **Detail** pada salah satu baris:
  - Pastikan pada bagian bawah modal detail muncul informasi **Waktu diinput** dan **Terakhir diperbarui**.
- [ ] **Langkah 6:** Uji filter kelompok, filter pekan, dan pagination:
  - Pastikan kolom *Tgl Diinput* tetap tertata rapi dan tidak ada pergeseran lebar kolom (alignment shift).
- [ ] **Langkah 7:** Uji state kosong (Empty State):
  - Pilih filter kelompok yang belum memiliki data. Pastikan teks *Belum ada kegiatan DPL* membentang penuh (colSpan = 10) tanpa terpotong.

---

**Disetujui Oleh:**  
Lead Quality Assurance / Release Manager Berseka  
*PT Makerindo Prima Solusi*
