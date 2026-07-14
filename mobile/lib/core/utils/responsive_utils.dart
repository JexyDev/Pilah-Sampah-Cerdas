import 'package:flutter/material.dart';
import '../constants/app_dimensions.dart';

/// Utilitas responsif sesuai ui_ux_flow.md §5.2 — Breakpoint Flutter.
///
/// Compact  : < 360dp  → Font -10%, padding minimal, stack vertikal
/// Medium   : 360–479dp → Tampilan standar 1 kolom (target utama)
/// Large    : 480–599dp → Elemen bisa 2 kolom di beranda
/// Tablet   : ≥ 600dp  → Grid 2 kolom, NavigationRail (sidebar kiri)
class ResponsiveUtils {
  ResponsiveUtils._();

  static ScreenSize screenSizeOf(BuildContext context) {
    final double width = MediaQuery.of(context).size.width;
    if (width < AppDimensions.compactWidth) return ScreenSize.compact;
    if (width < AppDimensions.mediumWidth) return ScreenSize.medium;
    if (width < AppDimensions.largeWidth) return ScreenSize.large;
    return ScreenSize.tablet;
  }

  static bool isTablet(BuildContext context) =>
      screenSizeOf(context) == ScreenSize.tablet;

  static bool isCompact(BuildContext context) =>
      screenSizeOf(context) == ScreenSize.compact;

  /// Scale factor untuk font di compact mode (dikurangi 10%).
  static double fontScale(BuildContext context) =>
      isCompact(context) ? 0.9 : 1.0;

  /// Padding horizontal responsif.
  static double horizontalPadding(BuildContext context) {
    switch (screenSizeOf(context)) {
      case ScreenSize.compact:
        return AppDimensions.sm;
      case ScreenSize.tablet:
        return AppDimensions.xl;
      default:
        return AppDimensions.md;
    }
  }
}

enum ScreenSize { compact, medium, large, tablet }

/// Widget yang menampilkan layout berbeda berdasarkan ukuran layar.
/// Otomatis switch ke NavigationRail di tablet (≥600dp).
class ResponsiveLayout extends StatelessWidget {
  const ResponsiveLayout({
    super.key,
    required this.mobile,
    required this.tablet,
  });

  final Widget mobile;
  final Widget tablet;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth >= AppDimensions.largeWidth) {
          return tablet;
        }
        return mobile;
      },
    );
  }
}
