import 'package:flutter/material.dart';
import 'dart:ui';
import 'dart:convert';
import 'app/core/utils/safe_storage.dart';
import 'app/core/values/app_config.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'app/core/theme/app_theme.dart';
import 'app/routes/app_routes.dart';
import 'app/routes/app_pages.dart';
import 'app/core/values/app_strings.dart';

import 'app/core/utils/platform_utils.dart';
import 'app/modules/scan/controllers/scan_controller.dart';
import 'app/modules/notifikasi/controllers/notifikasi_controller.dart';
import 'app/modules/riwayat/controllers/riwayat_controller.dart';
import 'app/data/services/local_notification_service.dart';
import 'app/data/services/notification_engine.dart';
import 'app/modules/mahasiswa/services/kkn_background_task_handler.dart';
import 'package:flutter_foreground_task/flutter_foreground_task.dart';

import 'app/data/models/user_entity.dart';
import 'app/modules/mahasiswa/controllers/location_ping_controller.dart';
import 'app/modules/mahasiswa/controllers/kkn_location_controller.dart';
import 'app/modules/notifikasi/controllers/warga_notifikasi_controller.dart';
import 'app/modules/mahasiswa/controllers/mahasiswa_notifikasi_controller.dart';
import 'app/modules/petugas_pemilahan/controllers/petugas_pemilahan_notifikasi_controller.dart';
import 'app/modules/auth/controllers/auth_controller.dart';
import 'app/data/services/local_notification_cache_service.dart';
import 'app/data/services/firebase_notification_service.dart';

/// Global navigator key â€” digunakan oleh Dio Interceptor untuk
/// force-navigate ke Login saat sesi habis (refresh token expired).
final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

/// Background message handler â€” harus top-level function (bukan method class).
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  debugPrint('[FCM Background] ${message.notification?.title}: ${message.notification?.body}');
  if (message.notification != null) {
    try {
      final title = message.notification?.title ?? 'Notifikasi Baru';
      final body = message.notification?.body ?? '';
      final type = message.data['type'] ?? 'SYSTEM';
      
      String role = message.data['role'] ?? 'WARGA';
      String userId = message.data['userId'] ?? 'system';

      try {
        const storage = SafeStorage();
        final userData = await storage.read(key: AppConfig.userDataKey);
        if (userData != null) {
          final decoded = jsonDecode(userData);
          userId = decoded['id']?.toString() ?? userId;
          role = (decoded['role'] ?? decoded['userRole'] ?? decoded['roleName'] ?? role).toString().toUpperCase();
        }
      } catch (_) {}
      
      await FirebaseNotificationService().saveNotification(
        userId: userId,
        role: role,
        title: title,
        desc: body,
        type: type,
        id: message.data['notificationId']?.toString() ?? message.messageId,
      );
    } catch (e) {
      debugPrint('[FCM Background] Save error: $e');
    }
  }
}

/// Entry point aplikasi Berseka â€” Mobile (Warga).
///
/// Arsitektur: Clean Architecture + Riverpod
/// - Presentation Layer: lib/app/modules/
/// - Domain Layer:       lib/app/data/models/ & lib/app/data/repositories/
/// - Data Layer:         lib/app/data/
///
/// Platform support: Android, iOS, Web, Windows, macOS, Linux.
void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Inisialisasi Foreground Task untuk background GPS tracking KKN
  FlutterForegroundTask.initCommunicationPort();
  initKknForegroundTask();

  // Mencegah "Red Screen of Death" tampil ke pengguna dan menggunakan Snackbar
  ErrorWidget.builder = (FlutterErrorDetails details) {
    return Container(
      color: Colors.transparent,
      child: const Center(
        child: Icon(Icons.error_outline, color: Colors.red, size: 24),
      ),
    );
  };

  FlutterError.onError = (FlutterErrorDetails details) {
    FlutterError.presentError(details);
    // Kita hapus Snackbar di sini karena error layout/tampilan yang tidak fatal 
    // akan langsung ditangani oleh ErrorWidget.builder secara diam-diam.
    // Menampilkan Snackbar untuk error layout hanya akan mengganggu kenyamanan pengguna.
  };

  PlatformDispatcher.instance.onError = (error, stack) {
    debugPrint('Async Error: $error');
    // We intentionally removed the global snackbar here because it causes 
    // false-positive "Kendala sistem" errors to appear when background futures 
    // or non-fatal widget errors occur, confusing users when the feature actually succeeds.
    return true;
  };

  // Poppins sebagai font default seluruh app (ui_ux_flow.md Â§1)
  GoogleFonts.config.allowRuntimeFetching = true;

  // Inisialisasi locale Indonesia untuk intl formatting
  await initializeDateFormatting('id_ID', null);

  // Lock orientasi ke portrait hanya di mobile (Android & iOS).
  // SystemChrome.setPreferredOrientations tidak tersedia di desktop/web.
  if (PlatformUtils.isMobile) {
    await SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
      DeviceOrientation.portraitDown,
    ]);
  }


  // â”€â”€ Firebase Cloud Messaging Setup â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // CATATAN: Memerlukan konfigurasi Firebase project terlebih dahulu:
  // 1. Jalankan: flutterfire configure
  // 2. Pastikan google-services.json (Android) dan GoogleService-Info.plist (iOS) sudah ada
  // 3. Tambahkan firebase_core ke pubspec.yaml dan import firebase_options.dart
  //
  // Saat ini, inisialisasi dibungkus try-catch agar app tidak crash
  // jika Firebase belum dikonfigurasi.
  try {
    // Daftarkan background handler
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
    debugPrint('[FCM] Firebase Messaging ready');
  } catch (e) {
    debugPrint('[FCM] Firebase not configured yet: $e');
  }

  // Inisialisasi Local Notification & Jadwalkan Reminders
  try {
    await LocalNotificationService.instance.init(navigatorKey);
    // Background fixed schedule notification engine (New Requirement)
    await NotificationEngine().init(navigatorKey: navigatorKey);
  } catch (e) {
    debugPrint('[LocalNotif] Setup failed: $e');
  }

  runApp(
    // ProviderScope adalah root Riverpod â€” wajib membungkus seluruh app
    const ProviderScope(child: PilahSampahApp()),
  );
}

class PilahSampahApp extends ConsumerStatefulWidget {
  const PilahSampahApp({super.key});

  @override
  ConsumerState<PilahSampahApp> createState() => _PilahSampahAppState();
}

class _PilahSampahAppState extends ConsumerState<PilahSampahApp> {
  @override
  void initState() {
    super.initState();
    _setupFCMForeground();
  }

  void _setupFCMForeground() {
    try {
      FirebaseMessaging.onMessage.listen((RemoteMessage message) async {
        final title = message.notification?.title ??
            message.data['title']?.toString() ??
            message.data['header']?.toString() ??
            'Notifikasi Baru';
        final body = message.notification?.body ??
            message.data['desc']?.toString() ??
            message.data['body']?.toString() ??
            message.data['message']?.toString() ??
            '';
        final type = (message.data['event']?.toString() ??
                message.data['type']?.toString() ??
                'INFO')
            .toUpperCase();

        final titleUpper = title.toUpperCase();
        final bodyUpper = body.toUpperCase();

        // Blokir sama sekali notifikasi penjemputan & seed dummy dari System Notification Tray
        if (type.contains('JADWAL') ||
            type.contains('JEMPUT') ||
            type.contains('PENGANGKUTAN') ||
            titleUpper.contains('JADWAL') ||
            titleUpper.contains('JEMPUT') ||
            titleUpper.contains('PENGANGKUTAN') ||
            titleUpper.contains('TERDAPAT TEMPAT SAMPAH WARGA') ||
            titleUpper.contains('HARUS DIAMBIL') ||
            bodyUpper.contains('HARUS DIAMBIL') ||
            bodyUpper.contains('ORG004520')) {
          debugPrint('[FCM Foreground] Ignored obsolete pickup/seed notification: $title');
          return;
        }

        debugPrint('[FCM Foreground] Menerima notifikasi: $title');

        // Catat push notification ke FirebaseNotificationService & LocalCache agar tersimpan di disk Halaman Notifikasi in-app
        final user = ref.read(authProvider).user;
        if (user != null && (title.isNotEmpty || body.isNotEmpty)) {
          final notifId = message.data['notificationId']?.toString() ?? message.messageId ?? 'fcm_${DateTime.now().millisecondsSinceEpoch}';
          
          await FirebaseNotificationService().saveNotification(
            userId: user.id,
            role: user.role.name,
            title: title,
            desc: body,
            type: type,
            id: notifId,
          );

          LocalNotificationCacheService().addNotification(
            userId: user.id,
            role: user.role.name,
            title: title,
            desc: body,
            type: type,
            id: notifId,
          );
        }

        final isPoin = type.contains('POIN') || titleUpper.contains('POIN');
        final payloadRoute = isPoin ? 'ROUTE_POIN' : 'ROUTE_NOTIF';

        // Tampilkan notifikasi sistem di luar aplikasi (system notification tray)
        NotificationEngine().showGenericNotification(
          id: message.messageId.hashCode,
          title: title,
          body: body,
          payload: payloadRoute,
        );

        // Selalu refresh daftar notifikasi seluruh role saat ada push masuk
        ref.invalidate(notificationsProvider);
        ref.invalidate(wargaNotificationsProvider);
        ref.invalidate(mahasiswaNotificationsProvider);
        ref.invalidate(petugasPemilahanNotificationsProvider);

        // Jika FCM membawa data payload event, invalidate provider terkait
        // agar data di Beranda, Riwayat, dan Poin langsung segar.
        final event = message.data['event'] as String?;
        if (event == 'TRANSACTION_SUCCESS') {
          ref.invalidate(wasteLogsProvider);
          ref.invalidate(totalPointsProvider);
          ref.invalidate(pointHistoryProvider);
          ref.invalidate(dailyPointsProvider);
          ref.invalidate(binsProvider);
        } else if (event == 'BIN_EMPTIED' || event == 'RESET_APPROVED') {
          ref.invalidate(binsProvider);
        }
      });

      // Handle tap on notification when app is in background
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        debugPrint('[FCM Background Tap] Tapped notification: ${message.notification?.title}');
        _handleNotificationRoute(message);
      });

      // Handle tap on notification when app is terminated
      FirebaseMessaging.instance.getInitialMessage().then((RemoteMessage? message) {
        if (message != null) {
          debugPrint('[FCM Terminated Tap] Tapped notification: ${message.notification?.title}');
          // Kasih delay sedikit agar app selesai render dulu
          Future.delayed(const Duration(seconds: 2), () {
            _handleNotificationRoute(message);
          });
        }
      });
    } catch (e) {
      debugPrint('[FCM Foreground Setup] Error: $e');
    }
  }

  void _handleNotificationRoute(RemoteMessage message) async {
    const storage = SafeStorage();
    final userData = await storage.read(key: AppConfig.userDataKey);
    
    String role = 'WARGA'; // Default

    if (userData != null) {
      try {
        final decoded = jsonDecode(userData);
        role = (decoded['role'] ?? decoded['userRole'] ?? decoded['roleName'] ?? 'WARGA').toString().toUpperCase();
      } catch (_) {}
    }

    if (role == 'MAHASISWA_KKN' || role == 'MAHASISWA') {
      navigatorKey.currentState?.pushNamed(AppRoutes.mahasiswaNotifikasi);
    } else if (role == 'PETUGAS_RESIDU' || role == 'PETUGAS_PEMILAHAN') {
      navigatorKey.currentState?.pushNamed(AppRoutes.petugasNotifikasi);
    } else {
      navigatorKey.currentState?.pushNamed(AppRoutes.notifikasi);
    }
  }

  @override
  Widget build(BuildContext context) {
    ref.listen<AuthState>(authProvider, (previous, next) {
      if (next.user?.role == UserRole.mahasiswaKkn) {
        // GPS tidak lagi auto-start saat login.
        // GPS hanya aktif saat mahasiswa menekan "Mulai Kegiatan".
      } else if (previous?.user?.role == UserRole.mahasiswaKkn && next.user == null) {
        ref.read(locationPingControllerProvider.notifier).stopTracking();
        ref.read(kknLocationProvider.notifier).stopTracking();
      }
    });

    return MaterialApp(
      navigatorKey: navigatorKey,
      title: AppStrings.appName,
      debugShowCheckedModeBanner: false,

      // Light Mode Only â€” sesuai ui_ux_flow.md Â§1
      theme: AppTheme.lightTheme,
      // Tidak ada darkTheme â€” sesuai spesifikasi

      // Poppins sebagai font default â€” semua Text() otomatis Poppins
      // bahkan yang tidak pakai Theme.of(context).textTheme
      builder: (context, child) {
        return DefaultTextStyle(
          style: GoogleFonts.poppins(
            fontSize: 14,
            color: const Color(0xFF191C1E),
          ),
          child: child ?? const SizedBox.shrink(),
        );
      },

      // Routing terpusat
      initialRoute: AppRoutes.splash,
      onGenerateRoute: AppPages.generateRoute,
    );
  }
}

