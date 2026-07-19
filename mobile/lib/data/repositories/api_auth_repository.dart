/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import 'dart:convert';
import 'package:dio/dio.dart';
import '../../core/utils/safe_storage.dart';
import '../../../config/app_config.dart';
import '../../../domain/entities/user_entity.dart';
import '../../../domain/repositories/auth_repository.dart';
import '../network/api_client.dart';

/// Implementasi AuthRepository yang terhubung ke backend Express.js.
///
/// Endpoint yang digunakan:
///   POST /api/v1/auth/login        — email + password → accessToken + refreshToken
///   GET  /api/v1/households/me     — householdId warga (dipanggil setelah login)
///   POST /api/v1/auth/refresh      — refreshToken → accessToken baru
///   POST /api/v1/auth/logout       — invalidate refreshToken
class ApiAuthRepository implements AuthRepository {
  const ApiAuthRepository({
    required this.apiClient,
    required this.secureStorage,
  });

  final ApiClient apiClient;
  final SafeStorage secureStorage;

  // ─── Login ────────────────────────────────────────────────────────────────

  @override
  Future<UserEntity> login({
    required String nik,
    required String password,
  }) async {
    try {
      final response = await apiClient.dio.post(
        '/auth/login',
        data: {'email': nik, 'password': password}, // Backend menerima field 'email' yang berisi email/NIK
      );

      if (response.statusCode == 200) {
        final data = response.data['data'] as Map<String, dynamic>;
        final userMap = data['user'] as Map<String, dynamic>;
        final accessToken = data['accessToken'] as String;
        final refreshToken = data['refreshToken'] as String;

        // Simpan token ke secure storage
        await Future.wait([
          secureStorage.write(
            key: AppConfig.accessTokenKey,
            value: accessToken,
          ),
          secureStorage.write(
            key: AppConfig.refreshTokenKey,
            value: refreshToken,
          ),
          secureStorage.write(
            key: AppConfig.userDataKey,
            value: jsonEncode(userMap),
          ),
        ]);

        var user = _mapUser(userMap);

        // Langsung fetch householdId setelah login berhasil
        user = await _fetchAndAttachHousehold(user);

        return user;
      }

      throw const AuthException('LOGIN_FAILED', 'Login gagal');
    } on DioException catch (e) {
      final status = e.response?.statusCode;
      if (status == 400) {
        throw const AuthException(
          'VALIDATION_ERROR',
          'Format email atau password tidak valid',
        );
      }
      if (status == 401) {
        throw const AuthException(
          'INVALID_CREDENTIALS',
          'Email atau password salah',
        );
      }
      throw const AuthException('NETWORK_ERROR', 'Gagal terhubung ke server');
    } catch (e) {
      if (e is AuthException) rethrow;
      throw AuthException('UNKNOWN_ERROR', e.toString());
    }
  }

  // ─── Logout ───────────────────────────────────────────────────────────────

  @override
  Future<void> logout() async {
    try {
      final refreshToken = await secureStorage.read(
        key: AppConfig.refreshTokenKey,
      );
      if (refreshToken != null) {
        await apiClient.dio.post(
          '/auth/logout',
          data: {'refreshToken': refreshToken},
        );
      }
    } catch (_) {
      // Tetap lanjut logout lokal meskipun network gagal
    } finally {
      await Future.wait([
        secureStorage.delete(key: AppConfig.accessTokenKey),
        secureStorage.delete(key: AppConfig.refreshTokenKey),
        secureStorage.delete(key: AppConfig.userDataKey),
        secureStorage.delete(key: AppConfig.householdIdKey),
      ]);
    }
  }

  // ─── isLoggedIn ───────────────────────────────────────────────────────────

  @override
  Future<bool> isLoggedIn() async {
    final token = await secureStorage.read(key: AppConfig.accessTokenKey);
    return token != null && token.isNotEmpty;
  }

  // ─── getCurrentUser ───────────────────────────────────────────────────────

  @override
  Future<UserEntity?> getCurrentUser() async {
    final token = await secureStorage.read(key: AppConfig.accessTokenKey);
    if (token == null || token.isEmpty) return null;

    final userDataStr = await secureStorage.read(key: AppConfig.userDataKey);
    if (userDataStr == null) return null;

    try {
      final userMap = jsonDecode(userDataStr) as Map<String, dynamic>;
      var user = _mapUser(userMap);

      // Attach householdId dari cache
      final cachedHouseholdId = await secureStorage.read(
        key: AppConfig.householdIdKey,
      );
      if (cachedHouseholdId != null && cachedHouseholdId.isNotEmpty) {
        user = user.copyWith(householdId: cachedHouseholdId);
      }

      return user;
    } catch (_) {
      return null;
    }
  }

  // ─── refreshAccessToken ───────────────────────────────────────────────────

  @override
  Future<String> refreshAccessToken() async {
    final refreshToken = await secureStorage.read(
      key: AppConfig.refreshTokenKey,
    );
    if (refreshToken == null || refreshToken.isEmpty) {
      throw const AuthException('NO_REFRESH_TOKEN', 'Refresh token tidak ada');
    }

    try {
      final response = await apiClient.dio.post(
        '/auth/refresh',
        data: {'refreshToken': refreshToken},
      );

      if (response.statusCode == 200) {
        final newAccessToken = response.data['data']['accessToken'] as String;
        await secureStorage.write(
          key: AppConfig.accessTokenKey,
          value: newAccessToken,
        );
        return newAccessToken;
      }
      throw const AuthException('REFRESH_FAILED', 'Gagal memperbarui token');
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        await logout();
        throw const AuthException(
          'TOKEN_EXPIRED',
          'Sesi habis, silakan login kembali',
        );
      }
      throw const AuthException('NETWORK_ERROR', 'Gagal terhubung ke server');
    }
  }

  // ─── Private: fetch household setelah login ───────────────────────────────

  /// GET /api/v1/households/me → ambil householdId + rtRw + kelurahan
  /// dari household pertama milik user.
  Future<UserEntity> _fetchAndAttachHousehold(UserEntity user) async {
    try {
      final response = await apiClient.dio.get('/households/me');
      if (response.statusCode == 200) {
        final List<dynamic> data =
            response.data['data'] as List<dynamic>? ?? [];
        if (data.isNotEmpty) {
          final hh = data.first as Map<String, dynamic>;
          final householdId = hh['id']?.toString() ?? '';
          
          String rtRw = '';
          String kelurahan = '';
          
          if (hh['rtRw'] is Map) {
            final rtRwMap = hh['rtRw'] as Map<String, dynamic>;
            rtRw = rtRwMap['name']?.toString() ?? '';
            if (rtRwMap['kelurahan'] is Map) {
              final kelMap = rtRwMap['kelurahan'] as Map<String, dynamic>;
              kelurahan = kelMap['name']?.toString() ?? '';
            }
          }

          if (householdId.isNotEmpty) {
            await secureStorage.write(
              key: AppConfig.householdIdKey,
              value: householdId,
            );
            return user.copyWith(
              householdId: householdId,
              rtRw: rtRw,
              kelurahan: kelurahan,
            );
          }
        }
      }
    } catch (_) {
      // Tidak fatal — warga baru mungkin belum punya household
    }
    return user;
  }

  // ─── Fetch Profile ────────────────────────────────────────────────────────
  @override
  Future<UserEntity> fetchProfile() {
    return _fetchAndAttachHousehold(UserEntity(
      id: '',
      name: '',
      email: '',
      role: UserRole.warga,
    )).then((user) async {
      // Tunggu, kalau backend ada endpoint `/api/v1/auth/me`, kita panggil itu.
      try {
        final response = await apiClient.dio.get('/auth/me');
        if (response.statusCode == 200) {
          final data = response.data['data']['user'] as Map<String, dynamic>;
          var mappedUser = _mapUser(data);
          // Tetap perlu memanggil /households/me jika auth/me tidak return householdId
          return _fetchAndAttachHousehold(mappedUser);
        }
      } on DioException catch (e) {
        throw AuthException('FETCH_FAILED', e.message);
      } catch (e) {
        throw AuthException('FETCH_FAILED', e.toString());
      }
      throw const AuthException('UNKNOWN', 'Gagal memuat profil');
    });
  }

  // ─── Helper ───────────────────────────────────────────────────────────────

  UserEntity _mapUser(Map<String, dynamic> userMap) {
    return UserEntity(
      id: userMap['id']?.toString() ?? '',
      name: userMap['name']?.toString() ?? '',
      email: userMap['email']?.toString() ?? '',
      nik: userMap['nik']?.toString(),
      role: UserRoleExtension.fromApi(userMap['role']?.toString() ?? 'WARGA'),
    );
  }
}
