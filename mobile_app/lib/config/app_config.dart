/// Konfigurasi aplikasi terpusat.
/// Seluruh konstanta environment dan konfigurasi global didefinisikan di sini.
/// Sesuai sdd.md §13 — Mobile env config.
class AppConfig {
  AppConfig._();  

  // --- API ---
  // Android emulator: 10.0.2.2 → localhost host machine
  // HP fisik: gunakan IP lokal komputer (pastikan HP & PC satu WiFi)
  static const String apiBaseUrl = 'https://passerby-caucasian-viewpoint.ngrok-free.dev/api/v1';
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
