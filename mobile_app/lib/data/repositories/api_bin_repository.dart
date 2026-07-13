import 'package:dio/dio.dart';
import '../../../domain/entities/bin_entity.dart';
import '../../../domain/entities/ai_detection_entity.dart';
import '../../../domain/entities/bin_reset_entity.dart';
import '../../../domain/repositories/bin_repository.dart';
import '../network/api_client.dart';

class ApiBinRepository implements BinRepository {
  final ApiClient apiClient;

  ApiBinRepository({required this.apiClient});

  @override
  Future<List<BinEntity>> getBinsByHousehold(String householdId) async {
    try {
      final response = await apiClient.dio.get('/bins/household/$householdId');
      if (response.statusCode == 200) {
        final List data = response.data['data'];
        return data.map((json) => BinEntity(
          id: json['qrSerial'].toString(),
          qrSerial: json['qrSerial'].toString(),
          binType: json['type'].toString().toLowerCase() == 'organik' ? WasteType.organic : WasteType.nonOrganic,
          currentVolumeL: (json['currentVolumeL'] as num).toDouble(),
          maxCapacityL: (json['capacityKg'] as num).toDouble() * 10.0,
          lat: -6.8915,
          lng: 107.6107,
          householdName: 'Rumah Tangga',
          rt: 'RT 01',
          rw: 'RW 01',
          kelurahan: 'Coblong',
          isActive: true,
        )).toList();
      }
      return [];
    } catch (e) {
      throw const BinException('NETWORK_ERROR', 'Gagal memuat tong sampah');
    }
  }

  @override
  Future<BinEntity?> getBinByQrSerial(String qrSerial) async {
    try {
      final response = await apiClient.dio.get('/bins/qr/$qrSerial');
      if (response.statusCode == 200) {
        final json = response.data['data'];
        return BinEntity(
          id: json['qrSerial'].toString(),
          qrSerial: json['qrSerial'].toString(),
          binType: json['type'].toString().toLowerCase() == 'organik' ? WasteType.organic : WasteType.nonOrganic,
          currentVolumeL: (json['currentVolumeL'] as num).toDouble(),
          maxCapacityL: (json['capacityKg'] as num).toDouble() * 10.0,
          lat: -6.8915,
          lng: 107.6107,
          householdName: 'Rumah Tangga',
          rt: 'RT 01',
          rw: 'RW 01',
          kelurahan: 'Coblong',
          isActive: true,
        );
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  @override
  Future<AiDetectionEntity> detectWaste(String userId) async {
    await Future.delayed(const Duration(seconds: 2));
    return const AiDetectionEntity(
      detectedType: WasteType.organic,
      volumeEstimate: 1.5,
      isBlurry: false,
    );
  }

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
      final response = await apiClient.dio.post('/transactions/setor', data: {
        'user_id': userId,
        'qr_data': qrCode,
        'jenis_sampah': detectedType == WasteType.organic ? 'ORGANIC' : 'ANORGANIC',
        'volume': estimatedVolume,
      });

      if (response.statusCode == 200) {
        final data = response.data['data'];
        return ScanResult(
          weightKg: estimatedVolume * 0.3,
          pointsAwarded: data['poin_didapat'],
          newBinVolumeL: 10.0, 
        );
      } else {
        throw const BinException('SCAN_FAILED', 'Gagal memproses setoran');
      }
    } on DioException catch (e) {
      if (e.response?.data['code'] == 'BIN_FULL') {
        throw const BinException('BIN_FULL', 'Kapasitas tong sudah penuh');
      }
      throw const BinException('NETWORK_ERROR', 'Terjadi kesalahan jaringan');
    }
  }

  @override
  Future<BinEntity> activateBin({
    required String qrSerial,
    required String userId,
    required String householdId,
  }) async {
    try {
      final response = await apiClient.dio.post('/bins/activate', data: {
        'qrSerial': qrSerial,
        'userId': userId,
        'householdId': householdId,
      });

      if (response.statusCode == 201) {
        final json = response.data['data'];
        return BinEntity(
          id: json['qrSerial'].toString(),
          qrSerial: json['qrSerial'].toString(),
          binType: WasteType.organic,
          currentVolumeL: 0,
          maxCapacityL: (json['capacityKg'] as num).toDouble() * 10.0,
          lat: -6.8915,
          lng: 107.6107,
          householdName: 'Rumah Tangga',
          rt: 'RT 01',
          rw: 'RW 01',
          kelurahan: 'Coblong',
          isActive: true,
        );
      }
      throw const BinException('ACTIVATE_FAILED', 'Gagal aktivasi tong');
    } catch (e) {
      throw const BinException('NETWORK_ERROR', 'Gagal aktivasi tong');
    }
  }

  @override
  Future<BinResetEntity> submitResetRequest({
    required String binId,
    required String userId,
    required String evidencePhotoPath,
  }) async {
    try {
      final response = await apiClient.dio.post('/bins/reset-request', data: {
        'binId': binId,
        'userId': userId,
        'evidencePhotoPath': 'mock_path.jpg',
      });

      if (response.statusCode == 200) {
        return BinResetEntity(
          id: response.data['data']['id'].toString(),
          binId: binId,
          userId: userId,
          createdAt: DateTime.now(),
          status: BinResetStatus.pending,
          evidencePhotoUrl: evidencePhotoPath,
        );
      }
      throw const BinException('RESET_FAILED', 'Gagal mengajukan pengosongan');
    } catch (e) {
      throw const BinException('NETWORK_ERROR', 'Gagal mengajukan pengosongan');
    }
  }
}
