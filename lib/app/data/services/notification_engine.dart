import 'dart:io';
import 'dart:ui';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/data/latest_all.dart' as tz;
import 'package:timezone/timezone.dart' as tz;

import 'package:permission_handler/permission_handler.dart';

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

      const InitializationSettings initializationSettings = InitializationSettings(
        android: initializationSettingsAndroid,
      );

      await _flutterLocalNotificationsPlugin.initialize(
        settings: initializationSettings,
        onDidReceiveNotificationResponse: (NotificationResponse response) {
          debugPrint('[NotificationEngine] Notification tapped, payload: ${response.payload}');
          if (navigatorKey != null && navigatorKey.currentState != null && response.payload != null) {
            if (response.payload == 'ROUTE_POIN') {
              navigatorKey.currentState!.pushNamed('/poin');
            } else if (response.payload == 'ROUTE_HISTORY') {
              navigatorKey.currentState!.pushNamed('/mahasiswa/riwayat');
            }
          }
        },
      );

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
    try {
      await _flutterLocalNotificationsPlugin.cancel(id: 1);
      await _flutterLocalNotificationsPlugin.cancel(id: 2);
      await _flutterLocalNotificationsPlugin.cancel(id: 3); // For petugas

      final tz.TZDateTime now = tz.TZDateTime.now(tz.local);

      if (roleName == 'WARGA' || roleName == 'ADMIN') {
        // 1. Pengingat Memilah Sampah Pagi (Jadwal 07:00-08:00 WIB, Notif 06:40 WIB)
        tz.TZDateTime scheduledPagi = tz.TZDateTime(tz.local, now.year, now.month, now.day, 6, 40);
        if (scheduledPagi.isBefore(now)) scheduledPagi = scheduledPagi.add(const Duration(days: 1));

        const AndroidNotificationDetails androidPagi = AndroidNotificationDetails(
          'reminder_pagi_channel', 'Jadwal Buang Sampah Pagi',
          importance: Importance.max, priority: Priority.high, icon: '@mipmap/ic_launcher', color: Color(0xFF0EA5E9),
        );

        await _flutterLocalNotificationsPlugin.zonedSchedule(
          id: 1, title: 'Jadwal Buang Sampah Pagi! 🌅', body: 'Pengingat: Jadwal buang sampah pagi (07:00-08:00) 20 menit lagi. Jangan lupa scan & buang sampah agar terhindar dari penalti poin!',
          scheduledDate: scheduledPagi, notificationDetails: const NotificationDetails(android: androidPagi),
          androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle, matchDateTimeComponents: DateTimeComponents.time,
        );

        // 2. Pengingat Sore (Jadwal 16:00-17:00 WIB, Notif 15:40 WIB)
        tz.TZDateTime scheduledSore = tz.TZDateTime(tz.local, now.year, now.month, now.day, 15, 40);
        if (scheduledSore.isBefore(now)) scheduledSore = scheduledSore.add(const Duration(days: 1));

        const AndroidNotificationDetails androidSore = AndroidNotificationDetails(
          'reminder_sore_channel', 'Jadwal Buang Sampah Sore',
          importance: Importance.max, priority: Priority.high, icon: '@mipmap/ic_launcher', color: Color(0xFF0EA5E9),
        );

        await _flutterLocalNotificationsPlugin.zonedSchedule(
          id: 2, title: 'Jadwal Buang Sampah Sore! 🌇', body: 'Pengingat: Jadwal buang sampah sore (16:00-17:00) 20 menit lagi. Jangan lupa scan & buang sampah agar terhindar dari penalti poin!',
          scheduledDate: scheduledSore, notificationDetails: const NotificationDetails(android: androidSore),
          androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle, matchDateTimeComponents: DateTimeComponents.time,
        );
      } else if (roleName == 'PETUGAS_PEMILAHAN' || roleName == 'PETUGAS_RESIDU') {
        // 3. Pengingat Petugas Pemilah (06:00 WIB)
        tz.TZDateTime scheduledPetugas = tz.TZDateTime(tz.local, now.year, now.month, now.day, 6, 0);
        if (scheduledPetugas.isBefore(now)) scheduledPetugas = scheduledPetugas.add(const Duration(days: 1));

        const AndroidNotificationDetails androidPetugas = AndroidNotificationDetails(
          'reminder_petugas_channel', 'Jadwal Cek Antrean & Timbangan',
          importance: Importance.max, priority: Priority.high, icon: '@mipmap/ic_launcher', color: Color(0xFF4CAF50),
        );

        await _flutterLocalNotificationsPlugin.zonedSchedule(
          id: 3, title: 'Waktunya Bertugas! 🚛', body: 'Pengingat: Cek antrean & input timbangan warga hari ini. Tidak ada input seharian = penalti pengurangan poin.',
          scheduledDate: scheduledPetugas, notificationDetails: const NotificationDetails(android: androidPetugas),
          androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle, matchDateTimeComponents: DateTimeComponents.time,
        );
      }

      debugPrint('[NotificationEngine] Role-based daily reminders scheduled for role: $roleName');
    } catch (e) {
      debugPrint('[NotificationEngine] Schedule error: $e');
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
        id: DateTime.now().millisecondsSinceEpoch.remainder(100000), // ID unik agar tidak overwrite cronjob

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
        channelDescription: 'Notifikasi aktivasi tempat sampah',
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
        title: 'Aktivasi Tempat Sampah Berhasil! 🎉',
        body: 'Selamat! Tempat Sampah Anda sudah aktif. Anda mendapatkan +$points poin.',
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
        title: 'Penalti: Poin Berkurang! âš ï¸',
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
        title: 'Pengajuan Pengosongan Terkirim â³',
        body: 'Pengajuan pengosongan tempat sampah Anda sedang diproses oleh petugas.',
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
        'Log Timbangan Pemilahan',
        channelDescription: 'Notifikasi konfirmasi pengunggahan timbangan pemilahan',
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
        title: 'Log Timbangan Berhasil Disimpan! âš–ï¸',
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
    String? payload,
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
        payload: payload,
        notificationDetails: platformDetails,
      );
    } catch (e) {
      debugPrint('[NotificationEngine] Failed to show generic notification: $e');
    }
  }

  Future<void> showOngoingKKNNotification(String message) async {
    try {
      const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
        'kkn_location_channel',
        'Pantauan Lokasi KKN',
        channelDescription: 'Notifikasi persisten saat pemantauan lokasi aktif',
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
      debugPrint('[NotificationEngine] Failed to show ongoing notification: $e');
    }
  }

  Future<void> cancelOngoingKKNNotification() async {
    try {
      await _flutterLocalNotificationsPlugin.cancel(id: 999);
    } catch (e) {
      debugPrint('[NotificationEngine] Failed to cancel ongoing notification: $e');
    }
  }

  /// Bersihkan seluruh notifikasi di System Tray HP saat logout
  Future<void> cancelAll() async {
    try {
      await _flutterLocalNotificationsPlugin.cancelAll();
    } catch (e) { debugPrint('Silenced error: $e'); }
  }
}

