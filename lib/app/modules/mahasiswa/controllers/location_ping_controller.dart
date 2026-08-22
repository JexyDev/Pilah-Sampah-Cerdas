import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../data/providers/repository_providers.dart';
import 'kkn_location_controller.dart';

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
    this.pendingOfflineCount = 0,
  });

  final bool isTracking;
  final double? lastLatitude;
  final double? lastLongitude;
  final DateTime? lastPingTime;
  final bool permissionGranted;
  final bool gpsEnabled;
  final String? errorMessage;
  final String? detectedZoneArea;
  final int pendingOfflineCount;

  LocationPingState copyWith({
    bool? isTracking,
    double? lastLatitude,
    double? lastLongitude,
    DateTime? lastPingTime,
    bool? permissionGranted,
    bool? gpsEnabled,
    String? errorMessage,
    String? detectedZoneArea,
    int? pendingOfflineCount,
  }) {
    return LocationPingState(
      isTracking: isTracking ?? this.isTracking,
      lastLatitude: lastLatitude ?? this.lastLatitude,
      lastLongitude: lastLongitude ?? this.lastLongitude,
      lastPingTime: lastPingTime ?? this.lastPingTime,
      permissionGranted: permissionGranted ?? this.permissionGranted,
      gpsEnabled: gpsEnabled ?? this.gpsEnabled,
      errorMessage: errorMessage ?? this.errorMessage,
      detectedZoneArea: detectedZoneArea ?? this.detectedZoneArea,
      pendingOfflineCount: pendingOfflineCount ?? this.pendingOfflineCount,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Controller (StateNotifier)
// ─────────────────────────────────────────────────────────────────────────────

class LocationPingNotifier extends StateNotifier<LocationPingState> {
  LocationPingNotifier(this._ref) : super(const LocationPingState()) {
    _loadOfflineQueue();
  }

  final Ref _ref;
  Timer? _timer;
  List<Map<String, dynamic>> _offlineQueue = [];
  static const String _offlineStorageKey = 'kkn_offline_location_queue';

  /// Interval pengiriman ping ke backend: 15 detik (real-time continuous tracking).
  static const Duration pingInterval = Duration(seconds: 15);

  Future<void> _loadOfflineQueue() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedStr = prefs.getString(_offlineStorageKey);
      if (savedStr != null && savedStr.isNotEmpty) {
        final List<dynamic> decoded = jsonDecode(savedStr);
        _offlineQueue = decoded.map((e) => Map<String, dynamic>.from(e)).toList();
        if (mounted) {
          state = state.copyWith(pendingOfflineCount: _offlineQueue.length);
        }
      }
    } catch (e) {
      debugPrint('[LocationPing] Load offline queue error: $e');
    }
  }

  Future<void> _saveOfflineQueue() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_offlineStorageKey, jsonEncode(_offlineQueue));
      if (mounted) {
        state = state.copyWith(pendingOfflineCount: _offlineQueue.length);
      }
    } catch (e) {
      debugPrint('[LocationPing] Save offline queue error: $e');
    }
  }

  Future<void> _flushOfflineQueue() async {
    if (_offlineQueue.isEmpty) return;
    final List<Map<String, dynamic>> itemsToSend = List.from(_offlineQueue);
    _offlineQueue.clear();
    await _saveOfflineQueue();

    final repo = _ref.read(kknRepositoryProvider);
    for (final item in itemsToSend) {
      try {
        final lat = (item['lat'] as num).toDouble();
        final lng = (item['lng'] as num).toDouble();
        final accumulated = _ref.read(kknLocationProvider).inZoneDurationSeconds ?? 0;
        await repo.sendLocationPing(lat, lng, inZoneSeconds: accumulated);
      } catch (e) {
        // Jika jaringan gagal lagi saat flushing, kembalikan item yang tersisa ke antrean
        _offlineQueue.add(item);
        await _saveOfflineQueue();
      }
    }
  }

  /// Mulai tracking lokasi.
  Future<void> startTracking() async {
    if (state.isTracking) return;

    // 1. Cek izin lokasi
    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }

    final hasPermission = permission == LocationPermission.whileInUse ||
        permission == LocationPermission.always;

    if (!hasPermission) {
      state = state.copyWith(
        permissionGranted: false,
        errorMessage: 'Izin lokasi ditolak. Aktifkan izin lokasi untuk presensi.',
      );
      return;
    }

    // 2. Cek apakah GPS aktif
    final isGpsEnabled = await Geolocator.isLocationServiceEnabled();
    if (!isGpsEnabled) {
      state = state.copyWith(
        gpsEnabled: false,
        errorMessage: 'GPS/Layanan lokasi tidak aktif. Harap aktifkan GPS.',
      );
      return;
    }

    state = state.copyWith(
      isTracking: true,
      permissionGranted: true,
      gpsEnabled: true,
      errorMessage: null,
    );

    // 3. Kirim ping pertama
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
    // Flush antrean offline terlebih dahulu jika ada sinyal
    if (_offlineQueue.isNotEmpty) {
      await _flushOfflineQueue();
    }

    double lat = 0;
    double lng = 0;

    try {
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          distanceFilter: 0,
        ),
      );
      lat = position.latitude;
      lng = position.longitude;

      final repo = _ref.read(kknRepositoryProvider);
      final accumulated = _ref.read(kknLocationProvider).inZoneDurationSeconds ?? 0;
      final pingResponse = await repo.sendLocationPing(lat, lng, inZoneSeconds: accumulated);
      final data = pingResponse['data'] as Map<String, dynamic>?;
      final poskoArea = data?['poskoArea']?.toString() ?? data?['kelurahan']?.toString();

      if (mounted) {
        // [FIX B1] Jangan agresif matikan tracker.
        // Jika data null (server error), biarkan ping berikutnya mencoba lagi.
        if (data == null) {
          return;
        }
        
        // Hanya matikan jika server bilang tidak ada jadwal DAN state lokal juga BUKAN berlangsung
        if (!data.containsKey('activeScheduleId') || data['activeScheduleId'] == null) {
          final localStatus = _ref.read(kknLocationProvider).activeActivity?['attendanceStatus']
              ?.toString().toLowerCase() ?? '';
          final localStatusKh = _ref.read(kknLocationProvider).activeActivity?['statusKehadiran']
              ?.toString().toLowerCase() ?? '';
          if (localStatus != 'berlangsung' && localStatusKh != 'berlangsung') {
            stopTracking();
            _ref.read(kknLocationProvider.notifier).stopTracking();
            return;
          }
          // Jika lokal masih berlangsung, jangan matikan — biarkan ping berikutnya
        }

        state = state.copyWith(
          lastLatitude: lat,
          lastLongitude: lng,
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
