import 'dart:async';
import 'package:dio/dio.dart';
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
import 'location_ping_controller.dart';
import 'mahasiswa_notifikasi_controller.dart';
import '../../../data/services/notification_engine.dart';
import '../../../core/utils/network_exception_helper.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_foreground_task/flutter_foreground_task.dart';
import '../services/kkn_background_task_handler.dart';
import '../../../core/values/app_config.dart';


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
    this.kegiatanList = const [],
    this.selectedKegiatan,
    this.sessionId,
    this.isLoadingKegiatan = false,
    this.outOfZoneSeconds = 0,
    this.isAutoStarted = false,
  });

  final String? attendanceId;
  final int? alpaDurationMinutes;
  final List<Map<String, dynamic>> kegiatanList;
  final Map<String, dynamic>? selectedKegiatan;
  final String? sessionId;
  final bool isLoadingKegiatan;
  final int outOfZoneSeconds;
  final bool isAutoStarted;

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
    List<Map<String, dynamic>>? kegiatanList,
    Map<String, dynamic>? selectedKegiatan,
    String? sessionId,
    bool? isLoadingKegiatan,
    int? outOfZoneSeconds,
    bool? isAutoStarted,
    bool clearError = false,
    bool clearActivity = false,
    bool clearWarning = false,
    bool clearKegiatan = false,
    bool clearSession = false,
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
      kegiatanList: kegiatanList ?? this.kegiatanList,
      selectedKegiatan: clearKegiatan ? null : (selectedKegiatan ?? this.selectedKegiatan),
      sessionId: clearSession ? null : (sessionId ?? this.sessionId),
      isLoadingKegiatan: isLoadingKegiatan ?? this.isLoadingKegiatan,
      outOfZoneSeconds: outOfZoneSeconds ?? this.outOfZoneSeconds,
      isAutoStarted: isAutoStarted ?? this.isAutoStarted,
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
  static const _prefKeyTarget = 'kkn_accumulated_target'; // ignore: unused_field
  static const _prefKeyEntryTime = 'kkn_zone_entry_time';

  Future<void> _loadPersistentTimer() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final todayStr = DateTime.now().toIso8601String().substring(0, 10);
      final savedDate = prefs.getString(_prefKeyDate);
      if (savedDate == todayStr) {
        final savedSeconds = prefs.getInt(_prefKeyAccumulated) ?? 0;
        if (savedSeconds > _accumulatedSeconds) {
          _accumulatedSeconds = savedSeconds;
        }
        final savedEntry = prefs.getString(_prefKeyEntryTime);
        if (savedEntry != null && savedEntry.isNotEmpty) {
          _zoneEntryTime = DateTime.tryParse(savedEntry);
        }
      } else {
        await prefs.remove(_prefKeyAccumulated);
        await prefs.remove(_prefKeyDate);
        await prefs.remove(_prefKeyEntryTime);
        _accumulatedSeconds = 0;
        _zoneEntryTime = null;
      }
    } catch (_) {}
  }

  Future<void> _savePersistentTimer() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final todayStr = DateTime.now().toIso8601String().substring(0, 10);
      await prefs.setString(_prefKeyDate, todayStr);
      await prefs.setInt(_prefKeyAccumulated, _accumulatedSeconds);
      if (_zoneEntryTime != null) {
        await prefs.setString(_prefKeyEntryTime, _zoneEntryTime!.toIso8601String());
      } else {
        await prefs.remove(_prefKeyEntryTime);
      }
    } catch (_) {}
  }

  // ignore: unused_element
  Future<void> _savePersistentTimerTempValue(int tempSeconds) async {
    await _savePersistentTimer();
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

        await _loadPersistentTimer();

        // [BUGFIX] Server (sama seperti yang tampil di web) adalah sumber kebenaran durasi.
        // Sebelumnya nilai server DIABAIKAN jika selisihnya <= 60 detik (guard yang justru
        // mempertahankan nilai lokal yang sudah menyimpang/menggembung dari disk), sehingga
        // mobile bisa menampilkan durasi lebih besar dari yang sebenarnya tercatat di web
        // (mis. mobile +37dtk vs web 7dtk hanya karena selisih 30dtk dianggap "wajar").
        // Sekarang: SELALU sinkron ke nilai server saat data tersedia.
        if (activeZone['actualInZoneSeconds'] != null) {
          final serverSecs = int.tryParse(activeZone['actualInZoneSeconds'].toString()) ?? 0;
          _accumulatedSeconds = serverSecs;
          _zoneEntryTime = DateTime.now();
          await _savePersistentTimer();
        } else if (activeZone['actualInZoneMinutes'] != null) {
          final actualMins = num.tryParse(activeZone['actualInZoneMinutes'].toString()) ?? 0;
          final serverSecs = (actualMins * 60).toInt();
          _accumulatedSeconds = serverSecs;
          _zoneEntryTime = DateTime.now();
          await _savePersistentTimer();
        }

        final double? targetLat = (activeZone['latitude'] as num?)?.toDouble();
        final double? targetLng = (activeZone['longitude'] as num?)?.toDouble();
        final double radius = (activeZone['radius'] as num?)?.toDouble() ?? 100.0;
        final double buffer = (activeZone['geofenceBufferMeters'] as num?)?.toDouble() ?? 15.0;

        double distance = 999999.0;
        bool isInside = false;

        if (pos != null && targetLat != null && targetLng != null) {
          distance = Geolocator.distanceBetween(pos.latitude, pos.longitude, targetLat, targetLng);
          isInside = distance <= (radius + buffer);
        }

        final status = (activeZone['attendanceStatus'] ?? activeZone['status'] ?? activeZone['kehadiran'] ?? '')
            .toString()
            .toLowerCase();
        final bool isAttended = activeZone['isAttended'] == true || status == 'hadir' || status == 'hadir_memenuhi' || status == 'hadir_tidak_memenuhi';
        final bool isAlpa = status == 'alpa' || status == 'tanpa_keterangan';

        state = state.copyWith(
          activeActivity: activeZone,
          currentPosition: pos,
          isInsideRadius: isInside,
          distanceToTarget: distance,
          inZoneDurationSeconds: _accumulatedSeconds,
          isSuccessAttendance: isAttended,
          zoneResetWarning: isAlpa
              ? 'Waktu jadwal KKN telah berakhir. Status Anda: TANPA KETERANGAN (ALPA).'
              : null,
          clearWarning: !isAlpa,
          error: null,
          clearError: true,
        );
      } else {
        state = state.copyWith(activeActivity: null);
      }

      if (activeZone.isNotEmpty && (activeZone['hasActiveZone'] == true || activeZone['id'] != null)) {
        if (state.kegiatanList.isEmpty) {
          state = state.copyWith(kegiatanList: [activeZone]);
        }
      }
    } catch (e) {
      state = state.copyWith(error: NetworkExceptionHelper.getErrorMessage(e));
    }
  }

  /// ═══════════════════════════════════════════════════════════════
  /// GPS PRESENSI BERBASIS KEGIATAN — NEW FLOW
  /// ═══════════════════════════════════════════════════════════════

  /// Fetch daftar kegiatan KKN aktif hari ini dari backend
  Future<void> fetchKegiatanAktif() async {
    state = state.copyWith(isLoadingKegiatan: true, clearError: true);
    try {
      final repo = ref.read(kknRepositoryProvider);
      var list = await repo.getKegiatanAktif();
      
      if (list.isEmpty && state.activeActivity != null && state.activeActivity!['id'] != null) {
        list = [state.activeActivity!];
      }

      if (list.isNotEmpty) {
        list.sort((a, b) {
          final tA = a['createdAt']?.toString() ?? a['jamMulai']?.toString() ?? '';
          final tB = b['createdAt']?.toString() ?? b['jamMulai']?.toString() ?? '';
          return tB.compareTo(tA);
        });
      }

      Map<String, dynamic>? activeItem;
      for (final item in list) {
        final status = (item['statusKehadiran'] ?? item['attendanceStatus'] ?? '').toString().toUpperCase();
        if (status == 'BERLANGSUNG' || status == 'TERJEDA') {
          activeItem = item;
          break;
        }
      }

      if (activeItem != null) {
        final serverSecs = int.tryParse(activeItem['actualInZoneSeconds']?.toString() ?? '') ??
            ((num.tryParse(activeItem['actualInZoneMinutes']?.toString() ?? '') ?? 0) * 60).toInt();

        // Ambil nilai terbesar antara server dan lokal agar durasi tidak mundur
        if (serverSecs > _accumulatedSeconds) {
          _accumulatedSeconds = serverSecs;
        }

        final durasiWajib = int.tryParse(activeItem['durasiWajibMenit']?.toString() ?? '120') ?? 120;
        final scheduleId = activeItem['id']?.toString() ?? activeItem['scheduleId']?.toString();

        _currentTargetScheduleId = scheduleId;

        state = state.copyWith(
          kegiatanList: list,
          activeActivity: activeItem,
          selectedKegiatan: activeItem,
          targetDurationMinutes: durasiWajib,
          inZoneDurationSeconds: _accumulatedSeconds,
          attendanceTime: activeItem['attendedAt']?.toString() ?? state.attendanceTime,
          isLoadingKegiatan: false,
        );

        if (!state.isTracking) {
          final statusUpper = (activeItem['statusKehadiran'] ?? activeItem['attendanceStatus'] ?? '').toString().toUpperCase();
          if (statusUpper == 'TERJEDA' && scheduleId != null) {
            // Otomatis resume sesi TERJEDA kembali ke BERLANGSUNG
            await mulaiKegiatan(scheduleId, isAuto: true);
          } else {
            await startTracking(null, true);
          }
        }
      } else {
        state = state.copyWith(
          kegiatanList: list,
          isLoadingKegiatan: false,
        );
      }
    } catch (e) {
      state = state.copyWith(
        isLoadingKegiatan: false,
        error: NetworkExceptionHelper.getErrorMessage(e),
      );
    }
  }

  /// Mulai kegiatan KKN: panggil endpoint, lalu start GPS background
  Future<String?> mulaiKegiatan(String kegiatanId, {bool isAuto = false}) async {
    final hasPermission = await _checkPermissions();
    if (!hasPermission) {
      state = state.copyWith(error: 'Izin lokasi (selalu) tidak diberikan');
      return 'Izin lokasi tidak diberikan';
    }

    try {
      // [FIX A2] Hentikan HANYA background service & timer, TANPA clear state
      // agar attendanceTime yang diset di bawah ini tidak hilang
      _trackingTimer?.cancel();
      _trackingTimer = null;
      _stopZoneTimer(resetCompletely: false);
      await _stopBackgroundService();
      
      state = state.copyWith(isLoadingKegiatan: true, clearError: true);
      
      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
      ).timeout(const Duration(seconds: 15));

      final repo = ref.read(kknRepositoryProvider);
      final response = await repo.mulaiKegiatan(
        kegiatanId,
        pos.latitude,
        pos.longitude,
        deviceInfo: await _getDeviceInfo(),
      );

      final sessionId = response['sessionId']?.toString();
      final scheduleId = response['scheduleId']?.toString() ?? kegiatanId;
      _currentTargetScheduleId = scheduleId;

      // Sync durasi dari server — jika backend sudah punya sesi aktif (misal dari HP lain),
      // gunakan nilai server sebagai titik awal agar durasi tidak mulai dari 0.
      // Jika server tidak mengembalikan durasi, pertahankan nilai lokal yang sudah berjalan
      // agar durasi tidak ke-reset saat user back → mulai kegiatan lagi.
      if (response['actualInZoneSeconds'] != null) {
        final serverSecs = int.tryParse(response['actualInZoneSeconds'].toString()) ?? 0;
        // Ambil nilai terbesar antara server dan lokal
        if (serverSecs > _accumulatedSeconds) {
          _accumulatedSeconds = serverSecs;
        }
      } else if (response['actualInZoneMinutes'] != null) {
        final serverSecs = ((num.tryParse(response['actualInZoneMinutes'].toString()) ?? 0) * 60).toInt();
        if (serverSecs > _accumulatedSeconds) {
          _accumulatedSeconds = serverSecs;
        }
      }
      // Jika server tidak return durasi sama sekali, _accumulatedSeconds tetap dari nilai lokal sebelumnya
      _zoneEntryTime = DateTime.now();
      try {
        final prefs = await SharedPreferences.getInstance();
        if (_accumulatedSeconds > 0) {
          final todayStr = DateTime.now().toIso8601String().substring(0, 10);
          await prefs.setString('kkn_accumulated_date', todayStr);
          await prefs.setInt('kkn_accumulated_seconds', _accumulatedSeconds);
          if (_zoneEntryTime != null) {
            await prefs.setString('kkn_zone_entry_time', _zoneEntryTime!.toIso8601String());
          }
        } else {
          await prefs.remove('kkn_accumulated_seconds');
          await prefs.remove('kkn_zone_entry_time');
        }
      } catch (_) {}

      // Parse lokasi dari response
      final lokasi = response['lokasi'] as Map<String, dynamic>?;
      final targetData = <String, dynamic>{
        ...response,
        if (lokasi != null) ...{
          'latitude': lokasi['latitude'],
          'longitude': lokasi['longitude'],
          'radius': lokasi['radiusMeter'] ?? 150,
          'address': lokasi['alamat'] ?? 'Zona Kegiatan',
          'polygon': lokasi['polygon'],
        },
        'geofenceBufferMeters': response['geofenceBufferMeters'] ?? 15.0,
        'invalidationHours': response['invalidationHours'] ?? 2.0,
        'namaKegiatan': response['namaKegiatan'] ?? 'Kegiatan KKN',
      };

      final durasiWajib = (int.tryParse(response['durasiWajibMenit']?.toString() ?? '') ?? 120).clamp(1, 480);

      final updatedKegiatanList = state.kegiatanList.map((k) {
        if (k['id']?.toString() == scheduleId || k['scheduleId']?.toString() == scheduleId) {
          return {
            ...k,
            'statusKehadiran': response['statusKehadiran'] ?? 'BERLANGSUNG',
            'attendanceStatus': response['attendanceStatus'] ?? 'BERLANGSUNG',
          };
        }
        return k;
      }).toList();

      // [FIX A4] Set state SEBELUM startTracking() agar attendanceTime & activeActivity tersedia
      state = state.copyWith(
        selectedKegiatan: response,
        kegiatanList: updatedKegiatanList,
        sessionId: sessionId,
        activeActivity: targetData,
        targetDurationMinutes: durasiWajib,
        isAutoStarted: isAuto,
        outOfZoneSeconds: 0,
        isLoadingKegiatan: false,
        isTracking: false, // Reset agar startTracking() tidak skip
        clearError: true,
        attendanceTime: response['attendedAt']?.toString(),
      );

      // [FIX A2] Start GPS tracking dengan flag forceBackgroundStart
      // Karena state sudah berisi attendanceStatus=BERLANGSUNG, semua gate akan terbuka
      await startTracking(null, true);
      ref.read(locationPingControllerProvider.notifier).startTracking();
      return null;
    } catch (e) {
      final errMsg = e.toString().replaceAll('Exception:', '').trim();
      state = state.copyWith(isLoadingKegiatan: false);
      // Handle 409 conflict (sudah ada kegiatan aktif)
      if (errMsg.startsWith('CONFLICT:')) {
        state = state.copyWith(error: errMsg.substring(9));
        return 'CONFLICT';
      } else {
        final err = errMsg.isNotEmpty ? errMsg : 'Gagal memulai kegiatan';
        state = state.copyWith(error: err);
        return err;
      }
    }
  }

  /// Selesai kegiatan: panggil endpoint, lalu stop GPS background
  Future<bool> selesaiKegiatan({String alasan = 'SELESAI'}) async {
    final scheduleId = _currentTargetScheduleId ??
        state.activeActivity?['scheduleId']?.toString() ??
        state.activeActivity?['id']?.toString();
    final sessionId = state.sessionId ??
        state.activeActivity?['sessionId']?.toString() ??
        'SES-${scheduleId ?? 'TODAY'}';

    if (scheduleId == null) return false;

    bool isSuccess = false;

    try {
      final repo = ref.read(kknRepositoryProvider);
      final totalMenit = (_accumulatedSeconds / 60).ceil();
      await repo.selesaiKegiatan(
        scheduleId,
        sessionId: sessionId,
        totalDurasiDalamZonaMenit: totalMenit,
        accumulatedSeconds: _accumulatedSeconds,
        alasan: alasan,
      );
      isSuccess = true;
      // Segarkan data dashboard (Poin) & Notifikasi
      ref.read(mahasiswaControllerProvider.notifier).fetchDashboardData();
      ref.invalidate(mahasiswaNotificationsProvider);
    } catch (e) {
      debugPrint('[KKN] selesaiKegiatan error: $e');
      isSuccess = false;
    } finally {
      // === GPS LIFECYCLE: Matikan semua lapisan GPS ===
      await stopTracking();
      ref.read(locationPingControllerProvider.notifier).stopTracking();
      
      // Bersihkan timer persisten
      _accumulatedSeconds = 0;
      _zoneEntryTime = null;
      try {
        final prefs = await SharedPreferences.getInstance();
        await prefs.remove('kkn_accumulated_seconds');
        await prefs.remove('kkn_zone_entry_time');
        // Bersihkan data target background service agar tidak auto-restart
        await prefs.remove('kkn_bg_target_lat');
        await prefs.remove('kkn_bg_target_lng');
        await prefs.remove('kkn_bg_schedule_id');
      } catch (_) {}

      state = state.copyWith(
        clearKegiatan: true,
        clearSession: true,
        clearActivity: true, // Tambahkan ini agar mergedData tidak mewarisi aktivitas lama
        isAutoStarted: false,
        outOfZoneSeconds: 0,
      );
    }
    
    return isSuccess;
  }

  /// Jeda Kegiatan: panggil endpoint Jeda, dan matikan GPS lokal, tetapi pertahankan accumulatedSeconds.
  Future<bool> jedaKegiatan(String alasan) async {
    final scheduleId = _currentTargetScheduleId ??
        state.activeActivity?['scheduleId']?.toString() ??
        state.activeActivity?['id']?.toString();
    if (scheduleId == null) return false;

    bool isSuccess = false;
    try {
      final repo = ref.read(kknRepositoryProvider);
      final totalMenit = (_accumulatedSeconds / 60).ceil();
      await repo.jedaKegiatan(
        scheduleId,
        totalDurasiDalamZonaMenit: totalMenit,
        accumulatedSeconds: _accumulatedSeconds,
        alasan: alasan,
      );
      isSuccess = true;
    } catch (e) {
      debugPrint('[KKN] jedaKegiatan error: $e');
      isSuccess = false;
    } finally {
      // === GPS LIFECYCLE: Matikan tracking lokal, tapi jangan hapus state accumulated ===
      await stopTracking();
      ref.read(locationPingControllerProvider.notifier).stopTracking();
      
      // Update local storage untuk checkpoint durasi
      final prefs = await SharedPreferences.getInstance();
      await prefs.setInt('kkn_accumulated_seconds', _accumulatedSeconds);
      // Jangan hapus session ID karena jika belum selesai, mereka cuma lanjut sesi
    }
    return isSuccess;
  }

  /// Pindah kegiatan: selesai kegiatan lama → mulai kegiatan baru
  Future<String?> switchKegiatan(String newKegiatanId) async {
    await selesaiKegiatan(alasan: 'PINDAH_KEGIATAN');
    await Future.delayed(const Duration(milliseconds: 500));
    return mulaiKegiatan(newKegiatanId);
  }

  /// Catat pelanggaran keluar zona
  Future<void> _recordOutOfZoneViolation() async {
    if (_currentTargetScheduleId == null) return;
    try {
      final repo = ref.read(kknRepositoryProvider);
      final result = await repo.recordOutOfZoneViolation(
        scheduleId: _currentTargetScheduleId!,
        outOfZoneMinutes: state.outOfZoneSeconds / 60.0,
      );
      final penaltyPts = result['penaltyPoints'];
      if (penaltyPts != null) {
        state = state.copyWith(
          zoneResetWarning: '⚠️ Poin dikurangi $penaltyPts karena keluar zona terlalu lama.',
          clearWarning: false,
        );
        NotificationEngine().showGenericNotification(
          id: DateTime.now().millisecondsSinceEpoch.remainder(10000),
          title: 'Peringatan Keluar Zona ⚠️',
          body: 'Poin dikurangi $penaltyPts karena keluar zona melebihi batas toleransi.',
          color: const Color(0xFFEF4444),
        );
      }
    } catch (e) {
      debugPrint('[KKN] recordOutOfZoneViolation error: $e');
    }
  }

  /// Helper: get basic device info string
  Future<String> _getDeviceInfo() async {
    try {
      return 'Flutter Mobile';
    } catch (_) {
      return 'Unknown Device';
    }
  }

  Future<bool> _checkPermissions() async {
    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }

    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever ||
        permission == LocationPermission.unableToDetermine) {
      return false;
    }
    return true;
  }

  /// Start tracking GPS locations and sync with backend
  /// [forceBackgroundStart] — jika true, background service PASTI dijalankan
  /// tanpa mengecek status dari state (digunakan oleh mulaiKegiatan)
  Future<void> startTracking([BuildContext? context, bool forceBackgroundStart = false]) async {
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
          final attendanceStatus =
              (activeZone['attendanceStatus'] ?? activeZone['statusKehadiran'] ?? activeZone['kehadiran'] ?? '')
                  .toString()
                  .toLowerCase();
          final bool isAttended = activeZone['isAttended'] == true || attendanceStatus == 'hadir' || attendanceStatus == 'hadir_memenuhi' || attendanceStatus == 'hadir_tidak_memenuhi';

          final double rawTargetMins = double.tryParse(activeZone['targetDurationMinutes']?.toString() ?? '') ??
              double.tryParse(activeZone['durationMinutes']?.toString() ?? '') ??
              2.0;
          int targetMins = rawTargetMins.ceil();
          if (rawTargetMins > 0 && rawTargetMins < 1.0) {
            targetMins = (rawTargetMins * 60).ceil();
          }
          if (targetMins <= 0) targetMins = 1;

          if (isAttended) {
            state = state.copyWith(
              isSuccessAttendance: true,
              inZoneDurationSeconds: _accumulatedSeconds,
              isEligibleForAttendance: false,
              zoneResetWarning: 'Anda sudah berhasil melakukan presensi (Hadir) pada jadwal kegiatan ini.',
              clearWarning: false,
              clearError: true,
            );
          } else if (attendanceStatus == 'izin' || attendanceStatus == 'sakit') {
            state = state.copyWith(
              zoneResetWarning:
                  'Anda tercatat ${attendanceStatus.toUpperCase()} pada jadwal kegiatan ini.',
            );
          } else if (attendanceStatus == 'alpa') {
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
              
            // [BUGFIX] Server selalu jadi otoritas durasi (sama seperti checkActiveSchedule()/
            // fetchTargetLocation()). Sebelumnya hanya sync kalau server > lokal, sehingga kalau
            // nilai lokal dari disk sudah menggembung (mis. sisa sesi lama), nilai salah itu tetap
            // dipakai selamanya karena tidak pernah "dikoreksi turun" ke nilai server yang benar.
            int serverSeconds = _accumulatedSeconds;
            bool hasServerDuration = false;
            if (activeZone['actualInZoneSeconds'] != null) {
              serverSeconds = int.tryParse(activeZone['actualInZoneSeconds'].toString()) ?? _accumulatedSeconds;
              hasServerDuration = true;
            } else if (activeZone['actualInZoneMinutes'] != null) {
              serverSeconds = (num.tryParse(activeZone['actualInZoneMinutes'].toString()) ?? 0).toInt() * 60;
              hasServerDuration = true;
            }

            if (hasServerDuration) {
              _accumulatedSeconds = serverSeconds;
              // Reset zona entry time agar akumulasi baru mulai dihitung dari durasi server ini
              _zoneEntryTime = DateTime.now(); 
              await _savePersistentTimer();
              
              if (_backgroundServiceStarted) {
                FlutterForegroundTask.sendDataToTask({
                  'type': 'SYNC_DURATION',
                  'seconds': serverSeconds,
                });
              }
            }

            // FIX: Merge activeZone dengan activeActivity yang ada agar tidak kehilangan data penting seperti statusKehadiran
            final mergedData = {
              ...state.activeActivity ?? {},
              ...activeZone,
            };

            state = state.copyWith(
              activeActivity: mergedData,
              targetDurationMinutes: targetMins,
              inZoneDurationSeconds: _accumulatedSeconds,
              attendanceTime: activeZone['attendedAt']?.toString() ?? state.attendanceTime,
            );
          }
        }
      } catch (_) {}
    } else if (state.activeActivity == null || state.activeActivity!['latitude'] == null) {
      await fetchTargetLocation();
    }

    // Initial check (local location update)
    await _performLocationUpdate();

    // Setup periodic updates every 10 seconds (Real-Time Responsiveness)
    _trackingTimer?.cancel();
    _trackingTimer = Timer.periodic(const Duration(seconds: 10), (timer) async {
      await _performLocationUpdate();
    });

    // ═════════════════════════════════════════════════════════════════
    // START BACKGROUND FOREGROUND SERVICE
    // Agar GPS tetap jalan meski layar mati / user pindah app
    // HANYA JALANKAN JIKA KEGIATAN SUDAH RESMI DIMULAI
    // ═════════════════════════════════════════════════════════════════
    final currentStatus = state.activeActivity?['attendanceStatus']?.toString().toLowerCase() ?? 
                         state.activeActivity?['statusKehadiran']?.toString().toLowerCase() ?? '';
                         
    // [FIX A2] forceBackgroundStart dari mulaiKegiatan() membypass pengecekan status
    if (forceBackgroundStart || currentStatus == 'berlangsung') {
      _startBackgroundService();
      ref.read(locationPingControllerProvider.notifier).startTracking();
    } else {
      await _stopBackgroundService();
    }
  }

  /// Stop the tracking timer
  Future<void> stopTracking() async {
    _trackingTimer?.cancel();
    _trackingTimer = null;
    
    // Alih-alih hanya meng-cancel timer, gunakan _stopZoneTimer() agar 
    // durasi sisa ditambahkan ke _accumulatedSeconds dan _zoneEntryTime di-reset.
    _stopZoneTimer(resetCompletely: false);
    
    await _stopBackgroundService();
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
      // [BUGFIX] Ambil API config dari sumber yang benar — sebelumnya membaca
      // key SharedPreferences 'api_base_url'/'auth_token' yang TIDAK PERNAH
      // ditulis di manapun, sehingga selalu null dan background service
      // langsung auto-stop (dikira user logout) tanpa pernah ping backend.
      final apiBaseUrl = AppConfig.apiBaseUrl;
      final authToken = await ref.read(secureStorageProvider).read(key: AppConfig.accessTokenKey);

      if (authToken == null || authToken.isEmpty) {
        debugPrint('[KKN-Controller] Gagal start background service: token kosong');
        return;
      }
      
      // Sesuaikan radius fallback dengan _performLocationUpdate (default 150.0, fallback 500.0)
      final rawRadius = target['radius']?.toString() ?? '150.0';
      double radiusFallback = double.tryParse(rawRadius) ?? 150.0;
      if (radiusFallback <= 0) radiusFallback = 500.0;
      
      // Update targetData agar menggunakan radius yang tersinkronisasi
      final syncedTarget = {
        ...target,
        'radius': radiusFallback,
      };

      final result = await startKknForegroundService(
        targetData: syncedTarget,
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
        
        // [BUGFIX] Background isolate memverifikasi ulang GPS+geofence tiap 30 detik, jadi
        // kenaikannya legit meski jaraknya jauh (mis. layar terkunci lama membuat UI-isolate
        // di-throttle Android sehingga baru menerima update setelah lompatan >60dtk).
        // Guard lama menolak lompatan >60dtk dan membuat durasi UI beku permanen sampai
        // tracking di-restart. Sekarang: terima setiap kenaikan (tidak pernah mundur).
        if (totalSeconds > _accumulatedSeconds) {
          _accumulatedSeconds = totalSeconds;
          _zoneEntryTime = DateTime.now();
        }
        
        state = state.copyWith(
          inZoneDurationSeconds: _accumulatedSeconds,
          isEligibleForAttendance: isEligible || _accumulatedSeconds >= (state.targetDurationMinutes * 60),
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
        
      case 'OUT_OF_ZONE_VIOLATION':
        // Background service mendeteksi keluar zona > 5 menit
        final outOfZoneSecs = (data['outOfZoneSeconds'] as num?)?.toInt() ?? 300;
        state = state.copyWith(outOfZoneSeconds: outOfZoneSecs);
        _recordOutOfZoneViolation();
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
      // Bug #10 fix: simpan scheduleId aktif agar tidak hilang setelah restart
      final savedScheduleId = _currentTargetScheduleId;

      // Hard refresh: Hentikan semua service layaknya hot refresh
      await stopTracking();

      // Bersihkan state agar `startTracking` memanggil `getActiveZone` ulang dari API
      state = state.copyWith(
        activeActivity: null,
        clearActivity: true,
        zoneResetWarning: null,
        clearWarning: true,
      );
      // Restore schedule ID agar tracking bisa dilanjutkan ke jadwal yang sama
      _currentTargetScheduleId = savedScheduleId;

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
      mergedData['geofenceBufferMeters'] ??= 15.0;
      mergedData['invalidationHours'] ??= 2.0;

      int duration = 120;
      if (mergedData['targetDurationMinutes'] != null) {
        duration = (int.tryParse(mergedData['targetDurationMinutes'].toString()) ?? 120).clamp(1, 480);
      } else if (mergedData['durationMinutes'] != null) {
        duration = (int.tryParse(mergedData['durationMinutes'].toString()) ?? 120).clamp(1, 480);
      }

      final status = (mergedData['attendanceStatus'] ?? mergedData['status'] ?? mergedData['kehadiran'] ?? '')
          .toString()
          .toLowerCase();
      final bool isAttended = mergedData['isAttended'] == true || status == 'hadir';

      // [BUGFIX] Sama seperti checkActiveSchedule(): SELALU sinkron ke server, jangan
      // pernah menolak nilai server hanya karena selisihnya "kelihatan wajar" (<=60dtk).
      // Guard lama itu justru mempertahankan nilai lokal yang salah/menggembung.
      if (mergedData['actualInZoneSeconds'] != null) {
        final serverSecs = int.tryParse(mergedData['actualInZoneSeconds'].toString()) ?? 0;
        _accumulatedSeconds = serverSecs;
        _zoneEntryTime = DateTime.now();
        await _savePersistentTimer();
      } else if (mergedData['actualInZoneMinutes'] != null) {
        final actualMins = num.tryParse(mergedData['actualInZoneMinutes'].toString()) ?? 0;
        final serverSecs = (actualMins * 60).toInt();
        _accumulatedSeconds = serverSecs;
        _zoneEntryTime = DateTime.now();
        await _savePersistentTimer();
      }

      if (isAttended || status == 'hadir') {
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
          inZoneDurationSeconds: _accumulatedSeconds,
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

    _zoneDurationTimer = Timer.periodic(const Duration(seconds: 1), (timer) async {
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

        // Jika sudah ada status final (izin/sakit), hentikan tracking kegiatan
        if (status == 'izin' || status == 'sakit') {
          _stopZoneTimer(resetCompletely: true);
          state = state.copyWith(
            inZoneDurationSeconds: 0,
            isEligibleForAttendance: false,
            isSuccessAttendance: false,
            zoneResetWarning: 'Anda tercatat ${status.toUpperCase()} pada jadwal ini, absensi ditutup.',
            clearWarning: false,
          );
          return; // Stop processing further
        }

        // Bug fix: hentikan timer tanpa reset waktu jika status presensi sudah terverifikasi hadir/selesai
        if (status == 'hadir' || status == 'selesai' || state.isSuccessAttendance) {
          _stopZoneTimer(resetCompletely: false);
          state = state.copyWith(
            isEligibleForAttendance: false,
            isSuccessAttendance: true,
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

            // Bug #9 fix: Hentikan timer tanpa mereset akumulasi — pertahankan durasi yang sudah tercatat
            _stopZoneTimer(resetCompletely: false);
            state = state.copyWith(
              isEligibleForAttendance: false,
              zoneResetWarning: timeWindowWarning,
              clearWarning: false,
            );

            return; // Stop processing further
          }
        }
      }

      if (state.isInsideRadius) {
        if (_zoneEntryTime == null) {
          _zoneEntryTime = now;
          await _savePersistentTimer();
        }
        final currentSessionSeconds = now.difference(_zoneEntryTime!).inSeconds;
        final totalElapsed = _accumulatedSeconds + currentSessionSeconds;

        // Simpan setiap 5 detik agar persisten jika aplikasi tertutup tiba-tiba
        if (totalElapsed > 0 &&
            totalElapsed % 5 == 0 &&
            _lastSavedSeconds != totalElapsed) {
          _lastSavedSeconds = totalElapsed;
          
          // [BUGFIX] Sinkronisasi _accumulatedSeconds agar tidak ke-reset 
          // saat ada update background atau update polling
          _accumulatedSeconds = totalElapsed;
          _zoneEntryTime = now;
          
          await _savePersistentTimer();
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
    final bool durationMet = _accumulatedSeconds >= (state.targetDurationMinutes * 60);

    state = state.copyWith(
      inZoneDurationSeconds: _accumulatedSeconds,
      isEligibleForAttendance: durationMet,
      zoneResetWarning: (isExitingZone && !durationMet)
          ? 'Anda keluar dari zona KKN. Waktu dihentikan sementara (freeze).'
          : null,
    );
  }

  // ignore: unused_element
  Future<void> _sendAutoAlpa() async {
    final user = ref.read(authProvider).user;
    if (user == null || _currentTargetScheduleId == null) return;

    final int durationMinutes = (_accumulatedSeconds / 60).floor();

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

    // Mengecek apakah mahasiswa sudah menekan "Mulai Kegiatan"
    final currentStatus = state.activeActivity?['attendanceStatus']?.toString().toLowerCase() ?? 
                         state.activeActivity?['statusKehadiran']?.toString().toLowerCase() ?? '';
    final isBerlangsung = currentStatus == 'berlangsung';

    // Send update to backend only if background service is not handling it AND activity has officially started
    if (!_backgroundServiceStarted && isBerlangsung) {
      try {
        final repo = ref.read(kknRepositoryProvider);
        final currentTotalSeconds = state.isInsideRadius && _zoneEntryTime != null
            ? _accumulatedSeconds + DateTime.now().difference(_zoneEntryTime!).inSeconds
            : _accumulatedSeconds;
        final pingResponse = await repo.sendLocationPing(
          pos.latitude,
          pos.longitude,
          inZoneSeconds: currentTotalSeconds,
        );

        // [FIX A3] Backend mengembalikan { success, data: { ... } }
        // Parse dari level 'data' terlebih dahulu, fallback ke top-level
        final pingData = (pingResponse['data'] as Map<String, dynamic>?) ?? pingResponse;

        // Jika backend me-trigger auto attendance (karena durasi cukup dll)
        if (pingData.containsKey('autoAttendanceTriggered') &&
            pingData['autoAttendanceTriggered'] == true) {
          state = state.copyWith(
            isSuccessAttendance: true,
            attendanceTime: DateTime.now().toLocal().toString().split('.')[0],
          );
        }
      } on DioException catch (e) {
        // Ekstrak errorCode spesifik dari backend
        final responseData = e.response?.data;
        final errorCode = (responseData is Map<String, dynamic>)
            ? (responseData['error']?.toString() ?? '')
            : '';

        // Error kritis: tampilkan ke UI dan hentikan tracking sementara
        const criticalErrors = {
          'STUDENT_PROFILE_INCOMPLETE',
          'OUT_OF_COBLONG_BOUNDS',
          'LOCATION_TELEPORTATION_DETECTED',
          'INVALID_COORDINATES',
        };

        if (criticalErrors.contains(errorCode)) {
          final message = NetworkExceptionHelper.getErrorMessage(e);
          state = state.copyWith(
            error: message,
            isInsideRadius: false,
          );
          _stopZoneTimer(isExitingZone: true);
        }
        // Error network sementara (timeout, 429, server error): abaikan agar GPS tetap berjalan
      } catch (_) {
        // Fail silently for non-Dio exceptions during background GPS updates
      }
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

    final buffer = target['geofenceBufferMeters'] != null
        ? (num.tryParse(target['geofenceBufferMeters'].toString())?.toDouble() ?? 15.0)
        : 15.0;
    final effectiveRadius = radius + buffer;

    // POLYGON CHECK: Jika API menyediakan polygon, gunakan Ray Casting algorithm
    // untuk cek apakah user berada di dalam area polygon tersebut.
    // Ini lebih akurat dan mengatasi kasus di mana titik pusat (lat/lng) salah input
    // oleh Admin tapi polygon sudah benar.
    final polygonRaw = target['polygon'];
    if (polygonRaw != null && polygonRaw is List && polygonRaw.length >= 3) {
      try {
        final polygonPoints = polygonRaw.map((point) {
          final List pts = point as List;
          final double val0 = (pts[0] as num).toDouble();
          final double val1 = (pts[1] as num).toDouble();
          final double pLat = (val0.abs() > 45.0) ? val1 : val0;
          final double pLng = (val0.abs() > 45.0) ? val0 : val1;
          return (lat: pLat, lng: pLng);
        }).toList();

        final insidePoly = _isPointInPolygon(
          lat: pos.latitude,
          lng: pos.longitude,
          polygon: polygonPoints,
        );

        distance = Geolocator.distanceBetween(
          pos.latitude,
          pos.longitude,
          targetLat,
          targetLng,
        );

        nowInside = insidePoly || (distance <= effectiveRadius);
      } catch (_) {
        // Fallback ke radius jika parsing polygon gagal
        distance = Geolocator.distanceBetween(
          pos.latitude,
          pos.longitude,
          targetLat,
          targetLng,
        );
        nowInside = distance <= effectiveRadius;
      }
    } else {
      // RADIUS CHECK: Fallback jika tidak ada polygon
      distance = Geolocator.distanceBetween(
        pos.latitude,
        pos.longitude,
        targetLat,
        targetLng,
      );
      nowInside = distance <= effectiveRadius;
    }

    state = state.copyWith(
      distanceToTarget: distance,
      isInsideRadius: nowInside,
      // Jika masuk radius, bersihkan warning sisa background
      clearWarning: nowInside ? true : false,
    );

    // [FIX A1] Gate timer: cek STATUS BERLANGSUNG, bukan attendanceTime
    // Fallback ke isTracking karena setelah mulaiKegiatan() berhasil, isTracking = true
    // dan attendanceTime bisa null kalau backend tidak return attendedAt
    final isSesiBerlangsung = 
        (state.activeActivity?['attendanceStatus']?.toString().toLowerCase() == 'berlangsung')
        || (state.activeActivity?['statusKehadiran']?.toString().toLowerCase() == 'berlangsung')
        || (state.attendanceTime != null)
        || state.isTracking; // Fallback: kalau tracking aktif, berarti sesi sudah dimulai

    if (nowInside && isSesiBerlangsung && !state.isSuccessAttendance) {
      _startZoneTimer();
      // Reset out-of-zone counter saat kembali ke zona
      if (state.outOfZoneSeconds > 0) {
        state = state.copyWith(outOfZoneSeconds: 0);
      }
    } else if (!state.isSuccessAttendance) {
      _stopZoneTimer(
        isExitingZone: _accumulatedSeconds > 0 || _zoneEntryTime != null,
      );
      
      // Jika statusnya belum masuk (bukan berlangsung) DAN tidak sedang tracking,
      // reset accumulatedSeconds agar waktu di UI = 0
      if (!isSesiBerlangsung && !state.isTracking && _accumulatedSeconds > 0) {
        _accumulatedSeconds = 0;
        _zoneEntryTime = null;
      }

      // Akumulasi out-of-zone counter (per 10 detik polling)
      if (state.isTracking && state.selectedKegiatan != null && state.attendanceTime != null) {
        final newOutOfZone = state.outOfZoneSeconds + 10;
        state = state.copyWith(outOfZoneSeconds: newOutOfZone);
        // Cek toleransi (default 5 menit = 300 detik)
        if (newOutOfZone >= 300 && newOutOfZone < 310) {
          _recordOutOfZoneViolation();
        }
      }
    } else {
      // Jika sudah sukses, hentikan timer (jika masih berjalan) tanpa mereset waktu
      _stopZoneTimer(resetCompletely: false);
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
    // Bug #6 fix: guard null scheduleId — jangan fallback ke ID fiktif 'SCH-TODAY'
    if (_currentTargetScheduleId == null) {
      state = state.copyWith(
        error: 'Sesi kegiatan tidak aktif. Silakan mulai kegiatan terlebih dahulu.',
      );
      return false;
    }

    final user = ref.read(authProvider).user;
    final nim =
        ref.read(mahasiswaControllerProvider).dashboard?.nim ??
        user?.phone ??
        '';
    final namaMahasiswa = user?.name ?? '-';

    final int accumulatedSeconds = _accumulatedSeconds;
    final int durationMinutes = (accumulatedSeconds / 60).floor();

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
        durationMinutes: durationMinutes,
        accumulatedSeconds: accumulatedSeconds,
        timestamp: DateTime.now().toUtc().toIso8601String(),
      );

      final isSuccess = response.containsKey('success')
          ? (response['success'] == true)
          : response.isNotEmpty;

      if (isSuccess) {
        state = state.copyWith(
          isSuccessAttendance: true,
          attendanceTime:
              response['attendedAt']?.toString() ??
              DateTime.now().toLocal().toString().split('.')[0],
          attendanceId: response['id']?.toString(),
          isInsideRadius: true,
          inZoneDurationSeconds: _accumulatedSeconds,
        );
        await _savePersistentTimer();

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
        // Segarkan dasbor Poin Mahasiswa secara reaktif
        ref.read(mahasiswaControllerProvider.notifier).fetchDashboardData();
        
        // === GPS LIFECYCLE: Matikan semua lapisan GPS setelah presensi berhasil ===
        notifyAttendanceSuccess();
        await stopTracking();
        ref.read(locationPingControllerProvider.notifier).stopTracking();
        // Reset accumulated seconds agar tidak terbawa ke sesi berikutnya
        _accumulatedSeconds = 0;
        _zoneEntryTime = null;
        try {
          final prefs = await SharedPreferences.getInstance();
          await prefs.remove('kkn_accumulated_seconds');
          await prefs.remove('kkn_zone_entry_time');
          await prefs.remove('kkn_bg_target_lat');
          await prefs.remove('kkn_bg_target_lng');
          await prefs.remove('kkn_bg_schedule_id');
        } catch (_) {}
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
      // Force stop foreground service saat controller di-dispose
      FlutterForegroundTask.sendDataToTask({'type': 'STOP'});
      stopKknForegroundService();
    }
    super.dispose();
  }
}

final kknLocationProvider =
    StateNotifierProvider<KknLocationNotifier, KknLocationState>((ref) {
      return KknLocationNotifier(ref);
    });
