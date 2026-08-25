import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/utils/network_exception_helper.dart';
import '../../../data/providers/repository_providers.dart';
import '../../../data/services/notification_engine.dart';
import '../../auth/controllers/auth_controller.dart';

class WargaAspirasiState {
  final bool isLoading;
  final String? error;
  final bool isSuccess;

  const WargaAspirasiState({
    this.isLoading = false,
    this.error,
    this.isSuccess = false,
  });

  WargaAspirasiState copyWith({
    bool? isLoading,
    String? error,
    bool? isSuccess,
    bool clearError = false,
  }) {
    return WargaAspirasiState(
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
      isSuccess: isSuccess ?? this.isSuccess,
    );
  }
}

class WargaAspirasiNotifier extends StateNotifier<WargaAspirasiState> {
  WargaAspirasiNotifier(this.ref) : super(const WargaAspirasiState());

  final Ref ref;

  Future<bool> submitAspirasi(Map<String, dynamic> data) async {
    state = state.copyWith(isLoading: true, clearError: true, isSuccess: false);
    try {
      final repo = ref.read(pemanfaatanRepositoryProvider);
      final authState = ref.read(authProvider);
      final user = authState.user;
      
      await repo.createFeedback(
        judul: data['judul'] as String,
        isiKritikSaran: data['isiKritikSaran'] as String,
        kategori: data['kategori'] as String?,
        rating: data['rating'] as int?,
        fotoBuktiUrl: data['fotoBuktiUrl'] as String?,
        imagePath: data['imagePath'] as String?,
        rwId: int.tryParse(user?.rw ?? ''),
      );
      
      state = state.copyWith(isLoading: false, isSuccess: true, clearError: true);
      NotificationEngine().showGenericNotification(
        id: DateTime.now().millisecondsSinceEpoch.remainder(10000),
        title: 'Aspirasi Berhasil Terkirim 📬',
        body: 'Kritik dan saran Anda telah diteruskan ke pihak RW.',
      );
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: NetworkExceptionHelper.getErrorMessage(e));
    }
    return false;
  }
}

final wargaAspirasiProvider = StateNotifierProvider<WargaAspirasiNotifier, WargaAspirasiState>((ref) {
  return WargaAspirasiNotifier(ref);
});
