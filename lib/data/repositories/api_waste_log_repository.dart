import '../../../domain/entities/waste_log_entity.dart';
import '../../../domain/entities/point_history_entity.dart';
import '../../../domain/repositories/waste_log_repository.dart';
import '../network/api_client.dart';
import '../../../domain/entities/bin_entity.dart';

class ApiWasteLogRepository implements WasteLogRepository {
  final ApiClient apiClient;

  ApiWasteLogRepository({required this.apiClient});

  @override
  Future<List<WasteLogEntity>> getWasteLogsByUser(String userId) async {
    try {
      final response = await apiClient.dio.get('/transactions/history/$userId');
      if (response.statusCode == 200) {
        final List data = response.data['data'];
        return data.map((json) => WasteLogEntity(
          id: json['txId'].toString(),
          userId: json['userId'].toString(),
          binId: json['binId'].toString(),
          wasteType: json['wasteType'].toString().toUpperCase() == 'ORGANIC' || json['wasteType'].toString().toUpperCase() == 'ORGANIK' ? WasteType.organic : WasteType.nonOrganic,
          weightKg: (json['weightKg'] as num).toDouble(),
          volumeLiter: (json['volume'] as num).toDouble(),
          pointsAwarded: json['pointReward'] as int,
          createdAt: DateTime.parse(json['date']),
        )).toList();
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  @override
  Future<List<PointHistoryEntity>> getPointHistoryByUser(String userId) async {
    try {
      final response = await apiClient.dio.get('/transactions/history/$userId');
      if (response.statusCode == 200) {
        final List data = response.data['data'];
        return data.map((json) => PointHistoryEntity(
          id: json['txId'].toString(),
          userId: json['userId'].toString(),
          points: json['pointReward'] as int,
          wasteType: json['wasteType'].toString().toUpperCase() == 'ORGANIC' || json['wasteType'].toString().toUpperCase() == 'ORGANIK' ? WasteType.organic : WasteType.nonOrganic,
          description: 'Setor Sampah ${json['wasteType']}',
          createdAt: DateTime.parse(json['date']),
        )).toList();
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  @override
  Future<int> getTotalPointsByUser(String userId) async {
    try {
      final history = await getPointHistoryByUser(userId);
      return history.fold<int>(0, (sum, item) => sum + item.points);
    } catch (e) {
      return 0;
    }
  }
}
