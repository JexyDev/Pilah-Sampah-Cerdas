import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../data/models/mahasiswa_kkn_models.dart';
import '../../../data/providers/repository_providers.dart';
import '../../../modules/auth/controllers/auth_controller.dart';
import '../../../core/values/app_colors.dart';
import 'kelompok_kkn_controller.dart';
import 'package:flutter/material.dart';

// ─────────────────────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────────────────────

class DetailWargaState {
  const DetailWargaState({this.warga});

  final WargaDampingan? warga;

  /// Total berat sampah yang sudah dipilah (kg)
  double get totalWeightKg =>
      warga?.recentLogs.fold<double>(0, (sum, e) => sum + e.weightKg) ?? 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Controller (StateNotifier)
// ─────────────────────────────────────────────────────────────────────────────

class DetailWargaNotifier extends StateNotifier<DetailWargaState> {
  DetailWargaNotifier(this.ref) : super(const DetailWargaState());

  final Ref ref;

  /// Set data warga dari navigasi argument (data sudah ada di memori).
  void setWarga(WargaDampingan warga) {
    state = DetailWargaState(warga: warga);
  }

  /// Mengklaim warga dampingan
  Future<void> claimWarga(BuildContext context) async {
    final wargaId = state.warga?.wargaId;
    if (wargaId == null) return;

    try {
      final repo = ref.read(kknRepositoryProvider);
      final response = await repo.claimWarga(wargaId);

      final data = response['data'];
      int pointsEarned = 0;
      
      if (data is Map<String, dynamic>) {
        final gamification = data['gamification'];
        if (gamification is Map<String, dynamic>) {
          pointsEarned = (gamification['pointsEarned'] as num?)?.toInt() ?? 0;
        }
      }

      // Update state locally (fake refresh for UX)
      if (state.warga != null) {
        final currentUser = ref.read(authProvider).user;
        final updatedWarga = WargaDampingan(
          wargaId: state.warga!.wargaId,
          binId: state.warga!.binId,
          wargaName: state.warga!.wargaName,
          address: state.warga!.address,
          kecamatan: state.warga!.kecamatan,
          kelurahan: state.warga!.kelurahan,
          rw: state.warga!.rw,
          mahasiswaId: currentUser?.id ?? state.warga!.mahasiswaId,
          pendampingName: currentUser?.name ?? 'Anda',
          status: state.warga!.status,
          recentLogs: state.warga!.recentLogs,
          isActivated: state.warga!.isActivated,
          role: state.warga!.role,
          totalPoints: state.warga!.totalPoints,
          apiCorrectPercentage: state.warga!.apiCorrectPercentage,
        );
        state = DetailWargaState(warga: updatedWarga);
      }

      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Klaim berhasil! +$pointsEarned Poin ✨'),
            backgroundColor: AppColors.primaryGreen,
          ),
        );
      }

      // Refresh list di halaman sebelumnya
      ref.read(kelompokKknProvider.notifier).fetchKelompok();
    } catch (e) {
      if (context.mounted) {
        String msg = e.toString().replaceAll('Exception: ', '');
        if (msg.contains('NO_ACTIVE_BINS')) {
          msg = 'Warga tidak memiliki tempat sampah aktif untuk diklaim.';
        } else if (msg.contains('ALREADY_CLAIMED')) {
          msg = 'Warga ini sudah diklaim oleh mahasiswa lain.';
        }
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(msg), backgroundColor: AppColors.maroonRed),
        );
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

final detailWargaControllerProvider =
    StateNotifierProvider<DetailWargaNotifier, DetailWargaState>((ref) {
      return DetailWargaNotifier(ref);
    });
