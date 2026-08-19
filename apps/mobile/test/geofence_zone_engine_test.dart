import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app_sampah/app/core/utils/geofence_zone_engine.dart';

void main() {
  group('GeofenceZoneEngine Tests', () {
    test('calculateHaversineDistance returns 0 for same point', () {
      final dist = GeofenceZoneEngine.calculateHaversineDistance(
        -6.8905, 107.6160,
        -6.8905, 107.6160,
      );
      expect(dist, 0.0);
    });

    test('calculateHaversineDistance computes accurate distance', () {
      // Jarak antara 2 titik di Bandung (sekitar 1.1 km)
      final dist = GeofenceZoneEngine.calculateHaversineDistance(
        -6.8905, 107.6160,
        -6.9005, 107.6160,
      );
      expect(dist, greaterThan(1100));
      expect(dist, lessThan(1120));
    });

    test('isPointInPolygon correctly detects points inside and outside square polygon', () {
      final squarePolygon = [
        [-6.8900, 107.6100],
        [-6.8900, 107.6200],
        [-6.9000, 107.6200],
        [-6.9000, 107.6100],
      ];

      // Titik di tengah-tengah
      final isInside = GeofenceZoneEngine.isPointInPolygon(-6.8950, 107.6150, squarePolygon);
      expect(isInside, isTrue);

      // Titik di luar polygon
      final isOutside = GeofenceZoneEngine.isPointInPolygon(-6.8800, 107.6150, squarePolygon);
      expect(isOutside, isFalse);
    });

    test('evaluatePosition with radius works correctly', () {
      final targetLat = -6.890500;
      final targetLng = 107.616000;

      // User 20 meter dari target (radius 150m)
      final resInside = GeofenceZoneEngine.evaluatePosition(
        userLat: -6.890600,
        userLng: 107.616000,
        targetLat: targetLat,
        targetLng: targetLng,
        radiusMeters: 150.0,
      );
      expect(resInside.isInside, isTrue);
      expect(resInside.methodUsed, 'RADIUS');

      // User 500 meter dari target
      final resOutside = GeofenceZoneEngine.evaluatePosition(
        userLat: -6.895500,
        userLng: 107.616000,
        targetLat: targetLat,
        targetLng: targetLng,
        radiusMeters: 150.0,
      );
      expect(resOutside.isInside, isFalse);
    });

    test('KknTargetRules tests minimum 200 hours threshold', () {
      // 100 jam -> belum memenuhi
      const seconds100h = 100 * 3600;
      expect(KknTargetRules.hasMetMinimumTarget(seconds100h), isFalse);
      expect(KknTargetRules.calculateTargetProgress(seconds100h), closeTo(0.5, 0.01));

      // 200 jam -> memenuhi target minimal
      const seconds200h = 200 * 3600;
      expect(KknTargetRules.hasMetMinimumTarget(seconds200h), isTrue);
      expect(KknTargetRules.calculateTargetProgress(seconds200h), 1.0);

      // 250 jam -> tetap valid (tidak dibatasi/diblokir)
      const seconds250h = 250 * 3600;
      expect(KknTargetRules.hasMetMinimumTarget(seconds250h), isTrue);
      expect(KknTargetRules.calculateTargetProgress(seconds250h), 1.0);
    });
  });
}
