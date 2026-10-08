# 📋 LAPORAN RESMI PENYELARASAN BACKEND & PANDUAN PROMPT EKSEKUSI MOBILE DEVELOPER
## FITUR: RIWAYAT PRESENSI TIDAK MEMENUHI & RESOLUSI ANOMALI PERHITUNGAN DURASI KKN

**Tanggal Rilis:** 08 Oktober 2026  
**Otoritas:** Master Backend Developer & Lead Fullstack Developer (Main Monorepo)  
**Ditujukan Kepada:** Tim Mobile Developer Flutter Berseka & Mobile AI Agent  
**Tembusan:** Project Owner / Tech Lead & Tim Quality Control (QC)  
**Branch Backend:** `development` (Commit: `0267d8338`)  
**Status Sistem:** **100% EXECUTED, VERIFIED & PASS QUALITY GATE**

---

## 1. 🎯 RINGKASAN EKSEKUTIF BACKEND

Menindaklanjuti temuan dari Tim QC dan Laporan Analisis Tim Mobile mengenai dua anomali utama:
1. **Inkonsistensi Angka (7 Sesi di Beranda vs 6 Sesi di Riwayat)**
2. **Paradoks Durasi Jam Presensi (Check-In 13:28 & Check-Out 20:00 vs Durasi Tercatat 3 Jam 57 Menit)**

Master Backend Developer telah **berhasil mengeksekusi perbaikan logika kueri backend** pada modul presensi (`apps/api/src/services/kknAttendanceService.ts`) tanpa melakukan mutasi liar pada database VPS riil. 

### Poin Utama Pembaruan Backend:
* **Harmonisasi Filter Status `/laporan-presensi`**:
  Kueri `status: "HADIR_TIDAK_MEMENUHI"` kini secara cerdas mencakup:
  * Record berstatus literal `HADIR_TIDAK_MEMENUHI` dan `SELESAI_TELAT`.
  * Record historis berstatus `HADIR` yang telah check-out namun durasi efektifnya kurang dari target (`actualInZoneMinutes < targetMinMenit`).
* **Konsistensi 100% SSOT**:
  Kini baik `GET /timesheet/summary` maupun `GET /laporan-presensi?status=HADIR_TIDAK_MEMENUHI` mengembalikan angka yang **sinkron 1:1 (7 sesi)** untuk mahasiswa terkait.
* **Transparansi Payload Durasi & Jeda**:
  Endpoint mengembalikan atribut komparasi lengkap: `durasiMenit` (efektif di posko), `durasiJedaMenit` (akumulasi di luar posko/jeda), `durasiJedaFormatted`, `targetMinMenit`, `rasioKehadiran`, serta `statusDisplay`.

---

## 2. 🔬 BUKTI EKSEKUSI & HASIL QUALITY GATE BACKEND

Sesuai dengan protokol **Berseka Flow Guard** dan aturan paten **Role DPL (Dosen Pembimbing Lapangan)**, seluruh verifikasi lokal telah dijalankan dengan hasil **100% HIJAU**:

| Pengujian Mutu | Perintah Eksekusi | Hasil | Keterangan |
|---|---|:---:|---|
| **Attendance Test Suite** | `npx vitest run apps/api/src/services/kknAttendanceService.test.ts` | **PASS (63/63 Tests)** | Termasuk test baru validasi record historis `status='HADIR'` durasi 237 menit |
| **DPL Role Guard Suite** | `npx vitest run apps/api/src/controllers/dplApproval.test.ts apps/api/src/services/logbookVerifikasi.test.ts apps/api/src/services/penilaianKknRoleGuard.test.ts` | **PASS (30/30 Tests)** | Zero regression pada hak mutasi eksklusif & formula DPL |
| **TypeScript Build Check** | `npm run build --prefix apps/api` (`tsc`) | **PASS (Exit Code 0)** | Zero type error pada seluruh modul backend |

---

## 3. 💡 PENJELASAN TEKNIS ANOMALI UNTUK TIM QC

Untuk menjawab keraguan Tim QC mengenai *"Apakah aplikasi salah menghitung selisih jam?"*:
* **Bukan Kesalahan Jam Dinding**:
  Sistem presensi KKN Berseka menghitung durasi berdasarkan **Waktu Efektif Berada di Zona Geofence Posko (`actualInZoneMinutes`)**, bukan selisih jam dinding (*wall-clock difference*).
* **Rincian Sesi 21 September 2026**:
  * Jam Masuk: 13:28 WIB | Jam Pulang: 20:00 WIB (Total rentang: 392 menit / 6 jam 32 menit).
  * Waktu di luar zona posko / sinyal GPS terputus: **155 menit (2 jam 35 menit)**.
  * Waktu efektif berada di posko: **237 menit (3 jam 57 menit)**.
  * Target minimal harian: **240 menit (4 jam 00 menit)**.
  * Mahasiswa kurang **3 menit** dari target, sehingga statusnya sah menjadi **"Hadir & Tidak Memenuhi"** dan bonus +3 poin durasi tidak diberikan.
* **Kebutuhan Solusi di Mobile**:
  UI Mobile perlu menampilkan rincian waktu di posko dan waktu di luar posko agar Tim QC dan mahasiswa langsung memahami alur tersebut secara transparan.

---

## 4. 🤖 PROMPT RESMI UNTUK MOBILE DEVELOPER (SIAP COPY-PASTE)

Gunakan prompt berikut untuk menginstruksikan Agen AI / Mobile Developer Flutter agar mengeksekusi backlog perbaikan pada sisi aplikasi mobile:

```markdown
# 🚀 PROMPT EKSEKUSI MOBILE DEVELOPER FLUTTER: REVISI RIWAYAT PRESENSI TIDAK MEMENUHI & TRANSPARANSI DURASI

Halo Mobile Developer,

Master Backend Developer telah menyelesaikan penyelarasan endpoint backend pada branch `development` (Commit `0267d8338`). Endpoint `GET /timesheet/summary` dan `GET /laporan-presensi?status=HADIR_TIDAK_MEMENUHI` kini telah sinkron 100% mengembalikan data yang identik (7 sesi).

Tolong segera eksekusi backlog perbaikan pada sisi aplikasi Flutter (`mobile/`) dengan rincian berikut:

---

### 🎯 1. Target File & Komponen
1. `mobile/lib/app/modules/mahasiswa/controllers/riwayat_tidak_memenuhi_controller.dart`
2. `mobile/lib/app/modules/mahasiswa/views/riwayat_tidak_memenuhi_view.dart`
3. `mobile/lib/app/modules/mahasiswa/views/mahasiswa_view.dart` (jika ada sinkronisasi navigasi/kartu statistik)

---

### 📋 2. Rincian Task & Spesifikasi Kode

#### Task MBL-QC-01: Penyatuan Sumber Data (SSOT) ke Timesheet Summary & Laporan Presensi
* Pada `riwayat_tidak_memenuhi_controller.dart`:
  * Jadikan data `timesheetSummary` (khususnya sesi dari `student['sessions']` di mana `isTargetMet == false && !isAlpa && !isApprovedLeave`) sebagai sumber utama (atau fallback yang sepenuhnya selaras).
  * Backend `/laporan-presensi?status=HADIR_TIDAK_MEMENUHI` kini juga telah mengembalikan 7 sesi (termasuk sesi historis 237 menit).
  * Pastikan variabel counter di halaman riwayat (`totalTidakMemenuhi`) menampilkan angka **7**, persis sama dengan angka pada kartu Beranda Mahasiswa.

#### Task MBL-QC-02: Preservasi Filter Tanggal Lokal
* Pastikan dropdown/chip filter tanggal (`Semua`, `Hari Ini`, `7 Hari Terakhir`, `30 Hari Terakhir`) tetap berfungsi secara reaktif untuk memfilter daftar sesi tidak memenuhi yang ditampilkan di layar.

#### Task MBL-QC-03: Penyempurnaan UI Kartu Riwayat (Resolusi Paradoks 13:28 - 20:00 WIB)
* Buka `riwayat_tidak_memenuhi_view.dart` pada kartu item sesi:
  * **Ubah Label Durasi**: Jangan hanya menulis "Durasi: 3 Jam 57 Menit" di sebelah jam check-in/out.
  * **Gunakan Label Eksplisit**: Tuliskan **"Durasi Efektif di Posko: 3 Jam 57 Menit"**.
  * **Tambahkan Badge / Baris Edukatif**:
    * Jam Masuk: `13:28 WIB` • Jam Pulang: `20:00 WIB` (Rentang: 6 Jam 32 Menit).
    * Di Luar Zona / Jeda: `2 Jam 35 Menit` (baca dari `durasiJedaFormatted` atau kalkulasi selisih rentang dengan durasi efektif).
    * Tampilkan status badge: `⚠️ Kurang 3 Menit dari Target (Target: 4 Jam)`.
  * Dengan tampilan ini, Tim QC dan mahasiswa dapat melihat langsung mengapa sesi tersebut berstatus "Hadir & Tidak Memenuhi" tanpa mengira terjadi bug matematika jam.

#### Task MBL-QC-04: Quality Gate & Static Analysis
* Jalankan verifikasi kode:
  ```bash
  flutter analyze
  ```
  Pastikan **0 errors** dan kompilasi bersih sebelum melakukan commit.

---

### 🛡️ Aturan Perlindungan Berseka Flow Guard:
1. Dilarang keras menyisipkan dummy fallback palsu (`dummySessions` / hardcoded mock data).
2. Jangan merusak flow navigasi yang sudah berjalan mulus di Beranda.
3. Kerjakan pada branch feature/fix (misal: `fix/riwayat-presensi-tidak-memenuhi-ux`).

Mohon konfirmasi dan laporkan setelah eksekusi selesai beserta screenshot/ringkasan hasil pengujian!
```

---

## 5. 📌 KESIMPULAN

* **Backend:** Selesai, teruji, dan telah di-merge ke branch `development` monorepo.
* **Mobile:** Siap dieksekusi oleh Tim Mobile Developer menggunakan panduan prompt di atas.
* **QC:** Alur data telah terdokumentasi dan siap diverifikasi ulang di lingkungan pengujian.
