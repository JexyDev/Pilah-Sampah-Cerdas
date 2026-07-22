/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/entities/waste_log_entity.dart';
import '../../domain/entities/point_history_entity.dart';
import 'repository_providers.dart';
import 'auth_provider.dart';

/// Provider riwayat setoran sampah.
/// Menggunakan GET /api/v1/transactions/deposits (global, bukan per-user).
final wasteLogsProvider = FutureProvider<List<WasteLogEntity>>((ref) async {
  final repo = ref.watch(wasteLogRepositoryProvider);
  final userId = ref.watch(authProvider).user?.id ?? '';
  return repo.getWasteLogsByUser(userId);
});

/// Provider riwayat poin milik user yang sedang login.
/// Menggunakan GET /api/v1/points/me → data.history
final pointHistoryProvider = FutureProvider<List<PointHistoryEntity>>((
  ref,
) async {
  final repo = ref.watch(wasteLogRepositoryProvider);
  final userId = ref.watch(authProvider).user?.id ?? '';
  return repo.getPointHistoryByUser(userId);
});

/// Provider total poin yang diperoleh hari ini (dari pointHistory createdAt = today).
final dailyPointsProvider = FutureProvider<int>((ref) async {
  final history = await ref.watch(pointHistoryProvider.future);
  final today = DateTime.now();
  return history
      .where(
        (h) =>
            h.createdAt.year == today.year &&
            h.createdAt.month == today.month &&
            h.createdAt.day == today.day,
      )
      .fold<int>(0, (sum, h) => sum + h.points);
});
final totalPointsProvider = FutureProvider<int>((ref) async {
  final repo = ref.watch(wasteLogRepositoryProvider);
  final userId = ref.watch(authProvider).user?.id ?? '';
  return repo.getTotalPointsByUser(userId);
});
