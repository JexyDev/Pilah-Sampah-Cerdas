import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import 'package:geolocator/geolocator.dart';
import '../../../data/services/location_service.dart';
import '../../../data/services/firebase_notification_service.dart';
import '../../../data/services/local_notification_cache_service.dart';
import '../../auth/controllers/auth_controller.dart';
import '../../../data/providers/repository_providers.dart';
import '../../../data/models/user_entity.dart';
import 'mahasiswa_controller.dart';
import 'mahasiswa_notifikasi_controller.dart';
import '../../../data/services/notification_engine.dart';

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
  int _accumulatedSeconds = 0;

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

    _currentTargetScheduleId ??= 'SCH-TODAY';
    await _fetchTargetLocation();

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
    NotificationEngine().cancelOngoingKKNNotification();
    state = state.copyWith(isTracking: false);
  }

  /// Set the active schedule target to calculate geofencing
  Future<void> setActiveSchedule(String scheduleId) async {
    final isSameSchedule = _currentTargetScheduleId == scheduleId;
    _currentTargetScheduleId = scheduleId;
    
    if (!isSameSchedule) {
      state = state.copyWith(
        isSuccessAttendance: false, 
        attendanceTime: null,
        inZoneDurationSeconds: 0,
        isEligibleForAttendance: false,
        clearWarning: true,
      );
      _zoneEntryTime = null; // Reset the entry time when changing schedule
      _accumulatedSeconds = 0;
    } else {
      // If same schedule (e.g. refreshing), just clear warning and fetch latest
      state = state.copyWith(
        clearWarning: true,
      );
    }
    
    await _fetchTargetLocation();
    await _performLocationUpdate();
  }

  /// Remove active target
  void clearActiveSchedule() {
    _currentTargetScheduleId = null;
    _zoneDurationTimer?.cancel();
    _zoneDurationTimer = null;
    _zoneEntryTime = null;
    _accumulatedSeconds = 0;
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

    // Tampilkan notifikasi persisten karena user masuk zona
    NotificationEngine().showOngoingKKNNotification(
      'Anda sedang berada di dalam zona KKN. Jangan tutup aplikasi atau GPS Anda.',
    );

    _zoneDurationTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) return;
      final now = DateTime.now();

      // Reset harian (jam 12 malam / 00:00) ke 0
      if (_lastTimerDate != null && (now.day != _lastTimerDate!.day || now.month != _lastTimerDate!.month || now.year != _lastTimerDate!.year)) {
        _lastTimerDate = now;
        _stopZoneTimer(resetCompletely: true);
        _zoneEntryTime = now;
        return;
      }
      _lastTimerDate = now;

      if (state.isInsideRadius) {
        _zoneEntryTime ??= now;
        final currentSessionSeconds = now.difference(_zoneEntryTime!).inSeconds;
        final totalElapsed = _accumulatedSeconds + currentSessionSeconds;
        
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
        final bool durationMet = totalElapsed >= 7200;
        final bool eligible = isWithinWebWindow && durationMet;

        state = state.copyWith(
          inZoneDurationSeconds: totalElapsed,
          isEligibleForAttendance: eligible,
          zoneResetWarning: timeWindowWarning,
          clearWarning: timeWindowWarning == null,
        );
      } else {
        _stopZoneTimer(isExitingZone: true);
      }
    });
  }

  /// Stop and reset zone duration timer
  void _stopZoneTimer({bool isExitingZone = false, bool resetCompletely = false}) {
    _zoneDurationTimer?.cancel();
    _zoneDurationTimer = null;
    
    if (_zoneEntryTime != null) {
      _accumulatedSeconds += DateTime.now().difference(_zoneEntryTime!).inSeconds;
      _zoneEntryTime = null;
    }

    if (resetCompletely) {
      _accumulatedSeconds = 0;
    }

    NotificationEngine().cancelOngoingKKNNotification();
    state = state.copyWith(
      inZoneDurationSeconds: _accumulatedSeconds,
      isEligibleForAttendance: false,
      zoneResetWarning: isExitingZone
          ? 'Anda keluar dari zona KKN. Waktu dihentikan sementara (freeze).'
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
      _stopZoneTimer(isExitingZone: _accumulatedSeconds > 0 || _zoneEntryTime != null);
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
    
    double targetLat = -6.96772;
    double targetLng = 107.65906;
    double radius = 500.0;

    if (target != null) {
      if (target['latitude'] != null) {
        targetLat = double.tryParse(target['latitude'].toString()) ?? targetLat;
      } else if (target['lat'] != null) {
        targetLat = double.tryParse(target['lat'].toString()) ?? targetLat;
      }

      if (target['longitude'] != null) {
        targetLng = double.tryParse(target['longitude'].toString()) ?? targetLng;
      } else if (target['lng'] != null) {
        targetLng = double.tryParse(target['lng'].toString()) ?? targetLng;
      }

      if (target['radius'] != null) {
        radius = double.tryParse(target['radius'].toString()) ?? radius;
      }
    }
    
    if (radius <= 0) {
      radius = 500.0;
    }

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
      _stopZoneTimer(isExitingZone: _accumulatedSeconds > 0 || _zoneEntryTime != null);
    }
  }

  /// Trigger manual or auto attendance with full payload
  Future<bool> recordAttendance({
    required String method,
    required String kodeZona,
    required String rw,
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
        rw: rw,
        kecamatan: user?.kecamatan,
        kelurahan: kelurahan,
        durationMinutes: durationMinutes,
        timestamp: DateTime.now().toUtc().toIso8601String(),
      );

      if (isSuccess) {
        _accumulatedSeconds = 0;
        _zoneEntryTime = DateTime.now();
        state = state.copyWith(
          isSuccessAttendance: true,
          attendanceTime: DateTime.now().toLocal().toString().split('.')[0],
          isInsideRadius: true,
          inZoneDurationSeconds: 0,
        );

        if (user != null) {
          await FirebaseNotificationService().saveNotification(
            userId: user.id,
            role: user.role.name,
            title: 'Absensi KKN Berhasil 📍',
            desc: 'Presensi Geofence KKN di $kelurahan ($rw) berhasil tercatat (+10 PTS).',
            type: 'PRESENSI_KKN_SUKSES',
          );
          LocalNotificationCacheService().addNotification(
            userId: user.id,
            role: user.role.name,
            title: 'Absensi KKN Berhasil 📍',
            desc: 'Presensi Geofence KKN di $kelurahan ($rw) berhasil tercatat (+10 PTS).',
            type: 'PRESENSI_KKN_SUKSES',
          );
        }
        ref.invalidate(mahasiswaNotificationsProvider);
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
