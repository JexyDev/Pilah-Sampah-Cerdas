import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../data/models/user_entity.dart';
import '../../../data/repositories/auth_repository.dart';
import '../../../data/repositories/notification_repository.dart';
import '../../../data/providers/repository_providers.dart';
import '../../../data/services/notification_engine.dart';
import '../../notifikasi/controllers/notifikasi_controller.dart';
import '../../mahasiswa/controllers/kkn_location_controller.dart';
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
  AuthNotifier(this._authRepository, this._notificationRepository, this._ref)
      : super(const AuthState()) {
    _initFuture = _init();
  }

  final AuthRepository _authRepository;
  final NotificationRepository _notificationRepository;
  final Ref _ref;
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
      _restoreNotificationSyncState(user);
      NotificationEngine().scheduleRoleBasedNotifications(user.role.apiValue);
      
      // Sinkronisasi data terbaru di background agar state & cache lokal selalu update
      // tanpa pengguna harus manual pull-to-refresh.
      fetchProfile();
    }
  }

  /// Sinkronisasi status notifikasi dari backend (Cloud Sync) ke local cache.
  Future<void> _restoreNotificationSyncState(UserEntity user) async {
    try {
      final syncState = await _notificationRepository.getSyncState();
      if (syncState.isEmpty) return;

      final prefs = await SharedPreferences.getInstance();
      final role = user.role.name;
      final userId = user.id;

      if (syncState['readIds'] != null) {
        final List<dynamic> readIdsDyn = syncState['readIds'];
        final readIds = readIdsDyn.map((e) => e.toString()).toList();
        await prefs.setStringList('read_notifs_${userId}_$role', readIds);
      }
      
      if (syncState['markAllTimestamp'] != null) {
        await prefs.setInt('mark_all_notifs_${userId}_$role', syncState['markAllTimestamp'] as int);
      }

      if (syncState['deleteAllTimestamp'] != null) {
        await prefs.setInt('delete_all_notifs_${userId}_$role', syncState['deleteAllTimestamp'] as int);
      }
    } catch (_) {
      // Ignore if failed
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

      // Tunggu sync notifikasi dari backend selesai supaya cache lokal ter-update
      // SEBELUM `user` dimasukkan ke state (yang akan men-trigger notificationsProvider)
      await _restoreNotificationSyncState(user);

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
      await _restoreNotificationSyncState(user);

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

      await _restoreNotificationSyncState(user);

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
    // 0. Otomatis jeda kegiatan KKN jika sedang BERLANGSUNG saat logout
    try {
      final kknState = _ref.read(kknLocationProvider);
      final kknNotifier = _ref.read(kknLocationProvider.notifier);
      final activeAct = kknState.activeActivity;
      final statusUpper = (activeAct?['statusKehadiran'] ?? activeAct?['attendanceStatus'] ?? activeAct?['status'] ?? '').toString().toUpperCase();
      final isBerlangsung = kknState.isTracking ||
          statusUpper == 'BERLANGSUNG' ||
          statusUpper == 'DI_ZONA' ||
          statusUpper == 'DALAM_RADIUS' ||
          statusUpper == 'LAPANGAN';
      if (isBerlangsung) {
        await kknNotifier.jedaKegiatan('Pengguna Keluar / Logout Aplikasi');
      }
    } catch (_) {}

    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token != null) {
        await _notificationRepository.unregisterDeviceToken(token);
      }
      await FirebaseMessaging.instance.deleteToken();
    } catch (_) {
      // Non-critical — abaikan jika Firebase tidak aktif
    }

    // 1. Jeda kegiatan KKN aktif ke backend sebelum stop service
    // agar backend tidak auto-mark HADIR dari durasi yang sudah terakumulasi
    try {
      final kknNotifier = _ref.read(kknLocationProvider.notifier);
      final kknState = _ref.read(kknLocationProvider);
      if (kknState.isTracking && kknState.activeActivity != null && !kknState.isSuccessAttendance) {
        await kknNotifier.jedaKegiatan('LOGOUT');
      }
    } catch (_) {}

    // 2. Reset TOTAL semua in-memory state KKN + stop GPS service + clear SharedPreferences kkn_*.
    //    WAJIB dipanggil sebelum akun lain bisa login agar durasi akun ini tidak bocor
    //    ke sesi berikutnya (bug: akun kedua mulai presensi dari durasi akun pertama).
    try {
      await _ref.read(kknLocationProvider.notifier).resetForNewUser();
    } catch (_) {}

    // 3. Hentikan notifikasi & bersihkan cache notifikasi
    await NotificationEngine().cancelAll();
    clearNotificationCache();
    
    // 4. Clear user-specific SharedPreferences caches (notif read state, dll)
    try {
      final prefs = await SharedPreferences.getInstance();
      final keys = prefs.getKeys();
      for (final key in keys) {
        if (key.startsWith('read_notifs_') || 
            key.startsWith('fcm_notifs_') || 
            key.startsWith('mark_all_notifs_')) {
          await prefs.remove(key);
        }
      }
    } catch (_) {}

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

  /// Ganti sandi paksa dan otomatis login jika sukses
  Future<bool> forceChangePassword({
    required String phone,
    required String oldPassword,
    required String newPassword,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final success = await _authRepository.changePassword(
        oldPassword: oldPassword,
        newPassword: newPassword,
      );
      
      if (success) {
        state = state.copyWith(isLoading: false);
        return true;
      }
      
      state = state.copyWith(isLoading: false);
      return false;
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
    ref,
  );
});
