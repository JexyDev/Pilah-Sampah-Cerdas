import 'package:equatable/equatable.dart';
import 'bin_entity.dart';

/// Entitas riwayat setoran sampah (`log_sampah` / `setoran_otomatis`)
class WasteLogEntity extends Equatable {
  const WasteLogEntity({
    required this.id,
    required this.userId,
    required this.binId,
    required this.wasteType,
    required this.volumeLiter,
    required this.weightKg,
    required this.pointsAwarded,
    required this.createdAt,
    this.binQrSerial,
    this.kelurahan,
    this.wargaName,
    this.wilayah,
    this.photoUrl,
    this.isValidated = true,
    this.location,
    this.qrActivationTimestamp,
    this.discrepancyStatus = 'NONE',
    this.aiConfidence = 0.0,
  });

  final String id;
  final String userId;
  final String binId;
  final WasteType wasteType;
  final double volumeLiter;
  final double weightKg;
  final int pointsAwarded;
  final DateTime createdAt;
  final String? binQrSerial;
  final String? kelurahan;
  final String? wargaName;
  final String? wilayah;
  final String? photoUrl;
  final bool isValidated;
  final String? location;
  final DateTime? qrActivationTimestamp;
  final String discrepancyStatus;
  final double aiConfidence;

  DateTime get date => createdAt;

  bool get isCorrect {
    if (discrepancyStatus.toUpperCase() != 'NONE') return false;
    
    // Jika backend tidak mengirim confidence (0.0), kita asumsikan benar (atau sesuai discrepancyStatus).
    if (aiConfidence <= 0.0) return true;

    final conf = aiConfidence > 1.0 ? aiConfidence : aiConfidence * 100;
    return conf >= 80.0;
  }

  @override
  List<Object?> get props => [id];
}
