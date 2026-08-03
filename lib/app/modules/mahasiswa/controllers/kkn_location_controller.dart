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
  final DateTime? checkInTime;
  final DateTime? checkOutTime;

  /// Kalkulasi Total Jam Kerja (Selisih Pulang - Masuk)
  int get totalWorkMinutes {
    if (checkInTime == null) return 0;
    final end = checkOutTime ?? DateTime.now();
    return end.difference(checkInTime!).inMinutes;
  }

  /// Format String Jam Kerja (misal: "7 Jam 30 Menit")
  String get formattedWorkDuration {
    final mins = totalWorkMinutes;
    if (mins <= 0) return '0 Menit';
    final hours = mins ~/ 60;
    final remainingMins = mins % 60;
    if (hours > 0) {
      return '$hours Jam $remainingMins Menit';
    }
    return '$remainingMins Menit';
  }

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
    this.checkInTime,
    this.checkOutTime,
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
    DateTime? checkInTime,
    DateTime? checkOutTime,
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
      checkInTime: checkInTime ?? this.checkInTime,
      checkOutTime: checkOutTime ?? this.checkOutTime,
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
  Future<void> startTracking([BuildContext? context]) async {
    if (state.isTracking) return;

    LocationPermission permission;
    if (context != null) {
      permission = await LocationService.instance.checkAndRequestPermission(context);
    } else {
      permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
    }

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

    // Setup periodic updates every 10 seconds (Real-Time Responsiveness)
    _trackingTimer?.cancel();
    _trackingTimer = Timer.periodic(const Duration(seconds: 10), (timer) async {
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

  DateTime? _lastTimerDate;
  DateTime? _zoneEntryTime;

  /// Start 1-second ticker for in-zone duration
  void _startZoneTimer() {
    _zoneEntryTime ??= DateTime.now();
    
    if (_zoneDurationTimer?.isActive ?? false) return;
    _zoneDurationTimer?.cancel();
    _lastTimerDate = DateTime.now();

    _zoneDurationTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) return;
      final now = DateTime.now();

      // Reset harian (jam 12 malam / 00:00) ke 0
      if (_lastTimerDate != null && (now.day != _lastTimerDate!.day || now.month != _lastTimerDate!.month || now.year != _lastTimerDate!.year)) {
        _lastTimerDate = now;
        _zoneEntryTime = now;
        _stopZoneTimer(hadDuration: false);
        return;
      }
      _lastTimerDate = now;

      if (state.isInsideRadius) {
        _zoneEntryTime ??= now;
        final elapsedSeconds = now.difference(_zoneEntryTime!).inSeconds;
        
        // Sinkronisasi Real-Time dengan Web: Waktu Mulai & Batas Waktu Absen
        final target = state.activeActivity;
        bool isWithinWebWindow = true;
        String? timeWindowWarning;

        if (target != null) {
          final startTimeStr = target['waktuMulai'] ?? target['startTime'] ?? target['waktu_mulai'];
          final endTimeStr = target['batasWaktuAbsen'] ?? target['endTime'] ?? target['end_time'] ?? target['batas_waktu_absen'];

          if (startTimeStr != null && startTimeStr.toString().trim().isNotEmpty) {
            final startTime = DateTime.tryParse(startTimeStr.toString());
            if (startTime != null && now.isBefore(startTime)) {
              isWithinWebWindow = false;
              timeWindowWarning = 'Absensi belum dibuka. Jadwal dimulai pada ${startTime.hour.toString().padLeft(2, '0')}:${startTime.minute.toString().padLeft(2, '0')}';
            }
          }

          if (endTimeStr != null && endTimeStr.toString().trim().isNotEmpty) {
            final endTime = DateTime.tryParse(endTimeStr.toString());
            if (endTime != null && now.isAfter(endTime)) {
              isWithinWebWindow = false;
              timeWindowWarning = 'Batas waktu absen telah berakhir (Tutup pada ${endTime.hour.toString().padLeft(2, '0')}:${endTime.minute.toString().padLeft(2, '0')})';
            }
          }
        }

        // Syarat Absen MUTLAK: Harus berada di zona minimal 2 JAM (7200 detik / 120 menit)
        final bool durationMet = elapsedSeconds >= 7200;
        final bool eligible = isWithinWebWindow && durationMet;

        state = state.copyWith(
          inZoneDurationSeconds: elapsedSeconds,
          isEligibleForAttendance: eligible,
          zoneResetWarning: timeWindowWarning,
          clearWarning: timeWindowWarning == null,
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
    _zoneEntryTime = null;
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
    
    // Default fallback ke Posko KKN Bojongsoang jika belum ada jadwal kegiatan spesifik yang dipilih
    final double targetLat = (target?['latitude'] as num?)?.toDouble() ??
        (target?['lat'] as num?)?.toDouble() ??
        -6.975412;
    final double targetLng = (target?['longitude'] as num?)?.toDouble() ??
        (target?['lng'] as num?)?.toDouble() ??
        107.632145;
    final double radius = (target?['radius'] as num?)?.toDouble() ?? 5000.0; // 5 KM Radius Default Zona KKN

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

  /// Trigger manual or auto attendance with full payload
  Future<bool> recordAttendance({
    required String method,
    required String kodeZona,
    required String rtRw,
    required String kelurahan,
  }) async {
    _currentTargetScheduleId ??= 'SCH-TODAY';
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
