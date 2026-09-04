import 'package:geolocator/geolocator.dart';

/// Mendeteksi GPS jump (lompatan koordinat akibat multipath).
///
/// Metode: Bandingkan setiap sampel ke **median posisi** seluruh sampel.
/// Sampel dianggap jump jika:
///   1. Jarak ke median > [jumpThresholdMeters] (default: 30 m), DAN
///   2. Kecepatan implisit dari sampel sebelumnya > 10 m/s
///
/// Bobot dalam Stability Score = 20% (via `noJumpScore`).
class JumpDetector {
  const JumpDetector._();

  static const double _jumpThresholdMeters = 30.0;
  static const double _jumpSpeedThreshold = 10.0; // m/s

  /// Mendeteksi indeks sampel yang merupakan GPS jump.
  /// Mengembalikan daftar indeks (0-based) sampel yang di-flag.
  static List<int> detect(
    List<Position> samples, {
    double jumpThresholdMeters = _jumpThresholdMeters,
    double jumpSpeedThreshold = _jumpSpeedThreshold,
  }) {
    if (samples.length < 3) return []; // tidak cukup data untuk deteksi

    final medianLat = _median(samples.map((s) => s.latitude).toList());
    final medianLng = _median(samples.map((s) => s.longitude).toList());

    final jumpIndices = <int>[];

    for (int i = 0; i < samples.length; i++) {
      final distToMedian = Geolocator.distanceBetween(
        samples[i].latitude,
        samples[i].longitude,
        medianLat,
        medianLng,
      );

      if (distToMedian <= jumpThresholdMeters) continue;

      // Cek kecepatan implisit dari sampel sebelumnya
      if (i > 0) {
        final distFromPrev = Geolocator.distanceBetween(
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
        final implicitSpeed =
            deltaSeconds > 0 ? distFromPrev / deltaSeconds : 999.0;

        if (implicitSpeed >= jumpSpeedThreshold) {
          jumpIndices.add(i);
        }
      } else {
        // Sampel pertama jauh dari median → flag sebagai jump
        jumpIndices.add(i);
      }
    }

    return jumpIndices;
  }

  /// Menghitung skor "tidak ada jump" dari daftar sampel.
  /// 0 jump → 100, semakin banyak jump → skor turun.
  static double noJumpScore(List<Position> samples) {
    if (samples.isEmpty) return 0.0;
    final jumps = detect(samples);
    final ratio = 1.0 - (jumps.length / samples.length);
    return (ratio * 100.0).clamp(0.0, 100.0);
  }

  static double _median(List<double> values) {
    final sorted = List<double>.from(values)..sort();
    final mid = sorted.length ~/ 2;
    if (sorted.length.isOdd) return sorted[mid];
    return (sorted[mid - 1] + sorted[mid]) / 2.0;
  }
}
