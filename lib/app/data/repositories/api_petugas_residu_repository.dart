import 'package:dio/dio.dart';
import '../models/petugas_residu_models.dart';
import '../providers/api_client.dart';
import 'petugas_residu_repository.dart';

class ApiPetugasResiduRepository implements PetugasResiduRepository {
  ApiPetugasResiduRepository({required this.apiClient});

  final ApiClient apiClient;

  @override
  Future<PetugasResiduDashboard> getDashboard() async {
    try {
      final response = await apiClient.dio.get('/residu/dashboard');
      if (response.statusCode == 200 && response.data != null) {
        final data = response.data is Map<String, dynamic> 
            ? (response.data['data'] as Map<String, dynamic>? ?? response.data as Map<String, dynamic>)
            : <String, dynamic>{};
        return PetugasResiduDashboard.fromJson(data);
      }
    } catch (_) {
      // Fallback data jika backend endpoint belum tersedia / error
    }

    return const PetugasResiduDashboard(
      petugasId: 'PTR-001',
      name: 'Budi Santoso',
      assignedZone: 'RT 01/RW 02 Kel. Bojongsoang',
      whitelistStatus: WhitelistStatus.approved,
      accountStatus: 'ACTIVE',
      totalJadwal: 8,
      sudahDiambil: 3,
      pelanggaranCount: 1,
      totalWeightKg: 42.5,
      kpiScore: 93.8,
      ketepatanWaktuScore: 95.0,
      akurasiScore: 92.0,
    );
  }

  @override
  Future<List<ResiduBinPickup>> getJadwalHarian({String? kelurahan, String? rtRw}) async {
    try {
      final Map<String, dynamic> queryParams = {};
      if (kelurahan != null && kelurahan.isNotEmpty) queryParams['kelurahan'] = kelurahan;
      if (rtRw != null && rtRw.isNotEmpty) queryParams['rtRw'] = rtRw;

      final response = await apiClient.dio.get('/residu/jadwal-harian', queryParameters: queryParams);
      if (response.statusCode == 200 && response.data != null) {
        final List<dynamic> list = response.data is Map<String, dynamic>
            ? (response.data['data'] as List<dynamic>? ?? [])
            : (response.data as List<dynamic>? ?? []);
        
        if (list.isNotEmpty) {
          return list.map((e) => ResiduBinPickup.fromJson(e as Map<String, dynamic>)).toList();
        }
      }
    } catch (_) {
      // Fallback list
    }

    return [
      const ResiduBinPickup(
        binId: 'BIN-RES-01',
        binCode: 'RES-010201',
        wargaName: 'Asep Sunandar',
        address: 'Jl. Asep Sunandar No. 49, RT 01/RW 02',
        kelurahan: 'Bojongsoang',
        rtRw: '01/02',
        volumePercentage: 85.0,
        isPickedUp: false,
        latitude: -6.9744,
        longitude: 107.6303,
      ),
      const ResiduBinPickup(
        binId: 'BIN-RES-02',
        binCode: 'RES-010202',
        wargaName: 'Cecep Hidayat',
        address: 'Jl. Cecep Hidayat No. 78, RT 01/RW 02',
        kelurahan: 'Bojongsoang',
        rtRw: '01/02',
        volumePercentage: 78.5,
        isPickedUp: false,
        latitude: -6.9750,
        longitude: 107.6310,
      ),
      const ResiduBinPickup(
        binId: 'BIN-RES-03',
        binCode: 'RES-010203',
        wargaName: 'Dadang Suherman',
        address: 'Jl. Dadang Suherman No. 96, RT 01/RW 02',
        kelurahan: 'Bojongsoang',
        rtRw: '01/02',
        volumePercentage: 92.0,
        isPickedUp: false,
        latitude: -6.9760,
        longitude: 107.6320,
      ),
      ResiduBinPickup(
        binId: 'BIN-RES-04',
        binCode: 'RES-010204',
        wargaName: 'Gilang Ramadhan',
        address: 'Jl. Gilang Ramadhan No. 57, RT 01/RW 02',
        kelurahan: 'Bojongsoang',
        rtRw: '01/02',
        volumePercentage: 70.0,
        isPickedUp: true,
        lastPickedUpTime: DateTime.now().subtract(const Duration(hours: 1)),
        latitude: -6.9770,
        longitude: 107.6330,
      ),
    ];
  }

  @override
  Future<bool> submitLog({
    required String binId,
    required double actualWeightKg,
    required String classification,
    required String photoPath,
  }) async {
    try {
      final formData = FormData.fromMap({
        'binId': binId,
        'actualWeightKg': actualWeightKg,
        'classification': classification,
        'image': await MultipartFile.fromFile(photoPath),
      });

      final response = await apiClient.dio.post('/residu/submit-log', data: formData);
      if (response.statusCode == 200 || response.statusCode == 201) {
        return true;
      }
    } catch (_) {
      // Direct success simulation if offline or dev endpoint not ready
      return true;
    }
    return true;
  }

  @override
  Future<bool> laporViolation({
    required String binQrCode,
    required String evidencePhotoPath,
    required String type,
    required String severity,
  }) async {
    try {
      final formData = FormData.fromMap({
        'binQrCode': binQrCode,
        'type': type,
        'severity': severity,
        'evidence': await MultipartFile.fromFile(evidencePhotoPath),
      });

      final response = await apiClient.dio.post('/residu/violation', data: formData);
      if (response.statusCode == 200 || response.statusCode == 201) {
        return true;
      }
    } catch (_) {
      return true;
    }
    return true;
  }

  @override
  Future<List<Map<String, dynamic>>> getHistory({String? dateRange, String? type}) async {
    try {
      final response = await apiClient.dio.get('/residu/riwayat', queryParameters: {
        if (dateRange != null) 'range': dateRange,
        if (type != null) 'type': type,
      });

      if (response.statusCode == 200 && response.data != null) {
        final List<dynamic> list = response.data is Map<String, dynamic>
            ? (response.data['data'] as List<dynamic>? ?? [])
            : (response.data as List<dynamic>? ?? []);
        if (list.isNotEmpty) {
          return list.cast<Map<String, dynamic>>();
        }
      }
    } catch (_) {}

    final now = DateTime.now();
    return [
      {
        'id': 'HIST-01',
        'type': 'SETORAN',
        'title': 'Penjemputan Residu BIN-RES-01',
        'subtitle': 'Asep Sunandar • 12.5 Kg',
        'classification': 'Residu Non-B3',
        'weightKg': 12.5,
        'status': 'SUDAH_DIAMBIL',
        'timestamp': now.subtract(const Duration(minutes: 45)).toIso8601String(),
        'address': 'Jl. Asep Sunandar No. 49',
        'photoUrl': '',
      },
      {
        'id': 'HIST-02',
        'type': 'PELANGGARAN',
        'title': 'Laporan Pelanggaran: Organik Tercampur',
        'subtitle': 'QR: RES-010203 • Tingkat SEVERE',
        'severity': 'SEVERE',
        'violationType': 'Sampah Organik Tercampur',
        'pointDeduction': 50,
        'status': 'DIPROSES',
        'timestamp': now.subtract(const Duration(hours: 3)).toIso8601String(),
        'address': 'Jl. Dadang Suherman No. 96',
        'photoUrl': '',
      },
      {
        'id': 'HIST-03',
        'type': 'SETORAN',
        'title': 'Penjemputan Residu BIN-RES-04',
        'subtitle': 'Gilang Ramadhan • 18.0 Kg',
        'classification': 'Residu Popok/Pembalut',
        'weightKg': 18.0,
        'status': 'SUDAH_DIAMBIL',
        'timestamp': now.subtract(const Duration(hours: 5)).toIso8601String(),
        'address': 'Jl. Gilang Ramadhan No. 57',
        'photoUrl': '',
      },
    ];
  }
}
