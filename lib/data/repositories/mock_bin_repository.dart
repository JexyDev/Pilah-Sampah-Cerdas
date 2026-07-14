import 'dart:math';
import 'package:uuid/uuid.dart';
import '../../config/app_config.dart';
import '../../domain/entities/bin_entity.dart';
import '../../domain/entities/ai_detection_entity.dart';
import '../../domain/entities/bin_reset_entity.dart';
import '../../domain/repositories/bin_repository.dart';
import '../mock/mock_data.dart';

/// Mock implementasi BinRepository.
/// Semua operasi bersifat lokal, mensimulasikan perilaku BE.
class MockBinRepository implements BinRepository {
  final _uuid = const Uuid();
  final _random = Random();

  // Mutable copy untuk simulasi perubahan state tong
  final List<BinEntity> _bins = List.from(MockData.bins);
  final List<BinResetEntity> _resetRequests = List.from(MockData.resetRequests);

  // ─── Daily AI Rate Limit (NFR-02, srs.md) ──────────────────────────────────
  // Counter per userId: {'userId': {'count': 5, 'date': '2026-07-11'}}
  final Map<String, Map<String, dynamic>> _aiDailyCounter = {};

  /// Cek dan increment counter harian AI. Throw jika sudah >= 50/hari.
  void _checkAndIncrementAiQuota(String userId) {
    final String today = DateTime.now().toIso8601String().substring(
      0,
      10,
    ); // 'YYYY-MM-DD'
    final Map<String, dynamic> entry =
        _aiDailyCounter[userId] ?? {'count': 0, 'date': today};

    // Reset counter jika hari berganti
    if (entry['date'] != today) {
      entry['count'] = 0;
      entry['date'] = today;
    }

    final int count = entry['count'] as int;
    if (count >= AppConfig.aiDailyLimit) {
      throw const BinException(
        'DAILY_LIMIT_EXCEEDED',
        'Kuota 50 request AI/hari sudah habis.',
      );
    }

    entry['count'] = count + 1;
    _aiDailyCounter[userId] = entry;
  }

  @override
  Future<List<BinEntity>> getBinsByHousehold(String householdId) async {
    await Future.delayed(const Duration(milliseconds: 500));
    return List.unmodifiable(_bins);
  }

  @override
  Future<BinEntity?> getBinByQrSerial(String qrSerial) async {
    await Future.delayed(const Duration(milliseconds: 300));
    try {
      return _bins.firstWhere((b) => b.qrSerial == qrSerial);
    } catch (_) {
      return null;
    }
  }

  @override
  Future<AiDetectionEntity> detectWaste(String userId) async {
    // Cek rate limit dulu sebelum proses (NFR-02)
    _checkAndIncrementAiQuota(userId);

    // Simulasi AI processing delay 500–1800ms (di bawah timeout 2000ms)
    final int delayMs = 500 + _random.nextInt(1300);
    await Future.delayed(Duration(milliseconds: delayMs));

    // Mock: 85% sukses, 10% blurry/unreadable, 5% timeout
    final int roll = _random.nextInt(100);

    if (roll >= 95) {
      throw const BinException('AI_TIMEOUT', 'Deteksi AI melebihi 2000ms.');
    }

    if (roll >= 85) {
      return AiDetectionEntity(
        detectedType: WasteType.organic,
        volumeEstimate: 0,
        isBlurry: true,
        requestId: _uuid.v4(),
      );
    }

    final WasteType type = _random.nextBool()
        ? WasteType.organic
        : WasteType.nonOrganic;
    final double volume = double.parse(
      (_random.nextDouble() * 4.0 + 1.0).toStringAsFixed(1),
    );

    return AiDetectionEntity(
      detectedType: type,
      volumeEstimate: volume,
      isBlurry: false,
      requestId: _uuid.v4(),
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
    await Future.delayed(const Duration(milliseconds: 700));

    final int binIndex = _bins.indexWhere((b) => b.qrSerial == qrCode);
    if (binIndex == -1) {
      throw const BinException('RESOURCE_NOT_FOUND', 'Tong tidak ditemukan.');
    }

    final BinEntity bin = _bins[binIndex];

    // Validasi jenis sampah (FR-02)
    if (bin.binType != detectedType) {
      throw const BinException(
        'BIN_TYPE_MISMATCH',
        'Jenis sampah tidak sesuai peruntukan tong.',
      );
    }

    // Validasi geofencing Haversine (FR-02, sdd.md §4.2)
    final double distance = _haversineDistanceMeters(
      userLat,
      userLng,
      bin.lat,
      bin.lng,
    );
    if (distance > AppConfig.geofenceRadiusMeters) {
      throw BinException(
        'LOCATION_OUT_OF_RANGE',
        'Jarak Anda ${distance.toStringAsFixed(1)}m dari tong (maks 10m).',
      );
    }

    // Validasi kapasitas max 25L (FR-02, srs.md)
    if (bin.remainingVolumeL < estimatedVolume) {
      throw const BinException(
        'BIN_OVERFLOW',
        'Volume sampah melebihi kapasitas tong.',
      );
    }

    // Hitung berat & poin (FR-03)
    final double density = detectedType == WasteType.organic
        ? AppConfig.organicDensityKgPerLiter
        : AppConfig.nonOrganicDensityKgPerLiter;
    final double weightKg = estimatedVolume * density;
    final int points = (weightKg * AppConfig.pointsPerKg).round();
    final double newVolume = bin.currentVolumeL + estimatedVolume;

    _bins[binIndex] = BinEntity(
      id: bin.id,
      qrSerial: bin.qrSerial,
      binType: bin.binType,
      currentVolumeL: newVolume,
      maxCapacityL: bin.maxCapacityL,
      lat: bin.lat,
      lng: bin.lng,
      householdName: bin.householdName,
      rt: bin.rt,
      rw: bin.rw,
      kelurahan: bin.kelurahan,
      isActive: bin.isActive,
    );

    return ScanResult(
      weightKg: weightKg,
      pointsAwarded: points,
      newBinVolumeL: newVolume,
    );
  }

  @override
  Future<BinEntity> activateBin({
    required String qrSerial,
    required String userId,
    required String householdId,
  }) async {
    await Future.delayed(const Duration(milliseconds: 600));

    final BinEntity? existing = _bins.cast<BinEntity?>().firstWhere(
      (b) => b?.qrSerial == qrSerial,
      orElse: () => null,
    );
    if (existing != null && existing.isActive) {
      throw const BinException('BIN_ALREADY_ACTIVE', 'Tong ini sudah aktif.');
    }

    final BinEntity newBin = BinEntity(
      id: _uuid.v4(),
      qrSerial: qrSerial,
      binType: qrSerial.toUpperCase().contains('NON')
          ? WasteType.nonOrganic
          : WasteType.organic,
      currentVolumeL: 0,
      maxCapacityL: AppConfig.binMaxCapacityLiters,
      lat: -6.9034,
      lng: 107.6198,
      householdName: MockData.currentUser.name,
      rt: 'RT 04',
      rw: 'RW 02',
      kelurahan: 'Dago',
      isActive: true,
    );

    _bins.add(newBin);
    return newBin;
  }

  @override
  Future<BinResetEntity> submitResetRequest({
    required String binId,
    required String userId,
    required String evidencePhotoPath,
  }) async {
    await Future.delayed(const Duration(milliseconds: 600));

    final BinEntity? bin = _bins.cast<BinEntity?>().firstWhere(
      (b) => b?.id == binId,
      orElse: () => null,
    );
    if (bin == null) {
      throw const BinException('RESOURCE_NOT_FOUND', 'Tong tidak ditemukan.');
    }
    if (!bin.isCritical) {
      throw const BinException(
        'BIN_NOT_CRITICAL',
        'Tong belum mencapai kapasitas kritis (>90%).',
      );
    }

    final BinResetEntity request = BinResetEntity(
      id: _uuid.v4(),
      binId: binId,
      userId: userId,
      status: BinResetStatus.pending,
      createdAt: DateTime.now(),
      evidencePhotoUrl: evidencePhotoPath,
    );

    _resetRequests.add(request);
    return request;
  }

  // ─── Haversine (sdd.md §4.2) ─────────────────────────────────────────────

  double _haversineDistanceMeters(
    double lat1,
    double lng1,
    double lat2,
    double lng2,
  ) {
    const double r = 6371000;
    final double dLat = _toRad(lat2 - lat1);
    final double dLng = _toRad(lng2 - lng1);
    final double a =
        sin(dLat / 2) * sin(dLat / 2) +
        cos(_toRad(lat1)) * cos(_toRad(lat2)) * sin(dLng / 2) * sin(dLng / 2);
    return r * 2 * atan2(sqrt(a), sqrt(1 - a));
  }

  double _toRad(double deg) => deg * (pi / 180);
}
