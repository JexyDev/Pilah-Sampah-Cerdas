import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import 'package:geolocator/geolocator.dart';
import '../../core/services/location_service.dart';
import 'auth_provider.dart';
import 'repository_providers.dart';
import '../../domain/entities/user_entity.dart';

class KknLocationState {
  final Position? currentPosition;
  final bool isTracking;
  final String? error;
  final bool isInsideRadius;
  final double distanceToTarget;
  final Map<String, dynamic>? activeActivity;
  final bool isSuccessAttendance;
  final String? attendanceTime;

  KknLocationState({
    this.currentPosition,
    this.isTracking = false,
    this.error,
    this.isInsideRadius = false,
    this.distanceToTarget = 999999.0,
    this.activeActivity,
    this.isSuccessAttendance = false,
    this.attendanceTime,
  });

  KknLocationState copyWith({
    Position? currentPosition,
    bool? isTracking,
    String? error,
    bool? isInsideRadius,
    double? distanceToTarget,
    Map<String, dynamic>? activeActivity,
    bool? isSuccessAttendance,
    String? attendanceTime,
    bool clearError = false,
    bool clearActivity = false,
  }) {
    return KknLocationState(
      currentPosition: currentPosition ?? this.currentPosition,
      isTracking: isTracking ?? this.isTracking,
      error: clearError ? null : (error ?? this.error),
      isInsideRadius: isInsideRadius ?? this.isInsideRadius,
      distanceToTarget: distanceToTarget ?? this.distanceToTarget,
      activeActivity: clearActivity ? null : (activeActivity ?? this.activeActivity),
      isSuccessAttendance: isSuccessAttendance ?? this.isSuccessAttendance,
      attendanceTime: attendanceTime ?? this.attendanceTime,
    );
  }
}

class KknLocationNotifier extends StateNotifier<KknLocationState> {
  KknLocationNotifier(this.ref) : super(KknLocationState()) {
    // Listen for auth changes to start/stop tracking
    ref.listen(authProvider, (previous, next) {
      final user = next.user;
      if (user != null && user.role == UserRole.mahasiswaKkn) {
        // Automatically start checking permission/location
      } else {
        stopTracking();
      }
    });
  }

  final Ref ref;
  Timer? _trackingTimer;
  String? _currentTargetScheduleId;

  /// Start tracking GPS locations and sync with backend
  Future<void> startTracking(BuildContext context) async {
    if (state.isTracking) return;

    final permission = await LocationService.instance.checkAndRequestPermission(context);
    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever ||
        permission == LocationPermission.unableToDetermine) {
      state = state.copyWith(
        error: 'Izin lokasi ditolak atau tidak tersedia. Tidak dapat memantau kehadiran.',
        isTracking: false,
      );
      return;
    }

    state = state.copyWith(isTracking: true, error: null, clearError: true);

    // Initial check
    await _performLocationUpdate();

    // Setup periodic updates every 25 seconds
    _trackingTimer?.cancel();
    _trackingTimer = Timer.periodic(const Duration(seconds: 25), (timer) async {
      await _performLocationUpdate();
    });
  }

  /// Stop the tracking timer
  void stopTracking() {
    _trackingTimer?.cancel();
    _trackingTimer = null;
    state = state.copyWith(isTracking: false);
  }

  /// Set the active schedule target to calculate geofencing
  Future<void> setActiveSchedule(String scheduleId) async {
    _currentTargetScheduleId = scheduleId;
    state = state.copyWith(isSuccessAttendance: false, attendanceTime: null);
    await _fetchTargetLocation();
    await _performLocationUpdate();
  }

  /// Remove active target
  void clearActiveSchedule() {
    _currentTargetScheduleId = null;
    state = state.copyWith(
      clearActivity: true,
      isInsideRadius: false,
      distanceToTarget: 999999.0,
    );
  }

  /// Fetch schedule coordinates from backend
  Future<void> _fetchTargetLocation() async {
    if (_currentTargetScheduleId == null) return;
    try {
      final apiClient = ref.read(apiClientProvider);
      final res = await apiClient.dio.get('/kegiatan/$_currentTargetScheduleId/lokasi');
      if (res.statusCode == 200 && res.data['success'] == true) {
        state = state.copyWith(activeActivity: res.data['data']);
      }
    } catch (e) {
      state = state.copyWith(error: 'Gagal memuat target lokasi kegiatan.');
    }
  }

  /// Fetch GPS and sync to backend
  Future<void> _performLocationUpdate() async {
    final pos = await LocationService.instance.getCurrentLocation();
    if (pos == null) {
      state = state.copyWith(
        error: 'Lokasi tidak diketahui. Harap aktifkan GPS Anda.',
        isInsideRadius: false,
      );
      return;
    }

    state = state.copyWith(currentPosition: pos, error: null, clearError: true);

    // Send update to backend
    try {
      final apiClient = ref.read(apiClientProvider);
      await apiClient.dio.post('/mahasiswa/lokasi', data: {
        'latitude': pos.latitude,
        'longitude': pos.longitude,
        'timestamp': DateTime.now().toIso8601String(),
      });
    } catch (_) {
      // Fail silently for background GPS updates
    }

    // Geofencing checks
    final target = state.activeActivity;
    if (target != null) {
      final targetLat = target['latitude'] as double;
      final targetLng = target['longitude'] as double;
      final radius = target['radius'] as num;

      final distance = Geolocator.distanceBetween(
        pos.latitude,
        pos.longitude,
        targetLat,
        targetLng,
      );

      state = state.copyWith(
        distanceToTarget: distance,
        isInsideRadius: distance <= radius,
      );
    }
  }

  /// Trigger manual or auto attendance
  Future<bool> recordAttendance(String method) async {
    if (_currentTargetScheduleId == null) return false;
    final pos = state.currentPosition;
    if (pos == null) {
      state = state.copyWith(error: 'Tidak dapat absen. Lokasi GPS tidak terdeteksi.');
      return false;
    }

    try {
      final apiClient = ref.read(apiClientProvider);
      final res = await apiClient.dio.post('/kegiatan/$_currentTargetScheduleId/absen', data: {
        'latitude': pos.latitude,
        'longitude': pos.longitude,
        'method': method,
      });

      if (res.statusCode == 200) {
        state = state.copyWith(
          isSuccessAttendance: true,
          attendanceTime: DateTime.now().toLocal().toString().split('.')[0],
          isInsideRadius: true,
        );
        return true;
      }
    } on DioException catch (e) {
      final msg = e.response?.data?['message']?.toString() ?? 'Gagal absensi kegiatan.';
      state = state.copyWith(error: msg);
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
    return false;
  }

  @override
  void dispose() {
    _trackingTimer?.cancel();
    super.dispose();
  }
}

final kknLocationProvider = StateNotifierProvider<KknLocationNotifier, KknLocationState>((ref) {
  return KknLocationNotifier(ref);
});
