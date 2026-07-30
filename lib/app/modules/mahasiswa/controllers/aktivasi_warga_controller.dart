import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import '../../../data/providers/repository_providers.dart';
import '../../../core/utils/platform_utils.dart';

class AktivasiWargaState {
  final bool isLoading;
  final String? errorMessage;
  final List<dynamic> wargaList;
  final String? selectedKelurahan;
  final String? selectedRtRw;
  final String searchQuery;

  AktivasiWargaState({
    this.isLoading = false,
    this.errorMessage,
    this.wargaList = const [],
    this.selectedKelurahan,
    this.selectedRtRw,
    this.searchQuery = '',
  });

  AktivasiWargaState copyWith({
    bool? isLoading,
    String? errorMessage,
    List<dynamic>? wargaList,
    String? selectedKelurahan,
    String? selectedRtRw,
    String? searchQuery,
    bool clearError = false,
  }) {
    return AktivasiWargaState(
      isLoading: isLoading ?? this.isLoading,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      wargaList: wargaList ?? this.wargaList,
      selectedKelurahan: selectedKelurahan ?? this.selectedKelurahan,
      selectedRtRw: selectedRtRw ?? this.selectedRtRw,
      searchQuery: searchQuery ?? this.searchQuery,
    );
  }
}

class AktivasiWargaNotifier extends StateNotifier<AktivasiWargaState> {
  AktivasiWargaNotifier(this.ref) : super(AktivasiWargaState()) {
    fetchWarga();
  }

  final Ref ref;

  void setFilter({String? kelurahan, String? rtRw, String? search}) {
    state = state.copyWith(
      selectedKelurahan: kelurahan ?? state.selectedKelurahan,
      selectedRtRw: rtRw ?? state.selectedRtRw,
      searchQuery: search ?? state.searchQuery,
    );
    fetchWarga();
  }

  Future<void> fetchWarga() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final repo = ref.read(kknRepositoryProvider);
      final data = await repo.getWargaForAktivasi(
        kelurahan: state.selectedKelurahan == 'Semua' ? null : state.selectedKelurahan,
        rtRw: state.selectedRtRw == 'Semua' ? null : state.selectedRtRw,
        search: state.searchQuery,
      );
      state = state.copyWith(isLoading: false, wargaList: data);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Error: $e',
      );
    }
  }

  Future<bool> activateWarga(String wargaId, String qrCode) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      double lat = 0.0;
      double lng = 0.0;
      
      if (PlatformUtils.isMobile) {
        try {
          final pos = await Geolocator.getCurrentPosition(
            locationSettings: const LocationSettings(
              accuracy: LocationAccuracy.medium,
              timeLimit: Duration(seconds: 10),
            ),
          );
          lat = pos.latitude;
          lng = pos.longitude;
        } catch (_) {
          // Fallback if GPS fails
        }
      }

      final repo = ref.read(kknRepositoryProvider);
      final isSuccess = await repo.activateWargaByScan(wargaId, qrCode, lat, lng);

      if (isSuccess) {
        await fetchWarga(); // Refresh list after success
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          errorMessage: 'Gagal mengaktivasi warga.',
        );
        return false;
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Terjadi kesalahan saat mengaktivasi.',
      );
      return false;
    }
  }

  Future<bool> activateBin(String wargaId, String binOrganikId, String binAnorganikId) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final repo = ref.read(kknRepositoryProvider);
      final isSuccess = await repo.activateBin(wargaId, binOrganikId, binAnorganikId);

      if (isSuccess) {
        await fetchWarga(); // Refresh list after success
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          errorMessage: 'Gagal mengaktivasi bin warga.',
        );
        return false;
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Terjadi kesalahan saat mengaktivasi bin.',
      );
      return false;
    }
  }
}

final aktivasiWargaProvider = StateNotifierProvider<AktivasiWargaNotifier, AktivasiWargaState>((ref) {
  return AktivasiWargaNotifier(ref);
});
