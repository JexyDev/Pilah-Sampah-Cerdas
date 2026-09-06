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

  DateTime get date => createdAt;

  @override
  List<Object?> get props => [id];
}
