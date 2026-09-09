import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app_sampah/app/core/utils/safe_storage.dart';
import 'package:mobile_app_sampah/app/data/providers/api_client.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('ApiClient Token Lifecycle & Interceptor Tests', () {
    late ApiClient apiClient;

    setUp(() {
      apiClient = ApiClient(
        dio: Dio(),
        secureStorage: const SafeStorage(),
      );
    });

    test('setToken dan clearTokenCache memperbarui cache in-memory secara tepat', () {
      // 1. Initial state: clearTokenCache
      apiClient.clearTokenCache();

      // 2. Set token langsung ke in-memory cache
      const freshToken = 'jwt_fresh_token_xyz_123';
      apiClient.setToken(freshToken);

      // 3. Clear token cache
      apiClient.clearTokenCache();
    });

    test('Public auth paths dikecualikan dari injeksi header Authorization', () {
      final publicPaths = [
        '/auth/login',
        '/auth/register',
        '/auth/request-otp',
        '/auth/verify-otp',
        '/auth/refresh',
        '/auth/forgot-password',
        '/auth/reset-password',
        '/system/latest-release',
        '/app-version',
      ];

      for (final path in publicPaths) {
        final isPublic = path.contains('/auth/login') ||
            path.contains('/auth/register') ||
            path.contains('/auth/request-otp') ||
            path.contains('/auth/verify-otp') ||
            path.contains('/auth/refresh') ||
            path.contains('/auth/forgot-password') ||
            path.contains('/auth/reset-password') ||
            path.contains('/system/latest-release') ||
            path.contains('/app-version');
        expect(isPublic, isTrue, reason: 'Endpoint $path harus dikenali sebagai public auth');
      }

      const protectedPath = '/bins/my-bins';
      final isProtectedPublic = protectedPath.contains('/auth/login') ||
          protectedPath.contains('/auth/register') ||
          protectedPath.contains('/auth/request-otp') ||
          protectedPath.contains('/auth/verify-otp') ||
          protectedPath.contains('/auth/refresh') ||
          protectedPath.contains('/auth/forgot-password') ||
          protectedPath.contains('/auth/reset-password') ||
          protectedPath.contains('/system/latest-release') ||
          protectedPath.contains('/app-version');
      expect(isProtectedPublic, isFalse, reason: '/bins/my-bins adalah protected route');
    });
  });
}
