import 'dart:convert';
import 'package:flutter/foundation.dart';

import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/mahasiswa_kkn_models.dart';
import '../providers/api_client.dart';
import 'kkn_repository.dart';

/// Implementasi [KknRepository] menggunakan Dio HTTP client.
class ApiKknRepository implements KknRepository {
  const ApiKknRepository({required this.apiClient});

  final ApiClient apiClient;

  static const _cacheKeyDashboard = 'kkn_dashboard_cache';
  static const _cacheKeyWarga = 'kkn_warga_cache';
  static const _cacheKeyActivityLog = 'kkn_activity_log_cache';

  @override
  Future<KknDashboardData?> getCachedDashboard() async {
    final prefs = await SharedPreferences.getInstance();
    final cachedStr = prefs.getString(_cacheKeyDashboard);
    if (cachedStr != null && cachedStr.isNotEmpty) {
      try {
        final data = jsonDecode(cachedStr) as Map<String, dynamic>;
        return KknDashboardData.fromJson(data);
      } catch (e) { debugPrint('Silenced error: $e'); }
    }
    return null;
  }

  @override
  Future<KknDashboardData> getDashboard() async {
    try {
      final response = await apiClient.dio.get('/kkn/dashboard');
      if (response.statusCode == 200) {
        final data = response.data['data'] as Map<String, dynamic>? ?? {};
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_cacheKeyDashboard, jsonEncode(data));
        return KknDashboardData.fromJson(data);
      }
      throw Exception('Invalid response');
    } catch (e) {
      final prefs = await SharedPreferences.getInstance();
      final cachedStr = prefs.getString(_cacheKeyDashboard);
      if (cachedStr != null && cachedStr.isNotEmpty) {
        try {
          final data = jsonDecode(cachedStr) as Map<String, dynamic>;
          return KknDashboardData.fromJson(data);
        } catch (e) { debugPrint('Silenced error: $e'); }
      }
      throw Exception('Gagal memuat data dashboard KKN');
    }
  }

  @override
  Future<List<WargaDampingan>?> getCachedWargaDampingan() async {
    final prefs = await SharedPreferences.getInstance();
    final cachedStr = prefs.getString(_cacheKeyWarga);
    if (cachedStr != null && cachedStr.isNotEmpty) {
      try {
        final list = jsonDecode(cachedStr) as List<dynamic>;
        return list.map((e) => WargaDampingan.fromJson(e as Map<String, dynamic>)).toList();
      } catch (e) { debugPrint('Silenced error: $e'); }
    }
    return null;
  }

  @override
  Future<List<WargaDampingan>> getWargaDampingan() async {
    List<dynamic> rawList = [];
    try {
      final response = await apiClient.dio.get('/kkn/warga-dampingan');
      if (response.statusCode == 200) {
        if (response.data is Map<String, dynamic>) {
          rawList = (response.data as Map<String, dynamic>)['data'] as List<dynamic>? ?? [];
        } else if (response.data is List) {
          rawList = response.data as List<dynamic>;
        }
      }
    } catch (_) {
      rawList = [];
    }

    // Fallback: Jika /kkn/warga-dampingan kosong, ambil data dari /kkn/warga (Warga Penugasan KKN)
    if (rawList.isEmpty) {
      try {
        final aktivasiData = await getWargaForAktivasi();
        if (aktivasiData.isNotEmpty) {
          rawList = aktivasiData;
        }
      } catch (e) { debugPrint('Silenced error: $e'); }
    }

    if (rawList.isNotEmpty) {
       final prefs = await SharedPreferences.getInstance();
       await prefs.setString(_cacheKeyWarga, jsonEncode(rawList));
    } else {
       final prefs = await SharedPreferences.getInstance();
       final cachedStr = prefs.getString(_cacheKeyWarga);
       if (cachedStr != null && cachedStr.isNotEmpty) {
         try {
           final list = jsonDecode(cachedStr) as List<dynamic>;
           return list.map((e) => WargaDampingan.fromJson(e as Map<String, dynamic>)).toList();
         } catch (e) { debugPrint('Silenced error: $e'); }
       }
    }

    return rawList.map((e) => WargaDampingan.fromJson(e as Map<String, dynamic>)).toList();
  }

  @override
  Future<void> registerWarga(RegisterWargaRequest request) async {
    await apiClient.dio.post(
      '/auth/register/warga',
      data: request.toJson(),
    );
  }

  @override
  Future<List<dynamic>?> getCachedActivityLog() async {
    final prefs = await SharedPreferences.getInstance();
    final cachedStr = prefs.getString(_cacheKeyActivityLog);
    if (cachedStr != null && cachedStr.isNotEmpty) {
      try {
        final list = jsonDecode(cachedStr) as List<dynamic>;
        return list;
      } catch (e) { debugPrint('Silenced error: $e'); }
    }
    return null;
  }

  @override
  Future<List<dynamic>> getActivityLog() async {
    try {
      final response = await apiClient.dio.get('/kkn/activity-log');
      if (response.statusCode == 200) {
        final list = response.data['data'] as List<dynamic>? ?? [];
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_cacheKeyActivityLog, jsonEncode(list));
        return list;
      }
      throw Exception('Invalid response');
    } catch (e) {
      final prefs = await SharedPreferences.getInstance();
      final cachedStr = prefs.getString(_cacheKeyActivityLog);
      if (cachedStr != null && cachedStr.isNotEmpty) {
        try {
          final list = jsonDecode(cachedStr) as List<dynamic>;
          return list;
        } catch (e) { debugPrint('Silenced error: $e'); }
      }
      throw Exception('Gagal memuat log aktivitas KKN');
    }
  }

  @override
  Future<String?> sendLocationPing(double latitude, double longitude) async {
    final response = await apiClient.dio.post(
      '/kkn/location-ping',
      data: {
        'latitude': latitude,
        'longitude': longitude,
      },
    );
    if (response.statusCode == 200 && response.data is Map<String, dynamic>) {
      final data = response.data['data'] as Map<String, dynamic>?;
      return data?['poskoArea']?.toString() ?? data?['kelurahan']?.toString() ?? 'Zona KKN Kel. Bojongsoang';
    }
    return null;
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
  Future<Map<String, dynamic>> getActiveZone() async {
    try {
      final response = await apiClient.dio.get('/kkn/active-zone');
      if (response.statusCode == 200 && response.data != null) {
        if (response.data is Map<String, dynamic>) {
          return response.data['data'] as Map<String, dynamic>? ?? {};
        }
      }
      return {};
    } catch (_) {
      return {};
    }
  }

  @override
  Future<bool> recordAttendance({
    required String scheduleId,
    required double latitude,
    required double longitude,
    required String method,
    String? nim,
    String? namaMahasiswa,
    String? kodeZona,
    String? rw,
    String? kecamatan, String? kelurahan,
    int? durationMinutes,
    String? timestamp,
  }) async {
    try {
      final payload = {
        'latitude': latitude,
        'longitude': longitude,
        'method': method,
        if (nim != null && nim.isNotEmpty) 'nim': nim,
        if (namaMahasiswa != null && namaMahasiswa.isNotEmpty) 'namaMahasiswa': namaMahasiswa,
        if (kodeZona != null && kodeZona.isNotEmpty) 'kodeZona': kodeZona,
        if (rw != null && rw.isNotEmpty) 'rw': rw,
        if (kelurahan != null && kelurahan.isNotEmpty) 'kelurahan': kelurahan,
        if (kecamatan != null && kecamatan.isNotEmpty) 'kecamatan': kecamatan,
        if (durationMinutes != null) 'durationMinutes': durationMinutes,
        'timestamp': timestamp ?? DateTime.now().toUtc().toIso8601String(),
      };

      // Coba endpoint spesifik jadwal dahulu, jika gagal coba fallback /kkn/attendance/check-in
      try {
        final res = await apiClient.dio.post('/kegiatan/$scheduleId/absen', data: payload);
        if (res.statusCode == 200 || res.statusCode == 201) return true;
      } catch (_) {
        final res = await apiClient.dio.post('/kkn/attendance/check-in', data: payload);
        return res.statusCode == 200 || res.statusCode == 201;
      }
      return false;
    } catch (_) {
      return false;
    }
  }

  @override
  Future<List<dynamic>> getWargaForAktivasi({String? kecamatan, String? kelurahan, String? rw, String? search}) async {
    try {
      final Map<String, dynamic> queryParams = {};
      if (kelurahan != null && kelurahan.isNotEmpty) queryParams['kelurahan'] = kelurahan;
      if (rw != null && rw.isNotEmpty) queryParams['rw'] = rw;
      if (search != null && search.isNotEmpty) queryParams['search'] = search;

      final response = await apiClient.dio.get('/kkn/warga', queryParameters: queryParams);
      
      if (response.statusCode == 200) {
        if (response.data is Map<String, dynamic>) {
          return (response.data as Map<String, dynamic>)['data'] as List<dynamic>? ?? [];
        } else if (response.data is List) {
          return response.data as List<dynamic>;
        }
      }
      return [];
    } catch (_) {
      return [];
    }
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
  Future<bool> activateBin(String wargaId, String binOrganikId, String binAnorganikId, {double? lat, double? lng}) async {
    final response = await apiClient.dio.post(
      '/kkn/warga/activate-bin',
      data: {
        'wargaId': wargaId,
        'binOrganikId': binOrganikId,
        'binAnorganikId': binAnorganikId,
        'latitude': lat ?? 0.0,
        'longitude': lng ?? 0.0,
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

  @override
  Future<KelompokKknData?> getKelompokKkn() async {
    try {
      final response = await apiClient.dio.get('/kkn/kelompok/me');
      if (response.statusCode == 200 && response.data != null) {
        final data = response.data['data'] as Map<String, dynamic>? ?? {};
        if (data.isEmpty) return null;
        return KelompokKknData.fromJson(data);
      }
      return null;
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        // Belum dimasukkan ke kelompok manapun oleh admin
        return null;
      }
      throw Exception('Gagal memuat data kelompok KKN');
    } catch (_) {
      return null;
    }
  }

  @override
  Future<bool> submitPemanfaatanSampah(PemanfaatanSampahRequest request) async {
    dynamic payload;
    if (request.fotoPath != null && request.fotoPath!.isNotEmpty) {
      payload = FormData.fromMap({
        ...request.toJson(),
        'fotoBukti': await MultipartFile.fromFile(request.fotoPath!),
      });
    } else {
      payload = request.toJson();
    }

    final response = await apiClient.dio.post(
      '/kkn/pemanfaatan-sampah',
      data: payload,
    );
    return response.statusCode == 200 || response.statusCode == 201;
  }

  @override
  Future<void> submitPengajuanIzin({
    String? scheduleId,
    required String kategori,
    required DateTime tanggal,
    required String deskripsi,
    required String fotoPath,
  }) async {
    final formData = FormData.fromMap({
      'kategori': kategori,
      'tanggalKegiatanTerkait': tanggal.toIso8601String(),
      'deskripsi': deskripsi,
      if (scheduleId != null) 'scheduleId': scheduleId,
      'fotoBukti': await MultipartFile.fromFile(fotoPath),
    });

    final response = await apiClient.dio.post(
      '/kkn/pengajuan-izin',
      data: formData,
    );

    if (response.statusCode != 200 && response.statusCode != 201) {
      throw Exception('Gagal mengirim pengajuan izin (${response.statusCode})');
    }
  }
}
