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
  });

  final String kelompokId;
  final String namaKelompok;
  final String namaDpl;
  final List<MahasiswaAnggotaEntity> anggota;

  /// Akumulasi Poin Kelompok = SUM(poin individu seluruh anggota) (A.12)
  int get totalPoinKelompok {
    return anggota.fold<int>(0, (sum, item) => sum + item.poinIndividu);
  }

  @override
  List<Object?> get props => [kelompokId, totalPoinKelompok, anggota];
}

/// Helper function untuk kalkulasi dan pemeringkatan Leaderboard Kelompok
List<KelompokMahasiswaLeaderboardEntity> sortGroupLeaderboard(
    List<KelompokMahasiswaLeaderboardEntity> groups) {
  final list = List<KelompokMahasiswaLeaderboardEntity>.from(groups);
  list.sort((a, b) => b.totalPoinKelompok.compareTo(a.totalPoinKelompok));
  return list;
}
