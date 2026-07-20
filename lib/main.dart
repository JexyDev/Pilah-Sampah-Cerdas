import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'core/theme/app_theme.dart';
import 'core/router/app_router.dart';
import 'core/constants/app_strings.dart';
import 'core/utils/platform_utils.dart';
import 'presentation/providers/bin_provider.dart';
import 'presentation/providers/notification_provider.dart';
import 'presentation/providers/waste_log_provider.dart';

/// Global navigator key — digunakan oleh Dio Interceptor untuk
/// force-navigate ke Login saat sesi habis (refresh token expired).
final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

/// Background message handler — harus top-level function (bukan method class).
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Tidak perlu inisialisasi ulang Firebase di sini jika sudah dilakukan di main()
  // Notifikasi background ditampilkan otomatis oleh sistem operasi
  debugPrint('[FCM Background] ${message.notification?.title}: ${message.notification?.body}');
}

/// Entry point aplikasi Pilah Sampah Cerdas — Mobile (Warga).
///
/// Arsitektur: Clean Architecture + Riverpod
/// - Presentation Layer: lib/presentation/
/// - Domain Layer:       lib/domain/
/// - Data Layer:         lib/data/
///
/// Platform support: Android, iOS, Web, Windows, macOS, Linux.
void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Poppins sebagai font default seluruh app (ui_ux_flow.md §1)
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

  // Status bar transparan — hanya relevan di mobile
  if (PlatformUtils.isMobile) {
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.dark,
      ),
    );
  }

  // ── Firebase Cloud Messaging Setup ─────────────────────────────────────────
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

  runApp(
    // ProviderScope adalah root Riverpod — wajib membungkus seluruh app
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
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        debugPrint('[FCM Foreground] Menerima notifikasi: ${message.notification?.title}');
        // Selalu refresh daftar notifikasi saat ada push masuk
        ref.invalidate(notificationsProvider);

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
    } catch (e) {
      debugPrint('[FCM Foreground Setup] Error: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      navigatorKey: navigatorKey,
      title: AppStrings.appName,
      debugShowCheckedModeBanner: false,

      // Light Mode Only — sesuai ui_ux_flow.md §1
      theme: AppTheme.lightTheme,
      // Tidak ada darkTheme — sesuai spesifikasi

      // Poppins sebagai font default — semua Text() otomatis Poppins
      // bahkan yang tidak pakai Theme.of(context).textTheme
      builder: (context, child) {
        return DefaultTextStyle(
          style: GoogleFonts.plusJakartaSans(
            fontSize: 14,
            color: const Color(0xFF191C1E),
          ),
          child: child!,
        );
      },

      // Routing terpusat
      initialRoute: AppRoutes.splash,
      onGenerateRoute: AppRouter.onGenerateRoute,
    );
  }
}
