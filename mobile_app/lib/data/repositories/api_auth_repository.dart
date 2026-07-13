import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../../domain/entities/user_entity.dart';
import '../../../domain/repositories/auth_repository.dart';
import '../network/api_client.dart';

class ApiAuthRepository implements AuthRepository {
  final ApiClient apiClient;
  final FlutterSecureStorage secureStorage;

  ApiAuthRepository({required this.apiClient, required this.secureStorage});

  @override
  Future<UserEntity> login({required String nik, required String password}) async {
    try {
      final response = await apiClient.dio.post('/auth/login', data: {
        'nik': nik,
        'password': password,
      });

      if (response.statusCode == 200 && response.data['status'] == 'success') {
        final data = response.data['data'];
        final userMap = data['user'];
        final token = data['token'];

        await secureStorage.write(key: 'jwt_token', value: token);
        await secureStorage.write(key: 'user_data', value: userMap.toString());

        return UserEntity(
          id: userMap['userId'],
          nik: userMap['nik'],
          name: userMap['nama'],
          role: userMap['peran'] == 'Admin' ? UserRole.admin : UserRole.warga,
          kelurahan: userMap['wilayah'] ?? 'Coblong',
          rtRw: userMap['rtRw'] ?? 'RT 01/RW 01',
        );
      } else {
        throw const AuthException('LOGIN_FAILED', 'Gagal login, periksa NIK/Password');
      }
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        throw const AuthException('INVALID_CREDENTIALS', 'NIK atau Password salah');
      }
      throw const AuthException('NETWORK_ERROR', 'Terjadi kesalahan jaringan');
    } catch (e) {
      throw AuthException('UNKNOWN_ERROR', e.toString());
    }
  }

  @override
  Future<void> logout() async {
    await secureStorage.delete(key: 'jwt_token');
    await secureStorage.delete(key: 'user_data');
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
    
    return const UserEntity(
      id: 'USR-123',
      nik: '3273012345678901',
      name: 'Budi Antoro',
      role: UserRole.warga,
      kelurahan: 'Coblong',
      rtRw: 'RT 01/RW 01',
    );
  }
}
