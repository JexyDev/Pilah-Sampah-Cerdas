import '../models/petugas_residu_models.dart';

abstract class PetugasResiduRepository {
  Future<PetugasResiduDashboard?> getCachedDashboard();
  /// Ambil ringkasan dashboard Petugas Residu
  Future<PetugasResiduDashboard> getDashboard();

  Future<List<ResiduBinPickup>?> getCachedJadwalHarian({String? kecamatan, String? kelurahan, String? rw});
  /// Ambil daftar tempat sampah dalam assignedZone dengan volume >= 70%
  Future<List<ResiduBinPickup>> getJadwalHarian({String? kecamatan, String? kelurahan, String? rw});

  /// Submit input timbangan fisik residu
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

  /// Ganti password khusus Petugas Residu
  Future<bool> changePassword({required String oldPassword, required String newPassword});
}
