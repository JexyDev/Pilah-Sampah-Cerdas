import 'package:geolocator/geolocator.dart';

/// Menganalisis kecepatan implisit antar sampel GPS berurutan.
///
/// Kecepatan implisit = jarak (m) / Δwaktu (s).
/// Bobot dalam Stability Score = 15%.
/// Kriteria kondisi diam/berdiri:
///   < 2 m/s  → 100 (diam / berjalan lambat)
///   > 40 m/s → 0   (anomali fisik, kemungkinan GPS jump)
class SpeedAnalyzer {
  const SpeedAnalyzer._();

  static const double _maxNormalSpeed = 2.0;   // m/s → skor penuh
  static const double _anomalySpeed = 40.0;    // m/s → skor nol (144 km/jam)

  /// Menghitung skor kecepatan dari daftar sampel GPS.
  /// Mengembalikan nilai 0.0 – 100.0.
  static double score(List<Position> samples) {
    if (samples.length < 2) return 80.0; // tidak cukup data → asumsi baik

    final speeds = _computeImplicitSpeeds(samples);
    if (speeds.isEmpty) return 80.0;

    // Gunakan kecepatan maksimum sebagai penalti utama
    final maxSpeed = speeds.reduce((a, b) => a > b ? a : b);
    return _speedToScore(maxSpeed);
  }

  /// Mengembalikan daftar kecepatan implisit (m/s) antar sampel berurutan.
  static List<double> computeSpeeds(List<Position> samples) =>
      _computeImplicitSpeeds(samples);

  static List<double> _computeImplicitSpeeds(List<Position> samples) {
    final result = <double>[];
    for (int i = 1; i < samples.length; i++) {
      final distance = Geolocator.distanceBetween(
        samples[i - 1].latitude,
        samples[i - 1].longitude,
        samples[i].latitude,
        samples[i].longitude,
      );
      final deltaSeconds = samples[i]
              .timestamp
              .difference(samples[i - 1].timestamp)
              .inMilliseconds /
          1000.0;
      if (deltaSeconds > 0) {
        result.add(distance / deltaSeconds);
      }
    }
    return result;
  }

  static double _speedToScore(double speedMs) {
    if (speedMs <= _maxNormalSpeed) return 100.0;
    if (speedMs >= _anomalySpeed) return 0.0;
    final ratio = (_anomalySpeed - speedMs) / (_anomalySpeed - _maxNormalSpeed);
    return (ratio * 100.0).clamp(0.0, 100.0);
  }
}
