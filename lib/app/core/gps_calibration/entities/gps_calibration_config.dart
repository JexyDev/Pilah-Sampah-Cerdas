/// Konfigurasi modul kalibrasi GPS.
/// Seluruh parameter dapat dikustomisasi dari luar use case.
class GpsCalibrationConfig {
  /// Jumlah sampel GPS yang akan diambil.
  final int sampleCount;

  /// Interval antar pengambilan sampel.
  final Duration sampleInterval;

  /// Batas waktu total proses kalibrasi sebelum fallback ke state BAD.
  final Duration timeout;

  /// Threshold skor stabilitas untuk keputusan GOOD/BAD.
  final double scoreThreshold;

  const GpsCalibrationConfig({
    this.sampleCount = 6,
    this.sampleInterval = const Duration(seconds: 1),
    this.timeout = const Duration(seconds: 30),
    this.scoreThreshold = 70.0,
  });

  /// Konfigurasi default untuk presensi KKN.
  static const kknDefault = GpsCalibrationConfig();
}
