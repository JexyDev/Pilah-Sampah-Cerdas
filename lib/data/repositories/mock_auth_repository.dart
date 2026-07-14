import '../../domain/entities/user_entity.dart';
import '../../domain/repositories/auth_repository.dart';
import '../mock/mock_data.dart';

/// Mock implementasi AuthRepository.
/// Semua operasi bersifat lokal tanpa network call.
class MockAuthRepository implements AuthRepository {
  bool _isLoggedIn = false;
  UserEntity? _currentUser;

  @override
  Future<UserEntity> login({
    required String nik,
    required String password,
  }) async {
    // Simulasi network delay
    await Future.delayed(const Duration(milliseconds: 800));

    // Validasi: NIK harus 16 digit
    if (nik.length != 16) {
      throw const AuthException('INVALID_CREDENTIALS', 'NIK harus 16 digit.');
    }

    // Validasi mock credential
    final bool isValidNik = nik == MockData.currentUser.nik;
    final bool isValidPassword = password == MockData.mockPassword;

    if (!isValidNik || !isValidPassword) {
      throw const AuthException(
        'INVALID_CREDENTIALS',
        'NIK atau kata sandi salah.',
      );
    }

    _isLoggedIn = true;
    _currentUser = MockData.currentUser;
    return MockData.currentUser;
  }

  @override
  Future<void> logout() async {
    await Future.delayed(const Duration(milliseconds: 300));
    _isLoggedIn = false;
    _currentUser = null;
  }

  @override
  Future<bool> isLoggedIn() async {
    await Future.delayed(const Duration(milliseconds: 100));
    return _isLoggedIn;
  }

  @override
  Future<UserEntity?> getCurrentUser() async {
    return _currentUser;
  }
}
