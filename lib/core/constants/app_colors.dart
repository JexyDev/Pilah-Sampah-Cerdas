import 'package:flutter/material.dart';

/// Palet warna resmi aplikasi — sesuai desain stitch_ui.
/// Primary color adalah BIRU (#0056A4), bukan hijau.
/// Hijau digunakan untuk organik dan aksen sukses.
class AppColors {
  AppColors._();

  // --- Primary Blue (dominan UI) ---
  static const Color primaryBlue = Color(0xFF0056A4);
  static const Color primaryBlueDark = Color(0xFF003D75);
  static const Color primaryBlueLight = Color(0xFF1A73C8);

  // --- Primary Green (organik, sukses, FAB) ---
  static const Color primaryGreen = Color(0xFF2E7D32);
  static const Color primaryGreenLight = Color(0xFF4CAF50);
  static const Color organicColor = Color(0xFF4CAF50);

  // --- Non-Organic (orange/amber) ---
  static const Color nonOrganicColor = Color(0xFFF59E0B);
  static const Color nonOrganicBg = Color(0xFFFFF8E1);

  // --- Semantic ---
  static const Color dangerRed = Color(0xFFEF4444);
  static const Color warningYellow = Color(0xFFF59E0B);
  static const Color warningOrange = Color(0xFFFF6B35);
  static const Color success = Color(0xFF4CAF50);
  static const Color successDark = Color(0xFF2E7D32);

  // --- Background ---
  static const Color backgroundCanvas = Color(0xFFF5F7FA);
  static const Color cardBackground = Color(0xFFFFFFFF);

  // --- Text ---
  static const Color textPrimary = Color(0xFF1A1A2E);
  static const Color textSecondary = Color(0xFF6B7280);
  static const Color textHint = Color(0xFF9CA3AF);
  static const Color textOnPrimary = Color(0xFFFFFFFF);
  static const Color textBlue = Color(0xFF0056A4);

  // --- Border & Divider ---
  static const Color border = Color(0xFFE5E7EB);
  static const Color divider = Color(0xFFF3F4F6);

  // --- Bin Status ---
  static const Color binSafe = Color(0xFF4CAF50);
  static const Color binWarning = Color(0xFFF59E0B);
  static const Color binCritical = Color(0xFFEF4444);

  // --- Offline Banner ---
  static const Color offlineBanner = Color(0xFFEF4444);
  static const Color offlineBannerText = Color(0xFFFFFFFF);

  // --- Status Badge ---
  static const Color statusSelesai = Color(0xFF4CAF50);
  static const Color statusSelesaiBg = Color(0xFFE8F5E9);
  static const Color statusProses = Color(0xFFF59E0B);
  static const Color statusProsesBg = Color(0xFFFFF8E1);
  static const Color statusTervalidasi = Color(0xFF4CAF50);
  static const Color statusTervalidasiBg = Color(0xFFE8F5E9);
}
