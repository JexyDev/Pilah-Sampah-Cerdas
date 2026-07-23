/**
 * Project: Pilah Sampah Cerdas
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import 'package:dio/dio.dart';
import '../../../domain/entities/bin_entity.dart';
import '../../../domain/entities/ai_detection_entity.dart';
import '../../../domain/entities/bin_reset_entity.dart';
import '../../../domain/repositories/bin_repository.dart';
import '../network/api_client.dart';

/// Implementasi BinRepository yang terhubung ke backend Express.js.
///
/// Endpoint yang digunakan:
///   GET  /api/v1/bins/my-bins     — bins pribadi warga yg login
///   POST /api/v1/waste/detect   — upload foto + deteksi AI (FR-01)
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
    try {
      final response = await apiClient.dio.get('/bins/my-bins');

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['data'] as List<dynamic>;
        return data
            .map((json) => _mapMyBin(json as Map<String, dynamic>))
            .toList();
      }
      return [];
    } on DioException catch (e) {
      throw BinException(
        'NETWORK_ERROR',
        'Gagal memuat tong sampah: ${e.message}',
      );
    } catch (e) {
      if (e is BinException) rethrow;
      throw BinException('UNKNOWN_ERROR', e.toString());
    }
  }

  // ─── Get Bin by QR Serial ─────────────────────────────────────────────────
  // Pakai GET /bins/my lalu cari yang cocok — tidak ada endpoint by QR serial.

  @override
  Future<BinEntity?> getBinByQrSerial(String qrSerial) async {
    try {
      final response = await apiClient.dio.get('/bins/my-bins');
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
  // POST /api/v1/waste/detect   — multipart/form-data, field "image"
  // Response: { success: true, data: { detectedType, volumeEstimate, weightKg, isBlurry, confidence } }

  @override
  Future<AiDetectionEntity> detectWaste(
    String userId, {
    required String imagePath,
  }) async {
    try {
      final formData = FormData.fromMap({
        'image': await MultipartFile.fromFile(
          imagePath,
          filename: 'waste_${DateTime.now().millisecondsSinceEpoch}.jpg',
        ),
      });

      final response = await apiClient.dio.post(
        '/waste/detect',
        data: formData,
        options: Options(
          contentType: 'multipart/form-data',
          // AI bisa butuh sampai 5 detik saat queue penuh
          receiveTimeout: const Duration(seconds: 10),
        ),
      );

      if (response.statusCode == 200) {
        final data = response.data['data'] as Map<String, dynamic>;
        return AiDetectionEntity(
          detectedType: _parseWasteType(data['detectedType']?.toString()),
          volumeEstimate: (data['volumeEstimate'] as num).toDouble(),
          weightKg: (data['weightKg'] as num?)?.toDouble(),
          confidence: (data['confidence'] as num?)?.toDouble(),
          isBlurry: data['isBlurry'] as bool? ?? false,
          requestId: data['requestId']?.toString(),
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
      throw BinException(
        'NETWORK_ERROR',
        'Gagal terhubung ke server: ${e.message}',
      );
    } catch (e) {
      throw BinException(
        'UNKNOWN_ERROR',
        'Terjadi kesalahan sistem: $e',
      );
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
    required String householdId,
    required double userLat,
    required double userLng,
  }) async {
    try {
      final response = await apiClient.dio.post(
        '/bins/scan',
        data: {
          'qrCode': qrCode,
          'detectedType': detectedType == WasteType.organic ? 'ORGANIC' : 'NON_ORGANIC',
          'estimatedVolume': estimatedVolume,
          'householdId': householdId,
          'userLat': userLat,
          'userLng': userLng,
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
      final errorCode = e.response?.data?['error']?.toString();

      if (errorCode == 'BIN_TYPE_MISMATCH') {
        throw const BinException(
          'BIN_TYPE_MISMATCH',
          'Jenis sampah tidak sesuai tong ini.',
        );
      }
      if (errorCode == 'BIN_OVERFLOW') {
        throw const BinException(
          'BIN_OVERFLOW',
          'Tong sudah penuh! Ajukan pengosongan tong.',
        );
      }
      if (errorCode == 'LOCATION_OUT_OF_RANGE') {
        throw const BinException(
          'LOCATION_OUT_OF_RANGE',
          'Anda terlalu jauh dari tong sampah (> 10m).',
        );
      }
      if (errorCode == 'RESOURCE_NOT_FOUND') {
        throw const BinException(
          'BIN_NOT_FOUND',
          'QR Code tong tidak ditemukan.',
        );
      }
      if (errorCode == 'VALIDATION_ERROR') {
        // householdId kosong atau tidak valid
        throw const BinException(
          'HOUSEHOLD_REQUIRED',
          'Data rumah tangga belum tersedia. Coba login ulang.',
        );
      }
      throw BinException(
        'NETWORK_ERROR',
        'Gagal terhubung ke server: ${e.message}',
      );
    } catch (e) {
      throw BinException(
        'UNKNOWN_ERROR',
        'Terjadi kesalahan sistem: $e',
      );
    }
  }

  // ─── Activate Bin ─────────────────────────────────────────────────────────
  // Cari bin dari /bins/my berdasarkan qrSerial.

  @override
  Future<BinEntity> activateBin({
    required String qrSerial,
    required String userId,
    required String householdId,
  }) async {
    try {
      final bin = await getBinByQrSerial(qrSerial);
      if (bin == null) {
        throw const BinException(
          'BIN_NOT_FOUND',
          'QR Code tong tidak ditemukan.',
        );
      }
      return bin;
    } on BinException {
      rethrow;
    } catch (e) {
      throw BinException('UNKNOWN_ERROR', e.toString());
    }
  }

  // ─── Submit Reset Request ─────────────────────────────────────────────────

  @override
  Future<BinResetEntity> submitResetRequest({
    required String binId,
    required String userId,
    required String evidencePhotoPath,
  }) async {
    return BinResetEntity(
      id: 'reset-${DateTime.now().millisecondsSinceEpoch}',
      binId: binId,
      userId: userId,
      status: BinResetStatus.pending,
      evidencePhotoUrl: evidencePhotoPath,
      createdAt: DateTime.now(),
    );
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  WasteType _parseWasteType(String? value) {
    if (value == null) return WasteType.organic;
    return value.toUpperCase() == 'ORGANIC'
        ? WasteType.organic
        : WasteType.nonOrganic;
  }

  /// Map response dari GET /bins/my (binService.getMyBins shape)
  BinEntity _mapMyBin(Map<String, dynamic> json) {
    final double maxL = (json['maxCapacityLiter'] as num? ?? 25).toDouble();
    final double currentL = (json['currentVolumeLiter'] as num? ?? 0)
        .toDouble();

    final String typeStr = (json['type'] ?? 'ORGANIC').toString().toUpperCase();
    final WasteType binType = typeStr == 'ORGANIC'
        ? WasteType.organic
        : WasteType.nonOrganic;

    return BinEntity(
      id: json['id']?.toString() ?? '',
      qrSerial: json['qrCode']?.toString() ?? '',
      binType: binType,
      currentVolumeL: currentL,
      maxCapacityL: maxL,
      lat: (json['latitude'] as num?)?.toDouble() ?? 0.0,
      lng: (json['longitude'] as num?)?.toDouble() ?? 0.0,
      householdName: json['kelurahan']?.toString() ?? '',
      rt: json['rtRw']?.toString() ?? '',
      rw: '',
      kelurahan: json['kelurahan']?.toString() ?? '',
      isActive: json['isActive'] as bool? ?? true,
    );
  }
}
