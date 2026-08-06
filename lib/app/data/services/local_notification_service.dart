import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/data/latest_all.dart' as tz;
import 'package:timezone/timezone.dart' as tz;

class LocalNotificationService {
  LocalNotificationService._();
  static final LocalNotificationService instance = LocalNotificationService._();

  final FlutterLocalNotificationsPlugin _notificationsPlugin =
      FlutterLocalNotificationsPlugin();

  bool _isInitialized = false;

  /// Inisialisasi plugin notifikasi dan timezone
  Future<void> init(GlobalKey<NavigatorState> navigatorKey) async {
    if (_isInitialized) return;

    tz.initializeTimeZones();
    // Default location to Jakarta for timezone if platform local is missing
    tz.setLocalLocation(tz.getLocation('Asia/Jakarta'));

    const AndroidInitializationSettings androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');

    const InitializationSettings initSettings = InitializationSettings(
      android: androidSettings,
      iOS: DarwinInitializationSettings(
        requestAlertPermission: true,
        requestBadgePermission: true,
        requestSoundPermission: true,
      ),
    );

    await _notificationsPlugin.initialize(
      settings: initSettings,
      onDidReceiveNotificationResponse: (NotificationResponse response) {
        debugPrint('[LocalNotif] Tapped payload: ${response.payload}');
        if (response.payload == 'scan_sampah') {
          // Navigasi ke scan sampah via navigator key
          if (navigatorKey.currentState != null) {
            navigatorKey.currentState!.pushNamed('/scan');
          }
        }
      },
    );

    _isInitialized = true;
    debugPrint('[LocalNotif] Initialized successfully');
  }

  /// Jadwalkan pengingat jam 07:00 dan 16:00
  Future<void> scheduleDailyReminders() async {
    if (!_isInitialized) return;

    // Batalkan jadwal yang mungkin ada sebelumnya
    await _notificationsPlugin.cancelAll();

    // 1. Pengingat Pagi (07:00)
    await _scheduleDailyAtTime(
      id: 1,
      title: 'Jadwal Buang Sampah Pagi! 🌅',
      body: 'Jangan lupa buang sampah hari ini untuk dapatkan full poin.',
      hour: 7,
      minute: 0,
    );

    // 2. Pengingat Sore (16:00)
    await _scheduleDailyAtTime(
      id: 2,
      title: 'Jadwal Buang Sampah Sore! 🌇',
      body: 'Sudah buang sampah? Yuk buang sekarang sebelum jadwal terlewat.',
      hour: 16,
      minute: 0,
    );
    
    debugPrint('[LocalNotif] Reminders scheduled for 07:00 and 16:00');
  }

  Future<void> _scheduleDailyAtTime({
    required int id,
    required String title,
    required String body,
    required int hour,
    required int minute,
  }) async {
    final tz.TZDateTime now = tz.TZDateTime.now(tz.local);
    tz.TZDateTime scheduledDate = tz.TZDateTime(
      tz.local,
      now.year,
      now.month,
      now.day,
      hour,
      minute,
    );

    // Jika waktu sudah lewat hari ini, jadwalkan untuk besok
    if (scheduledDate.isBefore(now)) {
      scheduledDate = scheduledDate.add(const Duration(days: 1));
    }

    await _notificationsPlugin.zonedSchedule(
      id: id,
      title: title,
      body: body,
      scheduledDate: scheduledDate,
      notificationDetails: const NotificationDetails(
        android: AndroidNotificationDetails(
          'daily_reminders',
          'Pengingat Harian',
          channelDescription: 'Notifikasi pengingat untuk buang sampah',
          importance: Importance.max,
          priority: Priority.high,
          icon: '@mipmap/ic_launcher',
        ),
        iOS: DarwinNotificationDetails(
          presentAlert: true,
          presentBadge: true,
          presentSound: true,
        ),
      ),
      androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
      matchDateTimeComponents: DateTimeComponents.time,
      payload: 'scan_sampah',
    );
  }
}
