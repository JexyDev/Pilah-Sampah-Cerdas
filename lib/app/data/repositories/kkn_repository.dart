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

  /// Mengirim ping lokasi (latitude, longitude) ke backend.
  Future<void> sendLocationPing(double latitude, double longitude);
}
