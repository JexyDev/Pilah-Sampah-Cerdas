import 'package:equatable/equatable.dart';

/// Entitas data program dan hasil pemanfaatan/daur ulang sampah
class PemanfaatanProgramEntity extends Equatable {
  const PemanfaatanProgramEntity({
    required this.id,
    required this.namaProgram,
    required this.jenisProgram,
    required this.kategoriBahan,
    required this.jumlahBahanMasukKg,
    required this.jumlahHasilKg,
    this.unitHasil = 'Kg',
    this.lokasiFasilitas,
    this.penanggungJawab,
    this.targetPenerimaManfaat,
    this.nilaiEkonomiRp,
    required this.status,
    required this.tanggalPencatatan,
    this.fotoDokumentasiUrl,
    required this.rwId,
    this.rwName,
    this.kelurahanName,
  });

  final String id;
  final String namaProgram;
  final String jenisProgram;
  final String kategoriBahan;
  final double jumlahBahanMasukKg;
  final double jumlahHasilKg;
  final String unitHasil;
  final String? lokasiFasilitas;
  final String? penanggungJawab;
  final String? targetPenerimaManfaat;
  final int? nilaiEkonomiRp;
  final String status;
  final DateTime tanggalPencatatan;
  final String? fotoDokumentasiUrl;
  final int rwId;
  final String? rwName;
  final String? kelurahanName;

  factory PemanfaatanProgramEntity.fromJson(Map<String, dynamic> json) {
    // Normalisasi field yang kompatibel dengan model backend lama maupun baru
    final rwObj = json['rw'] as Map<String, dynamic>?;
    final kelObj = rwObj?['kelurahan'] as Map<String, dynamic>?;

    final bahanMasuk = (json['jumlahBahanMasukKg'] ?? json['volumeBahanBaku'] ?? 0);
    final hasilPanen = (json['jumlahHasilKg'] ?? json['hasil'] ?? 0);

    return PemanfaatanProgramEntity(
      id: json['id']?.toString() ?? '',
      namaProgram: json['namaProgram']?.toString() ?? json['program']?.toString() ?? 'Program Pengolahan',
      jenisProgram: json['jenisProgram']?.toString() ?? json['teknologi']?.toString() ?? 'Kompos',
      kategoriBahan: json['kategoriBahan']?.toString() ?? 'ORGANIK',
      jumlahBahanMasukKg: (bahanMasuk is num) ? bahanMasuk.toDouble() : double.tryParse(bahanMasuk.toString()) ?? 0.0,
      jumlahHasilKg: (hasilPanen is num) ? hasilPanen.toDouble() : double.tryParse(hasilPanen.toString()) ?? 0.0,
      unitHasil: json['unitHasil']?.toString() ?? json['unitBahanBaku']?.toString() ?? 'Kg',
      lokasiFasilitas: json['lokasiFasilitas']?.toString(),
      penanggungJawab: json['penanggungJawab']?.toString(),
      targetPenerimaManfaat: json['targetPenerimaManfaat']?.toString(),
      nilaiEkonomiRp: json['nilaiEkonomiRp'] != null ? (json['nilaiEkonomiRp'] as num).toInt() : null,
      status: json['status']?.toString() ?? 'DISTRIBUSI',
      tanggalPencatatan: json['tanggalPencatatan'] != null
          ? DateTime.tryParse(json['tanggalPencatatan'].toString()) ?? DateTime.now()
          : DateTime.now(),
      fotoDokumentasiUrl: json['fotoDokumentasiUrl']?.toString(),
      rwId: json['rwId'] is int ? json['rwId'] : int.tryParse(json['rwId']?.toString() ?? '0') ?? 0,
      rwName: rwObj?['name']?.toString() ?? (json['rwId'] != null ? 'RW ${json['rwId']}' : null),
      kelurahanName: kelObj?['name']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'namaProgram': namaProgram,
      'jenisProgram': jenisProgram,
      'kategoriBahan': kategoriBahan,
      'jumlahBahanMasukKg': jumlahBahanMasukKg,
      'jumlahHasilKg': jumlahHasilKg,
      'unitHasil': unitHasil,
      'lokasiFasilitas': lokasiFasilitas,
      'penanggungJawab': penanggungJawab,
      'targetPenerimaManfaat': targetPenerimaManfaat,
      'nilaiEkonomiRp': nilaiEkonomiRp,
      'status': status,
      'tanggalPencatatan': tanggalPencatatan.toIso8601String(),
      'fotoDokumentasiUrl': fotoDokumentasiUrl,
      'rwId': rwId,
    };
  }

  @override
  List<Object?> get props => [id, namaProgram, jenisProgram, jumlahHasilKg, status];
}

/// Entitas kritik, saran, dan evaluasi kepuasan pemanfaatan warga
class FeedbackPemanfaatanEntity extends Equatable {
  const FeedbackPemanfaatanEntity({
    required this.id,
    required this.userId,
    required this.wargaNama,
    required this.kategori,
    required this.judul,
    required this.isiKritikSaran,
    required this.rating,
    required this.status,
    this.tanggapan,
    this.ditanggapiOleh,
    this.ditanggapiPada,
    this.fotoBuktiUrl,
    this.rwId,
    this.rwName,
    this.kelurahanName,
    required this.createdAt,
  });

  final String id;
  final String userId;
  final String wargaNama;
  final String kategori;
  final String judul;
  final String isiKritikSaran;
  final int rating;
  final String status;
  final String? tanggapan;
  final String? ditanggapiOleh;
  final DateTime? ditanggapiPada;
  final String? fotoBuktiUrl;
  final int? rwId;
  final String? rwName;
  final String? kelurahanName;
  final DateTime createdAt;

  factory FeedbackPemanfaatanEntity.fromJson(Map<String, dynamic> json) {
    final rwObj = json['rw'] as Map<String, dynamic>?;
    final kelObj = rwObj?['kelurahan'] as Map<String, dynamic>?;
    final userObj = json['user'] as Map<String, dynamic>?;

    final ratingVal = json['rating'];

    return FeedbackPemanfaatanEntity(
      id: json['id']?.toString() ?? '',
      userId: json['userId']?.toString() ?? '',
      wargaNama: json['wargaNama']?.toString() ?? userObj?['name']?.toString() ?? 'Warga',
      kategori: json['kategori']?.toString() ?? 'Pengolahan Kompos',
      judul: json['judul']?.toString() ?? '',
      isiKritikSaran: json['isiKritikSaran']?.toString() ?? '',
      rating: ratingVal is int ? ratingVal : int.tryParse(ratingVal?.toString() ?? '5') ?? 5,
      status: json['status']?.toString() ?? 'MENUNGGU',
      tanggapan: json['tanggapan']?.toString(),
      ditanggapiOleh: json['ditanggapiOleh']?.toString(),
      ditanggapiPada: json['ditanggapiPada'] != null
          ? DateTime.tryParse(json['ditanggapiPada'].toString())
          : null,
      fotoBuktiUrl: json['fotoBuktiUrl']?.toString(),
      rwId: json['rwId'] is int ? json['rwId'] : int.tryParse(json['rwId']?.toString() ?? ''),
      rwName: rwObj?['name']?.toString() ?? (json['rwId'] != null ? 'RW ${json['rwId']}' : null),
      kelurahanName: kelObj?['name']?.toString(),
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'wargaNama': wargaNama,
      'kategori': kategori,
      'judul': judul,
      'isiKritikSaran': isiKritikSaran,
      'rating': rating,
      'status': status,
      'tanggapan': tanggapan,
      'ditanggapiOleh': ditanggapiOleh,
      'ditanggapiPada': ditanggapiPada?.toIso8601String(),
      'fotoBuktiUrl': fotoBuktiUrl,
      'rwId': rwId,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  @override
  List<Object?> get props => [id, userId, judul, status, rating, createdAt];
}
