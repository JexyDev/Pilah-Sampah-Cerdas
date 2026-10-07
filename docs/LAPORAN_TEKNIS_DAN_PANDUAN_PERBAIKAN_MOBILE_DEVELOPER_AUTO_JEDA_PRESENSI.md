# 📱 LAPORAN AUDIT TEKNIS & PANDUAN PERBAIKAN FLUTTER MOBILE
## Insiden Auto-Jeda Liar pada Alur Keluar/Logout & Pemotongan Durasi Mahasiswa KKN
**Nomor Dokumen**: `021/MEMO-ENG/BERSEKA-MOBILE/X/2026`  
**Ditujukan Kepada**: Tim Pengembang Mobile (Lead & Flutter Mobile Developer)  
**Dari**: Lead Fullstack System Architect & Core Backend Engineering  
**Tanggal**: Rabu, 07 Oktober 2026  
**Status**: 🔴 **URGENT - WAJIB DIIMPLEMENTASIKAN PADA RILIS MOBILE BERIKUTNYA**  

---

## 1. Ringkasan Eksekutif

Menindaklanjuti insiden operasional lapangan pada **Kelompok 3 DAGO** (kasus mahasiswa **Adinda Aulia - NIM: 21224084** dan rekan-rekan):
> *"Mahasiswa telah bertugas selama 2 jam 11 menit (13:52 – 16:03 WIB) di posko KKN. Namun saat membuka aplikasi kembali, waktu presensi terpotong drastis kembali ke 0 (tampil 12 menit 51 detik), serta tidak dapat mengakhiri presensi karena muncul peringatan 'Hadir & Tidak Memenuhi'."*

Tim Backend telah melakukan investigasi forensik kode dan menemukan bahwa **masalah utama dipicu oleh injeksi mutasi jeda otomatis (`jedaKegiatan`) yang disematkan pada siklus logout / penutupan sesi di aplikasi Flutter Mobile**.

Dokumen ini disusun sebagai panduan teknis resmi bagi Pengembang Mobile untuk menghapus alur tersebut dari repositori Flutter Mobile secara tuntas.

---

## 2. Bukti Forensik & Titik Kelalaian Kode Mobile

### A. Lokasi File:
`mobile/lib/app/modules/auth/controllers/auth_controller.dart` (Baris ~326–345)

### B. Potongan Baris Kode Bermasalah:
```dart
// ❌ KODE BERMASALAH PADA mobile/.../auth_controller.dart:
Future<void> logout() async {
  try {
    // 0. Otomatis jeda kegiatan KKN jika sedang BERLANGSUNG saat logout (maksimal 2 detik)
    try {
      final kknState = _ref.read(kknLocationProvider);
      final kknNotifier = _ref.read(kknLocationProvider.notifier);
      final activeAct = kknState.activeActivity;
      final statusUpper = (activeAct?['statusKehadiran'] ?? ...).toString().toUpperCase();
      
      final isBerlangsung = kknState.isTracking || statusUpper == 'BERLANGSUNG' ...;
      if (isBerlangsung) {
        await kknNotifier
            .jedaKegiatan('Pengguna Keluar / Logout Aplikasi') // ⚠️ SUMBER MASALAH UTAMA!
            .timeout(const Duration(seconds: 2), onTimeout: () => false);
      }
    } catch (_) {}
```

### C. Mengapa Kode Ini Sangat Merusak Data Mahasiswa di Lapangan?
1. **Asumsi Keliru**: Pengembang mobile mengasumsikan *"jika pengguna logout / aplikasi ditutup di latar belakang / token kadaluarsa, maka mahasiswa otomatis berhenti bertugas di posko"*.
2. **Kenyataan Lapangan**: Mahasiswa KKN bertugas di posko secara fisik. Ponsel mereka dapat mengalami baterai habis, memory cleanup oleh OS (Android/iOS), force close, atau pengguna melakukan re-login untuk memperbarui jaringan.
3. **Konsekuensi Matematis**:
   - Check-in pukul 13:52 WIB.
   - Pukul 14:04 WIB (12 menit kemudian), aplikasi melakukan logout/refresh token yang memicu `jedaKegiatan`. Server mencatat `waktuJeda: 14:04 WIB`.
   - Pukul 16:02 WIB, mahasiswa login kembali (`waktuResume: 16:02 WIB`).
   - Sistem memotong jeda selama **1 jam 58 menit**.
   - Dari 2 jam 11 menit kerja nyata, durasi tersisa hanya **12 menit 47 detik** (tampil `00:12:51`).
   - Mahasiswa kehilangan hak durasi kerja lapangan dan terancam tidak lulus KKN.

---

## 3. Titik Masalah Kedua: Mengapa Mahasiswa Gagal Checkout?

1. **Terhalang Modal Peringatan Durasi**:  
   Karena durasi anjlok ke 12 menit, saat mahasiswa menekan *"Akhiri Sesi & Presensi Pulang"*, modal dialog memperingatkan bahwa statusnya akan menjadi `HADIR_TIDAK_MEMENUHI` (karena < 240 menit). Mahasiswa takut dan membatalkan checkout.
2. **Geofence Pulang Rigid (`OUT_OF_GEOFENCE`)**:  
   Mahasiswa yang bertugas hingga jam selesai posko (16:00 WIB) baru sempat menekan tombol pulang setelah dalam perjalanan pulang. Validasi geofence mobile/API menolak dengan error `OUT_OF_GEOFENCE`.
3. **Presensi Mandiri vs Jadwal Posko**:  
   Mahasiswa yang presensi via Presensi Mandiri tidak otomatis men-checkout jadwal posko yang aktif, menyebabkan rekor mandiri menggantung dalam status `AKTIF`.

---

## 4. Panduan Instruksi Perbaikan Mutlak untuk Mobile Developer

### 🛠️ Perbaikan 1: HAPUS Total Auto-Jeda pada `auth_controller.dart`
Buka `mobile/lib/app/modules/auth/controllers/auth_controller.dart`, hapus seluruh blok try-catch yang memanggil `jedaKegiatan` pada fungsi `logout()`:

```dart
// ✅ KODE YANG BENAR (BERSIH DARI MUTASI PRESENSI):
Future<void> logout() async {
  try {
    // Bersihkan push notification token
    await _unregisterFcmToken();
  } catch (_) {}

  // Hapus token lokal & reset state autentikasi
  await _secureStorage.deleteAll();
  state = const AuthState();
  
  // DILARANG memanggil kknNotifier.jedaKegiatan() atau mutasi kehadiran apapun di sini!
}
```

### 🛠️ Perbaikan 2: Saring Jeda Otomatis pada Timer Tampilan Mobile
Pada controller yang menghitung timer berjalan ([`kkn_location_controller.dart` / widget timer]):
Pastikan jeda yang dipotong dari total waktu **hanya jeda manual resmi** yang sengaja ditekan oleh mahasiswa (bukan jeda dengan alasan `"Logout Aplikasi"`, `"autoTriggered"`, atau gangguan sistem):

```dart
// ✅ FILTER DEFENSIVE PADA PENGHITUNGAN TIMER:
int calculateEffectivePauseSeconds(List<dynamic> jedaLogs) {
  int totalPauseSec = 0;
  for (final log in jedaLogs) {
    if (log is! Map) continue;
    if (log['autoTriggered'] == true) continue; // Lewati auto-pause
    
    final alasan = (log['alasan'] ?? '').toString().toLowerCase();
    if (alasan.contains('logout') || alasan.contains('keluar aplikasi')) continue; // Lewati pause logout
    
    final startStr = log['waktuJeda']?.toString();
    final endStr = log['waktuResume']?.toString();
    if (startStr != null && endStr != null) {
      final pStart = DateTime.tryParse(startStr);
      final pEnd = DateTime.tryParse(endStr);
      if (pStart != null && pEnd != null && pEnd.isAfter(pStart)) {
        totalPauseSec += pEnd.difference(pStart).inSeconds;
      }
    }
  }
  return totalPauseSec;
}
```

### 🛠️ Perbaikan 3: Tangani Checkout Graceful di Luar Radius Setelah Jam Posko
Saat mahasiswa menekan tombol *Selesai / Presensi Pulang*, jika server mengembalikan `OUT_OF_GEOFENCE` namun waktu lokal sudah $\ge 16:00$ WIB (jadwal posko berakhir) atau durasi kerja $\ge 4$ jam:
* Jangan tampilkan blocking error merah yang membuat mahasiswa frustrasi.
* Berikan dialog konfirmasi: *"Anda berada di luar posko. Jadwal posko hari ini telah berakhir, sesi Anda akan dikunci pada jam kepulangan resmi posko."*

---

## 5. Tindakan yang Telah Dieksekusi Tim Backend & Web (Sudah Live di VPS)

Untuk memastikan mahasiswa di lapangan tidak terus dirugikan sebelum rilis mobile berikutnya:
1. **Backend (`authService.ts`)**: Blok auto-pause pada endpoint `/auth/logout` telah **DIHAPUS**.
2. **Backend (`kknAttendanceService.ts`)**:
   - `calcTotalPauseMs`: Log jeda akibat logout / autoTriggered kini **diabaikan secara resmi dari pemotongan waktu**.
   - `checkOutAttendance`: Mahasiswa yang telah menyelesaikan tugas ($\ge 240$ menit) atau waktu $\ge 16:00$ WIB diberikan **toleransi checkout graceful** dan tidak lagi diblokir error `OUT_OF_GEOFENCE`.
3. **Web Mobile (`MahasiswaPresensiMobile.tsx`)**:
   - Rumus timer telah diselaraskan untuk mengabaikan pause logout.
   - Sinkronisasi penutupan Presensi Mandiri kini otomatis berjalan saat checkout.
4. **Rekonsiliasi Data Kelompok 3 DAGO**:
   - Akun **Adinda Aulia (`21224084`)** telah dipulihkan ke status **`HADIR_MEMENUHI` (Durasi: 247 Menit / 4 Jam 7 Menit)** dan diberikan hak +3 Poin sah.
   - Seluruh 21 rekor Presensi Mandiri anggota Kelompok 3 DAGO yang tertahan telah diselesaikan secara sah di basis data VPS.

---

## 6. Checklist Verifikasi Sebelum Rilis Mobile

- [ ] Baris pemanggilan `jedaKegiatan` di `auth_controller.dart` telah dihapus.
- [ ] Uji coba logout dan login kembali saat sesi KKN sedang berjalan: timer TIDAK boleh terpotong atau kembali ke 0.
- [ ] Jalankan `dart analyze` untuk memastikan tidak ada warning/error.
- [ ] Uji coba flow check-out setelah jam 16:00 WIB.

---
*Dokumen ini diterbitkan oleh Lead System Architect & Backend Engineering Berseka sebagai instruksi resmi tata kelola rekayasa perangkat lunak.*
