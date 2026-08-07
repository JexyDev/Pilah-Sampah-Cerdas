import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../data/models/mahasiswa_kkn_models.dart';
import '../../../data/providers/repository_providers.dart';
import '../../../core/utils/network_exception_helper.dart';
import '../../auth/controllers/auth_controller.dart';

// ─────────────────────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────────────────────

class MahasiswaState {
  const MahasiswaState({
    this.isLoading = false,
    this.errorMessage,
    this.dashboard,
    this.wargaList = const [],
  });

  final bool isLoading;
  final String? errorMessage;
  final KknDashboardData? dashboard;
  final List<WargaDampingan> wargaList;

  /// Warga yang membutuhkan edukasi ulang (kesalahan > 30%)
  List<WargaDampingan> get wargaNeedReeducation =>
      wargaList.where((w) => w.needsReeducation).toList();

  MahasiswaState copyWith({
    bool? isLoading,
    String? errorMessage,
    KknDashboardData? dashboard,
    List<WargaDampingan>? wargaList,
  }) {
    return MahasiswaState(
      isLoading: isLoading ?? this.isLoading,
      errorMessage: errorMessage,
      dashboard: dashboard ?? this.dashboard,
      wargaList: wargaList ?? this.wargaList,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Controller (StateNotifier)
// ─────────────────────────────────────────────────────────────────────────────

class MahasiswaNotifier extends StateNotifier<MahasiswaState> {
  MahasiswaNotifier(this._ref) : super(const MahasiswaState());

  final Ref _ref;

  /// Fetch dashboard + warga dampingan secara paralel.
  Future<void> fetchAll() async {
    final repo = _ref.read(kknRepositoryProvider);
    
    // 1. Tampilkan cache jika ada
    final cachedDashboard = await repo.getCachedDashboard();
    final cachedWarga = await repo.getCachedWargaDampingan();
    
    if (cachedDashboard != null || cachedWarga != null) {
      state = state.copyWith(
        dashboard: cachedDashboard ?? state.dashboard,
        wargaList: cachedWarga ?? state.wargaList,
      );
    } else {
      state = state.copyWith(isLoading: true, errorMessage: null);
    }
    
    try {
      final results = await Future.wait([
        repo.getDashboard(),
        repo.getWargaDampingan(),
      ]);

      final rawWarga = results[1] as List<WargaDampingan>;

      state = state.copyWith(
        isLoading: false,
        dashboard: results[0] as KknDashboardData,
        wargaList: rawWarga,
      );
    } catch (e) {
      if (cachedDashboard != null) {
        state = state.copyWith(isLoading: false);
      } else {
        state = state.copyWith(
          isLoading: false,
          errorMessage: NetworkExceptionHelper.getErrorMessage(e),
        );
      }
    }
  }

  /// Pull-to-refresh.
  Future<void> refresh() => fetchAll();

  /// Alias for fetchAll
  Future<void> fetchDashboardData() => fetchAll();
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

final mahasiswaControllerProvider =
    StateNotifierProvider<MahasiswaNotifier, MahasiswaState>((ref) {
  ref.watch(authProvider.select((s) => s.user?.id));
  return MahasiswaNotifier(ref);
});
