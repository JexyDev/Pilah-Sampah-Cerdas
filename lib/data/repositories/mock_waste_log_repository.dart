import '../../domain/entities/waste_log_entity.dart';
import '../../domain/entities/point_history_entity.dart';
import '../../domain/repositories/waste_log_repository.dart';
import '../mock/mock_data.dart';

/// Mock implementasi WasteLogRepository.
class MockWasteLogRepository implements WasteLogRepository {
  @override
  Future<List<WasteLogEntity>> getWasteLogsByUser(String userId) async {
    await Future.delayed(const Duration(milliseconds: 400));
    return MockData.wasteLogs.where((log) => log.userId == userId).toList()
      ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
  }

  @override
  Future<List<PointHistoryEntity>> getPointHistoryByUser(String userId) async {
    await Future.delayed(const Duration(milliseconds: 400));
    return MockData.pointHistory.where((ph) => ph.userId == userId).toList()
      ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
  }

  @override
  Future<int> getTotalPointsByUser(String userId) async {
    await Future.delayed(const Duration(milliseconds: 200));
    return MockData.pointHistory
        .where((ph) => ph.userId == userId)
        .fold<int>(0, (sum, ph) => sum + ph.points);
  }
}
