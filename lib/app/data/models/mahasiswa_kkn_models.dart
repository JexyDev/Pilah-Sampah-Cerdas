import 'package:equatable/equatable.dart';

/// ─────────────────────────────────────────────────────────────────────────────
/// Model untuk response GET /api/kkn/dashboard
/// ─────────────────────────────────────────────────────────────────────────────
class KknDashboardData extends Equatable {
  const KknDashboardData({
    required this.nim,
    required this.jurusan,
    required this.totalRegisteredBins,
    required this.assignmentLimit,
    required this.remainingQuota,
    required this.progressPercentage,
    required this.contributionPoints,
  });

  final String nim;
  final String jurusan;
  final int totalRegisteredBins;
  final int assignmentLimit;
  final int remainingQuota;
  final double progressPercentage;
  final int contributionPoints;

  factory KknDashboardData.fromJson(Map<String, dynamic> json) {
    final student = json['studentKkn'] as Map<String, dynamic>? ?? {};
    return KknDashboardData(
      nim: student['nim']?.toString() ?? '',
      jurusan: student['jurusan']?.toString() ?? '',
      totalRegisteredBins: (json['totalRegisteredBins'] as num?)?.toInt() ?? 0,
      assignmentLimit: (json['assignmentLimit'] as num?)?.toInt() ?? 0,
      remainingQuota: (json['remainingQuota'] as num?)?.toInt() ?? 0,
      progressPercentage: (json['progressPercentage'] as num?)?.toDouble() ?? 0.0,
      contributionPoints: (json['contributionPoints'] as num?)?.toInt() ?? 0,
    );
  }

  @override
  List<Object?> get props => [nim, totalRegisteredBins, contributionPoints];
}

/// ─────────────────────────────────────────────────────────────────────────────
/// Model untuk satu entry log pemilahan sampah
/// ─────────────────────────────────────────────────────────────────────────────
class WasteLogEntry extends Equatable {
  const WasteLogEntry({
    required this.weightKg,
    required this.category,
    required this.aiConfidence,
    required this.discrepancyStatus,
    required this.createdAt,
  });

  final double weightKg;
  final String category;
  final double aiConfidence;
  final String discrepancyStatus;
  final DateTime createdAt;

  /// Apakah log ini merupakan pemilahan yang benar (tidak ada discrepancy)
  bool get isCorrect => discrepancyStatus.toUpperCase() == 'NONE';

  factory WasteLogEntry.fromJson(Map<String, dynamic> json) {
    return WasteLogEntry(
      weightKg: (json['weightKg'] as num?)?.toDouble() ?? 0.0,
      category: json['category']?.toString() ?? 'UNKNOWN',
      aiConfidence: (json['aiConfidence'] as num?)?.toDouble() ?? 0.0,
      discrepancyStatus: json['discrepancyStatus']?.toString() ?? 'NONE',
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
    );
  }

  @override
  List<Object?> get props => [weightKg, category, createdAt];
}

/// ─────────────────────────────────────────────────────────────────────────────
/// Model untuk satu warga dampingan dari GET /api/kkn/warga-dampingan
/// ─────────────────────────────────────────────────────────────────────────────
class WargaDampingan extends Equatable {
  const WargaDampingan({
    required this.binId,
    required this.wargaName,
    required this.address,
    required this.recentLogs,
  });

  final String binId;
  final String wargaName;
  final String address;
  final List<WasteLogEntry> recentLogs;

  /// Total aktivitas pemilahan
  int get totalActivities => recentLogs.length;

  /// Jumlah pemilahan yang benar
  int get correctCount => recentLogs.where((l) => l.isCorrect).length;

  /// Jumlah pemilahan yang salah
  int get incorrectCount => recentLogs.where((l) => !l.isCorrect).length;

  /// Persentase pemilahan benar (0–100)
  double get correctPercentage =>
      totalActivities > 0 ? (correctCount / totalActivities) * 100 : 0.0;

  /// Persentase kesalahan (0–100)
  double get errorPercentage =>
      totalActivities > 0 ? (incorrectCount / totalActivities) * 100 : 0.0;

  /// Apakah warga membutuhkan edukasi ulang (threshold > 30% kesalahan)
  bool get needsReeducation => errorPercentage > 30;

  factory WargaDampingan.fromJson(Map<String, dynamic> json) {
    final logs = (json['recentLogs'] as List<dynamic>?)
            ?.map((e) => WasteLogEntry.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];

    return WargaDampingan(
      binId: json['binId']?.toString() ?? '',
      wargaName: json['wargaName']?.toString() ?? '',
      address: json['address']?.toString() ?? '',
      recentLogs: logs,
    );
  }

  @override
  List<Object?> get props => [binId, wargaName];
}

/// ─────────────────────────────────────────────────────────────────────────────
/// Request body untuk POST /api/v1/auth/register/warga
/// ─────────────────────────────────────────────────────────────────────────────
class RegisterWargaRequest {
  const RegisterWargaRequest({
    required this.phone,
    required this.password,
    this.name,
    this.qrCode,
    this.rtRwId,
    this.rtRw,
    this.kelurahan,
    this.latitude,
    this.longitude,
  });

  /// Required: Nomor HP / WhatsApp
  final String phone;

  /// Required: Password akun warga
  final String password;

  /// Opsional: Nama lengkap warga
  final String? name;

  /// Opsional: QR Code tong sampah
  final String? qrCode;

  /// Opsional: ID RT/RW
  final String? rtRwId;

  /// Opsional: String RT/RW (fallback jika rtRwId tidak digunakan)
  final String? rtRw;

  /// Opsional: Kelurahan
  final String? kelurahan;

  /// Opsional: Latitude lokasi pendaftaran
  final double? latitude;

  /// Opsional: Longitude lokasi pendaftaran
  final double? longitude;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{
      'phone': phone,
      'password': password,
    };
    if (name != null && name!.isNotEmpty) map['name'] = name;
    if (qrCode != null && qrCode!.isNotEmpty) map['qrCode'] = qrCode;
    if (rtRwId != null && rtRwId!.isNotEmpty) map['rtRwId'] = rtRwId;
    if (rtRw != null && rtRw!.isNotEmpty) map['rtRw'] = rtRw;
    if (kelurahan != null && kelurahan!.isNotEmpty) map['kelurahan'] = kelurahan;
    if (latitude != null) map['latitude'] = latitude;
    if (longitude != null) map['longitude'] = longitude;
    return map;
  }
}
