import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/models/petugas_residu_models.dart';
import '../../../data/providers/repository_providers.dart';
import '../services/petugas_residu_fcm_service.dart';

class PetugasResiduState {
  const PetugasResiduState({
    this.isLoading = false,
    this.dashboard,
    this.jadwalList = const [],
    this.historyList = const [],
    this.errorMessage,
    this.selectedDateRange = 'HARI_INI',
    this.selectedTypeFilter = 'SEMUA',
  });

  final bool isLoading;
  final PetugasResiduDashboard? dashboard;
  final List<ResiduBinPickup> jadwalList;
  final List<Map<String, dynamic>> historyList;
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

  PetugasResiduState copyWith({
    bool? isLoading,
    PetugasResiduDashboard? dashboard,
    List<ResiduBinPickup>? jadwalList,
    List<Map<String, dynamic>>? historyList,
    String? errorMessage,
    String? selectedDateRange,
    String? selectedTypeFilter,
    bool clearError = false,
  }) {
    return PetugasResiduState(
      isLoading: isLoading ?? this.isLoading,
      dashboard: dashboard ?? this.dashboard,
      jadwalList: jadwalList ?? this.jadwalList,
      historyList: historyList ?? this.historyList,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      selectedDateRange: selectedDateRange ?? this.selectedDateRange,
      selectedTypeFilter: selectedTypeFilter ?? this.selectedTypeFilter,
    );
  }
}

class PetugasResiduNotifier extends StateNotifier<PetugasResiduState> {
  PetugasResiduNotifier(this._ref) : super(const PetugasResiduState()) {
    refreshAll();
    
    // Inisialisasi notifikasi latar belakang khusus role Petugas Residu
    _ref.read(petugasResiduFcmServiceProvider).registerFcmToken();
  }

  final Ref _ref;

  Future<void> refreshAll() async {
    final repo = _ref.read(petugasResiduRepositoryProvider);
    
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
    
    // 2. Fetch fresh from network
    try {
      final results = await Future.wait([
        repo.getDashboard(),
        repo.getJadwalHarian(),
        repo.getHistory(dateRange: state.selectedDateRange, type: state.selectedTypeFilter),
      ]);

      state = state.copyWith(
        isLoading: false,
        dashboard: results[0] as PetugasResiduDashboard,
        jadwalList: results[1] as List<ResiduBinPickup>,
        historyList: results[2] as List<Map<String, dynamic>>,
      );
    } catch (e) {
      if (cachedDash != null) {
        // We have cache, silently ignore error
        state = state.copyWith(isLoading: false);
      } else {
        state = state.copyWith(
          isLoading: false,
          errorMessage: 'Gagal memuat data Petugas Residu: $e',
        );
      }
    }
  }

  Future<void> fetchJadwal({String? kelurahan, String? rw}) async {
    try {
      final repo = _ref.read(petugasResiduRepositoryProvider);
      final list = await repo.getJadwalHarian(kelurahan: kelurahan, rw: rw);
      state = state.copyWith(jadwalList: list);
    } catch (e) {
      state = state.copyWith(errorMessage: 'Gagal memuat jadwal penjemputan.');
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
      final repo = _ref.read(petugasResiduRepositoryProvider);
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
      state = state.copyWith(isLoading: false, errorMessage: 'Gagal mengirim timbangan residu.');
      return false;
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: 'Terjadi kesalahan saat submit log.');
      return false;
    }
  }


  Future<void> setHistoryFilters({String? dateRange, String? type}) async {
    final newDateRange = dateRange ?? state.selectedDateRange;
    final newTypeFilter = type ?? state.selectedTypeFilter;
    
    final repo = _ref.read(petugasResiduRepositoryProvider);
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
      state = state.copyWith(isLoading: false, errorMessage: 'Gagal memuat riwayat.');
    }
  }

  Future<bool> changePassword({
    required String oldPassword,
    required String newPassword,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final repo = _ref.read(petugasResiduRepositoryProvider);
      final success = await repo.changePassword(
        oldPassword: oldPassword,
        newPassword: newPassword,
      );
      state = state.copyWith(isLoading: false);
      return success;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Gagal mengubah kata sandi. Periksa kata sandi lama Anda.',
      );
      return false;
    }
  }
}

final petugasResiduControllerProvider =
    StateNotifierProvider<PetugasResiduNotifier, PetugasResiduState>((ref) {
  return PetugasResiduNotifier(ref);
});
