import '../models/user_entity.dart';

/// Interface repository autentikasi.
abstract class AuthRepository {
  /// Login dengan nomor telepon dan password.
  /// Returns [UserEntity] jika berhasil.
  /// Throws [AuthException] jika gagal.
  Future<UserEntity> login({required String phone, required String password});

  /// Register warga, mahasiswa, atau petugas baru.
  Future<UserEntity> register({
    required String role,
    required Map<String, dynamic> data,
  });

  /// Meminta OTP untuk login/reset password
  Future<void> requestOtp({required String phone});

  /// Verifikasi OTP
  Future<UserEntity> verifyOtp({required String phone, required String otp});

  /// Logout — hapus token dari secure storage.
  Future<void> logout();

  /// Cek apakah user sudah login (access token tersimpan).
  Future<bool> isLoggedIn();

  /// Ambil data user yang sedang login dari local cache.
  Future<UserEntity?> getCurrentUser();

  /// Refresh access token menggunakan refresh token.
  /// Throws [AuthException] jika refresh token expired/invalid.
  Future<String> refreshAccessToken();

  /// Mengambil data profil terbaru dari server (GET /api/v1/auth/me)
  Future<UserEntity> fetchProfile();

  /// Mengunggah foto profil baru.
  Future<void> uploadAvatar(String imagePath);

  /// Request token untuk lupa kata sandi.
  Future<String?> forgotPassword({required String email});

  /// Reset kata sandi menggunakan token/kode verifikasi.
  Future<void> resetPassword({
    required String email,
    required String token,
    required String newPassword,
  });
}

/// Exception khusus untuk auth errors.
class AuthException implements Exception {
  const AuthException(this.code, [this.message]);

  final String code;
  final String? message;

  @override
  String toString() => 'AuthException($code): $message';
}
