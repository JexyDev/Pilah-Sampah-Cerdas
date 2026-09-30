import 'package:dio/dio.dart';

class NetworkExceptionHelper {
  NetworkExceptionHelper._();

  /// Mengubah DioException / Exception umum menjadi pesan Bahasa Indonesia yang informatif.
  static String getErrorMessage(dynamic error) {
    if (error is DioException) {
      switch (error.type) {
        case DioExceptionType.connectionTimeout:
          return 'Gagal terhubung ke server (waktu koneksi habis). Server mungkin sedang offline atau mengalami gangguan.';
        case DioExceptionType.sendTimeout:
          return 'Pengiriman data ke server timeout. Harap periksa jaringan internet Anda atau coba sesaat lagi.';
        case DioExceptionType.receiveTimeout:
          return 'Server tidak merespons (waktu tunggu habis). Server sedang sibuk atau mengalami gangguan.';

        case DioExceptionType.connectionError:
          return 'Gagal terhubung ke server. Server sedang offline/gangguan atau periksa koneksi internet Anda.';

        case DioExceptionType.badResponse:
          final statusCode = error.response?.statusCode;
          final responseData = error.response?.data;

          // Deteksi error 5xx (Server error / VPS down / Bad Gateway)
          if (statusCode == 502) {
            return 'Server sedang mengalami gangguan atau dalam proses pemeliharaan (502 Bad Gateway). Silakan coba beberapa saat lagi.';
          } else if (statusCode == 503) {
            return 'Layanan server sedang tidak tersedia atau dalam pemeliharaan (503 Service Unavailable). Harap coba beberapa saat lagi.';
          } else if (statusCode == 504) {
            return 'Server tidak merespons tepat waktu (504 Gateway Timeout). Harap coba beberapa saat lagi.';
          } else if (statusCode != null && statusCode >= 500) {
            // Periksa jika server mengembalikan pesan JSON spesifik, jika HTML gunakan pesan ramah
            if (responseData is Map<String, dynamic> && responseData['message'] != null) {
              final m = responseData['message'].toString().trim();
              if (m.isNotEmpty && !m.startsWith('<!DOCTYPE') && !m.startsWith('<html')) {
                return m;
              }
            }
            return 'Server backend sedang mengalami kendala (HTTP $statusCode). Harap coba beberapa saat lagi.';
          }

          // Periksa errorCode spesifik dari backend sebelum pesan generik
          if (responseData is Map<String, dynamic>) {
            final errorCode = responseData['error']?.toString() ?? '';
            switch (errorCode) {
              case 'BIN_RW_MISMATCH':
                final customMsg = responseData['message']?.toString();
                if (customMsg != null && customMsg.isNotEmpty && !RegExp(r'^[A-Z_]+$').hasMatch(customMsg)) {
                  return customMsg.replaceFirst(RegExp(r'^BIN_RW_MISMATCH:\s*', caseSensitive: false), '');
                }
                return 'Stiker tempat sampah dialokasikan khusus untuk RW lain, bukan untuk wilayah penugasan Anda.';
              case 'BIN_ALREADY_OWNED':
                final customMsg = responseData['message']?.toString();
                if (customMsg != null && customMsg.isNotEmpty && !RegExp(r'^[A-Z_]+$').hasMatch(customMsg)) {
                  return customMsg;
                }
                return 'Tempat sampah ini sudah dimiliki oleh warga lain dan tidak dapat diaktivasi ulang.';
              case 'STUDENT_PROFILE_INCOMPLETE':
                return 'Profil KKN Anda belum lengkap. Hubungi Admin atau DPL untuk melengkapi data NIM dan jurusan sebelum presensi.';
              case 'OUT_OF_COBLONG_BOUNDS':
                return 'Koordinat GPS Anda berada di luar wilayah KKN (Kecamatan Coblong). Pastikan GPS aktif dan Anda berada di lokasi yang benar.';
              case 'LOCATION_TELEPORTATION_DETECTED':
                return 'Perpindahan lokasi terlalu cepat terdeteksi. Pastikan GPS tidak dalam mode simulasi (Fake GPS).';
              case 'INVALID_COORDINATES':
                return 'Koordinat GPS tidak valid. Aktifkan GPS dan coba lagi.';
              default:
                // Fallback ke pesan dari backend jika bukan kode yang dikenal
                if (responseData['message'] != null) {
                  final msg = responseData['message'].toString().trim();
                  if (msg == 'BIN_RW_MISMATCH') {
                    return 'Stiker tempat sampah dialokasikan khusus untuk RW lain, bukan untuk wilayah penugasan Anda.';
                  }
                  if (RegExp(r'^[A-Z_]+$').hasMatch(msg)) {
                    return 'Terjadi kesalahan tidak terduga. Silakan coba lagi.';
                  }
                  return msg.replaceFirst(RegExp(r'^BIN_RW_MISMATCH:\s*', caseSensitive: false), '');
                }
            }
          }

          if (statusCode == 400) {
            return 'Permintaan tidak valid. Harap periksa data yang Anda masukkan.';
          } else if (statusCode == 401) {
            return 'Sesi Anda telah berakhir. Silakan masuk kembali.';
          } else if (statusCode == 403) {
            return 'Anda tidak memiliki hak akses untuk tindakan ini.';
          } else if (statusCode == 404) {
            return 'Data atau layanan tidak ditemukan di server.';
          }
          return statusCode != null
              ? 'Terjadi kendala pada respon server ($statusCode).'
              : 'Terjadi kendala pada respon server.';

        case DioExceptionType.cancel:
          return 'Permintaan dibatalkan.';

        case DioExceptionType.unknown:
        default:
          final raw = '${error.error} ${error.message}';
          if (raw.contains('Connection refused') ||
              raw.contains('Failed host lookup')) {
            return 'Gagal terhubung ke server. Server sedang offline atau dalam pemeliharaan.';
          }
          if (raw.contains('SocketException')) {
            return 'Gagal terhubung ke server. Periksa jaringan internet Anda atau server sedang tidak aktif.';
          }
          return 'Gagal terhubung ke server atau terjadi masalah jaringan.';
      }
    }
    if (error is Exception) {
      final str = error.toString();
      if (str.contains('Connection refused') ||
          str.contains('Failed host lookup')) {
        return 'Gagal terhubung ke server. Server sedang offline atau dalam pemeliharaan.';
      }
      if (str.contains('SocketException')) {
        return 'Gagal terhubung ke server. Periksa jaringan internet Anda atau server sedang tidak aktif.';
      }
      if (str.contains('TimeoutException')) {
        final msgMatch = RegExp(r'TimeoutException: (.+)').firstMatch(str);
        final customMsg = msgMatch?.group(1)?.trim();
        if (customMsg != null &&
            customMsg.isNotEmpty &&
            !customMsg.startsWith('Future not completed')) {
          return customMsg;
        }
        return 'GPS atau koneksi ke server tidak merespons. Periksa koneksi internet & sinyal GPS, lalu coba lagi.';
      }
      if (str.contains('FormatException')) {
        return 'Format data dari server tidak valid.';
      }
      if (str.startsWith('Exception: ')) {
        return str.substring(11);
      }
      return str;
    }
    return 'Terjadi kesalahan sistem. Harap coba beberapa saat lagi.';
  }
}
