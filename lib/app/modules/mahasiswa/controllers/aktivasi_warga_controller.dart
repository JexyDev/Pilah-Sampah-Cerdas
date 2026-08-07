import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import '../../../data/providers/repository_providers.dart';
import '../../../core/utils/platform_utils.dart';
import '../../../core/utils/network_exception_helper.dart';

class AktivasiWargaState {
  final bool isLoading;
  final String? errorMessage;
  final List<dynamic> wargaList;
  final String? selectedKelurahan;
  final String? selectedRtRw;
  final String searchQuery;
  final bool hasFetched;

  AktivasiWargaState({
    this.isLoading = false,
    this.errorMessage,
    this.wargaList = const [],
    this.selectedKelurahan,
    this.selectedRtRw,
    this.searchQuery = '',
    this.hasFetched = false,
  });

  AktivasiWargaState copyWith({
    bool? isLoading,
    String? errorMessage,
    List<dynamic>? wargaList,
    String? selectedKelurahan,
    String? selectedRtRw,
    String? searchQuery,
    bool? hasFetched,
    bool clearError = false,
  }) {
    return AktivasiWargaState(
      isLoading: isLoading ?? this.isLoading,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      wargaList: wargaList ?? this.wargaList,
      selectedKelurahan: selectedKelurahan ?? this.selectedKelurahan,
      selectedRtRw: selectedRtRw ?? this.selectedRtRw,
      searchQuery: searchQuery ?? this.searchQuery,
      hasFetched: hasFetched ?? this.hasFetched,
    );
  }
}

class AktivasiWargaNotifier extends StateNotifier<AktivasiWargaState> {
  // Constructor tanpa auto-fetch — view yang bertanggung jawab memanggil
  // fetchWargaWithRegion() setelah auth state dijamin sudah ada.
  AktivasiWargaNotifier(this.ref) : super(AktivasiWargaState());

  final Ref ref;

  /// Fetch dengan kelurahan & rtRw eksplisit dari user yang sudah login.
  /// Dipanggil dari view setelah auth state terkonfirmasi.
  Future<void> fetchWargaWithRegion({
    required String kelurahan,
    required String rtRw,
    String search = '',
  }) async {
    state = state.copyWith(
      isLoading: true,
      clearError: true,
      selectedKelurahan: kelurahan,
      selectedRtRw: rtRw,
      searchQuery: search,
    );
    try {
      final repo = ref.read(kknRepositoryProvider);
      var data = await repo.getWargaForAktivasi(
        kelurahan: kelurahan.isEmpty ? null : kelurahan,
        rtRw: rtRw.isEmpty ? null : rtRw,
        search: search.isEmpty ? null : search,
      );

      // Fallback: Jika data kosong karena perbedaan format string kelurahan/rtRw di DB backend,
      // panggil ulang tanpa parameter region agar data warga binaan tetap muncul.
      if (data.isEmpty && (kelurahan.isNotEmpty || rtRw.isNotEmpty)) {
        data = await repo.getWargaForAktivasi(
          search: search.isEmpty ? null : search,
        );
      }

      state = state.copyWith(
        isLoading: false,
        wargaList: data,
        hasFetched: true,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Gagal memuat data warga: $e',
        hasFetched: true,
      );
    }
  }

  /// Refresh dengan parameter yang sudah tersimpan di state.
  Future<void> refresh() async {
    final kel = state.selectedKelurahan ?? '';
    final rt = state.selectedRtRw ?? '';
    await fetchWargaWithRegion(
      kelurahan: kel,
      rtRw: rt,
      search: state.searchQuery,
    );
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
        await refresh(); // Refresh list after success
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          errorMessage: 'Gagal mengaktivasi warga. Mohon periksa kembali QR Code.',
        );
        return false;
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: NetworkExceptionHelper.getErrorMessage(e),
      );
      return false;
    }
  }

  Future<bool> activateBin(String wargaId, String binOrganikId, String binAnorganikId) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      double lat = 0.0;
      double lng = 0.0;

      if (PlatformUtils.isMobile) {
        try {
          final pos = await Geolocator.getCurrentPosition(
            locationSettings: const LocationSettings(
              accuracy: LocationAccuracy.high,
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
      final isSuccess = await repo.activateBin(wargaId, binOrganikId, binAnorganikId, lat: lat, lng: lng);

      if (isSuccess) {
        await refresh(); // Refresh list after success
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          errorMessage: 'Gagal mengaktivasi tempat sampah warga. QR Code mungkin sudah diaktivasi sebelumnya.',
        );
        return false;
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: NetworkExceptionHelper.getErrorMessage(e),
      );
      return false;
    }
  }
}

/// autoDispose: state reset setiap kali halaman Aktivasi Bin dibuka baru.
final aktivasiWargaProvider = StateNotifierProvider.autoDispose<AktivasiWargaNotifier, AktivasiWargaState>((ref) {
  return AktivasiWargaNotifier(ref);
});
