import 'package:flutter/foundation.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'safe_storage.dart';
import '../values/app_config.dart';

/// Manajer cache lokal aplikasi terpusat.
///
/// Bertanggung jawab untuk:
/// 1. Mendeteksi kenaikan versi APK saat aplikasi pertama kali berjalan.
/// 2. Menghapus otomatis cache API usang (Zero-Stale) tanpa menghapus sesi login pengguna.
/// 3. Menyediakan utilitas pembersihan cache API on-demand.
class AppCacheManager {
  AppCacheManager._();

  static const String _keyLastAppVersion = 'last_app_version';

  // Daftar key cache repositori spesifik di SharedPreferences
  static const List<String> _knownPrefCacheKeys = [
    'kkn_dashboard_cache',
    'kkn_warga_cache',
    'kkn_activity_log_cache',
    'petugas_pemilahan_dashboard_cache',
    'petugas_pemilahan_jadwal_cache',
    'petugas_pemilahan_history_cache',
  ];

  // Daftar key aman di SafeStorage yang TIDAK BOLEH dihapus (Auth & Profile)
  static const Set<String> _preservedStorageKeys = {
    AppConfig.accessTokenKey,
    AppConfig.refreshTokenKey,
    AppConfig.userDataKey,
    AppConfig.householdIdKey,
    AppConfig.mahasiswaKecamatanKey,
    AppConfig.mahasiswaKelurahanKey,
    AppConfig.mahasiswaRwKey,
  };

  /// Memeriksa versi aplikasi saat startup.
  /// Jika versi APK berubah/baru di-update, bersihkan cache API lama.
  static Future<void> checkVersionAndCleanCache() async {
    try {
      final packageInfo = await PackageInfo.fromPlatform();
      final currentVersion =
          '${packageInfo.version}+${packageInfo.buildNumber}';

      final prefs = await SharedPreferences.getInstance();
      final lastVersion = prefs.getString(_keyLastAppVersion);

      if (lastVersion == null || lastVersion != currentVersion) {
        debugPrint(
          '[AppCacheManager] Update APK terdeteksi ($lastVersion -> $currentVersion). Membersihkan cache lama...',
        );
        await clearAllApiCache();
        await prefs.setString(_keyLastAppVersion, currentVersion);
        debugPrint(
          '[AppCacheManager] Pembersihan cache selesai. Versi tercatat: $currentVersion',
        );
      }
    } catch (e) {
      debugPrint('[AppCacheManager] Gagal memeriksa versi aplikasi: $e');
    }
  }

  /// Menghapus seluruh cache data API dari SharedPreferences dan SafeStorage.
  /// Sesi login (Access/Refresh Token dan User Data) dijamin tetap aman.
  static Future<void> clearAllApiCache() async {
    try {
      // 1. Bersihkan cache di SharedPreferences
      final prefs = await SharedPreferences.getInstance();
      final allPrefKeys = prefs.getKeys().toList();

      for (final key in allPrefKeys) {
        // Hapus cache Dio GET (cache_*), hidden history, dan cache modul terdaftar
        if (key.startsWith('cache_') ||
            key.startsWith('hidden_history_') ||
            _knownPrefCacheKeys.contains(key)) {
          await prefs.remove(key);
        }
      }

      // 2. Bersihkan cache di SafeStorage
      const storage = SafeStorage();
      final allStorageData = await storage.readAll();

      for (final key in allStorageData.keys) {
        if (_preservedStorageKeys.contains(key)) {
          continue; // Lewati data autentikasi penting
        }

        if (key == 'cached_bins' ||
            key.startsWith('cached_bins_') ||
            key.startsWith('cached_waste_logs_') ||
            key.startsWith('active_reset_request_') ||
            key.startsWith('ai_limit_') ||
            key.startsWith('backup_hidden_history_')) {
          await storage.delete(key: key);
        }
      }

      debugPrint('[AppCacheManager] Seluruh cache API berhasil dibersihkan.');
    } catch (e) {
      debugPrint('[AppCacheManager] Kesalahan saat membersihkan cache API: $e');
    }
  }
}
