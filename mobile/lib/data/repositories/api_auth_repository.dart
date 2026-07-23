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
///   POST /api/v1/auth/login        — phone + password → accessToken + refreshToken
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
    required String phone,
    required String password,
  }) async {
    apiClient.clearTokenCache();
    try {
      final response = await apiClient.dio.post(
        '/auth/login',
        data: {'phone': phone, 'password': password},
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
          'Format nomor telepon atau password tidak valid',
        );
      }
      if (status == 401) {
        throw const AuthException(
          'INVALID_CREDENTIALS',
          'Nomor telepon atau password salah',
        );
      }
      throw const AuthException('NETWORK_ERROR', 'Gagal terhubung ke server');
    } catch (e) {
      if (e is AuthException) rethrow;
      throw AuthException('UNKNOWN_ERROR', e.toString());
    }
  }

  // ─── Register ─────────────────────────────────────────────────────────────

  @override
  @override
  Future<UserEntity> register({
    required String role,
    required Map<String, dynamic> data,
  }) async {
    apiClient.clearTokenCache();
    try {
      String endpoint = '/auth/register/warga'; // Default
      if (role == 'Mahasiswa') endpoint = '/auth/register/mahasiswa-kkn';
      if (role == 'Petugas Residu' || role == 'Petugas') endpoint = '/auth/register/petugas-residu';
      
      final response = await apiClient.dio.post(
        endpoint,
        data: data,
      );
      if (response.statusCode == 201 || response.statusCode == 200) {
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

        // Langsung fetch householdId setelah register berhasil
        user = await _fetchAndAttachHousehold(user);

        return user;
      }

      throw const AuthException('REGISTER_FAILED', 'Registrasi gagal');
    } on DioException catch (e) {
      final status = e.response?.statusCode;
      final message = e.response?.data?['message']?.toString();
      if (status == 400) {
        throw AuthException(
          'VALIDATION_ERROR',
          message ?? 'Format data registrasi tidak valid',
        );
      }
      if (status == 409) {
        throw AuthException(
          'CONFLICT',
          message ?? 'Email atau NIK sudah terdaftar',
        );
      }
      throw const AuthException('NETWORK_ERROR', 'Gagal terhubung ke server');
    } catch (e) {
      if (e is AuthException) rethrow;
      throw AuthException('UNKNOWN_ERROR', e.toString());
    }
  }

  // ─── OTP (Login Warga / Reset Password) ────────────────────────────────────

  @override
  Future<void> requestOtp({required String phone}) async {
    try {
      final response = await apiClient.dio.post(
        '/auth/request-otp',
        data: {'phone': phone},
      );

      if (response.statusCode != 200 && response.statusCode != 201) {
        throw const AuthException('OTP_FAILED', 'Gagal meminta OTP');
      }
    } on DioException catch (_) {
      throw const AuthException('NETWORK_ERROR', 'Gagal terhubung ke server');
    } catch (e) {
      if (e is AuthException) rethrow;
      throw AuthException('UNKNOWN_ERROR', e.toString());
    }
  }

  @override
  Future<UserEntity> verifyOtp({required String phone, required String otp}) async {
    apiClient.clearTokenCache();
    try {
      final response = await apiClient.dio.post(
        '/auth/verify-otp',
        data: {'phone': phone, 'otp': otp},
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = response.data['data'] as Map<String, dynamic>;
        final userMap = data['user'] as Map<String, dynamic>;
        final accessToken = data['accessToken'] as String;
        final refreshToken = data['refreshToken'] as String;

        await Future.wait([
          secureStorage.write(key: AppConfig.accessTokenKey, value: accessToken),
          secureStorage.write(key: AppConfig.refreshTokenKey, value: refreshToken),
          secureStorage.write(key: AppConfig.userDataKey, value: jsonEncode(userMap)),
        ]);

        var user = _mapUser(userMap);
        user = await _fetchAndAttachHousehold(user);
        return user;
      }

      throw const AuthException('OTP_VERIFY_FAILED', 'Verifikasi OTP gagal');
    } on DioException catch (e) {
      final status = e.response?.statusCode;
      if (status == 400 || status == 401) {
        throw const AuthException('INVALID_OTP', 'Kode OTP salah atau sudah kadaluarsa');
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
    apiClient.clearTokenCache(); // Reset memory cache
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
    return _fetchAndAttachHousehold(const UserEntity(
      id: '',
      name: '',
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

  // ─── Upload Avatar ────────────────────────────────────────────────────────
  @override
  Future<void> uploadAvatar(String imagePath) async {
    try {
      final formData = FormData.fromMap({
        'avatar': await MultipartFile.fromFile(imagePath),
      });

      final response = await apiClient.dio.post(
        '/auth/upload-avatar',
        data: formData,
      );

      if (response.statusCode != 200) {
        throw const AuthException('UPLOAD_FAILED', 'Gagal mengunggah foto profil');
      }
    } on DioException catch (e) {
      if (e.response?.statusCode == 400) {
        throw const AuthException('BAD_REQUEST', 'Format file tidak didukung atau terlalu besar');
      }
      throw const AuthException('NETWORK_ERROR', 'Terjadi kesalahan jaringan');
    } catch (e) {
      throw AuthException('UNKNOWN_ERROR', 'Gagal memproses gambar: $e');
    }
  }

  @override
  Future<String?> forgotPassword({required String email}) async {
    try {
      final response = await apiClient.dio.post(
        '/auth/forgot-password',
        data: {'email': email},
      );

      if (response.statusCode == 200) {
        final data = response.data as Map<String, dynamic>;
        return data['token']?.toString();
      }
      throw const AuthException('FORGOT_PASSWORD_FAILED', 'Gagal memproses permintaan');
    } on DioException catch (e) {
      final status = e.response?.statusCode;
      final message = e.response?.data?['message']?.toString();
      if (status == 404) {
        throw AuthException('EMAIL_NOT_FOUND', message ?? 'Email tidak terdaftar');
      }
      throw const AuthException('NETWORK_ERROR', 'Gagal terhubung ke server');
    } catch (e) {
      if (e is AuthException) rethrow;
      throw AuthException('UNKNOWN_ERROR', e.toString());
    }
  }

  @override
  Future<void> resetPassword({
    required String email,
    required String token,
    required String newPassword,
  }) async {
    try {
      final response = await apiClient.dio.post(
        '/auth/reset-password',
        data: {
          'email': email,
          'token': token,
          'newPassword': newPassword,
        },
      );

      if (response.statusCode != 200) {
        throw const AuthException('RESET_PASSWORD_FAILED', 'Gagal menyetel ulang kata sandi');
      }
    } on DioException catch (e) {
      final status = e.response?.statusCode;
      final message = e.response?.data?['message']?.toString();
      if (status == 400) {
        throw AuthException('INVALID_TOKEN', message ?? 'Kode verifikasi salah atau kedaluwarsa');
      }
      throw const AuthException('NETWORK_ERROR', 'Gagal terhubung ke server');
    } catch (e) {
      if (e is AuthException) rethrow;
      throw AuthException('UNKNOWN_ERROR', e.toString());
    }
  }

  // ─── Helper ───────────────────────────────────────────────────────────────

  UserEntity _mapUser(Map<String, dynamic> userMap) {
    return UserEntity(
      id: userMap['id']?.toString() ?? '',
      name: userMap['name']?.toString() ?? '',
      phone: userMap['phone']?.toString() ?? '',
      role: UserRoleExtension.fromApi(userMap['role']?.toString() ?? 'WARGA'),
      fotoProfil: userMap['fotoProfil']?.toString(),
    );
  }
}
