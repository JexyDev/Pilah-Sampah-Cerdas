import 'dart:async';
import 'package:geolocator/geolocator.dart';
import '../analyzers/accuracy_analyzer.dart';
import '../analyzers/distance_analyzer.dart';
import '../analyzers/speed_analyzer.dart';
import '../analyzers/jump_detector.dart';
import '../analyzers/stability_scorer.dart';
import '../entities/gps_calibration_config.dart';
import '../entities/gps_calibration_result.dart';
import '../../gps_calibration/state/gps_calibration_state.dart';

/// Use case utama kalibrasi GPS.
///
/// Mengorkestrasikan seluruh alur:
/// 1. Cek GPS service aktif
/// 2. Cek & request permission
/// 3. Deteksi precise location
/// 4. Ambil 6 sampel GPS (stream 1 sampel/detik)
/// 5. Analisis akurasi, konsistensi, kecepatan, jump
/// 6. Hitung Stability Score
/// 7. Emit GpsCalibrationState (ready / guide)
class CalibrateGpsUseCase {
  final GpsCalibrationConfig config;

  const CalibrateGpsUseCase({this.config = GpsCalibrationConfig.kknDefault});

  /// Menjalankan proses kalibrasi dan mengembalikan stream state.
  Stream<GpsCalibrationState> call() async* {
    // ── Fase 1: Cek GPS service ──────────────────────────────────────────
    yield const GpsCalibrationState(status: GpsCalibrationStatus.checkingService);

    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      yield const GpsCalibrationState(
        status: GpsCalibrationStatus.guide,
        guideActions: ['enable_gps_service'],
        errorMessage: 'Layanan GPS tidak aktif. Aktifkan GPS di pengaturan perangkat.',
      );
      return;
    }

    // ── Fase 2: Cek permission ───────────────────────────────────────────
    yield const GpsCalibrationState(status: GpsCalibrationStatus.checkingPermission);

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }

    if (permission == LocationPermission.deniedForever) {
      yield const GpsCalibrationState(
        status: GpsCalibrationStatus.guide,
        guideActions: ['open_app_settings'],
        errorMessage: 'Izin lokasi diblokir permanen. Buka pengaturan aplikasi untuk mengizinkan akses lokasi.',
      );
      return;
    }

    if (permission == LocationPermission.denied ||
        permission == LocationPermission.unableToDetermine) {
      yield const GpsCalibrationState(
        status: GpsCalibrationStatus.guide,
        guideActions: ['request_permission'],
        errorMessage: 'Izin lokasi tidak diberikan.',
      );
      return;
    }

    // ── Fase 3: Cek Precise Location ────────────────────────────────────
    yield const GpsCalibrationState(status: GpsCalibrationStatus.checkingPrecision);

    bool isPrecise = true;
    try {
      final accuracyStatus = await Geolocator.getLocationAccuracy();
      isPrecise = accuracyStatus == LocationAccuracyStatus.precise;
    } catch (_) {
      // Platform tidak mendukung cek ini → asumsikan precise
      isPrecise = true;
    }

    if (!isPrecise) {
      yield const GpsCalibrationState(
        status: GpsCalibrationStatus.guide,
        guideActions: ['enable_precise_location'],
        isPreciseLocation: false,
        errorMessage: 'Lokasi Presisi (Precise Location) tidak aktif. Aktifkan di pengaturan izin aplikasi.',
      );
      return;
    }

    // ── Fase 4: Pengambilan sampel GPS ────────────────────────────────────
    final samples = <Position>[];
    yield GpsCalibrationState(
      status: GpsCalibrationStatus.sampling,
      currentSample: 0,
      totalSamples: config.sampleCount,
      isPreciseLocation: isPrecise,
    );

    try {
      await for (final pos in _sampleStream().timeout(config.timeout)) {
        samples.add(pos);
        yield GpsCalibrationState(
          status: GpsCalibrationStatus.sampling,
          currentSample: samples.length,
          totalSamples: config.sampleCount,
          isPreciseLocation: isPrecise,
        );
        if (samples.length >= config.sampleCount) break;
      }
    } on TimeoutException {
      // Timeout → langsung ke analisis dengan sampel yang sudah ada
    }

    if (samples.isEmpty) {
      yield GpsCalibrationState(
        status: GpsCalibrationStatus.guide,
        guideActions: const ['open_area', 'disable_battery_saver', 'wait_and_retest'],
        isPreciseLocation: isPrecise,
        errorMessage: 'Tidak ada data GPS yang berhasil diambil dalam batas waktu.',
      );
      return;
    }

    // ── Fase 5: Analisis ──────────────────────────────────────────────────
    yield GpsCalibrationState(
      status: GpsCalibrationStatus.analyzing,
      currentSample: samples.length,
      totalSamples: config.sampleCount,
      isPreciseLocation: isPrecise,
    );

    final accuracyScore = AccuracyAnalyzer.score(samples);
    final consistencyScore = DistanceAnalyzer.consistencyScore(samples);
    final speedScore = SpeedAnalyzer.score(samples);
    final jumps = JumpDetector.detect(samples);
    final noJumpScore = JumpDetector.noJumpScore(samples);
    final avgAccuracy = AccuracyAnalyzer.avgAccuracyMeters(samples);

    final stability = StabilityScorer.compute(
      accuracyScore: accuracyScore,
      consistencyScore: consistencyScore,
      noJumpScore: noJumpScore,
      speedScore: speedScore,
    );

    // ── Fase 6: Keputusan ─────────────────────────────────────────────────
    final result = GpsCalibrationResult(
      finalPosition: _selectBestSample(samples),
      stabilityScore: stability,
      avgAccuracyMeters: avgAccuracy,
      jumpCount: jumps.length,
      isPreciseLocation: isPrecise,
    );

    if (StabilityScorer.isGood(stability, threshold: config.scoreThreshold)) {
      yield GpsCalibrationState(
        status: GpsCalibrationStatus.ready,
        stabilityScore: stability,
        finalPosition: result.finalPosition,
        avgAccuracyMeters: avgAccuracy,
        jumpCount: jumps.length,
        isPreciseLocation: isPrecise,
        currentSample: samples.length,
        totalSamples: config.sampleCount,
      );
    } else {
      yield GpsCalibrationState(
        status: GpsCalibrationStatus.guide,
        stabilityScore: stability,
        avgAccuracyMeters: avgAccuracy,
        jumpCount: jumps.length,
        isPreciseLocation: isPrecise,
        guideActions: _buildGuideActions(samples, jumps, isPrecise),
        currentSample: samples.length,
        totalSamples: config.sampleCount,
      );
    }
  }

  /// Stream yang mengambil satu sampel GPS setiap [config.sampleInterval].
  Stream<Position> _sampleStream() async* {
    for (int i = 0; i < config.sampleCount; i++) {
      try {
        final pos = await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.best,
            distanceFilter: 0,
          ),
        ).timeout(const Duration(seconds: 8));
        yield pos;
      } catch (_) {
        // Sampel gagal → skip, coba lanjut
      }
      if (i < config.sampleCount - 1) {
        await Future.delayed(config.sampleInterval);
      }
    }
  }

  /// Memilih sampel terbaik berdasarkan akurasi terkecil.
  Position _selectBestSample(List<Position> samples) {
    return samples.reduce(
      (best, s) => s.accuracy < best.accuracy ? s : best,
    );
  }

  /// Membangun daftar aksi panduan yang relevan berdasarkan kondisi GPS.
  List<String> _buildGuideActions(
    List<Position> samples,
    List<int> jumps,
    bool isPrecise,
  ) {
    final actions = <String>[];

    if (!isPrecise) actions.add('enable_precise_location');
    if (jumps.isNotEmpty) actions.add('open_area');
    if (samples.any((s) => s.accuracy > 30)) actions.add('open_area');
    actions.add('disable_battery_saver');
    actions.add('wait_and_retest');

    return actions.toSet().toList(); // deduplikasi
  }
}
