import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

class OfflineCacheInterceptor extends Interceptor {
  @override
  Future<void> onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    // We don't block the request here because we want fresh data if online.
    // If we wanted aggressive caching, we could return cache here.
    return handler.next(options);
  }

  @override
  Future<void> onResponse(Response response, ResponseInterceptorHandler handler) async {
    // Jika request adalah GET dan berhasil, simpan responsenya
    if (response.requestOptions.method.toUpperCase() == 'GET' && response.statusCode == 200) {
      try {
        final prefs = await SharedPreferences.getInstance();
        final key = _getCacheKey(response.requestOptions);
        final dataStr = jsonEncode(response.data);
        await prefs.setString(key, dataStr);
      } catch (e) {
        // Abaikan error penyimpanan cache
      }
    }
    return handler.next(response);
  }

  @override
  Future<void> onError(DioException err, ErrorInterceptorHandler handler) async {
    // Jika error terjadi karena masalah koneksi/jaringan (Offline)
    if (_isNetworkError(err) && err.requestOptions.method.toUpperCase() == 'GET') {
      try {
        final prefs = await SharedPreferences.getInstance();
        final key = _getCacheKey(err.requestOptions);
        final cachedData = prefs.getString(key);

        if (cachedData != null) {
          // Buat response palsu dari cache
          final data = jsonDecode(cachedData);
          final response = Response(
            requestOptions: err.requestOptions,
            data: data,
            statusCode: 200,
            statusMessage: 'OK (Cached)',
          );
          return handler.resolve(response);
        }
      } catch (e) {
        // Abaikan dan biarkan error dilempar
      }
    }
    return handler.next(err);
  }

  String _getCacheKey(RequestOptions options) {
    // Gunakan URL beserta query parameters sebagai key
    return 'cache_${options.uri.toString()}';
  }

  bool _isNetworkError(DioException err) {
    return err.type == DioExceptionType.connectionTimeout ||
        err.type == DioExceptionType.sendTimeout ||
        err.type == DioExceptionType.receiveTimeout ||
        err.type == DioExceptionType.connectionError ||
        err.type == DioExceptionType.unknown;
  }
}
