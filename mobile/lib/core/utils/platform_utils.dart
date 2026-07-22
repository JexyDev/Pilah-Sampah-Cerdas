/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import 'package:flutter/foundation.dart';

/// Utilitas deteksi platform untuk conditional feature rendering.
///
/// Digunakan untuk membedakan perilaku:
/// - Mobile (Android/iOS): orientasi portrait, status bar, QR scanner native
/// - Desktop (Windows/macOS/Linux): layout landscape, window resize, no QR
/// - Web: browser-based layout, terbatas akses hardware
class PlatformUtils {
  PlatformUtils._();

  /// True jika berjalan di Android atau iOS.
  static bool get isMobile =>
      defaultTargetPlatform == TargetPlatform.android ||
      defaultTargetPlatform == TargetPlatform.iOS;

  /// True jika berjalan di Windows, macOS, atau Linux.
  static bool get isDesktop =>
      defaultTargetPlatform == TargetPlatform.windows ||
      defaultTargetPlatform == TargetPlatform.macOS ||
      defaultTargetPlatform == TargetPlatform.linux;

  /// True jika berjalan di browser (kIsWeb override segalanya di Flutter Web).
  static bool get isWeb => kIsWeb;

  /// True jika platform mendukung QR scanner hardware (mobile_scanner).
  /// mobile_scanner hanya support Android & iOS native.
  /// Di Web support terbatas (kamera browser), desktop tidak support.
  static bool get supportsNativeQrScanner => !kIsWeb && isMobile;

  /// True jika platform mendukung GPS hardware (geolocator).
  /// Semua platform support, tapi akurasi berbeda.
  static bool get supportsGps => true;

  /// True jika platform mendukung camera/image_picker.
  /// Linux tidak support image_picker.
  static bool get supportsCamera =>
      !kIsWeb ? defaultTargetPlatform != TargetPlatform.linux : true;

  /// True jika platform mendukung Firebase Messaging.
  /// Windows & Linux tidak support FCM.
  static bool get supportsFcm =>
      kIsWeb ||
      defaultTargetPlatform == TargetPlatform.android ||
      defaultTargetPlatform == TargetPlatform.iOS ||
      defaultTargetPlatform == TargetPlatform.macOS;

  /// Nama platform sebagai string untuk display/debugging.
  static String get platformName {
    if (kIsWeb) return 'Web';
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return 'Android';
      case TargetPlatform.iOS:
        return 'iOS';
      case TargetPlatform.windows:
        return 'Windows';
      case TargetPlatform.macOS:
        return 'macOS';
      case TargetPlatform.linux:
        return 'Linux';
      default:
        return 'Unknown';
    }
  }
}
