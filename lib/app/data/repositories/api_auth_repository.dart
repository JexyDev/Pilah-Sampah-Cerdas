import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import '../../core/utils/safe_storage.dart';
import '../../core/utils/image_compressor.dart';
import '../../core/utils/phone_formatter.dart';
import '../../core/utils/network_exception_helper.dart';
import '../../core/values/app_config.dart';
import '../models/user_entity.dart';
import 'auth_repository.dart';
import '../providers/api_client.dart';

/// Implementasi AuthRepository yang terhubung ke backend Express.js.
///
/// Endpoint yang digunakan:
///   POST /api/v1/auth/login        â€” phone + password â†’ accessToken + refreshToken
///   GET  /api/v1/households/me     â€” householdId warga (dipanggil setelah login)
///   POST /api/v1/auth/refresh      â€” refreshToken â†’ accessToken baru
///   POST /api/v1/auth/logout       â€” invalidate refreshToken
class ApiAuthRepository implements AuthRepository {
  const ApiAuthRepository({
    required this.apiClient,
    required this.secureStorage,
  });

  final ApiClient apiClient;
  final SafeStorage secureStorage;

  // â”€â”€â”€ Login â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
        data: {
          'phone': cleanPhone, 
          'password': password
        },
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
            final results = await Future.wait([
              secureStorage.read(key: AppConfig.mahasiswaKecamatanKey),
              secureStorage.read(key: AppConfig.mahasiswaKelurahanKey),
              secureStorage.read(key: AppConfig.mahasiswaRwKey),
            ]);
            final localKec = results[0];
            final localKel = results[1];
            final localRt = results[2];
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
      final errorCode = e.response?.data?['errorCode']?.toString() ?? e.response?.data?['code']?.toString();

      if (errorCode == 'REQUIRE_PASSWORD_CHANGE' || message?.contains('REQUIRE_PASSWORD_CHANGE') == true) {
        throw const AuthException('REQUIRE_PASSWORD_CHANGE', 'Anda harus mengganti sandi terlebih dahulu');
      }
      
      if (status == 401 || status == 404) {
        throw const AuthException(
          'INVALID_CREDENTIALS',
          'Nomor telepon atau password salah',
        );
      }

      if (status == 403) {
        throw const AuthException(
          'INVALID_CREDENTIALS',
          'Nomor telepon atau password salah',
        );
      }
      if (status == 429) {
        throw AuthException(
          'TOO_MANY_REQUESTS',
          message ?? 'Terlalu banyak percobaan login gagal. Silakan tunggu 15 menit.',
        );
      }

      if (status != null && status >= 500) {
        throw AuthException(
          'SERVER_ERROR',
          message ?? 'Server sedang mengalami gangguan (Error $status). Silakan coba lagi nanti.',
        );
      }
      throw const AuthException('NETWORK_ERROR', 'Gagal terhubung ke server');
    } catch (e) {
      if (e is AuthException) rethrow;
      throw AuthException('UNKNOWN_ERROR', NetworkExceptionHelper.getErrorMessage(e));
    }
  }

  // â”€â”€â”€ Register â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  @override
  Future<UserEntity> register({
    required String role,
    required Map<String, dynamic> data,
  }) async {
    apiClient.clearTokenCache();
    try {
      String endpoint = '/auth/register/warga'; // Default
      if (role == 'Mahasiswa') endpoint = '/auth/register/mahasiswa-kkn';
      if (role == 'Petugas Pemilahan' || role == 'Petugas') endpoint = '/auth/register/petugas-residu';
      
      final response = await apiClient.dio.post(
        endpoint,
        data: data,
      );
      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = response.data['data'] as Map<String, dynamic>;
        
        if (role == 'Mahasiswa' || role == 'Petugas Pemilahan' || role == 'Petugas') {
          return UserEntity(
            id: data['id']?.toString() ?? '',
            name: data['name']?.toString() ?? '',
            role: role == 'Mahasiswa' ? UserRole.mahasiswaKkn : UserRole.petugasPemilahan,
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
      throw AuthException('UNKNOWN_ERROR', NetworkExceptionHelper.getErrorMessage(e));
    }
  }

  // â”€â”€â”€ OTP (Login Warga / Reset Password) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
      throw AuthException('UNKNOWN_ERROR', NetworkExceptionHelper.getErrorMessage(e));
    }
  }

  @override
  Future<UserEntity> verifyOtp({required String phone, required String otp}) async {
    apiClient.clearTokenCache();
    final cleanPhone = PhoneFormatter.prepareLoginPhoneInput(phone);

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

        // Simpan token ke secure storage secara paralel
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
        role: UserRole.unknown,
      );
    } on DioException catch (e) {
      final status = e.response?.statusCode;
      if (status == 400 || status == 401) {
        throw const AuthException('INVALID_OTP', 'Kode OTP salah atau sudah kadaluarsa');
      }
      throw const AuthException('NETWORK_ERROR', 'Gagal terhubung ke server');
    } catch (e) {
      if (e is AuthException) rethrow;
      throw AuthException('UNKNOWN_ERROR', NetworkExceptionHelper.getErrorMessage(e));
    }
  }

  // ————————————————————————————————————————————————————————————— Logout —————————————————————————————————————————————————————————————

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

  // ———————————————————————————————————————————————————————— isLoggedIn —————————————————————————————————————————————————————————————

  @override
  Future<bool> isLoggedIn() async {
    final token = await secureStorage.read(key: AppConfig.accessTokenKey);
    return token != null && token.isNotEmpty;
  }

  // —————————————————————————————————————————————————————— getCurrentUser —————————————————————————————————————————————————————————————

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
        }
      }

      // Fetch /auth/me untuk semua role agar kecamatan, provinsi, kota selalu terisi dari API
      user = await _fetchProfileMe(user);

      return user;
    } catch (_) {
      return null;
    }
  }

  // ——————————————————————————————————————————————————— refreshAccessToken —————————————————————————————————————————————————————————————

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

  // ———————————————————————————————————— Private: fetch household setelah login —————————————————————————————————————————————————————————————

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
          final householdId = hh['householdId']?.toString() ?? hh['id']?.toString() ?? '';
          
          String rw = '';
          String kelurahan = '';
          
          final rtRwObj = hh['rtRw'] ?? hh['rw'];
          if (rtRwObj is Map) {
            final rtRwMap = Map<String, dynamic>.from(rtRwObj);
            rw = rtRwMap['name']?.toString() ?? '';
            if (rtRwMap['kelurahan'] is Map) {
              final kelMap = Map<String, dynamic>.from(rtRwMap['kelurahan']);
              kelurahan = kelMap['name']?.toString() ?? '';
            } else if (rtRwMap['kelurahan'] != null) {
              kelurahan = rtRwMap['kelurahan'].toString();
            }
          }

          String pendampingName = '';
          if (hh['pendamping'] != null) {
            if (hh['pendamping'] is Map) {
              pendampingName = (hh['pendamping'] as Map<String, dynamic>)['name']?.toString() ?? '';
            } else if (hh['pendamping'] is String) {
              pendampingName = hh['pendamping'].toString();
            }
          } else if (hh['pendampingName'] != null) {
            pendampingName = hh['pendampingName'].toString();
          }

          if (householdId.isNotEmpty) {
            await secureStorage.write(
              key: AppConfig.householdIdKey,
              value: householdId,
            );
            
            final int? hhFamilySize = int.tryParse(hh['familySize']?.toString() ?? '') ?? 
                                      int.tryParse(hh['jumlahAnggotaKeluarga']?.toString() ?? '') ??
                                      int.tryParse(hh['jumlah_anggota_keluarga']?.toString() ?? '');

            return user.copyWith(
              householdId: householdId,
              rw: rw.isNotEmpty ? rw : user.rw,
              kecamatan: user.kecamatan,
              kelurahan: kelurahan.isNotEmpty ? kelurahan : user.kelurahan,
              pendampingName: pendampingName.isNotEmpty ? pendampingName : user.pendampingName,
              familySize: hhFamilySize ?? user.familySize,
            );
          }
        }
      }
    } catch (e) {
      debugPrint('[DEBUG] _fetchAndAttachHousehold ERROR: $e');
    }
    return user;
  }

  // ————————————————————————————————————————————————————————— Fetch Profile —————————————————————————————————————————————————————————————
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
          
          mappedUser = await _fetchAndAttachHousehold(mappedUser);
          
          // Selalu update cache lokal setiap kali fetchProfile berhasil
          await secureStorage.write(
            key: AppConfig.userDataKey,
            value: jsonEncode(data),
          );
          
          return mappedUser;
        }
      } on DioException catch (e) {
        throw AuthException('FETCH_FAILED', e.message);
      } catch (e) {
        throw const AuthException('FETCH_FAILED', 'Gagal memuat profil. Terjadi kesalahan sistem.');
      }
      throw const AuthException('UNKNOWN', 'Gagal memuat profil');
    });
  }

  // ————————————————————————————————————————————————————— Upload Avatar —————————————————————————————————————————————————————————————
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
      throw const AuthException('UNKNOWN_ERROR', 'Gagal memproses gambar. Terjadi kesalahan sistem.');
    }
  }

  @override
  Future<String?> forgotPassword({required String phone}) async {
    try {
      final response = await apiClient.dio.post(
        '/auth/forgot-password',
        data: {'phone': phone},
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
      throw AuthException('UNKNOWN_ERROR', NetworkExceptionHelper.getErrorMessage(e));
    }
  }

  @override
  Future<bool> updateProfile({
    required String name,
    required String phone,
    String? address,
    String? kecamatan,
    String? kelurahan,
    String? rw,
    String? jenjangPendidikan,
  }) async {
    try {
      final response = await apiClient.dio.put(
        '/auth/profile',
        data: {
          'name': name,
          'phone': PhoneFormatter.prepareLoginPhoneInput(phone),
          if (address != null) 'address': address,
          if (kecamatan != null) 'kecamatan': kecamatan,
          if (kelurahan != null) 'kelurahan': kelurahan,
          if (rw != null) 'rw': rw,
          if (jenjangPendidikan != null) 'jenjangPendidikan': jenjangPendidikan,
        },
      );
      if (response.statusCode == 200) {
        // Data berhasil diupdate di server, update local storage cache:
        final updatedData = response.data['data']['user'];
        if (updatedData != null) {
          final currentUserStr = await secureStorage.read(key: AppConfig.userDataKey);
          if (currentUserStr != null) {
            final currentUserMap = jsonDecode(currentUserStr) as Map<String, dynamic>;
            currentUserMap['name'] = updatedData['name'] ?? name;
            currentUserMap['phone'] = updatedData['phone'] ?? phone;
            if (updatedData['address'] != null) {
              currentUserMap['address'] = updatedData['address'];
            }
            await secureStorage.write(
              key: AppConfig.userDataKey,
              value: jsonEncode(currentUserMap),
            );
          }
        }
        return true;
      }
      return false;
    } on DioException catch (e) {
      final status = e.response?.statusCode;
      final message = e.response?.data?['message']?.toString();
      if (status == 400) {
        throw AuthException('VALIDATION_ERROR', message ?? 'Format data tidak valid');
      }
      throw AuthException('UPDATE_PROFILE_FAILED', message ?? 'Gagal memperbarui profil');
    } catch (e) {
      throw AuthException('UNKNOWN_ERROR', 'Terjadi kesalahan: $e');
    }
  }

  @override
  Future<void> resetPassword({
    required String phone,
    required String token,
    required String newPassword,
  }) async {
    final cleanPhone = PhoneFormatter.prepareLoginPhoneInput(phone);
    try {
      final response = await apiClient.dio.post(
        '/auth/reset-password',
        data: {
          'phone': cleanPhone,
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
      throw AuthException('UNKNOWN_ERROR', NetworkExceptionHelper.getErrorMessage(e));
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
      throw AuthException('UNKNOWN_ERROR', NetworkExceptionHelper.getErrorMessage(e));
    }
  }

  @override
  Future<bool> forceChangePassword({
    required String phone,
    required String oldPassword,
    required String newPassword,
  }) async {
    try {
      final response = await apiClient.dio.post(
        '/auth/force-change-password',
        data: {
          'identifier': phone,
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
      throw AuthException('UNKNOWN_ERROR', NetworkExceptionHelper.getErrorMessage(e));
    }
  }

  // ————————————————————————————————————————————————————————— Helper —————————————————————————————————————————————————————————————

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
      if (kelurahan.isEmpty || kelurahan == '-') {
        kelurahan = sp['kelurahan']?.toString() ?? 
                    sp['penugasanKelurahan']?.toString() ?? 
                    sp['kelompok']?['kelurahan']?.toString() ?? 
                    (sp['assignedRw']?['kelurahan']?['name'])?.toString() ?? 
                    '';
      }
      if (rw.isEmpty || rw == '-') {
        if (sp['rw'] != null && sp['rw'].toString() != '-') {
          rw = sp['rw'].toString();
        } else if (sp['penugasanRt'] != null && sp['penugasanRw'] != null) {
          rw = '${sp['penugasanRt']}/${sp['penugasanRw']}';
        } else if (sp['kelompok']?['rw'] != null && sp['kelompok']['rw'].toString() != '-') {
          rw = sp['kelompok']['rw'].toString();
        } else if (sp['kelompok']?['cakupanRw'] != null) {
          final cRw = sp['kelompok']['cakupanRw'];
          if (cRw is List) {
            rw = cRw.map((e) => e.toString().replaceAll(RegExp(r'^RW\s*', caseSensitive: false), '').trim()).join(', ');
          } else {
            rw = cRw.toString().replaceAll(RegExp(r'^RW\s*', caseSensitive: false), '').trim();
          }
        } else if (sp['assignedRw']?['name'] != null && sp['assignedRw']['name'].toString() != '-') {
          rw = sp['assignedRw']['name'].toString();
        }
      }
    }

    // 4. Coba dari kelompokKkn / kelompok_kkn (struktur mahasiswa KKN)
    if (kelurahan.isEmpty || rw.isEmpty) {
      final kknMap = userMap['kelompokKkn'] ?? userMap['kelompok_kkn'];
      if (kknMap is Map) {
        final kkn = kknMap as Map<String, dynamic>;
        if (kelurahan.isEmpty) kelurahan = kkn['kelurahan']?.toString() ?? '';
        if (rw.isEmpty) rw = kkn['rw']?.toString() ?? '';
      }
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
    final String jenjang = userMap['jenjangPendidikan']?.toString() ?? sp?['jenjangPendidikan']?.toString() ?? userMap['profile']?['jenjangPendidikan']?.toString() ?? userMap['strata']?.toString() ?? 'S1';

    String extractRawRole() {
      final candidates = [
        userMap['role'],
        userMap['userRole'],
        userMap['roleName'],
        userMap['type'],
        userMap['profile']?['role'],
        sp?['role'],
      ];
      for (final c in candidates) {
        if (c != null) {
          String str = '';
          if (c is Map) {
             str = (c['name'] ?? c['roleName'] ?? c['type'] ?? c.toString()).toString().trim();
          } else {
             str = c.toString().trim();
          }
          if (str.isNotEmpty && str.toLowerCase() != 'null') {
            return str;
          }
        }
      }
      return 'UNKNOWN';
    }

    String provinsi = userMap['provinsi']?.toString() ?? '';
    String kota = userMap['kota']?.toString() ?? userMap['kabupaten']?.toString() ?? '';
    String fetchedKecamatan = userMap['kecamatan']?.toString() ?? '';
    String fullAddress = userMap['address']?.toString() ?? '';

    // 6. Untuk Petugas Pemilahan: baca rw penugasan dari field khusus
    final String penugasanRw = userMap['penugasanRw']?.toString() ?? '';
    final String penugasanKelurahan = userMap['penugasanKelurahan']?.toString() ?? '';
    // Jika kelurahan/rw kosong, fallback ke penugasan petugas
    if (kelurahan.isEmpty && penugasanKelurahan.isNotEmpty) {
      kelurahan = penugasanKelurahan;
    }
    if (rw.isEmpty && penugasanRw.isNotEmpty) {
      rw = penugasanRw;
    }

    // 7. Coba extract dari nested rw object (sudah include kota & provinsi dari backend baru)
    if (userMap['rw'] is Map) {
      final rwObj = userMap['rw'] as Map<String, dynamic>;
      if (rwObj['kelurahan'] is Map) {
        final kelObj = rwObj['kelurahan'] as Map<String, dynamic>;
        if (kelObj['kecamatan'] is Map) {
          final kecObj = kelObj['kecamatan'] as Map<String, dynamic>;
          if (fetchedKecamatan.isEmpty) {
            fetchedKecamatan = kecObj['name']?.toString() ?? fetchedKecamatan;
          }
          if (kecObj['kota'] is Map) {
            final kotaObj = kecObj['kota'] as Map<String, dynamic>;
            if (kota.isEmpty) kota = kotaObj['name']?.toString() ?? kota;
            if (kotaObj['provinsi'] is Map) {
              final provObj = kotaObj['provinsi'] as Map<String, dynamic>;
              if (provinsi.isEmpty) provinsi = provObj['name']?.toString() ?? provinsi;
            }
          }
        }
      }
    }

    // 8. Fallback: parse alamat hanya jika field wilayah MASIH kosong setelah cek DB
    if (fullAddress.isNotEmpty) {
      if (rw.isEmpty && fullAddress.toLowerCase().contains('rw')) {
        final rwMatch = RegExp(r'rw\s*(\d+)', caseSensitive: false).firstMatch(fullAddress);
        if (rwMatch != null) {
          rw = rwMatch.group(1)!;
        }
      }
      
      if ((provinsi.isEmpty || kota.isEmpty) && fullAddress.contains(',')) {
        final parts = fullAddress.split(',').map((e) => e.trim()).toList();
        if (parts.length >= 3) {
          if (provinsi.isEmpty) provinsi = parts.last;
          if (kota.isEmpty) kota = parts[parts.length - 2];
          if (fetchedKecamatan.isEmpty && parts.length >= 4) {
            fetchedKecamatan = parts[parts.length - 3]
                .replaceAll(RegExp(r'^Kec\.\s*', caseSensitive: false), '');
          }
        }
      }
    }

    // 9. Bersihkan string RW sesuai request (Hapus nama kelurahan di dalam kurung dan prefix "RW")
    rw = rw.replaceAll(RegExp(r'\s*\(.*?\)'), '').replaceAll(RegExp(r'^RW\s*', caseSensitive: false), '').trim();

    // 10. Bersihkan fullAddress agar tidak mengulang nama Kelurahan, Kecamatan, Kota, dan Provinsi
    if (fullAddress.isNotEmpty && fullAddress.contains(',')) {
      final parts = fullAddress.split(',').map((e) => e.trim()).toList();
      final filteredParts = parts.where((part) {
        final lowerPart = part.toLowerCase();
        if (kelurahan.isNotEmpty && lowerPart.contains(kelurahan.toLowerCase())) return false;
        if (fetchedKecamatan.isNotEmpty && lowerPart.contains(fetchedKecamatan.toLowerCase())) return false;
        if (kota.isNotEmpty && lowerPart.contains(kota.toLowerCase())) return false;
        if (provinsi.isNotEmpty && lowerPart.contains(provinsi.toLowerCase())) return false;
        return true;
      }).toList();
      fullAddress = filteredParts.join(', ');
    }

    return UserEntity(
      id: userMap['id']?.toString() ?? '',
      name: userMap['name']?.toString() ?? '',
      phone: userMap['phone']?.toString() ?? '',
      address: fullAddress,
      email: userMap['email']?.toString(),
      role: UserRoleExtension.fromApi(extractRawRole()),
      fotoProfil: userMap['fotoProfil']?.toString(),
      provinsi: provinsi,
      kota: kota,
      kecamatan: fetchedKecamatan,
      kelurahan: kelurahan,
      rw: rw,
      nim: nim,
      jurusan: jurusan,
      prodi: prodi,
      fakultas: fakultas,
      universitas: universitas,
      jenjangPendidikan: jenjang,
      pendampingName: userMap['pendampingName']?.toString() ?? userMap['mahasiswaPendamping']?.toString(),
      kelompokName: userMap['kelompokName']?.toString() ?? userMap['kelompok']?['name']?.toString() ?? '',
      dplName: userMap['dplName']?.toString() ?? userMap['kelompok']?['dpl']?['name']?.toString() ?? userMap['kelompok']?['dosenPembimbing']?.toString() ?? '',
      familySize: int.tryParse(userMap['familySize']?.toString() ?? '') ??
                  int.tryParse(userMap['jumlahAnggotaKeluarga']?.toString() ?? '') ?? 
                  int.tryParse(userMap['jumlah_anggota_keluarga']?.toString() ?? '') ?? 1,
    );
  }

  /// Fetch data wilayah mahasiswa dari /auth/me 
  /// Backend /auth/me tidak return kelurahan/rw, 
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
        if (userMap.isNotEmpty) {
          final fetched = _mapUser(userMap);
          if (fetched.kelurahan.isNotEmpty && fetched.rw.isNotEmpty) {
            debugPrint('[DEBUG /auth/me] Got kelurahan=${fetched.kelurahan} rw=${fetched.rw}');
          }
          user = user.copyWith(
            name: fetched.name,
            phone: fetched.phone,
            email: fetched.email,
            fotoProfil: fetched.fotoProfil,
            provinsi: fetched.provinsi,
            kota: fetched.kota,
            kecamatan: fetched.kecamatan.isNotEmpty ? fetched.kecamatan : (userMap['kecamatan']?.toString() ?? ''),
            kelurahan: fetched.kelurahan,
            rw: fetched.rw,
            pendampingName: fetched.pendampingName,
            familySize: fetched.familySize,
            role: fetched.role,
            nim: fetched.nim.isNotEmpty ? fetched.nim : user.nim,
            jurusan: fetched.jurusan.isNotEmpty ? fetched.jurusan : user.jurusan,
            prodi: fetched.prodi.isNotEmpty ? fetched.prodi : user.prodi,
            fakultas: fetched.fakultas.isNotEmpty ? fetched.fakultas : user.fakultas,
            universitas: fetched.universitas.isNotEmpty ? fetched.universitas : user.universitas,
            jenjangPendidikan: fetched.jenjangPendidikan.isNotEmpty ? fetched.jenjangPendidikan : user.jenjangPendidikan,
            kelompokName: fetched.kelompokName.isNotEmpty ? fetched.kelompokName : user.kelompokName,
            dplName: fetched.dplName.isNotEmpty ? fetched.dplName : user.dplName,
          );
        }
      }
    } catch (e) {
      debugPrint('[DEBUG /auth/me] ERROR: $e');
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
    List<String> provinsis = [];
    List<String> kotas = [];
    List<String> kecamatans = [];
    List<String> kelurahans = [];
    List<String> rtRws = [];
    List<Map<String, dynamic>> rtRwListRaw = [];
    List<Map<String, dynamic>> kelurahanListRaw = [];
    List<Map<String, dynamic>> kotaListRaw = [];
    List<Map<String, dynamic>> kecamatanListRaw = [];

    try {
      final provResp = await apiClient.dio.get('/wilayah/provinsi');
      if (provResp.statusCode == 200 && provResp.data != null) {
        final list = provResp.data is List ? provResp.data as List : (provResp.data['data'] as List? ?? []);
        for (final item in list) {
          String clean = _cleanName(item);
          if (clean.isNotEmpty && !clean.contains('{') && !provinsis.contains(clean)) provinsis.add(clean);
        }
      }
    } catch (e) { debugPrint('Silenced error: $e'); }

    try {
      final kotaResp = await apiClient.dio.get('/wilayah/kabupaten');
      if (kotaResp.statusCode == 200 && kotaResp.data != null) {
        final list = kotaResp.data is List ? kotaResp.data as List : (kotaResp.data['data'] as List? ?? []);
        for (final item in list) {
          if (item is Map) {
            kotaListRaw.add(Map<String, dynamic>.from(item));
          }
          String clean = _cleanName(item);
          if (clean.isNotEmpty && !clean.contains('{') && !kotas.contains(clean)) kotas.add(clean);
        }
      }
    } catch (e) { debugPrint('Silenced error: $e'); }

    // 0. Coba endpoint /areas/kecamatan & /wilayah/kecamatan
    try {
      final kecResp = await apiClient.dio.get('/areas/kecamatan');
      if (kecResp.statusCode == 200 && kecResp.data != null) {
        final list = kecResp.data is List ? kecResp.data as List : (kecResp.data['data'] as List? ?? []);
        for (final item in list) {
          if (item is Map) {
            kecamatanListRaw.add(Map<String, dynamic>.from(item));
          }
          String clean = _cleanName(item);
          clean = clean.replaceAll(RegExp(r'^Kecamatan\s+', caseSensitive: false), '').trim();
          if (clean.isNotEmpty && !clean.contains('{') && !kecamatans.contains(clean)) {
            kecamatans.add(clean);
          }
        }
      }
    } catch (e) { debugPrint('Silenced error: $e'); }

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
          if (item is Map) {
            final itemMap = Map<String, dynamic>.from(item);
            kelurahanListRaw.add(itemMap);
          }
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
          if (item is Map) {
            final itemMap = Map<String, dynamic>.from(item);
            final name = _cleanName(itemMap['name']);
            var kel = _cleanName(itemMap['kelurahan']);
            
            // Fallback cari kelurahan via kelurahanId jika kelurahan berupa ID saja
            if (kel.isEmpty && itemMap['kelurahanId'] != null) {
              final kelId = itemMap['kelurahanId'];
              final matchedKel = kelurahanListRaw.firstWhere(
                (k) => k['id'] == kelId || k['id']?.toString() == kelId.toString(),
                orElse: () => <String, dynamic>{},
              );
              if (matchedKel.isNotEmpty) {
                kel = _cleanName(matchedKel['name']);
              }
            }

            if (name.isNotEmpty && !name.contains('{') && !rtRws.contains(name)) rtRws.add(name);
            if (kel.isNotEmpty && !kel.contains('{') && !kelurahans.contains(kel)) {
              kelurahans.add(kel);
            }
            rtRwListRaw.add({
              ...itemMap,
              'id': itemMap['id'],
              'name': name,
              'kelurahan': kel,
            });
          } else if (item is String) {
            final clean = _cleanName(item);
            if (clean.isNotEmpty && !clean.contains('{') && !rtRws.contains(clean)) rtRws.add(clean);
          }
        }
      }
    } catch (e) { debugPrint('Silenced error: $e'); }

    final validKecs = kecamatans.where((k) => k.isNotEmpty && !k.contains('{')).toList();
    final validKels = kelurahans.where((k) => k.isNotEmpty && !k.contains('{')).toList();
    
    return {
      'provinsis': provinsis,
      'kotas': kotas,
      'kecamatans': validKecs,
      'kelurahans': validKels,
      'rtRws': rtRws,
      'rawRtRw': rtRwListRaw,
      'rawKelurahan': kelurahanListRaw,
      'rawKota': kotaListRaw,
      'rawKecamatan': kecamatanListRaw,
    };
  }
}


