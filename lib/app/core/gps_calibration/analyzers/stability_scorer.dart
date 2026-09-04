/// Menggabungkan semua skor komponen menjadi satu Stability Score (0–100).
///
/// Formula pembobotan sesuai dokumen arsitektur:
///   finalScore = (accuracyScore × 0.40)
///              + (consistencyScore × 0.25)
///              + (noJumpScore × 0.20)
///              + (speedScore × 0.15)
///
/// Threshold keputusan:
///   ≥ 70 → GOOD (GPS Ready)
///   < 70 → BAD  (GPS Guide)
class StabilityScorer {
  const StabilityScorer._();

  /// Threshold default untuk keputusan GOOD/BAD.
  static const double defaultThreshold = 70.0;

  static const double _weightAccuracy = 0.40;
  static const double _weightConsistency = 0.25;
  static const double _weightNoJump = 0.20;
  static const double _weightSpeed = 0.15;

  /// Menghitung stability score final.
  /// Semua parameter berupa skor 0.0–100.0.
  static double compute({
    required double accuracyScore,
    required double consistencyScore,
    required double noJumpScore,
    required double speedScore,
  }) {
    final score = (accuracyScore * _weightAccuracy) +
        (consistencyScore * _weightConsistency) +
        (noJumpScore * _weightNoJump) +
        (speedScore * _weightSpeed);
    return score.clamp(0.0, 100.0);
  }

  /// Menentukan apakah score termasuk GOOD berdasarkan threshold.
  static bool isGood(double score, {double threshold = defaultThreshold}) {
    return score >= threshold;
  }

  /// Mengonversi skor ke label teks yang ramah pengguna.
  static String scoreLabel(double score) {
    if (score >= 85) return 'Sangat Baik';
    if (score >= 70) return 'Baik';
    if (score >= 50) return 'Cukup';
    return 'Lemah';
  }
}
