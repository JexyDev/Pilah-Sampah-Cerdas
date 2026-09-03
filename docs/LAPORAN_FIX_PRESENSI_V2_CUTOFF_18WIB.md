# Laporan Forensik, Alur Desain, dan Panduan QC: Perbaikan Presensi KKN v2 (Hold s.d. 18:00 WIB & Auto-Checkout Hadir)

---

## 1. Latar Belakang Permasalahan

Pada sistem presensi KKN v2 (LOSS MODE), jadwal kegiatan standar mahasiswa disetel oleh sistem dari pukul **08:00 WIB sampai 16:00 WIB**. Namun di lapangan ditemukan masalah kritis:
- Mahasiswa telah hadir dan memulai kegiatan di pagi hari (status presensi `BERLANGSUNG` / `DI_ZONA` / `DALAM_RADIUS`).
- Karena aktivitas di lapangan seringkali berlanjut hingga sore atau mahasiswa belum sempat/lupa menekan tombol **"Selesai"** tepat di jam 16:00 WIB, sistem tiba-tiba langsung **memotong status kehadiran mahasiswa menjadi `ALPHA` (Tanpa Keterangan)**.
- Hal ini menimbulkan komplain massal dari mahasiswa dan DPL karena mahasiswa yang aktif berkeringat di lapangan justru tercatat tidak hadir.

---

## 2. Analisis Forensik & Akar Masalah (Root Cause Analysis)

Setelah dilakukan audit mendalam pada codebase, ditemukan dua kelemahan fatal dalam arsitektur logika:

### A. Anti-Pattern: Query Endpoint Melakukan Mutasi Paksa (Side-Effect Mutation)
- **Lokasi Kode:** `apps/api/src/services/kknService.ts` method `getActiveZone()` (baris 3009–3059).
- **Mekanisme Bug:**
  Endpoint `GET /api/v1/kkn/active-zone` adalah endpoint pembacaan (read query) yang dipanggil secara berkala oleh aplikasi mobile mahasiswa.
  Di dalamnya terdapat kode legacy berikut:
  ```typescript
  // Cek apakah waktu melebihi jam selesai jadwal (16:00:59 WIB)
  const endDateObj = new Date(`${yyyy}-${mm}-${dd}T${hh}:${m}:59+07:00`);
  if (new Date() > endDateObj) {
    isExpired = true;
  }

  // JIKA EXPIRED, PAKSA UBAH KE ALPA DI DATABASE!
  if (isExpired && (attendanceStatus === "belum_absen" || attendanceStatus === "berlangsung" || ...)) {
    attendanceStatus = "alpa";
    if (attendanceForActiveSchedule && (attendanceForActiveSchedule.status === "BERLANGSUNG" || ...)) {
      await prisma.activityAttendance.update({
        where: { id: attendanceForActiveSchedule.id },
        data: { status: "ALPA" }, // <--- FATAL: MEMUTASI KE ALPA PADA JAM 16:01
      });
    }
  }
  ```
- **Dampak Fatal:** Begitu jarum jam menunjukkan pukul **16:00:01 WIB**, setiap kali aplikasi mobile melakukan refresh atau polling, query ini **langsung mengeksekusi `UPDATE` ke database dan menghancurkan status presensi mahasiswa menjadi `ALPA`**, mengabaikan fakta bahwa mahasiswa tersebut sudah check-in dan bertugas selama berjam-jam.

### B. Cut-off Auto-Checkout Terlalu Larut (23:50 WIB)
- **Lokasi Kode:** `apps/api/src/services/kknAttendanceService.ts` method `autoCheckOutEndedSchedules()`.
- **Mekanisme:** Cut-off cron hanya dipasang pada `23:50 WIB` (`currentMins >= 23 * 60 + 50`).
- **Dampak:** Sistem tidak memiliki mekanisme penutupan otomatis pada batas maksimal sore hari (18:00 WIB), sehingga sesi dibiarkan mengambang hingga larut malam.

---

## 3. Alur Resmi Presensi KKN v2 yang Benar (Target Business Flow)

Untuk mengakomodasi fleksibilitas di lapangan tanpa membuka celah kecurangan yang berlebihan, alur presensi distandarisasi sebagai berikut:

```
08:00 WIB                   16:00 WIB                      18:00 WIB                 23:55 WIB
   |                           |                              |                         |
   +--- Jam Mulai Standar ---->+--- Hold Fleksibel Lapangan ->+--- Batas Maksimal Sore -+--- Evaluasi Malam ---+
   |    (Mulai Kegiatan)       |    (Mahasiswa tetap aktif)   |    (Auto-Checkout HADIR) |    (Cron Auto-Alpha)  |
   |    Status: BERLANGSUNG    |    Bebas checkout manual     |    Status: HADIR_MEMENUHI|    (Khusus yg kosong) |
   |    Timer berjalan         |    TIDAK BOLEH ALPHA         |    Durasi >= 240 menit   |    Tdk ada absen/izin/|
   |                           |                              |    Jam pulang tercatat   |    logbook -> ALPA    |
```

### Detail Tahapan:
1. **Pukul 08:00 – 16:00 WIB (Window Operasional Utama):**
   - Mahasiswa melakukan check-in via tombol "Mulai Kegiatan" saat berada di radius posko/zona.
   - Status: `BERLANGSUNG` (atau `TERJEDA` jika istirahat manual). Timer berjalan.
2. **Pukul 16:00 – 18:00 WIB (Periode Hold Fleksibilitas Lapangan):**
   - Meskipun jadwal nominal tertulis `08:00 - 16:00`, presensi **TIDAK DIHENTIKAN** dan **SAMA SEKALI TIDAK BOLEH DICAP ALPA**.
   - Mahasiswa tetap berstatus `BERLANGSUNG`.
   - Mahasiswa bebas menyelesaikan kegiatan kapan saja dengan menekan tombol **"Selesai"** manual.
3. **Pukul 18:00 WIB (Batas Maksimal Toleransi Sore):**
   - Pukul 18:00 WIB adalah batas mutlak kegiatan sore hari.
   - Jika mahasiswa lupa/tidak menekan tombol selesai hingga jam 18:00 WIB, **sistem presensi secara otomatis menyelesaikan sesi presensi (Auto-Checkout)**.
   - Status akhir dipastikan tercatat sebagai **`HADIR_MEMENUHI` (HADIR)** dengan durasi kerja terkunci minimal target harian (240 menit).
   - Sistem mengirim notifikasi in-app dan push FCM: *"Kegiatan Selesai Otomatis (Hadir) ✅"*.
4. **Pukul 23:55 WIB (Evaluasi Tanpa Keterangan / Cron Auto-Alpha):**
   - Hanya menyasar mahasiswa yang pada hari kerja tersebut **SAMA SEKALI TIDAK MEMILIKI:**
     1. Record check-in presensi apapun,
     2. Pengajuan izin / sakit yang disetujui, dan
     3. Pengisian logbook harian.
   - Mahasiswa yang sudah presensi di pagi hari dan diselesaikan otomatis di jam 18:00 WIB **kebal / dibypass 100% dari auto-alpha malam**.

---

## 4. Rincian Implementasi Teknis

### A. Perbaikan `kknService.ts`
- Menghapus total blok mutasi `data: { status: "ALPA" }` dari method `getActiveZone`.
- Menambahkan pemeriksaan batas 18:00 WIB: jika `getActiveZone` dipanggil setelah jam 18:00 WIB pada sesi yang masih aktif, fungsi langsung memanggil `kknAttendanceService.checkOutAttendance({ isAutoCheckout: true })` untuk menutup sesi sebagai `HADIR_MEMENUHI`.
- Query `runningSession` diperluas mencakup `BERLANGSUNG`, `DI_ZONA`, `DALAM_RADIUS`, dan `TERJEDA`.

### B. Perbaikan `kknAttendanceService.ts`
- **`autoCheckOutEndedSchedules()`**:
  - Mengubah cut-off waktu dari `23:50 WIB` menjadi `Math.max(18 * 60, endMins)` (18:00 WIB untuk jadwal daytime standar).
  - Menyerahkan parameter `isAutoCheckout: true` saat memanggil `checkOutAttendance()`.
  - Memberikan notifikasi push FCM dan in-app database dengan pesan jelas bahwa kegiatan selesai otomatis dan status tercatat Hadir.
- **`checkOutAttendance()`**:
  - Menambahkan parameter `isAutoCheckout?: boolean` dan `checkOutTime?: Date`.
  - Menjamin bahwa jika diselesaikan otomatis (`isAutoCheckout = true`), `actualInZoneMins` diatur ke `Math.max(actualInZoneMins, minTarget, 240)` sehingga `checkoutFinalStatus` terkunci menjadi **`HADIR_MEMENUHI`**.

### C. Script Pemulihan Data (`repair_today_attendance_alpha.ts`)
- Dibuat script `apps/api/src/scripts/repair_today_attendance_alpha.ts` untuk memindai database hari ini dan memulihkan record mahasiswa yang sempat terpotong menjadi ALPA padahal memiliki catatan check-in atau jejak lokasi GPS.

---

## 5. Panduan Quality Control (QC) & Checklist Anti-Regresi

Agar kegagalan logika seperti ini tidak terulang kembali di masa depan, seluruh tim pengembang (Backend, Mobile, QA) wajib mematuhi aturan baku berikut:

### Aturan Arsitektur (Golden Rules):
1. **Prinsip Read-Only pada GET / Query Endpoints (Idempotency):**
   - **DILARANG KERAS** menyisipkan mutasi database (seperti mengubah status mahasiswa menjadi `ALPA`, `EXPIRED`, `BATAL`, dsb.) di dalam fungsi pembacaan data (`GET /active-zone`, `GET /status`, `GET /kegiatan`).
   - Endpoint query harus murni merefleksikan state saat ini tanpa mengubah state secara impulsif.
2. **Sentralisasi State Transition pada Scheduler / Service Resmi:**
   - Segala perubahan status yang dipicu oleh berjalannya waktu (time-based lifecycle) **HANYA BOLEH DIKELOLA OLEH CRON SERVICE** (`cronService.ts`) atau worker antrean terpusat.
3. **Pemisahan Antara "Tidak Absen" vs "Sesi Berjalan":**
   - Mahasiswa yang sudah menekan "Mulai" (`attendedAt != null`) **TIDAK PERNAH BOLEH DI-ALPA-KAN**.
   - Pelanggaran lupa klik selesai harus di-checkout otomatis sebagai Hadir (atau status verifikasi DPL), bukan di-cap tidak hadir.

### Checklist Pengujian QC (Manual & Automated):
| No | Skenario Pengujian | Waktu Simulasi | Ekspektasi Hasil | Status |
|---|---|---|---|---|
| 1 | Mahasiswa mulai kegiatan di pagi hari, belum klik selesai sampai jam 15:59 WIB | 15:59 WIB | Status tetap `BERLANGSUNG`, timer jalan | PASS |
| 2 | Waktu melewati jam selesai jadwal (16:01 WIB), mahasiswa belum klik selesai | 16:01 WIB | Status tetap `BERLANGSUNG`, **TIDAK BERUBAH KE ALPA** | PASS |
| 3 | Mahasiswa berada di lapangan jam 17:30 WIB dan menekan tombol "Selesai" manual | 17:30 WIB | Checkout berhasil manual, status `HADIR_MEMENUHI` | PASS |
| 4 | Jam 18:00 WIB tiba, mahasiswa lupa klik selesai | 18:00:01 WIB | Cron menjalankan auto-checkout, status menjadi `HADIR_MEMENUHI` | PASS |
| 5 | Mahasiswa membuka aplikasi mobile pada pukul 18:30 WIB | 18:30 WIB | Status tampil "Hadir & Memenuhi", tombol selesai dinonaktifkan | PASS |
| 6 | Mahasiswa yang sama sekali tidak pernah check-in dievaluasi cron malam | 23:55 WIB | Baru pada tahap ini ditandai sebagai `ALPA` jika tidak ada izin/logbook | PASS |

---

## 6. Hasil Verifikasi Otomatis
- **Unit Test File:** `apps/api/src/services/kknActiveZone.test.ts` (3/3 passed).
- **Unit Test File:** `apps/api/src/services/kknAttendanceService.test.ts` (suite auto-checkout & duration passed).
- **TypeScript Static Analysis:** `npx tsc --noEmit` **0 Errors / 100% Clean**.
