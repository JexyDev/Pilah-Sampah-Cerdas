import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';

import '../../../data/providers/repository_providers.dart';

// ─────────────────────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────────────────────

class LocationPingState {
  const LocationPingState({
    this.isTracking = false,
    this.lastLatitude,
    this.lastLongitude,
    this.lastPingTime,
    this.permissionGranted = false,
    this.gpsEnabled = false,
    this.errorMessage,
    this.detectedZoneArea,
  });

  final bool isTracking;
  final double? lastLatitude;
  final double? lastLongitude;
  final DateTime? lastPingTime;
  final bool permissionGranted;
  final bool gpsEnabled;
  final String? errorMessage;
  final String? detectedZoneArea;

  LocationPingState copyWith({
    bool? isTracking,
    double? lastLatitude,
    double? lastLongitude,
    DateTime? lastPingTime,
    bool? permissionGranted,
    bool? gpsEnabled,
    String? errorMessage,
    String? detectedZoneArea,
  }) {
    return LocationPingState(
      isTracking: isTracking ?? this.isTracking,
      lastLatitude: lastLatitude ?? this.lastLatitude,
      lastLongitude: lastLongitude ?? this.lastLongitude,
      lastPingTime: lastPingTime ?? this.lastPingTime,
      permissionGranted: permissionGranted ?? this.permissionGranted,
      gpsEnabled: gpsEnabled ?? this.gpsEnabled,
      errorMessage: errorMessage,
      detectedZoneArea: detectedZoneArea ?? this.detectedZoneArea,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Controller (StateNotifier)
// ─────────────────────────────────────────────────────────────────────────────

class LocationPingNotifier extends StateNotifier<LocationPingState> {
  LocationPingNotifier(this._ref) : super(const LocationPingState());

  final Ref _ref;
  Timer? _timer;

  /// Interval pengiriman ping ke backend: 30 detik (real-time continuous tracking).
  static const Duration pingInterval = Duration(seconds: 30);

  /// Mulai tracking lokasi.
  Future<void> startTracking() async {
    // 1. Cek GPS service aktif
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      state = state.copyWith(
        gpsEnabled: false,
        errorMessage: 'GPS tidak aktif. Aktifkan lokasi di pengaturan perangkat.',
      );
      return;
    }

    // 2. Cek & minta permission
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        state = state.copyWith(
          permissionGranted: false,
          errorMessage: 'Izin lokasi ditolak.',
        );
        return;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      state = state.copyWith(
        permissionGranted: false,
        errorMessage:
            'Izin lokasi ditolak secara permanen. Aktifkan di pengaturan.',
      );
      return;
    }

    // Attempt to request background permission if only whileInUse is granted
    if (permission == LocationPermission.whileInUse) {
       // Request background permission explicitly (if the library supports it directly or rely on the system prompt)
       // Note: in Geolocator, calling requestPermission again might prompt for "Allow all the time" in Android 10+
       // But for simplicity, we will just proceed, as background execution usually requires "always" or a foreground service.
    }

    state = state.copyWith(
      isTracking: true,
      permissionGranted: true,
      gpsEnabled: true,
      errorMessage: null,
    );

    // 3. Kirim ping pertama segera
    await _sendPing();

    // 4. Mulai timer periodic
    _timer?.cancel();
    _timer = Timer.periodic(pingInterval, (_) => _sendPing());
  }

  /// Hentikan tracking lokasi.
  void stopTracking() {
    _timer?.cancel();
    _timer = null;
    state = state.copyWith(isTracking: false);
  }

  /// Kirim satu kali ping lokasi ke backend.
  Future<void> _sendPing() async {
    try {
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          distanceFilter: 0,
        ),
      );

      final repo = _ref.read(kknRepositoryProvider);
      final poskoArea = await repo.sendLocationPing(position.latitude, position.longitude);

      if (mounted) {
        state = state.copyWith(
          lastLatitude: position.latitude,
          lastLongitude: position.longitude,
          lastPingTime: DateTime.now(),
          detectedZoneArea: poskoArea,
          errorMessage: null,
        );
      }
    } catch (e) {
      // Jangan hentikan tracking, cukup log error.
      // Ping berikutnya akan dicoba lagi otomatis.
      if (mounted) {
        state = state.copyWith(
          errorMessage: 'Gagal mengirim lokasi. Akan dicoba kembali.',
        );
      }
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

final locationPingControllerProvider =
    StateNotifierProvider<LocationPingNotifier, LocationPingState>((ref) {
  return LocationPingNotifier(ref);
});
