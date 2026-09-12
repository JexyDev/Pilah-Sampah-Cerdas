import 'package:flutter_test/flutter_test.dart';
import 'package:geolocator/geolocator.dart';
import 'package:mobile_app_sampah/app/modules/shared/controllers/user_location_controller.dart';

void main() {
  group('UserLocationState Logic & Consistency Tests', () {
    test('UserLocationState inisialisasi awal default', () {
      const state = UserLocationState();
      expect(state.position, isNull);
      expect(state.address, isNull);
      expect(state.isFetchingAddress, isFalse);
      expect(state.error, isNull);
    });

    test('UserLocationState copyWith memperbarui nilai dengan tepat', () {
      const initial = UserLocationState();
      final pos = Position(
        latitude: -6.9175,
        longitude: 107.6191,
        timestamp: DateTime.now(),
        accuracy: 10.0,
        altitude: 700.0,
        altitudeAccuracy: 5.0,
        heading: 0.0,
        headingAccuracy: 0.0,
        speed: 0.0,
        speedAccuracy: 0.0,
      );

      final updated = initial.copyWith(
        position: pos,
        address: 'Jl. Merdeka No. 1, Bandung',
        isFetchingAddress: false,
      );

      expect(updated.position?.latitude, equals(-6.9175));
      expect(updated.position?.longitude, equals(107.6191));
      expect(updated.address, equals('Jl. Merdeka No. 1, Bandung'));
      expect(updated.isFetchingAddress, isFalse);
      expect(updated.error, isNull);
    });

    test('UserLocationState copyWith clearError menghapus pesan error', () {
      const stateWithError = UserLocationState(error: 'GPS error');
      expect(stateWithError.error, equals('GPS error'));

      final cleared = stateWithError.copyWith(clearError: true);
      expect(cleared.error, isNull);
    });
  });
}
