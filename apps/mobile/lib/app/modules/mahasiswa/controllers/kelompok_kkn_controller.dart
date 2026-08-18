import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/models/mahasiswa_kkn_models.dart';
import '../../../data/providers/repository_providers.dart';
import '../../../core/utils/network_exception_helper.dart';

class KelompokKknState {
  final bool isLoading;
  final String? error;
  final KelompokKknData? kelompok;

  const KelompokKknState({
    this.isLoading = false,
    this.error,
    this.kelompok,
  });

  KelompokKknState copyWith({
    bool? isLoading,
    String? error,
    KelompokKknData? kelompok,
    bool clearError = false,
    bool clearKelompok = false,
  }) {
    return KelompokKknState(
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
      kelompok: clearKelompok ? null : (kelompok ?? this.kelompok),
    );
  }
}

class KelompokKknNotifier extends StateNotifier<KelompokKknState> {
  KelompokKknNotifier(this.ref) : super(const KelompokKknState()) {
    fetchKelompok();
  }

  final Ref ref;

  Future<void> fetchKelompok() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final repo = ref.read(kknRepositoryProvider);
      final data = await repo.getKelompokKkn();
      state = state.copyWith(isLoading: false, kelompok: data, clearError: true);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: NetworkExceptionHelper.getErrorMessage(e),
      );
    }
  Future<bool> registerPosko(RegisterPoskoRequest request) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final repo = ref.read(kknRepositoryProvider);
      final ok = await repo.registerPoskoKkn(request);
      if (ok) {
        await fetchKelompok();
        return true;
      }
      state = state.copyWith(isLoading: false, error: 'Gagal mendaftarkan posko.');
      return false;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: NetworkExceptionHelper.getErrorMessage(e),
      );
      return false;
    }
  }
}

final kelompokKknProvider = StateNotifierProvider<KelompokKknNotifier, KelompokKknState>((ref) {
  return KelompokKknNotifier(ref);
});
