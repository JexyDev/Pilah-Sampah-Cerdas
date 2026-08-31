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
    String extractedCategory = 'UNKNOWN';
    if (json['category'] is Map) {
      extractedCategory = json['category']['name']?.toString() ?? 'UNKNOWN';
    } else {
      extractedCategory = json['category']?.toString() ?? 
                          json['kategori']?.toString() ?? 
                          json['wasteCategory']?.toString() ?? 
                          json['wasteType']?.toString() ??
                          json['type']?.toString() ?? 
                          json['binType']?.toString() ?? 
                          json['kategoriAktual']?.toString() ?? 
                          json['kategori_aktual']?.toString() ?? 
                          json['hasilKlasifikasiAi']?.toString() ?? 
                          json['hasil_klasifikasi_ai']?.toString() ?? 
                          'UNKNOWN';
    }

    // Ubah hasilKlasifikasiAi "organik" / "anorganik" menjadi huruf kapital awal agar konsisten
    if (extractedCategory.toLowerCase() == 'organik') {
      extractedCategory = 'Organik';
    } else if (extractedCategory.toLowerCase() == 'anorganik' || extractedCategory.toLowerCase() == 'non_organic' || extractedCategory.toLowerCase() == 'non organik') {
      extractedCategory = 'Non Organik';
    }

    return WasteLogEntry(
      weightKg: (json['weightKg'] as num?)?.toDouble() ?? (json['berat'] as num?)?.toDouble() ?? 0.0,
      category: extractedCategory,
      aiConfidence: (json['aiConfidence'] as num?)?.toDouble() ?? (json['confidenceAi'] as num?)?.toDouble() ?? 0.0,
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
    this.binOrganikId,
    this.binAnorganikId,
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
  final String? binOrganikId;
  final String? binAnorganikId;
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
        json['didaftarkanOleh'],
        json['registeredByStudentName'],
        json['registeredByStudent'],
        json['user']?['pendampingName'],
        json['user']?['mahasiswaPendamping'],
        json['user']?['mahasiswaName'],
        json['user']?['didaftarkanOlehNama'],
        json['user']?['didaftarkanOleh'],
        if (json['user']?['pendamping'] is Map) json['user']['pendamping']['name'],
        if (json['user']?['mahasiswa'] is Map) json['user']['mahasiswa']['name'],
        if (json['user']?['student'] is Map) json['user']['student']['name'],
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

    String parsedKecamatan = json['kecamatan']?.toString() ?? '';
    String parsedKelurahan = json['kelurahan']?.toString() ?? '';
    String parsedRw = json['rw']?.toString() ?? json['rt_rw']?.toString() ?? json['rtRw']?.toString() ?? '';
    String rawAddr = json['address']?.toString() ?? json['alamat']?.toString() ?? 'Alamat tidak diketahui';

    // Fallback parsing from address string: "RW 01, Sadang Serang" or "Jl. A, RW 05, Kel. B"
    if (parsedRw.isEmpty && rawAddr.contains('RW')) {
      final rwMatch = RegExp(r'RW\s*(\d+)').firstMatch(rawAddr);
      if (rwMatch != null) parsedRw = rwMatch.group(1) ?? '';
    }
    if (parsedKelurahan.isEmpty) {
      if (rawAddr.toLowerCase().contains('sadang serang')) {
        parsedKelurahan = 'Sadang Serang';
      } else if (rawAddr.toLowerCase().contains('lebak gede')) {
        parsedKelurahan = 'Lebak Gede';
      } else if (rawAddr.toLowerCase().contains('sekeloa')) {
        parsedKelurahan = 'Sekeloa';
      } else if (rawAddr.toLowerCase().contains('coblong')) {
        parsedKelurahan = 'Coblong';
      }
    }

    String? extractBinOrganikId() {
      final candidates = [
        json['binOrganikId'],
        json['bin_organik_id'],
        json['organikBinId'],
        json['organik_bin_id'],
        json['binOrganikQr'],
        json['binOrganikQrCode'],
        json['organikQr'],
        json['organik_qr'],
        if (json['binOrganik'] is Map) json['binOrganik']['qrCode'] ?? json['binOrganik']['qrSerial'] ?? json['binOrganik']['id'],
        if (json['binOrganik'] is String) json['binOrganik'],
        if (json['organikBin'] is Map) json['organikBin']['qrCode'] ?? json['organikBin']['qrSerial'] ?? json['organikBin']['id'],
        if (json['organikBin'] is String) json['organikBin'],
        if (json['user'] is Map) ...[
          json['user']['binOrganikId'],
          json['user']['bin_organik_id'],
          if (json['user']['binOrganik'] is Map) json['user']['binOrganik']['qrCode'] ?? json['user']['binOrganik']['qrSerial'] ?? json['user']['binOrganik']['id'],
          if (json['user']['binOrganik'] is String) json['user']['binOrganik'],
        ],
      ];
      for (final c in candidates) {
        if (c != null && c.toString().trim().isNotEmpty && c.toString().toLowerCase() != 'null') {
          return c.toString().trim();
        }
      }
      final binsList = json['bins'] ?? json['user']?['bins'] ?? json['user']?['tempatSampah'];
      if (binsList is List) {
        for (final b in binsList) {
          if (b is Map) {
            final type = (b['binType'] ?? b['type'] ?? b['kategori'])?.toString().toUpperCase() ?? '';
            if (type.contains('ORGANIC') && !type.contains('NON') && !type.contains('AN')) {
              final qr = (b['qrSerial'] ?? b['qrCode'] ?? b['id'])?.toString();
              if (qr != null && qr.isNotEmpty) return qr;
            }
          }
        }
      }
      return null;
    }

    String? extractBinAnorganikId() {
      final candidates = [
        json['binAnorganikId'],
        json['bin_anorganik_id'],
        json['anorganikBinId'],
        json['anorganik_bin_id'],
        json['binAnorganicId'],
        json['bin_anorganic_id'],
        json['anorganicBinId'],
        json['binAnorganikQr'],
        json['binAnorganikQrCode'],
        json['anorganikQr'],
        json['anorganik_qr'],
        json['anorganicQr'],
        if (json['binAnorganik'] is Map) json['binAnorganik']['qrCode'] ?? json['binAnorganik']['qrSerial'] ?? json['binAnorganik']['id'],
        if (json['binAnorganik'] is String) json['binAnorganik'],
        if (json['anorganikBin'] is Map) json['anorganikBin']['qrCode'] ?? json['anorganikBin']['qrSerial'] ?? json['anorganikBin']['id'],
        if (json['anorganikBin'] is String) json['anorganikBin'],
        if (json['binAnorganic'] is Map) json['binAnorganic']['qrCode'] ?? json['binAnorganic']['qrSerial'] ?? json['binAnorganic']['id'],
        if (json['binNonOrganic'] is Map) json['binNonOrganic']['qrCode'] ?? json['binNonOrganic']['qrSerial'] ?? json['binNonOrganic']['id'],
        if (json['binNonOrganik'] is Map) json['binNonOrganik']['qrCode'] ?? json['binNonOrganik']['qrSerial'] ?? json['binNonOrganik']['id'],
        if (json['user'] is Map) ...[
          json['user']['binAnorganikId'],
          json['user']['bin_anorganik_id'],
          if (json['user']['binAnorganik'] is Map) json['user']['binAnorganik']['qrCode'] ?? json['user']['binAnorganik']['qrSerial'] ?? json['user']['binAnorganik']['id'],
          if (json['user']['binAnorganik'] is String) json['user']['binAnorganik'],
        ],
      ];
      for (final c in candidates) {
        if (c != null && c.toString().trim().isNotEmpty && c.toString().toLowerCase() != 'null') {
          return c.toString().trim();
        }
      }
      final binsList = json['bins'] ?? json['user']?['bins'] ?? json['user']?['tempatSampah'];
      if (binsList is List) {
        for (final b in binsList) {
          if (b is Map) {
            final type = (b['binType'] ?? b['type'] ?? b['kategori'])?.toString().toUpperCase() ?? '';
            if (type.contains('NON') || type.contains('ANORGANIK') || type.contains('ANORGANIC')) {
              final qr = (b['qrSerial'] ?? b['qrCode'] ?? b['id'])?.toString();
              if (qr != null && qr.isNotEmpty) return qr;
            }
          }
        }
      }
      return null;
    }

    String? parsedBinOrganikId = extractBinOrganikId();
    String? parsedBinAnorganikId = extractBinAnorganikId();

    // Fallback: If binId contains multiple IDs separated by comma/slash/space
    if ((parsedBinOrganikId == null || parsedBinAnorganikId == null) && extractedBinId.contains(RegExp(r'[,/|]'))) {
      final parts = extractedBinId.split(RegExp(r'[,/|]')).map((s) => s.trim()).where((s) => s.isNotEmpty).toList();
      if (parts.length >= 2) {
        parsedBinOrganikId ??= parts[0];
        parsedBinAnorganikId ??= parts[1];
      }
    }

    return WargaDampingan(
      wargaId: extractedWargaId,
      binId: extractedBinId,
      binOrganikId: parsedBinOrganikId,
      binAnorganikId: parsedBinAnorganikId,
      wargaName: json['wargaName']?.toString() ?? json['name']?.toString() ?? json['warga_name']?.toString() ?? 'Warga',
      address: rawAddr,
      kecamatan: parsedKecamatan,
      kelurahan: parsedKelurahan,
      rw: parsedRw,
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
      totalPoints: (json['totalPoints'] as num?)?.toInt() ?? 
                   (json['totalPoin'] as num?)?.toInt() ?? 
                   (json['poin'] as num?)?.toInt() ?? 
                   (json['user']?['totalPoints'] as num?)?.toInt() ??
                   (json['user']?['poin'] as num?)?.toInt() ?? 
                   0,
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
    this.programKerjaId,
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
  final String? programKerjaId;
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
      if (programKerjaId != null) 'programKerjaId': programKerjaId,
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
    this.statusPenugasanRw = '-',
  });

  final String userId;
  final String nim;
  final String name;
  final String jurusan;
  final String fakultas;
  final int individualPoints;
  final bool isLeader;
  final String statusPenugasanRw;

  factory KelompokMemberData.fromJson(Map<String, dynamic> json) {
    return KelompokMemberData(
      userId: json['userId']?.toString() ?? json['id']?.toString() ?? '',
      nim: json['nim']?.toString() ?? '',
      name: json['name']?.toString() ?? json['nama']?.toString() ?? 'Mahasiswa',
      jurusan: json['jurusan']?.toString() ?? json['prodi']?.toString() ?? '',
      fakultas: json['fakultas']?.toString() ?? '',
      individualPoints: (json['individualPoints'] as num?)?.toInt() ?? (json['points'] as num?)?.toInt() ?? 0,
      isLeader: json['isLeader'] as bool? ?? (json['role']?.toString().toUpperCase() == 'KETUA'),
      statusPenugasanRw: json['statusPenugasanRw']?.toString() ?? json['assignedRw']?.toString() ?? json['rw']?.toString() ?? '-',
    );
  }

  @override
  List<Object?> get props => [userId, nim, individualPoints, fakultas, isLeader, name, jurusan, statusPenugasanRw];

  KelompokMemberData copyWith({
    String? userId,
    String? nim,
    String? name,
    String? jurusan,
    String? fakultas,
    int? individualPoints,
    bool? isLeader,
    String? statusPenugasanRw,
  }) {
    return KelompokMemberData(
      userId: userId ?? this.userId,
      nim: nim ?? this.nim,
      name: name ?? this.name,
      jurusan: jurusan ?? this.jurusan,
      fakultas: fakultas ?? this.fakultas,
      individualPoints: individualPoints ?? this.individualPoints,
      isLeader: isLeader ?? this.isLeader,
      statusPenugasanRw: statusPenugasanRw ?? this.statusPenugasanRw,
    );
  }
}

class KelompokKknData extends Equatable {
  const KelompokKknData({
    required this.groupId,
    required this.groupName,
    required this.dosenPembimbing,
    this.dplNip = '-',
    this.dplPhone = '-',
    required this.poskoLocation,
    required this.totalGroupPoints,
    required this.members,
  });

  final String groupId;
  final String groupName;
  final String dosenPembimbing;
  final String dplNip;
  final String dplPhone;
  final String poskoLocation;
  final int totalGroupPoints;
  final List<KelompokMemberData> members;

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

    String dpl = '';
    
    // 1. Check if 'dpl' is an object containing the user's details
    if (json['dpl'] is Map) {
      dpl = json['dpl']['name']?.toString() ?? json['dpl']['nama']?.toString() ?? '';
    } 
    // 2. Fallback to direct string properties
    if (dpl.isEmpty) {
      dpl = (json['dpl'] is String ? json['dpl'] : null) ??
          json['dplNamaMentah']?.toString() ??
          json['dpl_nama_mentah']?.toString() ??
          json['dosenPembimbing']?.toString() ??
          json['dosen_pembimbing']?.toString() ??
          json['dplName']?.toString() ??
          json['dpl_name']?.toString() ??
          json['dpsName']?.toString() ??
          json['dosen']?.toString() ??
          '';
    }
    // 3. Check for 'dps' or 'dplObj' maps if still empty
    if (dpl.isEmpty && json['dps'] is Map) {
      dpl = json['dps']['name']?.toString() ?? json['dps']['nama']?.toString() ?? '';
    } else if (dpl.isEmpty && json['dplObj'] is Map) {
      dpl = json['dplObj']['name']?.toString() ?? json['dplObj']['nama']?.toString() ?? '';
    }

    if (dpl.isEmpty || dpl == 'null') dpl = '-';

    String nip = '-';
    String phone = '-';
    
    // Parse nip
    nip = json['dplNip']?.toString() ?? json['dpl']?['nip']?.toString() ?? json['dplObj']?['nip']?.toString() ?? '-';
    
    // Parse phone (fallback logic provided by backend spec)
    final rawPhone = json['dpl']?['phone'] ?? 
                     json['dpl']?['nomorWa'] ?? 
                     json['dplPhone'] ?? 
                     json['dplObj']?['phone'] ?? 
                     json['dplObj']?['nomorWa'];
    if (rawPhone != null && rawPhone.toString().trim().isNotEmpty) {
      phone = rawPhone.toString();
    }

    return KelompokKknData(
      groupId: json['groupId']?.toString() ?? json['id']?.toString() ?? '',
      groupName: json['groupName']?.toString() ?? json['namaKelompok']?.toString() ?? json['nama']?.toString() ?? '-',
      dosenPembimbing: dpl,
      dplNip: nip,
      dplPhone: phone,
      poskoLocation: json['poskoLocation']?.toString() ?? json['lokasiPosko']?.toString() ?? json['kelurahan']?.toString() ?? '-',
      totalGroupPoints: (json['totalGroupPoints'] as num?)?.toInt() ?? (json['totalPoints'] as num?)?.toInt() ?? 0,
      members: membersList,
    );
  }

  @override
  List<Object?> get props => [groupId, groupName, totalGroupPoints, members, dosenPembimbing, dplNip, dplPhone];
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

/// ─────────────────────────────────────────────────────────────────────────────
/// Model untuk response GET /api/v1/kkn/posko/me
/// ─────────────────────────────────────────────────────────────────────────────
class PoskoKknData extends Equatable {
  final String id;
  final String nama;
  final String jenis;
  final String alamat;
  final double latitude;
  final double longitude;
  final String statusApproval;
  final String? foto;
  final int? rwId;
  final String? rwName;
  final String? kelurahanName;

  const PoskoKknData({
    required this.id,
    required this.nama,
    required this.jenis,
    required this.alamat,
    required this.latitude,
    required this.longitude,
    required this.statusApproval,
    this.foto,
    this.rwId,
    this.rwName,
    this.kelurahanName,
  });

  factory PoskoKknData.fromJson(Map<String, dynamic> json) {
    final rw = json['rw'] as Map<String, dynamic>?;
    final kel = rw?['kelurahan'] as Map<String, dynamic>?;

    return PoskoKknData(
      id: json['id']?.toString() ?? '',
      nama: json['nama']?.toString() ?? '',
      jenis: json['jenis']?.toString() ?? '',
      alamat: json['alamat']?.toString() ?? '',
      latitude: double.tryParse(json['latitude']?.toString() ?? '0') ?? 0.0,
      longitude: double.tryParse(json['longitude']?.toString() ?? '0') ?? 0.0,
      statusApproval: json['statusApproval']?.toString() ?? 'PENDING',
      foto: json['foto']?.toString(),
      rwId: (rw?['id'] as num?)?.toInt(),
      rwName: rw?['name']?.toString(),
      kelurahanName: kel?['name']?.toString(),
    );
  }

  @override
  List<Object?> get props => [id, nama, statusApproval, latitude, longitude];
}

class PoskoKknResponse extends Equatable {
  final PoskoKknData? posko;
  final bool isUserLeader;
  final String kelompokId;

  const PoskoKknResponse({
    this.posko,
    required this.isUserLeader,
    required this.kelompokId,
  });

  factory PoskoKknResponse.fromJson(Map<String, dynamic> json) {
    return PoskoKknResponse(
      posko: json['posko'] != null ? PoskoKknData.fromJson(json['posko']) : null,
      isUserLeader: json['isUserLeader'] == true,
      kelompokId: json['kelompokId']?.toString() ?? '',
    );
  }

  @override
  List<Object?> get props => [posko, isUserLeader, kelompokId];
}

/// ─────────────────────────────────────────────────────────────────────────────
/// Model untuk response GET /api/v1/kkn/fasilitas/jenis
/// ─────────────────────────────────────────────────────────────────────────────
class JenisFasilitas extends Equatable {
  final int id;
  final String key;
  final String nama;
  final String? deskripsi;
  final String? iconUrl;
  final bool isActive;

  const JenisFasilitas({
    required this.id,
    required this.key,
    required this.nama,
    this.deskripsi,
    this.iconUrl,
    this.isActive = true,
  });

  factory JenisFasilitas.fromJson(Map<String, dynamic> json) {
    return JenisFasilitas(
      id: (json['id'] as num?)?.toInt() ?? 0,
      key: json['key']?.toString() ?? '',
      nama: json['nama']?.toString() ?? '',
      deskripsi: json['deskripsi']?.toString(),
      iconUrl: json['iconUrl']?.toString(),
      isActive: json['isActive'] == true,
    );
  }

  @override
  List<Object?> get props => [id, key, nama, iconUrl, isActive];
}
