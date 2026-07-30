import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';

import '../../../data/models/mahasiswa_kkn_models.dart';
import '../../../data/providers/repository_providers.dart';

// ─────────────────────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────────────────────

class RegistrasiWargaState {
  const RegistrasiWargaState({
    this.isSubmitting = false,
    this.isSuccess = false,
    this.errorMessage,
  });

  final bool isSubmitting;
  final bool isSuccess;
  final String? errorMessage;

  RegistrasiWargaState copyWith({
    bool? isSubmitting,
    bool? isSuccess,
    String? errorMessage,
  }) {
    return RegistrasiWargaState(
      isSubmitting: isSubmitting ?? this.isSubmitting,
      isSuccess: isSuccess ?? this.isSuccess,
      errorMessage: errorMessage,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Controller (StateNotifier)
// ─────────────────────────────────────────────────────────────────────────────

class RegistrasiWargaNotifier extends StateNotifier<RegistrasiWargaState> {
  RegistrasiWargaNotifier(this._ref) : super(const RegistrasiWargaState());

  final Ref _ref;

  /// Submit registrasi warga ke backend.
  Future<void> submitRegistrasi(RegisterWargaRequest request) async {
    state = state.copyWith(
      isSubmitting: true,
      isSuccess: false,
      errorMessage: null,
    );

    try {
      final repo = _ref.read(kknRepositoryProvider);
      await repo.registerWarga(request);

      state = state.copyWith(
        isSubmitting: false,
        isSuccess: true,
      );
    } on DioException catch (e) {
      String message = 'Gagal mendaftarkan warga.';
      if (e.response?.statusCode == 409) {
        message = 'Nomor HP sudah terdaftar.';
      } else if (e.response?.statusCode == 400) {
        message = 'Data tidak valid. Periksa kembali form Anda.';
      } else if (e.type == DioExceptionType.connectionTimeout || e.type == DioExceptionType.receiveTimeout || e.type == DioExceptionType.connectionError) {
        message = 'Tidak dapat terhubung ke server. Periksa koneksi internet.';
      }

      state = state.copyWith(
        isSubmitting: false,
        errorMessage: message,
      );
    } catch (e) {
      state = state.copyWith(
        isSubmitting: false,
        errorMessage: 'Gagal mendaftarkan warga. Terjadi kesalahan internal.',
      );
    }
  }

  /// Reset state (saat user kembali ke form baru).
  void reset() {
    state = const RegistrasiWargaState();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

final registrasiWargaControllerProvider =
    StateNotifierProvider<RegistrasiWargaNotifier, RegistrasiWargaState>((ref) {
  return RegistrasiWargaNotifier(ref);
});
