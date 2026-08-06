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
    if (response.statusCode == 200) {
      final data = response.data['data'] as Map<String, dynamic>? ?? {};
      return KknDashboardData.fromJson(data);
    } else {
      throw Exception('Gagal memuat data dashboard KKN');
    }
  }

  @override
  Future<List<WargaDampingan>> getWargaDampingan() async {
    final response = await apiClient.dio.get('/kkn/warga-dampingan');
    if (response.statusCode == 200) {
      final data = response.data['data'] as List<dynamic>? ?? [];
      return data.map((e) => WargaDampingan.fromJson(e as Map<String, dynamic>)).toList();
    } else {
      throw Exception('Gagal memuat daftar warga dampingan');
    }
  }

  @override
  Future<void> registerWarga(RegisterWargaRequest request) async {
    await apiClient.dio.post(
      '/auth/register/warga',
      data: request.toJson(),
    );
  }

  @override
  Future<List<dynamic>> getActivityLog() async {
    final response = await apiClient.dio.get('/kkn/activity-log');
    if (response.statusCode == 200) {
      return response.data['data'] as List<dynamic>? ?? [];
    } else {
      throw Exception('Gagal memuat log aktivitas KKN');
    }
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
