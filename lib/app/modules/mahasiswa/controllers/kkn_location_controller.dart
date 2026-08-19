import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
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
import '../../../core/utils/network_exception_helper.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_foreground_task/flutter_foreground_task.dart';
import '../services/kkn_background_task_handler.dart';

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
  final int targetDurationMinutes;

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
    this.targetDurationMinutes = 60,
    this.attendanceId,
    this.alpaDurationMinutes,
  });

  final String? attendanceId;
  final int? alpaDurationMinutes;

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
    int? targetDurationMinutes,
    String? attendanceId,
    int? alpaDurationMinutes,
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
      activeActivity: clearActivity
          ? null
          : (activeActivity ?? this.activeActivity),
      isSuccessAttendance: isSuccessAttendance ?? this.isSuccessAttendance,
      attendanceTime: attendanceTime ?? this.attendanceTime,
      inZoneDurationSeconds:
          inZoneDurationSeconds ?? this.inZoneDurationSeconds,
      isEligibleForAttendance:
          isEligibleForAttendance ?? this.isEligibleForAttendance,
      zoneResetWarning: clearWarning
          ? null
          : (zoneResetWarning ?? this.zoneResetWarning),
      checkInTime: checkInTime ?? this.checkInTime,
      checkOutTime: checkOutTime ?? this.checkOutTime,
      targetDurationMinutes:
          targetDurationMinutes ?? this.targetDurationMinutes,
      attendanceId: attendanceId ?? this.attendanceId,
      alpaDurationMinutes: alpaDurationMinutes ?? this.alpaDurationMinutes,
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
  DateTime? _zoneEntryTime;
  bool _backgroundServiceStarted = false;

  static const _prefKeyAccumulated = 'kkn_accumulated_seconds';
  static const _prefKeyDate = 'kkn_accumulated_date';
  static const _prefKeyTarget = 'kkn_accumulated_target';

  Future<void> _loadPersistentTimer() async {
    final prefs = await SharedPreferences.getInstance();
    final targetKey = _currentTargetScheduleId != null && _currentTargetScheduleId != 'SCH-TODAY'
        ? '_$_currentTargetScheduleId'
        : '';
    final savedDate = prefs.getString('$_prefKeyDate$targetKey');
    final today = DateTime.now().toLocal().toString().substring(0, 10);

    if (savedDate != today) {
      _accumulatedSeconds = 0;
      await _savePersistentTimer();
    } else {
      _accumulatedSeconds = prefs.getInt('$_prefKeyAccumulated$targetKey') ?? 0;
    }
  }

  Future<void> _savePersistentTimer() async {
    final prefs = await SharedPreferences.getInstance();
    final today = DateTime.now().toLocal().toString().substring(0, 10);
    final targetKey = _currentTargetScheduleId != null && _currentTargetScheduleId != 'SCH-TODAY'
        ? '_$_currentTargetScheduleId'
        : '';
    await prefs.setString('$_prefKeyDate$targetKey', today);
    await prefs.setInt('$_prefKeyAccumulated$targetKey', _accumulatedSeconds);
    if (_currentTargetScheduleId != null) {
      await prefs.setString(_prefKeyTarget, _currentTargetScheduleId!);
    }
  }

  Future<void> _savePersistentTimerTempValue(int tempSeconds) async {
    final prefs = await SharedPreferences.getInstance();
    final today = DateTime.now().toLocal().toString().substring(0, 10);
    final targetKey = _currentTargetScheduleId != null && _currentTargetScheduleId != 'SCH-TODAY'
        ? '_$_currentTargetScheduleId'
        : '';
    await prefs.setString('$_prefKeyDate$targetKey', today);
    await prefs.setInt('$_prefKeyAccumulated$targetKey', tempSeconds);
    if (_currentTargetScheduleId != null) {
      await prefs.setString(_prefKeyTarget, _currentTargetScheduleId!);
    }
  }

  Future<void> checkActiveSchedule() async {
    try {
      final pos = await LocationService.instance.getCurrentLocation();
      final repo = ref.read(kknRepositoryProvider);
      final activeZone = await repo.getActiveZone(
        latitude: pos?.latitude,
        longitude: pos?.longitude,
      );
      if (activeZone.isNotEmpty) {
        _currentTargetScheduleId =
            activeZone['id']?.toString() ?? activeZone['scheduleId']?.toString();
        
        // Ensure address and namaKegiatan are set so UI displays them properly before tracking
        activeZone['address'] ??=
            activeZone['location'] ?? activeZone['kelurahan'] ?? 'Zona Dampingan';
        activeZone['namaKegiatan'] ??= activeZone['title'] ?? 'Penugasan KKN';
        activeZone['radius'] ??= 100;

        state = state.copyWith(
          activeActivity: activeZone,
          error: null,
          clearError: true,
        );
      } else {
        state = state.copyWith(activeActivity: null);
      }
    } catch (e) {
      state = state.copyWith(error: NetworkExceptionHelper.getErrorMessage(e));
    }
  }

  /// Start tracking GPS locations and sync with backend
  Future<void> startTracking([BuildContext? context]) async {
    if (state.isTracking) return;

    LocationPermission permission;
    if (context != null) {
      permission = await LocationService.instance.checkAndRequestPermission(
        context,
      );
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
        error:
            'Izin lokasi ditolak atau tidak tersedia. Tidak dapat memantau kehadiran.',
        isTracking: false,
      );
      return;
    }

    // LOAD PERSISTENT TIMER
    await _loadPersistentTimer();

    state = state.copyWith(isTracking: true, error: null, clearError: true);

    if (_currentTargetScheduleId == null ||
        _currentTargetScheduleId == 'SCH-TODAY') {
      try {
        final pos = await LocationService.instance.getCurrentLocation();
        final repo = ref.read(kknRepositoryProvider);
        final activeZone = await repo.getActiveZone(
          latitude: pos?.latitude,
          longitude: pos?.longitude,
        );
        if (activeZone.isNotEmpty) {
          _currentTargetScheduleId =
              activeZone['id']?.toString() ??
              activeZone['scheduleId']?.toString();
          final status =
              (activeZone['attendanceStatus'] ?? activeZone['status'] ?? activeZone['kehadiran'] ?? '')
                  .toString()
                  .toLowerCase();
          final bool isAttended = activeZone['isAttended'] == true || status == 'hadir';

          final double rawTargetMins = double.tryParse(activeZone['targetDurationMinutes']?.toString() ?? '') ??
              double.tryParse(activeZone['durationMinutes']?.toString() ?? '') ??
              2.0;
          int targetMins = rawTargetMins.ceil();
          if (rawTargetMins > 0 && rawTargetMins < 1.0) {
            targetMins = (rawTargetMins * 60).ceil();
          }
          if (targetMins <= 0) targetMins = 1;

          if (isAttended || status == 'hadir') {
            _accumulatedSeconds = targetMins * 60;
            state = state.copyWith(
              isSuccessAttendance: true,
              inZoneDurationSeconds: _accumulatedSeconds,
              isEligibleForAttendance: false,
              zoneResetWarning: 'Anda sudah berhasil melakukan presensi (Hadir) pada jadwal kegiatan ini.',
              clearWarning: false,
              clearError: true,
            );
          } else if (status == 'izin' || status == 'sakit') {
            state = state.copyWith(
              zoneResetWarning:
                  'Anda tercatat ${status.toUpperCase()} pada jadwal kegiatan ini.',
            );
          } else if (status == 'alpa') {
            state = state.copyWith(
              zoneResetWarning:
                  'Waktu kegiatan telah berakhir. Anda tercatat TANPA KETERANGAN.',
            );
          } else {
            state = state.copyWith(clearWarning: true);
            await _loadPersistentTimer();
          }
          
          if (activeZone['latitude'] != null &&
              activeZone['longitude'] != null) {
            state = state.copyWith(
              activeActivity: activeZone,
              targetDurationMinutes: targetMins,
              inZoneDurationSeconds: (isAttended || status == 'hadir') ? targetMins * 60 : _accumulatedSeconds,
            );
          }
        }
      } catch (_) {}
    } else {
      await fetchTargetLocation();
    }

    // Initial check
    await _performLocationUpdate();

    // Setup periodic updates every 10 seconds (Real-Time Responsiveness)
    _trackingTimer?.cancel();
    _trackingTimer = Timer.periodic(const Duration(seconds: 10), (timer) async {
      await _performLocationUpdate();
    });

    // ═════════════════════════════════════════════════════════════════
    // START BACKGROUND FOREGROUND SERVICE
    // Agar GPS tetap jalan meski layar mati / user pindah app
    // ═════════════════════════════════════════════════════════════════
    _startBackgroundService();
  }

  /// Stop the tracking timer
  void stopTracking() {
    _trackingTimer?.cancel();
    _trackingTimer = null;
    _zoneDurationTimer?.cancel();
    _zoneDurationTimer = null;
    NotificationEngine().cancelOngoingKKNNotification();
    _stopBackgroundService();
    state = state.copyWith(isTracking: false);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // BACKGROUND FOREGROUND SERVICE INTEGRATION
  // ═══════════════════════════════════════════════════════════════════════

  /// Mulai foreground service untuk background GPS tracking
  Future<void> _startBackgroundService() async {
    if (_backgroundServiceStarted) return;
    
    final target = state.activeActivity;
    if (target == null) return;
    
    try {
      // Ambil API config dari environment
      final prefs = await SharedPreferences.getInstance();
      final apiBaseUrl = prefs.getString('api_base_url');
      final authToken = prefs.getString('auth_token');
      
      final result = await startKknForegroundService(
        targetData: target,
        apiBaseUrl: apiBaseUrl,
        authToken: authToken,
      );
      
      if (result is ServiceRequestSuccess) {
        _backgroundServiceStarted = true;
        debugPrint('[KKN-Controller] Background service started successfully');
        
        // Listen untuk update dari background service
        FlutterForegroundTask.addTaskDataCallback(_onBackgroundData);
      }
    } catch (e) {
      debugPrint('[KKN-Controller] Failed to start background service: $e');
      // Tidak fatal — tracking tetap berjalan di foreground via Timer
    }
  }

  /// Hentikan foreground service
  Future<void> _stopBackgroundService() async {
    if (!_backgroundServiceStarted) return;
    
    try {
      // Kirim pesan STOP ke background isolate
      FlutterForegroundTask.sendDataToTask({'type': 'STOP'});
      await stopKknForegroundService();
      FlutterForegroundTask.removeTaskDataCallback(_onBackgroundData);
      _backgroundServiceStarted = false;
      debugPrint('[KKN-Controller] Background service stopped');
    } catch (e) {
      debugPrint('[KKN-Controller] Failed to stop background service: $e');
    }
  }

  /// Callback untuk data dari background service
  void _onBackgroundData(Object data) {
    if (!mounted) return;
    if (data is! Map) return;
    
    final type = data['type']?.toString();
    
    switch (type) {
      case 'DURATION_UPDATE':
        final totalSeconds = (data['totalSeconds'] as num?)?.toInt() ?? 0;
        final isEligible = data['isEligible'] == true;
        final isInside = data['inside'] == true;
        final distance = (data['distance'] as num?)?.toDouble() ?? 999999.0;
        final lat = (data['lat'] as num?)?.toDouble();
        final lng = (data['lng'] as num?)?.toDouble();
        
        // Update accumulated seconds dari background
        _accumulatedSeconds = totalSeconds;
        
        state = state.copyWith(
          inZoneDurationSeconds: totalSeconds,
          isEligibleForAttendance: isEligible,
          isInsideRadius: isInside,
          distanceToTarget: distance,
          currentPosition: (lat != null && lng != null) 
              ? Position(
                  latitude: lat, longitude: lng,
                  timestamp: DateTime.now(),
                  accuracy: 0, altitude: 0, altitudeAccuracy: 0,
                  heading: 0, headingAccuracy: 0, speed: 0, speedAccuracy: 0,
                )
              : null,
        );
        break;
        
      case 'LOCATION_UPDATE':
        final lat = (data['lat'] as num?)?.toDouble();
        final lng = (data['lng'] as num?)?.toDouble();
        final isInside = data['inside'] == true;
        final distance = (data['distance'] as num?)?.toDouble() ?? 999999.0;
        
        state = state.copyWith(
          isInsideRadius: isInside,
          distanceToTarget: distance,
          currentPosition: (lat != null && lng != null)
              ? Position(
                  latitude: lat, longitude: lng,
                  timestamp: DateTime.now(),
                  accuracy: 0, altitude: 0, altitudeAccuracy: 0,
                  heading: 0, headingAccuracy: 0, speed: 0, speedAccuracy: 0,
                )
              : null,
        );
        break;
        
      case 'GEOFENCE_STATUS':
        final message = data['message']?.toString();
        if (message != null) {
          state = state.copyWith(
            zoneResetWarning: message,
            clearWarning: false,
          );
        }
        break;
        
      case 'AUTO_STOP':
        final reason = data['reason']?.toString() ?? 'Service dihentikan';
        final totalSeconds = (data['totalSeconds'] as num?)?.toInt() ?? 0;
        _accumulatedSeconds = totalSeconds;
        _backgroundServiceStarted = false;
        FlutterForegroundTask.removeTaskDataCallback(_onBackgroundData);
        
        // Jika durasi tidak cukup, kirim auto alpa
        if (!state.isSuccessAttendance && totalSeconds < (state.targetDurationMinutes * 60)) {
          _sendAutoAlpa();
        }
        
        state = state.copyWith(
          zoneResetWarning: reason,
          clearWarning: false,
          isTracking: false,
        );
        break;
        
      case 'ERROR':
        final message = data['message']?.toString();
        if (message != null) {
          state = state.copyWith(error: message);
        }
        break;
    }
  }

  /// Kirim notifikasi ke background service bahwa presensi berhasil
  void notifyAttendanceSuccess() {
    if (_backgroundServiceStarted) {
      FlutterForegroundTask.sendDataToTask({'type': 'ATTENDANCE_SUCCESS'});
    }
  }

  /// Force immediate location & target refresh on demand (Pull-to-refresh / Button / App Resume)
  Future<void> forceLocationUpdate([BuildContext? context]) async {
    if (state.isTracking) {
      // Hard refresh: Hentikan semua service layaknya hot refresh
      stopTracking();
      
      // Bersihkan state agar `startTracking` memanggil `getActiveZone` ulang dari API
      state = state.copyWith(
        activeActivity: null,
        clearActivity: true,
        zoneResetWarning: null,
        clearWarning: true,
      );
      _currentTargetScheduleId = null;
      
      // Beri sedikit jeda agar background service benar-benar berhenti
      await Future.delayed(const Duration(milliseconds: 300));
    }
    
    // Mulai ulang dari awal
    if (context != null && context.mounted) {
      await startTracking(context);
    }
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
      state = state.copyWith(clearWarning: true);
    }

    await fetchTargetLocation();
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
  Future<void> fetchTargetLocation([Map<String, dynamic>? initialData]) async {
    if (_currentTargetScheduleId == null) return;
    try {
      final repo = ref.read(kknRepositoryProvider);
      final locationData = await repo.getTargetLocation(
        _currentTargetScheduleId!,
      );

      // Merge locationData with initialData (schedule details)
      final mergedData = {...?initialData, ...locationData};

      // Ensure address and namaKegiatan are set so UI displays them
      mergedData['address'] ??=
          mergedData['location'] ?? mergedData['kelurahan'] ?? 'Zona Dampingan';
      mergedData['namaKegiatan'] ??= mergedData['title'] ?? 'Penugasan KKN';
      mergedData['radius'] ??= 100;

      int duration = 2;
      if (mergedData['targetDurationMinutes'] != null) {
        duration =
            int.tryParse(mergedData['targetDurationMinutes'].toString()) ?? 2;
      } else if (mergedData['durationMinutes'] != null) {
        duration = int.tryParse(mergedData['durationMinutes'].toString()) ?? 2;
      }

      final status = (mergedData['attendanceStatus'] ?? mergedData['status'] ?? mergedData['kehadiran'] ?? '')
          .toString()
          .toLowerCase();
      final bool isAttended = mergedData['isAttended'] == true || status == 'hadir';

      if (isAttended || status == 'hadir') {
        _accumulatedSeconds = duration * 60;
        state = state.copyWith(
          activeActivity: mergedData,
          targetDurationMinutes: duration,
          isSuccessAttendance: true,
          inZoneDurationSeconds: _accumulatedSeconds,
          isEligibleForAttendance: false,
          zoneResetWarning: 'Anda sudah berhasil melakukan presensi (Hadir) pada jadwal kegiatan ini.',
          clearWarning: false,
          clearError: true,
        );
      } else {
        state = state.copyWith(
          activeActivity: mergedData,
          targetDurationMinutes: duration,
        );
      }
    } catch (e) {
      state = state.copyWith(error: NetworkExceptionHelper.getErrorMessage(e));
    }
  }

  DateTime? _lastTimerDate;
  int _lastSavedSeconds = -1;

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
      if (_lastTimerDate != null &&
          (now.day != _lastTimerDate!.day ||
              now.month != _lastTimerDate!.month ||
              now.year != _lastTimerDate!.year)) {
        _lastTimerDate = now;
        _stopZoneTimer(resetCompletely: true);
        _zoneEntryTime = now;
        return;
      }
      _lastTimerDate = now;

      // Sinkronisasi Real-Time dengan Web: Cek Status & Batas Waktu Dulu
      final target = state.activeActivity;
      bool isWithinWebWindow = true;
      String? timeWindowWarning;

      if (target != null) {
        final startTimeStr =
            target['waktuMulai'] ??
            target['startTime'] ??
            target['waktu_mulai'];
        final endTimeStr =
            target['batasWaktuAbsen'] ??
            target['endTime'] ??
            target['end_time'] ??
            target['batas_waktu_absen'];
        final status =
            (target['attendanceStatus'] ??
                    target['status'] ??
                    target['kehadiran'] ??
                    '')
                .toString()
                .toLowerCase();

        // Jika sudah ada status final (hadir/izin/sakit) atau sukses absen
        if (status == 'izin' ||
            status == 'sakit' ||
            status == 'hadir' ||
            state.isSuccessAttendance) {
          final bool isHadir = status == 'hadir' || state.isSuccessAttendance;
          final int targetSecs = (state.targetDurationMinutes > 0 ? state.targetDurationMinutes : 2) * 60;
          _stopZoneTimer(resetCompletely: !isHadir);
          if (isHadir) _accumulatedSeconds = targetSecs;
          state = state.copyWith(
            inZoneDurationSeconds: isHadir ? targetSecs : 0,
            isEligibleForAttendance: false,
            isSuccessAttendance: isHadir,
            zoneResetWarning: isHadir
                ? 'Anda sudah berhasil melakukan absensi (Hadir) pada jadwal ini.'
                : 'Anda tercatat ${status.toUpperCase()} pada jadwal ini, absensi ditutup.',
            clearWarning: false,
          );
          return; // Stop processing further
        }

        if (startTimeStr != null && startTimeStr.toString().trim().isNotEmpty) {
          final startTime = DateTime.tryParse(startTimeStr.toString());
          if (startTime != null && now.isBefore(startTime)) {
            isWithinWebWindow = false;
            timeWindowWarning =
                'Absensi belum dibuka. Jadwal dimulai pada ${startTime.hour.toString().padLeft(2, '0')}:${startTime.minute.toString().padLeft(2, '0')}';
          }
        }

        if (endTimeStr != null && endTimeStr.toString().trim().isNotEmpty) {
          final endTime = DateTime.tryParse(endTimeStr.toString());
          if (endTime != null && now.isAfter(endTime)) {
            isWithinWebWindow = false;
            timeWindowWarning =
                'Batas waktu absen telah berakhir (Tutup pada ${endTime.hour.toString().padLeft(2, '0')}:${endTime.minute.toString().padLeft(2, '0')})';

            // RESET TIMER KETIKA WAKTU SELESAI
            _stopZoneTimer(resetCompletely: true);
            state = state.copyWith(
              inZoneDurationSeconds: 0,
              isEligibleForAttendance: false,
              zoneResetWarning: timeWindowWarning,
              clearWarning: false,
            );

            // AUTO ALPA KETIKA WAKTU HABIS
            if (!state.isSuccessAttendance &&
                status != 'izin' &&
                status != 'sakit' &&
                status != 'hadir') {
              _sendAutoAlpa();
            }

            return; // Stop processing further
          }
        }
      }

      if (state.isInsideRadius) {
        _zoneEntryTime ??= now;
        final currentSessionSeconds = now.difference(_zoneEntryTime!).inSeconds;
        final totalElapsed = _accumulatedSeconds + currentSessionSeconds;

        // Simpan setiap 5 detik agar persisten jika aplikasi tertutup tiba-tiba
        if (totalElapsed > 0 &&
            totalElapsed % 5 == 0 &&
            _lastSavedSeconds != totalElapsed) {
          _lastSavedSeconds = totalElapsed;
          _savePersistentTimerTempValue(totalElapsed);
        }

        // Syarat Absen MUTLAK: Harus berada di zona sesuai target durasi
        final bool durationMet =
            totalElapsed >= (state.targetDurationMinutes * 60);
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
  void _stopZoneTimer({
    bool isExitingZone = false,
    bool resetCompletely = false,
  }) {
    _zoneDurationTimer?.cancel();
    _zoneDurationTimer = null;

    if (_zoneEntryTime != null) {
      _accumulatedSeconds += DateTime.now()
          .difference(_zoneEntryTime!)
          .inSeconds;
      _zoneEntryTime = null;
    }

    if (resetCompletely) {
      _accumulatedSeconds = 0;
    }

    _savePersistentTimer();

    NotificationEngine().cancelOngoingKKNNotification();
    state = state.copyWith(
      inZoneDurationSeconds: _accumulatedSeconds,
      isEligibleForAttendance: false,
      zoneResetWarning: isExitingZone
          ? 'Anda keluar dari zona KKN. Waktu dihentikan sementara (freeze).'
          : null,
    );
  }

  Future<void> _sendAutoAlpa() async {
    final user = ref.read(authProvider).user;
    if (user == null || _currentTargetScheduleId == null) return;

    final int durationMinutes = (_accumulatedSeconds / 60).ceil();

    try {
      final repo = ref.read(kknRepositoryProvider);
      final response = await repo.recordAttendance(
        scheduleId: _currentTargetScheduleId!,
        latitude: state.currentPosition?.latitude ?? 0.0,
        longitude: state.currentPosition?.longitude ?? 0.0,
        method: 'ALPA_AUTO',
        nim: user.nim,
        namaMahasiswa: user.name,
        durationMinutes: durationMinutes,
      );

      final bool isSuccess = response.containsKey('success')
          ? (response['success'] == true)
          : response.isNotEmpty;

      if (isSuccess) {
        state = state.copyWith(
          isSuccessAttendance: false,
          alpaDurationMinutes: durationMinutes,
          zoneResetWarning:
              'Anda dinyatakan TANPA KETERANGAN. Tercatat $durationMinutes menit dari target ${state.targetDurationMinutes} menit.',
          clearWarning: false,
        );

        LocalNotificationCacheService().addNotification(
          userId: user.id,
          role: user.role.name,
          title: 'Waktu KKN Berakhir ⏱️',
          desc: 'Anda tidak memenuhi waktu minimal. Status: TANPA KETERANGAN.',
          type: 'PRESENSI_KKN_ALPA',
        );
        NotificationEngine().showGenericNotification(
          id: DateTime.now().millisecondsSinceEpoch.remainder(10000),
          title: 'Waktu KKN Berakhir ⏱️',
          body: 'Anda tidak memenuhi waktu minimal. Status: TANPA KETERANGAN.',
          color: const Color(0xFFEF4444),
        );
      }
    } catch (e) {
      debugPrint('Gagal mengirim auto alpa: $e');
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
      _stopZoneTimer(
        isExitingZone: _accumulatedSeconds > 0 || _zoneEntryTime != null,
      );
      return;
    }

    // Anti Fake-GPS (Mock Location) Protection
    if (pos.isMocked) {
      state = state.copyWith(
        error:
            'Terdeteksi penggunaan Fake GPS / Mock Location. Harap matikan aplikasi Fake GPS untuk absensi.',
        isInsideRadius: false,
      );
      _stopZoneTimer(isExitingZone: true);
      return;
    }

    state = state.copyWith(currentPosition: pos, error: null, clearError: true);

    // Send update to backend
    try {
      final repo = ref.read(kknRepositoryProvider);
      final pingResponse = await repo.sendLocationPing(
        pos.latitude,
        pos.longitude,
      );

      // Jika backend me-trigger auto attendance (karena durasi cukup dll)
      if (pingResponse.containsKey('autoAttendanceTriggered') &&
          pingResponse['autoAttendanceTriggered'] != null) {
        final autoAtt = pingResponse['autoAttendanceTriggered'] as List;
        if (autoAtt.isNotEmpty) {
          // Asumsikan data pertama adalah attendance kita
          final attData = autoAtt.first;
          state = state.copyWith(
            isSuccessAttendance: true,
            attendanceTime:
                attData['attendedAt']?.toString() ??
                DateTime.now().toLocal().toString().split('.')[0],
            attendanceId: attData['id']?.toString(),
          );
        }
      }
    } catch (_) {
      // Fail silently for background GPS updates
    }

    // Geofencing checks
    final target = state.activeActivity;

    if (target == null ||
        (target['latitude'] == null && target['lat'] == null)) {
      state = state.copyWith(isInsideRadius: false, distanceToTarget: 999999.0);
      _stopZoneTimer(
        isExitingZone: _accumulatedSeconds > 0 || _zoneEntryTime != null,
      );
      return;
    }

    double targetLat = 0.0;
    double targetLng = 0.0;
    // FIX #2: Naikkan default radius ke 150m untuk toleransi error GPS HP
    // di area pemukiman/dalam gedung (akurasi GPS HP biasanya 20–100m)
    double radius = 150.0;

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

    if (radius <= 0) {
      radius = 500.0;
    }

    // FIX #3: Guard null-island — koordinat (0.0, 0.0) berarti Admin belum
    // mengisi lat/lng kegiatan. Jangan hitung jarak ke Afrika, anggap saja
    // tidak ada target valid hari ini.
    if (targetLat == 0.0 && targetLng == 0.0) {
      state = state.copyWith(
        error:
            'Koordinat lokasi kegiatan belum dikonfigurasi oleh Admin. Hubungi DPL Anda.',
        isInsideRadius: false,
        distanceToTarget: 999999.0,
      );
      _stopZoneTimer(
        isExitingZone: _accumulatedSeconds > 0 || _zoneEntryTime != null,
      );
      return;
    }

    bool nowInside = false;
    double distance;

    // POLYGON CHECK: Jika API menyediakan polygon, gunakan Ray Casting algorithm
    // untuk cek apakah user berada di dalam area polygon tersebut.
    // Ini lebih akurat dan mengatasi kasus di mana titik pusat (lat/lng) salah input
    // oleh Admin tapi polygon sudah benar.
    final polygonRaw = target['polygon'];
    if (polygonRaw != null && polygonRaw is List && polygonRaw.length >= 3) {
      try {
        final polygonPoints = polygonRaw.map((point) {
          final List pts = point as List;
          return (
            lat: (pts[0] as num).toDouble(),
            lng: (pts[1] as num).toDouble(),
          );
        }).toList();

        nowInside = _isPointInPolygon(
          lat: pos.latitude,
          lng: pos.longitude,
          polygon: polygonPoints,
        );

        // Hitung jarak ke centroid polygon untuk ditampilkan di UI
        final centroidLat =
            polygonPoints.map((p) => p.lat).reduce((a, b) => a + b) /
            polygonPoints.length;
        final centroidLng =
            polygonPoints.map((p) => p.lng).reduce((a, b) => a + b) /
            polygonPoints.length;
        distance = Geolocator.distanceBetween(
          pos.latitude,
          pos.longitude,
          centroidLat,
          centroidLng,
        );
      } catch (_) {
        // Fallback ke radius jika parsing polygon gagal
        distance = Geolocator.distanceBetween(
          pos.latitude,
          pos.longitude,
          targetLat,
          targetLng,
        );
        nowInside = distance <= radius;
      }
    } else {
      // RADIUS CHECK: Fallback jika tidak ada polygon
      distance = Geolocator.distanceBetween(
        pos.latitude,
        pos.longitude,
        targetLat,
        targetLng,
      );
      nowInside = distance <= radius;
    }

    state = state.copyWith(
      distanceToTarget: distance,
      isInsideRadius: nowInside,
    );

    if (nowInside) {
      _startZoneTimer();
    } else {
      _stopZoneTimer(
        isExitingZone: _accumulatedSeconds > 0 || _zoneEntryTime != null,
      );
    }
  }

  /// Ray Casting algorithm untuk Point-in-Polygon check.
  /// Mengirimkan sebuah sinar horizontal dari titik (lat, lng) ke arah kanan
  /// dan menghitung berapa kali sinar tersebut memotong tepi polygon.
  /// Jika ganjil → di dalam; jika genap → di luar.
  bool _isPointInPolygon({
    required double lat,
    required double lng,
    required List<({double lat, double lng})> polygon,
  }) {
    bool inside = false;
    final int n = polygon.length;
    int j = n - 1;
    for (int i = 0; i < n; i++) {
      final double xi = polygon[i].lat;
      final double yi = polygon[i].lng;
      final double xj = polygon[j].lat;
      final double yj = polygon[j].lng;

      final bool intersect =
          ((yi > lng) != (yj > lng)) &&
          (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);

      if (intersect) inside = !inside;
      j = i;
    }
    return inside;
  }

  /// Trigger manual or auto attendance with full payload
  Future<bool> recordAttendance({
    required String method,
    required String kodeZona,
    required String rw,
    required String kelurahan,
  }) async {
    _currentTargetScheduleId ??= 'SCH-TODAY';

    final user = ref.read(authProvider).user;
    final nim =
        ref.read(mahasiswaControllerProvider).dashboard?.nim ??
        user?.phone ??
        '';
    final namaMahasiswa = user?.name ?? '-';

    // Gunakan durasi aktual yang tercatat jika ada, minimal 0
    final int durationMinutes = (_accumulatedSeconds / 60).ceil();

    try {
      const LocationSettings locationSettings = LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 10,
      );
      final pos = await Geolocator.getCurrentPosition(
        locationSettings: locationSettings,
      );
      final repo = ref.read(kknRepositoryProvider);
      final response = await repo.recordAttendance(
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
        durationMinutes: durationMinutes > 0 ? durationMinutes : 0,
        timestamp: DateTime.now().toUtc().toIso8601String(),
      );

      final isSuccess = response.containsKey('success')
          ? (response['success'] == true)
          : response.isNotEmpty;

      if (isSuccess) {
        _accumulatedSeconds = 0;
        _zoneEntryTime = DateTime.now();
        state = state.copyWith(
          isSuccessAttendance: true,
          attendanceTime:
              response['attendedAt']?.toString() ??
              DateTime.now().toLocal().toString().split('.')[0],
          attendanceId: response['id']?.toString(),
          isInsideRadius: true,
          inZoneDurationSeconds: 0,
        );

        if (user != null) {
          await FirebaseNotificationService().saveNotification(
            userId: user.id,
            role: user.role.name,
            title: 'Absensi KKN Berhasil 📍',
            desc:
                'Presensi Geofence KKN di $kelurahan ($rw) berhasil tercatat (+10 PTS).',
            type: 'PRESENSI_KKN_SUKSES',
          );
          LocalNotificationCacheService().addNotification(
            userId: user.id,
            role: user.role.name,
            title: 'Absensi KKN Berhasil ✅',
            desc:
                'Presensi Geofence KKN di $kelurahan ($rw) berhasil tercatat (+10 PTS).',
            type: 'PRESENSI_KKN_SUKSES',
          );
          NotificationEngine().showGenericNotification(
            id: DateTime.now().millisecondsSinceEpoch.remainder(10000),
            title: 'Absensi KKN Berhasil ✅',
            body: 'Presensi Geofence KKN di $kelurahan ($rw) berhasil tercatat (+10 PTS).',
          );
        }
        ref.invalidate(mahasiswaNotificationsProvider);
        // Auto-stop background service setelah presensi berhasil
        notifyAttendanceSuccess();
        return true;
      } else {
        final msg = response['message']?.toString() ?? 'Gagal mencatat presensi.';
        state = state.copyWith(error: msg);
        return false;
      }
    } catch (e) {
      final errMsg = e.toString().replaceAll('Exception:', '').trim();
      state = state.copyWith(error: errMsg.isNotEmpty ? errMsg : NetworkExceptionHelper.getErrorMessage(e));
    }
    return false;
  }

  @override
  void dispose() {
    _trackingTimer?.cancel();
    _zoneDurationTimer?.cancel();
    if (_backgroundServiceStarted) {
      FlutterForegroundTask.removeTaskDataCallback(_onBackgroundData);
    }
    super.dispose();
  }
}

final kknLocationProvider =
    StateNotifierProvider<KknLocationNotifier, KknLocationState>((ref) {
      return KknLocationNotifier(ref);
    });
