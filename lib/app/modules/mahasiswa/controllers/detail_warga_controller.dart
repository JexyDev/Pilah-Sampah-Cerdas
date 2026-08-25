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
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

final detailWargaControllerProvider =
    StateNotifierProvider<DetailWargaNotifier, DetailWargaState>((ref) {
      return DetailWargaNotifier(ref);
    });
