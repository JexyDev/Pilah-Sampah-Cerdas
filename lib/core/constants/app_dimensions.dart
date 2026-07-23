/**
 * Project: Pilah Sampah Cerdas
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

/// Dimensi dan spacing standar aplikasi.
/// Mendukung responsif sesuai ui_ux_flow.md §5.
class AppDimensions {
  AppDimensions._();

  // --- Spacing ---
  static const double xs = 4.0;
  static const double sm = 8.0;
  static const double md = 16.0;
  static const double lg = 24.0;
  static const double xl = 32.0;
  static const double xxl = 48.0;

  // --- Border Radius ---
  static const double radiusSm = 8.0;
  static const double radiusMd = 12.0;
  static const double radiusLg = 16.0;
  static const double radiusXl = 24.0;
  static const double radiusFull = 100.0;

  // --- Icon Size ---
  static const double iconSm = 16.0;
  static const double iconMd = 24.0;
  static const double iconLg = 32.0;
  static const double iconXl = 48.0;
  static const double iconXxl = 80.0;

  // --- Button ---
  static const double buttonHeight = 52.0;
  static const double buttonHeightSm = 40.0;

  // --- Card ---
  static const double cardElevation = 2.0;
  static const double cardPadding = 16.0;

  // --- Bottom Nav ---
  static const double bottomNavHeight = 64.0;

  // --- AppBar ---
  static const double appBarHeight = 56.0;

  // --- Breakpoints Flutter (ui_ux_flow.md §5.2) ---
  static const double compactWidth = 360.0;
  static const double mediumWidth = 480.0;
  static const double largeWidth = 600.0;

  // --- Offline Banner ---
  static const double offlineBannerHeight = 40.0;
}
