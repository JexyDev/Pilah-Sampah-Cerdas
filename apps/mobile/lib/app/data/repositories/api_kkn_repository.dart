import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http_parser/http_parser.dart';

import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/mahasiswa_kkn_models.dart';
import '../providers/api_client.dart';
import '../../core/values/api_constants.dart';
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
      final response = await apiClient.dio.get(ApiEndpoints.kknDashboard);
      if (response.statusCode == 200) {
        final data = response.data['data'] as Map<String, dynamic>? ?? {};
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_cacheKeyDashboard, jsonEncode(data));
        return KknDashboardData.fromJson(data);
      }
      throw Exception('Respon dari server tidak valid. Silakan coba beberapa saat lagi.');
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
      final response = await apiClient.dio.get(ApiEndpoints.kknWarga);
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

    // Fallback removed: Jika endpoint warga-dampingan kosong, itu berarti mahasiswa belum memiliki warga dampingan.
    // Mengambil seluruh warga yang aktif dari /kkn/warga akan menyebabkan mahasiswa mengklaim warga milik mahasiswa lain.
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
      final response = await apiClient.dio.get(ApiEndpoints.kknActivityLog);
      if (response.statusCode == 200) {
        final list = response.data['data'] as List<dynamic>? ?? [];
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_cacheKeyActivityLog, jsonEncode(list));
        return list;
      }
      throw Exception('Respon dari server tidak valid. Silakan coba beberapa saat lagi.');
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
  Future<Map<String, dynamic>> sendLocationPing(double latitude, double longitude) async {
    final response = await apiClient.dio.post(
      ApiEndpoints.kknLocationPing,
      data: {
        'latitude': latitude,
        'longitude': longitude,
      },
    );
    if (response.statusCode == 200 && response.data is Map<String, dynamic>) {
      return response.data as Map<String, dynamic>;
    }
    return {};
  }

  @override
  Future<List<dynamic>> getSchedules() async {
    final response = await apiClient.dio.get(ApiEndpoints.schedules);
    if (response.statusCode == 200) {
      return response.data['data'] as List<dynamic>? ?? [];
    }
    throw Exception('Gagal memuat jadwal kegiatan');
  }

  @override
  Future<Map<String, dynamic>> getTargetLocation(String scheduleId) async {
    final response = await apiClient.dio.get(ApiEndpoints.kegiatanLokasi(scheduleId));
    if (response.statusCode == 200 && response.data['success'] == true) {
      return response.data['data'] as Map<String, dynamic>? ?? {};
    }
    throw Exception('Gagal memuat lokasi kegiatan');
  }

  @override
  Future<Map<String, dynamic>> getActiveZone({double? latitude, double? longitude}) async {
    try {
      final response = await apiClient.dio.get(
        ApiEndpoints.kknActiveZone,
        queryParameters: {
          if (latitude != null) 'latitude': latitude,
          if (longitude != null) 'longitude': longitude,
        },
      );
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
  Future<Map<String, dynamic>> recordAttendance({
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
        'timestamp': timestamp ?? DateTime.now().toUtc().toIso8601String(),
      };

      // Coba endpoint spesifik jadwal dahulu, jika gagal coba fallback /kkn/attendance/check-in
      try {
        final res = await apiClient.dio.post(ApiEndpoints.kegiatanAbsen(scheduleId), data: payload);
        if (res.statusCode == 200 || res.statusCode == 201) {
          if (res.data is Map<String, dynamic>) {
            return res.data['data'] as Map<String, dynamic>? ?? res.data as Map<String, dynamic>;
          }
          return {'success': true};
        }
      } catch (_) {
        final res = await apiClient.dio.post(ApiEndpoints.kknCheckIn, data: payload);
        if (res.statusCode == 200 || res.statusCode == 201) {
          if (res.data is Map<String, dynamic>) {
            return res.data['data'] as Map<String, dynamic>? ?? res.data as Map<String, dynamic>;
          }
          return {'success': true};
        }
      }
      return {};
    } catch (_) {
      return {};
    }
  }

  @override
  Future<List<dynamic>> getWargaForAktivasi({String? kecamatan, String? kelurahan, String? rw, String? search}) async {
    try {
      final Map<String, dynamic> queryParams = {};
      if (kelurahan != null && kelurahan.isNotEmpty) queryParams['kelurahan'] = kelurahan;
      if (rw != null && rw.isNotEmpty) queryParams['rw'] = rw;
      if (search != null && search.isNotEmpty) queryParams['search'] = search;

      final response = await apiClient.dio.get(ApiEndpoints.kknWarga, queryParameters: queryParams);
      
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
      ApiEndpoints.kknActivateByScan,
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
      ApiEndpoints.kknActivateBin,
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
      final response = await apiClient.dio.get(ApiEndpoints.kknHistory);
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
      final response = await apiClient.dio.get(ApiEndpoints.kknKelompokMe);
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
    // Backend for /pemanfaatan-sampah does not have multer middleware configured.
    // If we send FormData (multipart/form-data), req.body will be empty on the backend, 
    // causing it to use default values and ignore the user's input.
    // Therefore, we MUST send application/json. 
    // The backend hardcodes fotoDokumentasiUrl to default-pemanfaatan.jpg, 
    // so we skip sending the photo file for this specific route.
    final payload = request.toJson();

    final response = await apiClient.dio.post(
      ApiEndpoints.kknPemanfaatanSampah,
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
    final fileExt = fotoPath.split('.').last.toLowerCase();
    String mimeType = 'image/jpeg';
    if (fileExt == 'png') mimeType = 'image/png';
    if (fileExt == 'webp') mimeType = 'image/webp';

    final formData = FormData.fromMap({
      'kategori': kategori,
      'tanggalKegiatanTerkait': tanggal.toIso8601String(),
      'deskripsi': deskripsi,
      if (scheduleId != null) 'scheduleId': scheduleId,
      'fotoBukti': await MultipartFile.fromFile(
        fotoPath,
        filename: fotoPath.split('/').last,
        contentType: MediaType.parse(mimeType),
      ),
    });

    final response = await apiClient.dio.post(
      ApiEndpoints.kknPengajuanIzin,
      data: formData,
      options: Options(
        sendTimeout: const Duration(seconds: 120),
        receiveTimeout: const Duration(seconds: 120),
      ),
    );

    if (response.statusCode != 200 && response.statusCode != 201) {
      throw Exception('Gagal mengirim pengajuan izin (${response.statusCode})');
    }
  }

  @override
  Future<List<dynamic>> getPengajuanIzin() async {
    try {
      final response = await apiClient.dio.get(ApiEndpoints.kknPengajuanIzin);
      if (response.statusCode == 200) {
        return response.data['data'] as List<dynamic>? ?? [];
      }
      throw Exception('Gagal memuat riwayat izin');
    } catch (e) {
      throw Exception('Terjadi kesalahan jaringan: $e');
    }
  }

  @override
  Future<Map<String, dynamic>> cancelPengajuanIzin(String izinId, {String? alasan}) async {
    try {
      final response = await apiClient.dio.put(
        '${ApiEndpoints.kknPengajuanIzin}/$izinId/batal',
        data: {'alasan': alasan ?? 'Dibatalkan oleh mahasiswa'},
      );
      if (response.statusCode == 200 || response.statusCode == 201) {
        return response.data as Map<String, dynamic>? ?? {'success': true};
      }
      throw Exception('Gagal membatalkan pengajuan (${response.statusCode})');
    } catch (e) {
      throw Exception('Gagal membatalkan pengajuan izin: $e');
    }
  }

  @override
  Future<DampakKelurahanData> getDampakKelurahan() async {
    try {
      dynamic response;
      try {
        response = await apiClient.dio.get('/kkn/dampak-rw');
      } catch (_) {
        response = await apiClient.dio.get('/kkn/dampak-kelurahan');
      }
      if (response != null && response.statusCode == 200 && response.data != null) {
        final Map<String, dynamic> data = response.data is Map<String, dynamic>
            ? (response.data['data'] as Map<String, dynamic>? ?? response.data as Map<String, dynamic>)
            : {};
        return DampakKelurahanData.fromJson(data);
      }
      throw Exception('Data statistik dampak RW tidak tersedia.');
    } catch (_) {
      throw Exception('Gagal memuat data statistik dampak RW.');
    }
  }
  @override
  Future<Map<String, dynamic>> registerPosko(Map<String, dynamic> data, {String? imagePath}) async {
    try {
      if (imagePath != null) {
        final formData = FormData.fromMap({
          ...data,
          'foto': await MultipartFile.fromFile(imagePath),
        });
        final response = await apiClient.dio.post(ApiEndpoints.kknPoskoRegister, data: formData);
        return response.data as Map<String, dynamic>;
      } else {
        final response = await apiClient.dio.post(ApiEndpoints.kknPoskoRegister, data: data);
        return response.data as Map<String, dynamic>;
      }
    } catch (e) {
      throw Exception('Gagal mendaftarkan posko: $e');
    }
  }

  @override
  Future<PoskoKknResponse?> getPoskoMe() async {
    try {
      final response = await apiClient.dio.get(ApiEndpoints.kknPoskoMe);
      if (response.statusCode == 200) {
        final data = response.data['data'] as Map<String, dynamic>?;
        if (data != null) {
          return PoskoKknResponse.fromJson(data);
        }
      }
      return null;
    } catch (e) {
      debugPrint('Error getPoskoMe: $e');
      throw Exception('Gagal mengambil data posko');
    }
  }

  @override
  Future<Map<String, dynamic>> registerFasilitas(Map<String, dynamic> data, {String? imagePath}) async {
    try {
      if (imagePath != null) {
        final formData = FormData.fromMap({
          ...data,
          'foto': await MultipartFile.fromFile(imagePath),
        });
        final response = await apiClient.dio.post(ApiEndpoints.kknFasilitasBantuInput, data: formData);
        return response.data as Map<String, dynamic>;
      } else {
        final response = await apiClient.dio.post(ApiEndpoints.kknFasilitasBantuInput, data: data);
        return response.data as Map<String, dynamic>;
      }
    } catch (e) {
      throw Exception('Gagal mendata fasilitas: $e');
    }
  }
}
