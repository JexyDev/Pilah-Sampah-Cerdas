import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import '../../core/utils/safe_storage.dart';
import '../../config/app_config.dart';
import '../../core/router/app_router.dart';
import '../../main.dart' show navigatorKey;

/// HTTP Client terpusat dengan interceptor auto-refresh token.
///
/// Mekanisme:
/// 1. Setiap request otomatis di-inject `Authorization: Bearer <accessToken>`.
/// 2. Jika respons 401 → coba refresh token (instance Dio terpisah).
///    - Berhasil → simpan token baru, retry request asal.
///    - Gagal → hapus semua token, force-navigate ke LoginScreen.
/// 3. Mutex _isRefreshing + antrian _pendingRequests mencegah
///    race condition saat banyak request 401 bersamaan.
class ApiClient {
  final Dio dio;
  final SafeStorage secureStorage;

  // ── Mutex untuk refresh token ──────────────────────────────────────────────
  bool _isRefreshing = false;
  final List<_PendingRequest> _pendingRequests = [];

  // ── Cache Token untuk Optimasi Performa ────────────────────────────────────
  String? _cachedToken;

  void clearTokenCache() {
    _cachedToken = null;
  }

  ApiClient({required this.dio, required this.secureStorage}) {
    dio.options.baseUrl = AppConfig.apiBaseUrl;
    dio.options.connectTimeout = const Duration(seconds: 30);
    dio.options.receiveTimeout = const Duration(seconds: 30);
    dio.options.headers = {
      'Content-Type': 'application/json',
      'Bypass-Tunnel-Reminder': 'true' // Bypass localtunnel warning page
    };
    dio.interceptors.add(
      InterceptorsWrapper(
        // ── Inject access token ke setiap request ────────────────────────
        onRequest: (options, handler) async {
          _cachedToken ??= await secureStorage.read(key: AppConfig.accessTokenKey);
          
          if (_cachedToken != null && _cachedToken!.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $_cachedToken';
          }
          return handler.next(options);
        },

        onResponse: (response, handler) => handler.next(response),

        // ── Auto-refresh saat 401 + force logout jika refresh gagal ──────
        onError: (DioException e, handler) async {
          // Bukan 401 → langsung propagasi error
          if (e.response?.statusCode != 401) {
            return handler.next(e);
          }

          // Hindari infinite loop: jangan refresh kalau request ini sendiri
          // adalah endpoint refresh/login
          final path = e.requestOptions.path;
          if (path.contains('/auth/refresh') || path.contains('/auth/login')) {
            return handler.next(e);
          }

          // ── Jika sudah ada proses refresh berjalan → antrekan request ini
          if (_isRefreshing) {
            final completer = Completer<Response>();
            _pendingRequests.add(_PendingRequest(
              requestOptions: e.requestOptions,
              completer: completer,
              handler: handler,
            ));
            try {
              final response = await completer.future;
              return handler.resolve(response);
            } catch (retryError) {
              return handler.next(e);
            }
          }

          // ── Mulai proses refresh ──────────────────────────────────────
          _isRefreshing = true;

          final refreshToken = await secureStorage.read(
            key: AppConfig.refreshTokenKey,
          );

          // Tidak ada refresh token → force logout
          if (refreshToken == null || refreshToken.isEmpty) {
            _isRefreshing = false;
            await _forceLogout();
            return handler.next(e);
          }

          try {
            // Gunakan instance Dio TERPISAH agar tidak terjebak interceptor
            final refreshDio = Dio(BaseOptions(
              baseUrl: AppConfig.apiBaseUrl,
              connectTimeout: const Duration(seconds: 10),
              receiveTimeout: const Duration(seconds: 10),
              headers: {'Bypass-Tunnel-Reminder': 'true'},
            ));

            final refreshRes = await refreshDio.post(
              '/auth/refresh',
              data: {'refreshToken': refreshToken},
            );

            if (refreshRes.statusCode == 200) {
              final newAccessToken =
                  refreshRes.data['data']['accessToken'] as String;

              // Simpan token baru (access + refresh jika backend mengembalikan)
              await secureStorage.write(
                key: AppConfig.accessTokenKey,
                value: newAccessToken,
              );
              _cachedToken = newAccessToken; // UPDATE CACHE
              final newRefreshToken =
                  refreshRes.data['data']['refreshToken']?.toString();
              if (newRefreshToken != null && newRefreshToken.isNotEmpty) {
                await secureStorage.write(
                  key: AppConfig.refreshTokenKey,
                  value: newRefreshToken,
                );
              }

              _isRefreshing = false;

              // ── Retry semua request yang mengantri ──────────────────
              _resolvePendingRequests(newAccessToken);

              // ── Retry request asal ────────────────────────────────
              final opts = e.requestOptions;
              opts.headers['Authorization'] = 'Bearer $newAccessToken';
              final retryRes = await dio.fetch(opts);
              return handler.resolve(retryRes);
            }

            // Refresh berhasil tapi statusCode bukan 200 → force logout
            throw Exception('Refresh failed with status ${refreshRes.statusCode}');
          } catch (_) {
            // ── Refresh GAGAL → force logout ───────────────────────────
            _isRefreshing = false;
            _rejectPendingRequests();
            await _forceLogout();
            return handler.next(e);
          }
        },
      ),
    );
  }

  // ── Force Logout — hapus token & navigate ke Login ──────────────────────────

  Future<void> _forceLogout() async {
    _cachedToken = null; // HAPUS CACHE
    // Hapus semua data autentikasi dari secure storage
    await Future.wait([
      secureStorage.delete(key: AppConfig.accessTokenKey),
      secureStorage.delete(key: AppConfig.refreshTokenKey),
      secureStorage.delete(key: AppConfig.userDataKey),
      secureStorage.delete(key: AppConfig.householdIdKey),
    ]);

    // Navigate ke Login dan hapus semua rute sebelumnya
    final navState = navigatorKey.currentState;
    if (navState != null && navState.mounted) {
      navState.pushNamedAndRemoveUntil(
        AppRoutes.login,
        (_) => false,
      );

      // Tampilkan SnackBar setelah navigasi selesai
      WidgetsBinding.instance.addPostFrameCallback((_) {
        final ctx = navigatorKey.currentContext;
        if (ctx != null) {
          ScaffoldMessenger.of(ctx).showSnackBar(
            const SnackBar(
              content: Text('Sesi Anda telah habis, silakan login kembali.'),
              backgroundColor: Color(0xFFE74C3C),
              duration: Duration(seconds: 4),
            ),
          );
        }
      });
    }
  }

  // ── Pending Request Queue Management ────────────────────────────────────────

  void _resolvePendingRequests(String newToken) {
    for (final pending in _pendingRequests) {
      pending.requestOptions.headers['Authorization'] = 'Bearer $newToken';
      dio.fetch(pending.requestOptions).then(
        (response) => pending.completer.complete(response),
        onError: (error) => pending.completer.completeError(error),
      );
    }
    _pendingRequests.clear();
  }

  void _rejectPendingRequests() {
    for (final pending in _pendingRequests) {
      pending.completer.completeError(
        DioException(
          requestOptions: pending.requestOptions,
          error: 'Session expired',
          type: DioExceptionType.cancel,
        ),
      );
    }
    _pendingRequests.clear();
  }
}

/// Data class untuk menyimpan request yang mengantri selama refresh token.
class _PendingRequest {
  final RequestOptions requestOptions;
  final Completer<Response> completer;
  final ErrorInterceptorHandler handler;

  _PendingRequest({
    required this.requestOptions,
    required this.completer,
    required this.handler,
  });
}
