import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../data/models/user_entity.dart';
import '../../../data/repositories/auth_repository.dart';
import '../../../data/repositories/notification_repository.dart';
import '../../../data/providers/repository_providers.dart';
import '../../../data/services/notification_engine.dart';
import '../../notifikasi/controllers/notifikasi_controller.dart';
import '../../mahasiswa/services/kkn_background_task_handler.dart';

/// State autentikasi.
class AuthState {
  const AuthState({this.user, this.isLoading = false, this.errorCode, this.errorMessage});

  final UserEntity? user;
  final bool isLoading;
  final String? errorCode;
  final String? errorMessage;

  bool get isAuthenticated => user != null;

  AuthState copyWith({
    UserEntity? user,
    bool? isLoading,
    String? errorCode,
    String? errorMessage,
    bool clearUser = false,
    bool clearError = false,
  }) {
    return AuthState(
      user: clearUser ? null : (user ?? this.user),
      isLoading: isLoading ?? this.isLoading,
      errorCode: clearError ? null : (errorCode ?? this.errorCode),
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }
}

/// Notifier autentikasi.
/// Login menggunakan phone + password sesuai backend contract.
class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier(this._authRepository, this._notificationRepository)
      : super(const AuthState()) {
    _initFuture = _init();
  }

  final AuthRepository _authRepository;
  final NotificationRepository _notificationRepository;
  late final Future<void> _initFuture;

  Future<void> get initialized => _initFuture;

  /// Cek session tersimpan saat app pertama kali dibuka.
  Future<void> _init() async {
    final user = await _authRepository.getCurrentUser();
    if (user != null) {
      // getCurrentUser sudah attach householdId dari secure storage cache
      state = state.copyWith(user: user);
      // Daftarkan FCM token jika sesi sudah ada (app restart)
      _registerFcmToken();
      NotificationEngine().scheduleRoleBasedNotifications(user.role.apiValue);
    }
  }

  /// Minta izin notifikasi dan daftarkan FCM token ke backend.
  /// Fire-and-forget: tidak throw exception ke caller.
  Future<void> _registerFcmToken() async {
    try {
      final messaging = FirebaseMessaging.instance;
      final settings = await messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );

      if (settings.authorizationStatus == AuthorizationStatus.authorized ||
          settings.authorizationStatus == AuthorizationStatus.provisional) {
        final token = await messaging.getToken();
        if (token != null) {
          await _notificationRepository.registerDeviceToken(token);
        }

        // Dengarkan perubahan token (rotasi FCM)
        FirebaseMessaging.instance.onTokenRefresh.listen((newToken) {
          _notificationRepository.registerDeviceToken(newToken);
        });
      }
    } catch (e) {
      // Non-critical — Firebase mungkin belum dikonfigurasi
      // App tetap berjalan normal tanpa FCM
    }
  }

  /// Login dengan nomor telepon dan password.
  Future<bool> login({required String phone, required String password}) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final user = await _authRepository.login(
        phone: phone,
        password: password,
      );

      if (user.role != UserRole.warga && 
          user.role != UserRole.mahasiswaKkn && 
          user.role != UserRole.petugasPemilahan) {
        await _authRepository.logout();
        throw const AuthException(
          'UNAUTHORIZED_ROLE', 
          'Akses ditolak. Aplikasi mobile hanya untuk Warga, Petugas Pemilah, dan Mahasiswa.'
        );
      }

      state = state.copyWith(user: user, isLoading: false);
      // Daftarkan FCM token setelah login berhasil
      _registerFcmToken();
      NotificationEngine().scheduleRoleBasedNotifications(user.role.apiValue);
      return true;
    } on AuthException catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorCode: e.code,
        clearUser: true,
      );
      return false;
    } catch (_) {
      state = state.copyWith(
        isLoading: false,
        errorCode: 'INTERNAL_SERVER_ERROR',
        clearUser: true,
      );
      return false;
    }
  }

  /// Register dengan data dinamis berdasarkan role
  Future<bool> register({
    required String role,
    required Map<String, dynamic> data,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final user = await _authRepository.register(
        role: role,
        data: data,
      );
      state = state.copyWith(user: user, isLoading: false);
      // Daftarkan FCM token setelah register berhasil
      _registerFcmToken();
      return true;
    } on AuthException catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorCode: e.code,
        errorMessage: e.message,
        clearUser: true,
      );
      return false;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorCode: 'INTERNAL_SERVER_ERROR',
        errorMessage: e.toString(),
        clearUser: true,
      );
      return false;
    }
  }

  /// Request OTP untuk login warga atau lupa password
  Future<bool> requestOtp({required String phone}) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await _authRepository.requestOtp(phone: phone);
      state = state.copyWith(isLoading: false);
      return true;
    } on AuthException catch (e) {
      state = state.copyWith(isLoading: false, errorCode: e.code);
      return false;
    } catch (_) {
      state = state.copyWith(isLoading: false, errorCode: 'UNKNOWN_ERROR');
      return false;
    }
  }

  /// Verifikasi OTP
  Future<bool> verifyOtp({required String phone, required String otp}) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final user = await _authRepository.verifyOtp(phone: phone, otp: otp);

      if (user.role != UserRole.warga && 
          user.role != UserRole.mahasiswaKkn && 
          user.role != UserRole.petugasPemilahan) {
        await _authRepository.logout();
        throw const AuthException(
          'UNAUTHORIZED_ROLE', 
          'Akses ditolak. Aplikasi mobile hanya untuk Warga, Petugas Pemilah, dan Mahasiswa.'
        );
      }

      state = state.copyWith(user: user, isLoading: false);
      _registerFcmToken();
      return true;
    } on AuthException catch (e) {
      state = state.copyWith(isLoading: false, errorCode: e.code, clearUser: true);
      return false;
    } catch (_) {
      state = state.copyWith(isLoading: false, errorCode: 'UNKNOWN_ERROR', clearUser: true);
      return false;
    }
  }

  /// Logout — unregister FCM token per-user, hapus token secure storage, reset state & bersihkan system tray.
  Future<void> logout() async {
    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token != null) {
        await _notificationRepository.unregisterDeviceToken(token);
      }
      await FirebaseMessaging.instance.deleteToken();
    } catch (_) {
      // Non-critical — abaikan jika Firebase tidak aktif
    }

    // 1. Hentikan total background foreground GPS service KKN & cancel notifikasi
    try {
      await stopKknForegroundService();
    } catch (_) {}

    // 2. Hapus seluruh KKN timer cache & preference di SharedPreferences
    try {
      final prefs = await SharedPreferences.getInstance();
      final kknKeys = prefs.getKeys().where((k) => k.startsWith('kkn_')).toList();
      for (final key in kknKeys) {
        await prefs.remove(key);
      }
    } catch (_) {}

    await NotificationEngine().cancelAll();
    clearNotificationCache();
    await _authRepository.logout();
    state = const AuthState();
  }

  /// Update householdId setelah GET /households/me berhasil.
  void setHouseholdId(String householdId) {
    if (state.user == null) return;
    state = state.copyWith(
      user: state.user!.copyWith(householdId: householdId),
    );
  }

  /// Update kelurahan & rw mahasiswa KKN langsung di state.
  /// Data ini disimpan permanen di local storage oleh AuthRepository.
  void setMahasiswaRegion({required String kelurahan, required String rw, String kecamatan = ''}) {
    if (state.user == null) return;
    state = state.copyWith(
      user: state.user!.copyWith(kecamatan: kecamatan, kelurahan: kelurahan, rw: rw),
    );
  }

  /// Ambil data profil dari backend dan update state.
  Future<void> fetchProfile() async {
    try {
      final user = await _authRepository.fetchProfile();
      state = state.copyWith(user: user);
    } catch (_) {
      // Abaikan jika gagal, tetap gunakan data cache
    }
  }

  /// Upload foto profil
  Future<bool> uploadAvatar(String imagePath) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await _authRepository.uploadAvatar(imagePath);
      // Immediately update state user's fotoProfil so Profile & Dashboard top bar update live without logout
      if (state.user != null) {
        state = state.copyWith(
          user: state.user!.copyWith(fotoProfil: imagePath),
          isLoading: false,
        );
      } else {
        await fetchProfile();
        state = state.copyWith(isLoading: false);
      }
      return true;
    } on AuthException catch (e) {
      state = state.copyWith(isLoading: false, errorCode: e.code);
      return false;
    } catch (_) {
      state = state.copyWith(isLoading: false, errorCode: 'UPLOAD_FAILED');
      return false;
    }
  }

  void clearError() {
    state = state.copyWith(clearError: true);
  }

  /// Request token untuk lupa kata sandi.
  Future<String?> forgotPassword({required String phone}) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final token = await _authRepository.forgotPassword(phone: phone);
      state = state.copyWith(isLoading: false);
      return token;
    } on AuthException catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorCode: e.code,
      );
      return null;
    } catch (_) {
      state = state.copyWith(
        isLoading: false,
        errorCode: 'INTERNAL_SERVER_ERROR',
      );
      return null;
    }
  }

  /// Reset kata sandi.
  Future<bool> resetPassword({
    required String phone,
    required String token,
    required String newPassword,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await _authRepository.resetPassword(
        phone: phone,
        token: token,
        newPassword: newPassword,
      );
      state = state.copyWith(isLoading: false);
      return true;
    } on AuthException catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorCode: e.code,
      );
      return false;
    } catch (_) {
      state = state.copyWith(
        isLoading: false,
        errorCode: 'INTERNAL_SERVER_ERROR',
      );
      return false;
    }
  }

  /// Update data profil editable pengguna (Nama, HP, Alamat, Wilayah)
  Future<bool> updateProfile({
    required String name,
    required String phone,
    String? address,
    String? kecamatan,
    String? kelurahan,
    String? rw,
    String? jenjangPendidikan,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final success = await _authRepository.updateProfile(
        name: name,
        phone: phone,
        address: address,
        kecamatan: kecamatan,
        kelurahan: kelurahan,
        rw: rw,
        jenjangPendidikan: jenjangPendidikan,
      );
      if (success && state.user != null) {
        final updatedUser = state.user!.copyWith(
          name: name,
          phone: phone,
          address: address ?? state.user!.address,
          kecamatan: kecamatan ?? state.user!.kecamatan,
          kelurahan: kelurahan ?? state.user!.kelurahan,
          rw: rw ?? state.user!.rw,
          jenjangPendidikan: jenjangPendidikan ?? state.user!.jenjangPendidikan,
        );
        state = state.copyWith(user: updatedUser, isLoading: false);
      } else {
        state = state.copyWith(isLoading: false);
      }
      return success;
    } on AuthException catch (e) {
      state = state.copyWith(isLoading: false, errorCode: e.code);
      return false;
    } catch (_) {
      state = state.copyWith(isLoading: false, errorCode: 'UPDATE_FAILED');
      return false;
    }
  }

  /// Change password untuk pengguna aktif
  Future<bool> changePassword({
    required String oldPassword,
    required String newPassword,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final success = await _authRepository.changePassword(
        oldPassword: oldPassword,
        newPassword: newPassword,
      );
      state = state.copyWith(isLoading: false);
      return success;
    } on AuthException catch (e) {
      state = state.copyWith(isLoading: false, errorCode: e.code);
      return false;
    } catch (_) {
      state = state.copyWith(isLoading: false, errorCode: 'CHANGE_PASSWORD_FAILED');
      return false;
    }
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(
    ref.watch(authRepositoryProvider),
    ref.watch(notificationRepositoryProvider),
  );
});
