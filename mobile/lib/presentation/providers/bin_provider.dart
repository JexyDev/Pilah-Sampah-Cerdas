import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../config/app_config.dart';
import '../../domain/entities/bin_entity.dart';
import '../../domain/entities/ai_detection_entity.dart';
import '../../domain/entities/bin_reset_entity.dart';
import '../../domain/repositories/bin_repository.dart';
import 'repository_providers.dart';
import 'auth_provider.dart';

// ─── Bins Provider ────────────────────────────────────────────────────────────

/// Provider daftar tong sampah milik user.
final binsProvider = FutureProvider<List<BinEntity>>((ref) async {
  final repo = ref.watch(binRepositoryProvider);
  // householdId dari AppConfig.mockHouseholdId — diganti dari auth saat BE ada
  return repo.getBinsByHousehold(AppConfig.mockHouseholdId);
});

// ─── Scan Flow State ──────────────────────────────────────────────────────────

/// Step scan flow: 0=foto, 1=AI detect, 2=scan QR, 3=selesai
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
  ScanFlowNotifier(this._binRepository, this._userId)
    : super(const ScanFlowState());

  final BinRepository _binRepository;
  final String _userId;

  /// Step 0 → 1 → 2: Foto + Deteksi AI (FR-01).
  Future<void> detectWaste() async {
    state = state.copyWith(isLoading: true, clearError: true, currentStep: 1);
    try {
      final result = await _binRepository.detectWaste(_userId);

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
        currentStep: 2,
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
  Future<void> scanAndCommit({
    required String qrCode,
    required double userLat,
    required double userLng,
  }) async {
    if (state.aiResult == null) return;

    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final result = await _binRepository.scanAndCommit(
        qrCode: qrCode,
        userId: _userId,
        detectedType: state.aiResult!.detectedType,
        estimatedVolume: state.aiResult!.volumeEstimate,
        householdId: AppConfig.mockHouseholdId,
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
    final userId = ref.watch(authProvider).user?.id ?? AppConfig.mockUserId;
    return ScanFlowNotifier(ref.watch(binRepositoryProvider), userId);
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
  }) async {
    state = const AktivasiBinState(isLoading: true);
    try {
      final result = await _binRepository.activateBin(
        qrSerial: qrSerial,
        userId: userId,
        householdId: AppConfig.mockHouseholdId,
      );
      state = AktivasiBinState(result: result);
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
    required String binId,
    required String userId,
    required String evidencePhotoPath,
  }) async {
    state = const ResetBinState(isLoading: true);
    try {
      final result = await _binRepository.submitResetRequest(
        binId: binId,
        userId: userId,
        evidencePhotoPath: evidencePhotoPath,
      );
      state = ResetBinState(result: result);
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
