/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

/// Konfigurasi aplikasi terpusat.
/// Seluruh konstanta environment dan konfigurasi global didefinisikan di sini.
class AppConfig {
  AppConfig._();

  // --- API Base URL ---
  // ⚠️  GANTI INI saat pakai HP fisik:
  //     1. Jalankan `ipconfig` di terminal laptop → cari IPv4 Address
  //     2. Isi _devServerIp dengan IP tersebut, contoh: '192.168.1.10'
  //     3. Pastikan HP dan laptop terhubung ke WiFi yang sama
  //
  // Emulator Android : 10.0.2.2  → otomatis (tidak perlu diubah)
  // iOS Simulator    : 127.0.0.1 → otomatis (tidak perlu diubah)
  // HP fisik Android : isi _devServerIp dengan IP laptop
  // HP fisik iOS     : isi _devServerIp dengan IP laptop
  static const String _devServerIp = '192.168.110.216'; // IP laptop lokal/backend utama

  static const int _port = 3000;

  static String get apiBaseUrl {
    if (kIsWeb) {
      final baseUri = Uri.base;
      if (baseUri.host.contains('ngrok') || baseUri.host.contains('tunnel')) {
        return '${baseUri.scheme}://${baseUri.host}/api/v1';
      }
      final host = baseUri.host.isEmpty ? 'localhost' : baseUri.host;
      return 'http://$host:$_port/api/v1';
    }

    // Jika _devServerIp diisi, pakai itu (HP fisik / Ngrok)
    if (_devServerIp.isNotEmpty) {
      if (_devServerIp.startsWith('http://') || _devServerIp.startsWith('https://')) {
        return '$_devServerIp/api/v1';
      }
      return 'http://$_devServerIp:$_port/api/v1';
    }

    try {
      // Emulator Android → 10.0.2.2 adalah alias localhost host machine
      if (Platform.isAndroid) return 'http://10.0.2.2:$_port/api/v1';
      // iOS Simulator
      if (Platform.isIOS) return 'http://127.0.0.1:$_port/api/v1';
    } catch (_) {}

    return 'http://127.0.0.1:$_port/api/v1';
  }

  static const String appName = 'Pilah Sampah Cerdas';

  // --- Geofencing (FR-02) ---
  static const int geofenceRadiusMeters = 10;

  // --- AI Config (FR-01) ---
  static const int aiTimeoutMs = 2000;
  static const int aiDailyLimit = 50;

  // --- Upload ---
  static const int maxUploadSizeMb = 1;

  // --- Token ---
  static const String accessTokenKey = 'access_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userDataKey = 'user_data';
  static const String householdIdKey = 'household_id';

  // --- Bin Capacity (FR-02) ---
  static const double binMaxCapacityLiters = 25.0;
  static const double binCriticalThresholdPercent = 0.90;

  // --- Point Conversion (FR-03) ---
  static const double organicDensityKgPerLiter = 0.4;
  static const double nonOrganicDensityKgPerLiter = 0.2;
  static const int pointsPerKg = 100;
}
