import '../entities/bin_entity.dart';
import '../entities/ai_detection_entity.dart';
import '../entities/bin_reset_entity.dart';

/// Interface repository tong sampah.
/// Implementasi: ApiBinRepository (data layer).
abstract class BinRepository {
  /// Ambil tong sampah milik user/rumah tangga tertentu.
  Future<List<BinEntity>> getBinsByHousehold(String householdId);

  /// Ambil tong berdasarkan QR serial.
  Future<BinEntity?> getBinByQrSerial(String qrSerial);

  /// Deteksi AI — kirim foto sampah ke backend, return jenis + estimasi berat.
  /// [imagePath] path file foto yang diambil kamera. Wajib diisi.
  Future<AiDetectionEntity> detectWaste(
    String userId, {
    required String imagePath,
  });

  /// Kirim transaksi scan QR — FR-02.
  /// Sesuai sdd.md §3.2 + §9 (Geofencing).
  Future<ScanResult> scanAndCommit({
    required String qrCode,
    required String userId,
    required WasteType detectedType,
    required double estimatedVolume,
    required String householdId,
    required double userLat,
    required double userLng,
  });

  /// Aktivasi tong baru — scan pertama kali oleh warga (prd.md §4.1).
  Future<BinEntity> activateBin({
    required String qrSerial,
    required String userId,
    required String householdId,
    double? latitude,
    double? longitude,
  });

  /// Ajukan pengosongan tong — FR (prd.md §3.1, sdd.md §7.1).
  Future<BinResetEntity> submitResetRequest({
    required String binId,
    required String userId,
    required String evidencePhotoPath,
  });

  /// Set kapasitas tong setelah aktivasi.
  Future<void> measureBin({
    required String qrCode,
    required WasteType binType,
    required double maxCapacityLiter,
  });
}

/// Hasil transaksi scan QR.
class ScanResult {
  const ScanResult({
    required this.weightKg,
    required this.pointsAwarded,
    required this.newBinVolumeL,
  });

  final double weightKg;
  final int pointsAwarded;
  final double newBinVolumeL;
}

/// Exception khusus bin errors — sesuai sdd.md §10 error codes.
class BinException implements Exception {
  const BinException(this.code, [this.message]);

  final String code;
  final String? message;

  @override
  String toString() => 'BinException($code): $message';
}
