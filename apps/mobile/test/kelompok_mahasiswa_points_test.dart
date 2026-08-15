import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app_sampah/app/data/models/kelompok_mahasiswa_models.dart';

void main() {
  group('Akumulasi Poin Kelompok Mahasiswa (A.12)', () {
    test('SUM poin individu anggota menghasilkan total poin kelompok yang tepat', () {
      const kelompok1 = KelompokMahasiswaLeaderboardEntity(
        kelompokId: 'K01',
        namaKelompok: 'Kelompok KKN 01 - Coblong',
        namaDpl: 'Dr. Ir. Ahmad, M.T.',
        anggota: [
          MahasiswaAnggotaEntity(id: 'm1', nim: '13521001', nama: 'Budi', kelompokId: 'K01', poinIndividu: 150),
          MahasiswaAnggotaEntity(id: 'm2', nim: '13521002', nama: 'Siti', kelompokId: 'K01', poinIndividu: 200),
          MahasiswaAnggotaEntity(id: 'm3', nim: '13521003', nama: 'Andri', kelompokId: 'K01', poinIndividu: 100),
        ],
      );

      // Verify SUM calculation: 150 + 200 + 100 = 450
      expect(kelompok1.totalPoinKelompok, equals(450));
    });

    test('Leaderboard kelompok terurut berdasarkan total poin terbanyak', () {
      const k01 = KelompokMahasiswaLeaderboardEntity(
        kelompokId: 'K01',
        namaKelompok: 'Kelompok 01',
        namaDpl: 'DPL 1',
        anggota: [
          MahasiswaAnggotaEntity(id: 'm1', nim: '111', nama: 'A', kelompokId: 'K01', poinIndividu: 100),
          MahasiswaAnggotaEntity(id: 'm2', nim: '112', nama: 'B', kelompokId: 'K01', poinIndividu: 50),
        ], // Total = 150
      );

      const k02 = KelompokMahasiswaLeaderboardEntity(
        kelompokId: 'K02',
        namaKelompok: 'Kelompok 02',
        namaDpl: 'DPL 2',
        anggota: [
          MahasiswaAnggotaEntity(id: 'm3', nim: '221', nama: 'C', kelompokId: 'K02', poinIndividu: 300),
          MahasiswaAnggotaEntity(id: 'm4', nim: '222', nama: 'D', kelompokId: 'K02', poinIndividu: 200),
        ], // Total = 500
      );

      final sorted = sortGroupLeaderboard([k01, k02]);

      expect(sorted.first.kelompokId, equals('K02'));
      expect(sorted.first.totalPoinKelompok, equals(500));
      expect(sorted.last.kelompokId, equals('K01'));
      expect(sorted.last.totalPoinKelompok, equals(150));
    });
  });
}
