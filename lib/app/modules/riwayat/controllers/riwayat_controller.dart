import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/models/waste_log_entity.dart';
import '../../../data/models/point_history_entity.dart';
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
/// Menggunakan GET /api/v1/points/me → data.history (Murni dari backend)
final pointHistoryProvider = FutureProvider<List<PointHistoryEntity>>((
  ref,
) async {
  final repo = ref.watch(wasteLogRepositoryProvider);
  final user = ref.watch(authProvider.select((state) => state.user));
  final userId = user?.id ?? '';
  return await repo.getPointHistoryByUser(userId);
});

/// Provider total frekuensi setor sampah
final totalSetoranProvider = FutureProvider<int>((ref) async {
  final history = await ref.watch(pointHistoryProvider.future);
  final setoranHistory = history.where((h) {
    final descLower = h.description.toLowerCase();
    final isAktivasi = descLower.contains('aktivasi') || descLower.contains('activation');
    final isPunishment = h.points < 0 || descLower.contains('penalti') || descLower.contains('punishment');
    final isRedeem = descLower.contains('redeem') || descLower.contains('tukar');
    final isPresensi = descLower.contains('presensi') || descLower.contains('geofence');
    return h.points > 0 && !isAktivasi && !isPunishment && !isRedeem && !isPresensi;
  });
  return setoranHistory.length;
});

/// Provider total poin yang diperoleh hari ini (Dihitung murni dari riwayat backend createdAt = today).
final dailyPointsProvider = FutureProvider<int>((ref) async {
  final history = await ref.watch(pointHistoryProvider.future);
  final user = ref.watch(authProvider.select((state) => state.user));
  final isMahasiswa = user?.role.name.toUpperCase() == 'MAHASISWA';
  final today = DateTime.now();
  final todayStart = DateTime(today.year, today.month, today.day);
  final todayEnd = DateTime(today.year, today.month, today.day, 23, 59, 59, 999);

  return history
      .where((h) {
        final localDate = h.createdAt.toLocal();
        if (localDate.isBefore(todayStart) || localDate.isAfter(todayEnd)) {
          return false;
        }
        if (isMahasiswa) {
          if (h.points <= 0) return false;
          final desc = h.description.toLowerCase();
          final kat = (h.kategori ?? '').toUpperCase();
          if (desc.contains('aktivasi') ||
              desc.contains('activation') ||
              desc.contains('fasilitas') ||
              desc.contains('gis') ||
              desc.contains('penalti') ||
              desc.contains('punishment') ||
              desc.contains('out_of_zone') ||
              kat.contains('PENALTY') ||
              desc.contains('pemanfaatan') ||
              desc.contains('panen') ||
              kat.contains('PEMANFAATAN') ||
              kat.contains('PANEN') ||
              desc.contains('pendampingan') ||
              desc.contains('registrasi')) {
            return false;
          }
        }
        return true;
      })
      .fold<int>(0, (sum, h) => sum + h.points);
});

/// Provider total poin akumulasi milik user (Murni dari backend GET /api/v1/points/me → data.totalPoints)
final totalPointsProvider = FutureProvider<int>((ref) async {
  final repo = ref.watch(wasteLogRepositoryProvider);
  final userId = ref.watch(
    authProvider.select((state) => state.user?.id ?? ''),
  );
  return repo.getTotalPointsByUser(userId);
});

/// Provider peringkat user (misal: "#3 di RT 03")
final userLeaderboardRankProvider = FutureProvider<String>((ref) async {
  final repo = ref.watch(wasteLogRepositoryProvider);
  final userId = ref.watch(
    authProvider.select((state) => state.user?.id ?? ''),
  );
  return repo.getUserLeaderboardRank(userId);
});
