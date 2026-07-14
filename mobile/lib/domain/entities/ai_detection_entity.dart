import 'package:equatable/equatable.dart';
import 'bin_entity.dart';

/// Hasil deteksi AI — sesuai sdd.md §3.1 API Contract detect-mock.
class AiDetectionEntity extends Equatable {
  const AiDetectionEntity({
    required this.detectedType,
    required this.volumeEstimate,
    required this.isBlurry,
    this.requestId,
  });

  final WasteType detectedType;
  final double volumeEstimate;
  final bool isBlurry;
  final String? requestId;

  @override
  List<Object?> get props => [requestId, detectedType, volumeEstimate];
}

/// Status hasil deteksi AI.
enum AiDetectionStatus { success, timeout, imageUnreadable, dailyLimitExceeded }
