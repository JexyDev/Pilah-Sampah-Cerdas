import 'package:equatable/equatable.dart';

/// ─────────────────────────────────────────────────────────────────────────────
/// Model untuk response GET /api/kkn/dashboard
/// ─────────────────────────────────────────────────────────────────────────────
class KknDashboardData extends Equatable {
  static const empty = KknDashboardData(
    nim: '',
    jurusan: '',
    totalRegisteredBins: 0,
    assignmentLimit: 0,
    remainingQuota: 0,
    progressPercentage: 0.0,
    contributionPoints: 0,
  );

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
    required this.wargaId,
    required this.binId,
    required this.wargaName,
    required this.address,
    this.kecamatan = '',
    this.kelurahan = '',
    this.rw = '',
    this.mahasiswaId = '',
    this.pendampingName = '',
    this.status = '',
    required this.recentLogs,
    this.isActivated = true,
    this.role = 'WARGA',
    this.totalPoints = 0,
    this.apiCorrectPercentage,
  });

  final String wargaId;
  final String binId;
  final String wargaName;
  final String address;
  final String kecamatan;
  final String kelurahan;
  final String rw;
  final String mahasiswaId;
  final String pendampingName;
  final String status;
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

  /// Apakah warga membutuhkan edukasi ulang (threshold < 80% pemilahan benar)
  bool get needsReeducation => totalActivities > 0 && correctPercentage < 80;

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

    String extractedBinId = json['binId']?.toString() ?? '';
    if (extractedBinId.isEmpty && json['bin'] != null && json['bin']['qrCode'] != null) {
      extractedBinId = json['bin']['qrCode'].toString();
    }
    if (extractedBinId.isEmpty) {
      extractedBinId = 'Belum Ada Tempat Sampah';
    }

    String extractMhsId() {
      final candidates = [
        json['mahasiswaId'],
        json['registeredByStudentId'],
        json['studentId'],
        json['activatedBy'],
        json['didaftarkanOleh'],
        json['studentKknId'],
      ];
      for (final c in candidates) {
        if (c != null) {
          final str = c.toString().trim();
          if (str.isNotEmpty && str.toLowerCase() != 'null' && str.toLowerCase() != 'undefined' && str != '0') {
            return str;
          }
        }
      }
      return '';
    }

    String extractPendampingName() {
      final candidates = [
        json['pendampingName'],
        json['pendamping'],
        json['mahasiswaName'],
        json['studentName'],
        json['didaftarkanOlehNama'],
        json['registeredByStudentName'],
      ];
      for (final c in candidates) {
        if (c != null) {
          final str = c.toString().trim();
          if (str.isNotEmpty && str.toLowerCase() != 'null' && str.toLowerCase() != 'undefined') {
            return str;
          }
        }
      }
      return '';
    }

    final rawStatus = json['status']?.toString() ?? json['statusPendamping']?.toString() ?? json['status_pendamping']?.toString() ?? '';
    final extractedWargaId = json['wargaId']?.toString() ?? json['id']?.toString() ?? '';

    return WargaDampingan(
      wargaId: extractedWargaId,
      binId: extractedBinId,
      wargaName: json['wargaName']?.toString() ?? json['name']?.toString() ?? json['warga_name']?.toString() ?? 'Warga',
      address: json['address']?.toString() ?? json['alamat']?.toString() ?? 'Alamat tidak diketahui',
      kecamatan: json['kecamatan']?.toString() ?? '',
      kelurahan: json['kelurahan']?.toString() ?? '',
      rw: json['rw']?.toString() ?? json['rt_rw']?.toString() ?? json['rtRw']?.toString() ?? '',
      mahasiswaId: extractMhsId(),
      pendampingName: extractPendampingName(),
      status: rawStatus.isEmpty ? 'Aktif' : rawStatus,
      recentLogs: logs,
      isActivated: (json['isActivated'] == true) ||
          (json['is_activated'] == true) ||
          (json['status']?.toString().toUpperCase() == 'ACTIVATED') ||
          (json['status'] == 'ACTIVE_BOUND') ||
          (json['binOrganikId'] != null && json['binOrganikId'].toString().trim().isNotEmpty),
      role: json['role']?.toString().toUpperCase() ?? json['user']?['role']?.toString().toUpperCase() ?? 'WARGA',
      totalPoints: (json['totalPoints'] as num?)?.toInt() ?? 0,
      apiCorrectPercentage: (json['complianceScore'] as num?)?.toDouble() ?? (json['correctPercentage'] as num?)?.toDouble(),
    );
  }

  @override
  List<Object?> get props => [wargaId, binId, wargaName, totalPoints, mahasiswaId, pendampingName, status];
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
    this.rwId,
    this.rw,
    this.kecamatan,
    this.kelurahan,
    this.latitude,
    this.longitude,
    this.familySize,
  });

  /// Required: Nomor HP / WhatsApp
  final String phone;

  /// Required: Password akun warga
  final String password;

  /// Opsional: Nama lengkap warga
  final String? name;

  /// Opsional: Alamat warga
  final String? address;

  /// Opsional: QR Code tempat sampah
  final String? qrCode;

  /// Opsional: ID RT/RW
  final String? rwId;

  /// Opsional: String RW (fallback jika rwId tidak digunakan)
  final String? rw;

  /// Opsional: Kelurahan
  final String? kecamatan;
  final String? kelurahan;

  /// Opsional: Latitude lokasi pendaftaran
  final double? latitude;

  /// Opsional: Longitude lokasi pendaftaran
  final double? longitude;

  /// Opsional: Jumlah Anggota Keluarga dalam 1 Rumah
  final int? familySize;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{
      'phone': phone,
      'password': password,
    };
    if (name != null && name!.isNotEmpty) map['name'] = name;
    if (address != null && address!.isNotEmpty) map['address'] = address;
    if (qrCode != null && qrCode!.isNotEmpty) map['qrCode'] = qrCode;
    if (rwId != null && rwId!.isNotEmpty) map['rwId'] = rwId;
    if (rw != null && rw!.isNotEmpty) map['rw'] = rw;
    if (kecamatan != null && kecamatan!.isNotEmpty) map['kecamatan'] = kecamatan;
    if (kelurahan != null && kelurahan!.isNotEmpty) map['kelurahan'] = kelurahan;
    if (latitude != null) map['latitude'] = latitude;
    if (longitude != null) map['longitude'] = longitude;
    if (familySize != null) map['familySize'] = familySize;
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

/// ─────────────────────────────────────────────────────────────────────────────
/// Request body untuk POST /api/v1/kkn/pemanfaatan-sampah
/// ─────────────────────────────────────────────────────────────────────────────
class PemanfaatanSampahRequest {
  const PemanfaatanSampahRequest({
    required this.jenisPemanfaatan,
    required this.kategoriSampah,
    required this.jumlah,
    required this.satuan,
    required this.wilayahDampingan,
    required this.deskripsi,
    this.rwTerkait,
    this.dplId,
    this.fotoPath,
    this.timestamp,
  });

  final String jenisPemanfaatan;
  final String kategoriSampah;
  final double jumlah;
  final String satuan;
  final String wilayahDampingan;
  final String deskripsi;
  final String? rwTerkait;
  final String? dplId;
  final String? fotoPath;
  final String? timestamp;

  Map<String, dynamic> toJson() {
    return {
      'jenisPemanfaatan': jenisPemanfaatan,
      'kategoriSampah': kategoriSampah,
      'jumlah': jumlah,
      'satuan': satuan,
      'wilayahDampingan': wilayahDampingan,
      'deskripsi': deskripsi,
      if (rwTerkait != null) 'rwTerkait': rwTerkait,
      if (dplId != null) 'dplId': dplId,
      if (fotoPath != null) 'fotoPath': fotoPath,
      'timestamp': timestamp ?? DateTime.now().toUtc().toIso8601String(),
    };
  }
}

/// ─────────────────────────────────────────────────────────────────────────────
/// Model untuk Data Kelompok KKN Mahasiswa (GET /api/v1/kkn/kelompok/me)
/// ─────────────────────────────────────────────────────────────────────────────
class KelompokMemberData extends Equatable {
  const KelompokMemberData({
    required this.userId,
    required this.nim,
    required this.name,
    required this.jurusan,
    this.fakultas = '',
    required this.individualPoints,
    this.isLeader = false,
  });

  final String userId;
  final String nim;
  final String name;
  final String jurusan;
  final String fakultas;
  final int individualPoints;
  final bool isLeader;

  factory KelompokMemberData.fromJson(Map<String, dynamic> json) {
    return KelompokMemberData(
      userId: json['userId']?.toString() ?? json['id']?.toString() ?? '',
      nim: json['nim']?.toString() ?? '',
      name: json['name']?.toString() ?? json['nama']?.toString() ?? 'Mahasiswa',
      jurusan: json['jurusan']?.toString() ?? json['prodi']?.toString() ?? '',
      fakultas: json['fakultas']?.toString() ?? '',
      individualPoints: (json['individualPoints'] as num?)?.toInt() ?? (json['points'] as num?)?.toInt() ?? 0,
      isLeader: json['isLeader'] as bool? ?? (json['role']?.toString().toUpperCase() == 'KETUA'),
    );
  }

  @override
  List<Object?> get props => [userId, nim, individualPoints, fakultas, isLeader, name, jurusan];

  KelompokMemberData copyWith({
    String? userId,
    String? nim,
    String? name,
    String? jurusan,
    String? fakultas,
    int? individualPoints,
    bool? isLeader,
  }) {
    return KelompokMemberData(
      userId: userId ?? this.userId,
      nim: nim ?? this.nim,
      name: name ?? this.name,
      jurusan: jurusan ?? this.jurusan,
      fakultas: fakultas ?? this.fakultas,
      individualPoints: individualPoints ?? this.individualPoints,
      isLeader: isLeader ?? this.isLeader,
    );
  }
}

class KelompokKknData extends Equatable {
  const KelompokKknData({
    required this.groupId,
    required this.groupName,
    required this.dosenPembimbing,
    required this.poskoLocation,
    required this.totalGroupPoints,
    required this.members,
    this.poskoAlamat = '-',
    this.poskoFoto,
    this.poskoStatus = 'UNREGISTERED',
    this.poskoFacilityId,
    this.isUserLeader = false,
    this.latitude = -6.8906,
    this.longitude = 107.6123,
    this.radiusMeter = 100,
  });

  final String groupId;
  final String groupName;
  final String dosenPembimbing;
  final String poskoLocation;
  final int totalGroupPoints;
  final List<KelompokMemberData> members;
  final String poskoAlamat;
  final String? poskoFoto;
  final String poskoStatus;
  final String? poskoFacilityId;
  final bool isUserLeader;
  final double latitude;
  final double longitude;
  final int radiusMeter;

  /// Penjumlahan Poin Kelompok (Fallback Client-Side Sum)
  int get calculatedTotalPoints {
    if (totalGroupPoints > 0) return totalGroupPoints;
    return members.fold(0, (sum, m) => sum + m.individualPoints);
  }

  factory KelompokKknData.fromJson(Map<String, dynamic> json) {
    final membersList = (json['members'] as List<dynamic>? ?? json['anggota'] as List<dynamic>?)
            ?.map((e) => KelompokMemberData.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];

    String dpl = json['dosenPembimbing']?.toString() ??
        json['dplName']?.toString() ??
        json['dpsName']?.toString() ??
        json['dpl']?.toString() ??
        json['dosen']?.toString() ??
        '';

    if (dpl.isEmpty && json['dps'] is Map) {
      dpl = json['dps']['name']?.toString() ?? json['dps']['nama']?.toString() ?? '';
    } else if (dpl.isEmpty && json['dplObj'] is Map) {
      dpl = json['dplObj']['name']?.toString() ?? json['dplObj']['nama']?.toString() ?? '';
    }

    if (dpl.isEmpty) dpl = '-';

    return KelompokKknData(
      groupId: json['groupId']?.toString() ?? json['id']?.toString() ?? '',
      groupName: json['groupName']?.toString() ?? json['namaKelompok']?.toString() ?? json['nama']?.toString() ?? '-',
      dosenPembimbing: dpl,
      poskoLocation: json['poskoLocation']?.toString() ?? json['lokasiPosko']?.toString() ?? json['kelurahan']?.toString() ?? '-',
      totalGroupPoints: (json['totalGroupPoints'] as num?)?.toInt() ?? (json['totalPoints'] as num?)?.toInt() ?? 0,
      members: membersList,
      poskoAlamat: json['poskoAlamat']?.toString() ?? '-',
      poskoFoto: json['poskoFoto']?.toString(),
      poskoStatus: json['poskoStatus']?.toString() ?? 'UNREGISTERED',
      poskoFacilityId: json['poskoFacilityId']?.toString(),
      isUserLeader: json['isUserLeader'] == true,
      latitude: (json['latitude'] as num?)?.toDouble() ?? (json['poskoLatitude'] as num?)?.toDouble() ?? -6.8906,
      longitude: (json['longitude'] as num?)?.toDouble() ?? (json['poskoLongitude'] as num?)?.toDouble() ?? 107.6123,
      radiusMeter: (json['radiusMeter'] as num?)?.toInt() ?? 100,
    );
  }

  @override
  List<Object?> get props => [groupId, groupName, totalGroupPoints, members, poskoStatus, isUserLeader, poskoFacilityId];
}

class RegisterPoskoRequest {
  final String? nama;
  final String alamat;
  final int? rwId;
  final double latitude;
  final double longitude;
  final String? fotoPath;
  final String? fotoUrl;

  const RegisterPoskoRequest({
    this.nama,
    required this.alamat,
    this.rwId,
    required this.latitude,
    required this.longitude,
    this.fotoPath,
    this.fotoUrl,
  });

  Map<String, dynamic> toJson() => {
        if (nama != null && nama!.isNotEmpty) 'nama': nama,
        'alamat': alamat,
        if (rwId != null) 'rwId': rwId,
        'latitude': latitude,
        'longitude': longitude,
        if (fotoUrl != null && fotoUrl!.isNotEmpty) 'foto': fotoUrl,
      };
}

class BantuFasilitasRequest {
  final String nama;
  final String jenis;
  final String? picUserId;
  final int rwId;
  final double latitude;
  final double longitude;
  final String? fotoUrl;

  const BantuFasilitasRequest({
    required this.nama,
    required this.jenis,
    this.picUserId,
    required this.rwId,
    required this.latitude,
    required this.longitude,
    this.fotoUrl,
  });

  Map<String, dynamic> toJson() => {
        'nama': nama,
        'jenis': jenis,
        'userId': picUserId ?? 'warga-kkn',
        'rwId': rwId,
        'latitude': latitude,
        'longitude': longitude,
        if (fotoUrl != null) 'foto': fotoUrl,
      };
}

/// ─────────────────────────────────────────────────────────────────────────────
/// Model untuk GET /api/v1/kkn/dampak-kelurahan
/// ─────────────────────────────────────────────────────────────────────────────
class DampakKelurahanData extends Equatable {
  const DampakKelurahanData({
    required this.kelurahanName,
    required this.activeHouseholdsPercentage,
    required this.totalWasteVolumeKg,
    required this.organicVolumeKg,
    required this.nonOrganicVolumeKg,
    required this.totalHouseholdsRegistered,
    required this.totalActiveBins,
  });

  final String kelurahanName;
  final double activeHouseholdsPercentage;
  final double totalWasteVolumeKg;
  final double organicVolumeKg;
  final double nonOrganicVolumeKg;
  final int totalHouseholdsRegistered;
  final int totalActiveBins;

  factory DampakKelurahanData.fromJson(Map<String, dynamic> json) {
    return DampakKelurahanData(
      kelurahanName: json['kelurahanName']?.toString() ?? json['kelurahan']?.toString() ?? json['rw']?.toString() ?? '-',
      activeHouseholdsPercentage: (json['activeHouseholdsPercentage'] as num?)?.toDouble() ??
          (json['persentaseAktif'] as num?)?.toDouble() ??
          (json['activeSortingPercentage'] as num?)?.toDouble() ??
          0.0,
      totalWasteVolumeKg: (json['totalWasteVolumeKg'] as num?)?.toDouble() ??
          (json['totalVolumeKg'] as num?)?.toDouble() ??
          (json['totalVolume'] as num?)?.toDouble() ??
          0.0,
      organicVolumeKg: (json['organicVolumeKg'] as num?)?.toDouble() ??
          (json['organicVolume'] as num?)?.toDouble() ??
          0.0,
      nonOrganicVolumeKg: (json['nonOrganicVolumeKg'] as num?)?.toDouble() ??
          (json['nonOrganicVolume'] as num?)?.toDouble() ??
          0.0,
      totalHouseholdsRegistered: (json['totalHouseholdsRegistered'] as num?)?.toInt() ??
          (json['totalWarga'] as num?)?.toInt() ??
          0,
      totalActiveBins: (json['totalActiveBins'] as num?)?.toInt() ??
          (json['totalBin'] as num?)?.toInt() ??
          0,
    );
  }

  @override
  List<Object?> get props => [
        kelurahanName,
        activeHouseholdsPercentage,
        totalWasteVolumeKg,
        organicVolumeKg,
        nonOrganicVolumeKg,
        totalHouseholdsRegistered,
        totalActiveBins,
      ];
}
