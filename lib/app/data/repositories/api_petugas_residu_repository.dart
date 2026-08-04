import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:http_parser/http_parser.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/utils/image_compressor.dart';
import '../models/petugas_residu_models.dart';
import '../providers/api_client.dart';
import '../services/notification_engine.dart';
import 'petugas_residu_repository.dart';

class ApiPetugasResiduRepository implements PetugasResiduRepository {
  ApiPetugasResiduRepository({required this.apiClient});

  final ApiClient apiClient;

  static const _cacheKeyDashboard = 'petugas_residu_dashboard_cache';
  static const _cacheKeyJadwal = 'petugas_residu_jadwal_cache';
  static const _cacheKeyHistory = 'petugas_residu_history_cache';

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
        } catch (_) {}
      }
      rethrow;
    }
  }

  @override
  Future<List<ResiduBinPickup>> getJadwalHarian({String? kelurahan, String? rtRw}) async {
    try {
      final Map<String, dynamic> queryParams = {};
      if (kelurahan != null && kelurahan.isNotEmpty) queryParams['kelurahan'] = kelurahan;
      if (rtRw != null && rtRw.isNotEmpty) queryParams['rtRw'] = rtRw;

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
    } catch (e) {
      final prefs = await SharedPreferences.getInstance();
      final cachedStr = prefs.getString(_cacheKeyJadwal);
      if (cachedStr != null && cachedStr.isNotEmpty) {
        try {
          final list = jsonDecode(cachedStr) as List<dynamic>;
          return list.map((e) => ResiduBinPickup.fromJson(e as Map<String, dynamic>)).toList();
        } catch (_) {}
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
        return true;
      }
      throw Exception('Failed to submit log: ${response.statusCode}');
    } catch (e) {
      debugPrint('[ApiPetugasResiduRepository] Error caught: $e');
      rethrow;
    }
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
      final prefs = await SharedPreferences.getInstance();
      final cachedStr = prefs.getString(_cacheKeyHistory);
      if (cachedStr != null && cachedStr.isNotEmpty) {
        try {
          final list = jsonDecode(cachedStr) as List<dynamic>;
          return list.cast<Map<String, dynamic>>();
        } catch (_) {}
      }
      rethrow;
    }
  }

  @override
  Future<bool> changePassword({required String oldPassword, required String newPassword}) async {
    try {
      final response = await apiClient.dio.post(
        '/auth/change-password',
        data: {
          'oldPassword': oldPassword,
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
