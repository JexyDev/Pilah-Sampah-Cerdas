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
    final user = json['user'] as Map<String, dynamic>? ?? {};
    final mhs = json['mahasiswa'] as Map<String, dynamic>? ?? {};
    
    return KknDashboardData(
      nim: student['nim']?.toString() ?? mhs['nim']?.toString() ?? user['nim']?.toString() ?? json['nim']?.toString() ?? '',
      jurusan: student['jurusan']?.toString() ?? mhs['jurusan']?.toString() ?? user['jurusan']?.toString() ?? json['jurusan']?.toString() ?? '',
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
    this.kelurahan = '',
    this.rtRw = '',
    required this.recentLogs,
    this.isActivated = true,
    this.role = 'WARGA',
    this.totalPoints = 0,
    this.apiCorrectPercentage,
  });

  final String binId;
  final String wargaName;
  final String address;
  final String kelurahan;
  final String rtRw;
  final bool isActivated;
  final String role;
  final List<WasteLogEntry> recentLogs;
  final int totalPoints;
  final double? apiCorrectPercentage;

  /// Total aktivitas pemilahan
  int get totalActivities => recentLogs.length;

  /// Jumlah pemilahan yang benar
  int get correctCount => recentLogs.where((l) => l.isCorrect).length;

  /// Jumlah pemilahan yang salah
  int get incorrectCount => recentLogs.where((l) => !l.isCorrect).length;

  /// Persentase pemilahan benar (0–100)
  double get correctPercentage =>
      apiCorrectPercentage ?? (totalActivities > 0 ? (correctCount / totalActivities) * 100 : 0.0);

  /// Persentase kesalahan (0–100)
  double get errorPercentage =>
      totalActivities > 0 ? (incorrectCount / totalActivities) * 100 : 0.0;

  /// Apakah warga membutuhkan edukasi ulang (threshold > 30% kesalahan)
  bool get needsReeducation => errorPercentage > 30;

  /// Tanggal terakhir warga aktif membuang sampah
  DateTime? get lastActiveDate {
    if (recentLogs.isEmpty) return null;
    // Log biasanya sudah diurutkan dari backend (terbaru di atas)
    return recentLogs.first.createdAt;
  }

  factory WargaDampingan.fromJson(Map<String, dynamic> json) {
    final logs = (json['recentLogs'] as List<dynamic>?)
            ?.map((e) => WasteLogEntry.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];

    final String extractedBinId = json['binId']?.toString() ??
        json['id']?.toString() ??
        json['wargaId']?.toString() ??
        json['userId']?.toString() ??
        '';

    return WargaDampingan(
      binId: extractedBinId,
      wargaName: json['wargaName']?.toString() ?? json['name']?.toString() ?? json['warga_name']?.toString() ?? 'Warga',
      address: json['address']?.toString() ?? json['alamat']?.toString() ?? '',
      kelurahan: json['kelurahan']?.toString() ?? '',
      rtRw: json['rtRw']?.toString() ?? json['rt_rw']?.toString() ?? '',
      recentLogs: logs,
      isActivated: json['isActivated'] as bool? ?? (json['status']?.toString().toUpperCase() != 'UNACTIVATED'),
      role: json['role']?.toString().toUpperCase() ?? json['user']?['role']?.toString().toUpperCase() ?? 'WARGA',
      totalPoints: (json['totalPoints'] as num?)?.toInt() ?? 
                   (logs.fold(0, (sum, log) => sum + (log.weightKg * 10).toInt())),
      apiCorrectPercentage: (json['complianceScore'] as num?)?.toDouble() ?? (json['correctPercentage'] as num?)?.toDouble(),
    );
  }

  @override
  List<Object?> get props => [binId, wargaName, totalPoints];
}

/// ─────────────────────────────────────────────────────────────────────────────
/// Request body untuk POST /api/v1/auth/register/warga
/// ─────────────────────────────────────────────────────────────────────────────
class RegisterWargaRequest {
  const RegisterWargaRequest({
    required this.phone,
    required this.password,
    this.name,
    this.address,
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

  /// Opsional: Alamat warga
  final String? address;

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
    if (address != null && address!.isNotEmpty) map['address'] = address;
    if (qrCode != null && qrCode!.isNotEmpty) map['qrCode'] = qrCode;
    if (rtRwId != null && rtRwId!.isNotEmpty) map['rtRwId'] = rtRwId;
    if (rtRw != null && rtRw!.isNotEmpty) map['rtRw'] = rtRw;
    if (kelurahan != null && kelurahan!.isNotEmpty) map['kelurahan'] = kelurahan;
    if (latitude != null) map['latitude'] = latitude;
    if (longitude != null) map['longitude'] = longitude;
    return map;
  }
}

/// ─────────────────────────────────────────────────────────────────────────────
/// Model Registrasi & Profil Mahasiswa (A.10) + Kode Unik (A.9)
/// ─────────────────────────────────────────────────────────────────────────────
class MahasiswaEntity extends Equatable {
  const MahasiswaEntity({
    required this.nim,
    required this.nama,
    required this.fakultas,
    required this.prodi,
    required this.jenjang,
    required this.penugasanKelurahan,
    required this.penugasanRw,
    required this.penugasanRt,
    required this.dplId,
    required this.kelompokId,
  });

  final String nim;
  final String nama;
  final String fakultas;
  final String prodi;
  final String jenjang; // "D3" | "S1" | "S2"
  final String penugasanKelurahan;
  final String penugasanRw;
  final String penugasanRt;
  final String dplId;
  final String kelompokId;

  /// Kode Unik Mahasiswa: MHS-[NIM]-[KODE_KELOMPOK] (A.9)
  String get uniqueCode => 'MHS-$nim-$kelompokId';

  @override
  List<Object?> get props => [nim, kelompokId];
}

/// ─────────────────────────────────────────────────────────────────────────────
/// Model Profil DPL (NIP sebagai username) (A.10) + Kode Unik (A.9)
/// ─────────────────────────────────────────────────────────────────────────────
class DplEntity extends Equatable {
  const DplEntity({
    required this.nip,
    required this.nama,
    required this.fakultas,
    required this.prodi,
    required this.kelompokBimbinganIds,
  });

  final String nip;
  final String nama;
  final String fakultas;
  final String prodi;
  final List<String> kelompokBimbinganIds;

  /// Kode Unik DPL: DPL-[NIP]-[KODE_KELOMPOK] (A.9)
  String get uniqueCode => 'DPL-$nip-${kelompokBimbinganIds.isNotEmpty ? kelompokBimbinganIds.first : "K01"}';

  @override
  List<Object?> get props => [nip];
}

