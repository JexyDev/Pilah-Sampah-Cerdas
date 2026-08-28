import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/models/wilayah_kelompok_model.dart';
import '../../../data/providers/repository_providers.dart';

class KknMapState {
  final bool isLoading;
  final WilayahKelompokModel? wilayahKelompok;
  final String? error;

  KknMapState({
    this.isLoading = false,
    this.wilayahKelompok,
    this.error,
  });

  KknMapState copyWith({
    bool? isLoading,
    WilayahKelompokModel? wilayahKelompok,
    String? error,
    bool clearError = false,
  }) {
    return KknMapState(
      isLoading: isLoading ?? this.isLoading,
      wilayahKelompok: wilayahKelompok ?? this.wilayahKelompok,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class KknMapController extends StateNotifier<KknMapState> {
  final Ref _ref;

  KknMapController(this._ref) : super(KknMapState()) {
    fetchWilayahKelompok();
  }

  Future<void> fetchWilayahKelompok() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final repo = _ref.read(kknRepositoryProvider);
      final data = await repo.getWilayahKelompok();
      if (data != null) {
        state = state.copyWith(isLoading: false, wilayahKelompok: data);
      } else {
        state = state.copyWith(
            isLoading: false, error: 'Data wilayah tidak ditemukan');
      }
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }
}

final kknMapProvider =
    StateNotifierProvider<KknMapController, KknMapState>((ref) {
  return KknMapController(ref);
});
