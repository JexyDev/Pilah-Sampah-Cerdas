import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app_sampah/app/data/models/kelompok_mahasiswa_models.dart';

void main() {
  group('Poin Kelompok Mahasiswa KKN (Formula Resmi Backend: 60% Proker + 40% Rata-rata Anggota)', () {
    test(
      'Kalkulasi terbobot 60% Proker + 40% Rata-rata Anggota menghasilkan nilai yang akurat',
      () {
        const kelompok1 = KelompokMahasiswaLeaderboardEntity(
          kelompokId: 'K01',
          namaKelompok: 'Kelompok KKN 01 - Coblong',
          namaDpl: 'Dr. Ir. Ahmad, M.T.',
          poinProker: 10,
          anggota: [
            MahasiswaAnggotaEntity(
              id: 'm1',
              nim: '13521001',
              nama: 'Budi',
              kelompokId: 'K01',
              poinIndividu: 150,
            ),
            MahasiswaAnggotaEntity(
              id: 'm2',
              nim: '13521002',
              nama: 'Siti',
              kelompokId: 'K01',
              poinIndividu: 200,
            ),
            MahasiswaAnggotaEntity(
              id: 'm3',
              nim: '13521003',
              nama: 'Andri',
              kelompokId: 'K01',
              poinIndividu: 100,
            ),
          ],
        );

        // Rata-rata anggota = (150 + 200 + 100) / 3 = 150.0
        // Poin Proker = 10 * 0.6 = 6.0
        // Rata-rata Anggota = 150 * 0.4 = 60.0
        // Total Poin Kelompok = 6.0 + 60.0 = 66.0
        expect(kelompok1.rataRataPoinAnggota, equals(150.0));
        expect(kelompok1.totalPoinKelompok, equals(66.0));
      },
    );

    test('Poin kelompok mengutamakan nilai langsung dari backend API jika tersedia', () {
      const kelompokWithBackend = KelompokMahasiswaLeaderboardEntity(
        kelompokId: 'K01',
        namaKelompok: 'Kelompok KKN 01 - Coblong',
        namaDpl: 'Dr. Ir. Ahmad, M.T.',
        totalPoinBackend: 84.5,
        anggota: [],
      );

      expect(kelompokWithBackend.totalPoinKelompok, equals(84.5));
    });

    test('Leaderboard kelompok terurut berdasarkan total poin terbanyak', () {
      const k01 = KelompokMahasiswaLeaderboardEntity(
        kelompokId: 'K01',
        namaKelompok: 'Kelompok 01',
        namaDpl: 'DPL 1',
        totalPoinBackend: 45.0,
        anggota: [],
      );

      const k02 = KelompokMahasiswaLeaderboardEntity(
        kelompokId: 'K02',
        namaKelompok: 'Kelompok 02',
        namaDpl: 'DPL 2',
        totalPoinBackend: 88.5,
        anggota: [],
      );

      final sorted = sortGroupLeaderboard([k01, k02]);

      expect(sorted.first.kelompokId, equals('K02'));
      expect(sorted.first.totalPoinKelompok, equals(88.5));
      expect(sorted.last.kelompokId, equals('K01'));
      expect(sorted.last.totalPoinKelompok, equals(45.0));
    });
  });
}
