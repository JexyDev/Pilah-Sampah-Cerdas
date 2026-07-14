import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

/// Konfigurasi aplikasi terpusat.
/// Seluruh konstanta environment dan konfigurasi global didefinisikan di sini.
/// Sesuai sdd.md §13 — Mobile env config.
class AppConfig {
  AppConfig._();  

  // --- API ---
  static String get apiBaseUrl {
    if (kIsWeb) return 'http://127.0.0.1:3000/api/v1';
    try {
      if (Platform.isAndroid) return 'http://172.16.0.2:3000/api/v1';
    } catch (_) {}
    return 'http://127.0.0.1:3000/api/v1';
  }
  static const String appName = 'Pilah Sampah Cerdas';

  // --- Geofencing (FR-02, sdd.md §4.2) ---
  static const int geofenceRadiusMeters = 10;

  // --- AI Config (FR-01, srs.md) ---
  static const int aiTimeoutMs = 2000;
  static const int aiDailyLimit = 50;

  // --- Upload (sdd.md §13) ---
  static const int maxUploadSizeMb = 1;

  // --- Token (sdd.md §4.1) ---
  static const String refreshTokenCookieName = 'psc_refresh_token';
  static const int accessTokenExpiryMinutes = 15;
  static const int refreshTokenExpiryDays = 7;

  // --- Bin Capacity (srs.md FR-02) ---
  static const double binMaxCapacityLiters = 25.0;
  static const double binCriticalThresholdPercent = 0.90;

  // --- Point Conversion (srs.md FR-03) ---
  static const double organicDensityKgPerLiter = 0.4;
  static const double nonOrganicDensityKgPerLiter = 0.2;
  static const int pointsPerKg = 100;

  // --- Mock / Development ---
  /// householdId dummy — diganti dari user session saat BE tersedia
  static const String mockHouseholdId = 'hh-habil-001';

  /// userId fallback dummy — diganti dari auth state saat BE tersedia
  static const String mockUserId = 'user-habil-001';
}
