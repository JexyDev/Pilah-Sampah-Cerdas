import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/models/mahasiswa_kkn_models.dart';
import '../../../data/providers/repository_providers.dart';

class PoskoKknState {
  final bool isLoading;
  final String? error;
  final PoskoKknResponse? poskoResponse;

  PoskoKknState({
    this.isLoading = false,
    this.error,
    this.poskoResponse,
  });

  PoskoKknState copyWith({
    bool? isLoading,
    String? error,
    PoskoKknResponse? poskoResponse,
    bool clearError = false,
  }) {
    return PoskoKknState(
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
      poskoResponse: poskoResponse ?? this.poskoResponse,
    );
  }
}

class PoskoKknController extends StateNotifier<PoskoKknState> {
  PoskoKknController(this.ref) : super(PoskoKknState()) {
    fetchPosko();
  }

  final Ref ref;

  Future<void> fetchPosko() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final repository = ref.read(kknRepositoryProvider);
      final response = await repository.getPoskoMe();
      state = state.copyWith(isLoading: false, poskoResponse: response);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<bool> registerPosko({
    required double latitude,
    required double longitude,
    String? nama,
    String? alamat,
    int? rwId,
    String? imagePath,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final repository = ref.read(kknRepositoryProvider);
      final payload = <String, dynamic>{
        'latitude': latitude,
        'longitude': longitude,
      };
      
      if (nama != null && nama.isNotEmpty) payload['nama'] = nama;
      if (alamat != null && alamat.isNotEmpty) payload['alamat'] = alamat;
      if (rwId != null) payload['rwId'] = rwId;

      await repository.registerPosko(payload, imagePath: imagePath);
      
      state = state.copyWith(isLoading: false);
      // Refresh data
      await fetchPosko();
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }
}

final poskoKknProvider = StateNotifierProvider<PoskoKknController, PoskoKknState>((ref) {
  return PoskoKknController(ref);
});
