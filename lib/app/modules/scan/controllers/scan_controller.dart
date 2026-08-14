import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import '../../../data/models/bin_entity.dart';
import '../../../data/models/ai_detection_entity.dart';
import '../../../data/models/bin_reset_entity.dart';
import '../../../data/repositories/bin_repository.dart';
import '../../../data/providers/repository_providers.dart';
import '../../../data/models/user_entity.dart';
import '../../auth/controllers/auth_controller.dart';

// ─── Bins Provider ────────────────────────────────────────────────────────────

/// Provider daftar tempat sampah pribadi warga yang login.
/// Memanggil GET /api/v1/bins/my — backend filter by ownerUserId dari JWT.
/// householdId parameter tidak digunakan lagi (dikirim kosong).
final binsProvider = FutureProvider<List<BinEntity>>((ref) async {
  final repo = ref.watch(binRepositoryProvider);
  // Pastikan user sudah login sebelum fetch
  final user = ref.watch(authProvider).user;
  if (user == null) return [];
  // Hanya role warga yang memiliki akses tempat sampah pribadi
  if (user.role != UserRole.warga) return [];
  return repo.getBinsByHousehold('');
});

// ─── Scan Flow State ──────────────────────────────────────────────────────────

class ScanFlowState {
  const ScanFlowState({
    this.currentStep = 0,
    this.isLoading = false,
    this.aiResult,
    this.scanResult,
    this.errorCode,
    this.errorMessage,
  });

  final int currentStep;
  final bool isLoading;
  final AiDetectionEntity? aiResult;
  final ScanResult? scanResult;
  final String? errorCode;
  final String? errorMessage;

  ScanFlowState copyWith({
    int? currentStep,
    bool? isLoading,
    AiDetectionEntity? aiResult,
    ScanResult? scanResult,
    String? errorCode,
    String? errorMessage,
    bool clearError = false,
    bool clearResults = false,
  }) {
    return ScanFlowState(
      currentStep: currentStep ?? this.currentStep,
      isLoading: isLoading ?? this.isLoading,
      aiResult: clearResults ? null : (aiResult ?? this.aiResult),
      scanResult: clearResults ? null : (scanResult ?? this.scanResult),
      errorCode: clearError ? null : (errorCode ?? this.errorCode),
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }
}

class ScanFlowNotifier extends StateNotifier<ScanFlowState> {
  ScanFlowNotifier(this._binRepository, this._userId, this._householdId)
    : super(const ScanFlowState());

  final BinRepository _binRepository;
  final String _userId;
  final String _householdId;

  void setError(String code, String message) {
    state = state.copyWith(
      errorCode: code,
      errorMessage: message,
      isLoading: false,
    );
  }

  /// Step 0 → 1 → 2: Upload foto + Deteksi AI (FR-01).
  /// POST /api/v1/waste/detect (multipart)
  Future<void> detectWaste({required String imagePath}) async {
    state = state.copyWith(isLoading: true, clearError: true, currentStep: 1);
    try {
      final result = await _binRepository.detectWaste(
        _userId,
        imagePath: imagePath,
      );

      if (result.isBlurry) {
        state = state.copyWith(
          isLoading: false,
          errorCode: 'IMAGE_UNREADABLE',
          errorMessage: 'Foto tidak terbaca. Ambil ulang foto.',
          currentStep: 0,
        );
        return;
      }

      state = state.copyWith(
        isLoading: false,
        aiResult: result,
        currentStep:
            2, // Sheet akan muncul, QR scanner aktif setelah sheet dismiss
      );
    } on BinException catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorCode: e.code,
        errorMessage: e.message,
        currentStep: 0,
      );
    }
  }

  /// Step 2 → 3: Scan QR + commit transaksi (FR-02 + Haversine geofencing).
  /// POST /api/v1/bins/scan
  Future<void> scanAndCommit({
    required String qrCode,
    required double userLat,
    required double userLng,
  }) async {
    if (state.aiResult == null) return;
    // Guard: jangan kirim lagi kalau sudah loading atau sudah sukses
    if (state.isLoading || state.scanResult != null) return;

    state = state.copyWith(isLoading: true, clearError: true);
    try {
      // 1. Ambil data tempat sampah dari cache/server untuk client-side geofencing
      final bin = await _binRepository.getBinByQrSerial(qrCode);
      if (bin != null) {
        // Hitung jarak Haversine (client-side)
        final distance = Geolocator.distanceBetween(
          userLat,
          userLng,
          bin.lat,
          bin.lng,
        );

        const maxDistance = kDebugMode ? 500.0 : 10.0;
        if (distance > maxDistance) {
          throw BinException(
            'LOCATION_OUT_OF_RANGE',
            'Anda terlalu jauh dari tempat sampah (> ${maxDistance.toInt()}m).',
          );
        }

        // Cek kapasitas
        final double projectedVol =
            bin.currentVolumeL + state.aiResult!.volumeEstimate;
        if (bin.currentVolumeL >= bin.maxCapacityL) {
          throw const BinException(
            'BIN_OVERFLOW',
            'Tempat sampah ini sudah penuh (100%)! Silakan ajukan pengosongan.',
          );
        } else if (projectedVol > bin.maxCapacityL) {
          final sisa = (bin.maxCapacityL - bin.currentVolumeL).clamp(
            0.0,
            999.0,
          );
          throw BinException(
            'BIN_OVERFLOW',
            'Kapasitas tempat sampah tersisa ${sisa.toStringAsFixed(1)}L, tidak muat untuk sampah sekitar ${state.aiResult!.volumeEstimate.toStringAsFixed(1)}L.',
          );
        }
      }

      final result = await _binRepository.scanAndCommit(
        qrCode: qrCode,
        userId: _userId,
        detectedType: state.aiResult!.detectedType,
        estimatedVolume: state.aiResult!.volumeEstimate,
        confidence: state.aiResult!.confidence,
        evidencePhotoUrl: state.aiResult!.evidencePhotoUrl,
        householdId: _householdId,
        userLat: userLat,
        userLng: userLng,
      );

      state = state.copyWith(
        isLoading: false,
        scanResult: result,
        currentStep: 3,
      );
    } on BinException catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorCode: e.code,
        errorMessage: e.message,
      );
    }
  }

  void reset() => state = const ScanFlowState();
  void clearError() => state = state.copyWith(clearError: true);
  void goToStep(int step) => state = state.copyWith(currentStep: step);
}

final scanFlowProvider = StateNotifierProvider<ScanFlowNotifier, ScanFlowState>(
  (ref) {
    final user = ref.watch(authProvider).user;
    final userId = user?.id ?? '';
    final householdId = user?.householdId ?? '';
    return ScanFlowNotifier(
      ref.watch(binRepositoryProvider),
      userId,
      householdId,
    );
  },
);

// ─── Aktivasi Tempat Sampah Provider ────────────────────────────────────────────────────

class AktivasiBinState {
  const AktivasiBinState({
    this.isLoading = false,
    this.result,
    this.errorCode,
    this.errorMessage,
  });

  final bool isLoading;
  final BinEntity? result;
  final String? errorCode;
  final String? errorMessage;

  bool get isSuccess => result != null;
}

class AktivasiBinNotifier extends StateNotifier<AktivasiBinState> {
  AktivasiBinNotifier(this._binRepository) : super(const AktivasiBinState());

  final BinRepository _binRepository;

  Future<void> aktivasi({
    required String qrSerial,
    required String userId,
    required String householdId,
    double? latitude,
    double? longitude,
  }) async {
    state = const AktivasiBinState(isLoading: true);
    try {
      final result = await _binRepository.activateBin(
        qrSerial: qrSerial,
        userId: userId,
        householdId: householdId,
        latitude: latitude,
        longitude: longitude,
      );
      state = AktivasiBinState(result: result);
    } on BinException catch (e) {
      state = AktivasiBinState(errorCode: e.code, errorMessage: e.message);
    }
  }

  Future<void> aktivasiBatch({
    required List<String> qrSerials,
    required String userId,
    required String householdId,
    double? latitude,
    double? longitude,
    required double orgCapacity,
    required double anorgCapacity,
  }) async {
    state = const AktivasiBinState(isLoading: true);
    try {
      final results = await _binRepository.activateBinsBatch(
        qrSerials: qrSerials,
        userId: userId,
        householdId: householdId,
        latitude: latitude,
        longitude: longitude,
      );

      // Panggil measureBin sesuai jenis QR Code secara berurutan
      for (final qr in qrSerials) {
        final isOrganik =
            !qr.toUpperCase().contains('NON') &&
            !qr.toUpperCase().contains('ANORG') &&
            !qr.toUpperCase().startsWith('ANO');
        await _binRepository.measureBin(
          qrCode: qr,
          binType: isOrganik ? WasteType.organic : WasteType.nonOrganic,
          maxCapacityLiter: isOrganik ? orgCapacity : anorgCapacity,
        );
      }
      state = AktivasiBinState(
        result: results.isNotEmpty ? results.last : null,
      );
    } on BinException catch (e) {
      state = AktivasiBinState(errorCode: e.code, errorMessage: e.message);
    }
  }

  void reset() => state = const AktivasiBinState();
}

final aktivasiBinProvider =
    StateNotifierProvider<AktivasiBinNotifier, AktivasiBinState>((ref) {
      return AktivasiBinNotifier(ref.watch(binRepositoryProvider));
    });

// ─── Reset Tempat Sampah Provider ───────────────────────────────────────────────────────

class ResetBinState {
  const ResetBinState({
    this.isLoading = false,
    this.result,
    this.errorCode,
    this.errorMessage,
  });

  final bool isLoading;
  final BinResetEntity? result;
  final String? errorCode;
  final String? errorMessage;

  bool get isSuccess => result != null;
}

class ResetBinNotifier extends StateNotifier<ResetBinState> {
  ResetBinNotifier(this._binRepository) : super(const ResetBinState());

  final BinRepository _binRepository;

  Future<void> submitReset({
    required List<String> binIds,
    required String userId,
    required String evidencePhotoPath,
  }) async {
    state = const ResetBinState(isLoading: true);
    try {
      BinResetEntity? lastResult;
      for (final binId in binIds) {
        lastResult = await _binRepository.submitResetRequest(
          binId: binId,
          userId: userId,
          evidencePhotoPath: evidencePhotoPath,
        );
      }
      state = ResetBinState(result: lastResult);
    } on BinException catch (e) {
      state = ResetBinState(errorCode: e.code, errorMessage: e.message);
    }
  }

  Future<void> checkActiveRequest(String userId) async {
    state = const ResetBinState(isLoading: true);
    try {
      final activeReq = await _binRepository.getActiveResetRequest(userId);
      if (activeReq != null && activeReq.status == BinResetStatus.pending) {
        state = ResetBinState(result: activeReq);
      } else {
        state = const ResetBinState();
      }
    } catch (e) {
      state = const ResetBinState();
    }
  }

  void reset() => state = const ResetBinState();
}

final resetBinProvider = StateNotifierProvider<ResetBinNotifier, ResetBinState>(
  (ref) {
    return ResetBinNotifier(ref.watch(binRepositoryProvider));
  },
);
