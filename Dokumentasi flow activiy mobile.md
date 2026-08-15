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
 Step 3: Sukses Cetak  <──(Kirim Transaksi)──  Step 2: Pindai QR Tempat Sampah & GPS
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

### Tahap 3: Pemindaian QR Tempat Sampah & Pengiriman Transaksi (FR-02)
1.  **QR Code Scan:** Warga memindai stiker kode QR yang tertera pada badan tempat sampah fisik.
2.  **Optimasi Lokasi Persis Tempat Sampah (Bypass GPS Inaccuracy):**
    *   Untuk mengatasi inakurasi hardware GPS bawaan perangkat (khususnya pada wilayah bergang sempit/padat di Kecamatan Coblong), repositori memanggil `getBinByQrSerial(qrCode)` terlebih dahulu untuk mengambil koordinat presisi tempat sampah dari basis data server.
    *   Jika data koordinat tempat sampah ditemukan, nilai lintang & bujur (`latitude` dan `longitude`) tersebut akan menggantikan koordinat GPS HP warga sebelum dikirim ke endpoint transaksi.
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
    *   **Radius Geofencing (> 10 meter):** Jika jarak HP warga dan tempat sampah melebihi 10 meter berdasarkan perhitungan Haversine di server, transaksi dibatalkan dengan kode error `LOCATION_OUT_OF_RANGE`.
    *   **Mismatch Tipe Sampah:** Jika tipe sampah hasil deteksi AI (misalnya Organik) tidak cocok dengan tipe peruntukan tempat sampah fisik yang di-scan (misalnya tempat sampah khusus Anorganik), transaksi ditolak dengan kode error `BIN_TYPE_MISMATCH`.
    *   **Kapasitas Tempat Sampah Penuh (Overflow > 90%):** Jika volume sampah baru menyebabkan kapasitas tempat sampah terlampaui, server membalas dengan `BIN_OVERFLOW`.
    *   **Hak Milik Tempat Sampah:** Jika tempat sampah belum teraktivasi atau bukan milik rumah tangga warga yang bersangkutan, server membalas dengan `BIN_NOT_ACTIVATED` / `BIN_NOT_OWNED`.

### Tahap 4: Finalisasi & Siklus Auto-Refresh Data Beranda (FR-03)
Setelah respons dari server bernilai sukses:
1.  **Cetak Notifikasi Lokal:** Aplikasi mengaktifkan `NotificationEngine()` untuk mengirim notifikasi lokal ke bar status HP warga yang mengumumkan jumlah perolehan poin instan (misal: *"Anda mendapatkan +500 poin!"*).
2.  **Aggressive Cache Invalidation:** Program secara paksa melakukan invalidasi pada provider Riverpod berikut:
    *   `ref.invalidate(wasteLogsProvider)` (Daftar riwayat pembuangan langsung terperbarui).
    *   `ref.invalidate(totalPointsProvider)` (Saldo poin beranda ter-update instan).
    *   `ref.invalidate(pointHistoryProvider)` (Ledger perolehan poin ter-update).
    *   `ref.invalidate(dailyPointsProvider)` (Limitasi deteksi AI hari ini disinkronkan).
    *   `ref.invalidate(binsProvider)` (Kapasitas tempat sampah termutakhir terunduh).
3.  **UI Lock (`PopScope`):** Sepanjang alur transaksi (Step 1 hingga 3), tombol kembali (*hardware back button*) diblokir menggunakan widget `<PopScope(canPop: state.currentStep == 0)>`. Langkah ini penting untuk mencegah data terkorupsi atau transaksi ganda akibat warga menekan tombol kembali di tengah proses pengiriman API.

---

## 4. Penanganan Error Khusus & Alur Pemulihan (Fallback)

Setiap kode error yang dikirimkan oleh API akan diterjemahkan menjadi dialog UI khusus untuk memandu warga melakukan aksi pemulihan:

| Kode Error API | Representasi UI & Penanganan | Solusi / Tombol Tindakan |
| :--- | :--- | :--- |
| `IMAGE_UNREADABLE` | Dialog: *"Foto Buram/Tidak Jelas"* | State kembali ke Step 0, tombol: **"Ambil Ulang Foto"** |
| `AI_DAILY_LIMIT` | Dialog: *"Kuota Deteksi Habis"* | Membatasi warga untuk mencoba esok hari atau hubungi admin. |
| `BIN_TYPE_MISMATCH` | Dialog: *"Salah Masukkan Tempat Sampah"* | Menampilkan layar panduan `bin_mismatch.png`, mengarahkan warga ke tempat sampah yang sesuai kategori. |
| `BIN_OVERFLOW` | Dialog: *"Kapasitas Tempat Sampah Penuh"* | Menyediakan form pintas untuk mengunggah foto bukti fisik agar diajukan permohonan pengosongan ke pengurus RT via `submitResetRequest()`. |
| `LOCATION_OUT_OF_RANGE` | Dialog: *"Jarak Terlalu Jauh"* | Menginstruksikan warga untuk mendekat ke tempat sampah fisik sebelum memindai ulang. |
| `NETWORK_ERROR` | Banner merah di atas layar | Menonaktifkan fungsi pemicu scan & AI. Mengaktifkan pembacaan offline-first dari cache `SharedPreferences`. |

---

## 5. Offline-Only & Deteksi Jaringan (NFR-05 & UI/UX §5.3)
1.  **Real-Time Connection Monitoring:** Aplikasi memantau konektivitas jaringan menggunakan package `connectivity_plus` secara real-time via stream pada `connectivityProvider`.
2.  **State Reaktif `isOnlineProvider`:** Mengembalikan nilai boolean apakah ada jaringan aktif.
3.  **Perilaku UI Saat Offline:**
    *   Banner merah bertuliskan `"NETWORK_UNAVAILABLE"` dirender menetap di bagian atas layar.
    *   Tombol aksi deteksi AI dan Scan QR dipaksa nonaktif dengan menyetel callback button menjadi `onPressed: null`.
    *   Modul dashboard warga otomatis beralih menampilkan cache data historis yang disimpan di `SharedPreferences`.

---

## 6. Modul Kompresi Foto, Push Notification Per-Akun, & Spesifikasi API Backend

### 6.1 Alur Kompresi Foto Terpusat (`ImageCompressor`)
Seluruh unggahan foto pada Modul Warga dikompresi secara otomatis sebelum dikirimkan via MultipartFormData Dio untuk mencegah timeout jaringan dan menghemat bandwidth:
* **AI Waste Detection (FR-01):** Target `< 1MB` (Max 1024 x 1024px, Quality ~80%).
* **Reset Bin Evidence (FR-12):** Target `< 5MB` (Max 1920 x 1080px, Quality ~85%).
* **Avatar Profile (FR-16):** Target `< 300KB` (Max 512 x 512px, Quality ~80%).

### 6.2 Siklus Notifikasi Push FCM Per-Akun & Logout Cleaning
1. **Login / App Inisialisasi:** Token FCM didaftarkan via `POST /api/v1/notifications/device-token` yang terikat pada Bearer Token pengguna aktif.
2. **Isolasi Akun:** Notifikasi tersaring per-user di backend.
3. **Logout Procedure:** Saat `AuthNotifier.logout()` dieksekusi:
   * Mengambil token FCM aktif.
   * Mengirim `POST /api/v1/notifications/unregister-token` untuk menghapus asosiasi token di server.
   * Memanggil `FirebaseMessaging.instance.deleteToken()` untuk reset token lokal SDK Firebase.
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
 Step 3: Sukses Cetak  <──(Kirim Transaksi)──  Step 2: Pindai QR Tempat Sampah & GPS
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

### Tahap 3: Pemindaian QR Tempat Sampah & Pengiriman Transaksi (FR-02)
1.  **QR Code Scan:** Warga memindai stiker kode QR yang tertera pada badan Tempat Sampah fisik.
2.  **Optimasi Lokasi Persis Tempat Sampah (Bypass GPS Inaccuracy):**
    *   Untuk mengatasi inakurasi hardware GPS bawaan perangkat (khususnya pada wilayah bergang sempit/padat di Kecamatan Coblong), repositori memanggil `getBinByQrSerial(qrCode)` terlebih dahulu untuk mengambil koordinat presisi Tempat Sampah dari basis data server.
    *   Jika data koordinat Tempat Sampah ditemukan, nilai lintang & bujur (`latitude` dan `longitude`) tersebut akan menggantikan koordinat GPS HP warga sebelum dikirim ke endpoint transaksi.
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
    *   **Radius Geofencing (> 10 meter):** Jika jarak HP warga dan Tempat Sampah melebihi 10 meter berdasarkan perhitungan Haversine di server, transaksi dibatalkan dengan kode error `LOCATION_OUT_OF_RANGE`.
    *   **Mismatch Tipe Sampah:** Jika tipe sampah hasil deteksi AI (misalnya Organik) tidak cocok dengan tipe peruntukan Tempat Sampah fisik yang di-scan (misalnya Tempat Sampah khusus Anorganik), transaksi ditolak dengan kode error `BIN_TYPE_MISMATCH`.
    *   **Kapasitas Tempat Sampah Penuh (Overflow > 90%):** Jika volume sampah baru menyebabkan kapasitas Tempat Sampah terlampaui, server membalas dengan `BIN_OVERFLOW`.
    *   **Hak Milik Tempat Sampah:** Jika Tempat Sampah belum teraktivasi atau bukan milik rumah tangga warga yang bersangkutan, server membalas dengan `BIN_NOT_ACTIVATED` / `BIN_NOT_OWNED`.

### Tahap 4: Finalisasi & Siklus Auto-Refresh Data Beranda (FR-03)
Setelah respons dari server bernilai sukses:
1.  **Cetak Notifikasi Lokal:** Aplikasi mengaktifkan `NotificationEngine()` untuk mengirim notifikasi lokal ke bar status HP warga yang mengumumkan jumlah perolehan poin instan (misal: *"Anda mendapatkan +500 poin!"*).
2.  **Aggressive Cache Invalidation:** Program secara paksa melakukan invalidasi pada provider Riverpod berikut:
    *   `ref.invalidate(wasteLogsProvider)` (Daftar riwayat pembuangan langsung terperbarui).
    *   `ref.invalidate(totalPointsProvider)` (Saldo poin beranda ter-update instan).
    *   `ref.invalidate(pointHistoryProvider)` (Ledger perolehan poin ter-update).
    *   `ref.invalidate(dailyPointsProvider)` (Limitasi deteksi AI hari ini disinkronkan).
    *   `ref.invalidate(binsProvider)` (Kapasitas Tempat Sampah termutakhir terunduh).
3.  **UI Lock (`PopScope`):** Sepanjang alur transaksi (Step 1 hingga 3), tombol kembali (*hardware back button*) diblokir menggunakan widget `<PopScope(canPop: state.currentStep == 0)>`. Langkah ini penting untuk mencegah data terkorupsi atau transaksi ganda akibat warga menekan tombol kembali di tengah proses pengiriman API.

---

## 4. Penanganan Error Khusus & Alur Pemulihan (Fallback)

Setiap kode error yang dikirimkan oleh API akan diterjemahkan menjadi dialog UI khusus untuk memandu warga melakukan aksi pemulihan:

| Kode Error API | Representasi UI & Penanganan | Solusi / Tombol Tindakan |
| :--- | :--- | :--- |
| `IMAGE_UNREADABLE` | Dialog: *"Foto Buram/Tidak Jelas"* | State kembali ke Step 0, tombol: **"Ambil Ulang Foto"** |
| `AI_DAILY_LIMIT` | Dialog: *"Kuota Deteksi Habis"* | Membatasi warga untuk mencoba esok hari atau hubungi admin. |
| `BIN_TYPE_MISMATCH` | Dialog: *"Salah Masukkan Tempat Sampah"* | Menampilkan layar panduan `bin_mismatch.png`, mengarahkan warga ke Tempat Sampah yang sesuai kategori. |
| `BIN_OVERFLOW` | Dialog: *"Kapasitas Tempat Sampah Penuh"* | Menyediakan form pintas untuk mengunggah foto bukti fisik agar diajukan permohonan pengosongan via `submitResetRequest()`. |
| `LOCATION_OUT_OF_RANGE` | Dialog: *"Jarak Terlalu Jauh"* | Menginstruksikan warga untuk mendekat ke Tempat Sampah fisik sebelum memindai ulang. |
| `NETWORK_ERROR` | Banner merah di atas layar | Menonaktifkan fungsi pemicu scan & AI. Mengaktifkan pembacaan offline-first dari cache `SharedPreferences`. |

---

## 5. Offline-Only & Deteksi Jaringan (NFR-05 & UI/UX §5.3)
1.  **Real-Time Connection Monitoring:** Aplikasi memantau konektivitas jaringan menggunakan package `connectivity_plus` secara real-time via stream pada `connectivityProvider`.
2.  **State Reaktif `isOnlineProvider`:** Mengembalikan nilai boolean apakah ada jaringan aktif.
3.  **Perilaku UI Saat Offline:**
    *   Banner merah bertuliskan `"NETWORK_UNAVAILABLE"` dirender menetap di bagian atas layar.
    *   Tombol aksi deteksi AI dan Scan QR dipaksa nonaktif dengan menyetel callback button menjadi `onPressed: null`.
    *   Modul dashboard warga otomatis beralih menampilkan cache data historis yang disimpan di `SharedPreferences`.

---

## 6. Modul Kompresi Foto, Push Notification Per-Akun, & Spesifikasi API Backend

### 6.1 Alur Kompresi Foto Terpusat (`ImageCompressor`)
Seluruh unggahan foto pada Modul Warga dikompresi secara otomatis sebelum dikirimkan via MultipartFormData Dio untuk mencegah timeout jaringan dan menghemat bandwidth:
* **AI Waste Detection (FR-01):** Target `< 1MB` (Max 1024 x 1024px, Quality ~80%).
* **Reset Bin Evidence (FR-12):** Target `< 5MB` (Max 1920 x 1080px, Quality ~85%).
* **Avatar Profile (FR-16):** Target `< 300KB` (Max 512 x 512px, Quality ~80%).

### 6.3 Ringkasan Contract REST API Backend (Modul Warga)
* `POST /api/v1/notifications/device-token` — Registrasi FCM Token per user login
* `POST /api/v1/notifications/unregister-token` — Unregister FCM Token saat logout (Pending Backend)
* `POST /api/v1/auth/verify-otp` — Verifikasi 6-digit OTP WhatsApp Fonnte pada alur Lupa Password
* `POST /api/v1/auth/reset-password` — Simpan password baru setelah verifikasi OTP Lupa Password
* `POST /api/v1/ai/detect` — Multipart Upload foto sampah (<1MB)
* `POST /api/v1/bins/reset` — Multipart Upload foto bukti pengosongan Tempat Sampah (<5MB)

### 6.4 Formula Kalkulasi Poin Resmi (FR-03 & SDD §3.2 & `ai_detection_entity.dart`)
$$\text{Poin} = (\text{Berat (kg)} \times 100) \times \text{Confidence AI} \times 0.9$$
* **Massa (Berat kg):** $\text{volumeEstimate (Liter)} \times \text{density}$ ($0.4\text{ kg/L}$ Organik, $0.2\text{ kg/L}$ Anorganik).
* **Confidence AI:** Skor keyakinan model AI (0.00 hingga 1.00, fallback 0.85).
* **Faktor Multiplier:** $0.9$ ($90\%$ safety margin).

---

## 7. Laporan Audit Forensik & Verifikasi Kodebase (Revisi)

### 7.1 Hasil Verifikasi Status Dio & SDD §12
1. **`pubspec.yaml` (Line 19-21):**
   ```yaml
   # HTTP Client (dikunci per sdd.md §12 — sementara tidak dipakai, disiapkan untuk integrasi BE)
   dio: ^5.8.0
   ```
2. **`docs/sdd.md` §12 (Line 420-424):**
   ```markdown
   ### Mobile (`/mobile`)
   | Komponen | Library/Tool | Versi Dikunci |
   |:---|:---|:---|
   | Framework | Flutter | 3.44.6 (stable) |
   | Language | Dart | 3.12.2 |
   | HTTP Client | dio | ^5.8.0 |
   ```
   *Penjelasan:* SDD §12 mematok `dio: ^5.8.0` sebagai standar resmi HTTP Client. Komentar pada `pubspec.yaml` adalah teks sisa dari inisialisasi awal.
3. **`lib/app/data/providers/api_client.dart` (Line 33-50):** `ApiClient` mengonfigurasi Dio dengan `AppConfig.apiBaseUrl` (`http://157.10.252.252:3000/api/v1`) serta interceptor Bearer Token & auto-refresh 401.
4. **`lib/app/data/repositories/api_auth_repository.dart` (Line 37-40):** `.login()` mengeksekusi request HTTP POST asli `apiClient.dio.post('/auth/login', ...)`.

### 7.2 Tabel Verifikasi 7 File Kodebase

| No | Nama File | File Ada? | Klaim Terbukti? | Bukti Cuplikan Kode Asli & Nomor Baris |
|:---:|:---|:---:|:---:|:---|
| **1** | `pubspec.yaml` | **Ya** | **Ya** | `pubspec.yaml:L31-L32` — `flutter_image_compress: ^2.3.0` |
| **2** | `lib/app/core/utils/image_compressor.dart` | **Ya** | **Ya** | `image_compressor.dart:L13-L23` — `class ImageCompressor` & `compressImage(...)` |
| **3** | `lib/app/data/repositories/api_bin_repository.dart` | **Ya** | **Ya** | `api_bin_repository.dart:L161-L167` (`detectWaste`) & `L455-L461` (`submitResetRequest`) |
| **4** | `lib/app/data/repositories/api_auth_repository.dart` | **Ya** | **Ya** | `api_auth_repository.dart:L259` (`kDebugMode` OTP guard) & `L485-L491` (`uploadAvatar`) |
| **5** | `lib/app/data/repositories/notification_repository.dart` | **Ya** | **Ya** | `notification_repository.dart:L22-L24` — `unregisterDeviceToken(token)` interface |
| **6** | `lib/app/data/repositories/api_notification_repository.dart` | **Ya** | **Ya** | `api_notification_repository.dart:L85-L99` — `unregisterDeviceToken` implementation |
| **7** | [auth_controller.dart](file:///d:/habil/Pilah-Sampah-Cerdas/lib/app/modules/auth/controllers/auth_controller.dart) | **Ya** | **Ya** | `auth_controller.dart:L181-L194` — `logout()` unregister FCM token & delete token |

### 7.3 Hasil Verifikasi Klaim Performa
**ESTIMASI TEORETIS KODE LOGIC, BELUM DIUJI DI DEVICE FISIK**. Angka 1MB dan 5MB adalah `maxSizeBytes` programmatic pada `ImageCompressor`. Kecepatan dan ukuran riil tergantung hardware HP & jaringan seluler ke VPS.

### 7.4 Verifikasi Dependency `flutter_image_compress`
Terbukti 100% secara fisik tertulis pada `pubspec.yaml` baris 31-32 (`flutter_image_compress: ^2.3.0`).

### 7.5 Kesimpulan & Tingkat Kepercayaan
* **Struktur Kode & Logika File:** **100% TERBUKTI** (Seluruh 7 file ada dan perubahan fungsi terverifikasi murni di codebase).
* **Klaim Pengukuran Performa:** **Dinegasi menjadi Estimasi Teoretis Kode**.

### 7.6 Rekomendasi Langkah Selanjutnya
Lakukan pengujian profiler di hardware HP fisik dan serahkan REST API Contract ke tim backend.
