import 'dart:io';
import 'dart:ui';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/data/latest_all.dart' as tz;
import 'package:timezone/timezone.dart' as tz;
import 'package:flutter_timezone/flutter_timezone.dart';
import 'package:permission_handler/permission_handler.dart';

class NotificationEngine {
  static final NotificationEngine _instance = NotificationEngine._internal();
  factory NotificationEngine() => _instance;
  NotificationEngine._internal();

  final FlutterLocalNotificationsPlugin _flutterLocalNotificationsPlugin =
      FlutterLocalNotificationsPlugin();

  bool _isInitialized = false;

  Future<void> init() async {
    if (_isInitialized || kIsWeb) return;

    try {
      // Setup timezone
      tz.initializeTimeZones();
      final String currentTimeZone = (await FlutterTimezone.getLocalTimezone()).identifier;
      tz.setLocalLocation(tz.getLocation(currentTimeZone));
      
      const AndroidInitializationSettings initializationSettingsAndroid =
          AndroidInitializationSettings('@mipmap/ic_launcher');

      const InitializationSettings initializationSettings = InitializationSettings(
        android: initializationSettingsAndroid,
      );

      await _flutterLocalNotificationsPlugin.initialize(
        settings: initializationSettings,
      );

      _isInitialized = true;

      await _requestPermissions();
      await _scheduleFixedNotifications();
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

  Future<void> _scheduleFixedNotifications() async {
    try {
      // Hapus & batalkan notifikasi jadwal buang sampah lokal (pagi & sore)
      await _flutterLocalNotificationsPlugin.cancel(id: 1);
      await _flutterLocalNotificationsPlugin.cancel(id: 2);
      debugPrint('[NotificationEngine] Fixed pickup schedules cancelled successfully.');
    } catch (e) {
      debugPrint('[NotificationEngine] Schedule cancel failed: $e');
    }
  }

  Future<void> showPointsNotification(int points) async {
    try {
      const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
        'transaction_channel',
        'Transaksi Berhasil',
        channelDescription: 'Notifikasi poin dari setoran sampah',
        importance: Importance.max,
        priority: Priority.high,
        icon: '@mipmap/ic_launcher',
        color: Color(0xFF4CAF50), // Green color
      );
      const NotificationDetails platformDetails = NotificationDetails(
        android: androidDetails,
      );

      await _flutterLocalNotificationsPlugin.show(
        id: 3, // ID untuk notif point
        title: 'Setor Sampah Berhasil! 🎉',
        body: 'Hebat! Anda mendapatkan tambahan +$points poin.',
        notificationDetails: platformDetails,
      );
    } catch (e) {
      debugPrint('[NotificationEngine] Failed to show point notification: $e');
    }
  }

  Future<void> showActivationNotification(int points) async {
    try {
      const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
        'activation_channel',
        'Aktivasi Berhasil',
        channelDescription: 'Notifikasi aktivasi tong sampah',
        importance: Importance.max,
        priority: Priority.high,
        icon: '@mipmap/ic_launcher',
        color: Color(0xFF4CAF50), // Green color
      );
      const NotificationDetails platformDetails = NotificationDetails(
        android: androidDetails,
      );

      await _flutterLocalNotificationsPlugin.show(
        id: 4, // ID untuk notif aktivasi
        title: 'Aktivasi Bin Berhasil! 🎉',
        body: 'Selamat! Tong Anda sudah aktif. Anda mendapatkan +$points poin.',
        notificationDetails: platformDetails,
      );
    } catch (e) {
      debugPrint('[NotificationEngine] Failed to show activation notification: $e');
    }
  }

  Future<void> showPunishmentNotification(int points) async {
    try {
      const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
        'punishment_channel',
        'Penalti & Pengurangan Poin',
        channelDescription: 'Notifikasi penalti karena tidak menyetor sampah',
        importance: Importance.max,
        priority: Priority.high,
        icon: '@mipmap/ic_launcher',
        color: Color(0xFFEF4444), // Red color
      );
      const NotificationDetails platformDetails = NotificationDetails(
        android: androidDetails,
      );

      await _flutterLocalNotificationsPlugin.show(
        id: 5, // ID untuk notif penalti/punishment
        title: 'Penalti: Poin Berkurang! ⚠️',
        body: 'Anda tidak melakukan setor sampah hari ini. Poin Anda berkurang -$points poin.',
        notificationDetails: platformDetails,
      );
    } catch (e) {
      debugPrint('[NotificationEngine] Failed to show punishment notification: $e');
    }
  }

  Future<void> showResetPendingNotification() async {
    try {
      const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
        'reset_channel',
        'Pengajuan Pengosongan',
        channelDescription: 'Notifikasi status pengajuan pengosongan tong',
        importance: Importance.max,
        priority: Priority.high,
        icon: '@mipmap/ic_launcher',
        color: Color(0xFFEAB308), // Yellow color
      );
      const NotificationDetails platformDetails = NotificationDetails(
        android: androidDetails,
      );

      await _flutterLocalNotificationsPlugin.show(
        id: 6,
        title: 'Pengajuan Pengosongan Terkirim ⏳',
        body: 'Pengajuan pengosongan tong sampah Anda sedang diproses oleh petugas.',
        notificationDetails: platformDetails,
      );
    } catch (e) {
      debugPrint('[NotificationEngine] Failed to show reset notification: $e');
    }
  }

  Future<void> showSubmitLogTimbanganNotification({
    required double weightKg,
    required String type,
  }) async {
    try {
      const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
        'timbangan_channel',
        'Log Timbangan Residu',
        channelDescription: 'Notifikasi konfirmasi pengunggahan timbangan residu',
        importance: Importance.max,
        priority: Priority.high,
        icon: '@mipmap/ic_launcher',
        color: Color(0xFF0D9488), // Teal color
      );
      const NotificationDetails platformDetails = NotificationDetails(
        android: androidDetails,
      );

      await _flutterLocalNotificationsPlugin.show(
        id: DateTime.now().millisecondsSinceEpoch.remainder(100000),
        title: 'Log Timbangan Berhasil Disimpan! ⚖️',
        body: 'Log timbangan $type seberat ${weightKg.toStringAsFixed(1)} kg berhasil diunggah ke server.',
        notificationDetails: platformDetails,
      );
    } catch (e) {
      debugPrint('[NotificationEngine] Failed to show timbangan notification: $e');
    }
  }

  Future<void> showGenericNotification({
    required int id,
    required String title,
    required String body,
    Color color = const Color(0xFF0284C7),
  }) async {
    try {
      final AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
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
        notificationDetails: platformDetails,
      );
    } catch (e) {
      debugPrint('[NotificationEngine] Failed to show generic notification: $e');
    }
  }

  /// Bersihkan seluruh notifikasi di System Tray HP saat logout
  Future<void> cancelAll() async {
    try {
      await _flutterLocalNotificationsPlugin.cancelAll();
    } catch (_) {}
  }
}
