import '../models/waste_log_entity.dart';
import '../models/point_history_entity.dart';

/// Interface repository riwayat & poin.
/// Implementasi: ApiWasteLogRepository (data layer).
abstract class WasteLogRepository {
  /// Ambil riwayat setoran sampah milik user.
  Future<List<WasteLogEntity>?> getCachedWasteLogs(String userId);
  Future<List<WasteLogEntity>> getWasteLogsByUser(String userId);

  /// Ambil riwayat poin milik user.
  Future<List<PointHistoryEntity>> getPointHistoryByUser(String userId);

  /// Ambil total poin user.
  Future<int> getTotalPointsByUser(String userId);

  /// Ambil peringkat (rank) user.
  Future<String> getUserLeaderboardRank(String userId);

  /// Mengajukan pengosongan tempat sampah (Warga)
  Future<void> ajukanPengosonganBin(String binId);
}
