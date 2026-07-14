import '../entities/waste_log_entity.dart';
import '../entities/point_history_entity.dart';

/// Interface repository riwayat & poin.
/// Implementasi: MockWasteLogRepository (data layer).
abstract class WasteLogRepository {
  /// Ambil riwayat setoran sampah milik user.
  Future<List<WasteLogEntity>> getWasteLogsByUser(String userId);

  /// Ambil riwayat poin milik user.
  Future<List<PointHistoryEntity>> getPointHistoryByUser(String userId);

  /// Ambil total poin user.
  Future<int> getTotalPointsByUser(String userId);
}
