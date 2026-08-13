import '../models/petugas_pemilahan_models.dart';

abstract class PetugasPemilahanRepository {
  Future<PetugasPemilahanDashboard?> getCachedDashboard();
  /// Ambil ringkasan dashboard Petugas Pemilahan
  Future<PetugasPemilahanDashboard> getDashboard();

  Future<List<PemilahanBinPickup>?> getCachedJadwalHarian({String? kecamatan, String? kelurahan, String? rw});
  /// Ambil daftar tempat sampah dalam assignedZone dengan volume >= 70%
  Future<List<PemilahanBinPickup>> getJadwalHarian({String? kecamatan, String? kelurahan, String? rw});

  /// Submit input timbangan fisik pemilahan
  Future<bool> submitLog({
    required String binId,
    required double actualWeightKg,
    required String classification,
    required String photoPath,
    double? latitude,
    double? longitude,
  });

  Future<List<Map<String, dynamic>>?> getCachedHistory({String? dateRange, String? type});
  /// Ambil riwayat gabungan setoran manual & violation milik petugas
  Future<List<Map<String, dynamic>>> getHistory({String? dateRange, String? type});

  /// Ganti password khusus Petugas Pemilahan
  Future<bool> changePassword({required String oldPassword, required String newPassword});

  /// Terima / Klaim pengajuan reset tempat sampah dari Warga (PUT /petugas-pemilahan/pengajuan/{id}/terima)
  Future<bool> claimPengajuanReset(String pengajuanId);
}

