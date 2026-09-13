import 'package:equatable/equatable.dart';

/// Model anggota individu mahasiswa KKN
class MahasiswaAnggotaEntity extends Equatable {
  const MahasiswaAnggotaEntity({
    required this.id,
    required this.nim,
    required this.nama,
    required this.kelompokId,
    required this.poinIndividu,
  });

  final String id;
  final String nim;
  final String nama;
  final String kelompokId;
  final int poinIndividu;

  @override
  List<Object?> get props => [id, nim, poinIndividu];
}

/// Model Leaderboard Sistem 2: Kelompok Mahasiswa KKN (A.12)
class KelompokMahasiswaLeaderboardEntity extends Equatable {
  const KelompokMahasiswaLeaderboardEntity({
    required this.kelompokId,
    required this.namaKelompok,
    required this.namaDpl,
    required this.anggota,
    this.poinProker = 0,
    this.totalPoinBackend,
  });

  final String kelompokId;
  final String namaKelompok;
  final String namaDpl;
  final List<MahasiswaAnggotaEntity> anggota;
  final int poinProker;
  final double? totalPoinBackend;

  /// Rata-rata Poin Anggota Kelompok
  double get rataRataPoinAnggota {
    if (anggota.isEmpty) return 0.0;
    final totalIndividu =
        anggota.fold<int>(0, (sum, item) => sum + item.poinIndividu);
    return totalIndividu / anggota.length;
  }

  /// Formula Resmi Backend: (Poin Proker * 0.6) + (Rata-rata Poin Anggota * 0.4)
  double get totalPoinKelompok {
    if (totalPoinBackend != null) return totalPoinBackend!;
    final score = (poinProker * 0.6) + (rataRataPoinAnggota * 0.4);
    return double.parse(score.toStringAsFixed(1));
  }

  @override
  List<Object?> get props => [
    kelompokId,
    totalPoinKelompok,
    anggota,
    poinProker,
    totalPoinBackend,
  ];
}

/// Helper function untuk kalkulasi dan pemeringkatan Leaderboard Kelompok
List<KelompokMahasiswaLeaderboardEntity> sortGroupLeaderboard(
  List<KelompokMahasiswaLeaderboardEntity> groups,
) {
  final list = List<KelompokMahasiswaLeaderboardEntity>.from(groups);
  list.sort((a, b) => b.totalPoinKelompok.compareTo(a.totalPoinKelompok));
  return list;
}
