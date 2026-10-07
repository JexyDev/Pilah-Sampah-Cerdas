# 📄 LAPORAN TEKNIS RESMI & PANDUAN ARSITEKTUR MOBILE: PENANGANAN GPS & PENCEGAHAN ERROR "DI LUAR JANGKAUAN"
## Audit Forensik Kasus Lapangan Warga, Analisis Asynchronous Race Condition, & Spesifikasi Solusi Tim Flutter

**Nomor Dokumen:** `BERSEKA/ENG-REPORT/2026/10/013`  
**Tanggal Rilis:** Rabu, 07 Oktober 2026  
**Kepada:** Habil (Lead Mobile Engineer) & Seluruh Tim Flutter Berseka  
**Dari:** Master Backend Architecture & Core Engineering Team (PT Makerindo Prima Cipta)  
**Perihal:** Panduan Teknis & Arsitektur Penanganan GPS Mobile: Solusi Anti-Regresi Error `LOCATION_OUT_OF_RANGE` / `LOCATION_TOO_FAR` pada Scan Sampah Warga  
**Status Basis Data:** 🟢 **VERIFIED GROUND TRUTH DI POSTGRESQL VPS PRODUKSI (`157.10.252.252:5432` / `psc_db`)**  
**Tingkat Urgensi:** 🔴 **Critical / Immediate Implementation for App Stability**  

---

## 1. 📌 Ringkasan Eksekutif & Latar Belakang Kasus Lapangan

Pada Rabu pagi, 07 Oktober 2026 pukul 10:15 WIB, terjadi eskalasi keluhan warga di wilayah RW 20 (Cikondang, Sadang Serang) atas nama **Ibu Tati Sastriawati**. Warga tersebut tidak dapat melakukan setoran sampah harian karena aplikasi Flutter secara konsisten menampilkan dialog modal:
> **"Di Luar Jangkauan"**  
> *"Anda berada di luar jangkauan lokasi tempat sampah yang ingin dipindai. Harap mendekat ke lokasi tempat sampah Anda."*

Padahal, secara fisik warga berdiri tepat di depan tempat sampahnya dengan jarak **tidak lebih dari 5–10 meter**.

Master Backend telah melakukan audit forensik menyeluruh pada **database PostgreSQL VPS**, **log web server Nginx**, **log runtime PM2**, dan **kode Flutter mobile (`scan_flow_view.dart` & `api_bin_repository.dart`)**.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   FAKTA FORENSIK UTAMA HASIL AUDIT                                     │
├──────────────────────────────┬──────────────────────────────┬───────────────────────────────────────────┤
│ 1. DATA DATABASE VPS         │ 2. LOG SERVER NGINX LIVE     │ 3. ANALISIS KODE FLUTTER MOBILE           │
├──────────────────────────────┼──────────────────────────────┼───────────────────────────────────────────┤
│ • Akun Warga: 100% Valid     │ • Tercatat 18x request gagal │ • Menggunakan cache GPS kadaluarsa        │
│ • Titik Bin di DB: Tepat di  │   berturut-turut pada pukul  │   (getLastKnownPosition tanpa verifikasi) │
│   rumah warga (-6.89048,...) │   10:15:37 – 10:17:16 WIB    │ • Tombol 'Coba Lagi' tidak meng-await GPS │
│ • 17x Setoran Sukses sebelum-│ • Status: HTTP 400           │   sehingga mengirim ulang koordinat salah │
│   nya (terakhir kemarin pagi)│   (LOCATION_TOO_FAR, 168 B)  │   dalam loop beruntun milidetik           │
└──────────────────────────────┴──────────────────────────────┴───────────────────────────────────────────┘
```

---

## 2. 🗄️ Fakta Forensik Data VPS (`psc_db` & Web Server Log)

### A. Rekam Jejak Basis Data Warga
* **Nama Warga:** Tati Sastriawati (ID: `9eee31b8-99e1-47cd-a536-85ad9de0393d`)
* **Alamat:** RT 03 RW 20 Cikondang, Kelurahan Sadang Serang
* **Tempat Sampah Terdaftar:**
  * Organik: `BSK-OGN-060926-0646` (Status: `ACTIVE_BOUND`)
  * Anorganik: `BSK-AGN-060926-0656` (Status: `ACTIVE_BOUND`)
* **Koordinat Terkunci di DB:** Latitude `-6.8904821`, Longitude `107.629315`  
  *(Titik ini **sah dan presisi** berada di rumah warga, terbukti berdampingan dengan warga tetangga seperti Pak Agus Saefullah di `-6.8904216, 107.6293165`)*.
* **Riwayat Transaksi:** Warga ini telah **berhasil menyetor sampah sebanyak 17 KALI** sebelumnya, dengan transaksi sukses terakhir tercatat pada **Selasa, 06 Oktober 2026 pukul 10:53 WIB**.

### B. Bukti Log Web Server Nginx Live VPS
Pemeriksaan log Nginx live pada IP perangkat warga (`114.122.70.196`):
```text
114.122.70.196 - - [07/Oct/2026:03:15:37 +0000] "POST /api/v1/bins/scan HTTP/1.1" 400 168 "-" "Dart/3.13 (dart:io)"
114.122.70.196 - - [07/Oct/2026:03:15:56 +0000] "POST /api/v1/bins/scan HTTP/1.1" 400 168 "-" "Dart/3.13 (dart:io)"
114.122.70.196 - - [07/Oct/2026:03:15:57 +0000] "POST /api/v1/bins/scan HTTP/1.1" 400 168 "-" "Dart/3.13 (dart:io)"
114.122.70.196 - - [07/Oct/2026:03:15:58 +0000] "POST /api/v1/bins/scan HTTP/1.1" 400 168 "-" "Dart/3.13 (dart:io)"
114.122.70.196 - - [07/Oct/2026:03:15:59 +0000] "POST /api/v1/bins/scan HTTP/1.1" 400 168 "-" "Dart/3.13 (dart:io)"
114.122.70.196 - - [07/Oct/2026:03:16:00 +0000] "POST /api/v1/bins/scan HTTP/1.1" 400 168 "-" "Dart/3.13 (dart:io)"
114.122.70.196 - - [07/Oct/2026:03:16:06 +0000] "POST /api/v1/bins/scan HTTP/1.1" 400 168 "-" "Dart/3.13 (dart:io)"
114.122.70.196 - - [07/Oct/2026:03:16:07 +0000] "POST /api/v1/bins/scan HTTP/1.1" 400 168 "-" "Dart/3.13 (dart:io)"
... (18 kali penolakan berturut-turut dalam rentang 99 detik)
```
Toleransi radius aktif di backend VPS adalah **100 meter** (`BIN_GEOFENCE_MAX_RADIUS_METERS || 100`). Seluruh 18 penolakan tersebut terjadi karena koordinat yang dikirim oleh HP warga berada di luar radius 100 meter dari titik rumah yang tercatat di DB.

---

## 3. 🔬 Analisis Mendalam Akar Masalah pada Kode Flutter Mobile

Setelah mereview file [`lib/app/modules/scan/views/scan_flow_view.dart`](file:///c:/Users/USER/.gemini/antigravity-ide/scratch/berseka/mobile/lib/app/modules/scan/views/scan_flow_view.dart), ditemukan **3 titik kritis kegagalan** yang menyebabkan masalah ini:

### ⚠️ Masalah 1: Penyerapan Cache Lokasi Kadaluarsa Tanpa Validasi Umur (*Stale GPS Cache*)
Pada baris 97–103:
```dart
// scan_flow_view.dart:97-103
final lastPos = await Geolocator.getLastKnownPosition();
if (lastPos != null && mounted) {
  setState(() {
    _userLat = lastPos.latitude;
    _userLng = lastPos.longitude;
  });
}
```
Dan pada baris 153–155:
```dart
// scan_flow_view.dart:153-155
if (_userLat != null && _userLng != null && _userLat != 0.0 && _userLng != 0.0) {
  return true; // Bypass instant 0 ms!
}
```
**Dampak Buruk:**
`getLastKnownPosition()` mengambil titik terakhir yang pernah disimpan oleh OS Android. Jika warga 15 menit atau beberapa jam sebelumnya sempat berada di luar rumah (pasar, toko, jalan raya, kantor) yang berjarak >100m, posisi lama tersebut langsung masuk ke variabel `_userLat`. Karena tidak dicek apakah koordinat tersebut sudah usang (*stale*), mobile menganggap GPS sudah beres dan langsung mengirim koordinat lama tersebut ke backend!

---

### ⚠️ Masalah 2: Asynchronous Race Condition pada Tombol "Coba Lagi"
Pada dialog `LOCATION_OUT_OF_RANGE` (baris 1474–1479):
```dart
// scan_flow_view.dart:1474-1479
onPressed: () {
  Navigator.of(context).pop();
  ref.read(scanFlowProvider.notifier).clearError();
  _fetchGps(); // ❌ DILAKUKAN SECARA FIRE-AND-FORGET (TANPA AWAIT)
  _qrScannerKey.currentState?.resetScanner(); // ❌ KAMERA LANGSUNG AKTIF SEKETIKA
},
```
**Dampak Buruk:**
1. Ketika dialog ditutup dan `_fetchGps()` dipanggil, proses pencarian sinyal GPS satelit baru membutuhkan waktu 1–3 detik.
2. Namun, scanner kamera langsung di-reset seketika (`resetScanner()`).
3. Kamera langsung mendeteksi QR code dalam hitungan milidetik.
4. Karena `_fetchGps()` belum selesai, `_userLat` **masih berisi koordinat usang yang sama**!
5. Transaksi dikirim kembali dan ditolak lagi oleh backend. Siklus ini berulang terus-menerus, memicu **18 kali penolakan beruntun** seperti yang tercatat di log server.

---

### ⚠️ Masalah 3: Ketiadaan Threshold Akurasi GPS (*Accuracy Dilution*)
Ketika `_fetchGps()` berhasil mendapatkan koordinat, kode tidak memeriksa nilai `pos.accuracy`:
* Di dalam rumah atau di bawah atap kanopi pemukiman padat Cikondang, sinyal satelit GPS terhalang (*indoor attenuation*).
* Akurasi GPS ponsel kelas menengah/entry-level bisa melonjak hingga **accuracy = 80m – 250m** (GPS Drift).
* Posisi yang meleset 150 meter tersebut langsung dikirim tanpa peringatan kepada warga bahwa sinyal GPS ponselnya sedang tidak akurat.

---

## 4. 🛠️ Solusi Wajib & Tindakan Konkret untuk Tim Flutter

Tim Mobile diwajibkan menerapkan **4 perbaikan arsitektural** berikut pada `scan_flow_view.dart`:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                               PIPELINE PENANGANAN GPS ANTI-GAGAL                                │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                 │
│  [Buka Halaman Scan] ──► [Cek Usia Cache]                                                       │
│                                │                                                                │
│                                ├── Usia < 60 detik & Akurasi < 40m ──► Gunakan                  │
│                                │                                                                │
│                                └── Usia > 60 detik / Akurasi Buruk ──► Wajib Fetch Realtime     │
│                                                                                                 │
│  [Tombol 'Coba Lagi'] ──► Tampilkan Indikator Loading ──► Await GPS Baru ──► Buka Kamera Scan   │
│                                                                                                 │
│  [Akurasi GPS Buruk (>60m)] ──► Tampilkan SnackBar Kuning: "Mendapatkan Sinyal Presisi..."      │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 1. Validasi Umur & Akurasi pada `getLastKnownPosition`
Jangan pernah menggunakan `lastPos` secara membabi buta. Periksa `lastPos.timestamp` dan `lastPos.accuracy`:
```dart
final lastPos = await Geolocator.getLastKnownPosition();
if (lastPos != null) {
  final now = DateTime.now();
  final cacheAge = now.difference(lastPos.timestamp);
  
  // Hanya gunakan cache jika usianya di bawah 60 detik DAN akurasinya di bawah 50 meter
  if (cacheAge.inSeconds < 60 && lastPos.accuracy <= 50.0) {
    _userLat = lastPos.latitude;
    _userLng = lastPos.longitude;
    _gpsAccuracy = lastPos.accuracy;
  } else {
    debugPrint('[GPS] Cache kadaluarsa (${cacheAge.inSeconds}s, acc: ${lastPos.accuracy}m). Wajib refresh realtime.');
  }
}
```

### 2. Perbaiki Handler Tombol "Coba Lagi" (Wajib `await` + Loading)
Jangan langsung me-reset scanner kamera sebelum GPS realtime benar-benar berhasil diperbarui:
```dart
onPressed: () async {
  Navigator.of(context).pop();
  ref.read(scanFlowProvider.notifier).clearError();
  
  // Tampilkan loading / nonaktifkan scanner sejenak
  setState(() => _gpsLoading = true);
  
  // WAJIB AWAIT perolehan lokasi realtime baru
  final newPos = await _fetchGps(requestPermissionIfNeeded: true);
  
  if (mounted) {
    setState(() => _gpsLoading = false);
    if (newPos != null) {
      _qrScannerKey.currentState?.resetScanner();
    } else {
      _showWarningSnackBar(
        'Gagal mengunci lokasi presisi. Pastikan GPS aktif dan Anda berada di area terbuka.',
      );
    }
  }
}
```

### 3. Konfigurasi `LocationSettings` dengan Prioritas Tinggi
Pastikan `Geolocator.getCurrentPosition` dikonfigurasi dengan `LocationAccuracy.high` dan batas waktu yang wajar:
```dart
final pos = await Geolocator.getCurrentPosition(
  locationSettings: const LocationSettings(
    accuracy: LocationAccuracy.high,
    distanceFilter: 0,
    timeLimit: Duration(seconds: 8),
  ),
);
```

### 4. Tampilkan Panduan Komparatif pada Dialog Error
Pada dialog `LOCATION_OUT_OF_RANGE`, tampilkan informasi jarak yang dikembalikan oleh backend (`distanceMeters`) jika tersedia:
```dart
Text(
  message ?? 'Anda berada di luar jangkauan lokasi tempat sampah.',
  textAlign: TextAlign.center,
),
const SizedBox(height: 8),
Text(
  'Tips: Jika Anda berada di dalam rumah, cobalah melangkah ke teras atau dekat jendela agar sinyal GPS ponsel dapat terhubung langsung ke satelit.',
  style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
)
```

---

## 5. 🧪 Checklist Pengujian Tim Mobile Sebelum Staging

Sebelum melakukan build atau PR ke branch `staging-mobile`, pastikan lulus pengujian berikut:

- [ ] **Test Case 1 (Stale Cache Prevention):** Buka aplikasi di lokasi A, matikan GPS / pindah ke lokasi B (>200m). Buka halaman scan. Pastikan aplikasi tidak langsung menggunakan koordinat lokasi A.
- [ ] **Test Case 2 (Retry Button Await):** Pancing error `LOCATION_OUT_OF_RANGE`. Tap *"Coba Lagi"*. Pastikan kamera tidak langsung memindai sebelum indikator GPS selesai memperbarui koordinat.
- [ ] **Test Case 3 (Indoor / GPS Drift Tolerance):** Lakukan pemindaian di dalam ruangan tertutup. Pastikan aplikasi mampu mengunci akurasi stabil sebelum mengirim request ke backend.

---
**Disahkan oleh:**  
*Master Backend Architecture & Data Governance Team*  
*PT Makerindo Prima Cipta*
