import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/utils/safe_storage.dart';

/// Interceptor cache offline untuk Dio dengan masa berlaku (TTL) 5 menit.
///
/// Fitur:
/// 1. Menyimpan hasil GET dengan timestamp.
/// 2. Pada kondisi offline/network error, hanya menggunakan cache jika usianya < 5 menit.
/// 3. Menghapus otomatis cache terkait lintas domain saat ada request mutasi (POST, PUT, DELETE, PATCH).
/// 4. Sinkronisasi pembersihan cache ganda (Dio Cache dan Manual Repository Cache di SharedPreferences/SafeStorage).
class OfflineCacheInterceptor extends Interceptor {
  /// TTL default untuk cache offline: 5 menit (300.000 ms)
  static const int defaultTtlMs = 5 * 60 * 1000;

  /// Relasi dependensi domain untuk invalidasi lintas sumber daya (Cross-Resource Invalidation)
  static const Map<String, List<String>> _domainRelations = {
    'transactions': ['transactions', 'points', 'bins'],
    'waste': ['waste', 'transactions', 'points', 'bins'],
    'bins': ['bins', 'transactions', 'points'],
    'warga': ['warga', 'bins', 'points'],
    'kkn': ['kkn', 'logbook', 'timesheet', 'schedules', 'points', 'history'],
    'logbook': ['logbook', 'kkn', 'timesheet', 'points'],
    'petugas-residu': ['petugas-residu', 'petugas-pemilahan', 'points', 'history', 'bins'],
    'petugas-pemilahan': ['petugas-pemilahan', 'petugas-residu', 'points', 'history', 'bins'],
    'points': ['points', 'transactions', 'kkn', 'history'],
    'history': ['history', 'points', 'transactions', 'kkn'],
    'attendance': ['kkn', 'attendance', 'points', 'timesheet'],
  };

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    return handler.next(options);
  }

  @override
  Future<void> onResponse(
    Response response,
    ResponseInterceptorHandler handler,
  ) async {
    final method = response.requestOptions.method.toUpperCase();
    final statusCode = response.statusCode ?? 0;

    // 1. Tangani request GET sukses -> simpan cache dengan timestamp
    if (method == 'GET' && statusCode >= 200 && statusCode < 300) {
      try {
        final prefs = await SharedPreferences.getInstance();
        final key = _getCacheKey(response.requestOptions);
        final payload = {
          'timestamp': DateTime.now().millisecondsSinceEpoch,
          'data': response.data,
        };
        await prefs.setString(key, jsonEncode(payload));
      } catch (e) {
        debugPrint('[OfflineCache] Gagal menyimpan cache: $e');
      }
    }

    // 2. Tangani request MUTASI sukses (POST/PUT/DELETE/PATCH) -> hapus cache terkait lintas domain
    if ((method == 'POST' ||
            method == 'PUT' ||
            method == 'DELETE' ||
            method == 'PATCH') &&
        statusCode >= 200 &&
        statusCode < 300) {
      _invalidateRelatedCache(response.requestOptions.path);
    }

    return handler.next(response);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    // Hanya tangani error jaringan untuk request GET
    if (_isNetworkError(err) &&
        err.requestOptions.method.toUpperCase() == 'GET') {
      try {
        final prefs = await SharedPreferences.getInstance();
        final key = _getCacheKey(err.requestOptions);
        final cachedRaw = prefs.getString(key);

        if (cachedRaw != null) {
          final decoded = jsonDecode(cachedRaw);

          int? cachedTimestamp;
          dynamic cachedData;

          if (decoded is Map<String, dynamic> &&
              decoded.containsKey('timestamp') &&
              decoded.containsKey('data')) {
            cachedTimestamp = decoded['timestamp'] as int?;
            cachedData = decoded['data'];
          } else {
            // Format lama tanpa timestamp -> anggap kedaluwarsa dan hapus
            await prefs.remove(key);
            return handler.next(err);
          }

          // Cek apakah cache masih dalam batas TTL (5 menit)
          if (cachedTimestamp != null) {
            final now = DateTime.now().millisecondsSinceEpoch;
            final ageMs = now - cachedTimestamp;

            if (ageMs <= defaultTtlMs) {
              debugPrint(
                '[OfflineCache] Menyajikan cache valid (usia: ${(ageMs / 1000).toStringAsFixed(0)}s) untuk ${err.requestOptions.uri.path}',
              );
              final response = Response(
                requestOptions: err.requestOptions,
                data: cachedData,
                statusCode: 200,
                statusMessage: 'OK (Cached)',
                headers: Headers.fromMap({
                  'x-from-cache': ['true'],
                }),
              );
              return handler.resolve(response);
            } else {
              // Cache sudah basi (> 5 menit), hapus agar tidak nyangkut
              debugPrint(
                '[OfflineCache] Cache kadaluarsa (>5 menit) dihapus untuk ${err.requestOptions.uri.path}',
              );
              await prefs.remove(key);
            }
          }
        }
      } catch (e) {
        debugPrint('[OfflineCache] Gagal membaca fallback cache: $e');
      }
    }
    return handler.next(err);
  }

  String _getCacheKey(RequestOptions options) {
    final auth = options.headers['Authorization']?.toString();
    final authPrefix = (auth != null && auth.isNotEmpty)
        ? 'auth_${auth.hashCode.abs()}_'
        : 'pub_';
    return 'cache_$authPrefix${options.uri.toString()}';
  }

  /// Menghapus cache yang berkaitan dengan endpoint yang baru saja dimutasi secara lintas domain
  Future<void> _invalidateRelatedCache(String path) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final keys = prefs.getKeys().where((k) => k.startsWith('cache_')).toList();

      // Ekstrak segmen sumber data dari path (misal: 'bins', 'points', 'transactions', 'kkn', 'petugas')
      final segments = path
          .split('/')
          .where((s) => s.isNotEmpty && s != 'api' && s != 'v1')
          .toList();

      if (segments.isEmpty) return;
      final targetSegment = segments.first.toLowerCase();

      // Dapatkan seluruh segmen terkait berdasarkan tabel relasi domain
      final relatedSegments = _domainRelations[targetSegment] ?? [targetSegment];

      // 1. Hapus cache Dio (cache_*) yang cocok dengan segmen terkait manapun
      for (final key in keys) {
        final keyLower = key.toLowerCase();
        for (final segment in relatedSegments) {
          if (keyLower.contains(segment)) {
            await prefs.remove(key);
            debugPrint('[OfflineCache] Cache Dio dimusnahkan pasca-mutasi: $key');
            break;
          }
        }
      }

      // 2. Hapus cache manual repositori pada SharedPreferences & SafeStorage
      const storage = SafeStorage();

      if (relatedSegments.contains('bins')) {
        await storage.delete(key: 'cached_bins');
        debugPrint('[OfflineCache] Cache manual SafeStorage cached_bins dimusnahkan.');
      }

      if (relatedSegments.contains('transactions') || relatedSegments.contains('points')) {
        final allStorageKeys = await storage.readAll();
        for (final k in allStorageKeys.keys) {
          if (k.startsWith('cached_waste_logs_')) {
            await storage.delete(key: k);
            debugPrint('[OfflineCache] Cache manual SafeStorage $k dimusnahkan.');
          }
        }
      }

      if (relatedSegments.contains('kkn') || relatedSegments.contains('logbook')) {
        await prefs.remove('kkn_dashboard_cache');
        await prefs.remove('kkn_warga_cache');
        await prefs.remove('kkn_activity_log_cache');
        debugPrint('[OfflineCache] Cache manual SharedPreferences KKN dimusnahkan.');
      }

      if (relatedSegments.contains('petugas-residu') ||
          relatedSegments.contains('petugas-pemilahan')) {
        await prefs.remove('petugas_pemilahan_dashboard_cache');
        await prefs.remove('petugas_pemilahan_jadwal_cache');
        await prefs.remove('petugas_pemilahan_history_cache');
        debugPrint('[OfflineCache] Cache manual SharedPreferences Petugas dimusnahkan.');
      }
    } catch (e) {
      debugPrint('[OfflineCache] Gagal menghapus cache pasca-mutasi: $e');
    }
  }

  bool _isNetworkError(DioException err) {
    return err.type == DioExceptionType.connectionTimeout ||
        err.type == DioExceptionType.sendTimeout ||
        err.type == DioExceptionType.receiveTimeout ||
        err.type == DioExceptionType.connectionError ||
        err.type == DioExceptionType.unknown;
  }
}
