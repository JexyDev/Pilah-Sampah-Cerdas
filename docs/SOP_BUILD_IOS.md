# Standar Operasional Prosedur (SOP) Build & Deployment iOS Aplikasi BERSEKA
**Target Lingkungan: Apple macOS (MacBook Pro / Air / Mac Mini)**  
*Dokumen Teknis & Operasional Rilis Aplikasi iOS*

---

## 1. Prasyarat Perangkat & Lingkungan Pengembangan (MacBook)

Pastikan lingkungan MacBook Anda telah terpasang komponen berikut:

1. **Hardware**: Apple Silicon (M1/M2/M3/M4) atau Intel Mac dengan minimal RAM 8GB (direkomendasikan 16GB+).
2. **macOS**: Versi macOS Sonoma (14.x) atau macOS Sequoia (15.x) terbaru.
3. **Xcode**: Xcode 15.x atau Xcode 16.x (unduh via Mac App Store atau Apple Developer Portal).
4. **Command Line Tools**:
   ```bash
   xcode-select --install
   ```
5. **Cocoapods**:
   ```bash
   sudo gem install cocoapods
   # Atau jika menggunakan Homebrew:
   brew install cocoapods
   ```
6. **Flutter SDK**:
   - Flutter SDK versi `>= 3.44.0` (Dart `>= 3.12.1`).
   - Jalankan verifikasi kesiapan:
     ```bash
     flutter doctor -v
     ```
   - Pastikan tanda centang hijau untuk Flutter, Xcode, dan CocoaPods.

---

## 2. Persiapan Repositori & Dependensi

1. Clone repositori ke MacBook:
   ```bash
   git clone <URL_REPOSITORY_BERSEKA>
   cd berseka/mobile
   ```
2. Pastikan berada pada branch yang akan dirilis (misal `development` atau `main`):
   ```bash
   git checkout development
   git pull origin development
   ```
3. Unduh seluruh dependensi Flutter & CocoaPods:
   ```bash
   flutter clean
   flutter pub get
   cd ios
   pod repo update
   pod install
   cd ..
   ```

---

## 3. Konfigurasi Apple Developer Account & Signing

1. Buka folder iOS pada Xcode:
   ```bash
   open ios/Runner.xcworkspace
   ```
   *(PENTING: Selalu buka file `.xcworkspace`, BUKAN `.xcodeproj`)*
2. Di Xcode, pilih project **Runner** pada sidebar kiri, lalu buka tab **Signing & Capabilities**:
   - **Team**: Pilih Akun Apple Developer Tim (UNIKOM / Tim Pengembang).
   - **Bundle Identifier**: `id.ac.unikom.berseka` (atau identifier resmi yang didaftarkan).
   - **Signing Certificate**: Pilih *Apple Development* (untuk pengujian internal) atau *Apple Distribution* (untuk TestFlight / App Store).
   - **Provisioning Profile**: Pilih *Automatic (Managed by Xcode)* atau impor profil manual.

---

## 4. Konfigurasi Izin Sistem iOS (`Info.plist`)

Pastikan izin perangkat keras penting telah terkonfigurasi di `ios/Runner/Info.plist`:

- **Kamera**: `NSCameraUsageDescription` (Pengambilan foto logbook, program kerja, dan pemindaian stiker QR tempat sampah).
- **Galeri**: `NSPhotoLibraryUsageDescription` (Pemilihan dokumen bukti & foto).
- **Lokasi Geofencing**:
  - `NSLocationWhenInUseUsageDescription`
  - `NSLocationAlwaysAndWhenInUseUsageDescription` (Tracking presensi KKN di latar belakang/background).
- **Background Modes**:
  - `location` (Updates lokasi berkala dalam zona geofence).
  - `remote-notification` (Push notification Firebase kehadiran & penilaian).

---

## 5. Prosedur Build Arsip & Rilis

### A. Build IPA / Archive via Xcode (Direkomendasikan untuk TestFlight)
1. Pada menu atas Xcode, pilih skema **Runner** dan target device **Any iOS Device (arm64)**.
2. Pilih menu **Product** ➡️ **Archive**.
3. Tunggu proses kompilasi hingga jendela **Organizer** terbuka.
4. Klik **Distribute App**:
   - Pilih metode rilis: **App Store Connect / TestFlight** atau **Ad Hoc / Development Testing**.
   - Pilih *Automatically manage signing*.
   - Klik **Upload** untuk mengirim build langsung ke TestFlight.

### B. Build IPA via Command Line (CLI)
Jika ingin menghasilkan file `.ipa` secara mandiri:
```bash
flutter build ipa --release --export-options-plist=ios/ExportOptions.plist
```
File `.ipa` hasil build akan tersimpan di:
`build/ios/ipa/mobile_app_sampah.ipa`

---

## 6. Verifikasi & Pengujian Pasca-Build

1. **Uji Coba TestFlight**:
   - Buka portal [App Store Connect](https://appstoreconnect.apple.com).
   - Masuk ke tab **TestFlight**, pilih build terbaru yang sudah selesai diproses oleh Apple.
   - Daftarkan grup penguji (Internal DPL / Mahasiswa / Task Force).
2. **Checklist Pengujian iOS**:
   - [ ] Izin kamera & pemindaian barcode QR berfungsi mulus tanpa crash.
   - [ ] Izin lokasi GPS Geofencing mendeteksi koordinat latitude/longitude secara akurat.
   - [ ] Multi-image picker kamera & galeri pada logbook KKN berfungsi responsif.
   - [ ] Notifikasi lokal dan push notifikasi Firebase masuk sesuai event.
