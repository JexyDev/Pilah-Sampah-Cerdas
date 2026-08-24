import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/models/mahasiswa_kkn_models.dart';
import '../../../data/providers/repository_providers.dart';

class FasilitasKknState {
  final bool isLoading;
  final String? error;
  final List<JenisFasilitas> jenisFasilitasList;
  final bool isLoadingJenis;

  FasilitasKknState({
    this.isLoading = false,
    this.error,
    this.jenisFasilitasList = const [],
    this.isLoadingJenis = false,
  });

  FasilitasKknState copyWith({
    bool? isLoading,
    String? error,
    bool clearError = false,
    List<JenisFasilitas>? jenisFasilitasList,
    bool? isLoadingJenis,
  }) {
    return FasilitasKknState(
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
      jenisFasilitasList: jenisFasilitasList ?? this.jenisFasilitasList,
      isLoadingJenis: isLoadingJenis ?? this.isLoadingJenis,
    );
  }
}

class FasilitasKknController extends StateNotifier<FasilitasKknState> {
  FasilitasKknController(this.ref) : super(FasilitasKknState());

  final Ref ref;

  /// Mengambil master data jenis fasilitas dari backend.
  /// Dipanggil saat halaman register fasilitas pertama kali dibuka.
  Future<void> fetchJenisFasilitas() async {
    if (state.jenisFasilitasList.isNotEmpty) return; // Sudah pernah di-load
    state = state.copyWith(isLoadingJenis: true);
    try {
      final repository = ref.read(kknRepositoryProvider);
      final list = await repository.getJenisFasilitas();
      state = state.copyWith(
        jenisFasilitasList: list,
        isLoadingJenis: false,
      );
    } catch (e) {
      state = state.copyWith(isLoadingJenis: false, error: e.toString());
    }
  }

  /// Mendaftarkan fasilitas warga.
  /// - `rwId` tidak dikirim — backend resolve dari data mahasiswa (JWT).
  /// - `imagePath` wajib — foto fasilitas harus ada.
  Future<bool> registerFasilitas({
    required String nama,
    required String pic,
    required String kontak,
    required int kapasitas,
    required String alamat,
    required int rwId,
    required String jenis,
    required double latitude,
    required double longitude,
    required String imagePath,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final repository = ref.read(kknRepositoryProvider);
      final payload = <String, dynamic>{
        'jenis': jenis,
        'nama': nama,
        'pic': pic,
        'kontak': kontak,
        'kapasitas': kapasitas,
        'latitude': latitude,
        'longitude': longitude,
        'alamat': alamat,
        'rwId': rwId,
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
