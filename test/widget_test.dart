// Widget test placeholder untuk Pilah Sampah Cerdas.
// Test fungsional akan ditambahkan setelah integrasi backend selesai.
// Sesuai CLAUDE.md — unit test difokuskan pada service/usecase layer.

import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app_sampah/config/app_config.dart';
import 'package:mobile_app_sampah/core/utils/platform_utils.dart';

void main() {
  group('AppConfig', () {
    test('geofence radius sesuai sdd.md §4.2', () {
      expect(AppConfig.geofenceRadiusMeters, equals(10));
    });

    test('bin max capacity sesuai srs.md FR-02', () {
      expect(AppConfig.binMaxCapacityLiters, equals(25.0));
    });

    test('bin critical threshold sesuai srs.md FR-04', () {
      expect(AppConfig.binCriticalThresholdPercent, equals(0.90));
    });

    test('organic density sesuai srs.md FR-03', () {
      expect(AppConfig.organicDensityKgPerLiter, equals(0.4));
    });

    test('non-organic density sesuai srs.md FR-03', () {
      expect(AppConfig.nonOrganicDensityKgPerLiter, equals(0.2));
    });

    test('points per kg sesuai srs.md FR-03', () {
      expect(AppConfig.pointsPerKg, equals(100));
    });

    test('AI timeout sesuai srs.md FR-01', () {
      expect(AppConfig.aiTimeoutMs, equals(2000));
    });

    test('AI daily limit sesuai srs.md NFR-02', () {
      expect(AppConfig.aiDailyLimit, equals(50));
    });
  });

  group('PlatformUtils', () {
    test('platformName tidak kosong', () {
      expect(PlatformUtils.platformName, isNotEmpty);
    });

    test('supportsGps selalu true', () {
      expect(PlatformUtils.supportsGps, isTrue);
    });
  });
}
