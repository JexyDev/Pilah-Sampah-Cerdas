import '../models/mahasiswa_kkn_models.dart';

/// Interface repository untuk fitur Mahasiswa KKN.
///
/// Endpoint yang digunakan:
/// - GET  /api/kkn/dashboard        → Dashboard statistik KKN
/// - GET  /api/kkn/warga-dampingan  → Daftar warga dampingan
/// - POST /api/v1/auth/register/warga → Registrasi warga baru
/// - POST /api/kkn/location-ping    → Ping lokasi mahasiswa
abstract class KknRepository {
  /// Mengambil data dashboard statistik KKN mahasiswa.
  Future<KknDashboardData?> getCachedDashboard();
  Future<KknDashboardData> getDashboard();

  Future<List<WargaDampingan>?> getCachedWargaDampingan();
  Future<List<WargaDampingan>> getWargaDampingan();

  /// Mendaftarkan warga baru melalui akun mahasiswa.
  /// Backend otomatis melakukan binding mahasiswa ↔ warga.

  Future<List<dynamic>?> getCachedActivityLog();
  Future<List<dynamic>> getActivityLog();

  /// Mengirim ping lokasi (latitude, longitude) ke backend dan mengembalikan seluruh response (termasuk autoAttendanceTriggered).
  Future<Map<String, dynamic>> sendLocationPing(double latitude, double longitude, {int? inZoneSeconds});

  /// Mengambil daftar jadwal kegiatan KKN.
  Future<List<dynamic>> getSchedules();

  /// Mengambil data koordinat zona penugasan aktif (GET /kkn/active-zone)
  Future<Map<String, dynamic>> getActiveZone({double? latitude, double? longitude});

  /// Mengambil target lokasi kegiatan KKN.
  Future<Map<String, dynamic>> getTargetLocation(String scheduleId);

  /// Mencatat absensi (radius KKN) dengan payload lengkap. Mengembalikan response dari server.
  Future<Map<String, dynamic>> recordAttendance({
    required String scheduleId,
    required double latitude,
    required double longitude,
    required String method,
    String? nim,
    String? namaMahasiswa,
    String? kodeZona,
    String? rw,
    String? kecamatan, String? kelurahan,
    int? durationMinutes,
    int? accumulatedSeconds,
    String? timestamp,
  });

  /// Mengambil daftar warga (untuk fitur aktivasi)
  Future<List<dynamic>> getWargaForAktivasi({String? kecamatan, String? kelurahan, String? rw, String? search});

  /// Mengaktivasi warga by scan (wargaId + qrCode)
  Future<bool> activateWargaByScan(String wargaId, String qrCode, double latitude, double longitude);

  /// Mengaktivasi tempat sampah untuk warga dengan lokasi GPS (latitude, longitude)
  Future<bool> activateBin(String wargaId, String binOrganikId, String binAnorganikId, {double? lat, double? lng});

  /// Mengklaim warga yang melakukan aktivasi mandiri (POST /api/v1/kkn/warga/:wargaId/claim)
  Future<Map<String, dynamic>> claimWarga(String wargaId);

  /// Mengambil riwayat aktivitas KKN
  Future<List<dynamic>> getKknHistory();

  /// Mengambil data kelompok KKN mahasiswa yang sedang login (GET /kkn/kelompok/me)
  Future<KelompokKknData?> getKelompokKkn();

  /// Mengirim laporan pemanfaatan hasil sampah ke backend
  Future<bool> submitPemanfaatanSampah(PemanfaatanSampahRequest request);

  /// Mengirim pengajuan izin/sakit ke DPL (Dosen Pembimbing Lapangan)
  /// POST /api/v1/kkn/pengajuan-izin
  Future<void> submitPengajuanIzin({
    String? scheduleId,
    required String kategori,
    required DateTime tanggal,
    required String deskripsi,
    required String fotoPath,
  });

  /// Mengambil riwayat pengajuan izin/sakit
  /// GET /api/v1/kkn/pengajuan-izin
  Future<List<dynamic>> getPengajuanIzin();

  /// Mengambil data statistik dampak kelurahan (GET /api/v1/kkn/dampak-kelurahan)
  Future<DampakKelurahanData> getDampakKelurahan();

  /// Mendaftarkan lokasi posko KKN
  Future<Map<String, dynamic>> registerPosko(Map<String, dynamic> data, {String? imagePath});

  /// Mendapatkan detail posko me
  Future<PoskoKknResponse?> getPoskoMe();

  /// Mendapatkan master data jenis fasilitas (GET /kkn/fasilitas/jenis)
  Future<List<JenisFasilitas>> getJenisFasilitas();

  /// Mendapatkan daftar fasilitas fisik warga berdasarkan RW (GET /facilities)
  Future<List<Map<String, dynamic>>> getFasilitasWarga();

  /// Mendaftarkan fasilitas daur ulang (Rumah Maggot dll)
  Future<Map<String, dynamic>> registerFasilitas(Map<String, dynamic> data, {String? imagePath});

  /// Serah terima (handover) KKN — mengirim laporan final ke DPL / admin
  /// POST /api/v1/kkn/handover
  Future<Map<String, dynamic>> submitHandover(Map<String, dynamic> data);

  // ═══════════════════════════════════════════════════════════════
  // GPS Presensi Berbasis Kegiatan
  // ═══════════════════════════════════════════════════════════════

  /// Mengambil daftar kegiatan KKN aktif hari ini
  /// GET /api/v1/kkn/kegiatan-aktif
  Future<List<Map<String, dynamic>>> getKegiatanAktif();

  /// Konfirmasi mulai kegiatan KKN (check-in awal)
  /// POST /api/v1/kkn/kegiatan/{id}/mulai
  Future<Map<String, dynamic>> mulaiKegiatan(String id, double latitude, double longitude, {String? deviceInfo});

  /// Akhiri kegiatan KKN
  /// POST /api/v1/kkn/kegiatan/{id}/selesai
  Future<Map<String, dynamic>> jedaKegiatan(String id, {required int totalDurasiDalamZonaMenit, int? accumulatedSeconds, required String alasan});
  Future<Map<String, dynamic>> selesaiKegiatan(String id, {required String sessionId, required int totalDurasiDalamZonaMenit, int? accumulatedSeconds, required String alasan});

  /// Catat pelanggaran keluar zona (penalti poin)
  /// POST /api/v1/kkn/out-of-zone-violation
  Future<Map<String, dynamic>> recordOutOfZoneViolation({required String scheduleId, required double outOfZoneMinutes});

  /// Ambil riwayat presensi (jam masuk, jam pulang, durasi aktual/target) — untuk tampilan historis setelah GPS mati
  /// GET /api/v1/kkn/kegiatan/{id}/presensi-history
  Future<Map<String, dynamic>?> getPresensiHistory(String scheduleId);

  /// Ambil ringkasan total jam presensi KKN (Timesheet Summary)
  /// GET /api/v1/timesheet/summary
  Future<Map<String, dynamic>> getTimesheetSummary();

  // ──────────────────────────────────────────────────────────
  // 3 Pilar KKN (Perencanaan, Aksi, Panen)
  // ──────────────────────────────────────────────────────────

  /// Pilar 1: Pengajuan Program Kerja
  /// POST /api/v1/kkn/program-kerja
  Future<bool> submitProgramKerja(Map<String, dynamic> data);

  /// Pilar 1: Mendapatkan daftar & status Program Kerja
  /// GET /api/v1/kkn/program-kerja
  Future<List<Map<String, dynamic>>> getProgramKerja();

  /// Pilar 2: Logbook Pemanfaatan (Mewarisi/menggantikan submitPemanfaatanSampah lama)
  /// POST /api/v1/kkn/pemanfaatan-sampah
  Future<bool> submitLogbookPemanfaatan(Map<String, dynamic> data, {String? imagePath});

  /// Input Logbook Harian (Umum) oleh Mahasiswa
  Future<bool> submitLogbookHarian(Map<String, dynamic> data, {String? imagePath});

  /// Pilar 3: Catat Panen / Hasil
  /// GET /api/v1/kkn/pemanfaatan-sampah/unharvested
  Future<List<dynamic>> getUnharvestedLogbooks();

  /// POST /api/v1/kkn/panen-hasil
  Future<bool> submitPanenHasil(Map<String, dynamic> data, {String? imagePath});
}
