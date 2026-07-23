

/// Konfigurasi aplikasi terpusat.
/// Seluruh konstanta environment dan konfigurasi global didefinisikan di sini.
class AppConfig {
  AppConfig._();

  // --- API Base URL ---
  // Server backend di-hosting pada VPS secara publik
  static const String _devServerIp = '157.10.252.252'; 
  static const int _port = 3000;

  static String get baseUrl {
    return 'http://$_devServerIp:$_port';
  }

  static String get apiBaseUrl => '$baseUrl/api/v1';

  static const String appName = 'Pilah Sampah Cerdas';

  // --- Geofencing (FR-02) ---
  static const int geofenceRadiusMeters = 10;

  // --- AI Config (FR-01) ---
  static const int aiTimeoutMs = 2000;
  static const int aiDailyLimit = 50;

  // --- Upload ---
  static const int maxUploadSizeMb = 1;

  // --- Token ---
  static const String accessTokenKey = 'access_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userDataKey = 'user_data';
  static const String householdIdKey = 'household_id';

  // --- Bin Capacity (FR-02) ---
  static const double binMaxCapacityLiters = 25.0;
  static const double binCriticalThresholdPercent = 0.90;

  // --- Point Conversion (FR-03) ---
  static const double organicDensityKgPerLiter = 0.4;
  static const double nonOrganicDensityKgPerLiter = 0.2;
  static const int pointsPerKg = 100;
}
