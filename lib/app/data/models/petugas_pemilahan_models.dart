import 'package:equatable/equatable.dart';

/// State whitelist & status akun Petugas Pemilahan
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

/// Model Ringkasan Dashboard Petugas Pemilahan
class PetugasPemilahanDashboard extends Equatable {
  const PetugasPemilahanDashboard({
    required this.petugasId,
    required this.name,
    required this.assignedZone,
    required this.whitelistStatus,
    required this.accountStatus,
    required this.totalJadwal,
    required this.sudahDiambil,
    required this.totalWeightKg,
    required this.monthlyWeightKg,
    required this.kpiScore,
    required this.totalPoints,
    this.ketepatanWaktuScore = 0.0,
    this.akurasiScore = 0.0,
  });

  final String petugasId;
  final String name;
  final String assignedZone; // e.g. 'RT 01/RW 02 Kel. Bojongsoang'
  final WhitelistStatus whitelistStatus;
  final String accountStatus; // 'ACTIVE', 'PENDING', 'INACTIVE'
  final int totalJadwal;
  final int sudahDiambil;
  final double totalWeightKg; // Maps to todayWeightKg from API
  final double monthlyWeightKg; // Maps to monthlyWeightKg from API
  final double kpiScore; // Formula: 0.6 * ketepatanWaktu + 0.4 * akurasi
  final int totalPoints;
  final double ketepatanWaktuScore;
  final double akurasiScore;

  int get sisaJadwal =>
      totalJadwal > sudahDiambil ? totalJadwal - sudahDiambil : 0;
  bool get isApproved => whitelistStatus == WhitelistStatus.approved;

  factory PetugasPemilahanDashboard.fromJson(Map<String, dynamic> json) {
    final double timeScore =
        (json['ketepatanWaktuScore'] as num?)?.toDouble() ?? 0.0;
    final double accScore = (json['akurasiScore'] as num?)?.toDouble() ?? 0.0;
    final double calculatedKpi = (0.6 * timeScore) + (0.4 * accScore);

    return PetugasPemilahanDashboard(
      petugasId: json['petugasId']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      assignedZone:
          json['assignedZone']?.toString() ??
          json['rw']?.toString() ??
          json['rtRw']?.toString() ??
          '-',
      whitelistStatus: WhitelistStatusExtension.fromApi(
        json['whitelistStatus']?.toString() ?? 'PENDING',
      ),
      accountStatus: json['accountStatus']?.toString() ?? 'ACTIVE',
      totalJadwal: (json['totalJadwal'] as num?)?.toInt() ?? 0,
      sudahDiambil: (json['sudahDiambil'] as num?)?.toInt() ?? 0,
      totalWeightKg:
          (json['todayWeightKg'] as num?)?.toDouble() ??
          (json['totalWeightKg'] as num?)?.toDouble() ??
          0.0,
      monthlyWeightKg: (json['monthlyWeightKg'] as num?)?.toDouble() ?? 0.0,
      kpiScore: (json['kpiScore'] as num?)?.toDouble() ?? calculatedKpi,
      totalPoints: (json['totalPoints'] as num?)?.toInt() ?? 0,
      ketepatanWaktuScore: timeScore,
      akurasiScore: accScore,
    );
  }

  @override
  List<Object?> get props => [
    petugasId,
    name,
    assignedZone,
    whitelistStatus,
    accountStatus,
    totalJadwal,
    sudahDiambil,
    totalWeightKg,
    monthlyWeightKg,
    kpiScore,
  ];
}

/// Model Item Tempat Sampah dalam Jadwal Penjemputan Hilir
class PemilahanBinPickup extends Equatable {
  const PemilahanBinPickup({
    required this.binId,
    required this.binCode,
    required this.wargaName,
    required this.address,
    required this.kecamatan,
    required this.kelurahan,
    required this.rw,
    required this.volumePercentage,
    required this.isPickedUp,
    this.lastPickedUpTime,
    this.latitude,
    this.longitude,
    this.wasteCategory = '-',
  });

  final String binId;
  final String binCode;
  final String wargaName;
  final String address;
  final String kecamatan;
  final String kelurahan;
  final String rw;
  final double volumePercentage; // e.g. 75.0 (%)
  final bool isPickedUp;
  final DateTime? lastPickedUpTime;
  final double? latitude;
  final double? longitude;
  final String wasteCategory;

  bool get isHighVolume => volumePercentage >= 70.0;

  /// Memeriksa apakah tempat sampah ini berada di RW tertentu secara andal
  bool matchesRw(String? targetRw) {
    if (targetRw == null || targetRw.trim().isEmpty || targetRw == '-') return true;
    final cleanTarget = targetRw.replaceAll(RegExp(r'[^\d]'), '');
    final cleanThis = rw.replaceAll(RegExp(r'[^\d]'), '');
    if (cleanTarget.isNotEmpty && cleanThis.isNotEmpty) {
      return cleanThis == cleanTarget;
    }
    return rw.toLowerCase().contains(targetRw.toLowerCase().trim()) ||
        targetRw.toLowerCase().contains(rw.toLowerCase().trim());
  }

  /// Memeriksa apakah tempat sampah ini berada di Kelurahan tertentu
  bool matchesKelurahan(String? targetKelurahan) {
    if (targetKelurahan == null || targetKelurahan.trim().isEmpty || targetKelurahan == '-') {
      return true;
    }
    if (kelurahan.isEmpty) return true;
    return kelurahan.toLowerCase().contains(targetKelurahan.toLowerCase().trim()) ||
        targetKelurahan.toLowerCase().contains(kelurahan.toLowerCase().trim());
  }

  factory PemilahanBinPickup.fromJson(Map<String, dynamic> json) {
    // Ekstraksi data RW & Kelurahan yang tangguh (mendukung String flat atau nested Map dari Prisma)
    String extractedRw = '';
    String extractedKelurahan = '';

    if (json['rw'] is Map) {
      final rwMap = json['rw'] as Map<String, dynamic>;
      extractedRw = rwMap['name']?.toString() ?? rwMap['nama']?.toString() ?? '';
      if (rwMap['kelurahan'] is Map) {
        final kelMap = rwMap['kelurahan'] as Map<String, dynamic>;
        extractedKelurahan = kelMap['name']?.toString() ?? kelMap['nama']?.toString() ?? '';
      } else if (rwMap['kelurahan'] is String) {
        extractedKelurahan = rwMap['kelurahan'].toString();
      }
    } else if (json['rw'] != null && json['rw'].toString().trim().isNotEmpty) {
      extractedRw = json['rw'].toString().trim();
    }

    if (extractedRw.isEmpty) {
      extractedRw = json['lokasi']?.toString() ?? json['rtRw']?.toString() ?? '';
    }

    if (extractedKelurahan.isEmpty) {
      extractedKelurahan = json['kelurahan']?.toString() ?? '';
    }

    return PemilahanBinPickup(
      binId: json['binId']?.toString() ?? json['id']?.toString() ?? '',
      binCode:
          json['binCode']?.toString() ??
          json['qrCode']?.toString() ??
          '-',
      wargaName:
          json['wargaNama']?.toString() ??
          json['namaWarga']?.toString() ??
          json['wargaName']?.toString() ??
          json['user']?['name']?.toString() ??
          '-',
      address:
          json['alamat']?.toString() ??
          json['address']?.toString() ??
          json['user']?['address']?.toString() ??
          '-',
      kecamatan: json['kecamatan']?.toString() ?? '',
      kelurahan: extractedKelurahan,
      rw: extractedRw,
      volumePercentage:
          (json['volumePercent'] as num?)?.toDouble() ??
          (json['volumePercentage'] as num?)?.toDouble() ??
          0.0,
      isPickedUp:
          (json['isPickedUp'] as bool?) ??
          (json['status']?.toString().toUpperCase() == 'PICKED_UP'),
      lastPickedUpTime: DateTime.tryParse(
        json['lastPickedUpTime']?.toString() ?? '',
      ),
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      wasteCategory:
          json['wasteCategory']?.toString() ??
          json['category']?['name']?.toString() ??
          json['kategori']?.toString() ??
          json['type']?.toString() ??
          '-',
    );
  }

  @override
  List<Object?> get props => [binId, binCode, volumePercentage, isPickedUp];
}

/// Model Log Timbangan Fisik Pemilahan
class PemilahanSubmitLog extends Equatable {
  const PemilahanSubmitLog({
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

  factory PemilahanSubmitLog.fromJson(Map<String, dynamic> json) {
    return PemilahanSubmitLog(
      id: json['id']?.toString() ?? '',
      binId: json['binId']?.toString() ?? '',
      actualWeightKg: (json['actualWeightKg'] as num?)?.toDouble() ?? 0.0,
      classification: json['classification']?.toString() ?? 'Pemilahan Non-B3',
      photoUrl: json['photoUrl']?.toString() ?? '',
      submittedAt:
          (DateTime.tryParse(json['submittedAt']?.toString() ?? '') ??
                  DateTime.now())
              .toLocal(),
    );
  }

  @override
  List<Object?> get props => [id, binId, actualWeightKg, classification];
}
