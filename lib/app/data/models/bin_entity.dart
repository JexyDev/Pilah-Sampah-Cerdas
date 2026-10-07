import 'package:equatable/equatable.dart';
import '../../core/values/app_config.dart';

/// Entitas tempat sampah — sesuai sdd.md §2 tabel `bins`.
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
    required this.rw,
    this.kecamatan = '',
    this.kelurahan = '',
    required this.isActive,
    this.isResetPending = false,
    this.activeResetRequestId,
    this.createdAt,
    this.activatedAt,
    this.backendStatus = '',
  });

  BinEntity copyWith({
    String? id,
    String? qrSerial,
    WasteType? binType,
    double? currentVolumeL,
    double? maxCapacityL,
    double? lat,
    double? lng,
    String? householdName,
    String? rw,
    String? kecamatan,
    String? kelurahan,
    bool? isActive,
    bool? isResetPending,
    String? activeResetRequestId,
    String? backendStatus,
  }) {
    return BinEntity(
      id: id ?? this.id,
      qrSerial: qrSerial ?? this.qrSerial,
      binType: binType ?? this.binType,
      currentVolumeL: currentVolumeL ?? this.currentVolumeL,
      maxCapacityL: maxCapacityL ?? this.maxCapacityL,
      lat: lat ?? this.lat,
      lng: lng ?? this.lng,
      householdName: householdName ?? this.householdName,
      rw: rw ?? this.rw,
      kecamatan: kecamatan ?? this.kecamatan,
      kelurahan: kelurahan ?? this.kelurahan,
      isActive: isActive ?? this.isActive,
      isResetPending: isResetPending ?? this.isResetPending,
      activeResetRequestId: activeResetRequestId ?? this.activeResetRequestId,
      backendStatus: backendStatus ?? this.backendStatus,
    );
  }

  final String id;
  final String qrSerial;
  final WasteType binType;
  final double currentVolumeL;
  final double maxCapacityL;
  final double lat;
  final double lng;
  final String householdName;
  final String rw;
  final String kecamatan;
  final String kelurahan;
  final bool isActive;
  final bool isResetPending;
  final String? activeResetRequestId;
  final DateTime? createdAt;
  final DateTime? activatedAt;
  final String backendStatus;

  /// Persentase kapasitas terisi (0.0 – 1.0).
  double get capacityPercent {
    if (maxCapacityL <= 0 || currentVolumeL.isNaN || maxCapacityL.isNaN) return 0.0;
    final val = currentVolumeL / maxCapacityL;
    if (val.isNaN || val.isInfinite) return 0.0;
    return val;
  }

  /// Volume sisa dalam liter.
  double get remainingVolumeL {
    if (maxCapacityL.isNaN || currentVolumeL.isNaN) return 0.0;
    final val = maxCapacityL - currentVolumeL;
    return (val.isNaN || val.isInfinite) ? 0.0 : val;
  }

  /// Volume saat ini dalam Liter murni.
  double get currentVolumeLiter => currentVolumeL;

  /// Kapasitas maksimal dalam Liter murni.
  double get maxCapacityLiter => maxCapacityL;

  /// Densitas berat per liter tempat sampah (deprecated, role warga menggunakan satuan pure Liter).
  double get densityKgPerLiter => AppConfig.organicDensityKgPerLiter;

  /// Estimasi saat ini dalam Liter (kompatibilitas getter lama).
  double get currentWeightKg => currentVolumeL;

  /// Kapasitas maksimal dalam Liter (kompatibilitas getter lama).
  double get maxWeightKg => maxCapacityL;

  /// Status kapasitas tempat sampah sesuai threshold srs.md FR-04.
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

/// Status kapasitas tempat sampah.
enum BinStatus { safe, warning, critical }
