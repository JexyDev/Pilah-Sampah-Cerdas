import 'package:geolocator/geolocator.dart';

/// Menganalisis akurasi rata-rata sampel GPS dan menghasilkan skor 0–100.
///
/// Bobot akurasi dalam Stability Score = 40%.
/// Kriteria:
///   ≤ 10 m  → 100
///   > 50 m  → 0
///   di antara → interpolasi linear
class AccuracyAnalyzer {
  const AccuracyAnalyzer._();

  static const double _bestAccuracy = 10.0; // meter → skor penuh
  static const double _worstAccuracy = 50.0; // meter → skor nol

  /// Menghitung skor akurasi dari daftar sampel GPS.
  /// Mengembalikan nilai 0.0 – 100.0.
  static double score(List<Position> samples) {
    if (samples.isEmpty) return 0.0;

    final avg = samples.map((s) => s.accuracy).reduce((a, b) => a + b) /
        samples.length;

    return _accuracyToScore(avg);
  }

  /// Rata-rata akurasi dalam meter dari daftar sampel.
  static double avgAccuracyMeters(List<Position> samples) {
    if (samples.isEmpty) return 999.0;
    return samples.map((s) => s.accuracy).reduce((a, b) => a + b) /
        samples.length;
  }

  static double _accuracyToScore(double accuracyMeters) {
    if (accuracyMeters <= _bestAccuracy) return 100.0;
    if (accuracyMeters >= _worstAccuracy) return 0.0;
    // Interpolasi linear terbalik: semakin kecil akurasi, semakin besar skor
    final ratio =
        (_worstAccuracy - accuracyMeters) / (_worstAccuracy - _bestAccuracy);
    return (ratio * 100.0).clamp(0.0, 100.0);
  }

  /// Mengevaluasi apakah satu sampel termasuk akurasi baik (≤ 20 m).
  static bool isSampleAccurate(Position sample, {double threshold = 20.0}) {
    return sample.accuracy <= threshold;
  }
}
