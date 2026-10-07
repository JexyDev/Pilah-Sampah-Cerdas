# LAPORAN INTEGRASI RESMI BACKEND KEPADA TIM MOBILE FLUTTER
## PENYELARASAN FITUR RIWAYAT PRESENSI TIDAK MEMENUHI & NOTIFIKASI DINAMIS SERVER-DRIVEN

**Kepada:** Mobile Developer AI Agent & Tim Mobile Flutter Berseka  
**Dari:** Master Backend Developer (Main Monorepo)  
**Status Implementasi:** **SELESAI, TERVERIFIKASI & PASS 100% (READY FOR STAGING/PROD)**  
**Tanggal:** 7 Oktober 2026  
**Dokumen Referensi:** `mobile/AGENTS.md`, `AGENTS.md`, `GEMINI.md`  

---

## 1. Ringkasan Eksekutif

Menindaklanjuti *Laporan Integrasi Teknis* yang disampaikan oleh Tim Mobile mengenai fitur **Riwayat Presensi Tidak Memenuhi & Notifikasi Dinamis Mahasiswa KKN**, tim Backend Monorepo telah menyelesaikan seluruh rekomendasi teknis yang diajukan.

Modifikasi difokuskan pada:
1. **Server-Driven Push Notification (FCM) & Dynamic Bell Notification**:
   - Backend kini secara otomatis mengeksekusi pengiriman push notifikasi FCM dan notifikasi in-app lonceng ketika mahasiswa melakukan *check-out* dengan durasi kerja yang belum memenuhi target harian (`HADIR_TIDAK_MEMENUHI`).
   - Konten notifikasi dipersonalisasi secara dinamis (mencakup nama mahasiswa, judul kegiatan/posko, durasi tercatat, durasi target, selisih kekurangan durasi, dan penjelasan bahwa mahasiswa tidak memperoleh bonus +3 PTS).
2. **Pembukaan Akses Resmi Mahasiswa pada Endpoint Laporan Presensi (`/laporan-presensi`)**:
   - Role `MAHASISWA_KKN` telah didaftarkan secara sah pada middleware rute `GET /api/v1/kkn-attendance/laporan-presensi`.
   - Diterapkan mekanisme proteksi **Strict Scoping Otomatis** pada level controller: jika request berasal dari user dengan role `MAHASISWA_KKN`, backend secara mutlak mengunci parameter `studentId` ke ID akun mahasiswa yang login (`req.user.userId`). Hal ini mencegah kebocoran data antar-mahasiswa (*data isolation guarantee*).
3. **Penyediaan Server-side Pagination & Filter**:
   - Tim mobile kini memiliki opsi menggunakan endpoint laporan presensi dengan filter `status=HADIR_TIDAK_MEMENUHI`, filter rentang tanggal `startDate` dan `endDate`, serta paginasi server (`page` dan `limit`).

---

## 2. Rincian Pembaruan Sisi Backend (`apps/api`)

### 2.1. Pemicu Notifikasi Dinamis Saat Checkout Kurang dari Target
**Berkas:** `main/apps/api/src/services/kknAttendanceService.ts`

Pada method `checkOutAttendance`, blok evaluasi status pemenuhan target waktu kini menangani kondisi `!isMemenuhi` sebagai berikut:

```typescript
if (isMemenuhi) {
  // Poin +3 PTS dan notifikasi CHECKOUT_MEMENUHI yang sudah ada
  // ...
} else {
  // Broadcast Notifikasi Lonceng & Push FCM ke Mahasiswa saat Hadir Tidak Memenuhi Target
  const targetMenit = durasiWajibMenit > 0 ? durasiWajibMenit : 240;
  const shortageMins = Math.max(0, targetMenit - Math.floor(durationMinutes));
  const studentName = updated.student?.name || "Mahasiswa";

  notificationIntegrationService
    .sendToUser({
      userId: studentId,
      title: "Presensi Selesai: Hadir Tidak Memenuhi ⚠️",
      message: `Halo ${studentName}, sesi kegiatan di ${updated.schedule?.title || "posko"} selesai dengan durasi ${Math.floor(durationMinutes)} menit (target ${targetMenit} menit, kurang ${shortageMins} menit). Status kehadiran Anda tercatat Hadir Tidak Memenuhi tanpa bonus +3 PTS.`,
      triggerType: "CHECKOUT_TIDAK_MEMENUHI",
      dataPayload: {
        attendanceId: updated.id,
        scheduleId: updated.scheduleId,
        status: "HADIR_TIDAK_MEMENUHI",
        durationMinutes: String(Math.floor(durationMinutes)),
        targetMinutes: String(targetMenit),
        shortageMinutes: String(shortageMins),
        click_action: "FLUTTER_NOTIFICATION_CLICK",
      },
    })
    .catch((err) =>
      console.warn("[FCM] Gagal mengirim notif checkout tidak memenuhi:", err)
    );
}
```

#### Struktur Payload FCM Data yang Diterima Mobile:
```json
{
  "title": "Presensi Selesai: Hadir Tidak Memenuhi ⚠️",
  "body": "Halo Septian, sesi kegiatan di Posko Kelompok 4 selesai dengan durasi 185 menit (target 240 menit, kurang 55 menit). Status kehadiran Anda tercatat Hadir Tidak Memenuhi tanpa bonus +3 PTS.",
  "data": {
    "attendanceId": "att-uuid-xyz",
    "scheduleId": "sch-uuid-abc",
    "status": "HADIR_TIDAK_MEMENUHI",
    "durationMinutes": "185",
    "targetMinutes": "240",
    "shortageMinutes": "55",
    "click_action": "FLUTTER_NOTIFICATION_CLICK"
  }
}
```

---

### 2.2. Otorisasi & Scoping Endpoint `/laporan-presensi`

**Berkas Rute:** `main/apps/api/src/routes/kknAttendanceRoutes.ts`  
Role `MAHASISWA_KKN` telah ditambahkan ke `roleMiddleware`:

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
    "MAHASISWA_KKN", // Role Mahasiswa KKN diaktifkan
  ]),
  kknAttendanceController.getLaporanPresensi
);
```

**Berkas Controller:** `main/apps/api/src/controllers/kknAttendanceController.ts`  
Penegakan *Strict Scoping* untuk `MAHASISWA_KKN`:

```typescript
const isMahasiswa = roleName === "MAHASISWA_KKN";
const studentId = isMahasiswa
  ? currentUserId
  : (req.query.studentId as string | undefined);

const result = await kknAttendanceService.getLaporanPresensi({
  kelompokId,
  studentId, // Dikunci ke req.user.userId
  kelurahan,
  rw,
  dplUserId,
  mplUserId,
  startDate,
  endDate,
  status,
  search,
  page,
  limit,
  includeTestAccounts,
});
```

---

## 3. Panduan Integrasi untuk Tim Mobile Flutter

Tim mobile kini memiliki dua opsi konsumsi data yang fleksibel:

### Opsi A: Menggunakan Endpoint Timesheet Summary (Sudah Aktif di Mobile)
- **Endpoint:** `GET /api/v1/timesheet/summary?studentId={userId}&startDate={YYYY-MM-DD}&endDate={YYYY-MM-DD}`
- **Karakteristik:** Menghasilkan rekapitulasi total jam dan array `sessions` untuk di-filter di sisi client (*client-side aggregation*).

### Opsi B: Menggunakan Endpoint Laporan Presensi (Fitur Baru untuk Server-side Filtering & Paginasi)
- **Endpoint:** `GET /api/v1/kkn-attendance/laporan-presensi`
- **Header:** `Authorization: Bearer <token_mahasiswa>`
- **Query Parameter yang Didukung:**
  - `status=HADIR_TIDAK_MEMENUHI` (Otomatis mencakup legacy status `SELESAI_TELAT`).
  - `startDate=YYYY-MM-DD`
  - `endDate=YYYY-MM-DD`
  - `page=1`
  - `limit=20`
- **Keunggulan Opsi B:**
  - Mahasiswa **tidak perlu mengirim `studentId`**, server otomatis membaca dari token otentikasi.
  - Sudah mendukung paginasi data server (`total`, `page`, `limit`, `totalPages`).
  - Mengembalikan objek detail komparatif langsung: `durasiMenit`, `targetMinMenit`, `rasioKehadiran`, `durasiJedaMenit`, dan label edukatif `statusDisplay`.

Contoh Pemanggilan via Dio / Http Client Flutter:
```dart
final response = await apiClient.get(
  '/api/v1/kkn-attendance/laporan-presensi',
  queryParameters: {
    'status': 'HADIR_TIDAK_MEMENUHI',
    if (startDate != null) 'startDate': startDate,
    if (endDate != null) 'endDate': endDate,
    'page': page,
    'limit': limit,
  },
);
```

---

## 4. Quality Gate & Hasil Verifikasi Teknis

Sesuai dengan standar **Berseka Flow Guard** dan aturan perlindungan role DPL:

| No | Pengujian | Perintah Eksekusi | Status | Keterangan |
|---|---|---|---|---|
| 1 | Test Suite Attendance & Scoping | `npx vitest run apps/api/src/services/kknAttendanceService.test.ts` | **PASS (62/62 Tests)** | Termasuk pengujian filter `studentId` individual presensi |
| 2 | Test Suite Paten Role DPL | `npx vitest run apps/api/src/controllers/dplApproval.test.ts apps/api/src/services/logbookVerifikasi.test.ts apps/api/src/services/penilaianKknRoleGuard.test.ts` | **PASS (30/30 Tests)** | Zero regression pada hak mutasi & scoping DPL |
| 3 | TypeScript Type Check | `npm run build --prefix apps/api` (`tsc`) | **PASS (Exit Code 0)** | Zero type errors di seluruh modul backend |

---

## 5. Kesimpulan & Langkah Selanjutnya

1. Seluruh kebutuhan backend untuk mendukung fitur **Riwayat Presensi Tidak Memenuhi** dan **Notifikasi Dinamis Mahasiswa KKN** telah selesai 100%.
2. Fitur notifikasi push FCM dari sisi server kini telah aktif berpasangan dengan notifikasi lokal client-side yang telah dibuat oleh tim mobile.
3. Tim mobile dapat langsung melakukan pengujian integrasi end-to-end (*staging environment*) tanpa hambatan otorisasi.
