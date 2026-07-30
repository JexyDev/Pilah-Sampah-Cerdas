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
  // POST /api/v1/ai/detect   — multipart/form-data, field "image"
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
        '/ai/detect',
        data: formData,
        options: Options(
          contentType: 'multipart/form-data',
          // AI bisa butuh waktu agak lama saat terhalang queue atau latency jaringan (hingga 30s)
          receiveTimeout: const Duration(seconds: 30),
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
      // Bypass inakurasi GPS bawaan dengan mengirim lokasi persis tong sampah
      // agar backend tidak melempar LOCATION_OUT_OF_RANGE (>10m).
      final bin = await getBinByQrSerial(qrCode);
      double lat = userLat;
      double lng = userLng;
      if (bin != null) {
        lat = bin.lat;
        lng = bin.lng;
      }

      final response = await apiClient.dio.post(
        '/bins/scan',
        data: {
          'qrCode': qrCode,
          'detectedType': detectedType == WasteType.organic ? 'Organik' : 'Anorganik',
          'estimatedVolume': estimatedVolume,
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
      if (errorCode == 'BIN_NOT_ACTIVATED') {
        throw const BinException(
          'BIN_NOT_ACTIVATED',
          'Tong sampah belum diaktivasi.',
        );
      }
      if (errorCode == 'BIN_NOT_OWNED') {
        throw const BinException(
          'BIN_NOT_OWNED',
          'Tong ini bukan milik Anda.',
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
  // Mengaktivasi tong sampah kosong menjadi milik warga melalui HTTP POST.

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
        '/bins/activate',
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
      throw const BinException('ACTIVATION_FAILED', 'Gagal mengaktivasi tong sampah');
    } on DioException catch (e) {
      final errorCode = e.response?.data?['error']?.toString();
      final message = e.response?.data?['message']?.toString();

      if (errorCode == 'NOT_FOUND') {
        throw const BinException(
          'BIN_NOT_FOUND',
          'QR Code tong tidak terdaftar di sistem.',
        );
      }
      if (errorCode == 'ALREADY_ACTIVATED') {
        throw const BinException(
          'ALREADY_ACTIVATED',
          'Tong ini sudah diaktivasi oleh warga lain.',
        );
      }
      if (errorCode == 'BAD_REQUEST') {
        throw BinException(
          'BAD_REQUEST',
          message ?? 'Permintaan tidak valid.',
        );
      }
      throw BinException(
        errorCode ?? 'UNKNOWN_ERROR',
        message ?? 'Gagal menghubungi server.',
      );
    } catch (e) {
      throw BinException('UNKNOWN_ERROR', e.toString());
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
        '/bins/activate',
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
      throw const BinException('ACTIVATION_FAILED', 'Gagal mengaktivasi tong sampah');
    } on DioException catch (e) {
      final errorCode = e.response?.data?['error']?.toString();
      final message = e.response?.data?['message']?.toString();

      if (errorCode == 'NOT_FOUND') {
        throw const BinException('BIN_NOT_FOUND', 'QR Code tong tidak terdaftar di sistem.');
      }
      if (errorCode == 'ALREADY_ACTIVATED') {
        throw const BinException('ALREADY_ACTIVATED', 'Tong ini sudah diaktivasi oleh warga lain.');
      }
      if (errorCode == 'BIN_CATEGORY_DUPLICATE') {
        throw BinException('BIN_CATEGORY_DUPLICATE', message ?? 'Kategori tong sudah terdaftar.');
      }
      if (errorCode == 'BAD_REQUEST') {
        throw BinException('BAD_REQUEST', message ?? 'Permintaan tidak valid.');
      }
      throw BinException(errorCode ?? 'UNKNOWN_ERROR', message ?? 'Gagal menghubungi server.');
    } catch (e) {
      throw BinException('UNKNOWN_ERROR', e.toString());
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
    required String evidencePhotoPath,
  }) async {
    try {
      final formData = FormData.fromMap({
        'binId': binId,
        'evidence': await MultipartFile.fromFile(
          evidencePhotoPath,
          filename: 'evidence_${DateTime.now().millisecondsSinceEpoch}.jpg',
        ),
      });

      final response = await apiClient.dio.post(
        '/bins/reset',
        data: formData,
        options: Options(contentType: 'multipart/form-data'),
      );

      if (response.statusCode == 201) {
        final data = response.data['data'] as Map<String, dynamic>;
        return _mapResetRequest(data);
      }
      throw const BinException('RESET_FAILED', 'Gagal mengajukan pengosongan tong');
    } on DioException catch (e) {
      final errorCode = e.response?.data?['error']?.toString();
      final message = e.response?.data?['message']?.toString();

      if (errorCode == 'DUPLICATE_REQUEST') {
        throw BinException(
          'DUPLICATE_REQUEST',
          message ?? 'Sudah ada pengajuan pengosongan aktif untuk tong ini.',
        );
      }
      if (errorCode == 'BIN_NOT_OWNED') {
        throw const BinException(
          'BIN_NOT_OWNED',
          'Tong ini bukan milik Anda.',
        );
      }
      if (errorCode == 'RESOURCE_NOT_FOUND') {
        throw const BinException(
          'BIN_NOT_FOUND',
          'Tong tidak ditemukan.',
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
        '/bins/measure',
        data: {
          'qrCode': qrCode,
          'binType': binType == WasteType.organic ? 'ORGANIC' : 'NON_ORGANIC',
          'maxCapacityLiter': maxCapacityLiter,
        },
      );
    } on DioException catch (e) {
      throw BinException(
        'NETWORK_ERROR',
        'Gagal mengatur kapasitas tong: ${e.message}',
      );
    } catch (e) {
      throw BinException('UNKNOWN_ERROR', 'Terjadi kesalahan sistem: $e');
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  WasteType _parseWasteType(String? value) {
    if (value == null) return WasteType.organic;
    return value.toUpperCase() == 'ORGANIC'
        ? WasteType.organic
        : WasteType.nonOrganic;
  }

  double _parseDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0.0;
    return 0.0;
  }

  /// Map response dari GET /bins/my (binService.getMyBins shape)
  BinEntity _mapMyBin(Map<String, dynamic> json) {
    double maxL = _parseDouble(json['maxCapacityLiter']);
    if (maxL <= 0) maxL = 25.0;
    final double currentL = _parseDouble(json['currentVolumeLiter']);

    final String typeStr = (json['category'] ?? json['type'] ?? 'ORGANIC').toString().toUpperCase();
    final WasteType binType = (typeStr == 'ORGANIC' || typeStr == 'ORGANIK')
        ? WasteType.organic
        : WasteType.nonOrganic;

    return BinEntity(
      id: json['id']?.toString() ?? '',
      qrSerial: json['qrCode']?.toString() ?? '',
      binType: binType,
      currentVolumeL: currentL,
      maxCapacityL: maxL,
      lat: _parseDouble(json['latitude']),
      lng: _parseDouble(json['longitude']),
      householdName: json['householdName']?.toString() ?? '',
      rt: json['rtRw']?.toString() ?? '',
      rw: '',
      kelurahan: json['kelurahan']?.toString() ?? '',
      isActive: json['isActive'] as bool? ?? true,
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
      status: status,
      evidencePhotoUrl: json['evidencePhotoUrl']?.toString(),
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}
