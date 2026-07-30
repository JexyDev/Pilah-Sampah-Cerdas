import 'package:dio/dio.dart';
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
    final response = await apiClient.dio.get('/kkn/warga');
    if (response.statusCode == 200) {
      if (response.data is Map<String, dynamic>) {
        final data = (response.data as Map<String, dynamic>)['data'] as List<dynamic>? ?? [];
        return data.map((e) => WargaDampingan.fromJson(e as Map<String, dynamic>)).toList();
      } else {
        throw Exception("Server merespons dengan format yang tidak valid (Bukan JSON).");
      }
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

  @override
  Future<List<dynamic>> getSchedules() async {
    final response = await apiClient.dio.get('/schedules');
    if (response.statusCode == 200) {
      return response.data['data'] as List<dynamic>? ?? [];
    }
    throw Exception('Gagal memuat jadwal kegiatan');
  }

  @override
  Future<Map<String, dynamic>> getTargetLocation(String scheduleId) async {
    final response = await apiClient.dio.get('/kegiatan/$scheduleId/lokasi');
    if (response.statusCode == 200 && response.data['success'] == true) {
      return response.data['data'] as Map<String, dynamic>? ?? {};
    }
    throw Exception('Gagal memuat lokasi kegiatan');
  }

  @override
  Future<bool> recordAttendance(String scheduleId, double latitude, double longitude, String method) async {
    final response = await apiClient.dio.post(
      '/kegiatan/$scheduleId/absen',
      data: {
        'latitude': latitude,
        'longitude': longitude,
        'method': method,
      },
    );
    return response.statusCode == 200;
  }

  @override
  Future<List<dynamic>> getWargaForAktivasi({String? kelurahan, String? rtRw, String? search}) async {
    final Map<String, dynamic> queryParams = {};
    if (kelurahan != null && kelurahan.isNotEmpty) queryParams['kelurahan'] = kelurahan;
    if (rtRw != null && rtRw.isNotEmpty) queryParams['rtRw'] = rtRw;
    if (search != null && search.isNotEmpty) queryParams['search'] = search;

    final response = await apiClient.dio.get('/kkn/warga', queryParameters: queryParams);
    
    if (response.statusCode == 200) {
      if (response.data is Map<String, dynamic>) {
        return (response.data as Map<String, dynamic>)['data'] as List<dynamic>? ?? [];
      } else {
        // Jika server mengembalikan String (misal HTML 404 tapi status 200)
        throw Exception("Server merespons dengan format yang tidak valid (Bukan JSON).");
      }
    }
    throw Exception('Gagal memuat data warga');
  }

  @override
  Future<bool> activateWargaByScan(String wargaId, String qrCode, double latitude, double longitude) async {
    final response = await apiClient.dio.post(
      '/kkn/warga/activate-by-scan',
      data: {
        'wargaId': wargaId,
        'qrCode': qrCode,
        'latitude': latitude,
        'longitude': longitude,
      },
    );
    return response.statusCode == 200 || response.statusCode == 201;
  }

  @override
  Future<bool> activateBin(String wargaId, String binOrganikId, String binAnorganikId) async {
    final response = await apiClient.dio.post(
      '/kkn/warga/activate-bin',
      data: {
        'wargaId': wargaId,
        'binOrganikId': binOrganikId,
        'binAnorganikId': binAnorganikId,
      },
    );
    return response.statusCode == 200 || response.statusCode == 201;
  }

  @override
  Future<List<dynamic>> getKknHistory() async {
    try {
      final response = await apiClient.dio.get('/kkn/history');
      if (response.statusCode == 200) {
        if (response.data is Map<String, dynamic>) {
          return (response.data as Map<String, dynamic>)['data'] as List<dynamic>? ?? [];
        }
        if (response.data is List) {
          return response.data as List<dynamic>;
        }
      }
      return [];
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        // Backend sengaja me-return 404 jika belum ada riwayat (kosong)
        return [];
      }
      throw Exception('Gagal memuat riwayat KKN');
    } catch (e) {
      throw Exception('Gagal memuat riwayat KKN');
    }
  }
}
