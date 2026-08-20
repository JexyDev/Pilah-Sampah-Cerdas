# Instruksi Perubahan Mobile (Flutter) — Modul 3
## Perbaikan Logika Presensi Mahasiswa KKN

> **IMPORTANT**
> Dokumen ini ditujukan untuk developer mobile (Habil / tim Flutter). Perubahan ini **HARUS** diimplementasikan setelah backend pada branch `main` sudah di-deploy dengan perbaikan Modul 1 dan Modul 2.

---

## Ringkasan Perubahan Backend

Backend telah diperbaiki dengan perubahan fundamental berikut:

| Aspek | Sebelum (Bug) | Sesudah (Fixed) |
|---|---|---|
| Status awal check-in | Langsung `HADIR` | `BERLANGSUNG` lalu baru `HADIR` setelah durasi terpenuhi |
| Durasi yang dihitung | `checkOutAt - attendedAt` (waktu lurus) | Hanya waktu **di dalam zona** (dari log GPS) |
| Auto-attendance | Hanya trigger di dalam zona | Bisa trigger **di luar zona** jika durasi in-zone sudah terpenuhi |
| Toleransi radius | Hardcoded 15 meter | Dinamis dari Rule Engine (`attendance_geofence_buffer_meters`) |
| Checkout dengan durasi kurang | Status `SELESAI` | Status `SELESAI_TELAT` + durasi aktual tercatat |
| Invalidasi kehadiran | Langsung `LEPAS_RADIUS` tanpa peringatan | Kirim **notifikasi peringatan** ke mahasiswa + `LEPAS_RADIUS` |

---

## 1. Penanganan Status Baru di UI

### Status yang harus dikenali mobile:

```
BERLANGSUNG    -> Sesi sedang berjalan, belum dinyatakan hadir (badge kuning/oranye)
HADIR          -> Durasi minimal terpenuhi, tercatat hadir (badge hijau)
SELESAI        -> Sesi ditutup, durasi terpenuhi (badge biru)
SELESAI_TELAT  -> Sesi ditutup, TETAPI durasi minimal BELUM terpenuhi (badge merah/oranye)
LEPAS_RADIUS   -> Kehadiran digagalkan karena keluar zona terlalu lama (badge merah)
ALPA           -> Tidak hadir tanpa keterangan (badge abu-abu)
```

### Perubahan UI yang diperlukan:
- **Halaman Riwayat Kehadiran**: Tampilkan status `SELESAI_TELAT` dengan warna berbeda (misal merah/oranye) dan label "Selesai (Durasi Kurang)".
- **Badge Status di Halaman Kegiatan Aktif**: 
  - `BERLANGSUNG` -> Timer icon "Sedang Berlangsung" (kuning)  
  - `HADIR` -> Checkmark "Hadir" (hijau)
- **Halaman Detail Kegiatan**: Tampilkan **durasi aktual in-zone** (bukan durasi mentah).

---

## 2. Freeze Durasi di Luar Zona (Client-Side Timer)

### Logika baru yang WAJIB diimplementasikan:

```dart
// Pseudocode — Foreground Service GPS Tracking
void onLocationUpdate(Position position) {
  final isInside = checkGeofence(position, scheduleGeofence);
  
  if (isInside) {
    // RESUME timer — durasi aktual bertambah
    _inZoneTimer.resume();
    _outOfZoneStartTime = null;
  } else {
    // PAUSE/FREEZE timer — durasi aktual TIDAK bertambah
    _inZoneTimer.pause();
    
    // Track berapa lama di luar zona (untuk peringatan lokal)
    _outOfZoneStartTime ??= DateTime.now();
    final outMinutes = DateTime.now().difference(_outOfZoneStartTime!).inMinutes;
    
    // Peringatan lokal jika mendekati batas invalidasi
    if (outMinutes >= (_invalidationHours * 60 * 0.8).round()) {
      showLocalNotification(
        title: "Peringatan Zona Kegiatan",
        body: "Anda di luar area kegiatan selama $outMinutes menit. "
              "Kembali ke zona sebelum kehadiran digagalkan.",
      );
    }
  }
  
  // Kirim ping ke backend (dengan info outOfZoneMinutes)
  apiService.pingLocation(
    latitude: position.latitude,
    longitude: position.longitude,
    outOfZoneMinutes: _outOfZoneStartTime != null 
      ? DateTime.now().difference(_outOfZoneStartTime!).inMinutes 
      : 0,
  );
}
```

### Aturan penting:
1. **Timer durasi hanya berjalan saat device BERADA di dalam zona geofence.**
2. **Timer di-FREEZE saat device keluar zona.** Timer TIDAK di-reset, hanya di-pause.
3. **Timer di-RESUME saat device kembali ke dalam zona.**
4. Tampilkan di UI: "Durasi di zona: XX menit / YY menit (target)".

---

## 3. Sinkronisasi Response API Baru

### Response `POST /api/v1/kkn/kegiatan/:id/mulai` — field baru:

```json
{
  "sessionId": "SES-xxx",
  "scheduleId": "...",
  "namaKegiatan": "Sosialisasi Pemilahan Sampah",
  "durasiWajibMenit": 120,
  "lokasi": {
    "alamat": "Kelurahan Dago, RW 08",
    "latitude": -6.8906,
    "longitude": 107.615,
    "radiusMeter": 150,
    "polygon": null
  },
  "geofenceBufferMeters": 15,
  "invalidationHours": 2,
  "serverTimestamp": "2026-08-20T08:00:00.000Z"
}
```

> **IMPORTANT:** Field baru `geofenceBufferMeters` dan `invalidationHours` akan dikirim oleh backend setelah Modul 1 ter-deploy. Mobile **HARUS** menyimpan nilai ini dan menggunakannya untuk konfigurasi foreground service GPS dan perhitungan geofence lokal.

### Response `POST /api/v1/kkn/kegiatan/:id/selesai` — field baru:

```json
{
  "success": true,
  "data": {
    "attendanceId": "...",
    "status": "SELESAI_TELAT",
    "durationMinutes": 85,
    "durationFormatted": "1 Jam 25 Menit",
    "actualInZoneMinutes": 85
  }
}
```

---

## 4. Notifikasi Peringatan Invalidasi (dari Backend)

Backend sekarang akan mengirim notifikasi ke tabel `Notification` ketika cron job mendeteksi mahasiswa di luar zona terlalu lama. Mobile harus:

1. **Poll notifikasi** secara berkala (jika belum ada WebSocket listener).
2. Ketika menerima notifikasi dengan title yang mengandung "Peringatan Kehadiran", tampilkan sebagai **persistent notification** di system tray.
3. **Suara/vibrate** untuk menarik perhatian mahasiswa.

---

## 5. Checklist Implementasi Mobile

```
[ ] Kenali dan handle status "BERLANGSUNG" di semua halaman
[ ] Kenali dan handle status "SELESAI_TELAT" di halaman riwayat
[ ] Implementasi freeze/resume timer berdasarkan posisi geofence
[ ] Tampilkan "Durasi di zona: XX / YY menit" di UI tracking
[ ] Parsing field baru geofenceBufferMeters dan invalidationHours dari response mulaiKegiatan
[ ] Gunakan geofenceBufferMeters untuk perhitungan geofence lokal
[ ] Tambahkan local notification peringatan saat mendekati batas invalidasi
[ ] Handle notifikasi backend "Peringatan Kehadiran KKN"
[ ] Pastikan flutter analyze -> 0 error setelah perubahan
```
