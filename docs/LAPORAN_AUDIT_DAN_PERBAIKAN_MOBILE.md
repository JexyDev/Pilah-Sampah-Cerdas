# 📋 LAPORAN AUDIT TEKNIS & PANDUAN INTEGRASI PERBAIKAN REPOSITORI MOBILE (FLUTTER)

**Nomor Dokumen:** BERSEKA-MOB-AUDIT-2026-09-09  
**Tanggal:** 9 September 2026  
**Penulis:** Fullstack Developer (Backend API & Web Frontend)  
**Penerima:** Tim Mobile Developer (Flutter)  
**Subjek:** Analisis Sinkronisasi Remote `origin/mobile` vs Perbaikan Lokal  
**Status Repositori Remote (`origin/mobile`):** 🔴 **Ditemukan 5 Bug Kritis & 1 Gap Dokumentasi Belum Diperbaiki di Remote**

---

## 1. Ringkasan Eksekutif (Executive Summary)

Berdasarkan pengecekan dan sinkronisasi cabang remote `origin/mobile` terbaru di GitHub (commit `1c163d2a`), diketahui bahwa tim mobile baru saja menggabungkan **PR #51 (`update-mobile`)**. PR tersebut membawa pembaruan terkait ukuran tempat sampah, responsivitas teks petugas, dan validasi kapasitas minimal tempat sampah.

**Namun demikian, seluruh perbaikan stabilitas krusial yang ada di lingkungan lokal cabang `fix/mobile-auth-resilience-and-instant-logout` BELUM PERNAH masuk ke GitHub remote.** 

Jika tim mobile langsung menimpa atau mengabaikan perubahan lokal ini, aplikasi mobile di lingkungan produksi/lapangan akan rentan mengalami:
1. Pengguna terlempar ke layar login (*force logout*) secara acak saat sinyal seluler drop di lapangan.
2. Tombol logout macet (*freeze/hang*) saat koneksi internet lambat.
3. Catatan deskripsi dan bukti foto kegiatan presensi KKN hilang (*null*) saat dikirim ke server.
4. Total akumulasi izin mahasiswa salah hitung (izin ditolak/pending tetap terhitung disetujui).
5. Mahasiswa pendamping multi-RW tidak dapat melihat dan memvalidasi warga binaan di seluruh RW tanggung jawabnya.

Dokumen ini disusun untuk memberikan transparansi teknis mengenai akar masalah (*root cause*), perbandingan kode *before vs after*, serta instruksi langkah kerja bagi tim mobile developer untuk segera mengintegrasikannya ke remote repository.

---

## 2. Matriks Komparasi Remote vs Lokal

| No | Modul / Fitur | File Terdampak | Status di Remote (`origin/mobile`) | Status di Branch Lokal | Tingkat Keparahan |
| :-: | :--- | :--- | :--- | :--- | :--- |
| **1** | **Ketahanan Auto-Refresh Token** | `lib/app/data/providers/api_client.dart` | ❌ **Bug Aktif**: Force logout tanpa cek status error (sinyal drop = user terlempar) | ✅ **Fixed** (Commit `d79c1159`): Filter `isExplicitAuthFailure` (hanya 401/403) | 🔴 **Kritis (P1)** |
| **2** | **Keandalan Proses Logout** | `lib/app/modules/auth/controllers/auth_controller.dart` | ❌ **Bug Aktif**: Tanpa timeout (logout freeze jika sinyal lambat) | ✅ **Fixed** (Commit `d79c1159`): Timeout 2 detik & blok `finally` | 🔴 **Kritis (P1)** |
| **3** | **Pengiriman Deskripsi & Foto Presensi** | `lib/app/data/repositories/api_kkn_repository.dart` | ❌ **Bug Aktif**: Parameter diterima tapi tidak diteruskan ke `selesaiKegiatan` | ✅ **Fixed** (Commit `6b0cb3e6`): Forward `deskripsiKegiatan` & `fotoPath` | 🟠 **Tinggi (P2)** |
| **4** | **Filter Jumlah Pengajuan Izin** | `lib/app/modules/mahasiswa/views/mahasiswa_poin_view.dart` | ❌ **Bug Aktif**: `list.length` mentah (izin REJECTED/PENDING ikut terhitung) | ✅ **Fixed** (Working Tree): Filter `APPROVED`/`DISETUJUI` | 🟡 **Sedang (P3)** |
| **5** | **Multi-RW Dampingan Profil & Matching** | `lib/app/data/models/user_entity.dart` & `aktivasi_warga_controller.dart` | ❌ **Belum Mendukung**: Hanya membaca format RW tunggal | ✅ **Fixed** (Commit `927fd3e6`): Ekstraksi regex multi-RW & filter warga | 🟡 **Sedang (P3)** |
| **6** | **Spesifikasi Google Drive Kelompok** | `docs/LAPORAN_FITUR_GOOGLE_DRIVE_KELOMPOK_MOBILE.md` | ❌ **Tidak Ada** di remote | ✅ **Tersedia** di lokal | 🔵 **Info / Docs** |

---

## 3. Analisis Mendalam Akar Masalah & Solusi Teknis

### 3.1. Bug #1: Force Logout Otomatis saat Sinyal Drop di Lapangan
* **Berkas:** `lib/app/data/providers/api_client.dart`
* **Gejala:** Mahasiswa KKN atau Petugas yang sedang bertugas di area dengan sinyal lemah mendadak keluar sendiri ke halaman login saat token kedaluwarsa dan mencoba auto-refresh.
* **Akar Masalah (*Root Cause*):** Blok `catch (refreshErr)` pada interceptor Dio langsung mengeksekusi `await _forceLogout()` tanpa membedakan apakah kegagalan disebabkan oleh token kedaluwarsa permanen dari server atau hanya masalah koneksi (SocketException, Connection Timeout, Error 502/503).

#### Komparasi Kode:
```dart
// ❌ KONDISI DI GITHUB REMOTE (origin/mobile):
} catch (refreshErr, stackTrace) {
  debugPrint('[ApiClient] Refresh token failed: $refreshErr');
  debugPrint('[ApiClient] Stacktrace: $stackTrace');
  _isRefreshing = false;
  _rejectPendingRequests();
  await _forceLogout(); // <-- BUG: Apapun errornya, user langsung di-kick!
  return handler.next(e);
}
```

```dart
// ✅ PERBAIKAN LOKAL (Commit d79c1159):
} catch (refreshErr, stackTrace) {
  debugPrint('[ApiClient] Refresh token failed: $refreshErr');
  debugPrint('[ApiClient] Stacktrace: $stackTrace');
  _isRefreshing = false;
  _rejectPendingRequests();

  // Hanya force logout jika server eksplisit memberikan status 401 atau 403.
  // Jika karena jaringan (Timeout, Offline, 502/503/504), JANGAN logout paksa!
  bool isExplicitAuthFailure = false;
  if (refreshErr is DioException) {
    final status = refreshErr.response?.statusCode;
    if (status == 401 || status == 403) {
      isExplicitAuthFailure = true;
    }
  }

  if (isExplicitAuthFailure) {
    await _forceLogout();
  }
  return handler.next(e);
}
```

---

### 3.2. Bug #2: Logout Hang / Macet Tanpa Timeout
* **Berkas:** `lib/app/modules/auth/controllers/auth_controller.dart`
* **Gejala:** Tombol logout berputar tanpa henti (*loading freeze*) jika koneksi internet terputus atau server Firebase FCM lambat merespons unregister token.
* **Akar Masalah (*Root Cause*):** Seluruh panggilan asynchronous eksternal (`getToken()`, `unregisterDeviceToken()`, `deleteToken()`, dan `jedaKegiatan()`) ditunggu secara sequential tanpa batasan waktu (*timeout*), dan tidak dilindungi blok `finally` untuk mereset state lokal.

#### Komparasi Kode:
```dart
// ❌ KONDISI DI GITHUB REMOTE (origin/mobile):
Future<void> logout() async {
  try {
    final token = await FirebaseMessaging.instance.getToken(); // <-- Bisa hanging
    if (token != null) {
      await _notificationRepository.unregisterDeviceToken(token); // <-- Bisa hanging
    }
    await FirebaseMessaging.instance.deleteToken(); // <-- Bisa hanging
  } catch (_) {}

  await _authRepository.logout();
  state = const AuthState(); // <-- Tidak pernah tercapai jika Future macet
}
```

```dart
// ✅ PERBAIKAN LOKAL (Commit d79c1159):
Future<void> logout() async {
  try {
    // 0. Auto-jeda KKN dengan batas maksimal 2 detik
    try {
      // ... pengecekan kegiatan berlangsung ...
      if (isBerlangsung) {
        await kknNotifier.jedaKegiatan('Pengguna Keluar / Logout Aplikasi')
            .timeout(const Duration(seconds: 2), onTimeout: () => false);
      }
    } catch (_) {}

    // 1. Unregister FCM dengan batas maksimal 2 detik
    try {
      final token = await FirebaseMessaging.instance.getToken()
          .timeout(const Duration(seconds: 2), onTimeout: () => null);
      if (token != null) {
        await _notificationRepository.unregisterDeviceToken(token)
            .timeout(const Duration(seconds: 2), onTimeout: () {});
      }
      await FirebaseMessaging.instance.deleteToken()
          .timeout(const Duration(seconds: 2), onTimeout: () {});
    } catch (_) {}

    // 2. Bersihkan in-memory state & SharedPreferences
    await _ref.read(kknLocationProvider.notifier).resetForNewUser();
    await NotificationEngine().cancelAll();
    clearNotificationCache();

    // 3. Panggil auth repository logout maksimal 2 detik
    try {
      await _authRepository.logout()
          .timeout(const Duration(seconds: 2), onTimeout: () {});
    } catch (_) {}
  } finally {
    // Dijamin SELALU tereksekusi, logout instan dalam kondisi apapun
    state = const AuthState();
  }
}
```

---

### 3.3. Bug #3: Deskripsi & Foto Presensi KKN Hilang saat Kirim ke Server
* **Berkas:** `lib/app/data/repositories/api_kkn_repository.dart`
* **Gejala:** Mahasiswa telah mengisi catatan kegiatan dan melampirkan foto presensi saat selesai kegiatan, tetapi di web admin dashboard, data deskripsi dan foto selalu berstatus kosong (`null`).
* **Akar Masalah (*Root Cause*):** Pada method `recordAttendance()`, argumen `deskripsiKegiatan` dan `fotoPath` sudah didefinisikan pada parameter fungsi, namun pemanggilan internal ke `selesaiKegiatan(...)` **lupa meneruskan kedua parameter tersebut**.

#### Komparasi Kode:
```dart
// ❌ KONDISI DI GITHUB REMOTE (origin/mobile):
@override
Future<Map<String, dynamic>> recordAttendance({
  required String scheduleId,
  required double latitude,
  required double longitude,
  required String method,
  String? deskripsiKegiatan, // <-- Ada di parameter
  String? fotoPath,          // <-- Ada di parameter
  // ...
}) async {
  try {
    final totalMenit = ...;
    final response = await selesaiKegiatan(
      scheduleId,
      sessionId: 'SES-$scheduleId',
      totalDurasiDalamZonaMenit: totalMenit,
      accumulatedSeconds: accumulatedSeconds,
      alasan: 'Presensi Selesai (Pulang)',
      // ⚠️ BUG: deskripsiKegiatan & fotoPath TIDAK DI-PASSING!
    );
    return response;
  }
}
```

```dart
// ✅ PERBAIKAN LOKAL (Commit 6b0cb3e6):
    final response = await selesaiKegiatan(
      scheduleId,
      sessionId: 'SES-$scheduleId',
      totalDurasiDalamZonaMenit: totalMenit,
      accumulatedSeconds: accumulatedSeconds,
      alasan: 'Presensi Selesai (Pulang)',
      deskripsiKegiatan: deskripsiKegiatan, // <-- SUDAH DITERUSKAN
      fotoPath: fotoPath,                   // <-- SUDAH DITERUSKAN
    );
```

---

### 3.4. Bug #4: Perhitungan Izin Mahasiswa Menghitung Izin Ditolak
* **Berkas:** `lib/app/modules/mahasiswa/views/mahasiswa_poin_view.dart`
* **Gejala:** Kartu statistik "Izin" pada halaman Poin Mahasiswa menampilkan angka yang salah karena izin yang berstatus ditolak (`REJECTED`) atau masih menunggu (`PENDING`) ikut terhitung.
* **Akar Masalah (*Root Cause*):** `pengajuanIzinCountProvider` langsung mengembalikan panjang list data (`list.length`) tanpa melakukan penyaringan status.

#### Komparasi Kode:
```dart
// ❌ KONDISI DI GITHUB REMOTE (origin/mobile):
final pengajuanIzinCountProvider = FutureProvider.autoDispose<int>((ref) async {
  try {
    final repo = ref.read(kknRepositoryProvider);
    final list = await repo.getPengajuanIzin();
    return list.length; // <-- BUG: Semua izin dihitung
  } catch (e) {
    return 0;
  }
});
```

```dart
// ✅ PERBAIKAN LOKAL (Working Tree):
final pengajuanIzinCountProvider = FutureProvider.autoDispose<int>((ref) async {
  try {
    final repo = ref.read(kknRepositoryProvider);
    final list = await repo.getPengajuanIzin();
    final approvedList = list.where((item) {
      if (item is Map<String, dynamic>) {
        final status = (item['status'] ?? '').toString().toUpperCase();
        return status == 'APPROVED' || status == 'DISETUJUI';
      }
      return true;
    }).toList();
    return approvedList.length; // <-- SUDAH HANYA YANG APPROVED/DISETUJUI
  } catch (e) {
    return 0;
  }
});
```

---

### 3.5. Bug #5: Dukungan Multi-RW Dampingan Mahasiswa & Matching Warga
* **Berkas:** `lib/app/data/models/user_entity.dart` & `lib/app/modules/mahasiswa/controllers/aktivasi_warga_controller.dart`
* **Akar Masalah (*Root Cause*):** Mahasiswa KKN yang mengampu kelompok dengan beberapa RW dampingan (contoh: `"04, 09, 10"`) tidak terformat dengan baik di kartu profil, dan pada controller `aktivasi_warga_controller.dart`, query hanya mencari satu angka RW sehingga warga binaan pada RW lainnya tidak muncul di daftar aktivasi.
* **Solusi Lokal (Commit `927fd3e6`):**
  1. Menambahkan getter `formattedRw` pada `UserEntity` menggunakan regex `RegExp(r'\d+').allMatches(rw)` dengan normalisasi `padLeft(2, '0')`.
  2. Menambahkan ekstraksi `targetRwNumbers` (Set of string) pada `AktivasiWargaNotifier` dan filter bertingkat agar warga di seluruh RW dampingan mahasiswa dapat ditemukan.

---

## 4. Daftar Branch Lokal & Pekerjaan yang Belum Ter-push

### Cabang 1: `fix/mobile-auth-resilience-and-instant-logout`
Cabang ini merupakan cabang perbaikan utama yang siap diuji dan dimerge:
* `3bf67d8a`: Merge sinkronisasi pembaruan modul mobile (`origin/update-mobile`)
* `6b0cb3e6`: Forward `deskripsiKegiatan` and `fotoPath` in `recordAttendance`
* `927fd3e6`: Display full multi-RW dampingan in profile and update citizen matching for kelompok KKN
* `d79c1159`: Perbaiki ketahanan auto-refresh token saat sinyal drop dan tambahkan timeout logout

### Cabang 2: `feat/mobile-kkn-loss-mode-v2`
Cabang eksperimen implementasi presensi KKN LOSS MODE v2 dan endpoint lanjut:
* `fe8e474a`: Implementasi presensi KKN LOSS MODE v2 dan endpoint lanjut pada background task & map controller.

### Daftar Stash Lokal:
* `stash@{0}`: WIP on `feat/mobile-kkn-loss-mode-v2`
* `stash@{1}`: WIP register posko view & repository
* `stash@{2}`: WIP background task handler & riwayat KKN

---

## 5. Panduan Langkah Kerja (Action Plan) untuk Tim Mobile

Untuk memastikan kode di remote repository bersih dan tidak saling menimpa, ikuti urutan langkah berikut:

### Langkah 1: Commit Sisa Perubahan Lokal
Lakukan commit untuk perbaikan filter izin dan penambahan dokumen:
```bash
cd mobile
git add lib/app/modules/mahasiswa/views/mahasiswa_poin_view.dart docs/LAPORAN_FITUR_GOOGLE_DRIVE_KELOMPOK_MOBILE.md docs/LAPORAN_AUDIT_DAN_PERBAIKAN_MOBILE.md
git commit -m "fix(mobile): filter approved izin count and add audit technical report"
```

### Langkah 2: Sinkronkan dengan Branch `mobile` Terbaru (Rebase/Merge)
Ambil pembaruan terkini dari remote `mobile`:
```bash
git fetch origin mobile
git merge origin/mobile
```
*(Periksa apakah ada konflik kode. Seluruh commit perbaikan lokal berada di file yang aman dan tidak bertabrakan dengan PR #51).*

### Langkah 3: Push Cabang ke Remote GitHub
Push cabang perbaikan ke remote:
```bash
git push -u origin fix/mobile-auth-resilience-and-instant-logout
```

### Langkah 4: Buka Pull Request (PR) ke Branch `development`
Sesuai standar **Git-Flow Berseka 3-Tier**:
* **Source branch:** `fix/mobile-auth-resilience-and-instant-logout`
* **Target branch:** `development` (atau `mobile` jika repository menerapkan branching khusus mobile sebelum masuk development).
* Berikan label `bug`, `mobile`, dan minta review dari Lead Developer / Rekan Tim Mobile.

---

*Laporan ini disimpan pada repositori mobile di path: `docs/LAPORAN_AUDIT_DAN_PERBAIKAN_MOBILE.md`.*
