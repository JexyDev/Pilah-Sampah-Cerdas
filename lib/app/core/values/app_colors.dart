import 'package:flutter/material.dart';

/// Palet warna resmi aplikasi — sesuai perombakan desain (Clean Design).
/// Primary color adalah HIJAU ORGANIK (#2E7D32).
/// Biru digunakan untuk sekunder/non-organik.
class AppColors {
  AppColors._();

  // --- Primary Blue (non-organik / sky blue accents) ---
  static const Color primaryBlue = Color(0xFF0284C7); // Clean Sky Blue
  static const Color primaryBlueDark = Color(0xFF0369A1); // Deep Sky Blue
  static const Color primaryBlueLight = Color(0xFFE0F2FE); // Very Light Sky Blue

  // --- Primary Green (Now clean light blue for main brand) ---
  static const Color primaryGreen = Color(0xFF0EA5E9); // Bright Sky Blue
  static const Color primaryGreenLight = Color(0xFFF0F9FF); // Soft white-blue
  static const Color organicColor = Color(0xFF10B981); // Green for organic

  // --- Non-Organic (orange/amber/yellow) ---
  static const Color nonOrganicColor = Color(0xFFF59E0B); // Yellow for non-organic
  static const Color nonOrganicBg = Color(0xFFFEF3C7); // Light yellow

  // --- Semantic ---
  static const Color dangerRed = Color(0xFFEF4444); // Modern tailwind red
  static const Color warningYellow = Color(0xFFF59E0B);
  static const Color warningOrange = Color(0xFFF97316);
  static const Color success = Color(0xFF10B981);
  static const Color successDark = Color(0xFF047857);

  // --- Background ---
  static const Color backgroundCanvas = Color(0xFFF8FAFC); // Slate 50
  static const Color cardBackground = Color(0xFFFFFFFF);

  // --- Text ---
  static const Color textPrimary = Color(0xFF0F172A); // Slate 900
  static const Color textSecondary = Color(0xFF475569); // Slate 600
  static const Color textHint = Color(0xFF94A3B8); // Slate 400
  static const Color textOnPrimary = Color(0xFFFFFFFF);
  static const Color textBlue = Color(0xFF0284C7);

  // --- Border & Divider ---
  static const Color border = Color(0xFFE2E8F0); // Slate 200
  static const Color divider = Color(0xFFF1F5F9); // Slate 100

  // --- Bin Status ---
  static const Color binSafe = Color(0xFF10B981);
  static const Color binWarning = Color(0xFFF59E0B);
  static const Color binCritical = Color(0xFFEF4444);

  // --- Offline Banner ---
  static const Color offlineBanner = Color(0xFFEF4444);
  static const Color offlineBannerText = Color(0xFFFFFFFF);

  // --- Status Badge ---
  static const Color statusSelesai = Color(0xFF10B981);
  static const Color statusSelesaiBg = Color(0xFFD1FAE5);
  static const Color statusProses = Color(0xFF0EA5E9);
  static const Color statusProsesBg = Color(0xFFE0F2FE);
  static const Color statusTervalidasi = Color(0xFF10B981);
  static const Color statusTervalidasiBg = Color(0xFFD1FAE5);
}
