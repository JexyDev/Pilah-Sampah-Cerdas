import '../models/mahasiswa_kkn_models.dart';
import '../providers/api_client.dart';
import 'kkn_repository.dart';

/// Implementasi [KknRepository] menggunakan Dio HTTP client.
class ApiKknRepository implements KknRepository {
  const ApiKknRepository({required this.apiClient});

  final ApiClient apiClient;

  @override
  Future<KknDashboardData> getDashboard() async {
    final response = await apiClient.dio.get('/kkn/dashboard');
    final data = response.data;
    // Response bisa langsung object atau di-wrap dalam { data: ... }
    final payload = data is Map<String, dynamic> && data.containsKey('data')
        ? data['data'] as Map<String, dynamic>
        : data as Map<String, dynamic>;
    return KknDashboardData.fromJson(payload);
  }

  @override
  Future<List<WargaDampingan>> getWargaDampingan() async {
    final response = await apiClient.dio.get('/kkn/warga-dampingan');
    final data = response.data;
    // Response bisa berupa List langsung atau { data: [...] }
    final List<dynamic> list = data is List
        ? data
        : (data is Map<String, dynamic> && data.containsKey('data'))
            ? data['data'] as List<dynamic>
            : [];
    return list
        .map((e) => WargaDampingan.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<void> registerWarga(RegisterWargaRequest request) async {
    await apiClient.dio.post(
      '/auth/register/warga',
      data: request.toJson(),
    );
  }

  @override
  Future<void> sendLocationPing(double latitude, double longitude) async {
    await apiClient.dio.post(
      '/kkn/location-ping',
      data: {
        'latitude': latitude,
        'longitude': longitude,
      },
    );
  }
}
