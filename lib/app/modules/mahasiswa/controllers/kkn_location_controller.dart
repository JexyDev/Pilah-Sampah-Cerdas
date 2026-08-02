import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import 'package:geolocator/geolocator.dart';
import '../../../data/services/location_service.dart';
import '../../auth/controllers/auth_controller.dart';
import '../../../data/providers/repository_providers.dart';
import '../../../data/models/user_entity.dart';
import 'mahasiswa_controller.dart';

class KknLocationState {
  final Position? currentPosition;
  final bool isTracking;
  final String? error;
  final bool isInsideRadius;
  final double distanceToTarget;
  final Map<String, dynamic>? activeActivity;
  final bool isSuccessAttendance;
  final String? attendanceTime;
  final int inZoneDurationSeconds;
  final bool isEligibleForAttendance;
  final String? zoneResetWarning;

  KknLocationState({
    this.currentPosition,
    this.isTracking = false,
    this.error,
    this.isInsideRadius = false,
    this.distanceToTarget = 999999.0,
    this.activeActivity,
    this.isSuccessAttendance = false,
    this.attendanceTime,
    this.inZoneDurationSeconds = 0,
    this.isEligibleForAttendance = false,
    this.zoneResetWarning,
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
    int? inZoneDurationSeconds,
    bool? isEligibleForAttendance,
    String? zoneResetWarning,
    bool clearError = false,
    bool clearActivity = false,
    bool clearWarning = false,
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
      inZoneDurationSeconds: inZoneDurationSeconds ?? this.inZoneDurationSeconds,
      isEligibleForAttendance: isEligibleForAttendance ?? this.isEligibleForAttendance,
      zoneResetWarning: clearWarning ? null : (zoneResetWarning ?? this.zoneResetWarning),
    );
  }
}

class KknLocationNotifier extends StateNotifier<KknLocationState> {
  KknLocationNotifier(this.ref) : super(KknLocationState()) {
    ref.listen(authProvider, (previous, next) {
      final user = next.user;
      if (user == null || user.role != UserRole.mahasiswaKkn) {
        stopTracking();
      }
    });
  }

  final Ref ref;
  Timer? _trackingTimer;
  Timer? _zoneDurationTimer;
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
    _zoneDurationTimer?.cancel();
    _zoneDurationTimer = null;
    state = state.copyWith(isTracking: false);
  }

  /// Set the active schedule target to calculate geofencing
  Future<void> setActiveSchedule(String scheduleId) async {
    _currentTargetScheduleId = scheduleId;
    state = state.copyWith(
      isSuccessAttendance: false, 
      attendanceTime: null,
      inZoneDurationSeconds: 0,
      isEligibleForAttendance: false,
      clearWarning: true,
    );
    await _fetchTargetLocation();
    await _performLocationUpdate();
  }

  /// Remove active target
  void clearActiveSchedule() {
    _currentTargetScheduleId = null;
    _zoneDurationTimer?.cancel();
    _zoneDurationTimer = null;
    state = state.copyWith(
      clearActivity: true,
      isInsideRadius: false,
      distanceToTarget: 999999.0,
      inZoneDurationSeconds: 0,
      isEligibleForAttendance: false,
    );
  }

  /// Fetch schedule coordinates from backend
  Future<void> _fetchTargetLocation() async {
    if (_currentTargetScheduleId == null) return;
    try {
      final repo = ref.read(kknRepositoryProvider);
      final locationData = await repo.getTargetLocation(_currentTargetScheduleId!);
      state = state.copyWith(activeActivity: locationData);
    } catch (e) {
      state = state.copyWith(error: 'Gagal memuat target lokasi kegiatan.');
    }
  }

  /// Start 1-second ticker for in-zone duration
  void _startZoneTimer() {
    if (_zoneDurationTimer?.isActive ?? false) return;
    _zoneDurationTimer?.cancel();
    _zoneDurationTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) return;
      if (state.isInsideRadius) {
        final newSeconds = state.inZoneDurationSeconds + 1;
        // 120 minutes = 7200 seconds
        final bool eligible = newSeconds >= 7200;
        state = state.copyWith(
          inZoneDurationSeconds: newSeconds,
          isEligibleForAttendance: eligible,
          clearWarning: true,
        );
      } else {
        _stopZoneTimer(hadDuration: state.inZoneDurationSeconds > 0);
      }
    });
  }

  /// Stop and reset zone duration timer
  void _stopZoneTimer({bool hadDuration = false}) {
    _zoneDurationTimer?.cancel();
    _zoneDurationTimer = null;
    state = state.copyWith(
      inZoneDurationSeconds: 0,
      isEligibleForAttendance: false,
      zoneResetWarning: hadDuration
          ? 'Anda keluar dari zona geofence KKN! Waktu keberadaan di-reset ke 0 menit.'
          : null,
    );
  }

  /// Fetch GPS and sync to backend
  Future<void> _performLocationUpdate() async {
    final pos = await LocationService.instance.getCurrentLocation();
    if (pos == null) {
      state = state.copyWith(
        error: 'Lokasi tidak diketahui. Harap aktifkan GPS Anda.',
        isInsideRadius: false,
      );
      _stopZoneTimer(hadDuration: state.inZoneDurationSeconds > 0);
      return;
    }

    state = state.copyWith(currentPosition: pos, error: null, clearError: true);

    // Send update to backend
    try {
      final repo = ref.read(kknRepositoryProvider);
      await repo.sendLocationPing(pos.latitude, pos.longitude);
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

      final bool nowInside = distance <= radius;
      state = state.copyWith(
        distanceToTarget: distance,
        isInsideRadius: nowInside,
      );

      if (nowInside) {
        _startZoneTimer();
      } else {
        _stopZoneTimer(hadDuration: state.inZoneDurationSeconds > 0);
      }
    }
  }

  /// Trigger manual or auto attendance with full payload
  Future<bool> recordAttendance({
    required String method,
    required String kodeZona,
    required String rtRw,
    required String kelurahan,
  }) async {
    if (_currentTargetScheduleId == null) return false;
    final pos = state.currentPosition;
    if (pos == null) {
      state = state.copyWith(error: 'Tidak dapat absen. Lokasi GPS tidak terdeteksi.');
      return false;
    }

    final user = ref.read(authProvider).user;
    final nim = ref.read(mahasiswaControllerProvider).dashboard?.nim ?? user?.phone ?? '';
    final namaMahasiswa = user?.name ?? 'Mahasiswa KKN';
    final durationMinutes = (state.inZoneDurationSeconds / 60).floor();

    try {
      final repo = ref.read(kknRepositoryProvider);
      final isSuccess = await repo.recordAttendance(
        scheduleId: _currentTargetScheduleId!,
        latitude: pos.latitude,
        longitude: pos.longitude,
        method: method,
        nim: nim,
        namaMahasiswa: namaMahasiswa,
        kodeZona: kodeZona,
        rtRw: rtRw,
        kelurahan: kelurahan,
        durationMinutes: durationMinutes,
        timestamp: DateTime.now().toUtc().toIso8601String(),
      );

      if (isSuccess) {
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
    _zoneDurationTimer?.cancel();
    super.dispose();
  }
}

final kknLocationProvider = StateNotifierProvider<KknLocationNotifier, KknLocationState>((ref) {
  return KknLocationNotifier(ref);
});
