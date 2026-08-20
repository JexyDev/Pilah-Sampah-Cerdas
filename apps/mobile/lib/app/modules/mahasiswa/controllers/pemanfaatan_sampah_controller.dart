import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/models/mahasiswa_kkn_models.dart';
import '../../../data/providers/repository_providers.dart';
import '../../../data/services/firebase_notification_service.dart';
import '../../../data/services/local_notification_cache_service.dart';
import '../../../core/utils/network_exception_helper.dart';
import '../../auth/controllers/auth_controller.dart';
import '../../../data/services/notification_engine.dart';
import 'mahasiswa_notifikasi_controller.dart';

class PemanfaatanSampahState {
  final bool isLoading;
  final String? error;
  final bool isSuccess;

  const PemanfaatanSampahState({
    this.isLoading = false,
    this.error,
    this.isSuccess = false,
  });

  PemanfaatanSampahState copyWith({
    bool? isLoading,
    String? error,
    bool? isSuccess,
    bool clearError = false,
  }) {
    return PemanfaatanSampahState(
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
      isSuccess: isSuccess ?? this.isSuccess,
    );
  }
}

class PemanfaatanSampahNotifier extends StateNotifier<PemanfaatanSampahState> {
  PemanfaatanSampahNotifier(this.ref) : super(const PemanfaatanSampahState());

  final Ref ref;

  Future<bool> submitLaporan(PemanfaatanSampahRequest request) async {
    state = state.copyWith(isLoading: true, clearError: true, isSuccess: false);
    try {
      final repo = ref.read(kknRepositoryProvider);
      final ok = await repo.submitPemanfaatanSampah(request);
      if (ok) {
        state = state.copyWith(isLoading: false, isSuccess: true, clearError: true);

        final user = ref.read(authProvider).user;
        if (user != null) {
          await FirebaseNotificationService().saveNotification(
            userId: user.id,
            role: user.role.name,
            title: 'Laporan Pemanfaatan Sampah Tersimpan ♻️',
            desc: 'Laporan ${request.jenisPemanfaatan} di ${request.wilayahDampingan} berhasil dikirim.',
            type: 'LAPORAN_PEMANFAATAN',
          );
          LocalNotificationCacheService().addNotification(
            userId: user.id,
            role: user.role.name,
            title: 'Laporan Pemanfaatan Sampah Tersimpan ♻️',
            desc: 'Laporan ${request.jenisPemanfaatan} di ${request.wilayahDampingan} berhasil dikirim.',
            type: 'LAPORAN_PEMANFAATAN',
          );
        }
        
        NotificationEngine().showGenericNotification(
          id: DateTime.now().millisecondsSinceEpoch.remainder(10000),
          title: 'Laporan Pemanfaatan Sampah Tersimpan ♻️',
          body: 'Laporan ${request.jenisPemanfaatan} berhasil dikirim dan ditambahkan ke poin Anda.',
        );

        ref.invalidate(mahasiswaNotificationsProvider);
        return true;
      }
    } catch (e) {
      state = state.copyWith(isLoading: false, error: NetworkExceptionHelper.getErrorMessage(e));
    }
    return false;
  }
}

final pemanfaatanSampahProvider =
    StateNotifierProvider<PemanfaatanSampahNotifier, PemanfaatanSampahState>((ref) {
  return PemanfaatanSampahNotifier(ref);
});
