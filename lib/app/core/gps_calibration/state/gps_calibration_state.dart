import 'package:equatable/equatable.dart';
import 'package:geolocator/geolocator.dart';

/// Status alur kalibrasi GPS.
enum GpsCalibrationStatus {
  /// Belum dimulai.
  idle,

  /// Sedang mengecek apakah GPS service aktif.
  checkingService,

  /// Sedang mengecek/meminta izin lokasi.
  checkingPermission,

  /// Sedang mengecek Precise Location (Android 12+ / iOS 14+).
  checkingPrecision,

  /// Sedang mengambil sampel GPS (streaming N sampel).
  sampling,

  /// Sedang menghitung analisis dan skor.
  analyzing,

  /// Kalibrasi berhasil — sinyal GPS berkualitas baik (score ≥ 70).
  ready,

  /// Kalibrasi gagal/lemah — tampilkan panduan troubleshooting.
  guide,

  /// Terjadi error tak terduga.
  error,
}

/// State lengkap untuk modul GPS Calibration.
class GpsCalibrationState extends Equatable {
  final GpsCalibrationStatus status;

  /// Sampel GPS yang sudah berhasil diambil saat ini (untuk progress bar).
  final int currentSample;

  /// Total sampel yang akan diambil.
  final int totalSamples;

  /// Stability score 0–100. Null jika belum dihitung.
  final double? stabilityScore;

  /// Posisi GPS final (dipilih dari sampel terbaik). Null jika belum ready.
  final Position? finalPosition;

  /// Rata-rata akurasi meter dari sampel valid. Null jika belum dihitung.
  final double? avgAccuracyMeters;

  /// Jumlah sampel yang terdeteksi sebagai GPS jump.
  final int jumpCount;

  /// Apakah izin lokasi yang diberikan adalah Precise Location.
  final bool isPreciseLocation;

  /// Daftar aksi panduan yang direkomendasikan (saat status guide).
  final List<String> guideActions;

  /// Jumlah percobaan kalibrasi ulang dalam sesi ini.
  final int retryCount;

  /// Pesan error/keterangan tambahan.
  final String? errorMessage;

  const GpsCalibrationState({
    this.status = GpsCalibrationStatus.idle,
    this.currentSample = 0,
    this.totalSamples = 6,
    this.stabilityScore,
    this.finalPosition,
    this.avgAccuracyMeters,
    this.jumpCount = 0,
    this.isPreciseLocation = true,
    this.guideActions = const [],
    this.retryCount = 0,
    this.errorMessage,
  });

  GpsCalibrationState copyWith({
    GpsCalibrationStatus? status,
    int? currentSample,
    int? totalSamples,
    double? stabilityScore,
    Position? finalPosition,
    double? avgAccuracyMeters,
    int? jumpCount,
    bool? isPreciseLocation,
    List<String>? guideActions,
    int? retryCount,
    String? errorMessage,
    bool clearError = false,
  }) {
    return GpsCalibrationState(
      status: status ?? this.status,
      currentSample: currentSample ?? this.currentSample,
      totalSamples: totalSamples ?? this.totalSamples,
      stabilityScore: stabilityScore ?? this.stabilityScore,
      finalPosition: finalPosition ?? this.finalPosition,
      avgAccuracyMeters: avgAccuracyMeters ?? this.avgAccuracyMeters,
      jumpCount: jumpCount ?? this.jumpCount,
      isPreciseLocation: isPreciseLocation ?? this.isPreciseLocation,
      guideActions: guideActions ?? this.guideActions,
      retryCount: retryCount ?? this.retryCount,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }

  bool get isRunning =>
      status == GpsCalibrationStatus.checkingService ||
      status == GpsCalibrationStatus.checkingPermission ||
      status == GpsCalibrationStatus.checkingPrecision ||
      status == GpsCalibrationStatus.sampling ||
      status == GpsCalibrationStatus.analyzing;

  @override
  List<Object?> get props => [
        status,
        currentSample,
        totalSamples,
        stabilityScore,
        finalPosition,
        avgAccuracyMeters,
        jumpCount,
        isPreciseLocation,
        guideActions,
        retryCount,
        errorMessage,
      ];
}
