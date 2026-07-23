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

  @override
  List<Object?> get props => [requestId, detectedType, volumeEstimate];
}

/// Status hasil deteksi AI.
enum AiDetectionStatus { success, timeout, imageUnreadable, dailyLimitExceeded }
