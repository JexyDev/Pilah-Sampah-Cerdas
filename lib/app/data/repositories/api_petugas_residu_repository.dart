import 'dart:convert';


import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:http_parser/http_parser.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/utils/image_compressor.dart';
import '../models/petugas_residu_models.dart';
import '../providers/api_client.dart';
import '../services/notification_engine.dart';
import '../services/local_notification_cache_service.dart';
import '../services/firebase_notification_service.dart';
import 'petugas_residu_repository.dart';

class ApiPetugasResiduRepository implements PetugasResiduRepository {
  ApiPetugasResiduRepository({required this.apiClient});

  final ApiClient apiClient;

  static const _cacheKeyDashboard = 'petugas_residu_dashboard_cache';
  static const _cacheKeyJadwal = 'petugas_residu_jadwal_cache';
  static const _cacheKeyHistory = 'petugas_residu_history_cache';

  @override
  Future<PetugasResiduDashboard?> getCachedDashboard() async {
    final prefs = await SharedPreferences.getInstance();
    final cachedStr = prefs.getString(_cacheKeyDashboard);
    if (cachedStr != null && cachedStr.isNotEmpty) {
      try {
        final data = jsonDecode(cachedStr) as Map<String, dynamic>;
        return PetugasResiduDashboard.fromJson(data);
      } catch (e) {
        debugPrint('[ApiPetugasResiduRepository] Cache error: $e');
      }
    }
    return null;
  }

  @override
  Future<PetugasResiduDashboard> getDashboard() async {
    try {
      final response = await apiClient.dio.get('/petugas-residu/dashboard');
      if (response.statusCode == 200 && response.data != null) {
        final data = response.data is Map<String, dynamic> 
            ? (response.data['data'] as Map<String, dynamic>? ?? response.data as Map<String, dynamic>)
            : <String, dynamic>{};
        
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_cacheKeyDashboard, jsonEncode(data));

        return PetugasResiduDashboard.fromJson(data);
      }
      throw Exception('Invalid response');
    } catch (e) {
      final prefs = await SharedPreferences.getInstance();
      final cachedStr = prefs.getString(_cacheKeyDashboard);
      if (cachedStr != null && cachedStr.isNotEmpty) {
        try {
          final data = jsonDecode(cachedStr) as Map<String, dynamic>;
          return PetugasResiduDashboard.fromJson(data);
        } catch (e) {
          debugPrint('[ApiPetugasResiduRepository] Cache error: $e');
        }
      }
      rethrow;
    }
  }

  @override
  Future<List<ResiduBinPickup>?> getCachedJadwalHarian({String? kecamatan, String? kelurahan, String? rw}) async {
    final prefs = await SharedPreferences.getInstance();
    final cachedStr = prefs.getString(_cacheKeyJadwal);
    if (cachedStr != null && cachedStr.isNotEmpty) {
      try {
        final list = jsonDecode(cachedStr) as List<dynamic>;
        return list.map((e) => ResiduBinPickup.fromJson(e as Map<String, dynamic>)).toList();
      } catch (e) {
        debugPrint('[ApiPetugasResiduRepository] Cache error: $e');
      }
    }
    return null;
  }

  @override
  Future<List<ResiduBinPickup>> getJadwalHarian({String? kecamatan, String? kelurahan, String? rw}) async {
    final Map<String, dynamic> queryParams = {};
    if (kelurahan != null && kelurahan.isNotEmpty) queryParams['kelurahan'] = kelurahan;
    if (rw != null && rw.isNotEmpty) queryParams['rw'] = rw;

    final response = await apiClient.dio.get('/petugas-residu/jadwal-harian', queryParameters: queryParams);
    if (response.statusCode == 200 && response.data != null) {
      final List<dynamic> list = response.data is Map<String, dynamic>
          ? (response.data['data'] as List<dynamic>? ?? [])
          : (response.data as List<dynamic>? ?? []);
      
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_cacheKeyJadwal, jsonEncode(list));

      if (list.isNotEmpty) {
        return list.map((e) => ResiduBinPickup.fromJson(e as Map<String, dynamic>)).toList();
      }
      return [];
    }
    throw Exception('Invalid response');
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

      debugPrint('[ApiPetugasResiduRepository] Creating FormData...');
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
      debugPrint('[ApiPetugasResiduRepository] Sending request to /petugas-residu/submit-log...');

      final response = await apiClient.dio.post('/petugas-residu/submit-log', data: formData);
      debugPrint('[ApiPetugasResiduRepository] Response received: ${response.statusCode}');
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
          role: 'PETUGAS_RESIDU',
          title: 'Log Timbangan Berhasil Disimpan! ⚖️',
          desc: 'Log timbangan seberat ${actualWeightKg.toStringAsFixed(1)} kg tersimpan.',
          type: 'TIMBANGAN_RESIDU',
        );

        LocalNotificationCacheService().addNotification(
          userId: userId,
          role: 'PETUGAS_RESIDU',
          title: 'Log Timbangan Berhasil Disimpan! ⚖️',
          desc: 'Log timbangan seberat ${actualWeightKg.toStringAsFixed(1)} kg tersimpan.',
          type: 'TIMBANGAN_RESIDU',
        );

        return true;
      }
      throw Exception('Failed to submit log: ${response.statusCode}');
    } catch (e) {
      debugPrint('[ApiPetugasResiduRepository] Error caught: $e');
      rethrow;
    }
  }

  @override
  Future<List<Map<String, dynamic>>?> getCachedHistory({String? dateRange, String? type}) async {
    final prefs = await SharedPreferences.getInstance();
    final cachedStr = prefs.getString(_cacheKeyHistory);
    if (cachedStr != null && cachedStr.isNotEmpty) {
      try {
        final list = jsonDecode(cachedStr) as List<dynamic>;
        return list.cast<Map<String, dynamic>>();
      } catch (e) {
        debugPrint('[ApiPetugasResiduRepository] Cache error: $e');
      }
    }
    return null;
  }

  @override
  Future<List<Map<String, dynamic>>> getHistory({String? dateRange, String? type}) async {
    try {
      final response = await apiClient.dio.get('/petugas-residu/riwayat', queryParameters: {
        if (dateRange != null) 'range': dateRange,
        if (type != null) 'type': type,
      });

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
      throw Exception('Invalid response');
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
      throw Exception('Failed to change password: ${response.statusCode}');
    } catch (e) {
      rethrow;
    }
  }
}
