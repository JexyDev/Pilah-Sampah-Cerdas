import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import '../../../data/models/mahasiswa_kkn_models.dart';
import '../../../data/providers/repository_providers.dart';
import 'mahasiswa_controller.dart';
import '../../../core/utils/platform_utils.dart';
import '../../../core/utils/network_exception_helper.dart';
import '../../auth/controllers/auth_controller.dart';

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

  /// Fetch dengan kelurahan & rw eksplisit dari user yang sudah login.
  /// Dipanggil dari view setelah auth state terkonfirmasi.
  Future<void> fetchWargaWithRegion({
    required String kelurahan,
    required String rw,
    String search = '',
  }) async {
    state = state.copyWith(
      isLoading: true,
      clearError: true,
      selectedKelurahan: kelurahan,
      selectedRtRw: rw,
      searchQuery: search,
    );
    try {
      final user = ref.read(authProvider).user;
      final repo = ref.read(kknRepositoryProvider);

      String cleanRw(String val) => val.replaceAll(RegExp(r'[^\d]'), '').replaceFirst(RegExp(r'^0+'), '');
      String cleanKel(String val) => val.toLowerCase().replaceAll('kel.', '').replaceAll('kelurahan', '').replaceAll('desa', '').trim();

      final targetRwClean = cleanRw(rw);
      final targetKelClean = cleanKel(kelurahan);

      var data = await repo.getWargaForAktivasi(
        kecamatan: user?.kecamatan,
        kelurahan: kelurahan.isEmpty ? null : kelurahan,
        rw: rw.isEmpty ? null : rw,
        search: search.isEmpty ? null : search,
      );

      // Jika kosong, coba query dengan format RW bersih (hanya angka)
      if (data.isEmpty && rw.isNotEmpty) {
        data = await repo.getWargaForAktivasi(
          kecamatan: user?.kecamatan,
          kelurahan: targetKelClean.isEmpty ? null : targetKelClean,
          rw: targetRwClean.isEmpty ? null : targetRwClean,
          search: search.isEmpty ? null : search,
        );
      }

      // Fallback: Jika backend tetap kosong atau mengembalikan data umum, lakukan filter ketat
      if (data.isEmpty && (kelurahan.isNotEmpty || rw.isNotEmpty)) {
        final allRaw = await repo.getWargaForAktivasi(
          search: search.isEmpty ? null : search,
        );
        data = allRaw.where((e) {
          final w = e is WargaDampingan ? e : WargaDampingan.fromJson(e as Map<String, dynamic>);
          final wRw = cleanRw(w.rw);
          final wKel = cleanKel(w.kelurahan);
          final wAddr = w.address.toLowerCase();

          final rwMatches = targetRwClean.isEmpty || wRw == targetRwClean || wAddr.contains('rw $targetRwClean') || wAddr.contains('rw 0$targetRwClean');
          final kelMatches = targetKelClean.isEmpty || wKel.contains(targetKelClean) || targetKelClean.contains(wKel) || wAddr.contains(targetKelClean);

          return rwMatches && kelMatches;
        }).toList();
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
    final rw = state.selectedRtRw ?? '';
    await fetchWargaWithRegion(
      kelurahan: kel,
      rw: rw,
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
              timeLimit: Duration(seconds: 8),
            ),
          );
          lat = pos.latitude;
          lng = pos.longitude;
        } catch (_) {
          final lastPos = await Geolocator.getLastKnownPosition();
          if (lastPos != null) {
            lat = lastPos.latitude;
            lng = lastPos.longitude;
          }
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
          // Request permission lokasi jika belum diizinkan
          LocationPermission perm = await Geolocator.checkPermission();
          if (perm == LocationPermission.denied) {
            perm = await Geolocator.requestPermission();
          }

          if (perm == LocationPermission.whileInUse || perm == LocationPermission.always) {
            final pos = await Geolocator.getCurrentPosition(
              locationSettings: const LocationSettings(
                accuracy: LocationAccuracy.high,
                timeLimit: Duration(seconds: 8),
              ),
            );
            lat = pos.latitude;
            lng = pos.longitude;
          }
        } catch (gpsErr) {
          debugPrint('[AktivasiWarga] GPS warning: $gpsErr, trying last known position...');
          try {
            final lastPos = await Geolocator.getLastKnownPosition();
            if (lastPos != null) {
              lat = lastPos.latitude;
              lng = lastPos.longitude;
            }
          } catch (_) {}
        }
      }

      final repo = ref.read(kknRepositoryProvider);
      final isSuccess = await repo.activateBin(wargaId, binOrganikId, binAnorganikId, lat: lat, lng: lng);

      if (isSuccess) {
        await refresh(); // Refresh list after success
        // MUST refresh the home dashboard to update points and citizens list!
        ref.read(mahasiswaControllerProvider.notifier).refresh();
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

/// autoDispose: state reset setiap kali halaman Aktivasi Tempat Sampah dibuka baru.
final aktivasiWargaProvider = StateNotifierProvider.autoDispose<AktivasiWargaNotifier, AktivasiWargaState>((ref) {
  return AktivasiWargaNotifier(ref);
});
