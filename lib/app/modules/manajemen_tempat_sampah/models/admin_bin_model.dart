/// Model data tempat sampah untuk halaman Manajemen Tempat Sampah (admin view).
/// Dipetakan dari response `GET /bins` (BinController.getAllBins di backend).
class AdminBinModel {
  const AdminBinModel({
    required this.id,
    required this.qrCode,
    required this.kode,
    this.wargaName,
    this.wargaPhone,
    this.rw,
    this.kelurahan,
    this.lokasi,
    required this.kapasitas,
    required this.maxCapacityLiter,
    required this.currentVolumeLiter,
    required this.status,
    required this.realStatus,
    this.verifiedAt,
    this.gpsFormatted,
    this.lastActivityLog,
    this.isBound = false,
    this.needsInspection = false,
    this.categoryId,
    this.rwId,
  });

  factory AdminBinModel.fromJson(Map<String, dynamic> json) {
    final user = json['user'] as Map<String, dynamic>?;
    return AdminBinModel(
      id: json['id']?.toString() ?? '',
      qrCode: json['qrCode']?.toString() ?? '',
      kode: json['kode']?.toString() ?? json['qrCode']?.toString() ?? '',
      wargaName: user?['name']?.toString() ?? json['wargaName']?.toString(),
      wargaPhone: user?['phone']?.toString() ?? json['wargaPhone']?.toString(),
      rw: json['rw']?.toString(),
      kelurahan: json['kelurahan']?.toString(),
      lokasi: json['lokasi']?.toString() ?? json['address']?.toString(),
      kapasitas: (json['kapasitas'] as num?)?.toInt() ?? 0,
      maxCapacityLiter: (json['maxCapacityLiter'] as num?)?.toDouble() ?? 25.0,
      currentVolumeLiter:
          (json['currentVolumeLiter'] as num?)?.toDouble() ?? 0.0,
      status: json['status']?.toString() ?? '',
      realStatus: json['realStatus']?.toString() ?? '',
      verifiedAt: json['verifiedAt']?.toString(),
      gpsFormatted: json['gpsFormatted']?.toString(),
      lastActivityLog: json['lastActivityLog']?.toString(),
      isBound: json['isBound'] as bool? ?? false,
      needsInspection: json['needsInspection'] as bool? ?? false,
      categoryId: json['categoryId']?.toString(),
      rwId: json['rwId']?.toString(),
    );
  }

  final String id;
  final String qrCode;
  final String kode;
  final String? wargaName;
  final String? wargaPhone;
  final String? rw;
  final String? kelurahan;
  final String? lokasi;
  final int kapasitas;
  final double maxCapacityLiter;
  final double currentVolumeLiter;
  final String status;
  final String realStatus;
  final String? verifiedAt;
  final String? gpsFormatted;
  final String? lastActivityLog;
  final bool isBound;
  final bool needsInspection;
  final String? categoryId;
  final String? rwId;

  /// Apakah QR sudah tercetak dan aktif (terikat ke warga).
  bool get isActiveAndBound =>
      isBound &&
      (realStatus == 'ACTIVE_BOUND' || realStatus == 'ACTIVE');

  /// Apakah kapasitas kritis (>80%).
  bool get isCritical => kapasitas > 80;

  /// Apakah kapasitas sedang (>50%).
  bool get isWarning => kapasitas > 50 && kapasitas <= 80;
}
