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
      final String currentTimeZone = await FlutterTimezone.getLocalTimezone();
      tz.setLocalLocation(tz.getLocation(currentTimeZone));
      
      const AndroidInitializationSettings initializationSettingsAndroid =
          AndroidInitializationSettings('@mipmap/ic_launcher');

      const InitializationSettings initializationSettings = InitializationSettings(
        android: initializationSettingsAndroid,
      );

      await _flutterLocalNotificationsPlugin.initialize(
        initializationSettings,
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
      // Hapus jadwal lama agar tidak dobel jika logic berubah
      await _flutterLocalNotificationsPlugin.cancel(1);
      await _flutterLocalNotificationsPlugin.cancel(2);

      const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
        'schedule_channel',
        'Jadwal Penjemputan',
        channelDescription: 'Notifikasi jadwal operasional penjemputan',
        importance: Importance.max,
        priority: Priority.high,
        icon: '@mipmap/ic_launcher',
      );
      const NotificationDetails platformDetails = NotificationDetails(
        android: androidDetails,
      );

      // Notifikasi Pagi: 07:00
      await _flutterLocalNotificationsPlugin.zonedSchedule(
        id: 1,
        title: 'Waktunya Buang Sampah! 🚛',
        body: 'Petugas akan segera tiba untuk penjemputan pagi (06:00 - 08:00).',
        scheduledDate: _nextInstanceOfTime(7, 0),
        notificationDetails: platformDetails,
        androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
        matchDateTimeComponents: DateTimeComponents.time,
      );

      // Notifikasi Sore: 16:00
      await _flutterLocalNotificationsPlugin.zonedSchedule(
        id: 2,
        title: 'Waktunya Buang Sampah! 🚛',
        body: 'Petugas akan segera tiba untuk penjemputan sore (16:00 - 18:00).',
        scheduledDate: _nextInstanceOfTime(16, 0),
        notificationDetails: platformDetails,
        androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
        matchDateTimeComponents: DateTimeComponents.time,
      );
      
      debugPrint('[NotificationEngine] Scheduled successfully.');
    } catch (e) {
      debugPrint('[NotificationEngine] Schedule failed: $e');
    }
  }

  tz.TZDateTime _nextInstanceOfTime(int hour, int minute) {
    final tz.TZDateTime now = tz.TZDateTime.now(tz.local);
    tz.TZDateTime scheduledDate =
        tz.TZDateTime(tz.local, now.year, now.month, now.day, hour, minute);
    if (scheduledDate.isBefore(now)) {
      scheduledDate = scheduledDate.add(const Duration(days: 1));
    }
    return scheduledDate;
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
}
