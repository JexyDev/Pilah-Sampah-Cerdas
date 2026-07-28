import 'package:equatable/equatable.dart';
import '../../config/app_config.dart';

/// Entitas tong sampah — sesuai sdd.md §2 tabel `bins`.
class BinEntity extends Equatable {
  const BinEntity({
    required this.id,
    required this.qrSerial,
    required this.binType,
    required this.currentVolumeL,
    required this.maxCapacityL,
    required this.lat,
    required this.lng,
    required this.householdName,
    required this.rt,
    required this.rw,
    required this.kelurahan,
    required this.isActive,
  });

  final String id;
  final String qrSerial;
  final WasteType binType;
  final double currentVolumeL;
  final double maxCapacityL;
  final double lat;
  final double lng;
  final String householdName;
  final String rt;
  final String rw;
  final String kelurahan;
  final bool isActive;

  /// Persentase kapasitas terisi (0.0 – 1.0).
  double get capacityPercent => currentVolumeL / maxCapacityL;

  /// Volume sisa dalam liter.
  double get remainingVolumeL => maxCapacityL - currentVolumeL;

  /// Status kapasitas tong sesuai threshold srs.md FR-04.
  BinStatus get status {
    if (capacityPercent >= AppConfig.binCriticalThresholdPercent) {
      return BinStatus.critical;
    } else if (capacityPercent >= 0.70) {
      return BinStatus.warning;
    }
    return BinStatus.safe;
  }

  bool get isCritical =>
      capacityPercent >= AppConfig.binCriticalThresholdPercent;

  @override
  List<Object?> get props => [id, qrSerial];
}

/// Jenis sampah sesuai srs.md FR-01 dan sdd.md tabel `waste_categories`.
enum WasteType {
  organic('Organik', 'ORGANIC'),
  nonOrganic('Anorganik', 'NON_ORGANIC');

  const WasteType(this.displayName, this.apiValue);
  final String displayName;
  final String apiValue;
}

/// Status kapasitas tong.
enum BinStatus { safe, warning, critical }
