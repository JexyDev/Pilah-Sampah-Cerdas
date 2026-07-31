import 'package:equatable/equatable.dart';

/// State whitelist & status akun Petugas Residu
enum WhitelistStatus { pending, approved, rejected }

extension WhitelistStatusExtension on WhitelistStatus {
  String get displayName {
    switch (this) {
      case WhitelistStatus.pending:
        return 'Menunggu Persetujuan';
      case WhitelistStatus.approved:
        return 'Terverifikasi (Approved)';
      case WhitelistStatus.rejected:
        return 'Ditolak';
    }
  }

  static WhitelistStatus fromApi(String value) {
    switch (value.toUpperCase()) {
      case 'APPROVED':
        return WhitelistStatus.approved;
      case 'REJECTED':
        return WhitelistStatus.rejected;
      default:
        return WhitelistStatus.pending;
    }
  }
}

/// Model Ringkasan Dashboard Petugas Residu
class PetugasResiduDashboard extends Equatable {
  const PetugasResiduDashboard({
    required this.petugasId,
    required this.name,
    required this.assignedZone,
    required this.whitelistStatus,
    required this.accountStatus,
    required this.totalJadwal,
    required this.sudahDiambil,
    required this.pelanggaranCount,
    required this.totalWeightKg,
    required this.kpiScore,
    this.ketepatanWaktuScore = 95.0,
    this.akurasiScore = 92.0,
  });

  final String petugasId;
  final String name;
  final String assignedZone; // e.g. 'RT 01/RW 02 Kel. Bojongsoang'
  final WhitelistStatus whitelistStatus;
  final String accountStatus; // 'ACTIVE', 'PENDING', 'INACTIVE'
  final int totalJadwal;
  final int sudahDiambil;
  final int pelanggaranCount;
  final double totalWeightKg;
  final double kpiScore; // Formula: 0.6 * ketepatanWaktu + 0.4 * akurasi
  final double ketepatanWaktuScore;
  final double akurasiScore;

  int get sisaJadwal => totalJadwal > sudahDiambil ? totalJadwal - sudahDiambil : 0;
  bool get isApproved => whitelistStatus == WhitelistStatus.approved && accountStatus.toUpperCase() == 'ACTIVE';

  factory PetugasResiduDashboard.fromJson(Map<String, dynamic> json) {
    final double timeScore = (json['ketepatanWaktuScore'] as num?)?.toDouble() ?? 95.0;
    final double accScore = (json['akurasiScore'] as num?)?.toDouble() ?? 92.0;
    final double calculatedKpi = (0.6 * timeScore) + (0.4 * accScore);

    return PetugasResiduDashboard(
      petugasId: json['petugasId']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Petugas Residu',
      assignedZone: json['assignedZone']?.toString() ?? json['rtRw']?.toString() ?? 'RT 01/RW 02',
      whitelistStatus: WhitelistStatusExtension.fromApi(json['whitelistStatus']?.toString() ?? 'APPROVED'),
      accountStatus: json['accountStatus']?.toString() ?? 'ACTIVE',
      totalJadwal: (json['totalJadwal'] as num?)?.toInt() ?? 8,
      sudahDiambil: (json['sudahDiambil'] as num?)?.toInt() ?? 3,
      pelanggaranCount: (json['pelanggaranCount'] as num?)?.toInt() ?? 1,
      totalWeightKg: (json['totalWeightKg'] as num?)?.toDouble() ?? 42.5,
      kpiScore: (json['kpiScore'] as num?)?.toDouble() ?? calculatedKpi,
      ketepatanWaktuScore: timeScore,
      akurasiScore: accScore,
    );
  }

  @override
  List<Object?> get props => [petugasId, assignedZone, whitelistStatus, totalJadwal, sudahDiambil];
}

/// Model Item Tempat Sampah dalam Jadwal Penjemputan Hilir
class ResiduBinPickup extends Equatable {
  const ResiduBinPickup({
    required this.binId,
    required this.binCode,
    required this.wargaName,
    required this.address,
    required this.kelurahan,
    required this.rtRw,
    required this.volumePercentage,
    required this.isPickedUp,
    this.lastPickedUpTime,
    this.latitude,
    this.longitude,
    this.wasteCategory = 'RESIDU',
  });

  final String binId;
  final String binCode;
  final String wargaName;
  final String address;
  final String kelurahan;
  final String rtRw;
  final double volumePercentage; // e.g. 75.0 (%)
  final bool isPickedUp;
  final DateTime? lastPickedUpTime;
  final double? latitude;
  final double? longitude;
  final String wasteCategory;

  bool get isHighVolume => volumePercentage >= 70.0;

  factory ResiduBinPickup.fromJson(Map<String, dynamic> json) {
    return ResiduBinPickup(
      binId: json['binId']?.toString() ?? json['id']?.toString() ?? '',
      binCode: json['binCode']?.toString() ?? json['qrCode']?.toString() ?? 'BIN-RESIDU',
      wargaName: json['wargaName']?.toString() ?? json['user']?['name']?.toString() ?? 'Warga',
      address: json['address']?.toString() ?? json['alamat']?.toString() ?? 'Jl. Raya Bojongsoang No. 12',
      kelurahan: json['kelurahan']?.toString() ?? '',
      rtRw: json['rtRw']?.toString() ?? '',
      volumePercentage: (json['volumePercentage'] as num?)?.toDouble() ?? 80.0,
      isPickedUp: json['isPickedUp'] as bool? ?? (json['status']?.toString().toUpperCase() == 'PICKED_UP'),
      lastPickedUpTime: DateTime.tryParse(json['lastPickedUpTime']?.toString() ?? ''),
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      wasteCategory: json['wasteCategory']?.toString() ?? 'RESIDU',
    );
  }

  @override
  List<Object?> get props => [binId, binCode, volumePercentage, isPickedUp];
}

/// Model Log Timbangan Fisik Residu
class ResiduSubmitLog extends Equatable {
  const ResiduSubmitLog({
    required this.id,
    required this.binId,
    required this.actualWeightKg,
    required this.classification,
    required this.photoUrl,
    required this.submittedAt,
  });

  final String id;
  final String binId;
  final double actualWeightKg;
  final String classification;
  final String photoUrl;
  final DateTime submittedAt;

  factory ResiduSubmitLog.fromJson(Map<String, dynamic> json) {
    return ResiduSubmitLog(
      id: json['id']?.toString() ?? '',
      binId: json['binId']?.toString() ?? '',
      actualWeightKg: (json['actualWeightKg'] as num?)?.toDouble() ?? 0.0,
      classification: json['classification']?.toString() ?? 'Residu Non-B3',
      photoUrl: json['photoUrl']?.toString() ?? '',
      submittedAt: DateTime.tryParse(json['submittedAt']?.toString() ?? '') ?? DateTime.now(),
    );
  }

  @override
  List<Object?> get props => [id, binId, actualWeightKg, classification];
}

/// Model Pelanggaran Residu Tercampur
class ResiduViolation extends Equatable {
  const ResiduViolation({
    required this.id,
    required this.binQrCode,
    required this.evidencePhotoUrl,
    required this.type,
    required this.severity,
    this.wargaName,
    this.address,
    required this.createdAt,
  });

  final String id;
  final String binQrCode;
  final String evidencePhotoUrl;
  final String type; // 'Sampah Organik Tercampur', 'Sampah Anorganik Tercampur', 'Sampah B3 Tidak Terpilah'
  final String severity; // 'LOW', 'MEDIUM', 'SEVERE'
  final String? wargaName;
  final String? address;
  final DateTime createdAt;

  int get pointDeduction {
    switch (severity.toUpperCase()) {
      case 'LOW':
        return 10;
      case 'MEDIUM':
        return 25;
      case 'SEVERE':
        return 50;
      default:
        return 10;
    }
  }

  factory ResiduViolation.fromJson(Map<String, dynamic> json) {
    return ResiduViolation(
      id: json['id']?.toString() ?? '',
      binQrCode: json['binQrCode']?.toString() ?? '',
      evidencePhotoUrl: json['evidencePhotoUrl']?.toString() ?? json['photoUrl']?.toString() ?? '',
      type: json['type']?.toString() ?? 'Sampah Organik Tercampur',
      severity: json['severity']?.toString() ?? 'LOW',
      wargaName: json['wargaName']?.toString(),
      address: json['address']?.toString(),
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
    );
  }

  @override
  List<Object?> get props => [id, binQrCode, type, severity];
}
