import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'gps_calibration_state.dart';
import '../usecases/calibrate_gps_usecase.dart';
import '../entities/gps_calibration_config.dart';

/// Riverpod StateNotifier untuk modul GPS Calibration.
///
/// Mengonsumsi stream dari [CalibrateGpsUseCase], mengupdate state
/// per fase, dan menyediakan aksi startCalibration() serta retry().
class GpsCalibrationNotifier extends StateNotifier<GpsCalibrationState> {
  final GpsCalibrationConfig config;
  StreamSubscription<GpsCalibrationState>? _subscription;

  GpsCalibrationNotifier({this.config = GpsCalibrationConfig.kknDefault})
      : super(const GpsCalibrationState());

  /// Memulai proses kalibrasi GPS.
  /// Jika kalibrasi sedang berjalan, panggilan ini diabaikan.
  Future<void> startCalibration() async {
    if (state.isRunning) return;

    await _subscription?.cancel();
    _subscription = null;

    final useCase = CalibrateGpsUseCase(config: config);

    _subscription = useCase.call().listen(
      (newState) {
        if (!mounted) return;
        // Pertahankan retryCount dari state sebelumnya
        state = newState.copyWith(retryCount: state.retryCount);
      },
      onError: (e) {
        if (!mounted) return;
        state = state.copyWith(
          status: GpsCalibrationStatus.error,
          errorMessage: e.toString(),
        );
      },
    );
  }

  /// Mengulangi proses kalibrasi dari fase sampling.
  /// Increment retryCount.
  Future<void> retry() async {
    final currentRetry = state.retryCount;
    state = const GpsCalibrationState().copyWith(retryCount: currentRetry + 1);
    await startCalibration();
  }

  /// Reset ke state idle.
  void reset() {
    _subscription?.cancel();
    _subscription = null;
    state = const GpsCalibrationState();
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }
}

/// Riverpod provider untuk GPS Calibration.
/// Gunakan [gpsCalibrationProvider] di seluruh widget.
final gpsCalibrationProvider =
    StateNotifierProvider<GpsCalibrationNotifier, GpsCalibrationState>(
  (ref) => GpsCalibrationNotifier(),
);
