import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/entities/user_entity.dart';
import '../../domain/repositories/auth_repository.dart';
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

/// Notifier autentikasi — mengikuti pola Riverpod Notifier.
class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier(this._authRepository) : super(const AuthState());

  final AuthRepository _authRepository;

  Future<bool> login({required String nik, required String password}) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final user = await _authRepository.login(nik: nik, password: password);
      state = state.copyWith(user: user, isLoading: false);
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

  Future<void> logout() async {
    await _authRepository.logout();
    state = const AuthState();
  }

  void clearError() {
    state = state.copyWith(clearError: true);
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref.watch(authRepositoryProvider));
});
