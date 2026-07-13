# PRD Mobile — Pilah Sampah Cerdas
## Aplikasi Warga (Flutter) | pilahsampah.id
**Versi:** 1.2.0 | **Tanggal:** 12 Juli 2026 | **Status:** Development — Mock Mode
**Platform:** Android (min API 24) · iOS (min 13.0) · Web · Windows · macOS · Linux

> Dokumen ini adalah PRD spesifik untuk **Aplikasi Mobile Warga (Flutter)**.
> Mengacu pada: `prd.md`, `srs.md`, `sdd.md`, `ui_ux_flow.md` + desain visual stitch_ui aktual.

---

## 1. Ringkasan Produk

Aplikasi mobile **Pilah Sampah Cerdas** memungkinkan warga Kecamatan Coblong, Kota Bandung untuk:
- Menyetor sampah terpilah secara digital dengan verifikasi AI
- Mendapatkan poin reward dari setiap setoran yang tervalidasi
- Mengelola tong sampah rumah tangga (aktivasi & pengajuan pengosongan)
- Memantau riwayat pemilahan dan peringkat di RT

**Target pengguna:** Role `WARGA` — penghuni rumah tangga di 6 kelurahan Kecamatan Coblong.

---

## 2. Tujuan Produk

| Tujuan | Metrik |
|---|---|
| Meningkatkan kedisiplinan pemilahan | ↓ % transaksi `BIN_TYPE_MISMATCH` |
| Memberikan insentif berbasis poin | Total poin terkumpul per warga per bulan |
| Memudahkan pelaporan tong penuh | Waktu rata-rata pengosongan sejak pengajuan |

---

## 3. Design System (Aktual dari Implementasi)

Berdasarkan `app_colors.dart` dan `app_theme.dart` yang sudah diimplementasi:

| Token | Nilai | Penggunaan |
|---|---|---|
| **Primary Blue** | `#0056A4` | AppBar, header, tombol utama, tab aktif |
| **Primary Green** | `#2E7D32` / `#4CAF50` | Organik, sukses, FAB, badge |
| **Non-Organic** | `#F59E0B` | Anorganik, warning 70–90% |
| **Warning Orange** | `#FF6B35` | Mismatch dialog, ajukan pengosongan |
| **Danger Red** | `#EF4444` | Error, kritis >90%, offline banner |
| **Background** | `#F5F7FA` | Canvas utama |
| **Card** | `#FFFFFF` | Card background dengan shadow |
| **Font** | Poppins (Google Fonts) | Semua text — Bold h1-h3, Regular body |
| **Tema** | Light Mode Only | Tidak ada dark mode |

---

## 4. Screens & User Flow (Aktual)

### 4.1 Splash Screen — Route `/`
- Background **putih bersih**
- Teks "**Pilah Sampah Cerdas**" — Poppins Bold, biru `#0056A4`, left-aligned
- Teks tagline — Poppins SemiBold, hijau `#2E7D32`
- **3 dot indicator** di bawah — dot tengah aktif (biru, lebih lebar)
- Durasi 2.5 detik → cek auth → redirect ke Login atau Main

*Berbeda dari desain dokumen asli (splash_screen_minimalist.png) yang menampilkan logo — versi aktual menggunakan text-only minimalis sesuai permintaan.*

---

### 4.2 Login — Route `/login`
- Header biru 45% layar atas dengan **logo bulat** (`assets/logosampahpilih.jpg`)
- Judul "Pilah Sampah" putih di header
- Card putih rounded (`borderRadius: 32`) di bawah header
- Form: **NIK (16 digit)** + Kata Sandi dengan toggle visibility
- Tombol **MASUK** biru penuh
- Footer: `pilahsampah.id` + copyright

---

### 4.3 Main Shell — Route `/main`

**Bottom Navigation Bar** (mobile) dengan 5 tab + FAB hijau bulat di tengah:

| Index | Label | Icon | Route |
|---|---|---|---|
| 0 | Home | `home_rounded` | BerandaScreen |
| 1 | History | `history_rounded` | RiwayatScreen |
| 2 (FAB) | Scan | `qr_code_scanner_rounded` | `/scan` (push) |
| 3 | Profile | `person_rounded` | ProfilScreen |
| 4 | Poin | `stars_rounded` | PoinScreen |

**Tablet ≥ 600dp:** NavigationRail kiri dengan logo + FAB kecil hijau.

**Offline:** FAB berubah abu-abu, `onPressed: null`.

**OfflineBanner** merah muncul di atas seluruh konten saat offline.

---

### 4.4 Beranda (Home) — Tab 0

**Header biru** (primary blue background):
- Avatar logo (`logosampahpilih.jpg`) dalam kotak putih rounded
- Salam waktu + nama warga
- Chip RT/RW di kanan
- Ikon notifikasi dengan red dot badge

**Stats Card** (3 kolom):
- Daily Points (biru)
- Total Points (hijau, dari `totalPointsProvider`)
- Peringkat (kuning, mock: "#3")

**Aksi Cepat** (2 tombol):
- "**Scan Sampah**" — gradient hijau gelap→terang, `onTap: null` saat offline
- "**Aktivasi Bin**" — outline biru, selalu aktif

**Riwayat Terakhir** (5 entri):
- Ikon tong dengan warna sesuai jenis (hijau=organik, kuning=anorganik)
- Nama, jam WIB, poin didapat
- Badge "SELESAI" hijau

---

### 4.5 Alur Setor Sampah — Route `/scan`

Sesuai `prd.md §2.1` — 4 langkah:

**Step 0 — Foto Sampah** (state: `_photoTaken = false`)
- Background kamera gelap simulasi
- Scan frame dengan corner aksen hijau
- Bottom sheet: "**Pindai Sampah**" + tombol "**Ambil Foto Sampah**"
- Offline: tampil pesan merah, tombol disabled

**Step 0b — Preview Foto** (state: `_photoTaken = true`)
- Preview placeholder (kotak abu dengan ikon gambar)
- Info kompresi: `✅ Foto dikompresi: X.XMB → XXXKB`
- Tombol "**Deteksi Sampah**" + "Ambil Ulang Foto"
- *Simulasi kompresi JPEG 85% < 1MB sesuai `prd.md §2.1 step 2`*

**Step 1 — Proses AI** (currentStep = 1)
- Loading spinner sambil AI memproses

**Step 2 — Scan QR Tong** (currentStep = 2)
- Kamera QR dengan frame hijau
- **Banner kuning** atas: info jenis sampah terdeteksi + arahan tong
- Bottom sheet: "Verifikasi Lokasi Pembuangan" + progress bar 3 step
- Tombol mock submit QR

**Step 3 — Sukses** (currentStep = 3)
- Modal putih overlay gelap
- Checkmark hijau lingkaran
- "**Pencatatan Berhasil!**"
- Card: KATEGORI + BERAT
- Progress bar kapasitas tong
- Banner kuning poin: "Selamat! Anda mendapat +X poin"
- Tombol **SELESAI**

**Error Dialogs:**
- `BIN_TYPE_MISMATCH` → dialog "**Tidak Sesuai!**" orange — SAMPAH vs TONG + tombol "SCAN ULANG TONG YANG BENAR"
- `AI_TIMEOUT` / `IMAGE_UNREADABLE` → dialog "**Scan Gagal**" merah + tombol "COBA ULANG"
- Lainnya → SnackBar merah

---

### 4.6 Riwayat Pemilahan — Tab 1

**AppBar biru** + ikon notifikasi

**Filter tabs** (3 pill):
- Semua (default aktif biru)
- Minggu Ini
- Bulan Ini

**Summary card** (2 kolom):
- Total kg Organik (hijau)
- Total kg Anorganik (kuning)

**List riwayat** grouped by date label ("TERBARU" / "KEMARIN" / tanggal):
- Ikon tong warna jenis
- Nama jenis + berat kg
- Tanggal & jam
- Badge "✅ TERVALIDASI" hijau

---

### 4.7 Poin Saya — Tab 4

**Header biru besar** (custom, bukan AppBar):
- "TOTAL POIN TERKUMPUL" label abu
- Angka total poin putih besar (Poppins w800)
- "PTS" label putih kecil
- Chip peringkat: "🏆 #3 di RT 03"
- Progress bar menuju level berikutnya

**Stats 3 kolom** (card putih):
- Hari Ini (+5%)
- Minggu Ini (+12%, dengan garis bawah biru aktif)
- Bulan Ini (+8%)

**Riwayat Poin** (list):
- Ikon tong warna jenis
- Label "Setor Sampah Organik/Anorganik"
- Tanggal + jam
- "+X pts" hijau

**Info Poin** card biru muda di bawah

---

### 4.8 Profil Rumah Tangga — Tab 3

**AppBar biru** + notifikasi

**Header biru** (extended dari AppBar):
- Avatar ikon rumah (`Icons.home_rounded`) dalam lingkaran putih bertepi + badge hijau centang
- "Keluarga [Nama]" putih bold
- Chip RT/RW biru transparan

**Data Rumah Tangga** (card putih):
- Kepala Keluarga (bold)
- Alamat
- Telepon
- Terdaftar Sejak

**Tong Saya** + tombol "Kelola":
- 2 card tong (Organik + Anorganik) dengan border warna kiri
- Status AKTIF/NON-AKTIF + dot status

**Menu Actions** (card putih, list tile):
- 🟢 **Aktivasi Tong Baru** → `/aktivasi-bin`
- 🟠 **Ajukan Pengosongan Tong** → `/reset-bin`
- 🔴 **Keluar** → konfirmasi dialog → logout

Footer copyright bawah.

---

### 4.9 Aktivasi Tong Sampah — Route `/aktivasi-bin`

**AppBar biru** "Aktivasi Tong Sampah" + notifikasi

**Area kamera** (gelap/teal simulasi):
- Scan frame dengan corner biru (→ hijau saat detected)
- Input QR manual + tombol search (saat belum detected)

**Bottom sheet putih** rounded:
- Sebelum detect: ikon scanner + instruksi + "atau masukkan ID tong di atas"
- Setelah detect: "✅ **Tong Terdeteksi!**" + tombol close (X)
  - Card info abu: ID PERANGKAT + TIPE (dengan dot warna) + LOKASI
  - Tombol **AKTIVASI TONG INI** biru penuh (height 52)
  - Keterangan: "Gunakan tong ini untuk mengumpulkan poin..."

**Success screen**: checkmark hijau bulat + "Tong Berhasil Diaktivasi!" + kembali

---

### 4.10 Ajukan Pengosongan Tong — Route `/reset-bin`

**AppBar biru** "Ajukan Pengosongan Tong"

**Jika semua tong aman** (< 90%):
- Ikon centang hijau besar
- "Semua tong masih dalam kondisi aman."

**Jika ada tong kritis** (≥ 90%):
- Banner peringatan merah muda
- Label "Pilih Tong"
- List tong kritis dengan progress bar merah
- Tombol **Ajukan Reset** merah per tong
- ⚠️ Mock: `evidencePhotoPath: 'mock_evidence_photo.jpg'` (foto belum via kamera)

**Success state**:
- Checkmark hijau + "Pengajuan pengosongan terkirim!"
- Chip status: "Status: Menunggu Persetujuan" kuning


---

## 5. Non-Functional Requirements (Mobile)

Mengacu `srs.md`:

| NFR | Spesifikasi | Status Implementasi |
|---|---|---|
| **NFR-02** AI Daily Limit | Max 50 request/user/hari | ✅ `_checkAndIncrementAiQuota()` di MockBinRepository |
| **NFR-05** Online-Only | Banner merah offline, tombol disabled | ✅ OfflineBanner + isOnlineProvider |
| **NFR-05** Kompresi Foto | < 1MB sebelum upload | ✅ Simulasi (nanti image_picker nyata) |
| **NFR-06** Responsif | Compact/Medium/Large/Tablet breakpoint | ✅ ResponsiveLayout + NavigationRail |
| **Geofencing** | Haversine ≤ 10m (sdd.md §4.2) | ✅ `_haversineDistanceMeters()` |
| **Token Storage** | flutter_secure_storage | ⚠️ Belum persisten (mock in-memory) |
| **Cache Offline** | SharedPreferences riwayat & poin | ⚠️ Belum diimplementasi |
| **AI Timeout** | 2000ms | ✅ Delay simulasi 500–1800ms |

---

## 6. RBAC — Endpoint yang Boleh Diakses WARGA

Sesuai `sdd.md §11`:

| Endpoint | Boleh? |
|---|---|
| `POST /auth/login` | ✅ |
| `POST /auth/refresh` | ✅ |
| `POST /auth/logout` | ✅ |
| `POST /waste/detect-mock` | ✅ |
| `POST /bins/scan` | ✅ |
| `POST /bins/reset-request` | ✅ |
| `GET /monitoring/live` | ❌ Tidak ada di mobile |
| Master Data CRUD | ❌ Tidak ada di mobile |
| Bulk Generate/Import | ❌ Tidak ada di mobile |

---

## 7. API yang Dikonsumsi Mobile App

Semua endpoint merujuk `sdd.md §3, §6, §7, §9`:

### 7.1 Auth

```
POST /api/v1/auth/login
Body JSON: { "nik": "16_digit", "password": "string" }
Response: { success, data: { accessToken (via Cookie), user: {id,name,role,kelurahan,rtRw,fcmToken} } }
Error: 401 INVALID_CREDENTIALS | 429 RATE_LIMIT_EXCEEDED

POST /api/v1/auth/refresh
Cookie: psc_refresh_token=<token>
Response: { success: true }  ← token baru via Set-Cookie
Error: 401 REFRESH_TOKEN_EXPIRED

POST /api/v1/auth/logout
Response: { success: true }
```

### 7.2 AI Deteksi Sampah

```
POST /api/v1/waste/detect-mock
Auth: Bearer token
Content-Type: multipart/form-data
Body: { userId, photo: <file.jpg max 1MB> }
Response: { success, data: { detectedType, volumeEstimate, isBlurry, requestId } }
Error: 408 AI_TIMEOUT | 422 IMAGE_UNREADABLE | 429 DAILY_LIMIT_EXCEEDED
```

### 7.3 Scan QR & Commit Transaksi

```
POST /api/v1/bins/scan
Auth: Bearer token
Body JSON:
{
  "qrCode": "PSC-DAGO-ORG-0001",
  "userId": "uuid",
  "detectedType": "ORGANIC",
  "estimatedVolume": 3.4,
  "householdId": "uuid",
  "userLat": -6.9034,   ← GPS warga wajib
  "userLng": 107.6198
}
Response: { success, data: { weightKg, pointsAwarded, newBinVolume } }
Error: 400 BIN_TYPE_MISMATCH | BIN_OVERFLOW | LOCATION_OUT_OF_RANGE | 404 RESOURCE_NOT_FOUND
```

### 7.4 Aktivasi Tong

```
POST /api/v1/bins/activate
Auth: Bearer token
Body JSON: { "qrSerial": "PSC-...", "userId": "uuid", "householdId": "uuid" }
Response: { success, data: { binId, qrSerial, binType, location, maxCapacityL } }
Error: 409 BIN_ALREADY_ACTIVE | 404 RESOURCE_NOT_FOUND
```

### 7.5 Data Tong Milik Warga~

```
GET /api/v1/bins/my-bins?householdId=uuid
Auth: Bearer token
Response: { success, data: [ { binId, qrSerial, binType, currentVolumeL,
            maxCapacityL, capacityPercent, status, isActive, lat, lng } ] }
```

### 7.6 Riwayat Pemilahan

```
GET /api/v1/waste/logs?userId=uuid&limit=20&offset=0&filter=all|this_week|this_month
Auth: Bearer token
Response: { success, data: [ { id, wasteType, volumeLiter, weightKg,
            pointsAwarded, binQrSerial, createdAt, status } ],
            meta: { totalOrganicKg, totalNonOrganicKg, totalCount } }
```

### 7.7 Riwayat & Total Poin

```
GET /api/v1/points/history?userId=uuid&limit=20
Auth: Bearer token
Response: { success, data: { totalPoints, rankInRt, todayPoints, weekPoints,
            monthPoints, todayPercent, weekPercent, monthPercent,
            history: [ { id, points, wasteType, description, createdAt } ] } }
```

### 7.8 Ajukan Pengosongan Tong

```
POST /api/v1/bins/reset-request
Auth: Bearer token
Content-Type: multipart/form-data
Body: { binId: "uuid", evidencePhoto: <file.jpg max 1MB> }  ← foto WAJIB
Response: { success, data: { resetRequestId, status: "PENDING" } }
Error: 400 BIN_NOT_CRITICAL | 404 RESOURCE_NOT_FOUND
```

### 7.9 Status Pengajuan Reset

```
GET /api/v1/bins/reset-request/my-requests?userId=uuid
Auth: Bearer token
Response: { success, data: [ { resetRequestId, binId, binQrSerial,
            status: PENDING|APPROVED|REJECTED, rejectReason, createdAt, updatedAt } ] }
```

### 7.10 Profil Warga

```
GET /api/v1/users/profile
Auth: Bearer token
Response: { success, data: { id, name, nik, role, phone, kelurahan,
            rtRw, address, registeredAt, household: { id, lat, lng } } }
```

### 7.11 Notifikasi

```
GET /api/v1/notifications?userId=uuid&limit=20
Auth: Bearer token
Response: { success, data: [ { id, title, message, type, isRead, createdAt } ],
            unreadCount: 2 }
```

### 7.12 Register FCM Token

```
POST /api/v1/users/fcm-token
Auth: Bearer token
Body JSON: { "userId": "uuid", "fcmToken": "firebase-token" }
Response: { success: true }
```

---

## 8. Ringkasan API per Screen

| Screen | Endpoint yang dipanggil |
|---|---|
| Splash | `POST /auth/refresh` |
| Login | `POST /auth/login` → `POST /users/fcm-token` |
| Beranda | `GET /bins/my-bins` · `GET /waste/logs` (5 terbaru) · `GET /points/history` (total) |
| Scan Step 1 | *(lokal: kamera + kompresi)* |
| Scan Step 2 | `POST /waste/detect-mock` |
| Scan Step 3 | `POST /bins/scan` (+ GPS) |
| History | `GET /waste/logs` (dengan filter) |
| Poin | `GET /points/history` |
| Profil | `GET /users/profile` · `GET /bins/my-bins` |
| Aktivasi Bin | `POST /bins/activate` |
| Reset Bin | `GET /bins/my-bins` · `POST /bins/reset-request` · `GET /bins/reset-request/my-requests` |
| Notifikasi | `GET /notifications` |
| Logout | `POST /auth/logout` |

---

## 9. Error Handling Global

Format error (sdd.md §10):
```json
{ "success": false, "error": "SCREAMING_SNAKE_CASE", "message": "...", "details": {} }
```

| Error Code | HTTP | Layar | UI Response |
|---|---|---|---|
| `INVALID_CREDENTIALS` | 401 | Login | SnackBar merah |
| `REFRESH_TOKEN_EXPIRED` | 401 | Semua | Redirect ke Login |
| `UNAUTHORIZED` | 403 | Semua | Redirect ke Login |
| `RESOURCE_NOT_FOUND` | 404 | Scan, Aktivasi, Reset | SnackBar |
| `BIN_TYPE_MISMATCH` | 400 | Scan Step 3 | Dialog "Tidak Sesuai!" orange |
| `BIN_OVERFLOW` | 400 | Scan Step 3 | SnackBar merah |
| `LOCATION_OUT_OF_RANGE` | 400 | Scan Step 3 | SnackBar merah |
| `BIN_NOT_CRITICAL` | 400 | Reset Bin | Tampil "Semua tong aman" |
| `BIN_ALREADY_ACTIVE` | 409 | Aktivasi | SnackBar merah |
| `AI_TIMEOUT` | 408 | Scan Step 2 | Dialog "Scan Gagal" merah |
| `IMAGE_UNREADABLE` | 422 | Scan Step 2 | Dialog "Scan Gagal" merah |
| `DAILY_LIMIT_EXCEEDED` | 429 | Scan Step 2 | SnackBar merah |
| `RATE_LIMIT_EXCEEDED` | 429 | Login | SnackBar merah |
| `INTERNAL_SERVER_ERROR` | 500 | Semua | SnackBar generic |

---

## 10. Dependency Package

Sesuai `sdd.md §12` dan `pubspec.yaml` aktual:

| Package | Versi | Kegunaan |
|---|---|---|
| `flutter_riverpod` | ^2.6.1 | State management |
| `dio` | ^5.8.0 | HTTP client (disiapkan, belum aktif) |
| `mobile_scanner` | ^6.0.10 | QR Scanner (Android/iOS, guard di desktop) |
| `image_picker` | ^1.1.2 | Kamera + galeri (nanti ganti simulasi) |
| `geolocator` | ^13.0.4 | GPS koordinat |
| `flutter_secure_storage` | ^9.2.4 | Token storage |
| `firebase_messaging` | ^15.2.5 | Push notification FCM |
| `connectivity_plus` | ^6.1.4 | Monitor koneksi real-time |
| `shared_preferences` | ^2.5.3 | Cache offline |
| `google_fonts` | ^6.2.1 | Poppins font |
| `equatable` | ^2.0.7 | Value equality entity |
| `intl` | ^0.20.2 | Format tanggal Indonesia |
| `uuid` | ^4.5.1 | Request ID |
| `flutter_svg` | ^2.0.10+1 | SVG icon support |

---

## 11. QC — Kesesuaian Dokumen vs Implementasi

### ✅ SESUAI

| Item | Dokumen | Implementasi |
|---|---|---|
| AI detect flow 3 step | prd.md §2.1 | scan_flow_screen.dart ✓ |
| Geofencing Haversine 10m | sdd.md §4.2 | mock_bin_repository.dart ✓ |
| Poin ORGANIC 0.4×100 | srs.md FR-03 | AppConfig + mock_bin_repository ✓ |
| Poin NON_ORGANIC 0.2×100 | srs.md FR-03 | AppConfig + mock_bin_repository ✓ |
| Kapasitas max 25L | srs.md FR-02 | AppConfig.binMaxCapacityLiters ✓ |
| Kritis threshold 90% | srs.md FR-04 | AppConfig.binCriticalThresholdPercent ✓ |
| AI daily limit 50/hari | srs.md NFR-02 | _checkAndIncrementAiQuota() ✓ |
| AI timeout 2000ms | srs.md FR-01 | AppConfig.aiTimeoutMs ✓ |
| Online-only enforcement | srs.md NFR-05 | OfflineBanner + isOnlineProvider ✓ |
| Responsif Flutter 4 breakpoint | ui_ux_flow.md §5.2 | ResponsiveLayout + NavigationRail ✓ |
| RBAC WARGA (no monitoring) | sdd.md §11 | Tidak ada live monitoring di mobile ✓ |
| Error codes SCREAMING_SNAKE_CASE | sdd.md §10 | Semua error code sesuai ✓ |
| Foto reset menggunakan upload | sdd.md §7.1 | Interface ada (`evidencePhotoPath`) ✓ |
| Aktivasi tong dari QR | prd.md §4.1 | aktivasi_bin_screen.dart ✓ |
| Poppins font | ui_ux_flow.md §1 | GoogleFonts.poppins() + DefaultTextStyle ✓ |
| Light Mode Only | ui_ux_flow.md §1 | Tidak ada darkTheme ✓ |

### ⚠️ PERBEDAAN DESAIN (Disengaja — desain stitch_ui vs visual aktual)

| Item | Dokumen Asli | Implementasi Aktual | Keterangan |
|---|---|---|---|
| Splash screen | Logo + hijau (splash_screen_minimalist.png) | **White bg + teks biru/hijau + dot indicator** | Diganti sesuai permintaan user |
| Primary color | Hijau `#4CAF50` sebagai primary utama | **Biru `#0056A4`** sebagai primary dominan | Mengikuti desain visual yang disetujui |
| Beranda layout | Tombol organik/anorganik langsung | **Stats card + Aksi Cepat (Scan Sampah + Aktivasi Bin)** | Mengikuti desain visual baru |
| Bottom Nav | 5 tab biasa | **4 tab + FAB bulat hijau di tengah** | Mengikuti desain visual baru |

### ⚠️ BELUM DIIMPLEMENTASI (Mock/Placeholder)

| Item | Dokumen | Status | Keterangan |
|---|---|---|---|
| Foto bukti reset via kamera | prd.md §3.1 | ⚠️ Mock: `'mock_evidence_photo.jpg'` | image_picker belum dipanggil |
| Token storage persisten | sdd.md §4.1 | ⚠️ In-memory saja | flutter_secure_storage belum dipakai |
| Cache offline riwayat/poin | srs.md NFR-05 | ⚠️ Belum ada | SharedPreferences belum dipakai |
| Halaman notifikasi | sdd.md tabel notifications | ⚠️ Ikon ada, halaman belum ada | Bell icon tidak fungsional |
| Status pengajuan reset | prd.md §3.1 | ⚠️ Belum ada monitoring status | Setelah submit tidak bisa dilihat |
| FCM initialization | sdd.md §13 FCM | ⚠️ Belum diinisialisasi | Butuh google-services.json |

---

*© 2026 Pilah Sampah Cerdas — Kecamatan Coblong, Kota Bandung*
*Dokumen ini adalah PRD spesifik Mobile App v1.1.0 — referensi platform lain: `docs/prd.md`*

---

## 12. Update v1.2.0 — Kamera & QR Scanner Nyata

### 12.1 Perubahan dari v1.1.0

Pada versi ini, seluruh simulasi kamera dan QR scanner digantikan dengan implementasi nyata menggunakan `image_picker` dan `mobile_scanner`.

#### Yang Diubah

| Sebelumnya (v1.1.0) | Sekarang (v1.2.0) |
|---|---|
| Foto sampah: tombol simulasi `_simulateCapture()` | `image_picker` — kamera native atau galeri nyata |
| QR tong: input teks manual hardcode | `MobileScanner` kamera QR real-time (Android/iOS) |
| Aktivasi bin: input teks + button simulasi | `QrScannerWidget` dengan kamera native |
| Preview foto: ikon placeholder statis | Preview foto asli dari kamera / galeri |
| Ukuran kompresi: angka random | Ukuran file nyata dari hasil `imageQuality: 85` |

#### Widget Baru yang Ditambahkan

**1. `CameraCaptureWidget`** — `lib/presentation/shared/widgets/camera_capture_widget.dart`
- Platform-aware: kamera native (Android/iOS) vs file picker (Web/Desktop)
- `ImageSource.camera` → membuka kamera belakang
- `ImageSource.gallery` → membuka galeri foto
- Kompresi otomatis JPEG 85%, max resolusi 1920×1080
- Preview foto nyata setelah diambil (Image.file / Image.memory untuk web)
- Menampilkan ukuran file hasil kompresi (KB)
- `showGalleryOption: bool` — opsional tampilkan tombol galeri

**2. `QrScannerWidget`** — `lib/presentation/shared/widgets/qr_scanner_widget.dart`
- Platform-aware: `MobileScanner` (Android/iOS) vs input manual (Web/Desktop)
- `MobileScannerController` dengan `DetectionSpeed.noDuplicates`
- Overlay frame scanner dengan corner aksen berwarna
- Tombol flash/torch (Android/iOS)
- Fallback input manual untuk Web/Desktop
- `onQrDetected: void Function(String)` callback

### 12.2 Alur Scan Sampah (Updated)

**Step 0 — Foto Sampah** (DIPERBARUI):

Tampilan:
- Area gelap atas: frame kamera hijau (placeholder saat belum foto)
- Bottom sheet putih dengan 2 tombol:
  1. **"Ambil Foto Sampah"** (biru penuh, height 50) — `ImageSource.camera`
  2. **"Pilih dari Galeri"** (outline biru, height 46) — `ImageSource.gallery`

Flow setelah foto diambil:
- Preview foto nyata di area atas
- Info ukuran: `✅ XXX KB (< 1MB ✓)`
- Tombol berubah ke **"Deteksi Sampah"** + "Ambil Ulang Foto"

**Step 2 — Scan QR Tong** (DIPERBARUI):

- Android/iOS: `MobileScanner` kamera real-time, auto-detect QR code
- Web/Desktop: input manual + tombol kirim
- Callback `onQrDetected` langsung trigger `scanAndCommit()`

### 12.3 Alur Aktivasi Tong (Updated)

- Android/iOS: `QrScannerWidget` buka kamera, otomatis detect QR tong
- Web/Desktop: input manual QR serial
- Setelah QR terdeteksi: tampil info tong (ID, Tipe, Lokasi) di bottom sheet
- Tombol **"AKTIVASI TONG INI"** biru

---

## 13. Inventaris Fitur Lengkap Mobile

Daftar **semua fitur** yang ada di aplikasi saat ini, terurut per screen:

### 13.1 Splash Screen (`/`)
- [x] Background putih bersih
- [x] Teks "Pilah Sampah Cerdas" biru (Poppins Bold)
- [x] Tagline "Sampah Terdata, Lingkungan Tertata" hijau
- [x] 3 dot indicator (dot tengah aktif biru lebih lebar)
- [x] Fade animation 600ms
- [x] Auto-navigate 2.5 detik → cek auth → Login atau Main

### 13.2 Login (`/login`)
- [x] Header biru 45% layar dengan logo bulat (`logosampahpilih.jpg`)
- [x] Judul "Pilah Sampah" putih
- [x] Card putih rounded (radius 32) slide dari bawah
- [x] Field NIK (16 digit, numeric keyboard, validasi length)
- [x] Field Kata Sandi (toggle visibility)
- [x] Validasi form sebelum submit
- [x] Tombol MASUK biru penuh
- [x] Error SnackBar merah saat kredensial salah
- [x] Mock hint credentials
- [x] Footer pilahsampah.id + copyright
- [x] Loading state (full screen) saat proses login

### 13.3 Main Shell (`/main`)
- [x] Bottom Navigation Bar 4 tab: Home, History, Profile, Poin
- [x] FAB hijau bulat di tengah (scan sampah) — disabled saat offline
- [x] OfflineBanner merah di atas konten saat koneksi putus
- [x] NavigationRail (sidebar kiri) otomatis di tablet ≥600dp
- [x] Logo di NavigationRail tablet
- [x] FAB kecil di NavigationRail tablet
- [x] Fade transition antar route 200ms

### 13.4 Beranda — Home Tab (tab 0)
- [x] Header biru dengan avatar logo, salam waktu (Pagi/Siang/Sore/Malam), nama warga
- [x] Chip RT/RW di pojok kanan header
- [x] Ikon notifikasi dengan red dot badge
- [x] Stats Card 3 kolom: Daily Points, Total Points, Peringkat RT
- [x] Aksi Cepat:
  - [x] Tombol "Scan Sampah" (gradient hijau) — disabled saat offline
  - [x] Tombol "Aktivasi Bin" (outline biru) — selalu aktif
- [x] Riwayat Terakhir (5 entri) dengan status badge "SELESAI"
- [x] Pull-to-refresh (invalidate providers)

### 13.5 Alur Setor Sampah (`/scan`)
- [x] **Step 0 — Foto Sampah:**
  - [x] Frame kamera hijau di area gelap atas
  - [x] Tombol "Ambil Foto Sampah" → kamera native Android/iOS / file picker Web
  - [x] Tombol "Pilih dari Galeri" → galeri native Android/iOS / file picker Web
  - [x] Kompresi JPEG 85% otomatis (imageQuality: 85, maxWidth: 1920)
  - [x] Preview foto nyata setelah diambil
  - [x] Info ukuran file (KB) + validasi < 1MB
  - [x] Tombol ganti foto
  - [x] Disabled saat offline (pesan merah)
- [x] **Step 1 — Proses AI:** loading spinner
- [x] **Step 2 — Scan QR Tong:**
  - [x] `MobileScanner` kamera real-time (Android/iOS)
  - [x] Input manual (Web/Desktop)
  - [x] Banner kuning: info jenis sampah + arahan tong
  - [x] Progress bar 3 step (Identifikasi → Verifikasi Tong → Selesai)
- [x] **Step 3 — Sukses:** modal "Pencatatan Berhasil!" dengan kategori, berat, progress tong, poin
- [x] **Error Dialogs:**
  - [x] `BIN_TYPE_MISMATCH` → dialog "Tidak Sesuai!" orange
  - [x] `AI_TIMEOUT` / `IMAGE_UNREADABLE` → dialog "Scan Gagal" merah
  - [x] Lainnya → SnackBar merah
- [x] Mock GPS koordinat (−6.9034, 107.6198)
- [x] Reset state saat layar ditutup

### 13.6 Riwayat Pemilahan — History Tab (tab 1)
- [x] AppBar biru "Riwayat Pemilahan"
- [x] Filter tabs: Semua / Minggu Ini / Bulan Ini (filter lokal)
- [x] Summary card: total kg Organik (hijau) + Anorganik (kuning)
- [x] List riwayat grouped by date: "TERBARU" / "KEMARIN" / tanggal
- [x] Per item: ikon tong berwarna, nama jenis, berat kg, tanggal+jam, badge "TERVALIDASI"
- [x] Empty state jika tidak ada data
- [x] Error state dengan retry

### 13.7 Poin Saya — Poin Tab (tab 4)
- [x] Header biru besar custom (bukan AppBar)
- [x] Total poin (Poppins w800) + label "PTS"
- [x] Chip peringkat "#3 di RT 03"
- [x] Progress bar menuju level berikutnya
- [x] Stats 3 kolom: Hari Ini (+5%), Minggu Ini (+12%), Bulan Ini (+8%)
- [x] Riwayat Poin (8 terbaru): ikon tong, nama setoran, tanggal, +X pts
- [x] Info Poin card biru muda
- [x] Pull-to-refresh

### 13.8 Profil Rumah Tangga — Profile Tab (tab 3)
- [x] AppBar biru "Profil"
- [x] Avatar ikon rumah dalam lingkaran putih + badge centang hijau
- [x] Nama "Keluarga [Nama]" + chip RT/RW
- [x] Section "Data Rumah Tangga": Kepala KK, Alamat, Telepon, Terdaftar Sejak
- [x] Section "Tong Saya": card tong Organik + Anorganik dengan status & dot indikator
- [x] Menu Actions (3 item dengan ikon berwarna):
  - [x] 🟢 Aktivasi Tong Baru → `/aktivasi-bin`
  - [x] 🟠 Ajukan Pengosongan Tong → `/reset-bin`
  - [x] 🔴 Keluar → konfirmasi dialog → logout + redirect login
- [x] Footer copyright

### 13.9 Aktivasi Tong Sampah (`/aktivasi-bin`)
- [x] AppBar biru "Aktivasi Tong Sampah"
- [x] `QrScannerWidget`: kamera QR (Android/iOS) atau input manual (Web/Desktop)
- [x] Sebelum detect: instruksi scan QR di bottom sheet
- [x] Setelah detect:
  - [x] Tampil info: ID Perangkat, Tipe (dot warna), Lokasi
  - [x] Tombol "AKTIVASI TONG INI" biru penuh
  - [x] Keterangan manfaat tong
  - [x] Tombol "Scan Ulang"
- [x] Success screen: checkmark hijau + pesan sukses + kembali
- [x] Error handling: BIN_ALREADY_ACTIVE, RESOURCE_NOT_FOUND
- [x] Invalidate binsProvider setelah sukses

### 13.10 Ajukan Pengosongan Tong (`/reset-bin`)
- [x] AppBar biru "Ajukan Pengosongan Tong"
- [x] Jika semua tong aman: checkmark hijau + pesan aman
- [x] Jika tong kritis (≥90%):
  - [x] Banner peringatan merah
  - [x] List tong kritis dengan progress bar merah + persen terisi
  - [x] Tombol "Ajukan Reset" merah per tong
- [x] Success state: checkmark + status "Menunggu Persetujuan" kuning
- [x] Error handling via `ref.listen` + SnackBar
- [x] Mock: `evidencePhotoPath` placeholder (belum pakai image_picker)

---

## 14. Shared Widgets Inventory

| Widget | File | Platform | Fungsi |
|---|---|---|---|
| `OfflineBanner` | `shared/widgets/offline_banner.dart` | Semua | Banner merah real-time saat offline (connectivity_plus) |
| `AppLoading` | `shared/widgets/app_loading.dart` | Semua | Spinner loading standar dengan optional message |
| `AppError` | `shared/widgets/app_error.dart` | Semua | Error state dengan tombol retry |
| `BinStatusBadge` | `shared/widgets/bin_status_badge.dart` | Semua | Badge Safe/Warning/Critical dengan dot warna |
| `CameraCaptureWidget` | `shared/widgets/camera_capture_widget.dart` | Semua | Foto via kamera/galeri, kompresi, preview nyata |
| `QrScannerWidget` | `shared/widgets/qr_scanner_widget.dart` | Semua | QR scanner kamera (mobile) / input manual (desktop/web) |
| `PlatformQrScanner` | `shared/widgets/platform_qr_scanner.dart` | Semua | QR scanner lama (akan dihapus, diganti QrScannerWidget) |

---

## 15. Routes Inventory

| Route | Screen | Keterangan |
|---|---|---|
| `/` | `SplashScreen` | Entry point, cek auth |
| `/login` | `LoginScreen` | Autentikasi NIK + password |
| `/main` | `MainShell` | Shell dengan Bottom Nav / NavigationRail |
| `/scan` | `ScanFlowScreen` | Alur setor sampah 4-step |
| `/aktivasi-bin` | `AktivasiBinScreen` | Aktivasi tong baru |
| `/reset-bin` | `ResetBinScreen` | Ajukan pengosongan tong kritis |

---

## 16. Platform Behavior Matrix

| Fitur | Android | iOS | Web | Windows | macOS | Linux |
|---|---|---|---|---|---|---|
| Kamera foto (`image_picker`) | ✅ Native | ✅ Native | ✅ File picker | ✅ File picker | ✅ File picker | ❌ Tidak support |
| Galeri foto (`image_picker`) | ✅ Native | ✅ Native | ✅ File picker | ✅ File picker | ✅ File picker | ❌ Tidak support |
| QR Scanner (`mobile_scanner`) | ✅ Kamera | ✅ Kamera | ⚠️ Input manual | ❌ Input manual | ❌ Input manual | ❌ Input manual |
| GPS (`geolocator`) | ✅ | ✅ | ✅ Browser | ✅ | ✅ | ✅ |
| FCM Push Notification | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Token Storage (`flutter_secure_storage`) | ✅ Keystore | ✅ Keychain | ✅ | ✅ | ✅ | ✅ |
| Orientasi portrait lock | ✅ | ✅ | ❌ N/A | ❌ N/A | ❌ N/A | ❌ N/A |
| Status bar transparan | ✅ | ✅ | ❌ N/A | ❌ N/A | ❌ N/A | ❌ N/A |
| NavigationRail tablet | Semua platform ≥ 600dp lebar | | | | | |

---

## 17. Dependencies Lengkap (pubspec.yaml)

| Package | Versi | Kegunaan | Platform |
|---|---|---|---|
| `flutter_riverpod` | ^2.6.1 | State management global | Semua |
| `dio` | ^5.8.0 | HTTP client (disiapkan, belum aktif) | Semua |
| `mobile_scanner` | ^6.0.10 | QR Scanner kamera real-time | Android/iOS |
| `image_picker` | ^1.1.2 | Kamera & galeri foto | Semua kecuali Linux |
| `geolocator` | ^13.0.4 | GPS koordinat geofencing | Semua |
| `flutter_secure_storage` | ^9.2.4 | Token JWT storage | Semua |
| `firebase_messaging` | ^15.2.5 | Push notification FCM | Android/iOS/Web/macOS |
| `connectivity_plus` | ^6.1.4 | Monitor koneksi real-time | Semua |
| `shared_preferences` | ^2.5.3 | Cache lokal (belum dipakai) | Semua |
| `google_fonts` | ^6.2.1 | Poppins font | Semua |
| `flutter_svg` | ^2.0.10+1 | SVG icon support | Semua |
| `equatable` | ^2.0.7 | Value equality entity | Semua |
| `intl` | ^0.20.2 | Format tanggal Indonesia | Semua |
| `uuid` | ^4.5.1 | Generate unique request ID | Semua |

---

## 18. Fitur Yang Belum Diimplementasi (Backlog)

Fitur berikut ada di dokumen tapi belum diimplementasi di kode:

| Fitur | Dokumen | Status | Catatan |
|---|---|---|---|
| Foto bukti reset tong | `prd.md §3.1` | ⚠️ Mock | `reset_bin_screen.dart` masih pakai `'mock_evidence_photo.jpg'`, `image_picker` belum dipanggil |
| Token storage persisten | `sdd.md §4.1` | ⚠️ In-memory | `flutter_secure_storage` ada di pubspec tapi belum dipakai di `mock_auth_repository.dart` |
| Cache offline riwayat/poin | `srs.md NFR-05` | ⚠️ Belum ada | `shared_preferences` ada di pubspec tapi belum dipakai |
| Halaman notifikasi | `sdd.md notifications table` | ⚠️ Bell icon ada | Ikon lonceng di AppBar belum navigasi ke mana pun |
| Status pengajuan reset | `prd.md §3.1 step 4` | ⚠️ Belum ada | Setelah submit reset, status PENDING/APPROVED/REJECTED tidak bisa dipantau |
| FCM initialization | `sdd.md §13 FCM` | ⚠️ Belum | Perlu `google-services.json` + `firebase_options.dart` |
| Refresh token otomatis | `sdd.md §4.1` | ⚠️ Mock only | `MockAuthRepository` in-memory, tidak ada token rotation |
| `PlatformQrScanner` cleanup | Internal | 🔧 Tech debt | Widget lama masih ada, akan digantikan penuh oleh `QrScannerWidget` |

---

## 19. Changelog

### v1.2.0 — 12 Juli 2026
- ✅ Tambah `CameraCaptureWidget` — kamera nyata + galeri via `image_picker`
- ✅ Tambah `QrScannerWidget` — `MobileScanner` real-time untuk Android/iOS
- ✅ Scan Flow Step 0: tombol "Ambil Foto Sampah" + "Pilih dari Galeri" di dalam bottom sheet putih
- ✅ Scan Flow Step 2: ganti mock button dengan `QrScannerWidget` nyata
- ✅ Aktivasi Bin: ganti input manual + simulasi dengan `QrScannerWidget`
- ✅ Preview foto nyata (bukan placeholder ikon) setelah ambil foto
- ✅ Ukuran file kompresi ditampilkan dari file nyata (bukan simulasi random)
- ✅ Tambah tombol "Ajukan Pengosongan Tong" di menu Profil
- ✅ Update `web/index.html` splash — background putih sesuai desain

### v1.1.0 — 12 Juli 2026
- ✅ Redesign UI seluruh screen sesuai desain visual aktual (biru dominan)
- ✅ Tambah `ResponsiveLayout` + `NavigationRail` untuk tablet ≥600dp
- ✅ Offline enforcement: FAB disabled, banner merah
- ✅ Daily AI limit 50/hari di `MockBinRepository`
- ✅ Scan flow 4-step lengkap dengan dialog error per kode
- ✅ PRD Mobile v1.1.0 dibuat

### v1.0.0 — 11 Juli 2026
- ✅ Initial Flutter project scaffold
- ✅ Clean Architecture: config / core / domain / data / presentation
- ✅ Mock mode: semua repository menggunakan data lokal
- ✅ 9 screens, 6 routes, Riverpod state management
- ✅ Platform support: Android, iOS, Web, Windows, macOS, Linux

---

*© 2026 Pilah Sampah Cerdas — Kecamatan Coblong, Kota Bandung*
*PRD Mobile v1.2.0 — Referensi platform lain: `docs/prd.md` | SRS: `docs/srs.md` | SDD: `docs/sdd.md`*
