import 'dart:convert';
import 'package:dio/dio.dart';
import '../models/waste_log_entity.dart';
import '../models/point_history_entity.dart';
import '../models/bin_entity.dart';
import 'waste_log_repository.dart';
import '../../core/utils/app_exceptions.dart';
import '../providers/api_client.dart';
import '../../core/values/api_constants.dart';

/// Implementasi WasteLogRepository yang terhubung ke backend Express.js.
///
/// Endpoint yang digunakan:
///   GET /api/v1/points/me              — total poin + riwayat poin user saat ini
///   GET /api/v1/transactions/deposits  — riwayat setoran sampah (20 terbaru)
class ApiWasteLogRepository implements WasteLogRepository {
  const ApiWasteLogRepository({required this.apiClient});

  final ApiClient apiClient;

  // ─── Waste Logs (Riwayat Setoran per User) ───────────────────────────────
  // GET /api/v1/transactions/my-deposits
  // Response: { success: true, data: [{ id, tanggal, warga, kategori, berat, poin, createdAt }] }

  @override
  Future<List<WasteLogEntity>?> getCachedWasteLogs(String userId) async {
    final cacheKey = 'cached_waste_logs_$userId';
    try {
      final cachedStr = await apiClient.secureStorage.read(key: cacheKey);
      if (cachedStr != null) {
        final List<dynamic> cachedData = jsonDecode(cachedStr);
        return cachedData
            .map((json) => _mapWasteLog(json as Map<String, dynamic>, userId))
            .toList();
      }
    } catch (e) {
      // Abaikan error saat membaca cache
    }
    return null;
  }

  @override
  Future<List<WasteLogEntity>> getWasteLogsByUser(String userId) async {
    final cacheKey = 'cached_waste_logs_$userId';
    try {
      final response = await apiClient.dio.get(ApiEndpoints.transactionsMyDeposits);

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['data'] as List<dynamic>;
        
        await apiClient.secureStorage.write(key: cacheKey, value: jsonEncode(data));
        
        return data
            .map((json) => _mapWasteLog(json as Map<String, dynamic>, userId))
            .toList();
      }
      return [];
    } on DioException catch (e) {
      throw AppNetworkException(mapDioExceptionToMessage(e));
    } catch (e) {
      if (e is AppNetworkException) rethrow;
      throw AppNetworkException('Kesalahan sistem: $e');
    }
  }

  // ─── Point History ────────────────────────────────────────────────────────
  // GET /api/v1/points/me
  // Response: { success: true, data: { totalPoints: int, history: [{ id, userId, points, description, createdAt }] } }

  @override
  Future<List<PointHistoryEntity>> getPointHistoryByUser(String userId) async {
    try {
      final response = await apiClient.dio.get(ApiEndpoints.pointsMe);

      if (response.statusCode == 200) {
        final data = response.data['data'] as Map<String, dynamic>;
        final List<dynamic> history = data['history'] as List<dynamic>? ?? [];

        return history
            .map((json) => _mapPointHistory(json as Map<String, dynamic>))
            .toList();
      }
      throw Exception('Gagal memuat riwayat poin');
    } on DioException catch (e) {
      throw AppNetworkException(mapDioExceptionToMessage(e));
    } catch (e) {
      if (e is AppNetworkException) rethrow;
      throw AppNetworkException('Kesalahan sistem: $e');
    }
  }

  // ─── Total Points ─────────────────────────────────────────────────────────

  @override
  Future<int> getTotalPointsByUser(String userId) async {
    try {
      final response = await apiClient.dio.get(ApiEndpoints.pointsMe);

      if (response.statusCode == 200) {
        final data = response.data['data'] as Map<String, dynamic>;
        return (data['totalPoints'] as num?)?.toInt() ?? 0;
      }
      throw Exception('Gagal memuat total poin');
    } on DioException catch (e) {
      throw AppNetworkException(mapDioExceptionToMessage(e));
    } catch (e) {
      if (e is AppNetworkException) rethrow;
      throw AppNetworkException('Kesalahan sistem: $e');
    }
  }

  // ─── Peringkat User ───────────────────────────────────────────────────────

  @override
  Future<String> getUserLeaderboardRank(String userId) async {
    try {
      final response = await apiClient.dio.get(ApiEndpoints.pointsLeaderboard);

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['data'] as List<dynamic>;
        
        final userEntry = data.firstWhere(
          (entry) => entry['id'] == userId,
          orElse: () => null,
        );

        if (userEntry != null) {
          final rank = userEntry['rank'];
          return '$rank';
        }
        return '-';
      }
      return '-';
    } on DioException catch (_) {
      return '-';
    } catch (_) {
      return '-';
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  WasteLogEntity _mapWasteLog(Map<String, dynamic> json, String userId) {
    final String rawKategori = (json['wasteType'] ?? json['kategori'] ?? json['type'] ?? '').toString().toUpperCase();
    final wasteType = (rawKategori == 'ORGANIC' || rawKategori == 'ORGANIK')
        ? WasteType.organic
        : WasteType.nonOrganic;

    // berat dari backend: coba weightKg dulu, fallback ke berat/volumeLiter
    final double weightKg = double.tryParse(
      json['weightKg']?.toString() ?? 
      json['berat']?.toString() ?? 
      json['volumeLiter']?.toString() ?? 
      '0'
    ) ?? 0.0;
    
    // Ambil poin dari pointsAwarded, poin, atau points
    final int poin = (json['pointsAwarded'] as num?)?.toInt() ?? 
        (json['poin'] as num?)?.toInt() ?? 
        (json['points'] as num?)?.toInt() ?? 0;

    // Ambil lokasi tempat sampah jika ada
    final String rawLoc = json['binLocation']?.toString() ??
        json['kelurahan']?.toString() ??
        json['rtRw']?.toString() ??
        json['alamat']?.toString() ??
        json['address']?.toString() ??
        json['location']?.toString() ??
        '';
    final String? binLocation = (rawLoc.isEmpty || rawLoc == 'null' || rawLoc == 'Lokasi tidak diketahui') ? null : rawLoc;

    // tanggal: coba ISO 8601 dulu (dari my-deposits), fallback "12 Jan 2025"
    DateTime createdAt;
    try {
      final raw =
          json['createdAt']?.toString() ?? json['tanggal']?.toString() ?? '';
      createdAt = raw.contains('T') ? DateTime.parse(raw) : _parseIdDate(raw);
    } catch (_) {
      createdAt = DateTime.now();
    }

    return WasteLogEntity(
      id: json['id']?.toString() ?? '',
      userId: userId,
      binId: '',
      wasteType: wasteType,
      weightKg: weightKg,
      volumeLiter: weightKg / (wasteType == WasteType.organic ? 0.4 : 0.2),
      pointsAwarded: poin,
      createdAt: createdAt,
      kelurahan: binLocation,
      discrepancyStatus: json['discrepancyStatus']?.toString() ?? 'NONE',
      aiConfidence: (json['aiConfidence'] as num?)?.toDouble() ?? 0.0,
    );
  }

  PointHistoryEntity _mapPointHistory(Map<String, dynamic> json) {
    final String desc = json['description']?.toString() ?? '';
    // Deteksi jenis sampah dari description
    final wasteType =
        desc.toUpperCase().contains('NON_ORGANIC') ||
            desc.toUpperCase().contains('ANORGANIK')
        ? WasteType.nonOrganic
        : WasteType.organic;

    DateTime createdAt;
    try {
      createdAt = DateTime.parse(json['createdAt']?.toString() ?? '');
    } catch (_) {
      createdAt = DateTime.now();
    }

    return PointHistoryEntity(
      id: json['id']?.toString() ?? '',
      userId: json['userId']?.toString() ?? '',
      points: (json['points'] as num?)?.toInt() ?? 0,
      wasteType: wasteType,
      description: desc,
      createdAt: createdAt,
    );
  }

  /// Parse tanggal format "12 Jan 2025" (id-ID locale dari backend).
  DateTime _parseIdDate(String raw) {
    const months = {
      'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4,
      'Mei': 5, 'Jun': 6, 'Jul': 7, 'Agu': 8,
      'Sep': 9, 'Okt': 10, 'Nov': 11, 'Des': 12,
      // fallback English
      'May': 5, 'Aug': 8, 'Oct': 10, 'Dec': 12,
    };
    final parts = raw.trim().split(' ');
    if (parts.length < 3) return DateTime.now();
    final day = int.tryParse(parts[0]) ?? 1;
    final month = months[parts[1]] ?? 1;
    final year = int.tryParse(parts[2]) ?? DateTime.now().year;
    return DateTime(year, month, day);
  }
}
