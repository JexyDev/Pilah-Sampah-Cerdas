import 'package:flutter/material.dart';

/// Palet warna resmi aplikasi — sesuai perombakan desain (Clean Design).
/// Primary color adalah HIJAU ORGANIK (#2E7D32).
/// Biru digunakan untuk sekunder/non-organik.
class AppColors {
  AppColors._();

  // --- Primary Blue (non-organik) ---
  static const Color primaryBlue = Color(0xFF006397);
  static const Color primaryBlueDark = Color(0xFF00476E);
  static const Color primaryBlueLight = Color(0xFF5CB8FD);

  // --- Primary Green (organik, sukses, FAB) ---
  static const Color primaryGreen = Color(0xFF006D37);
  static const Color primaryGreenLight = Color(0xFF27AE60);
  static const Color organicColor = Color(0xFF006D37);

  // --- Non-Organic (orange/amber) ---
  static const Color nonOrganicColor = Color(0xFF006397);
  static const Color nonOrganicBg = Color(0xFFECEEF1);

  // --- Semantic ---
  static const Color dangerRed = Color(0xFFBA1A1A);
  static const Color warningYellow = Color(0xFFF59E0B);
  static const Color warningOrange = Color(0xFFFF6B35);
  static const Color success = Color(0xFF27AE60);
  static const Color successDark = Color(0xFF006D37);

  // --- Background ---
  static const Color backgroundCanvas = Color(0xFFF7F9FC);
  static const Color cardBackground = Color(0xFFFFFFFF);

  // --- Text ---
  static const Color textPrimary = Color(0xFF191C1E);
  static const Color textSecondary = Color(0xFF3D4A3F);
  static const Color textHint = Color(0xFF9CA3AF);
  static const Color textOnPrimary = Color(0xFFFFFFFF);
  static const Color textBlue = Color(0xFF006397);

  // --- Border & Divider ---
  static const Color border = Color(0xFFBCCABC);
  static const Color divider = Color(0xFFECEEF1);

  // --- Bin Status ---
  static const Color binSafe = Color(0xFF27AE60);
  static const Color binWarning = Color(0xFFF59E0B);
  static const Color binCritical = Color(0xFFBA1A1A);

  // --- Offline Banner ---
  static const Color offlineBanner = Color(0xFFBA1A1A);
  static const Color offlineBannerText = Color(0xFFFFFFFF);

  // --- Status Badge ---
  static const Color statusSelesai = Color(0xFF27AE60);
  static const Color statusSelesaiBg = Color(0xFFECEEF1);
  static const Color statusProses = Color(0xFF006397);
  static const Color statusProsesBg = Color(0xFFECEEF1);
  static const Color statusTervalidasi = Color(0xFF27AE60);
  static const Color statusTervalidasiBg = Color(0xFFECEEF1);
}
