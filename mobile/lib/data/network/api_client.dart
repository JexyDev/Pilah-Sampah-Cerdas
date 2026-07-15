import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../config/app_config.dart';

class ApiClient {
  final Dio dio;
  final FlutterSecureStorage secureStorage;

  ApiClient({required this.dio, required this.secureStorage}) {
    dio.options.baseUrl = AppConfig.apiBaseUrl;
    dio.options.connectTimeout = const Duration(seconds: 15);
    dio.options.receiveTimeout = const Duration(seconds: 15);
    dio.options.headers = {'Content-Type': 'application/json'};

    dio.interceptors.add(
      InterceptorsWrapper(
        // ── Inject access token ke setiap request ────────────────────────
        onRequest: (options, handler) async {
          final token = await secureStorage.read(key: AppConfig.accessTokenKey);
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },

        onResponse: (response, handler) => handler.next(response),

        // ── Auto-refresh saat 401 ─────────────────────────────────────────
        onError: (DioException e, handler) async {
          if (e.response?.statusCode != 401) {
            return handler.next(e);
          }

          // Hindari infinite loop: jangan refresh kalau request ini sendiri
          // adalah endpoint refresh/login
          final path = e.requestOptions.path;
          if (path.contains('/auth/refresh') || path.contains('/auth/login')) {
            return handler.next(e);
          }

          // Coba refresh token
          final refreshToken = await secureStorage.read(
            key: AppConfig.refreshTokenKey,
          );
          if (refreshToken == null || refreshToken.isEmpty) {
            return handler.next(e);
          }

          try {
            final refreshDio = Dio(BaseOptions(baseUrl: AppConfig.apiBaseUrl));
            final refreshRes = await refreshDio.post(
              '/auth/refresh',
              data: {'refreshToken': refreshToken},
            );

            if (refreshRes.statusCode == 200) {
              final newToken = refreshRes.data['data']['accessToken'] as String;
              await secureStorage.write(
                key: AppConfig.accessTokenKey,
                value: newToken,
              );

              // Retry request asal dengan token baru
              final opts = e.requestOptions;
              opts.headers['Authorization'] = 'Bearer $newToken';
              final retryRes = await dio.fetch(opts);
              return handler.resolve(retryRes);
            }
          } catch (_) {
            // Refresh gagal — biarkan error 401 naik ke UI
          }

          return handler.next(e);
        },
      ),
    );
  }
}
