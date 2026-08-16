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
  final history = await repo.getPointHistoryByUser(userId);

  // Fallback: Jika backend mengirimkan notifikasi "Jadwal Buang Sampah Terlewat" tapi
  // lupa/gagal mengurangkan poin di tabel PointHistory, kita inject secara lokal.
  try {
    final notifRepo = ref.read(notificationRepositoryProvider);
    final notifs = await notifRepo.getNotifications();
    for (final notif in notifs) {
      if (notif.title.toLowerCase().contains('terlewat') && 
          notif.title.toLowerCase().contains('jadwal')) {
        
        final dt = DateTime.tryParse(notif.time.endsWith('Z') ? notif.time : '${notif.time}Z') ?? DateTime.now();
        
        // Cek apakah hukuman sudah ada di jam yang berdekatan
        final isAlreadyInHistory = history.any((h) => 
            h.points < 0 && (h.createdAt.difference(dt).inMinutes).abs() < 60
        );
        
        if (!isAlreadyInHistory) {
          history.add(PointHistoryEntity(
            id: 'penalty_${notif.id}_${dt.millisecondsSinceEpoch}',
            userId: userId,
            points: -5,
            wasteType: WasteType.organic,
            description: notif.title,
            createdAt: dt,
          ));
        }
      }
    }
    // Urutkan kembali berdasarkan waktu dari yang terbaru
    history.sort((a, b) => b.createdAt.compareTo(a.createdAt));
  } catch (_) {}

  return history;
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
