# Dokumentasi Pengembang: Modul Mahasiswa KKN

Dokumen ini berisi panduan teknis, arsitektur, dan penjelasan implementasi **Modul Mahasiswa KKN** pada aplikasi *BERSEKA* untuk memudahkan *developer* lain memahami, memelihara, maupun mengembangkan fitur ini lebih lanjut.

---

## 📌 Ringkasan Fitur

Modul Mahasiswa KKN berfokus pada **pendampingan warga** dan **absensi/presensi lokasi mahasiswa**. Fitur utama mencakup:

1. **Dashboard KKN (`/mahasiswa`)**: Menampilkan kuota pendampingan, progres target, poin kontribusi, status tracking lokasi, dan daftar warga dampingan.
2. **Registrasi Warga (`/registrasi-warga`)**: Memungkinkan mahasiswa mendaftarkan warga yang belum dapat mengakses aplikasi. Akun warga yang dibuat otomatis terikat (*auto-bound*) dengan mahasiswa yang mendaftarkannya.
3. **Daftar Warga Dampingan (`/daftar-warga`)**: Menampilkan seluruh warga yang didampingi dilengkapi fitur pencarian/filter dan indikator kebutuhan edukasi ulang.
4. **Detail Warga Dampingan (`/detail-warga`)**: Visualisasi statistik kinerja pemilahan warga (persentase benar/salah, total berat, distribusi kategori sampah) serta riwayat aktivitas pemilahan.
5. **Background Location Ping**: Mengirimkan koordinat GPS mahasiswa ke backend secara berkala (interval 5 menit) untuk pencatatan kehadiran otomatis.

---

## 🏗️ Struktur Berkas (File Structure)

Seluruh komponen modul ini ditempatkan sesuai arsitektur *feature-first* / modular aplikasi:

```text
lib/
├── app/
│   ├── data/
│   │   ├── models/
│   │   │   └── mahasiswa_kkn_models.dart      # Data Models (Dashboard, Warga, Log, Request)
│   │   ├── repositories/
│   │   │   ├── kkn_repository.dart            # Abstract Interface Repository
│   │   │   └── api_kkn_repository.dart        # Concrete Implementation (Dio HTTP)
│   │   └── providers/
│   │       └── repository_providers.dart      # Provider DI (kknRepositoryProvider)
│   ├── modules/
│   │   └── mahasiswa/
│   │       ├── controllers/
│   │       │   ├── mahasiswa_controller.dart        # Dashboard Controller
│   │       │   ├── registrasi_warga_controller.dart # Form Registration Controller
│   │       │   ├── detail_warga_controller.dart     # Warga Detail & Analytics Controller
│   │       │   └── location_ping_controller.dart    # Location Tracking & Ping Controller
│   │       └── views/
│   │           ├── mahasiswa_view.dart              # Dashboard Screen UI
│   │           ├── registrasi_warga_view.dart       # Form Registration UI
│   │           ├── daftar_warga_view.dart          # List Warga Screen UI
│   │           └── detail_warga_view.dart           # Detail & Analytics UI
│   └── routes/
│       ├── app_routes.dart                    # Constants Route (/mahasiswa, /registrasi-warga, dll)
│       └── app_pages.dart                     # Route Generator / Switch Case Routing
```

---

## 🔄 State Management & Pattern Arsitektur

Modul ini dibangun menggunakan **Flutter Riverpod** dengan *StateNotifier pattern*.

### 1. Data Layer & Dependency Injection
- **Repository Interface**: `KknRepository` bertindak sebagai abstraksi untuk pemanggilan data.
- **Provider**: Registered di `repository_providers.dart` sebagai `kknRepositoryProvider`.
  ```dart
  final kknRepositoryProvider = Provider<KknRepository>((ref) {
    return ApiKknRepository(apiClient: ref.read(apiClientProvider));
  });
  ```

### 2. State Controllers
- `mahasiswaControllerProvider`: Mengelola data dashboard dan daftar warga dampingan. Mengambil data dari `GET /kkn/dashboard` dan `GET /kkn/warga-dampingan` secara paralel (`Future.wait`).
- `registrasiWargaControllerProvider`: Mengelola state form pendaftaran warga (loading, error handling HTTP status, success trigger).
- `detailWargaControllerProvider`: Menerima data `WargaDampingan` dari *navigation arguments* dan menghitung total akumulasi berat sampah.
- `location_ping_controller.dart`: Mengelola interval timer periodic (5 menit) dan pengiriman lokasi GPS menggunakan `geolocator`.

---

## 🔌 Kontrak & Integrasi API

Seluruh request API otomatis membawa header otentikasi JWT melalui `ApiClient` (Dio interceptor).

### 1. Dashboard KKN
- **Endpoint**: `GET /api/kkn/dashboard`
- **Response Handling**:
  ```json
  {
    "studentKkn": { "nim": "12345678", "jurusan": "Teknik Informatika" },
    "totalRegisteredBins": 12,
    "assignmentLimit": 20,
    "remainingQuota": 8,
    "progressPercentage": 60.0,
    "contributionPoints": 150
  }
  ```

### 2. Daftar Warga Dampingan
- **Endpoint**: `GET /api/kkn/warga-dampingan`
- **Response Handling**: Mengembalikan daftar warga beserta 5 log pemilahan terakhir (`recentLogs`).

### 3. Registrasi Warga Baru
- **Endpoint**: `POST /api/v1/auth/register/warga`
- **Payload Request**:
  ```json
  {
    "phone": "081234567890",
    "password": "password123",
    "name": "Budi Santoso",
    "rtRw": "001/002",
    "kelurahan": "Sukajadi"
  }
  ```
- **Catatan**: Backend secara otomatis menghubungkan akun warga baru yang dibuat dengan Mahasiswa KKN berdasarkan token JWT pada request header.

### 4. Ping Lokasi Mahasiswa
- **Endpoint**: `POST /api/kkn/location-ping`
- **Payload Request**:
  ```json
  {
    "latitude": -6.917464,
    "longitude": 107.619123
  }
  ```

---

## 📐 Aturan Bisnis Khusus (Business Rules)

### Calculation Local — Threshold Edukasi Ulang (`needsReeducation`)
Karena backend **tidak** mengirimkan flag `needs_reeducation` secara terpisah, Flutter menghitung logika ini secara lokal pada model `WargaDampingan` (`mahasiswa_kkn_models.dart`):

```dart
/// Total aktivitas pemilahan
int get totalActivities => recentLogs.length;

/// Jumlah pemilahan salah (discrepancyStatus != 'NONE')
int get incorrectCount => recentLogs.where((l) => !l.isCorrect).length;

/// Persentase kesalahan (0–100%)
double get errorPercentage =>
    totalActivities > 0 ? (incorrectCount / totalActivities) * 100 : 0.0;

/// Flag edukasi ulang aktif jika persentase kesalahan > 30%
bool get needsReeducation => errorPercentage > 30;
```

---

## 🗺️ Navigasi & Rute (Routes)

Rute terdaftar pada `AppRoutes` dan `AppPages`:

| Constant Route | Path | View Class | Arguments |
|----------------|------|------------|-----------|
| `AppRoutes.mahasiswa` | `/mahasiswa` | `MahasiswaView` | - |
| `AppRoutes.registrasiWarga` | `/registrasi-warga` | `RegistrasiWargaView` | - |
| `AppRoutes.daftarWarga` | `/daftar-warga` | `DaftarWargaView` | - |
| `AppRoutes.detailWarga` | `/detail-warga` | `DetailWargaView` | `WargaDampingan` (Object) |

### Contoh Navigasi ke Detail Warga:
```dart
Navigator.pushNamed(
  context,
  AppRoutes.detailWarga,
  arguments: wargaDampinganObject,
);
```

---

## 🎨 Design System & Palette Warna

Semua tampilan mengikuti token desain global aplikasi:
- **Primary Color**: `AppColors.primaryGreen` (`#0EA5E9` / `#10B981` disesuaikan dengan `AppColors`)
- **Background**: `AppColors.backgroundCanvas` (`#F8FAFC`)
- **Typography**: Inherit dari `ThemeData` global (Google Fonts Poppins).
- **Status Colors**:
  - `AppColors.success` (`#10B981`) — Pemilahan benar / tracking aktif
  - `AppColors.dangerRed` (`#EF4444`) — Pemilahan salah / tracking nonaktif
  - `AppColors.warningOrange` (`#F59E0B`) — Alert butuh edukasi ulang

---

## 🧪 Panduan Pengujian & Maintenance

1. **Uji Coba Registrasi**: Pastikan nomor HP yang diinput belum pernah terdaftar. Jika mengembalikan status HTTP 409, controller akan menampilkan pesan *"Nomor HP sudah terdaftar"*.
2. **Uji Coba Location Ping**: Di emulator / device fisik, pastikan Izin Lokasi (*Location Permission*) diset ke *Allow*. Periksa konsol logs atau network inspector untuk memastikan ping dikirim tiap 5 menit.
3. **Flutter Analyze**: Jalankan perintah berikut sebelum melalukan `git push` untuk memastikan tidak ada lint/syntax errors:
   ```bash
   flutter analyze
   ```
