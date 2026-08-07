import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import '../../core/utils/safe_storage.dart';
import '../../core/utils/image_compressor.dart';
import '../../core/utils/phone_formatter.dart';
import '../../core/values/app_config.dart';
import '../models/user_entity.dart';
import 'auth_repository.dart';
import '../providers/api_client.dart';

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
    final cleanPhone = PhoneFormatter.prepareLoginPhoneInput(phone);
    try {
      final response = await apiClient.dio.post(
        '/auth/login',
        data: {'phone': cleanPhone, 'password': password},
      );

      if (response.statusCode == 200) {
        final data = response.data['data'] as Map<String, dynamic>;
        final userMap = data['user'] as Map<String, dynamic>;
        final accessToken = data['accessToken'] as String;
        final refreshToken = data['refreshToken'] as String;

        // DEBUG: lihat apa yang backend kirim saat login
        debugPrint('[DEBUG LOGIN] userMap keys=${userMap.keys.toList()}');
        debugPrint('[DEBUG LOGIN] userMap=$userMap');

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

        // Untuk warga: fetch household (householdId, rw, kelurahan)
        // Untuk mahasiswa/petugas: baca dari local storage dulu
        if (user.role == UserRole.warga) {
          user = await _fetchAndAttachHousehold(user);
        } else if (user.role == UserRole.mahasiswaKkn) {
          // Cek apakah login response sudah ada kelurahan/rw
          if (user.kelurahan.isEmpty || user.rw.isEmpty) {
            // Baca dari local storage yang mungkin sudah disimpan sebelumnya
            final localKec = await secureStorage.read(key: AppConfig.mahasiswaKecamatanKey);
            final localKel = await secureStorage.read(key: AppConfig.mahasiswaKelurahanKey);
            final localRt = await secureStorage.read(key: AppConfig.mahasiswaRwKey);
            if ((localKel != null && localKel.isNotEmpty) ||
                (localRt != null && localRt.isNotEmpty) ||
                (localKec != null && localKec.isNotEmpty)) {
              user = user.copyWith(
                kecamatan: localKec?.isNotEmpty == true ? localKec! : user.kecamatan,
                kelurahan: localKel?.isNotEmpty == true ? localKel! : user.kelurahan,
                rw: localRt?.isNotEmpty == true ? localRt! : user.rw,
              );
            }
          }
        }

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
      final message = e.response?.data?['message']?.toString();
      
      if (status == 401) {
        if (message != null && message.toLowerCase().contains('approve')) {
          throw AuthException(
            'UNAPPROVED_ACCOUNT',
            message,
          );
        }
        throw const AuthException(
          'INVALID_CREDENTIALS',
          'Nomor telepon atau password salah',
        );
      }
      
      if (status == 403) {
        throw AuthException(
          'UNAPPROVED_ACCOUNT',
          message ?? 'Akun Anda sedang menunggu persetujuan (approval) dari pihak Admin. Silakan coba login kembali nanti.',
        );
      }
      if (status == 429) {
        throw AuthException(
          'TOO_MANY_REQUESTS',
          message ?? 'Terlalu banyak percobaan login gagal. Silakan tunggu 15 menit.',
        );
      }
      
      if (status != null && status >= 500) {
        if (message != null && (message.toLowerCase().contains('approve') || message.toLowerCase().contains('izin') || message.toLowerCase().contains('tunggu') || message.toLowerCase().contains('setuju'))) {
          throw AuthException(
            'UNAPPROVED_ACCOUNT',
            message,
          );
        }
        throw AuthException(
          'SERVER_ERROR',
          message ?? 'Server sedang mengalami gangguan (Error $status). Silakan coba lagi nanti.',
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
        
        if (role == 'Mahasiswa' || role == 'Petugas Residu' || role == 'Petugas') {
          return UserEntity(
            id: data['id']?.toString() ?? '',
            name: data['name']?.toString() ?? '',
            role: role == 'Mahasiswa' ? UserRole.mahasiswaKkn : UserRole.petugasResidu,
          );
        }

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
      // Hanya panggil endpoint backend Express (menggunakan format 08)
      // Backend yang akan men-generate OTP dan mengirimkannya via Fonnte.
      final backendPhone = PhoneFormatter.prepareLoginPhoneInput(phone);
      await apiClient.dio.post('/auth/request-otp', data: {'phone': backendPhone});
    } on DioException catch (e) {
      final message = e.response?.data?['message']?.toString();
      throw AuthException('OTP_FAILED', message ?? 'Gagal meminta kode OTP');
    } catch (e) {
      if (e is AuthException) rethrow;
      throw AuthException('UNKNOWN_ERROR', e.toString());
    }
  }

  @override
  Future<UserEntity> verifyOtp({required String phone, required String otp}) async {
    apiClient.clearTokenCache();
    final cleanPhone = PhoneFormatter.prepareLoginPhoneInput(phone);

    // Bypass kode khusus dev
    if (kDebugMode && (otp == '123456' || otp == '000000')) {
      return UserEntity(
        id: 'temp_otp_user',
        name: 'User',
        email: '',
        phone: cleanPhone,
        role: UserRole.warga,
      );
    }
    
    try {
      final response = await apiClient.dio.post(
        '/auth/verify-otp',
        data: {'phone': cleanPhone, 'otp': otp},
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

      // Jika berhasil tapi responsnya tidak sesuai format normal, tetap kembalikan fallback
      return UserEntity(
        id: 'temp_otp_user',
        name: 'User',
        email: '',
        phone: cleanPhone,
        role: UserRole.warga,
      );
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

      // Attach householdId dari cache (untuk warga)
      final cachedHouseholdId = await secureStorage.read(
        key: AppConfig.householdIdKey,
      );
      if (cachedHouseholdId != null && cachedHouseholdId.isNotEmpty) {
        user = user.copyWith(householdId: cachedHouseholdId);
      }

      // Untuk mahasiswa KKN: baca kelurahan & rw dari local storage
      if (user.role == UserRole.mahasiswaKkn) {
        final cachedKec = await secureStorage.read(key: AppConfig.mahasiswaKecamatanKey);
        final cachedKel = await secureStorage.read(key: AppConfig.mahasiswaKelurahanKey);
        final cachedRt = await secureStorage.read(key: AppConfig.mahasiswaRwKey);
        final hasLocalRegion = (cachedKel != null && cachedKel.isNotEmpty) ||
                               (cachedRt != null && cachedRt.isNotEmpty) ||
                               (cachedKec != null && cachedKec.isNotEmpty);
        if (hasLocalRegion) {
          user = user.copyWith(
            kecamatan: cachedKec?.isNotEmpty == true ? cachedKec! : user.kecamatan,
            kelurahan: cachedKel?.isNotEmpty == true ? cachedKel! : user.kelurahan,
            rw: cachedRt?.isNotEmpty == true ? cachedRt! : user.rw,
          );
        } else if (user.kelurahan.isEmpty || user.rw.isEmpty) {
          // Fallback ke API hanya jika lokal belum ada
          user = await _fetchProfileMe(user);
        }
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

  /// GET /api/v1/households/me → ambil householdId + rw + kelurahan
  /// dari household pertama milik user.
  Future<UserEntity> _fetchAndAttachHousehold(UserEntity user) async {
    // Household ID khusus untuk role Warga. Hindari memanggil endpoint ini untuk role lain agar tidak terkena 401/403.
    if (user.role != UserRole.warga) return user;
    
    try {
      final response = await apiClient.dio.get('/households/me');
      if (response.statusCode == 200) {
        final List<dynamic> data =
            response.data['data'] as List<dynamic>? ?? [];
        if (data.isNotEmpty) {
          final hh = data.first as Map<String, dynamic>;
          final householdId = hh['id']?.toString() ?? '';
          
          String rw = '';
          String kelurahan = '';
          
          if (hh['rw'] is Map) {
            final rtRwMap = hh['rw'] as Map<String, dynamic>;
            rw = rtRwMap['name']?.toString() ?? '';
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
              rw: rw,
              kecamatan: user.kecamatan,
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
      // Auto-compress avatar before upload (Target < 300KB, max 512x512)
      final compressedImagePath = await ImageCompressor.compressImage(
        imagePath,
        maxSizeBytes: 300 * 1024,
        maxWidth: 512,
        maxHeight: 512,
      );

      final formData = FormData.fromMap({
        'avatar': await MultipartFile.fromFile(compressedImagePath),
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
    final cleanPhone = PhoneFormatter.prepareLoginPhoneInput(email);
    try {
      final response = await apiClient.dio.post(
        '/auth/reset-password',
        data: {
          'phone': cleanPhone,
          'email': cleanPhone,
          'token': token,
          'otp': token,
          'newPassword': newPassword,
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        return;
      }
      throw const AuthException('RESET_PASSWORD_FAILED', 'Gagal menyetel ulang kata sandi');
    } on DioException catch (e) {
      final status = e.response?.statusCode;
      final message = e.response?.data?['message']?.toString();
      if (status == 404) {
        throw AuthException('USER_NOT_FOUND', message ?? 'Nomor telepon tidak terdaftar di sistem');
      }
      if (status == 400) {
        throw AuthException('INVALID_TOKEN', message ?? 'Kode verifikasi salah atau kedaluwarsa');
      }
      throw AuthException('RESET_PASSWORD_FAILED', message ?? 'Gagal menyetel ulang kata sandi');
    } catch (e) {
      if (e is AuthException) rethrow;
      throw AuthException('UNKNOWN_ERROR', e.toString());
    }
  }

  @override
  Future<bool> changePassword({
    required String oldPassword,
    required String newPassword,
  }) async {
    try {
      final response = await apiClient.dio.post(
        '/auth/change-password',
        data: {
          'oldPassword': oldPassword,
          'newPassword': newPassword,
        },
      );
      if (response.statusCode == 200 || response.statusCode == 201) {
        return true;
      }
      throw const AuthException('CHANGE_PASSWORD_FAILED', 'Gagal mengubah kata sandi');
    } on DioException catch (e) {
      final status = e.response?.statusCode;
      final message = e.response?.data?['message']?.toString();
      if (status == 400) {
        throw AuthException('WRONG_OLD_PASSWORD', message ?? 'Kata sandi lama Anda salah');
      }
      throw AuthException('CHANGE_PASSWORD_FAILED', message ?? 'Gagal mengubah kata sandi');
    } catch (e) {
      if (e is AuthException) rethrow;
      throw AuthException('UNKNOWN_ERROR', e.toString());
    }
  }

  // ─── Helper ───────────────────────────────────────────────────────────────

  UserEntity _mapUser(Map<String, dynamic> userMap) {
    // Ekstrak kelurahan & rw dari berbagai kemungkinan struktur response:
    // - Flat: {'kelurahan': 'Bojongsoang', 'rw': '01/02'}
    // - Nested via rw object: {'rw': {'name': '01/02', 'kelurahan': {'name': 'Bojongsoang'}}}
    // - Nested via kelompok KKN: {'kelompokKkn': {'kelurahan': ..., 'rw': ...}}
    String kelurahan = '';
    String rw = '';

    // 1. Coba flat field langsung
    kelurahan = userMap['kelurahan']?.toString() ?? '';
    rw = userMap['rw']?.toString() ?? '';

    // 2. Jika rw adalah object nested (seperti struktur warga)
    if (rw.isEmpty && userMap['rw'] is Map) {
      final rtRwMap = userMap['rw'] as Map<String, dynamic>;
      rw = rtRwMap['name']?.toString() ?? '';
      if (kelurahan.isEmpty && rtRwMap['kelurahan'] is Map) {
        final kelMap = rtRwMap['kelurahan'] as Map<String, dynamic>;
        kelurahan = kelMap['name']?.toString() ?? '';
      } else if (kelurahan.isEmpty) {
        kelurahan = rtRwMap['kelurahan']?.toString() ?? '';
      }
    }

    // 3. Coba dari studentProfile (response backend VPS /users & /auth/me yang baru di-deploy)
    final sp = userMap['studentProfile'] is Map ? (userMap['studentProfile'] as Map<String, dynamic>) : null;
    if (sp != null) {
      if (kelurahan.isEmpty) kelurahan = sp['kelurahan']?.toString() ?? sp['penugasanKelurahan']?.toString() ?? sp['kelompok']?['kelurahan']?.toString() ?? '';
      if (rw.isEmpty) {
        if (sp['rw'] != null) {
          rw = sp['rw'].toString();
        } else if (sp['penugasanRt'] != null && sp['penugasanRw'] != null) {
          rw = '${sp['penugasanRt']}/${sp['penugasanRw']}';
        } else if (sp['kelompok']?['rw'] != null) {
          rw = sp['kelompok']['rw'].toString();
        }
      }
    }

    // 4. Coba dari kelompokKkn (struktur mahasiswa KKN)
    if ((kelurahan.isEmpty || rw.isEmpty) && userMap['kelompokKkn'] is Map) {
      final kkn = userMap['kelompokKkn'] as Map<String, dynamic>;
      if (kelurahan.isEmpty) kelurahan = kkn['kelurahan']?.toString() ?? '';
      if (rw.isEmpty) rw = kkn['rw']?.toString() ?? '';
    }

    // 5. Coba dari profile nested
    if ((kelurahan.isEmpty || rw.isEmpty) && userMap['profile'] is Map) {
      final profile = userMap['profile'] as Map<String, dynamic>;
      if (kelurahan.isEmpty) kelurahan = profile['kelurahan']?.toString() ?? '';
      if (rw.isEmpty) rw = profile['rw']?.toString() ?? '';
    }

    final String nim = userMap['nim']?.toString() ?? sp?['nim']?.toString() ?? userMap['profile']?['nim']?.toString() ?? '';
    final String prodi = userMap['prodi']?.toString() ?? sp?['prodi']?.toString() ?? userMap['jurusan']?.toString() ?? sp?['jurusan']?.toString() ?? userMap['profile']?['prodi']?.toString() ?? userMap['profile']?['jurusan']?.toString() ?? '';
    final String jurusan = userMap['jurusan']?.toString() ?? sp?['jurusan']?.toString() ?? userMap['prodi']?.toString() ?? sp?['prodi']?.toString() ?? userMap['profile']?['jurusan']?.toString() ?? userMap['profile']?['prodi']?.toString() ?? '';
    final String fakultas = userMap['fakultas']?.toString() ?? sp?['fakultas']?.toString() ?? userMap['profile']?['fakultas']?.toString() ?? '';
    final String universitas = userMap['universitas']?.toString() ?? sp?['universitas']?.toString() ?? userMap['profile']?['universitas']?.toString() ?? '';

    return UserEntity(
      id: userMap['id']?.toString() ?? '',
      name: userMap['name']?.toString() ?? '',
      phone: userMap['phone']?.toString() ?? '',
      email: userMap['email']?.toString(),
      role: UserRoleExtension.fromApi(userMap['role']?.toString() ?? 'WARGA'),
      fotoProfil: userMap['fotoProfil']?.toString(),
      kecamatan: userMap['kecamatan']?.toString() ?? '',
      kelurahan: userMap['kelurahan']?.toString() ?? '',
      rw: rw,
      nim: nim,
      jurusan: jurusan,
      prodi: prodi,
      fakultas: fakultas,
      universitas: universitas,
    );
  }

  /// Fetch data wilayah mahasiswa dari /auth/me atau fallback ke /kkn/kelompok/me.
  /// Backend /auth/me tidak return kelurahan/rw, tapi /kkn/kelompok/me punya poskoLocation.
  Future<UserEntity> _fetchProfileMe(UserEntity user) async {
    // Coba /auth/me dulu (siapa tahu backend nanti update untuk return wilayah)
    try {
      final response = await apiClient.dio.get('/auth/me');
      debugPrint('[DEBUG /auth/me] status=${response.statusCode} data=${response.data}');
      if (response.statusCode == 200) {
        // Backend return {success, message, user: {...}} — bukan {data: {...}}
        final rawData = response.data;
        Map<String, dynamic> userMap = {};
        if (rawData is Map) {
          // Coba key 'user' langsung
          if (rawData['user'] is Map) {
            userMap = rawData['user'] as Map<String, dynamic>;
          } else if (rawData['data'] is Map) {
            final d = rawData['data'] as Map<String, dynamic>;
            userMap = d['user'] is Map ? d['user'] as Map<String, dynamic> : d;
          }
        }
        debugPrint('[DEBUG /auth/me] userMap=$userMap');
        if (userMap.isNotEmpty) {
          final fetched = _mapUser(userMap);
          if (fetched.kelurahan.isNotEmpty && fetched.rw.isNotEmpty) {
            debugPrint('[DEBUG /auth/me] Got kelurahan=${fetched.kelurahan} rw=${fetched.rw}');
            return user.copyWith(
              kecamatan: userMap['kecamatan']?.toString() ?? '',
              kelurahan: fetched.kelurahan,
              rw: fetched.rw,
            );
          }
        }
      }
    } catch (e) {
      debugPrint('[DEBUG /auth/me] ERROR: $e');
    }

    // Fallback: ambil dari /kkn/kelompok/me yang punya poskoLocation
    try {
      final kelompokResp = await apiClient.dio.get('/kkn/kelompok/me');
      debugPrint('[DEBUG /kkn/kelompok/me] status=${kelompokResp.statusCode} data=${kelompokResp.data}');
      if (kelompokResp.statusCode == 200) {
        final data = kelompokResp.data;
        Map<String, dynamic> kelompokData = {};
        if (data is Map && data['data'] is Map) {
          kelompokData = data['data'] as Map<String, dynamic>;
        } else if (data is Map) {
          kelompokData = data as Map<String, dynamic>;
        }

        // Coba field kelurahan & rw langsung
        String kel = kelompokData['kelurahan']?.toString() ?? '';
        String rt = kelompokData['rw']?.toString() ?? '';

        // Parse dari poskoLocation: "Kel. Bojongsoang RT 03 / RW 08"
        if ((kel.isEmpty || rt.isEmpty) && kelompokData['poskoLocation'] is String) {
          final posko = kelompokData['poskoLocation'] as String;
          debugPrint('[DEBUG kelompok] poskoLocation=$posko');
          // Extract kelurahan: teks setelah 'Kel.' atau sebelum 'RT'
          final kelMatch = RegExp(r'Kel\.\s*([\w\s]+?)(?:\s+RT|\s*$)', caseSensitive: false).firstMatch(posko);
          if (kelMatch != null && kel.isEmpty) kel = kelMatch.group(1)?.trim() ?? '';
          // Extract RT/RW: format 'RT XX / RW YY' atau 'XX/YY'
          final rtMatch = RegExp(r'RT\s*(\d+)\s*/\s*RW\s*(\d+)', caseSensitive: false).firstMatch(posko);
          if (rtMatch != null && rt.isEmpty) rt = '${rtMatch.group(1)?.padLeft(2,'0')}/${rtMatch.group(2)?.padLeft(2,'0')}';
        }

        debugPrint('[DEBUG kelompok] parsed kelurahan=$kel rw=$rt');
        if (kel.isNotEmpty || rt.isNotEmpty) {
          return user.copyWith(
            kecamatan: kelompokData['kecamatan']?.toString() ?? user.kecamatan,
            kelurahan: kel.isNotEmpty ? kel : user.kelurahan,
            rw: rt.isNotEmpty ? rt : user.rw,
          );
        }
      }
    } catch (e) {
      debugPrint('[DEBUG /kkn/kelompok/me] ERROR: $e');
    }

    return user;
  }

  String _cleanName(dynamic val) {
    if (val == null) return '';
    if (val is String) {
      final str = val.trim();
      if (str.startsWith('{') && str.contains('name:')) {
        final match = RegExp(r'name:\s*([\w\s]+?)(?:,|\})', caseSensitive: false).firstMatch(str);
        if (match != null) return match.group(1)?.trim() ?? str;
      }
      return str;
    }
    if (val is Map) {
      final n = val['name'] ?? val['nama'] ?? val['title'] ?? val['label'];
      if (n != null) return _cleanName(n);
    }
    return '';
  }

  @override
  Future<Map<String, dynamic>> fetchTerritories() async {
    List<String> kelurahans = [];
    List<String> rtRws = [];
    List<Map<String, dynamic>> rtRwListRaw = [];

    // 1. Coba endpoint dedicated baru /wilayah/rw dan /wilayah/rt
    try {
      final rwResp = await apiClient.dio.get('/wilayah/rw');
      if (rwResp.statusCode == 200 && rwResp.data != null) {
        final list = rwResp.data is List ? rwResp.data as List : (rwResp.data['data'] as List? ?? []);
        for (final item in list) {
          final clean = _cleanName(item);
          if (clean.isNotEmpty && !clean.contains('{') && !rtRws.contains(clean)) {
            rtRws.add(clean);
          }
        }
      }
    } catch (e) { debugPrint('Silenced error: $e'); }

    try {
      final rtResp = await apiClient.dio.get('/wilayah/rt');
      if (rtResp.statusCode == 200 && rtResp.data != null) {
        final list = rtResp.data is List ? rtResp.data as List : (rtResp.data['data'] as List? ?? []);
        for (final item in list) {
          final clean = _cleanName(item);
          if (clean.isNotEmpty && !clean.contains('{') && !rtRws.contains(clean)) {
            rtRws.add(clean);
          }
        }
      }
    } catch (e) { debugPrint('Silenced error: $e'); }

    // 2. Coba endpoint /areas/kelurahan
    try {
      final kelResp = await apiClient.dio.get('/areas/kelurahan');
      if (kelResp.statusCode == 200 && kelResp.data != null) {
        final list = kelResp.data is List ? kelResp.data as List : (kelResp.data['data'] as List? ?? []);
        for (final item in list) {
          final clean = _cleanName(item);
          if (clean.isNotEmpty && !clean.contains('{') && !kelurahans.contains(clean)) {
            kelurahans.add(clean);
          }
        }
      }
    } catch (e) { debugPrint('Silenced error: $e'); }

    // 3. Coba endpoint /areas/rt-rw
    try {
      final rtRwResp = await apiClient.dio.get('/areas/rt-rw');
      if (rtRwResp.statusCode == 200 && rtRwResp.data != null) {
        final list = rtRwResp.data is List ? rtRwResp.data as List : (rtRwResp.data['data'] as List? ?? []);
        for (final item in list) {
          if (item is Map<String, dynamic>) {
            final name = _cleanName(item['name']);
            final kel = _cleanName(item['kelurahan']);
            if (name.isNotEmpty && !name.contains('{') && !rtRws.contains(name)) rtRws.add(name);
            if (kel.isNotEmpty && !kel.contains('{') && !kelurahans.contains(kel)) {
              kelurahans.add(kel);
            }
            rtRwListRaw.add(item);
          } else if (item is String) {
            final clean = _cleanName(item);
            if (clean.isNotEmpty && !clean.contains('{') && !rtRws.contains(clean)) rtRws.add(clean);
          }
        }
      }
    } catch (e) { debugPrint('Silenced error: $e'); }

    final validKels = kelurahans.where((k) => k.isNotEmpty && !k.contains('{')).toList();
    final validRts = rtRws.where((r) => r.isNotEmpty && !r.contains('{')).toList();

    return {
      'kelurahans': validKels.isNotEmpty
          ? validKels
          : ['Dago', 'Bojongsoang', 'Sukapura', 'Lebak Siliwangi', 'Sadang Serang', 'Sekeloa', 'Lebak Gede', 'Cipaganti', 'Mengger', 'Dayeuhkolot'],
      'rtRws': validRts.isNotEmpty
          ? validRts
          : ['01/01', '02/01', '01/02', '02/02', '03/02', '01/03', '02/03', '01/04', '02/04'],
      'rawRtRw': rtRwListRaw,
    };
  }
}
