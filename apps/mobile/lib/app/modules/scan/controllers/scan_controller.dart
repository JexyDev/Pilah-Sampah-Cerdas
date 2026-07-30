import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/models/bin_entity.dart';
import '../../../data/models/ai_detection_entity.dart';
import '../../../data/models/bin_reset_entity.dart';
import '../../../data/repositories/bin_repository.dart';
import '../../../data/providers/repository_providers.dart';
import '../../../data/models/user_entity.dart';
import '../../auth/controllers/auth_controller.dart';

// ─── Bins Provider ────────────────────────────────────────────────────────────

/// Provider daftar tong sampah pribadi warga yang login.
/// Memanggil GET /api/v1/bins/my — backend filter by ownerUserId dari JWT.
/// householdId parameter tidak digunakan lagi (dikirim kosong).
final binsProvider = FutureProvider<List<BinEntity>>((ref) async {
  final repo = ref.watch(binRepositoryProvider);
  // Pastikan user sudah login sebelum fetch
  final user = ref.watch(authProvider).user;
  if (user == null) return [];
  // Hanya role warga yang memiliki akses tong sampah pribadi
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
      final result = await _binRepository.scanAndCommit(
        qrCode: qrCode,
        userId: _userId,
        detectedType: state.aiResult!.detectedType,
        estimatedVolume: state.aiResult!.volumeEstimate,
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

// ─── Aktivasi Bin Provider ────────────────────────────────────────────────────

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
        final isOrganik = !qr.toUpperCase().contains('NON') && !qr.toUpperCase().contains('ANORG') && !qr.toUpperCase().startsWith('ANO');
        await _binRepository.measureBin(
          qrCode: qr,
          binType: isOrganik ? WasteType.organic : WasteType.nonOrganic,
          maxCapacityLiter: isOrganik ? orgCapacity : anorgCapacity,
        );
      }
      state = AktivasiBinState(result: results.isNotEmpty ? results.last : null);
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

// ─── Reset Bin Provider ───────────────────────────────────────────────────────

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

  void reset() => state = const ResetBinState();
}

final resetBinProvider = StateNotifierProvider<ResetBinNotifier, ResetBinState>(
  (ref) {
    return ResetBinNotifier(ref.watch(binRepositoryProvider));
  },
);
