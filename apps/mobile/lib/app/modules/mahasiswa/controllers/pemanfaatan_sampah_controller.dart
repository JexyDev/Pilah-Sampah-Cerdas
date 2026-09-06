import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/models/mahasiswa_kkn_models.dart';
import '../../../data/providers/repository_providers.dart';

class PemanfaatanSampahState {
  final bool isLoading;
  final String? error;
  final bool isSuccess;

  const PemanfaatanSampahState({
    this.isLoading = false,
    this.error,
    this.isSuccess = false,
  });

  PemanfaatanSampahState copyWith({
    bool? isLoading,
    String? error,
    bool? isSuccess,
    bool clearError = false,
  }) {
    return PemanfaatanSampahState(
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
      isSuccess: isSuccess ?? this.isSuccess,
    );
  }
}

class PemanfaatanSampahNotifier extends StateNotifier<PemanfaatanSampahState> {
  PemanfaatanSampahNotifier(this.ref) : super(const PemanfaatanSampahState());

  final Ref ref;

  Future<bool> submitLaporan(PemanfaatanSampahRequest request) async {
    state = state.copyWith(isLoading: true, clearError: true, isSuccess: false);
    try {
      final repo = ref.read(kknRepositoryProvider);
      final ok = await repo.submitPemanfaatanSampah(request);
      if (ok) {
        state = state.copyWith(isLoading: false, isSuccess: true, clearError: true);
        return true;
      }
    } on DioException catch (e) {
      final msg = e.response?.data?['message']?.toString() ?? 'Gagal mengirim laporan pemanfaatan sampah.';
      state = state.copyWith(isLoading: false, error: msg);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
    return false;
  }
}

final pemanfaatanSampahProvider =
    StateNotifierProvider<PemanfaatanSampahNotifier, PemanfaatanSampahState>((ref) {
  return PemanfaatanSampahNotifier(ref);
});
