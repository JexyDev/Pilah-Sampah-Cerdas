import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/data/latest_all.dart' as tz;
import 'package:timezone/timezone.dart' as tz;

import 'package:permission_handler/permission_handler.dart';
import '../../routes/app_routes.dart';

class NotificationEngine {
  static final NotificationEngine _instance = NotificationEngine._internal();
  factory NotificationEngine() => _instance;
  NotificationEngine._internal();

  final FlutterLocalNotificationsPlugin _flutterLocalNotificationsPlugin =
      FlutterLocalNotificationsPlugin();

  bool _isInitialized = false;

  Future<void> init({GlobalKey<NavigatorState>? navigatorKey}) async {
    if (_isInitialized || kIsWeb) return;

    try {
      // Setup timezone ke Asia/Jakarta agar jadwal cron tepat di waktu WIB
      tz.initializeTimeZones();
      tz.setLocalLocation(tz.getLocation('Asia/Jakarta'));

      const AndroidInitializationSettings initializationSettingsAndroid =
          AndroidInitializationSettings('@mipmap/ic_launcher');

      const InitializationSettings initializationSettings =
          InitializationSettings(
            android: initializationSettingsAndroid,
            linux: LinuxInitializationSettings(defaultActionName: 'Open'),
          );

      await _flutterLocalNotificationsPlugin.initialize(
        settings: initializationSettings,
        onDidReceiveNotificationResponse: (NotificationResponse response) {
          debugPrint(
            '[NotificationEngine] Notification tapped, payload: ${response.payload}',
          );
          if (navigatorKey != null &&
              navigatorKey.currentState != null &&
              response.payload != null) {
            if (response.payload == 'ROUTE_POIN') {
              navigatorKey.currentState!.pushNamed(AppRoutes.poin);
            } else if (response.payload == 'ROUTE_HISTORY') {
              navigatorKey.currentState!.pushNamed(AppRoutes.riwayatKkn);
            } else if (response.payload == 'ROUTE_PENGAJUAN_WARGA') {
              navigatorKey.currentState!.pushNamed(AppRoutes.pengajuanWarga);
            } else if (response.payload == 'ROUTE_PETUGAS_NOTIF') {
              navigatorKey.currentState!.pushNamed(AppRoutes.petugasNotifikasi);
            } else if (response.payload == 'ROUTE_WARGA_NOTIF') {
              navigatorKey.currentState!.pushNamed(AppRoutes.notifikasi);
            } else if (response.payload == 'ROUTE_NOTIF') {
              navigatorKey.currentState!.pushNamed(AppRoutes.mahasiswaNotifikasi);
            }
          }
        },
      );

      final androidPlugin = _flutterLocalNotificationsPlugin
          .resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>();
      if (androidPlugin != null) {
        // ponytail: pre-create backend_channel so high-priority FCM background notifications pop up on Android 8+
        await androidPlugin.createNotificationChannel(
          const AndroidNotificationChannel(
            'backend_channel',
            'Notifikasi Sistem Backend',
            description: 'Notifikasi resmi dari backend & atasan',
            importance: Importance.max,
            playSound: true,
            enableVibration: true,
          ),
        );
        await androidPlugin.createNotificationChannel(
          const AndroidNotificationChannel(
            'kkn_location_channel',
            'Tracking Lokasi KKN',
            description: 'Notifikasi ongoing tracking GPS kegiatan KKN',
            importance: Importance.low,
            playSound: false,
            enableVibration: false,
          ),
        );
      }

      _isInitialized = true;

      await _requestPermissions();
    } catch (e) {
      debugPrint('[NotificationEngine] Init failed: $e');
    }
  }

  Future<void> _requestPermissions() async {
    if (!Platform.isAndroid) return;

    try {
      // 1. Notification Permission (Android 13+)
      if (await Permission.notification.isDenied) {
        await Permission.notification.request();
      }

      // 2. Exact Alarm Permission (Android 12+)
      if (await Permission.scheduleExactAlarm.isDenied) {
        await Permission.scheduleExactAlarm.request();
      }

      // 3. Ignore Battery Optimizations
      if (await Permission.ignoreBatteryOptimizations.isDenied) {
        await Permission.ignoreBatteryOptimizations.request();
      }
    } catch (e) {
      debugPrint('[NotificationEngine] Permission request error: $e');
    }
  }

  Future<void> scheduleRoleBasedNotifications(String roleName) async {
    // ponytail: notifikasi jadwal harian murni dikirim oleh backend via FCM; bersihkan alarm lokal legacy
    if (kIsWeb || (!Platform.isAndroid && !Platform.isIOS)) return;
    try {
      await _flutterLocalNotificationsPlugin.cancel(id: 1);
      await _flutterLocalNotificationsPlugin.cancel(id: 2);
      await _flutterLocalNotificationsPlugin.cancel(id: 3);
      debugPrint('[NotificationEngine] Cleaned up legacy local alarms. Relying purely on backend FCM.');
    } catch (e) {
      debugPrint('[NotificationEngine] Cleanup error: $e');
    }
  }

  // ponytail: Notifikasi murni dari server backend via FCM.
  // Dilarang membuat notifikasi tiruan di mobile agar data 100% konsisten dari backend.
  Future<void> showPointsNotification(int points) async {}
  Future<void> showActivationNotification(int points) async {}
  Future<void> showPunishmentNotification(int points) async {}
  Future<void> showResetPendingNotification() async {}
  Future<void> showResetCompletedNotification({String? binName}) async {}
  Future<void> showSubmitLogTimbanganNotification({
    required double weightKg,
    required String type,
  }) async {}
  Future<void> showProkerNotification({
    required String title,
    required String body,
  }) async {}

  Future<void> showGenericNotification({
    required int id,
    required String title,
    required String body,
    Color color = const Color(0xFF0284C7),
    String? payload,
  }) async {
    try {
      final AndroidNotificationDetails androidDetails =
          AndroidNotificationDetails(
            'backend_channel',
            'Notifikasi Sistem Backend',
            channelDescription: 'Notifikasi resmi dari backend & atasan',
            importance: Importance.max,
            priority: Priority.high,
            icon: '@mipmap/ic_launcher',
            color: color,
          );
      final NotificationDetails platformDetails = NotificationDetails(
        android: androidDetails,
      );

      await _flutterLocalNotificationsPlugin.show(
        id: id,
        title: title,
        body: body,
        payload: payload,
        notificationDetails: platformDetails,
      );
    } catch (e) {
      debugPrint(
        '[NotificationEngine] Failed to show generic notification: $e',
      );
    }
  }

  Future<void> showOngoingKKNNotification(String message) async {
    try {
      const AndroidNotificationDetails androidDetails =
          AndroidNotificationDetails(
            'kkn_location_channel',
            'Pantauan Lokasi KKN',
            channelDescription:
                'Notifikasi persisten saat pemantauan lokasi aktif',
            importance: Importance.low,
            priority: Priority.low,
            icon: '@mipmap/ic_launcher',
            ongoing: true, // Tidak bisa di-swipe (harus di-cancel oleh sistem)
            autoCancel: false,
            color: Color(0xFF2196F3), // Blue
          );
      const NotificationDetails platformDetails = NotificationDetails(
        android: androidDetails,
      );

      await _flutterLocalNotificationsPlugin.show(
        id: 999, // ID khusus untuk tracking persisten
        title: 'Pemantauan GPS Aktif 📍',
        body: message,
        notificationDetails: platformDetails,
      );
    } catch (e) {
      debugPrint(
        '[NotificationEngine] Failed to show ongoing notification: $e',
      );
    }
  }

  Future<void> cancelOngoingKKNNotification() async {
    try {
      await _flutterLocalNotificationsPlugin.cancel(id: 999);
    } catch (e) {
      debugPrint(
        '[NotificationEngine] Failed to cancel ongoing notification: $e',
      );
    }
  }

  /// Update notifikasi persisten saat presensi aktif dengan durasi real-time.
  /// [accumulatedSeconds] durasi total di zona, [targetMinutes] target durasi wajib.
  /// [isInsideZone] menentukan ikon dan teks status.
  Future<void> updateKKNOngoingNotification({
    required int accumulatedSeconds,
    required int targetMinutes,
    required bool isInsideZone,
  }) async {
    try {
      final mins = accumulatedSeconds ~/ 60;
      final secs = accumulatedSeconds % 60;
      final timeStr = '$mins:${secs.toString().padLeft(2, '0')}';
      final title = isInsideZone
          ? '⏱ Presensi KKN Aktif'
          : '⏸ Waktu Dihentikan — Di Luar Zona';
      final body = isInsideZone
          ? 'Di dalam zona • $timeStr / $targetMinutes menit'
          : 'Kembali ke zona untuk melanjutkan • $timeStr / $targetMinutes menit';

      const AndroidNotificationDetails androidDetails =
          AndroidNotificationDetails(
            'kkn_location_channel',
            'Pantauan Lokasi KKN',
            channelDescription:
                'Notifikasi persisten saat pemantauan lokasi aktif',
            importance: Importance.low,
            priority: Priority.low,
            icon: '@mipmap/ic_launcher',
            ongoing: true,
            autoCancel: false,
            color: Color(0xFF2196F3),
          );
      await _flutterLocalNotificationsPlugin.show(
        id: 999,
        title: title,
        body: body,
        notificationDetails: const NotificationDetails(android: androidDetails),
      );
    } catch (e) {
      debugPrint(
        '[NotificationEngine] Failed to update ongoing notification: $e',
      );
    }
  }

  /// Tampilkan notifikasi persisten saat kegiatan KKN di-JEDA.
  /// Notifikasi ini tetap muncul meski background service sudah berhenti.
  /// [accumulatedSeconds] durasi yang sudah tercapai saat jeda.
  /// [targetMinutes] target durasi wajib kegiatan.
  Future<void> showKKNPausedNotification({
    required int accumulatedSeconds,
    required int targetMinutes,
  }) async {
    try {
      final mins = accumulatedSeconds ~/ 60;
      final secs = accumulatedSeconds % 60;
      final timeStr = '$mins:${secs.toString().padLeft(2, '0')}';

      const AndroidNotificationDetails androidDetails =
          AndroidNotificationDetails(
            'kkn_location_channel',
            'Pantauan Lokasi KKN',
            channelDescription:
                'Notifikasi persisten saat pemantauan lokasi aktif',
            importance: Importance.defaultImportance,
            priority: Priority.defaultPriority,
            icon: '@mipmap/ic_launcher',
            ongoing: true, // Tetap muncul, tidak bisa di-swipe
            autoCancel: false,
            color: Color(0xFFFFA000), // Amber — menandakan status jeda
          );

      await _flutterLocalNotificationsPlugin.show(
        id: 999,
        title: '⏸ Presensi KKN Dijeda',
        body:
            'Durasi tercatat: $timeStr / $targetMinutes menit. Buka aplikasi untuk melanjutkan.',
        notificationDetails: const NotificationDetails(android: androidDetails),
      );
    } catch (e) {
      debugPrint('[NotificationEngine] Failed to show paused notification: $e');
    }
  }

  /// Bersihkan seluruh notifikasi di System Tray HP saat logout
  Future<void> cancelAll() async {
    try {
      await _flutterLocalNotificationsPlugin.cancelAll();
    } catch (e) {
      debugPrint('Silenced error: $e');
    }
  }
}
