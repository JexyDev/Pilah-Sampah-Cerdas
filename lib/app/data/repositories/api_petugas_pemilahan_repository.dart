import 'dart:convert';


import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:http_parser/http_parser.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/utils/image_compressor.dart';
import '../../core/values/api_constants.dart';
import '../models/petugas_pemilahan_models.dart';
import '../providers/api_client.dart';
import '../services/notification_engine.dart';
import '../services/local_notification_cache_service.dart';
import '../services/firebase_notification_service.dart';
import 'petugas_pemilahan_repository.dart';

class ApiPetugasPemilahanRepository implements PetugasPemilahanRepository {
  ApiPetugasPemilahanRepository({required this.apiClient});

  final ApiClient apiClient;

  static const _cacheKeyDashboard = 'petugas_pemilahan_dashboard_cache';
  static const _cacheKeyJadwal = 'petugas_pemilahan_jadwal_cache';
  static const _cacheKeyHistory = 'petugas_pemilahan_history_cache';

  @override
  Future<PetugasPemilahanDashboard?> getCachedDashboard() async {
    final prefs = await SharedPreferences.getInstance();
    final cachedStr = prefs.getString(_cacheKeyDashboard);
    if (cachedStr != null && cachedStr.isNotEmpty) {
      try {
        final data = jsonDecode(cachedStr) as Map<String, dynamic>;
        return PetugasPemilahanDashboard.fromJson(data);
      } catch (e) {
        debugPrint('[ApiPetugasPemilahanRepository] Cache error: $e');
      }
    }
    return null;
  }

  @override
  Future<PetugasPemilahanDashboard> getDashboard() async {
    try {
      final response = await apiClient.dio.get('/petugas-residu/dashboard');
      if (response.statusCode == 200 && response.data != null) {
        final data = response.data is Map<String, dynamic> 
            ? (response.data['data'] as Map<String, dynamic>? ?? response.data as Map<String, dynamic>)
            : <String, dynamic>{};
        
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_cacheKeyDashboard, jsonEncode(data));

        return PetugasPemilahanDashboard.fromJson(data);
      }
      throw Exception('Respon dari server tidak valid. Silakan coba beberapa saat lagi.');
    } catch (e) {
      final prefs = await SharedPreferences.getInstance();
      final cachedStr = prefs.getString(_cacheKeyDashboard);
      if (cachedStr != null && cachedStr.isNotEmpty) {
        try {
          final data = jsonDecode(cachedStr) as Map<String, dynamic>;
          return PetugasPemilahanDashboard.fromJson(data);
        } catch (e) {
          debugPrint('[ApiPetugasPemilahanRepository] Cache error: $e');
        }
      }
      rethrow;
    }
  }

  @override
  Future<List<PemilahanBinPickup>?> getCachedJadwalHarian({String? kecamatan, String? kelurahan, String? rw}) async {
    final prefs = await SharedPreferences.getInstance();
    final cachedStr = prefs.getString(_cacheKeyJadwal);
    if (cachedStr != null && cachedStr.isNotEmpty) {
      try {
        final list = jsonDecode(cachedStr) as List<dynamic>;
        return list.map((e) => PemilahanBinPickup.fromJson(e as Map<String, dynamic>)).toList();
      } catch (e) {
        debugPrint('[ApiPetugasPemilahanRepository] Cache error: $e');
      }
    }
    return null;
  }

  @override
  Future<List<PemilahanBinPickup>> getJadwalHarian({String? kecamatan, String? kelurahan, String? rw}) async {
    final Map<String, dynamic> queryParams = {};
    if (kelurahan != null && kelurahan.isNotEmpty) queryParams['kelurahan'] = kelurahan;
    if (rw != null && rw.isNotEmpty) queryParams['rw'] = rw;

    try {
      final response = await apiClient.dio.get('/petugas-residu/jadwal-harian', queryParameters: queryParams);
      if (response.statusCode == 200 && response.data != null) {
        final List<dynamic> list = response.data is Map<String, dynamic>
            ? (response.data['data'] as List<dynamic>? ?? [])
            : (response.data as List<dynamic>? ?? []);
        
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_cacheKeyJadwal, jsonEncode(list));

        if (list.isNotEmpty) {
          return list.map((e) => PemilahanBinPickup.fromJson(e as Map<String, dynamic>)).toList();
        }
        return [];
      }
      throw Exception('Respon dari server tidak valid. Silakan coba beberapa saat lagi.');
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        return [];
      }
      rethrow;
    }
  }

  @override
  Future<bool> submitLog({
    required String binId,
    required double actualWeightKg,
    required String classification,
    required String photoPath,
    double? latitude,
    double? longitude,
  }) async {
    try {
      final compressedPhotoPath = await ImageCompressor.compressImage(
        photoPath,
        maxSizeBytes: 500 * 1024,
        maxWidth: 1280,
        maxHeight: 720,
      );

      debugPrint('[ApiPetugasPemilahanRepository] Creating FormData...');
      final formData = FormData.fromMap({
        'binId': binId,
        'actualWeightKg': actualWeightKg,
        'classification': classification,
        'image': await MultipartFile.fromFile(
          compressedPhotoPath, 
          filename: compressedPhotoPath.split('/').last,
          contentType: MediaType('image', 'jpeg'),
        ),
        'isGlobalBin': true,
        'timestamp': DateTime.now().toUtc().toIso8601String(),
        if (latitude != null) 'latitude': latitude,
        if (longitude != null) 'longitude': longitude,
      });
      debugPrint('[ApiPetugasPemilahanRepository] Sending request to /petugas-residu/submit-log...');

      final response = await apiClient.dio.post('/petugas-residu/submit-log', data: formData);
      debugPrint('[ApiPetugasPemilahanRepository] Response received: ${response.statusCode}');
      if (response.statusCode == 200 || response.statusCode == 201) {
        // Tampilkan push notification & update status log timbangan
        NotificationEngine().showSubmitLogTimbanganNotification(
          weightKg: actualWeightKg,
          type: classification,
        );

        // Catat notifikasi ke FirebaseNotificationService & LocalCache agar tersimpan di disk Halaman Notifikasi in-app
        final userId = response.data?['userId']?.toString() ?? 'petugas_current';
        await FirebaseNotificationService().saveNotification(
          userId: userId,
          role: 'PETUGAS_PEMILAHAN',
          title: 'Log Timbangan Berhasil Disimpan! âš–ï¸',
          desc: 'Log timbangan seberat ${actualWeightKg.toStringAsFixed(1)} kg tersimpan.',
          type: 'TIMBANGAN_PEMILAHAN',
        );

        LocalNotificationCacheService().addNotification(
          userId: userId,
          role: 'PETUGAS_PEMILAHAN',
          title: 'Log Timbangan Berhasil Disimpan! âš–ï¸',
          desc: 'Log timbangan seberat ${actualWeightKg.toStringAsFixed(1)} kg tersimpan.',
          type: 'TIMBANGAN_PEMILAHAN',
        );

        return true;
      }
      throw Exception('Gagal menyimpan data log timbangan.');
    } catch (e) {
      debugPrint('[ApiPetugasPemilahanRepository] Error caught: $e');
      rethrow;
    }
  }

  @override
  Future<List<Map<String, dynamic>>?> getCachedHistory() async {
    final prefs = await SharedPreferences.getInstance();
    final cachedStr = prefs.getString(_cacheKeyHistory);
    if (cachedStr != null && cachedStr.isNotEmpty) {
      try {
        final list = jsonDecode(cachedStr) as List<dynamic>;
        return list.cast<Map<String, dynamic>>();
      } catch (e) {
        debugPrint('[ApiPetugasPemilahanRepository] Cache error: $e');
      }
    }
    return null;
  }

  @override
  Future<List<Map<String, dynamic>>> getHistory() async {
    try {
      final response = await apiClient.dio.get('/petugas-residu/riwayat');

      if (response.statusCode == 200 && response.data != null) {
        final List<dynamic> list = response.data is Map<String, dynamic>
            ? (response.data['data'] as List<dynamic>? ?? [])
            : (response.data as List<dynamic>? ?? []);
            
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_cacheKeyHistory, jsonEncode(list));

        if (list.isNotEmpty) {
          return list.cast<Map<String, dynamic>>();
        }
        return [];
      }
      throw Exception('Respon dari server tidak valid. Silakan coba beberapa saat lagi.');
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        return [];
      }
      rethrow;
    } catch (e) {
      rethrow;
    }
  }

  @override
  Future<bool> changePassword({required String oldPassword, required String newPassword}) async {
    try {
      final response = await apiClient.dio.put(
        '/auth/password',
        data: {
          'currentPassword': oldPassword,
          'newPassword': newPassword,
        },
      );
      if (response.statusCode == 200 || response.statusCode == 201) {
        return true;
      }
      throw Exception('Gagal memperbarui kata sandi. Periksa kata sandi lama Anda.');
    } catch (e) {
      rethrow;
    }
  }

  @override
  Future<List<Map<String, dynamic>>> getDaftarPengajuanWarga() async {
    try {
      dynamic response;
      try {
        response = await apiClient.dio.get(ApiEndpoints.binsResetRequests);
      } catch (_) {
        response = await apiClient.dio.get('/petugas-residu/pengajuan');
      }

      if (response != null && response.statusCode == 200 && response.data != null) {
        List<dynamic> rawList = [];
        if (response.data is Map<String, dynamic>) {
          rawList = response.data['data'] as List<dynamic>? ?? [];
        } else if (response.data is List) {
          rawList = response.data as List<dynamic>;
        }

        return rawList.map((e) {
          if (e is Map<String, dynamic>) {
            final user = e['user'] as Map<String, dynamic>? ?? {};
            final bin = e['bin'] as Map<String, dynamic>? ?? {};
            final rtRw = bin['rw'] as Map<String, dynamic>? ?? user['rtRw'] as Map<String, dynamic>? ?? {};
            final kelurahan = bin['kelurahan'] as Map<String, dynamic>? ?? user['kelurahan'] as Map<String, dynamic>? ?? {};

            return {
              'id': e['id']?.toString() ?? '',
              'wargaName': user['name']?.toString() ?? e['wargaName']?.toString() ?? 'Warga',
              'binCode': bin['qrCode']?.toString() ?? e['binCode']?.toString() ?? e['binId']?.toString() ?? '-',
              'alasan': e['alasan']?.toString() ?? e['reason']?.toString() ?? 'Pengajuan pengosongan tempat sampah penuh',
              'address': user['address']?.toString() ?? e['address']?.toString() ?? e['alamat']?.toString() ?? '',
              'rtRw': rtRw['name']?.toString() ?? e['rw']?.toString() ?? '',
              'kelurahan': kelurahan['name']?.toString() ?? e['kelurahan']?.toString() ?? '',
              'createdAt': e['createdAt']?.toString() ?? '',
              'status': e['status']?.toString() ?? 'PENDING',
              'evidencePhotoUrl': e['evidencePhotoUrl']?.toString() ?? e['photoUrl']?.toString() ?? '',
            };
          }
          return <String, dynamic>{};
        }).where((m) => m.isNotEmpty && m['status'] == 'PENDING').toList();
      }
      return [];
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        return [];
      }
      debugPrint('[ApiPetugasPemilahanRepository] Error getDaftarPengajuanWarga: $e');
      return [];
    } catch (e) {
      debugPrint('[ApiPetugasPemilahanRepository] Error getDaftarPengajuanWarga: $e');
      return [];
    }
  }

  @override
  Future<bool> claimPengajuanReset(String pengajuanId) async {
    try {
      try {
        final response = await apiClient.dio.put(
          ApiEndpoints.binsApproveReset(pengajuanId),
        );
        if (response.statusCode == 200 || response.statusCode == 201) return true;
      } catch (_) {}

      final response = await apiClient.dio.put(
        '/petugas-residu/pengajuan/$pengajuanId/terima',
      );
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      debugPrint('[ApiPetugasPemilahanRepository] Error claimPengajuanReset: $e');
      return false;
    }
  }
}

