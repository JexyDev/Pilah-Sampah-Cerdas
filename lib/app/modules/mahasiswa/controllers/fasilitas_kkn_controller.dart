import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/models/mahasiswa_kkn_models.dart';
import '../../../data/providers/repository_providers.dart';

class FasilitasKknState {
  final bool isLoading;
  final bool isLoadingJenis;
  final String? error;
  final List<JenisFasilitasModel> jenisList;

  FasilitasKknState({
    this.isLoading = false,
    this.isLoadingJenis = false,
    this.error,
    this.jenisList = const [],
  });

  FasilitasKknState copyWith({
    bool? isLoading,
    bool? isLoadingJenis,
    String? error,
    List<JenisFasilitasModel>? jenisList,
    bool clearError = false,
  }) {
    return FasilitasKknState(
      isLoading: isLoading ?? this.isLoading,
      isLoadingJenis: isLoadingJenis ?? this.isLoadingJenis,
      error: clearError ? null : (error ?? this.error),
      jenisList: jenisList ?? this.jenisList,
    );
  }
}

class FasilitasKknController extends StateNotifier<FasilitasKknState> {
  FasilitasKknController(this.ref) : super(FasilitasKknState()) {
    loadJenisFasilitas();
  }

  final Ref ref;

  Future<void> loadJenisFasilitas() async {
    state = state.copyWith(isLoadingJenis: true);
    try {
      final repository = ref.read(kknRepositoryProvider);
      final list = await repository.getJenisFasilitas();
      state = state.copyWith(isLoadingJenis: false, jenisList: list);
    } catch (_) {
      state = state.copyWith(isLoadingJenis: false);
    }
  }

  Future<bool> registerFasilitas({
    required String userId,
    int? rwId,
    required String nama,
    required String jenis,
    required double latitude,
    required double longitude,
    String? imagePath,
    String? alamat,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final repository = ref.read(kknRepositoryProvider);
      final payload = <String, dynamic>{
        'userId': userId,
        if (rwId != null && rwId > 0) 'rwId': rwId,
        'nama': nama,
        'jenis': jenis,
        'latitude': latitude,
        'longitude': longitude,
        if (alamat != null && alamat.isNotEmpty) 'alamat': alamat,
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
