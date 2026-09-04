import 'package:geolocator/geolocator.dart';

/// Hasil akhir dari proses kalibrasi GPS.
class GpsCalibrationResult {
  /// Posisi koordinat final (representasi terbaik dari sampel valid).
  final Position finalPosition;

  /// Skor stabilitas GPS 0–100.
  final double stabilityScore;

  /// Rata-rata akurasi GPS (meter) dari sampel yang dikumpulkan.
  final double avgAccuracyMeters;

  /// Jumlah sampel yang terdeteksi sebagai GPS jump.
  final int jumpCount;

  /// Apakah izin lokasi yang diberikan adalah Precise Location.
  final bool isPreciseLocation;

  /// Daftar aksi panduan yang direkomendasikan (diisi saat status BAD).
  final List<String> guideActions;

  /// Jumlah percobaan kalibrasi ulang (retry) dalam sesi ini.
  final int retryCount;

  const GpsCalibrationResult({
    required this.finalPosition,
    required this.stabilityScore,
    required this.avgAccuracyMeters,
    required this.jumpCount,
    required this.isPreciseLocation,
    this.guideActions = const [],
    this.retryCount = 0,
  });

  bool get isGood => stabilityScore >= 70.0;
}
