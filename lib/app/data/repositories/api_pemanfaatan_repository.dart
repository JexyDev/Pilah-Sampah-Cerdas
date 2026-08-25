import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../models/pemanfaatan_entity.dart';
import '../providers/api_client.dart';
import '../../core/values/api_constants.dart';
import 'pemanfaatan_repository.dart';

String? _extractErrorMessage(dynamic data, String? fallback) {
  if (data is Map<String, dynamic>) {
    final msg = data['message']?.toString() ?? data['error']?.toString();
    if (msg != null && msg.isNotEmpty) return msg;
  } else if (data is String && data.isNotEmpty) {
    if (data.length > 200) return fallback;
    return data;
  }
  return fallback;
}

/// Implementasi [PemanfaatanRepository] menggunakan Dio API Client
class ApiPemanfaatanRepository implements PemanfaatanRepository {
  const ApiPemanfaatanRepository({required this.apiClient});

  final ApiClient apiClient;

  @override
  Future<List<PemanfaatanProgramEntity>> getPrograms({String? search, String? kategori}) async {
    try {
      final Map<String, dynamic> queryParams = {};
      if (search != null && search.isNotEmpty) queryParams['search'] = search;
      if (kategori != null && kategori.isNotEmpty) queryParams['kategori'] = kategori;

      final response = await apiClient.dio.get(
        ApiEndpoints.pemanfaatan,
        queryParameters: queryParams,
      );

      if (response.statusCode == 200) {
        List<dynamic> list = [];
        if (response.data is Map<String, dynamic>) {
          list = (response.data as Map<String, dynamic>)['data'] as List<dynamic>? ?? [];
        } else if (response.data is List) {
          list = response.data as List<dynamic>;
        }
        return list.map((e) => PemanfaatanProgramEntity.fromJson(e as Map<String, dynamic>)).toList();
      }
      return [];
    } catch (e) {
      debugPrint('[ApiPemanfaatanRepository] getPrograms error: $e');
      return [];
    }
  }

  @override
  Future<PemanfaatanProgramEntity?> getProgramById(String id) async {
    try {
      final response = await apiClient.dio.get(ApiEndpoints.pemanfaatanDetail(id));
      if (response.statusCode == 200 && response.data != null) {
        final data = response.data is Map<String, dynamic>
            ? (response.data['data'] as Map<String, dynamic>? ?? response.data as Map<String, dynamic>)
            : <String, dynamic>{};
        return PemanfaatanProgramEntity.fromJson(data);
      }
      return null;
    } catch (e) {
      debugPrint('[ApiPemanfaatanRepository] getProgramById error: $e');
      return null;
    }
  }

  @override
  Future<List<FeedbackPemanfaatanEntity>> getFeedbackList({
    String? status,
    String? kategori,
    String? search,
  }) async {
    try {
      final Map<String, dynamic> queryParams = {};
      if (status != null && status.isNotEmpty && status != 'ALL') queryParams['status'] = status;
      if (kategori != null && kategori.isNotEmpty && kategori != 'ALL') queryParams['kategori'] = kategori;
      if (search != null && search.isNotEmpty) queryParams['search'] = search;

      final response = await apiClient.dio.get(
        ApiEndpoints.pemanfaatanFeedback,
        queryParameters: queryParams,
      );

      if (response.statusCode == 200) {
        List<dynamic> list = [];
        if (response.data is Map<String, dynamic>) {
          list = (response.data as Map<String, dynamic>)['data'] as List<dynamic>? ?? [];
        } else if (response.data is List) {
          list = response.data as List<dynamic>;
        }
        return list.map((e) => FeedbackPemanfaatanEntity.fromJson(e as Map<String, dynamic>)).toList();
      }
      return [];
    } catch (e) {
      debugPrint('[ApiPemanfaatanRepository] getFeedbackList error: $e');
      return [];
    }
  }

  @override
  Future<FeedbackPemanfaatanEntity> createFeedback({
    required String judul,
    required String isiKritikSaran,
    String? kategori,
    int? rating,
    String? fotoBuktiUrl,
    int? rwId,
  }) async {
    try {
      final isLocalFile = fotoBuktiUrl != null && fotoBuktiUrl.isNotEmpty && !fotoBuktiUrl.startsWith('http');
      dynamic payload;
      
      if (isLocalFile) {
        final MultipartFile file = await MultipartFile.fromFile(fotoBuktiUrl);
        payload = FormData.fromMap({
          'judul': judul,
          'isiKritikSaran': isiKritikSaran,
          if (kategori != null) 'kategori': kategori,
          if (rating != null) 'rating': rating,
          if (rwId != null) 'rwId': rwId,
          'fotoBukti': file,
        });
      } else {
        payload = {
          'judul': judul,
          'isiKritikSaran': isiKritikSaran,
          if (kategori != null) 'kategori': kategori,
          if (rating != null) 'rating': rating,
          if (fotoBuktiUrl != null && fotoBuktiUrl.isNotEmpty) 'fotoBuktiUrl': fotoBuktiUrl,
          if (rwId != null) 'rwId': rwId,
        };
      }

      final response = await apiClient.dio.post(
        ApiEndpoints.pemanfaatanFeedback,
        data: payload,
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = response.data is Map<String, dynamic>
            ? (response.data['data'] as Map<String, dynamic>? ?? response.data as Map<String, dynamic>)
            : <String, dynamic>{};
        return FeedbackPemanfaatanEntity.fromJson(data);
      }
      throw Exception('Gagal mengirim kritik & saran');
    } catch (e) {
      if (e is DioException) {
        final msg = _extractErrorMessage(e.response?.data, 'Gagal mengirim kritik & saran');
        throw Exception(msg);
      }
      rethrow;
    }
  }

  @override
  Future<FeedbackPemanfaatanEntity> respondFeedback({
    required String id,
    required String tanggapan,
    String? status,
  }) async {
    try {
      final response = await apiClient.dio.put(
        ApiEndpoints.pemanfaatanFeedbackTanggapan(id),
        data: {
          'tanggapan': tanggapan,
          if (status != null) 'status': status,
        },
      );

      if (response.statusCode == 200) {
        final data = response.data is Map<String, dynamic>
            ? (response.data['data'] as Map<String, dynamic>? ?? response.data as Map<String, dynamic>)
            : <String, dynamic>{};
        return FeedbackPemanfaatanEntity.fromJson(data);
      }
      throw Exception('Gagal memberikan tanggapan');
    } catch (e) {
      if (e is DioException) {
        final msg = _extractErrorMessage(e.response?.data, 'Gagal memberikan tanggapan');
        throw Exception(msg);
      }
      rethrow;
    }
  }

  @override
  Future<bool> deleteFeedback(String id) async {
    try {
      final response = await apiClient.dio.delete(ApiEndpoints.pemanfaatanFeedbackDelete(id));
      return response.statusCode == 200;
    } catch (e) {
      if (e is DioException) {
        final msg = _extractErrorMessage(e.response?.data, 'Gagal menghapus kritik & saran');
        throw Exception(msg);
      }
      return false;
    }
  }
}
