/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'core/theme/app_theme.dart';
import 'core/router/app_router.dart';
import 'core/constants/app_strings.dart';
import 'core/utils/platform_utils.dart';

/// Global navigator key — digunakan oleh Dio Interceptor untuk
/// force-navigate ke Login saat sesi habis (refresh token expired).
final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

/// Entry point aplikasi TrashCare — Mobile (Warga).
///
/// Arsitektur: Clean Architecture + Riverpod
/// - Presentation Layer: lib/presentation/
/// - Domain Layer:       lib/domain/
/// - Data Layer:         lib/data/
///
/// Mode saat ini: MOCK/DEVELOPMENT — semua data bersifat lokal.
/// Tidak ada koneksi ke API atau backend.
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

  runApp(
    // ProviderScope adalah root Riverpod — wajib membungkus seluruh app
    const ProviderScope(child: PilahSampahApp()),
  );
}

class PilahSampahApp extends StatelessWidget {
  const PilahSampahApp({super.key});

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
