import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/models/waste_log_entity.dart';
import '../../../data/models/point_history_entity.dart';
import '../../../data/providers/repository_providers.dart';
import '../../../data/repositories/waste_log_repository.dart';
import '../../auth/controllers/auth_controller.dart';

/// Provider riwayat setoran sampah.
/// Menggunakan GET /api/v1/transactions/deposits (global, bukan per-user).
final wasteLogsProvider = AsyncNotifierProvider<WasteLogsNotifier, List<WasteLogEntity>>(WasteLogsNotifier.new);

class WasteLogsNotifier extends AsyncNotifier<List<WasteLogEntity>> {
  @override
  FutureOr<List<WasteLogEntity>> build() async {
    final repo = ref.watch(wasteLogRepositoryProvider);
    final userId = ref.watch(authProvider.select((state) => state.user?.id ?? ''));
    
    // 1. Coba baca cache.
    final cached = await repo.getCachedWasteLogs(userId);
    if (cached != null && cached.isNotEmpty) {
      // Set state sementara dari cache
      state = AsyncValue.data(cached);
      // Fetch data terbaru di background
      _fetchLatest(repo, userId);
      return cached;
    } else {
      // Tunggu dari jaringan jika tidak ada cache
      return await repo.getWasteLogsByUser(userId);
    }
  }

  Future<void> _fetchLatest(WasteLogRepository repo, String userId) async {
    try {
      final fresh = await repo.getWasteLogsByUser(userId);
      state = AsyncValue.data(fresh);
    } catch (e) {
      // Jika fetch gagal, state biarkan berisi cache lama
      // Hanya log atau biarkan
    }
  }
}

/// Provider riwayat poin milik user yang sedang login.
/// Menggunakan GET /api/v1/points/me → data.history
final pointHistoryProvider = FutureProvider<List<PointHistoryEntity>>((
  ref,
) async {
  final repo = ref.watch(wasteLogRepositoryProvider);
  final userId = ref.watch(authProvider.select((state) => state.user?.id ?? ''));
  return repo.getPointHistoryByUser(userId);
});

/// Provider total poin yang diperoleh hari ini (dari pointHistory createdAt = today).
final dailyPointsProvider = FutureProvider<int>((ref) async {
  final history = await ref.watch(pointHistoryProvider.future);
  final today = DateTime.now();
  return history
      .where((h) {
        final localDate = h.createdAt.toLocal();
        return localDate.year == today.year &&
            localDate.month == today.month &&
            localDate.day == today.day;
      })
      .fold<int>(0, (sum, h) => sum + h.points);
});
final totalPointsProvider = FutureProvider<int>((ref) async {
  final repo = ref.watch(wasteLogRepositoryProvider);
  final userId = ref.watch(authProvider.select((state) => state.user?.id ?? ''));
  return repo.getTotalPointsByUser(userId);
});

/// Provider peringkat user (misal: "#3 di RT 03")
final userLeaderboardRankProvider = FutureProvider<String>((ref) async {
  final repo = ref.watch(wasteLogRepositoryProvider);
  final userId = ref.watch(authProvider.select((state) => state.user?.id ?? ''));
  return repo.getUserLeaderboardRank(userId);
});
