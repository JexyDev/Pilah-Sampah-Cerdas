import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import '../../domain/entities/user_entity.dart';
import '../../domain/repositories/auth_repository.dart';
import '../../domain/repositories/notification_repository.dart';
import 'repository_providers.dart';

/// State autentikasi.
class AuthState {
  const AuthState({this.user, this.isLoading = false, this.errorCode});

  final UserEntity? user;
  final bool isLoading;
  final String? errorCode;

  bool get isAuthenticated => user != null;

  AuthState copyWith({
    UserEntity? user,
    bool? isLoading,
    String? errorCode,
    bool clearUser = false,
    bool clearError = false,
  }) {
    return AuthState(
      user: clearUser ? null : (user ?? this.user),
      isLoading: isLoading ?? this.isLoading,
      errorCode: clearError ? null : (errorCode ?? this.errorCode),
    );
  }
}

/// Notifier autentikasi.
/// Login menggunakan email + password sesuai backend contract.
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

  /// Login dengan email dan password.
  Future<bool> login({required String nik, required String password}) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final user = await _authRepository.login(
        nik: nik,
        password: password,
      );
      state = state.copyWith(user: user, isLoading: false);
      // Daftarkan FCM token setelah login berhasil
      _registerFcmToken();
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

  /// Logout — hapus token, reset state.
  Future<void> logout() async {
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
      // Fetch ulang profil untuk mendapatkan URL foto terbaru jika backend mengirimkannya (atau sekadar refresh info)
      await fetchProfile();
      state = state.copyWith(isLoading: false);
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
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(
    ref.watch(authRepositoryProvider),
    ref.watch(notificationRepositoryProvider),
  );
});
