import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/models/waste_log_entity.dart';
import '../../../data/models/point_history_entity.dart';
import '../../../data/models/bin_entity.dart';
import '../../../data/providers/repository_providers.dart';
import '../../../data/repositories/waste_log_repository.dart';
import '../../auth/controllers/auth_controller.dart';

/// Provider riwayat setoran sampah.
/// Menggunakan GET /api/v1/transactions/deposits (global, bukan per-user).
final wasteLogsProvider =
    AsyncNotifierProvider<WasteLogsNotifier, List<WasteLogEntity>>(
      WasteLogsNotifier.new,
    );

class WasteLogsNotifier extends AsyncNotifier<List<WasteLogEntity>> {
  @override
  FutureOr<List<WasteLogEntity>> build() async {
    final repo = ref.watch(wasteLogRepositoryProvider);
    final userId = ref.watch(
      authProvider.select((state) => state.user?.id ?? ''),
    );

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
  final userId = ref.watch(
    authProvider.select((state) => state.user?.id ?? ''),
  );
  final history = await repo.getPointHistoryByUser(userId);

  if (history.isNotEmpty) return history;

  // 1. Fallback: jika /points/me history kosong, sinkronkan dari riwayat setoran yang berpoin
  final wasteLogs = ref.watch(wasteLogsProvider).value ?? [];
  final wasteWithPoints = wasteLogs.where((w) => w.pointsAwarded > 0).toList();
  if (wasteWithPoints.isNotEmpty) {
    return wasteWithPoints.map((w) {
      return PointHistoryEntity(
        id: w.id,
        userId: w.userId,
        points: w.pointsAwarded,
        wasteType: w.wasteType,
        description:
            'Setoran Sampah ${w.wasteType.displayName} (${w.weightKg.toStringAsFixed(1)} kg)',
        createdAt: w.createdAt,
      );
    }).toList();
  }

  // 2. Fallback: jika totalPoints > 0 namun riwayat kosong, buat entri awal agar konsisten
  final totalPts = await ref.watch(totalPointsProvider.future);
  if (totalPts > 0) {
    return [
      PointHistoryEntity(
        id: 'initial-pts-$userId',
        userId: userId,
        points: totalPts,
        wasteType: WasteType.organic,
        description: 'Bonus Poin / Saldo Awal',
        createdAt: DateTime.now(),
      ),
    ];
  }

  return history;
});

/// Provider total poin yang diperoleh hari ini (dari pointHistory createdAt = today).
final dailyPointsProvider = FutureProvider<int>((ref) async {
  final history = await ref.watch(pointHistoryProvider.future);
  final today = DateTime.now();
  final todayStart = DateTime(today.year, today.month, today.day);
  final todayEnd = DateTime(today.year, today.month, today.day, 23, 59, 59, 999);

  final todayHistoryPoints = history
      .where((h) {
        final localDate = h.createdAt.toLocal();
        return !localDate.isBefore(todayStart) && !localDate.isAfter(todayEnd);
      })
      .fold<int>(0, (sum, h) => sum + h.points);

  if (todayHistoryPoints > 0) return todayHistoryPoints;

  // Coba periksa dari wasteLogs jika pointHistory belum sinkron atau kosong
  final wasteLogs = ref.watch(wasteLogsProvider).value ?? [];
  final wasteTodayPoints = wasteLogs
      .where((w) {
        final localDate = w.createdAt.toLocal();
        return !localDate.isBefore(todayStart) && !localDate.isAfter(todayEnd);
      })
      .fold<int>(0, (sum, w) => sum + w.pointsAwarded);

  if (wasteTodayPoints > 0) return wasteTodayPoints;

  // Fallback: Jika totalPoints > 0 dan tidak ada riwayat transaksi sebelum hari ini
  final total = await ref.watch(totalPointsProvider.future);
  final hasPastHistory = history.any(
    (h) => h.createdAt.toLocal().isBefore(todayStart),
  );
  final hasPastWaste = wasteLogs.any(
    (w) => w.createdAt.toLocal().isBefore(todayStart),
  );

  if (total > 0 && !hasPastHistory && !hasPastWaste) {
    return total;
  }

  return 0;
});
final totalPointsProvider = FutureProvider<int>((ref) async {
  final repo = ref.watch(wasteLogRepositoryProvider);
  final userId = ref.watch(
    authProvider.select((state) => state.user?.id ?? ''),
  );
  final total = await repo.getTotalPointsByUser(userId);
  if (total > 0) return total;

  // Fallback jika API totalPoints belum sinkron (0), gunakan akumulasi dari wasteLogs
  final wasteLogs = ref.watch(wasteLogsProvider).value ?? [];
  final wasteSum = wasteLogs.fold<int>(0, (sum, w) => sum + w.pointsAwarded);
  if (wasteSum > 0) return wasteSum;

  return total;
});

/// Provider peringkat user (misal: "#3 di RT 03")
final userLeaderboardRankProvider = FutureProvider<String>((ref) async {
  final repo = ref.watch(wasteLogRepositoryProvider);
  final userId = ref.watch(
    authProvider.select((state) => state.user?.id ?? ''),
  );
  return repo.getUserLeaderboardRank(userId);
});
