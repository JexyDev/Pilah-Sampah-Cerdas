import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http_parser/http_parser.dart';

import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/mahasiswa_kkn_models.dart';
import '../providers/api_client.dart';
import '../../core/values/api_constants.dart';
import 'kkn_repository.dart';

String? _extractError(dynamic data, String? fallback) {
  if (data is Map<String, dynamic>) {
    final msg = data['message']?.toString() ?? data['error']?.toString();
    if (msg != null && msg.isNotEmpty) return msg;
  } else if (data is String && data.isNotEmpty) {
    if (data.contains('<!DOCTYPE') || data.contains('<html') || data.length > 100) return fallback;
    return data;
  }
  return fallback;
}

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
  Future<Map<String, dynamic>> sendLocationPing(double latitude, double longitude, {int? inZoneSeconds}) async {
    try {
      final Map<String, dynamic> body = {
        'latitude': latitude,
        'longitude': longitude,
      };
      if (inZoneSeconds != null) {
        // [BUGFIX] Backend membaca key 'accumulatedDuration' (lihat main/apps/api/src/routes/
        // kknAttendanceRoutes.ts baris ~258), bukan 'inZoneSeconds'. Akibat mismatch ini,
        // durasi akurat dari mobile tidak pernah sampai ke server — server jatuh ke estimasi
        // kasar dari histori log GPS yang sering menghasilkan 0/nyaris-0 di awal sesi
        // (dianggap "keluar zona" padahal user tidak pernah keluar), dan actualInZoneMinutes
        // di database (sumber tampilan web) tidak pernah ter-update dari mobile.
        body['accumulatedDuration'] = inZoneSeconds;
      }
      final response = await apiClient.dio.post(
        ApiEndpoints.kknLocationPing,
        data: body,
      );
      if (response.statusCode == 200 && response.data is Map<String, dynamic>) {
        return response.data as Map<String, dynamic>;
      }
      return {};
    } catch (e) {
      return {};
    }
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
    int? accumulatedSeconds,
    String? timestamp,
  }) async {
    try {
      final totalMenit = (durationMinutes != null && durationMinutes > 0)
          ? durationMinutes
          : ((accumulatedSeconds ?? 0) / 60).ceil();
      final response = await selesaiKegiatan(
        scheduleId,
        sessionId: 'SES-$scheduleId',
        totalDurasiDalamZonaMenit: totalMenit,
        accumulatedSeconds: accumulatedSeconds,
        alasan: 'Presensi Selesai (Pulang)',
      );
      return response;
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('Gagal menghubungi server presensi.');
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
  Future<Map<String, dynamic>> claimWarga(String wargaId) async {
    try {
      final response = await apiClient.dio.post('/api/v1/kkn/warga/$wargaId/claim');
      return response.data as Map<String, dynamic>;
    } catch (e) {
      if (e is DioException && e.response?.data != null) {
        throw Exception(e.response!.data['message'] ?? e.toString());
      }
      throw Exception('Gagal mengklaim warga: $e');
    }
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
      rethrow;
    } catch (e) {
      rethrow;
    }
  }

  @override
  Future<bool> submitPemanfaatanSampah(PemanfaatanSampahRequest request) async {
    final Map<String, dynamic> data = request.toJson();
    
    if (request.fotoPath != null && request.fotoPath!.isNotEmpty) {
      final fileExt = request.fotoPath!.split('.').last.toLowerCase();
      String mimeType = 'image/jpeg';
      if (fileExt == 'png') mimeType = 'image/png';
      if (fileExt == 'webp') mimeType = 'image/webp';

      data['fotoDokumentasi'] = await MultipartFile.fromFile(
        request.fotoPath!,
        contentType: MediaType.parse(mimeType),
      );
    }

    final formData = FormData.fromMap(data);

    final response = await apiClient.dio.post(
      ApiEndpoints.kknPemanfaatanSampah,
      data: formData,
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
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        return null;
      }
      debugPrint('Error getPoskoMe: $e');
      throw Exception('Gagal mengambil data posko');
    } catch (e) {
      debugPrint('Error getPoskoMe: $e');
      throw Exception('Gagal mengambil data posko');
    }
  }

  @override
  Future<List<JenisFasilitas>> getJenisFasilitas() async {
    try {
      final response = await apiClient.dio.get(ApiEndpoints.kknFasilitasJenis);
      if (response.statusCode == 200) {
        final list = response.data['data'] as List<dynamic>? ?? [];
        return list
            .map((e) => JenisFasilitas.fromJson(e as Map<String, dynamic>))
            .where((j) => j.isActive)
            .toList();
      }
      return [];
    } catch (e) {
      debugPrint('[KKN] getJenisFasilitas error: $e');
      return [];
    }
  }

  @override
  Future<List<Map<String, dynamic>>> getFasilitasWarga() async {
    try {
      final response = await apiClient.dio.get(ApiEndpoints.kknFacilities);
      if (response.statusCode == 200) {
        final data = response.data['data'];
        if (data is List) {
          return data.cast<Map<String, dynamic>>();
        }
      }
      return [];
    } catch (e) {
      debugPrint('[KKN] getFasilitasWarga error: $e');
      return [];
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
    } on DioException catch (e) {
      final msg = _extractError(e.response?.data, '');
      if (msg != null && msg.isNotEmpty) {
        throw Exception(msg);
      }
      throw Exception('Gagal mendata fasilitas: $e');
    } catch (e) {
      throw Exception('Gagal mendata fasilitas: $e');
    }
  }

  @override
  Future<Map<String, dynamic>> submitHandover(Map<String, dynamic> data) async {
    try {
      final response = await apiClient.dio.post(ApiEndpoints.kknHandover, data: data);
      if (response.statusCode == 200 || response.statusCode == 201) {
        return response.data as Map<String, dynamic>? ?? {'success': true};
      }
      throw Exception('Gagal mengirim handover KKN (${response.statusCode})');
    } catch (e) {
      throw Exception('Gagal mengirim handover KKN: $e');
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // GPS Presensi Berbasis Kegiatan
  // ═══════════════════════════════════════════════════════════════

  @override
  Future<List<Map<String, dynamic>>> getKegiatanAktif() async {
    try {
      final response = await apiClient.dio.get(ApiEndpoints.kknKegiatanAktif);
      if (response.statusCode == 200) {
        final data = response.data['data'];
        if (data is List) {
          return data.cast<Map<String, dynamic>>();
        }
      }
      return [];
    } catch (e) {
      debugPrint('[KKN] getKegiatanAktif error: $e');
      return [];
    }
  }

  @override
  Future<Map<String, dynamic>> mulaiKegiatan(String id, double latitude, double longitude, {String? deviceInfo}) async {
    try {
      final response = await apiClient.dio.post(
        ApiEndpoints.kknMulaiKegiatan(id),
        data: {
          'latitude': latitude,
          'longitude': longitude,
          if (deviceInfo != null) 'deviceInfo': deviceInfo,
        },
      );
      if (response.statusCode == 200 || response.statusCode == 201) {
        return response.data['data'] as Map<String, dynamic>? ?? response.data as Map<String, dynamic>;
      }
      throw Exception('Gagal memulai kegiatan');
    } on DioException catch (e) {
      final statusCode = e.response?.statusCode;
      final msg = _extractError(e.response?.data, '');
      if (statusCode == 409) {
        throw Exception('CONFLICT:${msg ?? 'Anda masih memiliki kegiatan aktif lain'}');
      }
      throw Exception(msg ?? 'Gagal memulai kegiatan ($statusCode)');
    }
  }

  @override
  Future<Map<String, dynamic>> selesaiKegiatan(String id, {required String sessionId, required int totalDurasiDalamZonaMenit, int? accumulatedSeconds, required String alasan}) async {
    try {
      final response = await apiClient.dio.post(
        ApiEndpoints.kknSelesaiKegiatan(id),
        data: {
          'sessionId': sessionId,
          'totalDurasiDalamZonaMenit': totalDurasiDalamZonaMenit,
          if (accumulatedSeconds != null) 'accumulatedDuration': accumulatedSeconds,
          'alasan': alasan,
        },
      );
      if (response.statusCode == 200 || response.statusCode == 201) {
        return response.data as Map<String, dynamic>? ?? {'success': true};
      }
      throw Exception('Gagal mengakhiri kegiatan');
    } catch (e) {
      if (e is DioException) {
        final msg = _extractError(e.response?.data, '');
        throw Exception(msg ?? 'Gagal mengakhiri kegiatan');
      }
      rethrow;
    }
  }

  @override
  Future<Map<String, dynamic>> jedaKegiatan(String id, {required int totalDurasiDalamZonaMenit, int? accumulatedSeconds, required String alasan}) async {
    try {
      final response = await apiClient.dio.post(
        ApiEndpoints.kknJedaKegiatan(id),
        data: {
          'totalDurasiDalamZonaMenit': totalDurasiDalamZonaMenit,
          if (accumulatedSeconds != null) 'totalDurasiDalamZonaDetik': accumulatedSeconds,
          if (accumulatedSeconds != null) 'accumulatedDuration': accumulatedSeconds,
          'alasan': alasan,
        },
      );
      if (response.statusCode == 200 || response.statusCode == 201) {
        return response.data as Map<String, dynamic>? ?? {'success': true};
      }
      throw Exception('Gagal menjeda kegiatan');
    } catch (e) {
      if (e is DioException) {
        final msg = _extractError(e.response?.data, '');
        throw Exception(msg ?? 'Gagal menjeda kegiatan');
      }
      rethrow;
    }
  }

  @override
  Future<Map<String, dynamic>> recordOutOfZoneViolation({required String scheduleId, required double outOfZoneMinutes}) async {
    try {
      final response = await apiClient.dio.post(
        ApiEndpoints.kknOutOfZoneViolation,
        data: {
          'scheduleId': scheduleId,
          'outOfZoneMinutes': outOfZoneMinutes,
        },
      );
      if (response.statusCode == 200 || response.statusCode == 201) {
        return response.data['data'] as Map<String, dynamic>? ?? response.data as Map<String, dynamic>;
      }
      return {};
    } catch (e) {
      debugPrint('[KKN] recordOutOfZoneViolation error: $e');
      return {};
    }
  }

  @override
  Future<Map<String, dynamic>?> getPresensiHistory(String scheduleId) async {
    try {
      final response = await apiClient.dio.get(
        ApiEndpoints.kknPresensiHistory(scheduleId),
      );
      if (response.statusCode == 200 && response.data['success'] == true) {
        return response.data['data'] as Map<String, dynamic>?;
      }
      return null;
    } catch (e) {
      debugPrint('[KKN] getPresensiHistory error: $e');
      return null;
    }
  }

  @override
  Future<Map<String, dynamic>> getTimesheetSummary() async {
    try {
      final response = await apiClient.dio.get(ApiEndpoints.timesheetSummary);
      if (response.statusCode == 200 && response.data['success'] == true) {
        return response.data['data'] as Map<String, dynamic>;
      }
      return {};
    } catch (e) {
      debugPrint('[KKN] getTimesheetSummary error: $e');
      return {};
    }
  }

  // ──────────────────────────────────────────────────────────
  // 3 Pilar KKN (Perencanaan, Aksi, Panen)
  // [Belum Terhubung API] - Akan mengembalikan error / mock data sampai backend siap
  // ──────────────────────────────────────────────────────────

  @override
  Future<bool> submitProgramKerja(Map<String, dynamic> data) async {
    try {
      dynamic requestData = data;
      if (data.containsKey('filePdfPath') && data['filePdfPath'] != null) {
        final formData = FormData.fromMap(data);
        formData.files.add(MapEntry(
          'filePdf',
          await MultipartFile.fromFile(data['filePdfPath']),
        ));
        formData.fields.removeWhere((e) => e.key == 'filePdfPath');
        requestData = formData;
      }

      final response = await apiClient.dio.post(
        ApiEndpoints.kknProgramKerja,
        data: requestData,
      );
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      if (e is DioException) {
        throw Exception(_extractError(e.response?.data, 'Gagal mengajukan program kerja'));
      }
      rethrow;
    }
  }

  @override
  Future<List<Map<String, dynamic>>> getProgramKerja() async {
    try {
      final response = await apiClient.dio.get(ApiEndpoints.kknProgramKerja);
      if (response.statusCode == 200) {
        final data = response.data['data'];
        if (data is List) {
          return List<Map<String, dynamic>>.from(data);
        }
      }
      return [];
    } catch (e) {
      debugPrint('[KKN] getProgramKerja error: $e');
      return [];
    }
  }

  @override
  Future<bool> submitLogbookPemanfaatan(Map<String, dynamic> data, {String? imagePath}) async {
    try {
      FormData formData;
      if (imagePath != null) {
        final fileExt = imagePath.split('.').last.toLowerCase();
        String mimeType = 'image/jpeg';
        if (fileExt == 'png') mimeType = 'image/png';
        if (fileExt == 'webp') mimeType = 'image/webp';

        formData = FormData.fromMap({
          ...data,
          'fotoDokumentasi': await MultipartFile.fromFile(
            imagePath,
            filename: 'logbook_${DateTime.now().millisecondsSinceEpoch}.$fileExt',
            contentType: MediaType.parse(mimeType),
          ),
        });
      } else {
        formData = FormData.fromMap(data);
      }

      final response = await apiClient.dio.post(
        ApiEndpoints.kknPemanfaatanSampah,
        data: formData,
      );
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      if (e is DioException) {
        throw Exception(_extractError(e.response?.data, 'Gagal menyimpan logbook pemanfaatan'));
      }
      rethrow;
    }
  }

  @override
  Future<bool> submitLogbookHarian(Map<String, dynamic> data, {String? imagePath}) async {
    try {
      FormData formData;
      if (imagePath != null) {
        final fileExt = imagePath.split('.').last.toLowerCase();
        String mimeType = 'image/jpeg';
        if (fileExt == 'png') mimeType = 'image/png';
        if (fileExt == 'webp') mimeType = 'image/webp';

        formData = FormData.fromMap({
          ...data,
          'fotoBukti': await MultipartFile.fromFile(
            imagePath,
            filename: 'logbook_harian_${DateTime.now().millisecondsSinceEpoch}.$fileExt',
            contentType: MediaType.parse(mimeType),
          ),
        });
      } else {
        formData = FormData.fromMap(data);
      }

      final response = await apiClient.dio.post(
        ApiEndpoints.logbookMahasiswa,
        data: formData,
      );
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
        if (e is DioException) {
          final rawData = e.response?.data?.toString() ?? 'null';
          final snippet = rawData.length > 50 ? rawData.substring(0, 50) : rawData;
          final msg = _extractError(e.response?.data, 'HTTP ${e.response?.statusCode}: $snippet');
          throw Exception(msg);
        }
      rethrow;
    }
  }

  @override
  Future<List<dynamic>> getUnharvestedLogbooks() async {
    try {
      final response = await apiClient.dio.get(ApiEndpoints.kknPemanfaatanUnharvested);
      if (response.statusCode == 200 && response.data['success'] == true) {
        return response.data['data'] ?? [];
      }
      return [];
    } catch (e) {
      if (e is DioException) {
        throw Exception(_extractError(e.response?.data, 'Gagal mengambil logbook unharvested'));
      }
      rethrow;
    }
  }

  @override
  Future<bool> submitPanenHasil(Map<String, dynamic> data, {String? imagePath}) async {
    try {
      FormData formData;
      if (imagePath != null) {
        final fileExt = imagePath.split('.').last.toLowerCase();
        String mimeType = 'image/jpeg';
        if (fileExt == 'png') mimeType = 'image/png';
        if (fileExt == 'webp') mimeType = 'image/webp';

        formData = FormData.fromMap({
          ...data,
          'fotoDokumentasi': await MultipartFile.fromFile(
            imagePath,
            filename: 'panen_${DateTime.now().millisecondsSinceEpoch}.$fileExt',
            contentType: MediaType.parse(mimeType),
          ),
        });
      } else {
        formData = FormData.fromMap(data);
      }

      final response = await apiClient.dio.post(
        ApiEndpoints.kknPanenHasil,
        data: formData,
      );
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      if (e is DioException) {
        throw Exception(_extractError(e.response?.data, 'Gagal menyimpan panen hasil'));
      }
      rethrow;
    }
  }
}


