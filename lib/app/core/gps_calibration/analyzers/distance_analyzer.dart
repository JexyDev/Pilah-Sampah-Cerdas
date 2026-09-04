import 'package:geolocator/geolocator.dart';
import 'dart:math' as math;

/// Menganalisis konsistensi jarak antar sampel GPS berurutan.
///
/// Menggunakan std-dev jarak untuk mengukur seberapa "diam" sinyal GPS.
/// Bobot dalam Stability Score = 25%.
/// Kriteria:
///   std-dev < 5 m  → 100
///   std-dev > 30 m → 0
class DistanceAnalyzer {
  const DistanceAnalyzer._();

  static const double _bestStdDev = 5.0;  // meter → skor penuh
  static const double _worstStdDev = 30.0; // meter → skor nol

  /// Menghitung skor konsistensi jarak dari daftar sampel GPS.
  /// Mengembalikan nilai 0.0 – 100.0.
  static double consistencyScore(List<Position> samples) {
    if (samples.length < 2) return 50.0; // tidak cukup data → skor netral

    final distances = <double>[];
    for (int i = 1; i < samples.length; i++) {
      final d = Geolocator.distanceBetween(
        samples[i - 1].latitude,
        samples[i - 1].longitude,
        samples[i].latitude,
        samples[i].longitude,
      );
      distances.add(d);
    }

    final stdDev = _stdDev(distances);
    return _stdDevToScore(stdDev);
  }

  /// Mengembalikan daftar jarak (meter) antar sampel berurutan.
  static List<double> computeDistances(List<Position> samples) {
    if (samples.length < 2) return [];
    final result = <double>[];
    for (int i = 1; i < samples.length; i++) {
      result.add(Geolocator.distanceBetween(
        samples[i - 1].latitude,
        samples[i - 1].longitude,
        samples[i].latitude,
        samples[i].longitude,
      ));
    }
    return result;
  }

  static double _mean(List<double> values) =>
      values.reduce((a, b) => a + b) / values.length;

  static double _stdDev(List<double> values) {
    if (values.length < 2) return 0.0;
    final m = _mean(values);
    final variance =
        values.map((v) => math.pow(v - m, 2)).reduce((a, b) => a + b) /
            values.length;
    return math.sqrt(variance);
  }

  static double _stdDevToScore(double stdDev) {
    if (stdDev <= _bestStdDev) return 100.0;
    if (stdDev >= _worstStdDev) return 0.0;
    final ratio = (_worstStdDev - stdDev) / (_worstStdDev - _bestStdDev);
    return (ratio * 100.0).clamp(0.0, 100.0);
  }
}
