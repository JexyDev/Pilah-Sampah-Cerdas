import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../../domain/entities/user_entity.dart';
import '../../../domain/repositories/auth_repository.dart';
import '../network/api_client.dart';

/// Implementasi AuthRepository menggunakan API backend pilahsampah.id
/// Contract: POST /auth/login → { message, data: { user: { id, name, email, role }, accessToken, refreshToken } }
class ApiAuthRepository implements AuthRepository {
  final ApiClient apiClient;
  final FlutterSecureStorage secureStorage;

  ApiAuthRepository({required this.apiClient, required this.secureStorage});

  @override
  Future<UserEntity> login({required String nik, required String password}) async {
    try {
      // Backend menerima 'email' bukan 'nik'
      final response = await apiClient.dio.post('/auth/login', data: {
        'email': nik, // nik field di UI dipakai sebagai email
        'password': password,
      });

      // Backend returns: { message: "...", data: { user: {...}, accessToken: "...", refreshToken: "..." } }
      final responseData = response.data;
      if (response.statusCode == 200 && responseData['data'] != null) {
        final data = responseData['data'];
        final userMap = data['user'];
        final accessToken = data['accessToken'];
        final refreshToken = data['refreshToken'];

        // Simpan token ke secure storage
        await secureStorage.write(key: 'jwt_token', value: accessToken);
        if (refreshToken != null) {
          await secureStorage.write(key: 'refresh_token', value: refreshToken);
        }

        // Simpan data user
        await secureStorage.write(key: 'user_data', value: jsonEncode(userMap));

        return _mapUserEntity(userMap);
      } else {
        throw const AuthException('LOGIN_FAILED', 'Login gagal, periksa Email/Password');
      }
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        throw const AuthException('INVALID_CREDENTIALS', 'Email atau Password salah');
      }
      if (e.response?.statusCode == 400) {
        throw const AuthException('VALIDATION_ERROR', 'Format email tidak valid');
      }
      throw const AuthException('NETWORK_ERROR', 'Terjadi kesalahan jaringan, periksa koneksi Anda');
    } catch (e) {
      if (e is AuthException) rethrow;
      throw AuthException('UNKNOWN_ERROR', e.toString());
    }
  }

  @override
  Future<void> logout() async {
    try {
      final refreshToken = await secureStorage.read(key: 'refresh_token');
      if (refreshToken != null) {
        await apiClient.dio.post('/auth/logout', data: {'refreshToken': refreshToken});
      }
    } catch (_) {
      // Abaikan error saat logout — hapus token lokal tetap wajib
    } finally {
      await secureStorage.delete(key: 'jwt_token');
      await secureStorage.delete(key: 'refresh_token');
      await secureStorage.delete(key: 'user_data');
    }
  }

  @override
  Future<bool> isLoggedIn() async {
    final token = await secureStorage.read(key: 'jwt_token');
    return token != null;
  }

  @override
  Future<UserEntity?> getCurrentUser() async {
    final token = await secureStorage.read(key: 'jwt_token');
    if (token == null) return null;

    final userDataStr = await secureStorage.read(key: 'user_data');
    if (userDataStr == null) return null;

    try {
      final userMap = jsonDecode(userDataStr) as Map<String, dynamic>;
      return _mapUserEntity(userMap);
    } catch (_) {
      return null;
    }
  }

  /// Map backend user object ke domain entity
  /// Backend returns: { id, name, email, role }
  UserEntity _mapUserEntity(Map<String, dynamic> userMap) {
    final role = userMap['role'] as String? ?? 'WARGA';
    return UserEntity(
      id: userMap['id'] as String? ?? '',
      nik: userMap['email'] as String? ?? '',  // gunakan email sebagai identifier
      name: userMap['name'] as String? ?? '',
      role: role == 'ADMIN' ? UserRole.admin : UserRole.warga,
      kelurahan: 'Coblong',
      rtRw: role == 'WARGA' ? 'RT 01/RW 01' : '-',
    );
  }
}
