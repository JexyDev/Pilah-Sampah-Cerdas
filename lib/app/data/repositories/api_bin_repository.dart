import 'dart:convert';
import 'package:flutter/foundation.dart';

import 'package:dio/dio.dart';
import '../models/bin_entity.dart';
import '../models/ai_detection_entity.dart';
import '../models/bin_reset_entity.dart';
import '../models/petugas_entity.dart';
import '../models/petugas_status_response.dart';
import 'bin_repository.dart';
import '../providers/api_client.dart';

import '../../core/utils/image_compressor.dart';
import '../../core/utils/network_exception_helper.dart';
import '../../core/values/api_constants.dart';
import '../../core/values/app_config.dart';

/// Implementasi BinRepository yang terhubung ke backend Express.js.
///
/// Endpoint yang digunakan:
///   GET  /api/v1/bins/my-bins     — bins pribadi warga yg login
///   POST /api/v1/ai/detect   — upload foto + deteksi AI (FR-01)
///   POST /api/v1/bins/scan      — transaksi scan QR + geofencing (FR-02)
class ApiBinRepository implements BinRepository {
  const ApiBinRepository({required this.apiClient});

  final ApiClient apiClient;

  // ─── Get My Bins (bins milik warga yang login) ────────────────────────────
  // GET /api/v1/bins/my
  // Response shape dari binService.getMyBins():
  // { id, qrCode, type, typeLabel, maxCapacityLiter, currentVolumeLiter,
  //   capacityPercent, statusLabel, latitude, longitude, rtRw, kelurahan,
  //   isActive, lastUpdate }

  @override
  Future<List<BinEntity>> getBinsByHousehold(String householdId) async {
    const cacheKey = 'cached_bins';
    try {
      final response = await apiClient.dio.get(ApiEndpoints.binsMyBins);

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['data'] as List<dynamic>;
        await apiClient.secureStorage.write(
          key: cacheKey,
          value: jsonEncode(data),
        );

        final allKeys = await apiClient.secureStorage.readAll();
        final pendingBinIds = <String>{};
        for (final entry in allKeys.entries) {
          if (entry.key.startsWith('active_reset_request_')) {
            try {
              final reqMap = jsonDecode(entry.value);
              final status = (reqMap['status']?.toString() ?? 'PENDING')
                  .toUpperCase();
              final binId = reqMap['binId']?.toString();
              if (status == 'PENDING' && binId != null) {
                pendingBinIds.add(binId);
              }
            } catch (e) {
              debugPrint('Silenced error: $e');
            }
          }
        }

        final List<BinEntity> parsedBins = data.map((json) {
          final bin = _mapMyBin(json as Map<String, dynamic>);
          if (pendingBinIds.contains(bin.id) && bin.currentVolumeL >= (bin.maxCapacityL * 0.90)) {
            return bin.copyWith(isResetPending: true);
          }
          return bin;
        }).toList();

        // Auto-clean approved/processed reset requests jika volume tempat sampah di backend sudah 0L
        for (final entry in allKeys.entries) {
          if (entry.key.startsWith('active_reset_request_')) {
            try {
              final req = _mapResetRequest(jsonDecode(entry.value));
              final matchingBin = parsedBins.firstWhere(
                (b) => b.id == req.binId,
                orElse: () => parsedBins.firstWhere(
                  (b) => b.currentVolumeL < b.maxCapacityL,
                  orElse: () => parsedBins.first,
                ),
              );
              if (matchingBin.currentVolumeL < (matchingBin.maxCapacityL * 0.90)) {
                await apiClient.secureStorage.delete(key: entry.key);
              }
            } catch (e) {
              debugPrint('Silenced error: $e');
            }
          }
        }

        return parsedBins;
      }
      return [];
    } on DioException catch (e) {
      if (e.response?.statusCode == 403) {
        return [];
      }
      // Fallback to cache on network error
      final cachedStr = await apiClient.secureStorage.read(key: cacheKey);
      if (cachedStr != null) {
        final List<dynamic> cachedData = jsonDecode(cachedStr);

        final allKeys = await apiClient.secureStorage.readAll();
        final resetRequests = allKeys.entries
            .where((e) => e.key.startsWith('active_reset_request_'))
            .map((e) => _mapResetRequest(jsonDecode(e.value)))
            .toList();

        return cachedData.map((json) {
          final bin = _mapMyBin(json as Map<String, dynamic>);
          final isApproved = resetRequests.any(
            (req) =>
                req.binId == bin.id && req.status == BinResetStatus.approved,
          );
          if (isApproved) return bin.copyWith(currentVolumeL: 0.0);
          return bin;
        }).toList();
      }
      throw BinException(
        'NETWORK_ERROR',
        'Gagal memuat tempat sampah: ${e.message}',
      );
    } catch (e) {
      // Fallback to cache on other errors
      final cachedStr = await apiClient.secureStorage.read(key: cacheKey);
      if (cachedStr != null) {
        final List<dynamic> cachedData = jsonDecode(cachedStr);

        final allKeys = await apiClient.secureStorage.readAll();
        final resetRequests = allKeys.entries
            .where((e) => e.key.startsWith('active_reset_request_'))
            .map((e) => _mapResetRequest(jsonDecode(e.value)))
            .toList();

        return cachedData.map((json) {
          final bin = _mapMyBin(json as Map<String, dynamic>);
          final isApproved = resetRequests.any(
            (req) =>
                req.binId == bin.id && req.status == BinResetStatus.approved,
          );
          if (isApproved) return bin.copyWith(currentVolumeL: 0.0);
          return bin;
        }).toList();
      }
      if (e is BinException) rethrow;
      throw BinException('UNKNOWN_ERROR', NetworkExceptionHelper.getErrorMessage(e));
    }
  }

  @override
  Future<List<dynamic>> getAllQrBins({String? categoryId}) async {
    try {
      final queryParams = <String, dynamic>{};
      if (categoryId != null && categoryId != 'Semua') {
        queryParams['categoryId'] = categoryId;
      }

      final response = await apiClient.dio.get(
        '/bins',
        queryParameters: queryParams,
      );

      if (response.statusCode == 200) {
        return response.data['data'] as List<dynamic>;
      }
      return [];
    } catch (e) {
      throw BinException('UNKNOWN_ERROR', NetworkExceptionHelper.getErrorMessage(e));
    }
  }

  @override
  Future<List<BinEntity>> getAllBins() async {
    try {
      final response = await apiClient.dio.get(ApiEndpoints.binsMyBins);
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['data'] as List<dynamic>;
        return data
            .map((json) => _mapMyBin(json as Map<String, dynamic>))
            .toList();
      }
      return [];
    } catch (_) {
      return [];
    }
  }

  // ─── Get Bin by QR Serial ─────────────────────────────────────────────────
  // Pakai GET /bins/my lalu cari yang cocok — tidak ada endpoint by QR serial.

  @override
  Future<BinEntity?> getBinByQrSerial(String qrSerial) async {
    try {
      final response = await apiClient.dio.get(ApiEndpoints.binsMyBins);
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['data'] as List<dynamic>;
        final match = data
            .cast<Map<String, dynamic>>()
            .where((b) => (b['qrCode'] ?? '').toString() == qrSerial)
            .toList();
        if (match.isEmpty) return null;
        return _mapMyBin(match.first);
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  // ─── AI Detect (FR-01) ────────────────────────────────────────────────────
  // POST /api/v1/ai/detect   — multipart/form-data, field "image"
  // Response: { success: true, data: { detectedType, volumeEstimate, weightKg, isBlurry, confidence } }

  @override
  Future<AiDetectionEntity> detectWaste(
    String userId, {
    required String imagePath,
  }) async {
    try {
      // 1. Client-side quota check
      final todayStr = DateTime.now().toIso8601String().split('T')[0];
      final quotaKey = 'ai_limit_${userId}_$todayStr';
      final currentQuotaStr = await apiClient.secureStorage.read(key: quotaKey);
      int currentQuota = int.tryParse(currentQuotaStr ?? '0') ?? 0;

      if (currentQuota >= 50) {
        throw const BinException(
          'AI_DAILY_LIMIT',
          'Kuota harian AI sudah habis (50/hari).',
        );
      }

      // Auto-compress image before upload (Target < 1MB, max 1024x1024)
      final compressedImagePath = await ImageCompressor.compressImage(
        imagePath,
        maxSizeBytes: 1024 * 1024,
        maxWidth: 1024,
        maxHeight: 1024,
      );

      final formData = FormData.fromMap({
        'image': await MultipartFile.fromFile(
          compressedImagePath,
          filename: 'waste_${DateTime.now().millisecondsSinceEpoch}.jpg',
        ),
      });

      final response = await apiClient.dio.post(
        AppConfig.aiApiUrl,
        data: formData,
        options: Options(
          contentType: 'multipart/form-data',
          // AI bisa butuh waktu agak lama saat terhalang queue atau latency jaringan (hingga 30s)
          receiveTimeout: const Duration(seconds: 30),
        ),
      );

      if (response.statusCode == 200) {
        // Increment quota
        await apiClient.secureStorage.write(
          key: quotaKey,
          value: (currentQuota + 1).toString(),
        );

        final data = response.data['data'] as Map<String, dynamic>;
        return AiDetectionEntity(
          detectedType: _parseWasteType(data['detectedType']?.toString()),
          volumeEstimate: (data['volumeEstimate'] as num).toDouble(),
          weightKg: (data['weightKg'] as num?)?.toDouble(),
          confidence: (data['confidence'] as num?)?.toDouble(),
          organicPercentage: (data['organicPercentage'] as num?)?.toDouble(),
          estimatedPoints: (data['estimatedPoints'] as num?)?.toInt(),
          isBlurry: data['isBlurry'] as bool? ?? false,
          requestId: data['requestId']?.toString(),
          evidencePhotoUrl: data['evidencePhotoUrl']?.toString(),
        );
      }
      throw const BinException('AI_ERROR', 'Deteksi AI gagal');
    } on DioException catch (e) {
      final status = e.response?.statusCode;
      final errorCode = e.response?.data?['error']?.toString();

      if (status == 408 || errorCode == 'AI_TIMEOUT') {
        throw const BinException(
          'AI_TIMEOUT',
          'Deteksi AI timeout. Coba lagi.',
        );
      }
      if (status == 422 || errorCode == 'IMAGE_UNREADABLE') {
        throw const BinException(
          'IMAGE_UNREADABLE',
          'Foto tidak terbaca. Ambil ulang foto yang lebih jelas.',
        );
      }
      if (status == 429 || errorCode == 'QUOTA_EXCEEDED') {
        throw const BinException(
          'AI_DAILY_LIMIT',
          'Kuota harian AI sudah habis (50/hari).',
        );
      }
      final serverMsg =
          e.response?.data?['message']?.toString() ??
          e.response?.data?['error']?.toString();
      if (serverMsg != null &&
          serverMsg.isNotEmpty &&
          !serverMsg.startsWith('This exception')) {
        throw BinException('AI_ERROR', serverMsg);
      }
      throw BinException(
        'NETWORK_ERROR',
        NetworkExceptionHelper.getErrorMessage(e),
      );
    } catch (e) {
      if (e is BinException) rethrow;
      throw BinException('UNKNOWN_ERROR', 'Terjadi kesalahan sistem: $e');
    }
  }

  // ─── Scan & Commit (FR-02) ────────────────────────────────────────────────
  // POST /api/v1/bins/scan
  // Request: { qrCode, detectedType, estimatedVolume, householdId, userLat?, userLng? }
  // Response: { success: true, data: { wasteLogId, weightKg, volumeLiter, pointsAwarded, newBinVolume } }

  @override
  Future<ScanResult> scanAndCommit({
    required String qrCode,
    required String userId,
    required WasteType detectedType,
    required double estimatedVolume,
    double? confidence,
    String? evidencePhotoUrl,
    required String householdId,
    required double userLat,
    required double userLng,
  }) async {
    try {
      // Kirim koordinat user asli agar backend bisa memvalidasi Haversine (<=10m).
      double lat = userLat;
      double lng = userLng;

      final response = await apiClient.dio.post(
        ApiEndpoints.binsScan,
        data: {
          'qrCode': qrCode,
          'detectedType': detectedType == WasteType.organic
              ? 'Organik'
              : 'Anorganik',
          'estimatedVolume': estimatedVolume,
          'confidence': confidence,
          'evidencePhotoUrl': evidencePhotoUrl,
          'householdId': householdId,
          'userLat': lat,
          'userLng': lng,
        },
      );

      if (response.statusCode == 200) {
        final data = response.data['data'] as Map<String, dynamic>;
        return ScanResult(
          weightKg: (data['weightKg'] as num).toDouble(),
          pointsAwarded: (data['pointsAwarded'] as num).toInt(),
          newBinVolumeL: (data['newBinVolume'] as num).toDouble(),
        );
      }
      throw const BinException('SCAN_FAILED', 'Gagal memproses setoran');
    } on DioException catch (e) {
      final resData = e.response?.data;
      final String? serverMsg = resData is Map
          ? (resData['message']?.toString() ?? resData['error']?.toString())
          : null;
      final errorCode = resData is Map
          ? (resData['code']?.toString() ?? resData['error']?.toString())
          : null;

      if (errorCode == 'BIN_TYPE_MISMATCH' ||
          (serverMsg != null && serverMsg.toLowerCase().contains('jenis'))) {
        throw BinException(
          'BIN_TYPE_MISMATCH',
          serverMsg ?? 'Jenis sampah tidak sesuai tempat sampah ini.',
        );
      }
      if (errorCode == 'BIN_OVERFLOW' ||
          (serverMsg != null && serverMsg.toLowerCase().contains('penuh'))) {
        throw BinException(
          'BIN_OVERFLOW',
          serverMsg ??
              'Tempat Sampah sudah penuh! Ajukan pengosongan tempat sampah.',
        );
      }
      if (errorCode == 'LOCATION_OUT_OF_RANGE' ||
          (serverMsg != null && serverMsg.toLowerCase().contains('jauh'))) {
        throw BinException(
          'LOCATION_OUT_OF_RANGE',
          serverMsg ??
              'Anda berada lebih dari 25 meter dari tempat sampah. Harap mendekat ke lokasi tempat sampah.',
        );
      }
      if (errorCode == 'RESOURCE_NOT_FOUND' ||
          errorCode == 'BIN_NOT_FOUND' ||
          (serverMsg != null &&
              serverMsg.toLowerCase().contains('ditemukan'))) {
        throw BinException(
          'BIN_NOT_FOUND',
          serverMsg ?? 'QR Code tempat sampah tidak ditemukan di sistem.',
        );
      }
      if (errorCode == 'BIN_NOT_ACTIVATED' ||
          (serverMsg != null && serverMsg.toLowerCase().contains('aktivasi'))) {
        throw BinException(
          'BIN_NOT_ACTIVATED',
          serverMsg ?? 'Tempat Sampah sampah belum diaktivasi.',
        );
      }
      if (errorCode == 'BIN_NOT_OWNED' ||
          (serverMsg != null && serverMsg.toLowerCase().contains('milik'))) {
        throw BinException(
          'BIN_NOT_OWNED',
          serverMsg ?? 'Tempat Sampah ini bukan milik Anda.',
        );
      }
      if (errorCode == 'VALIDATION_ERROR') {
        throw BinException(
          'HOUSEHOLD_REQUIRED',
          serverMsg ?? 'Data rumah tangga belum tersedia. Coba login ulang.',
        );
      }
      if (errorCode == 'EVIDENCE_PHOTO_MISSING' ||
          errorCode == 'AI_CONFIDENCE_MISSING') {
        throw BinException(
          errorCode!,
          serverMsg ??
              'Deteksi AI tidak valid. Silakan foto ulang dan kirim lagi.',
        );
      }

      if (serverMsg != null &&
          serverMsg.isNotEmpty &&
          !serverMsg.startsWith('This exception')) {
        throw BinException('SCAN_FAILED', serverMsg);
      }

      throw BinException(
        'NETWORK_ERROR',
        NetworkExceptionHelper.getErrorMessage(e),
      );
    } catch (e) {
      if (e is BinException) rethrow;
      throw BinException('UNKNOWN_ERROR', 'Terjadi kesalahan sistem: $e');
    }
  }

  // ─── Activate Bin ─────────────────────────────────────────────────────────
  // Mengaktivasi tempat sampah kosong menjadi milik warga melalui HTTP POST.

  @override
  Future<BinEntity> activateBin({
    required String qrSerial,
    required String userId,
    required String householdId,
    double? latitude,
    double? longitude,
  }) async {
    try {
      final response = await apiClient.dio.post(
        ApiEndpoints.binsActivate,
        data: {
          'qrCode': qrSerial,
          if (latitude != null) 'latitude': latitude,
          if (longitude != null) 'longitude': longitude,
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = response.data['data'];
        if (data is List && data.isNotEmpty) {
          return _mapMyBin(data.first as Map<String, dynamic>);
        }
        return _mapMyBin(data as Map<String, dynamic>);
      }
      throw const BinException(
        'ACTIVATION_FAILED',
        'Gagal mengaktivasi tempat sampah',
      );
    } on DioException catch (e) {
      final errorCode = e.response?.data?['error']?.toString();
      final message = e.response?.data?['message']?.toString();

      if (errorCode == 'NOT_FOUND' || errorCode == 'BIN_NOT_FOUND') {
        throw const BinException(
          'BIN_NOT_FOUND',
          'QR Code tempat sampah tidak terdaftar di sistem.',
        );
      }
      if (errorCode == 'ALREADY_ACTIVATED' ||
          errorCode == 'BIN_ALREADY_USED' ||
          (errorCode != null && errorCode.startsWith('BIN_ALREADY_USED')) ||
          (message != null && message.contains('BIN_ALREADY_USED'))) {
        throw const BinException(
          'ALREADY_ACTIVATED',
          'QR Tempat Sampah ini sudah diaktivasi oleh warga lain.',
        );
      }
      if (errorCode == 'BAD_REQUEST') {
        throw BinException('BAD_REQUEST', message ?? 'Permintaan tidak valid.');
      }
      throw BinException(
        errorCode ?? 'UNKNOWN_ERROR',
        message ?? 'Gagal menghubungi server.',
      );
    } catch (e) {
      throw BinException('UNKNOWN_ERROR', NetworkExceptionHelper.getErrorMessage(e));
    }
  }

  @override
  Future<List<BinEntity>> activateBinsBatch({
    required List<String> qrSerials,
    required String userId,
    required String householdId,
    double? latitude,
    double? longitude,
  }) async {
    try {
      final response = await apiClient.dio.post(
        ApiEndpoints.binsActivate,
        data: {
          'qrCodes': qrSerials,
          if (latitude != null) 'latitude': latitude,
          if (longitude != null) 'longitude': longitude,
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = response.data['data'];
        if (data is List) {
          return data.map((e) => _mapMyBin(e as Map<String, dynamic>)).toList();
        }
      }
      throw const BinException(
        'ACTIVATION_FAILED',
        'Gagal mengaktivasi tempat sampah',
      );
    } on DioException catch (e) {
      final errorCode = e.response?.data?['error']?.toString();
      final message = e.response?.data?['message']?.toString();

      if (errorCode == 'NOT_FOUND' || errorCode == 'BIN_NOT_FOUND') {
        throw const BinException(
          'BIN_NOT_FOUND',
          'QR Code tempat sampah tidak terdaftar di sistem.',
        );
      }
      if (errorCode == 'ALREADY_ACTIVATED' ||
          errorCode == 'BIN_ALREADY_USED' ||
          (errorCode != null && errorCode.startsWith('BIN_ALREADY_USED')) ||
          (message != null && message.contains('BIN_ALREADY_USED'))) {
        throw const BinException(
          'ALREADY_ACTIVATED',
          'QR Tempat Sampah ini sudah diaktivasi oleh warga lain.',
        );
      }
      if (errorCode == 'BIN_CATEGORY_DUPLICATE') {
        throw BinException(
          'BIN_CATEGORY_DUPLICATE',
          message ?? 'Kategori tempat sampah sudah terdaftar.',
        );
      }
      if (errorCode == 'BAD_REQUEST') {
        throw BinException('BAD_REQUEST', message ?? 'Permintaan tidak valid.');
      }
      throw BinException(
        errorCode ?? 'UNKNOWN_ERROR',
        message ?? 'Gagal menghubungi server.',
      );
    } catch (e) {
      throw BinException('UNKNOWN_ERROR', NetworkExceptionHelper.getErrorMessage(e));
    }
  }

  // ─── Submit Reset Request ─────────────────────────────────────────────────
  // POST /api/v1/bins/reset
  // Request: multipart/form-data — field "binId" (UUID) + file "evidence" (image)
  // Response: { success: true, data: { id, binId, userId, status, evidencePhotoUrl, createdAt } }

  @override
  Future<BinResetEntity> submitResetRequest({
    required String binId,
    required String userId,
    String? evidencePhotoPath,
    String? wargaName,
    String? petugasId,
    String? jenisSampah,
  }) async {
    try {
      String? compressedEvidencePath;
      if (evidencePhotoPath != null && evidencePhotoPath.isNotEmpty) {
        compressedEvidencePath = await ImageCompressor.compressImage(
          evidencePhotoPath,
          maxSizeBytes: 5 * 1024 * 1024,
          maxWidth: 1920,
          maxHeight: 1080,
        );
      }

      final formData = FormData.fromMap({
        'binId': binId,
        'userId': userId,
        if (wargaName != null && wargaName.isNotEmpty) 'wargaName': wargaName,
        if (petugasId != null && petugasId.isNotEmpty) 'petugasId': petugasId,
        if (jenisSampah != null && jenisSampah.isNotEmpty) 'jenisSampah': jenisSampah,
        if (compressedEvidencePath != null)
          'evidence': await MultipartFile.fromFile(
            compressedEvidencePath,
            filename: 'evidence_${DateTime.now().millisecondsSinceEpoch}.jpg',
          ),
      });

      final response = await apiClient.dio.post(
        ApiEndpoints.binsReset,
        data: formData,
        options: Options(contentType: 'multipart/form-data'),
      );

      if (response.statusCode == 201) {
        final data = response.data['data'] as Map<String, dynamic>;
        // Paksa auto-approve di mobile (sekarang manual dan instan)
        data['status'] = 'APPROVED';
        final resetEntity = _mapResetRequest(data);
        
        // Refresh API akan mengambil kapasitas 0L
        return resetEntity;
      }
      throw const BinException(
        'RESET_FAILED',
        'Gagal mengajukan pengosongan tong',
      );
    } on DioException catch (e) {
      final errorCode = e.response?.data?['error']?.toString();
      final message = e.response?.data?['message']?.toString();

      if (errorCode == 'DUPLICATE_REQUEST') {
        throw BinException(
          'DUPLICATE_REQUEST',
          message ??
              'Sudah ada pengajuan pengosongan aktif untuk tempat sampah ini.',
        );
      }
      if (errorCode == 'BIN_NOT_OWNED') {
        throw const BinException(
          'BIN_NOT_OWNED',
          'Tempat Sampah ini bukan milik Anda.',
        );
      }
      if (errorCode == 'RESOURCE_NOT_FOUND') {
        throw const BinException(
          'BIN_NOT_FOUND',
          'Tempat Sampah tidak ditemukan.',
        );
      }
      if (errorCode == 'VALIDATION_ERROR') {
        throw BinException(
          'VALIDATION_ERROR',
          message ?? 'Foto bukti wajib diunggah.',
        );
      }
      throw BinException(
        'NETWORK_ERROR',
        'Gagal terhubung ke server: ${e.message}',
      );
    } catch (e) {
      if (e is BinException) rethrow;
      throw BinException('UNKNOWN_ERROR', 'Terjadi kesalahan sistem: $e');
    }
  }

  @override
  Future<BinResetEntity?> getActiveResetRequest(String userId) async {
    try {
      final cachedStr = await apiClient.secureStorage.read(
        key: 'active_reset_request_$userId',
      );
      if (cachedStr != null) {
        // Cek apakah tong-tempat sampah pengguna saat ini sudah kosong/dikirim ulang (< 25L)
        try {
          final bins = await getBinsByHousehold(userId);
          final bool isAnyFull = bins.any(
            (b) => b.isActive && b.currentVolumeL >= b.maxCapacityL,
          );
          if (!isAnyFull) {
            // Jika semua tempat sampah sudah tidak penuh (misal 0L), berarti pengajuan sudah disetujui/selesai!
            await apiClient.secureStorage.delete(
              key: 'active_reset_request_$userId',
            );
            return null;
          }
        } catch (e) {
          debugPrint('Silenced error: $e');
        }

        final data = jsonDecode(cachedStr) as Map<String, dynamic>;
        return _mapResetRequest(data);
      }
    } catch (e) {
      debugPrint('Silenced error: $e');
    }
    return null;
  }

  @override
  Future<PetugasStatusResponse> getPetugasStatus() async {
    try {
      final response = await apiClient.dio.get(ApiEndpoints.binsResetPetugasStatus);
      return PetugasStatusResponse.fromJson(response.data['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw BinException('NETWORK_ERROR', 'Gagal memuat status petugas: ${e.message}');
    } catch (e) {
      throw BinException('UNKNOWN_ERROR', 'Terjadi kesalahan sistem: $e');
    }
  }

  @override
  Future<List<PetugasEntity>> getPetugasWilayah() async {
    try {
      final response = await apiClient.dio.get(ApiEndpoints.binsResetPetugasWilayah);
      final List data = response.data['data'] as List? ?? [];
      return data.map((e) => PetugasEntity.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw BinException('NETWORK_ERROR', 'Gagal memuat daftar petugas: ${e.message}');
    } catch (e) {
      throw BinException('UNKNOWN_ERROR', 'Terjadi kesalahan sistem: $e');
    }
  }

  @override
  Future<String> setDefaultPetugas(String petugasId) async {
    try {
      final response = await apiClient.dio.post(
        ApiEndpoints.binsResetSetDefaultPetugas,
        data: {'petugasId': petugasId},
      );
      return response.data['data']['petugasId']?.toString() ?? petugasId;
    } on DioException catch (e) {
      throw BinException('NETWORK_ERROR', 'Gagal menyimpan petugas pilihan: ${e.message}');
    } catch (e) {
      throw BinException('UNKNOWN_ERROR', 'Terjadi kesalahan sistem: $e');
    }
  }

  // ─── Measure Bin ──────────────────────────────────────────────────────────
  // POST /api/v1/bins/measure
  // Request: { qrCode, binType, maxCapacityLiter }
  @override
  Future<void> measureBin({
    required String qrCode,
    required WasteType binType,
    required double maxCapacityLiter,
  }) async {
    try {
      await apiClient.dio.post(
        ApiEndpoints.binsMeasure,
        data: {
          'qrCode': qrCode,
          'binType': binType == WasteType.organic ? 'ORGANIC' : 'NON_ORGANIC',
          'maxCapacityLiter': maxCapacityLiter,
        },
      );
    } on DioException catch (e) {
      throw BinException(
        'NETWORK_ERROR',
        'Gagal mengatur kapasitas tempat sampah: ${e.message}',
      );
    } catch (e) {
      throw BinException('UNKNOWN_ERROR', 'Terjadi kesalahan sistem: $e');
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  WasteType _parseWasteType(String? value) {
    if (value == null) return WasteType.organic;
    final upper = value.toUpperCase();
    if (upper.contains('NON') || upper.contains('ANORG')) return WasteType.nonOrganic;
    if (upper.contains('ORG')) return WasteType.organic;
    return WasteType.nonOrganic; // Default
  }

  double _parseDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0.0;
    return 0.0;
  }

  BinEntity _mapMyBin(Map<String, dynamic> json) {
    double maxL = _parseDouble(
      json['maxCapacityLiter'] ?? json['maxCapacityL'] ?? json['maxCapacity'],
    );
    if (maxL <= 0) maxL = 25.0;
    final double currentL = _parseDouble(
      json['currentVolumeLiter'] ??
          json['currentVolumeL'] ??
          json['currentVolume'],
    );
    final String qrSerial =
        (json['qrCode'] ?? json['qrSerial'] ?? json['code'] ?? '').toString();

    final String typeStr =
        (json['category'] ?? json['type'] ?? json['binType'] ?? 'ORGANIC')
            .toString()
            .toUpperCase();
    WasteType binType = WasteType.nonOrganic;
    if (typeStr.contains('NON') || typeStr.contains('ANORG')) {
      binType = WasteType.nonOrganic;
    } else if (typeStr.contains('ORG')) {
      binType = WasteType.organic;
    }

    final bool isResetPending =
        json['isResetPending'] == true ||
        json['resetStatus']?.toString().toUpperCase() == 'PENDING' ||
        json['status']?.toString().toUpperCase() == 'RESET_PENDING';

    return BinEntity(
      id: json['id']?.toString() ?? '',
      qrSerial: qrSerial,
      binType: binType,
      currentVolumeL: currentL,
      maxCapacityL: maxL,
      lat: _parseDouble(json['latitude'] ?? json['lat']),
      lng: _parseDouble(json['longitude'] ?? json['lng']),
      householdName: json['householdName']?.toString() ?? '',

      rw: json['rw']?.toString() ?? '',
      kelurahan: json['kelurahan']?.toString() ?? '',
      isResetPending: isResetPending,
      isActive:
          (json['isActive'] as bool?) ??
          (json['enabled'] as bool?) ??
          (json['status']?.toString().toUpperCase() != 'INACTIVE' &&
              json['status']?.toString().toUpperCase() != 'NON_AKTIF' &&
              json['status']?.toString().toUpperCase() != 'DISABLED' &&
              json['isDeactivated'] != true),
      backendStatus: json['status']?.toString() ?? json['statusLabel']?.toString() ?? '',
    );
  }

  /// Map response dari POST /bins/reset ke BinResetEntity
  BinResetEntity _mapResetRequest(Map<String, dynamic> json) {
    final statusStr = (json['status']?.toString() ?? 'PENDING').toUpperCase();
    BinResetStatus status;
    switch (statusStr) {
      case 'APPROVED':
        status = BinResetStatus.approved;
        break;
      case 'REJECTED':
        status = BinResetStatus.rejected;
        break;
      default:
        status = BinResetStatus.pending;
    }

    return BinResetEntity(
      id: json['id']?.toString() ?? '',
      binId: json['binId']?.toString() ?? '',
      userId: json['userId']?.toString() ?? '',
      rwId: json['rwId']?.toString() ?? json['rtRwId']?.toString() ?? '',
      status: status,
      evidencePhotoUrl: json['evidencePhotoUrl']?.toString(),
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}

