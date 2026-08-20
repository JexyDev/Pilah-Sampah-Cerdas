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
    bool clearError = false,
    List<JenisFasilitasModel>? jenisList,
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
    state = state.copyWith(isLoadingJenis: true, clearError: true);
    try {
      final repository = ref.read(kknRepositoryProvider);
      final list = await repository.getJenisFasilitas();
      state = state.copyWith(isLoadingJenis: false, jenisList: list);
    } catch (e) {
      state = state.copyWith(isLoadingJenis: false, error: e.toString());
    }
  }

  Future<bool> registerFasilitas({
    required String userId,
    int? rwId,
    required String nama,
    required String jenis,
    required double latitude,
    required double longitude,
    required String imagePath,
    double? kapasitas,
    String? alamat,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final repository = ref.read(kknRepositoryProvider);
      final payload = <String, dynamic>{
        'userId': userId,
        'nama': nama,
        'jenis': jenis,
        'latitude': latitude,
        'longitude': longitude,
        if (rwId != null) 'rwId': rwId,
        if (kapasitas != null) 'kapasitas': kapasitas,
        if (alamat != null) 'alamat': alamat,
      };

      await repository.registerFasilitas(payload, imagePath: imagePath);
      
      state = state.copyWith(isLoading: false);
      return true;
    } catch (e) {
      final cleanMsg = e.toString().replaceAll('Exception: ', '');
      state = state.copyWith(isLoading: false, error: cleanMsg);
      return false;
    }
  }
}

final fasilitasKknProvider = StateNotifierProvider<FasilitasKknController, FasilitasKknState>((ref) {
  return FasilitasKknController(ref);
});
