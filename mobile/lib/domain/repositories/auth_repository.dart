import '../entities/user_entity.dart';

/// Interface repository autentikasi.
/// Implementasi: MockAuthRepository (data layer).
abstract class AuthRepository {
  /// Login dengan NIK dan password.
  /// Returns [UserEntity] jika berhasil.
  /// Throws [AuthException] jika gagal.
  Future<UserEntity> login({required String nik, required String password});

  /// Logout — hapus token dari secure storage.
  Future<void> logout();

  /// Cek apakah user sudah login (token masih valid).
  Future<bool> isLoggedIn();

  /// Ambil data user yang sedang login dari local cache.
  Future<UserEntity?> getCurrentUser();
}

/// Exception khusus untuk auth errors.
class AuthException implements Exception {
  const AuthException(this.code, [this.message]);

  final String code;
  final String? message;

  @override
  String toString() => 'AuthException($code): $message';
}
