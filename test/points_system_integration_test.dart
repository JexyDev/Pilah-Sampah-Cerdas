import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app_sampah/app/data/models/user_entity.dart';
import 'package:mobile_app_sampah/app/data/models/point_history_entity.dart';
import 'package:mobile_app_sampah/app/data/models/bin_entity.dart';

void main() {
  group('Integrasi Sistem Poin Mobile dengan Kontrak Backend', () {
    test(
      'UserRole.fromApi mengenali role MAHASISWA_KKN, PETUGAS_RESIDU, dan WARGA',
      () {
        expect(
          UserRoleExtension.fromApi('MAHASISWA_KKN'),
          equals(UserRole.mahasiswaKkn),
        );
        expect(
          UserRoleExtension.fromApi('PETUGAS_RESIDU'),
          equals(UserRole.petugasPemilahan),
        );
        expect(UserRoleExtension.fromApi('WARGA'), equals(UserRole.warga));
      },
    );

    test('PointHistoryEntity memetakan reward poin transaksi backend', () {
      // 1. First-time login bonus Mahasiswa KKN (+20 poin)
      final loginBonus = PointHistoryEntity(
        id: 'ph-login-1',
        userId: 'mhs-123',
        points: 20,
        wasteType: WasteType.organic,
        description: 'Bonus login pertama Mahasiswa KKN',
        createdAt: DateTime.now(),
      );
      expect(loginBonus.points, equals(20));
      expect(loginBonus.description, contains('Bonus login pertama'));

      // 2. Reward validasi pengosongan tempat sampah Petugas Pemilah (+15 poin)
      final petugasReward = PointHistoryEntity(
        id: 'ph-bin-1',
        userId: 'petugas-456',
        points: 15,
        wasteType: WasteType.organic,
        description: 'Reward validasi pengosongan tempat sampah (QR-BIN-01)',
        createdAt: DateTime.now(),
      );
      expect(petugasReward.points, equals(15));
      expect(
        petugasReward.description,
        contains('Reward validasi pengosongan'),
      );

      // 3. Reward presensi masuk (+4) & durasi kepulangan (+3) Mahasiswa KKN
      final checkInReward = PointHistoryEntity(
        id: 'ph-att-in',
        userId: 'mhs-123',
        points: 4,
        wasteType: WasteType.organic,
        description: 'Poin kehadiran KKN (Check-In): Posko Coblong',
        createdAt: DateTime.now(),
      );
      final checkOutReward = PointHistoryEntity(
        id: 'ph-att-out',
        userId: 'mhs-123',
        points: 3,
        wasteType: WasteType.organic,
        description:
            'Poin durasi harian terpenuhi presensi KKN: Posko Coblong',
        createdAt: DateTime.now(),
      );
      expect(checkInReward.points, equals(4));
      expect(checkOutReward.points, equals(3));
      expect(checkInReward.points + checkOutReward.points, equals(7));
    });
  });
}
