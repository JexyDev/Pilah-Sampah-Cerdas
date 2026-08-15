import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/utils/network_exception_helper.dart';
import '../../../data/models/petugas_pemilahan_models.dart';
import '../../../data/providers/repository_providers.dart';
import '../services/petugas_pemilahan_fcm_service.dart';

class PetugasPemilahanState {
  const PetugasPemilahanState({
    this.isLoading = false,
    this.dashboard,
    this.jadwalList = const [],
    this.historyList = const [],
    this.pengajuanList = const [],
    this.errorMessage,
    this.selectedDateRange = 'HARI_INI',
    this.selectedTypeFilter = 'SEMUA',
  });

  final bool isLoading;
  final PetugasPemilahanDashboard? dashboard;
  final List<PemilahanBinPickup> jadwalList;
  final List<Map<String, dynamic>> historyList;
  final List<Map<String, dynamic>> pengajuanList;
  final String? errorMessage;
  final String selectedDateRange;
  final String selectedTypeFilter;

  /// Window waktu penjemputan: 06:00–08:00 dan 16:00–18:00
  bool get isPickupWindowActive {
    final now = DateTime.now();
    final hour = now.hour;
    // 06:00 - 08:00 (hour 6 dan 7)
    // 16:00 - 18:00 (hour 16 dan 17)
    return (hour >= 6 && hour < 8) || (hour >= 16 && hour < 18);
  }

  PetugasPemilahanState copyWith({
    bool? isLoading,
    PetugasPemilahanDashboard? dashboard,
    List<PemilahanBinPickup>? jadwalList,
    List<Map<String, dynamic>>? historyList,
    List<Map<String, dynamic>>? pengajuanList,
    String? errorMessage,
    String? selectedDateRange,
    String? selectedTypeFilter,
    bool clearError = false,
  }) {
    return PetugasPemilahanState(
      isLoading: isLoading ?? this.isLoading,
      dashboard: dashboard ?? this.dashboard,
      jadwalList: jadwalList ?? this.jadwalList,
      historyList: historyList ?? this.historyList,
      pengajuanList: pengajuanList ?? this.pengajuanList,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      selectedDateRange: selectedDateRange ?? this.selectedDateRange,
      selectedTypeFilter: selectedTypeFilter ?? this.selectedTypeFilter,
    );
  }
}

class PetugasPemilahanNotifier extends StateNotifier<PetugasPemilahanState> {
  PetugasPemilahanNotifier(this._ref) : super(const PetugasPemilahanState()) {
    refreshAll();
    
    // Inisialisasi notifikasi latar belakang khusus role Petugas Pemilahan
    _ref.read(petugasPemilahanFcmServiceProvider).registerFcmToken();
  }

  final Ref _ref;


  Future<void> refreshAll() async {
    final repo = _ref.read(petugasPemilahanRepositoryProvider);
    
    // 1. Load from cache first
    final cachedDash = await repo.getCachedDashboard();
    final cachedJadwal = await repo.getCachedJadwalHarian();
    final cachedHistory = await repo.getCachedHistory(dateRange: state.selectedDateRange, type: state.selectedTypeFilter);
    
    if (cachedDash != null || cachedJadwal != null || cachedHistory != null) {
      state = state.copyWith(
        dashboard: cachedDash ?? state.dashboard,
        jadwalList: cachedJadwal ?? state.jadwalList,
        historyList: cachedHistory ?? state.historyList,
      );
    } else {
      state = state.copyWith(isLoading: true, clearError: true);
    }
    
    // 2. Fetch fresh from network progressively
    repo.getDashboard().then((dash) {
      if (mounted) state = state.copyWith(dashboard: dash, isLoading: false);
    }).catchError((_) {
      if (mounted && cachedDash == null) state = state.copyWith(isLoading: false);
    });

    repo.getJadwalHarian().then((jadwal) {
      if (mounted) state = state.copyWith(jadwalList: jadwal, isLoading: false);
    }).catchError((_) {
      if (mounted && cachedJadwal == null) state = state.copyWith(isLoading: false);
    });

    // Fetch Daftar Pengajuan Warga
    repo.getDaftarPengajuanWarga().then((pengajuan) {
      if (mounted) state = state.copyWith(pengajuanList: pengajuan, isLoading: false);
    }).catchError((_) {
      if (mounted) state = state.copyWith(isLoading: false);
    });

    _fetchHistoryFresh(repo);
  }

  Future<void> _fetchHistoryFresh(var repo) async {
    try {
      final history = await repo.getHistory(dateRange: state.selectedDateRange, type: state.selectedTypeFilter);
      if (mounted) state = state.copyWith(historyList: history, isLoading: false);
    } catch (_) {
      if (mounted && state.historyList.isEmpty) state = state.copyWith(isLoading: false);
    }
  }

  Future<void> fetchJadwal({String? kelurahan, String? rw}) async {
    try {
      final repo = _ref.read(petugasPemilahanRepositoryProvider);
      final list = await repo.getJadwalHarian(kelurahan: kelurahan, rw: rw);
      state = state.copyWith(jadwalList: list);
    } catch (e) {
      state = state.copyWith(errorMessage: NetworkExceptionHelper.getErrorMessage(e));
    }
  }

  Future<bool> submitLog({
    required String binId,
    required double actualWeightKg,
    required String classification,
    required String photoPath,
    double? latitude,
    double? longitude,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final repo = _ref.read(petugasPemilahanRepositoryProvider);
      final success = await repo.submitLog(
        binId: binId,
        actualWeightKg: actualWeightKg,
        classification: classification,
        photoPath: photoPath,
        latitude: latitude,
        longitude: longitude,
      );

      if (success) {
        await refreshAll();
        return true;
      }
      state = state.copyWith(isLoading: false, errorMessage: 'Gagal mengirim timbangan pemilahan.');
      return false;
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: NetworkExceptionHelper.getErrorMessage(e));
      return false;
    }
  }

  Future<void> setHistoryFilters({String? dateRange, String? type}) async {
    final newDateRange = dateRange ?? state.selectedDateRange;
    final newTypeFilter = type ?? state.selectedTypeFilter;
    
    final repo = _ref.read(petugasPemilahanRepositoryProvider);
    final cachedList = await repo.getCachedHistory(dateRange: newDateRange, type: newTypeFilter);
    if (cachedList != null && cachedList.isNotEmpty) {
      state = state.copyWith(
        selectedDateRange: newDateRange,
        selectedTypeFilter: newTypeFilter,
        historyList: cachedList,
      );
    } else {
      state = state.copyWith(
        selectedDateRange: newDateRange,
        selectedTypeFilter: newTypeFilter,
        isLoading: true,
      );
    }
    
    try {
      final list = await repo.getHistory(
        dateRange: newDateRange,
        type: newTypeFilter,
      );
      state = state.copyWith(isLoading: false, historyList: list);
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: NetworkExceptionHelper.getErrorMessage(e));
    }
  }

  Future<bool> changePassword({
    required String oldPassword,
    required String newPassword,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final repo = _ref.read(petugasPemilahanRepositoryProvider);
      final success = await repo.changePassword(
        oldPassword: oldPassword,
        newPassword: newPassword,
      );
      state = state.copyWith(isLoading: false);
      return success;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: NetworkExceptionHelper.getErrorMessage(e),
      );
      return false;
    }
  }

  Future<bool> claimPengajuanReset(String pengajuanId) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final repo = _ref.read(petugasPemilahanRepositoryProvider);
      final ok = await repo.claimPengajuanReset(pengajuanId);
      await refreshAll();
      state = state.copyWith(isLoading: false);
      return ok;
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: NetworkExceptionHelper.getErrorMessage(e));
      return false;
    }
  }
}

final petugasPemilahanControllerProvider =
    StateNotifierProvider<PetugasPemilahanNotifier, PetugasPemilahanState>((ref) {
  return PetugasPemilahanNotifier(ref);
});

