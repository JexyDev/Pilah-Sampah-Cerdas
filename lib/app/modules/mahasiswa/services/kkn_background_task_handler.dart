import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_foreground_task/flutter_foreground_task.dart';
import 'package:geolocator/geolocator.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../data/models/group_zone_models.dart';
import '../../../core/utils/geofence_zone_engine.dart';

/// ═══════════════════════════════════════════════════════════════════════════
/// KKN Background GPS Task Handler
/// ═══════════════════════════════════════════════════════════════════════════
///
/// Menjalankan GPS tracking di Android Foreground Service / iOS background mode.
/// Service ini TIDAK akan di-kill oleh OS saat layar mati atau user pindah app.
///
/// Fitur:
/// - Polling GPS setiap 30 detik (hemat baterai)
/// - Kalkulasi geofence (radius & polygon)
/// - Akumulasi durasi zona
/// - Ping lokasi ke backend via HTTP
/// - Auto-stop: setelah presensi berhasil / tanpa keterangan / maks 4 jam
/// - Sinkronisasi state ke UI via SendPort
/// - Update notifikasi persisten real-time
/// ═══════════════════════════════════════════════════════════════════════════

/// Keys untuk SharedPreferences — shared dengan KknLocationController
class KknBgPrefKeys {
  static const accumulatedSeconds = 'kkn_accumulated_seconds';
  static const accumulatedDate = 'kkn_accumulated_date';
  static const accumulatedTarget = 'kkn_accumulated_target';
  static const zoneEntryTime = 'kkn_zone_entry_time';

  // Data target lokasi (dikirim dari UI saat start)
  static const targetLat = 'kkn_bg_target_lat';
  static const targetLng = 'kkn_bg_target_lng';
  static const targetRadius = 'kkn_bg_target_radius';
  static const targetDuration = 'kkn_bg_target_duration';
  static const validZones = 'kkn_bg_valid_zones';
  static const targetEndTime = 'kkn_bg_target_end_time';
  static const geofenceBufferMeters = 'kkn_bg_geofence_buffer';
  static const invalidationHours = 'kkn_bg_invalidation_hours';
  static const scheduleId = 'kkn_bg_schedule_id';
  static const serviceActive = 'kkn_bg_service_active';
  static const serviceStartTime = 'kkn_bg_service_start_time';

  // API config
  static const apiBaseUrl = 'kkn_bg_api_base_url';
  static const authToken = 'kkn_bg_auth_token';
  static const userId = 'kkn_bg_user_id';
}

/// Message types untuk komunikasi Background → UI
class KknBgMessageType {
  static const locationUpdate = 'LOCATION_UPDATE';
  static const durationUpdate = 'DURATION_UPDATE';
  static const geofenceStatus = 'GEOFENCE_STATUS';
  static const autoStop = 'AUTO_STOP';
  static const outOfZoneViolation = 'OUT_OF_ZONE_VIOLATION';
  static const error = 'ERROR';
  static const smartZoneUpdate = 'SMART_ZONE_UPDATE';
}

/// Message types untuk komunikasi UI → Background
class KknUiMessageType {
  static const stop = 'STOP';
  static const updateTarget = 'UPDATE_TARGET';
  static const attendanceSuccess = 'ATTENDANCE_SUCCESS';
}

@pragma('vm:entry-point')
void startCallback() {
  FlutterForegroundTask.setTaskHandler(KknBackgroundTaskHandler());
}

class KknBackgroundTaskHandler extends TaskHandler {
  // State tracking
  int _accumulatedSeconds = 0;
  DateTime? _zoneEntryTime;
  bool _isInsideRadius = false;
  bool _isStopped = false;
  DateTime? _serviceStartTime;

  // Target location data
  double _targetLat = 0.0;
  double _targetLng = 0.0;
  double _radius = 150.0;
  double _geofenceBufferMeters = 15.0;
  double _invalidationHours = 2.0;
  int _targetDurationMinutes = 2;
  List<ValidZoneItem>? _validZones;
  DateTime? _targetEndTime;
  String? _scheduleId; // ignore: unused_field

  // API config
  String? _apiBaseUrl;
  String? _authToken;

  // Last known position (to skip duplicate pings)
  double _lastPingLat = 0.0; // ignore: unused_field
  double _lastPingLng = 0.0; // ignore: unused_field

  // Max service duration: 4 jam
  static const int _maxServiceDurationHours = 4;

  // Ignore counter for now, used for future notification throttling
  int _notifUpdateCounter = 0; // ignore: unused_field

  // Out-of-zone violation tracking
  int _outOfZoneSeconds = 0;
  bool _outOfZoneViolationSent = false;

  @override
  Future<void> onStart(DateTime timestamp, TaskStarter starter) async {
    debugPrint('[KKN-BG] Service started at $timestamp by $starter');

    _serviceStartTime = DateTime.now();

    // Load semua data dari SharedPreferences
    final prefs = await SharedPreferences.getInstance();

    // Load accumulated seconds (persisten harian dengan isolasi per akun)
    final userId = prefs.getString(KknBgPrefKeys.userId);
    final userKeyAccum = (userId != null && userId.isNotEmpty)
        ? '${KknBgPrefKeys.accumulatedSeconds}_$userId'
        : KknBgPrefKeys.accumulatedSeconds;
    final userKeyDate = (userId != null && userId.isNotEmpty)
        ? '${KknBgPrefKeys.accumulatedDate}_$userId'
        : KknBgPrefKeys.accumulatedDate;
    final userKeyEntry = (userId != null && userId.isNotEmpty)
        ? '${KknBgPrefKeys.zoneEntryTime}_$userId'
        : KknBgPrefKeys.zoneEntryTime;

    final savedDate =
        prefs.getString(userKeyDate) ??
        prefs.getString(KknBgPrefKeys.accumulatedDate);
    final today = DateTime.now().toLocal().toString().substring(0, 10);
    if (savedDate == today) {
      _accumulatedSeconds =
          prefs.getInt(userKeyAccum) ??
          prefs.getInt(KknBgPrefKeys.accumulatedSeconds) ??
          0;
      final savedEntry =
          prefs.getString(userKeyEntry) ??
          prefs.getString(KknBgPrefKeys.zoneEntryTime);
      if (savedEntry != null && savedEntry.isNotEmpty) {
        _zoneEntryTime = DateTime.tryParse(savedEntry);
      }
    } else {
      _accumulatedSeconds = 0;
      _zoneEntryTime = null;
    }

    // Load target location
    _targetLat = prefs.getDouble(KknBgPrefKeys.targetLat) ?? 0.0;
    _targetLng = prefs.getDouble(KknBgPrefKeys.targetLng) ?? 0.0;
    _radius = prefs.getDouble(KknBgPrefKeys.targetRadius) ?? 150.0;
    _geofenceBufferMeters =
        prefs.getDouble(KknBgPrefKeys.geofenceBufferMeters) ?? 15.0;
    _invalidationHours =
        prefs.getDouble(KknBgPrefKeys.invalidationHours) ?? 2.0;
    _targetDurationMinutes = prefs.getInt(KknBgPrefKeys.targetDuration) ?? 2;
    _scheduleId = prefs.getString(KknBgPrefKeys.scheduleId);

    // Load valid zones jika ada (Multi-Zone)
    final validZonesJson = prefs.getString(KknBgPrefKeys.validZones);
    if (validZonesJson != null && validZonesJson.isNotEmpty) {
      try {
        final decoded = jsonDecode(validZonesJson) as List;
        _validZones = decoded.map((e) => ValidZoneItem.fromJson(Map<String, dynamic>.from(e))).toList();
      } catch (e) {
        debugPrint('[KKN-BG] Gagal parsing validZones: $e');
        _validZones = null;
      }
    } else {
      _validZones = null;
    }

    // Load target end time
    final endTimeStr = prefs.getString(KknBgPrefKeys.targetEndTime);
    if (endTimeStr != null && endTimeStr.isNotEmpty) {
      _targetEndTime = DateTime.tryParse(endTimeStr);
    }

    // Load API config
    _apiBaseUrl = prefs.getString(KknBgPrefKeys.apiBaseUrl);
    _authToken = prefs.getString(KknBgPrefKeys.authToken);

    // Load service start time
    final startStr = prefs.getString(KknBgPrefKeys.serviceStartTime);
    if (startStr != null) {
      _serviceStartTime = DateTime.tryParse(startStr) ?? DateTime.now();
    }

    // Mark service as active
    await prefs.setBool(KknBgPrefKeys.serviceActive, true);
    await prefs.setString(
      KknBgPrefKeys.serviceStartTime,
      _serviceStartTime!.toIso8601String(),
    );

    debugPrint(
      '[KKN-BG] Loaded target: ($_targetLat, $_targetLng) radius=$_radius duration=$_targetDurationMinutes min',
    );
    debugPrint('[KKN-BG] Accumulated: $_accumulatedSeconds seconds');
  }

  @override
  void onRepeatEvent(DateTime timestamp) async {
    if (_isStopped) return;

    // CHECK 0: Cek apakah user sudah logout atau service deactivated
    final prefs = await SharedPreferences.getInstance();
    await prefs.reload();
    final isActive = prefs.getBool(KknBgPrefKeys.serviceActive) ?? false;
    final authToken = prefs.getString(KknBgPrefKeys.authToken);
    if (!isActive || authToken == null || authToken.isEmpty) {
      debugPrint(
        '[KKN-BG] Pengguna telah logout. Menghentikan background service.',
      );
      await _autoStop('Pengguna telah keluar (logout). Tracking dihentikan.');
      return;
    }

    // [BUGFIX] Sync API configuration from SharedPreferences after reload
    _authToken = authToken;
    _apiBaseUrl = prefs.getString(KknBgPrefKeys.apiBaseUrl) ?? _apiBaseUrl;
    _scheduleId = prefs.getString(KknBgPrefKeys.scheduleId) ?? _scheduleId;

    // [BUGFIX] Sync target location as well
    _targetLat = prefs.getDouble(KknBgPrefKeys.targetLat) ?? _targetLat;
    _targetLng = prefs.getDouble(KknBgPrefKeys.targetLng) ?? _targetLng;
    _radius = prefs.getDouble(KknBgPrefKeys.targetRadius) ?? _radius;
    _geofenceBufferMeters =
        prefs.getDouble(KknBgPrefKeys.geofenceBufferMeters) ??
        _geofenceBufferMeters;
    _invalidationHours =
        prefs.getDouble(KknBgPrefKeys.invalidationHours) ?? _invalidationHours;
    _targetDurationMinutes =
        prefs.getInt(KknBgPrefKeys.targetDuration) ?? _targetDurationMinutes;

    // ═════════════════════════════════════════════════════════
    // CHECK 1: Batas waktu maksimal service (4 jam)
    // ═════════════════════════════════════════════════════════
    if (_serviceStartTime != null) {
      final elapsed = DateTime.now().difference(_serviceStartTime!);
      if (elapsed.inHours >= _maxServiceDurationHours) {
        debugPrint(
          '[KKN-BG] Max duration reached (${_maxServiceDurationHours}h). Auto-stopping.',
        );
        await _autoStop(
          'Batas waktu tracking $_maxServiceDurationHours jam tercapai.',
        );
        return;
      }
    }

    // ═════════════════════════════════════════════════════════
    // CHECK 2: Jadwal KKN sudah berakhir
    // ═════════════════════════════════════════════════════════
    if (_targetEndTime != null && DateTime.now().isAfter(_targetEndTime!)) {
      debugPrint('[KKN-BG] Schedule ended. Auto-stopping.');
      await _autoStop('Jadwal kegiatan KKN telah berakhir.');
      return;
    }

    // ═════════════════════════════════════════════════════════
    // STEP 1: Ambil lokasi GPS
    // ═════════════════════════════════════════════════════════
    Position? pos;
    try {
      pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          distanceFilter: 0,
        ),
      ).timeout(const Duration(seconds: 15));
    } catch (_) {
      try {
        pos = await Geolocator.getLastKnownPosition();
      } catch (_) {}
    }

    if (pos == null) {
      _sendToUI({
        'type': KknBgMessageType.error,
        'message': 'Lokasi tidak diketahui',
      });
      return;
    }

    // Anti Fake GPS
    if (pos.isMocked) {
      _sendToUI({
        'type': KknBgMessageType.error,
        'message': 'Terdeteksi Fake GPS. Matikan aplikasi Fake GPS.',
      });
      return;
    }

    // ═════════════════════════════════════════════════════════
    // STEP 2: Geofence check
    // ═════════════════════════════════════════════════════════
    bool nowInside = false;
    double distance = 999999.0;

    if (_targetLat == 0.0 && _targetLng == 0.0 && _validZones == null) {
      _sendToUI({
        'type': KknBgMessageType.locationUpdate,
        'lat': pos.latitude,
        'lng': pos.longitude,
        'inside': false,
        'distance': distance,
      });
      return;
    }

    final effectiveRadius = _radius + _geofenceBufferMeters;
    final distToTarget = Geolocator.distanceBetween(
      pos.latitude,
      pos.longitude,
      _targetLat,
      _targetLng,
    );

    // Multi-Geofence check (Prioritas Utama)
    if (_validZones != null && _validZones!.isNotEmpty) {
      final multiEval = GeofenceZoneEngine.evaluateMultiZonePosition(
        userLat: pos.latitude,
        userLng: pos.longitude,
        validZones: _validZones!,
        fallbackLat: _targetLat,
        fallbackLng: _targetLng,
        fallbackRadiusMeters: _radius,
        bufferMeters: _geofenceBufferMeters,
      );
      distance = multiEval.distanceToTargetMeters;
      nowInside = multiEval.isInside;
    } else {
      // Radius check
      distance = distToTarget;
      nowInside = distance <= effectiveRadius;
    }

    // Filter GPS Drift
    if (!nowInside && _isInsideRadius && pos.accuracy > 60.0) {
      if (distToTarget <= effectiveRadius + pos.accuracy) {
        nowInside = true;
      }
    }

    // ═════════════════════════════════════════════════════════
    // STEP 3: Update durasi zona
    // ═════════════════════════════════════════════════════════
    final now = DateTime.now();

    if (nowInside) {
      if (_zoneEntryTime == null) {
        _zoneEntryTime = now;
        await _saveDuration(_accumulatedSeconds, entryTime: _zoneEntryTime);
      }
      final sessionSeconds = now.difference(_zoneEntryTime!).inSeconds;
      final totalSeconds = _accumulatedSeconds + sessionSeconds;

      _sendToUI({
        'type': KknBgMessageType.durationUpdate,
        'totalSeconds': totalSeconds,
        'targetSeconds': _targetDurationMinutes * 60,
        'isEligible': totalSeconds >= (_targetDurationMinutes * 60),
        'inside': true,
        'distance': distance,
        'lat': pos.latitude,
        'lng': pos.longitude,
      });

      _notifUpdateCounter++;
      final mins = totalSeconds ~/ 60;
      final secs = totalSeconds % 60;
      final targetMins = _targetDurationMinutes;
      final timeStr = '$mins:${secs.toString().padLeft(2, '0')}';
      FlutterForegroundTask.updateService(
        notificationTitle: '⏱ Presensi KKN Aktif',
        notificationText: 'Di dalam zona • $timeStr / $targetMins menit',
      );

      if (!_isInsideRadius) {
        _isInsideRadius = true;
        _sendToUI({
          'type': KknBgMessageType.geofenceStatus,
          'status': 'ENTERED',
          'message': 'Anda memasuki zona KKN',
        });
      }
      _outOfZoneSeconds = 0;
      _outOfZoneViolationSent = false;
    } else {
      if (_zoneEntryTime != null) {
        _accumulatedSeconds += now.difference(_zoneEntryTime!).inSeconds;
        _zoneEntryTime = null;
        await _saveDuration(_accumulatedSeconds, entryTime: null);
      }

      if (_isInsideRadius) {
        _isInsideRadius = false;
        _sendToUI({
          'type': KknBgMessageType.geofenceStatus,
          'status': 'EXITED',
          'message': 'Anda keluar dari zona KKN. Waktu dihentikan sementara.',
        });
      }

      _outOfZoneSeconds += 30;
      final outMinutes = _outOfZoneSeconds / 60;
      final maxOutMinutes = _invalidationHours * 60;

      if (outMinutes >= (maxOutMinutes * 0.8) && !_outOfZoneViolationSent) {
        _outOfZoneViolationSent = true;
        _sendToUI({
          'type': KknBgMessageType.outOfZoneViolation,
          'outOfZoneSeconds': _outOfZoneSeconds,
          'message':
              'Anda di luar area kegiatan selama ${outMinutes.round()} menit. Kembali ke zona sebelum kehadiran digagalkan.',
        });

        FlutterForegroundTask.updateService(
          notificationTitle: 'Peringatan Zona Kegiatan ⚠️',
          notificationText:
              'Anda di luar area selama ${outMinutes.round()} menit. Segera kembali ke zona.',
        );
      }

      _sendToUI({
        'type': KknBgMessageType.locationUpdate,
        'lat': pos.latitude,
        'lng': pos.longitude,
        'inside': false,
        'distance': distance,
        'totalSeconds': _accumulatedSeconds,
        'isEligible': _accumulatedSeconds >= (_targetDurationMinutes * 60),
      });

      FlutterForegroundTask.updateService(
        notificationTitle: '⏸ Waktu Dihentikan — Di Luar Zona',
        notificationText:
            'Kembali ke zona untuk melanjutkan • ${_accumulatedSeconds ~/ 60}:${(_accumulatedSeconds % 60).toString().padLeft(2, '0')} / $_targetDurationMinutes menit',
      );
    }

    // ═════════════════════════════════════════════════════════
    // STEP 4: Ping lokasi ke backend
    // ═════════════════════════════════════════════════════════
    if (_apiBaseUrl != null && _authToken != null && _authToken!.isNotEmpty) {
      _lastPingLat = pos.latitude;
      _lastPingLng = pos.longitude;
      final currentTotalSeconds = nowInside && _zoneEntryTime != null
          ? _accumulatedSeconds + now.difference(_zoneEntryTime!).inSeconds
          : _accumulatedSeconds;
      _pingBackend(
        pos.latitude,
        pos.longitude,
        accumulatedSeconds: currentTotalSeconds,
      );
    }
  }

  @override
  void onReceiveData(Object data) {
    if (data is Map) {
      final type = data['type']?.toString();

      switch (type) {
        case 'STOP':
          _handleStop();
          break;
        case 'ATTENDANCE_SUCCESS':
          _handleAttendanceSuccess();
          break;
        case 'UPDATE_TARGET':
          _handleUpdateTarget(data);
          break;
        case 'SYNC_DURATION':
          final seconds = (data['seconds'] as num?)?.toInt() ?? 0;
          if (_isInsideRadius && _zoneEntryTime != null) {
            final delta = DateTime.now().difference(_zoneEntryTime!).inSeconds;
            if (delta > 0) {
              _accumulatedSeconds += delta;
            }
            _zoneEntryTime = DateTime.now();
          }
          _accumulatedSeconds = math.max(
            _accumulatedSeconds,
            math.max(0, seconds),
          );
          _saveDuration(_accumulatedSeconds, entryTime: _zoneEntryTime);
          break;
      }
    }
  }

  @override
  Future<void> onDestroy(DateTime timestamp) async {
    debugPrint('[KKN-BG] Service destroyed at $timestamp');

    if (_zoneEntryTime != null) {
      _accumulatedSeconds += DateTime.now()
          .difference(_zoneEntryTime!)
          .inSeconds;
      _zoneEntryTime = null;
    }
    await _saveDuration(_accumulatedSeconds);

    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(KknBgPrefKeys.serviceActive, false);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ═══════════════════════════════════════════════════════════════════════

  void _sendToUI(Map<String, dynamic> data) {
    FlutterForegroundTask.sendDataToMain(data);
  }

  Future<void> _saveDuration(int accumSeconds, {DateTime? entryTime}) async {
    final prefs = await SharedPreferences.getInstance();
    final today = DateTime.now().toLocal().toString().substring(0, 10);
    final targetKey =
        (_scheduleId != null &&
            _scheduleId!.isNotEmpty &&
            _scheduleId != 'SCH-TODAY')
        ? '_$_scheduleId'
        : '';
    final userId = prefs.getString(KknBgPrefKeys.userId);
    final userKeyAccum = (userId != null && userId.isNotEmpty)
        ? '${KknBgPrefKeys.accumulatedSeconds}_$userId'
        : null;
    final userKeyDate = (userId != null && userId.isNotEmpty)
        ? '${KknBgPrefKeys.accumulatedDate}_$userId'
        : null;
    final userKeyEntry = (userId != null && userId.isNotEmpty)
        ? '${KknBgPrefKeys.zoneEntryTime}_$userId'
        : null;

    await prefs.setString(KknBgPrefKeys.accumulatedDate, today);
    await prefs.setInt(KknBgPrefKeys.accumulatedSeconds, accumSeconds);
    if (entryTime != null) {
      await prefs.setString(
        KknBgPrefKeys.zoneEntryTime,
        entryTime.toIso8601String(),
      );
    } else {
      await prefs.remove(KknBgPrefKeys.zoneEntryTime);
    }

    if (userKeyDate != null && userKeyAccum != null) {
      await prefs.setString(userKeyDate, today);
      await prefs.setInt(userKeyAccum, accumSeconds);
      if (entryTime != null && userKeyEntry != null) {
        await prefs.setString(userKeyEntry, entryTime.toIso8601String());
      } else if (userKeyEntry != null) {
        await prefs.remove(userKeyEntry);
      }
    }

    await prefs.setString('${KknBgPrefKeys.accumulatedDate}$targetKey', today);
    await prefs.setInt(
      '${KknBgPrefKeys.accumulatedSeconds}$targetKey',
      accumSeconds,
    );
    if (entryTime != null) {
      await prefs.setString(
        '${KknBgPrefKeys.zoneEntryTime}$targetKey',
        entryTime.toIso8601String(),
      );
    } else {
      await prefs.remove('${KknBgPrefKeys.zoneEntryTime}$targetKey');
    }
  }

  Future<void> _autoStop(String reason) async {
    _isStopped = true;

    if (_zoneEntryTime != null) {
      _accumulatedSeconds += DateTime.now()
          .difference(_zoneEntryTime!)
          .inSeconds;
      _zoneEntryTime = null;
    }
    await _saveDuration(_accumulatedSeconds);

    _sendToUI({
      'type': KknBgMessageType.autoStop,
      'reason': reason,
      'totalSeconds': _accumulatedSeconds,
    });

    FlutterForegroundTask.updateService(
      notificationTitle: 'Pemantauan GPS Selesai ✅',
      notificationText: reason,
    );

    await FlutterForegroundTask.stopService();
  }

  void _handleStop() async {
    debugPrint('[KKN-BG] Stop requested from UI');
    await _autoStop('Tracking dihentikan oleh pengguna.');
  }

  void _handleAttendanceSuccess() async {
    debugPrint('[KKN-BG] Attendance success — stopping service');
    await _autoStop('Presensi berhasil tercatat.');
  }

  void _handleUpdateTarget(Map data) {
    _targetLat = (data['lat'] as num?)?.toDouble() ?? _targetLat;
    _targetLng = (data['lng'] as num?)?.toDouble() ?? _targetLng;
    _radius = (data['radius'] as num?)?.toDouble() ?? _radius;
    _targetDurationMinutes =
        (data['duration'] as int?) ?? _targetDurationMinutes;

    if (data['endTime'] != null) {
      _targetEndTime = DateTime.tryParse(data['endTime'].toString());
    }
    if (data['validZones'] != null) {
      try {
        _validZones = (data['validZones'] as List).map((e) => ValidZoneItem.fromJson(Map<String, dynamic>.from(e))).toList();
      } catch (_) {}
    }

    debugPrint(
      '[KKN-BG] Target updated: ($_targetLat, $_targetLng) radius=$_radius',
    );
  }

  Future<void> _pingBackend(
    double lat,
    double lng, {
    int? accumulatedSeconds,
  }) async {
    if (_apiBaseUrl == null ||
        _authToken == null ||
        _apiBaseUrl!.isEmpty ||
        _authToken!.isEmpty) {
      return;
    }

    try {
      final client = HttpClient();
      client.connectionTimeout = const Duration(seconds: 10);

      final cleanBaseUrl = _apiBaseUrl!.endsWith('/')
          ? _apiBaseUrl!.substring(0, _apiBaseUrl!.length - 1)
          : _apiBaseUrl!;
      final url = Uri.parse('$cleanBaseUrl/kkn-attendance/location-ping');
      final request = await client.postUrl(url);

      request.headers.set('content-type', 'application/json');
      request.headers.set('authorization', 'Bearer $_authToken');
      request.headers.set('bypass-tunnel-reminder', 'true');

      final payload = jsonEncode({
        'latitude': lat,
        'longitude': lng,
        'scheduleId': _scheduleId,
        'timestamp': DateTime.now().toIso8601String(),
        if (accumulatedSeconds != null) 'inZoneSeconds': accumulatedSeconds,
      });

      request.write(payload);
      final response = await request.close();

      if (response.statusCode == 200) {
        final responseBody = await response.transform(utf8.decoder).join();
        try {
          final jsonResponse = jsonDecode(responseBody);
          final data = jsonResponse['data'] as Map<String, dynamic>?;

          final activeScheduleId = data?['activeScheduleId'];

          if (activeScheduleId == null && _scheduleId != null) {
            final status =
                (data?['attendanceStatus']?.toString() ??
                        data?['statusKehadiran']?.toString() ??
                        '')
                    .toLowerCase();
            const finalStatuses = {
              'hadir',
              'hadir_memenuhi',
              'hadir_tidak_memenuhi',
              'alpa',
              'tanpa_keterangan',
              'selesai',
              'selesai_telat',
              'lepas_radius',
              'izin',
              'sakit',
            };
            if (status.isNotEmpty && finalStatuses.contains(status)) {
              debugPrint(
                '[KKN-BG] Jadwal selesai di backend (status: $status). Menghentikan GPS.',
              );
              _autoStop('Waktu kegiatan telah habis (status: $status).');
            } else if (status.isEmpty) {
              debugPrint(
                '[KKN-BG] activeScheduleId null tapi status kosong — skip auto-stop, tunggu ping berikutnya.',
              );
            }
            // Jika status BERLANGSUNG/TERJEDA tapi activeScheduleId null → inkonsistensi data backend
            // → jangan stop, biarkan tracking lanjut
          }

          // Smart Zone Handling
          final smartZone = data?['smartZone'];
          if (smartZone != null) {
            _sendToUI({
              'type': KknBgMessageType.smartZoneUpdate,
              'smartZone': smartZone,
            });
          }
        } catch (_) {}
      } else {
        await response.drain();
      }

      client.close();
      debugPrint('[KKN-BG] Ping sent successfully to $url ($lat, $lng)');
    } catch (e) {
      debugPrint('[KKN-BG] Ping failed: $e');
    }
  }

}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Inisialisasi FlutterForegroundTask
// ═══════════════════════════════════════════════════════════════════════════

/// Inisialisasi konfigurasi Foreground Task.
/// Dipanggil sekali di main.dart atau sebelum startService.
void initKknForegroundTask() {
  FlutterForegroundTask.init(
    androidNotificationOptions: AndroidNotificationOptions(
      channelId: 'kkn_location_channel',
      channelName: 'Pantauan Lokasi KKN',
      channelDescription:
          'Notifikasi persisten saat pemantauan lokasi KKN aktif',
      channelImportance: NotificationChannelImportance.DEFAULT,
      priority: NotificationPriority.HIGH,
    ),
    iosNotificationOptions: const IOSNotificationOptions(
      showNotification: true,
      playSound: false,
    ),
    foregroundTaskOptions: ForegroundTaskOptions(
      eventAction: ForegroundTaskEventAction.repeat(30000), // 30 detik
      autoRunOnBoot: false,
      autoRunOnMyPackageReplaced: false,
      allowWakeLock: true,
      allowWifiLock: true,
    ),
  );
}

/// Mulai foreground service untuk GPS tracking KKN.
/// [targetData] berisi informasi lokasi target dari backend.
Future<ServiceRequestResult> startKknForegroundService({
  required Map<String, dynamic> targetData,
  required String? apiBaseUrl,
  required String? authToken,
  String? userId,
  int? initialAccumulatedSeconds,
  DateTime? zoneEntryTime,
}) async {
  // Simpan data target ke SharedPreferences agar bisa diakses di background isolate
  final prefs = await SharedPreferences.getInstance();
  final today = DateTime.now().toLocal().toString().substring(0, 10);

  if (userId != null && userId.isNotEmpty) {
    await prefs.setString(KknBgPrefKeys.userId, userId);
  }

  if (initialAccumulatedSeconds != null) {
    await prefs.setString(KknBgPrefKeys.accumulatedDate, today);
    await prefs.setInt(
      KknBgPrefKeys.accumulatedSeconds,
      initialAccumulatedSeconds,
    );
    if (userId != null && userId.isNotEmpty) {
      await prefs.setString('${KknBgPrefKeys.accumulatedDate}_$userId', today);
      await prefs.setInt(
        '${KknBgPrefKeys.accumulatedSeconds}_$userId',
        initialAccumulatedSeconds,
      );
    }
  }

  if (zoneEntryTime != null) {
    await prefs.setString(
      KknBgPrefKeys.zoneEntryTime,
      zoneEntryTime.toIso8601String(),
    );
    if (userId != null && userId.isNotEmpty) {
      await prefs.setString(
        '${KknBgPrefKeys.zoneEntryTime}_$userId',
        zoneEntryTime.toIso8601String(),
      );
    }
  }

  await prefs.setDouble(
    KknBgPrefKeys.targetLat,
    double.tryParse(
          targetData['latitude']?.toString() ??
              targetData['lat']?.toString() ??
              '0',
        ) ??
        0.0,
  );
  await prefs.setDouble(
    KknBgPrefKeys.targetLng,
    double.tryParse(
          targetData['longitude']?.toString() ??
              targetData['lng']?.toString() ??
              '0',
        ) ??
        0.0,
  );
  await prefs.setDouble(
    KknBgPrefKeys.targetRadius,
    double.tryParse(targetData['radius']?.toString() ?? '150') ?? 150.0,
  );
  await prefs.setDouble(
    KknBgPrefKeys.geofenceBufferMeters,
    double.tryParse(targetData['geofenceBufferMeters']?.toString() ?? '15') ??
        15.0,
  );
  await prefs.setDouble(
    KknBgPrefKeys.invalidationHours,
    double.tryParse(targetData['invalidationHours']?.toString() ?? '2') ?? 2.0,
  );
  final double rawDurationMins =
      double.tryParse(targetData['targetDurationMinutes']?.toString() ?? '') ??
      2.0;
  int durationMins = rawDurationMins.ceil();
  if (rawDurationMins > 0 && rawDurationMins < 1.0) {
    durationMins = (rawDurationMins * 60).ceil();
  }
  if (durationMins <= 0) durationMins = 1;
  await prefs.setInt(KknBgPrefKeys.targetDuration, durationMins);

  if (targetData['scheduleId'] != null || targetData['id'] != null) {
    await prefs.setString(
      KknBgPrefKeys.scheduleId,
      targetData['scheduleId']?.toString() ??
          targetData['id']?.toString() ??
          '',
    );
  }

  // Simpan validZones jika ada
  final validZones = targetData['validZones'] ?? targetData['poskoList'];
  if (validZones != null && validZones is List) {
    await prefs.setString(
      KknBgPrefKeys.validZones,
      jsonEncode(validZones),
    );
  }

  // Simpan end time jika ada
  final endTimeStr =
      targetData['batasWaktuAbsen'] ??
      targetData['endTime'] ??
      targetData['end_time'];
  if (endTimeStr != null) {
    await prefs.setString(KknBgPrefKeys.targetEndTime, endTimeStr.toString());
  }

  // Simpan API config
  if (apiBaseUrl != null) {
    await prefs.setString(KknBgPrefKeys.apiBaseUrl, apiBaseUrl);
  }
  if (authToken != null) {
    await prefs.setString(KknBgPrefKeys.authToken, authToken);
  }

  // Simpan waktu mulai service
  await prefs.setString(
    KknBgPrefKeys.serviceStartTime,
    DateTime.now().toIso8601String(),
  );

  // Start service
  return await FlutterForegroundTask.startService(
    serviceId: 256,
    notificationTitle: 'Pemantauan GPS Aktif 📍',
    notificationText: 'Memulai pemantauan lokasi KKN...',
    callback: startCallback,
  );
}

/// Hentikan foreground service
Future<ServiceRequestResult> stopKknForegroundService() async {
  final prefs = await SharedPreferences.getInstance();
  await prefs.setBool(KknBgPrefKeys.serviceActive, false);
  return await FlutterForegroundTask.stopService();
}

/// Cek apakah service sedang aktif
Future<bool> isKknForegroundServiceActive() async {
  return await FlutterForegroundTask.isRunningService;
}
