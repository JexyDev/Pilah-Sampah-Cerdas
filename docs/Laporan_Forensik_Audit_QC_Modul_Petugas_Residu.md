# LAPORAN FORENSIK AUDIT & QC MODUL PETUGAS RESIDU (TRASHCARE)

Dokumen ini merupakan laporan pemeriksaan menyeluruh (*Bug Hunting & QC Audit*) untuk **Modul Petugas Residu** pada aplikasi mobile **TrashCare** (Flutter Dart).

---

## 1. HASIL FLUTTER ANALYZE (OUTPUT MENTAH MENTOR)

Perintah `flutter analyze` berhasil dijalankan pada repositori lokal. Berikut adalah hasil eksekusi mentah (*raw output*) yang difilter khusus untuk berkas-berkas di dalam Modul Petugas Residu (`lib/app/modules/petugas_residu` dan repositori terkait):

```text
Analyzing Pilah-Sampah-Cerdas...                                

   info - Use 'const' with the constructor to improve performance. Try adding the 'const' keyword to the constructor invocation - lib\app\modules\petugas_residu\timbangan_residu_view.dart:245:25 - prefer_const_constructors
   info - Use 'const' with the constructor to improve performance. Try adding the 'const' keyword to the constructor invocation - lib\app\modules\petugas_residu\views\lapor_pelanggaran_view.dart:214:24 - prefer_const_constructors
   info - Use 'const' with the constructor to improve performance. Try adding the 'const' keyword to the constructor invocation - lib\app\modules\petugas_residu\views\lapor_pelanggaran_view.dart:296:25 - prefer_const_constructors
   info - Use 'const' with the constructor to improve performance. Try adding the 'const' keyword to the constructor invocation - lib\app\modules\petugas_residu\views\petugas_residu_view.dart:126:21 - prefer_const_constructors
   info - Use 'const' with the constructor to improve performance. Try adding the 'const' keyword to the constructor invocation - lib\app\modules\petugas_residu\views\petugas_residu_view.dart:133:25 - prefer_const_constructors
   info - Use 'const' with the constructor to improve performance. Try adding the 'const' keyword to the constructor invocation - lib\app\modules\petugas_residu\views\petugas_residu_view.dart:135:34 - prefer_const_constructors
   info - Use 'const' with the constructor to improve performance. Try adding the 'const' keyword to the constructor invocation - lib\app\modules\petugas_residu\views\petugas_residu_view.dart:203:19 - prefer_const_constructors

Hasil Analisis: 0 Error Kompilasi, 7 Lint Warnings pada Modul Petugas Residu.
```

---

## 2. RINGKASAN TEMUAN MASALAH

Berdasarkan audit forensik manual dan penelusuran kode baris demi baris pada seluruh *layer* (`UI Widget -> Riverpod Notifier -> Repository -> Dio HTTP Client -> Express Backend`), ditemukan **8 masalah utama** dengan rincian tingkat keparahan sebagai berikut:

* **KRITIS (Critical):** 2 Masalah *(Memory leak state, Silent Failure API Response)*
* **TINGGI (High):** 3 Masalah *(Dead Code sisa refactor alur tunggal, Exception swallowing pada upload Multipart)*
* **SEDANG (Medium):** 2 Masalah *(Inkonsistensi penanganan error lintas-modul, UI Read-only lock tanpa retry offline)*
* **RENDAH (Low):** 1 Masalah *(Sisa Lint `prefer_const_constructors`)*

---

## 3. TABEL DETAIL TEMUAN MASALAH

| No | File & Baris | Kategori | Tingkat Keparahan | Deskripsi Masalah | Cuplikan Kode Bermasalah | Dampak Sistem |
|---|---|---|---|---|---|---|
| 1 | `api_petugas_residu_repository.dart:145-149` | **API / Logic Error** | **KRITIS** | Silent Error Swallowing: Method `submitLog` mengembalikan `return true;` pada blok `catch (_)` saat Dio melempar `DioException` (500 Error / 400 Bad Request). | `catch (_) { return true; }` | Aplikasi menganggap upload timbangan berhasil padahal data gagal terkirim ke backend. |
| 2 | `api_petugas_residu_repository.dart:259-263` | **API / Logic Error** | **KRITIS** | Method `changePassword` mengabaikan kegagalan HTTP dan mengembalikan `return true;` pada catch block. | `catch (e) { return true; }` | Pengguna diberi tahu "Password Berhasil Diubah" padahal kata sandi di server tidak berubah. |
| 3 | `petugas_residu_controller.dart:66-77` | **State Management** | **TINGGI** | Unhandled Race Condition pada `Future.wait`: Tidak ada penanganan pembatalan jika widget di-dispose saat request async berjalan. | `final results = await Future.wait([...]);` | Potensi memory leak & unmounted state assertion error jika screen ditutup cepat. |
| 4 | `lapor_pelanggaran_view.dart:1-350` | **Broken Refactor / Dead Code** | **TINGGI** | Layar `LaporPelanggaranView` dan method `laporViolation` menjadi berkas terisolasi (*dead code*) setelah alur disederhanakan murni ke Input Timbangan Sampah Residu RT/RW. | `class LaporPelanggaranView extends...` | Menambah beban *bundle size* dan membingungkan pengembang kelanjutan. |
| 5 | `api_petugas_residu_repository.dart:125-130` | **Runtime Error Potensial** | **TINGGI** | Pemanggilan `ImageCompressor.compressImage` tidak memeriksa keberadaan berkas fisik foto sebelum kompresi. | `final compressed = await ImageCompressor.compressImage(photoPath);` | Potensi crash `FileSystemException` jika path berkas kamera invalid / terhapus temporary. |
| 6 | `petugas_residu_view.dart:203-231` | **UI/UX / Logic Error** | **SEDANG** | Banner Window Input (06:00-08:00 & 16:00-18:00) mengunci tombol secara kaku tanpa opsi antrean *draft offline*. | `bool get isPickupWindowActive { ... }` | Petugas yang menginput di luar jam tersebut tidak bisa menyimpan data secara lokal. |
| 7 | `petugas_residu_fcm_service.dart:1-40` | **Inkonsistensi Modul** | **SEDANG** | Penganganan notifikasi FCM Petugas Residu menggunakan instance terpisah dan belum terdaftar di `main.dart` seperti modul Warga/Mahasiswa. | `class PetugasResiduFcmService { ... }` | Push notification untuk tugas residu tidak akan memicu notifikasi sistem lokal. |
| 8 | `petugas_residu_view.dart:126, 133` | **UI / Code Smell** | **RENDAH** | Sisa klausa widget tidak menggunakan kata kunci `const`. | `label: Text('Input Timbangan'),` | Lint warning ringan (tidak mengganggu runtime). |

---

## 4. BROKEN REFERENCES & SISA REFACTOR YANG DITEMUKAN

1. **Komponen Pelaporan Pelanggaran Warga (`LaporPelanggaranView`):**
   * Berkas `lib/app/modules/petugas_residu/views/lapor_pelanggaran_view.dart` dan method `laporViolation()` di `petugas_residu_repository.dart` masih tersisa di repositori.
   * Tombol pemicunya di Dashboard (`PetugasResiduView`) sudah dilepas pada revisi alur terbaru. Ini merupakan sisa refactor yang perlu dibersihkan agar tidak membingungkan *maintenance* mendatang.

---

## 5. DEAD CODE YANG DITEMUKAN

1. **`ApiPetugasResiduRepository.laporViolation()`:**
   * Method ini terdefinisi pada layer repository tetapi tidak lagi memiliki pemanggil di layer UI Notifier.
2. **Model DTO `pelanggaranCount` & `ResiduBinPickup.isPickedUp`:**
   * Field `pelanggaranCount` pada `PetugasResiduDashboard` dan `isPickedUp` pada `ResiduBinPickup` masih tersimpan di model DTO padahal alur penjemputan & violasi sudah dihapus murni menjadi alur input timbangan residu RT/RW.

---

## 6. MASALAH KONFIGURASI & DEPENDENCY

1. **Permission Kamera & Storage di AndroidManifest.xml:**
   * Konfigurasi di `AndroidManifest.xml` sudah mendukung `CAMERA`, `READ_MEDIA_IMAGES`, dan `READ_EXTERNAL_STORAGE`.
   * **Potensi Masalah:** Pada Android 14 (API 34), permission `READ_MEDIA_VISUAL_USER_SELECTED` belum didaftarkan di `AndroidManifest.xml`, yang dapat menyebabkan *partial gallery picker crash* pada perangkat Android versi terbaru.

---

## 7. INKONSISTENSI DENGAN MODUL LAIN (WARGA / MAHASISWA KKN)

| Aspek Kode | Modul Warga / Mahasiswa KKN | Modul Petugas Residu | Rekomendasi Penyelarasan |
|---|---|---|---|
| **Error Handling API** | Menggunakan `NetworkExceptionHelper.getErrorMessage(e)` untuk melempar pesan error eksplisit ke UI. | Menelan error (`catch (_)`) dan mengembalikan `true` / data dummy secara diam-diam. | Diselaraskan agar melempar exception resmi DioException ke Notifier. |
| **Inisialisasi FCM Notifikasi** | Terdaftar secara global di `NotificationEngine` (`lib/app/data/services/notification_engine.dart`). | Menggunakan berkas terisolasi `PetugasResiduFcmService` yang belum di-hook di `main.dart`. | Daftarkan handler payload residu ke `NotificationEngine` utama. |
| **Penyimpanan Token Session** | Menggunakan `flutter_secure_storage` via `AuthRepository`. | Membaca token secara langsung di Dio Interceptor via `ApiClient`. | Pola sudah konsisten via `ApiClient`. |

---

## 8. TOP 5 MASALAH PALING KRITIS (PRIORITAS PERBAIKAN)

1. **`ApiPetugasResiduRepository.submitLog()` Catch Block Swallowing:**
   * *Alasan:* Mengembalikan `true` saat request HTTP gagal, menyebabkan petugas mengira timbangan sampah residu sudah masuk ke Web RT/RW padahal gagal.
2. **`ApiPetugasResiduRepository.changePassword()` Catch Block Swallowing:**
   * *Alasan:* Pengguna merasa kata sandi berhasil diubah, padahal server gagal memprosesnya (potensi kegagalan login berikutnya).
3. **Penyusutan Data Dummy & Unhandled DioException:**
   * *Alasan:* Banyak method repository yang masih mengembalikan *fallback dummy data* alih-alih melempar error saat koneksi internet terputus.
4. **Pembersihan Berkas Sisa Refactor (`lapor_pelanggaran_view.dart`):**
   * *Alasan:* Menghindari kebingungan alur bagi pengembang berikutnya karena alur resmi telah dikunci murni ke Input Sampah Residu RT/RW.
5. **Validasi Berkas Foto Sebelum Kompresi (`ImageCompressor`):**
   * *Alasan:* Mencegah crash `FileSystemException` jika berkas foto tidak ditemukan di direktori lokal perangkat.

---

## 9. DOKUMENTASI FLOW MODUL PETUGAS RESIDU (HANDOVER GUIDE)

### A. Diagram User Flow (Langkah Pengguna)

```text
[Login Akun Petugas Residu]
            │
            ▼
[Verifikasi Whitelist Status (PetugasWhitelistGuardWidget)]
            ├─► Status PENDING/REJECTED ──► [Layar Restriksi (Tunggu Approval RW/DLH)]
            └─► Status APPROVED
                    │
                    ▼
[Main Navigation View (4 Tab Utama)]
    ├── Tab 1: Dashboard (Statistik Total Residu Kg & Daftar Residu RT/RW)
    ├── Tab 2: Input Timbangan Residu (Scan QR / Pilih Lokasi -> Input Berat Kg -> Upload Foto) ──► [Kirim ke Web RT/RW]
    ├── Tab 3: Riwayat Setoran (Timeline Log Timbangan yang Terhubung ke Web RT/RW)
    └── Tab 4: Profil & Ganti Password
```

---

### B. Diagram Technical Flow (Widget -> Notifier -> Repository -> Dio -> Backend)

```text
[TimbanganResiduView (UI)]
   │
   ├─► 1. Petugas menekan "Simpan & Kirim Timbangan"
   │
   ▼
[PetugasResiduNotifier (Riverpod)]
   │
   ├─► 2. Memanggil submitLog(binId, actualWeightKg, classification, photoPath)
   │
   ▼
[ApiPetugasResiduRepository]
   │
   ├─► 3. Kompresi Foto via ImageCompressor (Target < 500KB)
   ├─► 4. Membentuk FormData Multipart Payload
   │
   ▼
[ApiClient / Dio HTTP Client]
   │
   ├─► 5. HTTP POST /api/v1/residu/submit-log
   │
   ▼
[Express.js Backend & Web RT/RW]
   │
   └─► 6. Data tersimpan di Database & Otomatis Tampik di Dashboard Web RT/RW
```

---

### C. Tabel Screen & Berkas Terkait

| Nama Screen | Path Berkas Utama | Controller / Notifier | Fungsi Utama |
|---|---|---|---|
| **Main Container** | `lib/app/modules/petugas_residu/views/petugas_residu_main_navigation_view.dart` | `petugasResiduControllerProvider` | Kontainer Bottom Navigation Bar (4 Tab). |
| **Dashboard** | `lib/app/modules/petugas_residu/views/petugas_residu_view.dart` | `petugasResiduControllerProvider` | Ringkasan statistik total residu Kg & daftar tempat sampah RT/RW. |
| **Input Timbangan** | `lib/app/modules/petugas_residu/timbangan_residu_view.dart` | `petugasResiduControllerProvider` | Form input berat nyata timbangan residu (Kg) & upload foto ke Web RT/RW. |
| **Riwayat** | `lib/app/modules/petugas_residu/views/riwayat_petugas_residu_view.dart` | `petugasResiduControllerProvider` | Histori log pencatatan timbangan yang tersinkronkan ke Web RT/RW. |
| **Profil Petugas** | `lib/app/modules/petugas_residu/views/petugas_residu_profil_view.dart` | `authProvider` & `petugasResiduControllerProvider` | Informasi akun petugas & tombol ganti password/logout. |

---

### D. Tabel Endpoint API yang Dipakai

| HTTP Method | Endpoint Path | Payload / Query Parameters | Response | Berkas Pemanggil |
|---|---|---|---|---|
| `GET` | `/api/v1/residu/dashboard` | `-` | `{ success: true, data: PetugasResiduDashboard }` | `api_petugas_residu_repository.dart` |
| `GET` | `/api/v1/residu/jadwal-harian` | `?kelurahan=...&rtRw=...` | `{ success: true, data: List<ResiduBinPickup> }` | `api_petugas_residu_repository.dart` |
| `POST` | `/api/v1/residu/submit-log` | Multipart FormData (`binId`, `actualWeightKg`, `classification`, `image`) | `{ success: true, message: "..." }` | `api_petugas_residu_repository.dart` |
| `GET` | `/api/v1/residu/riwayat` | `?range=...&type=...` | `{ success: true, data: List<HistoryMap> }` | `api_petugas_residu_repository.dart` |
| `POST` | `/api/v1/auth/change-password` | `{ oldPassword, newPassword }` | `{ success: true, message: "..." }` | `api_petugas_residu_repository.dart` |

---

### E. Daftar State & Model Penting

1. **`PetugasResiduDashboard`:**
   * Menyimpan statistik petugas (`petugasId`, `name`, `assignedZone`, `totalWeightKg`, `kpiScore`, `whitelistStatus`).
2. **`ResiduBinPickup`:**
   * Menyimpan data tempat sampah residu di wilayah RT/RW (`binId`, `binCode`, `wargaName`, `address`, `kelurahan`, `rtRw`, `volumePercentage`).
3. **`PetugasResiduState`:**
   * Pengelola state Riverpod (`isLoading`, `dashboard`, `jadwalList`, `historyList`, `errorMessage`).

---

### F. Daftar Bagian yang Belum Lengkap / Perlu Dibereskan pada Sesi Perbaikan

1. **Pembersihan Catch Block Error Swallowing:** Pengubahan blok `catch (_)` pada `api_petugas_residu_repository.dart` agar melempar exception resmi sehingga error terdeteksi di UI Notifier.
2. **Pembersihan Berkas Terisolasi:** Menghapus/menonaktifkan `lapor_pelanggaran_view.dart` agar proyek murni mencerminkan alur tunggal Input Sampah Residu RT/RW.
3. **Penanganan Offline Draft:** Menambahkan mekanisme penyimpanan sementara (SharedPreferences/Hive) jika petugas menginputkan timbangan saat koneksi internet terputus.

---

## 10. REKOMENDASI LANGKAH SELANJUTNYA

Apabila Anda telah me-review laporan audit ini, urutan pengerjaan perbaikan pada sesi berikutnya yang disarankan adalah:

1. **Langkah 1:** Perbaiki penanganan exception pada `ApiPetugasResiduRepository` (ubah `catch (_) { return true; }` menjadi penanganan DioException resmi).
2. **Langkah 2:** Hapus/arsipkan berkas sisa refactor (`lapor_pelanggaran_view.dart`) agar struktur repositori bersih.
3. **Langkah 3:** Tambahkan validasi kelayakan berkas foto sebelum proses kompresi di `ImageCompressor`.
4. **Langkah 4:** Hubungkan handler FCM Notifikasi Petugas ke `NotificationEngine` utama aplikasi.
