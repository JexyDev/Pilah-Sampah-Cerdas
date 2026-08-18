import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/providers/repository_providers.dart';

class FasilitasKknState {
  final bool isLoading;
  final String? error;

  FasilitasKknState({
    this.isLoading = false,
    this.error,
  });

  FasilitasKknState copyWith({
    bool? isLoading,
    String? error,
    bool clearError = false,
  }) {
    return FasilitasKknState(
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class FasilitasKknController extends StateNotifier<FasilitasKknState> {
  FasilitasKknController(this.ref) : super(FasilitasKknState());

  final Ref ref;

  Future<bool> registerFasilitas({
    required String userId,
    required int rwId,
    required String nama,
    required String jenis,
    required double latitude,
    required double longitude,
    String? imagePath,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final repository = ref.read(kknRepositoryProvider);
      final payload = <String, dynamic>{
        'userId': userId,
        'rwId': rwId,
        'nama': nama,
        'jenis': jenis,
        'latitude': latitude,
        'longitude': longitude,
      };

      await repository.registerFasilitas(payload, imagePath: imagePath);
      
      state = state.copyWith(isLoading: false);
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }
}

final fasilitasKknProvider = StateNotifierProvider<FasilitasKknController, FasilitasKknState>((ref) {
  return FasilitasKknController(ref);
});
