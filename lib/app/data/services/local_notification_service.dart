import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/data/latest_all.dart' as tz;
import 'package:timezone/timezone.dart' as tz;
import '../../routes/app_routes.dart';

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
      linux: LinuxInitializationSettings(defaultActionName: 'Open'),
    );

    await _notificationsPlugin.initialize(
      settings: initSettings,
      onDidReceiveNotificationResponse: (NotificationResponse response) {
        debugPrint('[LocalNotif] Tapped payload: ${response.payload}');
        if (response.payload == 'scan_sampah') {
          // Navigasi ke scan sampah via navigator key
          if (navigatorKey.currentState != null) {
            navigatorKey.currentState!.pushNamed(AppRoutes.scan);
          }
        }
      },
    );

    final androidPlugin = _notificationsPlugin
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
    }

    _isInitialized = true;
    debugPrint('[LocalNotif] Initialized successfully');
  }

  /// Batalkan sisa jadwal lokal lama — notifikasi jadwal harian kini murni dikirim backend via FCM
  Future<void> scheduleDailyReminders() async {
    if (!_isInitialized) return;
    await _notificationsPlugin.cancelAll();
    debugPrint('[LocalNotif] Cleared legacy daily reminders. Driven purely by backend.');
  }
}
