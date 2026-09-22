import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../data/models/mahasiswa_kkn_models.dart';
import '../../../data/models/kkn_timeline_models.dart';
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
    this.timesheetSummary,
    this.kegiatanAktifList = const [],
  });

  final bool isLoading;
  final String? errorMessage;
  final KknDashboardData? dashboard;
  final List<WargaDampingan> wargaList;
  final Map<String, dynamic>? timesheetSummary;
  final List<dynamic> kegiatanAktifList;

  /// Warga yang membutuhkan edukasi ulang (kesalahan > 30%)
  List<WargaDampingan> get wargaNeedReeducation =>
      wargaList.where((w) => w.needsReeducation).toList();

  MahasiswaState copyWith({
    bool? isLoading,
    String? errorMessage,
    KknDashboardData? dashboard,
    List<WargaDampingan>? wargaList,
    Map<String, dynamic>? timesheetSummary,
    List<dynamic>? kegiatanAktifList,
  }) {
    return MahasiswaState(
      isLoading: isLoading ?? this.isLoading,
      errorMessage: errorMessage,
      dashboard: dashboard ?? this.dashboard,
      wargaList: wargaList ?? this.wargaList,
      timesheetSummary: timesheetSummary ?? this.timesheetSummary,
      kegiatanAktifList: kegiatanAktifList ?? this.kegiatanAktifList,
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

    // Sinkronisasi data user (misal perubahan status role Ketua) saat refresh
    _ref.read(authProvider.notifier).fetchProfile();

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

    KknDashboardData? newDashboard;
    List<WargaDampingan>? newWargaList;
    String? lastError;

    try {
      final results = await Future.wait([
        repo.getDashboard().catchError((e) {
          lastError = NetworkExceptionHelper.getErrorMessage(e);
          return cachedDashboard ?? state.dashboard ?? KknDashboardData.empty;
        }),
        repo.getWargaDampingan().catchError((e) {
          lastError ??= NetworkExceptionHelper.getErrorMessage(e);
          return cachedWarga ?? state.wargaList;
        }),
        repo.getTimesheetSummary().catchError((e) {
          return <String, dynamic>{};
        }),
        repo.getKegiatanAktif().catchError((e) {
          return <Map<String, dynamic>>[];
        }),
      ]);

      newDashboard = results[0] as KknDashboardData?;
      newWargaList = results[1] as List<WargaDampingan>?;
      final timesheetSummary = results[2] as Map<String, dynamic>?;
      final rawKegiatan = results[3];
      final kegiatanAktifList =
          rawKegiatan is List ? rawKegiatan : const <dynamic>[];

      state = state.copyWith(
        isLoading: false,
        dashboard: newDashboard ?? state.dashboard,
        wargaList: newWargaList ?? state.wargaList,
        timesheetSummary: timesheetSummary,
        kegiatanAktifList: kegiatanAktifList,
        errorMessage:
            (newDashboard == null &&
                newWargaList == null &&
                cachedDashboard == null &&
                cachedWarga == null)
            ? lastError
            : null,
      );
    } catch (e) {
      if (cachedDashboard != null || cachedWarga != null) {
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

final activeTimelineProvider =
    FutureProvider.autoDispose<ActiveTimelineResponse>((ref) async {
      final repo = ref.read(kknRepositoryProvider);
      return repo.getActiveTimeline();
    });

class PengajuanCountSummary {
  final int izinCount;
  final int sakitCount;
  const PengajuanCountSummary({this.izinCount = 0, this.sakitCount = 0});

  int get totalCount => izinCount + sakitCount;
}

final pengajuanSummaryProvider =
    FutureProvider.autoDispose<PengajuanCountSummary>((ref) async {
      try {
        final repo = ref.read(kknRepositoryProvider);
        final list = await repo.getPengajuanIzin();
        int izin = 0;
        int sakit = 0;

        for (final item in list) {
          if (item is Map<String, dynamic>) {
            final status = (item['status'] ?? '').toString().toUpperCase();
            final isApproved = status == 'APPROVED' || status == 'DISETUJUI';
            if (isApproved) {
              final kat =
                  (item['kategori'] ?? item['category'] ?? item['type'] ?? '')
                      .toString()
                      .toLowerCase();
              if (kat.contains('sakit')) {
                sakit++;
              } else {
                izin++;
              }
            }
          }
        }
        return PengajuanCountSummary(izinCount: izin, sakitCount: sakit);
      } catch (e) {
        return const PengajuanCountSummary();
      }
    });

final pengajuanIzinCountProvider = FutureProvider.autoDispose<int>((ref) async {
  final summary = await ref.watch(pengajuanSummaryProvider.future);
  return summary.totalCount;
});
