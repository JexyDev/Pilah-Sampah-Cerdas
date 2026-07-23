/**
 * Project: Pilah Sampah Cerdas
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import 'package:dio/dio.dart';

/// Exception jaringan aplikasi dengan pesan bahasa Indonesia.
/// Digunakan oleh semua repository untuk konsistensi pesan error di UI.
class AppNetworkException implements Exception {
  const AppNetworkException(this.message);
  final String message;

  @override
  String toString() => message;
}

/// Pemetaan DioException → pesan error bahasa Indonesia yang ramah user.
///
/// Digunakan di layer Repository untuk menerjemahkan error jaringan
/// ke pesan yang bisa langsung ditampilkan di UI.
String mapDioExceptionToMessage(DioException e) {
  switch (e.type) {
    case DioExceptionType.connectionTimeout:
      return 'Koneksi ke server terlalu lama (timeout). Coba lagi.';
    case DioExceptionType.sendTimeout:
      return 'Pengiriman data ke server terlalu lama. Coba lagi.';
    case DioExceptionType.receiveTimeout:
      return 'Server tidak merespons, coba lagi nanti.';
    case DioExceptionType.connectionError:
      return 'Koneksi terputus, periksa internet Anda.';
    case DioExceptionType.cancel:
      return 'Permintaan dibatalkan.';
    case DioExceptionType.badResponse:
      // Coba ambil pesan dari backend
      final data = e.response?.data;
      if (data is Map<String, dynamic>) {
        final msg = data['message']?.toString();
        if (msg != null && msg.isNotEmpty) return msg;
      }
      final status = e.response?.statusCode ?? 0;
      if (status == 403) return 'Anda tidak memiliki izin untuk akses ini.';
      if (status == 404) return 'Data tidak ditemukan di server.';
      if (status >= 500) return 'Server sedang bermasalah, coba lagi nanti.';
      return 'Terjadi kesalahan (kode: $status).';
    default:
      return 'Terjadi kesalahan jaringan. Periksa koneksi internet Anda.';
  }
}
