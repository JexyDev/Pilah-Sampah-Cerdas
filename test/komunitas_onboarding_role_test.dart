import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app_sampah/app/data/models/user_entity.dart';

void main() {
  group('Komunitas Onboarding Role Selection & UserEntity Tests', () {
    test('UserEntity role defaults and copyWith updates role properly', () {
      const user = UserEntity(
        id: 'usr-1',
        name: 'Budi',
        role: UserRole.warga,
      );

      expect(user.role, equals(UserRole.warga));
      expect(user.role.apiValue, equals('WARGA'));
      expect(user.role.displayName, equals('Warga'));

      final updatedUser = user.copyWith(
        role: UserRole.petugasPemilahan,
      );

      expect(updatedUser.role, equals(UserRole.petugasPemilahan));
      expect(updatedUser.role.apiValue, equals('PETUGAS_RESIDU'));
      expect(updatedUser.role.displayName, equals('Petugas Pemilahan'));
    });

    test('UserRole fromApi parses Petugas Pemilahan & Warga correctly', () {
      expect(UserRoleExtension.fromApi('WARGA'), equals(UserRole.warga));
      expect(UserRoleExtension.fromApi('PETUGAS_RESIDU'), equals(UserRole.petugasPemilahan));
      expect(UserRoleExtension.fromApi('PETUGAS_PEMILAHAN'), equals(UserRole.petugasPemilahan));
    });
  });
}
