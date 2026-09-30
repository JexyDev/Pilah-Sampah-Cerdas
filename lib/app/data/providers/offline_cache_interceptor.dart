import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Interceptor cache offline untuk Dio dengan masa berlaku (TTL) 5 menit.
///
/// Fitur:
/// 1. Menyimpan hasil GET dengan timestamp.
/// 2. Pada kondisi offline/network error, hanya menggunakan cache jika usianya < 5 menit.
/// 3. Menghapus otomatis cache terkait saat ada request mutasi (POST, PUT, DELETE, PATCH) yang sukses.
class OfflineCacheInterceptor extends Interceptor {
  /// TTL default untuk cache offline: 5 menit (300.000 ms)
  static const int defaultTtlMs = 5 * 60 * 1000;

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

    // 2. Tangani request MUTASI sukses (POST/PUT/DELETE/PATCH) -> hapus cache terkait
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
    return 'cache_${options.uri.toString()}';
  }

  /// Menghapus cache yang berkaitan dengan endpoint yang baru saja dimutasi
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

      for (final key in keys) {
        if (key.toLowerCase().contains(targetSegment)) {
          await prefs.remove(key);
          debugPrint('[OfflineCache] Cache dimusnahkan pasca-mutasi: $key');
        }
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
