import 'package:equatable/equatable.dart';
import 'bin_entity.dart';

/// Hasil deteksi AI dari endpoint POST /api/v1/waste/detect.
class AiDetectionEntity extends Equatable {
  const AiDetectionEntity({
    required this.detectedType,
    required this.volumeEstimate,
    required this.isBlurry,
    this.weightKg,
    this.confidence,
    this.organicPercentage,
    this.estimatedPoints,
    this.requestId,
  });

  final WasteType detectedType;

  /// Estimasi volume dalam Liter
  final double volumeEstimate;

  /// Estimasi berat dalam kg (dari backend, berdasarkan densitas)
  final double? weightKg;

  /// Confidence score 0.0–1.0
  final double? confidence;
  
  /// Persentase probabilitas sampah ini organik (0.0-1.0)
  final double? organicPercentage;
  
  /// Estimasi poin yang akan didapat
  final int? estimatedPoints;

  final bool isBlurry;
  final String? requestId;

  /// Berat yang ditampilkan ke user — pakai dari backend jika ada, fallback hitung lokal
  double get displayWeightKg {
    if (weightKg != null && weightKg! > 0) return weightKg!;
    final density = detectedType == WasteType.organic ? 0.4 : 0.2;
    return volumeEstimate * density;
  }

  /// Kalkulasi poin lokal (BUG-003)
  /// Formula: Poin = (kategori_rate x berat/volume sampah x 100) x confidence_AI x 0.9
  int get calculatedPoints {
    if (estimatedPoints != null && estimatedPoints! > 0) return estimatedPoints!;
    final weight = displayWeightKg;
    final conf = confidence ?? 0.85;
    final double rawPoint = (weight * 100.0) * conf * 0.9;
    return rawPoint.round();
  }

  @override
  List<Object?> get props => [requestId, detectedType, volumeEstimate];
}

/// Status hasil deteksi AI.
enum AiDetectionStatus { success, timeout, imageUnreadable, dailyLimitExceeded }
