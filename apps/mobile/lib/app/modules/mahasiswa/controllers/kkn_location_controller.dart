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
import '../../../data/models/mahasiswa_kkn_models.dart';
import 'mahasiswa_controller.dart';
import 'mahasiswa_notifikasi_controller.dart';
import '../../../data/services/notification_engine.dart';
import '../../../core/utils/network_exception_helper.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_foreground_task/flutter_foreground_task.dart';
import '../../../core/values/app_config.dart';
import '../../../core/utils/safe_storage.dart';
import '../services/kkn_background_task_handler.dart';

class KknLocationState {
  final List<KegiatanKknItem> kegiatanList;
  final bool isLoadingKegiatan;
  final KegiatanKknItem? selectedKegiatan;
  final String? activeSessionId;
  final KegiatanKknItem? conflictKegiatan;
  final String? conflictErrorMessage;

  final Position? currentPosition;
  final bool isTracking;
  final String? error;
  final bool isInsideRadius;
  final double distanceToTarget;
  final Map<String, dynamic>? activeActivity;
  final bool isSuccessAttendance;
  final String? attendanceTime;
  final int inZoneDurationSeconds;
  final int outOfZoneSeconds;
  final bool isEligibleForAttendance;
  final String? zoneResetWarning;
  final DateTime? checkInTime;
  final DateTime? checkOutTime;
  final int targetDurationMinutes;
  final String? attendanceId;
  final int? alpaDurationMinutes;
  final bool isAutoStarting;
  final bool outOfZoneViolationRecorded;

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
    this.kegiatanList = const [],
    this.isLoadingKegiatan = false,
    this.selectedKegiatan,
    this.activeSessionId,
    this.conflictKegiatan,
    this.conflictErrorMessage,
    this.currentPosition,
    this.isTracking = false,
    this.error,
    this.isInsideRadius = false,
    this.distanceToTarget = 999999.0,
    this.activeActivity,
    this.isSuccessAttendance = false,
    this.attendanceTime,
    this.inZoneDurationSeconds = 0,
    this.outOfZoneSeconds = 0,
    this.isEligibleForAttendance = false,
    this.zoneResetWarning,
    this.checkInTime,
    this.checkOutTime,
    this.targetDurationMinutes = 60,
    this.attendanceId,
    this.alpaDurationMinutes,
    this.isAutoStarting = false,
    this.outOfZoneViolationRecorded = false,
  });

  KknLocationState copyWith({
    List<KegiatanKknItem>? kegiatanList,
    bool? isLoadingKegiatan,
    KegiatanKknItem? selectedKegiatan,
    String? activeSessionId,
    KegiatanKknItem? conflictKegiatan,
    String? conflictErrorMessage,
    Position? currentPosition,
    bool? isTracking,
    String? error,
    bool? isInsideRadius,
    double? distanceToTarget,
    Map<String, dynamic>? activeActivity,
    bool? isSuccessAttendance,
    String? attendanceTime,
    int? inZoneDurationSeconds,
    int? outOfZoneSeconds,
    bool? isEligibleForAttendance,
    String? zoneResetWarning,
    DateTime? checkInTime,
    DateTime? checkOutTime,
    int? targetDurationMinutes,
    String? attendanceId,
    int? alpaDurationMinutes,
    bool? isAutoStarting,
    bool? outOfZoneViolationRecorded,
    bool clearError = false,
    bool clearActivity = false,
    bool clearWarning = false,
    bool clearSelectedKegiatan = false,
    bool clearConflict = false,
  }) {
    return KknLocationState(
      kegiatanList: kegiatanList ?? this.kegiatanList,
      isLoadingKegiatan: isLoadingKegiatan ?? this.isLoadingKegiatan,
      selectedKegiatan: clearSelectedKegiatan
          ? null
          : (selectedKegiatan ?? this.selectedKegiatan),
      activeSessionId: activeSessionId ?? this.activeSessionId,
      conflictKegiatan: clearConflict ? null : (conflictKegiatan ?? this.conflictKegiatan),
      conflictErrorMessage: clearConflict ? null : (conflictErrorMessage ?? this.conflictErrorMessage),
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
      outOfZoneSeconds: outOfZoneSeconds ?? this.outOfZoneSeconds,
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
      isAutoStarting: isAutoStarting ?? this.isAutoStarting,
      outOfZoneViolationRecorded:
          outOfZoneViolationRecorded ?? this.outOfZoneViolationRecorded,
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
  int _accumulatedSeconds = 0;
  int _outOfZoneSeconds = 0;
  bool _outOfZoneViolationRecorded = false;
  DateTime? _zoneEntryTime;
  bool _backgroundServiceStarted = false;

  static const _prefKeyAccumulated = 'kkn_accumulated_seconds';
  static const _prefKeyDate = 'kkn_accumulated_date';
  static const _prefKeyTarget = 'kkn_accumulated_target';
  static const _prefKeySessionId = 'kkn_active_session_id';

  Future<void> _loadPersistentTimer() async {
    final prefs = await SharedPreferences.getInstance();
    final savedDate = prefs.getString(_prefKeyDate);
    final today = DateTime.now().toLocal().toString().substring(0, 10);

    if (savedDate != today) {
      _accumulatedSeconds = 0;
      await _savePersistentTimer();
    } else {
      _accumulatedSeconds = prefs.getInt(_prefKeyAccumulated) ?? 0;
    }
  }

  Future<void> _savePersistentTimer() async {
    final prefs = await SharedPreferences.getInstance();
    final today = DateTime.now().toLocal().toString().substring(0, 10);
    await prefs.setString(_prefKeyDate, today);
    await prefs.setInt(_prefKeyAccumulated, _accumulatedSeconds);
    if (state.selectedKegiatan != null) {
      await prefs.setString(_prefKeyTarget, state.selectedKegiatan!.id);
    }
    if (state.activeSessionId != null) {
      await prefs.setString(_prefKeySessionId, state.activeSessionId!);
    }
  }

  Future<void> _savePersistentTimerTempValue(int tempSeconds) async {
    final prefs = await SharedPreferences.getInstance();
    final today = DateTime.now().toLocal().toString().substring(0, 10);
    await prefs.setString(_prefKeyDate, today);
    await prefs.setInt(_prefKeyAccumulated, tempSeconds);
    if (state.selectedKegiatan != null) {
      await prefs.setString(_prefKeyTarget, state.selectedKegiatan!.id);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 1. FETCH DAFTAR KEGIATAN AKTIF HARI INI (GET /api/v1/kkn/kegiatan-aktif)
  // ═══════════════════════════════════════════════════════════════════════

  /// Mengambil daftar kegiatan hari ini dari backend dan cek auto-start
  Future<void> fetchKegiatanAktif({bool autoStartIfInZone = true}) async {
    state = state.copyWith(isLoadingKegiatan: true, error: null, clearError: true);
    try {
      final repo = ref.read(kknRepositoryProvider);
      final list = await repo.getKegiatanAktif();

      state = state.copyWith(
        kegiatanList: list,
        isLoadingKegiatan: false,
      );

      // Cek apakah ada kegiatan yang statusnya BERLANGSUNG
      final ongoingKegiatan = list.where((k) => k.isBerlangsung).firstOrNull;
      if (ongoingKegiatan != null && !state.isTracking) {
        // Pulihkan sesi yang sedang berlangsung
        await selectAndStartKegiatan(ongoingKegiatan, isRestoring: true);
        return;
      }

      // Auto-start check jika belum tracking dan diminta
      if (autoStartIfInZone && !state.isTracking) {
        await _checkAndAutoStart(list);
      }
    } catch (e) {
      state = state.copyWith(
        isLoadingKegiatan: false,
        error: NetworkExceptionHelper.getErrorMessage(e),
      );
    }
  }

  /// One-time GPS check untuk auto-start kegiatan aktif saat user berada di dalam zona
  Future<void> _checkAndAutoStart(List<KegiatanKknItem> list) async {
    final activeItems = list.where((k) => k.isAktif && k.isBelumPresensi && !k.isBerlangsung).toList();
    if (activeItems.isEmpty) return;

    try {
      final pos = await LocationService.instance.getCurrentLocation();
      if (pos == null || pos.isMocked) return;

      for (final item in activeItems) {
        bool inside = false;
        final loc = item.lokasi;

        if (loc.polygon != null && loc.polygon!.length >= 3) {
          final pts = loc.polygon!.map((p) => (lat: p[0], lng: p[1])).toList();
          inside = _isPointInPolygon(lat: pos.latitude, lng: pos.longitude, polygon: pts);
        } else {
          final dist = Geolocator.distanceBetween(
            pos.latitude,
            pos.longitude,
            loc.latitude,
            loc.longitude,
          );
          inside = dist <= loc.radiusMeter;
        }

        if (inside) {
          debugPrint('[KKN-Controller] Auto-start matched for activity: ${item.namaKegiatan}');
          state = state.copyWith(isAutoStarting: true);
          await selectAndStartKegiatan(item);
          state = state.copyWith(isAutoStarting: false);
          break;
        }
      }
    } catch (e) {
      debugPrint('[KKN-Controller] Auto-start check failed: $e');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 2. MULAI KEGIATAN KKN (POST /api/v1/kkn/kegiatan/{id}/mulai)
  // ═══════════════════════════════════════════════════════════════════════

  /// Memulai tracking pada suatu kegiatan KKN
  Future<bool> selectAndStartKegiatan(
    KegiatanKknItem kegiatan, {
    bool isRestoring = false,
  }) async {
    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }

    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever ||
        permission == LocationPermission.unableToDetermine) {
      state = state.copyWith(
        error: 'Izin lokasi diperlukan untuk melakukan presensi kegiatan KKN.',
        isTracking: false,
      );
      return false;
    }

    // Ambil posisi awal
    Position? pos = await LocationService.instance.getCurrentLocation();
    pos ??= await Geolocator.getLastKnownPosition();

    if (pos != null && pos.isMocked) {
      state = state.copyWith(
        error: 'Terdeteksi Mock/Fake GPS. Harap matikan aplikasi Fake GPS.',
        isTracking: false,
      );
      return false;
    }

    final lat = pos?.latitude ?? kegiatan.lokasi.latitude;
    final lng = pos?.longitude ?? kegiatan.lokasi.longitude;

    try {
      final repo = ref.read(kknRepositoryProvider);
      MulaiKegiatanResponse? response;

      if (!isRestoring) {
        response = await repo.mulaiKegiatan(
          scheduleId: kegiatan.id,
          latitude: lat,
          longitude: lng,
          deviceInfo: 'Flutter Mobile App',
        );
      }

      await _loadPersistentTimer();

      final activeActivityMap = {
        'id': kegiatan.id,
        'scheduleId': kegiatan.id,
        'namaKegiatan': kegiatan.namaKegiatan,
        'address': kegiatan.lokasi.alamat,
        'latitude': kegiatan.lokasi.latitude,
        'longitude': kegiatan.lokasi.longitude,
        'radius': kegiatan.lokasi.radiusMeter,
        'polygon': kegiatan.lokasi.polygon,
        'targetDurationMinutes': kegiatan.durasiWajibMenit,
        'time': '${kegiatan.jamMulai} - ${kegiatan.jamSelesai}',
        'jamMulai': kegiatan.jamMulai,
        'jamSelesai': kegiatan.jamSelesai,
        'batasWaktuAbsen': '${kegiatan.tanggal}T${kegiatan.jamSelesai}:00',
        'sessionId': response?.sessionId ?? state.activeSessionId ?? 'SES-${kegiatan.id}',
      };

      state = state.copyWith(
        selectedKegiatan: kegiatan,
        activeSessionId: response?.sessionId ?? state.activeSessionId,
        activeActivity: activeActivityMap,
        targetDurationMinutes: kegiatan.durasiWajibMenit,
        isTracking: true,
        isSuccessAttendance: false,
        attendanceTime: null,
        error: null,
        clearError: true,
        clearWarning: true,
        clearConflict: true,
      );

      // Mulai foreground GPS service
      _startBackgroundService();

      // Initial check & Setup loop 10 detik
      await _performLocationUpdate();

      _trackingTimer?.cancel();
      _trackingTimer = Timer.periodic(const Duration(seconds: 10), (timer) async {
        await _performLocationUpdate();
      });

      return true;
    } catch (e) {
      final errMsg = e.toString().replaceAll('Exception: ', '');
      if (errMsg.contains('CONCURRENCY_CONFLICT')) {
        // Tampilkan error konflik kegiatan agar UI bisa memicu switch dialog
        state = state.copyWith(
          conflictKegiatan: kegiatan,
          conflictErrorMessage: errMsg.replaceFirst('CONCURRENCY_CONFLICT: ', ''),
        );
      } else {
        state = state.copyWith(
          error: NetworkExceptionHelper.getErrorMessage(e),
        );
      }
      return false;
    }
  }

  /// Menangani perpindahan kegiatan saat terjadi 409 conflict
  Future<bool> switchKegiatan({
    required KegiatanKknItem oldKegiatan,
    required KegiatanKknItem newKegiatan,
  }) async {
    try {
      final repo = ref.read(kknRepositoryProvider);
      // 1. Selesaikan kegiatan lama dengan alasan PINDAH_KEGIATAN
      await repo.selesaiKegiatan(
        scheduleId: oldKegiatan.id,
        sessionId: state.activeSessionId,
        totalDurasiDalamZonaMenit: _accumulatedSeconds ~/ 60,
        alasan: 'PINDAH_KEGIATAN',
      );

      // 2. Stop service lama
      stopTracking();
      _accumulatedSeconds = 0;
      _outOfZoneSeconds = 0;
      _outOfZoneViolationRecorded = false;

      // 3. Mulai kegiatan baru
      state = state.copyWith(clearConflict: true);
      return await selectAndStartKegiatan(newKegiatan);
    } catch (e) {
      state = state.copyWith(error: NetworkExceptionHelper.getErrorMessage(e));
      return false;
    }
  }

  void clearConflict() {
    state = state.copyWith(clearConflict: true);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 3. BERHENTI TRACKING (POST /api/v1/kkn/kegiatan/{id}/selesai)
  // ═══════════════════════════════════════════════════════════════════════

  /// Berhenti tracking manual
  Future<void> berhentiTracking({String alasan = 'MANUAL_STOP'}) async {
    final cur = state.selectedKegiatan;
    if (cur != null) {
      try {
        final repo = ref.read(kknRepositoryProvider);
        await repo.selesaiKegiatan(
          scheduleId: cur.id,
          sessionId: state.activeSessionId,
          totalDurasiDalamZonaMenit: _accumulatedSeconds ~/ 60,
          alasan: alasan,
        );
      } catch (e) {
        debugPrint('[KKN-Controller] Gagal memanggil selesaiKegiatan: $e');
      }
    }

    stopTracking();
    state = state.copyWith(
      clearSelectedKegiatan: true,
      clearActivity: true,
      inZoneDurationSeconds: 0,
      outOfZoneSeconds: 0,
      isEligibleForAttendance: false,
    );

    // Refresh daftar kegiatan
    await fetchKegiatanAktif(autoStartIfInZone: false);
  }

  /// Stop tracking timers & foreground service
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
  // 4. BACKGROUND FOREGROUND SERVICE INTEGRATION
  // ═══════════════════════════════════════════════════════════════════════

  Future<void> _startBackgroundService() async {
    if (_backgroundServiceStarted) return;
    final target = state.activeActivity;
    if (target == null) return;

    try {
      const storage = SafeStorage();
      final authToken = await storage.read(key: AppConfig.accessTokenKey);
      final apiBaseUrl = AppConfig.apiBaseUrl;

      final result = await startKknForegroundService(
        targetData: target,
        apiBaseUrl: apiBaseUrl,
        authToken: authToken,
      );

      if (result is ServiceRequestSuccess) {
        _backgroundServiceStarted = true;
        debugPrint('[KKN-Controller] Background service started successfully');
        FlutterForegroundTask.addTaskDataCallback(_onBackgroundData);
      }
    } catch (e) {
      debugPrint('[KKN-Controller] Failed to start background service: $e');
    }
  }

  Future<void> _stopBackgroundService() async {
    if (!_backgroundServiceStarted) return;
    try {
      FlutterForegroundTask.sendDataToTask({'type': 'STOP'});
      await stopKknForegroundService();
      FlutterForegroundTask.removeTaskDataCallback(_onBackgroundData);
      _backgroundServiceStarted = false;
      debugPrint('[KKN-Controller] Background service stopped');
    } catch (e) {
      debugPrint('[KKN-Controller] Failed to stop background service: $e');
    }
  }

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

        _accumulatedSeconds = totalSeconds;

        state = state.copyWith(
          inZoneDurationSeconds: totalSeconds,
          outOfZoneSeconds: 0,
          isEligibleForAttendance: isEligible,
          isInsideRadius: isInside,
          distanceToTarget: distance,
          currentPosition: (lat != null && lng != null)
              ? Position(
                  latitude: lat,
                  longitude: lng,
                  timestamp: DateTime.now(),
                  accuracy: 0,
                  altitude: 0,
                  altitudeAccuracy: 0,
                  heading: 0,
                  headingAccuracy: 0,
                  speed: 0,
                  speedAccuracy: 0,
                )
              : null,
        );
        break;

      case 'LOCATION_UPDATE':
        final lat = (data['lat'] as num?)?.toDouble();
        final lng = (data['lng'] as num?)?.toDouble();
        final isInside = data['inside'] == true;
        final distance = (data['distance'] as num?)?.toDouble() ?? 999999.0;
        final outSecs = (data['outOfZoneSeconds'] as num?)?.toInt() ?? _outOfZoneSeconds;

        state = state.copyWith(
          isInsideRadius: isInside,
          distanceToTarget: distance,
          outOfZoneSeconds: outSecs,
          currentPosition: (lat != null && lng != null)
              ? Position(
                  latitude: lat,
                  longitude: lng,
                  timestamp: DateTime.now(),
                  accuracy: 0,
                  altitude: 0,
                  altitudeAccuracy: 0,
                  heading: 0,
                  headingAccuracy: 0,
                  speed: 0,
                  speedAccuracy: 0,
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

      case 'OUT_OF_ZONE_VIOLATION':
        state = state.copyWith(
          outOfZoneViolationRecorded: true,
          zoneResetWarning: '⚠️ Anda keluar zona kegiatan melebihi toleransi (5 menit). Poin KKN Anda dikurangi.',
          clearWarning: false,
        );
        break;

      case 'AUTO_STOP':
        final reason = data['reason']?.toString() ?? 'Kegiatan selesai';
        final totalSeconds = (data['totalSeconds'] as num?)?.toInt() ?? 0;
        _accumulatedSeconds = totalSeconds;
        _backgroundServiceStarted = false;
        FlutterForegroundTask.removeTaskDataCallback(_onBackgroundData);

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

  void notifyAttendanceSuccess() {
    if (_backgroundServiceStarted) {
      FlutterForegroundTask.sendDataToTask({'type': 'ATTENDANCE_SUCCESS'});
    }
  }

  Future<void> forceLocationUpdate() async {
    if (state.isTracking && state.selectedKegiatan != null) {
      await _performLocationUpdate();
    } else {
      await fetchKegiatanAktif(autoStartIfInZone: true);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 5. ZONE TIMER & GEOFENCING LOGIC (FOREGROUND)
  // ═══════════════════════════════════════════════════════════════════════

  DateTime? _lastTimerDate;
  int _lastSavedSeconds = -1;

  void _startZoneTimer() {
    _zoneEntryTime ??= DateTime.now();

    if (_zoneDurationTimer?.isActive ?? false) return;
    _zoneDurationTimer?.cancel();
    _lastTimerDate = DateTime.now();

    NotificationEngine().showOngoingKKNNotification(
      'Anda berada di dalam zona KKN. GPS tracking aktif.',
    );

    _zoneDurationTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) return;
      final now = DateTime.now();

      // Reset harian
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

      // Batas waktu kegiatan
      final target = state.activeActivity;
      if (target != null) {
        final endTimeStr = target['batasWaktuAbsen'] ?? target['endTime'] ?? target['jamSelesai'];
        if (endTimeStr != null && endTimeStr.toString().contains(':')) {
          try {
            final nowLocal = DateTime.now();
            final parts = endTimeStr.toString().split(':');
            final endH = int.tryParse(parts[0].replaceAll(RegExp(r'[^0-9]'), '')) ?? 16;
            final endM = int.tryParse(parts[1].replaceAll(RegExp(r'[^0-9]'), '')) ?? 0;
            final endDateTime = DateTime(nowLocal.year, nowLocal.month, nowLocal.day, endH, endM);

            if (nowLocal.isAfter(endDateTime)) {
              _stopZoneTimer(resetCompletely: false);
              berhentiTracking(alasan: 'AUTO_TIMEOUT');
              return;
            }
          } catch (_) {}
        }
      }

      if (state.isInsideRadius) {
        _zoneEntryTime ??= now;
        final currentSessionSeconds = now.difference(_zoneEntryTime!).inSeconds;
        final totalElapsed = _accumulatedSeconds + currentSessionSeconds;

        if (totalElapsed > 0 && totalElapsed % 5 == 0 && _lastSavedSeconds != totalElapsed) {
          _lastSavedSeconds = totalElapsed;
          _savePersistentTimerTempValue(totalElapsed);
        }

        final bool durationMet = totalElapsed >= (state.targetDurationMinutes * 60);

        state = state.copyWith(
          inZoneDurationSeconds: totalElapsed,
          outOfZoneSeconds: 0,
          isEligibleForAttendance: durationMet,
          clearWarning: true,
        );
      } else {
        _stopZoneTimer(isExitingZone: true);
      }
    });
  }

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

  Future<void> _performLocationUpdate() async {
    final pos = await LocationService.instance.getCurrentLocation();
    if (pos == null) {
      state = state.copyWith(
        error: 'Lokasi tidak diketahui. Harap aktifkan GPS Anda.',
        isInsideRadius: false,
      );
      _stopZoneTimer(isExitingZone: true);
      return;
    }

    if (pos.isMocked) {
      state = state.copyWith(
        error: 'Terdeteksi Mock/Fake GPS. Harap matikan aplikasi Fake GPS.',
        isInsideRadius: false,
      );
      _stopZoneTimer(isExitingZone: true);
      return;
    }

    state = state.copyWith(currentPosition: pos, error: null, clearError: true);

    // Kirim ping lokasi ke backend
    try {
      final repo = ref.read(kknRepositoryProvider);
      await repo.sendLocationPing(pos.latitude, pos.longitude);
    } catch (_) {}

    final target = state.activeActivity;
    if (target == null) {
      state = state.copyWith(isInsideRadius: false, distanceToTarget: 999999.0);
      _stopZoneTimer(isExitingZone: true);
      return;
    }

    final double targetLat = double.tryParse(target['latitude']?.toString() ?? '0') ?? 0.0;
    final double targetLng = double.tryParse(target['longitude']?.toString() ?? '0') ?? 0.0;
    final double radius = double.tryParse(target['radius']?.toString() ?? target['radiusMeter']?.toString() ?? '150') ?? 150.0;

    bool nowInside = false;
    double distance;

    final polygonRaw = target['polygon'];
    if (polygonRaw != null && polygonRaw is List && polygonRaw.length >= 3) {
      try {
        final polygonPoints = polygonRaw.map((point) {
          final List pts = point as List;
          return (lat: (pts[0] as num).toDouble(), lng: (pts[1] as num).toDouble());
        }).toList();

        nowInside = _isPointInPolygon(lat: pos.latitude, lng: pos.longitude, polygon: polygonPoints);

        final centroidLat = polygonPoints.map((p) => p.lat).reduce((a, b) => a + b) / polygonPoints.length;
        final centroidLng = polygonPoints.map((p) => p.lng).reduce((a, b) => a + b) / polygonPoints.length;
        distance = Geolocator.distanceBetween(pos.latitude, pos.longitude, centroidLat, centroidLng);
      } catch (_) {
        distance = Geolocator.distanceBetween(pos.latitude, pos.longitude, targetLat, targetLng);
        nowInside = distance <= radius;
      }
    } else {
      distance = Geolocator.distanceBetween(pos.latitude, pos.longitude, targetLat, targetLng);
      nowInside = distance <= radius;
    }

    state = state.copyWith(
      distanceToTarget: distance,
      isInsideRadius: nowInside,
    );

    if (nowInside) {
      _outOfZoneSeconds = 0;
      _outOfZoneViolationRecorded = false;
      _startZoneTimer();
    } else {
      _outOfZoneSeconds += 10;
      state = state.copyWith(outOfZoneSeconds: _outOfZoneSeconds);

      // Cek toleransi keluar zona di foreground (5 menit = 300s)
      if (_outOfZoneSeconds >= 300 && !_outOfZoneViolationRecorded && state.selectedKegiatan != null) {
        _outOfZoneViolationRecorded = true;
        state = state.copyWith(
          outOfZoneViolationRecorded: true,
          zoneResetWarning: '⚠️ Anda keluar zona melebihi batas toleransi (5 menit). Poin KKN Anda dipotong.',
          clearWarning: false,
        );

        try {
          final repo = ref.read(kknRepositoryProvider);
          await repo.recordOutOfZoneViolation(
            scheduleId: state.selectedKegiatan!.id,
            outOfZoneMinutes: (_outOfZoneSeconds / 60).toDouble(),
          );
        } catch (e) {
          debugPrint('[KKN-Controller] Gagal recordOutOfZoneViolation: $e');
        }
      }

      _stopZoneTimer(isExitingZone: true);
    }
  }

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

  // ═══════════════════════════════════════════════════════════════════════
  // 6. RECORD ATTENDANCE FINAL (POST /kegiatan/{id}/absen)
  // ═══════════════════════════════════════════════════════════════════════

  Future<bool> recordAttendance({
    required String method,
    required String kodeZona,
    required String rw,
    required String kelurahan,
  }) async {
    final cur = state.selectedKegiatan;
    final scheduleId = cur?.id ?? state.activeActivity?['id']?.toString() ?? 'SCH-TODAY';

    final user = ref.read(authProvider).user;
    final nim = ref.read(mahasiswaControllerProvider).dashboard?.nim ?? user?.phone ?? '';
    final namaMahasiswa = user?.name ?? '-';
    final int durationMinutes = (_accumulatedSeconds / 60).ceil();

    try {
      const LocationSettings locationSettings = LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 10,
      );
      final pos = await Geolocator.getCurrentPosition(locationSettings: locationSettings);
      final repo = ref.read(kknRepositoryProvider);

      final response = await repo.recordAttendance(
        scheduleId: scheduleId,
        latitude: pos.latitude,
        longitude: pos.longitude,
        method: method,
        nim: nim,
        namaMahasiswa: namaMahasiswa,
        kodeZona: kodeZona,
        rw: rw,
        kecamatan: user?.kecamatan,
        kelurahan: kelurahan,
        durationMinutes: durationMinutes > 0 ? durationMinutes : state.targetDurationMinutes,
        timestamp: DateTime.now().toUtc().toIso8601String(),
      );

      final isSuccess = response.containsKey('success')
          ? (response['success'] == true)
          : response.isNotEmpty;

      if (isSuccess) {
        // Akhiri kegiatan di backend
        try {
          await repo.selesaiKegiatan(
            scheduleId: scheduleId,
            sessionId: state.activeSessionId,
            totalDurasiDalamZonaMenit: durationMinutes,
            alasan: 'SELESAI',
          );
        } catch (_) {}

        notifyAttendanceSuccess();
        stopTracking();

        _accumulatedSeconds = 0;
        _outOfZoneSeconds = 0;

        state = state.copyWith(
          isSuccessAttendance: true,
          attendanceTime: response['attendedAt']?.toString() ?? DateTime.now().toLocal().toString().split('.')[0],
          attendanceId: response['id']?.toString(),
          inZoneDurationSeconds: 0,
        );

        if (user != null) {
          await FirebaseNotificationService().saveNotification(
            userId: user.id,
            role: user.role.name,
            title: 'Presensi KKN Berhasil ✅',
            desc: 'Presensi kegiatan ${cur?.namaKegiatan ?? "KKN"} berhasil tercatat.',
            type: 'PRESENSI_KKN_SUKSES',
          );
          LocalNotificationCacheService().addNotification(
            userId: user.id,
            role: user.role.name,
            title: 'Presensi KKN Berhasil ✅',
            desc: 'Presensi kegiatan ${cur?.namaKegiatan ?? "KKN"} berhasil tercatat.',
            type: 'PRESENSI_KKN_SUKSES',
          );
        }

        ref.invalidate(mahasiswaNotificationsProvider);
        await fetchKegiatanAktif(autoStartIfInZone: false);
        return true;
      }
    } catch (e) {
      state = state.copyWith(error: NetworkExceptionHelper.getErrorMessage(e));
    }
    return false;
  }

  void resetSuccessState() {
    state = state.copyWith(
      isSuccessAttendance: false,
      attendanceTime: null,
      clearSelectedKegiatan: true,
      clearActivity: true,
      clearWarning: true,
    );
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
