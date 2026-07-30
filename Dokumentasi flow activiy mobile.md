# Dokumentasi Flow Activity Mobile (Branch: local-dev)

Dokumen ini menjelaskan alur aktivitas (*activity flow*) aplikasi mobile **Pilah Sampah Cerdas** pada branch `local-dev`. Penulisan flow ini mengikuti kaidah teknis Clean Architecture (Widget/UI → ViewModel/Notifier → Repository → DataSource), Riverpod State Management, Dio HTTP client, dan hardware API integration.

---

## 1. Arsitektur Komunikasi Data & Thin Client
Aplikasi mobile bertindak sebagai **Thin Client**. Seluruh komputasi berat, pemrosesan citra AI (Computer Vision), dan penegakan aturan bisnis (*business rules*) didelegasikan ke cloud (Backend Express.js). 

```
┌───────────┐         ┌───────────┐         ┌───────────┐         ┌────────────┐
│ Widget/UI │ ──────> │ Notifier  │ ──────> │  Repo API │ ──────> │ Backend API│
│  (Screen) │ <────── │ (Riverpod)│ <────── │   (Dio)   │ <────── │  (NodeJS)  │
└───────────┘         └───────────┘         └───────────┘         └────────────┘
```

*   **State Management (Riverpod):** Mengelola siklus data reaktif. Ketika mutasi berhasil dilakukan di server, notifier akan memicu `ref.invalidate()` ke provider terkait untuk memicu *auto-refresh* data lokal secara instan.
*   **HTTP Client (Dio & Interceptor):** Berjalan secara terpusat pada file `/lib/data/network/api_client.dart` dengan fitur:
    *   **Injeksi Bearer Token:** Membaca Access Token dari Secure Storage (`flutter_secure_storage`) lalu menyematkannya pada setiap request header `Authorization: Bearer <token>`.
    *   **Auto-Refresh Token (401 Intercept):** Mengunci thread request baru saat mendeteksi error `401 Unauthorized` melalui mutex `_isRefreshing`. Dio secara mandiri memanggil POST `/api/v1/auth/refresh`. Jika berhasil, token baru disimpan dan antrean request sebelumnya (*pending requests*) dikirim ulang (*retry*). Jika gagal, sistem menghapus semua token lalu memaksa navigasi (*force logout*) ke `LoginScreen`.

---

## 2. Siklus Kamera & QR Scanner (`qr_scanner_widget.dart`)
Komponen pemindai terpusat menggunakan library `mobile_scanner` untuk interaksi kamera fisik pada Android/iOS.

```
       [Start App]
            │
  Platform Native Check?
   ├── No (Web/Desktop) ──> [Bypass ke Form Input Manual]
   └── Yes (Android/iOS)
            │
            ▼
 Request Permission Kamera
   ├── Denied ────────────> [Tampilkan Layar Izin Ditolak + Tombol Coba Lagi]
   ├── PermDenied ────────> [Tampilkan Tombol Pintas ke Pengaturan Sistem OS]
   └── Granted 
            │
            ▼
   Initialize Controller
 (facing: back, autostart: true)
            │
            ├───────> App Paused (Background) ──> [Controller Stop (Hemat Baterai & RAM)]
            ├───────> App Resumed (Foreground) ─> [Controller Start (Kamera Aktif Kembali)]
            │
            ▼
       Barcode Detected
  (cooldown 1.5s if fail / 0.5s if success)
```

*   **Lifecycle Awareness (Optimasi Baterai & RAM):** Widget mengimplementasikan `WidgetsBindingObserver` untuk mendeteksi perubahan status siklus hidup aplikasi (*app lifecycle state*):
    *   **AppPaused:** Kamera dinonaktifkan (`_controller?.stop()`) demi menghemat daya baterai dan membebaskan RAM perangkat.
    *   **AppResumed:** Kamera otomatis diaktifkan kembali (`_controller?.start()`) untuk melanjutkan pemindaian.
*   **Platform Fallback (Universal Web/Desktop):** Melalui utility `PlatformUtils.supportsNativeQrScanner`, widget secara otomatis mematikan rendering modul kamera pada platform non-seluler (seperti Web atau macOS/Windows runner) dan merendernya menjadi **Form Input Manual Serial QR**.
*   **Permission Matrix:**
    *   `_QrState.loading`: Menampilkan loading spinner selagi meminta izin OS.
    *   `_QrState.denied`: Muncul jika izin ditolak sekali. Menyediakan tombol pemicu ulang dialog izin.
    *   `_QrState.permDenied`: Terjadi apabila warga memilih "Jangan tanya lagi" (*Permanently Denied*). Widget merender tombol pintas langsung ke setelan aplikasi di sistem operasi Android/iOS untuk mencegah *silent crash*.
    *   `_QrState.ready`: Membuka *surface layout view* kamera dengan overlay target box.

---

## 3. Detail Alur & Mesin Transaksi Scan (`scan_flow_screen.dart`)

Alur transaksi dibagi menjadi 4 tahap berurutan (*step-by-step state machine*):

```
 Step 0: Beranda/Idle  ──(Pilih Kamera)──>  Step 1: Pindai Sampah (Kamera Aktif)
                                                       │
                                               (Kirim ke AI API)
                                                       │
 Step 3: Sukses Cetak  <──(Kirim Transaksi)──  Step 2: Pindai QR Tong & GPS
   * Refresh Providers                         * Verifikasi Radius (Anti-Fraud)
   * Trigger FCM/Notif                         * Validasi Mismatch Sampah
```

### Tahap 1: Pengambilan Foto & Deteksi AI (FR-01)
1.  **Pengambilan Foto & Kompresi:** Warga mengambil foto sampah melalui widget kamera. Kamera diatur untuk mengambil gambar dengan resolusi teroptimasi. Foto dikompresi agar ukurannya **< 1MB** sebelum dikirim guna meminimalkan latensi unggah.
2.  **Pengiriman Foto:** Path foto lokal dimasukkan ke dalam payload `multipart/form-data` dengan field `image`.
3.  **Request API:** Dikirim ke POST `/api/v1/ai/detect` via `detectWaste` pada notifier. Endpoint ini dikonfigurasi dengan `receiveTimeout: 30 seconds` untuk mengantisipasi antrean FIFO Redis di backend.
4.  **Evaluasi Citra:**
    *   Jika API merespons `isBlurry: true`, state reset kembali ke Step 0 dengan kode error `IMAGE_UNREADABLE` (warga diminta mengambil foto ulang).
    *   Jika kuota harian habis, return error `QUOTA_EXCEEDED` (maksimal 50 deteksi/user/hari).
    *   Jika sukses, data klasifikasi (`detectedType`: Organik/Anorganik) dan estimasi volume disimpan ke dalam state reaktif `aiResult`.

### Tahap 2: Muncul Bottom Sheet Klasifikasi AI & Aktivasi QR
1.  **Konfirmasi AI:** Begitu transisi ke Step 2 sukses, widget otomatis menampilkan **Bottom Sheet Konfirmasi Deteksi AI**. Lembar ini menampilkan tipe sampah yang terdeteksi beserta estimasi volume dalam liter.
2.  **Transisi ke QR Scanner:** Ketika warga menekan tombol **"Lanjut"** pada bottom sheet, bottom sheet ditutup dan kamera QR scanner diaktifkan.
3.  **GPS Fetching (Anti-Fraud & Geofencing):**
    *   Bersamaan dengan inisialisasi awal layar (`initState`), aplikasi secara senyap (*silent fetch*) meminta koordinat GPS perangkat menggunakan `Geolocator.getCurrentPosition`.
    *   Parameter pencarian diatur ke `LocationAccuracy.medium` dengan `timeLimit: Duration(seconds: 8)`. Hal ini dipilih agar penguncian satelit berjalan cepat tanpa membekukan antarmuka aplikasi (*non-blocking UI*).
    *   Jika GPS gagal dikunci atau diblokir warga, data lokasi dikirim kosong (`null`), dan validasi geofencing sepenuhnya diserahkan kepada mekanisme toleransi di sisi backend.

### Tahap 3: Pemindaian QR Tong & Pengiriman Transaksi (FR-02)
1.  **QR Code Scan:** Warga memindai stiker kode QR yang tertera pada badan tong sampah fisik.
2.  **Optimasi Lokasi Persis Tong (Bypass GPS Inaccuracy):**
    *   Untuk mengatasi inakurasi hardware GPS bawaan perangkat (khususnya pada wilayah bergang sempit/padat di Kecamatan Coblong), repositori memanggil `getBinByQrSerial(qrCode)` terlebih dahulu untuk mengambil koordinat presisi tong sampah dari basis data server.
    *   Jika data koordinat tong ditemukan, nilai lintang & bujur (`latitude` dan `longitude`) tersebut akan menggantikan koordinat GPS HP warga sebelum dikirim ke endpoint transaksi.
3.  **Request API Transaksi:** Dikirim ke POST `/api/v1/bins/scan` dengan payload:
    ```json
    {
      "qrCode": "QR_SERIAL_CODE",
      "detectedType": "Organik" / "Anorganik",
      "estimatedVolume": 12.5,
      "householdId": "HOUSEHOLD_UUID",
      "userLat": -6.890123,
      "userLng": 107.612345
    }
    ```
4.  **Penanganan Validasi Transaksi (Hard Validation):**
    *   **Radius Geofencing (> 10 meter):** Jika jarak HP warga dan tong sampah melebihi 10 meter berdasarkan perhitungan Haversine di server, transaksi dibatalkan dengan kode error `LOCATION_OUT_OF_RANGE`.
    *   **Mismatch Tipe Sampah:** Jika tipe sampah hasil deteksi AI (misalnya Organik) tidak cocok dengan tipe peruntukan tong sampah fisik yang di-scan (misalnya tong khusus Anorganik), transaksi ditolak dengan kode error `BIN_TYPE_MISMATCH`.
    *   **Kapasitas Tong Penuh (Overflow > 90%):** Jika volume sampah baru menyebabkan kapasitas tong terlampaui, server membalas dengan `BIN_OVERFLOW`.
    *   **Hak Milik Tong:** Jika tong sampah belum teraktivasi atau bukan milik rumah tangga warga yang bersangkutan, server membalas dengan `BIN_NOT_ACTIVATED` / `BIN_NOT_OWNED`.

### Tahap 4: Finalisasi & Siklus Auto-Refresh Data Beranda (FR-03)
Setelah respons dari server bernilai sukses:
1.  **Cetak Notifikasi Lokal:** Aplikasi mengaktifkan `NotificationEngine()` untuk mengirim notifikasi lokal ke bar status HP warga yang mengumumkan jumlah perolehan poin instan (misal: *"Anda mendapatkan +500 poin!"*).
2.  **Aggressive Cache Invalidation:** Program secara paksa melakukan invalidasi pada provider Riverpod berikut:
    *   `ref.invalidate(wasteLogsProvider)` (Daftar riwayat pembuangan langsung terperbarui).
    *   `ref.invalidate(totalPointsProvider)` (Saldo poin beranda ter-update instan).
    *   `ref.invalidate(pointHistoryProvider)` (Ledger perolehan poin ter-update).
    *   `ref.invalidate(dailyPointsProvider)` (Limitasi deteksi AI hari ini disinkronkan).
    *   `ref.invalidate(binsProvider)` (Kapasitas tong termutakhir terunduh).
3.  **UI Lock (`PopScope`):** Sepanjang alur transaksi (Step 1 hingga 3), tombol kembali (*hardware back button*) diblokir menggunakan widget `<PopScope(canPop: state.currentStep == 0)>`. Langkah ini penting untuk mencegah data terkorupsi atau transaksi ganda akibat warga menekan tombol kembali di tengah proses pengiriman API.

---

## 4. Penanganan Error Khusus & Alur Pemulihan (Fallback)

Setiap kode error yang dikirimkan oleh API akan diterjemahkan menjadi dialog UI khusus untuk memandu warga melakukan aksi pemulihan:

| Kode Error API | Representasi UI & Penanganan | Solusi / Tombol Tindakan |
| :--- | :--- | :--- |
| `IMAGE_UNREADABLE` | Dialog: *"Foto Buram/Tidak Jelas"* | State kembali ke Step 0, tombol: **"Ambil Ulang Foto"** |
| `AI_DAILY_LIMIT` | Dialog: *"Kuota Deteksi Habis"* | Membatasi warga untuk mencoba esok hari atau hubungi admin. |
| `BIN_TYPE_MISMATCH` | Dialog: *"Salah Masukkan Tong"* | Menampilkan layar panduan `bin_mismatch.png`, mengarahkan warga ke tong sampah yang sesuai kategori. |
| `BIN_OVERFLOW` | Dialog: *"Kapasitas Tong Penuh"* | Menyediakan form pintas untuk mengunggah foto bukti fisik agar diajukan permohonan pengosongan ke petugas RT via `submitResetRequest()`. |
| `LOCATION_OUT_OF_RANGE` | Dialog: *"Jarak Terlalu Jauh"* | Menginstruksikan warga untuk mendekat ke tong sampah fisik sebelum memindai ulang. |
| `NETWORK_ERROR` | Banner merah di atas layar | Menonaktifkan fungsi pemicu scan & AI. Mengaktifkan pembacaan offline-first dari cache `SharedPreferences`. |

---

## 5. Offline-Only & Deteksi Jaringan (NFR-05 & UI/UX §5.3)
1.  **Real-Time Connection Monitoring:** Aplikasi memantau konektivitas jaringan menggunakan package `connectivity_plus` secara real-time via stream pada `connectivityProvider`.
2.  **State Reaktif `isOnlineProvider`:** Mengembalikan nilai boolean apakah ada jaringan aktif.
3.  **Perilaku UI Saat Offline:**
    *   Banner merah bertuliskan `"NETWORK_UNAVAILABLE"` dirender menetap di bagian atas layar.
    *   Tombol aksi deteksi AI dan Scan QR dipaksa nonaktif dengan menyetel callback button menjadi `onPressed: null`.
    *   Modul dashboard warga otomatis beralih menampilkan cache data historis yang disimpan di `SharedPreferences`.
