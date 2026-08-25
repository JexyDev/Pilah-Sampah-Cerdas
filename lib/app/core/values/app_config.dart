/// Konfigurasi aplikasi terpusat.
/// Seluruh konstanta environment dan konfigurasi global didefinisikan di sini.
class AppConfig {
  AppConfig._();

  // --- API Base URL ---
  // Default: domain produksi ber-SSL.
  // Override saat build tanpa mengubah kode, contoh:
  //   flutter build apk --dart-define=API_BASE_URL=http://157.10.252.252:3000
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://berseka.id',
  );

  /// Alamat cadangan (akses langsung via IP) bila domain belum ter-resolve
  /// pada jaringan klien tertentu.
  static const String fallbackBaseUrl = 'http://157.10.252.252:3000';

  static String get apiBaseUrl => '$baseUrl/api/v1';

  // URL khusus untuk AI deteksi
  // Bisa di-override dengan: --dart-define=AI_API_URL=http://...
  static const String aiApiUrl = String.fromEnvironment(
    'AI_API_URL',
    defaultValue: 'https://berseka.id/api/v1/waste/detect',
  );

  static const String appName = 'BERSEKA';

  /// Format URL gambar dari API agar selalu valid
  static String getImageUrl(String? path) {
    if (path == null || path.isEmpty) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    final cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return '$baseUrl/$cleanPath';
  }

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
  static const String mahasiswaKecamatanKey = 'mahasiswa_kecamatan';
  static const String mahasiswaKelurahanKey = 'mahasiswa_kelurahan';
  static const String mahasiswaRwKey = 'mahasiswa_rw';

  // --- Bin Capacity (FR-02) ---
  static const double binMaxCapacityLiters = 25.0;
  static const double binCriticalThresholdPercent = 0.90;

  // --- Point Conversion (FR-03) ---
  static const double organicDensityKgPerLiter = 0.4;
  static const double nonOrganicDensityKgPerLiter = 0.2;
  static const int pointsPerKg = 100;
}
