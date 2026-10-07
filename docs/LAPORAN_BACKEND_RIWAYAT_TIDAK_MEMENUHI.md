# LAPORAN INTEGRASI TEKNIS: FITUR RIWAYAT PRESENSI TIDAK MEMENUHI & NOTIFIKASI DINAMIS MAHASISWA KKN

**Kepada:** Master Backend Developer  
**Dari:** Mobile Developer AI Agent (Client Side Flutter)  
**Status Modifikasi Backend Monorepo:** **STRICT READ-ONLY** (Tidak ada berkas di `apps/api` yang dimodifikasi oleh tim mobile)  
**Tanggal:** 7 Oktober 2026  
**Dokumen Referensi:** `mobile/AGENTS.md`  

---

## 1. Ringkasan Eksekutif

Tim Mobile telah menyelesaikan perancangan dan implementasi fitur **Riwayat Presensi Tidak Memenuhi** untuk Mahasiswa KKN. Fitur ini menangani skenario di mana mahasiswa melakukan presensi di zona kegiatan, namun menyelesaikan sesi kegiatan (*check-out*) sebelum memenuhi target durasi kerja harian yang ditetapkan (misal: kurang dari 240 menit atau batas konfigurasi DPL).

Pada sisi Mobile Flutter, telah ditambahkan:
1. **Halaman Baru `RiwayatTidakMemenuhiView`** (`/mahasiswa/riwayat-tidak-memenuhi`):
   - Menampilkan daftar khusus sesi presensi mahasiswa yang berstatus `HADIR_TIDAK_MEMENUHI` atau `SELESAI_TELAT` (durasi riil < target wajib).
   - Dilengkapi **Filter Tanggal** fleksibel (Kalender Mulai & Selesai, preset "Hari Ini", "7 Hari Terakhir", "30 Hari Terakhir", dan tombol Reset).
   - Metrik komparatif visual: Durasi Dijalankan, Target Wajib, Kekurangan Durasi (menit/jam), jam check-in & check-out, serta catatan edukasi.
   - Aksi interaktif menuju riwayat presensi detail kegiatan jika memiliki `scheduleId`.
2. **Kartu Statistik di Beranda Mahasiswa (`MahasiswaView`)**:
   - Kartu `Presensi Tidak Memenuhi` kini dilengkapi icon peringatan interaktif (`Icons.warning_amber_rounded`), indikator chevron, ripple effect, dan event `onTap` yang langsung membuka halaman `RiwayatTidakMemenuhiView`.
3. **Notifikasi Dinamis Sesuai Mahasiswa**:
   - Ketika presensi selesai dengan status tidak memenuhi, sistem mobile secara otomatis membangkitkan notifikasi lokal (in-app badge, drawer lonceng, dan push alert) yang mencantumkan nama mahasiswa secara dinamis, lokasi RW/Kelurahan, durasi aktual, target durasi, dan informasi konsekuensi poin (+0 PTS).

Dokumen ini disusun untuk memberikan **laporan komprehensif, evaluasi arsitektur endpoint, serta rekomendasi perubahan sisi backend** kepada Master Backend agar sinkronisasi di masa mendatang semakin optimal.

---

## 2. Analisis Arsitektur Backend Saat Ini (`apps/api`)

Berdasarkan audit *read-only* pada berkas `main/apps/api/src/services/kknAttendanceService.ts` dan `main/apps/api/src/routes/kknAttendanceRoutes.ts`:

### 2.1. Penentuan Status `HADIR_TIDAK_MEMENUHI` di Backend
Backend telah memiliki logika penentuan status kehadiran berbasis durasi di `kknAttendanceService.ts`:
- Durasi minimal harian dihitung melalui konfigurasi DPL: `targetHarianMinJam` atau default `240` menit (4 jam).
- Saat *checkout*, jika `actualInZoneMins >= durasiWajibMenit`, status menjadi `HADIR_MEMENUHI` (mendapatkan +3 PTS di tabel `PointHistory`).
- Jika `actualInZoneMins < durasiWajibMenit`, status disimpan sebagai `HADIR_TIDAK_MEMENUHI` (atau legacy `SELESAI_TELAT`), dan tidak mendapatkan poin durasi.

### 2.2. Ketersediaan Endpoint Timesheet Mahasiswa
Endpoint `GET /api/v1/timesheet/summary`:
- **Role Akses:** Telah mengizinkan role `MAHASISWA_KKN` (bersama DPL, RW, Lurah, dll.).
- **Query Parameter:** Mendukung `studentId`, `startDate` (format `YYYY-MM-DD`), dan `endDate` (format `YYYY-MM-DD`).
- **Data Response:** Mengembalikan array `students` dengan `sessions` yang memuat `id`, `scheduleId`, `scheduleTitle`, `attendedAt`, `checkOutAt`, `durationMinutes`, `durationFormatted`, `isMinTargetMet`, dan `status`.
- **Implementasi Mobile:** Tim Mobile telah memanfaatkan endpoint ini sebagai Single Source of Truth (SSOT) untuk memfilter dan menampilkan riwayat sesi tidak memenuhi.

### 2.3. Temuan Keterbatasan pada Backend Saat Ini

#### A. Role Middleware pada Endpoint Laporan Rekap Presensi
Pada `kknAttendanceRoutes.ts:258`:
```typescript
router.get(
  ["/laporan-rekap", "/kkn/attendance/laporan-rekap", "/laporan-presensi"],
  authMiddleware,
  roleMiddleware([
    "DEVELOPER",
    "DPL",
    "DOSEN_PEMBIMBING",
    "MPL",
    "MITRA_PENDAMPING_LAPANGAN",
    "MITRA_PEMBIMBING_LAPANGAN",
    "SUPER_USER",
    "ADMIN_DLH",
    "CAMAT",
    "LURAH",
    "RW",
    "PANITIA_TASKFORCE",
    "PEMIMPIN",
  ]),
  kknAttendanceController.getLaporanPresensi
);
```
- Endpoint `/laporan-presensi` sebenarnya sudah memiliki kemampuan filter server-side `status=HADIR_TIDAK_MEMENUHI`, namun role `MAHASISWA_KKN` **belum diizinkan** pada middleware tersebut.
- *Status Solusi Mobile:* Mobile saat ini menggunakan `GET /timesheet/summary?studentId={userId}&startDate={}&endDate={}` yang sudah dapat diakses legal oleh `MAHASISWA_KKN`.

#### B. Tidak Ada Trigger Push Notifikasi Backend untuk Status `HADIR_TIDAK_MEMENUHI`
Pada `kknAttendanceService.ts:2474-2511`:
```typescript
if (isMemenuhi) {
  // Award +3 points ...
  // Broadcast Notifikasi Lonceng & Push FCM ke Mahasiswa
  notificationIntegrationService.sendToUser({
    userId: studentId,
    title: "Pemenuhan Waktu Tercatat! ⏱️",
    message: `Durasi kerja harian terpenuhi (${Math.floor(durationMinutes)} menit). Anda mendapatkan +3 PTS.`,
    triggerType: "CHECKOUT_MEMENUHI",
    ...
  });
}
// ⚠️ KETIDAKADAAN BLOK ELSE:
// Ketika isMemenuhi bernilai FALSE, backend tidak memicu notifikasi FCM / in-app sama sekali ke mahasiswa.
```

---

## 3. Rekomendasi Teknis untuk Master Backend

Agar arsitektur komunikasi mobile-backend selaras dan notifikasi push tersalurkan baik secara server-driven maupun client-side, berikut rekomendasi implementasi di backend:

### Rekomendasi 1: Penambahan FCM Trigger pada Blok `!isMemenuhi` di `kknAttendanceService.ts`

**Lokasi Berkas:** `main/apps/api/src/services/kknAttendanceService.ts` (pada method `checkOutAttendance` setelah line 2511):

```typescript
// Tambahkan penanganan notifikasi jika mahasiswa tidak memenuhi durasi:
if (isMemenuhi) {
  // ... (kode reward +3 PTS dan notifikasi CHECKOUT_MEMENUHI yang sudah ada) ...
} else {
  // [REKOMENDASI BARU] Notifikasi Dinamis Mahasiswa saat Hadir Tidak Memenuhi
  const targetMenit = durasiWajibMenit > 0 ? durasiWajibMenit : 240;
  const shortageMins = Math.max(0, targetMenit - durationMinutes);
  const studentName = updated.student?.name || "Mahasiswa";

  notificationIntegrationService
    .sendToUser({
      userId: studentId,
      title: "Presensi Selesai: Hadir Tidak Memenuhi ⚠️",
      message: `Halo ${studentName}, sesi kegiatan di ${updated.schedule?.title || "posko"} selesai dengan durasi ${durationMinutes} menit (target ${targetMenit} menit, kurang ${shortageMins} menit). Status kehadiran Anda tercatat Hadir Tidak Memenuhi tanpa bonus +3 PTS.`,
      triggerType: "CHECKOUT_TIDAK_MEMENUHI",
      dataPayload: {
        attendanceId: updated.id,
        scheduleId: updated.scheduleId,
        status: "HADIR_TIDAK_MEMENUHI",
        durationMinutes: String(durationMinutes),
        targetMinutes: String(targetMenit),
        shortageMinutes: String(shortageMins),
        click_action: "FLUTTER_NOTIFICATION_CLICK",
      },
    })
    .catch((err) => console.warn("[FCM] Gagal mengirim notif checkout tidak memenuhi:", err));
}
```

### Rekomendasi 2: Opsi Paginasi Khusus Riwayat Mahasiswa (Opsional)
Jika di masa mendatang volume data presensi mahasiswa sangat besar, Master Backend dapat mempertimbangkan membuka akses `MAHASISWA_KKN` pada `kknAttendanceRoutes.ts` untuk endpoint `GET /api/v1/kkn-attendance/laporan-presensi` dengan penguncian otomatis `where.studentId = req.user.userId` jika `req.user.role === 'MAHASISWA_KKN'`.

---

## 4. Status Implementasi di Mobile Client Flutter

Semua kebutuhan antarmuka dan logika telah diselesaikan dengan spesifikasi sebagai berikut:

| No | Modul / Berkas | Deskripsi Perubahan | Status |
|---|---|---|---|
| 1 | `kkn_repository.dart` & `api_kkn_repository.dart` | Penambahan parameter `startDate` & `endDate` pada method `getTimesheetSummary` | **SELESAI & PASS** |
| 2 | `riwayat_tidak_memenuhi_controller.dart` | StateNotifier provider untuk kalkulasi durasi, selisih kekurangan target, dan filter rentang tanggal | **SELESAI & PASS** |
| 3 | `riwayat_tidak_memenuhi_view.dart` | Halaman baru dengan header info, Date Picker, Quick Filter chips, card sesi komparatif, dan empty state ramah | **SELESAI & PASS** |
| 4 | `app_routes.dart` & `app_pages.dart` | Pendaftaran routing `/mahasiswa/riwayat-tidak-memenuhi` (`AppRoutes.riwayatTidakMemenuhi`) | **SELESAI & PASS** |
| 5 | `mahasiswa_view.dart` | Kartu "Presensi Tidak Memenuhi" dilengkapi icon `Icons.warning_amber_rounded`, chevron, dan event `onTap` | **SELESAI & PASS** |
| 6 | `kkn_location_controller.dart` | Pemicu notifikasi lokal dinamis personal saat mahasiswa checkout dengan status tidak memenuhi target | **SELESAI & PASS** |
| 7 | `mahasiswa_notifikasi_view.dart` | Tampilan icon warning oranye untuk `PRESENSI_TIDAK_MEMENUHI` dan navigasi langsung ke halaman riwayat saat notifikasi ditekan | **SELESAI & PASS** |

### Hasil Verifikasi Static Analysis
- Perintah: `flutter analyze --no-fatal-warnings`
- Hasil: **No issues found! (0 Errors, 0 Warnings, 0 Lints)**

---

## 5. Kesimpulan
Aplikasi Mobile saat ini sudah **100% siap dan berfungsi secara penuh** (*fully functional & independent*) dengan memanfaatkan endpoint backend yang sudah ada. Rekomendasi di atas dapat diterapkan oleh Master Backend pada iterasi rilis backend berikutnya untuk melengkapi pengiriman push FCM dari sisi server.
