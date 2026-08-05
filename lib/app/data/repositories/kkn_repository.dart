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
  Future<KknDashboardData> getDashboard();

  /// Mengambil daftar warga yang didampingi beserta riwayat pemilahan.
  Future<List<WargaDampingan>> getWargaDampingan();

  /// Mendaftarkan warga baru melalui akun mahasiswa.
  /// Backend otomatis melakukan binding mahasiswa ↔ warga.
  Future<void> registerWarga(RegisterWargaRequest request);

  /// Mengambil log aktivitas KKN mahasiswa (/kkn/activity-log).
  Future<List<dynamic>> getActivityLog();

  /// Mengirim ping lokasi (latitude, longitude) ke backend dan mengembalikan nama posko/wilayah zona.
  Future<String?> sendLocationPing(double latitude, double longitude);

  /// Mengambil daftar jadwal kegiatan KKN.
  Future<List<dynamic>> getSchedules();

  /// Mengambil data koordinat zona penugasan aktif (GET /kkn/active-zone)
  Future<Map<String, dynamic>> getActiveZone();

  /// Mengambil target lokasi kegiatan KKN.
  Future<Map<String, dynamic>> getTargetLocation(String scheduleId);

  /// Mencatat absensi (radius KKN) dengan payload lengkap.
  Future<bool> recordAttendance({
    required String scheduleId,
    required double latitude,
    required double longitude,
    required String method,
    String? nim,
    String? namaMahasiswa,
    String? kodeZona,
    String? rtRw,
    String? kelurahan,
    int? durationMinutes,
    String? timestamp,
  });

  /// Mengambil daftar warga (untuk fitur aktivasi)
  Future<List<dynamic>> getWargaForAktivasi({String? kelurahan, String? rtRw, String? search});

  /// Mengaktivasi warga by scan (wargaId + qrCode)
  Future<bool> activateWargaByScan(String wargaId, String qrCode, double latitude, double longitude);

  /// Mengaktivasi bin untuk warga dengan lokasi GPS (latitude, longitude)
  Future<bool> activateBin(String wargaId, String binOrganikId, String binAnorganikId, {double? lat, double? lng});

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
}
